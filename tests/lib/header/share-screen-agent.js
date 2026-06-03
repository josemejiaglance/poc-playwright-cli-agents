async page => {
  await page.context().grantPermissions(['camera', 'microphone']);

  const btn = page.getByRole('button', { name: /Share Screen/i });
  if (!(await btn.isVisible().catch(() => false))) {
    return { pass: false, error: 'Share Screen button not visible' };
  }
  await btn.click();
  await page.waitForTimeout(2000);

  for (const name of [/Share/i, /Start/i, /Entire screen|Screen/i, /OK|Continue/i]) {
    const action = page.getByRole('button', { name }).first();
    if (await action.isVisible().catch(() => false)) {
      await action.click().catch(() => {});
      await page.waitForTimeout(1500);
    }
  }

  const deadline = Date.now() + 25000;
  let sharing = false;
  while (Date.now() < deadline) {
    const body = await page.locator('body').innerText().catch(() => '');
    if (/sharing|screen share|Stop sharing|You are sharing/i.test(body)) {
      sharing = true;
      break;
    }
    const shareBtn = page.getByRole('button', { name: /Stop sharing|Stop Share/i });
    if (await shareBtn.isVisible().catch(() => false)) {
      sharing = true;
      break;
    }
    await page.waitForTimeout(500);
  }

  return {
    pass: sharing,
    sharing,
    url: page.url(),
  };
};
