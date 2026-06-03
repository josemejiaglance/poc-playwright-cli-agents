# Test case: Start a Cobrowse Session

**ID:** `start-cobrowse-session`  
**Type:** Base / smoke — extend this case before adding new test files.

Structured definition: [start-cobrowse-session.json](./start-cobrowse-session.json)

## Purpose

Validate the end-to-end flow of starting a Glance cobrowse session:

1. Configure visitor test-page settings (staging, group, web server, CDN)
2. Start cobrowse on the visitor site and obtain a session code
3. Join as agent via Agent Join
4. Grant camera/microphone where needed
5. Assert agent viewer and visitor widgets loaded correctly

## Prerequisites

- `npm install` and `npm run cli:install-browser`
- `npm run sessions:open` (or run the full flow below)
- Agent logged in manually on the **agent** session (persistent profile)

## Default configuration

| Setting | Value |
|---------|--------|
| Environment | Staging |
| Group ID | `21552` |
| Web server | `www.myglance.net` |
| CDN | `cdn.myglance.net` |
| Visitor home | `https://dev-cobrowse-test.myglance.net/cobrowse/test` |
| Agent join | `https://www.myglance.net/agentjoin/AgentJoin.aspx` |

Override via env vars when running scripts (see below).

## Procedure (manual + CLI)

### 1. Open sessions

```bash
npm run sessions:open
```

### 2. Agent login (manual)

Sign in on the **agent** browser if prompted.

### 3. Configure visitor settings

**Important:** Fill web server and CDN **before** selecting Staging (avoids ASP.NET validation error on `<yourname>...` placeholders).

```bash
npm run test:configure-visitor
```

Or step-by-step:

```bash
npx playwright-cli -s=visitor goto "https://dev-cobrowse-test.myglance.net/cobrowse/test/TestPageSettings"
# fill groupId, webServer, cdn → uncheck "No CDN" → check Staging → re-fill groupId → Save
```

### 4. Start cobrowse (visitor)

```bash
npm run test:start-visitor-cobrowse
```

Note the **4-digit session code** in the visitor dialog.

### 5. Grant media (both sessions)

```bash
npm run test:grant-media
```

If a native Chrome permission bar appears, click **Allow** once.

### 6. Agent join

```bash
npm run test:agent-join -- <SESSION_CODE>
# Example: npm run test:agent-join -- 0294
```

### 7. Prepare video (required for all assertions to pass)

```bash
npm run test:prepare-post-join
```

Enables **Agent Video** and expands the visitor **Cobrowse** widget until the `VideoPlayer` iframe loads.

## Base assertions

Run after the session is started and agent has joined (`test:prepare-post-join` runs automatically):

```bash
npm run test:assert
```

Assertions end the cobrowse session automatically (`npm run test:end-session`). Set `COBROWSE_SKIP_END_SESSION=1` to keep the session open.

| Assertion ID | What it checks |
|--------------|----------------|
| `visitor-session-code-visible` | Visitor cobrowse dialog shows a 4-digit code (pre-join) |
| `agent-viewer-loaded` | Agent `AgentView.aspx` URL, title, `groupid=21552` |
| `agent-mirrors-visitor-page` | `pageframe` h1 is **Cobrowse Tests** |
| `visitor-in-session-widget` | Visitor dialog **Showing Page** |
| `visitor-video-player-present` | VideoPlayer iframe exists (after `test:prepare-post-join`) |

Run a subset:

```bash
node tests/run-assertions.mjs --only agent-viewer-loaded,agent-mirrors-visitor-page
```

## Extending this test case

1. Add steps to `phases[]` in `start-cobrowse-session.json`.
2. Add validators in `tests/lib/validators.mjs` and register in `validatorMap`.
3. Add matching entries to `assertions[]` in the JSON case.
4. Document new steps in this file under a new section.

Future examples: change group mid-session, pause/resume, masked fields, CRM join path.

## Environment overrides

```bash
COBROWSE_GROUP_ID=21552 \
COBROWSE_WEB_SERVER=www.myglance.net \
COBROWSE_CDN=cdn.myglance.net \
npm run test:configure-visitor
```
