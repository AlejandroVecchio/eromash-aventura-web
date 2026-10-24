// ---------- Eikholt según el compendio del 22/10/2026 (se suma a ASSETS) ----------
// La capital rearmada: casas grandes con detalles de diseño (galerías, porches, escaleras de afuera, buhardillas,
// anexos, torrecitas, tablas cruzadas talladas en el hastial), el Roble gigante con sus raíces, el árbol de las
// promesas y el mirador, la empalizada doble de 6 m con pasarela cubierta, las doce piedras de la cúpula rúnica y
// sus runas flotando, la Puerta del Norte de hierro, el estandarte de la cornamenta, la campana, el tablón de avisos,
// la carpintería con su grúa, la curtiembre, el patio de la Guardia, el corral de caravanas, el muelle de balsas y
// las camas de hongos de Ragna. Mismas reglas que assets.js: colores planos, sin textura de material, luz de arriba
// a la derecha (la cara derecha más clara).
(function () {
  "use strict";
  const { P, E, R, L, alfa, azar, sombra, halo, RUNICO, RUNICO_CLARO, TAU } = DIB;
  const C = ASSETS.C;
  const nivel = () => (window.CALIDAD ? CALIDAD.nivel : "alta");

  // Casas de bosque (pedido de Alejandro, 24/10/2026: «más de bosque, más troncos, más naturaleza; las de ahora
  // parecen de una ciudad real»): paredes de troncos [frente, costado al sol, esquineros], techos de pizarra
  // oscura, de tepe con pasto, de tejuelas de corteza o con musgo, postigos de madera y musgo por todos lados.
  const PAREDES = [
    ["#5A4030", "#6E5038", "#3A281A"],
    ["#4E3A2A", "#62492F", "#30221A"],
    ["#5E5444", "#73685A", "#3A3428"],
    ["#6A4A30", "#80603F", "#42301E"],
    ["#4A3E30", "#5C4E3C", "#2C241A"],
  ];
  const POSTIGOS = ["#2E3A24", "#3E2A1C", "#4A3A26", "#2A3428"];
  const TECHOS = [
    ["#262A30", "#343A42", "#4A525C"],
    ["#2E3A1E", "#40502A", "#5A6E36"],
    ["#2A2018", "#3A2C20", "#4E3C2A"],
    ["#2E3628", "#3E4A34", "#56644A"],
  ];
  const MUSGO = ["#3E5A30", "#4E6B3A", "#5E7E44"];
  // las juntas de los troncos sobre una pared recta y las cabezas que asoman en las esquinas
  function troncos(c, x0, y0, w, h, s, cabezas) {
    const paso = 13 * s;
    for (let yy = y0 + paso; yy < y0 + h - 2 * s; yy += paso) {
      R(c, x0, yy - 1.5 * s, w, 2.5 * s, "rgba(0,0,0,0.3)");
      R(c, x0, yy + 1 * s, w, 1.5 * s, "rgba(255,240,210,0.06)");
    }
    if (cabezas)
      for (let yy = y0 + paso / 2; yy < y0 + h; yy += paso)
        cabezas.forEach((cx) => {
          E(c, cx, yy, 7 * s, 6.5 * s, "#7A5A3A");
          E(c, cx, yy, 3.5 * s, 3 * s, "#9A7A52");
        });
  }
  // lo mismo sobre el costado en perspectiva (un paralelogramo que sube ey a lo largo de ex)
  function troncosCostado(c, x0, y0, ex, ey, h, s) {
    const paso = 13 * s;
    for (let k = paso; k < h - 2 * s; k += paso) L(c, x0, y0 - k, x0 + ex, y0 - k - ey, "rgba(0,0,0,0.26)", 2.5 * s);
  }
  // matas de helecho y pasto al pie de una pared
  function matas(c, x, y, s, sem) {
    for (let k = 0; k < 3; k++) {
      const mx = x + (k - 1) * 12 * s,
        h = (18 + ((sem + k * 5) % 4) * 6) * s,
        col = MUSGO[(sem + k) % 3];
      P(c, [mx - 10 * s, y, mx - 2 * s, y - h, mx + 1 * s, y - h * 0.4, mx + 6 * s, y - h * 0.9, mx + 10 * s, y], col);
    }
  }

  // ventana con postigos abiertos; de noche (o siempre, apenas) se ve el ámbar de adentro
  function ventana(c, x, y, w, h, postigo, s) {
    R(c, x - w / 2, y - h, w, h, "#1A140E");
    alfa(c, 0.55, () => R(c, x - w / 2 + 2 * s, y - h + 2 * s, w - 4 * s, h - 4 * s, C.ambar));
    R(c, x - w / 2 + w / 2 - 1 * s, y - h, 2 * s, h, "#1A140E");
    P(c, [x - w / 2, y - h, x - w / 2 - w * 0.45, y - h + 3 * s, x - w / 2 - w * 0.45, y - 3 * s, x - w / 2, y], postigo);
    P(c, [x + w / 2, y - h, x + w / 2 + w * 0.45, y - h + 3 * s, x + w / 2 + w * 0.45, y - 3 * s, x + w / 2, y], postigo);
    R(c, x - w / 2 - 3 * s, y, w + 6 * s, 4 * s, C.maderaSombra);
  }
  // puerta con marco tallado: dintel en arco y dos volutas arriba
  function puerta(c, x, y, s, col) {
    P(c, [x - 24 * s, y, x - 24 * s, y - 62 * s, x - 14 * s, y - 76 * s, x + 14 * s, y - 76 * s, x + 24 * s, y - 62 * s, x + 24 * s, y], "#2A1E14");
    P(c, [x - 17 * s, y, x - 17 * s, y - 58 * s, x - 9 * s, y - 68 * s, x + 9 * s, y - 68 * s, x + 17 * s, y - 58 * s, x + 17 * s, y], col);
    R(c, x - 1 * s, y - 64 * s, 2 * s, 64 * s, "rgba(0,0,0,0.25)");
    E(c, x + 9 * s, y - 32 * s, 2.5 * s, 2.5 * s, C.hierroLuz);
    // volutas del marco
    [-1, 1].forEach((l) => {
      L(c, x + l * 14 * s, y - 76 * s, x + l * 26 * s, y - 86 * s, C.maderaSombra, 4 * s);
      E(c, x + l * 28 * s, y - 84 * s, 4 * s, 4 * s, C.maderaSombra);
    });
    // escalón
    P(c, [x - 30 * s, y + 2 * s, x + 30 * s, y + 2 * s, x + 26 * s, y + 10 * s, x - 26 * s, y + 10 * s], "#55584E");
  }
  // tablas cruzadas del hastial, con cabezas de dragón en las puntas
  function tablasCruzadas(c, ax, ay, gx, gy, bx, by, s) {
    const lr = (x0, y0, x1, y1, ext) => {
      const dx = x1 - x0,
        dy = y1 - y0,
        l = Math.hypot(dx, dy);
      return [x1 + (dx / l) * ext, y1 + (dy / l) * ext];
    };
    const p1 = lr(ax, ay, gx, gy, 26 * s),
      p2 = lr(bx, by, gx, gy, 26 * s);
    L(c, ax, ay, p1[0], p1[1], C.maderaSombra, 6 * s);
    L(c, bx, by, p2[0], p2[1], C.maderaSombra, 6 * s);
    [p1, p2].forEach(([x, y], i) => {
      const l = i ? 1 : -1;
      P(c, [x, y, x + l * 10 * s, y - 8 * s, x + l * 14 * s, y - 2 * s, x + l * 6 * s, y + 3 * s], C.maderaSombra);
      E(c, x + l * 9 * s, y - 4 * s, 1.5 * s, 1.5 * s, C.ambar);
    });
  }
  function humo(c, x, y, t, s, sem) {
    if (nivel() === "baja") return;
    for (let k = 0; k < 4; k++) {
      const p = (t * 0.22 + k / 4 + sem * 0.13) % 1;
      alfa(c, 0.22 * (1 - p), () => E(c, x + Math.sin(p * 5 + k) * 8 * s, y - p * 100 * s, (6 + p * 16) * s, (5 + p * 11) * s, "#8A8E88"));
    }
  }

  // La casa de Eikholt nueva, en tres cuartos: frente largo, el costado derecho con el hastial al sol y el techo a
  // dos aguas. o.v 0..5: 0 larga con porche, 1 de dos pisos con buhardilla, 2 con escalera de afuera al piso alto,
  // 3 con anexo de techo bajo y leña, 4 con galería de postes a lo largo del frente, 5 con torrecita atrás.
  // o.pared, o.techo, o.postigo cambian colores; o.entra marca las que tienen interior (se dibuja un farol en la puerta).
  function casaNordica(c, x, y, t, o) {
    // girada sobre el piso (o vista desde otro lado con la cámara del editor): se arma como volumen, con todas sus caras
    const gn = o.giro ? (((o.giro % 360) + 360) % 360) : 0;
    if (Math.min(gn, 360 - gn) > 0.5) return casaGirada(c, x, y, t, o);
    const s = o.s || 1,
      v = (o.v || 0) % 6,
      sem = o.sem || 0,
      pal = PAREDES[(o.pared != null ? o.pared : sem) % PAREDES.length],
      pos = POSTIGOS[(o.postigo != null ? o.postigo : sem + v) % POSTIGOS.length],
      [tS, tC, tL] = TECHOS[(o.techo != null ? o.techo : sem) % TECHOS.length];
    const W = (v === 0 ? 160 : v === 3 ? 136 : 126) * s,
      H = (v === 1 || v === 2 ? 150 : 98) * s,
      D = 150 * s,
      ex = D * 0.5,
      ey = D * 0.32,
      RT = (v === 1 ? 96 : 82) * s,
      ov = 16 * s,
      ye = y - H + 6 * s,
      ry = y - H - ey / 2 - RT; // altura del caballete
    sombra(c, x + 30 * s, y + 6 * s, W * 1.25, 26 * s, 0.34);
    // la torrecita (atrás, a la derecha)
    if (v === 5) {
      const tx = x + W * 0.45 + ex * 0.6,
        ty = y - ey * 0.7,
        th = H + RT + 40 * s;
      P(c, [tx - 30 * s, ty, tx - 30 * s, ty - th, tx + 10 * s, ty - th, tx + 10 * s, ty], pal[0]);
      troncos(c, tx - 30 * s, ty - th, 40 * s, th, s, [tx - 31 * s]);
      P(c, [tx + 10 * s, ty, tx + 10 * s, ty - th, tx + 34 * s, ty - th - 10 * s, tx + 34 * s, ty - 10 * s], pal[1]);
      ventana(c, tx - 10 * s, ty - th + 50 * s, 16 * s, 24 * s, pos, s);
      P(c, [tx - 40 * s, ty - th + 4 * s, tx + 2 * s, ty - th - 76 * s, tx + 10 * s, ty - th + 4 * s], tS);
      P(c, [tx + 2 * s, ty - th - 76 * s, tx + 44 * s, ty - th - 6 * s, tx + 10 * s, ty - th + 4 * s], tC);
      L(c, tx + 2 * s, ty - th - 76 * s, tx + 2 * s, ty - th - 96 * s, C.hierro, 3 * s);
      P(c, [tx + 2 * s, ty - th - 96 * s, tx + 18 * s, ty - th - 90 * s, tx + 2 * s, ty - th - 84 * s], C.rojoEromash);
    }
    // el anexo (a la izquierda)
    if (v === 3) {
      const ax = x - W - 76 * s,
        ah = H * 0.62;
      P(c, [ax, y, ax, y - ah, x - W, y - ah - 14 * s, x - W, y], pal[0]);
      troncos(c, ax, y - ah, x - W - ax, ah, s, [ax - 1 * s]);
      R(c, ax, y - ah, 6 * s, ah, pal[2]);
      P(c, [ax - 10 * s, y - ah + 6 * s, x - W, y - ah - 30 * s, x - W, y - ah - 10 * s, ax - 10 * s, y - ah + 20 * s], tC);
      // leña apilada
      for (let f = 0; f < 3; f++)
        for (let k = 0; k < 5 - f; k++) {
          const lx = ax + 12 * s + k * 12 * s + f * 6 * s,
            ly = y - 6 * s - f * 11 * s;
          E(c, lx, ly, 6 * s, 5.5 * s, C.madera);
          E(c, lx, ly, 3 * s, 2.5 * s, C.maderaLuz);
        }
    }
    // costado al sol con el hastial
    const sx = x + W,
      gx = sx + ex / 2,
      gy = ry;
    P(c, [sx, y, sx + ex, y - ey, sx + ex, y - ey - H, sx, y - H], pal[1]);
    P(c, [sx, y - H, sx + ex, y - ey - H, gx, gy], pal[1]);
    troncosCostado(c, sx, y, ex, ey, H, s);
    R(c, sx + ex - 6 * s, y - ey - H, 6 * s, H, pal[2]);
    R(c, sx, y - H, 6 * s, H, pal[2]);
    if (v % 2 === 0) {
      E(c, gx, gy + RT * 0.62, 11 * s, 11 * s, "#1A140E");
      alfa(c, 0.5, () => E(c, gx, gy + RT * 0.62, 7 * s, 7 * s, C.ambar));
    } else ventana(c, sx + ex / 2, y - ey / 2 - H * 0.35, 18 * s, 26 * s, pos, s);
    // frente
    P(c, [x - W, y, x - W, y - H, sx, y - H, sx, y], pal[0]);
    troncos(c, x - W, y - H, W * 2, H, s, [x - W - 2 * s, sx + 2 * s]);
    // zócalo de piedras de río
    for (let k = 0; k < Math.round((W * 2) / (22 * s)); k++) E(c, x - W + 11 * s + k * 22 * s, y - 5 * s, 12 * s, 7 * s, k % 2 ? "#4E524A" : "#5E6258");
    R(c, x - W, y - 12 * s, W * 2, 12 * s, "rgba(0,0,0,0.14)");
    const dosPisos = v === 1 || v === 2;
    if (dosPisos) {
      // el piso alto sobresale un poco: una franja con su sombra
      R(c, x - W - 4 * s, y - H * 0.52 - 8 * s, W * 2 + 8 * s, 8 * s, pal[2]);
      R(c, x - W, y - H * 0.52, W * 2, 5 * s, "rgba(0,0,0,0.2)");
    }
    // puerta y ventanas
    const pdx = [0, -W * 0.4, -W * 0.5, W * 0.15, 0, -W * 0.3][v],
      colP = ["#4A3020", "#3A2A1E", "#5A3A24", "#2E3A24"][(sem + 1) % 4];
    puerta(c, x + pdx, y, s, colP);
    const vy = dosPisos ? y - 26 * s : y - 30 * s;
    for (let k = -2; k <= 2; k++) {
      const wx = x + k * W * 0.42;
      if (Math.abs(wx - (x + pdx)) < 50 * s || Math.abs(k) * W * 0.42 > W - 34 * s) continue;
      ventana(c, wx, vy, 22 * s, 28 * s, pos, s);
    }
    if (dosPisos)
      for (let k = -1; k <= 1; k++) {
        if (v === 2 && k === -1) continue;
        ventana(c, x + k * W * 0.5, y - H * 0.62, 22 * s, 30 * s, pos, s);
      }
    // la escalera de afuera hasta la puerta del piso alto
    if (v === 2) {
      const top = y - H * 0.55,
        x0 = x - W * 0.05,
        x1 = x - W * 0.62;
      puerta(c, x1 + 2 * s, top, s * 0.85, colP);
      for (let k = 0; k < 9; k++) {
        const u = k / 9,
          px = x0 + (x1 + 30 * s - x0) * u,
          py = y - (y - top) * u;
        R(c, px - 18 * s, py - 6 * s, 36 * s, 6 * s, k % 2 ? C.madera : C.maderaLuz);
      }
      L(c, x0 + 18 * s, y - 34 * s, x1 + 48 * s, top - 34 * s, C.maderaSombra, 3 * s);
      L(c, x0 + 18 * s, y, x0 + 18 * s, y - 34 * s, C.maderaSombra, 3 * s);
      R(c, x1 - 26 * s, top, 70 * s, 6 * s, C.maderaSombra);
    }
    // techo a dos aguas (el faldón de adelante) con su cumbrera
    const rl = x - W + ex / 2 - ov * 0.2;
    P(c, [x - W - ov, ye, sx + ov, ye, gx + ov * 0.4, gy, rl, gy], tC);
    P(c, [x - W - ov, ye, rl, gy, rl + 30 * s, gy, x - W - ov + 20 * s, ye], tS);
    P(c, [x - W - ov, ye, sx + ov, ye, sx + ov, ye + 6 * s, x - W - ov, ye + 6 * s], tS);
    L(c, rl, gy, gx, gy, tL, 6 * s);
    // la buhardilla
    if (v === 1) {
      const bx = x + W * 0.1,
        by = ye - (ye - gy) * 0.35;
      P(c, [bx - 26 * s, by, bx - 26 * s, by - 34 * s, bx + 26 * s, by - 34 * s, bx + 26 * s, by], pal[0]);
      ventana(c, bx, by - 6 * s, 18 * s, 22 * s, pos, s);
      P(c, [bx - 34 * s, by - 30 * s, bx, by - 62 * s, bx + 34 * s, by - 30 * s], tS);
      P(c, [bx, by - 62 * s, bx + 34 * s, by - 30 * s, bx + 8 * s, by - 30 * s], tC);
    }
    // el borde del hastial y las tablas cruzadas
    tablasCruzadas(c, sx + ov * 0.4, ye, gx, gy, sx + ex + ov * 0.4, y - ey - H + 6 * s, s);
    P(c, [rl, gy, rl - 10 * s, gy - 18 * s, rl - 2 * s, gy - 4 * s], C.maderaSombra);
    // la chimenea
    if (v !== 4) {
      const cx = x + W * 0.35,
        cy = gy + (ye - gy) * 0.3;
      P(c, [cx - 10 * s, cy + 10 * s, cx - 10 * s, cy - 34 * s, cx + 12 * s, cy - 34 * s, cx + 12 * s, cy + 6 * s], "#5A5650");
      P(c, [cx + 4 * s, cy + 8 * s, cx + 4 * s, cy - 34 * s, cx + 12 * s, cy - 34 * s, cx + 12 * s, cy + 6 * s], "#6E6A62");
      R(c, cx - 13 * s, cy - 38 * s, 28 * s, 6 * s, "#46423C");
      humo(c, cx + 1 * s, cy - 44 * s, t, s, sem);
    }
    // porche sobre la puerta
    if (v === 0 || v === 3) {
      const px = x + pdx;
      [-1, 1].forEach((l) => R(c, px + l * 40 * s - 3 * s, y - 84 * s, 6 * s, 86 * s, C.maderaSombra));
      P(c, [px - 52 * s, y - 92 * s, px + 52 * s, y - 92 * s, px + 60 * s, y - 72 * s, px - 60 * s, y - 72 * s], tC);
      P(c, [px - 60 * s, y - 72 * s, px + 60 * s, y - 72 * s, px + 60 * s, y - 67 * s, px - 60 * s, y - 67 * s], tS);
      L(c, px - 40 * s, y - 60 * s, px - 26 * s, y - 72 * s, C.maderaSombra, 3 * s);
      L(c, px + 40 * s, y - 60 * s, px + 26 * s, y - 72 * s, C.maderaSombra, 3 * s);
    }
    // galería de postes a lo largo del frente, con un banco
    if (v === 4) {
      const gyy = y - H * 0.7;
      for (let k = 0; k <= 4; k++) R(c, x - W + 4 * s + k * ((W * 2 - 8 * s) / 4) - 3 * s, gyy, 6 * s, H * 0.7 + 6 * s, C.maderaSombra);
      P(c, [x - W - 12 * s, gyy - 12 * s, sx + 12 * s, gyy - 12 * s, sx + 24 * s, gyy + 10 * s, x - W - 24 * s, gyy + 10 * s], tC);
      P(c, [x - W - 24 * s, gyy + 10 * s, sx + 24 * s, gyy + 10 * s, sx + 24 * s, gyy + 15 * s, x - W - 24 * s, gyy + 15 * s], tS);
      R(c, x + W * 0.3, y - 22 * s, 70 * s, 6 * s, C.madera);
      R(c, x + W * 0.3 + 6 * s, y - 16 * s, 5 * s, 16 * s, C.maderaSombra);
      R(c, x + W * 0.3 + 58 * s, y - 16 * s, 5 * s, 16 * s, C.maderaSombra);
    }
    // musgo sobre el faldón y matas al pie de las esquinas
    const tec = o.techo != null ? o.techo : sem % TECHOS.length;
    for (let k = 0; k < 4; k++) {
      const u = ((sem * 7 + k * 29) % 100) / 100,
        mx = x - W + (W * 2) * u,
        my = ye - 4 * s - ((k * 13) % 3) * 6 * s;
      E(c, mx, my, (16 + (k % 3) * 6) * s, 6 * s, MUSGO[(k + sem) % 3]);
    }
    if (tec === 1)
      // tepe: el pasto asoma por la cumbrera
      for (let k = 0; k < 9; k++) {
        const u = k / 8,
          px2 = rl + (gx - rl) * u;
        P(c, [px2 - 5 * s, gy + 2 * s, px2, gy - (8 + (k % 3) * 4) * s, px2 + 5 * s, gy + 2 * s], MUSGO[k % 3]);
      }
    matas(c, x - W + 6 * s, y + 2 * s, s, sem);
    matas(c, sx + ex - 4 * s, y - ey + 4 * s, s, sem + 2);
    // las que se entran: un farol colgado junto a la puerta
    if (o.entra) {
      const fx = x + pdx + 34 * s;
      L(c, fx, y - 96 * s, fx + 14 * s, y - 96 * s, C.hierro, 3 * s);
      R(c, fx + 8 * s, y - 92 * s, 12 * s, 16 * s, "#1A140E");
      alfa(c, 0.9, () => R(c, fx + 10 * s, y - 90 * s, 8 * s, 12 * s, C.ambar));
      halo(c, fx + 14 * s, y - 84 * s, 46 * s, C.ambar, 0.5);
    }
    if (o.estandarte) estandarteCiervo(c, sx - 20 * s, y - H + 4 * s, t, { s: s * 0.7, sem, corto: true });
  }

  // El estandarte oficial: la cornamenta del Ciervo en blanco hueso sobre verde oscuro, con cola de golondrina.
  function estandarteCiervo(c, x, y, t, o) {
    const s = o.s || 1,
      h = (o.corto ? 120 : 230) * s,
      v = Math.sin(t * 1.6 + (o.sem || 0)) * 4 * s;
    if (!o.corto) sombra(c, x + 6 * s, y + 2 * s, 14 * s, 4 * s);
    R(c, x - 3 * s, y - h, 6 * s, h, C.maderaSombra);
    E(c, x, y - h - 4 * s, 6 * s, 6 * s, C.ambar);
    R(c, x - 2 * s, y - h + 8 * s, 64 * s, 5 * s, C.maderaSombra);
    const bx = x + 2 * s,
      by = y - h + 13 * s;
    P(c, [bx, by, bx + 58 * s, by, bx + 58 * s + v, by + 92 * s, bx + 29 * s + v, by + 74 * s, bx + v, by + 92 * s], "#2C4226");
    P(c, [bx + 44 * s, by, bx + 58 * s, by, bx + 58 * s + v, by + 92 * s, bx + 50 * s + v, by + 86 * s], "#3E5A34");
    // la cornamenta
    const cx = bx + 29 * s + v * 0.5,
      cy = by + 50 * s;
    [-1, 1].forEach((l) => {
      L(c, cx, cy, cx + l * 18 * s, cy - 30 * s, C.hueso, 3 * s);
      L(c, cx + l * 7 * s, cy - 12 * s, cx + l * 20 * s, cy - 14 * s, C.hueso, 2.5 * s);
      L(c, cx + l * 13 * s, cy - 21 * s, cx + l * 8 * s, cy - 34 * s, C.hueso, 2.5 * s);
      L(c, cx + l * 18 * s, cy - 30 * s, cx + l * 24 * s, cy - 38 * s, C.hueso, 2.5 * s);
    });
    E(c, cx, cy + 4 * s, 5 * s, 6 * s, C.hueso);
  }

  // El Roble de Eikholt: un gigante. Raíces como contrafuertes donde se meten las casas viejas (dos puertitas
  // redondas), cintas de promesas colgando de las raíces bajas, el tronco enorme con surcos, la escalera que sube
  // enroscada hasta el mirador en la rama del este y una copa que cubre la plaza y el mercado, con faroles colgados.
  function robleGigante(c, x, y, t, o) {
    const s = o.s || 1,
      v = Math.sin(t * 0.45) * 3 * s,
      r = azar(4242);
    sombra(c, x + 60 * s, y + 10 * s, 520 * s, 120 * s, 0.3);
    // raíces contrafuerte (o.sinRaices: las pone otro, como las raíces en volumen de la ciudad)
    const RAICES = o.sinRaices ? [] : [
      [-1, 400, 70, 1],
      [-1, 250, 120, 0],
      [-1, 120, 150, 1],
      [1, 140, 150, 0],
      [1, 270, 110, 1],
      [1, 410, 60, 0],
      [-1, 40, 175, 0],
    ];
    RAICES.forEach(([l, dx, dy, k]) => {
      const bx = x + l * 70 * s,
        tx = x + l * dx * s,
        ty = y + dy * 0.25 * s;
      P(c, [bx, y - 150 * s, tx, ty, tx - l * 40 * s, ty + 10 * s, bx - l * 10 * s, y + 6 * s], k ? C.troncoSombra : C.tronco);
      P(c, [bx, y - 150 * s, tx, ty, tx - l * 14 * s, ty - 8 * s, bx + l * 10 * s, y - 130 * s], k ? C.tronco : C.corteza);
      P(c, [tx - l * 30 * s, ty + 6 * s, tx - l * 60 * s, ty - 18 * s, tx - l * 20 * s, ty - 4 * s], C.musgo2);
    });
    // vetas de runa azul entre las raíces (la piedra dormida del Ting le responde al Roble)
    RAICES.forEach(([l, dx, dy], i) => {
      const tx = x + l * dx * s * 0.8,
        ty = y + dy * 0.2 * s - 10 * s,
        a = 0.45 + Math.sin(t * 1.1 + i * 1.7) * 0.25;
      alfa(c, a, () => L(c, x + l * 80 * s, y - 60 * s, tx, ty, RUNICO, 3 * s));
      if (i % 2) halo(c, tx, ty, 40 * s, RUNICO, a * 0.6);
    });
    // puertitas redondas de las casas viejas metidas entre las raíces
    (o.sinRaices ? [] : [[-190, 12], [210, 18]]).forEach(([dx, dy], i) => {
      const px = x + dx * s,
        py = y + dy * s;
      E(c, px, py - 26 * s, 24 * s, 30 * s, C.maderaSombra);
      E(c, px, py - 24 * s, 18 * s, 24 * s, i ? "#3E5A34" : "#7A2A1E");
      R(c, px - 20 * s, py - 2 * s, 40 * s, 6 * s, "#6E6A62");
      E(c, px + 7 * s, py - 22 * s, 2.5 * s, 2.5 * s, C.ambar);
      R(c, px + (i ? -46 : 30) * s, py - 44 * s, 14 * s, 14 * s, "#1A140E");
      alfa(c, 0.6, () => R(c, px + (i ? -44 : 32) * s, py - 42 * s, 10 * s, 10 * s, C.ambar));
    });
    // tronco
    P(c, [x - 150 * s, y + 4 * s, x - 112 * s, y - 161 * s, x - 86 * s, y - 322 * s, x + 90 * s, y - 322 * s, x + 116 * s, y - 161 * s, x + 152 * s, y + 4 * s], C.corteza);
    P(c, [x - 150 * s, y + 4 * s, x - 112 * s, y - 161 * s, x - 86 * s, y - 322 * s, x - 6 * s, y - 322 * s, x - 10 * s, y - 161 * s, x - 14 * s, y + 4 * s], C.tronco);
    [[-60, 0.8], [-30, 0.9], [30, 0.85], [64, 0.7]].forEach(([dx, f]) => L(c, x + dx * s, y - 10 * s, x + dx * 0.8 * s, y - 500 * f * s, "rgba(0,0,0,0.22)", 5 * s));
    P(c, [x - 110 * s, y + 4 * s, x - 100 * s, y - 60 * s, x - 70 * s, y - 74 * s, x - 50 * s, y - 40 * s, x - 40 * s, y + 4 * s], C.musgo2);
    // el árbol de las promesas: cintas con nudos en las raíces bajas
    const CINTAS = ["#F2ECEC", C.rojoEromash, "#3E5A34", C.ambar, "#E0B2B2", "#4A78D0"];
    for (let k = 0; k < (RAICES.length ? 22 : 0); k++) {
      const l = k % 2 ? 1 : -1,
        u = 0.15 + r() * 0.75,
        R0 = RAICES[Math.floor(r() * RAICES.length)],
        bx = x + R0[0] * 70 * s,
        tx = x + R0[0] * R0[1] * s,
        ty = y + R0[2] * 0.25 * s,
        cx = bx + (tx - bx) * u,
        cy = y - 93 * s + (ty - (y - 93 * s)) * u - 6 * s,
        bal = Math.sin(t * 2 + k) * 3 * s;
      L(c, cx, cy, cx + bal, cy + (16 + r() * 14) * s, CINTAS[k % CINTAS.length], 3.2 * s);
      E(c, cx, cy, 2.5 * s, 2.5 * s, CINTAS[(k + 2) % CINTAS.length]);
      void l;
    }
    // ramas grandes
    P(c, [x - 60 * s, y - 291 * s, x - 330 * s, y - 397 * s, x - 320 * s, y - 378 * s, x - 40 * s, y - 260 * s], C.tronco);
    P(c, [x + 60 * s, y - 285 * s, x + 340 * s, y - 372 * s, x + 336 * s, y - 353 * s, x + 50 * s, y - 254 * s], C.corteza);
    P(c, [x - 300 * s, y - 384 * s, x - 620 * s, y - 372 * s, x - 610 * s, y - 362 * s, x - 300 * s, y - 372 * s], C.tronco);
    P(c, [x + 300 * s, y - 366 * s, x + 640 * s, y - 366 * s, x + 630 * s, y - 355 * s, x + 300 * s, y - 353 * s], C.corteza);
    P(c, [x - 20 * s, y - 322 * s, x - 40 * s, y - 471 * s, x + 10 * s, y - 471 * s, x + 30 * s, y - 322 * s], C.tronco);
    // la escalera enroscada y el mirador en la rama del este
    for (let k = 0; k < 14; k++) {
      const u = k / 14,
        a = u * Math.PI * 1.1 - 0.3,
        sx = x + Math.sin(a) * 100 * s,
        sy = y - 20 * s - u * 420 * s;
      if (Math.cos(a) < -0.1) continue;
      R(c, sx - 16 * s, sy - 5 * s, 32 * s, 6 * s, k % 2 ? C.maderaLuz : C.madera);
      R(c, sx - 2 * s, sy, 4 * s, 10 * s, C.maderaSombra);
    }
    const mx = x + 250 * s,
      my = y - 340 * s;
    R(c, mx - 90 * s, my, 180 * s, 10 * s, C.madera);
    R(c, mx - 90 * s, my + 10 * s, 180 * s, 4 * s, C.maderaSombra);
    for (let k = 0; k <= 6; k++) R(c, mx - 90 * s + k * 30 * s - 2 * s, my - 30 * s, 4 * s, 30 * s, C.maderaSombra);
    R(c, mx - 92 * s, my - 32 * s, 184 * s, 5 * s, C.maderaLuz);
    L(c, mx - 70 * s, my + 14 * s, mx - 150 * s, my + 90 * s, C.maderaSombra, 5 * s);
    estandarteCiervo(c, mx + 80 * s, my, t, { s: s * 0.8, corto: true, sem: 3 });
    // copa: masas facetadas, las de atrás más oscuras
    // (24/10/2026: más ancha que alta, como en la lámina: cubre la plaza y el mercado)
    const MASAS = [
      [-560, -360, 230, 0],
      [560, -350, 230, 0],
      [-300, -540, 260, 0],
      [300, -540, 260, 0],
      [0, -660, 280, 0],
      [-720, -240, 170, 1],
      [720, -240, 170, 1],
      [-460, -480, 240, 1],
      [460, -480, 240, 1],
      [-150, -590, 250, 1],
      [180, -610, 240, 1],
      [-380, -310, 220, 2],
      [400, -300, 210, 2],
      [-100, -420, 260, 2],
      [160, -440, 240, 2],
      [-620, -220, 150, 2],
      [620, -220, 150, 2],
      [20, -750, 180, 2],
    ];
    MASAS.forEach(([dx, dy, mr, k], i) => {
      const cx = x + dx * s + v * (1 + k * 0.3),
        cy = y + dy * s,
        rr = mr * s,
        pts = [];
      for (let j = 0; j < 9; j++) {
        const a = (j / 9) * TAU + i,
          f = 0.86 + ((i * 7 + j * 3) % 5) * 0.05;
        pts.push(cx + Math.cos(a) * rr * f, cy + Math.sin(a) * rr * 0.72 * f);
      }
      P(c, pts, C.roble[k]);
      P(c, [cx, cy - rr * 0.72, cx + rr * 0.9, cy - rr * 0.2, cx + rr * 0.3, cy], C.robleLuz);
      P(c, [cx - rr * 0.9, cy + rr * 0.1, cx - rr * 0.2, cy + rr * 0.68, cx - rr * 0.6, cy + rr * 0.5], C.roble[0]);
    });
    // faroles colgados de las ramas bajas, sobre el mercado
    [[-520, -330], [-260, -380], [240, -370], [540, -330], [-60, -400], [80, -300]].forEach(([dx, dy], i) => {
      const fx = x + dx * s + v,
        fy = y + dy * s;
      L(c, fx, fy - 40 * s, fx, fy, C.hierro, 2 * s);
      R(c, fx - 7 * s, fy, 14 * s, 18 * s, "#1A140E");
      alfa(c, 0.9, () => R(c, fx - 5 * s, fy + 2 * s, 10 * s, 14 * s, C.ambar));
      halo(c, fx, fy + 9 * s, 60 * s, C.ambar, 0.6 + Math.sin(t * 3 + i) * 0.1);
    });
  }

  // La empalizada doble de Eikholt (unos 6 m): un tramo entre (x - o.dx, y - o.dy) y (x + o.dx, y + o.dy).
  // Desde afuera (o.dentro false) se ven los troncos con punta, dos fajas y el techo de la pasarela asomando;
  // desde adentro (o.dentro true), la pasarela de tablas sobre postes, la baranda y el techito de tablas.
  function empalizadaDoble(c, x, y, t, o) {
    const ax = x - o.dx,
      ay = y - o.dy,
      bx = x + o.dx,
      by = y + o.dy,
      l = Math.hypot(bx - ax, by - ay),
      n = Math.max(3, Math.round(l / 19)),
      r = azar((o.sem || 1) * 977),
      Hm = 236;
    const at = (u, dy) => [ax + (bx - ax) * u, ay + (by - ay) * u + (dy || 0)];
    // terraplén al pie
    P(c, [ax, ay + 8, bx, by + 8, bx, by - 10, ax, ay - 10], "#3B3222");
    if (o.dentro) {
      // la cara de adentro: troncos en sombra atrás
      for (let k = 0; k < n; k++) {
        const [px, py] = at((k + 0.5) / n, -14),
          h = Hm + r() * 16;
        P(c, [px - 10, py + 4, px - 10, py - h, px, py - h - 14, px + 10, py - h, px + 10, py + 4], k % 2 ? C.maderaSombra : "#4A3220");
      }
      // pasarela sobre postes, con baranda y techito
      const hp = 150;
      for (let k = 0; k <= Math.ceil(n / 3); k++) {
        const [px, py] = at(Math.min(1, (k * 3) / n));
        R(c, px - 4, py - hp, 8, hp, C.maderaSombra);
        L(c, px - 4, py - hp + 40, px + 26, py - hp + 6, C.maderaSombra, 4);
      }
      P(c, [ax, ay - hp, bx, by - hp, bx, by - hp + 12, ax, ay - hp + 12], C.madera);
      P(c, [ax, ay - hp - 4, bx, by - hp - 4, bx, by - hp, ax, ay - hp], C.maderaLuz);
      L(c, ax, ay - hp - 36, bx, by - hp - 36, C.maderaSombra, 4);
      for (let k = 0; k <= n; k += 2) {
        const [px, py] = at(k / n);
        L(c, px, py - hp, px, py - hp - 36, C.maderaSombra, 3);
      }
      P(c, [ax, ay - Hm - 4, bx, by - Hm - 4, bx, by - Hm + 30, ax, ay - Hm + 30], C.maderaVieja);
      P(c, [ax, ay - Hm + 30, bx, by - Hm + 30, bx, by - Hm + 36, ax, ay - Hm + 36], C.maderaSombra);
      return;
    }
    // desde afuera: el techo de la pasarela asoma por detrás
    P(c, [ax, ay - Hm - 14, bx, by - Hm - 14, bx, by - Hm - 36, ax, ay - Hm - 36], C.pizarraSombra);
    P(c, [ax, ay - Hm - 36, bx, by - Hm - 36, bx, by - Hm - 42, ax, ay - Hm - 42], C.pizarraLuz);
    for (let k = 0; k < n; k++) {
      const [px, py] = at((k + 0.5) / n),
        h = Hm - 10 + r() * 22,
        w = 10;
      P(c, [px - w, py + 4, px - w, py - h, px, py - h - 16, px + w, py - h, px + w, py + 4], k % 2 ? C.madera : C.maderaVieja);
      P(c, [px, py - h - 16, px + w, py - h, px + w, py + 4, px + 2, py + 4], k % 2 ? C.maderaLuz : C.madera);
    }
    [60, 170].forEach((hh, i) => L(c, ax, ay - hh, bx, by - hh, i ? C.hierro : "#8A7A5A", 6));
  }

  // Las doce piedras de la cúpula: menhires antiguos, más altos que una persona, con una runa del futhark tallada.
  // o.runa, o.fuerza 0..1 (0 = la que falta: apagada y partida). Encima, muy tenue, el hilo hacia la cúpula.
  function piedraAncla(c, x, y, t, o) {
    const s = o.s || 1,
      f = o.fuerza != null ? o.fuerza : 1,
      luz = f * (0.8 + Math.sin(t * 1.3 + (o.sem || 0)) * 0.2);
    if (f > 0) halo(c, x, y - 110 * s, 110 * s, RUNICO, luz);
    sombra(c, x + 12 * s, y + 4 * s, 46 * s, 12 * s);
    // base de piedras chicas
    P(c, [x - 46 * s, y + 4 * s, x - 40 * s, y - 14 * s, x + 44 * s, y - 16 * s, x + 50 * s, y + 4 * s], "#4A4E52");
    if (f <= 0) {
      // partida: la mitad de arriba en el piso
      P(c, [x - 30 * s, y - 8 * s, x - 32 * s, y - 110 * s, x + 6 * s, y - 128 * s, x + 30 * s, y - 96 * s, x + 30 * s, y - 8 * s], "#3E4246");
      P(c, [x + 6 * s, y - 128 * s, x + 30 * s, y - 96 * s, x + 30 * s, y - 8 * s, x + 10 * s, y - 8 * s], "#4E5256");
      P(c, [x + 34 * s, y + 6 * s, x + 46 * s, y - 20 * s, x + 110 * s, y - 14 * s, x + 104 * s, y + 8 * s], "#3E4246");
      P(c, [x - 20 * s, y - 8 * s, x - 14 * s, y - 30 * s, x + 20 * s, y - 24 * s, x + 30 * s, y - 8 * s], C.musgo2);
      return;
    }
    P(c, [x - 32 * s, y - 8 * s, x - 36 * s, y - 150 * s, x - 18 * s, y - 214 * s, x + 18 * s, y - 220 * s, x + 34 * s, y - 160 * s, x + 32 * s, y - 8 * s], "#4A4E52");
    P(c, [x + 18 * s, y - 220 * s, x + 34 * s, y - 160 * s, x + 32 * s, y - 8 * s, x + 8 * s, y - 8 * s], "#5E6266");
    // franja tallada (diseño, sin textura)
    P(c, [x - 34 * s, y - 60 * s, x + 33 * s, y - 64 * s, x + 33 * s, y - 52 * s, x - 34 * s, y - 48 * s], "#3A3E42");
    const nom = o.runa || "algiz";
    FUTHARK.dibujar(c, nom, x, y - 82 * s, 92 * s, "#2A2E32", 9 * s);
    alfa(c, 0.25 + f * 0.75, () => FUTHARK.dibujar(c, nom, x, y - 82 * s, 92 * s, RUNICO, 6 * s));
    if (f > 0.5) alfa(c, f * 0.7, () => FUTHARK.dibujar(c, nom, x, y - 82 * s, 92 * s, RUNICO_CLARO, 2.2 * s));
    P(c, [x - 32 * s, y - 8 * s, x - 28 * s, y - 26 * s, x + 6 * s, y - 18 * s, x + 32 * s, y - 28 * s, x + 32 * s, y - 8 * s], C.musgo2);
    // el hilo hacia la cúpula
    if (nivel() !== "baja") alfa(c, 0.12 * f, () => L(c, x + 4 * s, y - 224 * s, x + 4 * s, y - 520 * s, RUNICO, 3 * s));
  }

  // Una runa de la cúpula, flotando sobre la curva invisible (se dibuja en el cielo, la pone capital.js).
  function runaCupula(c, x, y, t, o) {
    const s = o.s || 1,
      f = o.fuerza != null ? o.fuerza : 1,
      ciclo = Math.max(0, Math.sin(t * 0.35 + (o.sem || 0) * 1.7)),
      a = f * (0.25 + ciclo * 0.75);
    if (a <= 0.02) return;
    const yy = y + Math.sin(t * 0.8 + (o.sem || 0)) * 10 * s;
    halo(c, x, yy - 70 * s, 130 * s, RUNICO, a * 0.6);
    alfa(c, a * 0.35, () => FUTHARK.dibujar(c, o.runa || "algiz", x, yy, 150 * s, RUNICO, 10 * s));
    alfa(c, a * 0.5, () => FUTHARK.dibujar(c, o.runa || "algiz", x, yy, 150 * s, RUNICO_CLARO, 3 * s));
  }

  // La Puerta del Norte: reja de hierro entre dos torres de piedra con las dos piedras de la cúpula al pie.
  function puertaNorte(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 14 * s, y + 6 * s, 220 * s, 26 * s, 0.38);
    // la reja, a medio subir
    const sube = 110 * s;
    for (let k = -5; k <= 5; k++) R(c, x + k * 20 * s - 3 * s, y - 230 * s, 6 * s, 230 * s - sube, C.hierro);
    for (let k = 1; k <= 3; k++) R(c, x - 106 * s, y - 230 * s + k * 30 * s, 212 * s, 5 * s, C.hierro);
    for (let k = -5; k <= 5; k++) P(c, [x + k * 20 * s - 4 * s, y - sube, x + k * 20 * s + 4 * s, y - sube, x + k * 20 * s, y - sube + 12 * s], C.hierroLuz);
    [-1, 1].forEach((l) => {
      const tx = x + l * 150 * s;
      P(c, [tx - 46 * s, y, tx - 46 * s, y - 260 * s, tx + 46 * s, y - 260 * s, tx + 46 * s, y], "#5A5650");
      P(c, [tx + 10 * s, y, tx + 10 * s, y - 260 * s, tx + 46 * s, y - 260 * s, tx + 46 * s, y], "#6E6A62");
      for (let k = 0; k < 5; k++) R(c, tx - 50 * s + k * 22 * s, y - 280 * s, 14 * s, 22 * s, k % 2 ? "#6E6A62" : "#5A5650");
      R(c, tx - 14 * s, y - 200 * s, 22 * s, 30 * s, "#1A140E");
      alfa(c, 0.6, () => R(c, tx - 12 * s, y - 198 * s, 18 * s, 26 * s, C.ambar));
      estandarteCiervo(c, tx - l * 36 * s, y - 100 * s, t, { s: s * 0.75, corto: true, sem: l + 5 });
    });
    // dintel con Algiz
    P(c, [x - 110 * s, y - 230 * s, x + 110 * s, y - 230 * s, x + 110 * s, y - 262 * s, x - 110 * s, y - 262 * s], "#5A5650");
    FUTHARK.dibujar(c, "algiz", x, y - 236 * s, 24 * s, RUNICO, 3.5 * s);
  }

  // La campana del Roble: suena tres veces cuando alguien vuelve de una senda peligrosa.
  function campana(c, x, y, t, o) {
    const s = o.s || 1,
      b = Math.sin(t * 1.2) * 0.04;
    sombra(c, x + 6 * s, y + 3 * s, 50 * s, 10 * s);
    R(c, x - 44 * s, y - 150 * s, 8 * s, 150 * s, C.maderaSombra);
    R(c, x + 36 * s, y - 150 * s, 8 * s, 150 * s, C.madera);
    R(c, x - 54 * s, y - 158 * s, 108 * s, 10 * s, C.maderaSombra);
    P(c, [x - 62 * s, y - 156 * s, x, y - 196 * s, x + 62 * s, y - 156 * s], C.pizarraSombra);
    P(c, [x, y - 196 * s, x + 62 * s, y - 156 * s, x + 4 * s, y - 156 * s], C.pizarra);
    c.save();
    c.translate(x, y - 148 * s);
    c.rotate(b);
    P(c, [-8 * s, 0, -20 * s, 34 * s, -30 * s, 62 * s, 30 * s, 62 * s, 20 * s, 34 * s, 8 * s, 0], "#8A6A2A");
    P(c, [4 * s, 0, 20 * s, 34 * s, 30 * s, 62 * s, 12 * s, 62 * s], "#B08A3A");
    E(c, 0, 64 * s, 6 * s, 5 * s, "#5A4420");
    c.restore();
    L(c, x + 10 * s, y - 86 * s, x + 26 * s, y - 20 * s, "#C8B48C", 2 * s);
  }

  // El tablón de avisos de la plaza: pedidos de los vecinos clavados.
  function tablonAvisos(c, x, y, t, o) {
    const s = o.s || 1,
      r = azar(77);
    sombra(c, x + 8 * s, y + 3 * s, 70 * s, 10 * s);
    R(c, x - 70 * s, y - 120 * s, 8 * s, 120 * s, C.maderaSombra);
    R(c, x + 62 * s, y - 120 * s, 8 * s, 120 * s, C.maderaSombra);
    P(c, [x - 76 * s, y - 130 * s, x + 76 * s, y - 130 * s, x + 76 * s, y - 50 * s, x - 76 * s, y - 50 * s], C.madera);
    R(c, x - 76 * s, y - 130 * s, 152 * s, 5 * s, C.maderaLuz);
    for (let k = 0; k < 7; k++) {
      const px = x - 64 * s + r() * 110 * s,
        py = y - 122 * s + r() * 46 * s;
      R(c, px, py, 18 * s, 22 * s, k % 3 ? "#E6DCC8" : "#D8C8A8");
      E(c, px + 9 * s, py + 2 * s, 2 * s, 2 * s, C.rojoEromash);
    }
    P(c, [x - 86 * s, y - 128 * s, x, y - 160 * s, x + 86 * s, y - 128 * s], C.pizarraSombra);
    P(c, [x, y - 160 * s, x + 86 * s, y - 128 * s, x + 4 * s, y - 128 * s], C.pizarra);
  }

  // La carpintería: galpón abierto con banco y tablones, y la grúa de troncos con una viga colgando.
  function carpinteria(c, x, y, t, o) {
    const s = o.s || 1,
      bal = Math.sin(t * 0.9) * 6 * s;
    sombra(c, x + 30 * s, y + 6 * s, 200 * s, 26 * s, 0.34);
    // la grúa, atrás a la derecha
    const gx = x + 170 * s;
    L(c, gx - 30 * s, y, gx, y - 300 * s, C.maderaSombra, 9 * s);
    L(c, gx + 30 * s, y, gx, y - 300 * s, C.madera, 9 * s);
    L(c, gx - 40 * s, y - 280 * s, gx + 120 * s, y - 330 * s, C.madera, 8 * s);
    L(c, gx + 110 * s, y - 326 * s, gx + 110 * s + bal, y - 170 * s, "#C8B48C", 2.5 * s);
    P(c, [gx + 60 * s + bal, y - 170 * s, gx + 160 * s + bal, y - 170 * s, gx + 160 * s + bal, y - 150 * s, gx + 60 * s + bal, y - 150 * s], C.maderaLuz);
    E(c, gx - 30 * s, y - 286 * s, 14 * s, 14 * s, C.maderaSombra);
    // el galpón
    const W = 150 * s;
    P(c, [x - W, y - 40 * s, x - W, y - 140 * s, x + W, y - 140 * s, x + W, y - 40 * s], "#3A2A1C");
    for (let k = 0; k <= 4; k++) R(c, x - W + k * ((W * 2) / 4) - 4 * s, y - 140 * s, 8 * s, 140 * s, C.maderaSombra);
    P(c, [x - W - 20 * s, y - 136 * s, x + W + 20 * s, y - 136 * s, x + W, y - 210 * s, x - W, y - 210 * s], C.maderaVieja);
    P(c, [x - W - 20 * s, y - 136 * s, x + W + 20 * s, y - 136 * s, x + W + 20 * s, y - 128 * s, x - W - 20 * s, y - 128 * s], C.maderaSombra);
    tablasCruzadas(c, x + W + 20 * s, y - 136 * s, x + W + 10 * s, y - 210 * s, x + W + 10 * s, y - 210 * s, s);
    // banco y tablones apilados
    R(c, x - 90 * s, y - 50 * s, 120 * s, 10 * s, C.maderaLuz);
    R(c, x - 84 * s, y - 40 * s, 6 * s, 40 * s, C.maderaSombra);
    R(c, x + 18 * s, y - 40 * s, 6 * s, 40 * s, C.maderaSombra);
    for (let k = 0; k < 5; k++) R(c, x + 50 * s, y - 8 * s - k * 9 * s, 110 * s - k * 6 * s, 8 * s, k % 2 ? C.madera : C.maderaLuz);
    estandarteCiervo(c, x - W + 10 * s, y - 140 * s, t, { s: s * 0.6, corto: true, sem: 9 });
  }

  // La curtiembre: bastidores con cueros estirados y dos tinas.
  function curtiembre(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 10 * s, y + 4 * s, 130 * s, 18 * s);
    [-80, 0, 80].forEach((dx, i) => {
      const bx = x + dx * s;
      R(c, bx - 34 * s, y - 120 * s, 6 * s, 120 * s, C.maderaSombra);
      R(c, bx + 28 * s, y - 120 * s, 6 * s, 120 * s, C.madera);
      R(c, bx - 36 * s, y - 124 * s, 72 * s, 6 * s, C.maderaSombra);
      R(c, bx - 36 * s, y - 34 * s, 72 * s, 6 * s, C.maderaSombra);
      P(c, [bx - 24 * s, y - 112 * s, bx + 22 * s, y - 116 * s, bx + 26 * s, y - 70 * s, bx + 18 * s, y - 42 * s, bx - 20 * s, y - 40 * s, bx - 26 * s, y - 76 * s], ["#8A6A4A", "#A07850", "#6E5038"][i]);
      [[-24, -112], [22, -116], [18, -42], [-20, -40]].forEach(([a, b]) => L(c, bx + a * s, y + b * s, bx + a * 1.3 * s, y + b * s + (b < -80 ? -6 : 6) * s, "#C8B48C", 1.5 * s));
    });
    [[-60, 30], [50, 34]].forEach(([dx, dy]) => {
      E(c, x + dx * s, y + dy * s, 34 * s, 14 * s, C.maderaSombra);
      E(c, x + dx * s, y + dy * s - 2 * s, 28 * s, 10 * s, "#4A3A22");
    });
  }

  // Muñeco de paja del patio de la Guardia, con escudo redondo.
  function munecoPaja(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 4 * s, y + 2 * s, 18 * s, 5 * s);
    R(c, x - 3 * s, y - 110 * s, 6 * s, 110 * s, C.maderaSombra);
    R(c, x - 34 * s, y - 86 * s, 68 * s, 6 * s, C.maderaSombra);
    E(c, x, y - 70 * s, 20 * s, 28 * s, "#C8A85A");
    E(c, x + 6 * s, y - 72 * s, 10 * s, 22 * s, "#DCC07A");
    E(c, x, y - 108 * s, 13 * s, 13 * s, "#C8A85A");
    R(c, x - 14 * s, y - 60 * s, 28 * s, 4 * s, C.rojoEromash);
    E(c, x - 24 * s, y - 66 * s, 16 * s, 18 * s, C.maderaSombra);
    E(c, x - 24 * s, y - 66 * s, 5 * s, 5 * s, C.hierroLuz);
  }

  // La carreta varada del corral de caravanas, tapada con lona.
  function carreta(c, x, y, t, o) {
    const s = o.s || 1,
      lona = ["#C8B48C", "#A8A090", "#8A6A4A"][(o.v || 0) % 3];
    sombra(c, x + 12 * s, y + 4 * s, 90 * s, 14 * s);
    P(c, [x - 80 * s, y - 30 * s, x + 80 * s, y - 30 * s, x + 80 * s, y - 56 * s, x - 80 * s, y - 56 * s], C.madera);
    R(c, x - 80 * s, y - 56 * s, 160 * s, 5 * s, C.maderaLuz);
    P(c, [x - 76 * s, y - 56 * s, x - 66 * s, y - 120 * s, x + 66 * s, y - 120 * s, x + 76 * s, y - 56 * s], lona);
    P(c, [x + 20 * s, y - 120 * s, x + 66 * s, y - 120 * s, x + 76 * s, y - 56 * s, x + 30 * s, y - 56 * s], "rgba(255,255,255,0.12)");
    [-40, 0, 40].forEach((dx) => L(c, x + dx * s, y - 56 * s, x + dx * 0.9 * s, y - 120 * s, "rgba(0,0,0,0.2)", 3 * s));
    [-50, 50].forEach((dx) => {
      E(c, x + dx * s, y - 20 * s, 22 * s, 22 * s, C.maderaSombra);
      E(c, x + dx * s, y - 20 * s, 15 * s, 15 * s, C.madera);
      E(c, x + dx * s, y - 20 * s, 5 * s, 5 * s, C.hierro);
    });
    L(c, x - 80 * s, y - 36 * s, x - 140 * s, y - 14 * s, C.maderaSombra, 5 * s);
  }

  // Buey de la cuadrilla: grande, manso, con un yugo.
  function buey(c, x, y, t, o) {
    const s = o.s || 1,
      cola = Math.sin(t * 2 + (o.sem || 0)) * 6 * s,
      l = o.espejo ? -1 : 1;
    sombra(c, x, y + 3 * s, 70 * s, 12 * s);
    [[-40, 0], [-24, 1], [30, 0], [44, 1]].forEach(([dx, k]) => R(c, x + l * dx * s - 5 * s, y - 40 * s, 10 * s, 40 * s, k ? "#5E4430" : "#4A3424"));
    E(c, x, y - 64 * s, 66 * s, 34 * s, "#6E5038");
    E(c, x + l * 10 * s, y - 72 * s, 50 * s, 22 * s, "#86644A");
    E(c, x + l * 72 * s, y - 70 * s, 22 * s, 18 * s, "#5E4430");
    E(c, x + l * 86 * s, y - 64 * s, 10 * s, 9 * s, "#C8A890");
    L(c, x + l * 64 * s, y - 84 * s, x + l * 50 * s, y - 100 * s, C.hueso, 4 * s);
    L(c, x + l * 76 * s, y - 86 * s, x + l * 88 * s, y - 102 * s, C.hueso, 4 * s);
    L(c, x - l * 64 * s, y - 70 * s, x - l * 70 * s + cola, y - 30 * s, "#4A3424", 3 * s);
    R(c, x + l * 50 * s - 6 * s, y - 100 * s, 12 * s, 40 * s, C.madera);
  }

  // Tramo de cerca de troncos (corral, huertas): de (x, y) a (o.x2, o.y2).
  function cerca(c, x, y, t, o) {
    const x2 = o.x2,
      y2 = o.y2,
      l = Math.hypot(x2 - x, y2 - y),
      n = Math.max(1, Math.round(l / 60));
    for (let k = 0; k <= n; k++) {
      const px = x + ((x2 - x) * k) / n,
        py = y + ((y2 - y) * k) / n;
      R(c, px - 4, py - 50, 8, 52, C.maderaSombra);
    }
    L(c, x, y - 40, x2, y2 - 40, C.madera, 5);
    L(c, x, y - 18, x2, y2 - 18, C.maderaVieja, 5);
  }

  // El muelle de balsas: tablones sobre el agua y dos balsas de troncos amarradas.
  function muelle(c, x, y, t, o) {
    const s = o.s || 1,
      ola = Math.sin(t * 1.4) * 2 * s;
    for (let k = 0; k < 8; k++) R(c, x - 40 * s, y - k * 22 * s, 80 * s, 18 * s, k % 2 ? C.madera : C.maderaLuz);
    [-44, 40].forEach((dx) => [0, 3, 6].forEach((k) => R(c, x + dx * s, y - k * 22 * s - 8 * s, 6 * s, 30 * s, C.maderaSombra)));
    [[-120, -100], [110, -60]].forEach(([dx, dy], i) => {
      const bx = x + dx * s,
        by = y + dy * s + ola * (i ? -1 : 1);
      for (let k = 0; k < 6; k++) {
        E(c, bx - 50 * s + k * 20 * s, by, 10 * s, 34 * s, k % 2 ? C.madera : C.maderaVieja);
      }
      L(c, bx - 56 * s, by - 20 * s, bx + 56 * s, by - 20 * s, C.maderaSombra, 4 * s);
      L(c, bx - 56 * s, by + 20 * s, bx + 56 * s, by + 20 * s, C.maderaSombra, 4 * s);
      L(c, bx + (i ? -56 : 56) * s, by, x + (i ? 40 : -40) * s, y - 70 * s, "#C8B48C", 2 * s);
    });
  }

  // Las camas de cultivo de Ragna: cajones bajos de tierra oscura con hongos dorados a la sombra de las raíces.
  function camaHongos(c, x, y, t, o) {
    const s = o.s || 1,
      r = azar((o.sem || 1) * 31);
    P(c, [x - 70 * s, y, x - 64 * s, y - 20 * s, x + 64 * s, y - 20 * s, x + 70 * s, y], C.maderaSombra);
    P(c, [x - 62 * s, y - 18 * s, x + 62 * s, y - 18 * s, x + 58 * s, y - 8 * s, x - 58 * s, y - 8 * s], "#2E241A");
    for (let k = 0; k < 9; k++) {
      const hx = x - 54 * s + k * 13.5 * s + r() * 4 * s,
        hy = y - 12 * s - r() * 4 * s,
        hr = (5 + r() * 5) * s;
      R(c, hx - 1.5 * s, hy - hr, 3 * s, hr, "#E8DCC4");
      E(c, hx, hy - hr, hr, hr * 0.6, k % 3 ? "#E8B04A" : C.ambar);
    }
  }

  // Casa de guardia junto a una puerta: chica, de piedra abajo y madera arriba, con el estandarte.
  function casaGuardia(c, x, y, t, o) {
    casaNordica(c, x, y, t, { s: (o.s || 1) * 0.8, v: 4, pared: 2, techo: 0, postigo: 1, sem: 11, estandarte: true });
  }


  // La muralla doble de Eikholt (24/10/2026, Alejandro: «una muralla doble con un piso donde se puede patrullar»):
  // dos empalizadas de troncos con el adarve de tablas en el medio, a o.H de alto. Un tramo es el cuadrilátero
  // o.q = [afuera0, afuera1, adentro1, adentro0] (x, y relativos al punto); se ve la cara que mira al sur (la de afuera
  // en la mitad sur del anillo, la de adentro en la mitad norte), el adarve arriba y el parapeto de troncos con punta
  // del lado de afuera. o.cabo0 / o.cabo1: el tramo termina ahí (una puerta) y se ve la punta del muro.
  function murallaDoble(c, x, y, t, o) {
    const q = o.q || [-100, 40, 100, 40, 100, -40, -100, -40],
      H = o.H || 170,
      r = azar((o.sem || 1) * 733);
    const A0 = [x + q[0], y + q[1]],
      A1 = [x + q[2], y + q[3]],
      D1 = [x + q[4], y + q[5]],
      D0 = [x + q[6], y + q[7]];
    const arriba = (p, dz) => [p[0], p[1] - H - (dz || 0)];
    const afueraAlFrente = A0[1] + A1[1] > D0[1] + D1[1];
    const [F0, F1] = afueraAlFrente ? [A0, A1] : [D0, D1];
    const largo = Math.hypot(F1[0] - F0[0], F1[1] - F0[1]),
      n = Math.max(3, Math.round(largo / 22));
    const lerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
    // el terraplén y la sombra al pie de la cara
    P(c, [F0[0], F0[1] + 16, F1[0], F1[1] + 16, F1[0], F1[1] - 4, F0[0], F0[1] - 4], "rgba(0,0,0,0.3)");
    // el parapeto de afuera cuando queda atrás (mitad norte): asoma por detrás del adarve
    const parapeto = (frente) => {
      for (let k = 0; k < n; k++) {
        const u0 = k / n,
          u1 = (k + 1) / n,
          a = arriba(lerp(A0, A1, u0)),
          b = arriba(lerp(A0, A1, u1)),
          h = 40 + r() * 10;
        P(c, [a[0], a[1] + 2, b[0], b[1] + 2, b[0], b[1] - h, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - h - 12, a[0], a[1] - h], k % 2 ? C.madera : C.maderaVieja);
        if (frente) P(c, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - h - 12, b[0], b[1] - h, b[0], b[1] + 2, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 2], k % 2 ? C.maderaLuz : C.madera);
      }
      L(c, arriba(A0, 20)[0], arriba(A0, 20)[1], arriba(A1, 20)[0], arriba(A1, 20)[1], C.hierro, 4);
    };
    if (!afueraAlFrente) parapeto(false);
    // el adarve: tablas de punta a punta, con la junta oscura cada tanto
    P(c, [...arriba(A0), ...arriba(A1), ...arriba(D1), ...arriba(D0)], "#6A4C2E");
    for (let k = 0; k <= n; k++) {
      const a = arriba(lerp(A0, A1, k / n)),
        b = arriba(lerp(D0, D1, k / n));
      L(c, a[0], a[1], b[0], b[1], k % 3 ? "#5A3E24" : "#4A3220", 2);
    }
    const m0 = arriba(lerp(A0, D0, 0.5)),
      m1 = arriba(lerp(A1, D1, 0.5));
    alfa(c, 0.25, () => L(c, m0[0], m0[1], m1[0], m1[1], "#9A7448", 3));
    // la cara del frente, de troncos parados hasta el adarve
    for (let k = 0; k < n; k++) {
      const a = lerp(F0, F1, k / n),
        b = lerp(F0, F1, (k + 1) / n),
        h = H + (afueraAlFrente ? 0 : 2);
      P(c, [a[0], a[1] + 4, b[0], b[1] + 4, b[0], b[1] - h, a[0], a[1] - h], k % 2 ? C.madera : C.maderaVieja);
      const mx = (a[0] + b[0]) / 2,
        my = (a[1] + b[1]) / 2;
      P(c, [mx, my + 4, b[0], b[1] + 4, b[0], b[1] - h, mx, my - h], k % 2 ? C.maderaLuz : C.madera);
    }
    // fajas de hierro y el borde del adarve
    [46, H * 0.62].forEach((hh, i) => L(c, F0[0], F0[1] - hh, F1[0], F1[1] - hh, i ? C.hierro : "#8A7A5A", 5));
    L(c, arriba(F0)[0], arriba(F0)[1] + 2, arriba(F1)[0], arriba(F1)[1] + 2, C.maderaSombra, 6);
    // la baranda de adentro cuando la cara de adentro es la del frente (mitad norte)
    if (!afueraAlFrente) {
      const b0 = arriba(D0, 32),
        b1 = arriba(D1, 32);
      L(c, b0[0], b0[1], b1[0], b1[1], C.maderaSombra, 5);
      for (let k = 0; k <= n; k += 2) {
        const p = arriba(lerp(D0, D1, k / n));
        L(c, p[0], p[1], p[0], p[1] - 32, C.maderaSombra, 4);
      }
    } else parapeto(true);
    // la punta del muro junto a una puerta: el corte de los dos muros y el adarve
    [["cabo0", A0, D0], ["cabo1", A1, D1]].forEach(([k, a, d]) => {
      if (!o[k]) return;
      const [p0, p1] = a[1] > d[1] ? [d, a] : [a, d];
      P(c, [p0[0], p0[1], p1[0], p1[1], p1[0], p1[1] - H, p0[0], p0[1] - H], C.maderaSombra);
      P(c, [p0[0] - 8, p0[1] - H - 4, p1[0] + 8, p1[1] - H - 4, p1[0] + 8, p1[1] - H - 64, p0[0] - 8, p0[1] - H - 64], C.maderaVieja);
      P(c, [(p0[0] + p1[0]) / 2 - 10, (p0[1] + p1[1]) / 2 - H - 64, (p0[0] + p1[0]) / 2 + 10, (p0[1] + p1[1]) / 2 - H - 64, (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 - H - 90], C.madera);
    });
  }

  // La escalera de tablas que sube al adarve, pegada a la cara de adentro: de o.a (abajo) a o.b (arriba), o.w de
  // ancho, o.H de alto. Se ve el costado abierto con su larguero y la baranda.
  function escaleraMuralla(c, x, y, t, o) {
    const a = o.a || [0, 0],
      b = o.b || [0, -340],
      w = o.w || 96,
      H = o.H || 170;
    const ax = x + a[0],
      ay = y + a[1],
      bx = x + b[0],
      by = y + b[1],
      l = Math.hypot(bx - ax, by - ay),
      ux = (bx - ax) / l,
      uy = (by - ay) / l;
    const px = -uy,
      py = ux;
    // el costado abierto es el que mira al jugador (o.abierto: 1 o -1 elige el lado)
    const lado = o.abierto || (px > 0 ? 1 : -1);
    const n = Math.max(6, Math.round(l / 24));
    const pt = (u, s, z) => [ax + (bx - ax) * u + px * s * w * 0.5, ay + (by - ay) * u + py * s * w * 0.5 - z];
    const pasos = [];
    for (let k = 0; k < n; k++) pasos.push(k);
    // de atrás para adelante: primero los peldaños más al norte
    pasos.sort((i, j) => (by - ay) * (i - j));
    sombra(c, (ax + bx) / 2 + 10, (ay + by) / 2 + 6, l * 0.5, w * 0.4, 0.35);
    pasos.forEach((k) => {
      const u0 = k / n,
        u1 = (k + 1) / n,
        z0 = H * u0,
        z1 = H * u1;
      // contrahuella y huella
      P(c, [...pt(u0, -1, z0), ...pt(u0, 1, z0), ...pt(u0, 1, z1), ...pt(u0, -1, z1)], C.maderaSombra);
      P(c, [...pt(u0, -1, z1), ...pt(u0, 1, z1), ...pt(u1, 1, z1), ...pt(u1, -1, z1)], k % 2 ? C.madera : C.maderaLuz);
      L(c, ...pt(u0, -1, z1), ...pt(u0, 1, z1), "#3A2614", 2);
    });
    // larguero del lado abierto: el triángulo de tablas que llega al piso, con postes y baranda
    P(c, [...pt(0, lado, 0), ...pt(1, lado, H), ...pt(1, lado, 0)], C.maderaVieja);
    for (let k = 1; k <= 4; k++) {
      const u = k / 4,
        p0 = pt(u, lado, 0),
        p1 = pt(u, lado, H * u + 40);
      L(c, p0[0], p0[1], p1[0], p1[1], C.maderaSombra, 6);
    }
    L(c, ...pt(0, lado, 40), ...pt(1, lado, H + 40), C.madera, 5);
    L(c, ...pt(0, lado, 0), ...pt(1, lado, H), C.maderaSombra, 4);
  }

  // La casa de Eikholt como volumen: la misma casa (troncos, zócalo, puerta, ventanas, techo a dos aguas, hastiales,
  // chimenea) pero armada en el piso con su ancho, su fondo y su alto, girada o.giro grados alrededor de su centro.
  // Se ve con la misma perspectiva que la casa de frente (el fondo sube a la derecha), así cerca de 0° coincide con
  // ella. Cada pared es un plano: lo que lleva (troncos, puerta, ventanas) se le pinta con una transformación.
  function casaGirada(c, x, y, t, o) {
    const s = o.s || 1,
      v = (o.v || 0) % 6,
      sem = o.sem || 0,
      pal = PAREDES[(o.pared != null ? o.pared : sem) % PAREDES.length],
      pos = POSTIGOS[(o.postigo != null ? o.postigo : sem + v) % POSTIGOS.length],
      [tS, tC, tL] = TECHOS[(o.techo != null ? o.techo : sem) % TECHOS.length],
      W = (v === 0 ? 160 : v === 3 ? 136 : 126) * s,
      H = (v === 1 || v === 2 ? 150 : 98) * s,
      D = 150 * s,
      RT = (v === 1 ? 96 : 82) * s,
      ov = 16 * s,
      HR = H + RT,
      g = (o.giro * Math.PI) / 180,
      co = Math.cos(g),
      si = Math.sin(g),
      dosPisos = v === 1 || v === 2;
    // (u a lo ancho, w hacia el fondo, z para arriba) → pantalla, girando alrededor del centro de la planta
    const pr = (u, w, z) => {
      const wc = w - D / 2,
        uu = u * co - wc * si,
        ww = u * si + wc * co + D / 2;
      return [x + uu + ww * 0.5, y - ww * 0.32 - z];
    };
    const area = (pts) => {
      let a = 0;
      for (let i = 0; i < pts.length; i += 2) {
        const j = (i + 2) % pts.length;
        a += pts[i] * pts[j + 1] - pts[j] * pts[i + 1];
      }
      return a;
    };
    const centro = pr(0, D / 2, 0);
    sombra(c, centro[0] + 20 * s, centro[1] + 10 * s, (W + D * 0.4) * 1.05, (D * 0.32 + 40 * s) * 0.6, 0.34);
    // una pared de (u0, w0) a (u1, w1), que mira hacia (nu, nw): si mira a la cámara se pinta con lo que lleva
    function pared(u0, w0, u1, w1, nu, nw, lleva) {
      const a = pr(u0, w0, 0),
        b = pr(u1, w1, 0),
        pts = [a[0], a[1], b[0], b[1], b[0], b[1] - H, a[0], a[1] - H];
      if (area(pts) >= 0) return;
      const nx = nu * co - nw * si,
        len = Math.hypot(u1 - u0, w1 - w0);
      P(c, pts, nx > 0.3 ? pal[1] : pal[0]);
      c.save();
      c.transform((b[0] - a[0]) / len, (b[1] - a[1]) / len, 0, 1, a[0], a[1]);
      lleva(len);
      c.restore();
      if (nx < -0.3) alfa(c, 0.18 * -nx, () => P(c, pts, "#000000"));
    }
    // lo de cada pared, como si se la viera de frente: de 0 a len, el piso en 0 y el alto para arriba
    const zocalo = (len) => {
      for (let k = 0; k < Math.round(len / (22 * s)); k++) E(c, 11 * s + k * 22 * s, -5 * s, 12 * s, 7 * s, k % 2 ? "#4E524A" : "#5E6258");
      R(c, 0, -12 * s, len, 12 * s, "rgba(0,0,0,0.14)");
    };
    const filaVentanas = (len, saltar) => {
      const vy = dosPisos ? -26 * s : -30 * s;
      for (let k = -2; k <= 2; k++) {
        const wx = len / 2 + k * len * 0.21;
        if ((saltar != null && Math.abs(wx - saltar) < 50 * s) || Math.abs(wx - len / 2) > len / 2 - 34 * s) continue;
        ventana(c, wx, vy, 22 * s, 28 * s, pos, s);
      }
      if (dosPisos) for (let k = -1; k <= 1; k++) ventana(c, len / 2 + k * len * 0.25, -H * 0.62, 22 * s, 30 * s, pos, s);
    };
    const pdx = [0, -W * 0.4, -W * 0.5, W * 0.15, 0, -W * 0.3][v],
      colP = ["#4A3020", "#3A2A1E", "#5A3A24", "#2E3A24"][(sem + 1) % 4];
    const frente = (len) => {
      troncos(c, 0, -H, len, H, s, [-2 * s, len + 2 * s]);
      zocalo(len);
      if (dosPisos) R(c, -4 * s, -H * 0.52 - 8 * s, len + 8 * s, 8 * s, pal[2]);
      filaVentanas(len, len / 2 + pdx);
      puerta(c, len / 2 + pdx, 0, s, colP);
    };
    const atras = (len) => {
      troncos(c, 0, -H, len, H, s, [-2 * s, len + 2 * s]);
      zocalo(len);
      filaVentanas(len, null);
    };
    const costado = (len) => {
      troncos(c, 0, -H, len, H, s, null);
      zocalo(len);
      ventana(c, len / 2, -H * 0.35, 18 * s, 26 * s, pos, s);
      R(c, 0, -H, 6 * s, H, pal[2]);
      R(c, len - 6 * s, -H, 6 * s, H, pal[2]);
    };
    // las paredes (las que no miran a la cámara no se pintan) y los hastiales encima de los costados
    pared(-W, 0, W, 0, 0, -1, frente);
    pared(W, 0, W, D, 1, 0, costado);
    pared(W, D, -W, D, 0, 1, atras);
    pared(-W, D, -W, 0, -1, 0, costado);
    [-1, 1].forEach((l) => {
      const a = pr(l * W, l > 0 ? 0 : D, H),
        b = pr(l * W, l > 0 ? D : 0, H),
        q = pr(l * W, D / 2, HR),
        pts = [a[0], a[1], b[0], b[1], q[0], q[1]];
      if (area(pts) >= 0) return;
      P(c, pts, l * co > 0.3 ? pal[1] : pal[0]);
      // el ojo de buey y las tablas cruzadas del hastial
      const m = pr(l * W, D / 2, H + RT * 0.38);
      E(c, m[0], m[1], 9 * s, 9 * s, "#1A140E");
      alfa(c, 0.5, () => E(c, m[0], m[1], 6 * s, 6 * s, C.ambar));
      const a2 = pr(l * (W + ov * 0.4), l > 0 ? -ov : D + ov, H - 6 * s),
        b2 = pr(l * (W + ov * 0.4), l > 0 ? D + ov : -ov, H - 6 * s);
      tablasCruzadas(c, a2[0], a2[1], q[0], q[1], b2[0], b2[1], s);
    });
    // los dos faldones: primero el que queda atrás
    const faldones = [
      [[-W - ov, -ov, H - 6 * s], [W + ov, -ov, H - 6 * s], [W + ov, D / 2, HR], [-W - ov, D / 2, HR]],
      [[W + ov, D + ov, H - 6 * s], [-W - ov, D + ov, H - 6 * s], [-W - ov, D / 2, HR], [W + ov, D / 2, HR]],
    ].map((f) => {
      const pts = [];
      f.forEach(([u, w, z]) => pts.push(...pr(u, w, z)));
      return { f, pts, prof: pr(0, f[0][1], 0)[1] };
    });
    faldones.sort((a, b) => a.prof - b.prof);
    faldones.forEach(({ f, pts }, i) => {
      const mira = area(pts) < 0;
      P(c, pts, mira ? tC : tS);
      // las hileras de pizarra, paralelas a la cumbrera
      for (let k = 1; k < 5; k++) {
        const u = k / 5,
          a = pr(f[0][0], f[0][1] + (f[3][1] - f[0][1]) * u, f[0][2] + (f[3][2] - f[0][2]) * u),
          b = pr(f[1][0], f[1][1] + (f[2][1] - f[1][1]) * u, f[1][2] + (f[2][2] - f[1][2]) * u);
        L(c, a[0], a[1], b[0], b[1], mira ? tL : tC, 1.5 * s);
      }
      L(c, pts[0], pts[1], pts[2], pts[3], tS, 5 * s);
      if (i === 1) {
        const r0 = pr(-W - ov, D / 2, HR),
          r1 = pr(W + ov, D / 2, HR);
        L(c, r0[0], r0[1], r1[0], r1[1], tL, 6 * s);
      }
    });
    // la chimenea, sobre el faldón
    if (v !== 4) {
      const [cx, cy] = pr(W * 0.35, D * 0.42, HR - 14 * s);
      P(c, [cx - 10 * s, cy + 12 * s, cx - 10 * s, cy - 34 * s, cx + 12 * s, cy - 34 * s, cx + 12 * s, cy + 8 * s], "#5A5650");
      P(c, [cx + 4 * s, cy + 10 * s, cx + 4 * s, cy - 34 * s, cx + 12 * s, cy - 34 * s, cx + 12 * s, cy + 8 * s], "#6E6A62");
      R(c, cx - 13 * s, cy - 38 * s, 28 * s, 6 * s, "#46423C");
      humo(c, cx + 1 * s, cy - 44 * s, t, s, sem);
    }
  }

  const L2 = ASSETS.LISTA;
  Object.assign(L2, {
    casaNordica: { f: casaNordica, alto: 260, choque: { w: 300, h: 50 }, grupo: "capital", caras: true },
    robleGigante: { f: robleGigante, alto: 1150, choque: { r: 120 }, grupo: "capital", luz: true },
    empalizadaDoble: { f: empalizadaDoble, alto: 280, choque: null, grupo: "capital" },
    murallaDoble: { f: murallaDoble, alto: 270, choque: null, grupo: "capital" },
    escaleraMuralla: { f: escaleraMuralla, alto: 260, choque: null, grupo: "capital" },
    piedraAncla: { f: piedraAncla, alto: 230, choque: { r: 34 }, grupo: "capital", luz: true },
    runaCupula: { f: runaCupula, alto: 160, choque: null, grupo: "capital", luz: true },
    puertaNorte: { f: puertaNorte, alto: 290, choque: null, grupo: "capital", luz: true },
    estandarteCiervo: { f: estandarteCiervo, alto: 240, choque: { r: 8 }, grupo: "capital" },
    campana: { f: campana, alto: 200, choque: { r: 30 }, grupo: "capital" },
    tablonAvisos: { f: tablonAvisos, alto: 160, choque: { w: 150, h: 12 }, grupo: "capital" },
    carpinteria: { f: carpinteria, alto: 330, choque: { w: 310, h: 40 }, grupo: "capital" },
    curtiembre: { f: curtiembre, alto: 130, choque: { w: 230, h: 20 }, grupo: "capital" },
    munecoPaja: { f: munecoPaja, alto: 120, choque: { r: 14 }, grupo: "capital" },
    carreta: { f: carreta, alto: 120, choque: { w: 170, h: 24 }, grupo: "capital" },
    buey: { f: buey, alto: 100, choque: { r: 40 }, grupo: "capital" },
    cerca: { f: cerca, alto: 52, choque: null, grupo: "capital" },
    muelle: { f: muelle, alto: 40, choque: null, grupo: "capital" },
    camaHongos: { f: camaHongos, alto: 30, choque: { w: 140, h: 16 }, grupo: "capital" },
    casaGuardia: { f: casaGuardia, alto: 220, choque: { w: 240, h: 40 }, grupo: "capital" },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, {
    casaNordica: { v: 2, entra: true },
    empalizadaDoble: { dx: 100, dy: -6 },
    murallaDoble: { q: [-110, 60, 110, 60, 110, -60, -110, -60], cabo1: true },
    escaleraMuralla: { a: [0, 0], b: [0, -320] },
    piedraAncla: { runa: "algiz", fuerza: 1 },
    runaCupula: { runa: "othala", fuerza: 1 },
    cerca: { x2: 180, y2: 0 },
  });
  // las piezas de la casa del bosque, para las casas de la capital que se arman con sus medidas (ciudad/casas.js)
  ASSETS.PIEZAS_CASA = { troncos, matas, ventana, puerta, tablasCruzadas, humo, estandarteCiervo, PAREDES, POSTIGOS, TECHOS, MUSGO };
})();
