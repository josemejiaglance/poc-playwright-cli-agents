#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
source "${ROOT}/scripts/lib/header-common.sh"
header_enable_session_teardown

echo "==> Share Screen (header E2E)"
header_require_live_session
header_grant_media

header_assert_pass agent "${HEADER_LIB_DIR}/share-screen-agent.js" "share-screen-agent"
header_assert_pass visitor "${HEADER_LIB_DIR}/share-screen-visitor.js" "share-screen-visitor"

header_capture_evidence "share-screen"
echo "Share Screen E2E passed."
