// ---------- El cuervo de Hel en vectores (módulo CUERVO) ----------
// Las dos láminas de Alejandro pasadas a SVG tal cual (img/criaturas/cuervo/*.svg, vectorizadas con Recraft): parado
// (pS, pE, pN) y volando (S, E, N, y el ataque de frente y de costado). Mientras no te vio está posado en el piso:
// respira, mira alrededor y picotea. Al verte abre las alas y levanta vuelo, vuela bajo aleteando, en el aviso se
// alza con las alas arriba, el pico abierto y la runa del amuleto encendida, y cae en picada; cuando vuelve a su
// lugar se posa. Herido se sacude y al morir cae. Paletas: la de la lámina (Hel), albino y de brasa. Se registra en
// CRIATURAS como "cuervo"; mientras el SVG carga se ve el dibujo viejo.
window.CUERVO = (function () {
  "use strict";
  // unidades del mundo por pixel de la lámina; ALTO = a qué altura vuela
  const MUNDO = 0.1, ALTO = 42;
  // de 0 a 1: cuánto pesa un hueso según lo lejos que está la forma de donde gira
  const rampa = (u, ancho) => Math.max(0, Math.min(1, u / ancho));
  // cada vista: k = lo que mide su lado largo en pixeles de la lámina (las figuras de la lámina de vuelo están
  // dibujadas más chicas, así que llevan su k agrandado para que el cuervo mida lo mismo), pie = lo que va en el
  // piso (o el centro del cuerpo si vuela), centro = el cuerpo (una forma grande que lo tapa va con el tronco),
  // huesos = dónde gira cada uno y peso(x, y) = a qué hueso va cada forma según dónde está su centro
  const VISTAS = {
    pS: {
      k: 590, pie: [1000, 1420], centro: [1000, 800],
      huesos: { cabeza: [1000, 480], alaI: [600, 520], alaD: [1400, 520] },
      peso: (x, y) => (x > 700 && x < 1300 && y < 480 ? ["cabeza", rampa(480 - y, 80)] : x < 600 ? ["alaI", rampa(600 - x, 100)] : x > 1400 ? ["alaD", rampa(x - 1400, 100)] : null),
    },
    pE: {
      k: 507, pie: [1150, 1540], centro: [1100, 900],
      huesos: { cabeza: [1300, 600], cola: [900, 1000] },
      peso: (x, y) => (x > 1250 && y < 640 ? ["cabeza", rampa(x - 1250, 100)] : x < 900 && y > 900 ? ["cola", rampa(900 - x, 200)] : null),
    },
    pN: {
      k: 576, pie: [1040, 1395], centro: [1050, 800],
      huesos: { cabeza: [1050, 440], alaI: [700, 500], alaD: [1400, 500] },
      peso: (x, y) => (y < 440 ? ["cabeza", rampa(440 - y, 60)] : x < 700 ? ["alaI", rampa(700 - x, 120)] : x > 1400 ? ["alaD", rampa(x - 1400, 120)] : null),
    },
    S: {
      k: 920, pie: [1024, 450], centro: [1024, 450],
      huesos: { cabeza: [1024, 440], alaI: [860, 330], alaD: [1190, 330] },
      peso: (x, y) => (x < 860 ? ["alaI", rampa(860 - x, 120)] : x > 1190 ? ["alaD", rampa(x - 1190, 120)] : y < 430 ? ["cabeza", rampa(430 - y, 80)] : null),
    },
    E: {
      k: 714, pie: [1150, 600], centro: [1150, 600],
      huesos: { cabeza: [1400, 520], ala: [1150, 430], cola: [850, 720] },
      peso: (x, y) => (x > 1380 ? ["cabeza", rampa(x - 1380, 80)] : x < 1150 && y < 600 ? ["ala", rampa(1150 - x, 200)] : x < 800 ? ["cola", rampa(800 - x, 200)] : null),
    },
    N: {
      k: 874, pie: [1050, 450], centro: [1050, 450],
      huesos: { cabeza: [1050, 280], alaI: [880, 300], alaD: [1220, 300], cola: [1050, 580] },
      peso: (x, y) => (x < 880 ? ["alaI", rampa(880 - x, 120)] : x > 1220 ? ["alaD", rampa(x - 1220, 120)] : y > 600 ? ["cola", rampa(y - 600, 80)] : y < 260 ? ["cabeza", rampa(260 - y, 60)] : null),
    },
    avisoS: {
      k: 813, pie: [1024, 850], centro: [1024, 850],
      huesos: { alaI: [800, 600], alaD: [1250, 600] },
      peso: (x) => (x < 800 ? ["alaI", rampa(800 - x, 120)] : x > 1250 ? ["alaD", rampa(x - 1250, 120)] : null),
    },
    avisoE: {
      k: 616, pie: [1150, 1100], centro: [1150, 1100],
      huesos: { ala: [1150, 900], cabeza: [1500, 1150] },
      peso: (x, y) => (x < 1100 && y < 1000 ? ["ala", rampa(1100 - x, 200)] : x > 1500 && y > 1050 ? ["cabeza", rampa(x - 1500, 80)] : null),
    },
  };
  const HUESOS = ["torso", "cabeza", "ala", "alaI", "alaD", "cola"];

  // ---------- paletas: las plumas cambian; el pico, el hueso del amuleto y la runa quedan ----------
  const PALETAS = [
    null, // de Hel, la de la lámina
    { pluma: [220, 0.15, 3.2], violeta: [340, 0.25, 2.2], ojo: [355, 1, 0.85] }, // albino
    { pluma: [230, 0.15, 0.8], violeta: [8, 0.9, 0.95], ojo: [45, 1, 1.15] }, // de brasa
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
    if ((h < 20 || h >= 340) && s > 0.6 && l > 0.5 && l < 0.8) return "ojo";
    if (h >= 165 && h < 205 && s > 0.4) return "runa";
    if (l > 0.75) return "hueso";
    if (h < 50 && s < 0.45 && l > 0.2) return "pico"; // pico, garras y el cordón
    if (h >= 255 && h < 320) return "violeta";
    return "pluma";
  }
  function tenir(col, pal) {
    if (!pal) return col;
    const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(col);
    if (!m) return col;
    const [h, s, l] = rgbAHsl(+m[1], +m[2], +m[3]), p = pal[grupo(h, s, l)];
    if (!p) return col;
    return hslARgb(p[0], Math.min(1, s * p[1] + (p[3] || 0)), l * p[2]);
  }

  // ---------- carga: cada forma con su Path2D, su color y su hueso ----------
  const vistas = {};
  const lienzoGrad = document.createElement("canvas").getContext("2d");
  function cargar(v) {
    if (vistas[v]) return vistas[v];
    const st = (vistas[v] = { listo: false });
    fetch("img/criaturas/cuervo/" + v + ".svg")
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
        const def = VISTAS[v], [ox, oy] = def.centro;
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
          // el fondo del cuerpo (una forma grande que pasa por el centro) va con el tronco
          const fondo = (x1 - x0) * (y1 - y0) > 300000 && x0 < ox && ox < x1 && y0 < oy && oy < y1;
          const r = fondo ? null : def.peso(cx, cy);
          forma.w = r && r[1] > 0 ? [[HUESOS.indexOf(r[0]), r[1]], [0, 1 - r[1]]] : [[0, 1]];
          return forma;
        });
        st.ojos = [];
        st.runa = [];
        st.formas.forEach((f, i) => {
          const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(f.fill), gr = m && grupo(...rgbAHsl(+m[1], +m[2], +m[3]));
          if (gr === "ojo") st.ojos.push(i);
          if (gr === "runa") st.runa.push(i);
        });
        st.pinturas = {};
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

  // ---------- huesos: el tronco lleva escala, giro y corrimiento; los demás giran en su lugar ----------
  const rad = Math.PI / 180;
  const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  function giro(a, x, y) {
    const c = Math.cos(a), s = Math.sin(a);
    return [c, s, -s, c, x - c * x + s * y, y - s * x - c * y];
  }
  function huesos(def, q) {
    const [px, py] = def.pie, [ox, oy] = def.centro;
    const torso = mul([q.sx, 0, 0, q.sy, px - q.sx * px + q.dx, py - q.sy * py + q.dy], giro(q.rot || 0, ox, oy));
    return HUESOS.map((n) => {
      if (n === "torso") return torso;
      const a = def.huesos[n];
      return a ? mul(torso, giro(q[n] || 0, a[0], a[1])) : torso;
    });
  }
  const nueva = () => ({ cabeza: 0, ala: 0, alaI: 0, alaD: 0, cola: 0, dx: 0, dy: 0, sx: 1, sy: 1, rot: 0 });

  // posado: respira, mira a los lados y de a ratos picotea el piso; al despegar se agacha y abre las alas
  function posePosado(v, t, o, abre) {
    const q = nueva(), sem = o.sem || 0;
    q.sy += Math.sin(t * 2.2 + sem) * 0.014;
    const pica = Math.max(0, Math.sin(t * 0.8 + sem * 3)) ** 12;
    q.cabeza = Math.sin(t * 0.7 + sem) * 6 * rad + (v === "pE" ? pica * 35 * rad : 0);
    if (v === "pS") q.dy += pica * 20;
    q.cola = Math.sin(t * 1.6 + sem) * 2 * rad;
    if (abre > 0) {
      q.sy -= 0.1 * abre;
      q.sx += 0.04 * abre;
      q.alaI = 40 * rad * abre;
      q.alaD = -40 * rad * abre;
      q.cola = -20 * rad * abre;
    }
    return q;
  }
  // volando: aletea (rápido al despegar), el cuerpo sube cuando bajan las alas
  function poseVuelo(v, t, o, rapido) {
    const q = nueva(), sem = o.sem || 0, m = Math.min(2, o.mov || 0);
    const f = Math.sin(t * (9 + m * 1.5 + rapido * 6) + sem), amp = (22 + rapido * 8) * rad;
    q.alaI = f * amp;
    q.alaD = -f * amp;
    q.ala = f * amp * 1.2;
    q.dy = f * 30;
    q.cola = -f * 4 * rad;
    q.cabeza = Math.sin(t * 1.1 + sem) * 3 * rad;
    if (v === "E") q.rot = m * 3 * rad; // se inclina hacia adelante cuando apura
    return q;
  }

  // ---------- dibujar ----------
  const cal = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  const est = {};
  const PICADA = 0.35, DESPEGA = 0.5;
  function dibujar(c, t, o) {
    const v = o.vista || "S", k = o.sem != null ? o.sem : 0;
    // posado mientras no te vio y está quieto; en el catálogo y el bestiario, posado si no se mueve
    const posado = o.estado ? o.estado === "quieto" && (o.mov || 0) < 0.3 : !o.mov;
    let F = est[k];
    if (!F || t < F.t) F = est[k] = { vuelo: posado ? 0 : 1, t, golpe: 0, picada: -9 };
    const dt = Math.min(0.1, t - F.t);
    F.t = t;
    F.vuelo = Math.max(0, Math.min(1, F.vuelo + (posado ? -dt : dt) / DESPEGA));
    const g = o.golpe || 0, ant = F.golpe, sube = g > 0 && g >= ant;
    F.golpe = g;
    if (g < ant && ant > 0.8) F.picada = t;
    const dp = t - F.picada, picada = dp < PICADA ? 1 - dp / PICADA : 0;
    const muere = Math.min(1, (o.muere || 0) / 0.8), herido = o.herido > 0 ? o.herido * o.herido : 0;
    const vu = F.vuelo, sube01 = vu * vu * (3 - 2 * vu);
    let alto = ALTO * sube01, nombre, q;
    const ef = { brillo: 0.2 + Math.sin(t * 2.4 + k) * 0.08, runa: 0.25 + Math.sin(t * 1.7 + k) * 0.1, muere, sube, g };
    if (vu < 0.35) {
      // posado, o agachándose y abriendo las alas para despegar
      nombre = "p" + v;
      q = posePosado(nombre, t, o, vu / 0.35);
    } else if (((sube && g > 0.15) || picada > 0) && v !== "N" && cargar("aviso" + v).listo) {
      // el aviso de la picada (la pose de la lámina): se alza, tiembla, la runa se enciende; después cae en picada
      nombre = "aviso" + v;
      q = nueva();
      const tira = Math.sin(Math.min(1, picada * 1.4) * Math.PI);
      alto += (sube ? g : 1) * 14 - tira * (ALTO + 6);
      q.dx = (g > 0.7 && sube ? Math.sin(t * 50) * 8 : 0) + (v === "E" ? tira * 300 : 0);
      q.alaI = Math.sin(t * 38) * 4 * rad * g;
      q.alaD = -q.alaI;
      q.ala = q.alaI;
      if (v === "S") q.sx = q.sy = 1 + tira * 0.14;
      ef.runa = Math.max(ef.runa, sube ? g : picada);
      ef.brillo = Math.max(ef.brillo, sube ? g : picada);
    } else {
      nombre = v;
      q = poseVuelo(v, t, o, 1 - vu);
      if (v === "N" && (sube || picada > 0)) {
        // de espaldas no hay pose: sube las alas y se alza
        const a = sube ? g : picada;
        q.alaI = 35 * rad * a;
        q.alaD = -35 * rad * a;
        alto += 14 * a - Math.sin(Math.min(1, picada * 1.4) * Math.PI) * (ALTO + 6);
        ef.runa = Math.max(ef.runa, a);
      }
    }
    if (herido > 0) {
      // golpe recibido: se echa atrás con las alas arriba
      q.dx -= (v === "E" ? 50 : 0) * herido;
      q.rot -= (v === "E" ? 10 : 0) * rad * herido;
      q.sy -= 0.05 * herido;
      q.alaI += 20 * rad * herido;
      q.alaD -= 20 * rad * herido;
      q.ala += 20 * rad * herido;
      alto += 6 * herido;
    }
    if (muere > 0) {
      // cae: las alas se le doblan y queda de costado en el piso
      const e = muere * muere;
      alto *= 1 - e;
      q.rot += (v === "N" ? -1 : 1) * 70 * rad * e;
      q.alaI -= 30 * rad * e;
      q.alaD += 30 * rad * e;
      q.ala -= 30 * rad * e;
      q.sy -= 0.15 * e;
      q.dy += (nombre[0] === "p" ? 0 : 150) * e;
    }
    const st = cargar(nombre);
    if (!st.listo) return false;
    return pintar(c, st, VISTAS[nombre], huesos(VISTAS[nombre], q), o, ef, alto, v === "E");
  }
  function pintar(c, st, def, Ms, o, ef, alto, costado) {
    const cols = pinturas(st, (o.pal || 0) % PALETAS.length);
    const esc = (MUNDO * def.k) / 2048, h = Math.max(0, alto) / ALTO;
    c.save();
    // la sombra queda en el piso y se achica y aclara cuanto más alto vuela
    c.fillStyle = `rgba(0,0,0,${0.32 - 0.12 * h})`;
    c.beginPath();
    c.ellipse(0, 0, (costado ? 20 : 22) * (1 - 0.25 * h), 6 * (1 - 0.25 * h), 0, 0, Math.PI * 2);
    c.fill();
    c.translate(0, -alto);
    const T0 = c.getTransform();
    c.scale(esc, esc);
    c.translate(-def.pie[0], -def.pie[1]);
    const B = c.getTransform(), base = [B.a, B.b, B.c, B.d, B.e, B.f];
    const fs = st.formas, mats = new Array(fs.length);
    for (let i = 0; i < fs.length; i++) {
      const w = fs[i].w;
      let m;
      if (w.length === 1 || w[0][1] > 0.995) m = Ms[w[0][0]];
      else {
        m = [0, 0, 0, 0, 0, 0];
        for (let j = 0; j < w.length; j++) {
          const n = Ms[w[j][0]], kk = w[j][1];
          for (let z = 0; z < 6; z++) m[z] += n[z] * kk;
        }
      }
      const r = (mats[i] = mul(base, m));
      c.setTransform(r[0], r[1], r[2], r[3], r[4], r[5]);
      c.fillStyle = cols[i];
      c.fill(fs[i].path);
    }
    // los ojos de brasa y la runa del amuleto: laten, se encienden en el aviso y se apagan al morir
    const encender = (lista, col, a, modo) => {
      if (a <= 0.02 || !lista.length) return;
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
    const vivo = 1 - ef.muere, alta = cal() === "alta";
    if (alta) encender(st.ojos, "#FF8D71", ef.brillo * 0.6 * vivo, "lighter");
    encender(st.runa, "#E8FCFF", ef.runa * 0.6 * vivo);
    if (alta) encender(st.runa, "#73D5DB", ef.runa * 0.5 * vivo, "lighter");
    encender(st.ojos, "#24302F", ef.muere * 1.5);
    c.setTransform(T0);
    if (ef.sube && ef.g > 0.4 && st.runa.length && vivo > 0) {
      // la runa del amuleto brilla fuerte justo antes de caer en picada
      const f = st.formas[st.runa[0]], r = mats[st.runa[0]], P = c.getTransform().inverse().multiply(new DOMMatrix(r));
      DIB.halo(c, P.e + P.a * f.cx + P.c * f.cy, P.f + P.b * f.cx + P.d * f.cy, 8 + ef.g * 6, "#73D5DB", (ef.g - 0.4) * 0.9);
    }
    c.restore();
    return true;
  }

  if (window.CRIATURAS) {
    const viejo = CRIATURAS.DIBUJO ? CRIATURAS.DIBUJO.cuervo : null;
    CRIATURAS.registrar("cuervo", (c, t, o) => {
      if (!dibujar(c, t, o) && viejo) viejo(c, t, o);
    });
  }
  const TODAS = Object.keys(VISTAS);
  TODAS.forEach(cargar);
  const listo = () => TODAS.every((v) => cargar(v).listo);
  return { dibujar, VISTAS, PALETAS, cargar, listo };
})();
