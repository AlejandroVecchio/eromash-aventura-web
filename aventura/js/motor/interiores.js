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
  // ---------- cómo es cada cuarto ----------
  // muebles: { id, x, y, o, r (medio ancho que choca), accion: clave de texto, fn }
  function armarCuarto(tipo, edificio, clave) {
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
      mueble("forjaAsa", 760, FONDO + 40, { s: 1 }, 170, "in.accion_forja", examinar("in.herreria_forja"));
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
    } else {
      // las casas de la gente: cinco maneras de vivir, y no todas tienen arcón
      const conArcon = Math.floor(sem * 7) % 3 === 0,
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
    const conSotano = tipo !== "casa" || rs() < 0.7;
    if (conSotano) {
      const [tx, ty] = lugarTrampilla[tipo] || LT[v % 5];
      const escondida = tipo === "casa" && rs() < 0.5;
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
          q.x = tx - 190;
          st.cofres[clave + "_alf"] = true;
          tr.tapada = null;
          HUD.aviso(t("in.alfombra_trampilla"), "#E0B2B2");
        };
        tr.tapada = al;
        m.push(al);
      } else if (escondida) m.push({ id: "alfombra", x: tx - 190, y: ty + 8, o: { s: 0.5, movida: true }, r: 0, piso: true, quieto: true });
    }
    return { muebles: m, gente: g.map((q) => Object.assign({ mira: { vista: "S", espejo: false } }, q)), pared, ventana, estandarte, repisa };
  }

  // ---------- los sótanos ----------
  // Debajo de la trampilla: piedra húmeda, vigas bajas, la escalera de mano que sube a la luz de la casa y lo que la
  // gente guarda (o esconde). Cada sótano tiene su cofre; algunos, un atril con un libro de saber, una tabla suelta o
  // los huesos de alguien que bajó y no volvió.
  const CLASE_SOTANO = { taberna: "bodega", lindes: "archivo", herreria: "carbonera", sanacion: "despensa" };
  function armarSotano(tipo, edificio, clave) {
    const m = [];
    const sem = edificio.o.sem || 0;
    const clase = CLASE_SOTANO[tipo] || ["despensa", "escondite", "viejo"][Math.floor(DIB.azar(Math.round(sem * 1000) + 191)() * 3)];
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
      mueble(tipo === "sanacion" ? "estanteHierbas" : "estanteRollos", 980, FONDO + 15, { s: 0.9, sem }, 150, tipo === "sanacion" ? "in.accion_hierbas" : "in.accion_estante", examinar(tipo === "sanacion" ? "in.sot_despensa_hierbas" : "in.sot_despensa_estante"));
      mueble("cajas", 760, 820, { s: 0.95, vela: true }, 110, "in.accion_cajas", examinar("in.sot_despensa_cajas"));
      cofre(1330, 830, false);
    } else if (clase === "escondite") {
      mueble("huesos", 1240, FONDO + 30, { s: 1 }, 110, "in.accion_huesos", examinar("in.sot_huesos"));
      atril(720, 780, "in.libro_escondite");
      tabla(940);
      cofre(1360, 850, true);
    } else {
      mueble("armero", 760, FONDO + 20, { s: 0.9 }, 140, "in.accion_armero", examinar("in.sot_viejo_armero"));
      mueble("cajas", 560, 820, { s: 0.9, vela: true }, 100, "in.accion_cajas", examinar("in.sot_viejo_cajas"));
      mueble("barriles", 1100, FONDO + 40, { s: 0.75 }, 90, "in.accion_barriles", examinar("in.sot_viejo_barriles"));
      cofre(1360, 830, false);
    }
    return { muebles: m, gente: [], pared: "sotano", ventana: 0, estandarte: null, repisa: false, sotano: clase };
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
    a.ix = a.vuelta.x;
    a.iy = a.vuelta.y;
    a.fundido = 1;
    a.saliendo = 0;
    // la puerta de piedra se pudo abrir abajo
    dentro = a;
    jug.mira = { vista: "S", espejo: false };
  }
  function abrirCofre(q, k, rico) {
    if (st.cofres[k]) return;
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
    const cuarto = armarCuarto(p.tipo, p.cosa, p.clave);
    dentro = Object.assign(cuarto, { tipo: p.tipo, puerta: p, ix: 240, iy: 830, fundido: 1, saliendo: 0 });
    J.dentro = sistemaDentro;
    jug.atk = null;
    jug.anda = 0;
    jug.mira = { vista: "N", espejo: false };
    HUD.aviso(t("in.nombre_" + p.tipo), "#FFD98A");
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
      if (q.piso) continue;
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
    const dp = dentro.sotano ? Infinity : Math.hypot(dentro.ix - 220, dentro.iy - 860);
    if (dp < 150) prueba(dp, t("in.accion_salir"), salir);
    for (const q of dentro.muebles) {
      if (!q.fn || q.tapada) continue;
      if ((q.id === "arconCasa" || q.id === "cofreSotano") && q.o.abierto) continue;
      if (q.id === "tablaSuelta" && q.o.abierta) continue;
      if (q.piso) {
        const d = Math.hypot(dentro.ix - q.x, (dentro.iy - (q.y - 20)) * 1.4) - q.r * 0.6;
        if (d < 90) prueba(Math.max(0, d), t(q.texto ? q.texto(q) : q.accion), () => q.fn(q));
        continue;
      }
      const fondo = q.y < FONDO + 80,
        dx = Math.max(0, Math.abs(dentro.ix - q.x) - q.r * 0.8),
        dy = fondo ? Math.max(0, dentro.iy - (q.y + 70)) : Math.abs(dentro.iy - q.y);
      const d = Math.hypot(dx, dy);
      if (d < 110) prueba(d, t(q.accion), () => q.fn(q));
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
      if (!dentro.sotano && dentro.iy > RH - 50 && dentro.ix < 330 && e.y > 0.5) salir();
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
  // el sótano: piedra húmeda, vigas bajas sobre postes y piso de tierra con lajas
  function dibujarSotano(c, d, tt) {
    const r = DIB.azar(d.sotano.length * 31 + 5);
    c.fillStyle = "#0C0909";
    c.fillRect(0, 0, RW, RH);
    for (let fila = 0; fila * 70 < FONDO + 40; fila++) {
      const y = FONDO - fila * 70;
      for (let x = -60 + (fila % 2) * 70; x < RW + 60; ) {
        const w = 110 + r() * 80,
          tono = ["#2A2426", "#252022", "#2E2729", "#221C1E"][Math.floor(r() * 4)];
        DIB.P(c, [x + 6, y - 4, x + w - 6, y - 6 + r() * 4, x + w - 2, y - 64 + r() * 6, x + 4, y - 66 + r() * 6], tono);
        DIB.P(c, [x + 6, y - 60, x + w - 6, y - 62, x + w - 10, y - 66, x + 10, y - 66], "#3A3234");
        x += w;
      }
    }
    // humedad que baja por la piedra
    for (let k = 0; k < 7; k++) {
      const x = 120 + k * 230 + r() * 60;
      DIB.alfa(c, 0.35, () => DIB.P(c, [x, 0, x + 26, 0, x + 18 + r() * 10, 260 + r() * 200, x + 6, 300 + r() * 160], "#141A18"));
    }
    // postes y vigas bajas
    [520, 1100].forEach((x) => {
      DIB.P(c, [x - 22, 120, x + 22, 120, x + 24, FONDO, x - 24, FONDO], "#2A0806");
      DIB.P(c, [x + 10, 120, x + 22, 120, x + 24, FONDO, x + 12, FONDO], "#3E0E08");
    });
    plancha(c, [0, 70, RW, 58, RW, 126, 0, 138], "#2A0806");
    plancha(c, [0, 126, RW, 114, RW, 126, 0, 138], "#120403");
    // telarañas en las esquinas
    DIB.alfa(c, 0.4, () => {
      for (let i = 0; i < 5; i++) DIB.L(c, 0, 140, 70 + i * 26, 140 + 70 - i * 12, "#B5A5A0", 1.2);
      for (let i = 0; i < 3; i++) c.beginPath(), (c.strokeStyle = "#B5A5A0"), (c.lineWidth = 1), c.arc(0, 140, 40 + i * 30, 0, Math.PI / 2), c.stroke();
    });
    // el piso: tierra apisonada con lajas
    plancha(c, [200, FONDO, 1400, FONDO, 1640, RH, -40, RH], "#24170F");
    for (let i = 0; i < 46; i++) {
      const u = r(),
        v = r(),
        y = FONDO + 14 + v * (RH - FONDO - 20),
        a = (y - FONDO) / (RH - FONDO),
        x = 200 - a * 240 + u * (1200 + a * 480),
        w = 50 + a * 50 + r() * 30,
        hh = 12 + a * 18;
      DIB.P(c, [x - w, y, x - w * 0.8, y - hh, x + w * 0.8, y - hh * 1.1, x + w, y + 2], ["#3A2E28", "#342823", "#2E241F"][i % 3]);
    }
    plancha(c, [200, FONDO, 1400, FONDO, 1410, FONDO + 16, 190, FONDO + 16], "rgba(0,0,0,0.55)");
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
        h = LUZ.hora(A.H.E.tiempo),
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
    DIB.alfa(c, 0.5 + Math.sin(tt * 2) * 0.1, () => plancha(c, [150, RH - 30, 300, RH - 30, 320, RH, 130, RH], "#E8DCA8"));
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
    dibujarPared(c, d, tt);
    // muebles, gente y Eromash ordenados por el piso
    const lista = [];
    d.muebles.forEach((q) => lista.push({ y: q.piso ? -1 : q.y, f: () => ASSETS.dibujar(c, q.id, q.x, q.y, tt, q.o) }));
    d.gente.forEach((n) =>
      lista.push({ y: n.y, f: () => {
        const s = escala(n.y);
        c.save();
        c.translate(n.x, n.y);
        c.scale(s, s);
        c.translate(-n.x, -n.y);
        GENTE.dibujar(c, n.id, n.x, n.y, tt, { vista: n.mira.vista, espejo: n.mira.espejo });
        c.restore();
      } }),
    );
    lista.push({ y: d.iy, f: () => A.dibujarJugadorEn(c, d.ix, d.iy, escala(d.iy)) });
    lista.sort((a, b) => a.y - b.y);
    lista.forEach((q) => q.f());
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
  function lucesDe(d) {
    const L0 = [];
    d.muebles.forEach((q) => {
      const s = q.o.s || 1;
      if (q.id === "hogarPiedra") L0.push({ x: q.x, y: q.y - 60 * s, r: 620, col: "255,141,113", f: 0.95 + Math.sin(J.t * 7 + q.x) * 0.05 });
      if (q.id === "puertaPiedra" && (q.o.luces || q.o.abierta)) L0.push({ x: q.x, y: q.y - 200 * s, r: 320, col: "115,213,219", f: q.o.abierta ? 0.8 : 0.2 + q.o.luces * 0.04 });
      if (q.id === "forjaAsa") L0.push({ x: q.x, y: q.y - 180 * s, r: 700, col: "255,141,113", f: 0.9 + Math.sin(J.t * 3) * 0.08 });
      if (q.id === "escritorioRunico") L0.push({ x: q.x - 300 * s * 0.72, y: q.y - 260 * s, r: 420, col: "255,217,138", f: 0.9 }, { x: q.x, y: q.y - 40, r: 380, col: "74,120,208", f: 0.5 });
      if (q.id === "mostrador") L0.push({ x: q.x + 40 * s, y: q.y - 220 * s, r: 460, col: "255,217,138", f: 0.9 });
      if (q.id === "mesaBanco") L0.push({ x: q.x - 120 * s, y: q.y - 190 * s, r: 340, col: "255,217,138", f: 0.85 });
      if (q.id === "escaleraMano") L0.push({ x: q.x, y: 60, r: 560, col: "255,217,138", f: 0.95 });
      if (q.id === "cajas" && q.o.vela) L0.push({ x: q.x - 14 * s, y: q.y - 220 * s, r: 320, col: "255,141,113", f: 0.8 + Math.sin(J.t * 9 + q.x) * 0.06 });
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
    const luces = lucesDe(d);
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
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      let n = 0;
      W.COSAS.forEach((o) => {
        const tipo = o.id === "casaNordica" ? o.o.entra && "casa" : TIPO_DE[o.id];
        if (!tipo) return;
        puertas.push({ cosa: o, tipo, clave: tipo + "_" + n++ });
      });
      st = { cofres: {} };
    },
    alEmpezar(extra) {
      extra.dentro = Object.assign({ cofres: {} }, extra.dentro || {});
      st = extra.dentro;
      dentro = null;
      J.dentro = null;
    },
    cercanos(dar) {
      for (const p of puertas) {
        const d = Math.hypot(p.cosa.x - jug.x, p.cosa.y + 40 - jug.y);
        if (d < 140) dar(d, t("in.accion_entrar", [t("in.nombre_" + p.tipo)]), () => entrar(p));
      }
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
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
  return { puertas, salirA, adentro: () => !!dentro, cuarto: () => dentro };
})();
