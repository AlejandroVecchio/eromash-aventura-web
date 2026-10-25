// ---------- el petate de pieles (asset de DESCANSO) ----------
// Donde Eromash duerme fuera de las casas: una piel de oso tendida en el piso, la manta enrollada de cabecera, el
// morral con la correa y un palo de fresno clavado con un trapo rojo (para encontrarlo de lejos). Va junto a los
// fogones de los refugios y del paso. o.usado: ya se durmió ahí esta noche (la piel queda revuelta).
// Mismo estilo de siempre: caras planas, luz de arriba a la derecha, la mitad izquierda en sombra, sombra elíptica.
(function () {
  "use strict";
  const { P, E, L, sombra } = DIB;
  const C = ASSETS.C;
  const madera = C.madera || "#7A5634",
    maderaS = C.maderaSombra || "#553A22";
  const PIEL = "#6E4A32",
    PIEL_S = "#553826",
    PIEL_L = "#8A6040",
    MANTA = "#9C2315",
    MANTA_S = "#5E130D";

  function petateEromash(c, x, y, t, o) {
    const s = o.s || 1,
      X = (v) => x + v * s,
      Y = (v) => y - v * s,
      pp = (a, col) => P(c, a.map((v, i) => (i % 2 ? Y(v) : X(v))), col);
    sombra(c, X(2), y + 3 * s, 66 * s, 16 * s, 0.3);
    // la piel tendida, con las patas abiertas a los costados (en perspectiva: un rombo bajo)
    pp([-60, 2, -40, -8, 44, -8, 62, 4, 46, 16, -44, 16], PIEL_S);
    pp([-56, 4, -38, -5, 42, -5, 58, 5, 44, 14, -42, 14], PIEL);
    pp([0, -5, 42, -5, 58, 5, 44, 14, 0, 14], PIEL_L);
    pp([-62, 10, -52, 6, -50, 14], PIEL_S);
    pp([60, 12, 50, 8, 48, 16], PIEL);
    // revuelta si ya se durmió
    if (o.usado) pp([-10, 2, 6, 8, 20, 2, 4, -1], PIEL_S);
    // la manta enrollada de cabecera (un cilindro rojo con la cara de la punta)
    pp([-46, 6, -18, 6, -18, 22, -46, 22], MANTA_S);
    pp([-32, 6, -18, 6, -18, 22, -32, 22], MANTA);
    E(c, X(-18), Y(14), 5 * s, 8 * s, "#C8402D");
    E(c, X(-18), Y(14), 2 * s, 4 * s, MANTA_S);
    L(c, X(-38), Y(6), X(-38), Y(22), "#C8B48C", 1.6 * s);
    // el morral al pie, con su correa
    pp([30, 6, 48, 6, 46, 24, 32, 24], maderaS);
    pp([39, 6, 48, 6, 46, 24, 39, 24], madera);
    pp([32, 24, 46, 24, 42, 28, 36, 28], "#9A7650");
    L(c, X(34), Y(26), X(26), Y(10), "#553A22", 1.6 * s);
    // el palo de fresno con el trapo rojo
    pp([54, 0, 57, 0, 57, 64, 54, 64], maderaS);
    pp([55.5, 0, 57, 0, 57, 64, 55.5, 64], madera);
    const v = Math.sin((t || 0) * 2.2 + (o.sem || 0)) * 3;
    pp([57, 62, 72 + v, 58, 70 + v, 50, 57, 52], MANTA);
    pp([57, 57, 70 + v, 54, 70 + v, 50, 57, 52], MANTA_S);
  }

  Object.assign(ASSETS.LISTA, {
    petateEromash: { f: petateEromash, figura: true, alto: 66, choque: null, grupo: "descanso" },
  });
})();
