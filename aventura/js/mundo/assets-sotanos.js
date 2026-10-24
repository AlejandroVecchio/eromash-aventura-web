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

  Object.assign(ASSETS.LISTA, {
    alfombra: { f: alfombra, alto: 90, choque: null, grupo: "interiores", piso: true },
    trampilla: { f: trampilla, alto: 190, choque: null, grupo: "interiores", piso: true },
    escaleraMano: { f: escaleraMano, alto: 640, choque: null, grupo: "interiores" },
    cajas: { f: cajas, alto: 200, choque: null, grupo: "interiores" },
    atril: { f: atril, alto: 220, choque: null, grupo: "interiores" },
    estanteRollos: { f: estanteRollos, alto: 360, choque: null, grupo: "interiores" },
    armero: { f: armero, alto: 400, choque: null, grupo: "interiores" },
    tablaSuelta: { f: tablaSuelta, alto: 200, choque: null, grupo: "interiores" },
    cofreSotano: { f: cofreSotano, alto: 180, choque: null, grupo: "interiores" },
    huesos: { f: huesos, alto: 160, choque: null, grupo: "interiores" },
    cesto: { f: cesto, alto: 110, choque: null, grupo: "interiores" },
    muroFalso: { f: muroFalso, alto: 330, choque: null, grupo: "interiores" },
    sacos: { f: sacos, alto: 110, choque: null, grupo: "interiores" },
    cantaros: { f: cantaros, alto: 120, choque: null, grupo: "interiores" },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, { alfombra: { pista: true }, tablaSuelta: { brillo: true } });
})();
