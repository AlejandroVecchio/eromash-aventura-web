// ---------- El Custodio de corteza en vectores (módulo CUSTODIO) ----------
// Las cuatro vistas de la lámina de Alejandro pasadas a SVG tal cual (img/criaturas/custodio/S, E, N, W.svg,
// vectorizadas con Recraft) y animadas con huesos: cada forma del dibujo sigue a los huesos que tiene cerca
// (pesos suaves, como una malla de Spine), así el cuerpo se dobla sin cortes. Reposo, caminar, el aviso (alza el
// puño de piedra), el golpe (lo baja), herido y muerte, con sus efectos (polvo, motas y runas que se encienden en el aviso;
// onda rúnica, grietas y esquirlas al golpear; astillas al recibir; la luz que se escapa al morir; todo baja con CALIDAD).
// Paletas exactas cambiando el color de cada forma.
// Se registra en CRIATURAS como "custodio"; mientras el SVG carga se ve el dibujo viejo de criaturas.js.
window.CUSTODIO = (function () {
  "use strict";
  // alto de la figura en el juego (unidades del mundo) y lo que mide en la lámina
  const ALTO = 178;
  // huesos de cada vista, en las coordenadas del SVG (2048): a = donde gira, b = la punta, p = el padre
  const VISTAS = {
    S: {
      k: 790,
      pie: [1010, 1883],
      fijos: [{ hueso: "manoP", c: [430, 1530], r: 260 }],
      huesos: {
        raiz: { a: [1010, 1300], b: [1010, 1250] },
        torso: { a: [1010, 1300], b: [1010, 680], p: "raiz", s: 170 },
        cabeza: { a: [1170, 760], b: [1170, 520], p: "torso" },
        brazoP: { a: [700, 720], b: [560, 1120], p: "torso" },
        manoP: { a: [560, 1120], b: [360, 1560], p: "brazoP", s: 170 },
        brazoG: { a: [1550, 780], b: [1650, 1120], p: "torso" },
        manoG: { a: [1650, 1120], b: [1780, 1620], p: "brazoG" },
        piernaI: { a: [880, 1320], b: [850, 1560], p: "raiz" },
        pieI: { a: [850, 1560], b: [800, 1840], p: "piernaI" },
        piernaD: { a: [1330, 1320], b: [1400, 1560], p: "raiz" },
        pieD: { a: [1400, 1560], b: [1420, 1840], p: "piernaD" },
      },
    },
    E: {
      k: 758,
      pie: [900, 1940],
      fijos: [{ hueso: "manoP", c: [1250, 1650], r: 300 }],
      huesos: {
        raiz: { a: [960, 1330], b: [960, 1280] },
        torso: { a: [960, 1330], b: [990, 700], p: "raiz", s: 170 },
        cabeza: { a: [1300, 760], b: [1440, 700], p: "torso" },
        brazoG: { a: [800, 800], b: [740, 1150], p: "torso" },
        manoG: { a: [740, 1150], b: [700, 1450], p: "brazoG" },
        brazoP: { a: [1180, 760], b: [1170, 1230], p: "torso" },
        manoP: { a: [1170, 1230], b: [1250, 1680], p: "brazoP", s: 170 },
        piernaI: { a: [780, 1380], b: [740, 1620], p: "raiz" },
        pieI: { a: [740, 1620], b: [700, 1900], p: "piernaI" },
        piernaD: { a: [1010, 1420], b: [1010, 1640], p: "raiz" },
        pieD: { a: [1010, 1640], b: [1020, 1900], p: "piernaD" },
      },
    },
    N: {
      k: 758,
      pie: [1010, 1941],
      fijos: [{ hueso: "manoP", c: [1620, 1550], r: 260 }],
      huesos: {
        raiz: { a: [1020, 1260], b: [1020, 1210] },
        torso: { a: [1020, 1260], b: [1020, 640], p: "raiz", s: 180 },
        cabeza: { a: [1020, 640], b: [1020, 300], p: "torso" },
        brazoG: { a: [560, 900], b: [420, 1200], p: "torso" },
        manoG: { a: [420, 1200], b: [300, 1600], p: "brazoG" },
        brazoP: { a: [1450, 900], b: [1560, 1200], p: "torso" },
        manoP: { a: [1560, 1200], b: [1640, 1600], p: "brazoP", s: 170 },
        piernaI: { a: [700, 1380], b: [680, 1600], p: "raiz" },
        pieI: { a: [680, 1600], b: [660, 1880], p: "piernaI" },
        piernaD: { a: [1210, 1380], b: [1240, 1600], p: "raiz" },
        pieD: { a: [1240, 1600], b: [1270, 1880], p: "piernaD" },
      },
    },
    W: {
      k: 790,
      pie: [1060, 1904],
      fijos: [{ hueso: "manoP", c: [1450, 1450], r: 280 }],
      huesos: {
        raiz: { a: [860, 1320], b: [860, 1270] },
        torso: { a: [860, 1320], b: [820, 700], p: "raiz", s: 170 },
        cabeza: { a: [640, 760], b: [490, 700], p: "torso" },
        brazoG: { a: [700, 900], b: [560, 1230], p: "torso" },
        manoG: { a: [560, 1230], b: [450, 1600], p: "brazoG" },
        brazoP: { a: [1130, 900], b: [1320, 1200], p: "torso" },
        manoP: { a: [1320, 1200], b: [1500, 1450], p: "brazoP", s: 170 },
        piernaI: { a: [880, 1440], b: [830, 1640], p: "raiz" },
        pieI: { a: [830, 1640], b: [760, 1880], p: "piernaI" },
        piernaD: { a: [1310, 1440], b: [1340, 1640], p: "raiz" },
        pieD: { a: [1340, 1640], b: [1370, 1880], p: "piernaD" },
      },
    },
  };
  // las poses de la lámina que el esqueleto no puede doblar sin romper el dibujo: el aviso (el puño en alto)
  const POSES = {
    avisoS: { k: 826, pie: [1020, 1811], huesos: { raiz: { a: [1020, 1300], b: [1020, 1250] } } },
    avisoE: { k: 758, pie: [890, 1861], huesos: { raiz: { a: [890, 1300], b: [890, 1250] } } },
  };
  // el puño de piedra (P) va al costado de la pantalla que corresponde a cada vista: de él sale el golpe
  const LADO_P = { S: -1, E: 1, N: 1, W: 1 };

  // ---------- paletas: la corteza y el musgo cambian, la piedra, la máscara y las runas quedan ----------
  const PALETAS = [
    null, // la de la lámina
    { corteza: 272, sat: 0.9, musgo: 300 }, // atadura
    { corteza: 20, sat: 0.15, musgo: 150 }, // ceniza
    { corteza: 205, sat: 0.6, musgo: 185 }, // escarcha
  ];
  function rgbAHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, l];
    const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
  }
  function hslARgb(h, s, l) {
    const f = (n) => {
      const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
      return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
    };
    return `rgb(${f(0)},${f(8)},${f(4)})`;
  }
  function tenir(col, pal) {
    if (!pal) return col;
    const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(col);
    if (!m) return col;
    let [h, s, l] = rgbAHsl(+m[1], +m[2], +m[3]);
    if ((h < 28 || h > 330) && l < 0.62 && s > 0.08) return hslARgb(pal.corteza, Math.min(1, s * pal.sat), l);
    if (h > 40 && h < 100 && s > 0.15 && l < 0.6) return hslARgb(pal.musgo, s, l);
    return col;
  }

  // ---------- carga: cada forma con su Path2D, su color y sus pesos ----------
  const vistas = {};
  const lienzoGrad = document.createElement("canvas").getContext("2d");
  function cargar(v) {
    if (vistas[v]) return vistas[v];
    const st = (vistas[v] = { listo: false });
    fetch("img/criaturas/custodio/" + v + ".svg")
      .then((r) => r.text())
      .then((txt) => {
        const doc = new DOMParser().parseFromString(txt, "image/svg+xml");
        const grads = {};
        doc.querySelectorAll("linearGradient").forEach((g) => {
          grads[g.id] = {
            x: ["x1", "y1", "x2", "y2"].map((k) => +g.getAttribute(k)),
            stops: [...g.querySelectorAll("stop")].map((s) => [+s.getAttribute("offset"), s.getAttribute("stop-color")]),
          };
        });
        const def = VISTAS[v] || POSES[v];
        const nombres = Object.keys(def.huesos);
        const segs = nombres.map((n) => def.huesos[n]);
        st.formas = [...doc.querySelectorAll("path")].map((p) => {
          const d = p.getAttribute("d"),
            fill = p.getAttribute("fill") || "#000",
            nums = d.match(/-?\d+\.?\d*/g).map(Number);
          let cx = 0, cy = 0, n = 0;
          for (let i = 0; i + 1 < nums.length; i += 2) { cx += nums[i]; cy += nums[i + 1]; n++; }
          cx /= n; cy /= n;
          // las capas grandes (el fondo de la figura) van con el tronco: si siguieran a un brazo asomarían
          let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
          for (let i = 0; i + 1 < nums.length; i += 2) {
            x0 = Math.min(x0, nums[i]); x1 = Math.max(x1, nums[i]);
            y0 = Math.min(y0, nums[i + 1]); y1 = Math.max(y1, nums[i + 1]);
          }
          const gr = /url\(#(.+)\)/.exec(fill), grad = gr ? grads[gr[1]] : null;
          if ((x1 - x0) * (y1 - y0) > 600000) return { path: new Path2D(d), fill, grad, w: [[nombres.indexOf("torso"), 1]] };
          // lo que cae dentro de una zona fija (el puño de piedra) va entero con su hueso: así no se desarma
          const fijo = (def.fijos || []).find((z) => Math.hypot(cx - z.c[0], cy - z.c[1]) < z.r);
          if (fijo) return { path: new Path2D(d), fill, grad, w: [[nombres.indexOf(fijo.hueso), 1]] };
          // pesos: cuánto sigue a cada hueso según lo cerca que está de él; se quedan los tres mayores
          const w = segs.map((h, i) => {
            if (nombres[i] === "raiz") return [i, 0];
            const dd = distSeg(cx, cy, h.a, h.b), s = h.s || 120;
            return [i, Math.exp(-(dd / s) * (dd / s)) + 1e-9];
          });
          w.sort((a, b) => b[1] - a[1]);
          const top = w.slice(0, 3), tot = top.reduce((a, b) => a + b[1], 0);
          return { path: new Path2D(d), fill, grad, w: top.map(([i, x]) => [i, x / tot]) };
        });
        st.nombres = nombres;
        st.pinturas = {};
        // las runas (el celeste de la lámina): se encienden en el aviso y se apagan al morir
        st.runas = [];
        st.formas.forEach((f, i) => {
          const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(f.fill);
          if (!m) return;
          const [h, sa, l] = rgbAHsl(+m[1], +m[2], +m[3]);
          if (h > 165 && h < 205 && sa > 0.35 && l > 0.4) st.runas.push(i);
        });
        st.listo = true;
      })
      .catch(() => (st.error = true));
    return st;
  }
  function distSeg(x, y, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy || 1;
    const u = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l));
    return Math.hypot(x - a[0] - u * dx, y - a[1] - u * dy);
  }
  // los colores de cada forma en una paleta (una sola vez por paleta)
  function pinturas(st, pal) {
    if (st.pinturas[pal]) return st.pinturas[pal];
    const P = PALETAS[pal] || null;
    return (st.pinturas[pal] = st.formas.map((f) => {
      if (!f.grad) return tenir(f.fill, P);
      const [x1, y1, x2, y2] = f.grad.x, g = lienzoGrad.createLinearGradient(x1, y1, x2, y2);
      f.grad.stops.forEach(([o, c]) => g.addColorStop(o, tenir(c, P)));
      return g;
    }));
  }

  // ---------- la pose: un ángulo por hueso, más el vaivén y el aplaste del cuerpo ----------
  const rad = Math.PI / 180;
  const previo = {},
    bajando = {};
  function pose(v, t, o) {
    const q = { raiz: 0, torso: 0, cabeza: 0, brazoP: 0, manoP: 0, brazoG: 0, manoG: 0, piernaI: 0, pieI: 0, piernaD: 0, pieD: 0, dx: 0, dy: 0, sx: 1, sy: 1 };
    const m = o.mov || 0, lado = LADO_P[v];
    const costado = v === "E" || v === "W", sgn = v === "W" ? -1 : 1;
    // respirar
    const r = Math.sin(t * 1.6 + (o.sem || 0));
    q.torso += r * 1.2 * rad;
    q.sy += r * 0.012;
    q.brazoP += r * 2 * rad * -lado;
    q.brazoG += -r * 2 * rad * lado;
    q.cabeza += Math.sin(t * 0.7 + (o.sem || 0)) * 2 * rad;
    // caminar: paso pesado, el cuerpo se mece y los brazos van al revés de las piernas
    if (m > 0) {
      const f = t * 5.2 + (o.sem || 0), s = Math.sin(f), c = Math.cos(f);
      q.dy -= Math.abs(c) * 22 * m;
      q.torso += s * 3.5 * rad * m * (costado ? 0.5 : 1);
      if (costado) {
        q.piernaI += s * 9 * rad * m * sgn;
        q.pieI += Math.max(0, -s) * 10 * rad * m * sgn;
        q.piernaD -= s * 9 * rad * m * sgn;
        q.pieD += Math.max(0, s) * 10 * rad * m * sgn;
        // el puño de costado no se balancea: va con el cuerpo (el fondo de la figura queda debajo)
        q.brazoG += s * 3 * rad * m * sgn;
        q.torso += 4 * rad * m * sgn;
      } else {
        // de frente las piernas se levantan de a una (se acortan y suben)
        q.piernaI += Math.max(0, s) * 8 * rad * m;
        q.pieI -= Math.max(0, s) * 12 * rad * m;
        q.piernaD -= Math.max(0, -s) * 8 * rad * m;
        q.pieD += Math.max(0, -s) * 12 * rad * m;
        q.brazoP += s * 5 * rad * m;
        q.brazoG += s * 5 * rad * m;
        q.dx += s * 10 * m;
      }
    }
    // aviso y golpe: se agacha antes de alzar el puño (la pose de la lámina la pone dibujar) y al descargar se aplasta
    const g = o.golpe || 0;
    if (g > 0 && !o.baja) {
      const a = Math.min(1, g / 0.2), e = a * a * (3 - 2 * a);
      q.sy -= 0.07 * e;
      q.sx += 0.05 * e;
      q.torso += (costado ? 6 * sgn : 0) * rad * e;
      if (v === "N") {
        // de espaldas no hay lámina: el brazo sube hasta donde el dibujo aguanta
        const u = Math.min(1, g / 0.85);
        q.brazoP -= 26 * rad * u * u;
        q.torso += 4 * rad * u;
      }
      if (g >= 0.85) q.dx += Math.sin(t * 70) * 6;
    } else if (g > 0) {
      const e = g;
      q.brazoP += (costado ? 5 * sgn : -14 * lado) * rad * e;
      q.torso += (costado ? 10 * sgn : 0) * rad * e;
      q.sy -= 0.12 * e;
      q.sx += 0.08 * e;
    }
    // golpe recibido: se echa atrás y se encoge un instante
    if (o.herido > 0) {
      const e = o.herido * o.herido;
      q.torso -= (costado ? 5 * sgn : 0) * rad * e;
      q.cabeza -= 6 * rad * e;
      q.sy -= 0.04 * e;
      q.dx -= (costado ? 8 * sgn : 0) * e;
    }
    // muerte (combate.js la cuenta de 0 a 0,8): se dobla y cae hacia adelante
    if (o.muere > 0) {
      const u = Math.min(1, o.muere / 0.8), e = u * u;
      q.piernaI -= 25 * rad * e; q.pieI += 40 * rad * e;
      q.piernaD += 25 * rad * e; q.pieD -= 40 * rad * e;
      q.torso += (costado ? 70 * sgn : 0) * rad * e;
      q.dy += 260 * e;
      q.sy -= (costado ? 0 : 0.35) * e;
      q.brazoP += 30 * lado * rad * e; q.brazoG -= 30 * lado * rad * e;
    }
    return q;
  }

  // matrices de 2×3 [a, b, c, d, e, f] como las de canvas
  const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  function giro(a, x, y) {
    const c = Math.cos(a), s = Math.sin(a);
    return [c, s, -s, c, x - c * x + s * y, y - s * x - c * y];
  }
  function huesos(v, q) {
    const def = VISTAS[v], M = {};
    const [px, py] = def.pie;
    // la raíz: vaivén y aplaste desde los pies
    let raiz = [q.sx, 0, 0, q.sy, px - q.sx * px + q.dx, py - q.sy * py + q.dy];
    const orden = Object.keys(def.huesos);
    orden.forEach((n) => {
      const h = def.huesos[n], padre = h.p ? M[h.p] : raiz;
      // las piernas no se aplastan ni suben con el cuerpo: pisan el piso
      const base = n.startsWith("pierna") ? [1, 0, 0, 1, q.dx * 0.3, Math.max(0, q.dy)] : padre;
      M[n] = mul(n === "raiz" ? raiz : base, giro(q[n] || 0, h.a[0], h.a[1]));
    });
    return orden.map((n) => M[n]);
  }

  // ---------- dibujar ----------
  // dónde cae el puño al descargar y dónde está en alto en el aviso (unidades del juego desde el pie, lado del dibujo)
  const IMPACTO = { S: [-62, 6], E: [64, 8], N: [60, 6], W: [42, 8] };
  const PUNO_ALTO = { avisoS: [510, 380], avisoE: [420, 380] };
  const fx = {};
  function dibujar(c, t, o) {
    let v = o.vista || "S";
    let espejo = false;
    if (v === "E" && o.espejo) {
      v = "W";
      espejo = true;
    }
    const st = cargar(v);
    if (!st.listo) return false;
    // ¿sube o baja el golpe? (combate.js solo da golpe 0..1: al descargar empieza a bajar)
    const k = o.sem != null ? o.sem : 0, g = o.golpe || 0, ant = previo[k] != null ? previo[k] : 0;
    previo[k] = g;
    const baja = g < ant - 1e-4 || (g > 0 && bajando[k] && g <= ant);
    const F = fx[k] || (fx[k] = { imp: -9, her: -9, h: 0 });
    // el instante del golpe: empezó a bajar desde arriba
    if (baja && !bajando[k] && ant > 0.7) F.imp = t;
    bajando[k] = baja;
    if ((o.herido || 0) > F.h + 0.3) F.her = t;
    F.h = o.herido || 0;
    o = Object.assign({}, o, { baja });
    // cuánto brillan las runas: laten quietas, se encienden en el aviso y estallan al golpear; al morir se apagan
    const muere = Math.min(1, (o.muere || 0) / 0.8);
    let brillo = 0.12 + Math.sin(t * 2.2 + k) * 0.08;
    if (g > 0 && !baja) brillo = Math.max(brillo, g);
    else if (g > 0) brillo = Math.max(brillo, g);
    const ef = { t, g, baja, F, brillo: brillo * (1 - muere), muere, sube: g > 0 && !baja, k };
    // con el puño en alto se dibuja la pose del aviso de la lámina (de espaldas no hay: lo dobla el esqueleto)
    if (g > 0.2 && !baja && v !== "N") {
      const pv = v === "S" ? "avisoS" : "avisoE", sp = cargar(pv);
      if (sp.listo) return pintar(c, sp, POSES[pv], [[1, 0, 0, 1, 0, 0]], o, t, v === "W" && !o.espejo, Math.min(1, (g - 0.2) / 0.1), g, Object.assign(ef, { arte: pv }));
    }
    const def = VISTAS[v];
    const q = pose(v, t, o);
    return pintar(c, st, def, huesos(v, q), o, t, espejo, 1, 0, Object.assign(ef, { arte: v }));
  }
  const cal = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  const azar = (k, i) => {
    const x = Math.sin(k * 12.9898 + i * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  // lo del piso, debajo del cuerpo: polvo al agacharse, la onda, las grietas y la nube del golpe
  function efectosPiso(c, ef) {
    const n = cal() === "alta" ? 1 : cal() === "media" ? 0.5 : 0;
    // al agacharse para alzar el puño levanta polvo de los pies
    if (ef.sube && ef.g < 0.35 && n) {
      const u = ef.g / 0.35;
      DIB.alfa(c, 0.35 * (1 - u), () => {
        for (let i = -1; i <= 1; i += 2) DIB.E(c, i * (40 + u * 30), -2, 22 + u * 18, 7 + u * 4, "#8A7A6A");
      });
    }
    const d = ef.t - ef.F.imp;
    if (d < 0 || d > 1.4) return;
    const [ix, iy] = IMPACTO[ef.arte] || IMPACTO.S;
    // grietas: seis rayas oscuras que salen del puño y se borran
    DIB.alfa(c, Math.max(0, 1 - d / 1.4), () => {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + azar(ef.k, i), l = Math.min(1, d * 6) * (40 + azar(ef.k, i + 9) * 40);
        const mx = ix + Math.cos(a) * l * 0.55 + 6, my = iy + Math.sin(a) * l * 0.2;
        DIB.L(c, ix, iy, mx, my, "#1B1411", 4);
        DIB.L(c, mx, my, ix + Math.cos(a + 0.3) * l, iy + Math.sin(a + 0.3) * l * 0.36, "#1B1411", 3);
      }
    });
    // la onda en el piso, del color de las runas
    if (d < 0.6) {
      const u = d / 0.6;
      DIB.alfa(c, (1 - u) * 0.9, () => {
        c.strokeStyle = DIB.RUNICO;
        c.lineWidth = 6 * (1 - u) + 1;
        c.beginPath();
        c.ellipse(ix, iy, 30 + u * 150, (30 + u * 150) * 0.32, 0, 0, Math.PI * 2);
        c.stroke();
      });
      DIB.halo(c, ix, iy - 10, 60 * (1 - u * 0.5), DIB.RUNICO, (1 - u) * 0.8);
    }
    // nube de polvo que se abre
    if (n)
      for (let i = 0; i < 8 * n; i++) {
        const a = (i / (8 * n)) * Math.PI * 2, u = Math.min(1, d / 1.1);
        DIB.alfa(c, 0.26 * (1 - u), () => DIB.E(c, ix + Math.cos(a) * (20 + u * 80), iy + Math.sin(a) * (8 + u * 22) - u * 12, 12 + u * 14, 6 + u * 6, "#7D6D5E"));
      }
  }
  // lo del aire, encima del cuerpo: motas que suben al aviso, el puño que brilla, esquirlas del golpe y de la herida
  function efectosAire(c, ef, puno) {
    const n = cal() === "alta" ? 12 : cal() === "media" ? 6 : 0;
    // motas rúnicas que suben desde el piso y se juntan en el puño alzado
    if (ef.sube && n) {
      const [px, py] = puno || [0, -110];
      for (let i = 0; i < n; i++) {
        const u = (ef.t * 0.9 + i / n) % 1, a = azar(ef.k, i) * Math.PI * 2, r = 70 * (1 - u);
        const x = px * u + Math.cos(a) * r, y = py * u + Math.sin(a) * r * 0.4 - 4;
        DIB.alfa(c, Math.min(1, ef.g * 1.5) * Math.sin(u * Math.PI), () => DIB.P(c, [x, y - 5, x + 3, y, x, y + 5, x - 3, y], i % 3 ? DIB.RUNICO : DIB.RUNICO_CLARO));
      }
    }
    // el puño en alto se carga de luz
    if (ef.sube && puno && ef.g > 0.4) DIB.halo(c, puno[0], puno[1], 28 + ef.g * 22, DIB.RUNICO, ((ef.g - 0.4) / 0.6) * 0.8);
    // esquirlas de piedra y corteza que saltan del golpe
    const d = ef.t - ef.F.imp;
    if (d >= 0 && d < 0.8) {
      const [ix, iy] = IMPACTO[ef.arte] || IMPACTO.S;
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI * (0.15 + 0.7 * azar(ef.k, i + 3)), v = 160 + azar(ef.k, i + 5) * 160;
        const x = ix + Math.cos(a) * v * d, y = iy + Math.sin(a) * v * d + 520 * d * d;
        if (y > iy + 4) continue;
        const r = 3 + azar(ef.k, i + 7) * 4, col = i % 3 ? "#D9BCB0" : "#7A2A20";
        DIB.alfa(c, 1 - d / 0.8, () => DIB.P(c, [x - r, y, x, y - r, x + r, y + r * 0.4, x - r * 0.3, y + r], col));
      }
    }
    // al recibir un golpe suelta astillas de corteza del pecho
    const dh = ef.t - ef.F.her;
    if (dh >= 0 && dh < 0.5)
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI * azar(ef.k + dh * 0, i + 11) - 0.2, v = 120 + azar(ef.k, i + 13) * 80;
        const x = Math.cos(a) * v * dh, y = -100 + Math.sin(a) * v * dh + 400 * dh * dh;
        DIB.alfa(c, 1 - dh / 0.5, () => DIB.P(c, [x - 4, y, x, y - 3, x + 4, y + 1, x, y + 3], i % 2 ? "#9C2315" : "#5E130D"));
      }
    // al morir la luz de las runas se escapa hacia arriba
    if (ef.muere > 0 && n)
      for (let i = 0; i < n; i++) {
        const u = Math.min(1, ef.muere * 1.4 - azar(ef.k, i) * 0.4);
        if (u <= 0) continue;
        const x = (azar(ef.k, i + 20) - 0.5) * 90, y = -60 - azar(ef.k, i + 30) * 70 - u * 90;
        DIB.alfa(c, 1 - u, () => DIB.P(c, [x, y - 5, x + 3, y, x, y + 5, x - 3, y], DIB.RUNICO_CLARO));
      }
  }
  // pinta las formas de una vista o pose con sus matrices; aparece = 0..1 (la pose entra con un golpe de tamaño)
  function pintar(c, st, def, Ms, o, t, espejo, aparece, g, ef) {
    const cols = pinturas(st, (o.pal || 0) % PALETAS.length);
    const esc = (ALTO / 345) * (def.k / 4096);
    c.save();
    // espejo = deshacer el espejo que ya puso CRIATURAS.dibujar (la vista W tiene su propio dibujo)
    if (espejo) c.scale(-1, 1);
    // sombra elíptica en el piso
    c.fillStyle = "rgba(0,0,0,0.32)";
    c.beginPath();
    c.ellipse(0, 0, 70, 16, 0, 0, Math.PI * 2);
    c.fill();
    efectosPiso(c, ef);
    const T0 = c.getTransform();
    if (aparece < 1) c.scale(1 + 0.08 * (1 - aparece), 1 + 0.1 * (1 - aparece));
    if (g >= 0.85) c.translate(Math.sin(t * 70) * 1.5, 0);
    c.scale(esc, esc);
    c.translate(-def.pie[0], -def.pie[1]);
    const B = c.getTransform();
    const base = [B.a, B.b, B.c, B.d, B.e, B.f];
    const fs = st.formas;
    const mats = new Array(fs.length);
    for (let i = 0; i < fs.length; i++) {
      const f = fs[i], w = f.w;
      let m;
      if (w.length === 1 || w[0][1] > 0.995) m = Ms[w[0][0]] || Ms[0];
      else {
        m = [0, 0, 0, 0, 0, 0];
        for (let j = 0; j < w.length; j++) {
          const n = Ms[w[j][0]] || Ms[0], k = w[j][1];
          for (let z = 0; z < 6; z++) m[z] += n[z] * k;
        }
      }
      const r = (mats[i] = mul(base, m));
      c.setTransform(r[0], r[1], r[2], r[3], r[4], r[5]);
      c.fillStyle = cols[i];
      c.fill(f.path);
    }
    // las runas: encendidas se aclaran y en calidad alta suman luz; al morir se apagan
    const runa = (col, a, modo) => {
      if (a <= 0.02) return;
      const a0 = c.globalAlpha;
      c.globalAlpha = a0 * Math.min(1, a);
      if (modo) c.globalCompositeOperation = modo;
      c.fillStyle = col;
      for (const i of st.runas) {
        const r = mats[i];
        c.setTransform(r[0], r[1], r[2], r[3], r[4], r[5]);
        c.fill(fs[i].path);
      }
      c.globalCompositeOperation = "source-over";
      c.globalAlpha = a0;
    };
    runa("#E8FFFF", ef.brillo * 0.8);
    if (cal() === "alta") runa("#73D5DB", ef.brillo * 0.5, "lighter");
    runa("#24302F", ef.muere * 1.5);
    c.setTransform(T0);
    // el puño alzado, en unidades del juego
    const pa = PUNO_ALTO[ef.arte];
    const puno = pa ? [(pa[0] - def.pie[0]) * esc, (pa[1] - def.pie[1]) * esc] : null;
    if (ef.brillo > 0.3) DIB.halo(c, 0, -ALTO * 0.55, 30 + ef.brillo * 20, DIB.RUNICO, (ef.brillo - 0.3) * 0.5);
    efectosAire(c, ef, puno);
    c.restore();
    return true;
  }

  // se engancha a CRIATURAS: si el SVG no cargó todavía, dibuja el custodio de siempre
  if (window.CRIATURAS) {
    const viejo = CRIATURAS.DIBUJO ? CRIATURAS.DIBUJO.custodio : null;
    CRIATURAS.registrar("custodio", (c, t, o) => {
      if (!dibujar(c, t, o) && viejo) viejo(c, t, o);
    });
  }
  ["S", "E", "N", "W", "avisoS", "avisoE"].forEach(cargar);
  const listo = () => ["S", "E", "N", "W", "avisoS", "avisoE"].every((v) => cargar(v).listo);
  return { dibujar, VISTAS, POSES, PALETAS, pose, cargar, listo };
})();
