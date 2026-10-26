// ---------- la ronda del blót (módulo BLOT25) ----------
// Una noche de cada siete, de 19 a 24, Eikholt festeja el blót: en la plaza, entre el Roble y la campana, dieciséis vecinos
// (`p.baile` en MUNDO25, se ven solo esa noche: `oculto()` de ciudad/juego.js) bailan en ronda tomados de la mano,
// con un tambor que se oye cerca. Con E Eromash se suma a la ronda 25 s (gira con ellos, sin mover: `activo()`); la
// primera vez de cada blót da experiencia y el ánimo de la fiesta (10 más de estamina por medio día, por
// RPG.aporte "blot"). Estado en E.extra.eikholt.blot = { dia, hasta, bailes }; textos ek.bl_.
//   BLOT25.hoy(A) · CENTRO, RADIO · cercano(plano, e, st, A) · actualizar(dt, st, A, e) · activo()
window.BLOT25 = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const CENTRO = [-1000, 1000],
    RADIO = 300,
    DURA = 25,
    VUELTA = 0.22; // radianes por segundo
  const dia = (A) => Math.floor(((A.H.E.tiempo / LUZ.DIA) * 24 + 9 - 6) / 24);
  const hoy = (A) => {
    const h = LUZ.hora(A.H.E.tiempo);
    return dia(A) % 7 === 5 && h >= 19;
  };
  const ahora = () => (window.JUEGO && JUEGO.H && JUEGO.H.E ? JUEGO.H.E.tiempo : 0);
  const estado = (st) => (st.blot = st.blot || { dia: -1, hasta: 0, bailes: 0 });
  let baila = null, // { t, a }
    tambor = 0;
  if (window.RPG)
    RPG.aporte((s) => {
      const st = window.EIKHOLT && EIKHOLT.estado && EIKHOLT.estado();
      if (st && st.blot && ahora() < st.blot.hasta) s.estamina += 10;
    }, "blot");
  // el lugar de la ronda en el ángulo a (la ronda se ve un poco achatada, como el piso)
  const enRonda = (a) => [CENTRO[0] + Math.cos(a) * RADIO, CENTRO[1] + Math.sin(a) * RADIO * 0.8];

  function cercano(plano, e, st, A) {
    if (baila || !hoy(A)) return null;
    const d = Math.hypot(e.x - CENTRO[0], (e.y - CENTRO[1]) / 0.8);
    if (Math.abs(d - RADIO) > 2.5 * plano.M) return null;
    return { texto: t("ek.bl_accion"), fn: () => sumarse(e, st, A), d: Math.abs(d - RADIO), x: e.x, y: e.y };
  }
  function sumarse(e, st, A) {
    baila = { t: 0, a: Math.atan2((e.y - CENTRO[1]) / 0.8, e.x - CENTRO[0]) };
    if (window.ANIMA) ANIMA.gesto("asiente");
    HUD.aviso(t("ek.bl_suma"), "#FFD98A");
  }
  function actualizar(dt, st, A, e) {
    if (!hoy(A)) return (baila = null);
    // el tambor de la fiesta, más fuerte cerca de la ronda
    const d = Math.hypot(e.x - CENTRO[0], e.y - CENTRO[1]);
    if (A.J.modo === "juego" && d < 2600 && (tambor -= dt) <= 0) {
      tambor = 0.5;
      if (window.SONIDO) SONIDO.tono("sine", 110, 55, 0.18, 0.09 * (1 - d / 2600));
    }
    if (!baila || A.J.modo !== "juego") return;
    baila.t += dt;
    baila.a += VUELTA * dt;
    const [x, y] = enRonda(baila.a);
    e.x = x;
    e.y = y;
    if (baila.t < DURA) return;
    baila = null;
    const s = estado(st);
    if (s.dia === dia(A)) return HUD.aviso(t("ek.bl_otra"), "#E0B2B2");
    s.dia = dia(A);
    s.bailes++;
    s.hasta = ahora() + LUZ.DIA * 0.5;
    if (window.RPG) RPG.recalcular();
    if (window.RPG && RPG.dar) RPG.dar(20, A.jug ? A.jug.x : 0, A.jug ? A.jug.y : 0);
    A.dialogoLibre([["eromash", "ek.bl_fin"]], () => HUD.aviso(t("ek.bl_animo"), "#FFD98A"));
  }
  return { hoy, cercano, actualizar, activo: () => !!baila, enRonda, CENTRO, RADIO, VUELTA };
})();
