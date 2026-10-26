// ---------- sentarse a esperar en el Ting (módulo ESPERAR25) ----------
// Los doce asientos de piedra del anillo del Ting sirven para dejar pasar las horas: sentado ahí, Eromash elige hasta
// cuándo esperar (la mañana, el mediodía, la tarde o la noche) y la ciudad sigue sola mientras la pantalla se funde.
// Sirve para llegar a la asamblea, al mercado abierto, a los faroleros o a la ronda de noche. Textos ek.esp_.
//   ESPERAR25.cercano(plano, e, A) → { texto, fn, d, x, y } o null
window.ESPERAR25 = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const HASTA = { manana: 7, mediodia: 12, tarde: 17, noche: 21 };
  let asientos = null,
    esperando = false;
  function esperar(A, k) {
    A.cerrarMenu();
    esperando = true;
    HUD.fundido(true);
    if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.25, tono: 0.8 });
    setTimeout(() => {
      const h = LUZ.hora(A.H.E.tiempo),
        falta = ((HASTA[k] - h + 24) % 24 || 24) / 24;
      A.H.E.tiempo += falta * LUZ.DIA;
      HUD.fundido(false);
      esperando = false;
      HUD.aviso(t("ek.esp_paso_" + k), "#E0B2B2");
    }, 900);
  }
  function abrir(A) {
    A.menu(
      `<h2>${t("ek.esp_titulo")}</h2><p>${t("ek.esp_texto")}</p>`,
      Object.keys(HASTA)
        .map((k) => ({ texto: t("ek.esp_" + k), fn: () => esperar(A, k) }))
        .concat([{ texto: t("ui.cerrar"), fn: A.cerrarMenu }])
    );
  }
  function cercano(plano, e, A) {
    if (esperando) return null;
    asientos = asientos || plano.cosas.filter((o) => /^asiento/.test(o.nombre || ""));
    let mejor = null;
    for (const o of asientos) {
      const d = Math.hypot(o.x - e.x, o.y - e.y);
      if (d < 1.3 * plano.M && (!mejor || d < mejor.d)) mejor = { texto: t("ek.esp_accion"), fn: () => abrir(A), d, x: o.x, y: o.y };
    }
    return mejor;
  }
  return { cercano, HASTA };
})();
