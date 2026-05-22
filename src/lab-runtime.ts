type ConsentCategory = 'necessary' | 'analytics' | 'marketing' | 'functional';
type ConsentState = Record<ConsentCategory, boolean>;
type VendorKey = 'googleTag' | 'gtm' | 'metaPixel' | 'hotjar' | 'customAnalytics' | 'customMarketing';

type VendorConfig = Record<VendorKey, { enabled: boolean; id: string }>;

type LabConfig = {
  allowRealTraffic: boolean;
  vendors: VendorConfig;
};

type VendorDefinition = {
  key: VendorKey;
  label: string;
  category: ConsentCategory;
  cookieName: string;
  storageKey: string;
  scriptId: string;
  mockPath: string;
  idLabel?: string;
  placeholder?: string;
  realUrl?: (id: string) => string;
};

type LabCookie = {
  name: string;
  value: string;
};

type ConsentRecord = {
  consentId: string;
  siteId: string;
  createdAt: string;
  updatedAt: string;
  language: string;
  policyVersion: string;
  bannerVersion: string;
  categories: ConsentState;
  status: 'accepted_all' | 'rejected_non_essential' | 'custom';
};

type ConsentUpdateEvent = {
  event: 'cookie_consent_cl_update';
  consent: ConsentRecord;
};

type CookieConsentCL = {
  init: (config: {
    siteId: string;
    language?: string;
    policyVersion: string;
    bannerVersion: string;
    dataLayerEventName?: string;
    ethicalMode?: boolean;
    position?: 'center' | 'bottom' | 'top' | 'bottom-left' | 'bottom-right';
    theme?: {
      primaryColor?: string;
      backgroundColor?: string;
      textColor?: string;
      fontFamily?: string;
    };
    background?: {
      enabled?: boolean;
      opacity?: number;
      blur?: number;
    };
    cookieIcon?: {
      enabled?: boolean;
      position?: 'bottom-left' | 'bottom-right';
      colorScheme?: 'primary-on-background' | 'background-on-primary' | 'background-on-text' | 'text-on-background';
    };
    animation?: {
      enabled?: boolean;
      type?: 'cookie-comet';
    };
    categories: Array<{
      id: ConsentCategory;
      label: string;
      description: string;
      required?: boolean;
      defaultValue?: boolean;
      googleConsentMode?: string[];
    }>;
    cookies: Array<{
      name: string;
      provider: string;
      category: ConsentCategory;
      duration: string;
      purpose: string;
    }>;
    text?: {
      bannerTitle?: string;
      bannerDescription?: string;
      acceptAll?: string;
      acceptAllAriaLabel?: string;
      rejectNonEssential?: string;
      rejectNonEssentialAriaLabel?: string;
      configure?: string;
      configureAriaLabel?: string;
      savePreferences?: string;
      savePreferencesAriaLabel?: string;
      preferencesTitle?: string;
      preferencesDescription?: string;
      changePreferences?: string;
    };
    onConsentChange?: (consent: ConsentRecord) => void;
  }) => void;
  openPreferences: () => void;
  getConsent: () => ConsentRecord | null;
  acceptAll: () => ConsentRecord;
  rejectNonEssential: () => ConsentRecord;
  updatePreferences: (categories: Partial<ConsentState>) => ConsentRecord;
  resetConsent: () => void;
};

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    CookieConsentCL?: CookieConsentCL | { CookieConsentCL?: CookieConsentCL; default?: CookieConsentCL };
    __COOKIE_CONSENT_LAB_STATE__?: {
      config: LabConfig;
      consent: ConsentState;
      consentRecord: ConsentRecord | null;
      loadedScripts: string[];
      requests: string[];
      googleSignals: Record<string, string>;
      cookies: LabCookie[];
      lastConsentEvent: ConsentUpdateEvent | null;
    };
  }
}

const CONFIG_STORAGE_KEY = 'cookie-consent-lab:vendor-config';
const consent: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
  functional: false
};

