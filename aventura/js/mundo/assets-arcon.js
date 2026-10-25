// ---------- el arcón de Eromash en el Puesto (asset de ARCON) ----------
// Un arcón grande de roble con dos flejes de hierro, nudos tallados en el frente, la cerradura de bronce con la marca
// del Puesto y una piel doblada encima. o.abierto: la tapa levantada (cuando se mira adentro).
// Se arma con caras (frente, costado en sombra y tapa) para verse de cualquier lado. Mismo estilo: luz de arriba a la
// derecha, la mitad izquierda en sombra, sombra elíptica.
(function () {
  "use strict";
  const { P, E, L, sombra } = DIB;
  const C = ASSETS.C;
  const madera = C.madera || "#7A5634",
    maderaS = C.maderaSombra || "#553A22",
    maderaL = C.maderaLuz || "#9A7650";
  const HIERRO = "#3A3634",
    HIERRO_L = "#5A5450",
    BRONCE = "#C8804A";

  function arconPuesto(c, x, y, t, o) {
    const s = o.s || 1,
      X = (v) => x + v * s,
      Y = (v) => y - v * s,
      pp = (a, col) => P(c, a.map((v, i) => (i % 2 ? Y(v) : X(v))), col);
    sombra(c, X(4), y + 4 * s, 62 * s, 14 * s, 0.34);
    // el cuerpo: frente iluminado y costado izquierdo en sombra
    pp([-58, 0, -48, -8, -48, 44, -58, 50], maderaS);
    pp([-48, -8, 52, -8, 52, 44, -48, 44], madera);
    pp([2, -8, 52, -8, 52, 44, 2, 44], maderaL);
    // los nudos tallados del frente (dos lazos entrelazados)
    c.strokeStyle = maderaS;
    c.lineWidth = 2.4 * s;
    [[-22, 18], [26, 18]].forEach(([dx, dy]) => {
      c.beginPath();
      c.ellipse(X(dx), Y(dy), 12 * s, 8 * s, 0.5, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.ellipse(X(dx), Y(dy), 12 * s, 8 * s, -0.5, 0, Math.PI * 2);
      c.stroke();
    });
    // los flejes de hierro
    pp([-40, -8, -32, -8, -32, 44, -40, 44], HIERRO);
    pp([36, -8, 44, -8, 44, 44, 36, 44], HIERRO_L);
    // la tapa: cerrada (un prisma bajo) o levantada hacia atrás
    if (o.abierto) {
      pp([-58, 50, -48, 44, 52, 44, 44, 92, -50, 92], "#2A1E14");
      pp([-48, 44, 52, 44, 46, 96, -42, 96], maderaS);
      pp([-40, 44, -32, 44, -34, 96, -42, 96], HIERRO);
      // un brillo dorado adentro
      E(c, X(2), Y(46), 30 * s, 5 * s, "rgba(255,217,138,0.55)");
    } else {
      pp([-58, 50, -48, 44, 52, 44, 44, 56, -50, 60], maderaS);
      pp([-48, 44, 52, 44, 52, 58, -48, 58], maderaL);
      pp([-50, 58, 52, 58, 44, 64, -56, 64], madera);
      // la piel doblada encima
      pp([-30, 64, 20, 64, 24, 72, -26, 72], "#6E4A32");
      pp([-4, 64, 20, 64, 24, 72, -4, 72], "#8A6040");
    }
    // la cerradura con la marca del Puesto (un rombo)
    pp([-8, 30, 8, 30, 8, 44, -8, 44], BRONCE);
    pp([0, 33, 4, 37, 0, 41, -4, 37], "#5E130D");
    L(c, X(-58), Y(0), X(52), Y(0), maderaS, 1.5 * s);
  }

  Object.assign(ASSETS.LISTA, {
    arconPuesto: { f: arconPuesto, figura: true, alto: 96, choque: { r: 46 }, grupo: "puesto" },
  });
})();
