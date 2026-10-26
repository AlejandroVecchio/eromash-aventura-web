// ---------- el hólmr: la piel del duelo (assets de HOLMR) ----------
//  · holmrPiel: la piel de buey estaqueada donde se baten los kempur (como en las sagas: una capa de cinco anas, con
//    lazos en las puntas y estacas). Va en el piso: el cuero tirante con la mitad izquierda en sombra, tres surcos
//    alrededor (el que sale de los surcos se va del hólmr) y las estacas de las puntas. o.ax, o.ay: medio ancho y medio
//    alto (330 × 230 en el juego; sin ellos, chica para el catálogo); se dibuja en el piso, así gira con la cámara.
//  · holmrVara: una de las cuatro varas de avellano de las esquinas, con una tira roja atada (las «hoslur» de la ley).
//  · bancoTestigos: el tronco partido donde se sientan los testigos del duelo, con el cuerno de Hallbera apoyado.
// Caras planas, luz de arriba a la derecha, la mitad izquierda en sombra, sombra elíptica.
(function () {
  "use strict";
  const { P, R, L, sombra } = DIB;
  const xy = (x, y, s) => (a) => a.map((v, i) => (i % 2 ? y - v * s : x + v * s));
  const CUERO = "#8A6A48",
    CUERO_S = "#6E5236",
    CUERO_C = "#9A7A56",
    SURCO = "#4A3828";

  function holmrPiel(c, x, y, t, o) {
    const s = o.s || 1,
      ax = (o.ax || 50) * s,
      ay = (o.ay || 35) * s,
      u = ax / 330; // los detalles van con el tamaño (en el catálogo se ve chica)
    if (!o.ax) y -= ay + 16 * s; // sola (catálogo, editor): parada sobre su base, no centrada
    // los tres surcos alrededor, en la tierra: el que sale del último se va del hólmr
    for (let k = 1; k <= 3; k++) {
      const m = (14 + 20 * k) * u;
      P(c, [x - ax - m, y - ay - m, x + ax + m, y - ay - m, x + ax + m, y + ay + m, x - ax - m, y + ay + m, x - ax - m, y - ay - m + 7 * u, x - ax - m + 7 * u, y - ay - m + 7 * u, x - ax - m + 7 * u, y + ay + m - 7 * u, x + ax + m - 7 * u, y + ay + m - 7 * u, x + ax + m - 7 * u, y - ay - m + 7 * u, x - ax - m, y - ay - m + 7 * u], k === 3 ? "#3A2A1C" : "#4A3828");
    }
    // la silueta de la piel de buey: un rectángulo con las cuatro patas estiradas hacia las estacas
    const q = (a, b) => [x + a * ax, y + b * ay];
    const sil = [
      q(-0.86, -1), q(-0.3, -0.94), q(0.3, -0.96), q(0.86, -1), q(1.04, -1.08), q(1.06, -0.86), q(1, -0.3), q(0.97, 0.3), q(1, 0.86), q(1.06, 1.06), q(0.86, 1.04), q(0.3, 0.96), q(-0.3, 0.97), q(-0.86, 1), q(-1.05, 1.07), q(-1.04, 0.86), q(-0.98, 0.3), q(-1, -0.3), q(-1.04, -0.86), q(-1.06, -1.06),
    ].flat();
    P(c, sil, CUERO);
    c.save();
    c.beginPath();
    for (let i = 0; i < sil.length; i += 2) c[i ? "lineTo" : "moveTo"](sil[i], sil[i + 1]);
    c.closePath();
    c.clip();
    // la mitad izquierda en sombra (luz de arriba a la derecha), en dos caras
    P(c, [x - ax * 1.2, y - ay * 1.2, x - ax * 0.12, y - ay * 1.2, x - ax * 0.32, y + ay * 1.2, x - ax * 1.2, y + ay * 1.2], CUERO_S);
    P(c, [x - ax * 0.12, y - ay * 1.2, x + ax * 0.05, y - ay * 1.2, x - ax * 0.18, y + ay * 1.2, x - ax * 0.32, y + ay * 1.2], "#7C5E40");
    // el medio gastado y claro de tanto pisarlo
    P(c, [x - ax * 0.42, y - ay * 0.12, x - ax * 0.1, y - ay * 0.5, x + ax * 0.36, y - ay * 0.44, x + ax * 0.56, y + ay * 0.02, x + ax * 0.3, y + ay * 0.46, x - ax * 0.18, y + ay * 0.5], CUERO_C);
    P(c, [x - ax * 0.42, y - ay * 0.12, x - ax * 0.1, y - ay * 0.5, x - ax * 0.14, y + ay * 0.5, x - ax * 0.18, y + ay * 0.5], "#8E6F4E");
    // manchas del pelo que quedó, facetadas
    [[-0.66, -0.6, 0.11], [0.66, 0.56, 0.09], [0.72, -0.62, 0.07], [-0.58, 0.62, 0.08], [0.08, 0.78, 0.06]].forEach(([a, b, r]) => {
      const cx = x + ax * a,
        cy = y + ay * b,
        rx = ax * r,
        ry = ay * r * 0.8;
      P(c, [cx - rx, cy, cx - rx * 0.3, cy - ry, cx + rx, cy - ry * 0.4, cx + rx * 0.6, cy + ry, cx - rx * 0.5, cy + ry * 0.8], a < -0.1 ? "#5A422C" : CUERO_S);
    });
    c.restore();
    // la cuerda de los lazos, por dentro del borde
    const m = 22 * u;
    c.strokeStyle = "#C8A47A";
    c.lineWidth = 3.5 * u;
    c.setLineDash([16 * u, 6 * u]);
    c.strokeRect(x - ax + m, y - ay + m, (ax - m) * 2, (ay - m) * 2);
    c.setLineDash([]);
    // la marca del medio y las dos rayas donde arrancan los dos
    L(c, x - 18 * u, y, x + 18 * u, y, SURCO, 4 * u);
    L(c, x - ax * 0.6, y - 14 * u, x - ax * 0.6, y + 14 * u, SURCO, 4 * u);
    L(c, x + ax * 0.6, y - 14 * u, x + ax * 0.6, y + 14 * u, SURCO, 4 * u);
    // las estacas de las puntas y del medio de cada lado, con su lazo de cuero
    [[-1.06, -1.06], [1.04, -1.08], [1.06, 1.06], [-1.05, 1.07], [0, -0.96], [0, 0.97], [-1, 0], [0.98, 0]].forEach(([a, b]) => {
      const px = x + ax * a,
        py = y + ay * b,
        sx = Math.sign(a),
        sy = Math.sign(b);
      L(c, px, py, px + sx * 16 * u, py + sy * 12 * u, "#3A2A1C", 3 * u);
      R(c, px + sx * 16 * u - 5 * u, py + sy * 12 * u - 5 * u, 10 * u, 10 * u, "#7A5634");
      R(c, px + sx * 16 * u - 5 * u, py + sy * 12 * u - 5 * u, 5 * u, 10 * u, "#5A3E26");
    });
  }

  function holmrVara(c, x, y, t, o) {
    const s = o.s || 1,
      q = xy(x, y, s),
      vaiven = Math.sin(t * 2.2 + (o.v || 0)) * 4;
    sombra(c, x + 4 * s, y, 14 * s, 4 * s, 0.38);
    // la vara de avellano, un poco torcida, con un nudo
    P(c, q([-3, 0, 3, 0, 4, 60, 2, 118, -2, 118, -2, 60]), "#7A5634");
    P(c, q([-3, 0, 0, 0, 0, 118, -2, 118, -2, 60]), "#5A3E26");
    P(c, q([2, 70, 12, 86, 10, 89, 1, 78]), "#5A3E26");
    // dos hojas en la punta de la ramita
    P(c, q([12, 86, 20, 92, 14, 96]), "#5E7A3E");
    P(c, q([10, 88, 8, 98, 14, 96]), "#4E6B3A");
    // la tira roja atada que flamea
    R(c, x - 4 * s, y - 104 * s, 8 * s, 6 * s, "#9C2315");
    P(c, q([3, 104, 22 + vaiven, 100, 26 + vaiven * 1.4, 92, 6, 98]), "#C8402D");
    P(c, q([3, 104, 14 + vaiven * 0.6, 102, 6, 98]), "#9C2315");
  }

  function bancoTestigos(c, x, y, t, o) {
    const s = o.s || 1,
      q = xy(x, y, s);
    sombra(c, x + 6 * s, y + 2 * s, 74 * s, 12 * s, 0.38);
    // dos patas de tronco
    P(c, q([-52, 0, -36, 0, -36, 20, -52, 20]), "#5A3E26");
    P(c, q([36, 0, 52, 0, 52, 20, 36, 20]), "#7A5634");
    // el tronco partido al medio: la cara plana arriba, la corteza al frente
    P(c, q([-66, 18, 66, 18, 64, 34, -64, 34]), "#5A3E26");
    P(c, q([0, 18, 66, 18, 64, 34, 0, 34]), "#7A5634");
    P(c, q([-64, 34, 64, 34, 58, 40, -58, 40]), "#C8A47A");
    P(c, q([-64, 34, 0, 34, 0, 40, -58, 40]), "#A88460");
    // el cuerno apoyado en la punta, con su boquilla de bronce
    P(c, q([30, 40, 48, 44, 60, 58, 56, 60, 44, 48, 30, 44]), "#E8DCC4");
    P(c, q([30, 40, 40, 42, 44, 48, 30, 44]), "#C8BCA8");
    R(c, x + 26 * s, y - 45 * s, 5 * s, 6 * s, "#B8A06A");
  }

  Object.assign(ASSETS.LISTA, {
    holmrPiel: { f: holmrPiel, piso: true, alto: 120, choque: null, grupo: "holmr" },
    holmrVara: { f: holmrVara, alto: 120, choque: { w: 12, h: 8 }, grupo: "holmr" },
    bancoTestigos: { f: bancoTestigos, alto: 110, choque: { w: 130, h: 22 }, grupo: "holmr" },
  });
  window.HOLMR_DIBUJO = { holmrPiel };
})();
