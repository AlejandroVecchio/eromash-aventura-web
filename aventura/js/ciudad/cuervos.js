// ---------- los cuervos de Odín en la ofrenda del Roble (módulo CUERVOS25) ----------
// En la losa de la ofrenda, al pie del Roble, se puede dejar un pedazo de carne (de COCINA) para los cuervos: una vez por
// día, levantan vuelo hacia lo más cercano que queda por encontrar en el bosque (un cofre a la vista, una piedra que
// susurra, un altar o un manzano), el cartel dice para qué lado y a cuántos metros, y queda la marca propia del mapa de
// Eldervald ahí (la brújula la sigue al salir). Sin carne o ya hecho ese día, la losa se mira como siempre (curiosidad).
// Estado en E.extra.eikholt.cuervos = { dia }; textos ek.cv_.
//   CUERVOS25.cercano(plano, e, st, A) → { texto, fn, d, x, y } o null
window.CUERVOS25 = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const dia = (A) => Math.floor(((A.H.E.tiempo / LUZ.DIA) * 24 + 9 - 6) / 24);
  const LADOS = ["este", "sureste", "sur", "suroeste", "oeste", "noroeste", "norte", "noreste"];
  let losa = null;
  // la carne que se deja: la que más haya
  function carne() {
    const c = window.COCINA && COCINA.estado();
    if (!c) return null;
    let k = null;
    for (const id in c.carne) if (c.carne[id] > 0 && (!k || c.carne[id] > c.carne[k])) k = id;
    return k;
  }
  // lo más cercano por encontrar desde la ciudad (en coordenadas del bosque)
  function pendiente(x, y) {
    if (!window.SECRETOS) return null;
    const S = SECRETOS.lista();
    let mejor = null,
      dm = Infinity;
    const ver = (o) => {
      const d = Math.hypot(o.x - x, o.y - y);
      if (d < dm) (dm = d), (mejor = o);
    };
    S.cofres.forEach((c) => !S.st.cofres[c.id] && !c.cosa.o.oculto && ver(c.cosa));
    S.piedras.forEach((p) => !S.st.piedras[p.id] && ver(p.cosa));
    S.altares.forEach((a) => !a.cosa.o.tomada && ver(a.cosa));
    S.manzanos.forEach((m) => !m.cosa.o.cosechado && ver(m.cosa));
    return mejor && { x: mejor.x, y: mejor.y, d: dm };
  }
  function dejar(st, A) {
    const k = carne();
    if (!k) return;
    COCINA.estado().carne[k]--;
    st.cuervos = { dia: dia(A) };
    const W = A.W,
      [cx, cy] = W.CIUDAD.c,
      p = pendiente(cx, cy);
    if (window.RECORRER25 && RECORRER25.volarCuervos) RECORRER25.volarCuervos(p ? p.x - cx : 0, p ? p.y - cy : -1);
    if (window.SONIDO) for (let i = 0; i < 3; i++) SONIDO.tono("sawtooth", 420 - i * 30, 300, 0.22, 0.03, { retraso: i * 0.25, filtro: 1400 });
    A.dialogoLibre([["eromash", "ek.cv_deja", [t("co.c_" + k)]]], () => {
      if (!p) return HUD.aviso(t("ek.cv_nada"), "#E0B2B2");
      const lado = LADOS[((Math.round(Math.atan2(p.y - cy, p.x - cx) / (Math.PI / 4)) % 8) + 8) % 8];
      const ex = A.H.E.extra;
      ex.mapa = ex.mapa || {};
      ex.mapa.marca = [Math.round(p.x), Math.round(p.y)];
      HUD.aviso(t("ek.cv_vuela", [t("ek.cv_" + lado), Math.round(p.d / 30)]), "#FFD98A");
    });
  }
  function cercano(plano, e, st, A) {
    losa = losa || plano.cosas.find((o) => o.id === "ofrendaRoble");
    if (!losa || (st.cuervos && st.cuervos.dia === dia(A)) || !carne()) return null;
    const d = Math.hypot(losa.x - e.x, losa.y - e.y);
    if (d > 1.8 * plano.M) return null;
    return { texto: t("ek.cv_accion"), fn: () => dejar(st, A), d, x: losa.x, y: losa.y };
  }
  return { cercano, pendiente };
})();
