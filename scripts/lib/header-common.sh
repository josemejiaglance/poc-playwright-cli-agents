#!/usr/bin/env bash
# Shared helpers for agent-viewer header E2E scripts.
set -euo pipefail

HEADER_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HEADER_LIB_DIR="${HEADER_ROOT}/tests/lib/header"
_HEADER_TEARDOWN_DONE=0
# shellcheck source=scripts/lib/playwright-cli-env.sh
source "${HEADER_ROOT}/scripts/lib/playwright-cli-env.sh"

# Call once per script to end cobrowse on exit (pass or fail). Set COBROWSE_SKIP_END_SESSION=1 to disable.
header_enable_session_teardown() {
  header_teardown() {
    if [[ "${_HEADER_TEARDOWN_DONE}" -eq 1 ]]; then
      return 0
    fi
    _HEADER_TEARDOWN_DONE=1
    if [[ "${COBROWSE_SKIP_END_SESSION:-}" == "1" ]]; then
      return 0
    fi
    echo ""
    echo "==> Ending cobrowse session (teardown)…"
    bash "${HEADER_ROOT}/scripts/test-end-session.sh" || true
  }
  trap header_teardown EXIT
}

header_end_session() {
  bash "${HEADER_ROOT}/scripts/test-end-session.sh"
}

header_select_agent_viewer() {
  pcli -s=agent tab-select 1 2>/dev/null || true
}

header_grant_media() {
  bash "${HEADER_ROOT}/scripts/test-grant-media.sh"
}

header_capture_evidence() {
  local tag="${1:-header}"
  echo "  Capturing evidence (${tag})…"
  pcli -s=agent snapshot 2>/dev/null || true
  pcli -s=visitor snapshot 2>/dev/null || true
  pcli -s=agent screenshot --filename="agent-${tag}.png" 2>/dev/null || true
  pcli -s=visitor screenshot --filename="visitor-${tag}.png" 2>/dev/null || true
}

header_run_code_file() {
  local session="$1"
  local file="$2"
  if [[ ! -f "$file" ]]; then
    echo "Missing run-code file: $file" >&2
    return 1
  fi
  local out
  if ! out="$(pcli -s="${session}" run-code --filename="${file}" 2>&1)"; then
    echo "$out" >&2
    return 1
  fi
  echo "$out"
  if echo "$out" | grep -qE '"pass"\s*:\s*false'; then
    echo "$out" >&2
    return 1
  fi
  if echo "$out" | grep -qE '"pass"\s*:\s*true'; then
    return 0
  fi
  echo "$out" >&2
  echo "No pass:true in run-code result" >&2
  return 1
}

header_assert_pass() {
  local session="$1"
  local file="$2"
  local label="${3:-$file}"
  echo "  • ${label} (${session})"
  if header_run_code_file "$session" "$file"; then
    echo "    PASS"
    return 0
  fi
  echo "    FAIL — see output above"
  header_capture_evidence "fail-$(basename "$file" .js)"
  return 1
}

header_require_live_session() {
  if ! pcli list 2>/dev/null | grep -q 'visitor'; then
    echo "No visitor session. Run: npm run sessions:open" >&2
    exit 1
  fi
  header_select_agent_viewer
  local url
  local out
  out="$(pcli -s=agent run-code --filename="${HEADER_LIB_DIR}/agent-viewer-url.js" 2>&1 || true)"
  if ! echo "$out" | grep -q 'AgentView.aspx'; then
    echo "Agent viewer not loaded (expected AgentView.aspx)." >&2
    echo "Run: npm run test:agent-join -- <SESSION_CODE>" >&2
    exit 1
  fi
}
