# ALBOR · Propiedades en Valencia — prototipo

Web inmobiliaria de ultra lujo para una firma familiar de Valencia (Calle Colón 3, desde 2006).

## Ver en local
```bash
cd albor-valencia && npx http-server -p 8818 -c-1
```
Abrir http://localhost:8818 (necesita servidor: los datos se cargan por `fetch`).

## Editar
Las páginas se escriben en `src/pages/*.html` y se ensamblan con los parciales (`src/partials/`):
```bash
node build.mjs
```

## Estructura
- `docs/01-investigacion-naming-direccion.md` — investigación, naming, dirección de arte, IA, wireframes.
- `docs/02-arquitectura-wordpress-inmovilla.md` — WordPress, Inmovilla, SEO, rendimiento, accesibilidad, datos pendientes.
- `design-system.html` — sistema de diseño renderizado.
- `assets/css/albor.css` (design system) · `assets/css/pages.css` (páginas).
- `assets/js/albor.js` (núcleo + capa de datos) · `hero-gl.js` · `home.js` · `zonemap.js` · `listing.js` · `property.js` · `sell.js` · `firm.js` · `valencia.js` · `magazine.js` · `contact.js`.
- `assets/data/` — inventario **de demostración** y zonas (mismo formato que la API).
- `wordpress/albor-core/` — plugin: CPT, taxonomías, meta, REST, SEO, sincronización Inmovilla.

## Importante
Todas las propiedades, precios y cifras son de demostración y están marcados como tales en la interfaz.
Las fotografías son imágenes de referencia con licencia Unsplash.

## Ver online
https://nocodya-hue.github.io/albor-valencia/

> Web de muestra: marca, contactos, nombres, datos legales e inventario son ficticios. Fotografías de referencia con licencia Unsplash; vídeo del hero aportado por el cliente.
