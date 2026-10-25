// ---------- la Casa de Sanación por dentro (sistema SANACION) ----------
// La casa de Thora en el noroeste de Eikholt, vista de frente como la herrería (todo girable): paredes encaladas con
// vigas, piso de tablas, el hogar con el caldero de hierbas, el estante de frascos, las hierbas colgadas a secar, la
// mesa de los morteros, tres camas (Bjarki, el leñador herido, sentado en la suya; Grímr, el pescador, dormido; una
// vacía tras la cortina de lino), la tina de los baños tibios, la mesa de las piedras de Berkano con el libro de Thora y
// el jergón de Hlíf. De día Thora va de los morteros al caldero y a las camas; Hlíf, su aprendiz, trae frascos, muele,
// llena la tina y arregla las camas. De noche Thora lee junto al fuego y los demás duermen.
// Con E: hablar (Thora cura y abre su mesa como siempre: PODERES.hablarCon), moler en el mortero, oler el caldo, meter
// las manos en la tina (devuelve el aliento), leer el libro, mirar cada cosa y bajar a la despensa por la trampilla.
// Z / X giran, acercar / alejar (o la rueda) acercan. Medidas de los interiores: la gente mide unos 230 (GENTE a 2,75).
window.SANACION = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const { P, E, R, L, alfa } = DIB;
  const TAU = Math.PI * 2;
  const corto = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  let A, J, jug, H;
  let st = null; // E.extra.sanacion

  // ---------- la casa ----------
  const RX = 900, // medio ancho (oeste a este)
    RY = 580, // medio fondo (norte a sur)
    ZT = 520, // lo alto de las paredes
    GK = 2.75;
  const PUERTA = { x: -560, y: RY };
  const TRAMPILLA = { x: -180, y: 410 };
  const HOGAR = { x: -250, y: -RY + 120 };
  const ESTANTE = { x: 330, y: -RY + 50 };
  const COLGADERO = { x: -690, y: -RY + 12 };
  const MESA = { x: -160, y: -60 };
  const CAMA1 = { x: 430, y: -170 };
  const CAMA2 = { x: 720, y: -170 };
  const CAMA3 = { x: 720, y: 360 };
  const CORTINA = { x: 575, y: -170 };
  const TINA = { x: -650, y: 150 };
  const MESAB = { x: 300, y: 340 };
  const JERGON = { x: -740, y: -290 };
  const MUEBLES = [
    { id: "estanteFrascos", ...ESTANTE },
    { id: "colgaderoHierbas", ...COLGADERO, o: { z: 300 }, pared: "n" },
    { id: "camaSanacion", ...CAMA2, o: { sem: 2 } },
    { id: "cortinaLino", ...CORTINA },
    { id: "tinaBano", ...TINA },
    { id: "mesaBerkano", ...MESAB },
  ];
  // lo que choca
  const CIRCULOS = [{ x: TINA.x, y: TINA.y, r: 125 }];
  const caja = (p, a, b) => [p.x - a, p.y - b, p.x + a, p.y + b];
  const RECTAS = [
    [HOGAR.x - 225, -RY, HOGAR.x + 225, HOGAR.y + 95],
    [ESTANTE.x - 240, -RY, ESTANTE.x + 240, ESTANTE.y + 10],
    caja(MESA, 215, 85),
    caja(CAMA1, 108, 210),
    caja(CAMA2, 108, 210),
    caja(CAMA3, 108, 210),
    caja(CORTINA, 22, 170),
    caja(MESAB, 170, 72),
  ];
  function libre(x, y, r = 40) {
    if (x < -RX + 60 || x > RX - 60 || y < -RY + 60 || y > RY - 50) return false;
    for (const c of CIRCULOS) if (Math.hypot(x - c.x, y - c.y) < c.r + r) return false;
    for (const q of RECTAS) if (x > q[0] - r && x < q[2] + r && y > q[1] - r && y < q[3] + r) return false;
    for (const n of gente) if (n.visible && !n.duerme && !n.enCama && Math.hypot(x - n.x, y - n.y) < 45 + r) return false;
    return true;
  }

  // ---------- la gente ----------
  const ESTA = {
    mesa: { x: MESA.x - 60, y: MESA.y + 140, mira: "N" },
    caldero: { x: HOGAR.x + 40, y: HOGAR.y + 210, mira: "N" },
    cama1: { x: CAMA1.x - 170, y: CAMA1.y + 60, mira: "E" },
    cama3: { x: CAMA3.x - 175, y: CAMA3.y + 10, mira: "E" },
    banquito: { x: HOGAR.x - 290, y: HOGAR.y + 230, mira: "E" },
    estante: { x: ESTANTE.x - 80, y: ESTANTE.y + 150, mira: "N" },
    mesa2: { x: MESA.x + 260, y: MESA.y + 10, mira: "W" },
    tina: { x: TINA.x + 180, y: TINA.y + 20, mira: "W" },
    cama2: { x: CAMA2.x, y: CAMA2.y + 265, mira: "N" },
    jergon: { x: JERGON.x, y: JERGON.y },
  };
  const RONDA_THORA = ["mesa", "caldero", "cama1", "mesa", "caldero", "cama3"];
  const RONDA_HLIF = ["estante", "mesa2", "tina", "cama2"];
  let gente = [];
  let noche = false,
    nocheAntes = null;
  function armarGente() {
    noche = LUZ.noche(LUZ.hora(H.E.tiempo)) > 0.5;
    nocheAntes = noche;
    const p = (id, e, extra) => Object.assign({ id, x: ESTA[e].x, y: ESTA[e].y, mira: ESTA[e].mira || "S", visible: true, charla: 0, camina: false }, extra || {});
    gente = noche
      ? [p("thora", "banquito", { sentado: 56 }), p("hlif", "jergon", { duerme: true }), { id: "herido", x: CAMA1.x, y: CAMA1.y, enCama: true, duerme: true, visible: true, charla: 0 }]
      : [p("thora", "mesa", { ronda: 0, espera: 4 }), p("hlif", "estante", { ronda: 0, espera: 3 }), { id: "herido", x: CAMA1.x, y: CAMA1.y - 40, enCama: true, mira: "S", visible: true, charla: 0 }];
  }
  const quien = (id) => gente.find((n) => n.id === id);

  // ---------- estado ----------
  let activo = false,
    puerta = null,
    tiempo = 0,
    dtUlt = 1 / 60,
    fundido = 0,
    saliendo = 0;
  const ero = { x: PUERTA.x, y: PUERTA.y - 160 };
  const cam = { x: 0, y: 0, g: 0, esc: 0.5 };
  let zoom = 0.52,
    giroObj = 0,
    pegar = true;
  const globos = [];
  let proximoGlobo = 3;
  const vapor = []; // del caldero y de la tina
  const motas = []; // el polvo que flota en la luz de las ventanas
  let remueve = 0, // vueltas de la cuchara del caldero
    muele = 0, // vueltas del pilón
    moliendo = 0, // vos en el mortero
    banado = false, // ya metiste las manos en la tina en esta visita
    libro = 0,
    charlas = {};

  // ---------- entrar y salir ----------
  function entrar(p) {
    puerta = p;
    activo = true;
    ero.x = PUERTA.x;
    ero.y = PUERTA.y - 170;
    giroObj = cam.g = 0; // de frente al entrar, como la herrería; Z/X giran igual
    if (st.zoom != null) zoom = st.zoom;
    pegar = true;
    banado = false;
    armarGente();
    globos.length = 0;
    fundido = 1;
    saliendo = 0;
    J.dentro = sistemaCasa;
    jug.atk = null;
    jug.anda = 0;
    jug.mira = { vista: "N", espejo: false };
    if (window.SONIDO) SONIDO.tocar("puerta", { vol: 0.45 });
    HUD.aviso(t("sn.nombre"), "#FFD98A");
  }
  function salir() {
    if (!saliendo) saliendo = 0.35;
  }
  function terminarSalida() {
    activo = false;
    if (window.SONIDO) SONIDO.bucle("sana_fuego", "fogata", 0);
    J.dentro = null;
    const p = puerta.cosa;
    jug.x = p.x;
    jug.y = p.y + 70;
    jug.mira = { vista: "S", espejo: false };
    J.cam.x = jug.x;
    J.cam.y = jug.y - 30;
  }
  function trampilla() {
    if (!st.tr) {
      st.tr = true;
      if (window.SONIDO) SONIDO.tocar("crujido", { vol: 0.6 });
      return;
    }
    if (!window.INTERIORES || !INTERIORES.bajarDesde) return;
    activo = false;
    if (window.SONIDO) SONIDO.bucle("sana_fuego", "fogata", 0);
    INTERIORES.bajarDesde(puerta, () => {
      activo = true;
      ero.x = TRAMPILLA.x;
      ero.y = TRAMPILLA.y - 130;
      fundido = 1;
      pegar = true;
      J.dentro = sistemaCasa;
      jug.mira = { vista: "S", espejo: false };
    });
  }

  // ---------- lo que se hace adentro ----------
  const mirar = (clave) => () => A.dialogoLibre([["eromash", clave]]);
  function decir(n, clave) {
    if (!n || !n.visible) return;
    for (let i = globos.length - 1; i >= 0; i--) if (globos[i].n === n) globos.splice(i, 1);
    globos.push({ n, texto: t(clave), t: 0 });
  }
  function hablar(n) {
    if (n.duerme) return A.dialogoLibre([["eromash", n.id === "hlif" ? "sn.m_hlif_duerme" : "sn.m_herido_duerme"]]);
    if (!n.enCama) n.mira = vistaHacia(ero.x - n.x, ero.y - n.y);
    n.charla = 6;
    if (n.id === "thora" && window.PODERES) return PODERES.hablarCon({ id: "thora", x: jug.x, y: jug.y, mira: { vista: "S", espejo: false } });
    const k = (charlas[n.id] = charlas[n.id] == null ? 0 : charlas[n.id] + 1);
    A.dialogoLibre([[n.id, n.id === "hlif" ? "sn.hlif_" + (k % 4) : "sn.herido_" + (k % 3)]]);
  }
  function moler() {
    moliendo = 1.8;
    if (window.SONIDO) SONIDO.tocar("crujido", { vol: 0.3, tono: 1.6 });
    HUD.aviso(t("sn.mortero_ok"), "#7BC86C");
    A.dialogoLibre([["eromash", "sn.m_mortero"]]);
  }
  function oler() {
    for (let k = 0; k < 10; k++) humo(HOGAR.x, HOGAR.y + 20, 200, 1.4);
    A.dialogoLibre([["eromash", "sn.m_caldero"]]);
  }
  function tina() {
    if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.3, tono: 1.3 });
    for (let k = 0; k < 8; k++) humo(TINA.x, TINA.y, 110, 1);
    if (!banado) {
      banado = true;
      jug.sta = jug.staMax;
      HUD.aviso(t("sn.tina_ok"), "#73D5DB");
    }
    A.dialogoLibre([["eromash", "sn.m_tina"]]);
  }
  function leer() {
    if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.25, tono: 1.8 });
    A.dialogoLibre([["eromash", "sn.libro_" + (libro++ % 3)]]);
  }

  // ---------- lo que hay a mano ----------
  function cercano() {
    if (!activo || saliendo || J.modo !== "juego") return null;
    let mejor = null,
      dm = Infinity;
    const prueba = (d, texto, fn) => {
      if (d < dm) (dm = d), (mejor = { texto, fn });
    };
    const dist = (x, y) => Math.hypot(ero.x - x, ero.y - y);
    for (const n of gente) {
      if (!n.visible) continue;
      // a los de las camas se les habla desde el costado
      const nx = n.enCama ? n.x - 150 : n.x,
        ny = n.enCama ? CAMA1.y + 40 : n.y,
        d = dist(nx, ny);
      if (d >= 200) continue;
      const nombre = n.id === "herido" ? t("sn.nombre_herido") : t("av.nombre_" + n.id);
      prueba(d - 70, n.duerme ? t("sn.accion_mirar", [nombre]) : t("av.accion_hablar") + " · " + nombre, () => hablar(n));
    }
    const cerca = (x, y, r, texto, fn, sesgo = 0) => {
      const d = dist(x, y);
      if (d < r) prueba(d + sesgo, texto, fn);
    };
    cerca(PUERTA.x, PUERTA.y - 40, 220, t("in.accion_salir"), salir, -30);
    cerca(HOGAR.x, HOGAR.y + 220, 180, t("sn.accion_caldero"), oler, 20);
    cerca(MESA.x, MESA.y + 140, 170, t("sn.accion_mortero"), moler, 10);
    cerca(ESTANTE.x, ESTANTE.y + 150, 200, t("sn.accion_estante"), mirar("sn.m_estante"), 20);
    cerca(COLGADERO.x, -RY + 160, 200, t("sn.accion_hierbas"), mirar("sn.m_hierbas"), 20);
    cerca(TINA.x + 170, TINA.y, 180, t("sn.accion_tina"), tina);
    cerca(MESAB.x, MESAB.y - 120, 180, t("sn.accion_libro"), leer, 10);
    cerca(CAMA3.x - 160, CAMA3.y, 180, t("sn.accion_dormido"), mirar("sn.m_dormido"));
    cerca(CAMA2.x, CAMA2.y + 260, 160, t("sn.accion_cama"), mirar("sn.m_cama"), 30);
    cerca(TRAMPILLA.x, TRAMPILLA.y, 170, t(st.tr ? "in.accion_bajar" : "in.accion_trampilla"), trampilla, -40);
    return mejor;
  }

  // ---------- Eromash camina ----------
  const VEL = [0, 330, 520, 820];
  function moverA(nx, ny) {
    if (libre(nx, ny)) (ero.x = nx), (ero.y = ny);
    else if (libre(nx, ero.y)) ero.x = nx;
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
      if (ero.y > RY - 110 && Math.abs(ero.x - PUERTA.x) < 170 && dy > 0.4) salir();
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

  // ---------- el trabajo ----------
  function vistaHacia(dx, dy) {
    if (Math.abs(dy) > Math.abs(dx)) return dy > 0 ? "S" : "N";
    return dx > 0 ? "E" : "W";
  }
  // caminar hacia una estación; devuelve true al llegar (rodea las camas y la mesa por el pasillo del medio)
  function ir(n, e, dt, v = 150) {
    const dx = ESTA[e].x - n.x,
      dy = ESTA[e].y - n.y,
      d = Math.hypot(dx, dy);
    if (d < 10) {
      n.camina = false;
      n.mira = ESTA[e].mira;
      return true;
    }
    let mx = (dx / d) * Math.min(d, v * dt),
      my = (dy / d) * Math.min(d, v * dt);
    if (Math.hypot(ero.x - n.x - (dx / d) * 40, ero.y - n.y - (dy / d) * 40) < 70) return (n.camina = false);
    // si el paso derecho choca, prueba de a un eje (y si no, se corre al pasillo del medio)
    if (!libre(n.x + mx, n.y + my, 30)) {
      if (libre(n.x + mx, n.y, 30)) my = 0;
      else if (libre(n.x, n.y + my, 30)) mx = 0;
      else return (n.camina = false);
    }
    n.x += mx;
    n.y += my;
    n.camina = true;
    n.mira = vistaHacia(mx, my);
    return false;
  }
  const calidad = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  function humo(x, y, z, fuerza) {
    if (calidad() === "baja" && vapor.length > 6) return;
    vapor.push({ u: x + (Math.random() - 0.5) * 80, w: y + (Math.random() - 0.5) * 40, z, vz: (40 + Math.random() * 40) * fuerza, vida: 0, dura: 1.6 + Math.random(), r: 12 + Math.random() * 12, deriva: (Math.random() - 0.5) * 20 });
  }
  function rondaPaso(n, ronda, dt, alLlegar) {
    if (n.charla > 0) return (n.camina = false);
    const e = ronda[n.ronda % ronda.length];
    if (ir(n, e, dt)) {
      if (!n.llego) (n.llego = true), alLlegar && alLlegar(e);
      n.espera -= dt;
      if (n.espera <= 0) (n.ronda++), (n.llego = false), (n.espera = 3.5 + Math.random() * 2);
      return e;
    }
    return null;
  }
  function trabajo(dt) {
    if (noche) return;
    const th = quien("thora"),
      hl = quien("hlif");
    const enTh = th && rondaPaso(th, RONDA_THORA, dt, (e) => {
      if (e === "cama1" || e === "cama3") decir(th, "sn.g_thora_" + (e === "cama1" ? 2 : 0));
      if (e === "caldero" && Math.random() < 0.5) decir(th, "sn.g_thora_3");
    });
    if (enTh === "mesa") muele += dt * 0.9;
    if (enTh === "caldero") {
      remueve += dt * 0.6;
      if (Math.random() < dt * 3) humo(HOGAR.x, HOGAR.y + 20, 200, 1.2);
    }
    const enHl = hl && rondaPaso(hl, RONDA_HLIF, dt, (e) => {
      if (e === "tina") {
        if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.2, tono: 1.4, x: TINA.x, y: TINA.y });
        for (let k = 0; k < 6; k++) humo(TINA.x, TINA.y, 110, 1);
      }
    });
    if (enHl === "mesa2") muele += dt * 0.5;
  }
  function vidaPaso(dt) {
    noche = LUZ.noche(LUZ.hora(H.E.tiempo)) > 0.5;
    if (noche !== nocheAntes) armarGente();
    for (const n of gente) if (n.charla > 0) n.charla -= dt;
    trabajo(dt);
    if (moliendo > 0) (moliendo -= dt), (muele += dt * 1.4);
    // el caldero humea solo y la tina un poco
    const q = calidad();
    if (Math.random() < dt * (q === "alta" ? 2.4 : q === "media" ? 1.2 : 0.4)) humo(HOGAR.x, HOGAR.y + 20, 200, 0.8);
    if (q !== "baja" && Math.random() < dt * 0.8) humo(TINA.x, TINA.y, 110, 0.6);
    for (let i = vapor.length - 1; i >= 0; i--) {
      const v = vapor[i];
      v.vida += dt;
      v.z += v.vz * dt;
      v.u += v.deriva * dt;
      v.r += dt * 18;
      if (v.vida > v.dura) vapor.splice(i, 1);
    }
    // el polvo que flota en la luz (solo de día y en calidad alta)
    if (q === "alta" && !noche && motas.length < 26 && Math.random() < dt * 6)
      motas.push({ u: 200 + Math.random() * 600, w: -300 + Math.random() * 700, z: 60 + Math.random() * 300, vida: 0, dura: 4 + Math.random() * 3, fase: Math.random() * TAU });
    for (let i = motas.length - 1; i >= 0; i--) {
      const m = motas[i];
      m.vida += dt;
      m.z += Math.sin(tiempo + m.fase) * 6 * dt;
      m.u += 8 * dt;
      if (m.vida > m.dura) motas.splice(i, 1);
    }
    // lo que se dice
    proximoGlobo -= dt;
    if (proximoGlobo <= 0 && J.modo === "juego") {
      proximoGlobo = 4.5 + Math.random() * 3.5;
      const r = Math.random();
      if (globos.length < 2) {
        if (noche) decir(quien("thora"), "sn.g_noche_" + Math.floor(Math.random() * 2));
        else if (r < 0.4) decir(quien("hlif"), "sn.g_hlif_" + Math.floor(Math.random() * 3));
        else if (r < 0.7) decir(quien("herido"), "sn.g_herido_" + Math.floor(Math.random() * 2));
        else decir(quien("thora"), "sn.g_thora_" + Math.floor(Math.random() * 4));
      }
    }
    if (J.modo !== "juego") globos.length = 0;
    for (let i = globos.length - 1; i >= 0; i--) if ((globos[i].t += dt) > 3.4) globos.splice(i, 1);
  }

  // ---------- la cámara ----------
  function camaraPaso(dt, cw, ch) {
    const libreJ = J.modo === "juego";
    if (libreJ && CONTROLES.pulsado("camaraIzq")) giroObj -= dt * 1.05;
    if (libreJ && CONTROLES.pulsado("camaraDer")) giroObj += dt * 1.05;
    if (libreJ && CONTROLES.pulsado("acercar")) zoom = Math.min(1.1, zoom + dt * 0.3);
    if (libreJ && CONTROLES.pulsado("alejar")) zoom = Math.max(0.32, zoom - dt * 0.3);
    cam.g += corto(giroObj - cam.g) * Math.min(1, dt * 8);
    const escObj = zoom * Math.sqrt((cw * ch) / (1600 * 900)),
      tx = ero.x * 0.6,
      ty = ero.y * 0.6 - 170;
    if (pegar) (pegar = false), (cam.esc = escObj), (cam.x = tx), (cam.y = ty);
    cam.esc += (escObj - cam.esc) * Math.min(1, dt * 6);
    cam.x += (tx - cam.x) * Math.min(1, dt * 5);
    cam.y += (ty - cam.y) * Math.min(1, dt * 5);
  }
  addEventListener("wheel", (ev) => {
    if (!activo || J.modo !== "juego" || (ev.target && ev.target.closest && ev.target.closest(".ui, #capaCaja, #mapaLienzo"))) return;
    zoom = Math.max(0.32, Math.min(1.1, zoom - Math.sign(ev.deltaY) * 0.04));
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
    if (window.SONIDO) SONIDO.bucle("sana_fuego", "fogata", 0.22 * Math.max(0.3, 1 - Math.hypot(ero.x - HOGAR.x, ero.y - HOGAR.y) / 2200));
    if ((st.t = (st.t || 0) + dt) > 1) (st.t = 0), (st.zoom = zoom);
  }
  let PR = null;
  function armarProyector(cw, ch) {
    const co = Math.cos(cam.g),
      si = Math.sin(cam.g),
      s = cam.esc,
      ox = (cam.x * co - cam.y * si) * s,
      oy = (cam.x * si + cam.y * co) * VOL.K * s;
    PR = VOL.proyector(cw / 2 - ox, ch * 0.62 - oy, cam.g, { s });
    return PR;
  }
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
  function lienzoPiso() {
    const q = calidad() === "alta" ? 0.4 : 0.25,
      cv = lienzo("piso", RX * 2, RY * 2, q);
    if (cv.listo) return cv;
    const c = cv.getContext("2d"),
      r = DIB.azar(91);
    c.setTransform(q, 0, 0, q, RX * q, RY * q);
    // tablas de pino de este a oeste, cada una de su tono, con los clavos
    R(c, -RX, -RY, RX * 2, RY * 2, "#5A3E28");
    const ancho = 70;
    for (let y = -RY, k = 0; y < RY; y += ancho, k++) {
      let x = -RX - r() * 300;
      while (x < RX) {
        const l = 300 + r() * 360;
        R(c, x + 3, y + 3, l - 6, ancho - 6, ["#6A4A2E", "#634430", "#704E32", "#5E422A"][Math.floor(r() * 4)]);
        E(c, x + 14, y + ancho / 2, 3, 3, "#3A2418");
        x += l;
      }
    }
    // la alfombra tejida frente al hogar y la de las camas
    const alfombra = (x, y, w, h, a, b) => {
      R(c, x - w / 2, y - h / 2, w, h, a);
      R(c, x - w / 2 + 16, y - h / 2 + 16, w - 32, h - 32, b);
      for (let i = 0; i < 6; i++) R(c, x - w / 2 + 30 + i * ((w - 60) / 6), y - 8, (w - 60) / 12, 16, a);
    };
    alfombra(HOGAR.x + 40, HOGAR.y + 280, 420, 200, "#4E5C32", "#6A7A3E");
    alfombra(560, 180, 300, 140, "#5E130D", "#9C2315");
    // paja suelta junto a las camas y pétalos cerca de la tina
    for (let k = 0; k < 40; k++) R(c, 300 + r() * 500, -320 + r() * 760, 16 + r() * 14, 3, "#B0904E");
    for (let k = 0; k < 14; k++) E(c, TINA.x + (r() - 0.5) * 360, TINA.y + (r() - 0.5) * 260, 5, 3, ["#E0B2B2", "#F2ECEC"][k % 2]);
    // el camino gastado de la puerta al hogar
    alfa(c, 0.18, () => {
      c.fillStyle = "#B08A5A";
      c.beginPath();
      c.moveTo(PUERTA.x - 140, RY);
      c.quadraticCurveTo(-500, 100, HOGAR.x - 40, HOGAR.y + 200);
      c.lineTo(HOGAR.x + 140, HOGAR.y + 220);
      c.quadraticCurveTo(-300, 200, PUERTA.x + 140, RY);
      c.fill();
    });
    cv.listo = true;
    return cv;
  }
  // pared encalada con entramado de vigas, zócalo de tablas abajo
  function pintarPared(c, l, h, lado) {
    const r = DIB.azar(lado.charCodeAt(0) * 29);
    R(c, 0, -h, l, h, "#C8B8A0");
    for (let k = 0; k < 40; k++) alfa(c, 0.25, () => R(c, r() * l, -r() * h, 60 + r() * 120, 30 + r() * 40, k % 2 ? "#B8A890" : "#D8CCB4"));
    // el entramado: postes, la viga de arriba, la del medio y riostras en cruz
    const V = "#5A2A16";
    for (let x = 0; x <= l; x += 360) R(c, x - 14, -h, 28, h, V);
    R(c, 0, -h, l, 40, "#3A1A10");
    R(c, 0, -200, l, 22, V);
    for (let x = 0; x + 360 <= l; x += 720) {
      c.strokeStyle = V;
      c.lineWidth = 18;
      c.beginPath();
      c.moveTo(x + 14, -222);
      c.lineTo(x + 346, -h + 40);
      c.stroke();
    }
    // el zócalo de tablas
    R(c, 0, -110, l, 110, "#5A3E28");
    for (let x = 0; x < l; x += 60) R(c, x, -110, 3, 110, "#3A2418");
    R(c, 0, -116, l, 8, "#3A1A10");
    const ventana = (x, z0, z1, an) => {
      R(c, x - an / 2 - 18, -z1 - 14, an + 36, z1 - z0 + 30, V);
      R(c, x - an / 2, -z1, an, z1 - z0, noche ? "#141C30" : "#B8D0D8");
      if (noche) for (let k = 0; k < 3; k++) R(c, x - an / 2 + r() * an, -z1 + r() * (z1 - z0) * 0.5, 3, 3, "#F2ECEC");
      else alfa(c, 0.45, () => R(c, x - an / 2, -z1, an * 0.35, z1 - z0, "#E0ECF0"));
      R(c, x - 3, -z1, 6, z1 - z0, V);
      R(c, x - an / 2, -(z0 + z1) / 2 - 3, an, 6, V);
      // la repisa con una maceta de hierbas
      R(c, x - an / 2 - 24, -z0 + 4, an + 48, 12, "#7A5634");
      R(c, x - 20, -z0 - 30, 40, 30, "#9A5A30");
      for (let k = 0; k < 5; k++) P(c, [x - 16 + k * 8, -z0 - 30, x - 12 + k * 8, -z0 - 62 - (k % 2) * 12, x - 8 + k * 8, -z0 - 30], "#6A7A3E");
    };
    if (lado === "n") {
      ventana(RX + 500, 230, 400, 150);
      ventana(RX + 860, 230, 400, 150);
      // la runa Berkano pintada sobre el estante
      if (window.FUTHARK) FUTHARK.dibujar(c, "berkano", RX + 330, -470, 44, "#4E5C32", 6);
    } else if (lado === "e") {
      ventana(RY - 130, 200, 420, 260);
    } else if (lado === "s") {
      const px = RX - PUERTA.x;
      R(c, px - 170, -380, 340, 380, V);
      R(c, px - 150, -360, 300, 360, noche ? "#0E1420" : "#C8D8C0");
      if (!noche) R(c, px - 150, -120, 300, 120, "#6A7A4A");
      ventana(RX - 200, 200, 380, 180);
    } else {
      // oeste: un tapiz con el abedul de Berkano
      const tx = RY - 300;
      R(c, tx - 110, -430, 220, 260, "#4E5C32");
      R(c, tx - 96, -416, 192, 232, "#6A7A3E");
      R(c, tx - 6, -400, 12, 200, "#E8E0D0");
      for (let k = 0; k < 4; k++) L(c, tx, -380 + k * 40, tx + (k % 2 ? 50 : -50), -410 + k * 40, "#E8E0D0", 6);
      R(c, tx - 120, -440, 240, 12, "#3A1A10");
    }
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
    pared([[-RX, -RY, 0], [RX, -RY, 0], [RX, -RY, ZT], [-RX, -RY, ZT]], "n", RX * 2);
    pared([[-RX, RY, 0], [-RX, -RY, 0], [-RX, -RY, ZT], [-RX, RY, ZT]], "o", RY * 2);
    pared([[RX, -RY, 0], [RX, RY, 0], [RX, RY, ZT], [RX, -RY, ZT]], "e", RY * 2);
    pared([[RX, RY, 0], [-RX, RY, 0], [-RX, RY, ZT], [RX, RY, ZT]], "s", RX * 2);
    VOL.enPiso(c, PR, (cc) => {
      cc.strokeStyle = "rgba(0,0,0,0.35)";
      cc.lineWidth = 50;
      cc.strokeRect(-RX, -RY, RX * 2, RY * 2);
    });
  }
  function zocalos(c, lista) {
    const MZ = ["#2A1810", "#3A2418", "#5A3E28"];
    const base = (lado, k, f) => !paredVista[lado]() && lista.push({ k, f });
    base("s", PR.hondo(0, RY + 40), () => {
      VOL.caja(c, PR, -RX - 40, RY, 0, PUERTA.x - 170, RY + 40, 80, MZ);
      VOL.caja(c, PR, PUERTA.x + 170, RY, 0, RX + 40, RY + 40, 80, MZ);
    });
    base("e", PR.hondo(RX + 40, 0), () => VOL.caja(c, PR, RX, -RY - 40, 0, RX + 40, RY + 40, 80, MZ));
    base("n", PR.hondo(0, -RY - 40), () => VOL.caja(c, PR, -RX - 40, -RY - 40, 0, RX + 40, -RY, 80, MZ));
    base("o", PR.hondo(-RX - 40, 0), () => VOL.caja(c, PR, -RX - 40, -RY - 40, 0, -RX, RY + 40, 80, MZ));
  }

  // ---------- la gente en la vista ----------
  function persona(c, n, sx, sy) {
    const s = GK * cam.esc,
      mv = VOL.relativa(n.mira === "W" ? "E" : n.mira || "S", n.mira === "W"),
      f = GENTE.FICHAS[n.id] || { alto: 1, ancho: 1 };
    if (n.enCama) {
      // Bjarki: de día sentado en la cama con la pierna vendada; de noche la cama lo tapa (o.ocupada)
      if (n.duerme) return;
      const [bx, by] = PR(CAMA1.x, CAMA1.y - 40, 100);
      GENTE.dibujar(c, "herido", bx, by, tiempo, { vista: "S", espejo: false, s, hablando: n.charla > 0 && J.modo === "dialogo" });
      return;
    }
    if (n.duerme) {
      // Hlíf dormida en el jergón: la manta que respira y la trenza rubia
      const pr = VOL.proyector(sx, sy, cam.g, { s: cam.esc }),
        res = Math.sin(tiempo * 1.6) * 4;
      VOL.caja(c, pr, -76, -90, 22, 76, 146, 60 + res, ["#3A4428", "#4E5C32", "#6A7A3E"]);
      VOL.cilindro(c, pr, 0, -118, 26, 40, 70, ["#C8A888", "#E8C8A8", "#F0D8C0"], { n: 8 });
      VOL.cilindro(c, pr, 0, -124, 28, 60, 80, ["#A88A40", "#D8B060", "#E8C878"], { n: 8 });
      c.save();
      c.font = `700 ${Math.round(28 * cam.esc * 2)}px "DM Sans", system-ui, sans-serif`;
      c.fillStyle = "#F2ECEC";
      for (let k = 0; k < 3; k++) {
        const fz = (tiempo * 0.5 + k / 3) % 1,
          [x, y] = PR(n.x + fz * 60, n.y - 120, 120 + fz * 200);
        c.globalAlpha = Math.sin(fz * Math.PI) * 0.8;
        c.fillText("z", x, y);
      }
      c.restore();
      return;
    }
    let py = sy;
    c.save();
    if (n.sentado != null) {
      const asientoY = sy - n.sentado * cam.esc;
      py = asientoY + 30 * (f.alto || 1) * s;
      c.beginPath();
      c.rect(sx - 200 * s, asientoY - 260 * s, 400 * s, 260 * s + 2 * s);
      c.clip();
    }
    GENTE.dibujar(c, n.id, sx, py, tiempo, { vista: mv.vista, espejo: mv.espejo, camina: !!n.camina, hablando: n.charla > 0 && J.modo === "dialogo", s });
    c.restore();
    // Thora lee de noche: el libro abierto en las rodillas
    if (n.id === "thora" && noche) {
      const lx = sx,
        ly = py - 34 * s;
      P(c, [lx - 12 * s, ly, lx, ly + 3 * s, lx + 12 * s, ly, lx + 12 * s, ly - 6 * s, lx, ly - 3 * s, lx - 12 * s, ly - 6 * s], "#E0D0A8");
      L(c, lx, ly - 3 * s, lx, ly + 3 * s, "#8A6A3A", 1 * s);
    }
    // Hlíf lleva un frasco del estante a la mesa
    if (n.id === "hlif" && !noche && n.camina && RONDA_HLIF[n.ronda % RONDA_HLIF.length] === "mesa2") {
      R(c, sx + 9 * s, py - 34 * s, 6 * s, 9 * s, "#3A6A50");
      R(c, sx + 10 * s, py - 37 * s, 4 * s, 3 * s, "#D0B06A");
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
    try {
      armarProyector(cw, ch);
      const s = cam.esc;
      const piso = lienzoPiso();
      VOL.enPiso(c, PR, (cc) => cc.drawImage(piso, -RX, -RY, RX * 2, RY * 2));
      paredes(c);
      const lista = [],
        pon = (x, y, f, z = 0) => lista.push({ k: PR.hondo(x, y) + z * 1e-4, f: () => f(...PR(x, y, 0)) });
      zocalos(c, lista);
      // el marco de la puerta (bajo cuando la pared de adelante está cortada, como en la herrería)
      lista.push({ k: PR.hondo(PUERTA.x, RY), f: () => {
        const M = ["#2A1208", "#3A1A10", "#5A2A16"],
          x = PUERTA.x,
          alto = paredVista.s() ? 400 : 110;
        VOL.caja(c, PR, x - 200, RY - 20, 0, x - 160, RY + 30, alto, M);
        VOL.caja(c, PR, x + 160, RY - 20, 0, x + 200, RY + 30, alto, M);
        if (paredVista.s())
          VOL.caja(c, PR, x - 220, RY - 24, 390, x + 220, RY + 34, 440, ["#2A0806", "#5A2A16", "#7A3E20"], {
            frente: (cc, l) => FUTHARK.dibujar(cc, "berkano", l / 2, -8, 32, "#FFD98A", 4),
            atras: (cc, l) => FUTHARK.dibujar(cc, "algiz", l / 2, -8, 32, "#FFD98A", 4),
          });
      } });
      // la trampilla de la despensa, pintada en el piso
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
      // el jergón va en el piso, debajo de todo lo demás
      lista.push({ k: PR.hondo(JERGON.x, JERGON.y - 200), f: () => ASSETS.dibujar(c, "jergon", ...PR(JERGON.x, JERGON.y, 0), tiempo, { s, ocupada: noche }) });
      pon(HOGAR.x, HOGAR.y, (sx, sy) => ASSETS.dibujar(c, "hogarCaldero", sx, sy, tiempo, { s, fuego: noche ? 0.6 : 0.9, remueve, chimenea: ZT }));
      pon(MESA.x, MESA.y, (sx, sy) => ASSETS.dibujar(c, "mesaMorteros", sx, sy, tiempo, { s, muele }));
      pon(CAMA1.x, CAMA1.y, (sx, sy) => ASSETS.dibujar(c, "camaSanacion", sx, sy, tiempo, { s, sem: 0, ocupada: noche, pelo: "#5A4030" }));
      pon(CAMA3.x, CAMA3.y, (sx, sy) => ASSETS.dibujar(c, "camaSanacion", sx, sy, tiempo, { s, sem: 1, ocupada: true, pelo: "#A8A49C" }));
      for (const m of MUEBLES)
        if (!m.pared || paredVista[m.pared]()) pon(m.x, m.y, (sx, sy) => ASSETS.dibujar(c, m.id, sx, sy, tiempo, Object.assign({}, m.o, { s: s * ((m.o && m.o.s) || 1), vela: true })));
      // el banquito de Thora junto al fuego
      pon(ESTA.banquito.x, ESTA.banquito.y - 10, (sx, sy) => VOL.cilindro(c, VOL.proyector(sx, sy, cam.g, { s }), 0, 0, 40, 0, 56, ["#3A1A10", "#5A2A16", "#7A3E20"], { n: 7 }), -1);
      for (const n of gente) {
        if (!n.visible) continue;
        // Bjarki va justo encima de su cama
        const k = n.enCama ? PR.hondo(CAMA1.x, CAMA1.y) + 0.5 : n.duerme ? PR.hondo(JERGON.x, JERGON.y - 200) + 0.1 : PR.hondo(n.x, n.y) + 1e-4;
        lista.push({ k, f: () => persona(c, n, ...PR(n.x, n.y, 0)) });
      }
      pon(ero.x, ero.y, (sx, sy) => {
        const z = jug.salto > 0 ? Math.sin((1 - jug.salto / 0.42) * Math.PI) * 90 : 0;
        A.dibujarJugadorEn(c, sx, sy - z * s, GK * s);
      }, 1);
      lista.sort((a, b) => a.k - b.k);
      lista.forEach((l) => l.f());
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
  function particulas(c) {
    const s = cam.esc;
    for (const v of vapor) {
      const [x, y] = PR(v.u, v.w, v.z),
        a = Math.sin((v.vida / v.dura) * Math.PI) * 0.4;
      alfa(c, a, () => R(c, x - v.r * s, y - v.r * s, v.r * 2 * s, v.r * 2 * s, "#E8E0D0"));
    }
    for (const m of motas) {
      const [x, y] = PR(m.u, m.w, m.z),
        a = Math.sin((m.vida / m.dura) * Math.PI) * 0.6;
      alfa(c, a, () => R(c, x - 2 * s, y - 2 * s, 4 * s, 4 * s, "#FFD98A"));
    }
  }
  // la luz: de día la casa es clara (ventanas grandes); el hogar, la vela y las piedras de Berkano suman su color
  let luzCv = null;
  function luz(c, cw, ch) {
    if (calidad() === "baja") {
      c.fillStyle = noche ? "rgba(10,5,5,0.45)" : "rgba(10,5,5,0.15)";
      c.fillRect(0, 0, cw, ch);
      return;
    }
    const s = cam.esc,
      L0 = [],
      lu = (x, y, z, r, col, f) => {
        const [sx, sy] = PR(x, y, z);
        L0.push({ x: sx, y: sy, r: r * s, col, f });
      };
    lu(HOGAR.x, HOGAR.y + 60, 100, noche ? 1300 : 1000, "255,141,113", (noche ? 0.85 : 0.6) + Math.sin(tiempo * 7) * 0.04);
    lu(MESAB.x + 130, MESAB.y + 46, 160, 380, "255,217,138", 0.5);
    lu(MESAB.x - 70, MESAB.y, 130, 320, "115,213,219", 0.45 + 0.1 * Math.sin(tiempo * 2));
    lu(PUERTA.x, RY - 80, 120, 560, noche ? "115,140,200" : "220,230,210", noche ? 0.25 : 0.8);
    if (!noche) {
      lu(ESTANTE.x + 170, -RY + 120, 300, 900, "220,232,240", 0.85);
      lu(-RX + 300, -RY + 120, 300, 700, "220,232,240", 0.7);
      if (paredVista.e()) lu(RX - 80, -100, 260, 900, "200,224,240", 0.8);
    }
    if (!luzCv) luzCv = document.createElement("canvas");
    const w = Math.ceil(cw / 2),
      h = Math.ceil(ch / 2);
    if (luzCv.width !== w || luzCv.height !== h) (luzCv.width = w), (luzCv.height = h);
    const n = luzCv.getContext("2d");
    n.setTransform(0.5, 0, 0, 0.5, 0, 0);
    n.globalCompositeOperation = "source-over";
    n.clearRect(0, 0, cw, ch);
    n.fillStyle = noche ? "rgba(10,5,6,0.7)" : "rgba(10,5,6,0.32)";
    n.fillRect(0, 0, cw, ch);
    n.globalCompositeOperation = "destination-out";
    for (const l of L0) {
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
      for (const l of L0) {
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
    v.addColorStop(1, "rgba(10,6,6,0.5)");
    c.fillStyle = v;
    c.fillRect(0, 0, cw, ch);
  }
  function dibujarGlobos(c) {
    const k = c.canvas.clientWidth ? c.canvas.width / c.canvas.clientWidth : 1;
    for (const g of globos) {
      const n = g.n,
        f = GENTE.FICHAS[n.id] || { alto: 1 },
        alto = n.enCama ? 100 + 60 * GK : (94 * f.alto - (n.sentado != null ? 30 * f.alto - n.sentado / GK : 0)) * GK,
        [x, y] = n.enCama ? PR(CAMA1.x, CAMA1.y - 40, alto) : PR(n.x, n.y, alto),
        a = Math.min(1, g.t * 4, (3.4 - g.t) * 2);
      c.save();
      c.globalAlpha = Math.max(0, a);
      c.font = `500 ${Math.round(13 * k)}px "DM Sans", system-ui, sans-serif`;
      const ancho = c.measureText(g.texto).width + 22 * k,
        al = 26 * k,
        yy = y - 6 * k;
      c.fillStyle = "rgba(242,236,236,0.95)";
      c.fillRect(x - ancho / 2, yy - al, ancho, al);
      P(c, [x - 7 * k, yy, x + 7 * k, yy, x, yy + 8 * k], "rgba(242,236,236,0.95)");
      c.fillStyle = "#111111";
      c.textAlign = "center";
      c.fillText(g.texto, x, yy - 8 * k);
      c.restore();
    }
  }

  const sistemaCasa = { paso, dibujar, cercano };
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      H = A.H;
    },
    alEmpezar(extra) {
      extra.sanacion = Object.assign({}, extra.sanacion || {});
      st = extra.sanacion;
      if (activo) {
        activo = false;
        if (J.dentro === sistemaCasa) J.dentro = null;
      }
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { entrar, girar: (g) => (giroObj = cam.g = g), acercar: (z) => (zoom = z), activo: () => activo, gente: () => gente, cam, ero, cercanoTexto: () => (cercano() || {}).texto };
})();
