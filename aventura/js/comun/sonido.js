// ---------- sonido (módulo SONIDO) ----------
// Los sonidos libres (CC0) de la arena, en audio/ (créditos en audio/CREDITOS.md), más lo que se arma acá mismo con
// Web Audio: el viento del bosque, los grillos, el zumbido de la runa y el gruñido grave de un aviso. Todo pasa por tres
// volúmenes (general, efectos, ambiente) que se guardan en el navegador. El audio arranca con el primer toque o tecla
// (los navegadores no dejan antes). Lo que suena en el mundo baja con la distancia a Eromash y se corre a izquierda o
// derecha según dónde está.
window.SONIDO = (function () {
  "use strict";
  const n = (pre, a, b, ext) => Array.from({ length: b - a + 1 }, (_, i) => pre + (a + i) + ext);
  const LISTA = {
    paso: Array.from({ length: 10 }, (_, i) => "pasos/footstep0" + i + ".mp3"),
    pasoMadera: n("pasos/madera-", 1, 5, ".ogg"),
    pasoPiedra: n("pasos/piedra-", 1, 3, ".ogg"),
    tajo: ["golpes/knifeSlice.mp3", "golpes/knifeSlice2.mp3"],
    golpe: ["golpes/chop.mp3"],
    golpeFuerte: n("golpes/impactSoft_heavy_00", 0, 2, ".ogg"),
    tela: ["golpes/cloth1.mp3", "golpes/cloth2.mp3", "golpes/cloth3.mp3"],
    caida: ["golpes/dropLeather.mp3"],
    filo: ["golpes/drawKnife1.mp3"],
    grunido: n("criaturas/grunt_0", 7, 9, ".ogg"),
    herida: ["criaturas/hurt_04.ogg"],
    muerte: ["criaturas/die_03.ogg", "criaturas/creature_die_01.ogg"],
    rugido: ["criaturas/creature_roar_01.ogg"],
    plata: ["ui/handleCoins.mp3", "ui/handleCoins2.mp3"],
    puerta: ["ui/doorClose_4.mp3"],
    crujido: ["ui/creak1.mp3"],
    pagina: ["ui/bookFlip1.ogg"],
    libro: ["ui/bookOpen.ogg"],
    clic: ["ui/metalClick.ogg"],
    mision: ["ui/mision_cumplida.ogg"],
    fogata: ["fogata.ogg"],
    cuervos: ["arena_crows.ogg"],
  };
  const CLAVE = "eromash.aventura.sonido";
  const vol = { general: 0.8, efectos: 1, ambiente: 0.6 };
  try {
    Object.assign(vol, JSON.parse(localStorage.getItem(CLAVE) || "{}"));
  } catch (e) {}
  let ctx = null,
    maestro,
    efectos,
    ambiente,
    ruido = null;
  const buf = {},
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
    efectos.connect(maestro);
    ambiente.connect(maestro);
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
    for (const k in LISTA)
      LISTA[k].forEach((f, i) =>
        fetch("audio/" + f)
          .then((r) => r.arrayBuffer())
          .then((a) => ctx.decodeAudioData(a))
          .then((b) => ((buf[k] = buf[k] || [])[i] = b))
          .catch(() => {}),
      );
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
    if (!lista.length) return;
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
  // el corazón cuando queda poca vida
  function latido() {
    tono("sine", 62, 44, 0.16, 0.35, { filtro: 200 });
    tono("sine", 58, 40, 0.16, 0.25, { filtro: 200, retraso: 0.2 });
  }
  // un sonido que se repite (la fogata, el viento): g de 0 a 1 se pide cada cuadro y se suaviza solo
  function bucle(id, nombre, g, op = {}) {
    if (!ctx || ctx.state !== "running") return;
    let b = bucles[id];
    if (!b) {
      const fuente = nombre === "viento" ? ruido : (buf[nombre] || [])[0];
      if (!fuente) return;
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
      s.start(0, Math.random() * (fuente.duration - 1));
      b = Object.assign(b || {}, { s, ga });
      bucles[id] = b;
    }
    b.ga.gain.setTargetAtTime(Math.max(0, g), ctx.currentTime, 0.4);
    if (b.f && op.filtro) b.f.frequency.setTargetAtTime(op.filtro, ctx.currentTime, 0.6);
  }
  return {
    iniciar,
    tocar,
    tono,
    runa,
    zumbido,
    latido,
    bucle,
    volumen,
    oyente: (x, y) => ((oido.x = x), (oido.y = y)),
    listo: () => !!ctx && ctx.state === "running",
    cargados: () => Object.keys(buf).length,
  };
})();
