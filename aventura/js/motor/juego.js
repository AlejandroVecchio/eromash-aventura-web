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
    c = lienzo.getContext("2d");
  let cw = 0,
    ch = 0,
    esc = 1;
  function medir() {
    const k = window.CALIDAD ? CALIDAD.escala() : Math.min(2, devicePixelRatio || 1);
    cw = lienzo.width = Math.round(innerWidth * k);
    ch = lienzo.height = Math.round(innerHeight * k);
    esc = Math.sqrt((cw * ch) / VISTA);
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
  J.sacudir = (f) => (J.cam.sac = Math.max(J.cam.sac, f));
  J.herir = (dano, ox, oy, tipo) => {
    if (jug.muerto || jug.salto > 0 || jug.inv > 0) return; // saltar evita todo; esquivar da invulnerabilidad
    if (J.alHerir) dano = J.alHerir(dano); // el escudo de Algiz se come el golpe
    if (tipo === "helado") jug.lento = 2;
    if (dano <= 0) {
      jug.inv = 0.4;
      return;
    }
    jug.hp -= dano;
    jug.herido = 0.5;
    jug.inv = 0.6;
    jug.sinGolpe = 0;
    const l = Math.hypot(jug.x - ox, jug.y - oy) || 1;
    jug.vx = ((jug.x - ox) / l) * 380;
    jug.vy = ((jug.y - oy) / l) * 380;
    J.sacudir(0.35);
    if (jug.hp <= 0) morir();
  };
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
        const p = [base[0] + Math.cos(tr.i * 1.9) * 70, base[1] + Math.sin(tr.i * 1.9) * 50];
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
    } else if (tipo === "mensaje") avisar(dato, dato === "mision_nueva" ? "#FFD98A" : null);
    else if (tipo === "lugar") HUD.aviso(tav("lugar_" + dato), "lugar", t("ui.lugar_descubierto"));
    else if (tipo === "fin") setTimeout(mostrarFin, 1000);
  });
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
  inter(P.piedra_caida, "accion_levantar_piedra", () => en("EL-02") && tiene("errantes_despejados") && !tiene("piedra_puesta"), () => {
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
  revela(P.menhir, 540, () => en("EL-04") && tiene("pista_raiz") && !tiene("pista_menhir"), () => {
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
    HUD.dialogo(quien, dlg.d.libre ? t(clave, vars) : tav(clave), CONTROLES.glifo("seguir"));
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
    setTimeout(() => HUD.fundido(true), 700);
    setTimeout(() => {
      enemigos.forEach((e) => e.activo && !e.muerto && CB.reiniciar(e));
      J.avisos.length = 0;
      J.zonas.length = 0;
      J.timers.length = 0;
      if (ciervo.activo) CB.reiniciarCiervo(J, ciervo);
      const p = P[H.REAPARECER[H.idMision()] || "puesto"];
      jug.x = p[0];
      jug.y = p[1];
      jug.hp = jug.hpMax;
      jug.sta = jug.staMax;
      jug.muerto = false;
      jug.atk = null;
      J.cam.x = jug.x;
      J.cam.y = jug.y;
      HUD.fundido(false);
      avisar("reapareciste");
    }, 2200);
  }

  // ---------- Eromash ----------
  const VEL = 170,
    VEL_CORRER = 275,
    VEL_ESQ = 520;
  const GOLPES = [
    { wind: 0.08, swing: 0.14, rec: 0.2, arc: 2.3, reach: 78, dano: 16 },
    { wind: 0.08, swing: 0.16, rec: 0.28, arc: 2.5, reach: 84, dano: 22 },
  ];
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
    jug.sinGolpe += dt;
    jug.interactuando = Math.max(0, jug.interactuando - dt);
    jug.lento = Math.max(0, jug.lento - dt);
    lenteEspera = Math.max(0, lenteEspera - dt);
    if (jug.sinGolpe > 6 && !jug.muerto) jug.hp = Math.min(jug.hpMax, jug.hp + 4 * dt);
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
    // estamina: correr y esquivar gastan; se recupera sola
    jug.correr = libre && mov && CONTROLES.pulsado("correr") && !jug.cansado;
    if (jug.correr) jug.sta -= 16 * dt;
    else if (jug.esq <= 0) jug.sta += 22 * dt;
    if (jug.sta <= 0) {
      jug.sta = 0;
      jug.cansado = true;
    }
    if (jug.cansado && jug.sta > 30) jug.cansado = false;
    jug.sta = Math.min(jug.staMax, jug.sta);
    // esquiva
    if (jug.esq > 0) {
      jug.esq -= dt;
      moverJugador(jug.esqDir[0] * VEL_ESQ * dt, jug.esqDir[1] * VEL_ESQ * dt);
      return;
    }
    if (!libre) return;
    if (mov) {
      const l = Math.hypot(e.x, e.y);
      jug.dir = [e.x / l, e.y / l];
    }
    if (CONTROLES.recien("esquivar") && jug.sta >= 20 && jug.salto <= 0) {
      jug.sta -= 20;
      jug.esq = 0.3;
      jug.inv = Math.max(jug.inv, 0.26);
      jug.esqDir = jug.dir.slice();
      jug.atk = null;
      return;
    }
    if (CONTROLES.recien("saltar") && jug.salto <= 0) jug.salto = 0.42;
    // ataque: combo de dos golpes, hacia el mouse si se usa, si no hacia donde mira
    jug.comboT = Math.max(0, jug.comboT - dt);
    if (jug.atk) {
      const a = jug.atk,
        d = a.d;
      a.t += dt;
      if (a.t >= d.wind && a.t <= d.wind + d.swing && !a.pego) golpear(a);
      if (a.t >= d.wind + d.swing + d.rec) {
        jug.atk = null;
        jug.comboT = 0.35;
      }
    } else if (CONTROLES.recien("atacar")) {
      const n = jug.comboT > 0 ? (jug.combo + 1) % GOLPES.length : 0;
      jug.combo = n;
      let dir = Math.atan2(jug.dir[1], jug.dir[0]);
      if (mouse.usado && !CONTROLES.mando()) dir = Math.atan2(mouse.y - (jug.y - 30), mouse.x - jug.x);
      jug.atk = { t: 0, d: GOLPES[n], dir, side: n % 2 ? -1 : 1, pego: false };
      jug.mira = VIKINGO.vista(Math.cos(dir), Math.sin(dir), jug.mira);
    }
    const vel = (jug.correr ? VEL_CORRER : VEL) * (jug.atk ? 0.35 : 1) * (jug.lento > 0 ? 0.6 : 1);
    if (mov) {
      moverJugador(e.x * vel * dt, e.y * vel * dt);
      if (!jug.atk) jug.mira = VIKINGO.vista(e.x, e.y, jug.mira);
    }
    jug.anda = mov ? (jug.correr ? 2 : 1) : 0;
    if (CONTROLES.recien("interactuar")) interactuar();
    if (CONTROLES.recien("lente")) usarLente();
  }
  function moverJugador(dx, dy) {
    if (W.libre(jug.x + dx, jug.y, R)) jug.x += dx;
    if (W.libre(jug.x, jug.y + dy, R)) jug.y += dy;
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
    for (const e of enemigos) {
      if (!e.activo || e.muerto || Math.abs(e.x - jug.x) > 300 || !enArco(e.x, e.y, e.d.radio)) continue;
      if (W.hayMuro(jug.x, jug.y, e.x, e.y)) continue;
      chispa(e.x, e.y - 30);
      numero(e.x, e.y - 60, Math.round(d.dano * J.mulDano));
      CB.golpear(J, e, Math.round(d.dano * J.mulDano), jug.x, jug.y);
    }
    if (ciervo.activo && enArco(ciervo.x, ciervo.y, 60)) {
      const antes = ciervo.vida;
      CB.golpearCiervo(J, ciervo, d.dano * J.mulDano);
      chispa(ciervo.x, ciervo.y - 80);
      numero(ciervo.x, ciervo.y - 120, Math.max(0, Math.round(antes - ciervo.vida)));
    }
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
  function numero(x, y, n) {
    if (n > 0) J.textos.push({ x, y, n, t: 0 });
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
        mejor = { texto: t("av.accion_hablar") + " · " + tav("nombre_" + id), fn: () => hablar(id) };
      }
    }
    for (const tr of trabajadores) {
      const d = Math.hypot(tr.x - jug.x, tr.y - jug.y);
      if (d < 100 && d < dm) {
        dm = d;
        mejor = { texto: t("av.accion_hablar") + " · " + tav("nombre_trabajador"), fn: () => dialogo(tr.id === "herido" ? "herido" : "trabajador") };
      }
    }
    SIS.forEach((s0) => s0.cercanos && s0.cercanos((d, texto, fn) => {
      if (d < dm) {
        dm = d;
        mejor = { texto, fn };
      }
    }));
    for (const it of INTER) {
      if (!it.cond()) continue;
      const d = dist(jug, it.p);
      if (d < it.radio && d < dm) {
        dm = d;
        mejor = { texto: tav(it.texto), fn: it.accion };
      }
    }
    return mejor;
  }
  function hablar(id) {
    const n = npcs[id];
    n.mira = VIKINGO.vista(jug.x - n.x, jug.y - n.y, n.mira);
    jug.mira = VIKINGO.vista(n.x - jug.x, n.y - jug.y, jug.mira);
    dialogo(H.dialogoDe(id));
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
      fy = jug.y - 30;
    if (ciervo.activo) {
      fx = (jug.x * 2 + ciervo.x) / 3;
      fy = (jug.y * 2 + ciervo.y) / 3 - 30;
    }
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
    c.save();
    c.translate(p.x, p.y);
    c.scale(CUERPO, CUERPO);
    c.translate(-p.x, -p.y);
    const jp = p.salto > 0 ? Math.sin((1 - p.salto / 0.42) * Math.PI) : 0;
    const anda = p.anda || 0,
      bob = p.salto > 0 ? 0 : Math.abs(Math.sin(J.t * (anda === 2 ? 16 : anda ? 11 : 2.5))) * (anda ? 8 : 2);
    DIB.E(c, p.x, p.y, 58 * (1 - jp * 0.35), 16 * (1 - jp * 0.35), "rgba(0,0,0,0.45)");
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
    if (detras) dibujarEspada(sp.x, sp.y, sp.ang, sp.s, false);
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
    c.rotate(p.salto > 0 ? -0.25 * jp : 0);
    if (img.complete) c.drawImage(img, -w / 2, -h / 2, w, h);
    c.restore();
    if (!detras) dibujarEspada(sp.x, sp.y, sp.ang, sp.s, false);
    c.restore();
  }
  function dibujarNpc(n) {
    GENTE.dibujar(c, n.id, n.x, n.y, J.t, { vista: n.mira.vista, espejo: n.mira.espejo, hablando: n.hablando, camina: n.camina });
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
  function dibujarHaz(p, x0, y0, x1, y1) {
    if (!p || ciervo.activo || dist(jug, p) < 7 * 30) return;
    const vis = p[0] > x0 && p[0] < x1 && p[1] > y0 && p[1] < y1 + 200;
    if (vis) {
      c.save();
      const g = c.createLinearGradient(0, p[1] - 700, 0, p[1]);
      g.addColorStop(0, "rgba(115,213,219,0)");
      g.addColorStop(1, "rgba(115,213,219,0.28)");
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(p[0] - 10, p[1] - 700);
      c.lineTo(p[0] + 10, p[1] - 700);
      c.lineTo(p[0] + 22, p[1]);
      c.lineTo(p[0] - 22, p[1]);
      c.fill();
      c.restore();
      DIB.halo(c, p[0], p[1], 40, DIB.RUNICO, 0.6 + Math.sin(J.t * 3) * 0.2);
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
      DIB.P(c, [16, 0, -10, -12, -4, 0, -10, 12], DIB.RUNICO);
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
    return s0;
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
    W.dibujarPiso(c, x0, y0, x1, y1, esc);
    // lo que va en el piso
    J.marcas.forEach(dibujarMarca);
    J.zonas.forEach((a) => CB.dibujarAviso(c, a));
    J.avisos.forEach((a) => CB.dibujarAviso(c, a));
    cadaSis("piso", c, x0, y0, x1, y1);
    J.ondas.forEach(dibujarOnda);
    if (nucleoSuelo) ASSETS.dibujar(c, "nucleo", nucleoSuelo.x, nucleoSuelo.y, J.t, {});
    // todo lo que tiene altura, ordenado por la línea del piso
    const lista = [];
    W.cercanas(x0 - 300, y0 - 100, x1 + 300, y1 + 420, (o) => {
      if (o.oculto || o.x < x0 - 320 || o.x > x1 + 320 || o.y < y0 - 40 || o.y - o.alto * 1.2 > y1) return;
      lista.push({ y: o.y, f: () => dibujarCosa(o) });
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
    lista.push({ y: jug.y, f: dibujarJugador, jugador: true });
    lista.sort((a, b) => a.y - b.y);
    lista.forEach((d) => d.f());
    // la luz y la niebla van encima del mundo; chispas y números quedan encima de la luz para leerse siempre
    LUZ.niebla(c, x0, y0, vw, vh, J.t, 0.35 + amb.n * 0.9);
    LUZ.dibujar(c, cw, ch, x0, y0, esc, juntarLuces(x0, y0, x1, y1), amb, J.t);
    c.setTransform(esc, 0, 0, esc, -x0 * esc, -y0 * esc);
    J.fx.forEach((f) => DIB.alfa(c, Math.max(0, f.t / 0.35), () => DIB.R(c, f.x - f.s / 2, f.y - f.s / 2, f.s, f.s, f.c)));
    c.font = '800 18px "Eromash Text", system-ui, sans-serif';
    c.textAlign = "center";
    J.textos.forEach((n) => {
      c.globalAlpha = Math.max(0, 1 - n.t / 0.9);
      c.lineWidth = 4;
      c.strokeStyle = "#0A0707";
      c.strokeText(n.n, n.x, n.y - n.t * 40);
      c.fillStyle = "#F2ECEC";
      c.fillText(n.n, n.x, n.y - n.t * 40);
    });
    c.globalAlpha = 1;
    dibujarHaz(dondeObjetivo(), x0, y0, x1, y1);
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
  }
  let vineta = null;
  // árboles y casas que tapan a Eromash se vuelven transparentes
  function dibujarCosa(o) {
    let a = 1;
    if (o.alto > 90 && o.y > jug.y && o.y - jug.y < o.alto * 0.9) {
      const ancho = o.choque && o.choque.w ? o.choque.w / 2 + 30 : 40 * (o.o.s || 1) + 20;
      if (Math.abs(jug.x - o.x) < ancho) a = 0.42;
    }
    if (a < 1) DIB.alfa(c, a, () => ASSETS.dibujar(c, o.id, o.x, o.y, J.t, o.o));
    else ASSETS.dibujar(c, o.id, o.x, o.y, J.t, o.o);
  }

  // ---------- HUD de cada cuadro ----------
  function actualizarHud() {
    HUD.jugador(jug.hp, jug.hpMax, jug.sta, jug.staMax);
    const o = H.objetivo(),
      m = H.idMision();
    const p = dondeObjetivo();
    HUD.objetivo(m === "fin" ? tav("mision_fin") : t("ui.mision", [m]), o ? tav(o.texto) : tav("obj_fin"), p ? dist(jug, p) / 43 : null);
    const cer = J.modo === "juego" && !jug.muerto ? cercano() : null;
    HUD.accion(cer ? cer.texto : null, CONTROLES.glifo("interactuar"));
    cadaSis("hud");
    HUD.jefe(ciervo.activo ? { nombre: tav("nombre_ciervo"), frac: ciervo.vida / CB.VIDA_C, ataduras: CB.atados(ciervo), ataque: jefeAtaque, accion: jefeAccion } : null);
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
    HUD.abrir(`<h1>Eromash</h1><div class="sub">${tav("juego_subtitulo")}</div>`, botones);
    const nota = document.createElement("div");
    nota.className = "nota";
    nota.textContent = (CONTROLES.mando() ? t("ui.controles_mando") : t("ui.controles")) + " · " + tav("titulo_mvp");
    document.getElementById("capaCaja").appendChild(nota);
  }
  function elegirRanura() {
    const bot = [1, 2, 3].map((n) => {
      const r = H.resumen(n);
      return { texto: tav("ranura", [n]), sub: r ? r.mision + " · " + tiempoTxt(r.tiempo) : tav("ranura_vacia"), fn: () => {
        if (r && !confirmar[n]) {
          confirmar[n] = true;
          HUD.aviso(tav("ranura_reemplazar"));
          return;
        }
        empezar(n, true);
      } };
    });
    bot.push({ texto: t("ui.cerrar"), fn: titulo });
    HUD.abrir(`<h2>${tav("ranuras_nueva")}</h2>`, bot);
  }
  const confirmar = {};
  function empezar(n, nueva) {
    if (nueva) H.nueva(n);
    else H.cargar(n);
    const E = H.E;
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
  }
  function pausa() {
    J.modo = "menu";
    HUD.abrir(`<h2>${tav("pausa_titulo")}</h2>`, [
      { texto: tav("pausa_seguir"), fn: cerrarMenu },
      { texto: tav("pausa_guardar"), fn: () => {
        if (H.guardar()) HUD.aviso(tav("partida_guardada"));
        cerrarMenu();
      } },
      { texto: tav("diario_titulo"), fn: diario },
      { texto: tav("pausa_titulo_menu"), fn: () => {
        H.guardar();
        titulo();
      } },
    ]);
  }
  function diario() {
    J.modo = "menu";
    const lista = H.E.diario.length ? H.E.diario.map((k) => `<p>${tav(k)}</p>`).join("") : `<p>${t("ui.diario_vacio")}</p>`;
    let extra = "";
    SIS.forEach((s0) => s0.diario && (extra += s0.diario()));
    HUD.abrir(`<h2>${tav("diario_titulo")}</h2>${extra}<div class="diario-lista">${lista}</div>`, [{ texto: t("ui.cerrar"), fn: cerrarMenu }]);
  }
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
    const dt = Math.min(0.05, (ahora - antes) / 1000);
    antes = ahora;
    CONTROLES.actualizar();
    if (J.modo === "menu") {
      HUD.pasoMenu();
      if (CONTROLES.recien("mapa") && document.getElementById("mapaLienzo")) cerrarMenu();
      if (CONTROLES.recien("pausa") && H.E && J.cam.x) {
        if (document.querySelector("#capaCaja h1") == null) cerrarMenu();
      }
    } else if (J.modo === "dialogo") {
      if (CONTROLES.recien("seguir") || CONTROLES.recien("interactuar") || CONTROLES.recien("atacar")) seguirDialogo();
    } else if (J.modo === "juego") {
      if (CONTROLES.recien("pausa")) pausa();
      else if (CONTROLES.recien("diario")) diario();
    }
    if (J.modo === "juego" || J.modo === "dialogo" || J.modo === "cine") {
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
      cadaSis("actualizar", dt);
      amb = LUZ.ambiente(H.E.tiempo, sombraAqui(), dt);
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
        f.vy += 600 * dt;
      });
      J.fx = J.fx.filter((f) => f.t > 0);
      J.textos.forEach((n) => (n.t += dt));
      J.textos = J.textos.filter((n) => n.t < 0.9);
      zonas();
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
    J, jug, W, H, CB, P, N, enemigos, npcs, dist, tav, t, chispa, numero, ondaPor, dialogoLibre, cercano,
    avisar: (k, col) => HUD.aviso(t(k), col),
    menu: (html, botones) => {
      J.modo = "menu";
      HUD.abrir(html, botones);
    },
    cerrarMenu,
    mouse: () => mouse,
    hora: () => amb.h,
    noche: () => amb.n,
    amb: () => amb,
    teletransportar: (x, y) => {
      J.modo = "cine";
      HUD.fundido(true);
      setTimeout(() => {
        jug.x = x;
        jug.y = y;
        J.cam.x = x;
        J.cam.y = y - 30;
        HUD.fundido(false);
        J.modo = "juego";
        CONTROLES.soltar();
      }, 700);
    },
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
  } else titulo();
  requestAnimationFrame(cuadro);
})();
