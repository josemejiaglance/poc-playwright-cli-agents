#!/usr/bin/env bash
# Shared playwright-cli config for local and CI runs.
# shellcheck disable=SC2034
export PLAYWRIGHT_CLI_CONFIG="${PLAYWRIGHT_CLI_CONFIG:-.playwright/cli.config.json}"

pcli() {
  npx playwright-cli "$@"
}
