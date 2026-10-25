// ---------- regiones con nombre (sistema REGIONES) ----------
// Las regiones se dibujan en el editor (herramienta Región) y viven en AGREGADOS.regiones: { u, nombre: { es, en },
// p: [[x, y], ...] }. Al entrar a una, su nombre sale en el cartel dorado de lugar (CARTEL), como cuando se llega a un lugar. Si una región está
// dentro de otra, gana la que se dibujó después (la más chica, casi siempre).
window.REGIONES = (function () {
  "use strict";
  let A,
    jug,
    actual = null,
    acum = 0;
  const lista = () => (window.AGREGADOS && AGREGADOS.regiones) || [];
  function adentro(x, y, p) {
    let si = false;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const [xi, yi] = p[i],
        [xj, yj] = p[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) si = !si;
    }
    return si;
  }
  const nombreDe = (r) => (r.nombre && (r.nombre[I18N.lang] || r.nombre.es || r.nombre.en)) || "";
  function en(x, y) {
    let r = null;
    for (const g of lista()) if (g.p && g.p.length > 2 && adentro(x, y, g.p)) r = g;
    return r;
  }
  const sistema = {
    iniciar(api) {
      A = api;
      jug = A.jug;
    },
    alEmpezar() {
      const r = en(jug.x, jug.y);
      actual = r ? r.u : null;
    },
    actualizar(dt) {
      acum += dt;
      if (acum < 0.4 || A.J.dentro) return;
      acum = 0;
      const r = en(jug.x, jug.y),
        k = r ? r.u : null;
      if (k === actual) return;
      if (actual != null && window.CARTEL) CARTEL.sale("region:" + actual);
      actual = k;
      if (r && nombreDe(r)) {
        if (window.CARTEL) CARTEL.entra("region:" + k, { nombre: nombreDe(r) });
        else HUD.aviso(nombreDe(r), "lugar", "");
      }
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { en, adentro, nombreDe };
})();
