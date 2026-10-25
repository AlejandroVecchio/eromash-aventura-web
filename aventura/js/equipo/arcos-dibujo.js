// ---------- el dibujo de los arcos (forma "arco" de DIB_ARMAS) ----------
// Mismo lenguaje que las espadas de la arena: polígonos de un color, la mitad de cada pala en sombra, sin contornos.
// El arco mira hacia y negativa (hacia donde sale la flecha), el agarre en el origen y las palas abiertas a los lados
// con las puntas hacia atrás (y positiva). La cuerda se tensa con DIB_ARMAS.tension (0 a 1, la pone ARCO cuando
// Eromash tensa) y con tensión aparece la flecha encajada. Familias: 0 corto de tejo · 1 largo · 2 rúnico ·
// 3 de asta y hueso · 4 recurvo de las estepas (las puntas vuelven hacia adelante).
(function () {
  "use strict";
  const P = (c, pts, col) => DIB.P(c, pts, col);
  // madera por familia: [sombra, base, luz]
  const PALA = [
    ["#5A3A20", "#8A5E36", "#B88A5C"],
    ["#4E3420", "#7A5634", "#A67C52"],
    ["#22262E", "#3A404C", "#5E6878"],
    ["#A89A84", "#D8CCB6", "#F2ECE0"],
    ["#5E130D", "#9C2315", "#C8402D"],
  ];
  const LARGO = [160, 205, 180, 170, 165],
    ORO = "#FFD98A",
    RUNA = "#73D5DB",
    CUERO = "#5E130D";
  const late = () => 0.65 + Math.sin(performance.now() / 260) * 0.35;

  // la línea del medio de una pala: de 0 (agarre) a 1 (punta), lado ±1
  function puntoPala(fam, u, lado, tension) {
    const R = LARGO[fam] * (1 - tension * 0.08);
    let x = lado * R * u,
      y = u * u * 84 + tension * 34 * u * u;
    // el recurvo: el último tramo vuelve hacia adelante
    if (fam === 4 && u > 0.78) {
      const k = (u - 0.78) / 0.22;
      y -= k * k * 60;
      x += lado * k * 8;
    }
    return [x, y];
  }
  function dibujarArco(c, fam, tier) {
    const tension = Math.max(0, Math.min(1, DIB_ARMAS.tension || 0));
    const [s, b, l] = tier === 4 ? ["#2A2226", "#463A3E", "#F5A524"] : PALA[fam];
    const N = 9;
    const puntas = [];
    [-1, 1].forEach((lado) => {
      // la pala en dos mitades: el lomo (luz, adelante) y el vientre (sombra, atrás)
      const lomo = [],
        vientre = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N,
          [x, y] = puntoPala(fam, u, lado, tension),
          w = 26 - u * 15 + (fam === 1 ? 2 : 0);
        lomo.push([x, y - w * 0.5]);
        vientre.push([x, y + w * 0.5]);
        if (i === N) puntas.push([x, y]);
      }
      const centro = lomo.map(([x, y], i) => [x, (y + vientre[i][1]) / 2]);
      P(c, lomo.concat(centro.slice().reverse()).flat(), b);
      P(c, centro.concat(vientre.slice().reverse()).flat(), lado < 0 ? s : PALA[fam][0]);
      // el filo de luz en el lomo (en la legendaria, encendido)
      const borde = lomo.slice(2).flatMap(([x, y]) => [x, y]);
      const bajo = lomo
        .slice(2)
        .reverse()
        .flatMap(([x, y]) => [x, y + 3]);
      if (tier === 4) DIB.alfa(c, late(), () => P(c, borde.concat(bajo), l));
      else DIB.alfa(c, 0.7, () => P(c, borde.concat(bajo), l));
      // anillos de asta en el de hueso
      if (fam === 3)
        for (let i = 2; i < N; i += 2) {
          const [x, y] = puntoPala(fam, i / N, lado, tension);
          P(c, [x - 3, y - 9, x + 3, y - 9, x + 3, y + 9, x - 3, y + 9], s);
        }
      // las puntas (culatines): de oro desde raro
      const [px, py] = puntoPala(fam, 1, lado, tension);
      P(c, [px - 7, py - 6, px + 7, py - 6, px + lado * 4, py + 12], tier >= 2 ? ORO : s);
    });
    // la cuerda: de punta a punta pasando por el culatín de la flecha
    const yCuerda = puntas[0][1] + 4 + tension * 110;
    c.save();
    c.strokeStyle = "#E0B2B2";
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(puntas[0][0], puntas[0][1] + 4);
    c.lineTo(0, yCuerda);
    c.lineTo(puntas[1][0], puntas[1][1] + 4);
    c.stroke();
    c.restore();
    // el agarre: madera más gruesa y, desde el escalón 1, envuelto en cuero
    P(c, [-16, -30, 16, -30, 18, 30, -18, 30], s);
    P(c, [0, -30, 16, -30, 18, 30, 0, 30], b);
    if (tier >= 1) for (let y = -24; y < 26; y += 10) P(c, [-19, y, 19, y + 4, 19, y + 8, -19, y + 4], CUERO);
    if (tier >= 2) P(c, [0, -34, 7, -28, 0, -22, -7, -28], ORO);
    // la runa en la pala
    if (tier >= 3) {
      c.save();
      c.globalAlpha = tier === 4 ? 1 : late();
      const [rx, ry] = puntoPala(fam, 0.5, 1, tension);
      FUTHARK.dibujar(c, fam === 2 ? "ansuz" : "kenaz", rx, ry, 18, tier === 4 ? "#F5A524" : RUNA, 3);
      c.restore();
    }
    // la flecha encajada mientras tensa
    if (tension > 0.02) flecha(c, yCuerda, -70, tier);
  }
  // una flecha de y0 (culatín) a y1 (punta), sobre el eje
  function flecha(c, y0, y1, tier) {
    P(c, [-5, y0, 5, y0, 5, y1, -5, y1], "#B88A5C");
    P(c, [-5, y0, 0, y0, 0, y1, -5, y1], "#7A5634");
    // la punta de hierro
    P(c, [0, y1 - 34, 14, y1 + 2, 0, y1 - 4, -14, y1 + 2], tier === 4 ? "#F5A524" : "#B8BCC4");
    P(c, [0, y1 - 34, 0, y1 - 4, -14, y1 + 2], tier === 4 ? "#C8402D" : "#7E848C");
    // las plumas
    P(c, [-4, y0 - 6, -20, y0, -16, y0 - 34, -4, y0 - 40], "#F2ECEC");
    P(c, [4, y0 - 6, 20, y0, 16, y0 - 34, 4, y0 - 40], "#C8402D");
  }
  DIB_ARMAS.forma("arco", dibujarArco);
  DIB_ARMAS.flecha = flecha;
  DIB_ARMAS.tension = 0;
})();
