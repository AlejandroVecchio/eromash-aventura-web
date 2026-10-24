// ---------- las criaturas de Eldervald (módulo CRIATURAS) ----------
// Mismo estilo que los esbirros de la arena: caras planas, la mitad izquierda en sombra, ojos que brillan.
// Cada una en tres vistas (S frente, E costado, N espaldas). Base en (x, y).
//  · Lobo del zarzal: lobo gris oscuro con zarzas creciéndole en el lomo; huyó del corazón del bosque.
//  · Errante de Helheim: muerto ceniciento, encorvado, con la piel agrietada y ojos de brasa fría.
//  · Custodio de corteza: un guardián de troncos y raíces alterado por las ataduras.
//  · Ciervo Hueco: el guardián del bosque. Ciervo enorme y pálido con huecos de luz rúnica en el cuerpo
//    y ataduras violetas en las astas.
// o = { vista, espejo, mov (0..1 cuánto camina), golpe (0..1 anticipación), herido (0..1 destello), atado }
window.CRIATURAS = (function () {
  "use strict";
  const { P, E, R, L, alfa, sombra, halo, RUNICO, RUNICO_CLARO, VIOLETA, TAU } = DIB;

  // ---------- Lobo del zarzal ----------
  function lobo(c, t, o) {
    const v = o.vista || "E",
      m = o.mov || 0,
      paso = Math.sin(t * 12) * 6 * m,
      g = o.golpe || 0;
    const pelo = "#4A4A50",
      peloSombra = "#36363C",
      peloClaro = "#5E5E66",
      zarza = "#2A3A22",
      ojo = "#E0392E";
    sombra(c, 0, 0, 40, 9, 0.4);
    if (v === "E") {
      // patas de atrás y de adelante
      [[-26, paso], [-16, -paso], [18, -paso], [28, paso]].forEach(([px, d], k) =>
        P(c, [px - 3, -26, px + 3, -26, px + 3 + d * 0.4, 0, px - 4 + d * 0.4, 0], k % 2 ? peloSombra : pelo),
      );
      // cuerpo
      P(c, [-36, -26, -30, -44, 20, -48 - g * 4, 34, -40, 34, -22, -30, -20], pelo);
      P(c, [-36, -26, -30, -44, -10, -46, -12, -22, -30, -20], peloSombra);
      // cola
      P(c, [-34, -40, -56, -48 + Math.sin(t * 4) * 4, -50, -36, -34, -30], peloSombra);
      // cabeza (baja cuando va a morder)
      const hx = 34 + g * 10,
        hy = -40 + g * 8;
      P(c, [hx - 6, hy - 6, hx + 8, hy - 14, hx + 26, hy - 4, hx + 26, hy + 4, hx + 4, hy + 10, hx - 6, hy + 6], pelo);
      P(c, [hx + 8, hy - 14, hx + 12, hy - 26, hx + 16, hy - 12], peloSombra);
      P(c, [hx + 26, hy - 4, hx + 26, hy + 4, hx + 18, hy + 2], "#1A1A1E");
      if (g > 0.4) P(c, [hx + 12, hy + 4, hx + 26, hy + 4, hx + 20, hy + 9], "#E8DCC4");
      R(c, hx + 12, hy - 6, 4, 3, ojo);
      // zarzas del lomo
      for (let k = 0; k < 6; k++) {
        const zx = -26 + k * 9,
          zy = -46 - (k % 2) * 2;
        P(c, [zx - 4, zy + 4, zx + 1, zy - 10 - (k % 3) * 3, zx + 4, zy + 4], zarza);
        P(c, [zx + 1, zy - 6, zx + 6, zy - 9, zx + 2, zy - 3], "#1E2A18");
      }
    } else {
      const atras = v === "N";
      P(c, [-12, -24, -6, -24, -6 + paso * 0.2, 0, -12 + paso * 0.2, 0], peloSombra);
      P(c, [6, -24, 12, -24, 12 - paso * 0.2, 0, 6 - paso * 0.2, 0], pelo);
      P(c, [-18, -24, -16, -46, 16, -46, 18, -24], atras ? peloSombra : pelo);
      P(c, [-18, -24, -16, -46, 0, -46, 0, -24], peloSombra);
      for (let k = 0; k < 4; k++) P(c, [-12 + k * 8, -44, -9 + k * 8, -58 - (k % 2) * 4, -6 + k * 8, -44], zarza);
      if (atras) {
        P(c, [-4, -26, 4, -26, 2 + Math.sin(t * 4) * 4, -8, -2, -8], peloClaro);
      } else {
        const hy = -48 + g * 6;
        P(c, [-12, hy, 12, hy, 10, hy + 14, 0, hy + 22, -10, hy + 14], pelo);
        P(c, [-12, hy, 0, hy, 0, hy + 22, -10, hy + 14], peloSombra);
        P(c, [-12, hy, -10, hy - 12, -5, hy], peloSombra);
        P(c, [12, hy, 10, hy - 12, 5, hy], pelo);
        R(c, -7, hy + 5, 4, 3, ojo);
        R(c, 3, hy + 5, 4, 3, ojo);
        P(c, [-3, hy + 17, 3, hy + 17, 0, hy + 22], "#1A1A1E");
      }
    }
  }

  // ---------- Errante de Helheim ----------
  function errante(c, t, o) {
    const v = o.vista || "S",
      m = o.mov || 0,
      paso = Math.sin(t * 7) * 5 * m,
      g = o.golpe || 0,
      bob = Math.abs(Math.sin(t * 7)) * 2 * m;
    const ceniza = "#8A8680",
      cenizaSombra = "#6A6662",
      grieta = "#3A2E2A",
      trapo = "#4A3A34",
      ojo = "#FF8D71";
    sombra(c, 0, 0, 22, 6, 0.4);
    const Y = (y) => y - bob;
    if (v === "E") {
      P(c, [-6, Y(-34), 2, Y(-34), 3 - paso, 0, -5 - paso, 0], cenizaSombra);
      P(c, [-4, Y(-34), 4, Y(-34), 5 + paso, 0, -3 + paso, 0], ceniza);
      // torso encorvado hacia adelante
      P(c, [-10, Y(-34), -6, Y(-66), 10, Y(-72), 14, Y(-56), 8, Y(-34)], trapo);
      P(c, [-6, Y(-66), 10, Y(-72), 14, Y(-56), 2, Y(-60)], ceniza);
      // brazo largo, adelante (sube al golpear)
      c.save();
      c.translate(8, Y(-64));
      c.rotate(-0.4 + g * -1.4 + Math.sin(t * 7) * 0.2 * m);
      P(c, [-3, 0, 3, 0, 6, 34, 0, 36], cenizaSombra);
      P(c, [0, 36, 6, 34, 10, 42, 2, 44], ceniza);
      c.restore();
      // cabeza
      P(c, [8, Y(-74), 20, Y(-80), 26, Y(-70), 22, Y(-60), 10, Y(-62)], ceniza);
      P(c, [8, Y(-74), 14, Y(-77), 14, Y(-62), 10, Y(-62)], cenizaSombra);
      R(c, 19, Y(-73), 4, 3, ojo);
      L(c, 12, Y(-68), 20, Y(-64), grieta, 1.5);
    } else {
      const atras = v === "N";
      P(c, [-10, Y(-34), -3, Y(-34), -3 + paso * 0.3, 0, -10 + paso * 0.3, 0], cenizaSombra);
      P(c, [3, Y(-34), 10, Y(-34), 10 - paso * 0.3, 0, 3 - paso * 0.3, 0], ceniza);
      P(c, [-15, Y(-34), -13, Y(-66), 13, Y(-66), 15, Y(-34)], trapo);
      P(c, [-13, Y(-66), 13, Y(-66), 10, Y(-50), -10, Y(-50)], atras ? cenizaSombra : ceniza);
      // brazos colgando, desparejos
      const sube = g * 22;
      P(c, [-13, Y(-64), -20, Y(-62), -24, Y(-28) - sube, -17, Y(-28) - sube], cenizaSombra);
      P(c, [13, Y(-64), 20, Y(-62), 22, Y(-24) - sube, 15, Y(-26) - sube], ceniza);
      const cy = Y(-76);
      P(c, [-9, cy - 8, 9, cy - 8, 10, cy + 6, 4, cy + 11, -4, cy + 11, -10, cy + 6], ceniza);
      P(c, [-9, cy - 8, 0, cy - 8, 0, cy + 11, -4, cy + 11, -10, cy + 6], cenizaSombra);
      if (!atras) {
        R(c, -6, cy - 1, 4, 3, ojo);
        R(c, 2, cy - 1, 4, 3, ojo);
        L(c, -4, cy + 6, 4, cy + 6, grieta, 1.5);
      }
      L(c, -6, Y(-60), 2, Y(-44), grieta, 1.5);
    }
  }

  // ---------- Custodio de corteza ----------
  function custodio(c, t, o) {
    const v = o.vista || "S",
      m = o.mov || 0,
      paso = Math.sin(t * 5) * 6 * m,
      g = o.golpe || 0,
      inclina = g * 0.25;
    const corteza = "#5C4632",
      cortezaSombra = "#3E2E20",
      musgo = "#4E5C32",
      luz = VIOLETA;
    sombra(c, 0, 0, 36, 9, 0.42);
    c.save();
    c.rotate(v === "E" ? inclina : 0);
    // piernas de raíz
    P(c, [-18, -40, -6, -40, -6 + paso * 0.3, 0, -24 + paso * 0.3, 0], cortezaSombra);
    P(c, [6, -40, 18, -40, 24 - paso * 0.3, 0, 6 - paso * 0.3, 0], corteza);
    // tronco del cuerpo
    P(c, [-26, -40, -22, -96, 0, -108, 22, -96, 26, -40], corteza);
    P(c, [-26, -40, -22, -96, 0, -108, -2, -40], cortezaSombra);
    for (let k = 0; k < 4; k++) L(c, -18 + k * 12, -46, -16 + k * 12, -94, cortezaSombra, 2);
    P(c, [-22, -96, 0, -108, 22, -96, 12, -90, -12, -90], musgo);
    // brazos de rama (se levantan para el golpe)
    const sube = g * 40;
    P(c, [-24, -88, -40, -80 - sube, -48, -40 - sube, -38, -42 - sube], cortezaSombra);
    P(c, [24, -88, 40, -80 - sube, 48, -40 - sube, 38, -42 - sube], corteza);
    if (v !== "N") {
      // cara: dos huecos con luz violeta (las ataduras lo alteraron)
      halo(c, 0, -76, 24, luz, 0.5);
      E(c, -8, -78, 4, 5, luz);
      E(c, 8, -78, 4, 5, luz);
    }
    c.restore();
  }

  // ---------- Ciervo Hueco (jefe) ----------
  // o.atado: cuántas ataduras le quedan (0..3); o.calma: después de vencido, la luz se aquieta.
  function ciervo(c, t, o) {
    const v = o.vista || "E",
      m = o.mov || 0,
      paso = Math.sin(t * 8) * 10 * m,
      g = o.golpe || 0,
      calma = o.calma || 0;
    const pelo = "#D8D2C4",
      peloSombra = "#B0A898",
      peloOscuro = "#8A8274",
      hueco = "#1E2A30",
      pezuna = "#3A322A",
      asta = "#E8E0D0",
      astaSombra = "#BEB4A2";
    const brillo = (0.7 + Math.sin(t * 2.4) * 0.2) * (1 - calma * 0.6);
    sombra(c, 0, 0, 90, 20, 0.42);
    const huecoLuz = (x, y, rx, ry) => {
      E(c, x, y, rx, ry, hueco);
      alfa(c, brillo, () => E(c, x, y, rx * 0.7, ry * 0.7, RUNICO));
      alfa(c, brillo, () => E(c, x + rx * 0.15, y - ry * 0.15, rx * 0.3, ry * 0.3, RUNICO_CLARO));
    };
    const astas = (hx, hy, dir) => {
      const lado = (sg, col) => {
        c.strokeStyle = col;
        c.lineWidth = 6;
        c.lineCap = "round";
        c.lineJoin = "round";
        c.beginPath();
        c.moveTo(hx, hy);
        c.lineTo(hx + sg * 18 * dir, hy - 30);
        c.lineTo(hx + sg * 30 * dir, hy - 62);
        c.lineTo(hx + sg * 22 * dir, hy - 92);
        c.moveTo(hx + sg * 18 * dir, hy - 30);
        c.lineTo(hx + sg * 44 * dir, hy - 40);
        c.moveTo(hx + sg * 30 * dir, hy - 62);
        c.lineTo(hx + sg * 56 * dir, hy - 70);
        c.moveTo(hx + sg * 26 * dir, hy - 78);
        c.lineTo(hx + sg * 8 * dir, hy - 98);
        c.stroke();
      };
      lado(-1, astaSombra);
      lado(1, asta);
      // ataduras violetas enredadas en las astas
      for (let k = 0; k < (o.atado === undefined ? 3 : o.atado); k++) {
        const ax = hx + (k - 1) * 22 * dir,
          ay = hy - 50 - k * 10;
        halo(c, ax, ay, 22, VIOLETA, 0.6);
        c.strokeStyle = VIOLETA;
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(ax, ay, 10, 5, 0.4, 0, TAU);
        c.stroke();
      }
    };
    if (v === "E") {
      // patas
      [[-58, paso], [-42, -paso], [44, -paso], [60, paso]].forEach(([px, d], k) => {
        P(c, [px - 5, -70, px + 5, -70, px + 4 + d * 0.5, -6, px - 4 + d * 0.5, -6], k % 2 ? peloSombra : pelo);
        P(c, [px - 5 + d * 0.5, -8, px + 5 + d * 0.5, -8, px + 6 + d * 0.5, 0, px - 6 + d * 0.5, 0], pezuna);
      });
      // cuerpo con los huecos de luz
      P(c, [-74, -70, -66, -110, 50, -118 - g * 6, 76, -100, 72, -64, -66, -60], pelo);
      P(c, [-74, -70, -66, -110, -20, -114, -24, -62, -66, -60], peloSombra);
      P(c, [-66, -60, 72, -64, 66, -56, -60, -54], peloOscuro);
      huecoLuz(-30, -86, 16, 12);
      huecoLuz(10, -90, 12, 10);
      huecoLuz(40, -82, 9, 8);
      // cuello y cabeza (baja para embestir)
      const hx = 78 + g * 18,
        hy = -132 + g * 30;
      P(c, [52, -112, 66, -104, hx + 6, hy + 18, hx - 12, hy + 6], pelo);
      P(c, [hx - 14, hy - 6, hx + 6, hy - 14, hx + 40, hy + 4, hx + 40, hy + 14, hx + 4, hy + 18], pelo);
      P(c, [hx - 14, hy - 6, hx + 6, hy - 14, hx + 4, hy + 18], peloSombra);
      P(c, [hx + 40, hy + 4, hx + 40, hy + 14, hx + 32, hy + 12], "#2A2420");
      halo(c, hx + 18, hy, 14, RUNICO, brillo);
      R(c, hx + 16, hy - 3, 5, 4, RUNICO_CLARO);
      P(c, [hx + 2, hy - 12, hx - 8, hy - 26, hx + 8, hy - 14], peloSombra);
      astas(hx + 6, hy - 12, 1);
      // cola
      P(c, [-72, -104, -84, -96 + Math.sin(t * 3) * 3, -74, -92], pelo);
    } else {
      const atras = v === "N";
      [[-30, paso], [30, -paso]].forEach(([px, d]) => {
        P(c, [px - 7, -70, px + 7, -70, px + 6 + d * 0.3, -6, px - 6 + d * 0.3, -6], atras ? peloSombra : pelo);
        P(c, [px - 7 + d * 0.3, -8, px + 7 + d * 0.3, -8, px + 8 + d * 0.3, 0, px - 8 + d * 0.3, 0], pezuna);
      });
      P(c, [-46, -70, -44, -118, 44, -118, 46, -70], atras ? peloSombra : pelo);
      P(c, [-46, -70, -44, -118, 0, -118, 0, -70], peloSombra);
      if (atras) {
        P(c, [-6, -116, 6, -116, 4 + Math.sin(t * 3) * 2, -96, -4, -96], pelo);
        huecoLuz(-20, -96, 9, 9);
        // cuello y nuca de espaldas, para que las astas nazcan de la cabeza
        P(c, [-14, -116, 14, -116, 12, -146, -12, -146], peloSombra);
        P(c, [-16, -146, 16, -146, 12, -162, -12, -162], pelo);
        astas(0, -158, 1);
      } else {
        huecoLuz(0, -92, 18, 14);
        const hy = -150 + g * 34;
        P(c, [-12, -116, 12, -116, 10, hy + 24, -10, hy + 24], peloSombra);
        P(c, [-18, hy - 8, 18, hy - 8, 14, hy + 22, 0, hy + 40, -14, hy + 22], pelo);
        P(c, [-18, hy - 8, 0, hy - 8, 0, hy + 40, -14, hy + 22], peloSombra);
        P(c, [-6, hy + 34, 6, hy + 34, 0, hy + 42], "#2A2420");
        halo(c, -8, hy + 6, 12, RUNICO, brillo);
        halo(c, 8, hy + 6, 12, RUNICO, brillo);
        R(c, -11, hy + 4, 5, 4, RUNICO_CLARO);
        R(c, 6, hy + 4, 5, 4, RUNICO_CLARO);
        astas(0, hy - 6, 1);
      }
    }
  }

  const DIBUJO = { lobo, errante, custodio, ciervo };
  const LISTA = Object.keys(DIBUJO);
  function dibujar(c, id, x, y, t, o = {}) {
    c.save();
    c.translate(x, y);
    const s = o.s || 1;
    c.scale(s * (o.espejo ? -1 : 1), s);
    // destello claro al recibir un golpe, como los esbirros de la arena
    if (o.herido > 0) c.filter = `brightness(${1 + o.herido * 1.6})`;
    DIBUJO[id](c, t, o);
    c.restore();
  }
  return { LISTA, dibujar };
})();
