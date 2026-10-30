// ---------- El trol de musgo en vectores (módulo TROL) ----------
// La lámina de Alejandro (30/10/2026) pasada a SVG tal cual (img/criaturas/trol/*.svg, vectorizada con Recraft y con
// los colores corregidos contra la lámina): frente, costado y espalda con el árbol en la mano derecha; el aplastar
// (el árbol en alto con las dos manos y el impacto contra el piso, de frente y de costado), el revés (el puño cruzado
// y el barrido, su ataque básico) y la muerte en seis cuadros de frente y de costado. Parado y al andar se mueve con
// huesos: paso pesado desde los pies, el árbol se mece y el puño libre acompaña.
// Paletas: la de la lámina (musgo), piedra y barro con la marca roja (los mismos índices que el dibujo viejo).
// Se registra en CRIATURAS como "trol"; mientras el SVG carga se ve el dibujo viejo.
window.TROL = (function () {
  "use strict";
  // unidades del mundo por pixel de la lámina (parado mide unos 170 de alto)
  const MUNDO = 0.88;
  const rampa = (u, ancho) => Math.max(0, Math.min(1, u / ancho));
  const madera = (f) => f.g === "madera" || f.g === "hojas";
  // cada vista: k = lo que mide el SVG de ancho en pixeles de la lámina, pie = [centro del cuerpo, piso] (el centro es
  // el de la piel, así las poses no se corren de lado), huesos = dónde gira cada uno y peso(x, y, f) = a qué hueso va
  // cada forma según dónde está su centro y su color (f.g)
  const VISTAS = {
    S: {
      k: 310, pie: [1246, 1331],
      huesos: { cabeza: [1250, 560], brazoA: [700, 600], brazoL: [1680, 560], pieI: [730, 1300], pieD: [1500, 1300] },
      peso: (x, y, f) =>
        madera(f) || x < 600 ? ["brazoA", 1]
        : x < 820 && y > 560 && y < 1150 ? ["brazoA", rampa(820 - x, 60)]
        : x > 1660 && y > 480 ? ["brazoL", rampa(x - 1660, 50)]
        : y > 1200 && x > 560 && x < 900 ? ["pieI", rampa(y - 1200, 40)]
        : y > 1200 && x > 1280 && x < 1680 ? ["pieD", rampa(y - 1200, 40)]
        : x > 1080 && x < 1440 && y > 170 && y < 580 ? ["cabeza", 1]
        : null,
    },
    E: {
      k: 276, pie: [1337, 1499],
      huesos: { cabeza: [1650, 450], brazo: [1250, 600], pie: [1230, 1480] },
      peso: (x, y, f) =>
        madera(f) || x < 1000 ? ["brazo", 1]
        : y > 1290 && x < 1470 ? ["pie", rampa(y - 1290, 40)]
        : x > 1050 && x < 1520 && y > 650 && y < 1290 ? ["brazo", rampa(y - 650, 120)]
        : x > 1600 && y < 700 ? ["cabeza", rampa(x - 1600, 60)]
        : null,
    },
    N: {
      k: 323, pie: [818, 1281],
      huesos: { brazoL: [400, 420], brazoA: [1300, 560], pieI: [520, 1240], pieD: [1100, 1240] },
      peso: (x, y, f) =>
        madera(f) || x > 1260 ? ["brazoA", x > 1260 ? rampa(x - 1260, 60) : 1]
        : (x < 440 && y > 400) || (x < 540 && y > 950) ? ["brazoL", x < 440 ? rampa(440 - x, 60) : 1]
        : y > 1020 && x > 300 && x < 720 ? ["pieI", rampa(y - 1020, 40)]
        : y > 1020 && x > 880 && x < 1320 ? ["pieD", rampa(y - 1020, 40)]
        : null,
    },
  };
  // las poses de la lámina, enteras: el aplastar (en alto e impacto), el revés (cruzado y barrido) y la muerte
  const pose = (k, x, y) => ({ k, pie: [x, y], huesos: {}, peso: () => null });
  const POSES = {
    aplastarS: pose(326, 1208, 1589), aplastarE: pose(291, 1096, 1654),
    impactoS: pose(402, 1154, 986), impactoE: pose(370, 872, 1002),
    revesS: pose(353, 1246, 1210), revesE: pose(293, 1256, 1478),
    golpeS: pose(336, 1292, 1274), golpeE: pose(332, 1278, 1295),
    muerteS1: pose(252, 1192, 1528), muerteS2: pose(261, 1265, 1240), muerteS3: pose(281, 1362, 1162),
    muerteS4: pose(297, 1280, 865), muerteS5: pose(281, 1281, 882), muerteS6: pose(310, 1265, 737),
    muerteE1: pose(223, 1260, 1685), muerteE2: pose(278, 1282, 1337), muerteE3: pose(294, 1231, 1118),
    muerteE4: pose(295, 1256, 1010), muerteE5: pose(312, 1272, 788), muerteE6: pose(298, 1238, 718),
  };
  Object.assign(VISTAS, POSES);
  const HUESOS = ["torso", "cabeza", "brazo", "brazoA", "brazoL", "pie", "pieI", "pieD"];
  const PIES = ["pie", "pieI", "pieD"];

  // ---------- paletas: cambian la piel, el musgo y la luz de la runa y los ojos; el árbol y los dientes quedan ----------
  const PALETAS = [
    null, // musgo: la de la lámina
    { piel: [30, 0.15, 0.95], musgo: [45, 0.25, 0.95], runa: [185, 0.6, 1.25] }, // piedra: gris, liquen pálido, escarcha
    { piel: [22, 1.7, 0.72], musgo: [6, 1.1, 0.62], runa: [14, 1, 1.15] }, // barro con la marca roja
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
    if (h >= 165 && h < 210 && s > 0.3) return "runa"; // la runa del pecho
    if (h >= 90 && h < 165 && s > 0.2) return "hojas";
    if (h >= 48 && h < 90 && s > 0.3) return "musgo"; // el musgo y los ojos
    if (l > 0.75 && h >= 25 && h < 70) return "diente"; // dientes y uñas
    if ((h < 40 || h >= 340) && s > 0.4 && l > 0.2) return "madera";
    return "piel";
  }
  function tenir(col, pal) {
    if (!pal) return col;
    const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(col);
    if (!m) return col;
    const [h, s, l] = rgbAHsl(+m[1], +m[2], +m[3]), p = pal[grupo(h, s, l)];
    if (!p) return col;
    return hslARgb(p[0], Math.min(1, s * p[1]), l * p[2]);
  }

  // ---------- carga: cada forma con su Path2D, su color, su grupo y su hueso ----------
  const vistas = {};
  function cargar(v) {
    if (vistas[v]) return vistas[v];
    const st = (vistas[v] = { listo: false });
    fetch("img/criaturas/trol/" + v + ".svg")
      .then((r) => r.text())
      .then((txt) => {
        const doc = new DOMParser().parseFromString(txt, "image/svg+xml");
        const def = VISTAS[v];
        st.formas = [...doc.querySelectorAll("path")].map((p) => {
          const d = p.getAttribute("d"), fill = p.getAttribute("fill") || "#000", nums = d.match(/-?\d+\.?\d*/g).map(Number);
          let cx = 0, cy = 0, n = 0, x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
          for (let i = 0; i + 1 < nums.length; i += 2) {
            cx += nums[i]; cy += nums[i + 1]; n++;
            x0 = Math.min(x0, nums[i]); x1 = Math.max(x1, nums[i]);
            y0 = Math.min(y0, nums[i + 1]); y1 = Math.max(y1, nums[i + 1]);
          }
          cx /= n; cy /= n;
          const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(fill), hsl = m ? rgbAHsl(+m[1], +m[2], +m[3]) : [0, 0, 0];
          const forma = { path: new Path2D(d), fill, cx, cy, ancho: x1 - x0, alto: y1 - y0, g: grupo(...hsl) };
          // el fondo del cuerpo (una forma enorme) y lo casi negro van con el tronco: si se fueran con un brazo o un pie
          // dejarían un pedazo de sombra suelto
          const fondo = (x1 - x0) * (y1 - y0) > 900000 && forma.g === "piel";
          const negro = m && Math.max(+m[1], +m[2], +m[3]) < 40;
          const r = fondo || negro ? null : def.peso(cx, cy, forma);
          forma.w = r && r[1] > 0 ? [[HUESOS.indexOf(r[0]), r[1]], [0, 1 - r[1]]] : [[0, 1]];
          return forma;
        });
        st.runa = [];
        st.formas.forEach((f, i) => f.g === "runa" && st.runa.push(i));
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
    return (st.pinturas[pal] = st.formas.map((f) => tenir(f.fill, P)));
  }

  // ---------- huesos: el tronco se bambolea desde los pies; los pies pisan el piso y solo se levantan al dar el paso ----------
  const rad = Math.PI / 180;
  const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  function giro(a, x, y) {
    const c = Math.cos(a), s = Math.sin(a);
    return [c, s, -s, c, x - c * x + s * y, y - s * x - c * y];
  }
  function huesos(def, q) {
    const [px, py] = def.pie;
    const torso = mul([q.sx, 0, 0, q.sy, px - q.sx * px + q.dx, py - q.sy * py + q.dy], giro(q.rot || 0, px, py));
    return HUESOS.map((n) => {
      if (n === "torso") return torso;
      const a = def.huesos[n];
      if (!a) return torso;
      if (PIES.includes(n)) return [1, 0, 0, 1, q.dx * 0.3 + (q.paso[n] || 0), -(q.alza[n] || 0)];
      return mul(torso, giro(q[n] || 0, a[0], a[1]));
    });
  }
  const nueva = () => ({ cabeza: 0, brazo: 0, brazoA: 0, brazoL: 0, dx: 0, dy: 0, sx: 1, sy: 1, rot: 0, paso: {}, alza: {} });

  // reposo y andar: respira hondo con el árbol colgando; al andar carga el peso de un pie al otro y el puño acompaña
  function postura(v, t, o) {
    const q = nueva(), sem = o.sem || 0, m = Math.min(2, o.mov || 0);
    q.sy += Math.sin(t * 1.1 + sem) * 0.012;
    q.cabeza = Math.sin(t * 0.45 + sem) * 1.5 * rad;
    q.brazoA = Math.sin(t * 1.1 + sem + 0.8) * 1.2 * rad;
    q.brazo = q.brazoA;
    q.brazoL = -Math.sin(t * 1.1 + sem + 0.5) * 1.5 * rad;
    if (m > 0) {
      const f = t * (2.8 + m) + sem, s = Math.sin(f), c = Math.cos(f), amp = Math.min(1.3, m);
      q.sy += Math.abs(c) * 0.025 * amp;
      q.rot += s * 2.5 * rad * amp;
      q.cabeza -= s * 1.5 * rad * amp;
      if (v === "E") {
        q.paso.pie = s * 90 * amp;
        q.alza.pie = Math.max(0, c) * 40 * amp;
        q.brazo += -s * 5 * rad * amp;
        q.dx += s * 14 * amp;
      } else {
        q.alza.pieI = Math.max(0, s) * 34 * amp;
        q.alza.pieD = Math.max(0, -s) * 34 * amp;
        q.brazoA += s * 3 * rad * amp;
        q.brazoL += s * 6 * rad * amp;
        q.dx += s * 14 * amp;
      }
    }
    return q;
  }

  // ---------- dibujar ----------
  const cal = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  const est = {};
  const IMPACTO = 0.5; // lo que queda el árbol contra el piso después del aplastar
  const MUERTE = 1.1; // en cuánto pasa los seis cuadros de la muerte (después queda tendido)
  function dibujar(c, t, o) {
    const v = o.vista || "S", k = o.sem != null ? o.sem : 0, lado = v === "N" ? null : v;
    let F = est[k];
    if (!F || t < F.t) F = est[k] = { t, golpe: 0, suelta: -9 };
    F.t = t;
    const g = o.golpe || 0, ant = F.golpe, sube = g > 0 && g >= ant;
    F.golpe = g;
    if (g < ant && ant > 0.8) F.suelta = t;
    const dz = t - F.suelta, impacto = dz < IMPACTO ? 1 - dz / IMPACTO : 0;
    const herido = o.herido > 0 ? o.herido * o.herido : 0, b = o.basico || 0, cz = o.cabezazo || 0;
    const ef = { runa: 0.3 + Math.sin(t * 1.2 + k) * 0.1, muere: 0, sube, g };
    let nombre = v, q = null;
    if (o.muere > 0) {
      // la muerte de la lámina, cuadro por cuadro (de espaldas cae como de costado)
      const n = Math.min(6, 1 + Math.floor((o.muere / MUERTE) * 6));
      nombre = "muerte" + (v === "S" ? "S" : "E") + n;
      q = nueva();
      ef.muere = Math.min(1, o.muere / MUERTE);
    } else if (lado && sube && g > 0.12 && cargar("aplastar" + lado).listo) {
      // el aplastar: el árbol en alto con las dos manos; tiembla cuando está por bajar
      nombre = "aplastar" + lado;
      q = nueva();
      q.sy = 1 + 0.03 * g;
      q.dx = g > 0.7 ? Math.sin(t * 40) * 9 : 0;
      ef.runa = Math.max(ef.runa, g);
    } else if (lado && impacto > 0 && cargar("impacto" + lado).listo) {
      // el impacto: el árbol contra el piso; el cuerpo se aplasta con el golpe y se vuelve a parar
      nombre = "impacto" + lado;
      q = nueva();
      q.sy = 1 - 0.06 * impacto;
      q.sx = 1 + 0.03 * impacto;
      ef.runa = Math.max(ef.runa, impacto);
    } else if (lado && cz > 0.05 && cargar("golpe" + lado).listo) {
      // el revés: el barrido del puño
      nombre = "golpe" + lado;
      q = nueva();
      q.dx = (lado === "E" ? 30 : 0) * cz;
    } else if (lado && b > 0.15 && cargar("reves" + lado).listo) {
      // el aviso del revés: el puño cruzado sobre el pecho; tiembla antes de soltarlo
      nombre = "reves" + lado;
      q = nueva();
      q.dx = b > 0.8 ? Math.sin(t * 40) * 6 : 0;
    } else {
      q = postura(v, t, o);
      if (v === "N") {
        // de espaldas no hay pose: se yergue y tiembla con el árbol, se aplasta al bajarlo; el revés con el brazo libre
        if (sube && g > 0) {
          q.sy += 0.06 * g;
          q.sx -= 0.02 * g;
          q.dx += g > 0.7 ? Math.sin(t * 40) * 9 : 0;
          q.brazoA -= 10 * rad * g;
        } else if (impacto > 0) {
          q.sy -= 0.08 * impacto;
          q.sx += 0.04 * impacto;
        }
        if (b > 0) q.brazoL = 14 * rad * Math.min(1, b);
        if (cz > 0) q.brazoL = -18 * rad * cz;
      }
    }
    if (herido > 0 && !(o.muere > 0)) {
      // golpe recibido: se echa atrás y cabecea
      q.dx -= (v === "E" ? 30 : 0) * herido;
      q.rot -= (v === "E" ? 5 : 0) * rad * herido;
      q.sy -= 0.04 * herido;
      q.cabeza -= 8 * rad * herido;
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
    c.ellipse(0, 0, costado ? 62 : 72, 16, 0, 0, Math.PI * 2);
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
    // la runa del pecho: late, se enciende en los avisos y se apaga al morir
    const encender = (col, a, modo) => {
      if (a <= 0.02 || !st.runa.length) return;
      const a0 = c.globalAlpha;
      c.globalAlpha = a0 * Math.min(1, a);
      if (modo) c.globalCompositeOperation = modo;
      c.fillStyle = col;
      for (const i of st.runa) {
        const r = mats[i];
        c.setTransform(r[0], r[1], r[2], r[3], r[4], r[5]);
        c.fill(fs[i].path);
      }
      c.globalCompositeOperation = "source-over";
      c.globalAlpha = a0;
    };
    const vivo = 1 - ef.muere, alta = cal() === "alta", pal = PALETAS[(o.pal || 0) % PALETAS.length];
    const luz = pal ? hslARgb(pal.runa[0], pal.runa[1], 0.6 * pal.runa[2]) : "#73D5DB";
    encender("#F2FCFF", ef.runa * 0.4 * vivo);
    if (alta) encender(luz, ef.runa * 0.5 * vivo, "lighter");
    encender("#2A2624", ef.muere * 1.2);
    c.setTransform(T0);
    if (ef.sube && ef.g > 0.4 && st.grande >= 0 && vivo > 0 && window.DIB) {
      // la runa brilla fuerte justo antes de bajar el árbol
      const f = st.formas[st.grande], r = mats[st.grande], P = c.getTransform().inverse().multiply(new DOMMatrix(r));
      DIB.halo(c, P.e + P.a * f.cx + P.c * f.cy, P.f + P.b * f.cx + P.d * f.cy, 16 + ef.g * 12, luz, (ef.g - 0.4) * 0.9);
    }
    c.restore();
    return true;
  }

  if (window.CRIATURAS) {
    const viejo = CRIATURAS.DIBUJO ? CRIATURAS.DIBUJO.trol : null;
    CRIATURAS.registrar(
      "trol",
      (c, t, o) => {
        if (!dibujar(c, t, o) && viejo) viejo(c, t, o);
      },
      { basicoPropio: true }
    );
  }
  const TODAS = Object.keys(VISTAS);
  // lo de parado primero: las poses y la muerte se piden después
  ["S", "E", "N"].forEach(cargar);
  setTimeout(() => TODAS.forEach(cargar), 400);
  const listo = () => TODAS.every((v) => cargar(v).listo);
  return { dibujar, VISTAS, PALETAS, MUERTE, cargar, listo };
})();
