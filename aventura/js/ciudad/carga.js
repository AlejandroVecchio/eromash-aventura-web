// ---------- descargar los botes del muelle (módulo CARGA25) ----------
// De 6 a 10 los pescadores vuelven con los botes cargados: en la punta del muelle esperan cajas de pescado y hay que
// llevarlas una por una hasta el secadero de la orilla. Con una caja a cuestas Eromash no corre ni salta (`cargando()`,
// lo mira ciudad/juego.js) y la caja se ve sobre su cabeza (`dibujar`). Tres cajas por mañana: la tercera paga 6 y un
// pescado para la fogata (COCINA). Estado en E.extra.eikholt.carga = { dia, llevadas, hechas }; textos ek.cg_.
//   CARGA25.cercano(plano, e, st, A) → { texto, fn, d, x, y } o null · cargando() · dibujar(c, cam, cw, ch, e)
window.CARGA25 = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const CAJAS = 3,
    PAGA = 6;
  const dia = (A) => Math.floor(((A.H.E.tiempo / LUZ.DIA) * 24 + 9 - 6) / 24);
  const estado = (st, A) => {
    const s = (st.carga = st.carga || { dia: -1, llevadas: 0, hechas: 0 });
    if (s.dia !== dia(A)) (s.dia = dia(A)), (s.llevadas = 0);
    return s;
  };
  let lleva = false,
    puntos = null;
  // dónde se levanta (la punta del muelle) y dónde se deja (delante del secadero de pescado)
  function donde(plano) {
    if (puntos) return puntos;
    const m = plano.anclas.muelle || [0, 0],
      sec = plano.cosas.filter((o) => o.id === "secaderoPescado").sort((a, b) => Math.hypot(a.x - m[0], a.y - m[1]) - Math.hypot(b.x - m[0], b.y - m[1]))[0];
    return (puntos = { carga: [m[0] + 5 * plano.M, m[1]], deja: sec ? [sec.x, sec.y + 1.4 * plano.M] : [m[0] - 8 * plano.M, m[1] + 8 * plano.M] });
  }
  function cercano(plano, e, st, A) {
    const h = LUZ.hora(A.H.E.tiempo),
      s = estado(st, A),
      p = donde(plano);
    if (lleva) {
      const d = Math.hypot(p.deja[0] - e.x, p.deja[1] - e.y);
      if (d < 2.4 * plano.M) return { texto: t("ek.cg_dejar"), fn: () => dejar(s, A), d, x: p.deja[0], y: p.deja[1] };
      return null;
    }
    if (h < 6 || h >= 10 || s.llevadas >= CAJAS) return null;
    const d = Math.hypot(p.carga[0] - e.x, p.carga[1] - e.y);
    if (d > 2.6 * plano.M) return null;
    return { texto: t("ek.cg_levantar", [s.llevadas + 1, CAJAS]), fn: () => levantar(), d, x: p.carga[0], y: p.carga[1] };
  }
  function levantar() {
    lleva = true;
    if (window.SONIDO) SONIDO.tocar("golpe", { vol: 0.25, tono: 0.7 });
    HUD.aviso(t("ek.cg_llevala"), "#E0B2B2");
  }
  function dejar(s, A) {
    lleva = false;
    s.llevadas++;
    if (window.SONIDO) SONIDO.tocar("golpe", { vol: 0.3, tono: 0.6 });
    if (s.llevadas < CAJAS) return HUD.aviso(t("ek.cg_una", [s.llevadas, CAJAS]), "#E0B2B2");
    s.hechas++;
    if (window.ANIMA) ANIMA.gesto("asiente");
    A.dialogoLibre([["eromash", "ek.cg_listo"]], () => {
      PODERES.darPlata(PAGA);
      const c = window.COCINA && COCINA.estado();
      if (c) c.carne.pescado = (c.carne.pescado || 0) + 1;
      HUD.aviso(t("ek.cg_premio", [PAGA]), "#FFD98A");
    });
  }
  // la caja sobre la cabeza de Eromash: tapa clara, frente y costado izquierdo en sombra, y la cola de un pescado
  function dibujar(c, cam, cw, ch, e) {
    if (!lleva) return;
    const [vx, vy] = VISTA25.proyector(cam)(e.x, e.y),
      sx = (vx - cam.x) * cam.esc + cw / 2,
      sy = (vy - cam.y) * cam.esc + ch / 2 - 102 * cam.esc,
      w = 52 * cam.esc,
      h = 26 * cam.esc;
    c.fillStyle = ASSETS.C.madera;
    c.fillRect(sx - w / 2, sy, w, h);
    c.fillStyle = ASSETS.C.maderaSombra;
    c.fillRect(sx - w / 2, sy, w * 0.22, h);
    c.fillStyle = ASSETS.C.maderaLuz;
    c.beginPath();
    c.moveTo(sx - w / 2, sy);
    c.lineTo(sx - w / 2 + w * 0.18, sy - h * 0.45);
    c.lineTo(sx + w / 2 + w * 0.18, sy - h * 0.45);
    c.lineTo(sx + w / 2, sy);
    c.fill();
    c.fillStyle = "#9AA8AE";
    c.beginPath();
    c.moveTo(sx + w * 0.3, sy - h * 0.2);
    c.lineTo(sx + w * 0.55, sy - h * 0.6);
    c.lineTo(sx + w * 0.58, sy - h * 0.1);
    c.fill();
  }
  return { cercano, dibujar, cargando: () => lleva };
})();
