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

  // ======================================================================
  //  ARMADOS CON CARAS (todo girable, comun/volumen.js)
  // ======================================================================
  const T = C.T,
    PIEDRA_R = ["#46484C", "#585A5E", "#6E7074"],
    menhir = (...a) => ASSETS.KIT.menhirV(...a);
  // el carro de la cuadrilla volcado: la raíz enorme atrás, el fondo de tablas parado con los tajos de cornamenta y
  // la marca de Orm, el costado golpeado en el piso, las ruedas de arriba, el asta clavada, el eje trabado, la rueda
  // partida, el yugo roto y lo que quedó entre los restos
  function carroCuadrillaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 10, -10, 160, 50);
    const S = VOL.escena(pr);
    S.poner(-60, -60, () => {
      VOL.rollo(c, pr, -170, 40, -58, 22, 24, T.tronco, { n: 8, corte: C.corteza });
      VOL.elipse(c, pr, -90, -58, 45, 22, 10, C.musgo2);
    });
    S.poner(0, -20, () => {
      VOL.caja(c, pr, -100, -50, 76, 100, -20, 84, T.madera);
      VOL.caja(c, pr, -100, -24, 0, 100, -16, 84, T.madera, {
        frente: (cc, l, h) => {
          R(cc, 0, -h, l, h, C.madera);
          for (let k = 1; k < 5; k++) L(cc, k * 40, 0, k * 40, -h, C.maderaSombra, 3);
          [[40, 0], [70, 0], [106, 0]].forEach(([bx], i) => {
            const by = -14;
            L(cc, bx, by, bx + 14, by - 36, "#2A1E14", 4);
            L(cc, bx + 7, by - 18, bx + 20, by - 24, "#2A1E14", 3);
            L(cc, bx + 11, by - 28, bx + 6, by - 40, "#2A1E14", 3);
            alfa(cc, 0.22 + Math.sin(t * 1.5 + i) * 0.06, () => L(cc, bx, by, bx + 14, by - 36, RUNICO, 2));
            if (i === 1) alfa(cc, 0.14, () => L(cc, bx + 7, by - 18, bx + 20, by - 24, VIOLETA, 1.2));
          });
          FUTHARK.dibujar(cc, "othala", 170, -50, 16, C.maderaSombra, 2);
        },
        atras: (cc, l, h) => {
          for (let k = 1; k < 5; k++) L(cc, k * 40, 0, k * 40, -h, C.maderaSombra, 3);
        },
      });
      [-70, 74].forEach((u, i) => {
        VOL.cilindro(c, pr, u, -40, 32, 84, 90, T.oscura, { n: 12, tapa: i ? C.maderaSombra : C.madera });
        VOL.elipse(c, pr, u, -40, 90.5, 8, 8, C.hierro);
      });
      VOL.palo(c, pr, 40, -20, 60, 74, -20, 104, 6, C.hueso);
      VOL.palo(c, pr, 64, -20, 90, 80, -20, 92, 4, C.hueso);
    });
    S.poner(0, 0, () => {
      VOL.caja(c, pr, -100, -16, 0, 104, 22, 8, T.madera, {
        tapa: C.maderaLuz,
        sinTapa: false,
      });
      VOL.enPiso(c, pr, (cc) => P(cc, [-20, 4, 30, 1, 26, 16, -14, 18], C.maderaSombra), 8.5);
      VOL.palo(c, pr, -80, -20, 30, -130, -36, 20, 7, C.maderaSombra);
    });
    S.poner(150, 20, () => {
      VOL.prisma(c, pr, [[120, 18], [150, 6], [170, 16], [150, 30]], 0, 6, T.oscura);
      VOL.palo(c, pr, 100, 0, 8, 160, -16, 4, 5, C.madera);
      VOL.palo(c, pr, 170, -12, 4, 200, 0, 4, 5, C.madera);
    });
    if (o.cepillo)
      S.poner(150, 46, () => {
        VOL.caja(c, pr, 130, 42, 0, 168, 52, 6, T.madera, { tapa: C.maderaLuz });
        VOL.caja(c, pr, 138, 44, 6, 160, 50, 10, T.hierro);
        VOL.halo(c, pr, 150, 46, 6, 24, C.ambar, 0.5);
      });
    if (o.talla)
      S.poner(-40, 52, () => {
        VOL.cilindro(c, pr, -40, 52, 6, 0, 8, ["#B8B0A0", C.abedul, C.abedul], { n: 6, rw: 4 });
        VOL.palo(c, pr, -36, 52, 8, -34, 52, 16, 2, C.abedul);
        VOL.palo(c, pr, -34, 52, 16, -30, 52, 20, 1.5, C.abedulSombra);
        VOL.halo(c, pr, -38, 52, 8, 22, C.ambar, 0.5);
      });
    if (o.jornal)
      S.poner(25, 26, () => {
        VOL.caja(c, pr, 10, 20, 0, 40, 32, 10, T.oscura, { tapa: C.maderaSombra });
        VOL.caja(c, pr, 10, 25, 10, 40, 27, 11, T.hierro);
        VOL.elipse(c, pr, 25, 26, 11, 2.5, 2.5, C.ambar);
      });
    S.dibujar();
  }
  // los sacos abiertos: tres sacos bajos con la boca abierta y el grano desparramado
  function sacosAbiertosV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.enPiso(c, pr, (cc) => {
      for (let k = 0; k < 8; k++) E(cc, -50 + k * 13, 26 + (k % 3) * 4, 3, 2, "#E8DCC4");
    });
    const S = VOL.escena(pr);
    [[-30, 0, "#A8946C"], [20, 6, "#8A7A5A"], [-4, 16, "#B8A47C"]].forEach(([u, w, col]) =>
      S.poner(u, w, () => {
        VOL.cono(c, pr, u, w, 24, 18, 0, 14, [VOL.mezcla(col, "#000000", 0.3), col, VOL.mezcla(col, "#FFFFFF", 0.15)], { n: 9 });
        VOL.elipse(c, pr, u + 8, w - 2, 14.5, 8, 6, "#3A2A1C");
      }),
    );
    S.dibujar();
  }
  // los rastros: el mismo dibujo en el piso con la otra punta llevada a la vista
  function rastroV(c, x, y, t, o) {
    const b = VOL.rel(x, y, o.x2 - x, o.y2 - y);
    rastro(c, x, y, t, Object.assign({}, o, { x2: b[0], y2: b[1] }));
  }
  // el poste de senda: el palo con Raidho, el brazo y el farol (apagado o encendido)
  function posteFarolV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      raidho = (cc, l) => FUTHARK.dibujar(cc, "raidho", l / 2, -30, 22, "#2A1E14", 2.5);
    VOL.sombra(c, pr, 6, 0, 18, 12);
    VOL.cubo(c, pr, 0, 0, 10, 10, 130, T.oscura, { frente: raidho, atras: raidho });
    VOL.palo(c, pr, 0, 0, 120, 26, 0, 120, 3, C.hierro);
    const luz = (cc, l, h) => (o.encendido ? alfa(cc, 0.95, () => R(cc, 2, -h + 2, l - 4, h - 4, C.ambar)) : R(cc, 2, -h + 2, l - 4, h - 4, "#3A3430"));
    VOL.cubo(c, pr, 26, 0, 14, 14, 20, ["#1A140E", "#1A140E", "#2A2018"], { frente: luz, atras: luz, izq: luz, der: luz }, 84);
    VOL.piramide(c, pr, [[16, -10], [36, -10], [36, 10], [16, 10]], 104, 26, 0, 114, T.pizarra);
    if (o.encendido) VOL.halo(c, pr, 26, 0, 94, 70, C.ambar, 0.8);
  }
  // un mojón del Refugio: la piedra alta con su runa (encendida según o.luz) y el nicho de ofrendas
  function mojonV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      luz = o.luz || 0,
      nom = o.runa || "algiz";
    if (luz > 0) VOL.halo(c, pr, 0, 0, 50, 60, RUNICO, luz);
    VOL.sombra(c, pr, 8, 0, 24, 16);
    menhir(c, pr, 17, 12, 94, PIEDRA_R, (cc, l, h) => {
      FUTHARK.dibujar(cc, nom, l / 2, -26, 30, "#2E3034", 4);
      if (luz > 0) {
        alfa(cc, 0.2 + luz * 0.8, () => FUTHARK.dibujar(cc, nom, l / 2, -26, 30, RUNICO, 3));
        if (luz > 0.6) alfa(cc, luz * 0.6, () => FUTHARK.dibujar(cc, nom, l / 2, -26, 30, RUNICO_CLARO, 1.2));
      }
      if (o.nicho) {
        R(cc, l / 2 - 8, -16 + 4, 16, 12, "#1E1C1A");
        if (o.ofrenda === "venda") E(cc, l / 2, -3, 6, 3, "#E6DCC8");
        else if (o.ofrenda === "hierbas") {
          L(cc, l / 2 - 4, 0, l / 2 - 2, -8, "#7BC86C", 2);
          L(cc, l / 2 + 2, 0, l / 2 + 4, -7, "#5E9A4E", 2);
        } else E(cc, l / 2 - 3, -2, 3, 2, "#8A7A5A");
      }
    });
  }
  // el poste de tablillas: cientos, de los cuatro lados, algunas comidas por el musgo; adelante las cinco nuevas
  function posteTablillasV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      nuevas = o.nuevas != null ? o.nuevas : 5,
      lado = (sem, frente) => (cc, l, h) => {
        const r = azar(911 + sem);
        for (let k = 0; k < 40; k++) {
          const tx = -12 + (k % 4) * 9 + r() * 3,
            ty = -h + 10 + Math.floor(k / 4) * 13;
          R(cc, tx, ty, 7, 11, r() < 0.35 ? C.musgo2 : r() < 0.5 ? "#A8946C" : "#C8B48C");
        }
        if (frente) for (let k = 0; k < 5; k++) R(cc, -14 + k * 9, -40, 8, 12, k < nuevas ? "#2A2420" : "#E6DCC8");
      };
    VOL.sombra(c, pr, 6, 0, 30, 20);
    VOL.cubo(c, pr, 0, 0, 18, 18, 170, T.vieja, { frente: lado(0, true), atras: lado(1), izq: lado(2), der: lado(3) });
  }
  // la camilla de varas: las dos varas, los travesaños y la manta encima
  function camillaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 0, 0, 90, 22, 0.25);
    [-12, 12].forEach((w) => VOL.rollo(c, pr, -90, 90, w, 3, 3, T.madera, { n: 5 }));
    for (let k = -2; k <= 2; k++) VOL.palo(c, pr, k * 30, -12, 5, k * 30, 12, 5, 3, C.maderaSombra);
    VOL.caja(c, pr, -60, -12, 5, 50, 12, 9, ["#5E2A1E", "#7A3A2A", "#9A4A36"]);
  }
  // la cuña de piedra que cedió (o la reparación nueva, con la tabla clara)
  function cunaPiedraV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    if (o.reparada) {
      VOL.caja(c, pr, -16, -8, 0, 16, 8, 12, ["#6E7074", "#8A8C90", "#A0A2A6"]);
      VOL.caja(c, pr, -18, 8, 0, 18, 10, 4, T.madera);
      return;
    }
    VOL.piramide(c, pr, [[-14, -6], [12, -8], [10, 6], [-12, 6]], 0, 4, -2, 14, PIEDRA_R);
    for (let k = 0; k < 4; k++) VOL.prisma(c, pr, VOL.redonda(18 + k * 6, (k % 2) * 3, 2, 5, k), 0, 2, PIEDRA_R);
  }

  const L2 = ASSETS.LISTA;
  Object.assign(L2, {
    carroCuadrilla: { f: carroCuadrilla, fv: carroCuadrillaV, vol: true, alto: 120, choque: { w: 230, h: 30 }, grupo: "refugio" },
    sacosAbiertos: { f: sacosAbiertos, fv: sacosAbiertosV, vol: true, alto: 24, choque: null, grupo: "refugio" },
    rastro: { f: rastro, fv: rastroV, vol: true, alto: 4, choque: null, grupo: "refugio" },
    posteFarol: { f: posteFarol, fv: posteFarolV, vol: true, alto: 140, choque: { r: 10 }, grupo: "refugio", luz: true },
    mojon: { f: mojon, fv: mojonV, vol: true, alto: 96, choque: { r: 18 }, grupo: "refugio", luz: true },
    posteTablillas: { f: posteTablillas, fv: posteTablillasV, vol: true, alto: 175, choque: { r: 12 }, grupo: "refugio" },
    camilla: { f: camilla, fv: camillaV, vol: true, alto: 20, choque: null, grupo: "refugio" },
    cunaPiedra: { f: cunaPiedra, fv: cunaPiedraV, vol: true, alto: 16, choque: null, grupo: "refugio" },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, {
    carroCuadrilla: { cepillo: true, talla: true, jornal: true },
    rastro: { x2: 200, y2: -40, tipo: "camilla" },
    posteFarol: { encendido: true },
    mojon: { luz: 1, runa: "othala", nicho: true },
  });
  void TAU;
})();
