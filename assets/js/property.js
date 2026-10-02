/* ALBOR · Ficha de propiedad
   En WordPress esta plantilla es single-property.php: el HTML, las metaetiquetas y el JSON-LD
   se imprimen en servidor. Aquí se hidrata desde la capa de datos para el prototipo. */
(async () => {
  await window.Albor.ready;
  const A = window.Albor, { $, $$, esc, nf, fmtPrice, data } = A;
  const ref = new URLSearchParams(location.search).get("ref") || "DEMO-001";
  const [p, all] = await Promise.all([data.byRef(ref), data.all()]);
  const P = (k) => $(`[data-p="${k}"]`);
  if (!p) {
    $("[data-property]").innerHTML = `<section class="page-hero wrap"><p class="label label--muted">Referencia ${esc(ref)}</p><h1 class="h2 mt-3">Esta propiedad ya no está disponible.</h1><p class="body-2 mt-3">Puede que se haya vendido o alquilado. Le enseñamos otras parecidas.</p><a class="btn mt-5" href="propiedades.html">Ver propiedades ${A.ARROW}</a></section>`;
    return;
  }
  const zone = A.zones[p.zone] || { name: p.zone, blurb: "" };
  const type = A.types[p.type]?.name || p.type;
  const opLabel = p.operation === "venta" ? "Venta" : "Alquiler";
  const img = (n) => `assets/img/${n}.webp`;

  /* ---------- SEO (en WP: servidor) ---------- */
  const seoTitle = `${p.title} · ${type} en ${p.operation} en ${zone.name} · Ref. ${p.ref} · Albor`;
  const seoDesc = `${type} en ${p.operation} en ${zone.name}, ${p.city}: ${p.surface} m², ${p.rooms} habitaciones, ${p.baths} baños. ${p.excerpt}`.slice(0, 158);
  document.title = seoTitle;
  $('meta[name="description"]').content = seoDesc;
  $('meta[property="og:title"]').content = p.title;
  $('meta[property="og:description"]').content = seoDesc;
  $('meta[property="og:image"]').content = `https://nocodya-hue.github.io/albor-valencia/assets/img/${p.images[0]}.webp`;
  $('link[rel="canonical"]').href = `https://nocodya-hue.github.io/albor-valencia/propiedad/${p.slug}-${p.ref.toLowerCase()}/`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RealEstateListing", name: p.title, description: p.excerpt, url: $('link[rel="canonical"]').href,
        image: p.images.map((n) => `https://nocodya-hue.github.io/albor-valencia/assets/img/${n}.webp`), datePosted: null,
        offers: { "@type": "Offer", price: p.price, priceCurrency: "EUR", businessFunction: p.operation === "venta" ? "http://purl.org/goodrelations/v1#Sell" : "http://purl.org/goodrelations/v1#LeaseOut", availability: "https://schema.org/InStock" },
        about: {
          "@type": p.type === "piso" || p.type === "atico" ? "Apartment" : "SingleFamilyResidence",
          numberOfRooms: p.rooms, numberOfBathroomsTotal: p.baths,
          floorSize: { "@type": "QuantitativeValue", value: p.surface, unitCode: "MTK" },
          address: { "@type": "PostalAddress", addressLocality: p.city, addressRegion: "Valencia", addressCountry: "ES" },
          geo: { "@type": "GeoCoordinates", latitude: +p.lat.toFixed(3), longitude: +p.lng.toFixed(3) }
        }
      },
      { "@type": "BreadcrumbList", itemListElement: [["Inicio", "/"], ["Propiedades", "/propiedades/"], [opLabel, `/propiedades/${p.operation}/`], [zone.name, `/propiedades/${p.operation}/${p.zone}/`], [p.title, null]].map(([n, u], i) => ({ "@type": "ListItem", position: i + 1, name: n, ...(u ? { item: "https://nocodya-hue.github.io/albor-valencia" + u } : {}) })) }
    ]
  };
  const s = document.createElement("script"); s.type = "application/ld+json"; s.textContent = JSON.stringify(ld); document.head.appendChild(s);

  /* ---------- Hero ---------- */
  const heroImg = P("hero"); heroImg.src = img(p.images[0]); heroImg.alt = p.title;
  P("crumbs").innerHTML = `<li><a href="index.html">Inicio</a></li><li><a href="${A.url.listing({ op: p.operation })}">${opLabel}</a></li><li><a href="${A.url.listing({ op: p.operation, zone: p.zone })}">${esc(zone.name)}</a></li><li aria-current="page">Ref. ${esc(p.ref)}</li>`;
  P("tags").innerHTML = `<span class="tag tag--fill">${opLabel}</span><span class="tag" style="color:var(--cal)">${esc(type)}</span><span class="tag" style="color:var(--cal)">Ref. ${esc(p.ref)}</span>${p.demo ? '<span class="tag tag--demo">Propiedad de demostración</span>' : ""}`;
  P("title").innerHTML = `<span class="line-mask"><span>${esc(p.title)}</span></span>`;
  requestAnimationFrame(() => $(".p-hero .line-mask").classList.add("is-in"));
  P("loc").textContent = `${p.city} · ${zone.name}`;
  P("fav").outerHTML = A.favButton(p, "p-fav");
  P("share").addEventListener("click", (e) => A.share({ title: p.title, text: `${p.title} · ${fmtPrice(p)} · Albor` }, e.currentTarget));
  P("price").textContent = fmtPrice(p);

  /* ---------- Datos clave ---------- */
  const facts = [
    ["Superficie", p.surface, "m²"], ["Habitaciones", p.rooms], ["Baños", p.baths],
    p.terrace ? ["Terraza", p.terrace, "m²"] : p.plot ? ["Parcela", p.plot, "m²"] : null,
    p.plot && p.terrace ? ["Parcela", p.plot, "m²"] : ["Garaje", p.garage || "—", p.garage ? (p.garage > 1 ? "plazas" : "plaza") : ""],
    ["Planta", p.floor || (p.plot ? "Unifamiliar" : "—")]
  ].filter(Boolean).slice(0, 6);
  P("facts").innerHTML = facts.map(([k, v, u]) => `<div class="p-fact"><dt class="label label--muted">${k}</dt><dd class="v">${typeof v === "number" ? `<span data-count="${v}">0</span>` : `<span style="font-size:.6em">${esc(v)}</span>`}${u ? `<small>${u}</small>` : ""}</dd></div>`).join("");

  /* ---------- Descripción / detalles ---------- */
  P("desc").innerHTML = p.description.map((t) => `<p>${esc(t)}</p>`).join("") + (p.demo ? '<p class="ph" style="font-size:13px">Texto de ejemplo. En producción: descripción editorial redactada por la firma y sincronizada desde Inmovilla.</p>' : "");
  const det = [
    ["Referencia", p.ref], ["Operación", opLabel], ["Tipo", type], ["Zona", `${zone.name}, ${p.city}`],
    ["Precio", fmtPrice(p)], p.operation === "venta" ? ["Precio por m²", `${nf.format(Math.round(p.price / p.surface))} €/m²`] : null,
    ["Superficie construida", `${p.surface} m²`], p.plot ? ["Parcela", `${nf.format(p.plot)} m²`] : null, p.terrace ? ["Terraza", `${p.terrace} m²`] : null,
    ["Habitaciones", p.rooms], ["Baños", p.baths], ["Garaje", p.garage ? `${p.garage} ${p.garage > 1 ? "plazas" : "plaza"}` : "No"],
    ["Año de construcción", p.year_built || "—"], ["Estado", p.status === "disponible" ? "Disponible" : p.status],
    ["Certificado energético", p.energy || "[Pendiente de Inmovilla]"]
  ].filter(Boolean);
  P("details").innerHTML = det.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("");
  const FN = Object.fromEntries((await data.zones()).features.map((x) => [x.slug, x.name]));
  P("features").innerHTML = p.features.map((x) => `<li>${esc(FN[x] || x)}</li>`).join("");

  /* ---------- Ubicación ---------- */
  P("zone-title").textContent = `${zone.name}, ${p.city}`;
  P("zone-blurb").textContent = zone.blurb;
  const m = A.map.create(P("map"), { center: [p.lat, p.lng], zoom: 15 });
  if (m) {
    // Privacidad: círculo aproximado, nunca el portal exacto.
    L.circle([p.lat + .0006, p.lng - .0005], { radius: 260, color: "#4A3A2C", weight: 1, fillColor: "#A8735A", fillOpacity: .14 }).addTo(m);
    L.marker([39.4693, -0.3737], { icon: L.divIcon({ className: "pin", html: '<span class="pin__inner">Albor · Colón 3</span>', iconSize: null }) }).addTo(m);
  }

  /* ---------- Formulario ---------- */
  P("ref-input").value = p.ref;
  P("msg").value = `Hola, me interesa la propiedad ${p.ref} (${p.title}). ¿Podemos concertar una visita?`;
  P("sticky-ref").textContent = `Ref. ${p.ref}`;
  P("sticky-price").textContent = fmtPrice(p);
  const sticky = P("sticky");
  addEventListener("scroll", () => sticky.classList.toggle("is-on", scrollY > innerHeight * .8 && $("#contacto-propiedad").getBoundingClientRect().top > innerHeight), { passive: true });

  /* ---------- Financiación (solo venta) ---------- */
  if (p.operation === "venta") {
    P("finance").hidden = false;
    const mp = $("#m-price"), md = $("#m-down"), my = $("#m-years"), mr = $("#m-rate");
    mp.value = p.price;
    const eur = (v) => nf.format(Math.round(v)) + " €";
    const calc = () => {
      const price = +mp.value || 0, down = price * +md.value, loan = price - down, n = +my.value * 12, r = (+mr.value || 0) / 1200;
      const fee = r ? loan * r / (1 - Math.pow(1 + r, -n)) : loan / n;
      $("[data-mort-fee]").textContent = loan > 0 ? eur(fee) : "—";
      $("[data-mort-loan]").textContent = eur(loan); $("[data-mort-down]").textContent = eur(down); $("[data-mort-int]").textContent = eur(fee * n - loan);
    };
    $("[data-mort]").addEventListener("input", calc); calc();
    $("[data-mort-cta]").addEventListener("click", () => { P("fin-check").checked = true; });
  } else { P("n-ubi").textContent = "04"; P("n-visita").textContent = "05"; P("fin-check").closest("label").remove(); }

  /* ---------- Similares ---------- */
  const sim = all.filter((x) => x.ref !== p.ref && x.operation === p.operation)
    .map((x) => ({ x, s: (x.zone === p.zone) * 3 + (x.type === p.type) * 2 + (A.zones[x.zone]?.group === zone.group) - Math.abs(x.price - p.price) / p.price }))
    .sort((a, b) => b.s - a.s).slice(0, 3).map((o) => o.x);
  P("similar").innerHTML = sim.map((x) => A.card(x)).join("");
  P("more-link").href = A.url.listing({ op: p.operation });

  /* ---------- Galería inmersiva ---------- */
  const track = $('[data-g="track"]'), vp = $(".gallery__viewport");
  track.innerHTML = p.images.map((n, i) => `<figure class="gallery__slide" role="group" aria-roledescription="diapositiva" aria-label="${i + 1} de ${p.images.length}"><img src="${img(n)}" alt="${esc(p.title)} — fotografía ${i + 1}" loading="${i < 3 ? "eager" : "lazy"}" draggable="false"></figure>`).join("");
  const slides = $$(".gallery__slide", track);
  $('[data-g="n"]').textContent = String(slides.length).padStart(2, "0");
  let cur = 0;
  const margin = () => parseFloat(getComputedStyle(track).paddingLeft);
  const offsetFor = (i) => -(slides[i].offsetLeft - margin());
  const go = (i, anim = true) => {
    cur = Math.max(0, Math.min(slides.length - 1, i));
    track.style.transition = anim ? "" : "none";
    const maxOff = -(track.scrollWidth - vp.clientWidth);
    track.style.transform = `translate3d(${Math.max(maxOff, offsetFor(cur))}px,0,0)`;
    slides.forEach((s, k) => s.classList.toggle("is-current", k === cur));
    $('[data-g="i"]').textContent = String(cur + 1).padStart(2, "0");
    $('[data-g="bar"]').style.width = `${((cur + 1) / slides.length) * 100}%`;
  };
  $('[data-g="prev"]').addEventListener("click", () => go(cur - 1));
  $('[data-g="next"]').addEventListener("click", () => go(cur + 1));
  vp.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { e.preventDefault(); go(cur + 1); } if (e.key === "ArrowLeft") { e.preventDefault(); go(cur - 1); } if (e.key === "Enter") openLB(cur); });
  // Arrastre (ratón y táctil)
  let sx = 0, sy = 0, base = 0, dragging = false, moved = 0;
  vp.addEventListener("pointerdown", (e) => { dragging = true; moved = 0; sx = e.clientX; sy = e.clientY; base = new DOMMatrix(getComputedStyle(track).transform).m41; track.style.transition = "none"; });
  addEventListener("pointermove", (e) => { if (!dragging) return; const dx = e.clientX - sx; if (Math.abs(dx) < Math.abs(e.clientY - sy) && moved === 0) return; moved = dx; track.style.transform = `translate3d(${base + dx}px,0,0)`; });
  addEventListener("pointerup", () => { if (!dragging) return; dragging = false; if (Math.abs(moved) > 60) go(cur + (moved < 0 ? 1 : -1)); else go(cur); });
  vp.addEventListener("click", (e) => { if (Math.abs(moved) > 5) return; const s = e.target.closest(".gallery__slide"); if (!s) return; const i = slides.indexOf(s); i === cur ? openLB(i) : go(i); });
  addEventListener("resize", () => go(cur, false));
  Promise.all(slides.slice(0, 3).map((s) => s.querySelector("img").decode?.().catch(() => {}))).then(() => go(0, false));
  go(0, false);

  // Lightbox
  const lb = $("[data-lightbox]"); let li = 0, lastFocus;
  const lbShow = () => { $('[data-lb="stage"]').innerHTML = `<img src="${img(p.images[li])}" alt="${esc(p.title)} — fotografía ${li + 1}">`; $('[data-lb="count"]').textContent = `${String(li + 1).padStart(2, "0")} / ${String(p.images.length).padStart(2, "0")}`; $('[data-lb="title"]').textContent = `${p.title} · Ref. ${p.ref}`; };
  function openLB(i) { li = i; lastFocus = document.activeElement; lbShow(); lb.classList.add("is-open"); window.__lenis?.stop(); document.body.style.overflow = "hidden"; $('[data-lb="close"]').focus(); }
  const closeLB = () => { lb.classList.remove("is-open"); window.__lenis?.start(); document.body.style.overflow = ""; go(li); lastFocus?.focus(); };
  $('[data-g="full"]').addEventListener("click", () => openLB(cur));
  $('[data-lb="close"]').addEventListener("click", closeLB);
  $('[data-lb="prev"]').addEventListener("click", () => { li = (li - 1 + p.images.length) % p.images.length; lbShow(); });
  $('[data-lb="next"]').addEventListener("click", () => { li = (li + 1) % p.images.length; lbShow(); });
  addEventListener("keydown", (e) => { if (!lb.classList.contains("is-open")) return; if (e.key === "Escape") closeLB(); if (e.key === "ArrowRight") $('[data-lb="next"]').click(); if (e.key === "ArrowLeft") $('[data-lb="prev"]').click(); if (e.key === "Tab") { const f = $$("button", lb); if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); } else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); } } });

  A.observe(); A.initMagnetic();
  document.querySelector("[data-property]").dispatchEvent(new Event("albor:rendered"));
})();
