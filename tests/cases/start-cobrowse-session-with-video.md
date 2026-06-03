# Test case: Start a Cobrowse Session with Video

**ID:** `start-cobrowse-session-with-video`  
**Type:** Smoke / video — extends [start-cobrowse-session](./start-cobrowse-session.md) with video preparation and assertions.

Structured definition: [start-cobrowse-session-with-video.json](./start-cobrowse-session-with-video.json)

## Purpose

Validate end-to-end cobrowse with **agent video** enabled:

1. Configure visitor settings and start cobrowse
2. Agent joins with session code
3. Grant camera/microphone
4. Enable **Agent Video** and wait for visitor **VideoPlayer**
5. Assert session mirror, video controls, and active streams on both sides

## Prerequisites

- `npm install` and `npm run cli:install-browser`
- `npm run sessions:open` (agent logged in on persistent profile)
- Group `21552` must have n-way video enabled (staging)

## Quick run (full flow)

```bash
npm run sessions:open
# log in on agent browser

npm run test:start-cobrowse-session-with-video -- <SESSION_CODE>
```

Or step-by-step:

```bash
npm run test:configure-visitor
npm run test:start-visitor-cobrowse
# note 4-digit code

npm run test:grant-media
npm run test:agent-join -- <CODE>    # runs test:prepare-post-join automatically

npm run test:assert:video            # video assertions only
npm run test:assert:video:all          # pre-join + post-join + video
```

## Video preparation

`npm run test:agent-join` and `npm run test:prepare-post-join` both:

- Click **Agent Video** on the agent viewer
- Expand visitor **Cobrowse** widget
- Wait for `VideoPlayer` iframe (`staging-video-A-1.myglance.net`)

Run preparation before video assertions if you joined manually:

```bash
npm run test:prepare-post-join
```

## Assertions

### Video group (default for this case)

```bash
npm run test:assert:video
# or
node tests/run-assertions.mjs --case start-cobrowse-session-with-video --group video
```

| Assertion ID | Session | Pass criteria |
|--------------|---------|---------------|
| `agent-video-button-visible` | agent | **Agent Video** button visible in viewer header |
| `agent-video-streaming` | agent | Agent video frame/region present; no `USENWAYVIDEOSESSIONS` / `ERR_NO_NWAYVIDEO_SETTINGS` |
| `visitor-video-player-present` | visitor | iframe URL contains `VideoPlayer` |
| `visitor-video-streaming` | visitor | VideoPlayer loaded; body text does **not** contain `Waiting` |

### Post-join group (session without re-running video validators)

```bash
node tests/run-assertions.mjs --case start-cobrowse-session-with-video --group postJoin
```

### All assertions

```bash
npm run test:assert:video:all
```

Keep session open after assertions:

```bash
COBROWSE_SKIP_END_SESSION=1 npm run test:assert:video
```

## Troubleshooting

| Symptom | What to try |
|---------|-------------|
| `ERR_NO_NWAYVIDEO_SETTINGS` in console | Confirm group `21552` n-way video on staging |
| `USENWAYVIDEOSESSIONS is not enabled` | Enable guest/n-way video for the group |
| Visitor stuck on **Waiting** | Re-run `npm run test:prepare-post-join`; click **Allow** on native camera prompt |
| `agent-video-streaming` fails | Agent tab must be `AgentView.aspx` (tab 1); run `npx playwright-cli -s=agent tab-select 1` |

## Related

- Base case: [start-cobrowse-session.md](./start-cobrowse-session.md)
- Header E2E (single control): [docs/AGENT_VIEWER_HEADER.md](../../docs/AGENT_VIEWER_HEADER.md)
- Assertion catalog: [.cursor/skills/glance-cobrowse/references/assertions.md](../../.cursor/skills/glance-cobrowse/references/assertions.md)
