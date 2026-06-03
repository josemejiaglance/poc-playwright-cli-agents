#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/playwright-cli-env.sh
source "${ROOT}/scripts/lib/playwright-cli-env.sh"

SESSION_CODE="${1:-}"
JOIN_URL="${COBROWSE_AGENT_JOIN_URL:-https://www.myglance.net/agentjoin/AgentJoin.aspx}"

if [[ -z "$SESSION_CODE" ]]; then
  echo "Usage: npm run test:agent-join -- <SESSION_CODE>"
  exit 1
fi

pcli -s=agent goto "$JOIN_URL"
pcli -s=agent run-code "async page => { await page.getByRole('textbox', { name: 'Session Code' }).fill('$SESSION_CODE'); }"
pcli -s=agent run-code "async page => { await page.getByRole('button', { name: 'Join Session' }).click(); }"
sleep 2
pcli -s=agent tab-select 1
npm run test:prepare-post-join
pcli -s=agent snapshot

echo ""
echo "Agent joined session ${SESSION_CODE}. Run: npm run test:assert"
