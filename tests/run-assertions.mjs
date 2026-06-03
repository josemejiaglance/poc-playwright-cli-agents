#!/usr/bin/env node
/**
 * Run base assertions from tests/cases/start-cobrowse-session.json
 * Usage:
 *   node tests/run-assertions.mjs
 *   node tests/run-assertions.mjs --case start-cobrowse-session --session-key 0294
 *   node tests/run-assertions.mjs --case start-cobrowse-session-with-video --group video
 *   node tests/run-assertions.mjs --only agent-viewer-loaded,visitor-video-streaming
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatorMap } from './lib/validators.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PLAYWRIGHT_CLI_CONFIG =
  process.env.PLAYWRIGHT_CLI_CONFIG || '.playwright/cli.config.json';

function parseArgs(argv) {
  const opts = {
    caseId: 'start-cobrowse-session',
    sessionKey: null,
    only: null,
    group: 'postJoin',
  };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--case' && argv[i + 1]) opts.caseId = argv[++i];
    else if (argv[i] === '--session-key' && argv[i + 1]) opts.sessionKey = argv[++i];
    else if (argv[i] === '--only' && argv[i + 1])
      opts.only = argv[++i].split(',').map((s) => s.trim());
    else if (argv[i] === '--group' && argv[i + 1]) opts.group = argv[++i];
  }
  return opts;
}

function loadCase(caseId) {
  const path = join(__dirname, 'cases', `${caseId}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function resolveExpects(expects, defaults) {
  if (!expects) return {};
  const out = {};
  for (const [k, v] of Object.entries(expects)) {
    out[k] =
      typeof v === 'string' && v.startsWith('{{defaults.')
        ? defaults[v.slice('{{defaults.'.length, -2)]
        : v;
  }
  return out;
}

function runCode(session, code) {
  const escaped = code.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const cmd = `npx playwright-cli -s=${session} run-code "${escaped}"`;
  try {
    const out = execSync(cmd, {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, PLAYWRIGHT_CLI_CONFIG },
    });
    const match = out.match(/### Result\n([\s\S]*?)(?:\n### |$)/);
    if (!match) return { raw: out, pass: false, error: 'No result block in CLI output' };
    const parsed = JSON.parse(match[1].trim());
    return parsed;
  } catch (e) {
    return { pass: false, error: e.message, stderr: e.stderr?.toString?.() };
  }
}

function buildValidatorCall(validatorId, expects) {
  const fn = validatorMap[validatorId];
  if (!fn) throw new Error(`Unknown validator: ${validatorId}`);
  if (validatorId.startsWith('agent-viewer') && Object.keys(expects).length) {
    return `async page => (${fn})(page, ${JSON.stringify(expects)})`;
  }
  return fn;
}

async function main() {
  const opts = parseArgs(process.argv);
  const testCase = loadCase(opts.caseId);
  const results = [];
  let failed = 0;
  const needsVideoPrep =
    opts.group === 'postJoin' ||
    opts.group === 'video' ||
    opts.group === 'all' ||
    (opts.only &&
      testCase.assertions.some(
        (a) =>
          opts.only.includes(a.id) &&
          (a.group === 'video' ||
            /video|agent-video/.test(a.validator || a.id || ''))
      ));

  console.log(`\n▶ Running assertions: ${testCase.name} (${testCase.id})\n`);

  if (needsVideoPrep) {
    console.log('  Preparing post-join (video)…');
    try {
      execSync('npm run test:prepare-post-join', { cwd: ROOT, stdio: 'inherit' });
    } catch {
      console.error('  Post-join preparation failed.');
      process.exit(1);
    }
    console.log('');
  }

  const groupIds = testCase.assertionGroups?.[opts.group];

  for (const assertion of testCase.assertions) {
    if (opts.only && !opts.only.includes(assertion.id)) continue;
    if (!opts.only && groupIds && !groupIds.includes(assertion.id)) continue;

    const validatorId = assertion.validator;
    const expects = resolveExpects(assertion.expects, testCase.defaults);
    const session = assertion.session || 'visitor';
    const code = buildValidatorCall(validatorId, expects);

    process.stdout.write(`  • ${assertion.id} … `);
    const result = runCode(session, code);
    const pass = result.pass === true;
    if (!pass) failed++;
    console.log(pass ? 'PASS' : 'FAIL');
    if (!pass) console.log(`    ${JSON.stringify(result, null, 2)}`);
    results.push({ id: assertion.id, name: assertion.name, pass, result });
  }

  console.log(`\n${results.length - failed}/${results.length} passed\n`);
  if (opts.sessionKey) {
    console.log(`(session-key hint: ${opts.sessionKey} — used for manual cross-check only)\n`);
  }

  endCobrowseSession();
  process.exit(failed > 0 ? 1 : 0);
}

function endCobrowseSession() {
  if (process.env.COBROWSE_SKIP_END_SESSION === '1') return;
  try {
    console.log('Ending cobrowse session…');
    execSync('npm run test:end-session', { cwd: ROOT, stdio: 'inherit' });
  } catch (e) {
    console.error('Session teardown failed (non-fatal):', e.message);
  }
}

main();
