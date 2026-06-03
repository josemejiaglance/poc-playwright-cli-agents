#!/usr/bin/env bash
# Full orchestration: start-cobrowse-session-with-video
# Requires: sessions open, agent logged in, SESSION_CODE after visitor start
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SESSION_CODE="${1:-}"
ASSERT_GROUP="${COBROWSE_ASSERT_GROUP:-video}"

echo "==> Configure visitor"
npm run test:configure-visitor

echo "==> Start cobrowse on visitor"
npm run test:start-visitor-cobrowse

if [[ -z "$SESSION_CODE" ]]; then
  echo ""
  echo "Provide session code to continue:"
  echo "  npm run test:start-cobrowse-session-with-video -- <CODE>"
  exit 0
fi

echo "==> Grant media permissions"
npm run test:grant-media

echo "==> Agent join (${SESSION_CODE}) + video preparation"
npm run test:agent-join -- "$SESSION_CODE"

echo "==> Video assertions (group: ${ASSERT_GROUP})"
node tests/run-assertions.mjs --case start-cobrowse-session-with-video --group "$ASSERT_GROUP"
