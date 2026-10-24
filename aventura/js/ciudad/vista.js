// ---------- cómo se ve la capital (módulo VISTA25) ----------
// El mismo 2.5D del bosque, con la cámara que gira: el piso se pinta desde arriba en trozos (los mismos colores, los
// mismos caminos de SENDAS y las mismas losas que el Eikholt del bosque) y se gira y se achica con la cámara; todo lo
// parado (casas, árboles, toldos, faroles, gente) se dibuja derecho en el punto donde cae su pie. Las casas
// (CASAS25) se arman con su giro más el de la cámara, así se ve el lado que corresponde.
// cam = { x, y (centro, en el mundo), g (giro en radianes), k (cuánto se achica el piso: 1 = desde arriba), esc }
window.VISTA25 = (function () {
  "use strict";
  const { P, E, R, poli, azar } = DIB;
  const TAU = Math.PI * 2;
  const TROZO = 1024,
    BALDE = 1200;
  let plano = null,
    baldes = null,
    cmCalles = [],
    losas = [],
    patios = [];
  const cache = new Map();
  let escCache = 0;

  function iniciar(p) {
    plano = p;
    baldes = new Map();
    patios = p.cosas.filter((o) => o.tipo === "patio");
    for (const o of p.cosas) {
      if (o.tipo === "patio") continue;
      const k = Math.floor(o.x / BALDE) + "," + Math.floor(o.y / BALDE);
      if (!baldes.has(k)) baldes.set(k, []);
      baldes.get(k).push(o);
      if (o.tipo === "casa") o.alto = o.casa.alto;
      else o.alto = (ASSETS.LISTA[o.id] && ASSETS.LISTA[o.id].alto * (o.o.s || 1)) || 100;
    }
    // las calles con los caminos del bosque: la avenida del sur empedrada, el resto tierra pisada con borde de pasto
    cmCalles = p.calles.map((c, i) => ({ p: c.pts, w: c.w, tipo: c.tipo === "laja" ? "adoquin" : "tierra", borde: c.tipo === "senda" ? "musgo" : "pasto", fundir: false, sem: i * 31 + 7 }));
    // las losas de la plaza (como las del Eikholt del bosque, alrededor del tronco)
    const r = azar(91);
    losas = [];
    for (let k = 0; k < 900; k++) {
      const a = r() * TAU,
        d = 600 + Math.sqrt(r()) * (p.plaza - 700);
      losas.push([Math.cos(a) * d, Math.sin(a) * d, 26 + r() * 16, 13 + r() * 7, r(), r() < 0.5 ? "#6E6458" : "#5E564C"]);
    }
    cache.clear();
  }

  // ---------- el piso ----------
  function trazo(c, pts, w, col) {
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.strokeStyle = col;
    c.lineWidth = w;
    c.lineJoin = "round";
    c.lineCap = "round";
    c.stroke();
  }
  function pintarTrozo(tx, ty, esc) {
    const lado = Math.ceil(TROZO * esc);
    const cv = document.createElement("canvas");
    cv.width = cv.height = lado;
    const c = cv.getContext("2d");
    c.scale(esc, esc);
    c.translate(-tx * TROZO, -ty * TROZO);
    const x0 = tx * TROZO,
      y0 = ty * TROZO,
      x1 = x0 + TROZO,
      y1 = y0 + TROZO;
    const RM = plano.R_MURO;
    // el humus del bosque afuera (con sus manchas, como el piso del bosque) y el pasto de la ciudad adentro
    R(c, x0, y0, TROZO, TROZO, "#33301F");
    const r = azar(tx * 7919 + ty * 104729 + 5);
    for (let k = 0; k < 16; k++) E(c, x0 + r() * TROZO, y0 + r() * TROZO, 60 + r() * 120, 20 + r() * 40, r() > 0.5 ? "#2B2A1B" : "#3A3A24", r() * 0.6 - 0.3);
    for (let k = 0; k < 10; k++) P(c, poli(x0 + r() * TROZO, y0 + r() * TROZO, 30 + r() * 50, 14 + r() * 20, 6, r(), [1, 0.8, 1.1, 0.9, 1.05, 0.85]), "#3D4228");
    for (let k = 0; k < 26; k++) R(c, x0 + r() * TROZO, y0 + r() * TROZO, 4, 4, r() < 0.5 ? "#4A4A30" : "#26251A");
    const dc = Math.hypot((x0 + x1) / 2, (y0 + y1) / 2);
    if (dc < RM + 2200) {
      const jit = Array.from({ length: 64 }, (_, i) => 1 + Math.sin(i * 2.7) * 0.012);
      P(c, poli(0, 0, RM + 520, RM + 520, 64, 0.1, jit), "#3F4A28");
      P(c, poli(0, 0, RM + 380, RM + 380, 64, 0.3, jit), "#465030");
      for (let k = 0; k < 22; k++) {
        const x = x0 + r() * TROZO,
          y = y0 + r() * TROZO;
        if (Math.hypot(x, y) > RM + 300) continue;
        E(c, x, y, 40 + r() * 70, 14 + r() * 22, r() < 0.5 ? "#4A5630" : "#3F4A28", r() * 0.6 - 0.3);
        if (r() < 0.4) E(c, x + 20, y - 6, 20 + r() * 30, 8 + r() * 10, "#56662C");
      }
    }
    // el río, de a capas como en el bosque
    const rio = plano.rio;
    [[70, "#2E3324"], [30, "#4A4A3A"], [0, "#2A4C56"]].forEach(([m, col]) => trazo(c, rio.pts, rio.ancho + m * 3, col));
    trazo(c, rio.pts, rio.ancho * 0.55, "#30586A");
    trazo(c, rio.pts, rio.ancho * 0.12, "#3E6E7E");
    // la plaza del Roble: tierra apisonada con losas
    const PL = plano.plaza;
    if (Math.abs((x0 + x1) / 2) < PL + TROZO && Math.abs((y0 + y1) / 2) < PL + TROZO) {
      const jp = [1, 0.98, 1.01, 0.99, 1.02, 0.97, 1.01, 0.99];
      P(c, poli(0, 0, PL + 60, PL + 60, 64, 0.1, jp), "#3A3022");
      P(c, poli(0, 0, PL, PL, 64, 0.1, jp), "#5C4A32");
    }
    // las calles (mundo/caminos.js), de a capas para que se junten donde se cruzan
    ["base", "cuerpo", "borde"].forEach((capa) => cmCalles.forEach((cm) => SENDAS.pintar(c, cm, cm.sem, x0 - 200, y0 - 200, x1 + 200, y1 + 200, capa, cmCalles)));
    if (Math.abs((x0 + x1) / 2) < PL + TROZO && Math.abs((y0 + y1) / 2) < PL + TROZO) {
      for (const [x, y, rx, ry, g, col] of losas) if (x > x0 - 60 && x < x1 + 60 && y > y0 - 60 && y < y1 + 60) P(c, poli(x, y, rx, ry, 6, g), col);
      // tierra más oscura al pie del tronco
      P(c, poli(0, 120, 900, 760, 24, 0.2), "#3A3022");
    }
    // los patios empedrados (el de la Casa de las Lindes)
    for (const pa of patios) {
      if (pa.x + pa.r < x0 || pa.x - pa.r > x1 || pa.y + pa.r < y0 || pa.y - pa.r > y1) continue;
      P(c, poli(pa.x, pa.y, pa.r + 40, pa.r + 40, 20, 0.1), "#3A3022");
      P(c, poli(pa.x, pa.y, pa.r, pa.r, 20, 0.1), "#5E564C");
      const rp = azar(Math.round(pa.x));
      for (let k = 0; k < 160; k++) {
        const a = rp() * TAU,
          d = Math.sqrt(rp()) * pa.r * 0.95;
        P(c, poli(pa.x + Math.cos(a) * d, pa.y + Math.sin(a) * d, 40 + rp() * 20, 30 + rp() * 14, 6, rp()), rp() < 0.5 ? "#6E6458" : "#746A5C");
      }
    }
    return cv;
  }
  function dibujarPiso(c, cam, rad, escPiso) {
    if (Math.abs(escPiso - escCache) > 0.02) {
      cache.clear();
      escCache = escPiso;
    }
    const tx0 = Math.floor((cam.x - rad) / TROZO),
      tx1 = Math.floor((cam.x + rad) / TROZO),
      ty0 = Math.floor((cam.y - rad) / TROZO),
      ty1 = Math.floor((cam.y + rad) / TROZO);
    let pintados = 0;
    for (let ty = ty0; ty <= ty1; ty++)
      for (let tx = tx0; tx <= tx1; tx++) {
        const k = tx + "," + ty;
        let cv = cache.get(k);
        if (!cv) {
          if (pintados > 3 && cache.size) continue;
          cv = pintarTrozo(tx, ty, escCache);
          pintados++;
          cache.set(k, cv);
          if (cache.size > 160) cache.delete(cache.keys().next().value);
        }
        c.drawImage(cv, tx * TROZO, ty * TROZO, TROZO + 1, TROZO + 1);
      }
  }

  // ---------- la cámara ----------
  // del mundo a la vista (mismas unidades, con el centro de la cámara fijo)
  function proyector(cam) {
    const co = Math.cos(cam.g),
      si = Math.sin(cam.g),
      k = cam.k;
    const V = (x, y) => {
      const dx = x - cam.x,
        dy = y - cam.y;
      return [cam.x + dx * co - dy * si, cam.y + (dx * si + dy * co) * k];
    };
    V.inversa = (vx, vy) => {
      const a = vx - cam.x,
        b = (vy - cam.y) / k;
      return [cam.x + a * co + b * si, cam.y - a * si + b * co];
    };
    return V;
  }
  // la transformación de la vista (lo parado) y la del piso (girado y achicado)
  function aVista(c, cam, cw, ch) {
    c.setTransform(cam.esc, 0, 0, cam.esc, cw / 2 - cam.x * cam.esc, ch / 2 - cam.y * cam.esc);
  }
  function aPiso(c, cam, cw, ch) {
    aVista(c, cam, cw, ch);
    c.translate(cam.x, cam.y);
    c.scale(1, cam.k);
    c.rotate(cam.g);
    c.translate(-cam.x, -cam.y);
  }

  // lo que se ve: [{ y (orden), f }] con las cosas del plano cerca de la cámara
  function cosasVisibles(cam, rad, V, t, lista) {
    const b0x = Math.floor((cam.x - rad) / BALDE),
      b1x = Math.floor((cam.x + rad) / BALDE),
      b0y = Math.floor((cam.y - rad) / BALDE),
      b1y = Math.floor((cam.y + rad) / BALDE);
    for (let by = b0y; by <= b1y; by++)
      for (let bx = b0x; bx <= b1x; bx++) {
        const l = baldes.get(bx + "," + by);
        if (!l) continue;
        for (const o of l) {
          if (Math.hypot(o.x - cam.x, o.y - cam.y) > rad) continue;
          const [sx, sy] = V(o.x, o.y);
          lista.push({ y: sy, x: sx, cosa: o, f: (c) => dibujarCosa(c, o, sx, sy, cam, V, t) });
        }
      }
  }
  function dibujarCosa(c, o, sx, sy, cam, V, t) {
    if (o.tipo === "casa") return o.casa.dibujar(c, sx, sy, o.ry + cam.g, cam.k, t);
    if (o.punta) {
      // un tramo de empalizada: sus dos puntas en la vista; se ve la cara de adentro (con la pasarela) si mira a la cámara
      const a = V(o.punta[0], o.punta[1]),
        b = V(o.punta[2], o.punta[3]);
      const dentro = -Math.sin(o.adentro + cam.g) > 0;
      return ASSETS.dibujar(c, o.id, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, t, Object.assign({}, o.o, { dx: (b[0] - a[0]) / 2, dy: (b[1] - a[1]) / 2, dentro, ey: 1.5 }));
    }
    if (o.o.x2 !== undefined) {
      // lo que va de punta a punta (la empalizada): las dos puntas en la vista
      const [ex, ey] = V(o.o.x2, o.o.y2);
      return ASSETS.dibujar(c, o.id, sx, sy, t, Object.assign({}, o.o, { x2: ex, y2: ey }));
    }
    ASSETS.dibujar(c, o.id, sx, sy, t, o.o);
  }

  // dibuja todo: el piso, las cosas del plano y lo que traiga extra ([{ x, y (mundo), f(c, sx, sy) }])
  function dibujar(c, cam, cw, ch, t, extra = []) {
    const V = proyector(cam);
    const vw = cw / cam.esc,
      vh = ch / cam.esc;
    const rad = Math.hypot(vw, vh / cam.k) / 2 + 300;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#33301F";
    c.fillRect(0, 0, cw, ch);
    aPiso(c, cam, cw, ch);
    dibujarPiso(c, cam, rad, Math.min(1, cam.esc * 1.25));
    aVista(c, cam, cw, ch);
    const lista = [];
    cosasVisibles(cam, rad + 1400, V, t, lista);
    for (const e of extra) {
      const [sx, sy] = V(e.x, e.y);
      lista.push({ y: sy, x: sx, f: (c) => e.f(c, sx, sy) });
    }
    lista.sort((a, b) => a.y - b.y);
    for (const d of lista) d.f(c);
    return { V, lista };
  }

  return { iniciar, dibujar, proyector, aVista, aPiso, TROZO };
})();
