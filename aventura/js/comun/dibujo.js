// ---------- herramientas de dibujo (módulo DIB) ----------
// Las mismas que usan los mapas de la arena (juego/js/mundo/mapas.js): polígonos planos, elipses, rectángulos y
// líneas, sin degradés en los objetos. La luz viene de arriba a la derecha: cada volumen tiene su cara clara y su
// cara en sombra, como los NPC y los cofres de la arena.
window.DIB = (function () {
  "use strict";
  const TAU = Math.PI * 2;
  // polígono de puntos sueltos [x0, y0, x1, y1, …]
  function P(c, pts, col) {
    c.beginPath();
    c.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    c.closePath();
    c.fillStyle = col;
    c.fill();
  }
  function E(c, x, y, rx, ry, col, rot = 0) {
    c.beginPath();
    c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU);
    c.fillStyle = col;
    c.fill();
  }
  function R(c, x, y, w, h, col) {
    c.fillStyle = col;
    c.fillRect(x, y, w, h);
  }
  function L(c, x1, y1, x2, y2, col, w = 2) {
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.strokeStyle = col;
    c.lineWidth = w;
    c.lineCap = "round";
    c.stroke();
  }
  function alfa(c, a, fn) {
    const g = c.globalAlpha;
    c.globalAlpha = g * a;
    fn();
    c.globalAlpha = g;
  }
  // polígono regular facetado (piedras, copas, hongos)
  function poli(cx, cy, rx, ry, n, rot = 0, jitter = null) {
    const o = [];
    for (let i = 0; i < n; i++) {
      const a = rot + (i * TAU) / n,
        k = jitter ? jitter[i % jitter.length] : 1;
      o.push(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k);
    }
    return o;
  }
  // generador pseudoaleatorio con semilla (el mismo que la arena): el mundo sale igual en cada partida
  function azar(sem) {
    let a = sem >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // sombra en el piso, la misma de los personajes de la arena
  const sombra = (c, x, y, rx, ry, a = 0.38) => E(c, x, y, rx, ry, `rgba(0,0,0,${a})`);
  // la luz rúnica de la aventura: azul #73D5DB; un halo sin desenfoque (círculos concéntricos), apagable por calidad
  const RUNICO = "#73D5DB",
    RUNICO_CLARO = "#C8F2F4",
    VIOLETA = "#9A6BD8";
  // Calidad gráfica (CALIDAD de la arena): en baja no hay halos; en media, un solo anillo
  function halo(c, x, y, r, col, fuerza = 1) {
    if (fuerza <= 0) return;
    const nivel = window.CALIDAD ? CALIDAD.nivel : "alta";
    if (nivel === "baja") return;
    if (nivel === "media") return alfa(c, 0.2 * fuerza, () => E(c, x, y, r * 0.5, r * 0.4, col));
    alfa(c, 0.1 * fuerza, () => E(c, x, y, r, r * 0.8, col));
    alfa(c, 0.14 * fuerza, () => E(c, x, y, r * 0.62, r * 0.5, col));
    alfa(c, 0.2 * fuerza, () => E(c, x, y, r * 0.32, r * 0.26, col));
  }
  return { TAU, P, E, R, L, alfa, poli, azar, sombra, halo, RUNICO, RUNICO_CLARO, VIOLETA };
})();
