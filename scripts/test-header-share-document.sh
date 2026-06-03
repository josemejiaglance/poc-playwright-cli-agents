#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
source "${ROOT}/scripts/lib/header-common.sh"
header_enable_session_teardown

PDF="${COBROWSE_SAMPLE_PDF:-${ROOT}/tests/fixtures/sample.pdf}"
if [[ ! -f "$PDF" ]]; then
  echo "Missing PDF fixture: $PDF" >&2
  exit 1
fi
export COBROWSE_SAMPLE_PDF="$PDF"

echo "==> Share Document (header E2E) — ${PDF}"
header_require_live_session

header_assert_pass agent "${HEADER_LIB_DIR}/share-document-agent.js" "share-document-agent"
header_assert_pass visitor "${HEADER_LIB_DIR}/share-document-visitor.js" "share-document-visitor"

header_capture_evidence "share-document"
echo "Share Document E2E passed."
