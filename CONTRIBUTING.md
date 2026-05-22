# Contribuir

Gracias por ayudar a mejorar `cookie-consent-lab`.

## Desarrollo

```bash
npm install
npx playwright install chromium
npm test
```

Mantén los ejemplos simples. Un escenario de vendor debe hacer que un comportamiento sea fácil de observar y probar, no emular un sitio productivo completo.

## Solicitudes De Cambio

- No subas IDs reales de vendors, tokens de acceso, secretos ni datos de clientes.
- Mantén los mocks seguros y deterministas.
- Agrega o actualiza tests de Playwright cuando cambie el comportamiento.
- Documenta nuevos vendors usando `docs/vendor-template.md`.
- Prefiere cambios pequeños y fáciles de revisar.

## Valores Seguros Por Defecto

El laboratorio debe seguir ejecutándose sin credenciales externas y sin tráfico real de tracking. Si un escenario soporta tráfico real de vendor, debe exigir opt-in explícito mediante variables de entorno.
