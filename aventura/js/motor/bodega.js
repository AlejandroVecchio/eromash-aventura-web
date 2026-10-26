// ---------- la bodega del Hongo Dorado por dentro (sistema BODEGA) ----------
// La bodega de Ulf bajo la taberna, en volumen y vista de frente como la Casa de las Lindes (todo girable): piso de
// tierra apisonada con lajas, paredes de piedra de campo y, al fondo, el muro viejo de bloques grandes con la puerta de
// piedra de Góinn y sus doce huecos (goinn.js), con raíces que salen de entre las piedras. La cuba grande de la
// hidromiel del invierno largo, el estante de los toneles, el colgadero de jamones, el aljibe, la mesa de catar de Ulf,
// el cofre y la escalera que sube a la barra. De día baja Tyra a llenar jarras; a la tarde y a la noche baja Ulf a
// catar; de madrugada no baja nadie y una rata cruza la bodega.
// Con E: hablar, un trago de la cuba (cura un poco, una vez por visita), sacar agua del aljibe (devuelve el aliento),
// mirar cada cosa, abrir el cofre, la puerta de piedra (GOINN.puerta) y subir. Z / X giran, la rueda acerca.
// Se llega con INTERIORES.bajarDesde desde la sala del Hongo Dorado: allá se pasa a BODEGA.entrar(p, alSubir).
window.BODEGA = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const { P, E, R, L, alfa } = DIB;
  const TAU = Math.PI * 2;
  const corto = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  let A, J, jug, H;
  let st = null; // E.extra.bodega

  // ---------- la bodega ----------
  const RX = 800,
    RY = 520,
    ZT = 400,
    GK = 2.75;
  const ESCALERA = { x: 600, y: -RY + 80 };
  const PIE = { x: 660, y: -RY + 240 }; // donde se llega bajando
  const PUERTA = { x: -230, y: -RY + 14 };
  const CUBA = { x: -400, y: -20 };
  const CANILLA = { x: CUBA.x, y: CUBA.y + 250 };
  const ESTANTE = { x: 250, y: 90 };
  const COLGADERO = { x: 470, y: 380 };
  const ALJIBE = { x: -640, y: -290 };
  const MESA = { x: -110, y: 360 };
  const COFRE = { x: 720, y: 60 };
  const BARRILES = { x: -680, y: 420 };
  const RAICES = [{ x: -520, y: -RY + 30, sem: 5 }, { x: 70, y: -RY + 30, sem: 8 }];
  const caja = (p, a, b) => [p.x - a, p.y - b, p.x + a, p.y + b];
  const RECTAS = [
    [ESCALERA.x - 380, -RY, ESCALERA.x + 40, ESCALERA.y + 80],
    [CUBA.x - 130, CUBA.y - 215, CUBA.x + 130, CUBA.y + 285],
    caja(ESTANTE, 250, 65),
    caja(COLGADERO, 210, 30),
    caja(MESA, 155, 55),
    caja(COFRE, 70, 50),
    caja(BARRILES, 110, 70),
    [PUERTA.x - 140, -RY, PUERTA.x + 140, -RY + 50],
  ];
  const CIRCULOS = [[ALJIBE.x, ALJIBE.y, 105]];
  function libre(x, y, r = 40, yo = null) {
    if (x < -RX + 60 || x > RX - 60 || y < -RY + 60 || y > RY - 60) return false;
    for (const q of RECTAS) if (x > q[0] - r && x < q[2] + r && y > q[1] - r && y < q[3] + r) return false;
    for (const [cx, cy, cr] of CIRCULOS) if (Math.hypot(x - cx, y - cy) < cr + r) return false;
    for (const n of gente) if (n !== yo && n.visible && Math.hypot(x - n.x, y - n.y) < 45 + r) return false;
    return true;
  }

  // ---------- la gente: quien baja según la hora ----------
  const ESTA = {
    pie: { x: PIE.x, y: PIE.y, mira: "S" },
    canilla: { x: CANILLA.x + 175, y: CANILLA.y - 20, mira: "W" },
    estante: { x: ESTANTE.x, y: ESTANTE.y + 150, mira: "N" },
    colgadero: { x: COLGADERO.x - 60, y: COLGADERO.y - 110, mira: "S" },
    mesa: { x: MESA.x + 10, y: MESA.y - 110, mira: "S" },
    cuba: { x: CUBA.x + 190, y: CUBA.y - 60, mira: "W" },
    aljibe: { x: ALJIBE.x + 170, y: ALJIBE.y + 80, mira: "W" },
  };
  const RONDAS = {
    tyra: ["canilla", "estante", "colgadero", "pie"],
    ulf: ["mesa", "canilla", "cuba", "estante", "mesa", "pie"],
  };
  let gente = [];
  let fase = null; // dia | tarde | noche
  let arriba = 8; // cuánto falta para que baje alguien
  function faseAhora() {
    const h = LUZ.hora(H.E.tiempo);
    return h >= 6 && h < 18 ? "dia" : h >= 18 || h < 1 ? "tarde" : "noche";
  }
  function bajaAlguien() {
    const id = fase === "dia" ? "tyra" : fase === "tarde" ? "ulf" : null;
    if (!id) return;
    gente = [{ id, x: PIE.x, y: PIE.y, mira: "S", visible: true, charla: 0, camina: false, ronda: 0, espera: RONDAS[id][0] === "mesa" ? 8 : 3, llego: false }];
    if (window.SONIDO) SONIDO.tocar("crujido", { vol: 0.35, tono: 1.3 });
  }
  const quien = (id) => gente.find((n) => n.id === id);
  // la rata de la madrugada: cruza de una pared a la otra, se para y huye si Eromash se acerca
  const rata = { x: 0, y: 0, vx: 0, t: 0, vista: false };

  // ---------- estado ----------
  let activo = false,
    puerta = null,
    alSubir = null,
    tiempo = 0,
    dtUlt = 1 / 60,
    fundido = 0,
    saliendo = 0;
  const ero = { x: PIE.x, y: PIE.y };
  const cam = { x: 0, y: 0, g: 0, esc: 0.5 };
  let zoom = 0.6,
    giroObj = 0,
    pegar = true;
  const globos = [];
  let proximoGlobo = 4;
  const gotas = []; // las que caen del techo
  const motas = []; // la luz rúnica de las raíces y de la puerta
  let trago = false, // ya tomó en esta visita
    balde = 0,
    baldeVa = 0,
    charlas = {},
    vistoRaices = 0;

  // ---------- entrar y salir ----------
  function entrar(p, alVolver) {
    puerta = p;
    alSubir = alVolver;
    activo = true;
    ero.x = PIE.x;
    ero.y = PIE.y;
    giroObj = cam.g = 0;
    if (st.zoom != null) zoom = st.zoom;
    pegar = true;
    fase = faseAhora();
    gente = [];
    arriba = 4 + Math.random() * 6;
    globos.length = 0;
    trago = false;
    fundido = 1;
    saliendo = 0;
    J.dentro = sistemaCasa;
    jug.atk = null;
    jug.anda = 0;
    jug.mira = { vista: "S", espejo: false };
    if (window.SONIDO) SONIDO.tocar("crujido", { vol: 0.5 });
    HUD.aviso(t("in.sotano_bodega"), "#E0B2B2");
  }
  function apagar() {
    activo = false;
    if (window.SONIDO) SONIDO.bucle("bodega_gota", "fogata", 0);
  }
  function subir() {
    if (!saliendo) saliendo = 0.35;
  }
  function terminarSalida() {
    apagar();
    J.dentro = null;
    if (alSubir) alSubir();
  }

  // ---------- lo que se hace adentro ----------
  const mirar = (clave) => () => A.dialogoLibre([["eromash", clave]]);
  function decir(n, clave) {
    if (!n || !n.visible) return;
    for (let i = globos.length - 1; i >= 0; i--) if (globos[i].n === n) globos.splice(i, 1);
    globos.push({ n, texto: t(clave), t: 0 });
  }
  function hablar(n) {
    n.mira = vistaHacia(ero.x - n.x, ero.y - n.y);
    n.charla = 6;
    const k = (charlas[n.id] = charlas[n.id] == null ? 0 : charlas[n.id] + 1);
    A.dialogoLibre([[n.id, "bd." + n.id + "_" + (k % 4)]]);
  }
  function tomar() {
    if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.3, tono: 0.6 });
    if (trago) return A.dialogoLibre([["eromash", "bd.m_cuba_otra"]]);
    trago = true;
    jug.hp = Math.min(jug.hpMax, jug.hp + 25);
    HUD.aviso(t("bd.cuba_ok"), "#FFD98A");
    if (window.ANIMA && ANIMA.gesto) ANIMA.gesto("feliz");
    const u = quien("ulf");
    if (u) return A.dialogoLibre([["eromash", "bd.m_cuba"], ["ulf", "bd.ulf_trago"]]);
    A.dialogoLibre([["eromash", "bd.m_cuba"]]);
  }
  function agua() {
    baldeVa = 1;
    if (window.SONIDO) SONIDO.tocar("crujido", { vol: 0.4, tono: 0.8 });
    J.retrasar(1.1, () => {
      jug.sta = jug.staMax;
      HUD.aviso(t("bd.agua_ok"), "#73D5DB");
      A.dialogoLibre([["eromash", "bd.m_aljibe"]]);
    });
  }
  function cofre() {
    if (st.cofre) return A.dialogoLibre([["eromash", "bd.m_cofre_vacio"]]);
    st.cofre = 1;
    if (window.SONIDO) SONIDO.tocar("crujido", { vol: 0.7 });
    const plata = 44;
    PODERES.darPlata(plata);
    HUD.aviso(t("in.cofre_plata", [plata]), "#FFD98A");
    J.retrasar(0.5, () => PODERES.darFragmento());
  }
  function puertaPiedra() {
    if (window.GOINN) return GOINN.puerta();
    A.dialogoLibre([["eromash", "bd.m_puerta"]]);
  }
  function raices() {
    vistoRaices = 2;
    A.dialogoLibre([["eromash", window.GOINN && GOINN.abierta() ? "bd.m_raices_abierta" : "bd.m_raices"]]);
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
      if (d < 200) prueba(d - 70, t("av.accion_hablar") + " · " + t("av.nombre_" + n.id), () => hablar(n));
    }
    const cerca = (x, y, r, texto, fn, sesgo = 0) => {
      const d = dist(x, y);
      if (d < r) prueba(d + sesgo, texto, fn);
    };
    cerca(ESCALERA.x - 20, ESCALERA.y + 160, 200, t("bd.accion_subir"), subir, -20);
    cerca(CANILLA.x + 130, CANILLA.y - 10, 190, t("bd.accion_cuba"), tomar, -10);
    cerca(CUBA.x + 190, CUBA.y - 80, 180, t("bd.accion_mirar_cuba"), mirar("bd.m_cuba_mirar"), 20);
    cerca(ESTANTE.x, ESTANTE.y + 150, 220, t("bd.accion_toneles"), mirar("bd.m_toneles"), 10);
    cerca(COLGADERO.x, COLGADERO.y - 110, 210, t("bd.accion_colgadero"), mirar("bd.m_colgadero"), 10);
    cerca(ALJIBE.x + 150, ALJIBE.y + 90, 190, t("bd.accion_aljibe"), agua, 0);
    cerca(MESA.x, MESA.y - 110, 190, t("bd.accion_mesa"), mirar("bd.m_mesa"), 20);
    cerca(COFRE.x - 10, COFRE.y + 130, 170, t("in.accion_cofre"), cofre, -10);
    cerca(BARRILES.x + 40, BARRILES.y - 120, 180, t("in.accion_barriles"), mirar("in.sot_bodega_barriles2"), 20);
    cerca(PUERTA.x, PUERTA.y + 170, 220, t("in.accion_puerta_piedra"), puertaPiedra, -30);
    for (const rz of RAICES) cerca(rz.x, rz.y + 150, 170, t("bd.accion_raices"), raices, 15);
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

  // ---------- la gente camina (rodea los muebles por sus esquinas) ----------
  function vistaHacia(dx, dy) {
    if (Math.abs(dy) > Math.abs(dx)) return dy > 0 ? "S" : "N";
    return dx > 0 ? "E" : "W";
  }
  function despejado(ax, ay, bx, by, n) {
    const d = Math.hypot(bx - ax, by - ay),
      k = Math.ceil(d / 20);
    for (let i = 1; i <= k; i++) if (!libre(ax + ((bx - ax) * i) / k, ay + ((by - ay) * i) / k, 30, n)) return false;
    return true;
  }
  function rodeo(n, tx, ty) {
    let mejor = null,
      dm = Infinity;
    const esquinas = [];
    for (const q of RECTAS) esquinas.push([q[0] - 60, q[1] - 60], [q[2] + 60, q[1] - 60], [q[0] - 60, q[3] + 60], [q[2] + 60, q[3] + 60]);
    for (const [cx, cy, cr] of CIRCULOS) for (let k = 0; k < 8; k++) esquinas.push([cx + Math.cos((k * TAU) / 8) * (cr + 70), cy + Math.sin((k * TAU) / 8) * (cr + 70)]);
    for (const [cx, cy] of esquinas) {
      if (Math.hypot(cx - n.x, cy - n.y) < 20 || !libre(cx, cy, 30, n) || !despejado(n.x, n.y, cx, cy, n)) continue;
      const d = Math.hypot(cx - n.x, cy - n.y) + Math.hypot(tx - cx, ty - cy) * (despejado(cx, cy, tx, ty, n) ? 1 : 1.6);
      if (d < dm) (dm = d), (mejor = { x: cx, y: cy });
    }
    return mejor;
  }
  function ir(n, e, dt, v = 150) {
    const fin = ESTA[e];
    if (Math.hypot(fin.x - n.x, fin.y - n.y) < 10) {
      n.camina = false;
      n.via = null;
      n.mira = fin.mira;
      return true;
    }
    if (n.via && Math.hypot(n.via.x - n.x, n.via.y - n.y) < 12) n.via = null;
    if (!n.via && !despejado(n.x, n.y, fin.x, fin.y, n)) n.via = rodeo(n, fin.x, fin.y);
    const T = n.via || fin,
      dx = T.x - n.x,
      dy = T.y - n.y,
      d = Math.max(1, Math.hypot(dx, dy));
    let mx = (dx / d) * Math.min(d, v * dt),
      my = (dy / d) * Math.min(d, v * dt);
    if (Math.hypot(ero.x - n.x - (dx / d) * 40, ero.y - n.y - (dy / d) * 40) < 70) return (n.camina = false);
    if (!libre(n.x + mx, n.y + my, 30, n)) {
      if (libre(n.x + mx, n.y, 30, n)) my = 0;
      else if (libre(n.x, n.y + my, 30, n)) mx = 0;
      else {
        n.via = null;
        return (n.camina = false);
      }
    }
    n.x += mx;
    n.y += my;
    n.camina = true;
    n.mira = vistaHacia(mx, my);
    return false;
  }
  function trabajo(dt) {
    const n = gente[0];
    if (!n) {
      arriba -= dt;
      if (arriba <= 0) bajaAlguien(), (arriba = 30 + Math.random() * 20);
      return;
    }
    if (n.charla > 0) return (n.camina = false);
    const ronda = RONDAS[n.id],
      e = ronda[n.ronda];
    if (ir(n, e, dt)) {
      if (!n.llego) {
        n.llego = true;
        if (e === "canilla" && window.SONIDO) SONIDO.tocar("tela", { vol: 0.2, tono: 0.5, x: n.x, y: n.y });
        if (e !== "pie" && Math.random() < 0.6) decir(n, "bd.g_" + n.id + "_" + Math.floor(Math.random() * 4));
      }
      n.espera -= dt;
      if (n.espera <= 0) {
        if (e === "pie") {
          gente = []; // sube a la barra
          if (window.SONIDO) SONIDO.tocar("crujido", { vol: 0.3, tono: 1.4 });
          return;
        }
        n.ronda++;
        n.llego = false;
        n.espera = ronda[n.ronda] === "mesa" ? 7 + Math.random() * 4 : ronda[n.ronda] === "pie" ? 0.4 : 3 + Math.random() * 2;
      }
    }
  }
  const calidad = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  function ratasPaso(dt) {
    if (fase !== "noche") return (rata.vista = false);
    if (!rata.vista) {
      rata.t -= dt;
      if (rata.t <= 0) {
        const izq = Math.random() < 0.5;
        Object.assign(rata, { vista: true, x: izq ? -RX + 80 : RX - 80, y: 200 + Math.random() * 250, vx: izq ? 260 : -260, pausa: 0.8 + Math.random() });
      }
      return;
    }
    const huye = Math.hypot(ero.x - rata.x, ero.y - rata.y) < 260;
    if (rata.pausa > 0 && !huye && Math.abs(rata.x) < 200) rata.pausa -= dt;
    else rata.x += rata.vx * (huye ? 2 : 1) * dt;
    if (Math.abs(rata.x) > RX - 60) (rata.vista = false), (rata.t = 6 + Math.random() * 8);
  }
  function vidaPaso(dt) {
    const f = faseAhora();
    if (f !== fase) (fase = f), (gente = gente.filter((n) => n.id === (fase === "dia" ? "tyra" : "ulf")));
    for (const n of gente) if (n.charla > 0) n.charla -= dt;
    trabajo(dt);
    ratasPaso(dt);
    if (baldeVa) {
      balde = Math.min(1, balde + dt * 1.6);
      if (balde >= 1) baldeVa = 0;
    } else balde = Math.max(0, balde - dt * 0.9);
    if (vistoRaices > 0) vistoRaices -= dt * 0.4;
    const q = calidad();
    // gotas del techo junto al aljibe
    if (q !== "baja" && Math.random() < dt * 0.8) gotas.push({ x: ALJIBE.x + (Math.random() - 0.5) * 300, y: ALJIBE.y + 60 + Math.random() * 200, z: ZT, vida: 0 });
    for (let i = gotas.length - 1; i >= 0; i--) {
      const g = gotas[i];
      g.vida += dt;
      g.z -= dt * 600;
      if (g.z <= 0) gotas.splice(i, 1);
    }
    // la luz rúnica de la puerta y de las raíces
    const late = latido();
    if (q === "alta" && motas.length < 30 && Math.random() < dt * (3 + late * 6)) {
      const rz = Math.random() < 0.5 ? { x: PUERTA.x + (Math.random() - 0.5) * 240, y: PUERTA.y + 40 } : RAICES[Math.floor(Math.random() * 2)];
      motas.push({ u: rz.x + (Math.random() - 0.5) * 200, w: rz.y + 30 + Math.random() * 60, z: 20 + Math.random() * 200, vida: 0, dura: 3 + Math.random() * 3, giro: Math.random() * TAU });
    }
    for (let i = motas.length - 1; i >= 0; i--) {
      const m = motas[i];
      m.vida += dt;
      m.z += dt * 18;
      m.giro += dt * 2;
      if (m.vida > m.dura) motas.splice(i, 1);
    }
    proximoGlobo -= dt;
    if (proximoGlobo <= 0 && J.modo === "juego") {
      proximoGlobo = 6 + Math.random() * 4;
      const n = gente[0];
      if (n && globos.length < 1) decir(n, "bd.g_" + n.id + "_" + Math.floor(Math.random() * 4));
    }
    if (J.modo !== "juego") globos.length = 0;
    for (let i = globos.length - 1; i >= 0; i--) if ((globos[i].t += dt) > 3.4) globos.splice(i, 1);
  }
  // cuánto laten la puerta y las raíces: con trofeos, de noche y cuando Eromash las mira
  function latido() {
    const n = window.GOINN ? GOINN.trofeos() : 0;
    return Math.min(1, n / 12 + (fase !== "dia" ? 0.25 : 0) + Math.max(0, vistoRaices) * 0.5);
  }

  // ---------- la cámara ----------
  function camaraPaso(dt, cw, ch) {
    const libreJ = J.modo === "juego";
    if (libreJ && CONTROLES.pulsado("camaraIzq")) giroObj -= dt * 1.05;
    if (libreJ && CONTROLES.pulsado("camaraDer")) giroObj += dt * 1.05;
    if (libreJ && CONTROLES.pulsado("acercar")) zoom = Math.min(1.1, zoom + dt * 0.3);
    if (libreJ && CONTROLES.pulsado("alejar")) zoom = Math.max(0.36, zoom - dt * 0.3);
    cam.g += corto(giroObj - cam.g) * Math.min(1, dt * 8);
    const escObj = zoom * Math.sqrt((cw * ch) / (1600 * 900)),
      tx = ero.x * 0.6,
      ty = ero.y * 0.6 - 150;
    if (pegar) (pegar = false), (cam.esc = escObj), (cam.x = tx), (cam.y = ty);
    cam.esc += (escObj - cam.esc) * Math.min(1, dt * 6);
    cam.x += (tx - cam.x) * Math.min(1, dt * 5);
    cam.y += (ty - cam.y) * Math.min(1, dt * 5);
  }
  addEventListener("wheel", (ev) => {
    if (!activo || J.modo !== "juego" || (ev.target && ev.target.closest && ev.target.closest(".ui, #capaCaja, #mapaLienzo"))) return;
    zoom = Math.max(0.36, Math.min(1.1, zoom - Math.sign(ev.deltaY) * 0.04));
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
      r = DIB.azar(311);
    c.setTransform(q, 0, 0, q, RX * q, RY * q);
    // tierra apisonada con manchas
    R(c, -RX, -RY, RX * 2, RY * 2, "#3A2E26");
    for (let k = 0; k < 60; k++) alfa(c, 0.35, () => E(c, -RX + r() * RX * 2, -RY + r() * RY * 2, 40 + r() * 90, 20 + r() * 40, r() < 0.5 ? "#2E241E" : "#46382E"));
    // el camino de lajas de la escalera a la puerta de piedra y a la cuba
    const laja = (x, y, s) => {
      const p = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + r() * 0.4;
        p.push(x + Math.cos(a) * s * (0.8 + r() * 0.3), y + Math.sin(a) * s * 0.7 * (0.8 + r() * 0.3));
      }
      P(c, p, ["#4E4852", "#5A5460", "#46404A"][Math.floor(r() * 3)]);
    };
    for (let i = 0; i <= 14; i++) {
      const f = i / 14;
      laja(PIE.x + (PUERTA.x - PIE.x) * f + (r() - 0.5) * 30, PIE.y + 40 + (PUERTA.y + 200 - PIE.y - 40) * f + Math.sin(f * 3) * 40, 46 + r() * 14);
    }
    for (let i = 0; i <= 6; i++) laja(PIE.x - 100 - i * 110, PIE.y + 200 + i * 20 + (r() - 0.5) * 20, 44 + r() * 12);
    // paja suelta y el charco del aljibe
    for (let k = 0; k < 70; k++) {
      const x = -RX + r() * RX * 2,
        y = -RY + r() * RY * 2,
        a = r() * TAU;
      L(c, x, y, x + Math.cos(a) * 18, y + Math.sin(a) * 18, "#8A7A4A", 2);
    }
    alfa(c, 0.5, () => E(c, ALJIBE.x + 140, ALJIBE.y + 140, 150, 60, "#1E242A"));
    alfa(c, 0.3, () => E(c, ALJIBE.x + 110, ALJIBE.y + 130, 80, 24, "#4A78A0"));
    // los aros de humedad bajo la cuba y la mancha de hidromiel bajo la canilla
    alfa(c, 0.4, () => E(c, CANILLA.x, CANILLA.y + 10, 70, 30, "#5A3A18"));
    cv.listo = true;
    return cv;
  }
  // piedra de campo con argamasa; la pared del norte tiene, a la izquierda, el muro viejo de bloques grandes con
  // runas gastadas alrededor de la puerta de piedra
  function pintarPared(c, l, h, lado) {
    const r = DIB.azar(lado.charCodeAt(0) * 53);
    R(c, 0, -h, l, h, "#2A2428");
    for (let y = -h, f = 0; y < 0; y += 44, f++)
      for (let x = -(f % 2) * 30 - r() * 20; x < l; ) {
        const an = 50 + r() * 60;
        R(c, x + 3, y + 3, an - 6, 38, ["#4A4248", "#3E383E", "#544C52", "#463E44"][Math.floor(r() * 4)]);
        x += an;
      }
    if (lado === "n") {
      // el muro viejo: de x = 0 hasta un poco pasada la puerta
      const fin = RX + PUERTA.x + 420;
      R(c, 0, -h, fin, h, "#24222A");
      for (let y = -h, f = 0; y < 0; y += 96, f++)
        for (let x = -(f % 2) * 80; x < fin; x += 160) R(c, x + 5, y + 5, 150, 86, ["#3A3844", "#44424E", "#34323C"][Math.floor(r() * 3)]);
      // las runas gastadas sobre la puerta
      const px = RX + PUERTA.x;
      ["dagaz", "othala", "ingwaz", "algiz", "ehwaz"].forEach((ru, k) => FUTHARK.dibujar(c, ru, px - 200 + k * 100, -h + 70, 40, "#55606A", 4));
      // la juntura entre el muro viejo y la piedra nueva
      R(c, fin - 6, -h, 12, h, "#1A1618");
    }
    // la viga de arriba y las manchas de humedad
    R(c, 0, -h, l, 30, "#2A1810");
    for (let k = 0; k < 4; k++) alfa(c, 0.25, () => E(c, r() * l, -h * (0.3 + r() * 0.5), 60 + r() * 80, 90 + r() * 60, "#1A2A22"));
    if (lado === "o") {
      // un nicho con una lámpara de aceite apagada
      const nx = RY - 100;
      R(c, nx - 50, -260, 100, 90, "#141012");
      R(c, nx - 20, -196, 40, 16, "#6A5A40");
    }
  }
  function lienzoPared(lado, largo) {
    const q = calidad() === "alta" ? 0.4 : 0.25,
      cv = lienzo("pared_" + lado, largo, ZT, q);
    if (cv.listo) return cv;
    const c = cv.getContext("2d");
    c.setTransform(q, 0, 0, q, 0, ZT * q);
    pintarPared(c, largo, ZT, lado);
    cv.listo = true;
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
      cc.strokeStyle = "rgba(0,0,0,0.4)";
      cc.lineWidth = 60;
      cc.strokeRect(-RX, -RY, RX * 2, RY * 2);
    });
  }
  function zocalos(c, lista) {
    const MZ = ["#241E22", "#2E282C", "#3E383C"];
    const base = (lado, k, f) => !paredVista[lado]() && lista.push({ k, f });
    base("s", PR.hondo(0, RY + 40), () => VOL.caja(c, PR, -RX - 40, RY, 0, RX + 40, RY + 40, 80, MZ));
    base("e", PR.hondo(RX + 40, 0), () => VOL.caja(c, PR, RX, -RY - 40, 0, RX + 40, RY + 40, 80, MZ));
    base("n", PR.hondo(0, -RY - 40), () => VOL.caja(c, PR, -RX - 40, -RY - 40, 0, RX + 40, -RY, 80, MZ));
    base("o", PR.hondo(-RX - 40, 0), () => VOL.caja(c, PR, -RX - 40, -RY - 40, 0, -RX, RY + 40, 80, MZ));
  }
  // los dos pilares de madera que sostienen la viga maestra (solo sus pies cuando la pared de adelante no se ve)
  const PILARES = [[-RX + 40, 40], [RX - 40, 40]];

  // ---------- la gente en la vista ----------
  function persona(c, n, sx, sy) {
    const s = GK * cam.esc,
      mv = VOL.relativa(n.mira === "W" ? "E" : n.mira || "S", n.mira === "W");
    GENTE.dibujar(c, n.id, sx, sy, tiempo, { vista: mv.vista, espejo: mv.espejo, camina: !!n.camina, hablando: n.charla > 0 && J.modo === "dialogo", s });
    // Tyra lleva la jarra llena de vuelta
    if (n.id === "tyra" && n.ronda >= 1) {
      R(c, sx + 9 * s, sy - 36 * s, 8 * s, 11 * s, "#9A6040");
      R(c, sx + 9 * s, sy - 36 * s, 8 * s, 2 * s, "#FFD98A");
    }
  }
  function dibujarRata(c) {
    if (!rata.vista) return;
    const [sx, sy] = PR(rata.x, rata.y, 0),
      s = cam.esc * 2,
      d = Math.sign(rata.vx) * (PR.mira(1, 0)[0] >= 0 ? 1 : -1),
      p = Math.sin(tiempo * 30) * 1.5;
    c.save();
    c.translate(sx, sy);
    c.scale(d * s, s);
    E(c, 0, 0, 14, 3, "rgba(0,0,0,0.35)");
    E(c, 0, -6 + p * 0.3, 12, 6, "#3A3438");
    E(c, -4, -7, 7, 4, "#2A2428");
    P(c, [10, -8, 18, -5, 10, -3], "#3A3438");
    E(c, 6, -11, 2.5, 2.5, "#5A5056");
    L(c, -12, -5, -26, -2 + p, "#8A6A6A", 1.4);
    c.restore();
  }

  // ---------- dibujar ----------
  function dibujar(c, cw, ch) {
    const dt = J.modo === "juego" || J.modo === "dialogo" ? dtUlt : 0;
    camaraPaso(dt || 1e-4, cw, ch);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#080606";
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
      const late = latido();
      // la puerta de piedra contra el muro viejo
      pon(PUERTA.x, PUERTA.y, (sx, sy) => ASSETS.dibujar(c, "puertaPiedra", sx, sy, tiempo, { s: 0.85 * s, luces: window.GOINN ? GOINN.trofeos() : 0, abierta: window.GOINN ? GOINN.abierta() : false }));
      for (const rz of RAICES) pon(rz.x, rz.y, (sx, sy) => ASSETS.dibujar(c, "raicesViejas", sx, sy, tiempo, { s, sem: rz.sem, late }));
      pon(ESCALERA.x, ESCALERA.y, (sx, sy) => ASSETS.dibujar(c, "escaleraBodega", sx, sy, tiempo, { s }));
      pon(CUBA.x, CUBA.y, (sx, sy) => ASSETS.dibujar(c, "cubaUlf", sx, sy, tiempo, { s }));
      pon(ESTANTE.x, ESTANTE.y, (sx, sy) => ASSETS.dibujar(c, "estanteToneles", sx, sy, tiempo, { s, sem: 3 }));
      pon(COLGADERO.x, COLGADERO.y, (sx, sy) => ASSETS.dibujar(c, "colgadero", sx, sy, tiempo, { s }));
      pon(ALJIBE.x, ALJIBE.y, (sx, sy) => ASSETS.dibujar(c, "aljibe", sx, sy, tiempo, { s, balde }));
      pon(MESA.x, MESA.y, (sx, sy) => ASSETS.dibujar(c, "mesaCata", sx, sy, tiempo, { s, vela: true }));
      pon(COFRE.x, COFRE.y, (sx, sy) => ASSETS.dibujar(c, "cofreSotano", sx, sy, tiempo, { s, abierto: !!st.cofre }));
      pon(BARRILES.x, BARRILES.y, (sx, sy) => ASSETS.dibujar(c, "barriles", sx, sy, tiempo, { s: 0.9 * s }));
      for (const [px, py] of PILARES)
        lista.push({ k: PR.hondo(px, py), f: () => VOL.caja(c, PR, px - 24, py - 24, 0, px + 24, py + 24, ZT, ["#2A1208", "#3A1A10", "#5A2A16"]) });
      for (const n of gente) if (n.visible) lista.push({ k: PR.hondo(n.x, n.y) + 1e-4, f: () => persona(c, n, ...PR(n.x, n.y, 0)) });
      if (rata.vista) lista.push({ k: PR.hondo(rata.x, rata.y), f: () => dibujarRata(c) });
      pon(ero.x, ero.y, (sx, sy) => {
        const z = jug.salto > 0 ? Math.sin((1 - jug.salto / 0.42) * Math.PI) * 90 : 0;
        A.dibujarJugadorEn(c, sx, sy - z * s, GK * s);
      }, 1);
      lista.sort((a, b) => a.k - b.k);
      lista.forEach((l) => l.f());
      particulas(c);
      luz(c, cw, ch, late);
      dibujarGlobos(c);
    } finally {
      VOL.cam.g = g0;
    }
    const f = Math.max(Math.min(1, fundido), saliendo ? 1 - saliendo / 0.35 : 0);
    if (f > 0) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.fillStyle = "rgba(8,6,6," + f + ")";
      c.fillRect(0, 0, cw, ch);
    }
  }
  function particulas(c) {
    const s = cam.esc;
    for (const g of gotas) {
      const [x, y] = PR(g.x, g.y, g.z);
      alfa(c, 0.5, () => R(c, x - 1 * s, y - 6 * s, 2 * s, 8 * s, "#8AA8C0"));
    }
    // motas rúnicas: rombitos que suben y giran
    for (const m of motas) {
      const [x, y] = PR(m.u, m.w, m.z),
        q = m.vida / m.dura,
        a = Math.sin(q * Math.PI) * 0.8,
        r = (5 - q * 3) * s;
      c.save();
      c.globalAlpha = a;
      c.translate(x, y);
      c.rotate(m.giro);
      P(c, [0, -r, r * 0.6, 0, 0, r, -r * 0.6, 0], "#73D5DB");
      c.restore();
    }
  }
  // la luz: casi oscuro; el farol de la escalera, la vela de la mesa, la luz que baja por la trampilla y el brillo
  // rúnico de la puerta de piedra y de las raíces
  let luzCv = null;
  function luz(c, cw, ch, late) {
    if (calidad() === "baja") {
      c.fillStyle = "rgba(8,5,5,0.45)";
      c.fillRect(0, 0, cw, ch);
      return;
    }
    const s = cam.esc,
      L0 = [],
      lu = (x, y, z, r, col, f) => {
        const [sx, sy] = PR(x, y, z);
        L0.push({ x: sx, y: sy, r: r * s, col, f });
      };
    lu(ESCALERA.x + 12, ESCALERA.y + 100, 214, 900, "255,217,138", 0.85 + Math.sin(tiempo * 5) * 0.04);
    lu(ESCALERA.x - 300, ESCALERA.y + 40, ZT, 520, fase === "dia" ? "255,230,190" : "255,190,120", 0.55);
    lu(MESA.x + 120, MESA.y, 160, 640, "255,217,138", 0.8 + Math.sin(tiempo * 6) * 0.04);
    lu(PUERTA.x, PUERTA.y + 60, 160, 520 + late * 300, "115,213,219", 0.2 + late * 0.45 + 0.06 * Math.sin(tiempo * 1.4));
    for (const rz of RAICES) lu(rz.x, rz.y + 40, 120, 260 + late * 120, "115,213,219", 0.1 + late * 0.25);
    if (!luzCv) luzCv = document.createElement("canvas");
    const w = Math.ceil(cw / 2),
      h = Math.ceil(ch / 2);
    if (luzCv.width !== w || luzCv.height !== h) (luzCv.width = w), (luzCv.height = h);
    const n = luzCv.getContext("2d");
    n.setTransform(0.5, 0, 0, 0.5, 0, 0);
    n.globalCompositeOperation = "source-over";
    n.clearRect(0, 0, cw, ch);
    n.fillStyle = "rgba(6,4,6,0.7)";
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
    // alrededor de Eromash siempre se ve algo
    const [ex, ey] = PR(ero.x, ero.y, 100),
      ge = n.createRadialGradient(ex, ey, 0, ex, ey, 380 * s);
    ge.addColorStop(0, "rgba(0,0,0,0.55)");
    ge.addColorStop(1, "rgba(0,0,0,0)");
    n.fillStyle = ge;
    n.fillRect(ex - 380 * s, ey - 380 * s, 760 * s, 760 * s);
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
    const v = c.createRadialGradient(cw / 2, ch / 2, ch * 0.4, cw / 2, ch / 2, Math.max(cw, ch) * 0.72);
    v.addColorStop(0, "rgba(8,6,6,0)");
    v.addColorStop(1, "rgba(8,6,6,0.6)");
    c.fillStyle = v;
    c.fillRect(0, 0, cw, ch);
  }
  function dibujarGlobos(c) {
    const k = c.canvas.clientWidth ? c.canvas.width / c.canvas.clientWidth : 1;
    for (const g of globos) {
      const n = g.n,
        f = GENTE.FICHAS[n.id] || { alto: 1 },
        [x, y] = PR(n.x, n.y, 94 * f.alto * GK),
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

  // al irse a otro lado sin subir (la puerta de Góinn lleva a su cámara con INTERIORES.salirA)
  const sistemaCasa = { paso, dibujar, cercano, alSalir: apagar };
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      H = A.H;
    },
    alEmpezar(extra) {
      extra.bodega = Object.assign({}, extra.bodega || {});
      st = extra.bodega;
      if (activo) {
        activo = false;
        if (J.dentro === sistemaCasa) J.dentro = null;
      }
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { entrar, girar: (g) => (giroObj = cam.g = g), acercar: (z) => (zoom = z), activo: () => activo, gente: () => gente, bajar: () => bajaAlguien(), cam, ero, cercanoTexto: () => (cercano() || {}).texto };
})();
