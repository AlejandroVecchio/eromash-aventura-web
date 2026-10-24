// ---------- lo de los oficios que va en volumen (módulo OFICIOS25) ----------
// La cordelería de Folke: el paseo de las sogas, una hilera larga de caballetes en T con las sogas tendidas de punta a
// punta y la rueda de torcer en la cabecera, todo con sus tres medidas para que gire con la cámara como las casas.
// En el plano u va a lo largo del paseo (la rueda en u = −largo/2) y w de costado.
//   OFICIOS25.paseoSogas(largo, sem) → { dibujar(c, x, y, giro, k, t), alto }
window.OFICIOS25 = (function () {
  "use strict";
  const { P, E, L, azar } = DIB;
  const C = ASSETS.C;

  function paseoSogas(largo, sem) {
    const L2 = largo / 2,
      n = Math.max(3, Math.round(largo / 180)),
      ZS = 120;
    const SOGAS = [-40, 0, 40];
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      DIB.sombra(c, x + 10, y + 4, (Math.abs(Math.cos(giro)) * largo) / 2 + 40, ((Math.abs(Math.sin(giro)) * largo) / 2) * k + 30, 0.25);
      const piezas = [];
      // los caballetes en T
      for (let i = 0; i <= n; i++) {
        const u = -L2 + 80 + ((largo - 120) * i) / n;
        piezas.push([pr.fondo(u, 0), () => {
          const a = pr(u, 0, 0),
            b = pr(u, 0, ZS);
          L(c, a[0], a[1], b[0], b[1], C.maderaSombra, 6);
          const p0 = pr(u, -60, ZS),
            p1 = pr(u, 60, ZS);
          L(c, p0[0], p0[1], p1[0], p1[1], C.madera, 6);
        }]);
      }
      // la rueda de torcer, en la cabecera
      piezas.push([pr.fondo(-L2 + 20, 0), () => {
        const [cx, cy] = pr(-L2 + 20, 0, 110);
        const a = pr(-L2 + 20, -50, 0),
          b = pr(-L2 + 20, 50, 0);
        L(c, a[0], a[1], cx, cy, C.maderaSombra, 6);
        L(c, b[0], b[1], cx, cy, C.maderaSombra, 6);
        // la rueda se ve de canto o de frente según la cámara
        const ancho = Math.abs(pr.mira(1, 0)[0]) * 70 + 8;
        E(c, cx, cy, ancho, 70, C.madera);
        E(c, cx, cy, Math.max(4, ancho - 10), 60, C.maderaSombra);
        const g = t * 1.5 + sem;
        for (let j = 0; j < 4; j++) {
          const a2 = g + (j * Math.PI) / 4;
          L(c, cx - Math.cos(a2) * ancho * 0.85, cy - Math.sin(a2) * 60, cx + Math.cos(a2) * ancho * 0.85, cy + Math.sin(a2) * 60, C.madera, 4);
        }
        E(c, cx, cy, 8, 8, C.hierro);
      }]);
      piezas.sort((a, b) => a[0] - b[0]).forEach((p) => p[1]());
      // las sogas tendidas, que cuelgan un poco entre caballete y caballete
      const r = azar(sem * 11);
      SOGAS.forEach((w, j) => {
        const col = ["#C8A86A", "#B89858", "#D8BC80"][j];
        c.strokeStyle = col;
        c.lineWidth = 3;
        c.beginPath();
        for (let i = 0; i <= n * 4; i++) {
          const s = i / (n * 4),
            u = -L2 + 20 + (largo - 60) * s,
            caida = Math.abs(Math.sin(s * n * Math.PI)) * 14 + r() * 0;
          const p = pr(u, w, ZS + 6 - caida);
          i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]);
        }
        c.stroke();
      });
      // un rollo terminado al pie del último caballete
      const [ox, oy] = pr(L2 - 20, 70, 0);
      E(c, ox, oy - 12, 26, 14, "#C8A86A");
      E(c, ox, oy - 12, 12, 6, "#8A7A5A");
      void P;
    }
    return { dibujar, alto: 200 };
  }
  return { paseoSogas };
})();
