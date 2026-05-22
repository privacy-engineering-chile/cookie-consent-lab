import { expect, type Page, type Request } from '@playwright/test';

export async function openLab(page: Page) {
  const trackingRequests: Request[] = [];

  page.on('request', (request) => {
    const url = request.url();
    if (
      url.includes('/mock-tracking/') ||
      url.includes('googletagmanager.com') ||
      url.includes('facebook.net') ||
      url.includes('static.hotjar.com')
    ) {
      trackingRequests.push(request);
    }
  });

  await page.goto('/');
  await expect.poll(() => page.evaluate(() => {
    const api = window.CookieConsentCL;
    return Boolean(api && ('init' in api || api.CookieConsentCL?.init || api.default?.init));
  })).toBe(true);
  await expect(page.locator('#cccl-banner')).toBeVisible();
  await expect(page.locator('[data-vendor-config-form]')).toBeVisible();
  await expect(page.locator('[data-lab-state]')).toBeVisible();

  return { trackingRequests };
}

export async function labState(page: Page) {
  return page.evaluate(() => window.__COOKIE_CONSENT_LAB_STATE__);
}

export async function consentRecord(page: Page) {
  return page.evaluate(() => {
    const api = window.CookieConsentCL;
    const cookieConsent = api && 'getConsent' in api ? api : api?.CookieConsentCL ?? api?.default;
    return cookieConsent?.getConsent() ?? null;
  });
}

export async function acceptAll(page: Page) {
  await page.getByRole('button', { name: 'Aceptar todas las cookies' }).click();
}

export async function rejectNonEssential(page: Page) {
  await page.getByRole('button', { name: 'Rechazar todas las cookies no necesarias' }).click();
}

export async function saveGranularConsent(page: Page, categories: { analytics?: boolean; marketing?: boolean; functional?: boolean }) {
  await page.getByRole('button', { name: 'Configurar preferencias de cookies' }).click();

  const categoryLabels = {
    analytics: 'Analítica',
    marketing: 'Marketing',
    functional: 'Preferencias'
  };

  for (const [category, enabled] of Object.entries(categories)) {
    const checkbox = page.getByRole('checkbox', { name: categoryLabels[category as keyof typeof categoryLabels] });
    if (enabled) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  }

  await page.getByRole('button', { name: 'Guardar preferencias de cookies' }).click();
}

export async function reopenPreferences(page: Page) {
  await page.evaluate(() => {
    const api = window.CookieConsentCL;
    const cookieConsent = api && 'openPreferences' in api ? api : api?.CookieConsentCL ?? api?.default;
    cookieConsent?.openPreferences();
  });
  await expect(page.locator('#cccl-modal-root')).toBeVisible();
}

export async function cookies(page: Page) {
  return page.context().cookies();
}

export async function cookieNames(page: Page) {
  return (await cookies(page)).map((cookie) => cookie.name);
}

export async function visibleCookieNames(page: Page) {
  return page.locator('[data-lab-cookie-list] [data-cookie-name]').evaluateAll((items) =>
    items.map((item) => item.getAttribute('data-cookie-name')).filter(Boolean)
  );
}

export async function dataLayerEvents(page: Page, eventName: string): Promise<Array<Record<string, unknown>>> {
  return page.evaluate((name) => {
    return window.dataLayer.filter((entry): entry is Record<string, unknown> => {
      return typeof entry === 'object' && entry !== null && 'event' in entry && entry.event === name;
    });
  }, eventName);
}

export async function saveVendorIds(page: Page, ids: { googleTagId?: string; gtmId?: string; metaPixelId?: string; hotjarId?: string }) {
  if (ids.googleTagId) {
    await page.getByLabel('GOOGLE_TAG_ID').fill(ids.googleTagId);
  }
  if (ids.gtmId) {
    await page.getByLabel('GTM_ID').fill(ids.gtmId);
  }
  if (ids.metaPixelId) {
    await page.getByLabel('META_PIXEL_ID').fill(ids.metaPixelId);
  }
  if (ids.hotjarId) {
    await page.getByLabel('HOTJAR_ID').fill(ids.hotjarId);
  }

  await page.getByRole('button', { name: 'Guardar configuración' }).click();
}

export async function allowRealVendorTraffic(page: Page) {
  await page.getByLabel('Permitir tráfico real de vendors').check();
  await page.getByRole('button', { name: 'Guardar configuración' }).click();
}

export async function expectNoTrackingState(page: Page) {
  await expect.poll(() => cookieNames(page)).not.toContain('lab_analytics_id');
  await expect.poll(() => cookieNames(page)).not.toContain('lab_marketing_id');
  await expect.poll(() => visibleCookieNames(page)).not.toContain('lab_analytics_id');
  await expect.poll(() => visibleCookieNames(page)).not.toContain('lab_marketing_id');
  await expect(page.locator('[data-lab-cookie-list]')).toContainText('No se observaron cookies');

  const state = await labState(page);
  expect(state?.loadedScripts).toEqual([]);
  expect(state?.googleSignals.analytics_storage).toBe('denied');
  expect(state?.googleSignals.ad_storage).toBe('denied');
  expect(state?.googleSignals.ad_user_data).toBe('denied');
  expect(state?.googleSignals.ad_personalization).toBe('denied');

  const consent = await consentRecord(page);
  expect(consent).toBeNull();
}
