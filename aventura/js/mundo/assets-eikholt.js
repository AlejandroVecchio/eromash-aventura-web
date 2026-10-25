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
    P(c, [x - w, y - 50 * s, x - w, y - 50 * s - h, x + w, y - 50 * s - h, x + w, y - 50 * s], "#5A4030");
    P(c, [x - w, y - 50 * s, x - w, y - 50 * s - h, x - w + 12 * s, y - 50 * s - h, x - w + 12 * s, y - 50 * s], "#3A281A");
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
    P(c, [x - w - 8 * s, y - 56 * s, x - w - 8 * s, y - 118 * s, x + w + 8 * s, y - 118 * s, x + w + 8 * s, y - 56 * s], "#6A4A30");
    P(c, [x - w - 8 * s, y - 56 * s, x - w - 8 * s, y - 118 * s, x - w + 4 * s, y - 118 * s, x - w + 4 * s, y - 56 * s], "#42301E");
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

  // ======================================================================
  //  LOS MISMOS, ARMADOS CON CARAS (todo girable, comun/volumen.js)
  // ======================================================================
  // De frente y sin girar se ve el dibujo de siempre; girado (él o la cámara), estos.
  const T = C.T;
  // un farol de poste: palo, caja de hierro y la luz
  function farolV(c, pr, u, w, h, t, k) {
    VOL.cubo(c, pr, u, w, 4, 4, h, T.oscura);
    VOL.cubo(c, pr, u, w, 14, 14, 16, T.hierro, null, h);
    VOL.cubo(c, pr, u, w, 10, 10, 12, [C.ambar, C.ambar, "#FFE8B0"], null, h + 2);
    VOL.halo(c, pr, u, w, h + 8, 44, C.ambar, 0.6 + Math.sin(t * 4 + k) * 0.08);
  }
  // un tronco parado con punta (empalizadas): prisma de seis caras y la punta
  function troncoPunta(c, pr, u, w, r, h, col, punta = 14) {
    VOL.cilindro(c, pr, u, w, r, 0, h, col, { n: 6, fase: 0.5 });
    VOL.piramide(c, pr, VOL.redonda(u, w, r, 6, 0.5), h, u, w, h + punta, col);
  }
  // la muralla: los troncos de punta a punta, con las fajas del lado que se ve
  function murallaV(c, x, y, t, o) {
    const pr = VOL.prSeg(x, y, o.x2, o.y2, o),
      l = pr.largo,
      n = Math.max(2, Math.round(l / 17)),
      r = azar((o.sem || 1) * 977),
      frente = pr.mira(0, 1)[1] >= 0 ? 1 : -1,
      paso = l / n;
    const S = VOL.escena(pr);
    for (let k = 0; k < n; k++) {
      const u = (k + 0.5) * paso,
        h = 116 + r() * 18,
        marca = r() < 0.06,
        col = k % 2 ? T.madera : T.vieja;
      S.poner(u, 0, () => {
        troncoPunta(c, pr, u, 0, 9, h, col);
        if (marca) VOL.cara(c, pr, frente > 0 ? [[u - 4, 9, 68], [u + 4, 9, 68], [u + 4, 9, 76], [u - 4, 9, 76]] : [[u + 4, -9, 68], [u - 4, -9, 68], [u - 4, -9, 76], [u + 4, -9, 76]], C.rojoEromash);
        // las fajas, del lado que mira a la cámara
        [44, 92].forEach((hh, i) => VOL.palo(c, pr, u - paso / 2, 10 * frente, hh, u + paso / 2, 10 * frente, hh, 5, i ? C.hierro : "#8A7A5A"));
      });
    }
    S.dibujar();
  }
  // la torre de vigía: cuatro patas, la caseta con su ventana encendida y el techo a cuatro aguas
  function torreVigiaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 0, 0, 50, 50, 0.36);
    const S = VOL.escena(pr);
    [[-28, -28], [28, -28], [-28, 28], [28, 28]].forEach(([u, w]) => S.poner(u, w, () => VOL.cubo(c, pr, u, w, 7, 7, 150, T.madera)));
    S.poner(0, 0, () => {
      // las cruces entre las patas, adelante
      VOL.palo(c, pr, -28, 28, 10, 28, 28, 120, 4, C.maderaSombra);
      VOL.palo(c, pr, 28, 28, 10, -28, 28, 120, 4, C.maderaVieja);
    });
    S.dibujar();
    const tablas = (cc, l, h) => {
      for (let k = 0; k < 5; k++) R(cc, (k * l) / 4 - 1.5, -h, 3, h, C.maderaSombra);
    };
    const ventana = (cc, l, h) => {
      tablas(cc, l, h);
      R(cc, l / 2 - 11, -36, 22, 18, "#1A140E");
      alfa(cc, 0.7, () => R(cc, l / 2 - 9, -34, 18, 14, C.ambar));
    };
    VOL.cubo(c, pr, 0, 0, 88, 88, 6, T.oscura, null, 146);
    VOL.caja(c, pr, -40, -40, 152, 40, 40, 198, T.madera, { frente: ventana, atras: tablas, izq: tablas, der: ventana, tapa: T.oscura[0] });
    VOL.piramide(c, pr, [[-48, -48], [48, -48], [48, 48], [-48, 48]], 196, 0, 0, 240, T.pizarra);
    VOL.halo(c, pr, 0, 40, 177, 50, C.ambar, 0.5 + Math.sin(t * 3 + (o.sem || 0)) * 0.08);
  }
  // un menhir de cuatro caras algo torcidas; la runa tallada solo en la de adelante
  function menhirV(c, pr, a, f, h, col, frente) {
    const p0 = [[-a, -f], [a * 0.9, -f * 1.1], [a, f], [-a * 1.05, f * 0.9]],
      p1 = [[-a * 0.5, -f * 0.6], [a * 0.55, -f * 0.5], [a * 0.5, f * 0.55], [-a * 0.55, f * 0.5]];
    // los lados, de abajo a arriba
    const lados = [];
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      lados.push([[p0[i][0], p0[i][1], 0], [p0[j][0], p0[j][1], 0], [p1[j][0], p1[j][1], h * 0.82], [p1[i][0], p1[i][1], h * 0.82]]);
    }
    lados.forEach((q, i) => {
      VOL.afuera(q, [(q[0][0] + q[1][0]) / 2, (q[0][1] + q[1][1]) / 2, 0]);
      const esFrente = i === 2;
      // la del frente, con sus puntas en orden (abajo izquierda, abajo derecha, arriba...) para que lo tallado quede derecho
      if (esFrente) q = [[p0[3][0], p0[3][1], 0], [p0[2][0], p0[2][1], 0], [p1[2][0], p1[2][1], h * 0.82], [p1[3][0], p1[3][1], h * 0.82]];
      VOL.cara(c, pr, q, col, esFrente && frente ? VOL.medida(a * 2, h * 0.82, frente) : null);
    });
    VOL.piramide(c, pr, p1, h * 0.82, 0.1 * a, 0, h, col);
  }
  function piedraMurallaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      luz = 0.75 + Math.sin(t * 1.8 + (o.sem || 0)) * 0.2;
    VOL.halo(c, pr, 0, 0, 70, 70, RUNICO, luz);
    VOL.sombra(c, pr, 0, 0, 30, 18);
    menhirV(c, pr, 24, 16, 136, ["#3A3E42", "#4A4E52", "#5E6266"], (cc, l) => {
      runa(cc, "algiz", l / 2 - 11, -112, 22, 56, RUNICO, 4);
      alfa(cc, 0.6, () => runa(cc, "algiz", l / 2 - 11, -112, 22, 56, RUNICO_CLARO, 1.6));
    });
    VOL.elipse(c, pr, 0, 16, 2, 22, 6, C.musgo2);
  }
  // la Puerta del Sur: dos torres de piedra y troncos, las hojas abiertas hacia adentro y el dintel con Raido
  function puertaSurV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 0, 0, 230, 70, 0.38);
    const piedra = (cc, l) => {
      for (let k = 1; k < 4; k++) R(cc, 0, -k * 15, l, 2, "#46423C");
    };
    const tablas = (cc, l, h) => {
      for (let k = 0; k < 5; k++) R(cc, (k * l) / 4 - 1.5, -h, 3, h, C.maderaSombra);
    };
    const S = VOL.escena(pr);
    // las hojas, abiertas hacia adentro (atrás)
    [-1, 1].forEach((l) =>
      S.poner(l * 90, -20, () => {
        const a = [l * 110, 0],
          b = [l * 76, -44];
        VOL.lamina(c, pr, l < 0 ? [[a[0], a[1], 4], [b[0], b[1], 4], [b[0], b[1], 166], [a[0], a[1], 150]] : [[b[0], b[1], 4], [a[0], a[1], 4], [a[0], a[1], 150], [b[0], b[1], 166]], T.madera, T.oscura);
      }),
    );
    [-1, 1].forEach((lado) => {
      const u = lado * 150;
      S.poner(u, 0, () => {
        VOL.cubo(c, pr, u, 0, 88, 88, 60, T.piedra, { frente: piedra, atras: piedra, der: piedra, izq: piedra });
        const ven = (cc, l, h) => {
          tablas(cc, l, h);
          R(cc, l / 2 - 11, -120, 22, 26, "#1A140E");
          alfa(cc, 0.75, () => R(cc, l / 2 - 9, -118, 18, 22, C.ambar));
        };
        VOL.cubo(c, pr, u, 0, 80, 80, 150, T.madera, { frente: ven, atras: ven, der: tablas, izq: tablas }, 60);
        VOL.piramide(c, pr, [[u - 54, -54], [u + 54, -54], [u + 54, 54], [u - 54, 54]], 206, u, 0, 262, T.pizarra);
        VOL.halo(c, pr, u, 40, 166, 60, C.ambar, 0.5);
      });
      // los faroles junto a la entrada, adelante y atrás
      [52, -52].forEach((w) => S.poner(u - lado * 52, w, () => farolV(c, pr, u - lado * 52, w, 70, t, lado)));
    });
    // el dintel con la runa y el pasillo de arriba
    S.poner(0, 0, () => {
      const raido = (cc, l) => {
        R(cc, l / 2 - 30, -28, 60, 28, "#3A2A1C");
        runa(cc, "raido", l / 2 - 9, -24, 18, 20, C.ambar, 3);
      };
      VOL.caja(c, pr, -112, -16, 196, 112, 16, 226, T.oscura, { frente: raido, atras: raido });
      VOL.caja(c, pr, -104, -20, 226, 104, 20, 236, T.madera);
    }, 196);
    S.dibujar();
  }
  // el Tablero de las Sendas: dos postes, el tablero con las tablillas de cada lado y el alero
  function granTableroV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 0, 0, 84, 26);
    const tablillas = (cc, l, h) => {
      const r = azar(41);
      for (let f = 0; f < 4; f++)
        for (let k = 0; k < 7; k++) {
          const tx = 8 + k * 17,
            ty = -h + 8 + f * 19,
            vuelta = r() < 0.35;
          R(cc, tx, ty, 13, 14, vuelta ? "#7BC86C" : r() < 0.3 ? C.rojoEromash : C.maderaLuz);
          R(cc, tx + 2, ty + 4, 9, 1.5, "#2A2016");
        }
    };
    VOL.cubo(c, pr, -66, 0, 7, 7, 130, T.madera);
    VOL.cubo(c, pr, 66, 0, 7, 7, 130, T.madera);
    VOL.caja(c, pr, -66, -4, 34, 66, 4, 120, T.vieja, { frente: tablillas, atras: tablillas });
    VOL.techo(c, pr, -84, -22, 84, 22, 120, 26, T.madera);
    // las flechas de las rutas, arriba
    [-1, 1].forEach((d) => VOL.caja(c, pr, d * 38 - 24, -3, 151, d * 38 + 24, 3, 165, d > 0 ? T.madera : T.vieja));
  }
  // el Círculo del Ting: los doce asientos en ronda (en el piso, giran con él) y el menhir negro
  function tingCirculoV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.enPiso(c, pr, (cc) => E(cc, 0, 0, 190, 100, "rgba(60,52,36,0.55)"));
    const S = VOL.escena(pr);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * TAU,
        u = Math.cos(a) * 150,
        w = Math.sin(a) * 78;
      S.poner(u, w, () => {
        VOL.sombra(c, pr, u, w, 20, 12, 0.3);
        // el asiento mira al menhir
        const p = VOL.proyector(pr(u, w)[0], pr(u, w)[1], pr.fi + a + Math.PI / 2, { s: pr.s });
        VOL.cubo(c, p, 0, 0, 30, 18, 24, ["#5E5C58", "#5E5C58", "#74726C", "#86847C"]);
      });
    }
    S.poner(0, 0, () => {
      VOL.sombra(c, pr, 0, 0, 30, 18, 0.4);
      menhirV(c, pr, 22, 16, 128, ["#141416", "#1C1C1E", "#2C2C30"], (cc, l) => alfa(cc, 0.5, () => runa(cc, "tiwaz", l / 2 - 8, -100, 16, 40, "#3A3A40", 3)));
    });
    S.dibujar();
  }
  // un toldo del mercado: cuatro postes, el mostrador con la mercadería encima y la tela a franjas
  function toldoV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      v = o.v || 0,
      telas = [["#F2ECEC", C.rojoEromash], ["#E0B2B2", "#5E130D"], ["#D8C8A8", "#6B5A3A"], ["#F2ECEC", "#4E5C32"], ["#E0B2B2", "#9C2315"], ["#D8C8A8", "#3E4E66"]][v % 6];
    VOL.sombra(c, pr, 0, 0, 66, 40);
    const S = VOL.escena(pr);
    [[-52, -30], [52, -30], [-52, 30], [52, 30]].forEach(([u, w]) => S.poner(u, w, () => VOL.cubo(c, pr, u, w, 4, 4, 84, T.madera)));
    S.poner(0, 14, () => {
      VOL.caja(c, pr, -54, 4, 0, 54, 26, 28, T.madera, { tapa: C.maderaSombra });
      // la mercadería: lo mismo de siempre, sobre la tapa
      const M = [
        (cc) => { for (let i = 0; i < 7; i++) VOL.cilindro(cc, pr, -42 + i * 14, 15, 5, 28, 34, ["#B88A3A", i % 2 ? "#E8B04A" : C.ambar, "#FFE8B0"], { n: 6 }); },
        (cc) => { for (let i = 0; i < 5; i++) VOL.cubo(cc, pr, -40 + i * 20, 15, 18, 7, 5, ["#6A7C88", "#8A9CA8", "#A8B8C4"], null, 28); },
        (cc) => { VOL.cubo(cc, pr, -24, 15, 40, 18, 12, ["#6E5038", "#8A6A4A", "#A07850"], null, 28); VOL.cubo(cc, pr, 25, 15, 40, 18, 10, ["#A89A82", "#C8B49A", "#DCCAB2"], null, 28); },
        (cc) => { for (let i = 0; i < 4; i++) VOL.elipse(cc, pr, -30 + i * 20, 15, 30, 8, 5, C.pasto); for (let i = 0; i < 6; i++) VOL.palo(cc, pr, -40 + i * 16, 4, 70, -40 + i * 16, 4, 52, 3, i % 2 ? C.musgoClaro : C.musgo2); },
        (cc) => { [["#A0583A", -38, 14], ["#B86A44", -16, 18], ["#8A4A30", 8, 12], ["#C07850", 30, 16]].forEach(([col, u, h]) => VOL.cilindro(cc, pr, u, 15, 8, 28, 28 + h, col, { n: 7 })); },
        (cc) => { [["#3E4E66", -31], ["#9C2315", -9], ["#E0B2B2", 13], ["#4E5C32", 35]].forEach(([col, u]) => VOL.cubo(cc, pr, u, 15, 18, 16, 11, col, null, 28)); },
      ];
      M[v % 6](c);
    });
    S.dibujar();
    // la tela: un techo a dos aguas bajo, a franjas (arriba de todo)
    const franjas = (cc, l, h) => {
      for (let i = 0; i < 6; i++) R(cc, (i * l) / 6, -h, l / 6 + 0.5, h, telas[i % 2]);
    };
    VOL.techo(c, pr, -60, -38, 60, 38, 84, 16, [telas[1], telas[0], telas[0]], { faldon: franjas, hastial: telas[1] });
  }
  // la herrería de Ása: postes, la pared del fondo, la fragua de piedra encendida con su chimenea, el yunque, las
  // herramientas y el cajón del mineral, bajo un techo de un agua
  function herreriaAsaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      brasa = 0.75 + Math.sin(t * 5) * 0.15 + Math.sin(t * 13) * 0.05;
    VOL.sombra(c, pr, 0, -10, 130, 60, 0.36);
    const S = VOL.escena(pr);
    S.poner(0, -40, () => VOL.caja(c, pr, -100, -46, 0, 100, -38, 106, T.oscura, { col_frente: "#3A2A1C" }));
    [[-100, 30], [96, 30], [-100, -42], [96, -42], [-20, 30]].forEach(([u, w]) => S.poner(u, w, () => VOL.cubo(c, pr, u, w, 7, 7, 112, T.madera)));
    S.poner(-60, -10, () => {
      VOL.caja(c, pr, -90, -30, 0, -30, 10, 50, T.piedra);
      VOL.elipse(c, pr, -60, -10, 50, 24, 14, "#2A1A12");
      alfa(c, brasa, () => {
        VOL.elipse(c, pr, -60, -10, 51, 18, 10, "#FF8D71");
        VOL.elipse(c, pr, -58, -10, 52, 9, 5, C.ambar);
      });
      VOL.halo(c, pr, -60, -10, 56, 80, "#FF8D71", brasa);
      VOL.caja(c, pr, -72, -30, 50, -46, -12, 150, T.piedra);
      if (!window.CALIDAD || CALIDAD.nivel !== "baja")
        for (let k = 0; k < 4; k++) {
          const p = (t * 0.25 + k / 4) % 1,
            q = pr(-59, -21, 158 + p * 110);
          alfa(c, 0.3 * (1 - p), () => E(c, q[0] + Math.sin(p * 5 + k) * 10, q[1], (6 + p * 16) * pr.s, (5 + p * 12) * pr.s, "#6A6A66"));
        }
    });
    S.poner(14, 10, () => {
      VOL.cilindro(c, pr, 14, 10, 12, 0, 22, T.tronco, { n: 7 });
      VOL.caja(c, pr, -6, 4, 22, 34, 16, 32, T.hierro);
    });
    S.poner(73, 20, () => {
      VOL.caja(c, pr, 54, 8, 0, 92, 32, 26, T.madera, { tapa: C.maderaSombra });
      VOL.cubo(c, pr, 64, 20, 8, 6, 4, "#3A3436", null, 26);
    });
    // herramientas colgadas de la viga de atrás
    S.poner(40, -36, () => [10, 30, 50, 70].forEach((u, i) => {
      VOL.palo(c, pr, u, -36, 98, u, -36, 70, 2.5, C.hierroLuz);
      if (i === 1) VOL.cubo(c, pr, u, -36, 12, 4, 6, T.hierro, null, 68);
    }));
    S.dibujar();
    VOL.aguaUna(c, pr, -112, -52, 132, 114, 36, 108, T.pizarra);
  }
  // la cordelería de Folke: postes con travesaño, las sogas tendidas, el torno y los rollos
  function cordeleriaFolkeV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 0, 0, 124, 26, 0.3);
    const S = VOL.escena(pr);
    [-107, -37, 33, 103].forEach((u, i) =>
      S.poner(u, 0, () => {
        VOL.cubo(c, pr, u, 0, 6, 6, 70, i % 2 ? T.madera : T.oscura);
        VOL.cubo(c, pr, u, 0, 6, 26, 5, T.oscura, null, 66);
      }),
    );
    S.poner(0, 0, () => [[-10, "#A8946C"], [0, "#C8B48C"], [10, "#A8946C"]].forEach(([w, col]) => {
      // cuelgan un poco en el medio
      const a = pr(-107, w, 62),
        m = pr(-5, w, 52),
        b = pr(103, w, 62);
      c.strokeStyle = col;
      c.lineWidth = 2.5 * pr.s;
      c.beginPath();
      c.moveTo(a[0], a[1]);
      c.quadraticCurveTo(m[0] * 2 - (a[0] + b[0]) / 2, m[1] * 2 - (a[1] + b[1]) / 2, b[0], b[1]);
      c.stroke();
    }), 50);
    S.poner(-127, 0, () => {
      VOL.cubo(c, pr, -127, 0, 22, 14, 50, T.madera);
      VOL.rollo(c, pr, -127 - 2, -127 + 2, 9, 50, 14, T.oscura, { corte: C.maderaLuz, n: 8 });
    });
    [[70, 10], [92, 6]].forEach(([u, w]) =>
      S.poner(u, w, () => {
        VOL.cilindro(c, pr, u, w, 14, 0, 6, ["#8A7650", "#A8946C", "#C8B48C"], { n: 10 });
        VOL.elipse(c, pr, u, w, 6, 4, 4, "#6B5A3A");
      }),
    );
    S.poner(37, 8, () => VOL.cubo(c, pr, 37, 8, 32, 16, 20, ["#9A8448", "#B8A060", "#CCB670"]));
    S.dibujar();
  }
  // la Casa de Sanación: casa larga de troncos sobre un zócalo, puerta verde, techo de tablas, hierbas colgadas, la
  // cama con toldo a un costado y el jardín medicinal adelante
  function casaSanacionV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 0, -30, 150, 70, 0.34);
    const S = VOL.escena(pr);
    // el jardín: hileras en el piso con sus plantas paradas
    S.poner(-20, 26, () => {
      for (let f = 0; f < 3; f++) {
        const w = 6 + f * 18;
        VOL.enPiso(c, pr, (cc) => R(cc, -110, w - 5, 180, 10, "#3A3022"));
        for (let k = 0; k < 11; k++) VOL.palo(c, pr, -98 + k * 18, w, 0, -98 + k * 18, w, 12, 5, [C.musgoClaro, "#8A6A9A", "#B8A040"][(f + k) % 3]);
      }
    });
    S.poner(0, -40, () => {
      const pared = (cc, l, h) => {
        for (let k = 0; k <= 6; k++) R(cc, (k * l) / 6 - 2.5, -h, 5, h, C.maderaSombra);
        R(cc, 0, -4, l, 5, C.maderaSombra);
      };
      const frente = (cc, l, h) => {
        pared(cc, l, h);
        P(cc, [l / 2 - 14, 0, l / 2 - 14, -44, l / 2, -50, l / 2 + 14, -44, l / 2 + 14, 0], "#3E5A32");
        [[l / 2 - 70, -48], [l / 2 + 52, -48]].forEach(([u, z]) => {
          R(cc, u, z, 20, 18, "#1A140E");
          alfa(cc, 0.6, () => R(cc, u + 2, z + 2, 16, 14, C.ambar));
        });
      };
      VOL.caja(c, pr, -120, -70, 0, 120, -10, 62, ["#3A281A", "#5A4030", "#6E5038"], { frente, atras: pared, izq: pared, der: pared });
      VOL.techo(c, pr, -136, -84, 136, 4, 62, 50, T.vieja, { hastial: "#5A4030" });
      // hierbas colgadas del alero de adelante
      for (let k = 0; k < 9; k++) {
        const u = -100 + k * 26;
        VOL.palo(c, pr, u, 2, 62, u, 2, 50, 1, "#8A7A5A");
        VOL.palo(c, pr, u, 2, 50, u, 2, 38, 6, k % 3 ? C.musgo2 : "#8A6A9A");
      }
    });
    S.poner(115, -6, () => {
      VOL.cubo(c, pr, 85, -6, 4, 4, 24, T.oscura);
      VOL.caja(c, pr, 80, -18, 0, 150, 6, 10, T.madera, { tapa: "#E8DCC4" });
    });
    S.dibujar();
  }
  // el Hongo Dorado: planta baja de piedra, piso alto de madera más ancho, ventanas encendidas, techo alto de pizarra
  // con dos buhardillas, chimenea, el cartel del hongo, el banco y los barriles
  function hongoDoradoV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 0, -20, 140, 70, 0.36);
    const vent = (cc, u, z) => {
      R(cc, u, z, 18, 18, "#1A140E");
      alfa(cc, 0.75, () => R(cc, u + 2, z + 2, 14, 14, C.ambar));
    };
    const bajo = (cc, l) => {
      for (let k = 1; k < 4; k++) R(cc, 0, -k * 14, l, 2, "#46423C");
      vent(cc, l * 0.17, -40);
      vent(cc, l * 0.78, -40);
    };
    const bajoPuerta = (cc, l) => {
      bajo(cc, l);
      P(cc, [l / 2 - 18, 0, l / 2 - 18, -44, l / 2, -52, l / 2 + 18, -44, l / 2 + 18, 0], "#5E3A22");
      L(cc, l / 2, 0, l / 2, -50, "#3E2414", 2);
    };
    const alto = (cc, l, h) => {
      for (let k = 0; k <= 5; k++) R(cc, (k * l) / 5 - 2.5, -h, 5, h, C.maderaSombra);
      R(cc, 0, -4, l, 6, C.maderaSombra);
      [0.12, 0.38, 0.6, 0.82].forEach((u) => vent(cc, l * u - 9, -44));
    };
    const S = VOL.escena(pr);
    S.poner(0, -40, () => {
      VOL.caja(c, pr, -100, -80, 0, 100, 0, 56, T.piedra, { frente: bajoPuerta, atras: bajo, izq: bajo, der: bajo });
      VOL.caja(c, pr, -108, -86, 56, 108, 6, 118, ["#42301E", "#6A4A30", "#80603F"], { frente: alto, atras: alto, izq: alto, der: alto });
      VOL.techo(c, pr, -122, -96, 122, 16, 116, 80, T.pizarra, { hastial: "#6A4A30" });
      // las buhardillas, en el faldón de adelante
      [-40, 40].forEach((u) => {
        const buh = (cc, l, h) => {
          R(cc, l / 2 - 7, -h + 4, 14, 14, "#1A140E");
          alfa(cc, 0.7, () => R(cc, l / 2 - 5, -h + 6, 10, 10, C.ambar));
        };
        VOL.caja(c, pr, u - 16, -20, 130, u + 16, 4, 152, ["#B8A888", "#D8C8A8", "#E8DCC4"], { frente: buh, sinTapa: true });
        VOL.techo(c, pr, u - 18, -24, u + 18, 6, 150, 14, T.pizarra, { eje: "w" });
      });
      // la chimenea del gran fogón
      VOL.cubo(c, pr, 50, -50, 18, 18, 100, T.piedra, null, 140);
      if (!window.CALIDAD || CALIDAD.nivel !== "baja")
        for (let k = 0; k < 4; k++) {
          const p = (t * 0.2 + k / 4) % 1,
            q = pr(50, -50, 246 + p * 90);
          alfa(c, 0.25 * (1 - p), () => E(c, q[0] + Math.sin(p * 5 + k) * 9, q[1], (5 + p * 14) * pr.s, (4 + p * 10) * pr.s, "#8A8E88"));
        }
      VOL.halo(c, pr, 0, 0, 50, 150, C.ambar, 0.4 + Math.sin(t * 2.6) * 0.05);
    });
    // el cartel colgado del brazo de hierro, en la esquina de adelante
    S.poner(140, 0, () => {
      VOL.palo(c, pr, 108, 0, 92, 146, 0, 92, 3, C.hierro);
      const bal = Math.sin(t * 1.5) * 4;
      const cartel = (cc, l, h) => {
        R(cc, l / 2 - 2, -h * 0.5, 4, h * 0.4, "#E8DCC4");
        P(cc, [l / 2 - 12, -h * 0.47, l / 2, -h * 0.87, l / 2 + 12, -h * 0.47], C.ambar);
      };
      VOL.plano(c, pr, 122 + bal, 154 + bal, 0, 54, 84, T.oscura, cartel);
    });
    S.poner(-50, 14, () => VOL.caja(c, pr, -90, 8, 0, -30, 20, 8, T.madera));
    [[80, 12], [98, 22]].forEach(([u, w]) =>
      S.poner(u, w, () => {
        VOL.cilindro(c, pr, u, w, 11, 0, 24, T.madera, { n: 8 });
        [6, 17].forEach((z) => VOL.cilindro(c, pr, u, w, 11.5, z, z + 2.5, T.hierro, { n: 8, sinTapa: true }));
      }),
    );
    S.dibujar();
  }
  // las huertas: el cantero en el piso con sus surcos, el cerco de mimbre alrededor y el espantapájaros
  function huertaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      r = azar((o.sem || 1) * 71),
      w = 150;
    VOL.enPiso(c, pr, (cc) => {
      R(cc, -w, -62, w * 2, 124, "#3E3222");
      for (let f = 0; f < 6; f++) R(cc, -w + 8, -52 + f * 20, w * 2 - 16, 10, "#5A4630");
    });
    const S = VOL.escena(pr);
    for (let f = 0; f < 6; f++)
      for (let k = 0; k < 16; k++) {
        const u = -w + 16 + k * 18,
          ww = -47 + f * 20,
          alto = 10 + r() * 4,
          col = r() < 0.5 ? "#6E8A44" : "#84A050";
        S.poner(u, ww, () => (f % 2 ? VOL.palo(c, pr, u, ww, 0, u, ww, alto, 3, C.musgoClaro) : VOL.elipse(c, pr, u, ww, 3, 6, 5, col)));
      }
    // el cerco, en los cuatro lados
    for (let k = 0; k <= 15; k++) {
      const u = -w + k * 20;
      [-62, 62].forEach((ww) => S.poner(u, ww, () => VOL.cubo(c, pr, u, ww, 3, 3, 18, T.oscura)));
    }
    S.poner(0, 62, () => VOL.palo(c, pr, -w, 62, 12, w, 62, 12, 3, "#8A7A5A"));
    S.poner(0, -62, () => VOL.palo(c, pr, -w, -62, 12, w, -62, 12, 3, "#8A7A5A"));
    const ex = w * 0.5;
    S.poner(ex, -4, () => {
      VOL.cubo(c, pr, ex, -4, 4, 4, 70, T.oscura);
      VOL.caja(c, pr, ex - 26, -6, 54, ex + 26, -2, 58, T.oscura);
      VOL.caja(c, pr, ex - 13, -8, 26, ex + 13, 0, 56, [C.rojoEromash, C.rojoEromash, "#B8301E"]);
      const q = pr(ex, -4, 66);
      E(c, q[0], q[1], 9 * pr.s, 9 * pr.s, "#D8C8A8");
      VOL.piramide(c, pr, VOL.redonda(ex, -4, 14, 6), 70, ex, -4, 84, "#B8A060");
    });
    S.dibujar();
  }

  const L2 = ASSETS.LISTA;
  Object.assign(L2, {
    muralla: { f: muralla, fv: murallaV, vol: true, alto: 140, choque: null, grupo: "capital" },
    torreVigia: { f: torreVigia, fv: torreVigiaV, vol: true, alto: 240, choque: { r: 34 }, grupo: "capital", luz: true },
    piedraMuralla: { f: piedraMuralla, fv: piedraMurallaV, vol: true, alto: 136, choque: { r: 22 }, grupo: "capital", luz: true },
    puertaSur: { f: puertaSur, fv: puertaSurV, vol: true, alto: 262, choque: null, grupo: "capital", luz: true },
    granTablero: { f: granTablero, fv: granTableroV, vol: true, alto: 150, choque: { w: 150, h: 14 }, grupo: "capital" },
    tingCirculo: { f: tingCirculo, fv: tingCirculoV, vol: true, alto: 128, choque: { r: 24 }, grupo: "capital" },
    toldo: { f: toldo, fv: toldoV, vol: true, alto: 100, choque: { w: 110, h: 20 }, grupo: "capital" },
    herreriaAsa: { f: herreriaAsa, fv: herreriaAsaV, vol: true, alto: 160, choque: { w: 210, h: 30 }, grupo: "capital", luz: true },
    cordeleriaFolke: { f: cordeleriaFolke, fv: cordeleriaFolkeV, vol: true, alto: 80, choque: { w: 40, h: 14 }, grupo: "capital" },
    casaSanacion: { f: casaSanacion, fv: casaSanacionV, vol: true, alto: 180, choque: { w: 250, h: 40 }, grupo: "capital" },
    hongoDorado: { f: hongoDorado, fv: hongoDoradoV, vol: true, alto: 220, choque: { w: 210, h: 40 }, grupo: "capital", luz: true },
    huerta: { f: huerta, fv: huertaV, vol: true, alto: 90, choque: null, grupo: "capital" },
  });
  // ejemplos para el catálogo
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, { muralla: { x2: 160, y2: -10 }, toldo: { v: 0 } });
  // piezas armadas con caras que usan otros archivos
  ASSETS.KIT = Object.assign(ASSETS.KIT || {}, { menhirV, farolV, troncoPunta, runa });
})();