const vendorDefinitions: VendorDefinition[] = [
  {
    key: 'googleTag',
    label: 'Google Tag',
    category: 'analytics',
    cookieName: 'lab_google_tag_id',
    storageKey: 'lab:google-tag',
    scriptId: 'lab-google-tag-script',
    mockPath: '/mock-tracking/google-tag',
    idLabel: 'GOOGLE_TAG_ID',
    placeholder: 'G-XXXXXXXXXX',
    realUrl: (id) => `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
  },
  {
    key: 'gtm',
    label: 'Google Tag Manager',
    category: 'analytics',
    cookieName: 'lab_gtm_id',
    storageKey: 'lab:gtm',
    scriptId: 'lab-gtm-script',
    mockPath: '/mock-tracking/gtm',
    idLabel: 'GTM_ID',
    placeholder: 'GTM-XXXXXXX',
    realUrl: (id) => `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`
  },
  {
    key: 'metaPixel',
    label: 'Meta Pixel',
    category: 'marketing',
    cookieName: 'lab_meta_pixel_id',
    storageKey: 'lab:meta-pixel',
    scriptId: 'lab-meta-pixel-script',
    mockPath: '/mock-tracking/meta-pixel',
    idLabel: 'META_PIXEL_ID',
    placeholder: '000000000000000',
    realUrl: () => 'https://connect.facebook.net/en_US/fbevents.js'
  },
  {
    key: 'hotjar',
    label: 'Hotjar',
    category: 'analytics',
    cookieName: 'lab_hotjar_id',
    storageKey: 'lab:hotjar',
    scriptId: 'lab-hotjar-script',
    mockPath: '/mock-tracking/hotjar',
    idLabel: 'HOTJAR_ID',
    placeholder: '0000000',
    realUrl: (id) => `https://static.hotjar.com/c/hotjar-${encodeURIComponent(id)}.js?sv=6`
  },
  {
    key: 'customAnalytics',
    label: 'Script propio de analítica',
    category: 'analytics',
    cookieName: 'lab_analytics_id',
    storageKey: 'lab:analytics',
    scriptId: 'lab-analytics-script',
    mockPath: '/mock-tracking/analytics'
  },
  {
    key: 'customMarketing',
    label: 'Script propio de marketing',
    category: 'marketing',
    cookieName: 'lab_marketing_id',
    storageKey: 'lab:marketing',
    scriptId: 'lab-marketing-script',
    mockPath: '/mock-tracking/marketing'
  }
];

const defaultConfig: LabConfig = {
  allowRealTraffic: false,
  vendors: Object.fromEntries(vendorDefinitions.map((vendor) => [vendor.key, { enabled: true, id: '' }])) as VendorConfig
};

const googleSignals = {
  security_storage: 'granted',
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied'
};

window.dataLayer = window.dataLayer ?? [];
window.gtag = (...args: unknown[]) => {
  const [command, type, signals] = args;
  if (command === 'consent' && (type === 'default' || type === 'update') && signals && typeof signals === 'object') {
    Object.assign(googleSignals, signals);
  }

  window.dataLayer.push(args);
};

let labConfig = loadConfig();

window.__COOKIE_CONSENT_LAB_STATE__ = {
  config: labConfig,
  consent,
  consentRecord: null,
  loadedScripts: [],
  requests: [],
  googleSignals,
  cookies: [],
  lastConsentEvent: null
};

function getCookieConsentApi(): CookieConsentCL | null {
  const globalApi = window.CookieConsentCL;

  if (!globalApi) {
    return null;
  }

  if ('init' in globalApi && typeof globalApi.init === 'function') {
    return globalApi;
  }

  if ('CookieConsentCL' in globalApi && globalApi.CookieConsentCL) {
    return globalApi.CookieConsentCL;
  }

  if ('default' in globalApi && globalApi.default) {
    return globalApi.default;
  }

  return null;
}

function requireCookieConsentApi(): CookieConsentCL {
  const api = getCookieConsentApi();
  if (!api) {
    throw new Error('CookieConsentCL debe cargarse antes de lab-runtime.js');
  }

  return api;
}

function loadConfig(): LabConfig {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!saved) {
      return structuredClone(defaultConfig);
    }

    const parsed = JSON.parse(saved) as Partial<LabConfig>;
    return {
      allowRealTraffic: Boolean(parsed.allowRealTraffic),
      vendors: Object.fromEntries(
        vendorDefinitions.map((vendor) => {
          const savedVendor = parsed.vendors?.[vendor.key];
          return [
            vendor.key,
            {
              enabled: savedVendor?.enabled ?? true,
              id: savedVendor?.id ?? ''
            }
          ];
        })
      ) as VendorConfig
    };
  } catch {
    return structuredClone(defaultConfig);
  }
}

