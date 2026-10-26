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
    // o.ocupada: alguien duerme tapado hasta la nariz (la manta sube y baja)
    if (o.ocupada) {
      const r = Math.sin(t * 1.6) * 3 * s,
        pelo = o.pelo || "#7A5634";
      P(c, poli(x - 100 * s, y - 138 * s, 26 * s, 20 * s, 8, 0.2), pelo);
      P(c, poli(x - 86 * s, y - 132 * s, 16 * s, 12 * s, 7, 0.2), o.piel || "#E0B898");
      P(c, [x - 70 * s, y - 70 * s, x - 66 * s, y - 136 * s - r, x + 40 * s, y - 150 * s - r, x + 150 * s, y - 132 * s, x + 200 * s, y - 70 * s], "#7A5634");
      P(c, [x + 40 * s, y - 150 * s - r, x + 150 * s, y - 132 * s, x + 200 * s, y - 70 * s, x + 110 * s, y - 90 * s], "#9A7448");
    }
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

  // ======================================================================
  //  ARMADOS CON CARAS (todo girable, comun/volumen.js)
  // ======================================================================
  const MT = [MADERA_OSCURA, MADERA[0], MADERA_CLARA],
    PH = ["#3E3842", "#4E4852", "#6A646C"],
    HI = ["#2A2428", "#3A3438", "#6E6A6E"];
  // la runa tallada en una cara (las coordenadas de la cara: 0..l y -h..0)
  const runaCara = (cc, nombre, x, y, h, t, fase) => {
    const a = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.4 - (fase || 0)));
    alfa(cc, a, () => F.dibujar(cc, nombre, x, y, h, MANA2, h * 0.12));
  };
  const velaEn = (c, pr, u, w, z, k, t, sem) => {
    const p = pr(u, w, z);
    vela(c, p[0], p[1], k * pr.s, t, sem);
  };
  // el escritorio rúnico: la tapa de tablones, el frente con la fila de runas, el pergamino, la pluma, el tintero, los
  // libros y la vela
  function escritorioRunicoV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      nom = ["ansuz", "kenaz", "isa", "laguz", "eihwaz", "algiz", "dagaz"];
    VOL.sombra(c, pr, 20, 0, 320, 80, 0.5);
    VOL.caja(c, pr, -300, -60, 0, 300, 60, 106, MT, {
      frente: (cc, l, h) => {
        R(cc, 0, -h, l, 14, MADERA_CLARA);
        R(cc, 0, -h + 14, l, h - 14, "#3A0C08");
        L(cc, 20, -h + 20, l - 20, -h + 20, MANA, 2);
        nom.forEach((n, i) => {
          const rx = 50 + i * ((l - 100) / (nom.length - 1));
          R(cc, rx - 18, -h + 24, 36, h - 38, MADERA_OSCURA);
          runaCara(cc, n, rx, -22, 56, t, i * 0.6);
        });
      },
      sinTapa: true,
    });
    VOL.caja(c, pr, -300, -60, 106, 300, 60, 120, MT, {
      arriba: (cc, l, h) => {
        for (let i = 0; i < 5; i++) {
          R(cc, (i * l) / 5, -h, l / 5, h, MADERA[i % 3]);
          L(cc, ((i + 1) * l) / 5, -h, ((i + 1) * l) / 5, 0, MADERA_OSCURA, 2);
        }
      },
    });
    VOL.enPiso(c, pr, (cc) => {
      P(cc, [-90, -40, 100, -44, 124, 34, -110, 36], "#F2ECEC");
      const r = azar(17);
      for (let k = 0; k < 6; k++) {
        const yy = -30 + k * 11;
        let xx = -84 - k * 3;
        while (xx < 90 + k * 3) {
          const l = 10 + r() * 22;
          L(cc, xx, yy, xx + l, yy, k === 2 ? "#9C2315" : "#2A2420", 2);
          xx += l + 6;
        }
      }
      if (o.carta) E(cc, 80, 20, 9, 7, "#9C2315");
    }, 120.5);
    VOL.palo(c, pr, 30, 0, 121, 110, -40, 190, 4, "#F2ECEC");
    VOL.cilindro(c, pr, 186, 10, 26, 120, 160, ["#0E0A0C", "#1A1416", "#2A2426"], { n: 8 });
    VOL.cilindro(c, pr, 186, 10, 14, 160, 168, [ORO, ORO, ORO2], { n: 8 });
    VOL.plano(c, pr, 162, 210, 36.5, 124, 156, null, (cc, l, h) => alfa(cc, 0.9, () => F.dibujar(cc, "fehu", l / 2, -4, 26, MANA2, 3)), () => {});
    VOL.caja(c, pr, 90, -46, 120, 210, -6, 138, ["#5E130D", "#9C2315", "#C8402D"]);
    VOL.caja(c, pr, 100, -44, 138, 206, -8, 154, ["#3A0C08", "#5E130D", "#7A1D14"]);
    velaEn(c, pr, -216, 0, 120, 0.9, t, 2);
  }
  // el hogar de piedra: el cuerpo de piedras, la boca con el fuego y los leños, la olla, la repisa con jarros y la chimenea
  function hogarPiedraV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      piedras = (sem) => (cc, l, h) => {
        const r = azar(sem);
        for (let k = 0; k < 18; k++) {
          const px = 10 + (k % 6) * (l / 6) + (Math.floor(k / 6) % 2) * 26,
            py = -30 - Math.floor(k / 6) * 74;
          P(cc, poli(px + 20, py, 30, 32, 6, r()), r() < 0.5 ? "#6A646C" : "#4E4852");
        }
      };
    VOL.caja(c, pr, -170, -70, 0, 170, 70, 230, PH, {
      frente: (cc, l, h) => {
        piedras(5)(cc, l, h);
        P(cc, [l / 2 - 100, 0, l / 2 - 100, -120, l / 2 - 60, -160, l / 2 + 60, -160, l / 2 + 100, -120, l / 2 + 100, 0], "#120806");
      },
      atras: piedras(6),
      izq: piedras(7),
      der: piedras(8),
      sinTapa: true,
    });
    VOL.caja(c, pr, -186, -80, 230, 186, 80, 252, MT);
    VOL.prisma(c, pr, [[-110, -50], [110, -50], [80, 30], [-80, 30]].map(([u, w]) => [u, w - 10]), 252, 280, PH, { sinTapa: true });
    VOL.caja(c, pr, -80, -50, 280, 80, 30, 600, ["#3A343A", "#4A4448", "#5A5458"], { sinTapa: true });
    [[-130, "#C8402D"], [-90, "#E0B2B2"], [110, "#9C2315"]].forEach(([u, col]) =>
      VOL.cilindro(c, pr, u, 50, 16, 252, 298, [VOL.mezcla(col, "#000000", 0.35), col, VOL.mezcla(col, "#FFFFFF", 0.2)], { n: 8 }),
    );
    // el fuego y la olla, en la boca
    if (pr.mira(0, 1)[1] > 0) {
      VOL.halo(c, pr, 0, 70, 50, 180, "#FF8D71", 0.6);
      const q = pr(0, 64, 0),
        s = pr.s;
      VOL.rollo(c, pr, -76, 76, 64, 10, 8, ["#2A1810", "#3A2418", "#4A3020"], { n: 6 });
      for (let k = 0; k < 5; k++) {
        const v = Math.sin(t * 8 + k * 1.7) * 8 * s,
          fx = q[0] + (-56 + k * 28) * pr.co * s,
          fh = (60 + Math.sin(t * 6 + k) * 18) * s;
        P(c, [fx + v, q[1] - 20 * s - fh, fx - 22 * s, q[1] - 16 * s, fx + 22 * s, q[1] - 16 * s], k % 2 ? "#C8402D" : "#FF8D71");
        P(c, [fx + v * 0.5, q[1] - 20 * s - fh * 0.55, fx - 10 * s, q[1] - 16 * s, fx + 10 * s, q[1] - 16 * s], "#FFD98A");
      }
      VOL.palo(c, pr, 0, 60, 160, 0, 60, 120, 3, "#2A2428");
      VOL.cilindro(c, pr, 0, 60, 30, 80, 120, HI, { n: 8 });
    }
  }
  // la cama de pieles: el marco, la cabecera con las cabezas de dragón y Berkano, el colchón, las pieles y la almohada
  function camaPielesV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 20, 0, 214, 90, 0.45);
    VOL.caja(c, pr, -200, -80, 0, 200, 80, 70, MT, { tapa: MADERA_CLARA });
    VOL.caja(c, pr, -200, -80, 70, -170, 80, 210, MT, { der: (cc, l, h) => runaCara(cc, "berkano", l / 2, -30, 50, t, 1), izq: (cc, l, h) => runaCara(cc, "berkano", l / 2, -30, 50, t, 1) });
    [-70, 70].forEach((w) => VOL.palo(c, pr, -185, w, 210, -215, w * 1.2, 250, 14, MADERA_CLARA));
    VOL.caja(c, pr, -170, -74, 70, 196, 74, 100, ["#A89880", "#C8B8A0", "#DCCCB4"]);
    VOL.prisma(c, pr, [[-30, -82], [80, -86], [214, -70], [214, 84], [60, 88], [-40, 80]], 96, 116, ["#5A3E22", "#7A5634", "#9A7448"]);
    VOL.prisma(c, pr, VOL.redonda(-115, 0, 40, 8, 0.3, 50), 100, 120, ["#C8C0B8", "#F2ECEC", "#FFFFFF"]);
    if (o.ocupada) {
      const r = Math.sin(t * 1.6) * 3,
        pelo = o.pelo || "#7A5634";
      VOL.cilindro(c, pr, -112, 0, 24, 120, 150, [pelo, pelo, pelo], { n: 8, tapa: pelo });
      VOL.prisma(c, pr, [[-80, -70], [60, -80], [200, -66], [200, 70], [60, 80], [-80, 72]], 100, 146 + r, ["#5A3E22", "#7A5634", "#9A7448"]);
    }
  }
  // el gato de la casa: hecho un ovillo junto al hogar, la cola alrededor y las orejas paradas; respira y a veces
  // mueve una oreja. o.pal: 0 gris, 1 naranja, 2 negro. Redondo y parejo: igual de cualquier lado.
  // ---------- El mapa clavado del escondite ----------
  // Un cuero raspado clavado a la pared con cuatro clavos: la empalizada vieja, el túnel en punteado y una X roja donde
  // termina. Plano contra la pared (ASSETS.cartaV en LISTA).
  function mapaClavado(c, x, y, t, o) {
    const s = (o && o.s) || 1;
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    DIB.P(c, [-70, -190, 66, -196, 74, -96, -64, -88], "#B89A6E");
    DIB.P(c, [-70, -190, 66, -196, 68, -176, -68, -170], "#C8AE84");
    // la empalizada en arco y las casas
    c.beginPath();
    c.arc(-6, -110, 52, Math.PI * 1.05, Math.PI * 1.95);
    c.strokeStyle = "#5E3A22";
    c.lineWidth = 3;
    c.stroke();
    for (const [u, v] of [[-30, -126], [-8, -136], [14, -124]]) DIB.R(c, u - 5, v - 5, 10, 8, "#7A4A2E");
    // el túnel, en punteado, y la X
    c.setLineDash([5, 5]);
    c.beginPath();
    c.moveTo(-40, -104);
    c.quadraticCurveTo(10, -98, 44, -150);
    c.stroke();
    c.setLineDash([]);
    DIB.L(c, 38, -158, 52, -144, "#9C2315", 4);
    DIB.L(c, 52, -158, 38, -144, "#9C2315", 4);
    for (const [u, v] of [[-62, -184], [58, -188], [64, -102], [-56, -96]]) DIB.E(c, u, v, 4, 4, "#3A2A1E");
    c.restore();
  }
  // ---------- La losa de las runas ----------
  // Una laja parada, más vieja que la casa, con una fila de runas que laten con la luz rúnica en la cara de adelante.
  function losaRunica(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      lat = 0.55 + 0.25 * Math.sin(t * 1.4);
    VOL.sombra(c, pr, 0, 0, 80, 34, 0.4);
    S.poner(0, 0, () =>
      VOL.caja(c, pr, -60, -18, 0, 60, 18, 220, ["#3E3E3C", "#55554F", "#6A6862"], {
        tapa: "#6E6C66",
        frente: (cc, l, h) => {
          DIB.P(cc, [6, -h + 10, l - 8, -h + 6, l - 4, -6, 4, -4], "#4E4C46");
          DIB.alfa(cc, lat, () => ["ansuz", "othala", "hagalaz", "dagaz"].forEach((rn, k) => FUTHARK.dibujar(cc, rn, l / 2, -h + 40 + k * 46, 30, "#73D5DB", 4)));
          if (o && o.leida) DIB.alfa(cc, 0.25, () => DIB.P(cc, [l / 2 - 20, -h + 14, l / 2 + 20, -h + 14, l / 2 + 20, -10, l / 2 - 20, -10], "#73D5DB"));
        },
      }),
    );
    S.dibujar();
  }
  // ---------- El caldero de la cocina ----------
  // La olla de hierro colgada del trípode sobre las brasas, con el vapor que sube (redonda: igual de cualquier lado).
  function caldero(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x, y + 2 * s, 90 * s, 16 * s, 0.45);
    // las brasas
    for (let k = 0; k < 7; k++) E(c, x - 48 * s + k * 16 * s, y - 6 * s - (k % 2) * 4 * s, 12 * s, 7 * s, k % 3 ? "#5E130D" : "#C8402D");
    halo(c, x, y - 14 * s, 60 * s, "#FF8D71", 0.35 + Math.sin(t * 6) * 0.05);
    // el trípode
    L(c, x - 80 * s, y, x, y - 230 * s, "#2A2420", 6 * s);
    L(c, x + 80 * s, y, x, y - 230 * s, "#3A3430", 6 * s);
    L(c, x + 10 * s, y + 6 * s, x, y - 230 * s, "#2A2420", 5 * s);
    L(c, x, y - 226 * s, x, y - 150 * s, "#4A4448", 3 * s);
    // la olla: mitad en sombra, la boca y el asa
    P(c, poli(x, y - 92 * s, 56 * s, 50 * s, 14, 0), "#2E2A2C");
    P(c, [x, y - 142 * s, x + 56 * s, y - 92 * s, x + 40 * s, y - 56 * s, x, y - 44 * s], "#444046");
    E(c, x, y - 140 * s, 48 * s, 11 * s, "#1A1618");
    E(c, x, y - 138 * s, 40 * s, 8 * s, "#7A6A3A");
    c.beginPath();
    c.ellipse(x, y - 140 * s, 52 * s, 16 * s, 0, Math.PI, Math.PI * 2);
    c.strokeStyle = "#4A4448";
    c.lineWidth = 3 * s;
    c.stroke();
    // el vapor
    if (!window.CALIDAD || CALIDAD.nivel !== "baja")
      for (let k = 0; k < 4; k++) {
        const f = (t * 0.3 + k * 0.25) % 1;
        alfa(c, 0.3 * (1 - f), () => E(c, x + Math.sin(t + k * 2) * 14 * s, y - 150 * s - f * 120 * s, (14 + f * 24) * s, (10 + f * 14) * s, "#E8E0D8"));
      }
  }
  // ---------- La mesa de trabajo del taller ----------
  // Un tablón grueso sobre caballetes con el martillo, la gubia, un cepillo y virutas; una tabla a medio tallar.
  function mesaTrabajo(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr);
    VOL.sombra(c, pr, 0, 0, 170, 60, 0.45);
    S.poner(0, 0, () => {
      for (const u of [-130, 130]) {
        VOL.palo(c, pr, u - 20, -30, 0, u, 0, 120, 8, MADERA[1]);
        VOL.palo(c, pr, u + 20, -30, 0, u, 0, 120, 8, MADERA[0]);
        VOL.palo(c, pr, u - 20, 30, 0, u, 0, 120, 8, MADERA[1]);
        VOL.palo(c, pr, u + 20, 30, 0, u, 0, 120, 8, MADERA[0]);
      }
      VOL.caja(c, pr, -170, -45, 120, 170, 45, 140, MT, { tapa: "#8A3A22" });
      // la tabla a medio tallar, con la runa empezada
      VOL.caja(c, pr, -120, -20, 140, 10, 20, 148, ["#8A6A3E", "#A88450", "#C8A46A"], { tapa: "#C8A46A" });
      // el martillo y la gubia
      VOL.palo(c, pr, 40, -10, 144, 110, 10, 144, 4, "#7A3E20");
      VOL.caja(c, pr, 104, -2, 140, 124, 22, 156, ["#3A3A40", "#4A4A50", "#6A6A70"]);
      VOL.palo(c, pr, 60, 26, 144, 120, 30, 144, 3, "#B8A890");
      for (let k = 0; k < 5; k++) VOL.elipse(c, pr, -150 + k * 18, 10 - k * 6, 140.5, 7, 4, "#D8C08A");
    });
    S.dibujar();
  }
  // ---------- La piel colgada ----------
  // Una piel de lobo estirada en su bastidor de ramas, colgada de la pared (plana: ASSETS.cartaV en LISTA).
  function pielColgada(c, x, y, t, o) {
    const s = (o && o.s) || 1,
      col = [["#6A5A4A", "#8A7A6A", "#A89884"], ["#3A3230", "#4E4644", "#6A625E"], ["#8A6A3E", "#A8844E", "#C8A46A"]][((o && o.pal) || 0) % 3];
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    L(c, -80, -240, 80, -240, "#4A3020", 6);
    L(c, -76, -244, -70, -40, "#4A3020", 6);
    L(c, 76, -244, 70, -40, "#4A3020", 6);
    L(c, -74, -60, 74, -60, "#4A3020", 5);
    P(c, [-60, -226, -20, -212, 20, -212, 60, -226, 54, -180, 62, -120, 40, -76, 0, -64, -40, -76, -62, -120, -54, -180], col[1]);
    P(c, [-60, -226, -20, -212, 0, -212, 0, -64, -40, -76, -62, -120, -54, -180], col[0]);
    P(c, [-14, -170, 14, -170, 8, -100, -8, -100], col[2]);
    for (const [a, b] of [[-60, -226], [60, -226], [-62, -120], [62, -120], [-40, -76], [40, -76]]) L(c, a, b, a < 0 ? -72 : 72, b, "#B8A890", 1.5);
    c.restore();
  }
  function gatoCasa(c, x, y, t, o) {
    const s = o.s || 1,
      PAL = [["#6E6A70", "#8E8A90", "#B0ACB2"], ["#B8642A", "#D8843A", "#F0A85A"], ["#1E1A1E", "#2E2A30", "#4A4650"]][(o.pal || 0) % 3],
      r = Math.sin(t * 1.4) * 1.5 * s,
      oreja = Math.sin(t * 0.7) > 0.97 ? 4 * s : 0;
    sombra(c, x, y + 2 * s, 46 * s, 10 * s, 0.4);
    // el cuerpo y la cola
    P(c, poli(x, y - 20 * s - r, 40 * s, 22 * s + r, 10, 0), PAL[1]);
    P(c, poli(x - 10 * s, y - 14 * s, 26 * s, 12 * s, 9, 0), PAL[0]);
    P(c, [x + 30 * s, y - 6 * s, x + 44 * s, y - 14 * s, x + 30 * s, y - 2 * s, x - 20 * s, y + 2 * s, x - 30 * s, y - 4 * s], PAL[2]);
    // la cabeza apoyada, los ojos cerrados y las orejas
    P(c, poli(x - 30 * s, y - 26 * s, 17 * s, 14 * s, 8, 0), PAL[1]);
    P(c, [x - 44 * s, y - 34 * s, x - 42 * s, y - 50 * s - oreja, x - 34 * s, y - 38 * s], PAL[1]);
    P(c, [x - 26 * s, y - 38 * s, x - 18 * s, y - 52 * s, x - 16 * s, y - 34 * s], PAL[2]);
    L(c, x - 38 * s, y - 26 * s, x - 33 * s, y - 25 * s, "#111111", 1.5 * s);
    L(c, x - 27 * s, y - 26 * s, x - 22 * s, y - 25 * s, "#111111", 1.5 * s);
  }
  // el arcón de la casa: madera roja con herrajes, la tapa con el cierre dorado y Othala (abierto: la tapa parada)
  function arconCasaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      herr = (cc, l, h) => [30, l - 40].forEach((u) => R(cc, u, -h, 10, h, "#4A4448"));
    VOL.sombra(c, pr, 10, 0, 96, 44, 0.45);
    VOL.caja(c, pr, -85, -35, 0, 85, 35, 70, MT, {
      frente: (cc, l, h) => {
        herr(cc, l, h);
        if (!o.abierto) {
          R(cc, l / 2 - 10, -h, 20, 26, ORO);
          runaCara(cc, "othala", l / 2 - 40, -14, 36, t, 2);
        }
      },
      atras: herr,
      tapa: o.abierto ? "#120806" : null,
    });
    if (o.abierto) return VOL.caja(c, VOL.sub(pr, 0, -35, 70), -85, -10, 0, 85, 0, 76, MT);
    VOL.boveda(c, pr, -85, 85, -35, 35, 70, 30, [MADERA_OSCURA, MADERA[2], MADERA_CLARA]);
  }
  // la forja de Ása: el banco de piedra con las brasas, la campana de humo con su caño y el fuelle
  function forjaAsaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      brillo = 0.75 + Math.sin(t * 3) * 0.2;
    VOL.caja(c, pr, -160, -80, 0, 160, 80, 150, PH, { sinTapa: true });
    VOL.caja(c, pr, -160, -80, 150, 160, 80, 152, PH, { tapa: "#2A2428" });
    VOL.prisma(c, pr, [[-120, -50], [120, -50], [120, 50], [-120, 50]], 152, 176, HI, { tapa: "#2A2428" });
    VOL.halo(c, pr, 0, 0, 180, 200, "#FF8D71", brillo * 0.7);
    VOL.enPiso(c, pr, (cc) => {
      for (let k = 0; k < 9; k++) E(cc, -80 + k * 20, (k % 2) * 10 - 5, 12, 8, k % 3 ? "#C8402D" : "#FFD98A");
    }, 176.5);
    VOL.prisma(c, pr, [[-90, -60], [90, -60], [90, 60], [-90, 60]], 230, 231, HI, { sinTapa: true });
    const campana = [[-130, -90], [130, -90], [130, 90], [-130, 90]];
    VOL.piramide(c, pr, campana, 230, 0, 0, 380, ["#2A2428", "#3A3438", "#4A4448"]);
    VOL.caja(c, pr, -40, -40, 330, 40, 40, 600, ["#2A2428", "#3A3438", "#4A4448"], { sinTapa: true });
    VOL.piramide(c, pr, [[170, -30], [170, 30], [260, 0]], 30, 215, 0, 90, ["#553A22", "#7A5634", "#9A7448"]);
  }
  // el yunque: el tronco, el yunque con su cuerno, la hoja al rojo y el martillo
  function yunqueV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      g = 0.6 + Math.sin(t * 2.2) * 0.3;
    VOL.sombra(c, pr, 10, 0, 70, 50, 0.45);
    VOL.cilindro(c, pr, 0, 0, 48, 0, 80, ["#3A2418", "#4A3020", "#5E4030"], { n: 10, tapa: "#7A5634" });
    VOL.caja(c, pr, -26, -16, 80, 26, 16, 118, HI);
    VOL.caja(c, pr, -60, -22, 118, 70, 22, 140, HI, { tapa: "#6E6A6E" });
    VOL.piramide(c, pr, [[-60, -20], [-60, 20], [-60, 0]], 118, -100, 0, 138, HI);
    VOL.halo(c, pr, 10, 0, 144, 60, "#FF8D71", g * 0.6);
    VOL.caja(c, pr, -30, -6, 140, 56, 6, 144, ["#C8402D", "#FF8D71", "#FFB89A"]);
    VOL.palo(c, pr, -70, 30, 140, -110, 30, 100, 6, "#553A22");
    VOL.cubo(c, pr, -70, 30, 28, 14, 18, HI, null, 140);
  }
  // el estante de hierbas: los dos parantes, las tres tablas, los frascos y los manojos que cuelgan
  function estanteHierbasV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      r = azar(23),
      S = VOL.escena(pr);
    [-193, 193].forEach((u) => S.poner(u, 0, () => VOL.cubo(c, pr, u, 0, 14, 50, 360, MT)));
    [120, 240, 350].forEach((hh, fila) => {
      S.poner(0, 0, () => {
        VOL.caja(c, pr, -200, -25, hh - 12, 200, 25, hh, MT);
        if (fila === 2)
          for (let k = 0; k < 6; k++) {
            const u = -150 + k * 60,
              v = Math.sin(t * 0.8 + k) * 2;
            VOL.palo(c, pr, u, 0, hh - 12, u + v, 0, hh - 50, 2, "#7A5634");
            VOL.piramide(c, pr, VOL.redonda(u + v, 0, 14, 5), hh - 100, u + v, 0, hh - 50, k % 2 ? ["#3A4826", "#4E5C32", "#647A3C"] : ["#4E5C32", "#647A3C", "#7A9050"]);
          }
        else
          for (let k = 0; k < 7; k++) {
            const u = -170 + k * 52,
              fh = 40 + r() * 30,
              col = ["#4E5C32", "#7BC86C", "#C8402D", "#E0B2B2", "#4A78D0", "#FFD98A"][Math.floor(r() * 6)];
            VOL.cilindro(c, pr, u, 0, 15, hh, hh + fh * 0.6, [VOL.mezcla(col, "#000000", 0.3), col, VOL.mezcla(col, "#FFFFFF", 0.2)], { n: 6 });
            VOL.cilindro(c, pr, u, 0, 16, hh + fh * 0.6, hh + fh, ["#A8C0C0", "#C8E0E0", "#E0F0F0"], { n: 6, sinTapa: true });
            VOL.cilindro(c, pr, u, 0, 8, hh + fh, hh + fh + 8, ["#553A22", "#7A5634", "#9A7448"], { n: 6 });
          }
      }, hh);
    });
    S.dibujar();
  }
  // el mostrador del Hongo Dorado: el frente de tablas con el hongo pintado, la tapa, las jarras y la vela
  function mostradorV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 20, 0, 320, 70, 0.45);
    const tablas = (hongo) => (cc, l, h) => {
      for (let k = 1; k < 6; k++) L(cc, (k * l) / 6, -h + 10, (k * l) / 6, 0, MADERA_OSCURA, 3);
      if (hongo) {
        P(cc, [l / 2 - 40, -70, l / 2, -110, l / 2 + 40, -70], ORO2);
        R(cc, l / 2 - 8, -70, 16, 40, "#F2ECEC");
      }
    };
    VOL.caja(c, pr, -300, -40, 0, 300, 40, 130, MT, { frente: tablas(true), atras: tablas(false), sinTapa: true });
    VOL.caja(c, pr, -320, -50, 130, 320, 50, 150, MT);
    [[-220, 0], [-150, 1], [120, 0], [200, 2]].forEach(([u, k]) => {
      const col = ["#9A7448", "#7A5634", "#C8B8A0"][k];
      VOL.cilindro(c, pr, u, 0, 19, 150, 194, [VOL.mezcla(col, "#000000", 0.3), col, VOL.mezcla(col, "#FFFFFF", 0.2)], { n: 8, tapa: "#F2ECEC" });
      VOL.palo(c, pr, u + 20, 0, 184, u + 30, 0, 164, 4, "#553A22");
    });
    velaEn(c, pr, 40, 0, 150, 0.8, t, 5);
  }
  // los barriles: dos abajo y uno arriba, con sus zunchos, y Wunjo tallada en el de la izquierda
  function barrilesV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      BA = ["#5A3E22", "#7A5634", "#9A7448"],
      S = VOL.escena(pr);
    VOL.sombra(c, pr, 10, 0, 124, 60, 0.45);
    const barril = (u, w, z, runa) => {
      VOL.cono(c, pr, u, w, 50, 58, z, z + 60, BA, { n: 12, sinTapa: true });
      VOL.cono(c, pr, u, w, 58, 50, z + 60, z + 120, BA, { n: 12, tapa: "#553A22" });
      [30, 90].forEach((zz) => VOL.cono(c, pr, u, w, 55.5, 57, z + zz - 4, z + zz + 4, HI, { n: 12, sinTapa: true }));
      if (runa) VOL.plano(c, pr, u - 20, u + 20, w + 57, z + 20, z + 60, null, (cc, l, h) => runaCara(cc, "wunjo", l / 2, -6, 30, t, 3), () => {});
    };
    S.poner(-60, 0, () => barril(-60, 0, 0, true));
    S.poner(60, 0, () => barril(60, 0, 0));
    S.poner(0, 0, () => barril(0, 0, 124), 124);
    S.dibujar();
  }
  // el telar: los dos parantes, el travesaño, la tela a medio tejer con la franja de runas, los hilos y las pesas
  function telarV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      tela = (cc, l, h) => {
        R(cc, 0, -h, l, h, "#9C2315");
        R(cc, 0, -h + 70, l, 24, "#F2ECEC");
        for (let k = 0; k < 5; k++) F.dibujar(cc, ["fehu", "uruz", "thurisaz", "ansuz", "raidho"][k], 20 + k * 35, -h + 91, 18, "#9C2315", 2.4);
      };
    VOL.palo(c, pr, -110, 0, 0, -100, -10, 300, 12, MADERA[1]);
    VOL.palo(c, pr, 110, 0, 0, 100, -10, 300, 12, MADERA[1]);
    VOL.caja(c, pr, -112, -17, 290, 112, -3, 304, MT);
    VOL.plano(c, pr, -90, 90, -8, 120, 290, null, tela, tela);
    for (let k = 0; k < 14; k++) VOL.palo(c, pr, -86 + k * 13, -6, 120, -86 + k * 13, -4, 40, 1.2, "#E0B2B2");
    for (let k = 0; k < 6; k++) VOL.cilindro(c, pr, -80 + k * 32, -4, 9, 22, 46, ["#4E4A44", "#6A6660", "#86827A"], { n: 6 });
  }

  Object.assign(ASSETS.LISTA, {
    escritorioRunico: { f: escritorioRunico, fv: escritorioRunicoV, vol: true, alto: 280, choque: null, grupo: "interiores" },
    hogarPiedra: { f: hogarPiedra, fv: hogarPiedraV, vol: true, alto: 600, choque: null, grupo: "interiores" },
    camaPieles: { f: camaPieles, fv: camaPielesV, vol: true, alto: 250, choque: null, grupo: "interiores" },
    gatoCasa: { f: gatoCasa, figura: true, alto: 60, choque: null, grupo: "interiores" },
    mapaClavado: { f: mapaClavado, fv: ASSETS.cartaV(mapaClavado, 150, 200), vol: true, alto: 200, choque: null, grupo: "interiores" },
    losaRunica: { f: losaRunica, vol: true, alto: 230, choque: null, grupo: "interiores" },
    caldero: { f: caldero, figura: true, alto: 240, choque: null, grupo: "interiores" },
    mesaTrabajo: { f: mesaTrabajo, vol: true, alto: 160, choque: null, grupo: "interiores" },
    pielColgada: { f: pielColgada, fv: ASSETS.cartaV(pielColgada, 170, 250), vol: true, alto: 250, choque: null, grupo: "interiores" },
    arconCasa: { f: arconCasa, fv: arconCasaV, vol: true, alto: 150, choque: null, grupo: "interiores" },
    forjaAsa: { f: forjaAsa, fv: forjaAsaV, vol: true, alto: 600, choque: null, grupo: "interiores" },
    yunque: { f: yunque, fv: yunqueV, vol: true, alto: 160, choque: null, grupo: "interiores" },
    estanteHierbas: { f: estanteHierbas, fv: estanteHierbasV, vol: true, alto: 360, choque: null, grupo: "interiores" },
    mostrador: { f: mostrador, fv: mostradorV, vol: true, alto: 230, choque: null, grupo: "interiores" },
    barriles: { f: barriles, fv: barrilesV, vol: true, alto: 260, choque: null, grupo: "interiores" },
    telar: { f: telar, fv: telarV, vol: true, alto: 310, choque: null, grupo: "interiores" },
    mesaBanco: { f: mesaBanco, alto: 220, choque: null, grupo: "interiores", vol: true },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, { gatoCasa: { pal: 1 }, losaRunica: { leida: false } });
  ASSETS.vela = vela;
  ASSETS.runaViva = runaViva;
})();
