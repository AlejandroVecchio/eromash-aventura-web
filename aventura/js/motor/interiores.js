// ---------- los interiores (sistema INTERIORES) ----------
// Las casas de Eikholt, la Casa de las Lindes, la herrería de Ása, la Casa de Sanación y el Hongo Dorado se pueden
// entrar. Adentro la cámara se acerca: el cuarto se ve de frente como un escenario (la pared de tablas atrás, el piso
// en perspectiva) y Eromash se ve grande, como en la imagen del mago que escribe las notas del parche. El bosque
// queda en pausa mientras estás adentro.
// Cada cuarto tiene muebles con algo para hacer: dormir en la cama, calentarse en el hogar, abrir el arcón, leer lo
// que hay en el escritorio, pedir hidromiel en el mostrador, y la gente de Eikholt que atiende adentro.
window.INTERIORES = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const RW = 1600,
    RH = 900,
    FONDO = 600, // donde la pared toca el piso
    VEL = 340;
  let st = null,
    dentro = null; // { tipo, edificio, ix, iy, muebles, gente, fundido, saliendo, luzCv }
  const puertas = []; // { cosa, tipo, clave }

  const TIPO_DE = { casaEikholt: "casa", casaLindes: "lindes", herreriaAsa: "herreria", casaSanacion: "sanacion", hongoDorado: "taberna" };
  // cuartos que arman otros sistemas (la casa propia de casa.js): CUARTOS[tipo](ayuda, edificio, clave) → { pared, ventana, estandarte, repisa }
  const CUARTOS = {};
  // ---------- cómo es cada cuarto ----------
  // muebles: { id, x, y, o, r (medio ancho que choca), accion: clave de texto, fn }
  function armarCuarto(tipo, edificio, clave, editor) {
    const m = [],
      g = [];
    const sem = edificio.o.sem || 0,
      v = edificio.o.v != null ? edificio.o.v : Math.floor(sem * 3) % 3;
    const mueble = (id, x, y, o, r, accion, fn) => m.push({ id, x, y, o: Object.assign({ s: 1 }, o), r, accion, fn });
    const arcon = (x, y) => mueble("arconCasa", x, y, { abierto: !!st.cofres[clave] }, 90, "in.accion_arcon", (q) => abrirArcon(q, clave));
    const cama = (x, y, s) => mueble("camaPieles", x, y, { s: s || 1 }, 210, "in.accion_cama", dormir);
    const hogar = (x) => mueble("hogarPiedra", x, FONDO + 30, { s: 0.85 }, 150, "in.accion_hogar", calentarse);
    const examinar = (clave2) => () => A.dialogoLibre([["eromash", clave2]]);
    // la tabla suelta de la pared con un nicho detrás
    const tabla = (x) => {
      const k = clave + "_tabla";
      mueble("tablaSuelta", x, FONDO + 10, { abierta: !!st.cofres[k], brillo: !st.cofres[k] }, 60, "in.accion_tabla", (q) => abrirNicho(q, k));
    };
    let pared = "cabana",
      ventana = 1150,
      estandarte = null,
      repisa = false;
    if (tipo === "lindes") {
      // el estudio de Svanhild: el escritorio rúnico en el medio, como la mesa del mago
      mueble("escritorioRunico", 800, 800, { s: 1.1, carta: true }, 330, "in.accion_escritorio", examinar("in.lindes_escritorio"));
      hogar(330);
      arcon(1340, 760);
      estandarte = 560;
      repisa = true;
      ventana = 1130;
    } else if (tipo === "herreria") {
      pared = "piedra";
      mueble("forjaAsa", 760, FONDO + 40, { s: 1 }, 170, "in.accion_forja", window.FORJA ? () => FORJA.abrir() : examinar("in.herreria_forja"));
      mueble("yunque", 560, 790, { s: 1.1 }, 80, "in.accion_yunque", examinar("in.herreria_yunque"));
      mueble("barriles", 1300, 720, { s: 0.9 }, 110, "in.accion_barriles", examinar("in.herreria_barriles"));
      g.push({ id: "asa", x: 980, y: 760 });
      ventana = 1250;
    } else if (tipo === "sanacion") {
      pared = "clara";
      mueble("estanteHierbas", 420, FONDO + 20, { s: 1 }, 200, "in.accion_hierbas", examinar("in.sanacion_hierbas"));
      cama(1050, 700, 0.9);
      cama(1180, 840, 0.9);
      hogar(760);
      g.push({ id: "thora", x: 640, y: 780 });
      ventana = 1300;
    } else if (tipo === "taberna") {
      pared = "taberna";
      mueble("mostrador", 800, 680, { s: 1 }, 320, "in.accion_mostrador", hidromiel);
      mueble("barriles", 1370, 700, { s: 0.85 }, 110, "in.accion_barriles", examinar("in.taberna_barriles"));
      mueble("mesaBanco", 470, 830, { s: 0.95 }, 170, "in.accion_mesa", examinar("in.taberna_mesa"));
      mueble("mesaBanco", 1120, 850, { s: 0.95 }, 170, "in.accion_mesa", examinar("in.taberna_mesa2"));
      hogar(260);
      g.push({ id: "ulf", x: 640, y: 650 });
      estandarte = 990;
      ventana = 560;
    } else if (CUARTOS[tipo]) {
      const r = CUARTOS[tipo]({ mueble, cama, hogar, examinar, dormir }, edificio, clave) || {};
      if (r.pared) pared = r.pared;
      if (r.ventana != null) ventana = r.ventana;
      if (r.estandarte != null) estandarte = r.estandarte;
      if (r.repisa != null) repisa = r.repisa;
    } else {
      // las casas de la gente: cinco maneras de vivir, y no todas tienen arcón
      const conArcon = editor || Math.floor(sem * 7) % 3 === 0,
        vi = v % 5;
      if (vi === 0) {
        hogar(360);
        cama(1170, 760);
        mueble("mesaBanco", 720, 820, {}, 170, "in.accion_mesa", examinar("in.casa_mesa"));
        if (conArcon) arcon(1380, 860);
      } else if (vi === 1) {
        mueble("telar", 380, FONDO + 60, {}, 120, "in.accion_telar", examinar("in.casa_telar"));
        hogar(800);
        mueble("mesaBanco", 1080, 820, {}, 170, "in.accion_mesa", examinar("in.casa_mesa2"));
        mueble("barriles", 1380, 700, { s: 0.75 }, 90, "in.accion_barriles", examinar("in.casa_barriles"));
        if (conArcon) arcon(560, 850);
        tabla(1160);
        ventana = 1250;
      } else if (vi === 2) {
        mueble("escritorioRunico", 560, 790, { s: 0.85 }, 260, "in.accion_escritorio", examinar("in.casa_escritorio"));
        cama(1160, 760);
        repisa = true;
        if (conArcon) arcon(1380, 860);
      } else if (vi === 3) {
        // la casa del cazador: el armero contra la pared y pieles por todos lados
        mueble("armero", 420, FONDO + 20, { s: 0.9 }, 140, "in.accion_armero", examinar("in.casa_armero"));
        hogar(1000);
        cama(1260, 800, 0.9);
        mueble("mesaBanco", 700, 830, {}, 170, "in.accion_mesa", examinar("in.casa_mesa3"));
        if (conArcon) arcon(1400, 680);
        ventana = 700;
      } else {
        // la casa del escriba: rollos, el atril y la vela que no se apaga
        mueble("estanteRollos", 420, FONDO + 10, { s: 0.9, sem }, 140, "in.accion_rollos", examinar("in.casa_rollos"));
        mueble("atril", 760, 770, { s: 1, leido: true }, 70, "in.accion_atril", examinar("in.casa_atril"));
        cama(1200, 790, 0.9);
        tabla(640);
        if (conArcon) arcon(1400, 690);
        ventana = 1050;
        repisa = true;
      }
    }
    // la trampilla del sótano: a la vista en los cuartos grandes, debajo de la alfombra en algunas casas
    const lugarTrampilla = { lindes: [1120, 690], herreria: [1180, 850], sanacion: [770, 830], taberna: [800, 855] };
    const LT = [[480, 735], [620, 725], [900, 690], [760, 700], [960, 860]];
    const rs = DIB.azar(Math.round(sem * 1000) + 77);
    const conSotano = !CUARTOS[tipo] && (editor || tipo !== "casa" || rs() < 0.7);
    if (conSotano) {
      const [tx, ty] = lugarTrampilla[tipo] || LT[v % 5];
      const escondida = !editor && tipo === "casa" && rs() < 0.5;
      const tr = { id: "trampilla", x: tx, y: ty, o: { s: 1, abierta: !!st.cofres[clave + "_tr"] }, r: 100, piso: true, accion: "in.accion_trampilla" };
      tr.fn = (q) => {
        if (!q.o.abierta) {
          q.o.abierta = true;
          st.cofres[clave + "_tr"] = true;
          return;
        }
        bajar(q);
      };
      tr.texto = (q) => (q.o.abierta ? "in.accion_bajar" : "in.accion_trampilla");
      m.push(tr);
      if (escondida && !st.cofres[clave + "_alf"]) {
        const al = { id: "alfombra", x: tx, y: ty + 8, o: { s: 0.62, pista: true }, r: 130, piso: true, accion: "in.accion_alfombra" };
        al.fn = (q) => {
          q.o.movida = true;
          q.o.s = 0.5;
          q.x = tr.x - 190;
          st.cofres[clave + "_alf"] = true;
          tr.tapada = null;
          HUD.aviso(t("in.alfombra_trampilla"), "#E0B2B2");
        };
        tr.tapada = al;
        m.push(al);
      } else if (escondida) m.push({ id: "alfombra", x: tx - 190, y: ty + 8, o: { s: 0.5, movida: true }, r: 0, piso: true, quieto: true });
    }
    const res = { muebles: m, gente: g.map((q) => Object.assign({ mira: { vista: "S", espejo: false } }, q)), pared, ventana, estandarte, repisa };
    return aplicarCambios(res, tipo === "casa" ? "casa_" + (v % 5) : tipo, clave);
  }

  // ---------- lo cambiado con el editor (pestaña Interiores) ----------
  // AGREGADOS.cuartos[plantilla] = { pared, ventana, estandarte, repisa, cambios: { "id#n": { x, y, s, esp, quitar } },
  // poner: [{ id, x, y, o, r }] }. "id#n" es el n-ésimo mueble con ese id tal como lo arma el código (así una casa sin
  // arcón no corre a los demás) y "gente:id" la gente que atiende. Lo puesto con el editor hace lo de su clase: la cama
  // deja dormir, el hogar calienta, el arcón y el cofre se abren una vez.
  const PLANTILLAS = ["casa_0", "casa_1", "casa_2", "casa_3", "casa_4", "lindes", "herreria", "sanacion", "taberna", "sot_bodega", "sot_archivo", "sot_carbonera", "sot_despensa", "sot_escondite", "sot_viejo"];
  const PAREDES = ["cabana", "taberna", "clara", "piedra"];
  // la plantilla de un edificio del mundo (para abrirla desde el editor)
  // con x, y: si la casa tiene un plano de varios cuartos, su primer cuarto
  function plantillaDe(id, o, x, y) {
    if (x !== undefined) {
      const pid = planoDe(id, o, x, y);
      if (pid) return "plano:" + pid + ":0";
    }
    const tipo = id === "casaNordica" ? o && o.entra && "casa" : TIPO_DE[id];
    if (!tipo) return null;
    if (tipo !== "casa") return tipo;
    const v = o.v != null ? o.v : Math.floor((o.sem || 0) * 3) % 3;
    return "casa_" + (v % 5);
  }
  const claveMueble = (lista) => {
    const n = {};
    return lista.map((q) => {
      n[q.id] = (n[q.id] || 0) + 1;
      return q.id + "#" + (n[q.id] - 1);
    });
  };
  function accionDe(q, clave, i) {
    const k = clave + "_p" + i;
    if (q.id === "camaPieles") return ["in.accion_cama", dormir];
    if (q.id === "hogarPiedra") return ["in.accion_hogar", calentarse];
    if (q.id === "mostrador") return ["in.accion_mostrador", hidromiel];
    if (q.id === "arconCasa") return (q.o.abierto = !!(st && st.cofres[k])), ["in.accion_arcon", (x) => abrirArcon(x, k)];
    if (q.id === "cofreSotano") return (q.o.abierto = !!(st && st.cofres[k])), ["in.accion_cofre", (x) => abrirCofre(x, k, false)];
    return [null, null];
  }
  function aplicarCambios(res, plantilla, clave) {
    const todo = fuente || (window.AGREGADOS && AGREGADOS.cuartos),
      cf = saltar === plantilla ? null : todo && todo[plantilla];
    res.plantilla = plantilla;
    const claves = claveMueble(res.muebles);
    res.muebles.forEach((q, i) => (q.clave = claves[i]));
    if (!cf) return res;
    ["pared", "ventana", "estandarte", "repisa"].forEach((k) => cf[k] !== undefined && (res[k] = cf[k]));
    const ch = cf.cambios || {};
    let dt = null;
    res.muebles.forEach((q) => {
      const c = ch[q.clave];
      if (!c) return;
      if (q.id === "trampilla" && c.x !== undefined) dt = [c.x - q.x, (c.y !== undefined ? c.y : q.y) - q.y];
      if (c.x !== undefined) q.x = c.x;
      if (c.y !== undefined) q.y = c.y;
      if (c.s !== undefined) q.o.s = c.s;
      if (c.esp !== undefined) q.o.esp = c.esp;
    });
    // la alfombra que tapa la trampilla la sigue si no se movió por su cuenta
    if (dt) res.muebles.forEach((q) => q.id === "alfombra" && !ch[q.clave] && ((q.x += dt[0]), (q.y += dt[1])));
    res.muebles = res.muebles.filter((q) => !(ch[q.clave] && ch[q.clave].quitar));
    res.gente.forEach((n) => {
      const c = ch["gente:" + n.id];
      if (c && c.x !== undefined) (n.x = c.x), (n.y = c.y);
    });
    res.gente = res.gente.filter((n) => !(ch["gente:" + n.id] && ch["gente:" + n.id].quitar));
    (cf.poner || []).forEach((a, i) => {
      if (!ASSETS.LISTA[a.id]) return;
      const q = { id: a.id, x: a.x, y: a.y, o: Object.assign({ s: 1 }, a.o), r: a.r || 90, clave: "+" + i, puesto: true };
      if (ASSETS.LISTA[a.id].piso) q.piso = true;
      const [accion, fn] = accionDe(q, clave, i);
      if (fn) (q.accion = accion), (q.fn = fn);
      res.muebles.push(q);
    });
    return res;
  }

  // ---------- los sótanos ----------
  // Debajo de la trampilla: piedra húmeda, vigas bajas, la escalera de mano que sube a la luz de la casa y lo que la
  // gente guarda (o esconde). Cada sótano tiene su cofre; algunos, un atril con un libro de saber, una tabla suelta o
  // los huesos de alguien que bajó y no volvió.
  const CLASE_SOTANO = { taberna: "bodega", lindes: "archivo", herreria: "carbonera", sanacion: "despensa" };
  function armarSotano(tipo, edificio, clave, forzada) {
    const m = [];
    const sem = edificio.o.sem || 0;
    const clase = forzada || CLASE_SOTANO[tipo] || ["despensa", "escondite", "viejo"][Math.floor(DIB.azar(Math.round(sem * 1000) + 191)() * 3)];
    const mueble = (id, x, y, o, r, accion, fn) => m.push({ id, x, y, o: Object.assign({ s: 1 }, o), r, accion, fn });
    const examinar = (k) => () => A.dialogoLibre([["eromash", k]]);
    const kc = clave + "_cofre";
    mueble("escaleraMano", 300, FONDO + 8, { s: 1 }, 80, "in.accion_subir", subir);
    const cofre = (x, y, rico) => mueble("cofreSotano", x, y, { abierto: !!st.cofres[kc] }, 110, "in.accion_cofre", (q) => abrirCofre(q, kc, rico));
    const atril = (x, y, libro) => {
      const k = clave + "_libro";
      mueble("atril", x, y, { leido: !!st.cofres[k] }, 70, "in.accion_atril", (q) => leerLibro(q, k, libro));
    };
    const tabla = (x) => {
      const k = clave + "_tabla_s";
      mueble("tablaSuelta", x, FONDO + 10, { abierta: !!st.cofres[k], brillo: !st.cofres[k] }, 60, "in.accion_tabla", (q) => abrirNicho(q, k));
    };
    if (clase === "bodega") {
      mueble("barriles", 620, FONDO + 40, { s: 0.95 }, 120, "in.accion_barriles", examinar("in.sot_bodega_barriles"));
      mueble("barriles", 860, FONDO + 50, { s: 0.85 }, 110, "in.accion_barriles", examinar("in.sot_bodega_barriles2"));
      mueble("cajas", 520, 830, { s: 1, vela: true }, 110, "in.accion_cajas", examinar("in.sot_bodega_cajas"));
      cofre(1380, 840, false);
      // al fondo, la puerta de piedra del sótano viejo con sus doce huecos (goinn.js)
      if (window.GOINN) mueble("puertaPiedra", 1180, FONDO + 20, { s: 0.85, luces: GOINN.trofeos(), abierta: GOINN.abierta() }, 100, "in.accion_puerta_piedra", () => GOINN.puerta());
    } else if (clase === "archivo") {
      mueble("estanteRollos", 640, FONDO + 10, { s: 1, sem: 0.3 }, 150, "in.accion_rollos", examinar("in.sot_archivo_rollos"));
      mueble("estanteRollos", 960, FONDO + 10, { s: 1, sem: 0.7 }, 150, "in.accion_rollos", examinar("in.sot_archivo_rollos2"));
      atril(820, 790, "in.libro_lindes");
      cofre(1360, 820, true);
    } else if (clase === "carbonera") {
      mueble("armero", 700, FONDO + 20, { s: 1 }, 150, "in.accion_armero", examinar("in.sot_carbonera_armero"));
      mueble("cajas", 1060, 760, { s: 1.05, vela: true }, 110, "in.accion_cajas", examinar("in.sot_carbonera_cajas"));
      mueble("barriles", 1350, FONDO + 40, { s: 0.8 }, 100, "in.accion_barriles", examinar("in.sot_carbonera_barriles"));
      cofre(560, 840, false);
    } else if (clase === "despensa") {
      mueble("barriles", 640, FONDO + 40, { s: 0.85 }, 110, "in.accion_barriles", examinar("in.sot_despensa_barriles"));
      mueble("cesto", 1080, 800, { s: 1, sem: sem + 1 }, 90, "in.accion_cesto", examinar("in.sot_despensa_cesto"));
      mueble("cesto", 520, 860, { s: 0.9, sem: sem + 2 }, 90, "in.accion_cesto", examinar("in.sot_despensa_cesto"));
      mueble(tipo === "sanacion" ? "estanteHierbas" : "estanteRollos", 980, FONDO + 15, { s: 0.9, sem }, 150, tipo === "sanacion" ? "in.accion_hierbas" : "in.accion_estante", examinar(tipo === "sanacion" ? "in.sot_despensa_hierbas" : "in.sot_despensa_estante"));
      mueble("cajas", 760, 820, { s: 0.95, vela: true }, 110, "in.accion_cajas", examinar("in.sot_despensa_cajas"));
      cofre(1330, 830, false);
    } else if (clase === "escondite") {
      mueble("muroFalso", 1180, FONDO + 6, { s: 1 }, 130, "in.accion_tunel", examinar("in.sot_tunel"));
      mueble("huesos", 620, FONDO + 30, { s: 0.9 }, 110, "in.accion_huesos", examinar("in.sot_huesos"));
      mueble("sacos", 1440, 760, { s: 1 }, 80, "in.accion_sacos", examinar("in.sot_sacos"));
      atril(720, 780, "in.libro_escondite");
      tabla(940);
      cofre(1360, 850, true);
    } else {
      mueble("armero", 760, FONDO + 20, { s: 0.9 }, 140, "in.accion_armero", examinar("in.sot_viejo_armero"));
      mueble("cantaros", 1180, FONDO + 30, { s: 1 }, 90, "in.accion_cantaros", examinar("in.sot_viejo_cantaros"));
      mueble("cajas", 560, 820, { s: 0.9, vela: true }, 100, "in.accion_cajas", examinar("in.sot_viejo_cajas"));
      mueble("barriles", 1100, FONDO + 40, { s: 0.75 }, 90, "in.accion_barriles", examinar("in.sot_viejo_barriles"));
      cofre(1360, 830, false);
    }
    return aplicarCambios({ muebles: m, gente: [], pared: "sotano", ventana: 0, estandarte: null, repisa: false, sotano: clase }, "sot_" + clase, clave);
  }
  // ---------- las casas de varios cuartos (planos) ----------
  // Un plano es { nombre, sem, cuartos: [{ clase, pared, sem, base }], uniones: [{ a, b, secreto, como }] }. El cuarto 0
  // da a la calle; cada unión es una puerta en la pared del fondo o, si es secreta, algo que la tapa (un estante, un
  // tapiz, unas tablas flojas o una alfombra sobre una trampilla) y que hay que examinar para encontrar el paso. Del
  // otro lado el paso se ve siempre. Los planos del editor viven en AGREGADOS.casas[id] (la casa lo toma con o.plano o
  // por su lugar, en: { x, y }); algunas casas del mundo arman el suyo con su semilla. Cada cuarto es la plantilla
  // "plano:<id>:<n>", así se edita como cualquier otro cuarto con la pestaña Interiores.
  const CLASES = ["entrada", "sala", "dormitorio", "cocina", "taller", "estudio", "almacen", "secreto"];
  const COMO = ["estante", "tapiz", "tablas", "trampilla"];
  const RUNA_CLASE = { entrada: "raidho", sala: "gebo", dormitorio: "berkano", cocina: "jera", taller: "tiwaz", estudio: "ansuz", almacen: "fehu", secreto: "perthro" };
  const RANURAS = [800, 1270, 330, 560, 1040];
  let fuentePlanos = null,
    saltar = null;
  const autos = {};
  const planosDe = () => fuentePlanos || (window.AGREGADOS && AGREGADOS.casas) || {};
  const plano = (id) => planosDe()[id] || autos[id] || null;
  // arma un plano nuevo: op = { cuartos, secretos, clases: [...], como, pared, nombre, base }
  function generarPlano(op, sem) {
    op = op || {};
    const r = DIB.azar(Math.round((sem || 0) * 100000) + 4111);
    const n = Math.max(1, Math.min(7, op.cuartos || 2 + Math.floor(r() * 3)));
    const sec = Math.max(0, Math.min(n - 1, op.secretos != null ? op.secretos : r() < 0.5 ? 1 : 0));
    const pedidas = (op.clases || []).filter((c) => CLASES.includes(c) && c !== "secreto" && c !== "entrada");
    const pool = ["dormitorio", "cocina", "sala", "taller", "estudio", "almacen", "dormitorio"];
    const pared = op.pared || ["cabana", "cabana", "clara", "taberna"][Math.floor(r() * 4)];
    const cuartos = [{ clase: "entrada", pared, sem: Math.round(r() * 1000) / 1000 }];
    if (op.base) cuartos[0].base = op.base;
    for (let i = 1; i < n - sec; i++) cuartos.push({ clase: pedidas[i - 1] || pool[Math.floor(r() * pool.length)], pared, sem: Math.round(r() * 1000) / 1000 });
    const uniones = [],
      pared0 = cuartos.map(() => 0),
      piso0 = cuartos.map(() => 0);
    const unir = (b, secreto, como) => {
      // a qué cuarto anterior se pega: uno con lugar en la pared (o en el piso, para la trampilla)
      const ok = [];
      for (let a = 0; a < b; a++) if (cuartos[a].clase !== "secreto" && (como === "trampilla" ? piso0[a] < 1 : pared0[a] < 3)) ok.push(a);
      const a = ok.length ? ok[Math.floor(r() * ok.length)] : 0;
      if (como === "trampilla") piso0[a]++;
      else pared0[a]++;
      pared0[b]++;
      uniones.push(secreto ? { a, b, secreto: true, como } : { a, b });
    };
    for (let b = 1; b < cuartos.length; b++) unir(b, false);
    for (let i = 0; i < sec; i++) {
      const como = COMO.includes(op.como) ? op.como : COMO[Math.floor(r() * COMO.length)];
      cuartos.push({ clase: "secreto", pared: como === "trampilla" ? "sotano" : r() < 0.5 ? "piedra" : pared, sem: Math.round(r() * 1000) / 1000 });
      unir(cuartos.length - 1, true, como);
    }
    return { nombre: op.nombre || t("in.plano_nombre", [cuartos.length]), sem: Math.round((sem || 0) * 1000) / 1000, cuartos, uniones };
  }
  // qué plano usa una casa: el que dice o.plano, uno del editor puesto en su lugar o, en una de cada tres casas, uno
  // armado con su semilla (siempre el mismo, con la casa de siempre como primer cuarto). o.sinPlano: un solo cuarto.
  function planoDe(id, o, x, y) {
    o = o || {};
    if ((id === "casaNordica" ? !o.entra : TIPO_DE[id] !== "casa") || o.sinPlano) return null;
    if (o.plano && plano(o.plano)) return o.plano;
    const cerca = Object.entries(planosDe()).find(([, pl]) => pl.en && Math.hypot(pl.en.x - x, pl.en.y - y) < 80);
    if (cerca) return cerca[0];
    const sem = o.sem || Math.abs(x * 0.0013 + y * 0.0007) % 1;
    if (DIB.azar(Math.round(sem * 10000) + 313)() >= 0.35) return null;
    const pid = "auto_" + Math.round(x) + "_" + Math.round(y);
    if (!autos[pid]) autos[pid] = generarPlano({ base: plantillaDe(id, o) }, sem);
    return pid;
  }
  // el cuarto n de un plano. pk: la clave del plano (lo encontrado se guarda por plano, no por cuarto)
  function armarPlanoCuarto(pid, pl, n, pk, editor) {
    const cu = pl.cuartos[n] || pl.cuartos[0],
      clave = pk + "_" + n,
      sotano = cu.pared === "sotano";
    const rs = DIB.azar(Math.round((cu.sem || 0) * 100000) + n * 37 + 1);
    let res;
    if (cu.base) {
      // un cuarto armado sobre una plantilla; «propio» (una variación duplicada) no toma lo cambiado en la plantilla
      const ed = { o: { sem: cu.sem || 0.01, v: +String(cu.base).slice(5) || 0 } };
      saltar = cu.propio ? cu.base : null;
      try {
        res = String(cu.base).startsWith("sot_") ? armarSotano("casa", ed, clave, cu.base.slice(4)) : armarCuarto(cu.base.startsWith("casa_") ? "casa" : cu.base, ed, clave, editor);
      } finally {
        saltar = null;
      }
    } else res = { muebles: [], gente: [], pared: sotano ? "sotano" : cu.pared || "cabana", ventana: 0, estandarte: null, repisa: false, sotano: sotano ? "viejo" : undefined };
    const m = res.muebles;
    const mueble = (id, x, y, o, r, accion, fn) => {
      const q = { id, x, y, o: Object.assign({ s: 1 }, o), r, accion, fn };
      m.push(q);
      return q;
    };
    const examinar = (k) => () => A.dialogoLibre([["eromash", k]]);
    // ---- los pasos a los otros cuartos ----
    const pared = () => m.filter((q) => !q.piso && q.y < FONDO + 80);
    const ranura = () => {
      const libre = RANURAS.find((x) => !pared().some((q) => Math.abs(q.x - x) < (q.r || 80) + 80));
      return libre != null ? libre : RANURAS[pared().length % RANURAS.length];
    };
    const ir = (b, ui) => () => irA(b, ui);
    const nombreCuarto = (b) => t("in.clase_" + ((pl.cuartos[b] || {}).clase || "sala"));
    (pl.uniones || []).forEach((u, ui) => {
      if (u.a !== n && u.b !== n) return;
      const lado = u.a === n ? "a" : "b",
        otro = lado === "a" ? u.b : u.a,
        k = pk + "_u" + ui,
        abierto = editor || !!st.cofres[k];
      const marcar = (q) => ((q.union = ui), (q.acceso = true), q);
      if (!u.secreto) {
        const q = marcar(mueble("puertaInterior", ranura(), FONDO + 6, { runa: RUNA_CLASE[(pl.cuartos[otro] || {}).clase] }, 90, null, ir(otro, ui)));
        q.etiqueta = () => t("in.accion_ir", [nombreCuarto(otro)]);
        return;
      }
      if (lado === "b") {
        // del lado de adentro el paso se ve siempre
        if (u.como === "trampilla") marcar(mueble("escaleraMano", 300, FONDO + 8, {}, 80, "in.accion_subir", ir(otro, ui)));
        else marcar(mueble("pasoSecreto", ranura(), FONDO + 4, {}, 90, "in.accion_paso", ir(otro, ui)));
        return;
      }
      const encontrar = (q, fn) => {
        if (st.cofres[k]) return;
        st.cofres[k] = true;
        if (window.SONIDO) SONIDO.tocar("crujido", { vol: 0.8 });
        HUD.aviso(t("in.pasadizo"), "#73D5DB");
        fn();
      };
      if (u.como === "trampilla") {
        const libres = [[1060, 760], [560, 760], [820, 840]].filter(([x, y]) => !m.some((q) => Math.abs(q.x - x) < (q.r || 80) + 90 && Math.abs(q.y - y) < 90));
        const [tx, ty] = libres[0] || [1060, 760];
        const tr = marcar(mueble("trampilla", tx, ty, { abierta: abierto }, 100, null, (q) => (q.o.abierta ? irA(otro, ui) : ((q.o.abierta = true), (st.cofres[k + "_t"] = true)))));
        tr.piso = true;
        tr.texto = (q) => (q.o.abierta ? "in.accion_bajar" : "in.accion_trampilla");
        if (!abierto) {
          tr.o.abierta = !!st.cofres[k + "_t"];
          const al = mueble("alfombra", tx, ty + 8, { s: 0.62, pista: true }, 130, "in.accion_alfombra", (q) =>
            encontrar(q, () => {
              q.o.movida = true;
              q.o.s = 0.5;
              q.x = tr.x - 190;
              q.fn = null;
              tr.tapada = null;
            }),
          );
          al.piso = true;
          tr.tapada = al;
        } else mueble("alfombra", tx - 190, ty + 8, { s: 0.5, movida: true }, 0).piso = true;
        return;
      }
      const x = ranura();
      const paso = marcar(mueble("pasoSecreto", x, FONDO + 2, {}, 90, "in.accion_paso", null));
      const abrir = () => (paso.fn = ir(otro, ui));
      if (abierto) abrir();
      if (u.como === "estante") {
        const e = mueble("estanteRollos", abierto ? x + 190 : x, FONDO + 10, { s: 0.9, sem: cu.sem }, abierto ? 120 : 140, "in.accion_rollos", null);
        if (!abierto) e.fn = (q) => encontrar(q, () => ((q.x += 190), (q.r = 120), (q.fn = null), abrir()));
      } else if (u.como === "tapiz") {
        const e = mueble("tapizPared", x, FONDO + 3, { corrido: abierto }, 0, "in.accion_tapiz", null);
        if (!abierto) e.fn = (q) => encontrar(q, () => ((q.o.corrido = true), (q.fn = null), abrir()));
      } else {
        // las tablas flojas tapan el hueco hasta que se arrancan: el paso queda detrás del muro falso
        paso.id = "muroFalso";
        paso.oculto = !abierto;
        if (!abierto) {
          const e = mueble("tablasFlojas", x, FONDO + 3, {}, 0, "in.accion_tablas", null);
          e.fn = (q) => encontrar(q, () => ((paso.oculto = false), (q.oculto = true), (q.fn = null), abrir()));
        }
      }
    });
    // ---- los muebles de cada clase, donde no estorben los pasos ----
    if (!cu.base) amueblar(res, cu, clave, rs, mueble, examinar);
    if (!sotano && !cu.base) {
      const libre = (x) => !pared().some((q) => Math.abs(q.x - x) < (q.r || 80) + 140);
      res.ventana = cu.clase === "secreto" ? 0 : [1150, 560, 1380, 300].find(libre) || 0;
      if (cu.clase === "sala" || (cu.clase === "entrada" && rs() < 0.5)) res.estandarte = [560, 1040, 1270].find((x) => libre(x) && Math.abs(x - res.ventana) > 260) || null;
      res.repisa = cu.clase === "estudio";
    }
    res.muebles = m;
    return aplicarCambios(res, "plano:" + pid + ":" + n, clave);
  }
  // los muebles por clase: [id, en la pared, probabilidad]
  const RECETAS = {
    entrada: [["hogarPiedra", 1, 1], ["mesaBanco", 0, 1], ["armero", 1, 0.5], ["barriles", 1, 0.5], ["arconCasa", 0, 0.3]],
    sala: [["hogarPiedra", 1, 1], ["mesaBanco", 0, 1], ["mesaBanco", 0, 0.7], ["estanteRollos", 1, 0.4], ["barriles", 1, 0.4]],
    dormitorio: [["camaPieles", 0, 1], ["arconCasa", 0, 0.8], ["telar", 1, 0.5], ["cesto", 0, 0.4], ["hogarPiedra", 1, 0.3]],
    cocina: [["hogarPiedra", 1, 1], ["barriles", 1, 1], ["mesaBanco", 0, 1], ["cantaros", 1, 0.7], ["cesto", 0, 0.7], ["sacos", 0, 0.4]],
    taller: [["telar", 1, 0.8], ["armero", 1, 0.8], ["yunque", 0, 0.6], ["cajas", 0, 1], ["barriles", 1, 0.4]],
    estudio: [["escritorioRunico", 0, 1], ["estanteRollos", 1, 1], ["atril", 0, 0.8], ["estanteRollos", 1, 0.4], ["arconCasa", 0, 0.4]],
    almacen: [["barriles", 1, 1], ["cajas", 0, 1], ["sacos", 0, 0.8], ["cantaros", 1, 0.7], ["cesto", 0, 0.6], ["barriles", 1, 0.5]],
    secreto: [["cofreSotano", 0, 1], ["atril", 0, 0.8], ["huesos", 1, 0.6], ["estanteRollos", 1, 0.5], ["cajas", 0, 0.5]],
  };
  const PIEZA = {
    hogarPiedra: { r: 150, s: 0.85, dy: 30, accion: "in.accion_hogar" },
    camaPieles: { r: 210, s: 0.9, accion: "in.accion_cama" },
    mesaBanco: { r: 170, s: 0.95, accion: "in.accion_mesa", dlg: "in.casa_mesa" },
    arconCasa: { r: 90, s: 1, accion: "in.accion_arcon" },
    telar: { r: 120, s: 1, dy: 60, accion: "in.accion_telar", dlg: "in.casa_telar" },
    barriles: { r: 100, s: 0.8, dy: 40, accion: "in.accion_barriles", dlg: "in.casa_barriles" },
    armero: { r: 140, s: 0.9, dy: 20, accion: "in.accion_armero", dlg: "in.casa_armero" },
    estanteRollos: { r: 140, s: 0.9, dy: 10, accion: "in.accion_rollos", dlg: "in.casa_rollos" },
    escritorioRunico: { r: 260, s: 0.85, accion: "in.accion_escritorio", dlg: "in.casa_escritorio" },
    atril: { r: 70, s: 1, accion: "in.accion_atril", dlg: "in.casa_atril" },
    cajas: { r: 110, s: 0.95, accion: "in.accion_cajas", dlg: "in.sot_bodega_cajas" },
    cesto: { r: 90, s: 1, accion: "in.accion_cesto", dlg: "in.sot_despensa_cesto" },
    cantaros: { r: 90, s: 1, dy: 30, accion: "in.accion_cantaros", dlg: "in.sot_viejo_cantaros" },
    sacos: { r: 80, s: 1, accion: "in.accion_sacos", dlg: "in.sot_sacos" },
    huesos: { r: 110, s: 0.9, dy: 30, accion: "in.accion_huesos", dlg: "in.sot_huesos" },
    yunque: { r: 80, s: 1.1, accion: "in.accion_yunque", dlg: "in.herreria_yunque" },
    cofreSotano: { r: 110, s: 1, accion: "in.accion_cofre" },
  };
  function amueblar(res, cu, clave, rs, mueble, examinar) {
    const m = res.muebles;
    const mezclar = (l) => l.map((v) => [rs(), v]).sort((a, b) => a[0] - b[0]).map((v) => v[1]);
    const enPared = mezclar([220, 450, 680, 920, 1150, 1380]),
      enPiso = mezclar([[560, 800], [1080, 800], [820, 865], [330, 860], [1300, 865]]);
    (RECETAS[cu.clase] || RECETAS.sala).forEach(([id, alPared, p], i) => {
      if (rs() > p) return;
      const d = PIEZA[id],
        r = d.r;
      let x, y;
      if (alPared) {
        x = enPared.find((xx) => !m.some((q) => !q.piso && q.y < FONDO + 80 && Math.abs(q.x - xx) < (q.r || 80) + r + 10) && xx - r > 120 && xx + r < 1480);
        y = FONDO + (d.dy || 0);
      } else {
        const lugar = enPiso.find(([xx, yy]) => !m.some((q) => (q.piso || q.y >= FONDO + 80) && Math.abs(q.x - xx) < (q.r || 80) + r && Math.abs(q.y - yy) < 90));
        if (lugar) [x, y] = lugar;
      }
      if (x == null) return;
      const k = clave + "_m" + i;
      let fn = d.dlg ? examinar(d.dlg) : null;
      const o = { s: d.s };
      if (id === "camaPieles") fn = dormir;
      if (id === "hogarPiedra") fn = calentarse;
      if (id === "cajas") o.vela = rs() < 0.6;
      if (id === "estanteRollos") o.sem = rs();
      if (id === "cesto") o.sem = rs() * 3;
      if (id === "arconCasa") (o.abierto = !!st.cofres[k]), (fn = (q) => abrirArcon(q, k));
      if (id === "cofreSotano") (o.abierto = !!st.cofres[k]), (fn = (q) => abrirCofre(q, k, cu.clase === "secreto"));
      if (id === "atril" && cu.clase === "secreto") (o.leido = !!st.cofres[k]), (fn = (q) => leerLibro(q, k, "in.libro_escondite"));
      else if (id === "atril") o.leido = true;
      mueble(id, x, y, o, r, d.accion, fn);
    });
  }
  // pasar de un cuarto a otro del mismo plano
  function cuartoPlano(p, n) {
    const pl = plano(p.plano);
    const c0 = armarPlanoCuarto(p.plano, pl, n, p.clave, false);
    return Object.assign(c0, { n, sinSalida: n > 0, plano: p.plano, clase: pl.cuartos[n].clase });
  }
  function irA(n, ui) {
    const p = dentro.puerta;
    if (!p || !plano(p.plano)) return;
    const nuevo = cuartoPlano(p, n);
    const q = nuevo.muebles.find((m) => m.acceso && m.union === ui);
    const ix = q ? (q.piso ? q.x + 130 : q.x) : 800,
      iy = q ? (q.piso ? Math.min(RH - 40, q.y + 30) : FONDO + 120) : 780;
    dentro = Object.assign(nuevo, { tipo: "plano", puerta: p, ix, iy, fundido: 1, saliendo: 0 });
    jug.mira = { vista: "S", espejo: false };
    if (window.SONIDO) SONIDO.tocar("puerta", { vol: 0.35 });
    HUD.aviso(t("in.clase_" + nuevo.clase), "#E0B2B2");
  }
  function bajar(q) {
    const arriba = dentro;
    arriba.vuelta = { x: q.x + 130, y: Math.min(RH - 40, q.y + 30) };
    const s0 = armarSotano(arriba.tipo, arriba.puerta.cosa, arriba.puerta.clave);
    dentro = Object.assign(s0, { tipo: arriba.tipo, puerta: arriba.puerta, arriba, ix: 380, iy: FONDO + 110, fundido: 1, saliendo: 0 });
    jug.mira = { vista: "S", espejo: false };
    HUD.aviso(t("in.sotano_" + s0.sotano), "#E0B2B2");
  }
  function subir() {
    const a = dentro.arriba;
    if (!a) return;
    // bajó desde un cuarto que arma otro sistema (la sala del Hongo Dorado): le devuelve el mando
    if (a.alSubir) {
      dentro = null;
      J.dentro = null;
      return a.alSubir();
    }
    a.ix = a.vuelta.x;
    a.iy = a.vuelta.y;
    a.fundido = 1;
    a.saliendo = 0;
    // la puerta de piedra se pudo abrir abajo
    dentro = a;
    jug.mira = { vista: "S", espejo: false };
  }
  // la trampilla de un cuarto que arma otro sistema (la sala del Hongo Dorado): baja a su sótano de siempre y, al subir
  // la escalera, alSubir() lo vuelve a poner arriba
  function bajarDesde(p, alSubir) {
    const s0 = armarSotano(p.tipo, p.cosa, p.clave);
    dentro = Object.assign(s0, { tipo: p.tipo, puerta: p, arriba: { alSubir }, ix: 380, iy: FONDO + 110, fundido: 1, saliendo: 0 });
    J.dentro = sistemaDentro;
    jug.atk = null;
    jug.mira = { vista: "S", espejo: false };
    HUD.aviso(t("in.sotano_" + s0.sotano), "#E0B2B2");
  }
  function abrirCofre(q, k, rico) {
    if (st.cofres[k]) return;
    if (window.SONIDO) SONIDO.tocar("crujido", { vol: 0.7 });
    st.cofres[k] = true;
    q.o.abierto = true;
    const r = DIB.azar(k.length * 613 + k.charCodeAt(k.length - 2));
    const plata = Math.round((rico ? 60 : 34) + r() * (rico ? 50 : 36));
    PODERES.darPlata(plata);
    HUD.aviso(t("in.cofre_plata", [plata]), "#FFD98A");
    if (rico || r() < 0.5) J.retrasar(0.5, () => PODERES.darFragmento());
  }
  function abrirNicho(q, k) {
    if (st.cofres[k]) return;
    if (window.SONIDO) SONIDO.tocar("crujido", { vol: 0.7 });
    st.cofres[k] = true;
    q.o.abierta = true;
    q.o.brillo = false;
    const r = DIB.azar(k.length * 401 + k.charCodeAt(0));
    if (r() < 0.45) {
      PODERES.darFragmento();
      HUD.aviso(t("in.nicho_fragmento"), "#A9C2F0");
    } else {
      const plata = Math.round(18 + r() * 26);
      PODERES.darPlata(plata);
      HUD.aviso(t("in.nicho_plata", [plata]), "#FFD98A");
    }
  }
  function leerLibro(q, k, libro) {
    A.dialogoLibre([["eromash", libro]]);
    if (st.cofres[k]) return;
    st.cofres[k] = true;
    q.o.leido = true;
    J.retrasar(0.3, () => PODERES.darFragmento());
  }

  // ---------- entrar y salir ----------
  function entrar(p) {
    // el Hongo Dorado es una sala grande aparte, pensada para la vista girada (motor/hongo.js)
    if (p.tipo === "taberna" && window.HONGO) return HONGO.entrar(p);
    // la herrería de Ása también es un taller aparte, a 30° (motor/herreria.js)
    if (p.tipo === "herreria" && window.HERRERIA) return HERRERIA.entrar(p);
    if (p.tipo === "sanacion" && window.SANACION) return SANACION.entrar(p);
    const cuarto = p.tipo === "plano" ? cuartoPlano(p, 0) : armarCuarto(p.tipo, p.cosa, p.clave);
    dentro = Object.assign(cuarto, { tipo: p.tipo, puerta: p, ix: 240, iy: 830, fundido: 1, saliendo: 0 });
    J.dentro = sistemaDentro;
    jug.atk = null;
    jug.anda = 0;
    jug.mira = { vista: "N", espejo: false };
    if (window.SONIDO) SONIDO.tocar("puerta", { vol: 0.45 });
    HUD.aviso(p.tipo === "plano" ? plano(p.plano).nombre || t("in.nombre_casa") : t("in.nombre_" + p.tipo), "#FFD98A");
  }
  function salir() {
    if (!dentro || dentro.saliendo) return;
    dentro.saliendo = 0.35;
  }
  function terminarSalida() {
    const p = dentro.puerta;
    dentro = null;
    J.dentro = null;
    jug.x = p.cosa.x;
    jug.y = p.cosa.y + 70;
    jug.mira = { vista: "S", espejo: false };
    J.cam.x = jug.x;
    J.cam.y = jug.y - 30;
  }

  // ---------- lo que se hace adentro ----------
  function abrirArcon(q, clave) {
    if (st.cofres[clave]) return;
    if (window.SONIDO) SONIDO.tocar("crujido", { vol: 0.7 });
    st.cofres[clave] = true;
    q.o.abierto = true;
    const r = DIB.azar(clave.length * 977 + clave.charCodeAt(clave.length - 1));
    const plata = Math.round(14 + r() * 30);
    PODERES.darPlata(plata);
    HUD.aviso(t("in.arcon_plata", [plata]), "#FFD98A");
    if (r() < 0.3) J.retrasar(0.5, () => PODERES.darFragmento());
  }
  function dormir() {
    const h = LUZ.hora(A.H.E.tiempo);
    dentro.fundido = 1.4;
    jug.hp = jug.hpMax;
    if (h > 19 || h < 6) {
      const falta = (((7 - h + 24) % 24) / 24) * LUZ.DIA;
      A.H.E.tiempo += falta;
      HUD.aviso(t("in.dormiste_noche"), "#E0B2B2");
    } else HUD.aviso(t("in.dormiste"), "#E0B2B2");
    A.H.guardar();
  }
  function calentarse() {
    jug.hp = Math.min(jug.hpMax, jug.hp + 40);
    HUD.aviso(t("in.calor"), "#FF8D71");
  }
  function hidromiel() {
    A.menu(`<h2>${t("in.hidromiel_titulo")}</h2><div class="sub">${t("in.hidromiel_sub")}</div>`, [
      {
        texto: t("in.hidromiel_si"),
        fn: () => {
          A.cerrarMenu();
          const pj = PODERES.pj();
          if (pj.plata < 5) return A.avisar("in.hidromiel_sin");
          pj.plata -= 5;
          jug.hp = jug.hpMax;
          HUD.aviso(t("in.hidromiel_ok"), "#FFD98A");
        },
      },
      { texto: t("ui.cerrar"), fn: A.cerrarMenu },
    ]);
  }

  // ---------- caminar adentro ----------
  const bordes = (y) => {
    const u = (y - FONDO) / (RH - FONDO);
    return [200 - u * 200 + 70, 1400 + u * 200 - 70];
  };
  const escala = (y) => 2.3 + ((y - FONDO) / (RH - FONDO)) * 0.9; // más grande adelante
  function choca(x, y) {
    if (y < FONDO + 50 || y > RH - 30) return true;
    const [a, b] = bordes(y);
    if (x < a || x > b) return true;
    for (const q of dentro.muebles) {
      if (q.piso || q.oculto) continue;
      const fondo = q.y < FONDO + 80; // los pegados a la pared tapan una franja ancha
      const ry = fondo ? 70 : 34;
      if (Math.abs(x - q.x) < q.r && Math.abs(y - (q.y - 10)) < ry) return true;
    }
    for (const n of dentro.gente) if (Math.hypot(x - n.x, (y - n.y) * 1.6) < 60) return true;
    return false;
  }
  function cercanoDentro() {
    if (!dentro || dentro.saliendo) return null;
    let mejor = null,
      dm = Infinity;
    const prueba = (d, texto, fn) => {
      if (d < dm) {
        dm = d;
        mejor = { texto, fn };
      }
    };
    // la puerta, abajo a la izquierda
    const dp = dentro.sotano || dentro.sinSalida ? Infinity : Math.hypot(dentro.ix - 220, dentro.iy - 860);
    if (dp < 150) prueba(dp, t("in.accion_salir"), salir);
    for (const q of dentro.muebles) {
      if (!q.fn || q.tapada || q.oculto) continue;
      if ((q.id === "arconCasa" || q.id === "cofreSotano") && q.o.abierto) continue;
      if (q.id === "tablaSuelta" && q.o.abierta) continue;
      if (q.piso) {
        const d = Math.hypot(dentro.ix - q.x, (dentro.iy - (q.y - 20)) * 1.4) - q.r * 0.6;
        if (d < 90) prueba(Math.max(0, d), q.etiqueta ? q.etiqueta() : t(q.texto ? q.texto(q) : q.accion), () => q.fn(q));
        continue;
      }
      const fondo = q.y < FONDO + 80,
        dx = Math.max(0, Math.abs(dentro.ix - q.x) - q.r * 0.8),
        dy = fondo ? Math.max(0, dentro.iy - (q.y + 70)) : Math.abs(dentro.iy - q.y);
      const d = Math.hypot(dx, dy);
      if (d < 110) prueba(d, q.etiqueta ? q.etiqueta() : t(q.accion), () => q.fn(q));
    }
    for (const n of dentro.gente) {
      const d = Math.hypot(dentro.ix - n.x, dentro.iy - n.y);
      if (d < 190) prueba(d - 40, t("av.accion_hablar") + " · " + t("av.nombre_" + n.id), () => PODERES.hablarCon(n));
    }
    return mejor;
  }
  function paso(dt) {
    if (!dentro) return;
    if (dentro.fundido > 0) dentro.fundido = Math.max(0, dentro.fundido - dt * 2.4);
    if (dentro.saliendo) {
      dentro.saliendo -= dt;
      if (dentro.saliendo <= 0) terminarSalida();
      return;
    }
    jug.inv = Math.max(0, jug.inv - dt);
    if (J.modo !== "juego") {
      jug.anda = 0;
      return;
    }
    const e = CONTROLES.eje(),
      mov = Math.hypot(e.x, e.y) > 0.15;
    jug.correr = false;
    jug.sta = Math.min(jug.staMax, jug.sta + 22 * dt);
    if (mov) {
      const l = Math.hypot(e.x, e.y),
        k = escala(dentro.iy) / 2.6,
        dx = (e.x / l) * VEL * k * dt,
        dy = (e.y / l) * VEL * 0.7 * k * dt;
      if (!choca(dentro.ix + dx, dentro.iy)) dentro.ix += dx;
      if (!choca(dentro.ix, dentro.iy + dy)) dentro.iy += dy;
      jug.dir = [e.x / l, e.y / l];
      jug.mira = VIKINGO.vista(e.x, e.y, jug.mira);
      // salir caminando por la puerta
      if (!dentro.sotano && !dentro.sinSalida && dentro.iy > RH - 50 && dentro.ix < 330 && e.y > 0.5) salir();
    }
    jug.anda = mov ? 1 : 0;
    // la gente mira a Eromash
    dentro.gente.forEach((n) => {
      if (Math.hypot(dentro.ix - n.x, dentro.iy - n.y) < 400) n.mira = VIKINGO.vista(dentro.ix - n.x, dentro.iy - n.y, n.mira);
    });
    if (CONTROLES.recien("interactuar")) {
      const c0 = cercanoDentro();
      if (c0) c0.fn();
    }
  }

  // ---------- dibujar el cuarto ----------
  function plancha(c, pts, col) {
    DIB.P(c, pts, col);
  }
  // el sótano, como en la lámina «Bajo las casas de Eikholt»: el piso de la casa arriba (tablas, vigas y la trampilla),
  // postes sobre zócalos de piedra y un farol colgado. Las despensas, bodegas y escondites tienen pared de tablas; el
  // sótano viejo es de piedra, más viejo que la casa, con runas en los pilares y raíces que bajan.
  function dibujarSotano(c, d, tt) {
    const r = DIB.azar(d.sotano.length * 31 + 5),
      viejo = d.sotano === "viejo",
      M = { tabla: ["#4A3020", "#55382A", "#40281A", "#5C3E2C"], viga: "#2E1C12", vigaL: "#5C3E2C", poste: "#3E2818", posteL: "#6A4A34", piedra: ["#4A4A48", "#55554F", "#3E3E3C", "#5E5C56"], junta: "#24221F" };
    c.fillStyle = "#0E0A08";
    c.fillRect(0, 0, RW, RH);
    if (viejo) {
      // piedra grande, con musgo en las juntas
      for (let fila = 0; fila * 96 < FONDO; fila++) {
        const y = FONDO - fila * 96;
        for (let x = -80 + (fila % 2) * 90; x < RW + 80; ) {
          const w = 150 + r() * 90;
          DIB.P(c, [x + 5, y - 4, x + w - 5, y - 6 + r() * 4, x + w - 2, y - 90 + r() * 6, x + 4, y - 92 + r() * 6], M.piedra[Math.floor(r() * 4)]);
          DIB.P(c, [x + 5, y - 86, x + w - 5, y - 88, x + w - 8, y - 92, x + 8, y - 92], "#6A6862");
          if (r() < 0.3) DIB.alfa(c, 0.6, () => DIB.E(c, x + w * r(), y - 4, 26, 6, "#4E6B3A"));
          x += w;
        }
      }
      // raíces que bajan por la piedra
      for (let k = 0; k < 6; k++) {
        const x = 80 + k * 280 + r() * 80;
        c.beginPath();
        c.moveTo(x, 130);
        c.bezierCurveTo(x + 30, 260, x - 40, 380, x + 10 + r() * 30, 420 + r() * 160);
        c.strokeStyle = "#3A2A1C";
        c.lineWidth = 6 + r() * 6;
        c.stroke();
      }
    } else {
      // zócalo de piedra y tablas verticales
      for (let x = -20; x < RW + 40; ) {
        const w = 70 + r() * 30;
        DIB.P(c, [x, FONDO - 90, x + w - 3, FONDO - 90, x + w - 3, 130, x, 130], M.tabla[Math.floor(r() * 4)]);
        DIB.L(c, x + w - 3, 130, x + w - 3, FONDO - 90, "#24160C", 3);
        if (r() < 0.5) DIB.E(c, x + w * 0.5, 160 + r() * 300, 3, 3, "#1E120A");
        x += w;
      }
      for (let x = -40; x < RW + 40; ) {
        const w = 120 + r() * 70;
        DIB.P(c, [x + 4, FONDO, x + w - 4, FONDO, x + w - 2, FONDO - 88, x + 2, FONDO - 86], M.piedra[Math.floor(r() * 4)]);
        DIB.P(c, [x + 4, FONDO - 80, x + w - 4, FONDO - 82, x + w - 2, FONDO - 88, x + 2, FONDO - 86], "#6A6862");
        x += w;
      }
    }
    // el techo: las tablas del piso de arriba, la viga madre y la trampilla abierta con la luz que baja
    plancha(c, [0, 0, RW, 0, RW, 70, 0, 82], "#2A1A10");
    for (let x = 0; x < RW; x += 64) DIB.L(c, x, 0, x - 4, 78, "#1A100A", 3);
    plancha(c, [0, 70, RW, 58, RW, 130, 0, 142], M.viga);
    plancha(c, [0, 70, RW, 58, RW, 72, 0, 84], M.vigaL);
    plancha(c, [210, 0, 400, 0, 396, 66, 214, 74], "#120A06");
    DIB.alfa(c, 0.18, () => DIB.P(c, [214, 74, 396, 66, 520, FONDO + 120, 120, FONDO + 120], "#FFD98A"));
    if (!viejo) {
      // la tapa de la trampilla, levantada
      plancha(c, [214, 0, 396, 0, 380, -40, 230, -40], M.tabla[3]);
    }
    // los postes sobre su piedra
    [560, 1140].forEach((x) => {
      DIB.P(c, [x - 26, 136, x + 26, 136, x + 26, FONDO - 24, x - 26, FONDO - 24], M.poste);
      DIB.P(c, [x + 4, 136, x + 26, 136, x + 26, FONDO - 24, x + 4, FONDO - 24], M.posteL);
      DIB.P(c, [x - 40, FONDO, x + 40, FONDO, x + 36, FONDO - 34, x - 36, FONDO - 34], "#5E5C56");
      DIB.P(c, [x, FONDO, x + 40, FONDO, x + 36, FONDO - 34, x, FONDO - 34], "#6E6C66");
      DIB.P(c, [x - 46, 136, x - 26, 136, x - 26, 170], M.viga);
      DIB.P(c, [x + 46, 136, x + 26, 136, x + 26, 170], M.viga);
    });
    if (viejo) {
      // los pilares de piedra con runas que brillan
      [["fehu", 160], ["mannaz", 1460]].forEach(([rn, x]) => {
        DIB.P(c, [x - 70, FONDO + 20, x + 70, FONDO + 20, x + 70, 140, x - 70, 140], "#5E5C56");
        DIB.P(c, [x - 70, FONDO + 20, x - 10, FONDO + 20, x - 10, 140, x - 70, 140], "#4A4A46");
        for (let k = 1; k < 4; k++) DIB.L(c, x - 70, 140 + k * 120, x + 70, 140 + k * 120, M.junta, 3);
        DIB.halo(c, x, 330, 90, "#73D5DB", 0.35 + 0.12 * Math.sin(tt * 1.6));
        FUTHARK.dibujar(c, rn, x, 380, 90, "#73D5DB", 7);
      });
      ["gebo", "hagalaz"].forEach((rn, k) => FUTHARK.dibujar(c, rn, 760 + k * 120, 360, 50, "#73D5DB", 5));
    } else {
      // ristras de ajo, atados de hierbas y ajíes colgados de la viga
      const ristra = (x, tipo) => {
        DIB.L(c, x, 130, x, 170, "#8A7A5A", 2);
        for (let k = 0; k < 6; k++) {
          const y = 170 + k * 18;
          if (tipo === 0) DIB.E(c, x + (k % 2 ? 5 : -5), y, 9, 9, k % 2 ? "#E8E0D0" : "#D8CCB8");
          else if (tipo === 1) DIB.P(c, [x - 8, y - 6, x + 8, y - 6, x + 3, y + 14, x - 3, y + 14], k % 2 ? "#6F8F4E" : "#4E6B3A");
          else DIB.P(c, [x - 3, y - 6, x + 3, y - 6, x + 1, y + 12], k % 2 ? "#C8402D" : "#9C2315");
        }
      };
      [90, 130, 175, 1240, 1290, 1340].forEach((x, k) => ristra(x, k % 3));
    }
    // el farol colgado, con su luz cálida
    const fx = 820,
      fy = 250;
    DIB.L(c, fx, 136, fx, fy - 40, "#2A2420", 3);
    DIB.halo(c, fx, fy, 260, "#FFD98A", 0.55 + 0.06 * Math.sin(tt * 7));
    DIB.P(c, [fx - 18, fy - 40, fx + 18, fy - 40, fx + 22, fy + 24, fx - 22, fy + 24], "#2A2420");
    DIB.P(c, [fx - 12, fy - 30, fx + 12, fy - 30, fx + 15, fy + 16, fx - 15, fy + 16], "#FFD98A");
    DIB.E(c, fx, fy + 2, 5, 9, "#FFF4D0");
    DIB.P(c, [fx - 22, fy - 40, fx + 22, fy - 40, fx, fy - 56], "#2A2420");
    // telarañas en la esquina
    DIB.alfa(c, 0.35, () => {
      for (let i = 0; i < 5; i++) DIB.L(c, RW, 142, RW - 70 - i * 26, 142 + 70 - i * 12, "#B5A5A0", 1.2);
    });
    // el piso: tierra en los sótanos de tablas, lajas en el viejo
    plancha(c, [200, FONDO, 1400, FONDO, 1640, RH, -40, RH], viejo ? "#34322E" : "#3A2A1C");
    for (let i = 0; i < (viejo ? 60 : 30); i++) {
      const u = r(),
        v = r(),
        y = FONDO + 14 + v * (RH - FONDO - 20),
        a = (y - FONDO) / (RH - FONDO),
        x = 200 - a * 240 + u * (1200 + a * 480),
        w = (viejo ? 60 : 30) + a * 50 + r() * 30,
        hh = (viejo ? 14 : 6) + a * 18;
      DIB.P(c, [x - w, y, x - w * 0.8, y - hh, x + w * 0.8, y - hh * 1.1, x + w, y + 2], viejo ? ["#4E4C46", "#45433E", "#5A5852"][i % 3] : ["#4A3826", "#443222", "#3E2E1E"][i % 3]);
    }
    if (!viejo) for (let k = 0; k < 5; k++) DIB.L(c, 300 + k * 260, FONDO + 30 + k * 40, 380 + k * 250, FONDO + 70 + k * 30, "#2A1E14", 4);
    plancha(c, [200, FONDO, 1400, FONDO, 1410, FONDO + 16, 190, FONDO + 16], "rgba(0,0,0,0.5)");
  }
  function dibujarPared(c, d, tt) {
    if (d.pared === "sotano") return dibujarSotano(c, d, tt);
    const r = DIB.azar(7);
    const tonos = {
      cabana: ["#1E0E0B", "#190C0A", "#22110D", "#0E0707"],
      taberna: ["#2A160C", "#24120A", "#30190E", "#140A06"],
      clara: ["#3A2A1E", "#33251A", "#403022", "#1E140E"],
      piedra: ["#1E1A1C", "#1A1618", "#242022", "#0E0C0D"],
    }[d.pared];
    c.fillStyle = "#111111";
    c.fillRect(0, 0, RW, RH);
    for (let x = -20, i = 0; x < RW; i++) {
      const w = 90 + r() * 50;
      plancha(c, [x, 0, x + w, 0, x + w - 4, FONDO, x + 4, FONDO], tonos[i % 3]);
      plancha(c, [x + w - 6, 0, x + w, 0, x + w - 4, FONDO, x + w - 10, FONDO], tonos[3]);
      x += w;
    }
    if (d.pared === "piedra") {
      // la mitad de abajo de piedra, por el fuego de la forja
      for (let k = 0; k < 30; k++) {
        const px = (k % 10) * 170 + (Math.floor(k / 10) % 2) * 85 - 40,
          py = FONDO - 40 - Math.floor(k / 10) * 80;
        DIB.P(c, DIB.poli(px + 80, py, 82, 38, 6, r()), r() < 0.5 ? "#3A3438" : "#2E2A2E");
      }
    }
    // viga
    plancha(c, [0, 96, RW, 80, RW, 132, 0, 150], d.pared === "clara" ? "#4A3424" : "#2A120E");
    plancha(c, [0, 140, RW, 122, RW, 132, 0, 150], "#0E0707");
    // la ventana octogonal con el cielo de la hora
    if (d.ventana) {
      const vx = d.ventana,
        vy = 300,
        h = A && window.LUZ ? LUZ.hora(A.H.E.tiempo) : 13,
        noche = h > 19.5 || h < 5.5;
      const oct = (rad) => {
        const pts = [];
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + 0.39;
          pts.push(vx + Math.cos(a) * rad, vy + Math.sin(a) * rad);
        }
        return pts;
      };
      DIB.P(c, oct(112), "#5E130D");
      c.save();
      c.beginPath();
      const o = oct(92);
      c.moveTo(o[0], o[1]);
      for (let i = 2; i < o.length; i += 2) c.lineTo(o[i], o[i + 1]);
      c.closePath();
      c.fillStyle = noche ? "#14182A" : h < 8 || h > 18 ? "#C87A5A" : "#7FA4B8";
      c.fill();
      c.clip();
      DIB.P(c, [vx - 110, vy + 40, vx - 50, vy, vx, vy + 30, vx + 60, vy - 20, vx + 120, vy + 30, vx + 120, vy + 120, vx - 110, vy + 120], noche ? "#0C0E1A" : "#2C3A24");
      if (noche) {
        DIB.E(c, vx + 32, vy - 38, 22, 22, "#F2ECEC");
        DIB.E(c, vx + 22, vy - 45, 20, 20, "#14182A");
        const re = DIB.azar(3);
        for (let i = 0; i < 14; i++) DIB.alfa(c, 0.4 + 0.6 * Math.abs(Math.sin(tt + i)), () => DIB.R(c, vx - 80 + re() * 160, vy - 80 + re() * 100, 2, 2, "#F2ECEC"));
      } else DIB.E(c, vx - 30, vy - 40, 18, 18, "#FFD98A");
      c.restore();
      DIB.R(c, vx - 4, vy - 92, 8, 184, "#5E130D");
      DIB.R(c, vx - 92, vy - 4, 184, 8, "#5E130D");
      d.luzVentana = noche ? null : { x: vx, y: vy + 60, r: 420, col: "#C8E0F0" };
    }
    // estandarte rojo de cola de golondrina con la E
    if (d.estandarte) {
      const ex = d.estandarte,
        sw = Math.sin(tt * 0.7) * 4;
      plancha(c, [ex - 90, 150, ex + 90, 150, ex + 90, 520 + sw, ex, 470 + sw, ex - 90, 520 + sw], "#9C2315");
      plancha(c, [ex - 90, 150, ex - 50, 150, ex - 50, 500 + sw, ex - 90, 520 + sw], "#5E130D");
      DIB.R(c, ex - 104, 140, 208, 16, "#C9A45A");
      if (d.tipo === "taberna") {
        plancha(c, [ex - 50, 330, ex, 250, ex + 50, 330], "#FFD98A");
        DIB.R(c, ex - 10, 330, 20, 60, "#F2ECEC");
      } else {
        plancha(c, [ex - 35, 240, ex + 45, 240, ex + 32, 262, ex - 8, 262, ex - 8, 290, ex + 32, 290, ex + 22, 310, ex - 8, 310, ex - 8, 342, ex + 45, 342, ex + 32, 364, ex - 35, 364], "#F2ECEC");
        plancha(c, [ex - 35, 240, ex - 22, 240, ex - 22, 364, ex - 35, 364], "#E0B2B2");
      }
    }
    // repisa con libros y el frasco de la runa
    if (d.repisa) {
      const rx = d.ventana > 900 ? 300 : 1100;
      DIB.R(c, rx, 430, 230, 16, "#44100A");
      let lx = rx + 14;
      [["#9C2315", 30, 110], ["#E0B2B2", 24, 96], ["#5E130D", 34, 120], ["#C8402D", 22, 88], ["#F2ECEC", 28, 104]].forEach(([col, w, hh]) => {
        DIB.R(c, lx, 430 - hh, w, hh, col);
        DIB.R(c, lx + 4, 430 - hh + 18, w - 8, 6, "#C9A45A");
        lx += w + 3;
      });
      DIB.halo(c, rx + 200, 400, 70, "#4A78D0", 0.35 + 0.1 * Math.sin(tt * 2));
      FUTHARK.dibujar(c, "algiz", rx + 200, 420, 34, "#A9C2F0", 3);
    }
    // el piso: tablones en perspectiva
    for (let i = 0; i < 12; i++) {
      const u0 = i / 12,
        u1 = (i + 1) / 12,
        bx0 = 200 + 1200 * u0,
        bx1 = 200 + 1200 * u1,
        fx0 = -40 + 1680 * u0,
        fx1 = -40 + 1680 * u1;
      plancha(c, [bx0, FONDO, bx1, FONDO, fx1, RH, fx0, RH], ["#3A1A10", "#341710", "#40200F"][i % 3]);
      plancha(c, [bx1 - 1, FONDO, bx1 + 1, FONDO, fx1 + 3, RH, fx1 - 3, RH], "#1A0A06");
    }
    plancha(c, [200, FONDO, 1400, FONDO, 1410, FONDO + 14, 190, FONDO + 14], "rgba(0,0,0,0.5)");
    // la puerta de salida, abajo a la izquierda: un rectángulo de luz de afuera en el piso
    if (!d.sinSalida) DIB.alfa(c, 0.5 + Math.sin(tt * 2) * 0.1, () => plancha(c, [150, RH - 30, 300, RH - 30, 320, RH, 130, RH], "#E8DCA8"));
  }
  function dibujarDentro(c, cw, ch) {
    const d = dentro,
      tt = J.t;
    const k = Math.min(cw / RW, ch / RH),
      ox = (cw - RW * k) / 2,
      oy = (ch - RH * k) / 2;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#0A0606";
    c.fillRect(0, 0, cw, ch);
    c.setTransform(k, 0, 0, k, ox, oy);
    c.save();
    c.beginPath();
    c.rect(0, 0, RW, RH);
    c.clip();
    tAhora = tt;
    giro = J.giro || 0;
    escena(c, d, tt, (x, y, k) => A.dibujarJugadorEn(c, x, y, k));
    // la luz del cuarto: oscuro con agujeros cálidos en las velas, el hogar y la forja
    dibujarLuz(c, d, tt);
    c.restore();
    // fundido al entrar, al dormir y al salir
    const f = Math.max(Math.min(1, d.fundido), d.saliendo ? 1 - d.saliendo / 0.35 : 0);
    if (f > 0) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.fillStyle = "rgba(10,6,6," + f + ")";
      c.fillRect(0, 0, cw, ch);
    }
  }
  // la pared, los muebles y la gente ordenados por el piso; jugador() dibuja a Eromash en su lugar (en el editor, nada)
  function escena(c, d, tt, jugador) {
    if (giro && window.VOL) return dibujarGirado(c, d, tt, jugador);
    dibujarPared(c, d, tt);
    const lista = [];
    d.muebles.forEach((q) => !q.oculto && lista.push({ y: q.piso ? -1 : q.y, f: () => ASSETS.dibujar(c, q.id, q.x, q.y, tt, q.o) }));
    d.gente.forEach((n) =>
      lista.push({ y: n.y, f: () => {
        const s = escala(n.y);
        c.save();
        c.translate(n.x, n.y);
        c.scale(s, s);
        c.translate(-n.x, -n.y);
        if (window.GENTE) GENTE.dibujar(c, n.id, n.x, n.y, tt, { vista: n.mira.vista, espejo: n.mira.espejo });
        else DIB.E(c, n.x, n.y - 40, 26, 40, "#E0B2B2");
        c.restore();
      } }),
    );
    if (d.ix !== undefined && jugador) lista.push({ y: d.iy, f: () => jugador(d.ix, d.iy, escala(d.iy)) });
    lista.sort((a, b) => a.y - b.y);
    lista.forEach((q) => q.f());
  }
  // ---------- el cuarto girado (todo girable) ----------
  // Con giro 0 (el juego) el cuarto se ve como un escenario de frente. Girado (el editor de cuartos con Z y X, o el
  // juego con ?giro=) se arma como una caja: el piso, las paredes que quedan atrás (la que tapa se corta, como en una
  // casa de muñecas) y todo lo de adentro en su lugar, cada mueble girado con la cámara. El piso del escenario
  // (FONDO..RH) se estira hacia el fondo para que el cuarto tenga hondura de verdad.
  let giro = 0;
  const HONDO = 2.5,
    MEDIO = (FONDO + RH) / 2,
    MU = RW / 2, // medio ancho del cuarto
    MW = ((RH - FONDO) / 2) * HONDO, // medio fondo
    ZG = 0.5, // girado se ve más chico, para que entre entero
    GENTE_K = 2.75; // el tamaño de la gente (en el escenario va de 2,3 al fondo a 3,2 adelante)
  const prCuarto = () => VOL.proyector(RW / 2, 600, giro, { s: ZG });
  // un punto del cuarto (x, y del escenario, z de alto) → dónde cae en la vista, y cuánto se achica
  function aVista(x, y, z = 0) {
    if (!giro) return [x, y - z, 1];
    const p = prCuarto()(x - MU, (y - MEDIO) * HONDO, z);
    return [p[0], p[1], ZG];
  }
  // al revés, para el piso: un punto de la vista → x, y del escenario
  function deVista(sx, sy) {
    if (!giro) return [sx, sy];
    const pr = prCuarto(),
      a = (sx - pr.x) / ZG,
      b = (sy - pr.y) / ZG / VOL.K;
    return [a * pr.co + b * pr.si + MU, (-a * pr.si + b * pr.co) / HONDO + MEDIO];
  }
  // las paredes como lienzos: la de atrás con todo (ventana, estandarte, repisa) cada cuadro; los costados solo tablas
  function lienzo(d, k, q) {
    let cv = d[k];
    if (!cv || cv.q !== q) (cv = d[k] = document.createElement("canvas")), (cv.width = RW * q), (cv.height = FONDO * q), (cv.q = q), (cv.listo = false);
    return cv;
  }
  function lienzoPared(d, tt, q, lado) {
    const cv = lienzo(d, lado ? "cvLado" : "cvAtras", q);
    if (lado && cv.listo) return cv;
    const n = cv.getContext("2d");
    n.setTransform(q, 0, 0, q, 0, 0);
    dibujarPared(n, lado ? Object.assign({}, d, { ventana: 0, estandarte: 0, repisa: 0, sinSalida: true, luzVentana: null }) : d, tt);
    cv.listo = true;
    return cv;
  }
  function pisoGirado(cc, d) {
    const r = DIB.azar(9);
    if (d.pared === "sotano") {
      const viejo = d.sotano === "viejo";
      DIB.R(cc, -MU, -MW, RW, MW * 2, viejo ? "#34322E" : "#3A2A1C");
      for (let i = 0; i < (viejo ? 70 : 40); i++) DIB.E(cc, -MU + r() * RW, -MW + r() * MW * 2, 30 + r() * 50, 14 + r() * 20, viejo ? ["#4E4C46", "#45433E", "#5A5852"][i % 3] : ["#4A3826", "#443222", "#3E2E1E"][i % 3]);
      return;
    }
    const n = 12,
      w = RW / n;
    for (let i = 0; i < n; i++) {
      DIB.R(cc, -MU + i * w, -MW, w, MW * 2, ["#3A1A10", "#341710", "#40200F"][i % 3]);
      DIB.R(cc, -MU + (i + 1) * w - 2, -MW, 3, MW * 2, "#1A0A06");
      // las juntas de cada tablón, salteadas
      DIB.R(cc, -MU + i * w, -MW + (0.2 + r() * 0.6) * MW * 2, w, 3, "#1A0A06");
    }
    // la puerta de salida: el rectángulo de luz de afuera en el borde de adelante
    if (!d.sinSalida) DIB.alfa(cc, 0.5, () => DIB.R(cc, 150 - MU, MW - 70, 170, 70, "#E8DCA8"));
  }
  function dibujarGirado(c, d, tt, jugador) {
    const pr = prCuarto(),
      g0 = VOL.cam.g,
      q = window.CALIDAD && CALIDAD.nivel !== "alta" ? 0.5 : 1;
    VOL.cam.g = giro;
    try {
      c.fillStyle = "#0A0606";
      c.fillRect(0, 0, RW, RH);
      VOL.enPiso(c, pr, (cc) => pisoGirado(cc, d));
      const atras = lienzoPared(d, tt, q),
        lado = lienzoPared(d, tt, q, true),
        tela = (cv, largo) => (cc, l, h) => cc.drawImage(cv, 0, 0, largo * q, FONDO * q, 0, -h, l, h),
        pared = (p, cv, largo) => VOL.cara(c, pr, p, "#111111", VOL.medida(largo, FONDO, tela(cv, largo))),
        H = FONDO;
      // solo se pintan las caras de adentro que miran a la cámara: las paredes de atrás
      pared([[-MU, -MW, 0], [MU, -MW, 0], [MU, -MW, H], [-MU, -MW, H]], atras, RW);
      pared([[MU, MW, 0], [-MU, MW, 0], [-MU, MW, H], [MU, MW, H]], lado, RW);
      pared([[-MU, MW, 0], [-MU, -MW, 0], [-MU, -MW, H], [-MU, MW, H]], lado, MW * 2);
      pared([[MU, -MW, 0], [MU, MW, 0], [MU, MW, H], [MU, -MW, H]], lado, MW * 2);
      // la sombra donde las paredes tocan el piso
      VOL.enPiso(c, pr, (cc) => {
        cc.strokeStyle = "rgba(0,0,0,0.35)";
        cc.lineWidth = 24;
        cc.strokeRect(-MU, -MW, RW, MW * 2);
      });
      const lista = [],
        pon = (x, y, f, abajo) => {
          const u = x - MU,
            w = (y - MEDIO) * HONDO;
          lista.push({ k: abajo ? -1e9 : pr.hondo(u, w), f: () => f(...pr(u, w, 0)) });
        };
      d.muebles.forEach((m) => {
        if (m.oculto) return;
        const a = ASSETS.LISTA[m.id] || {};
        pon(m.x, m.y, (sx, sy) => {
          if (a.piso) {
            // lo del piso (alfombra, trampilla) gira con el piso
            c.save();
            VOL.piso(c, sx, sy, giro);
            c.translate(sx, sy);
            c.scale(ZG, ZG);
            c.translate(-sx, -sy);
            ASSETS.dibujar(c, m.id, sx, sy, tt, m.o);
            c.restore();
          } else ASSETS.dibujar(c, m.id, sx, sy, tt, Object.assign({}, m.o, { esc: (m.o.esc || 1) * ZG }));
        }, m.piso || a.piso);
      });
      d.gente.forEach((n) =>
        pon(n.x, n.y, (sx, sy) => {
          const s = GENTE_K * ZG,
            mv = VOL.relativa(n.mira.vista, n.mira.espejo);
          c.save();
          c.translate(sx, sy);
          c.scale(s, s);
          c.translate(-sx, -sy);
          if (window.GENTE) GENTE.dibujar(c, n.id, sx, sy, tt, { vista: mv.vista, espejo: mv.espejo });
          else DIB.E(c, sx, sy - 40, 26, 40, "#E0B2B2");
          c.restore();
        }),
      );
      if (d.ix !== undefined && jugador) pon(d.ix, d.iy, (sx, sy) => jugador(sx, sy, GENTE_K * ZG));
      lista.sort((a, b) => a.k - b.k);
      lista.forEach((l) => l.f());
    } finally {
      VOL.cam.g = g0;
    }
  }
  // para el editor: arma la plantilla con todo a la vista (arcón y trampilla siempre, la alfombra corrida)
  let fuente = null; // en el editor: lo que se está armando, en vez de AGREGADOS
  function vista(plantilla, cuartos, casas) {
    if (!st) st = { cofres: {} };
    fuente = cuartos || null;
    fuentePlanos = casas || null;
    try {
      return vista0(plantilla);
    } finally {
      fuente = null;
      fuentePlanos = null;
    }
  }
  function vista0(plantilla) {
    const ed = { o: { sem: 0.01, v: 0 } };
    if (plantilla.startsWith("plano:")) {
      const [, pid, n] = plantilla.split(":"),
        pl = plano(pid);
      if (!pl) return armarCuarto("casa", ed, "editor", true);
      return Object.assign(armarPlanoCuarto(pid, pl, +n || 0, "editor", true), { sinSalida: +n > 0, clase: (pl.cuartos[+n] || {}).clase });
    }
    if (plantilla.startsWith("sot_")) return armarSotano("casa", ed, "editor", plantilla.slice(4));
    if (plantilla.startsWith("casa_")) return (ed.o.v = +plantilla.slice(5)), armarCuarto("casa", ed, "editor", true);
    return armarCuarto(plantilla, ed, "editor", true);
  }
  function dibujarVista(c, d, tt, conLuz, g) {
    tAhora = tt;
    giro = g || 0;
    escena(c, d, tt, null);
    if (conLuz) dibujarLuz(c, d, tt);
  }
  let tAhora = 0;
  function lucesDe(d) {
    const L0 = [];
    d.muebles.forEach((q) => {
      const s = q.o.s || 1;
      if (q.id === "hogarPiedra") L0.push({ x: q.x, y: q.y - 60 * s, r: 620, col: "255,141,113", f: 0.95 + Math.sin(tAhora * 7 + q.x) * 0.05 });
      if (q.id === "puertaPiedra" && (q.o.luces || q.o.abierta)) L0.push({ x: q.x, y: q.y - 200 * s, r: 320, col: "115,213,219", f: q.o.abierta ? 0.8 : 0.2 + q.o.luces * 0.04 });
      if (q.id === "forjaAsa") L0.push({ x: q.x, y: q.y - 180 * s, r: 700, col: "255,141,113", f: 0.9 + Math.sin(tAhora * 3) * 0.08 });
      if (q.id === "escritorioRunico") L0.push({ x: q.x - 300 * s * 0.72, y: q.y - 260 * s, r: 420, col: "255,217,138", f: 0.9 }, { x: q.x, y: q.y - 40, r: 380, col: "74,120,208", f: 0.5 });
      if (q.id === "mostrador") L0.push({ x: q.x + 40 * s, y: q.y - 220 * s, r: 460, col: "255,217,138", f: 0.9 });
      if (q.id === "mesaBanco") L0.push({ x: q.x - 120 * s, y: q.y - 190 * s, r: 340, col: "255,217,138", f: 0.85 });
      if (q.id === "escaleraMano") L0.push({ x: q.x, y: 60, r: 560, col: "255,217,138", f: 0.95 });
      if (q.id === "cajas" && q.o.vela) L0.push({ x: q.x - 14 * s, y: q.y - 220 * s, r: 320, col: "255,141,113", f: 0.8 + Math.sin(tAhora * 9 + q.x) * 0.06 });
      if (q.id === "cofreSotano") L0.push({ x: q.x, y: q.y - 80, r: q.o.abierto ? 220 : 170, col: "255,217,138", f: q.o.abierto ? 0.6 : 0.4 });
      if (q.id === "atril") L0.push({ x: q.x, y: q.y - 160, r: q.o.leido ? 160 : 260, col: "74,120,208", f: q.o.leido ? 0.35 : 0.7 });
      if (q.id === "tablaSuelta" && q.o.brillo) L0.push({ x: q.x + 44 * s, y: q.y - 120 * s, r: 120, col: "255,217,138", f: 0.4 });
      if (q.id === "yunque") L0.push({ x: q.x + 10 * s, y: q.y - 144 * s, r: 220, col: "255,141,113", f: 0.6 });
    });
    if (d.luzVentana) L0.push({ x: d.luzVentana.x, y: d.luzVentana.y, r: d.luzVentana.r, col: "200,224,240", f: 0.6 });
    if (d.repisa) L0.push({ x: d.ventana > 900 ? 500 : 1300, y: 400, r: 200, col: "74,120,208", f: 0.5 });
    return L0;
  }
  function dibujarLuz(c, d, tt) {
    // girado: cada luz va a su lugar en la caja (lo que queda arriba del piso, contra la pared de atrás)
    const luces = lucesDe(d).map((l) => {
      if (!giro) return l;
      const [x, y] = l.y < FONDO ? aVista(l.x, FONDO, FONDO - l.y) : aVista(l.x, l.y);
      return Object.assign({}, l, { x, y, r: l.r * ZG * 1.4 });
    });
    const baja = window.CALIDAD && CALIDAD.nivel === "baja";
    if (baja) {
      c.fillStyle = "rgba(10,5,5,0.32)";
      c.fillRect(0, 0, RW, RH);
      return;
    }
    // oscuridad a media resolución con agujeros suaves
    if (!d.luzCv) {
      d.luzCv = document.createElement("canvas");
      d.luzCv.width = RW / 2;
      d.luzCv.height = RH / 2;
    }
    const n = d.luzCv.getContext("2d");
    n.setTransform(0.5, 0, 0, 0.5, 0, 0);
    n.globalCompositeOperation = "source-over";
    n.clearRect(0, 0, RW, RH);
    n.fillStyle = d.sotano ? "rgba(6,4,5,0.74)" : "rgba(10,5,6,0.66)";
    n.fillRect(0, 0, RW, RH);
    n.globalCompositeOperation = "destination-out";
    luces.forEach((l) => {
      const g = n.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      g.addColorStop(0, "rgba(0,0,0," + 0.95 * l.f + ")");
      g.addColorStop(0.5, "rgba(0,0,0," + 0.55 * l.f + ")");
      g.addColorStop(1, "rgba(0,0,0,0)");
      n.fillStyle = g;
      n.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    });
    c.drawImage(d.luzCv, 0, 0, RW, RH);
    // color de cada luz encima
    c.save();
    c.globalCompositeOperation = "lighter";
    luces.forEach((l) => {
      const g = c.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * 0.7);
      g.addColorStop(0, "rgba(" + l.col + "," + 0.18 * l.f + ")");
      g.addColorStop(1, "rgba(" + l.col + ",0)");
      c.fillStyle = g;
      c.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    });
    c.restore();
    // viñeta
    const v = c.createRadialGradient(RW / 2, RH / 2, RH * 0.4, RW / 2, RH / 2, RW * 0.62);
    v.addColorStop(0, "rgba(10,6,6,0)");
    v.addColorStop(1, "rgba(10,6,6,0.6)");
    c.fillStyle = v;
    c.fillRect(0, 0, RW, RH);
  }

  // lo que juego.js llama mientras Eromash está adentro
  const sistemaDentro = { paso, dibujar: dibujarDentro, cercano: cercanoDentro };

  const sistema = {
    enLienzo: true, // también corre en un mapa de cero (ver juego.js)
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      let n = 0;
      W.COSAS.forEach((o) => {
        const tipo = o.id === "casaNordica" ? o.o.entra && "casa" : TIPO_DE[o.id];
        if (!tipo) return;
        const p = { cosa: o, tipo, clave: tipo + "_" + n++ };
        if (tipo === "casa") {
          p.plano = planoDe(o.id, o.o, o.x, o.y);
          if (p.plano) p.tipo = "plano";
        }
        puertas.push(p);
      });
      st = { cofres: {} };
    },
    alEmpezar(extra) {
      extra.dentro = Object.assign({ cofres: {} }, extra.dentro || {});
      st = extra.dentro;
      dentro = null;
      J.dentro = null;
      // ?cuarto=plantilla (el botón «Probar» del editor de interiores): arranca adentro de ese cuarto
      const m = location.search.match(/[?&]cuarto=([a-zA-Z_0-9:]+)/);
      if (m) setTimeout(() => probar(m[1]), 400);
    },
    cercanos(dar) {
      for (const p of puertas) {
        if (p.puede && !p.puede()) continue;
        const d = Math.hypot(p.cosa.x - jug.x, p.cosa.y + 40 - jug.y);
        if (d < 140) dar(d, t("in.accion_entrar", [p.tipo === "plano" ? plano(p.plano).nombre : t("in.nombre_" + p.tipo)]), () => entrar(p));
      }
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  function probar(pl) {
    if (pl.startsWith("plano:")) {
      const [, pid, n] = pl.split(":");
      if (!plano(pid)) return;
      const casa = puertas.find((q) => q.plano === pid) || puertas.find((q) => q.tipo === "casa" || q.tipo === "plano") || puertas[0];
      if (!casa) return;
      entrar(Object.assign({}, casa, { tipo: "plano", plano: pid, clave: casa.plano === pid ? casa.clave : "prueba_" + pid }));
      if (+n > 0) irA(+n, -1);
      return;
    }
    const sot = pl.startsWith("sot_"),
      clase = pl.slice(4);
    const p =
      puertas.find((q) => !sot && plantillaDe(q.cosa.id, q.cosa.o) === pl) ||
      puertas.find((q) => sot && CLASE_SOTANO[q.tipo] === clase) ||
      puertas.find((q) => q.tipo === "casa") ||
      puertas[0];
    if (!p) return;
    entrar(p);
    if (!sot) return;
    const arriba = dentro;
    arriba.vuelta = { x: 800, y: 780 };
    const s0 = armarSotano(p.tipo, p.cosa, p.clave, clase);
    dentro = Object.assign(s0, { tipo: p.tipo, puerta: p, arriba, ix: 380, iy: FONDO + 110, fundido: 1, saliendo: 0 });
  }
  // salir del cuarto directo a otro lugar (la escalera del sótano de la hospedería)
  function salirA(x, y) {
    if (!dentro) return;
    dentro = null;
    J.dentro = null;
    jug.x = x;
    jug.y = y;
    jug.mira = { vista: "N", espejo: false };
    J.cam.x = x;
    J.cam.y = y - 30;
  }
  // otro sistema suma una puerta (op.puede() dice si se puede entrar ahora) y cómo es su cuarto
  function agregarPuerta(cosa, tipo, op = {}) {
    const p = { cosa, tipo, clave: op.clave || tipo, puede: op.puede };
    puertas.push(p);
    return p;
  }
  return { puertas, agregarPuerta, CUARTOS, entrar, salirA, bajarDesde, generarPlano, plano, planoDe, CLASES, COMO, irA: (n) => dentro && dentro.plano && irA(n, -1), adentro: () => !!dentro, cuarto: () => dentro, PLANTILLAS, PAREDES, RW, RH, FONDO, escala, vista, dibujarVista, claveMueble, plantillaDe, aVista, deVista, ponerGiro: (g) => (giro = g || 0) };
})();
