// ---------- Hrímnir, el jötunn de la escarcha (se suma a CRIATURAS) ----------
// Un gigante de hielo del doble de alto que un trol: piel gris azulada con grietas de escarcha, barba de carámbanos,
// taparrabos de pieles, brazaletes de piedra y un garrote que es un pino entero envuelto en hielo. Los ojos y las
// runas Isa de los brazos brillan celeste. Tres vistas (S, E, N), base en (0, 0). o.golpe levanta el garrote (aviso),
// o.pose cambia la postura: "sentado" (dormido en su asiento), "pisa" (levanta un pie), "grita" (brazos abiertos) y
// "expuesto" (se agacha agitado, el momento de pegarle). Caras planas, la mitad izquierda en sombra.
(function () {
  "use strict";
  const { P, E, L, sombra, alfa } = DIB;
  const PIEL = "#8EA4B4",
    PIEL_S = "#6A8294",
    PIEL_L = "#B4C8D8",
    HIELO = "#C8F2F4",
    HIELO_S = "#8CC8D4",
    PIEL_ROPA = "#6E5238",
    PIEL_ROPA_S = "#4E3A28",
    PIEDRA = "#6E6A66",
    OJO = "#C8F2F4";

  function garrote(c, x, y, ang, s) {
    c.save();
    c.translate(x, y);
    c.rotate(ang);
    P(c, [-7 * s, 10 * s, -10 * s, -120 * s, 10 * s, -126 * s, 7 * s, 10 * s], "#5A4232");
    P(c, [-7 * s, 10 * s, -10 * s, -120 * s, 0, -124 * s, 0, 10 * s], "#3E2E22");
    // hielo y ramas cortadas
    P(c, [-14 * s, -80 * s, -12 * s, -130 * s, 14 * s, -136 * s, 16 * s, -84 * s], HIELO_S);
    P(c, [0, -82 * s, 2 * s, -134 * s, 14 * s, -136 * s, 16 * s, -84 * s], HIELO);
    [[-12, -100], [14, -110], [-10, -122]].forEach(([a, b]) => P(c, [a * s, b * s, (a + (a > 0 ? 10 : -10)) * s, (b - 6) * s, a * s, (b - 8) * s], HIELO));
    c.restore();
  }
  function cabeza(c, cy, atras, grita, s) {
    P(c, [-24 * s, cy + 24 * s, -26 * s, cy - 10 * s, -14 * s, cy - 30 * s, 14 * s, cy - 30 * s, 26 * s, cy - 10 * s, 24 * s, cy + 24 * s], PIEL);
    P(c, [-24 * s, cy + 24 * s, -26 * s, cy - 10 * s, -14 * s, cy - 30 * s, 0, cy - 30 * s, 0, cy + 24 * s], PIEL_S);
    // pelo de escarcha
    P(c, [-28 * s, cy - 6 * s, -20 * s, cy - 36 * s, 0, cy - 42 * s, 22 * s, cy - 36 * s, 28 * s, cy - 6 * s, 18 * s, cy - 24 * s, -18 * s, cy - 24 * s], HIELO_S);
    if (atras) {
      P(c, [-26 * s, cy - 10 * s, 26 * s, cy - 10 * s, 20 * s, cy + 30 * s, -20 * s, cy + 30 * s], HIELO_S);
      return;
    }
    // la frente pesada, los ojos que brillan y la barba de carámbanos
    P(c, [-20 * s, cy - 8 * s, 20 * s, cy - 8 * s, 18 * s, cy - 2 * s, -18 * s, cy - 2 * s], PIEL_S);
    P(c, [-14 * s, cy - 2 * s, -4 * s, cy - 2 * s, -6 * s, cy + 4 * s, -13 * s, cy + 4 * s], OJO);
    P(c, [4 * s, cy - 2 * s, 14 * s, cy - 2 * s, 13 * s, cy + 4 * s, 6 * s, cy + 4 * s], OJO);
    if (grita) P(c, [-10 * s, cy + 10 * s, 10 * s, cy + 10 * s, 6 * s, cy + 22 * s, -6 * s, cy + 22 * s], "#111111");
    for (let k = -3; k <= 3; k++) P(c, [(k * 7 - 4) * s, cy + 14 * s, (k * 7 + 4) * s, cy + 14 * s, k * 7 * s, cy + (40 + (3 - Math.abs(k)) * 6) * s], k < 0 ? HIELO_S : HIELO);
  }

  function jotunn(c, t, o) {
    const v = o.vista || "S",
      m = Math.min(1, o.mov || 0),
      g = o.golpe || 0,
      pose = o.pose || "",
      s = 1.6,
      paso = Math.sin(t * 4) * 8 * m,
      resp = Math.sin(t * 1.4) * 2;
    sombra(c, 0, 0, 92, 22, 0.5);
    if (pose === "sentado") {
      // dormido en su asiento: las piernas al frente, la cabeza gacha y escarcha encima
      P(c, [-40, -10, -10, -10, -10, -60, -40, -60], PIEL_S);
      P(c, [10, -10, 40, -10, 40, -60, 10, -60], PIEL);
      P(c, [-46, -56, 46, -56, 50, -100, -50, -100], PIEL_ROPA);
      P(c, [-46, -56, 0, -56, 0, -100, -50, -100], PIEL_ROPA_S);
      P(c, [-52, -96, 52, -96, 48, -190 + resp, -48, -190 + resp], PIEL);
      P(c, [-52, -96, 0, -96, 0, -190 + resp, -48, -190 + resp], PIEL_S);
      cabeza(c, -196 + resp + 14, false, false, 1.4);
      garrote(c, 64, -10, -0.5, 1.2);
      alfa(c, 0.6, () => [[-30, -186], [20, -180], [-6, -150]].forEach(([a, b]) => E(c, a, b + resp, 8, 3, HIELO)));
      return;
    }
    const agacha = pose === "expuesto" ? 18 : 0,
      Y = (y) => y + agacha * (y < -60 ? 1 : 0) - (y < -60 ? resp : 0);
    const pie = pose === "pisa" ? 30 * g : 0;
    if (v === "E") {
      P(c, [-26, Y(-90), -6, Y(-90), -2 - paso, 0, -22 - paso, 0], PIEL_S);
      P(c, [-10, Y(-90), 10, Y(-90), 14 + paso, -pie, -6 + paso, -pie], PIEL);
      P(c, [-30, Y(-80), -28, Y(-120), 28, Y(-122), 30, Y(-80)], PIEL_ROPA);
      P(c, [-34, Y(-116), -30, Y(-210), 26, Y(-214), 32, Y(-116)], PIEL_S);
      P(c, [0, Y(-214), 26, Y(-214), 32, Y(-116), 4, Y(-116)], PIEL);
      FUTHARK.dibujar(c, "isa", 10, Y(-170), 26, HIELO, 3);
      garrote(c, 30, Y(-150), 0.4 - g * 2.2, s);
      P(c, [18, Y(-200), 40, Y(-196), 40, Y(-140), 22, Y(-140)], PIEL);
      cabeza(c, Y(-236), false, pose === "grita", 1.3);
    } else {
      const atras = v === "N",
        brazos = pose === "grita" ? 1 : 0;
      P(c, [-38, Y(-90), -12, Y(-90), -12 + paso * 0.3, -pie, -38 + paso * 0.3, -pie], PIEL_S);
      P(c, [12, Y(-90), 38, Y(-90), 38 - paso * 0.3, 0, 12 - paso * 0.3, 0], PIEL);
      P(c, [-44, -6, -10, -6, -10, 0, -44, 0].map((q, i) => (i % 2 ? q - pie : q)), "#3A3634");
      P(c, [10, -6, 44, -6, 44, 0, 10, 0], "#3A3634");
      P(c, [-46, Y(-80), -44, Y(-124), 44, Y(-124), 46, Y(-80)], PIEL_ROPA);
      P(c, [-46, Y(-80), -44, Y(-124), 0, Y(-124), 0, Y(-80)], PIEL_ROPA_S);
      P(c, [-56, Y(-118), -50, Y(-214), 50, Y(-214), 56, Y(-118)], PIEL);
      P(c, [-56, Y(-118), -50, Y(-214), 0, Y(-214), 0, Y(-118)], PIEL_S);
      if (!atras) {
        // grietas de escarcha y el cinto de piedra
        L(c, -30, Y(-200), -16, Y(-150), HIELO_S, 2);
        L(c, 20, Y(-190), 32, Y(-140), HIELO, 2);
        P(c, [-46, Y(-118), 46, Y(-118), 46, Y(-108), -46, Y(-108)], PIEDRA);
      }
      // brazos con brazaletes y la runa Isa
      const bi = brazos ? -0.9 : 0.1,
        bd = brazos ? 0.9 : -0.1;
      [[-1, bi, PIEL_S], [1, bd, PIEL]].forEach(([lado, ang, col]) => {
        c.save();
        c.translate(lado * 56, Y(-206));
        c.rotate(ang + (lado > 0 && !brazos ? -g * 0.6 : 0));
        P(c, [-12, 0, 12, 0, 10 * lado + 2, 96, -10 * lado - 2, 96].map((q, i) => (i % 2 ? q : q * lado)), col);
        P(c, [-13, 60, 13, 60, 12, 72, -12, 72], PIEDRA);
        FUTHARK.dibujar(c, "isa", -4, 28, 20, HIELO, 2.4);
        c.restore();
      });
      if (!atras) garrote(c, 70, Y(-120), -0.2 - g * 2.4, s);
      else garrote(c, -60, Y(-120), 0.3, s);
      cabeza(c, Y(-238), atras, pose === "grita", 1.3);
      if (pose === "expuesto") alfa(c, 0.7, () => [0, 1, 2].forEach((k) => FUTHARK.dibujar(c, "isa", -30 + k * 26 + Math.sin(t * 6 + k) * 4, Y(-300) - k * 4, 14, HIELO, 2)));
    }
  }

  CRIATURAS.registrar("jotunn", jotunn);
})();
