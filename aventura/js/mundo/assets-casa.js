// ---------- la casa de Hrolf, la casa propia (assets de CASA) ----------
//  · letreroVenta: el letrero de «se vende» que Eydis clavó frente a la casa de Hrolf: un poste con una tabla colgada
//    de dos cadenas, una moneda pintada y la marca de la plata, sin letras. o.vendida lo da vuelta (la cara de atrás,
//    con la cornamenta de bienvenida tallada).
//  · huertaCasa: la huerta de la casa, tres surcos de tierra oscura con un cerco bajo de varas. o.crece (0 a 1) cuánto
//    crecieron las matas: brotes, hojas y al final las flores y frutos que se cosechan.
// Caras planas, luz de arriba a la derecha, la mitad izquierda en sombra, sombra elíptica.
(function () {
  "use strict";
  const { P, E, R, L, sombra } = DIB;
  const xy = (x, y, s) => (a) => a.map((v, i) => (i % 2 ? y - v * s : x + v * s));

  function letreroVenta(c, x, y, t, o) {
    const s = o.s || 1,
      q = xy(x, y, s),
      mece = Math.sin(t * 1.3 + x) * 1.5 * s;
    sombra(c, x + 4 * s, y + 2 * s, 30 * s, 8 * s, 0.32);
    // el poste con el brazo
    R(c, x - 4 * s, y - 120 * s, 8 * s, 120 * s, "#7A5634");
    R(c, x - 4 * s, y - 120 * s, 4 * s, 120 * s, "#553A22");
    R(c, x - 4 * s, y - 118 * s, 52 * s, 6 * s, "#7A5634");
    P(c, q([0, 100, 0, 108, 16, 118, 22, 118]), "#553A22");
    // las cadenas y la tabla
    L(c, x + 14 * s, y - 112 * s, x + 14 * s + mece, y - 94 * s, "#3A3634", 1.6 * s);
    L(c, x + 42 * s, y - 112 * s, x + 42 * s + mece, y - 94 * s, "#3A3634", 1.6 * s);
    const bx = x + 6 * s + mece,
      by = y - 94 * s;
    P(c, [bx, by, bx + 44 * s, by, bx + 44 * s, by + 30 * s, bx, by + 30 * s], o.vendida ? "#7A5634" : "#9A7650");
    P(c, [bx, by, bx + 10 * s, by, bx + 10 * s, by + 30 * s, bx, by + 30 * s], "#7A5634");
    if (o.vendida) {
      // la cornamenta de Eikholt, tallada: bienvenido a casa
      const cx = bx + 22 * s,
        cy = by + 22 * s,
        k = "#E8E0D0";
      [-1, 1].forEach((l) => {
        L(c, cx, cy, cx + l * 5 * s, cy - 8 * s, k, 1.8 * s);
        L(c, cx + l * 5 * s, cy - 8 * s, cx + l * 8 * s, cy - 16 * s, k, 1.6 * s);
        L(c, cx + l * 5 * s, cy - 8 * s, cx + l * 11 * s, cy - 10 * s, k, 1.2 * s);
      });
    } else {
      // la moneda de plata y la marca de la balanza
      E(c, bx + 22 * s, by + 15 * s, 9 * s, 9 * s, "#C8C4BE");
      E(c, bx + 24 * s, by + 13 * s, 6 * s, 6 * s, "#F2ECEC");
      L(c, bx + 18 * s, by + 15 * s, bx + 26 * s, by + 15 * s, "#8E8A86", 1.4 * s);
    }
  }

  function huertaCasa(c, x, y, t, o) {
    const s = o.s || 1,
      k = Math.max(0, Math.min(1, o.crece || 0));
    // la tierra de los surcos
    P(c, [x - 110 * s, y - 50 * s, x + 110 * s, y - 50 * s, x + 120 * s, y + 30 * s, x - 120 * s, y + 30 * s], "#4E3A28");
    for (let i = 0; i < 3; i++) {
      const sy = y - 36 * s + i * 24 * s;
      P(c, [x - 104 * s + i * 3 * s, sy, x + 104 * s + i * 3 * s, sy, x + 108 * s + i * 3 * s, sy + 10 * s, x - 108 * s + i * 3 * s, sy + 10 * s], "#5E4632");
      // las matas: brotes, hojas y frutos
      for (let j = 0; j < 7; j++) {
        const px = x - 90 * s + j * 30 * s + i * 4 * s,
          py = sy + 4 * s,
          h = (4 + 14 * k) * s;
        if (k <= 0) continue;
        P(c, [px, py, px - 5 * s * k - 2 * s, py - h * 0.7, px, py - h], "#4E6B3A");
        P(c, [px, py, px + 6 * s * k + 2 * s, py - h * 0.6, px, py - h], "#6E9A4E");
        if (k >= 1) E(c, px + 1 * s, py - h - 2 * s, 3.2 * s, 3.2 * s, (i + j) % 3 === 0 ? "#C8402D" : (i + j) % 3 === 1 ? "#FFD98A" : "#9A6BD8");
      }
    }
    // el cerco bajo de varas
    for (let j = 0; j <= 8; j++) R(c, x - 120 * s + j * 30 * s, y + 18 * s, 3 * s, 16 * s, "#7A5634");
    L(c, x - 120 * s, y + 24 * s, x + 122 * s, y + 24 * s, "#9A7650", 2 * s);
  }

  Object.assign(ASSETS.LISTA, {
    letreroVenta: { f: letreroVenta, figura: true, alto: 124, choque: { w: 16, h: 10 }, grupo: "casa" },
    huertaCasa: { f: huertaCasa, piso: true, alto: 20, choque: null, grupo: "casa" },
  });
})();
