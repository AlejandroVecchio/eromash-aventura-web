// ---------- el arcón del Puesto y el filtro del botín (sistema ARCON) ----------
// Como el baúl del Diablo y el filtro de botín del Path of Exile:
// - El arcón de Eromash, en el patio del Puesto (asset `arconPuesto`): «Abrir el arcón» abre la pestaña Arcón de la
//   mochila; tocar una pieza de la bolsa la guarda y tocar una guardada la devuelve. Empieza con 24 lugares y Eydis lo
//   agranda dos veces (36 y 48) por plata desde la misma pestaña. Lo guardado no se pierde nunca.
// - El filtro, en la Bolsa: qué piezas muestran su haz y su nombre en el piso (todo, mágicas o mejores, raras o
//   mejores). Lo de conjunto, las legendarias y las piezas con muescas se muestran siempre. Con «desarmar lo filtrado»,
//   lo que no pasa el filtro se desarma solo al juntarlo (plata y materiales, sin llenar la bolsa).
// Estado en E.extra.arcon = { piezas: [], cap, filtro: 0..2, desarmar: bool, guardadas: n }. Textos `ac.`.
window.ARCON = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const CAPS = [24, 36, 48],
    AGRANDAR = [150, 400]; // plata para pasar a la siguiente
  const base = () => ({ piezas: [], cap: CAPS[0], filtro: 0, desarmar: false, guardadas: 0 });
  let st = base();
  let arcon = null,
    abierto = false;

  // ---------- el filtro ----------
  // ¿esta pieza se esconde en el piso? (lo especial se muestra siempre)
  const especial = (it) => it.e > 0 || it.cj || it.po || it.r >= 3;
  const oculta = (it) => !!(st.filtro && it.r < st.filtro && !especial(it));
  // al juntar: ¿se desarma sola? (devuelve true si se la llevó)
  function alJuntar(it) {
    if (!st.desarmar || !oculta(it)) return false;
    const plata = Math.max(1, Math.round(OBJETOS.valor(it) * 0.5));
    PODERES.darPlata(plata);
    const mat = window.MATERIALES ? MATERIALES.alDesarmar(it) : null;
    A.textoFlotante(jug.x, jug.y - 110, t("ac.desarmada", [plata]) + (mat ? " · " + MATERIALES.texto(mat) : ""), "#E0B2B2");
    if (window.SONIDO) SONIDO.tocar("golpe", { vol: 0.3, tono: 1.4 });
    return true;
  }
  function cambiarFiltro() {
    st.filtro = (st.filtro + 1) % 3;
    HUD.aviso(t("ac.filtro_es", [t("ac.f_" + st.filtro)]), "#73D5DB");
    return false;
  }
  function cambiarDesarmar() {
    st.desarmar = !st.desarmar;
    return false;
  }

  // ---------- el arcón ----------
  function guardar(it) {
    const b = BOTIN.estado();
    const i = b.bolsa.indexOf(it);
    if (i < 0) return false;
    if (st.piezas.length >= st.cap) return HUD.aviso(t("ac.lleno"), "#C8402D"), false;
    b.bolsa.splice(i, 1);
    it.nuevo = false;
    st.piezas.push(it);
    st.guardadas++;
    if (window.SONIDO) SONIDO.tocar("crujido", { vol: 0.35, tono: 1.2 });
    return true;
  }
  function sacar(it) {
    const i = st.piezas.indexOf(it);
    if (i < 0) return false;
    const b = BOTIN.estado();
    if (b.bolsa.length >= BOTIN.MAX_BOLSA) return HUD.aviso(t("ob.bolsa_llena"), "#C8402D"), false;
    st.piezas.splice(i, 1);
    b.bolsa.push(it);
    if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.35, tono: 1.1 });
    return true;
  }
  // guardar de una vez todo lo de la bolsa que sea de una rareza (o menos)
  function guardarTodo() {
    const b = BOTIN.estado();
    let n = 0;
    b.bolsa.slice().forEach((it) => st.piezas.length < st.cap && guardar(it) && n++);
    if (n) HUD.aviso(t("ac.guardaste", [n]), "#FFD98A");
    return n;
  }
  function agrandar() {
    const k = CAPS.indexOf(st.cap);
    if (k < 0 || k >= CAPS.length - 1) return false;
    const pj = PODERES.pj();
    if (pj.plata < AGRANDAR[k]) return HUD.aviso(t("ac.sin_plata", [AGRANDAR[k]]), "#C8402D"), false;
    pj.plata -= AGRANDAR[k];
    st.cap = CAPS[k + 1];
    HUD.aviso(t("ac.agrandado", [st.cap]), "#FFD98A");
    if (window.SONIDO) SONIDO.tocar("golpeFuerte", { vol: 0.4, tono: 1.2 });
    return true;
  }
  function abrir() {
    abierto = true;
    if (arcon) arcon.o.abierto = true;
    if (window.SONIDO) SONIDO.tocar("crujido", { vol: 0.6, tono: 0.9 });
    INVENTARIO.abrir("arcon");
  }
  function ubicar() {
    // en el patio del Puesto, del otro lado de la mesa de alquimia
    const pp = W.PUNTOS.puesto || W.LUGARES.puesto.p;
    let pm = null;
    for (let k = 0; k < 140 && !pm; k++) {
      const a = 5.4 + k * 0.61,
        d = 240 + k * 5,
        x = pp[0] + Math.cos(a) * d,
        y = pp[1] + Math.sin(a) * d * 0.8;
      // lejos de los otros muebles del patio (el tablón, el poste, la mesa), así se ve entero
      const solo = !W.COSAS.some((o) => !o.oculto && o.id !== "arconPuesto" && Math.abs(o.x - x) < 190 && o.y - y > -60 && o.y - y < 220);
      if (solo && W.libre(x, y, 70) && W.libre(x - 70, y, 30) && W.libre(x + 70, y, 30) && !W.CAMINOS.some((c) => W.distLinea(x, y, c.p) < c.w / 2 + 50)) pm = [x, y];
    }
    arcon = W.agregar("arconPuesto", pm || [pp[0] + 300, pp[1] + 140], { sem: 2 });
  }

  // ---------- la pestaña ----------
  function pintar(cuerpo, api) {
    const b = BOTIN.estado();
    cuerpo.insertAdjacentHTML("beforeend", `<p class="aq-cabeza">${t("ac.cabeza")}</p>`);
    const fila = (rot, celdas) => {
      cuerpo.insertAdjacentHTML("beforeend", `<div class="rotulo inv-piezas">${rot}</div>`);
      const g = document.createElement("div");
      g.className = "inv-rejilla";
      celdas.forEach((c) => g.appendChild(c));
      cuerpo.appendChild(g);
    };
    const pieza = (it, f, k, fn, pista) => api.celda({ obj: it, nombre: OBJETOS.nombre(it), col: OBJETOS.COL_TEXTO[it.r], html: BOTIN.html(it) + `<span class="ob-pista">${pista}</span>`, nuevo: it.nuevo, fn }, f, k);
    const k = CAPS.indexOf(st.cap);
    const extra = [];
    if (b.bolsa.length) extra.push(api.celda({ icono: "ac_guardar", nombre: t("ac.guardar_todo"), desc: t("ac.guardar_todo_d"), fn: () => (guardarTodo(), false) }, 0, b.bolsa.length));
    fila(t("ac.bolsa", [b.bolsa.length, BOTIN.MAX_BOLSA]), b.bolsa.map((it, i) => pieza(it, 0, i, () => (guardar(it), false), t("ac.pista_guardar"))).concat(extra));
    const masLugar = k >= 0 && k < CAPS.length - 1 ? [api.celda({ icono: "ac_agrandar", nombre: t("ac.agrandar", [CAPS[k + 1]]), desc: t("ac.agrandar_d", [AGRANDAR[k], CAPS[k + 1]]), fn: () => (agrandar(), false) }, 1, st.piezas.length)] : [];
    fila(t("ac.adentro", [st.piezas.length, st.cap]), st.piezas.map((it, i) => pieza(it, 1, i, () => (sacar(it), false), t("ac.pista_sacar"))).concat(masLugar));
  }
  function iconos() {
    INVENTARIO.iconoDe("ac_guardar", (c) => {
      DIB.P(c, [-22, -4, 22, -4, 22, 22, -22, 22], "#553A22");
      DIB.P(c, [0, -4, 22, -4, 22, 22, 0, 22], "#7A5634");
      DIB.P(c, [-6, -26, 6, -26, 6, -12, 14, -12, 0, 0, -14, -12, -6, -12], "#FFD98A");
    });
    INVENTARIO.iconoDe("ac_agrandar", (c) => {
      DIB.P(c, [-24, -10, 24, -10, 24, 22, -24, 22], "#553A22");
      DIB.P(c, [0, -10, 24, -10, 24, 22, 0, 22], "#7A5634");
      DIB.P(c, [-3, -26, 3, -26, 3, -18, 11, -18, 11, -12, 3, -12, 3, -4, -3, -4, -3, -12, -11, -12, -11, -18, -3, -18], "#7BC86C");
    });
    INVENTARIO.iconoDe("ac_filtro", (c) => {
      DIB.P(c, [-24, -20, 24, -20, 6, 2, 6, 22, -6, 16, -6, 2], "#4A78D0");
      DIB.P(c, [0, -20, 24, -20, 6, 2, 6, 22, 0, 19], "#8FB0F0");
    });
    INVENTARIO.iconoDe("ac_desarmar", (c) => {
      DIB.P(c, [-6, 22, -2, -14, 4, -14, 8, 22], "#7A5634");
      DIB.P(c, [-20, -24, 18, -24, 22, -12, -16, -10], "#5A5450");
      DIB.P(c, [0, -24, 18, -24, 22, -12, 0, -11], "#8E8A86");
    });
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      iconos();
      INVENTARIO.pestana({ id: "arcon", antes: "equipo", nombre: () => t("ac.tab"), visible: () => abierto, pintar });
    },
    alEmpezar(extra) {
      extra.arcon = Object.assign(base(), extra.arcon || {});
      st = extra.arcon;
      abierto = false;
      // se ubica recién acá, con los muebles de todos los sistemas ya puestos (el poste de contratos)
      if (!arcon) ubicar();
    },
    actualizar() {
      if (abierto && !INVENTARIO.abierta()) {
        abierto = false;
        if (arcon) arcon.o.abierto = false;
      }
    },
    cercanos(dar) {
      if (J.dentro || !arcon) return;
      const d = Math.hypot(arcon.x - jug.x, arcon.y - jug.y);
      if (d < 130) dar(d, t("ac.abrir"), abrir, arcon.x, arcon.y - 110);
    },
    celdasBolsa() {
      return [
        { id: "ac_filtro", icono: "ac_filtro", nombre: t("ac.filtro", [t("ac.f_" + st.filtro)]), desc: t("ac.filtro_d"), fn: cambiarFiltro },
        { id: "ac_desarmar", icono: "ac_desarmar", nombre: t("ac.desarmar", [t(st.desarmar ? "ac.si" : "ac.no")]), desc: t("ac.desarmar_d"), fn: cambiarDesarmar },
      ];
    },
    diario() {
      return st.piezas.length ? `<div class="diario-resumen"><p><b>${t("ac.tab")}</b> ${t("ac.diario", [st.piezas.length, st.cap])}</p></div>` : "";
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, oculta, alJuntar, guardar, sacar, guardarTodo, agrandar, abrir, arcon: () => arcon, CAPS, AGRANDAR };
})();
