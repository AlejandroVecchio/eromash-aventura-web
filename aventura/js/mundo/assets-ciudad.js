// ---------- la capital en 2.5D (se suma a ASSETS) ----------
// Lo que la capital necesita además de las casas de CASAS25: la chimenea de piedra de la herrería de Ása, alta y cónica,
// con el humo oscuro que se ve desde toda la ciudad. Mismas reglas que assets.js: caras planas, luz de arriba a la
// derecha (la mitad izquierda en sombra), sombra elíptica en el piso.
(function () {
  "use strict";
  const { P, E, R, alfa, azar, sombra, halo } = DIB;
  const C = ASSETS.C;
  const nivel = () => (window.CALIDAD ? CALIDAD.nivel : "alta");

  // La chimenea de la herrería: un cono de piedra con hileras de bloques, la boca de la fragua encendida al pie y una
  // columna de humo oscuro que sube torcida.
  function chimeneaHerreria(c, x, y, t, o) {
    const s = o.s || 1,
      h = 330 * s,
      b = 62 * s,
      a = 26 * s,
      r = azar(4711);
    sombra(c, x + 16 * s, y + 4 * s, b * 1.4, 18 * s, 0.4);
    P(c, [x - b, y, x - a, y - h, x + a, y - h, x + b, y], "#55534E");
    P(c, [x + 4 * s, y, x + 4 * s, y - h, x + a, y - h, x + b, y], "#6E6A62");
    for (let k = 1; k < 14; k++) {
      const u = k / 14,
        w = b + (a - b) * u,
        yy = y - h * u;
      R(c, x - w, yy, w * 2, 2.5 * s, "#3E3C38");
      for (let j = 0; j < 4; j++) if (r() < 0.5) R(c, x - w + r() * w * 2, yy - 10 * s, 2.5 * s, 10 * s, "#3E3C38");
    }
    R(c, x - a - 6 * s, y - h - 8 * s, (a + 6 * s) * 2, 10 * s, "#46423C");
    // la boca de la fragua
    P(c, [x - 26 * s, y, x - 26 * s, y - 40 * s, x, y - 56 * s, x + 26 * s, y - 40 * s, x + 26 * s, y], "#1A140E");
    const brasa = 0.75 + Math.sin(t * 5) * 0.15;
    alfa(c, brasa, () => P(c, [x - 18 * s, y, x - 18 * s, y - 30 * s, x, y - 42 * s, x + 18 * s, y - 30 * s, x + 18 * s, y], C.ambarFuerte));
    alfa(c, brasa * 0.8, () => E(c, x, y - 12 * s, 12 * s, 9 * s, C.ambar));
    halo(c, x, y - 20 * s, 120 * s, C.ambarFuerte, brasa);
    // el humo
    if (nivel() !== "baja")
      for (let k = 0; k < 9; k++) {
        const p = (t * 0.12 + k / 9) % 1;
        alfa(c, 0.5 * (1 - p), () => E(c, x + Math.sin(p * 4 + k) * 30 * s + p * 90 * s, y - h - 20 * s - p * 420 * s, (18 + p * 60) * s, (14 + p * 40) * s, k % 2 ? "#2A2A2C" : "#3A3A3C"));
      }
  }

  Object.assign(ASSETS.LISTA, {
    chimeneaHerreria: { f: chimeneaHerreria, alto: 700, choque: { r: 50 }, grupo: "capital", luz: true },
  });
})();
