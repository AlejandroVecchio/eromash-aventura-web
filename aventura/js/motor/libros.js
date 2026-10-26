// ---------- los libros de Eldervald (sistema LIBROS, modo "libro") ----------
// Como los libros de habilidad del Morrowind y el Skyrim y las sagas por tomos del Oblivion: quince libros para leer,
// cada uno con su tapa, su autor y sus páginas, que dejan algo la primera vez que se leen:
//   · Saga (4 tomos de Sigrun Mano de Hierro): la saga entera da un punto de habilidad y dos fragmentos.
//   · Oficio: un punto de atributo (Fuerza, Destreza, Vigor, Espíritu) o, el cuaderno del maestro, uno de habilidad.
//   · Caza: +10 % de daño para siempre contra lobos, muertos (draugr y errantes) o arañas (modDano).
//   · Saber: experiencia y la historia de Eldervald.
// Nueve están en atriles de piedra a un costado de los caminos (el más cercano al Puesto, la crónica) y van al mapa
// (clase Libros) cuando se los ve; los otros seis los llevan encima los líderes de los grupos (40 %; un semijefe
// siempre) y quedan tirados donde cayó hasta que se los junta. Leerlos todos da un punto de atributo y un fragmento.
// Se leen en una ventana de dos páginas (izquierda/derecha pasan las hojas, pausa cierra; botones y toques también) y
// los leídos se releen desde la Bolsa. Estado en E.extra.libros = { leidos: { id: 1 }, vistos: { i: 1 },
// caidos: [{ id, x, y }], soltados: { id: 1 }, saga, todos }. Textos `lb.`.
window.LIBROS = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const RADIO = 120,
    VE = 900,
    PROB_LIDER = 0.4,
    XP = 40,
    XP_SABER = 150,
    CAZA_MULT = 1.1;
  // cada libro: su clase, cuántas páginas, el color de la tapa y lo que deja
  const LISTA = {
    sigrun1: { tipo: "saga", pag: 3, col: "#5E130D" },
    sigrun2: { tipo: "saga", pag: 3, col: "#5E130D" },
    sigrun3: { tipo: "saga", pag: 3, col: "#5E130D" },
    sigrun4: { tipo: "saga", pag: 3, col: "#5E130D" },
    uro: { tipo: "oficio", pag: 2, col: "#C8402D", atrib: "fue" },
    pasos: { tipo: "oficio", pag: 2, col: "#5E7A3E", atrib: "des" },
    invierno: { tipo: "oficio", pag: 2, col: "#6E8AA8", atrib: "vig" },
    ansuz: { tipo: "oficio", pag: 2, col: "#3A6E78", atrib: "esp" },
    maestro: { tipo: "oficio", pag: 2, col: "#7A5634", habil: true },
    lobos: { tipo: "caza", pag: 2, col: "#6E6A66", caza: ["lobo"], nombre: "lobos" },
    muertos: { tipo: "caza", pag: 2, col: "#4A5244", caza: ["draugr", "errante"], nombre: "muertos" },
    aranas: { tipo: "caza", pag: 2, col: "#3A3634", caza: ["arana", "aranaReina"], nombre: "aranas" },
    cronica: { tipo: "saber", pag: 3, col: "#9A7650" },
    fresno: { tipo: "saber", pag: 3, col: "#4E6B3A" },
    herrera: { tipo: "saber", pag: 2, col: "#9C2315" },
  };
  const IDS = Object.keys(LISTA);
  const SAGA = ["sigrun1", "sigrun2", "sigrun3", "sigrun4"];
  // los de los atriles, del más cercano al Puesto al más lejano; los otros los llevan los líderes, en este orden
  const EN_ATRIL = ["cronica", "sigrun1", "uro", "lobos", "pasos", "sigrun2", "fresno", "ansuz", "herrera"];
  const DE_LIDER = ["invierno", "sigrun3", "muertos", "maestro", "aranas", "sigrun4"];
  const base = () => ({ leidos: {}, vistos: {}, caidos: [], soltados: {}, saga: 0, todos: false });
  let st = base();
  const atriles = []; // { id, x, y, cosa }
  let lector = null, // { id, pag, nuevo: [mensajes al cerrar] }
    modoAntes = null;
  const titulo = (id) => t("lb." + id + "_t");
  const leido = (id) => !!st.leidos[id];
  const cuantos = () => IDS.filter(leido).length;

  // ---------- dónde: atriles a un costado de los caminos ----------
  function buscarLugares() {
    const L = W.LUGARES,
      pu = L.puesto.p,
      cands = [];
    W.CAMINOS.forEach((c) => {
      for (let i = 0; i < c.p.length - 1; i++) {
        const a = c.p[i],
          b = c.p[i + 1],
          dx = b[0] - a[0],
          dy = b[1] - a[1],
          l = Math.hypot(dx, dy) || 1,
          k0 = c.w / 2;
        for (let u = 150; u < l; u += 220) [-1, 1].forEach((lado) => [150, 240].forEach((k1) => cands.push([a[0] + (dx / l) * u + (-dy / l) * (k0 + k1) * lado, a[1] + (dy / l) * u + (dx / l) * (k0 + k1) * lado])));
      }
    });
    const ocupados = [];
    HORDAS.grupos.forEach((g) => ocupados.push([g.centro[0], g.centro[1], 900]));
    if (window.BANDIDOS) BANDIDOS.guaridas.forEach((g) => ocupados.push([g.centro[0], g.centro[1], 1800]));
    if (window.ARANAS) ARANAS.nidos.forEach((n) => ocupados.push([n.centro[0], n.centro[1], 1800]));
    if (window.JOTUNN && JOTUNN.jefe()) ocupados.push([JOTUNN.jefe().centro[0], JOTUNN.jefe().centro[1], 2400]);
    const firme = (x, y) => [[0, 0], [0, 120], [-80, 40], [80, 40]].every(([dx, dy]) => W.sueloEn(x + dx, y + dy) === 0);
    const ok = ([x, y]) =>
      firme(x, y) &&
      Object.keys(L).every((k) => Math.hypot(x - L[k].p[0], y - L[k].p[1]) > L[k].r + 300) &&
      Math.hypot(x - W.CIUDAD.c[0], (y - W.CIUDAD.c[1]) * 1.3) > W.CIUDAD.rx + 900 &&
      ocupados.every((q) => Math.hypot(q[0] - x, q[1] - y) > q[2]) &&
      W.CAMINOS.every((c) => W.distLinea(x, y, c.p) > c.w / 2 + 90) &&
      !W.LAGOS.some((g) => Math.hypot(x - g.p[0], y - g.p[1]) < g.rx + 200) &&
      !W.RIOS.some((r) => !r.seco && W.distLinea(x, y, r.p) < (r.w || 200) + 150) &&
      W.libre(x, y, 40);
    const rnd = DIB.azar(8807);
    cands.forEach((p) => (p[2] = rnd()));
    cands.sort((a, b) => a[2] - b[2]);
    const buenos = cands.filter((p) => Math.hypot(p[0] - pu[0], p[1] - pu[1]) > 1500 && ok(p));
    const elegidos = [];
    // el primero cerca del Puesto, para que el sistema se descubra temprano
    const cerca = buenos.filter((p) => Math.hypot(p[0] - pu[0], p[1] - pu[1]) < 4500).sort((a, b) => Math.hypot(a[0] - pu[0], a[1] - pu[1]) - Math.hypot(b[0] - pu[0], b[1] - pu[1]))[0];
    if (cerca) elegidos.push(cerca);
    for (const sep of [5000, 3800, 2600])
      for (const p of buenos) {
        if (elegidos.length >= EN_ATRIL.length) break;
        if (!elegidos.includes(p) && elegidos.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) >= sep)) elegidos.push(p);
      }
    return elegidos.sort((a, b) => Math.hypot(a[0] - pu[0], a[1] - pu[1]) - Math.hypot(b[0] - pu[0], b[1] - pu[1]));
  }
  function armar() {
    buscarLugares().forEach((p, i) => {
      const id = EN_ATRIL[i];
      // apartar lo que tape el atril
      W.cercanas(p[0] - 160, p[1] - 120, p[0] + 160, p[1] + 260, (o) => {
        if (!o.arbol && o.id !== "roca" && o.id !== "troncoCaido") return;
        if (Math.hypot(o.x - p[0], (o.y - p[1]) * (o.y > p[1] ? 0.5 : 1)) > 150) return;
        o.oculto = true;
        o.choque = null;
      });
      const cosa = W.agregar("atrilPiedra", p, { col: LISTA[id].col });
      atriles.push({ id, x: p[0], y: p[1], cosa });
    });
  }

  // ---------- leer ----------
  // lo que deja un libro la primera vez (los mensajes salen al cerrar el lector)
  function aprender(id) {
    if (leido(id)) return [];
    st.leidos[id] = 1;
    const b = LISTA[id],
      msg = [];
    if (window.RPG) RPG.dar(b.tipo === "saber" ? XP_SABER : XP, jug.x, jug.y);
    if (b.tipo === "saga") {
      st.saga = SAGA.filter(leido).length;
      msg.push([t("lb.da_saga", [st.saga]), "#FFD98A"]);
      if (st.saga === SAGA.length) {
        if (window.ARBOL) ARBOL.sumarPuntos(1);
        PODERES.darFragmento();
        PODERES.darFragmento();
        msg.push([t("lb.saga_entera_d"), "lugar", t("lb.saga_entera")]);
      }
    } else if (b.atrib) {
      if (window.ATRIBUTOS) ATRIBUTOS.sumarPuntos(1);
      msg.push([t("lb.da_atrib"), "#7BC86C"]);
    } else if (b.habil) {
      if (window.ARBOL) ARBOL.sumarPuntos(1);
      msg.push([t("lb.da_habil"), "#7BC86C"]);
    } else if (b.caza) msg.push([t("lb.da_caza", [t("lb.caza_" + b.nombre)]), "#FF8D71"]);
    else msg.push([t("lb.da_saber"), "#73D5DB"]);
    if (!st.todos && cuantos() === IDS.length) {
      st.todos = true;
      if (window.ATRIBUTOS) ATRIBUTOS.sumarPuntos(1);
      PODERES.darFragmento();
      msg.push([t("lb.todos_d"), "lugar", t("lb.todos")]);
    }
    const at = atriles.find((a) => a.id === id);
    if (at) at.cosa.o.leido = true;
    if (window.INVENTARIO) INVENTARIO.repintar();
    return msg;
  }
  function leer(id) {
    if (!LISTA[id] || lector) return false;
    const nuevo = aprender(id);
    lector = { id, pag: 0, nuevo };
    modoAntes = J.modo === "menu" || J.modo === "inventario" ? "juego" : J.modo;
    J.modo = "libro";
    armarCapa();
    pintar();
    if (window.SONIDO) SONIDO.tocar("crujido", { vol: 0.3, tono: 1.6 });
    return true;
  }
  // de a dos páginas: la primera hoja lleva el título y la primera página
  const hojas = (id) => Math.ceil((LISTA[id].pag + 1) / 2);
  function pasar(d) {
    if (!lector) return;
    const n = hojas(lector.id),
      p = lector.pag + d;
    if (p < 0) return;
    if (p >= n) return cerrar();
    lector.pag = p;
    if (window.SONIDO) SONIDO.tocar("crujido", { vol: 0.2, tono: 2.2 });
    pintar();
  }
  function cerrar() {
    const l = lector;
    lector = null;
    J.modo = modoAntes || "juego";
    const el = document.getElementById("libro");
    if (el) el.classList.add("oculto");
    CONTROLES.soltar && CONTROLES.soltar();
    if (l && l.nuevo.length) {
      l.nuevo.forEach((m, i) => J.retrasar(0.2 + i * 1.8, () => HUD.aviso(m[0], m[1], m[2])));
      if (window.ANIMA) ANIMA.gesto("asiente");
    }
  }
  // los leídos, para releer (desde la Bolsa)
  function biblioteca() {
    if (window.INVENTARIO && INVENTARIO.abierta()) INVENTARIO.cerrar();
    const ids = IDS.filter(leido);
    const botones = ids.map((id) => ({ texto: titulo(id), sub: t("lb.tipo_" + LISTA[id].tipo) + " · " + t("lb." + id + "_a"), fn: () => (A.cerrarMenu(), leer(id)) }));
    botones.push({ texto: t("ui.cerrar"), fn: A.cerrarMenu });
    A.menu(`<h2>${t("lb.biblioteca")}</h2><div class="sub">${ids.length ? t("lb.biblioteca_d", [ids.length, IDS.length]) : t("lb.ninguno")}</div>`, botones);
  }

  // ---------- la ventana del lector ----------
  function armarCapa() {
    let el = document.getElementById("libro");
    if (!el) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `<div id="libro" class="ui panel"><div class="lb-hojas"><div class="lb-hoja lb-izq"></div><div class="lb-hoja lb-der"></div></div><p class="lb-num"></p><div class="lb-botones"><button type="button" data-d="-1"></button><button type="button" data-d="1"></button><button type="button" data-d="0"></button></div><p class="lb-pie"></p></div>`,
      );
      el = document.getElementById("libro");
      el.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => (+b.dataset.d ? pasar(+b.dataset.d) : cerrar())));
      // tocar la hoja izquierda vuelve, la derecha sigue
      el.querySelector(".lb-izq").addEventListener("pointerdown", (e) => (e.preventDefault(), pasar(-1)));
      el.querySelector(".lb-der").addEventListener("pointerdown", (e) => (e.preventDefault(), pasar(1)));
    }
    el.classList.remove("oculto");
  }
  // el contenido de una página: 0 es la portada (título, autor y la tapa), después cada página del libro
  function pagina(id, k) {
    const b = LISTA[id];
    if (k === 0) return `<div class="lb-portada" style="--tapa:${b.col}"><small>${t("lb.tipo_" + b.tipo)}</small><h2>${titulo(id)}</h2><p>${t("lb." + id + "_a")}</p></div>`;
    if (k > b.pag) return "";
    return `<p>${t("lb." + id + "_" + k)}</p><span class="lb-folio">${k}</span>`;
  }
  function pintar() {
    const el = document.getElementById("libro");
    if (!el || !lector) return;
    const id = lector.id,
      k = lector.pag * 2;
    el.querySelector(".lb-izq").innerHTML = pagina(id, k);
    el.querySelector(".lb-der").innerHTML = pagina(id, k + 1);
    el.querySelector(".lb-num").textContent = t("lb.pagina", [lector.pag + 1, hojas(id)]);
    const [ba, bd, bc] = el.querySelectorAll("button");
    ba.textContent = CONTROLES.glifo("izquierda") + " " + t("lb.b_antes");
    bd.textContent = t("lb.b_despues") + " " + CONTROLES.glifo("derecha");
    bc.textContent = t("lb.b_cerrar") + " · " + CONTROLES.glifo("pausa");
    ba.disabled = lector.pag === 0;
    bd.disabled = lector.pag >= hojas(id) - 1;
    el.querySelector(".lb-pie").textContent = t("lb.pie", [CONTROLES.glifo("izquierda") + CONTROLES.glifo("derecha"), CONTROLES.glifo("pausa")]);
  }
  function paso() {
    if (!lector) return cerrar();
    if (CONTROLES.recien("pausa") || CONTROLES.recien("lente")) return cerrar();
    if (CONTROLES.recien("izquierda")) pasar(-1);
    else if (CONTROLES.recien("derecha") || CONTROLES.recien("interactuar") || CONTROLES.recien("saltar")) pasar(1);
  }

  // ---------- lo que llevan los líderes ----------
  function soltar(e) {
    const id = DE_LIDER.find((k) => !st.soltados[k] && !leido(k));
    if (!id) return null;
    st.soltados[id] = 1;
    st.caidos.push({ id, x: Math.round(e.x), y: Math.round(e.y + 20) });
    J.retrasar(0.8, () => HUD.aviso(t("lb.cayo", [e.lider && e.lider.nombre ? e.lider.nombre : t("cr." + e.tipo)]), "#FFD98A", t("lb.nuevo")));
    return id;
  }
  function juntar(c) {
    st.caidos = st.caidos.filter((q) => q !== c);
    if (window.SONIDO) SONIDO.tocar("crujido", { vol: 0.3, tono: 1.4 });
    leer(c.id);
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      J.modos = J.modos || {};
      J.modos.libro = paso;
      armar();
      if (window.INVENTARIO && INVENTARIO.iconoDe) INVENTARIO.iconoDe("lb_libros", (c) => (LIBROS_DIBUJO.libro(c, -4, 8, 1.2, "#5E130D", false), LIBROS_DIBUJO.libro(c, 4, -2, 1, "#5E7A3E", false)));
    },
    alEmpezar(extra) {
      extra.libros = Object.assign(base(), extra.libros || {});
      st = extra.libros;
      atriles.forEach((a) => (a.cosa.o.leido = leido(a.id)));
      if (lector) cerrar();
    },
    actualizar() {
      if (!A || J.dentro) return;
      atriles.forEach((a, i) => {
        if (st.vistos[i] || Math.hypot(jug.x - a.x, jug.y - a.y) > VE) return;
        st.vistos[i] = 1;
        HUD.aviso(t("lb.encontraste"), "lugar", t("as.atrilPiedra"));
      });
    },
    cercanos(dar) {
      if (J.dentro) return;
      for (const a of atriles) {
        const d = Math.hypot(a.x - jug.x, a.y - jug.y);
        if (d < RADIO) dar(d, t(leido(a.id) ? "lb.releer" : "lb.leer", [titulo(a.id)]), () => leer(a.id), a.x, a.y - 120);
      }
      for (const c of st.caidos) {
        const d = Math.hypot(c.x - jug.x, c.y - jug.y);
        if (d < RADIO) dar(d, t("lb.juntar"), () => juntar(c), c.x, c.y - 40);
      }
    },
    alMorir(e) {
      if (!e || !e.d || e.d.blanco || !(e.lider || e.patron)) return;
      if (e.patron || Math.random() < PROB_LIDER) soltar(e);
    },
    modDano(dano, e) {
      if (!e) return dano;
      for (const id of ["lobos", "muertos", "aranas"]) if (leido(id) && LISTA[id].caza.includes(e.tipo)) return dano * CAZA_MULT;
      return dano;
    },
    objetos(lista, visible, c) {
      if (J.dentro) return;
      for (const q of st.caidos) if (visible(q.x, q.y)) lista.push({ x: q.x, y: q.y, f: () => ASSETS.LISTA.libroCaido.f(c, q.x, q.y, J.t, { col: LISTA[q.id].col }) });
    },
    luces(dar) {
      if (J.dentro) return;
      for (const q of st.caidos) dar({ x: q.x, y: q.y - 10, r: 90, col: "#FFD98A", f: 0.35 });
      for (const a of atriles) if (!leido(a.id)) dar({ x: a.x, y: a.y - 80, r: 110, col: "#73D5DB", f: 0.3 });
    },
    marcasMapa() {
      const m = atriles.filter((a, i) => st.vistos[i]).map((a) => ({ tipo: "libro", x: a.x, y: a.y, op: { nombre: titulo(a.id), apagado: leido(a.id) } }));
      return m.concat(st.caidos.map((q) => ({ tipo: "libro", x: q.x, y: q.y, op: { nombre: titulo(q.id) } })));
    },
    celdasBolsa() {
      const n = cuantos();
      return n ? [{ id: "lb_libros", icono: "lb_libros", nombre: t("lb.bolsa"), col: "#9A7650", cant: n, desc: t("lb.bolsa_d"), fn: biblioteca }] : [];
    },
    diario() {
      const n = cuantos();
      if (!n) return "";
      const caza = ["lobos", "muertos", "aranas"].filter(leido).map((id) => t("lb.caza_" + LISTA[id].nombre));
      const filas = IDS.filter(leido)
        .map((id) => `<li><b>${titulo(id)}</b> · ${t("lb.tipo_" + LISTA[id].tipo)}</li>`)
        .join("");
      return `<div class="diario-resumen"><p><b>${t("lb.diario_t")}</b> ${t("lb.diario", [n, IDS.length])} ${t("lb.diario_saga", [st.saga])}${caza.length ? " " + t("lb.diario_caza", [caza.join(", ")]) : ""}</p><ul>${filas}</ul></div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, actual: () => lector, atriles, leer, pasar, cerrar, biblioteca, soltar, juntar, aprender, hojas, LISTA, IDS, SAGA, EN_ATRIL, DE_LIDER, CAZA_MULT };
})();
