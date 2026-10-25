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
  // la puerta de piedra del sótano de la hospedería (se ve de frente, contra la pared del fondo): doce huecos en el
  // arco, uno por proeza; los que ya tienen su trofeo brillan en azul. Abierta deja ver la escalera que baja.
  function puertaPiedra(c, x, y, t, o) {
    const s = o.s || 1;
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    // el marco: bloques de piedra vieja, más viejos que la madera de la hospedería
    P(c, [-150, 0, -150, -250, -120, -320, -60, -362, 0, -372, 60, -362, 120, -320, 150, -250, 150, 0], PIEDRA[1]);
    P(c, [60, -362, 120, -320, 150, -250, 150, 0, 96, 0, 96, -240, 70, -296, 40, -318], PIEDRA[2]);
    for (let k = 0; k < 5; k++) L(c, -150, -50 * k - 20, -100, -50 * k - 20, PIEDRA[0], 3);
    for (let k = 0; k < 5; k++) L(c, 100, -50 * k - 20, 150, -50 * k - 20, PIEDRA[0], 3);
    // el vano
    const vano = [-96, 0, -96, -240, -70, -296, -36, -318, 0, -324, 36, -318, 70, -296, 96, -240, 96, 0];
    if (o.abierta) {
      P(c, vano, "#0E1416");
      for (let k = 0; k < 5; k++) P(c, [-80 + k * 6, -30 - k * 34, 80 - k * 6, -30 - k * 34, 74 - k * 6, -46 - k * 34, -74 + k * 6, -46 - k * 34], k % 2 ? "#2A3236" : "#323A3E");
      DIB.alfa(c, 0.35 + Math.sin(t * 2) * 0.1, () => P(c, vano, "#73D5DB"));
    } else {
      P(c, vano, PIEDRA[0]);
      P(c, [0, -324, 36, -318, 70, -296, 96, -240, 96, 0, 0, 0], "#34383C");
      L(c, 0, -324, 0, 0, "#2A2E32", 3);
      // la talla de las raíces en la hoja
      c.strokeStyle = "#4E5458";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(0, -60);
      c.quadraticCurveTo(-40, -120, -20, -200);
      c.moveTo(0, -60);
      c.quadraticCurveTo(40, -130, 24, -210);
      c.moveTo(0, -60);
      c.lineTo(0, -250);
      c.stroke();
    }
    // los doce huecos del arco
    for (let k = 0; k < 12; k++) {
      const a = Math.PI * (0.92 - (k / 11) * 0.84),
        hx = Math.cos(a) * 128,
        hy = -250 - Math.sin(a) * 92,
        lit = k < (o.luces || 0);
      E(c, hx, hy, 9, 7, lit ? "#73D5DB" : "#1E2226");
      if (lit) DIB.alfa(c, 0.4, () => E(c, hx, hy, 16, 13, "#73D5DB"));
    }
    c.restore();
  }
  Object.assign(ASSETS.LISTA, {
    puertaPiedra: { f: puertaPiedra, fv: ASSETS.cartaV(puertaPiedra, 300, 372), vol: true, alto: 380, grupo: "interiores" },
    bocaCueva: { f: bocaCueva, alto: 300, choque: { w: 520, h: 50 }, grupo: "guaridas" },
    nidoZarzal: { f: nidoZarzal, alto: 20, grupo: "guaridas", piso: true },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, { puertaPiedra: { luces: 5, s: 0.6 }, bocaCueva: { s: 0.6 }, nidoZarzal: { s: 0.6 } });
})();
