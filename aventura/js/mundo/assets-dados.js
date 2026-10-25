// ---------- la mesa de dados (assets de DADOS) ----------
//  · mesaDados: la mesa de los dados de hueso: un tablón sobre dos caballetes, un banco largo, el cubilete de cuero,
//    seis dados de hueso, una pila de plata y una vela en un plato (de noche alumbra). o.v cambia el mantel (rojo de
//    fiesta, gris de lana o ninguno).
// Y window.DADOS_DIBUJO.dado(c, x, y, l, cara, op): un dado de hueso visto de arriba en perspectiva, con sus puntos
// (lo usan la mesa, el juego y los íconos).
// Caras planas, luz de arriba a la derecha, la mitad izquierda en sombra, sombra elíptica.
(function () {
  "use strict";
  const { P, E, R, L, sombra } = DIB;
  const xy = (x, y, s) => (a) => a.map((v, i) => (i % 2 ? y - v * s : x + v * s));
  const HUESO = "#E8E0D0",
    HUESO_S = "#C8BCA8",
    HUESO_L = "#F2ECEC",
    PUNTO = "#3A2A1C";
  // dónde van los puntos de cada cara (en una caja de -1 a 1)
  const PUNTOS = {
    1: [[0, 0]],
    2: [[-0.5, -0.5], [0.5, 0.5]],
    3: [[-0.5, -0.5], [0, 0], [0.5, 0.5]],
    4: [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]],
    5: [[-0.5, -0.5], [0.5, -0.5], [0, 0], [-0.5, 0.5], [0.5, 0.5]],
    6: [[-0.5, -0.55], [0.5, -0.55], [-0.5, 0], [0.5, 0], [-0.5, 0.55], [0.5, 0.55]],
  };
  // un dado: la cara de arriba (cuadrada) y el frente y el costado en sombra; op.marca lo resalta (elegido)
  function dado(c, x, y, l, cara, op = {}) {
    const h = l * 0.42;
    c.save();
    c.translate(x, y);
    if (op.giro) c.rotate(op.giro);
    if (op.marca) {
      c.fillStyle = op.marca;
      c.fillRect(-l / 2 - 4, -l / 2 - 4, l + 8, l + h + 8);
    }
    P(c, [-l / 2, l / 2, l / 2, l / 2, l / 2, l / 2 + h, -l / 2, l / 2 + h], HUESO_S);
    P(c, [l / 2, -l / 2, l / 2 + h * 0.3, -l / 2 + h * 0.5, l / 2 + h * 0.3, l / 2 + h, l / 2, l / 2 + h], "#A89C88");
    R(c, -l / 2, -l / 2, l, l, op.apagado ? HUESO_S : HUESO);
    P(c, [l / 2 - l * 0.35, -l / 2, l / 2, -l / 2, l / 2, -l / 2 + l * 0.35], HUESO_L);
    (PUNTOS[cara] || []).forEach(([a, b]) => E(c, a * l * 0.62 * 0.6 + a * l * 0.08, b * l * 0.42, l * 0.09, l * 0.09, op.apagado ? "#7A6A5C" : cara === 1 ? "#9C2315" : PUNTO));
    c.restore();
  }

  function mesaDados(c, x, y, t, o) {
    const s = o.s || 1,
      q = xy(x, y, s),
      v = (o.v || 0) % 3;
    sombra(c, x + 6 * s, y + 4 * s, 110 * s, 22 * s, 0.36);
    // el banco largo, adelante
    P(c, q([-90, 0, -88, 22, -82, 22, -84, 0]), "#553A22");
    P(c, q([82, 0, 84, 22, 90, 22, 88, 0]), "#7A5634");
    P(c, q([-96, 22, -96, 28, 96, 28, 96, 22]), "#9A7650");
    P(c, q([-96, 22, -96, 28, 0, 28, 0, 22]), "#7A5634");
    // los caballetes
    P(c, q([-70, 30, -80, 60, -74, 60, -64, 30]), "#553A22");
    P(c, q([-58, 30, -48, 60, -54, 60, -64, 30]), "#553A22");
    P(c, q([64, 30, 54, 60, 60, 60, 70, 30]), "#7A5634");
    P(c, q([76, 30, 86, 60, 80, 60, 70, 30]), "#7A5634");
    // el tablón y el mantel
    P(c, q([-100, 60, -100, 68, 100, 68, 100, 60]), "#553A22");
    P(c, q([-104, 68, -92, 92, 92, 92, 104, 68]), "#9A7650");
    P(c, q([-104, 68, -92, 92, 0, 92, 0, 68]), "#7A5634");
    if (v < 2) {
      const m = v ? ["#6E6A66", "#56524E"] : ["#9C2315", "#5E130D"];
      P(c, q([-40, 68, -34, 92, 40, 92, 46, 68]), m[0]);
      P(c, q([-40, 68, -34, 92, 0, 92, 0, 68]), m[1]);
      P(c, q([-40, 68, -40, 58, -34, 58, -34, 68]), m[1]);
      P(c, q([40, 68, 40, 58, 46, 58, 46, 68]), m[0]);
    }
    // el cubilete de cuero volcado
    P(c, q([-78, 82, -76, 104, -62, 106, -60, 84]), "#5A4232");
    E(c, x - 69 * s, y - 106 * s, 8 * s, 3 * s, "#3E2E22");
    // los seis dados
    [[-28, 84, 3], [-14, 80, 5], [2, 86, 1], [16, 80, 6], [28, 85, 2], [10, 76, 4]].forEach(([dx, dy, k]) => dado(c, x + dx * s, y - dy * s, 9 * s, k, { giro: (dx % 7) * 0.05 }));
    // la plata en una pila
    [0, 1, 2, 3].forEach((k) => E(c, x + 62 * s, y - (80 + k * 3) * s, 9 * s, 3.2 * s, k % 2 ? "#C8A050" : "#FFD98A"));
    E(c, x + 74 * s, y - 78 * s, 6 * s, 2.4 * s, "#FFD98A");
    // la vela en su plato
    E(c, x + 86 * s, y - 80 * s, 8 * s, 3 * s, "#8E8A86");
    R(c, x + 83 * s, y - 100 * s, 6 * s, 20 * s, "#F2ECEC");
    const llama = Math.sin(t * 9 + x) * 1.5 * s;
    P(c, [x + 86 * s, y - 112 * s + llama, x + 89 * s, y - 104 * s, x + 86 * s, y - 100 * s, x + 83 * s, y - 104 * s], "#FFD98A");
  }

  Object.assign(ASSETS.LISTA, {
    mesaDados: { f: mesaDados, figura: true, alto: 112, choque: { w: 210, h: 40 }, grupo: "dados" },
  });
  window.DADOS_DIBUJO = { dado, PUNTOS };
})();
