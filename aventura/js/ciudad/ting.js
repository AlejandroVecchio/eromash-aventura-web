// ---------- las piedras del Ting en volumen (módulo TING25) ----------
// El círculo de la Asamblea: el menhir negro de la piedra dormida en el centro y los doce asientos de piedra en ronda,
// cada uno con sus tres medidas y su lugar en el piso, así el círculo gira con la cámara como las casas (antes era un
// dibujo de frente que quedaba igual girara como girara la vista). Caras planas, luz de arriba a la derecha.
// En el plano de cada piedra u va a lo ancho y w de frente (w+ mira al menhir en los asientos).
//   TING25.menhir(sem) · TING25.asiento(sem) → { dibujar(c, x, y, giro, k, t), alto }
window.TING25 = (function () {
  "use strict";
  const { P, E, alfa, azar, sombra, halo, RUNICO } = DIB;

  // un prisma de piedra: base (polígono en el piso, en sentido horario visto de arriba), alto, cuánto se angosta arriba
  // y la tapa, con tres tonos según la luz; devuelve las caras que se ven para pintarles encima
  function prisma(c, pr, base, alto, angosta, tonos, punta) {
    const n = base.length;
    const cu = base.reduce((a, p) => a + p[0], 0) / n,
      cw = base.reduce((a, p) => a + p[1], 0) / n;
    const arriba = base.map(([u, w], i) => {
      const z = punta ? alto * (1 - punta[i] || 1) : alto;
      return [cu + (u - cu) * angosta, cw + (w - cw) * angosta, z];
    });
    const caras = [];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n,
        [u0, w0] = base[i],
        [u1, w1] = base[j];
      // la normal hacia afuera
      const nu = w1 - w0,
        nw = -(u1 - u0),
        l = Math.hypot(nu, nw);
      const [nx, ny] = pr.mira(nu / l, nw / l);
      if (ny <= 0.02) continue;
      caras.push({ i, j, nx, ny, d: pr.fondo((u0 + u1) / 2, (w0 + w1) / 2) });
    }
    caras.sort((a, b) => a.d - b.d);
    for (const f of caras) {
      const a = pr(base[f.i][0], base[f.i][1], 0),
        b = pr(base[f.j][0], base[f.j][1], 0),
        b2 = pr(...arriba[f.j]),
        a2 = pr(...arriba[f.i]);
      P(c, [...a, ...b, ...b2, ...a2], f.nx > 0.25 ? tonos[2] : f.nx < -0.25 ? tonos[0] : tonos[1]);
    }
    P(c, arriba.map((p) => pr(...p)).flat(), tonos[3] || tonos[2]);
    return { caras, base, arriba };
  }

  // El menhir de la piedra dormida: alto, negro, de cinco caras con la punta quebrada, y la runa de Tiwaz raspada que
  // apenas se enciende de azul rúnico (la piedra "casi contesta").
  function menhir(sem) {
    const r = azar(sem * 13 + 1);
    const base = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3,
        rad = 46 + r() * 16;
      base.push([Math.cos(a) * rad, Math.sin(a) * rad * 0.8]);
    }
    const ALTO = 330;
    const TONOS = ["#141416", "#1C1C1E", "#2C2C30", "#38383E"];
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 30, y + 8, 90, 24, 0.4);
      const { caras, arriba } = prisma(c, pr, base, ALTO, 0.55, TONOS, [0, 0.12, 0.04, 0.18, 0.08]);
      // la runa en la cara que más mira a la cámara
      const f = caras.slice().sort((a, b) => b.ny - a.ny)[0];
      if (!f) return;
      const [u0, w0] = base[f.i],
        [u1, w1] = base[f.j];
      const mu = (u0 + u1) / 2,
        mw = (w0 + w1) / 2,
        du = (u1 - u0) / Math.hypot(u1 - u0, w1 - w0),
        dw = (w1 - w0) / Math.hypot(u1 - u0, w1 - w0);
      const late = 0.35 + Math.sin(t * 0.9) * 0.2;
      const h = 110,
        zb = 110;
      const punto = (a, b) => {
        const z = zb - b * h;
        const enc = 1 - (z / ALTO) * 0.45; // la cara se angosta hacia arriba
        return pr(mu * enc + du * a * h, mw * enc + dw * a * h, z);
      };
      alfa(c, late, () => {
        c.strokeStyle = RUNICO;
        c.lineWidth = 5;
        c.lineCap = "round";
        c.beginPath();
        for (const [a, b, d, e] of FUTHARK.T.tiwaz) {
          const p = punto(a, b),
            q = punto(d, e);
          c.moveTo(p[0], p[1]);
          c.lineTo(q[0], q[1]);
        }
        c.stroke();
      });
      const m = punto(0, -0.5);
      if (!window.CALIDAD || CALIDAD.nivel !== "baja") halo(c, m[0], m[1], 120, RUNICO, late * 0.35);
      void arriba;
    }
    return { dibujar, alto: ALTO + 20 };
  }

  // Un asiento del círculo: un bloque de piedra gris, un poco gastado arriba, con algo de musgo al pie.
  function asiento(sem) {
    const r = azar(sem * 29 + 5);
    const W2 = 40 + r() * 10,
      D2 = 26 + r() * 6,
      ALTO = 52 + r() * 16;
    const base = [[-W2, -D2], [W2, -D2], [W2, D2], [-W2, D2]];
    const TONOS = ["#5E5C58", "#6A6862", "#7C7A72", "#8E8C84"];
    const musgo = r() < 0.6;
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 12, y + 4, 54, 16, 0.32);
      prisma(c, pr, base, ALTO, 0.88, TONOS);
      if (musgo) {
        const p = pr(-W2 * 0.4, D2, 6);
        E(c, p[0], p[1], 20, 7, "#4A5A2E");
      }
      void t;
    }
    return { dibujar, alto: ALTO + 10 };
  }

  return { menhir, asiento, prisma };
})();
