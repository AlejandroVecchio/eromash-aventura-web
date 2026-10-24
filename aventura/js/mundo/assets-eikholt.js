// ---------- Eikholt, la capital (se suma a ASSETS) ----------
// Cada pieza sale del compendio de Eikholt y de la vista de la capital (aventura de Godot, 23/10/2026):
// la muralla de troncos, sus torres y piedras rúnicas, la Puerta del Sur con el Tablero de las Sendas, el Círculo
// del Ting, el Mercado de los Toldos, la herrería de Ása, la cordelería de Folke, la Casa de Sanación de Thora, el
// Hongo Dorado y las huertas. Mismas reglas que assets.js: caras planas, luz de arriba a la derecha.
(function () {
  "use strict";
  const { P, E, R, L, alfa, poli, azar, sombra, halo, RUNICO, RUNICO_CLARO, TAU } = DIB;
  const C = ASSETS.C;

  // runas sencillas dibujadas con trazos (coordenadas de 0 a 1 en un recuadro): para piedras y carteles
  const RUNAS = {
    algiz: [[0.5, 1, 0.5, 0], [0.5, 0.35, 0.1, 0], [0.5, 0.35, 0.9, 0]],
    othala: [[0.5, 0, 0.15, 0.35], [0.5, 0, 0.85, 0.35], [0.15, 0.35, 0.85, 0.75], [0.85, 0.35, 0.15, 0.75], [0.15, 0.75, 0, 1], [0.85, 0.75, 1, 1]],
    raido: [[0.2, 0, 0.2, 1], [0.2, 0, 0.75, 0.25], [0.75, 0.25, 0.2, 0.5], [0.2, 0.5, 0.8, 1]],
    berkano: [[0.2, 0, 0.2, 1], [0.2, 0, 0.75, 0.25], [0.75, 0.25, 0.2, 0.5], [0.2, 0.5, 0.75, 0.75], [0.75, 0.75, 0.2, 1]],
    tiwaz: [[0.5, 0, 0.5, 1], [0.5, 0, 0.1, 0.35], [0.5, 0, 0.9, 0.35]],
  };
  function runa(c, nombre, x, y, w, h, col, grosor) {
    c.strokeStyle = col;
    c.lineWidth = grosor;
    c.lineCap = "round";
    c.beginPath();
    RUNAS[nombre].forEach(([a, b, d, e]) => {
      c.moveTo(x + a * w, y + b * h);
      c.lineTo(x + d * w, y + e * h);
    });
    c.stroke();
  }

  // La muralla de Eikholt: un tramo de troncos con punta entre (x, y) y (o.x2, o.y2), atados con dos fajas.
  // Los troncos son desparejos y alguno tiene la marca roja de la cuadrilla que lo plantó.
  function muralla(c, x, y, t, o) {
    const x2 = o.x2,
      y2 = o.y2,
      l = Math.hypot(x2 - x, y2 - y),
      n = Math.max(2, Math.round(l / 17)),
      r = azar((o.sem || 1) * 977);
    for (let k = 0; k < n; k++) {
      const u = (k + 0.5) / n,
        px = x + (x2 - x) * u,
        py = y + (y2 - y) * u,
        h = 116 + r() * 18,
        w = 9;
      P(c, [px - w, py + 4, px - w, py - h, px, py - h - 14, px + w, py - h, px + w, py + 4], k % 2 ? C.madera : C.maderaVieja);
      P(c, [px, py - h - 14, px + w, py - h, px + w, py + 4, px + 2, py + 4], k % 2 ? C.maderaLuz : C.madera);
      if (r() < 0.06) R(c, px - 4, py - 72, 8, 8, C.rojoEromash);
    }
    // fajas de soga y hierro
    [44, 92].forEach((hh, i) => {
      c.strokeStyle = i ? C.hierro : "#8A7A5A";
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(x, y - hh);
      c.lineTo(x2, y2 - hh);
      c.stroke();
    });
  }

  // La torre de vigía: cuatro patas de tronco, plataforma con baranda, techo de pizarra a cuatro aguas y un farol.
  function torreVigia(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 10 * s, y + 4 * s, 46 * s, 12 * s, 0.36);
    [[-30, C.maderaSombra], [26, C.madera]].forEach(([dx, col]) => R(c, x + dx * s, y - 150 * s, 7 * s, 152 * s, col));
    L(c, x - 26 * s, y - 10 * s, x + 28 * s, y - 120 * s, C.maderaSombra, 4 * s);
    L(c, x + 28 * s, y - 10 * s, x - 26 * s, y - 120 * s, C.maderaVieja, 4 * s);
    // la caseta
    P(c, [x - 40 * s, y - 150 * s, x - 40 * s, y - 196 * s, x + 40 * s, y - 196 * s, x + 40 * s, y - 150 * s], C.madera);
    P(c, [x + 6 * s, y - 150 * s, x + 6 * s, y - 196 * s, x + 40 * s, y - 196 * s, x + 40 * s, y - 150 * s], C.maderaLuz);
    for (let k = 0; k < 5; k++) R(c, x - 40 * s + k * 20 * s, y - 196 * s, 3 * s, 46 * s, C.maderaSombra);
    R(c, x - 44 * s, y - 154 * s, 88 * s, 6 * s, C.maderaSombra);
    R(c, x - 14 * s, y - 186 * s, 22 * s, 18 * s, "#1A140E");
    alfa(c, 0.7, () => R(c, x - 12 * s, y - 184 * s, 18 * s, 14 * s, C.ambar));
    // techo
    P(c, [x - 52 * s, y - 194 * s, x, y - 240 * s, x + 4 * s, y - 194 * s], C.pizarraSombra);
    P(c, [x, y - 240 * s, x + 52 * s, y - 194 * s, x + 4 * s, y - 194 * s], C.pizarra);
    halo(c, x - 3 * s, y - 177 * s, 50 * s, C.ambar, 0.5 + Math.sin(t * 3 + (o.sem || 0)) * 0.08);
  }

  // Las piedras rúnicas de la muralla: menhires altos con la runa Algiz (protección) en luz cian, de pie afuera.
  function piedraMuralla(c, x, y, t, o) {
    const s = o.s || 1,
      luz = 0.75 + Math.sin(t * 1.8 + (o.sem || 0)) * 0.2;
    halo(c, x, y - 70 * s, 70 * s, RUNICO, luz);
    sombra(c, x + 8 * s, y + 3 * s, 30 * s, 8 * s);
    P(c, [x - 24 * s, y, x - 26 * s, y - 90 * s, x - 12 * s, y - 132 * s, x + 14 * s, y - 136 * s, x + 26 * s, y - 96 * s, x + 24 * s, y], "#4A4E52");
    P(c, [x + 14 * s, y - 136 * s, x + 26 * s, y - 96 * s, x + 24 * s, y, x + 4 * s, y], "#5E6266");
    P(c, [x - 24 * s, y, x - 26 * s, y - 90 * s, x - 22 * s, y - 92 * s, x - 18 * s, y], "#3A3E42");
    runa(c, "algiz", x - 12 * s, y - 112 * s, 22 * s, 56 * s, RUNICO, 4 * s);
    alfa(c, 0.6, () => runa(c, "algiz", x - 12 * s, y - 112 * s, 22 * s, 56 * s, RUNICO_CLARO, 1.6 * s));
    // musgo al pie
    P(c, [x - 24 * s, y, x - 20 * s, y - 14 * s, x + 4 * s, y - 8 * s, x + 24 * s, y - 16 * s, x + 24 * s, y], C.musgo2);
  }

  // La Puerta del Sur: dos torres con base de piedra, el dintel tallado con la runa Raido (el camino), las hojas
  // abiertas hacia adentro, faroles ámbar y dos piedras rúnicas flanqueando. Aquí desemboca la ruta de Hrafngard.
  function puertaSur(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 14 * s, y + 6 * s, 210 * s, 26 * s, 0.38);
    // hojas abiertas (adentro, se ven en escorzo)
    P(c, [x - 110 * s, y - 6 * s, x - 70 * s, y - 40 * s, x - 70 * s, y - 166 * s, x - 110 * s, y - 150 * s], C.maderaSombra);
    P(c, [x + 110 * s, y - 6 * s, x + 70 * s, y - 40 * s, x + 70 * s, y - 166 * s, x + 110 * s, y - 150 * s], C.madera);
    [-1, 1].forEach((lado) => {
      const tx = x + lado * 150 * s;
      // base de piedra
      P(c, [tx - 44 * s, y, tx - 44 * s, y - 60 * s, tx + 44 * s, y - 60 * s, tx + 44 * s, y], "#5A5650");
      P(c, [tx + 8 * s, y, tx + 8 * s, y - 60 * s, tx + 44 * s, y - 60 * s, tx + 44 * s, y], "#6E6A62");
      for (let k = 1; k < 4; k++) R(c, tx - 44 * s, y - k * 15 * s, 88 * s, 2 * s, "#46423C");
      // cuerpo de troncos
      P(c, [tx - 40 * s, y - 60 * s, tx - 40 * s, y - 210 * s, tx + 40 * s, y - 210 * s, tx + 40 * s, y - 60 * s], C.madera);
      P(c, [tx + 6 * s, y - 60 * s, tx + 6 * s, y - 210 * s, tx + 40 * s, y - 210 * s, tx + 40 * s, y - 60 * s], C.maderaLuz);
      for (let k = 0; k < 5; k++) R(c, tx - 40 * s + k * 20 * s, y - 210 * s, 3 * s, 150 * s, C.maderaSombra);
      // ventana con luz
      R(c, tx - 12 * s, y - 180 * s, 22 * s, 26 * s, "#1A140E");
      alfa(c, 0.75, () => R(c, tx - 10 * s, y - 178 * s, 18 * s, 22 * s, C.ambar));
      halo(c, tx, y - 166 * s, 60 * s, C.ambar, 0.5);
      // techo
      P(c, [tx - 54 * s, y - 206 * s, tx, y - 262 * s, tx + 4 * s, y - 206 * s], C.pizarraSombra);
      P(c, [tx, y - 262 * s, tx + 54 * s, y - 206 * s, tx + 4 * s, y - 206 * s], C.pizarra);
      // farol junto a la entrada
      const fx = tx - lado * 52 * s;
      R(c, fx - 2 * s, y - 70 * s, 4 * s, 70 * s, C.maderaSombra);
      R(c, fx - 7 * s, y - 84 * s, 14 * s, 16 * s, C.hierro);
      alfa(c, 0.9, () => R(c, fx - 5 * s, y - 82 * s, 10 * s, 12 * s, C.ambar));
      halo(c, fx, y - 76 * s, 44 * s, C.ambar, 0.6 + Math.sin(t * 4 + lado) * 0.08);
    });
    // dintel con la runa Raido y el pasillo techado arriba
    P(c, [x - 112 * s, y - 196 * s, x - 112 * s, y - 226 * s, x + 112 * s, y - 226 * s, x + 112 * s, y - 196 * s], C.maderaSombra);
    P(c, [x - 112 * s, y - 226 * s, x - 100 * s, y - 236 * s, x + 100 * s, y - 236 * s, x + 112 * s, y - 226 * s], C.madera);
    P(c, [x - 30 * s, y - 198 * s, x - 30 * s, y - 226 * s, x + 30 * s, y - 226 * s, x + 30 * s, y - 198 * s], "#3A2A1C");
    runa(c, "raido", x - 9 * s, y - 222 * s, 18 * s, 20 * s, C.ambar, 3 * s);
  }

  // El Tablero de las Sendas: el gran tablero de Svend junto a la Puerta del Sur. Bajo un alero, filas de tablillas
  // con nombres: las verdes ya volvieron, las rojas siguen en los caminos. Arriba, las cuatro rutas.
  function granTablero(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 10 * s, y + 4 * s, 80 * s, 12 * s);
    R(c, x - 70 * s, y - 130 * s, 7 * s, 130 * s, C.maderaSombra);
    R(c, x + 63 * s, y - 130 * s, 7 * s, 130 * s, C.madera);
    P(c, [x - 66 * s, y - 34 * s, x - 66 * s, y - 120 * s, x + 66 * s, y - 120 * s, x + 66 * s, y - 34 * s], C.maderaVieja);
    P(c, [x + 10 * s, y - 34 * s, x + 10 * s, y - 120 * s, x + 66 * s, y - 120 * s, x + 66 * s, y - 34 * s], C.madera);
    const r = azar(41);
    for (let f = 0; f < 4; f++)
      for (let k = 0; k < 7; k++) {
        const tx = x - 58 * s + k * 17 * s,
          ty = y - 112 * s + f * 19 * s,
          vuelta = r() < 0.35;
        R(c, tx, ty, 13 * s, 14 * s, vuelta ? "#7BC86C" : r() < 0.3 ? C.rojoEromash : C.maderaLuz);
        R(c, tx + 2 * s, ty + 4 * s, 9 * s, 1.5 * s, "#2A2016");
      }
    // alero
    P(c, [x - 84 * s, y - 120 * s, x - 70 * s, y - 146 * s, x + 70 * s, y - 146 * s, x + 84 * s, y - 120 * s], C.maderaSombra);
    P(c, [x - 70 * s, y - 146 * s, x + 70 * s, y - 146 * s, x + 84 * s, y - 120 * s, x, y - 120 * s], C.madera);
    // las flechas de las rutas, talladas arriba del alero
    [-1, 1].forEach((d) => {
      const ax = x + d * 38 * s,
        ay = y - 158 * s;
      P(c, [ax - d * 24 * s, ay - 7 * s, ax + d * 10 * s, ay - 7 * s, ax + d * 22 * s, ay, ax + d * 10 * s, ay + 7 * s, ax - d * 24 * s, ay + 7 * s], d > 0 ? C.maderaLuz : C.madera);
    });
  }

  // El Círculo del Ting: doce asientos de piedra en ronda alrededor de un menhir negro y apagado, al norte del Roble.
  // Ahí se reúne la Asamblea del Roble. El menhir no brilla: espera.
  function tingCirculo(c, x, y, t, o) {
    const s = o.s || 1,
      rx = 150 * s,
      ry = 62 * s;
    E(c, x, y, rx + 30 * s, ry + 16 * s, "rgba(60,52,36,0.55)");
    const asiento = (k) => {
      const a = (k / 12) * TAU,
        ax = x + Math.cos(a) * rx,
        ay = y + Math.sin(a) * ry;
      sombra(c, ax + 4 * s, ay + 2 * s, 18 * s, 5 * s, 0.3);
      P(c, [ax - 16 * s, ay, ax - 14 * s, ay - 22 * s, ax + 14 * s, ay - 24 * s, ax + 16 * s, ay], "#5E5C58");
      P(c, [ax + 2 * s, ay - 23 * s, ax + 14 * s, ay - 24 * s, ax + 16 * s, ay, ax + 3 * s, ay], "#74726C");
      P(c, [ax - 16 * s, ay - 22 * s, ax - 12 * s, ay - 28 * s, ax + 16 * s, ay - 30 * s, ax + 14 * s, ay - 24 * s], "#86847C");
    };
    // los de atrás, el menhir, los de adelante
    for (let k = 6; k < 12; k++) asiento(k);
    sombra(c, x + 10 * s, y + 3 * s, 30 * s, 8 * s, 0.4);
    P(c, [x - 22 * s, y, x - 20 * s, y - 96 * s, x - 6 * s, y - 128 * s, x + 12 * s, y - 120 * s, x + 22 * s, y - 88 * s, x + 20 * s, y], "#1C1C1E");
    P(c, [x + 12 * s, y - 120 * s, x + 22 * s, y - 88 * s, x + 20 * s, y, x + 2 * s, y], "#2C2C30");
    alfa(c, 0.5, () => runa(c, "tiwaz", x - 9 * s, y - 100 * s, 16 * s, 40 * s, "#3A3A40", 3 * s));
    for (let k = 0; k < 6; k++) asiento(k);
  }

  // Los toldos del Mercado de los Toldos, bajo la copa del Roble. o.v elige qué vende cada uno:
  // 0 hongos dorados · 1 pescado del río · 2 pieles · 3 hierbas · 4 cerámica · 5 telas de los viajeros del norte.
  function toldo(c, x, y, t, o) {
    const s = o.s || 1,
      v = o.v || 0;
    const telas = [["#F2ECEC", C.rojoEromash], ["#E0B2B2", "#5E130D"], ["#D8C8A8", "#6B5A3A"], ["#F2ECEC", "#4E5C32"], ["#E0B2B2", "#9C2315"], ["#D8C8A8", "#3E4E66"]][v % 6];
    sombra(c, x + 8 * s, y + 4 * s, 62 * s, 11 * s);
    R(c, x - 52 * s, y - 78 * s, 4 * s, 78 * s, C.maderaSombra);
    R(c, x + 48 * s, y - 78 * s, 4 * s, 78 * s, C.madera);
    // mostrador
    P(c, [x - 54 * s, y - 28 * s, x + 54 * s, y - 28 * s, x + 54 * s, y, x - 54 * s, y], C.madera);
    P(c, [x + 10 * s, y - 28 * s, x + 54 * s, y - 28 * s, x + 54 * s, y, x + 10 * s, y], C.maderaLuz);
    R(c, x - 54 * s, y - 28 * s, 108 * s, 4 * s, C.maderaSombra);
    // la mercadería
    const m = [
      () => { for (let k = 0; k < 7; k++) { const hx = x - 42 * s + k * 14 * s; R(c, hx - 1 * s, y - 34 * s, 2 * s, 6 * s, "#E8DCC4"); P(c, [hx - 6 * s, y - 34 * s, hx, y - 42 * s, hx + 6 * s, y - 34 * s], k % 2 ? "#E8B04A" : C.ambar); } },
      () => { for (let k = 0; k < 5; k++) { const hx = x - 40 * s + k * 20 * s; P(c, [hx - 9 * s, y - 32 * s, hx + 5 * s, y - 36 * s, hx + 9 * s, y - 32 * s, hx + 5 * s, y - 29 * s], "#8A9CA8"); P(c, [hx + 9 * s, y - 32 * s, hx + 14 * s, y - 36 * s, hx + 14 * s, y - 28 * s], "#6A7C88"); } },
      () => { P(c, [x - 46 * s, y - 28 * s, x - 40 * s, y - 44 * s, x - 6 * s, y - 46 * s, x - 2 * s, y - 28 * s], "#8A6A4A"); P(c, [x + 4 * s, y - 28 * s, x + 10 * s, y - 40 * s, x + 44 * s, y - 42 * s, x + 46 * s, y - 28 * s], "#C8B49A"); L(c, x - 20 * s, y - 62 * s, x - 20 * s, y - 40 * s, "#6A4A30", 6 * s); },
      () => { for (let k = 0; k < 6; k++) { const hx = x - 40 * s + k * 16 * s; L(c, hx, y - 70 * s, hx, y - 50 * s, "#8A7A5A", 1 * s); P(c, [hx - 5 * s, y - 50 * s, hx, y - 40 * s, hx + 5 * s, y - 50 * s], k % 2 ? C.musgoClaro : C.musgo2); } for (let k = 0; k < 4; k++) E(c, x - 30 * s + k * 20 * s, y - 32 * s, 7 * s, 4 * s, C.pasto); },
      () => { [[-38, 14, "#A0583A"], [-16, 18, "#B86A44"], [8, 12, "#8A4A30"], [30, 16, "#C07850"]].forEach(([dx, h, col]) => { P(c, [x + (dx - 7) * s, y - 28 * s, x + (dx - 9) * s, y - (28 + h * 0.6) * s, x + (dx - 4) * s, y - (28 + h) * s, x + (dx + 4) * s, y - (28 + h) * s, x + (dx + 9) * s, y - (28 + h * 0.6) * s, x + (dx + 7) * s, y - 28 * s], col); }); },
      () => { [["#3E4E66", -40], ["#9C2315", -18], ["#E0B2B2", 4], ["#4E5C32", 26]].forEach(([col, dx]) => P(c, [x + dx * s, y - 28 * s, x + dx * s, y - 38 * s, x + (dx + 18) * s, y - 40 * s, x + (dx + 18) * s, y - 28 * s], col)); },
    ][v % 6];
    m();
    // el toldo a franjas, ondeando apenas
    const ond = Math.sin(t * 2 + v) * 2 * s;
    for (let k = 0; k < 6; k++) {
      const col = telas[k % 2];
      P(c, [x - 60 * s + k * 20 * s, y - 84 * s, x - 40 * s + k * 20 * s, y - 84 * s, x - 40 * s + k * 20 * s, y - 68 * s + ond, x - 50 * s + k * 20 * s, y - 62 * s + ond, x - 60 * s + k * 20 * s, y - 68 * s + ond], col);
    }
    P(c, [x - 60 * s, y - 84 * s, x - 50 * s, y - 100 * s, x + 50 * s, y - 100 * s, x + 60 * s, y - 84 * s], telas[1]);
    P(c, [x, y - 100 * s, x + 50 * s, y - 100 * s, x + 60 * s, y - 84 * s, x + 4 * s, y - 84 * s], telas[0]);
  }

  // La herrería de Ása: galpón abierto con la fragua de piedra encendida, el yunque, las herramientas colgadas
  // y el cajón del mineral de Jarnskald casi vacío (el Paso cerrado cortó la llegada).
  function herreriaAsa(c, x, y, t, o) {
    const s = o.s || 1,
      brasa = 0.75 + Math.sin(t * 5) * 0.15 + Math.sin(t * 13) * 0.05;
    sombra(c, x + 14 * s, y + 6 * s, 130 * s, 20 * s, 0.36);
    // postes y techo de un agua
    [-100, -20, 96].forEach((dx, i) => R(c, x + dx * s, y - 112 * s, 7 * s, 112 * s, i === 2 ? C.madera : C.maderaSombra));
    // pared del fondo
    P(c, [x - 100 * s, y - 20 * s, x - 100 * s, y - 106 * s, x + 100 * s, y - 106 * s, x + 100 * s, y - 20 * s], "#3A2A1C");
    // la fragua
    P(c, [x - 90 * s, y, x - 90 * s, y - 50 * s, x - 30 * s, y - 50 * s, x - 30 * s, y], "#5A5650");
    P(c, [x - 52 * s, y, x - 52 * s, y - 50 * s, x - 30 * s, y - 50 * s, x - 30 * s, y], "#6E6A62");
    E(c, x - 60 * s, y - 50 * s, 26 * s, 8 * s, "#2A1A12");
    alfa(c, brasa, () => {
      E(c, x - 60 * s, y - 51 * s, 20 * s, 6 * s, "#FF8D71");
      E(c, x - 58 * s, y - 52 * s, 10 * s, 3 * s, C.ambar);
    });
    halo(c, x - 60 * s, y - 56 * s, 80 * s, "#FF8D71", brasa);
    // chimenea con humo
    P(c, [x - 76 * s, y - 50 * s, x - 70 * s, y - 150 * s, x - 48 * s, y - 150 * s, x - 42 * s, y - 50 * s], "#5A5650");
    P(c, [x - 58 * s, y - 50 * s, x - 58 * s, y - 150 * s, x - 48 * s, y - 150 * s, x - 42 * s, y - 50 * s], "#6E6A62");
    for (let k = 0; k < 4; k++) {
      const p = (t * 0.25 + k / 4) % 1;
      alfa(c, 0.3 * (1 - p), () => E(c, x - 59 * s + Math.sin(p * 5 + k) * 10 * s, y - 158 * s - p * 110 * s, (6 + p * 16) * s, (5 + p * 12) * s, "#6A6A66"));
    }
    // techo
    P(c, [x - 112 * s, y - 104 * s, x - 100 * s, y - 138 * s, x + 104 * s, y - 138 * s, x + 114 * s, y - 104 * s], C.pizarraSombra);
    P(c, [x - 10 * s, y - 138 * s, x + 104 * s, y - 138 * s, x + 114 * s, y - 104 * s, x, y - 104 * s], C.pizarra);
    // herramientas colgadas
    [[10, "tenaza"], [30, "martillo"], [50, "tenaza"], [70, "lima"]].forEach(([dx, h]) => {
      L(c, x + dx * s, y - 98 * s, x + dx * s, y - 70 * s, C.hierroLuz, 2.5 * s);
      if (h === "martillo") R(c, x + (dx - 6) * s, y - 74 * s, 12 * s, 6 * s, C.hierro);
      if (h === "tenaza") L(c, x + dx * s, y - 70 * s, x + (dx + 6) * s, y - 62 * s, C.hierroLuz, 2 * s);
    });
    // yunque sobre el tocón
    R(c, x + 2 * s, y - 22 * s, 24 * s, 22 * s, C.tronco);
    P(c, [x - 6 * s, y - 22 * s, x - 14 * s, y - 32 * s, x + 30 * s, y - 32 * s, x + 40 * s, y - 28 * s, x + 30 * s, y - 22 * s], C.hierro);
    P(c, [x - 14 * s, y - 32 * s, x + 30 * s, y - 32 * s, x + 26 * s, y - 36 * s, x - 10 * s, y - 36 * s], C.hierroLuz);
    // el cajón del mineral, casi vacío
    P(c, [x + 54 * s, y, x + 54 * s, y - 26 * s, x + 92 * s, y - 26 * s, x + 92 * s, y], C.madera);
    R(c, x + 54 * s, y - 26 * s, 38 * s, 3 * s, C.maderaSombra);
    [[62, -28], [74, -29]].forEach(([dx, dy]) => P(c, poli(x + dx * s, y + dy * s, 5 * s, 3 * s, 5, dx), "#3A3436"));
  }

  // La cordelería de Folke: postes con sogas tendidas a lo largo, el torno para retorcer, rollos de soga hechos
  // y un atado de fibra que llega del río.
  function cordeleriaFolke(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 10 * s, y + 4 * s, 120 * s, 12 * s, 0.3);
    // postes con travesaño
    [-110, -40, 30, 100].forEach((dx, i) => {
      R(c, x + dx * s, y - 70 * s, 6 * s, 70 * s, i % 2 ? C.madera : C.maderaSombra);
      R(c, x + (dx - 10) * s, y - 70 * s, 26 * s, 5 * s, C.maderaSombra);
    });
    // sogas tendidas (cuelgan un poco)
    [-62, -54, -46].forEach((hh, k) => {
      c.strokeStyle = k === 1 ? "#C8B48C" : "#A8946C";
      c.lineWidth = 2.5 * s;
      c.beginPath();
      c.moveTo(x - 107 * s, y + hh * s);
      c.quadraticCurveTo(x - 5 * s, y + (hh + 10) * s, x + 103 * s, y + hh * s);
      c.stroke();
    });
    // el torno de retorcer
    R(c, x - 138 * s, y - 50 * s, 22 * s, 50 * s, C.madera);
    E(c, x - 127 * s, y - 50 * s, 16 * s, 16 * s, C.maderaSombra);
    E(c, x - 127 * s, y - 50 * s, 12 * s, 12 * s, C.maderaLuz);
    const a = t * 2;
    L(c, x - 127 * s, y - 50 * s, x - 127 * s + Math.cos(a) * 12 * s, y - 50 * s + Math.sin(a) * 12 * s, C.maderaSombra, 3 * s);
    // rollos de soga
    [[70, 0], [92, -4]].forEach(([dx, dy]) => {
      E(c, x + dx * s, y + dy * s, 14 * s, 6 * s, "#A8946C");
      E(c, x + dx * s, y + (dy - 3) * s, 9 * s, 4 * s, "#C8B48C");
      E(c, x + dx * s, y + (dy - 3) * s, 4 * s, 2 * s, "#6B5A3A");
    });
    // atado de fibra
    P(c, [x + 20 * s, y, x + 26 * s, y - 20 * s, x + 50 * s, y - 22 * s, x + 54 * s, y], "#B8A060");
    L(c, x + 37 * s, y - 22 * s, x + 37 * s, y, "#6B5A3A", 2 * s);
  }

  // La Casa de Sanación de Thora: casa larga con la puerta verde, hierbas colgadas bajo el alero, una cama con
  // toldo afuera y el jardín medicinal adelante, en hileras.
  function casaSanacion(c, x, y, t, o) {
    const s = o.s || 1,
      w = 120 * s,
      h = 62 * s;
    sombra(c, x + 16 * s, y + 6 * s, w * 1.3, 22 * s, 0.34);
    P(c, [x - w, y - 50 * s, x - w, y - 50 * s - h, x + w, y - 50 * s - h, x + w, y - 50 * s], "#C8B898");
    P(c, [x - w, y - 50 * s, x - w, y - 50 * s - h, x - w + 12 * s, y - 50 * s - h, x - w + 12 * s, y - 50 * s], "#A89878");
    R(c, x - w, y - 54 * s, w * 2, 5 * s, C.maderaSombra);
    for (let k = 0; k <= 6; k++) R(c, x - w + k * (w / 3) - 2.5 * s, y - 50 * s - h, 5 * s, h, C.maderaSombra);
    // puerta verde y ventanas cálidas
    P(c, [x - 14 * s, y - 50 * s, x - 14 * s, y - 94 * s, x, y - 100 * s, x + 14 * s, y - 94 * s, x + 14 * s, y - 50 * s], "#3E5A32");
    [-70, 52].forEach((dx) => {
      R(c, x + dx * s, y - 98 * s, 20 * s, 18 * s, "#1A140E");
      alfa(c, 0.6, () => R(c, x + (dx + 2) * s, y - 96 * s, 16 * s, 14 * s, C.ambar));
    });
    // techo de tablas
    P(c, [x - w - 16 * s, y - 48 * s - h, x - w * 0.75, y - 112 * s - h, x + w * 0.75, y - 112 * s - h, x + w + 16 * s, y - 48 * s - h], C.maderaSombra);
    P(c, [x - w * 0.75, y - 112 * s - h, x + w * 0.75, y - 112 * s - h, x + w + 16 * s, y - 48 * s - h, x - w * 0.1, y - 48 * s - h], C.maderaVieja);
    // hierbas colgadas bajo el alero
    for (let k = 0; k < 9; k++) {
      const hx = x - w + 20 * s + k * 26 * s,
        hy = y - 48 * s - h;
      L(c, hx, hy, hx, hy + 12 * s, "#8A7A5A", 1 * s);
      P(c, [hx - 5 * s, hy + 12 * s, hx, hy + 26 * s, hx + 5 * s, hy + 12 * s], k % 3 ? C.musgo2 : "#8A6A9A");
    }
    // la cama con toldo, a la derecha
    R(c, x + w - 40 * s, y - 70 * s, 4 * s, 24 * s, C.maderaSombra);
    P(c, [x + w - 40 * s, y - 50 * s, x + w + 30 * s, y - 50 * s, x + w + 30 * s, y - 40 * s, x + w - 40 * s, y - 40 * s], C.madera);
    P(c, [x + w - 36 * s, y - 50 * s, x + w + 26 * s, y - 50 * s, x + w + 20 * s, y - 56 * s, x + w - 30 * s, y - 56 * s], "#E8DCC4");
    // el jardín medicinal adelante: hileras con plantas distintas
    for (let f = 0; f < 3; f++) {
      const fy = y - 36 * s + f * 14 * s;
      P(c, [x - w + 10 * s, fy, x + w - 50 * s, fy, x + w - 54 * s, fy + 8 * s, x - w + 14 * s, fy + 8 * s], "#3A3022");
      for (let k = 0; k < 11; k++) {
        const px = x - w + 22 * s + k * 18 * s,
          col = [C.musgoClaro, "#8A6A9A", "#B8A040"][(f + k) % 3];
        P(c, [px - 5 * s, fy + 4 * s, px, fy - 8 * s, px + 5 * s, fy + 4 * s], col);
      }
    }
  }

  // El Hongo Dorado: la hospedería de Ulf. Dos pisos, cuartos arriba, el fogón abajo; el cartel con el hongo de oro,
  // bancos y barriles en la puerta, luz cálida en todas las ventanas.
  function hongoDorado(c, x, y, t, o) {
    const s = o.s || 1,
      w = 100 * s;
    sombra(c, x + 16 * s, y + 6 * s, w * 1.4, 24 * s, 0.36);
    // planta baja de piedra
    P(c, [x - w, y, x - w, y - 56 * s, x + w, y - 56 * s, x + w, y], "#5A5650");
    P(c, [x + 30 * s, y, x + 30 * s, y - 56 * s, x + w, y - 56 * s, x + w, y], "#6E6A62");
    for (let k = 1; k < 4; k++) R(c, x - w, y - k * 14 * s, w * 2, 2 * s, "#46423C");
    // piso alto de madera, un poco más ancho
    P(c, [x - w - 8 * s, y - 56 * s, x - w - 8 * s, y - 118 * s, x + w + 8 * s, y - 118 * s, x + w + 8 * s, y - 56 * s], "#D8C8A8");
    P(c, [x - w - 8 * s, y - 56 * s, x - w - 8 * s, y - 118 * s, x - w + 4 * s, y - 118 * s, x - w + 4 * s, y - 56 * s], "#B8A888");
    R(c, x - w - 8 * s, y - 60 * s, w * 2 + 16 * s, 6 * s, C.maderaSombra);
    for (let k = 0; k <= 5; k++) R(c, x - w - 8 * s + k * ((w * 2 + 16 * s) / 5) - 2.5 * s, y - 118 * s, 5 * s, 62 * s, C.maderaSombra);
    // ventanas encendidas
    [[-70, -100], [-24, -100], [24, -100], [62, -100], [-66, -40], [56, -40]].forEach(([dx, dy]) => {
      R(c, x + dx * s, y + dy * s, 18 * s, 18 * s, "#1A140E");
      alfa(c, 0.75, () => R(c, x + (dx + 2) * s, y + (dy + 2) * s, 14 * s, 14 * s, C.ambar));
    });
    halo(c, x, y - 50 * s, 150 * s, C.ambar, 0.4 + Math.sin(t * 2.6) * 0.05);
    // puerta doble
    P(c, [x - 18 * s, y, x - 18 * s, y - 44 * s, x, y - 52 * s, x + 18 * s, y - 44 * s, x + 18 * s, y], "#5E3A22");
    L(c, x, y, x, y - 50 * s, "#3E2414", 2 * s);
    // techo alto de pizarra con dos buhardillas
    P(c, [x - w - 22 * s, y - 116 * s, x - w * 0.6, y - 196 * s, x + w * 0.6, y - 196 * s, x + w + 22 * s, y - 116 * s], C.pizarraSombra);
    P(c, [x - w * 0.6, y - 196 * s, x + w * 0.6, y - 196 * s, x + w + 22 * s, y - 116 * s, x - w * 0.1, y - 116 * s], C.pizarra);
    [-40, 40].forEach((dx) => {
      P(c, [x + (dx - 16) * s, y - 132 * s, x + (dx - 16) * s, y - 150 * s, x + dx * s, y - 164 * s, x + (dx + 16) * s, y - 150 * s, x + (dx + 16) * s, y - 132 * s], "#D8C8A8");
      R(c, x + (dx - 7) * s, y - 150 * s, 14 * s, 14 * s, "#1A140E");
      alfa(c, 0.7, () => R(c, x + (dx - 5) * s, y - 148 * s, 10 * s, 10 * s, C.ambar));
    });
    // chimenea del gran fogón
    R(c, x + 50 * s, y - 214 * s, 18 * s, 50 * s, "#5A5650");
    for (let k = 0; k < 4; k++) {
      const p = (t * 0.2 + k / 4) % 1;
      alfa(c, 0.25 * (1 - p), () => E(c, x + 59 * s + Math.sin(p * 5 + k) * 9 * s, y - 220 * s - p * 90 * s, (5 + p * 14) * s, (4 + p * 10) * s, "#8A8E88"));
    }
    // el cartel: un hongo dorado colgado de un brazo de hierro
    L(c, x + w + 8 * s, y - 92 * s, x + w + 46 * s, y - 92 * s, C.hierro, 3 * s);
    const bal = Math.sin(t * 1.5) * 0.08;
    c.save();
    c.translate(x + w + 38 * s, y - 92 * s);
    c.rotate(bal);
    L(c, 0, 0, 0, 8 * s, C.hierro, 1.5 * s);
    R(c, -16 * s, 8 * s, 32 * s, 30 * s, C.maderaSombra);
    R(c, -2 * s, 22 * s, 4 * s, 12 * s, "#E8DCC4");
    P(c, [-12 * s, 24 * s, 0, 12 * s, 12 * s, 24 * s], C.ambar);
    P(c, [0, 12 * s, 12 * s, 24 * s, 3 * s, 24 * s], "#FFE8B0");
    c.restore();
    // banco y barriles
    R(c, x - w + 10 * s, y + 4 * s, 60 * s, 6 * s, C.madera);
    [[w - 20, 0], [w - 2, 6]].forEach(([dx, dy]) => {
      P(c, [x + (dx - 10) * s, y + dy * s, x + (dx - 11) * s, y + (dy - 24) * s, x + (dx + 11) * s, y + (dy - 24) * s, x + (dx + 10) * s, y + dy * s], C.madera);
      R(c, x + (dx - 11) * s, y + (dy - 18) * s, 22 * s, 2.5 * s, C.hierro);
      R(c, x + (dx - 11) * s, y + (dy - 7) * s, 22 * s, 2.5 * s, C.hierro);
    });
  }

  // Las huertas del este de Eikholt: surcos de coles y puerros con un cerco bajo de mimbre y un espantapájaros
  // con el trapo rojo de la arena.
  function huerta(c, x, y, t, o) {
    const s = o.s || 1,
      w = 150 * s,
      r = azar((o.sem || 1) * 71);
    P(c, [x - w, y + 50 * s, x - w + 20 * s, y - 50 * s, x + w + 20 * s, y - 50 * s, x + w, y + 50 * s], "#3E3222");
    for (let f = 0; f < 6; f++) {
      const fy = y - 40 * s + f * 16 * s,
        ox = (1 - f / 6) * 20 * s;
      P(c, [x - w + ox + 6 * s, fy, x + w + ox - 6 * s, fy, x + w + ox - 8 * s, fy + 8 * s, x - w + ox + 8 * s, fy + 8 * s], "#5A4630");
      for (let k = 0; k < 16; k++) {
        const px = x - w + ox + 16 * s + k * 18 * s;
        if (f % 2) P(c, [px - 2 * s, fy + 4 * s, px, fy - 10 * s - r() * 4 * s, px + 2 * s, fy + 4 * s], C.musgoClaro);
        else E(c, px, fy, 6 * s, 4 * s, r() < 0.5 ? "#6E8A44" : "#84A050");
      }
    }
    // cerco de mimbre adelante
    for (let k = 0; k < 16; k++) R(c, x - w + k * 20 * s, y + 38 * s, 3 * s, 18 * s, C.maderaSombra);
    L(c, x - w, y + 44 * s, x + w, y + 44 * s, "#8A7A5A", 3 * s);
    // espantapájaros
    const ex = x + w * 0.5,
      ey = y - 4 * s;
    R(c, ex - 2 * s, ey - 70 * s, 4 * s, 70 * s, C.maderaSombra);
    R(c, ex - 26 * s, ey - 56 * s, 52 * s, 4 * s, C.maderaSombra);
    P(c, [ex - 14 * s, ey - 56 * s, ex + 14 * s, ey - 56 * s, ex + 10 * s, ey - 26 * s, ex - 10 * s, ey - 26 * s], C.rojoEromash);
    E(c, ex, ey - 66 * s, 9 * s, 9 * s, "#D8C8A8");
    P(c, [ex - 14 * s, ey - 70 * s, ex, ey - 84 * s, ex + 14 * s, ey - 70 * s], "#B8A060");
  }

  const L2 = ASSETS.LISTA;
  Object.assign(L2, {
    muralla: { f: muralla, alto: 140, choque: null, grupo: "capital" },
    torreVigia: { f: torreVigia, alto: 240, choque: { r: 34 }, grupo: "capital", luz: true },
    piedraMuralla: { f: piedraMuralla, alto: 136, choque: { r: 22 }, grupo: "capital", luz: true },
    puertaSur: { f: puertaSur, alto: 262, choque: null, grupo: "capital", luz: true },
    granTablero: { f: granTablero, alto: 150, choque: { w: 150, h: 14 }, grupo: "capital" },
    tingCirculo: { f: tingCirculo, alto: 128, choque: { r: 24 }, grupo: "capital" },
    toldo: { f: toldo, alto: 100, choque: { w: 110, h: 20 }, grupo: "capital" },
    herreriaAsa: { f: herreriaAsa, alto: 160, choque: { w: 210, h: 30 }, grupo: "capital", luz: true },
    cordeleriaFolke: { f: cordeleriaFolke, alto: 80, choque: { w: 40, h: 14 }, grupo: "capital" },
    casaSanacion: { f: casaSanacion, alto: 180, choque: { w: 250, h: 40 }, grupo: "capital" },
    hongoDorado: { f: hongoDorado, alto: 220, choque: { w: 210, h: 40 }, grupo: "capital", luz: true },
    huerta: { f: huerta, alto: 90, choque: null, grupo: "capital" },
  });
  // ejemplos para el catálogo
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, { muralla: { x2: 160, y2: -10 }, toldo: { v: 0 } });
})();
