#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
source "${ROOT}/scripts/lib/header-common.sh"
header_enable_session_teardown

echo "==> Visitor Information (header E2E)"
header_require_live_session

header_assert_pass agent "${HEADER_LIB_DIR}/visitor-info-agent.js" "visitor-info-agent"
header_capture_evidence "visitor-info"
echo "Visitor Information E2E passed."
