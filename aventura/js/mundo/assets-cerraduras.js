// ---------- el cofre con candado (asset de CERRADURAS) ----------
// Un cofre de viaje de tablas gruesas con tres flejes de hierro remachados y un candado colgando de la aldaba. El
// candado dice qué tan difícil es: bronce (novato), hierro (aprendiz), plata (experto) o el de runas (maestro), que
// tiene una runa Isa tallada y brilla apenas. o.nivel: 0..3; o.abierto: la tapa levantada y el candado tirado al pie.
// Se arma con caras (frente, costado izquierdo en sombra, tapa) para verse de cualquier lado. Mismo estilo que la
// arena: luz de arriba a la derecha, la mitad izquierda en sombra, sombra elíptica.
(function () {
  "use strict";
  const { P, E, sombra } = DIB;
  const C = ASSETS.C;
  const madera = C.madera || "#7A5634",
    maderaS = C.maderaSombra || "#553A22",
    maderaL = C.maderaLuz || "#9A7650";
  const HIERRO = "#3A3634",
    HIERRO_L = "#5A5450";
  // el color del candado de cada nivel: [cuerpo, luz]
  const CANDADO = [
    ["#9A5A2A", "#C8804A"],
    ["#6E6A66", "#8E8A86"],
    ["#B4B0AA", "#F2ECEC"],
    ["#2A4E52", "#73D5DB"],
  ];

  function cofreCandado(c, x, y, t, o) {
    const s = o.s || 1,
      n = Math.max(0, Math.min(3, o.nivel || 0)),
      X = (v) => x + v * s,
      Y = (v) => y - v * s,
      pp = (a, col) => P(c, a.map((v, i) => (i % 2 ? Y(v) : X(v))), col);
    sombra(c, X(4), y + 4 * s, 52 * s, 12 * s, 0.34);
    // el cuerpo: frente con luz a la derecha y costado izquierdo en sombra
    pp([-48, 0, -40, -6, -40, 34, -48, 40], maderaS);
    pp([-40, -6, 44, -6, 44, 34, -40, 34], madera);
    pp([2, -6, 44, -6, 44, 34, 2, 34], maderaL);
    // las tablas
    [[-40, 8], [-40, 21]].forEach(([a, b]) => pp([a, b, 44, b, 44, b + 1.5, a, b + 1.5], maderaS));
    // los tres flejes con remaches
    [-30, 2, 32].forEach((fx, i) => {
      pp([fx - 4, -6, fx + 4, -6, fx + 4, 34, fx - 4, 34], i === 0 ? HIERRO : HIERRO_L);
      [2, 26].forEach((ry) => E(c, X(fx), Y(ry), 1.6 * s, 1.6 * s, "#8E8A86"));
    });
    // la tapa
    if (o.abierto) {
      pp([-48, 40, -40, 34, 44, 34, 38, 76, -44, 76], "#2A1E14");
      pp([-40, 34, 44, 34, 40, 80, -36, 80], maderaS);
      [-30, 2, 32].forEach((fx) => pp([fx - 4, 34, fx + 4, 34, fx + 3, 80, fx - 3, 80], HIERRO));
      E(c, X(2), Y(36), 26 * s, 4 * s, "rgba(255,217,138,0.5)");
      // el candado tirado al pie, abierto
      pp([30, -2, 44, -2, 44, 8, 30, 8], CANDADO[n][0]);
      pp([37, -2, 44, -2, 44, 8, 37, 8], CANDADO[n][1]);
      c.strokeStyle = CANDADO[n][1];
      c.lineWidth = 2.4 * s;
      c.beginPath();
      c.arc(X(46), Y(6), 5 * s, Math.PI * 0.6, Math.PI * 1.8);
      c.stroke();
    } else {
      pp([-48, 40, -40, 34, 44, 34, 40, 44, -44, 50], maderaS);
      pp([-40, 34, 44, 34, 44, 46, -40, 46], maderaL);
      pp([-44, 46, 44, 46, 38, 52, -50, 52], madera);
      [-30, 2, 32].forEach((fx, i) => pp([fx - 4, 34, fx + 4, 34, fx + 4, 46, fx - 4, 46], i === 0 ? HIERRO : HIERRO_L));
      // la aldaba y el candado colgando
      pp([-3, 36, 3, 36, 3, 22, -3, 22], HIERRO_L);
      c.strokeStyle = CANDADO[n][1];
      c.lineWidth = 2.6 * s;
      c.beginPath();
      c.arc(X(0), Y(20), 5.5 * s, Math.PI, Math.PI * 2);
      c.stroke();
      pp([-8, 20, 8, 20, 8, 4, -8, 4], CANDADO[n][0]);
      pp([0, 20, 8, 20, 8, 4, 0, 4], CANDADO[n][1]);
      pp([-1.5, 14, 1.5, 14, 1.5, 8, -1.5, 8], "#111111");
      if (n === 3) {
        FUTHARK.dibujar(c, "isa", X(-4.5), Y(6), 12 * s, "#73D5DB", 1.6 * s);
        if (!(window.CALIDAD && CALIDAD.nivel === "baja")) E(c, X(0), Y(12), 12 * s, 12 * s, "rgba(115,213,219," + (0.12 + 0.08 * Math.sin(t * 2.5)) + ")");
      }
    }
  }

  ASSETS.CANDADO = CANDADO;
  Object.assign(ASSETS.LISTA, {
    cofreCandado: { f: cofreCandado, figura: true, alto: 60, choque: { r: 40 }, grupo: "cerraduras", ejemplo: { nivel: 3 } },
  });
})();
