// ---------- los Sin Linde: bandidos del bosque (se suman a CRIATURAS) ----------
// Útlagi: gente que el Ting echó fuera de la ley y que vive en el bosque, fuera de toda linde. Diseños propios, en tres
// vistas (S frente, E costado, N espaldas), base en (0, 0), con el trazo de la arena (caras planas, mitad izquierda
// en sombra). Tres variantes de color (o.pal): trapos rojos de los Sin Linde, piel de lobo gris y verde de monte.
//  · Bandido: capucha con una tira de tela que tapa la boca, chaleco de cuero, escudo remendado y hacha corta.
//  · Arquero: capucha larga, carcaj a la espalda y arco de tejo; tensa el arco durante el aviso.
// El rasgo de todos: una linde partida (un rombo cortado al medio) pintada en el pecho o en el escudo.
(function () {
  "use strict";
  const { P, E, R, L, sombra } = DIB;
  const PAL = [
    { capa: "#9C2315", capaS: "#5E130D", ropa: "#5A4432", ropaS: "#3E2E22", piel: "#C8987A", pielS: "#A87A5E", marca: "#FF8D71" }, // trapos rojos
    { capa: "#6E6A66", capaS: "#4E4A46", ropa: "#3A3432", ropaS: "#262220", piel: "#D8B8A0", pielS: "#B8987E", marca: "#C8402D" }, // piel de lobo
    { capa: "#4E5A3E", capaS: "#3A4430", ropa: "#5A4A36", ropaS: "#3E3226", piel: "#C0906E", pielS: "#9E7254", marca: "#FFD98A" }, // verde de monte
  ];
  // la linde partida: un rombo cortado por una raya
  function linde(c, x, y, s, col) {
    P(c, [x, y - s, x + s * 0.8, y, x, y + s, x - s * 0.8, y], col);
    L(c, x - s * 0.9, y + s * 0.5, x + s * 0.9, y - s * 0.5, "#111111", Math.max(1.5, s * 0.3));
  }
  // la cabeza encapuchada (frente o espaldas)
  function capucha(c, cy, pal, atras) {
    P(c, [-13, cy + 14, -14, cy - 6, -8, cy - 18, 8, cy - 18, 14, cy - 6, 13, cy + 14], pal.capa);
    P(c, [-13, cy + 14, -14, cy - 6, -8, cy - 18, 0, cy - 18, 0, cy + 14], pal.capaS);
    if (atras) {
      P(c, [-6, cy + 14, 0, cy + 26, 6, cy + 14], pal.capaS);
      return;
    }
    // la cara en la sombra de la capucha, los ojos y la tira que tapa la boca
    P(c, [-8, cy + 10, -8, cy - 6, 8, cy - 6, 8, cy + 10], pal.pielS);
    P(c, [0, cy + 10, 0, cy - 6, 8, cy - 6, 8, cy + 10], pal.piel);
    R(c, -6, cy - 2, 4, 2.5, "#111111");
    R(c, 2, cy - 2, 4, 2.5, "#111111");
    P(c, [-9, cy + 2, 9, cy + 2, 9, cy + 11, -9, cy + 11], pal.capaS);
    P(c, [0, cy + 2, 9, cy + 2, 9, cy + 11, 0, cy + 11], pal.capa);
  }
  function capuchaCostado(c, cy, pal) {
    P(c, [-12, cy + 14, -14, cy - 4, -6, cy - 18, 6, cy - 18, 12, cy - 6, 12, cy + 14], pal.capa);
    P(c, [-12, cy + 14, -14, cy - 4, -6, cy - 18, -2, cy - 18, -2, cy + 14], pal.capaS);
    P(c, [4, cy + 10, 4, cy - 6, 12, cy - 4, 12, cy + 10], pal.piel);
    R(c, 8, cy - 2, 3.5, 2.5, "#111111");
    P(c, [2, cy + 2, 13, cy + 2, 13, cy + 11, 2, cy + 11], pal.capaS);
  }
  function piernas(c, Y, pal, paso, costado) {
    if (costado) {
      P(c, [-8, Y(-38), 0, Y(-38), 2 - paso, 0, -6 - paso, 0], pal.ropaS);
      P(c, [-4, Y(-38), 4, Y(-38), 6 + paso, 0, -2 + paso, 0], pal.ropa);
      R(c, -8 + paso, -5, 12, 5, "#2A2018");
      return;
    }
    P(c, [-11, Y(-38), -3, Y(-38), -3 + paso * 0.3, 0, -11 + paso * 0.3, 0], pal.ropaS);
    P(c, [3, Y(-38), 11, Y(-38), 11 - paso * 0.3, 0, 3 - paso * 0.3, 0], pal.ropa);
    R(c, -12 + paso * 0.3, -5, 10, 5, "#2A2018");
    R(c, 2 - paso * 0.3, -5, 10, 5, "#2A2018");
  }

  // ---------- Bandido ----------
  function bandido(c, t, o) {
    const v = o.vista || "S",
      m = o.mov || 0,
      pal = PAL[o.pal || 0],
      paso = Math.sin(t * 7) * 6 * m,
      g = o.golpe || 0,
      bob = Math.abs(Math.sin(t * 7)) * 2 * m;
    const Y = (y) => y - bob;
    sombra(c, 0, 0, 24, 7, 0.42);
    const hacha = (hx, hy, lado) => {
      c.save();
      c.translate(hx, hy);
      c.rotate(lado * (0.4 - g * 2.6));
      R(c, -2, -38, 4, 46, "#553A22");
      P(c, [2, -38, 14, -44, 16, -28, 2, -28], "#B8B0A8");
      P(c, [2, -38, 8, -41, 8, -28, 2, -28], "#8A847E");
      c.restore();
    };
    const escudo = (x, y, w) => {
      E(c, x, y, w, 16, "#7A5634");
      P(c, [x - w, y, x, y - 16, x, y + 16], "#553A22");
      L(c, x - w * 0.7, y - 8, x + w * 0.7, y - 8, "#3A2A1C", 1.5);
      linde(c, x, y + 2, 6, pal.marca);
    };
    if (v === "E") {
      piernas(c, Y, pal, paso, true);
      P(c, [-8, Y(-76), -20, Y(-36) + Math.sin(t * 3) * 3, -6, Y(-40)], pal.capaS);
      P(c, [-11, Y(-38), -10, Y(-76), 11, Y(-78), 12, Y(-38)], pal.ropaS);
      P(c, [2, Y(-78), 11, Y(-78), 12, Y(-38), 3, Y(-38)], pal.ropa);
      R(c, -11, Y(-44), 24, 4, "#2A2018");
      escudo(13, Y(-56), 6);
      hacha(-2, Y(-64), -1);
      capuchaCostado(c, Y(-92), pal);
    } else {
      const atras = v === "N";
      piernas(c, Y, pal, paso, false);
      if (atras) {
        P(c, [-16, Y(-78), 16, Y(-78), 18, Y(-30), 8, Y(-34), 0, Y(-26), -8, Y(-34), -18, Y(-30)], pal.capa);
        P(c, [-16, Y(-78), 0, Y(-78), 0, Y(-26), -8, Y(-34), -18, Y(-30)], pal.capaS);
        escudo(-18, Y(-56), 12);
        hacha(18, Y(-64), 1);
      } else {
        // chaleco de cuero sobre la camisa, cinto y la linde partida pintada en el pecho
        P(c, [-16, Y(-38), -14, Y(-78), 14, Y(-78), 16, Y(-38)], pal.ropaS);
        P(c, [0, Y(-78), 14, Y(-78), 16, Y(-38), 0, Y(-38)], pal.ropa);
        P(c, [-6, Y(-78), 6, Y(-78), 3, Y(-52), -3, Y(-52)], pal.capaS);
        R(c, -16, Y(-44), 32, 4, "#2A2018");
        R(c, -3, Y(-45), 6, 6, "#8A847E");
        linde(c, 8, Y(-64), 4, pal.marca);
        // trapo atado al brazo
        P(c, [14, Y(-74), 21, Y(-73), 21, Y(-66), 14, Y(-67)], pal.capa);
        escudo(-20, Y(-54), 12);
        hacha(19, Y(-64), 1);
        P(c, [15, Y(-66), 21, Y(-66), 21, Y(-52), 15, Y(-52)], pal.piel);
      }
      capucha(c, Y(-92), pal, atras);
    }
  }

  // ---------- Arquero ----------
  function arquero(c, t, o) {
    const v = o.vista || "S",
      m = o.mov || 0,
      pal = PAL[o.pal || 0],
      paso = Math.sin(t * 7) * 6 * m,
      g = Math.min(1, (o.golpe || 0) * 1.5),
      bob = Math.abs(Math.sin(t * 7)) * 2 * m;
    const Y = (y) => y - bob;
    sombra(c, 0, 0, 22, 6, 0.4);
    const TEJO = "#6E4A2C",
      CUERDA = "#E0D8C8";
    // el arco: de lado al frente; tensado, la cuerda llega atrás con la flecha
    const arco = (x, y, dir) => {
      const ten = 4 + g * 14;
      c.strokeStyle = TEJO;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(x, y - 26);
      c.quadraticCurveTo(x + dir * 14, y, x, y + 26);
      c.stroke();
      L(c, x, y - 26, x - dir * ten, y, CUERDA, 1);
      L(c, x - dir * ten, y, x, y + 26, CUERDA, 1);
      if (g > 0.05) {
        L(c, x - dir * ten, y, x + dir * 22, y, "#B8B0A8", 1.6);
        P(c, [x + dir * 22, y - 3, x + dir * 28, y, x + dir * 22, y + 3], "#8A847E");
        P(c, [x - dir * ten, y, x - dir * (ten + 5), y - 3, x - dir * (ten + 5), y + 3], pal.marca);
      }
    };
    const carcaj = (x, y, ang) => {
      c.save();
      c.translate(x, y);
      c.rotate(ang);
      R(c, -4, -18, 8, 30, "#553A22");
      R(c, -4, -18, 3, 30, "#3A2A1C");
      [-2, 0, 2].forEach((k) => P(c, [k - 2, -18, k, -26, k + 2, -18], k ? pal.marca : "#F2ECEC"));
      c.restore();
    };
    if (v === "E") {
      piernas(c, Y, pal, paso, true);
      carcaj(-8, Y(-62), -0.3);
      P(c, [-10, Y(-38), -9, Y(-76), 10, Y(-78), 11, Y(-38)], pal.capaS);
      P(c, [1, Y(-78), 10, Y(-78), 11, Y(-38), 2, Y(-38)], pal.capa);
      R(c, -10, Y(-46), 22, 4, "#2A2018");
      arco(16, Y(-62), 1);
      P(c, [4, Y(-70), 16, Y(-64), 14, Y(-60), 4, Y(-64)], pal.piel);
      capuchaCostado(c, Y(-92), pal);
    } else {
      const atras = v === "N";
      piernas(c, Y, pal, paso, false);
      if (atras) {
        // capa larga y el carcaj bien a la vista
        P(c, [-15, Y(-78), 15, Y(-78), 17, Y(-22), -17, Y(-22)], pal.capa);
        P(c, [-15, Y(-78), 0, Y(-78), 0, Y(-22), -17, Y(-22)], pal.capaS);
        carcaj(6, Y(-60), 0.35);
        arco(-18, Y(-58), -1);
      } else {
        P(c, [-15, Y(-38), -14, Y(-78), 14, Y(-78), 15, Y(-38)], pal.ropaS);
        P(c, [0, Y(-78), 14, Y(-78), 15, Y(-38), 0, Y(-38)], pal.ropa);
        // la capa abierta cae por los costados
        P(c, [-16, Y(-78), -10, Y(-78), -12, Y(-26), -18, Y(-30)], pal.capaS);
        P(c, [10, Y(-78), 16, Y(-78), 18, Y(-30), 12, Y(-26)], pal.capa);
        R(c, -15, Y(-46), 30, 4, "#2A2018");
        L(c, -12, Y(-78), 12, Y(-46), "#3A2A1C", 2.5);
        linde(c, -6, Y(-62), 4, pal.marca);
        arco(20, Y(-60), 1);
        P(c, [12, Y(-70), 20, Y(-66), 20, Y(-58), 12, Y(-62)], pal.piel);
      }
      capucha(c, Y(-92), pal, atras);
    }
  }

  CRIATURAS.registrar("bandido", bandido);
  CRIATURAS.registrar("arquero", arquero);
  window.BANDIDOS_DIBUJO = { linde, PAL };
})();
