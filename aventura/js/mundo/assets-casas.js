// ---------- las casas de varios cuartos ----------
// Lo que une un cuarto con otro: la puerta de adentro (tablas con bandas de hierro, en la pared del fondo), el paso
// secreto que queda a la vista cuando se corre lo que lo tapaba, el tapiz de la pared que se descorre y las tablas
// flojas que delatan un muro falso. Mismas medidas que los muebles del cuarto (pies en x, y; luz de arriba a la derecha).
(function () {
  "use strict";
  const { P, E, R, L, alfa, sombra, halo } = DIB;
  const ORO = "#C9A45A",
    HIERRO = "#3A3438",
    HIERRO2 = "#5A5458";
  const TABLAS = ["#5E130D", "#561109", "#661610"];

  // ---------- La puerta de adentro ----------
  // Arco bajo de vigas, hoja de cuatro tablas con dos bandas de hierro y la argolla. o.abierta: la hoja está corrida
  // hacia adentro y se ve la luz tibia del otro cuarto. o.runa: una runa tallada en el dintel (la del cuarto de al lado).
  function puertaInterior(c, x, y, t, o) {
    const s = o.s || 1,
      w = 86 * s,
      h = 300 * s;
    // el hueco
    P(c, [x - w, y, x + w, y, x + w, y - h, x - w, y - h], "#0C0706");
    if (o.abierta) {
      alfa(c, 0.5, () => P(c, [x - w + 14 * s, y, x + w - 10 * s, y, x + w - 20 * s, y - h + 30 * s, x - w + 24 * s, y - h + 30 * s], "#3A2014"));
      halo(c, x, y - h * 0.4, 140 * s, "#FFD98A", 0.25);
      // la hoja, de canto contra el marco
      P(c, [x - w, y, x - w + 40 * s, y - 14 * s, x - w + 40 * s, y - h + 10 * s, x - w, y - h], TABLAS[0]);
      P(c, [x - w, y, x - w + 14 * s, y - 5 * s, x - w + 14 * s, y - h + 4 * s, x - w, y - h], "#3A0A06");
    } else {
      for (let k = 0; k < 4; k++) {
        const x0 = x - w + (k * 2 * w) / 4,
          x1 = x0 + (2 * w) / 4 - 3 * s;
        P(c, [x0, y, x1, y, x1, y - h, x0, y - h], k < 2 ? ["#4A0E08", "#430C07"][k] : TABLAS[k % 3]);
      }
      [0.25, 0.72].forEach((u) => {
        R(c, x - w, y - h * u - 10 * s, w * 2, 20 * s, HIERRO);
        R(c, x, y - h * u - 10 * s, w, 20 * s, HIERRO2);
        [-0.7, -0.2, 0.3, 0.8].forEach((v) => E(c, x + v * w, y - h * u, 4 * s, 4 * s, "#1E1A1C"));
      });
      // la argolla
      c.beginPath();
      c.arc(x + w * 0.55, y - h * 0.48, 16 * s, 0, Math.PI * 2);
      c.strokeStyle = HIERRO2;
      c.lineWidth = 5 * s;
      c.stroke();
      E(c, x + w * 0.55, y - h * 0.48 - 16 * s, 7 * s, 7 * s, HIERRO);
    }
    // el marco de vigas
    R(c, x - w - 22 * s, y - h - 10 * s, 22 * s, h + 10 * s, "#2E0A06");
    R(c, x + w, y - h - 10 * s, 22 * s, h + 10 * s, "#5C1A10");
    P(c, [x - w - 40 * s, y - h - 10 * s, x + w + 40 * s, y - h - 10 * s, x + w + 34 * s, y - h - 44 * s, x - w - 34 * s, y - h - 44 * s], "#661610");
    P(c, [x - w - 40 * s, y - h - 10 * s, x, y - h - 10 * s, x, y - h - 44 * s, x - w - 34 * s, y - h - 44 * s], "#4A0E08");
    if (o.runa && window.FUTHARK) FUTHARK.dibujar(c, o.runa, x, y - h - 16 * s, 24 * s, ORO, 3 * s);
    // el umbral
    P(c, [x - w - 26 * s, y + 6 * s, x + w + 26 * s, y + 6 * s, x + w + 20 * s, y - 6 * s, x - w - 20 * s, y - 6 * s], "#2A1A10");
  }

  // ---------- El paso secreto ----------
  // Un hueco de bordes quebrados en la pared, con el aire frío del otro lado y piedras sueltas al pie.
  function pasoSecreto(c, x, y, t, o) {
    const s = o.s || 1;
    P(c, [x - 92 * s, y, x - 100 * s, y - 120 * s, x - 84 * s, y - 230 * s, x - 40 * s, y - 286 * s, x + 30 * s, y - 292 * s, x + 80 * s, y - 250 * s, x + 98 * s, y - 140 * s, x + 90 * s, y], "#1A1210");
    P(c, [x - 76 * s, y, x - 82 * s, y - 120 * s, x - 66 * s, y - 220 * s, x - 30 * s, y - 266 * s, x + 26 * s, y - 270 * s, x + 64 * s, y - 236 * s, x + 80 * s, y - 136 * s, x + 74 * s, y], "#080506");
    alfa(c, 0.35 + 0.1 * Math.sin(t * 1.3), () => E(c, x + 4 * s, y - 130 * s, 34 * s, 70 * s, "#2A3A5A"));
    // piedras del borde: la cara de la derecha con luz
    [[-90, -60], [-96, -170], [-60, -262], [10, -286], [70, -230], [92, -110], [86, -30]].forEach(([dx, dy], k) => {
      const px = x + dx * s,
        py = y + dy * s,
        r = (16 + (k % 3) * 5) * s;
      P(c, [px - r, py + r * 0.6, px - r * 0.8, py - r * 0.7, px + r * 0.6, py - r * 0.9, px + r, py + r * 0.4], "#4A4440");
      P(c, [px, py - r * 0.8, px + r * 0.6, py - r * 0.9, px + r, py + r * 0.4, px, py + r * 0.5], "#625A54");
    });
    sombra(c, x, y + 4 * s, 110 * s, 14 * s, 0.5);
    [[-60, 10, 14], [50, 16, 10], [10, 22, 8]].forEach(([dx, dy, r]) => {
      P(c, [x + (dx - r) * s, y + dy * s, x + (dx - r * 0.5) * s, y + (dy - r) * s, x + (dx + r) * s, y + (dy - r * 0.6) * s, x + (dx + r * 0.8) * s, y + dy * s], "#55504A");
      P(c, [x + dx * s, y + (dy - r * 0.9) * s, x + (dx + r) * s, y + (dy - r * 0.6) * s, x + (dx + r * 0.8) * s, y + dy * s, x + dx * s, y + dy * s], "#6A645C");
    });
  }

  // ---------- El tapiz de la pared ----------
  // Lana roja con borde oscuro, el nudo dorado y dos runas tejidas, colgado de una vara. o.corrido: juntado a la
  // derecha (lo que tapaba queda a la vista).
  function tapizPared(c, x, y, t, o) {
    const s = o.s || 1,
      top = y - 340 * s,
      bot = y - 40 * s;
    R(c, x - 130 * s, top - 10 * s, 260 * s, 12 * s, "#2A1A10");
    E(c, x - 132 * s, top - 4 * s, 10 * s, 10 * s, ORO);
    E(c, x + 132 * s, top - 4 * s, 10 * s, 10 * s, ORO);
    const sw = Math.sin(t * 0.8 + x) * 3 * s;
    if (o.corrido) {
      // juntado en pliegues contra el costado
      for (let k = 0; k < 4; k++) {
        const x0 = x + 70 * s + k * 14 * s;
        P(c, [x0, top, x0 + 16 * s, top, x0 + 18 * s + sw, bot, x0 - 2 * s + sw, bot], k % 2 ? "#7A1A10" : "#9C2315");
      }
      return;
    }
    P(c, [x - 120 * s, top, x + 120 * s, top, x + 120 * s + sw, bot, x + 60 * s + sw, bot - 20 * s, x + sw, bot, x - 60 * s + sw, bot - 20 * s, x - 120 * s + sw, bot], "#9C2315");
    P(c, [x - 120 * s, top, x, top, x + sw, bot, x - 60 * s + sw, bot - 20 * s, x - 120 * s + sw, bot], "#7A1A10");
    // borde y dibujo
    R(c, x - 120 * s, top, 240 * s, 18 * s, "#5E130D");
    P(c, [x, top + 70 * s, x + 50 * s, top + 130 * s, x, top + 190 * s, x - 50 * s, top + 130 * s], ORO);
    P(c, [x, top + 92 * s, x + 30 * s, top + 130 * s, x, top + 168 * s, x - 30 * s, top + 130 * s], "#9C2315");
    if (window.FUTHARK) {
      FUTHARK.dibujar(c, "othala", x - 70 * s, top + 250 * s, 34 * s, "#E0B2B2", 4 * s);
      FUTHARK.dibujar(c, "ingwaz", x + 70 * s, top + 250 * s, 34 * s, "#E0B2B2", 4 * s);
    }
  }

  // ---------- Las tablas flojas ----------
  // Tres tablas de la pared que no calzan: corridas, con un clavo salido y una raya de aire frío entre ellas.
  function tablasFlojas(c, x, y, t, o) {
    const s = o.s || 1;
    [[-70, 2, "#3A1A10"], [-20, -3, "#4A2214"], [30, 4, "#3E1C12"]].forEach(([dx, rot, col], k) => {
      const x0 = x + dx * s,
        w = 46 * s,
        h = 260 * s;
      P(c, [x0, y - 20 * s, x0 + w, y - 20 * s + rot * s, x0 + w + rot * s, y - h, x0 + rot * s, y - h - rot * s], col);
      P(c, [x0 + w * 0.6, y - 20 * s, x0 + w, y - 20 * s + rot * s, x0 + w + rot * s, y - h, x0 + w * 0.6 + rot * s, y - h], k === 2 ? "#55301C" : "#4E2A18");
      E(c, x0 + w * 0.5, y - h + 26 * s, 3 * s, 3 * s, HIERRO2);
    });
    alfa(c, 0.5 + 0.2 * Math.sin(t * 2), () => {
      L(c, x - 24 * s, y - 40 * s, x - 22 * s, y - 240 * s, "#2A3A5A", 3 * s);
      L(c, x + 28 * s, y - 40 * s, x + 31 * s, y - 230 * s, "#2A3A5A", 2 * s);
    });
    L(c, x + 66 * s, y - 120 * s, x + 84 * s, y - 128 * s, HIERRO2, 3 * s);
  }

  Object.assign(ASSETS.LISTA, {
    puertaInterior: { f: puertaInterior, fv: ASSETS.cartaV(puertaInterior, 252, 354), vol: true, alto: 350, choque: null, grupo: "interiores" },
    pasoSecreto: { f: pasoSecreto, fv: ASSETS.cartaV(pasoSecreto, 200, 296), vol: true, alto: 300, choque: null, grupo: "interiores" },
    tapizPared: { f: tapizPared, fv: ASSETS.cartaV(tapizPared, 280, 352), vol: true, alto: 360, choque: null, grupo: "interiores" },
    tablasFlojas: { f: tablasFlojas, fv: ASSETS.cartaV(tablasFlojas, 200, 270), vol: true, alto: 270, choque: null, grupo: "interiores" },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, { puertaInterior: { runa: "raidho" } });
})();
