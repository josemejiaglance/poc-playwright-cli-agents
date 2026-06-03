# Cobrowse assertion catalog

Base case: `start-cobrowse-session`. Run via `npm run test:assert`.

Video case: `start-cobrowse-session-with-video`. Run via `npm run test:assert:video`.

## Post-join assertions (default)

Use after agent has joined. **`npm run test:assert` automatically runs `test:prepare-post-join`** (Agent Video + visitor Cobrowse expand) so all four assertions pass.

| ID | Session | Pass criteria |
|----|---------|---------------|
| `agent-viewer-loaded` | agent | URL contains `AgentView.aspx`, title includes session key, `groupid` matches default (`21552`) |
| `agent-mirrors-visitor-page` | agent | Frame `pageframe` h1 === `Cobrowse Tests` |
| `visitor-in-session-widget` | visitor | Dialog text includes `Showing Page` |
| `visitor-video-player-present` | visitor | iframe URL contains `VideoPlayer` (run `npm run test:prepare-post-join` first) |

## Video assertions (`start-cobrowse-session-with-video`)

Run after agent join + `test:prepare-post-join` (auto-run by `npm run test:assert:video`):

| ID | Session | Pass criteria |
|----|---------|---------------|
| `agent-video-button-visible` | agent | **Agent Video** button visible |
| `agent-video-streaming` | agent | Video frame/region active; no n-way video errors |
| `visitor-video-player-present` | visitor | `VideoPlayer` iframe present |
| `visitor-video-streaming` | visitor | VideoPlayer loaded; not stuck on **Waiting** |

```bash
npm run test:assert:video
npm run test:assert:video:all
node tests/run-assertions.mjs --case start-cobrowse-session-with-video --only visitor-video-streaming
```

## Pre-join assertions

Use after `test:start-visitor-cobrowse`, before agent join.

| ID | Session | Pass criteria |
|----|---------|---------------|
| `visitor-session-code-visible` | visitor | Cobrowse dialog contains 4-digit code |

```bash
node tests/run-assertions.mjs --only visitor-session-code-visible
```

## Adding a new assertion

1. Implement in `tests/lib/validators.mjs`:

```javascript
export const myNewCheck = `async page => {
  return { pass: true, detail: '...' };
}`;
export const validatorMap = { ..., 'my-new-check': myNewCheck };
```

2. Register in `tests/cases/start-cobrowse-session.json`:

```json
{
  "id": "my-new-check",
  "name": "Human-readable name",
  "session": "visitor",
  "validator": "my-new-check"
}
```

3. Run: `node tests/run-assertions.mjs --only my-new-check`
