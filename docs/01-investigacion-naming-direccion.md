# ALBOR · Propiedades en Valencia — Investigación, naming y dirección de arte

Fases 1–6 del brief. Documento de trabajo del prototipo.

---

## FASE 1 · Investigación

### Azimute Residencial (azimuteresidencial.com.br)
- **Qué funciona:** narrativa por capítulos (O Projeto → Perspectiva → Essência → Residências), cada sección es un "acto". Botón de *próximo capítulo* que invita a seguir. Imagen a pantalla completa como protagonista; el texto llega después.
- **Qué tomamos:** el *capítulo* como unidad de ritmo (numeración 01, 02, 03…), la sensación de recorrer una casa, la imagen antes que el dato.
- **Qué evitamos:** es la landing de una sola promoción. Albor es una plataforma con inventario vivo: los capítulos se usan en la home y en la ficha, nunca para esconder el buscador. También evitamos sus acentos dorados.

### Bright Avenue (bright-avenue.jp)
- **Qué funciona:** minimalismo editorial, métricas grandes que validan (precio medio, nº de operaciones), casos con ubicación + programa + etiquetas, filtros por zona/tipo, márgenes muy amplios, bilingüismo como señal internacional.
- **Qué tomamos:** números gigantes como elemento gráfico (contador de inventario), fichas de propiedad estructuradas como "casos", composición asimétrica con mucho vacío, etiquetas pequeñas en mayúsculas.
- **Qué evitamos:** cifras de negocio inventadas. Nuestros números se calculan desde el inventario real (Inmovilla).

### 360 Lexington Avenue
- **Qué funciona:** el activo se presenta en bloques muy claros (localización → propuesta de valor → specs → amenities → mapa → contacto). Datos concretos con unidades. CTAs repetidos y claros: *Explore*, *Contact*, *Schedule a tour*.
- **Qué tomamos:** la ficha de propiedad como "presentación de un activo": datos clave en una fila, galería, ubicación con contexto, CTA de visita persistente.

### Person Inmobiliaria (venta / alquiler)
- **Arquitectura de contenidos:** buscador único (*ubicación, tipo o referencia*), operación Venta / Alquiler / Traspaso, tipos con **contador por opción** (Piso (140), Chalet (101)…), rango de precio, habitaciones y baños con contadores, características con contadores (terraza, ascensor, jardín, piscina, garaje…), ordenación (recientes, antiguos, precio ↑↓), vista mapa por defecto con "Ver en lista".
- **SEO:** URLs jerárquicas `/propiedades/venta`, `/propiedades/alquiler/pisos`, páginas de "por tipo" y "por ubicación" enlazadas desde el pie.
- **Qué tomamos:** facetas con contadores (el usuario nunca llega a "0 resultados"), buscador único, URLs jerárquicas indexables, enlazado interno por tipo × zona.
- **Qué mejoramos:** vista híbrida listado + mapa, filtros persistentes en URL (compartibles), chips de filtros activos, hoja inferior de filtros en móvil.

### Pinterest · "casas de lujo" (solo dirección de arte, sin usar imágenes)
Patrones que sí son Mediterráneo contemporáneo: muros encalados, travertino y piedra caliza con sombras de vegetación, madera de nogal y roble, lino crudo, cerámica artesanal, olivos y cipreses, patios interiores, escaleras escultóricas, piscinas de lámina con piedra, persianas de librillo, luz rasante de mañana.
Patrones que **descartamos** (lujo genérico de Dubái): mármol negro y dorado, HDR saturado, cielos sustituidos, gran angular extremo, iluminación LED azul.

---

## FASE 2 · Naming

| # | Nombre | Concepto | Valoración |
|---|---|---|---|
| 1 | **ALBOR** | La primera luz del día. En Valencia amanece sobre el mar. También "comienzo": 2006. | Corto, español, pronunciable en cualquier idioma, editorial, sin tópicos de lujo. **Elegido.** |
| 2 | UMBRAL | El paso de la calle a la casa. | Bello pero pesado y algo frío. |
| 3 | LINDE | El límite de una propiedad; también "lindar". | Muy técnico/notarial. |
| 4 | LLUM | "Luz" en valenciano. | Gran arraigo local; difícil de pronunciar fuera. |
| 5 | SOLANA | La cara de la casa donde da el sol. | Demasiado ligado a vacacional/costa. |

**ALBOR — Propiedades en Valencia · Desde 2006.**
Firma: *"Valencia amanece antes en algunas casas."*
El nombre conecta tres ideas de la marca: **luz** (Mediterráneo, este), **origen** (dos hermanos, 2006) y **horizonte** (lo que viene). El logotipo es el nombre en serif ligera con una línea de horizonte: la marca nace del paisaje, no de un símbolo.

---

## FASE 3 · Dirección de arte — "Luz de levante"

