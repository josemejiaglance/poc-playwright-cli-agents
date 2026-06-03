# Agent viewer header — E2E validation

Full end-to-end checks for controls in **Glance Agent Viewer Controls** (`navigation "glance agent controls navigation"`), after a cobrowse session is live.

## Session teardown

Every header test and `npm run test:assert` **ends the cobrowse session** when finished (agent **End Session**, visitor **Leave session**). Disable with `COBROWSE_SKIP_END_SESSION=1`.

```bash
npm run test:end-session   # manual teardown
```

When running multiple header tests, restart cobrowse between each:

```bash
npm run test:start-visitor-cobrowse
npm run test:agent-join -- <CODE>
npm run test:header:video
# session ended — repeat start + join for the next test
```

## Prerequisites

```bash
npm run sessions:open
# Log in on agent browser

npm run test:configure-visitor
npm run test:start-visitor-cobrowse
# Note 4-digit session code

npm run test:grant-media
npm run test:agent-join -- <CODE>
```

Or run the orchestrator (expects the same live session):

```bash
npm run test:agent-viewer-header
npm run test:agent-viewer-header -- --only video,visitor-info
```

## Header controls (discovery)

Captured from agent viewer snapshot on `AgentView.aspx` (group `21552`):

| Control | Accessibility name | Script |
|---------|-------------------|--------|
| Add Guest | `Add Guest popup` | `npm run test:header:add-guest` |
| Share Screen | `Share Screen` | `npm run test:header:share-screen` |
| Share Document | `Share Document` | `npm run test:header:share-document` |
| Agent Video | `Agent Video` | `npm run test:header:video` |
| Visitor Information | `Visitor Information drop down` | `npm run test:header:visitor-info` |

Visitor URL bar (read-only): `Visitor's URL` — shows `dev-cobrowse-test` / `cobrowse/test/`.

## Per-feature flows

### Agent Video

1. Agent: **Agent Video** → optional Start/Share/OK dialogs → agent video iframe or region.
2. Visitor: expand **Cobrowse** widget → `VideoPlayer` iframe; body must not stay on **Waiting**.

Run-code: [`tests/lib/header/agent-video-agent.js`](../tests/lib/header/agent-video-agent.js), [`agent-video-visitor.js`](../tests/lib/header/agent-video-visitor.js).

Console signals: `video event sessionStarted`, `handleScreenshare` with `paused: false` (visitor).

### Visitor Information

1. Agent: **Visitor Information drop down** → menu/listbox with session/visitor context.
2. Optional: menu item opens new window (`context.waitForEvent('page')`).

Run-code: [`tests/lib/header/visitor-info-agent.js`](../tests/lib/header/visitor-info-agent.js).

### Share Screen

1. Agent: **Share Screen** → picker / Start → “sharing” or **Stop sharing** UI.
2. Visitor: permission **Allow** if prompted; dialog/body mentions screen share or share iframe.

Run-code: [`share-screen-agent.js`](../tests/lib/header/share-screen-agent.js), [`share-screen-visitor.js`](../tests/lib/header/share-screen-visitor.js).

### Share Document

1. Agent: **Share Document** → `input[type="file"]` → upload [`tests/fixtures/sample.pdf`](../tests/fixtures/sample.pdf).
2. Visitor: document/PDF/viewing text or document viewer frame.

Override PDF path: `COBROWSE_SAMPLE_PDF=/path/to/file.pdf`.

### Add Guest

1. Agent: **Add Guest popup** → email (default `guest.test@example.com`, override `COBROWSE_GUEST_EMAIL`) → Invite/Send.
2. Script prints `inviteUrl` when found.
3. Manual join: `COBROWSE_GUEST_MANUAL=1 npm run test:header:add-guest` — join as guest in another browser, press Enter.
4. Validate: agent body shows guest count ≥ 2 or multiple guest controls.

Run-code: [`add-guest-agent.js`](../tests/lib/header/add-guest-agent.js), [`add-guest-validate.js`](../tests/lib/header/add-guest-validate.js).

## Environment errors

| Message | Meaning |
|---------|---------|
| `USENWAYVIDEOSESSIONS is not enabled` | Group needs n-way video / guest settings (staging `21552`) |
| `ERR_NO_NWAYVIDEO_SETTINGS` | Visitor-side n-way video not configured |

Scripts fail with snapshot + screenshot under `.playwright-cli/` (`agent-fail-*.png`, `visitor-fail-*.png`).

## Discovery commands (manual)

After join, for each header control:

```bash
npx playwright-cli -s=agent tab-select 1
npx playwright-cli -s=agent snapshot
# click control, complete first dialog
npx playwright-cli -s=agent snapshot
npx playwright-cli -s=visitor snapshot
```

Update selectors in `tests/lib/header/*.js` if dialog labels change.

## Implementation layout

- Shared bash: [`scripts/lib/header-common.sh`](../scripts/lib/header-common.sh), [`header-run-code.sh`](../scripts/lib/header-run-code.sh)
- Orchestrator: [`scripts/test-agent-viewer-header.sh`](../scripts/test-agent-viewer-header.sh)
