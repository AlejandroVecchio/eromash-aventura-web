// ---------- El carro volcado y el Refugio de las Lindes, versión de Alejandro (22/10/2026; se suma a ASSETS) ----------
// El carro de la cuadrilla de costado con el eje trabado contra una raíz enorme, los tajos con forma de cornamenta
// (un azul muy tenue y apenas una hebra violeta), el trozo de asta clavado, los sacos abiertos, los rastros (la camilla,
// el buey y el Ciervo) y el poste de senda con el farol del carrero. En el Refugio: los siete mojones con su runa,
// el poste de tablillas, la camilla de varas, la cuña que cedió y el fogón apagado. Mismas reglas que assets.js.
(function () {
  "use strict";
  const { P, E, R, L, alfa, azar, sombra, halo, RUNICO, RUNICO_CLARO, VIOLETA, TAU } = DIB;
  const C = ASSETS.C;

  // El carro de la cuadrilla, volcado de costado contra una raíz. o.cepillo, o.talla, o.jornal: si siguen ahí.
  function carroCuadrilla(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 10 * s, y + 6 * s, 150 * s, 24 * s, 0.36);
    // la raíz enorme, atrás
    P(c, [x - 170 * s, y - 6 * s, x - 120 * s, y - 44 * s, x - 40 * s, y - 60 * s, x + 40 * s, y - 52 * s, x + 30 * s, y - 36 * s, x - 50 * s, y - 34 * s, x - 130 * s, y - 4 * s], C.troncoSombra);
    P(c, [x - 120 * s, y - 44 * s, x - 40 * s, y - 60 * s, x + 40 * s, y - 52 * s, x - 40 * s, y - 50 * s], C.tronco);
    P(c, [x - 110 * s, y - 36 * s, x - 70 * s, y - 48 * s, x - 60 * s, y - 40 * s], C.musgo2);
    // el fondo del carro (de costado: se ve la base de tablas)
    P(c, [x - 100 * s, y, x - 96 * s, y - 70 * s, x + 96 * s, y - 84 * s, x + 104 * s, y - 10 * s], C.madera);
    for (let k = 1; k < 5; k++) L(c, x - 100 * s + k * 40 * s, y - 2 * s - k * 2.5 * s, x - 96 * s + k * 38 * s, y - 72 * s - k * 2.5 * s, C.maderaSombra, 3 * s);
    // el costado golpeado mira al camino: tablas hundidas
    P(c, [x - 100 * s, y, x + 104 * s, y - 10 * s, x + 110 * s, y + 14 * s, x - 94 * s, y + 24 * s], C.maderaLuz);
    P(c, [x - 20 * s, y + 4 * s, x + 30 * s, y + 1 * s, x + 26 * s, y + 18 * s, x - 14 * s, y + 20 * s], C.maderaSombra);
    // la marca de Orm grabada en el costado: un hacha cruzada con una runa Othala
    FUTHARK.dibujar(c, "othala", x + 70 * s, y + 18 * s, 16 * s, C.maderaSombra, 2 * s);
    // tres tajos con forma de cornamenta (ramificados, no zarpazos), con un residuo azul tenue
    [[-60, -40], [-30, -46], [6, -52]].forEach(([dx, dy], i) => {
      const bx = x + dx * s,
        by = y + dy * s;
      L(c, bx, by + 30 * s, bx + 14 * s, by - 6 * s, "#2A1E14", 4 * s);
      L(c, bx + 7 * s, by + 12 * s, bx + 20 * s, by + 6 * s, "#2A1E14", 3 * s);
      L(c, bx + 11 * s, by + 2 * s, bx + 6 * s, by - 10 * s, "#2A1E14", 3 * s);
      alfa(c, 0.22 + Math.sin(t * 1.5 + i) * 0.06, () => L(c, bx, by + 30 * s, bx + 14 * s, by - 6 * s, RUNICO, 2 * s));
      if (i === 1) alfa(c, 0.14, () => L(c, bx + 7 * s, by + 12 * s, bx + 20 * s, by + 6 * s, VIOLETA, 1.2 * s));
    });
    // el trozo de asta incrustado, con la fractura reciente
    P(c, [x + 40 * s, y - 60 * s, x + 46 * s, y - 64 * s, x + 74 * s, y - 104 * s, x + 66 * s, y - 106 * s], C.hueso);
    L(c, x + 66 * s, y - 92 * s, x + 80 * s, y - 92 * s, C.hueso, 4 * s);
    P(c, [x + 66 * s, y - 106 * s, x + 74 * s, y - 104 * s, x + 72 * s, y - 110 * s], "#F8F0E0");
    // el eje partido trabado contra la raíz y las ruedas
    L(c, x - 80 * s, y - 34 * s, x - 130 * s, y - 20 * s, C.maderaSombra, 7 * s);
    E(c, x - 70 * s, y - 92 * s, 34 * s, 10 * s, C.maderaSombra);
    E(c, x - 70 * s, y - 92 * s, 26 * s, 6 * s, C.madera);
    E(c, x + 74 * s, y - 104 * s, 30 * s, 9 * s, C.maderaSombra, 0.1);
    // la otra rueda partida en el piso
    P(c, [x + 120 * s, y + 20 * s, x + 150 * s, y + 6 * s, x + 170 * s, y + 18 * s, x + 150 * s, y + 30 * s], C.maderaSombra);
    // el yugo roto
    L(c, x + 100 * s, y - 12 * s, x + 160 * s, y - 30 * s, C.madera, 5 * s);
    L(c, x + 170 * s, y - 22 * s, x + 200 * s, y - 10 * s, C.madera, 5 * s);
    // lo que quedó entre los restos: el cepillo de Orm, la talla para Sigrun, el jornal atrapado debajo
    if (o.cepillo) {
      P(c, [x + 130 * s, y + 46 * s, x + 168 * s, y + 42 * s, x + 168 * s, y + 52 * s, x + 130 * s, y + 56 * s], C.maderaLuz);
      R(c, x + 138 * s, y + 38 * s, 22 * s, 6 * s, C.hierro);
      halo(c, x + 150 * s, y + 46 * s, 24 * s, C.ambar, 0.5);
    }
    if (o.talla) {
      // un ciervito de abedul
      E(c, x - 40 * s, y + 52 * s, 8 * s, 5 * s, C.abedul);
      L(c, x - 34 * s, y + 48 * s, x - 30 * s, y + 40 * s, C.abedul, 2 * s);
      L(c, x - 30 * s, y + 40 * s, x - 26 * s, y + 36 * s, C.abedulSombra, 1.5 * s);
      halo(c, x - 38 * s, y + 48 * s, 22 * s, C.ambar, 0.5);
    }
    if (o.jornal) {
      P(c, [x + 10 * s, y + 18 * s, x + 40 * s, y + 16 * s, x + 40 * s, y + 30 * s, x + 10 * s, y + 32 * s], C.maderaSombra);
      R(c, x + 10 * s, y + 22 * s, 30 * s, 3 * s, C.hierroLuz);
      E(c, x + 25 * s, y + 25 * s, 2.5 * s, 2.5 * s, C.ambar);
    }
  }

  // Los sacos de víveres abiertos (donde comen los lobos que bajaron del norte).
  function sacosAbiertos(c, x, y, t, o) {
    const s = o.s || 1;
    [[-30, 0, "#A8946C"], [20, 6, "#8A7A5A"], [-4, 16, "#B8A47C"]].forEach(([dx, dy, col]) => {
      E(c, x + dx * s, y + dy * s, 24 * s, 14 * s, col);
      E(c, x + dx * s + 10 * s, y + dy * s - 6 * s, 8 * s, 4 * s, "#3A2A1C");
    });
    for (let k = 0; k < 8; k++) E(c, x - 50 * s + k * 13 * s, y + 26 * s + (k % 3) * 4 * s, 3 * s, 2 * s, "#E8DCC4");
  }

  // Rastros en el barro (se pintan en el piso): o.tipo "camilla" (dos surcos con pisadas al costado), "buey"
  // (pezuñas partidas que se separan), "ciervo" (pezuñas grandes que van al sur y después giran al norte).
  function rastro(c, x, y, t, o) {
    const x2 = o.x2,
      y2 = o.y2,
      dx = x2 - x,
      dy = y2 - y,
      l = Math.hypot(dx, dy),
      nx = -dy / l,
      ny = dx / l,
      col = "rgba(30,22,14,0.55)";
    if (o.tipo === "camilla") {
      [-1, 1].forEach((k) => L(c, x + nx * 14 * k, y + ny * 14 * k, x2 + nx * 14 * k, y2 + ny * 14 * k, col, 4));
      const n = Math.floor(l / 40);
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n,
          lado = i % 2 ? 1 : -1,
          px = x + dx * u + nx * 46 * lado,
          py = y + dy * u + ny * 46 * lado;
        E(c, px, py, 6, 4, col);
        E(c, px + nx * 70 * -lado, py + ny * 70 * -lado, 6, 4, col);
      }
      return;
    }
    const n = Math.floor(l / (o.tipo === "ciervo" ? 70 : 46));
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n,
        lado = i % 2 ? 1 : -1,
        px = x + dx * u + nx * 10 * lado,
        py = y + dy * u + ny * 10 * lado,
        r = o.tipo === "ciervo" ? 9 : 5;
      E(c, px - 3, py, r * 0.5, r * 0.7, col);
      E(c, px + 3, py, r * 0.5, r * 0.7, col);
      if (o.tipo === "ciervo") alfa(c, 0.15, () => E(c, px, py, r * 1.3, r, RUNICO));
    }
  }

  // El poste de senda con el farol del carrero: apagado al llegar; o.encendido.
  function posteFarol(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 6 * s, y + 2 * s, 16 * s, 5 * s);
    R(c, x - 5 * s, y - 130 * s, 10 * s, 130 * s, C.maderaSombra);
    R(c, x - 5 * s, y - 130 * s, 4 * s, 130 * s, C.madera);
    L(c, x, y - 120 * s, x + 26 * s, y - 120 * s, C.hierro, 3 * s);
    const fx = x + 26 * s;
    P(c, [fx - 10 * s, y - 104 * s, fx, y - 114 * s, fx + 10 * s, y - 104 * s], C.pizarraSombra);
    R(c, fx - 7 * s, y - 104 * s, 14 * s, 20 * s, "#1A140E");
    if (o.encendido) {
      alfa(c, 0.95, () => R(c, fx - 5 * s, y - 102 * s, 10 * s, 16 * s, C.ambar));
      halo(c, fx, y - 94 * s, 70 * s, C.ambar, 0.8);
    } else R(c, fx - 5 * s, y - 102 * s, 10 * s, 16 * s, "#3A3430");
    FUTHARK.dibujar(c, "raidho", x, y - 30 * s, 22 * s, "#2A1E14", 2.5 * s);
  }

  // Un mojón del Refugio: piedra alta con una runa del futhark. o.luz 0..1; o.nicho: el nicho de ofrendas
  // del más antiguo (o.ofrenda: qué hay adentro).
  function mojon(c, x, y, t, o) {
    const s = o.s || 1,
      luz = o.luz || 0;
    if (luz > 0) halo(c, x, y - 50 * s, 60 * s, RUNICO, luz);
    sombra(c, x + 8 * s, y + 3 * s, 24 * s, 6 * s);
    P(c, [x - 16 * s, y, x - 18 * s, y - 70 * s, x - 6 * s, y - 92 * s, x + 10 * s, y - 90 * s, x + 18 * s, y - 64 * s, x + 16 * s, y], "#585A5E");
    P(c, [x + 10 * s, y - 90 * s, x + 18 * s, y - 64 * s, x + 16 * s, y, x + 4 * s, y], "#6E7074");
    P(c, [x - 18 * s, y - 70 * s, x - 6 * s, y - 92 * s, x - 4 * s, y - 74 * s], C.musgo2);
    const nom = o.runa || "algiz";
    FUTHARK.dibujar(c, nom, x, y - 26 * s, 34 * s, "#2E3034", 4 * s);
    if (luz > 0) {
      alfa(c, 0.2 + luz * 0.8, () => FUTHARK.dibujar(c, nom, x, y - 26 * s, 34 * s, RUNICO, 3 * s));
      if (luz > 0.6) alfa(c, luz * 0.6, () => FUTHARK.dibujar(c, nom, x, y - 26 * s, 34 * s, RUNICO_CLARO, 1.2 * s));
    }
    if (o.nicho) {
      R(c, x - 8 * s, y - 16 * s, 16 * s, 12 * s, "#1E1C1A");
      if (o.ofrenda === "venda") E(c, x, y - 9 * s, 6 * s, 3 * s, "#E6DCC8");
      else if (o.ofrenda === "hierbas") {
        L(c, x - 4 * s, y - 6 * s, x - 2 * s, y - 14 * s, "#7BC86C", 2 * s);
        L(c, x + 2 * s, y - 6 * s, x + 4 * s, y - 13 * s, "#5E9A4E", 2 * s);
      } else E(c, x - 3 * s, y - 8 * s, 3 * s, 2 * s, "#8A7A5A");
    }
  }

  // El poste de tablillas del Refugio: cientos, algunas comidas por el musgo; o.nuevas cuántas están del lado oscuro.
  function posteTablillas(c, x, y, t, o) {
    const s = o.s || 1,
      r = azar(911);
    sombra(c, x + 6 * s, y + 3 * s, 30 * s, 7 * s);
    R(c, x - 9 * s, y - 170 * s, 18 * s, 170 * s, C.maderaVieja);
    R(c, x + 2 * s, y - 170 * s, 7 * s, 170 * s, C.madera);
    for (let k = 0; k < 46; k++) {
      const tx = x - 24 * s + (k % 6) * 8 * s + r() * 3 * s,
        ty = y - 160 * s + Math.floor(k / 6) * 15 * s,
        musgo = r() < 0.35;
      R(c, tx, ty, 7 * s, 11 * s, musgo ? C.musgo2 : r() < 0.5 ? "#A8946C" : "#C8B48C");
    }
    const nuevas = o.nuevas != null ? o.nuevas : 5;
    for (let k = 0; k < 5; k++) R(c, x - 22 * s + k * 9 * s, y - 40 * s, 8 * s, 12 * s, k < nuevas ? "#2A2420" : "#E6DCC8");
  }

  // La camilla de varas: dos varas largas, travesaños y una manta.
  function camilla(c, x, y, t, o) {
    const s = o.s || 1;
    L(c, x - 90 * s, y - 6 * s, x + 90 * s, y - 14 * s, C.madera, 5 * s);
    L(c, x - 90 * s, y + 14 * s, x + 90 * s, y + 6 * s, C.maderaSombra, 5 * s);
    for (let k = -2; k <= 2; k++) L(c, x + k * 30 * s, y - 10 * s, x + k * 30 * s, y + 10 * s, C.maderaSombra, 3 * s);
    P(c, [x - 60 * s, y - 8 * s, x + 50 * s, y - 12 * s, x + 50 * s, y + 8 * s, x - 60 * s, y + 12 * s], "#7A3A2A");
    P(c, [x - 60 * s, y - 8 * s, x + 50 * s, y - 12 * s, x + 44 * s, y - 4 * s, x - 56 * s, y], "#9A4A36");
  }

  // La cuña de piedra que cedió en la base del pedestal; o.reparada: la reparación nueva de Orm y Eskil.
  function cunaPiedra(c, x, y, t, o) {
    const s = o.s || 1;
    if (o.reparada) {
      P(c, [x - 16 * s, y, x - 14 * s, y - 12 * s, x + 16 * s, y - 14 * s, x + 18 * s, y], "#8A8C90");
      R(c, x - 18 * s, y - 4 * s, 36 * s, 4 * s, "#B08A58");
      return;
    }
    P(c, [x - 14 * s, y, x - 4 * s, y - 14 * s, x + 14 * s, y - 6 * s, x + 10 * s, y + 2 * s], "#5A5C60");
    P(c, [x - 4 * s, y - 14 * s, x + 14 * s, y - 6 * s, x + 4 * s, y - 4 * s], "#6E7074");
    for (let k = 0; k < 4; k++) E(c, x + 18 * s + k * 6 * s, y + (k % 2) * 3 * s, 2 * s, 1.5 * s, "#6E7074");
  }

  const L2 = ASSETS.LISTA;
  Object.assign(L2, {
    carroCuadrilla: { f: carroCuadrilla, alto: 120, choque: { w: 230, h: 30 }, grupo: "refugio" },
    sacosAbiertos: { f: sacosAbiertos, alto: 24, choque: null, grupo: "refugio" },
    rastro: { f: rastro, alto: 4, choque: null, grupo: "refugio" },
    posteFarol: { f: posteFarol, alto: 140, choque: { r: 10 }, grupo: "refugio", luz: true },
    mojon: { f: mojon, alto: 96, choque: { r: 18 }, grupo: "refugio", luz: true },
    posteTablillas: { f: posteTablillas, alto: 175, choque: { r: 12 }, grupo: "refugio" },
    camilla: { f: camilla, alto: 20, choque: null, grupo: "refugio" },
    cunaPiedra: { f: cunaPiedra, alto: 16, choque: null, grupo: "refugio" },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, {
    carroCuadrilla: { cepillo: true, talla: true, jornal: true },
    rastro: { x2: 200, y2: -40, tipo: "camilla" },
    posteFarol: { encendido: true },
    mojon: { luz: 1, runa: "othala", nicho: true },
  });
  void TAU;
})();
