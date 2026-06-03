#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CODE="$(node tests/lib/extract-session-code.mjs)"
echo "$CODE" > "${ROOT}/.ci-session-code"
echo "Session code: ${CODE}"
