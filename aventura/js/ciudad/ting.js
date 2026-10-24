// ---------- las piedras del Ting en volumen (módulo TING25) ----------
// El círculo de la Asamblea: el menhir negro de la piedra dormida en el centro y las doce piedras paradas en ronda,
// cada uno con sus tres medidas y su lugar en el piso, así el círculo gira con la cámara como las casas (antes era un
// dibujo de frente que quedaba igual girara como girara la vista). Caras planas, luz de arriba a la derecha.
// En el plano de cada piedra u va a lo ancho y w de frente (w+ mira al menhir en los asientos).
//   TING25.menhir(sem) · TING25.asiento(sem) · TING25.cupula(sem) → { dibujar(c, x, y, giro, k, t), alto }
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

  // Una piedra parada con una runa grabada que brilla en azul rúnico, en la cara que más mira a la cámara.
  // op: { lados, ru, rw, alto, angosta, tonos, punta, runa, rh (alto de la runa), zr (dónde empieza), luz (0-1) }
  function runica(sem, op) {
    const r = azar(sem * 13 + 1);
    const base = [];
    for (let i = 0; i < op.lados; i++) {
      const a = (i / op.lados) * Math.PI * 2 + 0.3;
      base.push([Math.cos(a) * op.ru * (0.85 + r() * 0.3), Math.sin(a) * op.rw * (0.85 + r() * 0.3)]);
    }
    const ALTO = op.alto,
      punta = op.punta || base.map(() => r() * 0.16);
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + op.ru * 0.6, y + 8, op.ru * 1.9, op.ru * 0.5, 0.4);
      const { caras } = prisma(c, pr, base, ALTO, op.angosta, op.tonos, punta);
      const f = caras.slice().sort((a, b) => b.ny - a.ny)[0];
      if (!f) return;
      const [u0, w0] = base[f.i],
        [u1, w1] = base[f.j];
      const mu = (u0 + u1) / 2,
        mw = (w0 + w1) / 2,
        lc = Math.hypot(u1 - u0, w1 - w0),
        du = (u1 - u0) / lc,
        dw = (w1 - w0) / lc;
      const late = (op.luz || 0.35) + Math.sin(t * 0.9 + sem) * 0.2;
      const h = op.rh,
        zb = op.zr;
      const punto = (a, b) => {
        const z = zb - b * h;
        const enc = 1 - (z / ALTO) * (1 - op.angosta); // la cara se angosta hacia arriba
        return pr(mu * enc + du * a * h, mw * enc + dw * a * h, z);
      };
      for (const [ancho, col, al] of [[h * 0.12, "rgba(115,213,219,0.25)", 1], [h * 0.045, RUNICO, late]]) {
        alfa(c, Math.min(1, al), () => {
          c.strokeStyle = col;
          c.lineWidth = ancho;
          c.lineCap = "round";
          c.beginPath();
          for (const [a, b, d, e] of FUTHARK.T[op.runa]) {
            const p = punto(a, b),
              q = punto(d, e);
            c.moveTo(p[0], p[1]);
            c.lineTo(q[0], q[1]);
          }
          c.stroke();
        });
      }
      const m = punto(0, -0.5);
      if (!window.CALIDAD || CALIDAD.nivel !== "baja") halo(c, m[0], m[1], h * 1.1, RUNICO, late * 0.35);
    }
    return { dibujar, alto: ALTO + 20 };
  }

  // El menhir de la piedra dormida: alto, negro, de cinco caras con la punta quebrada, y la runa de Tiwaz raspada que
  // apenas se enciende de azul rúnico (la piedra "casi contesta").
  function menhir(sem) {
    return runica(sem, { lados: 5, ru: 92, rw: 66, alto: 340, angosta: 0.62, tonos: ["#141416", "#1C1C1E", "#2C2C30", "#38383E"], punta: [0, 0.12, 0.04, 0.18, 0.08], runa: "tiwaz", rh: 130, zr: 120, luz: 0.35 });
  }

  // Las piedras de la cúpula al pie de la muralla: menhires grises más altos que la empalizada, con Algiz (la
  // protección) encendida en azul rúnico.
  function cupula(sem) {
    return runica(sem, { lados: 6, ru: 80, rw: 50, alto: 520, angosta: 0.6, tonos: ["#3A3E42", "#4A4E52", "#5E6266", "#6A6E72"], runa: "algiz", rh: 170, zr: 330, luz: 0.7 });
  }

  // Una de las doce piedras del círculo: piedras paradas, más altas que una persona, de seis caras con la punta gastada
  // y redondeada, grises con musgo al pie (como en la lámina del Ting); cada una distinta.
  function asiento(sem) {
    const r = azar(sem * 29 + 5);
    const RU = 30 + r() * 8,
      RW = 20 + r() * 5,
      ALTO = 150 + r() * 40;
    const base = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.2;
      base.push([Math.cos(a) * RU * (0.9 + r() * 0.2), Math.sin(a) * RW * (0.9 + r() * 0.2)]);
    }
    // la punta: más baja de los costados, como gastada
    const punta = base.map(([u]) => 0.06 + Math.abs(u / RU) * 0.16 + r() * 0.04);
    const TONOS = ["#55534F", "#65635D", "#7A7870", "#8C8A82"];
    const musgo = r() < 0.7;
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 14, y + 4, 44, 14, 0.34);
      prisma(c, pr, base, ALTO, 0.62, TONOS, punta);
      if (musgo) {
        const p = pr(-RU * 0.3, RW * 0.9, 10);
        E(c, p[0], p[1], 18, 7, "#4A5A2E");
        E(c, p[0] + 10, p[1] - 4, 9, 4, "#56662C");
      }
      void t;
    }
    return { dibujar, alto: ALTO + 10 };
  }

  return { menhir, asiento, cupula, runica, prisma };
})();
