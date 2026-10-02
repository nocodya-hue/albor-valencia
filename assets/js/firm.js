/* ALBOR · La firma: año gigante, línea temporal horizontal fijada, mapa de la oficina */
(async () => {
  await window.Albor.ready;
  const A = window.Albor, { $, $$ } = A;
  requestAnimationFrame(() => $$(".firm-hero .line-mask, .office__addr .line-mask").forEach((m) => m.classList.add("is-in")));

  // Línea temporal: horizontal y fijada en desktop, vertical en móvil.
  const track = $("[data-tl]"), items = $$(".tl", track), navBtns = $$("[data-tl-go]");
  const setCur = (i) => navBtns.forEach((b, k) => b.setAttribute("aria-current", k === i));
  if (window.gsap && window.ScrollTrigger && matchMedia("(min-width: 901px)").matches && !A.reduced) {
    gsap.registerPlugin(ScrollTrigger);
    const dist = () => { const last = items.at(-1); return Math.max(0, last.offsetLeft + last.offsetWidth - innerWidth + parseFloat(getComputedStyle(track).paddingLeft)); };
    const st = gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: ".timeline", pin: ".timeline__pin", start: "top top", end: () => "+=" + dist(), scrub: .8, invalidateOnRefresh: true, onUpdate: (s) => setCur(Math.round(s.progress * (items.length - 1))) } }).scrollTrigger;
    navBtns.forEach((b, i) => b.addEventListener("click", () => { const y = st.start + (st.end - st.start) * (i / (items.length - 1)); window.__lenis ? window.__lenis.scrollTo(y) : scrollTo({ top: y, behavior: "smooth" }); }));
  } else {
    navBtns.forEach((b, i) => b.addEventListener("click", () => items[i].scrollIntoView({ behavior: A.reduced ? "auto" : "smooth" })));
  }

  const c = A.data.config.contact;
  const m = A.map.create($("[data-office-map]"), { center: [c.lat, c.lng], zoom: 16 });
  if (m) L.marker([c.lat, c.lng], { icon: L.divIcon({ className: "pin", html: '<span class="pin__inner">Albor · Calle Colón 3</span>', iconSize: null }) }).addTo(m);
})();
