// ---------- la vida de Eikholt (sistema CAPITAL) ----------
// Los vecinos y los forasteros del compendio de Eikholt, cada uno en su lugar de trabajo de día y en otro de noche,
// con algo que lo distingue y sus propias líneas (pj.<id>_0..3, una distinta cada vez que se le habla). También: el
// mirador del Roble (descubre el mapa del bosque), la campana, el tablón de avisos, las doce piedras de la cúpula
// (se pueden tocar) y las runas enormes de la cúpula, que se dibujan en el cielo de la ciudad.
window.CAPITAL = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);

  Object.assign(GENTE.FICHAS, {
    // Bergljot, portavoz de la Asamblea: mayor, manto verde, el bastón de roble con muescas (lanza sin punta)
    bergljot: { nombre: "bergljot", alto: 1.02, ancho: 0.98, piel: "#D8B49A", pielSombra: "#B8947A", pelo: "#B8B4AC", ropa: "#5E4A36", ropaSombra: "#46362A", capa: "#3E5A34", capaSombra: "#2C4226", falda: true, pantalon: "#46362A", botas: "#2A2018", cinto: "#7A5634", rodete: true },
    // Håkon, capitán de la Guardia del Roble: casco, capa verde oscuro con la cornamenta, lanza
    hakon: { nombre: "hakon", alto: 1.08, ancho: 1.15, piel: "#C8987A", pielSombra: "#A87A5E", pelo: "#8A6A3A", barba: "#8A6A3A", barbaCana: "#C8B8A8", ropa: "#5A5E5A", ropaSombra: "#464A46", capa: "#2C4226", capaSombra: "#1E3018", pantalon: "#3A3228", botas: "#241C16", cinto: "#3A2A1A", gorro: "#6E6A6E", lanza: true, insignia: true },
    // Tyra, hija de Ulf, mensajera: chica, trenza rubia, descalza y apurada
    tyra: { nombre: "tyra", alto: 0.86, ancho: 0.86, piel: "#E0B898", pielSombra: "#C0987A", pelo: "#D8B060", ropa: "#7A3A2A", ropaSombra: "#5E2C20", falda: true, pantalon: "#5E4430", botas: "#C0987A", cinto: "#E0D4C0", trenza: true },
    // Folke, cordelero: barba gris, delantal de cuero, soga en las manos
    folke: { nombre: "folke", alto: 0.98, ancho: 1.05, piel: "#D0A080", pielSombra: "#AE8064", pelo: "#9A9890", barba: "#A8A69E", ropa: "#6E6A54", ropaSombra: "#56523E", delantal: "#7A5030", delantalSombra: "#5E3C22", pantalon: "#45392E", botas: "#2E241C", cinto: "#C8B48C", calvo: true },
    // Ragna, cultivadora de hongos: pañuelo dorado, delantal de tierra
    ragna: { nombre: "ragna", alto: 0.96, ancho: 1, piel: "#C89A7A", pielSombra: "#A87C60", pelo: "#3A2A1E", ropa: "#4E5C32", ropaSombra: "#3A4424", delantal: "#5E4A36", delantalSombra: "#46362A", falda: true, pantalon: "#3A3026", botas: "#2A2018", cinto: "#E8B04A", gorro: "#E8B04A" },
    // Gudrun, la anciana del pozo: chica, pelo blanco en rodete, chal gris
    gudrun: { nombre: "gudrun", alto: 0.88, ancho: 0.95, piel: "#E0C4AC", pielSombra: "#C0A48C", pelo: "#F2ECEC", ropa: "#7A7470", ropaSombra: "#5E5854", capa: "#9A948C", capaSombra: "#7A746C", falda: true, pantalon: "#5E5854", botas: "#3A3430", cinto: "#5E4A36", rodete: true },
    // Eirik, el chico de la plaza
    eirik: { nombre: "eirik", alto: 0.72, ancho: 0.82, piel: "#E0B898", pielSombra: "#C0987A", pelo: "#C88A3A", ropa: "#3E4E66", ropaSombra: "#2C384C", pantalon: "#5E4430", botas: "#3A2A1A", cinto: "#7A5634" },
    // Sølve, skald del Hongo Dorado: capa roja de viaje, barba trenzada
    solve: { nombre: "solve", alto: 1.04, ancho: 0.96, piel: "#D8B49A", pielSombra: "#B8947A", pelo: "#5A3A2A", barba: "#5A3A2A", ropa: "#C8C0B0", ropaSombra: "#A8A090", capa: "#9C2315", capaSombra: "#5E130D", pantalon: "#46362A", botas: "#2A2018", cinto: "#8A6A2A", trenza: true },
    // Sigrun, la mujer de Bror: remienda al lado de la cama
    sigrun: { nombre: "sigrun", alto: 0.98, ancho: 0.98, piel: "#D4A88A", pielSombra: "#B2886C", pelo: "#8A5A3A", ropa: "#5A6A4A", ropaSombra: "#46523A", falda: true, pantalon: "#40362C", botas: "#2A2018", cinto: "#C8B48C", rodete: true },
    // Sten, carpintero de ribera de Havnskar: grandote, barba roja, hacha
    sten: { nombre: "sten", alto: 1.1, ancho: 1.35, piel: "#E0AC8A", pielSombra: "#C08C6C", pelo: "#B4542A", barba: "#B4542A", ropa: "#3E4E66", ropaSombra: "#2C384C", pantalon: "#5E4A36", botas: "#2A2018", cinto: "#C8B48C", gorro: "#C8C0B0", hacha: true },
    // Grim, minero de Jarnskald: callado, gris de polvo de roca
    grim: { nombre: "grim", alto: 0.96, ancho: 1.12, piel: "#B8A090", pielSombra: "#988070", pelo: "#5E5A56", barba: "#7A7670", ropa: "#5E5A56", ropaSombra: "#46423E", pantalon: "#3A3632", botas: "#241C16", cinto: "#3A2A1A", gorro: "#46423E" },
    // Torvald, escriba de Hrimvard: friolento (capa gruesa al sol), lentes
    torvald: { nombre: "torvald", alto: 1.04, ancho: 0.9, piel: "#E8D4C4", pielSombra: "#C8B4A4", pelo: "#C8CCD2", ropa: "#56667A", ropaSombra: "#425062", capa: "#A8B4C0", capaSombra: "#8894A0", pantalon: "#46526A", botas: "#2A2A30", cinto: "#2E3848", lentes: true, tinta: true },
    // Kolbrun, buhonera de Eldrakar: pañuelo rojo, trenza negra, amuletos
    kolbrun: { nombre: "kolbrun", alto: 0.96, ancho: 1.02, piel: "#C8987A", pielSombra: "#A87A5E", pelo: "#1E1814", ropa: "#5E2C20", ropaSombra: "#4A2018", falda: true, pantalon: "#3A2A1E", botas: "#241C16", cinto: "#FF8D71", gorro: "#9C2315", trenza: true },
    // Ivar, emisario del rey de Hrafngard: bien vestido, capa roja de corte
    ivar: { nombre: "ivar", alto: 1.04, ancho: 0.98, piel: "#E0C0A8", pielSombra: "#C0A088", pelo: "#2A1E18", barba: "#2A1E18", ropa: "#2A2A30", ropaSombra: "#1E1E22", capa: "#9C2315", capaSombra: "#5E130D", pantalon: "#2A2A30", botas: "#1A1410", cinto: "#FFD98A" },
    // la gente del Puesto de Eydis
    // Halvard, guardasendas retirado de setenta años: cuida el farol, la huerta y el fuego
    halvard: { nombre: "halvard", alto: 0.96, ancho: 1.04, piel: "#D8B49A", pielSombra: "#B8947A", pelo: "#E8E4DC", barba: "#E8E4DC", ropa: "#5E4A36", ropaSombra: "#46362A", capa: "#3E5A34", capaSombra: "#2C4226", pantalon: "#3A3026", botas: "#2A2018", cinto: "#7A5634", calvo: true },
    // Tove, aprendiz de guardasendas de dieciséis años: capa corta verde, trenza, lanza
    tove: { nombre: "tove", alto: 0.92, ancho: 0.88, piel: "#E0B898", pielSombra: "#C0987A", pelo: "#8A4A2A", ropa: "#5E4A36", ropaSombra: "#46362A", capa: "#4E6A3E", capaSombra: "#3A5230", pantalon: "#3A3026", botas: "#2A2018", cinto: "#7A5634", trenza: true, lanza: true },
    // Ingrid, comerciante de Hrafngard: pañuelo, delantal de cuentas
    ingrid: { nombre: "ingrid", alto: 1, ancho: 1.06, piel: "#E0C0A8", pielSombra: "#C0A088", pelo: "#C8A050", ropa: "#7A2A1E", ropaSombra: "#5E1E14", delantal: "#C8B48C", delantalSombra: "#A8946C", falda: true, pantalon: "#3A2A1E", botas: "#2A2018", cinto: "#5E4430", gorro: "#E6DCC8" },
    // Arvid, su hijo de siete años
    arvid: { nombre: "arvid", alto: 0.66, ancho: 0.8, piel: "#E0C0A8", pielSombra: "#C0A088", pelo: "#D8B060", ropa: "#3E5A34", ropaSombra: "#2C4226", pantalon: "#5E4430", botas: "#3A2A1A", cinto: "#7A5634" },
    // Ketil, soldado de Hrafngard: casco, capa roja del rey, lanza
    ketil: { nombre: "ketil", alto: 1.06, ancho: 1.12, piel: "#C8987A", pielSombra: "#A87A5E", pelo: "#3A2A1E", barba: "#3A2A1E", ropa: "#6E6A64", ropaSombra: "#56524E", capa: "#9C2315", capaSombra: "#5E130D", pantalon: "#3A3228", botas: "#241C16", cinto: "#3A2A1A", gorro: "#4A4448", lanza: true },
    // Maren, viajera de Skeldra: tatuajes de estrellas (mecha azul en la trenza), ropa de isleña
    maren: { nombre: "maren", alto: 0.98, ancho: 0.92, piel: "#C09070", pielSombra: "#A07456", pelo: "#1E2A3A", mecha: "#4A78D0", ropa: "#4A6A7A", ropaSombra: "#3A5462", pantalon: "#3A4A56", botas: "#2A2A30", cinto: "#C8C0B0", trenza: true },
  });

  // dónde está cada uno: [nombrada o punto de la ciudad, dx, dy] de día y de noche (en unidades del mundo)
  const LUGAR = {
    bergljot: [["ting", 120, 60], ["ting", -90, 40]],
    hakon: [["guardia", 40, 120], ["puerta_norte", 160, 110]],
    tyra: [["plaza", -200, 120], ["hongo_dorado", -140, 90]],
    folke: [["cordeleria", 90, 50], ["hongo_dorado", 60, 110]],
    ragna: [["camas_hongos", 0, 50], ["camas_hongos", -40, 60]],
    gudrun: [["pozo", -70, 40], ["pozo", 60, 40]],
    eirik: [["mirador", 40, 160], ["plaza", 120, 40]],
    solve: [["hongo_dorado", 160, 80], ["hongo_dorado", -40, 90]],
    sigrun: [["sanacion", 120, 70], ["sanacion", 60, 80]],
    sten: [["carpinteria", 60, 70], ["hongo_dorado", 180, 120]],
    grim: [["carreta_grim", 0, 40], ["carreta_grim", -60, 30]],
    torvald: [["losa", -120, 20], ["hongo_dorado", -180, 120]],
    kolbrun: [["plaza", 300, -60], ["hongo_dorado", 120, 140]],
    ivar: [["ting", 230, 40], ["hongo_dorado", 220, 70]],
    maren: [["roble", -260, 150], ["roble", -220, 170]],
    halvard: [["halvard", 0, 0], ["fogon", 90, 30]],
    tove: [["tove", 0, 0], ["fogon", -100, 40]],
    ingrid: [["ingrid", 0, 0], ["mostrador", 40, 60]],
    arvid: [["arvid", 0, 0], ["fogon", 140, 50]],
    ketil: [["ketil", 0, 0], ["porton_sur", -60, -40]],
  };
  // los que cambian de lugar con la historia: Sigrun espera en el Puesto hasta que la cuadrilla llega a salvo;
  // Ingrid, Arvid y Ketil se van cuando se reabre el Paso
  const MOMENTO = {
    sigrun: (H) => (H.completa("EL-02") ? null : { lugar: [["sigrun_puesto", 0, 0], ["sigrun_puesto", 0, 0]], pre: "sigrun_p" }),
    ingrid: (H) => (H.completa("EL-06") ? { fuera: true } : null),
    arvid: (H) => (H.completa("EL-06") ? { fuera: true } : null),
    ketil: (H) => (H.completa("EL-06") ? { fuera: true } : null),
  };
  const gente = [];
  const habladas = {};
  const donde = (k) => (W.NOMBRADAS[k] && !Array.isArray(W.NOMBRADAS[k]) ? [W.NOMBRADAS[k].x, W.NOMBRADAS[k].y] : W.PUNTOS[k]);
  function ubicar() {
    const noche = A.noche() > 0.5;
    for (const n of gente) {
      const mo = MOMENTO[n.id] && MOMENTO[n.id](A.H);
      n.fuera = !!(mo && mo.fuera);
      n.pre = (mo && mo.pre) || n.id + "_";
      const [k, dx, dy] = ((mo && mo.lugar) || LUGAR[n.id])[noche ? 1 : 0],
        p = donde(k);
      if (!p) continue;
      n.x = p[0] + dx;
      n.y = p[1] + dy;
    }
    const N = W.NOMBRADAS;
    if (N.tablillas) N.tablillas.o.oscuras = A.H.completa("EL-02") ? 0 : 5;
  }
  function hablar(n) {
    n.mira = VIKINGO.vista(jug.x - n.x, jug.y - n.y, n.mira);
    const k = (habladas[n.id] = (habladas[n.id] || 0) + 1) - 1;
    A.dialogoLibre([[n.id, "pj." + n.pre + (k % 4)]]);
  }
  function mirador() {
    if (window.MAPA) MAPA.descubrir(W.CIUDAD.c[0], W.CIUDAD.c[1] - 2000, 14000);
    A.dialogoLibre([["eromash", "cap.mirador"]]);
  }
  let nocheAntes = null,
    misionAntes = null;
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      for (const id in LUGAR) gente.push({ id, x: 0, y: 0, mira: { vista: "S", espejo: false } });
    },
    alEmpezar() {
      nocheAntes = null;
      misionAntes = null;
    },
    actualizar() {
      const noche = A.noche() > 0.5,
        mis = A.H.idMision();
      if (noche !== nocheAntes || mis !== misionAntes) {
        nocheAntes = noche;
        misionAntes = mis;
        ubicar();
      }
      // Grima se incorpora cuando alguien se acerca
      const g = W.NOMBRADAS.grima;
      if (g) g.o.despierta = Math.hypot(g.x - jug.x, g.y - jug.y) < 260;
    },
    cercanos(dar) {
      for (const n of gente) {
        if (n.fuera) continue;
        const d = Math.hypot(n.x - jug.x, n.y - jug.y);
        if (d < 110) dar(d, t("av.accion_hablar") + " · " + t("av.nombre_" + n.id), () => hablar(n));
      }
      const N = W.NOMBRADAS,
        cerca = (o, r, dy) => o && Math.hypot(o.x - jug.x, o.y + (dy || 0) - jug.y) < r;
      const mir = W.PUNTOS.mirador;
      if (mir && Math.hypot(mir[0] - jug.x, mir[1] - jug.y) < 120) dar(60, t("cap.accion_mirador"), mirador);
      if (cerca(N.campana, 120, 40)) dar(80, t("cap.accion_campana"), () => A.dialogoLibre([["eromash", "cap.campana"]]));
      if (cerca(N.tablon_avisos, 130, 40)) dar(80, t("cap.accion_tablon"), () => A.dialogoLibre([["eromash", "cap.tablon"]]));
      if (cerca(N.grima, 110)) dar(70, t("cap.accion_grima"), () => A.dialogoLibre([["eromash", "cap.grima"]]));
      if (cerca(N.piedra_violeta, 140, 30)) dar(90, t("cap.accion_violeta"), () => A.dialogoLibre([["eromash", "cap.violeta"]]));
      if (cerca(N.tablillas, 130, 40)) dar(85, t("cap.accion_tablillas"), () => A.dialogoLibre([["eromash", A.H.completa("EL-02") ? "cap.tablillas_claras" : "cap.tablillas"]]));
      for (const p of N.anclas || []) if (cerca(p, 120, 40)) dar(90, t("cap.accion_piedra"), () => A.dialogoLibre([["eromash", p.o.fuerza > 0 ? "cap.piedra" : "cap.piedra_rota"]]));
    },
    cuerpos(f) {
      for (const n of gente) if (!n.fuera) f(n.x, n.y, 36);
    },
    objetos(lista, visible, c) {
      for (const n of gente) {
        if (n.fuera || !visible(n.x, n.y)) continue;
        if (Math.hypot(jug.x - n.x, jug.y - n.y) < 260) n.mira = VIKINGO.vista(jug.x - n.x, jug.y - n.y, n.mira);
        lista.push({ x: n.x, y: n.y, f: () => GENTE.dibujar(c, n.id, n.x, n.y, J.t, { vista: n.mira.vista, espejo: n.mira.espejo }) });
      }
      // las runas de la cúpula, en el cielo: encima de todo lo de la ciudad
      for (const r of W.NOMBRADAS.runasCupula || []) {
        if (!visible(r.x, r.y - r.alto)) continue;
        lista.push({ x: r.x, pie: r.y - r.alto, y: 1e9, f: () => ASSETS.dibujar(c, "runaCupula", r.x, r.y - r.alto, J.t, r) });
      }
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { gente };
})();
