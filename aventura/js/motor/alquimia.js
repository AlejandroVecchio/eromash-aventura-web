// ---------- hierbas y alquimia (sistema ALQUIMIA) ----------
// Como la alquimia del Witcher: seis hierbas crecen por Eldervald (cada una donde le gusta: la flor de escarcha junto
// al agua, el cardo cerca de los túmulos y los draugr, el hongo de luna bajo los árboles) y se juntan con E; vuelven a
// crecer a los 8 minutos. En la mesa de alquimia del Puesto se destilan:
//   · pociones (se toman desde la Bolsa o con la casilla de la poción elegida en la barra o L2 + R1): duran un rato y suman a
//     las estadísticas; cada una sube la toxicidad (máximo 100, baja 1,5 por segundo) y con mucha no se puede tomar más;
//   · aceites para el arma: +25 % de daño contra una familia de criaturas durante 40 golpes (uno por vez).
// Estado en E.extra.alq = { hierbas: { id: n }, pociones: { id: n }, aceites: { id: n }, cosechadas: { i: hasta },
// reloj, tox, efectos: { id: queda }, aceite: { id, golpes } | null, elegida }. Textos `aq.` en textos/alquimia.js.
window.ALQUIMIA = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const HIERBAS = {
    musgo: { asset: "hierbaMusgo", col: "#6E9A4E" },
    serbal: { asset: "hierbaSerbal", col: "#C8402D" },
    abedul: { asset: "hierbaAbedul", col: "#E8E4DC" },
    escarcha: { asset: "hierbaEscarcha", col: "#C8F2F4" },
    luna: { asset: "hierbaLuna", col: "#73D5DB" },
    cardo: { asset: "hierbaCardo", col: "#9A6BD8" },
  };
  // pociones: qué piden, cuánto duran, cuánta toxicidad y qué hacen mientras duran
  const POCIONES = {
    tonico: { pide: { serbal: 2, musgo: 1 }, dura: 30, tox: 25, col: "#C8402D", s: null, cura: 4 },
    oso: { pide: { abedul: 1, serbal: 1, musgo: 2 }, dura: 60, tox: 35, col: "#7A5634", s: (s) => (s.armadura += 20) },
    buho: { pide: { luna: 1, escarcha: 1 }, dura: 120, tox: 20, col: "#5E8EA8", s: (s) => (s.lampara *= 1.5) },
    lobo: { pide: { escarcha: 1, abedul: 2 }, dura: 60, tox: 35, col: "#8E8A86", s: (s) => ((s.velMov *= 1.1), (s.velAtq *= 1.08)) },
    mimir: { pide: { luna: 1, cardo: 1, escarcha: 1 }, dura: 60, tox: 40, col: "#73D5DB", s: (s) => (s.regenRunica *= 1.5) },
  };
  // aceites: contra qué familia
  const ACEITES = {
    ceniza: { pide: { cardo: 2, abedul: 1 }, contra: ["draugr", "errante"], col: "#9A6BD8" },
    escarcha: { pide: { escarcha: 2, luna: 1 }, contra: ["fatuo", "custodio"], col: "#C8F2F4" },
    cazador: { pide: { musgo: 1, serbal: 1, abedul: 1 }, contra: ["lobo", "jabali", "oso", "cuervo"], col: "#C8402D" },
    brea: { pide: { abedul: 2, cardo: 1, serbal: 1 }, contra: ["trol", "dreki"], col: "#5E4430" },
  };
  const ACEITE_GOLPES = 40,
    ACEITE_BONO = 0.25,
    TOX_MAX = 100,
    TOX_BAJA = 1.5,
    VUELVE = 480,
    RADIO = 110;
  const base = () => ({ hierbas: {}, pociones: {}, aceites: {}, cosechadas: {}, reloj: 0, tox: 0, efectos: {}, aceite: null, elegida: "tonico" });
  let st = base();
  const plantas = []; // { i, tipo, cosa }
  let mesa = null,
    abierta = false,
    mirar = 0;

  // ---------- dónde crece cada una ----------
  function armar() {
    plantas.length = 0;
    const rnd = DIB.azar(8812047),
      L = W.LUGARES,
      pu = L.puesto.p;
    const libre = (x, y) => x > 300 && y > 300 && x < W.ANCHO - 300 && y < W.ALTO - 300 && W.libre(x, y, 26) && !W.CAMINOS.some((c) => W.distLinea(x, y, c.p) < c.w / 2 + 30);
    const cerca = (p, dmin, dmax) => {
      for (let k = 0; k < 50; k++) {
        const a = rnd() * Math.PI * 2,
          d = dmin + rnd() * (dmax - dmin),
          x = p[0] + Math.cos(a) * d,
          y = p[1] + Math.sin(a) * d * 0.8;
        if (libre(x, y)) return [x, y];
      }
      return null;
    };
    const poner = (tipo, p) => {
      if (!p) return;
      // un claro chiquito para que se vea entre los árboles
      W.cercanas(p[0] - 140, p[1] - 100, p[0] + 140, p[1] + 240, (o) => {
        const dx = o.x - p[0],
          dy = o.y - p[1];
        if (o.arbol && Math.abs(dx) < 120 && dy > -80 && dy < 230) (o.oculto = true), (o.choque = null);
      });
      plantas.push({ i: plantas.length, tipo, cosa: W.agregar(HIERBAS[tipo].asset, p, { sem: rnd() * 10, s: 1.1 }) });
    };
    // unas cuantas cerca del Puesto para aprender
    ["musgo", "serbal", "abedul", "serbal", "musgo"].forEach((tp) => poner(tp, cerca(pu, 500, 1100)));
    // por todos lados, según lo que le gusta a cada una
    const lugares = ["refugio", "carro", "casa_lindes", "tala", "claro", "quebrada_rastreo", "aserradero", "santuario", "brunvik", "skarnholt", "tumulo", "caravana", "torre", "paso_sur"];
    lugares.forEach((k, i) => {
      const p = L[k].p,
        r = L[k].r;
      poner(["musgo", "serbal", "abedul"][i % 3], cerca(p, r + 300, r + 900));
      poner(["abedul", "musgo", "serbal"][i % 3], cerca(p, r + 500, r + 1200));
      poner("luna", cerca(p, r + 700, r + 1400));
      if (k === "tumulo" || k === "torre" || k === "skarnholt" || k === "santuario") (poner("cardo", cerca(p, r + 250, r + 800)), poner("cardo", cerca(p, r + 500, r + 1100)));
    });
    // los cardos también crecen donde andan los draugr
    if (window.HORDAS)
      HORDAS.grupos
        .filter((g) => g.fam === "draugr")
        .slice(0, 6)
        .forEach((g) => poner("cardo", cerca(g.centro, 500, 900)));
    // la flor de escarcha, junto al agua (en las orillas de los ríos y las lagunas)
    (W.RIOS || []).forEach((rio, ri) => {
      if (rio.seco) return;
      for (let k = 1; k < rio.p.length; k++) {
        const q = rio.p[k],
          a = rnd() * Math.PI * 2,
          d = (rio.w || 60) / 2 + 60 + rnd() * 80;
        const x = q[0] + Math.cos(a) * d,
          y = q[1] + Math.sin(a) * d;
        if (libre(x, y)) poner("escarcha", [x, y]);
      }
    });
    (W.LAGOS || []).forEach((lg) => {
      if (lg.seco) return;
      for (let k = 0; k < 2; k++) {
        const a = rnd() * Math.PI * 2,
          x = (lg.p ? lg.p[0] : lg.x) + Math.cos(a) * (lg.rx + 80),
          y = (lg.p ? lg.p[1] : lg.y) + Math.sin(a) * (lg.ry + 70);
        if (libre(x, y)) poner("escarcha", [x, y]);
      }
    });
    // la mesa de alquimia, en el patio del Puesto
    const pp = W.PUNTOS.puesto || pu;
    let pm = null;
    for (let k = 0; k < 120 && !pm; k++) {
      const a = 2.2 + k * 0.7,
        d = 220 + k * 6,
        x = pp[0] + Math.cos(a) * d,
        y = pp[1] + Math.sin(a) * d * 0.8;
      if (W.libre(x, y, 60) && W.libre(x - 70, y, 30) && W.libre(x + 70, y, 30) && !W.CAMINOS.some((c) => W.distLinea(x, y, c.p) < c.w / 2 + 50)) pm = [x, y];
    }
    mesa = W.agregar("mesaAlquimia", pm || [pp[0] - 300, pp[1] - 120], { sem: 4 });
  }
  const cosechada = (p) => st.cosechadas[p.i] != null && st.cosechadas[p.i] > st.reloj;
  function aplicar() {
    plantas.forEach((p) => {
      p.cosa.o.cosechada = cosechada(p);
      if (!p.cosa.o.cosechada) delete st.cosechadas[p.i];
    });
  }
  function juntar(p) {
    if (cosechada(p)) return;
    const n = 1 + (DIB.azar(p.i * 31 + Math.floor(st.reloj))() < 0.35 ? 1 : 0);
    st.hierbas[p.tipo] = (st.hierbas[p.tipo] || 0) + n;
    st.cosechadas[p.i] = st.reloj + VUELVE;
    p.cosa.o.cosechada = true;
    A.textoFlotante(p.cosa.x, p.cosa.y - 70, "+" + n + " " + t("aq.h_" + p.tipo), HIERBAS[p.tipo].col);
    if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.35, tono: 1.4 });
    jug.interactuando = 0.3;
  }

  // ---------- destilar y tomar ----------
  const alcanza = (pide) => Object.keys(pide).every((k) => (st.hierbas[k] || 0) >= pide[k]);
  const pideTexto = (pide) =>
    Object.keys(pide)
      .map((k) => `${pide[k]} ${t("aq.h_" + k)}${(st.hierbas[k] || 0) < pide[k] ? " ✗" : ""}`)
      .join(" · ");
  function destilar(cual, id) {
    const R = (cual === "pocion" ? POCIONES : ACEITES)[id];
    if (!R || !alcanza(R.pide)) return HUD.aviso(t("aq.faltan")), false;
    Object.keys(R.pide).forEach((k) => (st.hierbas[k] -= R.pide[k]));
    const bolsa = cual === "pocion" ? st.pociones : st.aceites;
    bolsa[id] = (bolsa[id] || 0) + 1;
    HUD.aviso(t("aq.hecha", [t((cual === "pocion" ? "aq.p_" : "aq.a_") + id)]), R.col);
    if (window.SONIDO) SONIDO.tocar("fogata", { vol: 0.4, tono: 1.3 });
    return true;
  }
  function tomar(id) {
    const P = POCIONES[id];
    if (!P || !(st.pociones[id] > 0)) return HUD.aviso(t("aq.no_tenes")), false;
    if (st.tox + P.tox > TOX_MAX) return HUD.aviso(t("aq.toxico")), false;
    if (jug.muerto) return false;
    st.pociones[id]--;
    st.tox += P.tox;
    st.efectos[id] = P.dura;
    if (window.RPG) RPG.recalcular();
    A.textoFlotante(jug.x, jug.y - 140, t("aq.p_" + id), P.col);
    if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.5, tono: 1.1 });
    return true;
  }
  function untar(id) {
    if (!(st.aceites[id] > 0)) return HUD.aviso(t("aq.no_tenes")), false;
    st.aceites[id]--;
    st.aceite = { id, golpes: ACEITE_GOLPES };
    HUD.aviso(t("aq.untado", [t("aq.a_" + id), ACEITE_GOLPES]), ACEITES[id].col);
    if (window.SONIDO) SONIDO.tocar("filo", { vol: 0.5 });
    return true;
  }

  // ---------- la ventana de la mesa (pestaña de la mochila, solo junto a la mesa) ----------
  function pintar(cuerpo, api) {
    cuerpo.insertAdjacentHTML("beforeend", `<p class="aq-cabeza">${t("aq.mesa_sub")}</p>`);
    const fila = (rot, lista, cual, pre, f0) => {
      cuerpo.insertAdjacentHTML("beforeend", `<div class="rotulo inv-piezas">${t(rot)}</div>`);
      const g = document.createElement("div");
      g.className = "inv-rejilla";
      Object.keys(lista).forEach((id, k) => {
        const R = lista[id],
          ok = alcanza(R.pide),
          tiene = (cual === "pocion" ? st.pociones : st.aceites)[id] || 0;
        g.appendChild(
          api.celda(
            {
              icono: (cual === "pocion" ? "aq_p_" : "aq_a_") + id,
              nombre: t(pre + id),
              col: R.col,
              html: `<span class="bs-texto">${t(pre + id + "_d")}</span><span class="ob-lineas"><span>${t("aq.pide", [pideTexto(R.pide)])}</span>${cual === "pocion" ? `<span>${t("aq.dura", [R.dura, R.tox])}</span>` : ""}</span>${ok ? `<span class="ob-pista">${t("aq.destilar_pista")}</span>` : ""}`,
              cant: tiene || "",
              falta: !ok,
              fn: () => destilar(cual, id),
            },
            f0,
            k,
          ),
        );
      });
      cuerpo.appendChild(g);
    };
    fila("aq.pociones", POCIONES, "pocion", "aq.p_", 0);
    fila("aq.aceites", ACEITES, "aceite", "aq.a_", 1);
    cuerpo.insertAdjacentHTML("beforeend", `<div class="rotulo inv-piezas">${t("aq.hierbas")}</div>`);
    const g = document.createElement("div");
    g.className = "inv-rejilla";
    Object.keys(HIERBAS).forEach((id, k) => g.appendChild(api.celda({ icono: "aq_h_" + id, nombre: t("aq.h_" + id), desc: t("aq.h_" + id + "_d"), cant: st.hierbas[id] || 0, falta: !st.hierbas[id] }, 2, k)));
    cuerpo.appendChild(g);
  }
  function abrirMesa() {
    abierta = true;
    INVENTARIO.abrir("alquimia");
  }

  // ---------- la Bolsa: hierbas, pociones y aceites ----------
  function celdasBolsa() {
    const l = [];
    Object.keys(HIERBAS).forEach((id) => st.hierbas[id] && l.push({ id: "aq_h_" + id, icono: "aq_h_" + id, nombre: t("aq.h_" + id), desc: t("aq.h_" + id + "_d"), cant: st.hierbas[id] }));
    Object.keys(POCIONES).forEach((id) => st.pociones[id] && l.push({ id: "aq_p_" + id, icono: "aq_p_" + id, nombre: t("aq.p_" + id) + (st.elegida === id ? " ★" : ""), col: POCIONES[id].col, desc: t("aq.p_" + id + "_d") + " " + t("aq.tomar_pista", [Math.round(st.tox)]), cant: st.pociones[id], fn: () => tomar(id), alt: { texto: t("aq.elegir"), fn: () => ((st.elegida = id), false) } }));
    Object.keys(ACEITES).forEach((id) => st.aceites[id] && l.push({ id: "aq_a_" + id, icono: "aq_a_" + id, nombre: t("aq.a_" + id), col: ACEITES[id].col, desc: t("aq.a_" + id + "_d") + " " + t("aq.untar_pista"), cant: st.aceites[id], fn: () => untar(id) }));
    return l;
  }

  // ---------- íconos ----------
  function frasco(c, col, forma) {
    c.fillStyle = "rgba(0,0,0,0.25)";
    c.beginPath();
    c.ellipse(0, 26, 16, 5, 0, 0, Math.PI * 2);
    c.fill();
    if (forma === "aceite") {
      // la aceitera chata de barro con pico
      DIB.P(c, [-20, 24, -22, 6, -10, -4, 10, -4, 22, 6, 20, 24], "#8A6A4A");
      DIB.P(c, [0, -4, 10, -4, 22, 6, 20, 24, 0, 24], "#A8845E");
      DIB.P(c, [10, 0, 28, -10, 30, -6, 14, 6], "#8A6A4A");
      DIB.P(c, [-14, 10, 14, 10, 14, 16, -14, 16], col);
      DIB.P(c, [-6, -4, 6, -4, 5, -12, -5, -12], "#C8B48C");
    } else {
      // el frasco de vidrio redondo con cuello
      DIB.E(c, 0, 10, 18, 16, "#2A2628");
      DIB.E(c, 0, 12, 15, 13, col);
      DIB.E(c, 5, 6, 4, 6, "rgba(242,236,236,0.45)");
      DIB.P(c, [-5, -6, 5, -6, 5, -18, -5, -18], "#3A3634");
      DIB.P(c, [-6, -18, 6, -18, 5, -24, -5, -24], "#C8B48C");
    }
  }
  function iconos() {
    Object.keys(HIERBAS).forEach((id) =>
      INVENTARIO.iconoDe("aq_h_" + id, (c) => {
        c.save();
        c.scale(1.3, 1.3);
        ASSETS.dibujar(c, HIERBAS[id].asset, 0, 22, 0, { sem: 1, noche: true });
        c.restore();
      }),
    );
    Object.keys(POCIONES).forEach((id) => INVENTARIO.iconoDe("aq_p_" + id, (c) => frasco(c, POCIONES[id].col, "pocion")));
    Object.keys(ACEITES).forEach((id) => INVENTARIO.iconoDe("aq_a_" + id, (c) => frasco(c, ACEITES[id].col, "aceite")));
  }
  // la tira de efectos sobre el retrato: cada poción con lo que le queda, el aceite con sus golpes y la toxicidad
  function tira() {
    let el = document.getElementById("hudEfectos");
    if (!el) {
      const hj = document.getElementById("hudJugador");
      if (!hj) return;
      hj.insertAdjacentHTML("afterbegin", `<div id="hudEfectos"></div>`);
      el = document.getElementById("hudEfectos");
    }
    const partes = Object.keys(st.efectos).map((id) => `<span style="--col:${POCIONES[id].col}">${t("aq.p_" + id)} <b>${Math.ceil(st.efectos[id])}</b></span>`);
    if (st.aceite) partes.push(`<span style="--col:${ACEITES[st.aceite.id].col}">${t("aq.a_" + st.aceite.id)} <b>${st.aceite.golpes}</b></span>`);
    // lo que suman otros sistemas: efectosHud() → [{ texto, n, col }] (la comida de la fogata…)
    window.SISTEMAS.forEach((s0) => s0.efectosHud && s0.efectosHud().forEach((e) => partes.push(`<span style="--col:${e.col}">${e.texto} <b>${e.n}</b></span>`)));
    if (st.tox > 1) partes.push(`<span class="tox" style="--col:#7BC86C">${t("aq.tox")} <b>${Math.round(st.tox)}</b></span>`);
    const h = partes.join("");
    if (el._h !== h) el.innerHTML = el._h = h;
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
      INVENTARIO.pestana({ id: "alquimia", antes: "equipo", nombre: () => t("aq.mesa"), visible: () => abierta, pintar });
      if (window.RPG) RPG.aporte((s) => Object.keys(st.efectos).forEach((id) => POCIONES[id] && POCIONES[id].s && POCIONES[id].s(s)), "alquimia");
    },
    alEmpezar(extra) {
      extra.alq = Object.assign(base(), extra.alq || {});
      st = extra.alq;
      abierta = false;
      aplicar();
      if (window.RPG) RPG.recalcular();
    },
    actualizar(dt) {
      if (abierta && !INVENTARIO.abierta()) abierta = false;
      if (J.modo === "juego" && CONTROLES.recien("pocion")) tomar(st.elegida);
      if (J.modo !== "juego") return;
      st.reloj += dt;
      st.tox = Math.max(0, st.tox - TOX_BAJA * dt);
      let cambio = false;
      for (const id in st.efectos) {
        if (POCIONES[id] && POCIONES[id].cura && !jug.muerto) jug.hp = Math.min(jug.hpMax, jug.hp + POCIONES[id].cura * dt);
        if ((st.efectos[id] -= dt) <= 0) {
          delete st.efectos[id];
          cambio = true;
        }
      }
      if (cambio && window.RPG) RPG.recalcular();
      if ((mirar -= dt) > 0) return;
      mirar = 1;
      aplicar();
      const noche = A.amb && A.amb().n > 0.45;
      plantas.forEach((p) => p.tipo === "luna" && (p.cosa.o.noche = noche));
    },
    cercanos(dar) {
      if (J.dentro) return;
      for (const p of plantas) {
        if (p.cosa.o.cosechada) continue;
        const d = Math.hypot(p.cosa.x - jug.x, p.cosa.y - jug.y);
        if (d < RADIO) dar(d, t("aq.juntar", [t("aq.h_" + p.tipo)]), () => juntar(p), p.cosa.x, p.cosa.y - 60);
      }
      if (mesa) {
        const d = Math.hypot(mesa.x - jug.x, mesa.y - jug.y);
        if (d < 170) dar(d, t("aq.usar_mesa"), abrirMesa, mesa.x, mesa.y - 120);
      }
    },
    lente(x, y) {
      // la Lente hace brillar las hierbas cercanas
      let hay = false;
      for (const p of plantas) if (!p.cosa.o.cosechada && Math.hypot(p.cosa.x - x, p.cosa.y - y) < 700) (A.textoFlotante(p.cosa.x, p.cosa.y - 60, "✦", HIERBAS[p.tipo].col), (hay = true));
      return hay;
    },
    modDano(dano, e) {
      if (!st.aceite || !e || !e.tipo) return dano;
      if (!ACEITES[st.aceite.id].contra.includes(e.tipo)) return dano;
      return dano * (1 + ACEITE_BONO);
    },
    alPegar(e) {
      if (!st.aceite || !e || !e.tipo || e.d.blanco) return;
      if (ACEITES[st.aceite.id].contra.includes(e.tipo) && --st.aceite.golpes <= 0) {
        HUD.aviso(t("aq.aceite_fin", [t("aq.a_" + st.aceite.id)]));
        st.aceite = null;
      }
    },
    luces(dar) {
      for (const p of plantas) if (p.tipo === "luna" && p.cosa.o.noche && !p.cosa.o.cosechada) dar({ x: p.cosa.x, y: p.cosa.y - 14, r: 90, col: "#73D5DB", f: 0.5 });
    },
    celdasBolsa,
    cosasBarra() {
      // la poción elegida es un objeto de la barra (BARRA): con teclado, el número de su casilla; con mando L2 + R1
      const P = () => POCIONES[st.elegida] || POCIONES.tonico;
      return {
        pocion: {
          tipo: "objeto",
          icono: () => "aq_p_" + st.elegida,
          avisa: true,
          nombre: () => t("aq.p_" + st.elegida),
          desc: () => t("aq.p_" + st.elegida + "_d") + " " + t("aq.tomar_pista", [Math.round(st.tox)]),
          tiene: () => Object.values(st.pociones).some((n) => n > 0),
          listo: () => st.pociones[st.elegida] > 0 && st.tox + P().tox <= TOX_MAX,
          espera: () => st.tox / TOX_MAX,
          cant: () => st.pociones[st.elegida] || 0,
          usar: () => tomar(st.elegida),
        },
      };
    },
    hud() {
      tira();
    },
    diario() {
      const n = Object.values(st.hierbas).reduce((a, b) => a + b, 0);
      return n ? `<div class="diario-resumen"><p><b>${t("aq.hierbas")}</b> ${t("aq.diario", [n])}</p></div>` : "";
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, plantas: () => plantas, mesa: () => mesa, juntar, destilar, tomar, untar, alcanza, abrirMesa, HIERBAS, POCIONES, ACEITES };
})();
