// ---------- El bandido del hacha de los Sin Linde en vectores (módulo BANDIDO) ----------
// La lámina de Alejandro (frente, costado, espalda y el aviso de frente y de costado) pasada a SVG tal cual
// (img/criaturas/bandido/*.svg, vectorizada con Recraft) y animada con huesos: respira con el hacha colgando y el escudo
// al costado, camina con los 12 cuadros de su lámina de caminata en cada vista (andar/), en el aviso entra la pose de la lámina
// agachado tras el escudo con el hacha en alto (tiembla y la linde del escudo se enciende), baja el hachazo en dos
// tiempos con una estela clara, se encoge herido y al morir cae de rodillas. Paletas: trapos rojos de la lámina, piel de
// lobo gris y verde de monte, en el mismo orden que el dibujo viejo (BANDIDOS_DIBUJO.PAL). Se registra en CRIATURAS como
// "bandido"; mientras el SVG carga se ve el dibujo viejo.
window.BANDIDO = (function () {
  "use strict";
  // unidades del mundo por pixel de la lámina (parado mide unos 108 de alto, como el arquero)
  const MUNDO = 0.24;
  const rampa = (u, ancho) => Math.max(0, Math.min(1, u / ancho));
  // cada vista: k = lo que mide su lado largo en pixeles de la lámina, pie = el centro del piso bajo el tronco,
  // huesos = dónde gira cada uno (los pies van con el piso), hacha = el brazo que la lleva, peso(x, y) = a qué hueso va
  // cada forma según su centro (y su color: el hierro del hacha es gris, el mango cuero) y escudo = el centro de la linde pintada en el escudo (se enciende en el aviso)
  const VISTAS = {
    S: {
      k: 508, pie: [910, 1940], hacha: "brazoI",
      huesos: { cabeza: [910, 560], brazoI: [560, 640], brazoD: [1240, 660], pieI: [500, 1800], pieD: [1300, 1800] },
      peso: (x, y) => ((x < 440 && y > 620 && y < 1000) || (x < 330 && y >= 1000 && y < 1560) ? ["brazoI", 1] : (x > 1250 && y > 640 && y < 1460) || (x > 1180 && y > 640 && y < 1150) ? ["brazoD", 1] : y > 1650 && x < 820 ? ["pieI", rampa(y - 1650, 50)] : y > 1650 && x > 1000 ? ["pieD", rampa(y - 1650, 50)] : y < 540 && x > 650 && x < 1200 ? ["cabeza", rampa(540 - y, 60)] : null),
    },
    E: {
      k: 510, pie: [470, 1935], hacha: "brazo",
      huesos: { cabeza: [560, 520], brazo: [420, 640], brazoI: [700, 800], pieI: [330, 1800], pieD: [600, 1800] },
      peso: (x, y, f) => ((f.gris && y > 1250) || (f.tono === "cuero" && x > 250 && x < 760 && y > 1100 && y < 1420) || (x < 470 && y > 930 && y < 1240) ? ["brazo", 1] : x > 680 && y > 560 && y < 1300 ? ["brazoI", rampa(x - 680, 40)] : y > 1640 && x < 460 ? ["pieI", rampa(y - 1640, 50)] : y > 1640 && x >= 460 ? ["pieD", rampa(y - 1640, 50)] : y < 470 ? ["cabeza", rampa(470 - y, 60)] : null),
    },
    N: {
      k: 507, pie: [890, 1935], hacha: "brazoD",
      huesos: { cabeza: [900, 520], brazoI: [540, 640], brazoD: [1160, 640], pieI: [420, 1800], pieD: [1320, 1800] },
      peso: (x, y) => ((x > 1180 && y > 620 && y < 1000) || (x > 1270 && y >= 1000 && y < 1560) ? ["brazoD", 1] : x < 500 && y > 560 && y < 1520 ? ["brazoI", rampa(500 - x, 40)] : y > 1640 && x < 650 ? ["pieI", rampa(y - 1640, 50)] : y > 1640 && x > 1100 ? ["pieD", rampa(y - 1640, 50)] : y < 480 ? ["cabeza", rampa(480 - y, 60)] : null),
    },
    avisoS: {
      k: 540, pie: [1050, 1665], hacha: "hacha", escudo: [1170, 960],
      huesos: { hacha: [660, 640] },
      peso: (x, y) => (x < 720 && y < 620 ? ["hacha", 1] : x < 900 && y < 800 && x > 500 ? ["hacha", rampa(900 - x, 200) * 0.6] : null),
    },
    avisoE: {
      k: 469, pie: [1250, 1925], hacha: "hacha", escudo: [1760, 980],
      huesos: { hacha: [1150, 760] },
      peso: (x, y) => (x < 1050 && y < 680 ? ["hacha", 1] : x < 1250 && y < 900 && y > 600 ? ["hacha", rampa(1250 - x, 250) * 0.6] : null),
    },
  };
  // los cuadros de la caminata (en img/criaturas/bandido/andar/, una lámina de 12 por vista): [k, pie x, pie y], con
  // el pie bajo la capucha a la altura del suelo para que el cuerpo no salte de un cuadro al otro y k ajustado para que
  // mida lo mismo que parado. Los 12 son una vuelta entera en el orden de la lámina: pisa, despega el pie de atrás, pasa
  // la pierna y vuelve a pisar, primero con una pierna y después con la otra. Se recortan con su silueta (clip), así
  // nada que el vectorizador rellenó entre las piernas se ve.
  const ANDAR = {
    S01: [506.6, 896, 1914],
    S02: [506.8, 883, 1914],
    S03: [506.6, 882, 1914],
    S04: [506.8, 854, 1914],
    S05: [521.3, 907, 1909],
    S06: [519.6, 870, 1912],
    S07: [518.7, 882, 1913],
    S08: [518.9, 853, 1913],
    S09: [516.2, 869, 1918],
    S10: [516.2, 855, 1918],
    S11: [516.0, 867, 1918],
    S12: [516.0, 880, 1918],
    E01: [523.3, 1051, 1909],
    E02: [523.6, 809, 1909],
    E03: [523.1, 778, 1910],
    E04: [522.6, 570, 1911],
    E05: [525.3, 999, 1906],
    E06: [525.3, 920, 1906],
    E07: [525.1, 1032, 1907],
    E08: [524.6, 917, 1907],
    E09: [522.6, 949, 1911],
    E10: [522.1, 564, 1911],
    E11: [522.1, 884, 1911],
    E12: [521.4, 919, 1913],
    N01: [506.3, 844, 1916],
    N02: [508.3, 825, 1915],
    N03: [507.1, 836, 1914],
    N04: [507.1, 855, 1914],
    N05: [515.9, 848, 1916],
    N06: [515.3, 834, 1917],
    N07: [515.3, 833, 1917],
    N08: [515.5, 838, 1917],
    N09: [515.1, 836, 1918],
    N10: [515.1, 841, 1918],
    N11: [514.9, 813, 1918],
    N12: [515.3, 832, 1917],
  };
  // cada vista: sus cuadros en orden en una vuelta (dos pasos) y dónde queda el punto más alto del cuerpo (pico: en la
  // vuelta de 0 a 2π, sube del todo en pico + π/2 y pico + 3π/2, al pasar la pierna, cuadros 4 y 10)
  const cuadros = (v) => Array.from({ length: 12 }, (_, i) => v + String(i + 1).padStart(2, "0"));
  const CICLO = {
    S: { cuadros: cuadros("S"), pico: 0.08 * Math.PI },
    N: { cuadros: cuadros("N"), pico: 0.08 * Math.PI },
    E: { cuadros: cuadros("E"), pico: 0.08 * Math.PI },
  };
  // el brazo del hacha en la caminata de costado: en la lámina cada cuadro lo tiene un poco más adelante o más atrás que
  // el anterior (en zigzag) y al pasar de uno a otro saltaba. Cada cuadro sabe dónde tiene la mano y la cabeza del hacha
  // (desde el pie, en unidades del svg) y el hombro es el mismo para todos; el brazo entero (manga, mano, mango y hacha)
  // es un hueso que se gira y se estira apenas desde el hombro hasta la curva suave que pasa por todos los cuadros, así
  // el hacha se mece de forma continua y en el fundido el brazo de los dos cuadros cae en el mismo lugar
  const HOMBRO = [-150, -1230];
  const BRAZO_E = {
    E01: [-441, -793, -162, -454],
    E02: [-308, -787, -60, -454],
    E03: [-377, -790, -124, -464],
    E04: [-269, -777, 3, -488],
    E05: [-406, -799, -158, -448],
    E06: [-348, -747, -64, -403],
    E07: [-245, -720, -25, -437],
    E08: [-345, -778, -36, -455],
    E09: [-307, -853, -70, -502],
    E10: [-222, -812, 44, -522],
    E11: [-413, -842, -123, -499],
    E12: [-404, -824, -110, -497],
  };
  // dónde está de verdad el hacha en cada cuadro: la cabeza del hacha y el mango de cada uno se calzaron contra los del
  // primero (lo que se ve de cada cuadro, pixel a pixel) y de ahí sale su giro (grados) y dónde queda el centro de la
  // cabeza del hacha (desde el pie, en unidades del svg)
  const HACHA_E = {
    E01: [-0.0, -162, -450],
    E02: [-1.8, -41, -442],
    E03: [-2.8, -89, -476],
    E04: [-0.7, 10, -468],
    E05: [2.6, -154, -446],
    E06: [2.7, -68, -395],
    E07: [-5.9, -25, -436],
    E08: [-3.7, -33, -456],
    E09: [-3.1, -55, -491],
    E10: [-3.0, 50, -508],
    E11: [-0.2, -108, -496],
    E12: [-1.1, -108, -492],
  };
  // la curva suave: el promedio más una onda por vuelta (la que mejor pasa por los 12 cuadros) del giro y del lugar
  const suave = (() => {
    const L = 12, nombres = Object.keys(HACHA_E).sort();
    return [0, 1, 2].map((j) => {
      let c0 = 0, c1 = 0, s1 = 0;
      nombres.forEach((n, i) => {
        const x = HACHA_E[n][j], p = ((i + 0.5) * Math.PI * 2) / L;
        c0 += x / L; c1 += (2 * x * Math.cos(p)) / L; s1 += (2 * x * Math.sin(p)) / L;
      });
      return (p) => c0 + c1 * Math.cos(p) + s1 * Math.sin(p);
    });
  })();
  // el arreglo del brazo de un cuadro en ese momento de la vuelta: lo gira y lo corre entero para que su hacha quede
  // donde dice la curva (la matriz va alrededor del hombro, como los demás huesos)
  const brazoDe = (nombre, ph) => {
    const [a, hx, hy] = HACHA_E[nombre], S = HOMBRO, d = (suave[0](ph) - a) * rad;
    const co = Math.cos(d), si = Math.sin(d);
    const rx = S[0] + co * (hx - S[0]) - si * (hy - S[1]), ry = S[1] + si * (hx - S[0]) + co * (hy - S[1]);
    return [co, si, -si, co, suave[1](ph) - rx, suave[2](ph) - ry];
  };
  const cerca = (px, py, ax, ay, bx, by) => {
    const vx = bx - ax, vy = by - ay, u = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy)));
    return Math.hypot(px - ax - u * vx, py - ay - u * vy);
  };
  for (const n in ANDAR) {
    const [k, px, py] = ANDAR[n], br = BRAZO_E[n];
    VISTAS[n] = { k, pie: [px, py], huesos: {}, peso: () => null, clip: true, dir: "andar/" };
    if (!br) continue;
    const S = [px + HOMBRO[0], py + HOMBRO[1]], M = [px + br[0], py + br[1]], G = [px + br[2], py + br[3]];
    const sube = [S[0] + (M[0] - S[0]) * 0.3, S[1] + (M[1] - S[1]) * 0.3], codo = [S[0] + (M[0] - S[0]) * 0.95, S[1] + (M[1] - S[1]) * 0.95];
    // la manga lleva el arreglo de a poco: nada junto al hombro, entero desde la mitad del brazo
    const manga = (x, y) => {
      const vx = M[0] - S[0], vy = M[1] - S[1], u = ((x - S[0]) * vx + (y - S[1]) * vy) / (vx * vx + vy * vy);
      return Math.max(0.05, Math.min(1, (u - 0.25) / 0.4));
    };
    VISTAS[n].huesos.brazo = S;
    VISTAS[n].brazoAndar = true;
    VISTAS[n].peso = (x, y, f) =>
      f.negro
        ? Math.hypot(x - M[0], y - M[1]) < 170 ? ["brazo", 1] : null
        : (f.piel && Math.hypot(x - M[0], y - M[1]) < 140) ||
      (f.gris && Math.hypot(x - G[0], y - G[1]) < 230) ||
      (f.tono === "cuero" && !f.piel && cerca(x, y, 1.6 * M[0] - 0.6 * G[0], 1.6 * M[1] - 0.6 * G[1], G[0], G[1]) < 70) ||
      (f.area < 60000 && cerca(x, y, sube[0], sube[1], codo[0], codo[1]) < 85)
        ? ["brazo", manga(x, y)]
        : null;
  }
  const HUESOS = ["torso", "cabeza", "brazo", "brazoI", "brazoD", "hacha", "pieI", "pieD"];
  const PIES = ["pieI", "pieD"];

  // ---------- paletas: cambian la capucha y la ropa; el cuero, la piel, el escudo y el hacha quedan ----------
  const PALETAS = [
    null, // trapos rojos: la de la lámina
    { capucha: [30, 0.06, 0.95], ropa: [30, 0.6, 0.8] }, // piel de lobo gris
    { capucha: [88, 0.55, 0.9], ropa: [28, 1.6, 1.05] }, // verde de monte
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
    if ((h < 16 || h >= 340) && s > 0.4 && l < 0.62) return "capucha"; // la capucha y la tira de la boca
    if (h >= 40 && h < 110 && s < 0.4 && l < 0.5) return "ropa"; // la túnica y las calzas
    return "cuero";
  }
  function tenir(col, pal) {
    if (!pal) return col;
    const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(col);
    if (!m) return col;
    const [h, s, l] = rgbAHsl(+m[1], +m[2], +m[3]), p = pal[grupo(h, s, l)];
    if (!p) return col;
    return hslARgb(p[0], Math.min(1, s * p[1]), l * p[2]);
  }

  // ---------- carga: cada forma con su Path2D, su color, su regla de relleno y su hueso ----------
  const vistas = {};
  const lienzoGrad = document.createElement("canvas").getContext("2d");
  function cargar(v) {
    if (vistas[v]) return vistas[v];
    const st = (vistas[v] = { listo: false });
    fetch("img/criaturas/bandido/" + (VISTAS[v].dir || "") + v + ".svg")
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
        const def = VISTAS[v];
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
          const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(grad ? grad.stops[0][1] : fill);
          const [h, s, l] = m ? rgbAHsl(+m[1], +m[2], +m[3]) : [0, 0, 0];
          const forma = { path: new Path2D(d), regla: p.getAttribute("fill-rule") === "evenodd" ? "evenodd" : "nonzero", fill, grad, cx, cy, gris: s < 0.12 && l > 0.3, tono: grupo(h, s, l), area: (x1 - x0) * (y1 - y0), piel: h > 15 && h < 35 && s > 0.5 && l > 0.55 };
          // el fondo del cuerpo (la silueta) y lo casi negro (el hueco de la capucha) van con el tronco
          const fondo = forma.regla === "evenodd" || (x1 - x0) * (y1 - y0) > 300000;
          const negro = m && Math.max(+m[1], +m[2], +m[3]) < 34;
          forma.negro = !!negro;
          // lo casi negro va con el tronco, salvo la sombra de la mano en la caminata, que va con el brazo
          const r = fondo || (negro && !def.brazoAndar) ? null : def.peso(cx, cy, forma);
          forma.w = r && r[1] > 0 ? [[HUESOS.indexOf(r[0]), r[1]], [0, 1 - r[1]]] : [[0, 1]];
          // el brazo de la caminata se pinta al final y sin el recorte de la silueta: al girarlo puede salirse de ella
          forma.suelta = !!(def.brazoAndar && r);
          return forma;
        });
        st.pinturas = {};
        st.andar = !!def.clip;
        st.listo = true;
      })
      .catch(() => (st.error = true));
    return st;
  }
  function pinturas(st, pal) {
    if (st.pinturas[pal]) return st.pinturas[pal];
    // la lámina de la caminata tiene la capucha un poco más encendida: con la paleta de la lámina se la baja al rojo de
    // la lámina parada, así no cambia de color al empezar a andar
    const P = PALETAS[pal] || (st.andar ? { capucha: [2, 0.9, 0.9] } : null);
    return (st.pinturas[pal] = st.formas.map((f) => {
      if (!f.grad) return tenir(f.fill, P);
      const [x1, y1, x2, y2] = f.grad.x, g = lienzoGrad.createLinearGradient(x1, y1, x2, y2);
      f.grad.stops.forEach(([o, c]) => g.addColorStop(o, tenir(c, P)));
      return g;
    }));
  }

  // ---------- huesos: el tronco lleva escala, giro y corrimiento desde los pies; los pies pisan el piso ----------
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
      if (PIES.includes(n) && !q.caido) return [1, 0, 0, 1, q.dx * 0.3, 0];
      const m = mul(torso, giro(q[n] || 0, a[0], a[1]));
      if (n !== "brazo" || !q.brazoM) return m;
      // el arreglo del brazo de la caminata, alrededor del hombro
      const [p, r, z, w, tx, ty] = q.brazoM;
      return mul(m, [p, r, z, w, a[0] - p * a[0] - z * a[1] + tx, a[1] - r * a[0] - w * a[1] + ty]);
    });
  }
  const nueva = () => ({ cabeza: 0, brazo: 0, brazoI: 0, brazoD: 0, hacha: 0, dx: 0, dy: 0, sx: 1, sy: 1, rot: 0 });

  // reposo: respira con el hacha colgando de la mano y el escudo al costado, mirando de un lado al otro
  function pose(v, t, o) {
    const q = nueva(), sem = o.sem || 0, h = VISTAS[v].hacha;
    q.sy += Math.sin(t * 1.8 + sem) * 0.008;
    q.cabeza = Math.sin(t * 0.7 + sem) * 2.5 * rad;
    q[h] = Math.sin(t * 1.8 + sem + 0.8) * 1.5 * rad;
    return q;
  }

  // ---------- dibujar ----------
  const cal = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  const est = {};
  // el hachazo: después del aviso el hacha cae desde arriba en la pose de la lámina y el cuerpo sigue el golpe. El ataque
  // básico usa el mismo hachazo, con su aviso más corto (el de combate.js) y la caída más rápida
  const HACHAZO = 0.34, HACHAZO_BASICO = 0.2;
  const CON_HUESOS = /[?&]huesos=1/.test(location.search);
  function dibujar(c, t, o) {
    const v = o.vista || "S", k = o.sem != null ? o.sem : 0;
    let F = est[k];
    if (!F || t < F.t) F = est[k] = { t, golpe: 0, suelta: -9, dur: HACHAZO, basico: false };
    F.t = t;
    const gh = o.golpe || 0, gb = o.basico || 0, g = Math.max(gh, gb), ant = F.golpe, sube = g > 0 && g >= ant;
    F.golpe = g;
    if (g < ant && ant > 0.8) {
      F.suelta = t;
      F.dur = F.basico ? HACHAZO_BASICO : HACHAZO;
    }
    if (g > 0) F.basico = gb > gh;
    const dz = t - F.suelta, baja = dz < F.dur ? 1 - dz / F.dur : 0;
    const muere = Math.min(1, (o.muere || 0) / 0.8), herido = o.herido > 0 ? o.herido * o.herido : 0;
    const ef = { muere, estela: 0, linde: 0 };
    let nombre = v, q, anda = null;
    // el hachazo en dos tiempos: el hacha arranca desde arriba de la lámina y cae; después queda abajo y adelante, como
    // la lleva al andar, con el cuerpo echado sobre el golpe
    const fase = baja > 0 ? 1 - baja : 1, arriba = baja > 0 && fase < 0.3;
    // parado y andando, con huesos (las piezas de su lámina de piezas y la caminata del maniquí)
    // (apagado en el juego hasta que Alejandro apruebe cómo se ve: `?huesos=1` o `o.huesos` lo prenden para probar)
    if ((o.huesos || CON_HUESOS) && !(sube && g > 0.12) && baja <= 0 && !muere && !herido && rigDe(v)) return dibujarHuesos(c, v, t, o);
    if (((sube && g > 0.12) || arriba) && v !== "N" && cargar("aviso" + v).listo) {
      // la pose del aviso de la lámina: se agacha tras el escudo con el hacha en alto; tiembla y al soltar la baja
      nombre = "aviso" + v;
      q = nueva();
      const cae = arriba ? Math.pow(fase / 0.3, 2) : 0, a = sube ? Math.min(1, (g - 0.12) / 0.3) : 1;
      q.sy = 0.96 + 0.04 * a - cae * 0.03;
      q.sx = 1.02 - 0.02 * a;
      q.dx = (g > 0.7 && sube ? Math.sin(t * 40) * 6 : 0) + (v === "E" ? cae * 70 : 0);
      q.hacha = (sube ? Math.sin(t * 36) * 2.5 * rad * a - 8 * rad * a : 0) + (v === "E" ? 95 : -70) * rad * cae;
      ef.linde = sube ? Math.max(0, (g - 0.35) / 0.65) : 1 - cae;
    } else if (o.mov > 0.05 && !muere && !sube && baja <= 0 && CICLO[v].cuadros.every((n) => cargar(n).listo)) {
      // andar: los cuadros de las láminas de la caminata, uno tras otro. Para que no salte de un cuadro al otro,
      // el cuerpo baja y se aplasta apenas al pisar y sube al pasar la pierna de forma continua, y el cuadro anterior se
      // funde con el anterior y el siguiente; cada cuadro está corrido para que el tronco quede en el mismo lugar
      const m = Math.min(2, o.mov), amp = Math.min(1, m), f = t * (5.2 + m * 2.4) + (o.sem || 0);
      const ciclo = CICLO[v], L = ciclo.cuadros.length, cada = (Math.PI * 2) / L;
      const ph = ((f % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2), n = Math.min(L - 1, Math.floor(ph / cada)), fr = (ph - n * cada) / cada;
      const alto = (1 - Math.cos(2 * (ph - ciclo.pico))) / 2;
      nombre = ciclo.cuadros[n];
      q = nueva();
      q.dy = -alto * 22 * amp;
      q.sy = 1 - 0.018 * (1 - alto) * amp;
      q.sx = 1 + 0.01 * (1 - alto) * amp;
      q.rot = (v === "E" ? 2 + Math.sin(2 * ph) * 0.8 : Math.sin(ph) * 1.6) * rad * amp;
      // fundido continuo: en la primera mitad de cada cuadro se va el anterior y en la segunda ya entra el siguiente,
      // los dos a media transparencia en el cambio, así no hay salto
      const u = fr < 0.5 ? fr / 0.5 : (1 - fr) / 0.5, lisa = u * u * (3 - 2 * u);
      anda = { antes: ciclo.cuadros[(n + (fr < 0.5 ? L - 1 : 1)) % L], a: 0.5 * (1 - lisa) };
      if (v === "E") {
        q.brazoM = brazoDe(nombre, ph);
        anda.brazoM = brazoDe(anda.antes, ph);
      }
    } else {
      q = pose(v, t, o);
      if (baja > 0 && v !== "N") {
        // el hacha ya cayó: el cuerpo sigue el golpe hacia adelante, se aplasta y el brazo rebota
        const r = 1 - (fase - 0.3) / 0.7, h = VISTAS[v].hacha;
        q.sy -= 0.07 * r;
        q.sx += 0.04 * r;
        if (v === "E") {
          q.dx += 90 * r;
          q.rot += 7 * rad * r;
          q.brazo -= 25 * rad * r;
        } else q[h] += 22 * rad * r;
        ef.estela = r;
      }
      if (v === "N" && (sube || baja > 0)) {
        // de espaldas no hay pose: levanta el hacha por encima del hombro y la baja
        const a = sube ? g : baja;
        q.brazoD = (sube ? -150 : -150 + 150 * (1 - baja)) * rad * Math.min(1, a * 1.3);
        q.brazoI = 12 * rad * Math.min(1, a * 1.3);
        q.sy += 0.03 * a;
      }
    }
    if (herido > 0) {
      // golpe recibido: se encoge, se echa atrás tras el escudo y cabecea
      q.dx -= (v === "E" ? 40 : 0) * herido;
      q.rot -= (v === "E" ? 7 : 0) * rad * herido;
      q.sy -= 0.05 * herido;
      q.brazoI += 10 * rad * herido;
      q.brazoD -= 10 * rad * herido;
      q.brazo -= 12 * rad * herido;
      q.cabeza -= 12 * rad * herido;
    }
    if (muere > 0) {
      // cae de rodillas: se hunde, se tuerce y el hacha se le va de la mano
      const e = muere * muere;
      q.caido = e > 0.05;
      q.sy -= 0.4 * e;
      q.sx += 0.1 * e;
      q.rot += (v === "E" ? -16 : v === "N" ? 8 : -8) * rad * e;
      q.cabeza += 28 * rad * e;
      q.brazoI -= 16 * rad * e;
      q.brazoD += 22 * rad * e;
      q.brazo += 30 * rad * e;
    }
    const st = cargar(nombre);
    if (!st.listo) return false;
    const hecho = pintar(c, st, VISTAS[nombre], huesos(VISTAS[nombre], q), o, ef, v === "E");
    if (anda && anda.a > 0.02 && cal() !== "baja") {
      // el otro cuadro con su propio arreglo del brazo: los dos brazos caen en el mismo lugar
      const q2 = anda.brazoM ? Object.assign({}, q, { brazoM: anda.brazoM }) : q;
      fundir(c, anda.antes, q2, o, ef, v === "E", anda.a);
    }
    return hecho;
  }
  // el cuadro anterior de la caminata, encima y cada vez más transparente: se pinta entero en un lienzo aparte y se
  // pega con transparencia (pintado directo con globalAlpha se verían las caras de adentro unas a través de otras)
  const lienzoF = document.createElement("canvas"), cf = lienzoF.getContext("2d");
  function fundir(c, nombre, q, o, ef, costado, a) {
    const st = cargar(nombre);
    if (!st.listo) return;
    const T = c.getTransform(), s = Math.min(4, Math.hypot(T.a, T.b)), W = Math.ceil(180 * s), H = Math.ceil(170 * s);
    if (lienzoF.width < W) lienzoF.width = W;
    if (lienzoF.height < H) lienzoF.height = H;
    cf.setTransform(1, 0, 0, 1, 0, 0);
    cf.clearRect(0, 0, W, H);
    cf.setTransform(s, 0, 0, s, 90 * s, 150 * s);
    pintar(cf, st, VISTAS[nombre], huesos(VISTAS[nombre], q), o, Object.assign({}, ef, { sinSombra: true }), costado);
    c.save();
    c.globalAlpha *= a;
    c.drawImage(lienzoF, 0, 0, W, H, -90, -150, 180, 170);
    c.restore();
  }
  function pintar(c, st, def, Ms, o, ef, costado) {
    const cols = pinturas(st, (o.pal || 0) % PALETAS.length);
    const esc = (MUNDO * def.k) / 2048;
    c.save();
    if (!ef.sinSombra) {
      c.fillStyle = "rgba(0,0,0,0.34)";
      c.beginPath();
      c.ellipse(0, 0, costado ? 24 : 28, 7, 0, 0, Math.PI * 2);
      c.fill();
    }
    const T0 = c.getTransform();
    c.scale(esc, esc);
    c.translate(-def.pie[0], -def.pie[1]);
    const B = c.getTransform(), base = [B.a, B.b, B.c, B.d, B.e, B.f];
    const fs = st.formas;
    let recorte = null;
    for (let i = 0; i < fs.length; i++) {
      const f = fs[i], w = f.w;
      // el brazo de la caminata va sin el recorte de la silueta (al moverlo puede salirse de ella), en su lugar de siempre
      if (f.suelta && recorte) c.restore();
      let m;
      if (w.length === 1 || w[0][1] > 0.995) m = Ms[w[0][0]];
      else {
        m = [0, 0, 0, 0, 0, 0];
        for (let j = 0; j < w.length; j++) {
          const n = Ms[w[j][0]], kk = w[j][1];
          for (let z = 0; z < 6; z++) m[z] += n[z] * kk;
        }
      }
      const r = mul(base, m);
      c.setTransform(r[0], r[1], r[2], r[3], r[4], r[5]);
      c.fillStyle = cols[i];
      c.fill(f.path, f.regla);
      if (def.clip && !recorte && f.regla === "evenodd") recorte = { path: f.path, m: r };
      if (recorte && (f.path === recorte.path || f.suelta)) {
        c.save();
        c.setTransform(recorte.m[0], recorte.m[1], recorte.m[2], recorte.m[3], recorte.m[4], recorte.m[5]);
        c.clip(recorte.path, "evenodd");
      }
    }
    if (recorte) c.restore();
    c.setTransform(T0);
    const vivo = 1 - ef.muere;
    if (def.escudo && ef.linde > 0.05 && vivo > 0) {
      // la linde del escudo se enciende mientras levanta el hacha: avisa que el golpe está por caer
      const r = mul(base, Ms[0]), P = c.getTransform().inverse().multiply(new DOMMatrix(r));
      const [x, y] = [P.e + P.a * def.escudo[0] + P.c * def.escudo[1], P.f + P.b * def.escudo[0] + P.d * def.escudo[1]];
      DIB.halo(c, x, y, 12 + ef.linde * 8, "#FFD98A", ef.linde * (cal() === "baja" ? 0.35 : 0.6));
    }
    if (ef.estela > 0.35 && vivo > 0) {
      // la estela del hachazo: una media luna clara de arriba hacia adelante y abajo
      const a = (ef.estela - 0.35) / 0.65, [x, y, r, a0, a1] = costado ? [10, -56, 50, -1.9, 0.9] : [-14, -55, 46, -2, -3.7];
      c.globalAlpha = a * 0.55;
      c.fillStyle = "#F2ECEC";
      c.beginPath();
      c.arc(x, y, r, a0, a1, a1 < a0);
      c.arc(x + (costado ? -10 : 8), y + 4, r * 0.82, a1, a0, a1 >= a0);
      c.fill();
      c.globalAlpha = 1;
    }
    c.restore();
    return true;
  }

  // ---------- con huesos: las piezas de su lámina de piezas (ESQUELETO + las animaciones de HUMANO) ----------
  // La lámina de piezas de Alejandro (29/10/2026: capucha, tronco, brazo, antebrazo y mano de cada lado, muslo, pierna y
  // bota de cada lado, hacha y escudo, de frente, de costado y de espaldas) pasada a vector con Recraft en
  // img/criaturas/bandido/piezas.svg: cada forma dice de qué pieza es (data-p = vista.pieza). Cada pieza se pega a su
  // hueso de HUMANO y el bandido se mueve con las mismas animaciones que se editan en esqueleto.html (Personaje →
  // Bandido). Los miembros se enderezan con el ángulo con que están dibujados, así con giro 0 cuelgan derechos.
  // PIEZAS: en pixeles de la lámina (3548 × 1774). Miembros: [x, y] de arriba (hombro, codo, muñeca, cadera, rodilla) y
  // [x, y] de abajo; botas: [x, y] del tobillo y la suela de punta a punta; capucha, tronco, hacha y escudo: su caja
  // [x, y, ancho, alto] y el punto de arriba y el de abajo.
  const PIEZAS = {
    S: {
      capucha: [76, 180, 312, 336, 238, 193, 220, 503],
      tronco: [440, 154, 228, 330, 552, 183, 555, 423],
      brazoD: [774, 212, 766, 438],
      antebrazoD: [933, 243, 915, 462],
      manoD: [1070, 340, 1066, 420],
      brazoI: [1242, 209, 1220, 438],
      antebrazoI: [1391, 244, 1380, 462],
      manoI: [1530, 339, 1535, 431],
      musloD: [1744, 204, 1707, 485],
      piernaD: [1909, 212, 1889, 468],
      pieD: [2074, 432, 2004, 515, 2114, 515],
      musloI: [2258, 204, 2258, 496],
      piernaI: [2444, 208, 2436, 472],
      pieI: [2618, 433, 2571, 515, 2682, 515],
      hacha: [2908, 178, 164, 320, 3022, 193, 3052, 482],
      escudo: [3120, 144, 350, 402, 3308, 182, 3295, 506]
    },
    E: {
      capucha: [50, 660, 336, 286, 218, 693, 308, 929],
      tronco: [452, 682, 196, 328, 540, 709, 574, 953],
      brazoD: [776, 715, 803, 952],
      antebrazoD: [960, 749, 970, 975],
      manoD: [1112, 840, 1113, 921],
      brazoI: [1299, 714, 1318, 951],
      antebrazoI: [1483, 749, 1483, 976],
      manoI: [1640, 839, 1652, 924],
      musloD: [1809, 716, 1809, 1006],
      piernaD: [1986, 730, 1982, 976],
      pieD: [2178, 943, 2209, 1025, 2293, 1025],
      musloI: [2442, 719, 2443, 1009],
      piernaI: [2631, 734, 2629, 978],
      pieI: [2828, 944, 2805, 1025, 2943, 1025],
      hacha: [3136, 680, 144, 330, 3260, 696, 3246, 993],
      escudo: [3350, 682, 94, 364, 3401, 697, 3400, 1029]
    },
    N: {
      capucha: [66, 1182, 304, 330, 228, 1193, 206, 1500],
      tronco: [434, 1182, 234, 324, 551, 1220, 550, 1439],
      brazoD: [788, 1236, 790, 1465],
      antebrazoD: [954, 1268, 952, 1490],
      manoD: [1100, 1367, 1100, 1447],
      brazoI: [1259, 1235, 1259, 1465],
      antebrazoI: [1422, 1268, 1418, 1487],
      manoI: [1567, 1365, 1571, 1454],
      musloD: [1743, 1231, 1752, 1530],
      piernaD: [1915, 1238, 1908, 1501],
      pieD: [2081, 1465, 2031, 1547, 2126, 1547],
      musloI: [2269, 1230, 2268, 1529],
      piernaI: [2457, 1238, 2448, 1496],
      pieI: [2628, 1464, 2582, 1547, 2678, 1547],
      hacha: [2964, 1204, 142, 330, 2990, 1223, 2984, 1518],
      escudo: [3128, 1178, 364, 398, 3316, 1213, 3304, 1531]
    }
  };
  // dónde se pega cada cosa al tronco y la capucha al cuello (pixeles de la lámina, medido a ojo sobre cada pieza)
  const ANCLAS = {
    S: { cuello: [552, 180], hombroD: [468, 205], hombroI: [636, 205], caderaD: [505, 420], caderaI: [600, 420], capucha: [220, 440] },
    E: { cuello: [560, 690], hombroD: [547, 745], hombroI: [540, 742], caderaD: [552, 930], caderaI: [545, 930], capucha: [290, 860] },
    N: { cuello: [550, 1185], hombroD: [632, 1235], hombroI: [470, 1235], caderaD: [600, 1440], caderaI: [500, 1440], capucha: [216, 1420] },
  };
  // el orden de cada pieza (z) en cada vista: de costado lo del lado de atrás primero, y lo de atrás un poco más oscuro
  const ORDEN = {
    S: { musloD: 2, piernaD: 2.1, pieD: 2.2, musloI: 2, piernaI: 2.1, pieI: 2.2, tronco: 4, brazoD: 5, antebrazoD: 5.1, hacha: 5.15, manoD: 5.2, brazoI: 5, antebrazoI: 5.1, manoI: 5.2, capucha: 6, escudo: 7 },
    E: { brazoI: 1, antebrazoI: 1.1, manoI: 1.2, musloI: 2, piernaI: 2.1, pieI: 2.2, musloD: 3, piernaD: 3.1, pieD: 3.2, tronco: 4, capucha: 5, escudo: 6, brazoD: 7, antebrazoD: 7.1, hacha: 7.15, manoD: 7.2 },
    N: { escudo: 0.5, musloD: 2, piernaD: 2.1, pieD: 2.2, musloI: 2, piernaI: 2.1, pieI: 2.2, tronco: 4, hacha: 4.45, brazoD: 4.5, antebrazoD: 4.6, manoD: 4.7, brazoI: 4.5, antebrazoI: 4.6, manoI: 4.7, capucha: 6 },
  };
  const ATRAS = { E: { brazoI: 0.22, antebrazoI: 0.22, manoI: 0.22, musloI: 0.22, piernaI: 0.22, pieI: 0.22 } };
  const ESC_P = 0.095;
  const lamP = { listo: false };
  function cargarPiezas() {
    if (lamP.pedido) return lamP;
    lamP.pedido = true;
    fetch("img/criaturas/bandido/piezas.svg")
      .then((r) => r.text())
      .then((txt) => {
        const doc = new DOMParser().parseFromString(txt, "image/svg+xml");
        const grads = {};
        doc.querySelectorAll("linearGradient").forEach((g) => {
          grads[g.id] = { x: ["x1", "y1", "x2", "y2"].map((k) => +g.getAttribute(k)), stops: [...g.querySelectorAll("stop")].map((s) => [+s.getAttribute("offset"), s.getAttribute("stop-color")]) };
        });
        lamP.formas = [...doc.querySelectorAll("path")].map((p) => {
          const fill = p.getAttribute("fill") || "#000", gr = /url\(#(.+)\)/.exec(fill);
          return { pieza: p.getAttribute("data-p"), path: new Path2D(p.getAttribute("d")), regla: p.getAttribute("fill-rule") === "evenodd" ? "evenodd" : "nonzero", fill, grad: gr ? grads[gr[1]] : null };
        });
        lamP.pinturas = {};
        lamP.listo = true;
      })
      .catch(() => (lamP.error = true));
    return lamP;
  }
  const rigs = {};
  function rigDe(v) {
    if (rigs[v]) return rigs[v];
    const st = cargarPiezas();
    if (!st.listo || !window.ESQUELETO || !window.HUMANO || !PIEZAS[v]) return null;
    const P = PIEZAS[v], A = ANCLAS[v], k = ESC_P;
    const largo = (q) => Math.hypot(q[2] - q[0], q[3] - q[1]) * k;
    const ang = (q) => Math.atan2(-(q[2] - q[0]), q[3] - q[1]);
    const mitad = [(A.caderaD[0] + A.caderaI[0]) / 2, (A.caderaD[1] + A.caderaI[1]) / 2];
    const rel = (q, b) => [(q[0] - b[0]) * k, (q[1] - b[1]) * k];
    const cue = rel(A.cuello, mitad);
    const huesos = [
      { id: "cadera", x: 0, y: 0, punta: [0, 0] },
      { id: "tronco", padre: "cadera", x: 0, y: 0, punta: cue },
      { id: "cabeza", padre: "tronco", x: cue[0], y: cue[1], punta: [0, -20] },
    ];
    for (const l of ["D", "I"]) {
      const h = rel(A["hombro" + l], mitad), c = rel(A["cadera" + l], mitad), pie = P["pie" + l], tob = [pie[0], pie[1]];
      huesos.push(
        { id: "brazo" + l, padre: "tronco", x: h[0], y: h[1], punta: [0, largo(P["brazo" + l])] },
        { id: "antebrazo" + l, padre: "brazo" + l, x: 0, y: largo(P["brazo" + l]), punta: [0, largo(P["antebrazo" + l])] },
        { id: "mano" + l, padre: "antebrazo" + l, x: 0, y: largo(P["antebrazo" + l]), punta: [0, largo(P["mano" + l])] },
        { id: "muslo" + l, padre: "cadera", x: c[0], y: c[1], punta: [0, largo(P["muslo" + l])] },
        { id: "pierna" + l, padre: "muslo" + l, x: 0, y: largo(P["muslo" + l]), punta: [0, largo(P["pierna" + l])] },
        { id: "pie" + l, padre: "pierna" + l, x: 0, y: largo(P["pierna" + l]), punta: rel([pie[4], pie[5]], tob), suela: [rel([pie[2], pie[3]], tob), rel([pie[4], pie[5]], tob)] },
      );
    }
    huesos.push(
      { id: "hacha", padre: "manoD", x: 0, y: largo(P.manoD) * 0.55, punta: [0, 20] },
      { id: "escudo", padre: "manoI", x: 0, y: largo(P.manoI) * 0.45, punta: [0, 0], derecho: true },
    );
    // cada pieza: sus formas, su punto de giro en la lámina, el giro que la endereza y si va dada vuelta
    const pieza = (id, hueso, centro, giro, voltea) => {
      const cuales = [];
      st.formas.forEach((f, i) => f.pieza === v + "." + id && cuales.push(i));
      const osc = (ATRAS[v] || {})[id] || 0;
      return {
        hueso, z: ORDEN[v][id],
        pintar(c, op) {
          const cols = pinturasP((op.pal || 0) % PALETAS.length);
          c.scale(k, k * (voltea ? -1 : 1));
          c.rotate(giro);
          c.translate(-centro[0], -centro[1]);
          for (const i of cuales) {
            const f = st.formas[i];
            c.fillStyle = cols[i];
            c.fill(f.path, f.regla);
            if (osc) {
              c.fillStyle = "rgba(17,17,17," + osc + ")";
              c.fill(f.path, f.regla);
            }
          }
        },
      };
    };
    const piezas = [pieza("tronco", "tronco", mitad, 0), pieza("capucha", "cabeza", A.capucha, 0)];
    for (const l of ["D", "I"]) {
      for (const m of ["brazo", "antebrazo", "mano", "muslo", "pierna"]) {
        const q = P[m + l];
        piezas.push(pieza(m + l, m + l, [q[0], q[1]], -ang(q)));
      }
      piezas.push(pieza("pie" + l, "pie" + l, [P["pie" + l][0], P["pie" + l][1]], 0));
    }
    // el hacha cuelga de la mano con la cabeza abajo (de costado girada, así el filo va adelante); se toma cerca del
    // final del mango. El escudo, de su centro
    const H = P.hacha, agarre = [H[6] + (H[4] - H[6]) * 0.14, H[7] + (H[5] - H[7]) * 0.14];
    piezas.push(v === "E" ? pieza("hacha", "hacha", agarre, Math.PI) : pieza("hacha", "hacha", agarre, 0, true));
    const S = P.escudo;
    piezas.push(pieza("escudo", "escudo", [S[0] + S[2] / 2, S[1] + S[3] / 2], 0));
    return (rigs[v] = { huesos, piezas, pies: ["pieD", "pieI"] });
  }
  function pinturasP(pal) {
    const st = lamP;
    if (st.pinturas[pal]) return st.pinturas[pal];
    const P = PALETAS[pal];
    return (st.pinturas[pal] = st.formas.map((f) => {
      if (!f.grad) return tenir(f.fill, P);
      const [x1, y1, x2, y2] = f.grad.x, g = lienzoGrad.createLinearGradient(x1, y1, x2, y2);
      f.grad.stops.forEach(([o, c]) => g.addColorStop(o, tenir(c, P)));
      return g;
    }));
  }
  // la pose: las animaciones de HUMANO (las mismas que se editan en esqueleto.html): parado el reposo y, andando, la
  // caminata del maniquí (y la carrera al ir rápido) mezclada según cuánto se mueve
  function poseDe(v, t, o) {
    const sem = o.sem || 0, A = HUMANO.ANIMS, R = A.reposo;
    const quieto = ESQUELETO.muestra(R, v, ((((t + sem) / R.dur) % 1) + 1) % 1);
    const m = Math.min(2, o.mov || 0);
    if (m <= 0.05) return quieto;
    const f = t * (5.2 + m * 2.4) + sem, u = (((f / (Math.PI * 2)) % 1) + 1) % 1;
    let anda = ESQUELETO.muestra(A.andar, v, u);
    if (m > 1) anda = ESQUELETO.mezclar(anda, ESQUELETO.muestra(A.correr, v, u), Math.min(1, m - 1));
    return ESQUELETO.mezclar(quieto, anda, Math.min(1, m / 0.6));
  }
  function dibujarHuesos(c, v, t, o) {
    const esq = rigDe(v);
    if (!esq) return false;
    ESQUELETO.dibujar(c, esq, poseDe(v, t, o), { pal: o.pal, sombraAncho: v === "E" ? 24 : 28 });
    return true;
  }

  if (window.CRIATURAS) {
    const viejo = CRIATURAS.DIBUJO ? CRIATURAS.DIBUJO.bandido : null;
    CRIATURAS.registrar(
      "bandido",
      (c, t, o) => {
        if (!dibujar(c, t, o) && viejo) viejo(c, t, o);
      },
      { basicoPropio: true },
    );
  }
  const TODAS = Object.keys(VISTAS);
  cargarPiezas();
  TODAS.forEach(cargar);
  const listo = () => TODAS.every((v) => cargar(v).listo);
  // para el editor de animación: carga también los cuadros de la caminata y olvida el golpe en curso de una semilla
  const precargar = () => Object.values(CICLO).forEach((ci) => ci.cuadros.forEach(cargar));
  const reiniciar = (k) => delete est[k || 0];
  return { dibujar, VISTAS, PALETAS, cargar, listo, precargar, reiniciar, rigDe, poseDe };
})();
