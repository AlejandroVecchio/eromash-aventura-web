// ---------- el comercio: comprar, vender y recomprar (sistema COMERCIO) ----------
// Dos mercaderes con lo suyo, como los de Diablo y WoW: **Ingrid** (en su mostrador del Puesto de Eydis: armas,
// armaduras y escudos de todos los días, y hierro y cuero para la forja) y **Kolbrun**, la buhonera de Eldrakar
// (con su alfombra junto al Refugio: amuletos, anillos, alguna pieza rara, ámbar, esquirlas y a veces una brasa, y
// las **piezas envueltas**: se paga sin ver qué hay adentro y puede salir cualquier cosa, hasta una legendaria).
// Lo que venden cambia cada día del juego (sale de una semilla por día y mercader, y se guarda con lo comprado).
// Se comercia en una pestaña de la mochila que aparece solo mientras se habla con ellos: tocar algo del mercader lo
// compra, tocar algo de la bolsa lo vende (lo raro pide confirmar) y lo vendido queda para **recomprar** al mismo
// precio hasta que se vende otra cosa encima (ocho lugares, como en WoW). Precios: comprar 2,5 × el valor de la pieza
// (con la rebaja del renombre), vender 0,35 × el valor. Otros sistemas cambian los precios con COMERCIO.modPrecio.
// Estado en E.extra.comercio = { stock: { id: { dia, piezas, mats, envueltas } }, recompra: [pieza] }.
// Detalle en docs/rpg.md (Comercio).
window.COMERCIO = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const COMPRA = 2.5,
    VENTA = 0.35,
    RECOMPRA = 8,
    RADIO = 120;
  // lo que tiene cada mercader
  const MERCADERES = {
    ingrid: {
      piezas: 9,
      slots: ["arma", "arma", "arma", "escudo", "casco", "pecho", "piernas", "botas"],
      rareza: [0.62, 0.3, 0.08, 0],
      mats: { hierro: [4, 8, 16], cuero: [4, 8, 14] }, // [mín, máx, precio]
    },
    kolbrun: {
      piezas: 6,
      slots: ["amuleto", "anillo", "anillo", "arma", "pecho"],
      rareza: [0.2, 0.5, 0.27, 0.03],
      mats: { ambar: [2, 5, 30], esquirla: [1, 3, 55], brasa: [0, 1, 420] },
      envueltas: ["arma", "armadura", "escudo", "amuleto", "anillo"],
    },
  };
  const ENVUELTA = { arma: "espadaHierro", armadura: "jubon", escudo: "escudoRedondo", amuleto: "amuleto", anillo: "anillo" };
  const base = () => ({ stock: {}, recompra: [] });
  let st = base();
  let actual = null, // con quién se está comerciando
    confirmar = null,
    kolbrun = null; // { x, y, mira }
  const mods = []; // fn(precio, { tipo: "compra" | "venta", it, mercader }) → precio
  const alts = []; // fn({ tipo, it, mercader }) → { texto, fn } | null: la acción alternativa (R) de una casilla

  // ---------- precios ----------
  const descuento = () => (window.SECUNDARIAS ? SECUNDARIAS.descuento() : 0);
  function aplicarMods(p, info) {
    for (const f of mods) p = f(p, info);
    return Math.max(1, Math.round(p));
  }
  const precioCompra = (it, m) => aplicarMods(OBJETOS.valor(it) * COMPRA * (1 - descuento()), { tipo: "compra", it, mercader: m });
  const precioVenta = (it, m) => aplicarMods(OBJETOS.valor(it) * VENTA, { tipo: "venta", it, mercader: m });
  // sin lo que cambian otros sistemas (el regateo parte de acá)
  const precioCompraSin = (it) => Math.max(1, Math.round(OBJETOS.valor(it) * COMPRA * (1 - descuento())));
  const precioVentaSin = (it) => Math.max(1, Math.round(OBJETOS.valor(it) * VENTA));
  const precioMat = (id, m) => aplicarMods(MERCADERES[m].mats[id][2] * (1 - descuento()), { tipo: "compra", mat: id, mercader: m });
  // la pieza envuelta: el doble del valor de una mágica de ese nivel
  const precioEnvuelta = (m) => aplicarMods((4 + nivelObjeto() * 1.6) * 2.5 * 2 * COMPRA * (1 - descuento()), { tipo: "compra", envuelta: true, mercader: m });
  const plata = () => PODERES.pj().plata;
  const pagar = (n) => (PODERES.pj().plata -= n);
  const nivelObjeto = () => (window.RPG ? RPG.nivel() : 1);

  // ---------- lo que venden hoy ----------
  function diaDeHoy() {
    const tiempo = (A.H.E && A.H.E.tiempo) || 0;
    return Math.floor(((tiempo / LUZ.DIA) * 24 + 9) / 24);
  }
  function rareza(rnd, p) {
    let u = rnd();
    for (let r = 0; r < p.length; r++) if ((u -= p[r]) < 0) return r;
    return 0;
  }
  // el renombre en Eikholt mejora lo que traen: una pieza más por rango y la suerte corre de común a rara (y a legendaria desde el 3)
  const renombre = () => (window.SECUNDARIAS && SECUNDARIAS.renombre ? SECUNDARIAS.renombre() : 0);
  function rarezaCon(p, rn) {
    const q = p.slice(),
      pasa = Math.min(q[0], 0.06 * rn);
    q[0] -= pasa;
    q[1] += pasa * 0.4;
    q[2] += pasa * 0.6;
    if (rn >= 3) {
      const l = Math.min(q[1], 0.015 * (rn - 2));
      q[1] -= l;
      q[3] += l;
    }
    return q;
  }
  function armarStock(id) {
    const M = MERCADERES[id],
      rn = renombre(),
      pr = rarezaCon(M.rareza, rn),
      dia = diaDeHoy(),
      rnd = DIB.azar(dia * 7919 + (id === "ingrid" ? 13 : 71)),
      n = nivelObjeto(),
      tema = ARTE_OBJ.temaEn(W, jug.x, jug.y);
    const piezas = [];
    for (let i = 0; i < M.piezas + rn; i++) {
      const slot = M.slots[i % M.slots.length];
      const it = OBJETOS.generar({ n: n + (rnd() < 0.3 ? 1 : 0), slot, r: rareza(rnd, pr), tema, rnd });
      piezas.push(it);
    }
    const mats = {};
    for (const k in M.mats) {
      const [a, b] = M.mats[k];
      mats[k] = a + Math.floor(rnd() * (b - a + 1));
    }
    return { dia, rn, piezas, mats, envueltas: (M.envueltas || []).slice() };
  }
  function stock(id) {
    const s = st.stock[id];
    // al subir el renombre el mercader trae lo nuevo enseguida, sin esperar al otro día
    if (!s || s.dia !== diaDeHoy() || (s.rn || 0) < renombre()) st.stock[id] = armarStock(id);
    return st.stock[id];
  }

  // ---------- comprar, vender, recomprar ----------
  const lleno = () => BOTIN.estado().bolsa.length >= BOTIN.MAX_BOLSA;
  function sonar(bien) {
    if (window.SONIDO) SONIDO.tocar(bien ? "plata" : "tela", { vol: bien ? 0.5 : 0.35, tono: bien ? 1 : 0.7 });
  }
  function comprar(id, it) {
    const s = stock(id),
      p = precioCompra(it, id);
    if (plata() < p) return HUD.aviso(t("cm.sin_plata"), "#C8402D"), sonar(false), false;
    if (lleno()) return HUD.aviso(t("ob.bolsa_llena"), "#C8402D"), false;
    pagar(p);
    s.piezas.splice(s.piezas.indexOf(it), 1);
    BOTIN.dar(it, { silencio: true });
    HUD.aviso(t("cm.comprado", [OBJETOS.nombre(it), p]), "#FFD98A");
    sonar(true);
    return true;
  }
  function comprarMat(id, k) {
    const s = stock(id),
      p = precioMat(k, id);
    if (!s.mats[k]) return false;
    if (plata() < p) return HUD.aviso(t("cm.sin_plata"), "#C8402D"), sonar(false), false;
    pagar(p);
    s.mats[k]--;
    MATERIALES.dar(k, 1);
    return true;
  }
  // la pieza envuelta: se paga y recién ahí se ve qué era
  function comprarEnvuelta(id, cual) {
    const s = stock(id),
      p = precioEnvuelta(id);
    if (!s.envueltas.includes(cual)) return false;
    if (plata() < p) return HUD.aviso(t("cm.sin_plata"), "#C8402D"), sonar(false), false;
    if (lleno()) return HUD.aviso(t("ob.bolsa_llena"), "#C8402D"), false;
    pagar(p);
    s.envueltas.splice(s.envueltas.indexOf(cual), 1);
    const slot = cual === "armadura" ? ["casco", "pecho", "piernas", "botas"][Math.floor(Math.random() * 4)] : cual;
    // la suerte de Kolbrun: un poco más de la de siempre, y una de cada treinta y tantas, legendaria
    const it = OBJETOS.generar({ n: nivelObjeto() + 1, slot, hallazgo: 2.2, tema: ARTE_OBJ.temaEn(W, jug.x, jug.y) });
    BOTIN.dar(it, { silencio: true });
    HUD.aviso(t("cm.envuelta_era", [OBJETOS.nombre(it)]), OBJETOS.COL_TEXTO[it.r]);
    if (window.SONIDO) SONIDO.tocar(it.r >= 2 ? "mision" : "plata", { vol: 0.55 });
    if (it.r >= 2 && window.ANIMA) ANIMA.gesto("feliz");
    return it;
  }
  function vender(id, it) {
    const b = BOTIN.estado().bolsa,
      i = b.indexOf(it);
    if (i < 0) return false;
    if (it.r >= 2 && confirmar !== it.u) {
      confirmar = it.u;
      HUD.aviso(t("cm.vender_seguro", [OBJETOS.nombre(it)]), "#FF8D71");
      return false;
    }
    confirmar = null;
    const p = precioVenta(it, id);
    b.splice(i, 1);
    PODERES.pj().plata += p;
    it.vendida = p;
    st.recompra.unshift(it);
    if (st.recompra.length > RECOMPRA) st.recompra.length = RECOMPRA;
    HUD.aviso(t("cm.vendido", [OBJETOS.nombre(it), p]), "#FFD98A");
    sonar(true);
    return true;
  }
  function recomprar(it) {
    const p = it.vendida || precioVenta(it, actual);
    if (plata() < p) return HUD.aviso(t("cm.sin_plata"), "#C8402D"), sonar(false), false;
    if (lleno()) return HUD.aviso(t("ob.bolsa_llena"), "#C8402D"), false;
    pagar(p);
    st.recompra.splice(st.recompra.indexOf(it), 1);
    delete it.vendida;
    BOTIN.dar(it, { silencio: true });
    sonar(true);
    return true;
  }

  const alt = (info) => {
    for (const f of alts) {
      const a = f(info);
      if (a) return a;
    }
    return null;
  };
  // ---------- la pestaña del mercader ----------
  function abrir(id) {
    actual = id;
    confirmar = null;
    stock(id);
    INVENTARIO.abrir("tienda");
  }
  function pintar(cuerpo, api) {
    if (!actual) return;
    const id = actual,
      s = stock(id),
      plataTxt = `<span class="cm-plata">${t("cm.tu_plata", [plata()])}</span>`;
    const rotulo = (k, v) => cuerpo.insertAdjacentHTML("beforeend", `<div class="rotulo inv-piezas">${t(k, v)}</div>`);
    const rejilla = () => {
      const g = document.createElement("div");
      g.className = "inv-rejilla cm-rejilla";
      cuerpo.appendChild(g);
      return g;
    };
    cuerpo.insertAdjacentHTML("beforeend", `<p class="cm-saludo"><b>${t("av.nombre_" + id)}</b> · ${t("cm.saludo_" + id)} ${plataTxt}</p>`);
    // lo que vende
    rotulo("cm.vende", [t("av.nombre_" + id)]);
    let g = rejilla(),
      fila = 0;
    s.piezas.forEach((it, k) => {
      const p = precioCompra(it, id);
      g.appendChild(
        api.celda({ obj: it, nombre: OBJETOS.nombre(it), col: OBJETOS.COL_TEXTO[it.r], cant: p, html: BOTIN.html(it, true) + `<span class="ob-pista">${t("cm.pista_comprar", [p])}</span>`, fn: () => comprar(id, it), alt: alt({ tipo: "compra", it, mercader: id }) }, fila + Math.floor(k / 9), k % 9, plata() < p ? "cm-caro" : ""),
      );
    });
    if (!s.piezas.length) cuerpo.insertAdjacentHTML("beforeend", `<p class="inv-nota">${t("cm.sin_piezas")}</p>`);
    // los materiales y las envueltas
    g = rejilla();
    fila += 2;
    let col = 0;
    for (const k in s.mats) {
      if (!s.mats[k]) continue;
      const p = precioMat(k, id);
      g.appendChild(api.celda({ id: "cm_" + k, icono: "mt_" + k, nombre: t("mt." + k), desc: t("mt." + k + "_d") + " " + t("cm.pista_mat", [p, s.mats[k], MATERIALES.cuantos(k)]), cant: p, fn: () => comprarMat(id, k) }, fila, col++, plata() < p ? "cm-caro" : ""));
    }
    if (s.envueltas.length) {
      const p = precioEnvuelta(id);
      s.envueltas.forEach((cual) =>
        g.appendChild(
          api.celda({ fantasma: { b: ENVUELTA[cual], r: 0, n: 1, a: [], tema: 1, v: 0 }, nombre: t("cm.envuelta_" + cual), desc: t("cm.envuelta_d", [p]), cant: p, fn: () => comprarEnvuelta(id, cual) }, fila, col++, "cm-envuelta" + (plata() < p ? " cm-caro" : "")),
        ),
      );
    }
    // la bolsa para vender
    const bolsa = BOTIN.estado().bolsa;
    rotulo("cm.vender", [bolsa.length, BOTIN.MAX_BOLSA]);
    g = rejilla();
    fila += 2;
    bolsa.forEach((it, k) => {
      const p = precioVenta(it, id);
      g.appendChild(api.celda({ obj: it, nombre: OBJETOS.nombre(it), col: OBJETOS.COL_TEXTO[it.r], cant: p, html: BOTIN.html(it, true) + `<span class="ob-pista">${t("cm.pista_vender", [p])}</span>`, fn: () => vender(id, it), alt: alt({ tipo: "venta", it, mercader: id }) }, fila + Math.floor(k / 9), k % 9));
    });
    if (!bolsa.length) cuerpo.insertAdjacentHTML("beforeend", `<p class="inv-nota">${t("ob.bolsa_vacia")}</p>`);
    // recomprar
    if (st.recompra.length) {
      rotulo("cm.recompra");
      g = rejilla();
      fila += 5;
      st.recompra.forEach((it, k) => g.appendChild(api.celda({ obj: it, nombre: OBJETOS.nombre(it), col: OBJETOS.COL_TEXTO[it.r], cant: it.vendida, html: BOTIN.html(it, true) + `<span class="ob-pista">${t("cm.pista_recomprar", [it.vendida])}</span>`, fn: () => recomprar(it) }, fila, k)));
    }
  }

  // ---------- Kolbrun en el bosque ----------
  function ubicarKolbrun() {
    const p = W.LUGARES.refugio.p;
    for (let k = 0; k < 200; k++) {
      const a = 0.4 + k * 2.4,
        d = 420 + k * 18,
        x = p[0] + Math.cos(a) * d,
        y = p[1] + Math.sin(a) * d * 0.8;
      if (!W.libre(x, y, 90) || !W.libre(x - 90, y, 40) || !W.libre(x + 90, y, 40) || W.CAMINOS.some((c) => W.distLinea(x, y, c.p) < c.w / 2 + 30)) continue;
      kolbrun = { x, y, mira: { vista: "S", espejo: false } };
      kolbrun.fardo = W.agregar("fardoKolbrun", [x + 70, y - 30], { sem: 3 });
      return;
    }
  }
  // se comercia en el mostrador de Ingrid (al lado de donde ella está: hablarle sigue siendo hablarle); si ya se fue
  // al norte, el mostrador sigue con su carga y lo atiende Eydis
  function posIngrid() {
    const m = W.NOMBRADAS.mostrador;
    return m ? [m.x, m.y + 50] : null;
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      ubicarKolbrun();
      INVENTARIO.pestana({ id: "tienda", antes: "equipo", nombre: () => (actual ? t("av.nombre_" + actual) : t("cm.tienda")), visible: () => !!actual, pintar });
    },
    alEmpezar(extra) {
      extra.comercio = Object.assign(base(), extra.comercio || {});
      st = extra.comercio;
      actual = null;
    },
    actualizar() {
      if (actual && !INVENTARIO.abierta()) actual = null;
    },
    cercanos(dar) {
      if (J.dentro) return;
      const pi = posIngrid();
      if (pi) {
        const d = Math.hypot(pi[0] - jug.x, pi[1] - jug.y);
        if (d < RADIO) dar(d, t("cm.comerciar", [t("av.nombre_ingrid")]), () => abrir("ingrid"), pi[0], pi[1] - 150);
      }
      if (kolbrun) {
        const d = Math.hypot(kolbrun.x - jug.x, kolbrun.y - jug.y);
        if (d < RADIO) dar(d, t("cm.comerciar", [t("av.nombre_kolbrun")]), () => abrir("kolbrun"), kolbrun.x, kolbrun.y - 150);
      }
    },
    cuerpos(f) {
      if (kolbrun) f(kolbrun.x, kolbrun.y, 30);
    },
    piso(c, x0, y0, x1, y1) {
      if (kolbrun && kolbrun.x > x0 - 200 && kolbrun.x < x1 + 200 && kolbrun.y > y0 - 200 && kolbrun.y < y1 + 200) ASSETS.dibujar(c, "alfombraKolbrun", kolbrun.x, kolbrun.y + 50, J.t, { s: 0.85 });
    },
    objetos(lista, visible, c) {
      if (!kolbrun || !visible(kolbrun.x, kolbrun.y)) return;
      const k = kolbrun;
      if (Math.hypot(jug.x - k.x, jug.y - k.y) < 300) k.mira = VIKINGO.vista(jug.x - k.x, jug.y - k.y, k.mira);
      lista.push({ x: k.x, y: k.y, f: () => GENTE.dibujar(c, "kolbrun", k.x, k.y, J.t, { vista: k.mira.vista, espejo: k.mira.espejo }) });
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return {
    sistema,
    estado: () => st,
    abrir,
    actual: () => actual,
    stock,
    comprar,
    comprarMat,
    comprarEnvuelta,
    vender,
    recomprar,
    precioCompra,
    precioVenta,
    precioMat,
    precioEnvuelta,
    precioCompraSin,
    precioVentaSin,
    modPrecio: (f) => mods.push(f),
    rarezaCon,
    altCasilla: (f) => alts.push(f),
    kolbrun: () => kolbrun,
    posIngrid,
    // las marcas del mapa grande
    marcas: () => [posIngrid() && { x: posIngrid()[0], y: posIngrid()[1], nombre: t("av.nombre_ingrid") }, kolbrun && { x: kolbrun.x, y: kolbrun.y, nombre: t("av.nombre_kolbrun") }].filter(Boolean),
    diaDeHoy,
    MERCADERES,
    COMPRA,
    VENTA,
  };
})();
