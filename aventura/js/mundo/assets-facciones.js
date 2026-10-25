// ---------- las facciones de Eldervald (assets de FACCIONES) ----------
//  · estandarteFaccion: el estandarte de una facción, un mástil con travesaño, el paño con su emblema y una piedra al
//    pie con ofrendas o cuñas. o.f elige la facción: guardia (la Guardia del Roble, de Eikholt: rojo con la cornamenta
//    pálida de la capital), sendas (los Guardasendas de Eydis: verde con el camino y el rombo rúnico), gremio (el
//    Gremio de Brunvik: azul con el yunque y el pez) u ocultos (el Pueblo Oculto: musgo con el anillo de piedras).
// Y window.FACCIONES_DIBUJO.emblema(c, f, x, y, r): el emblema solo, en un escudo (lo usan el estandarte, la ventana de
// reputación y el ícono de la Bolsa).
// Caras planas, luz de arriba a la derecha, la mitad izquierda en sombra, sombra elíptica.
(function () {
  "use strict";
  const { P, E, R, L, sombra } = DIB;
  const xy = (x, y, s) => (a) => a.map((v, i) => (i % 2 ? y - v * s : x + v * s));
  const COL = {
    guardia: ["#9C2315", "#5E130D"],
    sendas: ["#4E6B3A", "#3A5028"],
    gremio: ["#3A4A6E", "#2A3650"],
    ocultos: ["#5E7A3E", "#46602C"],
  };
  // la cornamenta pálida de Eikholt: un asta que sube en curva y se abre en puntas
  function cornamenta(c, x, y, r) {
    const k = "#E8E0D0",
      w = r * 0.09;
    [-1, 1].forEach((l) => {
      L(c, x, y + r * 0.45, x + l * r * 0.12, y + r * 0.05, k, w);
      L(c, x + l * r * 0.12, y + r * 0.05, x + l * r * 0.32, y - r * 0.3, k, w);
      L(c, x + l * r * 0.32, y - r * 0.3, x + l * r * 0.36, y - r * 0.62, k, w * 0.8);
      L(c, x + l * r * 0.2, y - r * 0.12, x + l * r * 0.5, y - r * 0.2, k, w * 0.7);
      L(c, x + l * r * 0.28, y - r * 0.38, x + l * r * 0.56, y - r * 0.52, k, w * 0.6);
      L(c, x + l * r * 0.1, y + r * 0.18, x + l * r * 0.02, y - r * 0.1, k, w * 0.6);
    });
  }
  function emblema(c, f, x, y, r) {
    const [a, b] = COL[f] || COL.guardia;
    // el escudo: mitad izquierda en sombra
    P(c, [x - r * 0.8, y - r, x + r * 0.8, y - r, x + r * 0.8, y + r * 0.2, x, y + r, x - r * 0.8, y + r * 0.2], a);
    P(c, [x - r * 0.8, y - r, x, y - r, x, y + r, x - r * 0.8, y + r * 0.2], b);
    P(c, [x + r * 0.5, y - r, x + r * 0.8, y - r, x + r * 0.8, y - r * 0.7], "rgba(242,236,236,0.18)");
    if (f === "guardia") cornamenta(c, x, y, r * 0.95);
    else if (f === "sendas") {
      // el camino que sube y el rombo rúnico arriba
      P(c, [x - r * 0.4, y + r * 0.7, x - r * 0.12, y + r * 0.7, x + r * 0.16, y - r * 0.1, x + r * 0.02, y - r * 0.1], "#C8A878");
      P(c, [x + r * 0.02, y - r * 0.1, x + r * 0.16, y - r * 0.1, x - r * 0.04, y - r * 0.4, x - r * 0.12, y - r * 0.4], "#A88A5E");
      P(c, [x, y - r * 0.85, x + r * 0.2, y - r * 0.6, x, y - r * 0.35, x - r * 0.2, y - r * 0.6], "#73D5DB");
    } else if (f === "gremio") {
      // el yunque y un pez encima
      P(c, [x - r * 0.5, y - r * 0.05, x + r * 0.55, y - r * 0.05, x + r * 0.35, y + r * 0.18, x - r * 0.3, y + r * 0.18], "#8E8A86");
      P(c, [x - r * 0.5, y - r * 0.05, x - r * 0.2, y - r * 0.05, x - r * 0.2, y + r * 0.18, x - r * 0.3, y + r * 0.18], "#6E6A66");
      P(c, [x - r * 0.14, y + r * 0.18, x + r * 0.14, y + r * 0.18, x + r * 0.24, y + r * 0.5, x - r * 0.24, y + r * 0.5], "#6E6A66");
      E(c, x, y - r * 0.45, r * 0.32, r * 0.13, "#FFD98A");
      P(c, [x + r * 0.28, y - r * 0.45, x + r * 0.5, y - r * 0.6, x + r * 0.5, y - r * 0.3], "#FFD98A");
      E(c, x - r * 0.16, y - r * 0.48, r * 0.04, r * 0.04, "#2A3650");
    } else {
      // el anillo de piedras con una hoja en el medio
      for (let k = 0; k < 7; k++) {
        const g = (k / 7) * Math.PI * 2,
          px = x + Math.cos(g) * r * 0.5,
          py = y - r * 0.1 + Math.sin(g) * r * 0.42;
        R(c, px - r * 0.07, py - r * 0.14, r * 0.14, r * 0.2, k % 2 ? "#A8A49E" : "#C8C4BE");
      }
      P(c, [x, y - r * 0.4, x + r * 0.16, y - r * 0.12, x, y + r * 0.2, x - r * 0.16, y - r * 0.12], "#9A6BD8");
      L(c, x, y - r * 0.3, x, y + r * 0.14, "#46602C", r * 0.04);
    }
  }

  function estandarteFaccion(c, x, y, t, o) {
    const s = o.s || 1,
      q = xy(x, y, s),
      f = o.f || "guardia",
      [a, b] = COL[f] || COL.guardia,
      vaiven = Math.sin(t * 1.6 + x * 0.01) * 3 * s;
    sombra(c, x + 4 * s, y + 3 * s, 34 * s, 10 * s, 0.34);
    // la piedra del pie y las cuñas
    P(c, q([-18, 0, -14, 14, 16, 14, 20, 0]), "#8E8A86");
    P(c, q([-18, 0, -14, 14, 0, 14, 0, 0]), "#6E6A66");
    // el mástil y el travesaño
    R(c, x - 3 * s, y - 170 * s, 6 * s, 160 * s, "#7A5634");
    R(c, x - 3 * s, y - 170 * s, 3 * s, 160 * s, "#553A22");
    R(c, x - 34 * s, y - 166 * s, 68 * s, 5 * s, "#7A5634");
    E(c, x, y - 174 * s, 5 * s, 5 * s, "#FFD98A");
    // el paño, con la punta partida que se mueve con el viento
    P(c, [x - 30 * s, y - 161 * s, x + 30 * s, y - 161 * s, x + 30 * s + vaiven, y - 70 * s, x + vaiven * 0.5, y - 84 * s, x - 30 * s + vaiven, y - 70 * s], a);
    P(c, [x - 30 * s, y - 161 * s, x, y - 161 * s, x + vaiven * 0.5, y - 84 * s, x - 30 * s + vaiven, y - 70 * s], b);
    R(c, x - 30 * s, y - 161 * s, 60 * s, 4 * s, "#FFD98A");
    emblema(c, f, x + vaiven * 0.3, y - 124 * s, 22 * s);
  }

  Object.assign(ASSETS.LISTA, {
    estandarteFaccion: { f: estandarteFaccion, figura: true, alto: 176, choque: { w: 30, h: 14 }, grupo: "facciones" },
  });
  window.FACCIONES_DIBUJO = { emblema, COL };
})();
