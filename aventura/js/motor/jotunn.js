// ---------- Hrímnir, el jötunn de la escarcha (sistema JOTUNN) ----------
// Un jefe del mundo como los gigantes del Skyrim y los jefes del WoW: duerme sentado en su asiento de piedra, en el
// norte, dentro de un anillo de menhires con la runa Isa. Al acercarse se levanta, ruge y la vista se abre. Pelea con
// las reglas fijas de la arena: aviso exacto en el piso, saltar evita todo, nada saca más del 35 % de la vida, nunca el
// mismo ataque tres veces seguidas, a lo sumo tres esbirros. Rotación fija por fase (se aprende):
//   fase 1 (100–66 %): barrido, pisotón, línea de hielo
//   fase 2 (66–33 %):  suma el granizo de rocas (tres a cinco círculos donde está Eromash y alrededor)
//   fase 3 (< 33 %):   suma el grito de escarcha (un círculo enorme: salir o saltar)
// Al pasar al 66 % y al 33 % llama hasta tres hrímthursar (draugr de escarcha). Tras el pisotón y el grito queda
// expuesto un momento (se agacha, runas en la cabeza) y recibe × 1,3. Si Eromash se aleja del anillo, vuelve a su
// asiento y se cura. Vencerlo una vez paga plata, mucha experiencia, dos fragmentos y una pieza épica o mejor, y queda
// entre los únicos del bestiario.
// Por qué pelea: Hrímnir no se levanta por un mortal. Hasta que Eromash venza a sus tres hrímthursar guardianes (andan
// por el norte, a unos 80 m del anillo, y el mapa los marca después de la primera visita), acercarse a su asiento le
// cuesta una patada que lo saca volando del anillo (aviso en el piso, saltar la evita, no saca vida). Con los tres
// caídos, el gigante sintió morir a los suyos y lo espera para vengarlos.
// Estado en E.extra.jotunn = { vencido, intentos, guardianes: [0|1 ×3], visto }. Textos `jt.`.
window.JOTUNN = (function () {
  "use strict";
  let A, J, jug, W, CB;
  const t = (k, v) => I18N.t(k, v);
  const M = 30;
  const DESPIERTA = 620,
    ANILLO = 900, // radio del anillo de menhires
    SUELTA = 1900, // más lejos que esto del centro, vuelve a su asiento
    EXPUESTO = 1.4,
    BONO_EXPUESTO = 1.3,
    PATADA = 360, // más cerca que esto del gigante sin el desafío: la patada
    DIST_GUARDIAN = 2400; // a cuánto del anillo andan sus tres guardianes
  COMBATE.TIPOS.jotunn = { vida: 2600, dano: 30, vel: 3 * M, alcance: 4 * M, aviso: 1.2, forma: "circulo", radio: 64, espera: 1.2, barra: 340, plata: 0, pesado: true, dibujo: "jotunnFigura" };
  // los ataques: forma, tiempo de aviso, daño y medidas
  const ATAQUES = {
    barrido: { dur: 1.1, dano: 28, f: (b, dir) => ({ forma: "abanico", x: b.x, y: b.y, radio: 6.2 * M, ang: 1.0, dir }) },
    pisoton: { dur: 1.3, dano: 30, expone: true, f: (b) => ({ forma: "circulo", x: b.x, y: b.y, radio: 4.6 * M }) },
    linea: { dur: 1.2, dano: 26, f: (b, dir) => ({ forma: "franja", x: b.x, y: b.y, largo: 17 * M, ancho: 2.6 * M, dir }) },
    granizo: { dur: 1.45, dano: 22, varios: true },
    grito: { dur: 1.7, dano: 24, expone: true, f: (b) => ({ forma: "circulo", x: b.x, y: b.y, radio: 9.5 * M }) },
  };
  const ROTACION = [
    ["barrido", "pisoton", "linea", "barrido", "linea", "pisoton"],
    ["granizo", "barrido", "linea", "pisoton", "granizo", "barrido"],
    ["grito", "granizo", "barrido", "linea", "granizo", "pisoton"],
  ];
  const RGB = { barrido: [200, 64, 45], pisoton: [200, 64, 45], linea: [140, 210, 240], granizo: [184, 176, 168], grito: [200, 242, 244] };
  const base = () => ({ vencido: false, intentos: 0, guardianes: [0, 0, 0], visto: false });
  const desafiado = () => st.guardianes.every(Boolean);
  let st = base();
  let jefe = null; // { e, centro, asiento, fase, rot, estado, t, avisos[], esb[], ultimos[] }

  // ---------- dónde: un alto del norte, lejos de caminos y de todo ----------
  function buscarLugar() {
    const L = W.LUGARES,
      p0 = W.m(900, 180);
    // nada construido cerca (los árboles y las rocas se apartan)
    const despejado = (x, y) => {
      let si = true;
      W.cercanas(x - ANILLO, y - ANILLO, x + ANILLO, y + ANILLO, (o) => {
        if (o.choque && !o.arbol && o.id !== "roca" && o.id !== "troncoCaido" && !o.oculto) si = false;
      });
      return si;
    };
    for (let r = 0; r < 12000; r += 300)
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2,
          x = p0[0] + Math.cos(a) * r,
          y = p0[1] + Math.sin(a) * r * 0.6;
        if (y < W.BORDE * 1.6 || x < W.BORDE * 1.6 || x > W.ANCHO - W.BORDE * 1.6) continue;
        if (W.sueloEn(x, y) !== 0) continue;
        if (!Object.keys(L).every((q) => Math.hypot(x - L[q].p[0], y - L[q].p[1]) > L[q].r + 1500)) continue;
        if (W.CAMINOS.some((c) => W.distLinea(x, y, c.p) < c.w / 2 + ANILLO + 150)) continue;
        if (HORDAS.grupos.some((g) => Math.hypot(g.centro[0] - x, g.centro[1] - y) < ANILLO + 600)) continue;
        if (W.RIOS.some((rr) => !rr.seco && W.distLinea(x, y, rr.p) < (rr.w || 200) + ANILLO)) continue;
        if (W.LAGOS.some((g) => Math.hypot(x - g.p[0], y - g.p[1]) < g.rx + ANILLO + 400)) continue;
        if (!despejado(x, y)) continue;
        return [x, y];
      }
    return p0;
  }
  function armar() {
    const c = buscarLugar(),
      x = c[0],
      y = c[1];
    // el anillo: sin árboles adentro, un poco más abierto hacia adelante
    W.cercanas(x - ANILLO - 300, y - ANILLO - 200, x + ANILLO + 300, y + ANILLO + 700, (o) => {
      if (!o.arbol && o.id !== "roca" && o.id !== "troncoCaido") return;
      const dy = o.y - y;
      if (Math.hypot(o.x - x, (dy > 0 ? dy * 0.7 : dy) * 1.2) > ANILLO + 160) return;
      o.oculto = true;
      o.choque = null;
    });
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2 - Math.PI / 2;
      W.agregar("menhirEscarcha", [x + Math.cos(a) * ANILLO, y + Math.sin(a) * ANILLO * 0.8], { v: k });
    }
    const asiento = W.agregar("asientoJotunn", [x, y - 140], {});
    const e = CB.crear("jotunn", x, y - 100, { lider: { unico: "hrimnir", afijos: ["helado"] } });
    e.s = 1;
    e.d.radio = 64;
    e.d.barra = 340;
    e.lider.nombre = t("hd.unico_hrimnir");
    e.lider.titulo = t("jt.titulo");
    e.propio = true; // combate no lo piensa: lo mueve este sistema
    e.o = { pose: "sentado", vista: "S" };
    e.estado = "quieto";
    A.enemigos.push(e);
    // los hrímthursar que llama (nunca más de tres)
    const esb = [];
    for (let i = 0; i < 3; i++) {
      const m = CB.crear("draugr", x, y, { pal: 2 });
      m.activo = false;
      m.muerto = 1;
      m.esbirroJotunn = true;
      A.enemigos.push(m);
      esb.push(m);
    }
    // los tres guardianes: hrímthursar más grandes que andan solos alrededor del anillo
    const guard = [0, 1, 2].map((k) => {
      let gx = x,
        gy = y + DIST_GUARDIAN;
      for (let i = 0; i < 24; i++) {
        const a = (k / 3) * Math.PI * 2 + Math.PI / 2 + (i % 2 ? 1 : -1) * Math.floor(i / 2) * 0.12,
          d = DIST_GUARDIAN + (i % 3) * 200,
          px = x + Math.cos(a) * d,
          py = y + Math.sin(a) * d * 0.8;
        if (px > W.BORDE && px < W.ANCHO - W.BORDE && py > W.BORDE && W.sueloEn(px, py) === 0 && W.libre(px, py, 40)) {
          gx = px;
          gy = py;
          break;
        }
      }
      const g = CB.crear("draugr", gx, gy, { pal: 2 });
      g.s = 1.3;
      g.vida = g.d.vida * 2.2;
      g.d = Object.assign({}, g.d, { vida: g.vida, dano: Math.round(g.d.dano * 1.3) });
      g.guardianJotunn = k;
      g.lugar = [gx, gy];
      g.activo = true;
      A.enemigos.push(g);
      return g;
    });
    jefe = { e, centro: [x, y], asiento, fase: 0, rot: 0, estado: "duerme", t: 0, avisos: [], esb, ultimos: [], llamo: 0, guard, patada: null, vuelo: null };
  }

  // ---------- la pelea ----------
  const tope = () => Math.max(35, Math.round(jug.hpMax * 0.35));
  function despertar() {
    jefe.estado = "ruge";
    jefe.t = 0;
    jefe.e.o.pose = "grita";
    st.intentos++;
    J.sacudir(0.9);
    HUD.aviso(t("jt.despierta_d"), "lugar", t("hd.unico_hrimnir"));
    if (window.SONIDO) SONIDO.tocar("rugido", { vol: 0.8, tono: 0.55, x: jefe.e.x, y: jefe.e.y });
    if (window.ANIMA) ANIMA.gesto("susto");
  }
  // ---------- el desafío: sin sus guardianes caídos, la patada ----------
  function desdenar(dt) {
    const e = jefe.e;
    if (!st.visto) {
      st.visto = true;
      A.dialogoLibre([["hrimnir", "jt.desden_1"], ["hrimnir", "jt.desden_2"]], () => HUD.aviso(t("jt.pista_d"), "lugar", t("jt.pista")));
      return;
    }
    const p = jefe.patada;
    if (!p) {
      if (Math.hypot(jug.x - e.x, jug.y - e.y) > PATADA || jefe.vuelo) return;
      // el aviso exacto: una franja desde el gigante hacia Eromash
      const dir = Math.atan2((jug.y - e.y) * 1.25, jug.x - e.x),
        a = { forma: "franja", x: e.x, y: e.y, largo: 16 * M, ancho: 3.4 * M, dir, dur: 0.8, t: 0, rgb: [200, 242, 244], ataque: "patada", de: e };
      jefe.patada = { t: 0, a };
      J.avisos.push(a);
      e.o.pose = "pisa";
      if (window.SONIDO) SONIDO.tocar("grunido", { vol: 0.6, tono: 0.45, x: e.x, y: e.y });
      return;
    }
    p.t += dt;
    if (p.t < p.a.dur) return;
    J.quitarAviso(p.a);
    jefe.patada = null;
    e.o.pose = "sentado";
    if (!CB.contiene(p.a, jug.x, jug.y) || jug.salto > 0 || jug.inv > 0 || jug.muerto) return;
    // vuela hasta afuera del anillo, del lado por donde vino
    const ang = Math.atan2(jug.y - jefe.centro[1], jug.x - jefe.centro[0]);
    let x1 = jug.x,
      y1 = jug.y;
    for (let d = ANILLO + 320; d < ANILLO + 1400; d += 120) {
      x1 = jefe.centro[0] + Math.cos(ang) * d;
      y1 = jefe.centro[1] + Math.sin(ang) * d * 0.8;
      if (W.libre(x1, y1, 30) && W.sueloEn(x1, y1) === 0) break;
    }
    jefe.vuelo = { t: 0, dur: 0.7, x0: jug.x, y0: jug.y, x1, y1 };
    jug.inv = 1;
    J.sacudir(0.5);
    HUD.aviso(t("jt.patada_d"), "#C8F2F4", t("jt.patada"));
    if (window.SONIDO) SONIDO.tocar("golpeFuerte", { vol: 0.7, tono: 0.6, x: e.x, y: e.y });
    if (window.ANIMA) ANIMA.gesto("susto");
  }
  function volar(dt) {
    const v = jefe.vuelo;
    v.t += dt;
    const k = Math.min(1, v.t / v.dur),
      q = 1 - (1 - k) * (1 - k);
    jug.x = v.x0 + (v.x1 - v.x0) * q;
    jug.y = v.y0 + (v.y1 - v.y0) * q;
    jug.salto = Math.max(jug.salto, 0.05);
    if (k >= 1) jefe.vuelo = null;
  }
  // los guardianes: cada uno que cae queda anotado; con los tres, el gigante espera
  function mirarGuardianes() {
    jefe.guard.forEach((g, k) => {
      if (st.guardianes[k] || !(g.muerto > 0)) return;
      st.guardianes[k] = 1;
      const n = st.guardianes.filter(Boolean).length;
      if (n < 3) HUD.aviso(t("jt.guardian_d", [n]), "#C8F2F4", t("jt.guardian"));
      else {
        HUD.aviso(t("jt.desafio_d"), "lugar", t("jt.desafio"));
        if (window.SONIDO) SONIDO.tocar("rugido", { vol: 0.5, tono: 0.5 });
      }
    });
  }
  function dormir() {
    const e = jefe.e;
    jefe.avisos.forEach((a) => J.quitarAviso(a));
    jefe.avisos = [];
    jefe.esb.forEach((m) => ((m.activo = false), (m.muerto = 1)));
    Object.assign(e, { x: jefe.centro[0], y: jefe.centro[1] - 100, vida: e.d.vida, herido: 0, aturdido: 0, estado: "quieto" });
    e.o.pose = "sentado";
    jefe.estado = "duerme";
    jefe.fase = 0;
    jefe.rot = 0;
    jefe.llamo = 0;
    jefe.ultimos = [];
  }
  // el próximo ataque de la rotación de la fase (nunca el mismo tres veces seguidas)
  function proximo() {
    const r = ROTACION[jefe.fase];
    let k = r[jefe.rot % r.length];
    jefe.rot++;
    const u = jefe.ultimos;
    if (u.length >= 2 && u[u.length - 1] === k && u[u.length - 2] === k) {
      k = r[jefe.rot % r.length];
      jefe.rot++;
    }
    u.push(k);
    if (u.length > 4) u.shift();
    return k;
  }
  const siguiente = () => ROTACION[jefe.fase][jefe.rot % ROTACION[jefe.fase].length];
  function atacar(k) {
    const e = jefe.e,
      A0 = ATAQUES[k],
      dir = Math.atan2((jug.y - e.y) * 1.25, jug.x - e.x),
      nuevos = [];
    if (A0.varios) {
      // granizo: uno donde está Eromash y otros alrededor, sin pisarse
      const n = 3 + (jefe.fase >= 2 ? 2 : 0);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random(),
          d = i === 0 ? 0 : 3.6 * M + Math.random() * 2 * M;
        nuevos.push({ forma: "circulo", x: jug.x + Math.cos(a) * d, y: jug.y + Math.sin(a) * d * 0.8, radio: 1.7 * M });
      }
    } else nuevos.push(A0.f(e, dir));
    jefe.avisos = nuevos.map((a) => Object.assign(a, { dur: A0.dur, t: 0, rgb: RGB[k], ataque: k, de: e }));
    jefe.avisos.forEach((a) => J.avisos.push(a));
    jefe.estado = "aviso";
    jefe.ataque = k;
    jefe.t = 0;
    e.o.pose = k === "pisoton" ? "pisa" : k === "grito" ? "grita" : "";
    if (window.SONIDO) SONIDO.tocar(k === "grito" ? "rugido" : "grunido", { vol: 0.55, tono: 0.5, x: e.x, y: e.y });
  }
  function pegar() {
    const e = jefe.e,
      A0 = ATAQUES[jefe.ataque];
    let dio = false;
    for (const a of jefe.avisos) {
      if (!dio && CB.contiene(a, jug.x, jug.y)) {
        J.herir(Math.min(A0.dano, tope()), e.x, e.y, a.ataque === "linea" || a.ataque === "grito" ? "helado" : null);
        dio = true;
      }
      J.quitarAviso(a);
    }
    jefe.avisos = [];
    J.sacudir(a0Fuerza(jefe.ataque));
    if (window.SONIDO) SONIDO.tocar("golpeFuerte", { vol: 0.7, tono: 0.5, x: e.x, y: e.y });
    if (A0.expone) {
      jefe.estado = "expuesto";
      e.o.pose = "expuesto";
    } else {
      jefe.estado = "espera";
      e.o.pose = "";
    }
    jefe.t = 0;
  }
  const a0Fuerza = (k) => (k === "pisoton" || k === "grito" ? 0.6 : 0.3);
  function llamar() {
    let n = 0;
    for (const m of jefe.esb) {
      if (m.activo && !m.muerto) continue;
      const a = Math.random() * Math.PI * 2;
      m.casa = [jefe.e.x + Math.cos(a) * 260, jefe.e.y + Math.sin(a) * 180];
      CB.reiniciar(m);
      m.activo = true;
      m.estado = "persigue";
      n++;
    }
    if (n) HUD.aviso(t("jt.llama"), "#C8F2F4");
  }
  function moverHacia(dt) {
    const e = jefe.e,
      dx = jug.x - e.x,
      dy = jug.y - e.y,
      d = Math.hypot(dx, dy);
    e.o.mov = 0;
    if (d > 3.6 * M) {
      const v = e.d.vel * (jefe.fase >= 2 ? 1.2 : 1) * dt,
        nx = e.x + (dx / d) * v,
        ny = e.y + (dy / d) * v;
      if (Math.hypot(nx - jefe.centro[0], ny - jefe.centro[1]) < ANILLO) {
        e.x = nx;
        e.y = ny;
        e.o.mov = 1;
      }
    }
    e.o.vista = Math.abs(dx) > Math.abs(dy) * 1.2 ? "E" : dy < 0 ? "N" : "S";
    e.o.espejo = dx < 0;
    return d;
  }
  function vencido() {
    const e = jefe.e;
    jefe.estado = "vencido";
    jefe.avisos.forEach((a) => J.quitarAviso(a));
    jefe.avisos = [];
    jefe.esb.forEach((m) => !m.muerto && CB.golpear(J, m, 99999, e.x, e.y, 1));
    if (st.vencido) return;
    st.vencido = true;
    const hd = A.H.E.extra && A.H.E.extra.hd;
    if (hd) (hd.unicos = hd.unicos || {}).hrimnir = true;
    PODERES.soltar(e.x, e.y, "plata", 320);
    J.retrasar(0.5, () => PODERES.darFragmento());
    J.retrasar(0.9, () => PODERES.darFragmento());
    if (window.RPG) RPG.dar(1500, e.x, e.y);
    if (window.BOTIN && window.OBJETOS) J.retrasar(1.2, () => BOTIN.tirar(e.x, e.y - 30, OBJETOS.generar({ n: window.RPG ? RPG.nivel() : 1, min: 3, hallazgo: 2.5 }), true));
    HUD.aviso(t("jt.vencido_d"), "lugar", t("jt.vencido"));
    J.sacudir(1);
    if (window.SONIDO) SONIDO.tocar("mision", { vol: 0.7, tono: 0.7 });
    if (window.ANIMA) ANIMA.gesto("feliz");
    if (window.VIDA) VIDA.evento("lider", e.x, e.y);
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      CB = A.CB;
      armar();
      if (window.BESTIARIO) {
        BESTIARIO.LISTA.push("jotunn");
        BESTIARIO.UNICOS.push(["hrimnir", "jotunn"]);
      }
    },
    alEmpezar(extra) {
      extra.jotunn = Object.assign(base(), extra.jotunn || {});
      st = extra.jotunn;
      st.guardianes = (st.guardianes || [0, 0, 0]).slice(0, 3);
      dormir();
      jefe.patada = null;
      jefe.vuelo = null;
      jefe.guard.forEach((g, k) => {
        const fuera = !!st.guardianes[k] || st.vencido;
        Object.assign(g, { muerto: fuera ? 1 : 0, activo: !fuera, vida: g.d.vida, x: g.lugar[0], y: g.lugar[1], estado: "quieto" });
      });
      jefe.e.muerto = st.vencido ? 1 : 0;
      jefe.e.o.oculto = st.vencido;
      jefe.e.activo = !st.vencido;
      if (st.vencido) jefe.estado = "vencido";
      jefe.e.lider.nombre = t("hd.unico_hrimnir");
      jefe.e.lider.titulo = t("jt.titulo");
    },
    actualizar(dt) {
      if (!jefe || J.dentro) return;
      const e = jefe.e;
      e.o.muerto = e.muerto;
      if (jefe.estado === "vencido") return;
      if (e.muerto > 0) return vencido();
      if (J.modo !== "juego") return;
      mirarGuardianes();
      if (jefe.vuelo) volar(dt);
      const dc = Math.hypot(jug.x - jefe.centro[0], jug.y - jefe.centro[1]);
      if (jefe.estado === "duerme") {
        if (desafiado()) {
          if (dc < DESPIERTA && !jug.muerto) despertar();
        } else if ((dc < DESPIERTA || jefe.patada) && !jug.muerto) desdenar(dt);
        return;
      }
      // se fue o cayó Eromash: vuelve a su asiento
      if (dc > SUELTA || jug.muerto) {
        if (!jug.muerto) HUD.aviso(t("jt.vuelve"), "#C8F2F4");
        return dormir();
      }
      J.alejarA(1.75);
      J.camFoco = [jefe.e.x, jefe.e.y - 160];
      jefe.t += dt;
      // las fases por la vida, y los esbirros al pasar de fase
      const frac = e.vida / e.d.vida,
        fase = frac > 0.66 ? 0 : frac > 0.33 ? 1 : 2;
      if (fase > jefe.fase) {
        jefe.fase = fase;
        jefe.rot = 0;
        HUD.aviso(t("jt.fase_" + fase), "#C8F2F4");
        J.sacudir(0.5);
      }
      if (jefe.llamo < jefe.fase) {
        jefe.llamo = jefe.fase;
        llamar();
      }
      // un remate lo aturde al tercero (combate.js): corta lo que iba a hacer
      if (e.aturdido > 0) {
        e.aturdido -= dt;
        jefe.avisos.forEach((a) => J.quitarAviso(a));
        jefe.avisos = [];
        jefe.estado = "espera";
        jefe.t = 0;
        e.o.pose = "expuesto";
        return;
      }
      e.o.golpe = 0;
      switch (jefe.estado) {
        case "ruge":
          if (jefe.t > 1.6) (jefe.estado = "espera"), (jefe.t = 0.6), (e.o.pose = "");
          break;
        case "espera": {
          // camina hasta tener a Eromash al alcance del próximo ataque (la línea, el granizo y el grito llegan lejos)
          const d = moverHacia(dt),
            sig = siguiente(),
            alcance = sig === "barrido" || sig === "pisoton" ? 5.2 * M : 13 * M;
          if (jefe.t > 1.1 && d < alcance) atacar(proximo());
          break;
        }
        case "aviso":
          e.o.mov = 0;
          e.o.golpe = Math.min(1, jefe.t / ATAQUES[jefe.ataque].dur);
          if (jefe.t >= ATAQUES[jefe.ataque].dur) pegar();
          break;
        case "expuesto":
          e.o.mov = 0;
          if (jefe.t > EXPUESTO) (jefe.estado = "espera"), (jefe.t = 0.3), (e.o.pose = "");
          break;
      }
    },
    hud() {
      // la barra de jefe (goinn.js la limpia cada cuadro antes; este sistema va después)
      if (!jefe || J.dentro || jefe.estado === "duerme" || jefe.estado === "vencido") return;
      const e = jefe.e;
      J.jefeHud = { nombre: e.lider.nombre, frac: Math.max(0, e.vida / e.d.vida), ataduras: 0, ataque: jefe.estado === "aviso" ? t("jt.a_" + jefe.ataque) : "", accion: jefe.estado === "expuesto" ? t("jt.expuesto") : "" };
    },
    modDano(dano, e) {
      if (jefe && e === jefe.e && jefe.estado === "duerme") return 0; // dormido no se lo lastima: hay que ganarse la pelea
      return jefe && e === jefe.e && jefe.estado === "expuesto" ? dano * BONO_EXPUESTO : dano;
    },
    luces(dar) {
      if (!jefe || jefe.estado === "vencido" || J.dentro) return;
      dar({ x: jefe.e.x, y: jefe.e.y - 230, r: 360, col: "#C8F2F4", f: jefe.estado === "duerme" ? 0.25 : 0.55 });
    },
    marcasMapa() {
      if (!jefe) return [];
      const m = [{ tipo: "jotunn", x: jefe.centro[0], y: jefe.centro[1], op: { nombre: t("hd.unico_hrimnir"), apagado: st.vencido } }];
      // sus guardianes, después de la primera visita
      if (st.visto && !st.vencido) jefe.guard.forEach((g, k) => !st.guardianes[k] && m.push({ tipo: "jotunn", x: g.lugar[0], y: g.lugar[1], op: { nombre: t("jt.guardian_nombre"), cat: "jotunn" } }));
      return m;
    },
    diario() {
      if (st.intentos) return `<div class="diario-resumen"><p><b>${t("hd.unico_hrimnir")}</b> ${st.vencido ? t("jt.diario_vencido") : t("jt.diario", [st.intentos])}</p></div>`;
      return st.visto ? `<div class="diario-resumen"><p><b>${t("hd.unico_hrimnir")}</b> ${t("jt.diario_guardianes", [st.guardianes.filter(Boolean).length])}</p></div>` : "";
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, jefe: () => jefe, ATAQUES, ROTACION, proximo, atacar, despertar, dormir, desafiado, ANILLO, PATADA };
})();
