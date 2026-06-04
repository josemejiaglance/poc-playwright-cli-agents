#!/usr/bin/env bash
# Run all video assertions, highlight targets on live sessions, and save screenshots.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/playwright-cli-env.sh
source "${ROOT}/scripts/lib/playwright-cli-env.sh"

COBROWSE_SKIP_END_SESSION=1 node tests/lib/visualize-video-assertions.mjs "$@"
