// ---------- las cintas de promesa del Roble (módulo PROMESAS25) ----------
// Alrededor del Roble de Eikholt cuelgan las cintas de promesa (asset cintasPromesa de la ciudad). Por 3 de plata
// Eromash ata la suya y pide una de tres cosas para el día: salud (más vida y se cura más rápido), suerte (más críticos
// y más plata) o camino (más rápido y más estamina). Dura hasta las 6 de la mañana siguiente y se suma por RPG.aporte
// (en la Hoja figura como «Promesa del Roble»). Una por día. Estado en E.extra.eikholt.promesa = { deseo, hasta }
// (hasta = el tiempo del juego en que se desata); textos ek.pr_.
//   PROMESAS25.cercano(plano, e, st, A) → { texto, fn, d, x, y } o null · actualizar(st, A)
window.PROMESAS25 = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const PRECIO = 3;
  const DESEOS = {
    salud: (s) => ((s.vida *= 1.08), (s.regen *= 1.3)),
    suerte: (s) => ((s.crit += 0.05), (s.plata *= 1.1)),
    camino: (s) => ((s.velMov *= 1.06), (s.estamina += 15)),
  };
  const ahora = () => window.JUEGO && JUEGO.H && JUEGO.H.E ? JUEGO.H.E.tiempo : 0;
  function activa() {
    const st = window.EIKHOLT && EIKHOLT.estado && EIKHOLT.estado();
    const p = st && st.promesa;
    return p && DESEOS[p.deseo] && ahora() < p.hasta ? p : null;
  }
  if (window.RPG)
    RPG.aporte((s) => {
      const p = activa();
      if (p) DESEOS[p.deseo](s);
    }, "promesa");
  // el tiempo de la próxima mañana a las 6 (el reloj arranca a las 9)
  function hastaManana(tiempo) {
    const D = LUZ.DIA,
      h6 = ((6 - 9 + 24) % 24) / 24;
    let x = Math.floor(tiempo / D) * D + h6 * D;
    while (x <= tiempo) x += D;
    return x;
  }
  function atar(st, A, deseo) {
    A.cerrarMenu();
    const pj = PODERES.pj();
    if (pj.plata < PRECIO) return HUD.aviso(t("ek.pr_sin_plata"), "#C8402D");
    pj.plata -= PRECIO;
    st.promesa = { deseo, hasta: hastaManana(A.H.E.tiempo) };
    st.promesas = (st.promesas || 0) + 1;
    if (window.RPG) RPG.recalcular();
    if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.35 });
    if (window.ANIMA) ANIMA.gesto("asiente");
    A.dialogoLibre([["eromash", "ek.pr_ato_" + deseo]], () => HUD.aviso(t("ek.pr_aviso", [t("ek.pr_" + deseo)]), "#FFD98A"));
  }
  function abrir(st, A) {
    const p = activa();
    if (p) return A.dialogoLibre([["eromash", "ek.pr_ya", [t("ek.pr_" + p.deseo)]]]);
    A.menu(
      `<h2>${t("ek.pr_titulo")}</h2><div class="sub">${t("ek.pr_sub", [PRECIO, PODERES.pj().plata])}</div><p>${t("ek.pr_texto")}</p>`,
      Object.keys(DESEOS)
        .map((k) => ({ texto: t("ek.pr_" + k) + " · " + t("ek.pr_" + k + "_d"), fn: () => atar(st, A, k) }))
        .concat([{ texto: t("ui.cerrar"), fn: A.cerrarMenu }])
    );
  }
  let cintas = null;
  function cercano(plano, e, st, A) {
    cintas = cintas || plano.cosas.filter((o) => o.id === "cintasPromesa");
    let mejor = null;
    for (const o of cintas) {
      const d = Math.hypot(o.x - e.x, o.y - e.y);
      if (d < 1.6 * plano.M && (!mejor || d < mejor.d)) mejor = { texto: t(activa() ? "ek.pr_accion_mirar" : "ek.pr_accion"), fn: () => abrir(st, A), d, x: o.x, y: o.y };
    }
    return mejor;
  }
  // al llegar la mañana la cinta se desata sola: avisa y recalcula (al cargar una partida con la cinta atada, también)
  let cargada = false;
  function actualizar(st) {
    if (!cargada && activa() && window.RPG) RPG.recalcular();
    cargada = true;
    if (st.promesa && !activa()) {
      st.promesa = null;
      if (window.RPG) RPG.recalcular();
      HUD.aviso(t("ek.pr_se_fue"), "#E0B2B2");
    }
  }
  return { cercano, actualizar, activa, DESEOS };
})();
