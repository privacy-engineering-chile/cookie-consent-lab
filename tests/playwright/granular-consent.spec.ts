import { expect, test } from '@playwright/test';
import { consentRecord, cookieNames, labState, openLab, saveGranularConsent, visibleCookieNames } from './helpers.js';

test('solo analítica activa analítica pero no marketing', async ({ page }) => {
  await openLab(page);

  await saveGranularConsent(page, { analytics: true, marketing: false, functional: false });

  await expect.poll(() => cookieNames(page)).toContain('lab_analytics_id');
  await expect.poll(() => cookieNames(page)).not.toContain('lab_marketing_id');
  await expect.poll(() => visibleCookieNames(page)).toContain('lab_analytics_id');
  await expect.poll(() => visibleCookieNames(page)).not.toContain('lab_marketing_id');

  const state = await labState(page);
  const consent = await consentRecord(page);
  expect(consent?.status).toBe('custom');
  expect(consent?.categories.analytics).toBe(true);
  expect(consent?.categories.marketing).toBe(false);
  expect(state?.loadedScripts).toContain('customAnalytics');
  expect(state?.loadedScripts).not.toContain('customMarketing');
  expect(state?.googleSignals.analytics_storage).toBe('granted');
  expect(state?.googleSignals.ad_storage).toBe('denied');
});

test('solo marketing activa marketing pero no analítica', async ({ page }) => {
  await openLab(page);

  await saveGranularConsent(page, { analytics: false, marketing: true, functional: false });

  await expect.poll(() => cookieNames(page)).toContain('lab_marketing_id');
  await expect.poll(() => cookieNames(page)).not.toContain('lab_analytics_id');
  await expect.poll(() => visibleCookieNames(page)).toContain('lab_marketing_id');
  await expect.poll(() => visibleCookieNames(page)).not.toContain('lab_analytics_id');

  const state = await labState(page);
  const consent = await consentRecord(page);
  expect(consent?.status).toBe('custom');
  expect(consent?.categories.analytics).toBe(false);
  expect(consent?.categories.marketing).toBe(true);
  expect(state?.loadedScripts).toContain('customMarketing');
  expect(state?.loadedScripts).not.toContain('customAnalytics');
  expect(state?.googleSignals.analytics_storage).toBe('denied');
  expect(state?.googleSignals.ad_storage).toBe('granted');
});
