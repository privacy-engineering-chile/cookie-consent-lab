# cookie-consent-lab

Laboratorio reproducible con Playwright para probar la utilidad de [`cookie-consent`](https://github.com/privacy-engineering-chile/cookie-consent) frente a vendors comunes y distintos escenarios de consentimiento.

Este proyecto sigue el enfoque de Privacy Engineering Chile: evidencia clara, pruebas repetibles y configuraciones seguras por defecto. El laboratorio ayuda a validar si scripts de analítica, marketing, scripts propios, señales de Google Consent Mode, cookies, almacenamiento y requests de red se comportan como se espera antes y después del consentimiento.

## Qué Problema Resuelve

Los banners de consentimiento son fáciles de mostrar y difíciles de verificar. `cookie-consent-lab` entrega un arnés de pruebas pequeño y auditable para comprobar si vendors y scripts first-party quedan realmente bloqueados antes del consentimiento y se activan solo cuando la persona usuaria toma una decisión explícita.

La página principal incluye escenarios configurables para:

- Google Consent Mode
- Google Tag y Google Tag Manager
- Meta Pixel
- Hotjar
- Scripts first-party para analítica, marketing, cookies, localStorage y `dataLayer`

## Instalación

```bash
npm install
npx playwright install chromium
```

## Ejecutar Tests

```bash
npm test
```

## Modo Desarrollo

```bash
npm run dev
```

Luego abre `http://127.0.0.1:4173/` para configurar vendors, revisar el banner y observar el comportamiento del laboratorio en tiempo real.

Ejecutar con navegador visible:

```bash
npm run test:headed
```

Ver el reporte HTML:

```bash
npm run report
```

## Configuración De Vendors

El laboratorio usa mocks seguros por defecto. No se incluyen IDs reales ni secretos, y no se envía tráfico real de tracking salvo que se habilite explícitamente.

La configuración de IDs se realiza desde la UI local del laboratorio. Los valores se guardan solo en `localStorage` del navegador bajo la clave `cookie-consent-lab:vendor-config`.

El lab carga `cookie-consent-cl@0.2.0` desde jsDelivr usando los assets oficiales IIFE y CSS de Privacy Engineering Chile.

El tráfico real de vendors requiere un ID, el vendor habilitado, consentimiento de la categoría correspondiente y el toggle explícito `Permitir tráfico real de vendors`.

## Agregar Un Nuevo Vendor

1. Copia `docs/vendor-template.md` como nueva documentación del vendor.
2. Extiende la lista de vendors en `src/lab-runtime.ts` con categoría, cookies, almacenamiento, campo de ID y URL real opcional.
3. Agrega o actualiza assertions de Playwright en `tests/playwright/`.
4. Ejecuta `npm test` e inspecciona `reports/playwright-report` si hay fallas.

## Interpretar Resultados

Pruebas exitosas significan que el escenario calza con el comportamiento esperado del laboratorio:

- No hay cookies no necesarias antes del consentimiento
- No se cargan scripts de analítica o marketing antes del consentimiento
- No hay requests de tracking antes del consentimiento
- Aparecen cookies y almacenamiento esperados después del consentimiento
- Se emiten eventos esperados en `dataLayer`
- Las señales de Google Consent Mode transicionan como se espera

Las fallas deben tratarse como evidencia para inspeccionar. Usa traces, screenshots y el reporte JSON de Playwright en `reports/` para entender qué cambió.

## Qué NO Hace Este Proyecto

- No certifica cumplimiento legal.
- No reemplaza una auditoría legal, de privacidad o de seguridad.
- No usa personas usuarias reales.
- No incluye IDs reales de vendors ni secretos.
- No envía tráfico real de tracking salvo que quien ejecuta el laboratorio lo configure explícitamente.

## Contribuir

Las contribuciones son bienvenidas. Mantén los escenarios pequeños, deterministas y seguros por defecto. Revisa `CONTRIBUTING.md` para guías de desarrollo y `docs/methodology.md` para la metodología de pruebas.
