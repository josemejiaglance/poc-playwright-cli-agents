/**
 * Playwright-cli run-code validators for Glance cobrowse assertions.
 * Each export is an async (page) => result function body (without wrapper).
 */

export const visitorSessionCode = `async page => {
  const dialog = page.getByRole('alertdialog', { name: 'Cobrowse' }).or(page.getByRole('dialog'));
  const visible = await dialog.first().isVisible().catch(() => false);
  const text = visible ? await dialog.first().innerText() : '';
  const codeMatch = text.match(/\\b(\\d{4})\\b/);
  return {
    pass: !!codeMatch,
    sessionCode: codeMatch ? codeMatch[1] : null,
    snippet: text.replace(/\\s+/g, ' ').slice(0, 120),
  };
}`;

export const visitorInSession = `async page => {
  const dialog = page.getByRole('dialog').first();
  const text = await dialog.innerText().catch(() => '');
  const pass = /Showing Page|in.?session/i.test(text);
  return { pass, snippet: text.replace(/\\s+/g, ' ').slice(0, 100) };
}`;

export const visitorVideoPlayer = `async page => {
  const cobrowseBtn = page.getByRole('button', { name: 'Cobrowse' }).first();
  if (await cobrowseBtn.isVisible().catch(() => false)) {
    await cobrowseBtn.click().catch(() => {});
    await page.waitForTimeout(1000);
  }
  const deadline = Date.now() + 15000;
  let vp = null;
  while (Date.now() < deadline) {
    vp = page.frames().find(f => /VideoPlayer|videoplayer/i.test(f.url()));
    if (vp) break;
    await page.waitForTimeout(500);
  }
  return {
    pass: !!vp,
    url: vp ? vp.url().slice(0, 100) : null,
    waiting: vp ? (await vp.locator('body').innerText()).includes('Waiting') : null,
  };
}`;

export const agentVideoButtonVisible = `async page => {
  const btn = page.getByRole('button', { name: /Agent Video/i });
  const pass = await btn.isVisible().catch(() => false);
  return { pass, visible: pass };
}`;

export const agentVideoStreaming = `async page => {
  const errors = [];
  await page.context().grantPermissions(['camera', 'microphone']);
  const findAgentVideo = async () => {
    const frame = page.frames().find(
      (f) =>
        /VideoPlayer|videoplayer|glance_video/i.test(f.url()) ||
        /video/i.test(f.name() || '')
    );
    if (frame) return frame;
    const videoRegion = page.locator('[class*="video"], [id*="video"], iframe').first();
    if (await videoRegion.isVisible().catch(() => false)) {
      return { url: () => 'agent-video-region' };
    }
    return null;
  };
  let agentVideoFrame = await findAgentVideo();
  const btn = page.getByRole('button', { name: /Agent Video/i });
  if (!(await btn.isVisible().catch(() => false))) {
    return { pass: false, error: 'Agent Video button not visible' };
  }
  if (!agentVideoFrame) {
    await btn.click();
    await page.waitForTimeout(1500);
  }
  for (const name of [/Start/i, /Share/i, /Begin/i, /OK/i, /Continue/i]) {
    const action = page.getByRole('button', { name }).filter({ hasNotText: /End Session/i });
    const first = action.first();
    if (await first.isVisible().catch(() => false)) {
      await first.click().catch(() => {});
      await page.waitForTimeout(1000);
    }
  }
  const deadline = Date.now() + 30000;
  while (!agentVideoFrame && Date.now() < deadline) {
    agentVideoFrame = await findAgentVideo();
    if (!agentVideoFrame) await page.waitForTimeout(500);
  }
  const bodyText = await page.locator('body').innerText().catch(() => '');
  if (/USENWAYVIDEOSESSIONS|not enabled/i.test(bodyText)) {
    errors.push('USENWAYVIDEOSESSIONS — enable n-way video for group');
  }
  if (/ERR_NO_NWAYVIDEO_SETTINGS/i.test(bodyText)) {
    errors.push('ERR_NO_NWAYVIDEO_SETTINGS — visitor n-way video not configured');
  }
  const pass = !!agentVideoFrame && errors.length === 0;
  return {
    pass,
    errors,
    agentVideo: !!agentVideoFrame,
    frames: page.frames().map((f) => f.url()).filter((u) => u && !u.startsWith('about:')),
  };
}`;

