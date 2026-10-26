// ---------- la Casa de las Lindes por dentro (sistema LINDES) ----------
// El estudio de Svanhild, la que guarda los registros de las lindes de Eldervald, vista de frente como la herrería y la
// Casa de Sanación (todo girable): muros de piedra abajo y tablas arriba, piso de lajas con alfombra, la mesa grande con
// el mapa del bosque, el estante de los rollos, el gran mapa de la pared, el hogar con la cornamenta de Eikholt, la cama
// de alcoba, el atril con el Libro de las Lindes, las cinco piedras de linde de muestra y la mesa de Ketill, el copista.
// De día Svanhild está afuera, en su mesa del patio (la historia la espera ahí); Ketill copia mapas, va al estante y a
// la mesa grande. Al caer la tarde Svanhild entra y repasa los mapas; de noche los dos duermen.
// Con E: hablar (con Svanhild la historia sigue como afuera: el motor la ve en su lugar del bosque), mirar el mapa,
// leer el libro, tocar las piedras de linde (una vez por día destapan en el mapa un lugar que todavía no viste),
// calentarse, mirar cada cosa y bajar al archivo por la trampilla. Z / X giran, la rueda acerca.
window.LINDES = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const { P, E, R, L, alfa } = DIB;
  const TAU = Math.PI * 2;
  const corto = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  let A, J, jug, H, W;
  let st = null; // E.extra.lindes

  // ---------- la casa ----------
  const RX = 900,
    RY = 580,
    ZT = 520,
    GK = 2.75;
  const PUERTA = { x: 520, y: RY };
  const TRAMPILLA = { x: 640, y: -250 };
  const HOGAR = { x: -100, y: -RY + 120 };
  const ESTANTE = { x: 470, y: -RY + 50 };
  const CAMA = { x: -650, y: -300 };
  const MESA = { x: -60, y: 60 };
  const COPISTA = { x: 560, y: 150 };
  const ATRIL = { x: -600, y: 290 };
  const PIEDRAS = { x: -170, y: 420 };
  const JERGON = { x: 780, y: 380 };
  // lo que choca
  const caja = (p, a, b) => [p.x - a, p.y - b, p.x + a, p.y + b];
  const RECTAS = [
    [HOGAR.x - 225, -RY, HOGAR.x + 225, HOGAR.y + 90],
    [ESTANTE.x - 235, -RY, ESTANTE.x + 235, ESTANTE.y + 45],
    [CAMA.x - 210, -RY, CAMA.x + 210, CAMA.y + 195],
    caja(MESA, 245, 140),
    caja(COPISTA, 145, 70),
    caja(ATRIL, 80, 55),
    caja(PIEDRAS, 195, 55),
  ];
  function libre(x, y, r = 40, yo = null) {
    if (x < -RX + 60 || x > RX - 60 || y < -RY + 60 || y > RY - 50) return false;
    for (const q of RECTAS) if (x > q[0] - r && x < q[2] + r && y > q[1] - r && y < q[3] + r) return false;
    for (const n of gente) if (n !== yo && n.visible && !n.duerme && Math.hypot(x - n.x, y - n.y) < 45 + r) return false;
    return true;
  }

  // ---------- la gente ----------
  const ESTA = {
    copista: { x: COPISTA.x, y: COPISTA.y + 120, mira: "N" },
    estante: { x: ESTANTE.x - 60, y: ESTANTE.y + 170, mira: "N" },
    mesa: { x: MESA.x + 300, y: MESA.y - 10, mira: "W" },
    mesaS: { x: MESA.x - 40, y: MESA.y + 200, mira: "N" },
    mesaO: { x: MESA.x - 310, y: MESA.y + 10, mira: "E" },
    atril: { x: ATRIL.x + 10, y: ATRIL.y + 130, mira: "N" },
    hogar: { x: HOGAR.x + 120, y: HOGAR.y + 230, mira: "N" },
    jergon: { x: JERGON.x, y: JERGON.y },
  };
  const RONDA_KETILL = ["copista", "estante", "copista", "mesa", "copista"];
  const RONDA_SVANHILD = ["mesaS", "mesaO", "atril", "hogar", "mesaS"];
  let gente = [];
  let fase = null; // dia | tarde | noche
  function faseAhora() {
    const h = LUZ.hora(H.E.tiempo);
    return h >= 6 && h < 18 ? "dia" : h >= 18 && h < 23 ? "tarde" : "noche";
  }
  function armarGente() {
    fase = faseAhora();
    const p = (id, e, extra) => Object.assign({ id, x: ESTA[e].x, y: ESTA[e].y, mira: ESTA[e].mira || "S", visible: true, charla: 0, camina: false }, extra || {});
    if (fase === "noche") gente = [p("ketill", "jergon", { duerme: true }), { id: "svanhild", x: CAMA.x, y: CAMA.y, enCama: true, duerme: true, visible: true, charla: 0 }];
    else if (fase === "tarde") gente = [p("ketill", "copista", { sentado: 60, ronda: 0, espera: 8 }), p("svanhild", "mesaS", { ronda: 0, espera: 6 })];
    else gente = [p("ketill", "copista", { sentado: 60, ronda: 0, espera: 8 })];
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
  const chispas = []; // del hogar
  const motas = []; // el polvo en la luz de las ventanas
  let hoja = 0, // la hoja del libro que se da vuelta
    libro = 0,
    toca = -1, // la piedra de linde que brilla
    brillo = 0,
    charlas = {};

  // ---------- entrar y salir ----------
  function entrar(p) {
    puerta = p;
    activo = true;
    ero.x = PUERTA.x;
    ero.y = PUERTA.y - 170;
    giroObj = cam.g = 0;
    if (st.zoom != null) zoom = st.zoom;
    pegar = true;
    armarGente();
    globos.length = 0;
    fundido = 1;
    saliendo = 0;
    J.dentro = sistemaCasa;
    jug.atk = null;
    jug.anda = 0;
    jug.mira = { vista: "N", espejo: false };
    if (window.SONIDO) SONIDO.tocar("puerta", { vol: 0.45 });
    HUD.aviso(t("in.nombre_lindes"), "#FFD98A");
  }
  function salir() {
    if (!saliendo) saliendo = 0.35;
  }
  function apagar() {
    if (window.SONIDO) SONIDO.bucle("lindes_fuego", "fogata", 0);
  }
  function terminarSalida() {
    activo = false;
    apagar();
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
    apagar();
    INTERIORES.bajarDesde(puerta, () => {
      activo = true;
      ero.x = TRAMPILLA.x;
      ero.y = TRAMPILLA.y + 130;
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
  // la historia espera a Svanhild en su lugar del bosque (su mesa del patio): el motor ve a Eromash ahí
  function asomado(fn) {
    const pt = W.PUNTOS && W.PUNTOS.svanhild_casa;
    if (!pt) return null;
    const px = jug.x,
      py = jug.y;
    jug.x = pt[0];
    jug.y = pt[1];
    try {
      return fn();
    } finally {
      jug.x = px;
      jug.y = py;
    }
  }
  function historia() {
    if (!A.cercano) return null;
    const r = asomado(() => A.cercano());
    return r && r.texto === t("av.accion_hablar") + " · " + t("av.nombre_svanhild") ? r : null;
  }
  function hablar(n) {
    if (n.duerme) return A.dialogoLibre([["eromash", n.id === "ketill" ? "ln.m_ketill_duerme" : "ln.m_svanhild_duerme"]]);
    n.mira = vistaHacia(ero.x - n.x, ero.y - n.y);
    n.charla = 6;
    if (n.id === "svanhild") {
      const h = historia();
      if (h) return asomado(h.fn);
    }
    const k = (charlas[n.id] = charlas[n.id] == null ? 0 : charlas[n.id] + 1);
    A.dialogoLibre([[n.id, "ln." + n.id + "_" + (k % (n.id === "ketill" ? 5 : 4))]]);
  }
  function leer() {
    hoja = 0.01;
    if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.25, tono: 1.8 });
    A.dialogoLibre([["eromash", "ln.libro_" + (libro++ % 4)]]);
  }
  function calentarse() {
    for (let k = 0; k < 8; k++) chispa(true);
    A.dialogoLibre([["eromash", "ln.m_hogar"]]);
  }
  // las piedras de linde: una vez por día, la que zumba destapa en el mapa un lugar todavía no visto
  const dia = () => Math.floor(LUZ.dia ? LUZ.dia(H.E.tiempo) : H.E.tiempo / 1440);
  function piedras() {
    const k = dia() % 5;
    toca = k;
    brillo = 1;
    if (window.SONIDO) SONIDO.runa ? SONIDO.runa() : SONIDO.tocar("tela", { vol: 0.3, tono: 2 });
    if (st.piedra === dia()) return A.dialogoLibre([["eromash", "ln.m_piedras"]]);
    st.piedra = dia();
    const vistos = new Set(H.E.vistos || []),
      faltan = Object.keys(W.LUGARES).filter((id) => !vistos.has(id) && W.LUGARES[id].p).sort();
    if (!faltan.length || !window.MAPA || !MAPA.descubrir) return A.dialogoLibre([["eromash", "ln.piedra_todo"]]);
    const id = faltan[(dia() * 7 + k) % faltan.length],
      Lg = W.LUGARES[id];
    MAPA.descubrir(Lg.p[0], Lg.p[1], Math.max(1600, (Lg.r || 0) * 2));
    HUD.aviso(t("ln.piedra_ok"), "#73D5DB");
    A.dialogoLibre([["eromash", "ln.piedra_" + k]]);
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
      const nx = n.enCama ? CAMA.x + 40 : n.x,
        ny = n.enCama ? CAMA.y + 280 : n.y,
        d = dist(nx, ny);
      if (d >= 200) continue;
      const nombre = t("av.nombre_" + n.id);
      prueba(d - 70, n.duerme ? t("sn.accion_mirar", [nombre]) : t("av.accion_hablar") + " · " + nombre, () => hablar(n));
    }
    const cerca = (x, y, r, texto, fn, sesgo = 0) => {
      const d = dist(x, y);
      if (d < r) prueba(d + sesgo, texto, fn);
    };
    cerca(PUERTA.x, PUERTA.y - 40, 220, t("in.accion_salir"), salir, -30);
    cerca(MESA.x, MESA.y + 210, 200, t("ln.accion_mesa"), mirar("ln.m_mesa"), 10);
    cerca(MESA.x - 320, MESA.y, 160, t("ln.accion_mesa"), mirar("ln.m_mesa"), 10);
    cerca(ESTANTE.x, ESTANTE.y + 170, 200, t("ln.accion_estante"), mirar("ln.m_estante"), 20);
    cerca(HOGAR.x, HOGAR.y + 220, 190, t("ln.accion_hogar"), calentarse, 20);
    cerca(ATRIL.x, ATRIL.y + 130, 170, t("ln.accion_libro"), leer, 0);
    cerca(PIEDRAS.x, PIEDRAS.y - 110, 210, t("ln.accion_piedras"), piedras, 0);
    cerca(RX - 140, -60, 220, t("ln.accion_mapa"), mirar("ln.m_mapa"), 25);
    if (fase !== "noche") cerca(CAMA.x + 40, CAMA.y + 280, 170, t("ln.accion_cama"), mirar("ln.m_cama"), 30);
    cerca(COPISTA.x, COPISTA.y - 120, 150, t("ln.accion_copia"), mirar("ln.m_copia"), 30);
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
  // ¿se puede ir derecho de a a b? (se mira cada 20 a lo largo)
  function despejado(ax, ay, bx, by, n) {
    const d = Math.hypot(bx - ax, by - ay),
      k = Math.ceil(d / 20);
    for (let i = 1; i <= k; i++) if (!libre(ax + ((bx - ax) * i) / k, ay + ((by - ay) * i) / k, 30, n)) return false;
    return true;
  }
  // rodear un mueble: la esquina libre que deja el camino más corto
  function rodeo(n, tx, ty) {
    let mejor = null,
      dm = Infinity;
    for (const q of RECTAS)
      for (const [cx, cy] of [[q[0] - 60, q[1] - 60], [q[2] + 60, q[1] - 60], [q[0] - 60, q[3] + 60], [q[2] + 60, q[3] + 60]]) {
        if (!libre(cx, cy, 30, n) || !despejado(n.x, n.y, cx, cy, n)) continue;
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
      d = Math.hypot(dx, dy);
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
  const calidad = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  function chispa(fuerte) {
    if (calidad() === "baja" && chispas.length > 4) return;
    chispas.push({ u: HOGAR.x + (Math.random() - 0.5) * 120, w: HOGAR.y + 20, z: 60, vz: (90 + Math.random() * 120) * (fuerte ? 1.6 : 1), vida: 0, dura: 0.8 + Math.random() * 0.8, deriva: (Math.random() - 0.5) * 60, giro: Math.random() * TAU });
  }
  function rondaPaso(n, ronda, dt, alLlegar) {
    if (n.charla > 0) return (n.camina = false);
    const e = ronda[n.ronda % ronda.length];
    if (ir(n, e, dt)) {
      if (!n.llego) (n.llego = true), alLlegar && alLlegar(e);
      n.espera -= dt;
      if (n.espera <= 0) (n.ronda++), (n.llego = false), (n.espera = e === "copista" ? 9 + Math.random() * 5 : 3.5 + Math.random() * 2);
      return e;
    }
    return null;
  }
  function trabajo(dt) {
    if (fase === "noche") return;
    const ke = quien("ketill"),
      sv = quien("svanhild");
    if (ke) {
      const e = rondaPaso(ke, RONDA_KETILL, dt, (e2) => {
        if (e2 === "estante" && Math.random() < 0.6) decir(ke, "ln.g_ketill_" + Math.floor(Math.random() * 3));
      });
      // sentado solo en su banco
      ke.sentado = e === "copista" ? 60 : null;
      ke.escribe = e === "copista";
    }
    if (sv)
      rondaPaso(sv, RONDA_SVANHILD, dt, (e2) => {
        if (e2 === "atril") hoja = 0.01;
        if (Math.random() < 0.5) decir(sv, "ln.g_svanhild_" + Math.floor(Math.random() * 4));
      });
  }
  function vidaPaso(dt) {
    if (faseAhora() !== fase) armarGente();
    for (const n of gente) if (n.charla > 0) n.charla -= dt;
    trabajo(dt);
    if (hoja > 0) hoja = hoja + dt * 1.6 >= 1 ? 0 : hoja + dt * 1.6;
    if (brillo > 0) brillo = Math.max(0, brillo - dt * 0.4);
    const q = calidad();
    if (Math.random() < dt * (q === "alta" ? 3 : q === "media" ? 1.5 : 0.5)) chispa(false);
    for (let i = chispas.length - 1; i >= 0; i--) {
      const v = chispas[i];
      v.vida += dt;
      v.z += v.vz * dt;
      v.u += v.deriva * dt;
      v.giro += dt * 5;
      if (v.vida > v.dura) chispas.splice(i, 1);
    }
    if (q === "alta" && fase === "dia" && motas.length < 24 && Math.random() < dt * 6)
      motas.push({ u: -RX + 100 + Math.random() * 500, w: -200 + Math.random() * 600, z: 60 + Math.random() * 300, vida: 0, dura: 4 + Math.random() * 3, fase: Math.random() * TAU });
    for (let i = motas.length - 1; i >= 0; i--) {
      const m = motas[i];
      m.vida += dt;
      m.z += Math.sin(tiempo + m.fase) * 6 * dt;
      m.u += 8 * dt;
      if (m.vida > m.dura) motas.splice(i, 1);
    }
    proximoGlobo -= dt;
    if (proximoGlobo <= 0 && J.modo === "juego") {
      proximoGlobo = 5 + Math.random() * 4;
      if (globos.length < 2 && fase !== "noche") {
        if (fase === "tarde" && Math.random() < 0.5) decir(quien("svanhild"), "ln.g_svanhild_" + Math.floor(Math.random() * 4));
        else decir(quien("ketill"), "ln.g_ketill_" + Math.floor(Math.random() * 3));
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
    if (window.SONIDO) SONIDO.bucle("lindes_fuego", "fogata", 0.2 * Math.max(0.3, 1 - Math.hypot(ero.x - HOGAR.x, ero.y - HOGAR.y) / 2200));
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
      r = DIB.azar(57);
    c.setTransform(q, 0, 0, q, RX * q, RY * q);
    // lajas de piedra gris azulada, cada una de su tono, con juntas oscuras
    R(c, -RX, -RY, RX * 2, RY * 2, "#2E2A2E");
    for (let y = -RY, f = 0; y < RY; y += 120, f++) {
      let x = -RX - (f % 2) * 90 - r() * 60;
      while (x < RX) {
        const l = 140 + r() * 140;
        R(c, x + 5, y + 5, l - 10, 110, ["#545058", "#5C5862", "#4E4A52", "#625E66"][Math.floor(r() * 4)]);
        if (r() < 0.25) alfa(c, 0.35, () => E(c, x + l * r(), y + 30 + r() * 50, 14 + r() * 20, 6 + r() * 8, "#4E5C32"));
        x += l;
      }
    }
    // la alfombra roja con la greca de las lindes bajo la mesa grande
    const ax = MESA.x,
      ay = MESA.y,
      aw = 640,
      ah = 400;
    R(c, ax - aw / 2, ay - ah / 2, aw, ah, "#5E130D");
    R(c, ax - aw / 2 + 20, ay - ah / 2 + 20, aw - 40, ah - 40, "#9C2315");
    R(c, ax - aw / 2 + 50, ay - ah / 2 + 50, aw - 100, ah - 100, "#7A1E12");
    for (let k = 0; k < 14; k++) {
      const x = ax - aw / 2 + 40 + k * ((aw - 80) / 14);
      P(c, [x, ay - ah / 2 + 35, x + 12, ay - ah / 2 + 25, x + 24, ay - ah / 2 + 35, x + 12, ay - ah / 2 + 45], "#E0B2B2");
      P(c, [x, ay + ah / 2 - 35, x + 12, ay + ah / 2 - 45, x + 24, ay + ah / 2 - 35, x + 12, ay + ah / 2 - 25], "#E0B2B2");
    }
    // una piel junto al hogar
    c.fillStyle = "#8A7258";
    c.beginPath();
    c.ellipse(HOGAR.x, HOGAR.y + 270, 170, 80, 0, 0, TAU);
    c.fill();
    E(c, HOGAR.x, HOGAR.y + 270, 130, 56, "#A08868");
    // hojas sueltas caídas junto al copista y al estante
    for (let k = 0; k < 9; k++) {
      const x = COPISTA.x - 220 + r() * 300,
        y = COPISTA.y - 20 + r() * 220;
      c.save();
      c.translate(x, y);
      c.rotate(r() * 2 - 1);
      R(c, -18, -12, 36, 24, "#D8C49A");
      R(c, -12, -6, 20, 2, "#6A5A40");
      c.restore();
    }
    // el camino gastado de la puerta a la mesa
    alfa(c, 0.15, () => {
      c.fillStyle = "#8A8690";
      c.beginPath();
      c.moveTo(PUERTA.x - 140, RY);
      c.quadraticCurveTo(PUERTA.x - 80, 300, MESA.x + 180, MESA.y + 220);
      c.lineTo(MESA.x + 320, MESA.y + 200);
      c.quadraticCurveTo(PUERTA.x + 40, 320, PUERTA.x + 140, RY);
      c.fill();
    });
    cv.listo = true;
    return cv;
  }
  // muro de piedra hasta 180 y tablas arriba, una viga a lo largo; las ventanas y lo colgado de cada pared
  function pintarPared(c, l, h, lado) {
    const r = DIB.azar(lado.charCodeAt(0) * 31);
    // las tablas de arriba
    R(c, 0, -h, l, h, "#5A3E28");
    for (let x = 0; x < l; x += 64) R(c, x, -h, 60, h - 180, ["#6A4A2E", "#634430", "#704E32", "#5E422A"][Math.floor(r() * 4)]);
    // la piedra de abajo
    R(c, 0, -190, l, 190, "#3E3842");
    for (let y = -190, f = 0; y < 0; y += 48, f++)
      for (let x = -(f % 2) * 50; x < l; x += 100 + Math.floor(r() * 3) * 20) R(c, x + 4, y + 4, 92, 40, ["#5E5862", "#544E58", "#66606A"][Math.floor(r() * 3)]);
    R(c, 0, -200, l, 14, "#2A1810");
    R(c, 0, -h, l, 34, "#2A1810");
    const V = "#3A1A10";
    const ventana = (x, z0, z1, an) => {
      R(c, x - an / 2 - 18, -z1 - 14, an + 36, z1 - z0 + 30, V);
      R(c, x - an / 2, -z1, an, z1 - z0, noche() ? "#141C30" : "#A8C4D0");
      if (noche()) for (let k = 0; k < 3; k++) R(c, x - an / 2 + r() * an, -z1 + r() * (z1 - z0) * 0.5, 3, 3, "#F2ECEC");
      else alfa(c, 0.45, () => R(c, x - an / 2, -z1, an * 0.35, z1 - z0, "#E0ECF0"));
      R(c, x - 3, -z1, 6, z1 - z0, V);
      R(c, x - an / 2, -(z0 + z1) / 2 - 3, an, 6, V);
      R(c, x - an / 2 - 24, -z0 + 4, an + 48, 12, "#7A5634");
    };
    if (lado === "n") {
      // ventanas a los costados del hogar; entre la cama y el hogar, un escudo con la cornamenta
      ventana(RX - 430, 250, 420, 130);
      ventana(RX + 230, 250, 420, 130);
      const ex = RX - 420 + 220,
        ez = -330;
      E(c, ex + 230, ez, 54, 54, "#2A1810");
      E(c, ex + 230, ez, 46, 46, "#3E5A34");
      DIB.insignia(c, (u, v) => [ex + 230 + u * 70, ez - 36 + v * 70], "#F2ECEC");
    } else if (lado === "e") {
      // el gran mapa de Eldervald, en su marco
      const mx = RY - 60,
        mw = 760,
        mz0 = 140,
        mz1 = 470;
      R(c, mx - mw / 2 - 24, -mz1 - 24, mw + 48, mz1 - mz0 + 48, "#2A1810");
      R(c, mx - mw / 2 - 12, -mz1 - 12, mw + 24, mz1 - mz0 + 24, "#7A5634");
      c.save();
      c.translate(mx - mw / 2, -mz0);
      if (window.LINDES_MAPA) LINDES_MAPA(c, mw, mz1 - mz0, 3, [[0.04, 0.3], [0.04, 0.7], [0.96, 0.4], [0.5, 0.04], [0.8, 0.96], [0.3, 0.96]]);
      c.restore();
      // las cintas rojas que salen de los alfileres
      for (let k = 0; k < 4; k++) L(c, mx - mw / 2 + 60 + k * 180, -mz1 + 40, mx - mw / 2 + 80 + k * 180, -mz0 + 20, "#C8402D", 2);
    } else if (lado === "s") {
      const px = RX + PUERTA.x;
      R(c, px - 170, -380, 340, 380, V);
      R(c, px - 150, -360, 300, 360, noche() ? "#0E1420" : "#C8D8C0");
      if (!noche()) R(c, px - 150, -120, 300, 120, "#6A7A4A");
      ventana(RX - 300, 230, 400, 160);
    } else {
      // oeste: un estandarte verde con la cornamenta y una ventana chica
      const tx = RY + 220;
      R(c, tx - 100, -470, 200, 14, "#2A1810");
      P(c, [tx - 90, -460, tx + 90, -460, tx + 90, -230, tx, -270, tx - 90, -230], "#2C4226");
      P(c, [tx + 50, -460, tx + 90, -460, tx + 90, -230, tx + 66, -250], "#3E5A34");
      DIB.insignia(c, (u, v) => [tx + u * 120, -440 + v * 140], "#F2ECEC");
      ventana(RY - 300, 250, 400, 120);
    }
  }
  const noche = () => fase === "noche";
  function lienzoPared(lado, largo) {
    const q = calidad() === "alta" ? 0.4 : 0.25,
      cv = lienzo("pared_" + lado, largo, ZT, q);
    if (cv.listo === fase) return cv;
    const c = cv.getContext("2d");
    c.setTransform(q, 0, 0, q, 0, ZT * q);
    c.clearRect(0, -ZT, largo, ZT);
    pintarPared(c, largo, ZT, lado);
    cv.listo = fase;
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
    const MZ = ["#2E2A32", "#3E3842", "#545058"];
    const base = (lado, k, f) => !paredVista[lado]() && lista.push({ k, f });
    base("s", PR.hondo(0, RY + 40), () => {
      VOL.caja(c, PR, -RX - 40, RY, 0, PUERTA.x - 170, RY + 40, 90, MZ);
      VOL.caja(c, PR, PUERTA.x + 170, RY, 0, RX + 40, RY + 40, 90, MZ);
    });
    base("e", PR.hondo(RX + 40, 0), () => VOL.caja(c, PR, RX, -RY - 40, 0, RX + 40, RY + 40, 90, MZ));
    base("n", PR.hondo(0, -RY - 40), () => VOL.caja(c, PR, -RX - 40, -RY - 40, 0, RX + 40, -RY, 90, MZ));
    base("o", PR.hondo(-RX - 40, 0), () => VOL.caja(c, PR, -RX - 40, -RY - 40, 0, -RX, RY + 40, 90, MZ));
  }

  // ---------- la gente en la vista ----------
  function persona(c, n, sx, sy) {
    const s = GK * cam.esc,
      mv = VOL.relativa(n.mira === "W" ? "E" : n.mira || "S", n.mira === "W"),
      f = GENTE.FICHAS[n.id] || { alto: 1, ancho: 1 };
    if (n.enCama) return; // Svanhild duerme: la cama la dibuja ocupada
    if (n.duerme) {
      // Ketill en su jergón: la manta que respira y el pelo
      const pr = VOL.proyector(sx, sy, cam.g, { s: cam.esc }),
        res = Math.sin(tiempo * 1.6) * 4;
      VOL.caja(c, pr, -76, -90, 22, 76, 146, 60 + res, ["#5E130D", "#7A1E12", "#9C2315"]);
      VOL.cilindro(c, pr, 0, -118, 26, 40, 70, ["#C8A888", "#E8C8A8", "#F0D8C0"], { n: 8 });
      VOL.cilindro(c, pr, 0, -124, 28, 60, 80, ["#5A3A22", "#7A5634", "#9A7448"], { n: 8 });
      zetas(c, n.x, n.y - 120);
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
    // Ketill lleva un rollo del estante a la mesa
    if (n.id === "ketill" && n.camina && RONDA_KETILL[n.ronda % RONDA_KETILL.length] !== "estante") {
      R(c, sx + 8 * s, py - 38 * s, 14 * s, 5 * s, "#D8C49A");
      E(c, sx + 8 * s, py - 35.5 * s, 2.5 * s, 2.5 * s, "#8A7050");
    }
  }
  function zetas(c, x0, y0) {
    c.save();
    c.font = `700 ${Math.round(28 * cam.esc * 2)}px "DM Sans", system-ui, sans-serif`;
    c.fillStyle = "#F2ECEC";
    for (let k = 0; k < 3; k++) {
      const fz = (tiempo * 0.5 + k / 3) % 1,
        [x, y] = PR(x0 + fz * 60, y0, 120 + fz * 200);
      c.globalAlpha = Math.sin(fz * Math.PI) * 0.8;
      c.fillText("z", x, y);
    }
    c.restore();
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
      // el marco de la puerta (bajo cuando la pared de adelante está cortada)
      lista.push({ k: PR.hondo(PUERTA.x, RY), f: () => {
        const M = ["#2A1208", "#3A1A10", "#5A2A16"],
          x = PUERTA.x,
          alto = paredVista.s() ? 400 : 110;
        VOL.caja(c, PR, x - 200, RY - 20, 0, x - 160, RY + 30, alto, M);
        VOL.caja(c, PR, x + 160, RY - 20, 0, x + 200, RY + 30, alto, M);
        if (paredVista.s())
          VOL.caja(c, PR, x - 220, RY - 24, 390, x + 220, RY + 34, 440, ["#2A0806", "#5A2A16", "#7A3E20"], {
            frente: (cc, l) => FUTHARK.dibujar(cc, "othala", l / 2, -8, 32, "#FFD98A", 4),
            atras: (cc, l) => FUTHARK.dibujar(cc, "algiz", l / 2, -8, 32, "#FFD98A", 4),
          });
      } });
      // la trampilla del archivo, pintada en el piso
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
      if (noche()) lista.push({ k: PR.hondo(JERGON.x, JERGON.y - 200), f: () => ASSETS.dibujar(c, "jergon", ...PR(JERGON.x, JERGON.y, 0), tiempo, { s, ocupada: true }) });
      pon(HOGAR.x, HOGAR.y, (sx, sy) => ASSETS.dibujar(c, "hogarLindes", sx, sy, tiempo, { s, fuego: noche() ? 0.45 : 0.9, chimenea: ZT }));
      pon(ESTANTE.x, ESTANTE.y, (sx, sy) => ASSETS.dibujar(c, "estanteLindes", sx, sy, tiempo, { s }));
      pon(CAMA.x, CAMA.y, (sx, sy) => ASSETS.dibujar(c, "camaAlcoba", sx, sy, tiempo, { s, ocupada: noche() }));
      pon(MESA.x, MESA.y, (sx, sy) => ASSETS.dibujar(c, "mesaMapas", sx, sy, tiempo, { s, vela: fase !== "dia" }));
      const ke = quien("ketill");
      pon(COPISTA.x, COPISTA.y, (sx, sy) => ASSETS.dibujar(c, "mesaCopista", sx, sy, tiempo, { s, escribe: !!(ke && ke.escribe && !ke.camina), vela: fase !== "dia" }));
      pon(ATRIL.x, ATRIL.y, (sx, sy) => ASSETS.dibujar(c, "atrilLibro", sx, sy, tiempo, { s, hoja }));
      pon(PIEDRAS.x, PIEDRAS.y, (sx, sy) => ASSETS.dibujar(c, "piedrasLinde", sx, sy, tiempo, { s, toca: brillo > 0 ? toca : -1, brillo }));
      for (const n of gente) {
        if (!n.visible || n.enCama) continue;
        // Ketill sentado va justo después de su banco
        const k = n.duerme ? PR.hondo(JERGON.x, JERGON.y - 200) + 0.1 : n.sentado != null ? PR.hondo(COPISTA.x, COPISTA.y + 110) + 1 : PR.hondo(n.x, n.y) + 1e-4;
        lista.push({ k, f: () => persona(c, n, ...PR(n.x, n.y, 0)) });
      }
      // Svanhild dormida: las zetas sobre la alcoba
      if (noche()) lista.push({ k: 1e9, f: () => zetas(c, CAMA.x - 100, CAMA.y) });
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
    // las chispas del hogar: rombos que suben, giran y se achican
    for (const v of chispas) {
      const [x, y] = PR(v.u, v.w, v.z),
        q = v.vida / v.dura,
        a = q < 0.08 ? q / 0.08 : 1 - Math.pow((q - 0.08) / 0.92, 1.6),
        r = (6 - q * 4) * s;
      c.save();
      c.globalAlpha = Math.max(0, a);
      c.translate(x, y);
      c.rotate(v.giro);
      P(c, [0, -r, r * 0.6, 0, 0, r, -r * 0.6, 0], q < 0.5 ? "#FFD98A" : "#FF8D71");
      c.restore();
    }
    for (const m of motas) {
      const [x, y] = PR(m.u, m.w, m.z),
        a = Math.sin((m.vida / m.dura) * Math.PI) * 0.6;
      alfa(c, a, () => R(c, x - 2 * s, y - 2 * s, 4 * s, 4 * s, "#FFD98A"));
    }
  }
  // la luz: penumbra de estudio; el hogar, las velas, las piedras de linde y la luz de las ventanas
  let luzCv = null;
  function luz(c, cw, ch) {
    if (calidad() === "baja") {
      c.fillStyle = noche() ? "rgba(10,5,5,0.5)" : "rgba(10,5,5,0.2)";
      c.fillRect(0, 0, cw, ch);
      return;
    }
    const s = cam.esc,
      L0 = [],
      lu = (x, y, z, r, col, f) => {
        const [sx, sy] = PR(x, y, z);
        L0.push({ x: sx, y: sy, r: r * s, col, f });
      };
    lu(HOGAR.x, HOGAR.y + 60, 100, noche() ? 1100 : 950, "255,141,113", (noche() ? 0.8 : 0.65) + Math.sin(tiempo * 7) * 0.04);
    if (fase !== "dia") {
      lu(MESA.x - 220, MESA.y + 116, 180, 520, "255,217,138", 0.7);
      lu(COPISTA.x - 124, COPISTA.y + 48, 170, 420, "255,217,138", 0.6);
    }
    lu(PIEDRAS.x, PIEDRAS.y, 120, 360 + brillo * 300, "115,213,219", 0.35 + brillo * 0.4 + 0.08 * Math.sin(tiempo * 1.6));
    lu(PUERTA.x, RY - 80, 120, 560, noche() ? "115,140,200" : "220,230,210", noche() ? 0.25 : 0.75);
    if (fase === "dia") {
      lu(-RX + 470, -RY + 120, 300, 800, "220,232,240", 0.8);
      lu(RX - 670, -RY + 120, 300, 700, "220,232,240", 0.7);
      lu(MESA.x, MESA.y, 120, 700, "220,232,240", 0.45);
    }
    if (!luzCv) luzCv = document.createElement("canvas");
    const w = Math.ceil(cw / 2),
      h = Math.ceil(ch / 2);
    if (luzCv.width !== w || luzCv.height !== h) (luzCv.width = w), (luzCv.height = h);
    const n = luzCv.getContext("2d");
    n.setTransform(0.5, 0, 0, 0.5, 0, 0);
    n.globalCompositeOperation = "source-over";
    n.clearRect(0, 0, cw, ch);
    n.fillStyle = noche() ? "rgba(10,5,6,0.74)" : fase === "tarde" ? "rgba(10,5,6,0.55)" : "rgba(10,5,6,0.38)";
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

  const sistemaCasa = { paso, dibujar, cercano };
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      H = A.H;
      W = A.W;
    },
    alEmpezar(extra) {
      extra.lindes = Object.assign({}, extra.lindes || {});
      st = extra.lindes;
      if (activo) {
        activo = false;
        if (J.dentro === sistemaCasa) J.dentro = null;
      }
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { entrar, girar: (g) => (giroObj = cam.g = g), acercar: (z) => (zoom = z), activo: () => activo, gente: () => gente, cam, ero, cercanoTexto: () => (cercano() || {}).texto };
})();
