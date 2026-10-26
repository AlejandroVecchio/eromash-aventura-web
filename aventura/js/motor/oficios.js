// ---------- los talleres y los edificios de Eikholt por dentro (sistema OFICIOS) ----------
// La carpintería de Sten, la curtiembre de Bolli y la cordelería de Folke se entran como cualquier casa: interiores.js
// arma el cuarto con INTERIORES.CUARTOS[tipo] y la puerta es la cosa nombrada del bosque (en Eikholt se llega por su
// ancla). La hospedería y el cuartel de la Guardia solo están en la ciudad (ciudad/juego.js, entrarEdificio). De día el dueño está en lo suyo y charla (of.<quien>_N; Sten y Folke, a la tarde: a la mañana trabajan afuera); de
// noche el taller queda solo y Sten y Folke están en el Hongo Dorado. Una vez por día cada taller deja dar una mano (labrar, raspar un cuero, torcer soga) y paga.
// Muebles en mundo/assets-oficios.js, textos of. en textos/oficios.js, estado en E.extra.oficios.
window.OFICIOS = (function () {
  "use strict";
  let A, W;
  let st = { mano: {} };
  const t = (k, v) => I18N.t(k, v);
  const hora = () => (window.LUZ ? LUZ.hora(A.H.E.tiempo) : 12);
  const dia = () => Math.floor(((A.H.E.tiempo / LUZ.DIA) * 24 + 9 - 6) / 24);
  const deDia = () => hora() >= 7 && hora() < 19;
  // Sten y Folke trabajan afuera a la mañana (en el patio de la carpintería y el paseo de las sogas, ciudad/mundo.js) y
  // adentro a la tarde; Bolli está en la curtiembre todo el día
  const adentro = (quien) => (quien === "sten" || quien === "folke" ? hora() >= 12 && hora() < 19 : deDia());
  const charlas = {};
  // quien: de qué son las líneas (of.<quien>_N); habla: el nombre que se ve (si no es el mismo)
  function charla(quien, habla) {
    const k = (charlas[quien] = charlas[quien] == null ? 0 : charlas[quien] + 1);
    A.dialogoLibre([[habla || quien, "of." + quien + "_" + (k % 4)]]);
  }
  // dar una mano: una vez por día por taller, solo si el dueño está para mostrar cómo
  function mano(taller, quien, paga) {
    return () => {
      if (!adentro(quien)) return A.dialogoLibre([["eromash", "of." + taller + "_solo"]]);
      if (st.mano[taller] === dia()) return A.dialogoLibre([[quien, "of." + taller + "_hecho"]]);
      st.mano[taller] = dia();
      if (window.SONIDO) SONIDO.tocar(taller === "cordeleria" ? "tela" : "golpe", { vol: 0.3, tono: 1.2 });
      if (window.ANIMA) ANIMA.gesto("asiente");
      A.dialogoLibre([["eromash", "of." + taller + "_mano"], [quien, "of." + taller + "_paga"]], paga);
    };
  }
  const plata = (n) => () => PODERES.darPlata(n);
  const material = (id, n) => () => (window.MATERIALES ? MATERIALES.dar(id, n) : PODERES.darPlata(4));

  // ---------- los cuartos ----------
  // ay = { mueble, cama, hogar, examinar, dormir, gente }; FONDO es el pie de la pared del fondo
  function carpinteria(ay) {
    const F = INTERIORES.FONDO,
      ex = ay.examinar;
    ay.mueble("bancoCarpintero", 640, 800, { s: 1, viruta: adentro("sten") ? 9 : 4 }, 230, "of.accion_banco", mano("carpinteria", "sten", plata(6)));
    ay.mueble("quillaCaballetes", 1080, 690, { s: 1 }, 300, "of.accion_quilla", ex("of.carpinteria_quilla"));
    ay.mueble("estanteRollos", 300, F + 10, { s: 0.85, sem: 3 }, 140, "of.accion_plantillas", ex("of.carpinteria_plantillas"));
    ay.mueble("cajas", 1400, 860, { s: 0.9 }, 110, "in.accion_cajas", ex("of.carpinteria_cajas"));
    ay.hogar(820);
    if (adentro("sten")) ay.gente({ id: "sten", x: 760, y: 680, nombre: "sten", hablar: () => charla("sten") });
    return { pared: "cabana", ventana: 1250, repisa: true, insignia: true };
  }
  function curtiembre(ay) {
    const F = INTERIORES.FONDO,
      ex = ay.examinar;
    ay.mueble("tinaCurtidor", 520, 820, { s: 1 }, 140, "of.accion_tina", ex("of.curtiembre_tina"));
    ay.mueble("tinaCurtidor", 820, 870, { s: 0.85, burbujas: false }, 120, "of.accion_tina", ex("of.curtiembre_tina2"));
    ay.mueble("potroRaspar", 1150, 780, { s: 1 }, 130, "of.accion_raspar", mano("curtiembre", "bolli", material("cuero", 2)));
    ay.mueble("pielColgada", 380, F + 6, { s: 1, pal: 2 }, 70, "in.accion_piel", ex("of.curtiembre_pieles"));
    ay.mueble("pielColgada", 640, F + 6, { s: 0.9, pal: 0 }, 70, "in.accion_piel", ex("of.curtiembre_pieles"));
    ay.mueble("pielColgada", 1300, F + 6, { s: 1, pal: 1 }, 70, "in.accion_piel", ex("of.curtiembre_pieles"));
    ay.mueble("sacos", 1420, 860, { s: 1 }, 80, "of.accion_corteza", ex("of.curtiembre_corteza"));
    if (deDia()) ay.gente({ id: "trabajador3", x: 980, y: 720, nombre: "bolli", hablar: () => charla("bolli") });
    return { pared: "piedra", ventana: 980 };
  }
  function cordeleria(ay) {
    const F = INTERIORES.FONDO,
      ex = ay.examinar;
    ay.mueble("tornoCordelero", 480, 760, { s: 1, gira: adentro("folke") }, 120, "of.accion_torno", mano("cordeleria", "folke", plata(5)));
    ay.mueble("rollosSoga", 900, 850, { s: 1 }, 100, "of.accion_rollos", ex("of.cordeleria_rollos"));
    ay.mueble("rollosSoga", 1240, 760, { s: 0.9, alquitran: true }, 90, "of.accion_rollos", ex("of.cordeleria_alquitran"));
    ay.mueble("telar", 1380, F + 60, { s: 0.9 }, 120, "of.accion_hebras", ex("of.cordeleria_hebras"));
    ay.mueble("barriles", 260, 860, { s: 0.75 }, 90, "in.accion_barriles", ex("of.cordeleria_brea"));
    if (adentro("folke")) ay.gente({ id: "folke", x: 660, y: 690, nombre: "folke", hablar: () => charla("folke") });
    return { pared: "cabana", ventana: 1050 };
  }
  // ---------- la hospedería de los caminantes ----------
  // Ragnfrid atiende el mostrador a toda hora; una cama se alquila por 4 y se duerme hasta la mañana. De día para un
  // mercader; de noche, un isleño y un pescador junto a las mesas (charla of.viajero_N).
  const charlaViajero = () => charla("viajero", "ek_viajero");
  function alquilar() {
    const pj = PODERES.pj();
    if (pj.plata < 4) return A.dialogoLibre([["ragnfrid", "of.hosp_sin"]]);
    pj.plata -= 4;
    A.dialogoLibre([["ragnfrid", "of.hosp_cama"]], () => INTERIORES.dormirAqui());
  }
  function hospederia(ay) {
    const ex = ay.examinar;
    ay.mueble("mostrador", 780, 680, { s: 0.9 }, 300, "of.accion_mostrador", ex("of.hosp_mostrador"));
    ay.hogar(300);
    ay.mueble("mesaBanco", 520, 860, { s: 0.95 }, 170, "in.accion_mesa", ex("of.hosp_mesa"));
    ay.mueble("mesaBanco", 1060, 870, { s: 0.95 }, 170, "in.accion_mesa", ex("of.hosp_mesa2"));
    ay.mueble("camaPieles", 1300, 700, { s: 0.9 }, 210, "of.accion_alquilar", alquilar);
    ay.mueble("barriles", 1440, 870, { s: 0.8 }, 100, "in.accion_barriles", ex("of.hosp_barriles"));
    ay.gente({ id: "vecina2", x: 780, y: 600, nombre: "ragnfrid", hablar: () => charla("ragnfrid") });
    if (deDia()) ay.gente({ id: "hg_mercader", x: 1060, y: 770, nombre: "ek_viajero", hablar: charlaViajero });
    else {
      ay.gente({ id: "hg_isleno", x: 470, y: 770, nombre: "ek_viajero", hablar: charlaViajero });
      ay.gente({ id: "hg_pescador", x: 610, y: 780, nombre: "ek_viajero", hablar: charlaViajero });
    }
    return { pared: "taberna", ventana: 1150, estandarte: 560, insignia: true };
  }
  // ---------- el cuartel de la Guardia del Roble ----------
  // Asgeir, el sargento, cuida el armero y la mesa del mapa de las rondas; de día deja pulir las armas una vez y paga.
  // De noche los de la Guardia duermen y un recluta hace la guardia junto al fuego.
  function cuartel(ay) {
    const F = INTERIORES.FONDO,
      ex = ay.examinar,
      noche = !deDia(),
      f = (window.GENTE && GENTE.FICHAS.guardia) || {};
    ay.mueble("armero", 380, F + 20, { s: 0.9 }, 140, "of.accion_armero", mano("cuartel", "asgeir", plata(5)));
    ay.mueble("escritorioRunico", 740, 800, { s: 0.9, carta: true }, 260, "of.accion_mapa", ex("of.cuartel_mapa"));
    ay.hogar(1000);
    for (const [x, y] of [[1260, 700], [1390, 850]]) {
      if (noche) {
        ay.mueble("camaPieles", x, y, { s: 0.85, ocupada: true, pelo: f.pelo, piel: f.piel }, 200, "of.accion_dormido", ex("of.cuartel_duerme"));
      } else ay.mueble("camaPieles", x, y, { s: 0.85 }, 200, "in.accion_cama", ex("of.cuartel_cama"));
    }
    ay.mueble("cajas", 560, F + 120, { s: 0.75 }, 90, "in.accion_cajas", ex("of.cuartel_cajas"));
    if (!noche) {
      ay.gente({ id: "hr_guardia", x: 400, y: F + 230, nombre: "asgeir", hablar: () => charla("asgeir") });
      ay.gente({ id: "guardia", x: 1110, y: 880, nombre: "ek_recluta", hablar: () => charla("recluta", "ek_recluta") });
    } else ay.gente({ id: "guardia", x: 400, y: F + 230, nombre: "ek_recluta", hablar: () => charla("recluta_noche", "ek_recluta") });
    return { pared: "piedra", ventana: 760, estandarte: 1180, insignia: true };
  }
  const CUARTOS = { carpinteria, curtiembre, cordeleria, hospederia, cuartel };

  const sistema = {
    iniciar(api) {
      A = api;
      W = A.W;
      if (!window.INTERIORES) return;
      for (const k in CUARTOS) {
        INTERIORES.CUARTOS[k] = CUARTOS[k];
        const cosa = W.NOMBRADAS[k];
        if (cosa && !Array.isArray(cosa)) INTERIORES.agregarPuerta(cosa, k, { clave: "of_" + k });
      }
    },
    alEmpezar(extra) {
      extra.oficios = Object.assign({ mano: {} }, extra.oficios || {});
      st = extra.oficios;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, CUARTOS };
})();