function saveConfig(config: LabConfig) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; SameSite=Lax`;
}

function expireCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function parseCookies(): LabCookie[] {
  if (!document.cookie) {
    return [];
  }

  return document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .map((cookie) => {
      const [rawName, ...rawValue] = cookie.split('=');
      return {
        name: decodeURIComponent(rawName ?? ''),
        value: decodeURIComponent(rawValue.join('='))
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function activeUrlFor(vendor: VendorDefinition, config: LabConfig) {
  const vendorConfig = config.vendors[vendor.key];
  if (config.allowRealTraffic && vendor.realUrl && vendorConfig.id.trim()) {
    return {
      mode: 'real',
      url: vendor.realUrl(vendorConfig.id.trim())
    };
  }

  return {
    mode: 'mock',
    url: vendor.mockPath
  };
}

async function loadVendor(vendor: VendorDefinition) {
  const vendorConfig = labConfig.vendors[vendor.key];
  if (!vendorConfig.enabled || !consent[vendor.category] || document.getElementById(vendor.scriptId)) {
    return;
  }

  const target = activeUrlFor(vendor, labConfig);
  const script = document.createElement('script');
  script.id = vendor.scriptId;
  script.dataset.category = vendor.category;
  script.dataset.vendor = vendor.key;
  script.dataset.mode = target.mode;
  script.textContent = `window.__COOKIE_CONSENT_LAB_STATE__.loadedScripts.push('${vendor.key}');`;
  document.head.append(script);

  setCookie(vendor.cookieName, target.mode);
  localStorage.setItem(vendor.storageKey, target.mode);
  window.__COOKIE_CONSENT_LAB_STATE__?.requests.push(target.url);
  window.dataLayer.push({
    event: 'cookie_consent_lab_vendor_loaded',
    vendor: vendor.key,
    category: vendor.category,
    mode: target.mode
  });

  await fetch(target.url, { mode: target.mode === 'real' ? 'no-cors' : 'same-origin' }).catch(() => undefined);
}

function unloadForbiddenVendors() {
  for (const vendor of vendorDefinitions) {
    if (labConfig.vendors[vendor.key].enabled && consent[vendor.category]) {
      continue;
    }

    document.getElementById(vendor.scriptId)?.remove();
    expireCookie(vendor.cookieName);
    localStorage.removeItem(vendor.storageKey);
  }
}

function applyConsentRecord(record: ConsentRecord | null) {
  Object.assign(consent, {
    necessary: true,
    analytics: Boolean(record?.categories.analytics),
    marketing: Boolean(record?.categories.marketing),
    functional: Boolean(record?.categories.functional)
  });

  window.__COOKIE_CONSENT_LAB_STATE__!.consentRecord = record;
}

async function syncVendorsFromConsent(record: ConsentRecord | null) {
  applyConsentRecord(record);
  unloadForbiddenVendors();

  for (const vendor of vendorDefinitions) {
    await loadVendor(vendor);
  }

  renderAll();
}

function input(name: string, value: string) {
  const element = document.createElement('input');
  element.name = name;
  element.value = value;
  element.autocomplete = 'off';
  return element;
}

function checkbox(name: string, checked: boolean) {
  const element = document.createElement('input');
  element.type = 'checkbox';
  element.name = name;
  element.checked = checked;
  return element;
}

function renderVendorConfigForm() {
  const form = document.querySelector<HTMLFormElement>('[data-vendor-config-form]');
  if (!form) {
    return;
  }

  form.replaceChildren();

  const realTraffic = document.createElement('label');
  realTraffic.className = 'lab-toggle lab-toggle--real';
  realTraffic.append(
    checkbox('allowRealTraffic', labConfig.allowRealTraffic),
    document.createElement('span')
  );
  realTraffic.querySelector('span')!.textContent = 'Permitir tráfico real de vendors';
  form.append(realTraffic);

  const grid = document.createElement('div');
  grid.className = 'vendor-grid';

  for (const vendor of vendorDefinitions) {
    const vendorConfig = labConfig.vendors[vendor.key];
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'vendor-card';
    fieldset.dataset.vendorKey = vendor.key;

    const legend = document.createElement('legend');
    legend.textContent = vendor.label;

    const enabled = document.createElement('label');
    enabled.className = 'lab-toggle';
    enabled.append(checkbox(`${vendor.key}:enabled`, vendorConfig.enabled), document.createElement('span'));
    enabled.querySelector('span')!.textContent = 'Habilitado';

    fieldset.append(legend, enabled);

    if (vendor.idLabel) {
      const idLabel = document.createElement('label');
      idLabel.className = 'lab-field';
      const labelText = document.createElement('span');
      labelText.textContent = vendor.idLabel;
      const field = input(`${vendor.key}:id`, vendorConfig.id);
      field.placeholder = vendor.placeholder ?? '';
      idLabel.append(labelText, field);
      fieldset.append(idLabel);
    } else {
      const note = document.createElement('p');
      note.className = 'lab-muted';
      note.textContent = 'Mock local para validar scripts propios.';
      fieldset.append(note);
    }

    grid.append(fieldset);
  }

  const actions = document.createElement('div');
  actions.className = 'lab-actions';

  const save = document.createElement('button');
  save.type = 'submit';
  save.textContent = 'Guardar configuración';

  const resetConsent = document.createElement('button');
  resetConsent.type = 'button';
  resetConsent.textContent = 'Reiniciar consentimiento';
  resetConsent.dataset.action = 'reset-consent';

  const clear = document.createElement('button');
  clear.type = 'button';
  clear.textContent = 'Limpiar configuración';
  clear.dataset.action = 'clear-config';

  actions.append(save, resetConsent, clear);
  form.append(grid, actions);
}

function configFromForm(form: HTMLFormElement): LabConfig {
  const formData = new FormData(form);
  return {
    allowRealTraffic: formData.get('allowRealTraffic') === 'on',
    vendors: Object.fromEntries(
      vendorDefinitions.map((vendor) => [
        vendor.key,
        {
          enabled: formData.get(`${vendor.key}:enabled`) === 'on',
          id: String(formData.get(`${vendor.key}:id`) ?? '').trim()
        }
      ])
    ) as VendorConfig
  };
}

function installConfigHandlers(cookieConsent: CookieConsentCL) {
  const form = document.querySelector<HTMLFormElement>('[data-vendor-config-form]');
  if (!form) {
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    labConfig = configFromForm(form);
    window.__COOKIE_CONSENT_LAB_STATE__!.config = labConfig;
    saveConfig(labConfig);
    void syncVendorsFromConsent(cookieConsent.getConsent());
  });

  form.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.dataset.action === 'reset-consent') {
      cookieConsent.resetConsent();
      void syncVendorsFromConsent(null);
    }

    if (target.dataset.action === 'clear-config') {
      localStorage.removeItem(CONFIG_STORAGE_KEY);
      labConfig = structuredClone(defaultConfig);
      window.__COOKIE_CONSENT_LAB_STATE__!.config = labConfig;
      renderVendorConfigForm();
      void syncVendorsFromConsent(cookieConsent.getConsent());
    }
  });
}

function createPanelSection(title: string, attribute: string) {
  const section = document.createElement('section');
  section.className = 'lab-panel__section';

  const heading = document.createElement('h2');
  heading.textContent = title;

  const body = document.createElement('div');
  body.setAttribute(attribute, '');

  section.append(heading, body);
  return section;
}

function ensureObserverPanel() {
  const output = document.querySelector<HTMLElement>('[data-lab-state]');
  if (!output || output.querySelector('[data-lab-cookie-list]')) {
    return output;
  }

  output.classList.add('lab-panel');
  output.replaceChildren(
    createPanelSection('Cookies', 'data-lab-cookie-list'),
    createPanelSection('Estado de consentimiento', 'data-lab-consent-state'),
    createPanelSection('Scripts cargados', 'data-lab-loaded-scripts'),
    createPanelSection('Modo de Consentimiento de Google', 'data-lab-google-signals')
  );

  return output;
}

function renderKeyValues(container: Element | null, values: Record<string, string | boolean>) {
  if (!container) {
    return;
  }

  const list = document.createElement('dl');
  list.className = 'lab-kv';

  for (const [key, value] of Object.entries(values)) {
    const term = document.createElement('dt');
    term.textContent = key;

    const description = document.createElement('dd');
    description.textContent = String(value);
    description.dataset.value = String(value);

    list.append(term, description);
  }

  container.replaceChildren(list);
}

function renderCookies(container: Element | null, cookies: LabCookie[]) {
  if (!container) {
    return;
  }

  if (cookies.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'lab-empty';
    empty.textContent = 'No se observaron cookies';
    container.replaceChildren(empty);
    return;
  }

  const list = document.createElement('ul');
  list.className = 'lab-cookie-list';

  for (const cookie of cookies) {
    const item = document.createElement('li');
    item.dataset.cookieName = cookie.name;

    const name = document.createElement('strong');
    name.textContent = cookie.name;

    const value = document.createElement('code');
    value.textContent = cookie.value;

    item.append(name, value);
    list.append(item);
  }

  container.replaceChildren(list);
}

function renderScripts(container: Element | null, scripts: string[]) {
  if (!container) {
    return;
  }

  if (scripts.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'lab-empty';
    empty.textContent = 'No se cargaron scripts';
    container.replaceChildren(empty);
    return;
  }

  const list = document.createElement('ul');
  list.className = 'lab-chip-list';

  for (const script of scripts) {
    const item = document.createElement('li');
    item.textContent = script;
    list.append(item);
  }

  container.replaceChildren(list);
}

function renderLabState() {
  const panel = ensureObserverPanel();
  if (!panel) {
    return;
  }

  const state = window.__COOKIE_CONSENT_LAB_STATE__!;
  state.cookies = parseCookies();
  renderCookies(panel.querySelector('[data-lab-cookie-list]'), state.cookies);
  renderKeyValues(panel.querySelector('[data-lab-consent-state]'), {
    status: state.consentRecord?.status ?? 'pending',
    ...state.consent
  });
  renderScripts(panel.querySelector('[data-lab-loaded-scripts]'), state.loadedScripts);
  renderKeyValues(panel.querySelector('[data-lab-google-signals]'), state.googleSignals);
}

function renderAll() {
  renderLabState();
}

async function boot() {
  const cookieConsent = requireCookieConsentApi();
  renderVendorConfigForm();
  installConfigHandlers(cookieConsent);

  window.addEventListener('cookie-consent-cl:update', (event) => {
    const customEvent = event as CustomEvent<ConsentRecord>;
    window.__COOKIE_CONSENT_LAB_STATE__!.lastConsentEvent = {
      event: 'cookie_consent_cl_update',
      consent: customEvent.detail
    };
  });

  cookieConsent.init({
    siteId: 'demo-site',
    language: 'es-CL',
    policyVersion: '2026-01-01',
    bannerVersion: '1.0.0',
    ethicalMode: true,
    position: 'bottom',
    theme: {
      primaryColor: '#533be2',
      backgroundColor: '#ffffff',
      textColor: '#4b494b'
    },
    background: {
      enabled: true,
      opacity: 0.45,
      blur: 0
    },
    cookieIcon: {
      enabled: true,
      position: 'bottom-left',
      colorScheme: 'primary-on-background'
    },
    animation: {
      enabled: true,
      type: 'cookie-comet'
    },
    dataLayerEventName: 'cookie_consent_cl_update',
    text: {
      bannerTitle: 'Preferencias de cookies',
      bannerDescription:
        'Usamos cookies necesarias para operar el sitio. Con tu autorización, podemos medir visitas, mejorar servicios y cargar herramientas externas.',
      acceptAll: 'Aceptar todas',
      acceptAllAriaLabel: 'Aceptar todas las cookies',
      rejectNonEssential: 'Rechazar no necesarias',
      rejectNonEssentialAriaLabel: 'Rechazar todas las cookies no necesarias',
      configure: 'Configurar',
      configureAriaLabel: 'Configurar preferencias de cookies',
      savePreferences: 'Guardar preferencias',
      savePreferencesAriaLabel: 'Guardar preferencias de cookies',
      preferencesTitle: 'Configura tus preferencias',
      preferencesDescription:
        'Puedes autorizar analítica, marketing o preferencias. Las necesarias siguen activas para que el sitio funcione correctamente.',
      changePreferences: 'Revisar preferencias'
    },
    categories: [
      {
        id: 'necessary',
        label: 'Necesarias',
        description: 'Permiten que el sitio funcione correctamente y no se pueden desactivar.',
        required: true,
        defaultValue: true,
        googleConsentMode: ['security_storage']
      },
      {
        id: 'analytics',
        label: 'Analítica',
        description: 'Nos ayudan a entender cómo se usa el sitio para mejorar sus contenidos y servicios.',
        required: false,
        defaultValue: false,
        googleConsentMode: ['analytics_storage']
      },
      {
        id: 'marketing',
        label: 'Marketing',
        description: 'Permiten medir campañas o mostrar contenido publicitario personalizado.',
        required: false,
        defaultValue: false,
        googleConsentMode: ['ad_storage', 'ad_user_data', 'ad_personalization']
      },
      {
        id: 'functional',
        label: 'Preferencias',
        description: 'Permiten recordar algunas elecciones del usuario para mejorar su experiencia.',
        required: false,
        defaultValue: false,
        googleConsentMode: ['functionality_storage', 'personalization_storage']
      }
    ],
    cookies: vendorDefinitions.map((vendor) => ({
      name: vendor.cookieName,
      provider: vendor.label,
      category: vendor.category,
      duration: 'Sesión',
      purpose: `Cookie mock usada para validar consentimiento ${vendor.category}.`
    })),
    onConsentChange(consentRecord) {
      void syncVendorsFromConsent(consentRecord);
    }
  });

  if (cookieConsent.getConsent()) {
    cookieConsent.resetConsent();
  }

  await syncVendorsFromConsent(cookieConsent.getConsent());
  window.setInterval(renderAll, 500);
}

void boot();
