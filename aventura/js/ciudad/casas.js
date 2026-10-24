// ---------- las casas de la capital (módulo CASAS25) ----------
// Cada casa tiene sus tres medidas de verdad (ancho, fondo y alto de paredes y techo, en unidades del mundo) y se
// dibuja en 2.5D desde el ángulo que tenga la cámara: el piso se ve desde arriba, achicado por k, y lo parado sube
// derecho. Las caras que miran a la cámara se pintan con lo que llevan (troncos, zócalo de piedras de río, puerta
// tallada, ventanas con postigos, tablas cruzadas del hastial) usando las mismas piezas que la casa del bosque
// (ASSETS.PIEZAS_CASA), así es la misma familia. La luz viene siempre de arriba a la derecha de la pantalla: la cara
// que mira a la derecha es la clara y la de la izquierda queda en sombra.
// CASAS25.crear(ficha, semilla) → casa · casa.dibujar(c, x, y, giro, k, t) · casa.huella(x, y) (choque en el mundo)
window.CASAS25 = (function () {
  "use strict";
  const { P, E, R, L, alfa, azar, sombra, halo } = DIB;
  const C = ASSETS.C;
  const PZ = ASSETS.PIEZAS_CASA;
  const S = 1.7; // el tamaño de los detalles (troncos, ventanas, puertas): el mismo de las casas del bosque

  // completa la ficha con lo que no se pidió (siempre igual para la misma semilla)
  function completar(f, sem) {
    const r = azar(sem * 7 + 3);
    const o = Object.assign({}, f);
    o.W = o.W || 380 + r() * 240;
    o.D = o.D || 300 + r() * 140;
    o.pisos = o.pisos || (r() < 0.22 ? 2 : 1);
    o.H = o.H || (o.pisos === 2 ? 255 : 168);
    if (o.pared == null) o.pared = Math.floor(r() * PZ.PAREDES.length);
    if (o.postigo == null) o.postigo = Math.floor(r() * PZ.POSTIGOS.length);
    if (o.techo == null) o.techo = Math.floor(r() * PZ.TECHOS.length);
    o.tipo = o.tipo || (r() < 0.78 ? "dosAguas" : "cuatroAguas");
    o.RT = o.RT || Math.min(o.D * 0.62, 120 + r() * 50);
    o.alero = o.alero != null ? o.alero : 22 + r() * 10;
    if (o.puerta == null) o.puerta = (r() - 0.5) * 0.5; // corrida del centro del frente (fracción del ancho)
    if (o.chimenea === undefined) o.chimenea = r() < 0.85 ? { u: (r() - 0.5) * 0.5, w: -0.12 } : null;
    if (o.porche === undefined) o.porche = r() < 0.38 ? { fondo: 90 + r() * 30 } : null;
    if (o.anexo === undefined) o.anexo = r() < 0.3 ? { lado: r() < 0.5 ? -1 : 1, W: 140 + r() * 60, D: o.D * (0.55 + r() * 0.3) } : null;
    if (o.galeria === undefined) o.galeria = !o.porche && r() < 0.2;
    if (o.escalera === undefined) o.escalera = o.pisos === 2 && r() < 0.5;
    if (o.buhardilla === undefined) o.buhardilla = o.pisos === 1 && o.tipo === "dosAguas" && o.W > 470 && r() < 0.45;
    if (o.dragones === undefined) o.dragones = o.tipo === "dosAguas" && r() < 0.6;
    if (o.lena === undefined) o.lena = r() < 0.4;
    o.ventanas = o.ventanas || Math.max(1, Math.round(o.W / 190));
    o.sem = sem;
    return o;
  }

  // ---------- proyección ----------
  // local (u a lo ancho, w hacia el frente, z para arriba) → pantalla; fi = giro de la casa + giro de la cámara
  function proyector(x, y, fi, k) {
    const co = Math.cos(fi),
      si = Math.sin(fi);
    const pr = (u, w, z) => [x + u * co - w * si, y + (u * si + w * co) * k - z];
    // hacia dónde mira en pantalla una dirección del piso: [derecha, hacia la cámara]
    pr.mira = (nu, nw) => [nu * co - nw * si, nu * si + nw * co];
    pr.fondo = (u, w) => u * si + w * co; // cuanto más grande, más cerca de la cámara
    return pr;
  }
  const area = (pts) => {
    let a = 0;
    for (let i = 0; i < pts.length; i += 2) {
      const j = (i + 2) % pts.length;
      a += pts[i] * pts[j + 1] - pts[j] * pts[i + 1];
    }
    return a;
  };
  // dibuja en un plano de la casa: (s a lo largo, t para arriba en la pared) con una transformación afín
  function enPlano(c, o, ex, ey, fn) {
    c.save();
    c.transform(ex[0], ex[1], ey[0], ey[1], o[0], o[1]);
    fn();
    c.restore();
  }

  function crear(ficha, sem) {
    const f = completar(ficha || {}, sem || 1);
    const pal = PZ.PAREDES[f.pared % PZ.PAREDES.length],
      pos = PZ.POSTIGOS[f.postigo % PZ.POSTIGOS.length],
      [tS, tC, tL] = f.colTecho || PZ.TECHOS[f.techo % PZ.TECHOS.length],
      colP = ["#4A3020", "#3A2A1E", "#5A3A24", "#2E3A24"][(sem + 1) % 4];
    const W = f.W,
      D = f.D,
      H = f.H,
      RT = f.RT,
      ov = f.alero,
      HR = H + RT,
      W2 = W / 2,
      D2 = D / 2,
      dos = f.pisos === 2,
      pdx = f.puerta * W;

    // ---------- lo que lleva cada pared, vista de frente (s de 0 a len, t = 0 el piso, hacia arriba negativo) ----------
    // piedra antigua abajo (las casas viejas y las especiales): hileras de bloques grises desparejos hasta f.piedra
    const piedra = (len, alto) => {
      if (!f.piedra) return;
      const hp = Math.min(alto, f.piedra);
      R(c0, 0, -hp, len, hp, "#5E625C");
      const fila = 26 * S;
      for (let i = 0; i * fila < hp; i++) {
        let x = (i % 2) * 18 * S;
        const y = -(i + 1) * fila;
        R(c0, 0, y + fila - 2.5 * S, len, 2.5 * S, "#46423C");
        while (x < len) {
          const w = (30 + ((i * 7 + x) % 17)) * S;
          R(c0, x, Math.max(-hp, y), 2.5 * S, Math.min(fila, hp + y), "#46423C");
          if ((i + Math.floor(x)) % 5 === 0) R(c0, x + 3 * S, Math.max(-hp, y) + 2 * S, w - 6 * S, Math.min(fila, hp + y) - 6 * S, "#6E726A");
          x += w;
        }
      }
      R(c0, 0, -hp - 4 * S, len, 5 * S, pal[2]);
    };
    const zocalo = (len) => {
      for (let k = 0; k < Math.round(len / (22 * S)); k++) E(c0, 11 * S + k * 22 * S, -5 * S, 12 * S, 7 * S, k % 2 ? "#4E524A" : "#5E6258");
      R(c0, 0, -12 * S, len, 12 * S, "rgba(0,0,0,0.14)");
    };
    let c0 = null; // el lienzo del cuadro (lo usan las funciones de pared)
    const filaVentanas = (len, saltar, alto) => {
      const n = Math.max(1, Math.round(len / 190));
      for (let k = 0; k < n; k++) {
        const wx = ((k + 0.5) / n) * len;
        if (saltar != null && Math.abs(wx - saltar) < 60 * S) continue;
        PZ.ventana(c0, wx, -alto, 22 * S, 28 * S, pos, S);
      }
    };
    const paredFrente = (len) => {
      PZ.troncos(c0, 0, -H, len, H, S, [-2 * S, len + 2 * S]);
      piedra(len, H);
      zocalo(len);
      if (dos) {
        R(c0, -4 * S, -H * 0.52 - 8 * S, len + 8 * S, 8 * S, pal[2]);
        filaVentanas(len, f.escalera ? len * 0.22 : null, H * 0.6);
      }
      filaVentanas(len, len / 2 + pdx, 30 * S);
      PZ.puerta(c0, len / 2 + pdx, 0, S, colP);
      if (f.cartel) cartel(len / 2 + pdx - 70 * S, -118 * S);
      if (f.entra) {
        const fx = len / 2 + pdx + 34 * S;
        L(c0, fx, -96 * S, fx + 14 * S, -96 * S, C.hierro, 3 * S);
        R(c0, fx + 8 * S, -92 * S, 12 * S, 16 * S, "#1A140E");
        alfa(c0, 0.9, () => R(c0, fx + 10 * S, -90 * S, 8 * S, 12 * S, C.ambar));
      }
    };
    // el cartel tallado que cuelga de un brazo de hierro (f.cartel: "hongo" para la hospedería)
    function cartel(x, y) {
      L(c0, x - 30 * S, y - 20 * S, x + 30 * S, y - 20 * S, C.hierro, 3 * S);
      L(c0, x - 22 * S, y - 20 * S, x - 22 * S, y - 12 * S, C.hierro, 2 * S);
      L(c0, x + 22 * S, y - 20 * S, x + 22 * S, y - 12 * S, C.hierro, 2 * S);
      P(c0, [x - 30 * S, y - 12 * S, x + 30 * S, y - 12 * S, x + 30 * S, y + 26 * S, x - 30 * S, y + 26 * S], C.maderaSombra);
      P(c0, [x - 26 * S, y - 8 * S, x + 26 * S, y - 8 * S, x + 26 * S, y + 22 * S, x - 26 * S, y + 22 * S], C.madera);
      if (f.cartel === "hongo") {
        R(c0, x - 3 * S, y + 4 * S, 6 * S, 14 * S, "#E8DCC4");
        P(c0, [x - 16 * S, y + 6 * S, x - 10 * S, y - 4 * S, x + 10 * S, y - 4 * S, x + 16 * S, y + 6 * S], "#E8B04A");
        P(c0, [x, y - 4 * S, x + 10 * S, y - 4 * S, x + 16 * S, y + 6 * S, x + 2 * S, y + 6 * S], C.ambar);
      }
    }
    const paredAtras = (len) => {
      PZ.troncos(c0, 0, -H, len, H, S, [-2 * S, len + 2 * S]);
      piedra(len, H);
      zocalo(len);
      filaVentanas(len, null, 30 * S);
      if (dos) filaVentanas(len, null, H * 0.6);
    };
    const paredCostado = (len) => {
      PZ.troncos(c0, 0, -H, len, H, S, null);
      piedra(len, H);
      zocalo(len);
      PZ.ventana(c0, len / 2, -H * 0.38, 18 * S, 26 * S, pos, S);
      R(c0, 0, -H, 6 * S, H, pal[2]);
      R(c0, len - 6 * S, -H, 6 * S, H, pal[2]);
    };

    // una pared de (u0, w0) a (u1, w1) con normal (nu, nw): solo si mira a la cámara
    function pared(pr, u0, w0, u1, w1, nu, nw, alto, lleva, colores) {
      const [nx, ny] = pr.mira(nu, nw);
      if (ny <= 0.01) return;
      const a = pr(u0, w0, 0),
        b = pr(u1, w1, 0),
        pts = [a[0], a[1], b[0], b[1], b[0], b[1] - alto, a[0], a[1] - alto];
      const col = colores || pal;
      P(c0, pts, nx > 0.3 ? col[1] : col[0]);
      const len = Math.hypot(u1 - u0, w1 - w0);
      if (lleva) enPlano(c0, a, [(b[0] - a[0]) / len, (b[1] - a[1]) / len], [0, 1], () => lleva(len));
      if (nx < -0.3) alfa(c0, 0.2 * -nx, () => P(c0, pts, "#000000"));
    }
    // un faldón de techo: cuatro (o tres) puntos locales [u, w, z]; con hileras de pizarra paralelas al alero
    function faldon(pr, q, tejas) {
      const pts = [];
      q.forEach(([u, w, z]) => pts.push(...pr(u, w, z)));
      const mira = area(pts) < 0; // los que miran a la cámara se ven del lado de arriba
      // el lado: hacia dónde cae el agua, en pantalla
      const sube = [q[q.length - 1][0] - q[0][0], q[q.length - 1][1] - q[0][1]];
      const [nx] = pr.mira(-sube[0], -sube[1]);
      P(c0, pts, nx > 0.25 ? tC : nx < -0.25 ? tS : mira ? tC : tS);
      if (tejas !== false && q.length === 4) {
        for (let k = 1; k < 5; k++) {
          const u = k / 5,
            a = pr(q[0][0] + (q[3][0] - q[0][0]) * u, q[0][1] + (q[3][1] - q[0][1]) * u, q[0][2] + (q[3][2] - q[0][2]) * u),
            b = pr(q[1][0] + (q[2][0] - q[1][0]) * u, q[1][1] + (q[2][1] - q[1][1]) * u, q[1][2] + (q[2][2] - q[1][2]) * u);
          L(c0, a[0], a[1], b[0], b[1], nx > 0.25 ? tL : tC, 1.5 * S);
        }
      }
      L(c0, pts[0], pts[1], pts[2], pts[3], tS, 5 * S);
      return pts;
    }
    // manchas de musgo sobre un faldón (en el plano del faldón)
    function musgo(pr, q, n) {
      const o = pr(...q[0]),
        b = pr(...q[1]),
        d = pr(...q[q.length - 1]);
      const ls = Math.hypot(b[0] - o[0], b[1] - o[1]) || 1,
        lt = Math.hypot(d[0] - o[0], d[1] - o[1]) || 1;
      enPlano(c0, o, [(b[0] - o[0]) / ls, (b[1] - o[1]) / ls], [(d[0] - o[0]) / lt, (d[1] - o[1]) / lt], () => {
        for (let k = 0; k < n; k++) {
          const u = ((sem * 7 + k * 29) % 100) / 100,
            v = ((sem * 3 + k * 41) % 100) / 100;
          E(c0, ls * (0.1 + u * 0.8), lt * (0.08 + v * 0.3), (16 + (k % 3) * 7) * S, 6 * S, PZ.MUSGO[(k + sem) % 3]);
        }
      });
    }

    // ---------- el cuerpo de la casa ----------
    function cuerpo(pr, t) {
      // paredes (solo las que miran a la cámara; el orden no importa porque no se tapan entre ellas)
      pared(pr, -W2, D2, W2, D2, 0, 1, H, paredFrente);
      pared(pr, W2, D2, W2, -D2, 1, 0, H, paredCostado);
      pared(pr, W2, -D2, -W2, -D2, 0, -1, H, paredAtras);
      pared(pr, -W2, -D2, -W2, D2, -1, 0, H, paredCostado);
      // las cabezas de los troncos en las esquinas que se ven
      [[-W2, D2], [W2, D2], [W2, -D2], [-W2, -D2]].forEach(([u, w]) => {
        const [mx, my] = pr.mira(Math.sign(u), Math.sign(w));
        if (my < -0.2) return;
        const p = pr(u + Math.sign(u) * 6, w + Math.sign(w) * 6, 0);
        for (let z = 6.5 * S; z < H; z += 13 * S) {
          E(c0, p[0], p[1] - z, 7 * S, 6.5 * S, "#7A5A3A");
          E(c0, p[0] + mx * 1.5 * S, p[1] - z, 3.5 * S, 3 * S, "#9A7A52");
        }
      });
      const zA = H - 6 * S; // altura del alero
      if (f.tipo === "dosAguas") {
        // hastiales en los dos costados
        [-1, 1].forEach((l) => {
          const a = pr(l * W2, l > 0 ? D2 : -D2, H),
            b = pr(l * W2, l > 0 ? -D2 : D2, H),
            q = pr(l * W2, 0, HR),
            pts = [a[0], a[1], b[0], b[1], q[0], q[1]];
          const [nx, ny] = pr.mira(l, 0);
          if (ny <= 0.01) return;
          P(c0, pts, nx > 0.3 ? pal[1] : pal[0]);
          // tablas del hastial
          for (let k = 1; k < 6; k++) {
            const z = H + (RT * k) / 6,
              ww = D2 * (1 - k / 6),
              p0 = pr(l * W2, -ww, z),
              p1 = pr(l * W2, ww, z);
            L(c0, p0[0], p0[1], p1[0], p1[1], "rgba(0,0,0,0.26)", 2.5 * S);
          }
          if (nx < -0.3) alfa(c0, 0.2 * -nx, () => P(c0, pts, "#000000"));
          const m = pr(l * W2, 0, H + RT * 0.36);
          E(c0, m[0], m[1], 9 * S, 9 * S, "#1A140E");
          alfa(c0, 0.5, () => E(c0, m[0], m[1], 6 * S, 6 * S, C.ambar));
        });
        // los faldones: primero el que queda atrás
        const fa = [
          [[-W2 - ov, D2 + ov, zA], [W2 + ov, D2 + ov, zA], [W2 + ov, 0, HR], [-W2 - ov, 0, HR]],
          [[W2 + ov, -D2 - ov, zA], [-W2 - ov, -D2 - ov, zA], [-W2 - ov, 0, HR], [W2 + ov, 0, HR]],
        ].sort((a, b) => pr.fondo(0, a[0][1]) - pr.fondo(0, b[0][1]));
        fa.forEach((q) => {
          faldon(pr, q);
          musgo(pr, q, 3);
          if (f.techo === 1) {
            // tepe: el pasto asoma en la cumbrera
            for (let k = 0; k <= 10; k++) {
              const p = pr(-W2 - ov + ((W + ov * 2) * k) / 10, 0, HR);
              P(c0, [p[0] - 5 * S, p[1] + 2 * S, p[0], p[1] - (8 + (k % 3) * 4) * S, p[0] + 5 * S, p[1] + 2 * S], PZ.MUSGO[k % 3]);
            }
          }
        });
        const r0 = pr(-W2 - ov, 0, HR),
          r1 = pr(W2 + ov, 0, HR);
        L(c0, r0[0], r0[1], r1[0], r1[1], tL, 6 * S);
        // las tablas cruzadas con cabeza de dragón en los hastiales que se ven
        if (f.dragones)
          [-1, 1].forEach((l) => {
            if (pr.mira(l, 0)[1] <= 0.12 || f.dragones === -l) return;
            // solo el tramo alto de las tablas, cruzándose en la cumbrera
            const uu = l * (W2 + ov * 0.4),
              a = pr(uu, (D2 + ov) * 0.4, HR - (HR - zA) * 0.4),
              b = pr(uu, -(D2 + ov) * 0.4, HR - (HR - zA) * 0.4),
              q = pr(uu, 0, HR);
            PZ.tablasCruzadas(c0, a[0], a[1], q[0], q[1], b[0], b[1], S);
          });
      } else {
        // a cuatro aguas: la cumbrera más corta, dos faldones largos y dos triangulares
        const cu = Math.max(0, W2 - D2 * 0.9);
        const fa = [
          [[-W2 - ov, D2 + ov, zA], [W2 + ov, D2 + ov, zA], [cu, 0, HR], [-cu, 0, HR]],
          [[W2 + ov, -D2 - ov, zA], [-W2 - ov, -D2 - ov, zA], [-cu, 0, HR], [cu, 0, HR]],
          [[W2 + ov, D2 + ov, zA], [W2 + ov, -D2 - ov, zA], [cu, 0, HR]],
          [[-W2 - ov, -D2 - ov, zA], [-W2 - ov, D2 + ov, zA], [-cu, 0, HR]],
        ]
          .map((q) => ({ q, d: pr.fondo((q[0][0] + q[1][0]) / 2, (q[0][1] + q[1][1]) / 2) }))
          .sort((a, b) => a.d - b.d);
        fa.forEach(({ q }) => {
          faldon(pr, q, q.length === 4);
          if (q.length === 4) musgo(pr, q, 2);
        });
        const r0 = pr(-cu, 0, HR),
          r1 = pr(cu, 0, HR);
        L(c0, r0[0], r0[1], r1[0], r1[1], tL, 6 * S);
      }
      // las buhardillas sobre el faldón de adelante (f.buhardilla: true o cuántas)
      if (f.buhardilla && f.tipo === "dosAguas" && pr.mira(0, 1)[1] > 0.15) {
        const n = f.buhardilla === true ? 1 : f.buhardilla;
        for (let i = 0; i < n; i++) {
          const w0 = D2 * 0.42,
            z0 = zA + (HR - zA) * (1 - (w0 + ov) / (D2 + ov)),
            u0 = n === 1 ? W * 0.12 : -W2 * 0.75 + (i * W * 0.75) / (n - 1),
            bw = 30 * S,
            bh = 40 * S;
          const a = pr(u0 - bw, w0 + 30, z0),
            b = pr(u0 + bw, w0 + 30, z0);
          P(c0, [a[0], a[1], b[0], b[1], b[0], b[1] - bh, a[0], a[1] - bh], pal[0]);
          const m = pr(u0, w0 + 30, z0);
          PZ.ventana(c0, m[0], m[1] - 6 * S, 18 * S, 24 * S, pos, S);
          const top = pr(u0, w0 + 30, z0 + bh + 34 * S),
            back = pr(u0, w0 - 60, z0 + bh + 24 * S);
          P(c0, [a[0] - 8 * S, a[1] - bh + 4 * S, top[0], top[1], back[0], back[1]], tS);
          P(c0, [top[0], top[1], b[0] + 8 * S, b[1] - bh + 4 * S, back[0], back[1]], tC);
        }
      }
      // la chimenea de piedra
      if (f.chimenea) {
        const [cx, cy] = pr(f.chimenea.u * W, f.chimenea.w * D, HR - 16 * S);
        P(c0, [cx - 11 * S, cy + 14 * S, cx - 11 * S, cy - 34 * S, cx + 12 * S, cy - 34 * S, cx + 12 * S, cy + 10 * S], "#5A5650");
        P(c0, [cx + 4 * S, cy + 12 * S, cx + 4 * S, cy - 34 * S, cx + 12 * S, cy - 34 * S, cx + 12 * S, cy + 10 * S], "#6E6A62");
        R(c0, cx - 14 * S, cy - 38 * S, 29 * S, 6 * S, "#46423C");
        PZ.humo(c0, cx + 1 * S, cy - 44 * S, t, S, sem);
      }
    }

    // ---------- lo que se arrima a la casa ----------
    // el porche sobre la puerta: dos postes y un techito
    function porche(pr) {
      const fo = f.porche.fondo,
        u0 = pdx - 70 * S,
        u1 = pdx + 70 * S,
        z = 92 * S;
      [u0 + 8 * S, u1 - 8 * S].forEach((u) => {
        const p = pr(u, D2 + fo - 8, 0);
        R(c0, p[0] - 3 * S, p[1] - z, 6 * S, z, C.maderaSombra);
      });
      faldon(pr, [[u0 - 10, D2 + fo, z - 18], [u1 + 10, D2 + fo, z - 18], [u1 + 10, D2, z + 8], [u0 - 10, D2, z + 8]], false);
    }
    // la galería de postes a lo largo del frente, con un banco
    function galeria(pr) {
      const fo = 110,
        z = H * 0.72;
      for (let k = 0; k <= 4; k++) {
        const p = pr(-W2 + 10 + (k * (W - 20)) / 4, D2 + fo - 10, 0);
        R(c0, p[0] - 3 * S, p[1] - z, 6 * S, z, C.maderaSombra);
      }
      const b = pr(W * 0.25, D2 + 30, 0);
      R(c0, b[0] - 35 * S, b[1] - 22 * S, 70 * S, 6 * S, C.madera);
      faldon(pr, [[-W2 - 14, D2 + fo + 10, z - 12], [W2 + 14, D2 + fo + 10, z - 12], [W2 + 14, D2, z + 22], [-W2 - 14, D2, z + 22]], false);
    }
    // el anexo de techo bajo con la leña
    function anexo(pr) {
      const a = f.anexo,
        l = a.lado,
        u0 = l * W2,
        u1 = l * (W2 + a.W),
        w0 = D2,
        w1 = D2 - a.D,
        h = H * 0.62;
      pared(pr, Math.min(u0, u1), w0, Math.max(u0, u1), w0, 0, 1, h, (len) => {
        PZ.troncos(c0, 0, -h, len, h, S, null);
        if (f.lena)
          for (let fi = 0; fi < 3; fi++)
            for (let k = 0; k < 5 - fi; k++) {
              const lx = 14 * S + k * 12 * S + fi * 6 * S,
                ly = -6 * S - fi * 11 * S;
              E(c0, lx, ly, 6 * S, 5.5 * S, C.madera);
              E(c0, lx, ly, 3 * S, 2.5 * S, C.maderaLuz);
            }
      });
      pared(pr, u1, w0, u1, w1, l, 0, h, (len) => PZ.troncos(c0, 0, -h, len, h, S, null));
      pared(pr, u1, w1, u0, w1, 0, -1, h, null);
      faldon(pr, [[u1 + l * 14, w0 + 14, h - 4], [u1 + l * 14, w1 - 14, h - 4], [u0, w1 - 14, h + 40], [u0, w0 + 14, h + 40]].map((p) => p), false);
    }
    // la escalera de afuera hasta el piso alto (a lo largo del frente)
    function escalera(pr) {
      const top = H * 0.52,
        u0 = -W * 0.05,
        u1 = -W * 0.45,
        w = D2 + 34;
      for (let k = 0; k < 9; k++) {
        const u = k / 9,
          p = pr(u0 + (u1 - u0) * u, w, top * u);
        R(c0, p[0] - 18 * S, p[1] - 6 * S, 36 * S, 6 * S, k % 2 ? C.madera : C.maderaLuz);
      }
      const a = pr(u0, w + 18, 34 * S),
        b = pr(u1, w + 18, top + 34 * S);
      L(c0, a[0], a[1], b[0], b[1], C.maderaSombra, 3 * S);
    }

    // ---------- el dibujo entero ----------
    // (x, y): el centro de la planta en la pantalla · giro: el de la casa más el de la cámara · k: cuánto se achica el piso
    function dibujar(c, x, y, giro, k, t) {
      c0 = c;
      const pr = proyector(x, y, giro, k);
      // la sombra elíptica corrida a la derecha, como todo en el juego
      const rx = (Math.abs(Math.cos(giro)) * W + Math.abs(Math.sin(giro)) * D) / 2,
        ry = ((Math.abs(Math.sin(giro)) * W + Math.abs(Math.cos(giro)) * D) / 2) * k;
      sombra(c, x + 24 * S, y + 4 * S, rx * 1.15 + 30, ry * 1.1 + 22, 0.34);
      // lo de adelante se dibuja después: porche, galería, escalera y anexo según el lado que mira a la cámara
      const delante = pr.mira(0, 1)[1] > 0;
      const partes = [];
      if (f.anexo) partes.push({ d: pr.fondo(f.anexo.lado * (W2 + f.anexo.W / 2), D2 - f.anexo.D / 2), fn: () => anexo(pr) });
      partes.push({ d: 0, fn: () => cuerpo(pr, t) });
      if (f.porche) partes.push({ d: delante ? 1e6 : -1e6, fn: () => porche(pr) });
      if (f.galeria) partes.push({ d: delante ? 1e6 : -1e6, fn: () => galeria(pr) });
      if (f.escalera) partes.push({ d: delante ? 1e6 + 1 : -1e6 - 1, fn: () => escalera(pr) });
      partes.sort((a, b) => a.d - b.d).forEach((p) => p.fn());
      // matas al pie de las esquinas de adelante
      [[-W2, D2], [W2, D2]].forEach(([u, w], i) => {
        if (pr.mira(Math.sign(u), Math.sign(w))[1] < 0) return;
        const p = pr(u, w, 0);
        PZ.matas(c, p[0], p[1] + 2 * S, S, sem + i * 2);
      });
      c0 = null;
    }

    // la huella en el mundo (para los choques): esquinas del rectángulo con su giro; incluye el anexo
    function huella(x, y, ry) {
      const co = Math.cos(ry),
        si = Math.sin(ry);
      const pt = (u, w) => [x + u * co - w * si, y + u * si + w * co];
      const l = [[pt(-W2, -D2), pt(W2, -D2), pt(W2, D2), pt(-W2, D2)]];
      if (f.anexo) {
        const a = f.anexo,
          u0 = a.lado * W2,
          u1 = a.lado * (W2 + a.W);
        l.push([pt(Math.min(u0, u1), D2 - a.D), pt(Math.max(u0, u1), D2 - a.D), pt(Math.max(u0, u1), D2), pt(Math.min(u0, u1), D2)]);
      }
      return l;
    }
    // la puerta en coordenadas locales (u, w): donde uno se para para entrar
    const puertaLocal = [pdx, D2 + 40];
    return { ficha: f, W, D, H, alto: HR, dibujar, huella, puertaLocal, radio: Math.hypot(W2 + (f.anexo ? f.anexo.W : 0), D2) + 40 };
  }

  return { crear, completar, proyector, S };
})();
