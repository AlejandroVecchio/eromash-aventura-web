// ---------- las tierras de Eldervald y sus niveles (sistema TIERRAS) ----------
// Como las zonas del WoW: el mapa grande se reparte en catorce tierras con nombre, cada una con su franja de niveles.
// Una criatura toma el nivel de su distancia al Puesto (motor/rpg.js) pero queda dentro de la franja de la tierra donde
// vive: Las Lindes son de 1 a 4 y las Raíces del Este de 18 a 24, así salir del camino conocido se siente como un salto.
// Cada tierra es la región más cercana a su centro (en píxeles del mapa de 1557 × 1010). Al entrar a una sale su
// nombre con su franja y, si te supera mucho, un aviso; el mapa grande dibuja los bordes y los nombres con el color de
// peligro de cada franja (RPG.color). Lo de fuera del mapa (mazmorras, Góinn) no tiene tierra. Textos `tr.`; estado
// en E.extra.tierras = { vistas: { id: 1 } }.
window.TIERRAS = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  let U = 20; // unidades por píxel del mapa (lo de eldervald.js: W.ANCHO / 1557)
  const LISTA = [
    { id: "lindes", c: [350, 800], n: [1, 4], et: [240, 900] },
    { id: "tumulos", c: [210, 640], n: [3, 6] },
    { id: "skeld", c: [740, 870], n: [3, 6] },
    { id: "corona", c: [810, 560], n: [4, 7] },
    { id: "skarn", c: [190, 420], n: [5, 8] },
    { id: "talado", c: [440, 270], n: [7, 11] },
    { id: "ulvdal", c: [1060, 880], n: [9, 13] },
    { id: "claro", c: [160, 150], n: [10, 14] },
    { id: "orm", c: [1130, 330], n: [11, 15] },
    { id: "paso", c: [560, 90], n: [12, 16] },
    { id: "brunvik", c: [1250, 600], n: [13, 17] },
    { id: "paramo", c: [850, 160], n: [14, 19] },
    { id: "torre", c: [1420, 820], n: [16, 21] },
    { id: "raices", c: [1420, 220], n: [18, 24] },
  ];
  let st = { vistas: {} },
    actual = null,
    pausa = 0;
  // la tierra de un punto del mundo (null fuera del mapa)
  function en(x, y) {
    if (!W || x < 0 || y < 0 || x > W.ANCHO || y > W.ALTO) return null;
    let mejor = null,
      dm = Infinity;
    for (const r of LISTA) {
      const d = (x / U - r.c[0]) ** 2 + (y / U - r.c[1]) ** 2;
      if (d < dm) (dm = d), (mejor = r);
    }
    return mejor;
  }
  // lo pregunta RPG.nivelDe: el nivel por distancia, metido en la franja de la tierra
  function ajustar(x, y, n) {
    const r = en(x, y);
    return r ? Math.max(r.n[0], Math.min(r.n[1], n)) : n;
  }
  const nombre = (r) => t("tr." + r.id);
  const franja = (r) => t("tr.niveles", [r.n[0], r.n[1]]);
  const colorDe = (r) => (window.RPG ? RPG.color(Math.round((r.n[0] + r.n[1]) / 2)) : "#FFD98A");

  // ---------- el mapa grande ----------
  // los bordes se pintan una vez en un lienzo del tamaño del mapa (una celda cada 6 px)
  let bordes = null;
  function pintarBordes() {
    const P = 6,
      gw = Math.ceil(1557 / P),
      gh = Math.ceil(1010 / P),
      id = new Int8Array(gw * gh);
    for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) id[gy * gw + gx] = LISTA.indexOf(en((gx + 0.5) * P * U, (gy + 0.5) * P * U));
    const cv = document.createElement("canvas");
    cv.width = 1557;
    cv.height = 1010;
    const c = cv.getContext("2d");
    c.fillStyle = "rgba(255,217,138,0.35)";
    for (let gy = 0; gy < gh; gy++)
      for (let gx = 0; gx < gw; gx++) {
        const i = id[gy * gw + gx];
        if (gx + 1 < gw && id[gy * gw + gx + 1] !== i && (gy & 1)) c.fillRect((gx + 1) * P - 1, gy * P, 2, P);
        if (gy + 1 < gh && id[(gy + 1) * gw + gx] !== i && (gx & 1)) c.fillRect(gx * P, (gy + 1) * P - 1, P, 2);
      }
    return cv;
  }
  // mapa.js lo llama después de la niebla: c es su lienzo, aLienzo pasa del mundo al lienzo
  function dibujarMapa(c, cv, aLienzo, z) {
    if (!bordes) bordes = pintarBordes();
    const [x0, y0] = aLienzo(0, 0),
      [x1, y1] = aLienzo(W.ANCHO, W.ALTO);
    c.drawImage(bordes, x0, y0, x1 - x0, y1 - y0);
    c.textAlign = "center";
    const k = Math.min(1.4, 0.9 + z * 0.1);
    for (const r of LISTA) {
      const e = r.et || r.c, // dónde va el nombre (et: si el centro queda tapado por los íconos)
        [px, py] = aLienzo(e[0] * U, e[1] * U);
      if (px < -80 || py < -40 || px > cv.width + 80 || py > cv.height + 40) continue;
      c.font = `italic 700 ${Math.round(15 * k)}px "Eromash Text", system-ui, sans-serif`;
      c.lineWidth = 4;
      c.strokeStyle = "rgba(17,17,17,0.85)";
      c.globalAlpha = r === actual ? 1 : 0.8;
      c.strokeText(nombre(r), px, py + 34 * k);
      c.fillStyle = "#E0B2B2";
      c.fillText(nombre(r), px, py + 34 * k);
      c.font = `700 ${Math.round(12 * k)}px "Eromash Text", system-ui, sans-serif`;
      c.strokeText(franja(r), px, py + 49 * k);
      c.fillStyle = colorDe(r);
      c.fillText(franja(r), px, py + 49 * k);
      c.globalAlpha = 1;
    }
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = window.ELDERVALD;
      U = W.ANCHO / 1557;
      bordes = null;
    },
    alEmpezar(extra) {
      extra.tierras = Object.assign({ vistas: {} }, extra.tierras || {});
      st = extra.tierras;
      actual = en(jug.x, jug.y);
      if (actual) st.vistas[actual.id] = 1;
      pausa = 0;
    },
    actualizar(dt) {
      if (J.modo !== "juego" || J.dentro) return;
      if ((pausa -= dt) > 0) return;
      pausa = 0.5;
      const r = en(jug.x, jug.y);
      if (!r || r === actual) return;
      actual = r;
      const nueva = !st.vistas[r.id];
      st.vistas[r.id] = 1;
      HUD.aviso(nombre(r), "lugar", franja(r));
      // la primera vez que se entra a una tierra que te supera mucho, se avisa (la «?» empieza 10 arriba)
      const nv = window.RPG ? RPG.nivel() : 1;
      if (nueva && r.n[0] >= nv + 5) HUD.aviso(t(r.n[0] >= nv + 9 ? "tr.peligro_mucho" : "tr.peligro"), "#C8402D");
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, LISTA, U: () => U, en, ajustar, nombre, franja, dibujarMapa, actual: () => actual, vistas: () => st.vistas };
})();
