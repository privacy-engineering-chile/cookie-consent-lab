import { expect, test } from '@playwright/test';
import { acceptAll, allowRealVendorTraffic, labState, openLab, saveGranularConsent, saveVendorIds } from './helpers.js';

test('la UI permite guardar IDs sin disparar tráfico real cuando el opt-in está apagado', async ({ page }) => {
  const { trackingRequests } = await openLab(page);

  await saveVendorIds(page, {
    googleTagId: 'G-TEST123',
    gtmId: 'GTM-TEST123',
    metaPixelId: '123456789',
    hotjarId: '1111111'
  });

  expect(trackingRequests).toHaveLength(0);

  const saved = await page.evaluate(() => localStorage.getItem('cookie-consent-lab:vendor-config'));
  expect(saved).toContain('G-TEST123');
  expect(saved).toContain('"allowRealTraffic":false');
});

test('con opt-in real, un ID configurado genera request real solo después del consentimiento', async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (route) => route.abort());
  const { trackingRequests } = await openLab(page);

  await saveVendorIds(page, { googleTagId: 'G-TEST123' });
  await allowRealVendorTraffic(page);

  expect(trackingRequests).toHaveLength(0);

  await saveGranularConsent(page, { analytics: true, marketing: false, functional: false });

  await expect.poll(() => trackingRequests.some((request) => request.url().includes('googletagmanager.com/gtag/js'))).toBe(true);

  const state = await labState(page);
  expect(state?.requests).toContain('https://www.googletagmanager.com/gtag/js?id=G-TEST123');
});

test('limpiar configuración restaura mocks seguros', async ({ page }) => {
  await openLab(page);

  await saveVendorIds(page, { googleTagId: 'G-TEST123' });
  await allowRealVendorTraffic(page);
  await page.getByRole('button', { name: 'Limpiar configuración' }).click();
  await acceptAll(page);

  const state = await labState(page);
  expect(state?.config.allowRealTraffic).toBe(false);
  expect(state?.requests).toContain('/mock-tracking/google-tag');
});
