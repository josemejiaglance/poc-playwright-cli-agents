#!/usr/bin/env node
/**
 * Extract 4-digit cobrowse session code from the visitor session.
 * Prints code to stdout; exits 1 on failure.
 */
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const config = process.env.PLAYWRIGHT_CLI_CONFIG || '.playwright/cli.config.json';

const code = `async page => {
  const dialog = page.getByRole('alertdialog', { name: 'Cobrowse' }).or(page.getByRole('dialog'));
  const visible = await dialog.first().isVisible().catch(() => false);
  const text = visible ? await dialog.first().innerText() : '';
  const codeMatch = text.match(/\\b(\\d{4})\\b/);
  return {
    pass: !!codeMatch,
    sessionCode: codeMatch ? codeMatch[1] : null,
    snippet: text.replace(/\\s+/g, ' ').slice(0, 120),
  };
}`;

const escaped = code.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const cmd = `npx playwright-cli -s=visitor run-code "${escaped}"`;

let out;
try {
  out = execSync(cmd, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, PLAYWRIGHT_CLI_CONFIG: config },
  });
} catch (e) {
  console.error(e.stderr?.toString?.() || e.message);
  process.exit(1);
}

const match = out.match(/### Result\n([\s\S]*?)(?:\n### |$)/);
if (!match) {
  console.error('No ### Result block in CLI output');
  process.exit(1);
}

const result = JSON.parse(match[1].trim());
if (!result.pass || !result.sessionCode) {
  console.error('Session code not found:', JSON.stringify(result));
  process.exit(1);
}

process.stdout.write(result.sessionCode);
