/* ALBOR · Valoración en 5 pasos */
(async () => {
  await window.Albor.ready;
  const A = window.Albor, { $, $$, esc } = A;
  const Z = await A.data.zones();
  const form = $("[data-wform]"), panels = $$(".wizard__panel", form), steps = $$(".wizard__step");
  const prev = $("[data-prev]"), next = $("[data-next]"), prog = $("[data-wprog]");

  // Opciones desde la misma taxonomía que usa el inventario
  $("[data-tiles-type]").innerHTML = Z.types.map((t, i) => `<label class="tile"><input type="radio" name="tipo" value="${t.slug}" ${i === 0 ? "required" : ""}><span>${t.name}</span></label>`).join("") + '<div class="field__error" data-err-tipo aria-live="polite" style="grid-column:1/-1"></div>';
  $("[data-zone-select]").innerHTML = '<option value="">Seleccione</option>' + Z.groups.map((g) => `<optgroup label="${g.name}">${Z.zones.filter((z) => z.group === g.id).map((z) => `<option value="${z.slug}">${z.name}</option>`).join("")}</optgroup>`).join("") + '<option value="otra">Otra zona</option>';
  // Características de la valoración: las del inventario + las que pesan en el precio de un piso de ciudad.
  const EXTRAS = [...Z.features.filter((x) => !["obra-nueva", "reformado", "piscina"].includes(x.slug)), { slug: "piscina-privada", name: "Piscina privada" }, { slug: "piscina-comunitaria", name: "Piscina comunitaria" }, { slug: "balcon", name: "Balcón" }, { slug: "conserje", name: "Conserje" }, { slug: "amueblado", name: "Amueblado" }, { slug: "trastero", name: "Trastero" }];
  $("[data-extras]").innerHTML = EXTRAS.map((x) => `<label class="chip"><input type="checkbox" name="extras" value="${x.slug}"><span>${x.name}</span></label>`).join("");

  const counters = { rooms: 3, baths: 2 };
  $$("[data-step-btn]").forEach((b) => b.addEventListener("click", () => { const k = b.dataset.stepBtn; counters[k] = Math.max(0, Math.min(20, counters[k] + +b.dataset.d)); $(`[data-out="${k}"]`).textContent = counters[k]; }));

  let cur = 0;
  const show = (i) => {
    cur = i;
    panels.forEach((p, k) => p.classList.toggle("is-current", k === i));
    steps.forEach((s, k) => { s.toggleAttribute("aria-current", k === i); if (k === i) s.setAttribute("aria-current", "step"); s.classList.toggle("is-done", k < i); s.disabled = i === 5; });
    prog.style.width = `${Math.min(100, (i + 1) * 20)}%`;
    prev.hidden = i === 0 || i === 5;
    next.hidden = i === 5;
    next.innerHTML = i === 4 ? `Solicitar valoración ${A.ARROW}` : `Siguiente ${A.ARROW}`;
    const focusEl = i === 5 ? panels[5] : panels[i].querySelector("input, select");
    focusEl?.focus({ preventScroll: true });
    const top = $("#valoracion").getBoundingClientRect().top + scrollY - 40;
    if (scrollY > top + 200) (window.__lenis ? window.__lenis.scrollTo(top) : scrollTo({ top, behavior: A.reduced ? "auto" : "smooth" }));
  };

  function valid(i) {
    let ok = true;
    const p = panels[i];
    // Radios obligatorios
    for (const name of ["tipo", "objetivo"]) {
      const group = $$(`input[name="${name}"]`, p); if (!group.length) continue;
      const err = $(`[data-err-${name}]`, p), chosen = group.some((r) => r.checked);
      if (err) err.textContent = chosen ? "" : "Elija una opción.";
      if (!chosen) { ok = false; group[0].focus(); }
    }
    $$("[required]:not([type=radio])", p).forEach((inp) => {
      const f = inp.closest(".field") || inp.closest(".check"), err = f?.querySelector(".field__error");
      let msg = "";
      if (inp.type === "checkbox" && !inp.checked) msg = "Necesitamos su consentimiento.";
      else if (inp.type !== "checkbox" && !inp.value.trim()) msg = "Este campo es obligatorio.";
      else if (inp.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inp.value)) msg = "Revise el email.";
      else if (inp.type === "tel" && inp.value.replace(/\D/g, "").length < 9) msg = "Revise el teléfono.";
      else if (inp.type === "number" && +inp.value < +(inp.min || 0)) msg = "Revise la superficie.";
      f?.classList.toggle("is-invalid", !!msg); inp.setAttribute("aria-invalid", !!msg);
      if (err) err.textContent = msg;
      if (msg && ok) { ok = false; inp.focus(); }
    });
    return ok;
  }

  next.addEventListener("click", () => { if (!valid(cur)) return; if (cur === 4) return finish(); show(cur + 1); });
  prev.addEventListener("click", () => show(cur - 1));
  steps.forEach((s, k) => s.addEventListener("click", () => { if (k < cur) return show(k); for (let i = cur; i < k; i++) if (!valid(i)) return show(i); show(k); }));
  form.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.tagName === "INPUT" && e.target.type !== "checkbox") { e.preventDefault(); next.click(); } });

  function finish() {
    const fd = new FormData(form);
    if (fd.get("website")) return show(5); // bot: se descarta en silencio
    const type = Z.types.find((t) => t.slug === fd.get("tipo"))?.name;
    const zone = Z.zones.find((z) => z.slug === fd.get("zona"))?.name || "Otra zona";
    const obj = { vender: "Vender", alquilar: "Alquilar", "vender-alquilar": "Vender + alquilar" }[fd.get("objetivo")];
    const extras = fd.getAll("extras").map((s) => EXTRAS.find((x) => x.slug === s)?.name).join(", ") || "—";
    const rows = [["Propiedad", `${type} · ${fd.get("estado")}`], ["Ubicación", zone + (fd.get("cp") ? ` · ${fd.get("cp")}` : "") + (fd.get("lat") ? " · marcada en el mapa" : "")], ["Superficie", `${fd.get("superficie")} m²`], ["Distribución", `${counters.rooms} hab. · ${counters.baths} baños`], ["Extras", extras], ["Objetivo", `${obj} · ${fd.get("plazo")}`], ["Contacto", `${fd.get("nombre")} · ${fd.get("telefono")}`]];
    $("[data-summary]").innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("");
    // Producción: fetch("/wp-json/albor/v1/lead", { method: "POST", body: fd })
    show(5);
  }
  /* Mapa del paso 2: el pin salta al centro de la zona elegida y el propietario lo arrastra hasta su edificio. */
  let pinMap, pin;
  const pinEl = $("[data-pin-map]");
  const setLL = (ll) => { $("[data-pin-lat]").value = ll.lat.toFixed(5); $("[data-pin-lng]").value = ll.lng.toFixed(5); $("[data-pin-txt]").textContent = "Ubicación marcada. Puede seguir ajustándola."; };
  function ensurePinMap() {
    if (pinMap || !window.L) return;
    pinMap = A.map.create(pinEl, { center: [39.4699, -0.3763], zoom: 13 });
    if (!pinMap) return;
    pin = L.marker([39.4699, -0.3763], { draggable: true, keyboard: true, title: "Su casa", icon: L.divIcon({ className: "pin", html: '<span class="pin__inner">Su casa</span>', iconSize: null }) }).addTo(pinMap);
    pin.on("dragend", () => setLL(pin.getLatLng()));
    pinMap.on("click", (e) => { pin.setLatLng(e.latlng); setLL(e.latlng); });
  }
  $("[data-zone-select]").addEventListener("change", (e) => {
    const z = Z.zones.find((x) => x.slug === e.target.value); ensurePinMap();
    if (z && pinMap) { pinMap.setView([z.lat, z.lng], 16); pin.setLatLng([z.lat, z.lng]); }
  });
  steps[1].addEventListener("click", () => setTimeout(() => { ensurePinMap(); pinMap?.invalidateSize(); }, 60));
  new MutationObserver(() => { if (panels[1].classList.contains("is-current")) setTimeout(() => { ensurePinMap(); pinMap?.invalidateSize(); }, 60); }).observe(panels[1], { attributes: true, attributeFilter: ["class"] });

  // FAQ como datos estructurados (FAQPage) para buscadores
  const faq = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: $$("[data-faq] details").map((d) => ({ "@type": "Question", name: d.querySelector("summary").textContent, acceptedAnswer: { "@type": "Answer", text: d.querySelector("p").textContent } })) };
  const sc = document.createElement("script"); sc.type = "application/ld+json"; sc.textContent = JSON.stringify(faq); document.head.appendChild(sc);

  if (location.hash === "#valoracion") setTimeout(() => $("#valoracion").scrollIntoView(), 300);
})();
