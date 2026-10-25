// ---------- el dibujo de las lanzas (forma "lanza" de DIB_ARMAS) ----------
// Mismo lenguaje que las espadas de la arena (caras planas, la mitad en sombra, el filo claro): el asta larga de
// madera con el agarre en el origen, la moharra hacia y negativa y el regatón abajo. Familias: 0 de hoja · 1 alada
// (con las aletas que frenan) · 2 rúnica (hoja larga con la runa) · 3 de hueso · 4 atgeir (la de cuchilla ancha de
// las sagas, con gancho).
(function () {
  "use strict";
  const P = (c, pts, col) => DIB.P(c, pts, col);
  const D = DIB_ARMAS,
    ORO = "#FFD98A";
  function dibujarLanza(c, fam, tier) {
    // el asta: de -150 a 250 (más larga que la espada), con tientos desde el escalón 1
    D.mango(c, -150, 250, 8, tier, fam === 3);
    // el cubo (donde se encaja la moharra)
    const [s, b] = D.METAL[Math.min(tier, 3)];
    P(c, [-11, -150, 11, -150, 9, -186, -9, -186], s);
    P(c, [0, -150, 11, -150, 9, -186, 0, -186], b);
    if (tier >= 2) P(c, [-12, -160, 12, -160, 12, -166, -12, -166], ORO);
    // la moharra
    if (fam === 0) D.filo(c, [-6, -186, -24, -230, -14, -290, 0, -330, 14, -290, 24, -230, 6, -186], [0, -330, 24, -230], tier);
    else if (fam === 1) {
      D.filo(c, [-6, -186, -20, -236, -10, -296, 0, -330, 10, -296, 20, -236, 6, -186], [0, -330, 20, -236], tier);
      // las aletas
      P(c, [-9, -176, -34, -184, -30, -172, -9, -168], s);
      P(c, [9, -176, 34, -184, 30, -172, 9, -168], b);
    } else if (fam === 2) D.filo(c, [-6, -186, -18, -220, -18, -320, 0, -370, 18, -320, 18, -220, 6, -186], [0, -370, 18, -320], tier);
    else if (fam === 3) D.filo(c, [-8, -186, -16, -226, -10, -250, -18, -270, -6, -320, 0, -340, 6, -320, 18, -270, 10, -250, 16, -226, 8, -186], [0, -340, 6, -320], tier);
    else {
      // atgeir: cuchilla ancha de un lado y gancho del otro
      D.filo(c, [-6, -186, -10, -240, -6, -300, 0, -350, 26, -300, 42, -240, 30, -200, 6, -186], [0, -350, 42, -240], tier);
      P(c, [-6, -210, -30, -222, -36, -240, -22, -232, -6, -228], s);
    }
    D.remaches(c, [0, -168], tier);
    // el regatón (la punta de abajo)
    P(c, [-8, 250, 8, 250, 0, 282], s);
    D.runa(c, fam === 2 ? "gebo" : "tiwaz", 0, -260, fam === 4 ? 18 : 14, tier);
  }
  D.forma("lanza", dibujarLanza);
  D.ICONO.lanza = { k: 0.92, x: 0, y: 30 };
})();
