async page => {
  await page.context().grantPermissions(['camera', 'microphone']);

  const cobrowseBtn = page.getByRole('button', { name: 'Cobrowse' }).first();
  if (await cobrowseBtn.isVisible().catch(() => false)) {
    await cobrowseBtn.click().catch(() => {});
    await page.waitForTimeout(1500);
  }

  const deadline = Date.now() + 45000;
  let vp = null;
  let bodyText = '';
  while (Date.now() < deadline) {
    vp = page.frames().find((f) => /VideoPlayer|videoplayer/i.test(f.url()));
    if (vp) {
      bodyText = await vp.locator('body').innerText().catch(() => '');
      if (!/Waiting/i.test(bodyText)) break;
    }
    await page.waitForTimeout(1000);
  }

  const dialog = page.getByRole('dialog').first();
  const dialogText = await dialog.innerText().catch(() => '');

  const pass = !!vp && !/Waiting/i.test(bodyText);
  return {
    pass,
    url: vp ? vp.url().slice(0, 120) : null,
    waiting: /Waiting/i.test(bodyText),
    dialogSnippet: dialogText.replace(/\s+/g, ' ').slice(0, 100),
    frames: page.frames().map((f) => f.url()).filter((u) => u && !u.startsWith('about:')),
  };
};
