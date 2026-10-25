// ---------- los hogares de los vættir (assets de VAETTIR) ----------
// Seis lugares chicos del bosque donde vive un espíritu de la tierra, cada uno con su forma y su nombre:
//  · manantialVaettr: el manantial de Brunna, un ojo de agua entre piedras con musgo, un cuenco de madera y un poste
//    con Laguz.
//  · toconVaettr: el tocón de la puertita, un tocón ancho de roble viejo con una puerta redonda, un escalón y hongos.
//  · piedraHoradada: una piedra alta con un agujero redondo de lado a lado, liquen y una pila de piedritas al pie.
//  · tumuloChico: un túmulo enano de pasto con una losa de entrada y una piedrita con Eihwaz.
//  · rocaLiquenes: una roca chata y ancha con manchas de liquen naranja y un hueco tallado con ceniza fría.
//  · huecoBuho: un fresno seco, partido arriba, con un hueco en el tronco (de noche brillan dos ojos).
//  · vaettrFigura: el vættr mismo cuando se muestra (o.tipo elige su color, o.a lo hace aparecer).
// Caras planas, luz de arriba a la derecha, la mitad izquierda en sombra, sombra elíptica.
(function () {
  "use strict";
  const { P, E, R, L, sombra, alfa } = DIB;
  const MUSGO = "#5E7A3E",
    MUSGO_S = "#44602E",
    MUSGO_L = "#7E9A56",
    PIEDRA = "#8E8A86",
    PIEDRA_S = "#6A6662",
    PIEDRA_L = "#B0ACA6",
    MADERA = "#7A5634",
    MADERA_S = "#553A22",
    MADERA_L = "#9A7650";
  const xy = (x, y, s) => (a) => a.map((v, i) => (i % 2 ? y - v * s : x + v * s));
  const noche = () => (window.JUEGO && JUEGO.A && JUEGO.A.noche ? JUEGO.A.noche() : 0);
  // una piedra baja de tres caras (sombra, frente, luz arriba)
  function piedra(c, q, w, h) {
    P(c, q([-w, 0, -w * 0.8, h * 0.8, 0, h, 0, 0]), PIEDRA_S);
    P(c, q([0, 0, 0, h, w * 0.8, h * 0.8, w, 0]), PIEDRA);
    P(c, q([-w * 0.5, h * 0.9, 0, h, w * 0.6, h * 0.86, 0, h * 0.7]), PIEDRA_L);
  }
  const en = (q, dx, dy) => (a) => q(a.map((v, i) => v + (i % 2 ? dy : dx)));

  function manantialVaettr(c, x, y, t, o) {
    const s = o.s || 1,
      q = xy(x, y, s);
    sombra(c, x + 4 * s, y + 4 * s, 86 * s, 22 * s, 0.3);
    // el ojo de agua, con un brillo que tiembla
    E(c, x, y - 2 * s, 56 * s, 18 * s, "#3E6A86");
    E(c, x + 6 * s, y - 4 * s, 44 * s, 13 * s, "#5A8CA8");
    alfa(c, 0.5 + 0.2 * Math.sin(t * 2), () => E(c, x + 14 * s + Math.sin(t * 1.3) * 4 * s, y - 6 * s, 14 * s, 3 * s, "#C8F2F4"));
    // la ronda de piedras con musgo
    [[-62, 2, 16, 18], [-30, 16, 12, 14], [34, 14, 14, 16], [64, 0, 18, 20], [-50, -14, 14, 12], [40, -16, 16, 12]].forEach(([dx, dy, w, h]) => {
      piedra(c, en(q, dx, dy), w, h);
      P(c, en(q, dx, dy)([-w * 0.6, h * 0.86, 0, h, w * 0.5, h * 0.9, 0, h * 0.7]), MUSGO);
    });
    // el poste con Laguz y el cuenco de las ofrendas
    P(c, q([-80, 0, -80, 64, -74, 68, -74, 0]), MADERA_S);
    P(c, q([-74, 0, -74, 68, -68, 64, -68, 0]), MADERA);
    FUTHARK.dibujar(c, "laguz", x - 74 * s, y - 46 * s, 16 * s, "#73D5DB", 1.6 * s);
    E(c, x + 64 * s, y - 22 * s, 10 * s, 4 * s, MADERA);
    P(c, [x + 54 * s, y - 22 * s, x + 74 * s, y - 22 * s, x + 70 * s, y - 16 * s, x + 58 * s, y - 16 * s], MADERA_S);
  }

  function toconVaettr(c, x, y, t, o) {
    const s = o.s || 1,
      q = xy(x, y, s);
    sombra(c, x + 4 * s, y + 3 * s, 60 * s, 14 * s, 0.38);
    // raíces que se abren
    P(c, q([-60, 0, -40, 14, -28, 0]), MADERA_S);
    P(c, q([60, 0, 40, 16, 28, 0]), MADERA);
    // el tronco ancho
    P(c, q([-44, 0, -42, 58, 0, 64, 0, 0]), MADERA_S);
    P(c, q([0, 0, 0, 64, 42, 58, 44, 0]), MADERA);
    // la cara cortada de arriba, con sus anillos
    E(c, x, y - 61 * s, 43 * s, 10 * s, MADERA_L);
    E(c, x, y - 61 * s, 28 * s, 6 * s, "#B89A6E");
    E(c, x, y - 61 * s, 12 * s, 3 * s, MADERA_L);
    // musgo en el borde
    P(c, q([-44, 40, -42, 58, -20, 63, -24, 50]), MUSGO);
    // la puertita redonda con su escalón y la manija
    P(c, q([-12, 0, -12, 22, -6, 30, 6, 30, 12, 22, 12, 0]), "#3E2E22");
    P(c, q([0, 0, 0, 30, 6, 30, 12, 22, 12, 0]), "#5A4232");
    E(c, x + 7 * s, y - 14 * s, 1.6 * s, 1.6 * s, "#FFD98A");
    P(c, q([-16, 0, 16, 0, 14, -5, -14, -5]), PIEDRA);
    // dos hongos al costado
    [[30, 8, 7], [36, 4, 5]].forEach(([dx, dy, r]) => {
      R(c, x + (dx - 1.5) * s, y - (dy + r * 1.4) * s, 3 * s, r * 1.4 * s, "#E8E0D0");
      E(c, x + dx * s, y - (dy + r * 1.4) * s, r * s, r * 0.6 * s, "#C8402D");
    });
    // de noche, luz por la rendija de la puerta
    if (noche() > 0.5) alfa(c, 0.6, () => R(c, x - 1 * s, y - 26 * s, 2 * s, 24 * s, "#FFD98A"));
  }

  function piedraHoradada(c, x, y, t, o) {
    const s = o.s || 1,
      q = xy(x, y, s);
    sombra(c, x + 5 * s, y + 3 * s, 46 * s, 12 * s, 0.4);
    P(c, q([-30, 0, -26, 92, -8, 118, 0, 120, 0, 0]), PIEDRA_S);
    P(c, q([0, 0, 0, 120, 14, 112, 28, 84, 30, 0]), PIEDRA);
    P(c, q([0, 120, 14, 112, 24, 94, 6, 100]), PIEDRA_L);
    // el agujero redondo: se ve el otro lado (un poco de cielo, oscuro)
    E(c, x + 2 * s, y - 74 * s, 12 * s, 13 * s, "#1A1E26");
    P(c, [x - 10 * s, y - 74 * s, x - 6 * s, y - 84 * s, x + 2 * s, y - 87 * s, x - 2 * s, y - 74 * s, x + 2 * s, y - 61 * s, x - 6 * s, y - 64 * s], PIEDRA_S);
    // liquen gris verdoso
    [[-18, 40, 8], [14, 30, 6], [20, 60, 5], [-12, 96, 6]].forEach(([dx, dy, r]) => E(c, x + dx * s, y - dy * s, r * s, r * 0.6 * s, "#9AAA7E"));
    // la pila de piedritas
    [[40, 0, 12, 8], [42, 8, 9, 6], [41, 14, 6, 5]].forEach(([dx, dy, w, h]) => piedra(c, en(q, dx, dy), w, h));
  }

  function tumuloChico(c, x, y, t, o) {
    const s = o.s || 1,
      q = xy(x, y, s);
    sombra(c, x + 6 * s, y + 4 * s, 90 * s, 18 * s, 0.32);
    // el montículo de pasto
    P(c, q([-84, 0, -60, 30, -20, 48, 0, 50, 0, 0]), MUSGO_S);
    P(c, q([0, 0, 0, 50, 30, 46, 64, 28, 84, 0]), MUSGO);
    P(c, q([0, 50, 30, 46, 50, 36, 14, 40]), MUSGO_L);
    // la losa de la entrada y su dintel
    P(c, q([-16, 0, -16, 26, 16, 26, 16, 0]), "#2A2620");
    P(c, q([-22, 26, -22, 34, 24, 34, 24, 26]), PIEDRA);
    P(c, q([-22, 26, -22, 34, 0, 34, 0, 26]), PIEDRA_S);
    P(c, q([-20, 0, -20, 24, -14, 24, -14, 0]), PIEDRA_S);
    P(c, q([14, 0, 14, 24, 20, 24, 20, 0]), PIEDRA);
    // la piedrita con Eihwaz
    P(c, q([46, 0, 46, 30, 52, 36, 58, 30, 58, 0]), PIEDRA);
    P(c, q([46, 0, 46, 30, 52, 36, 52, 0]), PIEDRA_S);
    FUTHARK.dibujar(c, "eihwaz", x + 52 * s, y - 18 * s, 14 * s, "#9A6BD8", 1.4 * s);
    // flores blancas sobre el pasto
    [[-40, 30], [20, 44], [56, 22], [-10, 46]].forEach(([dx, dy]) => E(c, x + dx * s, y - dy * s, 2.4 * s, 2 * s, "#F2ECEC"));
  }

  function rocaLiquenes(c, x, y, t, o) {
    const s = o.s || 1,
      q = xy(x, y, s);
    sombra(c, x + 6 * s, y + 4 * s, 84 * s, 18 * s, 0.38);
    P(c, q([-78, 0, -70, 34, -30, 52, 0, 54, 0, 0]), PIEDRA_S);
    P(c, q([0, 0, 0, 54, 44, 50, 74, 30, 80, 0]), PIEDRA);
    P(c, q([-30, 52, 0, 54, 44, 50, 20, 44, -10, 44]), PIEDRA_L);
    // el hueco tallado arriba, con ceniza fría
    E(c, x + 6 * s, y - 48 * s, 18 * s, 5 * s, "#4A4644");
    E(c, x + 8 * s, y - 48 * s, 12 * s, 3 * s, "#8A8680");
    // manchas de liquen naranja y amarillo
    [[-50, 20, 9, "#F5A524"], [-20, 36, 7, "#FF8D71"], [30, 22, 10, "#F5A524"], [56, 34, 6, "#FFD98A"], [-60, 8, 6, "#FF8D71"]].forEach(([dx, dy, r, col]) => E(c, x + dx * s, y - dy * s, r * s, r * 0.55 * s, col));
  }

  function huecoBuho(c, x, y, t, o) {
    const s = o.s || 1,
      q = xy(x, y, s);
    sombra(c, x + 5 * s, y + 3 * s, 40 * s, 10 * s, 0.4);
    // raíces y el tronco seco, partido arriba
    P(c, q([-36, 0, -18, 12, -12, 0]), "#6E6258");
    P(c, q([36, 0, 18, 12, 12, 0]), "#8A7E72");
    P(c, q([-18, 0, -16, 130, -6, 156, 0, 140, 0, 0]), "#6E6258");
    P(c, q([0, 0, 0, 140, 8, 162, 14, 132, 18, 0]), "#8A7E72");
    // una rama seca
    P(c, q([12, 110, 44, 132, 46, 128, 14, 102]), "#8A7E72");
    // el hueco del tronco
    E(c, x + 1 * s, y - 92 * s, 9 * s, 14 * s, "#1A1210");
    // de noche, dos ojos amarillos que parpadean
    if (noche() > 0.5 && Math.sin(t * 0.8 + x) > -0.85) {
      E(c, x - 3 * s, y - 96 * s, 2.2 * s, 2.2 * s, "#FFD98A");
      E(c, x + 4 * s, y - 96 * s, 2.2 * s, 2.2 * s, "#FFD98A");
    }
    // vetas de la madera
    L(c, x + 6 * s, y - 20 * s, x + 8 * s, y - 70 * s, "#6E6258", 1.4 * s);
    L(c, x - 8 * s, y - 30 * s, x - 10 * s, y - 80 * s, "#5A5048", 1.4 * s);
  }

  // el vættr: un espíritu chico de corteza y musgo con capucha, ojos de luz y una runa en el pecho
  const TIPOS = {
    manantial: { c: "#5A8CA8", s: "#3E6A86", luz: "#C8F2F4", runa: "laguz" },
    tocon: { c: "#7E9A56", s: "#5E7A3E", luz: "#FFD98A", runa: "jera" },
    piedra: { c: "#B0ACA6", s: "#8E8A86", luz: "#73D5DB", runa: "algiz" },
    tumulo: { c: "#8A7AAE", s: "#6A5A8E", luz: "#C9A0F0", runa: "eihwaz" },
    roca: { c: "#C8905E", s: "#A8703E", luz: "#FF8D71", runa: "kenaz" },
    buho: { c: "#D8D0C0", s: "#B0A898", luz: "#FFD98A", runa: "ansuz" },
  };
  function vaettrFigura(c, x, y, t, o) {
    const a = o.a != null ? o.a : 1;
    if (a <= 0.01) return;
    const T = TIPOS[o.tipo] || TIPOS.tocon,
      s = o.s || 1,
      flota = Math.sin(t * 2) * 3 * s,
      Y = y - 10 * s - flota;
    alfa(c, a, () => {
      sombra(c, x, y, 18 * s, 5 * s, 0.3);
      // el cuerpo de capucha, ancho abajo
      P(c, [x - 18 * s, Y, x - 14 * s, Y - 30 * s, x - 6 * s, Y - 46 * s, x, Y - 50 * s, x, Y], T.s);
      P(c, [x, Y, x, Y - 50 * s, x + 6 * s, Y - 46 * s, x + 14 * s, Y - 30 * s, x + 18 * s, Y], T.c);
      // musgo en los hombros y hojitas
      P(c, [x - 15 * s, Y - 26 * s, x - 6 * s, Y - 34 * s, x + 8 * s, Y - 34 * s, x + 15 * s, Y - 26 * s, x, Y - 22 * s], MUSGO);
      // la cara oscura y los ojos de luz
      E(c, x, Y - 38 * s, 7 * s, 6 * s, "#1A1E1A");
      E(c, x - 3 * s, Y - 38 * s, 1.8 * s, 1.8 * s, T.luz);
      E(c, x + 3 * s, Y - 38 * s, 1.8 * s, 1.8 * s, T.luz);
      // bracitos de rama
      L(c, x - 14 * s, Y - 20 * s, x - 24 * s, Y - 26 * s + Math.sin(t * 3) * 2 * s, MADERA_S, 2 * s);
      L(c, x + 14 * s, Y - 20 * s, x + 24 * s, Y - 28 * s, MADERA, 2 * s);
      FUTHARK.dibujar(c, T.runa, x, Y - 12 * s, 9 * s, T.luz, 1.2 * s);
    });
  }

  Object.assign(ASSETS.LISTA, {
    manantialVaettr: { f: manantialVaettr, figura: true, alto: 70, choque: { w: 120, h: 30 }, grupo: "vaettir" },
    toconVaettr: { f: toconVaettr, figura: true, alto: 70, choque: { r: 42 }, grupo: "vaettir" },
    piedraHoradada: { f: piedraHoradada, figura: true, alto: 120, choque: { r: 30 }, grupo: "vaettir" },
    tumuloChico: { f: tumuloChico, figura: true, alto: 50, choque: { w: 150, h: 30 }, grupo: "vaettir" },
    rocaLiquenes: { f: rocaLiquenes, figura: true, alto: 56, choque: { w: 150, h: 30 }, grupo: "vaettir" },
    huecoBuho: { f: huecoBuho, figura: true, alto: 160, choque: { r: 24 }, grupo: "vaettir" },
    vaettrFigura: { f: vaettrFigura, figura: true, alto: 60, grupo: "vaettir", ejemplo: { tipo: "tocon" } },
  });
  window.VAETTIR_DIBUJO = { TIPOS };
})();
