#!/usr/bin/env node
/**
 * Run video assertions, highlight targets on live sessions, capture screenshots,
 * and write a pass/fail summary under visual-assertions/.
 */
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatorMap } from './validators.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const OUT = join(ROOT, 'visual-assertions');
const CASE_ID = 'start-cobrowse-session-with-video';
const PLAYWRIGHT_CLI_CONFIG =
  process.env.PLAYWRIGHT_CLI_CONFIG || '.playwright/cli.config.json';

const VIDEO_ASSERTIONS = [
  {
    id: 'agent-video-button-visible',
    session: 'agent',
    validator: 'agent-video-button-visible',
    label: '1. Agent Video visible',
    color: '#3b82f6',
  },
  {
    id: 'agent-video-button-active',
    session: 'agent',
    validator: 'agent-video-button-active',
    label: '2. Agent Video active',
    color: '#22c55e',
  },
  {
    id: 'agent-floating-video-widget',
    session: 'agent',
    validator: 'agent-floating-video-widget',
    label: '3. Floating video widget',
    color: '#f97316',
  },
  {
    id: 'agent-video-streaming',
    session: 'agent',
    validator: 'agent-video-streaming',
    label: '4. Agent video streaming',
    color: '#a855f7',
  },
  {
    id: 'visitor-video-player-present',
    session: 'visitor',
    validator: 'visitor-video-player',
    label: '5. Visitor VideoPlayer',
    color: '#3b82f6',
  },
  {
    id: 'visitor-video-streaming',
    session: 'visitor',
    validator: 'visitor-video-streaming',
    label: '6. Visitor streaming',
    color: '#22c55e',
  },
];

function pcli(args, { stdio = 'pipe' } = {}) {
  return execSync(`npx playwright-cli ${args}`, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio,
    env: { ...process.env, PLAYWRIGHT_CLI_CONFIG },
  });
}

function sessionsOpen() {
  try {
    const out = pcli('list');
    return !/^\s*\(no browsers\)/m.test(out);
  } catch {
    return false;
  }
}

