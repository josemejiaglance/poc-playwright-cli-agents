#!/usr/bin/env node
/**
 * Log in the agent session using GLANCE_AGENT_USER / GLANCE_AGENT_PASSWORD.
 */
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const config = process.env.PLAYWRIGHT_CLI_CONFIG || '.playwright/cli.config.json';

const user = process.env.GLANCE_AGENT_USER;
const password = process.env.GLANCE_AGENT_PASSWORD;
if (!user || !password) {
  console.error('GLANCE_AGENT_USER and GLANCE_AGENT_PASSWORD are required');
  process.exit(1);
}

const loginUrl =
  process.env.COBROWSE_AGENT_LOGIN_URL ||
  'https://www.myglance.net/login/default.aspx';

const code = `async page => {
  await page.goto(${JSON.stringify(loginUrl)}, { waitUntil: 'domcontentloaded' });
  const glanceField = page.getByRole('textbox', { name: /Glance Address/i });
  const passwordField = page.getByRole('textbox', { name: /Password/i });
  if (!(await glanceField.isVisible().catch(() => false))) {
    const url = page.url();
    if (/AccountSummary|agentjoin/i.test(url)) {
      return { pass: true, url, alreadyLoggedIn: true };
    }
    return { pass: false, error: 'Login form not found', url };
  }
  await glanceField.fill(${JSON.stringify(user)});
  await passwordField.fill(${JSON.stringify(password)});
  await page.getByRole('button', { name: /Log In/i }).click();
  try {
    await page.waitForURL(/AccountSummary|agentjoin|account/i, { timeout: 90000 });
  } catch (_) {}
  const url = page.url();
  const pass = /AccountSummary|agentjoin/i.test(url) && !url.includes('login/default');
  return { pass, url };
}`;

const escaped = code.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const cmd = `npx playwright-cli --config "${config}" -s=agent run-code "${escaped}"`;

let out;
try {
  out = execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
} catch (e) {
  console.error(e.stdout?.toString?.() || e.stderr?.toString?.() || e.message);
  process.exit(1);
}

console.log(out);
const match = out.match(/### Result\n([\s\S]*?)(?:\n### |$)/);
if (!match) {
  console.error('No ### Result block in CLI output');
  process.exit(1);
}

const result = JSON.parse(match[1].trim());
if (!result.pass) {
  console.error('Agent login failed:', JSON.stringify(result));
  process.exit(1);
}

console.log('Agent login succeeded.');
