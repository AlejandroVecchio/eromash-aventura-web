// ---------- el motor de la aventura (módulo JUEGO) ----------
// Bucle, cámara, Eromash, la gente de Eldervald, las criaturas, las interacciones de las misiones y las zonas.
// Lo que pasa en la historia sale de HISTORIA (guion.js); el mundo fijo de ELDERVALD; el combate de COMBATE.
(function () {
  "use strict";
  const W = ELDERVALD,
    H = HISTORIA,
    CB = COMBATE;
  const P = W.PUNTOS,
    N = W.NOMBRADAS;
  const t = (k, v) => I18N.t(k, v);
  const tav = (k, v) => I18N.t("av." + k, v);
  const consulta = new URLSearchParams(location.search);
  if (consulta.get("lang")) I18N.setLang(consulta.get("lang"));
  const VISTA = 1000 * 562 * Math.pow(Number(consulta.get("lejos")) || 1, 2); // ?lejos=3 para revisar el mapa // área del mundo que se ve (como la arena: Eromash grande en pantalla)
  const CUERPO = 1 / 1.96; // la escala del vikingo de la arena

  const lienzo = document.getElementById("lienzo"),
    principal = lienzo.getContext("2d");
  let c = principal; // se cambia un instante para dibujar la silueta de Eromash aparte
  let cw = 0,
    ch = 0,
    esc = 1,
    escBase = 1, // la escala sin el alejamiento (el piso se cachea a esta escala)
    alejar = 1,
    alejarMeta = 1; // un sistema puede abrir la vista un rato (el mirador del Santuario)
  function medir() {
    const k = window.CALIDAD ? CALIDAD.escala() : Math.min(2, devicePixelRatio || 1);
    cw = lienzo.width = Math.round(innerWidth * k);
    ch = lienzo.height = Math.round(innerHeight * k);
    escBase = Math.sqrt((cw * ch) / VISTA);
    esc = escBase / alejar;
  }
  addEventListener("resize", medir);
  if (window.CALIDAD) CALIDAD.on(medir);
  medir();

  // ---------- estado ----------
  const J = {
    t: 0,
    modo: "titulo", // titulo · juego · dialogo · menu · fin
    cam: { x: 0, y: 0, sac: 0 },
    avisos: [],
    fx: [],
    marcas: [], // lo que muestra la Lente: huellas, anillos, runas en el piso
    ondas: [], // la luz rúnica que corre por el suelo
    textos: [], // números de daño
    zonas: [], // fuego o escarcha que queda en el piso un rato
    timers: [], // cosas que pasan después de un tiempo de juego (se frenan en pausa)
    mulDano: 1, // lo suben la herrería y el poder rúnico
  };
  // los sistemas que se enchufan al motor (secretos.js, hordas.js, poderes.js): cada uno puede tener iniciar,
  // alEmpezar, actualizar, cercanos, lente, piso, objetos, luces, alMorir, hud y diario
  const SIS = window.SISTEMAS || [];
  const cadaSis = (fn, ...a) => SIS.forEach((s0) => s0[fn] && s0[fn](...a));
  J.retrasar = (seg, fn) => J.timers.push({ t: seg, fn });
  J.alejarA = (v) => (alejarMeta = Math.max(alejarMeta, v));
  // el acercamiento que elige el jugador (rueda del mouse o las acciones acercar / alejar), recordado en este navegador
  let zoomJug = 1;
  try {
    zoomJug = Math.max(0.9, Math.min(1.35, +localStorage.getItem("eromash.aventura.zoom") || 1));
  } catch (e) {}
  function cambiarZoom(d) {
    zoomJug = Math.max(0.9, Math.min(1.35, zoomJug + d));
    try {
      localStorage.setItem("eromash.aventura.zoom", zoomJug);
    } catch (e) {}
  }
  addEventListener("wheel", (e) => {
    if (J.modo !== "juego" || J.dentro || (e.target && e.target.closest && e.target.closest(".ui, #capaCaja, #mapaLienzo"))) return;
    cambiarZoom(e.deltaY > 0 ? 0.05 : -0.05);
  }, { passive: true });
  const jug = (J.jugador = {
    x: 0, y: 0, vx: 0, vy: 0, hp: 100, hpMax: 100, sta: 100, staMax: 100,
    mira: { vista: "S", espejo: false }, dir: [0, 1], salto: 0, esq: 0, esqDir: [0, 1], atk: null, combo: 0, comboT: 0,
    herido: 0, inv: 0, muerto: false, sinGolpe: 0, cansado: false, correr: false, interactuando: 0, lento: 0,
  });
  const R = 16; // radio del cuerpo de Eromash

  // ---------- la gente ----------
  const npcs = {};
  ["eydis", "orm", "svanhild"].forEach((id) => (npcs[id] = { id, x: 0, y: 0, destino: null, lugar: "", mira: { vista: "S", espejo: false }, hablando: 0, camina: 0 }));
  const trabajadores = ["trabajador", "trabajador2", "trabajador3", "herido"].map((id, i) => ({ id, i, x: 0, y: 0, destino: null, mira: { vista: "S", espejo: false }, camina: 0, hablando: 0 }));
  let lugarTrab = "";
  // la cuadrilla de Orm, cada uno con su nombre: Lif, Gunnar, Eskil y Bror (el herido, marido de Sigrun)
  const CUADRILLA = { trabajador: "lif", trabajador2: "gunnar", trabajador3: "eskil", herido: "bror" };
  const charlas = {};
  function hablarCuadrilla(tr) {
    const id = CUADRILLA[tr.id],
      etapa = H.tiene("piedra_puesta") ? (H.completa("EL-02") ? "c" : "b") : "a",
      k = (charlas[id + etapa] = (charlas[id + etapa] || 0) + 1) - 1;
    tr.mira = VIKINGO.vista(jug.x - tr.x, jug.y - tr.y, tr.mira);
    dialogoLibre([[id, "pj." + id + "_" + etapa + (k % 2)]]);
  }

  // ---------- criaturas ----------
  const lobos = [0, 1].map((i) => CB.crear("lobo", W.m(625 + i * 18, 385 - i * 10)[0], W.m(625 + i * 18, 385 - i * 10)[1]));
  const errantes = [0, 1, 2].map((i) => {
    const p = W.mas(W.LUGARES.refugio.p, 16 + i * 3, 9 + (i % 2) * 4);
    return CB.crear("errante", p[0], p[1]);
  });
  const custodio = CB.crear("custodio", P.custodio[0], P.custodio[1]);
  const enemigos = [...lobos, ...errantes, custodio];
  const ciervo = CB.crearCiervo(P.claro[0], P.claro[1], N.soportes);
  let nucleoSuelo = null;

  // ---------- utilidades ----------
  const dist = (a, b) => Math.hypot(a.x - b[0], a.y - b[1]);
  const metros = (u) => u / W.M;
  J.quitarAviso = (a) => {
    const i = J.avisos.indexOf(a);
    if (i >= 0) J.avisos.splice(i, 1);
  };
  J.sacudir = (f) => window.OPCIONES && !OPCIONES.v("temblor") ? 0 : (J.cam.sac = Math.max(J.cam.sac, f));
  J.herir = (dano, ox, oy, tipo) => {
    // esquivar o saltar justo cuando el golpe llega: el mundo va lento un instante, vuelve estamina y el próximo golpe pega doble
    if (!jug.muerto && (jug.salto > 0 || jug.esq > 0) && J.t - (jug.justaT || -9) > 0.8) {
      jug.justaT = J.t;
      J.camLenta = 0.32;
      jug.sta = Math.min(jug.staMax, jug.sta + 15);
      jug.contra = 1.6;
      textoFlotante(jug.x, jug.y - 130, t("mj.justa"), "#73D5DB");
    }
    if (jug.muerto || jug.salto > 0 || jug.inv > 0) return; // saltar evita todo; esquivar da invulnerabilidad
    if ((jug.z || 0) > 60) return; // arriba de la muralla no llegan los de abajo
    if (J.alHerir) dano = J.alHerir(dano); // el escudo de Algiz se come el golpe
    if (tipo === "helado") jug.lento = 2;
    if (dano <= 0) {
      jug.inv = 0.4;
      return;
    }
    jug.hp -= dano;
    jug.herido = 0.5;
    HUD.herido();
    // de qué lado vino: una cuña roja en ese borde de la pantalla
    golpesDir.push({ a: Math.atan2(oy - jug.y, ox - jug.x), t0: J.t });
    if (golpesDir.length > 4) golpesDir.shift();
    jug.inv = 0.6;
    jug.sinGolpe = 0;
    if (window.SONIDO) SONIDO.tocar("golpeFuerte", { vol: 0.8, tono: 0.75 });
    const l = Math.hypot(jug.x - ox, jug.y - oy) || 1;
    jug.vx = ((jug.x - ox) / l) * 380;
    jug.vy = ((jug.y - oy) / l) * 380;
    J.sacudir(0.35);
    if (jug.hp <= 0) morir();
  };
  const golpesDir = [];
  let jefeAtaque = "",
    jefeAccion = "";
  J.anunciarJefe = (a, b) => {
    jefeAtaque = a;
    jefeAccion = b;
  };
  J.soporteRoto = () => {
    if (CB.atados(ciervo) === 0) H.marcar("ataduras_rotas");
  };
  J.alMorir = (e) => {
    enemigoMurio(e);
    cadaSis("alMorir", e);
  };
  J.ciervoVencido = () => {
    H.marcar("ciervo_vencido");
    nucleoSuelo = { x: P.nucleo[0], y: P.nucleo[1] };
  };

  // ---------- avisos ----------
  const avisar = (k, color) => HUD.aviso(tav(k), color);

  // ---------- ubicar a la gente según la etapa ----------
  function ubicarGente(alArrancar) {
    for (const id in npcs) {
      const n = npcs[id],
        lugar = H.lugarDe(id);
      if (lugar === n.lugar || !P[lugar]) continue;
      const p = P[lugar];
      // lejos de la cámara o al arrancar: aparece ahí; cerca: camina
      if (alArrancar || Math.hypot(n.x - jug.x, n.y - jug.y) > 1400) {
        n.x = p[0];
        n.y = p[1];
        n.destino = null;
      } else n.destino = p;
      n.lugar = lugar;
    }
    const lt = H.lugarDe("trabajadores");
    if (lt !== lugarTrab) {
      const base = P[lt];
      trabajadores.forEach((tr) => {
        const propio = P[lt + "_" + tr.id];
        const p = propio || [base[0] + Math.cos(tr.i * 1.9) * 70, base[1] + Math.sin(tr.i * 1.9) * 50];
        if (alArrancar || !lugarTrab || Math.hypot(tr.x - jug.x, tr.y - jug.y) > 1400) {
          tr.x = p[0];
          tr.y = p[1];
          tr.destino = null;
        } else tr.destino = p;
      });
      lugarTrab = lt;
    }
  }
  // el escenario según los hitos (al cargar y cada vez que cambia algo)
  function escenario() {
    const tiene = H.tiene;
    if (tiene("piedra_puesta")) {
      N.piedra_caida.oculto = true;
      N.runa_refugio.o.puesta = true;
      N.runa_refugio.o.luz = tiene("runa_refugio") ? 1 : 0.55;
    }
    N.mesa.o.fragmento = tiene("fragmento_entregado") && !tiene("lente");
    N.losa.o.luz = tiene("huella_patio") ? 1 : 0;
    N.pedestal.o.nucleo = tiene("nucleo_puesto");
    N.pedestal.o.luz = tiene("runa_paso") ? 1 : tiene("nucleo_puesto") ? 0.3 : 0;
    W.repararPuente(tiene("puente_reparado"));
    N.santuario.o.visto = tiene("sello_visto");
    N.soportes.forEach((s) => (s.o.visto = tiene("anclajes_vistos")));
    ciervo.mostrarAtaduras = tiene("anclajes_vistos");
    if (tiene("ciervo_vencido")) {
      ciervo.derrotado = true;
      ciervo.caido = 1;
      N.soportes.forEach((s) => (s.o.roto = true));
      if (!tiene("nucleo") && !nucleoSuelo) nucleoSuelo = { x: P.nucleo[0], y: P.nucleo[1] };
      if (tiene("nucleo")) nucleoSuelo = null;
    }
    lobos.forEach((e) => (e.activo = !tiene("lobos_vencidos") && e.muerto === 0));
    const hayErrantes = H.en("EL-02") && !tiene("errantes_despejados");
    errantes.forEach((e) => (e.activo = hayErrantes && e.muerto === 0));
    custodio.activo = !tiene("custodio_vencido") && custodio.muerto === 0;
  }
  H.oir((tipo, dato) => {
    if (tipo === "cambio") {
      escenario();
      ubicarGente(false);
      seguirObjetivo();
    } else if (tipo === "mensaje" && dato === "mision_nueva") misionNueva();
    else if (tipo === "mensaje") avisar(dato);
    else if (tipo === "lugar") {
      HUD.aviso(tav("lugar_" + dato), "lugar", t("ui.lugar_descubierto"));
      // descubrir un lugar paga un poco de plata (los vecinos le pagan al que trae noticias del camino)
      if (window.PODERES && PODERES.pj()) PODERES.darPlata(PLATA_LUGAR);
      // el lugar entero queda a la vista en el mapa
      const L = W.LUGARES[dato];
      if (L && window.MAPA) MAPA.descubrir(L.p[0], L.p[1], L.r + 1200);
    }
    else if (tipo === "fin") setTimeout(mostrarFin, 1000);
  });
  // ---------- misiones: recompensas, avisos y pistas ----------
  const PLATA_LUGAR = 8;
  let etapaVista = "",
    etapaDesde = 0,
    pistaDada = 0;
  // cada misión de la historia cumplida paga plata (más cuanto más adentro de la historia); la nueva se anuncia grande
  function misionNueva() {
    const n = H.E.mision,
      plata = 25 + n * 15;
    if (window.PODERES && PODERES.pj()) PODERES.darPlata(plata);
    HUD.aviso(t("mj.mision_cumplida", [plata]), "#FFD98A");
    if (window.SONIDO) SONIDO.tocar("mision", { vol: 0.7, var: 0 });
    J.retrasar(1.2, () => H.mision() && HUD.aviso(tav("mision_" + H.idMision()), "lugar", t("mj.mision_nueva")));
    etapaVista = H.etapa();
    etapaDesde = J.t;
  }
  // un objetivo cumplido sin cambiar de misión se anuncia en verde
  function seguirObjetivo() {
    const e = H.etapa();
    if (e === etapaVista) return;
    if (etapaVista && e.split("-").slice(0, 2).join("-") === etapaVista.split("-").slice(0, 2).join("-")) {
      HUD.aviso(t("mj.objetivo_cumplido"), "#7BC86C");
      if (window.SONIDO) SONIDO.tocar("pagina", { vol: 0.6 });
    }
    etapaVista = e;
    etapaDesde = J.t;
  }
  function textoObjetivo(ob) {
    return tav(ob.texto, ob.cuenta ? [Math.min(H.cuenta(ob.cuenta[0]), ob.cuenta[1]), ob.cuenta[1]] : undefined);
  }
  // si pasan cuatro minutos sin avanzar, un recordatorio de qué hacer y por dónde
  function pistaSiHaceFalta() {
    if (J.modo !== "juego" || J.dentro || jug.pelea || J.t - etapaDesde < 240 || J.t - pistaDada < 240) return;
    const o = H.objetivo();
    if (!o) return;
    pistaDada = J.t;
    HUD.aviso(t(dondeObjetivo() ? "mj.pista_haz" : "mj.pista", [textoObjetivo(o)]), "#73D5DB");
  }
  // lo que la gente tiene para decir: «!» dorado sobre a quien manda el objetivo, «…» sobre quien tiene algo nuevo
  const oidos = () => (H.E.extra.oidos = H.E.extra.oidos || {});
  function senalDe(n) {
    const o = H.objetivo();
    if (o && o.donde === n.id) return "!";
    const k = H.dialogoDe(n.id);
    return k && !oidos()[k] ? "…" : null;
  }
  function dibujarSenal(n) {
    const sg = senalDe(n);
    if (!sg) return;
    const x = n.x,
      y = n.y - 150 + Math.sin(J.t * 3 + n.x) * 4;
    if (sg === "!") {
      DIB.halo(c, x, y - 12, 34, "#FFD98A", 0.8);
      DIB.P(c, [x - 6, y - 36, x + 6, y - 36, x + 3.5, y - 8, x - 3.5, y - 8], "#FFD98A");
      DIB.R(c, x - 4, y - 3, 8, 7, "#FFD98A");
    } else {
      DIB.P(c, [x - 18, y - 22, x + 18, y - 22, x + 18, y - 4, x + 4, y - 4, x - 2, y + 4, x - 4, y - 4, x - 18, y - 4], "#F2ECEC");
      for (let k = -1; k <= 1; k++) DIB.E(c, x + k * 8, y - 13, 2.6, 2.6, "#111111");
    }
  }
  H.alGuardar(() => (J.modo === "titulo" ? null : { pos: [Math.round(jug.x), Math.round(jug.y)], salud: Math.max(1, Math.round(jug.hp)) }));

  // ---------- interacciones de las misiones ----------
  // cada una: dónde, radio, el texto del cartel (accion_*), cuándo vale y qué hace
  const INTER = [];
  const inter = (p, texto, cond, accion, radio = 90) => INTER.push({ p, texto, cond, accion, radio });
  const tiene = H.tiene,
    en = H.en;
  inter(P.carro, "accion_inspeccionar", () => en("EL-01") && tiene("el01_acepto") && !tiene("carro_visto"), () => {
    H.marcar("croquis_leido");
    dialogo("carro");
  }, 120);
  inter(P.piedra_caida, "accion_levantar_piedra", () => en("EL-02") && tiene("bror_entablillado") && !tiene("piedra_puesta"), () => {
    // Eromash levanta la piedra y la encastra en la runa del refugio
    jug.interactuando = 0.9;
    setTimeout(() => {
      N.piedra_caida.oculto = true;
      N.runa_refugio.o.puesta = true;
      N.runa_refugio.o.luz = 0.55;
      H.marcar("piedra_puesta");
    }, 700);
  });
  inter(P.runa_refugio, "accion_contactar", () => en("EL-02") && tiene("piedra_puesta") && !tiene("runa_refugio"), () => dialogo("runa_refugio"), 110);
  inter(P.pedestal, "accion_colocar", () => en("EL-06") && tiene("vuelta_paso") && !tiene("nucleo_puesto"), () => {
    jug.interactuando = 0.6;
    N.pedestal.o.nucleo = true;
    H.marcar("nucleo_puesto");
  });
  inter(P.pedestal, "accion_contactar", () => en("EL-06") && tiene("nucleo_puesto") && !tiene("runa_paso"), () => cineNucleo());
  inter(P.sello, "accion_tocar", () => en("EL-07") && tiene("sello_visto") && !tiene("voz_santuario"), () => dialogo("runa_santuario"), 150);
  inter(P.sello, "accion_calco", () => en("EL-07") && tiene("voz_santuario") && !tiene("calco"), () => {
    jug.interactuando = 0.8;
    H.anotar("diario_calco");
    H.marcar("calco");
  }, 150);
  inter(P.nucleo, "accion_recoger", () => en("EL-05") && tiene("ciervo_vencido") && !tiene("nucleo") && !!nucleoSuelo, () => {
    jug.interactuando = 0.6;
    nucleoSuelo = null;
    H.anotar("diario_nucleo");
    H.marcar("nucleo");
  });

  // ---------- lo que revela la Lente del Eco ----------
  const REVELA = [];
  const huellas = (desde, hasta, n, col) => {
    const r = [];
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n;
      r.push({ tipo: "huella", x: desde[0] + (hasta[0] - desde[0]) * u + Math.sin(i * 2.1) * 18, y: desde[1] + (hasta[1] - desde[1]) * u + Math.cos(i * 1.7) * 18, s: 1, col, ang: Math.atan2(hasta[1] - desde[1], hasta[0] - desde[0]) });
    }
    return r;
  };
  const revela = (p, radio, cond, al, marcas) => REVELA.push({ p, radio, cond, al, marcas });
  const AZUL = DIB.RUNICO,
    VIO = DIB.VIOLETA;
  revela(P.mesa, 360, () => en("EL-03") && tiene("fragmento_entregado") && !tiene("fragmento_examinado"), () => {
    H.marcar("fragmento_examinado");
    dialogo("svanhild_asta");
  }, [{ tipo: "anillo", x: N.mesa.x, y: N.mesa.y - 30, s: 1, col: VIO }]);
  revela(P.losa, 420, () => en("EL-03") && tiene("fragmento_examinado") && !tiene("huella_patio"), () => {
    N.losa.o.luz = 1;
    H.marcar("huella_patio");
  }, [{ tipo: "anillo", x: P.losa[0], y: P.losa[1], s: 1.6, col: AZUL }, ...huellas(P.losa, [P.losa[0] - 360, P.losa[1] - 480], 6, AZUL)]);
  revela(P.tablon, 540, () => en("EL-04") && tiene("eydis_paso") && !tiene("pista_tablon"), () => {
    H.anotar("diario_pista_tablon");
    H.marcar("pista_tablon");
    HUD.aviso(tav("pista_tablon_txt"), AZUL);
  }, [{ tipo: "rastro", x: P.tablon[0], y: P.tablon[1], s: 1.4, col: AZUL }, ...huellas(P.tablon, W.LUGARES.tala.p, 9, AZUL)]);
  revela(P.raiz, 540, () => en("EL-04") && tiene("pista_tablon") && !tiene("pista_raiz"), () => {
    H.anotar("diario_pista_raiz");
    H.marcar("pista_raiz");
    HUD.aviso(tav("pista_raiz_txt"), AZUL);
  }, [{ tipo: "runa", x: P.raiz[0], y: P.raiz[1] - 10, s: 1.2, col: VIO }, ...huellas(P.raiz, W.LUGARES.quebrada_rastreo.p, 8, AZUL)]);
  revela(P.menhir, 540, () => en("EL-04") && tiene("cuna_sacada") && !tiene("pista_menhir"), () => {
    H.anotar("diario_pista_menhir");
    H.marcar("pista_menhir");
    HUD.aviso(tav("pista_menhir_txt"), AZUL);
  }, [{ tipo: "anillo", x: P.menhir[0], y: P.menhir[1], s: 2, col: VIO }, ...huellas(P.menhir, W.LUGARES.claro_entrada.p, 6, AZUL)]);
  revela(P.claro, 1900, () => en("EL-05") && !tiene("anclajes_vistos"), () => {
    ciervo.mostrarAtaduras = true;
    N.soportes.forEach((s) => (s.o.visto = true));
    H.marcar("anclajes_vistos");
    HUD.aviso(tav("anclajes_txt"), VIO);
  }, N.soportes.map((s) => ({ tipo: "anillo", x: s.x, y: s.y, s: 2.2, col: VIO })));
  revela(P.sello, 600, () => en("EL-07") && tiene("santuario_llegada") && !tiene("sello_visto"), () => {
    N.santuario.o.visto = true;
    H.marcar("sello_visto");
  }, [{ tipo: "anillo", x: P.sello[0], y: P.sello[1], s: 2.4, col: AZUL }]);

  const tieneLente = () => tiene("lente") || tiene("lente_prestada");
  let lenteEspera = 0;
  function usarLente() {
    if (!tieneLente()) return avisar("sin_lente");
    if (lenteEspera > 0) return;
    lenteEspera = 1.2;
    J.ondas.push({ tipo: "pulso", x: jug.x, y: jug.y, t: 0 });
    let algo = false;
    for (const r of REVELA)
      if (r.cond() && dist(jug, r.p) <= r.radio) {
        algo = true;
        r.marcas.forEach((m) => J.marcas.push(Object.assign({ t: 0 }, m)));
        setTimeout(r.al, 450);
      }
    SIS.forEach((s0) => s0.lente && s0.lente(jug.x, jug.y) && (algo = true));
    if (!algo) setTimeout(() => avisar("lente_nada"), 500);
  }

  // ---------- diálogos ----------
  let dlg = null;
  function dialogo(id) {
    const d = H.DIALOGOS[id];
    if (!d) return;
    dlg = { id, d, i: 0 };
    J.modo = "dialogo";
    mostrarLinea();
  }
  // diálogo armado por un sistema: lineas = [[quien, clave completa, variables]], alFin al cerrar
  function dialogoLibre(lineas, alFin) {
    dlg = { id: "_libre", d: { lineas, libre: true, alFin }, i: 0 };
    J.modo = "dialogo";
    mostrarLinea();
  }
  function mostrarLinea() {
    const [quien, clave, vars] = dlg.d.lineas[dlg.i];
    const texto = dlg.d.libre ? t(clave, vars) : tav(clave);
    HUD.dialogo(quien, texto, CONTROLES.glifo("seguir"));
    // en Opciones, «diálogos: solos» pasa a la línea siguiente después del tiempo de leerla
    dlg.solo = window.OPCIONES && OPCIONES.v("dialogos") === "solos" ? 1.6 + texto.length * 0.045 : 0;
    for (const id in npcs) npcs[id].hablando = id === quien ? 1 : 0;
  }
  function seguirDialogo() {
    dlg.i++;
    if (dlg.i < dlg.d.lineas.length) return mostrarLinea();
    const { id, d } = dlg;
    dlg = null;
    HUD.dialogo(null);
    for (const k in npcs) npcs[k].hablando = 0;
    J.modo = "juego";
    CONTROLES.soltar();
    alTerminar(id, d);
  }
  function alTerminar(id, d) {
    if (d.libre) return d.alFin && d.alFin();
    if (d.diario) H.anotar(d.diario);
    if (id === "svanhild_inicio") {
      N.mesa.o.fragmento = true;
      H.marcar("lente_prestada");
    }
    if (id === "runa_refugio") {
      N.runa_refugio.o.luz = 1;
      ondaPor([P.runa_refugio, P.carro], 0.9);
      // la cuadrilla sale por el camino despejado
      trabajadores.forEach((tr) => (tr.destino = [P.carro[0] + tr.i * 40, P.carro[1] + 60]));
    }
    if (id === "orm_puente") return repararPuente();
    if (id === "salida_norte") {
      jug.x = P.puente[0];
      jug.y = P.puente[1] + 200;
      return;
    }
    if (d.fin) H.marcar(d.fin);
  }

  // ---------- cinemáticas cortas ----------
  // EL-06: Eromash toca el Núcleo; la luz corre por el suelo hasta el puente roto y por el camino del sur
  function cineNucleo() {
    jug.interactuando = 0.8;
    J.modo = "cine";
    N.pedestal.o.luz = 0.3;
    let k = 0;
    const subir = setInterval(() => {
      k = Math.min(1, k + 0.05);
      N.pedestal.o.luz = 0.3 + k * 0.7;
      if (k >= 1) clearInterval(subir);
    }, 60);
    setTimeout(() => {
      ondaPor([P.pedestal, P.puente], 1);
      ondaPor([P.pedestal, P.paso_sur, W.mas(P.paso_sur, 0, 14)], 1.2);
      J.sacudir(0.3);
    }, 1100);
    setTimeout(() => {
      J.modo = "juego";
      dialogo("runa_paso");
    }, 3600);
  }
  // EL-06: Orm y la cuadrilla arreglan el puente (fundido), y Eydis pregunta si va a durar
  function repararPuente() {
    J.modo = "cine";
    HUD.fundido(true);
    setTimeout(() => {
      W.repararPuente(true);
      jug.x = P.orm_puente[0] - 80;
      jug.y = P.orm_puente[1] + 60;
      HUD.fundido(false);
      setTimeout(() => {
        avisar("puente_listo");
        J.modo = "juego";
        dialogo("eydis_marca");
      }, 900);
    }, 1200);
  }
  function ondaPor(pts, vel) {
    J.ondas.push({ tipo: "camino", pts, t: 0, vel: vel * 900 });
  }

  // ---------- muerte y reaparición ----------
  function morir() {
    jug.muerto = true;
    jug.hp = 0;
    J.sacudir(0.8);
    const caida = [jug.x, jug.y];
    setTimeout(() => HUD.fundido(true), 550);
    setTimeout(() => {
      enemigos.forEach((e) => e.activo && !e.muerto && CB.reiniciar(e));
      J.avisos.length = 0;
      J.zonas.length = 0;
      J.timers.length = 0;
      if (ciervo.activo) CB.reiniciarCiervo(J, ciervo);
      const p = dondeReaparecer(caida);
      jug.x = p[0];
      jug.y = p[1];
      jug.hp = jug.hpMax;
      jug.sta = jug.staMax;
      jug.muerto = false;
      jug.inv = 2.5; // unos segundos sin que nada lo toque al volver
      jug.vuelve = 2.5;
      jug.atk = null;
      J.cam.x = jug.x;
      J.cam.y = jug.y;
      HUD.fundido(false);
      avisar("reapareciste");
    }, 1600);
  }
  // reaparece donde dice la misión o, si queda más cerca de donde cayó, en el refugio descubierto más próximo
  function dondeReaparecer(caida) {
    let mejor = P[H.REAPARECER[H.idMision()] || "puesto"],
      dm = Math.hypot(mejor[0] - caida[0], mejor[1] - caida[1]);
    for (const k of ["puesto", "refugio", "casa_lindes", "aserradero", "brunvik", "skarnholt"]) {
      const L = W.LUGARES[k];
      if (!L || !H.E.vistos.includes(k)) continue;
      const d = Math.hypot(L.p[0] - caida[0], L.p[1] - caida[1]);
      if (d < dm && W.libre(L.p[0], L.p[1] + 60, R)) {
        dm = d;
        mejor = [L.p[0], L.p[1] + 60];
      }
    }
    return mejor;
  }

  // ---------- Eromash ----------
  // tres pasos: caminar (stick apenas inclinado o sin aire), trotar (lo normal, gratis) y correr (Shift / L2, gasta
  // estamina; vacía te deja caminando y jadeando hasta recuperar un tercio)
  const VEL_PASO = [0, 100, 175, 295],
    VEL_ESQ = 520;
  const GOLPES = [
    { wind: 0.08, swing: 0.14, rec: 0.2, arc: 2.3, reach: 78, dano: 16, empuje: 0.4 },
    { wind: 0.08, swing: 0.16, rec: 0.24, arc: 2.5, reach: 84, dano: 20, empuje: 0.45 },
    { wind: 0.13, swing: 0.18, rec: 0.34, arc: 3.0, reach: 96, dano: 32, empuje: 1.9, remate: true },
  ];
  const GOLPE_GIRO = { wind: 0.05, swing: 0.34, rec: 0.26, arc: Math.PI * 2, reach: 100, dano: 28, empuje: 1.5, giro: true },
    GOLPE_CARRERA = { wind: 0.04, swing: 0.16, rec: 0.26, arc: 1.1, reach: 112, dano: 24, avanza: 420, empuje: 1.4 },
    GOLPE_CAIDA = { wind: 0, swing: 0.1, rec: 0.24, arc: Math.PI * 2, reach: 92, dano: 22, empuje: 1.3, giro: true, caida: true },
    CARGA_GIRO = 0.6;
  function atacarCon(d, dir, side = 1) {
    jug.atk = { t: 0, d, dir, side, pego: false };
    if (window.SONIDO) SONIDO.tocar(d.caida ? "caida" : "tajo", { vol: d.giro || d.remate ? 0.55 : 0.4, tono: d.giro ? 0.8 : d.remate ? 0.88 : 1.05 });
    if (!d.giro) jug.mira = VIKINGO.vista(Math.cos(dir), Math.sin(dir), jug.mira);
    if (d.caida) {
      polvareda(jug.x, jug.y, 14);
      J.sacudir(0.22);
    }
  }
  // con mando (o sin mouse) el golpe se corre solo hacia la criatura más cercana delante, si la hay
  function apuntar(dir) {
    if (window.OPCIONES && !OPCIONES.v("apuntar")) return dir;
    const o = objetivoCerca(dir);
    return o ? Math.atan2((o.y - jug.y) * 1.25, o.x - jug.x) : dir;
  }
  function objetivoCerca(dir) {
    let mejor = null,
      dm = 170;
    for (const e of enemigos) {
      if (!e.activo || e.muerto) continue;
      const dx = e.x - jug.x,
        dy = (e.y - jug.y) * 1.25,
        l = Math.hypot(dx, dy);
      if (l > dm) continue;
      let da = Math.atan2(dy, dx) - dir;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      if (Math.abs(da) > 1.05) continue;
      dm = l;
      mejor = e;
    }
    return mejor;
  }
  // ¿hay pelea cerca? (criaturas que persiguen o golpean, el ciervo o un jefe)
  function enPelea() {
    if (ciervo.activo || J.jefeHud) return true;
    return enemigos.some((e) => e.activo && !e.muerto && e.estado !== "quieto" && e.estado !== "vuelve" && Math.abs(e.x - jug.x) < 1100 && Math.abs(e.y - jug.y) < 800);
  }
  function columnaRunica(x, y) {
    if (window.SONIDO) SONIDO.runa(x, y);
    J.ondas.push({ tipo: "pulso", x, y, t: 0 });
    J.marcas.push({ tipo: "anillo", x, y, s: 1.6, col: "#73D5DB", t: 0 });
    if (window.CALIDAD && CALIDAD.nivel === "baja") return;
    for (let i = 0; i < 26; i++) J.fx.push({ x: x + (Math.random() - 0.5) * 50, y: y - Math.random() * 30, vx: (Math.random() - 0.5) * 30, vy: -260 - Math.random() * 320, t: 0.5 + Math.random() * 0.4, c: Math.random() < 0.5 ? "#73D5DB" : "#C8F2F4", s: 4 + Math.random() * 5, g: -0.1 });
  }
  // ---------- lo que se oye: pasos, el viento, los grillos, los cuervos y las fogatas cerca ----------
  let pasoAcum = 0,
    cuervosT = 20,
    grilloT = 0,
    latidoT = 0;
  let fogatas = null;
  function sonidoDelMundo(dt) {
    if (!window.SONIDO || !SONIDO.listo()) return;
    SONIDO.oyente(jug.x, jug.y);
    // pasos: uno cada tanto según lo rápido que va; en los puentes suenan a madera y en el adoquín a piedra
    if (jug.paso && jug.salto <= 0 && jug.esq <= 0 && !jug.muerto) {
      pasoAcum += VEL_PASO[jug.paso] * dt;
      const largo = [0, 62, 74, 88][jug.paso];
      if (pasoAcum > largo) {
        pasoAcum = 0;
        const puente = W.PUENTES.some((p) => W.distLinea(jug.x, jug.y, [p.a, p.b]) < 50);
        const cam = !puente && W.CAMINOS.find((c0) => W.distLinea(jug.x, jug.y, c0.p) < c0.w / 2);
        const tipo = puente ? "pasoMadera" : cam && (cam.tipo === "adoquin" || cam.tipo === "ladrillo") ? "pasoPiedra" : "paso";
        SONIDO.tocar(tipo, { vol: [0, 0.18, 0.25, 0.34][jug.paso], var: 0.1, filtro: tipo === "paso" && !cam ? 2200 : null });
      }
    } else pasoAcum = 40;
    // el viento: más fuerte de noche y en lo alto
    SONIDO.bucle("viento", "viento", 0.16 + amb.n * 0.08 + (jug.z ? 0.12 : 0), { filtro: 380 + Math.sin(J.t * 0.13) * 160 });
    // de noche, grillos; de día, de vez en cuando los cuervos
    if (amb.n > 0.5 && (grilloT -= dt) <= 0) {
      grilloT = 0.25 + Math.random() * 0.9;
      for (let k = 0; k < 3; k++) SONIDO.tono("sine", 4200 + Math.random() * 600, 4100, 0.05, 0.012, { ambiente: true, retraso: k * 0.07 });
    }
    if (amb.n < 0.4 && (cuervosT -= dt) <= 0) {
      cuervosT = 30 + Math.random() * 50;
      SONIDO.tocar("cuervos", { ambiente: true, vol: 0.35, desde: Math.random() * 8, dur: 4, var: 0.04 });
    }
    // las fogatas que arden cerca
    if (!fogatas) fogatas = W.COSAS.filter((o) => o.id === "fogonOlla" || o.id === "brasero");
    let f = 0;
    for (const o of fogatas) {
      if (o.o.apagado || (o.id === "brasero" && !o.o.encendido)) continue;
      const d = Math.hypot(o.x - jug.x, (o.y - jug.y) * 1.3);
      if (d < 700) f = Math.max(f, 1 - d / 700);
    }
    SONIDO.bucle("fogata", "fogata", f * 0.7);
    // con poca vida se oye el corazón
    if (jug.hp < jug.hpMax * 0.25 && !jug.muerto && (latidoT -= dt) <= 0) {
      latidoT = 0.9;
      SONIDO.latido();
    }
  }
  function polvareda(x, y, n) {
    if (window.CALIDAD && CALIDAD.nivel === "baja") return;
    for (let i = 0; i < n; i++) J.fx.push({ x: x + (Math.random() - 0.5) * 30, y: y - 2, vx: (Math.random() - 0.5) * 140, vy: -20 - Math.random() * 50, t: 0.35, c: "rgba(150,130,110,0.45)", s: 5 + Math.random() * 4, g: 0.2 });
  }
  let mouse = { x: 0, y: 0, usado: false };
  lienzo.addEventListener("pointermove", (e) => {
    const k = cw / innerWidth;
    mouse.x = (e.clientX * k) / esc + J.cam.x - cw / 2 / esc;
    mouse.y = (e.clientY * k) / esc + J.cam.y - ch / 2 / esc;
    mouse.usado = true;
  });
  function puedeMover() {
    return J.modo === "juego" && !jug.muerto && jug.interactuando <= 0;
  }
  function actualizarJugador(dt) {
    jug.herido = Math.max(0, jug.herido - dt);
    jug.inv = Math.max(0, jug.inv - dt);
    jug.vuelve = Math.max(0, (jug.vuelve || 0) - dt);
    jug.sinGolpe += dt;
    // lo que dura más de medio segundo (despertar, juntar luz para viajar) muestra su barrita
    if (jug.interactuando > (jug.canalAntes || 0) + 0.05) jug.canalTotal = jug.interactuando;
    jug.interactuando = Math.max(0, jug.interactuando - dt);
    jug.canalAntes = jug.interactuando;
    jug.lento = Math.max(0, jug.lento - dt);
    lenteEspera = Math.max(0, lenteEspera - dt);
    // la vida vuelve sola: despacio en pelea, rápido cuando ya no hay nada cerca
    if (jug.sinGolpe > 4 && !jug.muerto) jug.hp = Math.min(jug.hpMax, jug.hp + (jug.pelea ? 3 : 12) * dt);
    // empujón
    if (Math.abs(jug.vx) + Math.abs(jug.vy) > 1) {
      moverJugador(jug.vx * dt, jug.vy * dt);
      jug.vx *= Math.pow(0.001, dt);
      jug.vy *= Math.pow(0.001, dt);
    }
    if (jug.salto > 0) jug.salto = Math.max(0, jug.salto - dt);
    const libre = puedeMover();
    const e = libre ? CONTROLES.eje() : { x: 0, y: 0 },
      mov = Math.hypot(e.x, e.y) > 0.15;
    // estamina: correr y esquivar gastan; se recupera sola después de un respiro
    const mag = Math.min(1, Math.hypot(e.x, e.y));
    jug.staEspera = Math.max(0, (jug.staEspera || 0) - dt);
    // con mando se toca L3 (o L2) una vez y sigue corriendo hasta que frenás o te cansás
    if (CONTROLES.mando() && libre && CONTROLES.recien("correr")) jug.sprintFijo = !jug.sprintFijo;
    // con teclado, dos toques de Shift lo dejan corriendo solo hasta que frenás
    if (!CONTROLES.mando() && libre && CONTROLES.recien("correr")) {
      // en Opciones, «correr: alternar» hace que un toque de Shift deje corriendo y otro lo pare
      if (window.OPCIONES && OPCIONES.v("correr") === "alternar") jug.sprintFijo = !jug.sprintFijo;
      else if (J.t - (jug.shiftT || -9) < 0.3) jug.sprintFijo = true;
      jug.shiftT = J.t;
    }
    const alterna = !CONTROLES.mando() && window.OPCIONES && OPCIONES.v("correr") === "alternar";
    if ((!mov && !alterna) || jug.cansado) jug.sprintFijo = false;
    jug.correr = libre && mov && ((CONTROLES.pulsado("correr") && !alterna) || jug.sprintFijo) && !jug.cansado && !jug.atk;
    if (jug.correr && jug.pelea) {
      jug.sta -= 20 * dt;
      jug.staEspera = 0.6;
    } else if (jug.esq <= 0 && jug.staEspera <= 0) jug.sta += (mov ? 20 : 30) * (jug.pelea ? 1 : 1.6) * dt;
    if (jug.sta <= 0) {
      jug.sta = 0;
      jug.cansado = true;
      jug.correr = false;
    }
    if (jug.cansado && jug.sta > jug.staMax * 0.35) jug.cansado = false;
    jug.sta = Math.min(jug.staMax, jug.sta);
    jug.paso = !mov ? 0 : jug.correr ? 3 : jug.cansado || mag < 0.6 ? 1 : 2;
    // esquiva (atraviesa a la gente y a las criaturas: dura poco y es para salir de un golpe)
    if (jug.esq > 0) {
      jug.esq -= dt;
      moverJugador(jug.esqDir[0] * VEL_ESQ * dt, jug.esqDir[1] * VEL_ESQ * dt, true);
      return;
    }
    if (!libre) return;
    if (mov) {
      const l = Math.hypot(e.x, e.y);
      jug.dir = [e.x / l, e.y / l];
    }
    // lo que se aprieta un instante antes de poder hacerlo queda guardado y sale apenas se puede
    for (const k of ["atacar", "esquivar", "saltar"]) if (CONTROLES.recien(k)) jug.pedido = { k, t: 0.18 };
    if (jug.pedido && (jug.pedido.t -= dt) <= 0) jug.pedido = null;
    const pide = (k) => jug.pedido && jug.pedido.k === k;
    // la esquiva corta el final de un golpe; quieto, es un paso atrás
    const enRec = !jug.atk || jug.atk.t >= jug.atk.d.wind + jug.atk.d.swing;
    if (pide("esquivar") && enRec && jug.sta >= 20 && jug.salto <= 0) {
      jug.pedido = null;
      jug.sta -= 20;
      jug.staEspera = 0.6;
      jug.esq = 0.3;
      jug.inv = Math.max(jug.inv, 0.26);
      jug.esqDir = mov ? jug.dir.slice() : [-jug.dir[0], -jug.dir[1]];
      jug.atk = null;
      jug.carga = 0;
      polvareda(jug.x, jug.y, 5);
      if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.5, tono: 1.25 });
      return;
    }
    if (pide("saltar") && jug.salto <= 0 && !jug.atk) {
      jug.pedido = null;
      jug.salto = 0.42;
      jug.saltoLargo = jug.correr;
      jug.golpeAire = false;
      if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.35, tono: 0.9 });
    }
    // al caer del salto: polvo, y si se atacó en el aire, el golpe contra el piso
    if (jug.saltoAntes > 0 && jug.salto <= 0) {
      polvareda(jug.x, jug.y, 6);
      if (window.SONIDO && !jug.golpeAire) SONIDO.tocar("caida", { vol: 0.4, tono: 1.1 });
      if (jug.golpeAire) atacarCon(GOLPE_CAIDA, Math.atan2(jug.dir[1], jug.dir[0]));
      jug.golpeAire = false;
    }
    jug.saltoAntes = jug.salto;
    // ataque: tres golpes seguidos (el tercero remata y empuja); corriendo es una estocada; en el aire, golpe al caer;
    // mantener apretado carga el giro
    jug.comboT = Math.max(0, jug.comboT - dt);
    jug.contra = Math.max(0, (jug.contra || 0) - dt);
    if (jug.atk) {
      const a = jug.atk,
        d = a.d;
      a.t += dt;
      if (d.avanza && a.t < d.wind + d.swing) moverJugador(Math.cos(a.dir) * d.avanza * dt, (Math.sin(a.dir) * d.avanza * dt) / 1.25);
      if (a.t >= d.wind && a.t <= d.wind + d.swing && !a.pego) golpear(a);
      if (a.t >= d.wind + d.swing + d.rec) {
        jug.atk = null;
        jug.comboT = d.giro || d.remate ? 0 : 0.35;
      }
    }
    if (CONTROLES.pulsado("atacar") && !jug.salto) jug.carga = (jug.carga || 0) + dt;
    else if (jug.carga) {
      const listo = jug.carga >= CARGA_GIRO && jug.sta >= 15;
      jug.carga = 0;
      if (listo) {
        jug.sta -= 15;
        jug.staEspera = 0.6;
        atacarCon(GOLPE_GIRO, 0);
        jug.pedido = null;
      }
    }
    if (pide("atacar") && jug.salto > 0) {
      jug.pedido = null;
      jug.golpeAire = true;
    } else if (pide("atacar") && !jug.atk) {
      jug.pedido = null;
      let dir = Math.atan2(jug.dir[1], jug.dir[0]);
      if (mouse.usado && !CONTROLES.mando()) dir = Math.atan2(mouse.y - (jug.y - 30), mouse.x - jug.x);
      else dir = apuntar(dir);
      if (jug.correr) atacarCon(GOLPE_CARRERA, dir);
      else {
        const n = jug.comboT > 0 ? (jug.combo + 1) % GOLPES.length : 0;
        jug.combo = n;
        atacarCon(GOLPES[n], dir, n % 2 ? -1 : 1);
      }
    }
    // los caminos son más rápidos; fuera de pelea correr no cansa
    jug.caminoT = (jug.caminoT || 0) - dt;
    if (jug.caminoT <= 0) {
      jug.caminoT = 0.25;
      jug.enCamino = W.CAMINOS.some((cm) => !cm.sinPiso && W.distLinea(jug.x, jug.y, cm.p) < cm.w * 0.5);
      jug.pelea = enPelea();
    }
    const vel = VEL_PASO[jug.paso] * (jug.atk ? 0.35 : 1) * (jug.lento > 0 ? 0.6 : 1) * (jug.enCamino && !jug.atk ? 1.12 : 1) * (jug.salto > 0 && jug.saltoLargo ? 1.35 : 1);
    if (mov) {
      moverJugador(e.x * vel * dt, e.y * vel * dt);
      if (!jug.atk) jug.mira = VIKINGO.vista(e.x, e.y, jug.mira);
    }
    jug.anda = mov ? (jug.correr ? 2 : 1) : 0;
    // polvo bajo las botas al correr y vaho al jadear
    jug.polvo = (jug.polvo || 0) - dt;
    if (jug.polvo <= 0 && !(window.CALIDAD && CALIDAD.nivel === "baja")) {
      if (jug.paso === 3 && !jug.salto) {
        jug.polvo = 0.11;
        J.fx.push({ x: jug.x - jug.dir[0] * 20 + (Math.random() - 0.5) * 16, y: jug.y - 2, vx: -jug.dir[0] * 60 + (Math.random() - 0.5) * 50, vy: -30 - Math.random() * 40, t: 0.4, c: "rgba(150,130,110,0.5)", s: 5 + Math.random() * 4, g: 0.25 });
      } else if (jug.cansado) {
        jug.polvo = 0.55;
        const f = jug.mira.vista === "E" ? (jug.mira.espejo ? -1 : 1) : 0;
        J.fx.push({ x: jug.x + f * 34, y: jug.y - 150 * CUERPO, vx: f * 30, vy: -26, t: 0.6, c: "rgba(242,236,236,0.35)", s: 6, g: -0.02 });
      }
    }
    // el barro salpica gotas marrones bajo las botas
    if (mov && !jug.salto && W.barroEn(jug.x, jug.y)) {
      jug.barro = (jug.barro || 0) - dt;
      if (jug.barro <= 0) {
        jug.barro = jug.correr ? 0.09 : 0.16;
        for (let i = 0; i < 4; i++) J.fx.push({ x: jug.x + (Math.random() - 0.5) * 14, y: jug.y - 2, vx: (Math.random() - 0.5) * 160, vy: -60 - Math.random() * 120, t: 0.3, c: i % 2 ? "#3A2E1E" : "#5C4A32", s: 3 + Math.random() * 3 });
      }
    }
    if (CONTROLES.recien("interactuar")) interactuar();
    if (CONTROLES.recien("lente")) usarLente();
  }
  function moverJugador(dx, dy, atraviesa) {
    if (window.ALTURAS && ALTURAS.mover(dx, dy)) return; // escaleras y adarves
    // las cercas frenan, salvo saltando
    const valla = (nx, ny) => jug.salto <= 0 && !(jug.z > 0) && W.vallaEntre(jug.x, jug.y, nx, ny, R);
    const cuerpos = atraviesa ? [] : cuerposCerca();
    if (W.libre(jug.x + dx, jug.y, R) && !valla(jug.x + dx, jug.y) && !choca(cuerpos, jug.x + dx, jug.y)) jug.x += dx;
    if (W.libre(jug.x, jug.y + dy, R) && !valla(jug.x, jug.y + dy) && !choca(cuerpos, jug.x, jug.y + dy)) jug.y += dy;
  }
  // la gente y los enemigos tienen cuerpo: Eromash no los atraviesa (si ya quedó encimado, puede salir)
  function cuerposCerca() {
    const l = [],
      f = (x, y, r) => Math.abs(x - jug.x) < 160 && Math.abs(y - jug.y) < 160 && l.push(x, y, r);
    if (jug.z > 0) return l; // arriba de la muralla no hay nadie con quien chocar
    Object.values(npcs).forEach((n) => f(n.x, n.y, 36));
    trabajadores.forEach((n) => f(n.x, n.y, 36));
    enemigos.forEach((e) => e.activo && !e.muerto && f(e.x, e.y, (e.d.radio || 18) * (e.s || 1) * 1.2));
    if (ciervo.activo && !ciervo.derrotado) f(ciervo.x, ciervo.y, 60);
    cadaSis("cuerpos", f);
    return l;
  }
  function choca(l, x, y) {
    for (let i = 0; i < l.length; i += 3) {
      const ax = x - l[i],
        ay = (y - l[i + 1]) * 1.6,
        m = R + l[i + 2];
      if (ax * ax + ay * ay < m * m && Math.hypot(ax, ay) < Math.hypot(jug.x - l[i], (jug.y - l[i + 1]) * 1.6)) return true;
    }
    return false;
  }
  function golpear(a) {
    a.pego = true;
    const d = a.d;
    const enArco = (x, y, r) => {
      const dx = x - jug.x,
        dy = (y - jug.y) * 1.25,
        l = Math.hypot(dx, dy);
      if (l > d.reach + r) return false;
      let da = Math.atan2(dy, dx) - a.dir;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      return Math.abs(da) <= d.arc / 2 || l < r;
    };
    // el contraataque después de una esquiva justa pega doble; a quien no te vio, golpe por sorpresa; a veces, crítico
    const contra = jug.contra > 0;
    let pego = 0;
    for (const e of enemigos) {
      if (!e.activo || e.muerto || Math.abs(e.x - jug.x) > 300 || !enArco(e.x, e.y, e.d.radio)) continue;
      if (W.hayMuro(jug.x, jug.y, e.x, e.y)) continue;
      const sorpresa = e.estado === "quieto",
        critico = Math.random() < 0.1;
      const dano = Math.round(d.dano * J.mulDano * (contra ? 2 : 1) * (sorpresa ? 1.5 : 1) * (critico ? 1.6 : 1));
      chispa(e.x, e.y - 30);
      numero(e.x, e.y - 60, dano, critico || contra ? "#FFD98A" : sorpresa ? "#FF8D71" : null, critico || contra);
      if (sorpresa) textoFlotante(e.x, e.y - 100, t("mj.sorpresa"), "#FF8D71");
      const murio = CB.golpear(J, e, dano, jug.x, jug.y, d.empuje || 1);
      if (window.SONIDO) {
        SONIDO.tocar(critico || contra || d.remate || d.caida || e.d.pesado ? "golpeFuerte" : "golpe", { vol: critico || contra ? 0.9 : 0.6, tono: e.d.pesado ? 0.8 : 1, x: e.x, y: e.y });
        if (murio) SONIDO.tocar("muerte", { vol: 0.5, tono: e.d.pesado ? 0.7 : e.d.vuela ? 1.3 : 1, x: e.x, y: e.y });
        else if (!e.d.muerto && Math.random() < 0.35) SONIDO.tocar("herida", { vol: 0.35, tono: e.d.pesado ? 0.7 : 1.15, x: e.x, y: e.y });
      }
      pego++;
    }
    if (ciervo.activo && enArco(ciervo.x, ciervo.y, 60)) {
      const antes = ciervo.vida;
      CB.golpearCiervo(J, ciervo, d.dano * J.mulDano * (contra ? 2 : 1));
      if (window.SONIDO) SONIDO.tocar("golpeFuerte", { vol: 0.8, tono: 0.7, x: ciervo.x, y: ciervo.y });
      chispa(ciervo.x, ciervo.y - 80);
      numero(ciervo.x, ciervo.y - 120, Math.max(0, Math.round(antes - ciervo.vida)), contra ? "#FFD98A" : null, contra);
      pego++;
    }
    if (pego) {
      // una pausa mínima al conectar: el golpe se siente
      J.hitstop = Math.max(J.hitstop || 0, d.remate || d.giro || contra ? 0.07 : 0.045);
      if (d.remate || contra) J.sacudir(0.25);
      if (contra) {
        jug.contra = 0;
        textoFlotante(jug.x, jug.y - 120, t("mj.contra"), "#FFD98A");
      }
    }
    cadaSis("alGolpear", jug.x, jug.y, a.dir, d.reach);
  }
  function enemigoMurio(e) {
    if (lobos.includes(e) && lobos.every((l) => l.muerto)) H.marcar("lobos_vencidos");
    if (errantes.includes(e) && errantes.every((l) => l.muerto)) {
      H.marcar("errantes_despejados");
      avisar("salida_despejada");
    }
    if (e === custodio) H.marcar("custodio_vencido");
  }
  function chispa(x, y) {
    for (let i = 0; i < 7; i++) J.fx.push({ x, y, vx: (Math.random() - 0.5) * 300, vy: -Math.random() * 260, t: 0.35, c: i % 2 ? "#F2ECEC" : "#FF8D71", s: 3 + Math.random() * 3 });
  }
  function numero(x, y, n, col, grande) {
    if (!(n > 0) || (window.OPCIONES && !OPCIONES.v("numeros"))) return;
    // los números que caen juntos se abren un poco para no taparse
    const cerca = J.textos.filter((o) => o.t < 0.3 && Math.abs(o.x - x) < 40 && Math.abs(o.y - y) < 30).length;
    J.textos.push({ x: x + (cerca % 2 ? 1 : -1) * Math.ceil(cerca / 2) * 26, y: y - cerca * 8, n, t: 0, col, grande });
  }
  function textoFlotante(x, y, n, col) {
    J.textos.push({ x, y, n, t: 0, col, grande: false, palabra: true });
  }

  // ---------- con qué se puede interactuar ahora ----------
  function cercano() {
    let mejor = null,
      dm = Infinity;
    for (const id in npcs) {
      const n = npcs[id];
      const d = Math.hypot(n.x - jug.x, n.y - jug.y);
      if (d < 110 && d < dm) {
        dm = d;
        mejor = { texto: t("av.accion_hablar") + " · " + tav("nombre_" + id), fn: () => hablar(id), x: n.x, y: n.y - 125 };
      }
    }
    for (const tr of trabajadores) {
      const d = Math.hypot(tr.x - jug.x, tr.y - jug.y);
      if (d < 100 && d < dm) {
        dm = d;
        mejor = { texto: t("av.accion_hablar") + " · " + t("av.nombre_" + CUADRILLA[tr.id]), fn: () => hablarCuadrilla(tr), x: tr.x, y: tr.y - 125 };
      }
    }
    SIS.forEach((s0) => s0.cercanos && s0.cercanos((d, texto, fn, x, y) => {
      if (d < dm) {
        dm = d;
        mejor = { texto, fn, x, y };
      }
    }));
    for (const it of INTER) {
      if (!it.cond()) continue;
      const d = dist(jug, it.p);
      if (d < it.radio && d < dm) {
        dm = d;
        mejor = { texto: tav(it.texto), fn: it.accion, x: it.p[0], y: it.p[1] - 90 };
      }
    }
    return mejor;
  }
  function hablar(id) {
    const n = npcs[id];
    n.mira = VIKINGO.vista(jug.x - n.x, jug.y - n.y, n.mira);
    jug.mira = VIKINGO.vista(n.x - jug.x, n.y - jug.y, jug.mira);
    const k = H.dialogoDe(id);
    oidos()[k] = true;
    dialogo(k);
  }
  function interactuar() {
    const c0 = cercano();
    if (c0) c0.fn();
  }

  // ---------- zonas (Eldervald._zonas) ----------
  const avisado = {};
  function unaVez(clave) {
    if ((avisado[clave] || -Infinity) > J.t) return;
    avisado[clave] = J.t + 12;
    avisar(clave);
  }
  function zonas() {
    if (jug.muerto || J.modo !== "juego") return;
    if (en("EL-06") && !tiene("vuelta_paso") && dist(jug, P.paso_sur) < 16 * W.M) H.marcar("vuelta_paso");
    if (en("EL-07") && !tiene("santuario_llegada") && dist(jug, P.santuario) < 15 * W.M) H.marcar("santuario_llegada");
    const dc = dist(jug, P.claro);
    if (dc < 23 * W.M && !ciervo.derrotado) {
      if (!H.completa("EL-04")) unaVez("claro_temprano");
      else if (!tiene("anclajes_vistos")) unaVez("claro_lente");
      else if (!ciervo.activo) CB.despertar(J, ciervo);
    } else if (dc > 36 * W.M && ciervo.activo) {
      CB.reiniciarCiervo(J, ciervo);
      avisar("ciervo_calma");
    }
    if (tiene("puente_reparado") && dist(jug, P.paso_norte) < 9 * W.M) {
      if (!H.completa("EL-07")) dialogo("salida_norte");
      else if (!avisado.finNorte) {
        avisado.finNorte = true;
        mostrarFin();
      }
    }
    for (const k of ["puesto", "refugio", "eikholt", "casa_lindes", "paso", "claro", "aserradero", "santuario", "brunvik", "skarnholt", "tumulo", "caravana", "torre"]) {
      const L = W.LUGARES[k];
      if (dist(jug, L.p) < L.r + 6 * W.M) H.descubrir(k);
    }
  }

  // ---------- la gente camina y mira ----------
  function actualizarGente(dt) {
    const todos = [...Object.values(npcs), ...trabajadores];
    for (const n of todos) {
      n.camina = 0;
      if (n.destino) {
        const dx = n.destino[0] - n.x,
          dy = n.destino[1] - n.y,
          l = Math.hypot(dx, dy);
        if (l < 6) n.destino = null;
        else {
          const v = Math.min(l, 150 * dt);
          n.x += (dx / l) * v;
          n.y += (dy / l) * v;
          n.mira = VIKINGO.vista(dx, dy, n.mira);
          n.camina = 1;
        }
      } else if (Math.hypot(jug.x - n.x, jug.y - n.y) < 260) n.mira = VIKINGO.vista(jug.x - n.x, jug.y - n.y, n.mira);
    }
  }

  // ---------- cámara ----------
  function actualizarCamara(dt) {
    let fx = jug.x,
      fy = jug.y - (jug.z || 0) - 30;
    if (ciervo.activo) {
      fx = (jug.x * 2 + ciervo.x) / 3;
      fy = (jug.y * 2 + ciervo.y) / 3 - 30;
    }
    // la cámara se adelanta un poco hacia donde va Eromash (más si corre), así se ve lo que viene
    const adel = jug.muerto || J.modo !== "juego" ? 0 : [0, 40, 70, 120][jug.paso || 0];
    J.cam.ax = (J.cam.ax || 0) + (jug.dir[0] * adel - (J.cam.ax || 0)) * Math.min(1, dt * 2.2);
    J.cam.ay = (J.cam.ay || 0) + (jug.dir[1] * adel * 0.8 - (J.cam.ay || 0)) * Math.min(1, dt * 2.2);
    fx += J.cam.ax;
    fy += J.cam.ay;
    const k = 1 - Math.exp(-6 * dt);
    J.cam.x += (fx - J.cam.x) * k;
    J.cam.y += (fy - J.cam.y) * k;
    J.cam.sac = Math.max(0, J.cam.sac - dt * 1.6);
  }

  // ---------- dibujo ----------
  const VK = {};
  ["calm", "fierce", "hurt", "happy"].forEach((o) => ["S", "E", "N"].forEach((v) => (VK[v + o] = VIKINGO.imagen("R", v, o))));
  function dibujarEspada(x, y, ang, s, brillo) {
    c.save();
    c.translate(x, y);
    c.rotate(ang + Math.PI / 2);
    c.scale(s, s);
    if (brillo) {
      c.shadowColor = "#FFD98A";
      c.shadowBlur = 24;
    }
    DIB.P(c, [0, -200, 16, -170, 16, 60, -16, 60, -16, -170], "#E6DEDE");
    c.shadowBlur = 0;
    DIB.R(c, -2, -160, 4, 210, "#B3A6A6");
    DIB.P(c, [-78, 60, 78, 60, 64, 84, -64, 84], "#C8402D");
    DIB.R(c, -11, 84, 22, 70, "#240806");
    DIB.P(c, [0, 154, 20, 174, 0, 194, -20, 174], "#C8402D");
    DIB.P(c, [0, 162, 9, 174, 0, 186, -9, 174], "#FFD98A");
    c.restore();
  }
  // Eromash dibujado igual que en la arena: el sprite a 125 × 150 escalado por CUERPO, la espada, el tajo
  function dibujarJugador() {
    const p = jug;
    if (p.muerto && Math.floor(J.t * 8) % 2) return;
    if (p.vuelve > 0 && Math.floor(J.t * 10) % 3 === 0) return; // parpadea mientras dura la gracia de volver
    c.save();
    if (p.z) c.translate(0, -p.z); // arriba de la muralla o en la escalera
    c.translate(p.x, p.y);
    c.scale(CUERPO, CUERPO);
    c.translate(-p.x, -p.y);
    const jp = p.salto > 0 ? Math.sin((1 - p.salto / 0.42) * Math.PI) : 0;
    const paso = p.paso != null ? p.paso : p.anda ? p.anda + 1 : 0,
      bob = p.salto > 0 ? 0 : Math.abs(Math.sin(J.t * [2.5, 7, 11, 16][paso])) * [2, 4, 8, 10][paso];
    if (!enSilueta) DIB.E(c, p.x, p.y, 58 * (1 - jp * 0.35), 16 * (1 - jp * 0.35), "rgba(0,0,0,0.45)");
    const h = 150,
      w = 125,
      yy = p.y - h + 8 - bob - jp * 70,
      face = p.mira.vista === "E" ? (p.mira.espejo ? -1 : 1) : p.dir[0] < 0 ? -1 : 1;
    // espada: en guardia al costado, o en el arco del golpe
    let sp;
    if (p.atk) {
      const a = p.atk,
        d = a.d;
      let pr = a.t < d.wind ? -0.15 * (a.t / d.wind) : a.t < d.wind + d.swing ? (a.t - d.wind) / d.swing : 1;
      const ang = a.dir + a.side * (-d.arc / 2 + d.arc * pr);
      sp = { x: p.x + Math.cos(ang) * 62, y: p.y - 55 - jp * 70 + Math.sin(ang) * 62 * 0.8, ang, s: 0.31 };
    } else {
      const lado = p.mira.vista === "N" ? -face : face;
      sp = { x: p.x + lado * 78, y: p.y - 70 - bob - jp * 70 + Math.sin(J.t * 2.4) * 6, ang: -Math.PI / 2 + lado * 0.25, s: 0.3 };
    }
    // de espaldas la espada en guardia queda detrás del cuerpo
    const detras = sp.y < p.y - 95 || (!p.atk && p.mira.vista === "N");
    if (detras) dibujarEspada(sp.x, sp.y, sp.ang, sp.s, jug.carga >= CARGA_GIRO);
    if (p.atk && p.atk.t >= p.atk.d.wind && p.atk.t <= p.atk.d.wind + p.atk.d.swing + 0.05) {
      const a = p.atk,
        d = a.d,
        pr = Math.min(1, (a.t - d.wind) / d.swing);
      c.save();
      c.globalAlpha = 0.35 * (1 - pr * 0.5);
      c.strokeStyle = a.combo ? "#FFD98A" : "#F2ECEC";
      c.lineWidth = 14;
      c.lineCap = "round";
      const a0 = a.dir - (a.side * d.arc) / 2,
        a1 = a.dir + a.side * (-d.arc / 2 + d.arc * pr),
        alc = d.reach / CUERPO;
      c.beginPath();
      c.ellipse(p.x, p.y - 55 - jp * 70, alc * 0.92, alc * 0.74, 0, Math.min(a0, a1), Math.max(a0, a1));
      c.stroke();
      c.restore();
    }
    const ojos = p.herido > 0 || p.muerto ? "hurt" : p.atk || p.correr ? "fierce" : "calm";
    const img = VK[p.mira.vista + ojos];
    c.save();
    if (p.inv > 0 && p.esq <= 0 && Math.floor(J.t * 20) % 2) c.globalAlpha = 0.45;
    if (p.esq > 0) c.globalAlpha = 0.75;
    c.translate(p.x, yy + h / 2);
    if (p.mira.vista === "E" && p.mira.espejo) c.scale(-1, 1);
    c.rotate(p.salto > 0 ? -0.25 * jp : paso === 3 && p.mira.vista === "E" ? 0.1 : 0);
    if (img.complete) c.drawImage(img, -w / 2, -h / 2, w, h);
    c.restore();
    if (!detras) dibujarEspada(sp.x, sp.y, sp.ang, sp.s, jug.carga >= CARGA_GIRO);
    c.restore();
  }
  function dibujarNpc(n) {
    GENTE.dibujar(c, n.id, n.x, n.y, J.t, { vista: n.mira.vista, espejo: n.mira.espejo, hablando: n.hablando, camina: n.camina });
    if (J.modo === "juego" && !n.hablando) dibujarSenal(n);
  }
  function dibujarMarca(m) {
    const a = Math.min(1, m.t * 2) * (m.t > 30 ? Math.max(0, 1 - (m.t - 30) / 3) : 1);
    if (a <= 0) return;
    DIB.alfa(c, a, () => {
      const pulso = 0.75 + Math.sin(J.t * 3 + m.x) * 0.25;
      if (m.tipo === "anillo") {
        DIB.halo(c, m.x, m.y, 70 * m.s, m.col, pulso);
        c.strokeStyle = m.col;
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(m.x, m.y, 50 * m.s, 20 * m.s, 0, 0, DIB.TAU);
        c.stroke();
      } else if (m.tipo === "huella") {
        c.save();
        c.translate(m.x, m.y);
        c.rotate(m.ang || 0);
        DIB.E(c, 0, -6, 8, 4, m.col);
        DIB.E(c, 4, 6, 7, 3.5, m.col);
        c.restore();
      } else if (m.tipo === "rastro") {
        DIB.halo(c, m.x, m.y, 60 * m.s, m.col, pulso);
        DIB.E(c, m.x, m.y, 30 * m.s, 8 * m.s, m.col);
      } else if (m.tipo === "runa") {
        DIB.halo(c, m.x, m.y - 20, 60 * m.s, m.col, pulso);
        c.strokeStyle = m.col;
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(m.x, m.y - 40 * m.s);
        c.lineTo(m.x, m.y);
        c.moveTo(m.x, m.y - 32 * m.s);
        c.lineTo(m.x + 12 * m.s, m.y - 22 * m.s);
        c.moveTo(m.x, m.y - 20 * m.s);
        c.lineTo(m.x + 12 * m.s, m.y - 10 * m.s);
        c.stroke();
      }
    });
  }
  function dibujarOnda(o) {
    if (o.tipo === "pulso") {
      const r = o.t * 900,
        a = Math.max(0, 1 - o.t / 0.7);
      c.save();
      c.globalAlpha = a * 0.7;
      c.strokeStyle = DIB.RUNICO;
      c.lineWidth = 6;
      c.beginPath();
      c.ellipse(o.x, o.y, r, r * 0.8, 0, 0, DIB.TAU);
      c.stroke();
      c.restore();
      return;
    }
    // la luz corre por el camino: una cabeza brillante y una estela que se apaga
    let largo = 0;
    const tramos = [];
    for (let i = 1; i < o.pts.length; i++) {
      const l = Math.hypot(o.pts[i][0] - o.pts[i - 1][0], o.pts[i][1] - o.pts[i - 1][1]);
      tramos.push([o.pts[i - 1], o.pts[i], largo, l]);
      largo += l;
    }
    const cab = o.t * o.vel;
    for (let s = Math.max(0, cab - 500); s < Math.min(cab, largo); s += 22) {
      const tr = tramos.find((q) => s >= q[2] && s <= q[2] + q[3]);
      if (!tr) continue;
      const u = (s - tr[2]) / tr[3],
        x = tr[0][0] + (tr[1][0] - tr[0][0]) * u,
        y = tr[0][1] + (tr[1][1] - tr[0][1]) * u,
        k = 1 - (cab - s) / 500;
      DIB.alfa(c, k * Math.max(0, 1 - (o.t * o.vel - largo) / 600), () => DIB.E(c, x + Math.sin(s * 0.05) * 8, y, 7, 4, k > 0.85 ? DIB.RUNICO_CLARO : DIB.RUNICO));
    }
  }
  // la columna de luz sobre el objetivo y la flecha en el borde si está fuera de pantalla
  function dondeObjetivo() {
    const o = H.objetivo();
    if (!o || !o.donde) return null;
    if (npcs[o.donde]) return [npcs[o.donde].x, npcs[o.donde].y];
    if (o.donde === "ciervo") return ciervo.derrotado ? null : [ciervo.x, ciervo.y];
    return P[o.donde] || null;
  }
  // rgb/col: el color del haz y de la flecha (rúnico para la misión, dorado para la marca propia del mapa)
  function dibujarHaz(p, x0, y0, x1, y1, rgb = "115,213,219", col = DIB.RUNICO) {
    if (!p || ciervo.activo || dist(jug, p) < 7 * 30) return;
    const vis = p[0] > x0 && p[0] < x1 && p[1] > y0 && p[1] < y1 + 200;
    if (vis) {
      c.save();
      const g = c.createLinearGradient(0, p[1] - 700, 0, p[1]);
      g.addColorStop(0, `rgba(${rgb},0)`);
      g.addColorStop(1, `rgba(${rgb},0.28)`);
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(p[0] - 10, p[1] - 700);
      c.lineTo(p[0] + 10, p[1] - 700);
      c.lineTo(p[0] + 22, p[1]);
      c.lineTo(p[0] - 22, p[1]);
      c.fill();
      c.restore();
      DIB.halo(c, p[0], p[1], 40, col, 0.6 + Math.sin(J.t * 3) * 0.2);
    } else {
      // flecha rúnica en el borde de la vista
      const cx = (x0 + x1) / 2,
        cy = (y0 + y1) / 2,
        a = Math.atan2(p[1] - cy, p[0] - cx),
        rx = (x1 - x0) / 2 - 36,
        ry = (y1 - y0) / 2 - 36,
        k = Math.min(rx / Math.abs(Math.cos(a) || 1e-6), ry / Math.abs(Math.sin(a) || 1e-6));
      const ax = cx + Math.cos(a) * k,
        ay = cy + Math.sin(a) * k;
      c.save();
      c.translate(ax, ay);
      c.rotate(a);
      c.globalAlpha = 0.85;
      DIB.P(c, [16, 0, -10, -12, -4, 0, -10, 12], col);
      c.restore();
    }
  }

  // ---------- la luz ----------
  // cuánto tapa el bosque donde está Eromash (0 en caminos y claros, 1 en lo espeso) y los lugares siempre oscuros
  let amb = { h: 9, n: 0, o: 0, osc: 0.1 };
  function sombraAqui() {
    let s0 = Math.max(0, Math.min(1, (W.ruido(jug.x, jug.y) - 0.3) * 2.2));
    for (const c0 of W.CAMINOS) if (W.distLinea(jug.x, jug.y, c0.p) < c0.w) s0 *= 0.4;
    if (Math.hypot(jug.x - W.CIUDAD.c[0], (jug.y - W.CIUDAD.c[1]) * 1.3) < W.CIUDAD.rx) s0 = 0;
    for (const k of ["tumulo", "claro"]) if (dist(jug, W.LUGARES[k].p) < W.LUGARES[k].r * 1.6) s0 = Math.max(s0, k === "tumulo" ? 1.4 : 0.6);
    return Math.max(s0, J.oscuro || 0);
  }
  // cada asset que alumbra: radio y color (se suma su posición en el mundo)
  const LUZ_ASSET = {
    farol: [300, "#FFD98A", 14, -70],
    piedraLinde: [200, "#73D5DB", 0, -34],
    torreVigia: [320, "#FFD98A", 0, -150],
    puertaSur: [380, "#FFD98A", 0, -120],
    herreriaAsa: [420, "#FF8D71", 30, -40],
    hongoDorado: [380, "#FFD98A", 0, -60],
    piedraMuralla: [200, "#73D5DB", 0, -60],
    piedraAncla: [300, "#73D5DB", 0, -110],
    portonPuesto: [300, "#FFD98A", -134, -128],
    posteFarol: [280, "#FFD98A", 26, -94],
    mojon: [160, "#73D5DB", 0, -50],
    fogonOlla: [380, "#FF8D71", 0, -20],
    piedraVioleta: [260, "#9A6BD8", 0, -70],
    puertaNorte: [360, "#FFD98A", 0, -190],
    pedestalPaso: [260, "#73D5DB", 0, -50],
    soporteAtadura: [220, "#9A6BD8", 0, -40],
    santuario: [380, "#73D5DB", 0, -80],
    hongosRocio: [70, "#73D5DB", 0, -6],
    runaRefugio: [360, "#73D5DB", 0, -40],
    losaPatio: [200, "#73D5DB", 0, 0],
  };
  function juntarLuces(x0, y0, x1, y1) {
    const L0 = [];
    const n = amb.n;
    // la lámpara de Eromash: se ve siempre un poco alrededor (más grande con la mejora de Ása)
    L0.push({ x: jug.x, y: jug.y - 30, r: (n > 0.3 ? 260 : 200) * (J.lampara || 1), col: "#FFD98A", f: 0.95 });
    W.cercanas(x0 - 400, y0 - 400, x1 + 400, y1 + 400, (o) => {
      const l = LUZ_ASSET[o.id];
      if (!l || o.oculto) return;
      let f = 1;
      if (o.id === "runaRefugio" || o.id === "pedestalPaso" || o.id === "losaPatio") f = o.o.luz || 0;
      if (o.id === "soporteAtadura" && (o.o.roto || !o.o.visto)) f = 0.3;
      if (o.id === "piedraAncla" || o.id === "mojon") f = o.o.fuerza != null ? o.o.fuerza : o.o.luz;
      if ((o.id === "fogonOlla" && o.o.apagado) || (o.id === "posteFarol" && !o.o.encendido)) f = 0;
      if (f > 0) L0.push({ x: o.x + l[2] * (o.o.s || 1), y: o.y + l[3] * (o.o.s || 1), r: l[0] * (o.o.s || 1), col: l[1], f: f * (0.9 + Math.sin(J.t * 7 + o.x) * 0.06) });
    });
    if (n > 0.2) W.DECO.forEach((d) => d.id === "hongosRocio" && d.x > x0 - 80 && d.x < x1 + 80 && d.y > y0 - 80 && d.y < y1 + 80 && L0.push({ x: d.x, y: d.y, r: 80, col: "#73D5DB", f: 0.6 }));
    for (const e of enemigos) if (e.activo && !e.muerto && e.d.luz && e.x > x0 - 300 && e.x < x1 + 300 && e.y > y0 - 300 && e.y < y1 + 300) L0.push({ x: e.x, y: e.y - 60, r: 240, col: ["#8CF0B4", "#73D5DB", "#9A6BD8"][e.pal || 0], f: 0.9 });
    if (nucleoSuelo) L0.push({ x: nucleoSuelo.x, y: nucleoSuelo.y, r: 200, col: "#73D5DB", f: 1 });
    if (ciervo.activo || ciervo.mostrarAtaduras) L0.push({ x: ciervo.x, y: ciervo.y - 80, r: 340, col: "#73D5DB", f: 0.8 });
    J.ondas.forEach((o) => o.tipo === "pulso" && L0.push({ x: o.x, y: o.y, r: 200 + o.t * 900, col: "#73D5DB", f: Math.max(0, 1 - o.t / 0.7) }));
    cadaSis("luces", (l) => L0.push(l), x0, y0, x1, y1);
    return L0;
  }

  function dibujar() {
    if (J.dentro) return J.dentro.dibujar(c, cw, ch);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#33301F";
    c.fillRect(0, 0, cw, ch);
    const sx = J.cam.sac > 0 ? (Math.random() - 0.5) * J.cam.sac * 14 : 0,
      sy = J.cam.sac > 0 ? (Math.random() - 0.5) * J.cam.sac * 14 : 0;
    const vw = cw / esc,
      vh = ch / esc,
      x0 = J.cam.x - vw / 2 + sx,
      y0 = J.cam.y - vh / 2 + sy,
      x1 = x0 + vw,
      y1 = y0 + vh;
    c.setTransform(esc, 0, 0, esc, -x0 * esc, -y0 * esc);
    W.dibujarPiso(c, x0, y0, x1, y1, escBase);
    cadaSis("fondo", c, x0, y0, x1, y1);
    // lo que va en el piso
    J.marcas.forEach(dibujarMarca);
    J.zonas.forEach((a) => CB.dibujarAviso(c, a));
    J.avisos.forEach((a) => CB.dibujarAviso(c, a));
    // con mando, el anillo bajo la criatura a la que va el próximo golpe
    if (J.modo === "juego" && (CONTROLES.mando() || !mouse.usado) && (!window.OPCIONES || OPCIONES.v("apuntar"))) {
      const o = objetivoCerca(Math.atan2(jug.dir[1], jug.dir[0]));
      if (o) DIB.alfa(c, 0.55 + Math.sin(J.t * 6) * 0.15, () => {
        c.beginPath();
        c.ellipse(o.x, o.y, o.d.radio * o.s + 14, (o.d.radio * o.s + 14) * 0.4, 0, 0, DIB.TAU);
        c.strokeStyle = "#F2ECEC";
        c.lineWidth = 3;
        c.stroke();
      });
    }
    cadaSis("piso", c, x0, y0, x1, y1);
    J.ondas.forEach(dibujarOnda);
    if (nucleoSuelo) ASSETS.dibujar(c, "nucleo", nucleoSuelo.x, nucleoSuelo.y, J.t, {});
    // todo lo que tiene altura, ordenado por la línea del piso
    const lista = [];
    W.cercanas(x0 - 300, y0 - 100, x1 + 300, y1 + 420, (o) => {
      if (o.oculto || o.x < x0 - 320 || o.x > x1 + 320 || o.y < y0 - 40 || o.y - o.alto * 1.2 > y1) return;
      lista.push({ y: o.y + (o.o.orden || 0), f: () => dibujarCosa(o), cosa: o }); // o.orden: adelante / atrás del editor
    });
    W.DECO.forEach((d) => {
      if (d.id === "hongosRocio" && d.x > x0 - 40 && d.x < x1 + 40 && d.y > y0 && d.y < y1 + 40) lista.push({ y: d.y, f: () => ASSETS.dibujar(c, d.id, d.x, d.y, J.t, { sem: d.sem }) });
    });
    const visible = (x, y) => x > x0 - 200 && x < x1 + 200 && y > y0 - 50 && y < y1 + 300;
    Object.values(npcs).forEach((n) => visible(n.x, n.y) && lista.push({ y: n.y, f: () => dibujarNpc(n) }));
    trabajadores.forEach((n) => visible(n.x, n.y) && lista.push({ y: n.y, f: () => GENTE.dibujar(c, n.id, n.x, n.y, J.t, { vista: n.mira.vista, espejo: n.mira.espejo, camina: n.camina, hablando: n.hablando }) }));
    enemigos.forEach((e) => e.activo && e.muerto < 0.8 && visible(e.x, e.y) && lista.push({ y: e.y, f: () => CB.dibujar(c, e, J.t) }));
    if (visible(ciervo.x, ciervo.y) && (ciervo.activo || ciervo.derrotado || ciervo.mostrarAtaduras || H.completa("EL-04"))) lista.push({ y: ciervo.y, f: () => CB.dibujarCiervo(c, ciervo, J.t) });
    cadaSis("objetos", lista, visible, c);
    lista.push({ y: window.ALTURAS ? ALTURAS.orden() : jug.y, f: dibujarJugador, jugador: true });
    lista.sort((a, b) => a.y - b.y);
    lista.forEach((d) => d.f());
    siluetaJugador(lista);
    if (window.ALTURAS) ALTURAS.velo(c, lienzo, x0, y0, esc, cw, ch);
    // la luz y la niebla van encima del mundo; chispas y números quedan encima de la luz para leerse siempre
    LUZ.niebla(c, x0, y0, vw, vh, J.t, 0.35 + amb.n * 0.9);
    LUZ.dibujar(c, cw, ch, x0, y0, esc, juntarLuces(x0, y0, x1, y1), amb, J.t);
    c.setTransform(esc, 0, 0, esc, -x0 * esc, -y0 * esc);
    J.fx.forEach((f) => DIB.alfa(c, Math.max(0, f.t / 0.35), () => DIB.R(c, f.x - f.s / 2, f.y - f.s / 2, f.s, f.s, f.c)));
    c.font = '800 18px "Eromash Text", system-ui, sans-serif';
    c.textAlign = "center";
    J.textos.forEach((n) => {
      c.globalAlpha = Math.max(0, 1 - n.t / 0.9);
      c.font = n.grande ? '800 26px "Eromash Text", system-ui, sans-serif' : n.palabra ? '800 15px "Eromash Text", system-ui, sans-serif' : '800 18px "Eromash Text", system-ui, sans-serif';
      c.lineWidth = 4;
      c.strokeStyle = "#0A0707";
      c.strokeText(n.n, n.x, n.y - n.t * 40);
      c.fillStyle = n.col || "#F2ECEC";
      c.fillText(n.n, n.x, n.y - n.t * 40);
    });
    c.globalAlpha = 1;
    // el rombo rúnico sobre lo que se usa con E ahora (la persona, la cosa)
    if (J.cerca && J.cerca.x != null) {
      const bx = J.cerca.x,
        by = J.cerca.y + Math.sin(J.t * 4) * 5;
      DIB.halo(c, bx, by, 26, "#73D5DB", 1);
      c.beginPath();
      c.moveTo(bx, by - 11);
      c.lineTo(bx + 8, by);
      c.lineTo(bx, by + 11);
      c.lineTo(bx - 8, by);
      c.closePath();
      c.fillStyle = "#73D5DB";
      c.fill();
      c.strokeStyle = "#0A0707";
      c.lineWidth = 2;
      c.stroke();
    }
    dibujarHaz(dondeObjetivo(), x0, y0, x1, y1);
    if (window.MAPA) dibujarHaz(MAPA.marca(), x0, y0, x1, y1, "255,217,138", "#FFD98A");
    // el aire del bosque: viñeta suave (se apaga en calidad baja)
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (!window.CALIDAD || CALIDAD.nivel !== "baja") {
      if (!vineta || vineta.w !== cw || vineta.h !== ch) {
        const g = c.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.max(cw, ch) * 0.75);
        g.addColorStop(0, "rgba(10,14,12,0)");
        g.addColorStop(1, "rgba(10,14,12,0.55)");
        vineta = { g, w: cw, h: ch };
      }
      c.fillStyle = vineta.g;
      c.fillRect(0, 0, cw, ch);
    }
    // con poca vida el borde late en rojo
    if (J.modo === "juego" && !jug.muerto && jug.hp < jug.hpMax * 0.3) {
      const f = (0.3 + 0.5 * (1 - jug.hp / (jug.hpMax * 0.3))) * (0.75 + Math.sin(J.t * 6) * 0.25);
      const g = c.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.3, cw / 2, ch / 2, Math.max(cw, ch) * 0.6);
      g.addColorStop(0, "rgba(156,35,21,0)");
      g.addColorStop(1, `rgba(156,35,21,${Math.min(0.6, f).toFixed(3)})`);
      c.fillStyle = g;
      c.fillRect(0, 0, cw, ch);
    }
    cunasGolpe(cw, ch);
    flechasAmenaza(x0, y0, x1, y1);
  }
  // las cuñas rojas de los golpes recibidos, en el borde del lado de donde vinieron (se van en medio segundo)
  function cunasGolpe(cw, ch) {
    for (let i = golpesDir.length - 1; i >= 0; i--) {
      const g = golpesDir[i],
        e = J.t - g.t0;
      if (e > 0.7 || e < 0) {
        golpesDir.splice(i, 1);
        continue;
      }
      const k = 1 - e / 0.7,
        r = Math.max(cw, ch) / 2,
        cx = cw / 2,
        cy = ch / 2;
      c.save();
      c.globalAlpha = k;
      const gr = c.createRadialGradient(cx, cy, r * 0.5, cx, cy, r);
      gr.addColorStop(0, "rgba(200,64,45,0)");
      gr.addColorStop(1, "rgba(200,64,45,0.9)");
      c.fillStyle = gr;
      c.beginPath();
      c.moveTo(cx, cy);
      c.arc(cx, cy, r * 1.5, g.a - 0.4, g.a + 0.4);
      c.closePath();
      c.fill();
      c.restore();
    }
  }
  // una flecha roja en el borde por cada criatura que viene a pegarle desde fuera de la pantalla
  function flechasAmenaza(x0, y0, x1, y1) {
    if (J.modo !== "juego" || jug.muerto || (window.OPCIONES && !OPCIONES.v("flechas"))) return;
    const m = 46;
    for (const e of enemigos) {
      if (!e.activo || e.muerto || (e.estado !== "persigue" && e.estado !== "aviso" && e.estado !== "golpe")) continue;
      if (e.x > x0 && e.x < x1 && e.y - 60 > y0 && e.y < y1) continue;
      if (Math.hypot(e.x - jug.x, e.y - jug.y) > 1600) continue;
      const sx = (jug.x - x0) * esc,
        sy = (jug.y - 40 - y0) * esc,
        a = Math.atan2(e.y - jug.y, e.x - jug.x),
        ux = Math.cos(a),
        uy = Math.sin(a);
      // hasta dónde llega el rayo desde Eromash antes de salir del margen
      const tx = ux > 0 ? (cw - m - sx) / ux : ux < 0 ? (m - sx) / ux : Infinity,
        ty = uy > 0 ? (ch - m - sy) / uy : uy < 0 ? (m - sy) / uy : Infinity,
        tt = Math.min(tx, ty),
        px = sx + ux * tt,
        py = sy + uy * tt;
      const k = e.estado === "aviso" || e.estado === "golpe" ? 1 : 0.7;
      c.save();
      c.translate(px, py);
      c.rotate(a);
      c.scale(1.3, 1.3);
      c.globalAlpha = k * (0.75 + Math.sin(J.t * 9) * 0.2);
      c.beginPath();
      c.moveTo(18, 0);
      c.lineTo(-10, -13);
      c.lineTo(-4, 0);
      c.lineTo(-10, 13);
      c.closePath();
      c.fillStyle = e.estado === "aviso" ? "#FF8D71" : "#C8402D";
      c.fill();
      c.strokeStyle = "#0A0707";
      c.lineWidth = 3;
      c.stroke();
      c.restore();
    }
  }
  let vineta = null;
  // dibuja a Eromash en otro lugar y a otra escala (los interiores): se presta la posición un instante
  function dibujarJugadorEn(ctx, x, y, k) {
    const px = jug.x,
      py = jug.y,
      pz = jug.z,
      c0 = c;
    jug.x = x;
    jug.y = y;
    jug.z = 0;
    c = ctx;
    c.save();
    c.translate(x, y);
    c.scale(k, k);
    c.translate(-x, -y);
    try {
      dibujarJugador();
    } finally {
      c.restore();
      c = c0;
      jug.x = px;
      jug.y = py;
      jug.z = pz;
    }
  }
  // ---------- la silueta de Eromash detrás de las cosas ----------
  // Cuando un árbol, una casa o una piedra lo tapa, se ve su figura en un tono casi blanco a través del objeto.
  // Se dibuja Eromash aparte, se recorta con lo que tiene delante (solo donde lo tapa) y se pinta claro encima.
  let enSilueta = false;
  const silCv = document.createElement("canvas"),
    silC = silCv.getContext("2d"),
    tapaCv = document.createElement("canvas"),
    tapaC = tapaCv.getContext("2d");
  function siluetaJugador(lista) {
    if (jug.muerto) return;
    const zj = jug.z || 0,
      clave = window.ALTURAS ? ALTURAS.orden() : jug.y;
    const bx = jug.x - 100,
      by = jug.y - zj - 150,
      bw = 200,
      bh = 170;
    const tapan = lista.filter((d) => d.cosa && d.y > clave && !d.cosa.o.piso && d.cosa.y - d.cosa.alto * 1.3 < jug.y - zj && Math.abs(d.cosa.x - jug.x) < 420);
    if (!tapan.length) return;
    const w = Math.ceil(bw * esc),
      h = Math.ceil(bh * esc);
    if (silCv.width !== w || silCv.height !== h) {
      silCv.width = tapaCv.width = w;
      silCv.height = tapaCv.height = h;
    }
    // lo que tapa, opaco, en el mismo encuadre
    tapaC.setTransform(1, 0, 0, 1, 0, 0);
    tapaC.clearRect(0, 0, w, h);
    tapaC.setTransform(esc, 0, 0, esc, -bx * esc, -by * esc);
    tapan.forEach((d) => ASSETS.dibujar(tapaC, d.cosa.id, d.cosa.x, d.cosa.y, J.t, d.cosa.o));
    // Eromash solo, sin su sombra
    silC.setTransform(1, 0, 0, 1, 0, 0);
    silC.globalCompositeOperation = "source-over";
    silC.clearRect(0, 0, w, h);
    silC.setTransform(esc, 0, 0, esc, -bx * esc, -by * esc);
    c = silC;
    enSilueta = true;
    try {
      dibujarJugador();
    } finally {
      c = principal;
      enSilueta = false;
    }
    silC.setTransform(1, 0, 0, 1, 0, 0);
    silC.globalCompositeOperation = "destination-in";
    silC.drawImage(tapaCv, 0, 0);
    silC.globalCompositeOperation = "source-in";
    silC.fillStyle = "#F2ECEC";
    silC.fillRect(0, 0, w, h);
    silC.globalCompositeOperation = "source-over";
    c.save();
    c.globalAlpha = 0.7;
    c.drawImage(silCv, bx, by, w / esc, h / esc);
    c.restore();
  }
  // árboles y casas que tapan a Eromash se vuelven transparentes
  function dibujarCosa(o) {
    let a = 1;
    if (o.alto > 90 && o.y > jug.y && o.y - jug.y < o.alto * 0.9) {
      const ancho = o.o.ancho || (o.choque && o.choque.w ? o.choque.w / 2 + 30 : 40 * (o.o.s || 1) + 20);
      if (Math.abs(jug.x - o.x) < ancho) a = 0.62;
    }
    // la copa de los gigantes tapa desde muy arriba: [desde, hasta, ancho] medidos desde el pie del árbol
    const cp = o.o.copa;
    if (cp && o.y > jug.y && o.y - jug.y > cp[0] - 40 && o.y - jug.y < cp[1] && Math.abs(jug.x - o.x) < cp[2]) a = 0.62;
    if (a < 1) DIB.alfa(c, a, () => ASSETS.dibujar(c, o.id, o.x, o.y, J.t, o.o));
    else ASSETS.dibujar(c, o.id, o.x, o.y, J.t, o.o);
  }

  // ---------- HUD de cada cuadro ----------
  function actualizarHud() {
    HUD.jugador(jug.hp, jug.hpMax, jug.sta, jug.staMax, jug.cansado);
    // el retrato, la plata y la barra de acciones de abajo
    const pr = H.E.extra.prologo,
      ren = window.SECUNDARIAS ? SECUNDARIAS.renombre() : 0;
    HUD.retrato((pr && pr.nombre) || "Eromash", t("sc.renombre_" + ren), jug.hp < jug.hpMax * 0.3 ? "hurt" : "calm");
    const pe = PODERES.estado();
    if (pe) {
      HUD.bolsillo(pe.plata, pe.frag, pe.nivel);
      HUD.barra([
        { id: "atacar", icono: "espada", nivel: pe.espada, accion: "atacar", nombre: t("inv.b_atacar"), listo: true },
        { id: "esquivar", icono: "esquivar", accion: "esquivar", nombre: t("inv.b_esquivar"), listo: jug.sta >= 20 && !jug.cansado },
        { id: "saltar", icono: "saltar", accion: "saltar", nombre: t("inv.b_saltar"), listo: true },
        { id: "runa", runa: pe.runa, accion: "runa", nombre: pe.runa ? t("pj.runa_" + pe.runa) : t("inv.b_runa"), listo: !!pe.runa && pe.energia >= pe.coste, energia: pe.energia / 100, col: pe.col, grande: true },
        { id: "lente", icono: "lente", accion: "lente", nombre: t("inv.b_lente"), listo: tieneLente() && lenteEspera <= 0, espera: tieneLente() ? lenteEspera / 1.2 : 0 },
        { id: "mochila", icono: "mochila", accion: "inventario", nombre: t("inv.b_mochila"), listo: true },
      ]);
    }
    const o = H.objetivo(),
      m = H.idMision();
    const p = dondeObjetivo();
    // la misión de la historia: los objetivos cumplidos y el actual
    const mis = H.mision(),
      lista = [];
    if (mis) {
      const objs = [];
      const txt = (ob) => tav(ob.texto, ob.cuenta ? [Math.min(H.cuenta(ob.cuenta[0]), ob.cuenta[1]), ob.cuenta[1]] : undefined);
      for (const ob of mis.objetivos) {
        if (tiene(ob.hecho)) objs.push({ texto: txt(ob), estado: "hecho" });
        else {
          objs.push({ texto: txt(ob), estado: "actual", metros: p ? Math.max(1, dist(jug, p) / 43) : null });
          break;
        }
      }
      lista.push({ rotulo: t("ui.mision", [H.etapa()]), nombre: tav("mision_" + m), objetivos: objs });
    } else lista.push({ rotulo: tav("mision_fin"), nombre: tav("obj_fin"), objetivos: [] });
    SIS.forEach((s0) => {
      const sg = s0.seguimiento && s0.seguimiento();
      if (sg) lista.push(sg);
    });
    HUD.misiones(lista);
    const cer = J.modo === "juego" && !jug.muerto ? (J.dentro ? J.dentro.cercano() : cercano()) : null;
    J.cerca = J.dentro ? null : cer;
    HUD.accion(cer ? cer.texto : null, CONTROLES.glifo("interactuar"));
    HUD.canal(J.modo === "juego" && jug.interactuando > 0 && jug.canalTotal >= 0.6 ? 1 - jug.interactuando / jug.canalTotal : null);
    // en pelea el rastreador se aparta (queda tenue) para que se vea lo que importa
    document.getElementById("hudMisiones").classList.toggle("atenuado", J.modo === "juego" && enPelea());
    cadaSis("hud");
    HUD.jefe(ciervo.activo ? { nombre: tav("nombre_ciervo"), frac: ciervo.vida / CB.VIDA_C, ataduras: CB.atados(ciervo), ataque: jefeAtaque, accion: jefeAccion } : J.jefeHud || null);
  }

  // ---------- menús ----------
  function tiempoTxt(s) {
    return tav("ranura_tiempo", [Math.floor(s / 3600), Math.floor((s % 3600) / 60)]);
  }
  function titulo() {
    J.modo = "menu";
    HUD.ocultarJuego(true);
    const r = H.reciente();
    const botones = [];
    if (r) botones.push({ texto: tav("titulo_continuar"), sub: tav("ranura", [r]) + " · " + H.resumen(r).mision, fn: () => empezar(r, false) });
    botones.push({ texto: tav("titulo_nueva"), fn: elegirRanura });
    botones.push({ texto: t("ui.idioma") + " · " + (I18N.lang === "es" ? "Español" : "English"), fn: () => {
      I18N.setLang(I18N.lang === "es" ? "en" : "es");
      location.reload();
    } });
    botones.push({ texto: t("ui.calidad") + " · " + t("ui.calidad." + (window.CALIDAD ? CALIDAD.nivel : "alta")), fn: () => {
      if (!window.CALIDAD) return;
      const n = CALIDAD.NIVELES;
      CALIDAD.nivel = n[(n.indexOf(CALIDAD.nivel) + 1) % n.length];
      titulo();
    } });
    botones.push({ texto: t("op.titulo"), fn: () => OPCIONES.abrir(titulo) });
    HUD.abrir(`<h1>Eromash</h1><div class="sub">${tav("juego_subtitulo")}</div>`, botones, { clase: "titulo" });
    // de fondo, el mago escribe en su escritorio
    if (window.PROLOGO) PROLOGO.mostrar();
    const nota = document.createElement("div");
    nota.className = "nota";
    nota.textContent = (CONTROLES.mando() ? t("ui.controles_mando") : t("ui.controles")) + " · " + tav("titulo_mvp");
    document.getElementById("capaCaja").appendChild(nota);
  }
  function elegirRanura() {
    const bot = [1, 2, 3].map((n) => {
      const r = H.resumen(n);
      return { texto: tav("ranura", [n]), sub: r ? (r.nombre ? t("pl.saga_de", [r.nombre]) + " · " : "") + r.mision + " · " + tiempoTxt(r.tiempo) : tav("ranura_vacia"), fn: () => {
        if (r && !confirmar[n]) {
          confirmar[n] = true;
          HUD.aviso(tav("ranura_reemplazar"));
          return;
        }
        nuevaConMago(n);
      } };
    });
    bot.push({ texto: t("ui.cerrar"), fn: titulo });
    HUD.abrir(`<h2>${tav("ranuras_nueva")}</h2>`, bot, { clase: "titulo" });
  }
  // una partida nueva empieza con las preguntas del mago; lo que se contesta queda en la partida
  function nuevaConMago(n) {
    if (!window.PROLOGO) return empezar(n, true);
    PROLOGO.preguntas((datos) => empezar(n, true, datos));
  }
  const confirmar = {};
  function empezar(n, nueva, prologo) {
    if (nueva) H.nueva(n);
    else H.cargar(n);
    if (window.PROLOGO) PROLOGO.ocultar();
    const E = H.E;
    if (prologo) E.extra.prologo = prologo;
    const ini = W.mas(W.LUGARES.puesto.p, -16, 8);
    if (E.pos) {
      jug.x = E.pos[0];
      jug.y = E.pos[1];
    } else {
      jug.x = ini[0];
      jug.y = ini[1];
    }
    if (!W.libre(jug.x, jug.y, R)) {
      const p = P[H.REAPARECER[H.idMision()] || "puesto"];
      jug.x = p[0];
      jug.y = p[1];
    }
    jug.hp = E.salud || 100;
    J.cam.x = jug.x;
    J.cam.y = jug.y;
    lugarTrab = "";
    for (const id in npcs) npcs[id].lugar = "";
    escenario();
    ubicarGente(true);
    cadaSis("alEmpezar", E.extra);
    HUD.cerrar();
    HUD.ocultarJuego(false);
    J.modo = "juego";
    CONTROLES.soltar();
    etapaVista = H.etapa();
    etapaDesde = J.t;
    // al seguir una partida guardada, un recordatorio de en qué andaba
    if (!nueva && H.mision()) J.retrasar(1.5, () => HUD.aviso(tav("mision_" + H.idMision()), "lugar", t("mj.tu_mision")));
  }
  // la tarjeta de la pausa: misión, dónde está, cuánto exploró, plata y tiempo de juego
  function tarjetaPausa() {
    const fila = (k, v) => `<div><small>${t(k)}</small><b>${v}</b></div>`;
    let h = "";
    if (H.mision()) h += fila("ui.pausa_mision", tav("mision_" + H.idMision()));
    if (window.MAPA) h += fila("ui.pausa_lugar", MAPA.lugarAqui()) + fila("ui.pausa_explorado", Math.floor(MAPA.explorado() * 100) + " %");
    h += fila("ui.pausa_jugado", tiempoTxt(H.E.tiempo || 0));
    return `<div class="tarjeta-pausa">${h}</div>`;
  }
  function pausa() {
    J.modo = "menu";
    HUD.abrir(`<h2>${tav("pausa_titulo")}</h2>${tarjetaPausa()}`, [
      { texto: tav("pausa_seguir"), fn: cerrarMenu },
      { texto: tav("pausa_guardar"), fn: () => {
        if (H.guardar()) HUD.aviso(tav("partida_guardada"));
        cerrarMenu();
      } },
      { texto: tav("diario_titulo"), fn: diario },
      { texto: t("op.titulo"), fn: () => OPCIONES.abrir(pausa) },
      { texto: tav("pausa_titulo_menu"), fn: () => {
        H.guardar();
        titulo();
      } },
    ]);
  }
  // el diario se lee en la pestaña Diario de la mochila (inventario.js)
  function htmlDiario() {
    const lista = H.E.diario.length ? H.E.diario.map((k) => `<p>${tav(k)}</p>`).join("") : `<p>${t("ui.diario_vacio")}</p>`;
    let extra = "";
    const pr = H.E.extra.prologo;
    if (pr && pr.nombre) extra += `<div class="diario-resumen"><p>${t("pl.diario", [pr.nombre, t("pl.signo_corto_" + pr.signo)])}</p></div>`;
    const ob = H.objetivo();
    if (H.mision() && ob) extra = `<div class="diario-resumen"><p><b>${tav("mision_" + H.idMision())}</b> ${t("mj.diario_ahora", [textoObjetivo(ob)])}</p></div>` + extra;
    SIS.forEach((s0) => s0.diario && (extra += s0.diario()));
    return `<h2>${tav("diario_titulo")}</h2>${extra}<div class="diario-lista">${lista}</div>`;
  }
  J.htmlDiario = htmlDiario;
  const diario = () => INVENTARIO.abrir("diario");
  function mostrarFin() {
    J.modo = "menu";
    HUD.abrir(`<h2>${tav("fin_titulo")}</h2><p>${tav("fin_texto")}</p>`, [{ texto: tav("fin_seguir"), fn: cerrarMenu }]);
  }
  function cerrarMenu() {
    HUD.cerrar();
    J.modo = "juego";
    CONTROLES.soltar();
  }

  // ---------- bucle ----------
  let antes = performance.now(),
    autoguardado = 0;
  function cuadro(ahora) {
    let dt = Math.min(0.05, (ahora - antes) / 1000);
    antes = ahora;
    CONTROLES.actualizar();
    if (J.modo === "menu") {
      if (!INVENTARIO.paso()) HUD.pasoMenu();
      if (CONTROLES.recien("mapa") && document.getElementById("mapaLienzo")) cerrarMenu();
      if (CONTROLES.recien("pausa") && H.E && J.cam.x) {
        if (document.querySelector("#capaCaja h1") == null) cerrarMenu();
      }
    } else if (J.modo === "dialogo") {
      if (CONTROLES.recien("seguir") || CONTROLES.recien("interactuar") || CONTROLES.recien("atacar")) seguirDialogo();
      else if (dlg && dlg.solo && (dlg.solo -= dt) <= 0) seguirDialogo();
    } else if (J.modo === "juego") {
      if (CONTROLES.recien("misiones")) HUD.plegarTodo();
      if (!J.dentro && CONTROLES.pulsado("acercar")) cambiarZoom(-dt * 0.6);
      if (!J.dentro && CONTROLES.pulsado("alejar")) cambiarZoom(dt * 0.6);
      if (CONTROLES.recien("pausa")) pausa();
      else if (CONTROLES.recien("diario")) diario();
    }
    if (J.dentro && (J.modo === "juego" || J.modo === "dialogo")) {
      // adentro de una casa el bosque queda en pausa
      J.t += dt;
      H.E.tiempo += dt;
      J.timers.forEach((tm) => (tm.t -= dt));
      J.timers.filter((tm) => tm.t <= 0).forEach((tm) => tm.fn());
      J.timers = J.timers.filter((tm) => tm.t > 0);
      J.dentro.paso(dt);
    } else if (J.modo === "juego" || J.modo === "dialogo" || J.modo === "cine") {
      // la pausa del golpe y la cámara lenta de la esquiva justa
      if (J.hitstop > 0) {
        J.hitstop -= dt;
        dt *= 0.05;
      } else if (J.camLenta > 0) {
        J.camLenta -= dt;
        dt *= 0.35;
      }
      J.t += dt;
      H.E.tiempo += dt;
      actualizarJugador(dt);
      actualizarGente(dt);
      for (const e of enemigos) if (e.estado !== "quieto" || (Math.abs(e.x - jug.x) < 2600 && Math.abs(e.y - jug.y) < 2000)) CB.actualizar(J, e, dt);
      J.timers.forEach((tm) => (tm.t -= dt));
      J.timers.filter((tm) => tm.t <= 0).forEach((tm) => tm.fn());
      J.timers = J.timers.filter((tm) => tm.t > 0);
      J.zonas.forEach((z) => {
        z.t += dt;
        if (!jug.muerto && jug.salto <= 0 && CB.contiene(z, jug.x, jug.y)) {
          jug.hp -= z.dps * dt;
          jug.sinGolpe = 0;
          if (jug.hp <= 0) morir();
        }
      });
      J.zonas = J.zonas.filter((z) => z.t < z.dur);
      alejarMeta = zoomJug;
      J.oscuro = 0; // un sistema puede oscurecer el lugar mientras lo pida cada cuadro (las raíces de Góinn)
      cadaSis("actualizar", dt);
      alejar += (alejarMeta - alejar) * Math.min(1, dt * 1.2);
      esc = escBase / alejar;
      amb = LUZ.ambiente(H.E.tiempo, sombraAqui(), dt);
      if (J.oscuro) amb = Object.assign({}, amb, { n: Math.max(amb.n, 0.8), o: 0 });
      CB.actualizarCiervo(J, ciervo, dt);
      J.avisos.forEach((a) => (a.t += dt));
      J.marcas.forEach((m) => (m.t += dt));
      J.marcas = J.marcas.filter((m) => m.t < 33);
      J.ondas.forEach((o) => (o.t += dt));
      J.ondas = J.ondas.filter((o) => o.t < (o.tipo === "pulso" ? 0.8 : 8));
      J.fx.forEach((f) => {
        f.t -= dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.vy += 600 * (f.g != null ? f.g : 1) * dt;
      });
      J.fx = J.fx.filter((f) => f.t > 0);
      J.textos.forEach((n) => (n.t += dt));
      J.textos = J.textos.filter((n) => n.t < 0.9);
      zonas();
      pistaSiHaceFalta();
      sonidoDelMundo(dt);
      actualizarCamara(dt);
      autoguardado += dt;
      if (autoguardado > 30) {
        autoguardado = 0;
        H.guardar();
      }
    } else J.t += dt * 0.3; // en el título el bosque se mueve despacio de fondo
    dibujar();
    if (J.modo !== "menu") actualizarHud();
    requestAnimationFrame(cuadro);
  }

  // ---------- arranque ----------
  HUD.armar();
  addEventListener("beforeunload", () => J.modo !== "titulo" && H.guardar());
  // si se va a otra ventana o pestaña en plena partida, el juego se pausa solo (y guarda)
  const alIrse = () => {
    if (J.modo === "juego" && !jug.muerto && !J.dentro) {
      H.guardar();
      pausa();
    }
  };
  document.addEventListener("visibilitychange", () => document.hidden && alIrse());
  addEventListener("blur", alIrse);
  // fondo del título: el Puesto de Eydis
  const fondo = W.LUGARES.puesto.p;
  J.cam.x = fondo[0];
  J.cam.y = fondo[1];
  jug.x = fondo[0] - 10000; // fuera de vista mientras está el título
  escenario();
  ubicarGente(true);
  // ?ver=lugar: arranca directo en un lugar (para revisar y sacar capturas)
  const q = new URLSearchParams(location.search);
  window.JUEGO = { J, empezar, H, W, ciervo, npcs, enemigos };
  // lo que los sistemas pueden usar del motor
  const A = {
    J, jug, W, H, CB, P, N, enemigos, npcs, ciervo, dist, tav, t, chispa, numero, ondaPor, dialogoLibre, cercano, dibujarJugadorEn,
    avisar: (k, col) => HUD.aviso(t(k), col),
    menu: (html, botones) => {
      J.modo = "menu";
      HUD.abrir(html, botones);
    },
    cerrarMenu,
    usarLente,
    trabajadores: () => trabajadores,
    mouse: () => mouse,
    hora: () => amb.h,
    noche: () => amb.n,
    amb: () => amb,
    enPelea,
    dondeObjetivo,
    // el viaje: columna de luz rúnica al irse y al llegar, el nombre del lugar y un instante sin que nada lo toque
    teletransportar: (x, y, lugar) => {
      J.modo = "cine";
      columnaRunica(jug.x, jug.y);
      setTimeout(() => HUD.fundido(true), 180);
      setTimeout(() => {
        jug.x = x;
        jug.y = y;
        jug.atk = null;
        J.cam.x = x;
        J.cam.y = y - 30;
        J.cam.ax = J.cam.ay = 0;
        jug.inv = Math.max(jug.inv, 2);
        HUD.fundido(false);
        columnaRunica(x, y);
        J.modo = "juego";
        CONTROLES.soltar();
        if (lugar) HUD.aviso(t("av.lugar_" + lugar), "lugar", t("sx.viaje_llegaste"));
      }, 620);
    },
  };
  // cada guardado se ve un instante abajo a la derecha
  const guardarHistoria = H.guardar;
  H.guardar = (...a) => {
    const ok = guardarHistoria.apply(H, a);
    if (ok && J.modo !== "titulo") HUD.guardado();
    return ok;
  };
  cadaSis("iniciar", A);
  if (q.get("jugar")) {
    empezar(Number(q.get("jugar")) || 1, true);
    const v = q.get("ver");
    if (v && (P[v] || W.LUGARES[v])) {
      const p = P[v] || W.LUGARES[v].p;
      jug.x = p[0];
      jug.y = p[1] + 40;
      J.cam.x = jug.x;
      J.cam.y = jug.y;
    }
    // ?mision=EL-03: arranca con las misiones anteriores hechas; ?hora=22: a esa hora (Probar del editor)
    const mi = H.MISIONES.findIndex((m) => m.id === q.get("mision"));
    if (mi > 0) {
      for (let i = 0; i < mi; i++) H.MISIONES[i].objetivos.forEach((o) => (H.E.banderas[o.hecho] = true));
      H.E.mision = mi;
      H.avisar("cambio");
    }
    const hr = Number(q.get("hora"));
    if (q.get("hora") && isFinite(hr)) H.E.tiempo = (((hr - 9 + 24) % 24) / 24) * LUZ.DIA;
    // ?en=x,y: aparece ahí (lo elige el editor con Probar en el juego); si cae en algo que choca, al lado libre más cerca
    const en = (q.get("en") || "").split(",").map(Number);
    if (en.length === 2 && en.every(isFinite)) {
      let [x, y] = en;
      for (let r = 0; r < 600 && !W.libre(x, y, R); r += 20) {
        const ok = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => [en[0] + Math.cos((k * Math.PI) / 4) * r, en[1] + Math.sin((k * Math.PI) / 4) * r]).find(([a, b]) => W.libre(a, b, R));
        if (ok) [x, y] = ok;
      }
      jug.x = x;
      jug.y = y;
      J.cam.x = x;
      J.cam.y = y;
    }
  } else titulo();
  requestAnimationFrame(cuadro);
})();
