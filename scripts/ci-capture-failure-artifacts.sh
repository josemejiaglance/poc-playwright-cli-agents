#!/usr/bin/env bash
# Capture screenshots and snapshots from open CI sessions before teardown.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/playwright-cli-env.sh
source "${ROOT}/scripts/lib/playwright-cli-env.sh"

FAILURE_DIR="${ROOT}/.playwright-cli/ci-failure"
PUBLIC_DIR="${ROOT}/ci-artifacts"

mkdir -p "$FAILURE_DIR" "$PUBLIC_DIR"

if ! pcli list 2>/dev/null | grep -qE 'visitor|agent'; then
  echo "No open playwright-cli sessions — skipping failure capture."
  exit 0
fi

echo "Capturing CI failure artifacts…"

capture_session() {
  local session="$1"
  local tag="$2"
  if ! pcli list 2>/dev/null | grep -q "${session}:"; then
    return 0
  fi

  pcli -s="${session}" snapshot --filename="${FAILURE_DIR}/${tag}-snapshot.yml" 2>/dev/null || true
  pcli -s="${session}" screenshot --filename="${FAILURE_DIR}/${tag}.png" 2>/dev/null || true
}

capture_session visitor visitor
pcli -s=agent tab-select 1 2>/dev/null || true
capture_session agent agent-viewer

# Mirror PNGs to a non-hidden folder so artifact upload always finds them.
shopt -s nullglob
for png in "${FAILURE_DIR}"/*.png; do
  cp "$png" "${PUBLIC_DIR}/$(basename "$png")"
done
shopt -u nullglob

echo "Failure artifacts saved under .playwright-cli/ci-failure/ and ci-artifacts/"
