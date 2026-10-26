// ---------- las piedras de Berkano y los manantiales rúnicos (sistema BERKANO) ----------
// La vida de reserva, a la manera de las botellas de vida de MediEvil 2 pero con la identidad de Eromash: cada piedra
// de Berkano (la runa de la vida que vuelve) guarda vida en luz rúnica y, cuando la vida llega a 0, se rompe la más
// cargada y Eromash vuelve con lo que tenía en vez de caer. Se recargan en los manantiales rúnicos (primero la
// vida, después las piedras; cada uno tiene 240 de caudal y se llena de nuevo al amanecer), con Thora, en el Anillo
// de los álfar, con las brasas de vida que sobran y con el brebaje de Berkano (en la barra de abajo). Ása las talla
// más hondo en la forja para que curen más. Estado en E.extra.berkano = { p: [carga 0..1 por piedra], talla,
// brebajes, compradas, man: { clave: { luz, dia } }, tomadas: { clave: true }, vistos: { clave: true } }.
window.BERKANO = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const RUNICO = "#73D5DB";
  const MAX = 6, // piedras que se pueden llevar
    CURA = [60, 80, 100, 120], // vida que guarda cada piedra según la talla de Ása
    COSTO_TALLA = [90, 180, 300],
    CAUDAL = 240, // vida que da un manantial lleno
    FLUJO = 40, // vida por segundo que da el manantial
    MAX_BREBAJES = 3,
    BREBAJE_HIERBAS = 2,
    BREBAJE_PLATA = 15,
    PRECIO_PIEDRA = [120, 200]; // las dos que vende Thora
  let st = null;
  const clave = (o) => Math.round(o.x) + "_" + Math.round(o.y);
  const cura = () => CURA[Math.min(CURA.length - 1, st.talla)];

  // ---------- las piedras ----------
  const cargadas = () => st.p.filter((p) => p >= 0.999).length;
  const llenas = () => st.p.length > 0 && st.p.every((p) => p >= 0.999);
  // vida que entra a las piedras (de a una, la más vacía primero); devuelve lo que no entró
  function cargar(vida) {
    while (vida > 0.01) {
      let i = -1;
      st.p.forEach((p, k) => p < 0.999 && (i < 0 || p < st.p[i]) && (i = k));
      if (i < 0) break;
      const falta = (1 - st.p[i]) * cura(),
        va = Math.min(falta, vida);
      st.p[i] = Math.min(1, st.p[i] + va / cura());
      vida -= va;
    }
    return vida;
  }
  function cargarTodas() {
    for (let i = 0; i < st.p.length; i++) st.p[i] = 1;
  }
  // la vida llegó a 0: se rompe la piedra más cargada y Eromash vuelve con esa vida (la llama juego.js antes de morir)
  // ---------- salvarse: la piedra que surge ----------
  // Como la botella de vida del MediEvil 2, sin pausar nada: al caer queda con 1 de vida e intocable, una piedra con
  // Berkano sale del piso al lado de Eromash, crece, se raja con luz y estalla; la vida llega con el estallido y vuela
  // en motas hasta él. El juego sigue corriendo todo el tiempo (sin cámara lenta).
  const SURGE = { boca: 0.12, sube: 0.62, raja: 0.9 }; // tiempos: se abre el piso, termina de salir, estalla
  let surge = null; // { t, x, y, vida, dada }
  function salvar() {
    if (!st || !st.p.length || surge) return !!surge;
    let i = 0;
    st.p.forEach((p, k) => p > st.p[i] && (i = k));
    if (st.p[i] < 0.05) return false;
    const vida = Math.max(1, Math.round(st.p[i] * cura()));
    st.p[i] = 0;
    jug.hp = 1;
    jug.inv = SURGE.raja + 1.2;
    // al costado de Eromash, del lado al que no mira, para no taparlo
    // (de costado en pantalla también con la cámara girada: VOL.ejeMundo pasa de la vista al mundo y al revés)
    const V = window.VOL && VOL.ejeMundo ? VOL.ejeMundo : (e) => e,
      g = window.VOL ? VOL.cam.g : 0,
      mira = jug.dir ? V({ x: jug.dir[0], y: jug.dir[1] }, -g) : { x: 1 },
      d = V({ x: (mira.x > 0 ? -1 : 1) * 62, y: 8 });
    surge = { t: 0, x: jug.x + d.x, y: jug.y + d.y, vida, dada: false };
    J.sacudir(0.25);
    J.marcas.push({ tipo: "anillo", x: surge.x, y: surge.y, s: 0.9, col: RUNICO, t: 0 });
    if (window.ANIMA) ANIMA.gesto("susto");
    if (window.SONIDO) {
      SONIDO.tocar("crujido", { vol: 0.6, tono: 0.6, x: surge.x, y: surge.y });
      SONIDO.tono("triangle", 160, 420, SURGE.raja, 0.05, { filtro: 1800 });
    }
    return true;
  }
  function estallar() {
    const s = surge,
      baja = window.CALIDAD && CALIDAD.nivel === "baja";
    s.dada = true;
    jug.hp = Math.min(jug.hpMax, Math.max(jug.hp, s.vida));
    jug.vuelve = 0.6;
    J.sacudir(0.55);
    J.marcas.push({ tipo: "anillo", x: s.x, y: s.y, s: 1.8, col: RUNICO, t: 0 });
    J.marcas.push({ tipo: "anillo", x: jug.x, y: jug.y, s: 1.2, col: "#C8F2F4", t: 0 });
    // los pedazos de piedra que saltan
    const n = baja ? 8 : 24;
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2,
        v = 160 + Math.random() * 220;
      J.fx.push({ x: s.x, y: s.y - 40 - Math.random() * 60, vx: Math.cos(a) * v, vy: -120 - Math.random() * 260, t: 0.5 + Math.random() * 0.4, c: k % 3 ? "#77736C" : "#9A968E", s: 4 + Math.random() * 5, g: 1 });
    }
    // la vida en motas que vuelan hasta Eromash y llegan cuando se apagan
    const m = baja ? 6 : 20;
    for (let k = 0; k < m; k++) {
      const vida = 0.35 + Math.random() * 0.25,
        sx = s.x + (Math.random() - 0.5) * 40,
        sy = s.y - 30 - Math.random() * 80;
      J.fx.push({ x: sx, y: sy, vx: (jug.x - sx) / vida, vy: (jug.y - 50 - sy) / vida, t: vida, c: k % 3 ? RUNICO : "#C8F2F4", s: 3 + Math.random() * 3, g: 0 });
    }
    if (window.VIDA) VIDA.evento("sanar", jug.x, jug.y);
    if (window.SONIDO) {
      SONIDO.tocar("golpeFuerte", { vol: 0.5, tono: 0.7, x: s.x, y: s.y });
      SONIDO.tocar("runa", { vol: 0.7 });
      SONIDO.tono("triangle", 392, 784, 0.7, 0.06, { filtro: 2800 });
    }
    if (window.ANIMA) ANIMA.gesto("feliz");
    A.numero(jug.x, jug.y - 90, s.vida, RUNICO);
    const quedan = cargadas();
    HUD.aviso(quedan || st.p.some((p) => p >= 0.05) ? t("bk.salvado") + " · " + t("bk.salvado_sub", [quedan]) : t("bk.ultima"), RUNICO);
  }
  function avanzarSurge(dt) {
    if (!surge) return;
    surge.t += dt;
    if (!surge.dada) jug.hp = Math.max(1, jug.hp); // el fuego o el veneno del piso no lo bajan mientras sale
    if (!surge.dada && surge.t >= SURGE.raja) estallar();
    if (surge.dada && surge.t >= SURGE.raja + 0.3) surge = null;
  }
  // cómo va la piedra: cuánto salió, cuánto se rajó y cuánto brilla
  function poseSurge(s) {
    const tt = s.t,
      sube = Math.max(0, Math.min(1, (tt - SURGE.boca) / (SURGE.sube - SURGE.boca))),
      k = 1 - Math.pow(1 - sube, 3);
    return { k, grieta: Math.max(0, (tt - SURGE.sube) / (SURGE.raja - SURGE.sube)), luz: 0.3 + 0.7 * Math.min(1, tt / SURGE.raja) };
  }

  // ---------- los manantiales ----------
  let lista = null; // [{ cosa, k }] de todos los manantiales del mundo (también los del editor)
  let piedras = null; // las piedras tiradas que se juntan
  const dia = () => Math.floor(((A.H.E.tiempo / LUZ.DIA) * 24 + 9 - 6) / 24); // cambia a las 6 de la mañana
  function estadoDe(m) {
    const d = dia();
    let e = st.man[m.k];
    if (!e) e = st.man[m.k] = { luz: 1, dia: d };
    if (e.dia !== d) (e.luz = 1), (e.dia = d);
    return e;
  }
  let bebiendo = false,
    secoAviso = 0,
    chispa = 0;
  function manantiales(dt) {
    let cerca = null;
    for (const m of lista) {
      const e = estadoDe(m);
      m.cosa.o.luz = e.luz;
      if (!J.dentro && !jug.muerto && Math.hypot(m.cosa.x - jug.x, m.cosa.y + 10 - jug.y) < 135) cerca = { m, e };
    }
    const falta = jug.hpMax - jug.hp > 0.5 || (st.p.length && !llenas());
    if (!cerca) return terminar(false);
    if (!st.vistos[cerca.m.k]) {
      st.vistos[cerca.m.k] = true;
      HUD.aviso(t("bk.descubierto"), "lugar", t("bk.descubierto_sub"));
    }
    if (!falta) return terminar(true);
    if (A.enPelea()) return terminar(false);
    if (cerca.e.luz <= 0.001) {
      if (J.t - secoAviso > 6) (secoAviso = J.t), A.avisar("bk.manantial_seco", "#9A968E");
      return terminar(false);
    }
    // el agua pasa a Eromash: primero la vida, después las piedras
    let da = Math.min(FLUJO * dt, cerca.e.luz * CAUDAL);
    const antes = da,
      aVida = Math.min(da, jug.hpMax - jug.hp);
    jug.hp += aVida;
    da = cargar(da - aVida);
    cerca.e.luz = Math.max(0, cerca.e.luz - (antes - da) / CAUDAL);
    bebiendo = true;
    if ((chispa -= dt) <= 0) {
      chispa = 0.1;
      const c = cerca.m.cosa;
      J.fx.push({ x: c.x + (Math.random() - 0.5) * 50, y: c.y - 30, vx: (jug.x - c.x) * 1.4, vy: (jug.y - 60 - c.y) * 1.4 - 80, t: 0.6, c: Math.random() < 0.5 ? RUNICO : "#C8F2F4", s: 3 + Math.random() * 2, g: 0.2 });
    }
  }
  function terminar(lleno) {
    if (!bebiendo) return;
    bebiendo = false;
    if (lleno) {
      HUD.aviso(t("bk.manantial_listo"), RUNICO, st.p.length ? t("bk.cargadas") + " " + cargadas() + "/" + st.p.length : "");
      if (window.VIDA) VIDA.evento("sanar", jug.x, jug.y);
      if (window.SONIDO) SONIDO.tono("sine", 523, 1046, 0.5, 0.05, { filtro: 2400 });
    }
  }

  // ---------- juntar una piedra ----------
  function tomar(q) {
    if (st.p.length >= MAX) return A.avisar("bk.llena_max", RUNICO);
    st.p.push(1);
    st.tomadas[q.k] = true;
    q.cosa.o.tomada = true;
    jug.interactuando = 0.4;
    nueva(q.cosa.x, q.cosa.y);
  }
  function nueva(x, y) {
    J.marcas.push({ tipo: "anillo", x, y, s: 1.2, col: RUNICO, t: 0 });
    if (window.VIDA) VIDA.evento("runa", x, y);
    if (window.SONIDO) SONIDO.tocar("runa", { vol: 0.5 });
    if (window.ANIMA) ANIMA.gesto("feliz");
    HUD.aviso(t("bk.nueva"), "lugar", t("bk.nueva_sub", [cura(), st.p.length, MAX]));
    if (A.H.guardar) A.H.guardar();
  }

  // ---------- el brebaje de Berkano (objeto de la barra de abajo) ----------
  let tomando = false;
  function tomarBrebaje() {
    if (tomando) return;
    if (!st.brebajes) return A.avisar("bk.brebaje_sin", "#C8402D");
    if (!st.p.length) return A.avisar("bk.brebaje_sinpiedra", "#C8402D");
    if (llenas()) return A.avisar("bk.brebaje_lleno", RUNICO);
    tomando = true;
    jug.interactuando = 1;
    J.marcas.push({ tipo: "anillo", x: jug.x, y: jug.y, s: 0.9, col: RUNICO, t: 0 });
    A.avisar("bk.brebaje_tomando", RUNICO);
    J.retrasar(1, () => {
      tomando = false;
      if (jug.sinGolpe < 0.95 || jug.muerto) return A.avisar("bk.brebaje_cortado", "#C8402D");
      st.brebajes--;
      let i = 0;
      st.p.forEach((p, k) => p < st.p[i] && (i = k));
      st.p[i] = 1;
      if (window.VIDA) VIDA.evento("sanar", jug.x, jug.y);
      if (window.SONIDO) SONIDO.tono("sine", 440, 880, 0.4, 0.05, { filtro: 2400 });
      HUD.aviso(t("bk.brebaje_listo"), RUNICO);
    });
  }

  // ---------- Thora y Ása ----------
  // la mesa de Thora (después de que te cura): prepara brebajes con hierbas y vende las dos piedras que guarda
  function thora() {
    const pj = PODERES.pj();
    if (st.p.length) {
      const antes = cargadas();
      cargarTodas();
      if (cargadas() > antes) A.avisar("bk.thora_cargo", RUNICO);
    }
    const precio = PRECIO_PIEDRA[st.compradas];
    A.menu(`<h2>${t("bk.thora_titulo")}</h2><div class="sub">${t("bk.thora_sub", [pj.hierbas || 0, pj.plata])}</div><p>${t("bk.thora_0")}</p>`, [
      {
        texto: t("bk.preparar"),
        sub: t("bk.preparar_sub", [BREBAJE_HIERBAS, BREBAJE_PLATA, st.brebajes, MAX_BREBAJES]),
        fn: () => {
          if (st.brebajes >= MAX_BREBAJES) return A.avisar("bk.preparar_lleno");
          if ((pj.hierbas || 0) < BREBAJE_HIERBAS || pj.plata < BREBAJE_PLATA) return A.avisar("bk.preparar_falta", "#C8402D");
          pj.hierbas -= BREBAJE_HIERBAS;
          pj.plata -= BREBAJE_PLATA;
          st.brebajes++;
          if (window.BARRA) BARRA.recibido("brebaje");
          HUD.aviso(t("bk.preparado"), RUNICO, st.brebajes + "/" + MAX_BREBAJES);
          thora();
        },
      },
      {
        texto: t("bk.comprar"),
        sub: precio ? t("bk.comprar_sub", [precio, PRECIO_PIEDRA.length - st.compradas]) : t("bk.comprar_no"),
        fn: () => {
          if (!precio) return A.avisar("bk.comprar_no");
          if (st.p.length >= MAX) return A.avisar("bk.llena_max", RUNICO);
          if (pj.plata < precio) return A.avisar("pj.forja_no");
          pj.plata -= precio;
          st.compradas++;
          st.p.push(1);
          A.cerrarMenu();
          nueva(jug.x, jug.y);
        },
      },
      { texto: t("ui.cerrar"), fn: A.cerrarMenu },
    ]);
  }
  // la línea de la forja de Ása: tallar Berkano más hondo para que cada piedra cure más
  function lineaForja(rebaja, volver) {
    const pj = PODERES.pj(),
      n = st.talla,
      lleno = n >= COSTO_TALLA.length,
      costo = lleno ? 0 : Math.round(COSTO_TALLA[n] * rebaja);
    const sub = !st.p.length ? t("bk.forja_sin") : lleno ? t("pj.forja_lleno") : t("bk.forja_cura", [CURA[n], CURA[n + 1]]) + " · " + t("pj.forja_costo", [costo]) + (pj.plata < costo ? " · " + t("pj.forja_falta") : "");
    return {
      texto: t("bk.forja", [n, COSTO_TALLA.length]),
      sub,
      fn: () => {
        if (!st.p.length) return A.avisar("bk.forja_sin");
        if (lleno || pj.plata < costo) return A.avisar("pj.forja_no");
        pj.plata -= costo;
        st.talla++;
        A.avisar("pj.forja_listo", "#FFD98A");
        volver();
      },
    };
  }

  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      lista = W.COSAS.filter((o) => o.id === "manantialRunico").map((cosa) => ({ cosa, k: clave(cosa) }));
      piedras = W.COSAS.filter((o) => o.id === "piedraBerkano").map((cosa) => ({ cosa, k: clave(cosa) }));
    },
    alEmpezar(extra) {
      extra.berkano = Object.assign({ p: [], talla: 0, brebajes: 0, compradas: 0, man: {}, tomadas: {}, vistos: {} }, extra.berkano || {});
      st = extra.berkano;
      piedras.forEach((q) => (q.cosa.o.tomada = !!st.tomadas[q.k]));
      bebiendo = tomando = false;
      surge = null;
    },
    actualizar(dt) {
      if (!st || J.modo !== "juego") return;
      avanzarSurge(dt);
      manantiales(dt);
    },
    objetos(lista, visible, c) {
      if (!surge || !visible(surge.x, surge.y)) return;
      const s = surge;
      if (!s.dada) lista.push({ x: s.x, y: s.y, f: () => ASSETS.dibujar(c, "piedraBerkanoSurge", s.x, s.y, J.t, poseSurge(s)) });
      // el destello del estallido
      else if (!(window.CALIDAD && CALIDAD.nivel === "baja")) {
        const k = (s.t - SURGE.raja) / 0.3;
        lista.push({ x: s.x, y: s.y, f: () => DIB.halo(c, s.x, s.y - 60, 90 + 120 * k, "#C8F2F4", 0.9 * (1 - k)) });
      }
    },
    luces(dar) {
      if (surge && !surge.dada) dar({ x: surge.x, y: surge.y - 50, r: 160 + 120 * poseSurge(surge).luz, col: RUNICO, f: 0.8 });
    },
    cercanos(dar) {
      if (!st || J.dentro) return;
      for (const q of piedras) {
        if (q.cosa.o.tomada) continue;
        const d = Math.hypot(q.cosa.x - jug.x, q.cosa.y - jug.y);
        if (d < 110) dar(d, t("bk.tomar_piedra"), () => tomar(q), q.cosa.x, q.cosa.y - 70);
      }
    },
    hud() {
      if (st) HUD.piedras(st.p, cura());
    },
    diario() {
      if (!st || !st.p.length) return "";
      return `<div class="diario-resumen"><p><b>${t("bk.piedras")}</b> ${t("bk.diario", [cargadas(), st.p.length, cura()])}${st.brebajes ? " · " + t("bk.diario_brebajes", [st.brebajes]) : ""}</p></div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return {
    salvar,
    cargar,
    cargarTodas,
    tomarBrebaje,
    thora,
    lineaForja,
    MAX_BREBAJES,
    estado: () => st,
    brebajes: () => (st ? st.brebajes : 0),
    puedeBrebaje: () => !!st && st.brebajes > 0 && st.p.length > 0 && !llenas(),
    manantiales: () => (lista || []).map((m) => ({ x: m.cosa.x, y: m.cosa.y, luz: st ? estadoDe(m).luz : 1 })),
  };
})();
