// ---------- los muebles de adentro (interiores) ----------
// Adentro de las casas la cámara se acerca y todo se ve con más detalle, como la cabaña del mago que escribe las notas
// del parche: tablas rojo oscuro, velas, runas azules talladas en la madera. Cada mueble es un objeto con nombre propio,
// dibujado en las medidas del cuarto (1600 × 900): los pies en (x, y), luz de arriba a la derecha.
(function () {
  "use strict";
  const { P, E, R, L, alfa, sombra, halo, poli, azar } = DIB;
  const F = FUTHARK;
  const MANA = "#4A78D0",
    MANA2 = "#A9C2F0",
    ORO = "#C9A45A",
    ORO2 = "#FFD98A";
  const MADERA = ["#5E130D", "#561109", "#661610"],
    MADERA_CLARA = "#7A1D14",
    MADERA_OSCURA = "#2A0806";
  // runa tallada que respira con luz azul
  function runaViva(c, nombre, x, y, h, t, fase) {
    const a = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.4 - (fase || 0)));
    halo(c, x, y - h / 2, h * 1.1, MANA, a * 0.5);
    alfa(c, a, () => F.dibujar(c, nombre, x, y, h, MANA2, h * 0.12));
  }
  // la llama de una vela o un candil
  function llama(c, x, y, s, t, sem) {
    const v = Math.sin(t * 9 + (sem || 0)) * 1.5 * s;
    halo(c, x, y - 8 * s, 46 * s, "#FFD98A", 0.55);
    P(c, [x + v, y - 22 * s, x - 6 * s, y - 4 * s, x, y + 2 * s, x + 6 * s, y - 4 * s], "#FF8D71");
    P(c, [x + v * 0.6, y - 14 * s, x - 3 * s, y - 3 * s, x + 3 * s, y - 3 * s], "#FFD98A");
  }
  function vela(c, x, y, s, t, sem) {
    P(c, [x - 26 * s, y, x + 26 * s, y, x + 20 * s, y - 8 * s, x - 20 * s, y - 8 * s], ORO);
    R(c, x - 10 * s, y - 66 * s, 20 * s, 58 * s, "#F2ECEC");
    R(c, x - 10 * s, y - 66 * s, 6 * s, 58 * s, "#E0B2B2");
    P(c, [x + 4 * s, y - 66 * s, x + 10 * s, y - 66 * s, x + 10 * s, y - 50 * s, x + 6 * s, y - 44 * s], "#E8DED6");
    llama(c, x, y - 68 * s, s, t, sem);
  }

  // ---------- El escritorio rúnico ----------
  // La mesa del mago: tablones en perspectiva, pergamino con renglones, tintero con la runa Fehu, libros, vela y una
  // fila de runas talladas en el frente que respiran luz azul. o.carta: el pergamino tiene un sello rojo.
  function escritorioRunico(c, x, y, t, o) {
    const s = o.s || 1,
      w = 300 * s,
      d = 110 * s,
      h = 120 * s;
    sombra(c, x + 20 * s, y + 6 * s, w + 40 * s, 22 * s, 0.5);
    // tapa en perspectiva (fondo más angosto)
    const bi = [x - w * 0.86, y - h - d],
      bd = [x + w * 0.86, y - h - d],
      fd = [x + w, y - h],
      fi = [x - w, y - h];
    for (let i = 0; i < 5; i++) {
      const u0 = i / 5,
        u1 = (i + 1) / 5,
        lp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
      const p = [lp(bi, bd, u0), lp(bi, bd, u1), lp(fi, fd, u1), lp(fi, fd, u0)].flat();
      P(c, p, MADERA[i % 3]);
      const q = [lp(bi, bd, u1), lp(fi, fd, u1)].flat();
      L(c, q[0], q[1], q[2], q[3], MADERA_OSCURA, 2 * s);
    }
    // frente con las runas
    P(c, [x - w, y - h, x + w, y - h, x + w, y - h + 14 * s, x - w, y - h + 14 * s], MADERA_CLARA);
    P(c, [x - w, y - h + 14 * s, x + w, y - h + 14 * s, x + w - 12 * s, y, x - w + 12 * s, y], "#3A0C08");
    const nom = ["ansuz", "kenaz", "isa", "laguz", "eihwaz", "algiz", "dagaz"];
    nom.forEach((n, i) => {
      const rx = x - w + 50 * s + i * ((w * 2 - 100 * s) / (nom.length - 1));
      P(c, [rx - 18 * s, y - h + 24 * s, rx + 18 * s, y - h + 24 * s, rx + 18 * s, y - 14 * s, rx - 18 * s, y - 14 * s], MADERA_OSCURA);
      runaViva(c, n, rx, y - 22 * s, 56 * s, t, i * 0.6);
    });
    L(c, x - w + 20 * s, y - h + 20 * s, x + w - 20 * s, y - h + 20 * s, MANA, 2 * s);
    // el pergamino con renglones
    const px0 = x - 90 * s,
      py0 = y - h - d * 0.85;
    P(c, [px0, py0, px0 + 190 * s, py0 - 4 * s, px0 + 214 * s, py0 + d * 0.72, px0 - 20 * s, py0 + d * 0.74], "#F2ECEC");
    P(c, [px0 - 24 * s, py0 + d * 0.72, px0 + 218 * s, py0 + d * 0.7, px0 + 218 * s, py0 + d * 0.8, px0 - 24 * s, py0 + d * 0.82], "#E0B2B2");
    const r = azar(17);
    for (let k = 0; k < 6; k++) {
      const yy = py0 + 12 * s + k * 11 * s;
      let xx = px0 + 6 * s + k * -3 * s;
      while (xx < px0 + 180 * s + k * 3 * s) {
        const l = (10 + r() * 22) * s;
        L(c, xx, yy, xx + l, yy, k === 2 ? "#9C2315" : "#2A2420", 2 * s);
        xx += l + 6 * s;
      }
    }
    if (o.carta) E(c, px0 + 170 * s, py0 + 60 * s, 9 * s, 7 * s, "#9C2315");
    // pluma
    P(c, [px0 + 120 * s, py0 + 40 * s, px0 + 210 * s, py0 - 70 * s, px0 + 196 * s, py0 - 74 * s], "#F2ECEC");
    P(c, [px0 + 120 * s, py0 + 40 * s, px0 + 196 * s, py0 - 74 * s, px0 + 186 * s, py0 - 60 * s], "#E0B2B2");
    // tintero con Fehu
    const tx = x + w * 0.62,
      ty = y - h - d * 0.35;
    P(c, [tx - 26 * s, ty, tx - 30 * s, ty - 34 * s, tx - 14 * s, ty - 46 * s, tx + 14 * s, ty - 46 * s, tx + 30 * s, ty - 34 * s, tx + 26 * s, ty], "#1A1416");
    R(c, tx - 14 * s, ty - 54 * s, 28 * s, 8 * s, ORO);
    alfa(c, 0.9, () => F.dibujar(c, "fehu", tx, ty - 8 * s, 26 * s, MANA2, 3 * s));
    // libros apilados
    const lx = x + w * 0.5,
      ly = y - h - d * 0.8;
    P(c, [lx - 60 * s, ly, lx + 60 * s, ly, lx + 60 * s, ly - 18 * s, lx - 60 * s, ly - 18 * s], "#9C2315");
    R(c, lx - 54 * s, ly - 14 * s, 108 * s, 6 * s, "#F2ECEC");
    P(c, [lx - 50 * s, ly - 18 * s, lx + 56 * s, ly - 18 * s, lx + 56 * s, ly - 34 * s, lx - 50 * s, ly - 34 * s], "#5E130D");
    R(c, lx + 20 * s, ly - 44 * s, 8 * s, 28 * s, ORO);
    alfa(c, 0.8, () => F.dibujar(c, "dagaz", lx, ly - 20 * s, 12 * s, MANA2, 1.6 * s));
    // vela de la mesa
    vela(c, x - w * 0.72, y - h - d * 0.45, 0.9 * s, t, 2);
  }

  // ---------- El hogar de piedra ----------
  // Contra la pared: piedras grises facetadas, la boca negra con el fuego vivo, la olla colgando y la repisa con jarros.
  function hogarPiedra(c, x, y, t, o) {
    const s = o.s || 1;
    // chimenea
    P(c, [x - 110 * s, y - 210 * s, x - 80 * s, y - 600 * s, x + 80 * s, y - 600 * s, x + 110 * s, y - 210 * s], "#4A4448");
    P(c, [x + 30 * s, y - 600 * s, x + 80 * s, y - 600 * s, x + 110 * s, y - 210 * s, x + 50 * s, y - 210 * s], "#5A5458");
    // cuerpo de piedras
    const r = azar(5);
    P(c, [x - 170 * s, y, x - 170 * s, y - 230 * s, x + 170 * s, y - 230 * s, x + 170 * s, y], "#56505A");
    for (let k = 0; k < 18; k++) {
      const px = x - 160 * s + (k % 6) * 60 * s + (Math.floor(k / 6) % 2) * 26 * s,
        py = y - 30 * s - Math.floor(k / 6) * 74 * s;
      P(c, poli(px + 20 * s, py, 30 * s, 32 * s, 6, r()), r() < 0.5 ? "#6A646C" : "#4E4852");
    }
    P(c, [x - 186 * s, y - 230 * s, x + 186 * s, y - 230 * s, x + 186 * s, y - 252 * s, x - 186 * s, y - 252 * s], MADERA_CLARA);
    // jarros en la repisa
    [[-130, "#C8402D"], [-90, "#E0B2B2"], [110, "#9C2315"]].forEach(([dx, col]) => {
      P(c, [x + (dx - 14) * s, y - 252 * s, x + (dx - 18) * s, y - 286 * s, x + (dx - 8) * s, y - 298 * s, x + (dx + 8) * s, y - 298 * s, x + (dx + 18) * s, y - 286 * s, x + (dx + 14) * s, y - 252 * s], col);
    });
    // boca y fuego
    P(c, [x - 100 * s, y, x - 100 * s, y - 120 * s, x - 60 * s, y - 160 * s, x + 60 * s, y - 160 * s, x + 100 * s, y - 120 * s, x + 100 * s, y], "#120806");
    halo(c, x, y - 50 * s, 180 * s, "#FF8D71", 0.6);
    for (let k = 0; k < 5; k++) {
      const v = Math.sin(t * 8 + k * 1.7) * 8 * s,
        fx = x - 56 * s + k * 28 * s,
        fh = (60 + Math.sin(t * 6 + k) * 18) * s;
      P(c, [fx + v, y - 20 * s - fh, fx - 22 * s, y - 16 * s, fx + 22 * s, y - 16 * s], k % 2 ? "#C8402D" : "#FF8D71");
      P(c, [fx + v * 0.5, y - 20 * s - fh * 0.55, fx - 10 * s, y - 16 * s, fx + 10 * s, y - 16 * s], "#FFD98A");
    }
    // leños
    P(c, [x - 80 * s, y - 6 * s, x + 70 * s, y - 26 * s, x + 76 * s, y - 14 * s, x - 74 * s, y + 4 * s], "#3A2418");
    P(c, [x - 70 * s, y - 26 * s, x + 80 * s, y - 6 * s, x + 74 * s, y + 4 * s, x - 76 * s, y - 14 * s], "#4A3020");
    // la olla
    L(c, x, y - 160 * s, x, y - 120 * s, "#2A2428", 3 * s);
    P(c, poli(x, y - 100 * s, 34 * s, 24 * s, 8, 0), "#2A2428");
    R(c, x - 34 * s, y - 120 * s, 68 * s, 6 * s, "#3A3438");
  }

  // ---------- La cama de pieles ----------
  function camaPieles(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 20 * s, y + 6 * s, 210 * s, 20 * s, 0.45);
    // cabecera tallada con dos cabezas de dragón
    P(c, [x - 200 * s, y - 60 * s, x - 196 * s, y - 210 * s, x - 170 * s, y - 230 * s, x - 150 * s, y - 210 * s, x - 150 * s, y - 60 * s], MADERA[0]);
    P(c, [x - 196 * s, y - 210 * s, x - 230 * s, y - 250 * s, x - 190 * s, y - 244 * s, x - 170 * s, y - 230 * s], MADERA_CLARA);
    runaViva(c, "berkano", x - 174 * s, y - 100 * s, 50 * s, t, 1);
    // marco
    P(c, [x - 200 * s, y, x - 200 * s, y - 70 * s, x + 200 * s, y - 70 * s, x + 200 * s, y], MADERA[1]);
    P(c, [x - 200 * s, y - 60 * s, x + 200 * s, y - 60 * s, x + 200 * s, y - 70 * s, x - 200 * s, y - 70 * s], MADERA_CLARA);
    // colchón y pieles
    P(c, [x - 150 * s, y - 70 * s, x - 140 * s, y - 120 * s, x + 190 * s, y - 116 * s, x + 196 * s, y - 70 * s], "#C8B8A0");
    P(c, [x - 30 * s, y - 64 * s, x - 20 * s, y - 132 * s, x + 60 * s, y - 140 * s, x + 200 * s, y - 120 * s, x + 214 * s, y - 50 * s, x + 120 * s, y - 40 * s], "#7A5634");
    P(c, [x + 60 * s, y - 140 * s, x + 200 * s, y - 120 * s, x + 214 * s, y - 50 * s, x + 150 * s, y - 80 * s], "#9A7448");
    for (let k = 0; k < 6; k++) L(c, x + k * 30 * s, y - 120 * s + k * 4 * s, x + k * 30 * s + 10 * s, y - 60 * s, "#553A22", 2 * s);
    // almohada
    P(c, poli(x - 105 * s, y - 120 * s, 40 * s, 18 * s, 7, 0.3), "#F2ECEC");
    P(c, poli(x - 98 * s, y - 126 * s, 26 * s, 10 * s, 7, 0.3), "#FFFFFF");
  }

  // ---------- El arcón de la casa ----------
  function arconCasa(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 10 * s, y + 4 * s, 90 * s, 14 * s, 0.45);
    P(c, [x - 80 * s, y, x - 80 * s, y - 70 * s, x + 70 * s, y - 70 * s, x + 70 * s, y], MADERA[0]);
    P(c, [x + 70 * s, y, x + 70 * s, y - 70 * s, x + 90 * s, y - 84 * s, x + 90 * s, y - 14 * s], MADERA_CLARA);
    if (o.abierto) {
      P(c, [x - 80 * s, y - 70 * s, x - 70 * s, y - 150 * s, x + 80 * s, y - 150 * s, x + 70 * s, y - 70 * s], MADERA[2]);
      P(c, [x - 72 * s, y - 72 * s, x + 68 * s, y - 72 * s, x + 86 * s, y - 84 * s, x - 56 * s, y - 84 * s], "#120806");
    } else {
      P(c, [x - 80 * s, y - 70 * s, x - 66 * s, y - 100 * s, x + 84 * s, y - 100 * s, x + 90 * s, y - 84 * s, x + 70 * s, y - 70 * s], MADERA[2]);
      P(c, [x - 10 * s, y - 76 * s, x + 10 * s, y - 76 * s, x + 10 * s, y - 50 * s, x - 10 * s, y - 50 * s], ORO);
      runaViva(c, "othala", x - 40 * s, y - 14 * s, 36 * s, t, 2);
    }
    [-50, 40].forEach((dx) => R(c, x + dx * s, y - 70 * s, 10 * s, 70 * s, "#4A4448"));
  }

  // ---------- El yunque y la forja de Ása ----------
  function forjaAsa(c, x, y, t, o) {
    const s = o.s || 1;
    // forja de piedra con las brasas
    P(c, [x - 160 * s, y, x - 150 * s, y - 150 * s, x + 150 * s, y - 150 * s, x + 160 * s, y], "#4E4852");
    P(c, [x + 60 * s, y - 150 * s, x + 150 * s, y - 150 * s, x + 160 * s, y, x + 70 * s, y], "#5E5862");
    P(c, [x - 120 * s, y - 150 * s, x - 100 * s, y - 190 * s, x + 100 * s, y - 190 * s, x + 120 * s, y - 150 * s], "#2A2428");
    const brillo = 0.75 + Math.sin(t * 3) * 0.2;
    halo(c, x, y - 180 * s, 200 * s, "#FF8D71", brillo * 0.7);
    for (let k = 0; k < 9; k++) E(c, x - 80 * s + k * 20 * s, y - 176 * s + (k % 2) * 4 * s, 12 * s, 6 * s, k % 3 ? "#C8402D" : "#FFD98A");
    // campana de humo
    P(c, [x - 130 * s, y - 330 * s, x + 130 * s, y - 330 * s, x + 90 * s, y - 230 * s, x - 90 * s, y - 230 * s], "#3A3438");
    P(c, [x - 40 * s, y - 600 * s, x + 40 * s, y - 600 * s, x + 40 * s, y - 330 * s, x - 40 * s, y - 330 * s], "#3A3438");
    // fuelle
    P(c, [x + 170 * s, y - 60 * s, x + 260 * s, y - 90 * s, x + 260 * s, y - 40 * s], "#7A5634");
    P(c, [x + 170 * s, y - 60 * s, x + 260 * s, y - 40 * s, x + 250 * s, y - 20 * s], "#553A22");
  }
  function yunque(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 10 * s, y + 4 * s, 70 * s, 14 * s, 0.45);
    // tronco
    P(c, [x - 50 * s, y, x - 46 * s, y - 80 * s, x + 46 * s, y - 80 * s, x + 50 * s, y], "#4A3020");
    E(c, x, y - 80 * s, 46 * s, 12 * s, "#7A5634");
    // yunque
    P(c, [x - 30 * s, y - 84 * s, x - 22 * s, y - 120 * s, x + 22 * s, y - 120 * s, x + 30 * s, y - 84 * s], "#3A3438");
    P(c, [x - 90 * s, y - 120 * s, x - 60 * s, y - 140 * s, x + 70 * s, y - 140 * s, x + 76 * s, y - 120 * s], "#4A4448");
    P(c, [x - 60 * s, y - 140 * s, x + 70 * s, y - 140 * s, x + 64 * s, y - 132 * s, x - 56 * s, y - 132 * s], "#6E6A6E");
    // la hoja al rojo sobre el yunque
    const g = 0.6 + Math.sin(t * 2.2) * 0.3;
    halo(c, x + 10 * s, y - 144 * s, 60 * s, "#FF8D71", g * 0.6);
    P(c, [x - 30 * s, y - 142 * s, x + 50 * s, y - 146 * s, x + 56 * s, y - 142 * s, x - 30 * s, y - 138 * s], "#FF8D71");
    // martillo
    L(c, x - 70 * s, y - 140 * s, x - 110 * s, y - 100 * s, "#553A22", 6 * s);
    R(c, x - 84 * s, y - 158 * s, 28 * s, 18 * s, "#4A4448");
  }

  // ---------- El estante de hierbas de Thora ----------
  function estanteHierbas(c, x, y, t, o) {
    const s = o.s || 1;
    // dos tablas con frascos y manojos colgando
    P(c, [x - 200 * s, y - 2 * s, x - 200 * s, y - 360 * s, x - 186 * s, y - 360 * s, x - 186 * s, y - 2 * s], MADERA[1]);
    P(c, [x + 186 * s, y - 2 * s, x + 186 * s, y - 360 * s, x + 200 * s, y - 360 * s, x + 200 * s, y - 2 * s], MADERA[1]);
    const r = azar(23);
    [120, 240, 350].forEach((hh, fila) => {
      P(c, [x - 200 * s, y - hh * s, x + 200 * s, y - hh * s, x + 200 * s, y - (hh - 12) * s, x - 200 * s, y - (hh - 12) * s], MADERA_CLARA);
      if (fila === 2) return;
      for (let k = 0; k < 7; k++) {
        const fx = x - 170 * s + k * 52 * s,
          fh = (40 + r() * 30) * s,
          col = ["#4E5C32", "#7BC86C", "#C8402D", "#E0B2B2", "#4A78D0", "#FFD98A"][Math.floor(r() * 6)];
        alfa(c, 0.5, () => P(c, [fx - 16 * s, y - hh * s, fx - 18 * s, y - hh * s - fh, fx + 18 * s, y - hh * s - fh, fx + 16 * s, y - hh * s], "#C8E0E0"));
        P(c, [fx - 14 * s, y - hh * s, fx - 15 * s, y - hh * s - fh * 0.6, fx + 15 * s, y - hh * s - fh * 0.6, fx + 14 * s, y - hh * s], col);
        R(c, fx - 8 * s, y - hh * s - fh - 8 * s, 16 * s, 8 * s, "#7A5634");
      }
    });
    // manojos colgando del estante de arriba
    for (let k = 0; k < 6; k++) {
      const fx = x - 150 * s + k * 60 * s,
        v = Math.sin(t * 0.8 + k) * 2 * s;
      L(c, fx, y - 338 * s, fx + v, y - 300 * s, "#7A5634", 2 * s);
      P(c, [fx + v, y - 300 * s, fx - 14 * s + v, y - 250 * s, fx + 14 * s + v, y - 250 * s], k % 2 ? "#4E5C32" : "#647A3C");
    }
  }

  // ---------- El mostrador del Hongo Dorado ----------
  function mostrador(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 20 * s, y + 6 * s, 300 * s, 20 * s, 0.45);
    P(c, [x - 300 * s, y, x - 300 * s, y - 130 * s, x + 300 * s, y - 130 * s, x + 300 * s, y], MADERA[0]);
    for (let k = 0; k < 6; k++) L(c, x - 300 * s + k * 100 * s, y - 120 * s, x - 300 * s + k * 100 * s, y, MADERA_OSCURA, 3 * s);
    P(c, [x - 320 * s, y - 130 * s, x - 300 * s, y - 160 * s, x + 320 * s, y - 160 * s, x + 320 * s, y - 130 * s], MADERA_CLARA);
    // el hongo dorado pintado en el frente
    P(c, [x - 40 * s, y - 70 * s, x, y - 110 * s, x + 40 * s, y - 70 * s], ORO2);
    R(c, x - 8 * s, y - 70 * s, 16 * s, 40 * s, "#F2ECEC");
    // jarras
    [[-220, 0], [-150, 1], [120, 0], [200, 2]].forEach(([dx, k]) => {
      const jx = x + dx * s,
        jy = y - 150 * s;
      P(c, [jx - 18 * s, jy, jx - 20 * s, jy - 44 * s, jx + 20 * s, jy - 44 * s, jx + 18 * s, jy], ["#9A7448", "#7A5634", "#C8B8A0"][k]);
      E(c, jx, jy - 46 * s, 20 * s, 8 * s, "#F2ECEC");
      L(c, jx + 20 * s, jy - 34 * s, jx + 30 * s, jy - 14 * s, "#553A22", 4 * s);
    });
    vela(c, x + 40 * s, y - 154 * s, 0.8 * s, t, 5);
  }
  function barriles(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 10 * s, y + 4 * s, 120 * s, 16 * s, 0.45);
    const barril = (bx, by) => {
      P(c, [bx - 50 * s, by, bx - 58 * s, by - 60 * s, bx - 50 * s, by - 120 * s, bx + 50 * s, by - 120 * s, bx + 58 * s, by - 60 * s, bx + 50 * s, by], "#7A5634");
      P(c, [bx + 20 * s, by, bx + 30 * s, by - 60 * s, bx + 20 * s, by - 120 * s, bx + 50 * s, by - 120 * s, bx + 58 * s, by - 60 * s, bx + 50 * s, by], "#9A7448");
      [-90, -30].forEach((dy) => R(c, bx - 56 * s, by + dy * s, 112 * s, 8 * s, "#3A3438"));
      E(c, bx, by - 120 * s, 50 * s, 12 * s, "#553A22");
    };
    barril(x - 60 * s, y);
    barril(x + 60 * s, y);
    barril(x, y - 124 * s);
    runaViva(c, "wunjo", x - 60 * s, y - 40 * s, 30 * s, t, 3);
  }

  // ---------- El telar ----------
  function telar(c, x, y, t, o) {
    const s = o.s || 1;
    L(c, x - 110 * s, y, x - 100 * s, y - 300 * s, MADERA[1], 12 * s);
    L(c, x + 110 * s, y, x + 100 * s, y - 300 * s, MADERA[1], 12 * s);
    R(c, x - 112 * s, y - 304 * s, 224 * s, 14 * s, MADERA_CLARA);
    // la tela a medio tejer, con una franja de runas
    P(c, [x - 90 * s, y - 290 * s, x + 90 * s, y - 290 * s, x + 90 * s, y - 120 * s, x - 90 * s, y - 120 * s], "#9C2315");
    P(c, [x - 90 * s, y - 220 * s, x + 90 * s, y - 220 * s, x + 90 * s, y - 196 * s, x - 90 * s, y - 196 * s], "#F2ECEC");
    for (let k = 0; k < 5; k++) F.dibujar(c, ["fehu", "uruz", "thurisaz", "ansuz", "raidho"][k], x - 70 * s + k * 35 * s, y - 199 * s, 18 * s, "#9C2315", 2.4 * s);
    for (let k = 0; k < 14; k++) L(c, x - 86 * s + k * 13 * s, y - 120 * s, x - 86 * s + k * 13 * s, y - 40 * s, "#E0B2B2", 1.2 * s);
    // pesas de piedra
    for (let k = 0; k < 6; k++) E(c, x - 80 * s + k * 32 * s, y - 34 * s, 10 * s, 12 * s, "#6A6660");
  }

  // ---------- Mesa con banco ----------
  // armada con caras (VOL): se ve bien desde cualquier lado
  function mesaBanco(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr);
    VOL.sombra(c, pr, 10, -20, 190, 70, 0.45);
    // el banco de atrás
    S.poner(0, -95, () => {
      [-125, 125].forEach((u) => VOL.cubo(c, pr, u, -95, 14, 26, 50, MADERA_OSCURA));
      VOL.cubo(c, pr, 0, -95, 300, 34, 12, [MADERA[1], MADERA[2], MADERA_CLARA], null, 50);
    });
    S.poner(0, 0, () => {
      [[-140, -30], [140, -30], [-140, 30], [140, 30]].forEach(([u, w]) => VOL.cubo(c, pr, u, w, 14, 14, 100, MADERA_OSCURA));
      VOL.cubo(c, pr, 0, 0, 340, 90, 12, [MADERA[1], MADERA_CLARA, "#8A2A1E", MADERA[0]], null, 100);
      // pan, cuenco, jarra y vela sobre la tapa, de atrás para adelante
      const T = VOL.escena(pr);
      T.poner(-60, 4, () => {
        VOL.elipse(c, pr, -60, 4, 112, 34, 16, "#9A7448");
        VOL.elipse(c, pr, -60, 4, 118, 30, 12, "#C89A5A");
      });
      T.poner(20, -10, () => {
        VOL.cilindro(c, pr, 20, -10, 28, 112, 122, "#3A2616", { n: 10 });
        VOL.elipse(c, pr, 20, -10, 122, 22, 22, "#1E140C");
      });
      T.poner(92, 10, () => VOL.cilindro(c, pr, 92, 10, 16, 112, 158, ["#B08A8A", "#E0B2B2", "#F2ECEC"], { n: 8 }));
      T.poner(-120, -14, () => {
        const p = pr(-120, -14, 112);
        vela(c, p[0], p[1], 0.7 * pr.s, t, 7);
      });
      T.dibujar();
    });
    S.dibujar();
  }

  Object.assign(ASSETS.LISTA, {
    escritorioRunico: { f: escritorioRunico, alto: 280, choque: null, grupo: "interiores" },
    hogarPiedra: { f: hogarPiedra, alto: 600, choque: null, grupo: "interiores" },
    camaPieles: { f: camaPieles, alto: 250, choque: null, grupo: "interiores" },
    arconCasa: { f: arconCasa, alto: 150, choque: null, grupo: "interiores" },
    forjaAsa: { f: forjaAsa, alto: 600, choque: null, grupo: "interiores" },
    yunque: { f: yunque, alto: 160, choque: null, grupo: "interiores" },
    estanteHierbas: { f: estanteHierbas, alto: 360, choque: null, grupo: "interiores" },
    mostrador: { f: mostrador, alto: 230, choque: null, grupo: "interiores" },
    barriles: { f: barriles, alto: 260, choque: null, grupo: "interiores" },
    telar: { f: telar, alto: 310, choque: null, grupo: "interiores" },
    mesaBanco: { f: mesaBanco, alto: 220, choque: null, grupo: "interiores", vol: true },
  });
  ASSETS.vela = vela;
  ASSETS.runaViva = runaViva;
})();
