// ---------- todo girable: volúmenes que se ven bien desde cualquier lado (módulo VOL) ----------
// Regla de Alejandro (24/10/2026): todo tiene que estar hecho para que la cámara pueda girar, aunque en el juego no
// gire nunca, y en el editor siempre se tiene que poder girar. Por eso nada se dibuja «de frente» sin más: lo que
// está parado se arma con caras (cajas, prismas, techos, postes), cada cara mira a un lado del mundo y se pinta solo
// si mira a la cámara; la gente y las criaturas eligen su vista según hacia dónde miran en el mundo y cómo está
// girada la cámara; lo del piso va en coordenadas del mundo y gira con el piso.
//
// El mundo: x a la derecha, y hacia abajo de la pantalla (hacia la cámara), z para arriba. El piso del juego se ve
// aplanado (K = 0,8, el mismo 1,25 de combate.js y del movimiento): un metro hacia el fondo ocupa 0,8 en pantalla.
// La cámara gira VOL.cam.g radianes alrededor de la vertical (positivo = el mundo gira a favor del reloj en el
// piso); el anfitrión (juego, editor, catálogo) la pone antes de dibujar.
//
// Un asset con `vol: true` en su LISTA recibe o.fi (su giro sobre el piso más el de la cámara, en radianes) y arma
// su proyector con VOL.pr(x, y, o): pr(u, w, z) → [x, y] en pantalla, con u a lo ancho del objeto, w hacia su
// frente (la cara que mira a la cámara cuando no hay giro) y z para arriba, todo en unidades del mundo (sin
// aplanar). La luz viene siempre de arriba a la derecha de la PANTALLA: la cara que mira a la derecha va clara, la
// que mira a la izquierda en sombra, la de arriba clara y la de frente en su color.
window.VOL = (function () {
  "use strict";
  const K = 0.8,
    cam = { g: 0 },
    TAU = Math.PI * 2;
  const rad = (d) => (d * Math.PI) / 180;

  // ---------- el giro del mundo ----------
  // un desplazamiento en el piso del mundo (dx, dy) → en pantalla con la cámara girada g
  function girar(dx, dy, g = cam.g) {
    if (!g) return [dx, dy];
    const co = Math.cos(g),
      si = Math.sin(g),
      py = dy / K;
    return [dx * co - py * si, (dx * si + py * co) * K];
  }
  const desgirar = (dx, dy, g = cam.g) => girar(dx, dy, -g);
  // la matriz del piso girado (para c.transform): [a, b, c, d]
  function matriz(g = cam.g) {
    const co = Math.cos(g),
      si = Math.sin(g);
    return [co, K * si, -si / K, co];
  }
  // gira el lienzo para dibujar lo del piso alrededor de (cx, cy)
  function piso(c, cx, cy, g = cam.g) {
    if (!g) return;
    const m = matriz(g);
    c.translate(cx, cy);
    c.transform(m[0], m[1], m[2], m[3], 0, 0);
    c.translate(-cx, -cy);
  }
  // la vista de un punto del mundo alrededor de un centro, y al revés
  const vista = (x, y, cx, cy, g = cam.g) => {
    if (!g) return [x, y];
    const [dx, dy] = girar(x - cx, y - cy, g);
    return [cx + dx, cy + dy];
  };
  const mundo = (x, y, cx, cy, g = cam.g) => {
    if (!g) return [x, y];
    const [dx, dy] = girar(x - cx, y - cy, -g);
    return [cx + dx, cy + dy];
  };
  // cuánto queda hacia la cámara un punto (para ordenar de atrás hacia adelante)
  const fondo = (x, y, g = cam.g) => (g ? x * Math.sin(g) * K + y * Math.cos(g) : y);
  // el giro de un objeto: lo que pidió el editor (o.giro, en grados) más la cámara
  const fiDe = (o) => (o && o.fi != null ? o.fi : rad((o && o.giro) || 0) + cam.g);

  // ---------- colores: cada cara con su tono ----------
  const cache = new Map();
  function hex(c) {
    if (c[0] !== "#") return null;
    const n = c.length === 4 ? c.slice(1).replace(/./g, (x) => x + x) : c.slice(1, 7);
    return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
  }
  function mezcla(a, b, t) {
    const k = a + "|" + b + "|" + t;
    let r = cache.get(k);
    if (r) return r;
    const x = hex(a),
      y = hex(b);
    if (!x || !y) return a;
    r = "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
    cache.set(k, r);
    return r;
  }
  // los tres tonos de un color: [sombra, base, luz] (o los que se pasen)
  function tonos(col) {
    if (Array.isArray(col)) return col.length >= 3 ? col : [col[0], col[0], col[1] || col[0]];
    if (col && typeof col === "object") return [col.sombra || col.base, col.base, col.luz || col.base, col.tapa];
    return [mezcla(col, "#000000", 0.3), col, mezcla(col, "#FFFFFF", 0.13)];
  }
  // el tono de una cara según hacia dónde mira en pantalla: nx (de -1 izquierda a 1 derecha) y nz (1 = para arriba)
  function tono(col, nx, nz) {
    const t = tonos(col);
    if (nz > 0.6) return t[3] || t[2];
    if (nx > 0.38) return t[2];
    if (nx < -0.38) return t[0];
    return t[1];
  }

  // ---------- el proyector de un objeto ----------
  // pr(u, w, z): u a lo ancho, w hacia el frente, z arriba, en unidades del mundo. op: { fi, esp, s, su, sw, sz }
  function proyector(x, y, fi = 0, op = {}) {
    const co = Math.cos(fi),
      si = Math.sin(fi),
      e = op.esp ? -1 : 1,
      s = op.s || 1,
      su = s * (op.su || 1) * e,
      sw = s * (op.sw || 1),
      sz = s * (op.sz || 1);
    const pr = (u, w, z = 0) => {
      const uu = u * su,
        ww = w * sw;
      return [x + uu * co - ww * si, y + (uu * si + ww * co) * K - z * sz];
    };
    Object.assign(pr, { x, y, fi, co, si, e, s, su, sw, sz });
    // hacia dónde mira en pantalla una dirección del objeto (nu, nw): [derecha, hacia la cámara]
    pr.mira = (nu, nw) => [nu * e * co - nw * si, nu * e * si + nw * co];
    // lo que tiene adelante: cuánto queda hacia la cámara un punto del objeto (para ordenar sus partes)
    pr.hondo = (u, w) => u * su * si + w * sw * co;
    return pr;
  }
  // el de un asset con sus opciones (o.fi, o.s, o.esp, o.eu, o.ez)
  const pr = (x, y, o = {}, s) => proyector(x, y, fiDe(o), { esp: o.esp, s: s != null ? s : o.s || 1, su: o.eu, sz: o.ez });

  // lo que va de punta a punta (empalizadas, murallas, puentes, cercas): las dos puntas ya llegan en la vista (el
  // anfitrión las gira con el piso), así que el giro sale de ellas y no se le suma la cámara. u va de (x, y) a
  // (x2, y2) y pr.largo es el largo en el piso; w queda hacia el lado que mira a la cámara cuando va de izquierda a
  // derecha
  function prSeg(x, y, x2, y2, o = {}) {
    const dx = x2 - x,
      dy = (y2 - y) / K,
      k = o.s || 1,
      p = proyector(x, y, Math.atan2(dy, dx), { sz: k * (o.ez || 1) });
    // lo largo va en unidades del mundo; lo ancho y lo alto, con el tamaño del asset (pr.k)
    p.largo = Math.hypot(dx, dy);
    p.k = k;
    p.s = k;
    return p;
  }

  // ---------- caras ----------
  function area(pts) {
    let a = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i],
        q = pts[(i + 1) % pts.length];
      a += p[0] * q[1] - q[0] * p[1];
    }
    return a;
  }
  function trazar(c, pts) {
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath();
  }
  // la normal hacia afuera de una cara de puntos [u, w, z] dados como se la ve desde afuera (abajo a la izquierda,
  // abajo a la derecha, arriba a la derecha…)
  function normal(p) {
    const a = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]],
      b = [p[p.length - 1][0] - p[0][0], p[p.length - 1][1] - p[0][1], p[p.length - 1][2] - p[0][2]];
    // b × a, con w hacia la cámara
    const n = [b[1] * a[2] - b[2] * a[1], b[2] * a[0] - b[0] * a[2], b[0] * a[1] - b[1] * a[0]];
    const l = Math.hypot(n[0], n[1], n[2]) || 1;
    return [n[0] / l, n[1] / l, n[2] / l];
  }
  // da vuelta la cara si su normal no va hacia d = [u, w, z]
  function afuera(p, d) {
    const n = normal(p);
    if (n[0] * d[0] + n[1] * d[1] + n[2] * d[2] < 0) p.reverse();
    return p;
  }
  // una cara: se pinta solo si mira a la cámara. col: color o [sombra, base, luz]. fn(c, largo, alto): lo que lleva
  // pintado, dibujado como si se la viera de frente (de 0 a largo, el borde de abajo en 0 y para arriba negativo).
  // Devuelve si se vio.
  function cara(c, pr, p, col, fn) {
    const s = p.map((q) => pr(q[0], q[1], q[2]));
    if (area(s) * pr.e >= -0.01) return false;
    const n = normal(p),
      [nx] = pr.mira(n[0], n[1]);
    if (col) {
      trazar(c, s);
      c.fillStyle = typeof col === "function" ? col(nx, n[2]) : tono(col, nx, n[2]);
      c.fill();
    }
    if (fn) enCara(c, s, fn, nx, n[2]);
    return true;
  }
  // pinta fn sobre la cara proyectada s (puntos en pantalla): s[0] es el origen, s[1] el largo y el último el alto
  function enCara(c, s, fn, nx, nz) {
    const o = s[0],
      a = s[1],
      b = s[s.length - 1],
      ax = a[0] - o[0],
      ay = a[1] - o[1],
      bx = b[0] - o[0],
      by = b[1] - o[1];
    c.save();
    // de lado la cara queda muy angosta: no vale la pena pintarle nada
    if (Math.abs(ax * by - ay * bx) < 4) return c.restore();
    c.transform(ax, ay, -bx, -by, o[0], o[1]);
    // la unidad: fn dibuja en 0..1 de largo y -1..0 de alto; se escala a las medidas reales del objeto
    fn(c, nx || 0, nz || 0);
    c.restore();
  }
  // lo mismo con medidas: fn(c, largo, alto, nx) dibuja en 0..largo × -alto..0
  const medida = (largo, alto, fn) => (c, nx, nz) => {
    c.scale(1 / largo, 1 / alto);
    fn(c, largo, alto, nx, nz);
  };

  // ---------- sólidos ----------
  // una caja de u0..u1 × w0..w1 × z0..z1. col: color o tonos; op: { tapa, frente, atras, der, izq, arriba } con
  // colores o fn(c, largo, alto, nx) para pintar lo de cada cara (como si se la viera de frente)
  function caja(c, pr, u0, w0, z0, u1, w1, z1, col, op) {
    op = op || {};
    const lado = (k, l, h) => (op[k] ? medida(l, h, op[k]) : null),
      cc = (k) => op["col_" + k] || col;
    const wu = u1 - u0,
      ww = w1 - w0,
      hz = z1 - z0;
    // primero las de atrás (solo se ven si la cámara da la vuelta), después los costados y el frente
    cara(c, pr, [[u1, w0, z0], [u0, w0, z0], [u0, w0, z1], [u1, w0, z1]], cc("atras"), lado("atras", wu, hz));
    cara(c, pr, [[u0, w0, z0], [u0, w1, z0], [u0, w1, z1], [u0, w0, z1]], cc("izq"), lado("izq", ww, hz));
    cara(c, pr, [[u1, w1, z0], [u1, w0, z0], [u1, w0, z1], [u1, w1, z1]], cc("der"), lado("der", ww, hz));
    cara(c, pr, [[u0, w1, z0], [u1, w1, z0], [u1, w1, z1], [u0, w1, z1]], cc("frente"), lado("frente", wu, hz));
    if (!op.sinTapa) cara(c, pr, [[u0, w1, z1], [u1, w1, z1], [u1, w0, z1], [u0, w0, z1]], op.tapa || col, lado("arriba", wu, ww));
  }
  // una caja centrada: ancho a, fondo f, alto h, apoyada en z0, con el centro de la planta en (u, w)
  const cubo = (c, pr, u, w, a, f, h, col, op, z0 = 0) => caja(c, pr, u - a / 2, w - f / 2, z0, u + a / 2, w + f / 2, z0 + h, col, op);
  // un prisma: la planta es un polígono [[u, w], …] levantado de z0 a z1
  function prisma(c, pr, planta, z0, z1, col, op) {
    op = op || {};
    const n = planta.length;
    let cu = 0,
      cw = 0;
    planta.forEach((p) => ((cu += p[0] / n), (cw += p[1] / n)));
    const paredes = [];
    for (let i = 0; i < n; i++) {
      let a = planta[i],
        b = planta[(i + 1) % n];
      // que la pared mire hacia afuera
      const mu = (a[0] + b[0]) / 2 - cu,
        mw = (a[1] + b[1]) / 2 - cw,
        nu = b[1] - a[1],
        nw = -(b[0] - a[0]);
      if (nu * mu + nw * mw > 0) [a, b] = [b, a];
      paredes.push([[a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]]);
    }
    // de atrás para adelante (las de atrás casi nunca se ven, pero así no tapan a las de adelante)
    paredes.sort((p, q) => pr.hondo((p[0][0] + p[1][0]) / 2, (p[0][1] + p[1][1]) / 2) - pr.hondo((q[0][0] + q[1][0]) / 2, (q[0][1] + q[1][1]) / 2));
    paredes.forEach((p, i) => cara(c, pr, p, op.lados || col, op.pared ? medida(Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]), z1 - z0, op.pared) : null));
    if (!op.sinTapa) {
      // la tapa: sus puntos vistos desde arriba, con el frente abajo
      const t = planta.map((p) => [p[0], p[1], z1]);
      if (area(t.map((q) => [q[0], -q[1]])) < 0) t.reverse();
      cara(c, pr, t, op.tapa || col, null);
    }
  }
  // un cilindro facetado (postes, barriles, troncos parados): n caras, como lo low-poly de la arena
  function cilindro(c, pr, u, w, r, z0, z1, col, op) {
    op = op || {};
    const n = op.n || 8,
      rw = op.rw || r,
      p = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + (op.fase || 0);
      p.push([u + Math.cos(a) * r, w + Math.sin(a) * rw]);
    }
    prisma(c, pr, p, z0, z1, col, op);
  }
  // un tronco acostado a lo largo de u (vigas, troncos caídos): n caras alrededor de su eje
  function rollo(c, pr, u0, u1, w, z, r, col, op = {}) {
    const n = op.n || 7,
      caras = [];
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * TAU,
        a1 = ((i + 1) / n) * TAU,
        p0 = [w + Math.cos(a0) * r, z + Math.sin(a0) * r],
        p1 = [w + Math.cos(a1) * r, z + Math.sin(a1) * r];
      caras.push([[u1, p0[0], p0[1]], [u0, p0[0], p0[1]], [u0, p1[0], p1[1]], [u1, p1[0], p1[1]]]);
    }
    // que cada cara mire hacia afuera del eje
    caras.forEach((q) => afuera(q, [0, (q[0][1] + q[2][1]) / 2 - w, (q[0][2] + q[2][2]) / 2 - z]));
    caras.sort((p, q) => pr.hondo(0, p[0][1]) - pr.hondo(0, q[0][1]) || p[0][2] - q[0][2]);
    caras.forEach((q) => cara(c, pr, q, col));
    // las puntas: el corte del tronco
    const punta = (u, sg) => {
      const pts = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU * sg;
        pts.push([u, w + Math.cos(a) * r, z + Math.sin(a) * r]);
      }
      return pts;
    };
    cara(c, pr, afuera(punta(u1, 1), [1, 0, 0]), op.corte || col);
    cara(c, pr, afuera(punta(u0, 1), [-1, 0, 0]), op.corte || col);
  }
  // un techo a dos aguas sobre u0..u1 × w0..w1 (con el alero ya sumado), desde z con alto h; la cumbrera va a lo
  // largo de u (op.eje = "w" la pone a lo largo de w). op: { hastial: color de los triángulos, faldon: fn }
  function techo(c, pr, u0, w0, u1, w1, z, h, col, op = {}) {
    const hz = z + h;
    if (op.eje === "w") {
      const um = (u0 + u1) / 2;
      cara(c, pr, [[u0, w0, z], [u0, w1, z], [um, w1, hz], [um, w0, hz]], col, op.faldon);
      cara(c, pr, [[u1, w1, z], [u1, w0, z], [um, w0, hz], [um, w1, hz]], col, op.faldon);
      cara(c, pr, [[u1, w0, z], [u0, w0, z], [um, w0, hz]], op.hastial || col, op.frontis);
      cara(c, pr, [[u0, w1, z], [u1, w1, z], [um, w1, hz]], op.hastial || col, op.frontis);
      return;
    }
    const wm = (w0 + w1) / 2;
    cara(c, pr, [[u1, w0, z], [u0, w0, z], [u0, wm, hz], [u1, wm, hz]], col, op.faldon);
    cara(c, pr, [[u0, w0, z], [u0, w1, z], [u0, wm, hz]], op.hastial || col, op.frontis);
    cara(c, pr, [[u1, w1, z], [u1, w0, z], [u1, wm, hz]], op.hastial || col, op.frontis);
    cara(c, pr, [[u0, w1, z], [u1, w1, z], [u1, wm, hz], [u0, wm, hz]], col, op.faldon);
  }
  // una pirámide (o un cono facetado si la planta es redonda): planta [[u, w], …] en z0 y la punta en (pu, pw, z1)
  function piramide(c, pr, planta, z0, pu, pw, z1, col) {
    const n = planta.length,
      caras = [];
    let cu = 0,
      cw = 0;
    planta.forEach((p) => ((cu += p[0] / n), (cw += p[1] / n)));
    for (let i = 0; i < n; i++) {
      let a = planta[i],
        b = planta[(i + 1) % n];
      const mu = (a[0] + b[0]) / 2 - cu,
        mw = (a[1] + b[1]) / 2 - cw;
      if ((b[1] - a[1]) * mu - (b[0] - a[0]) * mw > 0) [a, b] = [b, a];
      caras.push([[a[0], a[1], z0], [b[0], b[1], z0], [pu, pw, z1]]);
    }
    caras.sort((p, q) => pr.hondo(p[0][0] + p[1][0], p[0][1] + p[1][1]) - pr.hondo(q[0][0] + q[1][0], q[0][1] + q[1][1]));
    caras.forEach((q) => cara(c, pr, q, col));
  }
  // la planta redonda de n lados
  const redonda = (u, w, r, n = 8, fase = 0, rw) => Array.from({ length: n }, (_, i) => [u + Math.cos(fase + (i / n) * TAU) * r, w + Math.sin(fase + (i / n) * TAU) * (rw || r)]);
  // un palo de (u0, w0, z0) a (u1, w1, z1), de grosor g: lanzas, mangos, cuerdas tensas
  function palo(c, pr, u0, w0, z0, u1, w1, z1, g, col) {
    const a = pr(u0, w0, z0),
      b = pr(u1, w1, z1);
    c.beginPath();
    c.moveTo(a[0], a[1]);
    c.lineTo(b[0], b[1]);
    c.strokeStyle = Array.isArray(col) ? col[1] : col;
    c.lineWidth = g * pr.s;
    c.lineCap = "round";
    c.stroke();
  }
  // un plano parado (cartel, estandarte, tapiz, puerta suelta) de u0 a u1 en w, de z0 a z1: adelante lleva fn y
  // atrás fnAtras (si no hay, la misma pintura espejada, como una tela vista desde el otro lado)
  function plano(c, pr, u0, u1, w, z0, z1, col, fn, fnAtras, colAtras) {
    const l = u1 - u0,
      h = z1 - z0;
    if (cara(c, pr, [[u0, w, z0], [u1, w, z0], [u1, w, z1], [u0, w, z1]], col, fn ? medida(l, h, fn) : null)) return "frente";
    const atras = fnAtras === undefined ? (fn ? (cc, ll, hh, nx) => (cc.translate(ll, 0), cc.scale(-1, 1), fn(cc, ll, hh, -nx)) : null) : fnAtras;
    cara(c, pr, [[u1, w, z0], [u0, w, z0], [u0, w, z1], [u1, w, z1]], colAtras || col, atras ? medida(l, h, atras) : null);
    return "atras";
  }

  // ---------- en el piso del objeto ----------
  // deja el lienzo en el piso del objeto: (0, 0) en su pie, x a lo ancho y y hacia su frente (las dos sin aplanar)
  // (con z: en un plano a esa altura, como la tapa de una mesa)
  function enPiso(c, pr, fn, z = 0) {
    const o = pr(0, 0, z),
      a = pr(1, 0, z),
      b = pr(0, 1, z);
    c.save();
    c.transform(a[0] - o[0], a[1] - o[1], b[0] - o[0], b[1] - o[1], o[0], o[1]);
    fn(c);
    c.restore();
  }
  // la sombra en el piso: una elipse en la planta del objeto (gira con él); a = opacidad
  function sombra(c, pr, u, w, ru, rw, a = 0.36) {
    enPiso(c, pr, (cc) => {
      cc.beginPath();
      cc.ellipse(u, w, Math.max(0.1, ru), Math.max(0.1, rw), 0, 0, TAU);
      cc.fillStyle = `rgba(0,0,0,${a})`;
      cc.fill();
    });
  }
  // una elipse acostada en (u, w) a la altura z (un pan, un charco, la boca de un cuenco)
  function elipse(c, pr, u, w, z, ru, rw, col) {
    enPiso(
      c,
      pr,
      (cc) => {
        cc.beginPath();
        cc.ellipse(u, w, Math.max(0.1, ru), Math.max(0.1, rw), 0, 0, TAU);
        cc.fillStyle = col;
        cc.fill();
      },
      z,
    );
  }
  // lo que está parado en un punto del objeto (una figura redonda, una llama, un halo): dónde cae en pantalla
  const punto = (pr, u, w, z = 0) => pr(u, w, z);

  // ---------- partes de un objeto, de atrás hacia adelante ----------
  // const S = VOL.escena(pr); S.poner(u, w, fn) ...; S.dibujar() — cada parte se dibuja según cuánto queda hacia la
  // cámara su punto (u, w) (op. z para desempatar)
  function escena(pr) {
    const l = [];
    return {
      poner(u, w, fn, z = 0) {
        l.push({ k: pr.hondo(u, w), z, fn });
        return this;
      },
      dibujar() {
        l.sort((a, b) => a.k - b.k || a.z - b.z);
        l.forEach((p) => p.fn());
      },
    };
  }

  // ---------- la gente y las criaturas: la vista según la cámara ----------
  // Las vistas S (de frente), E (de costado, mirando a la derecha), N (de espaldas) y W (E espejada) son hacia dónde
  // mira en el MUNDO. Con la cámara girada se elige la que corresponde en pantalla.
  const ANG = { S: Math.PI / 2, E: 0, N: -Math.PI / 2, W: Math.PI };
  function relativa(vistaM, espejo, g = cam.g) {
    if (!g || !vistaM) return { vista: vistaM, espejo };
    const v = vistaM === "E" && espejo ? "W" : vistaM;
    const a = ANG[v];
    if (a == null) return { vista: vistaM, espejo };
    const [dx, dy] = girar(Math.cos(a), Math.sin(a) * K, g);
    // en pantalla (en el piso sin aplanar): lo que va más hacia la cámara o hacia el fondo es S o N
    if (Math.abs(dy / K) > Math.abs(dx)) return { vista: dy > 0 ? "S" : "N", espejo: false };
    return { vista: "E", espejo: dx < 0 };
  }
  // un ángulo en el piso (sin aplanar, como e.dir o a.dir de los golpes) visto con la cámara: solo se le suma el giro
  const angulo = (a, g = cam.g) => a + g;
  // una dirección de la pantalla (la palanca, las flechas: x a la derecha, y hacia abajo, en el piso) → en el mundo
  function ejeMundo(e, g = cam.g) {
    if (!g || (!e.x && !e.y)) return e;
    const co = Math.cos(g),
      si = Math.sin(g);
    return Object.assign({}, e, { x: e.x * co + e.y * si, y: -e.x * si + e.y * co });
  }

  // ---------- ayudas para pasar los dibujos viejos ----------
  // dibuja fn sin sombras de DIB (para pintar un dibujo de frente sobre una cara sin que su sombra quede parada)
  function sinSombra(fn) {
    const s = DIB.sombra;
    DIB.sombra = () => {};
    try {
      return fn();
    } finally {
      DIB.sombra = s;
    }
  }
  return {
    K, cam, TAU, rad,
    girar, desgirar, matriz, piso, vista, mundo, fondo, fiDe,
    mezcla, tonos, tono,
    proyector, pr, prSeg,
    area, cara, enCara, medida, normal, afuera,
    caja, cubo, prisma, cilindro, rollo, techo, piramide, redonda, palo, plano,
    enPiso, sombra, elipse, punto, escena,
    relativa, angulo, ejeMundo, sinSombra,
  };
})();
