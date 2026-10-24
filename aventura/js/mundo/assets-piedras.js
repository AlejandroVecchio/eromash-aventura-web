// ---------- las piedras de Eldervald: las del camino y las del rito ----------
// La piedra del camino es una piedra de memoria como las de los viejos caminos del norte: losa de punta redonda con
// una cinta de serpiente pintada de ocre llena de runas. La piedra del rito es un menhir con una sola runa grande que
// pide algo para despertar (fuego, hielo, la luna, sangre, silencio, una carrera, un orden, pelear con sus guardianes).
(function () {
  "use strict";
  const { P, E, R, L, alfa, sombra, halo, poli } = DIB;
  const C = ASSETS.C;
  const F = FUTHARK;


  // ---------- formas de piedra ----------
  // Cinco siluetas para que no haya dos piedras iguales: losa redonda, menhir en punta, inclinada, rota y arco.
  // Cada una trae su contorno, la cara de la luz (derecha) y la de la sombra (izquierda) en medidas de -1 a 1
  // (x en medios anchos, y en altos hacia arriba). La semilla elige la forma y estira un poco el ancho y el alto.
  const FORMAS = [
    { borde: [-1, 0, -1, -0.72, -0.7, -0.93, 0, -1, 0.7, -0.94, 1, -0.74, 1, 0], luz: [0.2, -1, 0.7, -0.94, 1, -0.74, 1, 0, 0.45, 0], sombra: [-1, 0, -1, -0.72, -0.75, -0.9, -0.7, 0] },
    { borde: [-0.9, 0, -0.85, -0.72, -0.35, -1, 0.3, -0.96, 0.85, -0.7, 1, 0], luz: [0.3, -0.96, 0.85, -0.7, 1, 0, 0.4, 0, 0.05, -0.9], sombra: [-0.9, 0, -0.85, -0.72, -0.55, -0.88, -0.55, 0] },
    { borde: [-1, 0, -0.95, -0.84, 0.85, -1, 1, -0.9, 1, 0], luz: [0.3, -0.95, 0.85, -1, 1, -0.9, 1, 0, 0.45, 0], sombra: [-1, 0, -0.95, -0.84, -0.65, -0.87, -0.68, 0] },
    { borde: [-1, 0, -1, -0.8, -0.55, -0.95, -0.2, -0.84, 0.15, -1, 0.6, -0.88, 1, -0.93, 1, 0], luz: [0.15, -1, 0.6, -0.88, 1, -0.93, 1, 0, 0.45, 0, 0.35, -0.9], sombra: [-1, 0, -1, -0.8, -0.7, -0.9, -0.7, 0] },
    { borde: [-1, 0, -1, -0.62, -0.6, -0.88, 0, -1, 0.6, -0.88, 1, -0.62, 1, 0], luz: [0, -1, 0.6, -0.88, 1, -0.62, 1, 0, 0.4, 0], sombra: [-1, 0, -1, -0.62, -0.72, -0.8, -0.72, 0] },
  ];
  // devuelve la forma de esta piedra ya medida: { borde, luz, sombra, w, h, i } en coordenadas del mundo
  function formaPiedra(x, y, w, h, sem) {
    const i = Math.floor((sem || 0) * 7) % FORMAS.length,
      kw = 0.92 + (((sem || 0) * 13) % 1) * 0.22,
      kh = 0.92 + (((sem || 0) * 17) % 1) * 0.14,
      W = w * kw,
      H = h * kh,
      m = (pts) => pts.map((v, k) => (k % 2 ? y + v * H : x + v * W));
    const F = FORMAS[i];
    return { borde: m(F.borde), luz: m(F.luz), sombra: m(F.sombra), w: W, h: H, i, norm: F.borde };
  }
  function pintarPiedra(c, f, cols) {
    P(c, f.borde, cols[0]);
    P(c, f.luz, cols[1]);
    P(c, f.sombra, cols[2]);
  }

  // ---------- Piedra del camino ----------
  // o.leida: la pintura de la cinta se aviva y queda una vela de sebo encendida al pie.
  function piedraCamino(c, x, y, t, o) {
    const s = o.s || 1,
      leida = !!o.leida,
      f = formaPiedra(x, y, 38 * s, 104 * s, o.sem);
    sombra(c, x + 10 * s, y + 3, f.w + 8 * s, 9 * s);
    pintarPiedra(c, f, ["#6A6660", "#827C74", "#4C4844"]);
    // la cinta de la serpiente: sigue el borde de la piedra por dentro y se anuda abajo
    const tinta = leida ? "#C8402D" : "#6E4A3A",
      n = f.norm;
    c.save();
    c.strokeStyle = tinta;
    c.lineWidth = 6 * s;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    for (let k = 0; k < n.length; k += 2) {
      const px = x + n[k] * f.w * 0.74,
        py = y - 10 * s + n[k + 1] * (f.h - 22 * s);
      if (k === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.quadraticCurveTo(x + f.w * 0.4, y - 2 * s, x - 6 * s, y - 14 * s);
    c.stroke();
    c.restore();
    P(c, [x - 12 * s, y - 18 * s, x - 3 * s, y - 22 * s, x + 1 * s, y - 13 * s, x - 7 * s, y - 9 * s], tinta);
    // runas dentro de la cinta, en columna
    const runas = o.runas || ["raidho", "ehwaz", "mannaz"],
      paso = (f.h - 44 * s) / 3;
    alfa(c, leida ? 1 : 0.75, () => runas.forEach((r, i) => F.dibujar(c, r, x, y - 26 * s - i * paso, paso * 0.72, leida ? "#F2ECEC" : "#3A3632", 2.4 * s)));
    E(c, x - f.w * 0.55, y - 2 * s, 14 * s, 5 * s, C.musgo2);
    E(c, x + f.w * 0.6, y - 1 * s, 8 * s, 3 * s, C.musgo);
    if (leida) {
      const vx = x + f.w + 8 * s;
      R(c, vx - 3 * s, y - 14 * s, 6 * s, 14 * s, "#E0D6C0");
      const fl = Math.sin(t * 9 + (o.sem || 0)) * 1.2 * s;
      halo(c, vx, y - 20 * s, 26 * s, "#FFD98A", 0.7);
      P(c, [vx + fl, y - 26 * s, vx - 2.5 * s, y - 17 * s, vx + 2.5 * s, y - 17 * s], "#FFD98A");
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
    // base chata y la piedra con su forma
    const f = formaPiedra(x, y - 4 * s, 36 * s, 128 * s, o.sem);
    P(c, poli(x, y - 2 * s, f.w + 10 * s, 11 * s, 7, 0.4), oscura);
    pintarPiedra(c, f, [gris, clara, oscura]);
    // el sello de cada rito, chico, arriba de la runa grande
    const sx = x + 1 * s,
      sy = y - 4 * s - f.h * 0.8;
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
    const rh = Math.min(48 * s, f.h * 0.4),
      ry = y - 4 * s - f.h * 0.42 - rh / 2;
    F.dibujar(c, d.runa, x + 1 * s, ry + rh / 2, rh, viva ? d.col : "#24242A", 5 * s);
    if (!viva && carga > 0) {
      c.save();
      c.beginPath();
      c.rect(x - f.w, ry + rh / 2 - rh * carga, f.w * 2, rh * carga + 4 * s);
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
    piedraCamino: { f: piedraCamino, alto: 110, choque: { r: 26 }, grupo: "piedras" },
    piedraRito: { f: piedraRito, alto: 140, choque: { r: 26 }, grupo: "piedras", luz: true },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, {
    piedraCamino: { leida: true },
    piedraRito: { tipo: "brasa", viva: true },
  });
  ASSETS.RITO = RITO;
  ASSETS.formaPiedra = formaPiedra;
  ASSETS.pintarPiedra = pintarPiedra;
})();
