#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/playwright-cli-env.sh
source "${ROOT}/scripts/lib/playwright-cli-env.sh"

echo "Preparing post-join (agent video + visitor VideoPlayer)…"

pcli -s=agent tab-select 1 2>/dev/null || true

AGENT_PREP='async page => {
  await page.context().grantPermissions(["camera","microphone"]);
  const btn = page.getByRole("button", { name: "Agent Video" });
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(2000);
  }
  return { pass: true };
}'

VISITOR_PREP='async page => {
  await page.context().grantPermissions(["camera","microphone"]);
  const cobrowseBtn = page.getByRole("button", { name: "Cobrowse" }).first();
  if (await cobrowseBtn.isVisible().catch(() => false)) {
    await cobrowseBtn.click().catch(() => {});
    await page.waitForTimeout(1500);
  }
  const deadline = Date.now() + 60000;
  let vp = null;
  while (Date.now() < deadline) {
    vp = page.frames().find(f => /VideoPlayer|videoplayer/i.test(f.url()));
    if (vp) {
      const bodyText = await vp.locator("body").innerText().catch(() => "");
      const waitingVisible = await vp.getByText(/^\\s*waiting\\s*$/i).first().isVisible().catch(() => false);
      if (!waitingVisible) {
        return { pass: true, url: vp.url().slice(0, 100), streaming: true };
      }
    }
    await page.waitForTimeout(1000);
  }
  return { pass: false, error: "VideoPlayer iframe not found" };
}'

pcli -s=agent run-code "$AGENT_PREP"
pcli -s=visitor run-code "$VISITOR_PREP"

echo "Post-join preparation complete."
