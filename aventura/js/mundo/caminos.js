// ---------- cómo se pintan los caminos (módulo SENDAS) ----------
// Cada camino es { p: [[x, y], …], w, tipo, borde, fundir }:
//   tipo: "tierra" (tierra pisada con huellas de carro), "adoquin" (piedras redondeadas sobre un cordón gris) o
//         "ladrillo" (ladrillos rojos a soga entre dos cordones de piedra), o un puente (PUENTES: tablas, piedra,
//         colgante, troncos, rúnico), que se traza y se tuerce igual y cruza el agua y la quebrada; un tramo de un
//         camino también puede ser puente, y cada punta se une al camino que llega con el material de ese camino
//   borde: con qué se funde a los costados: "pasto", "musgo", "agua" (barro mojado y charquitos), "tierra" (piedras
//          sueltas y tierra que se come el borde) o "" (corte limpio)
//   fundir: las puntas se deshacen de a poco en vez de cortar redondo (para que se junte con el pasto o con el agua).
//           La tierra se deshace sola en las puntas sueltas; una punta que cae sobre otro camino nunca se deshace,
//           así el cruce queda lleno.
// Todo sale de la posición a lo largo del camino, así un mismo camino se pinta igual en cada trozo del piso.
window.SENDAS = (function () {
  "use strict";
  const { P, E, poli } = DIB;
  const PUENTES = ["puente_tablas", "puente_piedra", "puente_cuerdas", "puente_troncos", "puente_runico"],
    esPuente = (tp) => PUENTES.includes(tp);
  const TIPOS = ["tierra", "adoquin", "ladrillo"].concat(PUENTES),
    BORDES = ["", "pasto", "musgo", "agua", "tierra"];
  // un número fijo entre 0 y 1 para cada (a, b, k)
  function hash(a, b, k) {
    let h = Math.imul((a | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((b | 0) + 0x7f4a7c15, 0xc2b2ae35) ^ Math.imul(k | 0, 0x27d4eb2f);
    h ^= h >>> 15;
    h = Math.imul(h, 0x2c1b3c6d);
    h ^= h >>> 12;
    return (h >>> 0) / 4294967296;
  }
  function trazo(c, pts, w, col, cap) {
    if (pts.length < 2 || w <= 0) return;
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.strokeStyle = col;
    c.lineWidth = w;
    c.lineJoin = "round";
    c.lineCap = cap || "round";
    c.stroke();
  }
  function distLinea(x, y, p) {
    let m = Infinity;
    for (let i = 1; i < p.length; i++) {
      const [ax, ay] = p[i - 1],
        [bx, by] = p[i],
        dx = bx - ax,
        dy = by - ay,
        l = dx * dx + dy * dy,
        u = l ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l)) : 0;
      m = Math.min(m, Math.hypot(x - ax - dx * u, y - ay - dy * u));
    }
    return m;
  }
  const largo = (p) => p.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0), 0);
  // el pedazo del camino entre las distancias a y b
  function recortar(p, a, b) {
    const out = [];
    let d = 0;
    for (let i = 1; i < p.length; i++) {
      const [ax, ay] = p[i - 1],
        [bx, by] = p[i],
        l = Math.hypot(bx - ax, by - ay);
      if (l === 0) continue;
      const t0 = (a - d) / l,
        t1 = (b - d) / l;
      if (t1 >= 0 && t0 <= 1) {
        const u0 = Math.max(0, t0),
          u1 = Math.min(1, t1);
        if (!out.length) out.push([ax + (bx - ax) * u0, ay + (by - ay) * u0]);
        out.push([ax + (bx - ax) * u1, ay + (by - ay) * u1]);
      }
      d += l;
    }
    return out;
  }
  // recorre el camino de a «paso» unidades: fn(x, y, dx, dy, d, i) con (dx, dy) la dirección y d la distancia
  function recorrer(p, paso, fn) {
    let d = 0,
      sig = 0,
      i = 0;
    for (let s = 1; s < p.length; s++) {
      const [ax, ay] = p[s - 1],
        [bx, by] = p[s],
        l = Math.hypot(bx - ax, by - ay);
      if (l === 0) continue;
      const dx = (bx - ax) / l,
        dy = (by - ay) / l;
      while (sig <= d + l) {
        const u = sig - d;
        fn(ax + dx * u, ay + dy * u, dx, dy, sig, i++);
        sig += paso;
      }
      d += l;
    }
  }
  // un rectángulo girado con la dirección del camino (ladrillos)
  function ladrillo(c, x, y, dx, dy, lar, anc, col) {
    const nx = -dy,
      ny = dx,
      a = lar / 2,
      b = anc / 2;
    P(c, [x - dx * a - nx * b, y - dy * a - ny * b, x + dx * a - nx * b, y + dy * a - ny * b, x + dx * a + nx * b, y + dy * a + ny * b, x - dx * a + nx * b, y - dy * a + ny * b], col);
  }

  const PIEDRAS = ["#6E6A62", "#7A746A", "#625C54", "#857E72"],
    LADRILLOS = ["#9C4A32", "#8A3E2A", "#A85A3C", "#7A3524", "#94452E"];
  const FUNDE = 150; // cuánto se deshace cada punta

  // pinta un camino en c, solo lo que cae en [x0, y0, x1, y1]; sem distingue un camino de otro.
  // capa: "base" (contornos y cordones), "cuerpo" (la tierra lisa), "centro" (la franja gastada del medio de la
  // tierra), "losa" (el fondo de adoquines y ladrillos), "detalle" (huellas, piedras, adoquines y ladrillos) o "borde"
  // (con qué se funde a los costados); sin capa pinta todo junto. Para que los caminos se unan sin costura (del mismo
  // material o de otro) se pintan todos de a capas, en ese orden: así la superficie de uno nunca tapa el medio o las
  // piedras del otro en un cruce, el cordón de piedra de un empedrado queda debajo de la tierra que lo cruza, las
  // huellas no siguen adentro de otro camino y los bordes no se pintan sobre otro camino (otros).
  const CAPAS = ["base", "cuerpo", "centro", "losa", "detalle", "borde"];
  // tramos: [tipo | null, …], uno por tramo (de p[k] a p[k + 1]); null es el tipo del camino. Los tramos seguidos del
  // mismo tipo se pintan juntos como un camino aparte, y como van de a capas se unen con los de al lado.
  function pintar(c, cm, sem, x0, y0, x1, y1, capa, otros) {
    const tr = cm.tramos;
    if (!tr || !tr.some((t, k) => t && t !== (cm.tipo || "tierra") && k < cm.p.length - 1)) return pintarUno(c, cm, sem, x0, y0, x1, y1, capa, otros);
    let ini = 0,
      n = 0;
    const tipoDe = (k) => tr[k] || cm.tipo || "tierra";
    for (let k = 1; k <= cm.p.length - 1; k++) {
      if (k < cm.p.length - 1 && tipoDe(k) === tipoDe(ini)) continue;
      // las puntas fundidas, solo en las puntas de verdad
      const tramo = Object.assign({}, cm, { p: cm.p.slice(ini, k + 1), tipo: tipoDe(ini), tramos: null, puntas: [ini === 0, k === cm.p.length - 1], deTramos: cm });
      pintarUno(c, tramo, sem + n++ * 17, x0, y0, x1, y1, capa, otros);
      ini = k;
    }
  }
  function pintarUno(c, cm, sem, x0, y0, x1, y1, capa, otros) {
    const en = (k) => !capa || capa === k;
    const p = cm.p,
      w = cm.w || 110,
      tipo = cm.tipo || "tierra",
      L = largo(p);
    if (p.length < 2 || L < 1 || esPuente(tipo)) return; // los puentes se pintan encima, con pintarPuentes
    let minx = Infinity,
      miny = Infinity,
      maxx = -Infinity,
      maxy = -Infinity;
    p.forEach(([x, y]) => ((minx = Math.min(minx, x)), (miny = Math.min(miny, y)), (maxx = Math.max(maxx, x)), (maxy = Math.max(maxy, y))));
    const mg = w + 120;
    if (maxx + mg < x0 || minx - mg > x1 || maxy + mg < y0 || miny - mg > y1) return;
    const dentro = (x, y) => x > x0 - mg && x < x1 + mg && y > y0 - mg && y < y1 + mg;
    // los otros caminos que pasan cerca: ahí no va borde ni huellas (es donde se une con ellos)
    const lista = otros || [],
      cerca = lista.filter((o) => o !== cm && o !== cm.deTramos && o.p.some(([x, y]) => x > minx - 2000 && x < maxx + 2000 && y > miny - 2000 && y < maxy + 2000));
    const sobreOtro = (x, y, m = 4, fn) => cerca.some((o) => (!fn || fn(o)) && distLinea(x, y, o.p) < (o.w || 110) / 2 + m);
    // en cada punta: ¿se deshace? Solo si es una punta de verdad (no el cambio entre dos tramos), no cae sobre otro
    // camino y el camino pide fundirse (la tierra lo hace siempre)
    const suelta = (k) => !(cm.puntas && !cm.puntas[k]) && !sobreOtro(p[k ? p.length - 1 : 0][0], p[k ? p.length - 1 : 0][1], w * 0.3);
    const quiere = !!cm.fundir || tipo === "tierra";
    let fa = quiere && suelta(0),
      fb = quiere && suelta(1);
    if (L < FUNDE * (fa && fb ? 2.5 : 1.5)) fa = fb = false;
    const fundir = fa || fb;
    // cuánto queda de camino en ese punto (1 entero, 0 deshecho) cerca de las puntas
    const queda = (d) => Math.min(1, fa ? d / FUNDE : 1, fb ? (L - d) / FUNDE : 1);
    // lo entero (la tierra recién donde termina su cinta, así la punta redonda del trazo no asoma)
    const corte = tipo === "tierra" ? FUNDE : FUNDE * 0.75,
      cuerpo = fundir ? recortar(p, fa ? corte : 0, fb ? L - corte : L) : p;
    // las huellas y piedras no siguen adentro de otro camino: la tierra se corta sobre cualquiera, el empedrado solo
    // sobre otro empedrado que se pintó antes (el primero de la lista gana el cruce)
    const yo = lista.indexOf(cm.deTramos || cm);
    const tapado = (x, y) =>
      cerca.length > 0 && (tipo === "tierra" ? sobreOtro(x, y, -4) : sobreOtro(x, y, -4, (o) => (o.tipo || "tierra") !== "tierra" && lista.indexOf(o) < yo));
    // un empedrado que termina adentro de otro camino (de tierra, o de un empedrado que gana el cruce) no cierra con
    // una punta redonda: el cordón y el fondo se cortan derechos en el borde del otro, y de ahí para adentro las piedras
    // o ladrillos se van soltando hasta perderse en la tierra o en las piedras del otro
    const cede = (o) => (o.tipo || "tierra") === "tierra" || lista.indexOf(o) < yo;
    const metido = (x, y, m = 0) => cerca.some((o) => cede(o) && distLinea(x, y, o.p) < (o.w || 110) / 2 + m);
    const entra = (k) => {
      if (tipo === "tierra" || !cerca.length || (cm.puntas && !cm.puntas[k])) return 0;
      const q = p[k ? p.length - 1 : 0];
      if (!metido(q[0], q[1])) return 0;
      // el corte va donde las dos esquinas del cordón siguen adentro del otro camino (si el cruce es en diagonal, una
      // esquina sale antes que el centro y asomaría al pasto)
      const m = (w + 28) / 2,
        adentro = (d) => {
          const q2 = recortar(p, Math.max(0, d - 3), Math.min(L, d + 3)),
            [ax, ay] = q2[0],
            [bx, by] = q2[q2.length - 1],
            l = Math.hypot(bx - ax, by - ay) || 1,
            nx = -(by - ay) / l,
            ny = (bx - ax) / l,
            x = (ax + bx) / 2,
            y = (ay + by) / 2;
          // (hasta el contorno oscuro del otro, que también tapa)
          return metido(x, y) && metido(x + nx * m, y + ny * m, 12) && metido(x - nx * m, y - ny * m, 12);
        };
      let d = 0;
      while (d < L / 2 && metido(...recortar(p, k ? L - d : d, k ? L - d : d)[0])) d += 6;
      // del borde para atrás, hasta que las dos esquinas entren
      let c0 = Math.max(0, d - 6);
      while (c0 > 0 && !adentro(k ? L - c0 : c0)) c0 -= 6;
      return { d, c: Math.max(0, c0) };
    };
    const za = entra(0) || { d: 0, c: 0 },
      zb = entra(1) || { d: 0, c: 0 },
      ea = za.d,
      eb = zb.d;
    // cuánto queda del empedrado en ese punto por estar metido en otro camino (1 entero, 0 nada)
    const suelto = (d) => Math.min(1, ea ? 1 - (ea - d) / Math.min(w * 1.2, ea + 12) : 1, eb ? 1 - (d - (L - eb)) / Math.min(w * 1.2, eb + 12) : 1);
    // el empedrado entero: con punta redonda en las puntas libres y cortado derecho donde entra en otro
    const losa = (pts, ancho, col) => {
      if (!(ea || eb)) return trazo(c, pts, ancho, col);
      // el cuerpo (pts ≠ p) ya viene recortado por las puntas que se funden
      const a = Math.max(za.c, pts !== p && fa ? FUNDE * 0.75 : 0),
        b = Math.min(L - zb.c, pts !== p && fb ? L - FUNDE * 0.75 : L);
      losaEntre(a, b, ancho, col);
    };
    const losaEntre = (a, b, ancho, col) => {
      if (b - a < 2) return;
      const pts = recortar(p, ea ? a - w * 0.1 : a, eb ? b + w * 0.1 : b);
      trazo(c, pts, ancho, col, "butt");
      // la punta libre sigue redonda; la que entra en otro camino se deshace en un borde mordido, más largo en el medio
      // que en las esquinas (las esquinas no salen del otro camino)
      // la punta que entra en otro camino no tiene forma: se deshace en manchones sueltos de distinto tamaño, más
      // chicos y más separados cuanto más adentro (cada capa usa los mismos, agrandados por lo que es más ancha)
      const mordida = (q, r, k) => {
        const l = Math.hypot(q[0] - r[0], q[1] - r[1]) || 1,
          dx = (q[0] - r[0]) / l,
          dy = (q[1] - r[1]) / l,
          h = w / 2,
          extra = (ancho - w) / 2;
        for (let j = 0; j < 15; j++) {
          const z = (n) => hash(sem + 307, k * 50 + j, n),
            t = z(1) * 2 - 1,
            hondo = z(2),
            e = -w * 0.12 + hondo * w * 0.5 * Math.sqrt(1 - t * t),
            rr = (w * (0.09 + z(3) * 0.1) * (1 - hondo * 0.5)) + extra * 0.6;
          P(c, poli(q[0] - dy * t * h * 0.9 + dx * e, q[1] + dx * t * h * 0.9 + dy * e, rr, rr * (0.6 + z(4) * 0.3), 7, z(5) * 6), col);
        }
      };
      if (!ea) E(c, pts[0][0], pts[0][1], ancho / 2, ancho / 2, col);
      else mordida(pts[0], pts[1], 0);
      if (!eb) E(c, pts[pts.length - 1][0], pts[pts.length - 1][1], ancho / 2, ancho / 2, col);
      else mordida(pts[pts.length - 1], pts[pts.length - 2], 1);
    };

    if (tipo === "tierra") {
      if (fundir) {
        // la tierra se angosta hacia las puntas: una cinta que se afina, con el borde apenas mordido
        const cinta = (d0, d1, ancho, col, k) => {
          const izq = [],
            der = [];
          recorrer(recortar(p, d0, d1), 10, (x, y, dx, dy, d, i) => {
            const q = queda(d0 + d),
              h = ancho(q) + (hash(sem + k, i, 3) - 0.5) * 4 * (1 - q);
            izq.push(x - dy * h, y + dx * h);
            der.push(x + dy * h, y - dx * h);
          });
          if (izq.length < 4) return;
          const pts = izq.slice();
          for (let i = der.length - 2; i >= 0; i -= 2) pts.push(der[i], der[i + 1]);
          P(c, pts, col);
          // la punta, redonda
          [0, izq.length - 2].forEach((i) => {
            const h = Math.hypot(izq[i] - der[i], izq[i + 1] - der[i + 1]) / 2;
            E(c, (izq[i] + der[i]) / 2, (izq[i + 1] + der[i + 1]) / 2, h, h, col);
          });
        };
        const capas = [
          ["base", (q) => (w / 2 + 13) * (0.5 + Math.sqrt(q) * 0.5), "#3A3022"],
          ["cuerpo", (q) => (w / 2) * (0.42 + Math.sqrt(q) * 0.58), "#5C4A32"],
          ["centro", (q) => (w / 4) * (0.3 + Math.sqrt(q) * 0.7), "#6A563A"],
        ];
        capas.forEach(([k, ancho, col], j) => {
          if (!en(k)) return;
          if (fa && dentro(p[0][0], p[0][1])) cinta(0, FUNDE + 10, ancho, col, j);
          if (fb && dentro(p[p.length - 1][0], p[p.length - 1][1])) cinta(L - FUNDE - 10, L, ancho, col, j + 5);
        });
      }
      if (en("base")) trazo(c, cuerpo, w + 26, "#3A3022");
      if (en("cuerpo")) trazo(c, cuerpo, w, "#5C4A32");
      if (en("centro")) trazo(c, cuerpo, w * 0.5, "#6A563A");
      // huellas de carro y piedritas
      if (en("detalle"))
        recorrer(p, 20, (x, y, dx, dy, d, i) => {
          if (!dentro(x, y) || queda(d) < 0.6 || tapado(x, y)) return;
          const nx = -dy,
            ny = dx;
          [-0.24, 0.24].forEach((k, j) => {
            if (hash(sem, i, j) < 0.82) E(c, x + nx * w * k, y + ny * w * k, 12, 3.2, "#4E3E2A", Math.atan2(dy, dx));
          });
          if (hash(sem, i, 7) < 0.35) {
            const o = (hash(sem, i, 8) - 0.5) * w * 0.9;
            E(c, x + nx * o, y + ny * o, 4 + hash(sem, i, 9) * 4, 2.5 + hash(sem, i, 10) * 2, "#6E6458");
          }
        });
    } else if (tipo === "adoquin") {
      // abajo un poco de tierra (lo que se ve donde faltan piedras), el cordón y la junta
      if (en("base")) {
        losa(p, w + 18, "#4A3C28");
        losa(cuerpo, w + 26, "#3E3A36");
      }
      if (en("losa")) losa(cuerpo, w + 4, "#4A4640");
      if (en("detalle"))
        recorrer(p, 22, (x, y, dx, dy, d, i) => {
          if (!dentro(x, y) || tapado(x, y) || suelto(d) <= 0) return;
          const nx = -dy,
            ny = dx,
            q = Math.min(queda(d), suelto(d)),
            off = i % 2 ? 11 : 0;
          for (let o = -w / 2 + 12 + off, j = 0; o <= w / 2 - 10; o += 22, j++) {
            if (q < 1 && hash(sem, i, j) > q) continue;
            // las sueltas (en una punta) se corren, se achican y se giran
            const fl = 1 - q,
              cx = x + nx * o + dx * (hash(sem, i, j + 40) - 0.5) * (4 + fl * 30) + nx * (hash(sem, i, j + 80) - 0.5) * fl * 24,
              cy = y + ny * o + dy * (hash(sem, i, j + 50) - 0.5) * (4 + fl * 30) + ny * (hash(sem, i, j + 80) - 0.5) * fl * 24,
              t = 1 - fl * hash(sem, i, j + 90) * 0.45;
            P(c, poli(cx, cy, 10.5 * t, 7.5 * t, 6, hash(sem, i, j + 60) * (2 + fl * 4)), PIEDRAS[Math.floor(hash(sem, i, j + 70) * PIEDRAS.length)]);
            P(c, poli(cx + 2, cy - 2, 5 * t, 3 * t, 5, 0.4), "rgba(242,236,236,0.08)"); // la luz de arriba a la derecha
          }
        });
    } else if (tipo === "ladrillo") {
      if (en("base")) {
        losa(p, w + 18, "#4A3C28");
        losa(cuerpo, w + 28, "#4E4A44");
        losa(cuerpo, w + 10, "#5E5850");
      }
      if (en("losa")) losa(cuerpo, w, "#4A2E22");
      // ladrillos a soga: carriles a lo ancho, cada uno corrido medio ladrillo del de al lado
      if (en("detalle"))
        recorrer(p, 16, (x, y, dx, dy, d, i) => {
          if (!dentro(x, y) || tapado(x, y) || suelto(d) <= 0) return;
          const nx = -dy,
            ny = dx,
            q = Math.min(queda(d), suelto(d)),
            carriles = Math.max(2, Math.floor(w / 15));
          for (let j = 0; j < carriles; j++) {
            if ((i + j) % 2) continue; // cada ladrillo mide dos pasos de largo
            if (q < 1 && hash(sem, i, j) > q) continue;
            const o = -w / 2 + (j + 0.5) * (w / carriles);
            if (q < 1) {
              // suelto: corrido, más chico y torcido
              const fl = 1 - q,
                g = (hash(sem, i, j + 90) - 0.5) * fl * 1.6,
                ux = dx * Math.cos(g) - dy * Math.sin(g),
                uy = dx * Math.sin(g) + dy * Math.cos(g),
                sx = x + nx * o + dx * (hash(sem, i, j + 40) - 0.5) * fl * 30 + nx * (hash(sem, i, j + 50) - 0.5) * fl * 20,
                sy = y + ny * o + dy * (hash(sem, i, j + 40) - 0.5) * fl * 30 + ny * (hash(sem, i, j + 50) - 0.5) * fl * 20;
              ladrillo(c, sx, sy, ux, uy, 29 * (1 - fl * 0.3), (w / carriles - 3) * (1 - fl * 0.2), LADRILLOS[Math.floor(hash(sem, i, j + 30) * LADRILLOS.length)]);
            } else ladrillo(c, x + nx * o, y + ny * o, dx, dy, 29, w / carriles - 3, LADRILLOS[Math.floor(hash(sem, i, j + 30) * LADRILLOS.length)]);
          }
        });
    }

    // los costados: con qué se funde
    const borde = cm.borde || "";
    if (borde && en("borde")) {
      recorrer(p, 26, (x, y, dx, dy, d, i) => {
        if (!dentro(x, y) || queda(d) < 0.3) return;
        const nx = -dy,
          ny = dx,
          // en una punta de tierra que se afina el borde la sigue
          a = (w / 2) * (tipo === "tierra" && fundir ? 0.42 + Math.sqrt(queda(d)) * 0.58 : 1) + (tipo === "tierra" ? 6 : 12);
        [-1, 1].forEach((lado, j) => {
          const r = (k) => hash(sem + 101, i * 2 + j, k);
          const bx = x + nx * lado * a,
            by = y + ny * lado * a,
            adentro = (r(1) - 0.35) * 26; // + hacia adentro del camino
          const px = bx - nx * lado * adentro,
            py = by - ny * lado * adentro;
          if (cerca.length && sobreOtro(px, py)) return;
          if (borde === "pasto") {
            if (r(2) > 0.75) return;
            const cols = ["#4A5630", "#56662C", "#3F4A28"];
            for (let k = 0; k < 3; k++) {
              const hx = px + (r(3 + k) - 0.5) * 16,
                hy = py + (r(6 + k) - 0.5) * 6,
                h = 9 + r(9 + k) * 12;
              P(c, [hx - 3, hy, hx + 3, hy, hx + (r(12 + k) - 0.5) * 6, hy - h], cols[k]);
            }
          } else if (borde === "musgo") {
            if (r(2) > 0.7) return;
            E(c, px, py, 14 + r(3) * 22, 6 + r(4) * 9, r(5) < 0.5 ? "#3D4A28" : "#4A5A2E", Math.atan2(dy, dx));
            if (r(6) < 0.4) E(c, px + (r(7) - 0.5) * 20, py - 3, 6 + r(8) * 6, 3 + r(9) * 3, "#56662C");
          } else if (borde === "agua") {
            if (r(2) > 0.65) return;
            E(c, px, py, 16 + r(3) * 20, 6 + r(4) * 7, "#2E3A30", Math.atan2(dy, dx));
            if (r(5) < 0.35) {
              E(c, px, py, 9 + r(6) * 10, 3.5 + r(7) * 3, "#2A4C56");
              E(c, px + 3, py - 1, 4 + r(8) * 4, 1.4, "#3E6E7E");
            }
          } else if (borde === "tierra") {
            if (r(2) > 0.7) return;
            E(c, px, py, 12 + r(3) * 18, 5 + r(4) * 7, "#5C4A32", Math.atan2(dy, dx));
            if (r(5) < 0.5) {
              const sx = bx + nx * lado * (6 + r(6) * 22),
                sy = by + ny * lado * (6 + r(6) * 22);
              if (tipo === "ladrillo") ladrillo(c, sx, sy, dx, dy, 22, 10, LADRILLOS[Math.floor(r(7) * LADRILLOS.length)]);
              else P(c, poli(sx, sy, tipo === "adoquin" ? 8 : 5, tipo === "adoquin" ? 6 : 3.5, 6, r(8) * 2), PIEDRAS[Math.floor(r(9) * PIEDRAS.length)]);
            }
          }
        });
      });
    }
    // las puntas fundidas: piedras o ladrillos sueltos que siguen un poco más allá
    if (fundir && tipo !== "tierra" && en("detalle")) {
      [
        [p[0], p[1], fa],
        [p[p.length - 1], p[p.length - 2], fb],
      ].forEach(([a, b, f], e) => {
        if (!f || !dentro(a[0], a[1])) return;
        const l = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1,
          dx = (a[0] - b[0]) / l,
          dy = (a[1] - b[1]) / l;
        for (let k = 0; k < 9; k++) {
          const r = (q) => hash(sem + 211, e * 40 + k, q),
            avance = r(1) * 70,
            o = (r(2) - 0.5) * w,
            sx = a[0] + dx * avance - dy * o,
            sy = a[1] + dy * avance + dx * o;
          if (tipo === "ladrillo") ladrillo(c, sx, sy, dx, dy, 24, 11, LADRILLOS[Math.floor(r(3) * LADRILLOS.length)]);
          else P(c, poli(sx, sy, 8.5, 6, 6, r(4) * 2), PIEDRAS[Math.floor(r(5) * PIEDRAS.length)]);
        }
      });
    }
  }
  // todos los caminos de una lista, de a capas. El empedrado (losa y piedras) va al revés: así, donde se cruzan dos,
  // el primero de la lista queda arriba entero y gana el cruce.
  function pintarTodos(c, lista, x0, y0, x1, y1) {
    CAPAS.forEach((capa) => {
      const orden = capa === "losa" || capa === "detalle" ? lista.slice().reverse() : lista;
      orden.forEach((cm) => pintar(c, cm, cm.sem || 0, x0, y0, x1, y1, capa, lista));
    });
    pintarPuentes(c, lista, x0, y0, x1, y1);
  }

  // ---------- los puentes ----------
  // Un puente es un camino (o un tramo de camino) de tipo puente_*: se traza y se tuerce como cualquier camino. Va
  // pintado en el piso (gira con él), encima de los caminos y del agua: el tablero, las barandas con su altura, la
  // sombra que deja sobre el agua y, en cada punta, el arranque de piedra y una rampa del material del camino que
  // llega (tierra, adoquín o ladrillo; tierra si no llega ninguno). eldervald.js despeja el agua y la quebrada debajo.
  // los tramos de puente de una lista de caminos: { p, w, tipo, cm, puntas: [tipo del camino de cada punta] }
  function puentesDe(lista) {
    const out = [];
    lista.forEach((cm) => {
      if (!cm.p || cm.p.length < 2) return;
      const tr = cm.tramos,
        tipoDe = (k) => (tr && tr[k]) || cm.tipo || "tierra";
      let ini = 0;
      for (let k = 1; k <= cm.p.length - 1; k++) {
        if (k < cm.p.length - 1 && tipoDe(k) === tipoDe(ini)) continue;
        const tp = tipoDe(ini);
        if (esPuente(tp)) {
          // lo que llega a cada punta: el tramo de al lado de este mismo camino, o el camino que pasa por ahí
          const vecino = (j, pt) => (j >= 0 && j < cm.p.length - 1 && !esPuente(tipoDe(j)) ? tipoDe(j) : llega(lista, cm, pt));
          out.push({ p: cm.p.slice(ini, k + 1), w: cm.w || 110, tipo: tp, cm, puntas: [vecino(ini - 1, cm.p[ini]), vecino(k, cm.p[k])] });
        }
        ini = k;
      }
    });
    return out;
  }
  // el tipo del camino (no puente) que pasa por el punto pt, o null
  function llega(lista, cm, pt) {
    let mejor = null,
      dm = Infinity;
    lista.forEach((o) => {
      if (o === cm || !o.p || o.p.length < 2) return;
      for (let i = 1; i < o.p.length; i++) {
        const tp = (o.tramos && o.tramos[i - 1]) || o.tipo || "tierra";
        if (esPuente(tp)) continue;
        const d = distLinea(pt[0], pt[1], [o.p[i - 1], o.p[i]]);
        if (d < (o.w || 110) / 2 + 60 && d < dm) (dm = d), (mejor = tp);
      }
    });
    return mejor;
  }
  // el punto a la distancia d de la línea p, con la dirección suavizada en las vueltas (así el tablero no se pliega
  // en las esquinas)
  function enLinea(p, d) {
    const [x, y, dx, dy] = enLinea0(p, d),
      L = largo(p),
      m = 26,
      [ax, ay] = enLinea0(p, Math.max(0, d - m)),
      [bx, by] = enLinea0(p, Math.min(L, d + m)),
      l = Math.hypot(bx - ax, by - ay);
    return l > 1 ? [x, y, (bx - ax) / l, (by - ay) / l] : [x, y, dx, dy];
  }
  function enLinea0(p, d) {
    let a = 0;
    for (let i = 1; i < p.length; i++) {
      const [ax, ay] = p[i - 1],
        [bx, by] = p[i],
        l = Math.hypot(bx - ax, by - ay);
      if (!l) continue;
      if (a + l >= d || i === p.length - 1) {
        const u = Math.max(0, Math.min(1, (d - a) / l));
        return [ax + (bx - ax) * u, ay + (by - ay) * u, (bx - ax) / l, (by - ay) / l];
      }
      a += l;
    }
    return [p[0][0], p[0][1], 1, 0];
  }
  // cómo es cada puente: medio ancho (respecto del camino), color de tablero, de baranda y de los arranques
  const ESTILO = {
    puente_tablas: { k: 0.62, alto: 16, baranda: "#C8B48C", poste: "#553A22", estribo: ["#56524C", "#77736C"] },
    puente_piedra: { k: 0.7, alto: 12, baranda: "#9A968E", poste: "#6E6A62", estribo: ["#5E5A54", "#86827A"] },
    puente_cuerdas: { k: 0.42, alto: 20, baranda: "#B8A47C", poste: "#4E3A26", estribo: ["#4E4A44", "#6E6A62"] },
    puente_troncos: { k: 0.58, alto: 13, baranda: "#5A3E26", poste: "#3E2A18", estribo: ["#56524C", "#77736C"] },
    puente_runico: { k: 0.66, alto: 12, baranda: "#5C5E64", poste: "#3E4046", estribo: ["#3E4046", "#5C5E64"] },
  };
  const RUNICO = "#73D5DB";
  // solo: pinta los puentes de ese camino nada más (el que se está trazando en el editor), con la lista para las puntas
  function pintarPuentes(c, lista, x0, y0, x1, y1, solo) {
    const l = solo && !lista.includes(solo) ? lista.concat([solo]) : lista;
    puentesDe(l).forEach((pu, n) => (!solo || pu.cm === solo) && pintarPuente(c, pu, x0, y0, x1, y1, (pu.cm.sem || 0) * 31 + n));
  }
  function pintarPuente(c, pu, x0, y0, x1, y1, sem) {
    const p = pu.p,
      L = largo(p),
      es = ESTILO[pu.tipo],
      a = anchoPuente(pu),
      r = (k, i) => hash(sem, i, k);
    if (L < 4) return;
    let minx = Infinity,
      miny = Infinity,
      maxx = -Infinity,
      maxy = -Infinity;
    p.forEach(([x, y]) => ((minx = Math.min(minx, x)), (miny = Math.min(miny, y)), (maxx = Math.max(maxx, x)), (maxy = Math.max(maxy, y))));
    const mg = a + 220;
    if (maxx + mg < x0 || minx - mg > x1 || maxy + mg < y0 || miny - mg > y1) return;
    // el cuadrilátero del tablero entre d0 y d1, de -a1 a a2 a lo ancho, subido h
    // (de a pedazos cortos, así sigue las curvas)
    const quad = (d0, d1, a1, a2, col, h = 0) => {
      const n = Math.max(1, Math.ceil((d1 - d0) / 18)),
        izq = [],
        der = [];
      for (let i = 0; i <= n; i++) {
        const [x, y, dx, dy] = enLinea(p, d0 + ((d1 - d0) * i) / n);
        izq.push(x - dy * a1, y + dx * a1 - h);
        der.unshift(x + dy * a2, y - dx * a2 - h);
      }
      P(c, izq.concat(der), col);
    };
    // una línea paralela al tablero (baranda, cuerda) a la distancia «lado» del medio y subida h(d)
    const paralela = (lado, h, col, g) => {
      c.beginPath();
      for (let d = 0; d <= L + 0.1; d += Math.max(8, L / 60)) {
        const [x, y, dx, dy] = enLinea(p, Math.min(d, L)),
          q = [x - dy * lado, y + dx * lado - h(Math.min(d, L))];
        d ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]);
      }
      c.strokeStyle = col;
      c.lineWidth = g;
      c.lineJoin = "round";
      c.lineCap = "round";
      c.stroke();
    };
    const poste = (d, lado, alto, col, g = 7) => {
      const [x, y, dx, dy] = enLinea(p, d),
        px = x - dy * lado,
        py = y + dx * lado;
      E(c, px + 2, py + 2, g * 0.8, g * 0.4, "rgba(0,0,0,0.3)");
      P(c, [px - g / 2, py, px - g / 2, py - alto, px + g / 2, py - alto, px + g / 2, py], col);
      P(c, [px, py, px, py - alto, px + g / 2, py - alto, px + g / 2, py], "rgba(255,255,255,0.12)");
    };
    // la sombra que deja sobre el agua (más abajo y más ancha: el puente está alto)
    quad(0, L, a + 10, a + 10, "rgba(0,0,0,0.28)", -16);
    // las rampas de cada punta, del material del camino que llega, y los arranques de piedra
    [0, 1].forEach((k) => rampa(c, p, L, k, a, pu.puntas[k] || "tierra", es, sem + k * 7));
    const bar = (lado, h, col, g) => paralela(lado, () => h, col, g);
    if (pu.tipo === "puente_tablas") {
      quad(0, L, a + 4, a + 4, "#3E3022");
      const n = Math.max(2, Math.round(L / 13));
      for (let i = 0; i < n; i++) quad((i * L) / n, ((i + 1) * L) / n - 2, a, a, ["#8A6A40", "#B08A58", "#C8A070", "#9A7448"][Math.floor(r(1, i) * 4)]);
      [-1, 1].forEach((ld) => {
        for (let d = 0; d <= L; d += L / Math.max(1, Math.round(L / 90))) poste(d, ld * (a - 2), es.alto + 6, es.poste);
        bar(ld * (a - 2), es.alto, es.baranda, 3);
      });
    } else if (pu.tipo === "puente_piedra") {
      quad(0, L, a + 6, a + 6, "#4A4640");
      quad(0, L, a, a, "#77736C");
      quad(0, L, a * 0.35, a * 0.35, "#827D74");
      for (let d = 26; d < L; d += 26) quad(d, d + 2, a, a, "#5E5A54");
      // los parapetos: la cara de afuera y el lomo
      [-1, 1].forEach((ld) => {
        const lo = ld < 0 ? [a + 4, -a + 10] : [-a + 10, a + 4];
        quad(0, L, lo[0], lo[1], "#56524C", 0);
        quad(0, L, lo[0], lo[1], "#9A968E", es.alto);
        for (let d = 30; d < L; d += 30) quad(d, d + 2, lo[0], lo[1], "#77736C", es.alto);
      });
      [0, L].forEach((d) => [-1, 1].forEach((ld) => poste(d, ld * (a - 3), es.alto + 10, "#86827A", 14)));
    } else if (pu.tipo === "puente_cuerdas") {
      // colgante: tablas con huecos que bajan en el medio, cuerdas de mano y postes altos solo en las puntas
      const cae = (d) => Math.sin((d / L) * Math.PI) * Math.min(26, L * 0.05);
      const n = Math.max(2, Math.round(L / 16));
      for (let i = 0; i < n; i++) {
        const d0 = (i * L) / n,
          d1 = d0 + L / n - 6;
        if (r(2, i) < 0.06) continue; // una tabla que falta
        quad(d0, d1, a * (0.9 + r(3, i) * 0.1), a * (0.9 + r(4, i) * 0.1), ["#5E4A36", "#76604A", "#6A5440"][Math.floor(r(5, i) * 3)], -cae(d0 + 3));
      }
      [-1, 1].forEach((ld) => {
        paralela(ld * a, (d) => -cae(d) + 2, "#8A7A5A", 2);
        for (let d = 18; d < L - 10; d += 22) {
          const [x, y, dx, dy] = enLinea(p, d),
            px = x - dy * ld * a,
            py = y + dx * ld * a;
          L_(c, px, py + cae(d) - 2, px, py + cae(d) - es.alto - 4 + cae(d) * 0.4, "#8A7A5A", 1.2);
        }
        paralela(ld * a, (d) => es.alto + 6 - cae(d) * 0.6, es.baranda, 2.5);
        [0, L].forEach((d) => poste(d, ld * a, es.alto + 18, es.poste, 9));
      });
    } else if (pu.tipo === "puente_troncos") {
      // troncos a lo largo, con su corteza, y una baranda de troncos finos
      const n = 5;
      for (let i = 0; i < n; i++) {
        const w0 = -a + (2 * a * i) / n,
          w1 = w0 + (2 * a) / n - 1;
        quad(0, L, -w0, w1, i % 2 ? "#6E4E30" : "#8A6440");
        quad(0, L, -(w0 + 3), w0 + 6, "rgba(255,255,255,0.08)");
      }
      [0, L].forEach((d) => {
        const [x, y, dx, dy] = enLinea(p, d);
        for (let i = 0; i < n; i++) {
          const w = -a + (2 * a * (i + 0.5)) / n;
          E(c, x - dy * w, y + dx * w, a / n, a / n * 0.8, "#B08A58");
          E(c, x - dy * w, y + dx * w, a / n * 0.45, a / n * 0.35, "#8A6A40");
        }
      });
      [-1, 1].forEach((ld) => {
        for (let d = 0; d <= L; d += L / Math.max(1, Math.round(L / 70))) poste(d, ld * (a + 2), es.alto + 4, es.poste, 8);
        bar(ld * (a + 2), es.alto, es.baranda, 5);
      });
    } else if (pu.tipo === "puente_runico") {
      quad(0, L, a + 6, a + 6, "#2A2C30");
      quad(0, L, a, a, "#3E4046");
      for (let d = 34; d < L; d += 34) quad(d, d + 2, a, a, "#2E3034");
      // las runas del medio, una por losa
      for (let d = 17, i = 0; d < L - 8; d += 34, i++) {
        const [x, y, dx, dy] = enLinea(p, d),
          g = Math.floor(r(6, i) * 3),
          tr = [[[-6, -8], [-6, 8], [-6, -2], [4, -8]], [[0, -8], [0, 8], [0, -8], [6, -2]], [[-5, -8], [5, 8], [5, -8], [-5, 8]]][g];
        c.save();
        c.translate(x, y);
        c.transform(dx, dy, -dy, dx, 0, 0);
        for (let k = 0; k < tr.length; k += 2) L_(c, tr[k][1], tr[k][0], tr[k + 1][1], tr[k + 1][0], RUNICO, 2.2);
        c.restore();
      }
      [-1, 1].forEach((ld) => {
        const lo = ld < 0 ? [a + 4, -a + 8] : [-a + 8, a + 4];
        quad(0, L, lo[0], lo[1], "#2E3034", 0);
        quad(0, L, lo[0], lo[1], "#5C5E64", es.alto);
        paralela(ld * (a - 2), () => es.alto + 1, RUNICO, 1.5);
      });
      [0, L].forEach((d) => [-1, 1].forEach((ld) => {
        poste(d, ld * (a - 2), es.alto + 14, "#4A4C52", 14);
        const [x, y, dx, dy] = enLinea(p, d);
        E(c, x - dy * ld * (a - 2), y + dx * ld * (a - 2) - es.alto - 14, 5, 3, RUNICO);
      }));
    }
  }
  function L_(c, ax, ay, bx, by, col, g) {
    c.beginPath();
    c.moveTo(ax, ay);
    c.lineTo(bx, by);
    c.strokeStyle = col;
    c.lineWidth = g;
    c.lineCap = "round";
    c.stroke();
  }
  // la rampa de una punta (k = 0 el principio, 1 el final): sale del puente hacia afuera y se angosta hasta el ancho
  // del camino que llega, del material de ese camino; los dos arranques de piedra a los costados
  function rampa(c, p, L, k, a, tipo, es, sem) {
    const [x, y, dx0, dy0] = enLinea(p, k ? L : 0),
      dx = k ? dx0 : -dx0,
      dy = k ? dy0 : -dy0,
      lar = 70,
      b = a * 0.9,
      fx = x + dx * lar,
      fy = y + dy * lar,
      r = (i) => hash(sem, i, 3);
    const cuerpo = [x - dy * (a + 6), y + dx * (a + 6), fx - dy * b, fy + dx * b, fx + dy * b, fy - dx * b, x + dy * (a + 6), y - dx * (a + 6)];
    const base = { tierra: ["#4A3C28", "#6B5638"], adoquin: ["#4A4640", "#5E5A54"], ladrillo: ["#5A4A3E", "#7A3E2A"] }[tipo] || ["#4A3C28", "#6B5638"];
    P(c, cuerpo.map((v, i) => v + (i % 2 ? 4 : 0)), base[0]);
    P(c, cuerpo, base[1]);
    // lo de arriba: huellas, adoquines o ladrillos que siguen la rampa
    for (let i = 0; i < 26; i++) {
      const u = r(i * 2) * lar,
        w = (r(i * 2 + 1) * 2 - 1) * (a + 2 - (u / lar) * (a + 2 - b)) * 0.85,
        sx = x + dx * u - dy * w,
        sy = y + dy * u + dx * w;
      if (tipo === "adoquin") P(c, poli(sx, sy, 8, 6, 6, r(i + 50) * 2), PIEDRAS[Math.floor(r(i + 60) * PIEDRAS.length)]);
      else if (tipo === "ladrillo") ladrillo(c, sx, sy, dx, dy, 22, 10, LADRILLOS[Math.floor(r(i + 70) * LADRILLOS.length)]);
      else if (i < 10) E(c, sx, sy, 6 + r(i + 80) * 6, 3, r(i + 90) < 0.5 ? "#5A4830" : "#7A6444");
    }
    // los arranques: dos piedras talladas en las esquinas del puente
    [-1, 1].forEach((ld) => {
      const sx = x - dy * ld * (a + 8),
        sy = y + dx * ld * (a + 8);
      E(c, sx + 3, sy + 4, 16, 7, "rgba(0,0,0,0.3)");
      P(c, poli(sx, sy - 4, 15, 10, 6, r(ld + 100)), es.estribo[0]);
      P(c, poli(sx + 2, sy - 8, 11, 7, 6, r(ld + 110)), es.estribo[1]);
    });
  }
  // medio ancho del tablero de un puente (lo que se camina)
  const anchoPuente = (pu) => Math.max(26, Math.min(150, pu.w * ESTILO[pu.tipo].k));
  return { TIPOS, PUENTES, esPuente, puentesDe, anchoPuente, pintarPuentes, BORDES, CAPAS, pintar, pintarTodos, largo };
})();
