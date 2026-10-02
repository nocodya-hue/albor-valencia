# ALBOR — Arquitectura WordPress + Inmovilla (fases 15–20)

## Flujo de datos

```
INMOVILLA (CRM)
   │  feed API/XML (cron horario · botón manual · `wp albor sync`)
   ▼
plugin albor-core  ── upsert por referencia · hash de cambios · fotos a mediateca · retirar (no borrar)
   ▼
CPT property  + taxonomías operation · property_type · location · zone · features  + post meta
   ▼
REST /wp-json/albor/v1/{properties, stats, taxonomies, lead}
   ▼
Tema Albor (plantillas)  ←  mismo HTML/CSS/JS que este prototipo
```

El contenido inmobiliario **no vive en el tema**: si mañana cambia el diseño, el inventario no se toca.
El frontend del prototipo ya consume exactamente la forma de datos de la API: en WordPress basta con
`window.ALBOR_CONFIG = { api: "/wp-json/albor/v1" }` (ver `assets/js/albor.js`).

## Modelo

| Elemento | Detalle |
|---|---|
| CPT | `property` · archivo `/propiedades/` · ficha `/propiedad/{slug}-{ref}/` |
| Taxonomías | `operation` (venta, alquiler) · `property_type` (piso, ático, chalet, casa, villa, adosado, local, oficina, terreno, garaje, edificio, otros) · `location` (municipio) · `zone` (barrio/zona, con meta lat/lng/grupo/ciudad) · `features` (terraza, piscina, garaje, ascensor, exterior, vistas, obra nueva, reformado, jardín, climatización) |
| Meta | reference, price, price_period, surface, plot, rooms, bathrooms, terrace, garage, floor, year_built, energy, lat, lng, gallery[], video, plan, agent, status, excerpt_ed, inmovilla_hash |
| Opciones | `albor_premium_zones` (zonas que suman al contador "zonas premium"), `albor_zone_groups`, `albor_leads_email` |
| wp-config | `ALBOR_INMOVILLA_URL`, `ALBOR_INMOVILLA_TOKEN`, `ALBOR_INMOVILLA_LEADS_URL` |

**Pendiente de validar con la firma:** nombres exactos de campos del feed de Inmovilla (el mapeo de
`includes/class-inmovilla-sync.php` es orientativo), códigos de tipo y de estado, y si el feed es API REST o XML.

## Estadísticas (contador de la home)
`GET /albor/v1/stats` → `total_properties, sale_properties, rent_properties, properties_by_city, properties_by_zone, properties_by_type, premium_zone_properties, updated_at`.
Siempre calculadas desde el inventario publicado; caché de 10 min invalidada en cada sincronización. **Nunca se escriben a mano.**

## Plantillas del tema (mapeo desde el prototipo)
| Prototipo | WordPress |
|---|---|
| `index.html` | `front-page.php` |
| `propiedades.html` | `archive-property.php` + `taxonomy-*.php` (misma plantilla, título/SEO según query) |
| `propiedad.html` | `single-property.php` (HTML, meta y JSON-LD en servidor, ya en `head_seo()`) |
| `vender.html`, `la-firma.html`, `valencia.html`, `contacto.html` | `page-{slug}.php` |
| `magazine.html` | `home.php` / `archive.php` de entradas (categorías: Barrios, Arquitectura, Mercado, Inversión, Lifestyle, Gastronomía, Diseño, Patrimonio, Tendencias) |
| Legales | páginas normales |
| `src/partials/*` | `header.php`, `footer.php` |

## SEO
- URLs jerárquicas indexables: `/propiedades/venta/`, `/propiedades/venta/aticos/`, `/propiedades/venta/aticos/pla-del-remei/`, `/propiedades/alquiler/zona/ruzafa/`.
- Landings por zona con texto propio (descripción del término `zone`) → "inmobiliaria Pla del Remei", "inmobiliaria Ruzafa", "inmobiliaria Gran Vía Valencia", "inmobiliaria El Pla del Real"…
- Ficha: title, meta description, canonical, Open Graph, `RealEstateListing` + `Offer` + `BreadcrumbList`, coordenadas redondeadas.
- Sitio: `RealEstateAgent` (fundación 2006, Calle Colón 3). Sitemap nativo de WP (CPT + taxonomías operación/tipo/zona).
- Enlazado interno por tipo × zona en el pie y en el capítulo "¿Qué busca? ¿Y dónde?".
- Magazine como motor de contenido long-tail.

