async page => {
  const errors = [];
  await page.context().grantPermissions(['camera', 'microphone']);

  const btn = page.getByRole('button', { name: /Agent Video/i });
  if (!(await btn.isVisible().catch(() => false))) {
    return { pass: false, error: 'Agent Video button not visible' };
  }
  await btn.click();
  await page.waitForTimeout(1500);

  // Preview / start dialogs (wording varies by build)
  for (const name of [/Start/i, /Share/i, /Begin/i, /OK/i, /Continue/i]) {
    const action = page.getByRole('button', { name }).filter({ hasNotText: /End Session/i });
    const first = action.first();
    if (await first.isVisible().catch(() => false)) {
      await first.click().catch(() => {});
      await page.waitForTimeout(1000);
    }
  }

  const deadline = Date.now() + 30000;
  let agentVideoFrame = null;
  while (Date.now() < deadline) {
    agentVideoFrame = page
      .frames()
      .find(
        (f) =>
          /VideoPlayer|videoplayer|glance_video/i.test(f.url()) ||
          /video/i.test(f.name() || '')
      );
    if (agentVideoFrame) break;
    const videoRegion = page.locator('[class*="video"], [id*="video"], iframe').first();
    if (await videoRegion.isVisible().catch(() => false)) {
      agentVideoFrame = { url: () => 'agent-video-region' };
      break;
    }
    await page.waitForTimeout(500);
  }

  const bodyText = await page.locator('body').innerText().catch(() => '');
  if (/USENWAYVIDEOSESSIONS|not enabled/i.test(bodyText)) {
    errors.push('USENWAYVIDEOSESSIONS — enable n-way video for group');
  }

  const pass = !!agentVideoFrame && errors.length === 0;
  return {
    pass,
    errors,
    agentVideo: !!agentVideoFrame,
    frames: page.frames().map((f) => f.url()).filter((u) => u && !u.startsWith('about:')),
  };
};
