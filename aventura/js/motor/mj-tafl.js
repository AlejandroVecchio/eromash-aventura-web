// ---------- minijuego: hnefatafl (MINIJ «tafl») ----------
// El juego de tablero de los nórdicos sobre la tabla de Fjalar: el rey (con su corona de oro) y sus defensores en el
// medio, los atacantes en los bordes. Todas las piezas corren en línea recta como la torre, sin saltar; una pieza queda
// tomada entre dos enemigas (o una enemiga y una casilla hostil: las esquinas y el trono vacío). El rey gana llegando a
// una esquina; los atacantes ganan rodeándolo por los cuatro lados (el trono cuenta como atacante). Se toca una pieza y
// después adónde va; con el teclado, flechas y usar. Variantes: base (brandubh de 7, el jugador defiende), ataque (el
// jugador ataca y Fjalar defiende), borde (al rey le alcanza cualquier borde), contra el tiempo (escapar en 24
// jugadas) y la gran tabla (tablut de 9). Devuelve { gano, jugadas }. Lo pide Fjalar en el Hongo Dorado (hongo.js).
(function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const CX = 860,
    CY = 486;
  const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  // las posiciones de salida: A atacante, D defensor, K rey
  const SALIDA = {
    7: ["...A...", "...A...", "...D...", "AADKDAA", "...D...", "...A...", "...A..."],
    9: ["...AAA...", "....A....", "....D....", "A...D...A", "AADDKDDAA", "A...D...A", "....D....", "....A....", "...AAA..."],
  };
  const N = (S) => S.n;
  const en = (S, x, y) => x >= 0 && y >= 0 && x < N(S) && y < N(S);
  const esq = (S, x, y) => (x === 0 || x === N(S) - 1) && (y === 0 || y === N(S) - 1);
  const trono = (S, x, y) => x === S.m && y === S.m;
  const lado = (p) => (p === "A" ? "A" : p ? "D" : null);
  const tam = (S) => Math.min(84, Math.floor(620 / N(S)));

  // las jugadas de una pieza: en línea recta hasta chocar; solo el rey pisa el trono y las esquinas
  function jugadas(S, b, x, y) {
    const p = b[y][x],
      l = [];
    for (const [dx, dy] of D4)
      for (let k = 1; ; k++) {
        const nx = x + dx * k,
          ny = y + dy * k;
        if (!en(S, nx, ny) || b[ny][nx]) break;
        if (p !== "K" && (esq(S, nx, ny) || trono(S, nx, ny))) {
          if (trono(S, nx, ny)) continue; // se pasa por encima del trono vacío, pero no se para
          break;
        }
        l.push([nx, ny]);
      }
    return l;
  }
  function todas(S, b, quien) {
    const l = [];
    for (let y = 0; y < N(S); y++) for (let x = 0; x < N(S); x++) if (lado(b[y][x]) === quien) jugadas(S, b, x, y).forEach(([nx, ny]) => l.push([x, y, nx, ny]));
    return l;
  }
  const hostil = (S, b, x, y, contra) => {
    if (!en(S, x, y)) return false;
    const p = b[y][x];
    if (!p) return esq(S, x, y) || trono(S, x, y);
    // el rey arma a los defensores (cuenta para tomar atacantes) pero no se toma así
    return lado(p) !== contra && !(p === "K" && contra === "D");
  };
  // mueve en una copia y saca lo tomado; devuelve { b, tomadas }
  function mover(S, b0, [x, y, nx, ny]) {
    const b = b0.map((f) => f.slice()),
      p = b[y][x];
    b[y][x] = null;
    b[ny][nx] = p;
    let tomadas = 0;
    const caen = [];
    const yo = lado(p);
    for (const [dx, dy] of D4) {
      const ax = nx + dx,
        ay = ny + dy,
        q = en(S, ax, ay) && b[ay][ax];
      if (!q || q === "K" || lado(q) === yo) continue;
      if (hostil(S, b, ax + dx, ay + dy, lado(q))) {
        b[ay][ax] = null;
        tomadas++;
        caen.push([ax, ay, q]);
      }
    }
    return { b, tomadas, caen };
  }
  function rey(S, b) {
    for (let y = 0; y < N(S); y++) for (let x = 0; x < N(S); x++) if (b[y][x] === "K") return [x, y];
    return null;
  }
  // ¿quién ganó en esta tabla? "D" si el rey escapó, "A" si quedó rodeado
  function ganador(S, b) {
    const k = rey(S, b);
    if (!k) return "A";
    const [x, y] = k;
    if (esq(S, x, y) || (S.v.borde && (x === 0 || y === 0 || x === N(S) - 1 || y === N(S) - 1))) return "D";
    if (D4.every(([dx, dy]) => en(S, x + dx, y + dy) && (b[y + dy][x + dx] === "A" || trono(S, x + dx, y + dy)))) return "A";
    return null;
  }
  // a cuántas jugadas del escape está el rey (0: ya puede llegar)
  function escapes(S, b) {
    const k = rey(S, b);
    if (!k) return 0;
    return jugadas(S, b, k[0], k[1]).filter(([x, y]) => esq(S, x, y) || (S.v.borde && (x === 0 || y === 0 || x === N(S) - 1 || y === N(S) - 1))).length;
  }
  // Fjalar piensa una jugada: lo que gana ya, lo que toma, y que no le dejen el escape (o el encierro) servido
  function pensar(S, quien) {
    const l = todas(S, S.b, quien);
    if (!l.length) return null;
    let mejor = null,
      dm = -Infinity;
    for (const j of l) {
      const { b, tomadas } = mover(S, S.b, j),
        g = ganador(S, b);
      let v = tomadas * 12 + S.rnd() * 3;
      if (g === quien) v += 10000;
      const k = rey(S, b);
      if (quien === "A") {
        v -= escapes(S, b) * 400;
        if (k) v += D4.filter(([dx, dy]) => en(S, k[0] + dx, k[1] + dy) && b[k[1] + dy][k[0] + dx] === "A").length * 6;
      } else {
        v += escapes(S, b) * 60;
        if (k) v += (Math.abs(k[0] - S.m) + Math.abs(k[1] - S.m)) * 4;
      }
      // ¿la pieza movida queda para que la tomen?
      const rival = quien === "A" ? "D" : "A";
      if (todas(S, b, rival).some((r) => mover(S, b, r).b[j[3]][j[2]] !== b[j[3]][j[2]])) v -= 10;
      if (todas(S, b, rival).some((r) => ganador(S, mover(S, b, r).b) === rival)) v -= 3000;
      if (v > dm) (dm = v), (mejor = j);
    }
    return mejor;
  }
  function fin(S) {
    const g = ganador(S, S.b);
    if (g) return (S.gano = 1.1), (S.final = g === S.yo), (S.luz.todo = 1.1);
    if (!todas(S, S.b, S.turno).length) return (S.gano = 1.1), (S.final = S.turno !== S.yo);
    if (S.v.jugadas && S.jugadas >= S.v.jugadas && S.yo === "D") return (S.gano = 1.1), (S.final = false);
  }
  function jugar(S, j) {
    const r = mover(S, S.b, j);
    S.b = r.b;
    S.anim = { x: j[0], y: j[1], nx: j[2], ny: j[3], f: 0 };
    S.ultima = j;
    if (r.tomadas) (S.luz.toma = 0.5), (S.tomadas[S.turno] += r.tomadas), (S.caidas = { l: r.caen, t: 0.9 });
    if (window.SONIDO) SONIDO.tocar(r.tomadas ? "golpe" : "clic", { vol: 0.4, tono: r.tomadas ? 1.2 : 1 });
    if (S.turno === S.yo) S.jugadas++;
    S.turno = S.turno === "A" ? "D" : "A";
    fin(S);
  }


  // ---------- una pieza: disco de piedra (atacante oscuro con Tiwaz, defensor claro con Algiz, rey con su corona) ----------
  function pieza(D, p, px, py, r) {
    const c = D.c,
      disco = (rr, col) => {
        const pts = [];
        for (let k = 0; k < 16; k++) pts.push(px + Math.cos((k / 16) * Math.PI * 2) * rr, py + Math.sin((k / 16) * Math.PI * 2) * rr * 0.8);
        D.P(pts, col);
      };
    DIB.alfa(c, 0.35, () => D.P([px - r, py + r * 0.7, px + r, py + r * 0.7, px + r * 0.8, py + r, px - r * 0.8, py + r], "#111111"));
    if (p === "A") disco(r, "#2A2220"), disco(r * 0.7, "#3A3634"), D.runa("tiwaz", px, py, r * 0.4, "#9C2315", 0.3);
    else {
      disco(r, p === "K" ? "#E0B2B2" : "#C8C2BE");
      disco(r * 0.7, p === "K" ? "#F2ECEC" : "#E8E2DE");
      if (p === "K") D.P([px - r * 0.5, py - r * 0.1, px - r * 0.5, py - r * 0.6, px - r * 0.25, py - r * 0.35, px, py - r * 0.7, px + r * 0.25, py - r * 0.35, px + r * 0.5, py - r * 0.6, px + r * 0.5, py - r * 0.1], "#FFD98A");
      else D.runa("algiz", px, py, r * 0.4, "#5E130D", 0.3);
    }
  }
  function cruz(c, px, py, r, a) {
    DIB.alfa(c, a, () => {
      c.save();
      c.strokeStyle = "#C8402D";
      c.lineWidth = 5;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(px - r, py - r);
      c.lineTo(px + r, py + r);
      c.moveTo(px + r, py - r);
      c.lineTo(px - r, py + r);
      c.stroke();
      c.restore();
    });
  }

  // ---------- «Cómo se juega»: páginas con tablitas de 5 × 5 dibujadas como la tabla de verdad ----------
  // filas: A atacante, D defensor, K rey, . vacío; en minúscula la que cae (tachada). op: flechas [x, y, x2, y2, col],
  // marcas [x, y, col] (un marco), puntos [x, y] (adónde puede ir)
  const AYUDA = [
    { t: "mn.tafl_a_mueve", ej: [
      { f: [".....", ".....", ".D...", ".....", "....."], puntos: [[0, 2], [3, 2], [4, 2], [1, 0], [1, 1], [1, 3], [1, 4]], k: "mn.tafl_a_mueve1" },
      { f: [".....", ".....", "D....", ".....", "....."], puntos: [[1, 2], [3, 2], [4, 2]], marcas: [[2, 2, "#C8402D"]], k: "mn.tafl_a_mueve2" },
    ] },
    { t: "mn.tafl_a_come", ej: [
      { f: [".....", "Da..D", ".....", ".....", "....."], flechas: [[4, 1, 2, 1]], marcas: [[2, 1, "#73D5DB"]], k: "mn.tafl_a_come1" },
      { f: [".....", ".D...", ".a...", ".....", ".D..."], flechas: [[1, 4, 1, 3]], marcas: [[1, 3, "#73D5DB"]], k: "mn.tafl_a_come2" },
    ] },
    { t: "mn.tafl_a_mas", ej: [
      { f: [".....", "...D.", "...a.", ".Da..", "...D."], flechas: [[3, 4, 3, 3]], marcas: [[3, 3, "#73D5DB"]], k: "mn.tafl_a_dos" },
      { f: [".D...", ".....", ".....", "A.A..", "....."], flechas: [[1, 0, 1, 3, "#7BC86C"]], marcas: [[1, 3, "#7BC86C"]], k: "mn.tafl_a_seguro" },
    ] },
    { t: "mn.tafl_a_ayudan", ej: [
      { f: [".a...", "..D..", ".....", ".....", "....."], flechas: [[2, 1, 2, 0]], marcas: [[2, 0, "#73D5DB"], [0, 0, "#FFD98A"]], k: "mn.tafl_a_esquina" },
      { f: [".....", ".....", ".....", "..a..", "...D."], flechas: [[3, 4, 2, 4]], marcas: [[2, 4, "#73D5DB"], [2, 2, "#FFD98A"]], k: "mn.tafl_a_trono" },
    ] },
    { t: "mn.tafl_a_rey", ej: [
      { f: [".....", ".Ka.D", ".....", ".....", "....."], flechas: [[4, 1, 3, 1]], marcas: [[3, 1, "#73D5DB"]], k: "mn.tafl_a_reyCome" },
      { f: [".....", ".AK.A", ".....", ".....", "....."], flechas: [[4, 1, 3, 1, "#C8402D"]], marcas: [[2, 1, "#7BC86C"]], k: "mn.tafl_a_reySalva" },
    ] },
    { t: "mn.tafl_a_gana", ej: [
      { f: [".....", ".....", ".....", ".....", "..K.."], flechas: [[2, 4, 0, 4, "#FFD98A"], [2, 4, 4, 4, "#FFD98A"]], k: "mn.tafl_a_ganaRey" },
      { f: [".....", ".....", ".....", ".AK.A", "..A.."], flechas: [[4, 3, 3, 3, "#C8402D"]], marcas: [[2, 2, "#FFD98A"], [2, 3, "#C8402D"]], k: "mn.tafl_a_ganaFjalar" },
    ] },
  ];
  // los botones del panel, en el lienzo de 1600 × 900
  const BOTON_AYUDA = { x: 190, y: 560, w: 220, h: 50 },
    BOT_ANT = { x: 380, y: 744, w: 150, h: 48 },
    BOT_SIG = { x: 1070, y: 744, w: 150, h: 48 },
    BOT_CERRAR = { x: 1162, y: 132, w: 56, h: 48 };
  const en_ = (b, x, y) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  function boton(D, b, txt, col) {
    const { x, y, w, h } = b;
    D.P([x + 8, y, x + w, y, x + w, y + h - 8, x + w - 8, y + h, x, y + h, x, y + 8], "#2A2220");
    D.P([x, y, x + w, y, x + w, y + 3, x, y + 3], col);
    D.texto(txt, x + w / 2, y + h / 2 + 7, 18, "#F2ECEC", "center", 700);
  }
  // texto en renglones que no pasan de `ancho`
  function parrafo(D, txt, x, y, ancho, tam, col) {
    const c = D.c;
    c.font = `500 ${tam}px "DM Sans", system-ui, sans-serif`;
    let linea = "",
      n = 0;
    txt.split(" ").forEach((pal) => {
      const prueba = linea ? linea + " " + pal : pal;
      if (c.measureText(prueba).width > ancho && linea) D.texto(linea, x, y + n++ * (tam + 8), tam, col, "left", 500), (linea = pal);
      else linea = prueba;
    });
    if (linea) D.texto(linea, x, y + n * (tam + 8), tam, col, "left", 500);
  }
  function tablita(D, x0, y0, e) {
    const c = D.c,
      q = 52,
      n = 5,
      m = 2,
      ctr = (u) => u * q + q / 2;
    D.P([x0 - 12, y0 - 12, x0 + n * q + 12, y0 - 12, x0 + n * q + 12, y0 + n * q + 12, x0 - 12, y0 + n * q + 12], "#4A2A1E");
    D.P([x0 + (n * q) / 2, y0 - 12, x0 + n * q + 12, y0 - 12, x0 + n * q + 12, y0 + n * q + 12, x0 + (n * q) / 2, y0 + n * q + 12], "#5E3A26");
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const px = x0 + x * q,
          py = y0 + y * q,
          es = ((x === 0 || x === n - 1) && (y === 0 || y === n - 1)) || (x === m && y === m);
        D.P([px + 2, py + 2, px + q - 2, py + 2, px + q - 2, py + q - 2, px + 2, py + q - 2], es ? "#2A2220" : (x + y) % 2 ? "#A8622E" : "#9A5A2A");
        if (es) D.runa(x === m && y === m ? "othala" : "raidho", px + q / 2, py + q / 2, q * 0.2, "#5E3A26", 0.24);
      }
    (e.puntos || []).forEach(([x, y]) => D.rombo(x0 + ctr(x), y0 + ctr(y), 7, "#73D5DB"));
    (e.marcas || []).forEach(([x, y, col]) => {
      c.save();
      c.strokeStyle = col;
      c.lineWidth = 3;
      c.strokeRect(x0 + x * q + 4, y0 + y * q + 4, q - 8, q - 8);
      c.restore();
    });
    (e.flechas || []).forEach(([x, y, x2, y2, col = "#73D5DB"]) => {
      const ax = x0 + ctr(x),
        ay = y0 + ctr(y),
        a = Math.atan2(y2 - y, x2 - x),
        bx = x0 + ctr(x2) - Math.cos(a) * 18,
        by = y0 + ctr(y2) - Math.sin(a) * 18;
      c.save();
      c.strokeStyle = col;
      c.lineWidth = 5;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(ax, ay);
      c.lineTo(bx, by);
      c.stroke();
      c.restore();
      D.P([bx + Math.cos(a) * 10, by + Math.sin(a) * 10, bx + Math.cos(a + 2.3) * 9, by + Math.sin(a + 2.3) * 9, bx + Math.cos(a - 2.3) * 9, by + Math.sin(a - 2.3) * 9], col);
    });
    e.f.forEach((fila, y) =>
      fila.split("").forEach((ch, x) => {
        if (ch === ".") return;
        const px = x0 + ctr(x),
          py = y0 + ctr(y) - 1;
        pieza(D, ch.toUpperCase(), px, py, q * 0.34);
        if (ch !== ch.toUpperCase()) cruz(c, px, py, q * 0.26, 1);
      }),
    );
  }
  function dibujarAyuda(S, D) {
    const c = D.c,
      pg = AYUDA[S.pag];
    DIB.alfa(c, 0.82, () => D.P([0, 0, 1600, 0, 1600, 900, 0, 900], "#111111"));
    D.P([380, 120, 1220, 120, 1220, 812, 380, 812], "#1C1716");
    D.P([380, 120, 1220, 120, 1220, 124, 380, 124], "#9C2315");
    D.texto(t("mn.tafl_ayuda"), 420, 170, 30, "#FFD98A", "left", 700);
    D.texto(t(pg.t), 420, 212, 20, "#73D5DB", "left", 700);
    pg.ej.forEach((e, k) => {
      const x = 440 + k * 400;
      tablita(D, x, 250, e);
      parrafo(D, t(e.k), x - 10, 560, 320, 16, "#E0B2B2");
    });
    boton(D, BOT_CERRAR, "✕", "#9C2315");
    if (S.pag > 0) boton(D, BOT_ANT, "‹ " + t("mn.tafl_ayuda_ant"), "#73D5DB");
    if (S.pag < AYUDA.length - 1) boton(D, BOT_SIG, t("mn.tafl_ayuda_sig") + " ›", "#73D5DB");
    D.texto(S.pag + 1 + " / " + AYUDA.length, 800, 776, 16, "#E0B2B2", "center", 500);
  }
  // el panel abierto se maneja solo: flechas o los botones pasan de página, usar o el ✕ lo cierran
  function pasoAyuda(S) {
    if (CONTROLES.recien("izquierda")) S.pag = Math.max(0, S.pag - 1);
    if (CONTROLES.recien("derecha")) S.pag = Math.min(AYUDA.length - 1, S.pag + 1);
    if (CONTROLES.recien("interactuar") || CONTROLES.recien("atacar") || CONTROLES.recien("diario")) S.ayuda = false;
  }

  MINIJ.registrar("tafl", {
    variantes: {
      base: { n: 7 },
      ataque: { n: 7, yo: "A" },
      borde: { n: 7, borde: true },
      reloj: { n: 7, jugadas: 24 },
      gran: { n: 9 },
    },
    pie: "mn.tafl_pie",
    // Esc con el panel abierto lo cierra en vez de dejar la partida
    cierra(S) {
      if (!S.ayuda) return false;
      S.ayuda = false;
      return true;
    },
    armar(S) {
      S.ayuda = false;
      S.pag = 0;
      S.n = S.v.n || 7;
      S.m = (S.n - 1) >> 1;
      S.b = SALIDA[S.n].map((f) => f.split("").map((c) => (c === "." ? null : c)));
      S.yo = S.v.yo || "D";
      S.turno = "A"; // los atacantes empiezan
      S.sel = null;
      S.cur = S.m * S.n + S.m;
      S.jugadas = 0;
      S.tomadas = { A: 0, D: 0 };
      S.piensa = 0.7;
      S.gano = 0;
    },
    paso(S, dt) {
      if (S.ayuda) return pasoAyuda(S);
      if (CONTROLES.recien("diario")) return (S.ayuda = true), (S.pag = 0);
      const mov = (dx, dy) => {
        const x = Math.max(0, Math.min(S.n - 1, (S.cur % S.n) + dx)),
          y = Math.max(0, Math.min(S.n - 1, Math.floor(S.cur / S.n) + dy));
        S.cur = y * S.n + x;
      };
      if (CONTROLES.recien("arriba")) mov(0, -1);
      if (CONTROLES.recien("abajo")) mov(0, 1);
      if (CONTROLES.recien("izquierda")) mov(-1, 0);
      if (CONTROLES.recien("derecha")) mov(1, 0);
      if (CONTROLES.recien("interactuar") || CONTROLES.recien("atacar")) this.tocar(S, S.cur);
      if (S.anim) S.anim.f = Math.min(1, S.anim.f + dt * 6);
      if (S.caidas && (S.caidas.t -= dt) <= 0) S.caidas = null;
      if (S.gano) {
        if ((S.gano -= dt) <= 0) MINIJ.terminar({ gano: S.final, jugadas: S.jugadas });
        return;
      }
      // el turno de Fjalar
      if (S.turno !== S.yo && (S.piensa -= dt) <= 0) {
        const j = pensar(S, S.turno);
        S.piensa = 0.6;
        if (j) jugar(S, j);
        else fin(S);
      }
    },
    tocar(S, i) {
      if (i === -2) return (S.ayuda = true), (S.pag = 0);
      if (S.ayuda) {
        if (i === -3) S.pag = Math.max(0, S.pag - 1);
        else if (i === -4) S.pag = Math.min(AYUDA.length - 1, S.pag + 1);
        else if (i === -5) S.ayuda = false;
        return;
      }
      if (S.gano || i == null || S.turno !== S.yo) return;
      const x = i % S.n,
        y = Math.floor(i / S.n),
        p = S.b[y][x];
      S.cur = i;
      if (p && lado(p) === S.yo) return (S.sel = [x, y]), void (window.SONIDO && SONIDO.tono("triangle", 520, 520, 0.05, 0.05, {}));
      if (!S.sel) return;
      const ok = jugadas(S, S.b, S.sel[0], S.sel[1]).some(([nx, ny]) => nx === x && ny === y);
      if (!ok) return (S.luz.no = 0.3);
      jugar(S, [S.sel[0], S.sel[1], x, y]);
      S.sel = null;
      S.piensa = 0.6;
    },
    hit(S, x, y) {
      if (S.ayuda) return en_(BOT_CERRAR, x, y) ? -5 : en_(BOT_ANT, x, y) && S.pag > 0 ? -3 : en_(BOT_SIG, x, y) ? -4 : null;
      if (en_(BOTON_AYUDA, x, y)) return -2;
      const q = tam(S),
        x0 = CX - (S.n * q) / 2,
        y0 = CY - (S.n * q) / 2,
        u = Math.floor((x - x0) / q),
        v = Math.floor((y - y0) / q);
      return en(S, u, v) ? v * S.n + u : null;
    },
    res: (S) => t("mn.tafl_res", [S.jugadas, S.tomadas[S.yo]]),
    dibujar(S, D) {
      const c = D.c,
        q = tam(S),
        x0 = CX - (S.n * q) / 2,
        y0 = CY - (S.n * q) / 2;
      // la tabla de madera tallada, las casillas, las esquinas y el trono con sus runas
      D.P([x0 - 20, y0 - 20, x0 + S.n * q + 20, y0 - 20, x0 + S.n * q + 20, y0 + S.n * q + 20, x0 - 20, y0 + S.n * q + 20], "#4A2A1E");
      D.P([x0 + (S.n * q) / 2, y0 - 20, x0 + S.n * q + 20, y0 - 20, x0 + S.n * q + 20, y0 + S.n * q + 20, x0 + (S.n * q) / 2, y0 + S.n * q + 20], "#5E3A26");
      // los destinos de la pieza elegida; donde la jugada come, un rombo rojo, y con la marca encima, lo que caería
      const destinos = S.sel ? jugadas(S, S.b, S.sel[0], S.sel[1]).map(([nx, ny]) => [nx, ny, mover(S, S.b, [S.sel[0], S.sel[1], nx, ny]).caen]) : [];
      const aca = destinos.find(([a, b]) => b * S.n + a === S.cur),
        caeria = aca ? aca[2] : [];
      for (let y = 0; y < S.n; y++)
        for (let x = 0; x < S.n; x++) {
          const px = x0 + x * q,
            py = y0 + y * q,
            esp = esq(S, x, y) || trono(S, x, y);
          D.P([px + 2, py + 2, px + q - 2, py + 2, px + q - 2, py + q - 2, px + 2, py + q - 2], esp ? "#2A2220" : (x + y) % 2 ? "#A8622E" : "#9A5A2A");
          if (esp) D.runa(trono(S, x, y) ? "othala" : "raidho", px + q / 2, py + q / 2, q * 0.2, "#5E3A26", 0.24);
          const dst = destinos.find(([a, b]) => a === x && b === y);
          if (dst && dst[2].length) D.rombo(px + q / 2, py + q / 2, q * 0.2, "#C8402D"), D.rombo(px + q / 2, py + q / 2, q * 0.1, "#FF8D71");
          else if (dst) D.rombo(px + q / 2, py + q / 2, q * 0.12, "#73D5DB");
          if (S.ultima && ((S.ultima[0] === x && S.ultima[1] === y) || (S.ultima[2] === x && S.ultima[3] === y))) DIB.alfa(c, 0.2, () => D.P([px + 2, py + 2, px + q - 2, py + 2, px + q - 2, py + q - 2, px + 2, py + q - 2], "#FFD98A"));
        }
      // las piezas: discos de piedra (atacantes oscuros, defensores claros, el rey con su corona)
      for (let y = 0; y < S.n; y++)
        for (let x = 0; x < S.n; x++) {
          const p = S.b[y][x];
          if (!p) continue;
          let px = x0 + x * q + q / 2,
            py = y0 + y * q + q / 2;
          if (S.anim && S.anim.f < 1 && S.anim.nx === x && S.anim.ny === y) {
            const f = 1 - (1 - S.anim.f) ** 2;
            px = x0 + (S.anim.x + (x - S.anim.x) * f) * q + q / 2;
            py = y0 + (S.anim.y + (y - S.anim.y) * f) * q + q / 2;
          }
          const r = q * 0.34,
            sel = S.sel && S.sel[0] === x && S.sel[1] === y;
          pieza(D, p, px, py, r);
          if (sel) D.halo(px, py, r * 1.4, "#73D5DB", 0.5);
          if (caeria.some(([a, b]) => a === x && b === y)) cruz(c, px, py, r * 0.7, 0.85);
        }
      // lo que se acaba de comer: la pieza que se desvanece tachada
      if (S.caidas)
        S.caidas.l.forEach(([x, y, p]) => {
          const px = x0 + x * q + q / 2,
            py = y0 + y * q + q / 2,
            a = Math.min(1, S.caidas.t / 0.9);
          DIB.alfa(c, a * 0.6, () => D.rombo(px, py, q * 0.3, p === "A" ? "#2A2220" : "#C8C2BE"));
          cruz(c, px, py, q * 0.25, a);
        });
      // la marca del teclado
      const cx = x0 + (S.cur % S.n) * q,
        cy = y0 + Math.floor(S.cur / S.n) * q;
      c.save();
      c.strokeStyle = S.luz.no > 0 ? "#C8402D" : "#9C2315";
      c.lineWidth = 3;
      c.strokeRect(cx + 4, cy + 4, q - 8, q - 8);
      c.restore();
      if (S.luz.todo > 0) D.halo(CX, CY, 360, "#FFD98A", S.luz.todo * 0.3);
      // de quién es el turno y lo tomado
      const mio = S.turno === S.yo;
      D.texto(t(mio ? "mn.tafl_vos" : "mn.tafl_fjalar"), 300, 250, 22, mio ? "#73D5DB" : "#FFD98A", "center", 700);
      D.texto(t(S.yo === "D" ? "mn.tafl_defendes" : "mn.tafl_atacas"), 300, 290, 15, "#E0B2B2", "center", 500);
      D.texto(t("mn.tafl_tomadas", [S.tomadas[S.yo], S.tomadas[S.yo === "A" ? "D" : "A"]]), 300, 340, 16, "#F2ECEC", "center", 500);
      // las reglas a mano
      ["mn.tafl_regla1", "mn.tafl_regla2", "mn.tafl_regla3", "mn.tafl_regla4"].forEach((k, n) => D.texto(t(k), 300, 420 + n * 30, 14, n === 1 ? "#FF8D71" : "#E0B2B2", "center", 500));
      boton(D, BOTON_AYUDA, t("mn.tafl_ayuda") + " · " + CONTROLES.glifo("diario"), "#73D5DB");
      if (S.ayuda) dibujarAyuda(S, D);
      if (S.v.jugadas) D.texto(t("mn.tafl_quedan", [Math.max(0, S.v.jugadas - S.jugadas)]), 1380, 124, 20, "#73D5DB", "right", 700);
    },
  });
})();
