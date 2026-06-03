async page => {
  const deadline = Date.now() + 30000;
  let pass = false;
  let snippet = '';

  while (Date.now() < deadline) {
    const dialog = page.getByRole('dialog').first();
    snippet = await dialog.innerText().catch(() => '');
    const body = await page.locator('body').innerText().catch(() => '');
    const combined = snippet + body;

    if (/document|pdf|viewing|page 1|shared/i.test(combined)) {
      pass = true;
      break;
    }

    const docFrame = page
      .frames()
      .find((f) => /pdf|document|viewer|FileViewer/i.test(f.url()));
    if (docFrame) {
      pass = true;
      break;
    }

    await page.waitForTimeout(1000);
  }

  return {
    pass,
    snippet: snippet.replace(/\s+/g, ' ').slice(0, 120),
  };
};
