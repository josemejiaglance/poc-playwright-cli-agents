#!/usr/bin/env bash
# Full unattended cobrowse + video E2E for CI (GitHub Actions or local dry-run).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/playwright-cli-env.sh
source "${ROOT}/scripts/lib/playwright-cli-env.sh"

export PLAYWRIGHT_CLI_CONFIG="${PLAYWRIGHT_CLI_CONFIG:-.playwright/cli.config.ci.json}"
export CI="${CI:-1}"

step() {
  echo ""
  echo "==> [$(date -u +%H:%M:%S)] $*"
}

on_exit() {
  local exit_code=$?
  if [[ "$exit_code" -ne 0 ]]; then
    bash "${ROOT}/scripts/ci-capture-failure-artifacts.sh" || true
  fi
  bash "${ROOT}/scripts/close-sessions-ci.sh" || true
  exit "$exit_code"
}
trap on_exit EXIT

step "Preflight"
bash "${ROOT}/scripts/ci-preflight.sh"

step "Open CI sessions (headless)"
bash "${ROOT}/scripts/open-sessions-ci.sh"

step "Start tracing (visitor + agent)"
pcli -s=visitor tracing-start 2>/dev/null || true
pcli -s=agent tracing-start 2>/dev/null || true

step "Agent login"
bash "${ROOT}/scripts/ci-agent-login.sh"

step "Configure visitor"
npm run test:configure-visitor

step "Start cobrowse on visitor"
npm run test:start-visitor-cobrowse

step "Extract session code"
bash "${ROOT}/scripts/ci-extract-session-code.sh"
SESSION_CODE="$(cat "${ROOT}/.ci-session-code")"

step "Grant media"
npm run test:grant-media

step "Agent join (${SESSION_CODE}) + video prep"
npm run test:agent-join -- "$SESSION_CODE"

step "Video assertions"
COBROWSE_SKIP_END_SESSION=1 COBROWSE_SKIP_VIDEO_PREP=1 node tests/run-assertions.mjs \
  --case start-cobrowse-session-with-video \
  --group video

step "End session"
npm run test:end-session

echo ""
echo "CI cobrowse video E2E passed."
