// ---------- las hierbas de Eldervald y la mesa de alquimia (assets de ALQUIMIA) ----------
// Seis plantas que se juntan con E, cada una con su forma para reconocerla de lejos: el musgo de linde (almohadón verde
// sobre una piedra), el serbal (mata con racimos rojos), la raíz de abedul (raíz blanca que asoma con dos hojas), la
// flor de escarcha (estrella celeste, junto al agua), el hongo de luna (sombrero que alumbra de noche) y el cardo de
// los túmulos (cabeza violeta con espinas). o.cosechada: ya se juntó (queda el tallo cortado hasta que vuelve).
// La mesa de alquimia del Puesto: tablón con el alambique de cobre, frascos, el mortero y el brasero chico.
// Mismo estilo de siempre: caras planas, luz de arriba a la derecha, la mitad izquierda en sombra, sombra elíptica.
(function () {
  "use strict";
  const { P, E, L, sombra, halo } = DIB;
  const C = ASSETS.C;
  const madera = C.madera || "#7A5634",
    maderaS = C.maderaSombra || "#553A22",
    maderaL = C.maderaLuz || "#9A7650";
  const HOJA = "#4E7A3A",
    HOJA_S = "#3A5C2C",
    HOJA_L = "#6E9A4E";

  // un tallo cortado: lo que queda mientras la planta vuelve
  function cortado(c, x, y, s) {
    sombra(c, x, y + 2 * s, 12 * s, 4 * s, 0.25);
    P(c, [x - 6 * s, y, x - 3 * s, y - 6 * s, x, y - 2 * s, x + 3 * s, y - 7 * s, x + 6 * s, y], HOJA_S);
  }
  function mecer(t, o) {
    return Math.sin((t || 0) * 1.6 + (o.sem || 0)) * 1.5;
  }

  function hierbaMusgo(c, x, y, t, o) {
    const s = o.s || 1;
    if (o.cosechada) return cortado(c, x, y, s);
    sombra(c, x, y + 3 * s, 26 * s, 7 * s, 0.3);
    // la piedra
    P(c, [x - 22 * s, y, x - 18 * s, y - 14 * s, x + 4 * s, y - 20 * s, x + 22 * s, y - 10 * s, x + 20 * s, y], "#6E6A66");
    P(c, [x + 4 * s, y - 20 * s, x + 22 * s, y - 10 * s, x + 20 * s, y, x + 2 * s, y], "#8E8A86");
    // el almohadón de musgo encima, con motas claras
    P(c, [x - 18 * s, y - 12 * s, x - 10 * s, y - 24 * s, x + 6 * s, y - 27 * s, x + 18 * s, y - 16 * s, x + 6 * s, y - 14 * s], HOJA);
    P(c, [x + 6 * s, y - 27 * s, x + 18 * s, y - 16 * s, x + 6 * s, y - 14 * s, x - 2 * s, y - 20 * s], HOJA_L);
    [[-8, -20], [4, -22], [10, -18]].forEach(([dx, dy]) => E(c, x + dx * s, y + dy * s, 1.8 * s, 1.4 * s, "#A8C878"));
  }
  function hierbaSerbal(c, x, y, t, o) {
    const s = o.s || 1,
      m = mecer(t, o);
    if (o.cosechada) return cortado(c, x, y, s);
    sombra(c, x, y + 3 * s, 24 * s, 7 * s, 0.3);
    // la mata de hojas en abanico
    for (let k = -2; k <= 2; k++) {
      const a = k * 0.42,
        px = x + Math.sin(a) * 30 * s + m * (k + 3) * 0.3,
        py = y - Math.cos(a) * 30 * s;
      P(c, [x + k * 3 * s, y, px - 5 * s, py + 6 * s, px, py - 4 * s, px + 5 * s, py + 6 * s], k < 0 ? HOJA_S : HOJA);
    }
    // los racimos rojos
    [[-12, -24], [8, -28], [0, -16], [14, -18]].forEach(([dx, dy]) => {
      E(c, x + (dx + m * 0.5) * s, y + dy * s, 3.4 * s, 3.4 * s, "#9C2315");
      E(c, x + (dx + 3 + m * 0.5) * s, y + (dy + 2) * s, 3 * s, 3 * s, "#C8402D");
      E(c, x + (dx + 1 + m * 0.5) * s, y + (dy - 3) * s, 2.6 * s, 2.6 * s, "#C8402D");
    });
  }
  function hierbaAbedul(c, x, y, t, o) {
    const s = o.s || 1,
      m = mecer(t, o);
    if (o.cosechada) return cortado(c, x, y, s);
    sombra(c, x, y + 3 * s, 20 * s, 6 * s, 0.3);
    // el montículo de tierra y la raíz blanca con sus rayas negras
    P(c, [x - 18 * s, y, x - 8 * s, y - 8 * s, x + 10 * s, y - 8 * s, x + 18 * s, y], "#5E4430");
    P(c, [x - 12 * s, y - 2 * s, x - 6 * s, y - 16 * s, x + 2 * s, y - 20 * s, x + 6 * s, y - 14 * s, x + 2 * s, y - 2 * s], "#E8E4DC");
    P(c, [x - 2 * s, y - 2 * s, x + 2 * s, y - 20 * s, x + 6 * s, y - 14 * s, x + 2 * s, y - 2 * s], "#F2ECEC");
    L(c, x - 6 * s, y - 10 * s, x - 1 * s, y - 10 * s, "#2A2420", 1.6 * s);
    L(c, x - 3 * s, y - 15 * s, x + 2 * s, y - 15 * s, "#2A2420", 1.6 * s);
    // dos hojas dentadas
    P(c, [x + 2 * s, y - 20 * s, x - 10 * s + m, y - 34 * s, x - 2 * s + m, y - 30 * s], HOJA);
    P(c, [x + 2 * s, y - 20 * s, x + 14 * s + m, y - 36 * s, x + 6 * s + m, y - 28 * s], HOJA_L);
  }
  function hierbaEscarcha(c, x, y, t, o) {
    const s = o.s || 1,
      m = mecer(t, o);
    if (o.cosechada) return cortado(c, x, y, s);
    sombra(c, x, y + 3 * s, 16 * s, 5 * s, 0.3);
    L(c, x, y, x + m, y - 26 * s, HOJA_S, 2 * s);
    P(c, [x, y - 6 * s, x - 10 * s, y - 14 * s, x - 2 * s, y - 12 * s], HOJA);
    // la estrella de seis puntas celeste con el centro blanco
    const fx = x + m,
      fy = y - 30 * s;
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3 + 0.2;
      P(c, [fx, fy, fx + Math.cos(a - 0.25) * 6 * s, fy + Math.sin(a - 0.25) * 6 * s * 0.8, fx + Math.cos(a) * 12 * s, fy + Math.sin(a) * 12 * s * 0.8, fx + Math.cos(a + 0.25) * 6 * s, fy + Math.sin(a + 0.25) * 6 * s * 0.8], k < 3 ? "#C8F2F4" : "#8CC8D8");
    }
    E(c, fx, fy, 3 * s, 3 * s, "#F2ECEC");
  }
  function hierbaLuna(c, x, y, t, o) {
    const s = o.s || 1;
    if (o.cosechada) return cortado(c, x, y, s);
    if (o.noche) halo(c, x, y - 14 * s, 40 * s, "#73D5DB", 0.35 + Math.sin((t || 0) * 2 + (o.sem || 0)) * 0.1);
    sombra(c, x, y + 3 * s, 18 * s, 5 * s, 0.3);
    // tres hongos de pie blanco y sombrero azul pálido con puntos que alumbran
    [[-8, 0, 0.8], [6, 2, 1], [0, -4, 0.6]].forEach(([dx, dy, k]) => {
      const hx = x + dx * s,
        hy = y + dy * s;
      P(c, [hx - 2.5 * s * k, hy, hx - 2 * s * k, hy - 14 * s * k, hx + 2 * s * k, hy - 14 * s * k, hx + 2.5 * s * k, hy], "#E8E4DC");
      P(c, [hx - 11 * s * k, hy - 12 * s * k, hx, hy - 22 * s * k, hx + 11 * s * k, hy - 12 * s * k], "#5E8EA8");
      P(c, [hx, hy - 22 * s * k, hx + 11 * s * k, hy - 12 * s * k, hx, hy - 12 * s * k], "#7EB0C8");
      E(c, hx - 3 * s * k, hy - 15 * s * k, 1.4 * s, 1.4 * s, "#C8F2F4");
      E(c, hx + 4 * s * k, hy - 14 * s * k, 1.2 * s, 1.2 * s, "#C8F2F4");
    });
  }
  function hierbaCardo(c, x, y, t, o) {
    const s = o.s || 1,
      m = mecer(t, o);
    if (o.cosechada) return cortado(c, x, y, s);
    sombra(c, x, y + 3 * s, 18 * s, 5 * s, 0.3);
    L(c, x, y, x + m, y - 30 * s, HOJA_S, 2.4 * s);
    // las hojas espinosas
    P(c, [x, y - 8 * s, x - 14 * s, y - 16 * s, x - 9 * s, y - 12 * s, x - 13 * s, y - 8 * s], HOJA_S);
    P(c, [x, y - 14 * s, x + 14 * s, y - 22 * s, x + 9 * s, y - 18 * s, x + 13 * s, y - 14 * s], HOJA);
    // la cabeza: copa verde con el penacho violeta (el color de las ataduras)
    const hx = x + m,
      hy = y - 32 * s;
    P(c, [hx - 7 * s, hy, hx - 5 * s, hy + 8 * s, hx + 5 * s, hy + 8 * s, hx + 7 * s, hy], HOJA);
    for (let k = -3; k <= 3; k++) L(c, hx + k * 1.8 * s, hy, hx + k * 3.2 * s, hy - 12 * s, k < 0 ? "#6A4A9A" : "#9A6BD8", 2.2 * s);
  }

  // ---------- la mesa de alquimia ----------
  function mesaAlquimia(c, x, y, t, o) {
    const s = o.s || 1,
      X = (v) => x + v * s,
      Y = (v) => y - v * s,
      pp = (a, col) => P(c, a.map((v, i) => (i % 2 ? Y(v) : X(v))), col);
    sombra(c, X(4), y + 4 * s, 70 * s, 14 * s, 0.34);
    // las patas y el tablón
    pp([-58, 0, -52, 0, -52, 40, -58, 40], maderaS);
    pp([52, 0, 58, 0, 58, 40, 52, 40], madera);
    pp([-64, 40, 64, 40, 64, 50, -64, 50], madera);
    pp([-64, 40, 0, 40, 0, 50, -64, 50], maderaS);
    pp([-64, 50, 64, 50, 58, 56, -58, 56], maderaL);
    // el brasero chico con su llama
    pp([-44, 56, -26, 56, -28, 66, -42, 66], "#3A3634");
    const fl = Math.sin((t || 0) * 9 + (o.sem || 0)) * 2;
    pp([-40, 66, -35, 78 + fl, -30, 66], "#C8402D");
    pp([-37, 66, -35, 73 + fl, -33, 66], "#FF8D71");
    // el alambique de cobre: la panza, el cuello y el caño que baja a un frasco
    E(c, X(-35), Y(80), 13 * s, 11 * s, "#A8622E");
    E(c, X(-32), Y(82), 9 * s, 8 * s, "#C8804A");
    pp([-38, 90, -32, 90, -32, 104, -38, 104], "#A8622E");
    L(c, X(-35), Y(104), X(-6), Y(96), "#A8622E", 3 * s);
    L(c, X(-6), Y(96), X(-4), Y(74), "#A8622E", 2.4 * s);
    // el frasco que recibe (verde, con lo destilado)
    pp([-10, 56, 2, 56, 3, 70, -11, 70], "#4E7A3A");
    pp([-4, 56, 2, 56, 3, 70, -4, 70], "#7BC86C");
    pp([-7, 70, -1, 70, -1, 76, -7, 76], "#C8C0B0");
    // frascos de colores
    [[14, "#9C2315", 16], [24, "#73D5DB", 12], [34, "#9A6BD8", 18]].forEach(([dx, col, h]) => {
      pp([dx - 4, 56, dx + 4, 56, dx + 4, 56 + h, dx - 4, 56 + h], col);
      pp([dx - 2, 56 + h, dx + 2, 56 + h, dx + 2, 60 + h, dx - 2, 60 + h], "#C8B48C");
    });
    // el mortero de piedra con su mano
    pp([42, 56, 58, 56, 56, 66, 44, 66], "#6E6A66");
    pp([50, 56, 58, 56, 56, 66, 50, 66], "#8E8A86");
    L(c, X(50), Y(64), X(58), Y(76), "#C8C0B0", 3 * s);
    // un manojo de hierbas colgando del borde
    L(c, X(-58), Y(50), X(-60), Y(30), "#4E7A3A", 2 * s);
    L(c, X(-55), Y(50), X(-54), Y(32), "#9A6BD8", 2 * s);
    L(c, X(-52), Y(50), X(-49), Y(34), "#9C2315", 2 * s);
  }

  Object.assign(ASSETS.LISTA, {
    hierbaMusgo: { f: hierbaMusgo, figura: true, alto: 28, choque: null, grupo: "hierbas" },
    hierbaSerbal: { f: hierbaSerbal, figura: true, alto: 36, choque: null, grupo: "hierbas" },
    hierbaAbedul: { f: hierbaAbedul, figura: true, alto: 36, choque: null, grupo: "hierbas" },
    hierbaEscarcha: { f: hierbaEscarcha, figura: true, alto: 42, choque: null, grupo: "hierbas" },
    hierbaLuna: { f: hierbaLuna, figura: true, alto: 24, choque: null, grupo: "hierbas", luz: true },
    hierbaCardo: { f: hierbaCardo, figura: true, alto: 44, choque: null, grupo: "hierbas" },
    mesaAlquimia: { f: mesaAlquimia, figura: true, alto: 104, choque: { r: 40 }, grupo: "hierbas", luz: true },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, {
    hierbaLuna: { noche: true },
  });
})();
