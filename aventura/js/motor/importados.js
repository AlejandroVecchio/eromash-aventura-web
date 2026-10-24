// ---------- la gente propia del editor (sistema IMPORTADOS) ----------
// Pedido de Alejandro (24/10/2026): poder sumar un NPC específico desde el editor con un dibujo propio. Cada uno vive
// en AGREGADOS.npcs: { id, nombre: { es, en }, dialogo: { es: [...], en: [...] }, x, y, s, anda, img: { S, N, E } }.
// Las imágenes (achicadas por el editor) son su frente (S), su espalda (N) y su costado (E; el oeste es el mismo
// espejado); si falta una vista se usa el frente. Se paran con los pies en (x, y), con la sombra elíptica del juego,
// miran a Eromash cuando se acerca, pasean dentro de `anda` y con E dicen su diálogo (una línea que empieza con
// «Eromash:» la dice él). El nombre y las líneas entran a I18N en los dos idiomas, como todo texto del juego.
window.IMPORTADOS = (function () {
  "use strict";
  let A, J, jug, W;
  const ALTO = 84; // lo que mide la gente del juego con s = 1
  const gente = [];
  function cargar(n) {
    const img = {};
    ["S", "N", "E"].forEach((v) => {
      const src = n.img && n.img[v];
      if (!src) return;
      const im = new Image();
      im.src = src;
      img[v] = im;
    });
    const es = (n.dialogo && n.dialogo.es) || [],
      en = (n.dialogo && n.dialogo.en) || [];
    const lineas = [],
      tabla = { ["av.nombre_" + n.id]: { es: (n.nombre && (n.nombre.es || n.nombre.en)) || n.id, en: (n.nombre && (n.nombre.en || n.nombre.es)) || n.id } };
    for (let i = 0; i < Math.max(es.length, en.length); i++) {
      const le = es[i] || en[i] || "",
        li = en[i] || es[i] || "";
      const dice = /^\s*eromash\s*:/i.test(le) ? "eromash" : n.id;
      const k = "np." + n.id + "_" + i;
      tabla[k] = { es: le.replace(/^\s*eromash\s*:\s*/i, ""), en: li.replace(/^\s*eromash\s*:\s*/i, "") };
      if (tabla[k].es || tabla[k].en) lineas.push([dice, k]);
    }
    I18N.textos(tabla);
    return { d: n, id: n.id, img, lineas, x: n.x, y: n.y, casa: [n.x, n.y], meta: null, espera: 1 + Math.random() * 3, mira: { vista: "S", espejo: false }, camina: 0 };
  }
  function imagenDe(p) {
    const v = p.mira.vista;
    const im = p.img[v] && p.img[v].complete && p.img[v].naturalWidth ? p.img[v] : p.img.S;
    return im && im.complete && im.naturalWidth ? im : null;
  }
  function dibujar(c, p) {
    const im = imagenDe(p),
      s = p.d.s || 1,
      h = ALTO * s;
    const w = im ? (h * im.naturalWidth) / im.naturalHeight : h * 0.5;
    DIB.sombra(c, p.x, p.y, Math.max(16, w * 0.38), 6 * s, 0.4);
    if (!im) return;
    const salto = p.camina ? Math.abs(Math.sin(J.t * 9)) * 3 * s : 0,
      respira = 1 + Math.sin(J.t * 1.8 + p.x) * 0.012;
    c.save();
    c.translate(p.x, p.y - salto);
    // el costado mira al este; al oeste se espeja (y el frente o la espalda solos también, si no hay costado)
    if (p.mira.espejo) c.scale(-1, 1);
    c.drawImage(im, -w / 2, -h * respira, w, h * respira);
    c.restore();
  }
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      ((window.AGREGADOS && AGREGADOS.npcs) || []).forEach((n) => n && n.id && n.x != null && gente.push(cargar(n)));
    },
    actualizar(dt) {
      dt = Math.min(0.05, dt || 0.016);
      for (const p of gente) {
        const dj = Math.hypot(jug.x - p.x, jug.y - p.y);
        p.camina = 0;
        // de cerca mira a Eromash y se queda quieto
        if (dj < 260) {
          const dx = jug.x - p.x,
            dy = jug.y - p.y;
          p.mira = Math.abs(dx) > Math.abs(dy) * 1.2 ? { vista: "E", espejo: dx < 0 } : { vista: dy < 0 ? "N" : "S", espejo: false };
          continue;
        }
        const anda = p.d.anda || 0;
        if (!anda) {
          p.mira = { vista: "S", espejo: false };
          continue;
        }
        if (!p.meta) {
          p.espera -= dt;
          if (p.espera > 0) continue;
          const a = Math.random() * Math.PI * 2,
            r = Math.random() * anda;
          p.meta = [p.casa[0] + Math.cos(a) * r, p.casa[1] + Math.sin(a) * r * 0.7];
        }
        const dx = p.meta[0] - p.x,
          dy = p.meta[1] - p.y,
          d = Math.hypot(dx, dy);
        if (d < 8) {
          p.meta = null;
          p.espera = 2 + Math.random() * 4;
          continue;
        }
        const v = 55 * dt,
          nx = p.x + (dx / d) * v,
          ny = p.y + (dy / d) * v;
        if (W.libre && !W.libre(nx, ny, 14)) {
          p.meta = null;
          p.espera = 1;
          continue;
        }
        p.x = nx;
        p.y = ny;
        p.camina = 1;
        p.mira = Math.abs(dx) > Math.abs(dy) * 1.2 ? { vista: "E", espejo: dx < 0 } : { vista: dy < 0 ? "N" : "S", espejo: false };
      }
    },
    cercanos(dar) {
      for (const p of gente) {
        if (!p.lineas.length) continue;
        const d = Math.hypot(jug.x - p.x, jug.y - p.y);
        if (d < 170) dar(d, I18N.t("np.hablar", [I18N.t("av.nombre_" + p.id)]), () => A.dialogoLibre(p.lineas), p.x, p.y - ALTO * (p.d.s || 1) - 30);
      }
    },
    objetos(lista, visible, c) {
      for (const p of gente) if (visible(p.x, p.y)) lista.push({ y: p.y, f: () => dibujar(c, p) });
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { gente: () => gente, ALTO };
})();
