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
      // el estandarte verde con las astas
      const v = Math.sin(t * 1.5) * 3 * s;
      P(c, [x - 30 * s, y - 152 * s, x + 10 * s, y - 152 * s, x + 10 * s + v, y - 90 * s, x - 10 * s + v, y - 100 * s, x - 30 * s + v, y - 90 * s], "#2C4226");
      [-1, 1].forEach((l) => L(c, x - 10 * s + v * 0.5, y - 116 * s, x - 10 * s + l * 12 * s + v * 0.5, y - 136 * s, C.hueso, 2.5 * s));
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

  const L2 = ASSETS.LISTA;
  Object.assign(L2, {
    palisada: { f: palisada, alto: 130, choque: null, grupo: "puesto" },
    portonPuesto: { f: portonPuesto, alto: 190, choque: null, grupo: "puesto", luz: true },
    mesaRutas: { f: mesaRutas, alto: 64, choque: { w: 116, h: 16 }, grupo: "puesto" },
    tableroTablillas: { f: tableroTablillas, alto: 120, choque: null, grupo: "puesto" },
    tablonCaza: { f: tablonCaza, alto: 140, choque: { w: 100, h: 14 }, grupo: "puesto" },
    fogonOlla: { f: fogonOlla, alto: 80, choque: { r: 40 }, grupo: "puesto", luz: true },
    mostradorManta: { f: mostradorManta, alto: 56, choque: { w: 110, h: 14 }, grupo: "puesto" },
    ahumadero: { f: ahumadero, alto: 150, choque: { w: 280, h: 30 }, grupo: "puesto" },
    tendedero: { f: tendedero, alto: 90, choque: null, grupo: "puesto" },
    perraGrima: { f: perraGrima, alto: 60, choque: null, grupo: "puesto" },
    piedraVioleta: { f: piedraVioleta, alto: 150, choque: { r: 30 }, grupo: "puesto", luz: true },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, { palisada: { ax: -80, bx: 80 }, perraGrima: { despierta: true }, tableroTablillas: { oscuras: 5 } });
})();
