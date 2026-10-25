// ---------- el frasco de Thora (sistema FRASCO) ----------
// Como el frasco de Estus del Dark Souls: un frasco de cuero y barro con el ungüento de Thora, con cargas que se
// toman en plena pelea (acción `frasco`: 4, o L2 + ✕) y curan de a poco. Las cargas vuelven solas al entrar a un
// pueblo o refugio (el Puesto, el Refugio, la Casa de las Lindes, Brunvik, el Aserradero) y cuando Thora te cura.
// Thora lo mejora en la Casa de Sanación: más cargas (de 3 a 6, con plata y ámbar) y un ungüento más fuerte (con
// plata y esquirlas). Tomar es un trago corto que frena el paso; la cura llega en 1,2 s y un golpe no la corta.
// Estado en E.extra.frasco = { cargas, max, fuerza }. Textos `fr.` en textos/frasco.js.
window.FRASCO = (function () {
  "use strict";
  let A, J, jug;
  const t = (k, v) => I18N.t(k, v);
  const CURA = 0.4, // de la vida máxima por trago
    FUERZA = 0.1, // +10 % de cura por mejora de fuerza
    DURA = 1.2,
    TRAGO = 0.5,
    TOPE_CARGAS = 6,
    TOPE_FUERZA = 3;
  const MEJORA_CARGA = [
    { plata: 80, mat: { ambar: 1 } },
    { plata: 160, mat: { ambar: 2 } },
    { plata: 300, mat: { ambar: 3 } },
  ];
  const MEJORA_FUERZA = [
    { plata: 120, mat: { esquirla: 1 } },
    { plata: 240, mat: { esquirla: 2 } },
    { plata: 420, mat: { esquirla: 3 } },
  ];
  const REFUGIOS = ["puesto", "refugio", "casa_lindes", "brunvik", "aserradero"];
  const base = () => ({ cargas: 3, max: 3, fuerza: 0 });
  let st = base();
  let bebe = null, // { t, cura, dada }
    adentro = null, // el refugio donde está ahora (para llenar una vez al entrar)
    mirar = 0;

  // ---------- tomar ----------
  const curaDe = () => Math.round(jug.hpMax * CURA * (1 + FUERZA * st.fuerza));
  function puede() {
    if (jug.muerto || J.modo !== "juego") return "fr.ahora_no";
    if (bebe) return "fr.ahora_no";
    if (st.cargas <= 0) return "fr.vacio";
    if (jug.hp >= jug.hpMax) return "fr.lleno_vida";
    return null;
  }
  function tomar() {
    const no = puede();
    if (no) {
      if (no !== "fr.ahora_no") HUD.aviso(t(no));
      return false;
    }
    st.cargas--;
    bebe = { t: 0, cura: curaDe(), dada: 0 };
    jug.lento = Math.max(jug.lento || 0, TRAGO);
    if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.5, tono: 1.3 });
    if (window.ANIMA) ANIMA.gesto("feliz");
    return true;
  }
  function llenar(donde) {
    if (st.cargas >= st.max) return false;
    st.cargas = st.max;
    if (donde) HUD.aviso(t("fr.lleno", [donde]), "#7BC86C");
    if (window.SONIDO) SONIDO.tocar("plata", { vol: 0.3, tono: 0.8 });
    return true;
  }

  // ---------- Thora ----------
  function costoTexto(c) {
    return t("fr.costo", [c.plata]) + (window.MATERIALES ? " · " + MATERIALES.texto(c.mat) : "");
  }
  function mejorar(cual) {
    const lista = cual === "cargas" ? MEJORA_CARGA : MEJORA_FUERZA,
      n = cual === "cargas" ? st.max - 3 : st.fuerza;
    const c = lista[n];
    if (!c) return HUD.aviso(t("fr.tope")), false;
    const pj = PODERES.pj();
    if (pj.plata < c.plata) return HUD.aviso(t("fr.sin_plata", [c.plata])), false;
    if (window.MATERIALES && !MATERIALES.alcanza(c.mat)) return HUD.aviso(t("fr.sin_mat", [MATERIALES.texto(c.mat)])), false;
    pj.plata -= c.plata;
    if (window.MATERIALES) MATERIALES.gastar(c.mat);
    if (cual === "cargas") {
      st.max = Math.min(TOPE_CARGAS, st.max + 1);
      st.cargas = st.max;
    } else st.fuerza = Math.min(TOPE_FUERZA, st.fuerza + 1);
    HUD.aviso(cual === "cargas" ? t("fr.mas_cargas", [st.max]) : t("fr.mas_fuerza", [Math.round(CURA * (1 + FUERZA * st.fuerza) * 100)]), "#7BC86C");
    if (window.SONIDO) SONIDO.tocar("mision", { vol: 0.45 });
    return true;
  }
  function menuThora() {
    const nC = st.max - 3,
      nF = st.fuerza;
    A.menu(`<h2>${t("fr.titulo")}</h2><div class="sub">${t("fr.sub", [st.cargas, st.max, Math.round(CURA * (1 + FUERZA * st.fuerza) * 100)])}</div>`, [
      { texto: t("fr.cargas", [st.max, TOPE_CARGAS]), sub: MEJORA_CARGA[nC] ? costoTexto(MEJORA_CARGA[nC]) : t("fr.tope"), fn: () => (mejorar("cargas"), menuThora()) },
      { texto: t("fr.fuerza", [nF, TOPE_FUERZA]), sub: MEJORA_FUERZA[nF] ? costoTexto(MEJORA_FUERZA[nF]) : t("fr.tope"), fn: () => (mejorar("fuerza"), menuThora()) },
      { texto: t("ui.cerrar"), fn: A.cerrarMenu },
    ]);
  }

  // ---------- los íconos: el frasco con tantas marcas como cargas ----------
  function dibujarFrasco(c, cargas, max) {
    // el frasco de barro con correa de cuero y el corcho con la runa de Thora (Berkano)
    c.fillStyle = "rgba(0,0,0,0.25)";
    c.beginPath();
    c.ellipse(0, 26, 18, 5, 0, 0, Math.PI * 2);
    c.fill();
    DIB.P(c, [-16, -2, -20, 14, -14, 26, 14, 26, 20, 14, 16, -2, 8, -10, -8, -10], "#A8744A");
    DIB.P(c, [0, -10, 8, -10, 16, -2, 20, 14, 14, 26, 0, 26], "#C8905E");
    DIB.P(c, [-6, -10, 6, -10, 6, -22, -6, -22], "#7A5634");
    DIB.P(c, [-8, -22, 8, -22, 7, -28, -7, -28], "#C8B48C");
    DIB.P(c, [-19, 4, 19, 4, 19, 9, -19, 9], "#553A22");
    // el ungüento que se ve por la boca: verde si queda
    if (cargas > 0) DIB.P(c, [-12, 12, 12, 12, 10, 22, -10, 22], "#7BC86C");
    // las marcas de las cargas, abajo
    for (let i = 0; i < max; i++) {
      const x = (i - (max - 1) / 2) * 9;
      DIB.P(c, [x, 30, x + 3.5, 34, x, 38, x - 3.5, 34], i < cargas ? "#7BC86C" : "#3A3634");
    }
  }
  function iconos() {
    for (let m = 3; m <= TOPE_CARGAS; m++) for (let n = 0; n <= m; n++) INVENTARIO.iconoDe("frasco_" + n + "_" + m, (c) => dibujarFrasco(c, n, m));
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      iconos();
      // Thora cura y además llena el frasco y ofrece mejorarlo
      if (window.PODERES && PODERES.hablarCon) {
        const antes = PODERES.hablarCon;
        PODERES.hablarCon = (n) => {
          if (n && n.id === "thora") {
            // los encargos hablan primero (como en hablarCon)
            if (window.SECUNDARIAS && SECUNDARIAS.hablarCon(n)) return;
            n.mira = VIKINGO.vista(jug.x - n.x, jug.y - n.y, n.mira);
            jug.hp = jug.hpMax;
            llenar(null);
            return A.dialogoLibre([["thora", "pj.thora_cura"], ["thora", "fr.thora_frasco"]], menuThora);
          }
          return antes(n);
        };
      }
    },
    alEmpezar(extra) {
      extra.frasco = Object.assign(base(), extra.frasco || {});
      st = extra.frasco;
      bebe = null;
      adentro = null;
    },
    actualizar(dt) {
      if (J.modo === "juego" && CONTROLES.recien("frasco")) tomar();
      if (bebe) {
        bebe.t += dt;
        const k = Math.min(1, bebe.t / DURA),
          debe = Math.round(bebe.cura * k);
        if (debe > bebe.dada && !jug.muerto) {
          jug.hp = Math.min(jug.hpMax, jug.hp + (debe - bebe.dada));
          bebe.dada = debe;
        }
        if (Math.random() < 0.6) J.fx.push({ x: jug.x + (Math.random() - 0.5) * 40, y: jug.y - 20 - Math.random() * 60, vx: 0, vy: -50, t: 0.5, c: "rgba(123,200,108,0.7)", s: 5, g: 0 });
        if (k >= 1) {
          A.textoFlotante(jug.x, jug.y - 140, "+" + bebe.cura, "#7BC86C");
          bebe = null;
        }
      }
      // al entrar a un pueblo o refugio, el frasco se llena
      if ((mirar -= dt) > 0) return;
      mirar = 0.5;
      const L = ELDERVALD.LUGARES;
      const aqui = REFUGIOS.find((k) => L[k] && Math.hypot(jug.x - L[k].p[0], jug.y - L[k].p[1]) < L[k].r) || null;
      if (aqui && aqui !== adentro) llenar(t("fr.en_" + aqui));
      adentro = aqui;
    },
    casillas() {
      return [{ id: "frasco", icono: "frasco_" + st.cargas + "_" + st.max, accion: "frasco", nombre: t("fr.casilla"), listo: !puede() || (!!bebe && st.cargas > 0), espera: bebe ? 1 - bebe.t / DURA : 0 }];
    },
    diario() {
      return `<div class="diario-resumen"><p><b>${t("fr.titulo")}</b> ${t("fr.diario", [st.max, Math.round(CURA * (1 + FUERZA * st.fuerza) * 100)])}</p></div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, tomar, llenar, mejorar, menuThora, puede, bebiendo: () => !!bebe, curaDe, MEJORA_CARGA, MEJORA_FUERZA };
})();
