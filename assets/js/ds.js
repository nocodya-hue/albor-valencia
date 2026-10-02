(async () => {
  await window.Albor.ready;
  const A = window.Albor, { $ } = A;
  const sw = [["cal", "#F3EEE5", "Muro encalado · fondo"], ["marfil", "#FAF7F1", "Lino · superficies"], ["travertino", "#E6DCCB", "Bloques"], ["arena", "#D2C4AD", "Bordes"], ["piedra", "#9F9686", "Piedra en sombra"], ["mineral", "#66625B", "Texto secundario"], ["nogal", "#4A3A2C", "Acento oscuro"], ["oliva", "#5F6145", "Acento natural"], ["mar", "#6C8189", "Mapa"], ["tinta", "#1D1A16", "Texto"], ["carbon", "#13110F", "Noche · secciones oscuras"], ["cipres", "#243028", "Noche · magazine"], ["arcilla", "#A3562F", "Acento sobre claro"], ["arcilla-claro", "#D08A62", "Acento sobre oscuro"]];
  $("[data-swatches]").innerHTML = sw.map(([n, h, u]) => `<div class="ds-swatch" style="background:${h};color:${["nogal", "oliva", "mar", "tinta", "mineral", "carbon", "cipres", "arcilla"].includes(n) ? "#F3EEE5" : "#1D1A16"}"><strong>--${n}</strong><span>${h}</span><span style="opacity:.75">${u}</span></div>`).join("");
  const all = await A.data.all();
  $("[data-ds-cards]").innerHTML = all.slice(0, 3).map((p) => A.card(p)).join("");
})();
