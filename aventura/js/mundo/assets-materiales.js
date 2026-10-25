// ---------- las vetas del bosque: de donde sale el material de la forja (assets de MATERIALES) ----------
// Tres piedras con nombre que se pican a golpes (motor/materiales.js): la veta de hierro de pantano (la piedra
// herrumbrada de las turberas, con las costras rojas que los herreros de Eldervald funden), el nódulo de ámbar (la
// roca vieja con resina de pino fósil que asoma en gotas doradas) y la vena rúnica (la piedra partida donde la luz de
// las runas se cuajó en esquirlas). Se ven igual de cualquier lado: figuras. o.golpes (0..3): las rajaduras que le
// dejaron los golpes; o.agotada: la piedra pelada, sin nada, hasta que vuelve a crecer.
// Mismo estilo que el resto: caras planas, luz de arriba a la derecha, la mitad izquierda en sombra, sombra elíptica.
(function () {
  "use strict";
  const { P, E, L, sombra, halo, RUNICO, RUNICO_CLARO } = DIB;
  const C = ASSETS.C;
  const ORO = "#FFD98A";

  // el cuerpo de piedra de las tres: un bloque bajo con la cara de luz a la derecha y musgo arriba
  function cuerpo(c, x, y, s, pal, musgo) {
    const X = (v) => x + v * s,
      Y = (v) => y - v * s,
      pp = (a, col) => P(c, a.map((v, i) => (i % 2 ? Y(v) : X(v))), col);
    sombra(c, X(8), y + 3 * s, 46 * s, 12 * s, 0.36);
    pp([-40, 0, -34, 26, -14, 42, 12, 46, 34, 32, 42, 0], pal[1]);
    pp([12, 46, 34, 32, 42, 0, 14, 0, 6, 24], pal[2]);
    pp([-40, 0, -34, 26, -20, 18, -24, 0], pal[0]);
    if (musgo) {
      pp([-34, 26, -14, 42, 12, 46, 0, 38, -18, 32], C.musgo2);
      pp([-14, 42, 12, 46, 2, 42], C.musgoClaro);
    }
    return { X, Y, pp };
  }
  // las rajaduras que dejan los golpes
  function rajas(c, x, y, s, n) {
    const R = [
      [-6, 40, 2, 26, -8, 14],
      [24, 34, 16, 22, 22, 8],
      [-26, 22, -14, 16, -18, 4],
    ];
    for (let i = 0; i < Math.min(3, n || 0); i++) {
      const r = R[i];
      L(c, x + r[0] * s, y - r[1] * s, x + r[2] * s, y - r[3] * s, "#2A2624", 2.4 * s);
      L(c, x + r[2] * s, y - r[3] * s, x + r[4] * s, y - r[5] * s, "#2A2624", 2 * s);
    }
  }
  // la piedra pelada (agotada): más baja, con el hueco claro donde estaba la veta
  function pelada(c, x, y, s, pal) {
    const { pp } = cuerpo(c, x, y, s * 0.8, pal, false);
    const X = (v) => x + v * s * 0.8,
      Y = (v) => y - v * s * 0.8;
    P(c, [X(-12), Y(30), X(10), Y(36), X(18), Y(22), X(-4), Y(18)], "#3A3634");
    P(c, [X(2), Y(34), X(10), Y(36), X(18), Y(22), X(8), Y(24)], pal[0]);
    return pp;
  }

  // ---------- la veta de hierro de pantano ----------
  // La piedra de las turberas: oscura y húmeda, con costras herrumbradas (el hierro que se junta en el barro) que
  // los herreros raspan y funden. Charquito de agua roja al pie.
  const PAL_HIERRO = ["#3E3A36", "#56504A", "#6E6860"];
  function vetaHierro(c, x, y, t, o) {
    const s = o.s || 1;
    if (o.agotada) return pelada(c, x, y, s, PAL_HIERRO);
    E(c, x - 30 * s, y + 4 * s, 18 * s, 5 * s, "#5E2A1A");
    E(c, x - 30 * s, y + 3 * s, 12 * s, 3 * s, "#7A3A22");
    const { pp } = cuerpo(c, x, y, s, PAL_HIERRO, true);
    // las costras: manchas óxido con la cara de luz más clara
    [[-22, 14, 9], [6, 20, 11], [28, 14, 7], [-6, 32, 6]].forEach(([cx, cy, r], i) => {
      pp([cx - r, cy, cx - r * 0.4, cy + r * 0.8, cx + r, cy + r * 0.3, cx + r * 0.6, cy - r * 0.7], "#8A3A1E");
      pp([cx - r * 0.4, cy + r * 0.8, cx + r, cy + r * 0.3, cx + r * 0.2, cy + r * 0.1], i % 2 ? "#C8402D" : "#B0552E");
    });
    rajas(c, x, y, s, o.golpes);
  }

  // ---------- el nódulo de ámbar ----------
  // Una roca vieja que se tragó un pino fósil: la resina asoma en gotas doradas y una grande, con un mosquito
  // adentro, en la cara de luz. Brilla poquito al sol.
  const PAL_AMBAR = ["#4A4640", "#625C52", "#7E766A"];
  function vetaAmbar(c, x, y, t, o) {
    const s = o.s || 1;
    if (o.agotada) return pelada(c, x, y, s, PAL_AMBAR);
    halo(c, x + 10 * s, y - 24 * s, 50 * s, ORO, 0.18);
    const { pp } = cuerpo(c, x, y, s, PAL_AMBAR, true);
    // la gota grande
    pp([6, 12, 2, 24, 10, 34, 22, 32, 26, 20, 18, 10], "#C88A2A");
    pp([10, 34, 22, 32, 26, 20, 16, 24], "#F5A524");
    pp([16, 30, 22, 28, 22, 24, 18, 26], ORO);
    L(c, x + 12 * s, y - 20 * s, x + 15 * s, y - 22 * s, "#3A2A12", 1.4 * s);
    // las gotas chicas
    [[-24, 18], [-10, 30], [30, 8]].forEach(([gx, gy]) => {
      E(c, x + gx * s, y - gy * s, 4 * s, 5 * s, "#C88A2A");
      E(c, x + (gx + 1) * s, y - (gy + 1) * s, 2 * s, 3 * s, "#F5A524");
    });
    rajas(c, x, y, s, o.golpes);
  }

  // ---------- la vena rúnica ----------
  // Una piedra partida al medio por donde la luz de las runas se cuajó: esquirlas de cristal turquesa que salen de la
  // grieta y laten. Una runa Ingwaz tallada vieja en el costado.
  const PAL_RUNA = ["#3A3E46", "#4E5460", "#666C78"];
  function vetaRunica(c, x, y, t, o) {
    const s = o.s || 1;
    if (o.agotada) return pelada(c, x, y, s, PAL_RUNA);
    const late = 0.55 + 0.45 * Math.sin((t || 0) * 2.2 + (o.sem || 0));
    halo(c, x, y - 40 * s, 80 * s, RUNICO, 0.2 + late * 0.25);
    const { pp } = cuerpo(c, x, y, s, PAL_RUNA, false);
    // la grieta
    pp([-6, 46, 4, 46, 6, 0, -8, 0], "#1E2228");
    // las esquirlas: prismas con la cara de luz clara
    [[-4, 40, 8, 34], [6, 44, 6, 26], [-16, 34, 6, 20], [14, 30, 5, 18]].forEach(([ex, ey, w, h]) => {
      pp([ex - w, ey, ex, ey + h, ex + w, ey, ex, ey - 8], "#2E5A66");
      pp([ex, ey + h, ex + w, ey, ex, ey - 8], late > 0.7 ? RUNICO_CLARO : RUNICO);
    });
    FUTHARK.dibujar(c, "ingwaz", x - 26 * s, y - 10 * s, 14 * s, "#73D5DB", 2 * s);
    rajas(c, x, y, s, o.golpes);
  }

  Object.assign(ASSETS.LISTA, {
    vetaHierro: { f: vetaHierro, figura: true, alto: 50, choque: { r: 30 }, grupo: "vetas" },
    vetaAmbar: { f: vetaAmbar, figura: true, alto: 50, choque: { r: 30 }, grupo: "vetas", luz: true },
    vetaRunica: { f: vetaRunica, figura: true, alto: 60, choque: { r: 30 }, grupo: "vetas", luz: true },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, {
    vetaHierro: { golpes: 1 },
    vetaRunica: { golpes: 0 },
  });
})();
