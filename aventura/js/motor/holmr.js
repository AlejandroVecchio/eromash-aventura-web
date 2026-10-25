// ---------- la hólmganga: duelos en la piel (sistema HOLMR) ----------
// Como los duelos de las sagas (y los torneos del Fable y las arenas del Oblivion): junto al camino del Puesto a
// Eikholt hay una piel de buey estaqueada entre varas de avellano, con un banco de testigos y Hallbera, que dice la ley
// del hólmr. Con ella se pide pelear contra el siguiente de cinco kempur (campeones), cada uno con su manera:
//   · Cada kempa trae sus escudos (ESCUDOS). Mientras se cubre (camina hacia Eromash), un golpe pega un cuarto y suma
//     uno a partir el escudo (tres golpes lo parten); mientras avisa su ataque o se recupera queda abierto y el golpe
//     pega entero. Sin escudos todo pega entero y el remate lo empuja fuerte (se lo puede sacar de la piel).
//   · Rotación fija de ataques (e.patron de combate.js, nunca el mismo tres veces), aviso exacto en el piso, saltar
//     evita todo y el tope del 35 % de siempre.
//   · Se gana si el kempa pisa fuera de los surcos o baja de su 12 % (se rinde: nadie muere en la piel). Se pierde si
//     Eromash pisa fuera sin estar saltando o baja de su 12 % (se rinde antes de caer). Al empezar los dos se curan.
//   · Cada kempa paga plata y experiencia; el quinto deja una pieza, un fragmento y el título «Campeón del hólmr»
//     (+5 % de daño). Después viene un retador por día (más duro, paga según el nivel).
//   · Skuggi (companero.js) no muerde en la piel: mira desde el borde.
// Estado en E.extra.holmr = { vencidos, ganados, perdidos, campeon, retadorDia }. Textos `hm.`.
window.HOLMR = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const M = 30;
  const HX = 330,
    HY = 230, // medio ancho y medio alto de la piel
    RINDE = 0.12,
    GOLPES_ESCUDO = 3,
    HABLAR = 170,
    CUENTA = 3;
  // los cinco kempur, del más fácil al más difícil
  const KEMPUR = [
    { pal: 0, vida: 160, dano: 10, vel: 2.4, alcance: 2.2, aviso: 0.9, radioGolpe: 2.6, angulo: 0.8, espera: 1.6, largo: 4.5, ancho: 1.4, patron: ["abanico", "abanico", "franja"], escudos: 3, plata: 40, xp: 60 },
    { pal: 1, vida: 200, dano: 13, vel: 2.3, alcance: 4.6, aviso: 0.95, radioGolpe: 3, angulo: 0.6, espera: 1.5, largo: 6.5, ancho: 1.2, patron: ["franja", "franja", "abanico"], escudos: 3, plata: 70, xp: 90 },
    { pal: 2, vida: 280, dano: 14, vel: 1.8, alcance: 2.4, aviso: 1.1, radioGolpe: 3, angulo: 0.9, espera: 1.9, largo: 5, ancho: 1.6, patron: ["circulo", "abanico", "circulo", "franja"], escudos: 5, plata: 110, xp: 130 },
    { pal: 3, vida: 220, dano: 11, vel: 3.2, alcance: 2.4, aviso: 0.65, radioGolpe: 2.6, angulo: 0.8, espera: 0.9, largo: 5, ancho: 1.3, patron: ["abanico", "franja", "abanico", "circulo"], escudos: 2, plata: 160, xp: 180 },
    { pal: 4, vida: 360, dano: 17, vel: 2.6, alcance: 3, aviso: 0.85, radioGolpe: 3.2, angulo: 0.85, espera: 1.3, largo: 6, ancho: 1.6, patron: ["circulo", "franja", "abanico", "franja", "abanico"], escudos: 3, plata: 250, xp: 260 },
  ];
  // el tipo de combate base (se ajusta a cada kempa al crearlo)
  Object.assign(COMBATE.TIPOS, {
    kempa: { vida: 160, dano: 10, vel: 2.4 * M, alcance: 2.2 * M, aviso: 0.9, forma: "abanico", radioGolpe: 2.6 * M, angulo: 0.8, radio: 18, espera: 1.6, barra: 112, plata: 0 },
  });
  if (window.MATERIALES) MATERIALES.CRIATURAS.kempa = [];
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
    duelo = null; // { k, ficha, e, fase: "cuenta"|"pelea", t, escudos, golpes, nombre, retador }
  const dia = () => Math.floor(A.H.E.tiempo / LUZ.DIA);
  const nivelJug = () => (window.RPG ? RPG.nivel() : 1);
  const dentroPiel = (x, y, m = 0) => Math.abs(x - C[0]) <= HX + m && Math.abs(y - C[1]) <= HY + m;

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
        window.COMPANERO ? COMPANERO.lugar() : null,
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

  // ---------- el duelo ----------
  function siguiente() {
    if (st.vencidos < KEMPUR.length) return { k: st.vencidos, ficha: KEMPUR[st.vencidos], nombre: t("hm.k" + st.vencidos), titulo: t("hm.kempa_t"), plata: KEMPUR[st.vencidos].plata, xp: KEMPUR[st.vencidos].xp, retador: false };
    if (st.retadorDia === dia()) return null;
    const r = dia() % KEMPUR.length,
      f = Object.assign({}, KEMPUR[(r + 2) % KEMPUR.length]);
    f.vida = Math.round(f.vida * 1.25);
    f.pal = r;
    return { k: "r", ficha: f, nombre: t("hm.r" + r), titulo: t("hm.retador_t"), plata: 50 + 8 * nivelJug(), xp: 120 + 10 * nivelJug(), retador: true };
  }
  const hayPelea = () => A.enemigos.some((e) => e.activo && !e.muerto && !e.holmr && (e.estado === "persigue" || e.aviso) && Math.hypot(e.x - jug.x, e.y - jug.y) < 1400);
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
    A.menu(`<h2>${t("hm.titulo")}</h2><p>${t("hm.reglas")}</p><p class="hm-reglas">${t("hm.reglas_cortas")}</p>${sub}`, ops);
  }
  function crearKempa(s) {
    const f = s.ficha,
      lv = nivelJug();
    const e = A.CB.crear("kempa", C[0] + 200, C[1], { pal: f.pal, lider: { unico: true, afijos: [], nombre: s.nombre, titulo: s.titulo } });
    const d = e.d;
    d.vida = Math.round(f.vida * Math.min(2.5, 1 + 0.1 * (lv - 1)));
    d.dano = Math.round(f.dano * Math.min(1.8, 1 + 0.05 * (lv - 1)));
    d.vel = f.vel * M;
    d.alcance = f.alcance * M;
    d.aviso = f.aviso;
    d.radioGolpe = f.radioGolpe * M;
    d.angulo = f.angulo;
    d.espera = f.espera;
    d.largo = f.largo * M;
    d.ancho = f.ancho * M;
    d.plata = 0;
    e.vida = d.vida;
    e.nivel = lv + (s.retador ? 3 : s.k); // ya viene ajustado al nivel: rpg.js no lo vuelve a endurecer
    e.patron = f.patron;
    e.holmr = true;
    e.grupo = [e];
    e.escudoK = 1;
    e.propio = true; // quieto hasta que termina la cuenta
    e.mira = VIKINGO.vista(-1, 0, e.mira);
    A.enemigos.push(e);
    return e;
  }
  function empezar() {
    if (duelo) return false;
    const s = siguiente();
    if (!s) return false;
    if (hayPelea()) return HUD.aviso(t("hm.en_pelea"), "#C8402D"), false;
    jug.x = C[0] - 200;
    jug.y = C[1];
    jug.dir = [1, 0];
    jug.hp = jug.hpMax;
    jug.sta = jug.staMax;
    const e = crearKempa(s);
    duelo = Object.assign(s, { e, fase: "cuenta", t: 0, escudos: s.ficha.escudos, golpes: 0, ultCuenta: 0 });
    A.textoFlotante(jug.x, jug.y - 150, t("hm.cuenta", [CUENTA]), "#FFD98A");
    if (window.SONIDO) SONIDO.tocar("rugido", { vol: 0.35, tono: 1.4, x: C[0], y: C[1] });
    return true;
  }
  function terminar(gano, porque) {
    const d = duelo,
      e = d.e;
    duelo = null;
    if (e.aviso) J.quitarAviso(e.aviso);
    e.aviso = null;
    const i = A.enemigos.indexOf(e);
    if (i >= 0) A.enemigos.splice(i, 1);
    J.jefeHud = null;
    if (porque === "lejos") return HUD.aviso(t("hm.lejos"), "#8E8A86");
    if (gano) {
      st.ganados++;
      jug.hp = jug.hpMax;
      PODERES.darPlata(d.plata);
      if (window.RPG) RPG.dar(d.xp, e.x, e.y);
      if (window.SONIDO) SONIDO.tocar("mision", { vol: 0.6 });
      HUD.aviso(t(porque === "fuera" ? "hm.gano_fuera" : "hm.gano_rinde", [d.nombre]), "#7BC86C", t("hm.gano_t"));
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
      jug.hp = Math.max(jug.hp, Math.round(jug.hpMax * 0.4));
      HUD.aviso(porque === "fuera" ? t("hm.perdio_fuera", [d.nombre]) : t("hm.perdio_rinde"), "#C8402D", t("hm.perdio_t"));
    }
  }
  function paso(dt) {
    const d = duelo,
      e = d.e;
    d.t += dt;
    if (d.fase === "cuenta") {
      const n = CUENTA - Math.floor(d.t);
      if (n !== d.ultCuenta && n > 0 && n < CUENTA) A.textoFlotante(jug.x, jug.y - 150, t("hm.cuenta", [n]), "#FFD98A");
      d.ultCuenta = n;
      if (Math.hypot(jug.x - C[0], jug.y - C[1]) > 900) return terminar(false, "lejos");
      if (d.t >= CUENTA) {
        d.fase = "pelea";
        d.t = 0;
        e.propio = false;
        e.estado = "persigue";
        e.vio = 1.1;
        A.textoFlotante(C[0], C[1] - 170, t("hm.ya"), "#FF8D71");
        J.sacudir(0.25);
      }
    } else {
      const lim = jug.hpMax * RINDE;
      if (jug.muerto || d.rinde || jug.hp <= lim + 0.5) return terminar(false, "rinde");
      if (!dentroPiel(jug.x, jug.y) && !(jug.salto > 0)) return terminar(false, "fuera");
      if (e.muerto || e.vida <= e.d.vida * RINDE) return terminar(true, "rinde");
      if (!dentroPiel(e.x, e.y, 10)) return terminar(true, "fuera");
    }
    e.escudoK = d.escudos > 0 ? 1 : 0;
  }
  // ¿pega entero? mientras avisa su ataque, se recupera o está aturdido
  const abierto = (e) => !!(e.aviso || e.estado === "aviso" || e.estado === "espera" || e.aturdido > 0);

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      armar();
      if (window.INVENTARIO && INVENTARIO.iconoDe) INVENTARIO.iconoDe("hm_escudo", (c) => KEMPUR_DIBUJO.escudo(c, 0, 0, 24, KEMPUR_DIBUJO.PAL[4], 1));
      if (window.RPG) RPG.aporte((s) => st.campeon && (s.dano *= 1.05));
    },
    alEmpezar(extra) {
      if (duelo) terminar(false, "lejos");
      extra.holmr = Object.assign(base(), extra.holmr || {});
      st = extra.holmr;
    },
    actualizar(dt) {
      if (!A || !duelo) return;
      if (J.dentro) return terminar(false, "lejos");
      if (J.modo !== "juego") return;
      paso(dt);
    },
    // la barra de jefe con los escudos que le quedan (goinn.js la limpia cada cuadro antes; este sistema va después)
    hud() {
      if (!duelo || J.dentro) return;
      const d = duelo,
        e = d.e;
      J.jefeHud = {
        nombre: d.nombre,
        frac: Math.max(0, e.vida / e.d.vida),
        ataduras: 0,
        ataque: t("hm.escudos", ["◆".repeat(d.escudos) + "◇".repeat(Math.max(0, d.ficha.escudos - d.escudos))]),
        accion: d.fase === "pelea" && abierto(e) ? t("hm.abierto") : t("hm.guardia"),
      };
    },
    // los golpes contra la guardia pegan un cuarto y parten escudos; nadie muere en la piel
    modDano(dano, e) {
      if (!duelo || e !== duelo.e) return dano;
      const d = duelo;
      if (d.fase !== "pelea") return 0;
      if (d.escudos > 0 && !abierto(e)) {
        dano *= 0.25;
        d.golpes++;
        if (d.golpes >= GOLPES_ESCUDO) {
          d.golpes = 0;
          d.escudos--;
          A.textoFlotante(e.x, e.y - 140, t(d.escudos ? "hm.partido" : "hm.sin_escudos"), "#FFD98A");
          J.sacudir(0.3);
          if (window.SONIDO) SONIDO.tocar("golpeFuerte", { vol: 0.8, tono: 0.7, x: e.x, y: e.y });
          // al partir un escudo queda tambaleando un instante: la ventana para castigar
          e.aturdido = Math.max(e.aturdido || 0, 0.6);
        } else A.textoFlotante(e.x, e.y - 120, t("hm.bloquea"), "#8E8A86");
      }
      if (dano >= e.vida) dano = Math.max(0, e.vida - 1);
      return dano;
    },
    // sin escudos, el remate lo empuja fuerte: se lo puede sacar de la piel
    alPegar(e, dano, info) {
      if (!duelo || e !== duelo.e || duelo.escudos > 0 || !info || !info.d || !(info.d.empuje >= 1.3)) return;
      const dx = e.x - jug.x,
        dy = e.y - jug.y,
        l = Math.hypot(dx, dy) || 1;
      e.vx = (dx / l) * 720;
      e.vy = (dy / l) * 720;
    },
    // Eromash se rinde antes de caer
    modRecibido(dano) {
      if (!duelo || duelo.fase !== "pelea") return dano;
      const lim = Math.ceil(jug.hpMax * RINDE);
      if (jug.hp - dano < lim) {
        dano = Math.max(0, jug.hp - lim);
        duelo.rinde = true;
      }
      return dano;
    },
    cercanos(dar) {
      if (J.dentro || jug.muerto || duelo || !hallbera) return;
      const d = Math.hypot(hallbera.x - jug.x, hallbera.y - jug.y);
      if (d < HABLAR) dar(d, t("hm.hablar"), hablar, hallbera.x, hallbera.y - 120);
    },
    fondo(c, x0, y0, x1, y1) {
      if (J.dentro || !C || C[0] + HX + 80 < x0 || C[0] - HX - 80 > x1 || C[1] + HY + 80 < y0 || C[1] - HY - 80 > y1) return;
      HOLMR_DIBUJO.holmrPiel(c, C[0], C[1], J.t, { ax: HX, ay: HY });
      // en pelea, el borde se pone rojo cuando Eromash se acerca a pisar fuera (o lo empujan hacia afuera)
      if (duelo && duelo.fase === "pelea") {
        const borde = Math.min(HX - Math.abs(jug.x - C[0]), HY - Math.abs(jug.y - C[1]));
        if (borde < 90) {
          c.globalAlpha = Math.min(1, (90 - borde) / 60) * (0.65 + Math.sin(J.t * 12) * 0.3);
          c.strokeStyle = "#C8402D";
          c.lineWidth = 7;
          c.strokeRect(C[0] - HX, C[1] - HY, HX * 2, HY * 2);
          c.globalAlpha = 1;
        }
      }
    },
    objetos(lista, visible, c) {
      if (J.dentro || !C) return;
      if (visible(hallbera.x, hallbera.y)) {
        const mira = duelo ? "E" : jug.x < hallbera.x ? "E" : "S";
        lista.push({ x: hallbera.x, y: hallbera.y, f: () => GENTE.dibujar(c, "hallbera", hallbera.x, hallbera.y, J.t, { vista: mira, espejo: true }) });
      }
      if (banco && visible(banco.x, banco.y))
        [["testigo1", -40], ["testigo2", 30]].forEach(([id, dx]) => {
          const bx = banco.x + dx,
            salta = duelo && duelo.fase === "pelea" ? Math.abs(Math.sin(J.t * 6 + dx)) * 4 : 0;
          lista.push({ x: bx, y: banco.y + 2, f: () => GENTE.dibujar(c, id, bx, banco.y - 36 - salta, J.t, { vista: "S" }) });
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
  return { sistema, estado: () => st, centro: () => C, hallbera: () => hallbera, duelo: () => duelo, siguiente, hablar, empezar, terminar, abierto, KEMPUR, HX, HY, RINDE };
})();
