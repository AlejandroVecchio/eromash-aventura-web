// ---------- el Claro del Ciervo, versión épica (se suma a ASSETS) ----------
// Según «Eldervald — lugares» (Alejandro, 23/10/2026, «tiene que ser más épico»): una cuenca rodeada de paredes de
// roca y de los árboles más viejos, la columnata de astas mudadas (las viejas crecidas con las raíces, las nuevas a ras
// del suelo), las manchas de vegetación enferma alrededor de cada menhir, la cama de musgo con un asta, la escalera
// natural de raíces de la llegada, el apostadero de la loma con su cofre y la fisura del norte donde se pierde el hilo.
// Mismas reglas que assets.js: colores planos, luz de arriba a la derecha.
(function () {
  "use strict";
  const { P, E, R, L, alfa, azar, sombra, halo, poli, TAU } = DIB;
  const C = ASSETS.C;
  const HUESO = ["#B8B0A0", "#D8D0C0", "#8A8274"];
  const ROCA = ["#3A3E3C", "#4A4E4A", "#5A5E58", "#2C302E"];

  // una cornamenta mudada: tronco curvo con puntas
  function asta(c, x, y, l, dir, s, col) {
    const ex = x + dir * l * 0.5,
      ey = y - l;
    c.lineCap = "round";
    L(c, x, y, x + dir * l * 0.15, y - l * 0.5, col, 16 * s);
    L(c, x + dir * l * 0.15, y - l * 0.5, ex, ey, col, 12 * s);
    for (let k = 1; k <= 3; k++) {
      const u = k / 4,
        px = x + dir * l * 0.15 * (u * 2) + (ex - x) * u * 0.6,
        py = y - l * u;
      L(c, px, py, px + dir * 40 * s, py - 36 * s, col, 8 * s);
    }
  }

  // Arco de astas: dos cornamentas viejas que se tocan arriba, enlazadas por raíces. o.viejo: crecido con raíces,
  // más alto y oscuro; o.cinta: la cinta de la madre de Eydis (casi un hilo, con dos cuentas de madera);
  // o.caido: derrumbado (al romperse el soporte cercano).
  function arcoAstas(c, x, y, t, o) {
    const s = o.s || 1,
      h = (o.viejo ? 300 : 200) * s,
      col = o.viejo ? HUESO[2] : HUESO[0];
    sombra(c, x + 10 * s, y + 4 * s, 110 * s, 16 * s);
    if (o.caido) {
      asta(c, x - 90 * s, y + 6 * s, 140 * s, 1, s * 0.8, col);
      P(c, [x - 30 * s, y + 6 * s, x + 60 * s, y - 10 * s, x + 100 * s, y + 6 * s], C.troncoSombra);
      return;
    }
    // raíces que trepan por las astas
    if (o.viejo) {
      L(c, x - 70 * s, y, x - 50 * s, y - h * 0.7, C.troncoSombra, 12 * s);
      L(c, x + 70 * s, y, x + 54 * s, y - h * 0.6, C.tronco, 12 * s);
    }
    asta(c, x - 70 * s, y, h, 1, s, col);
    asta(c, x + 70 * s, y, h, -1, s, HUESO[o.viejo ? 0 : 1]);
    if (o.viejo) {
      L(c, x - 30 * s, y - h * 0.9, x + 30 * s, y - h * 0.92, C.tronco, 10 * s);
      E(c, x, y - h * 0.94, 30 * s, 10 * s, C.musgo2);
    }
    if (o.cinta) {
      const bal = Math.sin(t * 1.2) * 2 * s;
      L(c, x - 6 * s, y - h * 0.86, x - 4 * s + bal, y - h * 0.86 + 60 * s, "#A8A094", 1.6 * s);
      E(c, x - 4 * s + bal, y - h * 0.86 + 40 * s, 3 * s, 3 * s, C.madera);
      E(c, x - 4 * s + bal, y - h * 0.86 + 48 * s, 3 * s, 3 * s, C.maderaVieja);
    }
  }

  // Pared de roca de la cuenca: un tramo de acantilado con escalones y musgo arriba.
  function paredRoca(c, x, y, t, o) {
    const s = o.s || 1,
      r = azar((o.sem || 1) * 131),
      w = 230 * s,
      h = (240 + r() * 120) * s;
    const pts = [x - w, y + 6 * s];
    for (let k = 0; k <= 6; k++) pts.push(x - w + (k / 6) * w * 2, y - h + (r() - 0.5) * 60 * s);
    pts.push(x + w, y + 6 * s);
    P(c, pts, ROCA[1]);
    // facetas: la cara al sol más clara, grietas oscuras
    for (let k = 0; k < 4; k++) {
      const fx = x - w + (k + 0.5) * (w / 2),
        fh = h * (0.5 + r() * 0.4);
      P(c, [fx, y, fx + 30 * s, y - fh, fx + 80 * s, y - fh * 0.8, fx + 70 * s, y], k % 2 ? ROCA[2] : ROCA[0]);
      L(c, fx - 10 * s, y - fh * 0.2, fx + 6 * s, y - fh * 0.9, ROCA[3], 3 * s);
    }
    // el borde de arriba con musgo y raíces colgando
    for (let k = 0; k < 6; k++) E(c, x - w + (k + 0.5) * (w / 3), y - h + 6 * s + (r() - 0.5) * 30 * s, 50 * s, 12 * s, k % 2 ? C.musgo2 : "#3E5A30");
    for (let k = 0; k < 4; k++) {
      const rx = x - w + r() * w * 2;
      L(c, rx, y - h + 10 * s, rx + (r() - 0.5) * 20 * s, y - h + (60 + r() * 80) * s, C.troncoSombra, 3 * s);
    }
  }

  // Mancha de vegetación enferma alrededor de un menhir (se pinta en el piso): pasto gris, flores vencidas.
  function manchaEnferma(c, x, y, t, o) {
    const s = o.s || 1,
      r = azar((o.sem || 1) * 71),
      k = o.retraida ? 0.45 : 1;
    alfa(c, 0.75, () => P(c, poli(x, y, 340 * s * k, 230 * s * k, 14, r(), [1, 0.86, 1.1, 0.9, 1.05, 0.8, 1, 0.92]), "#5E605A"));
    alfa(c, 0.8, () => P(c, poli(x, y, 220 * s * k, 150 * s * k, 12, r()), "#6E6E66"));
    for (let i = 0; i < 26 * k; i++) {
      const a = r() * TAU,
        d = r() * 300 * s * k,
        px = x + Math.cos(a) * d,
        py = y + Math.sin(a) * d * 0.68;
      L(c, px, py, px + (r() - 0.5) * 8, py - 12 - r() * 10, "#8A8A80", 2);
      if (i % 4 === 0) E(c, px, py - 14, 3, 2, "#7A6A5A");
    }
  }

  // La cama de musgo: una depresión ancha con el musgo aplastado y un asta mudada al lado (en el piso).
  function camaMusgo(c, x, y, t, o) {
    const s = o.s || 1;
    E(c, x, y, 260 * s, 150 * s, "#2E4426");
    E(c, x, y + 10 * s, 210 * s, 116 * s, "#3E5A30");
    E(c, x - 20 * s, y + 6 * s, 150 * s, 76 * s, "#344E2A");
    for (let k = 0; k < 6; k++) L(c, x - 90 * s + k * 34 * s, y + 30 * s, x - 80 * s + k * 34 * s, y + 24 * s, "#C8C0B0", 1.5 * s);
    asta(c, x + 220 * s, y + 40 * s, 120 * s, -1, s * 0.6, HUESO[0]);
  }

  // La escalera natural de raíces que baja del borde de la cuenca.
  function escaleraRaices(c, x, y, t, o) {
    const s = o.s || 1;
    for (let k = 0; k < 7; k++) {
      const yy = y - k * 22 * s,
        xx = x + k * 10 * s;
      c.lineCap = "round";
      L(c, xx - 70 * s, yy, xx + 70 * s, yy - 6 * s, k % 2 ? C.tronco : C.troncoSombra, 14 * s);
      E(c, xx - 40 * s, yy - 8 * s, 14 * s, 4 * s, C.musgo2);
    }
    L(c, x - 90 * s, y + 10 * s, x - 20 * s, y - 170 * s, C.troncoSombra, 16 * s);
    L(c, x + 100 * s, y, x + 150 * s, y - 160 * s, C.tronco, 16 * s);
  }

  // El apostadero de la loma: una plataforma vieja de madera, un banco vencido, muescas de muchas esperas y el
  // cofrecito bajo las tablas (o.abierto).
  function apostadero(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 16 * s, y + 6 * s, 120 * s, 20 * s);
    [-80, 80].forEach((dx) => R(c, x + dx * s - 4 * s, y - 90 * s, 8 * s, 90 * s, C.maderaSombra));
    [-60, 60].forEach((dx) => R(c, x + dx * s - 4 * s, y - 100 * s, 8 * s, 100 * s, C.madera));
    L(c, x - 80 * s, y - 20 * s, x + 80 * s, y - 80 * s, C.maderaSombra, 4 * s);
    P(c, [x - 100 * s, y - 90 * s, x + 100 * s, y - 90 * s, x + 110 * s, y - 104 * s, x - 90 * s, y - 104 * s], C.maderaVieja);
    for (let k = 0; k < 8; k++) R(c, x - 96 * s + k * 26 * s, y - 104 * s, 2 * s, 14 * s, C.maderaSombra);
    // baranda y banco vencido
    L(c, x - 90 * s, y - 104 * s, x - 90 * s, y - 140 * s, C.maderaSombra, 4 * s);
    L(c, x + 110 * s, y - 104 * s, x + 110 * s, y - 140 * s, C.maderaSombra, 4 * s);
    L(c, x - 90 * s, y - 140 * s, x + 110 * s, y - 140 * s, C.madera, 4 * s);
    P(c, [x - 40 * s, y - 112 * s, x + 30 * s, y - 116 * s, x + 34 * s, y - 108 * s, x - 36 * s, y - 104 * s], C.madera);
    for (let k = 0; k < 9; k++) R(c, x - 70 * s + k * 6 * s, y - 130 * s, 1.5 * s, 8 * s, "#2A1E14");
    // el cofrecito bajo las tablas
    if (!o.abierto) {
      R(c, x + 40 * s, y - 20 * s, 34 * s, 20 * s, C.maderaSombra);
      R(c, x + 40 * s, y - 22 * s, 34 * s, 6 * s, C.madera);
      R(c, x + 54 * s, y - 16 * s, 6 * s, 6 * s, "#FFD98A");
    }
  }

  // La fisura del norte: una grieta en la roca por donde se pierde el filamento violeta.
  function fisura(c, x, y, t, o) {
    const s = o.s || 1;
    P(c, [x - 120 * s, y, x - 90 * s, y - 120 * s, x + 80 * s, y - 140 * s, x + 130 * s, y], ROCA[1]);
    P(c, [x - 6 * s, y, x - 20 * s, y - 70 * s, x + 4 * s, y - 120 * s, x + 18 * s, y - 60 * s, x + 10 * s, y], "#111111");
    P(c, [x + 30 * s, y, x + 80 * s, y - 140 * s, x + 130 * s, y], ROCA[2]);
  }

  // Los tres menhires-soporte, a escala épica (8 a 10 m): piedra tallada con runas antiguas tapadas por fajas
  // violetas; de cada uno sale un haz de hilos tensos hacia el Ciervo (o.hacia), que vibra cuando embiste. Rotos,
  // muestran la cara interior con los surcos antiguos que estaban ocultos. Reemplaza al soporte chico de assets.js.
  function menhirSoporte(c, x, y, t, o) {
    const s = o.s || 1,
      h = 520 * s,
      VIO = DIB.VIOLETA;
    sombra(c, x + 20 * s, y + 6 * s, 80 * s, 18 * s);
    if (o.roto) {
      P(c, [x - 50 * s, y + 4 * s, x - 46 * s, y - 180 * s, x - 10 * s, y - 230 * s, x + 30 * s, y - 196 * s, x + 50 * s, y + 4 * s], "#4E4A58");
      P(c, [x - 10 * s, y - 230 * s, x + 30 * s, y - 196 * s, x + 50 * s, y + 4 * s, x + 6 * s, y + 4 * s], "#6A6474");
      for (let k = 0; k < 4; k++) L(c, x - 30 * s + k * 18 * s, y - 40 * s, x - 26 * s + k * 18 * s, y - 170 * s, "#3A3644", 3 * s);
      alfa(c, 0.5, () => FUTHARK.dibujar(c, "algiz", x - 6 * s, y - 100 * s, 70 * s, DIB.RUNICO, 4 * s));
      P(c, [x + 60 * s, y + 10 * s, x + 80 * s, y - 40 * s, x + 260 * s, y - 20 * s, x + 250 * s, y + 14 * s], "#4E4A58");
      return;
    }
    P(c, [x - 52 * s, y + 4 * s, x - 56 * s, y - h * 0.7, x - 30 * s, y - h, x + 26 * s, y - h - 10 * s, x + 54 * s, y - h * 0.72, x + 50 * s, y + 4 * s], "#4E4A58");
    P(c, [x + 26 * s, y - h - 10 * s, x + 54 * s, y - h * 0.72, x + 50 * s, y + 4 * s, x + 12 * s, y + 4 * s], "#605A6C");
    // runas talladas, casi tapadas por las fajas violetas
    ["algiz", "eihwaz", "dagaz"].forEach((nom, i) => FUTHARK.dibujar(c, nom, x - 8 * s, y - 120 * s - i * 120 * s, 80 * s, "#34303E", 7 * s));
    const pulso = 0.6 + Math.sin(t * 3 + (o.sem || 0)) * 0.3;
    if (o.visto) halo(c, x, y - h * 0.55, 120 * s, VIO, pulso);
    [0.3, 0.5, 0.72].forEach((u) => {
      c.strokeStyle = VIO;
      c.lineWidth = 7 * s;
      c.beginPath();
      c.ellipse(x, y - h * u, 56 * s, 16 * s, 0, 0, TAU);
      c.stroke();
    });
    E(c, x - 30 * s, y - 20 * s, 30 * s, 10 * s, C.musgo2);
    // el haz de hilos hacia el Ciervo: varias líneas tensas que vibran
    if (o.hacia) {
      const [hx, hy] = o.hacia,
        vib = Math.sin(t * 22) * (o.vibra || 0) * 10 * s;
      alfa(c, o.visto ? 0.9 : 0.45, () => {
        for (let k = 0; k < 5; k++) {
          const sy = y - h * (0.45 + k * 0.06),
            ey = hy - 140 + k * 14,
            mx = (x + hx) / 2,
            my = (sy + ey) / 2 + 30 * s + vib * (k % 2 ? 1 : -1);
          c.beginPath();
          c.moveTo(x, sy);
          c.quadraticCurveTo(mx, my, hx, ey);
          c.strokeStyle = k % 2 ? VIO : "#6A4A98";
          c.lineWidth = 3 * s;
          c.stroke();
        }
      });
    }
  }
  ASSETS.LISTA.soporteAtadura = Object.assign({}, ASSETS.LISTA.soporteAtadura, { f: menhirSoporte, alto: 540, choque: { r: 50 } });

  Object.assign(ASSETS.LISTA, {
    arcoAstas: { f: arcoAstas, alto: 300, choque: { r: 20 }, grupo: "claro" },
    paredRoca: { f: paredRoca, alto: 360, choque: { w: 440, h: 60 }, grupo: "claro" },
    manchaEnferma: { f: manchaEnferma, alto: 0, choque: null, grupo: "claro" },
    camaMusgo: { f: camaMusgo, alto: 0, choque: null, grupo: "claro" },
    escaleraRaices: { f: escaleraRaices, alto: 180, choque: null, grupo: "claro" },
    apostadero: { f: apostadero, alto: 140, choque: { w: 200, h: 30 }, grupo: "claro" },
    fisura: { f: fisura, alto: 140, choque: { w: 240, h: 40 }, grupo: "claro" },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, {
    arcoAstas: { viejo: true, cinta: true },
  });
})();
