// ---------- La Tejedora en vectores (módulo TEJEDORA) ----------
// La reina del nido desde la lámina de Alejandro (30/10/2026): frente, costado, espalda, la tela de frente y de costado
// (el abdomen curvado por debajo y la bola de tela entre los colmillos) y el ataque básico de frente y de costado (clava
// juntas las dos patas de adelante). Pasada a SVG tal cual (img/criaturas/tejedora/*.svg) y animada con el mismo
// motor que sus hijas (ARANA.armar): un hueso por pata, dos grupos que se alternan al andar. Las paletas son las de
// enemigos/aranas.js; los huevos y los colmillos no cambian. Se registra en CRIATURAS como "aranaReina"; mientras el
// SVG carga se ve el dibujo viejo de aranas.js.
window.TEJEDORA = (function () {
  "use strict";
  const pata = (a, k, b, s) => ({ a, k, b, p: "raiz", s: s || 80 });
  const quieta = (k, pie) => ({ k, pie, huesos: { raiz: { a: [pie[0], pie[1] - 500], b: [pie[0], pie[1] - 550] } } });
  // huesos en las coordenadas de cada SVG (2048 de ancho); k = lo que mide el SVG en pixeles de la lámina
  const VISTAS = {
    S: {
      k: 410,
      pie: [977, 1790],
      huesos: {
        raiz: { a: [977, 1100], b: [977, 1050] },
        torso: { a: [977, 1100], b: [977, 400], p: "raiz", s: 450 },
        cabeza: { a: [977, 1150], b: [977, 1500], p: "torso", s: 200 },
        i1: pata([500, 1060], [310, 920], [57, 1730]),
        i2: pata([600, 1100], [480, 960], [237, 1795]),
        i3: pata([700, 1150], [640, 1180], [494, 1828]),
        d1: pata([1460, 1060], [1650, 920], [1840, 1735]),
        d2: pata([1360, 1100], [1480, 960], [1658, 1795]),
        d3: pata([1260, 1150], [1320, 1180], [1436, 1830]),
      },
    },
    E: {
      k: 523,
      pie: [1024, 1385],
      huesos: {
        raiz: { a: [900, 900], b: [900, 850] },
        torso: { a: [900, 900], b: [400, 400], p: "raiz", s: 450 },
        cabeza: { a: [1450, 800], b: [1800, 900], p: "torso", s: 200 },
        d4: pata([800, 950], [650, 930], [475, 1372]),
        d3: pata([1050, 900], [1025, 760], [863, 1388]),
        d2: pata([1250, 950], [1257, 830], [1184, 1384]),
        d1: pata([1400, 950], [1547, 870], [1685, 1396]),
        i1: pata([1500, 900], [1818, 930], [1916, 1345]),
      },
    },
    N: {
      k: 412,
      pie: [1067, 1840],
      huesos: {
        raiz: { a: [1067, 1100], b: [1067, 1050] },
        torso: { a: [1067, 1100], b: [1067, 300], p: "raiz", s: 500 },
        i1: pata([600, 1100], [290, 1190], [176, 1752]),
        i2: pata([650, 1200], [483, 1316], [405, 1866]),
        i3: pata([800, 1250], [774, 1266], [703, 1856]),
        d1: pata([1530, 1100], [1818, 1190], [1931, 1757]),
        d2: pata([1480, 1200], [1605, 1316], [1682, 1866]),
        d3: pata([1330, 1250], [1354, 1266], [1394, 1856]),
      },
    },
  };
  // las poses de la lámina: la tela (su habilidad) y el ataque básico
  const POSES = {
    telaS: quieta(648, [1024, 1140]),
    telaE: quieta(657, [1024, 1040]),
    basicoS: quieta(596, [1011, 1380]),
    basicoE: quieta(675, [1031, 1215]),
  };
  const T = ARANA.armar({
    carpeta: "img/criaturas/tejedora/",
    MUNDO: 0.42,
    VISTAS,
    POSES,
    PALETAS: ARANA.PALETAS,
    aviso: { S: "telaS", E: "telaE" },
    basico: { S: "basicoS", E: "basicoE" },
    sombra: [80, 66, 15],
  });
  if (window.CRIATURAS) {
    const viejo = CRIATURAS.DIBUJO ? CRIATURAS.DIBUJO.aranaReina : null;
    CRIATURAS.registrar("aranaReina", (c, t, o) => {
      if (!T.dibujar(c, t, o) && viejo) viejo(c, t, o);
    });
  }
  T.precargar();
  return T;
})();
