// ---------- los libros de Eldervald (assets de LIBROS) ----------
//  · atrilPiedra: el atril de piedra del camino, una laja tallada con el canto inclinado y un libro encima, atado con
//    una correa a un aro de hierro para que no se lo lleve el viento. Mientras nadie lo leyó, la runa de la base guarda
//    un poco de luz rúnica y el libro queda abierto; o.leido lo cierra y apaga la runa. o.col es el color de la tapa.
//  · libroCaido: un libro tirado en el piso, como lo deja caer un líder al morir (o.col la tapa).
// Y window.LIBROS_DIBUJO.libro(c, x, y, s, col, abierto): un libro de tapas de cuero con cantoneras de hierro, visto de
// arriba en perspectiva (lo usan los dos assets, el lector y los íconos de la mochila).
// Caras planas, luz de arriba a la derecha, la mitad izquierda en sombra, sombra elíptica.
(function () {
  "use strict";
  const { P, E, R, L, sombra } = DIB;
  const xy = (x, y, s) => (a) => a.map((v, i) => (i % 2 ? y - v * s : x + v * s));
  // oscurecer un color de tapa para la cara en sombra
  function sombraDe(col) {
    const n = parseInt(col.slice(1), 16),
      f = 0.7;
    const r = Math.round(((n >> 16) & 255) * f),
      g = Math.round(((n >> 8) & 255) * f),
      b = Math.round((n & 255) * f);
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }
  // un libro centrado en (x, y): cerrado es la tapa con el lomo a la izquierda; abierto, dos páginas con renglones
  function libro(c, x, y, s, col, abierto) {
    const q = xy(x, y, s),
      cs = sombraDe(col);
    if (abierto) {
      // las tapas asoman debajo de las hojas
      P(c, q([-26, -10, -28, 8, 0, 12, 28, 8, 26, -10, 0, -6]), cs);
      P(c, q([0, -6, 26, -10, 28, 8, 0, 12]), col);
      // las hojas: la izquierda en sombra
      P(c, q([-24, -7, -25, 9, 0, 11, 0, -4]), "#D8CCB4");
      P(c, q([0, -4, 0, 11, 25, 9, 24, -7]), "#F2ECEC");
      for (let k = 0; k < 4; k++) {
        L(c, x - 20 * s, y - (-3 + k * 3.2) * s, x - 4 * s, y - (-1.5 + k * 3.2) * s, "#A89C88", 0.8 * s);
        L(c, x + 4 * s, y - (-1.5 + k * 3.2) * s, x + 20 * s, y - (-3 + k * 3.2) * s, "#B8AC98", 0.8 * s);
      }
      L(c, x, y + 4 * s, x, y - 11 * s, "#A89C88", 1 * s);
      // la cinta para marcar
      P(c, q([2, -4, 4, -4, 5, -14, 3, -13]), "#9C2315");
      return;
    }
    // el canto de las hojas y la tapa, con el lomo en sombra
    P(c, q([-20, -8, -20, -4, 22, -4, 22, -8]), "#D8CCB4");
    P(c, q([22, -8, 22, -4, 24, -2, 24, -6]), "#C8BCA8");
    P(c, q([-22, -4, -20, 12, 24, 12, 24, -2]), col);
    P(c, q([-22, -4, -20, 12, -14, 12, -16, -4]), cs);
    // las cantoneras de hierro y el sello de la tapa
    P(c, q([18, 12, 24, 12, 24, 7]), "#8E8A86");
    P(c, q([18, -3, 24, -2, 24, 3]), "#6E6A66");
    P(c, q([4, 7, 7, 4, 4, 1, 1, 4]), "#FFD98A");
  }

  function atrilPiedra(c, x, y, t, o) {
    const s = o.s || 1,
      q = xy(x, y, s),
      leido = !!o.leido;
    sombra(c, x + 4 * s, y + 3 * s, 46 * s, 12 * s, 0.36);
    // la base: un escalón de piedra
    P(c, q([-34, 0, -34, 10, 34, 10, 34, 0]), "#8E8A86");
    P(c, q([-34, 0, -34, 10, 0, 10, 0, 0]), "#6E6A66");
    P(c, q([-34, 10, -28, 16, 30, 16, 34, 10]), "#A8A49E");
    // el pie de la laja, más angosto arriba
    P(c, q([-16, 16, -12, 62, 14, 62, 18, 16]), "#8E8A86");
    P(c, q([-16, 16, -12, 62, 0, 62, 0, 16]), "#6E6A66");
    // la runa Ansuz tallada en el pie: guarda luz mientras nadie leyó
    const rc = leido ? "#5A5652" : "#73D5DB",
      rx = x + 2 * s,
      ry = y - 26 * s;
    L(c, rx - 4 * s, ry + 12 * s, rx - 4 * s, ry - 12 * s, rc, 2.4 * s);
    L(c, rx - 4 * s, ry - 12 * s, rx + 5 * s, ry - 6 * s, rc, 2.4 * s);
    L(c, rx - 4 * s, ry - 4 * s, rx + 5 * s, ry + 2 * s, rc, 2.4 * s);
    // el canto inclinado: una losa que mira hacia quien llega
    P(c, q([-30, 62, -26, 74, 30, 74, 34, 62]), "#6E6A66");
    P(c, q([-26, 74, -22, 92, 26, 92, 30, 74]), "#A8A49E");
    P(c, q([-26, 74, -22, 92, 0, 92, 0, 74]), "#8E8A86");
    // el aro de hierro y la correa
    E(c, x + 30 * s, y - 70 * s, 4 * s, 4 * s, "#3A3634");
    E(c, x + 30 * s, y - 70 * s, 2 * s, 2 * s, "#8E8A86");
    L(c, x + 30 * s, y - 70 * s, x + 18 * s, y - 82 * s, "#5A4232", 1.6 * s);
    // el libro
    libro(c, x + 2 * s, y - 86 * s, 0.92 * s, o.col || "#5E130D", !leido);
    // un brillo leve sobre las hojas sin leer
    if (!leido && (!window.CALIDAD || CALIDAD.nivel > 0)) {
      const a = 0.18 + Math.sin(t * 2 + x) * 0.08;
      c.globalAlpha = a;
      E(c, x + 2 * s, y - 90 * s, 22 * s, 7 * s, "#73D5DB");
      c.globalAlpha = 1;
    }
  }

  function libroCaido(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x, y + 2 * s, 24 * s, 6 * s, 0.3);
    libro(c, x, y - 4 * s, s, o.col || "#5E130D", false);
  }

  Object.assign(ASSETS.LISTA, {
    atrilPiedra: { f: atrilPiedra, figura: true, alto: 96, choque: { w: 64, h: 18 }, grupo: "libros" },
    libroCaido: { f: libroCaido, alto: 18, grupo: "libros", piso: true },
  });
  window.LIBROS_DIBUJO = { libro };
})();
