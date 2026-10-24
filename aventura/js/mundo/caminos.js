// ---------- cómo se pintan los caminos (módulo SENDAS) ----------
// Cada camino es { p: [[x, y], …], w, tipo, borde, fundir }:
//   tipo: "tierra" (tierra pisada con huellas de carro), "adoquin" (piedras redondeadas sobre un cordón gris) o
//         "ladrillo" (ladrillos rojos a soga entre dos cordones de piedra)
//   borde: con qué se funde a los costados: "pasto", "musgo", "agua" (barro mojado y charquitos), "tierra" (piedras
//          sueltas y tierra que se come el borde) o "" (corte limpio)
//   fundir: las puntas se deshacen de a poco en vez de cortar redondo (para que se junte con el pasto o con el agua).
//           La tierra se deshace sola en las puntas sueltas; una punta que cae sobre otro camino nunca se deshace,
//           así el cruce queda lleno.
// Todo sale de la posición a lo largo del camino, así un mismo camino se pinta igual en cada trozo del piso.
window.SENDAS = (function () {
  "use strict";
  const { P, E, poli } = DIB;
  const TIPOS = ["tierra", "adoquin", "ladrillo"],
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
    if (p.length < 2 || L < 1) return;
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
    const metido = (x, y) => cerca.some((o) => cede(o) && distLinea(x, y, o.p) < (o.w || 110) / 2);
    const entra = (k) => {
      if (tipo === "tierra" || !cerca.length || (cm.puntas && !cm.puntas[k])) return 0;
      const q = p[k ? p.length - 1 : 0];
      if (!metido(q[0], q[1])) return 0;
      let d = 0;
      for (; d < L / 2; d += 6) {
        const [[x, y]] = recortar(p, k ? L - d : d, k ? L - d : d);
        if (!metido(x, y)) break;
      }
      return d;
    };
    const ea = entra(0),
      eb = entra(1);
    // cuánto queda del empedrado en ese punto por estar metido en otro camino (1 entero, 0 nada)
    const suelto = (d) => Math.min(1, ea ? 1 - (ea - d) / (w * 1.2) : 1, eb ? 1 - (d - (L - eb)) / (w * 1.2) : 1);
    // el empedrado entero: con punta redonda en las puntas libres y cortado derecho donde entra en otro
    const losa = (pts, ancho, col) => {
      if (!(ea || eb)) return trazo(c, pts, ancho, col);
      // el cuerpo (pts ≠ p) ya viene recortado por las puntas que se funden
      const a = Math.max(ea, pts !== p && fa ? FUNDE * 0.75 : 0),
        b = Math.min(L - eb, pts !== p && fb ? L - FUNDE * 0.75 : L);
      losaEntre(a, b, ancho, col);
    };
    const losaEntre = (a, b, ancho, col) => {
      if (b - a < 2) return;
      const pts = recortar(p, a, b);
      trazo(c, pts, ancho, col, "butt");
      // la punta libre sigue redonda
      if (!ea) E(c, pts[0][0], pts[0][1], ancho / 2, ancho / 2, col);
      if (!eb) E(c, pts[pts.length - 1][0], pts[pts.length - 1][1], ancho / 2, ancho / 2, col);
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
            const cx = x + nx * o + dx * (hash(sem, i, j + 40) - 0.5) * 4,
              cy = y + ny * o + dy * (hash(sem, i, j + 50) - 0.5) * 4;
            P(c, poli(cx, cy, 10.5, 7.5, 6, hash(sem, i, j + 60) * 2), PIEDRAS[Math.floor(hash(sem, i, j + 70) * PIEDRAS.length)]);
            P(c, poli(cx + 2, cy - 2, 5, 3, 5, 0.4), "rgba(242,236,236,0.08)"); // la luz de arriba a la derecha
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
            ladrillo(c, x + nx * o, y + ny * o, dx, dy, 29, w / carriles - 3, LADRILLOS[Math.floor(hash(sem, i, j + 30) * LADRILLOS.length)]);
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
  }
  return { TIPOS, BORDES, CAPAS, pintar, pintarTodos, largo };
})();
