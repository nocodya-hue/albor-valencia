/* ALBOR · Contacto: el motivo adapta el formulario; ?motivo=vender preselecciona */
(async () => {
  await window.Albor.ready;
  const A = window.Albor, { $, $$ } = A;
  const pre = new URLSearchParams(location.search).get("motivo");
  if (pre) { const r = $(`input[name="motivo"][value="${pre}"]`); if (r) r.checked = true; }
  const apply = () => { const v = $('input[name="motivo"]:checked').value; $$("[data-show]").forEach((el) => (el.hidden = !el.dataset.show.split(" ").includes(v))); };
  $("[data-intents]").addEventListener("change", apply); apply();
  const c = A.data.config.contact;
  const m = A.map.create($("[data-office-map]"), { center: [c.lat, c.lng], zoom: 16 });
  if (m) L.marker([c.lat, c.lng], { icon: L.divIcon({ className: "pin", html: '<span class="pin__inner">Albor · Calle Colón 3</span>', iconSize: null }) }).addTo(m);
})();
