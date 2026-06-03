---
name: glance-cobrowse
description: >-
  Start and validate Glance cobrowse sessions using playwright-cli dual-browser
  POC (visitor + agent). Use when the user says start a cobrowse session,
  configure cobrowse settings, agent join, session code, MyGlance visitor/agent
  flows, or extend cobrowse test assertions.
allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(npm:*)
---

# Glance Cobrowse (playwright-cli POC)

## Terminology

| Term | Meaning |
|------|---------|
| **Start a cobrowse session** | Full workflow: visitor settings → Start Cobrowse → agent joins with code → validate viewer |
| **Visitor session** | `-s=visitor` — dev cobrowse test site |
| **Agent session** | `-s=agent` — myglance.net login / Agent Join / AgentView |
| **Session code** | 4-digit code shown on visitor after Start Cobrowse |

## Base test cases

**ID:** `start-cobrowse-session`

- Spec: [tests/cases/start-cobrowse-session.md](../../../tests/cases/start-cobrowse-session.md)
- Machine-readable: [tests/cases/start-cobrowse-session.json](../../../tests/cases/start-cobrowse-session.json)

**ID:** `start-cobrowse-session-with-video` (agent video + VideoPlayer assertions)

- Spec: [tests/cases/start-cobrowse-session-with-video.md](../../../tests/cases/start-cobrowse-session-with-video.md)
- Machine-readable: [tests/cases/start-cobrowse-session-with-video.json](../../../tests/cases/start-cobrowse-session-with-video.json)

Run assertions after a session is live:

```bash
npm run test:assert
```

## Quick workflow: Start a cobrowse session

```bash
npm run sessions:open
# Manual: log in on agent browser

npm run test:configure-visitor
npm run test:start-visitor-cobrowse
# Note session code from snapshot

npm run test:grant-media
npm run test:agent-join -- <CODE>
npm run test:prepare-post-join   # also runs automatically before test:assert

npm run test:assert                # ends session when done
npm run test:assert:video          # video case assertions (4 video checks)
npm run test:agent-viewer-header   # post-join header E2E; each test ends session
npm run test:end-session           # manual teardown
```

**Start cobrowse with video (full flow):**

```bash
npm run test:start-cobrowse-session-with-video -- <CODE>
```

## CI (GitHub Actions)

Unattended headless E2E on push — requires `GLANCE_AGENT_USER` and `GLANCE_AGENT_PASSWORD` secrets:

```bash
npm run test:ci:e2e:video
```

See [docs/CI.md](../../../docs/CI.md). Local dry-run: set `PLAYWRIGHT_CLI_CONFIG=.playwright/cli.config.ci.json`, `CI=1`, and agent env vars.

## Agent viewer header E2E

After join, run per-control or all: `npm run test:header:video`, `npm run test:agent-viewer-header`. See [docs/AGENT_VIEWER_HEADER.md](../../../docs/AGENT_VIEWER_HEADER.md).

## Visitor settings (critical order)

1. Open **Settings → Change** or go to `TestPageSettings`
2. **Fill** Group ID, Web server, CDN **before** selecting **Staging** (Staging postback fails if placeholders contain `<yourname>...`)
3. **Uncheck** "No CDN; specify loader script directly"
4. **Check** Staging, **re-fill** Group ID (Staging preset may overwrite)
5. **Save**, then **Start Cobrowse** on test home

Defaults: group `21552`, web `www.myglance.net`, CDN `cdn.myglance.net`.

## Agent join

- URL: `https://www.myglance.net/agentjoin/AgentJoin.aspx`
- Enter visitor session code → **Join Session**
- Viewer opens in **tab 1**: `AgentView.aspx?SessionKey=<code>&groupid=<group>`
- Select tab: `npx playwright-cli -s=agent tab-select 1`

## Camera / microphone

```bash
npm run test:grant-media
```

Native Chrome bars may still appear once in headed mode — user clicks **Allow**.

## Extending tests

1. Add validator in `tests/lib/validators.mjs` → `validatorMap`
2. Add assertion in `tests/cases/start-cobrowse-session.json`
3. Document in `tests/cases/start-cobrowse-session.md`

Use `--only <assertion-id>` on the assertion runner for partial runs.

## References

- [start-cobrowse-session.md](../../../tests/cases/start-cobrowse-session.md) — step-by-step procedure
- [COBROWSE_POC.md](../../../docs/COBROWSE_POC.md) — environment setup
- [.cursor/rules/playwright-cli-cobrowse.mdc](../../rules/playwright-cli-cobrowse.mdc) — session names and URLs
- [playwright-cli skill](../../../.agents/skills/playwright-cli/SKILL.md) — CLI command reference
