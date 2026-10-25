// ---------- los contratos de caza (assets de CONTRATOS) ----------
// Lo que pone motor/contratos.js: el poste de los contratos frente al Puesto de Eydis (un palo de fresno con su
// travesaño, los pedidos clavados con la marca de la bestia, un farol y la campanita que suena al tomar uno) y los
// rastros que deja cada bestia en el piso (huellas, sangre, mechones, escarcha o cenizas según qué es).
// Mismo estilo que el resto: caras planas, luz de arriba a la derecha, la mitad izquierda en sombra, sombra elíptica.
(function () {
  "use strict";
  const { P, E, L, sombra, halo } = DIB;
  const C = ASSETS.C;
  const ORO = "#FFD98A";
  const madera = C.madera || "#7A5634",
    maderaS = C.maderaSombra || "#553A22",
    maderaL = C.maderaLuz || "#9A7650";

  // ---------- el poste de los contratos ----------
  // o.n: cuántos pedidos quedan clavados (0 a 6) · o.tomado: el que se tomó, arrancado a medias
  function posteContratos(c, x, y, t, o) {
    const s = o.s || 1,
      X = (v) => x + v * s,
      Y = (v) => y - v * s,
      pp = (a, col) => P(c, a.map((v, i) => (i % 2 ? Y(v) : X(v))), col);
    sombra(c, X(10), y + 3 * s, 54 * s, 12 * s, 0.36);
    // el palo
    pp([-7, 0, -6, 190, 6, 190, 7, 0], madera);
    pp([-7, 0, -6, 190, 0, 190, 0, 0], maderaS);
    // el travesaño con el techito
    pp([-62, 168, -62, 180, 62, 180, 62, 168], madera);
    pp([-62, 168, -62, 174, 62, 174, 62, 168], maderaS);
    pp([-72, 182, 0, 206, 72, 182, 66, 178, 0, 198, -66, 178], "#5E130D");
    pp([0, 206, 72, 182, 66, 178, 0, 198], "#9C2315");
    // la tabla de los pedidos
    pp([-54, 70, -54, 164, 54, 164, 54, 70], maderaS);
    pp([-50, 74, -50, 160, 50, 160, 50, 74], madera);
    pp([0, 74, 50, 74, 50, 160, 0, 160], maderaL);
    // los pedidos clavados: pergaminos con la marca de la garra
    const n = o.n == null ? 4 : o.n;
    const lugares = [[-34, 140], [-8, 146], [20, 138], [-30, 100], [0, 104], [28, 98]];
    for (let i = 0; i < Math.min(6, n); i++) {
      const [px, py] = lugares[i],
        g = ((i * 37) % 9) - 4;
      pp([px - 11, py + 13, px + 11, py + 13 + g * 0.2, px + 12, py - 13, px - 10, py - 13 - g * 0.2], "#E8DCC0");
      pp([px, py + 13, px + 11, py + 13 + g * 0.2, px + 12, py - 13, px + 1, py - 13], "#F2ECEC");
      // las tres rayas de la garra
      for (let k = -1; k <= 1; k++) L(c, X(px - 5 + k * 4), Y(py + 7), X(px - 1 + k * 4), Y(py - 6), "#9C2315", 1.4 * s);
      E(c, X(px), Y(py + 12), 1.6 * s, 1.6 * s, "#3A3634");
    }
    // el farol colgado del travesaño
    L(c, X(52), Y(168), X(52), Y(150), "#3A3634", 1.6 * s);
    pp([46, 150, 58, 150, 60, 132, 44, 132], "#3A3634");
    pp([48, 148, 56, 148, 57, 135, 47, 135], ORO);
    halo(c, X(52), Y(142), 46 * s, ORO, 0.35);
    // la campanita
    L(c, X(-52), Y(168), X(-52), Y(156), "#3A3634", 1.2 * s);
    const mece = Math.sin((t || 0) * 2 + (o.sem || 0)) * (o.suena ? 6 : 1.2);
    pp([-58 + mece * 0.3, 140, -46 + mece * 0.3, 140, -48, 156, -56, 156], "#C8A04A");
    pp([-52, 140, -46 + mece * 0.3, 140, -48, 156, -52, 156], ORO);
  }

  // ---------- los rastros de una bestia ----------
  // o.tipo: lobo · jabali · draugr · fatuo · trol · cuervo · o.visto: ya leído (más tenue) · o.brillo: la Lente lo resalta
  function rastroContrato(c, x, y, t, o) {
    const s = o.s || 1,
      a = o.visto ? 0.5 : 1,
      tipo = o.tipo || "lobo";
    c.save();
    c.globalAlpha *= a;
    if (o.brillo) halo(c, x, y, 70 * s, "#73D5DB", 0.25 + 0.15 * Math.sin((t || 0) * 3));
    const huella = (hx, hy, r, col, dedos) => {
      E(c, x + hx * s, y + hy * s, r * s, r * 0.7 * s, col);
      for (let k = 0; k < dedos; k++) E(c, x + (hx - r * 0.8 + k * ((r * 1.6) / Math.max(1, dedos - 1))) * s, y + (hy - r * 0.95) * s, r * 0.3 * s, r * 0.25 * s, col);
    };
    if (tipo === "lobo") [[-22, 8], [-6, -4], [10, 6], [26, -6]].forEach(([hx, hy]) => huella(hx, hy, 5, "#3A2A20", 4));
    else if (tipo === "jabali")
      [[-24, 6], [-6, -6], [12, 4], [30, -8]].forEach(([hx, hy]) => {
        E(c, x + (hx - 3) * s, y + hy * s, 2.6 * s, 4 * s, "#3A2A20");
        E(c, x + (hx + 3) * s, y + hy * s, 2.6 * s, 4 * s, "#3A2A20");
      });
    else if (tipo === "trol") [[-20, 6], [18, -6]].forEach(([hx, hy]) => huella(hx, hy, 13, "#2E2420", 3));
    else if (tipo === "draugr") {
      // pasos que arrastran un pie y tierra de túmulo
      [[-24, 4], [0, -4], [24, 4]].forEach(([hx, hy]) => E(c, x + hx * s, y + hy * s, 6 * s, 3 * s, "#2E2E2A"));
      L(c, x - 30 * s, y + 10 * s, x + 30 * s, y + 6 * s, "#4A4A40", 2 * s);
    } else if (tipo === "fatuo") {
      // escarcha en rombo que no se derrite
      for (let k = 0; k < 5; k++) {
        const hx = -24 + k * 12,
          hy = (k % 2) * 6 - 3;
        P(c, [x + hx * s, y + (hy - 5) * s, x + (hx + 4) * s, y + hy * s, x + hx * s, y + (hy + 5) * s, x + (hx - 4) * s, y + hy * s], "#C8F2F4");
      }
    } else if (tipo === "cuervo") {
      // plumas negras
      [[-16, 2, 0.4], [6, -4, -0.6], [20, 6, 0.9]].forEach(([hx, hy, r]) => E(c, x + hx * s, y + hy * s, 9 * s, 2.2 * s, "#1E1A1A", r));
    }
    // una gota de sangre (todos menos el fatuo)
    if (tipo !== "fatuo") {
      E(c, x + 4 * s, y + 10 * s, 4 * s, 2.4 * s, "#5E130D");
      E(c, x + 3 * s, y + 9 * s, 2 * s, 1.2 * s, "#9C2315");
    }
    c.restore();
  }

  Object.assign(ASSETS.LISTA, {
    posteContratos: { f: posteContratos, figura: true, alto: 206, choque: { r: 14 }, grupo: "contratos", luz: true },
    rastroContrato: { f: rastroContrato, piso: true, alto: 4, choque: null, grupo: "contratos" },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, {
    posteContratos: { n: 5 },
    rastroContrato: { tipo: "lobo" },
  });
})();
