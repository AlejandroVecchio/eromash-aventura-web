// ---------- el este: Aserradero de Orm y Santuario de las Raíces (se suma a ASSETS) ----------
// Según «Eldervald — lugares» (versión de Alejandro del 23/10/2026). En el aserradero: la rueda de agua con su soporte
// y la canaleta (quieta y trabada hasta que se sube la compuerta), la compuerta de palanca, el canal, el galpón con la
// sierra de marco, el tronco a medio cortar y el dintel tallado con la marca de la familia, el patio de troncos, el
// torno con la rampa, el buey hundido en el barro, el banco con el taco, la leñera y la grada con la quilla de Sten
// (segunda visita). En el santuario: los escalones comidos por raíces, las estelas antiguas, el árbol colosal con el
// portal y la luz por las rendijas, los restos con las zarzas espectrales, el sello con la concavidad gastada, la
// loma del mirador y el cofre envuelto en su anillo de zarzas.
// Mismas reglas que assets.js: colores planos, luz de arriba a la derecha.
(function () {
  "use strict";
  const { P, E, R, L, alfa, azar, sombra, halo, poli, RUNICO, RUNICO_CLARO, TAU } = DIB;
  const C = ASSETS.C;
  const nivel = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  const PIEDRA = ["#3E4246", "#4E5256", "#5E6266"];
  const AGUA = ["#2E5560", "#3E6E7A", "#5E94A0"];
  const ESPECTRO = "#B8A8D8";

  // la marca de la familia de Orm: una rama vertical con brazos (la misma de los tocones y del carro)
  function marca(c, x, y, h, col, g) {
    L(c, x, y, x, y - h, col, g);
    L(c, x, y - h * 0.35, x - h * 0.3, y - h * 0.6, col, g);
    L(c, x, y - h * 0.35, x + h * 0.3, y - h * 0.6, col, g);
    L(c, x, y - h * 0.7, x - h * 0.22, y - h * 0.92, col, g);
    L(c, x, y - h * 0.7, x + h * 0.22, y - h * 0.92, col, g);
  }
  // la marca de Sten, el constructor de barcos: una ola sobre una quilla
  function marcaSten(c, x, y, h, col, g) {
    L(c, x - h * 0.4, y, x + h * 0.4, y, col, g);
    c.strokeStyle = col;
    c.lineWidth = g;
    c.beginPath();
    c.moveTo(x - h * 0.4, y - h * 0.45);
    c.quadraticCurveTo(x - h * 0.2, y - h * 0.8, x, y - h * 0.45);
    c.quadraticCurveTo(x + h * 0.2, y - h * 0.1, x + h * 0.4, y - h * 0.45);
    c.stroke();
  }
  // el signo del Núcleo (el mismo del sello del santuario)
  function signo(c, x, y, h, col, g) {
    c.strokeStyle = col;
    c.lineWidth = g;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(x - h * 0.35, y + h * 0.5);
    c.lineTo(x + h * 0.2, y - h * 0.05);
    c.lineTo(x, y - h * 0.5);
    c.lineTo(x - h * 0.2, y - h * 0.05);
    c.lineTo(x + h * 0.35, y + h * 0.5);
    c.stroke();
    L(c, x - h * 0.45, y - h * 0.05, x + h * 0.45, y - h * 0.05, col, g * 0.6);
  }
  // una zarza espectral: tallo traslúcido que sube ondulando, con espinas
  function zarzaEspectral(c, x0, y0, x1, y1, curva, t, k, s, onda) {
    const ond = Math.sin(t * 1.6 + k * 1.3) * 6 * s + onda * Math.sin(t * 14 + k) * 10 * s,
      ax = x0 + (x1 - x0) * 0.33 + curva + ond,
      ay = y0 + (y1 - y0) * 0.33,
      bx = x0 + (x1 - x0) * 0.66 - curva * 0.8 - ond,
      by = y0 + (y1 - y0) * 0.66,
      ex1 = x1 + ond * 0.6;
    const en = (u) => {
      const v = 1 - u;
      return [v * v * v * x0 + 3 * v * v * u * ax + 3 * v * u * u * bx + u * u * u * ex1, v * v * v * y0 + 3 * v * v * u * ay + 3 * v * u * u * by + u * u * u * y1];
    };
    c.lineCap = "round";
    const trazo = (col, w) => {
      c.strokeStyle = col;
      c.lineWidth = w;
      c.beginPath();
      c.moveTo(x0, y0);
      c.bezierCurveTo(ax, ay, bx, by, ex1, y1);
      c.stroke();
    };
    alfa(c, 0.25, () => trazo("#9A6BD8", 10 * s));
    trazo(ESPECTRO, 3.5 * s);
    for (let e = 1; e < 8; e++) {
      const [px, py] = en(e / 8),
        l = e % 2 ? 1 : -1;
      P(c, [px, py, px + l * 10 * s, py - 6 * s, px + l * 1 * s, py + 3 * s], "#D8CCF0");
    }
  }

  // ============================== EL ASERRADERO ==============================

  // La rueda de agua: aro de madera con paletas, sobre un soporte de piedra, con la canaleta que le trae el agua.
  // o.gira: con la compuerta arriba gira y el agua cae; si no, queda trabada con una cuña y apenas gotea.
  function ruedaAgua(c, x, y, t, o) {
    const s = o.s || 1,
      rr = 150 * s,
      cx = x,
      cy = y - 170 * s,
      a0 = o.gira ? t * 0.7 : 0.13;
    // o.enRio: parada en la corriente (el río la mueve por abajo y la canaleta por arriba); si no, en su pozo
    if (!o.enRio) {
      sombra(c, x + 10 * s, y + 6 * s, 170 * s, 22 * s, 0.34);
      // el agua donde muerde la rueda
      P(c, poli(x, y - 6 * s, 190 * s, 34 * s, 14, 0.3), AGUA[0]);
      P(c, poli(x + 10 * s, y - 8 * s, 150 * s, 24 * s, 14, 0.6), AGUA[1]);
    } else {
      // el pilar se moja: una franja oscura donde corta el agua
      alfa(c, 0.5, () => P(c, poli(x, y - 4 * s, 120 * s, 20 * s, 12, 0.2), AGUA[0]));
    }
    // el soporte de piedra detrás
    P(c, [x - 40 * s, y, x - 34 * s, y - 196 * s, x + 34 * s, y - 196 * s, x + 40 * s, y], PIEDRA[1]);
    P(c, [x + 8 * s, y, x + 8 * s, y - 196 * s, x + 34 * s, y - 196 * s, x + 40 * s, y], PIEDRA[2]);
    for (let k = 1; k < 7; k++) L(c, x - 38 * s, y - k * 28 * s, x + 38 * s, y - k * 28 * s, PIEDRA[0], 2 * s);
    // la rueda
    c.strokeStyle = C.maderaSombra;
    c.lineWidth = 16 * s;
    c.beginPath();
    c.arc(cx, cy, rr, 0, TAU);
    c.stroke();
    c.strokeStyle = C.madera;
    c.lineWidth = 7 * s;
    c.beginPath();
    c.arc(cx, cy, rr - 26 * s, 0, TAU);
    c.stroke();
    for (let k = 0; k < 8; k++) {
      const a = a0 + (k * TAU) / 8;
      L(c, cx, cy, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, C.maderaVieja, 7 * s);
    }
    for (let k = 0; k < 16; k++) {
      const a = a0 + (k * TAU) / 16,
        ca = Math.cos(a),
        sa = Math.sin(a),
        cb = Math.cos(a + 0.12),
        sb = Math.sin(a + 0.12);
      P(c, [cx + ca * (rr - 8 * s), cy + sa * (rr - 8 * s), cx + ca * (rr + 26 * s), cy + sa * (rr + 26 * s), cx + cb * (rr + 26 * s), cy + sb * (rr + 26 * s), cx + cb * (rr - 8 * s), cy + sb * (rr - 8 * s)], k % 2 ? C.maderaLuz : C.madera);
    }
    E(c, cx, cy, 22 * s, 22 * s, C.hierro);
    E(c, cx + 4 * s, cy - 4 * s, 8 * s, 8 * s, C.hierroLuz);
    // el eje que se va hacia el galpón (o.eje: su largo, hasta la pared del galpón)
    const eje = (o.eje || 260) * s;
    R(c, cx - eje, cy - 6 * s, eje, 12 * s, C.maderaSombra);
    if (o.enRio) for (let k = 1; k < eje / (90 * s); k++) L(c, cx - k * 90 * s, cy + 6 * s, cx - k * 90 * s - 6 * s, y - 2 * s, C.maderaSombra, 9 * s); // los caballetes del eje
    // la canaleta: baja desde el canal (atrás a la derecha, o a la izquierda con o.canaleta -1) hasta la cresta de la
    // rueda, sobre patas cortas
    const lado = o.canaleta || 1,
      ky = cy - rr - 30 * s,
      kx = cx - 10 * s * lado,
      fx = cx + (o.largo || 150) * s * lado,
      fy = ky - 60 * s;
    [0.5, 0.95].forEach((u) => {
      const px = kx + (fx - kx) * u,
        py = ky + (fy - ky) * u;
      L(c, px - 8 * s, py + 8 * s, px - 14 * s, py + 90 * s, C.maderaSombra, 7 * s);
      L(c, px + 8 * s, py + 8 * s, px + 14 * s, py + 90 * s, C.madera, 7 * s);
    });
    P(c, [kx, ky - 12 * s, fx, fy - 12 * s, fx, fy + 12 * s, kx, ky + 12 * s], C.madera);
    P(c, [kx, ky - 12 * s, fx, fy - 12 * s, fx, fy - 6 * s, kx, ky - 6 * s], o.gira ? AGUA[2] : C.maderaSombra);
    P(c, [kx, ky + 12 * s, fx, fy + 12 * s, fx, fy + 16 * s, kx, ky + 16 * s], C.maderaSombra);
    if (o.gira) {
      // el chorro que cae sobre las paletas y la espuma abajo
      for (let k = 0; k < 4; k++) {
        const f = (t * 2.4 + k / 4) % 1;
        alfa(c, 0.8 - f * 0.5, () => R(c, kx - 24 * s + k * 6 * s, ky + f * 60 * s, 20 * s, 26 * s, AGUA[2]));
      }
      for (let k = 0; k < 6; k++) E(c, x - 120 * s + k * 48 * s + Math.sin(t * 5 + k) * 6 * s, y - 10 * s, 14 * s, 5 * s, "#C8DCE0");
    } else {
      // la cuña que la traba y el goteo
      P(c, [cx + rr - 40 * s, cy + 50 * s, cx + rr + 30 * s, cy + 66 * s, cx + rr + 26 * s, cy + 80 * s, cx + rr - 44 * s, cy + 62 * s], C.maderaVieja);
      const g = (t * 0.8) % 1;
      E(c, kx - 4 * s, ky + 14 * s + g * 70 * s, 3 * s, 5 * s, AGUA[2]);
    }
    if (o.enRio) {
      // la corriente le tapa las paletas de abajo y se rompe en espuma contra ellas
      const ola = [];
      for (let k = 0; k <= 10; k++) ola.push(x - 200 * s + k * 40 * s, y - 40 * s + Math.sin(t * 3 + k * 1.7) * 4 * s + (k % 2) * 5 * s);
      alfa(c, 0.92, () => P(c, ola.concat([x + 200 * s, y + 6 * s, x - 200 * s, y + 6 * s]), "#2A4C56"));
      for (let k = 0; k < 7; k++) {
        const f = (t * (o.gira ? 0.9 : 0.25) + k / 7) % 1;
        alfa(c, 0.7 * (1 - f), () => E(c, x - 150 * s + k * 50 * s, y - 34 * s + f * 30 * s, (12 + f * 10) * s, 4 * s, "#C8DCE0"));
      }
    }
  }

  // La compuerta de palanca del canal: dos postes, la tabla que sube y baja y la palanca larga.
  function compuerta(c, x, y, t, o) {
    const s = o.s || 1,
      sube = o.abierta ? 1 : 0,
      ty = y - 30 * s - sube * 56 * s;
    P(c, poli(x, y + 4 * s, 70 * s, 18 * s, 10, 0.2), AGUA[o.abierta ? 1 : 0]);
    if (o.abierta)
      for (let k = 0; k < 4; k++) {
        const f = (t * 1.8 + k / 4) % 1;
        alfa(c, 1 - f, () => L(c, x - 40 * s + k * 20 * s, y + 2 * s + f * 20 * s, x - 30 * s + k * 20 * s, y + 2 * s + f * 20 * s, "#C8DCE0", 3 * s));
      }
    [-1, 1].forEach((l) => {
      R(c, x + l * 46 * s - 7 * s, y - 120 * s, 14 * s, 124 * s, l < 0 ? C.maderaSombra : C.madera);
    });
    R(c, x - 54 * s, y - 126 * s, 108 * s, 12 * s, C.maderaVieja);
    // la tabla
    R(c, x - 40 * s, ty - 40 * s, 80 * s, 40 * s, C.maderaLuz);
    for (let k = 1; k < 4; k++) L(c, x - 40 * s, ty - k * 10 * s, x + 40 * s, ty - k * 10 * s, C.madera, 1.5 * s);
    L(c, x, ty - 40 * s, x, y - 114 * s, C.hierro, 3 * s);
    // la palanca: baja con la compuerta cerrada, arriba con la compuerta abierta
    const px = x + 46 * s,
      py = y - 110 * s,
      a = o.abierta ? -0.9 : 0.35;
    L(c, px, py, px + Math.cos(a) * 110 * s, py + Math.sin(a) * 110 * s, C.maderaSombra, 6 * s);
    E(c, px + Math.cos(a) * 110 * s, py + Math.sin(a) * 110 * s, 6 * s, 6 * s, C.hierro);
    E(c, px, py, 6 * s, 6 * s, C.hierroLuz);
  }

  // El canal (se pinta en el piso): una zanja forrada de tablas de (x, y) a (o.x2, o.y2); o.agua: con caudal.
  function canal(c, x, y, t, o) {
    const x2 = o.x2,
      y2 = o.y2,
      l = Math.hypot(x2 - x, y2 - y) || 1,
      nx = -(y2 - y) / l,
      ny = (x2 - x) / l,
      w = o.ancho || 46;
    const borde = (k) => [x + nx * k, y + ny * k, x2 + nx * k, y2 + ny * k];
    const [a1, b1, a2, b2] = borde(w + 14),
      [c1, d1, c2, d2] = borde(-w - 14);
    P(c, [a1, b1, a2, b2, c2, d2, c1, d1], C.maderaSombra);
    const [e1, f1, e2, f2] = borde(w),
      [g1, h1, g2, h2] = borde(-w);
    P(c, [e1, f1, e2, f2, g2, h2, g1, h1], o.agua ? AGUA[1] : AGUA[0]);
    const n = Math.round(l / 50);
    for (let k = 0; k <= n; k++) {
      const u = k / n,
        px = x + (x2 - x) * u,
        py = y + (y2 - y) * u;
      L(c, px + nx * (w + 14), py + ny * (w + 14), px + nx * w, py + ny * w, C.madera, 3);
      L(c, px - nx * (w + 14), py - ny * (w + 14), px - nx * w, py - ny * w, C.madera, 3);
      if (o.agua && k % 2) L(c, px - nx * w * 0.5, py - ny * w * 0.5, px + nx * w * 0.3 + (x2 - x) * 0.02, py + ny * w * 0.3 + (y2 - y) * 0.02, AGUA[2], 2);
    }
  }

  // El galpón de la sierra: abierto de costado, con la sierra de marco, el tronco a medio cortar sobre el carro y el
  // dintel tallado con la marca de la familia (sin letras: la frase sale al examinarlo). o.sierra: la hoja trabaja.
  function galponSierra(c, x, y, t, o) {
    const s = o.s || 1,
      w = 190 * s,
      h = 150 * s,
      sube = o.sierra ? Math.sin(t * 7) * 16 * s : 0;
    sombra(c, x + 20 * s, y + 6 * s, 220 * s, 28 * s, 0.36);
    // el piso de tablas y la pared del fondo
    P(c, [x - w, y, x + w, y, x + w - 20 * s, y - 30 * s, x - w + 20 * s, y - 30 * s], C.maderaVieja);
    P(c, [x - w + 20 * s, y - 30 * s, x - w + 20 * s, y - h, x + w - 20 * s, y - h, x + w - 20 * s, y - 30 * s], C.maderaSombra);
    for (let k = 1; k < 9; k++) L(c, x - w + 20 * s + k * 42 * s, y - 30 * s, x - w + 20 * s + k * 42 * s, y - h, "#463020", 2 * s);
    // aserrín
    P(c, poli(x - 30 * s, y - 8 * s, 70 * s, 12 * s, 10, 0.4), "#C8A878");
    P(c, poli(x - 40 * s, y - 10 * s, 40 * s, 7 * s, 10, 0.8), "#DCC090");
    // la sierra de marco: dos guías y el bastidor con la hoja
    [-30, 30].forEach((dx) => R(c, x + dx * s - 6 * s, y - h + 6 * s, 12 * s, h - 20 * s, C.madera));
    const by = y - 112 * s + sube;
    R(c, x - 40 * s, by - 8 * s, 80 * s, 10 * s, C.maderaLuz);
    R(c, x - 40 * s, by + 60 * s, 80 * s, 10 * s, C.maderaLuz);
    L(c, x, by, x, by + 62 * s, "#B8BCC0", 3 * s);
    for (let k = 0; k < 8; k++) P(c, [x, by + 4 * s + k * 7 * s, x + 4 * s, by + 7 * s + k * 7 * s, x, by + 10 * s + k * 7 * s], "#8A8E92");
    // el tronco sobre el carro: entra desde la izquierda, con el corte a mitad y la madera clara recién abierta
    R(c, x - 170 * s, y - 40 * s, 230 * s, 8 * s, C.maderaSombra);
    P(c, [x - 176 * s, y - 44 * s, x - 176 * s, y - 92 * s, x + 4 * s, y - 92 * s, x + 4 * s, y - 44 * s], C.tronco);
    P(c, [x - 176 * s, y - 80 * s, x - 176 * s, y - 92 * s, x + 4 * s, y - 92 * s, x + 4 * s, y - 80 * s], C.corteza);
    L(c, x - 176 * s, y - 68 * s, x, y - 68 * s, "#E8D2A8", 3 * s);
    E(c, x - 176 * s, y - 68 * s, 12 * s, 24 * s, "#C8A878");
    E(c, x - 176 * s, y - 68 * s, 6 * s, 14 * s, "#A88858");
    // los postes del frente y el techo
    [-w, -w / 3, w / 3, w].forEach((dx, i) => R(c, x + dx - 8 * s, y - h - 10 * s, 16 * s, h + 10 * s, i % 3 ? C.madera : C.maderaSombra));
    P(c, [x - w - 30 * s, y - h - 10 * s, x - w + 10 * s, y - h - 80 * s, x + w - 10 * s, y - h - 80 * s, x + w + 30 * s, y - h - 10 * s], C.maderaVieja);
    P(c, [x - w + 10 * s, y - h - 80 * s, x + w - 10 * s, y - h - 80 * s, x + w + 30 * s, y - h - 10 * s, x, y - h - 10 * s], "#6E5840");
    for (let k = 1; k < 12; k++) L(c, x - w + k * 32 * s, y - h - 80 * s, x - w - 22 * s + k * 35 * s, y - h - 10 * s, C.maderaSombra, 1.5 * s);
    // el dintel tallado: una viga con una banda de nudos y la marca de la familia al centro
    R(c, x - w - 10 * s, y - h - 26 * s, w * 2 + 20 * s, 26 * s, C.madera);
    R(c, x - w - 10 * s, y - h - 26 * s, w * 2 + 20 * s, 4 * s, C.maderaLuz);
    for (let k = 0; k < 14; k++) {
      const dx = x - w + 10 * s + k * 27 * s;
      if (Math.abs(dx - x) < 30 * s) continue;
      c.strokeStyle = C.maderaSombra;
      c.lineWidth = 2 * s;
      c.beginPath();
      c.arc(dx, y - h - 13 * s, 7 * s, 0, Math.PI, k % 2 === 0);
      c.stroke();
    }
    marca(c, x, y - h - 4 * s, 20 * s, C.maderaSombra, 3 * s);
    if (o.brillo) halo(c, x, y - h - 13 * s, 60 * s, "#FFD98A", 0.4);
  }

  // El patio de troncos: una pila en pirámide con las caras cortadas mirando al frente y la marca de la familia.
  function pilaTroncos(c, x, y, t, o) {
    const s = o.s || 1,
      r = azar((o.sem || 1) * 17),
      filas = o.filas || 3;
    sombra(c, x + 10 * s, y + 4 * s, (filas * 34 + 30) * s, 16 * s);
    // los largos de los troncos hacia atrás
    P(c, [x - filas * 34 * s, y - 4 * s, x - filas * 34 * s + 40 * s, y - 40 * s - filas * 50 * s, x + filas * 34 * s + 40 * s, y - 40 * s - filas * 50 * s, x + filas * 34 * s, y - 4 * s], C.tronco);
    for (let f = 0; f < filas; f++) {
      const n = filas - f + 1;
      for (let k = 0; k < n; k++) {
        const rr = (28 + r() * 6) * s,
          px = x + (k - (n - 1) / 2) * 62 * s,
          py = y - 30 * s - f * 52 * s;
        E(c, px, py, rr, rr * 0.96, C.corteza);
        E(c, px, py, rr - 5 * s, rr * 0.96 - 5 * s, "#C8A878");
        E(c, px + 2 * s, py, rr * 0.5, rr * 0.48, "#B8986A");
        E(c, px + 2 * s, py, 3 * s, 3 * s, "#8A6A44");
        if ((k + f + (o.sem || 0)) % 3 === 0) marca(c, px, py + rr * 0.55, rr * 1.1, "#6A4A2A", 2.4 * s);
      }
    }
  }

  // El torno con la rampa: el cilindro con la soga sobre dos caballetes y una rampa de troncos que baja hacia el agua.
  // o.gira: el cilindro enrolla; o.hx, o.hy: adónde va la soga (el buey).
  function tornoRampa(c, x, y, t, o) {
    const s = o.s || 1;
    // la rampa: troncos acostados que bajan a la derecha
    for (let k = 0; k < 7; k++) {
      const px = x + 70 * s + k * 34 * s,
        py = y + k * 12 * s;
      P(c, [px, py - 40 * s, px + 26 * s, py - 36 * s, px + 30 * s, py + 30 * s, px + 4 * s, py + 26 * s], k % 2 ? C.tronco : C.corteza);
    }
    sombra(c, x + 8 * s, y + 4 * s, 70 * s, 14 * s);
    [-1, 1].forEach((l) => {
      L(c, x + l * 50 * s, y - 80 * s, x + l * 66 * s, y, C.maderaSombra, 8 * s);
      L(c, x + l * 50 * s, y - 80 * s, x + l * 34 * s, y, C.madera, 8 * s);
    });
    R(c, x - 56 * s, y - 94 * s, 112 * s, 26 * s, C.tronco);
    const g = o.gira ? (t * 30) % 13 : 0;
    for (let k = 0; k < 8; k++) L(c, x - 48 * s + k * 13 * s + g * s, y - 94 * s, x - 44 * s + k * 13 * s + g * s, y - 68 * s, "#C8B48C", 2.5 * s);
    // el engranaje que recibe el eje de la rueda
    E(c, x - 66 * s, y - 81 * s, 18 * s, 18 * s, C.maderaSombra);
    for (let k = 0; k < 8; k++) {
      const a = (o.gira ? t * 2 : 0) + (k * TAU) / 8;
      L(c, x - 66 * s, y - 81 * s, x - 66 * s + Math.cos(a) * 22 * s, y - 81 * s + Math.sin(a) * 22 * s, C.madera, 4 * s);
    }
    if (o.hx != null) {
      L(c, x + 10 * s, y - 70 * s, o.hx, o.hy, "#C8B48C", 3);
      L(c, x + 10 * s, y - 70 * s, o.hx, o.hy, "#A8946C", 1);
    } else L(c, x + 10 * s, y - 70 * s, x + 40 * s, y + 10 * s, "#C8B48C", 2.5 * s);
  }

  // El buey hundido en el barro de la orilla. o.hundido 0..1 (1 = hasta la panza); o.arnes: ya tiene el arnés.
  function bueyBarro(c, x, y, t, o) {
    const s = o.s || 1,
      hd = (o.hundido != null ? o.hundido : 1) * 46 * s,
      lucha = o.hundido > 0.2 ? Math.sin(t * 3) * 3 * s : 0;
    P(c, poli(x, y, 120 * s, 40 * s, 14, 0.2), "#3A2E1E");
    P(c, poli(x, y, 100 * s, 32 * s, 14, 0.5), "#2A2016");
    c.save();
    c.beginPath();
    c.rect(x - 200 * s, y - 300 * s, 400 * s, 300 * s - 6 * s);
    c.clip();
    ASSETS.LISTA.buey.f(c, x + lucha, y + hd, t, { s, sem: 3 });
    if (o.arnes) {
      L(c, x + 40 * s + lucha, y - 84 * s + hd, x + 54 * s + lucha, y - 40 * s + hd, "#5E3C22", 6 * s);
      L(c, x - 20 * s + lucha, y - 92 * s + hd, x - 16 * s + lucha, y - 40 * s + hd, "#5E3C22", 6 * s);
      L(c, x - 20 * s + lucha, y - 70 * s + hd, x + 46 * s + lucha, y - 64 * s + hd, "#7A5030", 5 * s);
    }
    c.restore();
    // el barro que lo traga, con burbujas
    P(c, poli(x, y - 4 * s, 90 * s, 18 * s, 12, 0.7), "#30261A");
    if (o.hundido > 0.2)
      for (let k = 0; k < 3; k++) {
        const f = (t * 0.7 + k / 3) % 1;
        alfa(c, 1 - f, () => E(c, x - 50 * s + k * 50 * s, y - 4 * s, (3 + f * 6) * s, (2 + f * 3) * s, "#4A3A28"));
      }
  }

  // El banco de Orm con el taco de cortar (lleva tallada la marca de la familia) y un cuaderno encima.
  function bancoTaco(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 6 * s, y + 4 * s, 80 * s, 12 * s);
    R(c, x - 70 * s, y - 34 * s, 100 * s, 10 * s, C.madera);
    R(c, x - 70 * s, y - 34 * s, 100 * s, 3 * s, C.maderaLuz);
    R(c, x - 64 * s, y - 24 * s, 7 * s, 24 * s, C.maderaSombra);
    R(c, x + 18 * s, y - 24 * s, 7 * s, 24 * s, C.maderaSombra);
    R(c, x - 40 * s, y - 42 * s, 26 * s, 8 * s, "#6E4A2E");
    // el taco
    P(c, [x + 40 * s, y, x + 40 * s, y - 50 * s, x + 84 * s, y - 50 * s, x + 84 * s, y], C.tronco);
    E(c, x + 62 * s, y - 50 * s, 22 * s, 8 * s, "#C8A878");
    marca(c, x + 62 * s, y - 8 * s, 32 * s, "#2A1E14", 2.5 * s);
    L(c, x + 66 * s, y - 52 * s, x + 76 * s, y - 86 * s, C.maderaSombra, 4 * s);
    P(c, [x + 58 * s, y - 52 * s, x + 74 * s, y - 50 * s, x + 70 * s, y - 64 * s], C.hierro);
  }

  // La leñera: un alero contra el corral con la leña partida en hileras.
  function lenera(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 10 * s, y + 4 * s, 100 * s, 14 * s);
    [-80, 80].forEach((dx) => R(c, x + dx * s - 5 * s, y - 110 * s, 10 * s, 110 * s, C.maderaSombra));
    for (let f = 0; f < 5; f++)
      for (let k = 0; k < 9; k++) {
        const px = x - 70 * s + k * 17.5 * s,
          py = y - 10 * s - f * 18 * s;
        const rr = (7 + ((k * 7 + f * 3) % 4)) * s;
        E(c, px, py, rr + 2 * s, rr + 1 * s, (k + f) % 2 ? C.corteza : C.tronco);
        P(c, [px - rr, py + rr * 0.6, px, py - rr, px + rr, py + rr * 0.6], (k + f) % 3 ? "#C8A878" : "#B08A58");
      }
    P(c, [x - 100 * s, y - 104 * s, x - 90 * s, y - 130 * s, x + 96 * s, y - 130 * s, x + 106 * s, y - 104 * s], C.maderaVieja);
    P(c, [x - 90 * s, y - 130 * s, x + 96 * s, y - 130 * s, x + 90 * s, y - 136 * s, x - 84 * s, y - 136 * s], "#4E6B3A");
  }

  // La grada con la quilla de Sten (segunda visita): la quilla oscura, el corazón sano del tronco de linde, con sus
  // cuadernas; las marcas de Orm y de Sten talladas juntas. o.enfermas: las partes enfermas apartadas al costado.
  function gradaQuilla(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 20 * s, y + 6 * s, 240 * s, 24 * s, 0.34);
    // los rieles de la grada, bajando hacia el agua (a la derecha)
    L(c, x - 220 * s, y - 20 * s, x + 220 * s, y + 10 * s, C.maderaSombra, 10 * s);
    L(c, x - 220 * s, y + 10 * s, x + 220 * s, y + 40 * s, C.maderaSombra, 10 * s);
    [-160, -60, 40, 140].forEach((dx) => {
      R(c, x + dx * s - 10 * s, y - 50 * s + dx * 0.07 * s, 20 * s, 50 * s, C.madera);
    });
    // la quilla oscura
    P(c, [x - 210 * s, y - 60 * s, x + 200 * s, y - 34 * s, x + 236 * s, y - 70 * s, x + 200 * s, y - 52 * s, x - 210 * s, y - 80 * s], "#3A2A1E");
    P(c, [x - 210 * s, y - 80 * s, x + 200 * s, y - 52 * s, x + 236 * s, y - 70 * s, x - 206 * s, y - 88 * s], "#4E3A28");
    // la roda que sube
    L(c, x + 220 * s, y - 64 * s, x + 250 * s, y - 170 * s, "#3A2A1E", 12 * s);
    // las cuadernas
    for (let k = 0; k < 6; k++) {
      const px = x - 150 * s + k * 62 * s,
        py = y - 70 * s + k * 4 * s,
        a = 60 + k * 4;
      c.strokeStyle = "#4A3626";
      c.lineWidth = 7 * s;
      c.beginPath();
      c.moveTo(px - a * s, py - 90 * s);
      c.quadraticCurveTo(px - a * 0.7 * s, py, px, py);
      c.quadraticCurveTo(px + a * 0.7 * s, py, px + a * s, py - 90 * s);
      c.stroke();
    }
    marca(c, x - 120 * s, y - 64 * s, 18 * s, "#C8A878", 2 * s);
    marcaSten(c, x - 90 * s, y - 62 * s, 18 * s, "#C8A878", 2 * s);
    if (o.enfermas) {
      // los trozos enfermos: madera gris con vetas violeta, separados y apilados aparte
      const ex = x - 300 * s,
        ey = y + 30 * s;
      for (let k = 0; k < 3; k++) {
        const px = ex + k * 34 * s,
          py = ey - k * 10 * s;
        P(c, [px - 40 * s, py, px - 36 * s, py - 30 * s, px + 30 * s, py - 34 * s, px + 36 * s, py - 4 * s], "#5A5458");
        L(c, px - 30 * s, py - 14 * s, px + 24 * s, py - 20 * s, "#6A4A8A", 2 * s);
        L(c, px - 10 * s, py - 6 * s, px + 14 * s, py - 28 * s, "#6A4A8A", 1.5 * s);
      }
    }
  }

  // ============================== EL SANTUARIO ==============================

  // Escalones de piedra comidos por raíces (se pintan en el piso), de (x, y) a (o.x2, o.y2).
  function escalonesRaices(c, x, y, t, o) {
    const x2 = o.x2,
      y2 = o.y2,
      l = Math.hypot(x2 - x, y2 - y) || 1,
      ux = (x2 - x) / l,
      uy = (y2 - y) / l,
      nx = -uy,
      ny = ux,
      w = o.ancho || 120,
      r = azar((o.sem || 1) * 41),
      n = Math.floor(l / 76);
    for (let k = 0; k <= n; k++) {
      const px = x + ux * k * 76,
        py = y + uy * k * 76,
        ww = w * (0.85 + r() * 0.25);
      const q = [px + nx * ww, py + ny * ww, px + nx * ww + ux * 52, py + ny * ww + uy * 52, px - nx * ww + ux * 52, py - ny * ww + uy * 52, px - nx * ww, py - ny * ww];
      P(c, q.map((v, i) => v + (i % 2 ? 6 : 0)), "#2E3230");
      P(c, q, k % 2 ? PIEDRA[1] : PIEDRA[2]);
      if (r() < 0.6) P(c, [px + nx * ww * 0.6, py + ny * ww * 0.6, px + nx * ww * 0.9 + ux * 20, py + ny * ww * 0.9 + uy * 20, px + nx * ww * 0.5 + ux * 30, py + ny * ww * 0.5 + uy * 30], C.musgo2);
      // una raíz que cruza el escalón
      if (r() < 0.55) {
        const s0 = r() < 0.5 ? 1 : -1;
        c.strokeStyle = C.tronco;
        c.lineWidth = 10;
        c.lineCap = "round";
        c.beginPath();
        c.moveTo(px + nx * s0 * (ww + 50), py + ny * s0 * (ww + 50) + 10);
        c.quadraticCurveTo(px + ux * 30, py + uy * 30 - 6, px - nx * s0 * ww * 0.4 + ux * 60, py - ny * s0 * ww * 0.4 + uy * 60);
        c.stroke();
        c.strokeStyle = C.corteza;
        c.lineWidth = 4;
        c.stroke();
      }
    }
  }

  // Estela antigua: piedra alta y gastada, como los mojones del Refugio pero mucho más vieja. o.luz 0..1 (la runa).
  function estela(c, x, y, t, o) {
    const s = o.s || 1,
      inc = (o.inclina || 0) * s,
      f = o.luz || 0,
      runa = o.runa || "algiz";
    sombra(c, x + 8 * s, y + 4 * s, 36 * s, 10 * s);
    P(c, [x - 28 * s, y + 4 * s, x - 24 * s, y - 120 * s + inc, x - 16 * s + inc, y - 176 * s, x + 6 * s + inc, y - 186 * s, x + 20 * s + inc, y - 172 * s, x + 26 * s, y - 120 * s, x + 28 * s, y + 4 * s], PIEDRA[1]);
    P(c, [x + 4 * s, y + 4 * s, x + 6 * s + inc, y - 186 * s, x + 20 * s + inc, y - 172 * s, x + 26 * s, y - 120 * s, x + 28 * s, y + 4 * s], PIEDRA[2]);
    P(c, [x - 28 * s, y + 4 * s, x - 26 * s, y - 50 * s, x - 6 * s, y - 30 * s, x + 6 * s, y + 4 * s], C.musgo2);
    P(c, [x - 16 * s + inc, y - 176 * s, x + 6 * s + inc, y - 186 * s, x + 2 * s + inc, y - 168 * s, x - 14 * s + inc, y - 162 * s], C.musgo);
    // grietas
    L(c, x - 10 * s, y - 40 * s, x - 2 * s, y - 70 * s, "#2E3234", 1.5 * s);
    L(c, x + 12 * s, y - 130 * s, x + 4 * s, y - 150 * s, "#2E3234", 1.5 * s);
    FUTHARK.dibujar(c, runa, x - 2 * s + inc * 0.5, y - 84 * s, 54 * s, "#2E3234", 6 * s);
    if (f > 0.02) {
      alfa(c, Math.min(1, f), () => FUTHARK.dibujar(c, runa, x - 2 * s + inc * 0.5, y - 84 * s, 54 * s, RUNICO, 3.5 * s));
      halo(c, x, y - 110 * s, 80 * s, RUNICO, f * 0.6);
    }
  }

  // El árbol colosal con el portal: un portal de piedra de unos 7 m encajado en la base, con las raíces que abrazan el
  // dintel y bajan como columnas; columnas talladas con el ciervo y el árbol; luz azul fina por las rendijas que
  // respira despacio. o.visto: el sello ya despertó (la luz es más clara).
  function arbolPortal(c, x, y, t, o) {
    const s = o.s || 1,
      resp = 0.55 + Math.sin(t * 0.7) * 0.45,
      altaQ = nivel() !== "baja";
    sombra(c, x + 30 * s, y + 10 * s, 560 * s, 70 * s, 0.4);
    // el tronco colosal
    P(c, [x - 580 * s, y, x - 400 * s, y - 90 * s, x - 300 * s, y - 260 * s, x - 270 * s, y - 700 * s, x - 250 * s, y - 1300 * s, x + 250 * s, y - 1300 * s, x + 280 * s, y - 700 * s, x + 310 * s, y - 260 * s, x + 420 * s, y - 90 * s, x + 600 * s, y], C.troncoSombra);
    P(c, [x + 40 * s, y - 1300 * s, x + 250 * s, y - 1300 * s, x + 280 * s, y - 700 * s, x + 310 * s, y - 260 * s, x + 420 * s, y - 90 * s, x + 600 * s, y, x + 160 * s, y], C.tronco);
    // los contrafuertes de las raíces a los costados
    [[-1, 520], [1, 540], [-1, 380], [1, 400]].forEach(([l, dx], i) => P(c, [x + l * dx * s, y + 6 * s, x + l * (dx - 90) * s, y - (i < 2 ? 200 : 320) * s, x + l * (dx - 150) * s, y - (i < 2 ? 160 : 260) * s, x + l * (dx - 60) * s, y + 6 * s], i % 2 ? C.corteza : C.tronco));
    for (let k = 0; k < 9; k++) {
      const dx = -220 + k * 55;
      L(c, x + dx * s, y - 1280 * s, x + dx * 1.25 * s, y - 280 * s, k % 2 ? C.corteza : "#3A2A1E", 5 * s);
    }
    // musgo en las grietas de la corteza
    [[-260, -600, 50, 120], [220, -880, 40, 140], [-180, -1000, 40, 90], [300, -420, 60, 80]].forEach(([dx, dy, w, h]) => E(c, x + dx * s, y + dy * s, w * s, h * s, C.musgo));
    // el portal de piedra
    const pw = 160 * s,
      ph = 424 * s;
    P(c, [x - pw - 50 * s, y, x - pw - 50 * s, y - ph + 60 * s, x - pw + 10 * s, y - ph - 30 * s, x + pw - 10 * s, y - ph - 30 * s, x + pw + 50 * s, y - ph + 60 * s, x + pw + 50 * s, y], PIEDRA[0]);
    // las columnas talladas: el ciervo a la izquierda, el árbol a la derecha
    [[-1, "ciervo"], [1, "arbol"]].forEach(([l, motivo]) => {
      const cx = x + l * (pw + 18 * s);
      R(c, cx - 30 * s, y - ph + 50 * s, 60 * s, ph - 50 * s, l < 0 ? PIEDRA[1] : PIEDRA[2]);
      R(c, cx - 36 * s, y - ph + 40 * s, 72 * s, 20 * s, PIEDRA[0]);
      const my = y - 230 * s,
        col = "#2E3234";
      if (motivo === "ciervo") {
        E(c, cx, my, 16 * s, 10 * s, col);
        L(c, cx + 12 * s, my - 4 * s, cx + 18 * s, my - 22 * s, col, 4 * s);
        L(c, cx + 18 * s, my - 22 * s, cx + 8 * s, my - 44 * s, col, 2.5 * s);
        L(c, cx + 18 * s, my - 22 * s, cx + 28 * s, my - 44 * s, col, 2.5 * s);
        L(c, cx + 13 * s, my - 34 * s, cx + 4 * s, my - 38 * s, col, 2 * s);
        [-10, -4, 6, 12].forEach((dx) => L(c, cx + dx * s, my + 6 * s, cx + dx * s, my + 26 * s, col, 2.5 * s));
      } else {
        L(c, cx, my + 30 * s, cx, my - 30 * s, col, 4 * s);
        [[-1, -10], [1, -18], [-1, -26]].forEach(([d, dy]) => L(c, cx, my + dy * s, cx + d * 18 * s, my + (dy - 14) * s, col, 2.5 * s));
        [[-1, 18], [1, 24]].forEach(([d, dy]) => L(c, cx, my + dy * s, cx + d * 16 * s, my + (dy + 12) * s, col, 2.5 * s));
      }
    });
    // la hoja de piedra cerrada y las rendijas con la luz
    P(c, [x - pw + 20 * s, y, x - pw + 20 * s, y - ph + 70 * s, x - pw + 60 * s, y - ph + 20 * s, x + pw - 60 * s, y - ph + 20 * s, x + pw - 20 * s, y - ph + 70 * s, x + pw - 20 * s, y], "#24272A");
    P(c, [x, y, x, y - ph + 20 * s, x + pw - 60 * s, y - ph + 20 * s, x + pw - 20 * s, y - ph + 70 * s, x + pw - 20 * s, y], "#2C3034");
    const lz = (o.visto ? 0.75 : 0.45) * (0.6 + resp * 0.4);
    if (altaQ) halo(c, x, y - ph * 0.5, 260 * s, RUNICO, lz * 0.55);
    alfa(c, lz, () => {
      L(c, x, y - 6 * s, x, y - ph + 26 * s, RUNICO_CLARO, 4 * s);
      L(c, x - pw + 24 * s, y - 4 * s, x + pw - 24 * s, y - 4 * s, RUNICO, 3 * s);
      L(c, x - 60 * s, y - ph + 24 * s, x + 60 * s, y - ph + 24 * s, RUNICO, 2 * s);
      L(c, x - 70 * s, y - 180 * s, x - 40 * s, y - 230 * s, RUNICO, 1.5 * s);
      L(c, x + 50 * s, y - 120 * s, x + 80 * s, y - 160 * s, RUNICO, 1.5 * s);
    });
    // el dintel con runas casi apagadas
    R(c, x - pw - 60 * s, y - ph - 30 * s, (pw + 60 * s) * 2, 44 * s, PIEDRA[1]);
    R(c, x - pw - 60 * s, y - ph - 30 * s, (pw + 60 * s) * 2, 6 * s, PIEDRA[2]);
    ["othala", "algiz", "eihwaz", "dagaz", "ingwaz"].forEach((nom, i) => {
      const rx = x + (i - 2) * 58 * s;
      FUTHARK.dibujar(c, nom, rx, y - ph + 8 * s, 30 * s, "#2E3234", 4 * s);
      alfa(c, 0.15 + lz * 0.4, () => FUTHARK.dibujar(c, nom, rx, y - ph + 8 * s, 30 * s, RUNICO, 2 * s));
    });
    // las raíces que abrazan el dintel y bajan como columnas
    [[-1, 0], [1, 0], [-1, 1], [1, 1]].forEach(([l, k]) => {
      const x0 = x + l * (k ? 520 : 300) * s,
        x1 = x + l * (pw + (k ? 90 : 60) * s),
        yb = y + 10 * s;
      c.strokeStyle = C.troncoSombra;
      c.lineCap = "round";
      c.lineWidth = (k ? 46 : 60) * s;
      c.beginPath();
      c.moveTo(x0, yb);
      c.quadraticCurveTo(x0 - l * 40 * s, y - ph * 0.6, x1, y - ph - 30 * s);
      c.quadraticCurveTo(x + l * 40 * s, y - ph - 120 * s, x - l * 60 * s, y - ph - 60 * s);
      c.stroke();
      c.strokeStyle = l > 0 ? C.corteza : C.tronco;
      c.lineWidth = (k ? 22 : 30) * s;
      c.stroke();
    });
    // la copa colosal: masas de follaje oscuro muy arriba
    const r = azar(4242);
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * TAU,
        mx = x + Math.cos(a) * (360 + r() * 260) * s,
        my = y - 1400 * s + Math.sin(a) * (180 + r() * 90) * s,
        mr = (220 + r() * 120) * s;
      P(c, poli(mx, my, mr, mr * 0.62, 9, r()), C.roble[k % 3]);
    }
    for (let k = 0; k < 7; k++) P(c, poli(x - 200 * s + k * 70 * s, y - 1520 * s - (k % 2) * 60 * s, 200 * s, 130 * s, 9, k), k % 2 ? C.roble[2] : C.robleLuz);
  }

  // Los restos al pie del portal: lanzas, un escudo y huesos medio enterrados, de los que brotan las zarzas
  // espectrales traslúcidas que tejen una red sobre la puerta. o.onda: cuánto ondulan (al golpearlas).
  function restosZarzas(c, x, y, t, o) {
    const s = o.s || 1,
      w = (o.ancho || 230) * s,
      onda = o.onda || 0,
      r = azar(5150);
    // los restos
    P(c, poli(x, y, w * 1.05, 34 * s, 14, 0.3), "#2E2618");
    E(c, x - 90 * s, y - 8 * s, 34 * s, 12 * s, "#5A4A3A");
    E(c, x - 90 * s, y - 12 * s, 26 * s, 8 * s, "#6E5A44");
    E(c, x - 90 * s, y - 12 * s, 6 * s, 5 * s, C.hierro);
    L(c, x - 160 * s, y + 4 * s, x - 120 * s, y - 70 * s, C.maderaVieja, 4 * s);
    P(c, [x - 120 * s, y - 70 * s, x - 112 * s, y - 92 * s, x - 128 * s, y - 74 * s], C.hierro);
    L(c, x + 130 * s, y + 6 * s, x + 170 * s, y - 50 * s, C.maderaVieja, 4 * s);
    E(c, x + 40 * s, y - 6 * s, 14 * s, 11 * s, C.hueso);
    E(c, x + 36 * s, y - 6 * s, 4 * s, 3 * s, "#3A3028");
    E(c, x + 46 * s, y - 6 * s, 4 * s, 3 * s, "#3A3028");
    L(c, x + 60 * s, y - 2 * s, x + 110 * s, y - 8 * s, C.hueso, 5 * s);
    L(c, x - 30 * s, y + 2 * s, x - 10 * s, y - 14 * s, C.hueso, 4 * s);
    // las zarzas: brotan de los restos y suben tejiendo la red sobre el portal
    const brillo = 0.5 + onda * 0.4;
    if (nivel() !== "baja") halo(c, x, y - 200 * s, w * 1.2, "#9A6BD8", 0.18 + onda * 0.3);
    alfa(c, Math.min(0.85, brillo), () => {
      const n = nivel() === "baja" ? 12 : 22;
      for (let k = 0; k < n; k++) {
        const bx = x - w + r() * w * 2,
          tx = x + (r() - 0.5) * w * 1.6,
          ty = y - (180 + r() * 260) * s;
        zarzaEspectral(c, bx, y - 4 * s, tx, ty, (r() < 0.5 ? -1 : 1) * (60 + r() * 90) * s, t, k, s, onda);
      }
    });
  }

  // El sello: un círculo de piedra sobre un pedestal bajo, con el signo del Núcleo grabado y una concavidad lisa en el
  // medio, pulida como por una mano apoyada muchas veces. o.visto: la Lente lo despertó.
  function selloPiedra(c, x, y, t, o) {
    const s = o.s || 1,
      lat = 0.8 + Math.sin(t * 1.6) * 0.2;
    sombra(c, x + 6 * s, y + 4 * s, 50 * s, 12 * s);
    P(c, [x - 40 * s, y, x - 36 * s, y - 40 * s, x + 36 * s, y - 40 * s, x + 40 * s, y], PIEDRA[0]);
    P(c, [x + 10 * s, y, x + 10 * s, y - 40 * s, x + 36 * s, y - 40 * s, x + 40 * s, y], PIEDRA[1]);
    const cy = y - 84 * s;
    if (o.visto) halo(c, x, cy, 90 * s, RUNICO, 0.5 * lat);
    E(c, x + 3 * s, cy + 3 * s, 46 * s, 44 * s, "#2E3234");
    E(c, x, cy, 46 * s, 44 * s, PIEDRA[2]);
    E(c, x - 4 * s, cy - 4 * s, 40 * s, 38 * s, "#6A6E70");
    const col = o.visto ? RUNICO_CLARO : "#3A3E40";
    c.strokeStyle = col;
    c.lineWidth = 2.5 * s;
    c.beginPath();
    c.arc(x, cy, 36 * s, 0, TAU);
    c.stroke();
    // el signo, alrededor de la concavidad
    signo(c, x, cy, 60 * s, col, 2.5 * s);
    // la concavidad gastada: más oscura al fondo y con el borde pulido
    E(c, x, cy, 15 * s, 14 * s, "#7C8082");
    E(c, x + 1 * s, cy + 1 * s, 12 * s, 11 * s, "#4A4E50");
    E(c, x + 3 * s, cy + 3 * s, 7 * s, 6 * s, "#3A3E40");
    alfa(c, 0.5, () => E(c, x - 6 * s, cy - 6 * s, 5 * s, 3 * s, "#B8BCBE"));
  }

  // La loma del mirador (se pinta en el piso): una elevación de roca con pasto arriba y un frente de piedra que cae al
  // sur; o.r: radio; la subida es una rampa de lajas que sale hacia o.lado (−1 izquierda, 1 derecha).
  function lomaMirador(c, x, y, t, o) {
    const s = o.s || 1,
      rr = (o.r || 300) * s,
      r = azar(777);
    const jit = Array.from({ length: 18 }, () => 0.85 + r() * 0.25);
    // la cara de piedra que cae hacia el sur
    P(c, poli(x, y + 70 * s, rr * 1.04, rr * 0.5, 18, 0.2, jit), "#2A2E2C");
    P(c, poli(x, y + 40 * s, rr * 1.02, rr * 0.5, 18, 0.2, jit), PIEDRA[0]);
    for (let k = 0; k < 10; k++) {
      const a = 0.3 + (k / 9) * (Math.PI - 0.6),
        px = x + Math.cos(a) * rr * 0.95,
        py = y + Math.sin(a) * rr * 0.47;
      L(c, px, py, px + (r() - 0.5) * 20, py + 60 * s, "#2E3234", 3 * s);
    }
    // la cima con pasto
    P(c, poli(x, y, rr, rr * 0.48, 18, 0.2, jit), C.pastoSombra);
    P(c, poli(x - 10 * s, y - 6 * s, rr * 0.86, rr * 0.4, 18, 0.5, jit), C.pasto);
    for (let k = 0; k < 14; k++) {
      const a = r() * TAU,
        d = r() * 0.8;
      P(c, poli(x + Math.cos(a) * rr * d, y + Math.sin(a) * rr * 0.4 * d, (14 + r() * 12) * s, (8 + r() * 6) * s, 6, r()), r() < 0.5 ? C.musgoClaro : C.musgo2);
    }
    // la rampa de lajas
    const l = o.lado || -1;
    for (let k = 0; k < 6; k++) {
      const px = x + l * (rr * 0.8 + k * 50 * s),
        py = y + 30 * s + k * 34 * s;
      P(c, poli(px, py, 56 * s, 22 * s, 7, k + 0.3), k % 2 ? PIEDRA[1] : PIEDRA[2]);
    }
  }

  // El cofre del mirador, envuelto por un anillo chico de zarzas espectrales: hoy no se puede abrir.
  function cofreZarzas(c, x, y, t, o) {
    const s = o.s || 1,
      r = azar(6061);
    ASSETS.LISTA.arconLenador.f(c, x, y, t, { s: 1.3 * s });
    if (o.quemado) return;
    if (nivel() !== "baja") halo(c, x, y - 30 * s, 110 * s, "#9A6BD8", 0.22);
    alfa(c, 0.7, () => {
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * TAU,
          bx = x + Math.cos(a) * 64 * s,
          by = y + Math.sin(a) * 26 * s;
        zarzaEspectral(c, bx, by, x + Math.cos(a + 1.2) * 30 * s, y - (50 + r() * 40) * s, (r() - 0.5) * 50 * s, t, k, s * 0.7, 0);
      }
    });
  }

  // ======================================================================
  //  ARMADOS CON CARAS (todo girable, comun/volumen.js)
  // ======================================================================
  const T = C.T,
    TP = PIEDRA,
    TAGUA = AGUA,
    CLARA = ["#8A6A40", "#B08A58", "#C8A070"];
  // la rueda de agua dibujada en su plano (centro en cx, cy de la cara)
  function ruedaPlana(cc, cx, cy, rr, a0) {
    cc.strokeStyle = C.maderaSombra;
    cc.lineWidth = 16;
    cc.beginPath();
    cc.arc(cx, cy, rr, 0, TAU);
    cc.stroke();
    cc.strokeStyle = C.madera;
    cc.lineWidth = 7;
    cc.beginPath();
    cc.arc(cx, cy, rr - 26, 0, TAU);
    cc.stroke();
    for (let k = 0; k < 8; k++) {
      const a = a0 + (k * TAU) / 8;
      L(cc, cx, cy, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, C.maderaVieja, 7);
    }
    for (let k = 0; k < 16; k++) {
      const a = a0 + (k * TAU) / 16,
        b = a + 0.12;
      P(cc, [cx + Math.cos(a) * (rr - 8), cy + Math.sin(a) * (rr - 8), cx + Math.cos(a) * (rr + 26), cy + Math.sin(a) * (rr + 26), cx + Math.cos(b) * (rr + 26), cy + Math.sin(b) * (rr + 26), cx + Math.cos(b) * (rr - 8), cy + Math.sin(b) * (rr - 8)], k % 2 ? C.maderaLuz : C.madera);
    }
    E(cc, cx, cy, 22, 22, C.hierro);
  }
  // la rueda de agua: el pilar de piedra atrás, la rueda (dos aros con sus paletas, a los dos lados del eje), el eje
  // hacia el galpón, la canaleta sobre patas que le trae el agua y el agua donde muerde
  function ruedaAguaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      rr = 150,
      zc = 170,
      a0 = o.gira ? t * 0.7 : 0.13,
      eje = o.eje || 260,
      lado = o.canaleta || 1,
      largo = o.largo || 150;
    if (!o.enRio)
      VOL.calco(c, pr, (cc) => {
        P(cc, poli(0, -6, 190, 34, 14, 0.3), TAGUA[0]);
        P(cc, poli(10, -8, 150, 24, 14, 0.6), TAGUA[1]);
      });
    const S = VOL.escena(pr);
    S.poner(0, -30, () => VOL.caja(c, pr, -40, -46, 0, 40, -22, 196, TP, { frente: (cc, l, h) => { R(cc, 0, -h, l, h, TP[1]); for (let k = 1; k < 7; k++) R(cc, 0, -k * 28, l, 2, TP[0]); } }));
    S.poner(-eje / 2, 0, () => {
      VOL.palo(c, pr, 0, 0, zc, -eje, 0, zc, 12, C.maderaSombra);
      if (o.enRio) for (let k = 1; k < eje / 90; k++) VOL.palo(c, pr, -k * 90, 0, zc - 6, -k * 90 - 6, 0, 0, 9, C.maderaSombra);
    }, zc);
    [-12, 12].forEach((w) =>
      S.poner(0, w, () =>
        VOL.plano(c, pr, -rr - 30, rr + 30, w, zc - rr - 30, zc + rr + 30, null, (cc, l, h) => ruedaPlana(cc, l / 2, -h / 2, rr, a0), (cc, l, h) => ruedaPlana(cc, l / 2, -h / 2, rr, -a0)),
      ),
    );
    // la canaleta: de la cresta de la rueda hacia el canal, un poco más arriba
    const k0 = [-10 * lado, 0, zc + rr + 30],
      k1 = [largo * lado, -20, zc + rr + 90];
    S.poner((k0[0] + k1[0]) / 2, -10, () => {
      [0.5, 0.95].forEach((u) => {
        const pu = k0[0] + (k1[0] - k0[0]) * u,
          pw = k0[1] + (k1[1] - k0[1]) * u,
          pz = k0[2] + (k1[2] - k0[2]) * u;
        VOL.palo(c, pr, pu, pw - 10, pz - 8, pu, pw - 14, pz - 98, 7, C.maderaSombra);
        VOL.palo(c, pr, pu, pw + 10, pz - 8, pu, pw + 14, pz - 98, 7, C.madera);
      });
      VOL.palo(c, pr, ...k0, ...k1, 24, C.madera);
      VOL.palo(c, pr, k0[0], k0[1], k0[2] + 9, k1[0], k1[1], k1[2] + 9, 10, o.gira ? TAGUA[2] : C.maderaSombra);
    }, zc + rr);
    S.dibujar();
    const q = pr(k0[0], 0, k0[2]);
    if (o.gira) {
      for (let k = 0; k < 4; k++) {
        const f = (t * 2.4 + k / 4) % 1;
        alfa(c, 0.8 - f * 0.5, () => R(c, q[0] - 24 * pr.s + k * 6 * pr.s, q[1] + f * 60 * pr.s, 20 * pr.s, 26 * pr.s, TAGUA[2]));
      }
      VOL.calco(c, pr, (cc) => { for (let k = 0; k < 6; k++) E(cc, -120 + k * 48 + Math.sin(t * 5 + k) * 6, 14, 14, 5, "#C8DCE0"); });
    } else {
      const g = (t * 0.8) % 1;
      E(c, q[0], q[1] + (14 + g * 70) * pr.s, 3 * pr.s, 5 * pr.s, TAGUA[2]);
    }
    if (o.enRio) VOL.plano(c, pr, -200, 200, 24, 0, 40, "#2A4C56");
  }
  // la compuerta: dos postes, el travesaño, la tabla que sube, la varilla y la palanca larga
  function compuertaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      sube = o.abierta ? 56 : 0,
      a = o.abierta ? 0.9 : -0.35;
    VOL.calco(c, pr, (cc) => {
      P(cc, poli(0, 4, 70, 18, 10, 0.2), TAGUA[o.abierta ? 1 : 0]);
      if (o.abierta)
        for (let k = 0; k < 4; k++) {
          const f = (t * 1.8 + k / 4) % 1;
          alfa(cc, 1 - f, () => L(cc, -40 + k * 20, 6 + f * 20, -30 + k * 20, 6 + f * 20, "#C8DCE0", 3));
        }
    });
    VOL.cubo(c, pr, -46, 0, 14, 14, 124, T.oscura);
    VOL.cubo(c, pr, 46, 0, 14, 14, 124, T.madera);
    VOL.caja(c, pr, -54, -6, 114, 54, 6, 126, T.vieja);
    VOL.caja(c, pr, -40, -3, 30 + sube, 40, 3, 70 + sube, T.madera, { frente: (cc, l, h) => { R(cc, 0, -h, l, h, C.maderaLuz); for (let k = 1; k < 4; k++) R(cc, 0, -k * 10, l, 1.5, C.madera); } });
    VOL.palo(c, pr, 0, 0, 70 + sube, 0, 0, 114, 3, C.hierro);
    VOL.palo(c, pr, 46, 8, 110, 46 + Math.cos(a) * 110, 8, 110 + Math.sin(a) * 110, 6, C.maderaSombra);
    VOL.cubo(c, pr, 46 + Math.cos(a) * 110, 8, 10, 10, 10, T.hierro, null, 105 + Math.sin(a) * 110);
  }
  // el canal: la zanja forrada de tablas, pintada en el piso de punta a punta
  function canalV(c, x, y, t, o) {
    const pr = VOL.prSeg(x, y, o.x2, o.y2, o),
      l = pr.largo,
      w = o.ancho || 46,
      n = Math.max(1, Math.round(l / 50));
    VOL.enPiso(c, pr, (cc) => {
      R(cc, 0, -w - 14, l, (w + 14) * 2, C.maderaSombra);
      R(cc, 0, -w, l, w * 2, o.agua ? TAGUA[1] : TAGUA[0]);
      for (let k = 0; k <= n; k++) {
        const u = (k * l) / n;
        L(cc, u, -w - 14, u, -w, C.madera, 3);
        L(cc, u, w, u, w + 14, C.madera, 3);
        if (o.agua && k % 2) L(cc, u, -w * 0.5, u + l * 0.02, w * 0.3, TAGUA[2], 2);
      }
    });
  }
  // el galpón de la sierra: el piso, la pared del fondo, la sierra de marco, el tronco en el carro, los postes, el
  // techo y el dintel tallado con la marca de la familia
  function galponSierraV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      w = 190,
      h = 150,
      sube = o.sierra ? Math.sin(t * 7) * 16 : 0;
    VOL.sombra(c, pr, 20, -20, 220, 80, 0.36);
    VOL.caja(c, pr, -w, -70, 0, w, 40, 6, T.vieja);
    VOL.calco(c, pr, (cc) => {
      P(cc, poli(-30, -8, 70, 12, 10, 0.4), "#C8A878");
      P(cc, poli(-40, -10, 40, 7, 10, 0.8), "#DCC090");
    }, 6);
    const S = VOL.escena(pr);
    S.poner(0, -70, () => VOL.caja(c, pr, -w + 20, -76, 6, w - 20, -66, h, T.oscura, { frente: (cc, l, hh) => { R(cc, 0, -hh, l, hh, C.maderaSombra); for (let k = 1; k < 9; k++) R(cc, (k * l) / 9, -hh, 2, hh, "#463020"); } }));
    S.poner(0, -10, () => {
      [-30, 30].forEach((u) => VOL.cubo(c, pr, u, -10, 12, 12, h - 14, T.madera, null, 6));
      const bz = 112 - sube;
      VOL.caja(c, pr, -40, -14, bz, 40, -6, bz + 10, T.madera, { tapa: C.maderaLuz });
      VOL.caja(c, pr, -40, -14, bz - 70, 40, -6, bz - 60, T.madera, { tapa: C.maderaLuz });
      VOL.palo(c, pr, 0, -10, bz, 0, -10, bz - 62, 3, "#B8BCC0");
    });
    S.poner(-86, 10, () => {
      VOL.caja(c, pr, -170, 0, 32, 60, 20, 40, T.oscura);
      VOL.rollo(c, pr, -176, 4, 10, 68, 24, T.tronco, { n: 8, corte: "#C8A878" });
    }, 40);
    [-w, -w / 3, w / 3, w].forEach((u, i) => S.poner(u, 30, () => VOL.cubo(c, pr, u, 30, 16, 16, h + 10, i % 3 ? T.madera : T.oscura)));
    S.dibujar();
    const dintel = (cc, l, hh) => {
      R(cc, 0, -hh, l, hh, C.madera);
      R(cc, 0, -hh, l, 4, C.maderaLuz);
      for (let k = 0; k < 14; k++) {
        const dx = 20 + k * 27;
        if (Math.abs(dx - l / 2) < 30) continue;
        cc.strokeStyle = C.maderaSombra;
        cc.lineWidth = 2;
        cc.beginPath();
        cc.arc(dx, -hh / 2, 7, 0, Math.PI, k % 2 === 0);
        cc.stroke();
      }
      marca(cc, l / 2, -4, 20, C.maderaSombra, 3);
    };
    VOL.caja(c, pr, -w - 10, 26, h + 10, w + 10, 38, h + 36, T.madera, { frente: dintel, atras: dintel });
    VOL.techo(c, pr, -w - 30, -90, w + 30, 50, h + 30, 70, T.vieja);
    if (o.brillo) VOL.halo(c, pr, 0, 38, h + 23, 60, "#FFD98A", 0.4);
  }
  // la pila de troncos: troncos acostados hacia el fondo, en pirámide, con la cara cortada adelante
  function pilaTroncosV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      r = azar((o.sem || 1) * 17),
      filas = o.filas || 3;
    VOL.sombra(c, pr, 10, -50, filas * 34 + 30, 90);
    const S = VOL.escena(pr);
    for (let f = 0; f < filas; f++) {
      const n = filas - f + 1;
      for (let k = 0; k < n; k++) {
        const rr = 28 + r() * 6,
          u = (k - (n - 1) / 2) * 62,
          z = 30 + f * 52;
        S.poner(u, -60, () => VOL.rollo(c, VOL.sub(pr, u, 0, 0, Math.PI / 2), 0, 130, 0, z, rr, T.tronco, { n: 9, corte: "#C8A878" }), z);
      }
    }
    S.dibujar();
  }
  // el torno: la rampa de troncos que baja al agua, los caballetes, el cilindro con la soga, el engranaje y la soga
  // hacia el buey (o.hx, o.hy: un punto del mundo)
  function tornoRampaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 8, 0, 70, 30);
    const S = VOL.escena(pr);
    for (let k = 0; k < 7; k++) {
      const u = 83 + k * 34;
      S.poner(u, 0, () => VOL.rollo(c, VOL.sub(pr, u, 0, 0, Math.PI / 2), -34, 34, 0, Math.max(6, 20 - k * 8), 13, k % 2 ? T.tronco : [C.troncoSombra, C.corteza, "#6E5640"], { n: 6 }));
    }
    S.poner(0, 0, () => {
      [-1, 1].forEach((l) => {
        VOL.palo(c, pr, l * 50, -16, 0, l * 50, 0, 80, 8, C.maderaSombra);
        VOL.palo(c, pr, l * 50, 16, 0, l * 50, 0, 80, 8, C.madera);
      });
      VOL.rollo(c, pr, -56, 56, 0, 81, 13, T.tronco, { n: 8, corte: C.corteza });
      const g = o.gira ? t * 2 : 0;
      VOL.plano(c, VOL.sub(pr, -66, 0, 0, Math.PI / 2), -24, 24, 0, 57, 105, null, (cc, l, h) => {
        E(cc, l / 2, -h / 2, 18, 18, C.maderaSombra);
        for (let k = 0; k < 8; k++) {
          const a = g + (k * TAU) / 8;
          L(cc, l / 2, -h / 2, l / 2 + Math.cos(a) * 22, -h / 2 + Math.sin(a) * 22, C.madera, 4);
        }
      });
    }, 81);
    S.dibujar();
    const q = pr(10, 0, 81);
    if (o.hx != null) {
      const [hx, hy] = VOL.rel(x, y, o.hx - x, o.hy - y);
      L(c, q[0], q[1], hx, hy, "#C8B48C", 3);
    } else {
      const e = pr(40, 0, 0);
      L(c, q[0], q[1], e[0], e[1], "#C8B48C", 2.5 * pr.s);
    }
  }
  // el banco con el taco: el banco, el cuaderno, el taco con la marca de la familia y el hacha clavada
  function bancoTacoV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 6, 0, 80, 30);
    VOL.cubo(c, pr, -60, 0, 7, 18, 24, T.oscura);
    VOL.cubo(c, pr, 22, 0, 7, 18, 24, T.oscura);
    VOL.caja(c, pr, -70, -12, 24, 30, 12, 34, T.madera, { tapa: C.maderaLuz });
    VOL.caja(c, pr, -40, -8, 34, -14, 8, 42, ["#4E3420", "#6E4A2E", "#8A5E3A"]);
    VOL.cilindro(c, pr, 62, 0, 22, 0, 50, T.tronco, { n: 9 });
    VOL.elipse(c, pr, 62, 0, 50.5, 19, 19, "#C8A878");
    VOL.plano(c, pr, 46, 78, 21, 2, 44, null, (cc, l, h) => marca(cc, l / 2, -6, 32, "#2A1E14", 2.5));
    VOL.palo(c, pr, 66, 0, 50, 76, 0, 86, 4, C.maderaSombra);
    VOL.caja(c, pr, 58, -2, 50, 72, 2, 62, T.hierro);
  }
  // la leñera: los postes, la leña partida en hileras (las puntas adelante y atrás) y el alero con tepe
  function leneraV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 10, 0, 100, 40);
    const puntas = (cc, l, h) => {
      for (let f = 0; f < 5; f++)
        for (let k = 0; k < 9; k++) {
          const px = 8 + k * 17.5,
            py = -10 - f * 18,
            rr = 7 + ((k * 7 + f * 3) % 4);
          E(cc, px, py, rr + 2, rr + 1, (k + f) % 2 ? C.corteza : C.tronco);
          P(cc, [px - rr, py + rr * 0.6, px, py - rr, px + rr, py + rr * 0.6], (k + f) % 3 ? "#C8A878" : "#B08A58");
        }
    };
    [-80, 80].forEach((u) => [-24, 24].forEach((w) => VOL.cubo(c, pr, u, w, 10, 10, 110, T.oscura)));
    VOL.caja(c, pr, -78, -20, 0, 78, 20, 96, T.tronco, { frente: puntas, atras: puntas, tapa: C.corteza });
    VOL.aguaUna(c, pr, -100, -36, 130, 106, 36, 106, T.vieja, { fn: (cc, l, h) => R(cc, 0, -h, l, h * 0.3, "#4E6B3A") });
  }
  // la grada con la quilla de Sten: los rieles que bajan al agua, los caballetes, la quilla oscura con la roda, las
  // cuadernas de lado a lado y las marcas de Orm y de Sten; o.enfermas: los trozos grises apartados
  function gradaQuillaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 20, 0, 240, 70, 0.34);
    const S = VOL.escena(pr);
    [-30, 30].forEach((w) => S.poner(0, w, () => VOL.palo(c, pr, -220, w, 14, 220, w, -6, 10, C.maderaSombra)));
    [-160, -60, 40, 140].forEach((u) => S.poner(u, 0, () => VOL.caja(c, pr, u - 10, -30, 0, u + 10, 30, 50 - u * 0.07, T.madera)));
    S.poner(0, 0, () => {
      VOL.caja(c, pr, -210, -9, 50, 200, 9, 76, ["#2A1E14", "#3A2A1E", "#4E3A28"], {
        frente: (cc, l, h) => {
          R(cc, 0, -h, l, h, "#3A2A1E");
          marca(cc, 90, -4, 18, "#C8A878", 2);
          marcaSten(cc, 120, -4, 18, "#C8A878", 2);
        },
      });
      VOL.palo(c, pr, 200, 0, 64, 236, 0, 170, 12, "#3A2A1E");
    }, 50);
    for (let k = 0; k < 6; k++) {
      const u = -150 + k * 62,
        a = 60 + k * 4;
      S.poner(u, 0, () =>
        VOL.plano(c, VOL.sub(pr, u, 0, 0, Math.PI / 2), -a - 6, a + 6, 0, 60, 160, null, (cc, l, h) => {
          cc.strokeStyle = "#4A3626";
          cc.lineWidth = 7;
          cc.beginPath();
          cc.moveTo(l / 2 - a, -h);
          cc.quadraticCurveTo(l / 2 - a * 0.7, -6, l / 2, -6);
          cc.quadraticCurveTo(l / 2 + a * 0.7, -6, l / 2 + a, -h);
          cc.stroke();
        }),
      );
    }
    if (o.enfermas)
      for (let k = 0; k < 3; k++) {
        const u = -300 + k * 34,
          w = 40 + k * 12;
        S.poner(u, w, () => VOL.caja(c, pr, u - 38, w - 14, 0, u + 34, w + 14, 30, ["#46424A", "#5A5458", "#6E686C"], { arriba: (cc, l, h) => L(cc, 6, -h * 0.6, l - 8, -h * 0.4, "#6A4A8A", 2) }));
      }
    S.dibujar();
  }
  // los escalones del santuario: lajas bajas de punta a punta, con musgo y raíces que los cruzan
  function escalonesRaicesV(c, x, y, t, o) {
    const pr = VOL.prSeg(x, y, o.x2, o.y2, o),
      l = pr.largo,
      w = o.ancho || 120,
      r = azar((o.sem || 1) * 41),
      n = Math.floor(l / 76);
    const S = VOL.escena(pr);
    for (let k = 0; k <= n; k++) {
      const u = k * 76,
        ww = w * (0.85 + r() * 0.25),
        musgo = r() < 0.6,
        raiz = r() < 0.55 ? (r() < 0.5 ? 1 : -1) : 0;
      S.poner(u + 26, 0, () => {
        VOL.caja(c, pr, u, -ww, 0, u + 52, ww, 8, k % 2 ? TP : [TP[0], TP[2], "#6E7276"], { tapa: k % 2 ? TP[1] : TP[2] });
        if (musgo) VOL.elipse(c, pr, u + 14, ww * 0.7, 8.5, 16, 12, C.musgo2);
        if (raiz) {
          VOL.palo(c, pr, u + 10, raiz * (ww + 50), 0, u + 30, 0, 12, 10, C.tronco);
          VOL.palo(c, pr, u + 30, 0, 12, u + 60, -raiz * ww * 0.4, 8, 9, C.corteza);
        }
      });
    }
    S.dibujar();
  }
  // la estela: piedra alta y gastada con la runa adelante (y su luz), grietas y musgo
  function estelaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      f = o.luz || 0,
      runa = o.runa || "algiz";
    VOL.sombra(c, pr, 0, 0, 36, 22);
    ASSETS.KIT.menhirV(c, pr, 28, 18, 186, TP, (cc, l, h) => {
      L(cc, l / 2 - 10, -36, l / 2 - 2, -66, "#2E3234", 1.5);
      FUTHARK.dibujar(cc, runa, l / 2, -84, 54, "#2E3234", 6);
      if (f > 0.02) alfa(cc, Math.min(1, f), () => FUTHARK.dibujar(cc, runa, l / 2, -84, 54, RUNICO, 3.5));
      P(cc, [0, 0, 2, -54, 22, -34, 34, 0], C.musgo2);
    });
    if (f > 0.02) VOL.halo(c, pr, 0, 0, 110, 80, RUNICO, f * 0.6);
  }
  // el árbol colosal: el tronco que se afina, los contrafuertes de raíces, el portal de piedra adelante (columnas
  // talladas, la hoja cerrada, la luz por las rendijas, el dintel con runas), las raíces que lo abrazan y la copa
  function arbolPortalV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      resp = 0.55 + Math.sin(t * 0.7) * 0.45,
      altaQ = nivel() !== "baja",
      lz = (o.visto ? 0.75 : 0.45) * (0.6 + resp * 0.4),
      pw = 160,
      ph = 424,
      R0 = 300,
      TT = [C.troncoSombra, C.tronco, C.corteza];
    VOL.sombra(c, pr, 30, 0, 600, 300, 0.4);
    const S = VOL.escena(pr);
    // los contrafuertes alrededor
    [0.4, 1.1, 1.9, 2.6, 3.4, 4.2, 5.0, 5.7].forEach((a, i) =>
      S.poner(Math.cos(a) * 400, Math.sin(a) * 300, () => {
        const cu = Math.cos(a),
          cw = Math.sin(a),
          tu = cu * 580,
          tw = cw * 440,
          pu = -cw * 70,
          pw2 = cu * 70,
          bu = cu * 260,
          bw = cw * 200,
          hz = i % 2 ? 300 : 220;
        VOL.cara(c, pr, VOL.afuera([[bu - pu, bw - pw2, 0], [tu, tw, 0], [bu, bw, hz]], [-pu, -pw2, 0.2]), TT);
        VOL.cara(c, pr, VOL.afuera([[tu, tw, 0], [bu + pu, bw + pw2, 0], [bu, bw, hz]], [pu, pw2, 0.2]), TT);
      }),
    );
    S.poner(0, 0, () => {
      VOL.cono(c, pr, 0, 0, R0 + 40, R0 - 30, 0, 700, TT, { n: 14, sinTapa: true });
      VOL.cono(c, pr, 0, 0, R0 - 30, R0 - 50, 700, 1300, TT, { n: 14 });
      [[-0.6, 600, 50, 120], [0.4, 880, 40, 140], [2.4, 1000, 40, 90], [1.0, 420, 60, 80]].forEach(([a, z, rw, rh]) => {
        const q = pr(Math.cos(a) * R0, Math.sin(a) * R0 * 0.9, z);
        if (pr.hondo(Math.cos(a), Math.sin(a)) > 0) E(c, q[0], q[1], rw * pr.s, rh * pr.s, C.musgo);
      });
    });
    // el portal, pegado al frente del tronco
    const frentePortal = (cc, l, h) => {
      const m = l / 2,
        col = "#2E3234";
      P(cc, [m - pw - 50, 0, m - pw - 50, -ph + 60, m - pw + 10, -ph - 30, m + pw - 10, -ph - 30, m + pw + 50, -ph + 60, m + pw + 50, 0], TP[0]);
      [[-1, 0], [1, 1]].forEach(([s2, k]) => {
        const cx = m + s2 * (pw + 18),
          my = -230;
        R(cc, cx - 30, -ph + 50, 60, ph - 50, k ? TP[2] : TP[1]);
        R(cc, cx - 36, -ph + 40, 72, 20, TP[0]);
        if (!k) {
          E(cc, cx, my, 16, 10, col);
          L(cc, cx + 12, my - 4, cx + 18, my - 22, col, 4);
          L(cc, cx + 18, my - 22, cx + 8, my - 44, col, 2.5);
          L(cc, cx + 18, my - 22, cx + 28, my - 44, col, 2.5);
          [-10, -4, 6, 12].forEach((dx) => L(cc, cx + dx, my + 6, cx + dx, my + 26, col, 2.5));
        } else {
          L(cc, cx, my + 30, cx, my - 30, col, 4);
          [[-1, -10], [1, -18], [-1, -26]].forEach(([d, dy]) => L(cc, cx, my + dy, cx + d * 18, my + dy - 14, col, 2.5));
        }
      });
      P(cc, [m - pw + 20, 0, m - pw + 20, -ph + 70, m - pw + 60, -ph + 20, m + pw - 60, -ph + 20, m + pw - 20, -ph + 70, m + pw - 20, 0], "#24272A");
      P(cc, [m, 0, m, -ph + 20, m + pw - 60, -ph + 20, m + pw - 20, -ph + 70, m + pw - 20, 0], "#2C3034");
      alfa(cc, lz, () => {
        L(cc, m, -6, m, -ph + 26, RUNICO_CLARO, 4);
        L(cc, m - pw + 24, -4, m + pw - 24, -4, RUNICO, 3);
        L(cc, m - 60, -ph + 24, m + 60, -ph + 24, RUNICO, 2);
      });
      R(cc, m - pw - 60, -ph - 30, (pw + 60) * 2, 44, TP[1]);
      R(cc, m - pw - 60, -ph - 30, (pw + 60) * 2, 6, TP[2]);
      ["othala", "algiz", "eihwaz", "dagaz", "ingwaz"].forEach((nom, i) => {
        FUTHARK.dibujar(cc, nom, m + (i - 2) * 58, -ph + 8, 30, col, 4);
        alfa(cc, 0.15 + lz * 0.4, () => FUTHARK.dibujar(cc, nom, m + (i - 2) * 58, -ph + 8, 30, RUNICO, 2));
      });
    };
    S.poner(0, R0 + 10, () => {
      VOL.caja(c, pr, -pw - 60, R0 - 20, 0, pw + 60, R0 + 10, ph + 14, TP, { frente: frentePortal, col_frente: null, sinTapa: true, sin: ["atras"] });
      if (altaQ) VOL.halo(c, pr, 0, R0 + 10, ph * 0.5, 260, RUNICO, lz * 0.55);
      // las raíces que abrazan el dintel y bajan como columnas
      [[-1, 0], [1, 0], [-1, 1], [1, 1]].forEach(([l, k]) => {
        const u0 = l * (k ? 520 : 300),
          u1 = l * (pw + (k ? 90 : 60)),
          w = R0 + 20 + k * 10;
        VOL.palo(c, pr, u0, w - 60, 0, u0 * 0.8, w, ph * 0.6, k ? 46 : 60, C.troncoSombra);
        VOL.palo(c, pr, u0 * 0.8, w, ph * 0.6, u1, w, ph + 30, k ? 40 : 52, l > 0 ? C.corteza : C.tronco);
        VOL.palo(c, pr, u1, w, ph + 30, -l * 60, w - 20, ph + 80, k ? 34 : 44, C.troncoSombra);
      });
    });
    // la copa colosal: masas de follaje en una ronda muy arriba
    const r = azar(4242);
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * TAU,
        d = 360 + r() * 260,
        u = Math.cos(a) * d,
        w = Math.sin(a) * d * 0.7,
        z = 1400 + r() * 60,
        mr = 220 + r() * 120,
        col = C.roble[k % 3];
      S.poner(u, w, () => {
        const q = pr(u, w, z);
        P(c, poli(q[0], q[1], mr * pr.s, mr * 0.62 * pr.s, 9, k), col);
      }, z);
    }
    S.dibujar();
    for (let k = 0; k < 7; k++) {
      const q = pr(-200 + k * 70, 0, 1520 + (k % 2) * 60);
      P(c, poli(q[0], q[1], 200 * pr.s, 130 * pr.s, 9, k), k % 2 ? C.roble[2] : C.robleLuz);
    }
  }
  // los restos al pie del portal: el escudo, las lanzas y los huesos medio enterrados, y las zarzas espectrales que
  // brotan de ahí (desde su lugar en el piso hasta arriba, sobre el portal)
  function restosZarzasV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      w = o.ancho || 230,
      onda = o.onda || 0,
      r = azar(5150);
    VOL.calco(c, pr, (cc) => {
      P(cc, poli(0, 0, w * 1.05, 34, 14, 0.3), "#2E2618");
      E(cc, -90, -8, 34, 12, "#5A4A3A");
      E(cc, -90, -12, 26, 8, "#6E5A44");
      E(cc, 40, -6, 14, 11, C.hueso);
      L(cc, 60, -2, 110, -8, C.hueso, 5);
      L(cc, -30, 2, -10, -14, C.hueso, 4);
    });
    VOL.palo(c, pr, -160, 4, 0, -120, 0, 70, 4, C.maderaVieja);
    VOL.palo(c, pr, 130, 6, 0, 170, 0, 56, 4, C.maderaVieja);
    if (nivel() !== "baja") VOL.halo(c, pr, 0, 0, 200, w * 1.2, "#9A6BD8", 0.18 + onda * 0.3);
    alfa(c, Math.min(0.85, 0.5 + onda * 0.4), () => {
      const n = nivel() === "baja" ? 12 : 22;
      for (let k = 0; k < n; k++) {
        const b = pr(-w + r() * w * 2, 0, 4),
          e = pr((r() - 0.5) * w * 1.6, 0, 180 + r() * 260);
        zarzaEspectral(c, b[0], b[1], e[0], e[1], (r() < 0.5 ? -1 : 1) * (60 + r() * 90) * pr.s, t, k, pr.s, onda);
      }
    });
  }
  // el sello: el pedestal y el disco de piedra parado, con el signo del Núcleo y la concavidad gastada adelante
  function selloPiedraV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      lat = 0.8 + Math.sin(t * 1.6) * 0.2,
      col = o.visto ? RUNICO_CLARO : "#3A3E40";
    VOL.sombra(c, pr, 0, 0, 50, 26);
    VOL.caja(c, pr, -40, -16, 0, 40, 16, 40, TP);
    if (o.visto) VOL.halo(c, pr, 0, 0, 84, 90, RUNICO, 0.5 * lat);
    VOL.rollo(c, VOL.sub(pr, 0, 0, 0, Math.PI / 2), -8, 8, 0, 86, 46, [TP[0], TP[1], TP[2]], { n: 16, corte: TP[2] });
    VOL.plano(c, pr, -46, 46, 8.5, 40, 132, null, (cc, l, h) => {
      const cx = l / 2,
        cy = -h / 2;
      cc.strokeStyle = col;
      cc.lineWidth = 2.5;
      cc.beginPath();
      cc.arc(cx, cy, 36, 0, TAU);
      cc.stroke();
      signo(cc, cx, cy, 60, col, 2.5);
      E(cc, cx, cy, 15, 14, "#7C8082");
      E(cc, cx + 1, cy + 1, 12, 11, "#4A4E50");
      E(cc, cx + 3, cy + 3, 7, 6, "#3A3E40");
    }, () => {});
  }
  // la loma del mirador: una elevación de roca con la cima de pasto y musgo y la rampa de lajas que sube
  function lomaMiradorV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      rr = o.r || 300,
      r = azar(777),
      jit = Array.from({ length: 18 }, () => 0.85 + r() * 0.25),
      planta = jit.map((j, i) => {
        const a = 0.2 + (i / 18) * TAU;
        return [Math.cos(a) * rr * j, Math.sin(a) * rr * 0.96 * j];
      }),
      l = o.lado || -1;
    VOL.prisma(c, pr, planta, 0, 70, [TP[0], "#3A3E40", TP[1]], { tapa: C.pastoSombra });
    VOL.calco(c, pr, (cc) => {
      P(cc, poli(-10, -6, rr * 0.86, rr * 0.4, 18, 0.5, jit), C.pasto);
      for (let k = 0; k < 14; k++) {
        const a = r() * TAU,
          d = r() * 0.8;
        P(cc, poli(Math.cos(a) * rr * d, Math.sin(a) * rr * 0.4 * d, 14 + r() * 12, 8 + r() * 6, 6, r()), r() < 0.5 ? C.musgoClaro : C.musgo2);
      }
    }, 70);
    for (let k = 0; k < 6; k++) {
      const u = l * (rr * 0.8 + k * 50),
        w = 30 + k * 40;
      VOL.prisma(c, pr, VOL.redonda(u, w, 50, 7, k + 0.3, 24), 0, Math.max(6, 60 - k * 12), [TP[0], TP[1], TP[2]]);
    }
  }
  // el cofre del mirador con su anillo de zarzas espectrales
  function cofreZarzasV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      r = azar(6061);
    ASSETS.dibujar(c, "arconLenador", x, y, t, Object.assign({}, o, { s: 1.3 * (o.s || 1) }));
    if (o.quemado) return;
    if (nivel() !== "baja") VOL.halo(c, pr, 0, 0, 30, 110, "#9A6BD8", 0.22);
    alfa(c, 0.7, () => {
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * TAU,
          b = pr(Math.cos(a) * 64, Math.sin(a) * 32, 0),
          e = pr(Math.cos(a + 1.2) * 30, Math.sin(a + 1.2) * 15, 50 + r() * 40);
        zarzaEspectral(c, b[0], b[1], e[0], e[1], (r() - 0.5) * 50 * pr.s, t, k, pr.s * 0.7, 0);
      }
    });
  }

  Object.assign(ASSETS.LISTA, {
    ruedaAgua: { f: ruedaAgua, fv: ruedaAguaV, vol: true, alto: 360, choque: { w: 200, h: 40 }, grupo: "este" },
    compuerta: { f: compuerta, fv: compuertaV, vol: true, alto: 130, choque: { w: 110, h: 20 }, grupo: "este" },
    canal: { f: canal, fv: canalV, vol: true, alto: 10, grupo: "este" },
    galponSierra: { f: galponSierra, fv: galponSierraV, vol: true, alto: 260, choque: { w: 380, h: 50 }, grupo: "este" },
    pilaTroncos: { f: pilaTroncos, fv: pilaTroncosV, vol: true, alto: 200, choque: { w: 220, h: 40 }, grupo: "este" },
    tornoRampa: { f: tornoRampa, fv: tornoRampaV, vol: true, alto: 110, choque: { w: 140, h: 30 }, grupo: "este" },
    bueyBarro: { f: bueyBarro, fv: ASSETS.ladoV(bueyBarro), vol: true, alto: 100, grupo: "este" },
    bancoTaco: { f: bancoTaco, fv: bancoTacoV, vol: true, alto: 90, choque: { w: 160, h: 20 }, grupo: "este" },
    lenera: { f: lenera, fv: leneraV, vol: true, alto: 136, choque: { w: 190, h: 30 }, grupo: "este" },
    gradaQuilla: { f: gradaQuilla, fv: gradaQuillaV, vol: true, alto: 180, choque: { w: 460, h: 50 }, grupo: "este" },
    escalonesRaices: { f: escalonesRaices, fv: escalonesRaicesV, vol: true, alto: 10, grupo: "este" },
    estela: { f: estela, fv: estelaV, vol: true, alto: 190, choque: { r: 24 }, grupo: "este", luz: true },
    arbolPortal: { f: arbolPortal, fv: arbolPortalV, vol: true, alto: 1700, choque: { w: 1100, h: 120 }, grupo: "este", luz: true },
    restosZarzas: { f: restosZarzas, fv: restosZarzasV, vol: true, alto: 440, choque: { w: 480, h: 40 }, grupo: "este" },
    selloPiedra: { f: selloPiedra, fv: selloPiedraV, vol: true, alto: 130, choque: { r: 34 }, grupo: "este", luz: true },
    lomaMirador: { f: lomaMirador, fv: lomaMiradorV, vol: true, alto: 10, grupo: "este" },
    cofreZarzas: { f: cofreZarzas, fv: cofreZarzasV, vol: true, alto: 120, choque: { r: 60 }, grupo: "este" },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, {
    ruedaAgua: { gira: true, s: 0.6 },
    compuerta: { abierta: true },
    canal: { x2: 160, y2: -60 },
    galponSierra: { sierra: true, s: 0.7 },
    tornoRampa: { gira: true },
    bueyBarro: { hundido: 0.8, arnes: true },
    gradaQuilla: { enfermas: true, s: 0.7 },
    escalonesRaices: { x2: 0, y2: -300 },
    estela: { luz: 1 },
    arbolPortal: { s: 0.22 },
    restosZarzas: { s: 0.6 },
    selloPiedra: { visto: true },
    lomaMirador: { r: 160 },
  });
})();
