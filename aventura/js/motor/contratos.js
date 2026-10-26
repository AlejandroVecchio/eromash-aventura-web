// ---------- los contratos de caza y los trofeos (sistema CONTRATOS) ----------
// Como los contratos de The Witcher: en el poste de los contratos, frente al Puesto de Eydis, hay pedidos clavados por
// la gente de Eldervald contra una bestia con nombre (Grisvarg el lobo de ceniza, Skjalda Sin Mandíbula, la Cerda de
// Turba, el Fatuo que Canta, Bjarg de la Quebrada, Hrafnkatla la Madre de Cuervos). Se toma uno por vez: marca una
// zona en el mapa y en la brújula; ahí hay tres **rastros** para examinar con E (la Lente los hace brillar), cada uno
// cuenta algo y lleva al siguiente; el tercero marca la **guarida**, donde la bestia espera con su escolta (un líder
// con afijos, más fuerte cuanto más pide el contrato). Vencida, se vuelve al poste a cobrar: plata y su **trofeo**.
// Los trofeos se cuelgan del cinto (uno por vez, como en Witcher 3) y cada uno da lo suyo: rapidez, armadura,
// estamina, poder rúnico, vida o hallazgo. Se eligen en el poste o en la Bolsa de la mochila.
// Estado en E.extra.contratos = { activo, c: { id: { fase, rastros } }, trofeos: [id], colgado }. Textos `ct.`.
window.CONTRATOS = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  // los contratos: la bestia, cerca de qué lugar, su escolta, nivel, paga y el trofeo
  const LISTA = [
    { id: "grisvarg", tipo: "lobo", lugar: "tala", escolta: ["lobo", "lobo", "lobo"], afijos: ["veloz", "igneo"], nivel: 2, plata: 140, trofeo: "colmillo" },
    { id: "cerda", tipo: "jabali", lugar: "brunvik", escolta: ["jabali", "jabali"], afijos: ["piedra"], nivel: 4, plata: 190, trofeo: "colmillos" },
    { id: "skjalda", tipo: "draugr", lugar: "tumulo", escolta: ["errante", "draugr", "errante"], afijos: ["helado", "piedra"], nivel: 5, plata: 230, trofeo: "yelmo" },
    { id: "hrafnkatla", tipo: "cuervo", lugar: "torre", escolta: ["cuervo", "cuervo", "cuervo", "cuervo"], afijos: ["veloz", "runico"], nivel: 6, plata: 260, trofeo: "pluma" },
    { id: "fatuo", tipo: "fatuo", lugar: "santuario", escolta: ["fatuo", "errante", "fatuo"], afijos: ["runico", "helado"], nivel: 8, plata: 320, trofeo: "farol" },
    { id: "bjarg", tipo: "trol", lugar: "paso_sur", escolta: ["jabali", "draugr"], afijos: ["piedra", "igneo"], nivel: 10, plata: 420, trofeo: "piedra" },
  ];
  // lo que da cada trofeo colgado (se suma con RPG.aporte)
  const TROFEOS = {
    colmillo: { col: "#E0B2B2", aporte: (s) => (s.velAtq *= 1.06), pct: 6 },
    colmillos: { col: "#C8B48C", aporte: (s) => (s.estamina += 15), n: 15 },
    yelmo: { col: "#8A8478", aporte: (s) => (s.armadura += 8), n: 8 },
    pluma: { col: "#3A3634", aporte: (s) => (s.botin *= 1.15), pct: 15 },
    farol: { col: "#73D5DB", aporte: (s) => (s.runico *= 1.1), pct: 10 },
    piedra: { col: "#8A847C", aporte: (s) => (s.vida += 25), n: 25 },
  };
  const RADIO_RASTRO = 110,
    GUARIDA = 1300; // a esta distancia de la guarida aparece la bestia
  const base = () => ({ activo: null, c: {}, trofeos: [], colgado: null });
  let st = base();
  let poste = null;
  const lugares = {}; // id → { zona: [x, y], rastros: [[x, y]×3], guarida: [x, y] }
  const bestias = {}; // id → [criaturas]
  let brillo = 0;

  // ---------- el mundo ----------
  function armar() {
    const rnd = DIB.azar(8812001),
      libre = (x, y) => W.libre(x, y, 50) && W.libre(x - 40, y, 30) && W.libre(x + 40, y, 30),
      buscar = (p, dmin, dmax, sinCamino) => {
        for (let k = 0; k < 120; k++) {
          const a = rnd() * Math.PI * 2,
            d = dmin + rnd() * (dmax - dmin),
            x = p[0] + Math.cos(a) * d,
            y = p[1] + Math.sin(a) * d * 0.8;
          if (x < 400 || y < 400 || x > W.ANCHO - 400 || y > W.ALTO - 400 || !libre(x, y)) continue;
          if (sinCamino && W.CAMINOS.some((c) => W.distLinea(x, y, c.p) < c.w / 2 + 80)) continue;
          return [x, y];
        }
        return [p[0] + dmin, p[1]];
      };
    // el poste, frente al portón del Puesto
    const pu = W.PUNTOS.puesto || W.LUGARES.puesto.p;
    const pp = buscar([pu[0] + 260, pu[1] + 60], 0, 260);
    poste = W.agregar("posteContratos", pp, { n: 6, sem: 2 });
    for (const k of LISTA) {
      const L = W.LUGARES[k.lugar];
      const guarida = buscar(L.p, L.r + 1500, L.r + 2600, true);
      // los rastros: de afuera hacia la guarida, cada vez más cerca
      const desde = Math.atan2(pu[1] - guarida[1], pu[0] - guarida[0]) + (rnd() - 0.5) * 1.2,
        rastros = [1150, 780, 420].map((d, i) => {
          const a = desde + (i - 1) * 0.5 + (rnd() - 0.5) * 0.4;
          const x = guarida[0] + Math.cos(a) * d,
            y = guarida[1] + Math.sin(a) * d * 0.8;
          return libre(x, y) ? [x, y] : buscar([x, y], 0, 260);
        });
      lugares[k.id] = { zona: [(rastros[0][0] + guarida[0]) / 2, (rastros[0][1] + guarida[1]) / 2], rastros, guarida };
    }
  }
  const def = (id) => LISTA.find((k) => k.id === id);
  const estado = (id) => st.c[id] || { fase: "libre", rastros: 0 };
  const disponibles = () => LISTA.filter((k) => estado(k.id).fase === "libre" || estado(k.id).fase === "vencido");

  // ---------- la bestia y su escolta ----------
  function soltarBestia(id) {
    if (bestias[id]) return;
    const k = def(id),
      g = lugares[id].guarida,
      nivelPj = window.RPG ? RPG.nivel() : 1,
      mas = 1 + Math.max(k.nivel, nivelPj) * 0.12;
    const grupo = [];
    const lider = { nombre: t("ct." + id), titulo: t("ct.de_contrato") + " · " + k.afijos.map((a) => t("hd.af_" + a)).join(" · "), afijos: k.afijos, contrato: id };
    const e = A.CB.crear(k.tipo, g[0], g[1], { pal: 2, grupo, lider, mas: mas * 1.25 });
    e.contrato = id;
    grupo.push(e);
    k.escolta.forEach((tp, i) => {
      const a = (i / k.escolta.length) * Math.PI * 2;
      const m = A.CB.crear(tp, g[0] + Math.cos(a) * 110, g[1] + Math.sin(a) * 70, { pal: 2, grupo, mas });
      m.escoltaDe = id;
      grupo.push(m);
    });
    grupo.forEach((q) => A.enemigos.push(q));
    bestias[id] = grupo;
  }

  // ---------- tomar, examinar, cobrar ----------
  function tomar(id) {
    if (st.activo) return HUD.aviso(t("ct.ya_uno"), "#C8402D"), false;
    st.activo = id;
    st.c[id] = { fase: "rastros", rastros: 0 };
    poste.o.suena = 1;
    J.retrasar(1.5, () => (poste.o.suena = 0));
    if (window.SONIDO) SONIDO.tocar("pagina", { vol: 0.5 });
    HUD.aviso(t("ct." + id), "lugar", t("ct.tomado"));
    return true;
  }
  function examinar(id, i) {
    const s = st.c[id];
    if (!s || s.fase !== "rastros" || s.rastros !== i) return;
    s.rastros++;
    A.dialogoLibre([["eromash", "ct." + id + "_r" + (i + 1)]]);
    if (window.ANIMA) ANIMA.gesto("duda");
    if (s.rastros >= 3) {
      s.fase = "guarida";
      J.retrasar(0.5, () => HUD.aviso(t("ct.guarida", [t("ct." + id)]), "#FF8D71"));
    }
  }
  function vencida(id) {
    const s = st.c[id];
    if (!s || s.fase !== "guarida") return;
    s.fase = "cobrar";
    HUD.aviso(t("ct.vencida", [t("ct." + id)]), "lugar", t("ct.volver"));
    if (window.SONIDO) SONIDO.tocar("mision", { vol: 0.5 });
  }
  function cobrar(id) {
    const s = st.c[id],
      k = def(id);
    if (!s || s.fase !== "cobrar") return false;
    s.fase = "vencido";
    s.veces = (s.veces || 0) + 1;
    st.activo = null;
    const plata = Math.round(k.plata * (s.veces > 1 ? 0.5 : 1));
    PODERES.darPlata(plata);
    let nuevo = false;
    if (!st.trofeos.includes(k.trofeo)) {
      st.trofeos.push(k.trofeo);
      nuevo = true;
      if (!st.colgado) colgar(k.trofeo);
    }
    if (window.RPG) RPG.dar && RPG.dar(60 + k.nivel * 25);
    HUD.aviso(t("ct.cobrado", [plata]) + (nuevo ? " · " + t("ct.trofeo_" + k.trofeo) : ""), "#FFD98A");
    if (window.SONIDO) SONIDO.tocar("plata", { vol: 0.6 });
    // vuelve a quedar en el poste, más difícil y por la mitad de plata (la bestia se repone)
    delete bestias[id];
    return true;
  }
  function colgar(tr) {
    if (!st.trofeos.includes(tr)) return false;
    st.colgado = st.colgado === tr ? null : tr;
    if (window.RPG) RPG.recalcular();
    HUD.aviso(st.colgado ? t("ct.colgaste", [t("ct.trofeo_" + tr)]) : t("ct.descolgaste"), "#E0B2B2");
    return true;
  }
  // el texto de lo que da un trofeo
  const daTrofeo = (tr) => t("ct.da_" + tr, [TROFEOS[tr].pct || TROFEOS[tr].n]);

  // ---------- el poste ----------
  function menuPoste() {
    const fila = (k) => {
      const s = estado(k.id),
        lejos = k.nivel > (window.RPG ? RPG.nivel() : 1) + 3;
      if (s.fase === "cobrar") return { texto: t("ct.cobrar", [t("ct." + k.id)]), sub: t("ct.cobrar_sub", [k.plata]), fn: () => (cobrar(k.id), menuPoste()) };
      if (st.activo === k.id) return { texto: t("ct." + k.id), sub: t("ct.en_curso"), fn: () => A.dialogoLibre([["eromash", "ct." + k.id + "_pide"]], menuPoste) };
      return {
        texto: t("ct." + k.id) + (s.veces ? " · " + t("ct.otra_vez") : ""),
        sub: t("ct.pedido_sub", [k.nivel, Math.round(k.plata * (s.veces ? 0.5 : 1)), t("ct.trofeo_" + k.trofeo)]) + (lejos ? " · " + t("ct.peligroso") : ""),
        fn: () => A.dialogoLibre([["eromash", "ct." + k.id + "_pide"]], () => (tomar(k.id), A.cerrarMenu())),
      };
    };
    const botones = LISTA.filter((k) => estado(k.id).fase !== "vencido" || true).map(fila);
    if (st.trofeos.length) botones.push({ texto: t("ct.trofeos"), sub: st.colgado ? t("ct.colgado", [t("ct.trofeo_" + st.colgado)]) : t("ct.ninguno"), fn: menuTrofeos });
    if (st.activo) botones.push({ texto: t("ct.abandonar"), sub: t("ct." + st.activo), fn: () => abandonar() });
    botones.push({ texto: t("ui.cerrar"), fn: A.cerrarMenu });
    A.menu(`<h2>${t("ct.titulo")}</h2><div class="sub">${t("ct.sub")}</div>`, botones);
  }
  function menuTrofeos() {
    A.menu(
      `<h2>${t("ct.trofeos")}</h2><div class="sub">${t("ct.trofeos_sub")}</div>`,
      st.trofeos
        .map((tr) => ({ texto: t("ct.trofeo_" + tr) + (st.colgado === tr ? " ✓" : ""), sub: daTrofeo(tr), fn: () => (colgar(tr), menuTrofeos()) }))
        .concat([{ texto: t("ui.volver"), fn: menuPoste }]),
    );
  }
  function abandonar() {
    const id = st.activo;
    if (!id) return;
    st.c[id] = { fase: estado(id).veces ? "vencido" : "libre", rastros: 0, veces: estado(id).veces };
    st.activo = null;
    if (bestias[id]) bestias[id].forEach((e) => (e.activo = false));
    delete bestias[id];
    A.cerrarMenu();
    HUD.aviso(t("ct.abandonado"), "#E0B2B2");
  }

  // ---------- la Bolsa: los trofeos ----------
  function celdas() {
    return st.trofeos.map((tr) => ({ id: "tr_" + tr, icono: "tr_" + tr, nombre: t("ct.trofeo_" + tr), desc: daTrofeo(tr) + " " + t(st.colgado === tr ? "ct.pista_descolgar" : "ct.pista_colgar"), elegida: st.colgado === tr, fn: () => colgar(tr) }));
  }
  function iconos() {
    if (!window.INVENTARIO || !INVENTARIO.iconoDe) return;
    const { P, E, L } = DIB;
    const tiento = (c) => {
      L(c, -8, -26, 0, -16, "#7A5634", 2);
      L(c, 8, -26, 0, -16, "#7A5634", 2);
    };
    INVENTARIO.iconoDe("tr_colmillo", (c) => {
      tiento(c);
      P(c, [-8, -14, 8, -14, 4, 10, 0, 26, -4, 10], "#E0D4C0");
      P(c, [0, -14, 8, -14, 4, 10, 0, 26], "#F2ECEC");
    });
    INVENTARIO.iconoDe("tr_colmillos", (c) => {
      tiento(c);
      P(c, [-20, -12, -6, -14, -12, 4, -22, 18, -16, 0], "#E0D4C0");
      P(c, [20, -12, 6, -14, 12, 4, 22, 18, 16, 0], "#F2ECEC");
      E(c, 0, -14, 6, 4, "#5E3A1E");
    });
    INVENTARIO.iconoDe("tr_yelmo", (c) => {
      P(c, [-22, 10, -20, -10, -8, -22, 8, -22, 20, -10, 22, 10], "#5A5458");
      P(c, [8, -22, 20, -10, 22, 10, 6, 10], "#8A8478");
      P(c, [-14, 0, -2, 0, -2, 6, -14, 6], "#111111");
      L(c, 4, -18, 14, 6, "#2A2624", 2.5);
    });
    INVENTARIO.iconoDe("tr_pluma", (c) => {
      P(c, [0, -28, 10, -10, 6, 14, 0, 26, -6, 14, -10, -10], "#1E1A1A");
      P(c, [0, -28, 10, -10, 6, 14, 0, 26], "#3A3434");
      L(c, 0, -24, 0, 26, "#5A5458", 1.4);
    });
    INVENTARIO.iconoDe("tr_farol", (c) => {
      DIB.halo(c, 0, 2, 30, "#73D5DB", 0.5);
      P(c, [-12, -16, 12, -16, 14, 18, -14, 18], "#3A3634");
      P(c, [-8, -12, 8, -12, 9, 14, -9, 14], "#73D5DB");
      P(c, [0, -8, 5, 2, 0, 10, -5, 2], "#C8F2F4");
      L(c, 0, -16, 0, -26, "#3A3634", 2);
    });
    INVENTARIO.iconoDe("tr_piedra", (c) => {
      P(c, [-20, 14, -24, -6, -6, -22, 18, -18, 24, 4, 10, 20], "#5E5852");
      P(c, [-6, -22, 18, -18, 24, 4, 10, 20, 4, 0], "#8A847C");
      // las tres puntas del corazón de piedra
      P(c, [-4, -4, 4, -12, 8, 2, -2, 8], "#C8402D");
    });
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      armar();
      iconos();
      if (window.RPG) RPG.aporte((s) => st.colgado && TROFEOS[st.colgado] && TROFEOS[st.colgado].aporte(s), "contratos");
    },
    alEmpezar(extra) {
      extra.contratos = Object.assign(base(), extra.contratos || {});
      st = extra.contratos;
      for (const id in bestias) bestias[id].forEach((e) => (e.activo = false));
      for (const id in bestias) delete bestias[id];
      if (window.RPG) RPG.recalcular();
    },
    actualizar(dt) {
      brillo = Math.max(0, brillo - dt);
      poste.o.n = disponibles().length;
      const id = st.activo;
      if (!id) return;
      const s = st.c[id];
      if (s.fase === "guarida") {
        const g = lugares[id].guarida;
        if (Math.hypot(g[0] - jug.x, g[1] - jug.y) < GUARIDA) soltarBestia(id);
      }
    },
    alMorir(e) {
      if (e.contrato) vencida(e.contrato);
    },
    lente(x, y) {
      const id = st.activo;
      if (!id || st.c[id].fase !== "rastros") return false;
      const r = lugares[id].rastros[st.c[id].rastros];
      if (Math.hypot(r[0] - x, r[1] - y) > 1500) return false;
      brillo = 10;
      return true;
    },
    cercanos(dar) {
      if (J.dentro) return;
      const dp = Math.hypot(poste.x - jug.x, poste.y + 20 - jug.y);
      if (dp < 130) dar(dp, t(st.activo && st.c[st.activo].fase === "cobrar" ? "ct.accion_cobrar" : "ct.accion_poste"), menuPoste, poste.x, poste.y - 220);
      const id = st.activo;
      if (!id || st.c[id].fase !== "rastros") return;
      const i = st.c[id].rastros,
        r = lugares[id].rastros[i],
        d = Math.hypot(r[0] - jug.x, r[1] - jug.y);
      if (d < RADIO_RASTRO) dar(d, t("ct.accion_rastro"), () => examinar(id, i), r[0], r[1] - 40);
    },
    piso(c, x0, y0, x1, y1) {
      const id = st.activo;
      if (!id) return;
      const L = lugares[id],
        k = def(id),
        s = st.c[id];
      L.rastros.forEach((r, i) => {
        if (i > s.rastros || r[0] < x0 - 100 || r[0] > x1 + 100 || r[1] < y0 - 100 || r[1] > y1 + 100) return;
        ASSETS.dibujar(c, "rastroContrato", r[0], r[1], J.t, { tipo: k.tipo, visto: i < s.rastros, brillo: brillo > 0 && i === s.rastros, s: 1.3 });
      });
    },
    seguimiento() {
      const id = st.activo;
      if (!id) return null;
      const s = st.c[id],
        L = lugares[id],
        m = (p) => Math.max(1, Math.hypot(p[0] - jug.x, p[1] - jug.y) / W.M);
      const objetivos = [];
      if (s.fase === "rastros") objetivos.push({ texto: t("ct.seg_rastros", [s.rastros, 3]), estado: "actual", metros: m(L.rastros[s.rastros]) });
      else objetivos.push({ texto: t("ct.seg_rastros", [3, 3]), estado: "hecho" });
      if (s.fase === "guarida") objetivos.push({ texto: t("ct.seg_guarida"), estado: "actual", metros: m(L.guarida) });
      if (s.fase === "cobrar") objetivos.push({ texto: t("ct.seg_guarida"), estado: "hecho" }, { texto: t("ct.seg_cobrar"), estado: "actual", metros: m([poste.x, poste.y]) });
      return { secundaria: true, id: "contrato", rotulo: t("ct.rotulo"), nombre: t("ct." + id), objetivos };
    },
    // la brújula y el mapa grande (exploracion.js y mapa.js)
    marcasBrujula() {
      const id = st.activo;
      if (!id) return [];
      const s = st.c[id],
        L = lugares[id];
      const p = s.fase === "rastros" ? L.rastros[s.rastros] : s.fase === "guarida" ? L.guarida : [poste.x, poste.y];
      return [{ x: p[0], y: p[1], col: "#FF8D71" }];
    },
    marcasMapa() {
      const l = [{ tipo: "contrato", x: poste.x, y: poste.y, op: { nombre: t("ct.titulo") } }];
      const id = st.activo;
      if (id) {
        const s = st.c[id],
          L = lugares[id];
        const p = s.fase === "guarida" ? L.guarida : L.zona;
        if (s.fase !== "cobrar") l.push({ tipo: "contrato", x: p[0], y: p[1], op: { nombre: t("ct." + id), col: "#FF8D71" } });
      }
      return l;
    },
    diario() {
      const n = LISTA.filter((k) => estado(k.id).veces).length;
      return n ? `<div class="diario-resumen"><p><b>${t("ct.titulo")}</b> ${t("ct.diario", [n, LISTA.length, st.trofeos.length])}</p></div>` : "";
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, tomar, examinar, cobrar, colgar, abandonar, lugares: () => lugares, bestias: () => bestias, poste: () => poste, celdas, LISTA, TROFEOS };
})();
