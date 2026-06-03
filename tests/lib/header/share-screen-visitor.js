async page => {
  const deadline = Date.now() + 30000;
  let pass = false;
  let snippet = '';

  while (Date.now() < deadline) {
    const dialog = page.getByRole('dialog').or(page.getByRole('alertdialog')).first();
    snippet = await dialog.innerText().catch(() => '');
    const body = await page.locator('body').innerText().catch(() => '');
    const combined = snippet + body;

    if (
      /sharing|screen|viewing.*screen|agent.*share|See.*screen/i.test(combined) &&
      !/Waiting for/i.test(combined)
    ) {
      pass = true;
      break;
    }

    const allowBtn = page.getByRole('button', { name: /Allow|Accept|OK|Share/i }).first();
    if (await allowBtn.isVisible().catch(() => false)) {
      await allowBtn.click().catch(() => {});
      await page.waitForTimeout(2000);
    }

    await page.waitForTimeout(1000);
  }

  const vp = page.frames().find((f) => /VideoPlayer|videoplayer|share/i.test(f.url()));

  return {
    pass: pass || !!vp,
    snippet: snippet.replace(/\s+/g, ' ').slice(0, 120),
    hasShareFrame: !!vp,
  };
};
