// ---------- la vida del bosque viejo: estructuras místicas y fauna chica (assets de VIDA) ----------
// Lo que suma motor/vida.js para que Eldervald respire: tres lugares místicos con nombre propio (el Fresno de los
// Ecos, el Anillo de los álfar y la Poza de Urd) y los bichos que andan sin pelear (liebre, pinzón, mariposa,
// libélula, polilla, el pez que salta) más las flores que brotan donde se libera un campamento.
// Mismo estilo que el resto: caras planas, luz de arriba a la derecha, sombra elíptica, sin contornos.
(function () {
  "use strict";
  const { P, E, R, L, alfa, sombra, halo, RUNICO, RUNICO_CLARO, poli, azar, TAU } = DIB;
  const C = ASSETS.C;
  const F = FUTHARK;
  const ORO = "#FFD98A";

  // ---------- El Fresno de los Ecos ----------
  // Un fresno más viejo que Eikholt, de corteza pálida, con raíces que salen del piso como lomos y vetas de luz
  // rúnica que suben por el tronco al ritmo de un latido. De las ramas cuelgan tablillas talladas que dejaron los
  // que vinieron a escucharlo. o.brillo (0..1): cuánto late (lo sube la noche y escucharlo).
  function fresnoEcos(c, x, y, t, o) {
    const s = o.s || 1,
      X = (v) => x + v * s,
      Y = (v) => y - v * s,
      pp = (a, col) => P(c, a.map((v, i) => (i % 2 ? Y(v) : X(v))), col),
      b = o.brillo == null ? 0.5 : o.brillo,
      late = 0.5 + 0.5 * Math.sin(t * 1.6),
      v = Math.sin(t * 0.4) * 3 * s,
      r = azar(4471);
    halo(c, X(0), Y(60), 260 * s, RUNICO, 0.25 + b * 0.5);
    sombra(c, X(50), y + 8 * s, 230 * s, 52 * s, 0.42);
    // raíces: lomos que se abren por el piso (cara de arriba al sol, la de abajo en sombra)
    [[-1, 190, 26], [1, 210, 30], [-0.55, 150, 18], [0.6, 160, 22], [-0.15, 120, 14], [0.25, 130, 16]].forEach(([d, l, g], i) => {
      pp([d * 34, 62, d * l, -4, d * (l - 34), -12, d * 6, -2], i % 2 ? "#5E584C" : "#4A453C");
      pp([d * 34, 62, d * l, -4, d * (l - 16), 6, d * 22, 36], i % 2 ? "#8A8272" : "#6E685C");
      alfa(c, (0.3 + b * 0.6) * (0.6 + late * 0.4), () => L(c, X(d * 34), Y(30), X(d * (l - 10)), Y(-2), RUNICO, 2.5 * s));
      if (i < 4) pp([d * (l - 50), 2, d * (l - 20), 8, d * (l - 30), 14], C.musgo2);
    });
    // tronco: ancho, partido en dos cuerpos que se abrazan; la mitad izquierda en sombra
    pp([-58, 0, -50, 160, -78, 280, -40, 310, 0, 250, 46, 320, 84, 290, 52, 160, 60, 0], "#7E7666");
    pp([-58, 0, -50, 160, -78, 280, -40, 310, -4, 252, -8, 0], "#5E584C");
    pp([20, 0, 26, 150, 60, 286, 84, 290, 52, 160, 60, 0], "#9A927E");
    // grietas y el hueco donde se escucha
    pp([-14, 60, 8, 60, 6, 128, -6, 140, -16, 120], "#1E1A14");
    alfa(c, 0.35 + b * 0.5 * late, () => pp([-8, 70, 4, 70, 3, 118, -6, 126, -10, 110], RUNICO));
    L(c, X(-36), Y(30), X(-30), Y(150), "#4A453C", 3 * s);
    L(c, X(34), Y(20), X(40), Y(170), "#6E685C", 3 * s);
    // vetas rúnicas que suben: la luz corre de abajo a arriba
    const vetas = [[-30, 10, -44, 150, -60, 270], [18, 10, 28, 140, 62, 270], [-4, 140, -2, 220, 2, 250]];
    vetas.forEach((vt, k) => {
      const q = (t * 0.35 + k * 0.33) % 1;
      alfa(c, 0.25 + b * 0.45, () => {
        L(c, X(vt[0]), Y(vt[1]), X(vt[2]), Y(vt[3]), RUNICO, 3 * s);
        L(c, X(vt[2]), Y(vt[3]), X(vt[4]), Y(vt[5]), RUNICO, 2.5 * s);
      });
      const px = q < 0.5 ? vt[0] + (vt[2] - vt[0]) * q * 2 : vt[2] + (vt[4] - vt[2]) * (q - 0.5) * 2,
        py = q < 0.5 ? vt[1] + (vt[3] - vt[1]) * q * 2 : vt[3] + (vt[5] - vt[3]) * (q - 0.5) * 2;
      alfa(c, (0.4 + b * 0.6) * Math.sin(q * Math.PI), () => P(c, [X(px), Y(py + 7), X(px + 5), Y(py), X(px), Y(py - 7), X(px - 5), Y(py)], RUNICO_CLARO));
    });
    // runas talladas en la corteza
    alfa(c, 0.45 + b * 0.5, () => {
      F.dibujar(c, "ansuz", X(-30), Y(196), 30 * s, RUNICO, 3 * s);
      F.dibujar(c, "eihwaz", X(36), Y(210), 30 * s, RUNICO, 3 * s);
    });
    // copa: masas de hoja plateada del fresno (de atrás hacia adelante), con su cara al sol
    const masas = [];
    for (let k = 0; k < 11; k++) masas.push([(r() - 0.5) * 420, 330 + r() * 170, 70 + r() * 50, k % 3]);
    masas.sort((a, b2) => a[3] - b2[3]).forEach(([mx, my, mr, k]) => {
      P(c, poli(X(mx) + v, Y(my), mr * s, mr * 0.72 * s, 8, k + 0.3, [1, 0.9, 1.05, 0.88, 1, 0.92, 1.04, 0.86]), ["#34482E", "#435A3A", "#526C44"][k]);
      P(c, [X(mx) + v, Y(my) - mr * 0.72 * s, X(mx) + mr * 0.9 * s + v, Y(my) - mr * 0.18 * s, X(mx) + mr * 0.28 * s + v, Y(my)], "#6A8650");
    });
    // hojas de luz que titilan en la copa
    for (let k = 0; k < 14; k++) {
      const hx = (r() - 0.5) * 380,
        hy = 340 + r() * 150,
        a = Math.max(0, Math.sin(t * (1 + r()) + k * 1.7));
      alfa(c, a * (0.4 + b * 0.6), () => R(c, X(hx) + v - 2.5 * s, Y(hy) - 2.5 * s, 5 * s, 5 * s, k % 3 ? RUNICO_CLARO : ORO));
    }
    // tablillas colgadas que se mecen
    [[-150, 330, "fehu"], [-80, 350, "laguz"], [110, 340, "wunjo"], [170, 360, "algiz"], [30, 380, "berkano"]].forEach(([tx, ty, rn], k) => {
      const sw = Math.sin(t * 1.3 + k * 1.9) * 6 * s,
        largo = 46 + (k % 3) * 14;
      L(c, X(tx) + v, Y(ty), X(tx) + v + sw, Y(ty - largo), "#3A3026", 1.5 * s);
      const cx = X(tx) + v + sw,
        cy = Y(ty - largo);
      P(c, [cx - 8 * s, cy, cx + 8 * s, cy, cx + 8 * s, cy + 18 * s, cx - 8 * s, cy + 18 * s], "#7A5A3A");
      P(c, [cx, cy, cx + 8 * s, cy, cx + 8 * s, cy + 18 * s, cx, cy + 18 * s], "#9A7A52");
      alfa(c, 0.5 + b * 0.5, () => F.dibujar(c, rn, cx, cy + 15 * s, 12 * s, RUNICO, 1.6 * s));
    });
  }

  // ---------- El Anillo de los álfar ----------
  // Nueve hongos de sombrero ancho en ronda perfecta, con la hierba de adentro más verde que la de afuera y una
  // laja chata en el medio con Ingwaz. De día parecen hongos; de noche (o.brillo) se encienden de a uno, en orden.
  function anilloAlfar(c, x, y, t, o) {
    const s = o.s || 1,
      b = o.brillo == null ? 0.5 : o.brillo;
    halo(c, x, y - 10 * s, 140 * s, "#8CF0B4", b * 0.6);
    // la hierba de adentro y la ronda gastada
    P(c, poli(x, y, 112 * s, 48 * s, 18, 0.1), "#34421F");
    P(c, poli(x, y, 96 * s, 40 * s, 18, 0.1), "#4E6A2E");
    P(c, poli(x + 8 * s, y - 4 * s, 60 * s, 22 * s, 14, 0.3), "#5C7A36");
    // la laja del medio
    P(c, [x - 26 * s, y + 2 * s, x - 20 * s, y - 8 * s, x + 18 * s, y - 10 * s, x + 28 * s, y], "#6A6C64");
    P(c, [x - 2 * s, y - 9 * s, x + 18 * s, y - 10 * s, x + 28 * s, y, x + 4 * s, y + 1 * s], "#8A8C82");
    alfa(c, 0.35 + b * 0.65, () => F.dibujar(c, "ingwaz", x + 2 * s, y - 1 * s, 9 * s, "#8CF0B4", 1.8 * s));
    // los nueve hongos: los de atrás primero
    const lista = [];
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * TAU - Math.PI / 2;
      lista.push([x + Math.cos(a) * 100 * s, y + Math.sin(a) * 42 * s, k]);
    }
    lista.sort((a, b2) => a[1] - b2[1]).forEach(([hx, hy, k]) => {
      const on = Math.max(0, Math.min(1, b * 1.6 - 0.2)) * (0.65 + 0.35 * Math.sin(t * 2.2 - k * 0.7)),
        h = (14 + (k % 3) * 4) * s,
        w = (10 + (k % 2) * 3) * s;
      sombra(c, hx + 3 * s, hy + 1, w * 0.9, 3 * s, 0.3);
      R(c, hx - 2.5 * s, hy - h, 5 * s, h, "#D8DCCC");
      R(c, hx - 2.5 * s, hy - h, 2.5 * s, h, "#B4B8A8");
      P(c, [hx - w, hy - h + 2 * s, hx, hy - h - 9 * s, hx + w, hy - h + 2 * s], "#4E8E7A");
      P(c, [hx, hy - h - 9 * s, hx + w, hy - h + 2 * s, hx + w * 0.3, hy - h + 2 * s], "#7CC4AE");
      if (on > 0.02) {
        halo(c, hx, hy - h - 2 * s, 26 * s, "#8CF0B4", on);
        alfa(c, on, () => P(c, [hx - w * 0.7, hy - h + 1 * s, hx, hy - h - 7 * s, hx + w * 0.7, hy - h + 1 * s], "#BFF7D6"));
      }
      R(c, hx - 4 * s, hy - h - 3 * s, 2 * s, 2 * s, "#F2ECEC");
    });
  }

  // ---------- La Poza de Urd ----------
  // Una poza quieta y redonda, cercada por siete piedras con runas, donde dicen que una de las Nornas mira el
  // pasado. De día refleja el cielo; de noche (o.brillo) muestra estrellas que no están arriba: el Carro de Odín.
  const ESTRELLAS = [[-62, -8], [-40, -18], [-18, -14], [2, -22], [22, -10], [44, -20], [60, -6], [-30, 4], [36, 6], [-6, 10], [12, -2], [-50, 8], [52, 10]];
  const CARRO = [0, 1, 2, 3, 4, 5, 6];
  const RUNAS_POZA = ["uruz", "fehu", "jera", "dagaz", "perthro", "isa", "othala"];
  function pozaEstrellas(c, x, y, t, o) {
    const s = o.s || 1,
      b = o.brillo == null ? 0.3 : o.brillo,
      cy = y - 34 * s;
    halo(c, x, cy, 180 * s, "#C8F2F4", 0.2 + b * 0.5);
    // el borde de tierra y piedra
    P(c, poli(x, cy, 116 * s, 50 * s, 20, 0.05), "#3A3428");
    P(c, poli(x, cy + 2 * s, 106 * s, 44 * s, 20, 0.05), "#56524A");
    // el agua: honda y quieta; de día el cielo pálido arriba a la derecha
    P(c, poli(x, cy + 3 * s, 96 * s, 38 * s, 20, 0.05), "#14202E");
    alfa(c, 1 - b, () => P(c, poli(x + 24 * s, cy - 6 * s, 54 * s, 18 * s, 14, 0.2), "#3E5A70"));
    alfa(c, 1 - b, () => P(c, poli(x + 40 * s, cy - 12 * s, 24 * s, 7 * s, 10, 0.2), "#7A9AB0"));
    // las estrellas de la poza y la línea del Carro
    if (b > 0.05) {
      alfa(c, b * 0.55, () => {
        c.strokeStyle = "#C8F2F4";
        c.lineWidth = 1.2 * s;
        c.beginPath();
        CARRO.forEach((i, k) => (k ? c.lineTo : c.moveTo).call(c, x + ESTRELLAS[i][0] * s, cy + ESTRELLAS[i][1] * s));
        c.stroke();
      });
      ESTRELLAS.forEach(([ex, ey], k) => {
        const a = b * (0.55 + 0.45 * Math.sin(t * (1.5 + (k % 4) * 0.6) + k));
        const z = (k < 7 ? 3.4 : 2.2) * s;
        alfa(c, a, () => P(c, [x + ex * s, cy + ey * s - z, x + ex * s + z * 0.7, cy + ey * s, x + ex * s, cy + ey * s + z, x + ex * s - z * 0.7, cy + ey * s], k < 7 ? "#F2ECEC" : "#C8F2F4"));
      });
    }
    // ondas que corren despacio
    const q = (t * 0.25) % 1;
    alfa(c, 0.3 * (1 - q), () => {
      c.strokeStyle = b > 0.5 ? "#C8F2F4" : "#9AB4C4";
      c.lineWidth = 1.2 * s;
      c.beginPath();
      c.ellipse(x - 20 * s, cy + 6 * s, 20 * s + q * 50 * s, (8 + q * 20) * s, 0, 0, TAU);
      c.stroke();
    });
    // las siete piedras (las de atrás primero)
    const pie = [];
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * TAU + 0.3;
      pie.push([x + Math.cos(a) * 124 * s, cy + Math.sin(a) * 56 * s, k]);
    }
    pie.sort((a, b2) => a[1] - b2[1]).forEach(([px, py, k]) => {
      const h = (30 + (k % 3) * 10) * s;
      sombra(c, px + 6 * s, py + 2, 14 * s, 4 * s, 0.32);
      P(c, [px - 10 * s, py, px - 8 * s, py - h, px + 2 * s, py - h - 6 * s, px + 10 * s, py - h + 2 * s, px + 11 * s, py], "#6A6C64");
      P(c, [px + 2 * s, py - h - 6 * s, px + 10 * s, py - h + 2 * s, px + 11 * s, py, px + 2 * s, py], "#8A8C82");
      alfa(c, 0.25 + b * 0.7, () => F.dibujar(c, RUNAS_POZA[k], px + 1 * s, py - h * 0.25, h * 0.45, "#C8F2F4", 1.8 * s));
    });
  }

  // ---------- Las flores del despertar ----------
  // Las que brotan donde se libera un campamento: campanitas claras, estrellas doradas y alguna roja. o.crece (0..1).
  function floresDespertar(c, x, y, t, o) {
    const s = (o.s || 1) * (o.crece == null ? 1 : o.crece),
      r = azar(Math.round((o.sem || 1) * 1000) + 11);
    if (s <= 0.02) return;
    for (let k = 0; k < 9; k++) {
      const fx = x + (r() - 0.5) * 70 * (o.s || 1),
        fy = y + (r() - 0.5) * 26 * (o.s || 1),
        h = (8 + r() * 10) * s,
        tipo = r(),
        v = Math.sin(t * 2 + fx) * 1.5 * s;
      L(c, fx, fy, fx + v, fy - h, "#5C7A36", 1.4);
      if (tipo < 0.45) {
        P(c, [fx + v - 4 * s, fy - h, fx + v, fy - h - 6 * s, fx + v + 4 * s, fy - h, fx + v, fy - h + 3 * s], "#F2ECEC");
        R(c, fx + v - 1, fy - h - 1, 2, 2, ORO);
      } else if (tipo < 0.85) {
        P(c, [fx + v, fy - h - 5 * s, fx + v + 4 * s, fy - h, fx + v, fy - h + 5 * s, fx + v - 4 * s, fy - h], ORO);
        P(c, [fx + v, fy - h - 5 * s, fx + v + 4 * s, fy - h, fx + v, fy - h], "#FFF4D0");
      } else P(c, [fx + v - 3 * s, fy - h, fx + v, fy - h - 5 * s, fx + v + 3 * s, fy - h, fx + v, fy - h + 2 * s], "#C8402D");
    }
  }

  // ---------- fauna chica (no pelea; huye) ----------
  // La liebre de Eldervald: parda con la panza clara y las orejas de punta negra. o.salto (0..1) en medio salto,
  // o.mira (-1 / 1) hacia dónde.
  function liebre(c, x, y, t, o) {
    const s = o.s || 1,
      d = o.mira || 1,
      sal = o.salto || 0,
      alto = Math.sin(sal * Math.PI) * 16 * s,
      X = (v) => x + v * s * d,
      Y = (v) => y - v * s - alto;
    sombra(c, x, y + 1, 12 * s * (1 - sal * 0.3), 3 * s, 0.3);
    const pp = (a, col) => P(c, a.map((v, i) => (i % 2 ? Y(v) : X(v))), col);
    const est = sal > 0 ? 1.25 : 1;
    pp([-12 * est, 2, -10, 12, 2, 15, 10, 8, 8, 0], "#7A5A3A");
    pp([-10, 12, 2, 15, 0, 8, -10, 6], "#9A7A52");
    pp([-6, 1, 6, 1, 6, 4, -6, 4], "#D8CCB4");
    pp([6, 8, 12, 16, 16, 12, 14, 6], "#8A6A44"); // cabeza
    pp([10, 15, 8, 28, 11, 28, 12, 16], "#7A5A3A"); // orejas
    pp([13, 15, 13, 27, 15, 27, 15, 15], "#9A7A52");
    pp([8, 26, 8, 28, 11, 28, 11, 26], "#111111");
    R(c, X(14) - 1, Y(13) - 1, 2, 2, "#111111");
    pp([-13 * est, 6, -16 * est, 9, -12 * est, 10], "#F2ECEC");
  }
  // El pinzón: pajarito pardo de pecho rojizo. o.vuela (0..1): alas abiertas; o.picotea.
  function pinzon(c, x, y, t, o) {
    const s = o.s || 1,
      d = o.mira || 1,
      X = (v) => x + v * s * d,
      Y = (v) => y - v * s - (o.alto || 0);
    if (!o.alto) sombra(c, x, y + 1, 5 * s, 1.6 * s, 0.3);
    const pp = (a, col) => P(c, a.map((v, i) => (i % 2 ? Y(v) : X(v))), col);
    const pic = o.picotea ? Math.max(0, Math.sin(t * 14 + x)) * 3 : 0;
    pp([-7, 3, -2, 8, 5, 6, 4, 1], "#6A5034");
    pp([-2, 6, 5, 6, 4, 1, 0, 2], "#C8402D");
    pp([3, 6 - pic, 7, 9 - pic, 9, 6 - pic, 6, 4 - pic], "#4A3A2A");
    pp([9, 6 - pic, 12, 5.5 - pic, 9, 5 - pic], ORO);
    pp([-7, 3, -12, 6, -11, 3], "#4A3A2A");
    if (o.vuela) {
      const a = Math.sin(t * 40 + x) * 9;
      pp([-2, 6, -6, 10 + a, 3, 7], "#8A6A44");
      pp([0, 6, 6, 10 - a, 4, 7], "#6A5034");
    }
  }
  // La mariposa de los claros: alas que se abren y se cierran. o.col.
  function mariposa(c, x, y, t, o) {
    const s = o.s || 1,
      a = Math.abs(Math.sin(t * 16 + (o.sem || 0))),
      col = o.col || "#F5A524";
    const w = 8 * s * (0.25 + a * 0.75);
    P(c, [x, y, x - w, y - 7 * s, x - w * 0.9, y + 2 * s], col);
    P(c, [x, y, x + w, y - 7 * s, x + w * 0.9, y + 2 * s], col);
    P(c, [x, y, x - w * 0.7, y + 6 * s, x - w * 0.2, y + 5 * s], "#111111");
    P(c, [x, y, x + w * 0.7, y + 6 * s, x + w * 0.2, y + 5 * s], "#111111");
    R(c, x - 0.8 * s, y - 4 * s, 1.6 * s, 8 * s, "#2A2420");
  }
  // La libélula del lago: cuerpo azul largo y cuatro alas de vidrio.
  function libelula(c, x, y, t, o) {
    const s = o.s || 1,
      d = o.mira || 1,
      a = Math.sin(t * 60 + (o.sem || 0)) * 2 * s;
    L(c, x - 12 * s * d, y, x + 6 * s * d, y, "#4A78D0", 2.4 * s);
    R(c, x + 5 * s * d - 2 * s, y - 2 * s, 4 * s, 4 * s, "#73D5DB");
    alfa(c, 0.55, () => {
      P(c, [x, y, x - 4 * s * d, y - 9 * s - a, x + 3 * s * d, y - 8 * s - a], "#C8F2F4");
      P(c, [x, y, x - 8 * s * d, y - 6 * s + a, x - 2 * s * d, y - 6 * s + a], "#C8F2F4");
    });
  }
  // La polilla de los faroles: blanca, de alas cortas que tiemblan.
  function polilla(c, x, y, t, o) {
    const s = o.s || 1,
      a = Math.abs(Math.sin(t * 30 + (o.sem || 0)));
    P(c, [x, y, x - 5 * s, y - 3 * s * a - 1, x - 4 * s, y + 3 * s], "#F2ECEC");
    P(c, [x, y, x + 5 * s, y - 3 * s * a - 1, x + 4 * s, y + 3 * s], "#E0B2B2");
  }
  // El pez del lago, a medio salto: plateado con el lomo oscuro. o.giro (radianes).
  function pez(c, x, y, t, o) {
    const s = o.s || 1;
    c.save();
    c.translate(x, y);
    c.rotate(o.giro || 0);
    P(c, [-12 * s, 0, -4 * s, -5 * s, 8 * s, -3 * s, 12 * s, 0, 8 * s, 3 * s, -4 * s, 4 * s], "#B4BEC4");
    P(c, [-4 * s, -5 * s, 8 * s, -3 * s, 12 * s, 0, -6 * s, -1 * s], "#4E5C68");
    P(c, [-12 * s, 0, -18 * s, -5 * s, -17 * s, 5 * s], "#7A8A94");
    R(c, 7 * s, -2 * s, 1.6 * s, 1.6 * s, "#111111");
    c.restore();
  }

  Object.assign(ASSETS.LISTA, {
    fresnoEcos: { f: fresnoEcos, figura: true, alto: 520, choque: { r: 70 }, grupo: "vida", luz: true },
    anilloAlfar: { f: anilloAlfar, figura: true, alto: 30, choque: null, grupo: "vida", luz: true },
    pozaEstrellas: { f: pozaEstrellas, figura: true, alto: 60, choque: { w: 210, h: 76 }, grupo: "vida", luz: true },
    floresDespertar: { f: floresDespertar, figura: true, alto: 20, choque: null, grupo: "vida", piso: true },
    liebre: { f: liebre, fv: ASSETS.ladoV(liebre), vol: true, alto: 30, choque: null, grupo: "vida" },
    pinzon: { f: pinzon, fv: ASSETS.ladoV(pinzon), vol: true, alto: 12, choque: null, grupo: "vida" },
    mariposa: { f: mariposa, figura: true, alto: 10, choque: null, grupo: "vida" },
    libelula: { f: libelula, figura: true, alto: 10, choque: null, grupo: "vida" },
    polilla: { f: polilla, figura: true, alto: 8, choque: null, grupo: "vida" },
    pez: { f: pez, fv: ASSETS.ladoV(pez), vol: true, alto: 10, choque: null, grupo: "vida" },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, {
    fresnoEcos: { brillo: 0.8 },
    anilloAlfar: { brillo: 1 },
    pozaEstrellas: { brillo: 1 },
    liebre: {},
    pinzon: { picotea: true },
    mariposa: {},
    libelula: {},
    polilla: {},
    pez: { giro: -0.4 },
  });
})();
