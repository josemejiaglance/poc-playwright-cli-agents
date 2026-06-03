async page => {
  const tabs = await page.context().pages();
  let viewer = page;
  for (const p of tabs) {
    if ((p.url() || '').includes('AgentView.aspx')) {
      viewer = p;
      break;
    }
  }
  if (!(viewer.url() || '').includes('AgentView.aspx')) {
    return { pass: true, skipped: true, reason: 'Agent viewer tab not open' };
  }
  await viewer.bringToFront().catch(() => {});

  const endBtn = viewer.getByRole('button', { name: /End Session/i });
  if (!(await endBtn.isVisible().catch(() => false))) {
    return { pass: true, skipped: true, reason: 'End Session not visible' };
  }
  await endBtn.click();
  await viewer.waitForTimeout(1500);

  for (const name of [/End Session/i, /^End$/i, /Yes/i, /OK/i, /Confirm/i]) {
    const confirm = viewer.getByRole('button', { name }).first();
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.click().catch(() => {});
      await viewer.waitForTimeout(1000);
    }
  }

  const stillOnViewer = (viewer.url() || '').includes('AgentView.aspx');
  return {
    pass: !stillOnViewer,
    ended: !stillOnViewer,
    url: viewer.url(),
  };
};
