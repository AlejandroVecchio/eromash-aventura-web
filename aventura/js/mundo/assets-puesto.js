// ---------- El Puesto de Eydis imaginado (versión de Alejandro, 22/10/2026; se suma a ASSETS) ----------
// La casa de los guardasendas del sur: un recinto de palisada con tramos reparados de madera clara, el portón de
// Hrafngard con el poste tallado, el farol que no se apaga y la campana; la casa con su galería, la mesa de rutas y
// el tablero de las tablillas; el fuego de Halvard con la olla para todos; el mostrador de Ingrid junto a su carreta;
// la leñera y el ahumadero; la ropa tendida del cobertizo de viajeros; Grima, la perra vieja; y afuera, al oeste,
// la piedra antigua que cambió de color: violeta. Mismas reglas que assets.js.
(function () {
  "use strict";
  const { P, E, R, L, alfa, azar, sombra, halo, VIOLETA, TAU } = DIB;
  const C = ASSETS.C;
  const nivel = () => (window.CALIDAD ? CALIDAD.nivel : "alta");

  // Un tramo de la palisada del Puesto, de (x + o.ax, y + o.ay) a (x + o.bx, y + o.by). o.sem decide qué troncos
  // son de la reparación (más claros).
  function palisada(c, x, y, t, o) {
    const ax = x + (o.ax || 0),
      ay = y + (o.ay || 0),
      bx = x + (o.bx || 0),
      by = y + (o.by || 0),
      l = Math.hypot(bx - ax, by - ay),
      n = Math.max(2, Math.round(l / 17)),
      r = azar((o.sem || 1) * 313);
    for (let k = 0; k < n; k++) {
      const u = (k + 0.5) / n,
        px = ax + (bx - ax) * u,
        py = ay + (by - ay) * u,
        h = 112 + r() * 18,
        nuevo = r() < 0.16;
      P(c, [px - 8, py + 3, px - 8, py - h, px, py - h - 12, px + 8, py - h, px + 8, py + 3], nuevo ? "#B08A58" : k % 2 ? C.madera : C.maderaVieja);
      P(c, [px, py - h - 12, px + 8, py - h, px + 8, py + 3, px + 2, py + 3], nuevo ? "#C8A470" : k % 2 ? C.maderaLuz : C.madera);
    }
    L(c, ax, ay - 34, bx, by - 34, C.maderaSombra, 4);
    L(c, ax, ay - 86, bx, by - 86, C.maderaSombra, 4);
  }

  // El portón: dos postes con un travesaño, el poste tallado con el farol protegido de la lluvia, la campana de aviso
  // y el estandarte de la cornamenta. o.faroles 2: el de la salida a Eikholt, con un farol en cada poste.
  function portonPuesto(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 10 * s, y + 4 * s, 120 * s, 14 * s);
    [-1, 1].forEach((l) => {
      const px = x + l * 104 * s;
      P(c, [px - 12 * s, y, px - 12 * s, y - 170 * s, px + 12 * s, y - 170 * s, px + 12 * s, y], l < 0 ? C.maderaSombra : C.madera);
      P(c, [px - 16 * s, y - 170 * s, px, y - 186 * s, px + 16 * s, y - 170 * s], C.maderaSombra);
      // tallas del poste: rombos
      for (let k = 0; k < 3; k++) P(c, [px, y - 60 * s - k * 30 * s, px + 6 * s, y - 50 * s - k * 30 * s, px, y - 40 * s - k * 30 * s, px - 6 * s, y - 50 * s - k * 30 * s], C.maderaLuz);
      if (l < 0 || o.faroles === 2) {
        L(c, px, y - 150 * s, px - l * 30 * s, y - 150 * s, C.hierro, 3 * s);
        const fx = px - l * 30 * s;
        P(c, [fx - 12 * s, y - 140 * s, fx, y - 152 * s, fx + 12 * s, y - 140 * s], C.pizarraSombra);
        R(c, fx - 8 * s, y - 140 * s, 16 * s, 22 * s, "#1A140E");
        alfa(c, 0.95, () => R(c, fx - 6 * s, y - 138 * s, 12 * s, 18 * s, C.ambar));
        halo(c, fx, y - 128 * s, 80 * s, C.ambar, 0.8 + Math.sin(t * 4 + l) * 0.06);
      }
    });
    R(c, x - 124 * s, y - 166 * s, 248 * s, 14 * s, C.maderaSombra);
    R(c, x - 124 * s, y - 170 * s, 248 * s, 4 * s, C.maderaLuz);
    // la campana chica de aviso
    if (o.faroles !== 2) {
      L(c, x + 60 * s, y - 152 * s, x + 60 * s, y - 140 * s, C.hierro, 2 * s);
      P(c, [x + 54 * s, y - 140 * s, x + 50 * s, y - 120 * s, x + 70 * s, y - 120 * s, x + 66 * s, y - 140 * s], "#8A6A2A");
      // el estandarte verde con la insignia de Eikholt
      const v = Math.sin(t * 1.5) * 3 * s;
      P(c, [x - 30 * s, y - 152 * s, x + 10 * s, y - 152 * s, x + 10 * s + v, y - 90 * s, x - 10 * s + v, y - 100 * s, x - 30 * s + v, y - 90 * s], "#2C4226");
      DIB.insignia(c, (x2, y2) => [x - 10 * s + v * 0.5 + x2 * 40 * s, y - 146 * s + y2 * 40 * s], "#F2ECEC");
    }
  }

  // La mesa de rutas del porche: un mapa del sur tallado en una tabla, con clavijas de colores (quién anda por dónde).
  function mesaRutas(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 6 * s, y + 3 * s, 60 * s, 10 * s);
    [-46, 40].forEach((dx) => R(c, x + dx * s, y - 40 * s, 6 * s, 40 * s, C.maderaSombra));
    P(c, [x - 58 * s, y - 40 * s, x + 58 * s, y - 40 * s, x + 50 * s, y - 62 * s, x - 50 * s, y - 62 * s], "#B08A58");
    P(c, [x - 58 * s, y - 40 * s, x + 58 * s, y - 40 * s, x + 58 * s, y - 34 * s, x - 58 * s, y - 34 * s], C.maderaSombra);
    // el mapa tallado: caminos y un río
    L(c, x - 44 * s, y - 44 * s, x - 10 * s, y - 52 * s, "#5E4A36", 2 * s);
    L(c, x - 10 * s, y - 52 * s, x + 30 * s, y - 58 * s, "#5E4A36", 2 * s);
    L(c, x + 20 * s, y - 44 * s, x + 44 * s, y - 60 * s, "#3E6A7A", 2.5 * s);
    [[-30, -48, C.rojoEromash], [-8, -53, C.rojoEromash], [12, -56, "#F2ECEC"], [30, -57, C.rojoEromash], [-40, -45, "#3E5A34"]].forEach(([dx, dy, col]) => {
      R(c, x + dx * s - 1.5 * s, y + dy * s - 7 * s, 3 * s, 7 * s, col);
    });
    // el croquis enrollado
    E(c, x + 40 * s, y - 46 * s, 10 * s, 4 * s, "#E6DCC8");
  }

  // El tablero de las tablillas (va colgado en la pared de la casa): o.oscuras cuántas siguen del lado oscuro.
  function tableroTablillas(c, x, y, t, o) {
    const s = o.s || 1,
      osc = o.oscuras != null ? o.oscuras : 5,
      yy = y - 46 * s;
    P(c, [x - 52 * s, yy, x + 52 * s, yy, x + 52 * s, yy - 70 * s, x - 52 * s, yy - 70 * s], C.maderaSombra);
    for (let k = 0; k < 18; k++) {
      const col = k % 6,
        fila = Math.floor(k / 6),
        tx = x - 44 * s + col * 15 * s,
        ty = yy - 62 * s + fila * 20 * s,
        oscura = k >= 18 - osc;
      R(c, tx, ty, 11 * s, 16 * s, oscura ? "#2A2420" : "#D8C8A4");
      E(c, tx + 5.5 * s, ty + 2 * s, 1.5 * s, 1.5 * s, C.hierro);
    }
  }

  // El tablón de cacería del Puesto: dos postes con un alerito de tablas, los pedidos clavados (cada uno con la
  // huella de la criatura que se busca), la lanza cruzada de Tove y una tira roja. o.pedido: hay una cacería tomada
  // (su hoja falta y queda el clavo); o.cobrar: la cacería está cumplida y la hoja tomada vuelve con el sello rojo.
  function tablonCaza(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 6 * s, y + 3 * s, 64 * s, 11 * s);
    // los postes: el izquierdo en sombra
    R(c, x - 50 * s, y - 120 * s, 9 * s, 120 * s, C.maderaSombra);
    R(c, x + 41 * s, y - 120 * s, 9 * s, 120 * s, C.madera);
    // el tablero
    P(c, [x - 46 * s, y - 34 * s, x, y - 34 * s, x, y - 108 * s, x - 46 * s, y - 108 * s], "#6A4A2C");
    P(c, [x, y - 34 * s, x + 46 * s, y - 34 * s, x + 46 * s, y - 108 * s, x, y - 108 * s], "#8A6440");
    for (let k = 1; k < 4; k++) L(c, x - 46 * s, y - 34 * s - k * 18.5 * s, x + 46 * s, y - 34 * s - k * 18.5 * s, C.maderaSombra, 1.2 * s);
    // el alerito
    P(c, [x - 62 * s, y - 112 * s, x, y - 136 * s, x, y - 128 * s, x - 58 * s, y - 106 * s], "#4A3A2A");
    P(c, [x, y - 136 * s, x + 62 * s, y - 112 * s, x + 58 * s, y - 106 * s, x, y - 128 * s], "#6E5236");
    // los pedidos: hojas claras con la huella de la presa
    const hojas = [[-36, -100, -0.06], [-6, -98, 0.05], [22, -102, -0.03], [-30, -66, 0.04], [6, -64, -0.05]];
    hojas.forEach(([dx, dy, a], i) => {
      const hx = x + dx * s,
        hy = y + dy * s;
      if (i === 1 && o.pedido && !o.cobrar) return E(c, hx + 8 * s, hy + 2 * s, 1.6 * s, 1.6 * s, C.hierro); // la hoja que se llevaron
      c.save();
      c.translate(hx + 8 * s, hy + 12 * s);
      c.rotate(a);
      R(c, -9 * s, -12 * s, 18 * s, 24 * s, i % 2 ? "#E6DCC8" : "#D8C8A4");
      // la huella: almohadilla y cuatro dedos
      E(c, 0, 3 * s, 3.4 * s, 2.8 * s, "#5E4A36");
      [-4, -1.4, 1.4, 4].forEach((d, k) => E(c, d * s, (-3 - (k === 1 || k === 2 ? 1.5 : 0)) * s, 1.3 * s, 1.6 * s, "#5E4A36"));
      if (i === 1 && o.cobrar) E(c, 5 * s, 8 * s, 3.4 * s, 3.4 * s, C.rojoEromash); // el sello de cumplida
      c.restore();
      E(c, hx + 8 * s, hy + 1 * s, 1.4 * s, 1.4 * s, C.hierro);
    });
    // la lanza cruzada y la tira roja
    L(c, x - 58 * s, y - 20 * s, x + 30 * s, y - 128 * s, C.maderaVieja, 3 * s);
    P(c, [x + 30 * s, y - 128 * s, x + 36 * s, y - 142 * s, x + 26 * s, y - 132 * s], C.hierroLuz);
    const ond = Math.sin(t * 2.2 + x) * 2 * s;
    P(c, [x + 46 * s, y - 104 * s, x + 54 * s, y - 104 * s, x + 56 * s + ond, y - 70 * s, x + 50 * s + ond, y - 64 * s, x + 46 * s + ond, y - 72 * s], C.rojoEromash);
  }

  // El fuego de Halvard: anillo de piedras, el fuego vivo, el trípode con la olla para todos y un banco.
  function fogonOlla(c, x, y, t, o) {
    const s = o.s || 1;
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * TAU;
      E(c, x + Math.cos(a) * 34 * s, y + Math.sin(a) * 14 * s, 10 * s, 7 * s, k % 2 ? "#6E6A62" : "#5A5650");
    }
    E(c, x, y, 26 * s, 10 * s, "#1A140E");
    if (o.apagado) {
      // cenizas frías y unas ramas húmedas: se terminó la leña seca
      E(c, x, y - 2 * s, 18 * s, 6 * s, "#5A5650");
      L(c, x - 16 * s, y - 2 * s, x + 12 * s, y - 8 * s, C.maderaVieja, 3 * s);
      L(c, x - 8 * s, y - 8 * s, x + 16 * s, y, C.maderaSombra, 3 * s);
      return;
    }
    const f = Math.sin(t * 9) * 3 * s;
    P(c, [x - 18 * s, y, x - 6 * s, y - 34 * s - f, x, y - 18 * s, x + 6 * s, y - 40 * s + f, x + 18 * s, y], C.ambarFuerte);
    P(c, [x - 9 * s, y, x, y - 24 * s + f, x + 9 * s, y], C.ambar);
    halo(c, x, y - 18 * s, 90 * s, C.ambarFuerte, 0.8);
    // trípode y olla
    L(c, x - 34 * s, y + 4 * s, x, y - 70 * s, C.maderaSombra, 4 * s);
    L(c, x + 34 * s, y + 4 * s, x, y - 70 * s, C.madera, 4 * s);
    L(c, x, y - 70 * s, x, y - 48 * s, C.hierro, 2 * s);
    E(c, x, y - 36 * s, 18 * s, 14 * s, "#2A2A2E");
    E(c, x, y - 48 * s, 16 * s, 4 * s, "#46464C");
    if (nivel() !== "baja")
      for (let k = 0; k < 3; k++) {
        const p = (t * 0.3 + k / 3) % 1;
        alfa(c, 0.2 * (1 - p), () => E(c, x + Math.sin(p * 4 + k) * 6 * s, y - 56 * s - p * 70 * s, (4 + p * 10) * s, (3 + p * 7) * s, "#C8C4BC"));
      }
    // banco
    R(c, x + 50 * s, y + 18 * s, 90 * s, 8 * s, C.madera);
    R(c, x + 56 * s, y + 26 * s, 6 * s, 12 * s, C.maderaSombra);
    R(c, x + 128 * s, y + 26 * s, 6 * s, 12 * s, C.maderaSombra);
  }

  // El mostrador de Ingrid: cajas abiertas con una manta encima; pociones, vendas y alguna pieza de equipo.
  function mostradorManta(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 6 * s, y + 3 * s, 60 * s, 10 * s);
    [-30, 22].forEach((dx, i) => {
      P(c, [x + dx * s - 24 * s, y, x + dx * s - 24 * s, y - 34 * s, x + dx * s + 24 * s, y - 34 * s, x + dx * s + 24 * s, y], i ? C.madera : C.maderaVieja);
      R(c, x + dx * s - 24 * s, y - 34 * s, 48 * s, 4 * s, C.maderaLuz);
    });
    P(c, [x - 60 * s, y - 32 * s, x + 52 * s, y - 32 * s, x + 56 * s, y - 14 * s, x - 64 * s, y - 14 * s], "#7A2A1E");
    P(c, [x - 60 * s, y - 32 * s, x + 52 * s, y - 32 * s, x + 48 * s, y - 38 * s, x - 56 * s, y - 38 * s], "#9C3A2A");
    // frascos rojos y azules, un rollo de vendas, un escudo chico
    [[-44, "#C8402D"], [-34, "#4A78D0"], [-24, "#C8402D"], [-14, "#7BC86C"]].forEach(([dx, col]) => {
      R(c, x + dx * s - 3 * s, y - 50 * s, 6 * s, 12 * s, col);
      R(c, x + dx * s - 1.5 * s, y - 54 * s, 3 * s, 4 * s, "#C8B48C");
    });
    E(c, x + 6 * s, y - 42 * s, 10 * s, 5 * s, "#E6DCC8");
    E(c, x + 34 * s, y - 50 * s, 13 * s, 13 * s, C.maderaSombra);
    E(c, x + 34 * s, y - 50 * s, 4 * s, 4 * s, C.hierroLuz);
  }

  // La leñera y el ahumadero, contra la palisada: galpón con pescado colgando y humo, leña, trampas y un tonel de lanzas.
  function ahumadero(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 12 * s, y + 4 * s, 110 * s, 14 * s);
    P(c, [x - 70 * s, y, x - 70 * s, y - 96 * s, x + 30 * s, y - 96 * s, x + 30 * s, y], "#3A2A1C");
    R(c, x - 70 * s, y - 96 * s, 6 * s, 96 * s, C.maderaSombra);
    R(c, x + 24 * s, y - 96 * s, 6 * s, 96 * s, C.maderaSombra);
    // pescado colgando
    for (let k = 0; k < 5; k++) {
      const fx = x - 54 * s + k * 18 * s;
      L(c, fx, y - 90 * s, fx, y - 76 * s, "#C8B48C", 1.5 * s);
      P(c, [fx - 4 * s, y - 76 * s, fx + 4 * s, y - 76 * s, fx + 3 * s, y - 52 * s, fx, y - 46 * s, fx - 3 * s, y - 52 * s], k % 2 ? "#A8783A" : "#8A6A3A");
    }
    P(c, [x - 84 * s, y - 92 * s, x + 44 * s, y - 92 * s, x + 30 * s, y - 140 * s, x - 70 * s, y - 140 * s], C.maderaVieja);
    P(c, [x - 84 * s, y - 92 * s, x + 44 * s, y - 92 * s, x + 44 * s, y - 86 * s, x - 84 * s, y - 86 * s], C.maderaSombra);
    if (nivel() !== "baja")
      for (let k = 0; k < 3; k++) {
        const p = (t * 0.18 + k / 3) % 1;
        alfa(c, 0.18 * (1 - p), () => E(c, x - 20 * s + Math.sin(p * 4 + k) * 10 * s, y - 146 * s - p * 80 * s, (6 + p * 14) * s, (5 + p * 9) * s, "#A8A49C"));
      }
    // leña apilada a la derecha
    for (let f = 0; f < 4; f++)
      for (let k = 0; k < 5 - (f % 2); k++) {
        const lx = x + 50 * s + k * 13 * s + (f % 2) * 6 * s,
          ly = y - 6 * s - f * 11 * s;
        E(c, lx, ly, 6.5 * s, 6 * s, C.madera);
        E(c, lx, ly, 3 * s, 2.5 * s, C.maderaLuz);
      }
    // tonel con lanzas de repuesto
    const tx = x + 130 * s;
    P(c, [tx - 16 * s, y, tx - 18 * s, y - 40 * s, tx + 18 * s, y - 40 * s, tx + 16 * s, y], C.madera);
    R(c, tx - 18 * s, y - 30 * s, 36 * s, 3 * s, C.hierro);
    [-8, 0, 8].forEach((dx, i) => {
      L(c, tx + dx * s, y - 40 * s, tx + dx * 1.6 * s, y - 120 * s, C.maderaSombra, 3 * s);
      P(c, [tx + dx * 1.6 * s - 3 * s, y - 120 * s, tx + dx * 1.6 * s, y - 132 * s - i * 2 * s, tx + dx * 1.6 * s + 3 * s, y - 120 * s], C.hierroLuz);
    });
  }

  // La ropa tendida del cobertizo de viajeros: la parada lleva varios días.
  function tendedero(c, x, y, t, o) {
    const s = o.s || 1,
      v = Math.sin(t * 1.4) * 2 * s;
    R(c, x - 60 * s, y - 90 * s, 5 * s, 90 * s, C.maderaSombra);
    R(c, x + 56 * s, y - 90 * s, 5 * s, 90 * s, C.maderaSombra);
    L(c, x - 58 * s, y - 86 * s, x + 58 * s, y - 86 * s, "#C8B48C", 1.5 * s);
    [[-44, 22, "#C8C0B0"], [-16, 18, "#7A3A2A"], [10, 26, "#3E4E66"], [36, 16, "#E6DCC8"]].forEach(([dx, w, col]) =>
      P(c, [x + dx * s, y - 86 * s, x + (dx + w) * s, y - 86 * s, x + (dx + w) * s + v, y - 50 * s, x + dx * s + v, y - 54 * s], col)
    );
  }

  // Grima, la perra de rastreo vieja de Eydis: duerme enroscada junto al farol; o.despierta: sentada, mirando.
  function perraGrima(c, x, y, t, o) {
    const s = o.s || 1,
      cola = Math.sin(t * (o.despierta ? 8 : 1)) * (o.despierta ? 6 : 1) * s;
    sombra(c, x, y + 2 * s, 30 * s, 7 * s);
    if (!o.despierta) {
      E(c, x, y - 10 * s, 28 * s, 12 * s, "#6E5A44");
      E(c, x + 4 * s, y - 14 * s, 20 * s, 8 * s, "#86704E");
      E(c, x + 22 * s, y - 8 * s, 10 * s, 8 * s, "#5E4A36");
      P(c, [x + 18 * s, y - 14 * s, x + 22 * s, y - 22 * s, x + 26 * s, y - 14 * s], "#4A3A2A");
      E(c, x + 30 * s, y - 6 * s, 3 * s, 2 * s, "#1A140E");
      L(c, x - 26 * s, y - 6 * s, x - 18 * s + cola, y + 2 * s, "#6E5A44", 4 * s);
      // el hocico gris de vieja
      E(c, x + 28 * s, y - 7 * s, 4 * s, 3 * s, "#B8B0A0");
      return;
    }
    R(c, x - 2 * s, y - 16 * s, 5 * s, 16 * s, "#5E4A36");
    R(c, x + 8 * s, y - 16 * s, 5 * s, 16 * s, "#6E5A44");
    E(c, x - 4 * s, y - 14 * s, 16 * s, 12 * s, "#6E5A44");
    E(c, x + 6 * s, y - 28 * s, 12 * s, 16 * s, "#86704E");
    E(c, x + 10 * s, y - 46 * s, 10 * s, 9 * s, "#6E5A44");
    E(c, x + 18 * s, y - 44 * s, 6 * s, 4 * s, "#B8B0A0");
    P(c, [x + 4 * s, y - 50 * s, x + 2 * s, y - 62 * s, x + 10 * s, y - 52 * s], "#4A3A2A");
    E(c, x + 14 * s, y - 48 * s, 1.5 * s, 1.5 * s, "#1A140E");
    L(c, x - 18 * s, y - 8 * s, x - 28 * s + cola, y - 16 * s, "#6E5A44", 4 * s);
  }

  // La piedra de afuera: antigua, facetada, que «cambió de color el invierno pasado». Luz violeta con ataduras.
  function piedraVioleta(c, x, y, t, o) {
    const s = o.s || 1,
      late = 0.7 + Math.sin(t * 1.1) * 0.25;
    halo(c, x, y - 70 * s, 120 * s, VIOLETA, late);
    sombra(c, x + 10 * s, y + 4 * s, 40 * s, 10 * s);
    P(c, [x - 30 * s, y, x - 36 * s, y - 80 * s, x - 14 * s, y - 140 * s, x + 16 * s, y - 136 * s, x + 32 * s, y - 70 * s, x + 26 * s, y], "#B8B4C8");
    P(c, [x + 16 * s, y - 136 * s, x + 32 * s, y - 70 * s, x + 26 * s, y, x + 2 * s, y, x, y - 90 * s], "#D8D4E4");
    P(c, [x - 36 * s, y - 80 * s, x - 14 * s, y - 140 * s, x - 6 * s, y - 100 * s], "#9894AA");
    alfa(c, 0.5 + late * 0.5, () => FUTHARK.dibujar(c, "hagalaz", x, y - 40 * s, 60 * s, VIOLETA, 5 * s));
    if (o.vista) {
      // con la Lente se ven los restos de ataduras, como las del Ciervo
      c.strokeStyle = VIOLETA;
      c.lineWidth = 2.5 * s;
      c.beginPath();
      c.ellipse(x, y - 60 * s, 36 * s, 12 * s, 0.2, 0, TAU);
      c.stroke();
    }
  }

  // ======================================================================
  //  ARMADOS CON CARAS (todo girable, comun/volumen.js)
  // ======================================================================
  const T = C.T,
    troncoPunta = (...a) => ASSETS.KIT.troncoPunta(...a);
  // el tramo de palisada: troncos con punta de (ax, ay) a (bx, by) en el mundo y los dos travesaños de atrás
  function palisadaV(c, x, y, t, o) {
    const a = VOL.rel(x, y, o.ax || 0, o.ay || 0),
      b = VOL.rel(x, y, o.bx || 0, o.by || 0),
      pr = VOL.prVista(a[0], a[1], b[0], b[1]),
      l = pr.largo,
      n = Math.max(2, Math.round(l / 17)),
      r = azar((o.sem || 1) * 313);
    VOL.sombra(c, pr, l / 2, 0, l / 2 + 8, 12, 0.3);
    const S = VOL.escena(pr);
    [34, 86].forEach((z) => S.poner(l / 2, -11, () => VOL.caja(c, pr, 0, -13, z - 3, l, -9, z + 3, T.oscura), z));
    for (let k = 0; k < n; k++) {
      const u = ((k + 0.5) / n) * l,
        h = 112 + r() * 18,
        nuevo = r() < 0.16;
      S.poner(u, 0, () => troncoPunta(c, pr, u, 0, 8, h, nuevo ? ["#8A6A40", "#B08A58", "#C8A470"] : k % 2 ? T.madera : T.vieja, 12));
    }
    S.dibujar();
  }
  // el portón: los dos postes tallados con su punta, el travesaño, el farol (o dos), la campana y el estandarte
  function portonPuestoV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 10, 0, 124, 24);
    const S = VOL.escena(pr);
    [-1, 1].forEach((l) => {
      const u = l * 104;
      S.poner(u, 0, () => {
        const tallas = (cc, ll) => {
          for (let k = 0; k < 3; k++) P(cc, [ll / 2, -60 - k * 30, ll / 2 + 6, -50 - k * 30, ll / 2, -40 - k * 30, ll / 2 - 6, -50 - k * 30], C.maderaLuz);
        };
        VOL.cubo(c, pr, u, 0, 24, 24, 170, T.madera, { frente: tallas, atras: tallas, sinTapa: true });
        VOL.piramide(c, pr, [[u - 14, -14], [u + 14, -14], [u + 14, 14], [u - 14, 14]], 170, u, 0, 186, T.oscura);
        if (l < 0 || o.faroles === 2) {
          const fu = u - l * 30;
          VOL.palo(c, pr, u, 0, 150, fu, 0, 150, 3, C.hierro);
          VOL.cubo(c, pr, fu, 0, 16, 16, 22, ["#1A140E", "#1A140E", "#2A2018"], { frente: (cc, ll, h) => alfa(cc, 0.95, () => R(cc, 2, -h + 2, ll - 4, h - 4, C.ambar)), atras: (cc, ll, h) => alfa(cc, 0.95, () => R(cc, 2, -h + 2, ll - 4, h - 4, C.ambar)), izq: (cc, ll, h) => alfa(cc, 0.8, () => R(cc, 2, -h + 2, ll - 4, h - 4, C.ambar)), der: (cc, ll, h) => alfa(cc, 0.95, () => R(cc, 2, -h + 2, ll - 4, h - 4, C.ambar)) }, 118);
          VOL.piramide(c, pr, [[fu - 12, -12], [fu + 12, -12], [fu + 12, 12], [fu - 12, 12]], 140, fu, 0, 152, T.pizarra);
          VOL.halo(c, pr, fu, 0, 128, 80, C.ambar, 0.8 + Math.sin(t * 4 + l) * 0.06);
        }
      });
    });
    S.poner(0, 0, () => {
      VOL.caja(c, pr, -124, -7, 152, 124, 7, 170, T.oscura, { tapa: C.maderaLuz });
      if (o.faroles !== 2) {
        VOL.palo(c, pr, 60, 0, 152, 60, 0, 140, 2, C.hierro);
        VOL.cono(c, pr, 60, 0, 10, 6, 120, 140, ["#5A4418", "#8A6A2A", "#A8843A"], { n: 8 });
        const v = Math.sin(t * 1.5) * 3;
        VOL.plano(c, pr, -30, 10, 9, 90, 152, null, (cc, l, h) => {
          P(cc, [0, -h, l, -h, l + v, -h + 62, l * 0.5 + v, -h + 52, v, -h + 62], "#2C4226");
          [-1, 1].forEach((k) => L(cc, l * 0.5 + v * 0.5, -h + 36, l * 0.5 + k * 12 + v * 0.5, -h + 16, C.hueso, 2.5));
        });
      }
    }, 150);
    S.dibujar();
  }
  // la mesa de rutas: la tabla con el mapa tallado y las clavijas, las patas y el croquis enrollado
  function mesaRutasV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 6, 0, 62, 24);
    [[-48, -16], [48, -16], [-48, 16], [48, 16]].forEach(([u, w]) => VOL.cubo(c, pr, u, w, 6, 6, 36, T.oscura));
    VOL.caja(c, pr, -58, -22, 34, 58, 22, 40, T.madera, { tapa: "#B08A58" });
    VOL.enPiso(c, pr, (cc) => {
      L(cc, -44, 14, -10, 2, "#5E4A36", 2);
      L(cc, -10, 2, 30, -12, "#5E4A36", 2);
      L(cc, 20, 14, 44, -16, "#3E6A7A", 2.5);
    }, 40.5);
    [[-30, 8, C.rojoEromash], [-8, 0, C.rojoEromash], [12, -6, "#F2ECEC"], [30, -10, C.rojoEromash], [-40, 12, "#3E5A34"]].forEach(([u, w, col]) => VOL.cubo(c, pr, u, w, 3, 3, 7, [col, col, col], null, 40));
    VOL.rollo(c, pr, 32, 50, 12, 44, 4, ["#B8AC98", "#E6DCC8", "#F2ECEC"]);
  }
  // el tablero de las tablillas: la tabla y las dieciocho tablillas (las oscuras del lado oscuro)
  function tableroTablillasV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      osc = o.oscuras != null ? o.oscuras : 5;
    VOL.caja(c, pr, -52, -4, 46, 52, 0, 116, T.oscura, {
      frente: (cc, l, h) => {
        R(cc, 0, -h, l, h, C.maderaSombra);
        for (let k = 0; k < 18; k++) {
          const tx = 8 + (k % 6) * 15,
            ty = -h + 8 + Math.floor(k / 6) * 20;
          R(cc, tx, ty, 11, 16, k >= 18 - osc ? "#2A2420" : "#D8C8A4");
          E(cc, tx + 5.5, ty + 2, 1.5, 1.5, C.hierro);
        }
      },
    });
  }
  // el tablón de cacería: los dos postes, el tablero con los pedidos (frente) y tablas atrás, el alerito, la lanza
  // cruzada y la tira roja
  function tablonCazaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      hojas = [[-36, -100, -0.06], [-6, -98, 0.05], [22, -102, -0.03], [-30, -66, 0.04], [6, -64, -0.05]];
    VOL.sombra(c, pr, 6, 0, 64, 18);
    VOL.cubo(c, pr, -46, 0, 9, 9, 120, T.oscura);
    VOL.cubo(c, pr, 46, 0, 9, 9, 120, T.oscura);
    VOL.caja(c, pr, -46, -2, 34, 46, 2, 108, ["#5A3E24", "#6A4A2C", "#8A6440"], {
      frente: (cc, l, h) => {
        for (let k = 1; k < 4; k++) L(cc, 0, -k * 18.5, l, -k * 18.5, C.maderaSombra, 1.2);
        hojas.forEach(([dx, dy, a], i) => {
          const hx = 46 + dx,
            hy = dy + 34;
          if (i === 1 && o.pedido && !o.cobrar) return E(cc, hx + 8, hy + 2, 1.6, 1.6, C.hierro);
          cc.save();
          cc.translate(hx + 8, hy + 12);
          cc.rotate(a);
          R(cc, -9, -12, 18, 24, i % 2 ? "#E6DCC8" : "#D8C8A4");
          E(cc, 0, 3, 3.4, 2.8, "#5E4A36");
          [-4, -1.4, 1.4, 4].forEach((d, k) => E(cc, d, -3 - (k === 1 || k === 2 ? 1.5 : 0), 1.3, 1.6, "#5E4A36"));
          if (i === 1 && o.cobrar) E(cc, 5, 8, 3.4, 3.4, C.rojoEromash);
          cc.restore();
          E(cc, hx + 8, hy + 1, 1.4, 1.4, C.hierro);
        });
      },
      atras: (cc, l) => {
        for (let k = 1; k < 4; k++) L(cc, 0, -k * 18.5, l, -k * 18.5, C.maderaSombra, 1.2);
      },
    });
    VOL.techo(c, pr, -62, -14, 62, 14, 108, 24, ["#3A2C20", "#4A3A2A", "#6E5236"], { hastial: C.maderaSombra });
    VOL.palo(c, pr, -58, 6, 20, 30, 6, 128, 3, C.maderaVieja);
    VOL.piramide(c, pr, [[27, 4], [33, 4], [33, 8], [27, 8]], 128, 34, 6, 142, T.hierro);
    const ond = Math.sin(t * 2.2 + x) * 2;
    VOL.plano(c, pr, 46, 56, 3, 64, 104, null, (cc, l, h) => P(cc, [0, -h, l, -h, l + ond, -6, l * 0.5 + ond, 0, ond, -8], C.rojoEromash));
  }
  // el fuego de Halvard: el anillo de piedras, el fuego (o las cenizas), el trípode con la olla y el banco
  function fogonOllaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.elipse(c, pr, 0, 0, 0, 26, 26, "#1A140E");
    const S = VOL.escena(pr);
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * TAU,
        u = Math.cos(a) * 34,
        w = Math.sin(a) * 34;
      S.poner(u, w, () => VOL.prisma(c, pr, VOL.redonda(u, w, 9, 6, k), 0, 8, k % 2 ? ["#4E4A44", "#6E6A62", "#86827A"] : ["#45413C", "#5A5650", "#706C66"]));
    }
    S.poner(0, 0, () => {
      if (o.apagado) {
        VOL.elipse(c, pr, 0, 0, 1, 18, 18, "#5A5650");
        VOL.palo(c, pr, -16, 0, 3, 12, -6, 6, 3, C.maderaVieja);
        VOL.palo(c, pr, -8, -8, 6, 16, 4, 3, 3, C.maderaSombra);
        return;
      }
      const q = pr(0, 0, 0),
        s = pr.s,
        f = Math.sin(t * 9) * 3 * s;
      P(c, [q[0] - 18 * s, q[1], q[0] - 6 * s, q[1] - 34 * s - f, q[0], q[1] - 18 * s, q[0] + 6 * s, q[1] - 40 * s + f, q[0] + 18 * s, q[1]], C.ambarFuerte);
      P(c, [q[0] - 9 * s, q[1], q[0], q[1] - 24 * s + f, q[0] + 9 * s, q[1]], C.ambar);
      VOL.halo(c, pr, 0, 0, 18, 90, C.ambarFuerte, 0.8);
      [0, 2.1, 4.2].forEach((a, i) => VOL.palo(c, pr, Math.cos(a) * 34, Math.sin(a) * 34, 0, 0, 0, 70, 4, i ? C.madera : C.maderaSombra));
      VOL.palo(c, pr, 0, 0, 70, 0, 0, 48, 2, C.hierro);
      VOL.cilindro(c, pr, 0, 0, 16, 26, 48, ["#1E1E22", "#2A2A2E", "#46464C"], { n: 10 });
      if (nivel() !== "baja") {
        const p0 = pr(0, 0, 56);
        for (let k = 0; k < 3; k++) {
          const p = (t * 0.3 + k / 3) % 1;
          alfa(c, 0.2 * (1 - p), () => E(c, p0[0] + Math.sin(p * 4 + k) * 6 * s, p0[1] - p * 70 * s, (4 + p * 10) * s, (3 + p * 7) * s, "#C8C4BC"));
        }
      }
    }, 10);
    S.poner(95, 26, () => {
      VOL.caja(c, pr, 50, 22, 12, 140, 30, 18, T.madera);
      [56, 128].forEach((u) => VOL.cubo(c, pr, u + 3, 26, 6, 6, 12, T.oscura));
    });
    S.dibujar();
  }
  // el mostrador de Ingrid: dos cajas, la manta roja encima, frascos, vendas y un escudo chico
  function mostradorMantaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 6, 0, 62, 24);
    [-30, 22].forEach((u, i) => VOL.cubo(c, pr, u, 0, 48, 30, 34, i ? T.madera : T.vieja));
    VOL.caja(c, pr, -60, -18, 34, 54, 18, 38, ["#5E1E14", "#7A2A1E", "#9C3A2A"]);
    VOL.caja(c, pr, -62, 17, 16, 56, 19, 38, ["#5E1E14", "#7A2A1E", "#9C3A2A"], { sinTapa: true });
    [[-44, "#C8402D"], [-34, "#4A78D0"], [-24, "#C8402D"], [-14, "#7BC86C"]].forEach(([u, col]) => {
      VOL.cilindro(c, pr, u, 0, 3, 38, 50, [VOL.mezcla(col, "#000000", 0.3), col, col], { n: 6 });
      VOL.cilindro(c, pr, u, 0, 1.5, 50, 54, ["#8A7A5A", "#C8B48C", "#C8B48C"], { n: 6 });
    });
    VOL.rollo(c, pr, 0, 14, 4, 43, 5, ["#B8AC98", "#E6DCC8", "#F2ECEC"]);
    const p2 = VOL.sub(pr, 34, 2, 38);
    VOL.plano(c, p2, -13, 13, 0, 0, 26, null, (cc, l, h) => {
      E(cc, l / 2, -h / 2, 13, 13, C.maderaSombra);
      E(cc, l / 2, -h / 2, 4, 4, C.hierroLuz);
    });
  }
  // la leñera y el ahumadero: el galpón de tres paredes con pescado colgando y humo, la leña apilada y el tonel de lanzas
  function ahumaderoV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      tab = (cc, l, h) => {
        R(cc, 0, -h, l, h, "#3A2A1C");
        for (let k = 1; k < 8; k++) R(cc, 0, -k * 12, l, 2, "rgba(0,0,0,0.3)");
      };
    VOL.sombra(c, pr, 12, 0, 130, 34);
    const S = VOL.escena(pr);
    S.poner(-20, 0, () => {
      VOL.caja(c, pr, -70, -24, 0, 30, -20, 96, ["#2A1E14", "#3A2A1C", "#4E3A2A"], { frente: tab, atras: tab });
      VOL.caja(c, pr, -70, -20, 0, -66, 24, 96, ["#2A1E14", "#3A2A1C", "#4E3A2A"]);
      VOL.caja(c, pr, 26, -20, 0, 30, 24, 96, ["#2A1E14", "#3A2A1C", "#4E3A2A"]);
      for (let k = 0; k < 5; k++) {
        const u = -54 + k * 18;
        VOL.palo(c, pr, u, 0, 92, u, 0, 78, 1.5, "#C8B48C");
        VOL.piramide(c, pr, [[u - 4, -2], [u + 4, -2], [u + 4, 2], [u - 4, 2]], 76, u, 0, 50, k % 2 ? ["#7A5A2A", "#A8783A", "#C0904A"] : ["#6A4E2A", "#8A6A3A", "#A07E4A"]);
      }
      VOL.aguaUna(c, pr, -84, -30, 102, 44, 34, 92, T.vieja);
      if (nivel() !== "baja") {
        const p0 = pr(-20, 0, 104),
          s = pr.s;
        for (let k = 0; k < 3; k++) {
          const p = (t * 0.18 + k / 3) % 1;
          alfa(c, 0.18 * (1 - p), () => E(c, p0[0] + Math.sin(p * 4 + k) * 10 * s, p0[1] - p * 80 * s, (6 + p * 14) * s, (5 + p * 9) * s, "#A8A49C"));
        }
      }
    });
    S.poner(78, 0, () => {
      for (let f = 0; f < 4; f++)
        for (let k = 0; k < 5 - (f % 2); k++) VOL.rollo(c, VOL.sub(pr, 52 + k * 13 + (f % 2) * 6, 0, 0, Math.PI / 2), -12, 12, 0, f * 11 + 6, 6, T.madera, { n: 6, corte: C.maderaLuz });
    });
    S.poner(130, 0, () => {
      VOL.cono(c, pr, 130, 0, 16, 18, 0, 40, T.madera, { n: 10 });
      VOL.elipse(c, pr, 130, 0, 30, 18.5, 18.5, C.hierro);
      VOL.elipse(c, pr, 130, 0, 40.5, 17, 17, "#2A1E14");
      [-8, 0, 8].forEach((d, i) => {
        VOL.palo(c, pr, 130 + d, 0, 40, 130 + d * 1.6, 0, 120, 3, C.maderaSombra);
        VOL.piramide(c, pr, [[127 + d * 1.6, -2], [133 + d * 1.6, -2], [133 + d * 1.6, 2], [127 + d * 1.6, 2]], 120, 130 + d * 1.6, 0, 132 + i * 2, T.hierro);
      });
    });
    S.dibujar();
  }
  // la ropa tendida: dos postes, la soga y las prendas como telas de dos caras
  function tendederoV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      v = Math.sin(t * 1.4) * 2;
    VOL.cubo(c, pr, -58, 0, 5, 5, 90, T.oscura);
    VOL.cubo(c, pr, 58, 0, 5, 5, 90, T.oscura);
    VOL.palo(c, pr, -58, 0, 86, 58, 0, 86, 1.5, "#C8B48C");
    [[-44, 22, "#C8C0B0"], [-16, 18, "#7A3A2A"], [10, 26, "#3E4E66"], [36, 16, "#E6DCC8"]].forEach(([u, w, col]) =>
      VOL.plano(c, pr, u, u + w, 0, 50, 86, null, (cc, l, h) => P(cc, [0, -h, l, -h, l + v, 0, v, -4], col)),
    );
  }
  // la piedra violeta: facetada, con Hagalaz adelante y la luz de las ataduras
  function piedraVioletaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      late = 0.7 + Math.sin(t * 1.1) * 0.25;
    VOL.halo(c, pr, 0, 0, 70, 120, VIOLETA, late);
    VOL.sombra(c, pr, 10, 0, 40, 26);
    const base = [[-30, 10], [-34, -10], [-10, -22], [24, -16], [32, 6], [8, 20]],
      col = ["#9894AA", "#B8B4C8", "#D8D4E4"];
    VOL.prisma(c, pr, base, 0, 104, col, { sinTapa: true });
    VOL.piramide(c, pr, base, 104, -2, -4, 140, col);
    VOL.plano(c, pr, -24, 24, 18.5, 10, 70, null, (cc, l, h) => alfa(cc, 0.5 + late * 0.5, () => FUTHARK.dibujar(cc, "hagalaz", l / 2, -h / 2, 56, VIOLETA, 5)), () => {});
    if (o.vista) {
      const q = VOL.redonda(0, 0, 38, 20).map(([u, w]) => pr(u, w, 60 + u * 0.15));
      c.strokeStyle = VIOLETA;
      c.lineWidth = 2.5 * pr.s;
      c.beginPath();
      q.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
      c.closePath();
      c.stroke();
    }
  }

  const L2 = ASSETS.LISTA;
  Object.assign(L2, {
    palisada: { f: palisada, fv: palisadaV, vol: true, alto: 130, choque: null, grupo: "puesto" },
    portonPuesto: { f: portonPuesto, fv: portonPuestoV, vol: true, alto: 190, choque: null, grupo: "puesto", luz: true },
    mesaRutas: { f: mesaRutas, fv: mesaRutasV, vol: true, alto: 64, choque: { w: 116, h: 16 }, grupo: "puesto" },
    tableroTablillas: { f: tableroTablillas, fv: tableroTablillasV, vol: true, alto: 120, choque: null, grupo: "puesto" },
    tablonCaza: { f: tablonCaza, fv: tablonCazaV, vol: true, alto: 140, choque: { w: 100, h: 14 }, grupo: "puesto" },
    fogonOlla: { f: fogonOlla, fv: fogonOllaV, vol: true, alto: 80, choque: { r: 40 }, grupo: "puesto", luz: true },
    mostradorManta: { f: mostradorManta, fv: mostradorMantaV, vol: true, alto: 56, choque: { w: 110, h: 14 }, grupo: "puesto" },
    ahumadero: { f: ahumadero, fv: ahumaderoV, vol: true, alto: 150, choque: { w: 280, h: 30 }, grupo: "puesto" },
    tendedero: { f: tendedero, fv: tendederoV, vol: true, alto: 90, choque: null, grupo: "puesto" },
    perraGrima: { f: perraGrima, fv: ASSETS.ladoV(perraGrima), vol: true, alto: 60, choque: null, grupo: "puesto" },
    piedraVioleta: { f: piedraVioleta, fv: piedraVioletaV, vol: true, alto: 150, choque: { r: 30 }, grupo: "puesto", luz: true },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, { palisada: { ax: -80, bx: 80 }, perraGrima: { despierta: true }, tableroTablillas: { oscuras: 5 } });
})();
