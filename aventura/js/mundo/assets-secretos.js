// ---------- los secretos de Eldervald: cofres, piedras rúnicas, altares y ruinas ----------
// Cada uno es un objeto con nombre propio, dibujado como el resto: caras planas, luz de arriba a la derecha.
// Las runas encendidas son las únicas cosas que brillan de verdad en el bosque: así el jugador las ve de lejos.
(function () {
  "use strict";
  const { P, E, R, L, alfa, sombra, halo, RUNICO, RUNICO_CLARO, VIOLETA, poli, azar } = DIB;
  const C = ASSETS.C;
  const F = FUTHARK;
  const COL_RUNA = { kenaz: "#FF8D71", isa: "#C8F2F4", algiz: "#FFD98A", sowilo: "#F5A524" };

  // ---------- Arcón del leñador ----------
  // Roble con dos zunchos de hierro, tapa redonda y la runa Fehu (riqueza) en la cerradura.
  // o.abierto: la tapa cae hacia atrás y se ve el fondo vacío.
  function arconLenador(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 4 * s, y + 2, 34 * s, 8 * s);
    // cuerpo: cara de frente y cara derecha
    P(c, [x - 28 * s, y, x - 28 * s, y - 26 * s, x + 20 * s, y - 26 * s, x + 20 * s, y], C.madera);
    P(c, [x + 20 * s, y, x + 20 * s, y - 26 * s, x + 30 * s, y - 32 * s, x + 30 * s, y - 6 * s], C.maderaLuz);
    P(c, [x - 28 * s, y, x - 28 * s, y - 26 * s, x - 18 * s, y - 26 * s, x - 18 * s, y], C.maderaSombra);
    L(c, x - 28 * s, y - 13 * s, x + 20 * s, y - 13 * s, C.maderaSombra, 1.5 * s);
    if (o.abierto) {
      P(c, [x - 28 * s, y - 26 * s, x + 20 * s, y - 26 * s, x + 30 * s, y - 32 * s, x - 18 * s, y - 32 * s], "#1E140C");
      // la tapa abierta, de canto, hacia atrás
      P(c, [x - 18 * s, y - 32 * s, x + 30 * s, y - 32 * s, x + 26 * s, y - 52 * s, x - 22 * s, y - 52 * s], C.maderaSombra);
      P(c, [x - 18 * s, y - 34 * s, x + 30 * s, y - 34 * s, x + 30 * s, y - 38 * s, x - 18 * s, y - 38 * s], C.hierro);
    } else {
      // tapa curva
      P(c, [x - 28 * s, y - 26 * s, x - 26 * s, y - 36 * s, x - 18 * s, y - 42 * s, x + 30 * s, y - 46 * s, x + 30 * s, y - 32 * s, x + 20 * s, y - 26 * s], C.madera);
      P(c, [x + 20 * s, y - 26 * s, x + 22 * s, y - 40 * s, x + 30 * s, y - 46 * s, x + 30 * s, y - 32 * s], C.maderaLuz);
      P(c, [x - 28 * s, y - 26 * s, x - 26 * s, y - 36 * s, x - 18 * s, y - 42 * s, x - 18 * s, y - 26 * s], C.maderaSombra);
      // cerradura con Fehu
      R(c, x - 9 * s, y - 32 * s, 12 * s, 14 * s, C.hierro);
      F.dibujar(c, "fehu", x - 3 * s, y - 20 * s, 10 * s, C.ambar, 1.6 * s);
    }
    // zunchos
    [-20, 10].forEach((dx) => {
      R(c, x + dx * s, y - (o.abierto ? 26 : 42) * s, 4 * s, (o.abierto ? 26 : 42) * s, C.hierro);
      R(c, x + (dx + 3) * s, y - (o.abierto ? 26 : 42) * s, 1 * s, (o.abierto ? 26 : 42) * s, C.hierroLuz);
    });
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
  // Medio hundida entre raíces y musgo; nadie la ve hasta que la Lente del Eco o Sowilo la revelan.
  function arcaEnterrada(c, x, y, t, o) {
    const s = o.s || 1;
    if (o.oculto) {
      // apenas un destello sobre el musgo, para el que mira bien
      const g = Math.max(0, Math.sin(t * 1.3 + (o.sem || 0) * 3)) ** 8;
      alfa(c, g, () => {
        P(c, [x, y - 16 * s, x + 2 * s, y - 10 * s, x + 8 * s, y - 8 * s, x + 2 * s, y - 6 * s, x, y, x - 2 * s, y - 6 * s, x - 8 * s, y - 8 * s, x - 2 * s, y - 10 * s], "#FFF4D0");
      });
      return;
    }
    if (!o.abierto) halo(c, x, y - 16 * s, 46 * s, C.ambar, 0.5 + Math.sin(t * 3) * 0.2);
    E(c, x, y, 40 * s, 10 * s, C.humus);
    P(c, [x - 26 * s, y, x - 24 * s, y - 16 * s, x + 22 * s, y - 18 * s, x + 26 * s, y - 2 * s], C.maderaVieja);
    P(c, [x + 10 * s, y - 2 * s, x + 12 * s, y - 18 * s, x + 22 * s, y - 18 * s, x + 26 * s, y - 2 * s], "#6E5A44");
    if (o.abierto) E(c, x, y - 17 * s, 22 * s, 4 * s, "#140E08");
    else {
      P(c, [x - 24 * s, y - 16 * s, x - 18 * s, y - 26 * s, x + 26 * s, y - 28 * s, x + 22 * s, y - 18 * s], "#6E5A44");
      R(c, x - 4 * s, y - 20 * s, 7 * s, 8 * s, C.hierroLuz);
    }
    // raíces encima
    c.save();
    c.strokeStyle = C.troncoSombra;
    c.lineWidth = 4 * s;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(x - 40 * s, y + 4 * s);
    c.quadraticCurveTo(x - 20 * s, y - 34 * s, x + 6 * s, y - 14 * s);
    c.moveTo(x + 36 * s, y + 2 * s);
    c.quadraticCurveTo(x + 24 * s, y - 24 * s, x + 12 * s, y - 8 * s);
    c.stroke();
    c.restore();
    E(c, x - 16 * s, y - 20 * s, 10 * s, 4 * s, C.musgoClaro);
    E(c, x + 18 * s, y - 2 * s, 9 * s, 3 * s, C.musgo2);
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
    const piedra = "#565A62",
      clara = "#6C7078",
      oscura = "#40444C";
    P(c, [x - 22 * s, y, x - 20 * s, y - 92 * s, x - 6 * s, y - 116 * s, x + 14 * s, y - 108 * s, x + 22 * s, y - 80 * s, x + 22 * s, y], piedra);
    P(c, [x - 6 * s, y - 116 * s, x + 14 * s, y - 108 * s, x + 22 * s, y - 80 * s, x + 22 * s, y, x + 6 * s, y], clara);
    P(c, [x - 22 * s, y, x - 20 * s, y - 92 * s, x - 14 * s, y - 60 * s, x - 14 * s, y], oscura);
    E(c, x - 16 * s, y - 4 * s, 10 * s, 4 * s, C.musgo2);
    // la serpiente: una cinta en S que baja por la cara
    const col = viva ? RUNICO_CLARO : "#3A3E46";
    c.save();
    c.strokeStyle = viva ? RUNICO : "#34383F";
    c.lineWidth = 7 * s;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(x - 10 * s, y - 100 * s);
    c.bezierCurveTo(x + 22 * s, y - 92 * s, x + 18 * s, y - 64 * s, x - 2 * s, y - 58 * s);
    c.bezierCurveTo(x - 20 * s, y - 52 * s, x - 18 * s, y - 24 * s, x + 12 * s, y - 14 * s);
    c.stroke();
    c.restore();
    // cabeza de la serpiente
    P(c, [x - 16 * s, y - 104 * s, x - 6 * s, y - 108 * s, x - 2 * s, y - 100 * s, x - 10 * s, y - 96 * s], viva ? RUNICO : "#34383F");
    R(c, x - 10 * s, y - 104 * s, 2 * s, 2 * s, viva ? "#FFFFFF" : "#22252A");
    // runas en el cuerpo de la serpiente
    const runas = o.runas || ["ansuz", "laguz", "othala", "eihwaz"];
    const pos = [[4, -88], [6, -68], [-10, -44], [0, -26]];
    alfa(c, 0.4 + late * 0.6, () => runas.forEach((r, i) => F.dibujar(c, r, x + pos[i][0] * s, y + pos[i][1] * s + 5 * s, 9 * s, col, 1.5 * s)));
    // motas de luz que suben cuando está viva
    if (viva)
      for (let k = 0; k < 5; k++) {
        const u = (t * 0.25 + k / 5 + (o.sem || 0)) % 1;
        alfa(c, Math.sin(u * Math.PI), () => R(c, x + Math.sin(k * 2.3 + t) * 22 * s, y - 40 * s - u * 110 * s, 2.5 * s, 2.5 * s, RUNICO_CLARO));
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

  Object.assign(ASSETS.LISTA, {
    arconLenador: { f: arconLenador, alto: 50, choque: { w: 60, h: 14 }, grupo: "secretos" },
    cofreRunico: { f: cofreRunico, alto: 54, choque: { w: 66, h: 14 }, grupo: "secretos", luz: true },
    urnaTumulo: { f: urnaTumulo, alto: 46, choque: { w: 64, h: 14 }, grupo: "secretos" },
    arcaEnterrada: { f: arcaEnterrada, alto: 30, choque: null, grupo: "secretos" },
    piedraSusurro: { f: piedraSusurro, alto: 120, choque: { r: 20 }, grupo: "secretos", luz: true },
    altarRuna: { f: altarRuna, alto: 110, choque: { r: 34 }, grupo: "secretos", luz: true },
    brasero: { f: brasero, alto: 60, choque: { r: 16 }, grupo: "secretos", luz: true },
    salonQuemado: { f: salonQuemado, alto: 150, choque: null, grupo: "ruinas" },
    tumuloEntrada: { f: tumuloEntrada, alto: 130, choque: { w: 320, h: 50 }, grupo: "ruinas" },
    torreCuervo: { f: torreCuervo, alto: 420, choque: { r: 50 }, grupo: "ruinas" },
    carroCaravana: { f: carroCaravana, alto: 116, choque: { w: 150, h: 26 }, grupo: "ruinas" },
    totemCampamento: { f: totemCampamento, alto: 116, choque: { r: 6 }, grupo: "ruinas" },
    manzanoIdunn: { f: manzanoIdunn, alto: 140, choque: { r: 10 }, grupo: "secretos", luz: true },
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
