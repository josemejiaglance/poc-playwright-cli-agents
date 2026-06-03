#!/usr/bin/env bash
# Full unattended cobrowse + video E2E for CI (GitHub Actions or local dry-run).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PLAYWRIGHT_CLI_CONFIG="${PLAYWRIGHT_CLI_CONFIG:-.playwright/cli.config.ci.json}"
export CI="${CI:-1}"

cleanup() {
  bash "${ROOT}/scripts/close-sessions-ci.sh" || true
}
trap cleanup EXIT

echo "==> Open CI sessions (headless)"
bash "${ROOT}/scripts/open-sessions-ci.sh"

echo "==> Agent login"
bash "${ROOT}/scripts/ci-agent-login.sh"

echo "==> Configure visitor"
npm run test:configure-visitor

echo "==> Start cobrowse on visitor"
npm run test:start-visitor-cobrowse

echo "==> Extract session code"
bash "${ROOT}/scripts/ci-extract-session-code.sh"
SESSION_CODE="$(cat "${ROOT}/.ci-session-code")"

echo "==> Grant media"
npm run test:grant-media

echo "==> Agent join (${SESSION_CODE}) + video prep"
npm run test:agent-join -- "$SESSION_CODE"

echo "==> Video assertions"
COBROWSE_SKIP_END_SESSION=1 node tests/run-assertions.mjs \
  --case start-cobrowse-session-with-video \
  --group video

echo "==> End session"
npm run test:end-session

echo "CI cobrowse video E2E passed."
