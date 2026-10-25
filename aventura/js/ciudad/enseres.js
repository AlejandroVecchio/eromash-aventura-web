// ---------- lo chico de la ciudad en volumen (módulo ENSERES25) ----------
// Carros, huertas, leña, la forja de Ása, tablones, mesas, estantes, tendederos, lonas, troncos, heno, dianas,
// estandartes y carteles: todo lo que tiene forma va con sus tres medidas y su giro en el piso, así al girar la cámara
// se ve de otro lado (antes eran dibujos de frente que quedaban siempre mirando a la pantalla). Caras planas, luz de
// arriba a la derecha, la paleta de la arena. Solo la gente, los animales y lo redondo (pinos, barriles, braseros)
// siguen como figuras.
// En el plano de cada cosa u va a lo largo y w de frente (w+ es el frente).
//   ENSERES25.<nombre>(sem, op) → { dibujar(c, x, y, giro, k, t), alto, piso? }
window.ENSERES25 = (function () {
  "use strict";
  const { P, E, L, alfa, halo, azar, sombra } = DIB;
  const C = ASSETS.C;
  const MAD = [C.maderaSombra, C.madera, C.maderaLuz];
  const PIEDRA = ["#4A4640", "#5A5650", "#6E6A62"];

  // ¿la cara de normal (nu, nw, nz) mira a la cámara? La cámara está hacia +frente y +arriba (frente·1 + arriba·k)
  const ve = (pr, k, nu, nw, nz) => pr.mira(nu, nw)[1] + nz * k > 0.01;
  const tono = (pr, nu, nw, nz, t) => (nz > 0.6 ? t[2] : pr.mira(nu, nw)[0] > 0.25 ? t[2] : pr.mira(nu, nw)[0] < -0.25 ? t[0] : t[1]);

  // una caja: las caras de costado que se ven y la tapa
  function caja(c, pr, k, u0, u1, w0, w1, z0, z1, t, tapa) {
    const caras = [
      [[u0, w1], [u1, w1], 0, 1],
      [[u1, w1], [u1, w0], 1, 0],
      [[u1, w0], [u0, w0], 0, -1],
      [[u0, w0], [u0, w1], -1, 0],
    ];
    for (const [a, b, nu, nw] of caras) {
      if (!ve(pr, k, nu, nw, 0)) continue;
      P(c, [...pr(a[0], a[1], z0), ...pr(b[0], b[1], z0), ...pr(b[0], b[1], z1), ...pr(a[0], a[1], z1)], tono(pr, nu, nw, 0, t));
    }
    if (tapa !== false) P(c, [...pr(u0, w0, z1), ...pr(u1, w0, z1), ...pr(u1, w1, z1), ...pr(u0, w1, z1)], tapa || t[2]);
  }

  // un perfil (en el plano w-z, en sentido antihorario visto desde u+) estirado a lo largo de u, con sus dos tapas
  function estirado(c, pr, k, u0, u1, perfil, t, tTapa) {
    const n = perfil.length;
    for (let i = 0; i < n; i++) {
      const [w0, z0] = perfil[i],
        [w1, z1] = perfil[(i + 1) % n];
      const nw = z1 - z0,
        nz = -(w1 - w0),
        l = Math.hypot(nw, nz) || 1;
      if (!ve(pr, k, 0, nw / l, nz / l)) continue;
      P(c, [...pr(u0, w0, z0), ...pr(u0, w1, z1), ...pr(u1, w1, z1), ...pr(u1, w0, z0)], tono(pr, 0, nw / l, nz / l, t));
    }
    for (const [u, s] of [[u0, -1], [u1, 1]]) if (ve(pr, k, s, 0, 0)) P(c, perfil.flatMap(([w, z]) => pr(u, w, z)), tTapa || tono(pr, s, 0, 0, t));
  }
  const circulo = (r, n = 8, cz = 0) => Array.from({ length: n }, (_, i) => [Math.cos((i / n) * Math.PI * 2) * r, cz + Math.sin((i / n) * Math.PI * 2) * r]);

  // un disco parado en el plano u-z (rueda, diana, punta de leño), a la altura w
  function disco(c, pr, u, w, z, r, col, n = 12) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push(...pr(u + Math.cos(a) * r, w, z + Math.sin(a) * r));
    }
    P(c, pts, col);
  }
  // un palo de (u0, w0, z0) a (u1, w1, z1)
  const palo = (c, pr, a, b, col, g) => {
    const p = pr(...a),
      q = pr(...b);
    L(c, p[0], p[1], q[0], q[1], col, g);
  };
  // dibuja las partes de lejos a cerca ([fondo, f])
  const enOrden = (partes) => partes.sort((a, b) => a[0] - b[0]).forEach((p) => p[1]());

  // ---------- la huerta: canteros bajos con sus plantas, el cerco de mimbre; va en el piso ----------
  // op: { W, D } en unidades (60 por metro)
  function huerta(sem, op) {
    const W = op.W,
      D = op.D,
      r = azar(sem * 71 + 3);
    const n = Math.max(2, Math.round(D / 55));
    const plantas = [];
    for (let f = 0; f < n; f++) {
      const w = -D / 2 + ((f + 0.5) * D) / n;
      const fila = [];
      for (let u = -W / 2 + 22; u < W / 2 - 14; u += 26) fila.push([u + (r() - 0.5) * 6, w + (r() - 0.5) * 6, r() < 0.5 ? "#6E8A44" : "#84A050", r()]);
      plantas.push({ w, hoja: f % 2 === 0, fila });
    }
    function dibujar(c, x, y, giro, k) {
      const pr = CASAS25.proyector(x, y, giro, k);
      P(c, [...pr(-W / 2, -D / 2, 0), ...pr(W / 2, -D / 2, 0), ...pr(W / 2, D / 2, 0), ...pr(-W / 2, D / 2, 0)], "#3E3222");
      const filas = plantas.slice().sort((a, b) => pr.fondo(0, a.w) - pr.fondo(0, b.w));
      for (const p of filas) {
        const a = (D / n) * 0.3;
        caja(c, pr, k, -W / 2 + 10, W / 2 - 10, p.w - a, p.w + a, 0, 9, ["#4A3A28", "#5A4630", "#6A5438"]);
        for (const [u, w, col, h] of p.fila) {
          const q = pr(u, w, 10);
          if (p.hoja) E(c, q[0], q[1] - 2, 7, 4.5, col);
          else P(c, [q[0] - 2.5, q[1], q[0], q[1] - 13 - h * 5, q[0] + 2.5, q[1]], C.musgoClaro);
        }
      }
      // el cerco de mimbre bajo, de los cuatro lados
      const esq = [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]];
      for (let i = 0; i < 4; i++) {
        const [u0, w0] = esq[i],
          [u1, w1] = esq[(i + 1) % 4];
        const l = Math.hypot(u1 - u0, w1 - w0),
          m = Math.max(2, Math.round(l / 34));
        for (let j = 0; j < m; j++) {
          const s = j / m;
          palo(c, pr, [u0 + (u1 - u0) * s, w0 + (w1 - w0) * s, 0], [u0 + (u1 - u0) * s, w0 + (w1 - w0) * s, 24], C.maderaSombra, 3);
        }
        palo(c, pr, [u0, w0, 18], [u1, w1, 18], "#8A7A5A", 3);
      }
    }
    return { dibujar, alto: 30, piso: true, pie: [W / 2, D / 2] };
  }

  // el espantapájaros de la huerta: el palo, los brazos y la camisa roja a lo ancho (u), el sombrero de paja
  function espantapajaros(sem) {
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      const v = Math.sin(t * 1.3 + sem) * 3;
      sombra(c, x + 6, y + 2, 14, 4, 0.3);
      palo(c, pr, [0, 0, 0], [0, 0, 132], C.maderaSombra, 4);
      palo(c, pr, [-44, 0, 106], [44, 0, 106], C.maderaSombra, 4);
      P(c, [...pr(-26, 0, 108), ...pr(26, 0, 108), ...pr(18 + v * 0.3, 0, 56), ...pr(-18 + v * 0.3, 0, 56)], tono(pr, 0, 1, 0, ["#7A1A10", C.rojoEromash, "#B83020"]));
      const h = pr(0, 0, 124);
      E(c, h[0], h[1], 10, 10, "#D8C8A8");
      P(c, [...pr(-24, 0, 126), ...pr(0, 0, 152), ...pr(24, 0, 126)], "#B8A060");
      P(c, [...pr(0, -24, 126), ...pr(0, 0, 152), ...pr(0, 24, 126)], "#A89050");
    }
    return { dibujar, alto: 160, pie: [44, 6] };
  }

  // ---------- los carros: la carreta con lona, el carro de caravana (más grande) y el carro abierto de la cuadrilla ----------
  // op: { tipo: "carreta" | "caravana" | "cuadrilla", v }
  function carro(sem, op = {}) {
    const tipo = op.tipo || "carreta";
    const LA = tipo === "cuadrilla" ? 230 : tipo === "caravana" ? 190 : 160,
      AN = tipo === "caravana" ? 92 : 80,
      ZC = 30,
      ZB = 58;
    const lona = [["#A8946C", "#C8B48C", "#DCCAA4"], ["#8A8274", "#A8A090", "#BCB4A4"], ["#6E523A", "#8A6A4A", "#A0805E"]][(op.v || sem) % 3];
    const r = azar(sem * 17 + 2);
    const carga = tipo === "cuadrilla" ? [0, 1, 2].map((i) => [-70 + i * 60 + r() * 20, (r() - 0.5) * 30, 18 + r() * 14]) : [];
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 12, y + 4, LA * 0.6, AN * k * 0.6 + 10, 0.32);
      const RU = 24,
        ruedas = [-LA * 0.3, LA * 0.3].flatMap((u) => [[u, -AN / 2 - 6], [u, AN / 2 + 6]]);
      const rueda = ([u, w]) => {
        disco(c, pr, u, w, RU, RU, C.maderaSombra);
        disco(c, pr, u, w, RU, RU * 0.7, C.madera, 10);
        disco(c, pr, u, w, RU, 5, C.hierro, 6);
      };
      const lejos = ruedas.filter(([, w]) => !ve(pr, k, 0, Math.sign(w), 0)),
        cerca = ruedas.filter(([, w]) => ve(pr, k, 0, Math.sign(w), 0));
      lejos.forEach(rueda);
      // la lanza, hacia u−
      palo(c, pr, [-LA / 2, 0, ZC + 6], [-LA / 2 - 70, 0, 12], C.maderaSombra, 5);
      // la caja del carro
      caja(c, pr, k, -LA / 2, LA / 2, -AN / 2, AN / 2, ZC, ZB, MAD, C.maderaSombra);
      P(c, [...pr(-LA / 2 + 6, -AN / 2 + 6, ZB), ...pr(LA / 2 - 6, -AN / 2 + 6, ZB), ...pr(LA / 2 - 6, AN / 2 - 6, ZB), ...pr(-LA / 2 + 6, AN / 2 - 6, ZB)], "#3A2818");
      if (tipo === "cuadrilla") {
        // carro abierto: tablas, un cajón de herramientas y sacos
        enOrden(carga.map(([u, w, h], i) => [pr.fondo(u, w), () => (i === 1 ? caja(c, pr, k, u - 22, u + 22, w - 16, w + 16, ZB - 4, ZB + h, ["#6E5A3A", "#8A7450", "#A08A60"]) : caja(c, pr, k, u - 30, u + 30, w - 20, w + 20, ZB - 4, ZB + h * 0.6, MAD))]));
      } else {
        // la lona en arco, de punta a punta
        const arco = [];
        for (let i = 0; i <= 8; i++) {
          const a = (i / 8) * Math.PI;
          arco.push([Math.cos(a) * (AN / 2 - 2), ZB + Math.sin(a) * (tipo === "caravana" ? 80 : 64)]);
        }
        estirado(c, pr, k, -LA / 2 + 8, LA / 2 - 8, arco.reverse(), lona, lona[0]);
        // los arcos de madera que la sostienen
        for (const u of [-LA / 2 + 10, 0, LA / 2 - 10]) {
          if (!ve(pr, k, 0, 0, 1) && u === 0) continue;
          const pts = arco.map(([w, z]) => pr(u, w, z + 1));
          c.strokeStyle = "rgba(0,0,0,0.18)";
          c.lineWidth = 3;
          c.beginPath();
          pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
          c.stroke();
        }
      }
      cerca.forEach(rueda);
      void t;
    }
    return { dibujar, alto: 160, pie: [LA / 2 + 70, AN / 2 + 12] };
  }

  // ---------- la leñera: la pila de leños partidos con las puntas a la vista y su techito de un agua ----------
  // op: { L } largo en unidades
  function lenera(sem, op = {}) {
    const LA = op.L || 180,
      r = azar(sem * 23 + 1);
    const puntas = [];
    for (let z = 13; z < 100; z += 22) for (let u = -LA / 2 + 13 + ((z / 22) % 2) * 10; u < LA / 2 - 8; u += 22) puntas.push([u + (r() - 0.5) * 5, z + (r() - 0.5) * 4, r()]);
    function dibujar(c, x, y, giro, k) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 10, y + 4, LA * 0.6, 26 * k + 12, 0.3);
      const postes = [[-LA / 2 - 6, -30], [LA / 2 + 6, -30], [-LA / 2 - 6, 30], [LA / 2 + 6, 30]];
      const lejos = postes.filter(([, w]) => !ve(pr, k, 0, Math.sign(w), 0));
      lejos.forEach(([u, w]) => palo(c, pr, [u, w, 0], [u, w, w < 0 ? 136 : 112], C.maderaSombra, 5));
      caja(c, pr, k, -LA / 2, LA / 2, -22, 22, 0, 104, ["#5A4028", "#6E5034", "#7E5E3E"], "#6E5034");
      // las puntas de los leños, en las dos caras largas
      for (const s of [-1, 1]) {
        if (!ve(pr, k, 0, s, 0)) continue;
        for (const [u, z, h] of puntas) disco(c, pr, u, s * 23, z, 10.5, h < 0.3 ? "#C8A070" : h < 0.7 ? "#B08858" : "#D8B888", 6);
      }
      postes.filter((p) => !lejos.includes(p)).forEach(([u, w]) => palo(c, pr, [u, w, 0], [u, w, w < 0 ? 136 : 112], C.maderaSombra, 5));
      // el techo, más alto atrás
      P(c, [...pr(-LA / 2 - 14, -40, 140), ...pr(LA / 2 + 14, -40, 140), ...pr(LA / 2 + 14, 40, 112), ...pr(-LA / 2 - 14, 40, 112)], ve(pr, k, 0, 0.35, 1) ? C.madera : C.maderaSombra);
      for (let u = -LA / 2; u <= LA / 2; u += 30) palo(c, pr, [u, -40, 140], [u, 40, 112], "rgba(0,0,0,0.18)", 2);
      palo(c, pr, [-LA / 2 - 14, 40, 112], [LA / 2 + 14, 40, 112], C.maderaSombra, 3);
    }
    return { dibujar, alto: 150, pie: [LA / 2 + 14, 40] };
  }

  // ---------- la forja de Ása: el cobertizo abierto con la fragua, la chimenea, el yunque y las herramientas ----------
  function forja(sem) {
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      const brasa = 0.75 + Math.sin(t * 5) * 0.15 + Math.sin(t * 13) * 0.05;
      sombra(c, x + 14, y + 6, 140, 50 * k + 16, 0.36);
      const partes = [];
      // la pared del fondo, con las herramientas colgadas del lado de adentro
      partes.push([pr.fondo(0, -46), () => {
        const adentro = ve(pr, k, 0, 1, 0);
        P(c, [...pr(-110, -46, 0), ...pr(110, -46, 0), ...pr(110, -46, 116), ...pr(-110, -46, 116)], adentro ? "#3A2A1C" : tono(pr, 0, -1, 0, MAD));
        if (adentro)
          [[10, 0], [30, 1], [50, 0], [70, 2]].forEach(([u, h]) => {
            palo(c, pr, [u, -44, 100], [u, -44, 72], C.hierroLuz, 2.5);
            if (h === 1) caja(c, pr, k, u - 6, u + 6, -44, -40, 66, 74, [C.hierro, C.hierro, C.hierroLuz]);
            if (h === 0) palo(c, pr, [u, -44, 72], [u + 6, -44, 62], C.hierroLuz, 2);
          });
      }]);
      // los postes del frente
      for (const u of [-110, 0, 110]) partes.push([pr.fondo(u, 46), () => palo(c, pr, [u, 46, 0], [u, 46, 112], u > 0 ? C.madera : C.maderaSombra, 7)]);
      for (const u of [-110, 110]) partes.push([pr.fondo(u, -46) + 1, () => palo(c, pr, [u, -46, 0], [u, -46, 130], C.maderaSombra, 7)]);
      // la fragua de piedra con la brasa y la chimenea
      partes.push([pr.fondo(-64, -20), () => {
        caja(c, pr, k, -96, -32, -42, 2, 0, 52, PIEDRA, "#5A5650");
        const b = pr(-64, -20, 53);
        E(c, b[0], b[1], 24, 9 * k + 2, "#2A1A12");
        alfa(c, brasa, () => {
          E(c, b[0], b[1] - 1, 18, 6 * k + 2, "#FF8D71");
          E(c, b[0] + 2, b[1] - 2, 9, 3, C.ambar);
        });
        halo(c, b[0], b[1] - 6, 90, "#FF8D71", brasa);
        caja(c, pr, k, -80, -50, -42, -18, 52, 176, PIEDRA, "#3A3632");
        const h = pr(-65, -30, 180);
        for (let i = 0; i < 4; i++) {
          const p = (t * 0.25 + i / 4) % 1;
          alfa(c, 0.3 * (1 - p), () => E(c, h[0] + Math.sin(p * 5 + i) * 10, h[1] - p * 110, 6 + p * 16, 5 + p * 12, "#6A6A66"));
        }
      }]);
      // el yunque sobre el tocón y el cajón del mineral
      partes.push([pr.fondo(14, 14), () => {
        caja(c, pr, k, 2, 26, 4, 24, 0, 24, [C.troncoSombra || "#4A3424", C.tronco, C.corteza || C.tronco]);
        caja(c, pr, k, -10, 38, 7, 21, 24, 34, [C.hierro, C.hierro, C.hierroLuz]);
      }]);
      partes.push([pr.fondo(74, 0), () => {
        caja(c, pr, k, 54, 94, -14, 18, 0, 26, MAD, "#2A2016");
        for (const [u, w] of [[64, -2], [78, 6]]) caja(c, pr, k, u - 5, u + 5, w - 4, w + 4, 22, 30, ["#2A2628", "#3A3436", "#4A4446"]);
      }]);
      enOrden(partes);
      // el techo de un agua, más alto atrás
      P(c, [...pr(-122, -56, 136), ...pr(122, -56, 136), ...pr(122, 58, 108), ...pr(-122, 58, 108)], C.pizarra);
      palo(c, pr, [-122, 58, 108], [122, 58, 108], C.pizarraSombra, 4);
    }
    return { dibujar, alto: 190, pie: [122, 58] };
  }

  // ---------- la chimenea de la herrería: alta, de piedra, angostándose, con la boca encendida ----------
  function chimenea(sem) {
    const base = [[-66, -66], [66, -66], [66, 66], [-66, 66]];
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 40, y + 10, 80, 26, 0.36);
      const { caras } = TING25.prisma(c, pr, base, 620, 0.42, ["#4E4A44", "#5E5A54", "#76726A", "#3A3632"]);
      // las hiladas de piedra
      for (const f of caras) {
        const [u0, w0] = base[f.i],
          [u1, w1] = base[f.j];
        for (let z = 60; z < 620; z += 60) {
          const e = 1 - (z / 620) * 0.58;
          palo(c, pr, [u0 * e, w0 * e, z], [u1 * e, w1 * e, z], "rgba(0,0,0,0.16)", 2);
        }
      }
      // la boca de la fragua, del frente (w+)
      const fuego = 0.75 + Math.sin(t * 6) * 0.15;
      if (ve(pr, k, 0, 1, 0)) {
        P(c, [...pr(-28, 64, 20), ...pr(28, 64, 20), ...pr(26, 62, 80), ...pr(0, 61, 100), ...pr(-26, 62, 80)], "#1A0E08");
        alfa(c, fuego, () => P(c, [...pr(-19, 65, 22), ...pr(19, 65, 22), ...pr(15, 64, 60), ...pr(-15, 64, 60)], "#FF8D71"));
        const b = pr(0, 65, 50);
        halo(c, b[0], b[1], 120, "#FF8D71", fuego * 0.8);
      }
      const h = pr(0, 0, 630);
      for (let i = 0; i < 5; i++) {
        const p = (t * 0.2 + i / 5) % 1;
        alfa(c, 0.32 * (1 - p), () => E(c, h[0] + Math.sin(p * 4 + i) * 16, h[1] - p * 180, 14 + p * 30, 10 + p * 22, "#6A6A66"));
      }
    }
    return { dibujar, alto: 700, pie: [66, 66] };
  }

  // ---------- el tablón: dos postes, el tablero con papeles de los dos lados y su alero ----------
  // op: { L, H, flechas } (el gran tablero de la plaza lleva las flechas de las rutas talladas arriba)
  function tablon(sem, op = {}) {
    const LA = op.L || 150,
      H = op.H || 150,
      r = azar(sem * 41 + 7);
    const notas = [];
    for (let f = 0; f < 4; f++) for (let i = 0; i < 7; i++) if (r() < 0.8) notas.push([-LA / 2 + 12 + i * ((LA - 24) / 7), H - 30 - f * 22, r() < 0.3 ? "#7BC86C" : r() < 0.3 ? C.rojoEromash : "#E8DCC0"]);
    function dibujar(c, x, y, giro, k) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 10, y + 4, LA * 0.55, 12, 0.3);
      for (const u of [-LA / 2, LA / 2]) palo(c, pr, [u, 0, 0], [u, 0, H + 10], C.maderaSombra, 7);
      caja(c, pr, k, -LA / 2 + 4, LA / 2 - 4, -5, 5, H - 104, H - 6, [C.maderaVieja || C.maderaSombra, C.madera, C.maderaLuz]);
      const s = ve(pr, k, 0, 1, 0) ? 1 : -1;
      for (const [u, z, col] of notas) P(c, [...pr(u, s * 6, z), ...pr(u + 13, s * 6, z), ...pr(u + 13, s * 6, z - 15), ...pr(u, s * 6, z - 15)], col);
      estirado(c, pr, k, -LA / 2 - 14, LA / 2 + 14, [[-20, H], [20, H], [0, H + 22]], [C.maderaSombra, C.madera, C.maderaLuz]);
      if (op.flechas)
        for (const d of [-1, 1]) {
          const u = d * 38;
          P(c, [...pr(u - d * 24, 0, H + 26), ...pr(u + d * 10, 0, H + 26), ...pr(u + d * 22, 0, H + 33), ...pr(u + d * 10, 0, H + 40), ...pr(u - d * 24, 0, H + 40)], d > 0 ? C.maderaLuz : C.madera);
        }
    }
    return { dibujar, alto: H + 50, pie: [LA / 2 + 14, 20] };
  }

  // ---------- la mesa con sus dos bancos ----------
  function mesa(sem, op = {}) {
    const LA = op.L || 130;
    function dibujar(c, x, y, giro, k) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 8, y + 4, LA * 0.5, 40 * k + 10, 0.28);
      const banco = (w) => [pr.fondo(0, w), () => {
        for (const u of [-LA / 2 + 10, LA / 2 - 10]) palo(c, pr, [u, w, 0], [u, w, 24], C.maderaSombra, 4);
        caja(c, pr, k, -LA / 2 + 4, LA / 2 - 4, w - 9, w + 9, 22, 28, MAD);
      }];
      const tabla = [pr.fondo(0, 0), () => {
        for (const [u, w] of [[-LA / 2 + 10, -18], [LA / 2 - 10, -18], [-LA / 2 + 10, 18], [LA / 2 - 10, 18]]) palo(c, pr, [u, w, 0], [u, w, 44], C.maderaSombra, 5);
        caja(c, pr, k, -LA / 2, LA / 2, -28, 28, 42, 50, MAD);
      }];
      enOrden([banco(-50), tabla, banco(50)]);
    }
    return { dibujar, alto: 60, pie: [LA / 2, 60] };
  }

  // ---------- el estante: armas apoyadas, o manojos de hierbas colgados (el secadero) ----------
  // op: { tipo: "armas" | "hierbas" | "secadero" }
  function estante(sem, op = {}) {
    const tipo = op.tipo || "armas",
      r = azar(sem * 31 + 4);
    const cosas = [];
    for (let u = -58; u <= 58; u += 16) cosas.push([u + (r() - 0.5) * 4, r()]);
    const H = tipo === "armas" ? 150 : 140;
    function dibujar(c, x, y, giro, k) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 8, y + 4, 80, 12, 0.28);
      for (const u of [-72, 72]) palo(c, pr, [u, 0, 0], [u, 0, H], C.maderaSombra, 6);
      palo(c, pr, [-76, 0, H - 10], [76, 0, H - 10], C.madera, 5);
      if (tipo === "armas") {
        palo(c, pr, [-76, 0, 50], [76, 0, 50], C.madera, 5);
        for (const [u, h] of cosas) {
          palo(c, pr, [u, 10, 0], [u, -4, 170], C.maderaSombra, 3);
          if (h < 0.5) P(c, [...pr(u - 5, -4, 170), ...pr(u, -5, 192), ...pr(u + 5, -4, 170)], C.hierroLuz);
          else P(c, [...pr(u, -4, 168), ...pr(u + 16, -4, 176), ...pr(u + 16, -4, 156), ...pr(u, -4, 160)], C.hierro);
        }
      } else {
        if (tipo === "hierbas") caja(c, pr, k, -70, 70, -16, 16, 40, 46, MAD);
        for (const [u, h] of cosas) {
          const col = h < 0.33 ? "#6E8A44" : h < 0.66 ? "#8A7A44" : "#7A5A6A";
          palo(c, pr, [u, 0, H - 10], [u, 0, H - 22], "#8A7A5A", 2);
          P(c, [...pr(u - 7, 0, H - 22), ...pr(u + 7, 0, H - 22), ...pr(u, 0, H - 62 - h * 10)], col);
          P(c, [...pr(u, -7, H - 22), ...pr(u, 7, H - 22), ...pr(u, 0, H - 62 - h * 10)], col);
        }
      }
    }
    return { dibujar, alto: tipo === "armas" ? 200 : 150, pie: [76, 20] };
  }

  // ---------- el tendedero: dos postes, la soga y la ropa colgada ----------
  function tendedero(sem) {
    const r = azar(sem * 19 + 5);
    const ropa = [];
    for (let u = -64; u < 60; u += 30) ropa.push([u + r() * 6, 18 + r() * 8, 34 + r() * 26, ["#E0D8C8", "#9C2315", "#8A7A5A", "#4A78D0", "#E0B2B2"][Math.floor(r() * 5)]]);
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      for (const u of [-80, 80]) palo(c, pr, [u, 0, 0], [u, 0, 112], C.maderaSombra, 5);
      palo(c, pr, [-80, 0, 106], [80, 0, 106], "#8A7A5A", 2);
      for (const [u, a, h, col] of ropa) {
        const v = Math.sin(t * 2 + u) * 3;
        P(c, [...pr(u, 0, 104), ...pr(u + a, 0, 104), ...pr(u + a, v, 104 - h), ...pr(u, v, 104 - h)], col);
      }
    }
    return { dibujar, alto: 120, pie: [80, 10] };
  }

  // ---------- el ahumadero: casita baja de tablas con techo a dos aguas y humo ----------
  function ahumadero(sem) {
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 12, y + 4, 110, 40 * k + 14, 0.32);
      caja(c, pr, k, -80, 80, -44, 44, 0, 96, ["#3A2818", "#4E3824", "#60462E"], false);
      if (ve(pr, k, 0, 1, 0)) P(c, [...pr(-14, 45, 0), ...pr(14, 45, 0), ...pr(14, 45, 70), ...pr(-14, 45, 70)], "#1A120C");
      estirado(c, pr, k, -90, 90, [[-56, 92], [56, 92], [0, 140]], ["#2A2A2E", "#3A3A3E", "#4E4E54"], "#3A2818");
      const h = pr(40, 0, 140);
      for (let i = 0; i < 4; i++) {
        const p = (t * 0.2 + i / 4) % 1;
        alfa(c, 0.28 * (1 - p), () => E(c, h[0] + Math.sin(p * 4 + i) * 10, h[1] - p * 90, 8 + p * 16, 6 + p * 12, "#7A7A76"));
      }
    }
    return { dibujar, alto: 160, pie: [90, 56] };
  }

  // ---------- la lona de la cuadrilla: una carpa en caballete ----------
  function lona(sem) {
    const T = [["#8A7A5A", "#A89870", "#C0B088"], ["#6E6A5A", "#8A8470", "#A09A86"]][sem % 2];
    function dibujar(c, x, y, giro, k) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 10, y + 4, 90, 50 * k + 10, 0.3);
      estirado(c, pr, k, -80, 80, [[-62, 0], [62, 0], [0, 96]], T, "#2A2016");
      palo(c, pr, [-84, 0, 96], [84, 0, 96], C.maderaSombra, 4);
    }
    return { dibujar, alto: 110, pie: [80, 62] };
  }

  // ---------- leños: el tronco caído (asiento) y la pila de troncos del aserradero ----------
  const LENO = ["#4A3424", "#5E4430", "#6E5038"];
  function leno(c, pr, k, u0, u1, w, z, r) {
    estirado(c, pr, k, u0, u1, circulo(r, 8).map(([a, b]) => [w + a, z + r + b]), LENO, "#B08858");
  }
  function tronco(sem, op = {}) {
    const LA = op.L || 130;
    function dibujar(c, x, y, giro, k) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 6, y + 2, LA * 0.5, 14, 0.28);
      leno(c, pr, k, -LA / 2, LA / 2, 0, 0, 15);
      const m = pr(-LA * 0.2, 0, 30);
      E(c, m[0], m[1], 16, 5, C.musgo2);
    }
    return { dibujar, alto: 40, pie: [LA / 2, 16] };
  }
  function pilaTroncos(sem) {
    const filas = [[-36, 0, 18], [0, 0, 18], [36, 0, 18], [-18, 30, 18], [18, 30, 18], [0, 60, 18]];
    function dibujar(c, x, y, giro, k) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 14, y + 4, 130, 50 * k + 10, 0.32);
      const orden = filas.slice().sort((a, b) => a[1] - b[1] || pr.fondo(0, a[0]) - pr.fondo(0, b[0]));
      for (const [w, z, r] of orden) leno(c, pr, k, -110, 110, w, z, r);
      for (const u of [-90, 90]) for (const s of [-1, 1]) palo(c, pr, [u, s * 58, 0], [u, s * 58, 70], C.maderaSombra, 5);
    }
    return { dibujar, alto: 110, pie: [110, 60] };
  }

  // ---------- un fardo de heno atado ----------
  function fardo(sem) {
    function dibujar(c, x, y, giro, k) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 6, y + 2, 46, 14, 0.28);
      caja(c, pr, k, -42, 42, -26, 26, 0, 42, ["#A88A40", "#C8A850", "#D8BC66"]);
      for (const u of [-18, 18]) {
        palo(c, pr, [u, 27, 0], [u, 27, 42], "#7A5A2A", 2.5);
        palo(c, pr, [u, -26, 43], [u, 26, 43], "#7A5A2A", 2.5);
      }
    }
    return { dibujar, alto: 50, pie: [42, 26] };
  }

  // ---------- la diana del campo de tiro: el caballete y el disco de paja con sus anillos ----------
  function diana(sem) {
    function dibujar(c, x, y, giro, k) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 6, y + 2, 30, 10, 0.28);
      palo(c, pr, [-24, 14, 0], [0, 0, 120], C.maderaSombra, 4);
      palo(c, pr, [24, 14, 0], [0, 0, 120], C.maderaSombra, 4);
      palo(c, pr, [0, -24, 0], [0, 0, 110], C.maderaSombra, 4);
      const frente = ve(pr, k, 0, 1, 0);
      disco(c, pr, 0, 4, 92, 40, "#C8A850", 16);
      if (frente) {
        disco(c, pr, 0, 6, 92, 30, "#F2ECEC", 16);
        disco(c, pr, 0, 7, 92, 20, C.rojoEromash, 14);
        disco(c, pr, 0, 8, 92, 9, "#F2ECEC", 10);
      }
    }
    return { dibujar, alto: 150, pie: [30, 30] };
  }

  // ---------- la campana de la plaza: el pórtico de dos postes con su techito y la campana colgada ----------
  function campana(sem) {
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 8, y + 3, 50, 16, 0.3);
      for (const u of [-46, 46]) palo(c, pr, [u, 0, 0], [u, 0, 176], C.maderaSombra, 7);
      palo(c, pr, [-56, 0, 170], [56, 0, 170], C.madera, 6);
      estirado(c, pr, k, -62, 62, [[-22, 176], [22, 176], [0, 200]], [C.pizarraSombra, C.pizarra, C.pizarra]);
      const v = Math.sin(t * 1.2) * 3;
      const p = pr(v * 0.3, 0, 166),
        q = pr(v, 0, 112);
      L(c, p[0], p[1], q[0], q[1] - 30, C.hierro, 2);
      P(c, [q[0] - 16, q[1] - 30, q[0] + 16, q[1] - 30, q[0] + 24, q[1], q[0] - 24, q[1]], "#8A6A3A");
      P(c, [q[0] + 4, q[1] - 30, q[0] + 16, q[1] - 30, q[0] + 24, q[1], q[0] + 8, q[1]], "#B08A4A");
    }
    return { dibujar, alto: 210, pie: [56, 22] };
  }

  // ---------- la cama de pieles del patio de Sanación: un catre bajo con las pieles ----------
  function catre(sem) {
    function dibujar(c, x, y, giro, k) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 6, y + 2, 56, 22 * k + 8, 0.26);
      caja(c, pr, k, -60, 60, -28, 28, 0, 22, MAD);
      caja(c, pr, k, -54, 54, -24, 24, 22, 30, ["#6E523A", "#8A6A4A", "#A0805E"]);
      caja(c, pr, k, -54, -34, -20, 20, 30, 40, ["#B8AA90", "#D0C4AC", "#E0D8C8"]);
    }
    return { dibujar, alto: 50, pie: [60, 28] };
  }

  // ---------- el estandarte de la cornamenta: el asta y la tela verde con el Ciervo, a lo ancho (u) ----------
  function estandarte(sem, op = {}) {
    const H = op.H || 230;
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      const v = Math.sin(t * 1.6 + sem) * 4;
      sombra(c, x + 6, y + 2, 14, 4, 0.3);
      palo(c, pr, [0, 0, 0], [0, 0, H], C.maderaSombra, 6);
      const b = pr(0, 0, H + 4);
      E(c, b[0], b[1], 6, 6, C.ambar);
      palo(c, pr, [-2, 0, H - 8], [62, 0, H - 8], C.maderaSombra, 5);
      const q = (u, z, vv = 0) => pr(u, vv, z);
      const lado = ve(pr, k, 0, 1, 0) ? 1 : -1;
      P(c, [...q(2, H - 13), ...q(60, H - 13), ...q(60, H - 105, v), ...q(31, H - 87, v), ...q(2, H - 105, v)], "#2C4226");
      P(c, [...q(46, H - 13), ...q(60, H - 13), ...q(60, H - 105, v), ...q(52, H - 99, v)], "#3E5A34");
      // la insignia de Eikholt, en la cara que se ve
      DIB.insignia(c, (x2, y2) => pr(31 + x2 * 56, lado * 1 + v * 0.5, H - 20 - y2 * 56), "#F2ECEC");
    }
    return { dibujar, alto: H + 20, pie: [62, 8] };
  }

  // ---------- el poste del Hongo Dorado: el poste, el brazo y el cartel con el hongo dorado, y su farol ----------
  function posteHongo(sem) {
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      const bal = Math.sin(t * 1.4) * 3;
      sombra(c, x + 10, y + 2, 26, 7, 0.35);
      palo(c, pr, [0, 0, 0], [0, 0, 230], C.maderaSombra, 8);
      palo(c, pr, [0, 0, 214], [76, 0, 214], C.madera, 5);
      palo(c, pr, [20, 0, 214], [20, 0, 204], C.hierro, 2);
      palo(c, pr, [66, 0, 214], [66, 0, 204], C.hierro, 2);
      caja(c, pr, k, 12, 74, -3 + bal * 0.2, 3 + bal * 0.2, 150, 204, [C.maderaSombra, C.madera, C.maderaLuz]);
      const s = ve(pr, k, 0, 1, 0) ? 1 : -1;
      const g = (u, z) => pr(u, s * 4 + bal * 0.2, z);
      P(c, [...g(30, 170), ...g(56, 170), ...g(52, 162), ...g(34, 162)], "#E8DCC0");
      P(c, [...g(36, 162), ...g(50, 162), ...g(48, 158), ...g(38, 158)], "#E8DCC0");
      P(c, [...g(24, 176), ...g(43, 196), ...g(62, 176)], C.ambar);
      // el farol en la punta del brazo
      const f = pr(76, 0, 200);
      L(c, f[0], f[1] - 14, f[0], f[1], C.hierro, 2);
      P(c, [f[0] - 8, f[1], f[0] + 8, f[1], f[0] + 8, f[1] + 18, f[0] - 8, f[1] + 18], C.hierro);
      alfa(c, 0.9, () => P(c, [f[0] - 5, f[1] + 3, f[0] + 5, f[1] + 3, f[0] + 5, f[1] + 15, f[0] - 5, f[1] + 15], C.ambar));
      if (!window.CALIDAD || CALIDAD.nivel !== "baja") halo(c, f[0], f[1] + 9, 70, C.ambar, 0.5);
    }
    return { dibujar, alto: 250, pie: [76, 10] };
  }

  // ---------- el farol de poste: el poste, el brazo a lo largo (u) y la caja colgada con la luz ----------
  // op: { alto } (el poste de farol del muelle es más alto)
  function farol(sem, op = {}) {
    const H = op.alto || 86;
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      const fl = 0.8 + Math.sin(t * 7 + sem) * 0.1;
      sombra(c, x + 4, y + 1, 14, 4, 0.3);
      palo(c, pr, [0, 0, 0], [0, 0, H], C.maderaSombra, 5);
      palo(c, pr, [-2, 0, H], [18, 0, H], C.maderaSombra, 4);
      const f = pr(14, 0, H - 4);
      L(c, f[0], f[1], f[0], f[1] + 6, C.hierro, 1.5);
      caja(c, pr, k, 7, 21, -7, 7, H - 26, H - 10, [C.hierro, C.hierro, C.hierroLuz], C.hierroLuz);
      const q = pr(14, 0, H - 18);
      alfa(c, fl, () => P(c, [q[0] - 4, q[1] - 5, q[0] + 4, q[1] - 5, q[0] + 4, q[1] + 5, q[0] - 4, q[1] + 5], C.ambar));
      if (!window.CALIDAD || CALIDAD.nivel !== "baja") halo(c, q[0], q[1], 70, C.ambar, fl);
    }
    return { dibujar, alto: H + 20, pie: [18, 8] };
  }

  // ---------- una roca: un prisma bajo y desparejo, gris con musgo arriba ----------
  function roca(sem) {
    const r = azar(sem * 37 + 9);
    const base = [];
    const n = 6 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      base.push([Math.cos(a) * (26 + r() * 10), Math.sin(a) * (18 + r() * 8)]);
    }
    const punta = base.map(() => r() * 0.35);
    function dibujar(c, x, y, giro, k) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 6, y + 2, 32, 9, 0.28);
      TING25.prisma(c, pr, base, 30, 0.6, ["#55534F", "#65635D", "#7A7870", "#4E5A34"], punta);
    }
    return { dibujar, alto: 40, pie: [30, 22] };
  }

  // ---------- el muñeco de práctica: el poste, los brazos de palo a lo ancho, el cuerpo de paja y el escudo al frente ----------
  function muneco(sem) {
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 6, y + 2, 18, 6, 0.3);
      const frente = ve(pr, k, 0, 1, 0);
      const escudo = () => {
        disco(c, pr, 10, 14, 58, 16, "#5E130D", 12);
        disco(c, pr, 10, 15, 58, 4, C.hierro, 6);
      };
      if (!frente) escudo();
      palo(c, pr, [0, 0, 0], [0, 0, 104], C.maderaSombra, 5);
      caja(c, pr, k, -12, 12, -9, 9, 40, 84, ["#A88A40", "#C8A850", "#D8BC66"]);
      palo(c, pr, [-30, 0, 78], [30, 0, 78], C.maderaSombra, 4);
      const h = pr(0, 0, 96);
      E(c, h[0], h[1], 9, 9, "#C8A850");
      if (frente) escudo();
      void t;
    }
    return { dibujar, alto: 110, pie: [30, 16] };
  }


  // ---------- lo que cuenta algo de la ciudad (revisión 7) ----------

  // El árbol de tablillas del Roble: un travesaño en dos postes del que cuelgan las tablillas de los que salieron por
  // las sendas. Del lado claro, volvieron; las oscuras siguen afuera (la de Geir, el hermano de Grim; las de la cuadrilla).
  // op: { oscuras }
  function tablillas(sem, op = {}) {
    const LA = 300,
      H = 190,
      r = azar(sem * 53 + 11);
    const osc = op.oscuras != null ? op.oscuras : 7;
    const tabs = [];
    for (let f = 0; f < 3; f++)
      for (let i = 0; i < 11; i++) {
        if (r() < 0.12) continue;
        tabs.push({ u: -LA / 2 + 22 + i * ((LA - 44) / 10) + (r() - 0.5) * 6, z: H - 26 - f * 46, larga: 10 + r() * 14, fase: r() * 6, oscura: false });
      }
    for (let k = 0; k < osc; k++) tabs[Math.floor(r() * tabs.length)].oscura = true;
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 12, y + 4, LA * 0.55, 14, 0.32);
      for (const u of [-LA / 2, LA / 2]) caja(c, pr, k, u - 8, u + 8, -8, 8, 0, H + 14, MAD);
      for (const z of [H, H - 46, H - 92]) caja(c, pr, k, -LA / 2 - 14, LA / 2 + 14, -4, 4, z, z + 8, MAD);
      const lista = tabs.slice().sort((a, b) => pr.fondo(a.u, 0) - pr.fondo(b.u, 0));
      for (const tb of lista) {
        const v = Math.sin(t * 1.6 + tb.fase) * 3;
        const zt = tb.z - tb.larga;
        palo(c, pr, [tb.u, 0, tb.z], [tb.u + v * 0.4, v, zt], "#8A7A5A", 1.5);
        caja(c, pr, k, tb.u - 7 + v * 0.4, tb.u + 7 + v * 0.4, v - 1.5, v + 1.5, zt - 22, zt, tb.oscura ? ["#1A1612", "#2A2420", "#3A322C"] : ["#A8987A", "#D8C8A4", "#E8DCC0"]);
      }
    }
    return { dibujar, alto: H + 20, pie: [LA / 2 + 14, 12] };
  }

  // Las cintas de promesa atadas a una estaca entre las raíces: si atás una, la tenés que cumplir.
  function cintas(sem) {
    const r = azar(sem * 19 + 4);
    const COL = ["#9C2315", "#FFD98A", "#7BC86C", "#4A78D0", "#F2ECEC", "#C8402D", "#9A6BD8"];
    const lista = Array.from({ length: 6 + Math.floor(r() * 4) }, (_, i) => ({ col: COL[(i + sem) % COL.length], z: 70 + r() * 30, l: 30 + r() * 30, a: r() * Math.PI * 2, f: r() * 6 }));
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 4, y + 2, 12, 4, 0.3);
      caja(c, pr, k, -4, 4, -4, 4, 0, 104, MAD);
      for (const cn of lista) {
        const v = Math.sin(t * 2.2 + cn.f) * 0.4;
        const du = Math.cos(cn.a + v),
          dw = Math.sin(cn.a + v);
        const p = [];
        for (let j = 0; j <= 4; j++) {
          const s = j / 4;
          p.push([du * cn.l * s * 0.7, dw * cn.l * s * 0.7, cn.z - cn.l * s + Math.sin(t * 3 + cn.f + j) * 3 * s]);
        }
        const a = p.map((q) => pr(...q));
        c.strokeStyle = cn.col;
        c.lineWidth = 4;
        c.lineCap = "round";
        c.beginPath();
        a.forEach(([sx, sy], j) => (j ? c.lineTo(sx, sy) : c.moveTo(sx, sy)));
        c.stroke();
      }
    }
    return { dibujar, alto: 110, pie: [10, 10] };
  }

  // Un cofre de madera con flejes de hierro y cerradura; op.abierto: la tapa atrás y el brillo de adentro
  function cofre(sem, op = {}) {
    const U = 38,
      W = 24,
      Z = 30;
    const TM = ["#4A3020", "#6E4A2E", "#8A6040"];
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 8, y + 3, 46, 12, 0.36);
      caja(c, pr, k, -U, U, -W, W, 0, Z, TM, op.abierto ? "#1A120C" : undefined);
      const arco = [[-W, Z], [W, Z], [W * 0.7, Z + 12], [0, Z + 16], [-W * 0.7, Z + 12]];
      if (op.abierto) {
        const s = Math.sin(t * 3) * 0.15 + 0.85;
        const m = pr(0, 0, Z);
        alfa(c, 0.8 * s, () => E(c, m[0], m[1] - 2, 22, 7, C.ambar));
        if (!window.CALIDAD || CALIDAD.nivel !== "baja") halo(c, m[0], m[1] - 6, 50, C.ambar, 0.3 * s);
        estirado(c, pr, k, -U, U, arco.map(([w, z]) => [-W - (z - Z) * 0.9, Z + (w + W) * 0.95]), TM);
      } else estirado(c, pr, k, -U, U, arco, TM);
      // los flejes y la cerradura del frente que se ve
      for (const u of [-U * 0.6, U * 0.6]) for (const s of [-1, 1]) if (ve(pr, k, 0, s, 0)) palo(c, pr, [u, s * (W + 0.5), 0], [u, s * (W + 0.5), Z + (op.abierto ? 0 : 10)], C.hierro, 3);
      const fr = ve(pr, k, 0, 1, 0) ? 1 : -1;
      if (!op.abierto) {
        const q = pr(0, fr * (W + 1), Z - 4);
        c.fillStyle = C.hierroLuz || "#9A9A9A";
        c.fillRect(q[0] - 4, q[1] - 4, 8, 9);
      }
    }
    return { dibujar, alto: 60, pie: [U, W] };
  }

  // El secadero de pescado del muelle: dos caballetes con una vara y los pescados colgados (el de la noche tarda un día más)
  function secaderoPescado(sem) {
    const LA = 210,
      H = 150,
      r = azar(sem * 23 + 9);
    const peces = Array.from({ length: 11 }, (_, i) => ({ u: -LA / 2 + 16 + i * ((LA - 32) / 10), l: 34 + r() * 14, f: r() * 6, col: r() < 0.5 ? ["#5E6A72", "#8A98A0", "#A8B4BA"] : ["#6E6252", "#8E806C", "#A8987E"] }));
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 10, y + 4, LA * 0.55, 14, 0.3);
      for (const u of [-LA / 2, LA / 2]) {
        palo(c, pr, [u, -30, 0], [u, 0, H], C.maderaSombra, 5);
        palo(c, pr, [u, 30, 0], [u, 0, H], C.madera, 5);
      }
      palo(c, pr, [-LA / 2 - 8, 0, H - 4], [LA / 2 + 8, 0, H - 4], C.maderaLuz, 5);
      for (const p of peces) {
        const v = Math.sin(t * 1.4 + p.f) * 2;
        const a = pr(p.u, v, H - 8),
          b = pr(p.u - 5, v, H - 8 - p.l * 0.55),
          cc = pr(p.u, v, H - 8 - p.l),
          d = pr(p.u + 5, v, H - 8 - p.l * 0.55);
        P(c, [...a, ...b, ...cc, ...d], p.col[1]);
        P(c, [...a, ...d, ...cc], p.col[2]);
        const co = pr(p.u, v, H - 8 - p.l);
        P(c, [co[0], co[1], co[0] - 6, co[1] + 7, co[0] + 6, co[1] + 7], p.col[0]);
      }
    }
    return { dibujar, alto: H + 10, pie: [LA / 2 + 8, 30] };
  }

  // La mesa de hnefatafl de la plaza: el tablero de nueve por nueve, las piezas a medio jugar y dos banquitos
  function hnefatafl(sem) {
    const r = azar(sem * 31 + 2);
    const piezas = [];
    for (let i = 0; i < 16; i++) piezas.push([Math.floor(r() * 9), Math.floor(r() * 9), i < 6 ? "#F2ECEC" : "#2A1E14"]);
    function dibujar(c, x, y, giro, k) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 10, y + 4, 60, 18, 0.32);
      const partes = [
        [pr.fondo(0, -78), () => caja(c, pr, k, -22, 22, -92, -64, 0, 40, MAD)],
        [pr.fondo(0, 78), () => caja(c, pr, k, -22, 22, 64, 92, 0, 40, MAD)],
        [pr.fondo(0, 0), () => {
          for (const [u, w] of [[-38, -38], [38, -38], [38, 38], [-38, 38]]) caja(c, pr, k, u - 4, u + 4, w - 4, w + 4, 0, 62, MAD, false);
          caja(c, pr, k, -46, 46, -46, 46, 62, 70, MAD);
          const T = 36,
            p = (i, j, z) => pr(-T + (i * 2 * T) / 9, -T + (j * 2 * T) / 9, z);
          for (let i = 0; i < 9; i++)
            for (let j = 0; j < 9; j++) {
              if ((i + j) % 2) continue;
              P(c, [...p(i, j, 71), ...p(i + 1, j, 71), ...p(i + 1, j + 1, 71), ...p(i, j + 1, 71)], "#5E4430");
            }
          const rey = pr(0, 0, 71);
          E(c, rey[0], rey[1] - 5, 4, 6, "#FFD98A");
          for (const [i, j, col] of piezas) {
            const q = p(i + 0.5, j + 0.5, 71);
            E(c, q[0], q[1] - 2.5, 3, 3.5, col);
          }
        }],
      ];
      enOrden(partes);
    }
    return { dibujar, alto: 80, pie: [46, 92] };
  }

  // La ofrenda al pie del Roble: una losa chata con cuencos de leche, un pan y una vela que nadie deja apagar
  function ofrenda(sem) {
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 6, y + 3, 50, 14, 0.3);
      caja(c, pr, k, -44, 44, -28, 28, 0, 14, PIEDRA);
      for (const [u, w, col] of [[-24, -8, "#F2ECEC"], [6, 10, "#F2ECEC"], [24, -12, "#C8A060"]]) {
        const q = pr(u, w, 14);
        E(c, q[0], q[1] - 3, 11, 6, "#6E5038");
        E(c, q[0], q[1] - 5, 8, 3.5, col);
      }
      const v = pr(-6, -14, 14);
      c.fillStyle = "#E8DCC4";
      c.fillRect(v[0] - 2.5, v[1] - 18, 5, 18);
      const fl = 1 + Math.sin(t * 9 + sem) * 0.15;
      P(c, [v[0] - 3 * fl, v[1] - 18, v[0], v[1] - 28 * fl, v[0] + 3 * fl, v[1] - 18], C.ambar);
      if (!window.CALIDAD || CALIDAD.nivel !== "baja") halo(c, v[0], v[1] - 22, 40, C.ambar, 0.35);
    }
    return { dibujar, alto: 40, pie: [44, 28] };
  }

  // Las colmenas de paja en su banco, con abejas que van y vienen
  function colmenas(sem) {
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 8, y + 3, 64, 14, 0.3);
      caja(c, pr, k, -70, 70, -18, 18, 0, 26, MAD);
      for (const u of [-46, 0, 46]) {
        const b = pr(u, 0, 26);
        for (let i = 0; i < 5; i++) E(c, b[0], b[1] - 6 - i * 9, 22 - i * 3.6, 7, i % 2 ? "#B8A060" : "#C8B070");
        const bo = pr(u, ve(pr, k, 0, 1, 0) ? 18 : -18, 32);
        E(c, bo[0], bo[1], 4, 3, "#2A1E14");
      }
      if (!window.CALIDAD || CALIDAD.nivel !== "baja")
        for (let i = 0; i < 9; i++) {
          const a = t * (1.5 + (i % 3) * 0.4) + i * 2.1;
          const q = pr(Math.cos(a) * (40 + i * 6), Math.sin(a * 1.3) * 40, 50 + Math.sin(a * 2) * 20);
          c.fillStyle = "#1E1814";
          c.fillRect(q[0] - 1.5, q[1] - 1.5, 3, 3);
        }
    }
    return { dibujar, alto: 80, pie: [70, 18] };
  }

  // El gallinero: una casita de tablas con techo a un agua, la rampa y el agujero de la puerta
  function gallinero(sem) {
    function dibujar(c, x, y, giro, k) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 10, y + 4, 64, 18, 0.34);
      const partes = [
        [pr.fondo(0, 0), () => {
          for (const [u, w] of [[-44, -32], [44, -32], [44, 32], [-44, 32]]) caja(c, pr, k, u - 4, u + 4, w - 4, w + 4, 0, 26, MAD, false);
          caja(c, pr, k, -46, 46, -34, 34, 26, 86, ["#5E4430", "#7A5A3A", "#9A7A52"], false);
          const fr = ve(pr, k, 0, 1, 0) ? 1 : -1;
          const h = pr(-16, fr * 35, 40);
          E(c, h[0], h[1] - 10, 9, 11, "#1A120C");
          estirado(c, pr, k, -54, 54, [[-42, 78], [42, 96], [42, 102], [-42, 84]], ["#3A2A1E", "#5E4430", "#6E5038"]);
        }],
        [pr.fondo(-16, 70), () => P(c, [...pr(-26, 35, 30), ...pr(-6, 35, 30), ...pr(-6, 90, 0), ...pr(-26, 90, 0)], C.madera)],
      ];
      enOrden(partes);
    }
    return { dibujar, alto: 110, pie: [54, 42] };
  }

  // El poste de las crecidas del muelle: un palo cuadrado con muescas y la marca roja del año en que el río tapó el muelle
  function posteCrecidas(sem) {
    const H = 300;
    const MARCAS = [60, 92, 118, 150, 176, 232];
    function dibujar(c, x, y, giro, k) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 6, y + 2, 16, 5, 0.3);
      caja(c, pr, k, -9, 9, -9, 9, 0, H, MAD);
      for (const [nu, nw] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        if (!ve(pr, k, nu, nw, 0)) continue;
        for (const z of MARCAS) {
          const a = pr(nu * 9.5 - nw * 9, nw * 9.5 + nu * 9, z),
            b = pr(nu * 9.5 + nw * 9, nw * 9.5 - nu * 9, z);
          L(c, a[0], a[1], b[0], b[1], z === 232 ? C.rojoEromash : "#2A1E14", z === 232 ? 4 : 2);
        }
      }
    }
    return { dibujar, alto: H + 10, pie: [10, 10] };
  }

  // El Tablero de las Sendas en la Puerta del Sur: las sendas de Eldervald pintadas en tablas, con un techito
  function tableroSendas(sem) {
    const LA = 240,
      H = 200;
    const SENDAS = [[[0.5, 0.95], [0.5, 0.55], [0.48, 0.1]], [[0.5, 0.55], [0.9, 0.42]], [[0.5, 0.55], [0.1, 0.6]], [[0.48, 0.1], [0.3, 0.05]]];
    const LUGARES = [[0.5, 0.55, "#FFD98A"], [0.48, 0.1, "#73D5DB"], [0.9, 0.42, "#7BC86C"], [0.1, 0.6, "#E0B2B2"], [0.5, 0.95, "#F2ECEC"]];
    function dibujar(c, x, y, giro, k) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 10, y + 4, LA * 0.55, 14, 0.3);
      for (const u of [-LA / 2, LA / 2]) caja(c, pr, k, u - 7, u + 7, -7, 7, 0, H + 20, MAD);
      caja(c, pr, k, -LA / 2 + 6, LA / 2 - 6, -5, 5, H - 140, H, ["#4A3A28", "#6E5A3E", "#8A7452"]);
      const s = ve(pr, k, 0, 1, 0) ? 1 : -1;
      const en = (a, b) => pr((a - 0.5) * (LA - 30) * s, s * 6, H - 8 - b * 124);
      P(c, [...en(0, 0), ...en(1, 0), ...en(1, 1), ...en(0, 1)], "#C8B48C");
      c.lineCap = "round";
      for (const sd of SENDAS) {
        c.strokeStyle = "#6E4A2E";
        c.lineWidth = 4;
        c.beginPath();
        sd.forEach(([a, b], i) => {
          const q = en(a, b);
          i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]);
        });
        c.stroke();
      }
      for (const [a, b, col] of LUGARES) {
        const q = en(a, b);
        E(c, q[0], q[1], 6, 5, col);
      }
      estirado(c, pr, k, -LA / 2 - 16, LA / 2 + 16, [[-22, H + 18], [22, H + 18], [0, H + 42]], MAD);
    }
    return { dibujar, alto: H + 50, pie: [LA / 2 + 16, 22] };
  }

  // Las marcas de un oficio en su poste: el cartel colgado con el dibujo tallado de los dos lados
  function cartelOficio(sem, op = {}) {
    function dibujar(c, x, y, giro, k) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 4, y + 2, 14, 4, 0.3);
      caja(c, pr, k, -5, 5, -5, 5, 0, 190, MAD);
      palo(c, pr, [0, 0, 184], [62, 0, 184], C.hierro, 3);
      for (const u of [14, 50]) palo(c, pr, [u, 0, 184], [u, 0, 172], C.hierro, 2);
      caja(c, pr, k, 6, 58, -3, 3, 120, 172, ["#4A3020", "#6E4A2E", "#8A6040"]);
      const s = ve(pr, k, 0, 1, 0) ? 1 : -1;
      const m = pr(32, s * 4, 146);
      CASAS25.iconoOficio(c, op.icono || "yunque", m[0], m[1], 0.95);
    }
    return { dibujar, alto: 200, pie: [62, 8] };
  }

  // Las camas de hongos dorados de Ragna, a la sombra de las raíces: marco de tablas, tierra negra y los hongos, que de
  // noche brillan apenas (op.noche lo pide quien dibuja; los chicos juran que hablan)
  function camaHongos(sem) {
    const r = azar(sem * 37 + 5);
    const hongos = Array.from({ length: 14 }, () => [(r() - 0.5) * 120, (r() - 0.5) * 36, 7 + r() * 6, r() * 6]);
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      sombra(c, x + 6, y + 3, 76, 16, 0.3);
      caja(c, pr, k, -72, 72, -26, 26, 0, 18, MAD, "#2E241A");
      const lista = hongos.slice().sort((a, b) => pr.fondo(a[0], a[1]) - pr.fondo(b[0], b[1]));
      const noche = ENSERES25.noche || 0;
      for (const [u, w, h, f] of lista) {
        const q = pr(u, w, 18);
        c.fillStyle = "#E8DCC4";
        c.fillRect(q[0] - 1.5, q[1] - h, 3, h);
        E(c, q[0], q[1] - h, h * 0.8, h * 0.45, "#E8B04A");
        E(c, q[0] + 1, q[1] - h - 1, h * 0.4, h * 0.2, C.ambar);
        if (noche > 0.3 && (!window.CALIDAD || CALIDAD.nivel !== "baja")) halo(c, q[0], q[1] - h, 26, C.ambar, 0.18 * noche * (0.8 + Math.sin(t * 1.3 + f) * 0.2));
      }
    }
    return { dibujar, alto: 40, pie: [72, 26] };
  }

  // La balsa trabada en los troncos de la curva: seis troncos atados, medio hundida de un lado, con los sacos de sal de
  // Skeldra y la pértiga clavada; el agua le pega contra el costado
  function balsa(sem) {
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      const v = Math.sin(t * 1.1 + sem) * 2;
      c.save();
      c.translate(0, v);
      const filas = [-75, -45, -15, 15, 45, 75].map((w, i) => [w, -10 + i * 3]);
      filas.sort((a, b) => pr.fondo(0, a[0]) - pr.fondo(0, b[0]));
      for (const [w, z] of filas) leno(c, pr, k, -150, 150, w, z, 15);
      for (const [u, w] of [[-60, -30], [-10, 20], [40, -25]]) caja(c, pr, k, u - 26, u + 26, w - 18, w + 18, 18, 58, ["#A8987A", "#C8B898", "#E0D4BC"]);
      palo(c, pr, [110, 40, 10], [150, 70, 220], C.maderaSombra, 5);
      c.restore();
      // la espuma donde la corriente le pega
      const a = pr(-160, -90, 0),
        b = pr(-160, 90, 0);
      alfa(c, 0.5 + Math.sin(t * 3) * 0.2, () => L(c, a[0], a[1], b[0], b[1], "#C8E0E4", 6));
    }
    return { dibujar, alto: 230, pie: [160, 95] };
  }

  return { balsa, camaHongos, tablillas, cintas, cofre, secaderoPescado, hnefatafl, ofrenda, colmenas, gallinero, posteCrecidas, tableroSendas, cartelOficio, farol, roca, muneco, caja, estirado, disco, huerta, espantapajaros, carro, lenera, forja, chimenea, tablon, mesa, estante, tendedero, ahumadero, lona, tronco, pilaTroncos, fardo, diana, campana, catre, estandarte, posteHongo };
})();
