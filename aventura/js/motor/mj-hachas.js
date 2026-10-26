// ---------- minijuego: hachas al blanco (MINIJ «hachas») ----------
// El campo de la Guardia de Eikholt: una diana de paja con sus anillos y el ojo de Odín en el centro. Cada tiro son
// dos golpes de la tecla de usar (o atacar, o tocar): el primero fija la puntería de lado a lado (la marca va y viene),
// el segundo la altura; el hacha sale girando y se clava. Anillos: ojo 10, rojo 6, claro 4, borde 2, afuera nada.
// Variantes: base, viento (una ráfaga corre el hacha: hay que apuntar al costado), diana móvil (cuelga de una soga y
// se mueve: hay que adelantarse), lejos (la diana se ve más chica) y el duelo (contra Hrafn, de la Guardia: hay que
// sumar más que él). Devuelve { gano, puntos, rival }. Lo pide la diana del campo de la Guardia (ciudad/juego.js).
(function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const CX = 800,
    CY = 400,
    RT = 170, // el radio de la diana
    VUELO = 0.45; // lo que tarda el hacha en llegar
  const ANILLOS = [
    [0.13, 10, "#FFD98A"],
    [0.36, 6, "#C8402D"],
    [0.62, 4, "#E0B2B2"],
    [1, 2, "#A8622E"],
  ];
  const radio = (S) => RT * (S.v.chico || 1);
  // dónde está la diana en el instante tt (la móvil cuelga de una soga y va y viene)
  const dianaX = (S, tt) => CX + (S.v.movil ? Math.sin(tt * 0.9) * 230 : 0);
  // la marca que va y viene: de lado (fase apunta) y de alto (fase alza)
  const barrido = (S, f) => Math.sin(S.tb * f) * radio(S) * 1.3;
  function puntos(S, dx, dy) {
    const d = Math.hypot(dx, dy) / radio(S);
    for (const [r, p] of ANILLOS) if (d <= r) return p;
    return 0;
  }
  function tiro(S) {
    S.fase = "apunta";
    S.tb = S.rnd() * 6;
    S.viento = S.v.viento ? (S.rnd() * 2 - 1) * 0.9 : 0;
  }

  MINIJ.registrar("hachas", {
    variantes: {
      base: { tiros: 5, meta: 26 },
      viento: { tiros: 5, meta: 24, viento: true },
      movil: { tiros: 5, meta: 22, movil: true },
      lejos: { tiros: 5, meta: 22, chico: 0.68 },
      duelo: { tiros: 5, duelo: true },
    },
    pie: "mn.hachas_pie",
    armar(S) {
      S.n = 0;
      S.puntos = 0;
      S.rival = 0;
      S.clavadas = []; // { dx, dy, p, rival } relativo a la diana
      S.marcador = [];
      S.gano = 0;
      tiro(S);
    },
    paso(S, dt) {
      if (CONTROLES.recien("interactuar") || CONTROLES.recien("atacar")) this.tocar(S, 0);
      S.tb += dt;
      if (S.gano) {
        if ((S.gano -= dt) <= 0) MINIJ.terminar({ gano: S.final, puntos: S.puntos, rival: S.rival });
        return;
      }
      if (S.fase === "vuela" && (S.vuelo += dt) >= VUELO) {
        // se clava donde quedó la diana en ese instante; la ráfaga lo corre de costado
        const dx = S.ax + S.viento * radio(S) * 0.45 - (dianaX(S, S.t) - CX),
          dy = S.ay,
          p = puntos(S, dx, dy);
        S.puntos += p;
        S.ultimo = { p, v: 1 };
        S.marcador.push(p);
        if (p > 0) S.clavadas.push({ dx, dy, p, g: S.rnd() * 0.6 - 0.3 });
        if (window.SONIDO) SONIDO.tocar(p ? "golpe" : "tela", { vol: 0.5, tono: p >= 10 ? 1.3 : 1 });
        if (p >= 10) S.luz.ojo = 0.7;
        S.fase = "clava";
        S.espera = 0.8;
        // el turno de Hrafn en el duelo: tira bien, pero no siempre
        if (S.v.duelo) {
          const r = S.rnd(),
            pr = r < 0.18 ? 10 : r < 0.6 ? 6 : r < 0.88 ? 4 : 2,
            a = S.rnd() * Math.PI * 2,
            d = { 10: 0.06, 6: 0.25, 4: 0.5, 2: 0.8 }[pr] * radio(S);
          S.rival += pr;
          S.clavadas.push({ dx: Math.cos(a) * d, dy: Math.sin(a) * d, p: pr, rival: true, g: S.rnd() * 0.6 - 0.3 });
        }
      } else if (S.fase === "clava" && (S.espera -= dt) <= 0) {
        S.n++;
        S.ultimo = null;
        if (S.n >= S.v.tiros) {
          S.final = S.v.duelo ? S.puntos > S.rival : S.puntos >= S.v.meta;
          S.gano = 1;
          if (S.final) S.luz.todo = 1;
          return;
        }
        tiro(S);
      }
    },
    tocar(S, i) {
      if (S.gano || i == null) return;
      if (S.fase === "apunta") {
        S.ax = barrido(S, 2.4);
        S.fase = "alza";
        S.tb = S.rnd() * 6;
        if (window.SONIDO) SONIDO.tono("triangle", 440, 440, 0.05, 0.05, {});
      } else if (S.fase === "alza") {
        S.ay = barrido(S, 2.9);
        S.fase = "vuela";
        S.vuelo = 0;
        if (window.SONIDO) SONIDO.tocar("tajo", { vol: 0.4 });
      }
    },
    hit: () => 0,
    res: (S) => (S.v.duelo ? t("mn.hachas_res_duelo", [S.puntos, S.rival]) : t("mn.hachas_res", [S.puntos, S.v.meta])),
    dibujar(S, D) {
      const c = D.c,
        R = radio(S),
        dx0 = dianaX(S, S.t),
        cx = dx0;
      // el campo: la empalizada del fondo y la soga de la diana móvil
      D.P([180, 600, 1420, 600, 1420, 870, 180, 870], "#2A2220");
      for (let k = 0; k < 16; k++) D.P([200 + k * 76, 600, 262 + k * 76, 600, 262 + k * 76, 560 - (k % 3) * 8, 231 + k * 76, 540 - (k % 3) * 8, 200 + k * 76, 560 - (k % 3) * 8], k % 2 ? "#5E130D" : "#4A2A1E");
      if (S.v.movil) D.P([200, CY - R - 40, 1400, CY - R - 40, 1400, CY - R - 36, 200, CY - R - 36], "#A8622E");
      // el caballete y la diana (cada anillo un polígono, sin degradados; la mitad izquierda en sombra)
      D.P([cx - R * 0.5, CY + R * 0.7, cx - R * 0.4, CY + R * 0.7, cx - R * 0.1, 610, cx - R * 0.2, 610], "#4A2A1E");
      D.P([cx + R * 0.4, CY + R * 0.7, cx + R * 0.5, CY + R * 0.7, cx + R * 0.2, 610, cx + R * 0.1, 610], "#5E3A26");
      for (let k = ANILLOS.length - 1; k >= 0; k--) {
        const r = ANILLOS[k][0] * R,
          pts = [];
        for (let q = 0; q < 28; q++) pts.push(cx + Math.cos((q / 28) * Math.PI * 2) * r, CY + Math.sin((q / 28) * Math.PI * 2) * r);
        D.P(pts, ANILLOS[k][2]);
        DIB.alfa(c, 0.18, () => D.P(pts.map((p, j) => (j % 2 === 0 && p > cx ? cx : p)), "#111111"));
      }
      D.runa("ansuz", cx, CY, R * 0.08, "#5E130D", 0.3);
      if (S.luz.ojo > 0) D.halo(cx, CY, R * 0.5, "#FFD98A", S.luz.ojo);
      // las hachas clavadas (las de Hrafn con el mango claro)
      S.clavadas.forEach((h) => hacha(D, cx + h.dx, CY + h.dy, -0.6 + h.g, h.rival ? "#E0B2B2" : "#A8622E", 1));
      // la puntería: la marca de lado y la de alto
      if (S.fase === "apunta" || S.fase === "alza") {
        const ax = S.fase === "apunta" ? barrido(S, 2.4) : S.ax,
          ay = S.fase === "alza" ? barrido(S, 2.9) : null;
        DIB.alfa(c, 0.8, () => D.P([CX + ax - 2, CY - R * 1.4, CX + ax + 2, CY - R * 1.4, CX + ax + 2, CY + R * 1.4, CX + ax - 2, CY + R * 1.4], "#73D5DB"));
        if (ay != null) DIB.alfa(c, 0.8, () => D.P([CX - R * 1.4, CY + ay - 2, CX + R * 1.4, CY + ay - 2, CX + R * 1.4, CY + ay + 2, CX - R * 1.4, CY + ay + 2], "#73D5DB"));
        D.rombo(CX + ax, CY + (ay != null ? ay : 0), 9, "#73D5DB");
      }
      // el hacha en vuelo, girando
      if (S.fase === "vuela") {
        const f = S.vuelo / VUELO,
          tx = CX + S.ax + S.viento * R * 0.45 * f,
          ty = CY + S.ay;
        hacha(D, 800 + (tx - 800) * f, 860 + (ty - 860) * f - Math.sin(f * Math.PI) * 120, f * Math.PI * 5, "#A8622E", 1 + (1 - f) * 0.6);
      }
      // el viento
      if (S.v.viento && S.fase !== "clava") {
        D.texto(t("mn.hachas_viento"), 1380, 200, 16, "#E0B2B2", "right", 500);
        const l = S.viento * 90;
        D.P([1300, 226, 1300 + l, 226, 1300 + l, 232, 1300, 232], "#C8F2F4");
        D.rombo(1300 + l, 229, 8, "#C8F2F4");
      }
      if (S.ultimo) D.texto(S.ultimo.p ? "+" + S.ultimo.p : t("mn.hachas_afuera"), CX, CY - R - 60, 40, S.ultimo.p >= 10 ? "#FFD98A" : S.ultimo.p ? "#F2ECEC" : "#FF8D71", "center", 800);
      // el marcador
      D.texto(t("mn.hachas_tiro", [Math.min(S.n + 1, S.v.tiros), S.v.tiros]), 1380, 92, 22, "#F2ECEC", "right");
      D.texto(t("mn.hachas_puntos", [S.puntos]), 300, 260, 26, "#FFD98A", "center", 800);
      D.texto(S.v.duelo ? t("mn.hachas_hrafn", [S.rival]) : t("mn.hachas_meta", [S.v.meta]), 300, 296, 17, "#E0B2B2", "center", 500);
      S.marcador.forEach((p, k) => D.texto(String(p), 240 + k * 30, 340, 18, p >= 10 ? "#FFD98A" : p ? "#F2ECEC" : "#C8402D", "center", 700));
      if (S.luz.todo > 0) D.halo(cx, CY, R * 1.2, "#FFD98A", S.luz.todo * 0.35);
    },
  });
  // un hacha de mano: mango de madera y la hoja de hierro (cara clara a la derecha)
  function hacha(D, x, y, ang, mango, s) {
    const c = D.c;
    c.save();
    c.translate(x, y);
    c.rotate(ang);
    c.scale(s, s);
    D.P([-4, 0, 4, 0, 4, 70, -4, 70], mango);
    D.P([-4, -6, 22, -18, 26, 6, -4, 10], "#8A8480");
    D.P([10, -11, 22, -18, 26, 6, 10, 4], "#C8C2BE");
    c.restore();
  }
})();
