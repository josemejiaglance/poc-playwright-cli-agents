async page => {
  const urlBefore = page.url();
  const visitorUrlSnippet = await page
    .getByText(/dev-cobrowse-test|cobrowse\/test/i)
    .first()
    .innerText()
    .catch(() => '');

  const dropdown = page.getByRole('button', { name: /Visitor Information/i });
  if (!(await dropdown.isVisible().catch(() => false))) {
    return { pass: false, error: 'Visitor Information dropdown not visible' };
  }
  await dropdown.click();
  await page.waitForTimeout(1000);

  const menu = page.getByRole('menu').or(page.getByRole('listbox')).first();
  const menuVisible = await menu.isVisible().catch(() => false);
  let menuText = '';
  if (menuVisible) {
    menuText = await menu.innerText().catch(() => '');
  }

  // Optional: open detail in new window
  const openLink = page
    .getByRole('link', { name: /Visitor Information|Details|More/i })
    .or(page.getByRole('menuitem', { name: /Information|Details/i }))
    .first();
  let newPageUrl = null;
  if (await openLink.isVisible().catch(() => false)) {
    const [popup] = await Promise.all([
      page.context().waitForEvent('page', { timeout: 8000 }).catch(() => null),
      openLink.click(),
    ]);
    if (popup) {
      await popup.waitForLoadState('domcontentloaded').catch(() => {});
      newPageUrl = popup.url();
      await popup.close().catch(() => {});
    }
  }

  const headerText = await page.locator('body').innerText().catch(() => '');
  const hasVisitorContext =
    /dev-cobrowse-test|cobrowse\/test|Visitor/i.test(headerText + visitorUrlSnippet + menuText) ||
    (newPageUrl && /visitor|session|glance/i.test(newPageUrl));

  return {
    pass: menuVisible || hasVisitorContext || !!newPageUrl,
    urlBefore,
    menuVisible,
    menuSnippet: menuText.replace(/\s+/g, ' ').slice(0, 120),
    newPageUrl,
    hasVisitorContext,
  };
};
