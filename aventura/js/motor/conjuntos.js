// ---------- los conjuntos de equipo (sistema CONJUNTOS) ----------
// Como los conjuntos verdes del Diablo y los de WoW: tres juegos de cuatro piezas con nombre (La guardia de Eikholt,
// El lobo de Fenrir y Los ojos de Odín). Cada pieza es verde (rareza 4 de OBJETOS), con dos afijos fijos que crecen con
// su nivel, y llevar varias del mismo juego suma: dos piezas, tres piezas y el juego entero, que trae un poder propio
// (la guardia recibe un 15 % menos, el lobo se acelera al matar, Odín recupera energía con los críticos). Caen de los
// únicos, los semijefes, los líderes (poco) y los cofres importantes. La pestaña Conjuntos de la mochila muestra lo
// encontrado de cada juego (`vistos`) y qué suma cada umbral.
// it.cj = id del juego; it.cs = la casilla de su juego. Estado en E.extra.conjuntos = { vistos: { "juego_casilla": 1 },
// completos: { juego: 1 } }. Textos `cj.` en textos/conjuntos.js.
window.CONJUNTOS = (function () {
  "use strict";
  let A, J, jug;
  const t = (k, v) => I18N.t(k, v);
  // piezas: casilla → [base, afijos fijos]; bonos: lo que suman 2 y 3 piezas; el poder de las cuatro va en el código
  const JUEGOS = {
    guardia: {
      col: "#7BC86C",
      piezas: { casco: ["yelmo", ["vida", "armadura"]], pecho: ["coraza", ["vida", "vig"]], escudo: ["escudoGuarnecido", ["armadura", "regen"]], botas: ["botasHerradas", ["estamina", "vig"]] },
      bonos: { 2: [["armadura", 25]], 3: [["vida", 40], ["regen", 20]] },
    },
    fenrir: {
      col: "#9BE08C",
      piezas: { arma: ["hachaBarbuda", ["danoP", "critMult"]], casco: ["casco", ["crit", "des"]], piernas: ["calzas", ["estamina", "des"]], amuleto: ["talisman", ["velAtq", "des"]] },
      bonos: { 2: [["velMov", 6]], 3: [["crit", 6], ["critMult", 20]] },
    },
    odin: {
      col: "#73D5DB",
      piezas: { arma: ["baculoVolva", ["runico", "esp"]], anillo: ["sortija", ["regenRunica", "esp"]], amuleto: ["amuleto", ["xp", "runico"]], pecho: ["jubon", ["regen", "esp"]] },
      bonos: { 2: [["runico", 15]], 3: [["regenRunica", 25], ["xp", 8]] },
    },
  };
  const CAZA = 3, // segundos del lobo al matar
    GUARDIA = 0.85, // lo que recibe la guardia entera
    ENERGIA_ODIN = 3;
  const base = () => ({ vistos: {}, completos: {} });
  let st = base();
  let caza = 0; // lo que queda del lobo

  // ---------- crear una pieza ----------
  function crear(juego, casilla, n) {
    const P = JUEGOS[juego].piezas[casilla];
    if (!P) return null;
    n = Math.max(1, Math.round(n || 1));
    const it = OBJETOS.generar({ base: P[0], r: 4, n, sinMuescas: true, rnd: OBJETOS.azar(n * 97 + juego.length * 13 + casilla.length) });
    it.cj = juego;
    it.cs = casilla;
    // los afijos fijos, en la parte alta de su tirada
    it.a = P[1].map((k) => {
      const [lo, hi] = OBJETOS.AFIJOS[k].v(n);
      return [k, Math.max(1, Math.round(lo + (hi - lo) * 0.8))];
    });
    delete it.nm;
    return it;
  }
  // una pieza al azar de cualquier juego
  function sortear(n, rnd = Math.random) {
    const ids = Object.keys(JUEGOS),
      j = ids[Math.floor(rnd() * ids.length) % ids.length],
      cs = Object.keys(JUEGOS[j].piezas);
    return crear(j, cs[Math.floor(rnd() * cs.length) % cs.length], n);
  }
  function anotar(it) {
    if (!it || !it.cj) return;
    st.vistos[it.cj + "_" + it.cs] = 1;
  }

  // ---------- lo que suman ----------
  // cuántas piezas de cada juego lleva puestas
  function cuenta() {
    const c = {};
    if (!window.BOTIN) return c;
    BOTIN.puestas().forEach((it) => it.cj && (c[it.cj] = (c[it.cj] || 0) + 1));
    return c;
  }
  const lleva = (j) => cuenta()[j] || 0;
  const entero = (j) => lleva(j) >= 4;
  function bonos(j, n) {
    const B = JUEGOS[j].bonos,
      l = [];
    [2, 3].forEach((k) => n >= k && B[k].forEach((q) => l.push(q)));
    return l;
  }
  function aporte(s) {
    const c = cuenta();
    const extra = [];
    Object.keys(c).forEach((j) => bonos(j, c[j]).forEach((q) => extra.push(q)));
    if (extra.length) OBJETOS.aportar(s, [{ b: "amuleto", r: 0, n: 1, a: extra }], null);
    if (caza > 0) {
      s.velMov *= 1.3;
      s.velAtq *= 1.3;
    }
  }

  // ---------- lo que se lee ----------
  const nombre = (it) => t("cj.pz_" + it.cj + "_" + it.cs);
  function lineas(it) {
    const j = it.cj,
      G = JUEGOS[j],
      n = lleva(j),
      puestas = window.BOTIN ? BOTIN.puestas().filter((q) => q.cj === j).map((q) => q.cs) : [];
    const l = [{ txt: t("cj.l_juego", [t("cj.j_" + j), n, 4]), col: "#9BE08C" }];
    l.push({ txt: Object.keys(G.piezas).map((cs) => (puestas.includes(cs) ? "◆ " : "◇ ") + t("cj.pz_" + j + "_" + cs)).join(" · "), col: "#7BC86C" });
    [2, 3].forEach((k) => l.push({ txt: t("cj.l_bono", [k, G.bonos[k].map(([q, v]) => OBJETOS.fmt(q, v)).join(", ")]), col: n >= k ? "#9BE08C" : "#5E6A5A" }));
    l.push({ txt: t("cj.l_bono", [4, t("cj.poder_" + j)]), col: n >= 4 ? "#9BE08C" : "#5E6A5A" });
    return l;
  }

  // ---------- la pestaña de la mochila ----------
  function pintar(cuerpo, api) {
    cuerpo.insertAdjacentHTML("beforeend", `<p class="aq-cabeza">${t("cj.cabeza")}</p>`);
    const c = cuenta(),
      nivel = window.RPG ? RPG.nivel() : 1;
    Object.keys(JUEGOS).forEach((j, f) => {
      const G = JUEGOS[j],
        n = c[j] || 0;
      cuerpo.insertAdjacentHTML("beforeend", `<div class="rotulo inv-piezas" style="color:${G.col}">${t("cj.j_" + j)} · ${t("cj.lleva", [n])}</div>`);
      const g = document.createElement("div");
      g.className = "inv-rejilla";
      Object.keys(G.piezas).forEach((cs, k) => {
        const visto = st.vistos[j + "_" + cs],
          P = G.piezas[cs],
          muestra = { b: P[0], r: 4, n: 1, a: [], tema: 1, v: k * 7 };
        g.appendChild(
          api.celda(
            visto
              ? { obj: Object.assign(muestra, { cj: j, cs }), nombre: t("cj.pz_" + j + "_" + cs), col: "#9BE08C", html: `<span class="bs-texto">${t("cj.visto", [nivel])}</span><span class="ob-lineas">${P[1].map((q) => `<span>${OBJETOS.fmt(q, Math.round(OBJETOS.AFIJOS[q].v(nivel)[1] * 0.8))}</span>`).join("")}</span>` }
              : { fantasma: muestra, nombre: "???", desc: t("cj.falta", [t("ob.casilla_" + OBJETOS.slotDe(cs))]), falta: true },
            f,
            k,
          ),
        );
      });
      // el resumen del juego
      g.appendChild(
        api.celda(
          {
            icono: "cj_" + j,
            nombre: t("cj.j_" + j),
            col: G.col,
            html: `<span class="bs-texto">${t("cj.j_" + j + "_d")}</span><span class="ob-lineas">${[2, 3]
              .map((k) => `<span style="color:${n >= k ? "#9BE08C" : "#8A8478"}">${t("cj.l_bono", [k, G.bonos[k].map(([q, v]) => OBJETOS.fmt(q, v)).join(", ")])}</span>`)
              .join("")}<span style="color:${n >= 4 ? "#9BE08C" : "#8A8478"}">${t("cj.l_bono", [4, t("cj.poder_" + j)])}</span></span>`,
            cant: n + "/4",
            falta: !n,
          },
          f,
          4,
        ),
      );
      cuerpo.appendChild(g);
    });
  }
  function iconos() {
    Object.keys(JUEGOS).forEach((j) =>
      INVENTARIO.iconoDe("cj_" + j, (c) => {
        // el emblema del juego: escudo (guardia), cabeza de lobo, ojo
        DIB.E(c, 0, 26, 24, 6, "rgba(0,0,0,0.25)");
        if (j === "guardia") {
          DIB.P(c, [-22, -20, 22, -20, 18, 8, 0, 24, -18, 8], "#4E7A3A");
          DIB.P(c, [0, -20, 22, -20, 18, 8, 0, 24], "#6E9A4E");
          DIB.P(c, [-3, -14, 3, -14, 3, 16, -3, 16], "#E0B2B2");
        } else if (j === "fenrir") {
          DIB.P(c, [-20, -22, -8, -6, 8, -6, 20, -22, 18, 4, 0, 24, -18, 4], "#5E6A5A");
          DIB.P(c, [0, -6, 8, -6, 20, -22, 18, 4, 0, 24], "#7E8A7A");
          DIB.E(c, -7, 2, 3, 3, "#9BE08C");
          DIB.E(c, 7, 2, 3, 3, "#9BE08C");
        } else {
          DIB.P(c, [-24, 0, -10, -14, 10, -14, 24, 0, 10, 14, -10, 14], "#2E3A3A");
          DIB.E(c, 0, 0, 9, 9, "#73D5DB");
          DIB.E(c, 0, 0, 4, 4, "#111111");
        }
      }),
    );
  }

  // ---------- de dónde salen ----------
  function envolverCofres() {
    const orig = PODERES.botinCofre;
    PODERES.botinCofre = function (x, y, nombre, b, importante) {
      const r = orig.apply(this, arguments);
      if (importante && Math.random() < 0.15) {
        const it = sortear(window.BOTIN ? BOTIN.nivelEn(x, y) : 1);
        J.retrasar(1.1, () => BOTIN.tirar(x, y - 30, it, true));
      }
      return r;
    };
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      iconos();
      envolverCofres();
      if (window.RPG) RPG.aporte(aporte, "conjuntos");
      INVENTARIO.pestana({ id: "conjuntos", antes: "bestiario", nombre: () => t("cj.tab"), visible: () => Object.keys(st.vistos).length > 0, pintar });
    },
    alEmpezar(extra) {
      extra.conjuntos = Object.assign(base(), extra.conjuntos || {});
      st = extra.conjuntos;
      caza = 0;
    },
    actualizar(dt) {
      if (caza > 0 && (caza -= dt) <= 0 && window.RPG) RPG.recalcular();
      // una vez por segundo: anotar lo que lleva (lo juntado del piso, lo comprado) y festejar el primer juego entero
      if (window.BOTIN && BOTIN.estado() && J.t % 1 < dt) {
        BOTIN.puestas().concat(BOTIN.estado().bolsa).forEach(anotar);
        const c = cuenta();
        Object.keys(c).forEach((j) => {
          if (c[j] >= 4 && !st.completos[j]) {
            st.completos[j] = 1;
            HUD.aviso(t("cj.completo", [t("cj.j_" + j)]), "lugar", t("cj.completo_titulo"));
            if (A.columnaRunica) A.columnaRunica(jug.x, jug.y);
          }
        });
      }
    },
    alMorir(e) {
      if (!e || e.esbirro || e.sinBotin || e.d.blanco || !window.BOTIN) return;
      let ch = 0;
      if (e.lider) ch = e.lider.unico ? 0.25 : 0.02;
      if (e.semi || e.patron) ch = 0.35;
      if (!ch || Math.random() >= ch) return;
      BOTIN.tirar(e.x, e.y, sortear(window.RPG ? RPG.nivelDe(e) : 1));
    },
    alPegar(e, dano, info, murio) {
      if (murio && entero("fenrir")) {
        const antes = caza > 0;
        caza = CAZA;
        if (!antes && window.RPG) RPG.recalcular();
      }
      if (info && info.critico && entero("odin") && window.PODERES && PODERES.darEnergia) PODERES.darEnergia(ENERGIA_ODIN);
    },
    modRecibido(dano) {
      return entero("guardia") ? dano * GUARDIA : dano;
    },
    efectosHud() {
      return caza > 0 ? [{ texto: t("cj.caza"), n: Math.ceil(caza) + "s", col: "#9BE08C" }] : [];
    },
    diario() {
      const n = Object.keys(st.vistos).length;
      return n ? `<div class="diario-resumen"><p><b>${t("cj.tab")}</b> ${t("cj.diario", [n, 12])}</p></div>` : "";
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, crear, sortear, cuenta, lleva, entero, nombre, lineas, caza: () => caza, JUEGOS, GUARDIA, CAZA, ENERGIA_ODIN };
})();
