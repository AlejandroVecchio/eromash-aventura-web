// ---------- las runas de los elementos: Thurisaz y Laguz (assets de ELEMENTOS) ----------
//  · robleTrueno: el Roble del Trueno, un roble viejo partido en dos por un rayo. La mitad izquierda quedó seca, con
//    las ramas peladas; la derecha todavía echa hojas. En la madera quemada del medio está tallada Thurisaz, que brilla
//    lavanda hasta que se toma (o.tomada). o.tormenta (0 a 1) hace correr chispas por la grieta durante la prueba.
//  · fuenteLaguz: la Fuente de Laguz, un ojo de agua rodeado de lajas con una piedra parada detrás que lleva Laguz.
//    Seca (barro cuarteado) hasta que despiertan las tres piedras de la orilla (o.viva): entonces mana, con anillos
//    que se abren. o.tomada apaga la runa.
//  · piedraManantial: una de las tres piedras de la orilla con la marca de Laguz. o.viva: la marca brilla y un hilo
//    de agua le corre por delante.
// Caras planas, luz de arriba a la derecha, la mitad izquierda en sombra, sombra elíptica.
(function () {
  "use strict";
  const { P, E, L, sombra } = DIB;
  const xy = (x, y, s) => (a) => a.map((v, i) => (i % 2 ? y - v * s : x + v * s));
  const TRUENO = "#B8A8F0",
    AGUA = "#73D5DB";
  const brillo = (c, x, y, r, col, a) => {
    if (window.CALIDAD && CALIDAD.nivel === "baja") return;
    DIB.halo(c, x, y, r, col, a);
  };

  function robleTrueno(c, x, y, t, o) {
    const s = o.s || 1,
      q = xy(x, y, s),
      viva = !o.tomada,
      tor = o.tormenta || 0;
    sombra(c, x + 24 * s, y + 4 * s, 150 * s, 32 * s, 0.34);
    // las raíces
    P(c, q([-60, 0, -34, 14, -20, 0]), "#3E2C1C");
    P(c, q([44, 0, 30, 16, 16, 0]), "#5A3E26");
    P(c, q([-8, 0, 0, 10, 10, 0]), "#5A3E26");
    // la mitad izquierda, seca y en sombra: se abre hacia la izquierda
    P(c, q([-50, 0, -6, 0, -12, 110, -40, 176, -72, 168, -54, 96]), "#4A3424");
    P(c, q([-50, 0, -34, 0, -50, 100, -72, 168, -80, 156, -64, 92]), "#3A281A");
    // ramas peladas
    L(c, x - 62 * s, y - 162 * s, x - 112 * s, y - 214 * s, "#3A281A", 8 * s);
    L(c, x - 92 * s, y - 194 * s, x - 98 * s, y - 244 * s, "#3A281A", 5 * s);
    L(c, x - 54 * s, y - 170 * s, x - 40 * s, y - 236 * s, "#3A281A", 6 * s);
    L(c, x - 44 * s, y - 212 * s, x - 20 * s, y - 252 * s, "#3A281A", 3.5 * s);
    L(c, x - 104 * s, y - 206 * s, x - 138 * s, y - 212 * s, "#3A281A", 4 * s);
    L(c, x - 66 * s, y - 120 * s, x - 104 * s, y - 132 * s, "#3A281A", 5 * s);
    // la mitad derecha, viva y con luz: se abre hacia la derecha
    P(c, q([8, 0, 58, 0, 60, 92, 84, 160, 60, 178, 16, 116]), "#7A5634");
    P(c, q([40, 0, 58, 0, 60, 92, 84, 160, 72, 166, 46, 98]), "#5A3E26");
    // la madera quemada del medio, donde pegó el rayo
    P(c, q([-8, 0, 10, 0, 18, 118, 2, 156, -14, 114]), "#1E1612");
    P(c, q([-3, 10, 5, 10, 10, 106, 1, 132, -9, 104]), "#2E221A");
    // la copa de la mitad viva: hojas en caras planas, grande y pesada hacia la derecha
    const copa = [
      [[10, 168, 90, 150, 176, 172, 198, 230, 160, 280, 80, 296, 20, 264], "#3E5A30"],
      [[90, 158, 172, 176, 194, 228, 150, 262, 100, 232], "#5E7A3E"],
      [[30, 196, 96, 214, 112, 270, 60, 300, 2, 274], "#4E6B3A"],
      [[110, 236, 164, 244, 168, 286, 120, 300], "#6E9A4E"],
      [[-14, 236, 30, 228, 46, 280, 6, 300, -26, 282], "#3E5A30"],
      [[140, 190, 196, 200, 206, 246, 168, 252], "#6E9A4E"],
    ];
    const mece = Math.sin(t * 0.9 + x * 0.01) * 2 * s;
    copa.forEach(([pts, col]) => P(c, pts.map((v, i) => (i % 2 ? y - v * s : x + v * s + mece * 0.8)), col));
    // Thurisaz tallada en la grieta quemada
    const rx = x + 1 * s,
      ry = y - 56 * s,
      col = viva ? TRUENO : "#4A4442";
    if (viva) brillo(c, rx, ry - 26 * s, 60 * s, TRUENO, 0.35 + 0.15 * Math.sin(t * 2.2) + tor * 0.4);
    FUTHARK.dibujar(c, "thurisaz", rx, ry, 44 * s, col, 4 * s);
    // durante la prueba, chispas que corren por la grieta
    if (tor > 0 && (!window.CALIDAD || CALIDAD.nivel !== "baja"))
      for (let k = 0; k < 4; k++) {
        const u = (t * 2.4 + k / 4) % 1,
          px = x + Math.sin(k * 5 + t * 9) * 6 * s,
          py = y - (10 + u * 130) * s;
        L(c, px, py, px + (k % 2 ? 6 : -6) * s, py - 8 * s, "#F2ECEC", 1.6 * s);
        L(c, px + (k % 2 ? 6 : -6) * s, py - 8 * s, px, py - 14 * s, TRUENO, 1.6 * s);
      }
  }

  function fuenteLaguz(c, x, y, t, o) {
    const s = o.s || 1,
      q = xy(x, y, s),
      viva = !!o.viva;
    sombra(c, x + 6 * s, y + 4 * s, 96 * s, 30 * s, 0.28);
    // la piedra parada detrás, con Laguz
    P(c, q([-22, 26, 22, 26, 26, 120, 6, 138, -18, 126]), "#8E8A86");
    P(c, q([-22, 26, -2, 26, 6, 138, -18, 126]), "#6E6A66");
    const col = viva && !o.tomada ? AGUA : viva ? "#4E8E92" : "#5A5652";
    if (viva && !o.tomada) brillo(c, x + 2 * s, y - 90 * s, 50 * s, AGUA, 0.3 + 0.12 * Math.sin(t * 1.8));
    FUTHARK.dibujar(c, "laguz", x + 4 * s, y - 60 * s, 46 * s, col, 4 * s);
    // el ojo de agua (o el barro seco)
    E(c, x, y, 74 * s, 28 * s, viva ? "#2E6E7A" : "#3A3026");
    if (viva) {
      E(c, x + 10 * s, y - 4 * s, 56 * s, 18 * s, "#3E8A96");
      for (let k = 0; k < 3; k++) {
        const u = (t * 0.45 + k / 3) % 1;
        c.save();
        c.globalAlpha = (1 - u) * 0.7;
        c.strokeStyle = AGUA;
        c.lineWidth = 1.6 * s;
        c.beginPath();
        c.ellipse(x - 4 * s, y - 2 * s, (8 + u * 52) * s, (3 + u * 18) * s, 0, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      }
      E(c, x + 22 * s, y - 8 * s, 8 * s, 2.5 * s, "#C8F2F4");
    } else {
      // grietas del barro
      L(c, x - 40 * s, y - 4 * s, x - 12 * s, y + 6 * s, "#2A2018", 1.6 * s);
      L(c, x - 12 * s, y + 6 * s, x + 18 * s, y - 6 * s, "#2A2018", 1.6 * s);
      L(c, x + 18 * s, y - 6 * s, x + 44 * s, y + 4 * s, "#2A2018", 1.6 * s);
      L(c, x - 12 * s, y + 6 * s, x - 6 * s, y + 18 * s, "#2A2018", 1.4 * s);
    }
    // las lajas alrededor
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + 0.3,
        px = x + Math.cos(a) * 84 * s,
        py = y + Math.sin(a) * 33 * s;
      if (Math.sin(a) < -0.3) continue; // las de atrás quedan tapadas por la piedra
      P(c, [px - 16 * s, py, px - 8 * s, py - 8 * s, px + 12 * s, py - 8 * s, px + 18 * s, py, px + 8 * s, py + 6 * s, px - 10 * s, py + 6 * s], "#A8A49E");
      P(c, [px - 16 * s, py, px - 8 * s, py - 8 * s, px - 2 * s, py - 8 * s, px - 6 * s, py + 6 * s, px - 10 * s, py + 6 * s], "#7E7A76");
    }
  }

  function piedraManantial(c, x, y, t, o) {
    const s = o.s || 1,
      q = xy(x, y, s),
      viva = !!o.viva;
    sombra(c, x + 4 * s, y + 2 * s, 30 * s, 9 * s, 0.3);
    P(c, q([-24, 0, 22, 0, 26, 22, 12, 46, -14, 44, -26, 20]), "#8E8A86");
    P(c, q([-24, 0, -4, 0, -2, 45, -14, 44, -26, 20]), "#6E6A66");
    P(c, q([-14, 44, 12, 46, 4, 50, -8, 50]), "#A8A49E");
    if (viva) brillo(c, x, y - 26 * s, 30 * s, AGUA, 0.3 + 0.1 * Math.sin(t * 2 + x));
    FUTHARK.dibujar(c, "laguz", x + 2 * s, y - 10 * s, 26 * s, viva ? AGUA : "#5A5652", 2.6 * s);
    if (viva) {
      // un hilo de agua que corre por delante
      const u = (t * 1.2 + x * 0.001) % 1;
      P(c, [x - 4 * s, y + 2 * s, x + 4 * s, y + 2 * s, x + 10 * s, y + 18 * s, x - 2 * s, y + 18 * s], "#3E8A96");
      E(c, x + 4 * s, y + (4 + u * 14) * s, 2.2 * s, 1.4 * s, "#C8F2F4");
    }
  }

  Object.assign(ASSETS.LISTA, {
    robleTrueno: { f: robleTrueno, figura: true, alto: 300, choque: { w: 90, h: 26 }, grupo: "elementos" },
    fuenteLaguz: { f: fuenteLaguz, alto: 140, choque: { w: 120, h: 40 }, grupo: "elementos" },
    piedraManantial: { f: piedraManantial, alto: 52, choque: { w: 40, h: 14 }, grupo: "elementos" },
  });
  if (ASSETS.COL_RUNA) Object.assign(ASSETS.COL_RUNA, { thurisaz: TRUENO, laguz: AGUA });
})();
