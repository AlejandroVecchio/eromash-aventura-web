// ---------- El errante de Helheim en vectores (módulo ERRANTE) ----------
// La lámina de Alejandro (frente, costado, espalda y el ataque de frente y de costado) pasada a SVG tal cual
// (img/criaturas/errante/*.svg, vectorizada con Recraft) y animada con huesos: respira encorvado con los brazos
// colgando, anda arrastrando los pies, en el aviso entra la pose de la lámina con los brazos arriba y las garras
// abiertas (tiembla, los ojos y la runa de la hebilla se encienden), baja las garras en el zarpazo, se sacude herido
// y al morir se desmorona. Paletas: la túnica roja de la lámina, de Hel (violeta) y de ceniza. Se registra en
// CRIATURAS como "errante"; mientras el SVG carga se ve el dibujo viejo.
window.ERRANTE = (function () {
  "use strict";
  // unidades del mundo por pixel de la lámina (parado mide unos 80 de alto)
  const MUNDO = 0.19;
  const rampa = (u, ancho) => Math.max(0, Math.min(1, u / ancho));
  // cada vista: k = lo que mide su lado largo en pixeles de la lámina, pie = el centro del piso, centro = el cuerpo
  // (una forma grande que lo tapa va con el tronco), huesos = dónde gira cada uno (los pies van con el piso) y
  // peso(x, y) = a qué hueso va cada forma según dónde está su centro
  const VISTAS = {
    S: {
      k: 486, pie: [610, 1880], centro: [610, 1000],
      huesos: { cabeza: [610, 820], brazoI: [300, 560], brazoD: [930, 560], pieI: [290, 1820], pieD: [900, 1820] },
      peso: (x, y) => (y > 1790 && x < 470 ? ["pieI", rampa(y - 1790, 40)] : y > 1790 && x > 750 ? ["pieD", rampa(y - 1790, 40)] : x < 380 && y > 520 ? ["brazoI", rampa(380 - x, 60)] : x > 840 && y > 520 ? ["brazoD", rampa(x - 840, 60)] : x > 380 && x < 860 && y < 820 ? ["cabeza", rampa(820 - y, 80)] : null),
    },
    E: {
      k: 487, pie: [400, 1890], centro: [600, 1000],
      huesos: { cabeza: [720, 420], brazo: [560, 300], pie: [380, 1700] },
      peso: (x, y) => (y > 1600 && x < 560 ? ["pie", rampa(y - 1600, 100)] : x > 720 && y < 800 ? ["cabeza", rampa(x - 720, 100)] : x > 600 && y > 900 ? ["brazo", rampa(x - 600, 60)] : null),
    },
    N: {
      k: 488, pie: [560, 1880], centro: [560, 1000],
      huesos: { cabeza: [500, 400], brazoI: [300, 450], brazoD: [880, 450], pieI: [320, 1830], pieD: [830, 1830] },
      peso: (x, y) => (y > 1790 && x < 480 ? ["pieI", rampa(y - 1790, 40)] : y > 1790 && x > 700 ? ["pieD", rampa(y - 1790, 40)] : x < 300 && y > 780 ? ["brazoI", rampa(300 - x, 60)] : x > 880 && y > 780 ? ["brazoD", rampa(x - 880, 60)] : y < 380 ? ["cabeza", rampa(380 - y, 60)] : null),
    },
    avisoS: {
      k: 573, pie: [650, 1930], centro: [650, 1100],
      huesos: { brazoI: [400, 800], brazoD: [760, 820] },
      peso: (x, y) => (x < 480 && y < 900 ? ["brazoI", rampa(900 - y, 100)] : x > 740 && y < 880 ? ["brazoD", rampa(880 - y, 100)] : null),
    },
    avisoE: {
      k: 587, pie: [460, 1930], centro: [520, 1150],
      huesos: { brazo: [560, 680] },
      peso: (x, y) => (y < 640 && x > 320 ? ["brazo", rampa(640 - y, 80)] : null),
    },
  };
  const HUESOS = ["torso", "cabeza", "brazo", "brazoI", "brazoD", "pie", "pieI", "pieD"];
  const PIES = ["pie", "pieI", "pieD"];

  // ---------- paletas: cambian la túnica y la piel; las garras, el cinturón y la runa quedan ----------
  const PALETAS = [
    null, // la túnica roja de la lámina
    { tunica: [268, 1, 0.95] }, // de Hel: túnica violeta de las ataduras
    { tunica: [24, 0.35, 0.72], piel: [200, 1, 1.05, 0.06], ojo: [45, 1, 1.1] }, // de ceniza: túnica parda gastada
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
    if ((h < 25 || h >= 340) && s > 0.7 && l > 0.55 && l < 0.85) return "ojo";
    if (h >= 165 && h < 205 && s > 0.4) return "runa";
    if (l > 0.8) return "garra";
    if (s < 0.14) return "piel"; // la piel gris, los pies y la piedra de la hebilla
    if (h >= 25 && h < 50) return "cinto";
    if (h < 25 || h >= 330) return "tunica";
    return "otro";
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
    fetch("img/criaturas/errante/" + v + ".svg")
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
          // lo casi negro (el hueco de la capucha y las sombras hondas entre los brazos) va con el tronco: si se
          // fuera con un pie o una mano dejaría a la vista un pedazo de sombra suelto
          const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(fill), negro = m && Math.max(+m[1], +m[2], +m[3]) < 34;
          const r = fondo || negro ? null : def.peso(cx, cy);
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
  const nueva = () => ({ cabeza: 0, brazo: 0, brazoI: 0, brazoD: 0, dx: 0, dy: 0, sx: 1, sy: 1, rot: 0, paso: {}, alza: {} });

  // reposo y andar: respira encorvado, los brazos cuelgan y se mecen; al andar arrastra los pies y se bambolea
  function pose(v, t, o) {
    const q = nueva(), sem = o.sem || 0, m = Math.min(2, o.mov || 0), costado = v === "E";
    q.sy += Math.sin(t * 1.8 + sem) * 0.012;
    q.rot = Math.sin(t * 0.9 + sem) * 1.2 * rad;
    q.cabeza = Math.sin(t * 0.6 + sem) * 3 * rad;
    const cuelga = Math.sin(t * 1.8 + sem + 0.8) * 2.5 * rad;
    q.brazoI = cuelga;
    q.brazoD = -cuelga;
    q.brazo = cuelga;
    if (m > 0) {
      const f = t * (4.5 + m * 1.5) + sem, s = Math.sin(f), c = Math.cos(f), amp = Math.min(1.4, m);
      // sube y baja estirándose desde los pies, no despegándose del piso
      q.sy += Math.abs(c) * 0.025 * amp;
      q.rot += s * 3 * rad * amp;
      q.cabeza += -s * 4 * rad * amp;
      if (costado) {
        // un solo pie a la vista: va y viene arrastrándose y se levanta apenas al ir
        q.paso.pie = s * 110 * amp;
        q.alza.pie = Math.max(0, c) * 25 * amp;
        q.brazo += -s * 12 * rad * amp;
        q.dx += s * 15 * amp;
      } else {
        q.alza.pieI = Math.max(0, s) * 14 * amp;
        q.alza.pieD = Math.max(0, -s) * 14 * amp;
        q.brazoI += s * 3 * rad * amp;
        q.brazoD += s * 3 * rad * amp;
        q.dx += s * 6 * amp;
      }
    }
    return q;
  }

  // ---------- dibujar ----------
  const cal = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  const est = {};
  // el zarpazo: después del aviso baja las garras de golpe hacia adelante
  const ZARPAZO = 0.3;
  function dibujar(c, t, o) {
    const v = o.vista || "S", k = o.sem != null ? o.sem : 0;
    let F = est[k];
    if (!F || t < F.t) F = est[k] = { t, golpe: 0, zarpa: -9 };
    F.t = t;
    const g = o.golpe || 0, ant = F.golpe, sube = g > 0 && g >= ant;
    F.golpe = g;
    if (g < ant && ant > 0.8) F.zarpa = t;
    const dz = t - F.zarpa, zarpa = dz < ZARPAZO ? 1 - dz / ZARPAZO : 0;
    const muere = Math.min(1, (o.muere || 0) / 0.8), herido = o.herido > 0 ? o.herido * o.herido : 0;
    const ef = { brillo: 0.25 + Math.sin(t * 2 + k) * 0.08, runa: 0.2 + Math.sin(t * 1.3 + k) * 0.08, muere, sube, g };
    let nombre = v, q;
    if (((sube && g > 0.15) || zarpa > 0) && v !== "N" && cargar("aviso" + v).listo) {
      // la pose del aviso de la lámina: los brazos arriba y las garras abiertas; tiembla y al soltar baja las garras
      nombre = "aviso" + v;
      q = nueva();
      const tira = Math.sin(Math.min(1, zarpa * 1.4) * Math.PI), a = sube ? g : 1;
      q.sy = 1 + 0.03 * a - tira * 0.05;
      q.dx = (g > 0.7 && sube ? Math.sin(t * 45) * 8 : 0) + (v === "E" ? tira * 180 : 0);
      q.dy = v === "S" ? tira * 40 : 0;
      if (v === "S") q.sx = q.sy = 1 + tira * 0.06;
      q.rot = (v === "E" ? 9 : 0) * rad * tira;
      const temblor = Math.sin(t * 38) * 3 * rad * a;
      q.brazoI = temblor - 70 * rad * tira;
      q.brazoD = -temblor + 70 * rad * tira;
      q.brazo = temblor + 85 * rad * tira;
      ef.brillo = Math.max(ef.brillo, sube ? g : zarpa);
      ef.runa = Math.max(ef.runa, sube ? g : zarpa);
    } else {
      q = pose(v, t, o);
      if (v === "N" && (sube || zarpa > 0)) {
        // de espaldas no hay pose: levanta los brazos y se estira
        const a = sube ? g : zarpa;
        q.brazoI = 150 * rad * a;
        q.brazoD = -150 * rad * a;
        q.sy += 0.04 * a;
        ef.runa = Math.max(ef.runa, a);
      }
    }
    if (herido > 0) {
      // golpe recibido: se echa atrás y sacude los brazos
      q.dx -= (v === "E" ? 40 : 0) * herido;
      q.rot -= (v === "E" ? 8 : 0) * rad * herido;
      q.sy -= 0.05 * herido;
      q.brazoI += 18 * rad * herido;
      q.brazoD -= 18 * rad * herido;
      q.brazo -= 18 * rad * herido;
      q.cabeza -= 8 * rad * herido;
    }
    if (muere > 0) {
      // se desmorona: se le doblan las piernas, se hunde y los brazos caen
      const e = muere * muere;
      q.caido = e > 0.05;
      q.sy -= 0.4 * e;
      q.sx += 0.12 * e;
      q.rot += (v === "E" ? 12 : v === "N" ? -5 : 5) * rad * e;
      q.cabeza += 20 * rad * e;
      q.brazoI -= 10 * rad * e;
      q.brazoD += 10 * rad * e;
      q.brazo += 25 * rad * e;
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
    c.ellipse(0, 0, costado ? 24 : 26, 7, 0, 0, Math.PI * 2);
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
    // los ojos en la sombra de la capucha y la runa de la hebilla: laten, se encienden en el aviso y se apagan al morir
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
      // la runa de la hebilla brilla fuerte justo antes del zarpazo
      const f = st.formas[st.runa[0]], r = mats[st.runa[0]], P = c.getTransform().inverse().multiply(new DOMMatrix(r));
      DIB.halo(c, P.e + P.a * f.cx + P.c * f.cy, P.f + P.b * f.cx + P.d * f.cy, 8 + ef.g * 6, "#73D5DB", (ef.g - 0.4) * 0.9);
    }
    c.restore();
    return true;
  }

  if (window.CRIATURAS) {
    const viejo = CRIATURAS.DIBUJO ? CRIATURAS.DIBUJO.errante : null;
    CRIATURAS.registrar("errante", (c, t, o) => {
      if (!dibujar(c, t, o) && viejo) viejo(c, t, o);
    });
  }
  const TODAS = Object.keys(VISTAS);
  TODAS.forEach(cargar);
  const listo = () => TODAS.every((v) => cargar(v).listo);
  return { dibujar, VISTAS, PALETAS, cargar, listo };
})();
