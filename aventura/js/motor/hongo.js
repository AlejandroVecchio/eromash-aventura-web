// ---------- el Hongo Dorado por dentro (sistema HONGO) ----------
// La hospedería del sudeste de la plaza de Eikholt, como en la página 051 del compendio: una sala grande de dos pisos con
// la galería de los cuartos arriba, el fogón en el medio con su campana de cobre en forma de hongo, la barra de Ulf con
// el estante de jarras y los toneles de las aldeas, mesas largas, la tarima del skald, estandartes de la cornamenta y
// hongos dorados que crecen solos en las vigas. Ahí se junta la gente de Eikholt con la de todo el mundo que recorre las
// tierras: forasteros varados porque el Paso está cerrado, un dvergr, una álfr, un medio jötunn, el nisse de la casa y
// aventureros como Eromash (personajes/viajeros.js). De día hay menos gente; de noche se llena, Tyra ayuda a servir y
// Sølve canta en la tarima.
// Se arma pensada para la vista de 30° (todo girable): la sala es un volumen con sus caras, el piso gira, las paredes
// que tapan se cortan como en una casa de muñecas y la galería de una pared se esconde si esa pared queda adelante.
// Z / X giran, acercar / alejar (o la rueda) acercan. INTERIORES.entrar le pasa la puerta del Hongo Dorado; la trampilla
// de atrás de la barra baja a la bodega de siempre (la puerta de Góinn) con INTERIORES.bajarDesde.
// Medidas de los interiores: la gente mide unos 230 (GENTE a 2,75), 1 m ≈ 128.
window.HONGO = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const { P, E, R, L, alfa } = DIB;
  const TAU = Math.PI * 2;
  const corto = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  let A, J, jug, H;
  let st = null; // E.extra.hongo

  // ---------- la sala ----------
  const HX = 1700, // medio ancho (oeste a este)
    HY = 1200, // medio fondo (norte a sur)
    ZG = 480, // el piso de la galería
    ZT = 900, // lo alto de las paredes
    GN = -900, // el borde de la galería norte
    GO = -1400, // el borde de la galería oeste
    GO_SUR = 300, // hasta dónde llega la galería oeste
    GN_ESTE = 700, // hasta dónde llega la galería norte (después viene la escalera)
    GK = 2.75; // el tamaño de la gente
  const PUERTA = { x: -700, y: HY };
  const FOGON = { x: 0, y: 120 };
  const BARRA = { x: -850, y: -760, largo: 500 };
  const TARIMA = { x: 1150, y: -650 };
  const TRAMPILLA = { x: -210, y: -880 }; // detrás de la punta de la barra, junto a los toneles
  const ESCALERA = { x0: 760, x1: 1500, y0: -HY, y1: -1050 };
  const POSTES_N = [-1400, -850, -300, 250, 700],
    POSTES_O = [-350, 300];
  const MESAS = [
    { id: "mesaLarga", x: -850, y: 200, o: { sem: 1, largo: 450 } },
    { id: "mesaLarga", x: -850, y: 680, o: { sem: 2, largo: 450 } },
    { id: "mesaLarga", x: 850, y: 230, o: { sem: 3, largo: 450 } },
    { id: "mesaLarga", x: 850, y: 700, o: { sem: 4, largo: 450 } },
  ];
  const REDONDAS = [
    { x: -1500, y: -500, o: { copa: true } },
    { x: -1500, y: 100, o: {} },
    { x: 350, y: 880, o: { mapa: true, giroBancos: 0.5 } },
  ];
  const LAMPARAS = [
    [-850, 440],
    [850, 470],
    [380, -430],
  ];
  // los muebles grandes que no se mueven: { id, x, y, o, giro (grados), choque }
  const MUEBLES = [
    { id: "fogonHongo", x: FOGON.x, y: FOGON.y, o: {} },
    { id: "barraHongo", x: BARRA.x, y: BARRA.y, o: { largo: BARRA.largo, sem: 2 } },
    { id: "estanteJarras", x: -1050, y: -1150, o: { ancho: 450, sem: 1 } },
    { id: "tonelesHongo", x: -380, y: -1100, o: {} },
    { id: "tarimaSkald", x: TARIMA.x, y: TARIMA.y, o: {} },
    { id: "escudosPared", x: -HX + 8, y: 720, o: { z: 220 }, giro: -90 },
    { id: "escudosPared", x: 1150, y: -HY + 8, o: { z: 640 } },
    ...MESAS,
    ...REDONDAS.map((m) => ({ id: "mesaRonda", x: m.x, y: m.y, o: m.o })),
  ];
  // los hongos dorados en los postes y en las vigas
  const HONGOS = [
    { x: -850, y: GN + 30, z: 250, sem: 1 },
    { x: 250, y: GN + 30, z: 330, sem: 2 },
    { x: GO + 30, y: -350, z: 200, sem: 3 },
    { x: 700, y: GN + 30, z: 140, sem: 4 },
    { x: -300, y: GN + 30, z: 380, sem: 5 },
  ];
  // los estandartes que cuelgan de la galería: { x, y, giro, pared }
  const ESTANDARTES = [
    { x: -1100, y: GN + 8, giro: 0, pared: "n" },
    { x: -50, y: GN + 8, giro: 0, pared: "n" },
    { x: 450, y: GN + 8, giro: 0, pared: "n" },
    { x: GO + 8, y: -100, giro: -90, pared: "o" },
  ];

  // ---------- lo que choca ----------
  const CIRCULOS = [
    { x: FOGON.x, y: FOGON.y, r: 290 },
    { x: TARIMA.x, y: TARIMA.y, r: 240 },
    ...REDONDAS.map((m) => ({ x: m.x, y: m.y, r: 205 })),
    ...POSTES_N.map((x) => ({ x, y: GN, r: 40 })),
    ...POSTES_O.map((y) => ({ x: GO, y, r: 40 })),
    { x: -380, y: 390, r: 95 }, // Bergr, sentado en el piso
    { x: 0, y: -235, r: 50 }, // el banquito de Torvald
    { x: -1420, y: -760, r: 60 }, // el cajón de Fjalar
  ];
  const RECTAS = [
    [BARRA.x - BARRA.largo - 25, BARRA.y - 70, BARRA.x + BARRA.largo + 25, BARRA.y + 70],
    [-1500, -HY, -600, -1100],
    [-650, -HY, -110, -1010],
    [ESCALERA.x0 - 60, -HY, HX, ESCALERA.y1],
    ...MESAS.map((m) => [m.x - 470, m.y - 175, m.x + 470, m.y + 175]),
  ];
  function libre(x, y, r = 40) {
    if (x < -HX + 60 || x > HX - 60 || y < -HY + 60 || y > HY - 50) return false;
    for (const c of CIRCULOS) if (Math.hypot(x - c.x, y - c.y) < c.r + r) return false;
    for (const q of RECTAS) if (x > q[0] - r && x < q[2] + r && y > q[1] - r && y < q[3] + r) return false;
    for (const n of gente) if (!n.sentado && n.visible && Math.hypot(x - n.x, y - n.y) < 45 + r && !n.z) return false;
    return true;
  }

  // ---------- la gente ----------
  // { id, x, y, z, mira: S|N|E|W, sentado (alto del asiento), jarra, rol, cuando: dia|noche|siempre, capital }
  const asiento = (m, lado, i) => ({ x: m.x - 300 + i * 200, y: m.y + lado * 140, mira: lado < 0 ? "S" : "N", sentado: 62 });
  const banquito = (r, i, sent) => {
    const a = i * 2.1 + (r.o.giroBancos || 0),
      x = r.x + Math.cos(a) * 170,
      y = r.y + Math.sin(a) * 170;
    return { x, y, mira: vistaHacia(r.x - x, r.y - y), sentado: sent || 56 };
  };
  function vistaHacia(dx, dy) {
    if (Math.abs(dy) > Math.abs(dx)) return dy > 0 ? "S" : "N";
    return dx > 0 ? "E" : "W";
  }
  const REPARTO = [
    // la casa
    { id: "ulf", x: -850, y: -930, mira: "S", rol: "barra", cuando: "siempre" },
    { id: "ingunn", x: -700, y: -650, mira: "S", rol: "moza", cuando: "siempre", fase: 0 },
    { id: "tyra", x: 380, y: -300, mira: "S", rol: "moza", cuando: "noche", fase: 3, capital: true },
    { id: "nisse", x: -300, y: GN + 6, z: ZG + 112, mira: "S", sentado: 0, cuando: "siempre", k: 1 },
    // los forasteros
    { id: "fjalar", x: -1420, y: -760, z: 40, mira: "E", jarra: true, cuando: "siempre" },
    Object.assign({ id: "lysa", cuando: "siempre" }, banquito(REDONDAS[0], 0)),
    { id: "bergr", x: -380, y: 390, mira: "E", sentado: 0, jarra: true, cuando: "siempre", k: 1.2 },
    Object.assign({ id: "hallgerd", cuando: "siempre", jarra: true }, banquito(REDONDAS[2], 0)),
    Object.assign({ id: "odd", cuando: "siempre", jarra: true }, banquito(REDONDAS[2], 1)),
    Object.assign({ id: "signy", cuando: "siempre" }, banquito(REDONDAS[2], 2)),
    Object.assign({ id: "hg_isleno", cuando: "siempre", jarra: true, rol: "viajero" }, asiento(MESAS[0], 1, 1)),
    Object.assign({ id: "hg_mercader", cuando: "siempre", jarra: true, rol: "viajero" }, asiento(MESAS[0], -1, 2)),
    // Sølve: de día escribe en una mesa, de noche canta en la tarima
    Object.assign({ id: "solve", cuando: "dia", capital: true }, asiento(MESAS[2], -1, 1)),
    { id: "solve", x: TARIMA.x - 20, y: TARIMA.y - 40, z: 40, mira: "S", sentado: 60, rol: "skald", cuando: "noche", capital: true },
    // la gente de Eikholt que viene de noche
    Object.assign({ id: "folke", cuando: "noche", jarra: true, capital: true }, asiento(MESAS[0], -1, 0)),
    Object.assign({ id: "sten", cuando: "noche", jarra: true, capital: true }, asiento(MESAS[0], -1, 1)),
    { id: "torvald", x: 0, y: -235, mira: "S", sentado: 56, cuando: "noche", capital: true },
    Object.assign({ id: "kolbrun", cuando: "noche", capital: true }, asiento(MESAS[1], -1, 2)),
    Object.assign({ id: "ivar", cuando: "noche", jarra: true, capital: true }, banquito(REDONDAS[1], 0)),
    Object.assign({ id: "hg_pescador", cuando: "noche", jarra: true, rol: "pescador" }, asiento(MESAS[1], -1, 0)),
    Object.assign({ id: "hg_lenadora", cuando: "noche", jarra: true, rol: "vecina" }, asiento(MESAS[3], 1, 1)),
    Object.assign({ id: "hg_minero", cuando: "noche", jarra: true, rol: "viajero" }, asiento(MESAS[3], -1, 2)),
    { id: "hg_cazador", x: -1100, y: -640, mira: "N", jarra: true, rol: "vecino", cuando: "noche" },
  ];
  // los que tienen sus propias líneas (ho.<id>_0..3); los de Eikholt hablan con CAPITAL y los parroquianos con ek.
  const PROPIAS = ["ingunn", "fjalar", "lysa", "bergr", "nisse", "hallgerd", "odd", "signy"];
  const LINEAS_ROL = { vecino: 8, vecina: 8, viajero: 6, pescador: 4 };
  const GLOBO_DE = { bergr: "ho.g_jotun", fjalar: "ho.g_dvergr", lysa: "ho.g_alfr", nisse: "ho.g_nisse", ulf: "ho.g_ulf" };
  let gente = [];
  // el recorrido de las que sirven: la barra, las mesas y vuelta (sin pasar por el fogón)
  const RUTA = [
    [-700, -640],
    [-330, 200],
    [-330, 690],
    [330, 700],
    [330, 240],
    [380, -300],
  ];

  let noche = false,
    nocheAntes = null;
  function capital(id) {
    return window.CAPITAL ? CAPITAL.gente.find((n) => n.id === id) : null;
  }
  function armarGente() {
    noche = LUZ.noche(LUZ.hora(H.E.tiempo)) > 0.5;
    nocheAntes = noche;
    gente = REPARTO.filter((p) => p.cuando === "siempre" || (p.cuando === "noche") === noche).map((p, i) => {
      const n = Object.assign({ z: 0, k: 1, visible: true, brindis: 4 + ((i * 3.7) % 9), alza: 0, charla: 0 }, p);
      n.miraBase = n.mira;
      if (p.capital) {
        const cn = capital(p.id);
        if (cn && cn.fuera) n.visible = false;
      }
      if (n.rol === "moza") {
        n.paso = (n.fase || 0) % RUTA.length;
        n.x = RUTA[n.paso][0];
        n.y = RUTA[n.paso][1];
        n.espera = 1 + (n.fase || 0) * 0.7;
        n.bandeja = n.paso === 0;
      }
      if (n.rol === "barra") (n.destino = n.x), (n.espera = 2);
      return n;
    });
  }

  // ---------- estado ----------
  let activo = false,
    puerta = null,
    tiempo = 0,
    dtUlt = 1 / 60,
    fundido = 0,
    saliendo = 0;
  const ero = { x: PUERTA.x, y: PUERTA.y - 160 };
  const cam = { x: 0, y: 0, g: 0.52, esc: 0.5 };
  let zoom = 0.42,
    giroObj = 0.52;
  const globos = []; // { n, texto, t }
  let proximoGlobo = 2;
  const chispas = []; // las brasas del fogón
  const signos = []; // las runas que suben de la canción de Sølve
  const RUNAS_CANCION = ["laguz", "wunjo", "ansuz", "sowilo", "dagaz", "berkano"];

  // ---------- entrar y salir ----------
  function entrar(p) {
    puerta = p;
    activo = true;
    ero.x = PUERTA.x;
    ero.y = PUERTA.y - 170;
    cam.x = ero.x + 300;
    cam.y = ero.y - 500;
    if (st.g != null) giroObj = cam.g = st.g;
    if (st.zoom != null) zoom = st.zoom;
    pegar = true;
    armarGente();
    globos.length = 0;
    fundido = 1;
    saliendo = 0;
    J.dentro = sistemaSala;
    jug.atk = null;
    jug.anda = 0;
    jug.mira = { vista: "N", espejo: false };
    if (window.SONIDO) SONIDO.tocar("puerta", { vol: 0.45 });
    HUD.aviso(t("ho.nombre"), "#FFD98A");
  }
  function salir() {
    if (saliendo) return;
    saliendo = 0.35;
  }
  function terminarSalida() {
    activo = false;
    if (window.SONIDO) SONIDO.bucle("hongo_fuego", "fogata", 0);
    J.dentro = null;
    const p = puerta.cosa;
    jug.x = p.x;
    jug.y = p.y + 70;
    jug.mira = { vista: "S", espejo: false };
    J.cam.x = jug.x;
    J.cam.y = jug.y - 30;
  }
  // la trampilla de atrás de la barra: abre y después baja a la bodega (la puerta de Góinn); al subir vuelve acá
  function trampilla() {
    if (!st.tr) {
      st.tr = true;
      if (window.SONIDO) SONIDO.tocar("crujido", { vol: 0.6 });
      return;
    }
    if (!window.INTERIORES || !INTERIORES.bajarDesde) return;
    activo = false;
    INTERIORES.bajarDesde(puerta, () => {
      activo = true;
      ero.x = TRAMPILLA.x + 150;
      ero.y = TRAMPILLA.y + 60;
      fundido = 1;
      J.dentro = sistemaSala;
      jug.mira = { vista: "S", espejo: false };
    });
  }

  // ---------- lo que se hace adentro ----------
  function hidromiel() {
    A.menu(`<h2>${t("in.hidromiel_titulo")}</h2><div class="sub">${t("in.hidromiel_sub")}</div>`, [
      {
        texto: t("in.hidromiel_si"),
        fn: () => {
          A.cerrarMenu();
          const pj = PODERES.pj();
          if (pj.plata < 5) return A.avisar("in.hidromiel_sin");
          pj.plata -= 5;
          jug.hp = jug.hpMax;
          HUD.aviso(t("in.hidromiel_ok"), "#FFD98A");
          const u = gente.find((n) => n.id === "ulf");
          if (u) decir(u, "ho.g_ulf");
        },
      },
      { texto: t("ui.cerrar"), fn: A.cerrarMenu },
    ]);
  }
  function cuarto() {
    A.menu(`<h2>${t("ho.cuarto_titulo")}</h2><div class="sub">${t("ho.cuarto_sub")}</div>`, [
      {
        texto: t("ho.cuarto_si"),
        fn: () => {
          A.cerrarMenu();
          const pj = PODERES.pj();
          if (pj.plata < 8) return A.avisar("in.hidromiel_sin");
          pj.plata -= 8;
          HUD.aviso(t("ho.cuarto_ok"), "#E0B2B2");
          J.retrasar(0.6, dormir);
        },
      },
      { texto: t("ui.cerrar"), fn: A.cerrarMenu },
    ]);
  }
  function dormir() {
    const h = LUZ.hora(H.E.tiempo);
    fundido = 1.6;
    jug.hp = jug.hpMax;
    jug.sta = jug.staMax;
    const falta = (((7 - h + 24) % 24) / 24) * LUZ.DIA;
    H.E.tiempo += falta;
    HUD.aviso(t("in.dormiste_noche"), "#E0B2B2");
    H.guardar();
  }
  function calentarse() {
    jug.hp = Math.min(jug.hpMax, jug.hp + 40);
    HUD.aviso(t("in.calor"), "#FF8D71");
  }
  let cancion = 0;
  function escuchar() {
    if (!noche) return A.dialogoLibre([["eromash", "ho.cancion_sin"]]);
    const k = cancion++ % 4;
    A.dialogoLibre([["solve", "ho.cancion_" + k]], () => {
      jug.sta = jug.staMax;
      HUD.aviso(t("ho.cancion_bien"), "#73D5DB");
    });
  }
  const mirar = (clave) => () => A.dialogoLibre([["eromash", clave]]);
  const charlas = {};
  function hablar(n) {
    n.mira = vistaHacia(ero.x - n.x, ero.y - n.y);
    n.charla = 6;
    if (n.id === "ulf" && window.PODERES) return PODERES.hablarCon({ id: "ulf", x: jug.x, y: jug.y, mira: { vista: "S", espejo: false } });
    if (n.capital && window.CAPITAL && CAPITAL.hablar) {
      const cn = capital(n.id);
      if (cn) return CAPITAL.hablar(cn);
    }
    const k = (charlas[n.id] = (charlas[n.id] == null ? 0 : charlas[n.id] + 1));
    if (PROPIAS.includes(n.id)) return A.dialogoLibre([[n.id, "ho." + n.id + "_" + (k % 4)]]);
    const rol = n.rol || "vecino";
    A.dialogoLibre([[n.id, "ek.dice_" + rol + "_" + (k % (LINEAS_ROL[rol] || 4))]]);
  }

  // ---------- lo que hay a mano ----------
  function cercano() {
    if (!activo || saliendo || J.modo !== "juego") return null;
    let mejor = null,
      dm = Infinity;
    const prueba = (d, texto, fn) => {
      if (d < dm) {
        dm = d;
        mejor = { texto, fn };
      }
    };
    const dist = (x, y) => Math.hypot(ero.x - x, ero.y - y);
    for (const n of gente) {
      if (!n.visible) continue;
      const d = dist(n.x, n.y) - (n.id === "bergr" ? 60 : 0) + (n.z > 200 ? 140 : 0);
      if (d < 200) prueba(d - 30, t("av.accion_hablar") + " · " + t("av.nombre_" + n.id), () => hablar(n));
    }
    const dp = dist(PUERTA.x, PUERTA.y - 40);
    if (dp < 220) prueba(dp, t("in.accion_salir"), salir);
    const df = dist(FOGON.x, FOGON.y) - 290;
    if (df < 140) prueba(df + 40, t("ho.accion_fogon"), calentarse);
    if (ero.y > BARRA.y + 60 && ero.y < BARRA.y + 200 && Math.abs(ero.x - BARRA.x) < BARRA.largo + 20) prueba(ero.y - BARRA.y - 60, t("ho.accion_barra"), hidromiel);
    const de = dist(ESCALERA.x1 + 60, ESCALERA.y1 + 80);
    if (de < 240) prueba(de, t("ho.accion_cuarto"), cuarto);
    const dt0 = dist(TARIMA.x, TARIMA.y) - 240;
    if (dt0 < 160) prueba(dt0 + 30, t("ho.accion_escuchar"), escuchar);
    const dtr = dist(TRAMPILLA.x, TRAMPILLA.y);
    if (dtr < 170) prueba(dtr - 60, t(st.tr ? "in.accion_bajar" : "in.accion_trampilla"), trampilla);
    const dto = dist(-380, -960);
    if (dto < 200) prueba(dto + 20, t("ho.accion_tonel"), mirar("ho.mirar_tonel"));
    for (const h of HONGOS) {
      const d = dist(h.x, h.y + 60);
      if (d < 170) prueba(d + 30, t("ho.accion_hongos"), mirar("ho.mirar_hongos"));
    }
    const dm0 = dist(REDONDAS[2].x, REDONDAS[2].y) - 205;
    if (dm0 < 110) prueba(dm0 + 60, t("ho.accion_mapa"), mirar("ho.mirar_mapa"));
    const dtb = dist(-HX + 80, -880);
    if (dtb < 200) prueba(dtb, t("ho.accion_tablero"), mirar("ho.mirar_tablero"));
    const des = dist(-HX + 80, 720);
    if (des < 240) prueba(des, t("ho.accion_escudos"), mirar("ho.mirar_escudos"));
    return mejor;
  }

  // ---------- Eromash camina ----------
  const VEL = [0, 330, 520, 820];
  function moverA(nx, ny) {
    if (libre(nx, ny)) {
      ero.x = nx;
      ero.y = ny;
    } else if (libre(nx, ero.y)) ero.x = nx;
    else if (libre(ero.x, ny)) ero.y = ny;
  }
  function jugadorPaso(dt) {
    jug.inv = Math.max(0, (jug.inv || 0) - dt);
    if (jug.salto > 0) jug.salto = Math.max(0, jug.salto - dt);
    jug.sta = Math.min(jug.staMax, jug.sta + 22 * dt);
    const libreJ = J.modo === "juego";
    const e = libreJ ? CONTROLES.eje() : { x: 0, y: 0 },
      mov = Math.hypot(e.x, e.y) > 0.15,
      mag = Math.min(1, Math.hypot(e.x, e.y));
    jug.correr = libreJ && mov && CONTROLES.pulsado("correr");
    jug.paso = !mov ? 0 : jug.correr ? 3 : mag < 0.6 ? 1 : 2;
    const co = Math.cos(cam.g),
      si = Math.sin(cam.g);
    if (mov) {
      const l = Math.hypot(e.x, e.y),
        dx = (e.x * co + e.y * si) / l,
        dy = (-e.x * si + e.y * co) / l;
      jug.dir = [e.x / l, e.y / l];
      jug.mira = VIKINGO.vista(e.x, e.y, jug.mira);
      moverA(ero.x + dx * VEL[jug.paso] * dt, ero.y + dy * VEL[jug.paso] * dt);
      // salir caminando por la puerta
      if (ero.y > HY - 110 && Math.abs(ero.x - PUERTA.x) < 190 && dy > 0.4) salir();
    }
    jug.anda = mov ? (jug.correr ? 2 : 1) : 0;
    if (!libreJ) return;
    if (CONTROLES.recien("saltar") && jug.salto <= 0) jug.salto = 0.42;
    if (CONTROLES.recien("interactuar")) {
      const c0 = cercano();
      if (c0) c0.fn();
    }
    if (CONTROLES.recien("inventario") && window.INVENTARIO) INVENTARIO.abrir("equipo");
  }

  // ---------- la vida de la sala ----------
  function decir(n, clave) {
    if (!n || !n.visible) return;
    for (let i = globos.length - 1; i >= 0; i--) if (globos[i].n === n) globos.splice(i, 1);
    globos.push({ n, texto: t(clave), t: 0 });
  }
  function vidaPaso(dt) {
    noche = LUZ.noche(LUZ.hora(H.E.tiempo)) > 0.5;
    if (noche !== nocheAntes) armarGente();
    for (const n of gente) {
      if (n.charla > 0 && (n.charla -= dt) <= 0) n.mira = n.miraBase;
      // brindar: alzar la jarra cada tanto
      if (n.jarra) {
        n.brindis -= dt;
        if (n.brindis <= 0) {
          n.alza = 0.9;
          n.brindis = 6 + Math.random() * 9;
        }
        n.alza = Math.max(0, n.alza - dt);
      }
      if (n.rol === "moza") moza(n, dt);
      else if (n.rol === "barra") barra(n, dt);
      // la gente mira a Eromash cuando pasa cerca
      if (!n.sentado && !n.camina && n.charla <= 0 && Math.hypot(ero.x - n.x, ero.y - n.y) < 380) n.mira = vistaHacia(ero.x - n.x, ero.y - n.y);
    }
    // lo que se oye en las mesas
    proximoGlobo -= dt;
    if (proximoGlobo <= 0 && J.modo === "juego") {
      proximoGlobo = 1.6 + Math.random() * 2.2;
      const cand = gente.filter((n) => n.visible && n.charla <= 0 && Math.hypot(ero.x - n.x, ero.y - n.y) > 160);
      const n = cand[Math.floor(Math.random() * cand.length)];
      if (n && globos.length < 3) {
        const propio = GLOBO_DE[n.id];
        decir(n, n.rol === "moza" ? "ho.g_moza" : propio && Math.random() < 0.6 ? propio : "ho.g_" + Math.floor(Math.random() * 14));
        if (n.jarra && Math.random() < 0.5) n.alza = 0.9;
      }
    }
    if (J.modo !== "juego") globos.length = 0;
    for (let i = globos.length - 1; i >= 0; i--) if ((globos[i].t += dt) > 3.6) globos.splice(i, 1);
    // las brasas del fogón y las runas de la canción
    const q = window.CALIDAD ? CALIDAD.nivel : "alta";
    const tope = q === "alta" ? 46 : q === "media" ? 22 : 0;
    if (chispas.length < tope && Math.random() < dt * (q === "alta" ? 26 : 12)) {
      const a = Math.random() * TAU,
        r = Math.random() * 110;
      chispas.push({ u: FOGON.x + Math.cos(a) * r, w: FOGON.y + Math.sin(a) * r, z: 60, vz: 120 + Math.random() * 140, vida: 0, dura: 1.6 + Math.random() * 1.6, giro: Math.random() * TAU, deriva: (Math.random() - 0.5) * 40 });
    }
    for (let i = chispas.length - 1; i >= 0; i--) {
      const c = chispas[i];
      c.vida += dt;
      c.z += c.vz * dt;
      c.u += c.deriva * dt + Math.sin(tiempo * 2 + c.giro) * 10 * dt;
      c.giro += dt * 3;
      if (c.vida > c.dura || c.z > 540) chispas.splice(i, 1);
    }
    const skald = gente.find((n) => n.rol === "skald" && n.visible);
    if (skald && q !== "baja" && Math.random() < dt * 1.6) signos.push({ u: skald.x + (Math.random() - 0.5) * 120, w: skald.y, z: 300, vida: 0, runa: RUNAS_CANCION[Math.floor(Math.random() * RUNAS_CANCION.length)] });
    for (let i = signos.length - 1; i >= 0; i--) {
      const s = signos[i];
      s.vida += dt;
      s.z += 70 * dt;
      if (s.vida > 3) signos.splice(i, 1);
    }
  }
  // la moza va de la barra a las mesas con la bandeja, se queda un rato en cada una y vuelve
  function moza(n, dt) {
    if (n.espera > 0) {
      n.espera -= dt;
      n.camina = false;
      return;
    }
    const [tx, ty] = RUTA[(n.paso + 1) % RUTA.length],
      dx = tx - n.x,
      dy = ty - n.y,
      d = Math.hypot(dx, dy);
    if (d < 12) {
      n.paso = (n.paso + 1) % RUTA.length;
      n.espera = n.paso === 0 ? 2.4 : 1.6;
      n.bandeja = n.paso === 0 ? true : n.paso >= 4 ? false : n.bandeja;
      n.mira = n.paso === 0 ? "N" : vistaHacia(dx, dy);
      return;
    }
    const v = 190 * dt,
      nx = n.x + (dx / d) * v,
      ny = n.y + (dy / d) * v;
    // si Eromash está en el medio, espera
    if (Math.hypot(ero.x - nx, ero.y - ny) < 90) {
      n.camina = false;
      return;
    }
    n.x = nx;
    n.y = ny;
    n.camina = true;
    n.mira = vistaHacia(dx, dy);
  }
  // Ulf va y viene detrás de la barra, se para, limpia, sirve
  function barra(n, dt) {
    if (n.charla > 0) return (n.camina = false);
    if (n.espera > 0) {
      n.espera -= dt;
      n.camina = false;
      n.mira = "S";
      return;
    }
    const dx = n.destino - n.x;
    if (Math.abs(dx) < 8) {
      n.espera = 2 + Math.random() * 3;
      n.destino = BARRA.x - BARRA.largo + 120 + Math.random() * (BARRA.largo * 2 - 240);
      return;
    }
    n.x += Math.sign(dx) * Math.min(Math.abs(dx), 140 * dt);
    n.camina = true;
    n.mira = dx > 0 ? "E" : "W";
  }

  // ---------- la cámara ----------
  let pegar = true; // al entrar, la cámara salta a su lugar en el primer cuadro
  function camaraPaso(dt, cw, ch) {
    const libreJ = J.modo === "juego";
    if (libreJ && CONTROLES.pulsado("camaraIzq")) giroObj -= dt * 1.05;
    if (libreJ && CONTROLES.pulsado("camaraDer")) giroObj += dt * 1.05;
    if (libreJ && CONTROLES.pulsado("acercar")) zoom = Math.min(1, zoom + dt * 0.3);
    if (libreJ && CONTROLES.pulsado("alejar")) zoom = Math.max(0.28, zoom - dt * 0.3);
    cam.g += corto(giroObj - cam.g) * Math.min(1, dt * 8);
    const escObj = zoom * Math.sqrt((cw * ch) / (1600 * 900));
    if (pegar) {
      pegar = false;
      cam.esc = escObj;
      cam.x = ero.x;
      cam.y = ero.y - 260;
    }
    cam.esc += (escObj - cam.esc) * Math.min(1, dt * 6);
    // la cámara mira un poco por encima de Eromash, hacia el fondo, para que entre la galería
    cam.x += (ero.x - cam.x) * Math.min(1, dt * 5);
    cam.y += (ero.y - 260 - cam.y) * Math.min(1, dt * 5);
  }
  addEventListener("wheel", (ev) => {
    if (!activo || J.modo !== "juego" || (ev.target && ev.target.closest && ev.target.closest(".ui, #capaCaja, #mapaLienzo"))) return;
    zoom = Math.max(0.28, Math.min(1, zoom - Math.sign(ev.deltaY) * 0.04));
  }, { passive: true });

  // ---------- el cuadro ----------
  function paso(dt) {
    if (!activo) return;
    dt = Math.min(dt, 0.05);
    dtUlt = dt;
    tiempo += dt;
    if (fundido > 0) fundido = Math.max(0, fundido - dt * 2.4);
    if (saliendo) {
      saliendo -= dt;
      if (saliendo <= 0) terminarSalida();
      return;
    }
    if (J.modo === "juego" || J.modo === "dialogo") jugadorPaso(dt);
    vidaPaso(dt);
    if (window.SONIDO) SONIDO.bucle("hongo_fuego", "fogata", 0.4 * Math.max(0.3, 1 - Math.hypot(ero.x - FOGON.x, ero.y - FOGON.y) / 2600));
    if ((st.t = (st.t || 0) + dt) > 1) {
      st.t = 0;
      st.g = giroObj;
      st.zoom = zoom;
    }
  }

  // el proyector de la sala con la cámara de ahora
  let PR = null,
    cwU = 1600,
    chU = 900;
  function armarProyector(cw, ch) {
    const co = Math.cos(cam.g),
      si = Math.sin(cam.g),
      s = cam.esc,
      ox = (cam.x * co - cam.y * si) * s,
      oy = (cam.x * si + cam.y * co) * VOL.K * s;
    PR = VOL.proyector(cw / 2 - ox, ch * 0.6 - oy, cam.g, { s });
    cwU = cw;
    chU = ch;
    return PR;
  }
  // de qué lado queda cada pared: se ve (y se pinta su galería) si mira a la cámara
  const mira = (nu, nw) => PR.mira(nu, nw)[1];
  const paredVista = { n: () => mira(0, 1) > 0.02, s: () => mira(0, -1) > 0.02, o: () => mira(1, 0) > 0.02, e: () => mira(-1, 0) > 0.02 };

  // ---------- el piso y las paredes (hechos una vez en lienzos) ----------
  const lienzos = {};
  function lienzo(k, w, h, q) {
    let cv = lienzos[k];
    if (!cv || cv.q !== q) {
      cv = lienzos[k] = document.createElement("canvas");
      cv.width = Math.round(w * q);
      cv.height = Math.round(h * q);
      cv.q = q;
      cv.listo = null;
    }
    return cv;
  }
  const calidad = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  function lienzoPiso() {
    const q = calidad() === "alta" ? 0.4 : 0.25,
      cv = lienzo("piso", HX * 2, HY * 2, q);
    if (cv.listo) return cv;
    const c = cv.getContext("2d"),
      r = DIB.azar(41);
    c.setTransform(q, 0, 0, q, HX * q, HY * q);
    // los tablones anchos, a lo largo de la sala
    const n = 26,
      w = (HY * 2) / n;
    for (let i = 0; i < n; i++) {
      const y = -HY + i * w;
      R(c, -HX, y, HX * 2, w, ["#3A1A10", "#341710", "#40200F", "#381A0E"][i % 4]);
      R(c, -HX, y + w - 4, HX * 2, 5, "#1A0A06");
      for (let x = -HX + r() * 300; x < HX; x += 260 + r() * 340) R(c, x, y, 5, w, "#1A0A06");
    }
    // el desgaste: un camino más claro de la puerta al fogón y a la barra
    alfa(c, 0.18, () => {
      c.fillStyle = "#7A3E20";
      c.beginPath();
      c.moveTo(PUERTA.x - 200, HY);
      c.quadraticCurveTo(-500, 500, FOGON.x - 300, FOGON.y + 200);
      c.lineTo(FOGON.x - 100, FOGON.y + 320);
      c.quadraticCurveTo(-300, 700, PUERTA.x + 200, HY);
      c.fill();
    });
    // la piel grande junto al fogón y la alfombra tejida frente a la tarima
    const piel = (x, y, rx, ry, a, col, col2) => {
      c.save();
      c.translate(x, y);
      c.rotate(a);
      P(c, DIB.poli(0, 0, rx, ry, 9, 0.3), col);
      P(c, DIB.poli(0, 0, rx * 0.72, ry * 0.7, 9, 0.6), col2);
      c.restore();
    };
    piel(-150, 520, 300, 170, -0.15, "#8A7A6A", "#A8946C");
    piel(-420, 380, 200, 120, 0.4, "#5E4A36", "#7A6450");
    c.save();
    c.translate(TARIMA.x - 120, TARIMA.y + 340);
    R(c, -260, -90, 520, 180, "#5E130D");
    R(c, -240, -70, 480, 140, "#9C2315");
    for (let k = 0; k < 9; k++) P(c, [-200 + k * 50, 0, -180 + k * 50, -30, -160 + k * 50, 0, -180 + k * 50, 30], "#C9A45A");
    c.restore();
    // la marca donde estuvo el fogón viejo y los rayones de los bancos
    for (let k = 0; k < 40; k++) R(c, -HX + r() * HX * 2, -HY + r() * HY * 2, 40 + r() * 80, 3, "rgba(20,8,4,0.5)");
    cv.listo = true;
    return cv;
  }
  // lo pintado de cada pared, visto de frente desde adentro (de 0 a l, la base en 0 y para arriba negativo); u0 es la
  // coordenada del mundo del borde izquierdo y du hacia dónde crece (para poner ventanas, puertas y postes en su lugar)
  function pintarPared(c, l, h, lado) {
    const r = DIB.azar(lado.charCodeAt(0) * 13);
    const tabla = ["#3A1A10", "#40200F", "#361810"];
    for (let y = 0; y < h; y += 46) R(c, 0, -y - 46, l, 46, tabla[(y / 46) % 3]), R(c, 0, -y - 4, l, 4, "#1E0C06");
    const galeria = lado === "n" || lado === "o";
    // pies derechos y vigas
    const cada = 550;
    for (let x = 0; x <= l; x += cada) R(c, x - 18, -h, 36, h, "#2A0806"), R(c, x - 12, -h, 10, h, "#4A1A10");
    R(c, 0, -h, l, 40, "#2A0806");
    R(c, 0, -h + 40, l, 8, "#5E130D");
    R(c, 0, -60, l, 60, "#2A0806");
    // aldaba de runas a lo largo de la viga de arriba
    const runas = ["fehu", "uruz", "ansuz", "raidho", "kenaz", "gebo", "wunjo", "jera", "sowilo", "berkano", "othala", "dagaz"];
    for (let k = 0, x = 120; x < l - 60; x += 240, k++) FUTHARK.dibujar(c, runas[k % runas.length], x, -h + 34, 22, "#73D5DB", 2);
    const ventana = (x, z0, z1, an) => {
      R(c, x - an / 2 - 16, -z1 - 16, an + 32, z1 - z0 + 32, "#2A0806");
      R(c, x - an / 2, -z1, an, z1 - z0, noche ? "#141C30" : "#9AB8C8");
      if (noche) for (let k = 0; k < 5; k++) R(c, x - an / 2 + r() * an, -z1 + r() * (z1 - z0) * 0.6, 3, 3, "#F2ECEC");
      else R(c, x - an / 2, -z1, an * 0.35, z1 - z0, "#B8D0DA");
      R(c, x - 5, -z1, 10, z1 - z0, "#2A0806");
      R(c, x - an / 2, -(z0 + z1) / 2 - 5, an, 10, "#2A0806");
    };
    const puertaCuarto = (x, n) => {
      const z0 = ZG + 10,
        z1 = ZG + 280;
      R(c, x - 80, -z1 - 14, 160, z1 - z0 + 14, "#2A0806");
      R(c, x - 66, -z1, 132, z1 - z0, "#5E130D");
      for (let k = 1; k < 4; k++) R(c, x - 66 + k * 33, -z1, 3, z1 - z0, "#3A0C08");
      R(c, x - 66, -z0 - 80, 132, 10, "#2A2428");
      R(c, x - 66, -z1 + 60, 132, 10, "#2A2428");
      E(c, x + 44, -z0 - 130, 6, 6, "#C9A45A");
      FUTHARK.dibujar(c, runas[n % runas.length], x, -z1 - 30, 30, "#FFD98A", 3);
    };
    if (lado === "n") {
      // arriba: las puertas de los cuartos, con su runa y su farolito; sobre la escalera, la ventana grande
      [-1400, -1000, -600, -200, 250].forEach((x, i) => puertaCuarto(x + HX, i));
      ventana(1150 + HX, 560, 820, 300);
      // abajo, a la derecha de los toneles: una ventana chica
      ventana(250 + HX, 130, 330, 160);
    } else if (lado === "o") {
      // la pared oeste se ve de sur (izquierda) a norte (derecha): x de la pintura = HY - y
      [-900, -500, -100].forEach((y, i) => puertaCuarto(HY - y, i + 5));
      [-350 + 160, 150].forEach((y) => ventana(HY - y, 130, 330, 170));
      ventana(HY - 950, 160, 420, 220);
      // el tablero de las tablillas de los huéspedes, junto a la barra
      const tx = HY + 880;
      R(c, tx - 110, -330, 220, 200, "#2A0806");
      R(c, tx - 96, -316, 192, 172, "#7A3E20");
      for (let k = 0; k < 12; k++) R(c, tx - 86 + (k % 6) * 30, -306 + Math.floor(k / 6) * 84, 22, 70, "#C8B48C"), L(c, tx - 80 + (k % 6) * 30, -290 + Math.floor(k / 6) * 84, tx - 70 + (k % 6) * 30, -260 + Math.floor(k / 6) * 84, "#5E4430", 2);
    } else if (lado === "s") {
      // la pared sur se ve de este (izquierda) a oeste (derecha): x de la pintura = HX - x
      const px = HX - PUERTA.x;
      R(c, px - 190, -420, 380, 420, "#2A0806");
      R(c, px - 170, -400, 340, 400, noche ? "#0E1420" : "#C8D8C0");
      if (!noche) R(c, px - 170, -140, 340, 140, "#6A7A4A");
      [-200, 600, 1300].forEach((x) => ventana(HX - x, 180, 400, 200));
    } else {
      // la pared este (de norte a sur): el mapa de cuero de las tierras que se cuentan en la sala
      const mx = HY + 300;
      R(c, mx - 420, -720, 840, 520, "#2A0806");
      P(c, [mx - 400, -700, mx + 400, -690, mx + 390, -220, mx + 10, -200, mx - 390, -230], "#C8A87A");
      c.fillStyle = "#6A4A2A";
      for (let k = 0; k < 7; k++) P(c, DIB.poli(mx - 260 + k * 85, -470 + Math.sin(k * 1.7) * 120, 70, 50, 7, k), ["#A8946C", "#8A9A6A", "#B8A47A"][k % 3]);
      L(c, mx - 300, -300, mx + 300, -600, "#9C2315", 3);
      FUTHARK.dibujar(c, "raidho", mx + 300, -610, 40, "#9C2315", 4);
      [-900, 0, 700].forEach((y) => ventana(y + HY, 160, 380, 180));
    }
    // abajo, bajo la galería, un zócalo más oscuro
    if (galeria) alfa(c, 0.25, () => R(c, 0, -ZG, l, ZG, "#000000"));
  }
  function lienzoPared(lado, largo) {
    const q = calidad() === "alta" ? 0.4 : 0.25,
      cv = lienzo("pared_" + lado, largo, ZT, q);
    if (cv.listo === noche) return cv;
    const c = cv.getContext("2d");
    c.setTransform(q, 0, 0, q, 0, ZT * q);
    c.clearRect(0, -ZT, largo, ZT);
    pintarPared(c, largo, ZT, lado);
    cv.listo = noche;
    return cv;
  }
  function paredes(c) {
    const tela = (cv, largo) => VOL.medida(largo, ZT, (cc, l, h) => cc.drawImage(cv, 0, 0, cv.width, cv.height, 0, -h, l, h));
    const pared = (p, lado, largo) => VOL.cara(c, PR, p, "#111111", tela(lienzoPared(lado, largo), largo));
    pared([[-HX, -HY, 0], [HX, -HY, 0], [HX, -HY, ZT], [-HX, -HY, ZT]], "n", HX * 2);
    pared([[-HX, HY, 0], [-HX, -HY, 0], [-HX, -HY, ZT], [-HX, HY, ZT]], "o", HY * 2);
    pared([[HX, -HY, 0], [HX, HY, 0], [HX, HY, ZT], [HX, -HY, ZT]], "e", HY * 2);
    pared([[HX, HY, 0], [-HX, HY, 0], [-HX, HY, ZT], [HX, HY, ZT]], "s", HX * 2);
    // la sombra donde las paredes tocan el piso
    VOL.enPiso(c, PR, (cc) => {
      cc.strokeStyle = "rgba(0,0,0,0.4)";
      cc.lineWidth = 60;
      cc.strokeRect(-HX, -HY, HX * 2, HY * 2);
    });
  }
  // las paredes de adelante quedan cortadas: se ve su base, como el borde de una casa de muñecas
  function zocalos(c, lista) {
    const base = (lado, f) => !paredVista[lado]() && lista.push(f);
    const MZ = ["#2A0806", "#3A1A10", "#5A2A16"];
    base("s", { k: PR.hondo(0, HY + 40), f: () => {
      VOL.caja(c, PR, -HX - 40, HY, 0, PUERTA.x - 190, HY + 40, 70, MZ);
      VOL.caja(c, PR, PUERTA.x + 190, HY, 0, HX + 40, HY + 40, 70, MZ);
    } });
    base("e", { k: PR.hondo(HX + 40, 0), f: () => VOL.caja(c, PR, HX, -HY - 40, 0, HX + 40, HY + 40, 70, MZ) });
    base("n", { k: PR.hondo(0, -HY - 40), f: () => VOL.caja(c, PR, -HX - 40, -HY - 40, 0, HX + 40, -HY, 70, MZ) });
    base("o", { k: PR.hondo(-HX - 40, 0), f: () => VOL.caja(c, PR, -HX - 40, -HY - 40, 0, -HX, HY + 40, 70, MZ) });
  }

  // ---------- la galería, los postes y la escalera ----------
  const MG = ["#2A0806", "#5A2A16", "#7A3E20"];
  function baranda(c, ax, ay, bx, by) {
    // de (ax, ay) a (bx, by) en el borde de la galería: los balaustres y el pasamanos
    const l = Math.hypot(bx - ax, by - ay),
      n = Math.max(2, Math.round(l / 70));
    for (let i = 0; i <= n; i++) {
      const x = ax + ((bx - ax) * i) / n,
        y = ay + ((by - ay) * i) / n;
      VOL.palo(c, PR, x, y, ZG, x, y, ZG + 110, 7, "#5A2A16");
    }
    const dx = (bx - ax) / l,
      dy = (by - ay) / l;
    VOL.caja(c, PR, Math.min(ax, bx) - Math.abs(dy) * 10, Math.min(ay, by) - Math.abs(dx) * 10, ZG + 104, Math.max(ax, bx) + Math.abs(dy) * 10, Math.max(ay, by) + Math.abs(dx) * 10, ZG + 122, MG);
  }
  function galeria(c, lista) {
    if (paredVista.n()) {
      const xs = [-HX, ...POSTES_N.filter((x) => x > -HX && x < GN_ESTE), GN_ESTE];
      for (let i = 0; i < xs.length - 1; i++) {
        const x0 = xs[i],
          x1 = xs[i + 1];
        lista.push({ k: PR.hondo((x0 + x1) / 2, GN) + 1, f: () => tenue(ero.y < GN + 40 && ero.x > x0 - 120 && ero.x < x1 + 120, () => {
          VOL.caja(c, PR, x0, -HY, ZG - 34, x1, GN, ZG, MG);
          VOL.caja(c, PR, x0, GN - 30, ZG - 70, x1, GN, ZG - 34, MG);
          baranda(c, x0, GN, x1, GN);
        }) });
      }
      POSTES_N.forEach((x) => lista.push({ k: PR.hondo(x, GN), f: () => poste(c, x, GN) }));
      // la escalera que sube a la galería, contra la pared norte
      lista.push({ k: PR.hondo((ESCALERA.x0 + ESCALERA.x1) / 2, ESCALERA.y1), f: () => escalera(c) });
    }
    if (paredVista.o()) {
      const ys = [GN, ...POSTES_O.filter((y) => y > GN && y < GO_SUR), GO_SUR];
      for (let i = 0; i < ys.length - 1; i++) {
        const y0 = ys[i],
          y1 = ys[i + 1];
        lista.push({ k: PR.hondo(GO, (y0 + y1) / 2) + 1, f: () => tenue(ero.x < GO + 40 && ero.y > y0 - 120 && ero.y < y1 + 120, () => {
          VOL.caja(c, PR, -HX, y0, ZG - 34, GO, y1, ZG, MG);
          VOL.caja(c, PR, GO - 30, y0, ZG - 70, GO, y1, ZG - 34, MG);
          baranda(c, GO, y0, GO, y1);
        }) });
      }
      // el tramo de la esquina, sobre la galería norte
      if (!paredVista.n()) lista.push({ k: PR.hondo(GO, -1050), f: () => VOL.caja(c, PR, -HX, -HY, ZG - 34, GO, GN, ZG, MG) });
      POSTES_O.forEach((y) => lista.push({ k: PR.hondo(GO, y), f: () => poste(c, GO, y) }));
    }
  }
  // lo que tapa a Eromash (un tramo de galería con él abajo) se ve a medias
  function tenue(si, fn) {
    if (!si) return fn();
    const c = ctxAhora;
    c.save();
    c.globalAlpha *= 0.42;
    try {
      fn();
    } finally {
      c.restore();
    }
  }
  function poste(c, x, y) {
    VOL.cilindro(c, PR, x, y, 28, 0, ZG - 34, MG, { n: 8 });
    VOL.caja(c, PR, x - 40, y - 40, ZG - 90, x + 40, y + 40, ZG - 70, MG);
    // las ménsulas
    VOL.palo(c, PR, x, y, ZG - 170, x + 90, y, ZG - 70, 9, "#2A0806");
    VOL.palo(c, PR, x, y, ZG - 170, x - 90, y, ZG - 70, 9, "#2A0806");
  }
  function escalera(c) {
    const n = 10,
      paso = (ESCALERA.x1 - ESCALERA.x0) / n,
      escalones = [];
    for (let i = 0; i < n; i++) escalones.push(i);
    escalones.sort((a, b) => PR.hondo(ESCALERA.x1 - a * paso, ESCALERA.y1) - PR.hondo(ESCALERA.x1 - b * paso, ESCALERA.y1));
    escalones.forEach((i) => {
      const x1 = ESCALERA.x1 - i * paso,
        x0 = x1 - paso;
      VOL.caja(c, PR, x0, ESCALERA.y0, 0, x1, ESCALERA.y1, (i + 1) * (ZG / n), ["#2A0806", "#5A2A16", "#8A4A26"]);
    });
    VOL.palo(c, PR, ESCALERA.x1, ESCALERA.y1, 110, ESCALERA.x0, ESCALERA.y1, ZG + 110, 8, "#5A2A16");
    VOL.palo(c, PR, ESCALERA.x1, ESCALERA.y1, 0, ESCALERA.x1, ESCALERA.y1, 120, 10, "#2A0806");
  }

  // ---------- la gente en la vista ----------
  function cadera(n) {
    const f = GENTE.FICHAS[n.id] || {};
    return 30 * (f.alto || 1);
  }
  function persona(c, n, sx, sy) {
    const s = GK * cam.esc * (n.k || 1),
      mv = VOL.relativa(n.mira === "W" ? "E" : n.mira, n.mira === "W"),
      zs = n.sentado != null ? n.sentado : null;
    c.save();
    let py = sy;
    if (zs != null) {
      // sentado: el cuerpo baja hasta que la cadera queda en el asiento y lo de abajo del asiento no se ve
      const asientoY = sy - zs * cam.esc;
      py = asientoY + cadera(n) * s;
      c.beginPath();
      c.rect(sx - 200 * s, asientoY - 260 * s, 400 * s, 260 * s + 2 * s);
      c.clip();
    }
    GENTE.dibujar(c, n.id, sx, py, tiempo, { vista: mv.vista, espejo: mv.espejo, camina: !!n.camina, hablando: n.charla > 0 && J.modo === "dialogo", s });
    c.restore();
    // la jarra en la mano (y alzada cuando brinda); la bandeja de la que sirve
    const f = GENTE.FICHAS[n.id] || { alto: 1, ancho: 1 },
      sg = mv.espejo ? -1 : 1;
    if (n.jarra && mv.vista !== "N") {
      const alza = n.alza > 0 ? Math.sin(Math.min(1, n.alza / 0.9) * Math.PI) : 0,
        hx = sx + sg * (mv.vista === "E" ? 12 : 19 * f.ancho) * s,
        hy = py - (34 + alza * 30) * f.alto * s,
        g = n.id === "bergr" ? 2.2 : 1;
      R(c, hx - 4 * s * g, hy - 9 * s * g, 8 * s * g, 10 * s * g, "#7A5634");
      R(c, hx - 4 * s * g, hy - 9 * s * g, 3 * s * g, 10 * s * g, "#5A3E22");
      R(c, hx - 4.5 * s * g, hy - 11 * s * g, 9 * s * g, 3 * s * g, "#F2ECEC");
    }
    // el arpa de Sølve cuando canta: el cuerpo de la tagelharpa contra el pecho y las cuerdas que vibran
    if (n.rol === "skald" && mv.vista !== "N") {
      const by = py - 40 * f.alto * s,
        bx = sx + sg * 4 * s,
        v = Math.sin(tiempo * 14) * 0.6 * s;
      P(c, [bx - 9 * s, by + 10 * s, bx + 9 * s, by + 10 * s, bx + 11 * s, by - 6 * s, bx + 6 * s, by - 30 * s, bx - 6 * s, by - 30 * s, bx - 11 * s, by - 6 * s], "#9A5A30");
      P(c, [bx - 9 * s, by + 10 * s, bx, by + 10 * s, bx, by - 30 * s, bx - 6 * s, by - 30 * s, bx - 11 * s, by - 6 * s], "#7A3E20");
      R(c, bx - 4 * s, by - 26 * s, 8 * s, 8 * s, "#2A1008");
      for (let k = -1; k <= 1; k++) L(c, bx + k * 3 * s + v * (k === 0 ? 1 : -1), by - 26 * s, bx + k * 3 * s, by + 8 * s, "#E0D4C0", 0.8 * s);
      L(c, bx - 14 * s, by - 2 * s + Math.sin(tiempo * 7) * 3 * s, bx + 14 * s, by - 8 * s + Math.sin(tiempo * 7) * 3 * s, "#5E4430", 1.6 * s);
    }
    if (n.rol === "moza" && n.bandeja) {
      const hy = py - 92 * f.alto * s;
      P(c, [sx - 22 * s, hy, sx + 22 * s, hy, sx + 18 * s, hy + 3 * s, sx - 18 * s, hy + 3 * s], "#7A5634");
      [-12, 0, 12].forEach((dx, i) => R(c, sx + (dx - 3.5) * s, hy - 10 * s, 7 * s, 10 * s, i === 1 ? "#E0B2B2" : "#9A7448"));
    }
  }

  // ---------- dibujar ----------
  function dibujar(c, cw, ch) {
    const dt = J.modo === "juego" || J.modo === "dialogo" ? dtUlt : 0;
    camaraPaso(dt || 1e-4, cw, ch);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#0A0606";
    c.fillRect(0, 0, cw, ch);
    const g0 = VOL.cam.g;
    VOL.cam.g = cam.g;
    ctxAhora = c;
    try {
      armarProyector(cw, ch);
      // el piso, de una vez
      const piso = lienzoPiso();
      VOL.enPiso(c, PR, (cc) => cc.drawImage(piso, -HX, -HY, HX * 2, HY * 2));
      paredes(c);
      const lista = [],
        pon = (x, y, f, z = 0) => lista.push({ k: PR.hondo(x, y) + z * 1e-4, f: () => f(...PR(x, y, 0)) });
      zocalos(c, lista);
      galeria(c, lista);
      // el marco de la puerta de entrada (con la pared sur cortada se ve dónde está la salida)
      lista.push({ k: PR.hondo(PUERTA.x, HY), f: () => {
        const M = ["#2A0806", "#5A2A16", "#7A3E20"],
          x = PUERTA.x;
        VOL.caja(c, PR, x - 210, HY - 20, 0, x - 170, HY + 30, 430, M);
        VOL.caja(c, PR, x + 170, HY - 20, 0, x + 210, HY + 30, 430, M);
        VOL.caja(c, PR, x - 230, HY - 24, 420, x + 230, HY + 34, 470, M, {
          frente: (cc, l, h) => FUTHARK.dibujar(cc, "raidho", l / 2, -8, 34, "#FFD98A", 4),
          atras: (cc, l, h) => FUTHARK.dibujar(cc, "othala", l / 2, -8, 34, "#FFD98A", 4),
        });
      } });
      // los muebles
      const s = cam.esc;
      // la campana del fogón se vuelve tenue si Eromash queda detrás de ella
      const detras = PR.hondo(ero.x, ero.y) < PR.hondo(FOGON.x, FOGON.y) && Math.abs(PR(ero.x, ero.y, 0)[0] - PR(FOGON.x, FOGON.y, 0)[0]) < 420 * s;
      for (const m of MUEBLES) pon(m.x, m.y, (sx, sy) => ASSETS.dibujar(c, m.id, sx, sy, tiempo, Object.assign({}, m.o, { s, giro: m.giro || 0 }, m.id === "fogonHongo" && detras ? { tenue: true } : null)));
      // la trampilla, pintada en el piso
      lista.push({ k: -1e9, f: () => {
        const [sx, sy] = PR(TRAMPILLA.x, TRAMPILLA.y, 0);
        c.save();
        VOL.piso(c, sx, sy, cam.g);
        c.translate(sx, sy);
        c.scale(s, s);
        c.translate(-sx, -sy);
        ASSETS.dibujar(c, "trampilla", sx, sy, tiempo, { s: 1, abierta: !!st.tr });
        c.restore();
      } });
      // el banquito de Torvald junto al fuego y el cajón de Fjalar
      pon(0, -235, (sx, sy) => {
        const pr = VOL.proyector(sx, sy, cam.g, { s });
        VOL.cilindro(c, pr, 0, 0, 40, 0, 56, ["#3A1A10", "#5A2A16", "#7A3E20"], { n: 7 });
      }, -1);
      pon(-1420, -760, (sx, sy) => {
        const pr = VOL.proyector(sx, sy, cam.g, { s });
        VOL.cubo(c, pr, 0, 0, 90, 70, 40, ["#3A1A10", "#5A2A16", "#7A3E20"]);
      }, -1);
      for (const h of HONGOS) pon(h.x, h.y, (sx, sy) => ASSETS.dibujar(c, "hongosDorados", sx, sy, tiempo, { s, z: h.z, sem: h.sem }), 2);
      for (const b of ESTANDARTES) if (paredVista[b.pared]()) pon(b.x, b.y, (sx, sy) => ASSETS.dibujar(c, "estandarteEikholt", sx, sy, tiempo, { s, z: ZG - 74, largo: 300, giro: b.giro }), 3);
      // la gente
      // (lo que está parado encima de algo, como Sølve en la tarima o Fjalar en su cajón, va después de eso)
      for (const n of gente) if (n.visible) lista.push({ k: PR.hondo(n.x, n.y) + (n.z > 0 && n.z < 200 ? 400 : 1e-4), f: () => {
        const [sx, sy] = PR(n.x, n.y, n.z || 0);
        persona(c, n, sx, sy);
      } });
      // Eromash
      pon(ero.x, ero.y, (sx, sy) => {
        const z = jug.salto > 0 ? Math.sin((1 - jug.salto / 0.42) * Math.PI) * 90 : 0;
        A.dibujarJugadorEn(c, sx, sy - z * s, GK * s);
      }, 1);
      lista.sort((a, b) => a.k - b.k);
      lista.forEach((l) => l.f());
      // lo que cuelga arriba de todo: las ruedas de velas
      for (const [x, y] of LAMPARAS) {
        const [sx, sy] = PR(x, y, 0);
        ASSETS.dibujar(c, "lamparaRueda", sx, sy, tiempo, { s, z: 700 });
      }
      particulas(c);
      luz(c, cw, ch);
      dibujarGlobos(c);
    } finally {
      VOL.cam.g = g0;
    }
    const f = Math.max(Math.min(1, fundido), saliendo ? 1 - saliendo / 0.35 : 0);
    if (f > 0) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.fillStyle = "rgba(10,6,6," + f + ")";
      c.fillRect(0, 0, cw, ch);
    }
  }
  // las brasas que suben del fogón (rombos que giran y se achican) y las runas de la canción
  function particulas(c) {
    const s = cam.esc;
    for (const p of chispas) {
      const [x, y] = PR(p.u, p.w, p.z),
        q = p.vida / p.dura,
        a = q < 0.08 ? q / 0.08 : 1 - Math.pow((q - 0.08) / 0.92, 1.6),
        r = (7 - q * 5) * s;
      alfa(c, Math.max(0, a), () => {
        c.save();
        c.translate(x, y);
        c.rotate(p.giro);
        P(c, [0, -r, r * 0.6, 0, 0, r, -r * 0.6, 0], q < 0.4 ? "#FFD98A" : "#FF8D71");
        c.restore();
      });
    }
    for (const g of signos) {
      const [x, y] = PR(g.u, g.w, g.z),
        a = g.vida < 0.4 ? g.vida / 0.4 : 1 - (g.vida - 0.4) / 2.6;
      alfa(c, Math.max(0, a) * 0.9, () => FUTHARK.dibujar(c, g.runa, x, y, 40 * s, "#73D5DB", 4 * s));
    }
  }
  // la luz: oscuro a media resolución con agujeros cálidos en el fogón, las ruedas de velas, la barra, la tarima y las
  // ventanas de día; encima, el color de cada luz
  let luzCv = null,
    ctxAhora = null;
  function lucesAhora() {
    const L0 = [],
      s = cam.esc,
      pon = (x, y, z, r, col, f) => {
        const [sx, sy] = PR(x, y, z);
        L0.push({ x: sx, y: sy, r: r * s, col, f });
      };
    pon(FOGON.x, FOGON.y, 120, 1500, "255,141,113", 0.95 + Math.sin(tiempo * 7) * 0.05);
    pon(FOGON.x, FOGON.y, 540, 700, "255,217,138", 0.6);
    for (const [x, y] of LAMPARAS) pon(x, y, 720, 1050, "255,217,138", 0.85);
    pon(BARRA.x - 250, BARRA.y, 220, 650, "255,217,138", 0.8);
    pon(BARRA.x + 250, BARRA.y, 220, 650, "255,217,138", 0.8);
    for (const m of MESAS) pon(m.x, m.y, 180, 560, "255,217,138", 0.7);
    for (const m of REDONDAS) pon(m.x, m.y, 180, 420, m.o.copa ? "115,213,219" : "255,217,138", 0.65);
    pon(TARIMA.x, TARIMA.y, 260, noche ? 700 : 420, "255,217,138", noche ? 0.9 : 0.5);
    for (const h of HONGOS) pon(h.x, h.y, h.z + 30, 320, "255,217,138", 0.5);
    pon(PUERTA.x, HY - 80, 120, 520, noche ? "115,140,200" : "220,230,210", noche ? 0.35 : 0.7);
    if (!noche) {
      if (paredVista.o()) pon(-HX + 100, 150, 250, 700, "200,224,240", 0.6), pon(-HX + 100, -190, 250, 600, "200,224,240", 0.5);
      if (paredVista.n()) pon(1150, -HY + 80, 700, 800, "200,224,240", 0.6);
    }
    return L0;
  }
  function luz(c, cw, ch) {
    if (calidad() === "baja") {
      c.fillStyle = "rgba(10,5,5,0.28)";
      c.fillRect(0, 0, cw, ch);
      return;
    }
    const luces = lucesAhora();
    if (!luzCv) luzCv = document.createElement("canvas");
    const w = Math.ceil(cw / 2),
      h = Math.ceil(ch / 2);
    if (luzCv.width !== w || luzCv.height !== h) (luzCv.width = w), (luzCv.height = h);
    const n = luzCv.getContext("2d");
    n.setTransform(0.5, 0, 0, 0.5, 0, 0);
    n.globalCompositeOperation = "source-over";
    n.clearRect(0, 0, cw, ch);
    n.fillStyle = noche ? "rgba(10,5,6,0.66)" : "rgba(10,5,6,0.5)";
    n.fillRect(0, 0, cw, ch);
    n.globalCompositeOperation = "destination-out";
    for (const l of luces) {
      const g = n.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      g.addColorStop(0, "rgba(0,0,0," + 0.95 * l.f + ")");
      g.addColorStop(0.5, "rgba(0,0,0," + 0.5 * l.f + ")");
      g.addColorStop(1, "rgba(0,0,0,0)");
      n.fillStyle = g;
      n.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    c.drawImage(luzCv, 0, 0, cw, ch);
    if (calidad() === "alta") {
      c.save();
      c.globalCompositeOperation = "lighter";
      for (const l of luces) {
        const g = c.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * 0.7);
        g.addColorStop(0, "rgba(" + l.col + "," + 0.16 * l.f + ")");
        g.addColorStop(1, "rgba(" + l.col + ",0)");
        c.fillStyle = g;
        c.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
      }
      c.restore();
    }
    const v = c.createRadialGradient(cw / 2, ch / 2, ch * 0.45, cw / 2, ch / 2, Math.max(cw, ch) * 0.72);
    v.addColorStop(0, "rgba(10,6,6,0)");
    v.addColorStop(1, "rgba(10,6,6,0.55)");
    c.fillStyle = v;
    c.fillRect(0, 0, cw, ch);
  }
  // los globos de lo que se dice en las mesas (el mismo dibujo que en la ciudad)
  function dibujarGlobos(c) {
    const k = c.canvas.clientWidth ? c.canvas.width / c.canvas.clientWidth : 1;
    for (const g of globos) {
      const n = g.n,
        f = GENTE.FICHAS[n.id] || { alto: 1 },
        alto = (94 * f.alto * (n.k || 1) - (n.sentado != null ? cadera(n) - (n.sentado || 0) / GK : 0)) * GK,
        [x, y] = PR(n.x, n.y, (n.z || 0) + alto),
        a = Math.min(1, g.t * 4, (3.6 - g.t) * 2);
      globo(c, x, y - 6 * k, g.texto, a, k);
    }
  }
  function globo(c, x, y, texto, a, k) {
    c.save();
    c.globalAlpha = Math.max(0, a);
    c.font = `500 ${Math.round(13 * k)}px "DM Sans", system-ui, sans-serif`;
    const ancho = c.measureText(texto).width + 22 * k,
      alto = 26 * k;
    c.fillStyle = "rgba(242,236,236,0.95)";
    c.fillRect(x - ancho / 2, y - alto, ancho, alto);
    P(c, [x - 7 * k, y, x + 7 * k, y, x, y + 8 * k], "rgba(242,236,236,0.95)");
    c.fillStyle = "#111111";
    c.textAlign = "center";
    c.fillText(texto, x, y - 8 * k);
    c.restore();
  }

  const sistemaSala = { paso, dibujar, cercano };
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      H = A.H;
    },
    alEmpezar(extra) {
      extra.hongo = Object.assign({}, extra.hongo || {});
      st = extra.hongo;
      if (activo) {
        activo = false;
        if (J.dentro === sistemaSala) J.dentro = null;
      }
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { entrar, girar: (g) => (giroObj = cam.g = g), acercar: (z) => (zoom = z), activo: () => activo, sala: { HX, HY, ZG, ZT }, gente: () => gente, cam, ero, PR: () => PR };
})();
