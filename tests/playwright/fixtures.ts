export { expect, test } from '@playwright/test';

export const cobrowseEnv = {
  groupId: process.env.COBROWSE_GROUP_ID ?? '21552',
  webServer: process.env.COBROWSE_WEB_SERVER ?? 'www.myglance.net',
  cdn: process.env.COBROWSE_CDN ?? 'cdn.myglance.net',
  visitorUrl:
    process.env.COBROWSE_VISITOR_URL ??
    'https://dev-cobrowse-test.myglance.net/cobrowse/test',
  settingsUrl:
    process.env.COBROWSE_SETTINGS_URL ??
    'https://dev-cobrowse-test.myglance.net/cobrowse/test/TestPageSettings',
  agentLoginUrl:
    process.env.COBROWSE_AGENT_LOGIN_URL ??
    'https://www.myglance.net/login/default.aspx',
};
