#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/playwright-cli-env.sh
source "${ROOT}/scripts/lib/playwright-cli-env.sh"

GRANT_CODE='async page => {
  const origins = ["https://www.myglance.net","https://dev-cobrowse-test.myglance.net","https://cdn.myglance.net","https://staging-video-A-1.myglance.net"];
  await page.context().grantPermissions(["camera","microphone"]);
  const c = await page.context().newCDPSession(page);
  for (const origin of origins) {
    try {
      await c.send("Browser.setPermission", { permission: { name: "videoCapture" }, setting: "granted", origin });
      await c.send("Browser.setPermission", { permission: { name: "audioCapture" }, setting: "granted", origin });
    } catch (_) {}
  }
  return { pass: true };
}'

pcli -s=visitor run-code "$GRANT_CODE"
pcli -s=agent run-code "$GRANT_CODE"
echo "Camera/microphone granted on visitor and agent sessions."
