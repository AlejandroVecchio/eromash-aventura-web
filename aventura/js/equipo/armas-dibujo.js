// ---------- el dibujo de las armas que la arena no tiene (módulo DIB_ARMAS) ----------
// Hachas (y las que vienen: a dos manos, lanzas, martillos, arcos, bastones) dibujadas con el lenguaje de las espadas
// de la arena: polígonos de un color, sin degradés ni curvas, la mitad izquierda en sombra y el filo claro. Cada forma
// tiene cinco familias (una por tema del mundo) y cinco escalones (común, poco común, raro, épico, legendario): el
// metal se aclara, aparecen tientos de cuero, remaches de oro, runas que laten y, en la legendaria, el filo encendido.
// Coordenadas: las mismas que la espada de siempre (juego.js, dibujarEspada): la punta hacia y negativa, el agarre en
// y = 0 y el pomo hacia y positiva, unas 400 unidades de largo; dibujar(c, …) se llama ya rotado y escalado.
window.DIB_ARMAS = (function () {
  "use strict";
  const P = (c, pts, col) => DIB.P(c, pts, col);
  // metal del filo por escalón: [sombra, base, luz del filo]
  const METAL = [
    ["#6E6862", "#9A948C", "#D2CCC4"],
    ["#7E848C", "#B8BCC4", "#EEF0F4"],
    ["#7E848C", "#C2C6CC", "#F2F4F8"],
    ["#5A5E70", "#9AA0B4", "#E0E6F2"],
    ["#2A2226", "#463A3E", "#F5A524"],
  ];
  const MADERA = ["#553A22", "#7A5634"],
    HUESO = ["#B8AC98", "#E0D4C0"],
    CUERO = "#5E130D",
    ORO = "#FFD98A",
    RUNA = "#73D5DB";
  const late = () => 0.65 + Math.sin(performance.now() / 260) * 0.35;

  // el mango: de y0 (arriba) a y1 (abajo), ancho w; tientos de cuero desde el escalón 1 y el pomo
  function mango(c, y0, y1, w, tier, hueso) {
    const [s, b] = hueso ? HUESO : MADERA;
    P(c, [-w, y0, w, y0, w, y1, -w, y1], b);
    P(c, [-w, y0, 0, y0, 0, y1, -w, y1], s);
    if (hueso) for (let y = y0 + 30; y < y1 - 10; y += 46) P(c, [-w - 2, y, w + 2, y, w + 2, y + 8, -w - 2, y + 8], s);
    if (tier >= 1)
      for (let y = y1 - 90; y < y1 - 14; y += 16) {
        P(c, [-w - 2, y, w + 2, y + 6, w + 2, y + 12, -w - 2, y + 6], CUERO);
      }
    // el pomo
    P(c, [0, y1 - 4, w + 8, y1 + 8, 0, y1 + 22, -w - 8, y1 + 8], tier >= 2 ? ORO : "#3A2A1C");
  }
  // un filo: polígono pts con la mitad izquierda (x < eje) en sombra y el borde de corte claro (borde: [x0,y0,x1,y1])
  function filo(c, pts, borde, tier) {
    const [s, b, l] = METAL[tier];
    P(c, pts, b);
    // sombra: lo que queda a la izquierda del centro del filo
    let cx = 0;
    for (let i = 0; i < pts.length; i += 2) cx += pts[i] / (pts.length / 2);
    const izq = [];
    for (let i = 0; i < pts.length; i += 2) izq.push(Math.min(pts[i], cx), pts[i + 1]);
    DIB.alfa(c, 0.55, () => P(c, izq, s));
    if (borde) {
      const [x0, y0, x1, y1] = borde,
        nx = x1 - x0,
        ny = y1 - y0,
        l0 = Math.hypot(nx, ny) || 1,
        ox = (-ny / l0) * 7,
        oy = (nx / l0) * 7;
      if (tier === 4) {
        // la legendaria: el filo encendido que late
        c.save();
        c.globalAlpha = late();
        P(c, [x0, y0, x1, y1, x1 + ox, y1 + oy, x0 + ox, y0 + oy], l);
        c.restore();
      } else P(c, [x0, y0, x1, y1, x1 + ox, y1 + oy, x0 + ox, y0 + oy], l);
    }
  }
  function remaches(c, l, tier) {
    if (tier < 2) return;
    for (let i = 0; i < l.length; i += 2) P(c, [l[i], l[i + 1] - 5, l[i] + 5, l[i + 1], l[i], l[i + 1] + 5, l[i] - 5, l[i + 1]], ORO);
  }
  function runa(c, nombre, x, y, s, tier) {
    if (tier < 3) return;
    c.save();
    c.globalAlpha = tier === 4 ? 1 : late();
    FUTHARK.dibujar(c, nombre, x, y, s, tier === 4 ? "#F5A524" : RUNA, 3);
    c.restore();
  }

  // ---------- hachas de una mano ----------
  // fam: 0 de mano (cabeza chica y recta) · 1 barbuda (la barba baja por el mango) · 2 rúnica (media luna con pico
  // atrás) · 3 de hueso (mango de hueso y filo dentado) · 4 de doble filo
  function hacha(c, fam, tier) {
    mango(c, -190, 150, 10, tier, fam === 3);
    // la cabeza, una vez y media más grande que su dibujo, alrededor del ojo
    c.save();
    c.translate(0, -152);
    c.scale(1.55, 1.55);
    c.translate(0, 152);
    const [s, b] = METAL[Math.min(tier, 3)];
    if (fam === 0) {
      filo(c, [6, -176, 66, -196, 92, -184, 92, -120, 66, -110, 6, -128], [92, -184, 92, -120], tier);
    } else if (fam === 1) {
      filo(c, [6, -178, 70, -192, 100, -176, 104, -86, 84, -62, 60, -90, 6, -132], [100, -176, 104, -86], tier);
    } else if (fam === 2) {
      filo(c, [6, -176, 54, -186, 96, -214, 112, -150, 96, -86, 54, -114, 6, -126], [96, -214, 112, -150], tier);
      filo(c, [-6, -168, -54, -150, -6, -136], null, tier);
      runa(c, "ansuz", 52, -128, 30, tier);
    } else if (fam === 3) {
      filo(c, [6, -176, 72, -190, 98, -170, 88, -158, 100, -146, 88, -132, 98, -118, 72, -100, 6, -126], [98, -170, 98, -118], tier);
    } else {
      filo(c, [6, -176, 62, -194, 92, -180, 92, -118, 62, -104, 6, -126], [92, -180, 92, -118], tier);
      filo(c, [-6, -176, -62, -194, -92, -180, -92, -118, -62, -104, -6, -126], [-92, -118, -92, -180], tier);
    }
    // el ojo
    P(c, [-14, -184, 14, -184, 14, -120, -14, -120], s);
    P(c, [0, -184, 14, -184, 14, -120, 0, -120], b);
    remaches(c, [0, -170, 0, -134], tier);
    if (fam !== 2) runa(c, "thurisaz", 50, -132, 26, tier);
    c.restore();
  }

  // ---------- a dos manos ----------
  // mandobles: fam 0 largo y recto con acanaladura · 1 espadón ancho · 2 rúnico con la punta abierta · 3 de hueso
  // dentado · 4 flamígero (el filo ondulado)
  function mandoble(c, fam, tier) {
    const [s] = METAL[tier];
    // el agarre largo (para las dos manos) y el pomo
    mango(c, 62, 176, 11, tier, fam === 3);
    // la hoja
    if (fam === 0) filo(c, [-20, 40, -20, -320, 0, -370, 20, -320, 20, 40], [0, -370, 20, -320], tier);
    else if (fam === 1) filo(c, [-30, 40, -30, -300, 0, -352, 30, -300, 30, 40], [0, -352, 30, -300], tier);
    else if (fam === 2) filo(c, [-20, 40, -22, -290, -34, -330, 0, -380, 34, -330, 22, -290, 20, 40], [0, -380, 34, -330], tier);
    else if (fam === 3) filo(c, [-22, 40, -26, -60, -14, -90, -28, -150, -14, -190, -28, -250, -10, -300, 0, -350, 12, -300, 26, -250, 14, -190, 26, -150, 12, -90, 24, -60, 22, 40], [0, -350, 12, -300], tier);
    else {
      const pts = [-20, 40];
      for (let y = 0; y > -320; y -= 40) pts.push(y % 80 === 0 ? -20 : -30, y - 20);
      pts.push(0, -370);
      for (let y = -320; y < 40; y += 40) pts.push(y % 80 === 0 ? 30 : 20, y + 20);
      pts.push(20, 40);
      filo(c, pts, [0, -370, 24, -330], tier);
    }
    // la acanaladura (canal del medio) en las rectas
    if (fam <= 2) DIB.alfa(c, 0.5, () => P(c, [-4, 20, 4, 20, 4, -280, 0, -300, -4, -280], s));
    // la guarda ancha
    P(c, [-74, 40, 74, 40, 64, 62, -64, 62], tier >= 2 ? ORO : "#5E130D");
    P(c, [-74, 40, 0, 40, 0, 62, -64, 62], tier >= 2 ? "#C9A45A" : "#3A0E08");
    remaches(c, [-50, 51, 50, 51], tier);
    runa(c, fam === 2 ? "tiwaz" : "sowilo", 0, -150, 34, tier);
  }
  // hachas danesas: fam 0 media luna grande · 1 barbuda de guerra · 2 rúnica · 3 de hueso · 4 doble (lábrys)
  function hacha2(c, fam, tier) {
    mango(c, -250, 190, 11, tier, fam === 3);
    c.save();
    c.translate(0, -212);
    c.scale(1.9, 1.9);
    c.translate(0, 212);
    const [s, b] = METAL[Math.min(tier, 3)];
    const y0 = -236,
      y1 = -188;
    if (fam === 0) filo(c, [6, y0, 40, y0 - 14, 76, y0 - 34, 92, -212, 76, y1 + 34, 40, y1 + 14, 6, y1], [76, y0 - 34, 92, -212], tier);
    else if (fam === 1) filo(c, [6, y0, 50, y0 - 12, 84, y0 - 4, 88, y1 + 28, 64, y1 + 52, 44, y1 + 20, 6, y1], [84, y0 - 4, 88, y1 + 28], tier);
    else if (fam === 2) filo(c, [6, y0, 44, y0 - 20, 86, y0 - 40, 98, -212, 86, y1 + 40, 44, y1 + 20, 6, y1], [86, y0 - 40, 98, -212], tier);
    else if (fam === 3) filo(c, [6, y0, 50, y0 - 18, 80, y0 - 10, 70, -222, 84, -212, 70, -200, 80, y1 + 10, 50, y1 + 18, 6, y1], [80, y0 - 10, 80, y1 + 10], tier);
    else {
      filo(c, [6, y0, 40, y0 - 22, 72, y0 - 30, 82, -212, 72, y1 + 30, 40, y1 + 22, 6, y1], [72, y0 - 30, 82, -212], tier);
      filo(c, [-6, y0, -40, y0 - 22, -72, y0 - 30, -82, -212, -72, y1 + 30, -40, y1 + 22, -6, y1], [-82, -212, -72, y0 - 30], tier);
    }
    P(c, [-14, y0 - 6, 14, y0 - 6, 14, y1 + 6, -14, y1 + 6], s);
    P(c, [0, y0 - 6, 14, y0 - 6, 14, y1 + 6, 0, y1 + 6], b);
    // la punta de arriba del mango
    P(c, [-8, y0 - 6, 8, y0 - 6, 0, y0 - 26], s);
    remaches(c, [0, y0 + 8, 0, y1 - 8], tier);
    runa(c, fam === 2 ? "hagalaz" : "thurisaz", 44, -200, 22, tier);
    c.restore();
  }

  const FORMAS = { hacha, mandoble, hacha2 };
  // dibujar(c, forma, fam, tier): en coordenadas de la espada de siempre (ya rotado y escalado)
  function dibujar(c, forma, fam, tier) {
    const f = FORMAS[forma];
    if (!f) return false;
    f(c, fam || 0, Math.max(0, Math.min(4, tier || 0)));
    return true;
  }
  // cómo entra cada forma en el cuadrado del icono (las largas como la espada usan lo de siempre)
  const ICONO = { arco: { k: 1.2, x: 0, y: -12 } };
  // icono(c, forma, fam, tier, x, y, lado): en diagonal, entrando en un cuadrado de lado × lado
  function icono(c, forma, fam, tier, x, y, lado) {
    c.save();
    c.translate(x, y);
    c.rotate(Math.PI / 4);
    const m = ICONO[forma] || { k: 1, x: -40, y: 40 },
      k = (lado / 420) * m.k;
    c.scale(k, k);
    c.translate(m.x, m.y);
    // en la mochila el arco va sin tensar (la tensión es la del arco en la mano)
    const ten = DIB_ARMAS.tension;
    DIB_ARMAS.tension = 0;
    const ok = dibujar(c, forma, fam, tier);
    DIB_ARMAS.tension = ten;
    c.restore();
    return ok;
  }
  // una forma nueva (la suman las PRs de cada arma): fn(c, fam, tier)
  const forma = (id, fn) => (FORMAS[id] = fn);
  return { dibujar, icono, ICONO, forma, METAL, mango, filo, remaches, runa };
})();
