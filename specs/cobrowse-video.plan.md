# Cobrowse with Video — Test Plan

**Status:** In progress — scenario **1.1** implemented in `@playwright/test`.  
**Current automation:** `npm run test:ci:e2e:video` (shell + `run-assertions.mjs`) + `npm run test:pw:ci` (Playwright specs).  
**Structured case:** [tests/cases/start-cobrowse-session-with-video.json](../tests/cases/start-cobrowse-session-with-video.json)

## Application Overview

MyGlance co-browse connects a **visitor** on a staging test page with an **agent** in the MyGlance console. This plan covers the **video** path: agent enables Agent Video, visitor shows a VideoPlayer iframe, and both sides stream without error states (`Waiting`, `ERR_NO_NWAYVIDEO_SETTINGS`). Group `21552` must have n-way video enabled on staging.

## Test Scenarios

### 1. Visitor setup

**Seed:** `tests/playwright/cobrowse-seed.spec.ts`

#### 1.1. configure-cobrowse-settings ✅

**File:** `tests/playwright/visitor/configure-cobrowse-settings.spec.ts`  
**Maps to:** `npm run test:configure-visitor` / `npm run test:pw:visitor`

**Steps:**

1. Open visitor settings URL for group 21552.
   - expect: Settings page loads without error banner.
2. Apply required cobrowse configuration (web server, CDN, site).
   - expect: Form fields accept group 21552 before save (wait for Staging POST postback before re-filling group id).
   - expect: Save redirects to cobrowse test list page.

#### 1.2. start-cobrowse-session

**File:** `tests/playwright/visitor/start-cobrowse-session.spec.ts`  
**Maps to:** `npm run test:start-visitor-cobrowse`, `ci-extract-session-code.sh`

**Steps:**

1. On visitor test page, start a cobrowse session.
   - expect: Session code (4 digits) is visible.
   - expect: Visitor cobrowse widget is active.

---

### 2. Agent join and video

**Seed:** `tests/playwright/cobrowse-seed.spec.ts` (agent context authenticated via storage state or login fixture)

#### 2.1. join-with-session-code

**File:** `tests/playwright/agent/join-with-session-code.spec.ts`  
**Maps to:** `npm run test:agent-join`, `ci-agent-login.mjs`

**Steps:**

1. Agent is logged in at myglance.net.
   - expect: Authenticated agent home or join page is reachable.
2. Enter visitor session code on agent join page.
   - expect: Agent viewer loads; session is connected.
   - expect: Visitor Information control visible in header.

#### 2.2. enable-agent-video

**File:** `tests/playwright/video/enable-agent-video.spec.ts`  
**Maps to:** `npm run test:prepare-post-join`, `test:grant-media`

**Steps:**

1. Grant camera and microphone on visitor session.
   - expect: Permission prompts resolved (or faked in CI).
2. Click **Agent Video** in agent viewer header.
   - expect: Agent Video button shows active state (video-on icon, “Video connected”).
3. Expand visitor Cobrowse widget.
   - expect: VideoPlayer iframe URL contains `staging-video-A-1.myglance.net`.

#### 2.3. assert-video-streaming

**File:** `tests/playwright/video/assert-video-streaming.spec.ts`  
**Maps to:** `run-assertions.mjs --group video`

**Steps:**

1. On agent viewer, inspect mirrored visitor widget.
   - expect: **Showing Page** dialog and **Video area** region present.
   - expect: No `USENWAYVIDEOSESSIONS` or `ERR_NO_NWAYVIDEO_SETTINGS` in page.
2. On visitor, inspect VideoPlayer iframe.
   - expect: iframe present with VideoPlayer URL.
   - expect: Body text does **not** contain `Waiting`.

---

### 3. Teardown

#### 3.1. end-session

**File:** `tests/playwright/session/end-session.spec.ts`  
**Maps to:** `npm run test:end-session`

**Steps:**

1. End cobrowse session from agent or visitor.
   - expect: Session controls return to idle / disconnected state.

---

## Generation notes

- Each scenario starts from the seed's fresh state — do not chain 1.2 into 2.1 in one test file.
- CI uses headless Chromium + fake media; local headed runs may use `--persistent` agent profile until storage state is committed.
- When generating, attach via `npx playwright test ... --debug=cli` — do not `open` URLs directly if the seed performs login or navigation setup.
- Reconcile this spec with [start-cobrowse-session-with-video.md](../tests/cases/start-cobrowse-session-with-video.md) when app behaviour changes.
