# Contributing

## Setup

```bash
git clone <repository-url>
cd poc-playwright-cli
npm install
npm run cli:install-browser
```

Optional: install agent skills for Cursor:

```bash
npm run cli:skills
```

## Local development

1. Open sessions: `npm run sessions:open`
2. Log in on the **agent** browser window
3. Run cobrowse flows — see [README.md](README.md) and [docs/COBROWSE_POC.md](docs/COBROWSE_POC.md)

## CI vs local

| | Local | CI |
|---|-------|-----|
| Config | `.playwright/cli.config.json` (headed) | `.playwright/cli.config.ci.json` (headless) |
| Agent auth | Manual or persistent profile | `GLANCE_AGENT_*` secrets |
| Full E2E | `npm run test:start-cobrowse-session-with-video -- <CODE>` | `npm run test:ci:e2e:video` |

See [docs/CI.md](docs/CI.md) for GitHub Actions setup.

## Adding assertions

1. Add validator in `tests/lib/validators.mjs`
2. Register in `tests/cases/*.json`
3. Document in the matching `tests/cases/*.md`

## What not to commit

- `.env` (secrets)
- `.playwright-cli/` artifacts
- `tests/.auth/` or any `*.auth-state.json`
- Passwords or storage state files