export const visitorVideoStreaming = `async page => {
  await page.context().grantPermissions(['camera', 'microphone']);
  const cobrowseBtn = page.getByRole('button', { name: 'Cobrowse' }).first();
  if (await cobrowseBtn.isVisible().catch(() => false)) {
    await cobrowseBtn.click().catch(() => {});
    await page.waitForTimeout(1500);
  }
  const dialog = page.getByRole('dialog').first();
  const deadline = Date.now() + 60000;
  let vp = null;
  let bodyText = '';
  while (Date.now() < deadline) {
    vp = page.frames().find((f) => /VideoPlayer|videoplayer/i.test(f.url()));
    if (vp) {
      bodyText = await vp.locator('body').innerText().catch(() => '');
      const waitingVisible = await vp
        .getByText(/^\\s*waiting\\s*$/i)
        .first()
        .isVisible()
        .catch(() => false);
      if (!waitingVisible) break;
    }
    await page.waitForTimeout(1000);
  }
  const dialogText = await dialog.innerText().catch(() => '');
  const waitingVisible = vp
    ? await vp
        .getByText(/^\\s*waiting\\s*$/i)
        .first()
        .isVisible()
        .catch(() => false)
    : false;
  const pass = !!vp && !waitingVisible;
  return {
    pass,
    url: vp ? vp.url().slice(0, 120) : null,
    waiting: waitingVisible,
    bodySnippet: bodyText.replace(/\\s+/g, ' ').slice(0, 80),
    dialogSnippet: dialogText.replace(/\\s+/g, ' ').slice(0, 100),
    frames: page.frames().map((f) => f.url()).filter((u) => u && !u.startsWith('about:')),
  };
}`;

export const agentViewerSession = `async (page, expects = {}) => {
  const url = page.url();
  const sessionKey = (url.match(/SessionKey=([^&]+)/) || [])[1];
  const groupId = (url.match(/groupid=([^&]+)/) || [])[1];
  const title = await page.title();
  const pass =
    url.includes('AgentView.aspx') &&
    !!sessionKey &&
    title.includes(sessionKey) &&
    (!expects.groupId || groupId === String(expects.groupId));
  return {
    pass,
    url,
    sessionKey,
    groupId,
    title,
    expectedGroupId: expects.groupId ?? null,
  };
}`;

export const agentViewerCobrowseMirror = `async (page, expects = {}) => {
  const pageFrame = page.frames().find(f => f.name() === 'pageframe');
  const cobrowseTitle = pageFrame
    ? await pageFrame.locator('h1').first().textContent().catch(() => null)
    : null;
  const expected = expects.cobrowseTitle || 'Cobrowse Tests';
  const pass = cobrowseTitle === expected;
  return { pass, cobrowseTitle, expected };
}`;

export const grantMediaPermissions = `async page => {
  const origins = [
    'https://www.myglance.net',
    'https://dev-cobrowse-test.myglance.net',
    'https://cdn.myglance.net',
    'https://staging-video-A-1.myglance.net',
  ];
  await page.context().grantPermissions(['camera', 'microphone']);
  const c = await page.context().newCDPSession(page);
  for (const origin of origins) {
    try {
      await c.send('Browser.setPermission', {
        permission: { name: 'videoCapture' },
        setting: 'granted',
        origin,
      });
      await c.send('Browser.setPermission', {
        permission: { name: 'audioCapture' },
        setting: 'granted',
        origin,
      });
    } catch (_) {}
  }
  return { pass: true, origins };
}`;

export const validatorMap = {
  'visitor-session-code': visitorSessionCode,
  'visitor-in-session': visitorInSession,
  'visitor-video-player': visitorVideoPlayer,
  'visitor-video-streaming': visitorVideoStreaming,
  'agent-video-button-visible': agentVideoButtonVisible,
  'agent-video-streaming': agentVideoStreaming,
  'agent-viewer-session': agentViewerSession,
  'agent-viewer-cobrowse-mirror': agentViewerCobrowseMirror,
  'grant-media': grantMediaPermissions,
};
