// ---------- cómo se pintan los caminos (módulo SENDAS) ----------
// Cada camino es { p: [[x, y], …], w, tipo, borde, fundir }:
//   tipo: "tierra" (tierra pisada con huellas de carro), "adoquin" (piedras redondeadas sobre un cordón gris) o
//         "ladrillo" (ladrillos rojos a soga entre dos cordones de piedra)
//   borde: con qué se funde a los costados: "pasto", "musgo", "agua" (barro mojado y charquitos), "tierra" (piedras
//          sueltas y tierra que se come el borde) o "" (corte limpio)
//   fundir: las puntas se deshacen de a poco en vez de cortar redondo (para que se junte con otro camino, con el
//           pasto o con el agua)
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
  function trazo(c, pts, w, col) {
    if (pts.length < 2 || w <= 0) return;
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.strokeStyle = col;
    c.lineWidth = w;
    c.lineJoin = "round";
    c.lineCap = "round";
    c.stroke();
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

  // pinta un camino en c, solo lo que cae en [x0, y0, x1, y1]; sem distingue un camino de otro
  function pintar(c, cm, sem, x0, y0, x1, y1) {
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
    const fundir = !!cm.fundir && L > FUNDE * 2.5;
    // cuánto queda de camino en ese punto (1 entero, 0 deshecho) cerca de las puntas
    const queda = (d) => (fundir ? Math.min(1, Math.min(d, L - d) / FUNDE) : 1);
    const cuerpo = fundir ? recortar(p, FUNDE * 0.75, L - FUNDE * 0.75) : p;

    if (tipo === "tierra") {
      if (fundir) {
        // la tierra se angosta hacia las puntas
        recorrer(p, 24, (x, y, dx, dy, d) => {
          const q = queda(d);
          if (q < 1 && dentro(x, y)) {
            E(c, x, y, (w / 2 + 6) * (0.35 + q * 0.65), (w / 2 + 6) * (0.3 + q * 0.6), "#4A3C28");
            E(c, x, y, (w / 2) * (0.3 + q * 0.7) - 6, (w / 2) * (0.25 + q * 0.65) - 6, "#5C4A32");
          }
        });
      }
      trazo(c, cuerpo, w + 26, "#3A3022");
      trazo(c, cuerpo, w, "#5C4A32");
      trazo(c, cuerpo, w * 0.5, "#6A563A");
      // huellas de carro y piedritas
      recorrer(p, 20, (x, y, dx, dy, d, i) => {
        if (!dentro(x, y) || queda(d) < 0.6) return;
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
      trazo(c, p, w + 18, "#4A3C28");
      trazo(c, cuerpo, w + 26, "#3E3A36");
      trazo(c, cuerpo, w + 4, "#4A4640");
      recorrer(p, 22, (x, y, dx, dy, d, i) => {
        if (!dentro(x, y)) return;
        const nx = -dy,
          ny = dx,
          q = queda(d),
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
      trazo(c, p, w + 18, "#4A3C28");
      trazo(c, cuerpo, w + 28, "#4E4A44");
      trazo(c, cuerpo, w + 10, "#5E5850");
      trazo(c, cuerpo, w, "#4A2E22");
      // ladrillos a soga: carriles a lo ancho, cada uno corrido medio ladrillo del de al lado
      recorrer(p, 16, (x, y, dx, dy, d, i) => {
        if (!dentro(x, y)) return;
        const nx = -dy,
          ny = dx,
          q = queda(d),
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
    if (borde) {
      recorrer(p, 26, (x, y, dx, dy, d, i) => {
        if (!dentro(x, y) || queda(d) < 0.3) return;
        const nx = -dy,
          ny = dx;
        [-1, 1].forEach((lado, j) => {
          const r = (k) => hash(sem + 101, i * 2 + j, k);
          const bx = x + nx * lado * (w / 2 + (tipo === "tierra" ? 6 : 12)),
            by = y + ny * lado * (w / 2 + (tipo === "tierra" ? 6 : 12)),
            adentro = (r(1) - 0.35) * 26; // + hacia adentro del camino
          const px = bx - nx * lado * adentro,
            py = by - ny * lado * adentro;
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
    if (fundir && tipo !== "tierra") {
      [
        [p[0], p[1], -1],
        [p[p.length - 1], p[p.length - 2], 1],
      ].forEach(([a, b, s], e) => {
        if (!dentro(a[0], a[1])) return;
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
  return { TIPOS, BORDES, pintar, largo };
})();
