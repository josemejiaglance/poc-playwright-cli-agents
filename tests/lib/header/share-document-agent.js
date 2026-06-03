async page => {
  const path =
    process.env.COBROWSE_SAMPLE_PDF ||
    `${process.cwd()}/tests/fixtures/sample.pdf`;

  const btn = page.getByRole('button', { name: /Share Document/i });
  if (!(await btn.isVisible().catch(() => false))) {
    return { pass: false, error: 'Share Document button not visible' };
  }
  await btn.click();
  await page.waitForTimeout(1500);

  const fileInput = page.locator('input[type="file"]').first();
  if (!(await fileInput.count())) {
    const choose = page.getByRole('button', { name: /Choose|Browse|Upload|Select/i }).first();
    if (await choose.isVisible().catch(() => false)) {
      await choose.click();
      await page.waitForTimeout(500);
    }
  }

  const input = page.locator('input[type="file"]').first();
  if (!(await input.count())) {
    return { pass: false, error: 'No file input found for Share Document' };
  }

  await input.setInputFiles(path);
  await page.waitForTimeout(2000);

  for (const name of [/Share|Upload|OK|Start|Open/i]) {
    const action = page.getByRole('button', { name }).first();
    if (await action.isVisible().catch(() => false)) {
      await action.click().catch(() => {});
      await page.waitForTimeout(1500);
    }
  }

  const deadline = Date.now() + 25000;
  let docVisible = false;
  while (Date.now() < deadline) {
    const body = await page.locator('body').innerText().catch(() => '');
    if (/document|pdf|page 1|sharing document/i.test(body)) {
      docVisible = true;
      break;
    }
    const docFrame = page.frames().find((f) => /pdf|document|viewer/i.test(f.url()));
    if (docFrame) {
      docVisible = true;
      break;
    }
    await page.waitForTimeout(500);
  }

  return {
    pass: docVisible,
    docVisible,
    path,
  };
};
