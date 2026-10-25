// ---------- la economía de la plata (sistema ECONOMIA) ----------
// La plata tiene que alcanzar al principio y seguir pesando arriba. Lo que se gana peleando y avanzando crece con el
// nivel: la plata de las criaturas con el suyo (escala, +7 % por nivel; lo gris, 6 o más abajo, suelta un 30 %), y lo
// que pagan las misiones de la historia y los lugares descubiertos con el de Eromash. Las cuentas del día (lo ganado y
// lo gastado desde las 6 de la mañana, y el total de siempre) se leen en el diario: así se ve que la plata rinde más
// lejos. Estado en E.extra.eco = { dia, gan, gas, totGan, totGas }. Textos `eo.`.
window.ECONOMIA = (function () {
  "use strict";
  let A, J, jug;
  const t = (k, v) => I18N.t(k, v);
  const escala = (n) => 1 + 0.07 * (Math.max(1, n || 1) - 1);
  const nivel = () => (window.RPG ? RPG.nivel() : 1);
  // lo que suelta una criatura vencida, según su nivel y el de Eromash
  function deCriatura(e, plata) {
    const n = window.RPG ? RPG.nivelDe(e) : 1;
    return Math.max(1, Math.round(plata * escala(n) * (n - nivel() <= -6 ? 0.3 : 1)));
  }
  // lo que paga la historia (misiones y lugares), según el nivel de Eromash
  const deHistoria = (plata) => Math.round(plata * escala(nivel()));

  // ---------- las cuentas del día ----------
  let st = null,
    antes = null;
  const dia = () => Math.floor((((A.H.E.tiempo || 0) / LUZ.DIA) * 24 + 9 - 6) / 24); // cambia a las 6 de la mañana
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
    },
    alEmpezar(extra) {
      extra.eco = Object.assign({ dia: 0, gan: 0, gas: 0, totGan: 0, totGas: 0 }, extra.eco || {});
      st = extra.eco;
      antes = null;
    },
    actualizar() {
      const pj = window.PODERES && PODERES.pj();
      if (!st || !pj || J.modo === "titulo") return;
      if (st.dia !== dia()) (st.dia = dia()), (st.gan = 0), (st.gas = 0);
      if (antes != null && pj.plata !== antes) {
        const d = pj.plata - antes;
        if (d > 0) (st.gan += d), (st.totGan += d);
        else (st.gas -= d), (st.totGas -= d);
      }
      antes = pj.plata;
    },
    diario() {
      if (!st) return "";
      return `<div class="diario-resumen"><p><b>${t("eo.titulo")}</b> ${t("eo.hoy", [st.gan, st.gas])} ${t("eo.siempre", [st.totGan, st.totGas])} ${t("eo.rinde", [Math.round((escala(nivel()) - 1) * 100)])}</p></div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, escala, deCriatura, deHistoria, cuentas: () => st };
})();
