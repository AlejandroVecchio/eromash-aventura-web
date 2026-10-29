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
    S02: [506.8, 876, 1914],
    S03: [506.6, 882, 1914],
    S04: [506.8, 859, 1914],
    S05: [521.3, 918, 1909],
    S06: [519.6, 878, 1912],
    S07: [518.7, 883, 1913],
    S08: [518.9, 854, 1913],
    S09: [516.2, 864, 1918],
    S10: [516.2, 848, 1918],
    S11: [516.0, 863, 1918],
    S12: [516.0, 876, 1918],
    E01: [513.3, 481, 1927],
    E02: [513.3, 487, 1928],
    E03: [513.7, 536, 1926],
    E04: [514.4, 516, 1925],
    E05: [512.2, 472, 1930],
    E06: [511.8, 466, 1930],
    E07: [512.4, 474, 1929],
    E08: [512.4, 475, 1928],
    E09: [513.7, 499, 1927],
    E10: [513.9, 506, 1925],
    E11: [514.4, 560, 1926],
    E12: [514.2, 512, 1925],
    E13: [514.6, 483, 1924],
    E14: [514.2, 484, 1926],
    E15: [513.5, 479, 1928],
    E16: [513.5, 480, 1927],
    N01: [506.3, 848, 1916],
    N02: [508.3, 829, 1915],
    N03: [507.1, 835, 1914],
    N04: [507.1, 855, 1914],
    N05: [515.9, 851, 1916],
    N06: [515.3, 835, 1917],
    N07: [515.3, 833, 1917],
    N08: [515.5, 837, 1917],
    N09: [515.1, 838, 1918],
    N10: [515.1, 837, 1918],
    N11: [514.9, 810, 1918],
    N12: [515.3, 828, 1917],
  };
  // cada vista: sus cuadros en orden en una vuelta (dos pasos) y dónde queda el punto más alto del cuerpo (pico: en la
  // vuelta de 0 a 2π, sube del todo en pico + π/2 y pico + 3π/2, al pasar la pierna, cuadros 4 y 10)
  const cuadros = (v, n) => Array.from({ length: n || 12 }, (_, i) => v + String(i + 1).padStart(2, "0"));
  const CICLO = {
    S: { cuadros: cuadros("S"), pico: 0.08 * Math.PI },
    N: { cuadros: cuadros("N"), pico: 0.08 * Math.PI },
    // de costado, la lámina de 16 cuadros (29/10/2026): pisa en el 1 y el 9, pasa la pierna en el 5 y el 13
    E: { cuadros: cuadros("E", 16), pico: 0 },
  };
  for (const n in ANDAR) VISTAS[n] = { k: ANDAR[n][0], pie: [ANDAR[n][1], ANDAR[n][2]], huesos: {}, peso: () => null, clip: true, dir: "andar/" };
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
          const forma = { path: new Path2D(d), regla: p.getAttribute("fill-rule") === "evenodd" ? "evenodd" : "nonzero", fill, grad, cx, cy, gris: s < 0.12 && l > 0.3, tono: grupo(h, s, l) };
          // el fondo del cuerpo (la silueta) y lo casi negro (el hueco de la capucha) van con el tronco
          const fondo = forma.regla === "evenodd" || (x1 - x0) * (y1 - y0) > 300000;
          const negro = m && Math.max(+m[1], +m[2], +m[3]) < 34;
          const r = fondo || negro ? null : def.peso(cx, cy, forma);
          forma.w = r && r[1] > 0 ? [[HUESOS.indexOf(r[0]), r[1]], [0, 1 - r[1]]] : [[0, 1]];
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
      return mul(torso, giro(q[n] || 0, a[0], a[1]));
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
      // funde durante el primer tercio del siguiente
      const m = Math.min(2, o.mov), amp = Math.min(1, m), f = t * (5.2 + m * 2.4) + (o.sem || 0);
      const ciclo = CICLO[v], L = ciclo.cuadros.length, cada = (Math.PI * 2) / L;
      const ph = ((f % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2), n = Math.min(L - 1, Math.floor(ph / cada)), fr = (ph - n * cada) / cada;
      const alto = (1 - Math.cos(2 * (ph - ciclo.pico))) / 2;
      nombre = ciclo.cuadros[n];
      q = nueva();
      q.dy = -alto * 30 * amp;
      q.sy = 1 - 0.018 * (1 - alto) * amp;
      q.sx = 1 + 0.01 * (1 - alto) * amp;
      q.rot = (v === "E" ? 2 + Math.sin(2 * ph) * 0.8 : Math.sin(ph) * 1.6) * rad * amp;
      if (fr < 0.35) anda = { antes: ciclo.cuadros[(n + L - 1) % L], a: Math.pow(1 - fr / 0.35, 1.5) };
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
    if (anda && anda.a > 0.02 && cal() !== "baja") fundir(c, anda.antes, q, o, ef, v === "E", anda.a);
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
    let recorte = false;
    for (let i = 0; i < fs.length; i++) {
      const f = fs[i], w = f.w;
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
      if (def.clip && !recorte && f.regla === "evenodd") {
        c.save();
        c.clip(f.path, "evenodd");
        recorte = true;
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
  TODAS.forEach(cargar);
  const listo = () => TODAS.every((v) => cargar(v).listo);
  // para el editor de animación: carga también los cuadros de la caminata y olvida el golpe en curso de una semilla
  const precargar = () => Object.values(CICLO).forEach((ci) => ci.cuadros.forEach(cargar));
  const reiniciar = (k) => delete est[k || 0];
  return { dibujar, VISTAS, PALETAS, cargar, listo, precargar, reiniciar };
})();
