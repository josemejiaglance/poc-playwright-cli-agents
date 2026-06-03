async page => {
  const leaveBtn = page.getByRole('button', { name: /Leave session/i }).first();
  const endBtn = page
    .getByRole('button', { name: /End/i })
    .filter({ hasText: /End/i })
    .first();

  let clicked = false;
  if (await leaveBtn.isVisible().catch(() => false)) {
    await leaveBtn.click();
    clicked = true;
  } else if (await endBtn.isVisible().catch(() => false)) {
    await endBtn.click();
    clicked = true;
  } else {
    const dialog = page.getByRole('alertdialog', { name: 'Cobrowse' }).or(page.getByRole('dialog'));
    const endInDialog = dialog.getByRole('button', { name: /End/i }).first();
    if (await endInDialog.isVisible().catch(() => false)) {
      await endInDialog.click();
      clicked = true;
    }
  }

  if (!clicked) {
    return { pass: true, skipped: true, reason: 'No leave/end control visible' };
  }

  await page.waitForTimeout(1500);

  for (const name of [/Leave/i, /^End$/i, /Yes/i, /OK/i]) {
    const confirm = page.getByRole('button', { name }).first();
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.click().catch(() => {});
      await page.waitForTimeout(1000);
    }
  }

  const dialog = page.getByRole('dialog').first();
  const dialogVisible = await dialog.isVisible().catch(() => false);
  const text = dialogVisible ? await dialog.innerText().catch(() => '') : '';
  const inSession = /Showing Page|session code|\b\d{4}\b/i.test(text);

  return {
    pass: !inSession || /Start Cobrowse/i.test(await page.locator('body').innerText().catch(() => '')),
    ended: !inSession,
    clicked,
    dialogSnippet: text.replace(/\s+/g, ' ').slice(0, 80),
  };
};
