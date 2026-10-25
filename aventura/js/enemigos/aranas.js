// ---------- las arañas del bosque viejo (se suman a CRIATURAS) ----------
// Diseños propios con el trazo de la arena: caras planas, la mitad izquierda en sombra, sombra elíptica. Tres vistas
// (S frente, E costado, N espaldas) y tres variantes de color (o.pal): pardo de hojarasca, ceniza y la de las ataduras
// (negra con marcas violetas, como lo que tomó el bosque).
//  · Araña de musgo: del tamaño de un perro, ocho patas quebradas, racimo de ojos rojos y la runa Hagalaz pintada en el
//    abdomen. Se agacha antes de saltar (la carga del aviso).
//  · Tejedora (la reina del nido): el doble de grande, el abdomen hinchado de huevos con hilos colgando y una corona de
//    púas; levanta las patas de adelante y escupe tela donde está Eromash.
(function () {
  "use strict";
  const { P, E, L, sombra, alfa } = DIB;
  const PAL = [
    { cuerpo: "#5A4232", cuerpoS: "#3E2E22", pata: "#4A3628", marca: "#C8402D", ojo: "#FF8D71" }, // hojarasca
    { cuerpo: "#6E6A66", cuerpoS: "#4E4A46", pata: "#56524E", marca: "#F2ECEC", ojo: "#C8402D" }, // ceniza
    { cuerpo: "#2A2228", cuerpoS: "#1A1418", pata: "#241C22", marca: "#9A6BD8", ojo: "#C9A0F0" }, // de las ataduras
  ];
  // una pata quebrada en dos tramos: de la base (bx, by) a la rodilla y al piso; m = paso
  function pata(c, bx, by, kx, ky, px, col, w) {
    L(c, bx, by, kx, ky, col, w);
    L(c, kx, ky, px, 0, col, w * 0.8);
  }
  // ocho patas: cuatro de cada lado, alternando el paso
  function patas(c, s, t, m, col, colS, alza, costado) {
    for (let i = 0; i < 4; i++) {
      const fase = Math.sin(t * 14 + i * 1.6) * 5 * m,
        ab = (i - 1.5) * 9 * s;
      if (costado) {
        // de costado se ven las del lado cercano y las del lejano más oscuras
        pata(c, ab * 0.8, -16 * s, ab * 1.5 + fase, -34 * s, ab * 2 + fase * 1.4, colS, 2.6 * s);
        pata(c, ab, -14 * s, ab * 1.6 - fase, -30 * s - (i === 3 ? alza : 0), ab * 2.2 - fase, col, 3.2 * s);
      } else {
        const ex = (10 + i * 7) * s,
          up = i === 0 ? alza : 0;
        pata(c, -6 * s, -16 * s + ab * 0.2, -ex - 8 * s, -34 * s - i * 2 * s - up, -ex - 18 * s + fase, colS, 3 * s);
        pata(c, 6 * s, -16 * s + ab * 0.2, ex + 8 * s, -34 * s - i * 2 * s - up, ex + 18 * s - fase, col, 3 * s);
      }
    }
  }
  function ojos(c, x, y, s, col) {
    [[-5, 0, 2.6], [5, 0, 2.6], [-9, 3, 1.8], [9, 3, 1.8], [-2.5, -4, 1.6], [2.5, -4, 1.6]].forEach(([a, b, r]) => E(c, x + a * s, y + b * s, r * s, r * s, col));
  }

  function arana(c, t, o) {
    const v = o.vista || "S",
      m = Math.min(1, o.mov || 0),
      pal = PAL[o.pal || 0],
      g = o.golpe || 0,
      ag = g * 6; // se agacha antes de saltar
    sombra(c, 0, 0, 34, 9, 0.42);
    c.save();
    c.translate(0, ag);
    if (v === "E") {
      patas(c, 1, t, m, pal.pata, pal.cuerpoS, 0, true);
      // abdomen atrás y cefalotórax adelante
      P(c, DIB.poli(-14, -26, 18, 14, 9, 0.2), pal.cuerpoS);
      P(c, [-14, -40, -2, -36, 4, -24, -14, -14], pal.cuerpo);
      FUTHARK.dibujar(c, "hagalaz", -18, -22, 10, pal.marca, 1.6);
      P(c, [2, -30, 12, -34, 22, -28, 22, -20, 10, -16, 2, -20], pal.cuerpo);
      P(c, [2, -30, 10, -32, 10, -16, 2, -20], pal.cuerpoS);
      ojos(c, 18, -27, 0.7, pal.ojo);
      // quelíceros
      P(c, [20, -20, 26, -14 - g * 4, 22, -12], "#111111");
    } else {
      const atras = v === "N";
      patas(c, 1, t, m, pal.pata, pal.cuerpoS, 0, false);
      if (atras) {
        P(c, DIB.poli(0, -30, 20, 16, 10, 0.1), pal.cuerpo);
        P(c, [-20, -30, -16, -42, 0, -46, 0, -14, -16, -18], pal.cuerpoS);
        FUTHARK.dibujar(c, "hagalaz", -5, -24, 12, pal.marca, 1.8);
      } else {
        P(c, DIB.poli(0, -34, 18, 12, 10, 0.1), pal.cuerpoS);
        P(c, [-14, -22, -10, -30, 10, -30, 14, -22, 10, -12, -10, -12], pal.cuerpo);
        P(c, [-14, -22, -10, -30, 0, -30, 0, -12, -10, -12], pal.cuerpoS);
        ojos(c, 0, -22, 1, pal.ojo);
        P(c, [-6, -12, -4, -4 - g * 4, -1, -12], "#111111");
        P(c, [6, -12, 4, -4 - g * 4, 1, -12], "#111111");
      }
    }
    c.restore();
  }

  function aranaReina(c, t, o) {
    const v = o.vista || "S",
      m = Math.min(1, o.mov || 0),
      pal = PAL[o.pal || 0],
      g = o.golpe || 0,
      alza = g * 22; // levanta las patas de adelante para escupir
    sombra(c, 0, 0, 62, 15, 0.45);
    const s = 1.8;
    const hilos = (x, y) => {
      for (let k = 0; k < 3; k++) {
        const hx = x + (k - 1) * 14,
          largo = 18 + k * 6 + Math.sin(t * 2 + k) * 3;
        L(c, hx, y, hx + Math.sin(t * 1.5 + k) * 3, y + largo, "rgba(232,228,220,0.7)", 1.2);
      }
    };
    const huevos = (x, y) => [[-10, 0], [6, -4], [-2, 8], [12, 6]].forEach(([a, b]) => E(c, x + a, y + b, 6, 5, "#E8E0D0"));
    if (v === "E") {
      patas(c, s, t, m, pal.pata, pal.cuerpoS, alza, true);
      P(c, DIB.poli(-30, -52, 34, 28, 10, 0.15), pal.cuerpoS);
      P(c, [-30, -80, -6, -72, 4, -48, -30, -26], pal.cuerpo);
      huevos(-34, -54);
      FUTHARK.dibujar(c, "hagalaz", -42, -46, 16, pal.marca, 2.2);
      hilos(-30, -26);
      P(c, [2, -58, 24, -66, 44, -56, 44, -40, 22, -32, 2, -40], pal.cuerpo);
      P(c, [2, -58, 18, -62, 18, -32, 2, -40], pal.cuerpoS);
      // corona de púas
      [[10, -64], [20, -68], [30, -66]].forEach(([a, b]) => P(c, [a - 3, b, a, b - 12, a + 3, b], "#9A6BD8"));
      ojos(c, 38, -52, 1.1, pal.ojo);
      P(c, [40, -40, 50, -30 - g * 8, 42, -28], "#111111");
    } else {
      const atras = v === "N";
      patas(c, s, t, m, pal.pata, pal.cuerpoS, alza, false);
      if (atras) {
        P(c, DIB.poli(0, -58, 38, 30, 12, 0.1), pal.cuerpo);
        P(c, [-38, -58, -30, -82, 0, -88, 0, -28, -30, -34], pal.cuerpoS);
        huevos(-4, -66);
        FUTHARK.dibujar(c, "hagalaz", -8, -48, 18, pal.marca, 2.4);
        hilos(0, -28);
      } else {
        P(c, DIB.poli(0, -70, 36, 24, 12, 0.1), pal.cuerpoS);
        huevos(0, -82);
        P(c, [-26, -44, -20, -60, 20, -60, 26, -44, 20, -24, -20, -24], pal.cuerpo);
        P(c, [-26, -44, -20, -60, 0, -60, 0, -24, -20, -24], pal.cuerpoS);
        [[-14, -60], [0, -64], [14, -60]].forEach(([a, b]) => P(c, [a - 3, b, a, b - 12, a + 3, b], "#9A6BD8"));
        ojos(c, 0, -46, 1.6, pal.ojo);
        P(c, [-10, -24, -8, -12 - g * 8, -3, -24], "#111111");
        P(c, [10, -24, 8, -12 - g * 8, 3, -24], "#111111");
        // la tela que junta para escupir
        if (g > 0.3) alfa(c, g, () => E(c, 0, -18, 6 + g * 6, 4 + g * 4, "#E8E4DC"));
      }
    }
  }

  CRIATURAS.registrar("arana", arana);
  CRIATURAS.registrar("aranaReina", aranaReina);
})();
