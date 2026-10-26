// ---------- Eikholt en el juego (sistema EIKHOLT) ----------
// La capital es un mapa aparte en 2.5D (MUNDO25: el mismo motor y la misma estética que la muestra ciudad.html). Al cruzar
// una puerta de la elipse de la ciudad en el bosque se pone J.dentro y la ciudad se juega en el lienzo de siempre, con el
// HUD, la mochila, el mapa y los diálogos del juego; al salir por un camino de afuera Eromash vuelve al bosque en esa
// puerta. La historia sigue andando por anclas: cada punto o nombrada del bosque que está en la ciudad tiene su lugar en el
// plano (ANCLAS); cerca de uno, Eromash se asoma a ese punto del bosque y el motor responde (A.cercano, A.usarLente), así
// Svanhild, Ása, el Ting o la bodega del Hongo Dorado (con la puerta de Góinn) funcionan como en el bosque. Los vecinos con
// nombre son los de CAPITAL (se habla con ellos como en el bosque) y los demás contestan según su rol (ek.dice_<rol>_N).
// Lo encontrado (curiosidades y cofres) y dónde quedó Eromash se guardan en E.extra.eikholt. ?eikholt=1 arranca en la
// Puerta del Sur (pruebas).
window.EIKHOLT = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const TAU = Math.PI * 2;
  const corto = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  let A, J, jug, W, H;
  let st = null; // E.extra.eikholt
  let listo = false,
    activo = false,
    plano = null,
    M = 60;
  const cam = { x: 0, y: 0, g: -0.49, k: 0.55, esc: 0.45 };
  let zoom = 0.65,
    giroObj = -0.49;
  const ero = () => RECORRER25.ero;
  let tiempo = 0,
    guardar = 0,
    salida = 0,
    dtUlt = 1 / 60,
    modoAntes = "juego",
    jugUlt = null,
    volver = false; // salió a un cuarto del bosque (una casa, la bodega): al volver entra donde estaba

  // ---------- el plano y el bosque ----------
  // el círculo de la muralla (150 m) es la elipse de la ciudad en el mapa de Eldervald
  const aBosque = (x, y) => [W.CIUDAD.c[0] + (x / plano.R_MURO) * W.CIUDAD.rx, W.CIUDAD.c[1] + (y / plano.R_MURO) * W.CIUDAD.ry];
  const aCiudad = (fx, fy) => [((fx - W.CIUDAD.c[0]) / W.CIUDAD.rx) * plano.R_MURO, ((fy - W.CIUDAD.c[1]) / W.CIUDAD.ry) * plano.R_MURO];
  const dentroElipse = (x, y, f = 1) => ((x - W.CIUDAD.c[0]) / W.CIUDAD.rx) ** 2 + ((y - W.CIUDAD.c[1]) / W.CIUDAD.ry) ** 2 < f * f;

  // los puntos del bosque que tienen su lugar en la ciudad (en unidades del plano; se corren al punto libre más cercano)
  function anclasBosque() {
    const AN = plano.anclas,
      L = plano.lugares,
      m = (x, y) => [x * M, y * M],
      mas = (p, dx, dy) => p && [p[0] + dx * M, p[1] + dy * M];
    const R = plano.R_MURO / M;
    const a = {
      eikholt: m(0, 122), eydis_eikholt: m(-3.5, 127), orm_eikholt: m(3.5, 129), trab_eikholt: m(9, 124), plaza: m(0, 56),
      mirador: m(-12, 16), roble: m(10, 16), ting: AN.ting, pozo: mas(L.pozo, 0, 2.5), campana: mas(L.campana, 0, 2.5),
      tablon_avisos: mas(L.tablon, 0, 2.5), camas_hongos: mas(L.camas_hongos, 0, 3),
      losa: AN.losa, mesa: mas(AN.svanhild_casa, 0, 4), svanhild_casa: AN.svanhild_casa, svanhild_patio: mas(AN.losa, 2, 3), herreria_puerta: AN.herreria,
      puerta_sur: AN.puerta_sur, puerta_norte: AN.puerta_norte, gran_tablero: m(14, 139), casa_guardia: m(-12, 139),
      herreria: AN.herreria, carpinteria: AN.carpinteria, cordeleria: AN.cordeleria, curtiembre: AN.curtiembre, sanacion: AN.sanacion,
      hongo_dorado: AN.hongo_puerta, guardia: AN.guardia, carreta_grim: mas(AN.corral, 0, 4), buey: mas(AN.corral, 3, 6),
    };
    // las doce piedras de la cúpula, afuera de la muralla: se tocan desde el lado de afuera
    for (let i = 0; i < 12; i++) {
      const g = (i / 12) * TAU + 0.13;
      a["ancla" + i] = m(Math.cos(g) * (R + 9), Math.sin(g) * (R + 9));
    }
    for (const k in a) if (a[k]) a[k] = MUNDO25.buscarLibre(a[k][0], a[k][1]);
    return a;
  }
  let ANCLAS = {},
    sondas = []; // { k, x, y, fx, fy }
  function armarSondas() {
    sondas = [];
    for (const k in ANCLAS) {
      const p = ANCLAS[k];
      const nb = W.NOMBRADAS[k] && !Array.isArray(W.NOMBRADAS[k]) ? [W.NOMBRADAS[k].x, W.NOMBRADAS[k].y] : W.PUNTOS[k];
      if (!p || !nb) continue;
      sondas.push({ k, x: p[0], y: p[1], fx: nb[0], fy: nb[1] });
    }
  }
  // dónde va en la ciudad algo que en el bosque está en (fx, fy): junto al ancla más cercana
  function lugarDe(fx, fy) {
    let m = null,
      dm = Infinity;
    for (const s of sondas) {
      const d = Math.hypot(s.fx - fx, s.fy - fy);
      if (d < dm) {
        dm = d;
        m = s;
      }
    }
    if (!m || dm > 900) return aCiudad(fx, fy);
    let ox = ((fx - m.fx) / 40) * M,
      oy = ((fy - m.fy) / 40) * M;
    const l = Math.hypot(ox, oy);
    if (l > 5 * M) {
      ox *= (5 * M) / l;
      oy *= (5 * M) / l;
    }
    return [m.x + ox, m.y + oy];
  }
  // asomarse a un punto del bosque: el motor ve a Eromash ahí mientras dura fn
  function asomado(fx, fy, fn) {
    const px = jug.x,
      py = jug.y;
    jug.x = fx;
    jug.y = fy;
    try {
      return fn();
    } finally {
      jug.x = px;
      jug.y = py;
    }
  }
  // lo que el motor ofrece cerca del ancla (o de la persona de la historia) más próxima
  let nativos = new Set();
  function sondear() {
    const e = ero();
    let m = null,
      dm = 3.2 * M;
    for (const s of sondas) {
      const d = Math.hypot(s.x - e.x, s.y - e.y);
      if (d < dm) {
        dm = d;
        m = s;
      }
    }
    for (const n of historia) {
      const d = Math.hypot(n.x - e.x, n.y - e.y);
      if (d < 2.4 * M && d - 0.6 * M < dm) {
        dm = d - 0.6 * M;
        m = { fx: n.fx, fy: n.fy + 40, x: n.x, y: n.y };
      }
    }
    if (!m) return null;
    const fx = m.fx + ((e.x - m.x) / M) * 12,
      fy = m.fy + ((e.y - m.y) / M) * 12 + (m.k ? 30 : 0);
    const r = asomado(fx, fy, () => A.cercano());
    if (!r || nativos.has(r.texto)) return null;
    return { texto: r.texto, d: dm, fn: () => asomado(fx, fy, r.fn) };
  }
  function sondaCercana(dmax) {
    const e = ero();
    let m = null,
      dm = dmax;
    for (const s of sondas) {
      const d = Math.hypot(s.x - e.x, s.y - e.y);
      if (d < dm) {
        dm = d;
        m = s;
      }
    }
    return m;
  }

  // ---------- la gente ----------
  // los vecinos con nombre son los de CAPITAL: se esconden si la historia los mandó afuera de la ciudad
  const deCapital = (id) => window.CAPITAL && CAPITAL.gente.find((n) => n.id === id);
  function oculto(p) {
    if (!p.nombrado) return false;
    const n = deCapital(p.id);
    return !n || n.fuera || !dentroElipse(n.x, n.y, 1.1);
  }
  // los de la historia que hoy están en la ciudad (Eydis, Orm, Svanhild, la cuadrilla)
  const historia = [];
  function ubicarHistoria() {
    const vivos = [];
    const poner = (id, n, clave) => {
      if (!dentroElipse(n.x, n.y, 1.08)) return;
      let g = historia.find((h) => h.clave === clave);
      if (!g) {
        g = { id, clave, x: 0, y: 0, fx: null, fy: null, historia: true };
        historia.push(g);
      }
      g.camina = !!n.camina;
      g.hablando = !!n.hablando;
      if (g.fx !== n.x || g.fy !== n.y) {
        g.fx = n.x;
        g.fy = n.y;
        const [x, y] = lugarDe(n.x, n.y),
          p = MUNDO25.libre(x, y, 30) ? [x, y] : MUNDO25.buscarLibre(x, y);
        g.x = p[0];
        g.y = p[1];
      }
      vivos.push(g);
    };
    for (const id in A.npcs) poner(id, A.npcs[id], "n_" + id);
    if (A.trabajadores) A.trabajadores().forEach((tr) => poner(tr.id, tr, "t_" + tr.id));
    for (let i = historia.length - 1; i >= 0; i--) if (!vivos.includes(historia[i])) historia.splice(i, 1);
  }
  // los de la historia miran a Eromash si está cerca
  function mirarHistoria() {
    const e = ero();
    for (const g of historia) g.miraA = Math.hypot(e.x - g.x, e.y - g.y) < 500 ? [e.x - g.x, e.y - g.y] : null;
  }
  function mirarA(p) {
    const e = ero();
    p.charla = 6;
    p.miraA = [e.x - p.x, e.y - p.y];
    const V = VISTA25.proyector(cam),
      [ax, ay] = V(e.x, e.y),
      [bx, by] = V(p.x, p.y);
    jug.mira = VIKINGO.vista(bx - ax, by - ay, jug.mira);
  }
  const LINEAS_ROL = { vecino: 8, vecina: 8, nino: 5, vendedor: 6, recluta: 4, viajero: 6, pescador: 4, guardia: 5 };
  const charlas = {};
  function hablarVecino(p) {
    mirarA(p);
    const n = LINEAS_ROL[p.rol] || 4;
    const k = (p.id + p.x).length;
    charlas[p.id] = charlas[p.id] == null ? k : charlas[p.id] + 1;
    A.dialogoLibre([["ek_" + p.rol, "ek.dice_" + p.rol + "_" + (charlas[p.id] % n)]]);
  }
  function hablarNombrado(p) {
    mirarA(p);
    const n = deCapital(p.id);
    const r = n && asomado(n.x, n.y, () => A.cercano());
    if (r) asomado(n.x, n.y, r.fn);
  }

  // ---------- lo que se puede hacer cerca ----------
  function cercano() {
    if (J.modo !== "juego" || !activo) return null;
    const e = ero();
    let mejor = null,
      dm = Infinity;
    for (const p of MUNDO25.gente()) {
      if (p.visible === false || (!p.rol && !p.nombrado)) continue;
      const d = Math.hypot(p.x - e.x, p.y - e.y);
      if (d > 2.2 * M || d >= dm) continue;
      dm = d;
      if (p.nombrado) mejor = { texto: t("av.accion_hablar") + " · " + t("av.nombre_" + p.id), fn: () => hablarNombrado(p) };
      else mejor = { texto: t("av.accion_hablar") + " · " + t("av.nombre_ek_" + p.rol), fn: () => hablarVecino(p) };
    }
    const dn = dianaCerca();
    if (dn && dn.d < dm) {
      dm = dn.d;
      mejor = dn;
    }
    const am = RECORRER25.aMano();
    if (am && am.d < dm + 0.5 * M) {
      dm = am.d;
      mejor = am;
    }
    const s0 = sondear();
    if (s0 && s0.d < dm + 0.3 * M) mejor = s0;
    return mejor;
  }

  // ---------- la diana del campo de la Guardia: hachas al blanco (MINIJ «hachas») ----------
  // cada partida pasa a la variante siguiente; superar el récord paga; ganar el duelo con Hrafn lo deja de rival
  function dianaCerca() {
    if (!window.MINIJ || !MINIJ.JUEGOS.hachas || !plano) return null;
    const e = ero();
    let d = Infinity;
    for (const q of plano.cosas) if (q.id === "dianaTiro") d = Math.min(d, Math.hypot(q.x - e.x, q.y - e.y));
    if (d > 7 * M) return null;
    return { texto: t("ek.hachas_accion"), d: Math.max(0, d - 3 * M), fn: () => lanzarHachas() };
  }
  function lanzarHachas() {
    const h = (st.hachas = st.hachas || { veces: 0, record: 0 });
    const VAR = ["base", "viento", "movil", "lejos", "duelo"];
    MINIJ.empezar("hachas", {
      variante: VAR[h.veces % VAR.length],
      quien: t("ek.hachas_quien"),
      fin: (r) => {
        if (r.dejo) return;
        h.veces++;
        if (r.puntos > h.record) {
          const plata = 10 + Math.max(0, r.puntos - Math.max(20, h.record));
          h.record = r.puntos;
          if (window.PODERES && PODERES.darPlata) PODERES.darPlata(plata);
          HUD.aviso(t("ek.hachas_record", [r.puntos]), "lugar", t("ek.hachas_record_sub", [plata]));
        } else HUD.aviso(t(r.gano ? "ek.hachas_bien" : "ek.hachas_mal"), r.gano ? "#FFD98A" : "#E0B2B2");
        if (r.gano && window.RPG) RPG.dar(60, jug.x, jug.y);
      },
    });
  }

  // ---------- Eromash camina ----------
  const VEL = [0, 150, 260, 430],
    VEL_ESQ = 720;
  function moverA(nx, ny) {
    const e = ero(),
      R = plano.R_FUERA;
    const dentro = (x, y) => Math.hypot(x, y) < R;
    if (MUNDO25.libre(nx, ny) && dentro(nx, ny)) {
      e.x = nx;
      e.y = ny;
    } else if (MUNDO25.libre(nx, e.y) && dentro(nx, e.y)) e.x = nx;
    else if (MUNDO25.libre(e.x, ny) && dentro(e.x, ny)) e.y = ny;
  }
  // si algo de la historia mandó a Eromash a otro lado (un cuarto, un viaje, otra zona), la ciudad se suspende
  function vigilar() {
    if (!activo) return true;
    if (J.dentro !== sistemaCiudad) {
      activo = false;
      volver = true;
      return true;
    }
    if (jugUlt && Math.hypot(jug.x - jugUlt[0], jug.y - jugUlt[1]) > 60) {
      if (!dentroElipse(jug.x, jug.y, 1)) {
        activo = false;
        J.dentro = null;
        st.dentro = false;
        salida = 2;
        return true;
      }
      const [x, y] = lugarDe(jug.x, jug.y),
        p = MUNDO25.buscarLibre(x, y);
      ero().x = p[0];
      ero().y = p[1];
      jugUlt = [jug.x, jug.y];
    }
    return false;
  }
  function jugadorPaso(dt) {
    jug.inv = Math.max(0, (jug.inv || 0) - dt);
    if (jug.salto > 0) jug.salto = Math.max(0, jug.salto - dt);
    if (!jug.muerto) jug.hp = Math.min(jug.hpMax, jug.hp + 4 * dt);
    const libre = J.modo === "juego";
    const e = libre ? CONTROLES.eje() : { x: 0, y: 0 },
      mov = Math.hypot(e.x, e.y) > 0.15,
      mag = Math.min(1, Math.hypot(e.x, e.y));
    jug.staEspera = Math.max(0, (jug.staEspera || 0) - dt);
    if (CONTROLES.mando() && libre && CONTROLES.recien("correr")) jug.sprintFijo = !jug.sprintFijo;
    if (!mov || jug.cansado || !CONTROLES.mando()) jug.sprintFijo = false;
    jug.correr = libre && mov && (CONTROLES.pulsado("correr") || jug.sprintFijo) && !jug.cansado;
    if (jug.correr) {
      jug.sta -= 20 * dt;
      jug.staEspera = 0.6;
    } else if ((jug.esq || 0) <= 0 && jug.staEspera <= 0) jug.sta += (mov ? 20 : 30) * dt;
    if (jug.sta <= 0) {
      jug.sta = 0;
      jug.cansado = true;
      jug.correr = false;
    }
    if (jug.cansado && jug.sta > jug.staMax * 0.35) jug.cansado = false;
    jug.sta = Math.min(jug.staMax, jug.sta);
    jug.paso = !mov ? 0 : jug.correr ? 3 : jug.cansado || mag < 0.6 ? 1 : 2;
    jug.atk = null;
    // las flechas van relativas a la cámara: arriba es hacia el fondo de la pantalla, gire como gire
    const co = Math.cos(cam.g),
      si = Math.sin(cam.g),
      er = ero();
    if (jug.esq > 0) {
      jug.esq -= dt;
      moverA(er.x + jug.esqMundo[0] * VEL_ESQ * dt, er.y + jug.esqMundo[1] * VEL_ESQ * dt);
    } else if (libre) {
      if (mov) {
        const l = Math.hypot(e.x, e.y),
          dx = (e.x * co + e.y * si) / l,
          dy = (-e.x * si + e.y * co) / l;
        jug.dirMundo = [dx, dy];
        jug.dir = [e.x / l, e.y / l];
        jug.mira = VIKINGO.vista(e.x, e.y, jug.mira);
        moverA(er.x + dx * VEL[jug.paso] * dt, er.y + dy * VEL[jug.paso] * dt);
      }
      if (CONTROLES.recien("esquivar") && jug.sta >= 20 && jug.salto <= 0) {
        jug.sta -= 20;
        jug.staEspera = 0.6;
        jug.esq = 0.3;
        jug.esqMundo = (jug.dirMundo || [0, 1]).slice();
      }
      if (CONTROLES.recien("saltar") && jug.salto <= 0) jug.salto = 0.42;
    }
    jug.anda = mov ? (jug.correr ? 2 : 1) : 0;
    er.anda = jug.anda;
    // el motor ve a Eromash en el lugar del bosque que corresponde (mapa, misiones, guardado)
    const [fx, fy] = aBosque(er.x, er.y);
    jug.x = fx;
    jug.y = fy;
    jugUlt = [fx, fy];
    // salir de la ciudad por un camino de afuera (del lado del río el muelle y el puente quedan más lejos)
    const lejosSalida = Math.abs(Math.atan2(er.y, er.x)) < 0.75 ? plano.R_FUERA - 12 * M : plano.R_MURO + 18 * M;
    if (Math.hypot(er.x, er.y) > lejosSalida && libre) return salir();
    if (!libre || modoAntes !== "juego") return;
    if (CONTROLES.recien("interactuar") && !tarjetaAntes) {
      const c0 = cercano();
      if (c0) c0.fn();
      if (J.dentro !== sistemaCiudad) return;
    }
    if (CONTROLES.recien("lente") && A.usarLente) {
      const s0 = sondaCercana(6 * M);
      if (s0) asomado(s0.fx + ((er.x - s0.x) / M) * 12, s0.fy + ((er.y - s0.y) / M) * 12, A.usarLente);
      else A.usarLente();
    }
    if (CONTROLES.recien("inventario") && window.INVENTARIO) INVENTARIO.abrir("equipo");
    if (CONTROLES.recien("mapa") && window.MAPA) MAPA.abrir();
  }

  // ---------- la cámara: sigue a Eromash, Z / X giran, acercar y alejar (o la rueda) ----------
  function camaraPaso(dt, cw, ch) {
    const libre = J.modo === "juego";
    if (libre && CONTROLES.pulsado("camaraIzq")) giroObj -= dt * 1.05;
    if (libre && CONTROLES.pulsado("camaraDer")) giroObj += dt * 1.05;
    if (libre && CONTROLES.pulsado("acercar")) zoom = Math.min(1.2, zoom + dt * 0.3);
    if (libre && CONTROLES.pulsado("alejar")) zoom = Math.max(0.22, zoom - dt * 0.3);
    const dg = corto(giroObj - cam.g);
    cam.g += dg * Math.min(1, dt * 8);
    const escObj = zoom * Math.sqrt((cw * ch) / (1600 * 900));
    cam.esc += (escObj - cam.esc) * Math.min(1, dt * 6);
    const e = ero();
    cam.x += (e.x - cam.x) * Math.min(1, dt * 6);
    cam.y += (e.y - cam.y) * Math.min(1, dt * 6);
  }
  addEventListener("wheel", (ev) => {
    if (!activo || J.modo !== "juego" || (ev.target && ev.target.closest && ev.target.closest(".ui, #capaCaja, #mapaLienzo"))) return;
    zoom = Math.max(0.22, Math.min(1.2, zoom - Math.sign(ev.deltaY) * 0.04));
  }, { passive: true });

  // ---------- armar la ciudad (la primera vez que se entra) ----------
  function armar() {
    MUNDO25.armar({
      juego: true,
      // Eromash es el del juego (con su equipo y su animación)
      dibujarEro: (c, x, y) => A.dibujarJugadorEn(c, x, y, 1),
      // los cofres escondidos dan algo de plata además de lo que cuentan
      alCofre: () => window.PODERES && PODERES.darPlata(20),
    });
    plano = MUNDO25.plano();
    M = plano.M;
    ANCLAS = anclasBosque();
    armarSondas();
    nativos = new Set();
    for (const p of MUNDO25.gente()) if (p.nombrado) nativos.add(t("av.accion_hablar") + " · " + t("av.nombre_" + p.id));
    listo = true;
  }

  // ---------- entrar y salir ----------
  function entrar(desde) {
    if (activo) return;
    J.modo = "cine";
    HUD.fundido(true);
    if (!listo) HUD.aviso(t("ek.llegando"), "#FFD98A");
    setTimeout(() => {
      try {
        if (!listo) armar();
      } catch (e) {
        console.error(e);
        HUD.fundido(false);
        J.modo = "juego";
        return;
      }
      RECORRER25.cargar(st.hallado);
      let p;
      if (desde && desde.guardado) p = [st.x, st.y];
      else if (desde && desde.puerta && plano.anclas["puerta_" + desde.puerta]) {
        // del lado de adentro de la puerta, un poco más adentro que el portón
        const q = plano.anclas["puerta_" + desde.puerta],
          l = Math.hypot(q[0], q[1]);
        p = [q[0] - (q[0] / l) * 3 * M, q[1] - (q[1] / l) * 3 * M];
      } else p = lugarDe(jug.x, jug.y);
      if (!MUNDO25.libre(p[0], p[1], 30)) p = MUNDO25.buscarLibre(p[0], p[1]);
      const e = ero();
      e.x = cam.x = p[0];
      e.y = cam.y = p[1];
      e.huellas.length = 0;
      if (st.g != null) giroObj = cam.g = st.g;
      if (st.zoom != null) zoom = st.zoom;
      cam.esc = zoom * Math.sqrt((innerWidth * innerHeight) / (1600 * 900));
      activo = true;
      volver = false;
      J.dentro = sistemaCiudad;
      jug.atk = null;
      jug.anda = 0;
      jug.z = 0;
      st.dentro = true;
      const [fx, fy] = aBosque(e.x, e.y);
      jug.x = fx;
      jug.y = fy;
      jugUlt = [fx, fy];
      // el cartel dorado (CARTEL): «Capital descubierta» con el estandarte la primera vez, el chico al volver
      if (window.CARTEL) CARTEL.entra("eikholt");
      else if (H.descubrir) H.descubrir("eikholt");
      ubicarHistoria();
      if (!window.CARTEL && (!desde || !desde.rapido)) HUD.aviso(t("ek.nombre"), "#FFD98A");
      setTimeout(() => {
        HUD.fundido(false);
        J.modo = "juego";
        CONTROLES.soltar();
      }, 150);
    }, desde && desde.rapido ? 60 : listo ? 650 : 700);
  }
  function salir() {
    if (!activo || J.modo !== "juego") return;
    J.modo = "cine";
    HUD.fundido(true);
    RECORRER25.cerrar();
    // la puerta más cercana a por donde se fue
    const e = ero(),
      a = Math.atan2(e.y, e.x);
    let mejor = null,
      dm = Infinity;
    for (const k in plano.puertas) {
      const d = Math.abs(corto(plano.puertas[k] - a));
      if (d < dm) {
        dm = d;
        mejor = plano.puertas[k];
      }
    }
    setTimeout(() => {
      activo = false;
      if (window.CARTEL) CARTEL.sale("eikholt");
      st.dentro = false;
      J.dentro = null;
      const C = W.CIUDAD;
      let x = C.c[0] + Math.cos(mejor) * (C.rx + 320),
        y = C.c[1] + Math.sin(mejor) * (C.ry + 320);
      for (let r = 0; r < 600 && !W.libre(x, y, 18); r += 20) {
        x += Math.cos(mejor) * 20;
        y += Math.sin(mejor) * 20;
      }
      jug.x = x;
      jug.y = y;
      jug.z = 0;
      jug.mira = { vista: Math.abs(Math.sin(mejor)) > 0.5 ? (Math.sin(mejor) > 0 ? "S" : "N") : "E", espejo: Math.cos(mejor) < -0.5 };
      J.cam.x = x;
      J.cam.y = y - 30;
      salida = 2.5; // que no vuelva a entrar enseguida
      setTimeout(() => {
        HUD.fundido(false);
        J.modo = "juego";
        CONTROLES.soltar();
      }, 150);
    }, 650);
  }

  // ---------- el cuadro ----------
  let tarjetaAntes = false;
  const hora = () => LUZ.hora(H.E.tiempo);
  function paso(dt) {
    if (vigilar()) return;
    dt = Math.min(dt, 0.05);
    dtUlt = dt;
    tiempo += dt;
    const h = hora();
    tarjetaAntes = RECORRER25.tarjetaAbierta();
    if (J.modo === "juego" || J.modo === "dialogo") jugadorPaso(dt);
    if (!activo) return;
    RECORRER25.callados = J.modo !== "juego";
    RECORRER25.actualizar(dt, tiempo, h, cam, null);
    for (const p of MUNDO25.gente()) if (p.charla > 0 && (p.charla -= dt) <= 0) p.miraA = null;
    MUNDO25.moverGente(dt, h, oculto);
    mirarHistoria();
    // cada tanto: quién está dónde (la historia avanza) y dónde quedó Eromash
    guardar += dt;
    if (guardar % 1 < dt) {
      ubicarHistoria();
      st.x = ero().x;
      st.y = ero().y;
      st.g = giroObj;
      st.zoom = zoom;
      st.hallado = RECORRER25.estado();
    }
    if (guardar > 30) {
      guardar = 0;
      H.guardar();
    }
    modoAntes = J.modo;
  }
  function dibujar(c, cw, ch) {
    if (!activo) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.fillStyle = "#111111";
      c.fillRect(0, 0, cw, ch);
      return;
    }
    const dt = J.modo === "juego" || J.modo === "dialogo" ? dtUlt : 0;
    camaraPaso(dt || 1e-4, cw, ch);
    MUNDO25.dibujar(c, cam, cw, ch, tiempo, hora(), historia);
    c.setTransform(1, 0, 0, 1, 0, 0);
  }
  const sistemaCiudad = { paso, dibujar, cercano };

  // ---------- el sistema (en el bosque: detecta cuando Eromash llega a la ciudad) ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      H = A.H;
    },
    alEmpezar(extra) {
      extra.eikholt = Object.assign({ dentro: false }, extra.eikholt || {});
      st = extra.eikholt;
      // las partidas de la ciudad 3D guardaban la posición en metros (x, z): no sirven en el plano 2.5D
      if (st.z != null && st.y == null) st.x = null;
      if (activo) {
        activo = false;
        if (J.dentro === sistemaCiudad) J.dentro = null;
      }
      if (listo) RECORRER25.cargar(st.hallado);
      salida = 0;
      volver = false;
      // ?eikholt=1 (pruebas): arranca en la Puerta del Sur, del lado de adentro
      if (/[?&]eikholt=1/.test(location.search) && !st.dentro) {
        jug.x = W.CIUDAD.c[0];
        jug.y = W.CIUDAD.c[1] + W.CIUDAD.ry * 0.97;
      }
    },
    actualizar(dt) {
      if (salida > 0) salida -= dt;
      // se fue a un cuarto del bosque (la ciudad no se enteró porque su paso no corre ahí) y ya volvió
      if (activo && J.dentro !== sistemaCiudad) {
        activo = false;
        volver = true;
      }
      if (activo || !st || J.modo !== "juego" || salida > 0) return;
      if (!dentroElipse(jug.x, jug.y, 0.985)) {
        volver = false;
        return;
      }
      // volvió de un cuarto del bosque (una casa, la bodega del Hongo): entra junto a esa puerta, sin fundido largo
      if (volver) return entrar({ rapido: true });
      // por cuál puerta llegó
      const C = W.CIUDAD;
      const a = Math.atan2((jug.y - C.c[1]) / C.ry, (jug.x - C.c[0]) / C.rx);
      const PUERTAS = { sur: Math.PI / 2, norte: -Math.PI / 2, este: 0, oeste: Math.PI };
      let puerta = null;
      for (const k in PUERTAS) if (Math.abs(corto(PUERTAS[k] - a)) < 0.12 && !dentroElipse(jug.x, jug.y, 0.9)) puerta = k;
      const guardado = st.dentro && st.x != null && st.y != null && !puerta && plano;
      if (guardado && Math.hypot(aBosque(st.x, st.y)[0] - jug.x, aBosque(st.x, st.y)[1] - jug.y) < 2500) entrar({ guardado: true });
      else entrar({ puerta });
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { activo: () => activo, cam, plano: () => plano, ero, entrar, salir, anclas: () => ANCLAS, lugarDe, aBosque, estado: () => st, jug: () => jug, cercano: () => activo && cercano(), lanzarHachas };
})();
