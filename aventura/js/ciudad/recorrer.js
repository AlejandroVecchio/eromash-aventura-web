// ---------- recorrer la capital con Eromash (módulo RECORRER25) ----------
// Lo que hace que Eikholt valga la pena caminarla y no solo cruzarla para un encargo: Eromash camina por acciones
// (CONTROLES) chocando con lo que hay; cerca de algo que cuenta una historia aparece «E · Mirar» y se lee la
// curiosidad (se van juntando, sin marcas de misión: solo un destello en el piso cuando estás cerca); hay cofres
// escondidos en rincones; el nombre del barrio aparece al entrar. La ciudad reacciona: los vecinos lo miran pasar y a
// veces dicen algo, los chicos se esconden y espían, Gudrun deja de tararear cuando pasa, la piedra dormida del Ting casi
// contesta. Y la vida de todos los días: gallinas que se desbandan, gatos que huyen, cuervos que levantan vuelo, un
// perro que lo sigue, humo de las chimeneas, chispas de la forja, hojas del Roble, luciérnagas de noche, mariposas de
// día, niebla del río al alba, sombras de nubes y bandadas. Todo lo caro se apaga con CALIDAD.
//   RECORRER25.iniciar({ plano, libre, gente }) · actualizar(dt, t, h, cam, objetivo) · extra(cam, t) → [{ x, y, f }]
//   · piso(c, cam, t, h) (en el piso girado) · encima(c, cam, cw, ch, t, h) (en la pantalla, al final)
window.RECORRER25 = (function () {
  "use strict";
  const { P, E, L, alfa, azar, halo, sombra } = DIB;
  const TAU = Math.PI * 2;
  const tr = (k, v) => I18N.t(k, v);
  const caro = () => !window.CALIDAD || CALIDAD.nivel !== "baja";
  const alta = () => !window.CALIDAD || CALIDAD.nivel === "alta";

  let plano = null,
    libre = () => true,
    gente = [];
  const ero = { x: 0, y: 0, vista: { vista: "S", espejo: false }, anda: 0, paso: 0, huellas: [] };
  const vistos = new Set(),
    abiertos = new Set();
  let cerca = null, // la curiosidad o el cofre más cercano a mano
    tarjeta = null, // la que está abierta { titulo, texto, nueva }
    zona = null,
    cartelZona = { texto: "", t: 0 };
  const globos = []; // lo que dicen los vecinos: { p, texto, t }
  let enfriaGlobo = 0;
  const animales = [];
  const humo = [],
    chispas = [],
    hojas = [];
  let fuentesHumo = [],
    forjas = [],
    luciernagas = [],
    mariposas = [],
    bandada = null,
    nubes = [];
  let divTarjeta = null;
  // en el juego (sistema EIKHOLT): el motor lee los controles y mueve a Eromash, lo que hay a mano se ofrece con E por el
  // HUD de siempre (aMano) y lo encontrado se guarda en la partida (estado / cargar)
  let juego = false,
    dibujarEro = null,
    alCofre = null,
    antes = null;

  // ---------- los barrios: el más cercano dentro de su radio pone su nombre al entrar ----------
  let ZONAS = [];

  // ---------- quién dice qué: los vecinos con nombre tienen sus frases (pj.<nombre>_0..3), los demás las del barrio ----------
  const FRASES_GENERICAS = { guardia: "ek.dice_guardia_", trabajador: "ek.dice_vecino_", trabajador2: "ek.dice_vecina_", trabajador3: "ek.dice_viajero_", herido: "ek.dice_vecina_", svanhild: null, eydis: null, orm: null };
  const CHICOS = { tyra: 1, eirik: 1, arvid: 1 };
  const LINEAS_ROL = { vecino: 8, vecina: 8, nino: 5, vendedor: 6, recluta: 4, viajero: 6, pescador: 4, guardia: 5, farolero: 4 };
  function frase(id, n, rol) {
    n = Math.abs(Math.floor(n)) || 0;
    if (rol && LINEAS_ROL[rol]) return tr("ek.dice_" + rol + "_" + (n % LINEAS_ROL[rol]));
    const pre = FRASES_GENERICAS[id];
    if (pre === null) return null;
    const k = pre ? pre + (n % (pre.includes("guardia") ? 5 : pre.includes("viajero") ? 6 : 8)) : "pj." + id + "_" + (n % 4);
    const s = tr(k);
    return s === k ? null : s;
  }

  function iniciar(op) {
    plano = op.plano;
    libre = op.libre;
    gente = op.gente;
    juego = !!op.juego;
    dibujarEro = op.dibujarEro || null;
    alCofre = op.alCofre || null;
    const L0 = plano.lugares,
      A0 = plano.anclas,
      M = plano.M;
    ero.x = op.inicio ? op.inicio[0] : 0;
    ero.y = op.inicio ? op.inicio[1] : 4000;
    ZONAS = [
      ["ting", plano.ting, 900],
      ["plaza", [0, 0], 3150],
      ["oficios", L0.herreria, 2400],
      ["oficios", L0.carpinteria, 2000],
      ["oficios", L0.curtiembre, 1600],
      ["lindes", L0.lindes, 1700],
      ["hongo", L0.hongo, 1500],
      ["guardia", L0.entrenamiento, 1600],
      ["guardia", L0.guardia, 1500],
      ["caravanas", L0.forasteros, 1700],
      ["caravanas", L0.corral, 1700],
      ["sanacion", L0.sanacion, 1900],
      ["sanacion", L0.hospederia, 1500],
      ["muelle", A0.muelle, 1500],
      ["sur", A0.puerta_sur, 1300],
    ];
    // las gallinas cerca de los gallineros, el corral y las huertas; los gatos en las puertas; los cuervos en el Roble y
    // las piedras; un perro del corral
    const r = azar(4041);
    const gallineros = plano.cosas.filter((o) => o.id === "gallinero");
    for (const g of gallineros)
      for (let i = 0; i < 7; i++) animales.push({ tipo: "gallina", x: g.x + (r() - 0.5) * 500, y: g.y + 120 + r() * 300, cx: g.x, cy: g.y + 200, vx: 0, vy: 0, col: r() < 0.5 ? "#F2ECEC" : r() < 0.5 ? "#A0703E" : "#3A2A1E", f: r() * 9, susto: 0 });
    const casas = plano.cosas.filter((o) => /^casa\d+$/.test(o.nombre || ""));
    for (let i = 0; i < casas.length; i += 7) {
      const o = casas[i],
        d = (o.casa.D || 300) / 2 + 60;
      animales.push({ tipo: "gato", x: o.x - d * Math.sin(o.ry) + 80, y: o.y + d * Math.cos(o.ry), vx: 0, vy: 0, col: ["#2A2420", "#8A6A4A", "#5E5A56", "#D8C8B0"][i % 4], f: r() * 9, susto: 0 });
    }
    for (let i = 0; i < 16; i++) {
      const a = r() * TAU,
        d = i < 10 ? 1150 + r() * 120 : 2200 + r() * 600;
      animales.push({ tipo: "cuervo", x: Math.cos(a) * d, y: Math.sin(a) * d, z: 0, vx: 0, vy: 0, vz: 0, f: r() * 9, vuela: 0 });
    }
    if (L0.corral) animales.push({ tipo: "perro", x: L0.corral[0] - 400, y: L0.corral[1] + 300, vx: 0, vy: 0, col: "#8A6440", f: 0, sigue: 0 });
    // el humo: las chimeneas de las casas con su lugar de verdad (la chimenea de la ficha llevada al mundo)
    fuentesHumo = [];
    for (const o of plano.cosas) {
      if (o.tipo !== "casa" || !o.casa.ficha) continue;
      const f = o.casa.ficha;
      if (!f.chimenea || f.tapiada) continue;
      const u = f.chimenea.u * f.W,
        w = f.chimenea.w * f.D,
        co = Math.cos(o.ry),
        si = Math.sin(o.ry);
      fuentesHumo.push({ x: o.x + u * co - w * si, y: o.y + u * si + w * co, z: (o.casa.alto || 300) + 30, sem: (o.x * 7 + o.y) % 97 });
    }
    forjas = plano.cosas.filter((o) => o.id === "herreriaAsa" || o.id === "chimeneaHerreria").map((o) => ({ x: o.x, y: o.y, z: o.id === "chimeneaHerreria" ? 520 : 90, chimenea: o.id === "chimeneaHerreria" }));
    for (const f of forjas) if (f.chimenea) fuentesHumo.push({ x: f.x, y: f.y, z: f.z, sem: 3, negro: true });
    // luciérnagas sobre el río y las huertas; mariposas en las huertas y las hierbas
    const rio = plano.rio.pts;
    luciernagas = [];
    for (let i = 0; i < 70; i++) {
      const j = Math.floor(r() * (rio.length - 1)),
        s = r();
      luciernagas.push({ x: rio[j][0] + (rio[j + 1][0] - rio[j][0]) * s + (r() - 0.5) * 1600, y: rio[j][1] + (rio[j + 1][1] - rio[j][1]) * s + (r() - 0.5) * 1600, f: r() * 9 });
    }
    const huertas = plano.cosas.filter((o) => o.id === "huerta");
    for (const hu of huertas) for (let i = 0; i < 3; i++) luciernagas.push({ x: hu.x + (r() - 0.5) * 400, y: hu.y + (r() - 0.5) * 400, f: r() * 9 });
    mariposas = huertas.filter((_, i) => i % 2 === 0).map((hu, i) => ({ x: hu.x, y: hu.y, cx: hu.x, cy: hu.y, col: ["#FFD98A", "#F2ECEC", "#FF8D71", "#E0B2B2"][i % 4], f: r() * 9 }));
    nubes = Array.from({ length: 5 }, (_, i) => ({ x: (r() - 0.5) * 18000, y: (r() - 0.5) * 18000, rx: 1800 + r() * 1600, ry: 1100 + r() * 900, f: i }));
    armarTarjeta();
  }

  // ---------- la tarjeta de lo que se mira (HTML: se lee mejor y se adapta a la pantalla) ----------
  function armarTarjeta() {
    if (divTarjeta || !document.body) return;
    const st = document.createElement("style");
    st.textContent = `
      #tarjetaCur { position: fixed; left: 50%; bottom: 7%; transform: translateX(-50%); width: min(520px, calc(100% - 32px)); box-sizing: border-box;
        background: rgba(17,17,17,0.92); border: 1px solid #5E130D; border-top: 3px solid #9C2315; padding: 16px 20px 14px; color: #F2ECEC;
        font-family: "DM Sans", system-ui, sans-serif; display: none; z-index: 5; }
      #tarjetaCur .nueva { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #73D5DB; margin-bottom: 4px; }
      #tarjetaCur h2 { margin: 0 0 8px; font-size: 18px; color: #FFD98A; font-weight: 600; text-wrap: balance; }
      #tarjetaCur p { margin: 0; font-size: 14px; line-height: 1.5; color: #E0B2B2; }
      #tarjetaCur .pie { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; font-size: 12px; color: #9A8A86; gap: 12px; }
      #tarjetaCur.enJuego { bottom: auto; top: 16%; }
      #tarjetaCur button { font: inherit; background: #2A1E1A; color: #F2ECEC; border: 1px solid #5E130D; padding: 5px 12px; cursor: pointer; }`;
    document.head.appendChild(st);
    divTarjeta = document.createElement("div");
    divTarjeta.id = "tarjetaCur";
    divTarjeta.className = juego ? "ui enJuego" : "ui"; // en el juego, arriba: abajo están la barra de acciones y el retrato
    divTarjeta.innerHTML = '<div class="nueva"></div><h2></h2><p></p><div class="pie"><span></span><button type="button"></button></div>';
    divTarjeta.querySelector("button").addEventListener("click", cerrar);
    document.body.appendChild(divTarjeta);
  }
  function mostrarTarjeta() {
    if (!divTarjeta) return;
    if (!tarjeta) {
      divTarjeta.style.display = "none";
      return;
    }
    divTarjeta.querySelector(".nueva").textContent = tarjeta.nueva ? tr(tarjeta.cofre ? "ci.cofre_hallado" : "ci.nueva") : "";
    divTarjeta.querySelector("h2").textContent = tarjeta.titulo;
    divTarjeta.querySelector("p").textContent = tarjeta.texto;
    divTarjeta.querySelector(".pie span").textContent = cuenta();
    divTarjeta.querySelector("button").textContent = tr("ci.cerrar") + "  ·  " + CONTROLES.glifo("interactuar");
    divTarjeta.style.display = "block";
  }
  const cuenta = () => tr("ci.curiosidades") + " " + vistos.size + "/" + totalCur() + "   ·   " + tr("ci.cofres") + " " + abiertos.size + "/" + plano.cofres.length;
  const totalCur = () => new Set(plano.curiosidades.map((c) => c.clave)).size;
  function cerrar() {
    tarjeta = null;
    mostrarTarjeta();
    CONTROLES.soltar();
  }

  // ---------- cada cuadro ----------
  function actualizar(dt, t, h, cam, objetivo) {
    if (!juego) CONTROLES.actualizar();
    // la tarjeta abierta: E la cierra, alejarse también
    if (tarjeta) {
      if (CONTROLES.recien("interactuar") || CONTROLES.recien("pausa")) cerrar();
      else if (Math.hypot(tarjeta.x - ero.x, tarjeta.y - ero.y) > tarjeta.r + 500) cerrar();
    }
    // caminar relativo a la cámara, chocando (deslizándose por la pared si se puede)
    const ej = juego ? { x: 0, y: 0 } : CONTROLES.eje();
    const corre = !juego && CONTROLES.pulsado("correr");
    if (juego) {
      // el motor ya lo movió: solo las huellas y cerrar la tarjeta si se va caminando
      if (antes && Math.hypot(ero.x - antes[0], ero.y - antes[1]) > 0.5) {
        const dx = ero.x - antes[0],
          dy = ero.y - antes[1],
          p0 = ero.paso;
        ero.paso += dt * (ero.anda === 2 ? 12 : 8);
        if (Math.floor(ero.paso / Math.PI) !== Math.floor(p0 / Math.PI)) {
          const enTierra = Math.hypot(ero.x, ero.y) > plano.plaza + 200 && plano.aCalle(ero.x, ero.y) > 40;
          if (enTierra || plano.aCalle(ero.x, ero.y) < 10) ero.huellas.push({ x: ero.x, y: ero.y, a: Math.atan2(dy, dx), lado: ero.huellas.length % 2 ? 1 : -1, t });
          if (ero.huellas.length > 60) ero.huellas.shift();
        }
        if (tarjeta && Math.hypot(dx, dy) > 1) cerrar();
      }
      antes = [ero.x, ero.y];
    } else if (Math.hypot(ej.x, ej.y) > 0.05) {
      const g = cam.g,
        v = (corre ? 430 : 260) * dt;
      const dx = (ej.x * Math.cos(g) + ej.y * Math.sin(g)) * v,
        dy = (-ej.x * Math.sin(g) + ej.y * Math.cos(g)) * v;
      const dentro = (x, y) => Math.hypot(x, y) < plano.R_FUERA - 300;
      if (libre(ero.x + dx, ero.y + dy) && dentro(ero.x + dx, ero.y + dy)) {
        ero.x += dx;
        ero.y += dy;
      } else if (libre(ero.x + dx, ero.y) && dentro(ero.x + dx, ero.y)) ero.x += dx;
      else if (libre(ero.x, ero.y + dy) && dentro(ero.x, ero.y + dy)) ero.y += dy;
      ero.vista = VIKINGO.vista(ej.x, ej.y, ero.vista);
      ero.anda = corre ? 2 : 1;
      ero.paso += dt * (corre ? 12 : 8);
      // huellas en la tierra (no en el adoquín ni en la plaza), que se borran solas
      if (Math.floor(ero.paso / Math.PI) !== Math.floor((ero.paso - dt * (corre ? 12 : 8)) / Math.PI)) {
        const enTierra = Math.hypot(ero.x, ero.y) > plano.plaza + 200 && plano.aCalle(ero.x, ero.y) > 40;
        if (enTierra || plano.aCalle(ero.x, ero.y) < 10) ero.huellas.push({ x: ero.x, y: ero.y, a: Math.atan2(dy, dx), lado: ero.huellas.length % 2 ? 1 : -1, t });
        if (ero.huellas.length > 60) ero.huellas.shift();
      }
      objetivo.x = ero.x;
      objetivo.y = ero.y;
      if (tarjeta) cerrar();
    } else ero.anda = 0;
    // lo que hay a mano: la curiosidad o el cofre más cercano dentro de su radio
    cerca = null;
    let mejor = 1e9;
    for (const cu of plano.curiosidades) {
      const d = Math.hypot(cu.x - ero.x, cu.y - ero.y);
      if (d < cu.r && d < mejor) {
        mejor = d;
        cerca = { tipo: "cur", cu };
      }
    }
    for (const co of plano.cofres) {
      if (abiertos.has(co.n)) continue;
      const d = Math.hypot(co.x - ero.x, co.y - ero.y);
      if (d < 220 && d < mejor) {
        mejor = d;
        cerca = { tipo: "cofre", co };
      }
    }
    if (cerca && !tarjeta && !juego && CONTROLES.recien("interactuar")) abrir(cerca);
    // el barrio: el primero (el más chico gana: van ordenados de lo puntual a lo grande) que contenga a Eromash
    let z = null;
    for (const [k, c0, r] of ZONAS) if (c0 && Math.hypot(c0[0] - ero.x, c0[1] - ero.y) < r) { z = k; break; }
    if (z !== zona) {
      if (z) cartelZona = { texto: tr("ci.lugar_" + z), t: 0 };
      zona = z;
    }
    cartelZona.t += dt;
    // la piedra dormida casi contesta: sube despacio si Eromash se queda cerca, baja si se va
    const dT = Math.hypot(plano.ting[0] - ero.x, plano.ting[1] - ero.y);
    const quiere = dT < 520 ? 1 - dT / 520 : 0;
    TING25.estado.despierta += (quiere - TING25.estado.despierta) * Math.min(1, dt * (quiere > TING25.estado.despierta ? 0.5 : 1.5));
    reaccionar(dt, t, h);
    vida(dt, t, h);
  }

  function abrir(cc) {
    if (cc.tipo === "cur") {
      const nueva = !vistos.has(cc.cu.clave);
      vistos.add(cc.cu.clave);
      tarjeta = { titulo: tr("ci.cur_" + cc.cu.clave + "_t"), texto: tr("ci.cur_" + cc.cu.clave), nueva, x: cc.cu.x, y: cc.cu.y, r: cc.cu.r };
    } else {
      abiertos.add(cc.co.n);
      // el cofre queda abierto (su volumen cambia por el abierto)
      const o = plano.cosas.find((q) => q.id === "cofre" && Math.abs(q.x - cc.co.x) < 1 && Math.abs(q.y - cc.co.y) < 1);
      if (o) o.casa = ENSERES25.cofre(cc.co.n + 1, { abierto: true });
      if (alCofre) alCofre(cc.co.n);
      tarjeta = { titulo: tr("ci.cofre_" + cc.co.n + "_t"), texto: tr("ci.cofre_" + cc.co.n), nueva: true, cofre: true, x: cc.co.x, y: cc.co.y, r: 220 };
    }
    mostrarTarjeta();
    CONTROLES.soltar();
  }

  // ---------- la gente reacciona a Eromash ----------
  function reaccionar(dt, t, h) {
    enfriaGlobo -= dt;
    for (const p of gente) {
      if (p.visible === false) continue;
      const dx = ero.x - p.x,
        dy = ero.y - p.y,
        d = Math.hypot(dx, dy);
      p.miraA = null;
      // los chicos se esconden si él llega corriendo: corren lejos y después espían desde donde quedaron (caminando
      // despacio se dejan alcanzar, y se los puede invitar a las escondidas: ESCONDIDAS25)
      if (CHICOS[p.id] && !p.escondido) {
        if (d < 380 && !p.huye && ero.anda === 2) {
          p.huye = 1.6;
          p.vxAntes = p.vx;
          p.vyAntes = p.vy;
          p.vx = (-dx / d) * 230;
          p.vy = (-dy / d) * 230;
        }
        if (p.huye) {
          p.huye -= dt;
          if (p.huye <= 0) {
            p.huye = d < 700 ? 0.01 : 0;
            p.vx = 0;
            p.vy = 0;
          }
        }
        if (!p.huye && d < 1100 && !p.vx && !p.vy) p.miraA = [dx, dy];
        continue;
      }
      // los del hnefatafl miran el tablero y comentan la partida si él anda cerca
      if (p.tafl) {
        p.miraA = [p.tafl[0] - p.x, p.tafl[1] - p.y];
        if (d < 480 && enfriaGlobo <= 0 && !globos.length && !api.callados && (p.pregon || 0) <= t) {
          globos.push({ p, texto: tr("ek.tafl_dice_" + (Math.floor(t * 0.23 + p.x) % 6 + 6) % 6), t: 0 });
          p.pregon = t + 20;
          enfriaGlobo = 5;
        }
        continue;
      }
      // Gudrun: tararea junto al pozo y se calla cuando él está cerca
      if (p.canta) p.callada = d < 520;
      // los que están quietos lo miran pasar; Håkon lo mira desde todo el campo
      const radio = p.id === "hakon" ? 1600 : 520;
      if (d < radio && !p.vx && !p.vy) p.miraA = [dx, dy];
      // los puesteros pregonan lo suyo cuando él pasa cerca, aunque vaya caminando (cada uno cada tanto)
      if (p.puesto && d < 560 && d > 120 && enfriaGlobo <= 0 && !globos.length && !api.callados && (p.pregon || 0) <= t) {
        globos.push({ p, texto: tr("ek.pregon_" + p.puesto + "_" + (Math.floor(t * 0.31 + p.x) & 3)), t: 0 });
        p.pregon = t + 30;
        enfriaGlobo = 4;
        continue;
      }
      // a veces dicen algo si se queda al lado (una frase a la vez en toda la ciudad)
      if (d < 230 && enfriaGlobo <= 0 && !ero.anda && !globos.length && !api.callados) {
        const s = frase(p.id, Math.floor(t * 0.37 + p.x), p.rol);
        if (s) {
          globos.push({ p, texto: s, t: 0 });
          enfriaGlobo = 6;
        }
      }
    }
    if (api.callados) globos.length = 0; // mientras Eromash habla con alguien, nadie más dice nada
    for (let i = globos.length - 1; i >= 0; i--) {
      globos[i].t += dt;
      if (globos[i].t > 4.5 || Math.hypot(globos[i].p.x - ero.x, globos[i].p.y - ero.y) > 600) globos.splice(i, 1);
    }
  }

  // ---------- los animales, el humo, las chispas y las hojas ----------
  function vida(dt, t, h) {
    const dia = h >= 6 && h < 20;
    for (const a of animales) {
      const dx = a.x - ero.x,
        dy = a.y - ero.y,
        d = Math.hypot(dx, dy) || 1;
      if (a.tipo === "gallina") {
        if (d < 230) a.susto = 1.2;
        if (a.susto > 0) {
          a.susto -= dt;
          a.vx = (dx / d) * 260;
          a.vy = (dy / d) * 260;
        } else if (Math.random() < dt * 0.8) {
          // picotean y dan pasitos cerca de su gallinero
          const ax = a.cx - a.x,
            ay = a.cy - a.y,
            vuelta = Math.hypot(ax, ay) > 450;
          a.vx = vuelta ? ax * 0.3 : (Math.random() - 0.5) * 90;
          a.vy = vuelta ? ay * 0.3 : (Math.random() - 0.5) * 90;
        } else if (Math.random() < dt) a.vx = a.vy = 0;
      } else if (a.tipo === "gato") {
        if (d < 260 && !a.susto) a.susto = 1.4;
        if (a.susto > 0) {
          a.susto -= dt;
          a.vx = (dx / d) * 300;
          a.vy = (dy / d) * 300;
          if (a.susto <= 0) a.vx = a.vy = 0;
        }
      } else if (a.tipo === "cuervo") {
        if (!a.vuela && d < 320) {
          a.vuela = 1;
          a.vz = 220;
          a.vx = (dx / d) * 260 + (Math.random() - 0.5) * 100;
          a.vy = (dy / d) * 260 + (Math.random() - 0.5) * 100;
        }
        if (a.vuela) {
          a.z += a.vz * dt;
          a.vz = Math.max(0, a.vz - dt * 40);
          a.vuela += dt;
          // después de un rato bajan en otro lado
          if (a.vuela > 6) {
            a.z -= dt * 260;
            if (a.z <= 0) {
              a.z = 0;
              a.vuela = 0;
              a.vx = a.vy = 0;
            }
          }
        }
      } else if (a.tipo === "perro") {
        // el perro del corral: si Eromash se queda cerca un momento, lo sigue un rato
        if (d < 300) a.sigue = Math.min(25, a.sigue + dt * 4);
        else a.sigue = Math.max(0, a.sigue - dt);
        if (a.sigue > 3 && d > 160) {
          a.vx = (-dx / d) * Math.min(420, d * 1.4);
          a.vy = (-dy / d) * Math.min(420, d * 1.4);
        } else a.vx = a.vy = 0;
      }
      if (a.vx || a.vy) {
        const nx = a.x + a.vx * dt,
          ny = a.y + a.vy * dt;
        if (a.tipo === "cuervo" && a.vuela) {
          a.x = nx;
          a.y = ny;
        } else if (libre(nx, ny)) {
          a.x = nx;
          a.y = ny;
        } else {
          a.vx = -a.vx * 0.5;
          a.vy = -a.vy * 0.5;
        }
        a.rumbo = Math.atan2(a.vy, a.vx);
      }
    }
    // el humo de las chimeneas (de noche menos: los fuegos de cocina se apagan) y el negro de la forja
    if (caro()) {
      const cada = alta() ? 1 : 2;
      for (let i = 0; i < fuentesHumo.length; i += cada) {
        const f = fuentesHumo[i];
        if (Math.random() < dt * (f.negro ? 2.5 : dia ? 0.55 : 0.25)) humo.push({ x: f.x, y: f.y, z: f.z, r: 10, a: 0.3, negro: f.negro, v: 0 });
      }
      for (const f of forjas) if (!f.chimenea && dia && Math.random() < dt * 9) chispas.push({ x: f.x + (Math.random() - 0.5) * 60, y: f.y + (Math.random() - 0.5) * 40, z: f.z, vz: 120 + Math.random() * 160, vx: (Math.random() - 0.5) * 80, vida: 0.6 + Math.random() * 0.6 });
      // las hojas del Roble que caen sobre la plaza
      if (Math.random() < dt * 2.2) {
        const a = Math.random() * TAU,
          d = Math.sqrt(Math.random()) * 2600;
        hojas.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, z: 900 + Math.random() * 500, f: Math.random() * 9, col: ["#C8A040", "#A8782E", "#8A9A3A", "#C86A2E"][Math.floor(Math.random() * 4)] });
      }
    }
    for (let i = humo.length - 1; i >= 0; i--) {
      const s = humo[i];
      s.z += dt * 50;
      s.x += dt * 30;
      s.r += dt * 7;
      s.a -= dt * 0.075;
      if (s.a <= 0) humo.splice(i, 1);
    }
    if (humo.length > 500) humo.splice(0, humo.length - 500);
    for (let i = chispas.length - 1; i >= 0; i--) {
      const s = chispas[i];
      s.z += s.vz * dt;
      s.vz -= dt * 260;
      s.x += s.vx * dt;
      s.vida -= dt;
      if (s.vida <= 0) chispas.splice(i, 1);
    }
    for (let i = hojas.length - 1; i >= 0; i--) {
      const s = hojas[i];
      s.z -= dt * 60;
      s.x += Math.sin(t * 1.3 + s.f) * dt * 50 + dt * 15;
      if (s.z <= 0) hojas.splice(i, 1);
    }
    if (hojas.length > 120) hojas.splice(0, hojas.length - 120);
    // de día, de vez en cuando cruza una bandada
    if (!bandada && dia && Math.random() < dt * 0.04) {
      const a = Math.random() * TAU;
      bandada = { x: ero.x - Math.cos(a) * 4000, y: ero.y - Math.sin(a) * 4000, vx: Math.cos(a) * 700, vy: Math.sin(a) * 700, t: 0 };
    }
    if (bandada) {
      bandada.x += bandada.vx * dt;
      bandada.y += bandada.vy * dt;
      bandada.t += dt;
      if (bandada.t > 12) bandada = null;
    }
    for (const m of mariposas) {
      m.x = m.cx + Math.sin(t * 0.7 + m.f) * 180 + Math.sin(t * 2.3 + m.f) * 40;
      m.y = m.cy + Math.cos(t * 0.5 + m.f) * 140;
    }
    for (const n of nubes) {
      n.x += dt * 90;
      n.y += dt * 40;
      if (n.x > 12000) n.x -= 24000;
      if (n.y > 12000) n.y -= 24000;
    }
  }

  // ---------- dibujar ----------
  const VK = {};
  const imgVk = (v) => VK[v] || (VK[v] = VIKINGO.imagen("R", v, "calm"));
  function dibujarEromash(c, x, y, t, fantasma) {
    // en el juego es el Eromash de verdad (también para su silueta, sin sombra: la saca el recorte)
    if (dibujarEro) return dibujarEro(c, x, y, t);
    const k = 1 / 1.96,
      bote = ero.anda ? Math.abs(Math.sin(ero.paso)) * 6 : Math.sin(t * 2) * 1.2;
    c.save();
    c.translate(x, y);
    c.scale(k, k);
    E(c, 0, 0, 58, 16, "rgba(0,0,0,0.45)");
    const img = imgVk(ero.vista.vista);
    if (ero.vista.espejo) c.scale(-1, 1);
    if (img.complete) c.drawImage(img, -62, -150 - bote, 125, 150);
    c.restore();
  }
  // ---------- la silueta de Eromash detrás de las cosas ----------
  // Como en el bosque: Eromash (con su pose de verdad, de frente, de perfil o de espaldas) se dibuja aparte, se recorta
  // con lo que tiene delante y se pinta claro encima, así se lo ve solo donde algo lo tapa y nunca dos veces.
  const silCv = document.createElement("canvas"),
    silC = silCv.getContext("2d"),
    tapaCv = document.createElement("canvas"),
    tapaC = tapaCv.getContext("2d");
  function siluetaEromash(c, cam, cw, ch, ex, ey, t) {
    const l = VISTA25.tapas(ex, ey);
    if (!l.length) return;
    const e = cam.esc,
      bx = ex - 110,
      by = ey - 210,
      bw = 220,
      bh = 240,
      w = Math.ceil(bw * e),
      h = Math.ceil(bh * e);
    if (w < 2 || h < 2) return;
    if (silCv.width !== w || silCv.height !== h) {
      silCv.width = tapaCv.width = w;
      silCv.height = tapaCv.height = h;
    }
    tapaC.setTransform(1, 0, 0, 1, 0, 0);
    tapaC.clearRect(0, 0, w, h);
    tapaC.setTransform(e, 0, 0, e, -bx * e, -by * e);
    VISTA25.dibujarTapas(tapaC, l, cam, t);
    // solo lo sólido tapa: la sombra en el piso (semitransparente) se borra del recorte
    const im = tapaC.getImageData(0, 0, w, h),
      px = im.data;
    let algo = false;
    for (let i = 3; i < px.length; i += 4) {
      px[i] = px[i] > 230 ? 255 : 0;
      if (px[i]) algo = true;
    }
    if (!algo) return;
    tapaC.putImageData(im, 0, 0);
    silC.setTransform(1, 0, 0, 1, 0, 0);
    silC.globalCompositeOperation = "source-over";
    silC.clearRect(0, 0, w, h);
    silC.setTransform(e, 0, 0, e, -bx * e, -by * e);
    dibujarEromash(silC, ex, ey, t, true);
    silC.setTransform(1, 0, 0, 1, 0, 0);
    silC.globalCompositeOperation = "destination-in";
    silC.drawImage(tapaCv, 0, 0);
    silC.globalCompositeOperation = "source-in";
    silC.fillStyle = "#F2ECEC";
    silC.fillRect(0, 0, w, h);
    silC.globalCompositeOperation = "source-over";
    VISTA25.aVista(c, cam, cw, ch);
    alfa(c, 0.6, () => c.drawImage(silCv, bx, by, bw, bh));
  }
  // un animal visto de costado, dado vuelta según hacia dónde va en la pantalla
  function dibujarAnimal(c, a, sx, sy, t, cam) {
    const r = a.rumbo !== undefined ? a.rumbo : a.f;
    const izq = Math.cos(r + cam.g) < 0;
    c.save();
    c.translate(sx, sy);
    if (izq) c.scale(-1, 1);
    if (a.tipo === "gallina") {
      const pic = !a.vx && Math.sin(t * 3 + a.f) > 0.6 ? 6 : 0,
        aleteo = a.susto > 0 ? Math.sin(t * 30) * 5 : 0;
      sombra(c, 0, 1, 12, 4, 0.3);
      L(c, -3, -8, -4, 0, "#E8B04A", 1.5);
      L(c, 3, -8, 3, 0, "#E8B04A", 1.5);
      E(c, 0, -14, 12, 9, a.col);
      P(c, [-10, -16, -18, -24 - aleteo, -14, -12], a.col);
      E(c, 9, -22 + pic, 5.5, 5.5, a.col);
      P(c, [14, -22 + pic, 19, -20 + pic, 14, -19 + pic], "#E8B04A");
      E(c, 8, -28 + pic, 3, 2.5, "#C8402D");
      E(c, 10, -23 + pic, 1, 1, "#111");
    } else if (a.tipo === "gato") {
      const corre = a.susto > 0,
        cola = Math.sin(t * 2 + a.f) * 4;
      sombra(c, 0, 1, 16, 4, 0.3);
      if (corre) {
        E(c, 0, -10, 16, 6, a.col);
        E(c, 14, -14, 6, 5, a.col);
        L(c, -14, -10, -24, -16, a.col, 3);
      } else {
        E(c, 0, -12, 9, 11, a.col);
        E(c, 4, -26, 7, 6, a.col);
        P(c, [0, -30, 2, -37, 5, -31], a.col);
        P(c, [6, -31, 9, -37, 10, -30], a.col);
        E(c, 7, -27, 1.4, 1.4, "#FFD98A");
        c.strokeStyle = a.col;
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(-6, -4);
        c.quadraticCurveTo(-20, -2 + cola, -16, -16 + cola);
        c.stroke();
      }
    } else if (a.tipo === "cuervo") {
      const z = a.z || 0;
      if (z > 2) alfa(c, Math.max(0.1, 0.35 - z / 2000), () => E(c, 0, 0, 10, 3, "#000"));
      else sombra(c, 0, 1, 10, 3, 0.3);
      c.translate(0, -z);
      const ala = a.vuela ? Math.sin(t * 16 + a.f) * 12 : 0;
      E(c, 0, -10, 10, 6, "#16161A");
      E(c, 8, -15, 5, 4.5, "#16161A");
      P(c, [12, -16, 18, -14, 12, -13], "#3A3A40");
      P(c, [-8, -10, -18, -6, -8, -7], "#16161A");
      if (a.vuela) {
        P(c, [-4, -12, 4, -12, 0, -26 - ala], "#202026");
        P(c, [-2, -10, 6, -10, 2, -2 + ala * 0.5], "#101014");
      }
      E(c, 9, -16, 1, 1, "#E8E4DC");
    } else if (a.tipo === "perro") {
      const anda = a.vx || a.vy,
        p = anda ? Math.sin(t * 14) * 4 : 0,
        cola = Math.sin(t * (a.sigue > 3 ? 14 : 3)) * 6;
      sombra(c, 0, 1, 26, 6, 0.35);
      for (const [lx, s] of [[-14, 1], [-8, -1], [10, 1], [16, -1]]) L(c, lx, -12, lx + p * s, 0, "#6E4A2E", 4);
      E(c, 0, -18, 20, 9, a.col);
      E(c, 20, -26, 9, 8, a.col);
      P(c, [24, -24, 34, -22, 26, -19], "#6E4A2E");
      P(c, [14, -30, 18, -38, 21, -30], "#6E4A2E");
      E(c, 23, -28, 1.3, 1.3, "#111");
      L(c, -18, -20, -28, -30 + cola, a.col, 4);
    }
    c.restore();
  }

  // lo que va parado en el orden del mundo: Eromash, los animales y los globos de lo que dicen
  function extra(cam, t) {
    const l = [{ x: ero.x, y: ero.y, ero: true, f: (c, sx, sy) => dibujarEromash(c, sx, sy, t) }];
    const lejos = cam.esc < VISTA25.LEJOS.gente;
    if (!lejos) for (const a of animales) l.push({ x: a.x, y: a.y, f: (c, sx, sy) => dibujarAnimal(c, a, sx, sy, t, cam) });
    return l;
  }

  // en el piso (girado y achicado): huellas, sombras de nubes, el destello de lo que se puede mirar, el brillo del río
  // y la niebla del alba
  function piso(c, cam, t, h) {
    // cuánto del mundo entra en la pantalla (radio), para no pintar nubes que no se ven
    const vistaR = Math.hypot(c.canvas.width, c.canvas.height / cam.k) / cam.esc / 2;
    // las huellas de Eromash en la tierra
    for (const p of ero.huellas) {
      const vida = 1 - (t - p.t) / 14;
      if (vida <= 0) continue;
      const nx = -Math.sin(p.a) * 9 * p.lado,
        ny = Math.cos(p.a) * 9 * p.lado;
      alfa(c, 0.35 * vida, () => E(c, p.x + nx, p.y + ny, 9, 5, "#2A2016", p.a));
    }
    // un destello rúnico en el piso donde hay algo para mirar, solo cuando Eromash ya está cerca (nada de marcas de lejos)
    for (const cu of plano.curiosidades) {
      const d = Math.hypot(cu.x - ero.x, cu.y - ero.y);
      if (d > 900) continue;
      const a = (1 - d / 900) * (vistos.has(cu.clave) ? 0.25 : 0.7) * (0.6 + Math.sin(t * 2.4 + cu.x) * 0.4);
      alfa(c, a, () => {
        c.strokeStyle = "#73D5DB";
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(cu.x, cu.y, 40, 40, 0, 0, TAU);
        c.stroke();
        c.beginPath();
        c.moveTo(cu.x, cu.y - 22);
        c.lineTo(cu.x, cu.y + 22);
        c.moveTo(cu.x - 14, cu.y - 8);
        c.lineTo(cu.x, cu.y + 4);
        c.lineTo(cu.x + 14, cu.y - 8);
        c.stroke();
      });
    }
    for (const co of plano.cofres) {
      if (abiertos.has(co.n)) continue;
      const d = Math.hypot(co.x - ero.x, co.y - ero.y);
      if (d < 700) alfa(c, (1 - d / 700) * 0.5 * (0.6 + Math.sin(t * 3 + co.n) * 0.4), () => E(c, co.x, co.y, 70, 70, "rgba(255,217,138,0.35)"));
    }
    if (!caro()) return;
    // el río que brilla: rayas de luz que corren con la corriente
    // (las rayas con la misma transparencia van todas en un solo trazo: ocho trazos en vez de uno por raya)
    const rio = plano.rio.pts;
    c.lineCap = "round";
    c.strokeStyle = "#9AD0DA";
    c.lineWidth = 5;
    for (let j = 0; j < 8; j++) {
      c.beginPath();
      for (let i = 0; i < rio.length - 1; i++) {
        const [ax, ay] = rio[i],
          [bx, by] = rio[i + 1];
        if (Math.abs((ax + bx) / 2 - cam.x) > 9000 || Math.abs((ay + by) / 2 - cam.y) > 9000) continue;
        const lx = bx - ax,
          ly = by - ay,
          l = Math.hypot(lx, ly),
          ux = lx / l,
          uy = ly / l;
        const s = ((t * 90 + j * (l / 8) + i * 133) % l) / l;
        const off = Math.sin(j * 2.3 + i) * plano.rio.ancho * 0.3;
        const px = ax + lx * s - uy * off,
          py = ay + ly * s + ux * off;
        c.moveTo(px, py);
        c.lineTo(px + ux * 120, py + uy * 120);
      }
      c.globalAlpha = 0.18 + Math.sin(t * 2 + j) * 0.06;
      c.stroke();
    }
    c.globalAlpha = 1;
    // un pez que salta cada tanto: el anillo que se abre en el agua
    for (let i = 0; i < rio.length - 1; i++) {
      const ciclo = (((t * 0.23 + i * 0.37) % 1) + 1) % 1;
      if (ciclo > 0.25) continue;
      const s = ((i * 0.618) % 1) * 0.8 + 0.1,
        px = rio[i][0] + (rio[i + 1][0] - rio[i][0]) * s,
        py = rio[i][1] + (rio[i + 1][1] - rio[i][1]) * s;
      alfa(c, 0.6 * (1 - ciclo * 4), () => {
        c.strokeStyle = "#C8E0E4";
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(px, py, 20 + ciclo * 260, 20 + ciclo * 260, 0, 0, TAU);
        c.stroke();
      });
    }
    // sombras de nubes que pasan, de día
    if (h >= 7 && h < 18.5 && alta())
      for (const n of nubes) if (Math.abs(n.x - cam.x) < n.rx + vistaR && Math.abs(n.y - cam.y) < n.ry + vistaR) alfa(c, 0.12, () => E(c, n.x, n.y, n.rx, n.ry, "#0A0E0C"));
    // la niebla baja del río al alba
    const alba = h >= 4.5 && h < 8.5 ? 1 - Math.abs(h - 6.2) / 2.3 : 0;
    if (alba > 0) {
      c.lineCap = "round";
      for (let i = 0; i < rio.length - 1; i++) {
        const [ax, ay] = rio[i],
          [bx, by] = rio[i + 1];
        alfa(c, 0.16 * alba, () => L(c, ax, ay, bx, by, "#C8D4D8", plano.rio.ancho * 4 + Math.sin(t * 0.3 + i) * 200));
      }
    }
  }

  // en la pantalla, al final: el humo, las chispas, las hojas, las luciérnagas, las mariposas y la bandada; los globos,
  // el aviso de E, el nombre del barrio y la cuenta de lo encontrado
  // capa "mundo": lo que flota en el aire (va debajo de la luz de la hora); capa "hud": textos y avisos (encima de todo)
  function encima(c, cam, cw, ch, t, h, capa) {
    const V = VISTA25.proyector(cam);
    const aPant = (x, y, z = 0) => {
      const [vx, vy] = V(x, y);
      return [(vx - cam.x) * cam.esc + cw / 2, (vy - cam.y) * cam.esc + ch / 2 - z * cam.esc];
    };
    const enPant = ([x, y], m = 60) => x > -m && y > -m && x < cw + m && y < ch + m;
    const e = cam.esc;
    const noche = h >= 17 && h < 21 ? (h - 17) / 4 : h >= 21 || h < 5 ? 1 : h < 7 ? (7 - h) / 2 : 0;
    if (capa === "mundo") {
      // Eromash se ve a través de lo que lo tapa (un techo, la copa del Roble, un farol): solo donde lo tapa
      const [ex, ey] = V(ero.x, ero.y);
      siluetaEromash(c, cam, cw, ch, ex, ey, t);
    }
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (capa === "mundo") {
      dibujarAire(c, aPant, enPant, e, t, h, noche);
      return;
    }
    // los textos van en puntos de la ventana (con más píxeles por punto, la pantalla los agranda igual)
    const u = c.canvas.clientWidth ? c.canvas.width / c.canvas.clientWidth : 1;
    c.setTransform(u, 0, 0, u, 0, 0);
    encimaHud(c, (x, y, z) => aPant(x, y, z).map((v) => v / u), cw / u, ch / u, t, e);
    c.setTransform(1, 0, 0, 1, 0, 0);
  }
  function dibujarAire(c, aPant, enPant, e, t, h, noche) {
    // (la transparencia se pone directo, sin guardar y restaurar el estado del lienzo por cada bocanada)
    for (const s of humo) {
      const p = aPant(s.x, s.y, s.z);
      if (!enPant(p, 80)) continue;
      c.globalAlpha = s.a;
      E(c, p[0], p[1], s.r * e * 1.6, s.r * e * 1.3, s.negro ? "#3A3634" : "#7E7C78");
    }
    c.globalAlpha = 1;
    for (const s of chispas) {
      const p = aPant(s.x, s.y, s.z);
      if (!enPant(p)) continue;
      c.fillStyle = s.vida > 0.4 ? "#FFD98A" : "#FF8D71";
      c.fillRect(p[0] - 1.5, p[1] - 1.5, 3, 3);
    }
    for (const s of hojas) {
      const p = aPant(s.x, s.y, s.z);
      if (!enPant(p)) continue;
      const g = Math.sin(t * 3 + s.f);
      E(c, p[0], p[1], Math.max(1.5, 7 * e * 2 * Math.abs(g)), 4 * e * 2, s.col, g);
    }
    if (noche > 0.4 && caro())
      for (const l of luciernagas) {
        const x = l.x + Math.sin(t * 0.6 + l.f) * 120,
          y = l.y + Math.cos(t * 0.5 + l.f) * 90;
        const p = aPant(x, y, 40 + Math.sin(t + l.f) * 30);
        if (!enPant(p)) continue;
        const b = Math.max(0, Math.sin(t * 1.7 + l.f * 3));
        if (b < 0.2) continue;
        alfa(c, b * noche, () => {
          E(c, p[0], p[1], 2.5, 2.5, "#E8F4A0");
          halo(c, p[0], p[1], 14, "#E8F4A0", 0.35);
        });
      }
    if (h >= 8 && h < 18 && caro() && e >= VISTA25.LEJOS.gente)
      for (const m of mariposas) {
        const p = aPant(m.x, m.y, 60 + Math.sin(t * 3 + m.f) * 20);
        if (!enPant(p)) continue;
        const ala = Math.abs(Math.sin(t * 14 + m.f)) * 6 * e * 2;
        E(c, p[0] - ala * 0.6, p[1], ala, 4 * e * 2, m.col);
        E(c, p[0] + ala * 0.6, p[1], ala, 4 * e * 2, m.col);
      }
    if (bandada) {
      for (let i = 0; i < 9; i++) {
        const fila = Math.floor((i + 1) / 2),
          lado = i % 2 ? 1 : -1;
        const len = Math.hypot(bandada.vx, bandada.vy);
        const bx = bandada.x - (bandada.vx / len) * fila * 160 + (-bandada.vy / len) * lado * fila * 120,
          by = bandada.y - (bandada.vy / len) * fila * 160 + (bandada.vx / len) * lado * fila * 120;
        const sp = aPant(bx, by, 0);
        alfa(c, 0.18, () => E(c, sp[0], sp[1], 8 * e * 2, 3 * e * 2, "#000"));
        const p = aPant(bx, by, 1100);
        if (!enPant(p)) continue;
        const ala = Math.sin(t * 9 + i) * 6;
        c.strokeStyle = "#16161A";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(p[0] - 9, p[1] - ala);
        c.lineTo(p[0], p[1]);
        c.lineTo(p[0] + 9, p[1] - ala);
        c.stroke();
      }
    }
  }
  function encimaHud(c, aPant, cw, ch, t, e) {
    // las notas de Gudrun mientras tararea (se callan cuando Eromash está cerca)
    for (const p of gente) {
      if (!p.canta || p.callada || !p.visible) continue;
      for (let i = 0; i < 3; i++) {
        const s = (t * 0.35 + i / 3) % 1;
        const q = aPant(p.x + 30 + s * 60 + Math.sin(t * 2 + i) * 14, p.y, 120 + s * 110);
        alfa(c, Math.sin(s * Math.PI) * 0.9, () => {
          c.font = "600 " + Math.round(16 * Math.max(0.6, e * 2)) + 'px "DM Sans", system-ui, sans-serif';
          c.fillStyle = "#F2ECEC";
          c.fillText(i % 2 ? "♪" : "♫", q[0], q[1]);
        });
      }
    }
    c.textAlign = "center";
    // los globos de lo que dicen
    for (const g of globos) {
      const q = aPant(g.p.x, g.p.y, 150);
      globo(c, q[0], q[1], g.texto, Math.min(1, g.t * 4, (4.5 - g.t) * 2));
    }
    // el aviso de lo que hay a mano
    if (cerca && !tarjeta && !juego) {
      const [x, y] = cerca.tipo === "cur" ? [cerca.cu.x, cerca.cu.y] : [cerca.co.x, cerca.co.y];
      const q = aPant(x, y, 170);
      const titulo = cerca.tipo === "cur" ? tr("ci.cur_" + cerca.cu.clave + "_t") : tr("ci.abrir");
      const accion = cerca.tipo === "cur" ? tr("ci.mirar") : "";
      const texto = (accion ? accion + " · " : "") + titulo;
      c.font = '600 14px "DM Sans", system-ui, sans-serif';
      const w = c.measureText(texto).width + 50;
      c.fillStyle = "rgba(17,17,17,0.85)";
      c.fillRect(q[0] - w / 2, q[1] - 16, w, 28);
      c.fillStyle = "#9C2315";
      c.fillRect(q[0] - w / 2, q[1] - 16, 26, 28);
      c.fillStyle = "#F2ECEC";
      c.fillText(CONTROLES.glifo("interactuar"), q[0] - w / 2 + 13, q[1] + 3);
      c.fillStyle = vistos.has(cerca.cu && cerca.cu.clave) ? "#E0B2B2" : "#FFD98A";
      c.fillText(texto, q[0] + 13, q[1] + 3);
    }
    // el nombre del barrio al entrar, grande y que se va solo
    if (cartelZona.texto && cartelZona.t < 3.6) {
      const a = Math.min(1, cartelZona.t * 2, (3.6 - cartelZona.t) * 1.5);
      alfa(c, a, () => {
        c.font = '600 30px "DM Sans", system-ui, sans-serif';
        c.fillStyle = "rgba(17,17,17,0.55)";
        const w = c.measureText(cartelZona.texto).width + 80;
        c.fillRect(cw / 2 - w / 2, ch * 0.14 - 34, w, 52);
        c.fillStyle = "#9C2315";
        c.fillRect(cw / 2 - w / 2, ch * 0.14 + 16, w, 3);
        c.fillStyle = "#F2ECEC";
        c.fillText(cartelZona.texto, cw / 2, ch * 0.14);
      });
    }
    // la cuenta de lo encontrado, chica, abajo a la derecha (en el juego va en la tarjeta)
    c.textAlign = "left";
    if (juego) return;
    c.textAlign = "right";
    c.font = '500 12px "DM Sans", system-ui, sans-serif';
    c.fillStyle = "rgba(242,236,236,0.75)";
    c.fillText(cuenta(), cw - 16, ch - 16);
    c.textAlign = "left";
  }
  // un globo de diálogo con el texto partido en renglones
  function globo(c, x, y, texto, a) {
    c.save();
    c.globalAlpha = Math.max(0, a);
    c.font = '500 13px "DM Sans", system-ui, sans-serif';
    const max = 260,
      pal = texto.split(" "),
      lin = [];
    let cur = "";
    for (const w of pal) {
      const n = cur ? cur + " " + w : w;
      if (c.measureText(n).width > max && cur) {
        lin.push(cur);
        cur = w;
      } else cur = n;
    }
    if (cur) lin.push(cur);
    const ancho = Math.min(max, Math.max(...lin.map((l) => c.measureText(l).width))) + 24,
      alto = lin.length * 17 + 14;
    c.fillStyle = "rgba(242,236,236,0.95)";
    c.fillRect(x - ancho / 2, y - alto, ancho, alto);
    P(c, [x - 8, y, x + 8, y, x, y + 9], "rgba(242,236,236,0.95)");
    c.fillStyle = "#111111";
    c.textAlign = "center";
    lin.forEach((l, i) => c.fillText(l, x, y - alto + 20 + i * 17));
    c.restore();
  }

  // lo que hay a mano para el HUD del juego: { texto, d, fn }
  function aMano() {
    if (!cerca || tarjeta) return null;
    const x = cerca.tipo === "cur" ? cerca.cu.x : cerca.co.x,
      y = cerca.tipo === "cur" ? cerca.cu.y : cerca.co.y;
    const texto = cerca.tipo === "cur" ? tr("ci.mirar") + " · " + tr("ci.cur_" + cerca.cu.clave + "_t") : tr("ci.abrir");
    const cc = cerca;
    return { texto, d: Math.hypot(x - ero.x, y - ero.y), fn: () => abrir(cc) };
  }
  // lo encontrado, para guardarlo en la partida, y de vuelta (los cofres abiertos quedan abiertos)
  const estado = () => ({ vistos: [...vistos], abiertos: [...abiertos] });
  function cargar(o) {
    vistos.clear();
    for (const k of (o && o.vistos) || []) vistos.add(k);
    const ya = new Set((o && o.abiertos) || []);
    for (const co of plano.cofres) {
      if (ya.has(co.n) === abiertos.has(co.n)) continue;
      if (ya.has(co.n)) abiertos.add(co.n);
      else abiertos.delete(co.n);
      const ob = plano.cosas.find((q) => q.id === "cofre" && Math.abs(q.x - co.x) < 1 && Math.abs(q.y - co.y) < 1);
      if (ob) ob.casa = ENSERES25.cofre(co.n + 1, { abierto: ya.has(co.n) });
    }
  }

  const api = { iniciar, actualizar, extra, piso, encima, ero, mirada: (p) => p.miraA, aMano, tarjetaAbierta: () => !!tarjeta, cerrar, estado, cargar, cuenta: () => cuenta(), zona: () => zona, callados: false };
  return api;
})();
