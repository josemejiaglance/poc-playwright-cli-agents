# poc-playwright-cli

Proof of concept: integrate official [@playwright/cli](https://playwright.dev/docs/getting-started-cli) with **Cursor** for dual-browser MyGlance co-browse automation.

- **Visitor session** — co-browse test page on dev
- **Agent session** — MyGlance login (manual auth, persistent profile)

## Setup

```bash
npm install
npm run cli:install-browser
npm run cli:skills    # installs Playwright CLI skills for Cursor/agents
```

Skills install to [`.agents/skills/playwright-cli`](.agents/skills/playwright-cli) via `npm run cli:skills` (`playwright-cli install --skills agents`). Claude Code variant: `.claude/skills/playwright-cli`.

## Open co-browse sessions

```bash
npm run sessions:open
```

Log in manually in the **agent** browser. Then use the CLI or ask Cursor to drive either session.

```bash
npm run sessions:show    # dashboard
npm run sessions:list    # session names + URLs
npm run sessions:close   # cleanup
```

Full runbook: [docs/COBROWSE_POC.md](docs/COBROWSE_POC.md).

## Continuous integration

On every **push**, GitHub Actions runs the full cobrowse **with video** E2E (`npm run test:ci:e2e:video`).

1. Add repository secrets: `GLANCE_AGENT_USER`, `GLANCE_AGENT_PASSWORD`
2. See [docs/CI.md](docs/CI.md) for workflow details, local dry-run, and troubleshooting

```bash
# Local CI dry-run (same as the workflow)
export GLANCE_AGENT_USER="yourname21552.glance.net"
export GLANCE_AGENT_PASSWORD="your-password"
export PLAYWRIGHT_CLI_CONFIG=".playwright/cli.config.ci.json"
export CI=1
npm run test:ci:e2e:video
```

## Test cases

| Case | Spec | Run |
|------|------|-----|
| Start cobrowse | [start-cobrowse-session.md](tests/cases/start-cobrowse-session.md) | `npm run test:start-cobrowse-session -- <CODE>` |
| Start cobrowse **with video** | [start-cobrowse-session-with-video.md](tests/cases/start-cobrowse-session-with-video.md) | `npm run test:start-cobrowse-session-with-video -- <CODE>` |

Glance workflow skill: [.cursor/skills/glance-cobrowse/SKILL.md](.cursor/skills/glance-cobrowse/SKILL.md)

```bash
npm run sessions:open
# log in on agent browser

npm run test:configure-visitor
npm run test:start-visitor-cobrowse
npm run test:grant-media
npm run test:agent-join -- 0294
npm run test:assert              # post-join assertions (base case)
npm run test:assert:video        # video assertions (4 checks)
npm run test:assert:video:all    # pre-join + post-join + video
npm run test:assert:pre-join     # visitor code visible
```

## Cursor

Project rule: [.cursor/rules/playwright-cli-cobrowse.mdc](.cursor/rules/playwright-cli-cobrowse.mdc) (always on in this repo).

Glance workflow skill: [.cursor/skills/glance-cobrowse/SKILL.md](.cursor/skills/glance-cobrowse/SKILL.md) — **Start a cobrowse session** and extend assertions.

Upstream command reference: run `npm run cli:skills` and use the installed Playwright skill.

## Example prompts for Cursor

Copy into chat after `npm run sessions:open`:

1. *Open both co-browse sessions if needed, then run `npx playwright-cli -s=visitor snapshot` and report the page title and URL.*

2. *After I log in on the agent session, take `screenshot` on both `-s=visitor` and `-s=agent` and summarize what each page shows.*

3. *Run `npm run sessions:show` (or `npx playwright-cli list`) and report active session names and URLs.*

## Configuration

Defaults live in [.playwright/cli.config.json](.playwright/cli.config.json): headed browser, longer timeouts for staging, artifacts under `.playwright-cli/`.

Optional env: copy [.env.example](.env.example) to `.env` if you want a default `PLAYWRIGHT_CLI_SESSION`.

## Scripts

| Script | Command |
|--------|---------|
| `cli:help` | `playwright-cli --help` |
| `cli:skills` | `playwright-cli install --skills` |
| `cli:install-browser` | `playwright-cli install-browser` |
| `sessions:open` | Visitor + agent browsers |
| `sessions:show` | Playwright dashboard |
| `sessions:close` | Close all sessions |
| `test:ci:e2e:video` | Full headless E2E for CI (login + video assertions) |
