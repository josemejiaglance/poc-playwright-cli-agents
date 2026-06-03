/**
 * Run before post-join assertions so visitor VideoPlayer iframe is present.
 */

export const prepareAgentVideo = `async page => {
  await page.context().grantPermissions(['camera', 'microphone']);
  const btn = page.getByRole('button', { name: 'Agent Video' });
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(2000);
  }
  return { pass: true, step: 'agent-video' };
}`;

export const prepareVisitorVideo = `async page => {
  await page.context().grantPermissions(['camera', 'microphone']);
  const cobrowseBtn = page.getByRole('button', { name: 'Cobrowse' }).first();
  if (await cobrowseBtn.isVisible().catch(() => false)) {
    await cobrowseBtn.click().catch(() => {});
    await page.waitForTimeout(1500);
  }
  const deadline = Date.now() + 45000;
  let vp = null;
  while (Date.now() < deadline) {
    vp = page.frames().find(f => /VideoPlayer|videoplayer/i.test(f.url()));
    if (vp) {
      return {
        pass: true,
        url: vp.url().slice(0, 120),
        waiting: (await vp.locator('body').innerText().catch(() => '')).includes('Waiting'),
        streaming: !(await vp.locator('body').innerText().catch(() => '')).match(/Waiting/i),
      };
    }
    await page.waitForTimeout(1000);
  }
  return {
    pass: false,
    error: 'VideoPlayer iframe not found within 45s',
    frames: page.frames().map(f => f.url()).filter(u => u && !u.startsWith('about:')),
  };
}`;
