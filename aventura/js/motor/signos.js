// ---------- los galdrar de Vör: magia rápida (sistema SIGNOS) ----------
// Como las señales del brujo de The Witcher: cinco galdrar (cantos rúnicos) que Eromash tira en un instante con
// cualquier arma, por estamina y no por energía rúnica. Se elige uno (acción `cambiarSigno`: N, o L2 + ▶) y se canta
// (acción `signo`: Y, o L2 + L1). Vör los enseña en el túmulo (con nivel y plata) y por plata y una esquirla canta cada
// uno más fuerte (rango 2). La fuerza sube con el poder rúnico.
//   viento (Ansuz)   un soplo en cono que empuja y voltea (las fuertes solo se tambalean)
//   fuego (Kenaz)    un abanico de llamas que deja quemando
//   escudo (Algiz)   un escudo que se come los golpes hasta un tope; en rango 2 estalla al romperse
//   lazo (Naudiz)    un círculo violeta en el piso donde las criaturas van lentas
//   sueño (Isa)      la criatura de enfrente se queda dormida (las fuertes, un rato corto)
// Estado en E.extra.signos = { sabe: { id: rango }, activo }. Textos `sg.`.
window.SIGNOS = (function () {
  "use strict";
  let A, J, jug;
  const t = (k, v) => I18N.t(k, v);
  const COSTO = 30, // estamina por canto
    ESPERA = 1.2;
  const LISTA = {
    viento: { runa: "ansuz", col: "#C8F2F4", nivel: 1, plata: 0, largo: 300, ancho: 0.62, dano: 8, voltea: 1.3 },
    fuego: { runa: "kenaz", col: "#FF8D71", nivel: 3, plata: 60, largo: 260, ancho: 0.48, dano: 14, quema: 4 },
    escudo: { runa: "algiz", col: "#FFD98A", nivel: 5, plata: 100, tope: 0.3, dura: 12 },
    lazo: { runa: "naudiz", col: "#9A6BD8", nivel: 7, plata: 140, radio: 160, dura: 8, lento: 0.45 },
    sueno: { runa: "isa", col: "#73D5DB", nivel: 9, plata: 200, largo: 340, duerme: 4, fuerte: 1.4 },
  };
  const IDS = Object.keys(LISTA);
  const RANGO2 = { plata: 150, esquirla: 1, k: 1.35 };
  const base = () => ({ sabe: {}, activo: null, cantos: 0 });
  let st = base();
  let espera = 0,
    escudo = null, // { hp, max, t, rango }
    lazo = null, // { x, y, t, r, dura }
    soplos = []; // dibujo de los conos: { x, y, a, ancho, largo, col, t }

  const poder = () => J.poderRunico || 1;
  const k = (id) => (st.sabe[id] >= 2 ? RANGO2.k : 1);
  const fuerte = (e) => !!(e.lider || e.patron || e.d.jefe);
  const vivas = () => A.enemigos.filter((e) => e.activo && !e.muerto && !e.d.blanco);
  const angulo = () => Math.atan2(jug.dir[1], jug.dir[0]);
  // ¿la criatura está en el cono de delante? (y aplastada como en el piso)
  function enCono(e, largo, ancho) {
    const dx = e.x - jug.x,
      dy = (e.y - jug.y) * 1.25,
      l = Math.hypot(dx, dy);
    if (l > largo + (e.d.radio || 18)) return false;
    if (l < 40) return true;
    let da = Math.atan2(dy, dx) - Math.atan2(jug.dir[1] * 1.25, jug.dir[0]);
    da = Math.atan2(Math.sin(da), Math.cos(da));
    return Math.abs(da) < ancho;
  }
  // el golpe de un galdr: por los modDano, marcado como poder para no encadenarse
  function pegar(e, dano, empuje, id) {
    const info = { d: { poder: "galdr_" + id, magia: true, runico: true }, critico: false, sorpresa: false, contra: false };
    for (const s of window.SISTEMAS) if (s.modDano && s !== sistema) dano = s.modDano(dano, e, info);
    dano = Math.max(1, Math.round(dano));
    A.numero(e.x, e.y - 60, dano, LISTA[id].col, false);
    const murio = A.CB.golpear(J, e, dano, jug.x, jug.y, empuje);
    window.SISTEMAS.forEach((s) => s.alPegar && s.alPegar(e, dano, info, murio));
    return murio;
  }

  // ---------- cantar ----------
  function puede() {
    if (jug.muerto || J.modo !== "juego" || J.dentro) return "sg.ahora_no";
    if (!st.activo || !st.sabe[st.activo]) return "sg.no_sabe";
    if (espera > 0) return "sg.ahora_no";
    if (jug.sta < COSTO) return "sg.sin_sta";
    return null;
  }
  function cantar() {
    const no = puede();
    if (no) {
      if (no !== "sg.ahora_no") HUD.aviso(t(no), "#C8402D");
      return false;
    }
    const id = st.activo,
      L = LISTA[id],
      p = poder() * k(id);
    jug.sta -= COSTO;
    jug.staEspera = Math.max(jug.staEspera || 0, 0.6);
    espera = ESPERA;
    st.cantos++;
    let tocadas = 0;
    if (id === "viento" || id === "fuego") {
      soplos.push({ x: jug.x, y: jug.y, a: angulo(), ancho: L.ancho, largo: L.largo * (id === "viento" ? 1 : k(id)), col: L.col, t: 0, fuego: id === "fuego" });
      for (const e of vivas()) {
        if (!enCono(e, L.largo, L.ancho)) continue;
        tocadas++;
        if (id === "viento") {
          const murio = pegar(e, L.dano * p, fuerte(e) ? 0.8 : 2.4 * k(id), id);
          if (!murio) {
            e.aturdido = Math.max(e.aturdido || 0, fuerte(e) ? 0.4 : L.voltea * k(id));
            if (e.aviso) J.quitarAviso(e.aviso), (e.aviso = null), (e.estado = "espera"), (e.t = 0);
          }
        } else if (!pegar(e, L.dano * p, 0.3, id)) e.quema = Math.max(e.quema || 0, L.quema * k(id));
      }
      J.sacudir(id === "viento" ? 0.18 : 0.12);
      if (window.SONIDO) SONIDO.tocar(id === "viento" ? "esquiva" : "fogata", { vol: 0.6, tono: id === "viento" ? 0.7 : 1.5 });
    } else if (id === "escudo") {
      const max = Math.round(jug.hpMax * L.tope * p);
      escudo = { hp: max, max, t: L.dura, rango: st.sabe.escudo };
      if (window.SONIDO) SONIDO.tocar("runa", { vol: 0.5, tono: 1.2 });
    } else if (id === "lazo") {
      lazo = { x: jug.x, y: jug.y, t: 0, r: L.radio * (st.sabe.lazo >= 2 ? 1.2 : 1), dura: L.dura * k(id) };
      if (window.SONIDO) SONIDO.tocar("zumbido", { vol: 0.5, tono: 0.8 });
    } else if (id === "sueno") {
      let mejor = null,
        dm = 1e9;
      for (const e of vivas())
        if (enCono(e, L.largo, 0.7)) {
          const d = Math.hypot(e.x - jug.x, e.y - jug.y);
          if (d < dm) (dm = d), (mejor = e);
        }
      if (mejor) {
        tocadas = 1;
        mejor.aturdido = Math.max(mejor.aturdido || 0, (fuerte(mejor) ? L.fuerte : L.duerme) * k(id));
        mejor.dormida = mejor.aturdido;
        if (mejor.aviso) J.quitarAviso(mejor.aviso), (mejor.aviso = null), (mejor.estado = "espera"), (mejor.t = 0);
        A.textoFlotante(mejor.x, mejor.y - 110, t("sg.dormida"), L.col);
      } else A.textoFlotante(jug.x, jug.y - 130, t("sg.nadie"), "#E0B2B2");
      if (window.SONIDO) SONIDO.tocar("runa", { vol: 0.45, tono: 0.7 });
    }
    // la runa del galdr brilla sobre Eromash un instante
    J.fx.push({ x: jug.x, y: jug.y - 150, vx: 0, vy: -40, t: 0.5, c: L.col, s: 9, g: 0 });
    A.textoFlotante(jug.x, jug.y - 160, t("sg.n_" + id), L.col);
    return tocadas || true;
  }
  function cambiar() {
    const sabidos = IDS.filter((id) => st.sabe[id]);
    if (!sabidos.length) return HUD.aviso(t("sg.no_sabe"), "#C8402D"), false;
    st.activo = sabidos[(sabidos.indexOf(st.activo) + 1) % sabidos.length];
    HUD.aviso(t("sg.elegido", [t("sg.n_" + st.activo)]), LISTA[st.activo].col);
    return true;
  }

  // ---------- Vör los enseña ----------
  function aprender(id) {
    const L = LISTA[id],
      r = st.sabe[id] || 0;
    if (r >= 2) return false;
    const pj = PODERES.pj();
    if (!r) {
      if (window.RPG && RPG.nivel() < L.nivel) return HUD.aviso(t("sg.falta_nivel", [L.nivel]), "#C8402D"), false;
      if (pj.plata < L.plata) return HUD.aviso(t("sg.sin_plata", [L.plata]), "#C8402D"), false;
      pj.plata -= L.plata;
    } else {
      const mat = { esquirla: RANGO2.esquirla };
      if (pj.plata < RANGO2.plata || (window.MATERIALES && !MATERIALES.alcanza(mat))) return HUD.aviso(t("sg.sin_rango", [RANGO2.plata]), "#C8402D"), false;
      pj.plata -= RANGO2.plata;
      if (window.MATERIALES) MATERIALES.gastar(mat);
    }
    st.sabe[id] = r + 1;
    if (!st.activo) st.activo = id;
    HUD.aviso(t(r ? "sg.mas_fuerte" : "sg.aprendido", [t("sg.n_" + id)]), r ? LISTA[id].col : "lugar", r ? undefined : t("sg.aprendido_titulo"));
    if (window.SONIDO) SONIDO.tocar("mision", { vol: 0.45 });
    return true;
  }
  function menuVor() {
    const bot = IDS.map((id) => {
      const L = LISTA[id],
        r = st.sabe[id] || 0;
      const sub = t("sg.d_" + id) + " · " + (r >= 2 ? t("sg.rango_tope") : r ? t("sg.pide_rango", [RANGO2.plata]) : t("sg.pide", [L.nivel, L.plata]));
      return { texto: (r ? "✓ " : "") + t("sg.n_" + id) + (r >= 2 ? " II" : ""), sub, fn: () => (aprender(id), menuVor()) };
    });
    bot.push({ texto: t("ui.volver"), fn: () => INSTRUCTORES.menuMaestro("vor") });
    A.menu(`<h2>${t("sg.titulo")}</h2><div class="sub">${t("sg.sub", [COSTO])}</div>`, bot);
  }

  // ---------- dibujo ----------
  function iconos() {
    IDS.forEach((id) =>
      INVENTARIO.iconoDe("sg_" + id, (c) => {
        // una piedra de canto con la runa del galdr
        DIB.P(c, [-22, 28, -27, -6, -12, -30, 13, -30, 27, -4, 22, 28], "#6E6A66");
        DIB.P(c, [0, -30, 13, -30, 27, -4, 22, 28, 0, 28], "#8E8A86");
        FUTHARK.dibujar(c, LISTA[id].runa, 0, 20, 42, "#1E1A1A", 9);
        FUTHARK.dibujar(c, LISTA[id].runa, 0, 20, 42, LISTA[id].col, 5);
      }),
    );
  }
  function dibujarSoplo(c, s) {
    const f = Math.max(0, 1 - s.t / 0.45),
      r = s.largo * (0.35 + 0.65 * Math.min(1, s.t / 0.2));
    const cuna = (rr, ancho, col) => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(s.x, s.y);
      for (let i = 0; i <= 8; i++) {
        const a = s.a - ancho + (i / 8) * ancho * 2;
        c.lineTo(s.x + Math.cos(a) * rr, s.y + (Math.sin(a) * rr) / 1.25);
      }
      c.closePath();
      c.fill();
    };
    // el fuego: lengua roja con el corazón coral; el viento: una cuña clara
    DIB.alfa(c, f * (s.fuego ? 0.55 : 0.28), () => {
      cuna(r, s.ancho, s.fuego ? "#C8402D" : s.col);
      if (s.fuego) cuna(r * 0.7, s.ancho * 0.6, "#FF8D71");
      if (s.fuego) cuna(r * 0.35, s.ancho * 0.35, "#FFD98A");
    });
  }
  function dibujarLazo(c) {
    const f = Math.min(1, lazo.t * 4, (lazo.dura - lazo.t) * 2);
    DIB.alfa(c, f * 0.55, () => {
      c.strokeStyle = "#9A6BD8";
      c.lineWidth = 5;
      c.beginPath();
      c.ellipse(lazo.x, lazo.y, lazo.r, lazo.r * 0.8, 0, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = "rgba(154,107,216,0.16)";
      c.fill();
    });
    // las runas de Naudiz que giran en el borde
    DIB.alfa(c, f * 0.8, () => {
      for (let i = 0; i < 6; i++) {
        const a = lazo.t * 0.6 + (i / 6) * Math.PI * 2;
        FUTHARK.dibujar(c, "naudiz", lazo.x + Math.cos(a) * lazo.r, lazo.y + Math.sin(a) * lazo.r * 0.8 + 10, 22, "#C8A8F0", 3);
      }
    });
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      iconos();
    },
    alEmpezar(extra) {
      extra.signos = Object.assign(base(), extra.signos || {});
      st = extra.signos;
      espera = 0;
      escudo = null;
      lazo = null;
      soplos = [];
    },
    actualizar(dt) {
      if (J.modo === "juego") {
        if (CONTROLES.recien("signo")) cantar();
        if (CONTROLES.recien("cambiarSigno")) cambiar();
      }
      espera = Math.max(0, espera - dt);
      for (let i = soplos.length - 1; i >= 0; i--) if ((soplos[i].t += dt) > 0.45) soplos.splice(i, 1);
      if (escudo && (escudo.t -= dt) <= 0) escudo = null;
      if (lazo) {
        lazo.t += dt;
        if (lazo.t >= lazo.dura) lazo = null;
        else
          for (const e of vivas())
            if (Math.hypot(e.x - lazo.x, (e.y - lazo.y) * 1.25) < lazo.r) {
              e.lenta = J.t + 0.25;
              e.lentaK = LISTA.lazo.lento;
            }
      }
      for (const e of A.enemigos) if (e.dormida > 0) e.dormida = e.muerto || !(e.aturdido > 0) ? 0 : e.dormida - dt;
      // fuego: las chispas del abanico
      if (soplos.length && (!window.CALIDAD || CALIDAD.nivel !== "baja"))
        soplos.forEach((s) => {
          if (s.t > 0.3) return;
          const a = s.a + (Math.random() - 0.5) * s.ancho * 2,
            v = 500 + Math.random() * 300;
          J.fx.push({ x: s.x, y: s.y - 50, vx: Math.cos(a) * v, vy: (Math.sin(a) * v) / 1.25, t: 0.35, c: s.fuego ? (Math.random() < 0.5 ? "#FF8D71" : "#C8402D") : "rgba(200,242,244,0.7)", s: 5, g: 0 });
        });
    },
    modRecibido(dano) {
      if (!escudo || dano <= 0) return dano;
      const come = Math.min(escudo.hp, dano);
      escudo.hp -= come;
      if (escudo.hp <= 0) {
        // en rango 2 se rompe empujando a las de cerca
        if (escudo.rango >= 2)
          for (const e of vivas())
            if (Math.hypot(e.x - jug.x, e.y - jug.y) < 180 && !pegar(e, 10 * poder(), 1.8, "escudo")) e.aturdido = Math.max(e.aturdido || 0, 0.8);
        escudo = null;
        J.ondas.push({ tipo: "pulso", x: jug.x, y: jug.y, t: 0 });
        if (window.SONIDO) SONIDO.tocar("golpeFuerte", { vol: 0.5, tono: 1.4 });
      }
      return dano - come;
    },
    piso(c) {
      if (lazo) dibujarLazo(c);
    },
    sobreLuz(c) {
      // los soplos van sobre la luz: el fuego tiene que alumbrar
      soplos.forEach((s) => dibujarSoplo(c, s));
      if (escudo) {
        const f = Math.min(1, escudo.t) * (0.35 + 0.4 * (escudo.hp / escudo.max));
        DIB.alfa(c, f, () => {
          c.strokeStyle = "#FFD98A";
          c.lineWidth = 3;
          c.beginPath();
          c.ellipse(jug.x, jug.y - 70 - (jug.z || 0), 62, 92, 0, 0, Math.PI * 2);
          c.stroke();
        });
        FUTHARK.dibujar(c, "algiz", jug.x, jug.y - 168 - (jug.z || 0), 18, "rgba(255,217,138," + f + ")", 3);
      }
      // las dormidas: zetas que suben
      for (const e of A.enemigos)
        if (e.dormida > 0 && !e.muerto) {
          for (let i = 0; i < 3; i++) {
            const u = (J.t * 0.7 + i / 3) % 1;
            DIB.alfa(c, Math.min(1, (1 - u) * 1.6), () => {
              c.fillStyle = "#73D5DB";
              c.font = "bold " + Math.round(18 + u * 16) + "px DM Sans, sans-serif";
              c.fillText("z", e.x + 10 + u * 26, e.y - 60 - (e.d.radio || 20) - u * 60);
            });
          }
        }
    },
    luces(dar) {
      if (lazo) dar({ x: lazo.x, y: lazo.y, r: lazo.r * 1.6, col: "#9A6BD8", f: 0.5 });
      if (escudo) dar({ x: jug.x, y: jug.y - 60, r: 160, col: "#FFD98A", f: 0.35 });
      soplos.forEach((s) => s.fuego && dar({ x: s.x + Math.cos(s.a) * s.largo * 0.5, y: s.y + (Math.sin(s.a) * s.largo * 0.5) / 1.25, r: s.largo, col: "#FF8D71", f: Math.max(0, 1 - s.t / 0.45) }));
    },
    cosasBarra() {
      // el galdr elegido es una habilidad de la barra (BARRA); también se canta con Y o L2 + ◀
      return {
        signo: {
          tipo: "habilidad",
          icono: () => "sg_" + (st.activo || "lazo"),
          avisa: true,
          nombre: () => t("sg.n_" + st.activo),
          corto: () => t("sg.c_" + st.activo),
          desc: () => t("sg.d_" + st.activo),
          tiene: () => !!st.activo,
          listo: () => !puede(),
          espera: () => espera / ESPERA,
          usar: () => cantar(),
        },
      };
    },
    efectosHud() {
      return escudo ? [{ texto: t("sg.n_escudo"), n: Math.ceil(escudo.hp), col: "#FFD98A" }] : [];
    },
    diario() {
      const n = IDS.filter((id) => st.sabe[id]);
      return n.length ? `<div class="diario-resumen"><p><b>${t("sg.titulo")}</b> ${n.map((id) => t("sg.n_" + id) + (st.sabe[id] >= 2 ? " II" : "")).join(" · ")}</p></div>` : "";
    },
    // Vör suma su botón de galdrar a su menú
    botonesInstructor(id) {
      return id === "vor" ? [{ texto: t("sg.con_vor"), sub: t("sg.con_vor_d"), fn: menuVor }] : [];
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, cantar, cambiar, aprender, menuVor, puede, escudo: () => escudo, lazo: () => lazo, LISTA, COSTO, RANGO2 };
})();
