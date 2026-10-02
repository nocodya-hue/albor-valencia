/* ALBOR · Listado de propiedades
   - Estado único (f) sincronizado con la URL → enlaces compartibles e indexables.
   - Facetas con contadores: cada opción muestra cuántas propiedades quedarían (nunca "0 resultados" a ciegas).
   - Vistas: grid editorial, mapa, lista + mapa (híbrida, con hover sincronizado). */
(async () => {
  await window.Albor.ready;
  const A = window.Albor, { $, $$, esc, nf, data, ARROW } = A;
  const [all, Z] = await Promise.all([data.all(), data.zones()]);
  const ZM = A.zones, TM = A.types;

  const PRICES = {
    venta: [200000, 300000, 400000, 500000, 750000, 1000000, 1500000, 2000000, 3000000],
    alquiler: [1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500],
    "": [1000, 3000, 300000, 500000, 1000000, 2000000]
  };
  const ARR = ["type", "zone", "feat"];
  const read = () => {
    const q = new URLSearchParams(location.search), f = {};
    for (const k of ["op", "q", "min", "max", "rooms", "baths", "surface", "sort", "view", "fav"]) f[k] = q.get(k) || "";
    for (const k of ARR) f[k] = (q.get(k) || "").split(",").filter(Boolean);
    return f;
  };
  let f = read();
  const write = (push = false) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(f)) { if (Array.isArray(v) ? v.length : v) q.set(k, Array.isArray(v) ? v.join(",") : v); }
    if (f.view === "grid") q.delete("view");
    const u = location.pathname + (q.toString() ? "?" + q : "");
    history[push ? "pushState" : "replaceState"](null, "", u);
  };
  addEventListener("popstate", () => { f = read(); render(); });

  /* ---------- Etiquetas ---------- */
  const fmtK = (v) => v >= 1e6 ? `${(v / 1e6).toLocaleString("es-ES")} M€` : v >= 1e4 ? `${nf.format(v / 1000)}.000 €` : `${nf.format(v)} €`;
  const priceLabel = () => {
    const per = f.op === "alquiler" ? "/mes" : "";
    if (f.min && f.max) return `${fmtK(+f.min)} – ${fmtK(+f.max)}${per}`;
    if (f.min) return `Desde ${fmtK(+f.min)}${per}`;
    if (f.max) return `Hasta ${fmtK(+f.max)}${per}`;
    return "";
  };
  const featName = (s) => Z.features.find((x) => x.slug === s)?.name || s;

  function title() {
    if (f.fav) return "Sus propiedades favoritas";
    const t = f.type.length === 1 ? TM[f.type[0]].plural : "Propiedades";
    const op = f.op === "venta" ? " en venta" : f.op === "alquiler" ? " en alquiler" : "";
    const z = f.zone.length === 1 ? ` en ${ZM[f.zone[0]].name}` : f.zone.length > 1 ? " en zonas seleccionadas" : " en Valencia";
    return t + op + z;
  }

  /* ---------- Paneles de filtros ---------- */
  const panel = $("[data-panel]");
  let openPanel = null;
  const countWith = (patch) => data.filter(all, { ...f, ...patch }).length;
  const opt = (name, value, label, n, checked) => `<label class="opt ${n ? "" : "is-zero"}"><input type="checkbox" name="${name}" value="${value}" ${checked ? "checked" : ""}> <span>${esc(label)}</span><small>${n}</small></label>`;

  const panels = {
    zone: () => `<h3 class="label label--muted">Ubicación</h3><div class="fpanel__zones">${Z.groups.map((g) => `<div class="grp"><p class="label">${g.name}</p>${Z.zones.filter((z) => z.group === g.id).map((z) => opt("zone", z.slug, z.name + (z.city !== "Valencia" && z.city !== z.name ? ` · ${z.city}` : ""), countWith({ zone: [z.slug] }), f.zone.includes(z.slug))).join("")}</div>`).join("")}</div>`,
    type: () => `<h3 class="label label--muted">Tipo de inmueble</h3><div class="fpanel__grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:0 40px">${Z.types.map((t) => opt("type", t.slug, t.name, countWith({ type: [t.slug] }), f.type.includes(t.slug))).join("")}</div>`,
    price: () => {
      const list = PRICES[f.op] || PRICES[""], per = f.op === "alquiler" ? " /mes" : "";
      const sel = (id, label, cur) => `<div class="field"><label for="${id}">${label}</label><select id="${id}" class="select" data-price="${id === "f-min" ? "min" : "max"}"><option value="">Sin límite</option>${list.map((v) => `<option value="${v}" ${+cur === v ? "selected" : ""}>${fmtK(v)}${per}</option>`).join("")}</select></div>`;
      return `<h3 class="label label--muted">Precio${f.op ? "" : ' <span style="text-transform:none;letter-spacing:0">— elija Comprar o Alquilar para afinar</span>'}</h3><div class="range">${sel("f-min", "Mínimo", f.min)}${sel("f-max", "Máximo", f.max)}</div>`;
    },
    rooms: () => {
      const pills = (key, label, vals) => `<div><h3 class="label label--muted">${label}</h3><div class="pills" role="group" aria-label="${label}">${vals.map((v) => `<button type="button" data-pill="${key}" data-v="${v}" aria-pressed="${f[key] === String(v) || (!f[key] && v === "")}">${v === "" ? "Indiferente" : v + "+"}</button>`).join("")}</div></div>`;
      return `<div class="fpanel__grid">${pills("rooms", "Habitaciones", ["", 1, 2, 3, 4, 5])}${pills("baths", "Baños", ["", 1, 2, 3, 4])}<div><h3 class="label label--muted">Superficie mínima</h3><div class="pills">${["", 80, 120, 200, 300, 500].map((v) => `<button type="button" data-pill="surface" data-v="${v}" aria-pressed="${f.surface === String(v) || (!f.surface && v === "")}">${v === "" ? "Indiferente" : v + " m²"}</button>`).join("")}</div></div></div>`;
    },
    save: () => {
      const n = data.filter(all, f).length;
      return `<div class="save-search"><div><h3 class="label label--muted">Guardar búsqueda</h3><p class="h4 mt-2">${esc(title())}</p>
        <p class="body-2 mt-2" style="font-size:14px">Ahora hay ${n} ${n === 1 ? "propiedad" : "propiedades"}. Le escribimos en cuanto entre otra que encaje — <strong>incluidas las que vendemos de forma reservada, sin publicar.</strong></p></div>
        <div class="save-search__form"><div class="field"><label for="ss-mail">Email</label><input id="ss-mail" type="email" class="input" autocomplete="email" placeholder="nombre@correo.com"><span class="field__error" aria-live="polite"></span></div>
        <div class="field"><label for="ss-freq">Frecuencia</label><select id="ss-freq" class="select"><option>En cuanto entre</option><option>Resumen semanal</option></select></div>
        <label class="check"><input type="checkbox" id="ss-ok"> <span>Acepto la <a href="privacidad.html">política de privacidad</a> y recibir estas alertas. Puedo darme de baja en cualquier momento.</span></label>
        <button type="button" class="btn btn--solid btn--sm" data-save-confirm>Crear alerta ${ARROW}</button></div></div>`;
    },
    more: () => `<h3 class="label label--muted">Características</h3><div class="chips">${Z.features.map((x) => { const n = countWith({ feat: [...new Set([...f.feat, x.slug])] }); return `<label class="chip"><input type="checkbox" name="feat" value="${x.slug}" ${f.feat.includes(x.slug) ? "checked" : ""} ${!n && !f.feat.includes(x.slug) ? "disabled" : ""}><span>${x.name} <small>${n}</small></span></label>`; }).join("")}</div>`
  };
  const panelFoot = () => openPanel === "save" ? "" : `<div class="fpanel__foot"><button type="button" class="afclear" data-clear>Quitar filtros</button><button type="button" class="btn btn--solid btn--sm" data-close>Ver ${data.filter(all, f).length} propiedades</button></div>`;

  function showPanel(key) {
    openPanel = openPanel === key ? null : key;
    $$("[data-panel-btn]").forEach((b) => b.setAttribute("aria-expanded", b.dataset.panelBtn === openPanel));
    $("[data-mobile-filters]")?.setAttribute("aria-pressed", openPanel === "all");
    drawPanel();
  }
  function drawPanel() {
    if (!openPanel) { panel.classList.remove("is-open"); panel.innerHTML = ""; return; }
    const html = openPanel === "all" ? ["zone", "type", "price", "rooms", "more"].map((k) => `<div style="margin-bottom:32px">${panels[k]()}</div>`).join("") : panels[openPanel]();
    panel.innerHTML = html + panelFoot();
    panel.classList.add("is-open");
  }

  panel.addEventListener("change", (e) => {
    const t = e.target;
    if (t.closest(".save-search")) return; // los campos de la alerta no son filtros
    if (t.name && ARR.includes(t.name)) { f[t.name] = $$(`input[name="${t.name}"]:checked`, panel).map((i) => i.value); }
    if (t.dataset.price) f[t.dataset.price] = t.value;
    update();
  });
  panel.addEventListener("click", (e) => {
    if (e.target.closest("[data-save-confirm]")) {
      const mail = $("#ss-mail"), ok = $("#ss-ok"), err = mail.closest(".field").querySelector(".field__error");
      const bad = !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail.value) ? "Revise el email." : !ok.checked ? "Necesitamos su consentimiento." : "";
      err.textContent = bad; mail.setAttribute("aria-invalid", !!bad); if (bad) return (bad.startsWith("Revise") ? mail : ok).focus();
      try { const l = JSON.parse(localStorage.getItem("albor-alerts") || "[]"); l.push({ q: location.search, t: title(), at: Date.now() }); localStorage.setItem("albor-alerts", JSON.stringify(l)); } catch (x) {}
      // Producción: POST /wp-json/albor/v1/lead { tipo: "alerta", filtros } → demanda en Inmovilla con cruce automático.
      panel.querySelector(".save-search__form").innerHTML = `<p class="h4">Alerta creada.</p><p class="body-2 mt-2" style="font-size:14px">Le avisaremos en ${esc(mail.value)}. <span class="ph">(Prototipo: no se ha enviado.)</span></p>`;
      return;
    }
    const p = e.target.closest("[data-pill]");
    if (p) { f[p.dataset.pill] = p.dataset.v; update(); }
    if (e.target.closest("[data-close]")) showPanel(null);
  });
  $$("[data-panel-btn]").forEach((b) => b.addEventListener("click", () => showPanel(b.dataset.panelBtn)));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && openPanel) { const k = openPanel; showPanel(null); $(`[data-panel-btn="${k}"]`)?.focus(); } });
  // composedPath: el panel se redibuja durante el clic, así que el target puede quedar desconectado.
  document.addEventListener("click", (e) => { const path = e.composedPath(); if (openPanel && !path.some((n) => n.dataset && (n.dataset.filters !== undefined || n.dataset.mobileFilters !== undefined))) showPanel(null); });
  document.addEventListener("click", (e) => { if (e.target.closest("[data-clear]")) { const view = f.view; f = read(); for (const k of Object.keys(f)) f[k] = Array.isArray(f[k]) ? [] : ""; f.view = view; update(); } });

  // Operación
  $$("[data-op]").forEach((b) => b.addEventListener("click", () => { if (f.op !== b.dataset.op) { f.op = b.dataset.op; f.min = f.max = ""; update(true); } }));
  // Búsqueda libre
  const qIn = $("#f-q");
  $("#f-q-list").innerHTML = [...Z.zones.map((z) => z.name), ...Z.types.map((t) => t.plural), ...all.map((p) => p.ref)].map((v) => `<option value="${esc(v)}">`).join("");
  /* Búsqueda en lenguaje natural (local, sin servicios externos): convierte una frase en filtros.
     «ático con terraza en el Pla del Remei hasta 2 M€» → tipo=ático, zona=pla-del-remei, terraza, máx. 2.000.000. */
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const ZALIAS = { carmen: "ciutat-vella", "barrio del carmen": "ciutat-vella", "casco antiguo": "ciutat-vella", ensanche: "l-eixample", eixample: "l-eixample", colon: "pla-del-remei", viveros: "pla-del-real", "jardines del real": "pla-del-real", "blasco ibanez": "mestalla", "ayuntamiento": "sant-francesc", russafa: "ruzafa", cabanal: "cabanyal" };
  const NUM = { un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6 };
  const money = (n, unit) => { let v = parseFloat(n.replace(/\.(?=\d{3}\b)/g, "").replace(",", ".")); unit = (unit || "").trim(); if (unit === "mil" || unit === "k") v *= 1e3; else if (/^m/.test(unit)) v *= 1e6; return Math.round(v); };
  function parseNL(text) {
    const t = " " + norm(text) + " ", p = {}, said = [];
    if (/alquil|renta|\bal mes\b|\/mes/.test(t)) { p.op = "alquiler"; said.push("alquiler"); } else if (/compr|venta|\bvender/.test(t)) { p.op = "venta"; said.push("compra"); }
    const types = Z.types.filter((x) => !["garaje", "otros"].includes(x.slug) && new RegExp("\\b(" + norm(x.name) + "|" + norm(x.plural) + ")\\b").test(t)).map((x) => x.slug);
    if (/\bapartamento|\bduplex/.test(t)) types.push("piso");
    if (types.length) { p.type = [...new Set(types)]; said.push(p.type.map((s) => TM[s].name).join(" / ")); }
    const zones = Z.zones.filter((z) => t.includes(" " + norm(z.name).replace(/^(el |la |l')/, "")) || t.includes(norm(z.name))).map((z) => z.slug);
    for (const [k, v] of Object.entries(ZALIAS)) if (t.includes(k)) zones.push(v);
    if (zones.length) { p.zone = [...new Set(zones)]; said.push(p.zone.map((s) => ZM[s].name).join(" / ")); }
    const FEAT = { terraza: /terraza|atico con terraza/, piscina: /piscina/, garaje: /garaje|parking|aparcamiento/, ascensor: /ascensor/, exterior: /exterior/, vistas: /vistas|vista al mar|frente al mar|primera linea/, "obra-nueva": /obra nueva|a estrenar/, reformado: /reformad/, jardin: /jardin/, "aire-acondicionado": /aire acondicionado|climatiz/ };
    const feat = Object.entries(FEAT).filter(([, r]) => r.test(t)).map(([k]) => k);
    if (feat.length) { p.feat = feat; said.push(feat.map(featName).join(", ").toLowerCase()); }
    let m = t.match(/(\d+|un|una|dos|tres|cuatro|cinco|seis)\s*(hab|dorm)/); if (m) { p.rooms = String(NUM[m[1]] || +m[1]); said.push(p.rooms + "+ hab."); }
    m = t.match(/(\d+|un|una|dos|tres|cuatro)\s*ban/); if (m) { p.baths = String(NUM[m[1]] || +m[1]); said.push(p.baths + "+ baños"); }
    m = t.match(/(\d+)\s*(m2|m²|metros)/); if (m) { p.surface = m[1]; said.push(m[1] + "+ m²"); }
    m = t.match(/(hasta|maximo|max\.?|menos de|por debajo de)\s*([\d.,]+)\s*(millones|millon|mill|mil|k|m)?/); if (m) { p.max = String(money(m[2], m[3])); said.push("hasta " + fmtK(+p.max)); }
    m = t.match(/(desde|mas de|minimo|a partir de)\s*([\d.,]+)\s*(millones|millon|mill|mil|k|m)?/); if (m) { p.min = String(money(m[2], m[3])); said.push("desde " + fmtK(+p.min)); }
    return { p, said };
  }
  const hint = $("#f-q-hint"), hintDefault = hint.textContent;
  function runNL() {
    const v = qIn.value.trim();
    if (!v) { f.q = ""; hint.textContent = hintDefault; return update(); }
    const ref = all.find((p) => norm(p.ref) === norm(v));
    if (ref) { location.href = A.url.property(ref); return; }
    const { p, said } = parseNL(v);
    if (said.length) {
      for (const k of ["type", "zone", "feat"]) f[k] = [];
      for (const k of ["op", "min", "max", "rooms", "baths", "surface"]) f[k] = "";
      Object.assign(f, p); f.q = ""; f.fav = ""; qIn.value = "";
      hint.innerHTML = `Entendido: <strong>${esc(said.join(" · "))}</strong>`;
    } else { f.q = v; hint.textContent = "Buscando el texto en títulos, zonas y referencias."; }
    update(true);
  }
  qIn.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); runNL(); } });
  qIn.addEventListener("change", () => qIn.value.trim() && runNL());
  qIn.addEventListener("input", () => { if (!qIn.value) { f.q = ""; update(); } });
  // Orden y vista
  $("#f-sort").addEventListener("change", (e) => { f.sort = e.target.value; update(); });
  $$("[data-view]").forEach((b) => b.tagName === "BUTTON" && b.addEventListener("click", () => { f.view = b.dataset.view; update(); }));
  $("[data-mobile-filters]")?.addEventListener("click", () => showPanel("all"));
  $("[data-mobile-view]")?.addEventListener("click", () => { f.view = f.view === "map" ? "grid" : "map"; update(); });

  /* ---------- Mapas ---------- */
  const maps = {};
  function ensureMap(key, el) {
    if (maps[key] !== undefined) { setTimeout(() => maps[key]?.m.invalidateSize(), 50); return maps[key]; }
    const m = A.map.create(el, { center: [39.49, -0.39], zoom: 12, scrollWheelZoom: true });
    maps[key] = m ? { m, layer: L.layerGroup().addTo(m), markers: {} } : null;
    return maps[key];
  }
  function drawMap(key, el, list) {
    const mm = ensureMap(key, el); if (!mm) return;
    mm.layer.clearLayers(); mm.markers = {};
    list.forEach((p) => {
      const mk = A.map.pin(p).bindPopup(A.map.popup(p), { maxWidth: 260, offset: [0, -24] }).addTo(mm.layer);
      mk.on("mouseover", () => $(`[data-hlist] [data-ref="${p.ref}"]`)?.classList.add("is-active"));
      mk.on("mouseout", () => $(`[data-hlist] [data-ref="${p.ref}"]`)?.classList.remove("is-active"));
      mm.markers[p.ref] = mk;
    });
    if (list.length) mm.m.fitBounds(L.latLngBounds(list.map((p) => [p.lat, p.lng])).pad(.25), { maxZoom: 15, animate: !A.reduced });
  }

  /* ---------- Render ---------- */
  function update(push = false) { write(push); render(); }
  function render() {
    const favRefs = A.favs.get();
    const list = data.sort(data.filter(f.fav ? all.filter((p) => favRefs.includes(p.ref)) : all, f), f.sort);
    $("[data-empty]").querySelector(".h3").textContent = f.fav ? "Todavía no ha guardado ninguna propiedad." : "Ahora mismo no tenemos nada que encaje exactamente.";
    const view = f.view || "grid";
    // Cabecera
    const t = title();
    $("[data-l-title]").textContent = t;
    document.title = `${t} · Albor`;
    $("[data-l-count]").textContent = list.length;
    $("[data-l-count-label]").textContent = list.length === 1 ? "propiedad" : "propiedades";
    $("[data-crumbs]").innerHTML = `<li><a href="index.html">Inicio</a></li><li>${f.op || f.type.length || f.zone.length ? '<a href="propiedades.html">Propiedades</a>' : "Propiedades"}</li>${f.op ? `<li>${f.type.length || f.zone.length ? `<a href="${A.url.listing({ op: f.op })}">${f.op === "venta" ? "Venta" : "Alquiler"}</a>` : (f.op === "venta" ? "Venta" : "Alquiler")}</li>` : ""}${f.type.length === 1 ? `<li>${TM[f.type[0]].plural}</li>` : ""}${f.zone.length === 1 ? `<li>${ZM[f.zone[0]].name}</li>` : ""}`;
    $$('.nav a[data-nav]').forEach((a) => a.removeAttribute("aria-current"));
    $(`.nav a[data-nav="${f.op || "propiedades"}"]`)?.setAttribute("aria-current", "page");
    // SEO dinámico por zona
    if (f.zone.length === 1) { const z = ZM[f.zone[0]]; $("[data-seo-title]").textContent = `Inmobiliaria en ${z.name}`; $("[data-seo-text]").innerHTML = `<p>${esc(z.blurb)}</p><p>Conocemos ${esc(z.name)} calle a calle. Si busca vivienda aquí y no la ve publicada, pregúntenos: muchas operaciones se cierran antes de salir al mercado.</p>`; }
    // Controles
    $$("[data-op]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.op === f.op));
    $$(".views [data-view], [data-mobile-view]").forEach((b) => b.dataset.view && b.setAttribute("aria-pressed", b.dataset.view === view));
    $("[data-mobile-view]") && ($("[data-mobile-view]").textContent = view === "map" ? "Lista" : "Mapa");
    $("#f-sort").value = f.sort;
    if (document.activeElement !== qIn) qIn.value = f.q;
    const n = { zone: f.zone.length, type: f.type.length, price: (f.min || f.max) ? 1 : 0, rooms: [f.rooms, f.baths, f.surface].filter(Boolean).length, more: f.feat.length };
    for (const [k, v] of Object.entries(n)) { const el = $(`[data-n="${k}"]`); if (el) el.textContent = v ? `· ${v}` : ""; $(`[data-panel-btn="${k}"]`)?.classList.toggle("is-set", !!v); }
    const total = Object.values(n).reduce((a, b) => a + b, 0) + (f.q ? 1 : 0);
    $$('[data-n="all"]').forEach((el) => (el.textContent = total ? `(${total})` : ""));
    // Chips de filtros activos
    const chips = [];
    f.zone.forEach((v) => chips.push(["zone", v, ZM[v]?.name]));
    f.type.forEach((v) => chips.push(["type", v, TM[v]?.name]));
    if (f.min || f.max) chips.push(["price", "", priceLabel()]);
    if (f.rooms) chips.push(["rooms", "", `${f.rooms}+ hab.`]);
    if (f.baths) chips.push(["baths", "", `${f.baths}+ baños`]);
    if (f.surface) chips.push(["surface", "", `${f.surface}+ m²`]);
    f.feat.forEach((v) => chips.push(["feat", v, featName(v)]));
    if (f.q) chips.push(["q", "", `“${f.q}”`]);
    if (f.fav) chips.push(["fav", "", "Solo favoritas"]);
    $("[data-active]").innerHTML = chips.map(([k, v, l]) => `<span class="afchip">${esc(l)}<button type="button" data-rm="${k}" data-v="${v}" aria-label="Quitar ${esc(l)}">×</button></span>`).join("") + (chips.length > 1 ? '<button type="button" class="afclear" data-clear>Quitar todos</button>' : "");
    // Resultados
    const results = $(".results"); results.dataset.view = view;
    $("[data-empty]").hidden = !!list.length;
    $("[data-grid]").innerHTML = view === "grid" ? list.map((p, i) => A.card(p, { eager: i < 3 })).join("") : "";
    $("[data-hlist]").innerHTML = view === "hybrid" ? list.map((p) => A.card(p)).join("") : "";
    if (view === "map") drawMap("full", $("[data-map-full]"), list);
    if (view === "hybrid") {
      drawMap("hybrid", $("[data-map-hybrid]"), list);
      $$("[data-hlist] .pcard").forEach((c) => {
        const mk = () => maps.hybrid?.markers[c.dataset.ref];
        c.addEventListener("mouseenter", () => { mk()?.getElement()?.classList.add("is-active"); mk()?.setZIndexOffset(1000); });
        c.addEventListener("mouseleave", () => { mk()?.getElement()?.classList.remove("is-active"); mk()?.setZIndexOffset(0); });
      });
    }
    if (openPanel) drawPanel();
    A.observe(results); A.syncFavs();
  }
  document.addEventListener("albor:favs", () => f.fav && render());
  $("[data-active]").addEventListener("click", (e) => {
    const b = e.target.closest("[data-rm]"); if (!b) return;
    const k = b.dataset.rm, v = b.dataset.v;
    if (ARR.includes(k)) f[k] = f[k].filter((x) => x !== v);
    else if (k === "price") f.min = f.max = "";
    else f[k] = "";
    update();
  });
  render();
})();
