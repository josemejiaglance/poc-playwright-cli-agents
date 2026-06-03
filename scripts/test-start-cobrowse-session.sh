#!/usr/bin/env bash
# Full orchestration for base test case: start-cobrowse-session
# Requires: sessions open, agent logged in, SESSION_CODE if agent already joined
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SESSION_CODE="${1:-}"

echo "==> Configure visitor"
npm run test:configure-visitor

echo "==> Start cobrowse on visitor"
npm run test:start-visitor-cobrowse

if [[ -z "$SESSION_CODE" ]]; then
  echo ""
  echo "Provide session code to continue:"
  echo "  npm run test:start-cobrowse-session -- <CODE>"
  exit 0
fi

echo "==> Grant media permissions"
npm run test:grant-media

echo "==> Agent join (${SESSION_CODE})"
npm run test:agent-join -- "$SESSION_CODE"

echo "==> Post-join assertions"
npm run test:assert
