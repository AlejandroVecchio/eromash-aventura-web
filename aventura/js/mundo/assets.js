// ---------- los objetos de Eldervald (módulo ASSETS) ----------
// Cada objeto es un asset con nombre propio, pensado para este bosque: «el carro volcado de la cuadrilla»,
// «el farol de la senda», «la piedra rúnica del Refugio». Nada de relleno genérico: si algo se repite (pinos,
// robles, helechos) es la misma especie de Eldervald con variaciones de tamaño y forma por semilla.
// Estilo de la arena (juego/js/mundo/mapas.js): caras planas, luz de arriba a la derecha (cara clara a la derecha,
// cara en sombra a la izquierda), sombra elíptica en el piso, sin contornos ni degradés.
// Cada asset: { alto, choque: { r } | { w, h } | null, dibujar(c, x, y, t, o) } con la base en (x, y).
// o = { s: escala, sem: semilla, ...estado propio }. ASSETS.catalogo() devuelve la lista para la página de revisión.
window.ASSETS = (function () {
  "use strict";
  const { P, E, R, L, alfa, poli, azar, sombra, halo, RUNICO, RUNICO_CLARO, VIOLETA, TAU } = DIB;

  // ---------- colores de Eldervald ----------
  const C = {
    humus: "#3B3222",
    humus2: "#463B28",
    musgo: "#3E4A2A",
    musgo2: "#4E5C32",
    musgoClaro: "#647A3C",
    pino: ["#1C2E22", "#253C2B", "#304D36"],
    pinoLuz: "#3C5E40",
    roble: ["#33421F", "#425427", "#536830"],
    robleLuz: "#667D38",
    tronco: "#4A3626",
    troncoSombra: "#30231A",
    corteza: "#5C4632",
    abedul: "#DDD6C6",
    abedulSombra: "#B4AA98",
    abedulMarca: "#2A2420",
    hojaAbedul: ["#6E7E34", "#84963F", "#9AAE4C"],
    roca: "#646A64",
    rocaSombra: "#4A504C",
    rocaLuz: "#7C827A",
    madera: "#7A5634",
    maderaSombra: "#553A22",
    maderaLuz: "#9A7448",
    maderaVieja: "#5E4A36",
    hierro: "#4A4448",
    hierroLuz: "#6E6A6E",
    pasto: "#56662C",
    pastoSombra: "#43501F",
    pizarra: "#3E4E66",
    pizarraSombra: "#2C384C",
    pizarraLuz: "#52647E",
    tela: "#8A3A2A",
    ambar: "#FFD98A",
    ambarFuerte: "#FF8D71",
    rojoEromash: "#9C2315",
    hueso: "#E8DCC4",
  };

  // ======================================================================
  //  NATURALEZA DE ELDERVALD
  // ======================================================================

  // El pino de Eldervald: alto, oscuro, con raíces que abrazan el piso y la copa en pisos facetados.
  // La cara derecha de cada piso es más clara. o.s escala, o.pisos 3–5, o.vaiven (viento).
  function pino(c, x, y, t, o) {
    const s = o.s || 1,
      pisos = o.pisos || 4,
      v = Math.sin(t * 0.9 + (o.sem || 0)) * 2 * s;
    sombra(c, x + 10 * s, y + 2 * s, 34 * s, 9 * s, 0.32);
    // raíces
    P(c, [x - 16 * s, y + 2 * s, x - 5 * s, y - 10 * s, x - 2 * s, y + 1 * s], C.troncoSombra);
    P(c, [x + 15 * s, y + 3 * s, x + 4 * s, y - 10 * s, x + 2 * s, y + 1 * s], C.tronco);
    // tronco
    P(c, [x - 6 * s, y, x - 4 * s, y - 40 * s, x + 4 * s, y - 40 * s, x + 6 * s, y], C.tronco);
    P(c, [x - 6 * s, y, x - 4 * s, y - 40 * s, x, y - 40 * s, x - 1 * s, y], C.troncoSombra);
    for (let k = 0; k < pisos; k++) {
      const w = (40 - k * (26 / pisos)) * s,
        base = y - (26 + k * (88 / pisos)) * s,
        alto = (48 - k * 4) * s,
        dx = v * (k + 1) * 0.35,
        top = base - alto;
      const col = C.pino[k % 3];
      // falda del piso, con dos dientes abajo
      P(
        c,
        [x + dx, top, x - w, base, x - w * 0.45, base - 5 * s, x, base + 3 * s, x + w * 0.45, base - 5 * s, x + w, base],
        col,
      );
      // cara de la luz (derecha)
      P(c, [x + dx, top, x + w * 0.45, base - 5 * s, x + w, base, x + w * 0.62, base - 9 * s], C.pinoLuz);
    }
  }

  // El roble retorcido: tronco torcido con una rama gruesa, copa en tres masas facetadas.
  function roble(c, x, y, t, o) {
    const s = o.s || 1,
      r = azar((o.sem || 1) * 977),
      v = Math.sin(t * 0.7 + (o.sem || 0)) * 1.5 * s,
      lado = r() < 0.5 ? -1 : 1;
    sombra(c, x + 14 * s, y + 3 * s, 52 * s, 13 * s, 0.32);
    // raíces anchas
    P(c, [x - 24 * s, y + 3 * s, x - 8 * s, y - 14 * s, x - 4 * s, y + 2 * s], C.troncoSombra);
    P(c, [x + 22 * s, y + 4 * s, x + 6 * s, y - 14 * s, x + 4 * s, y + 2 * s], C.tronco);
    // tronco torcido
    const cx = x + lado * 8 * s;
    P(c, [x - 10 * s, y, x - 8 * s, y - 34 * s, cx - 7 * s, y - 70 * s, cx + 7 * s, y - 72 * s, x + 9 * s, y - 34 * s, x + 10 * s, y], C.corteza);
    P(c, [x - 10 * s, y, x - 8 * s, y - 34 * s, cx - 7 * s, y - 70 * s, cx, y - 71 * s, x, y - 34 * s, x - 1 * s, y], C.tronco);
    // rama gruesa hacia un costado
    P(c, [cx, y - 58 * s, cx + lado * 34 * s, y - 84 * s, cx + lado * 38 * s, y - 78 * s, cx + lado * 4 * s, y - 50 * s], C.tronco);
    // copa: tres masas, la de atrás más oscura
    const masas = [
      [cx - 24 * s, y - 104 * s, 40 * s, 0],
      [cx + lado * 40 * s, y - 92 * s, 30 * s, 1],
      [cx + 10 * s, y - 120 * s, 44 * s, 2],
    ];
    masas.forEach(([mx, my, mr, k]) => {
      const pts = poli(mx + v, my, mr, mr * 0.78, 7, 0.3 + k, [1, 0.86, 1.04, 0.9, 1.02, 0.88, 0.96]);
      P(c, pts, C.roble[k]);
      // faceta de luz arriba a la derecha
      P(c, [mx + v, my - mr * 0.78, mx + mr * 0.9 + v, my - mr * 0.2, mx + mr * 0.3 + v, my], C.robleLuz);
      P(c, [mx - mr * 0.9 + v, my + mr * 0.1, mx - mr * 0.2 + v, my + mr * 0.7, mx - mr * 0.6 + v, my + mr * 0.55], C.roble[0]);
    });
  }

  // El abedul pálido: tronco blanco con marcas negras, copa chica amarillo verdosa. Crece en los bordes de los claros.
  function abedul(c, x, y, t, o) {
    const s = o.s || 1,
      v = Math.sin(t * 1.1 + (o.sem || 0)) * 2 * s;
    sombra(c, x + 8 * s, y + 2 * s, 24 * s, 7 * s, 0.3);
    P(c, [x - 4 * s, y, x - 3 * s, y - 92 * s, x + 3 * s, y - 92 * s, x + 4 * s, y], C.abedul);
    P(c, [x - 4 * s, y, x - 3 * s, y - 92 * s, x - 0.5 * s, y - 92 * s, x - 1 * s, y], C.abedulSombra);
    for (let k = 0; k < 5; k++) R(c, x - 3 * s, y - (14 + k * 16) * s, (k % 2 ? 4 : 6) * s, 2 * s, C.abedulMarca);
    [
      [-12, -96, 18],
      [10, -104, 16],
      [0, -118, 18],
    ].forEach(([dx, dy, r], k) => {
      const pts = poli(x + dx * s + v, y + dy * s, r * s, r * 0.8 * s, 6, k);
      P(c, pts, C.hojaAbedul[k]);
    });
    P(c, [x + v, y - 132 * s, x + 16 * s + v, y - 114 * s, x + 6 * s + v, y - 108 * s], C.hojaAbedul[2]);
  }

  // Los helechos del sotobosque: hojas en abanico, agrupados al pie de los troncos.
  function helechos(c, x, y, t, o) {
    const s = o.s || 1,
      v = Math.sin(t * 1.6 + (o.sem || 0)) * 1.5 * s;
    for (let k = -2; k <= 2; k++) {
      const a = -Math.PI / 2 + k * 0.42,
        l = (22 - Math.abs(k) * 3) * s,
        tx = x + Math.cos(a) * l + v,
        ty = y + Math.sin(a) * l * 0.8;
      P(c, [x - 2 * s, y, tx, ty, x + 2 * s, y], k < 0 ? C.musgo : k > 0 ? C.musgoClaro : C.musgo2);
    }
  }

  // Los hongos de rocío: sombreritos azul verdosos que brillan apenas sobre la madera húmeda (luz del bosque sano).
  function hongosRocio(c, x, y, t, o) {
    const s = o.s || 1,
      brillo = 0.55 + Math.sin(t * 1.4 + (o.sem || 0)) * 0.15;
    if (o.luz !== false) halo(c, x, y - 6 * s, 22 * s, "#7FD8C8", brillo);
    [
      [-7, 0, 5],
      [2, -2, 6],
      [9, 1, 4],
    ].forEach(([dx, dy, r]) => {
      R(c, x + (dx - 1) * s, y + (dy - r * 1.2) * s, 2 * s, r * 1.2 * s, "#C9D8CC");
      P(c, [x + (dx - r) * s, y + (dy - r * 1.1) * s, x + dx * s, y + (dy - r * 2) * s, x + (dx + r) * s, y + (dy - r * 1.1) * s], "#4FA89A");
      P(c, [x + dx * s, y + (dy - r * 2) * s, x + (dx + r) * s, y + (dy - r * 1.1) * s, x + (dx + r * 0.3) * s, y + (dy - r * 1.1) * s], "#8FE0D0");
    });
  }

  // La roca con musgo: piedra gris verdosa facetada con una manta de musgo arriba.
  function roca(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 6 * s, y + 2 * s, 34 * s, 9 * s, 0.34);
    P(c, [x - 30 * s, y, x - 22 * s, y - 22 * s, x - 2 * s, y - 32 * s, x + 22 * s, y - 24 * s, x + 30 * s, y], C.roca);
    P(c, [x - 2 * s, y - 32 * s, x + 22 * s, y - 24 * s, x + 30 * s, y, x + 6 * s, y], C.rocaLuz);
    P(c, [x - 30 * s, y, x - 22 * s, y - 22 * s, x - 12 * s, y - 8 * s, x - 14 * s, y], C.rocaSombra);
    P(c, [x - 22 * s, y - 22 * s, x - 2 * s, y - 32 * s, x + 16 * s, y - 26 * s, x + 4 * s, y - 20 * s, x - 14 * s, y - 16 * s], C.musgo2);
    P(c, [x - 2 * s, y - 32 * s, x + 16 * s, y - 26 * s, x + 6 * s, y - 24 * s], C.musgoClaro);
  }

  // El tronco caído: un pino viejo acostado, con el corte claro, musgo arriba y hongos de ámbar.
  function troncoCaido(c, x, y, t, o) {
    const s = o.s || 1,
      l = 70 * s;
    sombra(c, x + 6 * s, y + 3 * s, l * 0.9, 9 * s, 0.32);
    P(c, [x - l, y - 4 * s, x - l + 4 * s, y - 20 * s, x + l - 6 * s, y - 22 * s, x + l, y - 6 * s, x + l - 6 * s, y + 2 * s, x - l + 6 * s, y + 2 * s], C.tronco);
    P(c, [x - l, y - 4 * s, x - l + 6 * s, y + 2 * s, x + l - 6 * s, y + 2 * s, x + l, y - 6 * s, x + l - 6 * s, y - 6 * s, x - l + 4 * s, y - 6 * s], C.troncoSombra);
    P(c, [x - l + 6 * s, y - 20 * s, x + l - 10 * s, y - 22 * s, x + l * 0.4, y - 16 * s, x - l * 0.6, y - 15 * s], C.musgo2);
    // el corte
    E(c, x + l, y - 13 * s, 7 * s, 10 * s, C.maderaLuz);
    E(c, x + l, y - 13 * s, 4 * s, 6 * s, C.madera);
    // orejas de ámbar
    [[-l * 0.3, -10], [l * 0.1, -8]].forEach(([dx, dy]) => {
      P(c, [x + dx - 6 * s, y + dy * s, x + dx, y + (dy - 5) * s, x + dx + 6 * s, y + dy * s], "#D9A24A");
      P(c, [x + dx, y + (dy - 5) * s, x + dx + 6 * s, y + dy * s, x + dx + 2 * s, y + dy * s], C.ambar);
    });
  }

  // ======================================================================
  //  CAMINOS Y SEÑALES
  // ======================================================================

  // El farol de la senda: poste de madera con una caja de hierro y luz ámbar. Marca curvas y cruces de Eldervald.
  function farol(c, x, y, t, o) {
    const s = o.s || 1,
      fl = 0.8 + Math.sin(t * 7 + (o.sem || 0)) * 0.1;
    if (o.luz !== false) halo(c, x + 14 * s, y - 70 * s, 70 * s, C.ambar, fl);
    sombra(c, x + 4 * s, y + 1, 14 * s, 4 * s);
    P(c, [x - 3 * s, y, x - 2 * s, y - 86 * s, x + 2 * s, y - 86 * s, x + 3 * s, y], C.maderaSombra);
    R(c, x - 2 * s, y - 86 * s, 18 * s, 4 * s, C.maderaSombra);
    L(c, x + 14 * s, y - 82 * s, x + 14 * s, y - 76 * s, C.hierro, 1.5 * s);
    // caja del farol
    P(c, [x + 8 * s, y - 76 * s, x + 20 * s, y - 76 * s, x + 21 * s, y - 60 * s, x + 7 * s, y - 60 * s], C.hierro);
    alfa(c, fl, () => R(c, x + 10 * s, y - 73 * s, 8 * s, 11 * s, C.ambar));
    P(c, [x + 6 * s, y - 76 * s, x + 14 * s, y - 82 * s, x + 22 * s, y - 76 * s], C.hierroLuz);
  }

  // La piedra rúnica de la Linde: menhir tallado con la runa de la senda; su luz azul late cuando la red está viva.
  function piedraLinde(c, x, y, t, o) {
    const s = o.s || 1,
      viva = o.apagada ? 0.15 : 0.7 + Math.sin(t * 1.6 + (o.sem || 0)) * 0.25;
    if (o.luz !== false) halo(c, x, y - 34 * s, 54 * s, RUNICO, viva);
    sombra(c, x + 6 * s, y + 2, 20 * s, 6 * s);
    P(c, [x - 13 * s, y, x - 11 * s, y - 48 * s, x - 2 * s, y - 60 * s, x + 11 * s, y - 50 * s, x + 13 * s, y], "#4A4C54");
    P(c, [x - 2 * s, y - 60 * s, x + 11 * s, y - 50 * s, x + 13 * s, y, x + 1 * s, y], "#5C5E66");
    P(c, [x - 13 * s, y, x - 11 * s, y - 48 * s, x - 7 * s, y - 20 * s, x - 8 * s, y], "#383A42");
    alfa(c, 0.35 + viva * 0.65, () => {
      // Raidho, la runa del camino
      c.strokeStyle = viva > 0.3 ? RUNICO_CLARO : RUNICO;
      c.lineWidth = 3 * s;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(x - 3 * s, y - 14 * s);
      c.lineTo(x - 3 * s, y - 44 * s);
      c.lineTo(x + 5 * s, y - 37 * s);
      c.lineTo(x - 3 * s, y - 30 * s);
      c.lineTo(x + 5 * s, y - 16 * s);
      c.stroke();
    });
  }

  // ======================================================================
  //  EL PUESTO DE EYDIS (EL-01)
  // ======================================================================

  // La cabaña de la guardasendas: troncos, techo de pasto, una torreta de vigía al costado y su farol.
  function puestoEydis(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 16 * s, y + 6 * s, 150 * s, 26 * s, 0.34);
    // torreta de vigía (atrás a la derecha)
    const tx = x + 110 * s;
    R(c, tx - 26 * s, y - 150 * s, 6 * s, 150 * s, C.maderaSombra);
    R(c, tx + 20 * s, y - 150 * s, 6 * s, 150 * s, C.maderaSombra);
    L(c, tx - 23 * s, y - 10 * s, tx + 23 * s, y - 120 * s, C.maderaSombra, 4 * s);
    L(c, tx + 23 * s, y - 10 * s, tx - 23 * s, y - 120 * s, C.maderaSombra, 4 * s);
    R(c, tx - 34 * s, y - 158 * s, 68 * s, 12 * s, C.madera);
    for (let k = 0; k < 5; k++) R(c, tx - 32 * s + k * 15 * s, y - 180 * s, 4 * s, 22 * s, C.maderaSombra);
    P(c, [tx - 40 * s, y - 180 * s, tx, y - 214 * s, tx + 40 * s, y - 180 * s], C.pastoSombra);
    P(c, [tx, y - 214 * s, tx + 40 * s, y - 180 * s, tx + 6 * s, y - 180 * s], C.pasto);
    // cabaña: pared frontal de troncos
    const w = 92 * s,
      h = 64 * s;
    P(c, [x - w, y, x - w, y - h, x + w, y - h, x + w, y], C.madera);
    for (let k = 0; k < 6; k++) R(c, x - w, y - h + k * 11 * s, w * 2, 2 * s, C.maderaSombra);
    // extremos de los troncos
    for (let k = 0; k < 6; k++) {
      E(c, x - w, y - h + 5 * s + k * 11 * s, 5 * s, 5 * s, C.maderaLuz);
      E(c, x + w, y - h + 5 * s + k * 11 * s, 5 * s, 5 * s, C.maderaLuz);
    }
    // puerta y ventana
    P(c, [x - 16 * s, y, x - 16 * s, y - 44 * s, x + 16 * s, y - 44 * s, x + 16 * s, y], C.maderaSombra);
    R(c, x - 14 * s, y - 42 * s, 2 * s, 42 * s, C.troncoSombra);
    R(c, x + 40 * s, y - 46 * s, 24 * s, 18 * s, "#1A140E");
    alfa(c, 0.7, () => R(c, x + 42 * s, y - 44 * s, 20 * s, 14 * s, C.ambar));
    R(c, x + 51 * s, y - 46 * s, 2 * s, 18 * s, C.maderaSombra);
    // techo de pasto con caballete de troncos cruzados
    P(c, [x - w - 14 * s, y - h, x - w + 10 * s, y - h - 54 * s, x + w - 10 * s, y - h - 54 * s, x + w + 14 * s, y - h], C.pastoSombra);
    P(c, [x - w + 10 * s, y - h - 54 * s, x + w - 10 * s, y - h - 54 * s, x + w + 14 * s, y - h, x, y - h], C.pasto);
    for (let k = 0; k < 9; k++) P(c, [x - w - 10 * s + k * 22 * s, y - h, x - w + k * 22 * s, y - h + 8 * s, x - w + 8 * s + k * 22 * s, y - h], C.pastoSombra);
    L(c, x - w + 4 * s, y - h - 64 * s, x - w + 18 * s, y - h - 48 * s, C.maderaSombra, 4 * s);
    L(c, x + w - 4 * s, y - h - 64 * s, x + w - 18 * s, y - h - 48 * s, C.maderaSombra, 4 * s);
    // la marca de la guardasendas en el dintel: una punta de lanza
    P(c, [x, y - 54 * s, x - 5 * s, y - 46 * s, x, y - 48 * s, x + 5 * s, y - 46 * s], C.hueso);
  }

  // El tablero de rutas de Eydis: dos postes y tablillas con trazos de caminos, una atada con cuerda roja.
  function tableroRutas(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 4 * s, y + 2, 30 * s, 6 * s);
    R(c, x - 26 * s, y - 56 * s, 4 * s, 56 * s, C.maderaSombra);
    R(c, x + 22 * s, y - 56 * s, 4 * s, 56 * s, C.maderaSombra);
    R(c, x - 30 * s, y - 52 * s, 60 * s, 30 * s, C.maderaVieja);
    [
      [-26, -50, 16, 12],
      [-6, -48, 18, 10],
      [14, -50, 12, 14],
      [-20, -36, 22, 10],
      [6, -34, 18, 9],
    ].forEach(([dx, dy, w, h], k) => {
      R(c, x + dx * s, y + dy * s, w * s, h * s, k === 2 ? "#D8C8A4" : "#C8B48C");
      L(c, x + (dx + 2) * s, y + (dy + h / 2) * s, x + (dx + w - 3) * s, y + (dy + h / 2 - 2) * s, "#5E4A36", 1.2 * s);
    });
    L(c, x + 20 * s, y - 52 * s, x + 20 * s, y - 34 * s, C.rojoEromash, 2 * s);
  }

  // La empalizada del puesto: troncos con punta, uno más bajo cada tanto.
  function empalizada(c, x, y, t, o) {
    const s = o.s || 1,
      n = o.n || 8,
      r = azar((o.sem || 3) * 131);
    sombra(c, x + (n * 9 - 4) * s, y + 3 * s, n * 10 * s, 6 * s, 0.3);
    for (let k = 0; k < n; k++) {
      const px = x + k * 18 * s,
        h = (56 + r() * 12 - (k % 4 === 2 ? 10 : 0)) * s;
      P(c, [px - 8 * s, y, px - 8 * s, y - h, px, y - h - 12 * s, px + 8 * s, y - h, px + 8 * s, y], C.madera);
      P(c, [px, y - h - 12 * s, px + 8 * s, y - h, px + 8 * s, y, px + 2 * s, y], C.maderaLuz);
    }
    R(c, x - 8 * s, y - 30 * s, n * 18 * s, 4 * s, C.maderaSombra);
  }

  // ======================================================================
  //  LA SENDA DEL REFUGIO (EL-01, EL-02)
  // ======================================================================

  // El carro volcado de la cuadrilla: de costado, una rueda partida, tablones y herramientas desparramadas
  // y las marcas de arrastre hacia el Refugio.
  function carroVolcado(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 10 * s, y + 4 * s, 88 * s, 18 * s, 0.36);
    // marcas de arrastre en la tierra
    alfa(c, 0.5, () => {
      L(c, x + 60 * s, y + 10 * s, x + 150 * s, y - 26 * s, "#2A2218", 3 * s);
      L(c, x + 66 * s, y + 18 * s, x + 158 * s, y - 16 * s, "#2A2218", 3 * s);
    });
    // la caja del carro, de costado y de canto
    P(c, [x - 70 * s, y - 6 * s, x - 62 * s, y - 52 * s, x + 50 * s, y - 60 * s, x + 56 * s, y - 14 * s], C.madera);
    P(c, [x - 62 * s, y - 52 * s, x + 50 * s, y - 60 * s, x + 64 * s, y - 56 * s, x - 48 * s, y - 48 * s], C.maderaLuz);
    for (let k = 1; k < 4; k++) L(c, x - 66 * s + k * 2 * s, y - 6 * s - k * 12 * s, x + 54 * s, y - 14 * s - k * 12 * s, C.maderaSombra, 2 * s);
    // fondo del carro (el piso, que ahora mira hacia nosotros) con sus vigas
    P(c, [x - 70 * s, y - 6 * s, x + 56 * s, y - 14 * s, x + 58 * s, y - 4 * s, x - 66 * s, y + 4 * s], C.maderaSombra);
    // la lanza del carro, rota
    L(c, x + 56 * s, y - 10 * s, x + 96 * s, y + 6 * s, C.maderaSombra, 5 * s);
    // rueda entera arriba (gira apenas)
    const ra = t * 0.4;
    E(c, x - 34 * s, y - 64 * s, 22 * s, 22 * s, C.maderaSombra);
    E(c, x - 34 * s, y - 64 * s, 17 * s, 17 * s, C.madera);
    for (let k = 0; k < 6; k++) {
      const a = ra + (k * TAU) / 6;
      L(c, x - 34 * s, y - 64 * s, x - 34 * s + Math.cos(a) * 16 * s, y - 64 * s + Math.sin(a) * 16 * s, C.maderaSombra, 2.5 * s);
    }
    E(c, x - 34 * s, y - 64 * s, 4 * s, 4 * s, C.hierro);
    // rueda partida en el piso
    P(c, [x - 110 * s, y + 6 * s, x - 96 * s, y - 14 * s, x - 76 * s, y - 16 * s, x - 70 * s, y - 4 * s, x - 86 * s, y + 8 * s], C.madera);
    L(c, x - 92 * s, y - 2 * s, x - 78 * s, y - 10 * s, C.maderaSombra, 2 * s);
    // herramientas: martillo, sierra y tablones
    R(c, x + 24 * s, y + 8 * s, 30 * s, 4 * s, C.maderaLuz);
    R(c, x + 50 * s, y + 4 * s, 9 * s, 10 * s, C.hierro);
    P(c, [x - 30 * s, y + 14 * s, x + 4 * s, y + 10 * s, x + 6 * s, y + 16 * s, x - 28 * s, y + 20 * s], "#8A8E92");
    for (let k = 0; k < 6; k++) P(c, [x - 28 * s + k * 5 * s, y + 20 * s, x - 26 * s + k * 5 * s, y + 23 * s, x - 24 * s + k * 5 * s, y + 19 * s], "#8A8E92");
    R(c, x + 6 * s, y + 12 * s, 10 * s, 5 * s, C.maderaSombra);
    P(c, [x + 70 * s, y + 18 * s, x + 120 * s, y + 8 * s, x + 122 * s, y + 14 * s, x + 72 * s, y + 24 * s], C.maderaLuz);
    // un saco roto con clavos
    P(c, [x - 58 * s, y + 18 * s, x - 62 * s, y + 4 * s, x - 48 * s, y - 2 * s, x - 38 * s, y + 6 * s, x - 40 * s, y + 18 * s], "#A88E62");
    for (let k = 0; k < 4; k++) R(c, x - 36 * s + k * 5 * s, y + 18 * s + (k % 2) * 3 * s, 3 * s, 1.5 * s, C.hierroLuz);
  }

  // Los menhires del Refugio: piedras altas y gastadas que forman el círculo protector; cada una con una muesca.
  function menhirRefugio(c, x, y, t, o) {
    const s = o.s || 1,
      luz = o.luz || 0;
    if (luz > 0) halo(c, x, y - 30 * s, 40 * s, RUNICO, luz);
    sombra(c, x + 6 * s, y + 2, 18 * s, 5 * s);
    P(c, [x - 11 * s, y, x - 9 * s, y - 44 * s, x + 2 * s, y - 52 * s, x + 10 * s, y - 40 * s, x + 11 * s, y], "#585A5E");
    P(c, [x + 2 * s, y - 52 * s, x + 10 * s, y - 40 * s, x + 11 * s, y, x + 2 * s, y], "#6E7074");
    P(c, [x - 9 * s, y - 44 * s, x + 2 * s, y - 52 * s, x - 2 * s, y - 40 * s], C.musgo2);
    alfa(c, 0.4 + luz * 0.6, () => R(c, x - 1 * s, y - 32 * s, 3 * s, 12 * s, luz > 0.2 ? RUNICO : "#3A3C40"));
  }

  // La piedra rúnica del Refugio: base tallada en el centro del círculo. o.puesta: la piedra de arriba está en su lugar;
  // o.luz 0..1: cuánto sostiene el círculo.
  function runaRefugio(c, x, y, t, o) {
    const s = o.s || 1,
      luz = o.luz || 0;
    if (luz > 0) halo(c, x, y - 40 * s, 110 * s, RUNICO, luz * (0.85 + Math.sin(t * 2) * 0.15));
    sombra(c, x + 6 * s, y + 3, 32 * s, 9 * s);
    // la base: un bloque bajo y ancho
    P(c, [x - 28 * s, y, x - 26 * s, y - 20 * s, x + 26 * s, y - 22 * s, x + 28 * s, y], "#4E5056");
    P(c, [x - 26 * s, y - 20 * s, x + 26 * s, y - 22 * s, x + 20 * s, y - 28 * s, x - 20 * s, y - 26 * s], "#686A70");
    if (o.puesta) {
      // la piedra de arriba en su lugar, con la runa Algiz (protección)
      P(c, [x - 15 * s, y - 24 * s, x - 13 * s, y - 70 * s, x, y - 80 * s, x + 13 * s, y - 70 * s, x + 15 * s, y - 24 * s], "#56585E");
      P(c, [x, y - 80 * s, x + 13 * s, y - 70 * s, x + 15 * s, y - 24 * s, x + 2 * s, y - 24 * s], "#6A6C72");
      alfa(c, 0.3 + luz * 0.7, () => {
        c.strokeStyle = luz > 0.3 ? RUNICO_CLARO : "#3A3C40";
        c.lineWidth = 3 * s;
        c.lineCap = "round";
        c.beginPath();
        c.moveTo(x, y - 32 * s);
        c.lineTo(x, y - 66 * s);
        c.moveTo(x, y - 52 * s);
        c.lineTo(x - 8 * s, y - 64 * s);
        c.moveTo(x, y - 52 * s);
        c.lineTo(x + 8 * s, y - 64 * s);
        c.stroke();
      });
    } else {
      // el encastre vacío
      P(c, [x - 12 * s, y - 24 * s, x + 12 * s, y - 25 * s, x + 8 * s, y - 27 * s, x - 8 * s, y - 26 * s], "#2E3034");
    }
  }

  // La piedra caída: la parte de arriba de la runa, tirada en el pasto, con la runa apagada.
  function piedraCaida(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 4 * s, y + 3, 32 * s, 7 * s);
    P(c, [x - 34 * s, y, x - 26 * s, y - 14 * s, x + 26 * s, y - 18 * s, x + 34 * s, y - 4 * s, x + 26 * s, y + 4 * s], "#56585E");
    P(c, [x - 26 * s, y - 14 * s, x + 26 * s, y - 18 * s, x + 34 * s, y - 4 * s, x - 18 * s, y - 2 * s], "#6A6C72");
    L(c, x - 14 * s, y - 9 * s, x + 18 * s, y - 11 * s, "#3A3C40", 3 * s);
    L(c, x + 2 * s, y - 10 * s, x + 12 * s, y - 2 * s, "#3A3C40", 3 * s);
  }

  // El cobertizo del Refugio: techo de una sola agua sobre dos postes, mantas y la bolsa de herramientas de Orm.
  function cobertizoRefugio(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 10 * s, y + 4 * s, 76 * s, 14 * s, 0.32);
    R(c, x - 60 * s, y - 70 * s, 6 * s, 70 * s, C.maderaSombra);
    R(c, x + 54 * s, y - 50 * s, 6 * s, 50 * s, C.maderaSombra);
    // mantas en el piso
    P(c, [x - 50 * s, y - 4 * s, x - 10 * s, y - 10 * s, x - 4 * s, y + 4 * s, x - 46 * s, y + 8 * s], "#7A4A3A");
    P(c, [x + 4 * s, y - 8 * s, x + 44 * s, y - 12 * s, x + 48 * s, y + 2 * s, x + 6 * s, y + 6 * s], "#5A6A7A");
    // bolsa de herramientas
    P(c, [x + 20 * s, y - 10 * s, x + 24 * s, y - 28 * s, x + 40 * s, y - 28 * s, x + 44 * s, y - 10 * s], "#8A6A44");
    L(c, x + 30 * s, y - 28 * s, x + 26 * s, y - 40 * s, C.maderaSombra, 3 * s);
    // techo de tablas
    P(c, [x - 76 * s, y - 66 * s, x - 66 * s, y - 80 * s, x + 70 * s, y - 56 * s, x + 74 * s, y - 44 * s], C.maderaSombra);
    P(c, [x - 66 * s, y - 80 * s, x + 70 * s, y - 56 * s, x + 66 * s, y - 52 * s, x - 70 * s, y - 74 * s], C.madera);
    for (let k = 1; k < 7; k++) L(c, x - 66 * s + k * 20 * s, y - 80 * s + k * 3.5 * s, x - 72 * s + k * 20 * s, y - 68 * s + k * 3.5 * s, C.maderaSombra, 1.5 * s);
  }

  // ======================================================================
  //  EIKHOLT Y LA CASA DE LAS LINDES (EL-03)
  // ======================================================================

  // Casa de Eikholt: entramado de madera sobre zócalo de piedra y techo de pizarra azulada (como en el croquis).
  // o.v 0..2 cambia proporciones, la chimenea y el color de la puerta.
  function casaEikholt(c, x, y, t, o) {
    const s = o.s || 1,
      v = o.v || 0,
      w = (v === 1 ? 70 : 84) * s,
      h = (v === 2 ? 70 : 58) * s,
      techo = (v === 1 ? 70 : 58) * s;
    sombra(c, x + 16 * s, y + 6 * s, w * 1.6, 22 * s, 0.34);
    // zócalo de piedra
    P(c, [x - w, y, x - w, y - 14 * s, x + w, y - 14 * s, x + w, y], "#5A5650");
    for (let k = 0; k < 7; k++) R(c, x - w + k * (w / 3.5), y - 14 * s, 2 * s, 14 * s, "#46423C");
    // pared con entramado
    P(c, [x - w, y - 14 * s, x - w, y - h, x + w, y - h, x + w, y - 14 * s], "#D8C8A8");
    P(c, [x - w, y - 14 * s, x - w, y - h, x - w + 10 * s, y - h, x - w + 10 * s, y - 14 * s], "#B8A888");
    R(c, x - w, y - h, w * 2, 5 * s, C.maderaSombra);
    R(c, x - w, y - 18 * s, w * 2, 5 * s, C.maderaSombra);
    for (let k = 0; k <= 4; k++) R(c, x - w + k * (w / 2) - 2.5 * s, y - h, 5 * s, h - 14 * s, C.maderaSombra);
    L(c, x - w, y - h, x - w / 2, y - 18 * s, C.maderaSombra, 4 * s);
    L(c, x + w, y - h, x + w / 2, y - 18 * s, C.maderaSombra, 4 * s);
    // puerta y ventanas
    const pu = ["#5E3A22", "#3E4E66", "#7A2A1E"][v];
    P(c, [x - 13 * s, y - 14 * s, x - 13 * s, y - 50 * s, x, y - 56 * s, x + 13 * s, y - 50 * s, x + 13 * s, y - 14 * s], pu);
    R(c, x - w / 2 - 12 * s, y - h + 14 * s, 18 * s, 16 * s, "#1A140E");
    R(c, x + w / 2 - 6 * s, y - h + 14 * s, 18 * s, 16 * s, "#1A140E");
    alfa(c, 0.55, () => {
      R(c, x - w / 2 - 10 * s, y - h + 16 * s, 14 * s, 12 * s, C.ambar);
      R(c, x + w / 2 - 4 * s, y - h + 16 * s, 14 * s, 12 * s, C.ambar);
    });
    // techo, con hileras: o.techo 0 pizarra (la de siempre), 1 tablas, 2 tepe con pasto (las casas más viejas)
    const TECHOS = [[C.pizarraSombra, C.pizarra, C.pizarraLuz], [C.maderaSombra, C.maderaVieja, C.madera], ["#3A4424", C.musgo2, C.musgoClaro]];
    const [tS, tC, tL] = TECHOS[(o.techo || 0) % 3];
    P(c, [x - w - 14 * s, y - h + 2 * s, x - w * 0.7, y - h - techo, x + w * 0.7, y - h - techo, x + w + 14 * s, y - h + 2 * s], tS);
    P(c, [x - w * 0.7, y - h - techo, x + w * 0.7, y - h - techo, x + w + 14 * s, y - h + 2 * s, x - w * 0.2, y - h + 2 * s], tC);
    for (let k = 1; k < 5; k++) {
      const yy = y - h - techo + (k * techo) / 5,
        f = k / 5;
      L(c, x - w * 0.7 - f * (w * 0.3 + 14 * s), yy, x + w * 0.7 + f * (w * 0.3 + 14 * s), yy, tL, 1.5 * s);
    }
    // cabezas de dragón talladas en el caballete
    P(c, [x - w * 0.7, y - h - techo, x - w * 0.7 - 12 * s, y - h - techo - 12 * s, x - w * 0.7 - 4 * s, y - h - techo - 2 * s], C.maderaSombra);
    P(c, [x + w * 0.7, y - h - techo, x + w * 0.7 + 12 * s, y - h - techo - 12 * s, x + w * 0.7 + 4 * s, y - h - techo - 2 * s], C.maderaSombra);
    if (v !== 1) {
      // chimenea con humo
      R(c, x + w * 0.35, y - h - techo - 10 * s, 14 * s, 30 * s, "#5A5650");
      for (let k = 0; k < 4; k++) {
        const p = (t * 0.22 + k / 4 + (o.sem || 0) * 0.13) % 1;
        alfa(c, 0.25 * (1 - p), () => E(c, x + w * 0.35 + 7 * s + Math.sin(p * 5 + k) * 8 * s, y - h - techo - 16 * s - p * 90 * s, (5 + p * 14) * s, (4 + p * 10) * s, "#8A8E88"));
      }
    }
  }

  // La Casa de las Lindes: la de Svanhild. Más ancha, con una torre baja de registros y un estandarte con la runa Laguz.
  function casaLindes(c, x, y, t, o) {
    const s = o.s || 1;
    casaEikholt(c, x - 30 * s, y, t, { s: s * 1.1, v: 1, sem: 5 });
    // torre de registros
    const tx = x + 92 * s;
    sombra(c, tx + 10 * s, y + 4 * s, 40 * s, 10 * s, 0.3);
    P(c, [tx - 30 * s, y, tx - 30 * s, y - 120 * s, tx + 30 * s, y - 120 * s, tx + 30 * s, y], "#5A5650");
    P(c, [tx + 6 * s, y, tx + 6 * s, y - 120 * s, tx + 30 * s, y - 120 * s, tx + 30 * s, y], "#6E6A62");
    for (let k = 0; k < 8; k++) R(c, tx - 30 * s, y - k * 15 * s, 60 * s, 2 * s, "#46423C");
    R(c, tx - 10 * s, y - 92 * s, 14 * s, 20 * s, "#1A140E");
    alfa(c, 0.6, () => R(c, tx - 8 * s, y - 90 * s, 10 * s, 16 * s, C.ambar));
    P(c, [tx - 38 * s, y - 118 * s, tx, y - 168 * s, tx + 38 * s, y - 118 * s], C.pizarraSombra);
    P(c, [tx, y - 168 * s, tx + 38 * s, y - 118 * s, tx + 4 * s, y - 118 * s], C.pizarra);
    // estandarte de la casa: la runa Laguz en azul
    const bx = tx - 52 * s,
      by = y - 112 * s;
    R(c, bx - 2 * s, by - 6 * s, 3 * s, 70 * s, C.maderaSombra);
    const ond = Math.sin(t * 3) * 3 * s;
    P(c, [bx, by, bx + 24 * s, by + ond * 0.5, bx + 24 * s, by + 34 * s + ond, bx + 12 * s, by + 28 * s + ond, bx, by + 34 * s], "#3E4E66");
    L(c, bx + 9 * s, by + 8 * s, bx + 9 * s, by + 26 * s + ond * 0.5, RUNICO, 2.5 * s);
    L(c, bx + 9 * s, by + 8 * s, bx + 16 * s, by + 14 * s + ond * 0.3, RUNICO, 2.5 * s);
  }

  // La mesa de examen de Svanhild: tablón sobre caballetes, libros, una balanza, lentes y el fragmento (o.fragmento).
  function mesaSvanhild(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 6 * s, y + 3, 54 * s, 9 * s);
    L(c, x - 38 * s, y, x - 30 * s, y - 30 * s, C.maderaSombra, 4 * s);
    L(c, x - 22 * s, y, x - 30 * s, y - 30 * s, C.maderaSombra, 4 * s);
    L(c, x + 38 * s, y, x + 30 * s, y - 30 * s, C.maderaSombra, 4 * s);
    L(c, x + 22 * s, y, x + 30 * s, y - 30 * s, C.maderaSombra, 4 * s);
    P(c, [x - 50 * s, y - 30 * s, x - 44 * s, y - 40 * s, x + 50 * s, y - 40 * s, x + 50 * s, y - 30 * s], C.madera);
    R(c, x - 50 * s, y - 30 * s, 100 * s, 4 * s, C.maderaSombra);
    // libros apilados
    R(c, x - 42 * s, y - 50 * s, 22 * s, 6 * s, "#5E2A22");
    R(c, x - 40 * s, y - 56 * s, 20 * s, 6 * s, "#3E4E66");
    R(c, x - 41 * s, y - 61 * s, 18 * s, 5 * s, "#6B5A3A");
    // balanza
    L(c, x + 26 * s, y - 40 * s, x + 26 * s, y - 62 * s, C.hierro, 2 * s);
    L(c, x + 14 * s, y - 60 * s, x + 38 * s, y - 60 * s, C.hierro, 2 * s);
    E(c, x + 14 * s, y - 52 * s, 6 * s, 2 * s, "#B88A3A");
    E(c, x + 38 * s, y - 52 * s, 6 * s, 2 * s, "#B88A3A");
    // tintero y pluma
    R(c, x - 12 * s, y - 46 * s, 6 * s, 6 * s, "#1A1A22");
    L(c, x - 9 * s, y - 46 * s, x - 4 * s, y - 58 * s, C.hueso, 1.5 * s);
    if (o.fragmento) {
      // el fragmento de asta: hueso blanco con una atadura violeta
      P(c, [x - 2 * s, y - 42 * s, x + 6 * s, y - 50 * s, x + 16 * s, y - 48 * s, x + 8 * s, y - 41 * s], C.hueso);
      L(c, x + 4 * s, y - 49 * s, x + 9 * s, y - 42 * s, VIOLETA, 2 * s);
    }
  }

  // La losa del patio: una piedra plana grabada con un círculo de runas; o.luz cuando la Lente reveló la huella.
  function losaPatio(c, x, y, t, o) {
    const s = o.s || 1,
      luz = o.luz || 0;
    P(c, [x - 46 * s, y, x - 36 * s, y - 18 * s, x + 38 * s, y - 20 * s, x + 46 * s, y - 2 * s, x + 36 * s, y + 14 * s, x - 38 * s, y + 14 * s], "#6A6660");
    P(c, [x - 36 * s, y - 18 * s, x + 38 * s, y - 20 * s, x + 46 * s, y - 2 * s, x + 30 * s, y - 6 * s, x - 30 * s, y - 4 * s], "#7E7A72");
    c.strokeStyle = luz > 0 ? RUNICO : "#4A4640";
    c.lineWidth = 2 * s;
    c.beginPath();
    c.ellipse(x, y - 2 * s, 28 * s, 10 * s, 0, 0, TAU);
    c.stroke();
    for (let k = 0; k < 8; k++) {
      const a = (k * TAU) / 8;
      L(c, x + Math.cos(a) * 22 * s, y - 2 * s + Math.sin(a) * 7 * s, x + Math.cos(a) * 28 * s, y - 2 * s + Math.sin(a) * 10 * s, luz > 0 ? RUNICO : "#4A4640", 2 * s);
    }
    if (luz > 0) halo(c, x, y - 4 * s, 60 * s, RUNICO, luz);
  }

  // El gran roble de Eikholt: el que le da nombre al pueblo. Un roble enorme con un banco tallado a su alrededor.
  function robleEikholt(c, x, y, t, o) {
    const s = o.s || 1;
    roble(c, x, y, t, { s: s * 2.1, sem: 7 });
    // banco circular
    P(c, [x - 70 * s, y + 4 * s, x - 60 * s, y - 6 * s, x + 60 * s, y - 6 * s, x + 70 * s, y + 4 * s, x + 60 * s, y + 10 * s, x - 60 * s, y + 10 * s], C.madera);
    R(c, x - 62 * s, y + 8 * s, 124 * s, 3 * s, C.maderaSombra);
  }

  // El puesto de mercado de Eikholt: toldo rojo y blanco (los colores de Eromash en la arena), cajones con hongos dorados.
  function puestoMercado(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 8 * s, y + 3, 56 * s, 10 * s);
    R(c, x - 46 * s, y - 66 * s, 4 * s, 66 * s, C.maderaSombra);
    R(c, x + 42 * s, y - 66 * s, 4 * s, 66 * s, C.maderaSombra);
    P(c, [x - 48 * s, y - 24 * s, x + 48 * s, y - 24 * s, x + 48 * s, y, x - 48 * s, y], C.madera);
    R(c, x - 48 * s, y - 24 * s, 96 * s, 4 * s, C.maderaLuz);
    // hongos dorados en los cajones
    for (let k = 0; k < 6; k++) {
      const hx = x - 36 * s + k * 14 * s;
      P(c, [hx - 6 * s, y - 26 * s, hx, y - 34 * s, hx + 6 * s, y - 26 * s], k % 2 ? "#E8B04A" : C.ambar);
    }
    // toldo a rayas
    for (let k = 0; k < 6; k++) {
      const col = k % 2 ? "#F2ECEC" : C.rojoEromash;
      P(c, [x - 54 * s + k * 18 * s, y - 70 * s, x - 36 * s + k * 18 * s, y - 70 * s, x - 36 * s + k * 18 * s, y - 56 * s, x - 45 * s + k * 18 * s, y - 50 * s, x - 54 * s + k * 18 * s, y - 56 * s], col);
    }
  }

  // ======================================================================
  //  EL PASO DEL GUARDIÁN (EL-04, EL-06)
  // ======================================================================

  // El puente del Paso: o.roto (tablones caídos, cuerdas cortadas) o reparado (tablones nuevos, claros).
  // Se dibuja de punta a punta entre (x, y) y (o.x2, o.y2); va sobre la quebrada.
  function puentePaso(c, x, y, t, o) {
    const s = o.s || 1,
      x2 = o.x2,
      y2 = o.y2,
      dx = x2 - x,
      dy = y2 - y,
      l = Math.hypot(dx, dy),
      nx = -dy / l,
      ny = dx / l,
      ancho = 34 * s,
      n = Math.floor(l / (12 * s));
    for (let k = 0; k < n; k++) {
      const u = k / n,
        cx = x + dx * u,
        cy = y + dy * u;
      if (o.roto && u > 0.32 && u < 0.7) continue;
      const col = o.roto ? (k % 2 ? C.maderaVieja : "#4E3E2E") : k % 2 ? C.maderaLuz : "#B08A58";
      P(c, [cx + nx * ancho, cy + ny * ancho, cx - nx * ancho, cy - ny * ancho, cx - nx * ancho + dx / n, cy - ny * ancho + dy / n, cx + nx * ancho + dx / n, cy + ny * ancho + dy / n], col);
    }
    // postes y barandas de cuerda
    [1, -1].forEach((lado) => {
      const px = (u) => x + dx * u + nx * ancho * lado,
        py = (u) => y + dy * u + ny * ancho * lado;
      if (o.roto) {
        L(c, px(0), py(0) - 20 * s, px(0.3), py(0.3) - 6 * s, "#8A7A5A", 2 * s);
        L(c, px(1), py(1) - 20 * s, px(0.72), py(0.72) + 4 * s, "#8A7A5A", 2 * s);
      } else L(c, px(0), py(0) - 20 * s, px(1), py(1) - 20 * s, "#C8B48C", 2.5 * s);
      [0, 1].forEach((u) => {
        R(c, px(u) - 4 * s, py(u) - 26 * s, 8 * s, 30 * s, C.maderaSombra);
      });
    });
  }

  // La quebrada del norte: tajo en la roca con el arroyo al fondo. Se dibuja como franja entre dos bordes (ver ELDERVALD).

  // El pedestal del Paso: columna baja de piedra junto al puente con un encastre para el Núcleo de la Linde.
  function pedestalPaso(c, x, y, t, o) {
    const s = o.s || 1,
      luz = o.luz || 0;
    if (luz > 0) halo(c, x, y - 50 * s, 90 * s, RUNICO, luz * (0.85 + Math.sin(t * 2.2) * 0.15));
    sombra(c, x + 6 * s, y + 3, 26 * s, 7 * s);
    P(c, [x - 20 * s, y, x - 22 * s, y - 10 * s, x + 22 * s, y - 10 * s, x + 20 * s, y], "#4E5056");
    P(c, [x - 14 * s, y - 10 * s, x - 12 * s, y - 50 * s, x + 12 * s, y - 50 * s, x + 14 * s, y - 10 * s], "#5C5E64");
    P(c, [x + 2 * s, y - 10 * s, x + 2 * s, y - 50 * s, x + 12 * s, y - 50 * s, x + 14 * s, y - 10 * s], "#6E7076");
    P(c, [x - 18 * s, y - 50 * s, x - 14 * s, y - 58 * s, x + 14 * s, y - 58 * s, x + 18 * s, y - 50 * s], "#74767C");
    if (o.nucleo) nucleo(c, x, y - 58 * s, t, { s: s * 0.8, luz: Math.max(0.4, luz) });
    else E(c, x, y - 55 * s, 8 * s, 3 * s, "#2E3034");
    // runas del fuste
    alfa(c, 0.3 + luz * 0.7, () => {
      L(c, x - 4 * s, y - 20 * s, x - 4 * s, y - 42 * s, luz > 0.2 ? RUNICO : "#3A3C40", 2 * s);
      L(c, x - 4 * s, y - 34 * s, x + 4 * s, y - 40 * s, luz > 0.2 ? RUNICO : "#3A3C40", 2 * s);
    });
  }

  // El Núcleo de la Linde: un cristal rúnico de seis caras engarzado en madera del bosque.
  function nucleo(c, x, y, t, o) {
    const s = o.s || 1,
      luz = o.luz === undefined ? 0.8 : o.luz,
      fl = Math.sin(t * 3) * 2 * s;
    halo(c, x, y - 14 * s + fl, 36 * s, RUNICO, luz);
    P(c, [x - 12 * s, y, x - 8 * s, y - 6 * s, x + 8 * s, y - 6 * s, x + 12 * s, y], C.madera);
    P(c, [x, y - 30 * s + fl, x - 9 * s, y - 18 * s + fl, x - 6 * s, y - 6 * s, x + 6 * s, y - 6 * s, x + 9 * s, y - 18 * s + fl], "#4FA8B0");
    P(c, [x, y - 30 * s + fl, x + 9 * s, y - 18 * s + fl, x + 6 * s, y - 6 * s, x + 1 * s, y - 8 * s], RUNICO_CLARO);
  }

  // El tablón marcado (pista 1): un tablón del puente con la marca de la embestida, astillado.
  function tablonMarcado(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 3 * s, y + 2, 34 * s, 5 * s);
    P(c, [x - 36 * s, y + 2 * s, x - 32 * s, y - 8 * s, x + 34 * s, y - 12 * s, x + 38 * s, y - 2 * s], C.maderaVieja);
    P(c, [x - 32 * s, y - 8 * s, x + 34 * s, y - 12 * s, x + 30 * s, y - 8 * s, x - 30 * s, y - 4 * s], C.madera);
    // marca de las astas: tres tajos
    for (let k = 0; k < 3; k++) L(c, x - 8 * s + k * 7 * s, y - 10 * s, x - 2 * s + k * 7 * s, y + 0 * s, "#2A1E14", 2.5 * s);
    P(c, [x + 34 * s, y - 12 * s, x + 46 * s, y - 16 * s, x + 38 * s, y - 2 * s], C.maderaLuz);
  }

  // La raíz marcada (pista 2): raíz gruesa de un roble talado, con una atadura violeta incrustada.
  function raizMarcada(c, x, y, t, o) {
    const s = o.s || 1;
    // tocón de la antigua tala
    sombra(c, x + 6 * s, y + 3, 30 * s, 8 * s);
    P(c, [x - 22 * s, y, x - 18 * s, y - 24 * s, x + 18 * s, y - 26 * s, x + 22 * s, y], C.tronco);
    E(c, x, y - 25 * s, 18 * s, 6 * s, C.maderaLuz);
    E(c, x, y - 25 * s, 10 * s, 3 * s, C.madera);
    P(c, [x + 18 * s, y - 8 * s, x + 54 * s, y + 6 * s, x + 52 * s, y + 12 * s, x + 16 * s, y + 2 * s], C.tronco);
    P(c, [x - 18 * s, y - 6 * s, x - 48 * s, y + 10 * s, x - 44 * s, y + 14 * s, x - 14 * s, y + 2 * s], C.troncoSombra);
    // atadura: un nudo violeta que muerde la raíz
    L(c, x + 34 * s, y - 2 * s, x + 30 * s, y + 10 * s, VIOLETA, 3 * s);
    L(c, x + 40 * s, y + 0 * s, x + 36 * s, y + 12 * s, VIOLETA, 3 * s);
  }

  // El menhir del rastro (pista 3): una piedra rajada a la salida de la quebrada, con pelo de ciervo enganchado.
  function menhirRastro(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 6 * s, y + 2, 22 * s, 6 * s);
    P(c, [x - 14 * s, y, x - 12 * s, y - 60 * s, x - 2 * s, y - 72 * s, x + 12 * s, y - 60 * s, x + 14 * s, y], "#585A5E");
    P(c, [x - 2 * s, y - 72 * s, x + 12 * s, y - 60 * s, x + 14 * s, y, x + 2 * s, y], "#6C6E72");
    // la rajadura
    L(c, x - 2 * s, y - 70 * s, x + 2 * s, y - 40 * s, "#2E3034", 2.5 * s);
    L(c, x + 2 * s, y - 40 * s, x - 4 * s, y - 20 * s, "#2E3034", 2.5 * s);
    // pelo blanco del ciervo
    L(c, x + 12 * s, y - 34 * s, x + 20 * s, y - 30 * s, "#E8E4DC", 1.5 * s);
    L(c, x + 12 * s, y - 32 * s, x + 18 * s, y - 26 * s, "#E8E4DC", 1.5 * s);
  }

  // ======================================================================
  //  EL CLARO DEL CIERVO (EL-05)
  // ======================================================================

  // Los soportes de las ataduras: tres piedras talladas con cadenas violetas que bajan hacia el centro del claro.
  // o.roto: la piedra partida y la cadena suelta; o.visto: la Lente ya mostró el anclaje.
  function soporteAtadura(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 6 * s, y + 3, 30 * s, 8 * s);
    if (o.roto) {
      P(c, [x - 24 * s, y, x - 18 * s, y - 22 * s, x + 4 * s, y - 28 * s, x + 6 * s, y], "#56585E");
      P(c, [x + 8 * s, y, x + 10 * s, y - 18 * s, x + 26 * s, y - 14 * s, x + 24 * s, y], "#6A6C72");
      return;
    }
    P(c, [x - 20 * s, y, x - 18 * s, y - 62 * s, x, y - 74 * s, x + 18 * s, y - 62 * s, x + 20 * s, y], "#4E4A58");
    P(c, [x, y - 74 * s, x + 18 * s, y - 62 * s, x + 20 * s, y, x + 2 * s, y], "#605A6C");
    // la atadura: aro violeta y cadena
    const pulso = 0.6 + Math.sin(t * 3 + (o.sem || 0)) * 0.3;
    if (o.visto) halo(c, x, y - 40 * s, 50 * s, VIOLETA, pulso);
    c.strokeStyle = VIOLETA;
    c.lineWidth = 4 * s;
    c.beginPath();
    c.ellipse(x, y - 40 * s, 21 * s, 7 * s, 0, 0, TAU);
    c.stroke();
    if (o.hacia) {
      alfa(c, o.visto ? 0.9 : 0.4, () => {
        const [hx, hy] = o.hacia;
        for (let k = 0; k < 10; k++) {
          const u = k / 10,
            px = x + (hx - x) * u,
            py = y - 40 * s + (hy - (y - 40 * s)) * u + Math.sin(u * Math.PI) * 18 * s;
          E(c, px, py, 5 * s, 3 * s, k % 2 ? VIOLETA : "#6A4A98");
        }
      });
    }
  }

  // ======================================================================
  //  EL ESTE: ASERRADERO DE ORM Y SANTUARIO DE LAS RAÍCES (EL-07)
  // ======================================================================

  // El aserradero de Orm: galpón de troncos junto al río, con la rueda de agua que gira y pilas de tablones.
  function aserradero(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 20 * s, y + 6 * s, 170 * s, 26 * s, 0.34);
    // rueda de agua a la derecha
    const rx = x + 132 * s,
      ry = y - 40 * s,
      a0 = t * 0.6;
    E(c, rx, ry, 52 * s, 52 * s, C.maderaSombra);
    E(c, rx, ry, 44 * s, 44 * s, "#2E2418");
    for (let k = 0; k < 10; k++) {
      const a = a0 + (k * TAU) / 10;
      L(c, rx, ry, rx + Math.cos(a) * 46 * s, ry + Math.sin(a) * 46 * s, C.madera, 4 * s);
      P(c, [rx + Math.cos(a) * 40 * s, ry + Math.sin(a) * 40 * s, rx + Math.cos(a) * 54 * s, ry + Math.sin(a) * 54 * s, rx + Math.cos(a + 0.18) * 54 * s, ry + Math.sin(a + 0.18) * 54 * s], C.maderaLuz);
    }
    E(c, rx, ry, 8 * s, 8 * s, C.hierro);
    // galpón
    const w = 104 * s,
      h = 70 * s;
    P(c, [x - w, y, x - w, y - h, x + w, y - h, x + w, y], C.madera);
    for (let k = 0; k < 7; k++) R(c, x - w, y - h + k * 10 * s, w * 2, 2 * s, C.maderaSombra);
    P(c, [x - 30 * s, y, x - 30 * s, y - 50 * s, x + 30 * s, y - 50 * s, x + 30 * s, y], "#2A2016");
    // la sierra grande adentro
    E(c, x, y - 22 * s, 16 * s, 16 * s, "#8A8E92");
    E(c, x, y - 22 * s, 4 * s, 4 * s, C.hierro);
    P(c, [x - w - 16 * s, y - h, x - w + 6 * s, y - h - 56 * s, x + w - 6 * s, y - h - 56 * s, x + w + 16 * s, y - h], C.maderaSombra);
    P(c, [x - w + 6 * s, y - h - 56 * s, x + w - 6 * s, y - h - 56 * s, x + w + 16 * s, y - h, x, y - h], C.maderaVieja);
    for (let k = 1; k < 10; k++) L(c, x - w + k * 21 * s, y - h - 56 * s, x - w - 10 * s + k * 23 * s, y - h, C.maderaSombra, 1.5 * s);
    // pilas de tablones a la izquierda
    for (let k = 0; k < 4; k++) {
      P(c, [x - w - 90 * s, y - k * 8 * s, x - w - 20 * s, y - k * 8 * s, x - w - 16 * s, y - 6 * s - k * 8 * s, x - w - 86 * s, y - 6 * s - k * 8 * s], k % 2 ? C.maderaLuz : "#B08A58");
    }
    E(c, x - w - 20 * s, y - 14 * s, 4 * s, 14 * s, C.madera);
  }

  // El puente de tablas de los ríos del este: tablones sobre pilotes, con baranda de troncos. Va de (x,y) a (o.x2,o.y2).
  function puenteTablas(c, x, y, t, o) {
    puentePaso(c, x, y, t, Object.assign({}, o, { roto: false }));
  }

  // El Santuario de las Raíces: una puerta de piedra antigua tragada por raíces enormes, con el sello en el centro.
  // o.visto: la Lente reveló el sello (brilla azul); las zarzas cierran la entrada siempre.
  function santuario(c, x, y, t, o) {
    const s = o.s || 1,
      luz = o.visto ? 0.9 + Math.sin(t * 1.6) * 0.1 : 0.15;
    sombra(c, x + 10 * s, y + 6 * s, 150 * s, 24 * s, 0.38);
    // el montículo y las raíces
    P(c, [x - 160 * s, y, x - 120 * s, y - 120 * s, x - 40 * s, y - 170 * s, x + 50 * s, y - 172 * s, x + 130 * s, y - 120 * s, x + 160 * s, y], "#3A3022");
    P(c, [x + 50 * s, y - 172 * s, x + 130 * s, y - 120 * s, x + 160 * s, y, x + 60 * s, y], "#4A3E2C");
    P(c, [x - 120 * s, y - 120 * s, x - 40 * s, y - 170 * s, x + 50 * s, y - 172 * s, x + 20 * s, y - 150 * s, x - 70 * s, y - 130 * s], C.musgo);
    // arco de piedra
    P(c, [x - 64 * s, y, x - 62 * s, y - 100 * s, x - 34 * s, y - 128 * s, x + 34 * s, y - 128 * s, x + 62 * s, y - 100 * s, x + 64 * s, y], "#5C5A56");
    P(c, [x - 46 * s, y, x - 44 * s, y - 92 * s, x - 24 * s, y - 112 * s, x + 24 * s, y - 112 * s, x + 44 * s, y - 92 * s, x + 46 * s, y], "#1A1612");
    // el sello: un círculo con la runa Othala
    halo(c, x, y - 64 * s, 80 * s, RUNICO, luz);
    c.strokeStyle = o.visto ? RUNICO_CLARO : "#4A4640";
    c.lineWidth = 3 * s;
    c.beginPath();
    c.arc(x, y - 64 * s, 26 * s, 0, TAU);
    c.stroke();
    c.beginPath();
    c.moveTo(x - 14 * s, y - 44 * s);
    c.lineTo(x + 8 * s, y - 66 * s);
    c.lineTo(x, y - 82 * s);
    c.lineTo(x - 8 * s, y - 66 * s);
    c.lineTo(x + 14 * s, y - 44 * s);
    c.stroke();
    // raíces que abrazan el arco
    [
      [-150, -10, -60, -150, -40],
      [150, -14, 60, -148, 36],
      [-100, 0, -50, -60, -30],
      [110, 0, 54, -70, 28],
    ].forEach(([ax, ay, bx, by, cx]) => {
      c.strokeStyle = C.tronco;
      c.lineWidth = 14 * s;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(x + ax * s, y + ay * s);
      c.quadraticCurveTo(x + bx * s, y + by * s, x + cx * s, y - 128 * s);
      c.stroke();
      c.strokeStyle = C.corteza;
      c.lineWidth = 5 * s;
      c.stroke();
    });
    zarzas(c, x, y + 2 * s, t, { s, ancho: 50 });
  }

  // Las zarzas espectrales: espinas negras que crecen sobre lo que quedó de los muertos; ondulan con un brillo violeta.
  function zarzas(c, x, y, t, o) {
    const s = o.s || 1,
      w = (o.ancho || 40) * s,
      r = azar(77);
    for (let k = 0; k < 14; k++) {
      const bx = x - w + r() * w * 2,
        h = (30 + r() * 50) * s,
        ond = Math.sin(t * 2 + k) * 4 * s;
      c.strokeStyle = k % 3 ? "#1E1A22" : "#2E2638";
      c.lineWidth = 3 * s;
      c.beginPath();
      c.moveTo(bx, y);
      c.quadraticCurveTo(bx + ond * 2, y - h * 0.6, bx + ond + (r() - 0.5) * 20 * s, y - h);
      c.stroke();
      for (let e = 0; e < 3; e++) {
        const ey = y - h * (0.3 + e * 0.22),
          ex = bx + ond * (0.4 + e * 0.3);
        P(c, [ex, ey, ex + 6 * s, ey - 3 * s, ex + 1 * s, ey + 2 * s], "#1E1A22");
      }
    }
    alfa(c, 0.15 + Math.sin(t * 2.4) * 0.08, () => E(c, x, y - 30 * s, w, 30 * s, VIOLETA));
  }

  // ======================================================================
  //  CATÁLOGO
  // ======================================================================
  // El pozo de Eikholt: brocal de piedra redondo, techito a dos aguas de tablas y el balde colgando de la soga.
  // Es donde la aldea se junta: siempre hay un charco al pie.
  function pozoEikholt(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 6 * s, y + 3 * s, 40 * s, 10 * s, 0.34);
    E(c, x - 26 * s, y + 6 * s, 14 * s, 4 * s, "#2A4C56");
    // brocal
    P(c, [x - 30 * s, y, x - 30 * s, y - 26 * s, x + 30 * s, y - 26 * s, x + 30 * s, y], C.roca);
    P(c, [x + 4 * s, y, x + 4 * s, y - 26 * s, x + 30 * s, y - 26 * s, x + 30 * s, y], C.rocaLuz);
    for (let k = 0; k < 3; k++) R(c, x - 30 * s, y - 8 * s - k * 8 * s, 60 * s, 1.5 * s, C.rocaSombra);
    E(c, x, y - 26 * s, 30 * s, 9 * s, C.rocaSombra);
    E(c, x, y - 26 * s, 24 * s, 6 * s, "#121414");
    // postes y techito
    R(c, x - 28 * s, y - 78 * s, 6 * s, 54 * s, C.maderaSombra);
    R(c, x + 22 * s, y - 78 * s, 6 * s, 54 * s, C.madera);
    P(c, [x - 40 * s, y - 72 * s, x, y - 100 * s, x, y - 90 * s, x - 34 * s, y - 66 * s], C.maderaSombra);
    P(c, [x + 40 * s, y - 72 * s, x, y - 100 * s, x, y - 90 * s, x + 34 * s, y - 66 * s], C.maderaLuz);
    // eje, soga y balde
    R(c, x - 24 * s, y - 64 * s, 48 * s, 4 * s, C.maderaVieja);
    L(c, x + 4 * s, y - 62 * s, x + 4 * s, y - 40 * s, "#C8B48C", 1.5 * s);
    P(c, [x - 3 * s, y - 40 * s, x + 11 * s, y - 40 * s, x + 9 * s, y - 28 * s, x - 1 * s, y - 28 * s], C.madera);
    R(c, x - 3 * s, y - 36 * s, 14 * s, 2 * s, C.hierro);
    // la manivela con el rojo de Eromash en el mango
    L(c, x + 24 * s, y - 62 * s, x + 32 * s, y - 54 * s, C.hierroLuz, 2.5 * s);
    R(c, x + 30 * s, y - 56 * s, 4 * s, 8 * s, C.rojoEromash);
  }

  // El tocón de la tala: corte limpio y claro con los anillos, la marca del hacha de la cuadrilla al costado.
  function tocon(c, x, y, t, o) {
    const s = o.s || 1,
      r = azar((o.sem || 1) * 53),
      w = (16 + r() * 6) * s,
      h = (12 + r() * 8) * s;
    sombra(c, x + 4 * s, y + 2 * s, w + 6 * s, 6 * s, 0.32);
    P(c, [x - w - 6 * s, y + 1 * s, x - w, y - 4 * s, x - w + 4 * s, y + 1 * s], C.troncoSombra);
    P(c, [x + w + 6 * s, y + 1 * s, x + w, y - 4 * s, x + w - 4 * s, y + 1 * s], C.tronco);
    P(c, [x - w, y, x - w, y - h, x + w, y - h, x + w, y], C.tronco);
    P(c, [x - w, y, x - w, y - h, x - w * 0.3, y - h, x - w * 0.4, y], C.troncoSombra);
    E(c, x, y - h, w, w * 0.4, C.maderaLuz);
    E(c, x, y - h, w * 0.66, w * 0.26, "#B08A58");
    E(c, x, y - h, w * 0.3, w * 0.12, C.maderaLuz);
    P(c, [x + w * 0.4, y - h * 0.6, x + w, y - h * 0.8, x + w, y - h * 0.4], "#2A2016");
  }

  const LISTA = {
    pino: { f: pino, alto: 150, choque: { r: 14 }, grupo: "naturaleza" },
    roble: { f: roble, alto: 170, choque: { r: 18 }, grupo: "naturaleza" },
    abedul: { f: abedul, alto: 140, choque: { r: 8 }, grupo: "naturaleza" },
    helechos: { f: helechos, alto: 26, choque: null, grupo: "naturaleza" },
    hongosRocio: { f: hongosRocio, alto: 20, choque: null, grupo: "naturaleza", luz: true },
    roca: { f: roca, alto: 34, choque: { r: 26 }, grupo: "naturaleza" },
    troncoCaido: { f: troncoCaido, alto: 30, choque: { w: 130, h: 20 }, grupo: "naturaleza" },
    farol: { f: farol, alto: 90, choque: { r: 6 }, grupo: "caminos", luz: true },
    piedraLinde: { f: piedraLinde, alto: 62, choque: { r: 12 }, grupo: "caminos", luz: true },
    puestoEydis: { f: puestoEydis, alto: 220, choque: { w: 210, h: 40 }, grupo: "puesto" },
    tableroRutas: { f: tableroRutas, alto: 60, choque: { w: 60, h: 10 }, grupo: "puesto" },
    empalizada: { f: empalizada, alto: 70, choque: null, grupo: "puesto" },
    carroVolcado: { f: carroVolcado, alto: 90, choque: { w: 140, h: 28 }, grupo: "refugio" },
    menhirRefugio: { f: menhirRefugio, alto: 54, choque: { r: 11 }, grupo: "refugio" },
    runaRefugio: { f: runaRefugio, alto: 80, choque: { r: 24 }, grupo: "refugio", luz: true },
    piedraCaida: { f: piedraCaida, alto: 20, choque: null, grupo: "refugio" },
    cobertizoRefugio: { f: cobertizoRefugio, alto: 82, choque: { w: 130, h: 16 }, grupo: "refugio" },
    casaEikholt: { f: casaEikholt, alto: 150, choque: { w: 180, h: 40 }, grupo: "eikholt" },
    casaLindes: { f: casaLindes, alto: 170, choque: { w: 270, h: 40 }, grupo: "eikholt" },
    mesaSvanhild: { f: mesaSvanhild, alto: 62, choque: { w: 100, h: 12 }, grupo: "eikholt" },
    losaPatio: { f: losaPatio, alto: 20, choque: null, grupo: "eikholt", luz: true },
    robleEikholt: { f: robleEikholt, alto: 320, choque: { r: 34 }, grupo: "eikholt" },
    pozoEikholt: { f: pozoEikholt, alto: 100, choque: { r: 30 }, grupo: "eikholt" },
    puestoMercado: { f: puestoMercado, alto: 72, choque: { w: 96, h: 12 }, grupo: "eikholt" },
    puentePaso: { f: puentePaso, alto: 30, choque: null, grupo: "paso" },
    pedestalPaso: { f: pedestalPaso, alto: 90, choque: { r: 18 }, grupo: "paso", luz: true },
    nucleo: { f: nucleo, alto: 34, choque: null, grupo: "paso", luz: true },
    tablonMarcado: { f: tablonMarcado, alto: 16, choque: null, grupo: "paso" },
    tocon: { f: tocon, alto: 20, choque: { r: 16 }, grupo: "paso" },
    raizMarcada: { f: raizMarcada, alto: 28, choque: { r: 20 }, grupo: "paso" },
    menhirRastro: { f: menhirRastro, alto: 74, choque: { r: 13 }, grupo: "paso" },
    soporteAtadura: { f: soporteAtadura, alto: 76, choque: { r: 18 }, grupo: "claro", luz: true },
    aserradero: { f: aserradero, alto: 190, choque: { w: 230, h: 40 }, grupo: "este" },
    puenteTablas: { f: puenteTablas, alto: 30, choque: null, grupo: "este" },
    santuario: { f: santuario, alto: 180, choque: { w: 300, h: 40 }, grupo: "este", luz: true },
    zarzas: { f: zarzas, alto: 80, choque: null, grupo: "este" },
  };
  function dibujar(c, id, x, y, t, o = {}) {
    const a = LISTA[id];
    if (a) a.f(c, x, y, t, o);
  }
  // para la página de revisión: cada asset con su nombre traducido y un ejemplo de opciones para mostrarlo
  const EJEMPLO = {
    puentePaso: { x2: 0, y2: -160, roto: true },
    puenteTablas: { x2: 160, y2: -20 },
    runaRefugio: { puesta: true, luz: 1 },
    pedestalPaso: { nucleo: true, luz: 1 },
    mesaSvanhild: { fragmento: true },
    losaPatio: { luz: 1 },
    soporteAtadura: { visto: true, hacia: [-90, -10] },
    santuario: { visto: true },
    menhirRefugio: { luz: 0.6 },
  };
  function catalogo() {
    return Object.keys(LISTA).map((id) => ({ id, grupo: LISTA[id].grupo, alto: LISTA[id].alto, ejemplo: EJEMPLO[id] || {} }));
  }
  return { LISTA, C, dibujar, catalogo, EJEMPLO };
})();
