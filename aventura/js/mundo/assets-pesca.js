// ---------- la pesca (assets de PESCA) ----------
//  · canaSverri: el puesto de pesca de Sverri a la orilla de la laguna: una caña de fresno clavada en el barro, un balde
//    de madera con un pez asomado y un banquito de tres patas. Con o.sinCana la caña ya no está (se la llevó Eromash).
// Y window.PECES_DIBUJO.pez(c, id, x, y, s, giro): cada pez de costado, con su forma y sus colores (lo usan el minijuego,
// los íconos y el diario).
// Caras planas, luz de arriba a la derecha, la mitad izquierda en sombra, sombra elíptica.
(function () {
  "use strict";
  const { P, E, R, L, sombra } = DIB;
  const xy = (x, y, s) => (a) => a.map((v, i) => (i % 2 ? y - v * s : x + v * s));

  // ---------- los peces ----------
  // largo: cuánto más largo que alto; col: lomo, panza, aletas; rayas o manchas
  const FORMAS = {
    perca: { largo: 2.4, alto: 1, lomo: "#5E7A3E", panza: "#E0C88A", aleta: "#C8402D", rayas: "#3E5428" },
    trucha: { largo: 3, alto: 0.85, lomo: "#6A7A6E", panza: "#E8DCC4", aleta: "#8A9A8E", manchas: "#C8402D" },
    salmon: { largo: 3.2, alto: 0.95, lomo: "#5A6A7E", panza: "#FF8D71", aleta: "#4A5A6E", manchas: "#2A3440" },
    lucio: { largo: 4, alto: 0.7, lomo: "#4E5A3A", panza: "#C8C49A", aleta: "#6E7A4E", manchas: "#B8C47E", hocico: true },
    anguila: { largo: 6, alto: 0.45, lomo: "#3A3428", panza: "#8A7E5E", aleta: "#2A2620", anguila: true },
    escarcha: { largo: 2.8, alto: 0.9, lomo: "#8AB8C8", panza: "#E8F4F8", aleta: "#C8F2F4", manchas: "#F2FCFF" },
    urridi: { largo: 3.4, alto: 1.05, lomo: "#3E4A3A", panza: "#D8C890", aleta: "#9C2315", manchas: "#FFD98A", viejo: true },
  };
  function pez(c, id, x, y, s, giro) {
    const F = FORMAS[id] || FORMAS.perca,
      h = 16 * s * F.alto,
      w = 16 * s * F.largo;
    c.save();
    c.translate(x, y);
    if (giro) c.rotate(giro);
    if (F.anguila) {
      // la anguila: un cuerpo largo que ondula
      const pts = [];
      for (let k = 0; k <= 8; k++) pts.push([-w / 2 + (w * k) / 8, Math.sin(k * 0.9 + (window.JUEGO ? JUEGO.J.t * 6 : 0)) * h * 0.5]);
      c.lineCap = "round";
      c.strokeStyle = F.lomo;
      c.lineWidth = h * 1.2;
      c.beginPath();
      pts.forEach(([px, py], k) => (k ? c.lineTo(px, py) : c.moveTo(px, py)));
      c.stroke();
      c.strokeStyle = F.panza;
      c.lineWidth = h * 0.4;
      c.beginPath();
      pts.forEach(([px, py], k) => (k ? c.lineTo(px, py + h * 0.3) : c.moveTo(px, py + h * 0.3)));
      c.stroke();
      E(c, w / 2 - 2 * s, pts[8][1] - h * 0.2, 1.6 * s, 1.6 * s, "#111111");
      c.restore();
      return;
    }
    // la cola
    P(c, [-w / 2 + 2, 0, -w / 2 - h * 0.9, -h * 0.9, -w / 2 - h * 0.6, 0, -w / 2 - h * 0.9, h * 0.9], F.aleta);
    // el cuerpo: lomo y panza
    P(c, [-w / 2, 0, -w * 0.3, -h, w * 0.2, -h * 1.05, w / 2, -h * 0.2, w / 2 + (F.hocico ? h * 0.7 : 0), 0, -w * 0.3, 0], F.lomo);
    P(c, [-w / 2, 0, -w * 0.3, 0, w / 2 + (F.hocico ? h * 0.7 : 0), 0, w * 0.3, h * 0.8, -w * 0.3, h * 0.7], F.panza);
    // aleta de arriba
    P(c, [-w * 0.15, -h * 0.98, w * 0.05, -h * 1.6, w * 0.2, -h * 1.02], F.aleta);
    if (F.rayas) for (let k = 0; k < 4; k++) P(c, [-w * 0.25 + k * w * 0.14, -h * 0.95, -w * 0.2 + k * w * 0.14, -h * 0.95, -w * 0.24 + k * w * 0.14, h * 0.2, -w * 0.29 + k * w * 0.14, h * 0.2], F.rayas);
    if (F.manchas) [[-0.2, -0.5], [0, -0.7], [0.15, -0.35], [-0.05, -0.2], [0.28, -0.6]].forEach(([a, b]) => E(c, a * w, b * h, h * 0.13, h * 0.13, F.manchas));
    // el ojo y la boca
    E(c, w * 0.36, -h * 0.35, h * 0.14 + 0.6, h * 0.14 + 0.6, "#111111");
    L(c, w / 2 + (F.hocico ? h * 0.7 : 0) - h * 0.4, h * 0.05, w / 2 + (F.hocico ? h * 0.7 : 0), 0, "#2A2620", Math.max(1, h * 0.08));
    if (F.viejo) {
      // Urriði el Viejo: bigotes largos y cicatrices de anzuelos
      L(c, w * 0.48, h * 0.1, w * 0.62, h * 0.7, "#2A2620", Math.max(1, h * 0.07));
      L(c, w * 0.46, h * 0.12, w * 0.56, h * 0.9, "#2A2620", Math.max(1, h * 0.07));
      [[-0.1, -0.1], [0.12, 0.2]].forEach(([a, b]) => L(c, a * w - h * 0.2, b * h - h * 0.2, a * w + h * 0.2, b * h + h * 0.2, "#E8DCC4", Math.max(1, h * 0.06)));
    }
    c.restore();
  }

  // ---------- el puesto de pesca de Sverri ----------
  function canaSverri(c, x, y, t, o) {
    const s = o.s || 1,
      q = xy(x, y, s);
    sombra(c, x + 4 * s, y + 3 * s, 70 * s, 14 * s, 0.34);
    // el banquito de tres patas
    P(c, q([-56, 0, -52, 22, -48, 22, -52, 0]), "#553A22");
    P(c, q([-36, 0, -38, 22, -34, 22, -32, 0]), "#7A5634");
    P(c, q([-44, 4, -44, 22, -40, 22, -40, 4]), "#553A22");
    E(c, x - 44 * s, y - 24 * s, 18 * s, 5 * s, "#9A7650");
    // el balde de madera con un pez asomado
    P(c, q([10, 0, 8, 30, 22, 32, 22, 0]), "#553A22");
    P(c, q([22, 0, 22, 32, 36, 30, 34, 0]), "#7A5634");
    L(c, x + 9 * s, y - 10 * s, x + 35 * s, y - 10 * s, "#3A3634", 2 * s);
    L(c, x + 8 * s, y - 24 * s, x + 36 * s, y - 24 * s, "#3A3634", 2 * s);
    E(c, x + 22 * s, y - 31 * s, 13 * s, 3.5 * s, "#2A3E4A");
    pez(c, "trucha", x + 26 * s, y - 38 * s, 0.6 * s, -1.1);
    if (!o.sinCana) {
      // la caña de fresno clavada, con el sedal que cuelga hacia el agua
      L(c, x - 6 * s, y, x + 30 * s, y - 120 * s, "#7A5634", 3 * s);
      L(c, x + 30 * s, y - 120 * s, x + 50 * s, y - 150 * s, "#9A7650", 2 * s);
      c.strokeStyle = "rgba(232,228,220,0.7)";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x + 50 * s, y - 150 * s);
      c.quadraticCurveTo(x + 70 * s, y - 80 * s, x + 80 * s + Math.sin(t * 1.2) * 3 * s, y - 10 * s);
      c.stroke();
      // el carrete
      E(c, x + 4 * s, y - 22 * s, 4 * s, 4 * s, "#3A3634");
    }
  }

  Object.assign(ASSETS.LISTA, {
    canaSverri: { f: canaSverri, figura: true, alto: 150, choque: { r: 30 }, grupo: "pesca" },
  });
  window.PECES_DIBUJO = { pez, FORMAS };
})();
