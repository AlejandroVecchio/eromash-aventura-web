// ---------- el matraz de la mesa de alquimia (MATRAZ, modo "matraz") ----------
// Destilar es un juego: el matraz de Erlenmeyer se mueve con A / D (o el stick, o arrastrándolo) y desde arriba caen
// motas de hierbas. Las que pide la receta (al costado, con su color y cuántas faltan) lo llenan; cualquier otra, o la
// podredumbre oscura, ensucia la pócima, y las de más también restan un poco. La efectividad (20 a 100 %) sale de lo
// juntado y de lo sucio, y la usa ALQUIMIA: la poción o el aceite rinde en proporción. Esc termina antes con lo que
// haya. Suena a burbujas, solo cerca de la mesa (SONIDO.burbujas con la posición de la mesa).
window.MATRAZ = (function () {
  "use strict";
  let A, J;
  const t = (k, v) => I18N.t(k, v);
  const DURA = 25, // segundos de juego
    CADA = 0.42, // cada cuánto cae una mota
    POR_HIERBA = 3, // motas por cada hierba de la receta
    BOCA = 38, // media boca del matraz: lo que entra
    VEL = 940,
    PODRIDA = "#3A2E2A";
  let S = null, // la destilación en curso
    lienzo = null,
    c = null;

  // ---------- empezar y terminar ----------
  // R: la receta (pide, col), nombre: lo que se destila, x y: la mesa (para el sonido), fin(ef): lo que hace ALQUIMIA
  function empezar(op) {
    if (!A) return false;
    crearLienzo();
    const pide = {};
    Object.keys(op.pide).forEach((k) => (pide[k] = op.pide[k] * POR_HIERBA));
    const otras = Object.keys(op.hierbas).filter((k) => !pide[k]);
    S = {
      op,
      pide,
      tiene: {},
      otras,
      malas: 0,
      sobras: 0,
      t: 0,
      cae: 0.6,
      mx: 800,
      meta: null, // la x a la que lo lleva el dedo o el mouse
      motas: [],
      gotas: [],
      burbuja: 0,
      fin: null,
      rnd: DIB.azar(Math.floor(Math.random() * 1e9)),
      modoAntes: J.modo === "menu" ? "juego" : J.modo,
    };
    J.modo = "matraz";
    lienzo.style.display = "block";
    if (window.SONIDO) SONIDO.burbujas(op.x, op.y, 0.9);
    return true;
  }
  const necesarias = () => Object.values(S.pide).reduce((a, b) => a + b, 0);
  const juntadas = () => Object.keys(S.pide).reduce((a, k) => a + Math.min(S.pide[k], S.tiene[k] || 0), 0);
  const completa = () => juntadas() >= necesarias();
  // la efectividad: lo juntado, menos lo que la ensucia
  function efectividad() {
    const k = juntadas() / necesarias();
    return Math.round(Math.max(20, Math.min(100, k * 100 - S.malas * 12 - S.sobras * 3)));
  }
  function terminar() {
    if (!S || S.fin) return;
    const ef = efectividad();
    S.fin = { ef, t: 0, nivel: ef >= 100 ? "perfecta" : ef >= 75 ? "buena" : ef >= 45 ? "floja" : "mala" };
    if (window.SONIDO) SONIDO.tocar(ef >= 75 ? "mision" : "tela", { vol: 0.5, x: S.op.x, y: S.op.y });
  }
  function cerrar() {
    if (!S) return;
    const s = S,
      ef = s.fin ? s.fin.ef : efectividad();
    S = null;
    lienzo.style.display = "none";
    J.modo = s.modoAntes || "juego";
    if (CONTROLES.soltar) CONTROLES.soltar();
    s.op.fin(ef);
  }

  // ---------- el lienzo ----------
  function crearLienzo() {
    if (lienzo) return;
    lienzo = document.createElement("canvas");
    lienzo.id = "matrazLienzo";
    lienzo.className = "ui";
    lienzo.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:60;touch-action:none;pointer-events:auto;display:none";
    document.body.appendChild(lienzo);
    c = lienzo.getContext("2d");
    // arrastrar el matraz con el dedo o el mouse; tocar al final cierra
    const aX = (e) => {
      const r = lienzo.getBoundingClientRect(),
        k = Math.min(r.width / 1600, r.height / 900);
      return (e.clientX - r.left - (r.width - 1600 * k) / 2) / k;
    };
    lienzo.addEventListener("pointerdown", (e) => {
      if (!S) return;
      if (S.fin) return S.fin.t > 0.4 && cerrar();
      S.meta = aX(e);
      lienzo.setPointerCapture && lienzo.setPointerCapture(e.pointerId);
    });
    lienzo.addEventListener("pointermove", (e) => S && S.meta != null && (S.meta = aX(e)));
    lienzo.addEventListener("pointerup", () => S && (S.meta = null));
  }

  // ---------- cada cuadro (lo llama juego.js por J.modos) ----------
  function soltarMota() {
    const r = S.rnd,
      faltan = Object.keys(S.pide).filter((k) => (S.tiene[k] || 0) < S.pide[k]);
    let tipo;
    // más de la mitad son útiles, y entre las útiles más de las que faltan
    if (r() < 0.56) {
      const de = faltan.length && r() < 0.8 ? faltan : Object.keys(S.pide);
      tipo = de[Math.floor(r() * de.length)];
    } else tipo = S.otras.length && r() < 0.65 ? S.otras[Math.floor(r() * S.otras.length)] : "podrida";
    S.motas.push({ tipo, x: 380 + r() * 840, y: -30, v: 250 + r() * 140 + S.t * 4, fase: r() * 6, giro: r() * 6, s: 13 + r() * 5 });
  }
  function atrapar(m) {
    const buena = S.pide[m.tipo] != null;
    const col = m.tipo === "podrida" ? PODRIDA : S.op.hierbas[m.tipo].col;
    if (buena && (S.tiene[m.tipo] || 0) < S.pide[m.tipo]) {
      S.tiene[m.tipo] = (S.tiene[m.tipo] || 0) + 1;
      if (window.SONIDO) SONIDO.tono("sine", 620 + S.rnd() * 300, 1300, 0.12, 0.08, { x: S.op.x, y: S.op.y });
    } else if (buena) {
      S.sobras++;
      if (window.SONIDO) SONIDO.tono("sine", 420, 520, 0.12, 0.06, { x: S.op.x, y: S.op.y });
    } else {
      S.malas++;
      if (window.SONIDO) SONIDO.tono("sawtooth", 140, 70, 0.3, 0.07, { x: S.op.x, y: S.op.y, filtro: 500 });
      if (window.J && J.sacudir) J.sacudir(0.15);
    }
    for (let i = 0; i < 6; i++) S.gotas.push({ x: S.mx + (S.rnd() - 0.5) * 30, y: 560, vx: (S.rnd() - 0.5) * 220, vy: -160 - S.rnd() * 200, l: 0.5, col, mala: !buena });
  }
  function paso(dt) {
    if (!S) return;
    if (S.fin) {
      S.fin.t += dt;
      if (S.fin.t > 0.4 && (CONTROLES.recien("interactuar") || CONTROLES.recien("seguir") || CONTROLES.recien("atacar") || CONTROLES.recien("pausa"))) return cerrar();
      return dibujar(dt);
    }
    if (CONTROLES.recien("pausa")) return terminar();
    S.t += dt;
    // mover el matraz: teclas, stick o el dedo
    const e = CONTROLES.eje ? CONTROLES.eje() : { x: 0 };
    let dir = (CONTROLES.pulsado("derecha") ? 1 : 0) - (CONTROLES.pulsado("izquierda") ? 1 : 0);
    if (!dir && Math.abs(e.x) > 0.2) dir = e.x;
    if (dir) S.mx += dir * VEL * dt;
    else if (S.meta != null) S.mx += Math.max(-VEL * dt, Math.min(VEL * dt, S.meta - S.mx));
    S.mx = Math.max(400, Math.min(1200, S.mx));
    // las motas
    if ((S.cae -= dt) <= 0 && S.t < DURA - 1.2) (S.cae = CADA), soltarMota();
    const boca = 528;
    S.motas = S.motas.filter((m) => {
      const y0 = m.y;
      m.y += m.v * dt;
      m.x += Math.sin(S.t * 2.4 + m.fase) * 40 * dt;
      m.giro += dt * 3;
      if (y0 < boca && m.y >= boca && Math.abs(m.x - S.mx) < BOCA) return atrapar(m), false;
      return m.y < 736; // se pierden en la mesa
    });
    S.gotas = S.gotas.filter((g) => ((g.x += g.vx * dt), (g.y += g.vy * dt), (g.vy += 900 * dt), (g.l -= dt) > 0));
    // el hervor: burbujas que se oyen solo cerca de la mesa
    if ((S.burbuja -= dt) <= 0) {
      S.burbuja = 0.5 + S.rnd() * 0.4;
      if (window.SONIDO) SONIDO.burbujas(S.op.x, S.op.y, 0.5);
    }
    if (completa() || S.t >= DURA) terminar();
    dibujar(dt);
  }

  // ---------- el dibujo (1600 × 900) ----------
  const P = (pts, col) => DIB.P(c, pts, col);
  const rombo = (x, y, s, col, g = 0) => {
    const a = Math.cos(g) * s,
      b = Math.sin(g) * s;
    P([x + b, y - a, x + a, y + b, x - b, y + a, x - a, y - b], col);
  };
  const mezcla = (a, b, q) =>
    "#" + [1, 3, 5].map((i) => Math.round(parseInt(a.substr(i, 2), 16) * (1 - q) + parseInt(b.substr(i, 2), 16) * q).toString(16).padStart(2, "0")).join("");
  // el color de la pócima: lo que juntó, mezclado, y lo sucio la oscurece
  function colorPocima() {
    let col = S.op.col;
    const sucio = Math.min(0.75, S.malas * 0.16 + S.sobras * 0.04);
    return mezcla(col, PODRIDA, sucio);
  }
  function matraz(x, lleno) {
    // la sombra elíptica en la mesa y el trípode de hierro (el fuego queda abajo)
    DIB.E(c, x + 8, 746, 130, 12, "rgba(0,0,0,0.35)");
    P([x - 96, 690, x - 86, 690, x - 70, 746, x - 80, 746], "#3A3634");
    P([x + 86, 690, x + 96, 690, x + 80, 746, x + 70, 746], "#5A5458");
    P([x - 104, 686, x + 104, 686, x + 104, 694, x - 104, 694], "#46423F");
    // el cuerpo de vidrio: un cono con el fondo plano, la mitad izquierda en sombra
    const cuerpo = [x - 22, 556, x + 22, 556, x + 22, 596, x + 112, 688, x - 112, 688, x - 22, 596];
    P(cuerpo, "rgba(200,242,244,0.16)");
    P([x, 556, x + 22, 556, x + 22, 596, x + 112, 688, x, 688], "rgba(242,236,236,0.12)");
    // la pócima adentro: sube con lo juntado
    if (lleno > 0) {
      const h = 6 + lleno * 112,
        y = 688 - h,
        w = (yy) => (yy > 596 ? 22 + ((yy - 596) / 92) * 90 : 22);
      const col = colorPocima(),
        hombro = y < 596; // si llega al cuello, el contorno pasa por los hombros del matraz
      P([x - w(y), y, x + w(y), y].concat(hombro ? [x + 22, 596] : [], [x + 106, 684, x - 106, 684], hombro ? [x - 22, 596] : []), col);
      P([x, y, x + w(y), y].concat(hombro ? [x + 22, 596] : [], [x + 106, 684, x, 684]), mezcla(col, "#F2ECEC", 0.18));
      // las burbujitas que suben
      for (let i = 0; i < 7; i++) {
        const q = (S.t * 0.7 + i * 0.37) % 1,
          by = 682 - q * h,
          bx = x + Math.sin(i * 2.1 + S.t * 3) * w(by) * 0.6;
        DIB.alfa(c, 0.5 * (1 - q), () => DIB.E(c, bx, by, 4, 4, "#F2ECEC"));
      }
    }
    // el borde de la boca y el brillo del vidrio a la derecha
    P([x - 30, 548, x + 30, 548, x + 26, 558, x - 26, 558], "rgba(242,236,236,0.55)");
    P([x + 40, 636, x + 46, 636, x + 92, 682, x + 84, 682], "rgba(242,236,236,0.35)");
  }
  function texto(txt, x, y, tam, col, al = "left", peso = 700) {
    c.font = `${peso} ${tam}px "DM Sans", system-ui, sans-serif`;
    c.textAlign = al;
    c.fillStyle = col;
    c.fillText(txt, x, y);
  }
  function dibujar() {
    const W0 = innerWidth,
      H0 = innerHeight,
      pr = Math.min(2, devicePixelRatio || 1);
    if (lienzo.width !== Math.round(W0 * pr) || lienzo.height !== Math.round(H0 * pr)) {
      lienzo.width = Math.round(W0 * pr);
      lienzo.height = Math.round(H0 * pr);
    }
    const k = Math.min(lienzo.width / 1600, lienzo.height / 900);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#111111";
    c.fillRect(0, 0, lienzo.width, lienzo.height);
    c.setTransform(k, 0, 0, k, (lienzo.width - 1600 * k) / 2, (lienzo.height - 900 * k) / 2);
    // la pared de tablas de la mesa de Thora y la mesa
    for (let i = 0; i < 8; i++) P([i * 200, 0, i * 200 + 196, 0, i * 200 + 196, 740, i * 200, 740], i % 2 ? "#1E1816" : "#221B18");
    P([0, 740, 1600, 740, 1600, 900, 0, 900], "#3A2A20");
    P([0, 740, 1600, 740, 1600, 756, 0, 756], "#553A22");
    // el fuego chico abajo del matraz (lo que hace hervir)
    const f = (a) => Math.sin(S.t * 11 + a) * 5;
    P([S.mx - 40, 742, S.mx - 22, 706 + f(0), S.mx - 6, 732, S.mx + 10, 698 + f(2), S.mx + 24, 732, S.mx + 40, 742], "#C8402D");
    P([S.mx - 18, 742, S.mx - 4, 716 + f(4), S.mx + 6, 730, S.mx + 16, 742], "#FFD98A");
    // las motas que caen: rombos que giran, con su color de hierba (la podredumbre, oscura con borde violeta)
    for (const m of S.motas) {
      if (m.tipo === "podrida") {
        rombo(m.x, m.y, m.s + 3, "#5E130D", m.giro);
        rombo(m.x, m.y, m.s, PODRIDA, m.giro);
      } else {
        const col = S.op.hierbas[m.tipo].col;
        rombo(m.x, m.y, m.s, mezcla(col, "#111111", 0.25), m.giro);
        rombo(m.x + 2, m.y - 2, m.s * 0.55, col, m.giro);
      }
    }
    for (const g of S.gotas) DIB.alfa(c, Math.max(0, g.l * 2), () => rombo(g.x, g.y, g.mala ? 6 : 4, g.col, g.l * 9));
    matraz(S.mx, juntadas() / necesarias());
    // el costado: lo que pide la receta
    const alto = 200 + Object.keys(S.pide).length * 64 + 130;
    P([1236, 80, 1580, 80, 1580, alto, 1236, alto], "#1A1412");
    texto(S.op.nombre, 1256, 122, 26, "#FFD98A");
    texto(t("aq.mz_pide"), 1256, 158, 16, "#E0B2B2", "left", 400);
    let y = 200;
    for (const id of Object.keys(S.pide)) {
      const n = Math.min(S.pide[id], S.tiene[id] || 0),
        ok = n >= S.pide[id];
      rombo(1276, y - 6, 15, S.op.hierbas[id].col, 0);
      texto(t("aq.h_" + id), 1302, y, 18, ok ? "#7BC86C" : "#F2ECEC", "left", 600);
      texto(`${n} / ${S.pide[id]}`, 1562, y, 20, ok ? "#7BC86C" : "#F2ECEC", "right");
      y += 64;
    }
    rombo(1276, y - 6, 13, "#5E130D", 0);
    rombo(1276, y - 6, 10, PODRIDA, 0);
    texto(t("aq.mz_ensucia"), 1302, y, 15, "#E0B2B2", "left", 400);
    y += 40;
    texto(t("aq.mz_sucia", [S.malas, S.sobras]), 1256, y, 16, S.malas ? "#FF8D71" : "#E0B2B2", "left", 600);
    y += 34;
    texto(t("aq.mz_ef_ahora", [efectividad()]), 1256, y, 18, "#FFD98A");
    // el tiempo: una barra arriba
    const q = Math.max(0, 1 - S.t / DURA);
    P([380, 40, 1220, 40, 1220, 52, 380, 52], "#2A2220");
    P([380, 40, 380 + 840 * q, 40, 380 + 840 * q, 52, 380, 52], q < 0.2 ? "#C8402D" : "#73D5DB");
    texto(t("aq.mz_pie", [CONTROLES.glifo("izquierda"), CONTROLES.glifo("derecha"), CONTROLES.glifo("pausa")]), 800, 880, 16, "#E0B2B2", "center", 400);
    // el final: la efectividad grande
    if (S.fin) {
      DIB.alfa(c, Math.min(0.7, S.fin.t * 2), () => P([0, 0, 1600, 0, 1600, 900, 0, 900], "#111111"));
      const col = S.fin.nivel === "perfecta" ? "#FFD98A" : S.fin.nivel === "buena" ? "#7BC86C" : S.fin.nivel === "floja" ? "#F2ECEC" : "#FF8D71";
      texto(t("aq.mz_" + S.fin.nivel), 800, 380, 54, col, "center", 800);
      texto(t("aq.mz_ef", [S.fin.ef]), 800, 450, 34, "#F2ECEC", "center");
      texto(t("aq.mz_seguir", [CONTROLES.glifo("interactuar")]), 800, 520, 18, "#E0B2B2", "center", 400);
    }
  }

  return {
    iniciar(api) {
      A = api;
      J = A.J;
      J.modos = J.modos || {};
      J.modos.matraz = paso;
    },
    empezar,
    terminar,
    cerrar,
    paso,
    activo: () => !!S,
    estado: () => S,
    efectividad: () => (S ? efectividad() : 0),
    DURA,
  };
})();
