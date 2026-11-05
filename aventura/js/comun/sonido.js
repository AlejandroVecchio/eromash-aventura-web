// ---------- sonido (módulo SONIDO) ----------
// Los sonidos de la aventura: los de ElevenLabs en audio/eleven/<carpeta>/ (la lista la arma herramientas/sonidos-lista.cjs
// en sonidos-lista.js; SONIDO.tocar("carpeta/nombre")), los libres (CC0) que vinieron de la arena (créditos en
// audio/CREDITOS.md) y lo que se arma acá mismo con Web Audio: el viento, el zumbido de la runa, el gruñido grave de un
// aviso. Todo pasa por cuatro volúmenes (general, efectos, ambiente, música) que se guardan en el navegador. El audio
// arranca con el primer toque o tecla (los navegadores no dejan antes). Lo que suena en el mundo baja con la distancia a
// Eromash y se corre a izquierda o derecha según dónde está. Nada se baja de golpe: lo chico se carga de a poco detrás
// y la música y los ambientes recién cuando se piden (la música se escucha mientras baja).
window.SONIDO = (function () {
  "use strict";
  const n = (pre, a, b, ext) => Array.from({ length: b - a + 1 }, (_, i) => pre + (a + i) + ext);
  const NUEVOS = window.SONIDOS_LISTA || {};
  const el = (clave) => (NUEVOS[clave] || []).map((f) => "eleven/" + clave.split("/")[0] + "/" + f + ".ogg");
  const LISTA = {
    paso: el("eromash/tierra").concat(el("eromash/pasos-pasto")),
    pasoMadera: el("eromash/pasos-madera"),
    pasoPiedra: el("eromash/adoquin"),
    pasoHojas: el("eromash/hojas"),
    pasoBarro: el("eromash/barro"),
    pasoAgua: el("eromash/agua"),
    tajo: el("armas-y-habilidades/tajo-1").concat(el("armas-y-habilidades/tajo-2")),
    golpe: ["golpes/chop.mp3"],
    golpeFuerte: n("golpes/impactSoft_heavy_00", 0, 2, ".ogg"),
    tela: ["golpes/cloth1.mp3", "golpes/cloth2.mp3", "golpes/cloth3.mp3"],
    caida: el("eromash/aterrizaje"),
    filo: el("interfaz/equipar-arma"),
    grunido: el("criaturas/aviso"),
    herida: ["criaturas/hurt_04.ogg"],
    muerte: ["criaturas/die_03.ogg", "criaturas/creature_die_01.ogg"],
    rugido: el("criaturas/lider-rugido"),
    runa: el("runas/despierta"),
    plata: el("interfaz/plata"),
    puerta: el("mundo/puerta-madera"),
    crujido: ["ui/creak1.mp3"],
    pagina: el("interfaz/diario"),
    libro: el("interfaz/libro"),
    clic: el("interfaz/cursor"),
    mision: el("interfaz/mision-cumplida"),
    fogata: ["fogata.ogg"],
    cuervos: ["arena_crows.ogg"],
  };
  for (const k in NUEVOS) LISTA[k] = el(k);
  // lo que no se baja solo detrás: la música (se escucha por streaming) y los ambientes largos (cuando se piden)
  const tarde = (k) => k.startsWith("musica/") || k.startsWith("ambiente/");
  const CLAVE = "eromash.aventura.sonido";
  const vol = { general: 0.8, efectos: 1, ambiente: 0.6, musica: 0.5 };
  try {
    Object.assign(vol, JSON.parse(localStorage.getItem(CLAVE) || "{}"));
  } catch (e) {}
  let ctx = null,
    maestro,
    efectos,
    ambiente,
    musicaG,
    ruido = null;
  const buf = {},
    pedidos = {},
    bucles = {};
  const oido = { x: 0, y: 0 };

  function iniciar() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    maestro = ctx.createGain();
    efectos = ctx.createGain();
    ambiente = ctx.createGain();
    musicaG = ctx.createGain();
    efectos.connect(maestro);
    ambiente.connect(maestro);
    musicaG.connect(maestro);
    maestro.connect(ctx.destination);
    aplicarVolumen();
    // ruido marrón de 4 s para el viento
    const largo = ctx.sampleRate * 4;
    ruido = ctx.createBuffer(1, largo, ctx.sampleRate);
    const d = ruido.getChannelData(0);
    let u = 0;
    for (let i = 0; i < largo; i++) {
      u = (u + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = u * 3.5;
    }
    // primero lo de siempre (pasos, golpes, interfaz), después el resto de los efectos de a tres, sin apurar la página
    const cola = Object.keys(LISTA).filter((k) => !tarde(k));
    const sigue = () => {
      const k = cola.shift();
      if (k) cargar(k).then(sigue);
    };
    for (let i = 0; i < 3; i++) sigue();
  }
  // baja y decodifica las tomas de un sonido (una sola vez); devuelve una promesa
  function cargar(k) {
    if (pedidos[k]) return pedidos[k];
    if (!ctx || !LISTA[k]) return Promise.resolve();
    return (pedidos[k] = Promise.all(
      LISTA[k].map((f, i) =>
        fetch("audio/" + f)
          .then((r) => r.arrayBuffer())
          .then((a) => ctx.decodeAudioData(a))
          .then((b) => ((buf[k] = buf[k] || [])[i] = b))
          .catch(() => {}),
      ),
    ));
  }
  ["pointerdown", "keydown"].forEach((ev) => addEventListener(ev, () => {
    iniciar();
    if (ctx && ctx.state === "suspended" && !document.hidden) ctx.resume();
  }));
  document.addEventListener("visibilitychange", () => ctx && (document.hidden ? ctx.suspend() : ctx.resume()));
  function aplicarVolumen() {
    if (!ctx) return;
    maestro.gain.value = vol.general;
    efectos.gain.value = vol.efectos;
    ambiente.gain.value = vol.ambiente;
    musicaG.gain.value = vol.musica;
  }
  function volumen(k, v) {
    if (v == null) return vol[k];
    vol[k] = Math.max(0, Math.min(1, v));
    aplicarVolumen();
    try {
      localStorage.setItem(CLAVE, JSON.stringify(vol));
    } catch (e) {}
  }
  // cuánto se oye algo en (x, y) y para qué lado: lejos de 1600 no suena
  function enMundo(x, y) {
    if (x == null) return { g: 1, p: 0 };
    const dx = x - oido.x,
      d = Math.hypot(dx, (y - oido.y) * 1.3);
    return { g: d < 300 ? 1 : Math.max(0, 1 - (d - 300) / 1300), p: Math.max(-0.8, Math.min(0.8, dx / 900)) };
  }
  function cadena(destino, g, p, filtro) {
    const ga = ctx.createGain();
    ga.gain.value = g;
    let ultimo = ga;
    if (filtro) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = filtro;
      ga.connect(f);
      ultimo = f;
    }
    if (p && ctx.createStereoPanner) {
      const pa = ctx.createStereoPanner();
      pa.pan.value = p;
      ultimo.connect(pa);
      ultimo = pa;
    }
    ultimo.connect(destino);
    return ga;
  }
  // op: { vol, tono (1 = igual), var (cuánto cambia el tono al azar), x, y, filtro, desde (s), dur (s) }
  function tocar(nombre, op = {}) {
    if (!ctx || ctx.state !== "running") return;
    const lista = (buf[nombre] || []).filter(Boolean);
    if (!lista.length) {
      cargar(nombre); // la próxima vez ya suena
      return;
    }
    const w = enMundo(op.x, op.y);
    const g = (op.vol != null ? op.vol : 1) * w.g;
    if (g < 0.02) return;
    const s = ctx.createBufferSource();
    s.buffer = lista[Math.floor(Math.random() * lista.length)];
    s.playbackRate.value = (op.tono || 1) * (1 + ((Math.random() * 2 - 1) * (op.var != null ? op.var : 0.06)));
    s.connect(cadena(op.ambiente ? ambiente : efectos, g, w.p, op.filtro));
    s.start(0, op.desde || 0, op.dur);
  }
  // un tono armado acá: forma, frecuencia que va de f0 a f1, duración, volumen y filtro
  function tono(forma, f0, f1, dur, g, op = {}) {
    if (!ctx || ctx.state !== "running") return;
    const w = enMundo(op.x, op.y);
    if (g * w.g < 0.01) return;
    const o = ctx.createOscillator(),
      t0 = ctx.currentTime + (op.retraso || 0);
    o.type = forma;
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    const ga = cadena(op.ambiente ? ambiente : efectos, 0, w.p, op.filtro);
    ga.gain.setValueAtTime(0.0001, t0);
    ga.gain.exponentialRampToValueAtTime(g * w.g, t0 + Math.min(0.04, dur / 4));
    ga.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(ga);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }
  // la runa: un acorde frío que sube y se apaga (sin campana: senos graves con un brillo encima)
  function runa(x, y) {
    [110, 165, 220, 330].forEach((f, i) => tono("sine", f, f * 1.5, 1.1, 0.12 - i * 0.02, { x, y, retraso: i * 0.06 }));
    tono("triangle", 880, 1320, 0.7, 0.03, { x, y, filtro: 2400, retraso: 0.2 });
  }
  // el aviso de una criatura que no gruñe (errantes, draugr, fatuos): un zumbido grave y sucio
  function zumbido(x, y, grave = 1) {
    tono("sawtooth", 72 / grave, 54 / grave, 0.45, 0.12, { x, y, filtro: 260 });
    tono("square", 36 / grave, 30 / grave, 0.45, 0.06, { x, y, filtro: 180 });
  }
  // burbujitas de una pócima que hierve (la mesa de alquimia): blips cortos que suben, solo cerca de (x, y)
  function burbujas(x, y, g = 1) {
    if (x != null) g *= Math.max(0, 1 - Math.hypot(x - oido.x, (y - oido.y) * 1.3) / 700); // se apaga a los 700: no se oye lejos
    if (g < 0.02) return;
    const n = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const f = 380 + Math.random() * 520;
      tono("sine", f, f * (1.6 + Math.random() * 0.8), 0.05 + Math.random() * 0.05, 0.05 * g, { x, y, retraso: i * (0.05 + Math.random() * 0.1), filtro: 2600 });
    }
  }
  // ---------- las voces de cada criatura ----------
  // que: aviso (prepara el golpe), herida, muerte. Devuelve false si esa criatura no tiene sonido propio para eso.
  const C = "criaturas/";
  const VOCES = {
    lobo: { aviso: C + "lobo-grunido", ataque: C + "lobo-ladrido", herida: C + "lobo-herido", muerte: C + "lobo-muerte", huye: C + "huye" },
    sabuesoCaceria: { aviso: C + "lobo-ladrido", herida: C + "lobo-herido", muerte: C + "lobo-muerte" },
    errante: { aviso: C + "errante-voz", ataque: C + "errante-ataque", muerte: C + "errante-muerte" },
    draugr: { aviso: C + "draugr-voz", muerte: C + "draugr-muerte" },
    custodio: { aviso: C + "custodio-aviso", ataque: C + "custodio-golpe", muerte: C + "custodio-muerte" },
    jabali: { aviso: C + "jabali", huye: C + "huye" },
    cuervo: { aviso: C + "cuervo-ataque", huye: C + "cuervo-ataque" },
    fatuo: { aviso: C + "fatuo", muerte: C + "se-deshace-luz" },
    oso: { aviso: C + "oso" },
    trol: { aviso: C + "trol" },
    bandido: { aviso: C + "bandido-voz", muerte: C + "bandido-muerte" },
    arquero: { aviso: C + "bandido-voz", muerte: C + "bandido-muerte" },
    arana: { aviso: C + "arana-chillido" },
    dreki: { aviso: "jefes/dreki-rugido" },
    hrimthursar: { aviso: "jefes/hrimthursar" },
  };
  // con qué suena el filo al pegarle: piedra y madera, huesos o carne
  const MATERIAL = { custodio: "roca", trol: "roca", draugr: "hueso", errante: "hueso", fatuo: "madera" };
  function vozDe(tipo) {
    if (VOCES[tipo]) return VOCES[tipo];
    if (/^arana/.test(tipo || "")) return VOCES.arana;
    if (/bandid|arquer/.test(tipo || "")) return VOCES.bandido;
    return null;
  }
  function criatura(e, que, op = {}) {
    const v = vozDe(e.tipo);
    const k = v && v[que];
    if (!k || !LISTA[k]) return false;
    tocar(k, Object.assign({ x: e.x, y: e.y, vol: 0.5, var: 0.07, tono: e.s > 1 ? 0.9 : 1 }, op));
    return true;
  }
  const impacto = (e) => "armas-y-habilidades/impacto-" + (MATERIAL[e.tipo] || "carne");
  // el corazón cuando queda poca vida
  function latido() {
    if ((buf["eromash/latido"] || []).length) return tocar("eromash/latido", { vol: 0.5, var: 0 });
    tono("sine", 62, 44, 0.16, 0.35, { filtro: 200 });
    tono("sine", 58, 40, 0.16, 0.25, { filtro: 200, retraso: 0.2 });
  }
  // un sonido que se repite (la fogata, el viento): g de 0 a 1 se pide cada cuadro y se suaviza solo
  function bucle(id, nombre, g, op = {}) {
    if (!ctx || ctx.state !== "running") return;
    let b = bucles[id];
    if (!b) {
      const fuente = nombre === "viento" ? ruido : (buf[nombre] || [])[0];
      if (!fuente) {
        if (g > 0.01) cargar(nombre); // un ambiente se baja recién cuando se lo pide
        return;
      }
      const s = ctx.createBufferSource();
      s.buffer = fuente;
      s.loop = true;
      const ga = ctx.createGain();
      ga.gain.value = 0;
      let ultimo = ga;
      if (op.filtro) {
        const f = ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.value = op.filtro;
        ga.connect(f);
        ultimo = f;
        b = { f };
      }
      ultimo.connect(ambiente);
      s.connect(ga);
      s.start(0, Math.random() * Math.max(0, fuente.duration - 1));
      b = Object.assign(b || {}, { s, ga });
      bucles[id] = b;
    }
    b.ga.gain.setTargetAtTime(Math.max(0, g), ctx.currentTime, 0.4);
    if (b.f && op.filtro) b.f.frequency.setTargetAtTime(op.filtro, ctx.currentTime, 0.6);
  }
  // ---------- la música ----------
  // musica(clave) se pide cada cuadro con la pieza que va (o null para silencio): la que estaba se apaga en 2,5 s y la
  // nueva entra; si vuelve a pedirse una que se estaba apagando, sigue desde donde iba. Cada pieza suena por streaming
  // (no se espera a que baje entera). remate(clave) toca una pieza corta encima (caer, fin de la pelea) y baja la otra.
  const piezas = {};
  let pedida = null,
    bajar = 0;
  function pieza(clave) {
    let p = piezas[clave];
    if (p) return p;
    const f = (LISTA[clave] || [])[0];
    if (!f) return null;
    const a = new Audio("audio/" + f);
    a.loop = true;
    a.preload = "auto";
    const ga = ctx.createGain();
    ga.gain.value = 0;
    try {
      ctx.createMediaElementSource(a).connect(ga);
    } catch (e) {
      return null;
    }
    ga.connect(musicaG);
    p = piezas[clave] = { a, ga, g: 0, quiere: 0 };
    return p;
  }
  function musica(clave, op = {}) {
    if (!ctx || ctx.state !== "running") return;
    pedida = clave || null;
    const base = op.vol != null ? op.vol : 1;
    for (const k in piezas) {
      const p = piezas[k];
      p.quiere = k === pedida ? base * (1 - bajar * 0.7) : 0;
      p.ga.gain.setTargetAtTime(p.quiere, ctx.currentTime, p.quiere > p.g ? 0.9 : 0.7);
      if (p.quiere > 0 && p.a.paused) p.a.play().catch(() => {});
      p.g += (p.quiere - p.g) * 0.03;
      if (p.quiere === 0 && p.g < 0.01 && !p.a.paused) p.a.pause();
    }
    if (pedida && !piezas[pedida]) {
      const p = pieza(pedida);
      if (p) {
        p.a.currentTime = 0;
        p.a.play().catch(() => {});
      }
    }
  }
  function remate(clave, op = {}) {
    if (!ctx || ctx.state !== "running") return;
    const f = (LISTA[clave] || [])[0];
    if (!f) return;
    const a = new Audio("audio/" + f);
    const ga = ctx.createGain();
    ga.gain.value = op.vol != null ? op.vol : 1;
    try {
      ctx.createMediaElementSource(a).connect(ga);
    } catch (e) {
      return;
    }
    ga.connect(musicaG);
    bajar = 1;
    a.onended = () => (bajar = 0);
    setTimeout(() => (bajar = 0), (op.max || 12) * 1000);
    a.play().catch(() => (bajar = 0));
  }
  // un sonido que se toca de vez en cuando (gotas, una lechuza): con x, y se oye de ese lado
  function detalle(nombre, op = {}) {
    tocar(nombre, Object.assign({ ambiente: true, var: 0.05 }, op));
  }
  return {
    iniciar,
    cargar,
    musica,
    remate,
    detalle,
    musicaActual: () => pedida,
    hay: (k) => !!LISTA[k],
    tocar,
    tono,
    runa,
    zumbido,
    latido,
    burbujas,
    bucle,
    criatura,
    impacto,
    volumen,
    oyente: (x, y) => ((oido.x = x), (oido.y = y)),
    listo: () => !!ctx && ctx.state === "running",
    cargados: () => Object.keys(buf).length,
  };
})();
