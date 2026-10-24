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
    eikholt: { p: m(810, 565), r: 58 },
    paso_sur: { p: m(532, 222), r: 12 },
    paso: { p: m(515, 172), r: 6 },
    paso_norte: { p: m(500, 120), r: 8 },
    tala: { p: m(410, 238), r: 16 },
    quebrada_rastreo: { p: m(318, 210), r: 8 },
    claro_entrada: { p: m(262, 205), r: 7 },
    claro: { p: m(175, 175), r: 30 },
    aserradero: { p: m(1150, 322), r: 22 },
    santuario: { p: m(1415, 215), r: 24 },
    brunvik: { p: m(1240, 590), r: 14 },
    skarnholt: { p: m(200, 440), r: 14 },
    tumulo: { p: m(260, 690), r: 10 },
    caravana: { p: m(740, 830), r: 10 },
    torre: { p: m(1420, 760), r: 9 },
  };
  for (const k in LUGARES) LUGARES[k].r *= M;

  // los caminos llegan a las cuatro puertas de Eikholt: sur (Hrafngard), norte (el Paso), oeste (Skarnholt) y
  // este (aserradero, Brunvik); adentro siguen como calles hasta la plaza del Roble (ver pintarTrozo)
  const CAMINOS = [
    { p: lista([[95, 960], [200, 880], [290, 852], [357.5, 834], [357.5, 805], [385, 780], [385, 762], [400, 758], [470, 745], [560, 700], [680, 692], [810, 692], [810, 662]]), w: 4 * 34 },
    { p: lista([[810, 462], [810, 440], [780, 422], [700, 414], [640, 404], [612, 396], [575, 300], [540, 230], [515, 172], [500, 110], [490, 30]]), w: 3.6 * 34 },
    { p: lista([[590, 345], [530, 330], [470, 318]]), w: 2.8 * 34 },
    { p: lista([[540, 232], [470, 240], [410, 238], [360, 222], [318, 210], [262, 205], [205, 190]]), w: 2.4 * 34 },
    { p: lista([[950, 565], [970, 548], [958, 515], [960, 488], [1010, 420], [1060, 360], [1085, 330], [1150, 345], [1205, 345], [1265, 300], [1330, 250], [1415, 215]]), w: 3.4 * 34 },
    { p: lista([[955, 568], [985, 585], [1080, 600], [1240, 590]]), w: 3 * 34 },
    { p: lista([[668, 565], [610, 560], [520, 530], [420, 500], [320, 470], [230, 448]]), w: 2.6 * 34 },
  ];
  // los caminos que se trazaron en el editor (agregados.js), ya en unidades del mundo
  // (y los de base que se cambiaron de tipo; los que se sacaron se sacan con el bosque ya armado, más abajo)
  CAMINOS.forEach((cm, i) => (cm.sem = i));
  ((window.AGREGADOS && window.AGREGADOS.estiloCaminos) || []).forEach((e) => CAMINOS[e.i] && Object.assign(CAMINOS[e.i], { tipo: e.tipo, borde: e.borde, fundir: e.fundir, w: e.w || CAMINOS[e.i].w }));
  ((window.AGREGADOS && window.AGREGADOS.caminos) || []).forEach((cm, i) => cm.p && cm.p.length > 1 && CAMINOS.push({ p: cm.p, w: cm.w || 110, tipo: cm.tipo, borde: cm.borde, fundir: cm.fundir, sem: 1000 + i, agregado: true }));
  // la empalizada doble de Eikholt: una elipse con cuatro puertas (sur, oeste, este, norte)
  const CIUDAD = { c: m(810, 565), rx: 150 * U, ry: 110 * U, puertas: [Math.PI / 2, Math.PI, 0, -Math.PI / 2], hueco: 150 };
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
    { id: "brunvik", a: m(1110, 601), b: m(1152, 598), ancho: 3.2 * M },
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
  function pintarLinea(pts, w, val, arr = suelo) {
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
          if (distSeg((gx + 0.5) * CELDA, (gy + 0.5) * CELDA, ax, ay, bx, by) <= r) arr[gy * GW + gx] = Math.max(arr[gy * GW + gx], val);
    }
  }
  function pintarLago(l, arr = suelo) {
    for (let gy = Math.floor((l.p[1] - l.ry) / CELDA); gy <= (l.p[1] + l.ry) / CELDA; gy++)
      for (let gx = Math.floor((l.p[0] - l.rx) / CELDA); gx <= (l.p[0] + l.rx) / CELDA; gx++) {
        const dx = ((gx + 0.5) * CELDA - l.p[0]) / l.rx,
          dy = ((gy + 0.5) * CELDA - l.p[1]) / l.ry;
        if (dx * dx + dy * dy < 1 && gx >= 0 && gy >= 0 && gx < GW && gy < GH) arr[gy * GW + gx] = Math.max(arr[gy * GW + gx], 1);
      }
  }
  RIOS.forEach((r) => pintarLinea(r.p, r.w, 1));
  pintarLinea(QUEBRADA.p, QUEBRADA.w, 2);
  LAGOS.forEach((l) => pintarLago(l));
  // la empalizada: un anillo cerrado salvo en las puertas (y donde pasa agua)
  const enPuerta = (a) => CIUDAD.puertas.some((pa) => Math.abs(Math.atan2(Math.sin(a - pa), Math.cos(a - pa))) < CIUDAD.hueco / CIUDAD.rx);
  const MURO = [];
  // la muralla doble mide 2 × MEDIO_MURO de ancho: la cara de afuera, el adarve y la cara de adentro (alturas.js)
  const MEDIO_MURO = 75,
    ALTO_MURO = 170;
  const normalMuro = (a) => {
    const nx = Math.cos(a) / CIUDAD.rx,
      ny = Math.sin(a) / CIUDAD.ry,
      l = Math.hypot(nx, ny);
    return [nx / l, ny / l];
  };
  const enMuro = (a, d) => {
    const n = normalMuro(a);
    return [CIUDAD.c[0] + Math.cos(a) * CIUDAD.rx + n[0] * d, CIUDAD.c[1] + Math.sin(a) * CIUDAD.ry + n[1] * d];
  };
  const NIVELES = [];
  {
    const n = 112;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * TAU,
        a1 = ((i + 1) / n) * TAU,
        am = (a0 + a1) / 2;
      if (enPuerta(am)) continue;
      const amx = CIUDAD.c[0] + Math.cos(am) * CIUDAD.rx,
        amy = CIUDAD.c[1] + Math.sin(am) * CIUDAD.ry;
      if (suelo[Math.floor(amy / CELDA) * GW + Math.floor(amx / CELDA)] === 1) continue;
      const p0 = [CIUDAD.c[0] + Math.cos(a0) * CIUDAD.rx, CIUDAD.c[1] + Math.sin(a0) * CIUDAD.ry],
        p1 = [CIUDAD.c[0] + Math.cos(a1) * CIUDAD.rx, CIUDAD.c[1] + Math.sin(a1) * CIUDAD.ry];
      MURO.push([p0, p1, am, i, a0, a1]);
      pintarLinea([p0, p1], 2 * MEDIO_MURO + 6, 3);
    }
  }
  for (let gy = 0; gy < GH; gy++)
    for (let gx = 0; gx < GW; gx++) {
      const x = (gx + 0.5) * CELDA,
        y = (gy + 0.5) * CELDA;
      if (x < BORDE || y < BORDE * 0.5 || x > ANCHO - BORDE || y > ALTO - BORDE) suelo[gy * GW + gx] = 3;
    }

  // un puente está "sano" salvo el del Paso hasta que se repara (lo decide el juego con puenteSano)
  let puenteSano = { paso: false, central: true, oriental: true, brunvik: true };
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

  // vuelve a marcar el agua en la grilla: la de base que no se secó y la agregada (menos donde la cruza un camino)
  function pintarAgua() {
    for (let k = 0; k < suelo.length; k++) if (suelo[k] === 1) suelo[k] = 0;
    RIOS.forEach((r) => !r.seco && !r.agregado && pintarLinea(r.p, r.w, 1));
    LAGOS.forEach((l) => !l.seco && !l.agregado && pintarLago(l));
    const nueva = new Uint8Array(GW * GH),
      vado = new Uint8Array(GW * GH);
    RIOS.forEach((r) => r.agregado && pintarLinea(r.p, r.w, 1, nueva));
    LAGOS.forEach((l) => l.agregado && pintarLago(l, nueva));
    CAMINOS.forEach((cm) => pintarLinea(cm.p, cm.w, 1, vado));
    for (let k = 0; k < suelo.length; k++) if (nueva[k] && !vado[k] && suelo[k] === 0) suelo[k] = 1;
  }

  // ---------- los objetos del mundo ----------
  // cada cosa: { id (asset), x, y, o (opciones), choque, nombre (para el juego) }
  const COSAS = [];
  const NOMBRADAS = {}; // las que el juego necesita encontrar (carro, piedra, mesa…)
  const PUNTOS = {}; // dónde se paran los NPC, dónde está cada objetivo
  const RECINTOS = []; // rectángulos cerrados donde no crece el bosque: [x0, y0, x1, y1]
  // las casas, más grandes que el resto (se entran: ver interiores.js)
  const ESCALA_CASA = { casaEikholt: 1.7, casaLindes: 1.6, herreriaAsa: 1.5, casaSanacion: 1.5, hongoDorado: 1.45, cordeleriaFolke: 1.4, cobertizoRefugio: 1.4 };
  function poner(id, p, o = {}, nombre) {
    if (ESCALA_CASA[id]) o.s = (o.s || 1) * ESCALA_CASA[id];
    const md = ASSETS.medidas(id, o);
    const cosa = { id, x: p[0], y: p[1], o, choque: md.choque, alto: md.alto };
    COSAS.push(cosa);
    if (nombre) NOMBRADAS[nombre] = cosa;
    return cosa;
  }
  const punto = (k, p) => (PUNTOS[k] = p);

  // El Puesto de Eydis imaginado (Alejandro, 22/10/2026): la casa de los guardasendas del sur. Un recinto de
  // palisada con el portón de Hrafngard al sur (poste tallado, farol que no se apaga, campana) y la salida a
  // Eikholt al noreste; la casa al norte con su galería, la mesa de rutas y el tablero de las tablillas; la
  // atalaya detrás, a la izquierda; la carreta de Ingrid al oeste; el fuego de Halvard en el patio; la huerta al
  // este; la leñera y el ahumadero contra la palisada; el cobertizo de viajeros cerca de la salida; y afuera, al
  // oeste, la piedra que cambió de color.
  (function () {
    const c = LUGARES.puesto.p,
      q = (dx, dy) => [c[0] + dx, c[1] + dy],
      HW = 900,
      HH = 640;
    punto("puesto", q(150, 560));
    RECINTOS.push([c[0] - HW - 60, c[1] - HH - 160, c[0] + HW + 60, c[1] + HH + 60]);
    // la palisada, en tramos, con el hueco de los dos portones; también frena el paso (como la empalizada)
    const tramo = (x0, y0, x1, y1, sem) => {
      pintarLinea([q(x0, y0), q(x1, y1)], 36, 3);
      if (x0 === x1) poner("palisada", q(x0, Math.max(y0, y1)), { ay: -Math.abs(y1 - y0), sem, sinChoque: true, ancho: 40 });
      else poner("palisada", q((x0 + x1) / 2, y0), { ax: -(x1 - x0) / 2, bx: (x1 - x0) / 2, sem, sinChoque: true, ancho: (x1 - x0) / 2 + 30 });
    };
    const lado = (x0, y0, x1, y1, huecos, sem) => {
      const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 180);
      for (let k = 0; k < n; k++) {
        const u0 = k / n,
          u1 = (k + 1) / n,
          ax = x0 + (x1 - x0) * u0,
          ay = y0 + (y1 - y0) * u0,
          bx = x0 + (x1 - x0) * u1,
          by = y0 + (y1 - y0) * u1;
        if (huecos.some(([hx, hy]) => Math.hypot((ax + bx) / 2 - hx, (ay + by) / 2 - hy) < 150)) continue;
        tramo(ax, ay, bx, by, sem + k);
      }
    };
    const SUR = [150, HH],
      NE = [700, -HH];
    lado(-HW, -HH, HW, -HH, [NE], 1);
    lado(-HW, HH, HW, HH, [SUR], 20);
    lado(-HW, -HH, -HW, HH, [], 40);
    lado(HW, -HH, HW, HH, [], 60);
    poner("portonPuesto", q(SUR[0], SUR[1] + 4), {}, "porton_sur");
    poner("portonPuesto", q(NE[0], NE[1] + 4), { faroles: 2 }, "porton_ne");
    // la casa de los guardasendas, la galería con la mesa de rutas y el tablero de las tablillas
    poner("casaNordica", q(-80, -430), { v: 4, s: 1.15, pared: 1, techo: 1, postigo: 0, sem: 2, estandarte: true }, "casa_puesto");
    poner("tableroTablillas", q(10, -429), { oscuras: 5, s: 1.1 }, "tablillas");
    poner("mesaRutas", q(-170, -372), {}, "mesa_rutas");
    punto("eydis_puesto", q(-90, -350));
    // la atalaya de Tove
    poner("torreVigia", q(-420, -500), { sem: 8 });
    // el patio: el fuego de Halvard, la carreta y el mostrador de Ingrid
    poner("fogonOlla", q(-40, 40), {}, "fogon");
    poner("carreta", q(-560, 110), { v: 0 }, "carreta_ingrid");
    poner("mostradorManta", q(-400, 200), {}, "mostrador");
    // la huerta del este, cercada con estacas
    poner("huerta", q(560, 20), { sem: 5, s: 0.95 });
    poner("cerca", q(380, 100), { x2: c[0] + 760, y2: c[1] + 100 });
    poner("cerca", q(380, -90), { x2: c[0] + 380, y2: c[1] + 99 });
    // la leñera y el ahumadero contra la palisada, lejos del paso
    poner("ahumadero", q(520, 590));
    // el cobertizo de viajeros cerca de la salida, con la ropa tendida
    poner("cobertizoRefugio", q(420, -470));
    poner("tendedero", q(240, -400));
    // Grima duerme junto al farol del portón; el farol de la salida
    poner("perraGrima", q(40, 590), {}, "grima");
    poner("farol", q(560, -540));
    // la piedra de afuera, al oeste, a pocos metros de la palisada
    poner("piedraVioleta", q(-1120, 160), { vista: false }, "piedra_violeta");
    // dónde está cada uno (los usa capital.js)
    punto("halvard", q(-120, 70));
    punto("tove", q(-360, -440));
    punto("ingrid", q(-330, 240));
    punto("arvid", q(-660, 80));
    punto("ketil", q(-780, 320));
    punto("sigrun_puesto", q(80, 540));
  })();
  // El carro volcado (Alejandro, 22/10/2026): la huida de la cuadrilla se lee sin texto. El costado golpeado mira
  // al camino, con los tajos de cornamenta y el asta clavada; del otro lado salen los surcos de la camilla hacia el
  // Refugio, las pezuñas del buey se separan hacia el bosque y las huellas del Ciervo van al sur y giran al norte.
  (function () {
    const c = LUGARES.carro.p;
    const carro = poner("carroCuadrilla", mas(c, 4, 0), { cepillo: true, talla: true, jornal: true }, "carro");
    punto("carro", mas(c, 2, 1.2));
    poner("sacosAbiertos", m(624, 392));
    poner("posteFarol", mas(c, -2.5, -2.6), { encendido: false }, "farol_carrero");
    const ref = LUGARES.refugio.p,
      dx = ref[0] - c[0],
      dy = ref[1] - c[1],
      l = Math.hypot(dx, dy);
    const a = mas(c, 0, -1.6);
    poner("rastro", a, { x2: a[0] + (dx / l) * 14 * M, y2: a[1] + (dy / l) * 14 * M, tipo: "camilla", piso: true, sinChoque: true });
    const b2 = mas(c, 8, -1);
    poner("rastro", b2, { x2: b2[0] + 9 * M, y2: b2[1] - 6 * M, tipo: "buey", piso: true, sinChoque: true });
    const e1 = mas(c, 7, 3),
      e2 = mas(c, 6, 9),
      e3 = mas(c, 11, 4);
    poner("rastro", e1, { x2: e2[0], y2: e2[1], tipo: "ciervo", piso: true, sinChoque: true });
    poner("rastro", e2, { x2: e3[0], y2: e3[1], tipo: "ciervo", piso: true, sinChoque: true });
    // dónde se agarra cada cosa de los restos
    punto("cepillo", [carro.x + 150, carro.y + 60]);
    punto("talla", [carro.x - 38, carro.y + 66]);
    punto("jornal", [carro.x + 25, carro.y + 40]);
  })();
  // Refugio de las Lindes (Alejandro, 22/10/2026): siete mojones con su runa alrededor de la piedra; adentro el
  // cobertizo de turba, el fogón apagado y la camilla; el poste de tablillas junto a la entrada; la cuadrilla, cada
  // uno en su lugar. La salida a Eikholt (la que tapan los errantes) queda al sudeste.
  (function () {
    const c = LUGARES.refugio.p;
    punto("refugio", mas(c, 6, 6));
    const RUNAS = ["othala", "algiz", "berkano", "laguz", "raidho", "eihwaz", "ingwaz"];
    const mojones = [];
    for (let i = 0; i < 7; i++) {
      const a = 1.4 + (i * (TAU - 1.0)) / 6;
      mojones.push(poner("mojon", [c[0] + Math.cos(a) * 10 * M, c[1] + Math.sin(a) * 10 * M * 0.9], { sem: i, luz: 0, runa: RUNAS[i], nicho: i === 0, ofrenda: null }, "menhir" + i));
    }
    NOMBRADAS.mojones = mojones;
    poner("cobertizoRefugio", mas(c, -3, -5));
    poner("fogonOlla", mas(c, -7.5, -1), { apagado: true }, "fogon_refugio");
    poner("camilla", mas(c, 3, -3.4), { sinChoque: true });
    poner("runaRefugio", mas(c, 2, 1), { puesta: false, luz: 0 }, "runa_refugio");
    poner("cunaPiedra", mas(c, 3.4, 1.6), { reparada: false }, "cuna");
    poner("piedraCaida", mas(c, 4.2, 3), {}, "piedra_caida");
    poner("posteTablillas", [c[0] + Math.cos(0.9) * 12.5 * M, c[1] + Math.sin(0.9) * 12.5 * M * 0.9 - 80], { nuevas: 5 }, "poste_tablillas");
    poner("farol", mas(c, 9, 9));
    punto("runa_refugio", mas(c, 2, 1.6));
    punto("piedra_caida", mas(c, 4.2, 3.4));
    punto("errantes", mas(c, 18, 10));
    punto("eydis_refugio", mas(c, -2, 6));
    punto("eydis_refugio_salida", mas(c, 12, 8));
    punto("orm_refugio", [c[0] + Math.cos(0.9) * 9 * M, c[1] + Math.sin(0.9) * 8 * M]);
    punto("trab_refugio", mas(c, -5, 0));
    // la cuadrilla en sus lugares: Bror bajo el cobertizo, Lif mirando el mojón débil, Gunnar con la camilla,
    // Eskil junto a la base que cedió
    punto("trab_refugio_herido", mas(c, -3, -3.6));
    const debil = mojones[2];
    punto("trab_refugio_trabajador", [debil.x + 50, debil.y + 50]);
    punto("trab_refugio_trabajador2", mas(c, 3, -2.4));
    punto("trab_refugio_trabajador3", mas(c, 3.8, 2.2));
  })();
  // Eikholt, la capital (compendio del 22/10/2026): anillos alrededor del Roble. En el centro lo común (el Roble
  // gigante con el árbol de las promesas y el mirador, el Círculo del Ting entre las raíces, el pozo de Gudrun, la
  // campana, el tablón de avisos y el Mercado de los Toldos bajo la copa); en el segundo anillo los oficios al oeste
  // y sudoeste (herrería, carpintería con grúa, cordelería, curtiembre), la Casa de Sanación al noroeste con su
  // jardín, la Guardia del Roble al noreste con el patio de muñecos y el Hongo Dorado al sudeste; en el borde las
  // casas, las huertas del este y el corral de caravanas al norte. La empalizada doble de 6 m con pasarela cubierta
  // y atalayas, cuatro puertas, y las doce piedras de la cúpula rúnica por delante de la empalizada.
  (function () {
    const c = CIUDAD.c,
      px = (dx, dy) => [c[0] + dx * U, c[1] + dy * U];
    // la muralla doble con el adarve (un nivel de alturas.js) y las atalayas por fuera
    const muralla = { id: "muralla", h: ALTO_MURO, quads: [], escaleras: [] };
    const hay = new Set(MURO.map((m0) => m0[3]));
    const nM = 112;
    MURO.forEach(([p0, p1, am, i, a0, a1]) => {
      const A0 = enMuro(a0, MEDIO_MURO),
        A1 = enMuro(a1, MEDIO_MURO),
        D1 = enMuro(a1, -MEDIO_MURO),
        D0 = enMuro(a0, -MEDIO_MURO);
      const pts = [...A0, ...A1, ...D1, ...D0];
      const fy = Math.max(A0[1], A1[1], D0[1], D1[1]),
        fx = (A0[0] + A1[0] + D0[0] + D1[0]) / 4;
      const q = pts.map((v, k) => (k % 2 ? v - fy : v - fx));
      poner("murallaDoble", [fx, fy], { q, H: ALTO_MURO, sem: i, sinChoque: true, cabo0: !hay.has((i + nM - 1) % nM), cabo1: !hay.has((i + 1) % nM) });
      muralla.quads.push({ pts, clave: fy });
      if (i % 10 === 5) poner("torreVigia", enMuro(am, MEDIO_MURO + 80), { sem: i, s: 1.35 });
    });
    // las escaleras de tablas, por dentro, a los dos lados de las puertas oeste y este: suben alejándose de la
    // puerta (cada tramo del anillo entre dos puertas tiene la suya)
    [Math.PI, 0].forEach((pa) => {
      [-1, 1].forEach((lado) => {
        let borde = null;
        MURO.forEach(([, , am, , a0, a1]) => {
          const d = Math.atan2(Math.sin(am - pa), Math.cos(am - pa));
          if (Math.sign(d) !== lado || Math.abs(d) > 0.5) return;
          const b = lado > 0 ? a0 : a1;
          const db = Math.abs(Math.atan2(Math.sin(b - pa), Math.cos(b - pa)));
          if (!borde || db < borde.db) borde = { a: b, db };
        });
        if (!borde) return;
        const largo = ALTO_MURO * 2.1,
          w = 96,
          as = borde.a + lado * 0.012,
          ae = as + (lado * largo) / CIUDAD.ry;
        const A = enMuro(as, -MEDIO_MURO - w / 2 + 6),
          B = enMuro(ae, -MEDIO_MURO - w / 2 + 6);
        const fy = Math.max(A[1], B[1]) + w / 2,
          fx = (A[0] + B[0]) / 2;
        poner("escaleraMuralla", [fx, fy], { a: [A[0] - fx, A[1] - fy], b: [B[0] - fx, B[1] - fy], w, H: ALTO_MURO, abierto: pa === 0 ? -1 : 1, sinChoque: true });
        muralla.escaleras.push({ ax: A[0], ay: A[1], bx: B[0], by: B[1], w, clave: fy });
        RECINTOS.push([Math.min(A[0], B[0]) - w, Math.min(A[1], B[1]) - 40, Math.max(A[0], B[0]) + w, Math.max(A[1], B[1]) + 60]);
      });
    });
    NIVELES.push(muralla);
    // atalayas y estandartes a los lados de las puertas oeste y este
    [Math.PI, 0].forEach((pa) => {
      [-1, 1].forEach((lado) => {
        const a = pa + (lado * (CIUDAD.hueco + 60)) / CIUDAD.ry;
        const p = enMuro(a, MEDIO_MURO + 80);
        poner("torreVigia", p, { sem: lado + 3, s: 1.35 });
        poner("estandarteCiervo", [p[0] + (pa ? -70 : 70), p[1] + 30], { sem: lado + (pa ? 7 : 9) });
      });
    });
    // Puerta del Sur (llegada de EL-02) con la casa de guardia y el gran tablero de tablillas
    const sur = [c[0], c[1] + CIUDAD.ry];
    poner("puertaSur", sur, { s: 1.2 }, "puerta_sur");
    poner("granTablero", [sur[0] + 230, sur[1] - 120], {}, "gran_tablero");
    poner("casaGuardia", px(-30, 98), {}, "casa_guardia");
    [-1, 1].forEach((l) => poner("estandarteCiervo", [sur[0] + l * 250, sur[1] + 40], { sem: l + 2 }));
    // Puerta del Norte: reja de hierro (el camino al Paso)
    poner("puertaNorte", [c[0], c[1] - CIUDAD.ry], {}, "puerta_norte");
    // las doce piedras de la cúpula: metidas en la empalizada, dos junto a la Puerta del Norte y dos junto a la
    // del Sur. Las que faltan están partidas; la cúpula se debilita.
    const dg = (CIUDAD.hueco + 420) / CIUDAD.rx;
    const ANCLAS = [
      [Math.PI / 2 - dg, "algiz", 1],
      [Math.PI / 2 + dg, "othala", 0.9],
      [-Math.PI / 2 - dg, "tiwaz", 1],
      [-Math.PI / 2 + dg, "berkano", 0.75],
      [0.4, "ingwaz", 0.45],
      [1.0, "laguz", 0.2],
      [2.14, "sowilo", 1],
      [2.74, "mannaz", 0],
      [-0.4, "dagaz", 0.6],
      [-1.0, "eihwaz", 0],
      [-2.14, "jera", 0.85],
      [-2.74, "raidho", 0.35],
    ];
    // (24/10/2026, como en la lámina: metidas en la línea de la empalizada, un poco más altas que los troncos)
    const anclas = [];
    ANCLAS.forEach(([a, runa, fuerza], i) => {
      const p = enMuro(a, MEDIO_MURO + 46);
      anclas.push(poner("piedraAncla", p, { runa, fuerza, sem: i, s: 1.45 }, "ancla" + i));
    });
    NOMBRADAS.anclas = anclas;
    // las runas enormes de la cúpula, sobre la curva invisible (las dibuja capital.js en el cielo)
    const rc = azar(1212);
    NOMBRADAS.runasCupula = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU + rc() * 0.3,
        d = 0.35 + rc() * 0.55,
        nom = FUTHARK.NOMBRES[Math.floor(rc() * FUTHARK.NOMBRES.length)],
        f = rc() < 0.2 ? 0 : 0.3 + rc() * 0.7;
      if (f > 0) NOMBRADAS.runasCupula.push({ x: c[0] + Math.cos(a) * CIUDAD.rx * d, y: c[1] + Math.sin(a) * CIUDAD.ry * d, alto: 700 + Math.sqrt(1 - d * d) * 900, runa: nom, fuerza: f, sem: i });
    }
    // el Roble gigante y la plaza
    poner("robleGigante", px(0, 0), { s: 2, copa: [1000, 2300, 1500] }, "roble");
    poner("tingCirculo", px(-34, 30), {}, "ting");
    [-1, 1].forEach((l) => poner("estandarteCiervo", px(-34 + l * 9, 25), { sem: l + 11 }));
    poner("pozoEikholt", px(30, 32), {}, "pozo");
    poner("campana", px(10, 24), {}, "campana");
    poner("tablonAvisos", px(-12, 22), {}, "tablon_avisos");
    [[-46, 8, 0], [-48, -14, 1], [46, 8, 2], [48, -12, 3], [-26, 16, 4], [26, 16, 5]].forEach(([dx, dy, v]) => poner("toldo", px(dx, dy), { v }));
    poner("camaHongos", px(-13, 9), { sem: 1 }, "camas_hongos");
    poner("camaHongos", px(13, 10), { sem: 2 });
    // Barrio de los Oficios (oeste y sudoeste)
    poner("herreriaAsa", px(-84, 20), {}, "herreria");
    poner("carpinteria", px(-86, 50), {}, "carpinteria");
    poner("cordeleriaFolke", px(-56, 66), {}, "cordeleria");
    poner("curtiembre", px(-118, 40), {}, "curtiembre");
    // Casa de Sanación (noroeste) con su jardín medicinal
    poner("casaSanacion", px(-66, -50), {}, "sanacion");
    poner("huerta", px(-94, -62), { sem: 3 });
    poner("estandarteCiervo", px(-48, -48), { sem: 13 });
    // Hongo Dorado (sudeste de la plaza): la casa más grande
    poner("hongoDorado", px(56, 46), {}, "hongo_dorado");
    // la Guardia del Roble (noreste) y su patio de práctica
    poner("casaNordica", px(56, -56), { v: 4, s: 1.2, pared: 2, techo: 0, postigo: 1, sem: 21, estandarte: true }, "guardia");
    [[90, -42], [99, -50], [84, -34]].forEach(([dx, dy]) => poner("munecoPaja", px(dx, dy)));
    // el corral de caravanas (borde norte): carretas varadas, bueyes y lonas
    {
      const a = px(16, -98),
        b = px(70, -78);
      poner("cerca", [a[0], b[1]], { x2: b[0], y2: b[1] });
      poner("cerca", a, { x2: a[0], y2: b[1] - 1 });
      poner("cerca", [b[0], a[1]], { x2: b[0], y2: b[1] - 1 });
      poner("carreta", px(28, -90), { v: 0 }, "carreta_grim");
      poner("carreta", px(54, -92), { v: 1 });
      poner("carreta", px(44, -84), { v: 2 });
      poner("buey", px(24, -82), { sem: 1 }, "buey");
      poner("buey", px(62, -84), { sem: 2, espejo: true });
    }
    // huertas del este
    poner("huerta", px(106, 8), { sem: 1 });
    poner("huerta", px(112, 32), { sem: 2 });
    poner("huerta", px(102, -18), { sem: 4 });
    // el barrio del río, afuera al noreste: el muelle de balsas (ruta a Brunvik por el agua)
    poner("muelle", m(872, 446), {}, "muelle");
    // las casas: genéricas en el borde, apretadas entre las calles; algunas se pueden entrar (farol en la puerta)
    {
      const r = azar(4471),
        ocupado = COSAS.filter((o) => o.choque && Math.abs(o.x - c[0]) < CIUDAD.rx && Math.abs(o.y - c[1]) < CIUDAD.ry && o.id !== "piedraAncla").map((o) => ({ x: o.x, y: o.y, w: (o.choque.w || o.choque.r * 2) / 2 + 120 }));
      const libreCasa = (x, y) => {
        const dx = (x - c[0]) / U,
          dy = (y - c[1]) / U;
        if (Math.abs(dx) < 17 || Math.abs(dy) < 11) return false; // las cuatro calles
        if ((dx / 66) ** 2 + ((dy - 8) / 52) ** 2 < 1) return false; // la plaza y el mercado
        if (dx > 90 && Math.abs(dy) < 46) return false; // las huertas
        if (dx > 10 && dx < 76 && dy < -74) return false; // el corral
        if (dx > 74 && dx < 108 && dy < -26 && dy > -60) return false; // el patio de la Guardia
        for (const [ex, ey] of [[-1, 0], [1, 0], [1.4, -0.9]]) {
          const qx = (x + ex * 230 - c[0]) / CIUDAD.rx,
            qy = (y + ey * 160 - c[1]) / CIUDAD.ry;
          if (qx * qx + qy * qy > 0.84) return false; // lejos de la empalizada
        }
        for (const o of ocupado) if (Math.abs(o.x - x) < o.w + 130 && Math.abs(o.y - y) < 270) return false;
        return true;
      };
      let n = 0;
      for (let k = 0; k < 3600 && n < 92; k++) {
        const a = r() * TAU,
          d = 0.3 + r() * 0.62,
          x = c[0] + Math.cos(a) * CIUDAD.rx * d,
          y = c[1] + Math.sin(a) * CIUDAD.ry * d;
        if (!libreCasa(x, y)) continue;
        const casa = poner("casaNordica", [x, y], { v: Math.floor(r() * 6), sem: k, s: 0.82 + r() * 0.16, entra: n % 4 === 1 });
        ocupado.push({ x, y, w: 190 * casa.o.s });
        n++;
      }
      // el bosque se mete en la ciudad: pinos, abedules y helechos entre las casas
      let a0 = 0;
      for (let k = 0; k < 2000 && a0 < 70; k++) {
        const a = r() * TAU,
          d = 0.25 + r() * 0.68,
          x = c[0] + Math.cos(a) * CIUDAD.rx * d,
          y = c[1] + Math.sin(a) * CIUDAD.ry * d,
          dx = (x - c[0]) / U,
          dy = (y - c[1]) / U;
        if (Math.abs(dx) < 14 || Math.abs(dy) < 9 || (dx / 62) ** 2 + ((dy - 8) / 48) ** 2 < 1) continue;
        if (COSAS.some((o) => o.choque && Math.abs(o.x - x) < 170 && Math.abs(o.y - y) < 90)) continue;
        if (COSAS.some((o) => o.id === "casaNordica" && Math.abs(o.x - x) < 260 && y - o.y < 60 && y - o.y > -200)) continue;
        const tipo = a0 % 5 === 4 ? "helechos" : a0 % 3 === 2 ? "abedul" : "pino";
        if (tipo === "helechos") poner(tipo, [x, y], { sem: k, sinChoque: true });
        else poner(tipo, [x, y], { s: 0.8 + r() * 0.35, sem: k });
        a0++;
      }
    }
    // faroles de las calles
    [[-20, 60], [20, 60], [-20, 92], [20, 84], [-60, -14], [60, -14], [-110, 14], [110, -14], [-20, -70], [20, -88], [-56, 14], [56, 14]].forEach(([dx, dy]) => poner("farol", px(dx, dy)));
    punto("eikholt", px(0, 80));
    punto("eydis_eikholt", px(-14, 40));
    punto("orm_eikholt", px(12, 44));
    punto("trab_eikholt", px(26, 50));
    punto("plaza", px(0, 34));
    punto("mirador", px(14, 6));
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
  // El Paso del Guardián (versión de Alejandro, 23/10/2026): la subida con el último farol apagado, el campamento de
  // la cuadrilla (dos lonas, fogón, tablones y sogas, el torno, la tabla con el puente dibujado), la cabecera sur con
  // el andamio, el pedestal y el tablón marcado, los dos pares de pilares antiguos, el poste de los que cruzaron y,
  // del otro lado, la caseta del puentero entre la niebla. La niebla y lo que cambia después de EL-06 lo lleva norte.js.
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
    // los pilares antiguos, a cada lado de las dos cabeceras
    const pilares = [];
    [[P.a, 1], [P.b, -1]].forEach(([e, k], j) =>
      [-1, 1].forEach((l) => pilares.push(poner("pilarAntiguo", mas(e, l * 2.3, k * 0.6), { sem: j * 2 + l, luz: 0.15, runas: j ? ["dagaz", "algiz"] : ["raidho", "algiz"] }))),
    );
    NOMBRADAS.pilares = pilares;
    // la cabecera sur: el andamio junto al tablero
    poner("andamio", mas(P.a, 3.2, 1.2), {}, "andamio");
    // el campamento de la cuadrilla
    poner("lonaCuadrilla", mas(sur, 7, -3), { sem: 1 });
    poner("lonaCuadrilla", mas(sur, 10.5, 0.5), { sem: 2, v: 1 });
    poner("fogonOlla", mas(sur, 7.5, 3.2), { apagado: false }, "fogon_paso");
    poner("pilaTablones", mas(sur, 12.5, 4.5), {}, "tablones");
    poner("tornoVigas", mas(P.a, 7.4, 2.6), {}, "torno");
    poner("tablaPuente", mas(sur, 5, -1.2), {}, "tabla_puente");
    // el poste de los que cruzaron, al pie de la cabecera
    poner("posteCruzaron", mas(P.a, -5.5, 8.5), {}, "poste_cruzaron");
    // el último farol de la subida, apagado hasta que el Paso vuelve a abrirse
    poner("posteFarol", mas(sur, -3, 13), { encendido: false }, "farol_paso");
    poner("posteFarol", mas(P.a, 2.4, 2.6), { encendido: false, sinChoque: true }, "farol_puente_s");
    poner("posteFarol", mas(P.b, -2.4, -0.4), { encendido: false, sinChoque: true }, "farol_puente_n");
    // del otro lado: la caseta del puentero y el camino que se pierde cuesta arriba
    poner("casetaPuentero", mas(P.b, 4.5, -3), {}, "caseta");
    punto("caseta", mas(P.b, 3.5, -2));
    punto("guardia_paso_a", mas(P.a, -3.4, 1.6));
    punto("guardia_paso_b", mas(P.a, -1.8, 5.6));
  })();
  // La Antigua tala y la quebrada de rastreo (versión de Alejandro, 23/10/2026): los tocones con la marca de los
  // leñadores y sus fechas, la raíz atada, el muro de raíces vivas que cierra la quebrada (se abre con el favor del
  // custodio), el canal de arrastre hacia la hondonada del gran tocón de linde (la piedra, la cuña, el custodio), la
  // cabaña de los leñadores con la caja bajo el banco, el tronco de la quilla, y en la quebrada los raspones de
  // cornamenta, el escondite de los guardasendas y el menhir.
  (function () {
    const c = LUGARES.tala.p;
    const tocones = [];
    for (let i = 0; i < 9; i++) {
      const r = (4 + (i % 3) * 2.6) * M,
        a = i * 1.9 + 0.3;
      tocones.push(poner("toconMarcado", [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * 0.8], { sem: i, k: i }, "tocon" + i));
    }
    NOMBRADAS.tocones = tocones;
    poner("troncoCaido", mas(c, -3, 6), { s: 1.4 }, "tronco_quilla");
    poner("raizMarcada", mas(c, 2.5, -4), {}, "raiz");
    punto("raiz", mas(c, 2.5, -3));
    poner("cabanaLenadores", mas(c, 9, -5), {}, "cabana");
    punto("caja", mas(c, 9.6, -4.2));
    // el muro de raíces: entre la tala y la quebrada
    const q = LUGARES.quebrada_rastreo.p;
    const muro = [(c[0] + q[0]) / 2 + 1.5 * M, (c[1] + q[1]) / 2 + 0.5 * M];
    poner("muroRaices", muro, { abierto: false }, "muro_raices");
    punto("muro_raices", [muro[0] + 2 * M, muro[1] + 2 * M]);
    // las raíces siguen a los dos lados: hasta el borde de la quebrada al norte y una buena distancia al sur
    const norte = 2600,
      surM = muro[1] + 22 * M;
    pintarLinea([[muro[0], norte], [muro[0], muro[1] - 6.6 * M]], 2.2 * M, 3);
    pintarLinea([[muro[0], muro[1] + 0.3 * M], [muro[0], surM]], 2.2 * M, 3);
    for (let y = norte + 2 * M; y < surM; y += 3.4 * M) if (Math.abs(y - muro[1]) > 4.5 * M) poner("muroRaices", [muro[0] + ((y / M) % 2) * 20, y], { abierto: false, s: 0.55, sinChoque: true, sem: Math.round(y) });
    // la hondonada del gran tocón, fuera de la senda, al sur de la tala, con el canal de arrastre que baja hasta ella
    const hon = mas(c, -4, 13);
    poner("granTocon", hon, { cuna: true }, "gran_tocon");
    RECINTOS.push([hon[0] - 7 * M, hon[1] - 5 * M, hon[0] + 7 * M, hon[1] + 7 * M]);
    RECINTOS.push([Math.min(c[0], hon[0]) - 2 * M, c[1], Math.max(c[0], hon[0]) + 1 * M, hon[1]]);
    punto("hondonada", mas(hon, 2.5, 2.2));
    punto("custodio", mas(hon, -1, 4.5));
    poner("rastro", mas(c, -1, 4), { x2: hon[0] + 1 * M, y2: hon[1] - 3 * M, tipo: "buey", piso: true, sinChoque: true });
    for (let k = 0; k < 6; k++) poner("helechos", mas(c, -1.6 - k * 0.5 + (k % 2) * 1.2, 5 + k * 1.3), { sem: k + 40, sinChoque: true });
    // la quebrada: raspones (los muestra la Lente), el escondite de los guardasendas y el menhir
    poner("menhirRastro", mas(q, 1, -4), {}, "menhir");
    punto("menhir", mas(q, 1, -3));
    punto("raspones", mas(q, 4, -1));
    punto("escondite", mas(q, 3, 3));
    poner("roca", mas(q, 3.6, 3.6), { s: 1.3, sem: 5 }, "escondite_roca");
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
    // la cuenca épica (Alejandro, 23/10/2026): paredes de roca y árboles gigantes afuera, la columnata de astas
    // adentro (viejas y altas, crecidas con raíces, alternadas con nuevas a ras del suelo), la entrada al este con la
    // escalera de raíces. Las manchas enfermas rodean cada menhir; la cama de musgo queda al fondo.
    const entra = Math.atan2(LUGARES.claro_entrada.p[1] - c[1], LUGARES.claro_entrada.p[0] - c[0]);
    const fueraEntrada = (a, ancho) => Math.abs(Math.atan2(Math.sin(a - entra), Math.cos(a - entra))) > ancho;
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * TAU;
      if (!fueraEntrada(a, 0.38)) continue;
      poner("paredRoca", [c[0] + Math.cos(a) * 37 * M, c[1] + Math.sin(a) * 32 * M], { sem: i, s: 1.15 });
    }
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * TAU + 0.12;
      if (!fueraEntrada(a, 0.42)) continue;
      poner(i % 3 ? "abetoAnciano" : "robleAnciano", [c[0] + Math.cos(a) * 33 * M, c[1] + Math.sin(a) * 28.5 * M], { s: 1.6, h: 900, sem: i });
    }
    const arcos = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU + 0.2;
      if (!fueraEntrada(a, 0.3)) continue;
      arcos.push(poner("arcoAstas", [c[0] + Math.cos(a) * 26.5 * M, c[1] + Math.sin(a) * 22.5 * M], { viejo: i % 2 === 0, sem: i, s: i % 2 ? 1 : 1.25, cinta: i === 9 }, i === 9 ? "arco_cinta" : undefined));
    }
    NOMBRADAS.arcos = arcos;
    punto("cinta", [arcos.find((x) => x.o.cinta).x, arcos.find((x) => x.o.cinta).y + 30]);
    NOMBRADAS.manchas = sop.map((sp, i) => poner("manchaEnferma", [sp.x, sp.y + 20], { sem: i + 3, piso: true, sinChoque: true }));
    const cama = [c[0] - 20 * M, c[1] + 6 * M];
    poner("camaMusgo", cama, { piso: true, sinChoque: true }, "cama_musgo");
    punto("cama_musgo", cama);
    const ent = LUGARES.claro_entrada.p;
    poner("escaleraRaices", mas(ent, -6, 1), { s: 1.2 }, "escalera_raices");
    // la loma de los observadores: un desvío que sube al norte de la entrada, con el apostadero y su cofre
    const loma = mas(ent, -2, -10);
    poner("apostadero", loma, {}, "apostadero");
    punto("apostadero", mas(loma, 1.5, 0.8));
    RECINTOS.push([loma[0] - 5 * M, loma[1] - 4 * M, loma[0] + 5 * M, loma[1] + 3 * M]);
    // la fisura del norte, donde se pierde el filamento
    const fis = [c[0] + 4 * M, c[1] - 27 * M];
    poner("fisura", fis, {}, "fisura");
    punto("hilo", [sop[0].x, sop[0].y + 40]);
  })();
  // El Aserradero de Orm (Alejandro, 23/10/2026): el taller de la familia sobre el río, de unos 45 m. La rueda con su
  // canaleta y el canal con la compuerta junto a la orilla; el galpón de la sierra con el dintel tallado; el patio de
  // troncos con la marca; el torno con la rampa que baja al barro de la orilla (ahí quedó hundido el buey); la casa
  // de Orm con el banco, la leñera y el corral; el fogón (reaparición de EL-07) y la grada de la quilla (2.ª visita).
  (function () {
    const c = LUGARES.aserradero.p;
    poner("galponSierra", mas(c, 0.4, -3), {}, "galpon");
    punto("dintel", mas(c, 0.4, -2));
    poner("ruedaAgua", mas(c, 7.3, -3.5), { gira: false }, "rueda");
    const toma = mas(c, 9.3, -12.2),
      boca = mas(c, 8.1, -4.8);
    poner("canal", toma, { x2: boca[0], y2: boca[1], piso: true, sinChoque: true }, "canal");
    pintarLinea([toma, boca], 80, 1);
    poner("compuerta", mas(c, 8.7, -9.4), { abierta: false, sinChoque: true }, "compuerta");
    punto("compuerta", mas(c, 7.1, -9));
    poner("pilaTroncos", mas(c, -3, -8), { sem: 1 });
    poner("pilaTroncos", mas(c, 0.5, -10), { sem: 2, filas: 2 });
    poner("pilaTroncos", mas(c, -6.8, -4.6), { sem: 3, filas: 2, s: 0.9 });
    poner("tornoRampa", mas(c, 4.2, -14.6), {}, "torno_buey");
    punto("torno_buey", mas(c, 3.4, -13.6));
    // la orilla de barro con el buey hundido (y el corral, donde queda después)
    poner("barro", mas(c, 8.6, -15.6), { s: 2.2, sem: 4, piso: true, sinChoque: true });
    poner("bueyBarro", mas(c, 8.6, -15.4), { hundido: 1, sinChoque: true }, "buey_barro");
    punto("buey_barro", mas(c, 7.6, -14.2));
    punto("lobos_buey", mas(c, 5, -18.5));
    poner("casaNordica", mas(c, -9, 1), { v: 1, s: 0.85, pared: 0, techo: 2, sem: 7 }, "casa_orm");
    poner("bancoTaco", mas(c, -6.4, 4.2), {}, "banco_orm");
    poner("lenera", mas(c, -13.6, 2.6));
    const co = mas(c, -13, 6.4),
      cw = 7 * M,
      chh = 4.6 * M;
    poner("cerca", co, { x2: co[0] + cw * 0.4, y2: co[1] });
    poner("cerca", [co[0] + cw * 0.65, co[1]], { x2: co[0] + cw, y2: co[1] });
    poner("cerca", [co[0], co[1] + chh], { x2: co[0] + cw, y2: co[1] + chh });
    poner("cerca", co, { x2: co[0], y2: co[1] + chh, sinChoque: true });
    poner("cerca", [co[0] + cw, co[1]], { x2: co[0] + cw, y2: co[1] + chh, sinChoque: true });
    pintarLinea([co, [co[0], co[1] + chh]], 30, 3);
    pintarLinea([[co[0] + cw, co[1]], [co[0] + cw, co[1] + chh]], 30, 3);
    poner("buey", mas(c, -10, 9), { sem: 5 }, "buey_corral").oculto = true;
    poner("fogonOlla", mas(c, -1, 7), {}, "fogon_aserradero");
    punto("aserradero", mas(c, -3, 9));
    punto("ylva", mas(c, -2, 0.8));
    punto("ylva_compuerta", mas(c, 6.6, -8.2));
    punto("orm_aserradero", mas(c, 3.2, 5.6));
    poner("posteFarol", mas(c, 4.5, 6.2), { encendido: true });
    poner("posteFarol", mas(c, -5, -1.5), { encendido: true });
    const grada = poner("gradaQuilla", mas(c, 5.2, 3.4), { enfermas: true, s: 0.9 }, "grada");
    grada.oculto = true;
    grada.roto = true;
    RECINTOS.push([c[0] - 16 * M, c[1] - 20 * M, c[0] + 12 * M, c[1] + 12 * M]);
  })();
  // Puentes del este; el oriental va sobre pilares de piedra mucho más viejos que el tablero, con runas casi apagadas
  [PUENTES[1], PUENTES[2], PUENTES[3]].forEach((p) => poner("puenteTablas", p.a, { x2: p.b[0], y2: p.b[1], sinChoque: true, piso: true }));
  (function () {
    const p = PUENTES[2],
      dx = p.b[0] - p.a[0],
      dy = p.b[1] - p.a[1],
      l = Math.hypot(dx, dy),
      nx = -dy / l,
      ny = dx / l,
      off = p.ancho / 2 + 14;
    const pil = [];
    [0.18, 0.5, 0.82].forEach((u, i) =>
      [-1, 1].forEach((sd) =>
        pil.push(poner("pilarAntiguo", [p.a[0] + dx * u + nx * off * sd, p.a[1] + dy * u + ny * off * sd], { s: 0.8, sinChoque: true, luz: 0.12, sem: i * 2 + sd, runas: i % 2 ? ["raidho", "algiz"] : ["othala", "ehwaz"] }))
      )
    );
    NOMBRADAS.pilares_oriental = pil;
    // el cofre de abajo del puente, entre los pilares: solo lo muestra la Lente
    const cp = [p.a[0] + dx * 0.1 + nx * 130, p.a[1] + dy * 0.1 + ny * 130];
    poner("arconLenador", cp, { s: 1.1 }, "cofre_puente").oculto = true;
    punto("cofre_puente", [cp[0], cp[1] + 40]);
  })();
  // El Santuario de las Raíces (Alejandro, 23/10/2026): una ladera de unos 60 m. Del puente oriental sube un sendero
  // de escalones comidos por raíces, con estelas a los costados (tres se encienden al pasar). Arriba, la explanada:
  // el portal de piedra encajado en la base de un árbol colosal, los restos con las zarzas espectrales que tejen la
  // red sobre la puerta y el sello al alcance de la mano. A un costado, la loma del mirador con el cofre de zarzas.
  (function () {
    const c = LUGARES.santuario.p,
      ux = -0.925,
      uy = 0.381,
      en = (d, lado) => [c[0] + ux * d * M - uy * lado * M, c[1] + uy * d * M + ux * lado * M];
    const a = en(25, 0),
      b = en(4.5, 0);
    poner("escalonesRaices", a, { x2: b[0], y2: b[1], ancho: 110, sem: 3, piso: true, sinChoque: true });
    const runas = ["algiz", "othala", "ehwaz", "eihwaz", "dagaz", "ingwaz", "laguz", "mannaz"];
    NOMBRADAS.estelas = [6.5, 9, 11.5, 14, 16.5, 19, 21.5, 24].map((d, i) =>
      poner("estela", en(d, i % 2 ? 2.7 : -2.7), { runa: runas[i], inclina: ((i * 7) % 5) - 2, s: 0.9 + (i % 3) * 0.08, despierta: i === 2 || i === 4 || i === 5, luz: 0 })
    );
    const portal = mas(c, 1, -6);
    poner("arbolPortal", portal, { visto: false, sinChoque: true }, "santuario");
    pintarLinea([[portal[0] - 560, portal[1] - 50], [portal[0] + 580, portal[1] - 50]], 120, 3);
    const restos = mas(c, 1, -4.1);
    poner("restosZarzas", restos, { sinChoque: true }, "zarzas_santuario");
    pintarLinea([[restos[0] - 240, restos[1] - 20], [restos[0] + 240, restos[1] - 20]], 60, 3);
    poner("selloPiedra", mas(c, 1, -2.3), { visto: false }, "sello");
    punto("santuario", mas(c, -4, 4));
    punto("sello", mas(c, 1, -1.2));
    // la loma del mirador, separada de la puerta
    const loma = mas(c, -15, -9);
    poner("lomaMirador", loma, { r: 300, lado: 1, piso: true, sinChoque: true });
    [0.9, 1.5, 2.1, 2.7, 3.3, 3.9, 4.6].forEach((ang, i) =>
      poner("roca", [loma[0] + Math.cos(ang) * 320, loma[1] + Math.sin(ang) * 150 + 20], { s: 0.55 + (i % 3) * 0.12, sem: 30 + i })
    );
    poner("cofreZarzas", mas(loma, -1.4, -0.8), {}, "cofre_zarzas");
    punto("cofre_zarzas", mas(loma, -1.4, 0.4));
    punto("mirador_santuario", mas(loma, 1.2, 0.4));
    poner("escalonesRaices", mas(loma, 8.6, 3.6), { x2: mas(c, -5, -1)[0], y2: mas(c, -5, -1)[1], ancho: 70, sem: 9, piso: true, sinChoque: true });
    RECINTOS.push([loma[0] - 7 * M, loma[1] - 5 * M, c[0] + 10 * M, c[1] + 6 * M]);
  })();
  // Las guaridas de los semijefes («Eldervald — etapas»): el nido del lobo viejo de zarzal al oeste del carro y la
  // cueva de la loba madre en la ladera sur de la quebrada, al este del Paso. Un claro en el bosque para pelear.
  (function () {
    const lv = mas(LUGARES.carro.p, -16, 5);
    poner("nidoZarzal", lv, { sem: 4, sinChoque: true });
    [0, 1, 2, 3, 4].forEach((i) => poner("zarzas", [lv[0] + Math.cos(i * 1.3) * 9 * M, lv[1] + Math.sin(i * 1.3) * 6 * M], { sem: 60 + i }));
    punto("semi_lobo_viejo", mas(lv, 0, 1));
    RECINTOS.push([lv[0] - 11 * M, lv[1] - 8 * M, lv[0] + 11 * M, lv[1] + 8 * M]);
    const cv = m(655, 214);
    poner("bocaCueva", cv, { sem: 7 }, "cueva_loba");
    poner("roca", mas(cv, -7, 1), { s: 0.9, sem: 71 });
    poner("roca", mas(cv, 7.5, 0.5), { s: 0.75, sem: 72 });
    punto("semi_loba", mas(cv, 0, 6));
    RECINTOS.push([cv[0] - 12 * M, cv[1] - 3 * M, cv[0] + 12 * M, cv[1] + 14 * M]);
    // la huldra espera al borde del claro del Puesto; los lobos con la campana, en un claro de zarzas más al oeste
    punto("huldra", mas(LUGARES.puesto.p, -12.5, -3));
    const lh = mas(LUGARES.puesto.p, -36, -16);
    punto("lobos_huldra", lh);
    [0, 1, 2].forEach((i) => poner("zarzas", [lh[0] + Math.cos(i * 2.1 + 0.4) * 7 * M, lh[1] + Math.sin(i * 2.1 + 0.4) * 5 * M], { sem: 80 + i }));
    RECINTOS.push([lh[0] - 9 * M, lh[1] - 7 * M, lh[0] + 9 * M, lh[1] + 7 * M]);
  })();
  // faroles y piedras de linde de los caminos (las de orientación)
  [[560, 690], [700, 414], [520, 530], [575, 300], [900, 540], [1010, 420], [1265, 300], [200, 880]].forEach((p) => poner("farol", mas(m(p[0], p[1]), 3.2, 0)));
  [[470, 745], [612, 360], [540, 250], [470, 240], [955, 470], [1150, 350], [1330, 250], [985, 585], [300, 860]].forEach((p, i) => poner("piedraLinde", mas(m(p[0], p[1]), -3.5, 2.5), { sem: i * 5 }));
  // los caminos quedan limpios: un farol o una piedra de linde que cayó sobre un camino se corre al borde
  function alBorde(o, margen) {
    for (const cm of CAMINOS) {
      let mejor = null;
      for (let i = 1; i < cm.p.length; i++) {
        const [ax, ay] = cm.p[i - 1],
          [bx, by] = cm.p[i],
          dx = bx - ax,
          dy = by - ay,
          l2 = dx * dx + dy * dy;
        const u = Math.max(0, Math.min(1, l2 ? ((o.x - ax) * dx + (o.y - ay) * dy) / l2 : 0));
        const qx = ax + dx * u,
          qy = ay + dy * u,
          d = Math.hypot(o.x - qx, o.y - qy);
        if (!mejor || d < mejor.d) mejor = { d, qx, qy, nx: -dy, ny: dx };
      }
      const lim = cm.w / 2 + margen;
      if (!mejor || mejor.d >= lim) continue;
      let vx = o.x - mejor.qx,
        vy = o.y - mejor.qy;
      if (Math.hypot(vx, vy) < 1) (vx = mejor.nx), (vy = mejor.ny);
      const l = Math.hypot(vx, vy);
      o.x = mejor.qx + (vx / l) * lim;
      o.y = mejor.qy + (vy / l) * lim;
    }
  }
  COSAS.forEach((o) => (o.id === "farol" || o.id === "piedraLinde") && alBorde(o, o.id === "farol" ? 34 : 40));

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
    for (const r of RECINTOS) if (x > r[0] - margen && x < r[2] + margen && y > r[1] - margen && y < r[3] + margen) return false;
    for (const c of CAMINOS) if (distLinea(x, y, c.p) < c.w / 2 + margen) return false;
    for (const k in LUGARES) {
      const L = LUGARES[k];
      if (Math.hypot(x - L.p[0], (y - L.p[1]) * 1.15) < L.r + margen) return false;
    }
    for (const p of PUENTES) if (distSeg(x, y, p.a[0], p.a[1], p.b[0], p.b[1]) < 160) return false;
    const g = suelo[Math.floor(y / CELDA) * GW + Math.floor(x / CELDA)];
    if (g === 1 || g === 2) return false;
    for (const r of RIOS) if (!r.seco && distLinea(x, y, r.p) < r.w / 2 + 40) return false;
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

  // ---------- lo que se agregó o se sacó en el editor (editor.html → js/mundo/agregados.js) ----------
  // Se aplica con el bosque ya armado, así el resto del mundo no cambia: lo sacado se busca por asset y lugar, y lo
  // agregado aparta los árboles que le quedan encima.
  {
    const AG = window.AGREGADOS || {};
    // el agua: lo de base que se secó queda en su lista marcado (hordas.js y secretos.js buscan LAGOS[1] y [2]) y los
    // ríos y lagunas agregados se suman al final; lo que les queda adentro se saca (menos lo de la historia), y donde
    // un camino cruza agua agregada queda un vado. Los puentes agregados también se cruzan.
    (AG.quitarRios || []).forEach((i) => RIOS[i] && (RIOS[i].seco = true));
    (AG.quitarLagos || []).forEach((i) => LAGOS[i] && (LAGOS[i].seco = true));
    (AG.rios || []).forEach((r) => r.p && r.p.length > 1 && RIOS.push({ p: r.p, w: r.w || 300, agregado: true }));
    (AG.lagos || []).forEach((l) => LAGOS.push({ p: [l.x, l.y], rx: l.rx || 600, ry: l.ry || 400, agregado: true }));
    (AG.poner || []).forEach((a, i) => {
      if ((a.id === "puenteTablas" || a.id === "puentePaso") && a.o && a.o.x2 !== undefined) {
        PUENTES.push({ id: "agregado" + i, a: [a.x, a.y], b: [a.o.x2, a.o.y2], ancho: 3.2 * M * ((a.o.esc || 1) * (a.o.ey || 1)) });
        puenteSano["agregado" + i] = true;
      }
    });
    if ((AG.quitarRios || []).length || (AG.quitarLagos || []).length || (AG.rios || []).length || (AG.lagos || []).length) {
      pintarAgua();
      const historia = new Set();
      Object.values(NOMBRADAS).forEach((v) => (Array.isArray(v) ? v : [v]).forEach((x) => x && historia.add(x)));
      const mojado = (x, y) => sueloEnInicial(x, y) === 1 && !enPuente(x, y);
      for (let i = COSAS.length - 1; i >= 0; i--) if (!COSAS[i].o.piso && !historia.has(COSAS[i]) && mojado(COSAS[i].x, COSAS[i].y)) COSAS.splice(i, 1);
      for (let i = DECO.length - 1; i >= 0; i--) if (mojado(DECO[i].x, DECO[i].y)) DECO.splice(i, 1);
      for (let i = BARROS.length - 1; i >= 0; i--) if (mojado(BARROS[i].x, BARROS[i].y)) BARROS.splice(i, 1);
    }
    // los caminos de base que se sacaron (con sus charcos)
    const sacados = AG.quitarCaminos || [];
    for (let i = CAMINOS.length - 1; i >= 0; i--) {
      const cm = CAMINOS[i];
      if (cm.agregado || !sacados.includes(cm.sem)) continue;
      CAMINOS.splice(i, 1);
      const enCamino = (d) => d.id === "barro" && distLinea(d.x, d.y, cm.p) < cm.w;
      for (let k = DECO.length - 1; k >= 0; k--) if (enCamino(DECO[k])) DECO.splice(k, 1);
      for (let k = BARROS.length - 1; k >= 0; k--) if (enCamino({ id: "barro", x: BARROS[k].x, y: BARROS[k].y })) BARROS.splice(k, 1);
    }
    // los caminos de base a los que se les cambió el recorrido en el editor: se corren y apartan el bosque
    (AG.estiloCaminos || []).forEach((e) => {
      const cm = e.p && CAMINOS.find((c) => !c.agregado && c.sem === e.i);
      if (!cm || e.p.length < 2) return;
      cm.p = e.p;
      const lejos = (o) => distLinea(o.x, o.y, cm.p) > cm.w / 2 + 50;
      for (let i = COSAS.length - 1; i >= 0; i--) if (COSAS[i].arbol && !lejos(COSAS[i])) COSAS.splice(i, 1);
      for (let i = DECO.length - 1; i >= 0; i--) if (DECO[i].id !== "barro" && !lejos(DECO[i])) DECO.splice(i, 1);
    });
    // lo pintado en el piso que se sacó (charcos de barro, musgo, helechos, hongos)
    (AG.quitarDeco || []).forEach((q) => {
      const es = (d) => d.id === q.id && Math.abs(d.x - q.x) < 6 && Math.abs(d.y - q.y) < 6;
      for (let i = DECO.length - 1; i >= 0; i--) if (es(DECO[i])) DECO.splice(i, 1);
      for (let i = BARROS.length - 1; i >= 0; i--) if (es(BARROS[i])) BARROS.splice(i, 1);
    });
    (AG.quitar || []).forEach((q) => {
      for (let i = COSAS.length - 1; i >= 0; i--) {
        const c = COSAS[i];
        if (c.id === q.id && Math.abs(c.x - q.x) < 6 && Math.abs(c.y - q.y) < 6) COSAS.splice(i, 1);
      }
    });
    // lo movido (también lo de la historia) se corre en el lugar, así lo que lo busca por nombre lo sigue
    // encontrando; la gente y los objetivos que estaban pegados a eso se corren con él
    const apartarBosque = (c, x, y) => {
      const ancho = c.choque ? (c.choque.w ? c.choque.w / 2 : c.choque.r * 1.3) + 40 : 0;
      if (!ancho) return;
      for (let i = COSAS.length - 1; i >= 0; i--) {
        const t = COSAS[i];
        if (t.arbol && Math.abs(t.x - x) < ancho && t.y > y - 120 && t.y < y + 60) COSAS.splice(i, 1);
      }
    };
    (AG.mover || []).forEach((m) => {
      const c = COSAS.find((o) => o.id === m.id && Math.abs(o.x - m.x) < 6 && Math.abs(o.y - m.y) < 6);
      if (!c) return;
      const dx = m.nx - c.x,
        dy = m.ny - c.y,
        r = (c.choque ? (c.choque.w ? c.choque.w / 2 : c.choque.r) : 0) + 140;
      for (const k in PUNTOS) {
        const p = PUNTOS[k];
        if (Array.isArray(p) && Math.hypot(p[0] - c.x, p[1] - c.y) < r) PUNTOS[k] = [p[0] + dx, p[1] + dy];
      }
      c.x = m.nx;
      c.y = m.ny;
      if (c.o.x2 !== undefined) (c.o.x2 += dx), (c.o.y2 += dy);
      if (m.o) {
        // tamaño, proporciones y espejado elegidos en el editor
        Object.assign(c.o, m.o);
        Object.assign(c, ASSETS.medidas(c.id, c.o));
      }
      c.movido = true;
      apartarBosque(c, c.x, c.y);
    });
    (AG.poner || []).forEach((a) => {
      const def = ASSETS.LISTA[a.id];
      if (!def) return;
      const o = Object.assign({}, a.o || {});
      if (def.piso) o.piso = true;
      const c = poner(a.id, [a.x, a.y], o);
      c.agregado = true;
      if (a.id === "barro") BARROS.push({ x: a.x, y: a.y, s: (o.s || 1) * (o.esc || 1) }); // el barro agregado también frena
      const ancho = c.choque ? (c.choque.w ? c.choque.w / 2 : c.choque.r * 1.3) + 40 : 0;
      if (!ancho) return;
      for (let i = COSAS.length - 1; i >= 0; i--) {
        const t = COSAS[i];
        if (t.arbol && Math.abs(t.x - a.x) < ancho && t.y > a.y - 120 && t.y < a.y + 60) COSAS.splice(i, 1);
      }
    });
  }

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
  // lugares fuera del mapa que arma un sistema (la cámara del sótano y las raíces de Góinn): { x0, y0, x1, y1, libre }
  const EXTRAS = [];
  function libre(x, y, r = 14) {
    for (const z of EXTRAS) if (x >= z.x0 && x <= z.x1 && y >= z.y0 && y <= z.y1) return z.libre(x, y, r);
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
  // las cercas de troncos frenan a Eromash pero se saltan (juego.js no la mira mientras salta). ¿Pasar de a hacia b
  // la cruza, o se mete en su franja acercándose? (si ya está adentro, puede salir)
  let VALLAS = null;
  function vallaEntre(ax, ay, bx, by, r) {
    if (!VALLAS) VALLAS = COSAS.filter((c) => c.id === "cerca" && c.o.x2 !== undefined && !c.o.sinChoque).map((c) => [c.x, c.y, c.o.x2, c.o.y2]);
    const franja = r * 0.5 + 8;
    for (const [x1, y1, x2, y2] of VALLAS) {
      if (Math.max(ax, bx) < Math.min(x1, x2) - 60 || Math.min(ax, bx) > Math.max(x1, x2) + 60 || Math.max(ay, by) < Math.min(y1, y2) - 60 || Math.min(ay, by) > Math.max(y1, y2) + 60) continue;
      const db = distSeg(bx, by, x1, y1, x2, y2);
      if (db < franja && db < distSeg(ax, ay, x1, y1, x2, y2)) return true;
      // cruzar la línea de un paso (de un lado al otro)
      const lado = (px, py) => (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1),
        la = lado(ax, ay),
        lb = lado(bx, by);
      if (la * lb < 0) {
        const l1 = (bx - ax) * (y1 - ay) - (by - ay) * (x1 - ax),
          l2 = (bx - ax) * (y2 - ay) - (by - ay) * (x2 - ax);
        if (l1 * l2 <= 0) return true;
      }
    }
    return false;
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
      if (rio.seco) return;
      trazo(c, rio.p, rio.w + 70, "#2E3324");
      trazo(c, rio.p, rio.w + 30, "#4A4A3A");
      trazo(c, rio.p, rio.w, "#2A4C56");
      trazo(c, rio.p, rio.w * 0.55, "#30586A");
      trazo(c, rio.p, rio.w * 0.12, "#3E6E7E");
    });
    // lagunas
    LAGOS.forEach((l) => {
      if (l.seco || l.p[0] + l.rx + 200 < x0 || l.p[0] - l.rx - 200 > x1 || l.p[1] + l.ry + 200 < y0 || l.p[1] - l.ry - 200 > y1) return;
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
      const calles = [[[cx, cy], [cx, cy + CIUDAD.ry + 40]], [[cx, cy], [cx - CIUDAD.rx - 40, cy]], [[cx, cy], [cx + CIUDAD.rx + 40, cy]], [[cx, cy], [cx, cy - CIUDAD.ry - 40]]];
      calles.forEach((cl) => {
        trazo(c, cl, 190, "#3A3022");
        trazo(c, cl, 160, "#5C4A32");
      });
      // la plaza del Roble: tierra con losas alrededor del tronco
      const jp = [1, 0.9, 1.06, 0.94, 1.02, 0.88, 1.05, 0.96];
      P(c, poli(cx, cy + 160, 1360, 1040, 32, 0.1, jp), "#3A3022");
      P(c, poli(cx, cy + 160, 1310, 1000, 32, 0.1, jp), "#5C4A32");
      const rl = azar(91);
      for (let k = 0; k < 130; k++) {
        const a = rl() * TAU,
          d = 420 + rl() * 760;
        P(c, poli(cx + Math.cos(a) * d, cy + 160 + Math.sin(a) * d * 0.72, 26 + rl() * 14, 12 + rl() * 6, 6, rl()), rl() < 0.5 ? "#6E6458" : "#5E564C");
      }
      for (let k = 0; k < 30; k++) E(c, cx + (rl() - 0.5) * 1700, cy + 260 + (rl() - 0.5) * 1000, 30 + rl() * 40, 10 + rl() * 12, "#465030");
    }
    // caminos: tierra pisada, adoquín o ladrillo, con sus bordes y puntas (mundo/caminos.js)
    // de a capas (bases, cuerpos, bordes) para que se unan cuando se cruzan o se tocan
    ["base", "cuerpo", "borde"].forEach((capa) => CAMINOS.forEach((cm) => SENDAS.pintar(c, cm, cm.sem || 0, x0, y0, x1, y1, capa, CAMINOS)));
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
  // todo: pinta todos los trozos que falten de una vez (el editor, al armar su vista de lejos)
  function dibujarPiso(c, x0, y0, x1, y1, esc, todo) {
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
          if (pintados > 2 && cache.size && !todo) continue; // no más de 3 por cuadro: evita tirones al llegar a otra zona
          cv = pintarTrozo(tx, ty, esc);
          pintados++;
          cache.set(k, cv);
          if (cache.size > 120) cache.delete(cache.keys().next().value);
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
    m, mas, libre, vallaEntre, hayMuro, NIVELES, ESCALA_CASA, cercanas, dibujarPiso, invalidar, repararPuente, distLinea, agregar, sueloEn, libreDeTodo, ruido, BORDE, EXTRAS,
  };
})();
