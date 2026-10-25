// ---------- minijuego: el hilo de las Nornas (MINIJ «hilo») ----------
// Urd, Verdandi y Skuld tejen el destino al pie del fresno. Sobre el telar hay pares de piedras con la misma runa: hay
// que unir cada par con su hilo, de casilla en casilla (sin diagonales) y sin que dos hilos se crucen. Se arrastra desde
// una piedra (o desde la punta de un hilo); volver sobre el propio hilo lo acorta y empezar de nuevo desde una piedra lo
// rehace. Con flechas: se mueve el marco, E agarra o suelta y las flechas tiran del hilo. Variantes: 5 × 5, 6 × 6, sin
// huecos (hay que cubrir todo el telar), con nudos de oro (casillas que algún hilo tiene que pasar) y contra el tiempo
// (7 × 7 sin huecos). Siempre tiene solución: el telar se arma con un solo hilo largo que recorre todas las casillas
// (un camino hamiltoniano mezclado con «mordidas») y se corta en pedazos; las puntas de cada pedazo son las piedras.
// Lo usa la Poza de Urd (vida.js).
(function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const CX = 860,
    CY = 480,
    TAM = 600;
  const COLS = ["#73D5DB", "#FFD98A", "#FF8D71", "#9A6BD8", "#7BC86C", "#F5A524", "#4A78D0", "#E0B2B2"];
  const RUNAS_HILO = ["fehu", "raidho", "kenaz", "laguz", "algiz", "sowilo", "tiwaz", "othala"];

  const vecinas = (n, i) => [i - n, i + n, i % n ? i - 1 : -1, i % n < n - 1 ? i + 1 : -1].filter((c) => c >= 0 && c < n * n);
  const junto = (n, a, b) => vecinas(n, a).includes(b);

  // un camino que pasa una vez por cada casilla: la serpiente de siempre, mezclada con mordidas desde las puntas
  function camino(n, rnd) {
    let p = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) p.push(y * n + (y % 2 ? n - 1 - x : x));
    for (let k = 0; k < n * n * 30; k++) {
      if (rnd() < 0.5) p.reverse();
      const v = vecinas(n, p[0]),
        nb = v[Math.floor(rnd() * v.length)],
        idx = p.indexOf(nb);
      if (idx > 1) p = p.slice(0, idx).reverse().concat(p.slice(idx));
    }
    return p;
  }
  // cortar el camino en k pedazos de al menos 3 casillas
  function cortar(p, k, rnd) {
    const largos = Array(k).fill(3);
    for (let r = p.length - 3 * k; r > 0; r--) largos[Math.floor(rnd() * k)]++;
    const out = [];
    let i = 0;
    largos.forEach((l) => out.push(p.slice(i, (i += l))));
    return out;
  }

  const completo = (S, h) => {
    const p = S.hilos[h];
    return p.length >= 2 && S.pares[h].includes(p[0]) && S.pares[h].includes(p[p.length - 1]) && p[0] !== p[p.length - 1];
  };
  function dueno(S, cel) {
    for (let h = 0; h < S.hilos.length; h++) if (S.hilos[h].includes(cel)) return h;
    return -1;
  }
  const piedraDe = (S, cel) => S.pares.findIndex((pr) => pr.includes(cel));
  function ganado(S) {
    if (!S.hilos.every((_, h) => completo(S, h))) return false;
    if (S.v.lleno && S.hilos.reduce((n, p) => n + p.length, 0) < S.n * S.n) return false;
    if (S.nudos.some((c) => dueno(S, c) < 0)) return false;
    return true;
  }
  // empezar a tirar desde una casilla: una piedra (rehace su hilo) o la punta de un hilo (lo sigue)
  function agarrar(S, cel) {
    const pd = piedraDe(S, cel);
    if (pd >= 0) {
      S.hilos[pd] = [cel];
      S.mano = pd;
      return true;
    }
    const h = dueno(S, cel);
    if (h >= 0 && !completo(S, h)) {
      const p = S.hilos[h];
      S.hilos[h] = p.slice(0, p.indexOf(cel) + 1);
      S.mano = h;
      return true;
    }
    return false;
  }
  // llevar el hilo en la mano a la casilla cel (si es vecina de la punta)
  function tirar(S, cel) {
    const h = S.mano;
    if (h < 0) return false;
    const p = S.hilos[h],
      punta = p[p.length - 1];
    if (cel === punta) return false;
    const atras = p.indexOf(cel);
    if (atras >= 0) {
      S.hilos[h] = p.slice(0, atras + 1);
      return true;
    }
    if (completo(S, h) || !junto(S.n, punta, cel)) return false;
    const pd = piedraDe(S, cel);
    if (pd >= 0 && pd !== h) return false; // la piedra de otro hilo
    const otro = dueno(S, cel);
    if (otro >= 0) {
      // cruzar un hilo lo corta ahí (como en el telar: el hilo nuevo manda)
      S.hilos[otro] = S.hilos[otro].slice(0, S.hilos[otro].indexOf(cel));
      if (!S.hilos[otro].length) S.hilos[otro] = [];
    }
    p.push(cel);
    sonar(300 + h * 60 + p.length * 6, 0.05, "triangle");
    if (completo(S, h)) {
      S.mano = -1;
      S.luz["h" + h] = 0.6;
      sonar(660 + h * 70, 0.25);
    }
    return true;
  }
  function soltar(S) {
    S.mano = -1;
    if (ganado(S) && !S.gano) (S.gano = 0.8), (S.luz.todo = 0.8), sonar(880, 0.4);
  }

  MINIJ.registrar("hilo", {
    variantes: {
      base: { n: 5, hilos: 4 },
      seis: { n: 6, hilos: 5 },
      lleno: { n: 6, hilos: 5, lleno: true },
      nudos: { n: 6, hilos: 5, nudos: 3 },
      reloj: { n: 7, hilos: 6, lleno: true, tiempo: 150 },
    },
    pie: "mn.hilo_pie",
    armar(S) {
      const n = (S.n = S.v.n || 5),
        p = camino(n, S.rnd),
        trozos = cortar(p, S.v.hilos || 4, S.rnd);
      S.sol = trozos;
      S.pares = trozos.map((tr) => [tr[0], tr[tr.length - 1]]);
      S.hilos = trozos.map(() => []);
      // los nudos de oro: casillas de la solución lejos de las piedras
      const libres = p.filter((c) => piedraDe(S, c) < 0);
      S.nudos = [];
      for (let k = 0; k < (S.v.nudos || 0) && libres.length; k++) S.nudos.push(libres.splice(Math.floor(S.rnd() * libres.length), 1)[0]);
      S.mano = -1;
      S.cur = S.pares[0][0];
      S.movs = 0;
      S.gano = 0;
    },
    paso(S, dt) {
      const n = S.n,
        c = S.cur,
        mov = { arriba: c >= n ? c - n : -1, abajo: c < n * (n - 1) ? c + n : -1, izquierda: c % n ? c - 1 : -1, derecha: c % n < n - 1 ? c + 1 : -1 };
      Object.keys(mov).forEach((a) => {
        if (!CONTROLES.recien(a) || mov[a] < 0) return;
        if (S.mano >= 0) tirar(S, mov[a]) && (S.movs++, (S.cur = mov[a]));
        else S.cur = mov[a];
      });
      if (CONTROLES.recien("interactuar")) this.tocar(S, S.cur);
      if (S.gano && (S.gano -= dt) <= 0) MINIJ.terminar({ gano: true, movs: S.movs });
    },
    // tocar (o E): agarrar desde ahí, o soltar si ya tenía un hilo en la mano
    tocar(S, i) {
      if (S.gano || i == null || i < 0) return;
      if (S.mano >= 0) return soltar(S);
      if (agarrar(S, i)) sonar(420, 0.08, "triangle");
    },
    celda(S, x, y) {
      const q = TAM / S.n,
        u = Math.floor((x - (CX - TAM / 2)) / q),
        v = Math.floor((y - (CY - TAM / 2)) / q);
      return u >= 0 && v >= 0 && u < S.n && v < S.n ? v * S.n + u : -1;
    },
    // el puntero: bajar agarra, mover tira (pasando por cada casilla), subir suelta
    arrastre(S, x, y, fase) {
      if (S.gano) return true;
      const cel = this.celda(S, x, y);
      if (fase === "baja") {
        if (cel >= 0) (S.cur = cel), agarrar(S, cel);
        return true;
      }
      if (fase === "mueve" && cel >= 0 && S.mano >= 0 && cel !== S.cur) {
        if (tirar(S, cel)) S.movs++;
        S.cur = cel;
      }
      if (fase === "sube") soltar(S);
      return true;
    },
    res: (S) => t("mn.hilo_res", [S.movs]),
    dibujar(S, D) {
      const c = D.c,
        n = S.n,
        q = TAM / n,
        x0 = CX - TAM / 2,
        y0 = CY - TAM / 2,
        cen = (cel) => [x0 + (cel % n) * q + q / 2, y0 + Math.floor(cel / n) * q + q / 2];
      // las tres Nornas, a la izquierda, con lo que pide el telar
      D.texto(t("mn.hilo_nornas"), 300, 240, 18, "#E0B2B2", "center", 600);
      ["urd", "verdandi", "skuld"].forEach((k, i) => {
        D.rombo(300, 290 + i * 70, 22, ["#5E130D", "#2A2220", "#3A3634"][i]);
        D.rombo(300, 290 + i * 70, 10, COLS[i]);
        D.texto(t("mn.hilo_" + k), 334, 296 + i * 70, 15, "#F2ECEC", "left", 500);
      });
      const hechos = S.hilos.filter((_, h) => completo(S, h)).length;
      D.texto(t("mn.hilo_cuenta", [hechos, S.pares.length]), 300, 520, 18, "#FFD98A", "center", 700);
      if (S.v.lleno) D.texto(t("mn.hilo_lleno", [S.hilos.reduce((a, p) => a + p.length, 0), n * n]), 300, 550, 15, "#73D5DB", "center", 500);
      // el telar
      D.P([x0 - 14, y0 - 14, x0 + TAM + 14, y0 - 14, x0 + TAM + 14, y0 + TAM + 14, x0 - 14, y0 + TAM + 14], "#2A2220");
      for (let cel = 0; cel < n * n; cel++) {
        const x = x0 + (cel % n) * q,
          y = y0 + Math.floor(cel / n) * q,
          h = dueno(S, cel);
        D.P([x + 2, y + 2, x + q - 2, y + 2, x + q - 2, y + q - 2, x + 2, y + q - 2], ((cel % n) + Math.floor(cel / n)) % 2 ? "#1E1816" : "#221A18");
        if (h >= 0) DIB.alfa(c, 0.18, () => D.P([x + 2, y + 2, x + q - 2, y + 2, x + q - 2, y + q - 2, x + 2, y + q - 2], COLS[h]));
      }
      // los nudos de oro
      S.nudos.forEach((cel) => {
        const [x, y] = cen(cel),
          ok = dueno(S, cel) >= 0;
        D.rombo(x, y, q * 0.18, ok ? "#FFD98A" : "#5E4A2A");
        D.rombo(x, y, q * 0.08, ok ? "#F5A524" : "#2A2220");
      });
      // los hilos: una banda de su color con un brillo fino arriba a la derecha
      c.lineCap = "round";
      c.lineJoin = "round";
      S.hilos.forEach((p, h) => {
        if (p.length < 2) return;
        const tramo = (w, col) => {
          c.strokeStyle = col;
          c.lineWidth = w;
          c.beginPath();
          p.forEach((cel, k) => {
            const [x, y] = cen(cel);
            k ? c.lineTo(x, y) : c.moveTo(x, y);
          });
          c.stroke();
        };
        tramo(q * 0.3, COLS[h]);
        DIB.alfa(c, 0.45, () => {
          c.save();
          c.translate(2, -2);
          tramo(q * 0.08, "#F2ECEC");
          c.restore();
        });
        if (S.luz["h" + h] > 0) DIB.alfa(c, S.luz["h" + h], () => tramo(q * 0.42, COLS[h]));
      });
      // las piedras de cada par
      S.pares.forEach((pr, h) =>
        pr.forEach((cel) => {
          const [x, y] = cen(cel),
            r = q * 0.36;
          D.piedra(x - r, y - r, r * 2, r * 2, "#5A5450", "#3A3634");
          D.runa(RUNAS_HILO[h % RUNAS_HILO.length], x, y, q * 0.28, COLS[h], 0.22);
        })
      );
      // el marco de las flechas
      const [mx, my] = cen(S.cur),
        m = q / 2;
      c.strokeStyle = S.mano >= 0 ? COLS[S.mano] : "#9C2315";
      c.lineWidth = 4;
      c.strokeRect(mx - m + 3, my - m + 3, q - 6, q - 6);
      if (S.luz.todo > 0) D.halo(CX, CY, TAM * 0.55, "#73D5DB", S.luz.todo * 0.4);
    },
  });
  function sonar(f, dur, forma) {
    if (window.SONIDO) SONIDO.tono(forma || "sine", f, f * 1.02, dur, 0.09, {});
  }
})();
