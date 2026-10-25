// ---------- el asiento de Hrímnir (assets de JOTUNN) ----------
//  · asientoJotunn: el trono roto del gigante, tallado en un solo bloque de granito, con escarcha en los bordes y la runa
//    Isa grande en el respaldo.
//  · menhirEscarcha: una de las nueve piedras del anillo, alta y angosta, con hielo al pie y una runa Isa que brilla
//    (o.v cambia el alto y la inclinación).
//  · jotunnFigura: el jötunn mismo (lo pide combate.js por `d.dibujo`), con la pose que le pone el sistema en e.o.
// Caras planas, luz de arriba a la derecha, la mitad izquierda en sombra, sombra elíptica.
(function () {
  "use strict";
  const { P, E, L, sombra, alfa } = DIB;
  const GRANITO = "#7E7A76",
    GRANITO_S = "#5E5A56",
    GRANITO_L = "#9E9A96",
    HIELO = "#C8F2F4",
    HIELO_S = "#8CC8D4";
  const xy = (x, y, s) => (a) => a.map((v, i) => (i % 2 ? y - v * s : x + v * s));
  const late = (t, k) => (window.CALIDAD && CALIDAD.nivel === "baja" ? 0.5 : 0.45 + 0.25 * Math.sin(t * 1.6 + k));

  function asientoJotunn(c, x, y, t, o) {
    const s = o.s || 1,
      q = xy(x, y, s);
    sombra(c, x + 8 * s, y + 6 * s, 150 * s, 30 * s, 0.42);
    // la base y el asiento
    P(c, q([-130, 0, -120, 14, 130, 14, 140, 0, 130, -10, -130, -10]), GRANITO_S);
    P(c, q([-110, 14, -110, 70, 110, 70, 110, 14]), GRANITO);
    P(c, q([-110, 14, -110, 70, -40, 70, -40, 14]), GRANITO_S);
    // el respaldo alto, partido arriba a la izquierda
    P(c, q([-100, 70, -100, 210, -60, 250, -20, 236, 100, 240, 100, 70]), GRANITO);
    P(c, q([-100, 70, -100, 210, -60, 250, -40, 240, -40, 70]), GRANITO_S);
    P(c, q([20, 236, 100, 240, 100, 200, 30, 210]), GRANITO_L);
    // brazos del trono
    P(c, q([-130, 70, -130, 120, -100, 124, -100, 70]), GRANITO_S);
    P(c, q([100, 70, 100, 124, 130, 120, 130, 70]), GRANITO_L);
    // la runa Isa en el respaldo y la escarcha en los bordes
    alfa(c, late(t, 0), () => FUTHARK.dibujar(c, "isa", x - 8 * s, y - 210 * s, 90 * s, HIELO, 7 * s));
    [[-100, 210, 30], [60, 238, 24], [-130, 120, 18], [130, 120, 18]].forEach(([a, b, w]) => P(c, q([a - w / 2, b, a + w / 2, b, a + w / 4, b - 12, a, b - 20, a - w / 4, b - 10]), HIELO));
    P(c, q([-140, 0, 140, 0, 120, -8, -120, -8]), HIELO_S);
  }

  function menhirEscarcha(c, x, y, t, o) {
    const s = (o.s || 1) * (0.9 + ((o.v || 0) % 3) * 0.12),
      inc = (((o.v || 0) % 4) - 1.5) * 4,
      q = xy(x, y, s);
    sombra(c, x + 4 * s, y + 3 * s, 34 * s, 9 * s, 0.38);
    P(c, q([-20, 0, -16 + inc, 150, 0 + inc, 166, 0, 0]), GRANITO_S);
    P(c, q([0, 0, 0 + inc, 166, 16 + inc, 152, 22, 0]), GRANITO);
    P(c, q([8 + inc, 140, 16 + inc, 152, 18, 60, 12, 50]), GRANITO_L);
    alfa(c, late(t, o.v || 0), () => FUTHARK.dibujar(c, "isa", x + (inc * 0.5 - 2) * s, y - 120 * s, 40 * s, HIELO, 4 * s));
    // hielo al pie
    P(c, q([-26, 0, -20, 14, -8, 6, 4, 18, 14, 6, 26, 12, 30, 0]), HIELO_S);
    P(c, q([4, 18, 14, 6, 26, 12, 30, 0, 4, 0]), HIELO);
  }

  function jotunnFigura(c, x, y, t, o) {
    if (o.oculto) return;
    const a = o.muerto > 0 ? Math.max(0, 1 - o.muerto / 1.4) : 1;
    if (a <= 0) return;
    alfa(c, a, () => CRIATURAS.dibujar(c, "jotunn", x, y, t, o));
  }

  Object.assign(ASSETS.LISTA, {
    asientoJotunn: { f: asientoJotunn, figura: true, alto: 250, choque: { w: 260, h: 40 }, grupo: "jotunn" },
    menhirEscarcha: { f: menhirEscarcha, figura: true, alto: 170, choque: { r: 22 }, grupo: "jotunn" },
    jotunnFigura: { f: jotunnFigura, figura: true, alto: 300, grupo: "jotunn", ejemplo: { vista: "S" } },
  });
})();
