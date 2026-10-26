// ---------- las gallinas escapadas del corral (módulo GALLINAS25) ----------
// Uno de cada tres días, de 9 a 17, las siete gallinas del gallinero del corral se escapan por la ciudad (`a.escapada`
// en los animales de RECORRER25: no vuelven solas). Huyen de Eromash, así que se las arrea caminando por detrás hacia el
// gallinero; cada una que llega se queda. Con las siete adentro, la granjera del corral paga 8 la primera vez del día. A las 17 vuelven
// solas sin paga. Estado en E.extra.eikholt.gallinas = { dia, hecho, aviso }; textos ek.ga_.
//   GALLINAS25.actualizar(dt, plano, st, A, e) · sueltas() → [[x, y]] para el mapa · faltan() → cuántas siguen afuera (o -1 si no es día) · hoy(A)
window.GALLINAS25 = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const PAGA = 8,
    LLEGA = 380;
  const dia = (A) => Math.floor(((A.H.E.tiempo / LUZ.DIA) * 24 + 9 - 6) / 24);
  const hoy = (A) => {
    const h = LUZ.hora(A.H.E.tiempo);
    return dia(A) % 3 === 1 && h >= 9 && h < 17;
  };
  let suyas = null,
    sueltas = false;
  // las gallinas del gallinero del corral (el más cercano al corral)
  function delCorral(plano) {
    if (suyas && RECORRER25.gallinas().includes(suyas[0])) return suyas;
    sueltas = false;
    const L = plano.lugares.corral || [0, 0],
      todas = RECORRER25.gallinas();
    if (!todas.length) return [];
    let cx = todas[0].cx,
      cy = todas[0].cy,
      dm = Infinity;
    for (const g of todas) {
      const d = Math.hypot(g.cx - L[0], g.cy - L[1]);
      if (d < dm) (dm = d), (cx = g.cx), (cy = g.cy);
    }
    return (suyas = todas.filter((g) => g.cx === cx && g.cy === cy));
  }
  const estado = (st, A) => (st.gallinas && st.gallinas.dia === dia(A) ? st.gallinas : (st.gallinas = { dia: dia(A), hecho: false, aviso: false }));
  // las suelta lejos del gallinero, hacia la plaza, en lugares libres
  function soltar(plano, gs) {
    const r = DIB.azar(7700 + gs.length),
      M = plano.M;
    for (const g of gs) {
      const base = Math.atan2(-g.cy, -g.cx);
      for (let i = 0; i < 40; i++) {
        const a = base + (r() - 0.5) * 1.6,
          d = (22 + r() * 22) * M,
          x = g.cx + Math.cos(a) * d,
          y = g.cy + Math.sin(a) * d;
        if (MUNDO25.libre(x, y, 25)) {
          g.x = x;
          g.y = y;
          break;
        }
      }
      g.escapada = true;
      g.vx = g.vy = 0;
    }
    sueltas = true;
  }
  function guardar(gs) {
    for (const g of gs) g.escapada = false;
    sueltas = false;
  }
  function actualizar(dt, plano, st, A, e) {
    if (!window.RECORRER25 || !RECORRER25.gallinas) return;
    const gs = delCorral(plano);
    if (!gs.length) return;
    const s = estado(st, A);
    if (!hoy(A) || s.hecho) {
      if (sueltas) guardar(gs);
      return;
    }
    if (!sueltas) soltar(plano, gs);
    // la primera vez que ve una suelta, el aviso de qué hacer
    if (!s.aviso && gs.some((g) => g.escapada && Math.hypot(g.x - e.x, g.y - e.y) < 9 * plano.M)) {
      s.aviso = true;
      HUD.aviso(t("ek.ga_aviso"), "#FFD98A");
    }
    for (const g of gs) {
      if (!g.escapada || Math.hypot(g.x - g.cx, g.y - g.cy) > LLEGA) continue;
      g.escapada = false;
      const n = gs.filter((q) => !q.escapada).length;
      if (window.SONIDO) SONIDO.tono("square", 900, 1300, 0.12, 0.03);
      if (n < gs.length) HUD.aviso(t("ek.ga_una", [n, gs.length]), "#E0B2B2");
      else {
        s.hecho = true;
        sueltas = false;
        if (window.ANIMA) ANIMA.gesto("asiente");
        A.dialogoLibre([["eromash", "ek.ga_listo"]], () => {
          PODERES.darPlata(PAGA);
          HUD.aviso(t("ek.ga_premio", [PAGA]), "#FFD98A");
        });
      }
    }
  }
  const sueltasAhora = () => (sueltas && suyas ? suyas.filter((g) => g.escapada).map((g) => [g.x, g.y]) : []);
  const faltan = () => (sueltas && suyas ? suyas.filter((g) => g.escapada).length : -1);
  return { actualizar, faltan, hoy, sueltas: sueltasAhora };
})();
