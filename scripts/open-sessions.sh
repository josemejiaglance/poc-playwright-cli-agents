#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/playwright-cli-env.sh
source "${ROOT}/scripts/lib/playwright-cli-env.sh"

VISITOR_URL="https://dev-cobrowse-test.myglance.net/cobrowse/test"
AGENT_URL="https://www.myglance.net/login/default.aspx"

pcli -s=visitor open "$VISITOR_URL" --headed --persistent
pcli -s=agent open "$AGENT_URL" --headed --persistent
pcli list
