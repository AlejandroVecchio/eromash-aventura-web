// ---------- la herrería de Ása por dentro (sistema HERRERIA) ----------
// El taller del Barrio de los Oficios, pensado para la vista de 30° como el Hongo Dorado (todo girable): paredes de
// piedra, piso de tierra pisada con lajas alrededor de la forja, la forja con su campana y la chimenea, el fuelle, el
// yunque, la pila de templar, la muela, la pared de las herramientas, el armero de lo terminado, el banco de lo que está a
// medio hacer y el montón de carbón. Ása trabaja en un ciclo que no para de día (calentar en la forja, martillar en el
// yunque con chispas y templar en la pila con vapor); Geir, su aprendiz, sopla el fuelle cuando ella calienta y si no
// afila en la muela; un guardia de la muralla espera su punta de lanza; Brasa, la gata, duerme en las piedras tibias. De
// noche Ása descansa junto a las brasas y Geir duerme en las bolsas de carbón.
// Con E: hablar (Ása abre su forja de mejoras y responde a la historia como en el bosque), soplar el fuelle, afilar en
// la muela, acariciar a Brasa, mirar cada cosa y bajar a la carbonera por la trampilla (INTERIORES.bajarDesde).
// Z / X giran, acercar / alejar (o la rueda) acercan. Medidas de los interiores: la gente mide unos 230 (GENTE a 2,75).
window.HERRERIA = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const { P, E, R, L, alfa } = DIB;
  const TAU = Math.PI * 2;
  const corto = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  let A, J, jug, H;
  let st = null; // E.extra.herreria

  // ---------- el taller ----------
  const RX = 950, // medio ancho (oeste a este)
    RY = 620, // medio fondo (norte a sur)
    ZT = 560, // lo alto de las paredes
    GK = 2.75;
  const PUERTA = { x: -620, y: RY };
  const TRAMPILLA = { x: 640, y: 430 };
  const FORJA = { x: -150, y: -RY + 150 };
  const FUELLE = { x: -480, y: -RY + 170 };
  const YUNQUE = { x: -140, y: -110 };
  const PILA = { x: -470, y: 50 };
  const MUELA = { x: 560, y: -150 };
  const CARBON = { x: 760, y: -420 };
  const BANCO = { x: 260, y: 420 };
  const ARMERO = { x: -RX + 200, y: -170 };
  const PANOPLIA = { x: 380, y: -RY + 8 };
  const GATA = { x: 110, y: -380 };
  const MUEBLES = [
    { id: "pilaTemplar", ...PILA },
    { id: "muelaAfilar", ...MUELA, gira: true },
    { id: "montonCarbon", ...CARBON },
    { id: "bancoForja", ...BANCO },
    { id: "armeroForja", ...ARMERO },
    { id: "panopliaHerramientas", ...PANOPLIA, o: { z: 170 }, pared: "n" },
    { id: "yunque", ...YUNQUE, o: { s: 1.3 } },
  ];
  // lo que choca
  const CIRCULOS = [
    { x: YUNQUE.x, y: YUNQUE.y, r: 80 },
    { x: MUELA.x, y: MUELA.y, r: 95 },
    { x: CARBON.x, y: CARBON.y, r: 170 },
    { x: CARBON.x + 170, y: CARBON.y + 40, r: 70 },
    { x: GATA.x, y: GATA.y, r: 40 },
  ];
  const RECTAS = [
    [FORJA.x - 210, -RY, FORJA.x + 210, FORJA.y + 135],
    [FUELLE.x - 340, FUELLE.y - 60, FUELLE.x + 150, FUELLE.y + 60],
    [PILA.x - 150, PILA.y - 65, PILA.x + 150, PILA.y + 65],
    [ARMERO.x - 190, ARMERO.y - 50, ARMERO.x + 190, ARMERO.y + 50],
    [BANCO.x - 225, BANCO.y - 60, BANCO.x + 225, BANCO.y + 60],
  ];
  function libre(x, y, r = 40) {
    if (x < -RX + 60 || x > RX - 60 || y < -RY + 60 || y > RY - 50) return false;
    for (const c of CIRCULOS) if (Math.hypot(x - c.x, y - c.y) < c.r + r) return false;
    for (const q of RECTAS) if (x > q[0] - r && x < q[2] + r && y > q[1] - r && y < q[3] + r) return false;
    for (const n of gente) if (n.visible && !n.duerme && Math.hypot(x - n.x, y - n.y) < 45 + r) return false;
    return true;
  }

  // ---------- la gente ----------
  // Ása va de estación en estación; Geir sopla o afila; el guardia espera
  const ESTA = {
    forja: { x: FORJA.x, y: FORJA.y + 190, mira: "N" },
    yunque: { x: YUNQUE.x + 160, y: YUNQUE.y, mira: "W" },
    pila: { x: PILA.x + 190, y: PILA.y, mira: "W" },
    fuelle: { x: FUELLE.x - 200, y: FUELLE.y + 110, mira: "N" },
    muela: { x: MUELA.x - 130, y: MUELA.y, mira: "E" },
    banquito: { x: 60, y: -240, mira: "S" },
    bolsas: { x: 660, y: 170, mira: "W" },
  };
  let gente = [];
  let noche = false,
    nocheAntes = null;
  function armarGente() {
    noche = LUZ.noche(LUZ.hora(H.E.tiempo)) > 0.5;
    nocheAntes = noche;
    const p = (id, e, extra) => Object.assign({ id, x: ESTA[e].x, y: ESTA[e].y, mira: ESTA[e].mira, visible: true, charla: 0, camina: false }, extra || {});
    gente = noche
      ? [p("asa", "banquito", { sentado: 56 }), p("geir", "bolsas", { duerme: true })]
      : [p("asa", "forja", { tarea: "forja", espera: 2.5 }), p("geir", "fuelle", { tarea: "fuelle" }), p("hr_guardia", "pila", { x: PUERTA.x + 40, y: 230, mira: "E" })];
    golpes = 0;
  }
  const asa = () => gente.find((n) => n.id === "asa");
  const geir = () => gente.find((n) => n.id === "geir");

  // ---------- estado ----------
  let activo = false,
    puerta = null,
    tiempo = 0,
    dtUlt = 1 / 60,
    fundido = 0,
    saliendo = 0;
  const ero = { x: PUERTA.x, y: PUERTA.y - 160 };
  const cam = { x: 0, y: 0, g: 0, esc: 0.5 };
  let zoom = 0.5,
    giroObj = 0,
    pegar = true;
  const globos = [];
  let proximoGlobo = 3;
  const chispas = []; // las del yunque y la muela (vuelan y caen)
  const brasas = []; // las que suben de la forja
  const vapor = []; // el de la pila al templar
  let fuego = 1, // cuánto arde la forja
    soplo = 0, // el empujón del fuelle que soplás vos
    sopla = 0, // cuánto está apretado el fuelle ahora
    muelaG = 0, // cuánto giró la muela
    golpes = 0,
    martillo = 0, // la fase del golpe (1 arriba → 0 pegó)
    barra = 0, // lo caliente que está la pieza (1 al rojo, 0 fría)
    afilando = 0, // vos en la muela
    caricias = 0,
    charlas = {};

  // ---------- entrar y salir ----------
  function entrar(p) {
    puerta = p;
    activo = true;
    ero.x = PUERTA.x;
    ero.y = PUERTA.y - 170;
    giroObj = cam.g = 0; // siempre de frente al entrar (pedido de Alejandro); Z/X giran igual
    if (st.zoom != null) zoom = st.zoom;
    pegar = true;
    armarGente();
    globos.length = 0;
    fundido = 1;
    saliendo = 0;
    J.dentro = sistemaTaller;
    jug.atk = null;
    jug.anda = 0;
    jug.mira = { vista: "N", espejo: false };
    if (window.SONIDO) SONIDO.tocar("puerta", { vol: 0.45 });
    HUD.aviso(t("hr.nombre"), "#FFD98A");
  }
  function salir() {
    if (!saliendo) saliendo = 0.35;
  }
  function terminarSalida() {
    activo = false;
    if (window.SONIDO) SONIDO.bucle("herr_fuego", "fogata", 0);
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
    if (window.SONIDO) SONIDO.bucle("herr_fuego", "fogata", 0);
    INTERIORES.bajarDesde(puerta, () => {
      activo = true;
      ero.x = TRAMPILLA.x;
      ero.y = TRAMPILLA.y - 130;
      fundido = 1;
      pegar = true;
      J.dentro = sistemaTaller;
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
  // lo que la historia espera en la puerta de la herrería (el aro de la Lente, EL-03): el motor ve a Eromash ahí
  function asomado(fn) {
    const p = puerta && puerta.cosa;
    if (!p) return null;
    const px = jug.x,
      py = jug.y;
    jug.x = p.x + 20;
    jug.y = p.y + 60;
    try {
      return fn();
    } finally {
      jug.x = px;
      jug.y = py;
    }
  }
  function historia() {
    if (!A.cercano) return null;
    const r = asomado(() => A.cercano()),
      entrarTxt = t("in.accion_entrar", [t("in.nombre_herreria")]);
    return r && r.texto !== entrarTxt ? r : null;
  }
  function hablar(n) {
    n.mira = vistaHacia(ero.x - n.x, ero.y - n.y);
    n.charla = 6;
    if (n.id === "asa") {
      const h = historia();
      if (h) return asomado(h.fn);
      if (window.PODERES) return PODERES.hablarCon({ id: "asa", x: jug.x, y: jug.y, mira: { vista: "S", espejo: false } });
    }
    if (n.duerme) return A.dialogoLibre([["eromash", "hr.m_banco"]]);
    const k = (charlas[n.id] = charlas[n.id] == null ? 0 : charlas[n.id] + 1);
    A.dialogoLibre([[n.id, n.id === "geir" ? "hr.geir_" + (k % 4) : "hr.guardia_" + (k % 3)]]);
  }
  function soplarFuelle() {
    soplo = 2.2;
    if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.35, tono: 0.55 });
    HUD.aviso(t("hr.fuelle_ok"), "#FF8D71");
    for (let k = 0; k < 20; k++) brasa(true);
    if (!noche) decir(asa(), "hr.g_fuelle");
  }
  function afilar() {
    afilando = 1.6;
    if (window.SONIDO) SONIDO.tocar("filo", { vol: 0.5, tono: 0.8 });
    A.dialogoLibre([["eromash", "hr.m_muela"]]);
  }
  function acariciar() {
    A.dialogoLibre([["eromash", "hr.gata_" + (caricias++ % 3)]]);
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
      const d = dist(n.x, n.y);
      if (d >= 200) continue;
      const h = n.id === "asa" && historia();
      prueba(d - 30, h ? h.texto : t("av.accion_hablar") + " · " + t("av.nombre_" + n.id), () => hablar(n));
    }
    const cerca = (x, y, r, texto, fn, sesgo = 0) => {
      const d = dist(x, y);
      if (d < r) prueba(d + sesgo, texto, fn);
    };
    cerca(PUERTA.x, PUERTA.y - 40, 220, t("in.accion_salir"), salir, -30);
    cerca(FUELLE.x - 200, FUELLE.y + 110, 160, t("hr.accion_fuelle"), soplarFuelle, 10);
    cerca(FORJA.x, FORJA.y + 200, 170, t("hr.accion_forja"), mirar("in.herreria_forja"), 40);
    cerca(YUNQUE.x, YUNQUE.y + 110, 150, t("hr.accion_yunque"), mirar("hr.m_yunque"), 30);
    cerca(PILA.x, PILA.y + 120, 170, t("hr.accion_pila"), mirar("hr.m_pila"), 20);
    cerca(MUELA.x, MUELA.y + 120, 170, t("hr.accion_muela"), afilar, 10);
    cerca(PANOPLIA.x, -RY + 120, 220, t("hr.accion_herramientas"), mirar("hr.m_herramientas"));
    cerca(ARMERO.x, ARMERO.y + 130, 200, t("hr.accion_armas"), mirar("hr.m_armas"));
    cerca(BANCO.x, BANCO.y - 130, 200, t("hr.accion_banco"), mirar("hr.m_banco"));
    cerca(CARBON.x - 120, CARBON.y + 180, 200, t("hr.accion_carbon"), mirar("hr.m_carbon"), 20);
    cerca(GATA.x, GATA.y + 60, 150, t("hr.accion_gata"), acariciar, -10);
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
  // caminar hacia una estación; devuelve true al llegar
  function ir(n, e, dt, v = 170) {
    const dx = ESTA[e].x - n.x,
      dy = ESTA[e].y - n.y,
      d = Math.hypot(dx, dy);
    if (d < 10) {
      n.camina = false;
      n.mira = ESTA[e].mira;
      return true;
    }
    if (Math.hypot(ero.x - n.x - (dx / d) * 40, ero.y - n.y - (dy / d) * 40) < 70) return (n.camina = false);
    n.x += (dx / d) * Math.min(d, v * dt);
    n.y += (dy / d) * Math.min(d, v * dt);
    n.camina = true;
    n.mira = vistaHacia(dx, dy);
    return false;
  }
  const calidad = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  function golpe() {
    golpes++;
    martillo = 1;
    barra = Math.max(0, barra - 0.12);
    const q = calidad(),
      n = q === "alta" ? 16 : q === "media" ? 8 : 3;
    for (let k = 0; k < n; k++) {
      const a = Math.random() * TAU,
        v = 150 + Math.random() * 260;
      chispas.push({ u: YUNQUE.x + 20, w: YUNQUE.y, z: 160, vu: Math.cos(a) * v, vw: Math.sin(a) * v * 0.6, vz: 120 + Math.random() * 260, vida: 0, dura: 0.4 + Math.random() * 0.5 });
    }
    if (window.SONIDO) {
      SONIDO.tocar("clic", { vol: 0.5, tono: 0.5 + Math.random() * 0.08 });
      SONIDO.tocar("golpe", { vol: 0.18, tono: 1.7 });
    }
    if (J.sacudir && Math.hypot(ero.x - YUNQUE.x, ero.y - YUNQUE.y) < 300) J.sacudir(0.6);
  }
  function brasa(fuerte) {
    const a = Math.random() * TAU,
      r = Math.random() * 120;
    brasas.push({ u: FORJA.x + Math.cos(a) * r, w: FORJA.y + Math.sin(a) * r * 0.6, z: 124, vz: (fuerte ? 220 : 110) + Math.random() * 120, vida: 0, dura: 1 + Math.random() * 1.2, giro: Math.random() * TAU, deriva: (Math.random() - 0.5) * 50 });
  }
  function trabajo(dt) {
    const a = asa(),
      g = geir();
    if (!a || noche) return;
    if (a.charla > 0) {
      a.camina = false;
    } else if (a.tarea === "forja") {
      if (ir(a, "forja", dt)) {
        a.espera -= dt;
        barra = Math.min(1, barra + dt * 0.5);
        if (a.espera <= 0) (a.tarea = "yunque"), (golpes = 0), (a.espera = 0.7);
      }
    } else if (a.tarea === "yunque") {
      if (ir(a, "yunque", dt)) {
        a.espera -= dt;
        if (a.espera <= 0) {
          golpe();
          a.espera = 0.62;
          if (golpes === 3 && Math.random() < 0.5) decir(a, "hr.g_asa_" + Math.floor(Math.random() * 4));
          if (golpes >= 7) (a.tarea = barra < 0.25 || Math.random() < 0.5 ? "pila" : "forja"), (a.espera = a.tarea === "forja" ? 2.6 : 0.5);
        }
      }
    } else if (a.tarea === "pila") {
      if (ir(a, "pila", dt)) {
        a.espera -= dt;
        if (a.espera <= 0) {
          templar();
          a.tarea = "forja";
          a.espera = 2.8;
        }
      }
    }
    martillo = Math.max(0, martillo - dt * 3.2);
    // Geir: sopla cuando Ása calienta, afila cuando no
    if (g && g.charla <= 0) {
      const quiere = a.tarea === "forja" ? "fuelle" : "muela";
      if (ir(g, quiere, dt, 220)) g.tarea = quiere;
      else g.tarea = null;
    }
  }
  function templar() {
    barra = 0;
    if (window.SONIDO) SONIDO.tocar("filo", { vol: 0.45, tono: 0.45 });
    const n = calidad() === "baja" ? 4 : 18;
    for (let k = 0; k < n; k++) vapor.push({ u: PILA.x - 40 + (Math.random() - 0.5) * 120, w: PILA.y + (Math.random() - 0.5) * 50, z: 100, vz: 60 + Math.random() * 60, vida: 0, dura: 1.4 + Math.random(), r: 14 + Math.random() * 14 });
  }
  function vidaPaso(dt) {
    noche = LUZ.noche(LUZ.hora(H.E.tiempo)) > 0.5;
    if (noche !== nocheAntes) armarGente();
    for (const n of gente) if (n.charla > 0 && (n.charla -= dt) <= 0 && n.tarea == null && n.id !== "asa") n.mira = n.id === "hr_guardia" ? "E" : n.mira;
    trabajo(dt);
    const g = geir();
    // el fuelle y la muela
    const soplando = g && !noche && g.tarea === "fuelle" && !g.camina;
    sopla = soplando ? 0.5 + 0.5 * Math.sin(tiempo * 3.2) : soplo > 0 ? 0.5 + 0.5 * Math.sin(tiempo * 9) : sopla * (1 - dt * 3);
    soplo = Math.max(0, soplo - dt);
    const fObj = noche ? 0.45 : 0.7 + (soplando ? 0.35 : 0) + (soplo > 0 ? 0.6 : 0);
    fuego += (fObj - fuego) * Math.min(1, dt * 3);
    const muelando = (g && !noche && g.tarea === "muela" && !g.camina) || afilando > 0;
    afilando = Math.max(0, afilando - dt);
    if (muelando) muelaG += dt * 7;
    const q = calidad();
    if (muelando && q !== "baja" && Math.random() < dt * (q === "alta" ? 40 : 18))
      chispas.push({ u: MUELA.x + 30, w: MUELA.y + 60, z: 150, vu: 120 + Math.random() * 180, vw: 60 + Math.random() * 80, vz: 40 + Math.random() * 120, vida: 0, dura: 0.3 + Math.random() * 0.3 });
    // las brasas de la forja
    const tope = q === "alta" ? 40 : q === "media" ? 18 : 0;
    if (brasas.length < tope && Math.random() < dt * (q === "alta" ? 16 : 8) * fuego) brasa(false);
    for (let i = chispas.length - 1; i >= 0; i--) {
      const c = chispas[i];
      c.vida += dt;
      c.u += c.vu * dt;
      c.w += c.vw * dt;
      c.z += c.vz * dt;
      c.vz -= 900 * dt;
      if (c.z < 0) (c.z = 0), (c.vz *= -0.3);
      if (c.vida > c.dura) chispas.splice(i, 1);
    }
    for (let i = brasas.length - 1; i >= 0; i--) {
      const b = brasas[i];
      b.vida += dt;
      b.z += b.vz * dt;
      b.u += b.deriva * dt;
      b.giro += dt * 3;
      if (b.vida > b.dura || b.z > 330) brasas.splice(i, 1);
    }
    for (let i = vapor.length - 1; i >= 0; i--) {
      const v = vapor[i];
      v.vida += dt;
      v.z += v.vz * dt;
      v.r += dt * 20;
      if (v.vida > v.dura) vapor.splice(i, 1);
    }
    // lo que se dice
    proximoGlobo -= dt;
    if (proximoGlobo <= 0 && J.modo === "juego") {
      proximoGlobo = 4 + Math.random() * 3.5;
      const a = asa(),
        n = gente.filter((p) => p.visible && !p.duerme && p.charla <= 0)[Math.floor(Math.random() * 3)];
      if (n && globos.length < 2) {
        if (noche) decir(a, "hr.g_noche_" + Math.floor(Math.random() * 2));
        else if (n.id === "geir") decir(n, "hr.g_geir_" + Math.floor(Math.random() * 3));
        else if (n.id === "hr_guardia") decir(n, "hr.g_guardia_" + Math.floor(Math.random() * 2));
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
      ty = ero.y * 0.6 - 180;
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
    if (window.SONIDO) SONIDO.bucle("herr_fuego", "fogata", (0.25 + 0.25 * fuego) * Math.max(0.3, 1 - Math.hypot(ero.x - FORJA.x, ero.y - FORJA.y) / 2200));
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
      r = DIB.azar(73);
    c.setTransform(q, 0, 0, q, RX * q, RY * q);
    // tierra pisada, más oscura de hollín cerca de la forja
    R(c, -RX, -RY, RX * 2, RY * 2, "#3A2A20");
    for (let k = 0; k < 140; k++) P(c, DIB.poli(-RX + r() * RX * 2, -RY + r() * RY * 2, 40 + r() * 80, 20 + r() * 40, 6, r() * 6), ["#34261C", "#402E22", "#382A1E"][k % 3]);
    // las lajas alrededor de la forja y el yunque, en medio círculo
    for (let k = 0; k < 46; k++) {
      const a = Math.PI * (0.05 + r() * 0.9),
        d = 120 + r() * 520;
      alfa(c, 0.55, () => P(c, DIB.poli(FORJA.x + Math.cos(a) * d * 1.2, FORJA.y + 120 + Math.sin(a) * d * 0.9, 60 + r() * 30, 40 + r() * 20, 6, r() * 6), ["#3E3842", "#46404A", "#36303A"][k % 3]));
    }
    // el hollín y las marcas de las chispas
    alfa(c, 0.35, () => P(c, DIB.poli(FORJA.x, FORJA.y + 260, 420, 260, 12, 0.4), "#141010"));
    for (let k = 0; k < 60; k++) E(c, YUNQUE.x + (r() - 0.5) * 360, YUNQUE.y + (r() - 0.5) * 240, 4, 3, "#141010");
    // el camino gastado de la puerta al yunque
    alfa(c, 0.2, () => {
      c.fillStyle = "#7A5A40";
      c.beginPath();
      c.moveTo(PUERTA.x - 150, RY);
      c.quadraticCurveTo(-400, 200, YUNQUE.x + 60, YUNQUE.y + 140);
      c.lineTo(YUNQUE.x + 220, YUNQUE.y + 160);
      c.quadraticCurveTo(-200, 300, PUERTA.x + 150, RY);
      c.fill();
    });
    // recortes de hierro tirados
    for (let k = 0; k < 18; k++) R(c, -500 + r() * 900, -200 + r() * 500, 14 + r() * 20, 4, "#6E6A6E");
    cv.listo = true;
    return cv;
  }
  // piedra en hiladas, como la pared de la herrería de afuera
  function pintarPared(c, l, h, lado) {
    const r = DIB.azar(lado.charCodeAt(0) * 17);
    R(c, 0, -h, l, h, "#2A262E");
    const alto = 64;
    for (let y = 0, k = 0; y < h; y += alto, k++) {
      let x = -r() * 80;
      while (x < l) {
        const w = 90 + r() * 110;
        R(c, x + 4, -y - alto + 4, w - 8, alto - 8, ["#46404A", "#4E4852", "#3E3842", "#57515B"][Math.floor(r() * 4)]);
        x += w;
      }
    }
    // el hollín que sube por arriba y las vigas del techo
    alfa(c, 0.45, () => R(c, 0, -h, l, h * 0.3, "#141010"));
    R(c, 0, -h, l, 36, "#2A0806");
    for (let x = 120; x < l; x += 420) R(c, x - 18, -h, 36, 70, "#3A1A10");
    R(c, 0, -46, l, 46, "#1E1A20");
    const ventana = (x, z0, z1, an, arco) => {
      R(c, x - an / 2 - 16, -z1 - 10, an + 32, z1 - z0 + 26, "#1E1A20");
      c.fillStyle = noche ? "#141C30" : "#9AB8C8";
      c.beginPath();
      c.moveTo(x - an / 2, -z0);
      c.lineTo(x - an / 2, -z1 + (arco ? an / 2 : 0));
      if (arco) c.arc(x, -z1 + an / 2, an / 2, Math.PI, 0);
      else c.lineTo(x + an / 2, -z1);
      c.lineTo(x + an / 2, -z0);
      c.fill();
      if (noche) for (let k = 0; k < 3; k++) R(c, x - an / 2 + r() * an, -z1 + an / 2 + r() * (z1 - z0) * 0.4, 3, 3, "#F2ECEC");
      else alfa(c, 0.4, () => R(c, x - an / 2, -z1 + an / 2, an * 0.3, z1 - z0 - an / 2, "#C8DCE4"));
      R(c, x - 3, -z1 + 10, 6, z1 - z0 - 10, "#1E1A20");
    };
    if (lado === "n") {
      // dos troneras altas a los lados de la chimenea
      ventana(RX + 220, 330, 470, 60, true);
      ventana(RX + 760, 330, 470, 60, true);
    } else if (lado === "e") {
      // la ventana grande en arco que da a la calle de los oficios (de norte a sur: x de la pintura = y + RY)
      ventana(RY - 50, 150, 420, 220, true);
      // la herradura de la suerte sobre la ventana
      c.strokeStyle = "#8A8E92";
      c.lineWidth = 10;
      c.beginPath();
      c.arc(RY - 50, -470, 24, 0.15 * Math.PI, 0.85 * Math.PI, true);
      c.stroke();
    } else if (lado === "s") {
      // la puerta (de este a oeste: x de la pintura = RX - x)
      const px = RX - PUERTA.x;
      R(c, px - 170, -380, 340, 380, "#1E1A20");
      R(c, px - 150, -360, 300, 360, noche ? "#0E1420" : "#C8D8C0");
      if (!noche) R(c, px - 150, -120, 300, 120, "#6A7A4A");
      ventana(RX - 300, 160, 380, 140, true);
    } else {
      // la pared oeste (de sur a norte: x de la pintura = RY - y): un estante con jarras y el cartel del yunque
      const ex = RY - 420;
      R(c, ex - 160, -330, 320, 14, "#5A2A16");
      [-110, -50, 20, 90].forEach((d, i) => R(c, ex + d - 16, -380, 32, 50, ["#7A5634", "#5A5E62", "#7A3E20", "#5A5E62"][i]));
      if (window.FUTHARK) FUTHARK.dibujar(c, "kenaz", RY + 400, -440, 46, "#FF8D71", 5);
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
      cc.strokeStyle = "rgba(0,0,0,0.45)";
      cc.lineWidth = 60;
      cc.strokeRect(-RX, -RY, RX * 2, RY * 2);
    });
  }
  function zocalos(c, lista) {
    const MZ = ["#1E1A20", "#2E2A32", "#46404A"];
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
      mv = VOL.relativa(n.mira === "W" ? "E" : n.mira, n.mira === "W"),
      f = GENTE.FICHAS[n.id] || { alto: 1, ancho: 1 };
    if (n.duerme) {
      // Geir dormido en las bolsas: el bulto que respira y la cabeza colorada
      const pr = VOL.proyector(sx, sy, cam.g, { s: cam.esc }),
        res = Math.sin(tiempo * 1.6) * 4;
      VOL.sombra(pr ? c : c, pr, 0, 0, 160, 70, 0.4);
      [[-90, 0], [40, -10], [-20, 30]].forEach(([u, w]) => VOL.cilindro(c, pr, u, w, 60, 0, 44, ["#4A3E2A", "#6A5A3E", "#8A7A54"], { n: 8 }));
      VOL.caja(c, pr, -130, -50, 40, 120, 50, 80 + res, ["#3A2418", "#4A3020", "#6A4A2E"]);
      VOL.cilindro(c, pr, -150, 0, 28, 40, 90, ["#B89070", "#D8B090", "#E8C8A8"], { n: 8 });
      VOL.cilindro(c, pr, -158, 0, 30, 80, 100, ["#A0602A", "#C8803A", "#D89A5A"], { n: 8 });
      c.save();
      c.font = `700 ${Math.round(28 * cam.esc * 2)}px "DM Sans", system-ui, sans-serif`;
      c.fillStyle = "#F2ECEC";
      for (let k = 0; k < 3; k++) {
        const fz = (tiempo * 0.5 + k / 3) % 1,
          [x, y] = PR(n.x - 150 + fz * 60, n.y, 160 + fz * 200);
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
    // el martillo de Ása: arriba, cae, pega
    if (n.id === "asa" && !noche && n.tarea === "yunque" && !n.camina && mv.vista !== "N") {
      const sg = mv.espejo ? -1 : 1,
        hx = sx + sg * (mv.vista === "E" ? 14 : 20) * s,
        hy = py - 40 * f.alto * s,
        a = -0.4 - martillo * 1.9, // ángulo del mango: hacia adelante y abajo al pegar
        lx = hx + sg * Math.cos(a) * 34 * s,
        ly = hy + Math.sin(a) * 34 * s;
      L(c, hx, hy, lx, ly, "#7A3E20", 3.5 * s);
      c.save();
      c.translate(lx, ly);
      c.rotate(sg > 0 ? a : Math.PI - a);
      R(c, -5 * s, -9 * s, 10 * s, 18 * s, "#3A3438");
      R(c, -5 * s, -9 * s, 4 * s, 18 * s, "#5A5E62");
      c.restore();
    }
    // la tenaza con la pieza al rojo cuando calienta
    if (n.id === "asa" && !noche && n.tarea === "forja" && !n.camina) {
      const [bx, by] = PR(FORJA.x + 30, FORJA.y + 40, 130);
      L(c, sx + 8 * s, py - 40 * f.alto * s, bx, by, "#3A3438", 2.5 * s);
    }
  }
  // la pieza en el yunque (al rojo y enfriándose)
  function pieza(c) {
    const a = asa();
    if (!a || noche || a.tarea !== "yunque" || a.camina) return;
    const p0 = PR(YUNQUE.x - 30, YUNQUE.y, 156),
      p1 = PR(YUNQUE.x + 60, YUNQUE.y, 156),
      col = barra > 0.6 ? "#FFD98A" : barra > 0.3 ? "#FF8D71" : "#C8402D";
    L(c, p0[0], p0[1], p1[0], p1[1], col, 7 * cam.esc);
    if (calidad() !== "baja") DIB.halo(c, (p0[0] + p1[0]) / 2, p0[1], 60 * cam.esc, "#FF8D71", 0.3 + barra * 0.4);
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
      // el marco de la puerta de entrada
      lista.push({ k: PR.hondo(PUERTA.x, RY), f: () => {
        const M = ["#1E1A20", "#3E3842", "#57515B"],
          x = PUERTA.x;
        // con la pared de adelante cortada, el marco queda bajo como el zócalo y no tapa el taller
        if (!paredVista.s()) {
          VOL.caja(c, PR, x - 200, RY - 20, 0, x - 160, RY + 30, 110, M);
          VOL.caja(c, PR, x + 160, RY - 20, 0, x + 200, RY + 30, 110, M);
          return;
        }
        VOL.caja(c, PR, x - 200, RY - 20, 0, x - 160, RY + 30, 400, M);
        VOL.caja(c, PR, x + 160, RY - 20, 0, x + 200, RY + 30, 400, M);
        VOL.caja(c, PR, x - 220, RY - 24, 390, x + 220, RY + 34, 440, ["#2A0806", "#5A2A16", "#7A3E20"], {
          frente: (cc, l) => FUTHARK.dibujar(cc, "kenaz", l / 2, -8, 32, "#FFD98A", 4),
          atras: (cc, l) => FUTHARK.dibujar(cc, "othala", l / 2, -8, 32, "#FFD98A", 4),
        });
      } });
      // la trampilla de la carbonera, pintada en el piso
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
      // la forja y el fuelle (los dos se mueven con el trabajo)
      pon(FORJA.x, FORJA.y, (sx, sy) => ASSETS.dibujar(c, "forjaGrande", sx, sy, tiempo, { s, fuego, chimenea: ZT }));
      pon(FUELLE.x, FUELLE.y, (sx, sy) => ASSETS.dibujar(c, "fuelle", sx, sy, tiempo, { s, sopla }));
      for (const m of MUEBLES)
        if (!m.pared || paredVista[m.pared]()) pon(m.x, m.y, (sx, sy) => ASSETS.dibujar(c, m.id, sx, sy, tiempo, Object.assign({ sem: 3 }, m.o, { s: s * ((m.o && m.o.s) || 1), giro: m.giro || 0, gira: m.gira ? muelaG : 0, pechera: m.id === "bancoForja" && window.GOINN && GOINN.vencido && GOINN.vencido() })));
      // el banquito de Ása junto a la forja
      pon(ESTA.banquito.x, ESTA.banquito.y - 10, (sx, sy) => VOL.cilindro(c, VOL.proyector(sx, sy, cam.g, { s }), 0, 0, 40, 0, 56, ["#3A1A10", "#5A2A16", "#7A3E20"], { n: 7 }), -1);
      // Brasa: duerme de día, de noche se sienta junto a Ása
      pon(GATA.x, GATA.y, (sx, sy) => ASSETS.dibujar(c, "gataForja", sx, sy, tiempo, { s, duerme: !noche, giro: noche ? 0 : 20 }));
      lista.push({ k: PR.hondo(YUNQUE.x, YUNQUE.y) + 0.5, f: () => pieza(c) });
      for (const n of gente) if (n.visible) lista.push({ k: PR.hondo(n.x, n.y) + 1e-4, f: () => persona(c, n, ...PR(n.x, n.y, 0)) });
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
    for (const p of chispas) {
      const [x, y] = PR(p.u, p.w, p.z),
        a = 1 - p.vida / p.dura;
      alfa(c, Math.max(0, a), () => R(c, x - 2.5 * s, y - 2.5 * s, 5 * s, 5 * s, a > 0.5 ? "#FFD98A" : "#FF8D71"));
    }
    for (const b of brasas) {
      const [x, y] = PR(b.u, b.w, b.z),
        q = b.vida / b.dura,
        r = (7 - q * 5) * s;
      alfa(c, Math.max(0, 1 - q), () => {
        c.save();
        c.translate(x, y);
        c.rotate(b.giro);
        P(c, [0, -r, r * 0.6, 0, 0, r, -r * 0.6, 0], q < 0.4 ? "#FFD98A" : "#FF8D71");
        c.restore();
      });
    }
    for (const v of vapor) {
      const [x, y] = PR(v.u, v.w, v.z),
        a = Math.sin((v.vida / v.dura) * Math.PI) * 0.5;
      alfa(c, a, () => R(c, x - v.r * s, y - v.r * s, v.r * 2 * s, v.r * 2 * s, "#E0D8D0"));
    }
  }
  // la luz: casi todo sale de la forja (más fuerte cuando sopla el fuelle); de día, la ventana grande y la puerta
  let luzCv = null;
  function luz(c, cw, ch) {
    if (calidad() === "baja") {
      c.fillStyle = "rgba(10,5,5,0.3)";
      c.fillRect(0, 0, cw, ch);
      return;
    }
    const s = cam.esc,
      L0 = [],
      lu = (x, y, z, r, col, f) => {
        const [sx, sy] = PR(x, y, z);
        L0.push({ x: sx, y: sy, r: r * s, col, f });
      };
    lu(FORJA.x, FORJA.y + 80, 140, 1400 + 500 * fuego, "255,141,113", Math.min(1, 0.6 + 0.35 * fuego) + Math.sin(tiempo * 8) * 0.04);
    lu(YUNQUE.x, YUNQUE.y, 170, 300 + 500 * martillo, "255,217,138", 0.3 + 0.6 * martillo);
    if (afilando > 0 || (geir() && geir().tarea === "muela")) lu(MUELA.x + 40, MUELA.y + 50, 150, 380, "255,217,138", 0.45);
    lu(PUERTA.x, RY - 80, 120, 560, noche ? "115,140,200" : "220,230,210", noche ? 0.3 : 0.75);
    if (!noche && paredVista.e()) lu(RX - 80, -50, 260, 900, "200,224,240", 0.7);
    if (!luzCv) luzCv = document.createElement("canvas");
    const w = Math.ceil(cw / 2),
      h = Math.ceil(ch / 2);
    if (luzCv.width !== w || luzCv.height !== h) (luzCv.width = w), (luzCv.height = h);
    const n = luzCv.getContext("2d");
    n.setTransform(0.5, 0, 0, 0.5, 0, 0);
    n.globalCompositeOperation = "source-over";
    n.clearRect(0, 0, cw, ch);
    n.fillStyle = noche ? "rgba(10,5,6,0.72)" : "rgba(10,5,6,0.55)";
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
        g.addColorStop(0, "rgba(" + l.col + "," + 0.2 * l.f + ")");
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
  function dibujarGlobos(c) {
    const k = c.canvas.clientWidth ? c.canvas.width / c.canvas.clientWidth : 1;
    for (const g of globos) {
      const n = g.n,
        f = GENTE.FICHAS[n.id] || { alto: 1 },
        alto = (94 * f.alto - (n.sentado != null ? 30 * f.alto - n.sentado / GK : 0)) * GK,
        [x, y] = PR(n.x, n.y, alto),
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

  const sistemaTaller = { paso, dibujar, cercano };
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      H = A.H;
    },
    alEmpezar(extra) {
      extra.herreria = Object.assign({}, extra.herreria || {});
      st = extra.herreria;
      if (activo) {
        activo = false;
        if (J.dentro === sistemaTaller) J.dentro = null;
      }
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { entrar, girar: (g) => (giroObj = cam.g = g), acercar: (z) => (zoom = z), activo: () => activo, gente: () => gente, cam, ero, cercanoTexto: () => (cercano() || {}).texto, soplar: soplarFuelle };
})();
