// ---------- lo perdido en Eikholt (módulo PERDIDOS25) ----------
// Cada día una vecina de la plaza (`p.perdio` en MUNDO25, junto al pozo, de 8 a 19) perdió algo: un broche, un anillo,
// una llave, un peine de hueso, un amuleto o un cuchillo. Hablándole dice cerca de qué lugar del mapa fue; desde ahí el
// objeto brilla en el piso (un rombo dorado que late, dibujado en pantalla por brillo()) y se levanta con E. Devolverlo
// paga 8 y una frase de gracias. Qué y dónde salen de la semilla del día. Estado en E.extra.eikholt.perdido =
// { dia, sabe, tiene, hecho } (y devueltos, la cuenta de todos los días); textos ek.pd_.
//   PERDIDOS25.cercano(plano, e, st, A, gente) → { texto, fn, d, x, y } o null · brillo(c, cam, cw, ch, t, plano, st, A)
window.PERDIDOS25 = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const COSAS = 6,
    PAGA = 8;
  const LUGARES = ["pozo", "tablon", "campana", "hierbas", "huertas", "corral", "forasteros", "carpinteria", "cordeleria", "hnefatafl", "cintas", "mercado"];
  const dia = (A) => Math.floor(((A.H.E.tiempo / LUZ.DIA) * 24 + 9 - 6) / 24);
  let cache = null; // { dia, cosa, lugar, x, y }
  // qué se perdió hoy y dónde (un punto libre a unos metros del lugar)
  function hoy(plano, A) {
    const d = dia(A);
    if (cache && cache.dia === d) return cache;
    const r = DIB.azar(4100 + d * 37),
      lista = LUGARES.filter((k) => plano.lugares[k]);
    const lugar = lista[Math.floor(r() * lista.length)],
      [lx, ly] = plano.lugares[lugar];
    let x = lx,
      y = ly;
    for (let i = 0; i < 30; i++) {
      const a = r() * Math.PI * 2,
        rr = (3 + r() * 4) * plano.M;
      if (MUNDO25.libre(lx + Math.cos(a) * rr, ly + Math.sin(a) * rr, 30)) {
        x = lx + Math.cos(a) * rr;
        y = ly + Math.sin(a) * rr;
        break;
      }
    }
    return (cache = { dia: d, cosa: Math.floor(r() * COSAS), lugar, x, y });
  }
  function estado(st, A) {
    const d = dia(A);
    if (!st.perdido || st.perdido.dia !== d) st.perdido = { dia: d, sabe: false, tiene: false, hecho: false };
    return st.perdido;
  }
  function hablar(plano, st, A, p) {
    const s = estado(st, A),
      h = hoy(plano, A),
      cosa = t("ek.pd_cosa_" + h.cosa);
    if (s.hecho) return A.dialogoLibre([["ek_vecina", "ek.pd_ya"]]);
    if (s.tiene) {
      s.tiene = false;
      s.hecho = true;
      st.devueltos = (st.devueltos || 0) + 1;
      if (window.ANIMA) ANIMA.gesto("asiente");
      return A.dialogoLibre([["eromash", "ek.pd_devuelvo", [cosa]], ["ek_vecina", "ek.pd_gracias_" + h.cosa]], () => {
        PODERES.darPlata(PAGA);
        HUD.aviso(t("ek.pd_premio", [PAGA]), "#FFD98A");
      });
    }
    s.sabe = true;
    A.dialogoLibre([["ek_vecina", "ek.pd_pide", [cosa, t("ci.m_" + h.lugar)]]], () => HUD.aviso(t("ek.pd_buscar", [cosa, t("ci.m_" + h.lugar)]), "#E0B2B2"));
  }
  function levantar(plano, st, A) {
    const s = estado(st, A),
      h = hoy(plano, A);
    s.tiene = true;
    if (window.SONIDO) SONIDO.tocar("plata", { vol: 0.3, tono: 1.3 });
    HUD.aviso(t("ek.pd_hallado", [t("ek.pd_cosa_" + h.cosa)]), "#FFD98A");
  }
  function cercano(plano, e, st, A, gente) {
    const s = estado(st, A),
      M = plano.M;
    // la dueña
    const p = gente.find((q) => q.perdio && q.visible !== false);
    if (p) {
      const d = Math.hypot(p.x - e.x, p.y - e.y);
      if (d < 1.8 * M && !s.hecho) return { texto: t(s.tiene ? "ek.pd_accion_devolver" : "ek.pd_accion_hablar"), fn: () => hablar(plano, st, A, p), d, x: p.x, y: p.y };
    }
    // lo perdido, si ya se sabe y todavía está en el piso
    if (s.sabe && !s.tiene && !s.hecho) {
      const h = hoy(plano, A),
        d = Math.hypot(h.x - e.x, h.y - e.y);
      if (d < 1.4 * M) return { texto: t("ek.pd_accion_levantar", [t("ek.pd_cosa_" + h.cosa)]), fn: () => levantar(plano, st, A), d, x: h.x, y: h.y };
    }
    return null;
  }
  // el brillo en el piso: un rombo dorado que late (en pantalla, después del mundo)
  function brillo(c, cam, cw, ch, tt, plano, st, A) {
    const s = st.perdido;
    if (!s || !s.sabe || s.tiene || s.hecho || s.dia !== dia(A)) return;
    const h = hoy(plano, A),
      [vx, vy] = VISTA25.proyector(cam)(h.x, h.y),
      sx = (vx - cam.x) * cam.esc + cw / 2,
      sy = (vy - cam.y) * cam.esc + ch / 2;
    if (sx < -40 || sy < -40 || sx > cw + 40 || sy > ch + 40) return;
    const k = 0.75 + 0.25 * Math.sin(tt * 5),
      r = 10 * k * Math.max(1, cam.esc * 3);
    c.save();
    if (!window.CALIDAD || CALIDAD.nivel !== "baja") DIB.halo(c, sx, sy, r * 3.2, "#FFD98A", 0.35 * k);
    c.fillStyle = "#FFD98A";
    c.beginPath();
    c.moveTo(sx, sy - r);
    c.lineTo(sx + r * 0.7, sy);
    c.lineTo(sx, sy + r);
    c.lineTo(sx - r * 0.7, sy);
    c.closePath();
    c.fill();
    c.restore();
  }
  return { cercano, brillo, hoy };
})();
