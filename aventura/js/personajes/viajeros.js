// ---------- los forasteros del Hongo Dorado (fichas y dibujos propios de GENTE) ----------
// La hospedería junta a la gente de Eikholt con la de todo el mundo que recorre las tierras: Ingunn (la mujer de Ulf, que
// cocina y sirve), un dvergr de las montañas de hierro, una álfr del sur, un medio jötunn que se sienta en el piso, el
// nisse que vive en las vigas, tres aventureros como Eromash (Hallgerd, Odd y Signy) y parroquianos de otras aldeas. Las
// criaturas tienen su propio dibujo (GENTE.PROPIOS) con las mismas reglas de siempre: caras planas, la mitad izquierda
// en sombra y tres vistas (frente, costado y espaldas; el oeste es el costado espejado). Los aventureros son fichas
// comunes con lo que llevan encima (escudo, arco, báculo) pintado antes o después del cuerpo según la vista.
(function () {
  "use strict";
  const { P, E, R, L, halo, alfa } = DIB;
  const G = GENTE;

  Object.assign(G.FICHAS, {
    // Ingunn, la mujer de Ulf: rodete rubio canoso, delantal blanco, mangas arremangadas
    ingunn: { nombre: "ingunn", alto: 0.96, ancho: 1.05, piel: "#E0B898", pielSombra: "#C0987A", pelo: "#D8C08A", ropa: "#7A3A2A", ropaSombra: "#5E2C20", delantal: "#E0D4C0", delantalSombra: "#C0B4A0", falda: true, pantalon: "#3A3026", botas: "#2A2018", cinto: "#5E4430", rodete: true },
    // Hallgerd de Brunvik, espadachina: trenza roja, cota gris, capa azul gastada, escudo redondo a la espalda
    hallgerd: { nombre: "hallgerd", alto: 1.02, ancho: 1.02, piel: "#E0B898", pielSombra: "#C0987A", pelo: "#B4542A", ropa: "#6E6A64", ropaSombra: "#56524E", capa: "#3E4E66", capaSombra: "#2C384C", pantalon: "#3A3228", botas: "#241C16", cinto: "#7A5634", trenza: true, escudo: ["#9C2315", "#F2ECEC"], espada: true },
    // Odd, arquero de Hrafngard: capucha verde, cuero, arco y aljaba a la espalda
    odd: { nombre: "odd", alto: 1.04, ancho: 0.92, piel: "#D0A080", pielSombra: "#AE8064", pelo: "#5A3A2A", barba: "#5A3A2A", ropa: "#5E4A36", ropaSombra: "#46362A", capa: "#3E5A34", capaSombra: "#2C4226", pantalon: "#3A3026", botas: "#2A2018", cinto: "#3A2A1A", gorro: "#3E5A34", arco: true },
    // Signy, runista errante: pelo negro con una mecha rúnica, túnica azul noche, báculo con la runa Ansuz que brilla
    signy: { nombre: "signy", alto: 1, ancho: 0.9, piel: "#C89A7A", pielSombra: "#A87C60", pelo: "#1E1814", mecha: "#73D5DB", ropa: "#2C3A5A", ropaSombra: "#1E2840", falda: true, pantalon: "#1E2840", botas: "#1A1410", cinto: "#C8B48C", baculo: true },
    // los parroquianos de otras aldeas
    hg_pescador: { nombre: "hg_pescador", alto: 0.98, ancho: 1.08, piel: "#D0A080", pielSombra: "#AE8064", pelo: "#8A8070", barba: "#8A8070", ropa: "#4A6A7A", ropaSombra: "#3A5462", pantalon: "#3A4A56", botas: "#2A2A30", cinto: "#C8C0B0", gorro: "#C8C0B0" },
    hg_lenadora: { nombre: "hg_lenadora", alto: 1, ancho: 1.08, piel: "#E0AC8A", pielSombra: "#C08C6C", pelo: "#6A3A20", ropa: "#7A2A1E", ropaSombra: "#5E1E14", pantalon: "#45392E", botas: "#2E241C", cinto: "#3A2A1A", trenza: true, hacha: true },
    hg_minero: { nombre: "hg_minero", alto: 0.94, ancho: 1.16, piel: "#B8A090", pielSombra: "#988070", pelo: "#3A3632", barba: "#4E4A46", ropa: "#5E5A56", ropaSombra: "#46423E", pantalon: "#3A3632", botas: "#241C16", cinto: "#7A5634", gorro: "#46423E" },
    hg_cazador: { nombre: "hg_cazador", alto: 1.02, ancho: 1, piel: "#C8987A", pielSombra: "#A87A5E", pelo: "#3A2A1E", barba: "#3A2A1E", ropa: "#6A5A4A", ropaSombra: "#52463A", capa: "#8A7A6A", capaSombra: "#6A5A4A", pantalon: "#3A3026", botas: "#2A2018", cinto: "#3A2A1A", lanza: true },
    hg_isleno: { nombre: "hg_isleno", alto: 1, ancho: 0.98, piel: "#C09070", pielSombra: "#A07456", pelo: "#1E2A3A", mecha: "#4A78D0", ropa: "#3A5A6A", ropaSombra: "#2C4652", pantalon: "#3A4A56", botas: "#2A2A30", cinto: "#E0D4C0", trenza: true },
    hg_mercader: { nombre: "hg_mercader", alto: 1.02, ancho: 1.12, piel: "#E0C0A8", pielSombra: "#C0A088", pelo: "#C8A050", barba: "#C8A050", ropa: "#5E2C20", ropaSombra: "#4A2018", capa: "#9C2315", capaSombra: "#5E130D", pantalon: "#2A2A30", botas: "#1A1410", cinto: "#FFD98A", calvo: true },
    // las criaturas: la ficha queda para el nombre y el ancho de la sombra (el dibujo es propio)
    fjalar: { nombre: "fjalar", alto: 0.72, ancho: 1.2 },
    lysa: { nombre: "lysa", alto: 1.14, ancho: 0.86 },
    bergr: { nombre: "bergr", alto: 1.6, ancho: 1.75 },
    nisse: { nombre: "nisse", alto: 0.42, ancho: 0.5 },
  });

  // ---------- lo que llevan encima los aventureros ----------
  // atras: el escudo, el arco y la aljaba (de frente asoman detrás del cuerpo, de espaldas van encima)
  function aLaEspalda(c, f, v, a) {
    const Y = (n) => -n * a;
    if (f.escudo) {
      const x = v === "E" ? -12 : 0,
        r = v === "E" ? 7 : 19;
      E(c, x, Y(48), r, 19, f.escudo[0]);
      if (v !== "E") {
        P(c, [x - 19, Y(48), x + 19, Y(48), x, Y(67)], f.escudo[1]);
        P(c, [x - 19, Y(48), x, Y(48), x, Y(29)], VOL.mezcla(f.escudo[0], "#000000", 0.3));
        E(c, x, Y(48), 4, 4, "#B8BCC0");
      } else E(c, x - 2, Y(48), 3, 15, VOL.mezcla(f.escudo[0], "#000000", 0.3));
    }
    if (f.arco) {
      const x = v === "E" ? -11 : 6;
      c.beginPath();
      c.moveTo(x - 12, Y(76));
      c.quadraticCurveTo(x + 10, Y(50), x - 12, Y(16));
      c.strokeStyle = "#6B4A2C";
      c.lineWidth = 3;
      c.stroke();
      L(c, x - 12, Y(76), x - 12, Y(16), "#E0D4C0", 0.8);
      // la aljaba con las plumas rojas
      const q = v === "E" ? -7 : -8;
      P(c, [q - 4, Y(72), q + 4, Y(72), q + 5, Y(40), q - 3, Y(40)], "#5E4430");
      [-3, 0, 3].forEach((d) => P(c, [q + d - 1.5, Y(72), q + d + 1.5, Y(72), q + d, Y(80)], "#C8402D"));
    }
  }
  // en la mano: el báculo de Signy (con la runa que respira) y la espada de Hallgerd en la cintura
  function enLaMano(c, f, v, a, t) {
    const Y = (n) => -n * a;
    if (f.baculo) {
      const x = v === "E" ? 10 : v === "N" ? -22 : 22;
      L(c, x, Y(0) - 2, x, Y(104), "#4A3420", 3);
      P(c, [x - 5, Y(104), x + 5, Y(104), x + 3, Y(112), x - 3, Y(112)], "#2C3A5A");
      const pulso = 0.5 + 0.5 * Math.sin(t * 1.6);
      halo(c, x, Y(108), 26, "#73D5DB", 0.25 + pulso * 0.25);
      E(c, x, Y(108), 4, 4, "#C8F2F4");
      if (window.FUTHARK) alfa(c, 0.6 + pulso * 0.4, () => FUTHARK.dibujar(c, "ansuz", x, Y(99), 9, "#73D5DB", 1.4));
    }
    if (f.espada && v !== "N") {
      const x = v === "E" ? -4 : -15;
      L(c, x, Y(32), x - (v === "E" ? 10 : 4), Y(4), "#8A8E92", 2.5);
      R(c, x - 4, Y(34), 8, 2, "#C9A45A");
    }
  }
  ["hallgerd", "odd", "signy"].forEach((id) => {
    G.PROPIOS[id] = (c, t, o) => {
      const f = G.FICHAS[id],
        v = o.vista || "S",
        base = v[0] === "N" ? "N" : v === "E" ? "E" : "S";
      if (base !== "N") aLaEspalda(c, f, base, f.alto);
      if (base === "N") enLaMano(c, f, base, f.alto, t);
      G.VISTAS[v](c, f, t, o);
      if (base === "N") aLaEspalda(c, f, base, f.alto);
      else enLaMano(c, f, base, f.alto, t);
    };
  });

  // ---------- Fjalar, el dvergr de las montañas de hierro ----------
  // Bajo y ancho como un tocón, la barba trenzada en tres con anillos de oro que le llega a las rodillas, el gorro de
  // cuero con el aro de hierro, el chaleco de cuero sobre la camisa de lana y el pico a la espalda.
  const DV = { piel: "#D0A080", pielS: "#AE8064", barba: "#C8702A", barbaS: "#9A5420", oro: "#FFD98A", oroS: "#C9A45A", gorro: "#5E4430", gorroS: "#46321E", hierro: "#8A8E92", ropa: "#5E5A56", ropaS: "#46423E", cuero: "#7A5634", cueroS: "#5A3E22", bota: "#241C16", mango: "#6B4A2C" };
  function fjalar(c, t, o) {
    const v = o.vista || "S",
      bob = o.camina ? Math.abs(Math.sin(t * 10)) * 1.4 : Math.sin(t * 1.5) * 0.5,
      Y = (n) => -n - bob,
      pico = (x, ad) => {
        L(c, x, Y(8), x + ad * 4, Y(66), DV.mango, 3);
        P(c, [x + ad * 4 - 16, Y(64), x + ad * 4 + 16, Y(70), x + ad * 4 + 16, Y(66), x + ad * 4 - 14, Y(60)], DV.hierro);
      };
    if (v[0] === "N") {
      P(c, [-14, -6, -3, -6, -3, 0, -15, 0], DV.bota);
      P(c, [3, -6, 14, -6, 15, 0, 3, 0], DV.bota);
      P(c, [-21, Y(42), 21, Y(42), 22, Y(6), -22, Y(6)], DV.ropaS);
      P(c, [0, Y(42), 21, Y(42), 22, Y(6), 0, Y(6)], DV.ropa);
      R(c, -22, Y(18), 44, 4, DV.cuero);
      pico(-6, 1);
      const cy = Y(54);
      P(c, [-12, cy + 8, -12, cy - 6, -6, cy - 12, 6, cy - 12, 12, cy - 6, 12, cy + 8], DV.barbaS);
      P(c, [-13, cy - 2, -11, cy - 11, 0, cy - 15, 11, cy - 11, 13, cy - 2], DV.gorro);
      R(c, -13, cy - 3, 26, 3, DV.hierro);
      return;
    }
    if (v === "E") {
      pico(-14, -1);
      P(c, [-8, -6, 6, -6, 9, 0, -8, 0], DV.bota);
      P(c, [-14, Y(42), 12, Y(42), 14, Y(6), -16, Y(6)], DV.ropa);
      P(c, [-14, Y(42), -5, Y(42), -6, Y(6), -16, Y(6)], DV.ropaS);
      P(c, [-4, Y(40), 13, Y(40), 14, Y(12), -2, Y(12)], DV.cuero);
      R(c, -16, Y(18), 30, 4, DV.cueroS);
      E(c, 12, Y(22), 4, 4, DV.piel);
      const cy = Y(54);
      P(c, [-9, cy - 8, 8, cy - 8, 11, cy, 8, cy + 4, -6, cy + 8, -9, cy + 4], DV.piel);
      P(c, [-9, cy - 8, -3, cy - 8, -3, cy + 8, -9, cy + 4], DV.pielS);
      // la barba de costado: cae hacia adelante hasta las rodillas
      P(c, [0, cy + 2, 11, cy + 2, 14, Y(14), 8, Y(8), 4, Y(20)], DV.barba);
      [Y(36), Y(24)].forEach((y) => R(c, 7, y, 7, 3, DV.oro));
      R(c, 5, cy - 2, 3, 2, "#1A1412");
      P(c, [-11, cy - 3, -9, cy - 12, 2, cy - 15, 10, cy - 10, 10, cy - 4], DV.gorro);
      R(c, -11, cy - 4, 22, 3, DV.hierro);
      return;
    }
    // de frente
    pico(-18, 1);
    P(c, [-14, -6, -3, -6, -3, 0, -15, 0], DV.bota);
    P(c, [3, -6, 14, -6, 15, 0, 3, 0], DV.bota);
    P(c, [-21, Y(42), 21, Y(42), 22, Y(6), -22, Y(6)], DV.ropa);
    P(c, [-21, Y(42), 0, Y(42), 0, Y(6), -22, Y(6)], DV.ropaS);
    P(c, [-15, Y(40), 15, Y(40), 16, Y(12), -16, Y(12)], DV.cuero);
    P(c, [-15, Y(40), 0, Y(40), 0, Y(12), -16, Y(12)], DV.cueroS);
    R(c, -22, Y(18), 44, 4, DV.cueroS);
    R(c, -4, Y(19), 8, 6, DV.oroS);
    // los brazos gruesos
    P(c, [-21, Y(40), -29, Y(36), -30, Y(16), -22, Y(16)], DV.ropaS);
    P(c, [21, Y(40), 29, Y(36), 30, Y(16), 22, Y(16)], DV.ropa);
    E(c, -26, Y(14), 5, 5, DV.pielS);
    E(c, 26, Y(14), 5, 5, DV.piel);
    const cy = Y(54);
    P(c, [-11, cy - 8, 11, cy - 8, 11, cy + 4, -11, cy + 4], DV.piel);
    P(c, [-11, cy - 8, 0, cy - 8, 0, cy + 4, -11, cy + 4], DV.pielS);
    // la nariz grande y las cejas espesas
    P(c, [-3, cy - 4, 3, cy - 4, 4, cy + 4, -4, cy + 4], DV.pielS);
    R(c, -9, cy - 6, 7, 2.5, DV.barbaS);
    R(c, 2, cy - 6, 7, 2.5, DV.barbaS);
    R(c, -7, cy - 2, 3, 2, "#1A1412");
    R(c, 4, cy - 2, 3, 2, "#1A1412");
    // la barba en tres trenzas con anillos de oro
    P(c, [-13, cy + 2, 13, cy + 2, 12, Y(34), -12, Y(34)], DV.barba);
    P(c, [-13, cy + 2, 0, cy + 2, 0, Y(34), -12, Y(34)], DV.barbaS);
    [-8, 0, 8].forEach((x, i) => {
      P(c, [x - 3.5, Y(34), x + 3.5, Y(34), x + 2.5, Y(8 + i * 3), x - 2.5, Y(8 + i * 3)], i === 0 ? DV.barbaS : DV.barba);
      R(c, x - 4, Y(26), 8, 3, DV.oro);
      R(c, x - 3.5, Y(16 + i * 3), 7, 2.5, DV.oroS);
    });
    if (o.hablando && Math.sin(t * 6) > 0) R(c, -3, cy + 4, 6, 2, "#3A1E16");
    // el gorro de cuero con el aro de hierro
    P(c, [-13, cy - 4, -11, cy - 13, 0, cy - 17, 11, cy - 13, 13, cy - 4], DV.gorro);
    P(c, [-13, cy - 4, -11, cy - 13, 0, cy - 17, 0, cy - 4], DV.gorroS);
    R(c, -14, cy - 5, 28, 3, DV.hierro);
  }

  // ---------- Lysa, álfr del sur ----------
  // Alta y fina, piel casi blanca, pelo largo color trigo claro, las orejas en punta, el manto pálido con borde de oro y
  // las marcas rúnicas en la mejilla y los brazos que respiran con la luz de siempre.
  const AL = { piel: "#F2E4DA", pielS: "#D8C4B8", pelo: "#F2DFA8", peloS: "#D0B878", ropa: "#C8D4C0", ropaS: "#A0B098", oro: "#FFD98A", runa: "#73D5DB", runaC: "#C8F2F4", bota: "#5E4A36" };
  function lysa(c, t, o) {
    const v = o.vista || "S",
      bob = o.camina ? Math.abs(Math.sin(t * 8)) * 1.2 : Math.sin(t * 1.2) * 0.8,
      Y = (n) => -n * 1.14 - bob,
      pulso = 0.5 + 0.5 * Math.sin(t * 1.3);
    if (window.CALIDAD ? CALIDAD.nivel !== "baja" : true) halo(c, 0, Y(60), 60, AL.runa, 0.08 + pulso * 0.06);
    if (v[0] === "N") {
      P(c, [-14, Y(66), 14, Y(66), 18, 0, -18, 0], AL.ropaS);
      P(c, [0, Y(66), 14, Y(66), 18, 0, 0, 0], AL.ropa);
      R(c, -18, -4, 36, 4, AL.oro);
      const cy = Y(80);
      P(c, [-11, cy - 6, -9, cy - 12, 9, cy - 12, 11, cy - 6, 13, Y(30), 0, Y(26), -13, Y(30)], AL.peloS);
      P(c, [0, cy - 12, 9, cy - 12, 11, cy - 6, 13, Y(30), 0, Y(26)], AL.pelo);
      P(c, [-10, cy - 2, -15, cy - 10, -9, cy - 6], AL.pielS);
      P(c, [10, cy - 2, 15, cy - 10, 9, cy - 6], AL.piel);
      return;
    }
    if (v === "E") {
      P(c, [-6, -5, 6, -5, 8, 0, -5, 0], AL.bota);
      P(c, [-10, Y(66), 8, Y(66), 12, 0, -14, 0], AL.ropa);
      P(c, [-10, Y(66), -3, Y(66), -4, 0, -14, 0], AL.ropaS);
      R(c, -14, -4, 26, 4, AL.oro);
      P(c, [-2, Y(62), 6, Y(62), 10, Y(36), 2, Y(34)], AL.ropaS);
      E(c, 8, Y(33), 2.6, 2.6, AL.piel);
      alfa(c, 0.5 + pulso * 0.5, () => L(c, 4, Y(46), 7, Y(38), AL.runa, 1.4));
      const cy = Y(80);
      P(c, [-7, cy - 8, 7, cy - 8, 9, cy + 2, 7, cy + 4, 5, cy + 10, -4, cy + 10, -7, cy + 6], AL.piel);
      P(c, [-7, cy - 8, -2, cy - 8, -2, cy + 10, -4, cy + 10, -7, cy + 6], AL.pielS);
      P(c, [-11, cy + 6, -10, cy - 9, -3, cy - 13, 6, cy - 12, 8, cy - 6, 0, cy - 6, -3, cy + 2, -10, Y(34)], AL.pelo);
      P(c, [-4, cy - 2, -10, cy - 14, -2, cy - 6], AL.piel);
      R(c, 3, cy - 1, 3, 1.6, "#2A3A3A");
      alfa(c, 0.5 + pulso * 0.5, () => R(c, 2, cy + 3, 4, 1.2, AL.runa));
      return;
    }
    P(c, [-9, -5, -2, -5, -2, 0, -10, 0], AL.bota);
    P(c, [2, -5, 9, -5, 10, 0, 2, 0], AL.bota);
    const cy = Y(80);
    // el pelo largo, a los dos lados
    P(c, [-12, cy, -9, cy, -11, Y(24), -16, Y(26)], AL.peloS);
    P(c, [12, cy, 9, cy, 11, Y(24), 16, Y(26)], AL.pelo);
    P(c, [-13, Y(66), 13, Y(66), 18, 0, -18, 0], AL.ropa);
    P(c, [-13, Y(66), 0, Y(66), 0, 0, -18, 0], AL.ropaS);
    R(c, -18, -4, 36, 4, AL.oro);
    L(c, 0, Y(64), 0, Y(4), AL.oro, 1.2);
    P(c, [-13, Y(62), -18, Y(58), -21, Y(34), -14, Y(36)], AL.ropaS);
    P(c, [13, Y(62), 18, Y(58), 21, Y(34), 14, Y(36)], AL.ropa);
    E(c, -18, Y(33), 2.6, 2.6, AL.pielS);
    E(c, 18, Y(33), 2.6, 2.6, AL.piel);
    alfa(c, 0.5 + pulso * 0.5, () => {
      L(c, 16, Y(52), 19, Y(42), AL.runa, 1.4);
      L(c, -16, Y(52), -19, Y(42), AL.runa, 1.4);
    });
    R(c, -2.5, Y(70), 5, 5, AL.pielS);
    P(c, [-8, cy - 8, 8, cy - 8, 8, cy + 6, 3, cy + 11, -3, cy + 11, -8, cy + 6], AL.piel);
    P(c, [-8, cy - 8, 0, cy - 8, 0, cy + 11, -3, cy + 11, -8, cy + 6], AL.pielS);
    // las orejas en punta
    P(c, [-8, cy - 1, -15, cy - 10, -8, cy - 5], AL.pielS);
    P(c, [8, cy - 1, 15, cy - 10, 8, cy - 5], AL.piel);
    P(c, [-10, cy + 2, -10, cy - 8, -5, cy - 13, 5, cy - 13, 10, cy - 8, 10, cy + 2, 6, cy - 5, -6, cy - 5], AL.pelo);
    R(c, -5, cy - 1, 3, 1.6, "#2A3A3A");
    R(c, 2, cy - 1, 3, 1.6, "#2A3A3A");
    alfa(c, 0.5 + pulso * 0.5, () => {
      R(c, 4, cy + 3, 4, 1.2, AL.runa);
      R(c, 5.5, cy + 1.5, 1.2, 4, AL.runa);
    });
    if (o.hablando && Math.sin(t * 6) > 0) R(c, -1.5, cy + 6, 3, 1.4, "#8A4A3A");
    // la diadema de oro con la piedra rúnica
    L(c, -9, cy - 7, 9, cy - 7, AL.oro, 1.6);
    E(c, 0, cy - 8, 2, 2, AL.runaC);
  }

  // ---------- Bergr, medio jötunn ----------
  // Enorme, la piel gris azulada de su madre de la escarcha, la barba blanca trenzada con escarcha, el manto de pieles,
  // los brazales de hierro y los ojos chicos y buenos. Casi siempre sentado en el piso.
  const JO = { piel: "#8A9AA6", pielS: "#6A7A86", barba: "#E8ECEC", barbaS: "#B8C4C8", piel2: "#8A6A4A", piel2S: "#6A4E34", ropa: "#4E5A64", ropaS: "#3A444C", hierro: "#6E6A6E", bota: "#2A2420", escarcha: "#C8F2F4" };
  function bergr(c, t, o) {
    const v = o.vista || "S",
      bob = o.camina ? Math.abs(Math.sin(t * 6)) * 2.5 : Math.sin(t * 1) * 1,
      Y = (n) => -n * 1.6 - bob,
      W = 1.75;
    if (v[0] === "N") {
      P(c, [-12 * W, -8, -2 * W, -8, -2 * W, 0, -13 * W, 0], JO.bota);
      P(c, [2 * W, -8, 12 * W, -8, 13 * W, 0, 2 * W, 0], JO.bota);
      P(c, [-16 * W, Y(64), 16 * W, Y(64), 17 * W, Y(20), -17 * W, Y(20)], JO.ropaS);
      P(c, [-19 * W, Y(66), 19 * W, Y(66), 21 * W, Y(26), 0, Y(22), -21 * W, Y(26)], JO.piel2S);
      P(c, [0, Y(66), 19 * W, Y(66), 21 * W, Y(26), 0, Y(22)], JO.piel2);
      const cy = Y(78);
      P(c, [-11, cy + 8, -11, cy - 8, -5, cy - 13, 5, cy - 13, 11, cy - 8, 11, cy + 8], JO.barbaS);
      P(c, [-3, cy + 8, 3, cy + 8, 2, Y(50), -2, Y(50)], JO.barba);
      return;
    }
    if (v === "E") {
      P(c, [-6 * W, -8, 7 * W, -8, 9 * W, 0, -6 * W, 0], JO.bota);
      P(c, [-12 * W, Y(64), 10 * W, Y(64), 11 * W, Y(20), -13 * W, Y(20)], JO.ropa);
      P(c, [-13 * W, Y(66), -2 * W, Y(66), -3 * W, Y(22), -15 * W, Y(26)], JO.piel2S);
      R(c, -12 * W, Y(32), 22 * W, 4, JO.hierro);
      P(c, [2 * W, Y(60), 9 * W, Y(58), 12 * W, Y(34), 5 * W, Y(32)], JO.pielS);
      R(c, 7 * W, Y(40), 6 * W, 5, JO.hierro);
      E(c, 10 * W, Y(31), 6, 6, JO.piel);
      const cy = Y(78);
      P(c, [-9, cy - 8, 8, cy - 8, 11, cy, 8, cy + 4, 6, cy + 11, -4, cy + 11, -9, cy + 6], JO.piel);
      P(c, [-9, cy - 8, -3, cy - 8, -3, cy + 11, -9, cy + 6], JO.pielS);
      P(c, [-2, cy + 3, 10, cy + 3, 11, Y(54), 4, Y(48), -2, cy + 12], JO.barba);
      P(c, [-10, cy + 2, -10, cy - 8, -3, cy - 12, 6, cy - 11, 8, cy - 7, -2, cy - 6, -5, cy + 2], JO.barbaS);
      R(c, 4, cy - 1, 3, 2, "#1A1412");
      return;
    }
    P(c, [-12 * W, -8, -2 * W, -8, -2 * W, 0, -13 * W, 0], JO.bota);
    P(c, [2 * W, -8, 12 * W, -8, 13 * W, 0, 2 * W, 0], JO.bota);
    P(c, [-9 * W, Y(30), -2 * W, Y(30), -3 * W, -7, -10 * W, -7], JO.ropaS);
    P(c, [2 * W, Y(30), 9 * W, Y(30), 10 * W, -7, 3 * W, -7], JO.ropa);
    P(c, [-15 * W, Y(64), 15 * W, Y(64), 17 * W, Y(24), -17 * W, Y(24)], JO.ropa);
    P(c, [-15 * W, Y(64), 0, Y(64), 0, Y(24), -17 * W, Y(24)], JO.ropaS);
    R(c, -17 * W, Y(32), 34 * W, 5, JO.hierro);
    // el manto de pieles en los hombros
    P(c, [-20 * W, Y(66), 20 * W, Y(66), 18 * W, Y(54), -18 * W, Y(54)], JO.piel2);
    P(c, [-20 * W, Y(66), 0, Y(66), 0, Y(54), -18 * W, Y(54)], JO.piel2S);
    P(c, [-15 * W, Y(62), -22 * W, Y(58), -23 * W, Y(34), -16 * W, Y(34)], JO.pielS);
    P(c, [15 * W, Y(62), 22 * W, Y(58), 23 * W, Y(34), 16 * W, Y(34)], JO.piel);
    R(c, -23 * W, Y(42), 7 * W, 6, JO.hierro);
    R(c, 16 * W, Y(42), 7 * W, 6, JO.hierro);
    E(c, -19.5 * W, Y(31), 7, 7, JO.pielS);
    E(c, 19.5 * W, Y(31), 7, 7, JO.piel);
    const cy = Y(78);
    P(c, [-10, cy - 9, 10, cy - 9, 10, cy + 6, 5, cy + 11, -5, cy + 11, -10, cy + 6], JO.piel);
    P(c, [-10, cy - 9, 0, cy - 9, 0, cy + 11, -5, cy + 11, -10, cy + 6], JO.pielS);
    // la frente ancha, los ojos chicos y la barba de escarcha
    R(c, -10, cy - 9, 20, 4, JO.pielS);
    R(c, -6, cy - 2, 2.5, 2, "#1A1412");
    R(c, 4, cy - 2, 2.5, 2, "#1A1412");
    P(c, [-11, cy + 2, 11, cy + 2, 10, Y(56), 3, Y(48), -3, Y(48), -10, Y(56)], JO.barba);
    P(c, [-11, cy + 2, 0, cy + 2, 0, Y(48), -3, Y(48), -10, Y(56)], JO.barbaS);
    R(c, -1.5, Y(54), 3, 3, JO.escarcha);
    P(c, [-10, cy - 6, -9, cy - 12, 9, cy - 12, 10, cy - 6, 6, cy - 9, -6, cy - 9], JO.barbaS);
    if (o.hablando && Math.sin(t * 6) > 0) R(c, -3, cy + 5, 6, 2, "#3A2A2A");
  }

  // ---------- el nisse de la casa ----------
  // Chiquito como un gato parado, el gorro rojo larguísimo que se le dobla, la barba gris, la túnica de lana y los zuecos.
  const NI = { piel: "#E0B898", pielS: "#C0987A", gorro: "#C8402D", gorroS: "#9C2315", barba: "#C8C4BC", barbaS: "#A8A49C", ropa: "#6E6A64", ropaS: "#56524E", zueco: "#7A5634" };
  function nisse(c, t, o) {
    const v = o.vista || "S",
      bob = Math.sin(t * 2.2) * 0.6,
      Y = (n) => -n * 0.42 - bob,
      punta = Math.sin(t * 1.7) * 3;
    const sx = v === "E" ? -1 : 1;
    P(c, [-7, -4, -1, -4, -1, 0, -8, 0], NI.zueco);
    P(c, [1, -4, 7, -4, 8, 0, 1, 0], NI.zueco);
    P(c, [-9, Y(62), 9, Y(62), 11, -3, -11, -3], v[0] === "N" ? NI.ropaS : NI.ropa);
    P(c, [-9, Y(62), 0, Y(62), 0, -3, -11, -3], NI.ropaS);
    const cy = Y(76);
    if (v[0] !== "N") {
      P(c, [-6, cy - 4, 6, cy - 4, 6, cy + 4, -6, cy + 4], NI.piel);
      E(c, v === "E" ? 6 : 0, cy + 2, 2, 1.6, "#E0B2B2");
      P(c, [-7, cy + 2, 7, cy + 2, 4, cy + 16, 0, cy + 20, -4, cy + 16], NI.barba);
      P(c, [-7, cy + 2, 0, cy + 2, 0, cy + 20, -4, cy + 16], NI.barbaS);
      if (v !== "E") {
        R(c, -4, cy - 1, 2, 1.6, "#1A1412");
        R(c, 2, cy - 1, 2, 1.6, "#1A1412");
      } else R(c, 3, cy - 1, 2, 1.6, "#1A1412");
    } else P(c, [-7, cy + 2, 7, cy + 2, 6, cy + 10, -6, cy + 10], NI.barbaS);
    // el gorro: un cono largo que se dobla hacia atrás
    P(c, [-8, cy - 3, 8, cy - 3, 3, cy - 22, -6 * sx + punta, cy - 30, -4 * sx, cy - 20], NI.gorro);
    P(c, [-8, cy - 3, 0, cy - 3, -2 * sx, cy - 20, -6 * sx + punta, cy - 30, -4 * sx, cy - 20], NI.gorroS);
    E(c, -6 * sx + punta, cy - 30, 2.4, 2.4, "#F2ECEC");
  }

  Object.assign(G.PROPIOS, { fjalar, lysa, bergr, nisse });
})();
