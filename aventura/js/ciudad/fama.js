// ---------- lo que se cuenta de Eromash en Eikholt (módulo FAMA25) ----------
// Los vecinos sin nombre comentan lo que Eromash ya hizo afuera: vencer a Hrímnir, ganar en la hólmganga, cobrar un
// contrato, saquear una guarida de los Sin Linde, cortar un nido de arañas, aguantar la Cacería Salvaje o llegar lejos de
// nivel. Lee el estado de cada sistema (como la Saga). recorrer.js y la charla de ciudad/juego.js piden una de cada tres
// veces FAMA25.frase(n); sin hazañas, null y siguen con lo de siempre. Textos ek.fama_<hazaña>_0..1.
window.FAMA25 = (function () {
  "use strict";
  const cuenta = (o) => Object.keys(o || {}).filter((k) => o[k]).length;
  const HAZANAS = [
    ["jotunn", () => window.JOTUNN && JOTUNN.estado().vencido],
    ["holmr", () => window.HOLMR && HOLMR.estado().vencidos > 0],
    ["contrato", () => window.CONTRATOS && CONTRATOS.LISTA.some((b) => (CONTRATOS.estado().c[b.id] || {}).fase === "vencido")],
    ["bandidos", () => window.BANDIDOS && cuenta(BANDIDOS.estado().saqueados) > 0],
    ["aranas", () => window.ARANAS && cuenta(ARANAS.estado().cortados) > 0],
    ["caceria", () => window.CACERIA && CACERIA.estado().vencidas + CACERIA.estado().sobrevividas > 0],
    ["nivel", () => window.RPG && RPG.nivel() >= 10],
  ];
  function hechas() {
    const l = [];
    for (const [id, f] of HAZANAS) {
      try {
        if (f()) l.push(id);
      } catch (e) {}
    }
    return l;
  }
  // la clave de una frase sobre una hazaña hecha (n elige cuál), o null
  function frase(n) {
    const l = hechas();
    if (!l.length) return null;
    n = Math.abs(Math.floor(n)) || 0;
    return "ek.fama_" + l[n % l.length] + "_" + (Math.floor(n / l.length) % 2);
  }
  return { frase, hechas, HAZANAS };
})();
