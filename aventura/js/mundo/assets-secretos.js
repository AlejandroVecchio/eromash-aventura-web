// ---------- los secretos de Eldervald: cofres, piedras rúnicas, altares y ruinas ----------
// Cada uno es un objeto con nombre propio, dibujado como el resto: caras planas, luz de arriba a la derecha.
// Las runas encendidas son las únicas cosas que brillan de verdad en el bosque: así el jugador las ve de lejos.
(function () {
  "use strict";
  const { P, E, R, L, alfa, sombra, halo, RUNICO, RUNICO_CLARO, VIOLETA, poli, azar, TAU } = DIB;
  const C = ASSETS.C;
  const F = FUTHARK;
  const COL_RUNA = { kenaz: "#FF8D71", isa: "#C8F2F4", algiz: "#FFD98A", sowilo: "#F5A524" };

  // ---------- Arcón del leñador ----------
  // Roble con zunchos y esquineros de hierro, tapa abombada con su cara de arriba al sol, asa de soga al costado y la
  // runa Fehu (riqueza) en la cerradura. o.abierto: la tapa queda parada contra la bisagra, se ve su cara de adentro y
  // en el fondo la paja vieja.
  function arconLenador(c, x, y, t, o) {
    const s = o.s || 1,
      X = (v) => x + v * s,
      Y = (v) => y - v * s,
      pp = (a, col) => P(c, a.map((v, i) => (i % 2 ? Y(v) : X(v))), col);
    sombra(c, X(4), y + 2, 36 * s, 8 * s);
    // cuerpo: frente (mitad izquierda en sombra) y costado derecho al sol
    pp([-28, 0, -28, 24, 20, 24, 20, 0], C.madera);
    pp([-28, 0, -28, 24, -6, 24, -6, 0], "#6A4A2C");
    pp([20, 0, 20, 24, 32, 31, 32, 7], C.maderaLuz);
    // tablas
    L(c, X(-28), Y(12), X(20), Y(12), C.maderaSombra, 1.4 * s);
    L(c, X(20), Y(12), X(32), Y(19), "#7E5C38", 1.2 * s);
    // asa de soga en el costado
    c.save();
    c.strokeStyle = "#B08A58";
    c.lineWidth = 2.4 * s;
    c.beginPath();
    c.moveTo(X(23), Y(17));
    c.quadraticCurveTo(X(26), Y(8), X(29), Y(21));
    c.stroke();
    c.restore();
    if (o.abierto) {
      // la boca y la paja del fondo
      pp([-28, 24, 20, 24, 32, 31, -16, 31], "#1E140C");
      pp([-22, 25, 14, 25, 22, 29, -14, 29], "#6E5A30");
      [-14, -4, 6].forEach((dx, k) => L(c, X(dx), Y(26 + (k % 2)), X(dx + 7), Y(28 - (k % 2)), "#B08A58", 1.2 * s));
      // la tapa parada: se ve la cara de adentro, con sus zunchos
      pp([-16, 31, 32, 31, 34, 56, -14, 56], C.maderaSombra);
      pp([32, 31, 36, 33, 38, 58, 34, 56], C.madera);
      pp([-14, 56, 34, 56, 38, 58, -10, 58], C.maderaLuz);
      [-8, 22].forEach((dx) => pp([dx, 31, dx + 4, 31, dx + 4.4, 56, dx + 0.4, 56], C.hierro));
      L(c, X(-16), Y(43), X(32), Y(43), "#3E2A18", 1.2 * s);
    } else {
      // tapa abombada: frente, cara de arriba (la que más luz recibe) y costado
      pp([-28, 24, -28, 31, -25, 35, -20, 37, 15, 37, 18, 35, 20, 31, 20, 24], C.madera);
      pp([-28, 24, -28, 31, -25, 35, -20, 37, -6, 37, -6, 24], "#6A4A2C");
      pp([-20, 37, 15, 37, 27, 44, -8, 44], "#B08A58");
      pp([20, 24, 20, 31, 18, 35, 15, 37, 27, 44, 30, 42, 32, 38, 32, 31], C.maderaLuz);
      L(c, X(-28), Y(24), X(20), Y(24), C.maderaSombra, 1.6 * s);
      // cerradura con Fehu
      R(c, X(-10), Y(30), 12 * s, 13 * s, C.hierro);
      R(c, X(-10), Y(30), 12 * s, 2 * s, C.hierroLuz);
      F.dibujar(c, "fehu", X(-4), Y(19), 9 * s, C.ambar, 1.5 * s);
    }
    // zunchos (siguen la tapa cuando está cerrada) y esquineros
    const alto = o.abierto ? 24 : 37;
    [-20, 10].forEach((dx) => {
      pp([dx, 0, dx, alto, dx + 4, alto, dx + 4, 0], C.hierro);
      pp([dx + 3, 0, dx + 3, alto, dx + 4, alto, dx + 4, 0], C.hierroLuz);
      if (!o.abierto) pp([dx, 37, dx + 4, 37, dx + 16, 44, dx + 12, 44], C.hierroLuz);
    });
    pp([-28, 0, -28, 6, -22, 6, -22, 0], C.hierro);
    pp([14, 0, 14, 6, 20, 6, 20, 0], C.hierro);
    pp([20, 0, 20, 6, 26, 9.5, 26, 3.5], C.hierroLuz);
  }

  // ---------- Cofre rúnico sellado ----------
  // Piedra azul oscura con herrajes de hierro negro y una banda de runas. Sellado: una cadena violeta y un candado
  // con la runa Naudiz (necesidad) que solo se suelta despertando la piedra del susurro más cercana.
  function cofreRunico(c, x, y, t, o) {
    const s = o.s || 1,
      late = 0.7 + Math.sin(t * 2.2 + (o.sem || 0)) * 0.3;
    if (!o.abierto) halo(c, x, y - 30 * s, 60 * s, o.sellado ? VIOLETA : RUNICO, late * 0.8);
    else halo(c, x, y - 40 * s, 50 * s, RUNICO, 0.5);
    sombra(c, x + 4 * s, y + 2, 38 * s, 9 * s);
    P(c, [x - 32 * s, y, x - 30 * s, y - 30 * s, x + 22 * s, y - 30 * s, x + 24 * s, y], "#2E3A4C");
    P(c, [x + 24 * s, y, x + 22 * s, y - 30 * s, x + 34 * s, y - 37 * s, x + 35 * s, y - 7 * s], "#3E4E66");
    P(c, [x - 32 * s, y, x - 30 * s, y - 30 * s, x - 20 * s, y - 30 * s, x - 21 * s, y], "#232C3A");
    // banda de runas
    R(c, x - 30 * s, y - 20 * s, 52 * s, 8 * s, "#1A202A");
    ["ansuz", "raidho", "kenaz", "gebo", "wunjo"].forEach((r, i) => alfa(c, o.sellado ? 0.35 : 0.9, () => F.dibujar(c, r, x - 24 * s + i * 10 * s, y - 13 * s, 6 * s, RUNICO, 1.2 * s)));
    if (o.abierto) {
      P(c, [x - 30 * s, y - 30 * s, x + 22 * s, y - 30 * s, x + 34 * s, y - 37 * s, x - 18 * s, y - 37 * s], "#0C1018");
      alfa(c, 0.5, () => P(c, [x - 24 * s, y - 32 * s, x + 26 * s, y - 34 * s, x + 18 * s, y - 70 * s, x - 14 * s, y - 70 * s], RUNICO));
      P(c, [x - 18 * s, y - 37 * s, x + 34 * s, y - 37 * s, x + 30 * s, y - 60 * s, x - 22 * s, y - 60 * s], "#2E3A4C");
      F.dibujar(c, "dagaz", x + 4 * s, y - 42 * s, 12 * s, RUNICO_CLARO, 1.6 * s);
    } else {
      P(c, [x - 32 * s, y - 30 * s, x - 18 * s, y - 46 * s, x + 34 * s, y - 50 * s, x + 34 * s, y - 37 * s, x + 22 * s, y - 30 * s], "#36445A");
      P(c, [x + 22 * s, y - 30 * s, x + 34 * s, y - 37 * s, x + 34 * s, y - 50 * s, x + 24 * s, y - 44 * s], "#4A5C78");
      R(c, x - 32 * s, y - 34 * s, 54 * s, 4 * s, C.hierro);
      if (o.sellado) {
        // cadena cruzada y candado con Naudiz
        c.save();
        c.strokeStyle = "#6B4FA0";
        c.lineWidth = 3 * s;
        c.setLineDash([5 * s, 3 * s]);
        c.beginPath();
        c.moveTo(x - 30 * s, y - 42 * s);
        c.lineTo(x + 22 * s, y - 2 * s);
        c.moveTo(x + 22 * s, y - 46 * s);
        c.lineTo(x - 30 * s, y - 2 * s);
        c.stroke();
        c.restore();
        P(c, [x - 12 * s, y - 32 * s, x + 4 * s, y - 32 * s, x + 4 * s, y - 14 * s, x - 12 * s, y - 14 * s], "#2A2238");
        alfa(c, late, () => F.dibujar(c, "naudiz", x - 4 * s, y - 17 * s, 12 * s, VIOLETA, 2 * s));
      } else {
        R(c, x - 9 * s, y - 32 * s, 10 * s, 12 * s, C.hierroLuz);
        F.dibujar(c, "dagaz", x - 4 * s, y - 22 * s, 8 * s, RUNICO_CLARO, 1.4 * s);
      }
    }
  }

  // ---------- Urna del túmulo ----------
  // El arcón de un jarl enterrado: bronce verdoso, dos cabezas de dragón como asas y monedas en la boca.
  function urnaTumulo(c, x, y, t, o) {
    const s = o.s || 1,
      bronce = "#5E7A5A",
      bronceS = "#46604A",
      bronceL = "#7E9A6E",
      oro = "#FFD98A";
    sombra(c, x + 4 * s, y + 2, 36 * s, 8 * s);
    P(c, [x - 30 * s, y, x - 32 * s, y - 24 * s, x + 30 * s, y - 24 * s, x + 28 * s, y], bronce);
    P(c, [x - 30 * s, y, x - 32 * s, y - 24 * s, x - 16 * s, y - 24 * s, x - 16 * s, y], bronceS);
    P(c, [x + 14 * s, y, x + 14 * s, y - 24 * s, x + 30 * s, y - 24 * s, x + 28 * s, y], bronceL);
    // cabezas de dragón a los costados
    [-1, 1].forEach((k) => {
      const hx = x + k * 32 * s;
      P(c, [hx, y - 22 * s, hx + k * 10 * s, y - 34 * s, hx + k * 16 * s, y - 30 * s, hx + k * 12 * s, y - 24 * s, hx + k * 4 * s, y - 14 * s], k < 0 ? bronceS : bronceL);
      R(c, hx + k * 10 * s - 1.5 * s, y - 31 * s, 3 * s, 2 * s, oro);
    });
    // espiral grabada
    c.save();
    c.strokeStyle = bronceS;
    c.lineWidth = 1.5 * s;
    c.beginPath();
    for (let k = 0; k < 18; k++) {
      const a = k * 0.6,
        r = 2 + k * 0.5;
      c.lineTo(x + Math.cos(a) * r * s, y - 12 * s + Math.sin(a) * r * 0.6 * s);
    }
    c.stroke();
    c.restore();
    if (o.abierto) {
      E(c, x, y - 24 * s, 30 * s, 7 * s, "#1A1410");
      P(c, [x - 26 * s, y - 28 * s, x + 28 * s, y - 28 * s, x + 24 * s, y - 46 * s, x - 22 * s, y - 44 * s], bronceS);
    } else {
      E(c, x, y - 26 * s, 32 * s, 8 * s, bronceL);
      E(c, x, y - 30 * s, 26 * s, 6 * s, bronce);
      // monedas que asoman por la tapa mal cerrada
      for (let k = 0; k < 5; k++) E(c, x - 14 * s + k * 7 * s, y - 31 * s - (k % 2) * 2 * s, 3.5 * s, 2 * s, oro);
      const g = 0.5 + Math.sin(t * 3 + x) * 0.5;
      alfa(c, g, () => R(c, x + 6 * s, y - 38 * s, 2 * s, 6 * s, "#FFF4D0"));
    }
  }

  // ---------- Arca enterrada ----------
  // Medio hundida en un montículo de tierra, torcida, con una argolla de hierro, raíces que la abrazan y musgo; nadie
  // la ve hasta que la Lente del Eco o Sowilo la revelan. Abierta: la tapa tirada al costado, el pozo cavado y la tierra
  // amontonada.
  function arcaEnterrada(c, x, y, t, o) {
    const s = o.s || 1,
      X = (v) => x + v * s,
      Y = (v) => y - v * s,
      pp = (a, col) => P(c, a.map((v, i) => (i % 2 ? Y(v) : X(v))), col);
    if (o.oculto) {
      // apenas un destello sobre el musgo, para el que mira bien
      const g = Math.max(0, Math.sin(t * 1.3 + (o.sem || 0) * 3)) ** 8;
      alfa(c, g, () => {
        P(c, [x, y - 16 * s, x + 2 * s, y - 10 * s, x + 8 * s, y - 8 * s, x + 2 * s, y - 6 * s, x, y, x - 2 * s, y - 6 * s, x - 8 * s, y - 8 * s, x - 2 * s, y - 10 * s], "#FFF4D0");
      });
      return;
    }
    if (!o.abierto) halo(c, x, y - 16 * s, 46 * s, C.ambar, 0.5 + Math.sin(t * 3) * 0.2);
    // el montículo: tierra oscura con la cara de arriba más clara
    E(c, x, y, 44 * s, 12 * s, C.humus);
    if (o.abierto) {
      // el pozo cavado y la tierra sacada a la derecha
      E(c, x, Y(4), 26 * s, 7 * s, "#140E08");
      pp([-26, 4, -24, 10, 24, 10, 26, 4], C.maderaVieja);
      E(c, X(34), Y(4), 16 * s, 8 * s, "#4A3A26");
      E(c, X(36), Y(8), 10 * s, 5 * s, "#5E4A32");
      // la tapa tirada a la izquierda, boca abajo
      pp([-56, -4, -48, 8, -24, 6, -30, -6], "#8E7858");
      pp([-30, -6, -24, 6, -22, 3, -28, -8], "#6E5A44");
      pp([-40, 0, -38, 6, -35, 5.6, -37, -0.4], C.hierro);
    } else {
      // el arca torcida que asoma: frente, tapa al sol y costado
      pp([-28, 2, -28, 18, 22, 21, 24, 5], C.maderaVieja);
      pp([-28, 2, -28, 18, -4, 19.5, -3, 3.5], "#4E3C2A");
      pp([-28, 18, -18, 28, 32, 31, 22, 21], "#8E7858");
      pp([22, 21, 32, 31, 34, 15, 24, 5], "#6E5A44");
      L(c, X(-28), Y(10), X(23), Y(13), "#3E2E20", 1.2 * s);
      // zuncho y argolla
      pp([-2, 3.4, -2, 19.5, 3, 19.8, 3, 3.8], C.hierro);
      pp([3, 19.8, 13, 29.6, 17, 29.8, 7, 20], C.hierroLuz);
      c.save();
      c.strokeStyle = C.hierroLuz;
      c.lineWidth = 2 * s;
      c.beginPath();
      c.arc(X(0.5), Y(10), 3.6 * s, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }
    // raíces encima
    c.save();
    c.strokeStyle = C.troncoSombra;
    c.lineWidth = 3 * s;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(X(-46), Y(-4));
    c.quadraticCurveTo(X(-30), Y(26), X(-14), Y(16));
    c.moveTo(X(44), Y(-2));
    c.quadraticCurveTo(X(40), Y(12), X(30), Y(10));
    c.stroke();
    c.restore();
    E(c, X(-18), Y(20), 9 * s, 3.5 * s, C.musgoClaro);
    E(c, X(22), Y(2), 9 * s, 3 * s, C.musgo2);
    E(c, X(-34), Y(-4), 7 * s, 2.5 * s, C.musgo2);
  }

  // ---------- Piedra del susurro ----------
  // Menhir alto con una serpiente tallada que da la vuelta (como las piedras de Jelling) y runas dentro de su cuerpo.
  // Dormida late apenas; al tocarla despierta para siempre, cuenta un pedazo de la historia y alumbra el claro.
  function piedraSusurro(c, x, y, t, o) {
    const s = o.s || 1,
      viva = o.viva ? 1 : 0,
      late = viva ? 0.85 + Math.sin(t * 1.8 + (o.sem || 0)) * 0.15 : 0.25 + Math.max(0, Math.sin(t * 1.1 + (o.sem || 0))) * 0.35;
    halo(c, x, y - 60 * s, (viva ? 130 : 60) * s, RUNICO, late);
    sombra(c, x + 8 * s, y + 3, 30 * s, 8 * s);
    // piedra ancha con su forma propia (cinco siluetas distintas, ver formaPiedra)
    const f = ASSETS.formaPiedra(x, y, 37 * s, 120 * s, o.sem),
      W = f.w,
      H = f.h;
    ASSETS.pintarPiedra(c, f, ["#565A62", "#6C7078", "#40444C"]);
    E(c, x - W * 0.7, y - 4 * s, 10 * s, 4 * s, C.musgo2);
    // la serpiente: una cinta en S que baja por la cara
    const col = viva ? RUNICO_CLARO : "#3A3E46";
    c.save();
    c.strokeStyle = viva ? RUNICO : "#34383F";
    c.lineWidth = 7 * s;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(x - W * 0.5, y - H * 0.84);
    c.bezierCurveTo(x + W * 0.95, y - H * 0.78, x + W * 0.8, y - H * 0.52, x, y - H * 0.48);
    c.bezierCurveTo(x - W * 0.85, y - H * 0.44, x - W * 0.85, y - H * 0.2, x + W * 0.55, y - H * 0.1);
    c.stroke();
    c.restore();
    // cabeza de la serpiente
    const hx = x - W * 0.5,
      hy = y - H * 0.84;
    P(c, [hx - 6 * s, hy - 4 * s, hx + 4 * s, hy - 8 * s, hx + 8 * s, hy, hx, hy + 4 * s], viva ? RUNICO : "#34383F");
    R(c, hx, hy - 4 * s, 2 * s, 2 * s, viva ? "#FFFFFF" : "#22252A");
    // runas grandes, cada una en un hueco de la S
    const runas = o.runas || ["ansuz", "laguz", "othala", "eihwaz"];
    const pos = [[0.1, 0.66], [-0.45, 0.62], [0.42, 0.3], [-0.35, 0.22]],
      rh = Math.min(16 * s, H * 0.13);
    alfa(c, 0.4 + late * 0.6, () => runas.forEach((r, i) => F.dibujar(c, r, x + pos[i][0] * W, y - pos[i][1] * H + rh / 2, rh, col, 2 * s)));
    // motas de luz que suben cuando está viva
    if (viva)
      for (let k = 0; k < 5; k++) {
        const u = (t * 0.25 + k / 5 + (o.sem || 0)) % 1;
        alfa(c, Math.sin(u * Math.PI), () => R(c, x + Math.sin(k * 2.3 + t) * 26 * s, y - 40 * s - u * 110 * s, 2.5 * s, 2.5 * s, RUNICO_CLARO));
      }
  }

  // ---------- Altar de runa ----------
  // Losa de piedra sobre cuatro bloques, un círculo grabado y la runa que flota y gira despacio sobre ella.
  // o.runa: kenaz · isa · algiz · sowilo; o.tomada: el altar quedó vacío y humea.
  function altarRuna(c, x, y, t, o) {
    const s = o.s || 1,
      col = COL_RUNA[o.runa] || RUNICO,
      fl = Math.sin(t * 1.6) * 5 * s;
    if (!o.tomada) halo(c, x, y - 70 * s, 120 * s, col, 0.75 + Math.sin(t * 2) * 0.2);
    sombra(c, x + 6 * s, y + 3, 52 * s, 12 * s);
    // escalón circular con runas
    E(c, x, y - 2 * s, 54 * s, 16 * s, "#40444C");
    E(c, x, y - 6 * s, 48 * s, 13 * s, "#565A62");
    alfa(c, o.tomada ? 0.25 : 0.7, () => {
      c.strokeStyle = col;
      c.lineWidth = 1.5 * s;
      c.beginPath();
      c.ellipse(x, y - 6 * s, 40 * s, 10 * s, 0, 0, Math.PI * 2);
      c.stroke();
    });
    // bloques y losa
    [[-26, 1], [18, 1]].forEach(([dx]) => {
      P(c, [x + dx * s, y - 8 * s, x + dx * s, y - 34 * s, x + (dx + 10) * s, y - 34 * s, x + (dx + 10) * s, y - 8 * s], "#4A4E56");
      P(c, [x + (dx + 6) * s, y - 8 * s, x + (dx + 6) * s, y - 34 * s, x + (dx + 10) * s, y - 34 * s, x + (dx + 10) * s, y - 8 * s], "#62666E");
    });
    P(c, [x - 34 * s, y - 34 * s, x - 30 * s, y - 44 * s, x + 34 * s, y - 46 * s, x + 36 * s, y - 36 * s], "#6C7078");
    P(c, [x - 34 * s, y - 34 * s, x + 36 * s, y - 36 * s, x + 36 * s, y - 30 * s, x - 34 * s, y - 28 * s], "#4A4E56");
    if (o.tomada) {
      for (let k = 0; k < 3; k++) {
        const u = (t * 0.3 + k / 3) % 1;
        alfa(c, (1 - u) * 0.4, () => E(c, x + Math.sin(u * 6 + k) * 8 * s, y - 50 * s - u * 60 * s, (6 + u * 10) * s, (4 + u * 6) * s, "#8A8E96"));
      }
      return;
    }
    // la runa flotando, con su cara de canto cuando gira
    const giro = Math.cos(t * 0.9),
      h = 46 * s;
    c.save();
    c.translate(x, y - 64 * s + fl);
    c.scale(Math.max(0.18, Math.abs(giro)), 1);
    F.dibujar(c, o.runa || "isa", 0, h / 2, h, giro > 0 ? col : "#FFF4E8", 6 * s);
    c.restore();
    for (let k = 0; k < 6; k++) {
      const a = t * 1.2 + (k * Math.PI) / 3;
      alfa(c, 0.8, () => R(c, x + Math.cos(a) * 30 * s - 1.5 * s, y - 64 * s + fl + Math.sin(a) * 9 * s, 3 * s, 3 * s, col));
    }
  }

  // ---------- Brasero de Skarnholt ----------
  // Trípode de hierro sobre un anillo de piedras. Apagado: ceniza. Encendido (con Kenaz): fuego que alumbra.
  function brasero(c, x, y, t, o) {
    const s = o.s || 1;
    if (o.encendido) halo(c, x, y - 50 * s, 110 * s, "#FF8D71", 0.85 + Math.sin(t * 9 + x) * 0.1);
    sombra(c, x + 4 * s, y + 2, 26 * s, 7 * s);
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      P(c, poli(x + Math.cos(a) * 20 * s, y + Math.sin(a) * 6 * s, 6 * s, 4 * s, 5, k), k % 2 ? C.roca : C.rocaSombra);
    }
    // patas
    L(c, x - 14 * s, y, x - 4 * s, y - 34 * s, C.hierro, 3 * s);
    L(c, x + 14 * s, y, x + 4 * s, y - 34 * s, C.hierroLuz, 3 * s);
    L(c, x, y + 3 * s, x, y - 34 * s, C.hierro, 3 * s);
    // cuenco
    P(c, [x - 20 * s, y - 40 * s, x + 20 * s, y - 40 * s, x + 14 * s, y - 30 * s, x - 14 * s, y - 30 * s], C.hierro);
    P(c, [x + 4 * s, y - 40 * s, x + 20 * s, y - 40 * s, x + 14 * s, y - 30 * s, x + 4 * s, y - 30 * s], C.hierroLuz);
    E(c, x, y - 40 * s, 20 * s, 4 * s, o.encendido ? "#5E130D" : "#3A3634");
    if (o.encendido) {
      const f = (k, w, h, col) => {
        const v = Math.sin(t * 11 + k * 2.1) * 3 * s;
        P(c, [x - w * s, y - 41 * s, x + v, y - (41 + h) * s, x + w * s, y - 41 * s], col);
      };
      f(0, 16, 34, "#C8402D");
      f(1, 11, 26, "#FF8D71");
      f(2, 6, 16, "#FFD98A");
      for (let k = 0; k < 3; k++) {
        const u = (t * 0.8 + k / 3) % 1;
        alfa(c, 1 - u, () => R(c, x + Math.sin(u * 9 + k) * 10 * s, y - 60 * s - u * 50 * s, 2.5 * s, 2.5 * s, "#FFD98A"));
      }
    } else alfa(c, 0.6, () => F.dibujar(c, "kenaz", x + 1 * s, y - 14 * s, 12 * s, "#6E3A2A", 2 * s));
  }

  // ---------- Salón quemado de Skarnholt ----------
  // Lo que queda de una casa larga: postes carbonizados, dos vigas del techo, un muro de piedra bajo y la ceniza.
  function salonQuemado(c, x, y, t, o) {
    const s = o.s || 1,
      w = 190 * s,
      carbon = "#2A2220",
      carbonL = "#3E322C";
    P(c, poli(x, y - 30 * s, w + 20 * s, 60 * s, 11, 0.3, [1, 0.9, 1.05, 0.95, 1, 0.88, 1.04]), "#3A342A");
    P(c, poli(x + 20 * s, y - 34 * s, w * 0.7, 40 * s, 9, 0.7, [1, 0.85, 1.1, 0.9]), "#443C31");
    // zócalo de piedra
    for (let k = 0; k < 18; k++) {
      const u = k / 17,
        px = x - w + u * w * 2;
      P(c, poli(px, y - 2 * s, 12 * s, 7 * s, 6, k), k % 3 ? C.rocaSombra : C.roca);
    }
    // postes quemados de distinta altura
    [[-170, 110], [-120, 60], [-60, 140], [0, 40], [60, 128], [120, 70], [170, 100]].forEach(([dx, h], k) => {
      P(c, [x + (dx - 6) * s, y - 4 * s, x + (dx - 5) * s, y - h * s, x + (dx + 2) * s, y - (h + 8) * s, x + (dx + 6) * s, y - 4 * s], k % 2 ? carbon : carbonL);
      R(c, x + (dx + 1) * s, y - h * s, 3 * s, h * 0.6 * s, "#5E130D");
    });
    // vigas del techo caídas en diagonal
    P(c, [x - 64 * s, y - 136 * s, x - 56 * s, y - 142 * s, x + 64 * s, y - 120 * s, x + 58 * s, y - 112 * s], carbonL);
    P(c, [x + 60 * s, y - 126 * s, x + 66 * s, y - 120 * s, x + 130 * s, y - 20 * s, x + 120 * s, y - 18 * s], carbon);
    // un escudo partido contra el poste
    E(c, x - 112 * s, y - 24 * s, 16 * s, 18 * s, "#5E130D");
    P(c, [x - 112 * s, y - 42 * s, x - 96 * s, y - 24 * s, x - 112 * s, y - 6 * s], "#9C2315");
    E(c, x - 112 * s, y - 24 * s, 4 * s, 4 * s, C.hierroLuz);
  }

  // ---------- Entrada del túmulo ----------
  // Un montículo de pasto con un dolmen: dos jambas, un dintel con runas de muerte y la boca negra.
  function tumuloEntrada(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 10 * s, y + 4, 170 * s, 30 * s, 0.45);
    P(c, [x - 170 * s, y, x - 130 * s, y - 70 * s, x - 40 * s, y - 120 * s, x + 60 * s, y - 118 * s, x + 140 * s, y - 70 * s, x + 170 * s, y], C.pastoSombra);
    P(c, [x - 40 * s, y - 120 * s, x + 60 * s, y - 118 * s, x + 140 * s, y - 70 * s, x + 170 * s, y, x + 30 * s, y], C.pasto);
    P(c, [x - 130 * s, y - 70 * s, x - 40 * s, y - 120 * s, x - 20 * s, y - 100 * s, x - 100 * s, y - 60 * s], "#3A4620");
    // boca
    P(c, [x - 30 * s, y, x - 28 * s, y - 64 * s, x + 28 * s, y - 64 * s, x + 30 * s, y], "#08090A");
    // jambas y dintel
    P(c, [x - 46 * s, y, x - 44 * s, y - 70 * s, x - 28 * s, y - 70 * s, x - 30 * s, y], "#4A4E56");
    P(c, [x + 30 * s, y, x + 28 * s, y - 70 * s, x + 46 * s, y - 70 * s, x + 46 * s, y], "#62666E");
    P(c, [x - 54 * s, y - 68 * s, x - 50 * s, y - 88 * s, x + 54 * s, y - 90 * s, x + 56 * s, y - 70 * s], "#6C7078");
    ["hagalaz", "perthro", "isa", "eihwaz", "hagalaz"].forEach((r, i) => F.dibujar(c, r, x - 36 * s + i * 18 * s, y - 72 * s, 12 * s, o.vivo ? VIOLETA : "#3A3E46", 2 * s));
    // calaveras al pie
    [[-58, 0], [52, 2]].forEach(([dx, dy]) => {
      E(c, x + dx * s, y - 6 * s + dy, 7 * s, 6 * s, C.hueso);
      R(c, x + (dx - 3) * s, y - 7 * s + dy, 2 * s, 2 * s, "#1A1410");
      R(c, x + (dx + 1) * s, y - 7 * s + dy, 2 * s, 2 * s, "#1A1410");
    });
    // ojos que miran desde la oscuridad (solo de noche o si está vivo)
    if (o.vivo) {
      const g = Math.max(0, Math.sin(t * 0.7)) ** 3;
      alfa(c, g, () => {
        R(c, x - 8 * s, y - 34 * s, 4 * s, 2 * s, "#8CF0B4");
        R(c, x + 4 * s, y - 34 * s, 4 * s, 2 * s, "#8CF0B4");
      });
    }
  }

  // ---------- Torre del Cuervo ----------
  // Torre de piedra en ruinas con almenas rotas, un estandarte negro con el cuervo rojo y cuervos posados.
  function torreCuervo(c, x, y, t, o) {
    const s = o.s || 1,
      w = 56 * s,
      h = 290 * s;
    sombra(c, x + 16 * s, y + 4, 90 * s, 22 * s, 0.45);
    P(c, [x - w, y, x - w + 6 * s, y - h, x + w - 6 * s, y - h, x + w, y], "#5A5C60");
    P(c, [x + 10 * s, y, x + 12 * s, y - h, x + w - 6 * s, y - h, x + w, y], "#707276");
    P(c, [x - w, y, x - w + 6 * s, y - h, x - w + 18 * s, y - h, x - w + 14 * s, y], "#45474B");
    // hileras de piedra
    for (let k = 1; k < 12; k++) L(c, x - w + 4 * s, y - k * 24 * s, x + w - 4 * s, y - k * 24 * s, "#4A4C50", 1.5 * s);
    // grieta y puerta
    P(c, [x - 16 * s, y, x - 16 * s, y - 52 * s, x, y - 64 * s, x + 16 * s, y - 52 * s, x + 16 * s, y], "#141210");
    L(c, x + 26 * s, y - 120 * s, x + 14 * s, y - 170 * s, "#2C2C30", 2 * s);
    L(c, x + 14 * s, y - 170 * s, x + 30 * s, y - 210 * s, "#2C2C30", 2 * s);
    R(c, x - 6 * s, y - 180 * s, 12 * s, 24 * s, "#141210");
    // almenas rotas
    [[-w + 6, 26], [-20, 16], [12, 30], [w - 18, 10]].forEach(([dx, hh], k) => P(c, [x + dx * s, y - h, x + dx * s, y - h - hh * s, x + (dx + 14) * s, y - h - (hh - 4) * s, x + (dx + 14) * s, y - h], k % 2 ? "#707276" : "#5A5C60"));
    // estandarte
    const v = Math.sin(t * 2.4) * 6 * s;
    L(c, x - 30 * s, y - h - 20 * s, x - 30 * s, y - h - 110 * s, C.maderaSombra, 3 * s);
    P(c, [x - 30 * s, y - h - 108 * s, x + 30 * s + v, y - h - 102 * s, x + 26 * s + v, y - h - 70 * s, x - 30 * s, y - h - 64 * s], "#111111");
    // el cuervo rojo
    P(c, [x - 16 * s, y - h - 84 * s, x - 4 * s, y - h - 94 * s, x + 6 * s, y - h - 90 * s, x + 18 * s + v * 0.6, y - h - 96 * s, x + 8 * s, y - h - 82 * s, x - 6 * s, y - h - 78 * s], "#9C2315");
    // cuervos posados en las almenas
    [[-w + 12, -h - 26], [w - 12, -h - 10]].forEach(([dx, dy], k) => {
      const cab = Math.sin(t * 1.5 + k * 3) > 0.6 ? 2 : 0;
      P(c, [x + (dx - 8) * s, y + dy * s, x + dx * s, y + (dy - 12) * s, x + (dx + 8) * s, y + dy * s], "#111111");
      E(c, x + (dx + 4) * s, y + (dy - 14 - cab) * s, 5 * s, 4 * s, "#111111");
      P(c, [x + (dx + 8) * s, y + (dy - 14 - cab) * s, x + (dx + 13) * s, y + (dy - 13 - cab) * s, x + (dx + 8) * s, y + (dy - 12 - cab) * s], "#3A3634");
    });
  }

  // ---------- Carro de la caravana ----------
  // Un carro de toldo rojo abandonado en el camino, con la lona rota, una rueda suelta y cajas reventadas.
  function carroCaravana(c, x, y, t, o) {
    const s = o.s || 1,
      v = o.v || 0;
    sombra(c, x + 6 * s, y + 2, 80 * s, 14 * s);
    P(c, [x - 70 * s, y - 20 * s, x - 70 * s, y - 40 * s, x + 64 * s, y - 40 * s, x + 64 * s, y - 20 * s], C.madera);
    P(c, [x - 70 * s, y - 20 * s, x - 70 * s, y - 40 * s, x - 54 * s, y - 40 * s, x - 54 * s, y - 20 * s], C.maderaSombra);
    // toldo con aros
    const tela = v % 2 ? "#E0B2B2" : "#9C2315",
      telaS = v % 2 ? "#B88A8A" : "#5E130D";
    P(c, [x - 66 * s, y - 40 * s, x - 60 * s, y - 92 * s, x - 30 * s, y - 112 * s, x + 30 * s, y - 112 * s, x + 58 * s, y - 92 * s, x + 62 * s, y - 40 * s], tela);
    P(c, [x - 66 * s, y - 40 * s, x - 60 * s, y - 92 * s, x - 30 * s, y - 112 * s, x - 34 * s, y - 40 * s], telaS);
    // rotura
    P(c, [x + 10 * s, y - 100 * s, x + 26 * s, y - 92 * s, x + 18 * s, y - 70 * s, x + 30 * s, y - 56 * s, x + 6 * s, y - 64 * s], "#1A1410");
    [-40, 0, 40].forEach((dx) => L(c, x + dx * s, y - 40 * s, x + dx * 0.8 * s, y - 110 * s, C.maderaSombra, 2 * s));
    // ruedas
    [[-48, 1], [44, 0]].forEach(([dx, sana]) => {
      E(c, x + dx * s, y - 14 * s, 16 * s, 16 * s, C.maderaSombra);
      E(c, x + dx * s, y - 14 * s, 10 * s, 10 * s, sana ? C.madera : "#1A1410");
      E(c, x + dx * s, y - 14 * s, 3 * s, 3 * s, C.hierro);
    });
    E(c, x + 88 * s, y - 2 * s, 18 * s, 6 * s, C.maderaSombra);
    // cajas reventadas
    P(c, [x - 104 * s, y, x - 104 * s, y - 22 * s, x - 80 * s, y - 22 * s, x - 80 * s, y], C.maderaVieja);
    P(c, [x - 100 * s, y - 22 * s, x - 84 * s, y - 34 * s, x - 78 * s, y - 24 * s], C.madera);
    E(c, x - 72 * s, y + 2 * s, 6 * s, 3 * s, "#C8A040");
  }

  // ---------- Tótem de campamento ----------
  // Una estaca con el trofeo de cada familia de criaturas: la marca de que ahí hay un grupo. o.tipo: draugr · jabali ·
  // cuervo · fatuo · trol · lobo.
  function totemCampamento(c, x, y, t, o) {
    const s = o.s || 1,
      tipo = o.tipo || "draugr";
    sombra(c, x + 3 * s, y + 2, 18 * s, 5 * s);
    P(c, [x - 4 * s, y, x - 3 * s, y - 90 * s, x + 3 * s, y - 94 * s, x + 4 * s, y], C.maderaSombra);
    R(c, x, y - 92 * s, 2 * s, 90 * s, C.madera);
    if (tipo === "draugr" || tipo === "errante") {
      E(c, x, y - 60 * s, 18 * s, 18 * s, "#46604A");
      E(c, x, y - 60 * s, 5 * s, 5 * s, C.hierroLuz);
      P(c, [x - 12 * s, y - 92 * s, x - 10 * s, y - 108 * s, x, y - 114 * s, x + 10 * s, y - 108 * s, x + 12 * s, y - 92 * s], "#5A4A30");
      R(c, x - 1.5 * s, y - 104 * s, 3 * s, 14 * s, "#3A3020");
    } else if (tipo === "jabali") {
      P(c, [x - 16 * s, y - 80 * s, x + 16 * s, y - 80 * s, x + 10 * s, y - 104 * s, x - 10 * s, y - 104 * s], C.hueso);
      P(c, [x - 16 * s, y - 84 * s, x - 26 * s, y - 100 * s, x - 14 * s, y - 92 * s], "#FFF4E0");
      P(c, [x + 16 * s, y - 84 * s, x + 26 * s, y - 100 * s, x + 14 * s, y - 92 * s], "#FFF4E0");
      R(c, x - 7 * s, y - 96 * s, 3 * s, 3 * s, "#1A1410");
      R(c, x + 4 * s, y - 96 * s, 3 * s, 3 * s, "#1A1410");
    } else if (tipo === "cuervo") {
      for (let k = 0; k < 4; k++) P(c, [x, y - 70 * s - k * 6 * s, x - 22 * s + k * 3 * s, y - 50 * s - k * 8 * s, x - 2 * s, y - 66 * s - k * 6 * s], "#111111");
      E(c, x, y - 100 * s, 7 * s, 6 * s, C.hueso);
      P(c, [x + 4 * s, y - 100 * s, x + 16 * s, y - 98 * s, x + 4 * s, y - 96 * s], C.hueso);
    } else if (tipo === "fatuo") {
      L(c, x, y - 90 * s, x + 18 * s, y - 96 * s, C.maderaSombra, 2 * s);
      L(c, x + 18 * s, y - 96 * s, x + 18 * s, y - 84 * s, C.hierro, 1.5 * s);
      halo(c, x + 18 * s, y - 76 * s, 30 * s, "#8CF0B4", 0.8 + Math.sin(t * 4) * 0.2);
      E(c, x + 18 * s, y - 76 * s, 6 * s, 7 * s, "#8CF0B4");
    } else if (tipo === "trol") {
      P(c, poli(x, y - 100 * s, 18 * s, 14 * s, 6, 0.4), C.roca);
      P(c, poli(x + 4 * s, y - 104 * s, 10 * s, 8 * s, 5, 0.1), C.rocaLuz);
      L(c, x - 18 * s, y - 70 * s, x + 18 * s, y - 70 * s, "#E0B2B2", 3 * s);
    } else {
      P(c, [x - 14 * s, y - 92 * s, x + 14 * s, y - 92 * s, x + 6 * s, y - 112 * s, x - 6 * s, y - 112 * s], "#4A4A50");
      P(c, [x - 14 * s, y - 92 * s, x - 18 * s, y - 104 * s, x - 6 * s, y - 106 * s], "#36363C");
      R(c, x - 5 * s, y - 102 * s, 3 * s, 2 * s, "#E0392E");
      R(c, x + 3 * s, y - 102 * s, 3 * s, 2 * s, "#E0392E");
    }
    // tiras rojas atadas
    const v = Math.sin(t * 3 + x) * 3 * s;
    P(c, [x + 3 * s, y - 40 * s, x + 14 * s + v, y - 30 * s, x + 10 * s + v, y - 26 * s, x + 3 * s, y - 34 * s], "#9C2315");
  }

  // ---------- Manzano de Iðunn ----------
  // Un árbol joven de hojas claras con manzanas doradas: una por partida, da vida para siempre.
  function manzanoIdunn(c, x, y, t, o) {
    const s = o.s || 1;
    halo(c, x, y - 80 * s, 90 * s, "#FFD98A", o.cosechado ? 0.2 : 0.6);
    sombra(c, x + 6 * s, y + 2, 34 * s, 8 * s);
    P(c, [x - 5 * s, y, x - 3 * s, y - 60 * s, x + 3 * s, y - 60 * s, x + 6 * s, y], C.corteza);
    const hojas = ["#7E9A3E", "#94B04C", "#AAC45C"];
    [[-24, -84, 30], [20, -90, 28], [0, -108, 30]].forEach(([dx, dy, r], k) => P(c, poli(x + dx * s, y + dy * s, r * s, r * 0.8 * s, 7, k), hojas[k]));
    if (!o.cosechado)
      [[-20, -76], [14, -84], [0, -100], [26, -98]].forEach(([dx, dy], k) => {
        E(c, x + dx * s, y + dy * s, 6 * s, 6 * s, k ? "#F5A524" : "#FFD98A");
        R(c, x + (dx + 2) * s, y + (dy - 3) * s, 2 * s, 2 * s, "#FFF4D0");
      });
  }

  // ======================================================================
  //  ARMADOS CON CARAS (todo girable, comun/volumen.js)
  // ======================================================================
  const T = C.T,
    menhir = (...a) => ASSETS.KIT.menhirV(...a);
  // el arcón del leñador: el cuerpo de roble con zunchos y esquineros, la tapa abombada con Fehu en la cerradura y el
  // asa de soga; abierto, la tapa parada atrás y la paja del fondo
  function arconLenadorV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      zunchos = (cc, l, h) => {
        R(cc, 0, -h / 2 - 0.7, l, 1.4, C.maderaSombra);
        [8, l - 22].forEach((u) => R(cc, u, -h, 4, h, C.hierro));
        R(cc, 0, -6, 6, 6, C.hierro);
        R(cc, l - 6, -6, 6, 6, C.hierro);
      };
    VOL.sombra(c, pr, 4, 0, 38, 20);
    VOL.caja(c, pr, -30, -14, 0, 30, 14, 24, T.madera, {
      frente: (cc, l, h) => {
        zunchos(cc, l, h);
        if (!o.abierto) {
          R(cc, l / 2 - 6, -h + 2, 12, 13, C.hierro);
          R(cc, l / 2 - 6, -h + 2, 12, 2, C.hierroLuz);
          F.dibujar(cc, "fehu", l / 2, -5, 9, C.ambar, 1.5);
        }
      },
      atras: zunchos,
      der: (cc, l, h) => {
        cc.strokeStyle = "#B08A58";
        cc.lineWidth = 2.4;
        cc.beginPath();
        cc.moveTo(l * 0.25, -h * 0.7);
        cc.quadraticCurveTo(l * 0.5, -h * 0.2, l * 0.75, -h * 0.7);
        cc.stroke();
      },
      izq: (cc, l, h) => R(cc, 0, -h / 2 - 0.7, l, 1.4, C.maderaSombra),
      tapa: o.abierto ? "#1E140C" : null,
    });
    if (o.abierto) {
      VOL.enPiso(c, pr, (cc) => {
        R(cc, -26, -12, 52, 24, "#6E5A30");
        [-14, -4, 6].forEach((u, k) => L(cc, u, -4 + k * 3, u + 7, -2 + k * 3, "#B08A58", 1.2));
      }, 22);
      const p2 = VOL.sub(pr, 0, -14, 24, 0);
      VOL.caja(c, p2, -30, -6, 0, 30, 0, 26, T.madera, { frente: (cc, l, h) => [8, l - 22].forEach((u) => R(cc, u, -h, 4, h, C.hierro)) });
      return;
    }
    VOL.boveda(c, pr, -30, 30, -14, 14, 24, 12, T.madera, { punta: C.madera });
    [-20, 10].forEach((u) => VOL.boveda(c, pr, u, u + 4, -14.5, 14.5, 24, 12.5, T.hierro, { sinPuntas: false }));
  }
  // el cofre rúnico: piedra azul oscura, la banda de runas, herrajes negros; sellado con la cadena violeta y Naudiz;
  // abierto, la tapa parada y la luz que sube
  function cofreRunicoV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      late = 0.7 + Math.sin(t * 2.2 + (o.sem || 0)) * 0.3,
      PI = ["#232C3A", "#2E3A4C", "#3E4E66"],
      banda = (cc, l, h) => {
        R(cc, 0, -h + 10, l, 8, "#1A202A");
        ["ansuz", "raidho", "kenaz", "gebo", "wunjo"].forEach((r, i) => alfa(cc, o.sellado ? 0.35 : 0.9, () => F.dibujar(cc, r, l * (0.12 + i * 0.19), -h + 17, 6, RUNICO, 1.2)));
      };
    VOL.halo(c, pr, 0, 0, o.abierto ? 40 : 30, o.abierto ? 50 : 60, !o.abierto && o.sellado ? VIOLETA : RUNICO, o.abierto ? 0.5 : late * 0.8);
    VOL.sombra(c, pr, 4, 0, 40, 22);
    VOL.caja(c, pr, -32, -15, 0, 32, 15, 30, PI, {
      frente: (cc, l, h) => {
        banda(cc, l, h);
        if (o.sellado && !o.abierto) {
          cc.strokeStyle = "#6B4FA0";
          cc.lineWidth = 3;
          cc.setLineDash([5, 3]);
          cc.beginPath();
          cc.moveTo(2, -h + 2);
          cc.lineTo(l - 2, -2);
          cc.moveTo(l - 2, -h + 2);
          cc.lineTo(2, -2);
          cc.stroke();
          cc.setLineDash([]);
          R(cc, l / 2 - 8, -h + 2, 16, 18, "#2A2238");
          alfa(cc, late, () => F.dibujar(cc, "naudiz", l / 2, -h + 17, 12, VIOLETA, 2));
        } else if (!o.abierto) {
          R(cc, l / 2 - 5, -h + 2, 10, 12, C.hierroLuz);
          F.dibujar(cc, "dagaz", l / 2, -h + 12, 8, RUNICO_CLARO, 1.4);
        }
      },
      atras: banda,
      tapa: o.abierto ? "#0C1018" : null,
    });
    if (o.abierto) {
      const p2 = VOL.sub(pr, 0, -15, 30);
      VOL.caja(c, p2, -32, -6, 0, 32, 0, 24, PI, { frente: (cc, l, h) => F.dibujar(cc, "dagaz", l / 2, -h / 2 + 6, 12, RUNICO_CLARO, 1.6) });
      const q = pr(0, 0, 32);
      alfa(c, 0.5, () => P(c, [q[0] - 26 * pr.s, q[1], q[0] + 26 * pr.s, q[1], q[0] + 18 * pr.s, q[1] - 38 * pr.s, q[0] - 14 * pr.s, q[1] - 38 * pr.s], RUNICO));
      return;
    }
    VOL.caja(c, pr, -32.5, -15.5, 28, 32.5, 15.5, 32, T.hierro);
    VOL.boveda(c, pr, -32, 32, -15, 15, 32, 14, ["#2A3446", "#36445A", "#4A5C78"]);
  }
  // la urna del túmulo: bronce verdoso facetado, las dos cabezas de dragón como asas, la tapa con monedas que asoman
  function urnaTumuloV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      BR = ["#46604A", "#5E7A5A", "#7E9A6E"],
      oro = "#FFD98A";
    VOL.sombra(c, pr, 4, 0, 36, 22);
    const S = VOL.escena(pr);
    [-1, 1].forEach((k) =>
      S.poner(k * 30, 0, () => {
        VOL.piramide(c, pr, [[k * 28, -5], [k * 28, 5], [k * 34, 0]], 14, k * 46, 0, 34, BR);
        const q = pr(k * 42, 0, 30);
        R(c, q[0] - 1.5 * pr.s, q[1] - 1 * pr.s, 3 * pr.s, 2 * pr.s, oro);
      }, 20),
    );
    S.poner(0, 0, () => {
      VOL.cono(c, pr, 0, 0, 28, 32, 0, 24, BR, { n: 10, sinTapa: true });
      if (o.abierto) {
        VOL.elipse(c, pr, 0, 0, 24, 30, 16, "#1A1410");
        VOL.cilindro(c, VOL.sub(pr, -40, 18, 0, 0.6), 0, 0, 24, 0, 5, BR, { n: 10, rw: 14 });
        return;
      }
      VOL.cono(c, pr, 0, 0, 32, 22, 24, 30, BR, { n: 10, tapa: BR[1] });
      for (let k = 0; k < 5; k++) VOL.elipse(c, pr, -14 + k * 7, (k % 2) * 3, 30.5, 3.5, 3.5, oro);
      const g = 0.5 + Math.sin(t * 3 + x) * 0.5,
        q = pr(6, 0, 36);
      alfa(c, g, () => R(c, q[0], q[1] - 3 * pr.s, 2 * pr.s, 6 * pr.s, "#FFF4D0"));
    });
    S.dibujar();
  }
  // el arca enterrada: el montículo, el arca torcida medio hundida con su zuncho y argolla, las raíces y el musgo;
  // oculta, apenas un destello; abierta, el pozo, la tierra sacada y la tapa tirada boca abajo
  function arcaEnterradaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    if (o.oculto) {
      const g = Math.max(0, Math.sin(t * 1.3 + (o.sem || 0) * 3)) ** 8,
        q = pr(0, 0, 6),
        s = pr.s;
      alfa(c, g, () => P(c, [q[0], q[1] - 10 * s, q[0] + 2 * s, q[1] - 4 * s, q[0] + 8 * s, q[1] - 2 * s, q[0] + 2 * s, q[1], q[0], q[1] + 6 * s, q[0] - 2 * s, q[1], q[0] - 8 * s, q[1] - 2 * s, q[0] - 2 * s, q[1] - 4 * s], "#FFF4D0"));
      return;
    }
    if (!o.abierto) VOL.halo(c, pr, 0, 0, 16, 46, C.ambar, 0.5 + Math.sin(t * 3) * 0.2);
    VOL.cono(c, pr, 0, 0, 46, 30, 0, 6, ["#2E2418", C.humus, "#4A3A26"], { n: 10 });
    if (o.abierto) {
      VOL.elipse(c, pr, 0, 0, 6.2, 26, 16, "#140E08");
      VOL.cono(c, pr, 36, 6, 18, 8, 0, 12, ["#3A2E1E", "#4A3A26", "#5E4A32"], { n: 7 });
      const p2 = VOL.sub(pr, -40, 4, 0, 0.4);
      VOL.caja(c, p2, -14, -10, 0, 14, 10, 4, ["#5E4A36", "#6E5A44", "#8E7858"]);
      VOL.caja(c, p2, -3, -10.5, 0, 0, 10.5, 4.5, T.hierro);
    } else {
      const p2 = VOL.sub(pr, 0, 0, 0, 0.12);
      VOL.caja(c, p2, -26, -12, 2, 26, 12, 20, ["#4E3C2A", C.maderaVieja, "#8E7858"], {
        frente: (cc, l, h) => {
          L(cc, 0, -h / 2, l, -h / 2, "#3E2E20", 1.2);
          R(cc, l / 2 - 2, -h, 5, h, C.hierro);
          cc.strokeStyle = C.hierroLuz;
          cc.lineWidth = 2;
          cc.beginPath();
          cc.arc(l / 2 + 0.5, -h / 2, 3.6, 0, Math.PI * 2);
          cc.stroke();
        },
        tapa: "#8E7858",
      });
      VOL.caja(c, p2, -2.5, -12.5, 2, 2.5, 12.5, 20.5, T.hierro, { sin: ["frente"] });
    }
    VOL.palo(c, pr, -46, 4, 0, -30, 6, 18, 3, C.troncoSombra);
    VOL.palo(c, pr, -30, 6, 18, -14, 4, 20, 3, C.troncoSombra);
    VOL.palo(c, pr, 44, -2, 0, 30, -4, 12, 3, C.troncoSombra);
    VOL.elipse(c, pr, -18, 0, 20.5, 9, 6, C.musgoClaro);
    VOL.elipse(c, pr, 22, 10, 4, 9, 5, C.musgo2);
    VOL.elipse(c, pr, -34, 14, 2, 7, 4, C.musgo2);
  }
  // la piedra del susurro: el menhir ancho con la serpiente tallada que baja en S y las runas en sus huecos (adelante),
  // la espalda lisa con musgo, el halo y las motas cuando está viva
  function piedraSusurroV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      viva = o.viva ? 1 : 0,
      late = viva ? 0.85 + Math.sin(t * 1.8 + (o.sem || 0)) * 0.15 : 0.25 + Math.max(0, Math.sin(t * 1.1 + (o.sem || 0))) * 0.35,
      runas = o.runas || ["ansuz", "laguz", "othala", "eihwaz"];
    VOL.halo(c, pr, 0, 0, 60, viva ? 130 : 60, RUNICO, late);
    VOL.sombra(c, pr, 8, 0, 34, 22);
    menhir(c, pr, 37, 18, 124, ["#40444C", "#565A62", "#6C7078"], (cc, W, H) => {
      const col = viva ? RUNICO_CLARO : "#3A3E46",
        x0 = W / 2,
        w = W / 2;
      cc.strokeStyle = viva ? RUNICO : "#34383F";
      cc.lineWidth = 7;
      cc.lineCap = "round";
      cc.beginPath();
      cc.moveTo(x0 - w * 0.5, -H * 0.84);
      cc.bezierCurveTo(x0 + w * 0.95, -H * 0.78, x0 + w * 0.8, -H * 0.52, x0, -H * 0.48);
      cc.bezierCurveTo(x0 - w * 0.85, -H * 0.44, x0 - w * 0.85, -H * 0.2, x0 + w * 0.55, -H * 0.1);
      cc.stroke();
      const hx = x0 - w * 0.5,
        hy = -H * 0.84;
      P(cc, [hx - 6, hy - 4, hx + 4, hy - 8, hx + 8, hy, hx, hy + 4], viva ? RUNICO : "#34383F");
      R(cc, hx, hy - 4, 2, 2, viva ? "#FFFFFF" : "#22252A");
      const pos = [[0.1, 0.66], [-0.45, 0.62], [0.42, 0.3], [-0.35, 0.22]],
        rh = Math.min(16, H * 0.13);
      alfa(cc, 0.4 + late * 0.6, () => runas.forEach((r, i) => F.dibujar(cc, r, x0 + pos[i][0] * w, -pos[i][1] * H + rh / 2, rh, col, 2)));
      E(cc, x0 - w * 0.7, -4, 10, 4, C.musgo2);
    });
    if (viva) {
      const q = pr(0, 0, 40),
        s = pr.s;
      for (let k = 0; k < 5; k++) {
        const u = (t * 0.25 + k / 5 + (o.sem || 0)) % 1;
        alfa(c, Math.sin(u * Math.PI), () => R(c, q[0] + Math.sin(k * 2.3 + t) * 26 * s, q[1] - u * 110 * s, 2.5 * s, 2.5 * s, RUNICO_CLARO));
      }
    }
  }
  // el altar de runa: el escalón redondo con el círculo grabado, los dos bloques, la losa y la runa que flota y gira
  // (o el humo, si ya se la llevaron)
  function altarRunaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      col = COL_RUNA[o.runa] || RUNICO,
      fl = Math.sin(t * 1.6) * 5,
      PG = ["#40444C", "#565A62", "#6C7078"];
    if (!o.tomada) VOL.halo(c, pr, 0, 0, 70, 120, col, 0.75 + Math.sin(t * 2) * 0.2);
    VOL.sombra(c, pr, 6, 0, 56, 30);
    VOL.cilindro(c, pr, 0, 0, 44, 0, 6, PG, { n: 14, tapa: "#565A62" });
    VOL.enPiso(c, pr, (cc) =>
      alfa(cc, o.tomada ? 0.25 : 0.7, () => {
        cc.strokeStyle = col;
        cc.lineWidth = 1.5;
        cc.beginPath();
        cc.ellipse(0, 0, 36, 36, 0, 0, TAU);
        cc.stroke();
      }),
    6.5);
    [-22, 22].forEach((u) => VOL.cubo(c, pr, u, 0, 10, 16, 28, ["#3E4248", "#4A4E56", "#62666E"], null, 6));
    VOL.caja(c, pr, -35, -14, 34, 35, 14, 42, ["#4A4E56", "#5E626A", "#6C7078"]);
    if (o.tomada) {
      const q = pr(0, 0, 46),
        s = pr.s;
      for (let k = 0; k < 3; k++) {
        const u = (t * 0.3 + k / 3) % 1;
        alfa(c, (1 - u) * 0.4, () => E(c, q[0] + Math.sin(u * 6 + k) * 8 * s, q[1] - 4 * s - u * 60 * s, (6 + u * 10) * s, (4 + u * 6) * s, "#8A8E96"));
      }
      return;
    }
    const q = pr(0, 0, 64 + fl),
      s = pr.s,
      giro = Math.cos(t * 0.9),
      h = 46 * s;
    c.save();
    c.translate(q[0], q[1]);
    c.scale(Math.max(0.18, Math.abs(giro)), 1);
    F.dibujar(c, o.runa || "isa", 0, h / 2, h, giro > 0 ? col : "#FFF4E8", 6 * s);
    c.restore();
    for (let k = 0; k < 6; k++) {
      const a = t * 1.2 + (k * Math.PI) / 3,
        m = pr(Math.cos(a) * 30, Math.sin(a) * 30, 64 + fl);
      alfa(c, 0.8, () => R(c, m[0] - 1.5 * s, m[1] - 1.5 * s, 3 * s, 3 * s, col));
    }
  }
  // el salón quemado: la ceniza en el piso, el zócalo de piedra, los postes carbonizados con brasas, las dos vigas
  // caídas y el escudo partido contra un poste
  function salonQuemadoV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      w = 190,
      CB = ["#1E1816", "#2A2220", "#3E322C"],
      r = azar(42);
    VOL.enPiso(c, pr, (cc) => {
      P(cc, poli(0, 0, w + 20, 70, 11, 0.3, [1, 0.9, 1.05, 0.95, 1, 0.88, 1.04]), "#3A342A");
      P(cc, poli(20, -4, w * 0.7, 46, 9, 0.7, [1, 0.85, 1.1, 0.9]), "#443C31");
    });
    const S = VOL.escena(pr);
    for (let k = 0; k < 18; k++) {
      const u = -w + (k / 17) * w * 2;
      S.poner(u, -40, () => VOL.prisma(c, pr, VOL.redonda(u, -40, 10, 6, k), 0, 10, k % 3 ? T.roca : [C.rocaSombra, C.rocaSombra, C.roca]));
      if (k % 3 === 0) S.poner(u, 40, () => VOL.prisma(c, pr, VOL.redonda(u + r() * 8, 40, 9, 6, k), 0, 8, T.roca));
    }
    [[-170, 110], [-120, 60], [-60, 140], [0, 40], [60, 128], [120, 70], [170, 100]].forEach(([u, h], k) => {
      const ww = k % 2 ? 38 : -38;
      S.poner(u, ww, () => {
        VOL.cubo(c, pr, u, ww, 11, 11, h, CB, { frente: (cc, l, hh) => R(cc, l / 2 - 1.5, -hh, 3, hh * 0.6, "#5E130D") });
        VOL.piramide(c, pr, [[u - 6, ww - 6], [u + 6, ww - 6], [u + 6, ww + 6], [u - 6, ww + 6]], h, u + 2, ww, h + 8, CB);
      });
    });
    S.poner(0, -38, () => VOL.rollo(c, VOL.sub(pr, 0, -38, 0), -64, 64, 0, 130, 5, CB, { n: 5 }), 130);
    S.poner(95, 38, () => VOL.palo(c, pr, 60, 38, 128, 130, 30, 0, 10, CB[1]), 60);
    S.poner(-112, 46, () => {
      const p2 = VOL.sub(pr, -112, 46, 0, 0.2);
      VOL.plano(c, p2, -16, 16, 0, 6, 42, null, (cc, l, h) => {
        E(cc, l / 2, -h / 2, 16, 18, "#5E130D");
        P(cc, [l / 2, -h / 2 - 18, l / 2 + 16, -h / 2, l / 2, -h / 2 + 18], "#9C2315");
        E(cc, l / 2, -h / 2, 4, 4, C.hierroLuz);
      });
    });
    S.dibujar();
  }
  // la entrada del túmulo: el montículo de pasto y, adelante, el dolmen: las jambas, el dintel con las runas de muerte,
  // la boca negra, las calaveras y los ojos que miran
  function tumuloEntradaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 10, 0, 180, 120, 0.45);
    const S = VOL.escena(pr);
    S.poner(0, 0, () => {
      VOL.cono(c, pr, 0, -20, 170, 90, 0, 80, [C.pastoSombra, C.pasto, "#6A7A34"], { n: 12, sinTapa: true });
      VOL.cono(c, pr, 0, -20, 90, 30, 80, 120, [C.pastoSombra, C.pasto, "#6A7A34"], { n: 12, tapa: C.pasto });
    });
    S.poner(0, 150, () => {
      VOL.cubo(c, pr, -38, 140, 16, 20, 70, ["#3E4248", "#4A4E56", "#62666E"]);
      VOL.cubo(c, pr, 38, 140, 16, 20, 70, ["#3E4248", "#4A4E56", "#62666E"]);
      VOL.plano(c, pr, -30, 30, 140, 0, 66, "#08090A");
      VOL.caja(c, pr, -54, 128, 68, 54, 152, 90, ["#4A4E56", "#5E626A", "#6C7078"], {
        frente: (cc, l, h) => ["hagalaz", "perthro", "isa", "eihwaz", "hagalaz"].forEach((r, i) => F.dibujar(cc, r, 18 + i * 18, -2, 12, o.vivo ? VIOLETA : "#3A3E46", 2)),
      });
      if (o.vivo) {
        const g = Math.max(0, Math.sin(t * 0.7)) ** 3,
          a = pr(-6, 141, 34),
          b = pr(6, 141, 34),
          s = pr.s;
        alfa(c, g, () => {
          R(c, a[0] - 2 * s, a[1], 4 * s, 2 * s, "#8CF0B4");
          R(c, b[0] - 2 * s, b[1], 4 * s, 2 * s, "#8CF0B4");
        });
      }
    });
    [[-58, 160], [52, 162]].forEach(([u, w]) =>
      S.poner(u, w, () => {
        VOL.cilindro(c, pr, u, w, 7, 0, 10, ["#B8AC94", C.hueso, "#F2ECEC"], { n: 7 });
        VOL.plano(c, pr, u - 5, u + 5, w + 7, 2, 9, null, (cc, l, h) => {
          R(cc, 1, -h + 2, 2, 2, "#1A1410");
          R(cc, l - 3, -h + 2, 2, 2, "#1A1410");
        }, () => {});
      }),
    );
    S.dibujar();
  }
  // la torre del cuervo: la torre de piedra con sus hileras, la puerta, la ventana y la grieta, las almenas rotas,
  // el estandarte negro con el cuervo rojo y los cuervos posados
  function torreCuervoV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      w = 56,
      h = 290,
      hileras = (puerta) => (cc, l, hh) => {
        for (let k = 1; k < 12; k++) L(cc, 2, -k * 24, l - 2, -k * 24, "#4A4C50", 1.5);
        if (puerta) {
          P(cc, [l / 2 - 16, 0, l / 2 - 16, -52, l / 2, -64, l / 2 + 16, -52, l / 2 + 16, 0], "#141210");
          L(cc, l / 2 + 26, -120, l / 2 + 14, -170, "#2C2C30", 2);
          L(cc, l / 2 + 14, -170, l / 2 + 30, -210, "#2C2C30", 2);
        }
        R(cc, l / 2 - 6, -180, 12, 24, "#141210");
      };
    VOL.sombra(c, pr, 16, 0, 90, 60, 0.45);
    VOL.prisma(c, pr, [[-w, -w], [w, -w], [w, w], [-w, w]].map(([u, v]) => [u * 0.95, v * 0.95]), 0, 1, ["#45474B", "#5A5C60", "#707276"], { sinTapa: true });
    VOL.caja(c, pr, -w, -w, 0, w, w, h, ["#45474B", "#5A5C60", "#707276"], { frente: hileras(true), atras: hileras(false), izq: hileras(false), der: hileras(false), tapa: "#4A4C50" });
    const S = VOL.escena(pr);
    [[-w + 7, -w + 7, 26], [0, -w + 7, 16], [w - 7, -w + 7, 30], [w - 7, 0, 12], [w - 7, w - 7, 10], [0, w - 7, 22], [-w + 7, w - 7, 18], [-w + 7, 0, 8]].forEach(([u, v, hh]) =>
      S.poner(u, v, () => VOL.cubo(c, pr, u, v, 14, 14, hh, ["#45474B", "#5A5C60", "#707276"], null, h)),
    );
    S.poner(-30, 0, () => {
      VOL.palo(c, pr, -30, 0, h, -30, 0, h + 110, 3, C.maderaSombra);
      const v = Math.sin(t * 2.4) * 6;
      VOL.plano(c, pr, -30, 30, 0, h + 62, h + 108, null, (cc, l, hh) => {
        P(cc, [0, -hh, l + v, -hh + 6, l - 4 + v, -6, 0, 0], "#111111");
        P(cc, [14, -24, 26, -34, 36, -30, 48 + v * 0.6, -36, 38, -22, 24, -18], "#9C2315");
      });
    }, 1);
    S.dibujar();
    [[-w + 7, -w + 7, h + 26], [w - 7, w - 7, h + 10]].forEach(([u, v, z], k) => {
      const q = pr(u, v, z),
        s = pr.s,
        cab = Math.sin(t * 1.5 + k * 3) > 0.6 ? 2 : 0;
      P(c, [q[0] - 8 * s, q[1], q[0], q[1] - 12 * s, q[0] + 8 * s, q[1]], "#111111");
      E(c, q[0] + 4 * s, q[1] - (14 + cab) * s, 5 * s, 4 * s, "#111111");
      P(c, [q[0] + 8 * s, q[1] - (14 + cab) * s, q[0] + 13 * s, q[1] - (13 + cab) * s, q[0] + 8 * s, q[1] - (12 + cab) * s], "#3A3634");
    });
  }
  // el carro de la caravana: la caja, el toldo de aros (rojo o rosado) con su rotura, las ruedas (una rota), la rueda
  // suelta y las cajas reventadas
  function carroCaravanaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      v = o.v || 0,
      tela = v % 2 ? ["#B88A8A", "#E0B2B2", "#F2D2D2"] : ["#5E130D", "#9C2315", "#C8402D"];
    VOL.sombra(c, pr, 6, 0, 84, 34);
    const rueda = (u, w, sana) => {
      const p2 = VOL.sub(pr, u, 0, 0, Math.PI / 2);
      VOL.rollo(c, p2, w - 2, w + 2, 0, 16, 16, T.oscura, { n: 10, corte: sana ? C.madera : "#1A1410" });
    };
    const S = VOL.escena(pr);
    S.poner(-88, 0, () => {
      VOL.cubo(c, pr, -92, -6, 24, 22, 22, T.vieja, { tapa: "#2A2018" });
      VOL.piramide(c, pr, [[-100, -10], [-84, -10], [-84, 6], [-100, 6]], 22, -88, -14, 34, T.madera);
      VOL.elipse(c, pr, -72, 22, 0, 6, 3, "#C8A040");
    });
    [-1, 1].forEach((k) => S.poner(0, k * 24, () => {
      rueda(-48, k * 24, true);
      rueda(44, k * 24, k > 0 ? false : true);
    }, 1));
    S.poner(0, 0, () => {
      VOL.caja(c, pr, -70, -20, 20, 64, 20, 40, T.madera);
      VOL.boveda(c, pr, -66, 62, -20, 20, 40, 70, tela, {
        n: 6,
        punta: tela[0],
        faja: (cc, l, h) => {
          [-40, 0, 40].forEach((u) => R(cc, l / 2 + u - 1, -h, 2, h, C.maderaSombra));
        },
      });
      const q = pr(18, 18, 74),
        s = pr.s;
      if (pr.mira(0, 1)[1] > 0.2)
        P(c, [q[0] - 8 * s, q[1] - 12 * s, q[0] + 8 * s, q[1] - 6 * s, q[0], q[1] + 14 * s, q[0] + 12 * s, q[1] + 26 * s, q[0] - 12 * s, q[1] + 18 * s], "#1A1410");
    });
    S.poner(88, 10, () => VOL.cilindro(c, pr, 88, 10, 18, 0, 3, T.oscura, { n: 10 }));
    S.dibujar();
  }

  Object.assign(ASSETS.LISTA, {
    arconLenador: { f: arconLenador, fv: arconLenadorV, vol: true, alto: 50, choque: { w: 60, h: 14 }, grupo: "secretos" },
    cofreRunico: { f: cofreRunico, fv: cofreRunicoV, vol: true, alto: 54, choque: { w: 66, h: 14 }, grupo: "secretos", luz: true },
    urnaTumulo: { f: urnaTumulo, fv: urnaTumuloV, vol: true, alto: 46, choque: { w: 64, h: 14 }, grupo: "secretos" },
    arcaEnterrada: { f: arcaEnterrada, fv: arcaEnterradaV, vol: true, alto: 30, choque: null, grupo: "secretos" },
    piedraSusurro: { f: piedraSusurro, fv: piedraSusurroV, vol: true, alto: 125, choque: { r: 26 }, grupo: "secretos", luz: true },
    altarRuna: { f: altarRuna, fv: altarRunaV, vol: true, alto: 110, choque: { r: 34 }, grupo: "secretos", luz: true },
    brasero: { f: brasero, figura: true, alto: 60, choque: { r: 16 }, grupo: "secretos", luz: true },
    salonQuemado: { f: salonQuemado, fv: salonQuemadoV, vol: true, alto: 150, choque: null, grupo: "ruinas" },
    tumuloEntrada: { f: tumuloEntrada, fv: tumuloEntradaV, vol: true, alto: 130, choque: { w: 320, h: 50 }, grupo: "ruinas" },
    torreCuervo: { f: torreCuervo, fv: torreCuervoV, vol: true, alto: 420, choque: { r: 50 }, grupo: "ruinas" },
    carroCaravana: { f: carroCaravana, fv: carroCaravanaV, vol: true, alto: 116, choque: { w: 150, h: 26 }, grupo: "ruinas" },
    totemCampamento: { f: totemCampamento, figura: true, alto: 116, choque: { r: 6 }, grupo: "ruinas" },
    manzanoIdunn: { f: manzanoIdunn, figura: true, alto: 140, choque: { r: 10 }, grupo: "secretos", luz: true },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, {
    cofreRunico: { sellado: true },
    piedraSusurro: { viva: true },
    altarRuna: { runa: "kenaz" },
    brasero: { encendido: true },
    tumuloEntrada: { vivo: true },
    totemCampamento: { tipo: "draugr" },
  });
  ASSETS.COL_RUNA = COL_RUNA;
})();
