// ---------- las runas de los elementos y las reacciones (sistema ELEMENTOS) ----------
// Como las reacciones de Genshin y de Divinity: Original Sin y las señales que se combinan en The Witcher. Dos runas
// nuevas se suman a las cuatro de los altares (PODERES.RUNAS / ORDEN / LANZAR):
//   Thurisaz (trueno)  un rayo a la criatura de enfrente que salta a tres más; las deja crispadas (e.electro).
//                      Se gana en el Roble del Trueno, al sur del Paso: la prueba del trueno, ocho rayos marcados en
//                      el piso que hay que esquivar (saltar evita todo); el último cae en el roble.
//   Laguz (agua)       una ola en abanico que empuja, empapa (e.mojado) y cierra un 5 % de las heridas.
//                      Se gana en la Fuente de Laguz, seca en la orilla de una laguna: despertar las tres piedras de
//                      la orilla con su marca la hace manar.
// Cuatro elementos sobre las criaturas: fuego (e.quema: Kenaz, el galdr de fuego), hielo (e.helado > 1,2: Isa),
// agua (e.mojado: Laguz, estar en el agua o la lluvia) y trueno (e.electro: Thurisaz). Dos juntos hacen una
// reacción (REACCIONES) y se consumen:
//   vapor (agua + fuego)       nube que quema y deja ciegas un rato a las de adentro
//   congelada (agua + hielo)   congelada entera 4 s; el próximo golpe la quiebra con +60 %
//   descarga (agua + trueno)   el rayo corre a todas las empapadas de cerca y las aturde
//   deshielo (fuego + hielo)   el hielo estalla: daño grande
//   estallido (fuego + trueno) explosión que pega y empuja alrededor
//   esquirlas (hielo + trueno) esquirlas para todos lados que pegan y escarchan
// Con lluvia todo queda empapado, el trueno pega un 25 % más y el fuego dura menos. Cada reacción descubierta paga
// plata y va al códice (Bolsa); las seis, un fragmento.
// Estado en E.extra.elementos = { roble, piedras: [bool ×3], fuente, vistas: { id: n }, todas, ayuda, lluvia }. Textos `el.`.
window.ELEMENTOS = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const M = 30;
  const TRUENO = "#B8A8F0",
    AGUA = "#73D5DB",
    RGB_TRUENO = [184, 168, 240];
  const RAYOS_PRUEBA = 8,
    LEJOS_PRUEBA = 700,
    PAGA = 20;
  const CERCA = 150;
  // las reacciones: los dos elementos, el color y el ícono del códice
  const REACCIONES = {
    vapor: { a: "agua", b: "fuego", col: "#E8E0D0" },
    congelado: { a: "agua", b: "hielo", col: "#C8F2F4" },
    descarga: { a: "agua", b: "trueno", col: TRUENO },
    deshielo: { a: "fuego", b: "hielo", col: "#FF8D71" },
    estallido: { a: "fuego", b: "trueno", col: "#F5A524" },
    esquirlas: { a: "hielo", b: "trueno", col: "#C8F2F4" },
  };
  const IDS = Object.keys(REACCIONES);
  const COL_EL = { fuego: "#FF8D71", hielo: "#C8F2F4", agua: AGUA, trueno: TRUENO };
  const base = () => ({ roble: false, piedras: [false, false, false], fuente: false, vistas: {}, todas: false, ayuda: false, lluvia: false });
  let st = base();
  let roble = null, // { cosa }
    fuente = null, // { cosa, piedras: [cosa ×3] }
    prueba = null, // { t, n, prox, rayos: [{ a, t }] }
    fxs = []; // lo que se ve: { tipo, x, y, t, dur, ... }

  const poder = () => J.poderRunico || 1;
  const lluvia = () => (window.VIDA ? VIDA.clima({}).lluvia || 0 : 0);
  const vivas = () => A.enemigos.filter((e) => e.activo && !e.muerto && !(e.d && e.d.blanco));
  // qué elementos lleva una criatura
  const tiene = {
    fuego: (e) => e.quema > 0,
    hielo: (e) => e.helado > 1.2 && !(e.congelado > 0),
    agua: (e) => e.mojado > 0,
    trueno: (e) => e.electro > 0,
  };
  const quitar = {
    fuego: (e) => (e.quema = 0),
    hielo: (e) => (e.helado = Math.min(e.helado, 0.2)),
    agua: (e) => (e.mojado = 0),
    trueno: (e) => (e.electro = 0),
  };

  // ---------- las dos runas nuevas ----------
  Object.assign(PODERES.RUNAS, { thurisaz: { coste: 45, col: TRUENO }, laguz: { coste: 35, col: AGUA } });
  PODERES.ORDEN.push("thurisaz", "laguz");
  PODERES.LANZAR.thurisaz = (h) => {
    const dir = h.apuntar(),
      todas = h.vivos();
    // la primera: la más cerca de hacia donde apunta, a menos de 10 m
    let mejor = null,
      pm = Infinity;
    for (const e of todas) {
      const dx = e.x - jug.x,
        dy = (e.y - jug.y) * 1.25,
        d = Math.hypot(dx, dy);
      if (d > 10 * M) continue;
      let da = Math.atan2(dy, dx) - dir;
      da = Math.abs(Math.atan2(Math.sin(da), Math.cos(da)));
      const p = d * (1 + da * 1.4);
      if (p < pm) (pm = p), (mejor = e);
    }
    const desde = [jug.x, jug.y - 60];
    if (!mejor) {
      // sin nadie: el rayo cae al piso adelante
      const x = jug.x + Math.cos(dir) * 180,
        y = jug.y + (Math.sin(dir) * 180) / 1.25;
      fxs.push({ tipo: "rayo", pts: zigzag(desde[0], desde[1], x, y), t: 0, dur: 0.35 });
      return sonar("golpeFuerte", 1.3);
    }
    const lluviaK = lluvia() > 0.4 ? 1.25 : 1;
    let dano = 26 * h.pr * lluviaK,
      de = { x: desde[0], y: desde[1] },
      e = mejor;
    const pegadas = [];
    for (let k = 0; k < 4 && e; k++) {
      fxs.push({ tipo: "rayo", pts: zigzag(de.x, de.y, e.x, e.y - 40), t: 0, dur: 0.35 });
      h.golpe(e, dano);
      e.electro = 5;
      pegadas.push(e);
      dano *= 0.75;
      de = { x: e.x, y: e.y - 40 };
      const prev = e;
      e = todas.filter((o) => !pegadas.includes(o) && !o.muerto && Math.hypot(o.x - prev.x, o.y - prev.y) < 5.5 * M).sort((a, b) => Math.hypot(a.x - prev.x, a.y - prev.y) - Math.hypot(b.x - prev.x, b.y - prev.y))[0];
    }
    J.sacudir(0.15);
    sonar("golpeFuerte", 1.4);
    h.avisar("thurisaz", { forma: "circulo", x: mejor.x, y: mejor.y, radio: 60 });
  };
  PODERES.LANZAR.laguz = (h) => {
    const dir = h.apuntar(),
      radio = 7 * M,
      ang = 0.7,
      zona = { forma: "abanico", x: jug.x, y: jug.y, radio, ang, dir };
    h.vivos().forEach((e) => {
      if (!A.CB.contiene(zona, e.x, e.y)) return;
      h.golpe(e, 10 * h.pr);
      e.mojado = 8;
      if (!e.d.pesado && !e.lider) {
        const l = Math.hypot(e.x - jug.x, e.y - jug.y) || 1;
        e.vx = ((e.x - jug.x) / l) * 520;
        e.vy = ((e.y - jug.y) / l) * 520;
      }
    });
    jug.hp = Math.min(jug.hpMax, jug.hp + jug.hpMax * 0.05);
    fxs.push({ tipo: "ola", x: jug.x, y: jug.y, dir, radio, ang, t: 0, dur: 0.7 });
    sonar("tela", 0.6);
    h.avisar("laguz", zona);
  };

  function zigzag(x0, y0, x1, y1) {
    const pts = [x0, y0],
      n = 7,
      dx = x1 - x0,
      dy = y1 - y0,
      l = Math.hypot(dx, dy) || 1;
    for (let i = 1; i < n; i++) {
      const u = i / n,
        k = (Math.random() - 0.5) * Math.min(40, l * 0.18);
      pts.push(x0 + dx * u + (-dy / l) * k, y0 + dy * u + (dx / l) * k);
    }
    pts.push(x1, y1);
    return pts;
  }
  const sonar = (n, tono, x, y) => window.SONIDO && SONIDO.tocar(n, { vol: 0.6, tono: tono || 1, x: x != null ? x : jug.x, y: y != null ? y : jug.y });

  // ---------- las reacciones ----------
  function pegar(e, dano, ox, oy, empuje) {
    if (!e || e.muerto || !e.activo) return;
    dano = Math.round(dano);
    A.numero(e.x, e.y - 60, dano, "#FFD98A", true);
    A.CB.golpear(J, e, dano, ox, oy, empuje || 0.4);
  }
  function reaccion(id, e) {
    const R = REACCIONES[id],
      p = poder(),
      x = e.x,
      y = e.y;
    quitar[R.a](e);
    quitar[R.b](e);
    A.textoFlotante(x, y - (e.d.barra || 80) - 50, t("el.r_" + id), R.col);
    if (id === "vapor") {
      fxs.push({ tipo: "vapor", x, y, t: 0, dur: 3, r: 150 });
      vivas().forEach((o) => {
        if (Math.hypot(o.x - x, o.y - y) > 150) return;
        pegar(o, 12 * p, x, y, 0.2);
        o.vio = 0;
        o.duda = 2;
        o.aturdido = Math.max(o.aturdido || 0, o.d.pesado || o.lider ? 0.6 : 1.4);
        if (o.aviso) J.quitarAviso(o.aviso), (o.aviso = null);
      });
      sonar("fogata", 1.6, x, y);
    } else if (id === "congelado") {
      e.congelado = 4;
      e.helado = 4;
      fxs.push({ tipo: "brillo", x, y: y - 40, t: 0, dur: 0.5, col: "#C8F2F4", r: 70 });
      sonar("golpe", 1.6, x, y);
    } else if (id === "descarga") {
      const tocadas = vivas().filter((o) => o === e || (o.mojado > 0 && Math.hypot(o.x - x, o.y - y) < 12 * M));
      tocadas.forEach((o) => {
        if (o !== e) fxs.push({ tipo: "rayo", pts: zigzag(x, y - 40, o.x, o.y - 40), t: 0, dur: 0.4 });
        o.mojado = 0;
        o.electro = 0;
        pegar(o, 22 * p, x, y, 0.3);
        o.aturdido = Math.max(o.aturdido || 0, o.d.pesado || o.lider ? 0.5 : 1);
      });
      fxs.push({ tipo: "anillo", x, y, t: 0, dur: 0.5, col: TRUENO, r: 12 * M });
      J.sacudir(0.2);
      sonar("golpeFuerte", 1.5, x, y);
    } else if (id === "deshielo") {
      pegar(e, 35 * p, jug.x, jug.y, 0.8);
      fxs.push({ tipo: "brillo", x, y: y - 40, t: 0, dur: 0.6, col: "#FF8D71", r: 90 });
      fxs.push({ tipo: "esquirlas", x, y: y - 30, t: 0, dur: 0.5, col: "#F2ECEC", n: 8 });
      J.hitstop = Math.max(J.hitstop || 0, 0.06);
      sonar("golpeFuerte", 1.1, x, y);
    } else if (id === "estallido") {
      vivas().forEach((o) => Math.hypot(o.x - x, o.y - y) < 140 && pegar(o, 20 * p, x, y, 1.2));
      fxs.push({ tipo: "anillo", x, y, t: 0, dur: 0.5, col: "#F5A524", r: 140 });
      fxs.push({ tipo: "brillo", x, y: y - 30, t: 0, dur: 0.5, col: "#FFD98A", r: 120 });
      J.sacudir(0.35);
      sonar("golpeFuerte", 0.7, x, y);
    } else if (id === "esquirlas") {
      vivas().forEach((o) => {
        if (Math.hypot(o.x - x, o.y - y) > 180) return;
        pegar(o, 12 * p, x, y, 0.5);
        if (o !== e) o.helado = Math.max(o.helado, 1.1);
      });
      fxs.push({ tipo: "esquirlas", x, y: y - 30, t: 0, dur: 0.55, col: "#C8F2F4", n: 10 });
      sonar("golpe", 1.8, x, y);
    }
    if (window.VIDA) VIDA.evento("runa", x, y, {});
    descubrir(id);
  }
  function descubrir(id) {
    const nuevo = !st.vistas[id];
    st.vistas[id] = (st.vistas[id] || 0) + 1;
    if (!nuevo) return;
    HUD.aviso(t("el.r_" + id + "_d"), REACCIONES[id].col, t("el.descubierta", [t("el.r_" + id)]));
    PODERES.darPlata(PAGA);
    if (!st.todas && IDS.every((k) => st.vistas[k])) {
      st.todas = true;
      PODERES.darFragmento();
      HUD.aviso(t("el.todas"), "#FFD98A");
    }
  }
  // dos elementos juntos en una criatura: la primera reacción de la lista que se cumpla
  function mirar(e) {
    for (const id of IDS) {
      const R = REACCIONES[id];
      if (tiene[R.a](e) && tiene[R.b](e)) return reaccion(id, e);
    }
  }

  // ---------- el Roble del Trueno ----------
  function despejado(x, y, r) {
    let si = true;
    W.cercanas(x - r, y - r, x + r, y + r, (o) => {
      // nada armado cerca (atriles, estandartes, carteles…); árboles y rocas se apartan después
      if (Math.abs(o.x - x) > r || Math.abs(o.y - y) > r) return;
      if (!o.oculto && !o.arbol && o.id !== "roca" && o.id !== "troncoCaido" && (o.choque || (ASSETS.LISTA[o.id] || {}).figura)) si = false;
    });
    return si;
  }
  function abrir(x, y, r) {
    W.cercanas(x - r, y - r, x + r, y + r * 1.6, (o) => {
      if (!o.arbol && o.id !== "roca" && o.id !== "troncoCaido") return;
      const dy = o.y - y;
      if (Math.hypot(o.x - x, dy > 0 ? dy * 0.5 : dy) > r) return;
      o.oculto = true;
      o.choque = null;
    });
  }
  const lejosDeLugares = (x, y, extra) => Object.keys(W.LUGARES).every((k) => Math.hypot(x - W.LUGARES[k].p[0], y - W.LUGARES[k].p[1]) > W.LUGARES[k].r + extra);
  const firme = (x, y, r) => [[0, 0], [r, 0], [-r, 0], [0, r * 0.6], [0, -r * 0.4]].every(([dx, dy]) => W.sueloEn(x + dx, y + dy) === 0);
  function buscarRoble() {
    const c = W.LUGARES.paso_sur.p,
      rnd = DIB.azar(7177);
    for (let i = 0; i < 400; i++) {
      const a = Math.PI * (0.45 + rnd() * 0.9), // hacia el sur y los costados
        r = 900 + rnd() * 1800,
        x = c[0] + Math.cos(a) * r,
        y = c[1] + Math.sin(a) * r;
      if (!firme(x, y, 220) || !lejosDeLugares(x, y, 500)) continue;
      if (W.CAMINOS.some((k) => W.distLinea(x, y, k.p) < k.w / 2 + 260)) continue;
      if (!W.CAMINOS.some((k) => W.distLinea(x, y, k.p) < k.w / 2 + 900)) continue; // que se vea desde algún camino
      if (W.RIOS.some((k) => !k.seco && W.distLinea(x, y, k.p) < (k.w || 200) + 200)) continue;
      if (window.HORDAS && HORDAS.grupos.some((g) => Math.hypot(g.centro[0] - x, g.centro[1] - y) < 1000)) continue;
      if (despejado(x, y, 260)) return [x, y];
    }
    return [c[0], c[1] + 1200];
  }
  function empezarPrueba() {
    if (prueba || st.roble) return;
    prueba = { t: 0, n: 0, prox: 1.2, rayos: [] };
    roble.cosa.o.tormenta = 1;
    HUD.aviso(t("el.prueba"), TRUENO, t("el.prueba_t"));
    if (window.ANIMA) ANIMA.gesto("susto");
    sonar("golpeFuerte", 0.5);
  }
  function seguirPrueba(dt) {
    const p = prueba,
      ox = roble.cosa.x,
      oy = roble.cosa.y;
    p.t += dt;
    if (Math.hypot(jug.x - ox, jug.y - oy) > LEJOS_PRUEBA || jug.muerto) {
      p.rayos.forEach((r) => J.quitarAviso(r.a));
      prueba = null;
      roble.cosa.o.tormenta = 0;
      return HUD.aviso(t("el.lejos"), "#8E8A86");
    }
    p.prox -= dt;
    if (p.prox <= 0 && p.n < RAYOS_PRUEBA) {
      p.n++;
      const ultimo = p.n === RAYOS_PRUEBA;
      // el último cae en el roble; los demás, donde está Eromash (con un poco de ventaja)
      const x = ultimo ? ox : jug.x + (Math.random() - 0.5) * 60,
        y = ultimo ? oy + 10 : jug.y + (Math.random() - 0.5) * 40;
      const a = { forma: "circulo", x, y, dur: 1, t: 0, radio: ultimo ? 90 : 75, rgb: RGB_TRUENO };
      J.avisos.push(a);
      p.rayos.push({ a, t: 0, ultimo });
      p.prox = 1.25 - p.n * 0.07;
      A.textoFlotante(jug.x, jug.y + 70, t("el.rayo_n", [p.n, RAYOS_PRUEBA]), TRUENO);
    }
    for (const r of p.rayos) {
      r.t += dt;
      if (r.t >= r.a.dur && !r.pego) {
        r.pego = true;
        J.quitarAviso(r.a);
        fxs.push({ tipo: "rayo", pts: zigzag(r.a.x + 30, r.a.y - 700, r.a.x, r.a.y), t: 0, dur: 0.4, grueso: true });
        fxs.push({ tipo: "anillo", x: r.a.x, y: r.a.y, t: 0, dur: 0.35, col: TRUENO, r: r.a.radio });
        J.sacudir(0.25);
        sonar("golpeFuerte", 0.6, r.a.x, r.a.y);
        if (A.CB.contiene(r.a, jug.x, jug.y)) J.herir(Math.min(14, Math.round(jug.hpMax * 0.35)), r.a.x, r.a.y);
        if (r.ultimo) return terminarPrueba();
      }
    }
  }
  function terminarPrueba() {
    prueba = null;
    st.roble = true;
    roble.cosa.o.tormenta = 0;
    roble.cosa.o.tomada = true;
    J.camLenta = 0.4;
    if (window.VIDA) VIDA.evento("piedra", roble.cosa.x, roble.cosa.y - 60, {});
    PODERES.darRuna("thurisaz");
  }

  // ---------- la Fuente de Laguz ----------
  function buscarFuente() {
    const lg = W.LAGOS[2] || W.LAGOS[0],
      rnd = DIB.azar(4411),
      orilla = (a, k) => [lg.p[0] + Math.cos(a) * lg.rx * k, lg.p[1] + Math.sin(a) * lg.ry * k];
    const ok = ([x, y], r) => firme(x, y, r) && lejosDeLugares(x, y, 200) && !W.CAMINOS.some((k) => W.distLinea(x, y, k.p) < k.w / 2 + 120) && despejado(x, y, r);
    // la fuente en la orilla; las tres piedras repartidas alrededor
    let fu = null,
      af = 0;
    for (let i = 0; i < 200 && !fu; i++) {
      const a = rnd() * Math.PI * 2,
        p = orilla(a, 1.25 + rnd() * 0.25);
      if (ok(p, 160)) (fu = p), (af = a);
    }
    if (!fu) return null;
    const piedras = [];
    for (const da of [2.1, -2.1, Math.PI]) {
      let pi = null;
      for (let i = 0; i < 120 && !pi; i++) {
        const p = orilla(af + da + (rnd() - 0.5) * 1.6, 1.2 + rnd() * 0.5);
        if (ok(p, 60) && [fu, ...piedras].every((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) > 600)) pi = p;
      }
      piedras.push(pi || orilla(af + da, 1.4));
    }
    return { fu, piedras };
  }
  function tocarPiedra(i) {
    if (st.piedras[i]) return;
    st.piedras[i] = true;
    const pi = fuente.piedras[i];
    pi.o.viva = true;
    const n = st.piedras.filter(Boolean).length;
    fxs.push({ tipo: "hilo", x: pi.x, y: pi.y - 20, x1: fuente.cosa.x, y1: fuente.cosa.y - 10, t: 0, dur: 1.4 });
    A.textoFlotante(pi.x, pi.y - 90, t("el.piedra_n", [n]), AGUA);
    sonar("runa", 1 + n * 0.12, pi.x, pi.y);
    if (n === 3) {
      J.retrasar(1.3, () => {
        fuente.cosa.o.viva = true;
        HUD.aviso(t("el.mana"), AGUA);
        if (window.VIDA) VIDA.evento("piedra", fuente.cosa.x, fuente.cosa.y - 40, {});
      });
    }
  }
  function beber() {
    if (st.fuente || !fuente.cosa.o.viva) return;
    st.fuente = true;
    fuente.cosa.o.tomada = true;
    jug.hp = jug.hpMax;
    PODERES.darRuna("laguz");
  }

  // ---------- el códice ----------
  function codice() {
    if (window.INVENTARIO && INVENTARIO.abierta()) INVENTARIO.cerrar();
    const filas = IDS.map((id) => {
      const R = REACCIONES[id],
        n = st.vistas[id] || 0,
        par = `<span style="color:${COL_EL[R.a]}">${t("el." + R.a)}</span> + <span style="color:${COL_EL[R.b]}">${t("el." + R.b)}</span>`;
      return `<div class="el-fila${n ? "" : " apagada"}"><b style="color:${n ? R.col : "#8E8A86"}">${n ? t("el.r_" + id) : t("el.sin_descubrir")}</b> <span class="el-par">${par}</span>${n ? `<div class="el-d">${t("el.r_" + id + "_d")} · ${t("el.veces", [n])}</div>` : ""}</div>`;
    }).join("");
    A.menu(`<h2>${t("el.codice")}</h2><div class="sub">${t("el.codice_d")}</div><div class="el-lista">${filas}</div>`, [{ texto: t("ui.cerrar"), fn: A.cerrarMenu }]);
  }

  // ---------- el dibujo ----------
  const caro = () => !window.CALIDAD || CALIDAD.nivel !== "baja";
  function linea(c, pts, col, w) {
    c.strokeStyle = col;
    c.lineWidth = w;
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    c.stroke();
  }
  function dibujarFx(c, f) {
    const u = f.t / f.dur;
    c.save();
    c.globalAlpha = Math.max(0, 1 - u);
    if (f.tipo === "rayo") {
      if (caro()) linea(c, f.pts, "rgba(184,168,240,0.45)", f.grueso ? 14 : 9);
      linea(c, f.pts, TRUENO, f.grueso ? 6 : 4);
      linea(c, f.pts, "#F2ECEC", f.grueso ? 2.4 : 1.6);
    } else if (f.tipo === "ola") {
      const r = f.radio * Math.min(1, u * 1.6);
      c.fillStyle = "rgba(115,213,219,0.28)";
      c.beginPath();
      c.moveTo(f.x, f.y);
      c.ellipse(f.x, f.y, r, r / 1.25, 0, f.dir - f.ang, f.dir + f.ang);
      c.closePath();
      c.fill();
      c.strokeStyle = AGUA;
      c.lineWidth = 5;
      c.beginPath();
      c.ellipse(f.x, f.y, r, r / 1.25, 0, f.dir - f.ang, f.dir + f.ang);
      c.stroke();
      if (caro())
        for (let k = 0; k < 7; k++) {
          const a = f.dir - f.ang + (k / 6) * f.ang * 2;
          DIB.R(c, f.x + Math.cos(a) * r - 3, f.y + (Math.sin(a) * r) / 1.25 - 10 - u * 20, 5, 5, "#C8F2F4");
        }
    } else if (f.tipo === "vapor") {
      c.globalAlpha = Math.min(1, (1 - u) * 1.5) * 0.55;
      const n = caro() ? 9 : 4;
      for (let k = 0; k < n; k++) {
        const a = k * 2.4,
          rr = f.r * (0.35 + 0.5 * ((k * 0.37) % 1)) * (0.7 + u * 0.4);
        DIB.E(c, f.x + Math.cos(a) * rr * 0.8, f.y - 30 + (Math.sin(a) * rr) / 2.2 - u * 30, 46 + k * 4, 26 + k * 2, k % 2 ? "#E8E0D0" : "#C8C4BE");
      }
    } else if (f.tipo === "anillo") {
      c.strokeStyle = f.col;
      c.lineWidth = 4;
      c.beginPath();
      c.ellipse(f.x, f.y, f.r * (0.3 + u * 0.7), f.r * (0.3 + u * 0.7) * 0.4, 0, 0, Math.PI * 2);
      c.stroke();
    } else if (f.tipo === "brillo") {
      if (caro()) DIB.halo(c, f.x, f.y, f.r * (0.6 + u * 0.6), f.col, 0.7 * (1 - u));
      else DIB.E(c, f.x, f.y, f.r * 0.3, f.r * 0.3, f.col);
    } else if (f.tipo === "esquirlas") {
      for (let k = 0; k < f.n; k++) {
        const a = (k / f.n) * Math.PI * 2 + 0.3,
          d = 20 + u * 150,
          px = f.x + Math.cos(a) * d,
          py = f.y + Math.sin(a) * d * 0.6;
        DIB.P(c, [px, py - 7, px + 4, py, px, py + 7, px - 4, py], f.col);
      }
    } else if (f.tipo === "hilo") {
      // la luz del agua corre de la piedra a la fuente
      const k = Math.min(1, u * 1.3),
        x = f.x + (f.x1 - f.x) * k,
        y = f.y + (f.y1 - f.y) * k - Math.sin(k * Math.PI) * 60;
      c.globalAlpha = 1;
      if (caro()) DIB.halo(c, x, y, 40, AGUA, 0.6);
      DIB.P(c, [x, y - 8, x + 6, y, x, y + 8, x - 6, y], "#C8F2F4");
    }
    c.restore();
  }
  // lo que lleva cada criatura: gotas, chispas, el bloque de hielo
  function dibujarEstados(c, e) {
    const h = e.d.barra || 80,
      r = e.d.radio || 22,
      tt = J.t;
    if (e.congelado > 0) {
      c.save();
      c.globalAlpha = 0.72;
      DIB.P(c, [e.x - r * 1.3, e.y + 4, e.x - r * 1.5, e.y - h * 0.7, e.x - r * 0.4, e.y - h * 1.02, e.x + r * 1.2, e.y - h * 0.86, e.x + r * 1.4, e.y + 2], "#C8F2F4");
      DIB.P(c, [e.x - r * 1.3, e.y + 4, e.x - r * 1.5, e.y - h * 0.7, e.x - r * 0.4, e.y - h * 1.02, e.x - r * 0.2, e.y + 6], "#8EC8D8");
      c.restore();
      DIB.L(c, e.x + r * 0.2, e.y - h * 0.8, e.x + r * 0.9, e.y - h * 0.5, "#F2ECEC", 2);
    }
    if (e.mojado > 0)
      for (let k = 0; k < 2; k++) {
        const u = (tt * 1.4 + k * 0.5 + e.sem) % 1;
        c.save();
        c.globalAlpha = 1 - u;
        DIB.R(c, e.x + (k ? r * 0.6 : -r * 0.5), e.y - h * 0.5 + u * h * 0.45, 3, 6, AGUA);
        c.restore();
      }
    if (e.electro > 0 && caro()) {
      const k = Math.floor(tt * 14 + e.sem * 10) % 3,
        px = e.x + (k - 1) * r * 0.6,
        py = e.y - h * (0.35 + k * 0.15);
      DIB.L(c, px, py, px + 7, py - 8, TRUENO, 2);
      DIB.L(c, px + 7, py - 8, px + 1, py - 14, "#F2ECEC", 2);
    }
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      // el ícono del códice en la Bolsa: un libro con los cuatro rombos de colores
      if (window.INVENTARIO && INVENTARIO.iconoDe)
        INVENTARIO.iconoDe("el_codice", (c) => {
          DIB.P(c, [-22, -26, 22, -26, 24, 26, -20, 26], "#5E130D");
          DIB.P(c, [-22, -26, -14, -26, -12, 26, -20, 26], "#3A0E0A");
          [["#FF8D71", -4, -12], ["#C8F2F4", 10, -12], ["#73D5DB", -4, 6], ["#B8A8F0", 10, 6]].forEach(([col, x, y]) => DIB.P(c, [x, y - 6, x + 5, y, x, y + 6, x - 5, y], col));
        });
      const pr = buscarRoble();
      abrir(pr[0], pr[1], 560);
      roble = { cosa: W.agregar("robleTrueno", pr, { s: 0.85 }) };
      const bf = buscarFuente();
      if (bf) {
        abrir(bf.fu[0], bf.fu[1], 240);
        bf.piedras.forEach((p) => abrir(p[0], p[1], 120));
        fuente = { cosa: W.agregar("fuenteLaguz", bf.fu, {}), piedras: bf.piedras.map((p) => W.agregar("piedraManantial", p, {})) };
      }
    },
    alEmpezar(extra) {
      extra.elementos = Object.assign(base(), extra.elementos || {});
      st = extra.elementos;
      prueba = null;
      fxs = [];
      roble.cosa.o.tomada = st.roble;
      roble.cosa.o.tormenta = 0;
      if (fuente) {
        fuente.piedras.forEach((p, i) => (p.o.viva = !!st.piedras[i]));
        fuente.cosa.o.viva = st.piedras.every(Boolean);
        fuente.cosa.o.tomada = st.fuente;
      }
    },
    actualizar(dt) {
      if (!A) return;
      for (const f of fxs) f.t += dt;
      fxs = fxs.filter((f) => f.t < f.dur);
      if (prueba) seguirPrueba(dt);
      if (J.dentro) return;
      const ll = lluvia() > 0.4;
      if (ll && !st.lluvia && (PODERES.tiene("thurisaz") || PODERES.tiene("laguz"))) {
        st.lluvia = true;
        HUD.aviso(t("el.lluvia"), AGUA);
      }
      let alguna = false;
      for (const e of A.enemigos) {
        if (!e.activo || e.muerto) continue;
        if (Math.abs(e.x - jug.x) > 1600 || Math.abs(e.y - jug.y) > 1200) continue;
        if (e.mojado > 0) e.mojado -= dt;
        if (e.electro > 0) e.electro -= dt;
        if (e.congelado > 0) {
          e.congelado -= dt;
          e.helado = Math.max(e.helado, Math.min(e.congelado, 4));
        }
        // la lluvia y el agua empapan; la lluvia apaga el fuego antes
        if (ll || W.sueloEn(e.x, e.y) === 1) e.mojado = Math.max(e.mojado || 0, 1.5);
        if (ll && e.quema > 0) e.quema -= dt;
        const n = (e.quema > 0) + (e.helado > 1.2 && !(e.congelado > 0)) + (e.mojado > 0) + (e.electro > 0);
        if (n >= 2) {
          mirar(e);
          alguna = true;
        }
      }
      if (alguna && !st.ayuda) {
        st.ayuda = true;
        HUD.aviso(t("el.ayuda"), "#FFD98A", t("el.ayuda_t"));
      }
    },
    // congelada: el próximo golpe la quiebra
    modDano(dano, e) {
      if (!e || !(e.congelado > 0)) return dano;
      e.congelado = 0;
      e.helado = 0;
      A.textoFlotante(e.x, e.y - (e.d.barra || 80) - 40, t("el.quiebra"), "#C8F2F4");
      fxs.push({ tipo: "esquirlas", x: e.x, y: e.y - 40, t: 0, dur: 0.5, col: "#C8F2F4", n: 9 });
      return dano * 1.6;
    },
    cercanos(dar) {
      if (J.dentro || jug.muerto) return;
      const rc = roble.cosa,
        dr = Math.hypot(rc.x - jug.x, rc.y - jug.y);
      if (dr < CERCA + 60 && !prueba) {
        if (st.roble) dar(dr, t("el.roble"), () => HUD.aviso(t("el.roble_tomado"), TRUENO), rc.x, rc.y - 150);
        else dar(dr, t("el.llamar"), empezarPrueba, rc.x, rc.y - 150);
      }
      if (!fuente) return;
      const fc = fuente.cosa,
        df = Math.hypot(fc.x - jug.x, fc.y - jug.y);
      if (df < CERCA + 40) {
        if (st.fuente) dar(df, t("el.fuente"), () => HUD.aviso(t("el.fuente_tomada"), AGUA), fc.x, fc.y - 150);
        else if (fc.o.viva) dar(df, t("el.beber"), beber, fc.x, fc.y - 150);
        else dar(df, t("el.mirar_fuente"), () => HUD.aviso(t("el.fuente_seca", [st.piedras.filter(Boolean).length]), AGUA, t("el.fuente")), fc.x, fc.y - 150);
      }
      fuente.piedras.forEach((p, i) => {
        if (st.piedras[i]) return;
        const d = Math.hypot(p.x - jug.x, p.y - jug.y);
        if (d < 110) dar(d, t("el.tocar_piedra"), () => tocarPiedra(i), p.x, p.y - 80);
      });
    },
    luces(dar) {
      if (J.dentro) return;
      if (!st.roble) dar({ x: roble.cosa.x, y: roble.cosa.y - 60, r: prueba ? 260 : 120, col: TRUENO, f: prueba ? 0.7 : 0.35 });
      if (fuente && fuente.cosa.o.viva && !st.fuente) dar({ x: fuente.cosa.x, y: fuente.cosa.y - 60, r: 140, col: AGUA, f: 0.45 });
    },
    sobreLuz(c) {
      if (J.dentro) return;
      for (const e of A.enemigos) {
        if (!e.activo || e.muerto || Math.abs(e.x - jug.x) > 1400 || Math.abs(e.y - jug.y) > 900) continue;
        if (e.mojado > 0 || e.electro > 0 || e.congelado > 0) dibujarEstados(c, e);
      }
      for (const f of fxs) dibujarFx(c, f);
    },
    marcasMapa() {
      const l = [{ tipo: "altar", x: roble.cosa.x, y: roble.cosa.y, op: { runa: "thurisaz", col: TRUENO, apagado: st.roble, nombre: t("el.roble") } }];
      if (fuente) l.push({ tipo: "altar", x: fuente.cosa.x, y: fuente.cosa.y, op: { runa: "laguz", col: AGUA, apagado: st.fuente, nombre: t("el.fuente") } });
      return l;
    },
    celdasBolsa() {
      const n = IDS.filter((k) => st.vistas[k]).length;
      return n ? [{ id: "el_codice", icono: "el_codice", nombre: t("el.codice"), col: TRUENO, desc: t("el.codice_bolsa", [n]), cant: n, fn: codice }] : [];
    },
    diario() {
      const n = IDS.filter((k) => st.vistas[k]).length,
        total = IDS.reduce((a, k) => a + (st.vistas[k] || 0), 0);
      const partes = [];
      if (n) partes.push(`<b>${t("el.diario_t")}</b> ${t("el.diario", [n, total])}`);
      if (!st.roble && PODERES.pj() && PODERES.pj().runas.length >= 2) partes.push(t("el.diario_roble"));
      if (!st.fuente && PODERES.pj() && PODERES.pj().runas.length >= 2) partes.push(t("el.diario_fuente"));
      return partes.length ? `<div class="diario-resumen"><p>${partes.join(" ")}</p></div>` : "";
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, roble: () => roble, fuente: () => fuente, prueba: () => prueba, reaccion, tocarPiedra, beber, empezarPrueba, codice, REACCIONES, IDS };
})();
