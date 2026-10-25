// ---------- la tina de tintes del Puesto (asset de TINTES) ----------
// Una tina de duelas con aros de hierro y el agua teñida, un palo de revolver apoyado, un bastidor con tres paños
// colgados secándose (rojo, azul y verde) y frascos de polvo de color al pie. o.color: el color del agua (el último
// tinte que se usó). Caras planas, luz de arriba a la derecha, mitad izquierda en sombra, sombra elíptica.
(function () {
  "use strict";
  const { P, E, L, sombra } = DIB;
  const C = ASSETS.C;
  const madera = C.madera || "#7A5634",
    maderaS = C.maderaSombra || "#553A22",
    maderaL = C.maderaLuz || "#9A7650";

  function tinaTintes(c, x, y, t, o) {
    const s = o.s || 1,
      X = (v) => x + v * s,
      Y = (v) => y - v * s,
      pp = (a, col) => P(c, a.map((v, i) => (i % 2 ? Y(v) : X(v))), col);
    sombra(c, X(10), y + 4 * s, 80 * s, 16 * s, 0.32);
    // el bastidor de atrás con los paños
    pp([18, 0, 22, 0, 22, 92, 18, 92], maderaS);
    pp([78, 0, 82, 0, 82, 92, 78, 92], madera);
    pp([16, 88, 84, 88, 84, 94, 16, 94], maderaL);
    const v = Math.sin((t || 0) * 1.8 + (o.sem || 0)) * 2;
    [[26, "#9C2315", "#5E130D"], [46, "#4A78D0", "#2F5FA8"], [64, "#4E7A3A", "#3A5C2C"]].forEach(([dx, col, sc]) => {
      pp([dx, 88, dx + 14, 88, dx + 14 + v, 46, dx + v, 50], col);
      pp([dx, 88, dx + 5, 88, dx + 5 + v, 49, dx + v, 50], sc);
    });
    // la tina: duelas con su sombra a la izquierda, dos aros y el agua del color del último tinte
    pp([-56, 0, -40, -6, -40, 46, -60, 50], maderaS);
    pp([-40, -6, 30, -6, 34, 48, -40, 46], madera);
    pp([-6, -6, 30, -6, 34, 48, -6, 47], maderaL);
    pp([-58, 14, 32, 14, 32, 20, -58, 20], "#3A3634");
    pp([-60, 36, 34, 36, 34, 42, -60, 42], "#5A5450");
    E(c, X(-12), Y(48), 46 * s, 10 * s, maderaS);
    E(c, X(-12), Y(47), 40 * s, 7 * s, o.color || "#9C2315");
    E(c, X(-2), Y(48), 14 * s, 2.5 * s, "rgba(242,236,236,0.35)");
    // el palo de revolver
    L(c, X(-30), Y(44), X(-52), Y(92), madera, 4 * s);
    // los frascos de polvo al pie
    [[-74, "#73D5DB"], [-66, "#9A6BD8"], [42, "#FFD98A"]].forEach(([dx, col]) => {
      pp([dx - 4, 0, dx + 4, 0, dx + 4, 12, dx - 4, 12], col);
      pp([dx - 2, 12, dx + 2, 12, dx + 2, 16, dx - 2, 16], "#C8B48C");
    });
  }

  Object.assign(ASSETS.LISTA, {
    tinaTintes: { f: tinaTintes, figura: true, alto: 96, choque: { r: 50 }, grupo: "puesto" },
  });
})();
