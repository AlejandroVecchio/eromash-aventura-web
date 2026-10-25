// ---------- el nido de las arañas (assets de ARANAS) ----------
//  · nidoArana: el nido de la tejedora, un embudo de tela gris sobre raíces y huesos, con hilos tensos hacia los
//    costados y la boca negra al frente.
//  · sacoHuevos: un saco de huevos colgado de un palo quebrado, envuelto en tela; o.cortado lo deja rajado y vacío.
// Caras planas, luz de arriba a la derecha, la mitad izquierda en sombra, sombra elíptica.
(function () {
  "use strict";
  const { P, E, L, sombra, alfa } = DIB;
  const TELA = "#C8C4BC",
    TELA_S = "#9A968E",
    TELA_L = "#E8E4DC";
  const xy = (x, y, s) => (a) => a.map((v, i) => (i % 2 ? y - v * s : x + v * s));

  function nidoArana(c, x, y, t, o) {
    const s = o.s || 1,
      q = xy(x, y, s);
    sombra(c, x + 6 * s, y + 4 * s, 110 * s, 24 * s, 0.4);
    // raíces y huesos en la base
    L(c, x - 96 * s, y - 2 * s, x - 40 * s, y - 14 * s, "#4A3628", 6 * s);
    L(c, x + 96 * s, y - 4 * s, x + 44 * s, y - 16 * s, "#5A4232", 6 * s);
    E(c, x - 70 * s, y - 6 * s, 9 * s, 4 * s, "#E8E0D0");
    P(c, q([56, 4, 74, 8, 76, 4, 58, 0]), "#E8E0D0");
    // el embudo: lado izquierdo en sombra, derecho al sol
    P(c, q([-90, 0, -40, 70, 0, 92, 0, 0]), TELA_S);
    P(c, q([0, 0, 0, 92, 40, 70, 90, 0]), TELA);
    P(c, q([0, 92, 20, 88, 40, 70, 18, 74]), TELA_L);
    // la boca negra al frente
    P(c, q([-30, 0, -18, 34, 0, 42, 18, 34, 30, 0]), "#111111");
    // hilos tensos del embudo al piso, que tiemblan apenas
    const tiembla = Math.sin(t * 3) * 1.2;
    [[-90, 0, -130, 10], [-60, 40, -126, 70], [60, 40, 126, 72 + tiembla], [90, 0, 132, 8]].forEach(([a, b, cc, d]) => L(c, x + a * s, y - b * s, x + cc * s, y - d * s, "rgba(232,228,220,0.75)", 1.2 * s));
    // los anillos de la tela
    for (let k = 1; k <= 3; k++) {
      const h = k * 22;
      L(c, x - (90 - k * 22) * s, y - h * 0.8 * s, x + (90 - k * 22) * s, y - h * 0.8 * s, "rgba(154,150,142,0.6)", 1 * s);
    }
    // ojos rojos en la boca, a veces
    if (Math.sin(t * 0.7 + x) > 0.6) [[-6, 18], [6, 18], [0, 24]].forEach(([a, b]) => E(c, x + a * s, y - b * s, 2 * s, 2 * s, "#FF8D71"));
  }

  function sacoHuevos(c, x, y, t, o) {
    const s = o.s || 1,
      q = xy(x, y, s),
      bam = Math.sin(t * 1.4 + x * 0.03) * 2;
    sombra(c, x + 3 * s, y + 2 * s, 24 * s, 7 * s, 0.34);
    // el palo quebrado
    P(c, q([-4, 0, -4, 86, 0, 90, 0, 0]), "#3E2E22");
    P(c, q([0, 0, 0, 90, 4, 84, 4, 0]), "#5A4232");
    L(c, x, y - 80 * s, x + 22 * s, y - 92 * s, "#4A3628", 3 * s);
    L(c, x + 18 * s + bam, y - 70 * s, x + 20 * s, y - 90 * s, "rgba(232,228,220,0.8)", 1.2 * s);
    const sx = x + 18 * s + bam,
      sy = y - 48 * s;
    if (o.cortado) {
      // rajado y vacío, colgando flojo
      P(c, [sx - 10 * s, sy - 20 * s, sx + 2 * s, sy - 24 * s, sx + 4 * s, sy + 6 * s, sx - 6 * s, sy + 2 * s], TELA_S);
      P(c, [sx + 2 * s, sy - 24 * s, sx + 12 * s, sy - 18 * s, sx + 6 * s, sy + 8 * s, sx + 4 * s, sy + 6 * s], TELA);
      L(c, sx - 2 * s, sy - 14 * s, sx + 2 * s, sy + 2 * s, "#111111", 2 * s);
      return;
    }
    E(c, sx, sy, 15 * s, 22 * s, TELA);
    P(c, [sx - 15 * s, sy, sx - 10 * s, sy - 16 * s, sx, sy - 22 * s, sx, sy + 22 * s, sx - 10 * s, sy + 16 * s], TELA_S);
    // los huevos que se adivinan adentro y laten
    const late = 0.35 + 0.15 * Math.sin(t * 2.2 + x);
    alfa(c, late, () => [[-4, -8], [5, -2], [-2, 6], [6, 10]].forEach(([a, b]) => E(c, sx + a * s, sy + b * s, 4 * s, 4 * s, "#E8E0D0")));
    L(c, sx - 14 * s, sy - 6 * s, sx + 14 * s, sy + 2 * s, "rgba(154,150,142,0.7)", 1 * s);
    L(c, sx - 12 * s, sy + 10 * s, sx + 13 * s, sy + 14 * s, "rgba(154,150,142,0.7)", 1 * s);
  }

  Object.assign(ASSETS.LISTA, {
    nidoArana: { f: nidoArana, figura: true, alto: 96, choque: { w: 160, h: 30 }, grupo: "aranas" },
    sacoHuevos: { f: sacoHuevos, figura: true, alto: 96, choque: { r: 10 }, grupo: "aranas" },
  });
})();
