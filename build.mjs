// Ensambla src/pages/*.html con los parciales → raíz del proyecto.
// Cabecera de cada página: <!--meta {"title":"…","desc":"…","path":"…","nav":"…","scripts":["home.js"],"leaflet":true}-->
import fs from "node:fs"; import path from "node:path";
const root = path.dirname(new URL(import.meta.url).pathname);
const P = (f) => fs.readFileSync(path.join(root, "src/partials", f), "utf8");
const ARROW = '<svg class="arrow" viewBox="0 0 18 10" aria-hidden="true"><path d="M0 5h16.5M12.5 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>';
const V = Date.now().toString(36); // versión: obliga al navegador a descargar CSS/JS nuevos tras cada build
const head = P("head.html"), header = P("header.html"), footer = P("footer.html");
const LEAF = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">';
const LEAFJS = '<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js" defer></script>';
for (const f of fs.readdirSync(path.join(root, "src/pages")).filter((f) => f.endsWith(".html"))) {
  let src = fs.readFileSync(path.join(root, "src/pages", f), "utf8");
  const m = src.match(/^<!--meta\s+([\s\S]*?)-->\s*/); const meta = JSON.parse(m[1]); src = src.slice(m[0].length);
  const scripts = (meta.leaflet ? LEAFJS + "\n" : "") + (meta.scripts || []).map((s) => `<script src="assets/js/${s}" defer></script>`).join("\n");
  const out = head
    .replaceAll("{{title}}", meta.title).replaceAll("{{desc}}", meta.desc).replaceAll("{{path}}", meta.path ?? f)
    .replaceAll("{{ogtype}}", meta.ogtype || "website").replaceAll("{{ogimg}}", meta.ogimg || "hero-2")
    .replace("{{extra}}", (meta.leaflet ? LEAF : "") + (meta.extra || ""))
    + `<body class="page-${f.replace(".html", "")}"${meta.bodyattr ? " " + meta.bodyattr : ""}>\n`
    + header.replace(`data-nav="${meta.nav}"`, `data-nav="${meta.nav}" aria-current="page"`)
    + src + footer.replace("{{scripts}}", scripts);
  const GRID = Array.from({ length: 12 }, () => "<span style=\"background:rgba(168,115,90,.14);border:1px dashed rgba(168,115,90,.5)\"></span>").join("");
  fs.writeFileSync(path.join(root, f), out.replaceAll("${ARROW}", ARROW).replaceAll("${GRID}", GRID).replace(/(assets\/(?:css|js)\/[\w-]+\.(?:css|js))"/g, `$1?v=${V}"`));
  console.log("✓", f);
}
