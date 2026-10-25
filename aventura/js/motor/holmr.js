// ---------- la hólmganga: duelos en la piel, en primera persona (sistema HOLMR) ----------
// Como los duelos de las sagas: junto al camino del Puesto a Eikholt hay una piel de buey estaqueada entre varas de
// avellano, con un banco de testigos y Hallbera, que dice la ley del hólmr. Con ella se pide pelear contra el
// siguiente de cinco kempur (campeones). El duelo no es una pelea más del bosque: se ve con los ojos de Eromash, como
// una cinemática, y se gana con precisión.
//   · Cada ataque del kempa se anuncia con su postura y pide una respuesta con un aro que se cierra: bloquear el
//     hachazo, esquivar la estocada, saltar la barrida, hacer clic justo en el blanco cuando queda abierto y machacar
//     atacar cuando traban escudos. Al cerrarse el aro es «¡Justo!» y Eromash contraataca.
//   · Cada kempa trae su rotación fija (nunca el mismo tres veces seguidas), sus escudos (dos golpes parten cada uno),
//     su aguante y cuántos errores perdona. Sin escudos ni aguante, el remate lo saca de la piel. Nadie muere.
//   · Cada kempa paga plata y experiencia; el quinto deja una pieza, un fragmento y el título «Campeón del hólmr»
//     (+5 % de daño). Después viene un retador por día (más rápido, perdona menos, paga según el nivel).
// Estado en E.extra.holmr = { vencidos, ganados, perdidos, campeon, retadorDia }. Textos `hm.`.
window.HOLMR = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const HX = 330,
    HY = 230, // medio ancho y medio alto de la piel
    GOLPES_ESCUDO = 2,
    HABLAR = 170,
    CUENTA = 3;
  // los cinco kempur, del más fácil al más difícil. ventana: segundos para responder; fallos: errores que perdona;
  // patron: su rotación (seg2/seg3 son seguidillas de ataques sin pausa)
  const KEMPUR = [
    { pal: 0, escudos: 2, toques: 3, ventana: 1.35, fallos: 3, patron: ["hachazo", "abierto", "estocada", "abierto", "barrida", "abierto"], plata: 40, xp: 60 },
    { pal: 1, escudos: 2, toques: 3, ventana: 1.15, fallos: 3, patron: ["estocada", "estocada", "abierto", "barrida", "abierto", "hachazo", "abierto"], plata: 70, xp: 90 },
    { pal: 2, escudos: 4, toques: 3, ventana: 1.2, fallos: 3, patron: ["hachazo", "traba", "abierto", "barrida", "hachazo", "abierto"], plata: 110, xp: 130 },
    { pal: 3, escudos: 2, toques: 4, ventana: 0.85, fallos: 2, patron: ["seg2", "abierto", "estocada", "barrida", "abierto"], plata: 160, xp: 180 },
    { pal: 4, escudos: 3, toques: 4, ventana: 0.9, fallos: 2, patron: ["seg3", "abierto", "hachazo", "traba", "seg2", "abierto"], plata: 250, xp: 260 },
  ];
  Object.assign(GENTE.FICHAS, {
    // Hallbera: vieja, pelo gris en trenza, capa roja oscura con broche y falda; la que dice la ley del hólmr
    hallbera: { nombre: "hallbera", alto: 0.96, ancho: 1, piel: "#E0C8B4", pielSombra: "#C0A894", pelo: "#C8C4BC", ropa: "#5E4A36", ropaSombra: "#46382A", capa: "#5E130D", capaSombra: "#46100A", pantalon: "#3A3026", botas: "#2A2018", cinto: "#FFD98A", falda: true, trenza: true },
    // los testigos, sentados en el banco
    testigo1: { nombre: "testigo", alto: 1, ancho: 1.05, piel: "#C8987A", pielSombra: "#A87A5E", pelo: "#6A4A2A", barba: "#6A4A2A", ropa: "#4E6B3A", ropaSombra: "#3A5230", pantalon: "#40362C", botas: "#2A2018", cinto: "#5E4430", sentado: true },
    testigo2: { nombre: "testigo", alto: 0.97, ancho: 0.95, piel: "#E8D0BC", pielSombra: "#C8B09C", pelo: "#B4542A", ropa: "#7A3A2A", ropaSombra: "#5E2C20", pantalon: "#3A3026", botas: "#2A2018", cinto: "#FFD98A", falda: true, sentado: true },
  });
  const base = () => ({ vencidos: 0, ganados: 0, perdidos: 0, campeon: false, retadorDia: -1 });
  let st = base();
  let C = null, // el centro de la piel
    hallbera = null,
    banco = null,
    duelo = null; // { k, ficha, fase: "cuenta"|"pelea", t, escudos, toques, fallos, mov, fin, nombre, retador }
  const dia = () => Math.floor(A.H.E.tiempo / LUZ.DIA);
  const nivelJug = () => (window.RPG ? RPG.nivel() : 1);

  // ---------- dónde: junto al camino del Puesto a Eikholt, en un claro ----------
  function buscarLugar() {
    const pu = W.LUGARES.puesto.p,
      ci = W.CIUDAD.c,
      cands = [];
    W.CAMINOS.forEach((c) => {
      if (c.sinPiso) return;
      for (let i = 0; i < c.p.length - 1; i++) {
        const a = c.p[i],
          b = c.p[i + 1],
          dx = b[0] - a[0],
          dy = b[1] - a[1],
          l = Math.hypot(dx, dy) || 1,
          k = c.w / 2 + 560;
        for (let u = 0; u < l; u += 160)
          [-1, 1].forEach((lado) => {
            const x = a[0] + (dx / l) * u + (-dy / l) * k * lado,
              y = a[1] + (dy / l) * u + (dx / l) * k * lado;
            // lo más cerca de la línea entre el Puesto y la ciudad, y a mitad de camino
            const linea = W.distLinea(x, y, [pu, ci]),
              medio = Math.abs(Math.hypot(x - pu[0], y - pu[1]) - Math.hypot(x - ci[0], y - ci[1]));
            cands.push({ x, y, s: linea + medio * 0.35 });
          });
      }
    });
    cands.sort((p, q) => p.s - q.s);
    const lejosDe = (lista, d) => (x, y) => lista.every((q) => q && Math.hypot(q[0] - x, q[1] - y) > d);
    const otros = lejosDe(
      [
        ...(window.BANDIDOS ? BANDIDOS.guaridas.map((g) => g.centro) : []),
        window.CASA && CASA.casa() ? [CASA.casa().x, CASA.casa().y] : null,
        window.ELEMENTOS && ELEMENTOS.roble() ? [ELEMENTOS.roble().cosa.x, ELEMENTOS.roble().cosa.y] : null,
        window.ELEMENTOS && ELEMENTOS.fuente() ? [ELEMENTOS.fuente().cosa.x, ELEMENTOS.fuente().cosa.y] : null,
      ],
      1200,
    );
    const despejado = (x, y) => {
      let si = true;
      // la piel, las varas, el banco de atrás y Hallbera al costado
      W.cercanas(x - HX - 260, y - HY - 300, x + HX + 260, y + HY + 200, (o) => {
        if (Math.abs(o.x - x) > HX + 260 || o.y < y - HY - 300 || o.y > y + HY + 200) return;
        if (!o.oculto && !o.arbol && o.id !== "roca" && o.id !== "troncoCaido" && (o.choque || (ASSETS.LISTA[o.id] || {}).figura)) si = false;
      });
      return si;
    };
    const ok = ({ x, y }) =>
      [[0, 0], [-HX - 60, -HY - 60], [HX + 60, -HY - 60], [HX + 60, HY + 60], [-HX - 60, HY + 60], [HX + 200, 0], [0, -HY - 200]].every(([dx, dy]) => W.sueloEn(x + dx, y + dy) === 0) &&
      Math.hypot(x - pu[0], y - pu[1]) > W.LUGARES.puesto.r + 1800 &&
      Math.hypot(x - ci[0], (y - ci[1]) * 1.3) > W.CIUDAD.rx + 1400 &&
      Object.keys(W.LUGARES).every((k) => Math.hypot(x - W.LUGARES[k].p[0], y - W.LUGARES[k].p[1]) > W.LUGARES[k].r + 900) &&
      W.CAMINOS.every((c) => W.distLinea(x, y, c.p) > c.w / 2 + HX + 80) &&
      (!window.HORDAS || HORDAS.grupos.every((g) => Math.hypot(g.centro[0] - x, g.centro[1] - y) > 1250)) &&
      !W.LAGOS.some((g) => Math.hypot(x - g.p[0], y - g.p[1]) < g.rx + 600) &&
      otros(x, y) &&
      despejado(x, y);
    const p = cands.find(ok);
    return p ? [Math.round(p.x), Math.round(p.y)] : [pu[0] + 3000, pu[1] - 600];
  }
  function armar() {
    C = buscarLugar();
    const [x, y] = C;
    // el claro: más abierto atrás, donde van el banco y Hallbera
    // (y por delante, hasta donde la copa de un árbol taparía la piel)
    W.cercanas(x - 900, y - 800, x + 900, y + HY + 800, (o) => {
      if (!o.arbol && o.id !== "roca" && o.id !== "troncoCaido") return;
      const dx = Math.abs(o.x - x),
        dy = o.y - y;
      if (Math.hypot(dx / 1.25, dy) > 600 && !(o.arbol && dx < HX + 280 && dy > 0 && dy < HY + 760)) return;
      o.oculto = true;
      o.choque = null;
    });
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b], k) => W.agregar("holmrVara", [x + a * (HX + 50), y + b * (HY + 46)], { v: k }));
    banco = W.agregar("bancoTestigos", [x - 120, y - HY - 170], {});
    hallbera = { x: x + HX + 150, y: y - 70 };
  }

  // ---------- el duelo en primera persona ----------
  // Batirse abre la piel vista con los ojos de Eromash (su lienzo propio, modo "holmr", el bosque en pausa): el kempa
  // enfrente, los testigos y Hallbera atrás, el escudo y la espada de Eromash abajo. Cada ataque del kempa se anuncia
  // con su postura y después aparece qué hacer, con un aro que se cierra:
  //   hachazo → bloquear · estocada → esquivar · barrida → saltar · abierto → clic justo donde se ve el blanco (con
  //   mando, atacar) · traba (escudo contra escudo) → atacar muchas veces seguidas.
  // Apretar cuando el aro llega al círculo es «¡Justo!» (contraataque); antes de tiempo, otra tecla o tarde, el golpe
  // entra. Con los escudos partidos y sin aguante, el remate lo saca de la piel. Tantos golpes recibidos como su
  // `fallos` y Eromash se rinde.
  const DEF = { hachazo: "bloquear", estocada: "esquivar", barrida: "saltar" };
  const PIDE = { hachazo: "bloquear", estocada: "esquivar", barrida: "saltar", abierto: "clic", traba: "machacar", remate: "machacar" };
  const BLANCOS = [[-58, -420], [36, -170], [0, -470], [-30, -260]]; // dónde puede quedar abierto (desde sus pies)
  const KX = 800,
    KY = 790,
    KS = 4.6; // el kempa en el lienzo: pies y escala
  let lienzo = null,
    c = null,
    clic = null, // el último toque del puntero: { x, y, toque }
    vista = { x: 0, y: 0, vx: 0, vy: 0 }; // lo que se corre la vista al esquivar o saltar
  function crearLienzo() {
    if (lienzo) return;
    lienzo = document.createElement("canvas");
    lienzo.id = "holmrLienzo";
    lienzo.className = "ui";
    lienzo.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:60;touch-action:none;display:none;cursor:crosshair";
    document.body.appendChild(lienzo);
    c = lienzo.getContext("2d");
    lienzo.addEventListener("pointerdown", (e) => {
      if (!duelo || e.button > 0) return;
      e.preventDefault();
      const r = lienzo.getBoundingClientRect(),
        k = Math.min(r.width / 1600, r.height / 900);
      clic = { x: (e.clientX - r.left - (r.width - 1600 * k) / 2) / k, y: (e.clientY - r.top - (r.height - 900 * k) / 2) / k, toque: e.pointerType === "touch" };
    });
  }
  function siguiente() {
    if (st.vencidos < KEMPUR.length) return { k: st.vencidos, ficha: KEMPUR[st.vencidos], nombre: t("hm.k" + st.vencidos), titulo: t("hm.kempa_t"), plata: KEMPUR[st.vencidos].plata, xp: KEMPUR[st.vencidos].xp, retador: false };
    if (st.retadorDia === dia()) return null;
    const r = dia() % KEMPUR.length,
      f = Object.assign({}, KEMPUR[(r + 2) % KEMPUR.length]);
    f.toques += 1;
    f.ventana *= 0.9;
    f.fallos = 2;
    f.pal = r;
    return { k: "r", ficha: f, nombre: t("hm.r" + r), titulo: t("hm.retador_t"), plata: 50 + 8 * nivelJug(), xp: 120 + 10 * nivelJug(), retador: true };
  }
  const hayPelea = () => A.enemigos.some((e) => e.activo && !e.muerto && (e.estado === "persigue" || e.aviso) && Math.hypot(e.x - jug.x, e.y - jug.y) < 1400);
  function hablar() {
    if (duelo) return;
    if (window.INVENTARIO && INVENTARIO.abierta()) INVENTARIO.cerrar();
    const s = siguiente();
    let sub;
    const ops = [];
    if (s) {
      sub = `<div class="sub">${t(s.retador ? "hm.retador_hoy" : "hm.siguiente", [s.nombre])}</div>` + (s.retador ? "" : `<p>${t("hm.k" + s.k + "_d")}</p>`) + `<p class="hm-premio">${t("hm.premio", [s.plata])}</p>`;
      ops.push({ texto: t("hm.batirse"), fn: () => (A.cerrarMenu(), empezar()) });
    } else sub = `<div class="sub">${t("hm.todos")}</div><p>${t("hm.retador_no")}</p>`;
    ops.push({ texto: t("hm.ahora_no"), fn: A.cerrarMenu });
    const g = CONTROLES.glifo;
    A.menu(`<h2>${t("hm.titulo")}</h2><p>${t("hm.reglas")}</p><p class="hm-reglas">${t("hm.reglas_cortas", [g("bloquear"), g("esquivar"), g("saltar"), g("atacar")])}</p>${sub}`, ops);
  }
  function empezar() {
    if (duelo) return false;
    const s = siguiente();
    if (!s) return false;
    if (hayPelea()) return HUD.aviso(t("hm.en_pelea"), "#C8402D"), false;
    crearLienzo();
    jug.x = C[0] - 200;
    jug.y = C[1];
    jug.dir = [1, 0];
    jug.hp = jug.hpMax;
    const f = s.ficha;
    duelo = Object.assign(s, { fase: "cuenta", t: 0, escudos: f.escudos, golpesEsc: 0, toques: f.toques, fallos: 0, i: 0, mov: null, cola: [], fin: null, ultCuenta: 0, kempa: { herido: 0, tambalea: 0, embiste: 0 }, sacude: 0, rojo: 0, tajo: 0, escudo: 0, msg: null, modoAntes: J.modo === "menu" ? "juego" : J.modo });
    J.modo = "holmr";
    lienzo.style.display = "block";
    clic = null;
    vista = { x: 0, y: 0, vx: 0, vy: 0 };
    if (window.SONIDO) SONIDO.tocar("rugido", { vol: 0.35, tono: 1.4 });
    return true;
  }
  // el próximo ataque de la rotación (o el que sigue de una seguidilla)
  function nuevoMov() {
    const d = duelo,
      f = d.ficha;
    let tipo, rapido = false;
    if (d.escudos <= 0 && d.toques <= 0) tipo = "remate";
    else if (d.cola.length) (tipo = d.cola.shift()), (rapido = true);
    else {
      tipo = f.patron[d.i++ % f.patron.length];
      const m = /^seg(\d)$/.exec(tipo);
      if (m) {
        const tipos = ["hachazo", "estocada", "barrida"];
        d.cola = Array.from({ length: +m[1] }, (_, k) => tipos[(d.i + k) % 3]);
        tipo = d.cola.shift();
      }
    }
    const pide = PIDE[tipo],
      mash = pide === "machacar",
      b = BLANCOS[(d.i * 7 + d.fallos) % BLANCOS.length];
    d.mov = {
      tipo,
      pide,
      fase: "aviso",
      t: 0,
      aviso: rapido ? 0.2 : Math.max(0.3, Math.min(0.75, f.ventana * 0.5)),
      ventana: mash ? (tipo === "remate" ? 2.6 : f.ventana * 2.2) : f.ventana,
      n: mash ? (tipo === "remate" ? 8 : 6) : 1,
      hechos: 0,
      // dónde aparece el aviso
      x: tipo === "abierto" ? KX + b[0] : tipo === "hachazo" ? KX + 90 : mash ? KX + 300 : KX,
      y: tipo === "abierto" ? KY + b[1] : tipo === "hachazo" ? KY - 470 : tipo === "barrida" ? KY - 40 : mash ? KY - 330 : KY - 300,
      r: 46,
    };
  }
  // un golpe que entra al kempa: primero parte escudos (dos por escudo), después baja su aguante
  function pegar(n) {
    const d = duelo;
    for (let k = 0; k < n; k++) {
      if (d.escudos > 0) {
        if (++d.golpesEsc >= GOLPES_ESCUDO) {
          d.golpesEsc = 0;
          d.escudos--;
          d.msg = { txt: t(d.escudos ? "hm.partido" : "hm.sin_escudos"), col: "#FFD98A", t: 0 };
          d.sacude = Math.max(d.sacude, 0.3);
          if (window.SONIDO) SONIDO.tocar("golpe", { vol: 0.8, tono: 0.7 });
        }
      } else if (d.toques > 0) d.toques--;
    }
    d.kempa.herido = 0.3;
    d.kempa.tambalea = 0.5;
  }
  // lo que hizo el jugador con el aviso de ahora: "bloquear", "esquivar", "saltar", "atacar" o "clic" (con x, y)
  function responder(accion, x, y, toque) {
    const d = duelo,
      m = d && d.mov;
    if (!m || m.fase !== "ventana" || d.fin) return;
    // con el dedo, tocar el aviso es hacer lo que pide
    if (toque && accion === "clic" && Math.hypot(x - m.x, y - m.y) < 110) accion = m.pide === "clic" ? "clic" : m.pide === "machacar" ? "atacar" : m.pide;
    if (m.pide === "machacar") {
      if (accion !== "atacar" && accion !== "clic") return;
      m.hechos++;
      d.tajo = 0.18;
      d.kempa.herido = 0.12;
      if (window.SONIDO) SONIDO.tocar("golpe", { vol: 0.4, tono: 1.2 + m.hechos * 0.05 });
      if (m.hechos >= m.n) resolver("justo");
      return;
    }
    const k = m.t / m.ventana;
    let bien;
    // con mouse hay que darle al blanco; con mando, atacar
    if (m.pide === "clic") bien = (accion === "clic" && Math.hypot(x - m.x, y - m.y) <= m.r + 14) || (accion === "atacar" && CONTROLES.mando());
    else bien = accion === m.pide;
    if (!bien) return resolver(m.pide === "clic" && accion === "clic" ? "lejos" : "otra");
    if (k < 0.3) return resolver("apurado");
    resolver(k >= 0.72 ? "justo" : "bien");
  }
  function resolver(res) {
    const d = duelo,
      m = d.mov,
      ok = res === "justo" || res === "bien";
    m.fase = "res";
    m.res = res;
    m.t = 0;
    const textos = { justo: "hm.justo", bien: "hm.bien", apurado: "hm.apurado", tarde: "hm.tarde", otra: "hm.otra", lejos: "hm.lejos_blanco" };
    d.msg = { txt: t(textos[res]), col: res === "justo" ? "#FFD98A" : ok ? "#7BC86C" : "#C8402D", t: 0 };
    if (ok) {
      if (m.tipo === "remate") return ganar();
      if (m.tipo === "abierto") pegar(res === "justo" ? 2 : 1);
      else if (m.tipo === "traba") pegar(1);
      else if (res === "justo") pegar(1); // el contraataque
      if (m.pide === "bloquear") d.escudo = 0.45;
      if (m.pide === "esquivar") vista.vx = (d.i % 2 ? 1 : -1) * 900;
      if (m.pide === "saltar") vista.vy = 700;
      if (m.pide === "clic" || res === "justo") d.tajo = 0.3;
      if (window.SONIDO) SONIDO.tocar(m.pide === "bloquear" ? "golpe" : m.pide === "esquivar" ? "tela" : m.pide === "saltar" ? "caida" : "tajo", { vol: 0.6, tono: res === "justo" ? 1.2 : 1 });
      if (res === "justo") d.lento = 0.25;
    } else {
      if (m.tipo === "remate") {
        // se rehace con un último aguante
        d.toques = 1;
        d.msg = { txt: t("hm.se_rehace"), col: "#C8402D", t: 0 };
        return;
      }
      d.fallos++;
      d.kempa.embiste = 0.35;
      d.rojo = 0.5;
      d.sacude = 0.4;
      if (window.SONIDO) SONIDO.tocar("herida", { vol: 0.6 });
      if (d.fallos >= d.ficha.fallos) d.fin = { gano: false, porque: "rinde", t: 0 };
    }
  }
  function ganar() {
    const d = duelo;
    d.kempa.fuera = 0.001;
    d.fin = { gano: true, porque: "fuera", t: 0 };
    if (window.SONIDO) SONIDO.tocar("rugido", { vol: 0.3, tono: 0.8 });
  }
  // cada cuadro, mientras dura el duelo (J.modos.holmr)
  function paso(dt) {
    const d = duelo;
    if (!d) return;
    if (d.lento > 0) (d.lento -= dt), (dt *= 0.35);
    d.t += dt;
    ["sacude", "rojo", "tajo", "escudo"].forEach((k) => (d[k] = Math.max(0, d[k] - dt)));
    ["herido", "tambalea", "embiste"].forEach((k) => (d.kempa[k] = Math.max(0, d.kempa[k] - dt)));
    if (d.kempa.fuera) d.kempa.fuera += dt;
    if (d.msg) d.msg.t += dt;
    // la vista vuelve sola después de esquivar o saltar
    vista.x += vista.vx * dt;
    vista.y += vista.vy * dt;
    vista.vx = vista.vx * Math.pow(0.02, dt) - vista.x * 40 * dt;
    vista.vy = vista.vy * Math.pow(0.02, dt) - vista.y * 40 * dt;
    if (d.fin) {
      d.fin.t += dt;
      if (d.fin.t > 1.4 && (CONTROLES.recien("interactuar") || CONTROLES.recien("seguir") || CONTROLES.recien("atacar") || clic)) cerrar();
      clic = null;
      return dibujar();
    }
    if (CONTROLES.recien("pausa")) {
      d.fin = { gano: false, porque: "lejos", t: 9 };
      return cerrar();
    }
    if (d.fase === "cuenta") {
      const n = CUENTA - Math.floor(d.t);
      if (n !== d.ultCuenta && window.SONIDO) SONIDO.tocar("clic", { vol: 0.4, tono: n > 0 ? 1 : 1.5 });
      d.ultCuenta = n;
      if (d.t >= CUENTA + 0.5) {
        d.fase = "pelea";
        d.t = 0;
        nuevoMov();
      }
      clic = null;
      return dibujar();
    }
    const m = d.mov;
    m.t += dt;
    if (m.fase === "aviso" && m.t >= m.aviso) {
      m.fase = "ventana";
      m.t = 0;
    } else if (m.fase === "ventana") {
      const p = clic;
      clic = null;
      if (p) responder("clic", p.x, p.y, p.toque);
      else ["bloquear", "esquivar", "saltar", "atacar"].forEach((a) => duelo.mov === m && m.fase === "ventana" && CONTROLES.recien(a) && responder(a));
      if (m.fase === "ventana" && m.t >= m.ventana) resolver("tarde");
    } else if (m.fase === "res" && m.t >= (m.res === "justo" || m.res === "bien" ? 0.55 : 0.85) && !d.fin) nuevoMov();
    clic = null;
    dibujar();
  }
  function cerrar() {
    const d = duelo;
    if (!d) return;
    lienzo.style.display = "none";
    J.modo = d.modoAntes || "juego";
    CONTROLES.soltar && CONTROLES.soltar();
    const f = d.fin || { gano: false, porque: "lejos" };
    terminar(f.gano, f.porque);
  }
  function terminar(gano, porque) {
    const d = duelo;
    if (!d) return;
    duelo = null;
    if (lienzo && lienzo.style.display !== "none") {
      lienzo.style.display = "none";
      J.modo = d.modoAntes || "juego";
    }
    if (porque === "lejos") return HUD.aviso(t("hm.lejos"), "#8E8A86");
    if (gano) {
      st.ganados++;
      jug.hp = jug.hpMax;
      PODERES.darPlata(d.plata);
      if (window.RPG) RPG.dar(d.xp, C[0], C[1]);
      if (window.SONIDO) SONIDO.tocar("mision", { vol: 0.6 });
      HUD.aviso(t("hm.gano_fuera", [d.nombre]), "#7BC86C", t("hm.gano_t"));
      if (d.retador) st.retadorDia = dia();
      else {
        st.vencidos = Math.max(st.vencidos, d.k + 1);
        if (st.vencidos >= KEMPUR.length && !st.campeon) {
          st.campeon = true;
          if (window.RPG) RPG.recalcular();
          PODERES.darFragmento();
          if (window.BOTIN && window.OBJETOS) J.retrasar(1.2, () => BOTIN.tirar(C[0], C[1], OBJETOS.generar({ n: nivelJug(), min: 3, hallazgo: 2 }), true));
          J.retrasar(2.6, () => HUD.aviso(t("hm.campeon_d"), "#FFD98A", t("hm.campeon")));
        }
      }
      if (window.VIDA) VIDA.evento("mision", C[0], C[1]);
      if (window.ANIMA) ANIMA.gesto("feliz");
    } else {
      st.perdidos++;
      jug.hp = Math.max(Math.round(jug.hpMax * 0.4), Math.min(jug.hp, jug.hpMax));
      HUD.aviso(t("hm.perdio_rinde"), "#C8402D", t("hm.perdio_t"));
    }
  }

  // ---------- el dibujo (1600 × 900, en primera persona) ----------
  const P = (pts, col) => DIB.P(c, pts, col);
  function texto(s, x, y, tam, col, al = "center", fuente = "Eromash Display", borde = true) {
    c.font = `800 ${tam}px "${fuente}", system-ui, sans-serif`;
    c.textAlign = al;
    if (borde) {
      c.lineWidth = Math.max(3, tam * 0.16);
      c.strokeStyle = "#111111";
      c.lineJoin = "round";
      c.strokeText(s, x, y);
    }
    c.fillStyle = col;
    c.fillText(s, x, y);
  }
  // el claro: pinos planos, el pasto, la piel en perspectiva con sus surcos, las varas, el banco y Hallbera
  function fondo(T) {
    const noche = A.noche() > 0.5;
    P([0, 0, 1600, 0, 1600, 470, 0, 470], noche ? "#141C24" : "#2E4A56");
    P([0, 300, 1600, 300, 1600, 470, 0, 470], noche ? "#18221C" : "#3E5A44");
    // pinos del borde del claro: caras planas, la mitad izquierda en sombra
    for (let i = 0; i < 14; i++) {
      const x = i * 125 - 40 + ((i * 53) % 37),
        h = 200 + ((i * 71) % 90),
        w = 60 + ((i * 29) % 24),
        y = 470;
      P([x, y, x + w / 2, y - h, x + w, y], noche ? "#0E1612" : "#1E3A2A");
      P([x + w / 2, y - h, x + w, y, x + w / 2, y], noche ? "#16221A" : "#2E5A3A");
    }
    P([0, 470, 1600, 470, 1600, 900, 0, 900], noche ? "#1E2A1C" : "#4E6B3A");
    // la piel: de los surcos del fondo a los de adelante
    P([480, 500, 1120, 500, 1500, 900, 100, 900], "#7A5634");
    P([800, 500, 1120, 500, 1500, 900, 800, 900], "#8A6A44");
    c.strokeStyle = "#3A2A1C";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(480, 500);
    c.lineTo(1120, 500);
    c.lineTo(1500, 900);
    c.moveTo(480, 500);
    c.lineTo(100, 900);
    c.stroke();
    // las varas de avellano de las esquinas de atrás
    [[470, 500], [1130, 500]].forEach(([x, y]) => {
      P([x - 6, y, x - 6, y - 150, x + 6, y - 152, x + 6, y], "#5E4630");
      P([x, y - 150, x + 6, y - 152, x + 6, y, x, y], "#7A5C3E");
    });
    // el banco de los testigos y Hallbera, chicos al fondo
    P([250, 470, 420, 470, 420, 455, 250, 455], "#5E4630");
    if (window.GENTE) {
      const salta = Math.abs(Math.sin(T * 6)) * 3;
      GENTE.dibujar(c, "testigo1", 300, 452 - salta, T, { vista: "S", s: 0.75 });
      GENTE.dibujar(c, "testigo2", 370, 452 - Math.abs(Math.sin(T * 6 + 1)) * 3, T, { vista: "S", s: 0.75 });
      GENTE.dibujar(c, "hallbera", 1260, 480, T, { vista: "S", s: 0.8 });
    }
  }
  function kempa(T) {
    const d = duelo,
      m = d.mov,
      kp = d.kempa,
      f = d.ficha;
    let x = KX,
      y = KY,
      s = KS,
      rot = 0,
      golpe = 0,
      sy = 1;
    // la postura que anuncia cada ataque
    if (m && d.fase === "pelea" && !d.fin) {
      const a = m.fase === "aviso" ? Math.min(1, m.t / m.aviso) : m.fase === "ventana" ? 1 : 0;
      if (m.tipo === "hachazo") (golpe = a), (rot = -0.06 * a);
      if (m.tipo === "estocada") (golpe = 0.5 * a), (s *= 1 + 0.08 * a), (x += 40 * a);
      if (m.tipo === "barrida") (sy = 1 - 0.12 * a), (rot = 0.1 * a), (golpe = 0.6 * a);
      if (m.tipo === "traba" || m.tipo === "remate") (s *= 1 + 0.22 * a), (y += 60 * a);
      if (m.tipo === "abierto") rot = 0.1 * Math.sin(T * 8) * a;
    }
    if (kp.embiste > 0) (s *= 1 + kp.embiste * 0.5), (y += kp.embiste * 120);
    if (kp.tambalea > 0) (rot += Math.sin(kp.tambalea * 30) * 0.05), (x += Math.sin(kp.tambalea * 30) * 10);
    // sacado de la piel: retrocede, trastabilla y cae del otro lado de los surcos
    if (kp.fuera) {
      const u = Math.min(1, kp.fuera / 0.9);
      s *= 1 - 0.45 * u;
      y -= 210 * u;
      rot = -0.5 * u;
    }
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.scale(1, sy);
    // siempre de frente, aunque la cámara del bosque esté girada
    const g0 = window.VOL ? VOL.cam.g : 0;
    if (window.VOL) VOL.cam.g = 0;
    CRIATURAS.dibujar(c, "kempa", 0, 0, T, { vista: "S", pal: f.pal, golpe, escudo: d.escudos > 0 ? 1 : 0, s, herido: kp.herido, mov: 0 });
    if (window.VOL) VOL.cam.g = g0;
    c.restore();
  }
  // lo de Eromash: el escudo abajo a la izquierda y la espada a la derecha
  function manos(T) {
    const d = duelo,
      bob = Math.sin(T * 2) * 6,
      esc = d.escudo > 0 ? Math.sin((d.escudo / 0.45) * Math.PI) : 0;
    KEMPUR_DIBUJO.escudo(c, 240 + esc * 420, 900 + bob - esc * 230, 190 + esc * 60, { esc: "#9C2315", escS: "#5E130D", marca: "#FFD98A" }, 1);
    // la espada: de la empuñadura abajo a la punta, que barre la pantalla al pegar
    const sw = d.tajo > 0 ? 1 - d.tajo / 0.3 : 0;
    c.save();
    c.translate(1330, 940 + bob);
    c.rotate(-0.35 - sw * 1.6);
    P([-14, -60, 14, -60, 9, -560, 0, -600, -9, -560], "#B8B4AE");
    P([0, -600, 9, -560, 14, -60, 0, -60], "#E8E4DC");
    P([-70, -70, 70, -70, 70, -46, -70, -46], "#5E4630");
    P([-12, -46, 12, -46, 12, 60, -12, 60], "#3A2A1C");
    c.restore();
    if (d.tajo > 0 && sw > 0.1) DIB.alfa(c, d.tajo / 0.3, () => P([300, 300 + sw * 100, 1400, 420 - sw * 80, 1380, 470 - sw * 80, 320, 340 + sw * 100], "#F2ECEC"));
  }
  // el aviso de qué hacer: el glifo de la acción en un rombo y el aro que se cierra hasta el momento justo
  function aviso(T) {
    const d = duelo,
      m = d.mov;
    if (!m || m.fase !== "ventana" || d.fin) return;
    const k = Math.min(1, m.t / m.ventana),
      g = CONTROLES.glifo,
      mash = m.pide === "machacar";
    if (m.pide === "clic") {
      // el blanco donde quedó abierto
      const pul = 1 + Math.sin(T * 14) * 0.05;
      c.strokeStyle = "#FFD98A";
      c.lineWidth = 6;
      c.beginPath();
      c.arc(m.x, m.y, m.r * pul, 0, DIB.TAU);
      c.stroke();
      P([m.x - 10, m.y, m.x, m.y - 10, m.x + 10, m.y, m.x, m.y + 10], "#FFD98A");
    } else {
      const r = 58;
      P([m.x, m.y - r, m.x + r, m.y, m.x, m.y + r, m.x - r, m.y], "#111111");
      P([m.x, m.y - r + 8, m.x + r - 8, m.y, m.x, m.y + r - 8], mash ? "#9C2315" : "#3A2A26");
      texto(mash ? g("atacar") : g(m.pide), m.x, m.y + 13, String(g(m.pide)).length > 2 ? 22 : 38, "#F2ECEC", "center", "Eromash Text", false);
    }
    if (!mash) {
      // el aro: grande al aparecer, sobre el círculo en el momento justo
      const R = m.r + 10 + (1 - Math.min(1, k / 0.86)) * 170;
      c.strokeStyle = k >= 0.72 ? "#FFD98A" : k >= 0.3 ? "#7BC86C" : "#E0B2B2";
      c.lineWidth = 4;
      c.beginPath();
      c.arc(m.x, m.y, R, 0, DIB.TAU);
      c.stroke();
    } else {
      // cuántos golpes faltan y el tiempo
      for (let i = 0; i < m.n; i++) P([m.x - (m.n - 1) * 15 + i * 30 - 9, m.y + 90, m.x - (m.n - 1) * 15 + i * 30, m.y + 81, m.x - (m.n - 1) * 15 + i * 30 + 9, m.y + 90, m.x - (m.n - 1) * 15 + i * 30, m.y + 99], i < m.hechos ? "#FFD98A" : "#3A2A26");
      DIB.R(c, m.x - 120, m.y + 112, 240 * (1 - k), 8, "#C8402D");
    }
    const dice = { bloquear: "hm.pide_bloquear", esquivar: "hm.pide_esquivar", saltar: "hm.pide_saltar", clic: "hm.pide_clic", machacar: m.tipo === "remate" ? "hm.pide_remate" : "hm.pide_traba" }[m.pide];
    texto(t(dice, [g("atacar")]), m.x, m.y - (m.pide === "clic" ? m.r + 26 : 80), 34, mash || m.pide === "clic" ? "#FFD98A" : "#F2ECEC");
  }
  function hud(T) {
    const d = duelo,
      f = d.ficha;
    // el kempa: nombre, escudos y aguante
    texto(d.nombre, 800, 60, 34, "#FFD98A");
    texto(d.titulo, 800, 88, 16, "#E0B2B2", "center", "Eromash Text", false);
    const n = f.escudos + f.toques;
    for (let i = 0; i < n; i++) {
      const x = 800 - (n - 1) * 26 + i * 52,
        y = 122;
      if (i < f.escudos) KEMPUR_DIBUJO.escudo(c, x, y, 16, KEMPUR_DIBUJO.PAL[f.pal % 5], i < d.escudos ? 1 : 0);
      else P([x - 12, y, x, y - 12, x + 12, y, x, y + 12], i - f.escudos < d.toques ? "#C8402D" : "#3A2A26");
    }
    // el aguante de Eromash: lo que todavía puede recibir
    texto(t("hm.aguante"), 800, 828, 15, "#E0B2B2", "center", "Eromash Text", false);
    for (let i = 0; i < f.fallos; i++) {
      const x = 800 - (f.fallos - 1) * 22 + i * 44;
      P([x - 14, 856, x, 842, x + 14, 856, x, 870], i < f.fallos - d.fallos ? "#9C2315" : "#3A2A26");
    }
    // abajo, recordatorio de las teclas
    const g = CONTROLES.glifo;
    texto(t("hm.teclas", [g("bloquear"), g("esquivar"), g("saltar"), g("atacar")]), 800, 892, 14, "#8A8080", "center", "Eromash Text", false);
  }
  function dibujar() {
    const d = duelo,
      T = J.t + d.t,
      r = lienzo.getBoundingClientRect(),
      dpr = Math.min(2, window.devicePixelRatio || 1);
    if (lienzo.width !== Math.round(r.width * dpr)) (lienzo.width = Math.round(r.width * dpr)), (lienzo.height = Math.round(r.height * dpr));
    const k = Math.min(lienzo.width / 1600, lienzo.height / 900);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#111111";
    c.fillRect(0, 0, lienzo.width, lienzo.height);
    const sx = d.sacude > 0 && (!window.OPCIONES || OPCIONES.v("temblor") !== false) ? (Math.random() - 0.5) * 30 * d.sacude : 0,
      sy = d.sacude > 0 ? (Math.random() - 0.5) * 30 * d.sacude : 0,
      zoom = d.lento > 0 ? 1.04 : 1;
    c.setTransform(k * zoom, 0, 0, k * zoom, (lienzo.width - 1600 * k * zoom) / 2 + sx * k, (lienzo.height - 900 * k * zoom) / 2 + sy * k);
    c.save();
    c.translate(-vista.x * 0.3, vista.y * 0.3);
    fondo(T);
    kempa(T);
    c.restore();
    aviso(T);
    manos(T);
    // el golpe recibido: el borde se tiñe de rojo
    if (d.rojo > 0) DIB.alfa(c, d.rojo, () => {
      c.strokeStyle = "#C8402D";
      c.lineWidth = 60;
      c.strokeRect(0, 0, 1600, 900);
    });
    hud(T);
    if (d.fase === "cuenta") {
      const n = CUENTA - Math.floor(d.t);
      texto(n > 0 ? String(n) : t("hm.ya"), 800, 440, n > 0 ? 140 : 90, n > 0 ? "#F2ECEC" : "#FF8D71");
      if (d.t < 1.4) texto(t("hm.intro"), 800, 560, 22, "#E0B2B2", "center", "Eromash Text");
    }
    if (d.msg && d.msg.t < 0.8) DIB.alfa(c, 1 - d.msg.t / 0.8, () => texto(d.msg.txt, 800, 300 - d.msg.t * 40, 52, d.msg.col));
    if (d.fin) {
      DIB.alfa(c, Math.min(0.7, d.fin.t), () => P([0, 340, 1600, 340, 1600, 560, 0, 560], "#111111"));
      texto(t(d.fin.gano ? "hm.gano_t" : "hm.perdio_t"), 800, 450, 64, d.fin.gano ? "#FFD98A" : "#C8402D");
      texto(t(d.fin.gano ? "hm.gano_fuera" : "hm.perdio_rinde", [d.nombre]), 800, 500, 22, "#F2ECEC", "center", "Eromash Text", false);
      if (d.fin.t > 1.4) texto(t("hm.seguir", [CONTROLES.glifo("interactuar")]), 800, 540, 16, "#E0B2B2", "center", "Eromash Text", false);
    }
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      armar();
      J.modos = J.modos || {};
      J.modos.holmr = paso;
      if (window.INVENTARIO && INVENTARIO.iconoDe) INVENTARIO.iconoDe("hm_escudo", (c) => KEMPUR_DIBUJO.escudo(c, 0, 0, 24, KEMPUR_DIBUJO.PAL[4], 1));
      if (window.RPG) RPG.aporte((s) => st.campeon && (s.dano *= 1.05), "holmr");
    },
    alEmpezar(extra) {
      if (duelo) terminar(false, "lejos");
      extra.holmr = Object.assign(base(), extra.holmr || {});
      st = extra.holmr;
    },
    actualizar() {
      if (duelo && J.dentro) terminar(false, "lejos");
    },
    cercanos(dar) {
      if (J.dentro || jug.muerto || duelo || !hallbera) return;
      const d = Math.hypot(hallbera.x - jug.x, hallbera.y - jug.y);
      if (d < HABLAR) dar(d, t("hm.hablar"), hablar, hallbera.x, hallbera.y - 120);
    },
    fondo(c, x0, y0, x1, y1) {
      if (J.dentro || !C || C[0] + HX + 80 < x0 || C[0] - HX - 80 > x1 || C[1] + HY + 80 < y0 || C[1] - HY - 80 > y1) return;
      HOLMR_DIBUJO.holmrPiel(c, C[0], C[1], J.t, { ax: HX, ay: HY });
    },
    objetos(lista, visible, c) {
      if (J.dentro || !C) return;
      if (visible(hallbera.x, hallbera.y)) {
        const mira = jug.x < hallbera.x ? "E" : "S";
        lista.push({ x: hallbera.x, y: hallbera.y, f: () => GENTE.dibujar(c, "hallbera", hallbera.x, hallbera.y, J.t, { vista: mira, espejo: true }) });
      }
      if (banco && visible(banco.x, banco.y))
        [["testigo1", -40], ["testigo2", 30]].forEach(([id, dx]) => {
          const bx = banco.x + dx;
          lista.push({ x: bx, y: banco.y + 2, f: () => GENTE.dibujar(c, id, bx, banco.y - 36, J.t, { vista: "S" }) });
        });
    },
    marcasMapa() {
      return C ? [{ tipo: "holmr", x: C[0], y: C[1], op: { nombre: t("hm.lugar"), apagado: st.campeon && st.retadorDia === dia() } }] : [];
    },
    celdasBolsa() {
      return st.ganados || st.perdidos ? [{ id: "hm_duelos", icono: "hm_escudo", nombre: t(st.campeon ? "hm.campeon" : "hm.bolsa"), col: "#FFD98A", desc: t("hm.bolsa_d", [st.ganados, st.perdidos, st.vencidos]), cant: st.vencidos }] : [];
    },
    diario() {
      if (!st.ganados && !st.perdidos) return `<div class="diario-resumen"><p>${t("hm.diario_nada")}</p></div>`;
      return `<div class="diario-resumen"><p><b>${t("hm.diario_t")}</b> ${t("hm.diario", [st.vencidos, st.ganados])}${st.campeon ? " " + t("hm.campeon") + "." : ""}</p></div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, centro: () => C, hallbera: () => hallbera, duelo: () => duelo, siguiente, hablar, empezar, terminar, paso, responder, cerrar, KEMPUR, PIDE, HX, HY };
})();
