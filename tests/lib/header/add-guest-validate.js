async page => {
  const deadline = Date.now() + 15000;
  let pass = false;
  let snippet = '';

  while (Date.now() < deadline) {
    snippet = await page.locator('body').innerText().catch(() => '');
    if (/guest[s]?\s*[:(]?\s*2|2\s*guest|guestCount|participant/i.test(snippet)) {
      pass = true;
      break;
    }
    const guestBtn = page.getByRole('button', { name: /guest/i });
    if ((await guestBtn.count()) > 1) {
      pass = true;
      break;
    }
    await page.waitForTimeout(1000);
  }

  return {
    pass,
    snippet: snippet.replace(/\s+/g, ' ').slice(0, 150),
  };
};
