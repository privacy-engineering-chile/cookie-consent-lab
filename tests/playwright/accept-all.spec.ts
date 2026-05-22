import { expect, test } from '@playwright/test';
import { acceptAll, consentRecord, cookieNames, dataLayerEvents, labState, openLab, visibleCookieNames } from './helpers.js';

test('aceptar todo carga scripts autorizados, cookies, evento dataLayer y señales granted', async ({ page }) => {
  const { trackingRequests } = await openLab(page);

  await acceptAll(page);

  await expect.poll(() => cookieNames(page)).toEqual(expect.arrayContaining(['lab_analytics_id', 'lab_marketing_id']));
  await expect.poll(() => visibleCookieNames(page)).toEqual(expect.arrayContaining(['lab_analytics_id', 'lab_marketing_id']));
  await expect.poll(() => trackingRequests.length).toBeGreaterThanOrEqual(2);

  const state = await labState(page);
  const consent = await consentRecord(page);
  expect(consent?.status).toBe('accepted_all');
  expect(consent?.categories.analytics).toBe(true);
  expect(consent?.categories.marketing).toBe(true);
  expect(state?.loadedScripts).toEqual(expect.arrayContaining(['customAnalytics', 'customMarketing']));
  expect(state?.googleSignals.analytics_storage).toBe('granted');
  expect(state?.googleSignals.ad_storage).toBe('granted');

  const events = await dataLayerEvents(page, 'cookie_consent_cl_update');
  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({ consent: { status: 'accepted_all' } });
});
