// ---------- los campeones de la hólmganga (CRIATURAS "kempa") ----------
// Kempur: guerreros que se baten en la piel del hólmr por honra y por plata. Diseño propio, con el trazo de la arena
// (caras planas, mitad izquierda en sombra, sombra elíptica). Casco redondo con nasal, túnica con cinto, brazales,
// escudo redondo pintado y espada. Cinco campeones, cada uno con su color y su escudo (o.pal 0..4). En tres vistas
// (S frente, E costado, N espaldas), base en (0, 0). o.golpe (0..1) levanta la espada; o.escudo (0..1) cuánto escudo
// le queda: con 0 lo lleva partido.
(function () {
  "use strict";
  const { P, E, R, L, sombra } = DIB;
  const PAL = [
    { tun: "#4E6B3A", tunS: "#3A5230", piel: "#D8B094", pielS: "#B8907A", pelo: "#C8A050", esc: "#C8402D", escS: "#9C2315", marca: "#F2ECEC" }, // Ketil el Joven
    { tun: "#3A4A6E", tunS: "#2A3650", piel: "#E8D0BC", pielS: "#C8B09C", pelo: "#2A2420", esc: "#E0C88A", escS: "#B8A06A", marca: "#3A4A6E" }, // Thorgerd Lanza Larga
    { tun: "#6E5238", tunS: "#4E3A28", piel: "#C8987A", pielS: "#A87A5E", pelo: "#6A4A2A", esc: "#5E7A3E", escS: "#3E5A2C", marca: "#FFD98A" }, // Björn el Muro
    { tun: "#7A3A2A", tunS: "#5E2C20", piel: "#E0C0A8", pielS: "#C0A088", pelo: "#B4542A", esc: "#2A2420", escS: "#1A1614", marca: "#FF8D71" }, // Ásgerd la Ligera
    { tun: "#2A2420", tunS: "#1A1614", piel: "#D0A080", pielS: "#AE8064", pelo: "#E8E4DC", esc: "#9C2315", escS: "#5E130D", marca: "#FFD98A" }, // Úlfhild Hija del Oso
  ];
  const HIERRO = "#8E8A86",
    HIERRO_S = "#6E6A66",
    CUERO = "#3A2A1C";

  function piernas(c, Y, pal, paso, costado) {
    if (costado) {
      P(c, [-6, Y(-38), 2, Y(-38), 2 + paso * 0.5, -4, -6 + paso * 0.5, -4], "#3A3026");
      P(c, [-2, Y(-38), 6, Y(-38), 6 - paso * 0.5, -4, -2 - paso * 0.5, -4], "#4A3E32");
      R(c, -8 + paso * 0.5, -6, 11, 6, CUERO);
      R(c, -4 - paso * 0.5, -6, 11, 6, "#2A2018");
      return;
    }
    P(c, [-11, Y(-38), -2, Y(-38), -2 + paso * 0.2, -4, -11 + paso * 0.2, -4], "#3A3026");
    P(c, [2, Y(-38), 11, Y(-38), 11 - paso * 0.2, -4, 2 - paso * 0.2, -4], "#4A3E32");
    R(c, -12 + paso * 0.2, -7, 11, 7, CUERO);
    R(c, 1 - paso * 0.2, -7, 11, 7, "#2A2018");
  }
  function espada(c, x, y, lado, g) {
    c.save();
    c.translate(x, y);
    c.rotate(lado * (0.25 - g * 2.4));
    R(c, -1.5, -8, 3, 10, CUERO);
    R(c, -6, -10, 12, 3, "#B8A06A");
    P(c, [-3, -10, 3, -10, 2.5, -50, 0, -56, -2.5, -50], "#D8D4CE");
    P(c, [-3, -10, 0, -10, 0, -56, -2.5, -50], "#A8A49E");
    c.restore();
  }
  // el escudo redondo pintado: mitad en sombra, el umbo de hierro y la marca del campeón; partido si ya no le quedan
  function escudo(c, x, y, rx, pal, k, ry) {
    ry = ry || rx;
    E(c, x, y, rx, ry, CUERO);
    E(c, x, y, rx - 2, ry - 2, pal.esc);
    P(c, [x - rx + 2, y, x, y - ry + 2, x, y + ry - 2], pal.escS);
    L(c, x - rx * 0.7, y - ry * 0.7, x + rx * 0.7, y + ry * 0.7, pal.marca, Math.max(1.4, rx * 0.12));
    L(c, x - rx * 0.7, y + ry * 0.7, x + rx * 0.7, y - ry * 0.7, pal.marca, Math.max(1.4, rx * 0.12));
    E(c, x, y, rx * 0.28, ry * 0.28, HIERRO);
    if (k <= 0) {
      // partido: falta una cuña
      P(c, [x, y, x + rx, y - ry * 0.4, x + rx, y + ry * 0.5], "#111111");
      L(c, x, y, x - rx * 0.6, y + ry * 0.8, "#111111", 1.6);
    }
  }
  function cabeza(c, cy, pal, atras, costado) {
    if (costado) {
      P(c, [-7, cy + 12, -7, cy - 2, 7, cy - 2, 9, cy + 6, 7, cy + 12], pal.piel);
      P(c, [-7, cy + 12, -7, cy - 2, -1, cy - 2, -1, cy + 12], pal.pielS);
      R(c, 3, cy + 3, 3, 2.5, "#1A1A1E");
      P(c, [-8, cy + 2, -10, cy - 8, 0, cy - 14, 9, cy - 8, 9, cy, -8, cy], HIERRO);
      P(c, [-8, cy + 2, -10, cy - 8, 0, cy - 14, 0, cy, -8, cy], HIERRO_S);
      R(c, 6, cy - 2, 2.5, 9, HIERRO_S);
      P(c, [-8, cy + 4, -12, cy + 16, -4, cy + 12], pal.pelo);
      return;
    }
    P(c, [-9, cy + 12, -9, cy - 2, 9, cy - 2, 9, cy + 12], atras ? pal.pelo : pal.piel);
    P(c, [-9, cy + 12, -9, cy - 2, 0, cy - 2, 0, cy + 12], atras ? pal.pelo : pal.pielS);
    if (!atras) {
      R(c, -6, cy + 3, 3.5, 2.5, "#1A1A1E");
      R(c, 2.5, cy + 3, 3.5, 2.5, "#1A1A1E");
      P(c, [-6, cy + 9, 6, cy + 9, 4, cy + 16, -4, cy + 16], pal.pelo);
    } else P(c, [-9, cy + 10, 0, cy + 22, 9, cy + 10], pal.pelo);
    // casco redondo con nasal
    P(c, [-10, cy + 1, -11, cy - 8, -4, cy - 15, 4, cy - 15, 11, cy - 8, 10, cy + 1], HIERRO);
    P(c, [-10, cy + 1, -11, cy - 8, -4, cy - 15, 0, cy - 15, 0, cy + 1], HIERRO_S);
    R(c, -10, cy - 1, 20, 2.5, "#B8A06A");
    if (!atras) R(c, -1.2, cy, 2.4, 8, HIERRO_S);
  }

  function kempa(c, t, o) {
    const v = o.vista || "S",
      m = o.mov || 0,
      pal = PAL[(o.pal || 0) % PAL.length],
      paso = Math.sin(t * 7.5) * 6 * m,
      g = o.golpe || 0,
      bob = Math.abs(Math.sin(t * 7.5)) * 2 * m,
      k = o.escudo == null ? 1 : o.escudo;
    const Y = (y) => y - bob;
    sombra(c, 0, 0, 25, 7, 0.42);
    if (v === "E") {
      piernas(c, Y, pal, paso, true);
      espada(c, -4, Y(-60), -1, g);
      P(c, [-11, Y(-36), -10, Y(-78), 11, Y(-78), 12, Y(-36)], pal.tunS);
      P(c, [1, Y(-78), 11, Y(-78), 12, Y(-36), 2, Y(-36)], pal.tun);
      R(c, -11, Y(-46), 24, 4, CUERO);
      R(c, 3, Y(-47), 5, 6, "#B8A06A");
      escudo(c, 12, Y(-58), 6, pal, k, 16);
      cabeza(c, Y(-92), pal, false, true);
    } else {
      const atras = v === "N";
      piernas(c, Y, pal, paso, false);
      if (atras) {
        escudo(c, -18, Y(-58), 14, pal, k);
        P(c, [-15, Y(-36), -14, Y(-78), 14, Y(-78), 15, Y(-36)], pal.tunS);
        P(c, [0, Y(-78), 14, Y(-78), 15, Y(-36), 0, Y(-36)], pal.tun);
        R(c, -15, Y(-46), 30, 4, CUERO);
        espada(c, 18, Y(-60), 1, g);
      } else {
        P(c, [-15, Y(-36), -14, Y(-78), 14, Y(-78), 15, Y(-36)], pal.tunS);
        P(c, [0, Y(-78), 14, Y(-78), 15, Y(-36), 0, Y(-36)], pal.tun);
        // cuello de la túnica, cinto con hebilla y brazales
        P(c, [-6, Y(-78), 6, Y(-78), 0, Y(-68)], pal.pielS);
        R(c, -15, Y(-46), 30, 4, CUERO);
        R(c, -3, Y(-47), 6, 6, "#B8A06A");
        R(c, 14, Y(-62), 6, 8, CUERO);
        P(c, [14, Y(-74), 20, Y(-73), 20, Y(-62), 14, Y(-62)], pal.piel);
        espada(c, 18, Y(-56), 1, g);
        escudo(c, -19, Y(-56), 14, pal, k);
      }
      cabeza(c, Y(-92), pal, atras, false);
    }
  }
  CRIATURAS.registrar("kempa", kempa);
  window.KEMPUR_DIBUJO = { PAL, escudo };
})();
