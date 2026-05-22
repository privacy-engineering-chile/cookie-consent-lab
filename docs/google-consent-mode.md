# Google Consent Mode

El laboratorio valida Consent Mode como estado observable del navegador, no como conclusión legal.

## Estado Por Defecto

Antes de la acción de la persona usuaria, el lab inicializa:

- `ad_storage: denied`
- `analytics_storage: denied`
- `ad_user_data: denied`
- `ad_personalization: denied`

## Después Del Consentimiento

Aceptar analítica concede `analytics_storage`. Aceptar marketing concede `ad_storage`, `ad_user_data` y `ad_personalization`.

## Configuración

Define `GOOGLE_TAG_ID` o `GTM_ID` solo cuando pruebes con IDs reales. El tráfico real sigue bloqueado salvo que también se configure `ENABLE_REAL_VENDOR_TRAFFIC=true`.

## Evidencia

Los tests inspeccionan `window.dataLayer`, el estado del laboratorio, cookies y requests de red.
