// ---------- las piedras de Eldervald: las del camino y las del rito ----------
// La piedra del camino es una piedra de memoria como las de los viejos caminos del norte: losa de punta redonda con
// una cinta de serpiente pintada de ocre llena de runas. La piedra del rito es un menhir con una sola runa grande que
// pide algo para despertar (fuego, hielo, la luna, sangre, silencio, una carrera, un orden, pelear con sus guardianes).
(function () {
  "use strict";
  const { P, E, R, L, alfa, sombra, halo, poli } = DIB;
  const C = ASSETS.C;
  const F = FUTHARK;

  // ---------- Piedra del camino ----------
  // o.leida: la pintura de la cinta se aviva y queda una vela de sebo encendida al pie.
  function piedraCamino(c, x, y, t, o) {
    const s = o.s || 1,
      leida = !!o.leida;
    sombra(c, x + 10 * s, y + 3, 34 * s, 8 * s);
    const gris = "#6A6660",
      clara = "#827C74",
      oscura = "#4C4844";
    // losa de punta redonda, apenas inclinada
    P(c, [x - 26 * s, y, x - 27 * s, y - 70 * s, x - 18 * s, y - 92 * s, x, y - 100 * s, x + 18 * s, y - 94 * s, x + 26 * s, y - 74 * s, x + 25 * s, y], gris);
    P(c, [x + 4 * s, y - 100 * s, x + 18 * s, y - 94 * s, x + 26 * s, y - 74 * s, x + 25 * s, y, x + 12 * s, y], clara);
    P(c, [x - 26 * s, y, x - 27 * s, y - 70 * s, x - 20 * s, y - 86 * s, x - 18 * s, y], oscura);
    // la cinta de la serpiente: un arco que baja por los bordes y se anuda abajo
    const tinta = leida ? "#C8402D" : "#6E4A3A";
    c.save();
    c.strokeStyle = tinta;
    c.lineWidth = 6 * s;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(x - 18 * s, y - 8 * s);
    c.lineTo(x - 19 * s, y - 66 * s);
    c.quadraticCurveTo(x - 14 * s, y - 88 * s, x, y - 90 * s);
    c.quadraticCurveTo(x + 15 * s, y - 88 * s, x + 18 * s, y - 68 * s);
    c.lineTo(x + 16 * s, y - 16 * s);
    c.quadraticCurveTo(x + 8 * s, y - 4 * s, x - 6 * s, y - 14 * s);
    c.stroke();
    c.restore();
    // cabeza de la serpiente mordiéndose la cola
    P(c, [x - 10 * s, y - 18 * s, x - 2 * s, y - 22 * s, x + 2 * s, y - 14 * s, x - 6 * s, y - 10 * s], tinta);
    // runas dentro de la cinta
    const runas = o.runas || ["raidho", "ehwaz", "mannaz"];
    alfa(c, leida ? 1 : 0.7, () => runas.forEach((r, i) => F.dibujar(c, r, x - 1 * s, y - (70 - i * 20) * s, 12 * s, leida ? "#F2ECEC" : "#3A3632", 1.8 * s)));
    // musgo al pie
    E(c, x - 14 * s, y - 2 * s, 14 * s, 5 * s, C.musgo2);
    E(c, x + 16 * s, y - 1 * s, 8 * s, 3 * s, C.musgo);
    if (leida) {
      // vela de sebo
      R(c, x + 30 * s, y - 14 * s, 6 * s, 14 * s, "#E0D6C0");
      const fl = Math.sin(t * 9 + (o.sem || 0)) * 1.2 * s;
      halo(c, x + 33 * s, y - 20 * s, 26 * s, "#FFD98A", 0.7);
      P(c, [x + 33 * s + fl, y - 26 * s, x + 30.5 * s, y - 17 * s, x + 35.5 * s, y - 17 * s], "#FFD98A");
    }
  }

  // ---------- Piedra del rito ----------
  // o.tipo: brasa · escarcha · luna · sangre · eco · silencio · carrera · guardian. o.viva: despierta.
  // o.marca (eco): cuántas muescas lleva (1–3). o.carga 0–1: el rito a medias (silencio, carrera) llena la runa.
  const RITO = {
    brasa: { runa: "kenaz", col: "#FF8D71", piedra: ["#5A4A44", "#6E5A52", "#40342F"] },
    escarcha: { runa: "isa", col: "#C8F2F4", piedra: ["#5C6670", "#74808A", "#434C55"] },
    luna: { runa: "dagaz", col: "#DDE6F2", piedra: ["#4E5262", "#646A7C", "#383B48"] },
    sangre: { runa: "gebo", col: "#C8402D", piedra: ["#5A4644", "#6E5654", "#3F302F"] },
    eco: { runa: "ansuz", col: "#73D5DB", piedra: ["#565A62", "#6C7078", "#40444C"] },
    silencio: { runa: "perthro", col: "#9A6BD8", piedra: ["#504C5C", "#665F74", "#3A3644"] },
    carrera: { runa: "raidho", col: "#FFD98A", piedra: ["#5E5848", "#746C58", "#443F33"] },
    guardian: { runa: "tiwaz", col: "#F5A524", piedra: ["#5C5248", "#72665A", "#423A33"] },
  };
  function piedraRito(c, x, y, t, o) {
    const s = o.s || 1,
      d = RITO[o.tipo] || RITO.eco,
      viva = !!o.viva,
      carga = o.carga || 0,
      [gris, clara, oscura] = d.piedra;
    const late = viva ? 0.85 + Math.sin(t * 2 + (o.sem || 0)) * 0.15 : 0.2 + carga * 0.6 + Math.max(0, Math.sin(t * 1.3 + (o.sem || 0))) * 0.2;
    if (viva || carga > 0) halo(c, x, y - 70 * s, (70 + 90 * Math.max(carga, viva ? 1 : 0)) * s, d.col, late * 0.9);
    sombra(c, x + 10 * s, y + 3, 32 * s, 8 * s);
    // base: tres piedras chatas
    P(c, poli(x, y - 2 * s, 34 * s, 10 * s, 7, 0.4), oscura);
    // menhir facetado, más angosto arriba
    P(c, [x - 20 * s, y - 4 * s, x - 17 * s, y - 104 * s, x - 6 * s, y - 132 * s, x + 10 * s, y - 128 * s, x + 19 * s, y - 100 * s, x + 21 * s, y - 4 * s], gris);
    P(c, [x - 6 * s, y - 132 * s, x + 10 * s, y - 128 * s, x + 19 * s, y - 100 * s, x + 21 * s, y - 4 * s, x + 6 * s, y - 4 * s, x + 2 * s, y - 110 * s], clara);
    P(c, [x - 20 * s, y - 4 * s, x - 17 * s, y - 104 * s, x - 12 * s, y - 116 * s, x - 11 * s, y - 4 * s], oscura);
    // el sello de cada rito, chico, arriba de la runa grande
    const sx = x + 1 * s,
      sy = y - 112 * s;
    alfa(c, 0.85, () => {
      if (o.tipo === "luna") {
        E(c, sx, sy, 6 * s, 6 * s, viva ? d.col : "#2E3038");
        E(c, sx + 3 * s, sy - 1 * s, 5 * s, 5 * s, gris);
      } else if (o.tipo === "sangre") P(c, [sx, sy - 7 * s, sx + 4 * s, sy + 1 * s, sx, sy + 5 * s, sx - 4 * s, sy + 1 * s], viva ? d.col : "#3A2422");
      else if (o.tipo === "eco") for (let k = 0; k < (o.marca || 1); k++) R(c, sx - 7 * s + k * 6 * s, sy - 4 * s, 3 * s, 9 * s, viva ? d.col : "#2E3238");
      else if (o.tipo === "silencio") L(c, sx - 6 * s, sy, sx + 6 * s, sy, viva ? d.col : "#2E2A36", 2.5 * s);
      else if (o.tipo === "carrera") P(c, [sx - 6 * s, sy - 4 * s, sx + 6 * s, sy, sx - 6 * s, sy + 4 * s], viva ? d.col : "#3A3628");
      else if (o.tipo === "guardian") P(c, [sx - 6 * s, sy + 4 * s, sx - 6 * s, sy - 4 * s, sx, sy - 7 * s, sx + 6 * s, sy - 4 * s, sx + 6 * s, sy + 4 * s, sx, sy + 7 * s], viva ? d.col : "#3A332C");
      else if (o.tipo === "brasa") P(c, [sx, sy - 7 * s, sx + 5 * s, sy + 4 * s, sx - 5 * s, sy + 4 * s], viva ? d.col : "#3A2C28");
      else if (o.tipo === "escarcha") P(c, [sx, sy - 7 * s, sx + 5 * s, sy, sx, sy + 7 * s, sx - 5 * s, sy], viva ? d.col : "#323A42");
    });
    // la runa grande tallada: oscura y honda dormida, encendida desde abajo según la carga
    const ry = y - 60 * s,
      rh = 52 * s;
    F.dibujar(c, d.runa, x + 1 * s, ry + rh / 2, rh, viva ? d.col : "#24242A", 5 * s);
    if (!viva && carga > 0) {
      c.save();
      c.beginPath();
      c.rect(x - 30 * s, ry + rh / 2 - rh * carga, 60 * s, rh * carga + 4 * s);
      c.clip();
      F.dibujar(c, d.runa, x + 1 * s, ry + rh / 2, rh, d.col, 5 * s);
      c.restore();
    }
    // escarcha o brasas al pie según el tipo, para que se lea qué pide aun dormida
    if (o.tipo === "escarcha") for (let k = 0; k < 4; k++) P(c, [x - 18 * s + k * 11 * s, y - 2 * s, x - 15 * s + k * 11 * s, y - 14 * s, x - 12 * s + k * 11 * s, y - 2 * s], "#C8D8DC");
    if (o.tipo === "brasa") for (let k = 0; k < 3; k++) E(c, x - 12 * s + k * 12 * s, y - 2 * s, 4 * s, 2 * s, viva ? "#FF8D71" : "#3A2C28");
    if (o.tipo === "sangre") E(c, x + 26 * s, y - 2 * s, 9 * s, 4 * s, viva ? "#5E130D" : "#3A2C28");
    E(c, x - 14 * s, y - 4 * s, 10 * s, 4 * s, C.musgo2);
    // motas de su color cuando despierta
    if (viva)
      for (let k = 0; k < 6; k++) {
        const u = (t * 0.3 + k / 6 + (o.sem || 0)) % 1;
        alfa(c, Math.sin(u * Math.PI), () => R(c, x + Math.sin(k * 2.1 + t * 1.3) * 24 * s, y - 30 * s - u * 120 * s, 2.5 * s, 2.5 * s, d.col));
      }
  }

  Object.assign(ASSETS.LISTA, {
    piedraCamino: { f: piedraCamino, alto: 100, choque: { r: 20 }, grupo: "piedras" },
    piedraRito: { f: piedraRito, alto: 132, choque: { r: 20 }, grupo: "piedras", luz: true },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, {
    piedraCamino: { leida: true },
    piedraRito: { tipo: "brasa", viva: true },
  });
  ASSETS.RITO = RITO;
})();
