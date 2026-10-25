// ---------- el puesto de Kolbrun, la buhonera de Eldrakar (assets de COMERCIO) ----------
// Lo que pone motor/comercio.js junto al Refugio de Hrafngard para que Kolbrun venda en el bosque: la alfombra roja
// con lo que ofrece (amuletos de obsidiana, sal de ceniza, piedras que guardan calor) y el fardo de buhonera (el
// armazón de varas que lleva a la espalda, con los bultos atados y una vara de la que cuelgan amuletos).
// Mismo estilo que el resto: caras planas, luz de arriba a la derecha, la mitad izquierda en sombra, sombra elíptica.
(function () {
  "use strict";
  const { P, E, L, sombra, halo } = DIB;
  const C = ASSETS.C;
  const ORO = "#FFD98A";

  // ---------- la alfombra de Kolbrun ----------
  // Una alfombra de lana roja con la guarda de rombos de Eldrakar, y encima lo que vende ordenado en filas: tres
  // amuletos de obsidiana, los saquitos de sal de ceniza y las piedras que todavía guardan calor (laten naranja).
  function alfombraKolbrun(c, x, y, t, o) {
    const s = o.s || 1,
      X = (v) => x + v * s,
      Y = (v) => y + v * s * 0.5;
    // la alfombra: un rombo aplastado (en el piso)
    P(c, [X(-90), Y(0), X(0), Y(-60), X(90), Y(0), X(0), Y(60)], "#5E130D");
    P(c, [X(-78), Y(0), X(0), Y(-52), X(78), Y(0), X(0), Y(52)], "#9C2315");
    P(c, [X(0), Y(-52), X(78), Y(0), X(0), Y(52)], "#AE2E1E");
    // la guarda de rombos
    for (let i = -3; i <= 3; i++) {
      const cx = i * 18,
        cy = -Math.abs(i) * 0;
      P(c, [X(cx - 5), Y(cy), X(cx), Y(cy - 4), X(cx + 5), Y(cy), X(cx), Y(cy + 4)], "#E0B2B2");
    }
    // los flecos
    for (let i = 0; i < 6; i++) {
      L(c, X(-90 + i * 6), Y(i * 4), X(-96 + i * 6), Y(i * 4 + 6), "#E0B2B2", 1.4 * s);
      L(c, X(90 - i * 6), Y(i * 4), X(96 - i * 6), Y(i * 4 + 6), "#E0B2B2", 1.4 * s);
    }
    // los amuletos de obsidiana
    [[-44, -16], [-30, -26], [-16, -34]].forEach(([ax, ay]) => {
      P(c, [X(ax - 5), Y(ay), X(ax), Y(ay - 10), X(ax + 5), Y(ay), X(ax), Y(ay + 10)], "#1E1A1A");
      P(c, [X(ax), Y(ay - 10), X(ax + 5), Y(ay), X(ax), Y(ay + 10)], "#3A3434");
    });
    // los saquitos de sal
    [[10, -30], [24, -22]].forEach(([ax, ay]) => {
      E(c, X(ax), Y(ay), 7 * s, 6 * s, "#C8B48C");
      E(c, X(ax + 2), Y(ay - 2), 4 * s, 3 * s, "#E0D4C0");
      L(c, X(ax - 3), Y(ay - 10), X(ax + 3), Y(ay - 10), "#5E3A1E", 2 * s);
    });
    // las piedras que guardan calor
    const late = 0.5 + 0.5 * Math.sin((t || 0) * 2.4);
    [[-6, 18], [12, 26], [30, 12]].forEach(([ax, ay], i) => {
      E(c, X(ax), Y(ay), 7 * s, 5 * s, "#4A3A32");
      E(c, X(ax + 1), Y(ay - 1), 4 * s, 3 * s, i === 1 && late > 0.6 ? ORO : "#FF8D71");
    });
  }

  // ---------- el fardo de buhonera ----------
  // El armazón de varas de fresno que Kolbrun carga a la espalda, parado sobre sus dos patas: bultos de lona atados
  // con soga, una olla colgada y, arriba, una vara cruzada de la que cuelgan amuletos que se mecen.
  function fardoKolbrun(c, x, y, t, o) {
    const s = o.s || 1,
      X = (v) => x + v * s,
      Y = (v) => y - v * s,
      pp = (a, col) => P(c, a.map((v, i) => (i % 2 ? Y(v) : X(v))), col);
    sombra(c, X(6), y + 3 * s, 40 * s, 10 * s, 0.34);
    // las patas del armazón
    L(c, X(-22), Y(0), X(-16), Y(120), C.maderaSombra || "#553A22", 5 * s);
    L(c, X(22), Y(0), X(16), Y(120), C.madera || "#7A5634", 5 * s);
    L(c, X(-20), Y(40), X(20), Y(40), C.madera || "#7A5634", 4 * s);
    // los bultos
    pp([-26, 44, -28, 80, -6, 86, 4, 78, 2, 44], "#8A7A5A");
    pp([-6, 86, 4, 78, 2, 44, -6, 44], "#6E6248");
    pp([-2, 50, 0, 92, 24, 96, 30, 84, 28, 50], "#B8A47A");
    pp([24, 96, 30, 84, 28, 50, 18, 50], "#C8B48C");
    pp([-20, 88, -18, 112, 14, 116, 20, 104, 16, 88], "#9C2315");
    pp([14, 116, 20, 104, 16, 88, 8, 90], "#C8402D");
    // la soga
    L(c, X(-28), Y(64), X(30), Y(70), "#E0D4C0", 2 * s);
    L(c, X(-20), Y(100), X(20), Y(104), "#E0D4C0", 2 * s);
    // la olla colgada
    E(c, X(-30), Y(30), 9 * s, 8 * s, "#3A3634");
    E(c, X(-27), Y(33), 4 * s, 3 * s, "#5A5458");
    L(c, X(-30), Y(38), X(-22), Y(44), "#3A3634", 1.6 * s);
    // la vara de los amuletos
    L(c, X(-36), Y(124), X(38), Y(130), C.madera || "#7A5634", 4 * s);
    const mece = Math.sin((t || 0) * 1.8 + (o.sem || 0)) * 3;
    [[-28, "#1E1A1A"], [-10, ORO], [8, "#73D5DB"], [26, "#1E1A1A"]].forEach(([ax, col], i) => {
      const ay = 126 + i * 1.5,
        dx = mece * (i % 2 ? 1 : -1);
      L(c, X(ax), Y(ay), X(ax + dx), Y(ay - 14), "#C8B48C", 1.2 * s);
      pp([ax + dx - 4, ay - 14, ax + dx, ay - 10, ax + dx + 4, ay - 14, ax + dx, ay - 22], col);
    });
    if (o.luz !== false) halo(c, X(8), Y(110), 30 * s, "#73D5DB", 0.15);
  }

  Object.assign(ASSETS.LISTA, {
    alfombraKolbrun: { f: alfombraKolbrun, piso: true, alto: 10, choque: null, grupo: "comercio" },
    fardoKolbrun: { f: fardoKolbrun, figura: true, alto: 140, choque: { r: 20 }, grupo: "comercio" },
  });
})();
