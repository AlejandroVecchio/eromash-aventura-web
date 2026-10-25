// ---------- los secretos de adentro: alfombras, trampillas y sótanos ----------
// Lo que se encuentra recorriendo las casas por dentro: la alfombra que tapa una trampilla, la trampilla que baja al
// sótano, la escalera de mano para volver a subir, el atril con un libro de saber, el cofre del sótano, cajones,
// estantes de rollos, un armero viejo, la tabla suelta de la pared que esconde un nicho y los huesos de alguien que
// bajó y no volvió a subir. Mismas medidas que los muebles del cuarto (pies en x, y; luz de arriba a la derecha).
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
    MADERA_OSCURA = "#2A0806",
    HIERRO = "#3A3438",
    HIERRO2 = "#5A5458";
  // un trapecio plano en el piso: ancho atrás wb, adelante wf, profundidad d
  const piso = (x, y, wb, wf, d) => [x - wb, y - d, x + wb, y - d, x + wf, y, x - wf, y];

  // ---------- Alfombra ----------
  // Roja con borde oscuro, rombos dorados y flecos. o.movida: está enrollada a un costado. o.pista: una esquina
  // levantada, porque abajo hay algo.
  function alfombra(c, x, y, t, o) {
    const s = o.s || 1,
      wb = 200 * s,
      wf = 232 * s,
      d = 78 * s;
    if (o.movida) {
      // enrollada a la derecha
      const rx = x + wf + 40 * s;
      P(c, [rx - 26 * s, y - d, rx + 6 * s, y - d, rx + 22 * s, y, rx - 14 * s, y], "#5E130D");
      for (let k = 0; k < 4; k++) L(c, rx - 22 * s + k * 3 * s, y - d + 6 * s, rx - 8 * s + k * 6 * s, y - 6 * s, "#9C2315", 4 * s);
      E(c, rx + 2 * s, y - 2 * s, 18 * s, 10 * s, "#9C2315");
      E(c, rx + 2 * s, y - 2 * s, 9 * s, 5 * s, "#3A0C08");
      return;
    }
    P(c, piso(x, y + 6 * s, wb + 10 * s, wf + 10 * s, d + 10 * s), "rgba(0,0,0,0.28)");
    P(c, piso(x, y, wb, wf, d), "#5E130D");
    P(c, piso(x, y - 9 * s, wb - 18 * s, wf - 20 * s, d - 18 * s), "#9C2315");
    // rombos dorados en el medio
    for (let k = -3; k <= 3; k++) {
      const cx = x + k * 52 * s,
        cy = y - d / 2;
      P(c, [cx, cy - 18 * s, cx + 16 * s, cy, cx, cy + 16 * s, cx - 16 * s, cy], k % 2 ? "#C8402D" : ORO);
      P(c, [cx, cy - 8 * s, cx + 7 * s, cy, cx, cy + 7 * s, cx - 7 * s, cy], "#5E130D");
    }
    // flecos de adelante y de atrás
    for (let k = 0; k <= 16; k++) {
      const u = k / 16;
      L(c, x - wf + u * wf * 2, y, x - wf + u * wf * 2, y + 9 * s, "#E0B2B2", 2 * s);
      L(c, x - wb + u * wb * 2, y - d, x - wb + u * wb * 2, y - d - 6 * s, "#E0B2B2", 1.5 * s);
    }
    if (o.pista) {
      // la esquina de adelante a la derecha levantada: se ve el revés
      const ex = x + wf,
        ey = y;
      P(c, [ex - 70 * s, ey, ex, ey, ex - 10 * s, ey - 46 * s], "#3A0C08");
      P(c, [ex - 70 * s, ey, ex - 10 * s, ey - 46 * s, ex - 30 * s, ey - 52 * s], "#E0B2B2");
      alfa(c, 0.4 + 0.3 * Math.sin(t * 2.4), () => P(c, [ex - 64 * s, ey - 2 * s, ex - 8 * s, ey - 2 * s, ex - 30 * s, ey - 20 * s], ORO2));
    }
  }

  // ---------- Trampilla ----------
  // Tablas con bandas de hierro y una argolla. o.abierta: la tapa queda parada atrás y se ve el agujero negro con el
  // primer peldaño de la escalera.
  function trampilla(c, x, y, t, o) {
    const s = o.s || 1,
      wb = 92 * s,
      wf = 106 * s,
      d = 62 * s;
    if (o.abierta) {
      // tapa parada contra el borde de atrás
      P(c, [x - wb, y - d, x + wb, y - d, x + wb - 6 * s, y - d - 120 * s, x - wb + 6 * s, y - d - 120 * s], MADERA[0]);
      for (let k = 1; k < 4; k++) L(c, x - wb + k * wb * 0.5, y - d, x - wb + 3 * s + k * wb * 0.5, y - d - 118 * s, MADERA_OSCURA, 2 * s);
      [0.3, 0.75].forEach((u) => R(c, x - wb + 4 * s, y - d - 120 * s * u - 5 * s, wb * 2 - 8 * s, 10 * s, HIERRO));
      // el agujero
      P(c, piso(x, y, wb, wf, d), "#050303");
      P(c, piso(x, y, wb, wf, 10 * s), "#1A0C08");
      // peldaños que bajan
      for (let k = 0; k < 2; k++) R(c, x - 40 * s, y - d + 18 * s + k * 20 * s, 80 * s, 6 * s, k ? "#3A1A10" : "#5E2A18");
      L(c, x - 44 * s, y - d + 4 * s, x - 40 * s, y - 4 * s, "#5E2A18", 6 * s);
      L(c, x + 44 * s, y - d + 4 * s, x + 40 * s, y - 4 * s, "#5E2A18", 6 * s);
      return;
    }
    P(c, piso(x, y + 4 * s, wb + 8 * s, wf + 8 * s, d + 8 * s), "#1A0A06");
    for (let i = 0; i < 5; i++) {
      const u0 = i / 5,
        u1 = (i + 1) / 5;
      P(c, [x - wb + u0 * wb * 2, y - d, x - wb + u1 * wb * 2, y - d, x - wf + u1 * wf * 2, y, x - wf + u0 * wf * 2, y], MADERA[i % 3]);
      L(c, x - wb + u1 * wb * 2, y - d, x - wf + u1 * wf * 2, y, MADERA_OSCURA, 2 * s);
    }
    [0.25, 0.72].forEach((u) => {
      const yy = y - d + d * u,
        w = wb + (wf - wb) * u;
      P(c, [x - w, yy - 4 * s, x + w, yy - 4 * s, x + w, yy + 5 * s, x - w, yy + 5 * s], HIERRO);
      for (let k = -2; k <= 2; k++) E(c, x + k * w * 0.42, yy, 3 * s, 3 * s, HIERRO2);
    });
    // argolla
    c.strokeStyle = ORO;
    c.lineWidth = 4 * s;
    c.beginPath();
    c.ellipse(x, y - d * 0.5, 16 * s, 9 * s, 0, 0, Math.PI * 2);
    c.stroke();
    alfa(c, 0.35 + 0.25 * Math.sin(t * 2), () => F.dibujar(c, "perthro", x + wb * 0.55, y - d * 0.28, 22 * s, MANA2, 2.4 * s));
  }

  // ---------- Escalera de mano ----------
  // Apoyada en la pared del sótano, sube hasta la trampilla abierta: arriba entra la luz de la casa.
  function escaleraMano(c, x, y, t, o) {
    const s = o.s || 1,
      h = 640 * s;
    halo(c, x, y - h + 40 * s, 260 * s, "#FFD98A", 0.5);
    alfa(c, 0.16, () => P(c, [x - 70 * s, y - h, x + 70 * s, y - h, x + 150 * s, y, x - 150 * s, y], "#FFD98A"));
    sombra(c, x, y + 4 * s, 80 * s, 12 * s, 0.4);
    L(c, x - 54 * s, y, x - 40 * s, y - h, "#5E2A18", 12 * s);
    L(c, x + 54 * s, y, x + 40 * s, y - h, "#5E2A18", 12 * s);
    L(c, x + 50 * s, y, x + 37 * s, y - h, "#7A3A20", 4 * s);
    for (let k = 1; k < 13; k++) {
      const yy = y - (k * h) / 13,
        w = 54 - (14 * k) / 13;
      L(c, x - w * s, yy, x + w * s, yy, k % 2 ? "#6A3020" : "#5E2A18", 8 * s);
    }
  }

  // ---------- Cajones ----------
  function cajas(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 10 * s, y + 4 * s, 130 * s, 14 * s, 0.45);
    const caja = (cx, cy, w, h, sem) => {
      P(c, [cx - w, cy, cx + w, cy, cx + w, cy - h, cx - w, cy - h], MADERA[sem % 3]);
      P(c, [cx + w, cy, cx + w + 16 * s, cy - 12 * s, cx + w + 16 * s, cy - h - 12 * s, cx + w, cy - h], MADERA_CLARA);
      P(c, [cx - w, cy - h, cx + w, cy - h, cx + w + 16 * s, cy - h - 12 * s, cx - w + 16 * s, cy - h - 12 * s], "#7A2A1A");
      L(c, cx - w, cy, cx + w, cy - h, MADERA_OSCURA, 4 * s);
      L(c, cx - w, cy - h, cx + w, cy, MADERA_OSCURA, 4 * s);
      R(c, cx - w, cy - h, w * 2, 6 * s, MADERA_OSCURA);
      R(c, cx - w, cy - 6 * s, w * 2, 6 * s, MADERA_OSCURA);
    };
    caja(x - 60 * s, y, 56 * s, 100 * s, 0);
    caja(x + 64 * s, y - 4 * s, 50 * s, 86 * s, 1);
    caja(x - 30 * s, y - 100 * s, 46 * s, 76 * s, 2);
    F.dibujar(c, "fehu", x - 60 * s, y - 20 * s, 30 * s, "#E0B2B2", 3 * s);
    // o.vela: un cabo de vela arriba, la única luz del sótano además de la trampilla
    if (o.vela) {
      const vx = x - 14 * s,
        vy = y - 184 * s,
        tit = Math.sin(t * 11 + x) * 2 * s;
      E(c, vx, vy + 2 * s, 14 * s, 5 * s, "#E0B2B2");
      R(c, vx - 7 * s, vy - 26 * s, 14 * s, 28 * s, "#F2ECEC");
      R(c, vx + 2 * s, vy - 26 * s, 5 * s, 28 * s, "#E0B2B2");
      halo(c, vx, vy - 38 * s, 40 * s, "#FF8D71", 0.5);
      P(c, [vx - 5 * s, vy - 28 * s, vx + tit, vy - 52 * s, vx + 5 * s, vy - 28 * s], "#FFD98A");
      P(c, [vx - 2 * s, vy - 28 * s, vx + tit * 0.5, vy - 40 * s, vx + 2 * s, vy - 28 * s], "#F2ECEC");
    }
  }

  // ---------- Atril con el libro de saber ----------
  // o.leido: el libro ya se leyó y las runas descansan.
  function atril(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 6 * s, y + 4 * s, 70 * s, 12 * s, 0.45);
    P(c, [x - 40 * s, y, x + 40 * s, y, x + 26 * s, y - 14 * s, x - 26 * s, y - 14 * s], MADERA_OSCURA);
    P(c, [x - 10 * s, y - 14 * s, x + 10 * s, y - 14 * s, x + 8 * s, y - 130 * s, x - 8 * s, y - 130 * s], MADERA[0]);
    P(c, [x - 70 * s, y - 120 * s, x + 70 * s, y - 120 * s, x + 56 * s, y - 170 * s, x - 56 * s, y - 170 * s], MADERA[2]);
    // libro abierto
    P(c, [x - 62 * s, y - 128 * s, x, y - 122 * s, x, y - 168 * s, x - 52 * s, y - 172 * s], "#F2ECEC");
    P(c, [x + 62 * s, y - 128 * s, x, y - 122 * s, x, y - 168 * s, x + 52 * s, y - 172 * s], "#E0B2B2");
    for (let k = 0; k < 4; k++) {
      L(c, x - 50 * s, y - 160 * s + k * 9 * s, x - 10 * s, y - 158 * s + k * 9 * s, "#2A2420", 1.6 * s);
      L(c, x + 10 * s, y - 158 * s + k * 9 * s, x + 48 * s, y - 160 * s + k * 9 * s, "#2A2420", 1.6 * s);
    }
    R(c, x - 2 * s, y - 128 * s, 4 * s, 34 * s, "#9C2315");
    if (!o.leido) {
      const a = 0.5 + 0.4 * Math.sin(t * 1.8);
      halo(c, x, y - 190 * s, 110 * s, MANA, a * 0.6);
      alfa(c, a, () => {
        F.dibujar(c, "ansuz", x - 24 * s, y - 182 * s, 24 * s, MANA2, 2.4 * s);
        F.dibujar(c, "mannaz", x + 24 * s, y - 186 * s, 24 * s, MANA2, 2.4 * s);
      });
    }
  }

  // ---------- Estante de rollos ----------
  function estanteRollos(c, x, y, t, o) {
    const s = o.s || 1,
      r = azar(o.sem || 3);
    P(c, [x - 130 * s, y, x + 130 * s, y, x + 130 * s, y - 330 * s, x - 130 * s, y - 330 * s], MADERA_OSCURA);
    for (let f = 0; f < 4; f++) {
      const fy = y - 20 * s - f * 80 * s;
      R(c, x - 130 * s, fy, 260 * s, 12 * s, MADERA[f % 3]);
      for (let k = 0; k < 7; k++) {
        if (r() < 0.2) continue;
        const rx = x - 110 * s + k * 34 * s,
          ry = fy - 16 * s - r() * 6 * s;
        E(c, rx, ry, 15 * s, 15 * s, r() < 0.5 ? "#F2ECEC" : "#E0B2B2");
        E(c, rx, ry, 6 * s, 6 * s, "#C9A07A");
        if (r() < 0.3) R(c, rx - 15 * s, ry - 3 * s, 30 * s, 6 * s, "#9C2315");
      }
    }
    R(c, x - 140 * s, y - 340 * s, 280 * s, 14 * s, MADERA_CLARA);
  }

  // ---------- Armero ----------
  // Hachas, una lanza y un escudo redondo viejo; todo con óxido.
  function armero(c, x, y, t, o) {
    const s = o.s || 1;
    R(c, x - 150 * s, y - 280 * s, 300 * s, 16 * s, MADERA[0]);
    R(c, x - 150 * s, y - 120 * s, 300 * s, 16 * s, MADERA[2]);
    [-140, 128].forEach((dx) => R(c, x + dx * s, y - 290 * s, 14 * s, 290 * s, MADERA_OSCURA));
    // hachas
    [-90, -30].forEach((dx, i) => {
      L(c, x + dx * s, y - 30 * s, x + dx * s, y - 300 * s, "#7A5634", 7 * s);
      P(c, [x + dx * s, y - 290 * s, x + (dx + 40) * s, y - 310 * s - i * 6 * s, x + (dx + 46) * s, y - 250 * s, x + dx * s, y - 260 * s], i ? "#6A6660" : "#8A5A3A");
    });
    // lanza
    L(c, x + 30 * s, y - 20 * s, x + 30 * s, y - 360 * s, "#7A5634", 6 * s);
    P(c, [x + 30 * s, y - 400 * s, x + 42 * s, y - 360 * s, x + 18 * s, y - 360 * s], "#8A8478");
    // escudo
    E(c, x + 92 * s, y - 190 * s, 52 * s, 56 * s, "#5E130D");
    E(c, x + 92 * s, y - 190 * s, 44 * s, 48 * s, "#9C2315");
    for (let k = 0; k < 4; k++) L(c, x + 92 * s, y - 190 * s, x + 92 * s + Math.cos(k * 1.57) * 44 * s, y - 190 * s + Math.sin(k * 1.57) * 48 * s, "#5E130D", 5 * s);
    E(c, x + 92 * s, y - 190 * s, 12 * s, 12 * s, "#8A8478");
    P(c, [x + 120 * s, y - 230 * s, x + 136 * s, y - 210 * s, x + 128 * s, y - 196 * s], "#111111");
  }

  // ---------- Tabla suelta ----------
  // Una tabla de la pared mal clavada. o.abierta: se ve el nicho con lo que alguien escondió.
  function tablaSuelta(c, x, y, t, o) {
    const s = o.s || 1;
    if (o.abierta) {
      P(c, [x - 44 * s, y - 40 * s, x + 44 * s, y - 40 * s, x + 44 * s, y - 190 * s, x - 44 * s, y - 190 * s], "#070404");
      R(c, x - 44 * s, y - 64 * s, 88 * s, 8 * s, "#2A1410");
      E(c, x - 14 * s, y - 72 * s, 10 * s, 6 * s, ORO);
      E(c, x + 6 * s, y - 74 * s, 10 * s, 6 * s, ORO2);
      // la tabla apoyada al lado
      P(c, [x + 56 * s, y, x + 96 * s, y, x + 82 * s, y - 170 * s, x + 48 * s, y - 170 * s], MADERA[1]);
      L(c, x + 66 * s, y - 20 * s, x + 64 * s, y - 150 * s, MADERA_OSCURA, 2 * s);
      return;
    }
    P(c, [x - 44 * s, y - 34 * s, x + 46 * s, y - 40 * s, x + 44 * s, y - 196 * s, x - 42 * s, y - 192 * s], MADERA[2]);
    L(c, x - 20 * s, y - 50 * s, x - 18 * s, y - 180 * s, MADERA_OSCURA, 2 * s);
    L(c, x + 18 * s, y - 52 * s, x + 20 * s, y - 182 * s, MADERA_OSCURA, 2 * s);
    // un clavo salido y una rendija oscura
    E(c, x + 30 * s, y - 180 * s, 4 * s, 4 * s, HIERRO2);
    L(c, x + 46 * s, y - 42 * s, x + 44 * s, y - 194 * s, "#050303", 4 * s);
    if (o.brillo) alfa(c, 0.4 + 0.35 * Math.sin(t * 3), () => halo(c, x + 44 * s, y - 120 * s, 46 * s, ORO2, 0.8));
  }

  // ---------- Cofre del sótano ----------
  // Más grande que el arcón de la casa, con bandas de hierro y la runa Othala. o.abierto: oro adentro.
  function cofreSotano(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 10 * s, y + 4 * s, 110 * s, 16 * s, 0.5);
    P(c, [x - 100 * s, y, x - 100 * s, y - 84 * s, x + 86 * s, y - 84 * s, x + 86 * s, y], MADERA[0]);
    P(c, [x + 86 * s, y, x + 86 * s, y - 84 * s, x + 110 * s, y - 100 * s, x + 110 * s, y - 16 * s], MADERA_CLARA);
    [-70, -10, 50].forEach((dx) => R(c, x + dx * s, y - 84 * s, 14 * s, 84 * s, HIERRO));
    if (o.abierto) {
      P(c, [x - 100 * s, y - 84 * s, x - 88 * s, y - 180 * s, x + 98 * s, y - 180 * s, x + 86 * s, y - 84 * s], MADERA[2]);
      P(c, [x - 92 * s, y - 86 * s, x + 84 * s, y - 86 * s, x + 106 * s, y - 100 * s, x - 70 * s, y - 100 * s], "#120806");
      for (let k = 0; k < 7; k++) E(c, x - 60 * s + k * 20 * s, y - 92 * s - (k % 2) * 4 * s, 10 * s, 6 * s, k % 2 ? ORO2 : ORO);
    } else {
      halo(c, x, y - 70 * s, 140 * s, ORO2, 0.25 + 0.15 * Math.sin(t * 2));
      P(c, [x - 100 * s, y - 84 * s, x - 82 * s, y - 120 * s, x + 104 * s, y - 120 * s, x + 110 * s, y - 100 * s, x + 86 * s, y - 84 * s], MADERA[2]);
      [-70, -10, 50].forEach((dx) => P(c, [x + dx * s, y - 84 * s, x + (dx + 6) * s, y - 120 * s, x + (dx + 20) * s, y - 120 * s, x + (dx + 14) * s, y - 84 * s], HIERRO));
      R(c, x - 14 * s, y - 92 * s, 28 * s, 30 * s, ORO);
      F.dibujar(c, "othala", x - 40 * s, y - 16 * s, 40 * s, ORO2, 4 * s);
    }
  }

  // ---------- Huesos ----------
  // Alguien que bajó y no volvió: sentado contra la pared, con el yelmo caído y la espada oxidada.
  function huesos(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x, y + 4 * s, 90 * s, 12 * s, 0.4);
    const H = "#E8DED6",
      H2 = "#C9BFB4";
    // piernas estiradas
    L(c, x - 10 * s, y - 30 * s, x + 70 * s, y - 6 * s, H, 7 * s);
    L(c, x + 4 * s, y - 26 * s, x + 80 * s, y + 2 * s, H2, 6 * s);
    // costillas
    L(c, x - 20 * s, y - 40 * s, x - 26 * s, y - 120 * s, H, 6 * s);
    for (let k = 0; k < 4; k++) c.beginPath(), (c.strokeStyle = H2), (c.lineWidth = 4 * s), c.ellipse(x - 24 * s, y - 60 * s - k * 14 * s, 22 * s, 7 * s, 0, Math.PI * 1.1, Math.PI * 1.9 + 0.6), c.stroke();
    // cráneo caído hacia un lado
    E(c, x - 14 * s, y - 140 * s, 20 * s, 18 * s, H);
    E(c, x - 20 * s, y - 142 * s, 5 * s, 5 * s, "#111111");
    E(c, x - 6 * s, y - 142 * s, 5 * s, 5 * s, "#111111");
    // yelmo en el piso
    P(c, [x - 90 * s, y, x - 86 * s, y - 30 * s, x - 66 * s, y - 44 * s, x - 46 * s, y - 30 * s, x - 42 * s, y], "#6A6660");
    R(c, x - 70 * s, y - 34 * s, 8 * s, 34 * s, "#4A4448");
    // espada
    L(c, x + 30 * s, y - 60 * s, x + 110 * s, y - 120 * s, "#8A5A3A", 6 * s);
    L(c, x + 20 * s, y - 52 * s, x - 4 * s, y - 34 * s, "#4A3A2A", 6 * s);
  }

  // ---------- Cesto de la despensa ----------
  // Canasto de mimbre con papas, zanahorias y un repollo, como en la despensa de la lámina.
  function cesto(c, x, y, t, o) {
    const s = o.s || 1,
      r = azar(Math.round((o.sem || 0) * 1000) + 7);
    sombra(c, x + 6 * s, y + 4 * s, 80 * s, 12 * s, 0.45);
    P(c, [x - 70 * s, y - 70 * s, x + 70 * s, y - 70 * s, x + 56 * s, y, x - 56 * s, y], "#8A6A3E");
    P(c, [x - 70 * s, y - 70 * s, x, y - 70 * s, x, y, x - 56 * s, y], "#6E5230");
    for (let k = 1; k < 4; k++) L(c, x - 70 * s + k * 3 * s, y - 70 * s + k * 17 * s, x + 70 * s - k * 3 * s, y - 70 * s + k * 17 * s, "#5A4224", 3 * s);
    for (let k = 0; k < 9; k++) {
      const px = x - 54 * s + r() * 108 * s,
        py = y - 74 * s - r() * 22 * s,
        tipo = Math.floor(r() * 3);
      if (tipo === 0) E(c, px, py, 13 * s, 10 * s, "#B8905A");
      else if (tipo === 1) P(c, [px - 14 * s, py - 4 * s, px + 14 * s, py - 6 * s, px + 2 * s, py + 6 * s], "#D8702A");
      else E(c, px, py - 4 * s, 16 * s, 14 * s, "#6F8F4E");
    }
    P(c, [x - 72 * s, y - 74 * s, x + 72 * s, y - 74 * s, x + 70 * s, y - 66 * s, x - 70 * s, y - 66 * s], "#9A7A4A");
  }

  // ---------- El muro falso del escondite ----------
  // Un panel de tablas que se abre como una puerta y deja ver el túnel de tierra oscura que sigue adentro.
  function muroFalso(c, x, y, t, o) {
    const s = o.s || 1;
    // el hueco y el túnel
    P(c, [x - 90 * s, y, x + 90 * s, y, x + 90 * s, y - 300 * s, x - 90 * s, y - 300 * s], "#0C0A0A");
    P(c, [x - 60 * s, y - 20 * s, x + 70 * s, y - 20 * s, x + 50 * s, y - 230 * s, x - 40 * s, y - 230 * s], "#1A1A22");
    P(c, [x - 30 * s, y - 60 * s, x + 40 * s, y - 60 * s, x + 26 * s, y - 180 * s, x - 18 * s, y - 180 * s], "#232836");
    alfa(c, 0.4, () => E(c, x + 6 * s, y - 120 * s, 30 * s, 50 * s, "#3A4A6A"));
    for (let k = 0; k < 4; k++) P(c, [x - 70 * s + k * 10 * s, y - 40 * s - k * 46 * s, x - 50 * s + k * 10 * s, y - 60 * s - k * 46 * s, x - 56 * s + k * 10 * s, y - 30 * s - k * 46 * s], "#2A2420");
    // el marco
    R(c, x - 100 * s, y - 310 * s, 20 * s, 310 * s, "#3E2818");
    R(c, x + 80 * s, y - 310 * s, 20 * s, 310 * s, "#3E2818");
    R(c, x - 100 * s, y - 320 * s, 200 * s, 20 * s, "#5C3E2C");
    // el panel abierto, de canto hacia nosotros
    P(c, [x + 100 * s, y, x + 170 * s, y + 30 * s, x + 170 * s, y - 280 * s, x + 100 * s, y - 310 * s], "#55382A");
    P(c, [x + 100 * s, y, x + 120 * s, y + 9 * s, x + 120 * s, y - 302 * s, x + 100 * s, y - 310 * s], "#40281A");
    for (let k = 1; k < 4; k++) L(c, x + 100 * s, y - k * 78 * s, x + 170 * s, y + 30 * s - k * 78 * s, "#2A1A10", 3 * s);
    R(c, x + 150 * s, y - 150 * s, 8 * s, 18 * s, HIERRO2);
  }

  // ---------- Sacos ----------
  function sacos(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x, y + 4 * s, 90 * s, 12 * s, 0.45);
    [[-36, 0, 1], [30, 4, 0.9], [-4, -36, 0.85]].forEach(([dx, dy, k]) => {
      const px = x + dx * s,
        py = y + dy * s,
        w = 44 * s * k,
        h = 70 * s * k;
      P(c, [px - w, py, px - w * 1.1, py - h * 0.6, px - w * 0.5, py - h, px + w * 0.5, py - h, px + w * 1.1, py - h * 0.6, px + w, py], "#8A7A5A");
      P(c, [px - w, py, px - w * 1.1, py - h * 0.6, px - w * 0.5, py - h, px, py - h, px, py], "#6E6044");
      P(c, [px - w * 0.3, py - h, px + w * 0.3, py - h, px + w * 0.2, py - h - 14 * s, px - w * 0.2, py - h - 14 * s], "#5A4E36");
      L(c, px - w * 0.4, py - h + 4 * s, px + w * 0.4, py - h + 4 * s, "#3A2E1E", 3 * s);
    });
    // una manta roja tirada encima
    P(c, [x - 40 * s, y - 60 * s, x + 20 * s, y - 70 * s, x + 30 * s, y - 20 * s, x - 30 * s, y - 10 * s], "#9C2315");
    P(c, [x - 40 * s, y - 60 * s, x - 10 * s, y - 65 * s, x - 4 * s, y - 14 * s, x - 30 * s, y - 10 * s], "#7A1A10");
  }

  // ---------- Cántaros del sótano viejo ----------
  function cantaros(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x, y + 4 * s, 80 * s, 12 * s, 0.45);
    [[-40, 1], [10, 1.25], [52, 0.85]].forEach(([dx, k]) => {
      const px = x + dx * s,
        w = 26 * s * k,
        h = 90 * s * k;
      P(c, [px - w * 0.7, y, px - w, y - h * 0.4, px - w * 0.6, y - h * 0.85, px - w * 0.3, y - h, px + w * 0.3, y - h, px + w * 0.6, y - h * 0.85, px + w, y - h * 0.4, px + w * 0.7, y], "#7A5A44");
      P(c, [px - w * 0.7, y, px - w, y - h * 0.4, px - w * 0.6, y - h * 0.85, px - w * 0.3, y - h, px, y - h, px, y], "#5E4434");
      R(c, px - w * 0.4, y - h - 6 * s, w * 0.8, 8 * s, "#4A3628");
    });
  }

  // ======================================================================
  //  ARMADOS CON CARAS (todo girable, comun/volumen.js)
  // ======================================================================
  const MT = [MADERA_OSCURA, MADERA[0], MADERA_CLARA],
    HT = ["#2A2428", HIERRO, HIERRO2],
    tono3 = (col) => [VOL.mezcla(col, "#000000", 0.3), col, VOL.mezcla(col, "#FFFFFF", 0.18)];
  // la escalera de mano apoyada contra la pared del sótano, con la luz que entra por la trampilla
  function escaleraManoV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      h = 640,
      fondo = -110;
    VOL.halo(c, pr, 0, fondo, h - 40, 260, "#FFD98A", 0.5);
    VOL.sombra(c, pr, 0, -40, 80, 50, 0.4);
    [-1, 1].forEach((l) => VOL.palo(c, pr, l * 54, 0, 0, l * 40, fondo, h, 12, "#5E2A18"));
    for (let k = 1; k < 13; k++) {
      const f = k / 13,
        w = 54 - 14 * f;
      VOL.palo(c, pr, -w, fondo * f, h * f, w, fondo * f, h * f, 8, k % 2 ? "#6A3020" : "#5E2A18");
    }
  }
  // los cajones: tres cajas con sus cruces (Fehu en la de abajo) y el cabo de vela arriba
  function cajasV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      cruz = (fehu) => (cc, l, h) => {
        L(cc, 0, 0, l, -h, MADERA_OSCURA, 4);
        L(cc, 0, -h, l, 0, MADERA_OSCURA, 4);
        R(cc, 0, -h, l, 6, MADERA_OSCURA);
        R(cc, 0, -6, l, 6, MADERA_OSCURA);
        if (fehu) F.dibujar(cc, "fehu", l / 2, -20, 30, "#E0B2B2", 3);
      },
      caja = (u, w, a, f, h, z, sem, fehu) => VOL.cubo(c, pr, u, w, a, f, h, [MADERA_OSCURA, MADERA[sem % 3], MADERA_CLARA], { frente: cruz(fehu), atras: cruz(), izq: cruz(), der: cruz(), tapa: "#7A2A1A" }, z);
    VOL.sombra(c, pr, 10, 0, 134, 60, 0.45);
    caja(-60, 0, 112, 90, 100, 0, 0, true);
    caja(64, -6, 100, 80, 86, 0, 1);
    caja(-30, 0, 92, 76, 76, 100, 2);
    if (o.vela) {
      const p = pr(-14, 0, 176),
        s = pr.s,
        tit = Math.sin(t * 11 + x) * 2 * s;
      VOL.elipse(c, pr, -14, 0, 176.5, 14, 10, "#E0B2B2");
      VOL.cilindro(c, pr, -14, 0, 7, 176, 204, ["#C8B8B0", "#F2ECEC", "#FFFFFF"], { n: 6 });
      DIB.halo(c, p[0], p[1] - 38 * s, 40 * s, "#FF8D71", 0.5);
      P(c, [p[0] - 5 * s, p[1] - 28 * s, p[0] + tit, p[1] - 52 * s, p[0] + 5 * s, p[1] - 28 * s], "#FFD98A");
    }
  }
  // el atril: la base, el pie, la tabla inclinada con el libro abierto y las runas que flotan
  function atrilV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 6, 0, 70, 40, 0.45);
    VOL.prisma(c, pr, [[-40, -30], [40, -30], [40, 30], [-40, 30]], 0, 14, MT);
    VOL.cubo(c, pr, 0, 0, 18, 18, 116, MT, null, 14);
    VOL.aguaUna(c, pr, -70, -30, 172, 70, 30, 122, MT, {
      grueso: 6,
      fn: (cc, l, h) => {
        P(cc, [8, -6, l / 2, -2, l / 2, -h + 4, 14, -h + 2], "#F2ECEC");
        P(cc, [l - 8, -6, l / 2, -2, l / 2, -h + 4, l - 14, -h + 2], "#E0B2B2");
        for (let k = 0; k < 4; k++) {
          L(cc, 20, -h + 14 + k * 9, l / 2 - 8, -h + 16 + k * 9, "#2A2420", 1.6);
          L(cc, l / 2 + 8, -h + 16 + k * 9, l - 22, -h + 14 + k * 9, "#2A2420", 1.6);
        }
        R(cc, l / 2 - 2, -h + 4, 4, h - 4, "#9C2315");
      },
    });
    if (!o.leido) {
      const a = 0.5 + 0.4 * Math.sin(t * 1.8),
        q = pr(0, 0, 190),
        s = pr.s;
      DIB.halo(c, q[0], q[1], 110 * s, MANA, a * 0.6);
      alfa(c, a, () => {
        F.dibujar(c, "ansuz", q[0] - 24 * s, q[1] + 8 * s, 24 * s, MANA2, 2.4 * s);
        F.dibujar(c, "mannaz", q[0] + 24 * s, q[1] + 4 * s, 24 * s, MANA2, 2.4 * s);
      });
    }
  }
  // el estante de rollos: el mueble, las cuatro tablas y los rollos con la punta hacia afuera (algunos atados)
  function estanteRollosV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      r = azar(o.sem || 3),
      S = VOL.escena(pr);
    VOL.caja(c, pr, -130, -40, 0, 130, -30, 330, MT);
    [-130, 120].forEach((u) => VOL.caja(c, pr, u, -30, 0, u + 10, 30, 330, MT));
    VOL.caja(c, pr, -140, -42, 326, 140, 32, 340, MT);
    for (let f = 0; f < 4; f++) {
      const z = 20 + f * 80;
      S.poner(0, 0, () => {
        VOL.caja(c, pr, -120, -30, z - 12, 120, 30, z, MT);
        for (let k = 0; k < 7; k++) {
          if (r() < 0.2) continue;
          const u = -100 + k * 33,
            claro = r() < 0.5,
            atado = r() < 0.3,
            zz = z + 15 + r() * 4;
          VOL.rollo(c, VOL.sub(pr, u, 0, 0, Math.PI / 2), -24, 26, 0, zz, 15, claro ? ["#C8C0B8", "#F2ECEC", "#FFFFFF"] : ["#B88A8A", "#E0B2B2", "#F2D2D2"], { n: 7, corte: "#C9A07A" });
          if (atado) VOL.rollo(c, VOL.sub(pr, u, 0, 0, Math.PI / 2), 0, 6, 0, zz, 15.5, ["#5E130D", "#9C2315", "#C8402D"], { n: 7 });
        }
      }, z);
    }
    S.dibujar();
  }
  // el armero: los parantes y los dos travesaños, las hachas, la lanza y el escudo redondo viejo
  function armeroV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr);
    [-133, 135].forEach((u) => S.poner(u, -20, () => VOL.cubo(c, pr, u, -20, 14, 14, 290, MT)));
    S.poner(0, -20, () => {
      VOL.caja(c, pr, -150, -26, 264, 150, -14, 280, MT);
      VOL.caja(c, pr, -150, -26, 104, 150, -14, 120, MT);
    });
    [-90, -30].forEach((u, i) =>
      S.poner(u, 0, () => {
        VOL.palo(c, pr, u, 0, 30, u, -8, 300, 7, "#7A5634");
        VOL.plano(c, pr, u, u + 46, -6, 250, 310 + i * 6, null, (cc, l, h) => P(cc, [0, -h + 20, l - 6, -h, l, -10, 0, -14], i ? "#6A6660" : "#8A5A3A"));
      }),
    );
    S.poner(30, 0, () => {
      VOL.palo(c, pr, 30, 0, 20, 30, -8, 360, 6, "#7A5634");
      VOL.piramide(c, pr, VOL.redonda(30, -8, 8, 4), 360, 30, -8, 400, ["#6A6458", "#8A8478", "#A8A298"]);
    });
    S.poner(92, 6, () => {
      const p2 = VOL.sub(pr, 92, 6, 0);
      VOL.plano(c, p2, -52, 52, 0, 134, 246, null, (cc, l, h) => {
        E(cc, l / 2, -h / 2, 52, 56, "#5E130D");
        E(cc, l / 2, -h / 2, 44, 48, "#9C2315");
        for (let k = 0; k < 4; k++) L(cc, l / 2, -h / 2, l / 2 + Math.cos(k * 1.57) * 44, -h / 2 + Math.sin(k * 1.57) * 48, "#5E130D", 5);
        E(cc, l / 2, -h / 2, 12, 12, "#8A8478");
      }, (cc, l, h) => {
        E(cc, l / 2, -h / 2, 52, 56, "#3A0C08");
        L(cc, l / 2 - 40, -h / 2, l / 2 + 40, -h / 2, "#5E4030", 8);
      });
    });
    S.dibujar();
  }
  // la tabla suelta de la pared: la tabla mal clavada con su clavo y la rendija; abierta, el nicho con el oro y la
  // tabla apoyada al lado
  function tablaSueltaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    if (o.abierta) {
      VOL.plano(c, pr, -44, 44, 0, 40, 190, "#070404", (cc, l, h) => {
        R(cc, 0, -24, l, 8, "#2A1410");
        E(cc, l / 2 - 14, -32, 10, 6, ORO);
        E(cc, l / 2 + 6, -34, 10, 6, ORO2);
      });
      VOL.caja(c, VOL.sub(pr, 72, 10, 0, 0), -20, -4, 0, 20, 4, 170, MT);
      return;
    }
    VOL.caja(c, pr, -44, -2, 34, 46, 4, 196, MT, {
      frente: (cc, l, h) => {
        L(cc, 24, -10, 26, -h + 10, MADERA_OSCURA, 2);
        L(cc, 62, -10, 64, -h + 10, MADERA_OSCURA, 2);
        E(cc, 74, -h + 14, 4, 4, HIERRO2);
        L(cc, l - 1, 0, l - 1, -h, "#050303", 4);
      },
    });
    if (o.brillo) alfa(c, 0.4 + 0.35 * Math.sin(t * 3), () => VOL.halo(c, pr, 44, 4, 120, 46, ORO2, 0.8));
  }
  // el cofre del sótano: más grande que el arcón, con tres bandas de hierro, el cierre dorado y Othala
  function cofreSotanoV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      bandas = (cc, l, h) => [30, l / 2 - 7, l - 44].forEach((u) => R(cc, u, -h, 14, h, HIERRO));
    VOL.sombra(c, pr, 10, 0, 114, 54, 0.5);
    VOL.caja(c, pr, -100, -40, 0, 100, 40, 84, MT, {
      frente: (cc, l, h) => {
        bandas(cc, l, h);
        if (!o.abierto) {
          R(cc, l / 2 - 14, -h, 28, 30, ORO);
          F.dibujar(cc, "othala", l / 2 - 40, -16, 40, ORO2, 4);
        }
      },
      atras: bandas,
      tapa: o.abierto ? "#120806" : null,
    });
    if (o.abierto) {
      for (let k = 0; k < 7; k++) VOL.elipse(c, pr, -60 + k * 20, (k % 2) * 10 - 5, 80, 10, 8, k % 2 ? ORO2 : ORO);
      VOL.caja(c, VOL.sub(pr, 0, -40, 84), -100, -10, 0, 100, 0, 96, MT, { frente: bandas });
      return;
    }
    VOL.halo(c, pr, 0, 0, 70, 140, ORO2, 0.25 + 0.15 * Math.sin(t * 2));
    VOL.boveda(c, pr, -100, 100, -40, 40, 84, 36, [MADERA_OSCURA, MADERA[2], MADERA_CLARA]);
    [-70, -10, 50].forEach((u) => VOL.boveda(c, pr, u, u + 14, -40.5, 40.5, 84, 36.5, HT));
  }
  // los huesos: el esqueleto sentado contra la pared, el cráneo caído, el yelmo en el piso y la espada oxidada
  function huesosV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      H = "#E8DED6",
      H2 = "#C9BFB4";
    VOL.sombra(c, pr, 0, 0, 90, 40, 0.4);
    VOL.palo(c, pr, -10, -10, 4, 70, 20, 4, 7, H);
    VOL.palo(c, pr, 4, -4, 4, 80, 30, 4, 6, H2);
    VOL.palo(c, pr, -20, -24, 10, -26, -30, 100, 6, H);
    for (let k = 0; k < 4; k++) VOL.palo(c, pr, -40, -22, 40 + k * 14, -8, -22, 40 + k * 14, 4, H2);
    VOL.cilindro(c, pr, -14, -26, 18, 102, 126, ["#B8AEA4", H, "#FFFFFF"], { n: 8 });
    VOL.plano(c, pr, -26, -2, -8, 108, 124, null, (cc, l, h) => {
      E(cc, l * 0.3, -h * 0.55, 5, 5, "#111111");
      E(cc, l * 0.7, -h * 0.55, 5, 5, "#111111");
    }, () => {});
    VOL.cono(c, pr, -66, 20, 24, 10, 0, 40, ["#4A4448", "#6A6660", "#86827E"], { n: 8 });
    VOL.palo(c, pr, 30, 10, 50, 110, 10, 110, 6, "#8A5A3A");
    VOL.palo(c, pr, 20, 10, 44, -4, 10, 30, 6, "#4A3A2A");
  }
  // el cesto de la despensa: el canasto de mimbre con sus vueltas y las papas, zanahorias y repollos encima
  function cestoV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      r = azar(Math.round((o.sem || 0) * 1000) + 7);
    VOL.sombra(c, pr, 6, 0, 80, 50, 0.45);
    VOL.cono(c, pr, 0, 0, 56, 70, 0, 70, ["#5A4224", "#8A6A3E", "#A88450"], { n: 12, sinTapa: true });
    [20, 38, 56].forEach((z) => VOL.cono(c, pr, 0, 0, 56 + z * 0.2, 56 + z * 0.2 + 0.4, z, z + 3, ["#4A3418", "#5A4224", "#6A5230"], { n: 12, sinTapa: true }));
    VOL.elipse(c, pr, 0, 0, 66, 66, 66, "#6E5230");
    const S = VOL.escena(pr);
    for (let k = 0; k < 9; k++) {
      const a = r() * Math.PI * 2,
        d = r() * 44,
        u = Math.cos(a) * d,
        w = Math.sin(a) * d,
        tipo = Math.floor(r() * 3);
      S.poner(u, w, () => {
        if (tipo === 0) VOL.prisma(c, pr, VOL.redonda(u, w, 13, 6, k, 10), 66, 78, tono3("#B8905A"));
        else if (tipo === 1) VOL.palo(c, pr, u - 12, w, 72, u + 12, w + 4, 74, 8, "#D8702A");
        else VOL.cilindro(c, pr, u, w, 16, 66, 88, tono3("#6F8F4E"), { n: 7 });
      });
    }
    S.dibujar();
    VOL.cono(c, pr, 0, 0, 72, 72.5, 66, 72, ["#7A5A34", "#9A7A4A", "#B89660"], { n: 12, sinTapa: true });
  }
  // el muro falso: el marco, el hueco con el túnel de tierra que sigue y el panel de tablas abierto como una puerta
  function muroFalsoV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      MR = ["#2A1A10", "#3E2818", "#5C3E2C"];
    VOL.plano(c, pr, -90, 90, 0, 0, 300, "#0C0A0A", (cc, l, h) => {
      P(cc, [30, -20, 160, -20, 140, -230, 50, -230], "#1A1A22");
      P(cc, [60, -60, 130, -60, 116, -180, 72, -180], "#232836");
      alfa(cc, 0.4, () => E(cc, 96, -120, 30, 50, "#3A4A6A"));
    });
    [-90, 90].forEach((u) => VOL.cubo(c, pr, u, 0, 20, 20, 310, MR));
    VOL.caja(c, pr, -100, -10, 300, 100, 10, 320, MR);
    const p2 = VOL.sub(pr, 100, 0, 0, 1.1);
    VOL.caja(c, p2, 0, 0, 0, 180, 10, 300, ["#40281A", "#55382A", "#6A4836"], {
      frente: (cc, l, h) => {
        for (let k = 1; k < 4; k++) L(cc, 0, -k * 78, l, -k * 78, "#2A1A10", 3);
        R(cc, l - 30, -150, 8, 18, HIERRO2);
      },
      atras: (cc, l, h) => {
        for (let k = 1; k < 4; k++) L(cc, 0, -k * 78, l, -k * 78, "#2A1A10", 3);
      },
    });
  }
  // los sacos: tres bolsas atadas y la manta roja tirada encima
  function sacosV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      SA = ["#5A4E36", "#8A7A5A", "#A8966E"];
    VOL.sombra(c, pr, 0, 0, 90, 50, 0.45);
    [[-36, 10, 0, 1], [30, 14, 0, 0.9], [-4, -20, 50, 0.85]].forEach(([u, w, z, k]) =>
      S.poner(u, w, () => {
        const r = 44 * k,
          h = 70 * k;
        VOL.cono(c, pr, u, w, r, r * 1.1, z, z + h * 0.6, SA, { n: 9, sinTapa: true });
        VOL.cono(c, pr, u, w, r * 1.1, r * 0.4, z + h * 0.6, z + h, SA, { n: 9 });
        VOL.cono(c, pr, u, w, r * 0.3, r * 0.2, z + h, z + h + 14, ["#3A2E1E", "#5A4E36", "#6E6044"], { n: 6 });
      }, z),
    );
    S.poner(0, 30, () => VOL.prisma(c, pr, [[-40, -10], [20, -20], [30, 40], [-30, 46]], 40, 46, ["#5E130D", "#7A1A10", "#9C2315"]), 60);
    S.dibujar();
  }
  // los cántaros: tres de barro, panzones, con el cuello angosto
  function cantarosV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      BA = ["#4A3628", "#7A5A44", "#946E54"];
    VOL.sombra(c, pr, 0, 0, 80, 40, 0.45);
    [[-40, 0, 1], [10, -10, 1.25], [52, 6, 0.85]].forEach(([u, w, k]) =>
      S.poner(u, w, () => {
        const r = 26 * k,
          h = 90 * k;
        VOL.cono(c, pr, u, w, r * 0.7, r, 0, h * 0.4, BA, { n: 10, sinTapa: true });
        VOL.cono(c, pr, u, w, r, r * 0.6, h * 0.4, h * 0.85, BA, { n: 10, sinTapa: true });
        VOL.cono(c, pr, u, w, r * 0.6, r * 0.35, h * 0.85, h, BA, { n: 10 });
        VOL.cilindro(c, pr, u, w, r * 0.4, h, h + 8, ["#3A2618", "#4A3628", "#5E4434"], { n: 10, tapa: "#1A120C" });
      }),
    );
    S.dibujar();
  }

  Object.assign(ASSETS.LISTA, {
    alfombra: { f: alfombra, alto: 90, choque: null, grupo: "interiores", piso: true },
    trampilla: { f: trampilla, alto: 190, choque: null, grupo: "interiores", piso: true },
    escaleraMano: { f: escaleraMano, fv: escaleraManoV, vol: true, alto: 640, choque: null, grupo: "interiores" },
    cajas: { f: cajas, fv: cajasV, vol: true, alto: 200, choque: null, grupo: "interiores" },
    atril: { f: atril, fv: atrilV, vol: true, alto: 220, choque: null, grupo: "interiores" },
    estanteRollos: { f: estanteRollos, fv: estanteRollosV, vol: true, alto: 360, choque: null, grupo: "interiores" },
    armero: { f: armero, fv: armeroV, vol: true, alto: 400, choque: null, grupo: "interiores" },
    tablaSuelta: { f: tablaSuelta, fv: tablaSueltaV, vol: true, alto: 200, choque: null, grupo: "interiores" },
    cofreSotano: { f: cofreSotano, fv: cofreSotanoV, vol: true, alto: 180, choque: null, grupo: "interiores" },
    huesos: { f: huesos, fv: huesosV, vol: true, alto: 160, choque: null, grupo: "interiores" },
    cesto: { f: cesto, fv: cestoV, vol: true, alto: 110, choque: null, grupo: "interiores" },
    muroFalso: { f: muroFalso, fv: muroFalsoV, vol: true, alto: 330, choque: null, grupo: "interiores" },
    sacos: { f: sacos, fv: sacosV, vol: true, alto: 110, choque: null, grupo: "interiores" },
    cantaros: { f: cantaros, fv: cantarosV, vol: true, alto: 120, choque: null, grupo: "interiores" },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, { alfombra: { pista: true }, tablaSuelta: { brillo: true } });
})();