## Rendimiento (objetivos y cómo se cumplen)
- Sin framework: JS propio ~100 KB sin minificar (≈35 KB minificado + gzip estimado); GSAP+ScrollTrigger y Lenis solo por CDN; Leaflet solo en páginas con mapa.
- Imágenes WebP con `loading="lazy"` y `decoding="async"`; en WP, `srcset` automático y AVIF si el servidor lo soporta.
- Hero: vídeo de campaña en bucle (`assets/video/albor-hero.mp4`, 2560×1440, 11,7 s, 33 MB) con póster. **Pendiente para producción:** comprimir a 1920×1080, ≤ 8 MB, H.264 + WebM, y servir una versión vertical 9:16 más ligera en móvil.
- Lenis y cursor solo con puntero fino; parallax a mitad de velocidad en móvil; scroll horizontal fijado solo en desktop (en móvil, scroll-snap nativo).
- `prefers-reduced-motion`: sin parallax, sin WebGL, sin pin, reveals instantáneos.
- Producción: minificar/concatenar (`esbuild`), `font-display: swap`, preconnect a fuentes, caché de página (excepto `/wp-json`).

## Accesibilidad (WCAG 2.2 AA)
- Enlace "Saltar al contenido", landmarks, jerarquía de encabezados, `aria-current` en navegación.
- Foco visible terracota de 2 px; menú fullscreen con `inert`, Escape y gestión de foco; lightbox con trampa de foco.
- Galería navegable con flechas del teclado; filtros con `aria-expanded`/`aria-pressed`; resultados con `aria-live`.
- Formularios con `label` reales, errores en texto (no solo color) y `aria-invalid`; consentimiento obligatorio.
- Contraste: tinta sobre cal ≈ 15:1; mineral sobre cal ≈ 5,6:1; textos sobre foto con degradado de protección.
- Información nunca solo por color: opciones sin resultados muestran "0"/"—" además del gris.

## Datos reales — qué falta (placeholders visibles en la web)
Teléfono, email, WhatsApp, Instagram, horario, razón social/NIF y textos legales; nombres, cargos y retratos
de los hermanos; hitos 2010/2015/2020 y fotografías históricas; fotografía del edificio de Calle Colón 3;
inventario real (Inmovilla); vídeo de campaña del hero; planos y vídeos de cada propiedad.

## Funciones añadidas tras estudiar Engel & Völkers (2026-10-02)
| Función | Prototipo | Producción |
|---|---|---|
| Favoritas (♡ en tarjetas y ficha, contador en cabecera, `propiedades.html?fav=1`) | `localStorage` (`albor-favs`) | Igual, o área privada con cuenta si se quiere sincronizar entre dispositivos |
| Guardar búsqueda / alerta ("incluidas las que no publicamos") | `localStorage` (`albor-alerts`) | `POST /albor/v1/lead {tipo: alerta, filtros}` → demanda en Inmovilla con cruce automático |
| Búsqueda en lenguaje natural ("ático con terraza en el Pla del Remei hasta 2 M€") | Intérprete local en `listing.js` (tipos, zonas y alias, operación, características, habitaciones, baños, m², precio mín./máx.; referencia → ficha) | Igual; ampliable con un modelo de lenguaje si se desea |
| Compartir ficha | Web Share API / copiar enlace | Igual |
| Simulador de hipoteca (solo venta) + casilla "me interesa financiación" | Cuota francesa, valores editables | Igual; la casilla se envía como campo del lead |
| Newsletter "Selección privada" (pie) con consentimiento RGPD | Envío simulado | Integración con la herramienta de email marketing de la firma (doble opt-in) |

Descartado por no encajar con una firma boutique o por requerir datos inventados: red internacional, divisiones (yates, comercial), reclutamiento de asesores, reseñas e informes de precios.

## Funciones añadidas tras estudiar Person Inmobiliaria (2026-10-02)
| Función | Dónde | Producción |
|---|---|---|
| CTA permanente "Valorar mi casa" | Cabecera (≥ 1240 px) | — |
| Garantías de la valoración (48 h, gratuita, comparables reales, en persona) | Vender · valoración | Ajustar a los compromisos reales de la firma |
| Mapa con pin arrastrable en el paso "Ubicación" | Vender · paso 2 (lat/lng en campos ocultos) | Igual; opcionalmente geocodificación con servicio propio (sin enviar direcciones a terceros sin consentimiento) |
| Más características (balcón, conserje, amueblado, piscina privada/comunitaria, trastero) | Vender · paso 3 | Mapear a campos de demanda de captación en Inmovilla |
| "Qué incluye" (foto/vídeo/dron, plano, compradores, venta reservada, jurídico, informe semanal) | Vender | — |
| "Qué recibirá" (contenido del informe de valoración) | Vender | — |
| Preguntas frecuentes + `FAQPage` (schema.org) | Vender | En WP, bloque de FAQ con el mismo JSON-LD en servidor |
| Guías prácticas (categoría "Guías" del magazine) | Magazine | Redactar: son las búsquedas con más intención de propietarios |
| Campo trampa anti-spam (`website`) en todos los formularios | Global | + Cloudflare Turnstile en el endpoint `/albor/v1/lead` |

Descartado: línea de locales/naves (PersonUp), página de empleo, chat genérico y testimonios (serían inventados).
