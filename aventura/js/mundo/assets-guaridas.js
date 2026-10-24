// ---------- las guaridas de los semijefes (se suma a ASSETS) ----------
// La boca de la cueva de la loba madre, en la ladera de la quebrada, y el nido del lobo viejo de zarzal: un anillo de
// zarzas secas con huesos roídos. Mismas reglas que assets.js: colores planos, luz de arriba a la derecha.
(function () {
  "use strict";
  const { P, E, L, azar, sombra } = DIB;
  const PIEDRA = ["#3A3E42", "#4A4E52", "#5A5E62", "#6A6E72"];

  // la boca de la cueva: un lomo de roca partido con la entrada oscura y huesos en el umbral
  function bocaCueva(c, x, y, t, o) {
    const r = azar(o.sem || 3);
    sombra(c, x, y + 6, 300, 50);
    P(c, [x - 290, y + 10, x - 250, y - 150, x - 140, y - 250, x - 10, y - 290, x + 150, y - 240, x + 260, y - 130, x + 300, y + 10], PIEDRA[1]);
    P(c, [x + 40, y - 280, x + 150, y - 240, x + 260, y - 130, x + 300, y + 10, x + 120, y + 10], PIEDRA[2]);
    P(c, [x - 290, y + 10, x - 250, y - 150, x - 170, y - 230, x - 150, y + 10], PIEDRA[0]);
    // la entrada
    P(c, [x - 110, y + 8, x - 96, y - 90, x - 50, y - 150, x + 20, y - 162, x + 80, y - 120, x + 112, y - 40, x + 118, y + 8], "#141210");
    P(c, [x - 70, y + 8, x - 58, y - 70, x - 20, y - 110, x + 30, y - 112, x + 70, y - 70, x + 82, y + 8], "#0A0908");
    // grietas y musgo
    L(c, x + 150, y - 236, x + 120, y - 160, PIEDRA[0], 4);
    L(c, x - 200, y - 190, x - 170, y - 120, PIEDRA[0], 4);
    for (let k = 0; k < 6; k++) E(c, x - 240 + r() * 480, y - 200 - r() * 80, 18 + r() * 16, 8, "#46582E");
    // huesos
    for (let k = 0; k < 5; k++) {
      const hx = x - 90 + r() * 200,
        hy = y + 4 + r() * 30,
        a = r() * 3;
      L(c, hx - Math.cos(a) * 16, hy - Math.sin(a) * 5, hx + Math.cos(a) * 16, hy + Math.sin(a) * 5, "#D8CCB4", 5);
    }
  }
  // el nido del lobo viejo: zarzas secas en anillo, huesos y pelo enganchado
  function nidoZarzal(c, x, y, t, o) {
    const r = azar(o.sem || 9);
    E(c, x, y, 220, 90, "#3A3424");
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2 + r() * 0.3,
        bx = x + Math.cos(a) * 230,
        by = y + Math.sin(a) * 95;
      for (let j = 0; j < 4; j++) {
        const b = r() * Math.PI - Math.PI,
          l = 30 + r() * 40;
        c.beginPath();
        c.moveTo(bx, by);
        c.quadraticCurveTo(bx + Math.cos(b) * l * 0.6 + 10, by + Math.sin(b) * l * 0.4, bx + Math.cos(b) * l, by + Math.sin(b) * l * 0.7);
        c.strokeStyle = j % 2 ? "#4A3A26" : "#5E4A30";
        c.lineWidth = 4;
        c.stroke();
      }
    }
    for (let k = 0; k < 7; k++) {
      const hx = x - 140 + r() * 280,
        hy = y - 40 + r() * 80,
        a = r() * 3;
      L(c, hx - Math.cos(a) * 18, hy - Math.sin(a) * 6, hx + Math.cos(a) * 18, hy + Math.sin(a) * 6, "#D8CCB4", 5);
    }
    for (let k = 0; k < 4; k++) E(c, x - 100 + r() * 200, y - 30 + r() * 60, 14, 6, "#6E6A64");
  }
  Object.assign(ASSETS.LISTA, {
    bocaCueva: { f: bocaCueva, alto: 300, choque: { w: 520, h: 50 }, grupo: "guaridas" },
    nidoZarzal: { f: nidoZarzal, alto: 20, grupo: "guaridas", piso: true },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, { bocaCueva: { s: 0.6 }, nidoZarzal: { s: 0.6 } });
})();
