// ---------- La araña del nido en vectores (módulo ARANA) ----------
// La lámina de Alejandro (frente, costado, espalda y el aviso de frente y de costado, 30/10/2026) pasada a SVG tal cual
// (img/criaturas/arana/*.svg, vectorizada con Recraft) y animada con huesos, como el jabalí: un hueso por pata
// (raíz, rodilla y punta) y cada forma sigue a los que tiene cerca. Anda en dos grupos de cuatro patas que se alternan,
// en el aviso entra la pose de la lámina con las patas de adelante en alto (tiemblan y los ojos y la runa se encienden),
// salta, se encoge al recibir un golpe y al morir recoge las patas. De espaldas la lámina no trae la runa: se pinta acá.
// Paletas: hojarasca (la lámina), ceniza y la de las ataduras, en el orden de enemigos/aranas.js.
// Se registra en CRIATURAS como "arana"; mientras el SVG carga se ve el dibujo viejo de aranas.js.
window.ARANA = (function () {
  "use strict";
  // unidades del mundo por pixel de la lámina (de frente mide unos 100 de ancho, del tamaño de un perro grande)
  const MUNDO = 0.18;
  // huesos de cada vista en las coordenadas del SVG (2048 de ancho): a = donde gira, k = la rodilla, b = la punta,
  // p = el padre, s = alcance. k = lo que mide el SVG en pixeles de la lámina; pie = el centro del piso
  const pata = (a, k, b, s) => ({ a, k, b, p: "raiz", s: s || 60 });
  const VISTAS = {
    S: {
      k: 585,
      pie: [1024, 1215],
      huesos: {
        raiz: { a: [1024, 800], b: [1024, 750] },
        torso: { a: [1024, 800], b: [1024, 250], p: "raiz", s: 330 },
        cabeza: { a: [1024, 720], b: [1024, 1050], p: "torso", s: 150 },
        i1: pata([600, 640], [420, 500], [70, 1020]),
        i2: pata([640, 700], [470, 630], [200, 1180]),
        i3: pata([690, 760], [580, 720], [380, 1290]),
        i4: pata([760, 800], [640, 790], [590, 1290]),
        d1: pata([1450, 640], [1630, 500], [1960, 1020]),
        d2: pata([1410, 700], [1580, 630], [1840, 1180]),
        d3: pata([1360, 760], [1470, 720], [1650, 1290]),
        d4: pata([1290, 800], [1410, 790], [1440, 1290]),
      },
    },
    E: {
      k: 503,
      pie: [1025, 1400],
      huesos: {
        raiz: { a: [900, 850], b: [900, 800] },
        torso: { a: [900, 850], b: [380, 450], p: "raiz", s: 380 },
        cabeza: { a: [1350, 800], b: [1900, 900], p: "torso", s: 200 },
        d4: pata([800, 860], [520, 580], [120, 1160]),
        d3: pata([1000, 900], [910, 760], [580, 1360]),
        d2: pata([1250, 900], [1240, 760], [1410, 1360]),
        d1: pata([1450, 880], [1520, 780], [1880, 1400]),
      },
    },
    N: {
      k: 529,
      pie: [1040, 1330],
      huesos: {
        raiz: { a: [1040, 800], b: [1040, 750] },
        torso: { a: [1040, 800], b: [1040, 250], p: "raiz", s: 340 },
        i1: pata([620, 700], [400, 520], [90, 1100]),
        i2: pata([660, 750], [450, 650], [200, 1250]),
        i3: pata([700, 800], [580, 760], [310, 1280]),
        i4: pata([740, 820], [700, 810], [580, 1300]),
        d1: pata([1460, 700], [1690, 520], [1950, 1100]),
        d2: pata([1420, 750], [1640, 650], [1870, 1250]),
        d3: pata([1380, 800], [1500, 760], [1760, 1280]),
        d4: pata([1340, 820], [1390, 810], [1490, 1300]),
      },
    },
  };
  // las poses del aviso de la lámina: las dos patas de adelante en alto, que tiemblan
  const POSES = {
    avisoS: {
      k: 688,
      pie: [1024, 1290],
      huesos: {
        raiz: { a: [1024, 800], b: [1024, 750] },
        i1: pata([740, 800], [500, 100], [130, 460], 90),
        d1: pata([1300, 800], [1560, 100], [1950, 460], 90),
      },
    },
    avisoE: {
      k: 689,
      pie: [1025, 1305],
      huesos: {
        raiz: { a: [900, 850], b: [900, 800] },
        d1: pata([1260, 620], [1520, 100], [1960, 470], 90),
        d2: pata([1300, 650], [1470, 420], [1800, 690], 90),
      },
    },
  };
  // dos grupos que se alternan al andar, como las arañas de verdad
  const GRUPO = { i1: 0, d2: 0, i3: 0, d4: 0, d1: 1, i2: 1, d3: 1, i4: 1 };
  // la runa de espaldas, que la lámina no trae: base y alto en el SVG de N
  const RUNA_N = { x: 1040, y: 530, h: 210, w: 40 };

  // ---------- paletas: quitina, musgo, runa y ojos cambian; colmillos y puntas de las patas quedan ----------
  const PALETAS = [
    null, // hojarasca, la de la lámina
    { quitina: [28, 0.15, 1.12], musgo: [80, 0.12, 1.05], runa: [0, 0, 1.6] }, // ceniza
    { quitina: [300, 0.22, 0.42], musgo: [272, 0.4, 0.6], runa: [266, 0.58, 1.15], ojo: [282, 0.75, 1.25] }, // de las ataduras
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
    if (h > 160 && h < 220 && s > 0.3) return "runa";
    if ((h < 15 || h > 345) && s > 0.5 && l > 0.3) return "ojo";
    if (h > 50 && h < 130 && s > 0.15) return "musgo";
    if (l > 0.68) return "claro"; // colmillos
    if (s <= 0.08) return "punta"; // las puntas oscuras de las patas
    return "quitina";
  }
  function tenir(col, pal) {
    if (!pal) return col;
    const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(col);
    if (!m) return col;
    const [h, s, l] = rgbAHsl(+m[1], +m[2], +m[3]), p = pal[grupo(h, s, l)];
    if (!p) return col;
    return hslARgb(p[0], Math.min(1, s * p[1]), l * p[2]);
  }
  const RUNA_COL = "rgb(74,185,200)";

  // ---------- el motor: armar(ficha) da una araña dibujada desde su lámina ----------
  // ficha: carpeta, MUNDO, VISTAS, POSES, PALETAS, aviso (vista → pose del aviso), basico (vista → pose del ataque
  // básico, opcional), RUNA_N (la runa que se pinta de espaldas, opcional) y sombra ([de costado, de frente])
  function armar(C) {
    const { MUNDO, VISTAS, POSES, PALETAS, RUNA_N } = C;
    // ---------- carga: cada forma con su Path2D, su color y sus pesos ----------
    const vistas = {};
    const lienzoGrad = document.createElement("canvas").getContext("2d");
    function distSeg(x, y, a, b) {
      const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy || 1;
      const u = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l));
      return Math.hypot(x - a[0] - u * dx, y - a[1] - u * dy);
    }
    // distancia a un hueso: las patas van de la raíz a la rodilla y de la rodilla a la punta
    const distHueso = (x, y, h) => (h.k ? Math.min(distSeg(x, y, h.a, h.k), distSeg(x, y, h.k, h.b)) : distSeg(x, y, h.a, h.b));
    function cargar(v) {
      if (vistas[v]) return vistas[v];
      const st = (vistas[v] = { listo: false });
      fetch(C.carpeta + v + ".svg")
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
          const iTorso = Math.max(0, nombres.indexOf("torso"));
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
            // las capas grandes (el fondo del cuerpo) van con el tronco
            if ((x1 - x0) * (y1 - y0) > 600000) return Object.assign(forma, { w: [[iTorso, 1]] });
            const w = segs.map((h, i) => {
              if (nombres[i] === "raiz" && segs.length > 2) return [i, 0];
              const dd = distHueso(cx, cy, h), s = h.s || 120;
              return [i, Math.exp(-(dd / s) * (dd / s)) + 1e-9];
            });
            w.sort((a, b) => b[1] - a[1]);
            const top = w.slice(0, 3), tot = top.reduce((a, b) => a + b[1], 0);
            return Object.assign(forma, { w: top.map(([i, x]) => [i, x / tot]) });
          });
          st.nombres = nombres;
          st.pinturas = {};
          // los ojos y la runa: se encienden en el aviso y se apagan al morir
          st.ojos = [];
          st.runa = [];
          st.formas.forEach((f, i) => {
            const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(f.fill);
            const gr = m ? grupo(...rgbAHsl(+m[1], +m[2], +m[3])) : "";
            if (gr === "ojo") st.ojos.push(i);
            if (gr === "runa") st.runa.push(i);
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

    // ---------- la pose: un ángulo por hueso y el vaivén del cuerpo ----------
    const rad = Math.PI / 180;
    // hacia dónde gira una pata para levantar la punta: la de la izquierda a favor del reloj, la de la derecha en contra
    const alzar = (h) => (h.b[0] < h.a[0] ? 1 : -1);
    function pose(def, v, t, o) {
      const q = { raiz: 0, torso: 0, cabeza: 0, dx: 0, dy: 0, sx: 1, sy: 1 };
      const m = Math.min(2, o.mov || 0), sem = o.sem || 0, costado = v === "E";
      const patas = Object.keys(def.huesos).filter((n) => GRUPO[n] != null);
      patas.forEach((n) => (q[n] = 0));
      // respirar: el abdomen sube y baja apenas, las patas se acomodan de a una
      const r = Math.sin(t * 1.8 + sem);
      q.sy += r * 0.012;
      patas.forEach((n, i) => (q[n] += Math.max(0, Math.sin(t * 0.7 + sem + i * 1.9) - 0.85) * 40 * rad * alzar(def.huesos[n])));
      // andar (mov 1) y correr o saltar (mov 2): un grupo de cuatro patas se levanta mientras el otro apoya
      if (m > 0) {
        const f = t * (m > 1 ? 20 : 12) + sem, s = Math.sin(f), amp = m > 1 ? 1.3 : 1;
        q.dy -= Math.abs(Math.cos(f)) * 5 * amp;
        patas.forEach((n) => {
          const h = def.huesos[n], u = GRUPO[n] ? -s : s;
          q[n] += Math.max(0, u) * 14 * rad * amp * alzar(h);
          // de costado además van y vienen, hacia adelante cuando están en el aire
          if (costado) q[n] -= u * 9 * rad * amp;
        });
        if (costado) q.torso += (m > 1 ? -3 : 0) * rad;
        else q.dx += s * 4;
      }
      // golpe recibido: se encoge y se echa atrás
      if (o.herido > 0) {
        const e = o.herido * o.herido;
        q.sy -= 0.07 * e;
        q.sx += 0.04 * e;
        q.dx -= (costado ? 30 : 0) * e;
        q.cabeza -= (costado ? 6 : 0) * rad * e;
        patas.forEach((n) => (q[n] += 8 * rad * e * alzar(def.huesos[n])));
      }
      // muerte: baja el cuerpo y recoge las patas contra la panza
      if (o.muere > 0) {
        const u = Math.min(1, o.muere / 0.8), e = u * u;
        q.caido = e;
        q.dy += 120 * e;
        q.sy -= 0.2 * e;
        patas.forEach((n) => (q[n] -= 32 * rad * e * alzar(def.huesos[n])));
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
        // las patas pisan el piso: no se aplastan con el cuerpo, solo lo siguen un poco
        if (GRUPO[n] != null && !q.caido) padre = [1, 0, 0, 1, q.dx * 0.5, q.dy * 0.6];
        M[n] = mul(n === "raiz" ? raiz : padre, giro(q[n] || 0, h.a[0], h.a[1]));
      });
      return orden.map((n) => M[n]);
    }

    // ---------- dibujar ----------
    const cal = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
    function dibujar(c, t, o) {
      const v = o.vista || "S";
      const st = cargar(v);
      if (!st.listo) return false;
      const g = o.golpe || 0, muere = Math.min(1, (o.muere || 0) / 0.8);
      let brillo = 0.15 + Math.sin(t * 2 + (o.sem || 0)) * 0.08;
      if (g > 0) brillo = Math.max(brillo, g);
      const ef = { brillo: brillo * (1 - muere), muere };
      // en el aviso entra la pose de la lámina con las patas de adelante en alto (de espaldas se agacha)
      // el ataque básico de la lámina, si lo trae: entra cuando clava
      const pb = C.basico && C.basico[v];
      if (pb && ((o.cabezazo || 0) > 0.15 || (o.basico || 0) > 0.85)) {
        const sp = cargar(pb);
        if (sp.listo) {
          const def = POSES[pb];
          return pintar(c, sp, def, huesos(def, { raiz: 0, dx: 0, dy: 0, sx: 1, sy: 1 }), o, 1, ef, v);
        }
      }
      if (g > 0.12 && C.aviso[v] && (o.mov || 0) < 2) {
        const pv = C.aviso[v], sp = cargar(pv);
        if (sp.listo) {
          const def = POSES[pv], q = { raiz: 0, dx: 0, dy: 0, sx: 1 + 0.03 * g, sy: 1 - 0.03 * g };
          // las patas en alto tiemblan, cada vez más
          Object.keys(def.huesos).forEach((n, i) => {
            if (GRUPO[n] != null) q[n] = Math.sin(t * (18 + g * 14) + i * 2) * (2 + g * 4) * rad;
          });
          return pintar(c, sp, def, huesos(def, q), o, Math.min(1, (g - 0.12) / 0.1), ef, v);
        }
      }
      const def = VISTAS[v], q = pose(def, v, t, o);
      if (v === "N" && g > 0) q.sy -= 0.08 * g;
      return pintar(c, st, def, huesos(def, q), o, 1, ef, v);
    }
    function pintar(c, st, def, Ms, o, aparece, ef, v) {
      const pal = (o.pal || 0) % PALETAS.length, cols = pinturas(st, pal), costado = v === "E";
      const esc = (MUNDO * def.k) / 2048;
      c.save();
      c.fillStyle = "rgba(0,0,0,0.36)";
      c.beginPath();
      c.ellipse(0, 0, C.sombra[costado ? 0 : 1], C.sombra[2] || 9, 0, 0, Math.PI * 2);
      c.fill();
      const T0 = c.getTransform();
      if (aparece < 1) c.scale(1 + 0.05 * (1 - aparece), 1 + 0.07 * (1 - aparece));
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
      // de espaldas la runa va pintada sobre el lomo, con el tronco
      const P = PALETAS[pal];
      if (v === "N" && RUNA_N && window.FUTHARK) {
        const r = Ms[st.nombres.indexOf("torso")], m = mul(base, r);
        c.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
        c.translate(RUNA_N.x, RUNA_N.y);
        // vista desde atrás, la runa queda espejada
        c.scale(-1.35, 1);
        FUTHARK.dibujar(c, "hagalaz", 0, 0, RUNA_N.h, ef.muere > 0.5 ? "#3A2E28" : tenir(RUNA_COL, P), RUNA_N.w);
        if (cal() === "alta" && ef.brillo > 0.05) {
          c.globalAlpha = Math.min(1, ef.brillo) * 0.5;
          c.globalCompositeOperation = "lighter";
          FUTHARK.dibujar(c, "hagalaz", 0, 0, RUNA_N.h, tenir("rgb(115,213,219)", P), RUNA_N.w);
          c.globalCompositeOperation = "source-over";
          c.globalAlpha = 1;
        }
      }
      // los ojos y la runa: laten quietos, se encienden en el aviso y se apagan al morir
      const encender = (lista, col, a, modo) => {
        if (a <= 0.02) return;
        const a0 = c.globalAlpha;
        c.globalAlpha = a0 * Math.min(1, a);
        if (modo) c.globalCompositeOperation = modo;
        c.fillStyle = col;
        for (const i of lista) {
          const r = mats[i];
          c.setTransform(r[0], r[1], r[2], r[3], r[4], r[5]);
          c.fill(fs[i].path);
        }
        c.globalCompositeOperation = "source-over";
        c.globalAlpha = a0;
      };
      if (cal() === "alta") {
        encender(st.ojos, tenir("rgb(255,141,113)", P), ef.brillo * 0.6, "lighter");
        encender(st.runa, tenir("rgb(115,213,219)", P), ef.brillo * 0.5, "lighter");
      }
      encender(st.ojos, "#2A1A18", ef.muere * 1.4);
      encender(st.runa, "#3A2E28", ef.muere * 1.2);
      c.setTransform(T0);
      c.restore();
      return true;
    }
    const TODAS = Object.keys(VISTAS).concat(Object.keys(POSES));
    const precargar = () => TODAS.forEach(cargar);
    const listo = () => TODAS.every((v) => cargar(v).listo);
    return { dibujar, VISTAS, POSES, PALETAS, pose, cargar, listo, precargar };
  }

  const NIDO = armar({ carpeta: "img/criaturas/arana/", MUNDO, VISTAS, POSES, PALETAS, RUNA_N, aviso: { S: "avisoS", E: "avisoE" }, sombra: [42, 36] });
  if (window.CRIATURAS) {
    const viejo = CRIATURAS.DIBUJO ? CRIATURAS.DIBUJO.arana : null;
    CRIATURAS.registrar("arana", (c, t, o) => {
      if (!NIDO.dibujar(c, t, o) && viejo) viejo(c, t, o);
    });
  }
  NIDO.precargar();
  return Object.assign(NIDO, { armar });
})();
