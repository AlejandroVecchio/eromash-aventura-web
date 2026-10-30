// ---------- El lobo del zarzal en vectores (módulo LOBO) ----------
// La lámina de Alejandro (frente, costado, espalda y el ataque de frente y de costado) pasada a SVG tal cual
// (img/criaturas/lobo/*.svg, vectorizada con Recraft) y animada con huesos de cuatro patas, como el jabalí de hongos:
// reposo, trote en diagonal, el aviso de la mordida (la pose de la lámina: agachado, la boca abierta y la cresta de
// zarzas erizada), el tarascón hacia adelante, herido y muerte; la cola y la cresta se mueven solas. Paletas: gris
// (la lámina), pardo y ceniza. Se registra en CRIATURAS como "lobo"; mientras el SVG carga se ve el dibujo viejo.
window.LOBO = (function () {
  "use strict";
  // unidades del mundo por pixel de la lámina (de costado mide unos 110 de largo)
  const MUNDO = 0.14;
  // huesos de cada vista en las coordenadas del SVG (el lado largo mide 2048): a = donde gira, b = la punta,
  // p = el padre, s = alcance. k = lo que mide el lado largo en pixeles de la lámina; pie = el centro del piso;
  // lomo (y lomoX) = lo que está más arriba va entero con la cresta de zarzas
  const VISTAS = {
    S: {
      k: 509,
      pie: [830, 1895],
      lomo: 520,
      huesos: {
        raiz: { a: [830, 1400], b: [830, 1350] },
        torso: { a: [830, 1400], b: [830, 800], p: "raiz", s: 320 },
        cresta: { a: [830, 650], b: [830, 150], p: "torso", s: 400 },
        cabeza: { a: [830, 900], b: [830, 1380], p: "torso", s: 220 },
        pDD: { a: [420, 1450], b: [300, 1890], p: "raiz", s: 110 },
        pDI: { a: [1250, 1450], b: [1360, 1890], p: "raiz", s: 110 },
        pTD: { a: [600, 1500], b: [600, 1880], p: "raiz", s: 80 },
        pTI: { a: [1100, 1500], b: [1100, 1860], p: "raiz", s: 80 },
      },
    },
    E: {
      k: 857,
      pie: [830, 1130],
      lomo: 400,
      lomoX: [450, 1380],
      huesos: {
        raiz: { a: [560, 620], b: [560, 570] },
        torso: { a: [560, 620], b: [1250, 600], p: "raiz", s: 260 },
        cresta: { a: [1000, 450], b: [1000, 150], p: "torso", s: 400 },
        cabeza: { a: [1350, 560], b: [1640, 640], p: "torso", s: 170 },
        cola: { a: [440, 450], b: [100, 850], p: "torso", s: 130 },
        pTD: { a: [430, 720], b: [300, 1110], p: "raiz", s: 90 },
        pTI: { a: [640, 700], b: [700, 1110], p: "raiz", s: 80 },
        pDI: { a: [1050, 750], b: [1080, 1110], p: "raiz", s: 80 },
        pDD: { a: [1200, 750], b: [1330, 1120], p: "raiz", s: 90 },
      },
    },
    N: {
      k: 508,
      pie: [730, 1890],
      lomo: 520,
      huesos: {
        raiz: { a: [730, 1300], b: [730, 1250] },
        torso: { a: [730, 1300], b: [730, 700], p: "raiz", s: 320 },
        cresta: { a: [730, 600], b: [730, 150], p: "torso", s: 400 },
        cola: { a: [740, 1000], b: [740, 1830], p: "torso", s: 130 },
        pTI: { a: [400, 1300], b: [270, 1880], p: "raiz", s: 100 },
        pTD: { a: [1080, 1300], b: [1150, 1880], p: "raiz", s: 100 },
        pDI: { a: [560, 1500], b: [530, 1850], p: "raiz", s: 70 },
        pDD: { a: [1000, 1500], b: [1020, 1850], p: "raiz", s: 70 },
      },
    },
  };
  // las poses de la lámina para el aviso de la mordida: agachado, la boca abierta y la cresta erizada
  const POSES = {
    avisoS: { k: 685, pie: [1000, 1235], lomo: 330, huesos: { raiz: { a: [1000, 900], b: [1000, 850] }, cresta: { a: [1000, 500], b: [1000, 100], p: "raiz", s: 400 } } },
    avisoE: { k: 885, pie: [965, 1000], lomo: 420, lomoX: [450, 1300], huesos: { raiz: { a: [900, 650], b: [900, 600] }, cresta: { a: [1000, 450], b: [1000, 150], p: "raiz", s: 400 } } },
  };

  // ---------- paletas: el pelo, la zarza y las ataduras cambian; ojos y espinas quedan ----------
  const PALETAS = [
    null, // gris, la de la lámina
    { pelo: [24, 1, 1.1, 0.3], musgo: [28, 0.8, 0.95] }, // pardo, con la zarza seca del otoño
    { pelo: [210, 1, 1.5, 0.08], musgo: [185, 0.3, 1.25], atadura: [300, 0.9, 1] }, // ceniza
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
    l = Math.min(0.92, l);
    const f = (n) => {
      const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
      return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
    };
    return `rgb(${f(0)},${f(8)},${f(4)})`;
  }
  // a qué grupo pertenece un color de la lámina
  function grupo(h, s, l) {
    if (h >= 30 && h < 56 && s > 0.55 && l > 0.5) return "ojo";
    if (h >= 240 && h < 310 && s > 0.25) return "atadura";
    if (l > 0.68) return "claro"; // espinas y colmillos
    if (h >= 56 && h < 120 && s > 0.2) return "musgo";
    return "pelo";
  }
  function tenir(col, pal) {
    if (!pal) return col;
    const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(col);
    if (!m) return col;
    const [h, s, l] = rgbAHsl(+m[1], +m[2], +m[3]), gr = grupo(h, s, l), p = pal[gr];
    if (!p) return col;
    // [tono, cuánto de su saturación, cuánto de su luz, saturación que se suma]: el pelo gris necesita la suya
    return hslARgb(p[0], Math.min(1, s * p[1] + (p[3] || 0)), l * p[2]);
  }

  // ---------- carga: cada forma con su Path2D, su color y sus pesos ----------
  const vistas = {};
  const lienzoGrad = document.createElement("canvas").getContext("2d");
  function distSeg(x, y, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy || 1;
    const u = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l));
    return Math.hypot(x - a[0] - u * dx, y - a[1] - u * dy);
  }
  function cargar(v) {
    if (vistas[v]) return vistas[v];
    const st = (vistas[v] = { listo: false });
    fetch("img/criaturas/lobo/" + v + ".svg")
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
        const iTorso = nombres.indexOf("torso") >= 0 ? nombres.indexOf("torso") : 0;
        const [lx0, lx1] = def.lomoX || [-1e9, 1e9];
        st.formas = [...doc.querySelectorAll("path")].map((p) => {
          const d = p.getAttribute("d"),
            fill = p.getAttribute("fill") || "#000",
            nums = d.match(/-?\d+\.?\d*/g).map(Number);
          let cx = 0, cy = 0, n = 0, x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
          for (let i = 0; i + 1 < nums.length; i += 2) {
            cx += nums[i]; cy += nums[i + 1]; n++;
            x0 = Math.min(x0, nums[i]); x1 = Math.max(x1, nums[i]);
            y0 = Math.min(y0, nums[i + 1]); y1 = Math.max(y1, nums[i + 1]);
          }
          cx /= n; cy /= n;
          const gr = /url\(#(.+)\)/.exec(fill), grad = gr ? grads[gr[1]] : null;
          const forma = { path: new Path2D(d), fill, grad, cx, cy };
          // la cresta de zarzas y sus espinas van enteras con su hueso: se erizan sin desarmarse
          if ((y1 < def.lomo + 60 || cy < def.lomo) && cx > lx0 && cx < lx1) return Object.assign(forma, { w: [[nombres.indexOf("cresta"), 1]] });
          // las capas grandes (el fondo del cuerpo) van con el tronco
          if ((x1 - x0) * (y1 - y0) > 500000) return Object.assign(forma, { w: [[iTorso, 1]] });
          const w = segs.map((h, i) => {
            if (nombres[i] === "raiz" && segs.length > 2) return [i, 0];
            const dd = distSeg(cx, cy, h.a, h.b), s = h.s || 120;
            return [i, Math.exp(-(dd / s) * (dd / s)) + 1e-9];
          });
          w.sort((a, b) => b[1] - a[1]);
          const top = w.slice(0, 3), tot = top.reduce((a, b) => a + b[1], 0);
          return Object.assign(forma, { w: top.map(([i, x]) => [i, x / tot]) });
        });
        st.nombres = nombres;
        st.pinturas = {};
        // los ojos (el dorado de la lámina): se encienden en el aviso y se apagan al morir
        st.ojos = [];
        st.formas.forEach((f, i) => {
          const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(f.fill);
          if (m && grupo(...rgbAHsl(+m[1], +m[2], +m[3])) === "ojo") st.ojos.push(i);
        });
        st.listo = true;
      })
      .catch(() => (st.error = true));
    return st;
  }
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

  // ---------- la pose: un ángulo por hueso, cuánto se levanta cada pata y el vaivén del cuerpo ----------
  const rad = Math.PI / 180;
  const PATAS = ["pDI", "pDD", "pTI", "pTD"];
  function pose(v, t, o) {
    const q = { raiz: 0, torso: 0, cresta: 0, cabeza: 0, cola: 0, dx: 0, dy: 0, sx: 1, sy: 1, alza: {} };
    PATAS.forEach((p) => ((q[p] = 0), (q.alza[p] = 0)));
    const m = Math.min(2, o.mov || 0), sem = o.sem || 0, costado = v === "E";
    // respirar: el lomo sube y baja, la cola se mece despacio y la cabeza husmea
    const r = Math.sin(t * 2.4 + sem);
    q.sy += r * 0.016;
    q.cabeza += Math.sin(t * 0.9 + sem) * 2 * rad;
    q.cola += Math.sin(t * 2.2 + sem) * 6 * rad;
    q.cresta += Math.sin(t * 1.5 + sem) * 1.2 * rad;
    // trote (mov 1) y carrera (mov 2): las patas van en diagonal, la del frente con la de atrás del otro lado
    if (m > 0) {
      const vel = m > 1 ? 16 : 10, f = t * vel + sem, s = Math.sin(f), c = Math.cos(f), amp = m > 1 ? 1.5 : 1;
      q.dy -= Math.abs(c) * (m > 1 ? 30 : 14);
      q.cresta += -s * 3 * rad * amp;
      q.cabeza += c * 2 * rad * amp;
      q.cola += s * 10 * rad * amp;
      if (costado) {
        q.pDD += s * 20 * rad * amp; q.pTI += s * 20 * rad * amp;
        q.pDI -= s * 20 * rad * amp; q.pTD -= s * 20 * rad * amp;
        q.torso += c * 1.5 * rad;
      } else {
        // de frente y de espaldas las patas se levantan de a pares
        const a = Math.max(0, s) * 40 * amp, b = Math.max(0, -s) * 40 * amp;
        q.alza.pDI = a; q.alza.pTD = a; q.alza.pDD = b; q.alza.pTI = b;
        q.dx += s * 8 * amp;
        q.torso += s * 1.5 * rad;
      }
    }
    // golpe recibido: se encoge y echa la cabeza atrás
    if (o.herido > 0) {
      const e = o.herido * o.herido;
      q.cabeza -= (costado ? 10 : 0) * rad * e;
      q.sy -= 0.06 * e;
      q.sx += 0.03 * e;
      q.dx -= (costado ? 30 : 0) * e;
      q.cresta += 6 * rad * e;
      q.cola -= 15 * rad * e;
    }
    // muerte: se le doblan las patas y cae de costado
    if (o.muere > 0) {
      const u = Math.min(1, o.muere / 0.8), e = u * u;
      q.caido = e;
      PATAS.forEach((p) => (q[p] += (p[1] === "D" ? -1 : 1) * (costado ? 60 : 20) * rad * e));
      q.dy += 200 * e;
      q.sy -= 0.28 * e;
      q.sx += 0.06 * e;
      q.torso += (costado ? 6 : 0) * rad * e;
      q.cresta += 14 * rad * e;
      q.cabeza += (costado ? 16 : 0) * rad * e;
      q.cola += 20 * rad * e;
    }
    return q;
  }

  const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  function giro(a, x, y) {
    const c = Math.cos(a), s = Math.sin(a);
    return [c, s, -s, c, x - c * x + s * y, y - s * x - c * y];
  }
  function huesos(def, q) {
    const M = {}, [px, py] = def.pie;
    const raiz = [q.sx, 0, 0, q.sy, px - q.sx * px + q.dx, py - q.sy * py + q.dy];
    const orden = Object.keys(def.huesos);
    orden.forEach((n) => {
      const h = def.huesos[n];
      let padre = h.p ? M[h.p] : raiz;
      // las patas pisan el piso: no se aplastan ni suben con el cuerpo, solo se levantan cuando dan el paso
      if (n[0] === "p" && n.length === 3 && !q.caido) padre = [1, 0, 0, 1, q.dx * 0.3, Math.max(0, q.dy) - (q.alza[n] || 0)];
      let g = giro(q[n] || 0, h.a[0], h.a[1]);
      // la cresta se eriza: crece desde su base
      if (n === "cresta" && q.eriza) g = mul(g, [1 + q.eriza * 0.6, 0, 0, 1 + q.eriza, -h.a[0] * q.eriza * 0.6, -h.a[1] * q.eriza]);
      M[n] = mul(n === "raiz" ? raiz : padre, g);
    });
    return orden.map((n) => M[n]);
  }

  // ---------- dibujar ----------
  const cal = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  const previo = {}, fx = {};
  // el tarascón: después del aviso la boca sigue abierta y se tira hacia adelante un instante
  const TARASCON = 0.28;
  function dibujar(c, t, o) {
    const v = o.vista || "S";
    const st = cargar(v);
    if (!st.listo) return false;
    const k = o.sem != null ? o.sem : 0, g = o.golpe || 0, ant = previo[k] != null ? previo[k] : 0;
    previo[k] = g;
    const F = fx[k] || (fx[k] = { muerde: -9 });
    const sube = g > 0 && g >= ant;
    if (g < ant && ant > 0.8) F.muerde = t;
    // si el reloj volvió atrás (otra partida, otra animación) el tarascón viejo ya no cuenta
    if (t < F.muerde) F.muerde = -9;
    const dm = t - F.muerde, muerde = dm < TARASCON ? 1 - dm / TARASCON : 0;
    const muere = Math.min(1, (o.muere || 0) / 0.8);
    let brillo = 0.15 + Math.sin(t * 2.4 + k) * 0.08;
    if (sube) brillo = Math.max(brillo, g);
    const ef = { t, g, sube, brillo: brillo * (1 - muere), muere, k };
    // agachado con la boca abierta se dibuja la pose del aviso de la lámina (de espaldas no hay: lo hace el esqueleto)
    if (((sube && g > 0.15) || muerde > 0) && v !== "N") {
      const pv = v === "S" ? "avisoS" : "avisoE", sp = cargar(pv);
      if (sp.listo) {
        const def = POSES[pv];
        // gruñe: la cresta se eriza y tiembla, al final todo el cuerpo; al soltar se tira hacia adelante
        const tira = Math.sin(Math.min(1, muerde * 1.4) * Math.PI);
        const q = {
          raiz: 0,
          cresta: Math.sin(t * 22) * 2 * rad * g,
          eriza: sube ? 0.08 * g : 0.08,
          dx: (g > 0.8 && sube ? Math.sin(t * 60) * 7 : 0) + (v === "E" ? tira * 260 : 0),
          dy: v === "S" ? tira * 60 : 0,
          sx: 1 + 0.03 * g + (v === "S" ? tira * 0.08 : 0),
          sy: 1 - 0.04 * g + (v === "S" ? tira * 0.08 : 0),
          alza: {},
        };
        return pintar(c, sp, def, huesos(def, q), o, Math.min(1, (Math.max(g, muerde) - 0.15) / 0.1), ef, v === "E");
      }
    }
    const def = VISTAS[v];
    const q = pose(v, t, o);
    if (v === "N" && sube) {
      // de espaldas se agacha y eriza la cresta
      q.sy -= 0.08 * g;
      q.eriza = 0.1 * g;
    }
    return pintar(c, st, def, huesos(def, q), o, 1, ef, v === "E");
  }
  function pintar(c, st, def, Ms, o, aparece, ef, costado) {
    const cols = pinturas(st, (o.pal || 0) % PALETAS.length);
    const esc = (MUNDO * def.k) / 2048;
    c.save();
    c.fillStyle = "rgba(0,0,0,0.34)";
    c.beginPath();
    c.ellipse(0, 0, costado ? 40 : 24, 9, 0, 0, Math.PI * 2);
    c.fill();
    const T0 = c.getTransform();
    if (aparece < 1) c.scale(1 + 0.06 * (1 - aparece), 1 + 0.08 * (1 - aparece));
    c.scale(esc, esc);
    c.translate(-def.pie[0], -def.pie[1]);
    const B = c.getTransform(), base = [B.a, B.b, B.c, B.d, B.e, B.f];
    const fs = st.formas, mats = new Array(fs.length);
    for (let i = 0; i < fs.length; i++) {
      const w = fs[i].w;
      let m;
      if (w.length === 1 || w[0][1] > 0.995) m = Ms[w[0][0]] || Ms[0];
      else {
        m = [0, 0, 0, 0, 0, 0];
        for (let j = 0; j < w.length; j++) {
          const n = Ms[w[j][0]] || Ms[0], kk = w[j][1];
          for (let z = 0; z < 6; z++) m[z] += n[z] * kk;
        }
      }
      const r = (mats[i] = mul(base, m));
      c.setTransform(r[0], r[1], r[2], r[3], r[4], r[5]);
      c.fillStyle = cols[i];
      c.fill(fs[i].path);
    }
    // los ojos: laten quietos, se encienden en el aviso y se apagan al morir
    const ojos = (col, a, modo) => {
      if (a <= 0.02) return;
      const a0 = c.globalAlpha;
      c.globalAlpha = a0 * Math.min(1, a);
      if (modo) c.globalCompositeOperation = modo;
      c.fillStyle = col;
      for (const i of st.ojos) {
        const r = mats[i];
        c.setTransform(r[0], r[1], r[2], r[3], r[4], r[5]);
        c.fill(fs[i].path);
      }
      c.globalCompositeOperation = "source-over";
      c.globalAlpha = a0;
    };
    ojos("#FFF3C8", ef.brillo * 0.7);
    if (cal() === "alta") ojos("#FFD98A", ef.brillo * 0.5, "lighter");
    ojos("#24302F", ef.muere * 1.5);
    c.setTransform(T0);
    if (ef.sube && ef.g > 0.5 && st.ojos.length) {
      // un brillo chico en los ojos cuando está por morder
      const f = st.formas[st.ojos[0]], r = mats[st.ojos[0]], P = c.getTransform().inverse().multiply(new DOMMatrix(r));
      DIB.halo(c, P.e + P.a * f.cx + P.c * f.cy, P.f + P.b * f.cx + P.d * f.cy, 7 + ef.g * 5, "#FFD98A", (ef.g - 0.5) * 0.8);
    }
    c.restore();
    return true;
  }

  if (window.CRIATURAS) {
    const viejo = CRIATURAS.DIBUJO ? CRIATURAS.DIBUJO.lobo : null;
    CRIATURAS.registrar("lobo", (c, t, o) => {
      if (!dibujar(c, t, o) && viejo) viejo(c, t, o);
    });
  }
  const TODAS = ["S", "E", "N", "avisoS", "avisoE"];
  TODAS.forEach(cargar);
  const listo = () => TODAS.every((v) => cargar(v).listo);
  return { dibujar, VISTAS, POSES, PALETAS, pose, cargar, listo };
})();
