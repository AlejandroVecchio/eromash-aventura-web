// ---------- las raíces del Roble de Eikholt (módulo RAIZ25) ----------
// La base del Roble se reconoce por sus raíces: salen del tronco como lomos enormes que se abren hacia la plaza, se
// hunden de a poco en el musgo y llevan vetas de azul rúnico (la piedra dormida del Ting le responde al Roble). Cada
// raíz tiene sus tres medidas y se dibuja desde el ángulo de la cámara, así la base gira con la vista como las casas.
// En el plano de la raíz u va del tronco hacia afuera y w de costado.
//   RAIZ25.crear(largo, ancho, alto, sem) → { dibujar(c, x, y, giro, k, t), alto }
window.RAIZ25 = (function () {
  "use strict";
  const { P, E, L, alfa, halo, azar, RUNICO } = DIB;
  const C = ASSETS.C;
  const MUSGO = ["#3D4A28", "#4A5A2E", "#56662C"];

  function crear(largo, ancho, alto, sem) {
    const r = azar(sem * 71 + 3);
    const n = 14,
      fase = r() * 6,
      tuerce = 0.25 + r() * 0.3;
    // la línea del lomo: (u, w del centro, medio ancho, alto)
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const s = i / n;
      pts.push([s * largo, Math.sin(s * 3.6 + fase) * ancho * tuerce * s, ancho * (1 - 0.82 * s) * (0.5 + 0.5 * Math.cos(s * 1.2)), alto * Math.pow(1 - s, 1.6) + 8]);
    }
    // las manchas de musgo y la veta rúnica, fijas por raíz
    const manchas = [];
    for (let i = 0; i < 6; i++) manchas.push([0.15 + r() * 0.75, (r() - 0.5) * 0.9, 0.5 + r() * 0.6, Math.floor(r() * 3)]);
    const veta = [];
    for (let i = 0; i <= 10; i++) veta.push([0.08 + i * 0.085, Math.sin(i * 1.7 + fase) * 0.35]);

    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      // la raíz va de u = 0 (en el tronco) a u = largo; el objeto está parado en la mitad
      const at = (u, w, z) => pr(u - largo / 2, w, z);
      const borde = (lado) => pts.map(([u, wc, hw, h]) => at(u, wc + lado * hw, h * 0.35));
      const lomo = pts.map(([u, wc, hw, h]) => at(u, wc, h));
      // la sombra sobre el musgo
      alfa(c, 0.28, () => P(c, [...pts.map(([u, wc, hw]) => at(u + 30, wc + hw + 30, 0)).flat(), ...pts.map(([u, wc, hw]) => at(u + 30, wc - hw + 10, 0)).reverse().flat()], "#000"));
      // el costado que mira a la cámara (en sombra o con luz según de qué lado queda)
      const ladoVisto = pr.mira(0, 1)[1] > 0 ? 1 : -1;
      const luzLado = pr.mira(0, ladoVisto)[0];
      const pie = pts.map(([u, wc, hw]) => at(u, wc + ladoVisto * hw * 1.1, 0));
      P(c, [...pie.flat(), ...borde(ladoVisto).reverse().flat()], luzLado > 0.2 ? C.tronco : C.troncoSombra);
      // el lomo: dos mitades, la de la luz más clara
      const luzDe = (lado) => pr.mira(0, lado)[0];
      for (const lado of [-1, 1]) {
        const b = borde(lado);
        P(c, [...lomo.flat(), ...b.reverse().flat()], luzDe(lado) > 0 ? C.corteza : C.tronco);
      }
      // surcos de la corteza
      for (let j = 0; j < 3; j++) {
        const f = -0.5 + j * 0.5;
        c.strokeStyle = "rgba(0,0,0,0.2)";
        c.lineWidth = 3;
        c.beginPath();
        pts.forEach(([u, wc, hw, h], i) => {
          if (i > n - 2) return;
          const p = at(u, wc + f * hw * 0.8, h * (1 - Math.abs(f) * 0.5));
          i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]);
        });
        c.stroke();
      }
      // el musgo que se le sube
      for (const [s, f, tam, col] of manchas) {
        const i = Math.min(n, Math.round(s * n)),
          [u, wc, hw, h] = pts[i];
        const p = at(u, wc + f * hw, h * (1 - Math.abs(f) * 0.6));
        E(c, p[0], p[1], hw * 0.55 * tam + 10, hw * 0.22 * tam * k + 5, MUSGO[col]);
      }
      // la veta de azul rúnico por el lomo, que late despacio
      const a = 0.55 + Math.sin(t * 1.1 + sem * 1.7) * 0.3;
      const vp = veta.map(([s, f]) => {
        const i = Math.min(n, Math.round(s * n)),
          [u, wc, hw, h] = pts[i];
        return at(u, wc + f * hw, h * (1 - Math.abs(f) * 0.4) + 2);
      });
      alfa(c, a, () => {
        c.strokeStyle = RUNICO;
        c.lineWidth = 4;
        c.lineCap = "round";
        c.lineJoin = "round";
        c.beginPath();
        vp.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
        c.stroke();
        // una rama de la veta
        const m = vp[4],
          q = vp[6];
        L(c, m[0], m[1], q[0] + 22, q[1] - 10, RUNICO, 2.5);
      });
      const [hx, hy] = vp[3];
      halo(c, hx, hy, 90, RUNICO, a * 0.5);
    }
    return { dibujar, alto: alto + 20 };
  }
  return { crear };
})();
