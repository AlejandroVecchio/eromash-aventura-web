// ---------- el campamento de los Sin Linde (assets de BANDIDOS) ----------
// Tres piezas con nombre para cada guarida de bandidos del bosque:
//  · tiendaSinLinde: la tienda de cueros cosidos a dos aguas, con un trapo rojo atado a la cumbrera.
//  · estacaSinLinde: la estaca con la linde partida (el rombo cortado) pintada y trapos colgando: así marcan lo suyo.
//  · botinSinLinde: el botín robado (arcón sin tapa, sacos, un rollo de tela y plata); o.abierto lo deja vacío.
// Caras planas, luz de arriba a la derecha, mitad izquierda en sombra, sombra elíptica.
(function () {
  "use strict";
  const { P, E, R, L, sombra } = DIB;
  const C = ASSETS.C;
  const madera = C.madera || "#7A5634",
    maderaS = C.maderaSombra || "#553A22",
    maderaL = C.maderaLuz || "#9A7650";
  const CUERO = ["#8A6A4A", "#6E5238", "#A8865E"],
    ROJO = ["#9C2315", "#5E130D", "#C8402D"];
  const xy = (x, y, s) => (a) => a.map((v, i) => (i % 2 ? y - v * s : x + v * s));

  function tiendaSinLinde(c, x, y, t, o) {
    const s = o.s || 1,
      q = xy(x, y, s),
      v = (o.v || 0) % 2;
    sombra(c, x + 6 * s, y + 4 * s, 92 * s, 20 * s, 0.36);
    // el fondo adentro, oscuro
    P(c, q([-56, 0, 0, 78, 56, 0]), "#1A1210");
    // los dos faldones: el izquierdo en sombra, el derecho al sol, con remiendos
    P(c, q([-80, 0, -4, 82, -20, 0]), CUERO[1]);
    P(c, q([80, 0, 4, 82, 20, 0]), CUERO[v ? 2 : 0]);
    P(c, q([-60, 12, -40, 34, -30, 22, -48, 6]), CUERO[0]);
    P(c, q([42, 28, 58, 12, 50, 4, 34, 18]), CUERO[1]);
    L(c, x - 52 * s, y - 20 * s, x - 22 * s, y - 52 * s, "#3E2E22", 1.2 * s);
    L(c, x + 26 * s, y - 50 * s, x + 54 * s, y - 22 * s, "#3E2E22", 1.2 * s);
    // la cumbrera y los palos cruzados
    L(c, x - 10 * s, y - 92 * s, x + 6 * s, y - 76 * s, maderaS, 4 * s);
    L(c, x + 10 * s, y - 92 * s, x - 6 * s, y - 76 * s, madera, 4 * s);
    // el trapo rojo de los Sin Linde, flameando
    const fl = Math.sin(t * 3 + x * 0.01) * 4;
    P(c, q([8, 90, 30, 86 + fl * 0.3, 26 + fl, 76, 8, 80]), ROJO[0]);
    P(c, q([8, 90, 18, 88, 16 + fl * 0.5, 78, 8, 80]), ROJO[1]);
    // las estacas de las cuerdas
    [[-84, 2], [84, 2]].forEach(([a, b]) => {
      L(c, x + a * 0.9 * s, y - (b + 4) * s, x + a * s, y - b * s, maderaS, 3 * s);
      L(c, x + a * 0.8 * s, y - 30 * s, x + a * s, y - b * s, "#C8B89A", 0.8 * s);
    });
  }

  function estacaSinLinde(c, x, y, t, o) {
    const s = o.s || 1,
      q = xy(x, y, s);
    sombra(c, x + 3 * s, y + 2 * s, 18 * s, 6 * s, 0.34);
    P(c, q([-5, 0, -5, 112, 0, 120, 0, 0]), maderaS);
    P(c, q([0, 0, 0, 120, 5, 112, 5, 0]), maderaL);
    // la tabla con la linde partida
    P(c, q([-20, 70, -20, 100, 0, 104, 0, 66]), maderaS);
    P(c, q([0, 66, 0, 104, 22, 100, 22, 70]), madera);
    const lx = x + 1 * s,
      ly = y - 85 * s;
    BANDIDOS_DIBUJO.linde(c, lx, ly, 11 * s, ROJO[2]);
    // los trapos colgando, que se mecen
    [[-16, 66, 0], [16, 68, 1.4], [-4, 62, 2.6]].forEach(([a, b, f]) => {
      const m = Math.sin(t * 2.4 + f) * 3;
      P(c, q([a - 3, b, a + 3, b, a + 2 + m, b - 22, a - 2 + m, b - 20]), ROJO[f > 1 && f < 2 ? 2 : 0]);
    });
    // una calavera de lobo clavada arriba
    E(c, x, y - 124 * s, 8 * s, 6 * s, "#E8E0D0");
    P(c, q([-6, 120, 6, 120, 3, 112, -3, 112]), "#C8C0B0");
    R(c, x - 4 * s, y - 126 * s, 2.5 * s, 2.5 * s, "#111111");
    R(c, x + 1.5 * s, y - 126 * s, 2.5 * s, 2.5 * s, "#111111");
  }

  function botinSinLinde(c, x, y, t, o) {
    const s = o.s || 1,
      q = xy(x, y, s);
    sombra(c, x + 4 * s, y + 4 * s, 66 * s, 14 * s, 0.34);
    // los sacos atrás
    E(c, x - 40 * s, y - 20 * s, 18 * s, 20 * s, "#8A7A5A");
    E(c, x - 44 * s, y - 22 * s, 10 * s, 16 * s, "#6E5E44");
    P(c, q([-46, 40, -34, 40, -36, 46, -44, 46]), "#C8402D");
    // el arcón sin tapa
    P(c, q([-24, 0, -18, -4, -18, 32, -24, 36]), maderaS);
    P(c, q([-18, -4, 30, -4, 30, 32, -18, 32]), madera);
    P(c, q([6, -4, 30, -4, 30, 32, 6, 32]), maderaL);
    R(c, x - 18 * s, y - 20 * s, 48 * s, 3 * s, "#3A3634");
    if (!o.abierto) {
      // la plata y las cosas que asoman
      P(c, q([-16, 32, 28, 32, 22, 42, -10, 42]), "#FFD98A");
      E(c, x - 2 * s, y - 40 * s, 10 * s, 4 * s, "#F5A524");
      E(c, x + 14 * s, y - 38 * s, 6 * s, 3 * s, "#F2ECEC");
      L(c, x - 10 * s, y - 34 * s, x + 2 * s, y - 52 * s, "#B8B0A8", 2.4 * s);
      P(c, q([2, 52, 8, 56, 6, 48]), "#8A847E");
      if (!(window.CALIDAD && CALIDAD.nivel === "baja")) E(c, x + 6 * s, y - 38 * s, 26 * s, 8 * s, "rgba(255,217,138," + (0.14 + 0.08 * Math.sin(t * 3)) + ")");
    } else P(c, q([-16, 32, 28, 32, 24, 28, -12, 28]), "#1A1210");
    // el rollo de tela a un costado
    E(c, x + 46 * s, y - 8 * s, 8 * s, 8 * s, ROJO[1]);
    P(c, q([46, 16, 76, 14, 76, -2, 46, 0]), ROJO[0]);
    E(c, x + 76 * s, y - 6 * s, 4 * s, 8 * s, ROJO[2]);
  }

  Object.assign(ASSETS.LISTA, {
    tiendaSinLinde: { f: tiendaSinLinde, figura: true, alto: 96, choque: { w: 150, h: 30 }, grupo: "bandidos" },
    estacaSinLinde: { f: estacaSinLinde, figura: true, alto: 132, choque: { r: 8 }, grupo: "bandidos" },
    botinSinLinde: { f: botinSinLinde, figura: true, alto: 60, choque: { r: 36 }, grupo: "bandidos" },
  });
})();
