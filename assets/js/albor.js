/* ==========================================================================
   ALBOR · núcleo
   - Albor.data: capa de datos desacoplada del diseño.
     Producción: window.ALBOR_CONFIG.api = "/wp-json/albor/v1" (plugin albor-core,
     alimentado por la sincronización con Inmovilla). Prototipo: JSON local de demo.
   - UI global: header, menú fullscreen, cursor, magnetismo, reveals, parallax,
     contadores, banner de cookies.
   ========================================================================== */
(() => {
  const CONFIG = Object.assign({
    api: null,                         // "/wp-json/albor/v1" en WordPress
    localData: "assets/data/properties.json",
    localZones: "assets/data/zones.json",
    img: (name, w = 1600) => `assets/img/${name}.webp`,
    contact: {
      // DATOS DE MUESTRA (inventados para el prototipo) — sustituir por los reales antes de publicar
      phone: "+34 963 52 20 06",
      whatsapp: "34611200620",
      email: "hola@alborvalencia.es",
      instagram: "albor.valencia",
      hours: "Lunes a viernes, 9:30–14:00 y 16:30–20:00 · Sábados, con cita",
      address: "Calle Colón 3, 46004 Valencia",
      lat: 39.4693, lng: -0.3737
    }
  }, window.ALBOR_CONFIG || {});

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isMobile = () => innerWidth < 760;
  document.documentElement.classList.add("js");

  /* ---------------- Helpers ---------------- */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const nf = new Intl.NumberFormat("es-ES");
  const fmtPrice = (p) => p?.price == null ? "Precio a consultar" : `${nf.format(p.price)} €${p.operation === "alquiler" ? "/mes" : ""}`;
  const ARROW = '<svg class="arrow" viewBox="0 0 18 10" aria-hidden="true"><path d="M0 5h16.5M12.5 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>';

  /* ---------------- Data layer ---------------- */
  const cache = {};
  const getJSON = async (url) => (cache[url] ??= fetch(url).then((r) => { if (!r.ok) throw new Error(url + " " + r.status); return r.json(); }));

  const data = {
    config: CONFIG,
    async zones() { return getJSON(CONFIG.api ? `${CONFIG.api}/taxonomies` : CONFIG.localZones); },
    async all() {
      const j = await getJSON(CONFIG.api ? `${CONFIG.api}/properties?per_page=500` : CONFIG.localData);
      return (j.properties || j).filter((p) => p.status !== "vendido" && p.status !== "alquilado");
    },
    async meta() { const j = await getJSON(CONFIG.localData); return j._meta || {}; },
    async byRef(ref) { return (await this.all()).find((p) => p.ref === ref || p.slug === ref); },
    /** Estadísticas SIEMPRE calculadas desde el inventario (nunca escritas a mano).
        En WordPress: GET /albor/v1/stats devuelve exactamente esta forma. */
    async stats() {
      if (CONFIG.api) return getJSON(`${CONFIG.api}/stats`);
      const [list, z] = await Promise.all([this.all(), this.zones()]);
      const by = (k) => list.reduce((o, p) => ((o[p[k]] = (o[p[k]] || 0) + 1), o), {});
      const premium = new Set(z.zones.filter((x) => x.premium).map((x) => x.slug));
      return {
        total_properties: list.length,
        sale_properties: list.filter((p) => p.operation === "venta").length,
        rent_properties: list.filter((p) => p.operation === "alquiler").length,
        properties_by_city: by("city"),
        properties_by_zone: by("zone"),
        properties_by_type: by("type"),
        premium_zone_properties: list.filter((p) => premium.has(p.zone)).length,
        source: "demo"
      };
    },
    /** Filtro único usado por listado, mapa y contadores de facetas. */
    filter(list, f = {}) {
      const q = (f.q || "").trim().toLowerCase();
      return list.filter((p) => {
        if (f.op && p.operation !== f.op) return false;
        if (f.type?.length && !f.type.includes(p.type)) return false;
        if (f.zone?.length && !f.zone.includes(p.zone)) return false;
        if (f.min && p.price < +f.min) return false;
        if (f.max && p.price > +f.max) return false;
        if (f.rooms && p.rooms < +f.rooms) return false;
        if (f.baths && p.baths < +f.baths) return false;
        if (f.surface && p.surface < +f.surface) return false;
        if (f.feat?.length && !f.feat.every((x) => p.features.includes(x))) return false;
        if (q && !(`${p.ref} ${p.title} ${p.zone} ${p.city} ${p.type}`.toLowerCase().includes(q))) return false;
        return true;
      });
    },
    sort(list, s) {
      const a = [...list];
      if (s === "precio-asc") a.sort((x, y) => x.price - y.price);
      else if (s === "precio-desc") a.sort((x, y) => y.price - x.price);
      else if (s === "superficie") a.sort((x, y) => y.surface - x.surface);
      return a;
    }
  };

  /* ---------------- Templates ---------------- */
  let ZONES = null, TYPES = null;
  const zoneName = (slug) => ZONES?.[slug]?.name || slug;
  const typeName = (slug) => TYPES?.[slug]?.name || slug;
  const url = {
    property: (p) => `propiedad.html?ref=${encodeURIComponent(p.ref)}`,
    listing: (o = {}) => "propiedades.html" + (Object.keys(o).length ? "?" + new URLSearchParams(o) : "")
  };

  function card(p, { wide = false, eager = false } = {}) {
    const img = CONFIG.img(p.images[0]);
    return `
    <article class="pcard${wide ? " pcard--wide" : ""}" data-ref="${esc(p.ref)}">
      <a class="pcard__link" href="${url.property(p)}" data-cursor="Explorar">
      <div class="pcard__media">
        <div class="pcard__top">
          <span class="tag tag--fill">${p.operation === "venta" ? "Venta" : "Alquiler"}</span>
          ${p.demo ? '<span class="tag tag--demo" title="Propiedad de demostración, no real">Demo</span>' : ""}
        </div>
        <img src="${img}" alt="${esc(p.title)} — ${esc(zoneName(p.zone))}" loading="${eager ? "eager" : "lazy"}" decoding="async" width="1200" height="1500">
        <div class="pcard__cta"><span>Explorar propiedad</span>${ARROW}</div>
      </div>
      <div class="pcard__body">
        <p class="label pcard__loc">${esc(p.city)} · ${esc(zoneName(p.zone))}</p>
        <h3 class="pcard__title">${esc(p.title)}</h3>
        <div class="pcard__meta">
          <span class="pcard__specs"><span>${p.surface} m²</span>${p.rooms ? `<span>${p.rooms} hab.</span>` : ""}${p.baths ? `<span>${p.baths} baños</span>` : ""}</span>
          <span class="pcard__price">${fmtPrice(p)}</span>
        </div>
      </div>
      </a>
      ${favButton(p)}
    </article>`;
  }

  /* ---------------- Favoritos (por visitante, en este navegador) ----------------
     En producción podría sincronizarse con un área privada; aquí, localStorage con try/catch. */
  const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.1 3.6 4.5 7.2 4.5c2 0 3.5 1.1 4.8 2.8 1.3-1.7 2.8-2.8 4.8-2.8 3.6 0 5.7 3.6 4.5 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';
  const favs = {
    get() { try { return JSON.parse(localStorage.getItem("albor-favs") || "[]"); } catch (e) { return []; } },
    has(ref) { return this.get().includes(ref); },
    toggle(ref) { const l = this.get(), i = l.indexOf(ref); i > -1 ? l.splice(i, 1) : l.push(ref); try { localStorage.setItem("albor-favs", JSON.stringify(l)); } catch (e) {} sync(); document.dispatchEvent(new CustomEvent("albor:favs")); return i === -1; }
  };
  function favButton(p, cls = "pcard__fav") {
    const on = favs.has(p.ref);
    return `<button type="button" class="${cls}" data-fav="${esc(p.ref)}" aria-pressed="${on}" aria-label="${on ? "Quitar de" : "Guardar en"} favoritas: ${esc(p.title)}">${HEART}</button>`;
  }
  function sync() {
    const l = favs.get();
    $$("[data-fav]").forEach((b) => { const on = l.includes(b.dataset.fav); b.setAttribute("aria-pressed", on); b.setAttribute("aria-label", (b.getAttribute("aria-label") || "").replace(/^(Quitar de|Guardar en)/, on ? "Quitar de" : "Guardar en")); });
    $$("[data-fav-count]").forEach((el) => { el.textContent = l.length || ""; el.closest(".fav-link")?.classList.toggle("has-favs", !!l.length); });
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-fav]"); if (!b) return;
    e.preventDefault();
    const added = favs.toggle(b.dataset.fav);
    b.classList.remove("is-pop"); void b.offsetWidth; if (added) b.classList.add("is-pop");
  });

  /* Compartir: menú nativo en móvil; en escritorio, copiar el enlace. */
  async function share({ title, text, url: u = location.href }, btn) {
    if (navigator.share) { try { await navigator.share({ title, text, url: u }); } catch (e) {} return; }
    try { await navigator.clipboard.writeText(u); if (btn) { const t = btn.innerHTML; btn.textContent = "Enlace copiado"; setTimeout(() => (btn.innerHTML = t), 1800); } } catch (e) { prompt("Copie el enlace:", u); }
  }

  function popup(p) {
    return `<a class="map-pop" href="${url.property(p)}">
      <img src="${CONFIG.img(p.images[0])}" alt="">
      <div class="map-pop__b">
        <span class="label label--muted">${p.operation === "venta" ? "Venta" : "Alquiler"} · ${esc(typeName(p.type))} · ${esc(zoneName(p.zone))}${p.demo ? " · <span style='color:var(--terracota)'>Demo</span>" : ""}</span>
        <span class="map-pop__t">${esc(p.title)}</span>
        <span class="num" style="font-weight:500">${fmtPrice(p)}</span>
        <span class="link-u label" style="margin-top:6px;justify-self:start">Explorar propiedad ${ARROW}</span>
      </div></a>`;
  }

  /* ---------------- Map helper (Leaflet) ---------------- */
  const map = {
    create(el, opts = {}) {
      if (!window.L) { el.innerHTML = '<p class="placeholder-note" style="margin:24px">Mapa no disponible sin conexión</p>'; return null; }
      const m = L.map(el, { zoomControl: false, scrollWheelZoom: false, attributionControl: true, ...opts }).setView(opts.center || [39.4745, -0.3700], opts.zoom || 13);
      L.control.zoom({ position: "bottomright" }).addTo(m);
      m.setMaxZoom(el.classList.contains("map--night") ? 16 : 18);
      // Esri (sin API key, atribución obligatoria). Noche: Dark Gray Canvas. Día: World Street Map en grises (filtro CSS).
      // En producción puede sustituirse por un estilo propio (MapLibre + teselas vectoriales).
      const esri = "https://server.arcgisonline.com/ArcGIS/rest/services/", att = "Tiles © Esri — Esri, HERE, Garmin, © OpenStreetMap";
      if (el.classList.contains("map--night")) {
        L.tileLayer(esri + "Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", { attribution: att, maxZoom: 16 }).addTo(m);
        L.tileLayer(esri + "Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}", { maxZoom: 16, pane: "shadowPane" }).addTo(m);
      } else {
        L.tileLayer(esri + "World_Street_Map/MapServer/tile/{z}/{y}/{x}", { attribution: att, maxZoom: 18 }).addTo(m);
      }
      return m;
    },
    pin(p) {
      const label = p.operation === "alquiler" ? `${nf.format(p.price)} €/mes` : (p.price >= 1e6 ? `${(p.price / 1e6).toLocaleString("es-ES", { maximumFractionDigits: 2 })} M€` : `${Math.round(p.price / 1000)} k€`);
      return L.marker([p.lat, p.lng], { icon: L.divIcon({ className: "pin", html: `<span class="pin__inner">${label}</span>`, iconSize: null }), keyboard: true, title: p.title, riseOnHover: true });
    },
    zoneDot(z, n) {
      const size = 34 + Math.min(n, 8) * 6;
      return L.marker([z.lat, z.lng], { icon: L.divIcon({ className: "zone-dot", html: `<span class="zone-dot__inner" style="width:${size}px;height:${size}px">${n}</span>`, iconSize: null }), title: `${z.name}: ${n} propiedades`, keyboard: false });
    },
    popup
  };

  /* ---------------- UI: header ---------------- */
  function initHeader() {
    const h = $(".header"); if (!h) return;
    const hero = $("[data-hero]");
    let last = scrollY;
    const update = () => {
      const y = scrollY;
      const overHero = hero && y < hero.offsetHeight - 80;
      h.classList.toggle("is-over-hero", !!overHero);
      h.classList.toggle("is-solid", !overHero && y > 10);
      h.classList.toggle("is-hidden", y > last && y > 400 && !document.documentElement.classList.contains("menu-open"));
      last = y;
    };
    addEventListener("scroll", update, { passive: true }); update();
  }

  /* ---------------- UI: menú fullscreen ---------------- */
  function initMenu() {
    const btn = $(".menu-btn"), menu = $(".menu"); if (!btn || !menu) return;
    const imgs = $$(".menu__visual img", menu);
    const toggle = (open = !document.documentElement.classList.contains("menu-open")) => {
      document.documentElement.classList.toggle("menu-open", open);
      btn.setAttribute("aria-expanded", open);
      btn.querySelector(".menu-btn__txt").textContent = open ? "Cerrar" : "Menú";
      menu.inert = !open;
      if (open) { window.__lenis?.stop(); setTimeout(() => $(".menu__item", menu)?.focus(), 400); } else { window.__lenis?.start(); btn.focus(); }
    };
    menu.inert = true;
    btn.addEventListener("click", () => toggle());
    addEventListener("keydown", (e) => { if (e.key === "Escape" && document.documentElement.classList.contains("menu-open")) toggle(false); });
    $$(".menu__item", menu).forEach((a, i) => {
      a.style.setProperty("--i", i);
      const on = () => imgs.forEach((im) => im.classList.toggle("is-on", im.dataset.for === a.dataset.img));
      a.addEventListener("mouseenter", on); a.addEventListener("focus", on);
    });
    imgs[0]?.classList.add("is-on");
  }

  /* ---------------- UI: cursor + magnetismo ---------------- */
  function initCursor() {
    if (!finePointer || reduced) return;
    const c = document.createElement("div");
    c.className = "cursor"; c.setAttribute("aria-hidden", "true");
    c.innerHTML = '<div class="cursor__dot"></div><div class="cursor__label"></div>';
    document.body.appendChild(c);
    document.documentElement.classList.add("has-cursor");
    const lab = c.querySelector(".cursor__label");
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; c.classList.add("is-live"); }, { passive: true });
    const loop = () => { cx += (x - cx) * .22; cy += (y - cy) * .22; c.style.transform = `translate3d(${cx}px,${cy}px,0)`; requestAnimationFrame(loop); };
    loop();
    document.addEventListener("pointerover", (e) => {
      const t = e.target.closest("[data-cursor], a, button, label, select");
      const label = t?.closest("[data-cursor]")?.dataset.cursor;
      c.classList.toggle("is-label", !!label);
      c.classList.toggle("is-hover", !!t && !label);
      if (label) lab.textContent = label;
    });
    document.documentElement.addEventListener("pointerleave", () => c.classList.remove("is-live"));
  }
  function initMagnetic() {
    if (!finePointer || reduced) return;
    $$(".btn, [data-magnetic]").forEach((el) => {
      const s = +(el.dataset.magnetic || .22);
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * s}px, ${(e.clientY - r.top - r.height / 2) * s}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transition = "transform .6s cubic-bezier(.2,.7,.1,1)"; el.style.transform = ""; setTimeout(() => el.style.transition = "", 600); });
    });
  }

  /* ---------------- Reveals ---------------- */
  let io;
  function observe(root = document) {
    const els = $$(".reveal, .img-reveal, [data-reveal], [data-count]", root);
    if (reduced || !("IntersectionObserver" in window)) { els.forEach((e) => { e.classList.add("is-in"); if (e.dataset.count) countTo(e); }); return; }
    io ??= new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("is-in");
      if (en.target.dataset.count != null) countTo(en.target);
      io.unobserve(en.target);
    }), { rootMargin: "0px 0px -8% 0px", threshold: .12 });
    els.forEach((e) => io.observe(e));
  }
  function countTo(el) {
    const target = +el.dataset.count; if (isNaN(target)) return;
    if (reduced) { el.textContent = nf.format(target); return; }
    const dur = 1600, t0 = performance.now(), pad = el.dataset.pad ? +el.dataset.pad : 0;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), v = Math.round(target * (1 - Math.pow(1 - k, 4)));
      el.textContent = pad ? String(v).padStart(pad, "0") : nf.format(v);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------------- Parallax (velocidades por elemento) ---------------- */
  function initParallax() {
    if (reduced) return;
    const items = () => $$("[data-speed]").filter((el) => !(isMobile() && el.dataset.speedMobile === "0"));
    let list = items();
    const tick = () => {
      const vh = innerHeight;
      for (const el of list) {
        const r = (el.parentElement || el).getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        const sp = +el.dataset.speed * (isMobile() ? .5 : 1);
        const off = (r.top + r.height / 2 - vh / 2) * -sp;
        el.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0)`;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    addEventListener("resize", () => (list = items()));
    data.refreshParallax = () => (list = items());
  }

  /* ---------------- Smooth scroll (solo desktop) ---------------- */
  function initLenis() {
    if (reduced || !finePointer || !window.Lenis || document.body.dataset.noLenis != null) return;
    const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    window.__lenis = lenis;
    if (window.gsap && window.ScrollTrigger) { lenis.on("scroll", ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => { const t = $(a.getAttribute("href")); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -60 }); } }));
  }

  /* ---------------- Contacto (placeholders honestos) ---------------- */
  function initContactLinks() {
    const c = CONFIG.contact;
    $$("[data-contact]").forEach((el) => {
      const k = el.dataset.contact, v = c[k];
      if (!v) { el.classList.add("ph"); el.title = "Dato pendiente de la firma"; if (el.tagName === "A") el.addEventListener("click", (e) => e.preventDefault()); return; }
      if (k === "phone") { el.href = `tel:${v.replace(/\s/g, "")}`; el.textContent = v; }
      if (k === "email") { el.href = `mailto:${v}`; el.textContent = v; }
      if (k === "whatsapp") el.href = `https://wa.me/${v}`;
      if (k === "instagram") el.href = `https://instagram.com/${v}`;
    });
  }

  /* ---------------- Cookies (preparado; textos legales pendientes) ---------------- */
  function initCookies() {
    const el = $(".cookies"); if (!el) return;
    let v = null; try { v = localStorage.getItem("albor-cookies"); } catch (e) {}
    if (!v) el.classList.add("is-on");
    $$("[data-cookies]", el).forEach((b) => b.addEventListener("click", () => { try { localStorage.setItem("albor-cookies", b.dataset.cookies); } catch (e) {} el.classList.remove("is-on"); }));
  }
  function initDemoRibbon() {
    const el = $(".demo-ribbon"); if (!el) return;
    let off = false; try { off = sessionStorage.getItem("albor-demo-off"); } catch (e) {}
    if (off) return el.remove();
    el.querySelector("button")?.addEventListener("click", () => { el.remove(); try { sessionStorage.setItem("albor-demo-off", 1); } catch (e) {} });
  }

  /* ---------------- Formularios (validación accesible; envío simulado en el prototipo) ---------------- */
  function validate(form) {
    let ok = true;
    $$("[required]", form).forEach((inp) => {
      const f = inp.closest(".field") || inp.closest(".check");
      const err = f?.querySelector(".field__error");
      let msg = "";
      if (inp.type === "checkbox" && !inp.checked) msg = "Necesitamos su consentimiento para responderle.";
      else if (!inp.value.trim()) msg = "Este campo es obligatorio.";
      else if (inp.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inp.value)) msg = "Revise el formato del email.";
      else if (inp.type === "tel" && inp.value.replace(/\D/g, "").length < 9) msg = "Revise el teléfono.";
      f?.classList.toggle("is-invalid", !!msg);
      inp.setAttribute("aria-invalid", !!msg);
      if (err) err.textContent = msg;
      if (msg && ok) { inp.focus(); ok = false; }
    });
    return ok;
  }
  function initForms(root = document) {
    $$("form[data-albor-form], form[data-wform]", root).forEach((form) => {
      // Campo trampa: invisible para personas, los bots lo rellenan. En producción, además, Cloudflare Turnstile.
      if (!form.querySelector("[name=website]")) form.insertAdjacentHTML("afterbegin", '<div class="hp" aria-hidden="true"><label>Web <input name="website" tabindex="-1" autocomplete="off"></label></div>');
      if (!form.matches("[data-albor-form]")) return;
      form.setAttribute("novalidate", "");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (form.website?.value) return; // bot
        if (!validate(form)) return;
        // Producción: POST a /wp-json/albor/v1/lead → CRM (Inmovilla) + email a la firma.
        const done = form.querySelector("[data-success]");
        if (done) { form.querySelectorAll(":scope > :not([data-success])").forEach((n) => n.hidden = true); done.hidden = false; done.focus(); }
      });
    });
  }

  /* ---------------- Boot ---------------- */
  async function boot() {
    try {
      const z = await data.zones();
      ZONES = Object.fromEntries(z.zones.map((x) => [x.slug, x]));
      TYPES = Object.fromEntries(z.types.map((x) => [x.slug, x]));
    } catch (e) { console.warn("Albor: zonas no disponibles", e); }
    initHeader(); initMenu(); initCursor(); initMagnetic(); initLenis(); initParallax(); initContactLinks(); initCookies(); initDemoRibbon(); initForms();
    observe(); sync();
    $$("[data-year]").forEach((e) => (e.textContent = new Date().getFullYear()));
    document.dispatchEvent(new CustomEvent("albor:ready"));
  }

  window.Albor = { $, $$, esc, nf, fmtPrice, ARROW, HEART, data, card, map, url, favs, favButton, share, syncFavs: () => sync(), observe, initMagnetic, initForms, zoneName, typeName, reduced, finePointer, isMobile, get zones() { return ZONES; }, get types() { return TYPES; }, ready: new Promise((r) => document.addEventListener("albor:ready", r, { once: true })) };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();
})();
