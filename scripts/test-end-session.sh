#!/usr/bin/env bash
# End cobrowse on agent (End Session) and visitor (Leave session).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/playwright-cli-env.sh
source "${ROOT}/scripts/lib/playwright-cli-env.sh"
LIB="${ROOT}/tests/lib/header"

if ! pcli list 2>/dev/null | grep -qE 'visitor|agent'; then
  echo "No playwright-cli sessions running — nothing to end."
  exit 0
fi

echo "Ending cobrowse session…"

pcli -s=agent tab-select 1 2>/dev/null || true
pcli -s=agent run-code --filename="${LIB}/end-session-agent.js" 2>&1 | tail -5 || true
pcli -s=visitor run-code --filename="${LIB}/end-session-visitor.js" 2>&1 | tail -5 || true

echo "Cobrowse session ended (agent + visitor)."
