/**
 * Run before post-join assertions so visitor VideoPlayer iframe is present.
 */

export const prepareAgentVideo = `async page => {
  await page.context().grantPermissions(['camera', 'microphone']);
  const btn = page.getByRole('button', { name: 'Agent Video' });
  if (await btn.isVisible().catch(() => false)) {
    const alreadyActive = await btn
      .evaluate((el) => el.classList.contains('active'))
      .catch(() => false);
    if (!alreadyActive) {
      await btn.click();
      await page.waitForTimeout(2000);
    }
  }
  return { pass: true, step: 'agent-video' };
}`;

export const prepareVisitorVideo = `async page => {
  await page.context().grantPermissions(['camera', 'microphone']);
  const findVp = () => page.frames().find((f) => /VideoPlayer|videoplayer/i.test(f.url()));
  let vp = findVp();
  if (!vp) {
    const cobrowseBtn = page.getByRole('button', { name: 'Cobrowse' }).first();
    if (await cobrowseBtn.isVisible().catch(() => false)) {
      await cobrowseBtn.click().catch(() => {});
      await page.waitForTimeout(1500);
    }
  }
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    vp = findVp();
    if (vp) {
      const waitingVisible = await vp
        .getByText(/^\\s*waiting\\s*$/i)
        .first()
        .isVisible()
        .catch(() => false);
      if (!waitingVisible) {
        return {
          pass: true,
          url: vp.url().slice(0, 120),
          streaming: true,
        };
      }
    }
    await page.waitForTimeout(1000);
  }
  return {
    pass: false,
    error: 'VideoPlayer iframe not streaming within 45s',
  };
}`;