**Idea:** una revista de arquitectura que, al pasar la página, resulta ser un buscador inmobiliario impecable.
Tensiones: tradición (serif editorial, papel, piedra) ↔ futuro (WebGL, datos vivos, precisión de la sans); Valencia ↔ internacional; arquitectura ↔ personas.

### Paleta — extraída de una villa mediterránea
| Token | Hex | Material |
|---|---|---|
| `--cal` | `#F3EEE5` | Muro encalado (fondo principal) |
| `--marfil` | `#FAF7F1` | Lino claro (superficies) |
| `--travertino` | `#E6DCCB` | Travertino (bloques) |
| `--arena` | `#D2C4AD` | Arena / mortero (líneas, bordes) |
| `--piedra` | `#9F9686` | Piedra caliza en sombra |
| `--mineral` | `#66625B` | Gris mineral (texto secundario) |
| `--nogal` | `#4A3A2C` | Madera de nogal (acento oscuro) |
| `--oliva` | `#5F6145` | Olivo (acento natural) |
| `--mar` | `#6C8189` | Mediterráneo muy desaturado (mapa, enlaces) |
| `--tinta` | `#1D1A16` | Texto |
| `--carbon` | `#13110F` | Noche: negro cálido (exposición, vender, formularios, menú, pie) |
| `--cipres` | `#243028` | Noche: verde ciprés (magazine) |
| `--arcilla` | `#A3562F` | Acento único sobre claro — teja y cedro (4,6:1 sobre cal) |
| `--arcilla-claro` | `#D08A62` | Acento sobre oscuro (6,7:1 sobre carbón) |

**Del alba a la noche (rev. 2):** el día es cal y travertino; la noche, carbón y ciprés. Un único acento, la arcilla, marca la palabra en cursiva de cada titular, la numeración de capítulos, el progreso, los pines activos y el foco. Negro cálido sí; dorado nunca.

### Tipografía (2 familias, Google Fonts, licencia OFL)
- **Newsreader** (serif editorial con eje óptico): titulares emocionales, cifras gigantes, citas. Peso 300, tracking negativo.
- **Geist** (sans precisa con cifras tabulares): datos inmobiliarios, filtros, etiquetas, cuerpo.
Regla: *la serif emociona, la sans informa.* Nunca más de un titular serif por pantalla.

### Fotografía
Luz natural rasante, sombras, textura de material, composición arquitectónica, escala humana. Sin HDR ni cielos falsos. En el prototipo se usan imágenes de referencia con licencia Unsplash (créditos en el pie); en producción se sustituyen por la fotografía propia de cada inmueble desde Inmovilla.

### Movimiento
"Se mueve porque está diseñado así": curvas `cubic-bezier(.2,.7,.1,1)`, duraciones 0.9–1.4 s, nada de rebotes. Velocidades de parallax entre 0.05 y 0.2. Todo se desactiva con `prefers-reduced-motion`.

---

## FASE 4 · Arquitectura de información

```
/                         Home (capítulos 00–08)
/propiedades/             Listado (venta + alquiler) · grid / mapa / híbrido
/propiedades/venta/                     ← SEO: operación
/propiedades/venta/aticos/              ← operación × tipo
/propiedades/venta/aticos/pla-del-remei/← operación × tipo × zona
/propiedad/{slug}-{ref}/  Ficha de propiedad
/vender/                  Captación + valoración en 5 pasos
/la-firma/                Historia 2006→2026 · Los hermanos · Oficina
/valencia/                Valencia como personaje · mapa por barrios
/valencia/{zona}/         Landing SEO por zona (inmobiliaria Ruzafa, etc.)
/magazine/                Conocemos Valencia (SEO editorial)
/contacto/                Hablemos
/aviso-legal/ /privacidad/ /cookies/ /condiciones/
```
En el prototipo estático estas rutas son `propiedades.html?op=venta&type=atico&zone=pla-del-remei`, etc.; en WordPress se resuelven con reglas de reescritura (ver `02-arquitectura-wordpress-inmovilla.md`).

## FASE 5 · Wireframes (estructura por capítulos de la home)
```
00 HERO        imagen/vídeo WebGL · titular con máscara · buscador rápido · scroll
01 LA FIRMA    manifiesto asimétrico + imagen con parallax
02 INVENTARIO  cifras gigantes desde la API (total · venta · alquiler · Valencia · zonas)
03 EXPOSICIÓN  scroll horizontal fijado · 01/08 · una propiedad por "sala"
04 BUSCAR      accesos directos por tipo y por zona (enlazado SEO)
05 VALENCIA    mapa interactivo sticky: barrio → nº de propiedades → fichas
06 LA CIUDAD   collage editorial con velocidades de parallax
07 MAGAZINE    tres piezas editoriales
08 VENDER      bloque que se superpone (sticky stacking)
09 OFICINA     Calle Colón 3 como tipografía · Visítanos
```

## FASE 6 · Design system
Implementado en `assets/css/albor.css` y documentado visualmente en `design-system.html`.
