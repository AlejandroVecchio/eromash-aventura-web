// ---------- minijuego: el rastreo con la Lente (MINIJ «rastreo») ----------
// El piso del bosque visto por la Lente: hojas, agujas, piedras y huellas. Solo dentro del círculo de la Lente se ven
// las huellas; las de la bestia que se sigue forman un camino desde el borde y hay que marcarlas en orden. Hay huellas
// de otros bichos que confunden y la siguiente del camino late apenas con luz rúnica cuando la Lente anda cerca. Marcar
// una que no es enfría el rastro; demasiado frío y se pierde. Con el puntero se arrastra la Lente y se toca la huella;
// con el teclado, flechas mueven la Lente y usar marca lo que está en el centro. Variantes: base, señuelos (más huellas
// ajenas y viejas de la misma bestia), lluvia (las huellas se borran: contra el tiempo), noche (la Lente ve menos) y el
// rastro largo. Devuelve { gano, frio }. Lo pide el último rastro de cada contrato de caza (contratos.js).
(function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const X0 = 250,
    Y0 = 170,
    X1 = 1350,
    Y1 = 830; // el piso
  const TOMA = 46; // qué tan cerca del centro hay que marcar
  // la forma de cada huella (en unidades de la huella, mirando hacia +x)
  const FORMAS = {
    lobo: [[0, 0, 9], [12, -8, 4], [14, 0, 4], [12, 8, 4], [6, -12, 3.5]],
    jabali: [[0, -5, 6], [0, 5, 6], [-9, -7, 2.5], [-9, 7, 2.5]],
    draugr: [[0, 0, 11], [14, -6, 3.5], [16, 0, 3.5], [14, 6, 3.5], [-10, 0, 7]],
    cuervo: [[0, 0, 3], [12, -6, 2.5], [14, 0, 2.5], [12, 6, 2.5], [-8, 0, 2.5]],
    fatuo: [[0, 0, 7]],
    trol: [[0, 0, 15], [18, -10, 5], [21, 0, 5], [18, 10, 5]],
    liebre: [[0, -4, 3.5], [0, 4, 3.5], [14, -3, 5], [14, 3, 5]],
    ciervo: [[0, -4, 5], [0, 4, 5]],
  };
  const lente = (S) => (S.v.noche ? 105 : 150);

  function armarCamino(S) {
    const n = S.v.huellas || 9,
      paso = Math.min(110, (X1 - X0 - 160) / n);
    let x = X0 + 40,
      y = Y0 + 120 + S.rnd() * (Y1 - Y0 - 240),
      a = (S.rnd() - 0.5) * 0.6;
    const l = [];
    for (let k = 0; k < n; k++) {
      a += (S.rnd() - 0.5) * 0.9;
      // no salir del piso: si se acerca al borde, dobla
      if (y < Y0 + 90) a = Math.abs(a) * 0.6;
      if (y > Y1 - 90) a = -Math.abs(a) * 0.6;
      a = Math.max(-1.1, Math.min(1.1, a));
      x += Math.cos(a) * paso;
      y += Math.sin(a) * paso;
      l.push({ x, y, a, k, lado: k % 2 ? 1 : -1, nace: 0 });
    }
    return l;
  }
  const lejos = (S, x, y, d) => S.camino.every((h) => Math.hypot(h.x - x, h.y - y) > d) && S.falsas.every((h) => Math.hypot(h.x - x, h.y - y) > d * 0.7);

  MINIJ.registrar("rastreo", {
    variantes: {
      base: { huellas: 8, falsas: 10, fallos: 3 },
      senuelos: { huellas: 9, falsas: 18, viejas: 5, fallos: 3 },
      lluvia: { huellas: 8, falsas: 10, fallos: 3, lluvia: true, tiempo: 45 },
      noche: { huellas: 8, falsas: 12, fallos: 3, noche: true },
      largo: { huellas: 13, falsas: 16, viejas: 3, fallos: 4, tiempo: 80 },
    },
    pie: "mn.rastreo_pie",
    armar(S) {
      S.bestia = FORMAS[S.op.bestia] ? S.op.bestia : "lobo";
      S.camino = armarCamino(S);
      S.falsas = [];
      const otras = Object.keys(FORMAS).filter((f) => f !== S.bestia && f !== "fatuo");
      for (let k = 0, puestas = 0; k < 400 && puestas < (S.v.falsas || 0) + (S.v.viejas || 0); k++) {
        const x = X0 + 40 + S.rnd() * (X1 - X0 - 80),
          y = Y0 + 40 + S.rnd() * (Y1 - Y0 - 80);
        if (!lejos(S, x, y, 70)) continue;
        const vieja = puestas >= (S.v.falsas || 0);
        S.falsas.push({ x, y, a: S.rnd() * Math.PI * 2, forma: vieja ? S.bestia : otras[Math.floor(S.rnd() * otras.length)], vieja });
        puestas++;
      }
      // el piso: hojas, agujas y piedritas (fijas, para dibujarlas sin azar cada cuadro)
      S.hojas = Array.from({ length: 140 }, () => ({ x: X0 + S.rnd() * (X1 - X0), y: Y0 + S.rnd() * (Y1 - Y0), a: S.rnd() * Math.PI * 2, s: 6 + S.rnd() * 10, c: Math.floor(S.rnd() * 4) }));
      S.sig = 0;
      S.frio = 0;
      S.lx = S.camino[0].x - 60;
      S.ly = S.camino[0].y;
      S.gano = 0;
      S.toque = null;
    },
    paso(S, dt) {
      const e = CONTROLES.eje ? CONTROLES.eje() : { x: 0, y: 0 };
      let mx = e.x,
        my = e.y;
      if (CONTROLES.pulsado("izquierda")) mx = -1;
      if (CONTROLES.pulsado("derecha")) mx = 1;
      if (CONTROLES.pulsado("arriba")) my = -1;
      if (CONTROLES.pulsado("abajo")) my = 1;
      S.lx = Math.max(X0, Math.min(X1, S.lx + mx * 420 * dt));
      S.ly = Math.max(Y0, Math.min(Y1, S.ly + my * 420 * dt));
      if (CONTROLES.recien("interactuar") || CONTROLES.recien("atacar")) this.tocar(S, 0);
      S.camino.concat(S.falsas).forEach((h) => h.mal > 0 && (h.mal -= dt));
      if (S.gano && (S.gano -= dt) <= 0) MINIJ.terminar({ gano: true, frio: S.frio });
    },
    // marcar lo que está en el centro de la Lente
    tocar(S, i) {
      if (S.gano || i == null) return;
      const cerca = (h) => Math.hypot(h.x - S.lx, h.y - S.ly) < TOMA;
      const h = S.camino[S.sig];
      if (h && cerca(h)) {
        h.marcada = true;
        S.sig++;
        S.luz["h" + h.k] = 0.6;
        if (window.SONIDO) SONIDO.tono("sine", 520 + S.sig * 30, 540 + S.sig * 30, 0.15, 0.07, {});
        if (S.sig >= S.camino.length) (S.gano = 0.9), (S.luz.todo = 0.9), window.SONIDO && SONIDO.tocar("mision", { vol: 0.4 });
        return;
      }
      const otra = S.falsas.find(cerca) || S.camino.find((q) => !q.marcada && cerca(q));
      if (!otra) return;
      otra.mal = 0.6;
      S.frio++;
      S.luz.frio = 0.5;
      if (window.SONIDO) SONIDO.tono("sawtooth", 160, 120, 0.2, 0.06, {});
      if (S.frio > S.v.fallos) MINIJ.terminar({ gano: false, frio: S.frio });
    },
    hit: () => 0,
    // arrastrar mueve la Lente; un toque sin arrastrar marca ahí
    arrastre(S, x, y, fase) {
      if (fase === "baja") {
        S.toque = { x, y, lx: S.lx, ly: S.ly, movio: false };
        return true;
      }
      if (!S.toque) return;
      if (fase === "mueve") {
        if (Math.hypot(x - S.toque.x, y - S.toque.y) > 14) S.toque.movio = true;
        if (S.toque.movio) (S.lx = Math.max(X0, Math.min(X1, S.toque.lx + x - S.toque.x))), (S.ly = Math.max(Y0, Math.min(Y1, S.toque.ly + y - S.toque.y)));
      } else if (fase === "sube") {
        if (!S.toque.movio) {
          S.lx = x;
          S.ly = y;
          this.tocar(S, 0);
        }
        S.toque = null;
      }
    },
    res: (S) => t("mn.rastreo_res", [S.sig, S.camino.length, S.frio]),
    dibujar(S, D) {
      const c = D.c,
        R = lente(S),
        fuera = S.v.noche ? "#0E0C0B" : "#1E1A16";
      // el piso fuera de la Lente: oscuro, con las hojas apenas
      D.P([X0, Y0, X1, Y0, X1, Y1, X0, Y1], fuera);
      const HOJA = ["#3A2A1E", "#4A2A1E", "#2E3A26", "#3A3634"];
      S.hojas.forEach((h) => DIB.alfa(c, 0.35, () => D.rombo(h.x, h.y, h.s * 0.5, HOJA[h.c])));
      // adentro de la Lente: el piso con luz, las hojas y las huellas
      c.save();
      c.beginPath();
      c.arc(S.lx, S.ly, R, 0, Math.PI * 2);
      c.clip();
      D.P([S.lx - R, S.ly - R, S.lx + R, S.ly - R, S.lx + R, S.ly + R, S.lx - R, S.ly + R], S.v.noche ? "#2A2622" : "#4A3A2A");
      S.hojas.forEach((h) => {
        if (Math.abs(h.x - S.lx) > R + 20 || Math.abs(h.y - S.ly) > R + 20) return;
        D.P([h.x + Math.cos(h.a) * h.s, h.y + Math.sin(h.a) * h.s, h.x + Math.cos(h.a + 2.4) * h.s * 0.4, h.y + Math.sin(h.a + 2.4) * h.s * 0.4, h.x - Math.cos(h.a) * h.s, h.y - Math.sin(h.a) * h.s, h.x + Math.cos(h.a - 2.4) * h.s * 0.4, h.y + Math.sin(h.a - 2.4) * h.s * 0.4], ["#6E4A2A", "#8A5A2A", "#4E6A3A", "#6E6A66"][h.c]);
      });
      const borrar = (h) => (S.v.lluvia && !h.marcada ? Math.max(0.15, 1 - S.t / (S.v.tiempo * 1.1)) : 1);
      S.falsas.forEach((h) => huella(D, h.x, h.y, h.a, h.forma, h.mal > 0 ? "#C8402D" : h.vieja ? "#4A3A2E" : "#2A1E16", (h.vieja ? 0.55 : 0.85) * borrar(h)));
      S.camino.forEach((h, k) => {
        const col = h.marcada ? "#73D5DB" : h.mal > 0 ? "#C8402D" : "#2A1E16";
        huella(D, h.x + Math.cos(h.a + Math.PI / 2) * h.lado * 10, h.y + Math.sin(h.a + Math.PI / 2) * h.lado * 10, h.a, S.bestia, col, 0.9 * borrar(h));
        if (k === S.sig && Math.hypot(h.x - S.lx, h.y - S.ly) < R * 1.6) D.halo(h.x, h.y, 26, "#73D5DB", 0.18 + 0.12 * Math.sin(S.t * 5));
      });
      c.restore();
      // las marcadas se ven siempre (el camino que ya se leyó), unidas con un hilo tenue
      const hechas = S.camino.filter((h) => h.marcada);
      if (hechas.length > 1)
        DIB.alfa(c, 0.4, () => {
          c.strokeStyle = "#73D5DB";
          c.lineWidth = 2;
          c.beginPath();
          hechas.forEach((h, k) => (k ? c.lineTo(h.x, h.y) : c.moveTo(h.x, h.y)));
          c.stroke();
        });
      hechas.forEach((h) => D.rombo(h.x, h.y, 5, "#73D5DB"));
      // el aro de la Lente: bronce con su runa
      c.save();
      c.strokeStyle = S.luz.frio > 0 ? "#C8402D" : "#A8622E";
      c.lineWidth = 10;
      c.beginPath();
      c.arc(S.lx, S.ly, R + 5, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = "#FFD98A";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(S.lx, S.ly, R + 1, -Math.PI * 0.9, -Math.PI * 0.4);
      c.stroke();
      c.restore();
      D.rombo(S.lx, S.ly, 4, "#F2ECEC");
      D.runa("ansuz", S.lx + R * 0.72, S.ly - R * 0.72, 9, "#FFD98A", 0.3);
      if (S.luz.todo > 0) D.halo(S.lx, S.ly, R * 1.3, "#73D5DB", S.luz.todo * 0.35);
      // lo que se sigue y el frío
      D.texto(t("mn.rastreo_bestia_" + S.bestia), 1380, 92, 20, "#F2ECEC", "right", 700);
      D.texto(t("mn.rastreo_cuenta", [S.sig, S.camino.length]), 220, 150, 18, "#73D5DB", "left", 700);
      D.texto(t("mn.rastreo_frio"), 1150, 150, 15, "#E0B2B2", "right", 500);
      for (let k = 0; k <= S.v.fallos; k++) D.rombo(1170 + k * 24, 145, 8, k < S.frio ? "#4A78D0" : "#3A3634");
    },
  });
  function huella(D, x, y, a, forma, col, alfa) {
    const f = FORMAS[forma] || FORMAS.lobo,
      ca = Math.cos(a),
      sa = Math.sin(a);
    DIB.alfa(D.c, alfa, () =>
      f.forEach(([u, v, r]) => {
        const px = x + u * ca - v * sa,
          py = y + u * sa + v * ca;
        D.P([px - r, py - r * 0.8, px + r, py - r * 0.8, px + r * 1.1, py, px + r, py + r * 0.8, px - r, py + r * 0.8, px - r * 1.1, py], col);
      }),
    );
  }
})();
