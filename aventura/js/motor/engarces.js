// ---------- muescas, tallas y palabras rúnicas (sistema ENGARCES) ----------
// Como las ranuras y las palabras rúnicas del Diablo 2: algunas piezas salen con muescas (it.e, más seguido las
// comunes) y Ása abre muescas en las que no tienen. En cada muesca se encastra una **talla**: un trocito de hueso con
// una runa del futhark (ocho, de Fehu a Tiwaz) que suma una cosa en el arma y otra en la armadura o la joya. Encastrar
// es para siempre, salvo que se pague para vaciar la pieza (las tallas vuelven). Tres tallas iguales se unen en la
// siguiente. Si una pieza **común** (blanca) tiene justo las muescas de una palabra y se llenan en su orden, la pieza
// se vuelve esa palabra rúnica: nombre propio y un bono grande, además de lo de cada talla.
// Las tallas caen de las criaturas (más de los líderes y semijefes) y de los cofres. it.g = [talla], it.pr = palabra,
// it.ex = lo que suman (OBJETOS.sumar lo lee). Estado en E.extra.engarces = { tallas: { id: n }, hechas: { id: n } }.
// Textos `en.` en textos/engarces.js.
window.ENGARCES = (function () {
  "use strict";
  let A, J, jug;
  const t = (k, v) => I18N.t(k, v);
  // las tallas, de la más común a la más rara: lo que suman en un arma y en lo demás, y cuánto salen (tinta: la runa
  // tallada en el hueso; col: el texto)
  const TALLAS = {
    fehu: { tinta: "#A8622E", col: "#FFD98A", arma: ["plata", 10], otro: ["plata", 8], peso: 30 },
    uruz: { tinta: "#9C2315", col: "#C8402D", arma: ["danoP", 6], otro: ["vida", 15], peso: 26 },
    thurisaz: { tinta: "#C8402D", col: "#FF8D71", arma: ["fuego", 4], otro: ["vig", 2], peso: 20 },
    jera: { tinta: "#4E7A3A", col: "#7BC86C", arma: ["robo", 2], otro: ["regen", 12], peso: 18 },
    algiz: { tinta: "#5E130D", col: "#E0B2B2", arma: ["velAtq", 5], otro: ["armadura", 8], peso: 16 },
    ansuz: { tinta: "#2E8A90", col: "#73D5DB", arma: ["runico", 8], otro: ["regenRunica", 10], peso: 12 },
    hagalaz: { tinta: "#4A78D0", col: "#C8F2F4", arma: ["crit", 3], otro: ["estamina", 12], peso: 9 },
    tiwaz: { tinta: "#C87A10", col: "#F5A524", arma: ["critMult", 15], otro: ["fue", 2], peso: 6 },
  };
  const ORDEN = Object.keys(TALLAS);
  // las palabras: en qué piezas, qué tallas en orden (tantas como muescas) y qué suman
  const PALABRAS = {
    juramento: { en: ["arma"], tallas: ["tiwaz", "uruz"], da: [["danoP", 25], ["vida", 20], ["critMult", 10]] },
    hambre: { en: ["arma"], tallas: ["jera", "hagalaz"], da: [["robo", 5], ["velAtq", 10]] },
    surtr: { en: ["arma"], tallas: ["thurisaz", "thurisaz", "hagalaz"], da: [["fuego", 18], ["crit", 6], ["critMult", 25]] },
    algiz: { en: ["escudo", "pecho"], tallas: ["algiz", "algiz", "uruz"], da: [["armadura", 30], ["vida", 40], ["regen", 20]] },
    lobo: { en: ["botas", "piernas"], tallas: ["jera", "algiz"], da: [["velMov", 10], ["estamina", 25]] },
    mimir: { en: ["casco"], tallas: ["ansuz", "fehu", "ansuz"], da: [["runico", 25], ["regenRunica", 25], ["xp", 5]] },
    fafnir: { en: ["amuleto"], tallas: ["fehu", "fehu"], da: [["plata", 30], ["hallazgo", 30], ["xp", 5]] },
  };
  // cuántas muescas puede tener cada pieza
  const MAX = { arma: 3, escudo: 3, pecho: 3, casco: 3, piernas: 2, botas: 2, amuleto: 2, anillo: 0 };
  const COSTO_VACIAR = 20; // plata por talla
  const base = () => ({ tallas: {}, hechas: {} });
  let st = base();
  let elegida = null; // la u de la pieza que se mira en la pestaña

  const slot = (it) => OBJETOS.BASES[it.b].slot;
  const maxDe = (it) => MAX[slot(it)] || 0;
  const tiene = (id) => st.tallas[id] || 0;

  // ---------- al generar una pieza (objetos.js): ¿sale con muescas? ----------
  function alGenerar(it, rnd) {
    const m = maxDe(it);
    if (!m || it.r >= 3) return;
    const ch = [0.3, 0.14, 0.06][it.r];
    if (rnd() >= ch) return;
    const tope = it.r === 0 ? m : it.r === 1 ? Math.max(1, m - 1) : 1;
    it.e = 1 + Math.floor(rnd() * tope);
    it.g = [];
  }

  // ---------- lo que suma una pieza ----------
  function palabraDe(it) {
    if (it.r !== 0 || !it.e || !it.g || it.g.length !== it.e) return null;
    const s = slot(it);
    return Object.keys(PALABRAS).find((id) => {
      const P = PALABRAS[id];
      return P.en.includes(s) && P.tallas.length === it.e && P.tallas.every((x, i) => it.g[i] === x);
    }) || null;
  }
  function recalcular(it) {
    const arma = slot(it) === "arma";
    const ex = (it.g || []).map((id) => (arma ? TALLAS[id].arma : TALLAS[id].otro).slice());
    const pr = palabraDe(it);
    if (pr) PALABRAS[pr].da.forEach((q) => ex.push(q.slice()));
    it.ex = ex;
    if (pr) it.pr = pr;
    else delete it.pr;
  }
  // las líneas extra del detalle (objetos.js las suma al final)
  function lineas(it) {
    if (!it.e) return [];
    const l = [];
    const marcas = Array.from({ length: it.e }, (_, i) => (it.g && it.g[i] ? t("en.t_" + it.g[i]) : "◇")).join(" · ");
    if (it.pr) l.push({ txt: t("en.l_palabra", [t("en.p_" + it.pr)]), col: "#73D5DB" });
    l.push({ txt: t("en.l_muescas", [marcas]), col: "#9A6BD8" });
    (it.ex || []).forEach(([k, v]) => l.push({ txt: OBJETOS.fmt(k, v), col: "#C9A0F0" }));
    return l;
  }
  const nombre = (it) => (it.pr ? "«" + t("en.p_" + it.pr) + "»" : null);

  // ---------- encastrar, vaciar, unir ----------
  function todas() {
    const b = BOTIN.estado();
    return b ? BOTIN.puestas().concat(b.bolsa) : [];
  }
  const conMuescas = () => todas().filter((it) => it.e > 0);
  const porU = (u) => todas().find((it) => it.u === u) || null;
  function engarzar(it, id) {
    if (!it || !it.e || !tiene(id)) return false;
    it.g = it.g || [];
    if (it.g.length >= it.e) return HUD.aviso(t("en.llena"), "#C8402D"), false;
    st.tallas[id]--;
    it.g.push(id);
    const antes = it.pr;
    recalcular(it);
    if (window.SONIDO) SONIDO.tocar("filo", { vol: 0.5, tono: 1.4 });
    if (it.pr && !antes) {
      st.hechas[it.pr] = (st.hechas[it.pr] || 0) + 1;
      HUD.aviso(t("en.palabra_hecha", [t("en.p_" + it.pr)]), "lugar", t("en.palabra_titulo"));
      if (window.SONIDO) SONIDO.runa(jug.x, jug.y);
      if (A.columnaRunica) A.columnaRunica(jug.x, jug.y);
    }
    if (window.RPG) RPG.recalcular();
    return true;
  }
  function costoVaciar(it) {
    return COSTO_VACIAR * ((it.g && it.g.length) || 0);
  }
  function vaciar(it) {
    if (!it || !it.g || !it.g.length) return false;
    const pj = PODERES.pj(),
      c = costoVaciar(it);
    if (pj.plata < c) return HUD.aviso(t("en.sin_plata", [c]), "#C8402D"), false;
    pj.plata -= c;
    it.g.forEach((id) => (st.tallas[id] = tiene(id) + 1));
    it.g = [];
    recalcular(it);
    if (window.RPG) RPG.recalcular();
    HUD.aviso(t("en.vaciada"), "#E0B2B2");
    return true;
  }
  function unir(id) {
    const i = ORDEN.indexOf(id);
    if (i < 0 || i >= ORDEN.length - 1 || tiene(id) < 3) return false;
    st.tallas[id] -= 3;
    const sig = ORDEN[i + 1];
    st.tallas[sig] = tiene(sig) + 1;
    HUD.aviso(t("en.unidas", [t("en.t_" + id), t("en.t_" + sig)]), TALLAS[sig].col);
    return true;
  }
  function dar(id, n = 1, x, y) {
    st.tallas[id] = tiene(id) + n;
    if (x != null && A) A.textoFlotante(x, y - 100, "+" + n + " " + t("en.t_" + id), TALLAS[id].col);
  }
  // una talla al azar según cuánto sale (las raras, recién más adelante)
  function sortear(nivel, rnd = Math.random) {
    const l = ORDEN.filter((id, i) => i < 3 + Math.floor(nivel / 3));
    const tot = l.reduce((a, id) => a + TALLAS[id].peso, 0);
    let x = rnd() * tot;
    for (const id of l) if ((x -= TALLAS[id].peso) < 0) return id;
    return l[l.length - 1];
  }

  // ---------- Ása abre muescas ----------
  const ABRIR_MAT = { hierro: 2, esquirla: 1 };
  const costoAbrir = (it) => 40 + it.n * 10;
  const abribles = () => todas().filter((it) => !it.e && it.r < 3 && maxDe(it) > 0);
  function muescasQueAbre(it) {
    const m = maxDe(it);
    return it.r === 0 ? m : it.r === 1 ? Math.max(1, m - 1) : 1;
  }
  // extra: +1 si la talla salió perfecta, -1 si se rajó (tallar la runa, mj-tallar.js)
  function abrir(it, extra = 0) {
    if (!it || it.e || it.r >= 3 || !maxDe(it)) return false;
    const pj = PODERES.pj(),
      c = costoAbrir(it);
    if (pj.plata < c || (window.MATERIALES && !MATERIALES.alcanza(ABRIR_MAT))) return HUD.aviso(t("en.asa_falta"), "#C8402D"), false;
    pj.plata -= c;
    if (window.MATERIALES) MATERIALES.gastar(ABRIR_MAT);
    it.e = Math.max(1, Math.min(maxDe(it), muescasQueAbre(it) + extra));
    it.g = [];
    recalcular(it);
    if (window.SONIDO) SONIDO.tocar("golpeFuerte", { vol: 0.5, tono: 1.3 });
    HUD.aviso(t("en.asa_abrio", [OBJETOS.nombre(it), it.e]), "#9A6BD8");
    return true;
  }
  function menuAsa() {
    const l = abribles();
    const bot = l.slice(0, 7).map((it) => ({
      texto: OBJETOS.nombre(it) + " · " + t("en.n_muescas", [muescasQueAbre(it)]),
      sub: t("en.asa_costo", [costoAbrir(it)]) + (window.MATERIALES ? " · " + MATERIALES.texto(ABRIR_MAT) : ""),
      fn: () => pedirAbrir(it),
    }));
    bot.push({ texto: t("ui.volver"), fn: () => (window.FORJA && FORJA.abrir ? FORJA.abrir() : A.cerrarMenu()) });
    A.menu(`<h2>${t("en.asa_titulo")}</h2><div class="sub">${l.length ? t("en.asa_sub") : t("en.asa_nada")}</div>`, bot);
  }

  // Ása deja el cincel: la muesca se talla en la piedra (MINIJ «tallar»); perfecta suma una, rajada resta una, dejarla
  // no cobra nada. Las piezas raras piden piedra dura.
  function pedirAbrir(it) {
    const pj = PODERES.pj();
    if (pj.plata < costoAbrir(it) || (window.MATERIALES && !MATERIALES.alcanza(ABRIR_MAT))) return HUD.aviso(t("en.asa_falta"), "#C8402D"), menuAsa();
    const listo = (extra) => {
      if (!abrir(it, extra)) return menuAsa();
      if (extra > 0) HUD.aviso(t("en.tallar_extra"), "#73D5DB");
      else if (extra < 0) HUD.aviso(t("en.tallar_rajada"), "#C8402D");
      A.cerrarMenu();
      elegida = it.u;
      INVENTARIO.abrir("tallas");
    };
    if (!window.MINIJ || !MINIJ.JUEGOS.tallar) return listo(0);
    A.cerrarMenu();
    MINIJ.empezar("tallar", {
      variante: it.r >= 2 ? "dura" : it.r === 1 ? "vetas" : "base",
      quien: t("en.tallar_asa"),
      x: jug.x,
      y: jug.y,
      fin: (r) => (r.dejo ? menuAsa() : listo(r.gano ? (r.precision >= 0.85 ? 1 : 0) : -1)),
    });
  }
  // unir tres tallas en la de arriba: se talla el hueso nuevo; si se resquebraja, las tres siguen en la bolsa
  function pedirUnir(id) {
    const sig = ORDEN[ORDEN.indexOf(id) + 1];
    if (!sig || tiene(id) < 3) return false;
    if (!window.MINIJ || !MINIJ.JUEGOS.tallar) return unir(id);
    INVENTARIO.cerrar();
    MINIJ.empezar("tallar", {
      runa: sig,
      quien: t("en.tallar_unir"),
      fin: (r) => {
        if (r.gano) unir(id);
        else if (!r.dejo) HUD.aviso(t("en.tallar_falla"), "#E0B2B2");
        INVENTARIO.abrir("tallas");
      },
    });
    return true;
  }

  // ---------- la pestaña de la mochila ----------
  function pintar(cuerpo, api) {
    const piezas = conMuescas();
    if (!porU(elegida)) elegida = piezas[0] ? piezas[0].u : null;
    const it = porU(elegida);
    cuerpo.insertAdjacentHTML("beforeend", `<p class="aq-cabeza">${t("en.cabeza")}</p>`);
    const fila = (rot, celdas) => {
      cuerpo.insertAdjacentHTML("beforeend", `<div class="rotulo inv-piezas">${rot}</div>`);
      const g = document.createElement("div");
      g.className = "inv-rejilla";
      celdas.forEach((c) => g.appendChild(c));
      cuerpo.appendChild(g);
    };
    let f = 0;
    // las piezas con muescas
    fila(
      t("en.piezas"),
      piezas.length
        ? piezas.map((p, k) => api.celda({ obj: p, nombre: OBJETOS.nombre(p), col: p.pr ? "#73D5DB" : OBJETOS.COL_TEXTO[p.r], html: BOTIN.html(p), elegida: p.u === elegida, fn: () => ((elegida = p.u), INVENTARIO.repintar(), false) }, f, k))
        : [api.celda({ icono: "en_vacia", nombre: t("en.sin_piezas"), desc: t("en.sin_piezas_d"), falta: true }, f, 0)],
    );
    f++;
    // las muescas de la elegida
    if (it) {
      const cs = Array.from({ length: it.e }, (_, i) => {
        const id = it.g && it.g[i];
        return api.celda(id ? { icono: "en_t_" + id, nombre: t("en.t_" + id), col: TALLAS[id].col, desc: t("en.puesta") } : { icono: "en_vacia", nombre: t("en.muesca_libre"), desc: t("en.muesca_libre_d"), falta: true }, f, i);
      });
      if (it.g && it.g.length) cs.push(api.celda({ icono: "en_vaciar", nombre: t("en.vaciar"), desc: t("en.vaciar_d", [costoVaciar(it)]), fn: () => (vaciar(it), INVENTARIO.repintar(), false) }, f, it.e));
      fila(t("en.muescas_de", [OBJETOS.nombre(it)]), cs);
      f++;
    }
    // las tallas que lleva
    fila(
      t("en.tallas"),
      ORDEN.map((id, k) => {
        const T = TALLAS[id],
          sig = ORDEN[k + 1];
        return api.celda(
          {
            icono: "en_t_" + id,
            nombre: t("en.t_" + id),
            col: T.col,
            html: `<span class="bs-texto">${t("en.t_" + id + "_d")}</span><span class="ob-lineas"><span>${t("en.en_arma")} ${OBJETOS.fmt(T.arma[0], T.arma[1])}</span><span>${t("en.en_otro")} ${OBJETOS.fmt(T.otro[0], T.otro[1])}</span></span>${it && tiene(id) ? `<span class="ob-pista">${t("en.pista_engarzar")}</span>` : ""}`,
            cant: tiene(id) || "",
            falta: !tiene(id),
            fn: () => (it ? (engarzar(it, id), INVENTARIO.repintar()) : HUD.aviso(t("en.elegi_pieza")), false),
            alt: sig && tiene(id) >= 3 ? { texto: t("en.unir", [t("en.t_" + sig)]), fn: () => (pedirUnir(id), false) } : null,
          },
          f,
          k,
        );
      }),
    );
    f++;
    // las palabras que se conocen
    fila(
      t("en.palabras"),
      Object.keys(PALABRAS).map((id, k) => {
        const P = PALABRAS[id];
        return api.celda(
          {
            icono: "en_p_" + id,
            nombre: t("en.p_" + id) + (st.hechas[id] ? " ✓" : ""),
            col: "#73D5DB",
            html: `<span class="bs-texto">${t("en.p_" + id + "_d")}</span><span class="ob-lineas"><span>${t("en.receta", [P.tallas.map((x) => t("en.t_" + x)).join(" + "), P.en.map((s) => t("ob.casilla_" + s)).join(" / "), P.tallas.length])}</span>${P.da.map(([q, v]) => `<span style="color:#73D5DB">${OBJETOS.fmt(q, v)}</span>`).join("")}<span>${t("en.solo_comunes")}</span></span>`,
            falta: !st.hechas[id],
          },
          f,
          k,
        );
      }),
    );
  }

  // ---------- íconos ----------
  function hueso(c, col, runa, s = 1) {
    DIB.E(c, 0, 26 * s, 18 * s, 5 * s, "rgba(0,0,0,0.25)");
    DIB.P(c, [-16 * s, 22 * s, -20 * s, -14 * s, -8 * s, -26 * s, 12 * s, -24 * s, 20 * s, -10 * s, 16 * s, 22 * s], "#C8B48C");
    DIB.P(c, [0, -25 * s, 12 * s, -24 * s, 20 * s, -10 * s, 16 * s, 22 * s, 0, 22 * s], "#E8DCC0");
    if (window.FUTHARK) FUTHARK.dibujar(c, runa, 0, 14 * s, 30 * s, col, 4 * s);
  }
  function iconos() {
    ORDEN.forEach((id) => INVENTARIO.iconoDe("en_t_" + id, (c) => hueso(c, TALLAS[id].tinta, id)));
    Object.keys(PALABRAS).forEach((id) =>
      INVENTARIO.iconoDe("en_p_" + id, (c) => {
        // la tablilla de piedra con las runas de la palabra en fila
        DIB.E(c, 0, 26, 28, 6, "rgba(0,0,0,0.25)");
        DIB.P(c, [-28, 22, -28, -22, 28, -22, 28, 22], "#4A4440");
        DIB.P(c, [0, -22, 28, -22, 28, 22, 0, 22], "#6E6A66");
        const n = PALABRAS[id].tallas.length;
        PALABRAS[id].tallas.forEach((x, i) => FUTHARK.dibujar(c, x, (i - (n - 1) / 2) * 17, 10, 22, "#73D5DB", 3));
      }),
    );
    INVENTARIO.iconoDe("en_vacia", (c) => {
      c.strokeStyle = "#9A6BD8";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(0, -20);
      c.lineTo(20, 0);
      c.lineTo(0, 20);
      c.lineTo(-20, 0);
      c.closePath();
      c.stroke();
    });
    INVENTARIO.iconoDe("en_vaciar", (c) => {
      DIB.P(c, [-14, -20, 14, -20, 10, 22, -10, 22], "#5E4430");
      DIB.P(c, [0, -20, 14, -20, 10, 22, 0, 22], "#7A5634");
      DIB.P(c, [-18, -26, 18, -26, 18, -20, -18, -20], "#9A7650");
    });
  }

  // ---------- el sistema ----------
  function envolverCofres() {
    const orig = PODERES.botinCofre;
    PODERES.botinCofre = function (x, y, nombre, b, importante) {
      const r = orig.apply(this, arguments);
      if (importante || Math.random() < 0.25) {
        const id = sortear(window.RPG ? RPG.nivel() : 1);
        J.retrasar(0.9, () => dar(id, 1, x, y));
      }
      return r;
    };
  }
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      iconos();
      envolverCofres();
      INVENTARIO.pestana({ id: "tallas", antes: "bolsa", nombre: () => t("en.tab"), visible: () => conMuescas().length > 0 || ORDEN.some((id) => tiene(id) > 0), pintar });
    },
    alEmpezar(extra) {
      extra.engarces = Object.assign(base(), extra.engarces || {});
      st = extra.engarces;
      elegida = null;
      // las piezas guardadas: rearmar lo que suman (por si cambiaron los números)
      todas().forEach((it) => it.e && recalcular(it));
      if (window.RPG) RPG.recalcular();
    },
    alMorir(e) {
      if (!e || e.esbirro || e.sinBotin || e.d.blanco) return;
      let ch = 0.035,
        n = 1;
      if (e.lider) ch = e.lider.unico ? 1 : 0.22;
      if (e.semi || e.patron) (ch = 1), (n = 2);
      if (Math.random() >= ch) return;
      const nivel = window.RPG ? RPG.nivelDe(e) : 1;
      for (let i = 0; i < n; i++) dar(sortear(nivel), 1, e.x, e.y - i * 30);
    },
    botonesAsa() {
      return [{ texto: t("en.asa_boton"), sub: t("en.asa_boton_d"), fn: menuAsa }];
    },
    celdasBolsa() {
      return ORDEN.filter((id) => tiene(id) > 0).map((id) => ({ id: "en_t_" + id, icono: "en_t_" + id, nombre: t("en.t_" + id), col: TALLAS[id].col, desc: t("en.t_" + id + "_d") + " " + t("en.bolsa_pista"), cant: tiene(id), fn: () => (INVENTARIO.abrir("tallas"), false) }));
    },
    diario() {
      const n = Object.keys(st.hechas).length;
      return n ? `<div class="diario-resumen"><p><b>${t("en.palabras")}</b> ${t("en.diario", [n, Object.keys(PALABRAS).length])}</p></div>` : "";
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, alGenerar, recalcular, lineas, nombre, engarzar, vaciar, unir, dar, sortear, abrir, menuAsa, pedirAbrir, pedirUnir, palabraDe, maxDe, muescasQueAbre, elegir: (u) => (elegida = u), TALLAS, PALABRAS, ORDEN, MAX };
})();
