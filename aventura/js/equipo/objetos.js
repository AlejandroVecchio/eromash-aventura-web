// ---------- los objetos de equipo: bases, rarezas, afijos y nombres (módulo OBJETOS) ----------
// Cada pieza que cae o se compra sale de acá: una base (Espada ancha, Cota de malla…), un nivel de objeto (el de la
// criatura o el lugar), una rareza y sus afijos. Como en el Diablo: común (blanca, sin afijos), mágica (azul, uno o dos
// afijos y nombre con adjetivo y «del Oso»), rara (dorada, tres o cuatro afijos y nombre propio: «Colmillo del
// Invierno») y legendaria (naranja, cinco afijos altos). Los nombres se arman en vivo desde claves (ob.*), así cambian
// solos si cambia el idioma; en español el adjetivo concuerda con la base (afilado, afilada, afilados, afiladas).
// Las estadísticas de cada afijo se suman al jugador con aportar(s, piezas) desde motor/botin.js. Detalle y fórmulas
// en docs/rpg.md (Objetos y botín).
window.OBJETOS = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);

  // ---------- rarezas ----------
  // col: el color del nombre y del borde; mult: cuánto sube el daño o la armadura de la base; afijos: [mín, máx]
  const RAREZAS = [
    { id: "comun", col: "#F2ECEC", mult: 1, afijos: [0, 0] },
    { id: "magico", col: "#4A78D0", mult: 1.08, afijos: [1, 2] },
    { id: "raro", col: "#FFD98A", mult: 1.16, afijos: [3, 4] },
    { id: "legendario", col: "#F5A524", mult: 1.3, afijos: [5, 5] },
    // de conjunto (verde, motor/conjuntos.js): nunca sale sola en la tirada, sus afijos son fijos
    { id: "conjunto", col: "#7BC86C", mult: 1.2, afijos: [0, 0] },
  ];
  // el color del nombre en paneles oscuros (el azul maná se lee mal sobre negro: se aclara un poco)
  const COL_TEXTO = ["#F2ECEC", "#8FB0F0", "#FFD98A", "#F5A524", "#9BE08C"];

  // ---------- bases ----------
  // g: género en español (m, f, mp, fp) para que concuerde el adjetivo. dano y vel (armas), arm (armaduras), desde: el
  // nivel de objeto desde el que puede salir. arte: con qué dibujo de la arena se muestra (arte.js).
  const BASES = {
    espadaHierro: { slot: "arma", tipo: "espada", g: "f", dano: 10, vel: 1, desde: 1, arte: { lib: "espada", fam: "bastarda" } },
    espadaAncha: { slot: "arma", tipo: "espada", g: "f", dano: 12, vel: 0.9, desde: 3, arte: { lib: "espada", fam: "ancha" } },
    sable: { slot: "arma", tipo: "espada", g: "m", dano: 9, vel: 1.12, desde: 5, arte: { lib: "espada", fam: "cimitarra" } },
    espadaRunica: { slot: "arma", tipo: "espada", g: "f", dano: 10, vel: 1, desde: 8, implicito: [["runico", 8]], arte: { lib: "espada", fam: "runica" } },
    espadaHueso: { slot: "arma", tipo: "espada", g: "f", dano: 11, vel: 1, desde: 12, implicito: [["robo", 1]], arte: { lib: "espada", fam: "huesos" } },
    // hachas (motor/armas.js): más lentas y anchas, sangran y se lanzan cargando
    hachaMano: { slot: "arma", tipo: "hacha", g: "f", dano: 10, vel: 1, desde: 1, arte: { lib: "arma", forma: "hacha", fam: 0 } },
    hachaBarbuda: { slot: "arma", tipo: "hacha", g: "f", dano: 11, vel: 0.95, desde: 4, arte: { lib: "arma", forma: "hacha", fam: 1 } },
    hachaRunica: { slot: "arma", tipo: "hacha", g: "f", dano: 10, vel: 1, desde: 9, implicito: [["runico", 8]], arte: { lib: "arma", forma: "hacha", fam: 2 } },
    hachaHueso: { slot: "arma", tipo: "hacha", g: "f", dano: 11, vel: 1, desde: 13, implicito: [["robo", 1]], arte: { lib: "arma", forma: "hacha", fam: 3 } },
    hachaDoble: { slot: "arma", tipo: "hacha", g: "f", dano: 12, vel: 0.92, desde: 16, arte: { lib: "arma", forma: "hacha", fam: 4 } },
    // a dos manos (motor/armas.js): pegan más fuerte y más ancho, pero sin escudo; manteniendo atacar, el torbellino
    mandoble: { slot: "arma", tipo: "mandoble", dosManos: true, g: "m", dano: 16, vel: 0.8, desde: 2, arte: { lib: "arma", forma: "mandoble", fam: 0 } },
    espadon: { slot: "arma", tipo: "mandoble", dosManos: true, g: "m", dano: 18, vel: 0.74, desde: 6, arte: { lib: "arma", forma: "mandoble", fam: 1 } },
    espadonRunico: { slot: "arma", tipo: "mandoble", dosManos: true, g: "m", dano: 17, vel: 0.8, desde: 11, implicito: [["runico", 10]], arte: { lib: "arma", forma: "mandoble", fam: 2 } },
    mandobleHueso: { slot: "arma", tipo: "mandoble", dosManos: true, g: "m", dano: 18, vel: 0.78, desde: 15, implicito: [["robo", 2]], arte: { lib: "arma", forma: "mandoble", fam: 3 } },
    flamigera: { slot: "arma", tipo: "mandoble", dosManos: true, g: "f", dano: 19, vel: 0.78, desde: 18, implicito: [["fuego", 6]], arte: { lib: "arma", forma: "mandoble", fam: 4 } },
    hachaDanesa: { slot: "arma", tipo: "hacha2", dosManos: true, g: "f", dano: 18, vel: 0.75, desde: 3, arte: { lib: "arma", forma: "hacha2", fam: 0 } },
    hachaGuerra: { slot: "arma", tipo: "hacha2", dosManos: true, g: "f", dano: 20, vel: 0.7, desde: 8, arte: { lib: "arma", forma: "hacha2", fam: 1 } },
    hachaRunica2: { slot: "arma", tipo: "hacha2", dosManos: true, g: "f", dano: 19, vel: 0.74, desde: 12, implicito: [["runico", 10]], arte: { lib: "arma", forma: "hacha2", fam: 2 } },
    hachaHueso2: { slot: "arma", tipo: "hacha2", dosManos: true, g: "f", dano: 20, vel: 0.72, desde: 15, implicito: [["robo", 2]], arte: { lib: "arma", forma: "hacha2", fam: 3 } },
    labrys: { slot: "arma", tipo: "hacha2", dosManos: true, g: "f", dano: 22, vel: 0.66, desde: 19, arte: { lib: "arma", forma: "hacha2", fam: 4 } },
    // arcos (motor/arco.js): a distancia y con las dos manos; manteniendo atacar, el tiro tenso que atraviesa
    arcoCorto: { slot: "arma", tipo: "arco", dosManos: true, g: "m", dano: 9, vel: 1.05, desde: 1, arte: { lib: "arma", forma: "arco", fam: 0 } },
    arcoLargo: { slot: "arma", tipo: "arco", dosManos: true, g: "m", dano: 11, vel: 0.95, desde: 5, arte: { lib: "arma", forma: "arco", fam: 1 } },
    arcoRunico: { slot: "arma", tipo: "arco", dosManos: true, g: "m", dano: 10, vel: 1, desde: 10, implicito: [["runico", 8]], arte: { lib: "arma", forma: "arco", fam: 2 } },
    arcoAsta: { slot: "arma", tipo: "arco", dosManos: true, g: "m", dano: 11, vel: 1, desde: 14, implicito: [["robo", 1]], arte: { lib: "arma", forma: "arco", fam: 3 } },
    arcoRecurvo: { slot: "arma", tipo: "arco", dosManos: true, g: "m", dano: 11, vel: 1.1, desde: 17, implicito: [["crit", 4]], arte: { lib: "arma", forma: "arco", fam: 4 } },
    // lanzas (motor/lanza.js): estocadas largas, la punta pega más, se arrojan y vuelven; con una mano (escudo sí)
    lanzaHoja: { slot: "arma", tipo: "lanza", g: "f", dano: 9, vel: 1.05, desde: 1, arte: { lib: "arma", forma: "lanza", fam: 0 } },
    lanzaAlada: { slot: "arma", tipo: "lanza", g: "f", dano: 10, vel: 1, desde: 5, arte: { lib: "arma", forma: "lanza", fam: 1 } },
    lanzaRunica: { slot: "arma", tipo: "lanza", g: "f", dano: 10, vel: 1, desde: 10, implicito: [["runico", 8]], arte: { lib: "arma", forma: "lanza", fam: 2 } },
    lanzaHueso: { slot: "arma", tipo: "lanza", g: "f", dano: 11, vel: 1, desde: 13, implicito: [["robo", 1]], arte: { lib: "arma", forma: "lanza", fam: 3 } },
    atgeir: { slot: "arma", tipo: "lanza", g: "m", dano: 12, vel: 0.95, desde: 17, arte: { lib: "arma", forma: "lanza", fam: 4 } },
    // martillos y mazas (motor/martillo.js): lentos, quiebran a la criatura y cargados llaman al trueno; con escudo
    mazo: { slot: "arma", tipo: "martillo", g: "m", dano: 11, vel: 0.9, desde: 1, arte: { lib: "arma", forma: "martillo", fam: 0 } },
    mazaPestanas: { slot: "arma", tipo: "martillo", g: "f", dano: 12, vel: 0.88, desde: 6, arte: { lib: "arma", forma: "martillo", fam: 1 } },
    martilloRunico: { slot: "arma", tipo: "martillo", g: "m", dano: 12, vel: 0.9, desde: 11, implicito: [["runico", 10]], arte: { lib: "arma", forma: "martillo", fam: 2 } },
    quijada: { slot: "arma", tipo: "martillo", g: "f", dano: 13, vel: 0.88, desde: 14, implicito: [["robo", 1]], arte: { lib: "arma", forma: "martillo", fam: 3 } },
    mazoPiedra: { slot: "arma", tipo: "martillo", g: "m", dano: 14, vel: 0.82, desde: 18, arte: { lib: "arma", forma: "martillo", fam: 4 } },
    // bastones rúnicos (motor/baston.js): pegan con el poder rúnico, chispas que buscan y el sello; dos manos
    varaFresno: { slot: "arma", tipo: "baston", dosManos: true, g: "f", dano: 9, vel: 1, desde: 1, implicito: [["runico", 4]], arte: { lib: "arma", forma: "baston", fam: 0 } },
    baculoVolva: { slot: "arma", tipo: "baston", dosManos: true, g: "m", dano: 10, vel: 1, desde: 5, implicito: [["regenRunica", 10]], arte: { lib: "arma", forma: "baston", fam: 1 } },
    bastonCristal: { slot: "arma", tipo: "baston", dosManos: true, g: "m", dano: 10, vel: 1, desde: 10, implicito: [["runico", 12]], arte: { lib: "arma", forma: "baston", fam: 2 } },
    bastonAsta: { slot: "arma", tipo: "baston", dosManos: true, g: "m", dano: 11, vel: 1, desde: 14, implicito: [["robo", 1]], arte: { lib: "arma", forma: "baston", fam: 3 } },
    ramaYggdrasil: { slot: "arma", tipo: "baston", dosManos: true, g: "f", dano: 11, vel: 1.05, desde: 18, implicito: [["runico", 15]], arte: { lib: "arma", forma: "baston", fam: 4 } },
    // los escudos (motor/escudo.js): bloqueo = cuánto le sacan a un golpe de adelante; parada = la ventana en segundos
    escudoTablas: { slot: "escudo", g: "m", arm: 3, bloqueo: 50, parada: 0.24, desde: 1, arte: { lib: "escudo" } },
    escudoRedondo: { slot: "escudo", g: "m", arm: 5, bloqueo: 60, parada: 0.2, desde: 1, arte: { lib: "escudo" } },
    escudoGuarnecido: { slot: "escudo", g: "m", arm: 8, bloqueo: 70, parada: 0.18, desde: 10, arte: { lib: "escudo" } },
    escudoCometa: { slot: "escudo", g: "m", arm: 11, bloqueo: 82, parada: 0.14, desde: 15, arte: { lib: "escudo" } },
    casco: { slot: "casco", g: "m", arm: 3, desde: 1, arte: { lib: "casco" } },
    yelmo: { slot: "casco", g: "m", arm: 5, desde: 9, arte: { lib: "casco" } },
    jubon: { slot: "pecho", g: "m", arm: 6, desde: 1, arte: { lib: "pechera" } },
    cotaMalla: { slot: "pecho", g: "f", arm: 9, desde: 6, arte: { lib: "pechera" } },
    coraza: { slot: "pecho", g: "f", arm: 13, desde: 14, arte: { lib: "pechera" } },
    calzas: { slot: "piernas", g: "fp", arm: 3, desde: 1, arte: { lib: "pantalon" } },
    grebas: { slot: "piernas", g: "fp", arm: 5, desde: 10, arte: { lib: "pantalon" } },
    botasCuero: { slot: "botas", g: "fp", arm: 2, desde: 1, implicito: [["velMov", 2]], arte: { lib: "bota" } },
    botasHerradas: { slot: "botas", g: "fp", arm: 3, desde: 10, implicito: [["velMov", 3]], arte: { lib: "bota" } },
    amuleto: { slot: "amuleto", g: "m", desde: 1, implicito: [["runico", 3]], arte: { lib: "amuleto" } },
    talisman: { slot: "amuleto", g: "m", desde: 12, implicito: [["runico", 6]], arte: { lib: "amuleto", forma: 1 } },
    anillo: { slot: "anillo", g: "m", desde: 1, arte: { lib: "anillo" } },
    sortija: { slot: "anillo", g: "f", desde: 10, implicito: [["crit", 1]], arte: { lib: "anillo", forma: 1 } },
  };
  // las casillas del equipo, en el orden en que se muestran (los dos anillos usan la misma base)
  const SLOTS = ["arma", "escudo", "casco", "pecho", "piernas", "botas", "amuleto", "anillo1", "anillo2"];
  const slotDe = (casilla) => (casilla === "anillo1" || casilla === "anillo2" ? "anillo" : casilla);
  const ARMAS = ["arma"];
  const ARMADURAS = ["escudo", "casco", "pecho", "piernas", "botas"];
  const JOYAS = ["amuleto", "anillo"];

  // ---------- afijos ----------
  // k: la estadística; p: prefijo (adjetivo) o sufijo («del Oso»); en: dónde puede salir; v(n): [mín, máx] al nivel de
  // objeto n; pc: se muestra como porcentaje. Una pieza no repite estadística.
  const TODO = ARMAS.concat(ARMADURAS, JOYAS);
  const AFIJOS = {
    // prefijos
    danoP: { k: "danoP", p: 1, en: ["arma", "anillo", "amuleto"], v: (n) => [4 + n * 0.4, 9 + n * 0.9], pc: 1 },
    fuego: { k: "fuego", p: 1, en: ["arma", "anillo"], v: (n) => [1 + n * 0.5, 3 + n * 1.1] },
    crit: { k: "crit", p: 1, en: ["arma", "anillo", "amuleto", "casco"], v: (n) => [1 + n * 0.06, 3 + n * 0.14], pc: 1 },
    velAtq: { k: "velAtq", p: 1, en: ["arma", "anillo", "amuleto"], v: (n) => [3 + n * 0.1, 6 + n * 0.25], pc: 1 },
    armadura: { k: "armadura", p: 1, en: ARMADURAS, v: (n) => [2 + n * 0.4, 5 + n * 1] },
    vida: { k: "vida", p: 1, en: ARMADURAS.concat(JOYAS), v: (n) => [6 + n * 1.5, 12 + n * 3] },
    runico: { k: "runico", p: 1, en: ["amuleto", "anillo", "casco", "arma"], v: (n) => [4 + n * 0.3, 9 + n * 0.7], pc: 1 },
    robo: { k: "robo", p: 1, en: ["arma", "amuleto", "anillo"], v: (n) => [1 + n * 0.03, 2 + n * 0.08], pc: 1 },
    // sufijos
    fue: { k: "fue", p: 0, en: TODO, v: (n) => [1, 2 + n / 6] },
    des: { k: "des", p: 0, en: TODO, v: (n) => [1, 2 + n / 6] },
    vig: { k: "vig", p: 0, en: TODO, v: (n) => [1, 2 + n / 6] },
    esp: { k: "esp", p: 0, en: TODO, v: (n) => [1, 2 + n / 6] },
    estamina: { k: "estamina", p: 0, en: ["pecho", "piernas", "botas", "amuleto"], v: (n) => [5 + n * 0.5, 10 + n * 1.2] },
    regen: { k: "regen", p: 0, en: ["pecho", "casco", "amuleto", "anillo"], v: (n) => [8 + n * 0.5, 16 + n * 1.2], pc: 1 },
    velMov: { k: "velMov", p: 0, en: ["botas"], v: (n) => [3 + n * 0.1, 6 + n * 0.2], pc: 1 },
    critMult: { k: "critMult", p: 0, en: ["arma", "amuleto", "anillo"], v: (n) => [8 + n * 0.4, 16 + n * 1], pc: 1 },
    regenRunica: { k: "regenRunica", p: 0, en: ["amuleto", "anillo", "casco"], v: (n) => [6 + n * 0.4, 12 + n * 1], pc: 1 },
    plata: { k: "plata", p: 0, en: JOYAS.concat(["casco", "botas"]), v: (n) => [6 + n * 0.3, 14 + n * 0.8], pc: 1 },
    xp: { k: "xp", p: 0, en: JOYAS.concat(["casco"]), v: (n) => [2 + n * 0.1, 5 + n * 0.25], pc: 1 },
    hallazgo: { k: "hallazgo", p: 0, en: JOYAS.concat(["casco", "botas"]), v: (n) => [5 + n * 0.3, 12 + n * 0.8], pc: 1 },
  };

  // ---------- nombres de las raras y legendarias ----------
  const SUST = ["colmillo", "aullido", "garra", "furia", "pesadilla", "canto", "sombra", "ruina", "sangre", "hambre", "juramento", "escarcha", "brasa", "grito", "mordida", "ala", "ceniza", "trueno", "velo", "corona"];
  const DE = ["invierno", "hel", "lobo", "cuervo", "niebla", "tumulo", "fenrir", "draugr", "ymir", "runas", "abismo", "tormenta", "ocaso", "hierro", "muertos", "norte", "gigantes", "fresno", "escarcha", "sangre"];

  // ---------- azar con semilla (las pruebas y el mundo fijo piden poder repetir una tirada) ----------
  function azar(sem) {
    let s = sem >>> 0 || 1;
    return () => {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return ((s >>> 0) % 100000) / 100000;
    };
  }
  let cuenta = 0;
  const uid = () => Date.now().toString(36) + (cuenta++).toString(36) + Math.floor(Math.random() * 1296).toString(36);
  const elegir = (l, rnd) => l[Math.floor(rnd() * l.length) % l.length];

  // ---------- la tirada ----------
  // op: { n (nivel de objeto), r (rareza 0-3, o null para sortearla), slot o base, rnd, hallazgo (multiplicador de
  // las chances de lo mejor), min (rareza mínima), tema (0-4, el dibujo de la arena) }
  function rarezaAl(rnd, hallazgo = 1, min = 0) {
    const w = [70, 24 * hallazgo, 5.4 * hallazgo, 0.6 * hallazgo];
    for (let i = 0; i < min; i++) w[i] = 0;
    const tot = w.reduce((a, b) => a + b, 0);
    let x = rnd() * tot;
    for (let i = 0; i < w.length; i++) if ((x -= w[i]) < 0) return i;
    return w.length - 1;
  }
  function basesPara(n, slot) {
    return Object.keys(BASES).filter((k) => BASES[k].desde <= Math.max(1, n) && (!slot || BASES[k].slot === slotDe(slot)));
  }
  function generar(op = {}) {
    const rnd = op.rnd || Math.random,
      n = Math.max(1, Math.round(op.n || 1));
    let b = op.base;
    if (!b) {
      // las bases más nuevas para el nivel salen un poco más seguido
      const l = basesPara(n, op.slot);
      b = l.length ? elegir(l.concat(l.filter((k) => BASES[k].desde > n - 8)), rnd) : "espadaHierro";
    }
    const B = BASES[b],
      r = op.r != null ? op.r : rarezaAl(rnd, op.hallazgo, op.min || 0),
      R = RAREZAS[r];
    const it = { u: uid(), b, r, n, a: [], tema: op.tema != null ? op.tema : 1, v: Math.floor(rnd() * 1000) };
    // el número principal: el daño del arma o la armadura de la pieza, que crece con el nivel de objeto
    const crece = 1 + 0.04 * (n - 1);
    // calidad (0 a 1, la forja de Ása): tira los números en la parte alta y puede pasar un poco del techo de siempre
    const q = op.calidad != null ? Math.max(0, Math.min(1, op.calidad)) : null;
    if (q != null) it.forja = Math.round(q * 100);
    if (B.dano) it.d = Math.round(B.dano * crece * R.mult * (q != null ? 0.92 + q * 0.16 : 0.95 + rnd() * 0.1) * 10) / 10;
    if (B.arm) it.ar = Math.max(1, Math.round(B.arm * (1 + 0.07 * (n - 1)) * R.mult * (q != null ? 0.88 + q * 0.3 : 0.9 + rnd() * 0.2)));
    // los afijos: en las mágicas a lo sumo un prefijo y un sufijo; en las raras y legendarias hasta tres de cada uno
    const cant = R.afijos[0] + Math.floor(rnd() * (R.afijos[1] - R.afijos[0] + 1));
    const tope = r === 1 ? 1 : 3;
    const libres = Object.keys(AFIJOS).filter((k) => AFIJOS[k].en.includes(B.slot));
    let pre = 0,
      suf = 0;
    for (let i = 0; i < cant && libres.length; i++) {
      const ok = libres.filter((k) => (AFIJOS[k].p ? pre < tope : suf < tope));
      if (!ok.length) break;
      const k = elegir(ok, rnd),
        A = AFIJOS[k],
        [lo, hi] = A.v(n);
      // las legendarias tiran siempre en la parte alta
      const u = q != null ? Math.max(r === 3 ? 0.6 : 0, q * 0.75 + rnd() * 0.25) : r === 3 ? 0.6 + rnd() * 0.4 : rnd();
      const v = Math.round(lo + (hi - lo) * u);
      it.a.push([k, Math.max(1, v)]);
      if (A.p) pre++;
      else suf++;
      libres.splice(libres.indexOf(k), 1);
    }
    // el nombre: mágicas con su mejor prefijo y sufijo; raras y legendarias con un nombre propio
    if (r === 1) {
      const p = it.a.find((q) => AFIJOS[q[0]].p),
        s = it.a.find((q) => !AFIJOS[q[0]].p);
      it.nm = [p ? p[0] : "", s ? s[0] : ""];
    } else if (r >= 2) it.nm = [Math.floor(rnd() * SUST.length), Math.floor(rnd() * DE.length)];
    // las muescas para las tallas (motor/engarces.js)
    if (window.ENGARCES && !op.sinMuescas) ENGARCES.alGenerar(it, rnd);
    return it;
  }

  // ---------- nombres ----------
  const GEN = { m: 0, f: 1, mp: 2, fp: 3 };
  function adjetivo(k, g) {
    const s = t("ob.pf_" + k).split("|");
    return s[Math.min(s.length - 1, GEN[g] || 0)];
  }
  function nombreBase(it) {
    return t("ob.b_" + it.b);
  }
  function nombre(it) {
    if (!it) return "";
    if (it.fijo) return t(it.fijo);
    if (it.pr && window.ENGARCES) return ENGARCES.nombre(it);
    if (it.cj && window.CONJUNTOS) return CONJUNTOS.nombre(it);
    const B = BASES[it.b],
      base = nombreBase(it),
      en = I18N.lang === "en";
    if (it.r === 1 && it.nm) {
      const pre = it.nm[0] ? adjetivo(it.nm[0], B.g) : "",
        suf = it.nm[1] ? t("ob.sf_" + it.nm[1]) : "";
      if (en) return [pre, base, suf].filter(Boolean).join(" ");
      return [base, pre.toLowerCase(), suf].filter(Boolean).join(" ");
    }
    if (it.r >= 2 && it.nm) {
      const s = t("ob.rn_" + SUST[it.nm[0] % SUST.length]),
        d = t("ob.rd_" + DE[it.nm[1] % DE.length]);
      return en ? d + " " + s : s + " " + d;
    }
    return base;
  }

  // ---------- lo que se lee de cada pieza ----------
  const fmt = (k, v) => {
    const A = AFIJOS[k];
    return t("ob.st_" + k, [A && A.pc ? Math.round(v) : String(Math.round(v * 10) / 10).replace(".", I18N.lang === "en" ? "." : ",")]);
  };
  // las líneas de una pieza: [{ txt, col }]; la primera es su número principal
  function lineas(it) {
    const B = BASES[it.b],
      l = [];
    if (it.d) l.push({ txt: t("ob.l_dano", [String(it.d).replace(".", I18N.lang === "en" ? "." : ","), String(B.vel).replace(".", I18N.lang === "en" ? "." : ",")]), col: "#F2ECEC", grande: true });
    if (it.ar) l.push({ txt: t("ob.l_armadura", [it.ar]), col: "#F2ECEC", grande: true });
    // cómo pega cada tipo de arma (motor/armas.js)
    if (B.tipo) l.push({ txt: t("ar.rasgo_" + B.tipo), col: "#E0B2B2" });
    if (B.dosManos) l.push({ txt: t("ar.sin_escudo"), col: "#FF8D71" });
    if (B.bloqueo) l.push({ txt: t("eb.l_bloqueo", [B.bloqueo, String(B.parada).replace(".", I18N.lang === "en" ? "." : ",")]), col: "#E0B2B2" });
    (B.implicito || []).forEach(([k, v]) => l.push({ txt: fmt(k, v), col: "#E0B2B2" }));
    if (it.forja != null) l.push({ txt: t("fg.l_forjada", [it.forja]), col: "#FFD98A" });
    it.a.forEach(([k, v]) => l.push({ txt: fmt(k, v), col: "#73D5DB" }));
    if (it.e && window.ENGARCES) ENGARCES.lineas(it).forEach((q) => l.push(q));
    if (it.cj && window.CONJUNTOS) CONJUNTOS.lineas(it).forEach((q) => l.push(q));
    return l;
  }
  // qué tipo de pieza es y su nivel: «Espada ancha · rara · nivel 7»
  function rotulo(it) {
    return t("ob.rotulo", [nombreBase(it), t("ob.r_" + RAREZAS[it.r].id), it.n]);
  }

  // ---------- lo que suma al jugador ----------
  // junta en un objeto plano lo que dan las piezas puestas: { danoP, armadura, vida, fue… } + arma (la pieza del arma)
  function sumar(piezas) {
    const s = {};
    piezas.forEach((it) => {
      if (!it) return;
      const B = BASES[it.b];
      if (it.ar) s.armadura = (s.armadura || 0) + it.ar;
      (B.implicito || []).concat(it.a, it.ex || []).forEach(([k, v]) => (s[k] = (s[k] || 0) + v));
    });
    return s;
  }
  // lo pasa a las estadísticas de RPG (s) — el arma multiplica el daño por su daño sobre 10 y la velocidad por la suya
  function aportar(s, piezas, arma) {
    const x = sumar(piezas);
    if (arma && arma.d) {
      s.dano *= arma.d / 10;
      s.velAtq *= BASES[arma.b].vel;
    }
    if (x.danoP) s.dano *= 1 + x.danoP / 100;
    if (x.crit) s.crit += x.crit / 100;
    if (x.critMult) s.critMult += x.critMult / 100;
    if (x.velAtq) s.velAtq *= 1 + x.velAtq / 100;
    if (x.velMov) s.velMov *= 1 + x.velMov / 100;
    if (x.vida) s.vida += x.vida;
    if (x.estamina) s.estamina += x.estamina;
    if (x.armadura) s.armadura += x.armadura;
    if (x.regen) s.regen *= 1 + x.regen / 100;
    if (x.runico) s.runico *= 1 + x.runico / 100;
    if (x.regenRunica) s.regenRunica *= 1 + x.regenRunica / 100;
    if (x.plata) s.plata *= 1 + x.plata / 100;
    if (x.xp) s.xp *= 1 + x.xp / 100;
    if (x.hallazgo) s.botin *= 1 + x.hallazgo / 100;
    s.robo = (s.robo || 0) + (x.robo || 0) / 100;
    s.fuego = (s.fuego || 0) + (x.fuego || 0);
    return x;
  }
  // cuánto vale (para desarmar, y más adelante para el comercio)
  function valor(it) {
    return Math.round((4 + it.n * 1.6) * [1, 2.5, 6, 15, 10][it.r] * (1 + it.a.length * 0.15));
  }

  return { RAREZAS, COL_TEXTO, BASES, SLOTS, AFIJOS, slotDe, generar, rarezaAl, basesPara, nombre, nombreBase, lineas, rotulo, sumar, aportar, valor, azar, fmt };
})();
