// ---------- los instructores y el muñeco de práctica (assets de INSTRUCTORES) ----------
// El muñeco de práctica de Hallbera en el patio del Puesto: un poste de fresno clavado en una base de tablas, el cuerpo
// de paja atado con sogas, un escudo viejo clavado y un brazo de palo que gira cuando Hallbera lo pone a pegar. Se
// sacude con cada golpe (o.herido) y el brazo apunta a o.brazo (radianes, 0 = quieto). Mismo estilo de siempre: caras
// planas, luz de arriba a la derecha, la mitad izquierda en sombra, sombra elíptica en el piso.
(function () {
  "use strict";
  const { P, E, L, sombra } = DIB;
  const C = ASSETS.C;
  const madera = C.madera || "#7A5634",
    maderaS = C.maderaSombra || "#553A22",
    maderaL = C.maderaLuz || "#9A7650";
  const PAJA = "#D8B868",
    PAJA_S = "#B0904A";

  function munecoPractica(c, x, y, t, o) {
    const s = o.s || 1,
      h = o.herido || 0,
      // se sacude de costado con cada golpe y vuelve solo
      tumbo = Math.sin((t || 0) * 30) * h * 6,
      X = (v, alto) => x + v * s + tumbo * (alto || 0) / 120,
      Y = (v) => y - v * s,
      pp = (a, col) => P(c, a.map((v, i) => (i % 2 ? Y(v) : X(v, a[i + 1] || 0))), col);
    sombra(c, x, y + 3 * s, 46 * s, 12 * s, 0.34);
    // la base de tablas cruzadas
    pp([-34, 0, 34, 0, 30, 10, -30, 10], maderaS);
    pp([0, 0, 34, 0, 30, 10, 0, 10], madera);
    pp([-8, -6, 8, -6, 8, 14, -8, 14], maderaS);
    // el poste
    pp([-5, 8, -5, 150, 5, 150, 5, 8], madera);
    pp([-5, 8, -5, 150, 0, 150, 0, 8], maderaS);
    // el cuerpo de paja
    pp([-26, 52, -30, 92, -24, 118, 24, 118, 30, 92, 26, 52], PAJA);
    pp([-26, 52, -30, 92, -24, 118, 0, 118, 0, 52], PAJA_S);
    // las sogas
    [62, 86, 110].forEach((v) => pp([-29, v - 2, 29, v - 2, 29, v + 2, -29, v + 2], "#7A5634"));
    // la cabeza: una bolsa atada con una cara cosida
    pp([-16, 120, -18, 140, -10, 156, 10, 156, 18, 140, 16, 120], "#C8B48C");
    pp([-16, 120, -18, 140, -10, 156, 0, 156, 0, 120], "#A8946C");
    L(c, X(-8, 140), Y(142), X(-3, 140), Y(137), "#3A2A1E", 1.8 * s);
    L(c, X(-8, 140), Y(137), X(-3, 140), Y(142), "#3A2A1E", 1.8 * s);
    L(c, X(4, 140), Y(142), X(9, 140), Y(137), "#3A2A1E", 1.8 * s);
    L(c, X(4, 140), Y(137), X(9, 140), Y(142), "#3A2A1E", 1.8 * s);
    pp([-6, 128, 6, 128, 6, 130, -6, 130], "#3A2A1E");
    // el escudo viejo clavado del lado izquierdo (rojo gastado con el umbo de hierro)
    E(c, X(-30, 90), Y(88), 17 * s, 21 * s, "#5E130D");
    E(c, X(-28, 90), Y(88), 14 * s, 18 * s, "#9C2315");
    E(c, X(-28, 90), Y(88), 4.5 * s, 4.5 * s, "#6E6A66");
    // el brazo de palo que gira: travesaño con una bolsa de arena en la punta
    const a = o.brazo || 0,
      bx = Math.cos(a) * 52,
      by = Math.sin(a) * 18;
    L(c, X(0, 104), Y(104), X(bx, 104), Y(104) + by * s, maderaL, 5 * s);
    E(c, X(bx, 104), Y(104) + by * s, 8 * s, 7 * s, "#8A7A5A");
    // la estaca del medio
    E(c, X(0, 104), Y(104), 4 * s, 4 * s, "#3A3634");
  }

  Object.assign(ASSETS.LISTA, {
    munecoPractica: { f: munecoPractica, figura: true, alto: 156, choque: { r: 18 }, grupo: "instructores" },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, {
    munecoPractica: { brazo: 0.6 },
  });
})();
