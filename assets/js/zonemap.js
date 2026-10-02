/* ALBOR · Mapa "barrio a barrio" (home y valencia.html): al pasar por una zona, el mapa vuela a ella y muestra las propiedades disponibles. */
function initZoneMap({ all, Z, root }) {
  const A = window.Albor, { $, $$, esc } = A;
  const list = $("[data-vmap-zones]", root), el = $("[data-vmap-map]", root);
  const hudZ = $("[data-vmap-zone]", root), hudN = $("[data-vmap-n]", root), hudL = $("[data-vmap-l]", root), hudA = $("[data-vmap-a]", root);
  const count = (slug) => all.filter((p) => p.zone === slug).length;
  list.innerHTML = Z.groups.map((g) => `
    <div class="vmap__group"><p class="label label--muted">${g.name}</p>
      ${Z.zones.filter((z) => z.group === g.id).map((z) => { const n = count(z.slug); return `<button class="vmap__zone ${n ? "" : "is-empty"}" data-zone="${z.slug}" aria-pressed="false"><span class="t">${z.name}</span><span class="c">${n ? n + (n === 1 ? " propiedad" : " propiedades") : "—"}</span></button>`; }).join("")}
    </div>`).join("");
  hudN.textContent = all.length;
  const m = A.map.create(el, { center: [39.505, -0.40], zoom: 11 });
  if (!m) return;
  const dots = {}, pins = L.layerGroup().addTo(m);
  Z.zones.forEach((z) => { const n = count(z.slug); if (!n) return; dots[z.slug] = A.map.zoneDot(z, n).addTo(m).on("click", () => select(z.slug)); });
  const showPins = (props) => { pins.clearLayers(); props.forEach((p) => A.map.pin(p).bindPopup(A.map.popup(p), { closeButton: true, maxWidth: 260, offset: [0, -24] }).addTo(pins)); };
  let current = null;
  function select(slug) {
    current = slug;
    const z = Z.zones.find((x) => x.slug === slug);
    $$(".vmap__zone", list).forEach((b) => b.setAttribute("aria-pressed", b.dataset.zone === slug));
    Object.entries(dots).forEach(([k, mk]) => { mk.getElement()?.classList.toggle("is-active", k === slug); mk.setOpacity(k === slug ? 0 : 1); });
    const props = all.filter((p) => p.zone === slug);
    hudZ.textContent = z.name + (z.city !== "Valencia" && z.city !== z.name ? ` · ${z.city}` : "");
    hudN.textContent = props.length; if (hudL) hudL.textContent = props.length === 1 ? "propiedad disponible" : "propiedades disponibles"; if (hudA) { hudA.href = A.url.listing({ zone: slug }); hudA.hidden = !props.length; }
    showPins(props);
    m.flyTo([z.lat, z.lng], props.length ? 15 : 14, { duration: A.reduced ? 0 : 1.2 });
  }
  $$(".vmap__zone", list).forEach((b) => {
    b.addEventListener("click", () => select(b.dataset.zone));
    if (A.finePointer) b.addEventListener("mouseenter", () => { if (current !== b.dataset.zone) { clearTimeout(b._t); b._t = setTimeout(() => select(b.dataset.zone), 180); } });
    b.addEventListener("mouseleave", () => clearTimeout(b._t));
  });
  // Al entrar en la sección, mostrar todo el inventario
  showPins([]);
  return m;
}
window.initZoneMap = initZoneMap;
