// ---------- el Bosque de Eldervald (módulo ELDERVALD) ----------
// La misma geografía que la aventura de Godot (mapa v2 de Eldervald, 1557 × 1010 px), pero el doble de grande:
// cada píxel del mapa son 20 unidades del mundo (Eromash mide 77). Cruzar el bosque caminando lleva varios minutos.
// Eikholt es la capital amurallada del compendio (docs del 23/10/2026 en la aventura de Godot). El norte es arriba.
// Arma todo lo fijo del mundo: lugares, caminos, ríos, la quebrada, los puentes, el bosque y los objetos de cada
// lugar; y responde dónde se puede caminar. El piso se pinta por trozos (chunks) y se guarda ya dibujado.
window.ELDERVALD = (function () {
  "use strict";
  const { P, E, R, L, alfa, poli, azar, TAU } = DIB;
  const C = ASSETS.C;

  const U = 20; // unidades por píxel del mapa
  const M = U / 0.33; // unidades por metro del mapa (los desplazamientos de Godot, medidos en metros)
  const ANCHO = 1557 * U,
    ALTO = 1010 * U,
    BORDE = 26 * M; // montañas del borde: no se puede salir
  const m = (px, py) => [px * U, py * U];
  const mas = (p, dx, dy) => [p[0] + dx * M, p[1] + dy * M];
  const lista = (pts) => pts.map(([a, b]) => m(a, b));

  // ---------- geografía (Datos.gd) ----------
  const LUGARES = {
    entrada_sur: { p: m(120, 925), r: 10 },
    puesto: { p: m(350, 795), r: 14 },
    carro: { p: m(612, 400), r: 7 },
    refugio: { p: m(470, 318), r: 14 },
    casa_lindes: { p: m(702, 548), r: 9 },
    eikholt: { p: m(810, 565), r: 46 },
    paso_sur: { p: m(532, 222), r: 12 },
    paso: { p: m(515, 172), r: 6 },
    paso_norte: { p: m(500, 120), r: 8 },
    tala: { p: m(410, 238), r: 11 },
    quebrada_rastreo: { p: m(318, 210), r: 8 },
    claro_entrada: { p: m(262, 205), r: 7 },
    claro: { p: m(175, 175), r: 30 },
    aserradero: { p: m(1085, 330), r: 16 },
    santuario: { p: m(1415, 215), r: 16 },
    brunvik: { p: m(1240, 590), r: 14 },
    skarnholt: { p: m(200, 440), r: 14 },
    tumulo: { p: m(260, 690), r: 10 },
    caravana: { p: m(740, 830), r: 10 },
    torre: { p: m(1420, 760), r: 9 },
  };
  for (const k in LUGARES) LUGARES[k].r *= M;

  // los caminos llegan a las tres puertas de Eikholt: sur (Hrafngard), oeste (el Paso) y este (aserradero, Brunvik)
  const CAMINOS = [
    { p: lista([[95, 960], [200, 880], [350, 795], [470, 745], [560, 700], [680, 690], [810, 672], [810, 600]]), w: 4 * 34 },
    { p: lista([[760, 562], [672, 563], [655, 480], [612, 400], [575, 300], [540, 230], [515, 172], [500, 110], [490, 30]]), w: 3.6 * 34 },
    { p: lista([[590, 345], [530, 330], [470, 318]]), w: 2.8 * 34 },
    { p: lista([[540, 232], [470, 240], [410, 238], [360, 222], [318, 210], [262, 205], [205, 190]]), w: 2.4 * 34 },
    { p: lista([[860, 560], [945, 556], [958, 520], [960, 488], [1010, 420], [1060, 360], [1085, 330], [1150, 345], [1205, 345], [1265, 300], [1330, 250], [1415, 215]]), w: 3.4 * 34 },
    { p: lista([[945, 572], [970, 585], [1080, 600], [1240, 590]]), w: 3 * 34 },
    { p: lista([[668, 590], [702, 556]]), w: 2.2 * 34 },
  ];
  // la muralla de Eikholt: una elipse de troncos con tres puertas
  const CIUDAD = { c: m(810, 565), rx: 130 * U, ry: 95 * U, puertas: [Math.PI / 2, Math.PI, 0], hueco: 150 };
  // lagunas del mapa
  const LAGOS = [
    { p: m(48, 600), rx: 30 * U, ry: 18 * U },
    { p: m(292, 597), rx: 26 * U, ry: 16 * U },
    { p: m(680, 735), rx: 20 * U, ry: 18 * U },
  ];
  const RIOS = [
    { p: lista([[1100, -20], [1150, 120], [1190, 250], [1205, 345], [1185, 430], [1150, 520], [1130, 600], [1110, 700], [1150, 800], [1230, 900], [1280, 1040]]), w: 9 * M },
    { p: lista([[850, 425], [900, 445], [960, 488], [1030, 522], [1090, 560], [1140, 590]]), w: 6 * M },
  ];
  const QUEBRADA = { p: lista([[-40, 70], [150, 70], [300, 92], [420, 130], [515, 160], [600, 188], [700, 168], [850, 140], [1000, 118], [1152, 120]]), w: 40 * U };
  const PUENTES = [
    { id: "paso", a: m(515, 190), b: m(510, 132), ancho: 3.2 * M },
    { id: "central", a: m(942, 503), b: m(979, 473), ancho: 3.2 * M },
    { id: "oriental", a: m(1176, 351), b: m(1236, 337), ancho: 3.2 * M },
  ];

  // ---------- utilidades de geometría ----------
  function distSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax,
      dy = by - ay,
      l2 = dx * dx + dy * dy;
    let u = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
    u = Math.max(0, Math.min(1, u));
    return Math.hypot(px - ax - dx * u, py - ay - dy * u);
  }
  function distLinea(px, py, pts) {
    let d = Infinity;
    for (let i = 1; i < pts.length; i++) d = Math.min(d, distSeg(px, py, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]));
    return d;
  }

  // ---------- dónde se puede caminar: una grilla de 20 unidades ----------
  // 0 libre · 1 agua · 2 quebrada · 3 borde del mundo
  const CELDA = 20,
    GW = Math.ceil(ANCHO / CELDA),
    GH = Math.ceil(ALTO / CELDA),
    suelo = new Uint8Array(GW * GH);
  function pintarLinea(pts, w, val) {
    const r = w / 2;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1],
        [bx, by] = pts[i];
      const x0 = Math.max(0, Math.floor((Math.min(ax, bx) - r) / CELDA)),
        x1 = Math.min(GW - 1, Math.ceil((Math.max(ax, bx) + r) / CELDA)),
        y0 = Math.max(0, Math.floor((Math.min(ay, by) - r) / CELDA)),
        y1 = Math.min(GH - 1, Math.ceil((Math.max(ay, by) + r) / CELDA));
      for (let gy = y0; gy <= y1; gy++)
        for (let gx = x0; gx <= x1; gx++)
          if (distSeg((gx + 0.5) * CELDA, (gy + 0.5) * CELDA, ax, ay, bx, by) <= r) suelo[gy * GW + gx] = Math.max(suelo[gy * GW + gx], val);
    }
  }
  RIOS.forEach((r) => pintarLinea(r.p, r.w, 1));
  pintarLinea(QUEBRADA.p, QUEBRADA.w, 2);
  LAGOS.forEach((l) => {
    for (let gy = Math.floor((l.p[1] - l.ry) / CELDA); gy <= (l.p[1] + l.ry) / CELDA; gy++)
      for (let gx = Math.floor((l.p[0] - l.rx) / CELDA); gx <= (l.p[0] + l.rx) / CELDA; gx++) {
        const dx = ((gx + 0.5) * CELDA - l.p[0]) / l.rx,
          dy = ((gy + 0.5) * CELDA - l.p[1]) / l.ry;
        if (dx * dx + dy * dy < 1 && gx >= 0 && gy >= 0 && gx < GW && gy < GH) suelo[gy * GW + gx] = 1;
      }
  });
  // la muralla: un anillo cerrado salvo en las puertas
  const enPuerta = (a) => CIUDAD.puertas.some((pa) => Math.abs(Math.atan2(Math.sin(a - pa), Math.cos(a - pa))) < CIUDAD.hueco / CIUDAD.rx);
  const MURO = [];
  {
    const n = 88;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * TAU,
        a1 = ((i + 1) / n) * TAU,
        am = (a0 + a1) / 2;
      if (enPuerta(am)) continue;
      const p0 = [CIUDAD.c[0] + Math.cos(a0) * CIUDAD.rx, CIUDAD.c[1] + Math.sin(a0) * CIUDAD.ry],
        p1 = [CIUDAD.c[0] + Math.cos(a1) * CIUDAD.rx, CIUDAD.c[1] + Math.sin(a1) * CIUDAD.ry];
      MURO.push([p0, p1, am, i]);
      pintarLinea([p0, p1], 36, 3);
    }
  }
  for (let gy = 0; gy < GH; gy++)
    for (let gx = 0; gx < GW; gx++) {
      const x = (gx + 0.5) * CELDA,
        y = (gy + 0.5) * CELDA;
      if (x < BORDE || y < BORDE * 0.5 || x > ANCHO - BORDE || y > ALTO - BORDE) suelo[gy * GW + gx] = 3;
    }

  // un puente está "sano" salvo el del Paso hasta que se repara (lo decide el juego con puenteSano)
  let puenteSano = { paso: false, central: true, oriental: true };
  function enPuente(x, y) {
    for (const p of PUENTES) {
      const d = distSeg(x, y, p.a[0], p.a[1], p.b[0], p.b[1]);
      if (d > p.ancho / 2) continue;
      if (puenteSano[p.id]) return true;
      // el del Paso roto: solo las puntas
      const dx = p.b[0] - p.a[0],
        dy = p.b[1] - p.a[1],
        u = ((x - p.a[0]) * dx + (y - p.a[1]) * dy) / (dx * dx + dy * dy);
      if (u < 0.3 || u > 0.72) return true;
    }
    return false;
  }

  // ---------- los objetos del mundo ----------
  // cada cosa: { id (asset), x, y, o (opciones), choque, nombre (para el juego) }
  const COSAS = [];
  const NOMBRADAS = {}; // las que el juego necesita encontrar (carro, piedra, mesa…)
  const PUNTOS = {}; // dónde se paran los NPC, dónde está cada objetivo
  function poner(id, p, o = {}, nombre) {
    const a = ASSETS.LISTA[id];
    const k = o.s || 1,
      ch = a && a.choque ? (a.choque.r ? { r: a.choque.r * k } : { w: a.choque.w * k, h: a.choque.h * k }) : null;
    const cosa = { id, x: p[0], y: p[1], o, choque: ch, alto: a ? a.alto * k : 40 };
    if (o.sinChoque) cosa.choque = null;
    COSAS.push(cosa);
    if (nombre) NOMBRADAS[nombre] = cosa;
    return cosa;
  }
  const punto = (k, p) => (PUNTOS[k] = p);

  // Puesto de Eydis
  (function () {
    const c = LUGARES.puesto.p;
    punto("puesto", mas(c, 4, 3));
    poner("puestoEydis", mas(c, -6, -6));
    poner("empalizada", mas(c, -22, -15), { n: 9, sem: 2 });
    poner("empalizada", mas(c, -26, 10), { n: 6, sem: 5 });
    poner("tableroRutas", mas(c, 2, -9));
    poner("cobertizoRefugio", mas(c, -12, 6));
    poner("farol", mas(c, 6, -2));
    poner("farol", mas(c, -2, 9));
    poner("piedraLinde", mas(c, 12, 6), { sem: 3 });
    punto("eydis_puesto", mas(c, 2, -4));
  })();
  // El carro volcado
  (function () {
    const c = LUGARES.carro.p;
    poner("carroVolcado", mas(c, 4, 0), {}, "carro");
    punto("carro", mas(c, 2, 1.2));
  })();
  // Refugio de las Lindes
  (function () {
    const c = LUGARES.refugio.p;
    punto("refugio", mas(c, 6, 6));
    for (let i = 0; i < 10; i++) {
      if (i === 1 || i === 2) continue; // la abertura hacia el camino
      const a = (i / 10) * TAU;
      poner("menhirRefugio", [c[0] + Math.cos(a) * 10 * M, c[1] + Math.sin(a) * 10 * M * 0.9], { sem: i, luz: 0 }, "menhir" + i);
    }
    poner("cobertizoRefugio", mas(c, -3, -5));
    poner("carroVolcado", mas(c, 6, -6), { s: 0.85 });
    poner("runaRefugio", mas(c, 2, 1), { puesta: false, luz: 0 }, "runa_refugio");
    poner("piedraCaida", mas(c, 4.2, 3), {}, "piedra_caida");
    poner("farol", mas(c, 9, 9));
    punto("runa_refugio", mas(c, 2, 1.6));
    punto("piedra_caida", mas(c, 4.2, 3.4));
    punto("errantes", mas(c, 18, 10));
    punto("eydis_refugio", mas(c, -2, 6));
    punto("eydis_refugio_salida", mas(c, 12, 8));
    punto("orm_refugio", mas(c, -1, -1));
    punto("trab_refugio", mas(c, -5, 0));
  })();
  // Eikholt, la capital: muralla de troncos con torres y piedras rúnicas, el Roble en el centro con el Mercado de
  // los Toldos, el Círculo del Ting al norte del tronco, los oficios al oeste y sudoeste, la Casa de Sanación al
  // noroeste, la Casa de las Lindes en el borde oeste, el Hongo Dorado al sudeste de la plaza y las huertas al este.
  (function () {
    const c = CIUDAD.c,
      px = (dx, dy) => [c[0] + dx * U, c[1] + dy * U];
    // la muralla, las torres y las piedras rúnicas
    MURO.forEach(([p0, p1, am, i]) => {
      poner("muralla", p0, { x2: p1[0], y2: p1[1], sem: i, sinChoque: true });
      if (i % 9 === 4) poner("torreVigia", [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + 6], { sem: i });
      if (i % 11 === 7) poner("piedraMuralla", [(p0[0] + p1[0]) / 2 + Math.cos(am) * 90, (p0[1] + p1[1]) / 2 + Math.sin(am) * 70], { sem: i });
    });
    // torres a los lados de las puertas oeste y este
    [Math.PI, 0].forEach((pa) => {
      [-1, 1].forEach((lado) => {
        const a = pa + (lado * (CIUDAD.hueco + 40)) / CIUDAD.rx;
        poner("torreVigia", [c[0] + Math.cos(a) * CIUDAD.rx, c[1] + Math.sin(a) * CIUDAD.ry + 6], { sem: lado + 3 });
      });
    });
    const sur = [c[0], c[1] + CIUDAD.ry];
    poner("puertaSur", sur, {}, "puerta_sur");
    poner("granTablero", [sur[0] + 230, sur[1] - 120], {}, "gran_tablero");
    // el Roble y su plaza
    poner("robleEikholt", px(0, 0), { s: 3.4 }, "roble");
    poner("tingCirculo", px(0, -42), {}, "ting");
    [[-26, 22, 0], [-10, 30, 1], [8, 31, 2], [24, 24, 3], [34, 10, 4], [-34, 8, 5]].forEach(([dx, dy, v]) => poner("toldo", px(dx, dy), { v }));
    poner("pozoEikholt", px(18, 48));
    // Barrio de los Oficios (oeste y sudoeste)
    poner("herreriaAsa", px(-70, 18), {}, "herreria");
    poner("cordeleriaFolke", px(-52, 46), {}, "cordeleria");
    poner("casaEikholt", px(-86, 40), { v: 2 });
    poner("casaEikholt", px(-62, -12), { v: 1 });
    // Casa de Sanación (noroeste)
    poner("casaSanacion", px(-48, -50), {}, "sanacion");
    // Hongo Dorado (sudeste de la plaza)
    poner("hongoDorado", px(48, 42), {}, "hongo_dorado");
    // casas del norte y del este
    [[-18, -72, 0], [16, -76, 1], [46, -62, 2], [70, -38, 0], [-80, -40, 2], [60, 70, 1], [-30, 74, 0], [30, 76, 2]].forEach(([dx, dy, v]) => poner("casaEikholt", px(dx, dy), { v }));
    // el resto de la ciudad: casas apretadas entre las calles, como en la vista de la capital
    {
      const r = azar(4471),
        hechas = COSAS.filter((o) => Math.abs(o.x - c[0]) < CIUDAD.rx && Math.abs(o.y - c[1]) < CIUDAD.ry && o.choque);
      for (let k = 0; k < 400 && hechas.length < 90; k++) {
        const a = r() * TAU,
          d = 0.42 + r() * 0.46,
          x = c[0] + Math.cos(a) * CIUDAD.rx * d,
          y = c[1] + Math.sin(a) * CIUDAD.ry * d;
        if (Math.abs(x - c[0]) < 200 || Math.abs(y - c[1]) < 170) continue; // las calles a las puertas
        if (x > c[0] + 1500 && Math.abs(y - c[1]) < 900) continue; // las huertas
        if (hechas.some((o) => Math.abs(o.x - x) < 300 && Math.abs(o.y - y) < 190)) continue;
        hechas.push(poner("casaEikholt", [x, y], { v: Math.floor(r() * 3), techo: Math.floor(r() * 3), sem: k, s: 0.9 + r() * 0.2 }));
      }
    }
    // huertas del este
    poner("huerta", px(88, 6), { sem: 1 });
    poner("huerta", px(92, 34), { sem: 2 });
    // faroles de las calles
    [[-14, 52], [14, 52], [-40, -20], [40, -20], [-12, 84], [-100, 10], [100, -10]].forEach(([dx, dy]) => poner("farol", px(dx, dy)));
    punto("eikholt", px(0, 80));
    punto("eydis_eikholt", px(-14, 40));
    punto("orm_eikholt", px(12, 44));
    punto("trab_eikholt", px(26, 50));
    punto("plaza", px(0, 34));
  })();
  // Casa de las Lindes (Svanhild), en el borde oeste de Eikholt
  (function () {
    const c = LUGARES.casa_lindes.p;
    poner("casaLindes", mas(c, 0, -6));
    const patio = mas(c, 7, 4);
    poner("losaPatio", patio, { luz: 0 }, "losa");
    const mesa = mas(c, -1, 4);
    poner("mesaSvanhild", mesa, { fragmento: false }, "mesa");
    punto("losa", patio);
    punto("mesa", [mesa[0], mesa[1] + 14]);
    punto("svanhild_casa", mas(mesa, 2.2, -1));
    punto("svanhild_patio", mas(patio, -2, -1.6));
  })();
  // El Paso del Guardián
  (function () {
    const P = PUENTES[0];
    poner("puentePaso", P.a, { x2: P.b[0], y2: P.b[1], roto: true, sinChoque: true, piso: true }, "puente_paso");
    const sur = LUGARES.paso_sur.p;
    punto("paso_sur", mas(sur, 0, 6));
    punto("eydis_paso", mas(sur, -2, -2));
    punto("orm_paso", mas(sur, 3, 0));
    punto("trab_paso", mas(sur, 5, 5));
    punto("orm_puente", mas(P.a, 3, 3));
    punto("puente", [(P.a[0] + P.b[0]) / 2, (P.a[1] + P.b[1]) / 2]);
    punto("paso_norte", m(500, 110));
    const ped = mas(P.a, -4.5, 4);
    poner("pedestalPaso", ped, { nucleo: false, luz: 0 }, "pedestal");
    punto("pedestal", [ped[0], ped[1] + 18]);
    poner("tablonMarcado", mas(P.a, 3, 7), { sinChoque: true, piso: true }, "tablon");
    punto("tablon", mas(P.a, 3, 7));
    poner("piedraLinde", mas(sur, -6, 4), { sem: 11 });
  })();
  // La tala y la quebrada del rastreo
  (function () {
    const c = LUGARES.tala.p;
    for (let i = 0; i < 7; i++) {
      const r = (4 + (i % 3) * 2.5) * M,
        a = i * 1.7;
      poner("tocon", [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r], { sem: i });
    }
    poner("troncoCaido", mas(c, -3, 6));
    poner("raizMarcada", mas(c, 2.5, -4), {}, "raiz");
    punto("raiz", mas(c, 2.5, -3));
    const q = LUGARES.quebrada_rastreo.p;
    poner("menhirRastro", mas(q, 1, -4), {}, "menhir");
    punto("menhir", mas(q, 1, -3));
    punto("custodio", m(365, 222));
    punto("claro_entrada", LUGARES.claro_entrada.p);
    punto("eydis_claro", mas(LUGARES.claro_entrada.p, 3, 3));
  })();
  // El Claro del Ciervo
  (function () {
    const c = LUGARES.claro.p;
    punto("claro", c);
    punto("ciervo", c);
    punto("eydis_ciervo", mas(c, 7, 5));
    punto("nucleo", mas(c, 3, 2));
    const sop = [];
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i * TAU) / 3 + 0.4;
      sop.push(poner("soporteAtadura", [c[0] + Math.cos(a) * 15 * M, c[1] + Math.sin(a) * 15 * M * 0.85], { sem: i, hacia: c, visto: false, roto: false }, "soporte" + i));
    }
    NOMBRADAS.soportes = sop;
    // el anillo de árboles viejos que cierra el claro (con la entrada al este)
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * TAU;
      if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a)) - 0.25) < 0.42) continue;
      poner(i % 3 ? "pino" : "roble", [c[0] + Math.cos(a) * 30 * M, c[1] + Math.sin(a) * 26 * M], { s: 1.5 + (i % 4) * 0.12, sem: i, pisos: 5 });
    }
  })();
  // El aserradero de Orm
  (function () {
    const c = LUGARES.aserradero.p;
    poner("aserradero", mas(c, 0, -3));
    poner("farol", mas(c, -6, 8));
    punto("aserradero", mas(c, -8, 10));
  })();
  // Puentes del este
  [PUENTES[1], PUENTES[2]].forEach((p) => poner("puenteTablas", p.a, { x2: p.b[0], y2: p.b[1], sinChoque: true, piso: true }));
  // Santuario de las Raíces
  (function () {
    const c = LUGARES.santuario.p;
    poner("santuario", c, { visto: false }, "santuario");
    poner("zarzas", mas(c, 0, 3), { sinChoque: false });
    punto("santuario", mas(c, -6, 9));
    punto("sello", mas(c, 0, 4));
  })();
  // faroles y piedras de linde de los caminos (las de orientación)
  [[560, 690], [668, 560], [655, 480], [575, 300], [900, 540], [1010, 420], [1265, 300], [200, 880]].forEach((p) => poner("farol", mas(m(p[0], p[1]), 3.2, 0)));
  [[470, 745], [612, 360], [540, 250], [470, 240], [955, 470], [1150, 350], [1330, 250], [830, 600], [300, 860]].forEach((p, i) => poner("piedraLinde", mas(m(p[0], p[1]), -3.5, 2.5), { sem: i * 5 }));

  // ---------- el bosque: generado, siempre igual (misma semilla) ----------
  const rnd = azar(20261024);
  function ruido(x, y) {
    // ruido de valores suave para la densidad del bosque
    const f = (a, b) => {
      const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
      return s - Math.floor(s);
    };
    const gx = x / 1800,
      gy = y / 1800,
      x0 = Math.floor(gx),
      y0 = Math.floor(gy),
      tx = gx - x0,
      ty = gy - y0,
      sx = tx * tx * (3 - 2 * tx),
      sy = ty * ty * (3 - 2 * ty);
    const a = f(x0, y0),
      b = f(x0 + 1, y0),
      c2 = f(x0, y0 + 1),
      d = f(x0 + 1, y0 + 1);
    return a + (b - a) * sx + (c2 - a) * sy + (a - b - c2 + d) * sx * sy;
  }
  function libreDeTodo(x, y, margen) {
    for (const c of CAMINOS) if (distLinea(x, y, c.p) < c.w / 2 + margen) return false;
    for (const k in LUGARES) {
      const L = LUGARES[k];
      if (Math.hypot(x - L.p[0], (y - L.p[1]) * 1.15) < L.r + margen) return false;
    }
    for (const p of PUENTES) if (distSeg(x, y, p.a[0], p.a[1], p.b[0], p.b[1]) < 160) return false;
    const g = suelo[Math.floor(y / CELDA) * GW + Math.floor(x / CELDA)];
    if (g === 1 || g === 2) return false;
    for (const r of RIOS) if (distLinea(x, y, r.p) < r.w / 2 + 40) return false;
    if (distLinea(x, y, QUEBRADA.p) < QUEBRADA.w / 2 + 40) return false;
    return true;
  }
  const PASO_BOSQUE = 96;
  const DECO = []; // helechos y hongos que se pintan en el piso
  for (let y = PASO_BOSQUE / 2; y < ALTO; y += PASO_BOSQUE)
    for (let x = PASO_BOSQUE / 2; x < ANCHO; x += PASO_BOSQUE) {
      const px = x + (rnd() - 0.5) * PASO_BOSQUE * 0.9,
        py = y + (rnd() - 0.5) * PASO_BOSQUE * 0.9,
        dens = ruido(px, py),
        borde = px < BORDE * 1.4 || py < BORDE * 0.9 || px > ANCHO - BORDE * 1.4 || py > ALTO - BORDE * 1.4;
      const tirada = rnd();
      if (!(borde || tirada < 0.18 + dens * 0.55)) {
        if (rnd() < 0.12 && libreDeTodo(px, py, 10)) DECO.push({ id: rnd() < 0.8 ? "helechos" : "hongosRocio", x: px, y: py, sem: rnd() * 10 });
        else if (rnd() < 0.05 + dens * 0.12 && libreDeTodo(px, py, 40)) DECO.push({ id: "alfombraMusgo", x: px, y: py, s: 0.9 + rnd() * 0.9, sem: rnd() * 10 });
        continue;
      }
      if (!libreDeTodo(px, py, 70)) continue;
      // los gigantes del bosque viejo: abetos de tronco ancho (a unos se les ve la copa, a otros ni eso) y algún roble anciano
      const g = rnd();
      if (!borde && dens > 0.5 && g < 0.055 && libreDeTodo(px, py, 120)) {
        const s = 1.5 + rnd() * 0.7,
          alto = rnd() < 0.55,
          h = alto ? 640 + rnd() * 420 : 250 + rnd() * 140,
          runa = rnd() < 0.06 ? FUTHARK.NOMBRES[Math.floor(rnd() * FUTHARK.NOMBRES.length)] : null;
        COSAS.push({ id: "abetoAnciano", x: px, y: py, o: { s, h, sem: rnd() * 10, runa, copa: [h * 0.6, h * 1.3 + 60 * s, 90 * s] }, choque: { r: 22 * s }, alto: h * 1.3 + 60 * s, arbol: true, gigante: 150 * s });
        continue;
      }
      if (!borde && dens < 0.5 && g > 0.99 && libreDeTodo(px, py, 160)) {
        const s = 1.1 + rnd() * 0.4;
        COSAS.push({ id: "robleAnciano", x: px, y: py, o: { s, sem: rnd() * 10, runa: rnd() < 0.2 ? "algiz" : null, copa: [180 * s, 400 * s, 170 * s] }, choque: { r: 34 * s }, alto: 380 * s, arbol: true, gigante: 190 * s });
        continue;
      }
      const k = rnd(),
        tipo = dens > 0.55 ? (k < 0.75 ? "pino" : k < 0.9 ? "roble" : "abedul") : k < 0.45 ? "pino" : k < 0.75 ? "roble" : k < 0.9 ? "abedul" : "roca";
      const s = tipo === "roca" ? 0.9 + rnd() * 0.8 : 1.8 + rnd() * 0.9 + (borde ? 0.4 : 0);
      COSAS.push({ id: tipo, x: px, y: py, o: { s, sem: rnd() * 10, pisos: 3 + Math.floor(rnd() * 3) }, choque: { r: ASSETS.LISTA[tipo].choque.r * s }, alto: ASSETS.LISTA[tipo].alto * s, arbol: tipo !== "roca" });
    }
  // a la sombra de un gigante no crece otro árbol: se sacan los que quedaron pegados al tronco
  {
    const gig = COSAS.filter((c) => c.gigante),
      celda = new Map(),
      clave = (x, y) => Math.floor(x / 400) + "," + Math.floor(y / 400);
    gig.forEach((g) => {
      const k = clave(g.x, g.y);
      if (!celda.has(k)) celda.set(k, []);
      celda.get(k).push(g);
    });
    for (let i = COSAS.length - 1; i >= 0; i--) {
      const c = COSAS[i];
      if (!c.arbol || c.gigante) continue;
      const cx = Math.floor(c.x / 400),
        cy = Math.floor(c.y / 400);
      let tapa = false;
      for (let dy = -1; dy <= 1 && !tapa; dy++)
        for (let dx = -1; dx <= 1 && !tapa; dx++) (celda.get(cx + dx + "," + (cy + dy)) || []).forEach((g) => (tapa = tapa || Math.hypot(c.x - g.x, (c.y - g.y) * 1.6) < g.gigante * 0.75));
      if (tapa) COSAS.splice(i, 1);
    }
  }
  // helechos sueltos a los costados de los caminos
  CAMINOS.forEach((c) => {
    for (let i = 1; i < c.p.length; i++) {
      const [ax, ay] = c.p[i - 1],
        [bx, by] = c.p[i],
        l = Math.hypot(bx - ax, by - ay),
        n = Math.floor(l / 140);
      for (let k = 0; k < n; k++) {
        if (rnd() < 0.5) continue;
        const u = rnd(),
          lado = rnd() < 0.5 ? -1 : 1,
          nx = -(by - ay) / l,
          ny = (bx - ax) / l,
          d = c.w / 2 + 20 + rnd() * 40;
        DECO.push({ id: "helechos", x: ax + (bx - ax) * u + nx * d * lado, y: ay + (by - ay) * u + ny * d * lado, sem: rnd() * 10 });
      }
    }
  });

  // barro: charcos en los caminos (más en los húmedos, cerca del agua) y en las orillas de ríos y lagunas
  const BARROS = [];
  const ponerBarro = (x, y, s, huellas) => {
    if (sueloEnInicial(x, y) !== 0) return;
    const b = { id: "barro", x, y, s, sem: rnd() * 10, huellas };
    DECO.push(b);
    BARROS.push(b);
  };
  function sueloEnInicial(x, y) {
    return x < 0 || y < 0 || x >= ANCHO || y >= ALTO ? 3 : suelo[Math.floor(y / CELDA) * GW + Math.floor(x / CELDA)];
  }
  CAMINOS.forEach((cm) => {
    for (let i = 1; i < cm.p.length; i++) {
      const [ax, ay] = cm.p[i - 1],
        [bx, by] = cm.p[i],
        n = Math.floor(Math.hypot(bx - ax, by - ay) / 260);
      for (let k = 0; k < n; k++) {
        if (rnd() > 0.16) continue;
        const u = rnd();
        ponerBarro(ax + (bx - ax) * u + (rnd() - 0.5) * cm.w * 0.4, ay + (by - ay) * u + (rnd() - 0.5) * cm.w * 0.3, 0.7 + rnd() * 0.6, 3 + Math.floor(rnd() * 4));
      }
    }
  });
  RIOS.forEach((rio) => {
    for (let i = 1; i < rio.p.length; i++) {
      const [ax, ay] = rio.p[i - 1],
        [bx, by] = rio.p[i],
        l = Math.hypot(bx - ax, by - ay),
        n = Math.floor(l / 300);
      for (let k = 0; k < n; k++) {
        if (rnd() > 0.35) continue;
        const u = rnd(),
          lado = rnd() < 0.5 ? -1 : 1,
          d = rio.w / 2 + 70 + rnd() * 50;
        ponerBarro(ax + (bx - ax) * u + (-(by - ay) / l) * d * lado, ay + (by - ay) * u + ((bx - ax) / l) * d * lado, 0.9 + rnd() * 0.7, 5);
      }
    }
  });
  LAGOS.forEach((lg) => {
    for (let k = 0; k < 7; k++) {
      const a = rnd() * TAU;
      ponerBarro(lg.p[0] + Math.cos(a) * (lg.rx + 110), lg.p[1] + Math.sin(a) * (lg.ry + 90), 0.9 + rnd() * 0.6, 4);
    }
  });
  const barroEn = (x, y) => BARROS.some((b) => Math.abs(x - b.x) < 66 * b.s && Math.hypot((x - b.x) / (66 * b.s), (y - b.y) / (30 * b.s)) < 1);

  // ---------- grilla espacial para dibujar y chocar solo lo cercano ----------
  const BALDE = 512,
    BW = Math.ceil(ANCHO / BALDE),
    BH = Math.ceil(ALTO / BALDE),
    BALDES = Array.from({ length: BW * BH }, () => []);
  COSAS.forEach((c) => {
    if (c.o.piso) return; // los que van pintados en el piso (puentes, tablón) se dibujan aparte
    const bx = Math.min(BW - 1, Math.max(0, Math.floor(c.x / BALDE))),
      by = Math.min(BH - 1, Math.max(0, Math.floor(c.y / BALDE)));
    BALDES[by * BW + bx].push(c);
  });
  // pone una cosa con el mundo ya armado (cofres, piedras rúnicas, ruinas de secretos.js)
  function agregar(id, p, o = {}, nombre) {
    const c = poner(id, p, o, nombre);
    if (!o.piso) BALDES[Math.min(BH - 1, Math.max(0, Math.floor(c.y / BALDE))) * BW + Math.min(BW - 1, Math.max(0, Math.floor(c.x / BALDE)))].push(c);
    return c;
  }
  // tipo de suelo en (x, y): 0 libre · 1 agua · 2 quebrada · 3 borde o muro
  const sueloEn = (x, y) => (x < 0 || y < 0 || x >= ANCHO || y >= ALTO ? 3 : suelo[Math.floor(y / CELDA) * GW + Math.floor(x / CELDA)]);
  function cercanas(x0, y0, x1, y1, fn) {
    const bx0 = Math.max(0, Math.floor(x0 / BALDE)),
      bx1 = Math.min(BW - 1, Math.floor(x1 / BALDE)),
      by0 = Math.max(0, Math.floor(y0 / BALDE)),
      by1 = Math.min(BH - 1, Math.floor(y1 / BALDE));
    for (let by = by0; by <= by1; by++) for (let bx = bx0; bx <= bx1; bx++) BALDES[by * BW + bx].forEach(fn);
  }

  // ---------- choques ----------
  // ¿puede pararse un cuerpo de radio r en (x, y)?
  function libre(x, y, r = 14) {
    if (x < 0 || y < 0 || x >= ANCHO || y >= ALTO) return false;
    for (const [ox, oy] of [[0, 0], [r, 0], [-r, 0], [0, r * 0.5], [0, -r * 0.5]]) {
      const g = suelo[Math.floor((y + oy) / CELDA) * GW + Math.floor((x + ox) / CELDA)];
      if (g === 3) return false;
      if ((g === 1 || g === 2) && !enPuente(x + ox, y + oy)) return false;
    }
    let ok = true;
    cercanas(x - 200, y - 200, x + 200, y + 200, (c) => {
      if (!ok || !c.choque || c.roto) return;
      const ch = c.choque;
      if (ch.r) {
        if (Math.hypot(x - c.x, (y - c.y) * 1.6) < ch.r + r) ok = false;
      } else if (ch.w) {
        if (x > c.x - ch.w / 2 - r && x < c.x + ch.w / 2 + r && y > c.y - ch.h - r * 0.5 && y < c.y + r * 0.5) ok = false;
      }
    });
    return ok;
  }
  // ¿hay algo que tape entre dos puntos? (casas, rocas, troncos: un golpe no pasa a través)
  function hayMuro(ax, ay, bx, by) {
    const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 24);
    for (let i = 1; i < n; i++) {
      const x = ax + ((bx - ax) * i) / n,
        y = ay + ((by - ay) * i) / n;
      let tapa = false;
      cercanas(x - 200, y - 200, x + 200, y + 200, (c) => {
        if (tapa || !c.choque || c.arbol || c.roto) return;
        const ch = c.choque;
        if (ch.w && x > c.x - ch.w / 2 && x < c.x + ch.w / 2 && y > c.y - ch.h && y < c.y) tapa = true;
        if (ch.r && ch.r > 20 && Math.hypot(x - c.x, (y - c.y) * 1.6) < ch.r) tapa = true;
      });
      if (tapa) return true;
    }
    return false;
  }

  // ---------- el piso, por trozos ----------
  const TROZO = 512;
  const cache = new Map();
  let escalaCache = 0;
  function pintarTrozo(tx, ty, esc) {
    const lado = Math.ceil(TROZO * esc);
    const cv = document.createElement("canvas");
    cv.width = cv.height = lado;
    const c = cv.getContext("2d");
    c.scale(esc, esc);
    c.translate(-tx * TROZO, -ty * TROZO);
    const x0 = tx * TROZO,
      y0 = ty * TROZO,
      x1 = x0 + TROZO,
      y1 = y0 + TROZO,
      mg = 500;
    // fondo: humus del bosque con manchas de musgo (como las manchas del piso de la arena)
    R(c, x0, y0, TROZO, TROZO, "#33301F");
    const r = azar(tx * 7919 + ty * 104729 + 5);
    for (let k = 0; k < 16; k++) {
      const x = x0 + r() * TROZO,
        y = y0 + r() * TROZO,
        d = ruido(x, y);
      E(c, x, y, 60 + r() * 120, 20 + r() * 40, d > 0.5 ? "#2B2A1B" : "#3A3A24", r() * 0.6 - 0.3);
    }
    for (let k = 0; k < 10; k++) {
      const x = x0 + r() * TROZO,
        y = y0 + r() * TROZO;
      P(c, poli(x, y, 30 + r() * 50, 14 + r() * 20, 6, r(), [1, 0.8, 1.1, 0.9, 1.05, 0.85]), "#3D4228");
    }
    for (let k = 0; k < 26; k++) R(c, x0 + r() * TROZO, y0 + r() * TROZO, 4, 4, r() < 0.5 ? "#4A4A30" : "#26251A");
    // claros de los lugares: pasto más claro
    for (const k in LUGARES) {
      const Lg = LUGARES[k];
      if (Lg.p[0] + Lg.r + mg < x0 || Lg.p[0] - Lg.r - mg > x1 || Lg.p[1] + Lg.r + mg < y0 || Lg.p[1] - Lg.r - mg > y1) continue;
      const rr = azar(k.length * 31 + Math.round(Lg.p[0]));
      const jit = Array.from({ length: 12 }, () => 0.85 + rr() * 0.3);
      P(c, poli(Lg.p[0], Lg.p[1], Lg.r * 1.25, Lg.r * 1.05, 12, 0.2, jit), "#3F4A28");
      P(c, poli(Lg.p[0], Lg.p[1], Lg.r * 1.02, Lg.r * 0.86, 12, 0.5, jit), "#4A5630");
      for (let i = 0; i < 18; i++) {
        const a = rr() * TAU,
          d = rr() * Lg.r * 0.9;
        E(c, Lg.p[0] + Math.cos(a) * d, Lg.p[1] + Math.sin(a) * d * 0.85, 20 + rr() * 30, 8 + rr() * 10, "#56662C");
      }
    }
    // la quebrada: tajo oscuro con bordes de roca y el arroyo al fondo
    trazo(c, QUEBRADA.p, QUEBRADA.w + 60, "#4A504C");
    trazo(c, QUEBRADA.p, QUEBRADA.w + 20, "#3A3E3A");
    trazo(c, QUEBRADA.p, QUEBRADA.w - 40, "#1E1F1C");
    trazo(c, QUEBRADA.p, QUEBRADA.w - 160, "#151513");
    trazo(c, QUEBRADA.p.map(([x, y]) => [x, y + 40]), 30, "#24424A");
    // ríos: orilla, agua y el brillo del medio
    RIOS.forEach((rio) => {
      trazo(c, rio.p, rio.w + 70, "#2E3324");
      trazo(c, rio.p, rio.w + 30, "#4A4A3A");
      trazo(c, rio.p, rio.w, "#2A4C56");
      trazo(c, rio.p, rio.w * 0.55, "#30586A");
      trazo(c, rio.p, rio.w * 0.12, "#3E6E7E");
    });
    // lagunas
    LAGOS.forEach((l) => {
      if (l.p[0] + l.rx + 200 < x0 || l.p[0] - l.rx - 200 > x1 || l.p[1] + l.ry + 200 < y0 || l.p[1] - l.ry - 200 > y1) return;
      const jit = [1, 0.92, 1.05, 0.95, 1.02, 0.9, 1.04, 0.97, 1, 0.93, 1.06, 0.96];
      P(c, poli(l.p[0], l.p[1], l.rx + 60, l.ry + 50, 12, 0.1, jit), "#2E3324");
      P(c, poli(l.p[0], l.p[1], l.rx + 24, l.ry + 20, 12, 0.1, jit), "#4A4A3A");
      P(c, poli(l.p[0], l.p[1], l.rx, l.ry, 12, 0.1, jit), "#2A4C56");
      P(c, poli(l.p[0] + l.rx * 0.1, l.p[1] - l.ry * 0.1, l.rx * 0.6, l.ry * 0.55, 10, 0.3), "#30586A");
    });
    // Eikholt por dentro: tierra apisonada en la plaza del Roble y las calles hacia las puertas
    if (CIUDAD.c[0] + CIUDAD.rx + mg > x0 && CIUDAD.c[0] - CIUDAD.rx - mg < x1 && CIUDAD.c[1] + CIUDAD.ry + mg > y0 && CIUDAD.c[1] - CIUDAD.ry - mg < y1) {
      const [cx, cy] = CIUDAD.c;
      P(c, poli(cx, cy, CIUDAD.rx * 0.98, CIUDAD.ry * 0.98, 40), "#465030");
      const calles = [[[cx, cy], [cx, cy + CIUDAD.ry + 40]], [[cx, cy], [cx - CIUDAD.rx - 40, cy]], [[cx, cy], [cx + CIUDAD.rx + 40, cy]], [[cx, cy], [cx, cy - CIUDAD.ry * 0.8]]];
      calles.forEach((cl) => {
        trazo(c, cl, 190, "#3A3022");
        trazo(c, cl, 160, "#5C4A32");
      });
      // la plaza del Roble: tierra con losas alrededor del tronco
      const jp = [1, 0.9, 1.06, 0.94, 1.02, 0.88, 1.05, 0.96];
      P(c, poli(cx, cy + 260, 900, 560, 16, 0.1, jp), "#3A3022");
      P(c, poli(cx, cy + 260, 860, 530, 16, 0.1, jp), "#5C4A32");
      const rl = azar(91);
      for (let k = 0; k < 70; k++) {
        const a = rl() * TAU,
          d = 260 + rl() * 260;
        P(c, poli(cx + Math.cos(a) * d, cy + 40 + Math.sin(a) * d * 0.55, 26 + rl() * 14, 12 + rl() * 6, 6, rl()), rl() < 0.5 ? "#6E6458" : "#5E564C");
      }
      for (let k = 0; k < 30; k++) E(c, cx + (rl() - 0.5) * 1700, cy + 260 + (rl() - 0.5) * 1000, 30 + rl() * 40, 10 + rl() * 12, "#465030");
    }
    // caminos: tierra pisada con el borde más oscuro y el centro gastado
    CAMINOS.forEach((cm) => {
      trazo(c, cm.p, cm.w + 26, "#3A3022");
      trazo(c, cm.p, cm.w, "#5C4A32");
      trazo(c, cm.p, cm.w * 0.5, "#6A563A");
    });
    // piedritas sobre los caminos
    CAMINOS.forEach((cm) => {
      const rr = azar(Math.round(cm.p[0][0]));
      for (let i = 1; i < cm.p.length; i++) {
        const [ax, ay] = cm.p[i - 1],
          [bx, by] = cm.p[i],
          n = Math.floor(Math.hypot(bx - ax, by - ay) / 60);
        for (let k = 0; k < n; k++) {
          const u = rr(),
            x = ax + (bx - ax) * u + (rr() - 0.5) * cm.w * 0.7,
            y = ay + (by - ay) * u + (rr() - 0.5) * cm.w * 0.5;
          if (x < x0 - 20 || x > x1 + 20 || y < y0 - 20 || y > y1 + 20) continue;
          P(c, poli(x, y, 5 + rr() * 5, 3 + rr() * 3, 5, rr()), rr() < 0.5 ? "#7A6A50" : "#4E4232");
        }
      }
    });
    // las montañas del borde
    c.fillStyle = "#1A1C16";
    if (x0 < BORDE + mg || y0 < BORDE + mg || x1 > ANCHO - BORDE - mg || y1 > ALTO - BORDE - mg) {
      const rb = azar(tx * 13 + ty * 17);
      for (let k = 0; k < 40; k++) {
        const x = x0 + rb() * TROZO,
          y = y0 + rb() * TROZO;
        if (x < BORDE || y < BORDE * 0.5 || x > ANCHO - BORDE || y > ALTO - BORDE) P(c, poli(x, y, 80 + rb() * 80, 50 + rb() * 40, 6, rb()), rb() < 0.5 ? "#26281F" : "#1E2019");
      }
    }
    // lo que va pintado en el piso: puentes, tablón, losa (se redibujan si cambian, ver invalidar)
    COSAS.forEach((o) => {
      if (!o.o.piso) return;
      const x2 = o.o.x2 !== undefined ? o.o.x2 : o.x;
      if (Math.max(o.x, x2) + 200 < x0 || Math.min(o.x, x2) - 200 > x1) return;
      ASSETS.dibujar(c, o.id, o.x, o.y, 0, o.o);
    });
    // primero musgo y barro (planos), después los helechos encima
    DECO.forEach((d) => {
      if ((d.id !== "alfombraMusgo" && d.id !== "barro") || d.x < x0 - 140 || d.x > x1 + 140 || d.y < y0 - 70 || d.y > y1 + 70) return;
      ASSETS.dibujar(c, d.id, d.x, d.y, 0, { s: d.s, sem: d.sem, huellas: d.huellas });
    });
    DECO.forEach((d) => {
      if (d.id !== "helechos" || d.x < x0 - 40 || d.x > x1 + 40 || d.y < y0 - 40 || d.y > y1 + 40) return;
      ASSETS.dibujar(c, d.id, d.x, d.y, 0, { sem: d.sem });
    });
    return cv;
  }
  function trazo(c, pts, w, col) {
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.strokeStyle = col;
    c.lineWidth = w;
    c.lineJoin = "round";
    c.lineCap = "round";
    c.stroke();
  }
  // dibuja el piso visible; esc = píxeles por unidad. Los trozos se guardan (como mucho 30).
  function dibujarPiso(c, x0, y0, x1, y1, esc) {
    if (Math.abs(esc - escalaCache) > 0.01) {
      cache.clear();
      escalaCache = esc;
    }
    const tx0 = Math.max(0, Math.floor(x0 / TROZO)),
      tx1 = Math.min(Math.ceil(ANCHO / TROZO) - 1, Math.floor(x1 / TROZO)),
      ty0 = Math.max(0, Math.floor(y0 / TROZO)),
      ty1 = Math.min(Math.ceil(ALTO / TROZO) - 1, Math.floor(y1 / TROZO));
    let pintados = 0;
    for (let ty = ty0; ty <= ty1; ty++)
      for (let tx = tx0; tx <= tx1; tx++) {
        const k = tx + "," + ty;
        let cv = cache.get(k);
        if (!cv) {
          if (pintados > 2 && cache.size) continue; // no más de 3 por cuadro: evita tirones al llegar a otra zona
          cv = pintarTrozo(tx, ty, esc);
          pintados++;
          cache.set(k, cv);
          if (cache.size > 60) cache.delete(cache.keys().next().value);
        } else {
          cache.delete(k);
          cache.set(k, cv);
        }
        c.drawImage(cv, tx * TROZO, ty * TROZO, TROZO + 0.6, TROZO + 0.6);
      }
  }
  function invalidar(x, y) {
    // vuelve a pintar el trozo de (x, y) y sus vecinos (al reparar el puente, por ejemplo)
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) cache.delete(Math.floor(x / TROZO + dx) + "," + Math.floor(y / TROZO + dy));
  }
  function repararPuente(si) {
    puenteSano.paso = si;
    const p = NOMBRADAS.puente_paso;
    p.o.roto = !si;
    invalidar(p.x, p.y);
  }

  return {
    U, M, ANCHO, ALTO, CIUDAD, LAGOS, LUGARES, CAMINOS, RIOS, QUEBRADA, PUENTES, COSAS, NOMBRADAS, PUNTOS, DECO, BARROS, barroEn,
    m, mas, libre, hayMuro, cercanas, dibujarPiso, invalidar, repararPuente, distLinea, agregar, sueloEn, libreDeTodo, ruido, BORDE,
  };
})();
