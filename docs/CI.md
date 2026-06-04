# Continuous integration (GitHub Actions)

The repository runs the full **cobrowse with video** E2E on every `push` via [`.github/workflows/cobrowse-e2e.yml`](../.github/workflows/cobrowse-e2e.yml).

## What runs in CI

1. Install Node dependencies and Chromium (`npm ci`, `npm run cli:install-browser`)
2. Open headless visitor + agent sessions ([`scripts/open-sessions-ci.sh`](../scripts/open-sessions-ci.sh))
3. Log in agent with GitHub Secrets ([`scripts/ci-agent-login.sh`](../scripts/ci-agent-login.sh))
4. Configure visitor, start cobrowse, extract session code
5. Grant media, agent join, enable video, run video assertions
6. Tear down browsers

Entrypoint: `npm run test:ci:e2e:video`

## Required GitHub Secrets

Configure under **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `GLANCE_AGENT_USER` | Glance address / username (e.g. `yourname21552.glance.net`) |
| `GLANCE_AGENT_PASSWORD` | Agent account password |

Never commit credentials. Do not log secret values in workflow output.

## Local CI dry-run

Match the workflow locally (requires env vars):

```bash
export GLANCE_AGENT_USER="yourname21552.glance.net"
export GLANCE_AGENT_PASSWORD="your-password"
export PLAYWRIGHT_CLI_CONFIG=".playwright/cli.config.ci.json"
export CI=1

npm run test:ci:e2e:video
```

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `PLAYWRIGHT_CLI_CONFIG` | `.playwright/cli.config.json` | Playwright CLI config path |
| `CI` | unset | When `1`, enables automated session-code capture |
| `COBROWSE_GROUP_ID` | `21552` | Staging group for visitor settings |
| `COBROWSE_SKIP_END_SESSION` | unset | Set `1` to skip teardown after assertions |

CI uses [`.playwright/cli.config.ci.json`](../.playwright/cli.config.ci.json): headless Chromium with fake camera/microphone for video.

## Artifacts on failure

When the job fails, the workflow captures **visitor and agent screenshots** plus page snapshots before closing browsers, then uploads:

- `.playwright-cli/` — CLI snapshots, console logs, and `ci-failure/` PNGs
- `ci-artifacts/` — copy of failure PNGs (non-hidden, easy to download)

Download the **`playwright-cli-artifacts`** zip from the Actions run **Artifacts** tab (kept 7 days). Open the `.png` files for a visual of each session at failure time; open `*-snapshot.yml` for the DOM/accessibility tree.

## Troubleshooting

| Symptom | What to try |
|---------|-------------|
| Login fails | Verify secrets; check for MFA on the account (use storage-state fallback — see below) |
| `ERR_NO_NWAYVIDEO_SETTINGS` | Confirm group `21552` has n-way video on staging |
| Visitor video stuck on **Waiting** | Re-run locally with `CI=1`; staging may be slow — workflow timeout is 45m |
| Flaky join | Check artifact snapshots; network to `myglance.net` / `dev-cobrowse-test.myglance.net` |
| Headless vs local differences | Local dev uses headed [`.playwright/cli.config.json`](../.playwright/cli.config.json); CI uses headless + fake media |

### Storage-state fallback (MFA / login changes)

If password login is unavailable in CI:

1. Log in locally: `npm run sessions:open`, complete login manually.
2. Save state: `npx playwright-cli -s=agent state-save tests/.auth/agent.json` (do not commit).
3. Document a custom workflow step to `state-load` that file from a secret (base64-encoded JSON).

## Limiting workflow triggers

By default the workflow runs on **all branches** on `push`. To run only on `main`, edit `.github/workflows/cobrowse-e2e.yml`:

```yaml
on:
  push:
    branches: [main]
```
