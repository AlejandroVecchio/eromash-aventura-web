// ---------- El arquero de los Sin Linde en vectores (módulo ARQUERO) ----------
// La lámina de Alejandro (frente, costado, espalda y el tiro de frente y de costado) pasada a SVG tal cual
// (img/criaturas/arquero/*.svg, vectorizada con Recraft) y animada con huesos: respira con el arco colgando de la mano,
// anda liviano con la capucha meciéndose, en el aviso entra la pose de la lámina con el arco tenso (la cuerda tiembla y
// la punta de la flecha brilla), al soltar el cuerpo retrocede, la flecha sale con una estela y la mano vuelve, se
// encoge herido y al morir cae de rodillas. La forma de fondo de cada vista es la silueta de la figura con sus huecos
// (entre el arco y la cuerda se ve el piso). Paletas: trapos rojos de la lámina, piel de lobo gris y verde de monte,
// en el mismo orden que el dibujo viejo (BANDIDOS_DIBUJO.PAL). Se registra en CRIATURAS como "arquero"; mientras el SVG
// carga se ve el dibujo viejo.
window.ARQUERO = (function () {
  "use strict";
  // unidades del mundo por pixel de la lámina (parado mide unos 108 de alto)
  const MUNDO = 0.24;
  const rampa = (u, ancho) => Math.max(0, Math.min(1, u / ancho));
  // cada vista: k = lo que mide su lado largo en pixeles de la lámina, pie = el centro del piso, centro = el cuerpo,
  // huesos = dónde gira cada uno (los pies van con el piso), arco = el brazo que lo lleva, peso(x, y) = a qué hueso va
  // cada forma según su centro y flecha(f) = las formas de la flecha cargada (se esconden al soltarla)
  const VISTAS = {
    S: {
      k: 507, pie: [450, 1900], centro: [460, 1000], arco: "brazoD",
      huesos: { cabeza: [460, 560], brazoI: [280, 650], brazoD: [640, 650], pieI: [190, 1800], pieD: [700, 1800] },
      peso: (x, y) => (x > 700 && y > 560 && y < 1450 ? ["brazoD", 1] : x > 620 && y > 620 && y < 1000 ? ["brazoD", rampa(x - 620, 60)] : x < 270 && y > 820 && y < 1300 ? ["brazoI", 1] : y > 1600 && x < 400 ? ["pieI", rampa(y - 1600, 50)] : y > 1600 && x > 520 ? ["pieD", rampa(y - 1600, 50)] : y < 520 && x > 300 && x < 640 ? ["cabeza", rampa(520 - y, 60)] : null),
    },
    E: {
      k: 512, pie: [490, 1940], centro: [460, 1000], arco: "brazoD",
      huesos: { cabeza: [520, 520], brazoI: [400, 620], brazoD: [600, 620], pieI: [300, 1820], pieD: [620, 1820] },
      peso: (x, y) => (x > 650 && y > 440 && y < 1350 ? ["brazoD", 1] : x > 280 && x < 500 && y > 880 && y < 1230 ? ["brazoI", 1] : y > 1620 && x < 480 ? ["pieI", rampa(y - 1620, 50)] : y > 1620 && x >= 480 ? ["pieD", rampa(y - 1620, 50)] : y < 470 && x > 230 ? ["cabeza", rampa(470 - y, 50)] : null),
    },
    N: {
      k: 507, pie: [550, 1940], centro: [700, 1000], arco: "brazoI",
      huesos: { cabeza: [700, 560], brazoI: [450, 620], brazoD: [1080, 640], pieI: [250, 1820], pieD: [850, 1820] },
      peso: (x, y) => (x < 390 && y > 420 && y < 1450 ? ["brazoI", 1] : x > 780 && y > 820 && y < 1300 ? ["brazoD", 1] : y > 1620 && x < 450 ? ["pieI", rampa(y - 1620, 50)] : y > 1620 && x > 650 ? ["pieD", rampa(y - 1620, 50)] : y < 470 && x < 1150 ? ["cabeza", rampa(470 - y, 60)] : null),
    },
    avisoS: {
      k: 511, pie: [520, 1880], centro: [520, 900], arco: "arco",
      huesos: { arco: [600, 760] },
      peso: () => null,
      flecha: (f) => f.cx > 560 && f.cx < 780 && f.cy > 600 && f.cy < 800 && (f.gris || (f.claro && f.ancho < 160 && f.alto < 120)),
      punta: [700, 700],
    },
    avisoE: {
      k: 535, pie: [470, 1760], centro: [600, 800], arco: "arco",
      huesos: { arco: [600, 600] },
      peso: () => null,
      flecha: (f) => (f.claro && f.ancho > 800 && f.cy > 520 && f.cy < 700) || (f.negro && f.alto < 30 && f.cx > 1300 && f.cy > 580 && f.cy < 625),
      punta: [1960, 600],
    },
  };
  // los cuadros de la caminata (la segunda lámina: 4 por vista, pie derecho adelante, pierna derecha pasando, pie
  // izquierdo adelante, pierna izquierda pasando), en img/criaturas/arquero/andar/: [k, pie x, pie y], con el pie
  // en el centro del tronco a la altura del suelo para que el cuerpo no salte de un cuadro al otro. Se recortan con su
  // silueta (clip), así lo que el vectorizador rellenó entre el arco y la cuerda no se ve.
  const ANDAR = {
    S1: [511.7, 680, 1930],
    S2: [513.0, 679, 1930],
    S3: [511.7, 679, 1930],
    S4: [514.3, 637, 1930],
    E1: [512.6, 766, 1928],
    E2: [507.4, 534, 1927],
    E3: [511.3, 778, 1928],
    E4: [510.0, 538, 1928],
    N1: [509.0, 696, 1934],
    N2: [505.3, 673, 1933],
    N3: [507.8, 687, 1934],
    N4: [507.8, 682, 1934]
  };
  // de frente los cuadros de la lámina, en su orden, se ven caminar hacia atrás: van al revés
  const ORDEN_ANDAR = { S: [1, 4, 3, 2] };
  for (const n in ANDAR) VISTAS[n] = { k: ANDAR[n][0], pie: [ANDAR[n][1], ANDAR[n][2]], huesos: {}, peso: () => null, clip: true, dir: "andar/" };
  const HUESOS = ["torso", "cabeza", "brazoI", "brazoD", "arco", "pieI", "pieD"];
  const PIES = ["pieI", "pieD"];

  // ---------- paletas: cambian la capucha y la ropa; el cuero, la piel y el arco quedan ----------
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
    fetch("img/criaturas/arquero/" + (VISTAS[v].dir || "") + v + ".svg")
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
          const [, s, l] = m ? rgbAHsl(+m[1], +m[2], +m[3]) : [0, 0, 0];
          const forma = { path: new Path2D(d), regla: p.getAttribute("fill-rule") === "evenodd" ? "evenodd" : "nonzero", fill, grad, cx, cy, ancho: x1 - x0, alto: y1 - y0, gris: s < 0.12 && l > 0.55, claro: l > 0.8, negro: l < 0.07 };
          // el fondo del cuerpo (la silueta) y lo casi negro (el hueco de la capucha) van con el tronco
          const fondo = forma.regla === "evenodd" || (x1 - x0) * (y1 - y0) > 300000;
          const negro = m && Math.max(+m[1], +m[2], +m[3]) < 34;
          const r = fondo || negro ? null : def.peso(cx, cy);
          forma.w = r && r[1] > 0 ? [[HUESOS.indexOf(r[0]), r[1]], [0, 1 - r[1]]] : [[0, 1]];
          forma.flecha = def.flecha ? !!def.flecha(forma) : false;
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
      if (PIES.includes(n) && !q.caido) return [1, 0, 0, 1, q.dx * 0.3 + (q.paso[n] || 0), -(q.alza[n] || 0)];
      return mul(torso, giro(q[n] || 0, a[0], a[1]));
    });
  }
  const nueva = () => ({ cabeza: 0, brazoI: 0, brazoD: 0, arco: 0, dx: 0, dy: 0, sx: 1, sy: 1, rot: 0, paso: {}, alza: {} });

  // reposo y andar: respira con el arco colgando; al andar va liviano, en puntas, y la capucha se mece
  function pose(v, t, o) {
    const q = nueva(), sem = o.sem || 0, m = Math.min(2, o.mov || 0), costado = v === "E", h = VISTAS[v].arco;
    q.sy += Math.sin(t * 1.8 + sem) * 0.008;
    q.cabeza = Math.sin(t * 0.7 + sem) * 2.5 * rad;
    q[h] = Math.sin(t * 1.8 + sem + 0.8) * 1.5 * rad;
    if (m > 0) {
      const f = t * (4.4 + m * 1.4) + sem, s = Math.sin(f), c = Math.cos(f), amp = Math.min(1.3, m);
      q.sy += Math.abs(c) * 0.025 * amp;
      q.rot += s * 1.5 * rad * amp;
      q.cabeza += -s * 3 * rad * amp;
      // mientras no haya cuadros de andar de la lámina, el cuerpo se mece entero (nada se despega)
      q.dx += s * (costado ? 6 : 4) * amp;
      q.rot += s * (costado ? 1.5 : 1) * rad * amp;
    }
    return q;
  }

  // ---------- dibujar ----------
  const cal = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  const est = {};
  // el tiro: al soltar, la pose del aviso sigue un instante sin la flecha, con el cuerpo echado atrás por la cuerda
  const TIRO = 0.3;
  function dibujar(c, t, o) {
    const v = o.vista || "S", k = o.sem != null ? o.sem : 0;
    let F = est[k];
    if (!F || t < F.t) F = est[k] = { t, golpe: 0, suelta: -9 };
    F.t = t;
    const g = o.golpe || 0, ant = F.golpe, sube = g > 0 && g >= ant;
    F.golpe = g;
    if (g < ant && ant > 0.8) F.suelta = t;
    const dz = t - F.suelta, tiro = dz < TIRO ? 1 - dz / TIRO : 0;
    const muere = Math.min(1, (o.muere || 0) / 0.8), herido = o.herido > 0 ? o.herido * o.herido : 0;
    const ef = { muere, punta: 0, estela: 0, sinFlecha: false };
    let nombre = v, q, anda = null;
    if (((sube && g > 0.12) || tiro > 0) && v !== "N" && cargar("aviso" + v).listo) {
      // la pose del tiro de la lámina: entra agachándose, tensa (la mano tiembla) y al soltar retrocede
      nombre = "aviso" + v;
      q = nueva();
      const a = sube ? Math.min(1, (g - 0.12) / 0.3) : 1;
      q.sy = 0.96 + 0.04 * a;
      q.sx = 1.02 - 0.02 * a;
      if (sube) {
        q.arco = g > 0.6 ? Math.sin(t * 46) * 0.6 * rad * (g - 0.6) * 2.5 : 0;
        q.dx = g > 0.75 ? Math.sin(t * 38) * 3 : 0;
        ef.punta = Math.max(0, (g - 0.4) / 0.6);
      } else {
        // el retroceso: el cuerpo va atrás y el arco se levanta un poco
        const r = tiro * tiro;
        q.dx = (v === "E" ? -50 : 0) * r;
        q.dy = (v === "E" ? 0 : -14) * r;
        q.arco = (v === "E" ? -6 : 0) * rad * r;
        q.sy -= 0.03 * r;
        ef.sinFlecha = true;
        ef.estela = tiro;
      }
    } else if (o.mov > 0.05 && !muere && !sube && cargar(v + "4").listo && cargar(v + "1").listo) {
      // andar: los cuatro cuadros de la lámina de la caminata, uno tras otro. Para que no salte de un cuadro al otro,
      // el cuerpo baja y se aplasta apenas al pisar y sube al pasar la pierna de forma continua, y el cuadro anterior se
      // funde durante el primer 40 % del siguiente
      const m = Math.min(2, o.mov), amp = Math.min(1, m), f = t * (5.2 + m * 2.4) + (o.sem || 0);
      const ph = ((f % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2), n = Math.min(3, Math.floor(ph / (Math.PI / 2))), fr = (ph - (n * Math.PI) / 2) / (Math.PI / 2);
      const alto = (1 - Math.cos(2 * (ph - Math.PI / 4))) / 2;
      const orden = ORDEN_ANDAR[v] || [1, 2, 3, 4];
      nombre = v + orden[n];
      q = nueva();
      q.dy = -alto * 34 * amp;
      q.sy = 1 - 0.018 * (1 - alto) * amp;
      q.sx = 1 + 0.01 * (1 - alto) * amp;
      q.rot = (v === "E" ? 2 + Math.sin(2 * ph) * 0.8 : Math.sin(ph) * 1.6) * rad * amp;
      if (fr < 0.35) anda = { antes: v + orden[(n + 3) % 4], a: Math.pow(1 - fr / 0.35, 1.5) };
    } else {
      q = pose(v, t, o);
      if (v === "N" && (sube || tiro > 0)) {
        // de espaldas no hay pose: levanta el arco al frente y tira
        const a = sube ? g : tiro;
        q.brazoI = 35 * rad * Math.min(1, a * 1.4);
        q.brazoD = -40 * rad * Math.min(1, a * 1.4);
        q.sy -= 0.03 * a;
      }
    }
    if (herido > 0) {
      // golpe recibido: se encoge, se echa atrás y cabecea
      q.dx -= (v === "E" ? 40 : 0) * herido;
      q.rot -= (v === "E" ? 7 : 0) * rad * herido;
      q.sy -= 0.05 * herido;
      q.brazoI += 10 * rad * herido;
      q.brazoD -= 10 * rad * herido;
      q.cabeza -= 12 * rad * herido;
    }
    if (muere > 0) {
      // cae de rodillas: se hunde, se tuerce y el arco se le va de la mano
      const e = muere * muere;
      q.caido = e > 0.05;
      q.sy -= 0.4 * e;
      q.sx += 0.1 * e;
      q.rot += (v === "E" ? -16 : v === "N" ? 8 : -8) * rad * e;
      q.cabeza += 28 * rad * e;
      q.brazoI -= 16 * rad * e;
      q.brazoD += 22 * rad * e;
    }
    const st = cargar(nombre);
    if (!st.listo) return false;
    const hecho = pintar(c, st, VISTAS[nombre], huesos(VISTAS[nombre], q), o, ef, v === "E", t);
    if (anda && anda.a > 0.02 && cal() !== "baja") fundir(c, anda.antes, q, o, ef, v === "E", t, anda.a);
    return hecho;
  }
  // el cuadro anterior de la caminata, encima y cada vez más transparente: se pinta entero en un lienzo aparte y se
  // pega con transparencia (pintado directo con globalAlpha se verían las caras de adentro unas a través de otras)
  const lienzoF = document.createElement("canvas"), cf = lienzoF.getContext("2d");
  function fundir(c, nombre, q, o, ef, costado, t, a) {
    const st = cargar(nombre);
    if (!st.listo) return;
    const T = c.getTransform(), s = Math.min(4, Math.hypot(T.a, T.b)), W = Math.ceil(180 * s), H = Math.ceil(170 * s);
    if (lienzoF.width < W) lienzoF.width = W;
    if (lienzoF.height < H) lienzoF.height = H;
    cf.setTransform(1, 0, 0, 1, 0, 0);
    cf.clearRect(0, 0, W, H);
    cf.setTransform(s, 0, 0, s, 90 * s, 150 * s);
    pintar(cf, st, VISTAS[nombre], huesos(VISTAS[nombre], q), o, Object.assign({}, ef, { sinSombra: true }), costado, t);
    c.save();
    c.globalAlpha *= a;
    c.drawImage(lienzoF, 0, 0, W, H, -90, -150, 180, 170);
    c.restore();
  }
  function pintar(c, st, def, Ms, o, ef, costado, t) {
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
    let Mpunta = null, recorte = false;
    for (let i = 0; i < fs.length; i++) {
      const f = fs[i], w = f.w;
      if (ef.sinFlecha && f.flecha) continue;
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
      if (f.flecha) Mpunta = r;
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
    // dónde queda la punta de la flecha en el espacio de la criatura
    const enCriatura = (r, x, y) => {
      const P = c.getTransform().inverse().multiply(new DOMMatrix(r));
      return [P.e + P.a * x + P.c * y, P.f + P.b * x + P.d * y];
    };
    if (def.punta && ef.punta > 0.05 && Mpunta && vivo > 0) {
      // la punta brilla mientras tensa: avisa que el tiro está por salir
      const [x, y] = enCriatura(Mpunta, def.punta[0], def.punta[1]);
      DIB.halo(c, x, y, 6 + ef.punta * 7, "#FFD98A", ef.punta * (cal() === "baja" ? 0.45 : 0.8));
    }
    if (def.punta && ef.estela > 0 && vivo > 0) {
      // la flecha sale: una raya clara que se va hacia adelante (de frente, hacia la cámara: un destello)
      const r = mul(base, Ms[0]), [x, y] = enCriatura(r, def.punta[0], def.punta[1]), a = ef.estela;
      c.globalAlpha = a * 0.8;
      if (costado) {
        const lejos = (1 - a) * 90;
        c.fillStyle = "#F2ECEC";
        c.fillRect(x - 60 + lejos, y - 1.2, 70, 2.4);
        c.beginPath();
        c.moveTo(x + 10 + lejos, y - 4);
        c.lineTo(x + 18 + lejos, y);
        c.lineTo(x + 10 + lejos, y + 4);
        c.fill();
      } else DIB.halo(c, x, y, 10 + (1 - a) * 18, "#F2ECEC", a * 0.7);
      c.globalAlpha = 1;
    }
    c.restore();
    return true;
  }

  if (window.CRIATURAS) {
    const viejo = CRIATURAS.DIBUJO ? CRIATURAS.DIBUJO.arquero : null;
    CRIATURAS.registrar("arquero", (c, t, o) => {
      if (!dibujar(c, t, o) && viejo) viejo(c, t, o);
    });
  }
  const TODAS = Object.keys(VISTAS);
  TODAS.forEach(cargar);
  const listo = () => TODAS.every((v) => cargar(v).listo);
  return { dibujar, VISTAS, PALETAS, cargar, listo };
})();
