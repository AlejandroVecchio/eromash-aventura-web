// ---------- los juegos de runas de los viajeros (JUEGOS_RUNAS, modo "runas") ----------
// Juegos que todos conocen, jugados con piedras rúnicas, para la gente del camino (encuentros.js):
//   parejas  el memotest: dieciséis piedras boca abajo, ocho pares de runas; encontrarlas todas en `VUELTAS` vueltas
//   simon    Simón dice: cuatro piedras en rombo se encienden en orden y hay que repetirlo; cada ronda una más
//   mente    el Mastermind: cuatro runas escondidas entre seis; cada intento dice cuántas están en su lugar (oro)
//            y cuántas están pero en otro lugar (blanco)
// Se juega con las flechas o el stick y E (o tocando las piedras); Esc deja el juego. Al terminar, `op.fin(res)` recibe
// { gano, ...lo de cada juego } y quien lo pidió paga. Lienzo propio de 1600 × 900, como el matraz.
window.JUEGOS_RUNAS = (function () {
  "use strict";
  let A, J;
  const t = (k, v) => I18N.t(k, v);
  const VUELTAS = 16, // parejas: vueltas para encontrar los ocho pares
    META = 8, // simon: largo de la plegaria para ganar
    INTENTOS = 8, // mente: intentos para adivinar el verso
    LARGO = 4; // mente: runas del verso
  let S = null,
    lienzo = null,
    c = null;

  // las runas, en trazos de -1 a 1 (y hacia abajo)
  const RUNAS = {
    fehu: [[[-0.35, 1], [-0.35, -1]], [[-0.35, -0.25], [0.4, -0.8]], [[-0.35, 0.25], [0.4, -0.3]]],
    ansuz: [[[-0.3, 1], [-0.3, -1]], [[-0.3, -1], [0.4, -0.55]], [[-0.3, -0.45], [0.4, 0]]],
    raidho: [[[-0.35, 1], [-0.35, -1], [0.35, -0.55], [-0.35, -0.1], [0.4, 1]]],
    kenaz: [[[0.4, -0.9], [-0.4, 0], [0.4, 0.9]]],
    gebo: [[[-0.6, -1], [0.6, 1]], [[0.6, -1], [-0.6, 1]]],
    isa: [[[0, -1], [0, 1]]],
    algiz: [[[0, 1], [0, -1]], [[0, -0.2], [-0.5, -0.9]], [[0, -0.2], [0.5, -0.9]]],
    sowilo: [[[0.35, -1], [-0.35, -0.3], [0.35, 0.3], [-0.35, 1]]],
    tiwaz: [[[0, 1], [0, -1]], [[-0.5, -0.45], [0, -1], [0.5, -0.45]]],
    berkano: [[[-0.3, -1], [-0.3, 1]], [[-0.3, -1], [0.35, -0.5], [-0.3, 0], [0.35, 0.5], [-0.3, 1]]],
    laguz: [[[-0.3, 1], [-0.3, -1], [0.45, -0.4]]],
    othala: [[[-0.55, 1], [0.45, 0.1], [0, -0.85], [-0.45, 0.1], [0.55, 1]]],
  };
  const COLORES = ["#73D5DB", "#FFD98A", "#FF8D71", "#9A6BD8", "#7BC86C", "#F5A524", "#4A78D0", "#E0B2B2"];

  // ---------- empezar y terminar ----------
  // tipo: parejas | simon | mente; op: { quien (nombre), x, y (para el sonido), fin(res) }
  function empezar(tipo, op = {}) {
    if (!A || !ARMAR[tipo]) return false;
    crearLienzo();
    S = { tipo, op, t: 0, fin: null, cur: 0, rnd: DIB.azar(Math.floor(Math.random() * 1e9)), luz: {}, modoAntes: J.modo === "menu" || J.modo === "dialogo" ? "juego" : J.modo };
    ARMAR[tipo]();
    J.modo = "runas";
    lienzo.style.display = "block";
    if (window.SONIDO) SONIDO.tocar("pagina", { vol: 0.6 });
    return true;
  }
  function terminar(res) {
    if (!S || S.fin) return;
    S.fin = Object.assign({ t: 0 }, res);
    if (window.SONIDO) SONIDO.tocar(res.gano ? "mision" : "tela", { vol: 0.5 });
  }
  function cerrar() {
    if (!S) return;
    const s = S;
    S = null;
    lienzo.style.display = "none";
    J.modo = s.modoAntes || "juego";
    if (CONTROLES.soltar) CONTROLES.soltar();
    const res = s.fin ? Object.assign({}, s.fin) : { gano: false, dejo: true };
    delete res.t;
    if (s.op.fin) s.op.fin(res);
  }
  // un tono por runa: suena solo cerca de quien juega
  const sonar = (f, dur = 0.25, forma = "sine") => window.SONIDO && SONIDO.tono(forma, f, f * 1.02, dur, 0.09, { x: S.op.x, y: S.op.y });

  // ---------- cada juego ----------
  const ARMAR = {
    parejas() {
      const nombres = Object.keys(RUNAS).sort(() => S.rnd() - 0.5).slice(0, 8);
      const cartas = [];
      nombres.forEach((r, i) => cartas.push({ r, col: COLORES[i] }, { r, col: COLORES[i] }));
      for (let i = cartas.length - 1; i > 0; i--) {
        const j = Math.floor(S.rnd() * (i + 1));
        [cartas[i], cartas[j]] = [cartas[j], cartas[i]];
      }
      Object.assign(S, { cartas, abiertas: [], espera: 0, vueltas: 0, cols: 4 });
    },
    simon() {
      Object.assign(S, { sec: [], idx: 0, fase: "pausa", reloj: 0.9, muestra: 0, cols: 0 });
      S.sec.push(Math.floor(S.rnd() * 4));
    },
    mente() {
      const de = Object.keys(RUNAS).sort(() => S.rnd() - 0.5).slice(0, 6);
      const codigo = de.slice().sort(() => S.rnd() - 0.5).slice(0, LARGO).map((r) => de.indexOf(r));
      Object.assign(S, { de, codigo, filas: [], ahora: [], cols: 6 });
    },
  };
  const PIEDRAS_SIMON = ["kenaz", "laguz", "algiz", "sowilo"]; // arriba, derecha, abajo, izquierda
  const COL_SIMON = ["#FF8D71", "#73D5DB", "#7BC86C", "#FFD98A"];
  const TONO_SIMON = [392, 494, 587, 330];

  // tocar: una carta (parejas), una piedra 0-3 (simon) o una runa de la fila de abajo, -1 = sacar la última (mente)
  function tocar(i) {
    if (!S || S.fin) return;
    if (S.tipo === "parejas") {
      const k = S.cartas[i];
      if (!k || k.hecha || S.abiertas.includes(i) || S.espera > 0 || S.abiertas.length >= 2) return;
      S.abiertas.push(i);
      sonar(500 + Object.keys(RUNAS).indexOf(k.r) * 40, 0.15, "triangle");
      if (S.abiertas.length === 2) {
        S.vueltas++;
        const [a, b] = S.abiertas.map((n) => S.cartas[n]);
        if (a.r === b.r) {
          a.hecha = b.hecha = true;
          S.abiertas = [];
          sonar(880, 0.3);
          if (S.cartas.every((q) => q.hecha)) terminar({ gano: true, vueltas: S.vueltas });
        } else S.espera = 0.85;
      }
    } else if (S.tipo === "simon") {
      if (S.fase !== "repite" || i < 0 || i > 3) return;
      S.luz[i] = 0.3;
      if (S.sec[S.idx] !== i) {
        sonar(110, 0.6, "sawtooth");
        return terminar({ gano: false, ronda: S.sec.length - 1 });
      }
      sonar(TONO_SIMON[i], 0.3);
      if (++S.idx >= S.sec.length) {
        if (S.sec.length >= META) return terminar({ gano: true, ronda: S.sec.length });
        S.sec.push(Math.floor(S.rnd() * 4));
        Object.assign(S, { idx: 0, fase: "pausa", reloj: 0.8 });
      }
    } else if (S.tipo === "mente") {
      if (i < 0) return void S.ahora.pop();
      if (i >= S.de.length || S.ahora.includes(i)) return;
      S.ahora.push(i);
      sonar(440 + i * 60, 0.15, "triangle");
      if (S.ahora.length === LARGO) probar();
    }
  }
  // mente: cuántas en su lugar y cuántas en otro
  function probar() {
    const g = S.ahora;
    const oro = g.filter((r, k) => S.codigo[k] === r).length,
      blanco = g.filter((r, k) => S.codigo[k] !== r && S.codigo.includes(r)).length;
    S.filas.push({ g: g.slice(), oro, blanco });
    S.ahora = [];
    sonar(oro === LARGO ? 880 : 520 + oro * 80, 0.25);
    if (oro === LARGO) terminar({ gano: true, intentos: S.filas.length });
    else if (S.filas.length >= INTENTOS) terminar({ gano: false, intentos: S.filas.length });
  }

  // ---------- el lienzo y el puntero ----------
  function crearLienzo() {
    if (lienzo) return;
    lienzo = document.createElement("canvas");
    lienzo.id = "runasLienzo";
    lienzo.className = "ui";
    lienzo.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:60;touch-action:none;display:none";
    document.body.appendChild(lienzo);
    c = lienzo.getContext("2d");
    lienzo.addEventListener("pointerdown", (e) => {
      if (!S) return;
      if (S.fin) return S.fin.t > 0.4 && cerrar();
      const r = lienzo.getBoundingClientRect(),
        k = Math.min(r.width / 1600, r.height / 900),
        x = (e.clientX - r.left - (r.width - 1600 * k) / 2) / k,
        y = (e.clientY - r.top - (r.height - 900 * k) / 2) / k;
      const hit = casillas().find((q) => x > q.x && x < q.x + q.w && y > q.y && y < q.y + q.h);
      if (hit) (S.cur = Math.max(0, hit.i)), tocar(hit.i);
    });
  }
  // dónde está cada cosa que se toca: { i, x, y, w, h }
  function casillas() {
    if (S.tipo === "parejas")
      return S.cartas.map((q, i) => ({ i, x: 800 - 2 * 150 + (i % 4) * 150 + 10, y: 130 + Math.floor(i / 4) * 175, w: 130, h: 160 }));
    if (S.tipo === "simon") return [[800, 250], [990, 440], [800, 630], [610, 440]].map(([x, y], i) => ({ i, x: x - 80, y: y - 80, w: 160, h: 160 }));
    const fila = S.de.map((r, i) => ({ i, x: 800 - 3 * 110 + i * 110 + 10, y: 760, w: 90, h: 90 }));
    // la fila que se está armando: tocarla saca la última
    fila.push({ i: -1, x: 560, y: 150 + S.filas.length * 72, w: 4 * 72, h: 64 });
    return fila;
  }

  // ---------- cada cuadro (lo llama juego.js por J.modos) ----------
  function paso(dt) {
    if (!S) return;
    S.t += dt;
    Object.keys(S.luz).forEach((k) => (S.luz[k] -= dt) <= 0 && delete S.luz[k]);
    if (S.fin) {
      S.fin.t += dt;
      if (S.fin.t > 0.4 && (CONTROLES.recien("interactuar") || CONTROLES.recien("seguir") || CONTROLES.recien("pausa"))) return cerrar();
      return dibujar();
    }
    if (CONTROLES.recien("pausa")) return terminar({ gano: false, dejo: true, ronda: S.sec ? S.sec.length - 1 : 0, intentos: S.filas ? S.filas.length : 0, vueltas: S.vueltas || 0 });
    const ok = CONTROLES.recien("interactuar") || CONTROLES.recien("seguir");
    if (S.tipo === "simon") {
      // las flechas tocan cada piedra del rombo
      ["arriba", "derecha", "abajo", "izquierda"].forEach((a, i) => CONTROLES.recien(a) && tocar(i));
      if (S.fase === "pausa" && (S.reloj -= dt) <= 0) Object.assign(S, { fase: "muestra", muestra: 0, reloj: 0 });
      if (S.fase === "muestra" && (S.reloj -= dt) <= 0) {
        if (S.muestra >= S.sec.length) S.fase = "repite";
        else {
          const p = S.sec[S.muestra++];
          S.luz[p] = 0.45;
          sonar(TONO_SIMON[p], 0.4);
          S.reloj = Math.max(0.4, 0.68 - S.sec.length * 0.03);
        }
      }
    } else {
      const n = S.tipo === "parejas" ? 16 : S.de.length;
      if (CONTROLES.recien("derecha")) S.cur = (S.cur + 1) % n;
      if (CONTROLES.recien("izquierda")) S.cur = (S.cur + n - 1) % n;
      if (S.tipo === "parejas") {
        if (CONTROLES.recien("abajo")) S.cur = (S.cur + 4) % n;
        if (CONTROLES.recien("arriba")) S.cur = (S.cur + n - 4) % n;
        if (S.espera > 0 && (S.espera -= dt) <= 0) {
          S.abiertas = [];
          if (S.vueltas >= VUELTAS) terminar({ gano: false, vueltas: S.vueltas });
        }
      } else if (CONTROLES.recien("arriba")) tocar(-1);
      if (ok) tocar(S.cur);
    }
    dibujar();
  }

  // ---------- el dibujo (1600 × 900) ----------
  const P = (pts, col) => DIB.P(c, pts, col);
  function texto(s, x, y, tam, col, al = "left", peso = 700) {
    c.font = `${peso} ${tam}px "DM Sans", system-ui, sans-serif`;
    c.textAlign = al;
    c.fillStyle = col;
    c.fillText(s, x, y);
  }
  function runa(nom, x, y, s, col, grosor = 0.2) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.lineCap = "round";
    c.lineJoin = "round";
    c.strokeStyle = col;
    c.lineWidth = grosor;
    RUNAS[nom].forEach((tr) => {
      c.beginPath();
      tr.forEach(([a, b], k) => (k ? c.lineTo(a, b) : c.moveTo(a, b)));
      c.stroke();
    });
    c.restore();
  }
  // una piedra plana: cara clara a la derecha, sombra a la izquierda (la luz de arriba a la derecha)
  function piedra(x, y, w, h, cara, sombra) {
    P([x + 8, y, x + w, y, x + w, y + h - 8, x + w - 8, y + h, x, y + h, x, y + 8], sombra);
    P([x + w * 0.42, y, x + w, y, x + w, y + h - 8, x + w - 8, y + h, x + w * 0.42, y + h], cara);
  }
  const rombo = (x, y, s, col) => P([x, y - s, x + s, y, x, y + s, x - s, y], col);
  function dibujar() {
    const r = lienzo.getBoundingClientRect(),
      dpr = Math.min(2, window.devicePixelRatio || 1);
    if (lienzo.width !== Math.round(r.width * dpr)) (lienzo.width = Math.round(r.width * dpr)), (lienzo.height = Math.round(r.height * dpr));
    const k = Math.min(lienzo.width / 1600, lienzo.height / 900);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#111111";
    c.fillRect(0, 0, lienzo.width, lienzo.height);
    c.setTransform(k, 0, 0, k, (lienzo.width - 1600 * k) / 2, (lienzo.height - 900 * k) / 2);
    // el paño del juego en el piso
    P([180, 40, 1420, 40, 1420, 870, 180, 870], "#1A1412");
    texto(t("jr." + S.tipo), 220, 92, 34, "#FFD98A", "left", 800);
    if (S.op.quien) texto(S.op.quien, 220, 124, 17, "#E0B2B2", "left", 500);
    DIBUJAR[S.tipo]();
    texto(t("jr.pie_" + (S.tipo === "simon" ? "simon" : S.tipo), [CONTROLES.glifo("interactuar"), CONTROLES.glifo("pausa"), CONTROLES.glifo("arriba")]), 800, 892, 16, "#E0B2B2", "center", 400);
    if (S.fin) {
      DIB.alfa(c, Math.min(0.75, S.fin.t * 2), () => P([0, 0, 1600, 0, 1600, 900, 0, 900], "#111111"));
      texto(t(S.fin.gano ? "jr.gano" : S.fin.dejo ? "jr.dejo" : "jr.perdio"), 800, 400, 56, S.fin.gano ? "#FFD98A" : "#FF8D71", "center", 800);
      texto(t("jr.res_" + S.tipo, [S.fin.vueltas || 0, S.fin.ronda || 0, S.fin.intentos || 0]), 800, 460, 26, "#F2ECEC", "center", 600);
      texto(t("jr.seguir", [CONTROLES.glifo("interactuar")]), 800, 520, 18, "#E0B2B2", "center", 400);
    }
  }
  const DIBUJAR = {
    parejas() {
      casillas().forEach((q) => {
        const k = S.cartas[q.i],
          abierta = k.hecha || S.abiertas.includes(q.i);
        if (q.i === S.cur) P([q.x - 6, q.y - 6, q.x + q.w + 6, q.y - 6, q.x + q.w + 6, q.y + q.h + 6, q.x - 6, q.y + q.h + 6], "#9C2315");
        if (abierta) {
          piedra(q.x, q.y, q.w, q.h, k.hecha ? "#4A4442" : "#6E6A66", k.hecha ? "#3A3634" : "#56524E");
          runa(k.r, q.x + q.w / 2, q.y + q.h / 2, 46, k.col, 0.2);
        } else {
          piedra(q.x, q.y, q.w, q.h, "#5E130D", "#46100A");
          rombo(q.x + q.w / 2 + 6, q.y + q.h / 2, 16, "#9C2315");
        }
      });
      texto(t("jr.vueltas", [S.vueltas, VUELTAS]), 1380, 92, 22, S.vueltas > VUELTAS - 3 ? "#FF8D71" : "#F2ECEC", "right");
    },
    simon() {
      casillas().forEach((q) => {
        const lit = S.luz[q.i] > 0,
          col = COL_SIMON[q.i];
        piedra(q.x, q.y, q.w, q.h, lit ? "#8E8A86" : "#4A4442", lit ? "#6E6A66" : "#3A3634");
        runa(PIEDRAS_SIMON[q.i], q.x + q.w / 2, q.y + q.h / 2, lit ? 56 : 48, lit ? col : "#2A2220", 0.22);
        if (lit) DIB.alfa(c, 0.5, () => runa(PIEDRAS_SIMON[q.i], q.x + q.w / 2, q.y + q.h / 2, 58, "#F2ECEC", 0.06));
      });
      texto(t("jr.ronda", [S.sec.length, META]), 1380, 92, 22, "#F2ECEC", "right");
      texto(t(S.fase === "repite" ? "jr.simon_vos" : "jr.simon_mira"), 800, 840, 22, S.fase === "repite" ? "#7BC86C" : "#73D5DB", "center");
    },
    mente() {
      // las filas jugadas y la de ahora
      for (let f = 0; f < INTENTOS; f++) {
        const y = 150 + f * 72,
          fila = S.filas[f],
          ahora = f === S.filas.length;
        P([560, y, 1200, y, 1200, y + 64, 560, y + 64], ahora ? "#2A2220" : "#161210");
        for (let s = 0; s < LARGO; s++) {
          const r = fila ? fila.g[s] : ahora ? S.ahora[s] : null;
          const x = 576 + s * 72;
          P([x, y + 7, x + 56, y + 7, x + 56, y + 57, x, y + 57], "#3A3634");
          if (r != null) runa(S.de[r], x + 28, y + 32, 20, COLORES[r], 0.22);
        }
        if (fila) {
          for (let p = 0; p < LARGO; p++) {
            const col = p < fila.oro ? "#FFD98A" : p < fila.oro + fila.blanco ? "#F2ECEC" : "#3A3634";
            rombo(890 + (p % 2) * 26, y + 20 + Math.floor(p / 2) * 24, 9, col);
          }
          texto(t("jr.mente_dice", [fila.oro, fila.blanco]), 1186, y + 38, 15, "#E0B2B2", "right", 500);
        }
      }
      texto(t("jr.intentos", [S.filas.length, INTENTOS]), 1380, 92, 22, "#F2ECEC", "right");
      // las seis runas para elegir
      casillas().filter((q) => q.i >= 0).forEach((q) => {
        const usada = S.ahora.includes(q.i);
        if (q.i === S.cur) P([q.x - 5, q.y - 5, q.x + q.w + 5, q.y - 5, q.x + q.w + 5, q.y + q.h + 5, q.x - 5, q.y + q.h + 5], "#9C2315");
        piedra(q.x, q.y, q.w, q.h, usada ? "#3A3634" : "#6E6A66", usada ? "#2A2220" : "#56524E");
        runa(S.de[q.i], q.x + q.w / 2, q.y + q.h / 2, 28, usada ? "#56524E" : COLORES[q.i], 0.22);
      });
      // cómo se lee
      rombo(240, 200, 10, "#FFD98A");
      texto(t("jr.mente_oro"), 258, 206, 15, "#F2ECEC", "left", 500);
      rombo(240, 236, 10, "#F2ECEC");
      texto(t("jr.mente_blanco"), 258, 242, 15, "#F2ECEC", "left", 500);
    },
  };

  return {
    iniciar(api) {
      A = api;
      J = A.J;
      J.modos = J.modos || {};
      J.modos.runas = paso;
    },
    empezar,
    tocar,
    terminar,
    cerrar,
    paso,
    activo: () => !!S,
    estado: () => S,
    RUNAS,
    VUELTAS,
    META,
    INTENTOS,
  };
})();
