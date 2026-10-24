// ---------- el dreki (se suma a CRIATURAS) ----------
// El dragón de las mazmorras del generador: un dreki de escamas en bloques, cuatro patas, alas de cuero con dedos de
// hueso, cuello largo y cuernos hacia atrás. Mientras prepara el golpe levanta la cabeza, abre las alas y la boca se le
// llena de brasa. Tres variantes de color (o.pal): brasa, ceniza y escarcha. Base en (0, 0), vistas S, E y N.
(function () {
  "use strict";
  const { P, E, L, alfa, sombra, halo } = DIB;
  const PAL = [
    { esc: "#9C2315", escS: "#5E130D", escL: "#C8402D", panza: "#E0B2B2", ala: "#5E130D", alaL: "#7A1A10", ojo: "#FFD98A", fuego: "#FF8D71" }, // brasa
    { esc: "#3A3432", escS: "#221E1D", escL: "#55504A", panza: "#8A6A5A", ala: "#2A2422", alaL: "#4A3A34", ojo: "#FF8D71", fuego: "#FF8D71" }, // ceniza
    { esc: "#4A6A8A", escS: "#2C4460", escL: "#6E92B4", panza: "#C8F2F4", ala: "#2C384C", alaL: "#3E5470", ojo: "#C8F2F4", fuego: "#C8F2F4" }, // escarcha
  ];
  const HUESO = "#E8DED6",
    GARRA = "#F2ECEC";

  function ala(c, pal, x, y, abre, lado) {
    // del hombro salen tres dedos de hueso; la membrana va entre ellos
    const d = [
      [x - lado * 60 - abre * lado * 80, y - 130 - abre * 60],
      [x - lado * 140 - abre * lado * 110, y - 90 - abre * 40],
      [x - lado * 170 - abre * lado * 120, y - 10 - abre * 10],
    ];
    P(c, [x, y, d[0][0], d[0][1], d[1][0], d[1][1], d[2][0], d[2][1], x - lado * 40, y + 20], pal.ala);
    P(c, [x, y, d[0][0], d[0][1], d[1][0], d[1][1], x - lado * 30, y + 6], pal.alaL);
    d.forEach(([dx, dy]) => L(c, x, y, dx, dy, pal.escS, 5));
    d.forEach(([dx, dy]) => P(c, [dx - 4, dy, dx + 4, dy, dx, dy - 12], HUESO));
  }
  function dreki(c, t, o) {
    const v = o.vista || "E",
      pal = PAL[o.pal || 0],
      m = o.mov || 0,
      paso = Math.sin(t * 5) * 8 * Math.min(1, m),
      erg = Math.min(1, (o.golpe || 0) * 1.4),
      resp = Math.sin(t * 1.6) * 3,
      aleteo = m > 0.2 ? Math.sin(t * 3) * 0.12 : 0;
    sombra(c, 0, 0, 170, 32, 0.5);
    if (v === "E") {
      // la cola, con púas
      P(c, [-80, -50, -150, -40, -230, -18, -290, -6, -230, -4, -150, -18, -86, -26], pal.escS);
      [[-140, -38], [-190, -26], [-240, -14]].forEach(([x, y]) => P(c, [x - 8, y, x + 8, y, x, y - 18], pal.escL));
      P(c, [-290, -6, -310, -20, -304, 4], HUESO);
      // patas de atrás
      P(c, [-90, -60, -50, -60, -48 + paso * 0.3, 0, -84 + paso * 0.3, 0], pal.escS);
      P(c, [-70, -64, -36, -64, -36 - paso * 0.3, 0, -66 - paso * 0.3, 0], pal.esc);
      [-66, -54, -42].forEach((x) => P(c, [x - paso * 0.3, 0, x + 4 - paso * 0.3, 8, x + 8 - paso * 0.3, 0], GARRA));
      // el ala de atrás
      ala(c, pal, -10, -120 + resp, 0.3 + erg * 0.7 + aleteo, -1);
      // el cuerpo
      P(c, [-110, -60, -96, -116 + resp, -40, -150 + resp, 40, -150 + resp, 90, -118 + resp, 96, -70, 70, -40, -80, -36], pal.esc);
      P(c, [-110, -60, -96, -116 + resp, -50, -140 + resp, -60, -40, -80, -36], pal.escS);
      P(c, [-10, -150 + resp, 40, -150 + resp, 80, -124 + resp, 30, -128 + resp], pal.escL);
      // la panza en placas
      for (let k = 0; k < 6; k++) P(c, [-70 + k * 26, -40, -48 + k * 26, -40, -50 + k * 26, -58, -68 + k * 26, -56], pal.panza);
      // las púas del lomo
      for (let k = 0; k < 6; k++) P(c, [-80 + k * 30, -134 + resp + Math.abs(k - 2.5) * 6, -66 + k * 30, -134 + resp + Math.abs(k - 2.5) * 6, -73 + k * 30, -160 + resp + Math.abs(k - 2.5) * 6], k % 2 ? pal.escL : pal.esc);
      // patas de adelante
      const fp = erg > 0.3 ? -paso : paso;
      P(c, [40, -60, 74, -60, 76 - fp * 0.3, 0, 44 - fp * 0.3, 0], pal.escS);
      P(c, [58, -66, 90, -66, 92 + fp * 0.3, 0, 62 + fp * 0.3, 0], pal.esc);
      [64, 76, 88].forEach((x) => P(c, [x + fp * 0.3, 0, x + 4 + fp * 0.3, 9, x + 8 + fp * 0.3, 0], GARRA));
      // el cuello: se echa atrás y arriba mientras junta el fuego
      const hx = 160 - erg * 40,
        hy = -214 - erg * 30 + resp;
      P(c, [70, -140 + resp, 100, -150 + resp, hx - 6, hy + 24, hx - 30, hy + 30, 92, -100 + resp, 70, -100 + resp], pal.esc);
      P(c, [70, -140 + resp, 84, -146 + resp, hx - 30, hy + 30, 70, -100 + resp], pal.escS);
      for (let k = 0; k < 3; k++) P(c, [96 + k * 16 - erg * 10, -112 - k * 26 + resp, 108 + k * 16 - erg * 10, -112 - k * 26 + resp, 104 + k * 16 - erg * 10, -96 - k * 26 + resp], pal.panza);
      // la cabeza: hocico largo, quijada que se abre, cuernos hacia atrás, ojo de brasa
      const abre = erg * 18;
      P(c, [hx - 34, hy - 6, hx - 10, hy - 26, hx + 30, hy - 24, hx + 64, hy - 10, hx + 66, hy + 2, hx - 30, hy + 10], pal.esc);
      P(c, [hx - 34, hy - 6, hx - 10, hy - 26, hx, hy - 24, hx - 4, hy + 8, hx - 30, hy + 10], pal.escS);
      P(c, [hx - 26, hy + 8, hx + 60, hy + 4 + abre * 0.4, hx + 56, hy + 16 + abre, hx - 20, hy + 20], pal.escS);
      if (erg > 0.2) {
        P(c, [hx - 10, hy + 6, hx + 58, hy + 3, hx + 54, hy + 4 + abre * 0.9, hx - 6, hy + 14], "#5E130D");
        halo(c, hx + 40, hy + 8, 40 + erg * 40, pal.fuego, 0.5 + erg * 0.4);
        P(c, [hx + 20, hy + 6, hx + 58, hy + 4, hx + 50, hy + 4 + abre * 0.7], pal.fuego);
      }
      [hx + 20, hx + 34, hx + 48].forEach((x) => P(c, [x, hy + 4, x + 3, hy + 11, x + 6, hy + 4], GARRA));
      P(c, [hx - 20, hy - 20, hx - 64, hy - 46, hx - 58, hy - 36, hx - 26, hy - 12], HUESO);
      P(c, [hx - 8, hy - 24, hx - 44, hy - 58, hx - 36, hy - 50, hx - 12, hy - 18], "#CFC3AF");
      E(c, hx + 8, hy - 12, 6, 4, pal.ojo);
      alfa(c, 0.5, () => E(c, hx + 8, hy - 12, 11, 8, pal.ojo));
      E(c, hx + 62, hy - 6, 3, 2, "#111111");
      // el ala de adelante
      ala(c, pal, 20, -124 + resp, 0.2 + erg * 0.8 + aleteo, -1);
    } else {
      const atras = v === "N",
        abre = 0.3 + erg * 0.7 + aleteo;
      // las alas abiertas a los dos lados
      ala(c, pal, -50, -130 + resp, abre, 1);
      ala(c, pal, 50, -130 + resp, abre, -1);
      if (atras) {
        // de espaldas: la cola baja hacia nosotros
        P(c, [-30, -60, 30, -60, 22, -10, 10, 30, -10, 30, -22, -10], pal.escS);
        P(c, [0, -60, 30, -60, 22, -10, 10, 30, 0, 30], pal.esc);
      }
      // patas
      P(c, [-80, -60, -44, -60, -46 + paso * 0.2, 0, -82 + paso * 0.2, 0], pal.escS);
      P(c, [44, -60, 80, -60, 82 - paso * 0.2, 0, 46 - paso * 0.2, 0], pal.esc);
      if (!atras) [-74, -62, -50, 50, 62, 74].forEach((x) => P(c, [x - 4, 0, x, 9, x + 4, 0], GARRA));
      // el cuerpo de frente
      P(c, [-96, -56, -100, -120 + resp, -56, -160 + resp, 56, -160 + resp, 100, -120 + resp, 96, -56, 60, -40, -60, -40], pal.esc);
      P(c, [-96, -56, -100, -120 + resp, -56, -160 + resp, 0, -160 + resp, 0, -40, -60, -40], pal.escS);
      if (!atras) {
        for (let k = 0; k < 4; k++) P(c, [-34 + k * 4, -60 - k * 22, 34 - k * 4, -60 - k * 22, 30 - k * 4, -78 - k * 22, -30 + k * 4, -78 - k * 22], pal.panza);
        // el cuello y la cabeza de frente
        const hy = -230 - erg * 24 + resp;
        P(c, [-30, -150 + resp, 30, -150 + resp, 22, hy + 30, -22, hy + 30], pal.esc);
        P(c, [-30, -150 + resp, 0, -150 + resp, 0, hy + 30, -22, hy + 30], pal.escS);
        P(c, [-36, hy + 10, -30, hy - 20, 0, hy - 30, 30, hy - 20, 36, hy + 10, 20, hy + 44, -20, hy + 44], pal.esc);
        P(c, [-36, hy + 10, -30, hy - 20, 0, hy - 30, 0, hy + 44, -20, hy + 44], pal.escS);
        P(c, [-26, hy - 16, -64, hy - 56, -54, hy - 52, -20, hy - 26], HUESO);
        P(c, [26, hy - 16, 64, hy - 56, 54, hy - 52, 20, hy - 26], "#CFC3AF");
        E(c, -16, hy - 4, 6, 5, pal.ojo);
        E(c, 16, hy - 4, 6, 5, pal.ojo);
        alfa(c, 0.5, () => (E(c, -16, hy - 4, 11, 9, pal.ojo), E(c, 16, hy - 4, 11, 9, pal.ojo)));
        if (erg > 0.2) {
          P(c, [-16, hy + 26, 16, hy + 26, 12, hy + 26 + erg * 20, -12, hy + 26 + erg * 20], "#5E130D");
          halo(c, 0, hy + 34, 40 + erg * 40, pal.fuego, 0.5 + erg * 0.4);
        }
      } else {
        for (let k = 0; k < 5; k++) P(c, [-8, -150 + k * 22 + resp, 8, -150 + k * 22 + resp, 0, -172 + k * 22 + resp], pal.escL);
        P(c, [-26, -150 + resp, 26, -150 + resp, 20, -226 + resp, -20, -226 + resp], pal.escS);
        P(c, [-24, -220 + resp, -60, -262 + resp, -50, -258 + resp, -16, -226 + resp], HUESO);
        P(c, [24, -220 + resp, 60, -262 + resp, 50, -258 + resp, 16, -226 + resp], "#CFC3AF");
      }
    }
  }
  CRIATURAS.registrar("dreki", dreki);
})();
