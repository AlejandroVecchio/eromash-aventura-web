// ---------- la huerta de hierbas de la Casa de Sanación (módulo HUERTA25) ----------
// Los seis canteros cercados junto a la Casa de Sanación crían cada uno una hierba del matraz (musgo, serbal, abedul,
// escarcha, luna y cardo). Cada día, de 7 a 19, dos de ellos (salen de la semilla del día) están a punto: se ven con
// brotes que laten sobre el cantero (`brillo`, en pantalla después del mundo) y con E se cosechan dos de esa hierba para
// ALQUIMIA; Thora deja que el forastero se lleve lo que corta. Estado en E.extra.eikholt.huerta = { dia, hechos: [i] };
// textos ek.hu_.
//   HUERTA25.cercano(plano, e, st, A) → { texto, fn, d, x, y } o null · brillo(c, cam, cw, ch, t, plano, st, A) · listos(plano, st, A)
window.HUERTA25 = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const CRIA = ["musgo", "serbal", "abedul", "escarcha", "luna", "cardo"];
  const POR_DIA = 2,
    DA = 2;
  const dia = (A) => Math.floor(((A.H.E.tiempo / LUZ.DIA) * 24 + 9 - 6) / 24);
  let canteros = null;
  // los canteros de la huerta de hierbas, de oeste a este y de norte a sur
  function lista(plano) {
    if (canteros) return canteros;
    const [hx, hy] = plano.lugares.hierbas || [0, 0];
    canteros = plano.cosas.filter((o) => o.id === "huerta" && Math.hypot(o.x - hx, o.y - hy) < 16 * plano.M).sort((a, b) => a.y - b.y || a.x - b.x);
    return canteros;
  }
  function estado(st, A) {
    if (!st.huerta || st.huerta.dia !== dia(A)) st.huerta = { dia: dia(A), hechos: [] };
    return st.huerta;
  }
  // los índices de los dos canteros a punto hoy
  function deHoy(plano, A) {
    const n = lista(plano).length;
    if (!n) return [];
    const r = DIB.azar(5300 + dia(A) * 13),
      a = Math.floor(r() * n);
    let b = Math.floor(r() * (n - 1));
    if (b >= a) b++;
    return POR_DIA > 1 && n > 1 ? [a, b] : [a];
  }
  const horario = (A) => {
    const h = LUZ.hora(A.H.E.tiempo);
    return h >= 7 && h < 19;
  };
  function listos(plano, st, A) {
    if (!horario(A)) return [];
    const s = estado(st, A);
    return deHoy(plano, A).filter((i) => !s.hechos.includes(i));
  }
  function cosechar(i, st, A) {
    const s = estado(st, A),
      h = CRIA[i % CRIA.length];
    s.hechos.push(i);
    const a = window.ALQUIMIA && ALQUIMIA.estado();
    if (a) a.hierbas[h] = (a.hierbas[h] || 0) + DA;
    if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.3, tono: 1.3 });
    if (window.ANIMA) ANIMA.gesto("asiente");
    HUD.aviso(t("ek.hu_cosecha", [DA, t("aq.h_" + h)]), "#7BC86C");
  }
  function cercano(plano, e, st, A) {
    const cs = lista(plano);
    let mejor = null;
    for (const i of listos(plano, st, A)) {
      const o = cs[i],
        d = Math.hypot(o.x - e.x, o.y - e.y);
      if (d < 3.4 * plano.M && (!mejor || d < mejor.d)) mejor = { texto: t("ek.hu_accion", [t("aq.h_" + CRIA[i % CRIA.length])]), fn: () => cosechar(i, st, A), d, x: o.x, y: o.y };
    }
    return mejor;
  }
  // brotes verdes que suben y laten sobre los canteros a punto
  function brillo(c, cam, cw, ch, tt, plano, st, A) {
    const cs = lista(plano),
      ids = listos(plano, st, A);
    if (!ids.length) return;
    const V = VISTA25.proyector(cam);
    for (const i of ids) {
      const o = cs[i],
        [vx, vy] = V(o.x, o.y),
        sx = (vx - cam.x) * cam.esc + cw / 2,
        sy = (vy - cam.y) * cam.esc + ch / 2;
      if (sx < -60 || sy < -60 || sx > cw + 60 || sy > ch + 60) continue;
      const col = window.ALQUIMIA ? ALQUIMIA.HIERBAS[CRIA[i % CRIA.length]].col : "#7BC86C";
      const z = Math.max(0.8, Math.min(1.6, cam.esc * 2.5));
      for (let k = 0; k < 7; k++) {
        const f = (tt * 0.45 + k / 7) % 1,
          x = sx + Math.sin(k * 2.4 + tt * 0.7) * 34 * z,
          y = sy - f * 46 * z,
          s = (6 + 2 * Math.sin(tt * 4 + k)) * z * (1 - f * 0.5);
        c.globalAlpha = 0.85 * (1 - f);
        c.fillStyle = col;
        c.beginPath();
        c.moveTo(x, y - s);
        c.lineTo(x + s * 0.6, y);
        c.lineTo(x, y + s);
        c.lineTo(x - s * 0.6, y);
        c.fill();
      }
      c.globalAlpha = 1;
    }
  }
  return { cercano, brillo, listos, CRIA };
})();
