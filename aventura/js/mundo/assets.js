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
  // los tres tonos de cada material para lo armado con caras (VOL): [sombra, frente, al sol]
  C.T = {
    madera: [C.maderaSombra, C.madera, C.maderaLuz],
    vieja: ["#3E3022", C.maderaVieja, "#76604A"],
    oscura: ["#3A2614", C.maderaSombra, C.madera],
    piedra: ["#46423C", "#5A5650", "#6E6A62"],
    roca: [C.rocaSombra, C.roca, C.rocaLuz],
    pizarra: [C.pizarraSombra, C.pizarra, C.pizarraLuz],
    hierro: ["#343034", C.hierro, C.hierroLuz],
    tronco: [C.troncoSombra, C.tronco, C.corteza],
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
    P(c, [x - 9 * s, y, x - 6 * s, y - 40 * s, x + 6 * s, y - 40 * s, x + 9 * s, y], C.tronco);
    P(c, [x - 9 * s, y, x - 6 * s, y - 40 * s, x, y - 40 * s, x - 1 * s, y], C.troncoSombra);
    // musgo del lado de la sombra, trepando desde las raíces
    P(c, [x - 16 * s, y + 2 * s, x - 9 * s, y - 4 * s, x - 7 * s, y - 22 * s, x - 3 * s, y - 14 * s, x - 2 * s, y + 1 * s], C.musgo2);
    P(c, [x - 8 * s, y - 6 * s, x - 7 * s, y - 20 * s, x - 5 * s, y - 12 * s], C.musgoClaro);
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
    P(c, [x - 24 * s, y + 3 * s, x - 10 * s, y - 6 * s, x - 9 * s, y - 28 * s, x - 3 * s, y - 16 * s, x - 2 * s, y + 2 * s], C.musgo2);
    P(c, [cx + lado * 4 * s, y - 52 * s, cx + lado * 22 * s, y - 70 * s, cx + lado * 10 * s, y - 64 * s], C.musgoClaro);
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


  // El abeto anciano: los gigantes del bosque viejo. Tronco ancho de corteza en placas, raíces como contrafuertes,
  // ramas muertas a lo largo y la copa muy arriba: con o.h grande la copa queda fuera de la pantalla y solo se ven
  // los troncos subiendo. o.h alto del tronco en unidades; o.runa: una runa vieja tallada que late apenas.
  function abetoAnciano(c, x, y, t, o) {
    const s = o.s || 1,
      h = o.h || 520,
      v = Math.sin(t * 0.5 + (o.sem || 0)) * 3 * s,
      bw = 26 * s,
      tw = 11 * s,
      r = azar((o.sem || 1) * 613);
    sombra(c, x + 30 * s, y + 4 * s, 70 * s, 16 * s, 0.38);
    // raíces contrafuerte
    [[-1, 46, 0.9], [1, 50, 1], [-0.4, 30, 0.6], [0.5, 34, 0.7]].forEach(([d, l, k], i) =>
      P(c, [x + d * bw * 0.6, y - 34 * s * k, x + d * l * s, y + 4 * s, x + d * (l - 14) * s, y + 6 * s, x + d * bw * 0.2, y], i % 2 ? C.tronco : C.troncoSombra),
    );
    // tronco: cara clara a la derecha, sombra a la izquierda
    P(c, [x - bw, y, x - tw, y - h, x + tw, y - h, x + bw, y], C.corteza);
    P(c, [x - bw, y, x - tw, y - h, x - tw * 0.1, y - h, x - bw * 0.15, y], C.tronco);
    P(c, [x - bw, y, x - tw, y - h, x - tw * 0.6, y - h, x - bw * 0.62, y], C.troncoSombra);
    // placas de corteza
    for (let k = 0; k < Math.floor(h / (34 * s)); k++) {
      const u = (k + r()) / (h / (34 * s)),
        w0 = bw + (tw - bw) * u,
        yy = y - h * u,
        dx = (r() - 0.3) * w0;
      L(c, x + dx, yy, x + dx + (r() - 0.5) * 4 * s, yy - 22 * s, C.troncoSombra, 2 * s);
    }
    // musgo al pie y alguna mancha más arriba
    P(c, [x - bw, y, x - bw * 0.9, y - 26 * s, x - bw * 0.2, y - 14 * s, x + bw * 0.3, y - 30 * s, x + bw * 0.6, y], C.musgo2);
    E(c, x - bw * 0.4, y - h * 0.32, 8 * s, 14 * s, C.musgo);
    // runa vieja tallada
    if (o.runa) {
      const late = 0.35 + Math.max(0, Math.sin(t * 0.8 + (o.sem || 0))) * 0.5;
      alfa(c, late, () => FUTHARK.dibujar(c, o.runa, x + 3 * s, y - 58 * s, 22 * s, RUNICO, 3 * s));
    }
    // ramas muertas
    for (let k = 0; k < 5; k++) {
      const u = 0.25 + k * 0.1 + r() * 0.05,
        lado = k % 2 ? 1 : -1,
        w0 = bw + (tw - bw) * u,
        yy = y - h * u;
      P(c, [x + lado * w0 * 0.8, yy, x + lado * (w0 + (30 + r() * 30) * s), yy - (14 + r() * 10) * s, x + lado * w0 * 0.8, yy - 6 * s], C.troncoSombra);
    }
    // la copa, muy arriba
    const pisos = 7,
      base0 = y - h * 0.62;
    for (let k = 0; k < pisos; k++) {
      const u = k / pisos,
        w = (96 - k * 10) * s,
        base = base0 - (h * 0.46 + 60 * s) * u,
        alto = (h * 0.16 + 30 * s),
        dx = v * (k + 1) * 0.4,
        top = base - alto;
      P(c, [x + dx, top, x - w, base, x - w * 0.5, base - 8 * s, x - w * 0.15, base + 6 * s, x + w * 0.2, base - 6 * s, x + w * 0.55, base + 4 * s, x + w, base], C.pino[k % 3]);
      P(c, [x + dx, top, x + w * 0.2, base - 6 * s, x + w * 0.55, base + 4 * s, x + w, base, x + w * 0.62, base - 12 * s], C.pinoLuz);
    }
  }

  // El roble anciano: más ancho que alto, con el tronco partido en dos y una copa enorme que hace sombra en el claro.
  function robleAnciano(c, x, y, t, o) {
    const s = o.s || 1,
      v = Math.sin(t * 0.5 + (o.sem || 0)) * 2 * s,
      r = azar((o.sem || 1) * 389);
    sombra(c, x + 40 * s, y + 6 * s, 150 * s, 34 * s, 0.4);
    [[-1, 70], [1, 76], [-0.5, 48], [0.6, 52]].forEach(([d, l], i) => P(c, [x + d * 20 * s, y - 50 * s, x + d * l * s, y + 6 * s, x + d * (l - 22) * s, y + 8 * s, x, y], i % 2 ? C.tronco : C.troncoSombra));
    P(c, [x - 40 * s, y, x - 30 * s, y - 150 * s, x - 70 * s, y - 230 * s, x - 40 * s, y - 240 * s, x, y - 170 * s, x + 44 * s, y - 250 * s, x + 74 * s, y - 236 * s, x + 32 * s, y - 150 * s, x + 42 * s, y], C.corteza);
    P(c, [x - 40 * s, y, x - 30 * s, y - 150 * s, x - 70 * s, y - 230 * s, x - 40 * s, y - 240 * s, x - 4 * s, y - 172 * s, x - 6 * s, y], C.tronco);
    P(c, [x - 8 * s, y - 40 * s, x + 6 * s, y - 40 * s, x + 4 * s, y - 70 * s, x - 6 * s, y - 70 * s], "#1E1610");
    if (o.runa) alfa(c, 0.4 + Math.max(0, Math.sin(t * 0.8)) * 0.5, () => FUTHARK.dibujar(c, o.runa, x + 18 * s, y - 80 * s, 26 * s, RUNICO, 3 * s));
    const masas = [];
    for (let k = 0; k < 8; k++) masas.push([x + (r() - 0.5) * 300 * s, y - (250 + r() * 130) * s, (70 + r() * 40) * s, k % 3]);
    masas.sort((a, b) => a[3] - b[3]).forEach(([mx, my, mr, k]) => {
      P(c, poli(mx + v, my, mr, mr * 0.75, 8, k + 0.2, [1, 0.88, 1.05, 0.92, 1, 0.86, 1.04, 0.9]), C.roble[k]);
      P(c, [mx + v, my - mr * 0.75, mx + mr * 0.9 + v, my - mr * 0.2, mx + mr * 0.3 + v, my], C.robleLuz);
    });
  }


  // La alfombra de musgo: el piso del bosque viejo cubierto de musgo mullido, con matitas claras donde da la luz.
  // Va pintada en el piso. o.s tamaño, o.sem forma.
  function alfombraMusgo(c, x, y, t, o) {
    const s = o.s || 1,
      r = azar(Math.round((o.sem || 1) * 1000) + 7);
    const jit = () => Array.from({ length: 9 }, () => 0.75 + r() * 0.45);
    P(c, poli(x, y, 70 * s, 34 * s, 9, r(), jit()), "#2E3A20");
    for (let k = 0; k < 5; k++) P(c, poli(x + (r() - 0.5) * 90 * s, y + (r() - 0.5) * 36 * s, (22 + r() * 22) * s, (10 + r() * 10) * s, 8, r(), jit()), k % 2 ? C.musgo : C.musgo2);
    for (let k = 0; k < 3; k++) P(c, poli(x + (r() - 0.2) * 70 * s, y + (r() - 0.6) * 26 * s, (10 + r() * 10) * s, (5 + r() * 4) * s, 7, r(), jit()), C.musgoClaro);
    // matitas: estrellitas de musgo y alguna hebra roja de esporas
    for (let k = 0; k < 14; k++) {
      const mx = x + (r() - 0.5) * 120 * s,
        my = y + (r() - 0.5) * 50 * s;
      if (r() < 0.8) P(c, [mx - 3, my, mx, my - 5, mx + 3, my], r() < 0.5 ? "#7A9046" : C.musgoClaro);
      else {
        L(c, mx, my, mx, my - 7, "#6E5A3A", 1.2);
        R(c, mx - 1.5, my - 9, 3, 3, "#9C2315");
      }
    }
  }

  // El barro: charco de tierra empapada con el borde removido, agua quieta que refleja el cielo y huellas de pezuñas
  // y botas. Va pintado en el piso; juego.js salpica cuando Eromash lo pisa. o.s tamaño, o.huellas.
  function barro(c, x, y, t, o) {
    const s = o.s || 1,
      r = azar(Math.round((o.sem || 1) * 1000) + 3);
    const jit = () => Array.from({ length: 16 }, (_, k) => 0.7 + r() * 0.3 + Math.sin(k * 1.7 + (o.sem || 0)) * 0.18);
    const j0 = jit();
    P(c, poli(x, y, 80 * s, 38 * s, 16, 0.2, j0.map((v) => v * 1.08)), "#3A2E1E");
    P(c, poli(x, y, 72 * s, 33 * s, 16, 0.2, j0), "#2A2016");
    P(c, poli(x - 6 * s, y + 2 * s, 52 * s, 22 * s, 16, 0.5, jit()), "#221A12");
    // terrones del borde
    for (let k = 0; k < 9; k++) {
      const a = r() * TAU;
      P(c, poli(x + Math.cos(a) * 76 * s, y + Math.sin(a) * 36 * s, (5 + r() * 5) * s, (3 + r() * 3) * s, 5, r()), r() < 0.5 ? "#4A3A28" : "#30261A");
    }
    // charquitos de agua: oscuros abajo, el cielo arriba a la derecha
    for (let k = 0; k < 3; k++) {
      const px = x + (r() - 0.5) * 70 * s,
        py = y + (r() - 0.5) * 22 * s,
        rx = (12 + r() * 16) * s,
        ry = (5 + r() * 5) * s;
      P(c, poli(px, py, rx, ry, 11, r(), Array.from({ length: 11 }, () => 0.7 + r() * 0.5)), "#2E3A3C");
      P(c, [px, py - ry * 0.8, px + rx * 0.9, py - ry * 0.2, px + rx * 0.3, py], "#56686A");
      L(c, px + rx * 0.2, py - ry * 0.5, px + rx * 0.6, py - ry * 0.3, "#8EA0A0", 1.5);
    }
    // huellas: pezuñas partidas (jabalíes, ciervos) y alguna bota
    const n = o.huellas === undefined ? 4 : o.huellas,
      a0 = r() * TAU;
    for (let k = 0; k < n; k++) {
      const hx = x + Math.cos(a0) * (k - n / 2) * 22 * s + (k % 2 ? 6 : -6) * s,
        hy = y + Math.sin(a0) * (k - n / 2) * 10 * s;
      if (r() < 0.7) {
        P(c, poli(hx - 2.5 * s, hy, 2.5 * s, 4 * s, 5, 0), "#15100B");
        P(c, poli(hx + 2.5 * s, hy, 2.5 * s, 4 * s, 5, 0), "#15100B");
      } else P(c, poli(hx, hy, 4 * s, 7 * s, 6, 0.3), "#17110C");
    }
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

  // Los juncos de la orilla: matas de hojas finas que se mecen al borde del agua, con alguna espiga parda arriba.
  function juncos(c, x, y, t, o) {
    const s = o.s || 1,
      r = azar(Math.floor((o.sem || 1) * 97) + 3),
      n = 8 + Math.floor(r() * 5);
    sombra(c, x + 3 * s, y + 1 * s, 22 * s, 5 * s, 0.25);
    for (let k = 0; k < n; k++) {
      const u = k / (n - 1) - 0.5,
        bx = x + u * 26 * s + (r() - 0.5) * 4 * s,
        h = (34 + r() * 30 - Math.abs(u) * 18) * s,
        v = Math.sin(t * 1.3 + (o.sem || 0) + k * 0.7) * 2.2 * s,
        tx = bx + u * 10 * s + v,
        col = u > 0.1 ? "#6E7E34" : u < -0.15 ? "#3E4A2A" : "#556530";
      P(c, [bx - 1.6 * s, y, tx, y - h, bx + 1.6 * s, y], col);
      // la espiga: un huso pardo en algunas, del lado de la luz más claro
      if (r() < 0.3) {
        const ey = y - h * 0.82,
          ex = bx + (tx - bx) * 0.82;
        P(c, [ex - 2.4 * s, ey + 7 * s, ex, ey - 2 * s, ex + 2.4 * s, ey + 7 * s, ex, ey + 12 * s], "#5C3E2C");
        P(c, [ex, ey - 2 * s, ex + 2.4 * s, ey + 7 * s, ex, ey + 12 * s], "#7A5634");
      }
    }
  }

  // La mata de enebro: un arbusto bajo de agujas oscuras, facetado, con bayas azules del lado de la luz.
  function enebro(c, x, y, t, o) {
    const s = o.s || 1,
      r = azar(Math.floor((o.sem || 1) * 131) + 7),
      w = (22 + r() * 8) * s,
      h = (26 + r() * 10) * s;
    sombra(c, x + 5 * s, y + 2 * s, w + 6 * s, 7 * s, 0.32);
    P(c, [x - w, y, x - w * 0.7, y - h * 0.6, x - w * 0.15, y - h, x + w * 0.1, y - h * 0.45, x, y], "#1F3322");
    P(c, [x - w * 0.15, y - h, x + w * 0.55, y - h * 0.75, x + w, y - h * 0.2, x + w * 0.9, y, x, y, x + w * 0.1, y - h * 0.45], "#2E4A2A");
    P(c, [x - w * 0.15, y - h, x + w * 0.55, y - h * 0.75, x + w * 0.1, y - h * 0.45], "#3E5E34");
    P(c, [x + w * 0.55, y - h * 0.75, x + w, y - h * 0.2, x + w * 0.45, y - h * 0.3], "#4E6E3A");
    for (let k = 0; k < 4; k++) E(c, x + (0.1 + r() * 0.7) * w, y - (0.25 + r() * 0.5) * h, 2.2 * s, 2.2 * s, k % 2 ? "#4A78D0" : "#3A5E9E");
  }

  // El brezal en flor: una mancha baja de brezo en el piso, verde oscuro con puntas rosadas (se pinta en el piso).
  function brezo(c, x, y, t, o) {
    const s = o.s || 1,
      r = azar(Math.floor((o.sem || 1) * 211) + 11);
    alfa(c, 0.85, () => E(c, x, y, 46 * s, 16 * s, "#3E4A2A"));
    for (let k = 0; k < 26; k++) {
      const a = r() * TAU,
        d = Math.sqrt(r()),
        px = x + Math.cos(a) * d * 42 * s,
        py = y + Math.sin(a) * d * 14 * s;
      P(c, [px - 2.5 * s, py, px, py - (4 + r() * 3) * s, px + 2.5 * s, py], r() < 0.6 ? "#B07A8E" : "#E0B2B2");
    }
  }

  // El poste del cruce: un palo con tablas en flecha hacia cada camino que sale (o.dirs: ángulos en el piso, 0 = este)
  // y una runa tallada arriba. Lo pone el mundo donde un camino se junta con otro.
  function posteCruce(c, x, y, t, o) {
    const s = o.s || 1,
      dirs = o.dirs && o.dirs.length ? o.dirs : [0, Math.PI];
    sombra(c, x + 6 * s, y + 2 * s, 14 * s, 5 * s, 0.32);
    R(c, x - 4 * s, y - 104 * s, 8 * s, 104 * s, C.madera);
    R(c, x - 4 * s, y - 104 * s, 3.5 * s, 104 * s, C.maderaSombra);
    P(c, [x - 5 * s, y - 104 * s, x, y - 112 * s, x + 5 * s, y - 104 * s], C.maderaLuz);
    // las tablas: las que van hacia la cámara o hacia atrás se ven cortas; cada una a su altura
    dirs.slice(0, 4).forEach((a, i) => {
      const dx = Math.cos(a),
        largo = (16 + 22 * Math.abs(dx)) * s,
        lado = dx >= 0 ? 1 : -1,
        by = y - (90 - i * 17) * s,
        alto = 11 * s,
        punta = 8 * s * Math.max(0.3, Math.abs(dx));
      const x0 = x + lado * 3 * s,
        x1 = x + lado * (3 * s + largo);
      P(c, [x0, by, x1, by, x1 + lado * punta, by + alto / 2, x1, by + alto, x0, by + alto], lado > 0 ? C.maderaLuz : C.madera);
      P(c, [x0, by + alto * 0.7, x1, by + alto * 0.7, x1 + lado * punta * 0.3, by + alto * 0.85, x1, by + alto, x0, by + alto], C.maderaSombra);
      // muescas talladas en la tabla
      for (let k = 1; k <= 3; k++) R(c, x0 + lado * k * (largo / 4.2) - 0.8 * s, by + 3 * s, 1.6 * s, 4.5 * s, "#2E2016");
    });
    E(c, x, y - 106 * s, 3 * s, 3 * s, RUNICO);
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

  // un tronco acostado en el piso, de (x0, y0) a (x1, y1), grueso r0 en la base y r1 en la punta: lomo con luz,
  // flanco en sombra y muñones de ramas (los usan el pino talado y el árbol quebrado)
  function troncoTendido(c, x0, y0, x1, y1, r0, r1, rnd, s) {
    const l = Math.hypot(x1 - x0, y1 - y0) || 1,
      nx = -(y1 - y0) / l,
      ny = (x1 - x0) / l;
    sombra(c, (x0 + x1) / 2 + 6 * s, (y0 + y1) / 2 + 4 * s, l * 0.52, r0 * 0.7, 0.3);
    P(c, [x0, y0 - r0 * 1.8, x1, y1 - r1 * 1.8, x1 + nx * r1 * 0.3, y1 + 1 * s, x0 + nx * r0 * 0.3, y0 + 2 * s], C.troncoSombra);
    P(c, [x0, y0 - r0 * 1.8, x1, y1 - r1 * 1.8, x1, y1 - r1 * 0.9, x0, y0 - r0 * 0.9], C.tronco);
    P(c, [x0, y0 - r0 * 1.8, x1, y1 - r1 * 1.8, x1, y1 - r1 * 1.45, x0, y0 - r0 * 1.45], C.corteza);
    // muñones de ramas, para arriba y para el costado
    for (let k = 1; k < 6; k++) {
      const u = 0.2 + k * 0.13 + (rnd() - 0.5) * 0.06,
        px = x0 + (x1 - x0) * u,
        r = r0 + (r1 - r0) * u,
        py = y0 + (y1 - y0) * u - r * 1.6,
        lado = k % 2 ? 1 : -1;
      L(c, px, py, px + lado * (6 + rnd() * 10) * s, py - (10 + rnd() * 12) * s, k % 2 ? C.tronco : C.troncoSombra, 3 * s);
    }
    // el musgo que le crece encima
    alfa(c, 0.8, () => P(c, [x0 + (x1 - x0) * 0.15, y0 + (y1 - y0) * 0.15 - r0 * 1.8, x0 + (x1 - x0) * 0.42, y0 + (y1 - y0) * 0.42 - r0 * 1.7, x0 + (x1 - x0) * 0.36, y0 + (y1 - y0) * 0.36 - r0 * 1.5, x0 + (x1 - x0) * 0.2, y0 + (y1 - y0) * 0.2 - r0 * 1.55], C.musgo2));
  }

  // la copa de un pino acostada: pisos que apuntan hacia la punta (d), cada uno con su cara de luz arriba
  function copaTendida(c, ex, ey, d, s, cols, luz) {
    for (let k = 0; k < 4; k++) {
      const cx = ex + d * (k * 30 - 10) * s,
        w = (44 - k * 8) * s,
        cy = ey - 12 * s;
      P(c, [cx, cy - w * 0.75, cx + d * 46 * s, cy - 2 * s, cx, cy + w * 0.3, cx + d * 12 * s, cy - 4 * s], cols[k % cols.length]);
      P(c, [cx, cy - w * 0.75, cx + d * 46 * s, cy - 2 * s, cx + d * 12 * s, cy - w * 0.25], luz);
    }
  }

  // El pino talado: tocón cortado a hacha (la boca de caída y la bisagra que se partió), virutas alrededor y el tronco
  // acostado donde cayó, con la copa ya seca en la punta. Marca dónde los leñadores le ganaron al bosque un claro.
  // o.dir: hacia qué lado cayó (1 derecha, -1 izquierda); o.ang: cuánto se va hacia adelante o hacia atrás.
  function pinoTalado(c, x, y, t, o) {
    const s = o.s || 1,
      rnd = azar((o.sem || 1) * 389),
      d = o.dir || 1,
      ang = o.ang || 0,
      L0 = (130 + rnd() * 40) * s,
      bx = x + d * 22 * s,
      by = y + 4 * s,
      ex = bx + d * L0,
      ey = by + ang * L0;
    // la copa seca, acostada en la punta: pisos de pino ya marrones
    copaTendida(c, ex, ey, d, s, ["#4A4A2A", "#5A5430", "#4E4A2C"], "#76683C");
    troncoTendido(c, bx, by, ex, ey, 14 * s, 8 * s, rnd, s);
    // la base cortada del tronco que cayó, mirando al tocón
    E(c, bx, by - 15 * s, 7 * s, 14 * s, C.maderaLuz);
    E(c, bx, by - 15 * s, 4 * s, 8 * s, "#B08A58");
    // el tocón: corte plano con la boca de caída del lado del árbol y la astilla de la bisagra
    const w = 15 * s,
      h = 18 * s;
    sombra(c, x + 4 * s, y + 2 * s, w + 8 * s, 6 * s, 0.32);
    P(c, [x - w - 6 * s, y + 1 * s, x - w, y - 5 * s, x - w + 4 * s, y + 1 * s], C.troncoSombra);
    P(c, [x + w + 6 * s, y + 1 * s, x + w, y - 5 * s, x + w - 4 * s, y + 1 * s], C.tronco);
    P(c, [x - w, y, x - w, y - h, x + w, y - h, x + w, y], C.corteza);
    P(c, [x - w, y, x - w, y - h, x - w * 0.3, y - h, x - w * 0.4, y], C.tronco);
    E(c, x, y - h, w, w * 0.4, C.maderaLuz);
    E(c, x, y - h, w * 0.6, w * 0.24, "#B08A58");
    // la boca de caída (cuña sacada a hacha) y la bisagra rota que quedó parada
    P(c, [x + d * w, y - h, x + d * w * 0.3, y - h + 2 * s, x + d * w, y - h + 8 * s], "#2A2016");
    P(c, [x - d * w * 0.2, y - h - 1 * s, x - d * w * 0.05, y - h - 10 * s, x + d * w * 0.1, y - h - 1 * s], "#B08A58");
    // virutas
    for (let k = 0; k < 6; k++) {
      const a = rnd() * TAU,
        r = (18 + rnd() * 22) * s;
      E(c, x + Math.cos(a) * r, y + 6 * s + Math.sin(a) * r * 0.35, 3 * s, 1.6 * s, k % 2 ? C.maderaLuz : "#B08A58", a);
    }
  }

  // El árbol quebrado: el viento (o algo más grande) lo partió cerca del pie. Queda un tocón alto en astillas y el resto
  // del árbol tendido al lado, la copa todavía verde. o.dir y o.ang como el pino talado; o.roble: era un roble.
  function arbolQuebrado(c, x, y, t, o) {
    const s = o.s || 1,
      rnd = azar((o.sem || 1) * 613),
      d = o.dir || 1,
      ang = o.ang || 0,
      roble = !!o.roble,
      L0 = (120 + rnd() * 50) * s,
      bx = x + d * 18 * s,
      by = y + 3 * s,
      ex = bx + d * L0,
      ey = by + ang * L0;
    // la copa caída, primero (queda detrás del tronco)
    if (roble)
      [0, 1, 2].forEach((k) => {
        const mx = ex + d * (k * 22 - 6) * s,
          my = ey - (16 + (k % 2) * 14) * s,
          mr = (30 - k * 4) * s;
        P(c, poli(mx, my, mr, mr * 0.7, 7, 0.3 + k, [1, 0.86, 1.04, 0.9, 1.02, 0.88, 0.96]), C.roble[k]);
        P(c, [mx, my - mr * 0.7, mx + mr * 0.9, my - mr * 0.2, mx + mr * 0.3, my], C.robleLuz);
      });
    else copaTendida(c, ex, ey, d, s, C.pino, C.pinoLuz);
    troncoTendido(c, bx, by, ex, ey, 14 * s, 8 * s, rnd, s);
    // la punta partida del tronco caído: astillas claras
    P(c, [bx, by - 26 * s, bx - d * 9 * s, by - 20 * s, bx - d * 2 * s, by - 14 * s, bx - d * 13 * s, by - 7 * s, bx, by], "#B08A58");
    // el tocón alto, en sombra a la izquierda, con el borde en dientes
    const w = 14 * s,
      h = (34 + rnd() * 16) * s,
      dientes = [];
    for (let k = 0; k <= 6; k++) dientes.push(x - w + (k * 2 * w) / 6, y - h + (k % 2 ? -(8 + rnd() * 14) * s : rnd() * 6 * s));
    sombra(c, x + 5 * s, y + 2 * s, w + 9 * s, 6 * s, 0.34);
    P(c, [x - w - 7 * s, y + 1 * s, x - w, y - 6 * s, x - w + 4 * s, y + 1 * s], C.troncoSombra);
    P(c, [x + w + 7 * s, y + 1 * s, x + w, y - 6 * s, x + w - 4 * s, y + 1 * s], C.tronco);
    P(c, [x - w, y].concat(dientes, [x + w, y]), roble ? C.corteza : C.tronco);
    P(c, [x - w, y, dientes[0], dientes[1], dientes[2], dientes[3], x - w * 0.3, y], C.troncoSombra);
    // la madera desnuda adentro de los dientes, del lado que cayó
    for (let k = 1; k < 6; k += 2) P(c, [dientes[k * 2 - 2], dientes[k * 2 - 1], dientes[k * 2], dientes[k * 2 + 1], dientes[k * 2 + 2], dientes[k * 2 + 3], dientes[k * 2] + d * 2 * s, dientes[k * 2 + 1] + 10 * s], "#B08A58");
    P(c, [x - w, y - 4 * s, x - w + 2 * s, y - 20 * s, x - w * 0.4, y - 12 * s, x - w * 0.5, y], C.musgo2);
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
    P(c, [x - w, y - 14 * s, x - w, y - h, x + w, y - h, x + w, y - 14 * s], "#5E4A34");
    P(c, [x - w, y - 14 * s, x - w, y - h, x - w + 10 * s, y - h, x - w + 10 * s, y - 14 * s], "#3E2E20");
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

  // ======================================================================
  //  LOS MISMOS, ARMADOS CON CARAS (todo girable, comun/volumen.js)
  // ======================================================================
  // De frente y sin girar se ve el dibujo de siempre (f); girado (él o la cámara), estos (fv). Lo redondo (árboles,
  // rocas, tocones, matas) se ve igual de cualquier lado y queda como figura (`figura: true` en LISTA).
  const T = C.T,
    PIEDRA_G = ["#383A42", "#4A4C54", "#5C5E66"],
    PIEDRA_R = ["#46484C", "#585A5E", "#6E7074"],
    menhir = (...a) => ASSETS.KIT.menhirV(...a),
    troncoPunta = (...a) => ASSETS.KIT.troncoPunta(...a);
  // una runa trazada a mano (lista de trazos [x0, y0, x1, y1…]) sobre una cara
  function trazos(cc, lista, col, g) {
    cc.strokeStyle = col;
    cc.lineWidth = g;
    cc.lineCap = "round";
    cc.lineJoin = "round";
    lista.forEach((tr) => {
      cc.beginPath();
      cc.moveTo(tr[0], tr[1]);
      for (let i = 2; i < tr.length; i += 2) cc.lineTo(tr[i], tr[i + 1]);
      cc.stroke();
    });
  }
  // lo que es plano se arma solo con su dibujo de siempre: en el piso (calco: manchas, charcos, alfombras, rastros) o
  // parado en un plano de dos caras (carta: lo que es una lámina, como un arco de astas o una tela); de canto no se ve
  const calcoV = (f) => (c, x, y, t, o) => VOL.calco(c, VOL.pr(x, y, o), (cc) => f(cc, 0, 0, t, Object.assign({}, o, { s: 1 })));
  const cartaV = (f, ancho, alto) => (c, x, y, t, o) =>
    VOL.plano(c, VOL.pr(x, y, o), -ancho / 2, ancho / 2, 0, 0, alto, null, (cc, l, h) => VOL.sinSombra(() => f(cc, l / 2, 0, t, Object.assign({}, o, { s: 1 }))));
  // el poste de cruce: el palo, la punta y una tabla con flecha hacia cada camino (o.dirs: ángulos en el mundo)
  function posteCruceV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      dirs = o.dirs && o.dirs.length ? o.dirs : [0, Math.PI];
    VOL.sombra(c, pr, 0, 0, 14, 9, 0.32);
    const S = VOL.escena(pr);
    dirs.slice(0, 4).forEach((a, i) => {
      // la tabla apunta a un lugar del mundo: no gira con el poste, solo con la cámara
      const df = (VOL.cam.g + a - pr.fi) * pr.e,
        u = Math.cos(df) * 22,
        w = Math.sin(df) * 22,
        p2 = VOL.sub(pr, 0, 0, 0, df),
        z = 90 - i * 17;
      S.poner(u, w, () =>
        VOL.plano(c, p2, 3, 41, 0, z - 11, z, null, (cc, l, h) => {
          P(cc, [0, -h, l - 8, -h, l, -h / 2, l - 8, 0, 0, 0], C.madera);
          P(cc, [0, -h * 0.3, l - 8, -h * 0.3, l - 2, -h * 0.15, l - 8, 0, 0, 0], C.maderaSombra);
          for (let k = 1; k <= 3; k++) R(cc, (k * l) / 4.6 - 0.8, -h + 3, 1.6, 4.5, "#2E2016");
        }),
      );
    });
    S.poner(0, 0, () => {
      VOL.cubo(c, pr, 0, 0, 8, 8, 104, T.madera);
      VOL.piramide(c, pr, VOL.redonda(0, 0, 5.5, 4, 0.5), 104, 0, 0, 112, T.madera);
      VOL.halo(c, pr, 0, 3, 106, 6, RUNICO, 0.5);
    });
    S.dibujar();
  }
  // el tronco caído: un rollo acostado con el corte claro, el lomo con musgo y dos orejas de ámbar
  function troncoCaidoV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 0, 0, 66, 14, 0.32);
    VOL.rollo(c, pr, -70, 70, 0, 11, 11, T.tronco, { n: 7, corte: C.maderaLuz });
    VOL.caja(c, pr, -54, -5, 21, 30, 5, 23, ["#3A4424", C.musgo2, C.musgoClaro], { sin: ["izq", "der"] });
    [[-21, 6], [7, 7]].forEach(([u, w]) => VOL.piramide(c, pr, [[u - 6, w], [u + 6, w], [u, w + 4]], 12, u, w + 1, 18, ["#B07A34", "#D9A24A", C.ambar]));
  }
  // un árbol acostado (el pino talado, el árbol quebrado): el rollo del tronco hacia la punta y la copa como masas
  function tendido(c, pr, d, ang, L0, roble, seco, t) {
    const df = Math.atan2(ang, d),
      p2 = VOL.sub(pr, d * 22, 0, 0, df);
    VOL.sombra(c, p2, L0 / 2, 0, L0 * 0.55, 16, 0.3);
    VOL.rollo(c, p2, 0, L0, 0, 13, 12, T.tronco, { n: 7, corte: C.maderaLuz });
    for (let k = 1; k < 5; k++) VOL.palo(c, p2, L0 * (0.25 + k * 0.13), 0, 22, L0 * (0.27 + k * 0.13), (k % 2 ? 1 : -1) * 12, 36, 3, k % 2 ? C.tronco : C.troncoSombra);
    // la copa: hacia dónde queda la punta en la pantalla y sus masas ahí
    const q = p2(L0, 0, 14),
      q0 = p2(0, 0, 14),
      dd = q[0] >= q0[0] ? 1 : -1;
    if (roble)
      [0, 1, 2].forEach((k) => {
        const mx = q[0] + dd * (k * 22 - 6) * pr.s,
          my = q[1] - (10 + (k % 2) * 14) * pr.s,
          mr = (30 - k * 4) * pr.s;
        P(c, poli(mx, my, mr, mr * 0.7, 7, 0.3 + k, [1, 0.86, 1.04, 0.9, 1.02, 0.88, 0.96]), C.roble[k]);
        P(c, [mx, my - mr * 0.7, mx + mr * 0.9, my - mr * 0.2, mx + mr * 0.3, my], C.robleLuz);
      });
    else copaTendida(c, q[0], q[1] + 12 * pr.s, dd, pr.s, seco ? ["#4A4A2A", "#5A5430", "#4E4A2C"] : C.pino, seco ? "#76683C" : C.pinoLuz);
  }
  function pinoTaladoV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      rnd = azar((o.sem || 1) * 389),
      d = o.dir || 1,
      L0 = 130 + rnd() * 40;
    tendido(c, pr, d, o.ang || 0, L0, false, true, t);
    VOL.sombra(c, pr, 0, 0, 22, 12, 0.32);
    VOL.cilindro(c, pr, 0, 0, 15, 0, 18, T.tronco, { n: 8 });
    VOL.elipse(c, pr, 0, 0, 18, 13, 13, C.maderaLuz);
    VOL.elipse(c, pr, 0, 0, 18.5, 8, 8, "#B08A58");
    VOL.piramide(c, pr, [[-d * 3, -4], [-d * 3, 4], [d * 2, 0]], 18, -d * 1, 0, 28, ["#8A6A40", "#B08A58", "#C8A070"]);
    VOL.enPiso(c, pr, (cc) => {
      for (let k = 0; k < 6; k++) {
        const a = rnd() * TAU,
          r = 18 + rnd() * 22;
        E(cc, Math.cos(a) * r, Math.sin(a) * r, 3, 1.6, k % 2 ? C.maderaLuz : "#B08A58", a);
      }
    });
  }
  function arbolQuebradoV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      rnd = azar((o.sem || 1) * 613),
      d = o.dir || 1,
      L0 = 120 + rnd() * 50,
      h = 34 + rnd() * 16;
    tendido(c, pr, d, o.ang || 0, L0, !!o.roble, false, t);
    VOL.sombra(c, pr, 0, 0, 22, 12, 0.34);
    VOL.cilindro(c, pr, 0, 0, 14, 0, h, o.roble ? [C.troncoSombra, C.corteza, "#6E5640"] : T.tronco, { n: 7 });
    // los dientes de la quebradura, alrededor del borde
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU,
        u = Math.cos(a) * 10,
        w = Math.sin(a) * 10,
        hh = 8 + rnd() * 14;
      VOL.piramide(c, pr, VOL.redonda(u, w, 5, 3, a), h, u, w, h + hh, ["#8A6A40", "#B08A58", "#C8A070"]);
    }
  }
  // el farol de la senda: el poste, el brazo hacia un lado y la caja de hierro con la luz
  function farolV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      fl = 0.8 + Math.sin(t * 7 + (o.sem || 0)) * 0.1;
    VOL.sombra(c, pr, 0, 0, 14, 9);
    VOL.cubo(c, pr, 0, 0, 5, 5, 86, T.oscura);
    VOL.caja(c, pr, -2, -2, 82, 18, 2, 86, T.oscura);
    VOL.palo(c, pr, 14, 0, 82, 14, 0, 76, 1.5, C.hierro);
    VOL.cubo(c, pr, 14, 0, 13, 13, 16, T.hierro, { frente: (cc, l, h) => alfa(cc, fl, () => R(cc, 2, -h + 3, l - 4, h - 5, C.ambar)), atras: (cc, l, h) => alfa(cc, fl, () => R(cc, 2, -h + 3, l - 4, h - 5, C.ambar)) }, 60);
    VOL.piramide(c, pr, VOL.redonda(14, 0, 11, 4, 0.785), 76, 14, 0, 82, T.hierro);
    if (o.luz !== false) VOL.halo(c, pr, 14, 0, 70, 70, C.ambar, fl);
  }
  // la piedra rúnica de la Linde: menhir con Raidho tallada adelante
  function piedraLindeV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      viva = o.apagada ? 0.15 : 0.7 + Math.sin(t * 1.6 + (o.sem || 0)) * 0.25;
    if (o.luz !== false) VOL.halo(c, pr, 0, 0, 34, 54, RUNICO, viva);
    VOL.sombra(c, pr, 0, 0, 20, 12);
    menhir(c, pr, 13, 9, 60, PIEDRA_G, (cc, l, h) => {
      const m = l / 2;
      alfa(cc, 0.35 + viva * 0.65, () => trazos(cc, [[m - 3, -h * 0.28, m - 3, -h * 0.9, m + 5, -h * 0.75, m - 3, -h * 0.61, m + 5, -h * 0.32]], viva > 0.3 ? RUNICO_CLARO : RUNICO, 3));
    });
  }
  // la cabaña de Eydis: troncos, puerta y ventana adelante, techo de pasto, y la torreta de vigía atrás a la derecha
  function puestoEydisV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      w = 92,
      h = 64,
      PASTO = [C.pastoSombra, C.pasto, "#6A7A38"];
    VOL.sombra(c, pr, 16, -20, 150, 70, 0.34);
    const troncos = (cc, l, hh) => {
      R(cc, 0, -hh, l, hh, C.madera);
      for (let k = 0; k < 6; k++) R(cc, 0, -hh + k * 11, l, 2, C.maderaSombra);
    };
    const S = VOL.escena(pr);
    S.poner(110, -40, () => {
      [[-23, -23], [23, -23], [-23, 23], [23, 23]].forEach(([du, dw]) => VOL.cubo(c, pr, 110 + du, -40 + dw, 6, 6, 150, T.oscura));
      VOL.palo(c, pr, 87, -17, 10, 133, -17, 120, 4, C.maderaSombra);
      VOL.palo(c, pr, 133, -17, 10, 87, -17, 120, 4, C.maderaSombra);
      VOL.caja(c, pr, 76, -74, 146, 144, -6, 158, T.madera);
      for (let k = 0; k < 5; k++) VOL.cubo(c, pr, 78 + k * 16, -8, 4, 4, 22, T.oscura, null, 158);
      VOL.piramide(c, pr, [[70, -80], [150, -80], [150, 0], [70, 0]], 180, 110, -40, 214, PASTO);
    });
    S.poner(0, 0, () => {
      VOL.caja(c, pr, -w, -50, 0, w, 50, h, T.madera, {
        frente: (cc, l, hh) => {
          troncos(cc, l, hh);
          R(cc, l / 2 - 16, -44, 32, 44, C.maderaSombra);
          R(cc, l / 2 - 14, -42, 2, 42, C.troncoSombra);
          R(cc, l / 2 + 40, -46, 24, 18, "#1A140E");
          alfa(cc, 0.7, () => R(cc, l / 2 + 42, -44, 20, 14, C.ambar));
          P(cc, [l / 2, -54, l / 2 - 5, -46, l / 2, -48, l / 2 + 5, -46], C.hueso);
        },
        atras: troncos,
        izq: troncos,
        der: troncos,
        sinTapa: true,
      });
      VOL.techo(c, pr, -w - 14, -62, w + 14, 62, h, 54, PASTO, { hastial: C.madera });
    });
    S.dibujar();
  }
  // el tablero de rutas: dos postes y las tablillas clavadas adelante
  function tableroRutasV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 0, 0, 30, 12);
    VOL.cubo(c, pr, -24, 0, 4, 4, 56, T.oscura);
    VOL.cubo(c, pr, 24, 0, 4, 4, 56, T.oscura);
    VOL.caja(c, pr, -30, -2, 22, 30, 2, 52, T.vieja, {
      frente: (cc, l, h) => {
        [[4, -28, 16, 12], [24, -26, 18, 10], [44, -28, 12, 14], [10, -14, 22, 10], [36, -12, 18, 9]].forEach(([dx, dy, w, hh], k) => {
          R(cc, dx, dy, w, hh, k === 2 ? "#D8C8A4" : "#C8B48C");
          L(cc, dx + 2, dy + hh / 2, dx + w - 3, dy + hh / 2 - 2, "#5E4A36", 1.2);
        });
        L(cc, 50, -30, 50, -12, C.rojoEromash, 2);
      },
    });
  }
  // la empalizada del puesto: troncos con punta en fila (o.n) y el travesaño de atrás
  function empalizadaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      n = o.n || 8,
      r = azar((o.sem || 3) * 131);
    VOL.sombra(c, pr, (n * 18) / 2 - 9, 0, n * 10, 10, 0.3);
    VOL.caja(c, pr, -8, -10, 26, n * 18 - 10, -6, 30, T.oscura);
    const S = VOL.escena(pr);
    for (let k = 0; k < n; k++) {
      const h = 56 + r() * 12 - (k % 4 === 2 ? 10 : 0);
      S.poner(k * 18, 0, () => troncoPunta(c, pr, k * 18, 0, 8.5, h, T.madera, 12));
    }
    S.dibujar();
  }
  // el carro volcado: la caja de costado con el fondo hacia afuera, la rueda de arriba que gira, la partida en el
  // piso, la lanza rota, las herramientas y el saco, y las marcas de arrastre
  function carroVolcadoV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 0, 0, 88, 40, 0.36);
    VOL.enPiso(c, pr, (cc) =>
      alfa(cc, 0.5, () => {
        L(cc, 60, 10, 150, -26, "#2A2218", 3);
        L(cc, 66, 18, 158, -16, "#2A2218", 3);
        P(cc, [-110, 6, -96, -14, -76, -16, -70, -4, -86, 8], C.madera);
        R(cc, 24, 18, 30, 4, C.maderaLuz);
        R(cc, 50, 14, 9, 10, C.hierro);
        P(cc, [-30, 24, 4, 20, 6, 26, -28, 30], "#8A8E92");
        P(cc, [70, 28, 120, 18, 122, 24, 72, 34], C.maderaLuz);
      }),
    );
    const S = VOL.escena(pr);
    S.poner(0, 0, () => {
      const tablas = (cc, l, h) => {
        R(cc, 0, -h, l, h, C.madera);
        for (let k = 1; k < 4; k++) R(cc, 0, -h + (k * h) / 4, l, 2, C.maderaSombra);
      };
      VOL.caja(c, pr, -66, -26, 0, 56, 10, 54, T.madera, { frente: (cc, l, h) => {
        R(cc, 0, -h, l, h, C.maderaSombra);
        [0.2, 0.5, 0.8].forEach((f) => R(cc, l * f - 3, -h, 6, h, "#3A2614"));
      }, atras: tablas, tapa: C.maderaLuz });
      VOL.palo(c, pr, 56, -6, 10, 96, 6, 2, 5, C.maderaSombra);
    });
    S.poner(-34, -30, () => {
      const p2 = VOL.sub(pr, -34, -30, 64, Math.PI / 2);
      VOL.rollo(c, p2, -3, 3, 0, 0, 22, T.oscura, { n: 12, corte: C.madera });
    }, 64);
    S.poner(-50, 16, () => {
      VOL.cono(c, pr, -50, 16, 11, 7, 0, 22, ["#7A6444", "#A88E62", "#C0A678"], { n: 7 });
      for (let k = 0; k < 4; k++) VOL.cubo(c, pr, -36 + k * 5, 24, 3, 1.5, 1.5, T.hierro);
    });
    S.dibujar();
  }
  // los menhires del Refugio: piedra gastada con su muesca
  function menhirRefugioV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      luz = o.luz || 0;
    if (luz > 0) VOL.halo(c, pr, 0, 0, 30, 40, RUNICO, luz);
    VOL.sombra(c, pr, 0, 0, 18, 11);
    menhir(c, pr, 11, 8, 52, PIEDRA_R, (cc, l, h) => alfa(cc, 0.4 + luz * 0.6, () => R(cc, l / 2 - 1.5, -h * 0.75, 3, 12, luz > 0.2 ? RUNICO : "#3A3C40")));
  }
  // la piedra rúnica del Refugio: la base tallada y, si está puesta, la piedra de arriba con Algiz
  function runaRefugioV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      luz = o.luz || 0;
    if (luz > 0) VOL.halo(c, pr, 0, 0, 40, 110, RUNICO, luz * (0.85 + Math.sin(t * 2) * 0.15));
    VOL.sombra(c, pr, 0, 0, 32, 20);
    VOL.caja(c, pr, -28, -18, 0, 28, 18, 22, ["#3E4046", "#4E5056", "#686A70"]);
    if (!o.puesta) return VOL.elipse(c, pr, 0, 0, 22.5, 12, 7, "#2E3034");
    menhir(c, VOL.sub(pr, 0, 0, 22), 15, 10, 58, ["#46484E", "#56585E", "#6A6C72"], (cc, l, h) =>
      alfa(cc, 0.3 + luz * 0.7, () => trazos(cc, [[l / 2, -6, l / 2, -h + 2], [l / 2, -h * 0.55, l / 2 - 8, -h * 0.85], [l / 2, -h * 0.55, l / 2 + 8, -h * 0.85]], luz > 0.3 ? RUNICO_CLARO : "#3A3C40", 3)),
    );
  }
  // el cobertizo del Refugio: techo de una sola agua sobre postes, las mantas en el piso y la bolsa de Orm
  function cobertizoRefugioV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 0, 0, 76, 34, 0.32);
    VOL.enPiso(c, pr, (cc) => {
      P(cc, [-50, -4, -10, -10, -4, 4, -46, 8], "#7A4A3A");
      P(cc, [4, -8, 44, -12, 48, 2, 6, 6], "#5A6A7A");
    });
    [[-60, -26, 72], [60, -26, 72], [-60, 26, 50], [60, 26, 50]].forEach(([u, w, h]) => VOL.cubo(c, pr, u, w, 6, 6, h, T.oscura));
    VOL.caja(c, pr, 20, -6, 0, 44, 8, 18, ["#6A5034", "#8A6A44", "#A08058"]);
    VOL.palo(c, pr, 32, 0, 18, 28, 0, 30, 3, C.maderaSombra);
    VOL.aguaUna(c, pr, -76, -34, 76, 76, 34, 48, T.madera, { fn: (cc, l, h) => { for (let k = 1; k < 7; k++) R(cc, (k * l) / 7, -h, 1.5, h, C.maderaSombra); } });
  }
  // la casa de Eikholt: zócalo de piedra, entramado, puerta y ventanas adelante, techo a dos aguas con hileras y la
  // chimenea con humo
  function casaEikholtP(c, pr, t, o) {
    const v = o.v || 0,
      w = v === 1 ? 70 : 84,
      h = v === 2 ? 70 : 58,
      th = v === 1 ? 70 : 58,
      D = 46,
      TCH = [T.pizarra, [C.maderaSombra, C.maderaVieja, C.madera], ["#3A4424", C.musgo2, C.musgoClaro]][(o.techo || 0) % 3],
      pu = ["#5E3A22", "#3E4E66", "#7A2A1E"][v % 3];
    VOL.sombra(c, pr, 16, 0, w * 1.6, D * 1.3, 0.34);
    const entramado = (ventanas, puerta) => (cc, l, hh) => {
      R(cc, 0, -hh, l, hh, "#5E4A34");
      R(cc, 0, -hh, l, 5, C.maderaSombra);
      R(cc, 0, -4, l, 5, C.maderaSombra);
      for (let k = 0; k <= 4; k++) R(cc, (k * l) / 4 - 2.5, -hh, 5, hh, C.maderaSombra);
      if (ventanas)
        [l / 4 - 9, (3 * l) / 4 - 9].forEach((vx) => {
          R(cc, vx, -hh + 14, 18, 16, "#1A140E");
          alfa(cc, 0.55, () => R(cc, vx + 2, -hh + 16, 14, 12, C.ambar));
        });
      if (puerta) P(cc, [l / 2 - 13, 0, l / 2 - 13, -36, l / 2, -42, l / 2 + 13, -36, l / 2 + 13, 0], pu);
    };
    VOL.caja(c, pr, -w, -D, 0, w, D, 14, T.piedra);
    VOL.caja(c, pr, -w, -D, 14, w, D, h, T.madera, { frente: entramado(true, true), atras: entramado(true, false), izq: entramado(false, false), der: entramado(false, false), sinTapa: true });
    VOL.techo(c, pr, -w - 14, -D - 14, w + 14, D + 14, h - 2, th, TCH, { hastial: "#5E4A34" });
    if (v !== 1) {
      VOL.cubo(c, pr, w * 0.35 + 7, -8, 14, 14, th * 0.7 + 10, T.piedra, null, h + th * 0.45);
      const q = pr(w * 0.35 + 7, -8, h + th * 1.15 + 10);
      for (let k = 0; k < 4; k++) {
        const p = (t * 0.22 + k / 4 + (o.sem || 0) * 0.13) % 1;
        alfa(c, 0.25 * (1 - p), () => E(c, q[0] + Math.sin(p * 5 + k) * 8 * pr.s, q[1] - p * 90 * pr.s, (5 + p * 14) * pr.s, (4 + p * 10) * pr.s, "#8A8E88"));
      }
    }
  }
  function casaEikholtV(c, x, y, t, o) {
    casaEikholtP(c, VOL.pr(x, y, o), t, o);
  }
  // la Casa de las Lindes: la casa grande, la torre de registros de piedra y el estandarte azul con Laguz
  function casaLindesV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    const S = VOL.escena(pr);
    S.poner(-30, 0, () => casaEikholtP(c, VOL.sub(pr, -30, 0, 0, 0, 1.1), t, { v: 1, sem: 5 }));
    S.poner(92, 0, () => {
      VOL.sombra(c, pr, 92, 0, 40, 30, 0.3);
      const piedra = (ven) => (cc, l, h) => {
        R(cc, 0, -h, l, h, "#5A5650");
        for (let k = 0; k < 8; k++) R(cc, 0, -k * 15, l, 2, "#46423C");
        if (ven) {
          R(cc, l / 2 - 7, -92, 14, 20, "#1A140E");
          alfa(cc, 0.6, () => R(cc, l / 2 - 5, -90, 10, 16, C.ambar));
        }
      };
      VOL.cubo(c, pr, 92, 0, 60, 60, 120, T.piedra, { frente: piedra(true), atras: piedra(false), izq: piedra(false), der: piedra(true) });
      VOL.piramide(c, pr, [[54, -38], [130, -38], [130, 38], [54, 38]], 118, 92, 0, 168, T.pizarra);
    });
    S.poner(40, 40, () => {
      const ond = Math.sin(t * 3) * 3;
      VOL.cubo(c, pr, 40, 40, 3, 3, 76, T.oscura);
      VOL.plano(c, pr, 41, 65, 40, 30, 70, null, (cc, l, h) => {
        P(cc, [0, -h, l, -h + ond * 0.5, l, ond, l / 2, -h * 0.18 + ond, 0, 0], "#3E4E66");
        trazos(cc, [[9, -h + 8, 9, -h + 26 + ond * 0.5], [9, -h + 8, 16, -h + 14 + ond * 0.3]], RUNICO, 2.5);
      });
    });
    S.dibujar();
  }
  // la mesa de Svanhild: el tablón sobre caballetes, los libros, la balanza, el tintero y el fragmento
  function mesaSvanhildV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 0, 0, 54, 20);
    [-30, 30].forEach((u) => {
      VOL.palo(c, pr, u - 8, -10, 0, u, 0, 30, 4, C.maderaSombra);
      VOL.palo(c, pr, u + 8, -10, 0, u, 0, 30, 4, C.maderaSombra);
      VOL.palo(c, pr, u - 8, 10, 0, u, 0, 30, 4, C.maderaSombra);
      VOL.palo(c, pr, u + 8, 10, 0, u, 0, 30, 4, C.maderaSombra);
    });
    VOL.caja(c, pr, -50, -14, 30, 50, 14, 38, T.madera, { tapa: C.maderaLuz });
    VOL.caja(c, pr, -42, -8, 38, -20, 6, 44, ["#3E1A16", "#5E2A22", "#7A3A2E"]);
    VOL.caja(c, pr, -40, -7, 44, -20, 5, 50, T.pizarra);
    VOL.caja(c, pr, -41, -6, 50, -23, 4, 55, ["#4E4028", "#6B5A3A", "#84704A"]);
    VOL.palo(c, pr, 26, 0, 38, 26, 0, 60, 2, C.hierro);
    VOL.palo(c, pr, 14, 0, 60, 38, 0, 60, 2, C.hierro);
    VOL.elipse(c, pr, 14, 0, 50, 6, 4, "#B88A3A");
    VOL.elipse(c, pr, 38, 0, 50, 6, 4, "#B88A3A");
    VOL.cubo(c, pr, -9, 2, 6, 6, 6, ["#101016", "#1A1A22", "#2A2A34"], null, 38);
    VOL.palo(c, pr, -9, 2, 44, -4, 0, 56, 1.5, C.hueso);
    if (o.fragmento) {
      VOL.caja(c, pr, -2, -4, 38, 16, 4, 42, ["#B8AC94", C.hueso, "#F2ECEC"]);
      VOL.palo(c, pr, 6, -4.5, 42, 9, 4.5, 42, 2, VIOLETA);
    }
  }
  // la losa del patio: una piedra plana con el círculo de runas grabado arriba
  function losaPatioV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      luz = o.luz || 0,
      col = luz > 0 ? RUNICO : "#4A4640";
    VOL.prisma(c, pr, [[-46, 0], [-36, -20], [38, -22], [46, -2], [36, 16], [-38, 16]], 0, 8, ["#56524C", "#6A6660", "#7E7A72"]);
    VOL.enPiso(c, pr, (cc) => {
      cc.strokeStyle = col;
      cc.lineWidth = 2;
      cc.beginPath();
      cc.ellipse(0, -2, 28, 12, 0, 0, TAU);
      cc.stroke();
      for (let k = 0; k < 8; k++) {
        const a = (k * TAU) / 8;
        L(cc, Math.cos(a) * 22, -2 + Math.sin(a) * 9, Math.cos(a) * 28, -2 + Math.sin(a) * 12, col, 2);
      }
    }, 8);
    if (luz > 0) VOL.halo(c, pr, 0, 0, 10, 60, RUNICO, luz);
  }
  // el pozo de Eikholt: el brocal redondo, los dos postes, el techito, el eje con la soga y el balde, la manivela
  function pozoEikholtV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 0, 0, 40, 26, 0.34);
    VOL.elipse(c, pr, -26, 18, 0, 14, 6, "#2A4C56");
    VOL.cilindro(c, pr, 0, 0, 30, 0, 26, T.roca, { n: 12 });
    VOL.elipse(c, pr, 0, 0, 26.5, 23, 21, "#121414");
    VOL.cubo(c, pr, -25, 0, 6, 6, 78, T.oscura);
    VOL.cubo(c, pr, 25, 0, 6, 6, 78, T.oscura);
    VOL.palo(c, pr, -24, 0, 64, 24, 0, 64, 4, C.maderaVieja);
    VOL.palo(c, pr, 4, 0, 62, 4, 0, 40, 1.5, "#C8B48C");
    VOL.cono(c, pr, 4, 0, 5, 7, 28, 40, T.madera, { n: 7 });
    VOL.palo(c, pr, 28, 0, 64, 34, 4, 56, 2.5, C.hierroLuz);
    VOL.cubo(c, pr, 34, 4, 4, 4, 8, [C.rojoEromash, C.rojoEromash, "#C8402D"], null, 50);
    VOL.techo(c, pr, -40, -22, 40, 22, 72, 28, T.vieja);
  }
  // el puesto de mercado: postes, el mostrador con hongos dorados y el toldo a rayas rojas y blancas
  function puestoMercadoV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 0, 0, 56, 26);
    [[-44, -14, 66], [44, -14, 66], [-44, 14, 56], [44, 14, 56]].forEach(([u, w, h]) => VOL.cubo(c, pr, u, w, 4, 4, h, T.oscura));
    VOL.caja(c, pr, -48, -10, 0, 48, 12, 24, T.madera, { tapa: C.maderaLuz });
    for (let k = 0; k < 6; k++) VOL.piramide(c, pr, VOL.redonda(-36 + k * 14, 0, 6, 5), 24, -36 + k * 14, 0, 32, k % 2 ? ["#B07A2A", "#E8B04A", "#FFD98A"] : ["#C89A4A", C.ambar, "#FFE8B0"]);
    for (let k = 0; k < 6; k++) {
      const col = k % 2 ? ["#C8C0C0", "#F2ECEC", "#FFFFFF"] : ["#6E180E", C.rojoEromash, "#C8402D"];
      VOL.aguaUna(c, pr, -54 + k * 18, -18, 70, -36 + k * 18, 22, 56, col, { grueso: 3 });
    }
  }
  // el puente del Paso (y el de tablas): tablones de punta a punta, roto en el medio si o.roto, con los postes y
  // las barandas de cuerda
  function puentePasoV(c, x, y, t, o) {
    const pr = VOL.prSeg(x, y, o.x2, o.y2, o),
      l = pr.largo,
      an = 34,
      n = Math.max(2, Math.floor(l / 12));
    const S = VOL.escena(pr);
    for (let k = 0; k < n; k++) {
      const u0 = (k * l) / n,
        u1 = ((k + 1) * l) / n - 1;
      if (o.roto && u0 / l > 0.32 && u0 / l < 0.7) continue;
      const col = o.roto ? (k % 2 ? T.vieja : ["#2E241A", "#4E3E2E", "#5E4A36"]) : k % 2 ? T.madera : ["#8A6A40", "#B08A58", "#C8A070"];
      S.poner((u0 + u1) / 2, 0, () => VOL.caja(c, pr, u0, -an, -4, u1, an, 0, col));
    }
    [1, -1].forEach((lado) => {
      const w = lado * an;
      S.poner(l / 2, w, () => {
        if (o.roto) {
          VOL.palo(c, pr, 0, w, 20, l * 0.3, w, 6, 2, "#8A7A5A");
          VOL.palo(c, pr, l, w, 20, l * 0.72, w, -4, 2, "#8A7A5A");
        } else VOL.palo(c, pr, 0, w, 20, l, w, 20, 2.5, "#C8B48C");
      }, 20);
      [0, l].forEach((u) => S.poner(u, w, () => VOL.cubo(c, pr, u, w, 8, 8, 30, T.oscura, null, -4)));
    });
    S.dibujar();
  }
  // el Núcleo de la Linde: el cristal de seis caras sobre su engarce de madera
  function nucleoP(c, pr, t, luz) {
    const fl = Math.sin(t * 3) * 2;
    VOL.halo(c, pr, 0, 0, 14 + fl, 36, RUNICO, luz);
    VOL.caja(c, pr, -12, -8, 0, 12, 8, 6, T.madera);
    VOL.cilindro(c, pr, 0, 0, 8, 7 + fl, 18 + fl, ["#2E7880", "#4FA8B0", RUNICO_CLARO], { n: 6, sinTapa: true });
    VOL.piramide(c, pr, VOL.redonda(0, 0, 8, 6), 18 + fl, 0, 0, 30 + fl, ["#2E7880", "#4FA8B0", RUNICO_CLARO]);
  }
  function nucleoV(c, x, y, t, o) {
    nucleoP(c, VOL.pr(x, y, o), t, o.luz === undefined ? 0.8 : o.luz);
  }
  // el pedestal del Paso: la base, el fuste con su runa adelante, el capitel y el encastre (o el Núcleo puesto)
  function pedestalPasoV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      luz = o.luz || 0;
    if (luz > 0) VOL.halo(c, pr, 0, 0, 50, 90, RUNICO, luz * (0.85 + Math.sin(t * 2.2) * 0.15));
    VOL.sombra(c, pr, 0, 0, 26, 18);
    VOL.caja(c, pr, -21, -16, 0, 21, 16, 10, ["#3E4046", "#4E5056", "#5E6066"]);
    const runa = (cc, l, h) => alfa(cc, 0.3 + luz * 0.7, () => trazos(cc, [[l / 2 - 4, -10, l / 2 - 4, -32], [l / 2 - 4, -24, l / 2 + 4, -30]], luz > 0.2 ? RUNICO : "#3A3C40", 2));
    VOL.caja(c, pr, -13, -10, 10, 13, 10, 50, ["#4A4C52", "#5C5E64", "#6E7076"], { frente: runa, atras: runa });
    VOL.caja(c, pr, -17, -13, 50, 17, 13, 58, ["#5A5C62", "#74767C", "#86888E"]);
    if (o.nucleo) nucleoP(c, VOL.sub(pr, 0, 0, 58, 0, 0.8), t, Math.max(0.4, luz));
    else VOL.elipse(c, pr, 0, 0, 58.5, 8, 6, "#2E3034");
  }
  // el tablón marcado: un tablón astillado con los tres tajos de las astas
  function tablonMarcadoV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 0, 0, 36, 10);
    VOL.caja(c, pr, -36, -7, 0, 36, 7, 6, T.vieja, {
      arriba: (cc, l, h) => {
        R(cc, 0, -h, l, h, C.madera);
        for (let k = 0; k < 3; k++) L(cc, l / 2 - 8 + k * 7, -h + 2, l / 2 - 2 + k * 7, -2, "#2A1E14", 2.5);
      },
    });
    VOL.piramide(c, pr, [[36, -7], [36, 7], [36, 0]], 0, 46, 0, 8, T.madera);
  }
  // la raíz marcada: el tocón viejo, dos raíces gruesas y la atadura violeta que muerde una
  function raizMarcadaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 0, 0, 30, 18);
    const raiz = (dir, col) => {
      const tu = dir * 52,
        tw = dir * 10;
      VOL.cara(c, pr, VOL.afuera([[dir * 14, -8, 0], [tu, tw, 0], [dir * 14, 0, 18]], [0, -1, 0.3]), col);
      VOL.cara(c, pr, VOL.afuera([[tu, tw, 0], [dir * 14, 8, 0], [dir * 14, 0, 18]], [0, 1, 0.3]), col);
    };
    raiz(1, T.tronco);
    raiz(-1, [C.troncoSombra, C.tronco, C.corteza]);
    VOL.cilindro(c, pr, 0, 0, 20, 0, 25, T.tronco, { n: 9 });
    VOL.elipse(c, pr, 0, 0, 25.5, 18, 15, C.maderaLuz);
    VOL.elipse(c, pr, 0, 0, 26, 10, 8, C.madera);
    VOL.palo(c, pr, 32, -4, 9, 32, 6, 9, 3, VIOLETA);
    VOL.palo(c, pr, 39, -3, 7, 39, 7, 7, 3, VIOLETA);
  }
  // el menhir del rastro: la piedra rajada con pelo blanco del ciervo enganchado al costado
  function menhirRastroV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 0, 0, 22, 13);
    menhir(c, pr, 14, 10, 72, PIEDRA_R, (cc, l, h) => trazos(cc, [[l / 2 - 2, -h + 2, l / 2 + 2, -h * 0.55, l / 2 - 4, -h * 0.3]], "#2E3034", 2.5));
    VOL.palo(c, pr, 13, 0, 38, 20, 3, 42, 1.5, "#E8E4DC");
    VOL.palo(c, pr, 13, 0, 36, 18, 4, 30, 1.5, "#E8E4DC");
  }
  // el aserradero de Orm: el galpón de troncos con la sierra adentro, el techo, la rueda de agua que gira de canto
  // al galpón y las pilas de tablones
  function aserraderoV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      w = 104,
      h = 70,
      a0 = t * 0.6;
    VOL.sombra(c, pr, 20, 0, 170, 60, 0.34);
    const S = VOL.escena(pr);
    const tablas = (puerta) => (cc, l, hh) => {
      R(cc, 0, -hh, l, hh, C.madera);
      for (let k = 0; k < 7; k++) R(cc, 0, -hh + k * 10, l, 2, C.maderaSombra);
      if (puerta) {
        R(cc, l / 2 - 30, -50, 60, 50, "#2A2016");
        E(cc, l / 2, -22, 16, 16, "#8A8E92");
        E(cc, l / 2, -22, 4, 4, C.hierro);
      }
    };
    S.poner(0, 0, () => {
      VOL.caja(c, pr, -w, -40, 0, w, 40, h, T.madera, { frente: tablas(true), atras: tablas(false), izq: tablas(false), der: tablas(false), sinTapa: true });
      VOL.techo(c, pr, -w - 16, -52, w + 16, 52, h, 56, T.vieja, { hastial: C.madera });
    });
    S.poner(132, 0, () => {
      const rueda = (cc, l, hh) => {
        const cx = l / 2,
          cy = -hh / 2;
        E(cc, cx, cy, 52, 52, C.maderaSombra);
        E(cc, cx, cy, 44, 44, "#2E2418");
        for (let k = 0; k < 10; k++) {
          const a = a0 + (k * TAU) / 10;
          L(cc, cx, cy, cx + Math.cos(a) * 46, cy + Math.sin(a) * 46, C.madera, 4);
          P(cc, [cx + Math.cos(a) * 40, cy + Math.sin(a) * 40, cx + Math.cos(a) * 54, cy + Math.sin(a) * 54, cx + Math.cos(a + 0.18) * 54, cy + Math.sin(a + 0.18) * 54], C.maderaLuz);
        }
        E(cc, cx, cy, 8, 8, C.hierro);
      };
      VOL.rollo(c, VOL.sub(pr, 132, 0, 0), -6, 6, 0, 52, 52, T.oscura, { n: 14 });
      VOL.plano(c, pr, 132 - 54, 132 + 54, 7, -2, 106, null, rueda, rueda);
    });
    S.poner(-w - 55, 0, () => {
      for (let k = 0; k < 4; k++) VOL.caja(c, pr, -w - 90, -14, k * 8, -w - 20, 14, k * 8 + 6, k % 2 ? T.madera : ["#8A6A40", "#B08A58", "#C8A070"]);
    });
    S.dibujar();
  }
  // el Santuario de las Raíces: el montículo de tierra con musgo, el arco de piedra con el sello de Othala, las
  // raíces que lo abrazan y las zarzas que cierran la entrada
  function santuarioV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      luz = o.visto ? 0.9 + Math.sin(t * 1.6) * 0.1 : 0.15;
    VOL.sombra(c, pr, 10, -40, 160, 90, 0.38);
    VOL.cono(c, pr, 0, -60, 160, 70, 0, 172, ["#2E261A", "#3A3022", "#4A3E2C"], { n: 9, tapa: C.musgo });
    const arco = (sello) => (cc, l, h) => {
      const m = l / 2;
      P(cc, [m - 64, 0, m - 62, -h * 0.78, m - 34, -h, m + 34, -h, m + 62, -h * 0.78, m + 64, 0], "#5C5A56");
      P(cc, [m - 46, 0, m - 44, -h * 0.72, m - 24, -h * 0.875, m + 24, -h * 0.875, m + 44, -h * 0.72, m + 46, 0], "#1A1612");
      if (!sello) return;
      cc.strokeStyle = o.visto ? RUNICO_CLARO : "#4A4640";
      cc.lineWidth = 3;
      cc.beginPath();
      cc.arc(m, -64, 26, 0, TAU);
      cc.stroke();
      trazos(cc, [[m - 14, -44, m + 8, -66, m, -82, m - 8, -66, m + 14, -44]], o.visto ? RUNICO_CLARO : "#4A4640", 3);
    };
    VOL.caja(c, pr, -64, 0, 0, 64, 18, 128, ["#46443F", "#5C5A56", "#6E6C66"], { frente: arco(true), atras: arco(false), col_frente: null, col_atras: null, sinTapa: true });
    VOL.halo(c, pr, 0, 18, 64, 80, RUNICO, luz);
    [[-150, -10, -60, -40], [150, -14, 60, 36], [-100, 10, -50, -30], [110, 10, 54, 28]].forEach(([au, aw, bu, cu]) => {
      VOL.palo(c, pr, au, aw, 0, bu, 8, 90, 14, C.tronco);
      VOL.palo(c, pr, bu, 8, 90, cu, 10, 128, 12, C.tronco);
    });
    const q = pr(0, 26, 0);
    zarzas(c, q[0], q[1], t, { s: pr.s, ancho: 50 });
  }

  const LISTA = {
    pino: { f: pino, figura: true, alto: 150, choque: { r: 14 }, grupo: "naturaleza" },
    juncos: { f: juncos, figura: true, alto: 70, choque: null, grupo: "naturaleza" },
    enebro: { f: enebro, figura: true, alto: 40, choque: { r: 16 }, grupo: "naturaleza" },
    brezo: { f: brezo, alto: 10, choque: null, grupo: "naturaleza", piso: true },
    posteCruce: { f: posteCruce, fv: posteCruceV, vol: true, alto: 115, choque: { r: 10 }, grupo: "caminos" },
    roble: { f: roble, figura: true, alto: 170, choque: { r: 18 }, grupo: "naturaleza" },
    abetoAnciano: { f: abetoAnciano, figura: true, alto: 600, choque: { r: 22 }, grupo: "naturaleza" },
    robleAnciano: { f: robleAnciano, figura: true, alto: 380, choque: { r: 34 }, grupo: "naturaleza" },
    abedul: { f: abedul, figura: true, alto: 140, choque: { r: 8 }, grupo: "naturaleza" },
    helechos: { f: helechos, figura: true, alto: 26, choque: null, grupo: "naturaleza" },
    alfombraMusgo: { f: alfombraMusgo, alto: 0, choque: null, grupo: "naturaleza", piso: true },
    barro: { f: barro, alto: 0, choque: null, grupo: "naturaleza", piso: true },
    hongosRocio: { f: hongosRocio, figura: true, alto: 20, choque: null, grupo: "naturaleza", luz: true },
    roca: { f: roca, figura: true, alto: 34, choque: { r: 26 }, grupo: "naturaleza" },
    troncoCaido: { f: troncoCaido, fv: troncoCaidoV, vol: true, alto: 30, choque: { w: 130, h: 20 }, grupo: "naturaleza" },
    pinoTalado: { f: pinoTalado, fv: pinoTaladoV, vol: true, alto: 40, choque: { r: 16 }, grupo: "naturaleza" },
    arbolQuebrado: { f: arbolQuebrado, fv: arbolQuebradoV, vol: true, alto: 60, choque: { r: 16 }, grupo: "naturaleza" },
    farol: { f: farol, fv: farolV, vol: true, alto: 90, choque: { r: 6 }, grupo: "caminos", luz: true },
    piedraLinde: { f: piedraLinde, fv: piedraLindeV, vol: true, alto: 62, choque: { r: 12 }, grupo: "caminos", luz: true },
    puestoEydis: { f: puestoEydis, fv: puestoEydisV, vol: true, alto: 220, choque: { w: 210, h: 40 }, grupo: "puesto" },
    tableroRutas: { f: tableroRutas, fv: tableroRutasV, vol: true, alto: 60, choque: { w: 60, h: 10 }, grupo: "puesto" },
    empalizada: { f: empalizada, fv: empalizadaV, vol: true, alto: 70, choque: null, grupo: "puesto" },
    carroVolcado: { f: carroVolcado, fv: carroVolcadoV, vol: true, alto: 90, choque: { w: 140, h: 28 }, grupo: "refugio" },
    menhirRefugio: { f: menhirRefugio, fv: menhirRefugioV, vol: true, alto: 54, choque: { r: 11 }, grupo: "refugio" },
    runaRefugio: { f: runaRefugio, fv: runaRefugioV, vol: true, alto: 80, choque: { r: 24 }, grupo: "refugio", luz: true },
    piedraCaida: { f: piedraCaida, figura: true, alto: 20, choque: null, grupo: "refugio" },
    cobertizoRefugio: { f: cobertizoRefugio, fv: cobertizoRefugioV, vol: true, alto: 82, choque: { w: 130, h: 16 }, grupo: "refugio" },
    casaEikholt: { f: casaEikholt, fv: casaEikholtV, vol: true, alto: 150, choque: { w: 180, h: 40 }, grupo: "eikholt" },
    casaLindes: { f: casaLindes, fv: casaLindesV, vol: true, alto: 170, choque: { w: 270, h: 40 }, grupo: "eikholt" },
    mesaSvanhild: { f: mesaSvanhild, fv: mesaSvanhildV, vol: true, alto: 62, choque: { w: 100, h: 12 }, grupo: "eikholt" },
    losaPatio: { f: losaPatio, fv: losaPatioV, vol: true, alto: 20, choque: null, grupo: "eikholt", luz: true },
    robleEikholt: { f: robleEikholt, figura: true, alto: 320, choque: { r: 34 }, grupo: "eikholt" },
    pozoEikholt: { f: pozoEikholt, fv: pozoEikholtV, vol: true, alto: 100, choque: { r: 30 }, grupo: "eikholt" },
    puestoMercado: { f: puestoMercado, fv: puestoMercadoV, vol: true, alto: 72, choque: { w: 96, h: 12 }, grupo: "eikholt" },
    puentePaso: { f: puentePaso, fv: puentePasoV, vol: true, alto: 30, choque: null, grupo: "paso" },
    pedestalPaso: { f: pedestalPaso, fv: pedestalPasoV, vol: true, alto: 90, choque: { r: 18 }, grupo: "paso", luz: true },
    nucleo: { f: nucleo, fv: nucleoV, vol: true, alto: 34, choque: null, grupo: "paso", luz: true },
    tablonMarcado: { f: tablonMarcado, fv: tablonMarcadoV, vol: true, alto: 16, choque: null, grupo: "paso" },
    tocon: { f: tocon, figura: true, alto: 20, choque: { r: 16 }, grupo: "paso" },
    raizMarcada: { f: raizMarcada, fv: raizMarcadaV, vol: true, alto: 28, choque: { r: 20 }, grupo: "paso" },
    menhirRastro: { f: menhirRastro, fv: menhirRastroV, vol: true, alto: 74, choque: { r: 13 }, grupo: "paso" },
    soporteAtadura: { f: soporteAtadura, alto: 76, choque: { r: 18 }, grupo: "claro", luz: true },
    aserradero: { f: aserradero, fv: aserraderoV, vol: true, alto: 190, choque: { w: 230, h: 40 }, grupo: "este" },
    puenteTablas: { f: puenteTablas, fv: puentePasoV, vol: true, alto: 30, choque: null, grupo: "este" },
    santuario: { f: santuario, fv: santuarioV, vol: true, alto: 180, choque: { w: 300, h: 40 }, grupo: "este", luz: true },
    zarzas: { f: zarzas, figura: true, alto: 80, choque: null, grupo: "este" },
  };
  // o.esc (tamaño), o.ex / o.ey (ancho y alto), o.esp (espejado), o.rot (inclinado, en grados, sobre el pie) y o.giro (girado sobre el piso, en grados) valen para cualquier asset: los pone el editor
  // Lo que tiene `vol: true` está armado con caras (comun/volumen.js) y se gira de verdad: recibe o.fi (su giro más
  // el de la cámara, VOL.cam.g) y el tamaño y el espejado le llegan como medidas del mundo, no de la pantalla.
  // Si además tiene `fv`, `f` es su dibujo de siempre (de frente, en tres cuartos) y `fv` su volumen: de frente y sin
  // girar se ve el de siempre y apenas se gira (él o la cámara), el volumen.
  const derecho = (fi) => Math.abs(Math.atan2(Math.sin(fi), Math.cos(fi))) < 0.01;
  function dibujar(c, id, x, y, t, o = {}) {
    const a = LISTA[id];
    if (!a) return;
    if (a.vol && window.VOL) {
      const fi = VOL.fiDe(o);
      if (!a.fv) return dibujarVol(c, a.f, x, y, t, o, fi);
      if (!derecho(fi)) return dibujarVol(c, a.fv, x, y, t, o, fi);
    }
    const k = o.esc || 1,
      ex = (o.ex || 1) * k * (o.esp ? -1 : 1),
      ey = (o.ey || 1) * k;
    if (ex === 1 && ey === 1 && !o.rot && !o.giroCam && (!o.giro || a.caras || a.figura)) return a.f(c, x, y, t, o);
    c.save();
    c.translate(x, y);
    // o.giroCam: la cámara del editor girada (en radianes). Su frente se acuesta en el piso con el mismo giro exacto
    // que el piso, así los pedazos de una empalizada o de una muralla siguen formando una línea recta.
    if (o.giroCam) c.transform(Math.cos(o.giroCam), Math.sin(o.giroCam), 0, 1, 0, 0);
    if (o.rot) c.rotate((o.rot * Math.PI) / 180);
    // o.giro: girado sobre el piso (de frente, en diagonal, de costado o de espaldas): se angosta y el lado de atrás
    // sube un poco, como visto desde arriba
    // lo que tiene todas sus caras (a.caras) se gira solo, como volumen
    if (o.giro && !a.caras && !a.figura) {
      const g = (o.giro * Math.PI) / 180,
        co = Math.cos(g);
      c.transform(Math.sign(co || 1) * Math.max(0.18, Math.abs(co)), Math.sin(g) * 0.45, 0, 1, 0, 0);
    }
    c.scale(ex, ey);
    c.translate(-x, -y);
    a.f(c, x, y, t, o);
    c.restore();
  }
  function dibujarVol(c, f, x, y, t, o, fi) {
    const k = o.esc || 1,
      // o.s es el tamaño propio del asset; el del editor se suma acá. eu: a lo ancho, ez: el alto
      v = Object.assign({}, o, { fi, s: (o.s || 1) * k, eu: (o.ex || 1) * (o.eu || 1), ez: (o.ey || 1) * (o.ez || 1), esc: 1, ex: 1, ey: 1 });
    if (!o.rot) return f(c, x, y, t, v);
    c.save();
    c.translate(x, y);
    c.rotate((o.rot * Math.PI) / 180);
    c.translate(-x, -y);
    f(c, x, y, t, v);
    c.restore();
  }
  // el choque y el alto de un asset con sus opciones (o.s de cada asset y el tamaño y las proporciones del editor)
  function medidas(id, o = {}) {
    const a = LISTA[id];
    if (!a) return { choque: null, alto: 40 };
    const k = (o.s || 1) * (o.esc || 1),
      ex = o.ex || 1,
      ey = o.ey || 1;
    let ch = a.choque ? (a.choque.r ? { r: a.choque.r * k * Math.max(ex, ey) } : { w: a.choque.w * k * ex, h: a.choque.h * k * ey }) : null;
    if (ch && ch.w && o.giro && a.vol && window.VOL) {
      // girado de verdad: la caja que lo encierra en el piso (el fondo del choque está aplanado por K)
      const g = (o.giro * Math.PI) / 180,
        co = Math.abs(Math.cos(g)),
        si = Math.abs(Math.sin(g)),
        hk = ch.h / VOL.K;
      ch = { w: ch.w * co + hk * si, h: (ch.w * si + hk * co) * VOL.K };
    } else if (ch && ch.w && o.giro) {
      // girado sobre el piso: de costado ocupa menos de ancho y más de fondo
      const g = (o.giro * Math.PI) / 180,
        co = Math.abs(Math.cos(g)),
        si = Math.abs(Math.sin(g));
      ch = { w: Math.max(ch.w * co + ch.h * si, ch.h), h: ch.h + ch.w * si * 0.45 };
    }
    return { choque: o.sinChoque ? null : ch, alto: a.alto * k * ey };
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
  return { LISTA, C, dibujar, medidas, catalogo, EJEMPLO, calcoV, cartaV };
})();
