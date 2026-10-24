// ---------- el corredor del norte: Paso del Guardián y Antigua tala (se suma a ASSETS) ----------
// Según «Eldervald — lugares» (versión de Alejandro del 23/10/2026). En el Paso: los pilares antiguos con runas en
// dos estados de luz, el campamento de la cuadrilla (lonas, torno para bajar vigas, la tabla con el puente dibujado a
// carbón, tablones y sogas), el andamio de la cabecera, el poste de los que cruzaron, la caseta del puentero del otro
// lado (vacía o habitada) y la niebla. En la tala: los tocones con la marca del leñador y su fecha, el muro de raíces
// vivas que cierra la quebrada, el gran tocón de linde con la piedra atrapada y la cuña de hierro, la cabaña de los
// leñadores con el techo vencido, el canal de arrastre, los raspones de cornamenta y el escondite de los guardasendas.
// Mismas reglas que assets.js: colores planos, luz de arriba a la derecha.
(function () {
  "use strict";
  const { P, E, R, L, alfa, azar, sombra, halo, poli, RUNICO, RUNICO_CLARO, TAU } = DIB;
  const C = ASSETS.C;
  const nivel = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  const VIOLETA = "#9A6BD8";
  const PIEDRA = ["#3E4246", "#4E5256", "#5E6266"];

  // la marca de la familia de Orm: una rama vertical con brazos (la misma del carro y del dintel del aserradero)
  function marca(c, x, y, h, col, g) {
    L(c, x, y, x, y - h, col, g);
    L(c, x, y - h * 0.35, x - h * 0.3, y - h * 0.6, col, g);
    L(c, x, y - h * 0.35, x + h * 0.3, y - h * 0.6, col, g);
    L(c, x, y - h * 0.7, x - h * 0.22, y - h * 0.92, col, g);
    L(c, x, y - h * 0.7, x + h * 0.22, y - h * 0.92, col, g);
  }

  // Pilar antiguo del puente: piedra muy vieja con runas azules; o.luz 0..1 (casi apagadas antes de EL-06).
  function pilarAntiguo(c, x, y, t, o) {
    const s = o.s || 1,
      f = o.luz != null ? o.luz : 0.15,
      lat = 0.8 + Math.sin(t * 1.5 + (o.sem || 0)) * 0.2;
    sombra(c, x + 10 * s, y + 4 * s, 44 * s, 12 * s);
    P(c, [x - 34 * s, y + 4 * s, x - 28 * s, y - 16 * s, x + 30 * s, y - 18 * s, x + 38 * s, y + 4 * s], PIEDRA[0]);
    P(c, [x - 26 * s, y - 10 * s, x - 28 * s, y - 170 * s, x - 12 * s, y - 186 * s, x + 14 * s, y - 186 * s, x + 26 * s, y - 170 * s, x + 26 * s, y - 10 * s], PIEDRA[1]);
    P(c, [x + 6 * s, y - 10 * s, x + 6 * s, y - 186 * s, x + 14 * s, y - 186 * s, x + 26 * s, y - 170 * s, x + 26 * s, y - 10 * s], PIEDRA[2]);
    // remate tallado y musgo
    P(c, [x - 32 * s, y - 170 * s, x + 32 * s, y - 170 * s, x + 28 * s, y - 182 * s, x - 28 * s, y - 182 * s], PIEDRA[0]);
    P(c, [x - 26 * s, y - 10 * s, x - 26 * s, y - 40 * s, x - 8 * s, y - 30 * s, x + 4 * s, y - 10 * s], C.musgo2);
    const runas = o.runas || ["algiz", "raidho"];
    runas.forEach((nom, i) => {
      const ry = y - 70 * s - i * 62 * s;
      FUTHARK.dibujar(c, nom, x - 2 * s, ry, 44 * s, "#2A2E32", 6 * s);
      alfa(c, 0.2 + f * 0.8 * lat, () => FUTHARK.dibujar(c, nom, x - 2 * s, ry, 44 * s, RUNICO, 3.5 * s));
    });
    if (f > 0.3) halo(c, x, y - 110 * s, 90 * s, RUNICO, f * lat * 0.7);
  }

  // Lona de la cuadrilla: una tienda a dos aguas sobre dos palos, con la boca abierta y bultos adentro.
  function lonaCuadrilla(c, x, y, t, o) {
    const s = o.s || 1,
      v = Math.sin(t * 2.2 + (o.sem || 0)) * 2 * s,
      tela = o.v ? ["#7A6A4E", "#94845E", "#5E5038"] : ["#6E7458", "#868C6C", "#545A42"];
    sombra(c, x + 12 * s, y + 4 * s, 90 * s, 18 * s);
    P(c, [x - 80 * s, y, x - 10 * s, y - 92 * s, x - 4 * s + v, y - 92 * s, x + 20 * s, y], tela[0]);
    P(c, [x - 4 * s + v, y - 92 * s, x + 20 * s, y, x + 86 * s, y - 14 * s, x + 62 * s + v, y - 104 * s], tela[1]);
    P(c, [x - 52 * s, y, x - 10 * s, y - 64 * s, x + 4 * s, y], "#2A2018");
    R(c, x - 32 * s, y - 16 * s, 22 * s, 14 * s, C.maderaVieja);
    L(c, x - 10 * s, y - 92 * s, x - 10 * s, y - 110 * s, C.maderaSombra, 4 * s);
    L(c, x + 62 * s + v, y - 104 * s, x + 62 * s, y - 120 * s, C.maderaSombra, 4 * s);
    L(c, x - 10 * s, y - 108 * s, x - 100 * s, y + 4 * s, "#8A7A5A", 1.5 * s);
    L(c, x + 62 * s, y - 118 * s, x + 120 * s, y - 10 * s, "#8A7A5A", 1.5 * s);
  }

  // El torno para bajar vigas: dos caballetes, un cilindro con soga y la manivela.
  function tornoVigas(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 8 * s, y + 4 * s, 70 * s, 14 * s);
    [-1, 1].forEach((l) => {
      L(c, x + l * 50 * s, y - 70 * s, x + l * 64 * s, y, C.maderaSombra, 7 * s);
      L(c, x + l * 50 * s, y - 70 * s, x + l * 36 * s, y, C.madera, 7 * s);
    });
    R(c, x - 54 * s, y - 82 * s, 108 * s, 22 * s, C.tronco);
    for (let k = 0; k < 8; k++) L(c, x - 46 * s + k * 13 * s, y - 82 * s, x - 42 * s + k * 13 * s, y - 60 * s, "#C8B48C", 2.5 * s);
    L(c, x + 54 * s, y - 71 * s, x + 74 * s, y - 92 * s, C.hierro, 4 * s);
    L(c, x + 74 * s, y - 92 * s, x + 74 * s, y - 76 * s, C.hierro, 4 * s);
    // la soga baja hacia el borde
    L(c, x - 10 * s, y - 60 * s, x - 30 * s, y + 40 * s, "#C8B48C", 2.5 * s);
  }

  // La tabla de Orm: el puente dibujado en una tabla sobre un caballete, con lo que falta marcado a carbón.
  function tablaPuente(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 6 * s, y + 3 * s, 40 * s, 10 * s);
    L(c, x - 30 * s, y, x - 20 * s, y - 70 * s, C.maderaSombra, 5 * s);
    L(c, x + 30 * s, y, x + 20 * s, y - 70 * s, C.maderaSombra, 5 * s);
    P(c, [x - 46 * s, y - 50 * s, x - 40 * s, y - 112 * s, x + 46 * s, y - 116 * s, x + 46 * s, y - 52 * s], C.maderaLuz);
    // el dibujo: dos pilares, el tablero y el tramo que falta con cruces
    L(c, x - 30 * s, y - 64 * s, x - 30 * s, y - 92 * s, "#2A2018", 3 * s);
    L(c, x + 30 * s, y - 64 * s, x + 30 * s, y - 94 * s, "#2A2018", 3 * s);
    L(c, x - 38 * s, y - 92 * s, x - 10 * s, y - 92 * s, "#2A2018", 2.5 * s);
    L(c, x + 10 * s, y - 94 * s, x + 38 * s, y - 94 * s, "#2A2018", 2.5 * s);
    for (let k = 0; k < 3; k++) {
      const cx = x - 8 * s + k * 8 * s;
      L(c, cx - 3 * s, y - 96 * s, cx + 3 * s, y - 90 * s, "#2A2018", 1.5 * s);
      L(c, cx + 3 * s, y - 96 * s, cx - 3 * s, y - 90 * s, "#2A2018", 1.5 * s);
    }
  }

  // Tablones y sogas apilados: los materiales ya están.
  function pilaTablones(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 10 * s, y + 4 * s, 80 * s, 14 * s);
    for (let k = 0; k < 5; k++) {
      const yy = y - k * 9 * s,
        dx = (k % 2) * 6 * s;
      P(c, [x - 76 * s + dx, yy, x - 70 * s + dx, yy - 9 * s, x + 74 * s + dx, yy - 9 * s, x + 70 * s + dx, yy], k % 2 ? C.madera : C.maderaLuz);
      R(c, x - 76 * s + dx, yy - 1 * s, 146 * s, 1.5 * s, C.maderaSombra);
    }
    // rollos de soga
    [[-40, 18], [30, 16]].forEach(([dx, dy]) => {
      E(c, x + dx * s, y + dy * s - 8 * s, 20 * s, 10 * s, "#A8946C");
      E(c, x + dx * s, y + dy * s - 10 * s, 12 * s, 5 * s, "#6B5A3A");
    });
  }

  // El andamio de la cabecera: postes, travesaños y una plataforma.
  function andamio(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 10 * s, y + 4 * s, 60 * s, 12 * s);
    [-44, 44].forEach((dx) => R(c, x + dx * s - 3 * s, y - 160 * s, 6 * s, 160 * s, C.maderaSombra));
    [-30, 58].forEach((dx) => R(c, x + dx * s - 3 * s, y - 150 * s - 10 * s, 6 * s, 150 * s, C.madera));
    [40, 100, 150].forEach((h) => R(c, x - 48 * s, y - h * s, 110 * s, 6 * s, C.maderaVieja));
    L(c, x - 44 * s, y - 40 * s, x + 44 * s, y - 100 * s, C.maderaSombra, 4 * s);
    L(c, x - 44 * s, y - 100 * s, x + 44 * s, y - 150 * s, C.maderaSombra, 4 * s);
    P(c, [x - 52 * s, y - 150 * s, x + 66 * s, y - 150 * s, x + 70 * s, y - 160 * s, x - 48 * s, y - 160 * s], C.maderaLuz);
  }

  // El poste de los que cruzaron: tablillas atadas con marcas; o.nuevas suma tablillas claras (segunda visita).
  function posteCruzaron(c, x, y, t, o) {
    const s = o.s || 1,
      r = azar(77);
    sombra(c, x + 8 * s, y + 3 * s, 26 * s, 8 * s);
    R(c, x - 7 * s, y - 170 * s, 14 * s, 172 * s, C.maderaSombra);
    R(c, x + 1 * s, y - 170 * s, 6 * s, 172 * s, C.madera);
    const n = 14 + (o.nuevas || 0);
    for (let k = 0; k < n; k++) {
      const l = k % 2 ? 1 : -1,
        yy = y - 30 * s - Math.floor(k / 2) * 18 * s,
        xx = x + l * 14 * s,
        nueva = k >= 14,
        bal = Math.sin(t * 1.4 + k) * 1.5 * s;
      L(c, x, yy - 14 * s, xx + bal, yy - 10 * s, "#8A7A5A", 1.2 * s);
      R(c, xx - 7 * s + bal, yy - 10 * s, 14 * s, 10 * s, nueva ? C.maderaLuz : r() < 0.5 ? C.maderaVieja : "#6E6050");
      L(c, xx - 3 * s + bal, yy - 7 * s, xx + 3 * s + bal, yy - 3 * s, "#2A2018", 1.2 * s);
    }
    // la de Geir: más arriba, con un nudo rojo
    R(c, x - 22 * s, y - 158 * s, 16 * s, 12 * s, C.maderaVieja);
    E(c, x - 14 * s, y - 160 * s, 3 * s, 3 * s, C.rojoEromash);
  }

  // La caseta del puentero, del otro lado: techo, ventana oscura; o.habitada abre la puerta, enciende la ventana y
  // saca humo por la chimenea.
  function casetaPuentero(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 16 * s, y + 6 * s, 90 * s, 18 * s);
    P(c, [x - 70 * s, y, x - 70 * s, y - 70 * s, x + 50 * s, y - 70 * s, x + 50 * s, y], "#4E3A2A");
    P(c, [x + 50 * s, y, x + 50 * s, y - 70 * s, x + 86 * s, y - 92 * s, x + 86 * s, y - 22 * s], "#62492F");
    for (let k = 1; k < 6; k++) R(c, x - 70 * s, y - k * 12 * s, 120 * s, 2 * s, "rgba(0,0,0,0.3)");
    P(c, [x - 82 * s, y - 66 * s, x - 30 * s, y - 128 * s, x + 96 * s, y - 128 * s, x + 62 * s, y - 66 * s], "#343A42");
    P(c, [x + 62 * s, y - 66 * s, x + 96 * s, y - 128 * s, x + 100 * s, y - 88 * s], "#262A30");
    E(c, x + 10 * s, y - 112 * s, 18 * s, 6 * s, "#4E6B3A");
    // puerta y ventana
    if (o.habitada) {
      R(c, x - 50 * s, y - 50 * s, 26 * s, 50 * s, "#1A140E");
      alfa(c, 0.5, () => R(c, x - 48 * s, y - 48 * s, 22 * s, 48 * s, C.ambar));
      P(c, [x - 24 * s, y, x - 24 * s, y - 50 * s, x - 10 * s, y - 46 * s, x - 10 * s, y + 2 * s], "#3A2A1E");
    } else R(c, x - 50 * s, y - 50 * s, 26 * s, 50 * s, "#3A2A1E");
    R(c, x + 4 * s, y - 50 * s, 24 * s, 20 * s, "#1A140E");
    if (o.habitada) {
      alfa(c, 0.7, () => R(c, x + 6 * s, y - 48 * s, 20 * s, 16 * s, C.ambar));
      halo(c, x + 16 * s, y - 40 * s, 60 * s, C.ambar, 0.5);
    }
    // chimenea
    R(c, x + 30 * s, y - 146 * s, 16 * s, 30 * s, "#55584E");
    if (o.habitada && nivel() !== "baja")
      for (let k = 0; k < 4; k++) {
        const p = (t * 0.22 + k / 4) % 1;
        alfa(c, 0.22 * (1 - p), () => E(c, x + 38 * s + Math.sin(p * 5 + k) * 8 * s, y - 150 * s - p * 90 * s, (6 + p * 14) * s, (5 + p * 10) * s, "#8A8E88"));
      }
  }

  // Tocón de la tala, con la marca del leñador tallada y la fecha (muescas): o.k es el orden de la fecha.
  function toconMarcado(c, x, y, t, o) {
    const s = o.s || 1,
      w = (30 + ((o.sem || 0) % 3) * 6) * s,
      h = 36 * s;
    sombra(c, x + 8 * s, y + 4 * s, w * 1.3, 12 * s);
    // raíces y rebrotes torcidos
    [-1, 1].forEach((l) => P(c, [x + l * w * 0.6, y - 8 * s, x + l * w * 1.3, y + 6 * s, x + l * w * 0.5, y + 4 * s], C.troncoSombra));
    P(c, [x - w, y, x - w, y - h, x + w, y - h, x + w, y], C.tronco);
    P(c, [x + w * 0.2, y, x + w * 0.2, y - h, x + w, y - h, x + w, y], C.corteza);
    E(c, x, y - h, w, w * 0.4, C.maderaLuz);
    E(c, x, y - h, w * 0.66, w * 0.26, C.madera);
    E(c, x, y - h, w * 0.3, w * 0.12, C.maderaLuz);
    E(c, x - w * 0.4, y - h - 2 * s, w * 0.4, w * 0.16, C.musgo2);
    marca(c, x - w * 0.5, y - 6 * s, 22 * s, "#2A1E14", 2.2 * s);
    for (let k = 0; k < Math.min(6, (o.k || 0) + 1); k++) R(c, x + w * 0.1 + k * 5 * s, y - 24 * s, 2 * s, 10 * s, "#2A1E14");
    L(c, x + w * 0.7, y - h, x + w * 0.9, y - h - 30 * s, "#4E6B3A", 3 * s);
    L(c, x + w * 0.9, y - h - 30 * s, x + w * 0.6, y - h - 44 * s, "#4E6B3A", 3 * s);
  }

  // El muro de raíces vivas que cierra la quebrada. o.abierto: las raíces se retiran a los costados.
  function muroRaices(c, x, y, t, o) {
    const s = o.s || 1,
      a = o.abierto ? 1 : 0,
      w = 170 * s,
      r = azar(911 + (o.sem || 0));
    sombra(c, x, y + 4 * s, w * 1.1, 20 * s, 0.4);
    for (let k = 0; k < 16; k++) {
      const u = k / 15 - 0.5,
        bx = x + u * w * 2,
        sep = a * Math.sign(u || 1) * 110 * s,
        h = (150 + r() * 70) * s * (1 - a * 0.55),
        cx = bx + sep + (r() - 0.5) * 30 * s;
      c.lineCap = "round";
      L(c, bx + sep * 0.4, y, cx, y - h, k % 2 ? C.troncoSombra : C.tronco, (14 + r() * 8) * s);
      L(c, cx, y - h, cx + (r() - 0.5) * 80 * s, y - h * 0.6, C.tronco, 8 * s);
    }
    if (!o.abierto)
      for (let k = 0; k < 9; k++) {
        const u = k / 8 - 0.5;
        L(c, x + u * w * 1.8, y - 40 * s - (k % 3) * 40 * s, x - u * w * 1.6, y - 90 * s - (k % 2) * 40 * s, C.troncoSombra, 9 * s);
      }
    // el patrón de la herida: nudos con savia
    for (let k = 0; k < 5; k++) E(c, x + (k - 2) * 60 * s + (a ? Math.sign(k - 2) * 110 * s : 0), y - 60 * s - (k % 2) * 30 * s, 8 * s, 6 * s, "#B8A040");
  }

  // El gran tocón del árbol de linde, con la piedra antigua atrapada entre las raíces y la cuña de hierro en la raíz
  // viva (o.cuna); mientras está, rezuma savia por la grieta.
  function granTocon(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 20 * s, y + 6 * s, 200 * s, 40 * s, 0.4);
    // raíces enormes
    [[-1, 200, 30], [-1, 140, 60], [1, 160, 50], [1, 220, 20], [-1, 60, 70]].forEach(([l, dx, dy], i) => {
      P(c, [x + l * 60 * s, y - 90 * s, x + l * dx * s, y + dy * 0.4 * s, x + l * (dx - 40) * s, y + dy * 0.4 * s + 10 * s, x + l * 30 * s, y], i % 2 ? C.troncoSombra : C.tronco);
    });
    // la piedra antigua, abrazada
    P(c, [x - 60 * s, y - 4 * s, x - 70 * s, y - 70 * s, x - 30 * s, y - 100 * s, x + 20 * s, y - 92 * s, x + 30 * s, y - 4 * s], PIEDRA[1]);
    P(c, [x - 30 * s, y - 100 * s, x + 20 * s, y - 92 * s, x + 30 * s, y - 4 * s, x - 10 * s, y - 4 * s], PIEDRA[2]);
    alfa(c, 0.35, () => FUTHARK.dibujar(c, "eihwaz", x - 20 * s, y - 30 * s, 40 * s, RUNICO, 3 * s));
    // el tocón, ancho como una casa chica
    P(c, [x - 120 * s, y - 60 * s, x - 112 * s, y - 150 * s, x + 118 * s, y - 150 * s, x + 126 * s, y - 60 * s, x + 60 * s, y - 40 * s, x - 70 * s, y - 50 * s], C.corteza);
    P(c, [x + 20 * s, y - 50 * s, x + 30 * s, y - 150 * s, x + 118 * s, y - 150 * s, x + 126 * s, y - 60 * s], C.tronco);
    E(c, x + 3 * s, y - 150 * s, 116 * s, 40 * s, C.maderaLuz);
    for (let k = 1; k < 5; k++) c.beginPath(), c.ellipse(x + 3 * s, y - 150 * s, 116 * s * (k / 5), 40 * s * (k / 5), 0, 0, TAU), (c.strokeStyle = C.madera), (c.lineWidth = 2 * s), c.stroke();
    E(c, x - 50 * s, y - 158 * s, 40 * s, 12 * s, C.musgo2);
    // la raíz viva con la cuña
    P(c, [x + 60 * s, y - 50 * s, x + 150 * s, y - 20 * s, x + 170 * s, y + 6 * s, x + 50 * s, y - 10 * s], C.tronco);
    if (o.cuna) {
      P(c, [x + 96 * s, y - 40 * s, x + 112 * s, y - 64 * s, x + 122 * s, y - 60 * s, x + 108 * s, y - 32 * s], C.hierro);
      P(c, [x + 112 * s, y - 64 * s, x + 122 * s, y - 60 * s, x + 118 * s, y - 56 * s], C.hierroLuz);
      // la savia que rezuma
      const g = (t * 0.6) % 1;
      L(c, x + 104 * s, y - 30 * s, x + 104 * s, y - 14 * s, "#C8A040", 3 * s);
      E(c, x + 104 * s, y - 14 * s + g * 16 * s, 3 * s, 4 * s, "#E0B850");
      E(c, x + 100 * s, y + 6 * s, 16 * s, 5 * s, "#A88A30");
    } else E(c, x + 104 * s, y - 34 * s, 6 * s, 4 * s, "#3A2A1A");
  }

  // La cabaña de los leñadores: techo vencido, herramientas oxidadas y el banco con la caja debajo.
  function cabanaLenadores(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 20 * s, y + 6 * s, 140 * s, 24 * s);
    P(c, [x - 110 * s, y, x - 110 * s, y - 80 * s, x + 90 * s, y - 80 * s, x + 90 * s, y], "#4A3E30");
    P(c, [x + 90 * s, y, x + 90 * s, y - 80 * s, x + 130 * s, y - 104 * s, x + 130 * s, y - 24 * s], "#5C4E3C");
    for (let k = 1; k < 7; k++) R(c, x - 110 * s, y - k * 12 * s, 200 * s, 2 * s, "rgba(0,0,0,0.3)");
    // el techo vencido: medio faldón caído hacia adentro
    P(c, [x - 124 * s, y - 76 * s, x - 70 * s, y - 140 * s, x + 10 * s, y - 140 * s, x - 20 * s, y - 76 * s], "#3A2C20");
    P(c, [x + 10 * s, y - 140 * s, x + 30 * s, y - 100 * s, x + 104 * s, y - 76 * s, x - 20 * s, y - 76 * s], "#2A2018");
    L(c, x + 10 * s, y - 140 * s, x + 120 * s, y - 112 * s, C.maderaSombra, 5 * s);
    E(c, x - 50 * s, y - 120 * s, 30 * s, 8 * s, "#4E6B3A");
    R(c, x - 40 * s, y - 56 * s, 30 * s, 56 * s, "#1A140E");
    // el banco con la caja
    R(c, x + 10 * s, y + 14 * s, 70 * s, 6 * s, C.madera);
    R(c, x + 14 * s, y + 20 * s, 5 * s, 14 * s, C.maderaSombra);
    R(c, x + 72 * s, y + 20 * s, 5 * s, 14 * s, C.maderaSombra);
    if (!o.vacia) R(c, x + 30 * s, y + 22 * s, 30 * s, 12 * s, C.maderaVieja);
    // hacha oxidada contra la pared
    L(c, x - 80 * s, y, x - 70 * s, y - 50 * s, C.maderaSombra, 3 * s);
    P(c, [x - 72 * s, y - 50 * s, x - 60 * s, y - 56 * s, x - 62 * s, y - 42 * s], "#7A4A2A");
  }

  Object.assign(ASSETS.LISTA, {
    pilarAntiguo: { f: pilarAntiguo, alto: 190, choque: { r: 26 }, grupo: "norte", luz: true },
    lonaCuadrilla: { f: lonaCuadrilla, alto: 120, choque: { w: 140, h: 40 }, grupo: "norte" },
    tornoVigas: { f: tornoVigas, alto: 95, choque: { w: 120, h: 30 }, grupo: "norte" },
    tablaPuente: { f: tablaPuente, alto: 116, choque: { r: 24 }, grupo: "norte" },
    pilaTablones: { f: pilaTablones, alto: 50, choque: { w: 150, h: 30 }, grupo: "norte" },
    andamio: { f: andamio, alto: 160, choque: { w: 100, h: 20 }, grupo: "norte" },
    posteCruzaron: { f: posteCruzaron, alto: 170, choque: { r: 14 }, grupo: "norte" },
    casetaPuentero: { f: casetaPuentero, alto: 150, choque: { w: 160, h: 40 }, grupo: "norte" },
    toconMarcado: { f: toconMarcado, alto: 70, choque: { r: 30 }, grupo: "norte" },
    muroRaices: { f: muroRaices, alto: 220, choque: { w: 220, h: 440 }, grupo: "norte" },
    granTocon: { f: granTocon, alto: 170, choque: { w: 250, h: 70 }, grupo: "norte" },
    cabanaLenadores: { f: cabanaLenadores, alto: 140, choque: { w: 240, h: 40 }, grupo: "norte" },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, {
    pilarAntiguo: { luz: 1 },
    casetaPuentero: { habitada: true },
    toconMarcado: { k: 3 },
    granTocon: { cuna: true },
  });
  void poli;
  void RUNICO_CLARO;
  void VIOLETA;
})();
