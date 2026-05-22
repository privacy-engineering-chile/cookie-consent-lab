# Scripts Propios

El lab simula comportamiento first-party común en sitios productivos.

## Comportamientos Simulados

- Carga de script de analítica
- Carga de script de marketing
- Cookies específicas por categoría
- `localStorage` específico por categoría
- Requests mock de tracking
- Eventos de actualización de consentimiento en `dataLayer`

## Seguridad

Los mocks son locales y deterministas. No contactan servicios de terceros.

## Patrón De Extensión

Agrega una entrada tipo vendor en `src/lab-runtime.ts` con:

- `name`
- `category`
- `cookieName`
- `storageKey`
- `scriptId`
- `mockPath`
- `realUrl` opcional

Luego agrega assertions de Playwright que validen comportamiento antes del consentimiento, después del consentimiento, consentimiento granular y revocación.
