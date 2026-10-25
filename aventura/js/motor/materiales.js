// ---------- los materiales de la forja (sistema MATERIALES) ----------
// Lo que pide Ása además de plata para forjar, y de donde sale: cinco materiales con nombre (hierro de pantano, cuero
// curtido, ámbar, esquirla rúnica y brasa de Muspell). Salen de desarmar piezas (lo común da hierro o cuero según la
// pieza, lo raro suma esquirlas y lo legendario una brasa), de las criaturas (los lobos, jabalíes y el oso dejan
// cuero, los draugr y custodios hierro viejo, los fuegos fatuos ámbar y esquirlas, los semijefes y el trol brasas) y
// de las **vetas** del bosque: piedras con nombre (assets en mundo/assets-materiales.js) que se pican con E o a
// golpes (el martillo vale doble), se rajan tres veces, sueltan el material y vuelven a crecer a los 10 minutos.
// La forja cobra materiales según lo que se forja (armas hierro, armaduras cuero y hierro, escudos los dos) y a fuego
// vivo una esquirla más; con una brasa se puede forjar «con la brasa de Muspell» (la nota sube).
// Estado en E.extra.mat = { tiene: { id: n }, vetas: { id: cuándo vuelve }, reloj }. Detalle en docs/rpg.md.
window.MATERIALES = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const LISTA = ["hierro", "cuero", "ambar", "esquirla", "brasa"];
  const COL = { hierro: "#C8402D", cuero: "#E0B2B2", ambar: "#F5A524", esquirla: "#73D5DB", brasa: "#FF8D71" };
  const VUELVE = 600, // segundos de juego hasta que una veta pelada vuelve a crecer
    GOLPES = 3,
    RADIO = 110;
  // lo que deja cada veta al romperse
  const VETAS = {
    vetaHierro: { hierro: [2, 3] },
    vetaAmbar: { ambar: [1, 2], hierro: [0, 1] },
    vetaRunica: { esquirla: [1, 2], ambar: [0, 1] },
  };
  // lo que dejan las criaturas: [material, chance, cuántos]
  const CRIATURAS = {
    lobo: [["cuero", 0.35, 1]],
    jabali: [["cuero", 0.5, 1]],
    oso: [["cuero", 1, 3], ["brasa", 0.25, 1]],
    errante: [["hierro", 0.2, 1]],
    draugr: [["hierro", 0.35, 1], ["esquirla", 0.12, 1]],
    custodio: [["hierro", 0.8, 2], ["esquirla", 0.5, 1]],
    fatuo: [["ambar", 0.3, 1], ["esquirla", 0.2, 1]],
    trol: [["hierro", 1, 2], ["brasa", 1, 1]],
    dreki: [["brasa", 1, 2], ["esquirla", 1, 3]],
  };
  const base = () => ({ tiene: {}, vetas: {}, reloj: 0 });
  let st = base();
  const vetas = []; // { id, tipo, cosa }
  let ultimoAtk = null;

  // ---------- tener, dar y gastar ----------
  const cuantos = (id) => st.tiene[id] || 0;
  function dar(id, n, x, y) {
    if (!n) return;
    st.tiene[id] = cuantos(id) + n;
    if (A) A.textoFlotante(x != null ? x : jug.x, (y != null ? y : jug.y) - 110, "+" + n + " " + t("mt." + id), COL[id]);
    if (window.SONIDO) SONIDO.tocar("plata", { vol: 0.35, tono: id === "brasa" ? 0.7 : id === "esquirla" ? 1.5 : 1.15 });
    if (window.INVENTARIO) INVENTARIO.repintar();
  }
  // un costo es { id: n }
  const alcanza = (c) => Object.keys(c || {}).every((k) => cuantos(k) >= c[k]);
  function gastar(c) {
    if (!alcanza(c)) return false;
    Object.keys(c).forEach((k) => (st.tiene[k] -= c[k]));
    return true;
  }
  function devolver(c) {
    Object.keys(c || {}).forEach((k) => (st.tiene[k] = cuantos(k) + c[k]));
  }
  // «3 hierro de pantano y 1 esquirla rúnica» (lo que falta en rojo si se pide html)
  function texto(c, html) {
    const l = Object.keys(c || {})
      .filter((k) => c[k] > 0)
      .map((k) => {
        const s = c[k] + " " + t(c[k] === 1 ? "mt." + k : "mt." + k + "_n");
        return html && cuantos(k) < c[k] ? `<span style="color:#C8402D">${s}</span>` : s;
      });
    if (!l.length) return t("mt.nada");
    return l.length === 1 ? l[0] : l.slice(0, -1).join(", ") + " " + t("mt.y") + " " + l[l.length - 1];
  }

  // ---------- desarmar ----------
  // qué deja una pieza: sale de la casilla y la rareza (y un dado fijo por pieza, así lo que dice es lo que da)
  function deDesarmar(it) {
    const B = OBJETOS.BASES[it.b] || {},
      slot = B.slot,
      dado = (((it.u || 1) * 2654435761) >>> 0) / 4294967296,
      c = {};
    const suma = (k, n) => n > 0 && (c[k] = (c[k] || 0) + n);
    if (slot === "arma") suma("hierro", 1 + (dado < 0.5 ? 1 : 0));
    else if (slot === "escudo") suma("hierro", 1), suma("cuero", 1);
    else if (slot === "amuleto" || slot === "anillo") suma("ambar", 1);
    else suma("cuero", 1 + (dado < 0.5 ? 1 : 0)), suma("hierro", dado < 0.3 ? 1 : 0);
    if (it.r >= 1) suma("ambar", dado < 0.6 ? 1 : 0), suma(slot === "arma" ? "hierro" : "cuero", 1);
    if (it.r >= 2) suma("esquirla", 1 + (dado < 0.4 ? 1 : 0));
    if (it.r >= 3) suma("brasa", 1), suma("esquirla", 1);
    return c;
  }
  // al desarmar (desde la mochila): entra todo junto y se dice en un solo cartel
  function alDesarmar(it) {
    const c = deDesarmar(it);
    devolver(c);
    return c;
  }

  // ---------- la forja ----------
  // lo que pide Ása por pieza: g es el grupo de FORJA (con tipo de arma o casilla), modo calma | fuego | brasa
  function costoForja(g, modo) {
    const c = {};
    if (g.tipo) {
      c.hierro = g.tipo === "arco" || g.tipo === "baston" ? 1 : g.tipo === "mandoble" || g.tipo === "hacha2" || g.tipo === "martillo" ? 4 : 3;
      if (g.tipo === "arco" || g.tipo === "baston") c.ambar = 1;
      if (g.tipo === "arco") c.cuero = 1;
    } else if (g.slot === "escudo") (c.hierro = 2), (c.cuero = 2);
    else (c.cuero = 3), (c.hierro = 1);
    if (modo !== "calma") c.esquirla = 1;
    if (modo === "brasa") c.brasa = 1;
    return c;
  }

  // ---------- las vetas ----------
  function armar() {
    vetas.length = 0;
    const rnd = DIB.azar(5517301),
      L = W.LUGARES,
      pu = L.puesto.p;
    const libre = (x, y) => W.libre(x, y, 40) && W.libre(x - 34, y, 30) && W.libre(x + 34, y, 30) && !W.CAMINOS.some((c) => W.distLinea(x, y, c.p) < c.w / 2 + 60);
    function cerca(p, dmin, dmax) {
      for (let k = 0; k < 60; k++) {
        const a = rnd() * Math.PI * 2,
          d = dmin + rnd() * (dmax - dmin),
          x = p[0] + Math.cos(a) * d,
          y = p[1] + Math.sin(a) * d * 0.8;
        if (x > 300 && y > 300 && x < W.ANCHO - 300 && y < W.ALTO - 300 && libre(x, y)) return [x, y];
      }
      return null;
    }
    const poner = (tipo, p) => {
      if (!p) return;
      // un claro chico alrededor (más hacia adelante, donde las copas la taparían), así la veta se ve entre los árboles
      W.cercanas(p[0] - 200, p[1] - 160, p[0] + 200, p[1] + 340, (o) => {
        const dx = o.x - p[0],
          dy = o.y - p[1];
        if (o.arbol && Math.abs(dx) < 190 && dy > -150 && dy < 330) (o.oculto = true), (o.choque = null);
      });
      vetas.push({ id: vetas.length, tipo, cosa: W.agregar(tipo, p, { sem: rnd() * 10, golpes: 0 }) });
    };
    // tres cerca del Puesto (para empezar) y después repartidas: la rúnica más lejos de casa
    poner("vetaHierro", cerca(pu, 700, 1000));
    poner("vetaAmbar", cerca(pu, 900, 1300));
    poner("vetaRunica", cerca(pu, 1200, 1600));
    const lugares = ["refugio", "carro", "casa_lindes", "tala", "claro", "aserradero", "santuario", "brunvik", "skarnholt", "tumulo", "caravana", "torre", "paso_sur"];
    lugares.forEach((k, i) => {
      const p = L[k].p,
        lejos = Math.hypot(p[0] - pu[0], p[1] - pu[1]) > 5000;
      poner("vetaHierro", cerca(p, L[k].r + 500, L[k].r + 1100));
      poner(i % 2 ? "vetaAmbar" : lejos ? "vetaRunica" : "vetaHierro", cerca(p, L[k].r + 600, L[k].r + 1400));
      if (lejos && i % 3 === 0) poner("vetaRunica", cerca(p, L[k].r + 700, L[k].r + 1500));
    });
  }
  const pelada = (v) => st.vetas[v.id] != null && st.vetas[v.id] > st.reloj;
  function aplicar() {
    vetas.forEach((v) => {
      v.cosa.o.agotada = pelada(v);
      if (!v.cosa.o.agotada) {
        delete st.vetas[v.id];
        v.cosa.o.golpes = 0;
      }
    });
  }
  function picar(v, fuerza) {
    if (pelada(v)) return;
    const o = v.cosa.o;
    o.golpes = Math.min(GOLPES, (o.golpes || 0) + (fuerza || 1));
    A.chispa(v.cosa.x + (Math.random() - 0.5) * 30, v.cosa.y - 30);
    A.chispa(v.cosa.x + (Math.random() - 0.5) * 30, v.cosa.y - 20);
    if (window.SONIDO) SONIDO.tocar("golpe", { vol: 0.55, tono: 0.55 + o.golpes * 0.08, x: v.cosa.x, y: v.cosa.y });
    J.sacudir(0.08);
    if (o.golpes >= GOLPES) romper(v);
  }
  function romper(v) {
    const d = VETAS[v.tipo],
      rnd = Math.random;
    let k = 0;
    Object.keys(d).forEach((id) => {
      const n = d[id][0] + Math.floor(rnd() * (d[id][1] - d[id][0] + 1));
      if (n) J.retrasar(0.15 * k++, () => dar(id, n, v.cosa.x, v.cosa.y));
    });
    if (v.tipo === "vetaRunica" && rnd() < 0.15) J.retrasar(0.5, () => dar("brasa", 1, v.cosa.x, v.cosa.y));
    st.vetas[v.id] = st.reloj + VUELVE;
    v.cosa.o.agotada = true;
    for (let i = 0; i < 6; i++) A.chispa(v.cosa.x + (Math.random() - 0.5) * 60, v.cosa.y - 10 - Math.random() * 40);
    if (window.SONIDO) SONIDO.tocar("golpeFuerte", { vol: 0.6, tono: 0.7, x: v.cosa.x, y: v.cosa.y });
    J.sacudir(0.2);
    if (!st.primera) {
      st.primera = 1;
      HUD.aviso(t("mt.primera"), "#FFD98A");
    }
  }
  function cercana() {
    let m = null,
      dm = RADIO;
    for (const v of vetas) {
      if (pelada(v)) continue;
      const d = Math.hypot(v.cosa.x - jug.x, v.cosa.y - jug.y);
      if (d < dm) (dm = d), (m = v);
    }
    return m ? { v: m, d: dm } : null;
  }

  // ---------- la bolsa ----------
  function celdas() {
    return LISTA.filter((id) => cuantos(id) > 0).map((id) => ({ id: "mt_" + id, icono: "mt_" + id, nombre: t("mt." + id), desc: t("mt." + id + "_d"), cant: cuantos(id) }));
  }
  // los íconos (INVENTARIO.iconoDe): dibujados alrededor de (0, 0), unos 60 de alto
  function iconos() {
    if (!window.INVENTARIO || !INVENTARIO.iconoDe) return;
    const { P, E, L } = DIB;
    INVENTARIO.iconoDe("mt_hierro", (c) => {
      P(c, [-24, 10, -14, -12, 16, -16, 26, 6, 12, 18, -16, 20], "#56504A");
      P(c, [16, -16, 26, 6, 12, 18, 4, 0], "#6E6860");
      P(c, [-10, 4, -4, -6, 8, -4, 4, 8], "#C8402D");
      P(c, [4, -4, 14, -2, 10, 8, 4, 8], "#B0552E");
    });
    INVENTARIO.iconoDe("mt_cuero", (c) => {
      P(c, [-26, -16, -10, -22, 10, -20, 26, -14, 22, 4, 26, 20, 4, 24, -14, 22, -26, 14, -22, -2], "#8A5A3A");
      P(c, [10, -20, 26, -14, 22, 4, 26, 20, 4, 24, 6, 0], "#A8724A");
      L(c, -16, -8, 14, -6, "#5E3A1E", 2);
      L(c, -18, 8, 16, 10, "#5E3A1E", 2);
    });
    INVENTARIO.iconoDe("mt_ambar", (c) => {
      DIB.halo(c, 0, 0, 30, "#FFD98A", 0.4);
      P(c, [-6, -24, 14, -14, 20, 8, 6, 24, -14, 18, -20, -2], "#C88A2A");
      P(c, [14, -14, 20, 8, 6, 24, 2, 0], "#F5A524");
      E(c, 8, -6, 4, 6, "#FFD98A");
    });
    INVENTARIO.iconoDe("mt_esquirla", (c) => {
      // un trozo de la vena: piedra gris con tres esquirlas que salen de la grieta
      DIB.halo(c, 0, -6, 28, "#73D5DB", 0.4);
      P(c, [-26, 22, -20, 6, 0, 0, 22, 6, 26, 22], "#4E5460");
      P(c, [0, 0, 22, 6, 26, 22, 4, 22], "#666C78");
      [[-12, 8, 6, 22], [2, 4, 7, 30], [14, 8, 5, 18]].forEach(([x, y, w, h]) => {
        P(c, [x - w, y, x, y - h, x + w, y], "#2E5A66");
        P(c, [x, y - h, x + w, y, x + 1, y], "#73D5DB");
      });
    });
    INVENTARIO.iconoDe("mt_brasa", (c) => {
      DIB.halo(c, 0, 0, 32, "#FF8D71", 0.55);
      P(c, [0, -26, 18, 0, 0, 26, -18, 0], "#9C2315");
      P(c, [0, -26, 18, 0, 0, 26, 2, 0], "#C8402D");
      P(c, [0, -12, 8, 0, 0, 12, -8, 0], "#FF8D71");
      P(c, [0, -6, 4, 0, 0, 6, -4, 0], "#FFD98A");
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
    },
    alEmpezar(extra) {
      extra.mat = Object.assign(base(), extra.mat || {});
      st = extra.mat;
      ultimoAtk = null;
      aplicar();
    },
    actualizar(dt) {
      if (J.modo !== "juego") return;
      st.reloj += dt;
      // las vetas peladas vuelven a crecer
      for (const v of vetas) if (v.cosa.o.agotada && !pelada(v)) (v.cosa.o.agotada = false), (v.cosa.o.golpes = 0), delete st.vetas[v.id];
    },
    cercanos(dar) {
      if (J.dentro) return;
      const c = cercana();
      if (c) dar(c.d, t("mt.picar", [t("as." + c.v.tipo)]), () => picar(c.v, 1), c.v.cosa.x, c.v.cosa.y - 60);
    },
    // a golpes: cada golpe que alcanza la veta la raja (el martillo, el doble)
    alGolpear(x, y, dir, reach) {
      if (!jug.atk || jug.atk === ultimoAtk || J.dentro) return;
      for (const v of vetas) {
        if (pelada(v)) continue;
        const dx = v.cosa.x - x,
          dy = v.cosa.y - y,
          d = Math.hypot(dx, dy);
        if (d > (reach || 90) + 40 || d > 400) continue;
        if (d > 50 && dx * jug.dir[0] + dy * jug.dir[1] < 0) continue;
        ultimoAtk = jug.atk;
        picar(v, window.ARMAS && ARMAS.tipoActual() === "martillo" ? 2 : 1);
        return;
      }
    },
    alMorir(e) {
      if (e.esbirro) return;
      const l = CRIATURAS[e.tipo] || [];
      const mult = e.lider ? 2 : 1;
      l.forEach(([id, ch, n]) => Math.random() < Math.min(1, ch * mult) && J.retrasar(0.3, () => dar(id, n * (e.lider ? 2 : 1), e.x, e.y)));
      if ((e.semi || e.patron) && !CRIATURAS[e.tipo]) J.retrasar(0.4, () => dar("brasa", 1, e.x, e.y));
    },
    luces(dar, x0, y0, x1, y1) {
      for (const v of vetas) {
        if (v.tipo === "vetaHierro" || v.cosa.o.agotada) continue;
        const x = v.cosa.x,
          y = v.cosa.y;
        if (x > x0 - 200 && x < x1 + 200 && y > y0 - 200 && y < y1 + 200) dar({ x, y: y - 30, r: 120, col: v.tipo === "vetaRunica" ? "#73D5DB" : "#FFD98A", f: 0.5 });
      }
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, cuantos, dar, alcanza, gastar, devolver, texto, deDesarmar, alDesarmar, costoForja, celdas, vetas: () => vetas, picar, cercana, LISTA, VETAS, CRIATURAS, VUELVE, GOLPES };
})();
