// ---------- la saga de Eromash (sistema SAGA, pestaña Saga de la mochila) ----------
// El cierre de los sistemas de rol: todo lo que Eldervald tiene para hacer, en un solo lugar y en cuatro capítulos
// (la pelea, los oficios, el mundo y la gente), como el registro de progreso del Witcher o la página de logros del
// Diablo. Cada entrada lee el estado guardado de su sistema (nada se cuenta dos veces), dice cuánto va y una pista
// de cómo empezar. La saga entera tiene un porcentaje (el promedio de las entradas) y cuatro hitos que pagan:
// 25 % plata, 50 % un fragmento, 75 % una pieza rara o mejor y 100 % una legendaria y el título «Leyenda de
// Eldervald», que encabeza la pestaña. Un sistema que falta (no cargado) no aparece.
// Una entrada nueva: su línea en ENTRADAS (cap, runa, color y n() → [hecho, total]) y sus textos sg.e_<id> y
// sg.e_<id>_d. Estado en E.extra.saga = { hitos: { 25: 1 }, leyenda }. Textos `sg.`.
window.SAGA = (function () {
  "use strict";
  let A, J, jug;
  const t = (k, v) => I18N.t(k, v);
  const cuenta = (o) => Object.keys(o || {}).filter((k) => o[k]).length;
  const largo = (o) => (Array.isArray(o) ? o.length : Object.keys(o || {}).length);
  const CAPS = ["pelea", "oficios", "mundo", "gente"];
  // cada entrada: [id, capítulo, runa, color, sistema que la necesita, n() → [hecho, total]]
  const ENTRADAS = [
    ["nivel", "pelea", "mannaz", "#73D5DB", "RPG", () => [RPG.nivel(), RPG.TOPE]],
    ["bestiario", "pelea", "dagaz", "#E0B2B2", "BESTIARIO", () => [BESTIARIO.LISTA.reduce((m, k) => m + Math.max(0, BESTIARIO.nivel(k)), 0), BESTIARIO.LISTA.length * BESTIARIO.NIVELES.length]],
    ["contratos", "pelea", "tiwaz", "#C8402D", "CONTRATOS", () => [CONTRATOS.LISTA.filter((b) => (CONTRATOS.estado().c[b.id] || {}).fase === "vencido").length, CONTRATOS.LISTA.length]],
    ["bandidos", "pelea", "hagalaz", "#9C2315", "BANDIDOS", () => [cuenta(BANDIDOS.estado().saqueados), BANDIDOS.guaridas.length]],
    ["aranas", "pelea", "naudiz", "#7BC86C", "ARANAS", () => [cuenta(ARANAS.estado().cortados), ARANAS.nidos.length]],
    ["holmr", "pelea", "tiwaz", "#FFD98A", "HOLMR", () => [HOLMR.estado().vencidos, HOLMR.KEMPUR.length]],
    ["jotunn", "pelea", "isa", "#C8F2F4", "JOTUNN", () => [JOTUNN.estado().vencido ? 1 : 0, 1]],
    ["caceria", "pelea", "eihwaz", "#9A6BD8", "CACERIA", () => [Math.min(3, CACERIA.estado().vencidas + CACERIA.estado().sobrevividas), 3]],
    ["instructores", "oficios", "ansuz", "#FFD98A", "INSTRUCTORES", () => [Object.keys(INSTRUCTORES.LECCIONES).reduce((m, id) => m + INSTRUCTORES.aprendidas(id), 0), Object.keys(INSTRUCTORES.LECCIONES).reduce((m, id) => m + INSTRUCTORES.LECCIONES[id].length, 0)]],
    ["alquimia", "oficios", "berkano", "#7BC86C", "ALQUIMIA", () => [Object.keys(ALQUIMIA.HIERBAS).filter((h) => ALQUIMIA.estado().cosechadas[h] || ALQUIMIA.estado().hierbas[h]).length, largo(ALQUIMIA.HIERBAS)]],
    ["cocina", "oficios", "jera", "#F5A524", "COCINA", () => [Math.min(10, COCINA.estado().platos), 10]],
    ["pesca", "oficios", "laguz", "#5A8CA8", "PESCA", () => [Object.keys(PESCA.PECES).filter((p) => PESCA.estado().libro[p] && PESCA.estado().libro[p].n > 0).length, largo(PESCA.PECES)]],
    ["tintes", "oficios", "wunjo", "#C8402D", "TINTES", () => [cuenta(TINTES.estado().tiene), largo(TINTES.LISTA)]],
    ["legendarios", "oficios", "sowilo", "#F5A524", "LEGENDARIOS", () => [cuenta(LEGENDARIOS.estado().aprendidos), largo(LEGENDARIOS.POD)]],
    ["conjuntos", "oficios", "gebo", "#9BE08C", "CONJUNTOS", () => [cuenta(CONJUNTOS.estado().completos), largo(CONJUNTOS.JUEGOS)]],
    ["libros", "mundo", "ansuz", "#F2ECEC", "LIBROS", () => [cuenta(LIBROS.estado().leidos), LIBROS.IDS.length]],
    ["santuarios", "mundo", "algiz", "#C8402D", "SANTUARIOS", () => [cuenta(SANTUARIOS.estado().vistos), largo(SANTUARIOS.LISTA)]],
    ["elementos", "mundo", "thurisaz", "#B8A8F0", "ELEMENTOS", () => [(ELEMENTOS.estado().roble ? 1 : 0) + (ELEMENTOS.estado().fuente ? 1 : 0) + Math.min(6, cuenta(ELEMENTOS.estado().vistas)), 8]],
    ["casa", "mundo", "othala", "#9C2315", "CASA", () => [(CASA.estado().tuya ? 1 : 0) + cuenta(CASA.estado().hechas), 1 + largo(CASA.MEJORAS)]],
    ["companero", "gente", "raidho", "#B8AC9C", "COMPANERO", () => [COMPANERO.estado().rescatado ? COMPANERO.nivel() : 0, COMPANERO.TRUCOS]],
  ];
  const HITOS = [25, 50, 75, 100];
  const base = () => ({ hitos: {}, leyenda: false });
  let st = base();

  // las entradas de los sistemas que están cargados, con lo que llevan
  function entradas() {
    return ENTRADAS.filter((e) => window[e[4]]).map(([id, cap, runa, col, , n]) => {
      let v = [0, 0];
      try {
        v = n();
      } catch (err) {
        v = [0, 0];
      }
      const total = Math.max(0, v[1] || 0),
        hecho = Math.max(0, Math.min(total, v[0] || 0));
      return { id, cap, runa, col, hecho, total, frac: total ? hecho / total : 0 };
    }).filter((e) => e.total > 0);
  }
  const porcentaje = (es = entradas()) => (es.length ? Math.floor((es.reduce((m, e) => m + e.frac, 0) / es.length) * 100) : 0);

  // ---------- los hitos ----------
  function revisar(silencio) {
    const p = porcentaje();
    for (const h of HITOS) {
      if (p < h || st.hitos[h]) continue;
      st.hitos[h] = 1;
      if (silencio) continue;
      premio(h);
    }
    return p;
  }
  function premio(h) {
    const nivel = window.RPG ? RPG.nivel() : 1;
    if (h === 25) PODERES.darPlata(150 + 10 * nivel);
    if (h === 50) PODERES.darFragmento();
    if (h === 75 && window.BOTIN && window.OBJETOS) BOTIN.tirar(jug.x, jug.y, OBJETOS.generar({ n: nivel, min: 2, hallazgo: 2 }), true);
    if (h === 100) {
      st.leyenda = true;
      if (window.BOTIN && window.OBJETOS) BOTIN.tirar(jug.x, jug.y, OBJETOS.generar({ n: nivel, min: 3, hallazgo: 4 }), true);
    }
    HUD.aviso(t("sg.hito_" + h), "#FFD98A", t("sg.hito_t", [h]));
    if (A.columnaRunica) A.columnaRunica(jug.x, jug.y);
    if (window.SONIDO) SONIDO.tocar("mision", { vol: 0.7, tono: 1.05 });
  }

  // ---------- la pestaña ----------
  function pintar(cuerpo, api) {
    const es = entradas(),
      p = revisar(false);
    const sig = HITOS.find((h) => !st.hitos[h]);
    cuerpo.insertAdjacentHTML(
      "beforeend",
      `<div class="sg-cabeza"><div><b>${t(st.leyenda ? "sg.leyenda" : "sg.titulo")}</b><span>${t("sg.va", [p])}${sig ? " · " + t("sg.proximo", [sig, t("sg.hito_corto_" + sig)]) : ""}</span></div><i style="--p:${p}%"></i></div>`,
    );
    CAPS.forEach((cap, f) => {
      const del = es.filter((e) => e.cap === cap);
      if (!del.length) return;
      const pc = Math.floor((del.reduce((m, e) => m + e.frac, 0) / del.length) * 100);
      cuerpo.insertAdjacentHTML("beforeend", `<div class="rotulo inv-piezas">${t("sg.cap_" + cap)} · ${pc} %</div>`);
      const g = document.createElement("div");
      g.className = "inv-rejilla";
      del.forEach((e, k) => {
        const listo = e.hecho >= e.total;
        g.appendChild(
          api.celda(
            { icono: "sg_" + e.id, nombre: t("sg.e_" + e.id), col: listo ? "#FFD98A" : e.col, cant: e.hecho + "/" + e.total, html: `<span class="sg-barra"><i style="width:${Math.round(e.frac * 100)}%"></i></span><span class="sg-pista">${t(listo ? "sg.completa" : "sg.e_" + e.id + "_d")}</span>`, falta: e.hecho === 0 },
            f * 10 + Math.floor(k / 6),
            k % 6,
            listo ? "sg-lista" : "",
          ),
        );
      });
      cuerpo.appendChild(g);
    });
  }
  function icono(e) {
    return (c) => {
      DIB.P(c, [0, -30, 30, 0, 0, 30, -30, 0], "#1A1614");
      DIB.P(c, [0, -30, 0, 30, -30, 0], "#111111");
      FUTHARK.dibujar(c, e[2], 0, 18, 34, e[3], 5);
    };
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      if (!window.INVENTARIO || !INVENTARIO.pestana) return;
      ENTRADAS.forEach((e) => INVENTARIO.iconoDe("sg_" + e[0], icono(e)));
      INVENTARIO.pestana({ id: "saga", antes: "diario", nombre: () => t("sg.tab") + " " + porcentaje() + " %", pintar });
    },
    alEmpezar(extra) {
      extra.saga = Object.assign(base(), extra.saga || {});
      st = extra.saga;
      // una partida vieja que ya pasó hitos no los cobra todos juntos al cargar
      if (A && !extra.saga.visto) {
        extra.saga.visto = true;
        J.retrasar(0.5, () => revisar(true));
      }
    },
    actualizar() {
      // cada 3 s, fuera de menús: ¿se pasó un hito?
      if (J.modo === "juego" && !J.dentro && J.t % 3 < 0.02) revisar(false);
    },
    diario() {
      return `<div class="diario-resumen"><p><b>${t("sg.diario_t")}</b> ${t("sg.diario", [porcentaje()])}${st.leyenda ? " " + t("sg.leyenda") + "." : ""}</p></div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, entradas, porcentaje, revisar, ENTRADAS, HITOS, CAPS };
})();
