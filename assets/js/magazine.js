/* ALBOR · Magazine (en WordPress: entradas normales con categorías; aquí, índice editorial propuesto) */
(async () => {
  await window.Albor.ready;
  const { $, $$, esc } = window.Albor;
  const POSTS = [
    { id: "cuanto-vale-mi-casa", cat: "Guías", img: "urb-1", t: "¿Cuánto vale mi casa en Valencia? Cómo se calcula de verdad", x: "Comparables, estado, planta, orientación y la diferencia entre precio de salida y precio de cierre." },
    { id: "cuanto-se-tarda", cat: "Guías", img: "urb-5", t: "¿Cuánto se tarda en vender un piso en Valencia?", x: "Qué alarga una venta, qué la acorta y por qué el precio de salida lo decide casi todo." },
    { id: "documentos-vender", cat: "Guías", img: "tex-3", t: "Documentos para vender una vivienda en 2026", x: "Escritura, nota simple, IBI, certificado energético y comunidad: la lista completa." },
    { id: "piso-heredado", cat: "Guías", img: "stair-2", t: "Vender un piso heredado en Valencia: trámites e impuestos", x: "Aceptación de herencia, plusvalía municipal e IRPF, paso a paso." },
    { id: "tasacion-valoracion", cat: "Guías", img: "urb-3", t: "Valoración o tasación: qué necesita y cuándo", x: "Quién la hace, para qué sirve cada una y cuánto cuesta." },
    { id: "pla-del-remei", cat: "Barrios", img: "ext-8", t: "El Pla del Remei, la calle Colón y la arquitectura del Ensanche", x: "Por qué el Ensanche sigue siendo el barrio residencial más buscado de Valencia, edificio a edificio." },
    { id: "techos-altos", cat: "Arquitectura", img: "int-5", t: "Techos de cuatro metros: cómo reformar una finca de 1930 sin perder su alma", x: "Molduras, suelos hidráulicos y carpinterías: qué conservar, qué cambiar y qué permite la normativa." },
    { id: "mercado", cat: "Mercado", img: "vlc-market", t: "Comprar en Valencia: lo que conviene saber antes de la primera visita", x: "Impuestos, plazos, arras y notaría, explicados sin letra pequeña." },
    { id: "campolivar", cat: "Barrios", img: "ext-1", t: "Godella y Campolivar: vivir entre pinos a diez minutos del centro", x: "Colegios, metro, parcelas y la vida de pueblo que todavía se mantiene." },
    { id: "inversion", cat: "Inversión", img: "terr-4", t: "Alquiler de larga duración en el centro: rentabilidad y tranquilidad", x: "Qué tipo de vivienda funciona mejor y cómo se protege al propietario. [Datos de mercado reales pendientes]" },
    { id: "cabanyal", cat: "Patrimonio", img: "zone-cabanyal", t: "El Cabanyal: fachadas de azulejo y una nueva vida junto al mar", x: "Un conjunto histórico protegido que ha vuelto a ser deseado." },
    { id: "huerta", cat: "Lifestyle", img: "vlc-orange", t: "La huerta a la puerta de casa", x: "Alboraya, la horchata y los caminos entre acequias que rodean la ciudad." },
    { id: "mesa", cat: "Gastronomía", img: "kit-3", t: "Cocinas abiertas, mesas largas: cómo se vive hoy una casa valenciana", x: "El salón ya no es el centro: lo es la cocina." },
    { id: "diseno", cat: "Diseño", img: "tex-2", t: "Travertino, lino y cal: los materiales de la casa mediterránea contemporánea", x: "Una guía material para reformar con luz y sin ostentación." },
    { id: "tendencias", cat: "Tendencias", img: "sea-1", t: "Del centro al mar: cómo está cambiando lo que se busca en Valencia", x: "[Pieza basada en datos reales de la firma · pendiente]" }
  ];
  const cats = ["Todas", ...new Set(POSTS.map((p) => p.cat))];
  $("[data-mag-filter]").innerHTML = cats.map((c, i) => `<label class="chip"><input type="radio" name="cat" value="${c}" ${i ? "" : "checked"}><span>${c}</span></label>`).join("");
  $("[data-mag-list]").innerHTML = POSTS.map((p) => `
    <article id="${p.id}" data-cat="${p.cat}" class="reveal">
      <a href="#${p.id}" data-cursor="Leer">
        <figure class="media"><img src="assets/img/${p.img}.webp" alt="" loading="lazy"></figure>
        <p class="label label--muted mt-2">${esc(p.cat)} · En preparación</p>
        <h2 class="h4 mt-1">${esc(p.t)}</h2>
        <p class="body-2 mt-2" style="font-size:15px">${esc(p.x)}</p>
      </a>
    </article>`).join("");
  $("[data-mag-filter]").addEventListener("change", (e) => { $$("[data-mag-list] article").forEach((a) => (a.hidden = e.target.value !== "Todas" && a.dataset.cat !== e.target.value)); });
  window.Albor.observe($("[data-mag-list]"));
})();
