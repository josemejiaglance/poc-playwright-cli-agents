#!/usr/bin/env bash
# Wrap playwright-cli run-code and parse ### Result JSON (pass field).
# Usage: source scripts/lib/header-run-code.sh
#        header_run_code_parse visitor 'async page => ({ pass: true })'
set -euo pipefail

_HEADER_RUN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/lib/playwright-cli-env.sh
source "${_HEADER_RUN_ROOT}/scripts/lib/playwright-cli-env.sh"

header_run_code_parse() {
  local session="$1"
  local code="$2"
  local out
  if ! out="$(pcli -s="${session}" run-code "${code}" 2>&1)"; then
    printf '%s\n' "$out" >&2
    return 1
  fi
  printf '%s\n' "$out"
  local json
  json="$(printf '%s\n' "$out" | awk '/^### Result$/{f=1;next} f&&/^### /{exit} f{print}')"
  if [[ -z "$json" ]]; then
    echo '{"pass":false,"error":"No ### Result block in CLI output"}' >&2
    return 1
  fi
  if echo "$json" | grep -qE '"pass"\s*:\s*false'; then
    printf '%s\n' "$json" >&2
    return 1
  fi
  return 0
}
