#!/usr/bin/env bash
# Validate environment before opening CI browser sessions.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CONFIG="${PLAYWRIGHT_CLI_CONFIG:-.playwright/cli.config.ci.json}"

if [[ ! -f "$CONFIG" ]]; then
  echo "ERROR: PLAYWRIGHT_CLI_CONFIG not found: $CONFIG" >&2
  exit 1
fi

if [[ -z "${GLANCE_AGENT_USER:-}" || -z "${GLANCE_AGENT_PASSWORD:-}" ]]; then
  echo "ERROR: GLANCE_AGENT_USER and GLANCE_AGENT_PASSWORD must be set before CI sessions start." >&2
  exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "ERROR: npx not found." >&2
  exit 1
fi

if ! npx playwright-cli --version >/dev/null 2>&1; then
  echo "ERROR: playwright-cli not available. Run npm ci && npm run cli:install-browser." >&2
  exit 1
fi

echo "CI preflight OK (config=$CONFIG, user=${GLANCE_AGENT_USER})"
