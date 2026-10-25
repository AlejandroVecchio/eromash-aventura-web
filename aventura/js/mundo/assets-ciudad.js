// ---------- la capital en 2.5D (se suma a ASSETS) ----------
// Lo que la capital necesita además de las casas de CASAS25: la chimenea de piedra de la herrería de Ása, alta y cónica,
// con el humo oscuro que se ve desde toda la ciudad; el campo de entrenamiento de la Guardia (muñecos, dianas, estante
// de armas), el secadero de hierbas de Sanación y los fardos del corral. Mismas reglas que assets.js: caras planas, luz de arriba a la
// derecha (la mitad izquierda en sombra), sombra elíptica en el piso.
(function () {
  "use strict";
  const { P, E, R, alfa, azar, sombra, halo } = DIB;
  const C = ASSETS.C;
  const nivel = () => (window.CALIDAD ? CALIDAD.nivel : "alta");

  // La chimenea de la herrería: un cono de piedra con hileras de bloques, la boca de la fragua encendida al pie y una
  // columna de humo oscuro que sube torcida.
  function chimeneaHerreria(c, x, y, t, o) {
    const s = o.s || 1,
      h = 330 * s,
      b = 62 * s,
      a = 26 * s,
      r = azar(4711);
    sombra(c, x + 16 * s, y + 4 * s, b * 1.4, 18 * s, 0.4);
    P(c, [x - b, y, x - a, y - h, x + a, y - h, x + b, y], "#55534E");
    P(c, [x + 4 * s, y, x + 4 * s, y - h, x + a, y - h, x + b, y], "#6E6A62");
    for (let k = 1; k < 14; k++) {
      const u = k / 14,
        w = b + (a - b) * u,
        yy = y - h * u;
      R(c, x - w, yy, w * 2, 2.5 * s, "#3E3C38");
      for (let j = 0; j < 4; j++) if (r() < 0.5) R(c, x - w + r() * w * 2, yy - 10 * s, 2.5 * s, 10 * s, "#3E3C38");
    }
    R(c, x - a - 6 * s, y - h - 8 * s, (a + 6 * s) * 2, 10 * s, "#46423C");
    // la boca de la fragua
    P(c, [x - 26 * s, y, x - 26 * s, y - 40 * s, x, y - 56 * s, x + 26 * s, y - 40 * s, x + 26 * s, y], "#1A140E");
    const brasa = 0.75 + Math.sin(t * 5) * 0.15;
    alfa(c, brasa, () => P(c, [x - 18 * s, y, x - 18 * s, y - 30 * s, x, y - 42 * s, x + 18 * s, y - 30 * s, x + 18 * s, y], C.ambarFuerte));
    alfa(c, brasa * 0.8, () => E(c, x, y - 12 * s, 12 * s, 9 * s, C.ambar));
    halo(c, x, y - 20 * s, 120 * s, C.ambarFuerte, brasa);
    // el humo
    if (nivel() !== "baja")
      for (let k = 0; k < 9; k++) {
        const p = (t * 0.12 + k / 9) % 1;
        alfa(c, 0.5 * (1 - p), () => E(c, x + Math.sin(p * 4 + k) * 30 * s + p * 90 * s, y - h - 20 * s - p * 420 * s, (18 + p * 60) * s, (14 + p * 40) * s, k % 2 ? "#2A2A2C" : "#3A3A3C"));
      }
  }

  // El muñeco de práctica del campo de entrenamiento de la Guardia: el mismo de los campamentos de la arena (poste,
  // brazos con mechones de paja, el cuerpo de seis caras atado con una soga y la cabeza ochavada), con la faja verde
  // del Ciervo y el rombo rojo donde apuntar. Se bambolea un poco, como si alguien le acabara de pegar.
  function munecoPractica(c, x, y, t, o) {
    const s = (o.s || 1) * 0.62,
      T = { paja: "#D9B67A", sombra: "#B8904E", luz: "#E8CF8F", madera: "#8A6440", maderaS: "#6B4A2C" };
    const pol = (pts, col) => P(c, pts.flatMap(([a, b]) => [a * s, b * s]), col);
    sombra(c, x + 8 * s, y + 2 * s, 40 * s, 10 * s, 0.35);
    c.save();
    c.translate(x, y);
    // la base de tronco
    pol([[-30, 2], [-30, -14], [30, -14], [30, 2]], C.maderaSombra);
    pol([[-30, -14], [30, -14], [26, -22], [-26, -22]], "#8A6A48");
    c.translate(0, -18 * s);
    c.rotate(Math.sin(t * 2.4 + (o.sem || 0) * 1.7) * 0.06);
    c.translate(0, 18 * s);
    pol([[-6, -12], [0, -12], [0, -150], [-6, -150]], T.madera);
    pol([[0, -12], [6, -12], [6, -150], [0, -150]], T.maderaS);
    // los brazos con sus mechones
    pol([[-62, -108], [62, -108], [58, -98], [-58, -98]], T.madera);
    pol([[-58, -98], [58, -98], [62, -94], [-62, -94]], T.maderaS);
    [-1, 1].forEach((l) => {
      pol([[l * 60, -112], [l * 76, -118], [l * 70, -104], [l * 80, -96], [l * 60, -92]], T.luz);
      pol([[l * 60, -104], [l * 76, -104], [l * 60, -92]], T.sombra);
    });
    // el cuerpo de seis caras: la luz viene de arriba a la derecha, la mitad izquierda en sombra
    pol([[-26, -40], [26, -40], [32, -76], [24, -116], [-24, -116], [-32, -76]], T.paja);
    pol([[-26, -40], [0, -40], [0, -116], [-24, -116], [-32, -76]], T.sombra);
    pol([[32, -76], [24, -116], [10, -116], [14, -76]], T.luz);
    pol([[-31, -70], [31, -70], [31, -64], [-31, -64]], T.maderaS);
    pol([[-24, -40], [-18, -30], [-10, -40], [-2, -28], [6, -40], [14, -30], [22, -40]], T.luz);
    // la faja verde del Ciervo y el rombo rojo
    pol([[-26, -112], [-16, -116], [26, -48], [16, -42]], "#2C4226");
    pol([[-16, -116], [-10, -114], [26, -52], [26, -48]], "#3E5A34");
    pol([[0, -96], [10, -86], [0, -76], [-10, -86]], "#9C2315");
    pol([[0, -96], [10, -86], [0, -86]], "#C8402D");
    // la cabeza ochavada
    const hy = -140,
      cab = Array.from({ length: 8 }, (_, i) => {
        const a = -Math.PI / 2 + Math.PI / 8 + (i * Math.PI) / 4;
        return [Math.cos(a) * 20, hy + Math.sin(a) * 19];
      });
    pol(cab, T.paja);
    pol([[0, hy - 19], cab[4], cab[5], cab[6], [0, hy + 19]], T.sombra);
    pol([[-10, hy + 16], [10, hy + 16], [8, hy + 22], [-8, hy + 22]], T.maderaS);
    c.restore();
  }

  // La diana de los arqueros de la Guardia: un rollo de paja trenzada en un caballete, con los anillos pintados y
  // alguna flecha clavada.
  function dianaTiro(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 10 * s, y + 3 * s, 46 * s, 10 * s, 0.32);
    // el caballete
    [[-34, 1], [34, 0]].forEach(([dx, k]) => {
      const col = k ? C.maderaSombra : C.madera;
      P(c, [x + dx * s - 4 * s, y, x + dx * 0.5 * s - 3 * s, y - 120 * s, x + dx * 0.5 * s + 3 * s, y - 120 * s, x + dx * s + 4 * s, y], col);
    });
    P(c, [x - 6 * s, y, x - 4 * s, y - 70 * s, x + 4 * s, y - 70 * s, x + 6 * s, y], C.maderaSombra);
    // el rollo de paja
    const cy = y - 96 * s;
    E(c, x, cy, 46 * s, 48 * s, "#B8904E");
    E(c, x + 4 * s, cy - 2 * s, 42 * s, 44 * s, "#D9B67A");
    E(c, x + 4 * s, cy - 2 * s, 32 * s, 33 * s, "#F2ECEC");
    E(c, x + 4 * s, cy - 2 * s, 22 * s, 23 * s, "#9C2315");
    E(c, x + 4 * s, cy - 2 * s, 12 * s, 12 * s, "#F2ECEC");
    E(c, x + 4 * s, cy - 2 * s, 5 * s, 5 * s, "#C8402D");
    // flechas clavadas
    const r = azar((o.sem || 1) * 29);
    for (let k = 0; k < 3; k++) {
      const fx = x + (r() - 0.4) * 40 * s,
        fy = cy + (r() - 0.5) * 40 * s;
      DIB.L(c, fx, fy, fx + 26 * s, fy - 10 * s, "#6B4A2C", 2.5 * s);
      P(c, [fx + 22 * s, fy - 8 * s, fx + 32 * s, fy - 16 * s, fx + 30 * s, fy - 6 * s], "#F2ECEC");
    }
  }

  // El estante de armas del campo de entrenamiento: lanzas paradas, dos escudos redondos colgados y espadas de madera.
  function estanteArmas(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 12 * s, y + 3 * s, 80 * s, 12 * s, 0.32);
    R(c, x - 74 * s, y - 130 * s, 8 * s, 130 * s, C.maderaSombra);
    R(c, x + 66 * s, y - 130 * s, 8 * s, 130 * s, C.madera);
    R(c, x - 76 * s, y - 120 * s, 152 * s, 8 * s, C.madera);
    R(c, x - 76 * s, y - 40 * s, 152 * s, 8 * s, C.maderaSombra);
    for (let k = 0; k < 5; k++) {
      const lx = x - 56 * s + k * 18 * s;
      DIB.L(c, lx, y - 6 * s, lx + 4 * s, y - 170 * s, "#7A5634", 4 * s);
      P(c, [lx + 1 * s, y - 170 * s, lx + 4 * s, y - 192 * s, lx + 8 * s, y - 170 * s], k % 2 ? C.hierroLuz : C.hierro);
    }
    [[36, "#2C4226", "#3E5A34"], [50, "#9C2315", "#C8402D"]].forEach(([dx, a, b], i) => {
      E(c, x + dx * s, y - 84 * s + i * 30 * s, 22 * s, 24 * s, a);
      E(c, x + dx * s + 3 * s, y - 85 * s + i * 30 * s, 17 * s, 19 * s, b);
      E(c, x + dx * s + 3 * s, y - 85 * s + i * 30 * s, 5 * s, 5 * s, C.hierroLuz);
    });
  }

  // El secadero de hierbas de la Casa de Sanación: un bastidor de varas con manojos colgados cabeza abajo.
  function secaderoHierbas(c, x, y, t, o) {
    const s = o.s || 1,
      r = azar((o.sem || 1) * 13);
    sombra(c, x + 10 * s, y + 3 * s, 80 * s, 10 * s, 0.3);
    R(c, x - 70 * s, y - 120 * s, 6 * s, 120 * s, C.maderaSombra);
    R(c, x + 64 * s, y - 120 * s, 6 * s, 120 * s, C.madera);
    for (const yy of [-116, -70]) {
      R(c, x - 74 * s, y + yy * s, 148 * s, 5 * s, C.madera);
      for (let k = 0; k < 7; k++) {
        const hx = x - 60 * s + k * 20 * s,
          v = Math.sin(t * 1.2 + k) * 1.5 * s,
          col = ["#56662C", "#4A5A2E", "#8A7A5A", "#9A6BD8", "#C8B48C"][Math.floor(r() * 5)];
        DIB.L(c, hx, y + (yy + 5) * s, hx + v, y + (yy + 12) * s, "#3A2A1E", 1.5 * s);
        P(c, [hx - 6 * s + v, y + (yy + 12) * s, hx + 6 * s + v, y + (yy + 12) * s, hx + v, y + (yy + 34) * s], col);
      }
    }
  }

  // Un fardo de heno del corral de caravanas.
  function fardoHeno(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 8 * s, y + 2 * s, 46 * s, 9 * s, 0.3);
    P(c, [x - 40 * s, y, x - 40 * s, y - 40 * s, x + 10 * s, y - 40 * s, x + 10 * s, y], "#B8904E");
    P(c, [x + 10 * s, y, x + 10 * s, y - 40 * s, x + 40 * s, y - 48 * s, x + 40 * s, y - 8 * s], "#D9B67A");
    P(c, [x - 40 * s, y - 40 * s, x - 10 * s, y - 48 * s, x + 40 * s, y - 48 * s, x + 10 * s, y - 40 * s], "#E8CF8F");
    for (const dx of [-24, -6]) DIB.L(c, x + dx * s, y, x + dx * s, y - 40 * s, "#8A6A48", 2 * s);
  }

  // El poste del Hongo Dorado: un poste alto en la esquina de la hospedería con el brazo de hierro, el cartel tallado
  // del hongo dorado (se ve desde toda la calle, gire como gire la cámara) y un farol que se mece debajo.
  function posteHongo(c, x, y, t, o) {
    const s = o.s || 1,
      bal = Math.sin(t * 1.4) * 0.05;
    sombra(c, x + 10 * s, y + 2 * s, 26 * s, 7 * s, 0.35);
    P(c, [x - 6 * s, y, x - 5 * s, y - 230 * s, x + 1 * s, y - 230 * s, x + 1 * s, y], C.maderaSombra);
    P(c, [x + 1 * s, y, x + 1 * s, y - 230 * s, x + 6 * s, y - 230 * s, x + 6 * s, y], C.madera);
    DIB.L(c, x, y - 220 * s, x + 76 * s, y - 220 * s, C.hierro, 4 * s);
    DIB.L(c, x, y - 190 * s, x + 30 * s, y - 220 * s, C.hierro, 3 * s);
    c.save();
    c.translate(x + 50 * s, y - 220 * s);
    c.rotate(bal);
    DIB.L(c, -18 * s, 0, -18 * s, 10 * s, C.hierro, 2 * s);
    DIB.L(c, 18 * s, 0, 18 * s, 10 * s, C.hierro, 2 * s);
    P(c, [-30 * s, 10 * s, 30 * s, 10 * s, 30 * s, 58 * s, -30 * s, 58 * s], C.maderaSombra);
    P(c, [-26 * s, 14 * s, 26 * s, 14 * s, 26 * s, 54 * s, -26 * s, 54 * s], C.madera);
    // el hongo dorado tallado
    P(c, [-3 * s, 32 * s, 3 * s, 32 * s, 4 * s, 48 * s, -4 * s, 48 * s], "#E8DCC4");
    P(c, [-18 * s, 34 * s, -12 * s, 22 * s, 12 * s, 22 * s, 18 * s, 34 * s], "#E8B04A");
    P(c, [0, 22 * s, 12 * s, 22 * s, 18 * s, 34 * s, 2 * s, 34 * s], C.ambar);
    c.restore();
    // el farol
    const fx = x + 70 * s + Math.sin(t * 1.4) * 2 * s,
      fy = y - 200 * s;
    DIB.L(c, x + 70 * s, y - 220 * s, fx, fy, C.hierro, 1.5 * s);
    R(c, fx - 7 * s, fy, 14 * s, 18 * s, "#1A140E");
    alfa(c, 0.9, () => R(c, fx - 5 * s, fy + 2 * s, 10 * s, 14 * s, C.ambar));
    if (nivel() !== "baja") halo(c, fx, fy + 9 * s, 70 * s, C.ambar, 0.55);
  }

  Object.assign(ASSETS.LISTA, {
    posteHongo: { f: posteHongo, alto: 240, choque: { r: 10 }, grupo: "capital", luz: true },
    munecoPractica: { f: munecoPractica, alto: 110, choque: { r: 18 }, grupo: "capital" },
    dianaTiro: { f: dianaTiro, alto: 150, choque: { r: 20 }, grupo: "capital" },
    estanteArmas: { f: estanteArmas, alto: 200, choque: { w: 150, h: 20 }, grupo: "capital" },
    secaderoHierbas: { f: secaderoHierbas, alto: 130, choque: { w: 150, h: 20 }, grupo: "capital" },
    fardoHeno: { f: fardoHeno, alto: 50, choque: { w: 80, h: 20 }, grupo: "capital" },
    chimeneaHerreria: { f: chimeneaHerreria, alto: 700, choque: { r: 50 }, grupo: "capital", luz: true },
  });
})();
