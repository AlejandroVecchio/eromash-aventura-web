// ---------- la gente de Eldervald (módulo GENTE) ----------
// Eydis, Orm, Svanhild y la cuadrilla, dibujados como los NPC de la arena (la Norna, el Sacerdote): cuerpo entero,
// caras planas, la mitad izquierda en sombra, sombra elíptica en el piso. Cada uno en tres vistas: frente (S),
// costado (E; el oeste es el mismo espejado) y espaldas (N). Miden unos 84 de alto, como el vikingo de la arena.
// Uso: GENTE.dibujar(ctx, id, x, y, t, { vista, espejo, hablando, camina }) con los pies en (x, y).
window.GENTE = (function () {
  "use strict";
  const { P, E, R, L, sombra } = DIB;

  // Ficha de cada persona: colores, proporciones y lo que la distingue.
  const FICHAS = {
    // los espíritus tienen su propio dibujo (PROPIOS); la ficha queda para el nombre y el ancho de la sombra
    huldra: { nombre: "huldra", alto: 1.06, ancho: 0.9 },
    nokk: { nombre: "nokk", alto: 1, ancho: 0.95 },
    // Eydis, guardasendas: trenza oscura con una mecha blanca, capa verde gastada, lanza corta y tablillas de rutas.
    eydis: {
      nombre: "eydis",
      alto: 1,
      ancho: 1,
      piel: "#C89A7A",
      pielSombra: "#A87C60",
      pelo: "#2A1E18",
      mecha: "#E8E4DC",
      ropa: "#5E4A36",
      ropaSombra: "#46362A",
      capa: "#3E5A34",
      capaSombra: "#2C4226",
      pantalon: "#3A3026",
      botas: "#2A2018",
      cinto: "#7A5634",
      trenza: true,
      lanza: true,
      tablillas: true,
    },
    // Orm, carpintero: corpulento, barba rojiza entrecana, delantal de cuero, hacha de trabajo.
    orm: {
      nombre: "orm",
      alto: 1,
      ancho: 1.22,
      piel: "#D0A080",
      pielSombra: "#AE8064",
      pelo: "#9A5A3A",
      barba: "#A86848",
      barbaCana: "#C8B8A8",
      ropa: "#6A5A4A",
      ropaSombra: "#52463A",
      delantal: "#7A5030",
      delantalSombra: "#5E3C22",
      pantalon: "#45392E",
      botas: "#2E241C",
      cinto: "#3A2A1A",
      hacha: true,
      calvo: true,
    },
    // Svanhild, custodia de la Casa de las Lindes: alta, mayor, pelo plateado recogido, lana azul gris, lentes al cuello.
    svanhild: {
      nombre: "svanhild",
      alto: 1.08,
      ancho: 0.92,
      piel: "#D8B8A0",
      pielSombra: "#B8987E",
      pelo: "#C9CCD2",
      ropa: "#56667A",
      ropaSombra: "#425062",
      falda: true,
      pantalon: "#46526A",
      botas: "#2A2A30",
      cinto: "#2E3848",
      rodete: true,
      lentes: true,
      tinta: true,
    },
    // La cuadrilla de Orm: tres trabajadores con gorro de lana y túnicas de colores distintos.
    trabajador: {
      nombre: "trabajador",
      alto: 0.96,
      ancho: 1.05,
      piel: "#C8987A",
      pielSombra: "#A87A5E",
      pelo: "#4A3424",
      barba: "#4A3424",
      ropa: "#7A6A3A",
      ropaSombra: "#5E5230",
      pantalon: "#40362C",
      botas: "#2A2018",
      cinto: "#5E4430",
      gorro: "#8A3A2A",
    },
    trabajador2: {
      nombre: "trabajador",
      alto: 1,
      ancho: 1,
      piel: "#B88A6E",
      pielSombra: "#986C52",
      pelo: "#2E2620",
      ropa: "#4E6070",
      ropaSombra: "#3C4A58",
      pantalon: "#3A3228",
      botas: "#241C16",
      cinto: "#5E4430",
      gorro: "#5A6A2E",
    },
    trabajador3: {
      nombre: "trabajador",
      alto: 0.94,
      ancho: 1.1,
      piel: "#D4A88A",
      pielSombra: "#B2886C",
      pelo: "#8A6A3A",
      barba: "#8A6A3A",
      ropa: "#6E4A3A",
      ropaSombra: "#56382C",
      pantalon: "#44382C",
      botas: "#2A2018",
      cinto: "#3A2A1A",
      gorro: "#C8B48C",
    },
    // Un guardia de Eikholt: casco, tabardo verde con la insignia de la capital (la cornamenta) y lanza.
    guardia: {
      nombre: "guardia",
      alto: 1.04,
      ancho: 1.1,
      piel: "#C8987A",
      pielSombra: "#A87A5E",
      pelo: "#5A4030",
      barba: "#5A4030",
      ropa: "#5A5E5A",
      ropaSombra: "#464A46",
      pantalon: "#3A3228",
      botas: "#241C16",
      cinto: "#3A2A1A",
      gorro: "#6E6A6E",
      lanza: true,
      insignia: true,
    },
    // Geir, el aprendiz de Ása: flaco, sin barba todavía, tiznado de hollín y con el delantal de cuero que le queda grande
    geir: { nombre: "geir", alto: 0.94, ancho: 0.9, piel: "#D8B090", pielSombra: "#B89070", pelo: "#C8803A", ropa: "#6A5A4A", ropaSombra: "#52463A", delantal: "#4A3020", delantalSombra: "#3A2418", pantalon: "#3A3026", botas: "#2A2018", cinto: "#5E4430" },
    // el guardia de la muralla que espera su punta de lanza en la herrería
    hr_guardia: { nombre: "hr_guardia", alto: 1.04, ancho: 1.1, piel: "#D0A080", pielSombra: "#AE8064", pelo: "#3A2A1E", barba: "#3A2A1E", ropa: "#5A5E5A", ropaSombra: "#464A46", pantalon: "#3A3228", botas: "#241C16", cinto: "#3A2A1A", gorro: "#6E6A6E", insignia: true },
    // Ketill, el copista de Svanhild: flaco, de mediana edad, barba rala, túnica parda con manchas de tinta en las mangas
    ketill: { nombre: "ketill", alto: 0.98, ancho: 0.9, piel: "#D8B494", pielSombra: "#B89474", pelo: "#7A5634", barba: "#7A5634", ropa: "#6A5A48", ropaSombra: "#544636", pantalon: "#3E342A", botas: "#2A2018", cinto: "#3A2A1A", tinta: true },
    // Hlíf, la aprendiz de Thora: joven, trenza rubia, vestido de lana y delantal verde manchado de hierbas
    hlif: { nombre: "hlif", alto: 0.9, ancho: 0.88, piel: "#E8C8A8", pielSombra: "#C8A888", pelo: "#D8B060", ropa: "#8A7A60", ropaSombra: "#6E604A", falda: true, delantal: "#4E5C32", delantalSombra: "#3A4428", pantalon: "#5A4A38", botas: "#3A2A1E", cinto: "#5A4030", trenza: true },
    // La gente de las casas de Eikholt (motor/interiores.js, vecinoDe): dos vecinas con falda y un vecino de capa corta.
    vecina: { nombre: "vecina", alto: 0.92, ancho: 0.92, piel: "#D8B496", pielSombra: "#B8947A", pelo: "#7A4A2A", ropa: "#7A3A34", ropaSombra: "#5E2C28", falda: true, delantal: "#C8B48C", delantalSombra: "#A8946E", pantalon: "#4A3A2C", botas: "#2A2018", cinto: "#4A3424", trenza: true },
    vecina2: { nombre: "vecina", alto: 0.88, ancho: 0.96, piel: "#E0C0A4", pielSombra: "#C0A086", pelo: "#B8B0A4", ropa: "#4E5A6A", ropaSombra: "#3C4652", falda: true, delantal: "#6E5A3E", delantalSombra: "#56462E", pantalon: "#3A3228", botas: "#241C16", cinto: "#3A2A1A", trenza: true },
    vecino: { nombre: "vecino", alto: 0.98, ancho: 1.02, piel: "#C49478", pielSombra: "#A4765C", pelo: "#6A4A2A", barba: "#6A4A2A", ropa: "#5A6A3E", ropaSombra: "#46522E", capa: "#7A5A3A", capaSombra: "#5E442C", pantalon: "#3E342A", botas: "#2A2018", cinto: "#5E4430" },
    // El herido: el trabajador que no puede apoyar la pierna; se dibuja sentado con la venda.
    herido: {
      nombre: "trabajador",
      alto: 0.96,
      ancho: 1.05,
      piel: "#C09070",
      pielSombra: "#A07456",
      pelo: "#5A4030",
      barba: "#5A4030",
      ropa: "#5A6A4A",
      ropaSombra: "#46523A",
      pantalon: "#40362C",
      botas: "#2A2018",
      cinto: "#5E4430",
      sentado: true,
    },
  };
  const LISTA = Object.keys(FICHAS);

  // ---- frente (S); con o.tq = 1 es de tres cuartos (SE: de frente y un poco hacia la derecha) ----
  function frente(c, f, t, o) {
    const tq = o.tq || 0,
      a = f.alto,
      w = f.ancho * (1 - 0.18 * tq),
      fx = 4 * tq, // la cara se corre hacia donde mira
      corte = -6 * tq * f.ancho, // la línea de sombra del cuerpo se corre al costado de lejos
      paso = o.camina ? Math.sin(t * 9) * 3 : 0,
      bob = o.camina ? Math.abs(Math.sin(t * 9)) * 1.5 : Math.sin(t * 1.6) * 0.6,
      habla = o.hablando ? Math.sin(t * 6) * 0.5 + 0.5 : 0;
    const Y = (v) => -v * a - bob;
    if (!f.falda) {
      P(c, [-9 * w, Y(30), -2 * w, Y(30), -3 * w + paso * 0.3, -6, -10 * w + paso * 0.3, -6], f.pantalon);
      P(c, [2 * w, Y(30), 9 * w, Y(30), 10 * w - paso * 0.3, -6, 3 * w - paso * 0.3, -6], f.pantalon);
    }
    P(c, [-11 * w + paso * 0.3, -7, -2 * w + paso * 0.3, -7, -2 * w + paso * 0.3, 0, -12 * w + paso * 0.3, 0], f.botas);
    P(c, [2 * w - paso * 0.3, -7, 11 * w - paso * 0.3, -7, 12 * w - paso * 0.3, 0, 2 * w - paso * 0.3, 0], f.botas);
    if (f.capa) P(c, [-17 * w, Y(62), 17 * w, Y(62), 20 * w, Y(10), -20 * w, Y(10)], f.capaSombra);
    const base = f.falda ? 0 : 26;
    P(c, [-14 * w, Y(64), 14 * w, Y(64), 16 * w, -base * a, -16 * w, -base * a], f.ropa);
    P(c, [-14 * w, Y(64), corte, Y(64), corte, -base * a, -16 * w, -base * a], f.ropaSombra);
    if (f.delantal) {
      P(c, [-10 * w + fx, Y(52), 10 * w + fx, Y(52), 12 * w + fx, -18, -12 * w + fx, -18], f.delantal);
      P(c, [-10 * w + fx, Y(52), corte + fx, Y(52), corte + fx, -18, -12 * w + fx, -18], f.delantalSombra);
    }
    R(c, -16 * w, Y(32), 32 * w, 3 * a, f.cinto);
    if (f.tablillas) {
      R(c, 6 * w, Y(31), 6, 9, "#C8B48C");
      R(c, 9 * w, Y(30), 5, 8, "#D8C8A4");
    }
    if (f.capa) {
      P(c, [-18 * w, Y(60), -10 * w, Y(66), 10 * w, Y(66), 18 * w, Y(60), 14 * w, Y(52), -14 * w, Y(52)], f.capa);
      E(c, 0, Y(58), 2.5, 2.5, "#C8B48C");
    }
    // el tabardo verde con la insignia de Eikholt (la regla de la capital: va en todo lo que la represente)
    if (f.insignia) {
      P(c, [-9 * w + fx * 0.6, Y(63), 9 * w + fx * 0.6, Y(63), 10 * w + fx * 0.6, Y(24), -10 * w + fx * 0.6, Y(24)], "#2C4226");
      P(c, [-9 * w + fx * 0.6, Y(63), corte + fx * 0.6, Y(63), corte + fx * 0.6, Y(24), -10 * w + fx * 0.6, Y(24)], "#1E3018");
      DIB.insignia(c, (x, y) => [fx * 0.6 + x * 20 * w, Y(60) + y * 20 * a], "#F2ECEC");
    }
    const brazo = o.hablando ? -habla * 6 : 0;
    // de tres cuartos el brazo de lejos queda medio tapado por el cuerpo
    if (tq) P(c, [-12 * w, Y(62), -16 * w, Y(60), -17 * w, Y(36) + brazo, -13 * w, Y(36) + brazo], f.ropaSombra);
    else P(c, [-14 * w, Y(62), -20 * w, Y(60), -22 * w, Y(36) + brazo, -16 * w, Y(36) + brazo], f.ropaSombra);
    P(c, [14 * w, Y(62), 20 * w, Y(60), 22 * w, Y(36), 16 * w, Y(36)], f.ropa);
    E(c, (tq ? -15 : -19) * w, Y(34) + brazo, 3, 3, f.pielSombra);
    E(c, 19 * w, Y(34), 3, 3, f.piel);
    if (f.tinta) E(c, 19 * w, Y(33), 1.5, 1.5, "#2A2A40");
    c.save();
    c.translate(fx * 0.5, 0);
    R(c, -3, Y(68), 6, 5, f.pielSombra);
    const cy = Y(78);
    P(c, [-9, cy - 8, 9, cy - 8, 9, cy + 7, 4, cy + 11, -4, cy + 11, -9, cy + 7], f.piel);
    P(c, [-9, cy - 8, -fx, cy - 8, -fx, cy + 11, -4, cy + 11, -9, cy + 7], f.pielSombra);
    // de tres cuartos asoma la nariz del lado que mira
    if (tq) P(c, [9, cy - 2, 12, cy + 3, 9, cy + 5], f.piel);
    if (f.calvo) {
      P(c, [-10, cy - 4, -9, cy - 9, -6, cy - 11, 6, cy - 11, 9, cy - 9, 10, cy - 4, 7, cy - 6, -7, cy - 6], f.pelo);
    } else {
      P(c, [-10, cy + 4, -10, cy - 8, -5, cy - 13, 5, cy - 13, 10, cy - 8, 10, cy + 4, 8, cy - 4, -8, cy - 4], f.pelo);
    }
    if (f.mecha) P(c, [3, cy - 13, 6, cy - 12, 9, cy - 4, 7, cy - 4], f.mecha);
    if (f.rodete) E(c, 0, cy - 14, 6, 4, f.pelo);
    if (f.gorro) P(c, [-10, cy - 5, -8, cy - 12, 0, cy - 15, 8, cy - 12, 10, cy - 5], f.gorro);
    R(c, -6 + fx, cy - 1, tq ? 2 : 3, 2, "#1A1412");
    R(c, 3 + fx, cy - 1, 3, 2, "#1A1412");
    if (f.barba) {
      P(c, [-9 + fx * 0.5, cy + 3, 9 + fx * 0.5, cy + 3, 8 + fx * 0.5, cy + 12, 3 + fx, cy + 17, -3 + fx, cy + 17, -8 + fx * 0.5, cy + 12], f.barba);
      if (f.barbaCana) P(c, [-3 + fx, cy + 9, 3 + fx, cy + 9, 2 + fx, cy + 16, -2 + fx, cy + 16], f.barbaCana);
      if (o.hablando && habla > 0.5) R(c, -2 + fx, cy + 5, 4, 2, "#3A1E16");
    } else if (o.hablando && habla > 0.5) R(c, -2 + fx, cy + 6, 4, 1.5, "#6A3A2A");
    c.restore();
    if (f.lentes) {
      L(c, -6, Y(64), 0, Y(54), "#8A8E92", 1);
      L(c, 6, Y(64), 0, Y(54), "#8A8E92", 1);
      E(c, -2, Y(54), 2.5, 2.5, "#B8D8E0");
      E(c, 3, Y(54), 2.5, 2.5, "#B8D8E0");
    }
    if (f.lanza) {
      L(c, 22 * w, Y(16), 22 * w, Y(100), "#6B4A2C", 2.5);
      P(c, [22 * w, Y(112), 19 * w, Y(100), 22 * w, Y(98), 25 * w, Y(100)], "#B8BCC0");
    }
    if (f.hacha) {
      L(c, 22 * w, Y(22), 22 * w, Y(48), "#6B4A2C", 3);
      P(c, [22 * w, Y(48), 30 * w, Y(52), 30 * w, Y(40), 22 * w, Y(42)], "#8A8E92");
    }
  }

  // ---- costado (E, mira a la derecha) ----
  function costado(c, f, t, o) {
    const a = f.alto,
      w = f.ancho,
      paso = o.camina ? Math.sin(t * 9) * 8 : 0,
      bob = o.camina ? Math.abs(Math.sin(t * 9)) * 1.5 : Math.sin(t * 1.6) * 0.6;
    const Y = (v) => -v * a - bob;
    if (!f.falda) {
      P(c, [-4, Y(30), 4, Y(30), 3 - paso * 0.5, -6, -5 - paso * 0.5, -6], "#2E261E");
      P(c, [-4, Y(30), 4, Y(30), 4 + paso * 0.5, -6, -4 + paso * 0.5, -6], f.pantalon);
    }
    P(c, [-5 - paso * 0.5, -7, 6 - paso * 0.5, -7, 8 - paso * 0.5, 0, -5 - paso * 0.5, 0], "#1E1812");
    P(c, [-4 + paso * 0.5, -7, 7 + paso * 0.5, -7, 9 + paso * 0.5, 0, -4 + paso * 0.5, 0], f.botas);
    if (f.capa) P(c, [-12 * w, Y(64), -4, Y(64), -6, Y(10), -18 * w, Y(14)], f.capa);
    const base = f.falda ? 0 : 26;
    P(c, [-9 * w, Y(64), 8 * w, Y(64), 10 * w, -base * a, -11 * w, -base * a], f.ropa);
    P(c, [-9 * w, Y(64), -3 * w, Y(64), -4 * w, -base * a, -11 * w, -base * a], f.ropaSombra);
    if (f.delantal) P(c, [4 * w, Y(52), 11 * w, Y(52), 13 * w, -18, 6 * w, -18], f.delantal);
    if (f.insignia) P(c, [2 * w, Y(63), 9 * w, Y(63), 10 * w, Y(24), 3 * w, Y(24)], "#2C4226");
    R(c, -11 * w, Y(32), 21 * w, 3 * a, f.cinto);
    if (f.tablillas) R(c, -9 * w, Y(31), 5, 9, "#C8B48C");
    const ba = o.camina ? Math.sin(t * 9) * 0.5 : 0;
    c.save();
    c.translate(0, Y(60));
    c.rotate(-ba);
    P(c, [-4, 0, 4, 0, 5, 24 * a, -3, 24 * a], f.ropaSombra);
    E(c, 1, 26 * a, 3, 3, f.piel);
    if (f.hacha) {
      L(c, 1, 26 * a, 1, 4, "#6B4A2C", 3);
      P(c, [1, 4, 10, 0, 10, 12, 1, 10], "#8A8E92");
    }
    c.restore();
    if (f.lanza) {
      L(c, 10, Y(16), 12, Y(100), "#6B4A2C", 2.5);
      P(c, [12, Y(112), 9, Y(100), 12, Y(98), 15, Y(100)], "#B8BCC0");
    }
    R(c, -2, Y(68), 5, 5, f.pielSombra);
    const cy = Y(78);
    P(c, [-8, cy - 8, 7, cy - 8, 9, cy, 11, cy + 2, 8, cy + 4, 6, cy + 11, -4, cy + 11, -8, cy + 6], f.piel);
    P(c, [-8, cy - 8, -3, cy - 8, -3, cy + 11, -4, cy + 11, -8, cy + 6], f.pielSombra);
    if (f.calvo) P(c, [-9, cy + 2, -9, cy - 8, -4, cy - 11, 6, cy - 11, 8, cy - 7, -2, cy - 6, -5, cy + 2], f.pelo);
    else P(c, [-10, cy + 6, -10, cy - 8, -4, cy - 13, 6, cy - 12, 8, cy - 6, 0, cy - 6, -3, cy + 4], f.pelo);
    if (f.trenza) P(c, [-10, cy + 2, -6, cy + 2, -10, cy + 30, -14, cy + 28], f.pelo);
    if (f.mecha) P(c, [2, cy - 12, 6, cy - 11, 7, cy - 6, 3, cy - 6], f.mecha);
    if (f.rodete) E(c, -6, cy - 12, 5, 4, f.pelo);
    if (f.gorro) P(c, [-10, cy - 4, -8, cy - 12, 2, cy - 15, 9, cy - 10, 9, cy - 5], f.gorro);
    R(c, 4, cy - 1, 3, 2, "#1A1412");
    if (f.barba) {
      P(c, [-2, cy + 3, 9, cy + 3, 9, cy + 12, 4, cy + 17, -2, cy + 12], f.barba);
      if (f.barbaCana) P(c, [3, cy + 8, 8, cy + 8, 6, cy + 15, 3, cy + 14], f.barbaCana);
    }
    if (f.lentes) E(c, 8, Y(54), 2.5, 2.5, "#B8D8E0");
  }

  // ---- espaldas (N); con o.tq = 1 es de tres cuartos (NE: de espaldas y un poco hacia la derecha) ----
  function espaldas(c, f, t, o) {
    const tq = o.tq || 0,
      a = f.alto,
      w = f.ancho * (1 - 0.18 * tq),
      fx = 3 * tq,
      paso = o.camina ? Math.sin(t * 9) * 3 : 0,
      bob = o.camina ? Math.abs(Math.sin(t * 9)) * 1.5 : Math.sin(t * 1.6) * 0.6;
    const Y = (v) => -v * a - bob;
    if (f.lanza) {
      L(c, -22 * w, Y(16), -22 * w, Y(100), "#6B4A2C", 2.5);
      P(c, [-22 * w, Y(112), -25 * w, Y(100), -22 * w, Y(98), -19 * w, Y(100)], "#B8BCC0");
    }
    if (!f.falda) {
      P(c, [-9 * w, Y(30), -2 * w, Y(30), -3 * w - paso * 0.3, -6, -10 * w - paso * 0.3, -6], f.pantalon);
      P(c, [2 * w, Y(30), 9 * w, Y(30), 10 * w + paso * 0.3, -6, 3 * w + paso * 0.3, -6], f.pantalon);
    }
    P(c, [-11 * w - paso * 0.3, -7, -2 * w - paso * 0.3, -7, -2 * w - paso * 0.3, 0, -12 * w - paso * 0.3, 0], f.botas);
    P(c, [2 * w + paso * 0.3, -7, 11 * w + paso * 0.3, -7, 12 * w + paso * 0.3, 0, 2 * w + paso * 0.3, 0], f.botas);
    const base = f.falda ? 0 : 26;
    P(c, [-14 * w, Y(64), 14 * w, Y(64), 16 * w, -base * a, -16 * w, -base * a], f.ropaSombra);
    P(c, [6 * tq, Y(64), 14 * w, Y(64), 16 * w, -base * a, 6 * tq, -base * a], f.ropa);
    if (f.delantal) {
      L(c, -10 * w, Y(62), 8 * w, Y(34), f.delantal, 3);
      L(c, 10 * w, Y(62), -8 * w, Y(34), f.delantal, 3);
    }
    R(c, -16 * w, Y(32), 32 * w, 3 * a, f.cinto);
    P(c, [-14 * w, Y(62), -20 * w, Y(60), -22 * w, Y(36), -16 * w, Y(36)], f.ropaSombra);
    P(c, [14 * w, Y(62), 20 * w, Y(60), 22 * w, Y(36), 16 * w, Y(36)], f.ropa);
    E(c, -19 * w, Y(34), 3, 3, f.pielSombra);
    E(c, 19 * w, Y(34), 3, 3, f.piel);
    if (f.capa) {
      P(c, [-18 * w, Y(62), 18 * w, Y(62), 20 * w, Y(12), 6 * w, Y(8), -6 * w, Y(12), -20 * w, Y(10)], f.capa);
      P(c, [-18 * w, Y(62), 0, Y(62), 0, Y(10), -6 * w, Y(12), -20 * w, Y(10)], f.capaSombra);
    }
    if (f.insignia) {
      if (!f.capa) P(c, [-10 * w, Y(63), 10 * w, Y(63), 11 * w, Y(24), -11 * w, Y(24)], "#2C4226");
      DIB.insignia(c, (x, y) => [x * 26 * w, Y(58) + y * 26 * a], "#F2ECEC");
    }
    if (f.hacha) {
      L(c, 12 * w, Y(34), 12 * w, Y(10), "#6B4A2C", 3);
      P(c, [12 * w, Y(14), 19 * w, Y(10), 19 * w, Y(20), 12 * w, Y(20)], "#8A8E92");
    }
    R(c, -3 + fx, Y(68), 6, 5, f.pielSombra);
    const cy = Y(78);
    // de tres cuartos asoman la oreja y el borde de la cara del lado que mira
    if (tq) P(c, [6, cy - 6, 12, cy - 4, 12, cy + 8, 7, cy + 10], f.pielSombra);
    P(c, [-10, cy + 8, -10, cy - 8, -5, cy - 13, 5, cy - 13, 10, cy - 8, 10, cy + 8, 4, cy + 11, -4, cy + 11], f.calvo ? f.piel : f.pelo);
    if (f.calvo) P(c, [-10, cy + 2, -9, cy - 4, 9, cy - 4, 10, cy + 2, 6, cy + 10, -6, cy + 10], f.pelo);
    if (f.trenza) {
      P(c, [-3, cy + 8, 3, cy + 8, 2, cy + 34, -2, cy + 34], f.pelo);
      for (let k = 0; k < 4; k++) R(c, -3, cy + 12 + k * 6, 6, 1.5, "#1A120E");
      P(c, [-1, cy + 34, 1, cy + 34, 2, cy + 40, -2, cy + 40], f.cinto);
    }
    if (f.mecha) P(c, [-6, cy - 12, -3, cy - 12, -4, cy + 6, -7, cy + 6], f.mecha);
    if (f.rodete) E(c, 0, cy - 6, 7, 5, f.pelo);
    if (f.gorro) P(c, [-10, cy - 3, -8, cy - 12, 0, cy - 15, 8, cy - 12, 10, cy - 3], f.gorro);
  }

  // el herido: sentado, con la pierna vendada estirada
  function sentado(c, f, t) {
    const bob = Math.sin(t * 1.4) * 0.5;
    P(c, [-6, -2, 18, -4, 20, 2, -4, 4], f.pantalon);
    P(c, [6, -6, 16, -6, 17, 0, 7, 1], "#E8E0D0");
    P(c, [-10, -2, -2, -4, 0, 2, -10, 4], f.pantalon);
    P(c, [-12, -40 + bob, 6, -40 + bob, 8, -4, -14, -4], f.ropa);
    P(c, [-12, -40 + bob, -2, -40 + bob, -2, -4, -14, -4], f.ropaSombra);
    const cy = -50 + bob;
    P(c, [-8, cy - 8, 8, cy - 8, 8, cy + 7, 3, cy + 10, -3, cy + 10, -8, cy + 7], f.piel);
    P(c, [-9, cy + 2, -9, cy - 8, -4, cy - 12, 4, cy - 12, 9, cy - 8, 9, cy + 2, 7, cy - 4, -7, cy - 4], f.pelo);
    R(c, -5, cy - 1, 3, 1.5, "#1A1412");
    R(c, 2, cy - 1, 3, 1.5, "#1A1412");
    if (f.barba) P(c, [-8, cy + 3, 8, cy + 3, 6, cy + 12, -6, cy + 12], f.barba);
  }

  // ocho vistas: S, SE, E, NE, N y sus espejos (SO, O, NO) con o.espejo
  const VISTAS = { S: frente, SE: (c, f, t, o) => frente(c, f, t, Object.assign({}, o, { tq: 1 })), E: costado, NE: (c, f, t, o) => espaldas(c, f, t, Object.assign({}, o, { tq: 1 })), N: espaldas };
  // la vista según hacia dónde camina en pantalla (dx a la derecha, dy hacia abajo): { vista, espejo }
  function vistaDe(dx, dy, previa) {
    if (Math.abs(dx) < 1e-3 && Math.abs(dy) < 1e-3) return previa || { vista: "S", espejo: false };
    const oct = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)); // 0 = derecha, 2 = abajo, -2 = arriba
    const V = { 0: "E", 1: "SE", 2: "S", 3: "SE", 4: "E", "-4": "E", "-1": "NE", "-2": "N", "-3": "NE" };
    return { vista: V[oct], espejo: oct === 3 || Math.abs(oct) === 4 || oct === -3 };
  }
  // ---------- los espíritus, como en su hoja: la huldra y el nøkk ----------
  // La huldra: alta, pelo de paja larguísimo con corona de flores, vestido verde musgo de mangas anchas, faja roja con
  // borla dorada y la cola de vaca que asoma bajo el ruedo; de espaldas es hueca como un tronco podrido.
  const HUL = { piel: "#EAD8C8", pielS: "#CDB8A6", pelo: "#E0BE6A", peloS: "#BE9A4C", ropa: "#55683E", ropaS: "#3F502C", faja: "#7A1A10", oro: "#D8A84A", bota: "#3A2A20", corteza: "#5C4430", cortezaS: "#3A2A1C", hueco: "#1A120C", cola: "#C8B4A4", borla: "#5C3A20" };
  const FLORES = ["#F2ECEC", "#B89AD8", "#FFD98A", "#F2ECEC", "#E0B2B2", "#B89AD8", "#F2ECEC"];
  function corona(c, cy, ancho) {
    L(c, -ancho, cy, ancho, cy, "#4E6B3A", 2);
    FLORES.forEach((col, k) => {
      const x = -ancho + (k / (FLORES.length - 1)) * ancho * 2;
      E(c, x, cy - 1, 2.6, 2.6, col);
      E(c, x, cy - 1, 1, 1, "#D8A84A");
    });
  }
  function huldra(c, t, o) {
    const v = o.vista || "S",
      bob = o.camina ? Math.abs(Math.sin(t * 9)) * 1.5 : Math.sin(t * 1.4) * 0.6,
      Y = (n) => -n * 1.06 - bob,
      cola = Math.sin(t * 1.8) * 4;
    // la cola de vaca: sale por detrás del ruedo y termina en un mechón
    const ladoCola = v === "E" ? -1 : 1;
    c.beginPath();
    c.moveTo(-4 * ladoCola, Y(14));
    c.quadraticCurveTo(-20 * ladoCola, Y(10) + cola, -19 * ladoCola, -12);
    c.strokeStyle = HUL.cola;
    c.lineWidth = 3;
    c.stroke();
    P(c, [-19 * ladoCola - 3, -13, -19 * ladoCola + 3, -13, -19 * ladoCola + 2, -3, -19 * ladoCola - 2, -3], HUL.borla);
    if (v === "N") {
      // de espaldas: el pelo cae por los costados y la espalda es un hueco de corteza
      P(c, [-15, Y(66), 15, Y(66), 18, 0, -18, 0], HUL.ropaS);
      P(c, [0, Y(66), 15, Y(66), 18, 0, 0, 0], HUL.ropa);
      P(c, [-10, Y(64), 10, Y(64), 11, Y(30), 6, Y(24), -6, Y(24), -11, Y(30)], HUL.corteza);
      P(c, [-10, Y(64), 0, Y(64), 0, Y(24), -6, Y(24), -11, Y(30)], HUL.cortezaS);
      P(c, [-6, Y(60), 6, Y(60), 7, Y(36), 0, Y(28), -7, Y(36)], HUL.hueco);
      for (let k = 0; k < 3; k++) L(c, -8 + k * 8, Y(62), -7 + k * 7, Y(34), "#2A1E14", 1);
      R(c, -16, Y(30), 32, 3, HUL.faja);
      const cy = Y(80);
      P(c, [-12, cy + 6, -11, cy - 9, -5, cy - 14, 5, cy - 14, 11, cy - 9, 12, cy + 6], HUL.pelo);
      P(c, [-15, cy, -10, cy, -12, Y(18), -18, Y(22)], HUL.peloS);
      P(c, [15, cy, 10, cy, 12, Y(18), 18, Y(22)], HUL.pelo);
      corona(c, cy - 10, 11);
      return;
    }
    if (v === "E") {
      // de costado: el vestido largo, la manga ancha y el pelo que cae hasta las rodillas por la espalda
      P(c, [-6, -6, 6, -6, 8, 0, -5, 0], HUL.bota);
      P(c, [-18, Y(64), -8, Y(66), -10, Y(14), -20, Y(18)], HUL.peloS);
      P(c, [-10, Y(64), 8, Y(64), 12, 0, -12, 0], HUL.ropa);
      P(c, [-10, Y(64), -4, Y(64), -5, 0, -12, 0], HUL.ropaS);
      R(c, -11, Y(32), 22, 3, HUL.faja);
      R(c, 4, Y(30), 3, 16, HUL.faja);
      P(c, [3, Y(14), 8, Y(14), 5.5, Y(10)], HUL.oro);
      P(c, [-2, Y(60), 6, Y(60), 14, Y(34), 4, Y(32)], HUL.ropaS);
      E(c, 10, Y(32), 3, 3, HUL.piel);
      const cy = Y(80);
      P(c, [-7, cy - 8, 7, cy - 8, 9, cy + 2, 7, cy + 4, 6, cy + 11, -4, cy + 11, -7, cy + 6], HUL.piel);
      P(c, [-7, cy - 8, -2, cy - 8, -2, cy + 11, -4, cy + 11, -7, cy + 6], HUL.pielS);
      P(c, [-12, cy + 8, -11, cy - 9, -4, cy - 14, 6, cy - 13, 8, cy - 6, 0, cy - 6, -3, cy + 6, -8, Y(40)], HUL.pelo);
      R(c, 4, cy - 1, 2.5, 2, "#3A2A20");
      corona(c, cy - 11, 9);
      return;
    }
    // de frente: vestido verde hasta el piso, mangas anchas, faja roja con la borla dorada, pelo a los dos lados
    P(c, [-10, -6, -3, -6, -3, 0, -11, 0], HUL.bota);
    P(c, [3, -6, 10, -6, 11, 0, 3, 0], HUL.bota);
    const cy = Y(80);
    P(c, [-13, cy, -9, cy, -12, Y(16), -18, Y(18)], HUL.peloS);
    P(c, [13, cy, 9, cy, 12, Y(16), 18, Y(18)], HUL.pelo);
    P(c, [-13, Y(64), 13, Y(64), 18, 0, -18, 0], HUL.ropa);
    P(c, [-13, Y(64), 0, Y(64), 0, 0, -18, 0], HUL.ropaS);
    P(c, [-4, Y(66), 4, Y(66), 3, Y(60), -3, Y(60)], HUL.ropaS);
    R(c, -14, Y(34), 28, 4, HUL.faja);
    R(c, -1.5, Y(30), 3, 18, HUL.faja);
    P(c, [-3, Y(12), 3, Y(12), 0, Y(7)], HUL.oro);
    R(c, -2, Y(34), 4, 4, HUL.oro);
    // las mangas anchas, que se abren hacia la mano
    P(c, [-13, Y(62), -19, Y(58), -24, Y(32), -14, Y(34)], HUL.ropaS);
    P(c, [13, Y(62), 19, Y(58), 24, Y(32), 14, Y(34)], HUL.ropa);
    E(c, -19, Y(31), 2.6, 2.6, HUL.pielS);
    E(c, 19, Y(31), 2.6, 2.6, HUL.piel);
    R(c, -2.5, Y(70), 5, 5, HUL.pielS);
    P(c, [-8, cy - 8, 8, cy - 8, 8, cy + 7, 3, cy + 11, -3, cy + 11, -8, cy + 7], HUL.piel);
    P(c, [-8, cy - 8, 0, cy - 8, 0, cy + 11, -3, cy + 11, -8, cy + 7], HUL.pielS);
    P(c, [-10, cy + 6, -10, cy - 8, -5, cy - 13, 5, cy - 13, 10, cy - 8, 10, cy + 6, 6, cy - 5, 0, cy - 7, -6, cy - 5], HUL.pelo);
    R(c, -5, cy - 1, 3, 1.6, "#3A2A20");
    R(c, 2, cy - 1, 3, 1.6, "#3A2A20");
    if (o.hablando && Math.sin(t * 6) > 0) R(c, -1.5, cy + 6, 3, 1.4, "#8A4A3A");
    corona(c, cy - 11, 10);
  }

  // El nøkk: metido en el agua hasta la cintura (el río tapa la parte de abajo), piel verde, pelo negro mojado, túnica
  // oscura con algas que cuelgan, rombos dorados en el pecho y el violín bajo el mentón; el arco va y viene.
  const NK = { piel: "#8AA88E", pielS: "#6A8A70", pelo: "#14181A", ropa: "#2E3E30", ropaS: "#202C22", alga: "#5E7A3A", algaS: "#3E5428", oro: "#D8A84A", violin: "#7A3E20", violinL: "#9A5A30", arco: "#5C3A20" };
  function algas(c, x0, x1, y, largo, t) {
    for (let k = 0; k < 5; k++) {
      const x = x0 + ((x1 - x0) * k) / 4,
        l = largo * (0.6 + ((k * 37) % 5) / 10),
        ondea = Math.sin(t * 1.5 + k) * 1.5;
      P(c, [x - 1.6, y, x + 1.6, y, x + 1 + ondea, y + l, x - 1 + ondea, y + l], k % 2 ? NK.alga : NK.algaS);
    }
  }
  function nokk(c, t, o) {
    const v = o.vista || "S",
      Y = (n) => -n,
      arco = Math.sin(t * 3.2) * 9,
      cy = Y(80);
    const atras = v === "N";
    // el cuerpo con las mangas mojadas y las algas
    P(c, [-15, Y(64), 15, Y(64), 17, Y(0), -17, Y(0)], NK.ropa);
    P(c, [-15, Y(64), 0, Y(64), 0, Y(0), -17, Y(0)], NK.ropaS);
    algas(c, -14, 14, Y(60), 12, t);
    algas(c, -15, 15, Y(36), 14, t + 1);
    if (!atras) [Y(56), Y(48)].forEach((y) => P(c, [0, y - 3, 3, y, 0, y + 3, -3, y], NK.oro));
    // el pelo largo y negro que cae mojado
    P(c, [-12, cy - 2, -10, cy - 12, 10, cy - 12, 12, cy - 2, 13, Y(44), 6, Y(52), -6, Y(52), -13, Y(44)], NK.pelo);
    if (atras) {
      P(c, [-10, cy + 8, -10, cy - 8, -5, cy - 13, 5, cy - 13, 10, cy - 8, 10, cy + 8], NK.pelo);
      return;
    }
    R(c, -2.5, Y(70), 5, 5, NK.pielS);
    P(c, [-7, cy - 8, 7, cy - 8, 7, cy + 7, 3, cy + 11, -3, cy + 11, -7, cy + 7], NK.piel);
    P(c, [-7, cy - 8, 0, cy - 8, 0, cy + 11, -3, cy + 11, -7, cy + 7], NK.pielS);
    P(c, [-9, cy + 4, -9, cy - 9, -4, cy - 13, 4, cy - 13, 9, cy - 9, 9, cy + 4, 5, cy - 5, -5, cy - 5], NK.pelo);
    // los ojos entornados, tocando
    L(c, -5, cy, -2, cy + 0.6, "#1A1412", 1.4);
    L(c, 2, cy + 0.6, 5, cy, "#1A1412", 1.4);
    // el violín bajo el mentón, hacia su izquierda (la derecha de la pantalla)
    c.save();
    c.translate(6, cy + 14);
    c.rotate(0.35);
    P(c, [0, -5, 8, -7, 14, -4, 16, 0, 22, -4, 28, -2, 28, 4, 22, 6, 16, 2, 14, 6, 8, 8, 0, 6], NK.violin);
    P(c, [8, -7, 14, -4, 16, 0, 22, -4, 28, -2, 28, 0, 0, 0, 0, -5], NK.violinL);
    R(c, 28, -1.5, 12, 3, "#2A1810");
    R(c, 40, -3, 4, 6, NK.arco);
    L(c, 4, 0, 40, 0, "#E0D4C0", 0.8);
    c.restore();
    // la mano que pisa las cuerdas y el brazo del arco, que va y viene
    P(c, [12, Y(62), 18, Y(58), 34, Y(58), 32, Y(62)], NK.ropa);
    algas(c, 16, 30, Y(58), 8, t);
    E(c, 34, Y(60), 3, 3, NK.piel);
    P(c, [-12, Y(62), -18, Y(56), -6 + arco * 0.4, Y(50), -2 + arco * 0.4, Y(54)], NK.ropaS);
    algas(c, -18, -6, Y(54), 9, t + 2);
    E(c, arco * 0.4, Y(52), 3, 3, NK.pielS);
    L(c, arco * 0.4 - 18, Y(46), arco * 0.4 + 22, Y(60), NK.arco, 1.6);
  }

  const PROPIOS = { huldra, nokk };
  function dibujar(c, id, x, y, t, o = {}) {
    // o.vista y o.espejo son hacia dónde mira en el mundo: con la cámara girada se elige la vista de la pantalla
    if (window.VOL && VOL.cam.g) o = Object.assign({}, o, VOL.relativa(o.vista || "S", o.espejo));
    const f = FICHAS[id] || FICHAS.trabajador,
      s = o.s || 1;
    c.save();
    c.translate(x, y);
    c.scale(s * (o.espejo ? -1 : 1), s);
    sombra(c, 0, 0, 22 * f.ancho, 6, 0.4);
    if (f.sentado) sentado(c, f, t);
    else if (PROPIOS[id]) PROPIOS[id](c, t, o);
    else VISTAS[o.vista || "S"](c, f, t, o);
    c.restore();
  }
  return { LISTA, FICHAS, PROPIOS, VISTAS, dibujar, vistaDe, nombre: (id) => (FICHAS[id] || FICHAS.trabajador).nombre };
})();
