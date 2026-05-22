# Metodología

`cookie-consent-lab` valida el comportamiento de consentimiento comparando estado observable del navegador antes y después de las decisiones de la persona usuaria.

## Cookies Antes Y Después

Los tests capturan cookies del navegador antes del consentimiento y después de cada acción. Las cookies no necesarias no deben existir antes del consentimiento. Las cookies específicas de vendors deben aparecer solo después de que se autorice la categoría correspondiente.

## localStorage Y sessionStorage Antes Y Después

Los vendors configurados pueden escribir claves específicas por categoría en `localStorage` o `sessionStorage`. El almacenamiento debe permanecer vacío para categorías no autorizadas y debe limpiarse o ignorarse cuando se revoca el consentimiento.

## Requests De Red

Playwright observa requests que calzan con endpoints de tracking, endpoints mock o URLs de vendors configuradas. Antes del consentimiento, los requests de analítica y marketing están prohibidos. Por defecto, los requests apuntan a rutas mock locales como `/mock-tracking/analytics`.

## Eventos dataLayer

El laboratorio registra actualizaciones de consentimiento en `window.dataLayer`. Un cambio exitoso de consentimiento emite `cookie_consent_cl_update` con el registro de consentimiento generado por `cookie-consent-cl`.

## Señales De Google Consent Mode

Google Consent Mode comienza con señales denied para almacenamiento no esencial:

- `ad_storage`
- `analytics_storage`
- `ad_user_data`
- `ad_personalization`

Cuando se aceptan las categorías correspondientes, las señales de analítica y marketing transicionan a `granted`. Las categorías rechazadas o revocadas deben permanecer o volver a `denied`.

## Screenshots Y Traces

Playwright conserva traces y screenshots cuando hay fallas. Usa el reporte HTML en `reports/playwright-report` para inspeccionar estado de UI, consola, actividad de red y tiempos.

## Comportamiento Esperado Por Vendor

Cada vendor debe documentar:

- Categoría
- Requisitos de configuración
- Cookies y almacenamiento
- Requests esperados después del consentimiento
- Requests prohibidos antes del consentimiento
- Problemas conocidos
- Casos de prueba

Usa `docs/vendor-template.md` como punto de partida para documentar nuevos vendors.
