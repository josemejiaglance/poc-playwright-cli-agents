// spec: specs/cobrowse-video.plan.md — 1.1 configure-cobrowse-settings
import { expect, test, cobrowseEnv } from '../fixtures';

test.describe('Visitor setup', () => {
  test('configure-cobrowse-settings', async ({ page }) => {
    const { groupId, webServer, cdn, settingsUrl } = cobrowseEnv;

    // 1. Open visitor settings URL for group 21552.
    await page.goto(settingsUrl);
    await expect(page).toHaveURL(/TestPageSettings/);

    // 2. Apply required cobrowse configuration (web server, CDN, site).
    const groupField = page.locator('#MainContent_CobrowseTestContent_CobrowseGroupId');
    const webField = page.locator('#MainContent_CobrowseTestContent_CobrowseWebServer');
    const cdnField = page.locator('#MainContent_CobrowseTestContent_CobrowseCDN');

    // Mirror scripts/test-configure-visitor.sh step order.
    await groupField.fill(groupId);
    await webField.fill(webServer);
    await cdnField.fill(cdn);
    await page.getByRole('checkbox', { name: 'No CDN; specify loader script' }).uncheck();
    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes('TestPageSettings') &&
          resp.request().method() === 'POST' &&
          resp.status() < 400,
      ),
      page.getByRole('radio', { name: 'Staging' }).check(),
    ]);
    await groupField.fill(groupId);

    await expect(groupField).toHaveValue(groupId);
    await expect(webField).toHaveValue(webServer);
    await expect(cdnField).toHaveValue(cdn);
    await expect(page.getByRole('radio', { name: 'Staging' })).toBeChecked();

    await page.getByRole('button', { name: 'Save' }).click();

    // expect: Save succeeds (redirect to test page, same as test-configure-visitor.sh).
    await page.waitForURL(/\/cobrowse\/test(?:\/|$)/, { timeout: 30_000 });
    await expect(page.getByRole('link', { name: 'List of Cobrowse Test Pages' })).toBeVisible();
  });
});
