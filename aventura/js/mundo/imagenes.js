// ---------- las imágenes propias del editor (módulo IMAGENES) ----------
// Pedido de Alejandro (24/10/2026): además de gente, importar estructuras, pinturas y calcos con un dibujo propio.
// Cada una vive en AGREGADOS.imagenes[id] = { nombre: { es, en }, clase, src, alto, choque } y se vuelve un asset
// más (im_<id>) que se pone, se mueve, se agranda y se gira como cualquier otro:
//   · estructura: parada con los pies en (x, y) y su sombra elíptica; `choque` la vuelve sólida. Es un dibujo plano:
//     con la cámara girada se sigue viendo de frente (figura).
//   · pintura: colgada en la pared con un marco de tablas (grupo interiores: se pone también adentro de las casas);
//     girada es un cuadro de dos caras (atrás, las tablas del marco).
//   · suelo: pintada en el piso, aplanada como se ve el piso desde la cámara (no choca, se dibuja primero).
// src es una imagen achicada por el editor (data URL); va adentro de agregados.js, que es público.
window.IMAGENES = (function () {
  "use strict";
  const tabla = {},
    cache = {};
  function imagen(src) {
    if (!src) return null;
    if (!cache[src]) {
      const im = new Image();
      im.src = src;
      cache[src] = im;
    }
    const im = cache[src];
    return im.complete && im.naturalWidth ? im : null;
  }
  const medidas = (d, im) => {
    const h = d.alto || 160;
    return [im ? (h * im.naturalWidth) / im.naturalHeight : h, h];
  };
  function estructura(id) {
    return (c, x, y, t, o) => {
      const d = tabla[id],
        im = d && imagen(d.src),
        s = o.s || 1;
      if (!im) return;
      const [w, h] = medidas(d, im);
      DIB.sombra(c, x, y, w * 0.45 * s, Math.max(6, w * 0.1) * s, 0.4);
      c.drawImage(im, x - (w * s) / 2, y - h * s, w * s, h * s);
    };
  }
  function pintura(id) {
    return (c, x, y, t, o) => {
      const d = tabla[id],
        im = d && imagen(d.src),
        s = o.s || 1;
      if (!im) return;
      const [w0, h0] = medidas(d, im),
        w = w0 * s,
        h = h0 * s,
        b = Math.max(8, Math.min(w, h) * 0.07),
        y1 = y - 90 * s,
        y0 = y1 - h;
      // el marco de tablas: la cara de la izquierda en sombra, la de arriba con luz
      DIB.R(c, x - w / 2 - b, y0 - b, w + b * 2, h + b * 2, "#5E130D");
      DIB.R(c, x - w / 2 - b, y0 - b, b, h + b * 2, "#3A0A06");
      DIB.R(c, x - w / 2 - b, y0 - b, w + b * 2, b * 0.6, "#7A2A1A");
      c.drawImage(im, x - w / 2, y0, w, h);
      // el clavo del que cuelga
      DIB.E(c, x, y0 - b - 6 * s, 4 * s, 4 * s, "#3A3438");
    };
  }
  // la pintura armada con caras: el cuadro en un plano colgado de la pared; de atrás se ven las tablas del marco
  function pinturaV(id) {
    return (c, x, y, t, o) => {
      const d = tabla[id],
        im = d && imagen(d.src);
      if (!im) return;
      const pr = VOL.pr(x, y, o),
        [w, h] = medidas(d, im),
        b = Math.max(8, Math.min(w, h) * 0.07);
      VOL.plano(c, pr, -w / 2 - b, w / 2 + b, 0, 90 - b, 90 + h + b, ["#3A0A06", "#5E130D", "#7A2A1A"], (cc, l, hh) => {
        DIB.R(cc, 0, -hh, b, hh, "#3A0A06");
        DIB.R(cc, 0, -hh, l, b * 0.6, "#7A2A1A");
        cc.drawImage(im, b, -hh + b, w, h);
        DIB.E(cc, l / 2, -hh - 6, 4, 4, "#3A3438");
      }, (cc, l, hh) => {
        for (let k = 1; k < 4; k++) DIB.R(cc, 0, -(k * hh) / 4, l, 2, "#2A0806");
      }, ["#2A0806", "#3A0A06", "#4A1008"]);
    };
  }
  function suelo(id) {
    return (c, x, y, t, o) => {
      const d = tabla[id],
        im = d && imagen(d.src),
        s = o.s || 1;
      if (!im) return;
      const [w, h] = medidas(d, im);
      c.save();
      c.translate(x, y);
      c.scale(1, 0.55);
      c.globalAlpha *= d.alfa != null ? d.alfa : 0.92;
      c.drawImage(im, (-w * s) / 2, (-h * s) / 2, w * s, h * s);
      c.restore();
    };
  }
  function registrar(id, d) {
    if (!window.ASSETS || !d || !d.src) return;
    tabla[id] = d;
    const k = "im_" + id,
      nom = d.nombre || {},
      clase = d.clase || "estructura";
    imagen(d.src);
    const alto = d.alto || 160;
    if (clase === "pintura") ASSETS.LISTA[k] = { f: pintura(id), fv: pinturaV(id), vol: true, alto: alto + 110, choque: null, grupo: "interiores", importada: id };
    else if (clase === "suelo") ASSETS.LISTA[k] = { f: suelo(id), alto: 20, choque: null, grupo: "importados", piso: true, importada: id };
    else ASSETS.LISTA[k] = { f: estructura(id), figura: true, alto, choque: d.choque ? { w: Math.round(alto * 0.5), h: Math.round(alto * 0.18) } : null, grupo: "importados", importada: id };
    I18N.textos({ ["as." + k]: { es: nom.es || nom.en || id, en: nom.en || nom.es || id } });
  }
  function quitar(id) {
    delete ASSETS.LISTA["im_" + id];
    delete tabla[id];
  }
  // todas las de una tabla (las del archivo o las del editor); las que ya no están se sacan
  function cargar(t) {
    t = t || {};
    Object.keys(tabla).forEach((id) => !t[id] && quitar(id));
    Object.keys(t).forEach((id) => registrar(id, t[id]));
  }
  cargar(window.AGREGADOS && window.AGREGADOS.imagenes);
  return { cargar, registrar, quitar, imagen, lista: () => Object.assign({}, tabla) };
})();
