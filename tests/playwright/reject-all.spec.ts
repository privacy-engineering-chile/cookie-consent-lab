import { expect, test } from '@playwright/test';
import { consentRecord, cookieNames, labState, openLab, rejectNonEssential, visibleCookieNames } from './helpers.js';

test('rechazar todo mantiene analítica y marketing bloqueados', async ({ page }) => {
  const { trackingRequests } = await openLab(page);

  await rejectNonEssential(page);

  await expect.poll(() => cookieNames(page)).not.toContain('lab_analytics_id');
  await expect.poll(() => cookieNames(page)).not.toContain('lab_marketing_id');
  await expect.poll(() => visibleCookieNames(page)).not.toContain('lab_analytics_id');
  await expect.poll(() => visibleCookieNames(page)).not.toContain('lab_marketing_id');
  expect(trackingRequests).toHaveLength(0);

  const state = await labState(page);
  const consent = await consentRecord(page);
  expect(consent?.status).toBe('rejected_non_essential');
  expect(consent?.categories.analytics).toBe(false);
  expect(consent?.categories.marketing).toBe(false);
  expect(state?.loadedScripts).toEqual([]);
  expect(state?.googleSignals.analytics_storage).toBe('denied');
  expect(state?.googleSignals.ad_storage).toBe('denied');
});
