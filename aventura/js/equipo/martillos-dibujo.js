// ---------- el dibujo de los martillos y mazas (forma "martillo" de DIB_ARMAS) ----------
// Mismo lenguaje que las espadas de la arena: caras planas, la mitad en sombra, la cara de golpe clara. Mango corto
// con el agarre en el origen y la cabeza arriba (y negativa). Familias: 0 mazo de hierro · 1 maza de pestañas ·
// 2 martillo rúnico de cabeza ancha (el de las piedras de Thor) · 3 maza de hueso (la quijada de un jötunn) ·
// 4 mazo de piedra atada.
(function () {
  "use strict";
  const P = (c, pts, col) => DIB.P(c, pts, col);
  const D = DIB_ARMAS,
    ORO = "#FFD98A";
  // un bloque con la cara de adelante y la de arriba (luz de arriba a la derecha)
  function bloque(c, x0, y0, x1, y1, tier, piedra) {
    const [s, b, l] = piedra ? ["#5E5852", "#8A847C", "#B2ACA4"] : D.METAL[tier];
    P(c, [x0, y0, x1, y0, x1, y1, x0, y1], b);
    P(c, [x0, y0, (x0 + x1) / 2, y0, (x0 + x1) / 2, y1, x0, y1], s);
    // la cara de golpe (derecha) clara; en la legendaria, encendida
    const luz = () => P(c, [x1 - 8, y0, x1, y0, x1, y1, x1 - 8, y1], l);
    if (tier === 4 && !piedra) DIB.alfa(c, 0.65 + Math.sin(performance.now() / 260) * 0.35, luz);
    else luz();
  }
  function dibujarMartillo(c, fam, tier) {
    D.mango(c, -170, 150, 10, tier, fam === 3);
    const [s, b] = D.METAL[Math.min(tier, 3)];
    if (fam === 0) {
      bloque(c, -52, -250, 52, -170, tier);
      D.remaches(c, [-30, -210, 30, -210], tier);
    } else if (fam === 1) {
      // maza de pestañas: el cuerpo y seis aletas
      P(c, [-26, -270, 26, -270, 30, -170, -30, -170], b);
      P(c, [-26, -270, 0, -270, 0, -170, -30, -170], s);
      for (let i = 0; i < 3; i++) {
        const y = -260 + i * 30;
        P(c, [-26, y, -50, y + 6, -50, y + 24, -28, y + 28], s);
        P(c, [26, y, 50, y + 6, 50, y + 24, 28, y + 28], b);
      }
      P(c, [-10, -270, 10, -270, 0, -296], s);
    } else if (fam === 2) {
      // cabeza ancha y corta, las caras con bisel
      bloque(c, -78, -244, 78, -176, tier);
      P(c, [-78, -244, -92, -232, -92, -188, -78, -176], s);
      P(c, [78, -244, 92, -232, 92, -188, 78, -176], b);
      P(c, [-30, -248, 30, -248, 30, -172, -30, -172], tier >= 2 ? ORO : s);
      D.runa(c, "thurisaz", 0, -210, 22, Math.max(tier, 3));
    } else if (fam === 3) {
      // la quijada: hueso curvo con dientes
      const H = ["#B8AC98", "#E0D4C0"];
      P(c, [-20, -170, -34, -230, -18, -300, 10, -312, 30, -280, 22, -220, 20, -170], H[1]);
      P(c, [-20, -170, -34, -230, -18, -300, 0, -306, 0, -170], H[0]);
      for (let i = 0; i < 4; i++) P(c, [26, -286 + i * 26, 44, -280 + i * 26, 26, -270 + i * 26], "#F2ECEC");
    } else {
      // piedra atada con tientos
      P(c, [-60, -180, -66, -230, -40, -268, 30, -272, 64, -236, 58, -184, 20, -166, -30, -168], "#8A847C");
      P(c, [-60, -180, -66, -230, -40, -268, 0, -270, 0, -168, -30, -168], "#5E5852");
      P(c, [44, -262, 64, -236, 58, -184, 50, -190, 56, -236], "#B2ACA4");
      for (const y of [-238, -206]) P(c, [-64, y, 62, y - 4, 62, y + 8, -64, y + 12], "#5E130D");
      if (tier >= 2) D.remaches(c, [-40, -222, 40, -222], tier);
    }
    if (fam !== 2) D.runa(c, "uruz", 0, -100, 16, tier);
  }
  D.forma("martillo", dibujarMartillo);
})();
