// ---------- los hörgar de los dioses (assets de SANTUARIOS) ----------
// Un hörgr: el altar de piedras apiladas de los nórdicos al costado del camino. Una base de lajas planas, una estela
// tallada con la runa del dios (o.dios: thor, odin, tyr, freyja, frigg, njord, ullr), las ofrendas al pie (un cuenco,
// un cuerno, plata) y dos postes con cintas del color del dios. o.vivo: la bendición está puesta (la runa brilla y
// sube humo claro); o.dormido: ya bendijo hoy (la runa apagada).
// Se arma con caras (frente y costado en sombra de cada piedra) para verse de cualquier lado. Mismo estilo que la arena:
// luz de arriba a la derecha, la mitad izquierda en sombra, sombra elíptica.
(function () {
  "use strict";
  const { P, E, sombra } = DIB;
  const PIEDRA = "#8E8A86",
    PIEDRA_S = "#6E6A66",
    PIEDRA_L = "#B4B0AA",
    PIEDRA_O = "#4E4A46";
  // cada dios: su runa y el color de las cintas
  const DIOSES = {
    thor: { runa: "thurisaz", col: "#C8402D" },
    odin: { runa: "ansuz", col: "#4A78D0" },
    tyr: { runa: "tiwaz", col: "#E0B2B2" },
    freyja: { runa: "fehu", col: "#F5A524" },
    frigg: { runa: "berkano", col: "#7BC86C" },
    njord: { runa: "laguz", col: "#73D5DB" },
    ullr: { runa: "eihwaz", col: "#9A7650" },
  };

  function horgr(c, x, y, t, o) {
    const s = o.s || 1,
      D = DIOSES[o.dios] || DIOSES.thor,
      X = (v) => x + v * s,
      Y = (v) => y - v * s,
      pp = (a, col) => P(c, a.map((v, i) => (i % 2 ? Y(v) : X(v))), col);
    sombra(c, X(6), y + 4 * s, 78 * s, 18 * s, 0.34);
    // los postes con cintas, atrás
    [[-58, 1], [62, -1]].forEach(([px, lado]) => {
      pp([px - 3, 0, px + 3, 0, px + 3, 96, px - 3, 96], "#553A22");
      pp([px, 0, px + 3, 0, px + 3, 96, px, 96], "#7A5634");
      const ond = Math.sin(t * 2.4 + px) * 4;
      pp([px + 3, 92, px + 3 + 22 * lado, 86 + ond, px + 3 + 20 * lado, 80 + ond, px + 3, 84], D.col);
      pp([px + 3, 80, px + 3 + 16 * lado, 74 - ond, px + 3 + 14 * lado, 70 - ond, px + 3, 74], D.col);
    });
    // la base: tres lajas apiladas, cada una con su frente y su costado izquierdo en sombra
    const laja = (y0, h, w, dx) => {
      pp([-w + dx - 8, y0 + 3, -w + dx, y0, -w + dx, y0 + h, -w + dx - 8, y0 + h + 3], PIEDRA_O);
      pp([-w + dx, y0, w + dx, y0, w + dx, y0 + h, -w + dx, y0 + h], PIEDRA_S);
      pp([dx, y0, w + dx, y0, w + dx, y0 + h, dx, y0 + h], PIEDRA);
      pp([-w + dx, y0 + h, w + dx, y0 + h, w + dx - 6, y0 + h + 6, -w + dx - 6, y0 + h + 6], PIEDRA_L);
    };
    laja(0, 12, 48, 0);
    laja(18, 10, 38, 3);
    // la estela tallada encima
    pp([-26, 34, -18, 30, -16, 108, -22, 112], PIEDRA_O);
    pp([-18, 30, 20, 30, 18, 104, 0, 116, -16, 108], PIEDRA_S);
    pp([0, 30, 20, 30, 18, 104, 0, 116], PIEDRA);
    // la runa del dios: brilla con la bendición puesta, apagada si ya bendijo hoy
    const col = o.dormido ? "#4E4A46" : o.vivo ? "#FFD98A" : D.col;
    if (o.vivo && !(window.CALIDAD && CALIDAD.nivel === "baja")) E(c, X(1), Y(70), 26 * s, 34 * s, "rgba(255,217,138," + (0.22 + 0.1 * Math.sin(t * 3)) + ")");
    FUTHARK.dibujar(c, D.runa, X(1), Y(46), 46 * s, col, 5 * s);
    // las ofrendas al pie: un cuenco de madera, un cuerno y tres monedas
    pp([-40, 12, -22, 12, -24, 20, -38, 20], "#553A22");
    pp([-31, 12, -22, 12, -24, 20, -31, 20], "#7A5634");
    E(c, X(-31), Y(20), 9 * s, 3 * s, o.dormido ? "#3A2E24" : "#C8402D");
    pp([22, 12, 40, 14, 44, 24, 38, 22, 26, 18], "#E8DCC4");
    pp([40, 14, 44, 24, 46, 22], "#B4A88E");
    for (let k = 0; k < 3; k++) E(c, X(-8 + k * 7), Y(13 + (k % 2) * 2), 3.4 * s, 1.6 * s, "#FFD98A");
    // humo claro cuando está vivo
    if (o.vivo && !(window.CALIDAD && CALIDAD.nivel === "baja"))
      for (let k = 0; k < 3; k++) {
        const u = (t * 0.4 + k / 3) % 1;
        E(c, X(-31 + Math.sin(u * 6 + k) * 6), Y(24 + u * 70), (4 + u * 8) * s, (3 + u * 6) * s, "rgba(242,236,236," + 0.35 * (1 - u) + ")");
      }
  }

  ASSETS.DIOSES = DIOSES;
  Object.assign(ASSETS.LISTA, {
    horgr: { f: horgr, figura: true, alto: 116, choque: { r: 50 }, grupo: "santuarios", ejemplo: { dios: "thor", vivo: true } },
  });
})();
