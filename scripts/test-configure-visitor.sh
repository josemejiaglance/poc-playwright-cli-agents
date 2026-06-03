#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/playwright-cli-env.sh
source "${ROOT}/scripts/lib/playwright-cli-env.sh"

GROUP_ID="${COBROWSE_GROUP_ID:-21552}"
WEB_SERVER="${COBROWSE_WEB_SERVER:-www.myglance.net}"
CDN="${COBROWSE_CDN:-cdn.myglance.net}"
SETTINGS_URL="${COBROWSE_SETTINGS_URL:-https://dev-cobrowse-test.myglance.net/cobrowse/test/TestPageSettings}"

echo "Configuring visitor: group=${GROUP_ID} web=${WEB_SERVER} cdn=${CDN}"

pcli -s=visitor goto "$SETTINGS_URL"
pcli -s=visitor fill "#MainContent_CobrowseTestContent_CobrowseGroupId" "$GROUP_ID"
pcli -s=visitor fill "#MainContent_CobrowseTestContent_CobrowseWebServer" "$WEB_SERVER"
pcli -s=visitor fill "#MainContent_CobrowseTestContent_CobrowseCDN" "$CDN"
pcli -s=visitor run-code "async page => { await page.getByRole('checkbox', { name: 'No CDN; specify loader script' }).uncheck(); }"
pcli -s=visitor run-code "async page => { await page.getByRole('radio', { name: 'Staging' }).check(); }"
pcli -s=visitor fill "#MainContent_CobrowseTestContent_CobrowseGroupId" "$GROUP_ID"
pcli -s=visitor run-code "async page => { await page.getByRole('button', { name: 'Save' }).click(); }"

echo "Visitor settings saved."
