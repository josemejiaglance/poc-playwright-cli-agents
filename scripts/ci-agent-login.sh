#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${GLANCE_AGENT_USER:-}" || -z "${GLANCE_AGENT_PASSWORD:-}" ]]; then
  echo "ERROR: GLANCE_AGENT_USER and GLANCE_AGENT_PASSWORD must be set (GitHub Secrets in CI)." >&2
  exit 1
fi

echo "Logging in agent…"
node tests/lib/ci-agent-login.mjs
