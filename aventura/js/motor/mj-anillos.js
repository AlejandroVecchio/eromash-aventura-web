// ---------- minijuego: la cerradura de anillos (MINIJ «anillos») ----------
// Los cofres sellados de Eldervald cierran con anillos de piedra concéntricos, cada uno con ocho runas talladas. Arriba
// está la ranura: hay que girar los anillos hasta que en la ranura se lea la palabra del cerrojo (la que muestra la
// tapa). Flechas arriba y abajo eligen el anillo, izquierda y derecha lo giran; con el puntero se toca el lado del
// anillo hacia donde girarlo. Variantes: tres anillos, cuatro, ligados (las ataduras violeta hacen que girar uno mueva
// el de afuera para el otro lado), contra el tiempo y la gran cerradura (cinco ligados con reloj). Siempre tiene
// solución: se arma resuelta y se desordena con las mismas reglas. Lo usan los cofres (secretos.js, zonas.js).
(function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const N = 8, // runas por anillo
    CX = 800,
    CY = 506,
    R0 = 64, // el centro
    ANCHO = 52,
    PASO = 58;
  const NOMBRES = () => Object.keys((window.JUEGOS_RUNAS && JUEGOS_RUNAS.RUNAS) || {});
  const radio = (k) => R0 + (k + 1) * PASO;

  // girar el anillo k (y el de afuera al revés si están ligados)
  function girar(S, k, dir, mostrar) {
    S.giro[k] = (S.giro[k] + dir + N) % N;
    if (mostrar) S.vis[k] += dir;
    if (S.v.ligados && k + 1 < S.n) {
      S.giro[k + 1] = (S.giro[k + 1] - dir + N) % N;
      if (mostrar) S.vis[k + 1] -= dir;
    }
  }
  const alineado = (S, k) => S.giro[k] === S.meta[k];
  const resuelto = (S) => S.giro.every((g, k) => g === S.meta[k]);

  MINIJ.registrar("anillos", {
    variantes: {
      base: { anillos: 3 },
      cuatro: { anillos: 4 },
      ligados: { anillos: 4, ligados: true },
      reloj: { anillos: 4, tiempo: 50 },
      gran: { anillos: 5, ligados: true, tiempo: 110 },
    },
    pie: "mn.anillos_pie",
    armar(S) {
      const n = S.v.anillos || 3,
        todas = NOMBRES();
      S.n = n;
      S.runas = [];
      S.meta = [];
      for (let k = 0; k < n; k++) {
        const r = todas.slice().sort(() => S.rnd() - 0.5).slice(0, N);
        S.runas.push(r);
        S.meta.push(Math.floor(S.rnd() * N));
      }
      // resuelta y desordenada con las mismas reglas (así siempre se puede)
      S.giro = S.meta.slice();
      const movs = 6 + n * 4;
      for (let i = 0; i < movs || resuelto(S); i++) girar(S, Math.floor(S.rnd() * n), S.rnd() < 0.5 ? -1 : 1, false);
      S.vis = S.giro.slice(); // lo que se ve (gira suave hacia giro)
      S.ang = S.giro.slice();
      S.movs = 0;
      S.cur = n - 1;
      S.gano = 0;
    },
    paso(S, dt) {
      if (CONTROLES.recien("arriba")) S.cur = Math.min(S.n - 1, S.cur + 1);
      if (CONTROLES.recien("abajo")) S.cur = Math.max(0, S.cur - 1);
      if (CONTROLES.recien("izquierda")) this.tocar(S, S.cur * 2);
      if (CONTROLES.recien("derecha")) this.tocar(S, S.cur * 2 + 1);
      for (let k = 0; k < S.n; k++) S.ang[k] += (S.vis[k] - S.ang[k]) * Math.min(1, dt * 14);
      if (S.gano && (S.gano -= dt) <= 0) MINIJ.terminar({ gano: true, movs: S.movs });
    },
    // i = anillo × 2 + (1 si gira a la derecha)
    tocar(S, i) {
      if (S.gano || i == null || i < 0) return;
      const k = i >> 1,
        dir = i & 1 ? 1 : -1;
      if (k >= S.n) return;
      S.cur = k;
      const antes = S.giro.map((g, q) => g === S.meta[q]);
      girar(S, k, dir, true);
      S.movs++;
      MINIJ_SONAR(330 + k * 55, 0.08, "triangle");
      for (let q = 0; q < S.n; q++) if (!antes[q] && alineado(S, q)) (S.luz["a" + q] = 0.6), MINIJ_SONAR(660 + q * 80, 0.25);
      if (resuelto(S)) S.gano = 0.7;
    },
    // el anillo por la distancia al centro; el lado de la pantalla dice para dónde gira
    hit(S, x, y) {
      const d = Math.hypot(x - CX, y - CY);
      for (let k = 0; k < S.n; k++) if (d > radio(k) - ANCHO && d <= radio(k)) return k * 2 + (x >= CX ? 1 : 0);
      return null;
    },
    // la pista de Loki: el primer anillo desalineado (de adentro hacia afuera) queda en su lugar, por el lado más corto
    pista(S) {
      if (S.gano) return false;
      const k = S.giro.findIndex((g, q) => g !== S.meta[q]);
      if (k < 0) return false;
      const d = (S.meta[k] - S.giro[k] + N) % N,
        dir = d <= N / 2 ? 1 : -1;
      for (let n = 0; n < N && S.giro[k] !== S.meta[k]; n++) girar(S, k, dir, true);
      S.cur = k;
      S.luz["a" + k] = 0.9;
      if (resuelto(S)) S.gano = 0.7;
      return true;
    },
    res: (S) => t("mn.anillos_res", [S.movs]),
    dibujar(S, D) {
      const c = D.c,
        lado = (a) => Math.cos(a); // la luz de la derecha: las caras de la derecha más claras
      // la palabra del cerrojo, en la tapa de la izquierda (de arriba abajo: del anillo de afuera al de adentro)
      D.texto(t("mn.anillos_palabra"), 300, 250, 16, "#E0B2B2", "center", 500);
      for (let k = S.n - 1, f = 0; k >= 0; k--, f++) {
        const y = 280 + f * 66;
        D.piedra(274, y, 52, 56, alineado(S, k) ? "#3A4A4C" : "#4A4442", alineado(S, k) ? "#2A3638" : "#3A3634");
        D.runa(S.runas[k][S.meta[k]], 300, y + 28, 18, alineado(S, k) ? "#73D5DB" : "#FFD98A", 0.22);
        if (k === S.cur) D.rombo(254, y + 28, 7, "#9C2315");
      }
      // los anillos, del de afuera al de adentro
      for (let k = S.n - 1; k >= 0; k--) {
        const R = radio(k),
          r = R - ANCHO,
          sel = k === S.cur,
          brillo = S.luz["a" + k] > 0;
        for (let s = 0; s < N; s++) {
          // la runa s queda arriba cuando giro = s: el ángulo de cada casilla corre con lo que se ve
          // (al revés de las agujas: así «derecha» gira el anillo hacia la derecha y trae la runa de la izquierda)
          const am = -Math.PI / 2 - ((s - S.ang[k]) / N) * Math.PI * 2,
            a0 = am - Math.PI / N,
            a1 = am + Math.PI / N,
            l = lado(am);
          const cara = sel ? (l > 0 ? "#6E6A66" : "#56524E") : l > 0.3 ? "#5A5450" : l > -0.3 ? "#4A4442" : "#3A3634";
          const g = 0.02;
          D.P([CX + Math.cos(a0 + g) * R, CY + Math.sin(a0 + g) * R, CX + Math.cos(a1 - g) * R, CY + Math.sin(a1 - g) * R, CX + Math.cos(a1 - g) * r, CY + Math.sin(a1 - g) * r, CX + Math.cos(a0 + g) * r, CY + Math.sin(a0 + g) * r], cara);
          const enRanura = s === S.giro[k] && Math.abs(S.vis[k] - S.ang[k]) < 0.1,
            ok = enRanura && alineado(S, k);
          const rm = (R + r) / 2;
          D.runa(S.runas[k][s], CX + Math.cos(am) * rm, CY + Math.sin(am) * rm, 14, ok ? "#73D5DB" : enRanura ? "#FFD98A" : "#2A2220", 0.24);
        }
        // las ataduras violeta entre un anillo y el de afuera
        if (S.v.ligados && k + 1 < S.n) for (let q = 0; q < 3; q++) D.rombo(CX - R - 3, CY - 18 + q * 18, 6, "#9A6BD8");
        if (brillo) D.halo(CX, CY - (R + r) / 2, 38, "#73D5DB", S.luz["a" + k]);
      }
      // el centro y la ranura de arriba
      const hub = [];
      for (let s = 0; s < 8; s++) hub.push(CX + Math.cos((s / 8) * Math.PI * 2 + Math.PI / 8) * (R0 - 6), CY + Math.sin((s / 8) * Math.PI * 2 + Math.PI / 8) * (R0 - 6));
      D.P(hub, "#2A2220");
      D.rombo(CX, CY, 22, resuelto(S) ? "#73D5DB" : "#9C2315");
      const top = CY - radio(S.n - 1) - 8;
      DIB.alfa(c, 0.9, () => {
        D.P([CX - 34, top, CX - 28, top, CX - 28, CY - R0 + 6, CX - 34, CY - R0 + 6], "#FFD98A");
        D.P([CX + 28, top, CX + 34, top, CX + 34, CY - R0 + 6, CX + 28, CY - R0 + 6], "#FFD98A");
      });
      D.texto(t("mn.anillos_movs", [S.movs]), 1380, 92, 22, "#F2ECEC", "right");
    },
  });
  // el tono de MINIJ, sin depender de cuándo cargó
  function MINIJ_SONAR(f, dur, forma) {
    if (window.SONIDO) SONIDO.tono(forma || "sine", f, f * 1.02, dur, 0.09, {});
  }
})();
