// ---------- el prólogo del mago (módulo PROLOGO) ----------
// Pedido de Alejandro (24/10/2026): el juego empieza con el mago escribiendo en su escritorio. En el título escribe
// solo, de fondo; al empezar una partida nueva hace preguntas (el nombre, a qué viene y bajo qué signo nació, con
// respuestas hechas) y escribe en rúnico cada vez que pregunta o le contestan: la pluma va de renglón en renglón y lo
// escrito no se puede leer. El nombre queda en la cabecera del pergamino, pasado a runas. Al terminar la cámara se
// pone desde arriba, entra al pergamino, todo queda en negro y empieza la partida.
// La escena es la de la ilustración «El mago escribe las notas»: se dibuja en un lienzo virtual de 1600 × 900 que
// cubre la pantalla.
window.PROLOGO = (function () {
  "use strict";
  const W = 1600,
    H = 900;
  const RUNA = "#4A78D0",
    RUNA2 = "#A9C2F0",
    ORO = "#C9A45A",
    ORO2 = "#FFD98A";
  const t = (k, v) => I18N.t(k, v);
  let lienzo = null,
    c = null,
    activo = false,
    t0 = 0,
    anim = 0;
  const baja = () => window.CALIDAD && CALIDAD.nivel === "baja";

  // lo que hay escrito: la cabecera (el nombre en runas) y los renglones terminados; el que se escribe ahora avanza
  const est = { cabecera: [], hechos: 0, prog: 0, escribe: false, ritmo: 0.55, cam: null };

  function P(pts, f, al) {
    if (al != null) c.globalAlpha = al;
    c.fillStyle = f;
    c.beginPath();
    pts.forEach((v, i) => (i ? c.lineTo(v[0], v[1]) : c.moveTo(v[0], v[1])));
    c.closePath();
    c.fill();
    if (al != null) c.globalAlpha = 1;
  }
  function rnd(seed) {
    let a = seed;
    return () => (a = (a * 1664525 + 1013904223) % 4294967296) / 4294967296;
  }
  function luz(x, y, r, rgb, a) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(" + rgb + "," + a + ")");
    g.addColorStop(1, "rgba(" + rgb + ",0)");
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const RUNAS = {
    kenaz: [[[0.4, -0.9], [-0.4, 0], [0.4, 0.9]]],
    isa: [[[0, -1], [0, 1]]],
    laguz: [[[-0.3, 1], [-0.3, -1], [0.45, -0.4]]],
    eihwaz: [[[0, -1], [0, 1]], [[0, -1], [0.45, -0.6]], [[0, 1], [-0.45, 0.6]]],
    ansuz: [[[-0.3, 1], [-0.3, -1]], [[-0.3, -1], [0.4, -0.55]], [[-0.3, -0.45], [0.4, 0]]],
    algiz: [[[0, 1], [0, -1]], [[0, -0.2], [-0.5, -0.9]], [[0, -0.2], [0.5, -0.9]]],
    dagaz: [[[-0.6, -0.8], [0.6, 0.8], [0.6, -0.8], [-0.6, 0.8], [-0.6, -0.8]]],
  };
  function runa(nom, x, y, s, a, rot, sx) {
    c.save();
    c.translate(x, y);
    c.rotate(rot || 0);
    c.scale(s * (sx || 1), s);
    c.lineCap = "round";
    c.lineJoin = "round";
    if (!baja()) {
      c.shadowColor = RUNA;
      c.shadowBlur = 18 * a;
    }
    c.strokeStyle = RUNA;
    c.globalAlpha = a;
    c.lineWidth = 0.32;
    RUNAS[nom].forEach((tr) => {
      c.beginPath();
      tr.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
      c.stroke();
    });
    c.shadowBlur = 0;
    c.strokeStyle = RUNA2;
    c.lineWidth = 0.12;
    RUNAS[nom].forEach((tr) => {
      c.beginPath();
      tr.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
      c.stroke();
    });
    c.restore();
  }

  // ---------- el nombre pasado a runas ----------
  const LETRA = { a: "ansuz", b: "berkano", c: "kenaz", d: "dagaz", e: "ehwaz", f: "fehu", g: "gebo", h: "hagalaz", i: "isa", j: "jera", k: "kenaz", l: "laguz", m: "mannaz", n: "naudiz", ñ: "naudiz", o: "othala", p: "perthro", q: "kenaz", r: "raidho", s: "sowilo", t: "tiwaz", u: "uruz", v: "wunjo", w: "wunjo", x: "kenaz", y: "jera", z: "algiz" };
  function aRunas(nombre) {
    return [...nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")]
      .map((ch) => (ch === " " ? " " : LETRA[ch] || null))
      .filter(Boolean)
      .slice(0, 16);
  }

  // ---------- la cabaña (igual que la ilustración) ----------
  function fondo(tt) {
    c.fillStyle = "#111111";
    c.fillRect(0, 0, W, H);
    const r = rnd(7);
    for (let x = -20, i = 0; x < W; i++) {
      const w = 90 + r() * 50;
      const tono = i % 3 === 0 ? "#1E0E0B" : i % 3 === 1 ? "#190C0A" : "#22110D";
      P([[x, 0], [x + w, 0], [x + w - 4, H], [x + 4, H]], tono);
      P([[x + w - 6, 0], [x + w, 0], [x + w - 4, H], [x + w - 10, H]], "#0E0707");
      x += w;
    }
    P([[0, 96], [W, 80], [W, 132], [0, 150]], "#2A120E");
    P([[0, 140], [W, 122], [W, 132], [0, 150]], "#0E0707");
    // ventana con noche y luna
    c.save();
    c.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.39;
      c.lineTo(1150 + Math.cos(a) * 112, 300 + Math.sin(a) * 112);
    }
    c.closePath();
    c.fillStyle = "#5E130D";
    c.fill();
    c.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.39,
        px = 1150 + Math.cos(a) * 92,
        py = 300 + Math.sin(a) * 92;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath();
    c.fillStyle = "#14182A";
    c.fill();
    c.clip();
    P([[1040, 340], [1100, 300], [1150, 330], [1210, 280], [1270, 330], [1270, 420], [1040, 420]], "#0C0E1A");
    P([[1110, 330], [1150, 330], [1210, 280], [1180, 330]], "#1A2038");
    c.fillStyle = "#F2ECEC";
    c.globalAlpha = 0.9;
    c.beginPath();
    c.arc(1182, 262, 22, 0, 7);
    c.fill();
    c.fillStyle = "#14182A";
    c.beginPath();
    c.arc(1172, 255, 20, 0, 7);
    c.fill();
    c.globalAlpha = 1;
    const re = rnd(3);
    for (let i = 0; i < 14; i++) {
      c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(tt / 900 + i));
      c.fillStyle = "#F2ECEC";
      c.fillRect(1070 + re() * 160, 220 + re() * 100, 2, 2);
    }
    c.globalAlpha = 1;
    c.restore();
    P([[1146, 208], [1154, 208], [1154, 392], [1146, 392]], "#5E130D");
    P([[1058, 296], [1242, 296], [1242, 304], [1058, 304]], "#5E130D");
    // estandarte de cola de golondrina con la E
    const sw = Math.sin(tt / 1400) * 4;
    P([[150, 150], [330, 150], [330, 520 + sw], [240, 470 + sw], [150, 520 + sw]], "#9C2315");
    P([[150, 150], [190, 150], [190, 500 + sw], [150, 520 + sw]], "#5E130D");
    P([[136, 140], [344, 140], [344, 156], [136, 156]], ORO);
    P([[160, 176], [320, 176], [320, 182], [160, 182]], ORO2, 0.55);
    P([[205, 240], [285, 240], [272, 262], [232, 262], [232, 290], [272, 290], [262, 310], [232, 310], [232, 342], [285, 342], [272, 364], [205, 364]], "#F2ECEC");
    P([[205, 240], [218, 240], [218, 364], [205, 364]], "#E0B2B2");
    // repisa con libros y el frasco con la runa
    P([[1330, 430], [1560, 430], [1560, 446], [1330, 446]], "#44100A");
    P([[1330, 446], [1560, 446], [1556, 456], [1334, 456]], "#1A0806");
    const lib = [["#9C2315", 30, 110], ["#E0B2B2", 24, 96], ["#5E130D", 34, 120], ["#C8402D", 22, 88], ["#F2ECEC", 28, 104]];
    let lx = 1344;
    lib.forEach(([col, w, h]) => {
      P([[lx, 430 - h], [lx + w, 430 - h], [lx + w, 430], [lx, 430]], col);
      P([[lx, 430 - h], [lx + 6, 430 - h], [lx + 6, 430], [lx, 430]], "rgba(0,0,0,0.25)");
      P([[lx + 4, 430 - h + 18], [lx + w - 4, 430 - h + 18], [lx + w - 4, 430 - h + 24], [lx + 4, 430 - h + 24]], ORO, 0.8);
      lx += w + 3;
    });
    P([[lx + 6, 430], [lx + 30, 318], [lx + 52, 324], [lx + 30, 430]], "#9C2315");
    const fx = 1530,
      fy = 400;
    luz(fx, fy, 70, "74,120,208", 0.35 + 0.1 * Math.sin(tt / 500));
    P([[fx - 18, fy - 34], [fx + 18, fy - 34], [fx + 24, fy + 30], [fx - 24, fy + 30]], "rgba(169,194,240,0.18)");
    P([[fx - 12, fy - 44], [fx + 12, fy - 44], [fx + 12, fy - 34], [fx - 12, fy - 34]], "#5E130D");
    runa("algiz", fx, fy + 2, 14, 0.9);
  }

  // ---------- el escritorio ----------
  const TOP = { bi: [230, 588], bd: [1370, 588], fd: [1500, 770], fi: [100, 770] };
  const NOMBRES_TALLA = ["ansuz", "kenaz", "isa", "laguz", "eihwaz", "algiz", "dagaz", "kenaz", "laguz", "ansuz", "isa", "eihwaz"];
  function escritorio(tt) {
    P([[220, 588], [1380, 588], [1400, 610], [200, 610]], "rgba(0,0,0,0.5)");
    const L = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
    for (let i = 0; i < 6; i++) {
      const u0 = i / 6,
        u1 = (i + 1) / 6;
      P([L(TOP.bi, TOP.bd, u0), L(TOP.bi, TOP.bd, u1), L(TOP.fi, TOP.fd, u1), L(TOP.fi, TOP.fd, u0)], ["#5E130D", "#561109", "#661610", "#5A120B", "#63150E", "#58110A"][i]);
      P([L(TOP.bi, TOP.bd, u1), L(TOP.bi, TOP.bd, u1 + 0.002), L(TOP.fi, TOP.fd, u1 + 0.002), L(TOP.fi, TOP.fd, u1)], "#2A0806");
    }
    P([[100, 770], [1500, 770], [1500, 790], [100, 790]], "#7A1D14");
    P([[100, 790], [1500, 790], [1480, 900], [120, 900]], "#3A0C08");
    P([[100, 790], [1500, 790], [1500, 800], [100, 800]], "#2A0806");
    for (let i = 0; i < NOMBRES_TALLA.length; i++) {
      const x = 190 + i * 111,
        a = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(tt / 700 - i * 0.6));
      P([[x - 30, 816], [x + 30, 816], [x + 30, 880], [x - 30, 880]], "#2A0806");
      runa(NOMBRES_TALLA[i], x, 848, 22, a);
    }
    P([[150, 812], [1450, 812], [1450, 815], [150, 815]], RUNA, 0.35);
    P([[150, 884], [1450, 884], [1450, 887], [150, 887]], RUNA, 0.35);
  }

  // ---------- el pergamino: lo que escribe el mago, en runas (al revés para quien mira: de frente al mago) ----------
  const PG = { a: [520, 606], b: [1010, 600], cc: [1070, 760], d: [462, 768] };
  function q(u, v) {
    const tx = PG.a[0] + (PG.b[0] - PG.a[0]) * u,
      ty = PG.a[1] + (PG.b[1] - PG.a[1]) * u,
      bx = PG.d[0] + (PG.cc[0] - PG.d[0]) * u,
      by = PG.d[1] + (PG.cc[1] - PG.d[1]) * u;
    return [tx + (bx - tx) * v, ty + (by - ty) * v];
  }
  const Q = (u, v) => q(1 - u, 1 - v);
  const VS = [0.27, 0.36, 0.45, 0.6, 0.69, 0.78, 0.87];
  const TODAS = ["fehu", "uruz", "thurisaz", "ansuz", "raidho", "kenaz", "gebo", "wunjo", "hagalaz", "naudiz", "isa", "jera", "eihwaz", "perthro", "algiz", "sowilo", "tiwaz", "berkano", "ehwaz", "mannaz", "laguz", "ingwaz", "dagaz", "othala"];
  // cada renglón: runas sueltas con su lugar (u) y huecos entre palabras
  const RENGLONES = (() => {
    const r = rnd(42),
      out = [];
    for (let i = 0; i < VS.length; i++) {
      const glifos = [],
        fin = 0.9 - r() * (i % 3 === 2 ? 0.3 : 0.08);
      let u = 0.12;
      while (u < fin) {
        const n = 2 + Math.floor(r() * 5);
        for (let k = 0; k < n && u < fin; k++) {
          glifos.push([u, TODAS[Math.floor(r() * TODAS.length)]]);
          u += 0.021;
        }
        u += 0.026;
      }
      out.push(glifos);
    }
    return out;
  })();
  // una runa de tinta sobre el pergamino, girada para que la lea el mago
  function tinta(nom, p, h, col) {
    c.save();
    c.translate(p[0], p[1]);
    c.rotate(Math.PI - 0.012);
    FUTHARK.dibujar(c, nom, 0, h * 0.5, h, col, Math.max(1.2, h * 0.14));
    c.restore();
  }
  function renglon(i, hasta, h) {
    const gl = RENGLONES[i % RENGLONES.length];
    let punta = null;
    const tope = gl.length ? gl[0][0] + (gl[gl.length - 1][0] + 0.02 - gl[0][0]) * hasta : 0;
    for (const [u, nom] of gl) {
      if (u >= tope) break;
      tinta(nom, Q(u + 0.01, VS[i] + 0.013), h, "#111111");
      punta = [u + 0.02, VS[i] + 0.026];
    }
    return punta || [gl.length ? gl[0][0] : 0.12, VS[i] + 0.026];
  }
  function pergamino(tt) {
    P([[PG.a[0] + 8, PG.a[1] + 8], [PG.b[0] + 12, PG.b[1] + 8], [PG.cc[0] + 16, PG.cc[1] + 10], [PG.d[0] + 10, PG.d[1] + 12]], "rgba(0,0,0,0.45)");
    P([q(0, 0), q(0.5, 0), q(0.5, 1), q(0, 1)], "#F2ECEC");
    P([q(0.5, 0), q(1, 0), q(1, 1), q(0.5, 1)], "#EADFDF");
    P([q(0, 0.5), q(0.5, 0.5), q(0.5, 1), q(0, 1)], "#EEE4E4");
    P([q(0.75, 0.6), q(1, 0.55), q(1, 1), q(0.8, 1)], "#E0D2D2");
    P([q(0, 0), q(0.03, 0), q(0.03, 1), q(0, 1)], "#E0B2B2", 0.6);
    P([q(0.97, 0), q(1, 0), q(1, 1), q(0.97, 1)], "#E0B2B2", 0.6);
    const rollo = (v, h, cuelga) => {
      const p1 = q(-0.02, v),
        p2 = q(1.02, v),
        p3 = q(1.02, v + h),
        p4 = q(-0.02, v + h);
      P([p1, p2, p3, p4], "#E0B2B2");
      P([p1, p2, [p2[0], p2[1] + (p3[1] - p2[1]) * 0.4], [p1[0], p1[1] + (p4[1] - p1[1]) * 0.4]], "#F2ECEC");
      P([[p4[0], p4[1] - 4], [p3[0], p3[1] - 4], p3, p4], "#C9A0A0");
      [p1, p2].forEach((p, i) => P([[p[0] - 8 + i * 6, p[1] - 2], [p[0] + 2 + i * 6, p[1] - 2], [p[0] + 2 + i * 6, p[1] + (p4[1] - p1[1]) + 4], [p[0] - 8 + i * 6, p[1] + (p4[1] - p1[1]) + 4]], ORO));
      if (cuelga) P([p4, p3, [p3[0] - 4, p3[1] + cuelga], [p4[0] + 4, p4[1] + cuelga]], "#C9A0A0");
    };
    rollo(-0.08, 0.1, 0);
    // la cabecera: el nombre, en runas más grandes
    est.cabecera.forEach((nom, i) => nom !== " " && tinta(nom, Q(0.14 + i * 0.034, 0.15), 15, "#111111"));
    const rp = Q(0.085, 0.13);
    P([[rp[0], rp[1] - 8], [rp[0] + 7, rp[1]], [rp[0], rp[1] + 8], [rp[0] - 7, rp[1]]], RUNA);
    P([Q(0.1, 0.205), Q(0.9, 0.205), Q(0.9, 0.211), Q(0.1, 0.211)], "#9C2315", 0.8);
    // los renglones terminados y el que se escribe
    const n = Math.min(est.hechos, VS.length);
    for (let i = 0; i < n; i++) renglon(i, 1, 9);
    let punta;
    if (est.hechos < VS.length) punta = renglon(est.hechos, est.prog, 9);
    else punta = [0.88, VS[VS.length - 1] + 0.03];
    rollo(0.98, 0.1, 22);
    void tt;
    return Q(punta[0], punta[1]);
  }

  // ---------- la pluma que escribe sola ----------
  function pluma(tt, tip, escribe) {
    const garabato = escribe ? Math.sin(tt / 55) * 2.2 : 0,
      x = tip[0],
      y = tip[1] + garabato - (escribe ? 0 : 10 + Math.sin(tt / 600) * 4);
    luz(x + 190, y - 90, 190, "74,120,208", 0.38);
    c.save();
    c.translate(x, y);
    c.rotate(1.02 + Math.sin(tt / 300) * 0.02);
    c.scale(1.12, 1.12);
    if (!baja()) {
      c.save();
      c.shadowColor = RUNA;
      c.shadowBlur = 30;
      P([[0, 0], [-14, -70], [-30, -260], [-8, -330], [14, -270], [16, -80]], "rgba(74,120,208,0.25)");
      c.restore();
    }
    P([[2, -60], [-26, -120], [-34, -210], [-14, -300], [-2, -320], [4, -200]], "#F2ECEC");
    P([[2, -60], [4, -200], [-2, -320], [18, -290], [26, -200], [16, -110]], "#E0B2B2");
    P([[-26, -120], [-40, -150], [-34, -210]], "#F2ECEC");
    P([[16, -110], [30, -150], [26, -200]], "#C8402D");
    P([[-14, -300], [-24, -290], [-34, -250], [-34, -210]], "#E0B2B2");
    P([[18, -290], [24, -250], [26, -200], [30, -235]], "#9C2315");
    P([[-1.5, -20], [1.5, -20], [1, -318], [-1, -318]], "#C9A0A0");
    P([[-4, -40], [4, -40], [3, -18], [0, 0], [-3, -18]], ORO2);
    P([[0, -40], [4, -40], [3, -18], [0, 0]], ORO);
    P([[-2, -10], [2, -10], [0, 0]], "#111111");
    c.restore();
    for (let i = 0; i < 7; i++) {
      const u = (tt / 1500 + i / 7) % 1,
        gx = x + 200 + Math.sin(i * 2.1 + u * 5) * 50,
        gy = y - 60 - u * 200;
      c.save();
      c.globalAlpha = (1 - u) * 0.9;
      c.translate(gx, gy);
      c.rotate(i + u * 2);
      const s = 4 + (i % 3) * 2;
      P([[0, -s * 1.4], [s, 0], [0, s * 1.4], [-s, 0]], RUNA2);
      c.restore();
    }
  }

  // ---------- lo que hay en el escritorio ----------
  function tintero(x, y) {
    P([[x - 54, y + 26], [x + 60, y + 26], [x + 70, y + 40], [x - 64, y + 40]], "rgba(0,0,0,0.5)");
    P([[x - 46, y - 20], [x + 46, y - 20], [x + 56, y + 6], [x + 46, y + 34], [x - 46, y + 34], [x - 56, y + 6]], "#111111");
    P([[x - 46, y - 20], [x - 10, y - 20], [x - 14, y + 34], [x - 46, y + 34], [x - 56, y + 6]], "#1C1C1C");
    P([[x + 20, y - 14], [x + 30, y - 14], [x + 34, y + 20], [x + 26, y + 20]], "#3A3A3A", 0.9);
    P([[x - 26, y - 44], [x + 26, y - 44], [x + 30, y - 20], [x - 30, y - 20]], "#1C1C1C");
    P([[x - 30, y - 50], [x + 30, y - 50], [x + 30, y - 42], [x - 30, y - 42]], ORO);
    P([[x - 24, y - 52], [x + 24, y - 52], [x + 18, y - 48], [x - 18, y - 48]], "#000000");
    runa("ansuz", x, y + 8, 12, 0.8);
    P([[x + 64, y + 34], [x + 96, y + 30], [x + 110, y + 40], [x + 80, y + 46]], "#111111", 0.85);
  }
  function vela(x, y, tt) {
    const fl = Math.sin(tt / 90) * 0.5 + Math.sin(tt / 37) * 0.5;
    luz(x, y - 120, 360, "255,141,113", 0.22 + 0.03 * fl);
    luz(x, y - 120, 120, "255,217,138", 0.35 + 0.05 * fl);
    P([[x - 50, y + 4], [x + 50, y + 4], [x + 40, y + 20], [x - 40, y + 20]], ORO);
    P([[x - 50, y + 4], [x + 50, y + 4], [x + 44, y - 4], [x - 44, y - 4]], ORO2);
    P([[x - 22, y - 2], [x + 22, y - 2], [x + 22, y - 120], [x - 22, y - 120]], "#F2ECEC");
    P([[x + 6, y - 2], [x + 22, y - 2], [x + 22, y - 120], [x + 6, y - 120]], "#E0D2D2");
    P([[x - 22, y - 120], [x - 12, y - 120], [x - 14, y - 84], [x - 22, y - 92]], "#E0D2D2");
    P([[x + 10, y - 120], [x + 20, y - 120], [x + 18, y - 70], [x + 12, y - 76]], "#F2ECEC");
    P([[x - 1.5, y - 120], [x + 1.5, y - 120], [x + 1, y - 132], [x - 1, y - 132]], "#111111");
    const fx = x + fl * 2;
    P([[fx, y - 172 - fl * 4], [x + 11, y - 140], [x, y - 124], [x - 11, y - 140]], "#FF8D71");
    P([[fx, y - 160 - fl * 3], [x + 6, y - 138], [x, y - 128], [x - 6, y - 138]], ORO2);
  }
  function piedra(x, y, nom, rot, tt, k) {
    const a = 0.55 + 0.4 * (0.5 + 0.5 * Math.sin(tt / 600 + k));
    luz(x, y, 110, "74,120,208", 0.45 * a);
    P([[x - 40, y + 14], [x + 44, y + 12], [x + 50, y + 24], [x - 44, y + 26]], "rgba(0,0,0,0.5)");
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    P([[-38, -6], [-22, -22], [24, -24], [42, -6], [36, 14], [-30, 16]], "#3A3030");
    P([[-22, -22], [24, -24], [42, -6], [-38, -6]], "#4A3E3E");
    P([[-38, -6], [-30, 16], [-10, 16]], "#2A2222");
    c.restore();
    runa(nom, x, y - 6, 11, a, rot, 1.35);
  }
  function libros(x, y, tt) {
    P([[x - 90, y + 30], [x + 100, y + 30], [x + 110, y + 44], [x - 96, y + 44]], "rgba(0,0,0,0.5)");
    P([[x - 90, y], [x + 92, y - 4], [x + 100, y + 30], [x - 84, y + 34]], "#9C2315");
    P([[x - 84, y + 22], [x + 98, y + 18], [x + 100, y + 30], [x - 84, y + 34]], "#5E130D");
    P([[x - 82, y + 6], [x + 90, y + 2], [x + 92, y + 16], [x - 80, y + 20]], "#F2ECEC", 0.9);
    P([[x - 70, y - 40], [x + 80, y - 44], [x + 86, y - 6], [x - 64, y - 2]], "#5E130D");
    P([[x - 64, y - 14], [x + 84, y - 18], [x + 86, y - 6], [x - 64, y - 2]], "#3A0C08");
    P([[x - 70, y - 40], [x + 80, y - 44], [x + 84, y - 30], [x - 68, y - 26]], "#7A1D14");
    P([[x + 50, y - 43], [x + 62, y - 43], [x + 64, y - 6], [x + 52, y - 4]], ORO);
    const a = 0.6 + 0.35 * Math.sin(tt / 650 + 1);
    luz(x, y - 34, 70, "74,120,208", 0.3 * a);
    runa("dagaz", x - 2, y - 34, 9, a, 0, 1.6);
  }

  // la escena de frente, como la ilustración
  function deFrente(tt) {
    fondo(tt);
    luz(800, 640, 620, "74,120,208", 0.16);
    window.MAGO(c, 790, 372, 0.86, { k: "R", t: tt, eye: "calm", glow: est.escribe ? 0.6 : 0.4, m: { staff: 0, book: 0, sombra: 0 } });
    escritorio(tt);
    libros(1250, 630, tt);
    const tip = pergamino(tt);
    vela(300, 690, tt);
    piedra(190, 742, "kenaz", -0.12, tt, 0);
    piedra(410, 742, "isa", 0.1, tt, 1.7);
    piedra(1390, 742, "laguz", -0.06, tt, 3.1);
    tintero(1140, 718);
    pluma(tt, tip, est.escribe);
  }

  // ---------- la escena desde arriba: el escritorio visto en planta, con el pergamino en el medio ----------
  const PL = { x0: 500, y0: 90, x1: 1100, y1: 820 }; // el pergamino en planta
  function desdeArriba(tt) {
    c.fillStyle = "#3A0C08";
    c.fillRect(0, 0, W, H);
    for (let i = 0; i < 9; i++) {
      const y = i * 104 - 20;
      P([[0, y], [W, y + 6], [W, y + 100], [0, y + 96]], ["#5E130D", "#561109", "#661610", "#5A120B", "#63150E"][i % 5]);
      P([[0, y + 96], [W, y + 100], [W, y + 104], [0, y + 100]], "#2A0806");
    }
    // la vela vista desde arriba
    luz(250, 640, 300, "255,141,113", 0.25);
    c.fillStyle = ORO;
    c.beginPath();
    c.arc(250, 640, 58, 0, 7);
    c.fill();
    c.fillStyle = "#F2ECEC";
    c.beginPath();
    c.arc(250, 640, 28, 0, 7);
    c.fill();
    luz(250, 640, 60, "255,217,138", 0.8);
    // el tintero y las piedras
    c.fillStyle = "#111111";
    c.beginPath();
    c.arc(1290, 600, 52, 0, 7);
    c.fill();
    c.strokeStyle = ORO;
    c.lineWidth = 6;
    c.beginPath();
    c.arc(1290, 600, 30, 0, 7);
    c.stroke();
    [[200, 820, "kenaz"], [1380, 780, "laguz"], [380, 840, "isa"]].forEach(([x, y, nom], k) => {
      P(DIB.poli(x, y, 46, 34, 7, k), "#3A3030");
      runa(nom, x, y, 14, 0.7 + 0.25 * Math.sin(tt / 600 + k));
    });
    // el borde del sombrero y la barba del mago, arriba
    P([[560, -40], [1040, -40], [980, 40], [620, 40]], "#9C2315");
    P([[640, 30], [960, 30], [900, 80], [700, 80]], "#F2ECEC");
    // el pergamino plano
    P([[PL.x0 + 14, PL.y0 + 16], [PL.x1 + 18, PL.y0 + 16], [PL.x1 + 18, PL.y1 + 18], [PL.x0 + 14, PL.y1 + 18]], "rgba(0,0,0,0.45)");
    P([[PL.x0, PL.y0], [PL.x1, PL.y0], [PL.x1, PL.y1], [PL.x0, PL.y1]], "#F2ECEC");
    P([[(PL.x0 + PL.x1) / 2, PL.y0], [PL.x1, PL.y0], [PL.x1, PL.y1], [(PL.x0 + PL.x1) / 2, PL.y1]], "#EADFDF");
    [PL.y0 - 30, PL.y1 - 8].forEach((y) => {
      P([[PL.x0 - 14, y], [PL.x1 + 14, y], [PL.x1 + 14, y + 38], [PL.x0 - 14, y + 38]], "#E0B2B2");
      P([[PL.x0 - 24, y - 2], [PL.x0 - 8, y - 2], [PL.x0 - 8, y + 40], [PL.x0 - 24, y + 40]], ORO);
      P([[PL.x1 + 8, y - 2], [PL.x1 + 24, y - 2], [PL.x1 + 24, y + 40], [PL.x1 + 8, y + 40]], ORO);
    });
    // lo escrito, mirando hacia el mago (al revés para quien mira)
    const en = (u, v) => [PL.x1 - u * (PL.x1 - PL.x0), PL.y1 - v * (PL.y1 - PL.y0)];
    est.cabecera.forEach((nom, i) => nom !== " " && tinta(nom, en(0.14 + i * 0.034, 0.15), 30, "#111111"));
    const a = en(0.1, 0.205),
      b = en(0.9, 0.211);
    P([[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]]], "#9C2315", 0.8);
    for (let i = 0; i < Math.min(est.hechos, VS.length); i++) for (const [u, nom] of RENGLONES[i]) tinta(nom, en(u + 0.01, VS[i] + 0.013), 20, "#111111");
  }

  // ---------- el cuadro: elige la escena y la cámara ----------
  function cuadro(ahora) {
    if (!activo) return;
    const tt = ahora - t0,
      dt = Math.min(0.05, (ahora - (cuadro.antes || ahora)) / 1000);
    cuadro.antes = ahora;
    // la pluma avanza mientras el mago escribe; al terminar un renglón pasa al siguiente
    if (est.escribe) {
      est.prog += dt * est.ritmo;
      if (est.prog >= 1) {
        est.prog = 0;
        est.hechos++;
        if (est.parar && --est.parar <= 0) est.escribe = false;
        if (est.solo && est.hechos >= VS.length) est.hechos = 0; // en el título vuelve a empezar la hoja
      }
    }
    const cw = lienzo.width,
      ch = lienzo.height,
      k = Math.max(cw / W, ch / H);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#000";
    c.fillRect(0, 0, cw, ch);
    const base = () => c.setTransform(k, 0, 0, k, (cw - W * k) / 2, (ch - H * k) / 2);
    const cam = est.cam;
    if (!cam) {
      base();
      deFrente(tt);
    } else {
      cam.t += dt;
      const p1 = Math.min(1, cam.t / 1.6),
        p2 = Math.max(0, Math.min(1, (cam.t - 1.6) / 1.9)),
        e1 = 1 - Math.pow(1 - p1, 3);
      // 1) la cámara sube y se acerca: la vista de frente se aplasta hacia el pergamino y se funde con la de arriba
      if (p1 < 1) {
        base();
        const cx = 766,
          cy = 684;
        c.translate(cx, cy);
        c.scale(1 + e1 * 0.9, 1 + e1 * 1.6);
        c.translate(-cx, -cy - e1 * 120);
        deFrente(tt);
      }
      if (p1 > 0.45) {
        base();
        c.globalAlpha = Math.min(1, (p1 - 0.45) / 0.55);
        // 2) desde arriba: entra al pergamino hasta pegarse
        const z = Math.pow(16, p2 * p2),
          cx = 800,
          cy = (PL.y0 + PL.y1) / 2;
        c.translate(cx, cy);
        c.scale(z, z);
        c.translate(-cx, -cy);
        desdeArriba(tt);
        c.globalAlpha = 1;
      }
      // 3) el negro
      const negro = Math.max(0, Math.min(1, (cam.t - 2.9) / 0.6));
      if (negro > 0) {
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.globalAlpha = negro;
        c.fillStyle = "#000";
        c.fillRect(0, 0, cw, ch);
        c.globalAlpha = 1;
      }
      if (cam.t > 3.8 && !cam.listo) {
        cam.listo = true;
        cam.fin && cam.fin();
      }
    }
    // viñeta
    if (!est.cam) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      const v = c.createRadialGradient(cw / 2, ch * 0.53, Math.min(cw, ch) * 0.45, cw / 2, ch * 0.53, Math.max(cw, ch) * 0.66);
      v.addColorStop(0, "rgba(0,0,0,0)");
      v.addColorStop(1, "rgba(0,0,0,0.7)");
      c.fillStyle = v;
      c.fillRect(0, 0, cw, ch);
    }
    anim = requestAnimationFrame(cuadro);
  }

  function armarLienzo() {
    if (lienzo) return;
    lienzo = document.createElement("canvas");
    lienzo.id = "prologoLienzo";
    lienzo.className = "prologo-lienzo";
    const capa = document.getElementById("capa");
    capa.parentNode.insertBefore(lienzo, capa);
    c = lienzo.getContext("2d");
    const medir = () => {
      const k = Math.min(2, devicePixelRatio || 1) * (baja() ? 0.6 : 1);
      lienzo.width = Math.round(innerWidth * k);
      lienzo.height = Math.round(innerHeight * k);
    };
    addEventListener("resize", medir);
    medir();
  }
  // el título: el mago escribe solo, de fondo
  function mostrar() {
    armarLienzo();
    lienzo.style.display = "block";
    Object.assign(est, { cabecera: aRunas("Eromash"), hechos: 2, prog: 0, escribe: true, ritmo: 0.28, cam: null, solo: true, parar: 0 });
    if (!activo) {
      activo = true;
      t0 = performance.now();
      cuadro.antes = 0;
      anim = requestAnimationFrame(cuadro);
    }
  }
  function ocultar() {
    activo = false;
    cancelAnimationFrame(anim);
    if (lienzo) lienzo.style.display = "none";
  }

  // ---------- las preguntas ----------
  const NOMBRES = ["Astrid", "Bjorn", "Sigrid", "Halvar", "Freydis", "Ragnvald", "Ingrid", "Torstein", "Gunnhild", "Leif", "Solveig", "Ketil"];
  const SIGNOS = ["fehu", "algiz", "kenaz", "laguz"];
  const MOTIVOS = ["respuestas", "acero", "perdido"];
  // el mago dice algo y escribe un renglón mientras lo dice
  function dice(clave, vars, botones, extra) {
    est.escribe = true;
    est.solo = false;
    est.ritmo = 0.6;
    est.parar = 1;
    HUD.abrir(`<div class="mago-quien">${t("pl.mago")}</div><p class="mago-linea">${t(clave, vars)}</p>${extra || ""}`, botones, { clase: "prologo" });
  }
  // pregunta el nombre con un campo de texto (y uno al azar para quien juega con mando o en el celular)
  function preguntarNombre(sigue) {
    let azar = NOMBRES[Math.floor(Math.random() * NOMBRES.length)];
    const listo = () => {
      const el = document.getElementById("magoNombre"),
        v = ((el && el.value) || "").trim().slice(0, 16);
      sigue(v || azar);
    };
    dice("pl.nombre", null, [
      { texto: t("pl.escribir"), fn: listo },
      { texto: t("pl.azar"), fn: () => {
        azar = NOMBRES[Math.floor(Math.random() * NOMBRES.length)];
        const el = document.getElementById("magoNombre");
        if (el) el.value = azar;
      } },
    ], `<input id="magoNombre" class="mago-campo" maxlength="16" autocomplete="off" spellcheck="false" placeholder="${azar}">`);
    const el = document.getElementById("magoNombre");
    if (el) {
      if (!CONTROLES.mando()) el.focus();
      el.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key === "Enter") listo();
      });
      el.addEventListener("keyup", (e) => e.stopPropagation());
    }
  }
  // la conversación entera; al final la cámara entra al pergamino y llama a alFin con lo que se contestó
  function preguntas(alFin) {
    mostrar();
    Object.assign(est, { cabecera: [], hechos: 0, prog: 0, escribe: false, solo: false });
    const datos = {};
    const seguir = (fn) => [{ texto: t("pl.seguir"), fn }];
    const hola = () => dice("pl.hola_1", null, seguir(hola2));
    const hola2 = () => dice("pl.hola_2", null, seguir(nombre));
    const nombre = () =>
      preguntarNombre((n) => {
        datos.nombre = n;
        est.cabecera = aRunas(n);
        dice("pl.nombre_ok", [n], seguir(motivo));
      });
    const motivo = () =>
      dice("pl.motivo", null, MOTIVOS.map((m) => ({ texto: t("pl.motivo_" + m), fn: () => {
        datos.motivo = m;
        dice("pl.motivo_ok_" + m, null, seguir(signo));
      } })));
    const signo = () =>
      dice("pl.signo", null, SIGNOS.map((sg) => ({ texto: t("pl.signo_" + sg), fn: () => {
        datos.signo = sg;
        dice("pl.final", [datos.nombre], [{ texto: t("pl.empezar"), fn: () => entrar(() => alFin(datos)) }]);
      } })));
    hola();
  }
  // la cámara sube, entra al pergamino y queda en negro
  function entrar(fin) {
    HUD.cerrar();
    est.escribe = false;
    est.hechos = Math.max(est.hechos, 5);
    est.cam = { t: 0, fin: () => {
      // el negro se queda un instante sobre el bosque y se abre despacio
      const f = document.getElementById("fundido");
      if (f) {
        f.style.transition = "none";
        f.classList.add("on");
        void f.offsetWidth;
        f.style.transition = "";
      }
      fin();
      ocultar();
      setTimeout(() => f && f.classList.remove("on"), 250);
    } };
  }

  return { mostrar, ocultar, preguntas, aRunas };
})();
