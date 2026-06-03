async page => {
  const btn = page.getByRole('button', { name: /Add Guest/i });
  if (!(await btn.isVisible().catch(() => false))) {
    return { pass: false, error: 'Add Guest button not visible' };
  }
  await btn.click();
  await page.waitForTimeout(1500);

  const dialog = page.getByRole('dialog').or(page.locator('[role="dialog"]')).first();
  const dialogText = await dialog.innerText().catch(() => '');

  if (/USENWAYVIDEOSESSIONS|not enabled/i.test(dialogText)) {
    return {
      pass: false,
      error: 'USENWAYVIDEOSESSIONS — enable n-way video / guest for group 21552',
      dialogSnippet: dialogText.slice(0, 200),
    };
  }

  const email = process.env.COBROWSE_GUEST_EMAIL || 'guest.test@example.com';
  const emailInput = page
    .getByRole('textbox', { name: /email/i })
    .or(page.locator('input[type="email"]'))
    .first();
  if (await emailInput.isVisible().catch(() => false)) {
    await emailInput.fill(email);
  }

  let inviteUrl = null;
  const linkEl = page.getByRole('link').filter({ hasText: /join|guest|http/i }).first();
  const textbox = page.getByRole('textbox').filter({ hasText: /http/i }).first();
  if (await linkEl.isVisible().catch(() => false)) {
    inviteUrl = await linkEl.getAttribute('href').catch(() => null);
  }

  for (const name of [/Invite|Send|Add|OK|Copy/i]) {
    const action = page.getByRole('button', { name }).first();
    if (await action.isVisible().catch(() => false)) {
      await action.click().catch(() => {});
      await page.waitForTimeout(2000);
    }
  }

  const bodyAfter = await page.locator('body').innerText().catch(() => '');
  const urlMatch = bodyAfter.match(/https?:\/\/[^\s]+/);
  if (urlMatch) inviteUrl = inviteUrl || urlMatch[0];

  const guestCountMatch = bodyAfter.match(/guest[s]?\s*[:(]?\s*(\d+)/i);

  return {
    pass: !!inviteUrl || /guest.*join|invitation sent|guest added/i.test(bodyAfter + dialogText),
    inviteUrl,
    guestCount: guestCountMatch ? guestCountMatch[1] : null,
    dialogSnippet: dialogText.replace(/\s+/g, ' ').slice(0, 150),
    needsManualJoin: !!inviteUrl,
  };
};
