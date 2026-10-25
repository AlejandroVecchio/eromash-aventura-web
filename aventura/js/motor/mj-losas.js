// ---------- minijuego: las losas deslizantes (MINIJ «losas») ----------
// Una tabla de piedra tallada (una runa grande con su marco y sus nudos) partida en losas cuadradas, con un hueco. Se
// corren las losas hacia el hueco hasta rearmar la tabla. Las flechas empujan hacia el hueco la losa de ese lado; con el
// puntero se toca una losa de la fila o la columna del hueco y se corre toda la tira. Variantes: 3 × 3, 4 × 4, atadas
// (dos losas quedan quietas con ataduras violeta y hay que rodearlas), contra el tiempo y la gran tabla (4 × 4 atada con
// reloj). Siempre tiene solución: se arma resuelta y se desordena moviendo el hueco. Lo usan los cofres (secretos.js,
// zonas.js).
(function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const CX = 860, // el centro de la tabla
    CY = 486,
    TAM = 560;

  const lado = (S) => S.v.lado || 3;
  const fila = (S, i) => Math.floor(i / lado(S));
  const col = (S, i) => i % lado(S);
  const resuelto = (S) => S.pos.every((p, i) => p === i || (p < 0 && i === S.pos.length - 1));
  // mover la losa de la celda i al hueco (con su tira, si está en la misma fila o columna sin ataduras en medio)
  function correr(S, i, mostrar) {
    const h = S.pos.indexOf(-1);
    if (i === h || S.atadas.includes(i)) return false;
    const n = lado(S);
    let paso;
    if (fila(S, i) === fila(S, h)) paso = i > h ? 1 : -1;
    else if (col(S, i) === col(S, h)) paso = i > h ? n : -n;
    else return false;
    for (let c = h + paso; c !== i + paso; c += paso) if (S.atadas.includes(c)) return false;
    // de la más cercana al hueco a la más lejana
    let hueco = h;
    for (let c = h + paso; c !== i + paso; c += paso) {
      S.pos[hueco] = S.pos[c];
      if (mostrar) S.anim[S.pos[hueco]] = { dx: col(S, c) - col(S, hueco), dy: fila(S, c) - fila(S, hueco) };
      S.pos[c] = -1;
      hueco = c;
    }
    return true;
  }
  // las celdas que se pueden atar sin dejar ninguna encerrada: del medio, en diagonal entre sí
  function elegirAtadas(S, k) {
    const n = lado(S);
    if (!k || n < 4) return [];
    const m = n >> 1,
      diag = S.rnd() < 0.5 ? [(m - 1) * n + (m - 1), m * n + m] : [(m - 1) * n + m, m * n + (m - 1)];
    return diag.slice(0, k);
  }

  MINIJ.registrar("losas", {
    variantes: {
      base: { lado: 3 },
      cuatro: { lado: 4 },
      atadas: { lado: 4, atadas: 2 },
      reloj: { lado: 3, tiempo: 60 },
      gran: { lado: 4, atadas: 2, tiempo: 210 },
    },
    pie: "mn.losas_pie",
    armar(S) {
      const n = lado(S),
        RUNAS = Object.keys((window.JUEGOS_RUNAS && JUEGOS_RUNAS.RUNAS) || {});
      S.runa = RUNAS[Math.floor(S.rnd() * RUNAS.length)];
      S.pos = Array.from({ length: n * n }, (_, i) => (i === n * n - 1 ? -1 : i));
      S.atadas = elegirAtadas(S, S.v.atadas);
      S.anim = {};
      // desordenar: el hueco camina al azar (sin volver sobre sus pasos) por las celdas libres
      let antes = -1;
      for (let k = 0; k < n * n * 18 || resuelto(S); k++) {
        const h = S.pos.indexOf(-1),
          vec = [h - n, h + n, col(S, h) > 0 ? h - 1 : -1, col(S, h) < n - 1 ? h + 1 : -1].filter((c) => c >= 0 && c < n * n && c !== antes && !S.atadas.includes(c));
        const c = vec[Math.floor(S.rnd() * vec.length)];
        if (c == null) continue;
        correr(S, c, false);
        antes = h;
      }
      S.movs = 0;
      S.cur = S.pos.indexOf(-1);
      S.gano = 0;
    },
    paso(S, dt) {
      const h = S.pos.indexOf(-1),
        n = lado(S);
      // la flecha empuja hacia el hueco la losa que está de ese lado… al revés: «arriba» sube la de abajo del hueco
      if (CONTROLES.recien("arriba") && fila(S, h) < n - 1) this.tocar(S, h + n);
      if (CONTROLES.recien("abajo") && fila(S, h) > 0) this.tocar(S, h - n);
      if (CONTROLES.recien("izquierda") && col(S, h) < n - 1) this.tocar(S, h + 1);
      if (CONTROLES.recien("derecha") && col(S, h) > 0) this.tocar(S, h - 1);
      Object.keys(S.anim).forEach((k) => {
        const a = S.anim[k],
          f = Math.max(0, 1 - dt * 16);
        a.dx *= f;
        a.dy *= f;
        if (Math.abs(a.dx) + Math.abs(a.dy) < 0.01) delete S.anim[k];
      });
      if (S.gano && (S.gano -= dt) <= 0) MINIJ.terminar({ gano: true, movs: S.movs });
    },
    tocar(S, i) {
      if (S.gano || i == null || i < 0 || i >= S.pos.length) return;
      if (S.atadas.includes(i)) return MINIJ_SONAR(150, 0.2, "sawtooth"), (S.luz["at" + i] = 0.4);
      if (!correr(S, i, true)) return;
      S.movs++;
      MINIJ_SONAR(260 + (S.pos.indexOf(-1) % 5) * 40, 0.08, "triangle");
      if (resuelto(S)) (S.gano = 0.8), (S.luz.todo = 0.8), MINIJ_SONAR(880, 0.4);
    },
    hit(S, x, y) {
      const n = lado(S),
        q = TAM / n,
        u = Math.floor((x - (CX - TAM / 2)) / q),
        v = Math.floor((y - (CY - TAM / 2)) / q);
      return u >= 0 && v >= 0 && u < n && v < n ? v * n + u : null;
    },
    res: (S) => t("mn.losas_res", [S.movs]),
    dibujar(S, D) {
      const c = D.c,
        n = lado(S),
        q = TAM / n,
        x0 = CX - TAM / 2,
        y0 = CY - TAM / 2;
      // la tabla entera, chica a la izquierda (lo que hay que rearmar)
      D.texto(t("mn.losas_modelo"), 300, 236, 16, "#E0B2B2", "center", 500);
      tabla(D, S, 210, 256, 180);
      // el hueco de la tabla
      D.P([x0 - 14, y0 - 14, x0 + TAM + 14, y0 - 14, x0 + TAM + 14, y0 + TAM + 14, x0 - 14, y0 + TAM + 14], "#2A2220");
      D.P([x0, y0, x0 + TAM, y0, x0 + TAM, y0 + TAM, x0, y0 + TAM], "#161210");
      S.pos.forEach((p, cel) => {
        if (p < 0) return;
        const a = S.anim[p] || { dx: 0, dy: 0 },
          dx = x0 + (col(S, cel) + a.dx) * q,
          dy = y0 + (fila(S, cel) + a.dy) * q,
          sx = col(S, p) * q,
          sy = fila(S, p) * q,
          g = 3;
        // la parte de la tabla que le toca a esta losa
        c.save();
        c.beginPath();
        c.rect(dx + g, dy + g, q - g * 2, q - g * 2);
        c.clip();
        c.translate(dx - sx, dy - sy);
        tabla(D, S, 0, 0, TAM);
        c.restore();
        // el canto: claro arriba a la derecha, sombra abajo a la izquierda
        D.P([dx + g, dy + g, dx + q - g, dy + g, dx + q - g - 6, dy + g + 6, dx + g + 6, dy + g + 6], "#6E6A66");
        D.P([dx + q - g, dy + g, dx + q - g, dy + q - g, dx + q - g - 6, dy + q - g - 6, dx + q - g - 6, dy + g + 6], "#5A5450");
        D.P([dx + g, dy + q - g, dx + q - g, dy + q - g, dx + q - g - 6, dy + q - g - 6, dx + g + 6, dy + q - g - 6], "#2A2220");
        // el número chico (ayuda a ubicarla) y las ataduras
        D.texto(String(p + 1), dx + q - 14, dy + q - 14, 15, p === cel ? "#73D5DB" : "#E0B2B2", "right", 600);
        if (S.atadas.includes(cel)) {
          const vio = S.luz["at" + cel] > 0 ? "#F2ECEC" : "#9A6BD8";
          [[dx + 14, dy + 14], [dx + q - 14, dy + 14], [dx + 14, dy + q - 14], [dx + q - 14, dy + q - 14]].forEach(([rx, ry]) => D.rombo(rx, ry, 8, vio));
          DIB.alfa(c, 0.5, () => D.P([dx + 14, dy + 10, dx + q - 14, dy + q - 18, dx + q - 14, dy + q - 10, dx + 14, dy + 18], vio));
        }
      });
      if (S.luz.todo > 0) D.halo(CX, CY, TAM * 0.55, "#73D5DB", S.luz.todo * 0.4);
      D.texto(t("mn.losas_movs", [S.movs]), 1380, 92, 22, "#F2ECEC", "right");
    },
  });
  // la tabla tallada: marco, rombos concéntricos, los nudos de oro y la runa grande en luz rúnica (sin degradados)
  function tabla(D, S, x, y, s) {
    const c = D.c,
      m = s / 2;
    D.P([x, y, x + s, y, x + s, y + s, x, y + s], "#3A3634");
    D.P([x + s * 0.5, y, x + s, y, x + s, y + s, x + s * 0.5, y + s], "#433E3B");
    const b = s * 0.06;
    D.P([x + b, y + b, x + s - b, y + b, x + s - b, y + s - b, x + b, y + s - b], "#4A4442");
    D.P([x + s * 0.5, y + b, x + s - b, y + b, x + s - b, y + s - b, x + s * 0.5, y + s - b], "#56524E");
    D.rombo(x + m, y + m, s * 0.42, "#3A3634");
    D.rombo(x + m, y + m, s * 0.36, "#5E130D");
    D.rombo(x + m, y + m, s * 0.3, "#2A2220");
    [[0.16, 0.16], [0.84, 0.16], [0.16, 0.84], [0.84, 0.84]].forEach(([u, v]) => {
      D.rombo(x + s * u, y + s * v, s * 0.07, "#FFD98A");
      D.rombo(x + s * u, y + s * v, s * 0.03, "#9C2315");
    });
    // la guarda de rombos chicos en el marco
    for (let k = 1; k < 8; k++) {
      D.rombo(x + (s * k) / 8, y + b / 2, b * 0.3, "#9C2315");
      D.rombo(x + (s * k) / 8, y + s - b / 2, b * 0.3, "#9C2315");
    }
    D.runa(S.runa, x + m, y + m, s * 0.28, "#73D5DB", 0.16);
    void c;
  }
  function MINIJ_SONAR(f, dur, forma) {
    if (window.SONIDO) SONIDO.tono(forma || "sine", f, f * 1.02, dur, 0.09, {});
  }
})();
