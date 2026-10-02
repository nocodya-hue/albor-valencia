/* ALBOR · Home */
(async () => {
  await window.Albor.ready;
  const A = window.Albor, { $, $$, esc, nf, fmtPrice, ARROW, data } = A;
  const [all, Z] = await Promise.all([data.all(), data.zones()]);
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  const desktop = matchMedia("(min-width: 901px)").matches;

  /* ---------- 00 · Hero ---------- */
  const hero = $("[data-hero]");
  requestAnimationFrame(() => $$(".hero__title .line-mask", hero).forEach((m) => m.classList.add("is-in")));
  // Vídeo del hero: siempre en reproducción (algunos navegadores bloquean autoplay hasta llamar a play()).
  const vid = $(".hero__video");
  const play = () => vid && vid.paused && vid.play().catch(() => {});
  play(); document.addEventListener("visibilitychange", () => !document.hidden && play());
  addEventListener("pointerdown", play, { once: true }); addEventListener("touchstart", play, { once: true, passive: true });
  const clock = $("[data-clock]");
  const tick = () => clock && (clock.textContent = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" }).format(new Date()));
  tick(); setInterval(tick, 30000);

  // Buscador rápido: opciones y contador reales del inventario.
  const form = $(".hero__search"), selT = $("#hs-type"), selZ = $("#hs-zone"), count = $("[data-hero-count]");
  const fill = () => {
    const op = form.op.value;
    const base = all.filter((p) => p.operation === op);
    const keepT = selT.value, keepZ = selZ.value;
    selT.innerHTML = '<option value="">Cualquier tipo</option>' + Z.types.map((t) => { const n = base.filter((p) => p.type === t.slug).length; return n ? `<option value="${t.slug}">${t.plural} (${n})</option>` : ""; }).join("");
    selZ.innerHTML = '<option value="">Toda Valencia y entorno</option>' + Z.groups.map((g) => {
      const opts = Z.zones.filter((z) => z.group === g.id).map((z) => { const n = base.filter((p) => p.zone === z.slug).length; return n ? `<option value="${z.slug}">${z.name} (${n})</option>` : ""; }).join("");
      return opts ? `<optgroup label="${g.name}">${opts}</optgroup>` : "";
    }).join("");
    selT.value = [...selT.options].some((o) => o.value === keepT) ? keepT : "";
    selZ.value = [...selZ.options].some((o) => o.value === keepZ) ? keepZ : "";
    const n = data.filter(all, { op, type: selT.value ? [selT.value] : [], zone: selZ.value ? [selZ.value] : [] }).length;
    count.textContent = n;
  };
  form.addEventListener("change", fill); fill();
  form.addEventListener("submit", () => { [selT, selZ].forEach((s) => { if (!s.value) s.disabled = true; }); setTimeout(() => [selT, selZ].forEach((s) => (s.disabled = false)), 50); });

  // Transición de escala: el plano se recoge en un marco y el texto sube al hacer scroll.
  if (hasGsap && desktop && !A.reduced) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom bottom", scrub: .6 } });
    tl.fromTo(".hero__stage", { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(7% 5% 12% 5%)", ease: "none" }, 0)
      .to(".hero__content", { yPercent: -18, opacity: 0, ease: "none" }, 0)
      .to(".hero__meta", { opacity: 0, ease: "none" }, 0)
      .fromTo(".hero__video", { scale: 1 }, { scale: 1.08, ease: "none" }, 0);
  }

  /* ---------- 02 · Inventario ---------- */
  const s = await data.stats();
  const cityValencia = (s.properties_by_city || {})["Valencia"] || 0;
  const map = { ...s, city_valencia: cityValencia };
  $$("[data-stat]").forEach((el) => { const v = map[el.dataset.stat] ?? 0; el.dataset.count = v; if (A.reduced) el.textContent = v; });
  $("[data-types]").innerHTML = Z.types.filter((t) => s.properties_by_type[t.slug]).map((t) => `<a href="${A.url.listing({ type: t.slug })}">${t.plural} <b>${s.properties_by_type[t.slug]}</b></a>`).join("");
  A.observe($(".stats"));

  /* ---------- 03 · Exposición ---------- */
  const featured = all.slice(0, 8);
  const track = $("[data-expo]");
  track.innerHTML = featured.map((p, i) => `
    <article class="expo__slide">
      <a class="expo__media" href="${A.url.property(p)}" data-cursor="Explorar" aria-label="${esc(p.title)}">
        <img src="assets/img/${p.images[0]}.webp" alt="${esc(p.title)}" loading="${i < 2 ? "eager" : "lazy"}" data-expo-img>
      </a>
      <div class="expo__info">
        <span class="expo__idx" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
        <p class="label label--muted">${p.operation === "venta" ? "Venta" : "Alquiler"} · ${esc(A.zoneName(p.zone))}${p.demo ? ' · <span class="ph">Demo</span>' : ""}</p>
        <h3 class="expo__title"><a href="${A.url.property(p)}">${esc(p.title)}</a></h3>
        <p class="body-2" style="font-size:14px">${esc(p.excerpt)}</p>
        <div class="expo__specs"><span>${p.surface} m²</span>${p.rooms ? `<span>${p.rooms} hab.</span>` : ""}${p.baths ? `<span>${p.baths} baños</span>` : ""}${p.terrace ? `<span>Terraza ${p.terrace} m²</span>` : ""}</div>
        <p class="expo__price">${fmtPrice(p)}</p>
      </div>
    </article>`).join("");
  $("[data-expo-n]").textContent = String(featured.length).padStart(2, "0");
  const iEl = $("[data-expo-i]"), prog = $("[data-expo-progress]");
  const setIdx = (k) => { iEl.textContent = String(Math.min(featured.length, k + 1)).padStart(2, "0"); };
  if (hasGsap && desktop && !A.reduced) {
    const dist = () => { const last = track.lastElementChild; return Math.max(0, last.offsetLeft + last.offsetWidth + parseFloat(getComputedStyle(track).paddingRight) - innerWidth); };
    const imgs = $$("[data-expo-img]", track);
    gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: {
        trigger: ".expo", pin: ".expo__pin", start: "top top", end: () => "+=" + dist() * .75, scrub: .8, invalidateOnRefresh: true,
        onUpdate: (st) => { prog.style.transform = `scaleX(${st.progress})`; setIdx(Math.round(st.progress * (featured.length - 1))); imgs.forEach((im) => { const r = im.parentElement.getBoundingClientRect(); im.style.transform = `translateX(${((r.left + r.width / 2 - innerWidth / 2) / innerWidth) * -6}%)`; }); }
      }
    });
  } else {
    track.addEventListener("scroll", () => { const k = track.scrollLeft / (track.scrollWidth - track.clientWidth || 1); prog.style.transform = `scaleX(${k})`; setIdx(Math.round(k * (featured.length - 1))); }, { passive: true });
  }

  /* ---------- 04 · Buscar por tipo y zona ---------- */
  const tCount = (slug) => all.filter((p) => p.type === slug).length;
  const zCount = (slug) => all.filter((p) => p.zone === slug).length;
  $("[data-finder-types]").innerHTML = Z.types.filter((t) => !["garaje", "otros"].includes(t.slug)).map((t) => {
    const n = tCount(t.slug), sample = all.find((p) => p.type === t.slug);
    return `<li><a href="${A.url.listing({ type: t.slug })}" class="${n ? "" : "is-empty"}" data-img="${sample ? sample.images[0] : ""}"><span class="t">${t.plural}</span><span class="c">${n ? String(n).padStart(2, "0") + " disponibles" : "Consultar"}</span></a></li>`;
  }).join("");
  $("[data-finder-zones]").innerHTML = Z.zones.filter((z) => zCount(z.slug) || z.premium).slice(0, 11).map((z) => {
    const n = zCount(z.slug);
    return `<li><a href="${A.url.listing({ zone: z.slug })}" class="${n ? "" : "is-empty"}" data-img="${z.img}"><span class="t">${z.name}</span><span class="c">${n ? String(n).padStart(2, "0") + " disponibles" : "Consultar"}</span></a></li>`;
  }).join("");
  const fl = $(".finder__float"), flImg = fl.querySelector("img");
  if (A.finePointer && !A.reduced) {
    let fx = 0, fy = 0, cx = 0, cy = 0, on = false;
    $$(".finder__list a").forEach((a) => {
      a.addEventListener("mouseenter", () => { if (!a.dataset.img) return; flImg.src = `assets/img/${a.dataset.img}.webp`; fl.classList.add("is-on"); on = true; });
      a.addEventListener("mouseleave", () => { fl.classList.remove("is-on"); on = false; });
    });
    addEventListener("pointermove", (e) => { fx = e.clientX + 170; fy = e.clientY; }, { passive: true });
    const loop = () => { cx += (fx - cx) * .12; cy += (fy - cy) * .12; if (on) fl.style.left = cx + "px", fl.style.top = cy + "px"; requestAnimationFrame(loop); };
    loop();
  }

  /* ---------- 05 · Valencia barrio a barrio ---------- */
  initZoneMap({ all, Z, root: $(".vmap") });
  A.initMagnetic();
})();

