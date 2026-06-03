#!/usr/bin/env bash
# Run all agent-viewer header E2E scripts (requires live cobrowse session).
# Usage:
#   npm run test:agent-viewer-header
#   npm run test:agent-viewer-header -- --only video,share-screen
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ONLY=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --only)
      ONLY="${2:-}"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

should_run() {
  local id="$1"
  if [[ -z "$ONLY" ]]; then
    return 0
  fi
  local part
  IFS=',' read -ra parts <<< "$ONLY"
  for part in "${parts[@]}"; do
    part="${part// /}"
    if [[ "$part" == "$id" ]]; then
      return 0
    fi
  done
  return 1
}

run_step() {
  local id="$1"
  local script="$2"
  if ! should_run "$id"; then
    return 0
  fi
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  bash "${ROOT}/scripts/${script}"
  local rc=$?
  echo ""
  echo "Session ended after '${id}'. Start a new cobrowse before the next header test:"
  echo "  npm run test:start-visitor-cobrowse"
  echo "  npm run test:agent-join -- <NEW_CODE>"
  return $rc
}

FAILED=0

# Each step ends the session on exit. Restart cobrowse between steps when running more than one.
# Prefer one at a time: npm run test:agent-viewer-header -- --only video

run_step video test-header-agent-video.sh || FAILED=1
run_step visitor-info test-header-visitor-info.sh || FAILED=1
run_step share-screen test-header-share-screen.sh || FAILED=1
run_step share-document test-header-share-document.sh || FAILED=1
run_step add-guest test-header-add-guest.sh || FAILED=1

echo ""
if [[ "$FAILED" -ne 0 ]]; then
  echo "Agent viewer header validation: FAILED" >&2
  exit 1
fi
echo "Agent viewer header validation: all requested steps passed."
