// ---------- encargos, semijefes, renombre y proezas (sistema SECUNDARIAS) ----------
// Según «Eldervald — etapas» (Alejandro): las cadenas al estilo WoW que dan los vecinos y los forasteros, los semijefes
// de cada zona, el renombre en las ciudades y el libro de proezas que más adelante abre el sótano de la hospedería.
//   Encargos: junta los que ya viven en otros sistemas (el buey en este.js, el cepillo en senda.js, la tablilla de Geir
//   y el cuaderno en norte.js, la cinta en claro.js) con los que se arman acá: la quilla de Sten (el nudo que ata al
//   custodio, el buey, el hierro de Grim y a Orm), los seis calcos para Torvald, la campana de la huldra (abre un
//   sendero del Puesto al Refugio) y el nøkk del puente (tres troncos con el torno y muestra el arcón de abajo).
//   Semijefes: el lobo viejo de zarzal (carro, al volver con la Lente), el primero en caer (Refugio, de noche después
//   de EL-02), la loba madre (la quebrada al este del Paso, después de EL-06) y el vigía errante (Torre del Cuervo).
//   Cada uno sigue una rotación fija con aviso en el piso, nunca el mismo ataque tres veces, y llama a lo sumo a tres.
//   Renombre: cinco niveles; cada uno baja los precios de la forja de Ása un 5 % y cambia el saludo de Svend.
window.SECUNDARIAS = (function () {
  "use strict";
  let A, J, jug, W, H, ex, st;
  const t = (k, v) => I18N.t(k, v);
  const hablar = (clave, quien) => A.dialogoLibre([[quien || "eromash", clave]]);
  const cerca = (p, r) => p && Math.hypot(p[0] - jug.x, p[1] - jug.y) < r;
  const tieneLente = () => H.tiene("lente") || H.tiene("lente_prestada");
  const sub = (k) => (ex && ex[k]) || {};

  const huldra = { x: 0, y: 0, mira: { vista: "S", espejo: false } };
  const nokk = { x: 0, y: 0, mira: { vista: "S", espejo: false } };

  // ---------- semijefes ----------
  const SEMI = {
    lobo_viejo: { tipo: "lobo", pal: 2, s: 1.7, vida: 380, af: ["piedra"], patron: ["abanico", "abanico", "circulo", "abanico", "franja", "circulo"], esbirro: "lobo", llama: [0.5], cuando: () => tieneLente() },
    primero: { tipo: "errante", pal: 1, s: 1.45, vida: 420, af: ["piedra"], patron: ["abanico", "franja", "abanico", "circulo"], esbirro: "errante", llama: [0.6, 0.3], cuando: () => H.completa("EL-02") && A.noche() > 0.5 },
    loba: { tipo: "lobo", pal: 1, s: 1.55, vida: 340, af: ["veloz"], patron: ["abanico", "franja", "abanico", "circulo", "franja"], esbirro: "lobo", chico: true, llama: [0.7, 0.4], cuando: () => H.completa("EL-06") },
    oso: { tipo: "oso", pal: 0, s: 1.15, vida: 560, af: ["piedra"], patron: ["abanico", "franja", "abanico", "circulo", "franja"], esbirro: "lobo", llama: [0.6, 0.3], cuando: () => true },
    vigia: { tipo: "errante", pal: 2, s: 1.5, vida: 400, af: ["runico"], patron: ["franja", "abanico", "circulo", "abanico"], esbirro: "errante", llama: [0.75, 0.45], cuando: () => true },
  };
  const jefes = {}; // id → { e, esbirros[], llamo }
  const lobosHuldra = [];
  let campanaSuelo = null,
    lugarTroncos = [];

  // un lugar libre cerca de p (los semijefes no pueden quedar adentro de una roca)
  function libre(p) {
    for (let r = 0; r < 1600; r += 60)
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2,
          x = p[0] + Math.cos(a) * r,
          y = p[1] + Math.sin(a) * r * 0.8;
        if (W.libre(x, y, 50)) return [x, y];
        if (!r) break;
      }
    return p;
  }
  function rotular(id) {
    const e = jefes[id].e;
    e.lider.nombre = t("sc.semi_" + id);
    e.lider.titulo = t("sc.semi_titulo");
  }
  function crearSemi(id, p) {
    const S = SEMI[id],
      CB = A.CB;
    const grupo = [];
    const e = CB.crear(S.tipo, p[0], p[1], { pal: S.pal, grupo, lider: { unico: true, afijos: S.af, nombre: "", titulo: "" } });
    e.s = S.s;
    e.d.radio *= S.s;
    e.d.barra *= S.s;
    e.d.vida = e.vida = S.vida;
    e.d.dano = Math.min(e.d.dano, 30);
    e.patron = S.patron;
    e.semi = id;
    e.activo = false;
    grupo.push(e);
    A.enemigos.push(e);
    const esb = [];
    for (let i = 0; i < 3; i++) {
      const m = CB.crear(S.esbirro, p[0], p[1], { pal: S.pal, grupo });
      if (S.chico) {
        m.s = 0.8;
        m.d.vida = m.vida = 30;
      }
      m.esbirro = id;
      m.activo = false;
      m.muerto = 1;
      grupo.push(m);
      esb.push(m);
      A.enemigos.push(m);
    }
    jefes[id] = { e, esb, llamo: 0, p };
    rotular(id);
  }
  // llama a dos más, nunca más de tres vivos
  function llamar(id) {
    const j = jefes[id],
      e = j.e;
    let n = 0;
    for (const m of j.esb) {
      if (n >= 2 || j.esb.filter((q) => q.activo && !q.muerto).length >= 3) break;
      if (m.activo && !m.muerto) continue;
      const a = Math.random() * Math.PI * 2;
      m.casa = [e.x + Math.cos(a) * 160, e.y + Math.sin(a) * 110];
      A.CB.reiniciar(m);
      m.activo = true;
      m.estado = "persigue";
      n++;
    }
    if (n) HUD.aviso(t("sc.llama_" + id), "#E0B2B2");
  }

  // ---------- encargos ----------
  // estado(): -1 sin empezar, 0..n-1 el paso que falta, n hecho
  const CADENAS = [
    { id: "SR-01", k: "buey", n: 3, estado: () => { const e = sub("este"); if (e.buey === 2) return 3; if (!e.arnes) return -1; return e.lobos ? (e.compuerta ? 2 : 1) : 0; } },
    { id: "SR-02", k: "cepillo", n: 2, estado: () => { const s = sub("senda"); return s.cepillo === 2 ? 2 : s.cepillo === 1 ? 1 : -1; } },
    { id: "SR-03", k: "geir", n: 2, estado: () => (st.grim ? 2 : sub("norte").geir ? 1 : -1) },
    { id: "SR-04", k: "quilla", n: 5, estado: () => { if (!st.quilla) return -1; if (st.quillaHecha) return 5; if (!H.tiene("custodio_vencido")) return 0; if (!st.tronco) return 1; if (!st.arrastre) return 2; if (!st.herrajes) return 3; return 4; } },
    { id: "SR-05", k: "cuaderno", n: 2, estado: () => { const s = sub("norte"); return s.cuaderno === 2 ? 2 : s.cuaderno === 1 ? 1 : -1; } },
    { id: "SR-09", k: "calcos", n: 2, estado: () => (!st.torvald ? -1 : st.dados >= 6 ? 2 : (st.calcos || []).filter(Boolean).length >= 6 ? 1 : 0) },
    { id: "SR-12", k: "cinta", n: 2, estado: () => { const c = sub("claro").cinta; return c === 2 ? 2 : c === 1 ? 1 : -1; } },
    { id: "SZ-01", k: "huldra", n: 2, estado: () => (!st.huldra ? -1 : st.huldra >= 3 ? 2 : st.huldra === 2 ? 1 : 0) },
    { id: "SZ-07", k: "nokk", n: 2, estado: () => (!st.nokk ? -1 : st.nokk >= 2 ? 2 : (st.troncos || 0) >= 3 ? 1 : 0) },
  ];
  const hechas = () => CADENAS.filter((c) => c.estado() >= c.n).length;

  // las seis inscripciones que pide Torvald: se calcan con la Lente
  function inscripciones() {
    const N = W.NOMBRADAS,
      P = W.PUNTOS,
      o = (x) => x && [x.x, x.y];
    return [o(N.mojones && N.mojones[0]), o(N.tocones && N.tocones[0]), o(N.poste_cruzaron), P.menhir, P.dintel, o(N.estelas && N.estelas[0])];
  }

  // ---------- proezas ----------
  const PROEZAS = [
    () => H.tiene("ciervo_vencido"),
    () => H.tiene("custodio_vencido"),
    () => !!st.semi.lobo_viejo,
    () => !!st.semi.primero,
    () => !!st.semi.loba,
    () => !!st.semi.vigia,
    () => !!st.semi.oso, // el oso de zarzal (caravana de Skeld)
    () => false, // el último vecino (Skarnholt)
    () => false, // el ahogado de la cisterna (Brunvik)
    () => false, // el haugbúi (túmulo)
    () => !!st.quillaHecha,
    () => st.dados >= 6,
  ];
  const proezas = () => PROEZAS.filter((f) => f()).length;

  // ---------- renombre ----------
  function nivelRenombre() {
    let n = 0;
    if (H.completa("EL-02")) n = 1;
    if (n === 1 && H.completa("EL-04") && hechas() >= 4) n = 2;
    if (n === 2 && H.completa("EL-06") && proezas() >= 3) n = 3;
    if (n === 3 && proezas() >= 12 && st.goinn) n = 4;
    return n;
  }

  function aplicarEste() {
    // el nøkk le muestra el arcón: queda como si lo hubiera visto la Lente
    const e = sub("este");
    if (st.nokk >= 2 && !e.cofrePuente) e.cofrePuente = 1;
  }

  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      H = A.H;
      st = { semi: {}, calcos: [], dados: 0 };
      const L = W.LUGARES,
        mas = W.mas;
      crearSemi("lobo_viejo", libre(W.PUNTOS.semi_lobo_viejo));
      crearSemi("primero", libre(mas(L.refugio.p, 4, 7)));
      crearSemi("loba", libre(W.PUNTOS.semi_loba));
      crearSemi("vigia", libre(mas(L.torre.p, -3, 8)));
      crearSemi("oso", libre(mas(L.caravana.p, 7, 5)));
      // la huldra al borde del bosque, al oeste del Puesto; los tres lobos con la campana, más adentro
      const ph = libre(W.PUNTOS.huldra);
      huldra.x = ph[0];
      huldra.y = ph[1];
      const pl = libre(W.PUNTOS.lobos_huldra);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2,
          e = A.CB.crear("lobo", pl[0] + Math.cos(a) * 110, pl[1] + Math.sin(a) * 70, { pal: 2, grupo: lobosHuldra });
        e.huldra = true;
        lobosHuldra.push(e);
        A.enemigos.push(e);
      }
      // el nøkk en el agua, al costado del tablero del puente oriental; los troncos trabados, río arriba del torno
      const PO = W.PUENTES[2],
        dx = PO.b[0] - PO.a[0],
        dy = PO.b[1] - PO.a[1],
        l = Math.hypot(dx, dy);
      nokk.x = PO.a[0] + dx * 0.36 + (dy / l) * 250;
      nokk.y = PO.a[1] + dy * 0.36 - (dx / l) * 250;
      const c = L.aserradero.p;
      lugarTroncos = [mas(c, 11.4, -18.6), mas(c, 12.6, -20.2), mas(c, 11, -21.4)];
    },
    alEmpezar(extra) {
      ex = extra;
      extra.encargos = Object.assign({ semi: {}, calcos: [], dados: 0 }, extra.encargos || {});
      st = extra.encargos;
      st.tirando = 0;
      for (const id in jefes) {
        const j = jefes[id];
        A.CB.reiniciar(j.e);
        j.e.activo = false;
        j.e.muerto = st.semi[id] ? 1 : 0;
        j.llamo = 0;
        j.esb.forEach((m) => ((m.activo = false), (m.muerto = 1)));
        rotular(id);
      }
      lobosHuldra.forEach((e) => {
        A.CB.reiniciar(e);
        if (st.huldra >= 2) e.muerto = 1;
      });
      campanaSuelo = null;
      if (st.renombre == null) st.renombre = nivelRenombre();
      st.proezas = st.proezas == null ? proezas() : st.proezas;
      aplicarEste();
    },
    alMorir(e) {
      if (e.semi) {
        st.semi[e.semi] = 1;
        HUD.aviso(t("hd.unico_caido", [e.lider.nombre]), "#FFD98A");
        if (window.PODERES) {
          PODERES.soltar(e.x, e.y, "plata", 40);
          PODERES.soltar(e.x, e.y, "vida", 40);
          J.retrasar(0.6, () => PODERES.darFragmento());
        }
        J.retrasar(1.6, () => HUD.aviso(t("sc.trofeo_" + e.semi), "#E0B2B2"));
        jefes[e.semi].esb.forEach((m) => !m.muerto && A.CB.golpear(J, m, 9999, e.x, e.y));
      }
      if (e.huldra && lobosHuldra.every((q) => q.muerto)) {
        campanaSuelo = [e.x, e.y];
      }
    },
    actualizar(dt) {
      // los semijefes aparecen cuando toca y llaman a los suyos al bajar de cierta vida
      for (const id in jefes) {
        const j = jefes[id],
          e = j.e,
          S = SEMI[id];
        if (st.semi[id]) continue;
        const peleando = e.activo && e.estado !== "quieto" && e.estado !== "vuelve";
        e.activo = peleando || (S.cuando() && cerca(j.p, 40 * W.M));
        if (e.vida >= e.d.vida) j.llamo = 0;
        if (j.llamo < S.llama.length && e.vida < e.d.vida * S.llama[j.llamo] && e.vida > 0) {
          j.llamo++;
          llamar(id);
        }
        if (!e.activo) j.esb.forEach((m) => m.estado === "quieto" && ((m.activo = false), (m.muerto = 1)));
      }
      // los lobos de la campana solo andan si la huldra ya pidió ayuda y Eromash se acerca
      lobosHuldra.forEach((e) => (e.activo = st.huldra === 1 && cerca([e.casa[0], e.casa[1]], 30 * W.M)));
      // los avisos de proeza y de renombre
      const pz = proezas();
      if (pz > st.proezas) {
        st.proezas = pz;
        J.retrasar(2.4, () => HUD.aviso(t("sc.proeza_nueva", [pz]), "#FFD98A"));
      }
      const rn = nivelRenombre();
      if (rn > st.renombre) {
        st.renombre = rn;
        J.retrasar(3.4, () => HUD.aviso(t("sc.renombre_sube", [t("sc.renombre_" + rn)]), "#FFD98A"));
        J.retrasar(5.4, () => HUD.aviso(t("sc.renombre_abre", [t("sc.renombre_abre_" + rn)]), "#FFD98A"));
      }
    },
    cercanos(dar) {
      const N = W.NOMBRADAS,
        P = W.PUNTOS,
        gente = (window.CAPITAL && CAPITAL.gente) || [],
        de = (id) => gente.find((n) => n.id === id && !n.fuera),
        junto = (n, r) => n && cerca([n.x, n.y], r || 120),
        este = sub("este");
      // SR-03 la tablilla de Geir, para Grim
      const grim = de("grim");
      if (junto(grim) && sub("norte").geir && !st.grim)
        dar(1, t("sc.accion_geir"), () =>
          A.dialogoLibre([["eromash", "sc.geir_0"], ["grim", "sc.geir_1"], ["grim", "sc.geir_2"]], () => {
            st.grim = 1;
            HUD.aviso(t("sc.geir_hecho"), "#FFD98A");
          })
        );
      // SR-04 la quilla de Sten
      const sten = de("sten");
      if (junto(sten) && !st.quilla && H.completa("EL-03"))
        dar(1, t("sc.accion_quilla"), () =>
          A.dialogoLibre([["sten", "sc.sten_0"], ["sten", "sc.sten_1"], ["eromash", "sc.sten_2"], ["sten", "sc.sten_3"]], () => {
            st.quilla = 1;
            HUD.aviso(t("sc.encargo_nuevo", [t("sc.c_quilla")]), "#FFD98A");
          })
        );
      if (junto(sten) && st.quillaHecha && !st.stenFin)
        dar(1, t("sc.accion_quilla_fin"), () => A.dialogoLibre([["sten", "sc.sten_fin_0"], ["sten", "sc.sten_fin_1"]], () => (st.stenFin = 1)));
      const tq = N.tronco_quilla;
      if (st.quilla && !st.tronco && tq && cerca([tq.x, tq.y + 10], 140))
        dar(45, t("sc.accion_tronco"), () => {
          if (!H.tiene("custodio_vencido")) return hablar("sc.tronco_custodio");
          jug.interactuando = 1;
          st.tronco = 1;
          A.dialogoLibre([["eromash", "sc.tronco_1"]], () => HUD.aviso(t("sc.tronco_hecho"), "#FFD98A"));
        });
      if (st.tronco && !st.arrastre && cerca(P.ylva_compuerta && H.completa("EL-07") ? P.ylva_compuerta : P.ylva, 120))
        dar(1, t("sc.accion_arrastre"), () => {
          if (este.buey !== 2) return hablar("sc.arrastre_sin_buey", "ylva");
          st.arrastre = 1;
          A.dialogoLibre([["ylva", "sc.arrastre_1"], ["ylva", "sc.arrastre_2"]]);
        });
      const orm = A.npcs.orm;
      if (st.herrajes === 1 && orm && cerca([orm.x, orm.y], 130))
        dar(1, t("sc.accion_herrajes_orm"), () =>
          A.dialogoLibre([["orm", "sc.orm_quilla_0"], ["orm", "sc.orm_quilla_1"]], () => {
            st.herrajes = 2;
            st.quillaHecha = 1;
            HUD.aviso(t("sc.encargo_hecho", [t("sc.c_quilla")]), "#FFD98A");
          })
        );
      // SR-09 los calcos de Torvald
      const tor = de("torvald");
      if (junto(tor) && H.completa("EL-02")) {
        if (!st.torvald)
          dar(1, t("sc.accion_torvald"), () =>
            A.dialogoLibre([["torvald", "sc.torvald_0"], ["torvald", "sc.torvald_1"], ["torvald", "sc.torvald_2"]], () => {
              st.torvald = 1;
              HUD.aviso(t("sc.encargo_nuevo", [t("sc.c_calcos")]), "#FFD98A");
            })
          );
        else {
          const i = (st.calcos || []).findIndex((v, k) => v && k >= 0 && !(st.entregados || [])[k]);
          if (i >= 0)
            dar(1, t("sc.accion_calco"), () => {
              st.entregados = st.entregados || [];
              st.entregados[i] = 1;
              st.dados = (st.dados || 0) + 1;
              if (window.PODERES) PODERES.darPlata(12);
              const lineas = [["torvald", "sc.calco_hist_" + i]];
              if (st.dados >= 6) lineas.push(["torvald", "sc.torvald_fin"]);
              A.dialogoLibre(lineas);
            });
        }
      }
      // SR-12 la cinta: contarle a Eydis
      const eydis = A.npcs.eydis,
        cl = sub("claro");
      if (cl.cinta === 1 && eydis && cerca([eydis.x, eydis.y], 130))
        dar(1, t("sc.accion_cinta"), () => A.dialogoLibre([["eromash", "sc.cinta_0"], ["eydis", "sc.cinta_1"], ["eydis", "sc.cinta_2"]], () => (cl.cinta = 2)));
      // SZ-01 la campana de la huldra
      if (cerca([huldra.x, huldra.y], 120))
        dar(45, t("av.accion_hablar") + " · " + t("av.nombre_huldra"), () => {
          huldra.mira = VIKINGO.vista(jug.x - huldra.x, jug.y - huldra.y, huldra.mira);
          if (!st.huldra) A.dialogoLibre([["huldra", "sc.huldra_0"], ["huldra", "sc.huldra_1"]], () => (st.huldra = 1));
          else if (st.huldra === 1) hablar("sc.huldra_espera", "huldra");
          else if (st.huldra === 2)
            A.dialogoLibre([["huldra", "sc.huldra_gracias_0"], ["huldra", "sc.huldra_gracias_1"]], () => {
              st.huldra = 3;
              if (window.PODERES) PODERES.darPlata(20);
              HUD.aviso(t("sc.encargo_hecho", [t("sc.c_huldra")]), "#FFD98A");
            });
          else
            A.menu(`<h2>${t("av.nombre_huldra")}</h2><div class="sub">${t("sc.huldra_atajo_sub")}</div>`, [
              { texto: t("sc.huldra_atajo"), fn: () => (A.cerrarMenu(), A.teletransportar(P.refugio[0] + 60, P.refugio[1] + 200)) },
              { texto: t("ui.cerrar"), fn: A.cerrarMenu },
            ]);
        });
      if (campanaSuelo && st.huldra === 1 && cerca(campanaSuelo, 100))
        dar(35, t("sc.accion_campana"), () => {
          campanaSuelo = null;
          st.huldra = 2;
          HUD.aviso(t("sc.campana"), "#FFD98A");
        });
      // SZ-07 el nøkk del puente
      if (cerca([nokk.x, nokk.y], 320))
        dar(45, t("av.accion_hablar") + " · " + t("av.nombre_nokk"), () => {
          if (!st.nokk) A.dialogoLibre([["nokk", "sc.nokk_0"], ["nokk", "sc.nokk_1"], ["nokk", "sc.nokk_2"]], () => (st.nokk = 1));
          else if (st.nokk === 1 && (st.troncos || 0) >= 3)
            A.dialogoLibre([["nokk", "sc.nokk_gracias_0"], ["nokk", "sc.nokk_gracias_1"]], () => {
              st.nokk = 2;
              aplicarEste();
              HUD.aviso(t("sc.encargo_hecho", [t("sc.c_nokk")]), "#FFD98A");
            });
          else hablar(st.nokk >= 2 ? "sc.nokk_rato" : "sc.nokk_espera", "nokk");
        });
      if (st.nokk === 1 && (st.troncos || 0) < 3 && !st.tirando && cerca(P.torno_buey, 130) && este.buey === 2)
        dar(38, t("sc.accion_tronco_torno"), () => {
          if (!este.compuerta && !H.completa("EL-07")) return hablar("es.torno_sin_agua");
          jug.interactuando = 1.2;
          st.tirando = 0.001;
          HUD.aviso(t("es.torno_tira"), "#FFD98A");
        });
    },
    lente(x, y) {
      if (!st.torvald) return false;
      let algo = false;
      inscripciones().forEach((p, i) => {
        if (!p || st.calcos[i] || Math.hypot(p[0] - x, p[1] - y) > 520) return;
        st.calcos[i] = 1;
        algo = true;
        J.retrasar(0.6, () => HUD.aviso(t("sc.calcado", [t("sc.calco_" + i), st.calcos.filter(Boolean).length]), "#73D5DB"));
      });
      return algo;
    },
    cuerpos(f) {
      f(huldra.x, huldra.y, 36);
    },
    objetos(lista, visible, c) {
      // la huldra: la cola de vaca asoma por debajo de la falda
      if (visible(huldra.x, huldra.y)) {
        if (Math.hypot(jug.x - huldra.x, jug.y - huldra.y) < 300) huldra.mira = VIKINGO.vista(jug.x - huldra.x, jug.y - huldra.y, huldra.mira);
        lista.push({
          x: huldra.x,
          y: huldra.y,
          f: () => {
            GENTE.dibujar(c, "huldra", huldra.x, huldra.y, J.t, huldra.mira);
          },
        });
      }
      // la campana en el piso, donde cayó el último lobo
      if (campanaSuelo && visible(campanaSuelo[0], campanaSuelo[1])) {
        const [bx, by] = campanaSuelo;
        lista.push({
          x: bx,
          y: by,
          f: () => {
            DIB.halo(c, bx, by - 10, 50, "#FFD98A", 0.4 + Math.sin(J.t * 4) * 0.15);
            DIB.P(c, [bx - 10, by, bx - 7, by - 18, bx + 7, by - 18, bx + 10, by], "#B88A3A");
            DIB.R(c, bx - 2, by - 23, 4, 5, "#5E4430");
          },
        });
      }
      // el nøkk, metido en el agua hasta la cintura, tocando
      if (visible(nokk.x, nokk.y)) {
        lista.push({
          x: nokk.x,
          y: nokk.y,
          f: () => {
            const yy = nokk.y + 34;
            c.save();
            c.beginPath();
            c.rect(nokk.x - 80, nokk.y - 200, 160, 200 - 34 + 34);
            c.clip();
            DIB.alfa(c, 0.9, () => GENTE.dibujar(c, "nokk", nokk.x, yy, J.t, { vista: "S", espejo: false }));
            c.restore();
            // el violín y el arco
            const sw = Math.sin(J.t * 5) * 8;
            DIB.P(c, [nokk.x + 6, yy - 74, nokk.x + 22, yy - 80, nokk.x + 28, yy - 66, nokk.x + 12, yy - 60], "#8A4A2A");
            DIB.L(c, nokk.x - 10 + sw, yy - 92, nokk.x + 36 + sw, yy - 58, "#E6DCC8", 2);
            DIB.alfa(c, 0.5, () => DIB.E(c, nokk.x, nokk.y + 2, 40 + Math.sin(J.t * 2) * 4, 10, "#CDE8F0"));
          },
        });
      }
      // los troncos trabados en el río, y el que el torno arrastra a la orilla
      const P = W.PUNTOS;
      lugarTroncos.forEach((p, i) => {
        const sacados = st.troncos || 0;
        if (i < sacados) return;
        let [x, y] = p;
        if (i === sacados && st.tirando > 0 && P.torno_buey) {
          const u = st.tirando;
          x += (P.torno_buey[0] + 200 - x) * u;
          y += (P.torno_buey[1] - 40 - y) * u;
        }
        if (!visible(x, y)) return;
        lista.push({
          x: x,
          y: y,
          f: () => {
            const a = [0.25, -0.35, 0.6][i],
              enAgua = !(i === sacados && st.tirando > 0.6);
            c.save();
            c.translate(x, y);
            c.rotate(a);
            DIB.R(c, -110, -16, 220, 32, "#5E4430");
            DIB.R(c, -110, -16, 220, 9, "#7A5A3A");
            DIB.E(c, 110, 0, 10, 16, "#B89868");
            DIB.E(c, 110, 0, 5, 8, "#7A5A3A");
            // medio hundido: el agua tapa la mitad de abajo y hace espuma en los bordes
            if (enAgua) {
              DIB.alfa(c, 0.7, () => DIB.R(c, -116, 2, 232, 18, "#2E5560"));
              DIB.L(c, -112, 3 + Math.sin(J.t * 3 + i) * 2, 112, 3 + Math.cos(J.t * 3 + i) * 2, "#CDE8F0", 2);
            }
            c.restore();
          },
        });
      });
      // las espinas del lobo viejo de zarzal, sobre el lomo
      const lv = jefes.lobo_viejo && jefes.lobo_viejo.e;
      if (lv && lv.activo && !lv.muerto && visible(lv.x, lv.y))
        lista.push({
          x: lv.x,
          pie: lv.y,
          y: lv.y + 0.5,
          f: () => {
            const s = lv.s;
            for (let k = 0; k < 5; k++) {
              const x = lv.x + (k - 2) * 7 * s,
                y = lv.y - (30 + Math.sin(k * 1.7) * 2) * s;
              DIB.P(c, [x - 2.5 * s, y + 3 * s, x + (k % 2 ? 2 : -2) * s, y - 8 * s, x + 2.5 * s, y + 3 * s], "#2A1E14");
            }
          },
        });
    },
    diario() {
      const filas = CADENAS.map((ch) => {
        const e = ch.estado();
        if (e < 0) return "";
        const hecho = e >= ch.n;
        const paso = hecho ? t("sc.hecho") : t("sc.c_" + ch.k + "_" + e);
        return `<p>${hecho ? "✓" : "◆"} <b>${t("sc.c_" + ch.k)}</b> · ${paso}</p>`;
      }).join("");
      const pz = PROEZAS.map((f, i) => `<span style="opacity:${f() ? 1 : 0.45}">${f() ? "✓" : "○"} ${t("sc.proeza_" + i)}</span>`).join("<br>");
      const rn = nivelRenombre();
      let html = `<div class="diario-resumen"><p><b>${t("sc.renombre")}</b> · ${t("sc.renombre_" + rn)}${rn ? " · " + t("sc.descuento", [rn * 5]) : ""}</p>${[1, 2, 3, 4].map((k) => `<p style="opacity:${k <= rn ? 1 : 0.45}">${k <= rn ? "✓" : "○"} <b>${t("sc.renombre_" + k)}</b> · ${t("sc.renombre_abre_" + k)}</p>`).join("")}</div>`;
      if (filas) html += `<div class="diario-resumen"><p><b>${t("sc.encargos")}</b></p>${filas}</div>`;
      html += `<div class="diario-resumen"><p><b>${t("sc.proezas", [proezas()])}</b></p><p>${pz}</p></div>`;
      return html;
    },
  };
  // el tirón del torno con los troncos del nøkk
  const act0 = sistema.actualizar;
  sistema.actualizar = (dt) => {
    act0(dt);
    if (st.tirando > 0) {
      st.tirando = Math.min(1, st.tirando + dt / 3);
      if (st.tirando >= 1) {
        st.tirando = 0;
        st.troncos = (st.troncos || 0) + 1;
        HUD.aviso(t("sc.tronco_sacado", [st.troncos]), "#FFD98A");
      }
    }
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return {
    descuento: () => (st && A ? nivelRenombre() * 0.05 : 0),
    proezas: () => (st && A ? proezas() : 0),
    marcarGoinn: () => st && (st.goinn = 1),
    renombre: () => (st && A ? nivelRenombre() : 0),
    // lo que Eromash lleva encima por los encargos (lo muestra la mochila de inventario.js)
    llevas() {
      if (!st || !A) return [];
      const l = [];
      if (sub("senda").cepillo === 1) l.push({ id: "cepillo", icono: "cepillo" });
      if (sub("norte").geir && !st.grim) l.push({ id: "tablilla", icono: "tablilla" });
      if (sub("norte").cuaderno === 1) l.push({ id: "cuaderno", icono: "libro" });
      if (sub("claro").cinta === 1) l.push({ id: "cinta", icono: "cinta" });
      if (st.huldra === 2) l.push({ id: "campana", icono: "campana" });
      if (st.herrajes === 1) l.push({ id: "herrajes", icono: "herrajes" });
      const calcos = (st.calcos || []).filter((v, k) => v && !(st.entregados || [])[k]).length;
      if (calcos) l.push({ id: "calcos", icono: "pergamino", cant: calcos });
      return l;
    },
    // Ása: los herrajes de la quilla cuando ya le llegó el hierro de Grim
    hablarCon(n) {
      if (!st || n.id !== "asa") return false;
      if (st.quilla && st.arrastre && !st.herrajes) {
        if (!st.grim) {
          A.dialogoLibre([["asa", "sc.asa_sin_hierro"]]);
          return true;
        }
        A.dialogoLibre([["asa", "sc.asa_herrajes_0"], ["asa", "sc.asa_herrajes_1"]], () => {
          st.herrajes = 1;
          HUD.aviso(t("sc.herrajes"), "#FFD98A");
        });
        return true;
      }
      return false;
    },
  };
})();
