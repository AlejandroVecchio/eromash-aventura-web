// ---------- Eikholt en el juego (sistema EIKHOLT) ----------
// La capital es un mapa aparte en 2.5D (MUNDO25: el mismo motor y la misma estética que la muestra ciudad.html). Al cruzar
// una puerta de la elipse de la ciudad en el bosque se pone J.dentro y la ciudad se juega en el lienzo de siempre, con el
// HUD, la mochila, el mapa y los diálogos del juego; al salir por un camino de afuera Eromash vuelve al bosque en esa
// puerta. La historia sigue andando por anclas: cada punto o nombrada del bosque que está en la ciudad tiene su lugar en el
// plano (ANCLAS); cerca de uno, Eromash se asoma a ese punto del bosque y el motor responde (A.cercano, A.usarLente), así
// Svanhild, Ása, el Ting o la bodega del Hongo Dorado (con la puerta de Góinn) funcionan como en el bosque. Los vecinos con
// nombre son los de CAPITAL (se habla con ellos como en el bosque) y los demás contestan según su rol (ek.dice_<rol>_N).
// Lo encontrado (curiosidades y cofres) y dónde quedó Eromash se guardan en E.extra.eikholt. ?eikholt=1 arranca en la
// Puerta del Sur (pruebas).
window.EIKHOLT = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const TAU = Math.PI * 2;
  const corto = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  let A, J, jug, W, H;
  let st = null; // E.extra.eikholt
  let listo = false,
    activo = false,
    plano = null,
    M = 60;
  const cam = { x: 0, y: 0, g: -0.49, k: 0.55, esc: 0.45 };
  let zoom = 0.65,
    giroObj = -0.49;
  const ero = () => RECORRER25.ero;
  let tiempo = 0,
    guardar = 0,
    salida = 0,
    dtUlt = 1 / 60,
    modoAntes = "juego",
    jugUlt = null,
    volver = false; // salió a un cuarto del bosque (una casa, la bodega): al volver entra donde estaba

  // ---------- el plano y el bosque ----------
  // el círculo de la muralla (150 m) es la elipse de la ciudad en el mapa de Eldervald
  const aBosque = (x, y) => [W.CIUDAD.c[0] + (x / plano.R_MURO) * W.CIUDAD.rx, W.CIUDAD.c[1] + (y / plano.R_MURO) * W.CIUDAD.ry];
  const aCiudad = (fx, fy) => [((fx - W.CIUDAD.c[0]) / W.CIUDAD.rx) * plano.R_MURO, ((fy - W.CIUDAD.c[1]) / W.CIUDAD.ry) * plano.R_MURO];
  const dentroElipse = (x, y, f = 1) => ((x - W.CIUDAD.c[0]) / W.CIUDAD.rx) ** 2 + ((y - W.CIUDAD.c[1]) / W.CIUDAD.ry) ** 2 < f * f;

  // los puntos del bosque que tienen su lugar en la ciudad (en unidades del plano; se corren al punto libre más cercano)
  function anclasBosque() {
    const AN = plano.anclas,
      L = plano.lugares,
      m = (x, y) => [x * M, y * M],
      mas = (p, dx, dy) => p && [p[0] + dx * M, p[1] + dy * M];
    const R = plano.R_MURO / M;
    const a = {
      eikholt: m(0, 122), eydis_eikholt: m(-3.5, 127), orm_eikholt: m(3.5, 129), trab_eikholt: m(9, 124), plaza: m(0, 56),
      mirador: m(-12, 16), roble: m(10, 16), ting: AN.ting, pozo: mas(L.pozo, 0, 2.5), campana: mas(L.campana, 0, 2.5),
      tablon_avisos: mas(L.tablon, 0, 2.5), camas_hongos: mas(L.camas_hongos, 0, 3),
      losa: AN.losa, mesa: mas(AN.svanhild_casa, 0, 4), svanhild_casa: AN.svanhild_casa, svanhild_patio: mas(AN.losa, 2, 3), herreria_puerta: AN.herreria,
      lindes: AN.lindes_puerta,
      puerta_sur: AN.puerta_sur, puerta_norte: AN.puerta_norte, gran_tablero: m(14, 139), casa_guardia: m(-12, 139),
      herreria: AN.herreria, carpinteria: AN.carpinteria, cordeleria: AN.cordeleria, curtiembre: AN.curtiembre, sanacion: AN.sanacion,
      hongo_dorado: AN.hongo_puerta, guardia: AN.guardia, carreta_grim: mas(AN.corral, 0, 4), buey: mas(AN.corral, 3, 6),
    };
    // las doce piedras de la cúpula, afuera de la muralla: se tocan desde el lado de afuera
    for (let i = 0; i < 12; i++) {
      const g = (i / 12) * TAU + 0.13;
      a["ancla" + i] = m(Math.cos(g) * (R + 9), Math.sin(g) * (R + 9));
    }
    for (const k in a) if (a[k]) a[k] = MUNDO25.buscarLibre(a[k][0], a[k][1]);
    return a;
  }
  let ANCLAS = {},
    sondas = []; // { k, x, y, fx, fy }
  function armarSondas() {
    sondas = [];
    for (const k in ANCLAS) {
      const p = ANCLAS[k];
      const nb = W.NOMBRADAS[k] && !Array.isArray(W.NOMBRADAS[k]) ? [W.NOMBRADAS[k].x, W.NOMBRADAS[k].y] : W.PUNTOS[k];
      if (!p || !nb) continue;
      sondas.push({ k, x: p[0], y: p[1], fx: nb[0], fy: nb[1] });
    }
  }
  // dónde va en la ciudad algo que en el bosque está en (fx, fy): junto al ancla más cercana
  function lugarDe(fx, fy) {
    let m = null,
      dm = Infinity;
    for (const s of sondas) {
      const d = Math.hypot(s.fx - fx, s.fy - fy);
      if (d < dm) {
        dm = d;
        m = s;
      }
    }
    if (!m || dm > 900) return aCiudad(fx, fy);
    let ox = ((fx - m.fx) / 40) * M,
      oy = ((fy - m.fy) / 40) * M;
    const l = Math.hypot(ox, oy);
    if (l > 5 * M) {
      ox *= (5 * M) / l;
      oy *= (5 * M) / l;
    }
    return [m.x + ox, m.y + oy];
  }
  // asomarse a un punto del bosque: el motor ve a Eromash ahí mientras dura fn
  function asomado(fx, fy, fn) {
    const px = jug.x,
      py = jug.y;
    jug.x = fx;
    jug.y = fy;
    try {
      return fn();
    } finally {
      jug.x = px;
      jug.y = py;
    }
  }
  // lo que el motor ofrece cerca del ancla (o de la persona de la historia) más próxima
  let nativos = new Set();
  function sondear() {
    const e = ero();
    let m = null,
      dm = 3.2 * M;
    for (const s of sondas) {
      const d = Math.hypot(s.x - e.x, s.y - e.y);
      if (d < dm) {
        dm = d;
        m = s;
      }
    }
    for (const n of historia) {
      const d = Math.hypot(n.x - e.x, n.y - e.y);
      if (d < 2.4 * M && d - 0.6 * M < dm) {
        dm = d - 0.6 * M;
        m = { fx: n.fx, fy: n.fy + 40, x: n.x, y: n.y };
      }
    }
    if (!m) return null;
    const fx = m.fx + ((e.x - m.x) / M) * 12,
      fy = m.fy + ((e.y - m.y) / M) * 12 + (m.k ? 30 : 0);
    const r = asomado(fx, fy, () => A.cercano());
    if (!r || nativos.has(r.texto)) return null;
    return { texto: r.texto, d: dm, fn: () => asomado(fx, fy, r.fn) };
  }
  function sondaCercana(dmax) {
    const e = ero();
    let m = null,
      dm = dmax;
    for (const s of sondas) {
      const d = Math.hypot(s.x - e.x, s.y - e.y);
      if (d < dm) {
        dm = d;
        m = s;
      }
    }
    return m;
  }

  // ---------- la gente ----------
  // los vecinos con nombre son los de CAPITAL: se esconden si la historia los mandó afuera de la ciudad
  const deCapital = (id) => window.CAPITAL && CAPITAL.gente.find((n) => n.id === id);
  function oculto(p) {
    if (p.ladron) return !(window.LADRON25 && LADRON25.activo());
    if (p.asamblea) return !(window.ASAMBLEA25 && ASAMBLEA25.hoy(A));
    if (!p.nombrado) return false;
    const n = deCapital(p.id);
    return !n || n.fuera || !dentroElipse(n.x, n.y, 1.1);
  }
  // los de la historia que hoy están en la ciudad (Eydis, Orm, Svanhild, la cuadrilla)
  const historia = [];
  function ubicarHistoria() {
    const vivos = [];
    const poner = (id, n, clave) => {
      if (!dentroElipse(n.x, n.y, 1.08)) return;
      let g = historia.find((h) => h.clave === clave);
      if (!g) {
        g = { id, clave, x: 0, y: 0, fx: null, fy: null, historia: true };
        historia.push(g);
      }
      g.camina = !!n.camina;
      g.hablando = !!n.hablando;
      if (g.fx !== n.x || g.fy !== n.y) {
        g.fx = n.x;
        g.fy = n.y;
        const [x, y] = lugarDe(n.x, n.y),
          p = MUNDO25.libre(x, y, 30) ? [x, y] : MUNDO25.buscarLibre(x, y);
        g.x = p[0];
        g.y = p[1];
      }
      vivos.push(g);
    };
    for (const id in A.npcs) poner(id, A.npcs[id], "n_" + id);
    if (A.trabajadores) A.trabajadores().forEach((tr) => poner(tr.id, tr, "t_" + tr.id));
    for (let i = historia.length - 1; i >= 0; i--) if (!vivos.includes(historia[i])) historia.splice(i, 1);
  }
  // los de la historia miran a Eromash si está cerca
  function mirarHistoria() {
    const e = ero();
    for (const g of historia) g.miraA = Math.hypot(e.x - g.x, e.y - g.y) < 500 ? [e.x - g.x, e.y - g.y] : null;
  }
  function mirarA(p) {
    const e = ero();
    p.charla = 6;
    p.miraA = [e.x - p.x, e.y - p.y];
    const V = VISTA25.proyector(cam),
      [ax, ay] = V(e.x, e.y),
      [bx, by] = V(p.x, p.y);
    jug.mira = VIKINGO.vista(bx - ax, by - ay, jug.mira);
  }
  const LINEAS_ROL = { vecino: 8, vecina: 8, nino: 5, vendedor: 6, recluta: 4, viajero: 6, pescador: 4, guardia: 5, farolero: 4, borracho: 5 };
  const charlas = {};
  function hablarVecino(p) {
    mirarA(p);
    const n = LINEAS_ROL[p.rol] || 4;
    const k = (p.id + p.x).length;
    charlas[p.id] = charlas[p.id] == null ? k : charlas[p.id] + 1;
    const fama = charlas[p.id] % 3 === 1 && window.FAMA25 && FAMA25.frase(charlas[p.id]);
    A.dialogoLibre([["ek_" + p.rol, fama || "ek.dice_" + p.rol + "_" + (charlas[p.id] % n)]]);
  }
  function hablarNombrado(p) {
    mirarA(p);
    const n = deCapital(p.id);
    const r = n && asomado(n.x, n.y, () => A.cercano());
    if (r) asomado(n.x, n.y, r.fn);
  }

  // ---------- lo que se puede hacer cerca ----------
  function cercano() {
    if (J.modo !== "juego" || !activo) return null;
    const e = ero();
    let mejor = null,
      dm = Infinity;
    for (const p of MUNDO25.gente()) {
      if (p.visible === false || (!p.rol && !p.nombrado) || p.ladron) continue;
      const d = Math.hypot(p.x - e.x, p.y - e.y);
      if (d > 2.2 * M || d >= dm) continue;
      dm = d;
      if (p.nombrado) mejor = { texto: t("av.accion_hablar") + " · " + t("av.nombre_" + p.id), fn: () => hablarNombrado(p) };
      else mejor = { texto: t("av.accion_hablar") + " · " + t("av.nombre_ek_" + p.rol), fn: () => hablarVecino(p) };
    }
    // las casas de los vecinos que tienen el farol encendido junto a la puerta: «Entrar · La casa de …»
    if (window.INTERIORES && plano.casasQueSeEntran)
      for (const c of plano.casasQueSeEntran) {
        const d = Math.hypot(c.x - e.x, c.y - e.y);
        if (d > 1.6 * M || d >= dm) continue;
        dm = d;
        mejor = { texto: t("in.accion_entrar", [t("in.casa_de", [t("av.nombre_" + INTERIORES.nombreVecino(c.sem, c.v))])]), fn: () => entrarCasa(c), x: c.x, y: c.y };
      }
    // la hospedería y el cuartel de la Guardia (los arma oficios.js por dentro)
    if (window.INTERIORES && plano.edificiosQueSeEntran)
      for (const c of plano.edificiosQueSeEntran) {
        const d = Math.hypot(c.x - e.x, c.y - e.y);
        if (d > 1.8 * M || d >= dm || !INTERIORES.CUARTOS[c.tipo]) continue;
        dm = d;
        mejor = { texto: t("in.accion_entrar", [t("in.nombre_" + c.tipo)]), fn: () => entrarEdificio(c), x: c.x, y: c.y };
      }
    // los puestos del Mercado de los Toldos: mirar o comprar (MERCADO25)
    if (window.MERCADO25 && plano.puestos)
      for (const c of plano.puestos) {
        const d = Math.hypot(c.x - e.x, c.y - e.y);
        if (d > 1.4 * M || d >= dm) continue;
        dm = d;
        mejor = { texto: t(MERCADO25.vende(c.vende) ? "ek.mc_accion_comprar" : "ek.mc_accion_mirar", [t("ek.mc_puesto_" + c.vende)]), fn: () => MERCADO25.abrir(c, A, st), x: c.x, y: c.y };
      }
    // las demás puertas se golpean: contesta alguien de adentro (o nadie)
    if (plano.casasCerradas)
      for (const c of plano.casasCerradas) {
        const d = Math.hypot(c.x - e.x, c.y - e.y);
        if (d > 1.3 * M || d >= dm) continue;
        dm = d;
        mejor = { texto: t("ek.golpear"), fn: () => golpear(c), x: c.x, y: c.y };
      }
    const am = RECORRER25.aMano();
    if (am && am.d < dm + 0.5 * M) {
      dm = am.d;
      mejor = am;
    }
    const s0 = sondear();
    if (s0 && s0.d < dm + 0.3 * M) mejor = s0;
    // el tablón de la plaza y el recado tomado (RECADOS25): ganan a todo lo demás cuando están a mano
    const rc = window.RECADOS25 && RECADOS25.cercano(plano, e, st, A);
    if (rc) mejor = rc;
    // la asamblea del Ting (ASAMBLEA25): cerca de Bergljot, escuchar el asunto del día y dar la voz
    const ta = window.ASAMBLEA25 && ASAMBLEA25.cercano(plano, e, st, A);
    if (ta && !rc) mejor = ta;
    // las escondidas con los chicos (ESCONDIDAS25): invitarlos o, jugando, encontrar al que está a mano
    const es = window.ESCONDIDAS25 && ESCONDIDAS25.cercano(plano, e, st, A, MUNDO25.gente(), MUNDO25.libre);
    if (es && !rc) mejor = es;
    // las cintas de promesa del Roble (PROMESAS25)
    const pm = window.PROMESAS25 && PROMESAS25.cercano(plano, e, st, A);
    if (pm && pm.d < dm + 0.3 * M && !rc && !ta && !es) mejor = pm;
    // la mesa de hnefatafl: apostar o mirar la partida (TAFL25)
    const tf = window.TAFL25 && TAFL25.cercano(plano, e, st, A, MUNDO25.gente());
    if (tf && !rc && !ta && !es) mejor = tf;
    // la ofrenda del Roble: dejar carne a los cuervos de Odín (CUERVOS25)
    const cv = window.CUERVOS25 && CUERVOS25.cercano(plano, e, st, A);
    if (cv && !rc && !ta && !es) (mejor = cv), (dm = cv.d);
    // lo perdido de hoy: hablar con la dueña, levantarlo del piso y devolverlo (PERDIDOS25)
    const pd = window.PERDIDOS25 && PERDIDOS25.cercano(plano, e, st, A, MUNDO25.gente());
    if (pd && !rc && !ta && !es) (mejor = pd), (dm = pd.d);
    // las dianas del campo de la Guardia: tirar cinco hachas (TIRO25)
    const tr = window.TIRO25 && TIRO25.cercano(plano, e, st, A);
    if (tr && tr.d < dm + 0.5 * M && !rc && !ta && !es) (mejor = tr), (dm = tr.d);
    // el perro del corral y los gatos mansos: acariciarlos (RECORRER25.animalCerca)
    const an = RECORRER25.animalCerca(1.4 * M);
    if (an && an.d < dm && !rc && !ta && !es)
      mejor = {
        texto: t(an.a.tipo === "perro" ? "ek.acariciar_perro" : "ek.acariciar_gato"),
        fn: () => {
          RECORRER25.mimar(an.a);
          if (window.ANIMA) ANIMA.gesto("asiente");
          if (window.SONIDO) SONIDO.tono("sine", an.a.tipo === "perro" ? 520 : 760, an.a.tipo === "perro" ? 380 : 640, 0.25, 0.05);
        },
      };
    // los asientos del Ting: sentarse a esperar hasta otra hora (ESPERAR25)
    const sp = window.ESPERAR25 && ESPERAR25.cercano(plano, e, A);
    if (sp && sp.d < dm && !rc && !ta && !es && !pm) mejor = sp;
    return mejor;
  }

  // entrar a la casa de un vecino: la arma INTERIORES como cualquier casa del bosque, con su semilla; al salir la ciudad
  // vuelve a poner a Eromash delante de esa puerta (st.volverA)
  function entrarCasa(c) {
    st.volverA = [c.x, c.y];
    st.casasVistas = st.casasVistas || [];
    if (!st.casasVistas.includes(c.nombre)) st.casasVistas.push(c.nombre);
    const [fx, fy] = aBosque(c.x, c.y);
    jug.x = fx;
    jug.y = fy;
    INTERIORES.entrar({ tipo: "casa", cosa: { id: "casaEikholt", x: fx, y: fy - 70, o: { sem: c.sem, v: c.v } }, clave: "ek_" + c.nombre });
  }
  function entrarEdificio(c) {
    st.volverA = [c.x, c.y];
    const [fx, fy] = aBosque(c.x, c.y);
    jug.x = fx;
    jug.y = fy;
    INTERIORES.entrar({ tipo: c.tipo, cosa: { id: "ek_" + c.tipo, x: fx, y: fy - 70, o: { sem: c.sem } }, clave: "ek_" + c.tipo });
  }
  // golpear una puerta cerrada: tres golpes y la respuesta que le toca a esa casa (cambia de día a la noche)
  const golpes = {};
  function golpear(c) {
    if (window.SONIDO) [0, 180, 360].forEach((ms) => setTimeout(() => SONIDO.tocar("puerta", { vol: 0.3, tono: 1.4 + Math.random() * 0.2 }), ms));
    const h = window.LUZ ? LUZ.hora(A.H.E.tiempo) : 12,
      noche = h >= 22 || h < 6,
      k = (golpes[c.nombre] = (golpes[c.nombre] || 0) + 1),
      n = noche ? "ek.puerta_noche_" + ((c.sem + k) % 4) : "ek.puerta_" + ((c.sem * 7 + k) % 10);
    setTimeout(() => A.dialogoLibre([["eromash", n]]), 600);
  }
  // ---------- Eromash camina ----------
  const VEL = [0, 150, 260, 430],
    VEL_ESQ = 720;
  function moverA(nx, ny) {
    const e = ero(),
      R = plano.R_FUERA;
    const dentro = (x, y) => Math.hypot(x, y) < R;
    if (MUNDO25.libre(nx, ny) && dentro(nx, ny)) {
      e.x = nx;
      e.y = ny;
    } else if (MUNDO25.libre(nx, e.y) && dentro(nx, e.y)) e.x = nx;
    else if (MUNDO25.libre(e.x, ny) && dentro(e.x, ny)) e.y = ny;
  }
  // si algo de la historia mandó a Eromash a otro lado (un cuarto, un viaje, otra zona), la ciudad se suspende
  function vigilar() {
    if (!activo) return true;
    if (J.dentro !== sistemaCiudad) {
      activo = false;
      volver = true;
      if (window.SONIDO) SONIDO.bucle("fogata", "fogata", 0); // los braseros de la calle no se oyen adentro
      return true;
    }
    if (jugUlt && Math.hypot(jug.x - jugUlt[0], jug.y - jugUlt[1]) > 60) {
      if (!dentroElipse(jug.x, jug.y, 1)) {
        activo = false;
        J.dentro = null;
        st.dentro = false;
        salida = 2;
        return true;
      }
      const [x, y] = lugarDe(jug.x, jug.y),
        p = MUNDO25.buscarLibre(x, y);
      ero().x = p[0];
      ero().y = p[1];
      jugUlt = [jug.x, jug.y];
    }
    return false;
  }
  // los pasos suenan como en el bosque: en las calles empedradas a piedra, en la tierra de afuera a tierra
  let pasoAcum = 0;
  function pasos(dt, er) {
    if (!window.SONIDO || !SONIDO.listo || !SONIDO.listo()) return;
    if (!jug.paso || jug.salto > 0 || jug.esq > 0 || jug.muerto) return void (pasoAcum = 40);
    pasoAcum += VEL[jug.paso] * dt;
    if (pasoAcum < [0, 93, 111, 132][jug.paso]) return;
    pasoAcum = 0;
    const calle = !(Math.hypot(er.x, er.y) > plano.plaza + 200 && plano.aCalle(er.x, er.y) > 40);
    SONIDO.tocar(calle ? "pasoPiedra" : "paso", { vol: [0, 0.18, 0.25, 0.34][jug.paso], var: 0.1, filtro: calle ? null : 2200 });
  }
  // lo que se oye en la ciudad (el bosque deja de sonar mientras se juega acá): el viento más bajo entre las casas, los
  // grillos de noche, las fogatas y los braseros cerca, el yunque de Ása de día, monedas y telas en el mercado y la
  // campana de la Asamblea a las 6, a las 12, a las 18 y a las 21. Las distancias van a la mitad: la ciudad tiene 60
  // unidades por metro y el bosque 30, así lo de SONIDO (pensado para el bosque) cae igual con los metros.
  let fuegos = null,
    horaAntes = null,
    grilloT = 0,
    yunqueT = 2,
    mercadoT = 4;
  const S2 = (x, y) => ({ x: x / 2, y: y / 2 });
  // la campana se oye en toda la ciudad: más baja cuanto más lejos, nunca del todo
  function campana(veces, er) {
    const L = plano.lugares.campana;
    if (!L) return;
    const g = Math.max(0.3, 1 - Math.hypot(L[0] - er.x, L[1] - er.y) / 9000);
    for (let i = 0; i < veces; i++)
      [196, 392, 466, 587, 784].forEach((f, k) => SONIDO.tono("sine", f, f * 0.995, 3.4 - k * 0.4, [0.09, 0.07, 0.04, 0.035, 0.02][k] * g, { ambiente: true, retraso: i * 2.2 }));
  }
  // la música del Hongo Dorado: re menor pentatónico (re, fa, sol, la, do, re) y tres frases de ocho tiempos (0 = silencio)
  const ESCALA = [293.7, 349.2, 392, 440, 523.3, 587.3],
    FRASES_HONGO = [
      [1, 3, 4, 0, 4, 5, 4, 3],
      [2, 3, 1, 0, 1, 2, 3, 0],
      [4, 5, 6, 5, 4, 3, 2, 1],
    ];
  let musicaT = 0,
    frase = 0;
  function sonidosCiudad(dt, er) {
    if (!window.SONIDO || !SONIDO.listo || !SONIDO.listo()) return;
    const h = window.LUZ ? LUZ.hora(A.H.E.tiempo) : 12,
      noche = h >= 21 || h < 5;
    SONIDO.oyente(er.x / 2, er.y / 2);
    SONIDO.bucle("viento", "viento", (noche ? 0.1 : 0.07) + lluvia * 0.14, { filtro: 320 + lluvia * 500 });
    if (noche && (grilloT -= dt) <= 0) {
      grilloT = 0.3 + Math.random() * 1.1;
      for (let k = 0; k < 3; k++) SONIDO.tono("sine", 4200 + Math.random() * 600, 4100, 0.05, 0.01, { ambiente: true, retraso: k * 0.07 });
    }
    // la fogata o el brasero más cercano
    if (!fuegos) fuegos = plano.cosas.filter((o) => o.id === "brasero" || o.id === "fogonOlla");
    let f = 0;
    for (const o of fuegos) {
      const d = Math.hypot(o.x - er.x, (o.y - er.y) * 1.3);
      if (d < 1200) f = Math.max(f, 1 - d / 1200);
    }
    SONIDO.bucle("fogata", "fogata", f * 0.6);
    // el yunque de Ása, de 8 a 18: dos o tres golpes, una pausa
    const he = plano.anclas.herreria;
    if (he && h >= 8 && h < 18 && (yunqueT -= dt) <= 0) {
      yunqueT = 1.1 + Math.random() * 1.6;
      const n = 2 + Math.floor(Math.random() * 2),
        o = S2(he[0], he[1]);
      for (let k = 0; k < n; k++) {
        SONIDO.tono("triangle", 1750 + Math.random() * 60, 1680, 0.32, 0.06, Object.assign({ retraso: k * 0.28, filtro: 3800 }, o));
        SONIDO.tono("sine", 2630, 2600, 0.5, 0.025, Object.assign({ retraso: k * 0.28 }, o));
      }
    }
    // el mercado de día: monedas y telas que se mueven en algún puesto cercano
    if (plano.puestos && h >= 7 && h < 19 && (mercadoT -= dt) <= 0) {
      mercadoT = 2 + Math.random() * 4;
      const p = plano.puestos[Math.floor(Math.random() * plano.puestos.length)];
      SONIDO.tocar(Math.random() < 0.55 ? "plata" : "tela", Object.assign({ vol: 0.16, var: 0.15 }, S2(p.x, p.y)));
    }
    // de 17 a 2, la música del Hongo Dorado se oye desde la calle, apagada por las paredes: la lira de Sølve sobre un
    // bordón grave y el tambor de mano marcando el pulso (tres frases que se repiten)
    const hg = plano.anclas.hongo_puerta;
    if (hg && (h >= 17 || h < 2) && (musicaT -= dt) <= 0) {
      musicaT = 3.6;
      const d = Math.hypot(hg[0] - er.x, hg[1] - er.y);
      if (d < 2600) {
        const o = Object.assign({ filtro: 1500 }, S2(hg[0], hg[1])),
          fr = FRASES_HONGO[frase++ % FRASES_HONGO.length];
        SONIDO.tono("sine", 146.8, 146.8, 3.5, 0.03, o);
        fr.forEach((n, k) => n && SONIDO.tono("triangle", ESCALA[n - 1], ESCALA[n - 1] * 0.995, 0.42, 0.035, Object.assign({ retraso: k * 0.45 }, o)));
        for (let k = 0; k < 8; k += 2) SONIDO.tono("sine", 95, 55, 0.18, 0.06, Object.assign({ retraso: k * 0.45 }, o));
      }
    }
    // la campana de la Asamblea
    const hi = Math.floor(h);
    if (horaAntes !== null && hi !== horaAntes && [6, 12, 18, 21].includes(hi)) campana(hi === 12 ? 1 : 3, er);
    horaAntes = hi;
  }
  // igual que en el bosque (motor/juego.js, actualizarJugador): en la ciudad no hay pelea, así que correr no cansa,
  // la estamina vuelve rápido, la vida vuelve sola a los 4 s, dos toques de Shift dejan corriendo (o un toque con
  // «correr: alternar»), lo apretado un instante antes queda guardado, la esquiva quieta es un paso atrás y el salto
  // corriendo llega más lejos
  function jugadorPaso(dt) {
    jug.inv = Math.max(0, (jug.inv || 0) - dt);
    jug.sinGolpe = (jug.sinGolpe || 0) + dt;
    if (jug.salto > 0) jug.salto = Math.max(0, jug.salto - dt);
    if (jug.sinGolpe > 4 && !jug.muerto) jug.hp = Math.min(jug.hpMax, jug.hp + 12 * (J.regenVida || 1) * dt);
    jug.pelea = false;
    const libre = J.modo === "juego" && !(window.TIRO25 && TIRO25.activo());
    const e = libre ? CONTROLES.eje() : { x: 0, y: 0 },
      mov = Math.hypot(e.x, e.y) > 0.15,
      mag = Math.min(1, Math.hypot(e.x, e.y));
    jug.staEspera = Math.max(0, (jug.staEspera || 0) - dt);
    if (CONTROLES.mando() && libre && CONTROLES.recien("correr")) jug.sprintFijo = !jug.sprintFijo;
    if (!CONTROLES.mando() && libre && CONTROLES.recien("correr")) {
      if (window.OPCIONES && OPCIONES.v("correr") === "alternar") jug.sprintFijo = !jug.sprintFijo;
      else if (J.t - (jug.shiftT || -9) < 0.3) jug.sprintFijo = true;
      jug.shiftT = J.t;
    }
    const alterna = !CONTROLES.mando() && window.OPCIONES && OPCIONES.v("correr") === "alternar";
    if ((!mov && !alterna) || jug.cansado) jug.sprintFijo = false;
    jug.correr = libre && mov && ((CONTROLES.pulsado("correr") && !alterna) || jug.sprintFijo) && !jug.cansado;
    if ((jug.esq || 0) <= 0 && jug.staEspera <= 0) jug.sta += (mov ? 20 : 30) * 1.6 * dt;
    if (jug.cansado && jug.sta > jug.staMax * 0.35) jug.cansado = false;
    jug.sta = Math.min(jug.staMax, jug.sta);
    jug.paso = !mov ? 0 : jug.correr ? 3 : jug.cansado || mag < 0.6 ? 1 : 2;
    jug.atk = null;
    // las flechas van relativas a la cámara: arriba es hacia el fondo de la pantalla, gire como gire
    const co = Math.cos(cam.g),
      si = Math.sin(cam.g),
      er = ero(),
      aMundo = (x, y) => [x * co + y * si, -x * si + y * co];
    if (libre) for (const k of ["esquivar", "saltar"]) if (CONTROLES.recien(k)) jug.pedido = { k, t: 0.18 };
    if (jug.pedido && (jug.pedido.t -= dt) <= 0) jug.pedido = null;
    const pide = (k) => jug.pedido && jug.pedido.k === k;
    if (jug.esq > 0) {
      jug.esq -= dt;
      moverA(er.x + jug.esqMundo[0] * VEL_ESQ * dt, er.y + jug.esqMundo[1] * VEL_ESQ * dt);
    } else if (libre) {
      if (mov) {
        const l = Math.hypot(e.x, e.y),
          [dx, dy] = aMundo(e.x / l, e.y / l),
          v = VEL[jug.paso] * (J.velMov || 1) * (jug.salto > 0 && jug.saltoLargo ? 1.35 : 1);
        jug.dirMundo = [dx, dy];
        jug.dir = [e.x / l, e.y / l];
        jug.mira = VIKINGO.vista(e.x, e.y, jug.mira);
        moverA(er.x + dx * v * dt, er.y + dy * v * dt);
      }
      if (pide("esquivar") && jug.sta >= 20 && jug.salto <= 0) {
        jug.pedido = null;
        jug.sta -= 20;
        jug.staEspera = 0.6;
        jug.esq = 0.3;
        jug.inv = Math.max(jug.inv, 0.26);
        const d0 = jug.dirMundo || [0, 1];
        jug.esqMundo = mov ? d0.slice() : [-d0[0], -d0[1]];
        if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.5, tono: 1.25 });
      }
      if (pide("saltar") && jug.salto <= 0) {
        jug.pedido = null;
        jug.salto = 0.42;
        jug.saltoLargo = jug.correr;
        if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.35, tono: 0.9 });
      }
    }
    if (jug.saltoAntes > 0 && jug.salto <= 0 && window.SONIDO) SONIDO.tocar("caida", { vol: 0.4, tono: 1.1 });
    jug.saltoAntes = jug.salto;
    pasos(dt, er);
    sonidosCiudad(dt, er);
    jug.anda = mov ? (jug.correr ? 2 : 1) : 0;
    er.anda = jug.anda;
    // el motor ve a Eromash en el lugar del bosque que corresponde (mapa, misiones, guardado)
    const [fx, fy] = aBosque(er.x, er.y);
    jug.x = fx;
    jug.y = fy;
    jugUlt = [fx, fy];
    // salir de la ciudad por un camino de afuera (del lado del río el muelle y el puente quedan más lejos)
    const lejosSalida = Math.abs(Math.atan2(er.y, er.x)) < 0.75 ? plano.R_FUERA - 12 * M : plano.R_MURO + 18 * M;
    if (Math.hypot(er.x, er.y) > lejosSalida && libre) return salir();
    if (!libre || modoAntes !== "juego") return;
    if (CONTROLES.recien("interactuar") && !tarjetaAntes) {
      const c0 = cercano();
      if (c0) c0.fn();
      if (J.dentro !== sistemaCiudad) return;
    }
    if (CONTROLES.recien("lente") && A.usarLente) {
      const s0 = sondaCercana(6 * M);
      if (s0) asomado(s0.fx + ((er.x - s0.x) / M) * 12, s0.fy + ((er.y - s0.y) / M) * 12, A.usarLente);
      else A.usarLente();
    }
    if (CONTROLES.recien("inventario") && window.INVENTARIO) INVENTARIO.abrir("equipo");
    if (CONTROLES.recien("mapa")) abrirMapa();
  }

  // ---------- la cámara: sigue a Eromash, Z / X giran, acercar y alejar (o la rueda) ----------
  function camaraPaso(dt, cw, ch) {
    const libre = J.modo === "juego";
    if (libre && CONTROLES.pulsado("camaraIzq")) giroObj -= dt * 1.05;
    if (libre && CONTROLES.pulsado("camaraDer")) giroObj += dt * 1.05;
    if (libre && CONTROLES.pulsado("acercar")) zoom = Math.min(1.2, zoom + dt * 0.3);
    if (libre && CONTROLES.pulsado("alejar")) zoom = Math.max(0.22, zoom - dt * 0.3);
    const dg = corto(giroObj - cam.g);
    cam.g += dg * Math.min(1, dt * 8);
    const escObj = zoom * Math.sqrt((cw * ch) / (1600 * 900));
    cam.esc += (escObj - cam.esc) * Math.min(1, dt * 6);
    const e = ero();
    cam.x += (e.x - cam.x) * Math.min(1, dt * 6);
    cam.y += (e.y - cam.y) * Math.min(1, dt * 6);
  }
  addEventListener("wheel", (ev) => {
    if (!activo || J.modo !== "juego" || (ev.target && ev.target.closest && ev.target.closest(".ui, #capaCaja, #mapaLienzo, #mapa25Lienzo"))) return;
    zoom = Math.max(0.22, Math.min(1.2, zoom - Math.sign(ev.deltaY) * 0.04));
  }, { passive: true });

  // ---------- armar la ciudad (la primera vez que se entra) ----------
  function armar() {
    MUNDO25.armar({
      juego: true,
      // Eromash es el del juego (con su equipo y su animación)
      dibujarEro: (c, x, y) => A.dibujarJugadorEn(c, x, y, 1),
      // los cofres escondidos dan algo de plata además de lo que cuentan
      alCofre: () => window.PODERES && PODERES.darPlata(20),
    });
    plano = MUNDO25.plano();
    M = plano.M;
    ANCLAS = anclasBosque();
    armarSondas();
    nativos = new Set();
    for (const p of MUNDO25.gente()) if (p.nombrado) nativos.add(t("av.accion_hablar") + " · " + t("av.nombre_" + p.id));
    listo = true;
  }

  // ---------- entrar y salir ----------
  function entrar(desde) {
    if (activo) return;
    J.modo = "cine";
    HUD.fundido(true);
    if (!listo) HUD.aviso(t("ek.llegando"), "#FFD98A");
    setTimeout(() => {
      try {
        if (!listo) armar();
      } catch (e) {
        console.error(e);
        HUD.fundido(false);
        J.modo = "juego";
        return;
      }
      RECORRER25.cargar(st.hallado);
      let p;
      if (desde && desde.rapido && st.volverA) (p = st.volverA), (st.volverA = null);
      else if (desde && desde.guardado) p = [st.x, st.y];
      else if (desde && desde.puerta && plano.anclas["puerta_" + desde.puerta]) {
        // del lado de adentro de la puerta, un poco más adentro que el portón
        const q = plano.anclas["puerta_" + desde.puerta],
          l = Math.hypot(q[0], q[1]);
        p = [q[0] - (q[0] / l) * 3 * M, q[1] - (q[1] / l) * 3 * M];
      } else p = lugarDe(jug.x, jug.y);
      if (!MUNDO25.libre(p[0], p[1], 30)) p = MUNDO25.buscarLibre(p[0], p[1]);
      const e = ero();
      e.x = cam.x = p[0];
      e.y = cam.y = p[1];
      e.huellas.length = 0;
      if (st.g != null) giroObj = cam.g = st.g;
      if (st.zoom != null) zoom = st.zoom;
      cam.esc = zoom * Math.sqrt((innerWidth * innerHeight) / (1600 * 900));
      activo = true;
      volver = false;
      J.dentro = sistemaCiudad;
      jug.atk = null;
      jug.anda = 0;
      jug.z = 0;
      st.dentro = true;
      const [fx, fy] = aBosque(e.x, e.y);
      jug.x = fx;
      jug.y = fy;
      jugUlt = [fx, fy];
      // el cartel dorado (CARTEL): «Capital descubierta» con el estandarte la primera vez, el chico al volver
      if (window.CARTEL) CARTEL.entra("eikholt");
      else if (H.descubrir) H.descubrir("eikholt");
      ubicarHistoria();
      if (!window.CARTEL && (!desde || !desde.rapido)) HUD.aviso(t("ek.nombre"), "#FFD98A");
      setTimeout(() => {
        HUD.fundido(false);
        J.modo = "juego";
        CONTROLES.soltar();
      }, 150);
    }, desde && desde.rapido ? 60 : listo ? 650 : 700);
  }
  function salir() {
    if (!activo || J.modo !== "juego") return;
    J.modo = "cine";
    HUD.fundido(true);
    RECORRER25.cerrar();
    // la puerta más cercana a por donde se fue
    const e = ero(),
      a = Math.atan2(e.y, e.x);
    let mejor = null,
      dm = Infinity;
    for (const k in plano.puertas) {
      const d = Math.abs(corto(plano.puertas[k] - a));
      if (d < dm) {
        dm = d;
        mejor = plano.puertas[k];
      }
    }
    setTimeout(() => {
      activo = false;
      if (window.CARTEL) CARTEL.sale("eikholt");
      st.dentro = false;
      J.dentro = null;
      const C = W.CIUDAD;
      let x = C.c[0] + Math.cos(mejor) * (C.rx + 320),
        y = C.c[1] + Math.sin(mejor) * (C.ry + 320);
      for (let r = 0; r < 600 && !W.libre(x, y, 18); r += 20) {
        x += Math.cos(mejor) * 20;
        y += Math.sin(mejor) * 20;
      }
      jug.x = x;
      jug.y = y;
      jug.z = 0;
      jug.mira = { vista: Math.abs(Math.sin(mejor)) > 0.5 ? (Math.sin(mejor) > 0 ? "S" : "N") : "E", espejo: Math.cos(mejor) < -0.5 };
      J.cam.x = x;
      J.cam.y = y - 30;
      salida = 2.5; // que no vuelva a entrar enseguida
      setTimeout(() => {
        HUD.fundido(false);
        J.modo = "juego";
        CONTROLES.soltar();
      }, 150);
    }, 650);
  }

  // ---------- el cuadro ----------
  let tarjetaAntes = false;
  const hora = () => LUZ.hora(H.E.tiempo);
  function paso(dt) {
    if (vigilar()) return;
    dt = Math.min(dt, 0.05);
    dtUlt = dt;
    tiempo += dt;
    const h = hora();
    tarjetaAntes = RECORRER25.tarjetaAbierta();
    if (J.modo === "juego" || J.modo === "dialogo") jugadorPaso(dt);
    if (!activo) return;
    RECORRER25.callados = J.modo !== "juego";
    RECORRER25.actualizar(dt, tiempo, h, cam, null);
    if (window.ASAMBLEA25) ASAMBLEA25.actualizar(plano, MUNDO25.gente(), A);
    if (window.ESCONDIDAS25 && J.modo === "juego") ESCONDIDAS25.actualizar(dt, plano, MUNDO25.gente(), st, A, ero());
    if (window.PROMESAS25) PROMESAS25.actualizar(st);
    if (window.LADRON25 && J.modo === "juego") LADRON25.actualizar(dt, plano, MUNDO25.gente(), st, A, ero());
    if (window.TIRO25) TIRO25.actualizar(dt, st, A);
    for (const p of MUNDO25.gente()) if (p.charla > 0 && (p.charla -= dt) <= 0) p.miraA = null;
    MUNDO25.moverGente(dt, h, (p) => oculto(p) || bajoTecho(p));
    mirarHistoria();
    // cada tanto: quién está dónde (la historia avanza) y dónde quedó Eromash
    guardar += dt;
    if (guardar % 1 < dt) {
      ubicarHistoria();
      st.x = ero().x;
      st.y = ero().y;
      st.g = giroObj;
      st.zoom = zoom;
      st.hallado = RECORRER25.estado();
    }
    if (guardar > 30) {
      guardar = 0;
      H.guardar();
    }
    modoAntes = J.modo;
  }
  function dibujar(c, cw, ch) {
    if (!activo) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.fillStyle = "#111111";
      c.fillRect(0, 0, cw, ch);
      return;
    }
    const dt = J.modo === "juego" || J.modo === "dialogo" ? dtUlt : 0;
    camaraPaso(dt || 1e-4, cw, ch);
    MUNDO25.dibujar(c, cam, cw, ch, tiempo, hora(), historia);
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (window.PERDIDOS25) PERDIDOS25.brillo(c, cam, cw, ch, tiempo, plano, st, A);
    climaCiudad(c, cw, ch, dt);
    if (window.TIRO25) TIRO25.dibujar(c, cw, ch, tiempo);
  }
  // con lluvia fuerte la mitad de los que pasean se meten bajo techo (los de la Guardia y los que tienen nombre, no)
  const bajoTecho = (p) => lluvia > 0.5 && !p.nombrado && !p.ronda && !p.puesto && !p.farol && !/guardia/.test(p.id) && (p.techo === undefined ? (p.techo = Math.random() < 0.5) : p.techo);
  // el mismo clima del día que el bosque (VIDA.climaAhora): la lluvia cae inclinada sobre la ciudad y la oscurece un
  // poco, la bruma del alba la blanquea. Calidad baja: nada; media: menos gotas.
  let lluvia = 0,
    bruma = 0;
  function climaCiudad(c, cw, ch, dt) {
    if (!window.VIDA || !VIDA.climaAhora) return;
    const cl = VIDA.climaAhora(),
      k = Math.min(1, (dt || 0) * 0.4);
    lluvia += (cl.ll - lluvia) * k;
    bruma += (cl.br - bruma) * k;
    const nv = window.CALIDAD ? CALIDAD.nivel : "alta";
    if (nv === "baja") return;
    if (bruma > 0.02) {
      c.fillStyle = `rgba(214,222,230,${0.16 * bruma})`;
      c.fillRect(0, 0, cw, ch);
    }
    if (lluvia > 0.02) {
      const n0 = Math.round((nv === "alta" ? 260 : 110) * lluvia),
        T = tiempo;
      c.save();
      c.globalAlpha = 0.35;
      c.strokeStyle = "#C8DCE0";
      c.lineWidth = 1.6;
      c.beginPath();
      for (let i = 0; i < n0; i++) {
        const sx = (Math.sin(i * 12.9898) * 43758.5453) % 1,
          v = 0.8 + Math.abs((Math.sin(i * 78.233) * 12345.678) % 1) * 0.4,
          q = (T * 1.3 * v + Math.abs((Math.sin(i * 4.1) * 9876.5) % 1)) % 1;
        const x = (Math.abs(sx) * cw + q * 120) % cw,
          y = q * (ch + 200) - 100;
        c.moveTo(x, y);
        c.lineTo(x - 8, y - 30);
      }
      c.stroke();
      c.globalAlpha = 0.12 * lluvia;
      c.fillStyle = "#1E2A34";
      c.fillRect(0, 0, cw, ch);
      c.restore();
    }
  }
  // ---------- el mapa propio (ciudad/mapa.js): la M abre el de la ciudad y desde ahí se pasa al del bosque ----------
  const datosMapa = () => ({
    plano,
    ero: ero(),
    dir: jug.dirMundo || [0, 1],
    gente: MUNDO25.gente(),
    marca: st && st.marca,
    casas: plano.casasQueSeEntran,
    vistas: (st && st.casasVistas) || [],
  });
  // «Hoy en Eikholt»: lo que pasa hoy en la ciudad, para el pie del mapa (asamblea, ratero, lo perdido, el recado
  // tomado, la cinta atada y los viejos del hnefatafl)
  function hoyEnEikholt() {
    const d = Math.floor(((H.E.tiempo / LUZ.DIA) * 24 + 9 - 6) / 24),
      h = hora(),
      l = [];
    if (window.ASAMBLEA25) l.push(d % 3 === 0 ? t("ek.hoy_ting") : t("ek.hoy_ting_en", [3 - (d % 3)]));
    if (window.LADRON25 && d % 2 === 1 && !(st.ladron && st.ladron.dia === d)) l.push(t("ek.hoy_ladron"));
    if (window.PERDIDOS25 && !(st.perdido && st.perdido.dia === d && st.perdido.hecho)) {
      const p = PERDIDOS25.hoy(plano, A);
      l.push(st.perdido && st.perdido.dia === d && st.perdido.sabe ? t("ek.hoy_perdido_donde", [t("ek.pd_cosa_" + p.cosa), t("ci.m_" + p.lugar)]) : t("ek.hoy_perdido"));
    }
    if (st.recados && st.recados.activo && window.RECADOS25) l.push(t("ek.hoy_recado", [t("ek.rc_cosa_" + (st.recados.i % RECADOS25.LISTA.length))]));
    const pr = window.PROMESAS25 && PROMESAS25.activa();
    if (pr) l.push(t("ek.hoy_promesa", [t("ek.pr_" + pr.deseo)]));
    if (window.TAFL25 && h < 18 && !(st.tafl && st.tafl.dia === d)) l.push(t("ek.hoy_tafl"));
    return l.length ? `<div class="sub mapa-hoy"><b>${t("ek.hoy_titulo")}</b> · ${l.join(" · ")}</div>` : "";
  }
  function abrirMapa() {
    if (!window.MAPA25) return window.MAPA && MAPA.abrir();
    MAPA25.abrir({ A, plano, vivo: datosMapa, hoy: hoyEnEikholt(), ponerMarca: (m) => st && (st.marca = m), alBosque: () => window.MAPA && MAPA.abrir() });
  }
  const sistemaCiudad = { paso, dibujar, cercano };

  // ---------- el sistema (en el bosque: detecta cuando Eromash llega a la ciudad) ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      H = A.H;
    },
    alEmpezar(extra) {
      extra.eikholt = Object.assign({ dentro: false }, extra.eikholt || {});
      st = extra.eikholt;
      // las partidas de la ciudad 3D guardaban la posición en metros (x, z): no sirven en el plano 2.5D
      if (st.z != null && st.y == null) st.x = null;
      if (activo) {
        activo = false;
        if (J.dentro === sistemaCiudad) J.dentro = null;
      }
      if (listo) RECORRER25.cargar(st.hallado);
      salida = 0;
      volver = false;
      // ?eikholt=1 (pruebas): arranca en la Puerta del Sur, del lado de adentro
      if (/[?&]eikholt=1/.test(location.search) && !st.dentro) {
        jug.x = W.CIUDAD.c[0];
        jug.y = W.CIUDAD.c[1] + W.CIUDAD.ry * 0.97;
      }
    },
    actualizar(dt) {
      if (salida > 0) salida -= dt;
      // se fue a un cuarto del bosque (la ciudad no se enteró porque su paso no corre ahí) y ya volvió
      if (activo && J.dentro !== sistemaCiudad) {
        activo = false;
        volver = true;
      }
      if (st && window.PROMESAS25) PROMESAS25.actualizar(st);
      if (activo || !st || J.modo !== "juego" || salida > 0) return;
      if (!dentroElipse(jug.x, jug.y, 0.985)) {
        volver = false;
        return;
      }
      // volvió de un cuarto del bosque (una casa, la bodega del Hongo): entra junto a esa puerta, sin fundido largo
      if (volver) return entrar({ rapido: true });
      // por cuál puerta llegó
      const C = W.CIUDAD;
      const a = Math.atan2((jug.y - C.c[1]) / C.ry, (jug.x - C.c[0]) / C.rx);
      const PUERTAS = { sur: Math.PI / 2, norte: -Math.PI / 2, este: 0, oeste: Math.PI };
      let puerta = null;
      for (const k in PUERTAS) if (Math.abs(corto(PUERTAS[k] - a)) < 0.12 && !dentroElipse(jug.x, jug.y, 0.9)) puerta = k;
      const guardado = st.dentro && st.x != null && st.y != null && !puerta && plano;
      if (guardado && Math.hypot(aBosque(st.x, st.y)[0] - jug.x, aBosque(st.x, st.y)[1] - jug.y) < 2500) entrar({ guardado: true });
      else entrar({ puerta });
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { mini: (cv, px) => activo && plano && window.MAPA25 && MAPA25.mini(cv, px, datosMapa()), barrio: () => (window.RECORRER25 && RECORRER25.zona()) || null, abrirMapa, activo: () => activo && J.dentro === sistemaCiudad, cam, plano: () => plano, ero, entrar, salir, anclas: () => ANCLAS, lugarDe, estado: () => st, jug: () => jug, cercano: () => activo && cercano() };
})();
