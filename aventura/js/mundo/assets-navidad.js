// ---------- Yule en Eldervald: los adornos de Navidad (assets del grupo «navidad» y los adornos de los árboles) ----------
// Pedido de Alejandro (11/11/2026, la ola de videos de Navidad): con el modo Navidad (motor/navidad.js, ?navidad=1)
// Eromash lleva gorro y el bosque, el Hongo Dorado y Eikholt se llenan de guirnaldas, bolas y luces. Todo con el
// lenguaje de siempre: caras planas sin contorno, luz de arriba a la derecha (la mitad izquierda en sombra), sombra
// elíptica en el piso, las bolas en los colores del juego (rojo, oro, la luz rúnica #73D5DB y el violeta de las
// ataduras) y las lucecitas en rombo, como las brasas del logo. ASSETS.NAVIDAD tiene lo que usa el sistema: el
// gorro de Eromash, los adornos de cada árbol (`adornar`, `luces`) y la guirnalda entre dos puntos cualesquiera.
(function () {
  "use strict";
  const { P, E, R, L, alfa, halo, azar, TAU } = DIB;
  const C = ASSETS.C,
    T = C.T;
  const ROJO = ["#5E130D", "#9C2315", "#C8402D"],
    ORO = ["#C98A1A", "#F5A524", "#FFD98A"],
    NIEVE = "#F2ECEC",
    NIEVE_S = "#E0B2B2",
    VERDE = C.pino,
    VERDE_LUZ = C.pinoLuz,
    ACEBO = ["#1C2E22", "#304D36", "#4E7A4A"];
  // las bolas: [color, sombra]
  const BOLAS = [
    ["#C8402D", "#9C2315"],
    ["#FFD98A", "#F5A524"],
    ["#73D5DB", "#4E9EA4"],
    ["#9A6BD8", "#6E48A8"],
    ["#F2ECEC", "#E0B2B2"],
  ];
  const BOMBILLAS = ["#FFD98A", "#FF8D71", "#73D5DB", "#7BC86C", "#9A6BD8"];
  const calidad = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  // un número fijo de 0 a 1 por lugar (el mismo en cada cuadro y en cada partida)
  const h2 = (x, y, k = 0) => {
    const v = Math.sin(x * 12.9898 + y * 78.233 + k * 37.719) * 43758.5453;
    return v - Math.floor(v);
  };

  // ---------- piezas sueltas (dibujadas de frente, son redondas) ----------
  // una bola colgada: su tapita dorada, la sombra a la izquierda y el brillo arriba a la derecha
  const cual = (i, n) => ((Math.floor(i) % n) + n) % n;
  function bola(c, x, y, r, i) {
    const [col, som] = BOLAS[cual(i, BOLAS.length)];
    R(c, x - r * 0.32, y - r * 1.28, r * 0.64, r * 0.4, ORO[1]);
    E(c, x, y, r, r, som);
    E(c, x + r * 0.16, y - r * 0.12, r * 0.8, r * 0.8, col);
    R(c, x + r * 0.22, y - r * 0.6, r * 0.32, r * 0.32, NIEVE);
  }
  // una lucecita: un rombo que titila (cada una a su ritmo)
  function bombilla(c, x, y, a, i, t) {
    const f = 0.55 + 0.45 * Math.sin(t * 3 + i * 1.7);
    alfa(c, f, () => P(c, [x, y - a, x + a * 0.7, y, x, y + a, x - a * 0.7, y], BOMBILLAS[cual(i, BOMBILLAS.length)]));
  }
  // la estrella de la punta: dos rombos dorados cruzados (la mitad izquierda en sombra)
  function estrella(c, x, y, a, t, brilla = true) {
    if (brilla) halo(c, x, y, a * 4, ORO[2], 0.6 + 0.2 * Math.sin(t * 2));
    P(c, [x, y - a * 1.6, x + a * 0.42, y, x, y + a * 1.6, x - a * 0.42, y], ORO[1]);
    P(c, [x - a * 1.25, y, x, y - a * 0.38, x + a * 1.25, y, x, y + a * 0.38], ORO[1]);
    P(c, [x, y - a * 1.6, x + a * 0.42, y, x, y + a * 1.6], ORO[2]);
    P(c, [x, y - a * 0.38, x + a * 1.25, y, x, y + a * 0.38], ORO[2]);
  }
  // un moño rojo: dos lazos y el nudo
  function mono(c, x, y, a) {
    P(c, [x, y, x - a * 1.3, y - a * 0.7, x - a * 1.2, y + a * 0.6], ROJO[1]);
    P(c, [x, y, x + a * 1.3, y - a * 0.7, x + a * 1.2, y + a * 0.6], ROJO[2]);
    P(c, [x - a * 0.2, y + a * 0.2, x - a * 0.6, y + a * 1.5, x - a * 0.1, y + a * 1.2], ROJO[1]);
    P(c, [x + a * 0.2, y + a * 0.2, x + a * 0.7, y + a * 1.4, x + a * 0.15, y + a * 1.2], ROJO[2]);
    R(c, x - a * 0.3, y - a * 0.3, a * 0.6, a * 0.6, ROJO[0]);
  }
  // una ramita de acebo: dos hojas y tres bayas
  function acebo(c, x, y, a) {
    P(c, [x, y, x - a * 1.6, y - a * 0.5, x - a * 1.1, y - a * 0.2, x - a * 1.3, y + a * 0.3], ACEBO[1]);
    P(c, [x, y, x + a * 1.6, y - a * 0.7, x + a * 1.2, y - a * 0.2, x + a * 1.5, y + a * 0.2], ACEBO[2]);
    E(c, x - a * 0.3, y + a * 0.1, a * 0.38, a * 0.38, ROJO[1]);
    E(c, x + a * 0.25, y - a * 0.1, a * 0.38, a * 0.38, ROJO[2]);
    E(c, x, y + a * 0.45, a * 0.38, a * 0.38, ROJO[2]);
  }
  // un mechón de la guirnalda: una estrellita de agujas verdes
  function mechon(c, x, y, a, i) {
    const g = i * 0.9;
    P(c, [x + Math.cos(g) * a, y + Math.sin(g) * a * 0.7, x + Math.cos(g + 2.1) * a, y + Math.sin(g + 2.1) * a * 0.7, x + Math.cos(g + 4.2) * a, y + Math.sin(g + 4.2) * a * 0.7], VERDE[i % 3]);
    P(c, [x, y - a * 0.8, x + a * 0.9, y - a * 0.1, x + a * 0.2, y + a * 0.2], VERDE_LUZ);
  }

  // ---------- la guirnalda entre dos puntos ----------
  // pt(q) da el punto en pantalla para q de 0 a 1 (ya con la caída); a: el tamaño de un mechón en pantalla.
  // Lleva mechones de abeto, una bola colgada cada tanto, lucecitas y un moño en cada punta.
  function guirnalda(c, pt, largo, a, t, sem = 0, op = {}) {
    const n = Math.max(4, Math.min(80, Math.round(largo / (a * 1.25))));
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push(pt(i / n));
    // el cordel, debajo
    c.beginPath();
    pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    c.strokeStyle = VERDE[0];
    c.lineWidth = a * 0.7;
    c.lineCap = "round";
    c.stroke();
    pts.forEach((p, i) => mechon(c, p[0], p[1], a, i + sem));
    // las bolas cuelgan de un hilo; las lucecitas van encima de los mechones
    const cada = op.bolasCada || 3;
    for (let i = 1; i < n; i++) {
      if (i % cada === 1) {
        const [x, y] = pts[i],
          hilo = a * (1.1 + (i % 2) * 0.7);
        L(c, x, y, x, y + hilo, ORO[0], Math.max(1, a * 0.12));
        bola(c, x, y + hilo + a * 0.7, a * 0.62, i + sem);
      } else if (op.luces !== false) bombilla(c, pts[i][0], pts[i][1] - a * 0.2, a * 0.42, i + sem, t);
    }
    if (op.monos !== false) {
      mono(c, pts[0][0], pts[0][1], a * 0.75);
      mono(c, pts[n][0], pts[n][1], a * 0.75);
    }
    return pts;
  }

  // ---------- El abeto de Yule ----------
  // El abeto grande de las plazas: seis pisos de agujas, una cinta de lucecitas que da la vuelta, bolas en los colores
  // del juego, velas de miel en las puntas de abajo y la estrella de dos rombos arriba. Es redondo: se ve igual de
  // cualquier lado. o.s tamaño.
  function abetoYuleCapas(x, y, t, o) {
    const s = o.s || 1,
      v = Math.sin(t * 0.6 + (o.sem || 0)) * 1.5 * s,
      pisos = 6,
      l = [];
    for (let k = 0; k < pisos; k++) {
      const w = (82 - k * 12) * s,
        base = y - (34 + k * 38) * s,
        alto = (70 - k * 5) * s;
      l.push({ k, w, base, alto, top: base - alto, dx: v * (k + 1) * 0.3 });
    }
    return l;
  }
  function abetoYule(c, x, y, t, o) {
    const s = o.s || 1,
      capas = abetoYuleCapas(x, y, t, o),
      r = azar((o.sem || 3) * 911);
    halo(c, x, y - 140 * s, 220 * s, ORO[2], 0.35);
    E(c, x + 16 * s, y + 3 * s, 92 * s, 20 * s, "rgba(0,0,0,0.34)");
    // tronco y la tarima de tablas donde está clavado
    P(c, [x - 13 * s, y - 2 * s, x - 10 * s, y - 50 * s, x + 10 * s, y - 50 * s, x + 13 * s, y - 2 * s], C.tronco);
    P(c, [x - 13 * s, y - 2 * s, x - 10 * s, y - 50 * s, x, y - 50 * s, x - 1 * s, y - 2 * s], C.troncoSombra);
    P(c, [x - 34 * s, y + 4 * s, x - 30 * s, y - 14 * s, x + 30 * s, y - 14 * s, x + 34 * s, y + 4 * s], C.madera);
    P(c, [x - 34 * s, y + 4 * s, x - 30 * s, y - 14 * s, x - 4 * s, y - 14 * s, x - 6 * s, y + 4 * s], C.maderaSombra);
    R(c, x - 30 * s, y - 16 * s, 60 * s, 4 * s, C.maderaLuz);
    capas.forEach(({ k, w, base, alto, top, dx }) => {
      P(c, [x + dx, top, x - w, base, x - w * 0.5, base - 6 * s, x - w * 0.15, base + 5 * s, x + w * 0.2, base - 5 * s, x + w * 0.55, base + 4 * s, x + w, base], VERDE[k % 3]);
      P(c, [x + dx, top, x + w * 0.2, base - 5 * s, x + w * 0.55, base + 4 * s, x + w, base, x + w * 0.62, base - 11 * s], VERDE_LUZ);
      // la nieve en las puntas, del lado del sol
      P(c, [x + dx, top, x + dx + 6 * s, top + 9 * s, x + dx - 3 * s, top + 7 * s], NIEVE);
    });
    // la cinta de lucecitas: sube en diagonal de piso en piso
    let n = 0;
    capas.forEach(({ w, base, alto, dx }) => {
      const a = [x + dx * 0.4 - w * 0.78, base - alto * 0.12],
        b = [x + dx * 0.8 + w * 0.5, base - alto * 0.5];
      c.beginPath();
      c.moveTo(a[0], a[1]);
      c.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 9 * s, b[0], b[1]);
      c.strokeStyle = ORO[0];
      c.lineWidth = 1.6 * s;
      c.stroke();
      for (let i = 0; i <= 5; i++) {
        const q = i / 5,
          bx = a[0] + (b[0] - a[0]) * q,
          by = a[1] + (b[1] - a[1]) * q + Math.sin(q * Math.PI) * 4.5 * s;
        bombilla(c, bx, by, 3.2 * s, n++, t);
      }
    });
    // bolas: tres por piso (menos arriba), colgando del borde
    capas.forEach(({ k, w, base, dx }) => {
      const cuantas = k < 3 ? 3 : 2;
      for (let i = 0; i < cuantas; i++) {
        const u = (i + 0.5) / cuantas - 0.5 + (r() - 0.5) * 0.12,
          bx = x + dx * 0.5 + u * w * 1.5,
          by = base - (2 + r() * 10) * s;
        bola(c, bx, by, (6.5 - k * 0.5) * s, k * 3 + i + (o.sem || 0));
      }
    });
    // velas en las puntas de los dos pisos de abajo
    capas.slice(0, 2).forEach(({ w, base }) =>
      [-0.86, 0.9].forEach((u) => {
        const vx = x + u * w,
          vy = base - 2 * s;
        R(c, vx - 2 * s, vy - 10 * s, 4 * s, 10 * s, NIEVE_S);
        P(c, [vx, vy - 17 * s + Math.sin(t * 9 + u) * 1 * s, vx + 2.4 * s, vy - 11 * s, vx - 2.4 * s, vy - 11 * s], ORO[2]);
      }),
    );
    const ar = capas[capas.length - 1];
    estrella(c, x + ar.dx, ar.top - 6 * s, 9 * s, t, calidad() !== "baja");
  }

  // ---------- El pino adornado ----------
  // El pino de siempre (assets.js) con lo que le cuelga en el modo Navidad. Sirve para ponerlo a mano en el editor.
  function pinoYule(c, x, y, t, o) {
    ASSETS.LISTA.pino.f(c, x, y, t, o);
    adornar(c, "pino", x, y, t, Object.assign({ todo: true }, o));
  }

  // ---------- La guirnalda de Yule ----------
  // De punta a punta (o.x2, o.y2 en el mundo): dos postes de madera con un moño y, entre ellos, la guirnalda de abeto
  // con bolas y lucecitas, colgando en curva. o.sinPostes: cuelga de dos cosas que ya están (los faroles de Eikholt);
  // o.alto: a qué altura se ata (en unidades del asset); o.caida: cuánto baja en el medio.
  function guirnaldaYuleV(c, x, y, t, o) {
    if (!window.VOL) return;
    const s = o.s || 1,
      lg = 150 * s,
      x0 = o.x2 == null ? x - lg / 2 : x,
      x2 = o.x2 == null ? x + lg / 2 : o.x2,
      y2 = o.y2 == null ? y : o.y2;
    const pr = VOL.prSeg(x0, y, x2, y2, { s }),
      l = pr.largo,
      hz = o.alto || 110,
      caida = o.caida != null ? o.caida : Math.min(60, 12 + l * 0.12 / s);
    const S = VOL.escena(pr);
    if (!o.sinPostes)
      [0, l].forEach((u) =>
        S.poner(u, 0, () => {
          VOL.sombra(c, pr, u, 0, 10 * s, 7 * s, 0.3);
          VOL.cubo(c, pr, u, 0, 9 * s, 9 * s, hz + 8, T.madera);
          VOL.piramide(c, pr, VOL.redonda(u, 0, 6 * s, 4, 0.5), hz + 8, u, 0, hz + 16, T.madera);
        }),
      );
    S.poner(l / 2, 0, () =>
      guirnalda(c, (q) => pr(l * q, 0, hz - caida * 4 * q * (1 - q)), l, 7.5 * s, t, o.sem || 0, { monos: true }),
      20,
    );
    S.dibujar();
  }

  // ---------- La corona de acebo ----------
  // Para colgar en puertas y paredes: un aro de abeto con acebo, una bola de Jera y el moño rojo abajo. Es plana:
  // se arma como lámina (ASSETS.cartaV) y de canto no se ve. (x, y) es el borde de abajo.
  function coronaYule(c, x, y, t, o) {
    const s = o.s || 1,
      cy = y - 34 * s,
      rr = 24 * s;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU - Math.PI / 2;
      mechon(c, x + Math.cos(a) * rr, cy + Math.sin(a) * rr, 9 * s, i);
    }
    // del lado de la sombra, más oscuro
    alfa(c, 0.35, () => {
      for (let i = 8; i < 13; i++) {
        const a = (i / 16) * TAU - Math.PI / 2;
        E(c, x + Math.cos(a) * rr, cy + Math.sin(a) * rr, 7 * s, 7 * s, VERDE[0]);
      }
    });
    acebo(c, x - 16 * s, cy - 18 * s, 5 * s);
    acebo(c, x + 18 * s, cy - 12 * s, 4 * s);
    bola(c, x + 22 * s, cy + 10 * s, 5 * s, 1);
    bola(c, x - 23 * s, cy + 6 * s, 4.5 * s, 2);
    mono(c, x, cy + rr, 8 * s);
  }

  // ---------- Los regalos de Yule ----------
  // Tres paquetes apilados de costado, con cinta dorada o roja en cada cara y un moño arriba. Armados con caras: se
  // giran. o.sem cambia el orden de los colores.
  const PAQ = [
    { col: ROJO, cinta: ORO[2] },
    { col: ["#1E3F73", "#2F5FA8", "#4A78D0"], cinta: ORO[2] },
    { col: ["#C9A0A0", NIEVE_S, NIEVE], cinta: ROJO[2] },
    { col: ["#253C2B", "#304D36", "#4E7A4A"], cinta: ROJO[2] },
  ];
  function regalosYule(c, x, y, t, o) {
    if (!window.VOL) return;
    const pr = VOL.pr(x, y, o),
      k = (o.sem || 0) | 0;
    VOL.sombra(c, pr, 4, 4, 58, 34, 0.32);
    const S = VOL.escena(pr);
    const cinta = (col) => (cc, l, h) => R(cc, l / 2 - Math.min(5, l * 0.1), -h, Math.min(10, l * 0.2), h, col);
    const tapa = (col) => (cc, l, h) => {
      R(cc, l / 2 - Math.min(5, l * 0.1), -h, Math.min(10, l * 0.2), h, col);
      R(cc, 0, -h / 2 - Math.min(5, h * 0.1), l, Math.min(10, h * 0.2), col);
    };
    [
      [-20, -8, 42, 36, 40, 0],
      [24, -4, 34, 30, 30, 1],
      [2, 22, 30, 26, 24, 2],
    ].forEach(([u, w, a, f, h, i]) => {
      const p = PAQ[(i + k) % PAQ.length];
      S.poner(u, w, () => {
        VOL.cubo(c, pr, u, w, a, f, h, p.col, { frente: cinta(p.cinta), atras: cinta(p.cinta), der: cinta(p.cinta), izq: cinta(p.cinta), arriba: tapa(p.cinta) });
        const q = pr(u, w, h);
        const ROJ = p.cinta === ORO[2] ? [ORO[0], ORO[1], ORO[2]] : ROJO;
        P(c, [q[0], q[1], q[0] - 8 * pr.s, q[1] - 6 * pr.s, q[0] - 7 * pr.s, q[1] + 2 * pr.s], ROJ[1]);
        P(c, [q[0], q[1], q[0] + 8 * pr.s, q[1] - 6 * pr.s, q[0] + 7 * pr.s, q[1] + 2 * pr.s], ROJ[2]);
      });
    });
    S.dibujar();
  }

  // ---------- El tronco de Yule ----------
  // El leño que se trae para la noche más larga: acostado, con tres velas encendidas, acebo y una cinta roja.
  function troncoYule(c, x, y, t, o) {
    if (!window.VOL) return;
    const pr = VOL.pr(x, y, o),
      alta = calidad() !== "baja";
    VOL.sombra(c, pr, 0, 2, 70, 26, 0.34);
    VOL.rollo(c, pr, -62, 62, 0, 17, 17, T.tronco, { corte: "#C98A5A" });
    // la cinta roja alrededor, del lado que se ve
    VOL.rollo(c, pr, -28, -18, 0, 17, 17.6, ROJO);
    const S = VOL.escena(pr);
    [-30, 4, 34].forEach((u, i) =>
      S.poner(u, 0, () => {
        const h = [30, 42, 26][i];
        VOL.cilindro(c, pr, u, 0, 5, 30, 30 + h, ["#C9A0A0", NIEVE_S, NIEVE], { n: 6 });
        const q = pr(u, 0, 34 + h),
          s = pr.s,
          v = Math.sin(t * 9 + i * 2) * 1.2 * s;
        if (alta) halo(c, q[0], q[1] - 6 * s, 26 * s, ORO[2], 0.7);
        P(c, [q[0] + v, q[1] - 14 * s, q[0] + 4 * s, q[1], q[0] - 4 * s, q[1]], "#FF8D71");
        P(c, [q[0] + v * 0.6, q[1] - 8 * s, q[0] + 2 * s, q[1], q[0] - 2 * s, q[1]], ORO[2]);
      }),
    );
    S.poner(-48, 6, () => {
      const q = pr(-48, 6, 32);
      acebo(c, q[0], q[1], 7 * pr.s);
    }, 5);
    S.poner(50, 4, () => {
      const q = pr(50, 4, 30);
      acebo(c, q[0], q[1], 6 * pr.s);
    }, 5);
    S.dibujar();
  }

  // ---------- La cabra de paja de Yule ----------
  // La julbock de las casas del norte: una cabra de paja atada con cintas rojas, cuernos enrulados y barbita. Se ve
  // de costado (ASSETS.ladoV): mira hacia donde mira en el mundo. o.s tamaño (en Eikholt la grande de la plaza).
  function cabraYule(c, x, y, t, o) {
    const s = o.s || 1,
      X = (v) => x + v * s,
      Y = (v) => y - v * s,
      pp = (a, col) => P(c, a.map((v, i) => (i % 2 ? Y(v) : X(v))), col),
      PJ = ORO;
    E(c, X(4), y + 2 * s, 42 * s, 9 * s, "rgba(0,0,0,0.32)");
    // las patas de atrás (las del otro lado, más oscuras) y las de adelante
    [[-24, 0], [14, 0]].forEach(([u]) => pp([u, 0, u + 5, 0, u + 6, 26, u + 1, 26], PJ[0]));
    [[-18, 0], [21, 0]].forEach(([u]) => {
      pp([u, 0, u + 5, 0, u + 6, 26, u + 1, 26], PJ[1]);
      pp([u, 8, u + 6, 8, u + 6, 12, u, 12], ROJO[2]);
    });
    // el cuerpo de haces de paja
    pp([-36, 26, -32, 46, 26, 48, 33, 30, 22, 22, -28, 22], PJ[1]);
    pp([-32, 46, 26, 48, 29, 40, -33, 39], PJ[2]);
    pp([-36, 26, -32, 46, -33, 39, -30, 24], PJ[0]);
    for (let k = 0; k < 6; k++) L(c, X(-26 + k * 10), Y(27), X(-25 + k * 10), Y(44), PJ[0], 1.2 * s);
    // la cola
    pp([-34, 40, -46, 52, -42, 40], PJ[1]);
    // el cuello y la cabeza
    pp([20, 44, 28, 66, 38, 64, 34, 40], PJ[1]);
    pp([28, 66, 38, 64, 36, 56], PJ[2]);
    pp([28, 64, 48, 62, 56, 54, 46, 50, 32, 54], PJ[1]);
    pp([28, 64, 48, 62, 50, 58, 30, 60], PJ[2]);
    // la barbita y el ojo
    pp([46, 50, 50, 50, 47, 42], PJ[0]);
    R(c, X(41), Y(60), 2.4 * s, 2.4 * s, "#111111");
    // los cuernos enrulados hacia atrás
    c.beginPath();
    c.moveTo(X(34), Y(64));
    c.quadraticCurveTo(X(30), Y(86), X(16), Y(82));
    c.quadraticCurveTo(X(8), Y(74), X(18), Y(70));
    c.strokeStyle = PJ[0];
    c.lineWidth = 4.5 * s;
    c.lineCap = "round";
    c.stroke();
    c.beginPath();
    c.moveTo(X(38), Y(64));
    c.quadraticCurveTo(X(36), Y(84), X(24), Y(84));
    c.strokeStyle = PJ[2];
    c.lineWidth = 3 * s;
    c.stroke();
    // las cintas rojas: dos en el cuerpo, una en el cuello con su moño
    pp([-20, 22, -13, 22, -12, 47, -19, 47], ROJO[1]);
    pp([8, 22, 15, 22, 16, 48, 9, 48], ROJO[2]);
    pp([22, 48, 33, 50, 34, 44, 24, 42], ROJO[2]);
    mono(c, X(28), Y(46), 5 * s);
  }

  // ---------- La bola de Jera ----------
  // Una bola de Yule enorme apoyada en el piso, de vidrio de color con su tapita y su argolla de oro y la runa Jera
  // (el año que vuelve) en la franja del medio. o.col: 0 roja, 1 dorada, 2 rúnica, 3 violeta (si no, por o.sem).
  function bolaYule(c, x, y, t, o) {
    const s = o.s || 1,
      i = o.col != null ? o.col : ((o.sem || 0) | 0) % 4,
      [col, som] = BOLAS[i],
      r = 30 * s,
      cy = y - r;
    E(c, x + 6 * s, y + 1, r * 0.95, r * 0.26, "rgba(0,0,0,0.34)");
    const caras = DIB.poli(x, cy, r, r, 10, Math.PI / 10);
    P(c, caras, som);
    P(c, DIB.poli(x + r * 0.14, cy - r * 0.1, r * 0.82, r * 0.82, 10, Math.PI / 10), col);
    // la franja de abajo y la runa en el medio
    const fr = i === 1 ? ROJO[2] : ORO[2];
    P(c, [x - r * 0.9, cy + r * 0.42, x + r * 0.9, cy + r * 0.42, x + r * 0.8, cy + r * 0.62, x - r * 0.8, cy + r * 0.62], fr);
    P(c, [x - r * 0.9, cy + r * 0.42, x - r * 0.3, cy + r * 0.42, x - r * 0.3, cy + r * 0.62, x - r * 0.8, cy + r * 0.62], i === 1 ? ROJO[1] : ORO[1]);
    if (window.FUTHARK) FUTHARK.dibujar(c, "jera", x + r * 0.04, cy + r * 0.3, r * 0.8, i === 1 ? ROJO[1] : ORO[2], 3 * s);
    R(c, x + r * 0.42, cy - r * 0.62, r * 0.2, r * 0.2, NIEVE);
    // la tapita y la argolla
    P(c, [x - r * 0.24, cy - r * 0.96, x - r * 0.2, cy - r * 1.16, x + r * 0.2, cy - r * 1.16, x + r * 0.24, cy - r * 0.96], ORO[1]);
    P(c, [x, cy - r * 1.16, x + r * 0.2, cy - r * 1.16, x + r * 0.24, cy - r * 0.96, x, cy - r * 0.96], ORO[2]);
    c.beginPath();
    c.ellipse(x, cy - r * 1.24, r * 0.12, r * 0.1, 0, 0, TAU);
    c.strokeStyle = ORO[0];
    c.lineWidth = 2 * s;
    c.stroke();
  }

  // ---------- los adornos de los árboles del bosque ----------
  // El modo Navidad cuelga cosas de los árboles de siempre sin tocar su dibujo: se calcula dónde quedan sus pisos y
  // sus copas (las mismas cuentas que en assets.js) y se dibuja encima. Casi todos los pinos llevan bolas, la mitad
  // lucecitas y estrella; robles, abedules y los gigantes, bolas y una cinta. luces(id, x, y, t, o) devuelve dónde
  // quedan las lucecitas (para que brillen de noche, encima de la oscuridad).
  const ADORNA = { pino: 1, abetoAnciano: 1, roble: 1, abedul: 1, robleAnciano: 1, robleGigante: 1, farol: 1 };
  // cuánto se adorna cada árbol: 0 nada, 1 unas bolas, 2 todo (la semilla sale de su lugar)
  function cuanto(x, y, o) {
    if (o.todo) return 2;
    const h = h2(Math.round(x), Math.round(y), 1),
      baja = calidad() === "baja";
    if (baja) return h < 0.35 ? 1 : 0;
    if (calidad() === "media") return h < 0.3 ? 2 : h < 0.85 ? 1 : 0;
    return h < 0.55 ? 2 : h < 0.93 ? 1 : 0;
  }
  function pisosPino(x, y, t, o) {
    const s = o.s || 1,
      pisos = o.pisos || 4,
      v = Math.sin(t * 0.9 + (o.sem || 0)) * 2 * s,
      l = [];
    for (let k = 0; k < pisos; k++) {
      const w = (40 - k * (26 / pisos)) * s,
        base = y - (26 + k * (88 / pisos)) * s,
        alto = (48 - k * 4) * s;
      l.push({ k, w, base, alto, top: base - alto, dx: v * (k + 1) * 0.35 });
    }
    return l;
  }
  function pisosAbeto(x, y, t, o) {
    const s = o.s || 1,
      h = o.h || 520,
      v = Math.sin(t * 0.5 + (o.sem || 0)) * 3 * s,
      base0 = y - h * 0.62,
      l = [];
    for (let k = 0; k < 7; k++) {
      const u = k / 7,
        w = (96 - k * 10) * s,
        base = base0 - (h * 0.46 + 60 * s) * u,
        alto = h * 0.16 + 30 * s;
      l.push({ k, w, base, alto, top: base - alto, dx: v * (k + 1) * 0.4 });
    }
    return l;
  }
  function masasRoble(x, y, t, o) {
    const s = o.s || 1,
      r = azar((o.sem || 1) * 977),
      v = Math.sin(t * 0.7 + (o.sem || 0)) * 1.5 * s,
      lado = r() < 0.5 ? -1 : 1,
      cx = x + lado * 8 * s;
    return [
      [cx - 24 * s + v, y - 104 * s, 40 * s],
      [cx + lado * 40 * s + v, y - 92 * s, 30 * s],
      [cx + 10 * s + v, y - 120 * s, 44 * s],
    ];
  }
  function masasRobleAnciano(x, y, t, o) {
    const s = o.s || 1,
      v = Math.sin(t * 0.5 + (o.sem || 0)) * 2 * s,
      r = azar((o.sem || 1) * 389),
      l = [];
    for (let k = 0; k < 8; k++) l.push([x + (r() - 0.5) * 300 * s + v, y - (250 + r() * 130) * s, (70 + r() * 40) * s]);
    return l;
  }
  // el Roble de Eikholt: las masas de adelante de su copa (las mismas cuentas que robleGigante en assets-capital.js)
  const MASAS_ROBLE = [[-560, -360, 230, 0], [560, -350, 230, 0], [-300, -540, 260, 0], [300, -540, 260, 0], [0, -660, 280, 0], [-720, -240, 170, 1], [720, -240, 170, 1], [-460, -480, 240, 1], [460, -480, 240, 1], [-150, -590, 250, 1], [180, -610, 240, 1], [-380, -310, 220, 2], [400, -300, 210, 2], [-100, -420, 260, 2], [160, -440, 240, 2], [-620, -220, 150, 2], [620, -220, 150, 2], [20, -750, 180, 2]];
  function masasRobleGigante(x, y, t, o) {
    const s = o.s || 1,
      v = Math.sin(t * 0.45) * 3 * s,
      gira = o.giro !== undefined,
      co = gira ? Math.cos(o.giro) : 1,
      si = gira ? Math.sin(o.giro) : 0,
      kk = gira ? o.k || 0.55 : 0,
      l = [];
    MASAS_ROBLE.forEach(([dx, dy, mr, k], i) => {
      const w = (k - 1) * 260 + (((i * 37) % 7) - 3) * 30,
        f = dx * si + w * co,
        kv = gira ? (f > 130 ? 2 : f > -130 ? 1 : 0) : k;
      if (kv < 2) return;
      l.push([x + (dx * co - w * si) * s + v * 1.6, y + dy * s + (dx * si + w * co) * kk * s, mr * s * 0.72]);
    });
    return l.sort((a, b) => a[0] - b[0]);
  }
  function masasAbedul(x, y, t, o) {
    const s = o.s || 1,
      v = Math.sin(t * 1.1 + (o.sem || 0)) * 2 * s;
    return [[-12, -96, 18], [10, -104, 16], [0, -118, 18]].map(([dx, dy, r]) => [x + dx * s + v, y + dy * s, r * s]);
  }
  // la cinta de lucecitas de un piso de abeto o pino: de abajo a la izquierda hacia arriba a la derecha
  function cintaPiso(p, x, n) {
    const a = [x + p.dx * 0.4 - p.w * 0.78, p.base - p.alto * 0.12],
      b = [x + p.dx * 0.8 + p.w * 0.48, p.base - p.alto * 0.48],
      l = [];
    for (let i = 0; i <= n; i++) {
      const q = i / n;
      l.push([a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q + Math.sin(q * Math.PI) * p.w * 0.1]);
    }
    return l;
  }
  // una cinta de lucecitas que cuelga entre dos puntos
  function cintaEntre(a, b, caida, n) {
    const l = [];
    for (let i = 0; i <= n; i++) {
      const q = i / n;
      l.push([a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q + caida * 4 * q * (1 - q)]);
    }
    return l;
  }
  // todo lo que lleva un árbol: { bolas: [[x, y, r, i, hilo]], cintas: [[[x, y]…]], estrella: [x, y, a], monos: [[x, y, a]] }
  function arreglo(id, x, y, t, o) {
    const s = o.s || 1,
      nivel = id === "robleGigante" ? 2 : cuanto(x, y, o),
      sem = Math.round(h2(Math.round(x), Math.round(y), 2) * 40),
      ar = { bolas: [], cintas: [], estrella: null, monos: [], nivel };
    if (!nivel) return ar;
    if (id === "pino" || id === "abetoAnciano") {
      const pisos = id === "pino" ? pisosPino(x, y, t, o) : pisosAbeto(x, y, t, o),
        gr = id === "pino" ? 1 : 2;
      pisos.forEach((p) => {
        if (nivel === 1 && p.k % 2) return;
        const us = nivel === 2 ? [-0.62, 0.08, 0.6] : [-0.5, 0.45];
        us.forEach((u, i) => {
          if (nivel === 2 && (p.k + i + sem) % 4 === 3) return;
          ar.bolas.push([x + p.dx * 0.5 + u * p.w, p.base - 1 * s * gr, (4.2 - p.k * 0.35) * s * gr, sem + p.k * 3 + i, 3 * s * gr]);
        });
        if (nivel === 2) ar.cintas.push(cintaPiso(p, x, id === "pino" ? 4 : 6));
      });
      if (nivel === 2) {
        const ar0 = pisos[pisos.length - 1];
        ar.estrella = [x + ar0.dx, ar0.top - 3 * s * gr, 6 * s * gr];
      }
      // los gigantes tienen la copa muy arriba: se les enrolla una cinta roja al tronco y se le cuelgan bolas bajas
      if (id === "abetoAnciano") ar.tronco = true;
    } else {
      const masas = id === "roble" ? masasRoble(x, y, t, o) : id === "abedul" ? masasAbedul(x, y, t, o) : id === "robleGigante" ? masasRobleGigante(x, y, t, o) : masasRobleAnciano(x, y, t, o),
        rb = id === "robleGigante" ? 14 : id === "robleAnciano" ? 8 : id === "abedul" ? 3.2 : 4.5;
      if (id === "robleGigante") {
        // de cada masa de adelante cuelgan tres bolas grandes y entre una y otra va una cinta de lucecitas
        masas.forEach(([mx, my, mr], i) => {
          [-0.5, 0.05, 0.55].forEach((u, j) => ar.bolas.push([mx + u * mr, my + mr * (0.55 + (j % 2) * 0.12), rb * s, i * 3 + j, (40 + ((i + j) % 3) * 30) * s]));
          if (i) {
            const a = masas[i - 1];
            ar.cintas.push(cintaEntre([a[0] + a[2] * 0.5, a[1] + a[2] * 0.5], [mx - mr * 0.5, my + mr * 0.5], 60 * s, 9));
          }
        });
        return ar;
      }
      masas.forEach(([mx, my, mr], i) => {
        if (nivel === 1 && i % 2) return;
        ar.bolas.push([mx + ((((i + sem) % 3) - 1) * mr) / 3, my + mr * 0.62, rb * s, sem + i, mr * 0.25]);
      });
      if (nivel === 2 && masas.length > 1) {
        const a = masas[0],
          b = masas[masas.length - 1];
        ar.cintas.push(cintaEntre([a[0] - a[2] * 0.6, a[1] + a[2] * 0.1], [b[0] + b[2] * 0.6, b[1] + b[2] * 0.2], 14 * s * (id === "robleAnciano" ? 3 : 1), id === "abedul" ? 4 : 7));
      }
      if (id === "abedul") ar.monos.push([x, y - 62 * s, 5 * s]);
    }
    return ar;
  }
  function adornar(c, id, x, y, t, o = {}) {
    if (!ADORNA[id]) return;
    if (id === "farol") {
      // los faroles del camino: un moño en el palo y acebo arriba
      const s = o.s || 1;
      mono(c, x, y - 48 * s, 5 * s);
      acebo(c, x + 2 * s, y - 88 * s, 4 * s);
      return;
    }
    const ar = arreglo(id, x, y, t, o),
      s = o.s || 1;
    if (!ar.nivel) return;
    if (ar.tronco) {
      // la cinta roja enrollada al tronco de los gigantes
      const h = o.h || 520,
        bw = 26 * s,
        tw = 11 * s,
        ancho = (yy) => bw + (tw - bw) * ((y - yy) / h);
      for (let yy = y - 40 * s; yy > y - Math.min(h * 0.55, 330 * s); yy -= 74 * s) {
        const y2 = yy - 30 * s;
        P(c, [x - ancho(yy), yy, x + ancho(y2), y2, x + ancho(y2), y2 - 9 * s, x - ancho(yy), yy - 9 * s], ROJO[1]);
        P(c, [x, yy - 15 * s, x + ancho(y2), y2, x + ancho(y2), y2 - 9 * s, x, yy - 24 * s], ROJO[2]);
      }
      mono(c, x - 4 * s, y - 50 * s, 9 * s);
    }
    ar.cintas.forEach((l) => {
      c.beginPath();
      l.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
      c.strokeStyle = ORO[0];
      c.lineWidth = Math.max(1, 1.2 * s);
      c.stroke();
      const g = id === "robleGigante" ? 3 : id === "robleAnciano" || id === "abetoAnciano" ? 2 : 1;
      l.forEach((p, i) => bombilla(c, p[0], p[1], 2.6 * s * g, i + (Math.round(p[0]) & 7), t));
    });
    ar.bolas.forEach(([bx, by, r, i, hilo]) => {
      L(c, bx, by - hilo, bx, by, ORO[0], Math.max(0.8, r * 0.16));
      bola(c, bx, by + r * 0.9, r, i);
    });
    ar.monos.forEach(([mx, my, a]) => mono(c, mx, my, a));
    if (ar.estrella) estrella(c, ar.estrella[0], ar.estrella[1], ar.estrella[2], t, calidad() === "alta");
  }
  // dónde quedan las lucecitas de un árbol (relativas a su pie), para que el sistema las haga brillar de noche
  function luces(id, x, y, t, o = {}) {
    if (id === "abetoYule") {
      const l = [];
      abetoYuleCapas(x, y, t, o).forEach((p) => {
        const a = [x + p.dx * 0.4 - p.w * 0.78, p.base - p.alto * 0.12],
          b = [x + p.dx * 0.8 + p.w * 0.5, p.base - p.alto * 0.5];
        for (let i = 0; i <= 5; i++) {
          const q = i / 5;
          l.push([a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q + Math.sin(q * Math.PI) * 4.5 * (o.s || 1)]);
        }
      });
      return l;
    }
    if (!ADORNA[id] || id === "farol") return [];
    const ar = arreglo(id, x, y, t, o),
      l = [];
    ar.cintas.forEach((ci) => l.push(...ci));
    if (ar.estrella) l.push([ar.estrella[0], ar.estrella[1]]);
    return l;
  }

  // ---------- el gorro de Eromash ----------
  // El gorro de Yule de Eromash: rojo, con el borde de piel blanca, la punta caída hacia un costado con su pompón y
  // una ramita de acebo. Solo la cabeza, como siempre (sin cuerpo ni manos). Se dibuja en las mismas medidas que el
  // casco de personajes/vikingo.js (caja 40 90 400 480): gorro(c, vista) con el lienzo ya puesto en esa caja.
  // De frente la punta cae a la derecha; de costado cae hacia atrás; de espaldas, a la izquierda y sin el acebo.
  const GORRO = {
    cuerpo: [78, 116, 108, 40, 172, -12, 258, -36, 340, -26, 408, 14, 446, 74, 456, 118, 430, 112, 402, 66, 352, 40, 362, 74, 402, 118],
    sombra: [78, 116, 108, 40, 172, -12, 258, -36, 228, 118],
    pliegue: [402, 66, 352, 40, 362, 74, 384, 92],
    luz: [258, -36, 340, -26, 408, 14, 446, 74, 420, 70, 380, 28, 320, 2],
    piel: [62, 132, 58, 110, 76, 90, 160, 82, 240, 80, 320, 82, 404, 90, 422, 110, 418, 132, 330, 140, 240, 142, 150, 140],
    pielSombra: [62, 132, 58, 110, 76, 90, 160, 82, 220, 80, 210, 141, 150, 140],
  };
  function gorro(c, vista) {
    const espejar = vista === "N" || vista === "E",
      X = (v) => (espejar ? 480 - v : v),
      pp = (a, col) => P(c, a.map((v, i) => (i % 2 ? v : X(v))), col);
    pp(GORRO.cuerpo, ROJO[2]);
    pp(GORRO.sombra, ROJO[1]);
    pp(GORRO.pliegue, ROJO[0]);
    pp(GORRO.luz, "#FF8D71");
    // el pompón: un octógono de piel con su mitad en sombra
    const px = X(450),
      py = 128;
    P(c, DIB.poli(px, py, 32, 32, 8, Math.PI / 8), NIEVE_S);
    P(c, DIB.poli(px + 6, py - 5, 25, 25, 8, Math.PI / 8), NIEVE);
    // el borde de piel, con sus mechones
    pp(GORRO.piel, NIEVE);
    pp(GORRO.pielSombra, NIEVE_S);
    for (let i = 0; i < 6; i++) {
      const bx = 96 + i * 58;
      pp([bx, 136, bx + 14, 116, bx + 26, 138], i < 3 ? "#C9A0A0" : NIEVE_S);
    }
    // el acebo, del lado de adelante (de espaldas no se ve)
    if (vista !== "N") acebo(c, X(118), 96, 16);
  }

  Object.assign(ASSETS.LISTA, {
    abetoYule: { f: abetoYule, figura: true, alto: 300, choque: { r: 34 }, grupo: "navidad", luz: true },
    pinoYule: { f: pinoYule, figura: true, alto: 150, choque: { r: 14 }, grupo: "navidad" },
    guirnaldaYule: { f: guirnaldaYuleV, vol: true, alto: 130, choque: null, grupo: "navidad" },
    coronaYule: { f: ASSETS.cartaV(coronaYule, 70, 80), vol: true, alto: 80, choque: null, grupo: "navidad" },
    regalosYule: { f: regalosYule, vol: true, alto: 50, choque: { r: 30 }, grupo: "navidad" },
    troncoYule: { f: troncoYule, vol: true, alto: 76, choque: { w: 120, h: 20 }, grupo: "navidad", luz: true },
    cabraYule: { f: cabraYule, fv: ASSETS.ladoV(cabraYule), vol: true, alto: 86, choque: { r: 24 }, grupo: "navidad" },
    bolaYule: { f: bolaYule, figura: true, alto: 70, choque: { r: 24 }, grupo: "navidad" },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, {
    abetoYule: {},
    pinoYule: {},
    guirnaldaYule: {},
    coronaYule: {},
    regalosYule: {},
    troncoYule: {},
    cabraYule: {},
    bolaYule: { col: 0 },
  });
  ASSETS.NAVIDAD = { ADORNA, adornar, luces, nivel: (id, x, y, o = {}) => (id === "robleGigante" ? 2 : cuanto(x, y, o)), gorro, guirnalda, corona: coronaYule, bola, bombilla, estrella, mono, acebo, BOLAS, BOMBILLAS };
})();
