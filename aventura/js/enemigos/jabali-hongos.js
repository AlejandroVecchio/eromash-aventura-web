// ---------- El jabalí de hongos en vectores (módulo JABALI) ----------
// La lámina de Alejandro (frente, costado, espalda y el aviso de frente y de costado) pasada a SVG tal cual
// (img/criaturas/jabali/*.svg, vectorizada con Recraft) y animada con huesos de cuatro patas, como el Custodio:
// cada forma sigue a los huesos que tiene cerca. Reposo, trote, el aviso de la carga (baja la cabeza, raspa el piso
// y resopla), la carga, herido y muerte; los hongos del lomo se mecen. Paletas: musgo (la lámina), brasa y escarcha.
// Se registra en CRIATURAS como "jabali"; mientras el SVG carga se ve el dibujo viejo de criaturas-bosque.js.
window.JABALI = (function () {
  "use strict";
  // unidades del mundo por pixel de la lámina (de costado mide unos 120 de largo)
  const MUNDO = 0.18;
  // huesos de cada vista en las coordenadas del SVG (2048): a = donde gira, b = la punta, p = el padre, s = alcance.
  // k = lo que mide el SVG en pixeles de la lámina; pie = el centro del piso; lomo = lo que está más arriba va con los hongos
  const VISTAS = {
    S: {
      k: 503,
      pie: [1022, 1976],
      lomo: 560,
      huesos: {
        raiz: { a: [1024, 1300], b: [1024, 1250] },
        torso: { a: [1024, 1300], b: [1024, 600], p: "raiz", s: 300 },
        hongos: { a: [1024, 520], b: [1024, 120], p: "torso", s: 400 },
        cabeza: { a: [1024, 900], b: [1024, 1450], p: "torso", s: 200 },
        pDI: { a: [470, 1640], b: [500, 1950], p: "raiz", s: 90 },
        pDD: { a: [1545, 1640], b: [1545, 1950], p: "raiz", s: 90 },
        pTI: { a: [725, 1720], b: [690, 1920], p: "raiz", s: 70 },
        pTD: { a: [1320, 1720], b: [1320, 1920], p: "raiz", s: 70 },
      },
    },
    E: {
      k: 700,
      pie: [1025, 1707],
      lomo: 780,
      huesos: {
        raiz: { a: [845, 1150], b: [845, 1100] },
        torso: { a: [845, 1150], b: [1430, 1100], p: "raiz", s: 260 },
        hongos: { a: [850, 720], b: [850, 340], p: "torso", s: 400 },
        cabeza: { a: [1480, 1000], b: [1950, 1230], p: "torso", s: 170 },
        cola: { a: [280, 920], b: [77, 1180], p: "torso", s: 90 },
        pTI: { a: [330, 1330], b: [330, 1660], p: "raiz", s: 80 },
        pTD: { a: [480, 1330], b: [380, 1650], p: "raiz", s: 80 },
        pDI: { a: [1150, 1330], b: [1170, 1650], p: "raiz", s: 80 },
        pDD: { a: [1300, 1330], b: [1300, 1690], p: "raiz", s: 80 },
      },
    },
    N: {
      k: 503,
      pie: [1024, 1976],
      lomo: 560,
      huesos: {
        raiz: { a: [1024, 1300], b: [1024, 1250] },
        torso: { a: [1024, 1300], b: [1024, 600], p: "raiz", s: 300 },
        hongos: { a: [1024, 520], b: [1024, 120], p: "torso", s: 400 },
        cola: { a: [1033, 900], b: [1033, 1300], p: "torso", s: 110 },
        pTI: { a: [575, 1640], b: [550, 1950], p: "raiz", s: 90 },
        pTD: { a: [1395, 1640], b: [1400, 1950], p: "raiz", s: 90 },
        pDI: { a: [740, 1720], b: [740, 1910], p: "raiz", s: 70 },
        pDD: { a: [1290, 1720], b: [1290, 1910], p: "raiz", s: 70 },
      },
    },
  };
  // las poses de la lámina para el aviso de la carga: la cabeza baja y las patas abiertas
  const POSES = {
    avisoS: { k: 657, pie: [1022, 1678], lomo: 760, huesos: { raiz: { a: [1022, 1200], b: [1022, 1150] }, hongos: { a: [1022, 700], b: [1022, 380], p: "raiz", s: 400 } } },
    avisoE: { k: 765, pie: [1023, 1559], lomo: 840, huesos: { raiz: { a: [1000, 1150], b: [1000, 1100] }, hongos: { a: [1000, 800], b: [1000, 450], p: "raiz", s: 400 } } },
  };
  // la nariz, desde el pie y en pixeles de la lámina: de ahí salen los resoplidos
  const HOCICO = { S: [0, -95], E: [130, -60], avisoS: [0, -40], avisoE: [135, -25] };

  // ---------- paletas: el pelo, el musgo y los sombreros de los hongos cambian; ojos, colmillos y tallos quedan ----------
  const PALETAS = [
    null, // musgo, la de la lámina
    { pelo: [20, 0.35, 0.75], musgo: [8, 0.75, 1.05], hongo: [42, 0.95, 1.1] }, // brasa
    { pelo: [215, 0.25, 1.15], musgo: [195, 0.35, 1.45], hongo: [188, 0.55, 1.25] }, // escarcha
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
    if (h > 160 && h < 210 && s > 0.35 && l > 0.35) return "ojo";
    if (h > 55 && h < 120 && s > 0.2) return "musgo";
    if ((h < 40 || h > 340) && s > 0.45 && l > 0.3 && l < 0.75) return "hongo";
    if (l > 0.68) return "claro"; // colmillos y tallos
    return "pelo";
  }
  function tenir(col, pal) {
    if (!pal) return col;
    const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(col);
    if (!m) return col;
    const [h, s, l] = rgbAHsl(+m[1], +m[2], +m[3]), gr = grupo(h, s, l), p = pal[gr];
    if (!p) return col;
    return hslARgb(p[0], Math.min(1, s * p[1] + (gr === "pelo" ? 0.05 : 0)), l * p[2]);
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
    fetch("img/criaturas/jabali/" + v + ".svg")
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
          // los hongos y el musgo del lomo van enteros con su hueso: se mecen sin desarmarse
          if (y1 < def.lomo + 80 || cy < def.lomo) return Object.assign(forma, { w: [[nombres.indexOf("hongos"), 1]] });
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
        // los ojos (el celeste de la lámina): se encienden en el aviso y se apagan al morir
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
    const q = { raiz: 0, torso: 0, hongos: 0, cabeza: 0, cola: 0, dx: 0, dy: 0, sx: 1, sy: 1, alza: {} };
    PATAS.forEach((p) => ((q[p] = 0), (q.alza[p] = 0)));
    const m = Math.min(2, o.mov || 0), sem = o.sem || 0, costado = v === "E";
    // respirar: el lomo sube y baja, la cola se mueve sola
    const r = Math.sin(t * 2.1 + sem);
    q.sy += r * 0.014;
    q.cabeza += Math.sin(t * 0.8 + sem) * 1.5 * rad;
    q.cola += Math.sin(t * 5 + sem) * 10 * rad;
    q.hongos += Math.sin(t * 1.3 + sem) * 1.2 * rad;
    // trote (mov 1) y carga (mov 2): las patas van en diagonal, la del frente con la de atrás del otro lado
    if (m > 0) {
      const vel = m > 1 ? 15 : 8, f = t * vel + sem, s = Math.sin(f), c = Math.cos(f), amp = m > 1 ? 1.5 : 1;
      q.dy -= Math.abs(c) * (m > 1 ? 34 : 16);
      q.hongos += -s * 4 * rad * amp;
      q.cabeza += c * 2.5 * rad * amp;
      if (costado) {
        q.pDD += s * 16 * rad * amp; q.pTI += s * 16 * rad * amp;
        q.pDI -= s * 16 * rad * amp; q.pTD -= s * 16 * rad * amp;
        q.torso += (m > 1 ? -4 : 0) * rad + c * 1.5 * rad;
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
      q.cabeza -= (costado ? 8 : 0) * rad * e;
      q.sy -= 0.05 * e;
      q.sx += 0.03 * e;
      q.dx -= (costado ? 30 : 0) * e;
      q.hongos += 6 * rad * e;
    }
    // muerte: se le doblan las patas y cae de costado
    if (o.muere > 0) {
      const u = Math.min(1, o.muere / 0.8), e = u * u;
      // las patas se doblan contra el cuerpo y bajan con él
      q.caido = e;
      PATAS.forEach((p) => (q[p] += (p[1] === "D" ? -1 : 1) * (costado ? 60 : 20) * rad * e));
      q.dy += 200 * e;
      q.sy -= 0.28 * e;
      q.sx += 0.06 * e;
      q.torso += (costado ? 6 : 0) * rad * e;
      q.hongos += 14 * rad * e;
      q.cabeza += (costado ? 14 : 0) * rad * e;
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
      M[n] = mul(n === "raiz" ? raiz : padre, giro(q[n] || 0, h.a[0], h.a[1]));
    });
    return orden.map((n) => M[n]);
  }

  // ---------- efectos ----------
  const cal = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  const azar = (k, i) => {
    const x = Math.sin(k * 12.9898 + i * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  // lo del piso: la tierra que raspa con la pata en el aviso y el polvo que levanta al cargar
  function efectosPiso(c, ef, costado) {
    const n = cal() === "alta" ? 1 : cal() === "media" ? 0.5 : 0;
    if (!n) return;
    // raspa: terrones que saltan hacia atrás desde la pata trasera, cada vez más seguido
    if (ef.sube && ef.g > 0.2) {
      const atras = costado ? -60 : 0;
      for (let i = 0; i < 6 * n; i++) {
        const u = (ef.t * (1.6 + ef.g * 2) + i / 6) % 1, a = azar(ef.k, i) - 0.5;
        const x = atras - u * (costado ? 70 : 0) + a * (costado ? 20 : 70), y = -u * 30 * (1 - u) * 2.5;
        DIB.alfa(c, (1 - u) * 0.8, () => DIB.P(c, [x - 3, y, x, y - 3, x + 3, y, x, y + 3], i % 2 ? "#5A4232" : "#3E2E22"));
      }
      DIB.alfa(c, 0.25 * ef.g, () => DIB.E(c, costado ? -50 : 0, -2, 26, 7, "#7D6D5E"));
    }
    // carga: nubes de polvo que quedan atrás
    if (ef.carga > 0)
      for (let i = 0; i < 6 * n; i++) {
        const u = (ef.t * 3 + i / 6) % 1;
        DIB.alfa(c, 0.3 * (1 - u) * ef.carga, () => DIB.E(c, (costado ? -40 : 0) - u * (costado ? 90 : 0), -6 - u * 14, 10 + u * 16, 5 + u * 6, "#7D6D5E"));
      }
  }
  // lo del aire: los resoplidos del hocico y el brillo de los ojos
  function efectosAire(c, ef, hocico) {
    const n = cal() === "alta" ? 1 : cal() === "media" ? 0.5 : 0;
    if (ef.sube && n && hocico) {
      // dos bocanadas de vapor por segundo, más fuertes cuanto más cerca de embestir
      for (let i = 0; i < 3; i++) {
        const u = (ef.t * 1.8 + i / 3) % 1;
        DIB.alfa(c, (1 - u) * 0.4 * ef.g, () => DIB.E(c, hocico[0] + u * (hocico[0] ? 30 : 0) + (i - 1) * 6, hocico[1] + 6 - u * 10, 5 + u * 10, 3 + u * 6, "#E0D6D0"));
      }
    }
  }

  // ---------- dibujar ----------
  const previo = {}, fx = {};
  function dibujar(c, t, o) {
    const v = o.vista || "S";
    const st = cargar(v);
    if (!st.listo) return false;
    const k = o.sem != null ? o.sem : 0, g = o.golpe || 0, ant = previo[k] != null ? previo[k] : 0;
    previo[k] = g;
    const F = fx[k] || (fx[k] = { carga: -9 });
    // el aviso sube de 0 a 1; cuando empieza a bajar arrancó la carga
    const sube = g > 0 && g >= ant && (o.mov || 0) < 2;
    if (g < ant && ant > 0.8) F.carga = t;
    // si el reloj volvió atrás (otra partida, otra animación) la carga vieja ya no cuenta
    if (t < F.carga) F.carga = -9;
    const dc = t - F.carga, carga = (o.mov || 0) >= 2 ? 1 : dc < 0.5 ? 1 - dc / 0.5 : 0;
    const muere = Math.min(1, (o.muere || 0) / 0.8);
    let brillo = 0.15 + Math.sin(t * 2.4 + k) * 0.08;
    if (sube) brillo = Math.max(brillo, g);
    const ef = { t, g, sube, carga, brillo: brillo * (1 - muere), muere, k };
    // con la cabeza baja se dibuja la pose del aviso de la lámina (de espaldas no hay: lo hace el esqueleto)
    if (sube && g > 0.15 && v !== "N") {
      const pv = v === "S" ? "avisoS" : "avisoE", sp = cargar(pv);
      if (sp.listo) {
        const def = POSES[pv];
        const q = { raiz: 0, hongos: Math.sin(t * 9) * 3 * rad * g, dx: g > 0.8 ? Math.sin(t * 60) * 8 : 0, dy: 0, sx: 1 + 0.04 * g, sy: 1 - 0.04 * g, alza: {} };
        return pintar(c, sp, def, huesos(def, q), o, Math.min(1, (g - 0.15) / 0.1), Object.assign(ef, { arte: pv }), v === "E");
      }
    }
    const def = VISTAS[v];
    const q = pose(v, t, o);
    if (v === "N" && sube) q.sy -= 0.08 * g; // de espaldas se agacha
    return pintar(c, st, def, huesos(def, q), o, 1, Object.assign(ef, { arte: v }), v === "E");
  }
  function pintar(c, st, def, Ms, o, aparece, ef, costado) {
    const cols = pinturas(st, (o.pal || 0) % PALETAS.length);
    const esc = (MUNDO * def.k) / 2048;
    c.save();
    c.fillStyle = "rgba(0,0,0,0.34)";
    c.beginPath();
    c.ellipse(0, 0, costado ? 50 : 32, costado ? 11 : 11, 0, 0, Math.PI * 2);
    c.fill();
    efectosPiso(c, ef, costado);
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
    ojos("#E8FFFF", ef.brillo * 0.7);
    if (cal() === "alta") ojos("#73D5DB", ef.brillo * 0.5, "lighter");
    ojos("#24302F", ef.muere * 1.5);
    c.setTransform(T0);
    const h = HOCICO[ef.arte];
    efectosAire(c, ef, h ? [h[0] * MUNDO, h[1] * MUNDO] : null);
    if (ef.sube && ef.g > 0.5 && st.ojos.length) {
      // un brillo chico en los ojos cuando está por embestir
      const f = st.formas[st.ojos[0]], r = mats[st.ojos[0]], P = c.getTransform().inverse().multiply(new DOMMatrix(r));
      DIB.halo(c, P.e + P.a * f.cx + P.c * f.cy, P.f + P.b * f.cx + P.d * f.cy, 8 + ef.g * 6, DIB.RUNICO, (ef.g - 0.5) * 0.8);
    }
    c.restore();
    return true;
  }

  if (window.CRIATURAS) {
    const viejo = CRIATURAS.DIBUJO ? CRIATURAS.DIBUJO.jabali : null;
    CRIATURAS.registrar("jabali", (c, t, o) => {
      if (!dibujar(c, t, o) && viejo) viejo(c, t, o);
    });
  }
  const TODAS = ["S", "E", "N", "avisoS", "avisoE"];
  TODAS.forEach(cargar);
  const listo = () => TODAS.every((v) => cargar(v).listo);
  return { dibujar, VISTAS, POSES, PALETAS, pose, cargar, listo };
})();
