// ---------- el dibujo de los bastones rúnicos (forma "baston" de DIB_ARMAS) ----------
// Los bastones de seiðr de las völvas: un asta larga con el agarre en el origen y la cabeza arriba (y negativa), con
// la luz rúnica #73D5DB en la punta. Mismo lenguaje que las espadas de la arena: caras planas, la mitad en sombra.
// Familias: 0 vara de fresno con nudo · 1 báculo de la völva (jaula de bronce con anillas) · 2 bastón rúnico
// (cristal) · 3 de hueso (cuernos de ciervo) · 4 rama de Yggdrasil (ramas que se enroscan con hojas).
(function () {
  "use strict";
  const P = (c, pts, col) => DIB.P(c, pts, col);
  const D = DIB_ARMAS,
    ORO = "#FFD98A",
    RUNA = "#73D5DB",
    BRONCE = ["#7A5634", "#C9A45A"];
  const late = () => 0.65 + Math.sin(performance.now() / 260) * 0.35;
  // la luz de la punta: un rombo que late (más grande cuanto mejor el bastón)
  function luz(c, x, y, tier, col) {
    const s = 12 + tier * 3;
    DIB.alfa(c, 0.25 * late(), () => P(c, [x, y - s * 2, x + s * 2, y, x, y + s * 2, x - s * 2, y], col));
    DIB.alfa(c, 0.9, () => P(c, [x, y - s, x + s, y, x, y + s, x - s, y], col));
    P(c, [x, y - s * 0.45, x + s * 0.45, y, x, y + s * 0.45, x - s * 0.45, y], "#F2ECEC");
  }
  function dibujarBaston(c, fam, tier) {
    const col = tier === 4 ? "#F5A524" : RUNA;
    D.mango(c, -220, 230, 9, tier, fam === 3);
    if (fam === 0) {
      // el nudo de la vara y la luz encima
      P(c, [-16, -220, 16, -220, 20, -250, 8, -276, -10, -272, -20, -246], "#7A5634");
      P(c, [-16, -220, 0, -220, 0, -274, -10, -272, -20, -246], "#553A22");
      luz(c, 0, -300, tier, col);
    } else if (fam === 1) {
      // la jaula de bronce con la luz adentro y dos anillas
      luz(c, 0, -282, tier, col);
      for (const x of [-22, 22]) P(c, [x - 3, -226, x + 3, -226, x * 0.5 + 3, -330, x * 0.5 - 3, -330], x < 0 ? BRONCE[0] : BRONCE[1]);
      P(c, [-14, -334, 14, -334, 0, -352], BRONCE[1]);
      P(c, [-26, -230, 26, -230, 26, -220, -26, -220], BRONCE[1]);
      for (const x of [-30, 30]) DIB.E(c, x, -246, 7, 10, tier >= 2 ? ORO : BRONCE[0]);
    } else if (fam === 2) {
      // el cristal tallado
      P(c, [0, -360, 22, -300, 12, -230, -12, -230, -22, -300], "#4A9AA0");
      P(c, [0, -360, 0, -230, -12, -230, -22, -300], "#2E6A70");
      DIB.alfa(c, late(), () => P(c, [0, -350, 10, -300, 0, -250, -6, -300], "#B8F0F2"));
      P(c, [-18, -232, 18, -232, 14, -214, -14, -214], tier >= 2 ? ORO : "#5E130D");
      luz(c, 0, -300, Math.max(0, tier - 2), col);
    } else if (fam === 3) {
      // los cuernos
      const H = ["#B8AC98", "#E0D4C0"];
      for (const l of [-1, 1]) {
        P(c, [0, -220, l * 18, -260, l * 46, -300, l * 60, -350, l * 50, -352, l * 36, -306, l * 8, -262], l < 0 ? H[0] : H[1]);
        P(c, [l * 30, -290, l * 56, -296, l * 54, -288, l * 34, -282], l < 0 ? H[0] : H[1]);
      }
      luz(c, 0, -280, tier, col);
    } else {
      // las ramas de Yggdrasil y sus hojas
      for (const l of [-1, 1]) {
        P(c, [l * 4, -220, l * 26, -270, l * 14, -320, l * 30, -360, l * 22, -362, l * 4, -322, l * 14, -272, -l * 4, -226], l < 0 ? "#553A22" : "#7A5634");
        for (const y of [-280, -330]) P(c, [l * 24, y, l * 44, y - 10, l * 40, y + 6], "#4E7A3A");
      }
      luz(c, 0, -330, tier, col);
    }
    D.runa(c, fam === 2 ? "ansuz" : "laguz", 0, -120, 16, tier);
  }
  D.forma("baston", dibujarBaston);
  D.ICONO.baston = { k: 0.9, x: 0, y: 40 };
})();
