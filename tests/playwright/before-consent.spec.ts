import { expect, test } from '@playwright/test';
import { expectNoTrackingState, openLab } from './helpers.js';

test('antes de hacer clic no hay cookies no necesarias, scripts ni requests de tracking', async ({ page }) => {
  const { trackingRequests } = await openLab(page);

  await expectNoTrackingState(page);
  expect(trackingRequests).toHaveLength(0);
});

test('Google Consent Mode inicia con señales denied cuando aplica', async ({ page }) => {
  await openLab(page);

  const defaultSignals = await page.evaluate(() => {
    const entry = window.dataLayer.find((item) => Array.isArray(item) && item[0] === 'consent' && item[1] === 'default');
    return Array.isArray(entry) ? entry[2] : null;
  });

  expect(defaultSignals).toMatchObject({
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });
});
