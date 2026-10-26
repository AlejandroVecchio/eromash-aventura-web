// ---------- los cuentos junto al fuego de los forasteros (módulo CUENTOS25) ----------
// De 19 a 24, en el campamento de los forasteros, una cuentacuentos de paso (`p.cuentos` en MUNDO25, rol `cuentista`)
// se sienta junto al fogón y cuenta una de las viejas historias: cada noche otra, en rueda (la pesca de Thor, Fenrir y la
// mano de Týr, el ojo de Odín en el pozo de Mímir, las manzanas de Iðunn, el muro de Asgard y Sleipnir, el martillo
// robado, la muerte de Baldr y Skaði que eligió por los pies). Escuchar una por primera vez da experiencia; las ya
// oídas se pueden volver a escuchar. Estado en E.extra.eikholt.cuentos = [n oídos]; textos ek.cu_.
//   CUENTOS25.cercano(plano, e, st, A, gente) → { texto, fn, d, x, y } o null · deHoy(A) · CUENTOS
window.CUENTOS25 = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const CUENTOS = 8,
    LINEAS = 4,
    EXP = 15;
  const dia = (A) => Math.floor(((A.H.E.tiempo / LUZ.DIA) * 24 + 9 - 6) / 24);
  const deHoy = (A) => dia(A) % CUENTOS;
  function contar(p, st, A) {
    const n = deHoy(A),
      oidos = (st.cuentos = st.cuentos || []),
      nuevo = !oidos.includes(n),
      quien = "ek_" + p.rol;
    const lineas = [[quien, "ek.cu_abre", [t("ek.cu_" + n + "_titulo")]]];
    for (let i = 0; i < LINEAS; i++) lineas.push([quien, "ek.cu_" + n + "_" + i]);
    lineas.push(["eromash", "ek.cu_" + n + "_eromash"]);
    if (window.SONIDO) SONIDO.tocar("pagina", { vol: 0.25, tono: 0.8 });
    A.dialogoLibre(lineas, () => {
      if (!nuevo) return;
      oidos.push(n);
      if (window.RPG && RPG.dar) RPG.dar(EXP, A.jug ? A.jug.x : 0, A.jug ? A.jug.y : 0);
      if (window.ANIMA) ANIMA.gesto("asiente");
      HUD.aviso(t("ek.cu_aprendido", [t("ek.cu_" + n + "_titulo"), oidos.length, CUENTOS]), "#FFD98A");
    });
  }
  function cercano(plano, e, st, A, gente) {
    const h = LUZ.hora(A.H.E.tiempo);
    if (h < 19) return null;
    for (const p of gente) {
      if (!p.cuentos || p.visible === false) continue;
      const d = Math.hypot(p.x - e.x, p.y - e.y);
      if (d > 2.4 * plano.M) continue;
      const oido = (st.cuentos || []).includes(deHoy(A));
      return { texto: t(oido ? "ek.cu_accion_otra" : "ek.cu_accion", [t("ek.cu_" + deHoy(A) + "_titulo")]), fn: () => contar(p, st, A), d, x: p.x, y: p.y };
    }
    return null;
  }
  return { cercano, deHoy, CUENTOS };
})();
