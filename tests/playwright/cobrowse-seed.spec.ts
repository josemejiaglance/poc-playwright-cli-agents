// spec: specs/cobrowse-video.plan.md — seed
import { expect, test, cobrowseEnv } from './fixtures';

test('seed — visitor on test page', async ({ page }) => {
  await page.goto(cobrowseEnv.visitorUrl);
  await expect(page).toHaveURL(/cobrowse\/test/);
});
