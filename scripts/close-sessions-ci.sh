#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/playwright-cli-env.sh
source "${ROOT}/scripts/lib/playwright-cli-env.sh"

pcli close-all 2>/dev/null || true
pcli kill-all 2>/dev/null || true
