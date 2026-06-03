#!/usr/bin/env bash
# Full E2E: Agent Video — agent starts video, visitor receives VideoPlayer (not stuck on Waiting).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/header-common.sh
source "${ROOT}/scripts/lib/header-common.sh"
header_enable_session_teardown

echo "==> Agent Video (header E2E)"
header_require_live_session
header_grant_media

header_assert_pass agent "${HEADER_LIB_DIR}/agent-video-agent.js" "agent-video-agent"
header_assert_pass visitor "${HEADER_LIB_DIR}/agent-video-visitor.js" "agent-video-visitor"

header_capture_evidence "agent-video"
echo "Agent Video E2E passed."
