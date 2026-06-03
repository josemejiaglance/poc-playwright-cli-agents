# Co-browse POC runbook

Dual-browser setup for MyGlance co-browse using [@playwright/cli](https://playwright.dev/docs/getting-started-cli) and Cursor.

## Prerequisites

- Node.js 18+
- `npm install` in this repo
- Browsers: `npm run cli:install-browser`
- Skills (Cursor/agents): `npm run cli:skills` → `.agents/skills/playwright-cli`

## Quick start

```bash
npm install
npm run cli:install-browser
npm run sessions:open
```

Two headed browsers open:

1. **visitor** — `https://dev-cobrowse-test.myglance.net/cobrowse/test`
2. **agent** — `https://www.myglance.net/login/default.aspx`

## Manual login (agent)

1. In the **agent** browser window, sign in with your credentials.
2. Do not store passwords in this repo or in agent prompts.
3. Persistent profiles keep the session across separate `npx playwright-cli -s=agent ...` commands.

Verify after login:

```bash
npx playwright-cli -s=agent snapshot
npx playwright-cli -s=agent screenshot
```

## Driving sessions from the CLI

Always pass `-s=visitor` or `-s=agent`:

```bash
npx playwright-cli -s=visitor snapshot
npx playwright-cli -s=visitor click e3
npx playwright-cli -s=agent goto "https://www.myglance.net/..."
```

## Monitoring

```bash
npm run sessions:show
```

Opens the Playwright dashboard with live previews for all sessions.

## Cleanup

```bash
npm run sessions:close
```

Force-kill stale processes if needed:

```bash
npx playwright-cli kill-all
```

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| Slow staging pages | Timeouts are raised in `.playwright/cli.config.json` (90s navigation) |
| Stale element refs | Run `snapshot` again after any navigation |
| Wrong browser / session | Check `npx playwright-cli list`; use exact `-s=visitor` or `-s=agent` |
| Lost login | Re-open with `npm run sessions:open` and log in again in agent window |

## Agent viewer header (post-join E2E)

After agent join, validate header controls (Add Guest, Share Screen, Share Document, Agent Video, Visitor Information):

```bash
npm run test:agent-viewer-header
npm run test:header:video
```

See [AGENT_VIEWER_HEADER.md](./AGENT_VIEWER_HEADER.md).

## Validation checklist

- [ ] `npm install` && `npm run cli:help` succeed
- [ ] `npm run sessions:open` launches two headed browsers on the correct URLs
- [ ] Manual login on agent session; `npx playwright-cli -s=agent snapshot` reflects authenticated UI
- [ ] Visitor session accepts `npx playwright-cli -s=visitor snapshot` and click by ref
- [ ] `npm run sessions:show` lists both sessions
- [ ] `npm run sessions:close` cleans up
