// ---------- el cartel de lugar (CARTEL): el cartel dorado que anuncia un lugar, una tierra nueva o la capital al llegar ----------
// Es el mismo cartel de la versión de Godot (scripts/interfaz/cartel_lugar.gd, la animación aprobada en el artefacto
// «Cartel de lugar animado», opción Chispa), con sus tiempos, medidas y colores: se encienden los rombos, dos chispas
// dibujan las líneas, aparecen el texto de abajo y el nombre en runas, las runas laten y el nombre se descubre. En una
// tierra nueva o una capital, además, detrás se dibuja en un solo trazo, desde los dos costados a la vez, el paisaje de
// la región (Eldervald) o el estandarte de la capital con su insignia (la cornamenta de Eikholt).
//
// Cuándo sale (como en Godot): la primera vez que se entra al bosque, «Tierra nueva» con el paisaje de Eldervald; la
// primera vez en un lugar de la historia, «Lugar descubierto» (Eikholt: «Capital descubierta» con el estandarte); al
// volver a un lugar después de 60 s afuera o al llegar de un viaje, el cartel chico sin texto. Las regiones del editor
// y las zonas del generador usan lo mismo. Salen de a uno, en fila; se congelan con los menús.
//   CARTEL.entra(id, op) / CARTEL.sale(id): un lugar con nombre (el motor lo pide con su borde; op.nombre, op.tipo
//     «lugar» | «tierra» | «capital», op.sub para otro texto de abajo; sin op es un lugar de la historia: av.lugar_<id>)
//   CARTEL.llegar(id, op): igual pero sin borde (las zonas, que se entran de una): la primera vez su cartel, después el chico
//   CARTEL.regreso(id): el cartel chico ya (los viajes)
//   CARTEL.mostrar(tipo, nombre, op): mostrarlo ya, sin fila (pruebas). ?cartel=lugar|tierra|regreso|capital lo repite.
// Calidad baja: sin los brillos (los contornos que resplandecen y el halo del trazo).
window.CARTEL = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);

  // ---------- parámetros (los mismos de cartel_lugar.gd; tamaños a 1080 de alto, tiempos en segundos) ----------
  const ENTRADA = { IZQ_A_DER: 1, DER_A_IZQ: 2, CENTRO_AFUERA: 3, AFUERA_CENTRO: 4 };
  const CONFIG = {
    lugar: { entrada: 1, texto: "av.cartel_lugar_descubierto", posicion: "arriba", runas: 22, nombre: 52, sub: 15, linea: 420, velocidad: 1.0, quieto: 1.8, salida: 0.9, pulso: 1.0, dibujo: "" },
    tierra: { entrada: 4, texto: "av.cartel_tierra_nueva", posicion: "centro", runas: 33, nombre: 85, sub: 22, linea: 686, velocidad: 1.25, quieto: 2.2, salida: 1.0, pulso: 1.6, dibujo: "region" },
    regreso: { entrada: 1, texto: "", posicion: "arriba", runas: 19, nombre: 44, sub: 13, linea: 247, velocidad: 0.65, quieto: 1.2, salida: 0.65, pulso: 1.0, dibujo: "" },
    capital: { entrada: 4, texto: "av.cartel_capital_descubierta", posicion: "alto", runas: 33, nombre: 85, sub: 22, linea: 686, velocidad: 1.25, quieto: 2.2, salida: 1.0, pulso: 1.6, dibujo: "estandarte" },
  };
  const AGIL = 0.75; // la primera parte (rombos, chispas, texto de abajo y runas) va un 25 % más rápida
  const ESPACIO_RUNAS = 0.47,
    ESPACIO_NOMBRE = 0.085,
    ESPACIO_SUB = 0.42;
  const ALTO_ARRIBA = 0.09,
    ALTO_CAPITAL = 0.13;
  const DIBUJO_DURA = 7.0,
    DIBUJO_PULSO = 2.0,
    DIBUJO_ANCHO = 1152.0,
    ESTANDARTE_ALTO = 760.0;
  const VOLVER_TRAS = 60; // segundos afuera de un lugar para que al volver salga el cartel chico
  const CAPITALES = ["eikholt"];
  const REGIONES = { eldervald: () => paisajeEldervald() };

  // colores: el dorado de las runas y el blanco del logo de Eromash ([r, g, b] de 0 a 255)
  const ORO = [255, 217, 138],
    ORO_LINEA = [201, 164, 90],
    ORO_BRILLO = [184, 134, 46],
    ORO_SUB = [226, 200, 148],
    BLANCO = [242, 238, 234],
    PUNTA = [255, 246, 220],
    TRAZO_FINAL = [255, 231, 176];
  const F_RUNAS = '"Noto Sans Runic", serif',
    F_NOMBRE = '700 {t}px "Eromash Display", system-ui, sans-serif',
    F_TEXTO = '400 {t}px "Eromash Text", system-ui, sans-serif';
  const fuente = (f, tam) => (f === F_RUNAS ? tam + "px " + F_RUNAS : f.replace("{t}", tam));
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.max(0, Math.min(1, a))})`;
  const mezcla = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

  const RUNAS_DE = {
    a: "ᚨ", b: "ᛒ", c: "ᚲ", d: "ᛞ", e: "ᛖ", f: "ᚠ", g: "ᚷ", h: "ᚺ", i: "ᛁ", j: "ᛃ", k: "ᚲ", l: "ᛚ", m: "ᛗ", n: "ᚾ", o: "ᛟ", p: "ᛈ", q: "ᚲ", r: "ᚱ", s: "ᛋ", t: "ᛏ",
    u: "ᚢ", v: "ᚹ", w: "ᚹ", x: "ᚲᛋ", y: "ᛃ", z: "ᛉ", "á": "ᚨ", "é": "ᛖ", "í": "ᛁ", "ó": "ᛟ", "ú": "ᚢ", "ñ": "ᚾ", "ö": "ᛟ", "ä": "ᚨ", "å": "ᚨ", "ø": "ᛟ", "æ": "ᛖ", " ": "᛫",
  };
  const aRunas = (s) => [...String(s).toLowerCase()].map((ch) => RUNAS_DE[ch] || "").join("");

  // ---------- ayudas ----------
  const tramo = (x, ini, dur) => Math.max(0, Math.min(1, (x - ini) / Math.max(dur, 0.0001)));
  const suave = (x) => x * x * (3 - 2 * x);
  const lerp = (a, b, k) => a + (b - a) * k;
  // sube de a hasta b en `pico` y baja a c (fracción 0..1 del tramo)
  const tres = (f, a, b, c, pico) => (f < pico ? lerp(a, b, f / pico) : lerp(b, c, (f - pico) / (1 - pico)));
  const borde = (i, n) => Math.min(i, n - 1 - i); // 0 en las puntas, crece hacia el centro

  // ---------- el lienzo ----------
  let lienzo = null,
    c = null,
    of = null, // el nombre se arma aparte para descubrirlo con su máscara
    oc = null,
    sombra = null, // la sombra redonda detrás de los carteles grandes, hecha una vez
    W = 0,
    H = 0,
    k = 1;
  function armar() {
    if (lienzo) return;
    lienzo = document.createElement("canvas");
    lienzo.id = "cartelLugar";
    lienzo.className = "cartel-lugar";
    document.body.appendChild(lienzo);
    c = lienzo.getContext("2d");
    of = document.createElement("canvas");
    oc = of.getContext("2d");
    sombra = document.createElement("canvas");
    sombra.width = sombra.height = 256;
    const s = sombra.getContext("2d"),
      g = s.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(4,8,8,0.55)");
    g.addColorStop(1, "rgba(4,8,8,0)");
    s.fillStyle = g;
    s.fillRect(0, 0, 256, 256);
    medir();
    addEventListener("resize", medir);
    if (window.CALIDAD && CALIDAD.on) CALIDAD.on(medir);
    // que las letras estén antes del primer cartel
    if (document.fonts && document.fonts.load) ["40px " + F_RUNAS, fuente(F_NOMBRE, 40), fuente(F_TEXTO, 40)].forEach((f) => document.fonts.load(f, "ᚨa").catch(() => {}));
  }
  function medir() {
    k = window.CALIDAD && CALIDAD.escala ? CALIDAD.escala() : Math.min(2, devicePixelRatio || 1);
    W = innerWidth;
    H = innerHeight;
    lienzo.width = Math.round(W * k);
    lienzo.height = Math.round(H * k);
  }
  const brillos = () => !window.CALIDAD || CALIDAD.nivel !== "baja";

  // ---------- estado ----------
  let tipo = "lugar",
    C = CONFIG.lugar,
    runas = "",
    sub = "",
    nombre = "",
    tt = 0,
    activo = false,
    m = {},
    dib = null,
    actualId = "";

  function mostrar(tp, nom, op) {
    op = op || {};
    armar();
    tipo = CONFIG[tp] ? tp : "lugar";
    C = Object.assign({}, CONFIG[tipo]);
    if (op.entrada) C.entrada = op.entrada;
    runas = op.runas || aRunas(nom);
    const texto = op.sub != null ? op.sub : C.texto ? t(C.texto) : "";
    sub = texto ? texto.toLocaleUpperCase(I18N.lang) : "";
    nombre = nom;
    dib = null;
    if (C.dibujo === "region" && REGIONES[op.region]) dib = REGIONES[op.region]();
    else if (C.dibujo === "estandarte" && CAPITALES.includes(op.capital)) dib = estandarte(op.capital);
    calcularMomentos();
    tt = 0;
    activo = true;
    lienzo.style.display = "block";
  }
  const duracion = () => m.total || 0;

  // ---------- tiempos ----------
  function medirTexto(f, s, tam, esp) {
    c.font = fuente(f, tam);
    let w = 0;
    for (const ch of s) w += c.measureText(ch).width + esp;
    return s.length ? w - esp : 0;
  }
  function calcularMomentos() {
    const kk = C.velocidad,
      v = AGIL,
      q = {};
    q.rombo = 0.45 * v;
    q.t0 = 0.25 * v; // salen las chispas
    q.dl = 1.1 * kk * v; // lo que tardan en llegar a las puntas
    const ns = [...sub].length,
      mitadSub = Math.max(1, Math.ceil(ns / 2));
    q.ps = Math.min(0.3, 0.9 / mitadSub) * kk * v; // entre letra y letra del texto de abajo
    q.ds = 2.0 * kk * v; // lo que tarda cada letra en aparecer
    q.ts = q.t0 + 0.1;
    const finSub = ns > 0 ? q.ts + (mitadSub - 1) * q.ps + q.ds : q.t0 + q.dl;
    const nr = [...runas].length;
    q.niv = Math.max(0, Math.ceil(nr / 2) - 1);
    q.pr = 0.2 * kk * v;
    q.dr = 1.6 * Math.max(kk, 0.75) * v;
    // las runas van un poco más rápido para terminar junto con el texto de abajo
    q.tr = ns > 0 ? Math.max(q.t0 + 0.3, finSub - q.dr - q.niv * q.pr) : q.t0 + 0.1;
    q.dn = 1.6 * Math.max(kk, 0.75); // lo que tarda el nombre en descubrirse
    q.vis = 0.375 * q.dn;
    const finArriba = q.tr + q.niv * q.pr + 0.6 * q.dr;
    q.tn = finArriba + 0.15 * kk - q.vis; // 0,15 s entre las runas y el nombre
    const dp0 = 0.8 * Math.max(kk, 0.75);
    const finPulso = q.tn + q.vis - 0.45 * dp0 + dp0;
    q.dp = dp0 * 2; // pulso de las runas: máximo cuando se ve el nombre
    q.tp = finPulso - q.dp;
    q.pico = Math.min(0.9, (q.tn + q.vis - q.tp) / q.dp);
    q.finDib = dib ? DIBUJO_DURA : 0;
    q.fin = Math.max(q.tn + q.dn + C.quieto, dib ? q.finDib + DIBUJO_PULSO + 0.3 : 0);
    q.total = q.fin + C.salida;
    m = q;
  }
  const salida = () => 1 - suave(tramo(tt, m.fin, C.salida));

  // ---------- disposición ----------
  function yBloque(e) {
    const r = C.runas * e,
      n = C.nombre * e,
      s = C.sub * e;
    const gap = (C.posicion === "arriba" ? 8 : 14) * e;
    const extra = dib && C.dibujo === "region" ? 22 * e : 0;
    const alto = r + gap + n + gap + extra + s;
    let top = H * 0.5 - alto * 0.5;
    if (C.posicion === "arriba") top = H * ALTO_ARRIBA;
    else if (C.posicion === "alto") top = H * ALTO_CAPITAL;
    const yR = top + r,
      yN = yR + gap + n * 0.92,
      yP = yN + gap + extra + s * 0.55;
    return { runas: yR, nombre: yN, pie: yP, top, alto };
  }

  // ---------- dibujo ----------
  function dibujar() {
    c.setTransform(k, 0, 0, k, 0, 0);
    c.clearRect(0, 0, W, H);
    if (!activo) return;
    const e = H / 1080,
      y = yBloque(e),
      cx = W * 0.5,
      sal = salida();
    // sombra detrás de los carteles grandes
    if (C.posicion !== "arriba") {
      const a = suave(tramo(tt, 0, 0.6)) * sal,
        w = C.linea * e * 1.25,
        h = y.alto * 2.6;
      c.globalAlpha = a;
      c.drawImage(sombra, cx - w * 0.5, y.top + y.alto * 0.5 - h * 0.5, w, h);
      c.globalAlpha = 1;
    }
    if (dib) dibujoFondo(e, y, sal);
    pie(e, y.pie, sal);
    renglonRunas(e, y.runas, sal);
    nombreMascara(e, y, sal);
  }

  function linea(x1, y1, x2, y2, c1, c2, ancho) {
    const g = c.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    c.strokeStyle = g;
    c.lineWidth = ancho;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
  }
  function circulo(x, y, r, col) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
  // contorno que resplandece (draw_string_outline de Godot)
  function contorno(ch, x, y, grosor, col) {
    if (!brillos() || grosor <= 0) return;
    c.lineJoin = "round";
    c.lineWidth = grosor;
    c.strokeStyle = col;
    c.strokeText(ch, x, y);
  }

  function pie(e, py, sal) {
    const cx = W * 0.5,
      tamSub = Math.floor(C.sub * e),
      esp = C.sub * ESPACIO_SUB * e,
      rombo = C.sub * 0.5 * e,
      hueco = 12 * e;
    const anchoSub = sub ? medirTexto(F_TEXTO, sub, tamSub, esp) : 0;
    const centro = sub ? anchoSub + (rombo * 2 + hueco * 2) * 2 : rombo * 2 + hueco * 2;
    const largo = Math.max(20, (C.linea * e - centro) * 0.5);
    // rombos
    const fr = tramo(tt, 0, m.rombo),
      escR = tres(fr, 0.2, 1.4, 1.0, 0.6),
      aR = Math.min(1, Math.max(0, fr / 0.6)) * sal;
    const rombos = sub ? [cx - anchoSub * 0.5 - hueco - rombo, cx + anchoSub * 0.5 + hueco + rombo] : [cx];
    for (const rx of rombos) rombito(rx, py, rombo * escR, aR);
    // líneas: las dibujan dos chispas desde los rombos hacia afuera; al irse se recogen
    let p = tramo(tt, m.t0, m.dl);
    p = 1 - Math.pow(1 - suave(p), 1.6);
    const rec = 1 - Math.pow(tramo(tt, m.fin, C.salida), 2);
    const largoVis = largo * p * rec;
    c.lineCap = "butt";
    for (const lado of [-1, 1]) {
      const ix = (lado < 0 ? rombos[0] : rombos[rombos.length - 1]) + lado * (rombo + hueco),
        fx = ix + lado * largoVis;
      if (largoVis > 0.5) {
        const aFin = 1 - largoVis / largo;
        linea(ix, py, fx, py, rgba(ORO, 0.35), rgba(ORO_LINEA, aFin * 0.35), 5 * e);
        linea(ix, py, fx, py, rgba(ORO, 1), rgba(ORO_LINEA, aFin), 1.6 * e);
      }
      const chispa = tramo(tt, m.t0, m.dl + 0.08);
      if (chispa > 0 && chispa < 1) {
        const aCh = chispa < 0.94 ? 1 : (1 - chispa) / 0.06;
        if (brillos()) circulo(fx, py, 9 * e, `rgba(255,191,89,${0.25 * aCh})`);
        circulo(fx, py, 3.2 * e, rgba(PUNTA, aCh));
      }
    }
    // texto de abajo: de los costados al centro
    if (sub) {
      let x = cx - anchoSub * 0.5;
      const letras = [...sub],
        n = letras.length;
      c.font = fuente(F_TEXTO, tamSub);
      c.textBaseline = "alphabetic";
      for (let i = 0; i < n; i++) {
        const ch = letras[i],
          w = c.measureText(ch).width;
        const f = tramo(tt, m.ts + borde(i, n) * m.ps, m.ds);
        const a = tres(f, 0, 0.9, 1, 0.55) * sal,
          brillo = tres(f, 0, 0.8, 0, 0.55);
        if (a > 0.01 && ch !== " ") {
          const yy = py + tamSub * 0.36;
          if (brillo > 0.01) contorno(ch, x, yy, Math.floor(tamSub * 0.5), `rgba(255,209,140,${0.3 * brillo * sal})`);
          c.fillStyle = rgba(ORO_SUB, a);
          c.fillText(ch, x, yy);
        }
        x += w + esp;
      }
    }
  }

  function rombito(x, y, r, a) {
    if (a <= 0.01) return;
    if (brillos()) circulo(x, y, r * 1.6, `rgba(255,217,138,${0.18 * a})`);
    c.strokeStyle = rgba(ORO, a);
    c.lineWidth = Math.max(1, r * 0.28);
    c.lineJoin = "miter";
    c.beginPath();
    c.moveTo(x, y - r);
    c.lineTo(x + r, y);
    c.lineTo(x, y + r);
    c.lineTo(x - r, y);
    c.closePath();
    c.stroke();
  }

  function renglonRunas(e, ry, sal) {
    const tam = Math.floor(C.runas * e),
      esp = C.runas * ESPACIO_RUNAS * e,
      ancho = medirTexto(F_RUNAS, runas, tam, esp);
    let x = W * 0.5 - ancho * 0.5;
    const letras = [...runas],
      n = letras.length;
    // pulso: las runas laten y el brillo llega al máximo justo cuando se empieza a ver el nombre
    const fp = tramo(tt, m.tp, m.dp);
    let pulso = fp > 0 && fp < 1 ? tres(fp, 0, 1, 0, m.pico) : 0;
    pulso = suave(pulso) * C.pulso;
    c.font = fuente(F_RUNAS, tam);
    c.textBaseline = "alphabetic";
    for (let i = 0; i < n; i++) {
      const ch = letras[i],
        w = c.measureText(ch).width;
      const f = tramo(tt, m.tr + borde(i, n) * m.pr, m.dr);
      const a = tres(f, 0, 0.85, 1, 0.6) * sal,
        sube = tres(f, 0.25, 0.08, 0, 0.6) * tam * 0.6,
        brillo = tres(f, 0, 1, 0.45, 0.6) + pulso * 0.55;
      if (a > 0.01) {
        contorno(ch, x, ry + sube, Math.floor(tam * (0.55 + pulso * 0.35)), rgba(ORO_BRILLO, 0.35 * brillo * a));
        c.fillStyle = rgba(mezcla(ORO, [255, 255, 255], Math.min(1, 0.25 * pulso)), a);
        c.fillText(ch, x, ry + sube);
      }
      x += w + esp;
    }
  }

  // el nombre: blanco con sombra y un brillo dorado que se asienta, descubierto con un borde difuso
  function nombreMascara(e, y, sal) {
    const tam = Math.floor(C.nombre * e),
      esp = Math.floor(C.nombre * ESPACIO_NOMBRE * e);
    const g = tramo(tt, m.tn, m.dn + 0.5),
      alfa = Math.min(1, Math.max(0, g / 0.25)) * sal;
    if (alfa <= 0.003) return;
    let f = tramo(tt, m.tn, m.dn);
    f = f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) * 0.5;
    if (f <= 0) return;
    c.font = fuente(F_NOMBRE, tam);
    const letras = [...nombre],
      anchos = letras.map((ch) => c.measureText(ch).width);
    const ancho = anchos.reduce((s, w) => s + w + esp, 0);
    const glow = lerp(0.85, 0.45, suave(g)),
      grosor = brillos() ? Math.floor(tam * 0.22 * glow) : 0;
    const pad = Math.ceil(grosor + 6 * e + 4),
      wO = ancho + pad * 2,
      hO = tam * 1.6 + pad * 2;
    const nw = Math.ceil(wO * k),
      nh = Math.ceil(hO * k);
    if (of.width < nw || of.height < nh) {
      of.width = Math.max(of.width, nw);
      of.height = Math.max(of.height, nh);
    }
    oc.setTransform(1, 0, 0, 1, 0, 0);
    oc.clearRect(0, 0, of.width, of.height);
    oc.setTransform(k, 0, 0, k, 0, 0);
    oc.globalCompositeOperation = "source-over";
    oc.font = c.font;
    oc.textBaseline = "alphabetic";
    oc.lineJoin = "round";
    const base = pad + tam * 1.05;
    const pasada = (fn) => {
      let x = pad;
      letras.forEach((ch, i) => {
        fn(ch, x);
        x += anchos[i] + esp;
      });
    };
    oc.fillStyle = "rgba(0,0,0,0.75)";
    pasada((ch, x) => oc.fillText(ch, x, base + 3 * e));
    if (grosor > 0) {
      oc.strokeStyle = `rgba(255,204,115,${0.22 * glow})`;
      oc.lineWidth = grosor;
      pasada((ch, x) => oc.strokeText(ch, x, base));
    }
    oc.fillStyle = rgba(BLANCO, 1);
    pasada((ch, x) => oc.fillText(ch, x, base));
    // la máscara: modo 1 izq→der, 2 der→izq, 3 centro→afuera, 4 afuera→centro
    const suaveM = Math.max(0.05, Math.min(0.6, (tam * 1.3) / Math.max(ancho, 1)));
    const F = f * (1 + suaveM),
      gm = oc.createLinearGradient(pad, 0, pad + ancho, 0);
    for (let i = 0; i <= 40; i++) {
      const u = i / 40;
      let w = u;
      if (C.entrada === 2) w = 1 - u;
      else if (C.entrada === 3) w = Math.abs(u - 0.5) * 2;
      else if (C.entrada === 4) w = 1 - Math.abs(u - 0.5) * 2;
      gm.addColorStop(u, `rgba(0,0,0,${Math.max(0, Math.min(1, (F - w) / suaveM))})`);
    }
    oc.globalCompositeOperation = "destination-in";
    oc.fillStyle = gm;
    oc.fillRect(0, 0, wO, hO);
    oc.globalCompositeOperation = "source-over";
    c.globalAlpha = alfa;
    c.drawImage(of, 0, 0, nw, nh, W * 0.5 - ancho * 0.5 - pad, y.nombre - base, nw / k, nh / k);
    c.globalAlpha = 1;
  }

  // ---------- paisaje / estandarte en un solo trazo ----------
  // avance del dibujo: arranca y termina despacio, como una mano que dibuja
  function avanceDibujo() {
    const x = tramo(tt, 0, DIBUJO_DURA);
    return (0.5 - 0.5 * Math.cos(Math.PI * x)) * 0.92 + x * 0.08;
  }
  function dibujoFondo(e, y, sal) {
    const u = dib.unidad;
    let esc, ox, oy;
    if (C.dibujo === "region") {
      esc = (DIBUJO_ANCHO * e) / u[0];
      const suelo = y.pie - (C.sub * 0.55 + 14) * e; // el suelo queda entre el nombre y el renglón de abajo
      ox = W * 0.5 - u[0] * esc * 0.5;
      oy = suelo - 280 * esc;
    } else {
      esc = (ESTANDARTE_ALTO * e) / u[1];
      ox = W * 0.5;
      oy = y.top - C.runas * e * 0.35 - 10 * esc; // la vara a la altura de lo alto de las runas
    }
    const M = (p) => [ox + p[0] * esc, oy + p[1] * esc];
    const x = tramo(tt, 0, DIBUJO_DURA),
      avance = avanceDibujo(),
      colorea = suave(tramo(tt, m.finDib, DIBUJO_PULSO * 0.45)); // junto con el pulso toma el color del puntero
    const fpul = tramo(tt, m.finDib, DIBUJO_PULSO),
      pulso = fpul > 0 && fpul < 1 ? suave(tres(fpul, 0, 1, 0, 0.45)) : 0;
    const principal = dib.principal,
      largo = dib.largo,
      l = avance * largo * 0.5;
    const qa = puntoEn(principal, l),
      qb = puntoEn(principal, largo - l);
    c.lineCap = "round";
    c.lineJoin = "round";
    // detalles de fondo, a la par del puntero de su lado
    for (const d of dib.fondo) {
      const ld = d.largo,
        col = rgba(ORO, (d.lejos ? 0.18 : 0.3) * sal * (1 + pulso * 0.6)),
        ancho = 0.9 * esc;
      if (d.ancho) {
        const h = ld * 0.5 * (x >= 1 ? 1 : avance); // de lado a lado: desde las dos puntas, al ritmo del trazo
        tramoDe(d.partes, 0, h, col, ancho, M);
        tramoDe(d.partes, ld - h, ld, col, ancho, M);
      } else {
        const izq = (d.x0 + d.x1) * 0.5 < u[0] * 0.5; // los de la izquierda siguen al puntero izquierdo
        const a = x >= 1 ? 1 : Math.max(0, Math.min(1, izq ? (qa[0] - d.x0) / (d.x1 - d.x0) : (d.x1 - qb[0]) / (d.x1 - d.x0)));
        if (izq) tramoDe(d.partes, 0, ld * a, col, ancho, M);
        else tramoDe(d.partes, ld * (1 - a), ld, col, ancho, M);
      }
    }
    // insignia de la capital: se tiñe de dorado con el pulso
    if (dib.insignia && colorea * sal > 0.005) {
      c.fillStyle = rgba(ORO, 0.22 * colorea * sal);
      c.beginPath();
      for (const pts of dib.insignia) {
        pts.forEach((q, i) => {
          const [px, py] = M(q);
          if (i) c.lineTo(px, py);
          else c.moveTo(px, py);
        });
        c.closePath();
      }
      c.fill();
    }
    // trazo principal, desde los dos costados a la vez
    const cT = mezcla(ORO, TRAZO_FINAL, colorea),
      aT = lerp(0.5, 1, colorea) * sal,
      w = lerp(1.3, 3.4, colorea) * esc;
    if (pulso > 0 && brillos()) {
      const gl = rgba(ORO_BRILLO, 0.35 * pulso * sal);
      tramoDe(principal, 0, l, gl, w + 9 * esc * pulso, M);
      tramoDe(principal, largo - l, largo, gl, w + 9 * esc * pulso, M);
    }
    tramoDe(principal, 0, l, rgba(cT, aT), w, M);
    tramoDe(principal, largo - l, largo, rgba(cT, aT), w, M);
    // las dos puntas que dibujan, con su puntero
    if (x < 1) {
      const seg = largo * 0.03;
      tramoDe(principal, Math.max(0, l - seg), l, rgba(TRAZO_FINAL, sal), 3.4 * esc, M);
      tramoDe(principal, largo - l, Math.min(largo, largo - l + seg), rgba(TRAZO_FINAL, sal), 3.4 * esc, M);
      for (const q of [qa, qb]) {
        const [px, py] = M(q);
        if (brillos()) {
          circulo(px, py, 14 * esc, `rgba(255,199,110,${0.2 * sal})`);
          circulo(px, py, 7 * esc, `rgba(255,217,138,${0.35 * sal})`);
        }
        circulo(px, py, 3.6 * esc, `rgba(255,242,214,${sal})`);
      }
    }
  }
  function largoDe(partes) {
    let s = 0;
    for (const pts of partes) for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return s;
  }
  function puntoEn(partes, l) {
    let resto = l;
    for (const pts of partes)
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1],
          b = pts[i],
          tr = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (resto <= tr) {
          const f = resto / Math.max(tr, 0.0001);
          return [lerp(a[0], b[0], f), lerp(a[1], b[1], f)];
        }
        resto -= tr;
      }
    const ult = partes[partes.length - 1];
    return ult[ult.length - 1];
  }
  // dibuja la parte del recorrido entre las longitudes `desde` y `hasta` (en unidades del dibujo)
  function tramoDe(partes, desde, hasta, col, ancho, M) {
    if (hasta - desde < 0.01) return;
    c.strokeStyle = col;
    c.lineWidth = ancho;
    c.beginPath();
    let acum = 0;
    for (const pts of partes) {
      let abierta = false;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1],
          b = pts[i],
          tr = Math.hypot(b[0] - a[0], b[1] - a[1]),
          s0 = acum,
          s1 = acum + tr;
        acum = s1;
        if (s1 < desde || s0 > hasta) {
          abierta = false;
          continue;
        }
        const fa = Math.max(0, Math.min(1, (desde - s0) / Math.max(tr, 0.0001))),
          fb = Math.max(0, Math.min(1, (hasta - s0) / Math.max(tr, 0.0001)));
        if (!abierta) {
          const p0 = M([lerp(a[0], b[0], fa), lerp(a[1], b[1], fa)]);
          c.moveTo(p0[0], p0[1]);
          abierta = true;
        }
        const p1 = M([lerp(a[0], b[0], fb), lerp(a[1], b[1], fb)]);
        c.lineTo(p1[0], p1[1]);
      }
    }
    c.stroke();
  }

  // ---------- dibujos de cada región y capital ----------
  // un recorrido hecho con líneas y curvas (cuadráticas), como un trazo de pluma
  function Pluma() {
    const partes = [];
    let actual = [];
    const P = {
      mover(x, y) {
        if (actual.length > 1) partes.push(actual);
        actual = [[x, y]];
      },
      linea(x, y) {
        actual.push([x, y]);
      },
      curva(cx, cy, x, y) {
        const a = actual[actual.length - 1],
          n = Math.max(4, Math.floor(Math.hypot(x - a[0], y - a[1]) / 6));
        for (let i = 1; i <= n; i++) {
          const f = i / n,
            p = [lerp(a[0], cx, f), lerp(a[1], cy, f)],
            q = [lerp(cx, x, f), lerp(cy, y, f)];
          actual.push([lerp(p[0], q[0], f), lerp(p[1], q[1], f)]);
        }
      },
      ultimo: () => actual[actual.length - 1],
      cerrar() {
        if (actual.length > 1) partes.push(actual);
        actual = [];
        return partes;
      },
    };
    return P;
  }
  const conLargos = (d) => {
    d.largo = largoDe(d.principal);
    d.fondo.forEach((f) => (f.largo = largoDe(f.partes)));
    return d;
  };

  // Eldervald: montañas en los extremos, pinos y el Gran Roble en el centro (lienzo de 1000 × 300, suelo en y = 280)
  let eldervald = null;
  function paisajeEldervald() {
    if (eldervald) return eldervald;
    const B = 280,
      p = Pluma();
    p.mover(0, B);
    const suelo = (x2, ondula) => {
      const x1 = p.ultimo()[0];
      p.curva((x1 + x2) * 0.5, B - ondula, x2, B);
    };
    const pino = (x, h, w) => {
      const tg = w * 0.07;
      for (const q of [[x - tg, B], [x - tg, B - h * 0.12], [x - w * 0.5, B - h * 0.12], [x - w * 0.2, B - h * 0.4], [x - w * 0.38, B - h * 0.4],
        [x - w * 0.12, B - h * 0.66], [x - w * 0.26, B - h * 0.66], [x, B - h], [x + w * 0.26, B - h * 0.66], [x + w * 0.12, B - h * 0.66],
        [x + w * 0.38, B - h * 0.4], [x + w * 0.2, B - h * 0.4], [x + w * 0.5, B - h * 0.12], [x + tg, B - h * 0.12], [x + tg, B]])
        p.linea(q[0], q[1]);
    };
    const monte = (x1, x2, h) => {
      const md = (x1 + x2) * 0.5,
        w = x2 - x1;
      for (const q of [[x1 + w * 0.12, B - h * 0.28], [x1 + w * 0.2, B - h * 0.24], [x1 + w * 0.3, B - h * 0.55], [x1 + w * 0.36, B - h * 0.5],
        [md - w * 0.04, B - h * 0.92], [md, B - h], [md + w * 0.06, B - h * 0.86], [md - w * 0.02, B - h * 0.74], [md + w * 0.1, B - h * 0.78],
        [md + w * 0.04, B - h * 0.66], [md + w * 0.16, B - h * 0.6], [x2 - w * 0.22, B - h * 0.42], [x2 - w * 0.14, B - h * 0.46], [x2, B]])
        p.linea(q[0], q[1]);
    };
    const roble = (x) => {
      p.linea(x - 24, B);
      p.curva(x - 14, B - 20, x - 14, B - 70);
      p.curva(x - 40, B - 60, x - 62, B - 82);
      let prev = [x - 62, B - 82];
      for (const q of [[-100, -104], [-128, -140], [-122, -182], [-98, -214], [-62, -240], [-20, -252], [22, -250], [62, -236], [96, -210], [120, -176], [124, -138], [102, -106], [66, -94]]) {
        const nxt = [x + q[0] * 0.9, B + q[1]],
          mid = [(prev[0] + nxt[0]) * 0.5, (prev[1] + nxt[1]) * 0.5],
          d = [(nxt[1] - prev[1]) * 0.42, -(nxt[0] - prev[0]) * 0.42];
        p.curva(mid[0] + d[0], mid[1] + d[1], nxt[0], nxt[1]);
        prev = nxt;
      }
      p.curva(x + 40, B - 70, x + 14, B - 72);
      p.curva(x + 14, B - 20, x + 26, B);
      p.linea(x + 34, B);
      p.curva(x + 44, B - 4, x + 52, B);
    };
    monte(0, 170, 240); pino(200, 130, 64); pino(250, 175, 82); suelo(300, 6); pino(335, 120, 60); suelo(385, 8);
    roble(500); suelo(612, 8);
    pino(650, 165, 78); pino(705, 118, 60); suelo(740, 5); pino(780, 140, 68); monte(820, 1000, 270);
    const principal = p.cerrar();

    const fondo = [];
    const cresta = (y0, pts, dy, lejos) => {
      const q = Pluma();
      q.mover(0, y0);
      let prev = [0, y0];
      for (const cc of pts) {
        q.curva((prev[0] + cc[0]) * 0.5, Math.min(prev[1], cc[1]) - dy, cc[0], cc[1]);
        prev = cc;
      }
      fondo.push({ partes: q.cerrar(), ancho: true, lejos });
    };
    cresta(150, [[70, 128], [150, 96], [220, 124], [290, 104], [370, 132], [450, 92], [520, 120], [600, 98], [680, 126], [760, 90], [840, 118], [920, 100], [1000, 140]], 10, true);
    cresta(212, [[45, 188], [80, 200], [130, 168], [175, 194], [230, 182], [300, 198], [360, 176], [420, 190], [480, 172], [540, 186], [600, 170], [660, 192], [720, 178], [770, 196], [830, 166], [880, 190], [940, 178], [1000, 206]], 8, false);
    const bruma = (x0, y0, pts, dy, lejos) => {
      const q = Pluma();
      q.mover(x0, y0);
      let ax = x0;
      for (const cc of pts) {
        q.curva((ax + cc[0]) * 0.5, cc[1] - dy, cc[0], cc[1]);
        ax = cc[0];
      }
      fondo.push({ partes: q.cerrar(), ancho: true, lejos });
    };
    bruma(0, 252, [[120, 244], [250, 254], [380, 246], [520, 256], [650, 246], [780, 254], [900, 246], [1000, 252]], 7, false);
    bruma(20, 236, [[160, 230], [300, 238], [440, 232], [560, 238], [700, 230], [840, 236], [980, 232]], 5, true);
    const fila = (xs, b, x0, x1, lejos) => {
      const q = Pluma();
      q.mover(xs[0] - 8, b);
      xs.forEach((x, i) => {
        const h = 22 + ((i * 7) % 3) * 8;
        q.linea(x - 6, b);
        q.linea(x, b - h);
        q.linea(x + 6, b);
      });
      fondo.push({ partes: q.cerrar(), x0, x1, lejos });
    };
    fila([392, 410, 424, 441, 456], 266, 370, 470, false);
    fila([548, 563, 580, 596, 612], 266, 530, 630, false);
    fila([120, 134, 150, 166], 236, 100, 180, true);
    fila([850, 866, 880, 896], 236, 830, 910, true);
    // casa larga lejana con humo
    const casa = Pluma();
    casa.mover(640, 246); casa.linea(640, 232); casa.linea(652, 222); casa.linea(688, 222); casa.linea(700, 232); casa.linea(700, 246);
    casa.mover(648, 226); casa.linea(644, 218); casa.mover(692, 226); casa.linea(696, 218);
    casa.mover(666, 222); casa.curva(662, 210, 670, 202); casa.curva(678, 194, 672, 184); casa.curva(668, 176, 676, 168);
    fondo.push({ partes: casa.cerrar(), x0: 620, x1: 720 });
    // piedras rúnicas al pie del Roble
    for (const pr of [[440, 30, 1, 420, 460], [562, 24, -1, 540, 580]]) {
      const [x, h] = pr,
        q = Pluma();
      q.mover(x - 9, 276); q.curva(x - 11, 276 - h * 0.6, x - 5, 276 - h); q.curva(x, 276 - h - 4, x + 5, 276 - h); q.curva(x + 11, 276 - h * 0.6, x + 9, 276);
      q.mover(x, 276 - h * 0.78); q.linea(x, 276 - h * 0.25); q.mover(x, 276 - h * 0.62); q.linea(x + 5 * pr[2], 276 - h * 0.5);
      fondo.push({ partes: q.cerrar(), x0: pr[3], x1: pr[4] });
    }
    // luna creciente
    const luna = Pluma();
    luna.mover(318, 34);
    for (let i = 1; i < 25; i++) {
      const a = Math.PI * 0.5 + (Math.PI * i) / 24;
      luna.linea(318 + Math.cos(a) * 26, 60 - Math.sin(a) * 26);
    }
    for (let i = 1; i < 25; i++) {
      const s = i / 24;
      luna.linea(318 - 14 * Math.sin(Math.PI * s), 86 - 52 * s);
    }
    fondo.push({ partes: luna.cerrar(), x0: 250, x1: 340 });
    // estrellas, nubes y pájaros
    for (const st of [[210, 40], [360, 22], [470, 30], [600, 26], [760, 36], [640, 60]]) {
      const q = Pluma();
      q.mover(st[0], st[1] - 5); q.linea(st[0], st[1] + 5); q.mover(st[0] - 5, st[1]); q.linea(st[0] + 5, st[1]);
      fondo.push({ partes: q.cerrar(), x0: st[0] - 50, x1: st[0] + 10 });
    }
    for (const nb of [[150, 70, 120, 300], [700, 44, 690, 860]]) {
      const q = Pluma(),
        [x, yy] = nb;
      q.mover(x, yy); q.curva(x + 40, yy - 10, x + 80, yy - 2); q.curva(x + 110, yy - 14, x + 150, yy - 6);
      fondo.push({ partes: q.cerrar(), x0: nb[2], x1: nb[3] });
    }
    for (const pj of [[410, 78], [432, 66], [452, 84], [690, 58], [708, 70], [560, 90]]) {
      const q = Pluma(),
        [x, yy] = pj;
      q.mover(x - 8, yy); q.curva(x - 4, yy - 5, x, yy); q.curva(x + 4, yy - 5, x + 8, yy);
      fondo.push({ partes: q.cerrar(), x0: x - 60, x1: x + 20 });
    }
    const pasto = Pluma();
    for (const x of [70, 160, 300, 390, 620, 740, 860, 950]) {
      pasto.mover(x, 282); pasto.linea(x - 3, 272); pasto.mover(x + 3, 282); pasto.linea(x + 3, 270); pasto.mover(x + 6, 282); pasto.linea(x + 9, 273);
    }
    fondo.push({ partes: pasto.cerrar(), ancho: true });
    eldervald = conLargos({ principal, fondo, unidad: [1000, 300] });
    return eldervald;
  }

  // La insignia de cada capital calcada de su imagen (en Eikholt, la cornamenta pálida que Alejandro dio como regla de
  // la ciudad: el contorno de assets/interfaz/insignias/eikholt.png de la versión de Godot, alto 440 desde y = 80, en
  // las unidades del estandarte). Con el pulso se rellena de dorado, como la imagen teñida de Godot.
  const INSIGNIAS = {
    eikholt: [[-43.3,81.4,-42.7,83.3,-47.1,98.3,-60.2,129.2,-65.3,143.8,-68.1,158.2,-68.5,175.4,-67.5,177.6,-65.9,176.0,-54.8,159.4,-46.5,149.2,-35.0,138.7,-33.4,138.4,-33.4,139.4,-39.2,149.6,-51.9,177.9,-65.3,195.7,-70.4,204.6,-74.2,216.7,-74.5,231.7,-71.3,243.2,-65.6,253.7,-55.1,265.8,-44.3,274.1,-45.8,259.7,-45.8,247.0,-44.3,236.2,-38.2,218.3,-32.5,207.2,-29.9,204.6,-34.1,234.6,-34.1,260.7,-32.5,269.3,-28.7,279.1,-28.7,287.7,-27.1,297.6,-16.6,331.4,-10.8,357.5,-5.7,393.4,0.0,446.6,6.0,390.3,11.8,351.7,16.2,332.0,27.1,297.3,28.7,286.8,28.7,278.8,31.8,271.2,34.1,260.0,34.1,235.5,29.6,205.0,30.9,205.0,36.9,215.8,43.9,235.5,45.8,250.2,44.3,274.1,52.9,267.7,65.3,254.0,71.0,243.8,74.5,230.4,74.2,217.1,70.7,205.6,65.6,196.4,51.3,176.9,41.1,153.7,33.1,139.4,33.4,138.4,35.3,139.1,46.2,148.9,54.4,159.1,65.9,176.0,67.5,177.6,68.1,176.9,68.5,163.3,65.6,145.4,61.8,133.6,48.1,101.2,42.3,82.1,43.0,81.4,44.6,83.0,60.2,106.3,68.1,120.9,71.6,130.1,77.0,154.0,81.2,199.2,81.8,199.6,82.5,198.0,83.7,187.1,83.7,157.2,85.6,143.5,89.1,133.0,98.1,118.4,102.5,113.9,104.1,113.0,104.7,113.6,98.1,131.7,94.9,152.4,95.5,173.4,100.3,207.8,100.6,217.4,99.3,228.8,95.8,239.7,90.4,248.6,60.8,278.5,46.8,296.0,37.9,311.6,31.8,326.6,26.1,348.6,24.2,361.6,25.2,362.6,39.5,347.6,51.9,336.8,66.9,326.6,70.0,325.0,71.0,325.6,65.6,336.1,56.7,349.8,30.2,381.7,22.0,397.6,15.6,420.2,13.1,434.5,13.4,437.4,27.1,422.7,36.6,416.0,40.8,414.1,41.4,415.1,35.3,427.5,21.6,449.2,16.2,460.3,9.9,480.4,0.6,518.2,-0.3,518.6,-10.8,477.2,-15.6,462.2,-20.4,451.7,-35.3,427.8,-41.4,415.4,-41.1,414.1,-38.5,415.1,-29.6,420.8,-13.4,437.1,-15.6,420.5,-22.0,397.9,-26.4,388.0,-31.5,380.1,-55.7,351.4,-63.0,340.6,-71.0,326.3,-70.4,325.0,-66.5,326.9,-51.3,337.4,-42.3,345.1,-25.2,362.6,-24.5,359.4,-26.4,347.3,-31.8,326.9,-40.8,306.2,-49.3,292.5,-61.4,277.9,-86.6,253.4,-93.6,244.1,-98.1,234.3,-100.6,220.9,-100.3,206.6,-95.2,169.6,-94.9,154.7,-97.4,134.6,-104.7,113.3,-103.2,113.6,-97.7,119.0,-93.0,125.7,-86.3,141.6,-83.7,158.5,-83.7,188.1,-82.8,196.7,-81.5,199.6,-77.4,156.3,-72.0,130.8,-67.8,120.0,-62.4,109.8]],
  };
  const estandartes = {};
  // la tela colgada de su vara, dibujada desde arriba al centro por los dos lados hasta la punta de abajo, y la insignia
  // calcada adentro (lienzo de 400 × 620, centrado en x = 0; la vara en y = 10)
  function estandarte(id) {
    if (estandartes[id]) return estandartes[id];
    const p = Pluma();
    p.mover(0, 22);
    for (const q of [[-150, 22], [-150, 500], [0, 600], [150, 500], [150, 22], [0, 22]]) p.linea(q[0], q[1]);
    const principal = p.cerrar(),
      fondo = [];
    // vara con remates
    const vara = Pluma();
    vara.mover(-194, 10);
    vara.linea(194, 10);
    for (const xr of [-200, 200]) {
      vara.mover(xr + 6, 10);
      for (let i = 1; i < 17; i++) {
        const a = (Math.PI * 2 * i) / 16;
        vara.linea(xr + Math.cos(a) * 6, 10 + Math.sin(a) * 6);
      }
    }
    vara.mover(-182, 10); vara.linea(-150, 22); vara.mover(182, 10); vara.linea(150, 22);
    fondo.push({ partes: vara.cerrar(), ancho: true });
    // borde interior de la tela
    const bd = Pluma();
    bd.mover(0, 36);
    for (const q of [[-136, 36], [-136, 492], [0, 580], [136, 492], [136, 36], [0, 36]]) bd.linea(q[0], q[1]);
    fondo.push({ partes: bd.cerrar(), ancho: true, lejos: true });
    // contorno de la insignia
    const insignia = (INSIGNIAS[id] || []).map((plano) => {
      const pts = [];
      for (let i = 0; i < plano.length; i += 2) pts.push([plano[i], plano[i + 1]]);
      return pts;
    });
    for (const pts of insignia) fondo.push({ partes: [[...pts, pts[0]]], ancho: true });
    estandartes[id] = conLargos({ principal, fondo, unidad: [400, 620], insignia });
    return estandartes[id];
  }

  // ---------- la fila y cuándo sale cada uno ----------
  let A = null,
    st = { tierra: false, vistos: {} },
    fila = [],
    reloj = 0,
    dentro = {},
    salio = {},
    pendientes = {},
    prueba = new URLSearchParams(location.search).get("cartel"),
    pruebaEspera = 0;
  const ahoraJuega = () => A && A.J.modo === "juego";
  const congelado = () => !A || ["menu", "titulo", "fin"].includes(A.J.modo);
  const nombreHistoria = (id) => t("av.lugar_" + id);
  const visto = (id, op) => (op ? !!st.vistos[id] : A.H.E.vistos.includes(id));

  // pide un cartel: sale cuando no hay otro a la vista y se está jugando (no en un diálogo, un menú o un fundido)
  function pedir(id, primera, op) {
    if (actualId === id && activo) return;
    if (fila.some((q) => q.id === id)) return;
    fila.push({ id, primera, op });
  }
  function siguiente() {
    if (!fila.length || activo || !ahoraJuega()) return;
    const q = fila.shift(),
      op = q.op || {},
      nom = op.nombre || nombreHistoria(q.id);
    actualId = q.id;
    if (q.id.startsWith("region_")) mostrar("tierra", t("av." + q.id), { region: q.id.slice(7) });
    else if (!q.primera) mostrar("regreso", nom);
    else if (op.tipo) mostrar(op.tipo, nom, { sub: op.sub, capital: op.capital });
    else if (CAPITALES.includes(q.id)) mostrar("capital", nom, { capital: q.id });
    else mostrar("lugar", nom);
  }
  // la tierra nueva sale antes que el lugar donde se arranca
  function tierra() {
    if (st.tierra || reloj < 1.5) return;
    st.tierra = true;
    pedir("region_eldervald", true);
  }
  // un lugar con borde: la primera vez su cartel (los de la historia pasan por HISTORIA.descubrir, que paga y destapa
  // el mapa), al volver después de VOLVER_TRAS afuera el chico
  function entra(id, op) {
    if (!A || dentro[id]) return;
    // en el primer segundo y medio todavía no: queda pendiente (así la tierra nueva sale primero)
    if (reloj < 1.5) return void (pendientes[id] = op || null);
    delete pendientes[id];
    tierra();
    dentro[id] = true;
    if (!visto(id, op)) {
      if (op) {
        st.vistos[id] = true;
        pedir(id, true, op);
      } else A.H.descubrir(id);
    } else if (reloj - (salio[id] != null ? salio[id] : -Infinity) >= VOLVER_TRAS) pedir(id, false, op);
  }
  function sale(id) {
    delete pendientes[id];
    if (!dentro[id]) return;
    dentro[id] = false;
    salio[id] = reloj;
  }
  // sin borde (las zonas): la primera vez su cartel, después el chico
  function llegar(id, op) {
    if (!A) return;
    if (!st.vistos[id]) {
      st.vistos[id] = true;
      pedir(id, true, op);
    } else pedir(id, false, op);
  }
  // llegó de un viaje: el cartel chico, y el lugar queda como «adentro» para no repetirlo
  function regreso(id) {
    if (!A) return;
    dentro[id] = true;
    pedir(id, false);
  }

  let antes = 0;
  function cuadro(ahora) {
    const dt = Math.min(0.05, Math.max(0, (ahora - (antes || ahora)) / 1000));
    antes = ahora;
    if (A && !congelado()) {
      if (A.J.modo === "juego" || A.J.modo === "dialogo" || A.J.modo === "cine") reloj += dt;
      tierra();
      if (reloj >= 1.5) for (const id in pendientes) entra(id, pendientes[id] || undefined);
      if (prueba && !activo && ahoraJuega() && (pruebaEspera -= dt) <= 0) {
        pruebaEspera = 1;
        const tp = CONFIG[prueba] ? prueba : "lugar";
        mostrar(tp, tp === "tierra" ? t("av.region_eldervald") : nombreHistoria("eikholt"), { region: "eldervald", capital: "eikholt" });
      }
      siguiente();
      if (activo) {
        tt += dt;
        if (tt >= m.total) {
          activo = false;
          actualId = "";
        }
      }
    }
    if (lienzo && (activo || lienzo.style.display !== "none")) {
      dibujar();
      if (!activo) lienzo.style.display = "none";
    }
    requestAnimationFrame(cuadro);
  }
  requestAnimationFrame(cuadro);

  const sistema = {
    iniciar(api) {
      A = api;
      armar();
    },
    alEmpezar(extra) {
      st = extra.cartel = Object.assign({ tierra: false, vistos: {} }, extra.cartel || {});
      fila = [];
      dentro = {};
      salio = {};
      pendientes = {};
      reloj = 0;
      activo = false;
      actualId = "";
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { mostrar, duracion, entra, sale, llegar, regreso, pedir, aRunas, activo: () => activo, CONFIG, ENTRADA };
})();
