import { expect, test } from '@playwright/test';
import {
  acceptAll,
  consentRecord,
  cookieNames,
  dataLayerEvents,
  labState,
  openLab,
  reopenPreferences,
  visibleCookieNames
} from './helpers.js';

test('cambiar preferencias actualiza el estado y bloquea scripts futuros no autorizados', async ({ page }) => {
  await openLab(page);

  await acceptAll(page);
  await expect.poll(() => cookieNames(page)).toEqual(expect.arrayContaining(['lab_analytics_id', 'lab_marketing_id']));

  await reopenPreferences(page);
  await page.getByRole('checkbox', { name: 'Marketing' }).uncheck();
  await page.getByRole('button', { name: 'Guardar preferencias de cookies' }).click();

  await expect.poll(() => cookieNames(page)).toContain('lab_analytics_id');
  await expect.poll(() => cookieNames(page)).not.toContain('lab_marketing_id');
  await expect.poll(() => visibleCookieNames(page)).toContain('lab_analytics_id');
  await expect.poll(() => visibleCookieNames(page)).not.toContain('lab_marketing_id');
  await expect(page.locator('#lab-marketing-script')).toHaveCount(0);

  const state = await labState(page);
  const consent = await consentRecord(page);
  expect(consent?.status).toBe('custom');
  expect(consent?.categories.marketing).toBe(false);
  expect(consent?.categories.analytics).toBe(true);
  expect(state?.consent.marketing).toBe(false);
  expect(state?.consent.analytics).toBe(true);
  expect(state?.googleSignals.ad_storage).toBe('denied');

  const events = await dataLayerEvents(page, 'cookie_consent_cl_update');
  expect(events.map((event) => (event.consent as { status: string }).status)).toEqual(['accepted_all', 'custom']);
});
