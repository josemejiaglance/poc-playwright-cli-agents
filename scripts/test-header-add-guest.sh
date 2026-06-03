#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
source "${ROOT}/scripts/lib/header-common.sh"
header_enable_session_teardown

echo "==> Add Guest (header E2E)"
header_require_live_session
header_grant_media

OUT="$(npx playwright-cli -s=agent run-code --filename="${HEADER_LIB_DIR}/add-guest-agent.js" 2>&1)" || {
  echo "$OUT" >&2
  header_capture_evidence "add-guest-fail"
  exit 1
}
echo "$OUT"

if echo "$OUT" | grep -qE '"pass"\s*:\s*false'; then
  echo "$OUT" >&2
  header_capture_evidence "add-guest-fail"
  exit 1
fi

INVITE_URL="$(echo "$OUT" | grep -oE 'https?://[^"\\]+' | head -1 || true)"
if [[ -n "$INVITE_URL" ]]; then
  echo ""
  echo "Guest invite URL (if shown): ${INVITE_URL}"
fi

if [[ "${COBROWSE_GUEST_MANUAL:-}" == "1" ]] || echo "$OUT" | grep -q '"needsManualJoin":true'; then
  echo ""
  echo "Join as guest in another browser (or guest session), then press Enter to validate…"
  read -r _
fi

header_assert_pass agent "${HEADER_LIB_DIR}/add-guest-validate.js" "add-guest-validate"
header_capture_evidence "add-guest"
echo "Add Guest E2E passed."
