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

  // ---- frente (S) ----
  function frente(c, f, t, o) {
    const a = f.alto,
      w = f.ancho,
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
    P(c, [-14 * w, Y(64), 0, Y(64), 0, -base * a, -16 * w, -base * a], f.ropaSombra);
    if (f.delantal) {
      P(c, [-10 * w, Y(52), 10 * w, Y(52), 12 * w, -18, -12 * w, -18], f.delantal);
      P(c, [-10 * w, Y(52), 0, Y(52), 0, -18, -12 * w, -18], f.delantalSombra);
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
    const brazo = o.hablando ? -habla * 6 : 0;
    P(c, [-14 * w, Y(62), -20 * w, Y(60), -22 * w, Y(36) + brazo, -16 * w, Y(36) + brazo], f.ropaSombra);
    P(c, [14 * w, Y(62), 20 * w, Y(60), 22 * w, Y(36), 16 * w, Y(36)], f.ropa);
    E(c, -19 * w, Y(34) + brazo, 3, 3, f.pielSombra);
    E(c, 19 * w, Y(34), 3, 3, f.piel);
    if (f.tinta) E(c, 19 * w, Y(33), 1.5, 1.5, "#2A2A40");
    R(c, -3, Y(68), 6, 5, f.pielSombra);
    const cy = Y(78);
    P(c, [-9, cy - 8, 9, cy - 8, 9, cy + 7, 4, cy + 11, -4, cy + 11, -9, cy + 7], f.piel);
    P(c, [-9, cy - 8, 0, cy - 8, 0, cy + 11, -4, cy + 11, -9, cy + 7], f.pielSombra);
    if (f.calvo) {
      P(c, [-10, cy - 4, -9, cy - 9, -6, cy - 11, 6, cy - 11, 9, cy - 9, 10, cy - 4, 7, cy - 6, -7, cy - 6], f.pelo);
    } else {
      P(c, [-10, cy + 4, -10, cy - 8, -5, cy - 13, 5, cy - 13, 10, cy - 8, 10, cy + 4, 8, cy - 4, -8, cy - 4], f.pelo);
    }
    if (f.mecha) P(c, [3, cy - 13, 6, cy - 12, 9, cy - 4, 7, cy - 4], f.mecha);
    if (f.rodete) E(c, 0, cy - 14, 6, 4, f.pelo);
    if (f.gorro) P(c, [-10, cy - 5, -8, cy - 12, 0, cy - 15, 8, cy - 12, 10, cy - 5], f.gorro);
    R(c, -6, cy - 1, 3, 2, "#1A1412");
    R(c, 3, cy - 1, 3, 2, "#1A1412");
    if (f.barba) {
      P(c, [-9, cy + 3, 9, cy + 3, 8, cy + 12, 3, cy + 17, -3, cy + 17, -8, cy + 12], f.barba);
      if (f.barbaCana) P(c, [-3, cy + 9, 3, cy + 9, 2, cy + 16, -2, cy + 16], f.barbaCana);
      if (o.hablando && habla > 0.5) R(c, -2, cy + 5, 4, 2, "#3A1E16");
    } else if (o.hablando && habla > 0.5) R(c, -2, cy + 6, 4, 1.5, "#6A3A2A");
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

  // ---- espaldas (N) ----
  function espaldas(c, f, t, o) {
    const a = f.alto,
      w = f.ancho,
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
    P(c, [0, Y(64), 14 * w, Y(64), 16 * w, -base * a, 0, -base * a], f.ropa);
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
    if (f.hacha) {
      L(c, 12 * w, Y(34), 12 * w, Y(10), "#6B4A2C", 3);
      P(c, [12 * w, Y(14), 19 * w, Y(10), 19 * w, Y(20), 12 * w, Y(20)], "#8A8E92");
    }
    R(c, -3, Y(68), 6, 5, f.pielSombra);
    const cy = Y(78);
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

  const VISTAS = { S: frente, E: costado, N: espaldas };
  function dibujar(c, id, x, y, t, o = {}) {
    const f = FICHAS[id] || FICHAS.trabajador,
      s = o.s || 1;
    c.save();
    c.translate(x, y);
    c.scale(s * (o.espejo ? -1 : 1), s);
    sombra(c, 0, 0, 22 * f.ancho, 6, 0.4);
    if (f.sentado) sentado(c, f, t);
    else VISTAS[o.vista || "S"](c, f, t, o);
    c.restore();
  }
  return { LISTA, FICHAS, dibujar, nombre: (id) => (FICHAS[id] || FICHAS.trabajador).nombre };
})();
