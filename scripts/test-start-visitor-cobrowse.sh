#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/playwright-cli-env.sh
source "${ROOT}/scripts/lib/playwright-cli-env.sh"

VISITOR_URL="${COBROWSE_VISITOR_URL:-https://dev-cobrowse-test.myglance.net/cobrowse/test}"

pcli -s=visitor goto "$VISITOR_URL"
pcli -s=visitor run-code "async page => { await page.getByRole('link', { name: 'Start Cobrowse' }).click(); }"
pcli -s=visitor snapshot

if [[ "${CI:-}" == "1" ]]; then
  sleep 2
  node tests/lib/extract-session-code.mjs > "${ROOT}/.ci-session-code"
  echo "Session code (CI): $(cat "${ROOT}/.ci-session-code")"
else
  echo ""
  echo "Read the snapshot above for the 4-digit session code, then run:"
  echo "  npm run test:agent-join -- <CODE>"
fi
