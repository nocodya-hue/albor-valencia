/* ALBOR · Valencia */
(async () => {
  await window.Albor.ready;
  const A = window.Albor, { $, esc } = A;
  const [all, Z] = await Promise.all([A.data.all(), A.data.zones()]);
  requestAnimationFrame(() => $(".vlc-hero .line-mask").classList.add("is-in"));
  initZoneMap({ all, Z, root: $(".vmap") });

  const featured = ["pla-del-remei", "gran-via", "ciutat-vella", "ruzafa", "pla-del-real", "cabanyal", "patacona", "godella", "campolivar", "betera", "la-eliana"];
  $("[data-zones-ed]").innerHTML = featured.map((slug, i) => {
    const z = Z.zones.find((x) => x.slug === slug), n = all.filter((p) => p.zone === slug).length;
    return `<article class="zone-ed" id="zona-${slug}">
      <figure class="zone-ed__img media img-reveal"><img src="assets/img/${z.img}.webp" alt="${esc(z.name)}" loading="lazy" data-speed=".05"></figure>
      <div class="zone-ed__txt stack reveal">
        <span class="zone-ed__n num" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
        <p class="label label--muted">${esc(z.city)} · ${esc(Z.groups.find((g) => g.id === z.group).name)}</p>
        <h3 class="h3">${esc(z.name)}</h3>
        <p class="body-2">${esc(z.blurb)}</p>
        <a class="link-u label" href="${A.url.listing({ zone: slug })}">${n ? `${n} ${n === 1 ? "propiedad disponible" : "propiedades disponibles"}` : "Consultar disponibilidad"} ${A.ARROW}</a>
      </div>
    </article>`;
  }).join("");
  A.observe($("[data-zones-ed]"));
  window.Albor.data.refreshParallax?.();
})();
