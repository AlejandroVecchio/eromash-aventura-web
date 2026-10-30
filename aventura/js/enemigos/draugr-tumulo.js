// ---------- El draugr del túmulo en vectores (módulo DRAUGR) ----------
// La lámina de Alejandro (frente, costado, espalda y el aviso de frente y de costado) pasada a SVG tal cual
// (img/criaturas/draugr/*.svg, vectorizada con Recraft) y animada con huesos: respira pesado con el hacha colgando,
// marcha despacio afirmando cada bota, en el aviso entra la pose de la lámina con el hacha en alto (tiembla, los ojos y
// la runa del escudo se encienden), baja el hachazo de arriba hacia adelante, se sacude herido y al morir se desarma.
// Paletas: de túmulo (bronce y piel gris verdosa), ceniza de Skarnholt (brasa) y escarcha; la cuarta es la de la lámina.
// Se registra en CRIATURAS como "draugr"; mientras el SVG carga se ve el dibujo viejo.
window.DRAUGR = (function () {
  "use strict";
  // unidades del mundo por pixel de la lámina (parado mide unos 110 de alto)
  const MUNDO = 0.21;
  const rampa = (u, ancho) => Math.max(0, Math.min(1, u / ancho));
  // cada vista: k = lo que mide su lado largo en pixeles de la lámina, pie = el centro del piso, centro = el cuerpo
  // (una forma grande que lo tapa va con el tronco), huesos = dónde gira cada uno (los pies van con el piso), hacha = el
  // brazo que la lleva y peso(x, y) = a qué hueso va cada forma según dónde está su centro
  const VISTAS = {
    S: {
      k: 513, pie: [1070, 1886], centro: [1070, 1000], hacha: "brazoI",
      huesos: { cabeza: [1040, 600], brazoI: [600, 700], brazoD: [1420, 680], pieI: [690, 1800], pieD: [1400, 1800] },
      peso: (x, y) => ((x < 480 && y > 700) || (x < 640 && y > 700 && y < 1400) ? ["brazoI", rampa(640 - x, 60)] : y > 1640 && x > 480 && x < 900 ? ["pieI", rampa(y - 1640, 40)] : y > 1640 && x > 1200 && x < 1700 ? ["pieD", rampa(y - 1640, 40)] : x > 1460 && y > 620 && y < 1560 ? ["brazoD", rampa(x - 1460, 30)] : x > 1340 && y > 620 && y < 830 ? ["brazoD", 1] : x > 830 && x < 1250 && y < 620 ? ["cabeza", rampa(620 - y, 80)] : null),
    },
    E: {
      k: 502, pie: [410, 1911], centro: [500, 1000], hacha: "brazo",
      huesos: { cabeza: [520, 520], brazo: [270, 620], pie: [380, 1800] },
      peso: (x, y) => (y > 1660 && x < 700 ? ["pie", rampa(y - 1660, 40)] : (x < 450 && y > 650 && y < 1330) || (x > 540 && y > 1250 && y < 1700) ? ["brazo", 1] : y < 400 ? ["cabeza", rampa(400 - y, 50)] : x > 560 && y < 740 ? ["cabeza", rampa(x - 560, 60)] : null),
    },
    N: {
      k: 513, pie: [900, 1888], centro: [970, 900], hacha: "brazoD",
      huesos: { cabeza: [930, 380], brazoI: [470, 680], brazoD: [1400, 660], pieI: [530, 1800], pieD: [1240, 1800] },
      peso: (x, y) => (x > 1380 && y > 620 ? ["brazoD", rampa(x - 1380, 40)] : y > 1640 && x < 800 ? ["pieI", rampa(y - 1640, 40)] : y > 1610 && x > 1000 && x < 1450 ? ["pieD", rampa(y - 1610, 40)] : x < 560 && y > 620 && y < 1560 ? ["brazoI", rampa(560 - x, 40)] : y < 330 ? ["cabeza", rampa(330 - y, 40)] : null),
    },
    avisoS: {
      k: 529, pie: [814, 1940], centro: [760, 800], hacha: "hacha",
      huesos: { hacha: [760, 560] },
      peso: (x, y) => (x < 300 && y < 800 ? ["hacha", 1] : y < 500 && !(x > 630 && x < 910 && y > 320) ? ["hacha", rampa(500 - y, 60)] : null),
    },
    avisoE: {
      k: 507, pie: [1000, 1930], centro: [980, 700], hacha: "hacha",
      huesos: { hacha: [760, 450] },
      peso: (x, y) => (x < 500 && y < 800 ? ["hacha", 1] : x < 880 && y < 500 ? ["hacha", rampa(880 - x, 80)] : null),
    },
  };
  const HUESOS = ["torso", "cabeza", "brazo", "brazoI", "brazoD", "hacha", "pie", "pieI", "pieD"];
  const PIES = ["pie", "pieI", "pieD"];

  // ---------- paletas: cambian las placas, la piel y la luz de los ojos y la runa; el cuero y el hierro quedan ----------
  const PALETAS = [
    { placa: [36, 0.7, 0.66], piel: [140, 0.5, 1.05], runa: [150, 1, 1.05] }, // de túmulo: bronce viejo, piel gris verdosa
    { placa: [6, 0.3, 0.62], piel: [30, 0.25, 1.1], runa: [14, 1, 1.15] }, // ceniza de Skarnholt: placas tiznadas, brasa en los ojos
    { placa: [208, 0.35, 0.85], piel: [205, 0.4, 1.15], runa: [185, 0.6, 1.25] }, // escarcha
    null, // la de la lámina
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
    if (h >= 165 && h < 205 && s > 0.4) return "runa"; // los ojos y la runa del escudo
    if (s < 0.08) return "hierro"; // la hoja del hacha y la barba
    if (h >= 50 && h < 120) return "piel";
    if ((h < 25 || h >= 340) && s > 0.4) return "placa";
    return "cuero";
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
    fetch("img/criaturas/draugr/" + v + ".svg")
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
          const forma = { path: new Path2D(d), fill, grad, cx, cy, ancho: x1 - x0, alto: y1 - y0 };
          // el fondo del cuerpo (una forma grande que pasa por el centro) va con el tronco
          const fondo = (x1 - x0) * (y1 - y0) > 300000 && x0 < ox && ox < x1 && y0 < oy && oy < y1;
          // lo casi negro (el hueco de la capucha y las sombras hondas entre los brazos) va con el tronco: si se
          // fuera con un pie o una mano dejaría a la vista un pedazo de sombra suelto
          const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(fill), negro = m && Math.max(+m[1], +m[2], +m[3]) < 34;
          const r = fondo || negro ? null : def.peso(cx, cy);
          forma.w = r && r[1] > 0 ? [[HUESOS.indexOf(r[0]), r[1]], [0, 1 - r[1]]] : [[0, 1]];
          return forma;
        });
        st.runa = [];
        st.formas.forEach((f, i) => {
          const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(f.fill), gr = m && grupo(...rgbAHsl(+m[1], +m[2], +m[3]));
          if (gr === "runa") st.runa.push(i);
        });
        // la runa del escudo es la forma de luz más grande (los ojos son chicos)
        const area = (i) => st.formas[i].ancho * st.formas[i].alto;
        st.grande = st.runa.length ? st.runa.reduce((a, i) => (area(i) > area(a) ? i : a), st.runa[0]) : -1;
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

  // ---------- huesos: el tronco lleva escala, giro y corrimiento; los pies pisan el piso y solo se levantan al dar el paso ----------
  const rad = Math.PI / 180;
  const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  function giro(a, x, y) {
    const c = Math.cos(a), s = Math.sin(a);
    return [c, s, -s, c, x - c * x + s * y, y - s * x - c * y];
  }
  function huesos(def, q) {
    const [px, py] = def.pie;
    // se bambolea desde los pies: así las canillas no se despegan de los pies que pisan
    const torso = mul([q.sx, 0, 0, q.sy, px - q.sx * px + q.dx, py - q.sy * py + q.dy], giro(q.rot || 0, px, py));
    return HUESOS.map((n) => {
      if (n === "torso") return torso;
      const a = def.huesos[n];
      if (!a) return torso;
      if (PIES.includes(n) && !q.caido) return [1, 0, 0, 1, q.dx * 0.3 + (q.paso[n] || 0), -(q.alza[n] || 0)];
      return mul(torso, giro(q[n] || 0, a[0], a[1]));
    });
  }
  const nueva = () => ({ cabeza: 0, brazo: 0, brazoI: 0, brazoD: 0, hacha: 0, dx: 0, dy: 0, sx: 1, sy: 1, rot: 0, paso: {}, alza: {} });

  // reposo y andar: respira hondo con el hacha colgando; al marchar afirma cada bota y se mece de lado a lado
  function pose(v, t, o) {
    const q = nueva(), sem = o.sem || 0, m = Math.min(2, o.mov || 0), costado = v === "E", h = VISTAS[v].hacha;
    q.sy += Math.sin(t * 1.4 + sem) * 0.01;
    q.cabeza = Math.sin(t * 0.5 + sem) * 2 * rad;
    const cuelga = Math.sin(t * 1.4 + sem + 0.8) * 1.5 * rad;
    q[h] = cuelga;
    if (m > 0) {
      const f = t * (3.6 + m * 1.2) + sem, s = Math.sin(f), c = Math.cos(f), amp = Math.min(1.3, m);
      q.sy += Math.abs(c) * 0.02 * amp;
      q.rot += s * 2 * rad * amp;
      q.cabeza += -s * 2 * rad * amp;
      if (costado) {
        q.paso.pie = s * 120 * amp;
        q.alza.pie = Math.max(0, c) * 28 * amp;
        q.brazo += -s * 7 * rad * amp;
        q.dx += s * 12 * amp;
      } else {
        q.alza.pieI = Math.max(0, s) * 18 * amp;
        q.alza.pieD = Math.max(0, -s) * 18 * amp;
        q[h] += s * 4 * rad * amp;
        q[h === "brazoI" ? "brazoD" : "brazoI"] += s * 1.5 * rad * amp;
        q.dx += s * 8 * amp;
      }
    }
    return q;
  }

  // ---------- dibujar ----------
  const cal = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  const est = {};
  // el hachazo: después del aviso baja el hacha de arriba hacia adelante
  const HACHAZO = 0.34;
  function dibujar(c, t, o) {
    const v = o.vista || "S", k = o.sem != null ? o.sem : 0;
    let F = est[k];
    if (!F || t < F.t) F = est[k] = { t, golpe: 0, suelta: -9 };
    F.t = t;
    const g = o.golpe || 0, ant = F.golpe, sube = g > 0 && g >= ant;
    F.golpe = g;
    if (g < ant && ant > 0.8) F.suelta = t;
    const dz = t - F.suelta, baja = dz < HACHAZO ? 1 - dz / HACHAZO : 0;
    const muere = Math.min(1, (o.muere || 0) / 0.8), herido = o.herido > 0 ? o.herido * o.herido : 0;
    const ef = { estela: 0, runa: 0.3 + Math.sin(t * 1.6 + k) * 0.1, muere, sube, g };
    let nombre = v, q;
    // el hachazo en dos tiempos: el hacha arranca desde arriba de la lámina y cae; después queda abajo y adelante,
    // como la lleva al andar, con el cuerpo echado sobre el golpe
    const fase = baja > 0 ? 1 - baja : 1, arriba = baja > 0 && fase < 0.3;
    if (((sube && g > 0.15) || arriba) && v !== "N" && cargar("aviso" + v).listo) {
      // la pose del aviso de la lámina: el hacha en alto; tiembla y al soltar empieza a bajarla
      nombre = "aviso" + v;
      q = nueva();
      const cae = arriba ? Math.pow(fase / 0.3, 2) : 0, a = sube ? g : 1;
      q.sy = 1 + 0.025 * a - cae * 0.03;
      q.dx = (g > 0.7 && sube ? Math.sin(t * 40) * 8 : 0) + (v === "E" ? cae * 60 : 0);
      q.hacha = (sube ? Math.sin(t * 36) * 2.5 * rad * a : 0) + (v === "E" ? 75 : -55) * rad * cae;
      ef.runa = Math.max(ef.runa, sube ? g : 1);
    } else {
      q = pose(v, t, o);
      if (baja > 0 && v !== "N") {
        // el hacha ya cayó: el cuerpo sigue el golpe hacia adelante, se aplasta y el brazo rebota
        const r = 1 - (fase - 0.3) / 0.7, h = VISTAS[v].hacha;
        q.sy -= 0.07 * r;
        q.sx += 0.04 * r;
        if (v === "E") {
          q.dx += 110 * r;
          q.rot += 7 * rad * r;
          q.brazo -= 22 * rad * r;
        } else q[h] += 18 * rad * r;
        ef.runa = Math.max(ef.runa, r);
        ef.estela = r;
      }
      if (v === "N" && (sube || baja > 0)) {
        // de espaldas no hay pose: levanta el hacha por encima del hombro y la baja
        const a = sube ? g : baja;
        q.brazoD = (sube ? -150 : -150 + 150 * (1 - baja)) * rad * Math.min(1, a * 1.3);
        q.sy += 0.03 * a;
      }
    }
    if (herido > 0) {
      // golpe recibido: se echa atrás, sube el escudo y cabecea
      q.dx -= (v === "E" ? 36 : 0) * herido;
      q.rot -= (v === "E" ? 6 : 0) * rad * herido;
      q.sy -= 0.04 * herido;
      q.brazoI += 10 * rad * herido;
      q.brazoD -= 10 * rad * herido;
      q.brazo -= 12 * rad * herido;
      q.cabeza -= 10 * rad * herido;
    }
    if (muere > 0) {
      // se desarma: las rodillas ceden, se hunde y el hacha cae
      const e = muere * muere;
      q.caido = e > 0.05;
      q.sy -= 0.38 * e;
      q.sx += 0.1 * e;
      q.rot += (v === "E" ? 14 : v === "N" ? -6 : 6) * rad * e;
      q.cabeza += 25 * rad * e;
      q.brazoI -= 14 * rad * e;
      q.brazoD += 14 * rad * e;
      q.brazo += 30 * rad * e;
    }
    const st = cargar(nombre);
    if (!st.listo) return false;
    return pintar(c, st, VISTAS[nombre], huesos(VISTAS[nombre], q), o, ef, v === "E");
  }
  function pintar(c, st, def, Ms, o, ef, costado) {
    const cols = pinturas(st, (o.pal || 0) % PALETAS.length);
    const esc = (MUNDO * def.k) / 2048;
    c.save();
    c.fillStyle = "rgba(0,0,0,0.36)";
    c.beginPath();
    c.ellipse(0, 0, costado ? 26 : 30, 8, 0, 0, Math.PI * 2);
    c.fill();
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
    // los ojos y la runa del escudo: laten, se encienden en el aviso y se apagan al morir
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
    const vivo = 1 - ef.muere, alta = cal() === "alta", pal = PALETAS[(o.pal || 0) % PALETAS.length];
    const luz = pal ? hslARgb(pal.runa[0], pal.runa[1], 0.62 * pal.runa[2]) : "#73D5DB";
    encender(st.runa, "#F2FCFF", ef.runa * 0.5 * vivo);
    if (alta) encender(st.runa, luz, ef.runa * 0.55 * vivo, "lighter");
    encender(st.runa, "#24302F", ef.muere * 1.5);
    c.setTransform(T0);
    if (ef.estela > 0.35 && vivo > 0) {
      // la estela del hachazo: una media luna clara de arriba hacia adelante y abajo
      const a = (ef.estela - 0.35) / 0.65, [x, y, r, a0, a1] = costado ? [10, -56, 50, -1.9, 0.9] : [-8, -55, 46, -2, -3.7];
      c.globalAlpha = a * 0.55;
      c.fillStyle = "#F2ECEC";
      c.beginPath();
      c.arc(x, y, r, a0, a1, a1 < a0);
      c.arc(x + (costado ? -10 : 8), y + 4, r * 0.82, a1, a0, a1 >= a0);
      c.fill();
      c.globalAlpha = 1;
    }
    if (ef.sube && ef.g > 0.4 && st.grande >= 0 && vivo > 0) {
      // la runa del escudo brilla fuerte justo antes del hachazo
      const f = st.formas[st.grande], r = mats[st.grande], P = c.getTransform().inverse().multiply(new DOMMatrix(r));
      DIB.halo(c, P.e + P.a * f.cx + P.c * f.cy, P.f + P.b * f.cx + P.d * f.cy, 10 + ef.g * 8, luz, (ef.g - 0.4) * 0.9);
    }
    c.restore();
    return true;
  }

  if (window.CRIATURAS) {
    const viejo = CRIATURAS.DIBUJO ? CRIATURAS.DIBUJO.draugr : null;
    CRIATURAS.registrar("draugr", (c, t, o) => {
      if (!dibujar(c, t, o) && viejo) viejo(c, t, o);
    });
  }
  const TODAS = Object.keys(VISTAS);
  TODAS.forEach(cargar);
  const listo = () => TODAS.every((v) => cargar(v).listo);
  return { dibujar, VISTAS, PALETAS, cargar, listo };
})();