function runCode(session, code) {
  const escaped = code.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  try {
    const out = pcli(`-s=${session} run-code "${escaped}"`, { stdio: 'pipe' });
    const match = out.match(/### Result\n([\s\S]*?)(?:\n### |$)/);
    if (!match) return { pass: false, error: 'No result block in CLI output', raw: out };
    return JSON.parse(match[1].trim());
  } catch (e) {
    return { pass: false, error: e.message, stderr: e.stderr?.toString?.() };
  }
}

function screenshot(session, filename) {
  pcli(`-s=${session} screenshot --filename="${filename}"`, { stdio: 'inherit' });
}

const AGENT_HIGHLIGHT = `async page => {
  let count = 0;
  const btn = page.getByRole('button', { name: /Agent Video/i }).first();
  if (await btn.isVisible().catch(() => false)) {
    const active = await btn.evaluate((el) => el.classList.contains('active')).catch(() => false);
    await btn.evaluate(
      (el, { active }) => {
        const color = active ? '#22c55e' : '#3b82f6';
        const label = active ? '2. Agent Video active' : '1. Agent Video visible';
        el.dataset.glanceVisual = label;
        el.style.outline = \`3px solid \${color}\`;
        el.style.outlineOffset = '2px';
        el.style.boxShadow = \`0 0 0 6px \${color}59\`;
        const rect = el.getBoundingClientRect();
        const badge = document.createElement('div');
        badge.textContent = label;
        badge.style.cssText = [
          'position:fixed',
          'z-index:2147483647',
          \`background:\${color}\`,
          'color:#fff',
          'font:11px/1.3 system-ui,sans-serif',
          'padding:2px 6px',
          'border-radius:4px',
          'pointer-events:none',
          \`left:\${Math.max(4, rect.left)}px\`,
          \`top:\${Math.max(4, rect.top - 20)}px\`,
        ].join(';');
        document.body.appendChild(badge);
      },
      { active }
    );
    count++;
  }

  const pageFrame = page.frames().find((f) => f.name() === 'pageframe');
  if (pageFrame) {
    await pageFrame.evaluate(() => {
      const markInFrame = (el, color, label) => {
        el.dataset.glanceVisual = label;
        el.style.outline = \`3px solid \${color}\`;
        el.style.outlineOffset = '2px';
        el.style.boxShadow = \`0 0 0 6px \${color}59\`;
        const rect = el.getBoundingClientRect();
        const badge = document.createElement('div');
        badge.textContent = label;
        badge.style.cssText = [
          'position:fixed',
          'z-index:2147483647',
          \`background:\${color}\`,
          'color:#fff',
          'font:11px/1.3 system-ui,sans-serif',
          'padding:2px 6px',
          'border-radius:4px',
          'pointer-events:none',
          \`left:\${Math.max(4, rect.left)}px\`,
          \`top:\${Math.max(4, rect.top - 20)}px\`,
        ].join(';');
        document.body.appendChild(badge);
      };

      const dialog = [...document.querySelectorAll('[role="dialog"]')].find((el) =>
        /showing page/i.test(el.getAttribute('aria-label') || el.textContent || '')
      );
      if (dialog) markInFrame(dialog, '#f97316', '3. Floating video widget');

      const videoArea = [...document.querySelectorAll('[role="region"]')].find((el) =>
        /video area/i.test(el.getAttribute('aria-label') || '')
      );
      if (videoArea) markInFrame(videoArea, '#a855f7', '4. Agent video streaming');
    });
    count += 2;
  }

  return { pass: count > 0, highlighted: count };
}`;

const VISITOR_HIGHLIGHT = `async page => {
  const cobrowseBtn = page.getByRole('button', { name: 'Cobrowse' }).first();
  if (await cobrowseBtn.isVisible().catch(() => false)) {
    await cobrowseBtn.click().catch(() => {});
    await page.waitForTimeout(800);
  }

  const dialog = page.getByRole('dialog').first();
  const vp = page.frames().find((f) => /VideoPlayer|videoplayer/i.test(f.url()));
  let streaming = false;
  if (vp) {
    streaming = !(await vp
      .getByText(/^\\s*waiting\\s*$/i)
      .first()
      .isVisible()
      .catch(() => false));
  }

  if (await dialog.isVisible().catch(() => false)) {
    await dialog.evaluate((el, { streaming }) => {
      el.dataset.glanceVisual = 'visitor-video';
      const color = streaming ? '#22c55e' : '#3b82f6';
      const label = streaming ? '6. Visitor streaming' : '5. Visitor VideoPlayer';
      el.style.outline = \`3px solid \${color}\`;
      el.style.outlineOffset = '2px';
      el.style.boxShadow = \`0 0 0 6px \${color}59\`;
      const rect = el.getBoundingClientRect();
      const badge = document.createElement('div');
      badge.textContent = label;
      badge.dataset.glanceVisualBadge = label;
      badge.style.cssText = [
        'position:fixed',
        'z-index:2147483647',
        \`background:\${color}\`,
        'color:#fff',
        'font:11px/1.3 system-ui,sans-serif',
        'padding:2px 6px',
        'border-radius:4px',
        'pointer-events:none',
        \`left:\${Math.max(4, rect.left)}px\`,
        \`top:\${Math.max(4, rect.top - 20)}px\`,
      ].join(';');
      document.body.appendChild(badge);
    }, { streaming });
  }

  return { pass: true, streaming, hasVideoPlayer: !!vp };
}`;

function writeReport(results) {
  const passed = results.filter((r) => r.pass).length;
  const lines = [
    '# Video assertion visualization',
    '',
    `Case: \`${CASE_ID}\``,
    `Result: **${passed}/${results.length} passed**`,
    '',
    '| # | Assertion | Session | Result |',
    '|---|-----------|---------|--------|',
  ];

  for (const r of results) {
    lines.push(
      `| ${r.label.split('.')[0]} | \`${r.id}\` | ${r.session} | ${r.pass ? 'PASS' : 'FAIL'} |`
    );
  }

  lines.push(
    '',
    '## Screenshots',
    '',
    '- `agent-viewer-assertions-highlighted.png` — agent-side checks (1–4)',
    '- `visitor-video-assertions-highlighted.png` — visitor-side checks (5–6)',
    '',
    '## Legend',
    '',
    '| Color | Assertion |',
    '|-------|-----------|',
    '| Blue `#3b82f6` | Agent Video visible / Visitor VideoPlayer present |',
    '| Green `#22c55e` | Agent Video active / Visitor streaming |',
    '| Orange `#f97316` | Mirrored floating video widget |',
    '| Purple `#a855f7` | Agent video streaming region |',
    '',
    'Regenerate: `npm run test:visualize:video-assertions`',
    'Live dashboard: `npm run sessions:show`',
    ''
  );

  writeFileSync(join(OUT, 'report.md'), lines.join('\n'));
  writeFileSync(
    join(OUT, 'report.json'),
    JSON.stringify({ caseId: CASE_ID, passed, total: results.length, results }, null, 2)
  );
}

async function main() {
  if (!sessionsOpen()) {
    console.error('\nNo browser sessions open.\n');
    console.error('Start a live cobrowse session first:');
    console.error('  npm run sessions:open');
    console.error('  # log in on agent, start cobrowse, join session');
    console.error('  npm run test:prepare-post-join');
    console.error('  npm run test:visualize:video-assertions\n');
    process.exit(1);
  }

  mkdirSync(OUT, { recursive: true });

  console.log('\n▶ Visualizing video assertions\n');
  console.log('  Preparing post-join (video)…');
  try {
    execSync('npm run test:prepare-post-join', { cwd: ROOT, stdio: 'inherit' });
  } catch {
    console.error('  Post-join preparation failed.');
    process.exit(1);
  }

  try {
    pcli('-s=agent tab-select 1', { stdio: 'ignore' });
  } catch {
    /* viewer tab may already be selected */
  }

  const results = [];
  for (const assertion of VIDEO_ASSERTIONS) {
    process.stdout.write(`  • ${assertion.id} … `);
    const fn = validatorMap[assertion.validator];
    if (!fn) {
      console.log('SKIP (unknown validator)');
      results.push({ ...assertion, pass: false, error: 'unknown validator' });
      continue;
    }
    const result = runCode(assertion.session, fn);
    const pass = result.pass === true;
    console.log(pass ? 'PASS' : 'FAIL');
    if (!pass) console.log(`    ${JSON.stringify(result, null, 2)}`);
    results.push({ ...assertion, pass, result });
  }

  console.log('\n  Applying highlights…');
  runCode('agent', AGENT_HIGHLIGHT);
  runCode('visitor', VISITOR_HIGHLIGHT);

  console.log('  Capturing screenshots…');
  screenshot('agent', join(OUT, 'agent-viewer-assertions-highlighted.png'));
  screenshot('visitor', join(OUT, 'visitor-video-assertions-highlighted.png'));

  writeReport(results);

  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${results.length} assertions passed`);
  console.log(`\nSaved under ${OUT}/`);
  console.log('  agent-viewer-assertions-highlighted.png');
  console.log('  visitor-video-assertions-highlighted.png');
  console.log('  report.md');
  console.log('  report.json');
  console.log('\nLive dashboard: npm run sessions:show\n');

  process.exit(passed === results.length ? 0 : 1);
}

main();
