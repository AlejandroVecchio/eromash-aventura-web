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
    // las calles con los caminos del bosque: las principales empedradas, el resto tierra pisada con borde de pasto.
    // Las empedradas van al final, así en cada capa la piedra queda encima de la tierra que llega al cruce
    cmCalles = p.calles.map((c, i) => ({ p: c.pts, w: c.w, tipo: c.tipo === "laja" ? "adoquin" : "tierra", borde: c.tipo === "senda" ? "musgo" : "pasto", fundir: false, sem: i * 31 + 7 }));
    cmCalles.sort((a, b) => (a.tipo === "adoquin") - (b.tipo === "adoquin"));
    // las losas de la plaza (como las del Eikholt del bosque, alrededor del tronco)
    const r = azar(91);
    losas = [];
    for (let k = 0; k < 500; k++) {
      const a = r() * TAU,
        d = 1300 + Math.sqrt(r()) * (p.plaza - 1400);
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
    gastado(c, x0, y0, x1, y1);
    pastito(c, x0, y0, x1, y1, r);
    if (Math.abs((x0 + x1) / 2) < PL + TROZO && Math.abs((y0 + y1) / 2) < PL + TROZO) {
      for (const [x, y, rx, ry, g, col] of losas) if (x > x0 - 60 && x < x1 + 60 && y > y0 - 60 && y < y1 + 60) P(c, poli(x, y, rx, ry, 6, g), col);
      // las hojas del Roble juntadas en la plaza (más cerca del tronco, más hojas)
      const rh = azar(tx * 31 + ty * 7 + 3);
      for (let k = 0; k < 90; k++) {
        const x = x0 + rh() * TROZO,
          y = y0 + rh() * TROZO,
          d = Math.hypot(x, y);
        if (d > PL || d < 1300 || rh() > 1.2 - d / PL) continue;
        E(c, x, y, 7 + rh() * 4, 4, ["#A8782E", "#C8A040", "#8A6A2A", "#C86A2E"][k % 4], rh() * 3);
      }
      // el pie del Roble: un montículo de musgo entre las raíces, con un cordón de piedra alrededor y vetas azules
      const [rx0, ry0] = plano.roble;
      const RR = 1080;
      // el cerco de baldosas que separa al Roble de la plaza
      const RB = 1270;
      P(c, poli(rx0, ry0, RB + 20, RB + 20, 64, 0), "#3A3630");
      P(c, poli(rx0, ry0, RB, RB, 64, 0), "#5E5A52");
      c.strokeStyle = "#3A3630";
      c.lineWidth = 4;
      c.beginPath();
      for (let i = 0; i < 72; i++) {
        const a = (i / 72) * TAU;
        c.moveTo(rx0 + Math.cos(a) * (RR + 50), ry0 + Math.sin(a) * (RR + 50));
        c.lineTo(rx0 + Math.cos(a) * RB, ry0 + Math.sin(a) * RB);
      }
      c.stroke();
      P(c, poli(rx0, ry0, RR + 60, RR + 60, 48, 0.1), "#4A4640");
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * TAU,
          b = ((i + 1) / 48) * TAU;
        P(c, [rx0 + Math.cos(a) * (RR + 50), ry0 + Math.sin(a) * (RR + 50), rx0 + Math.cos(b) * (RR + 50), ry0 + Math.sin(b) * (RR + 50), rx0 + Math.cos(b) * (RR + 6), ry0 + Math.sin(b) * (RR + 6), rx0 + Math.cos(a) * (RR + 6), ry0 + Math.sin(a) * (RR + 6)], i % 2 ? "#6E6A62" : "#625C54");
      }
      P(c, poli(rx0, ry0, RR, RR, 40, 0.2), "#3D4A28");
      const rm = azar(77);
      for (let k = 0; k < 120; k++) {
        const a = rm() * TAU,
          d = Math.sqrt(rm()) * (RR - 80);
        E(c, rx0 + Math.cos(a) * d, ry0 + Math.sin(a) * d, 40 + rm() * 90, 20 + rm() * 40, ["#4A5A2E", "#56662C", "#34401F"][k % 3], rm() * 3);
      }
      // vetas de azul rúnico que corren por el musgo entre las raíces
      c.lineCap = "round";
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * TAU + rm() * 0.3;
        c.strokeStyle = k % 3 ? "rgba(115,213,219,0.35)" : "rgba(115,213,219,0.6)";
        c.lineWidth = k % 3 ? 3 : 5;
        c.beginPath();
        let d = 260;
        c.moveTo(rx0 + Math.cos(a) * d, ry0 + Math.sin(a) * d);
        for (let j = 0; j < 6; j++) {
          d += 110 + rm() * 40;
          const b = a + (rm() - 0.5) * 0.35;
          c.lineTo(rx0 + Math.cos(b) * Math.min(d, RR - 30), ry0 + Math.sin(b) * Math.min(d, RR - 30));
        }
        c.stroke();
      }
      // el piso del Ting: anillos de losas alrededor del menhir, distinto de todo el resto
      const [tx0, ty0] = plano.ting;
      const anillos = [[620, "#3A3630"], [600, "#5E5A52"], [470, "#4A4640"], [450, "#6A665E"], [300, "#4A4640"], [282, "#5E5A52"], [120, "#4E4A44"]];
      for (const [ra, col] of anillos) P(c, poli(tx0, ty0, ra, ra, 64, 0), col);
      // las juntas de las losas, en cada anillo
      c.strokeStyle = "#3A3630";
      c.lineWidth = 4;
      for (const [r0, r1, n] of [[470, 600, 40], [300, 450, 28], [120, 282, 16]]) {
        c.beginPath();
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU + (r0 % 7) * 0.05;
          c.moveTo(tx0 + Math.cos(a) * r0, ty0 + Math.sin(a) * r0);
          c.lineTo(tx0 + Math.cos(a) * r1, ty0 + Math.sin(a) * r1);
        }
        c.stroke();
      }
      // el anillo de runas talladas entre el primer y el segundo cerco, que apenas brillan
      c.strokeStyle = "rgba(115,213,219,0.4)";
      c.lineWidth = 3;
      c.beginPath();
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * TAU,
          cx = tx0 + Math.cos(a) * 535,
          cy = ty0 + Math.sin(a) * 535;
        c.moveTo(cx, cy - 18);
        c.lineTo(cx, cy + 18);
        c.moveTo(cx, cy - (i % 2 ? 18 : 4));
        c.lineTo(cx + 12, cy - (i % 2 ? 6 : 14));
      }
      c.stroke();
    }
    // los patios empedrados (el de la Casa de las Lindes)
    for (const pa of patios) {
      if (pa.arena) {
        // la tierra apisonada y la arena del campo de entrenamiento, con las marcas de los pies
        const [mx, mz] = pa.rect;
        if (pa.x + mx < x0 - 100 || pa.x - mx > x1 + 100 || pa.y + mz < y0 - 100 || pa.y - mz > y1 + 100) continue;
        P(c, [pa.x - mx - 50, pa.y - mz - 50, pa.x + mx + 50, pa.y - mz - 50, pa.x + mx + 50, pa.y + mz + 50, pa.x - mx - 50, pa.y + mz + 50], "#4A3C28");
        P(c, [pa.x - mx, pa.y - mz, pa.x + mx, pa.y - mz, pa.x + mx, pa.y + mz, pa.x - mx, pa.y + mz], "#7A6448");
        const ra = azar(Math.round(pa.x + pa.y));
        for (let k = 0; k < 140; k++) E(c, pa.x + (ra() - 0.5) * 2 * mx * 0.95, pa.y + (ra() - 0.5) * 2 * mz * 0.95, 20 + ra() * 50, 8 + ra() * 18, ra() < 0.5 ? "#8A7454" : "#6E5A40", ra() * 3);
        // el ruedo marcado en la arena
        c.strokeStyle = "rgba(242,236,236,0.12)";
        c.lineWidth = 8;
        c.beginPath();
        c.ellipse(pa.x + 240, pa.y + 120, 260, 200, 0, 0, TAU);
        c.stroke();
        continue;
      }
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
  // Lo gastado de las calles: en la tierra, las dos huellas de las ruedas y charcos que reflejan el cielo; en el
  // adoquín, musgo entre las piedras y alguna que falta. Cada tramo con su semilla, así no cambia de un trozo a otro.
  function gastado(c, x0, y0, x1, y1) {
    for (const cm of cmCalles) {
      for (let i = 0; i < cm.p.length - 1; i++) {
        const [ax, ay] = cm.p[i],
          [bx, by] = cm.p[i + 1];
        if (Math.max(ax, bx) < x0 - cm.w || Math.min(ax, bx) > x1 + cm.w || Math.max(ay, by) < y0 - cm.w || Math.min(ay, by) > y1 + cm.w) continue;
        const l = Math.hypot(bx - ax, by - ay) || 1,
          ux = (bx - ax) / l,
          uy = (by - ay) / l,
          nx = -uy,
          ny = ux;
        const r = azar(cm.sem * 131 + i * 17);
        if (cm.tipo === "tierra") {
          // las huellas de las ruedas
          c.lineCap = "round";
          for (const s of [-1, 1]) {
            const o = s * cm.w * 0.17;
            c.strokeStyle = "rgba(42,32,22,0.32)";
            c.lineWidth = 9;
            c.beginPath();
            c.moveTo(ax + nx * o, ay + ny * o);
            c.lineTo(bx + nx * o, by + ny * o);
            c.stroke();
            c.strokeStyle = "rgba(140,112,78,0.18)";
            c.lineWidth = 3;
            c.beginPath();
            c.moveTo(ax + nx * (o + 7), ay + ny * (o + 7));
            c.lineTo(bx + nx * (o + 7), by + ny * (o + 7));
            c.stroke();
          }
          // charcos en los pozos del camino, con el cielo reflejado
          const n = Math.floor(l / 900);
          for (let k = 0; k < n; k++) {
            if (r() < 0.45) continue;
            const s = r(),
              o = (r() - 0.5) * cm.w * 0.5,
              px = ax + ux * l * s + nx * o,
              py = ay + uy * l * s + ny * o,
              rx = 40 + r() * 50,
              ry = 18 + r() * 16,
              g = Math.atan2(uy, ux);
            E(c, px, py, rx + 8, ry + 6, "#4A3A28", g);
            E(c, px, py, rx, ry, "#3A4A52", g);
            E(c, px - rx * 0.25, py - ry * 0.2, rx * 0.5, ry * 0.35, "#6E8A94", g);
          }
        } else {
          // musgo entre las piedras, más en los bordes; alguna piedra que falta
          const n = Math.floor(l / 60);
          for (let k = 0; k < n; k++) {
            const s = r(),
              borde = r() < 0.7,
              o = (borde ? (r() < 0.5 ? -1 : 1) * (0.38 + r() * 0.1) : r() - 0.5) * cm.w;
            const px = ax + ux * l * s + nx * o,
              py = ay + uy * l * s + ny * o;
            if (r() < 0.06) E(c, px, py, 16, 10, "#3A3226", r() * 3);
            else E(c, px, py, 7 + r() * 9, 3 + r() * 3, r() < 0.5 ? "rgba(86,102,44,0.55)" : "rgba(74,90,46,0.45)", r() * 3);
          }
        }
      }
    }
  }
  // el pasto de adentro con flores chicas y matas (blancas, amarillas y alguna roja), solo lejos de las calles
  function pastito(c, x0, y0, x1, y1, r) {
    const RM = plano.R_MURO;
    for (let k = 0; k < 70; k++) {
      const x = x0 + r() * TROZO,
        y = y0 + r() * TROZO;
      if (Math.hypot(x, y) > RM - 100 || Math.hypot(x, y) < plano.plaza + 100) continue;
      if (plano.aCalle(x, y) < 60) continue;
      const tipo = r();
      if (tipo < 0.55) {
        for (let j = 0; j < 4; j++) P(c, [x + j * 5 - 8, y, x + j * 5 - 6 + (r() - 0.5) * 6, y - 14 - r() * 10, x + j * 5 - 4, y], j % 2 ? "#56662C" : "#4A5A2E");
      } else {
        const col = tipo < 0.8 ? "#E8E4DC" : tipo < 0.95 ? "#FFD98A" : "#C8402D";
        for (let j = 0; j < 3; j++) E(c, x + (r() - 0.5) * 30, y + (r() - 0.5) * 16, 3.5, 3, col);
      }
    }
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
    // el caché guarda al menos todo lo que se ve (si no, de lejos se borraban trozos a la vista y quedaban huecos)
    const tope = Math.max(160, (tx1 - tx0 + 1) * (ty1 - ty0 + 1) + 40);
    for (let ty = ty0; ty <= ty1; ty++)
      for (let tx = tx0; tx <= tx1; tx++) {
        const k = tx + "," + ty;
        let cv = cache.get(k);
        if (cv) {
          cache.delete(k);
          cache.set(k, cv);
        } else {
          if (pintados > (escPiso < 0.15 ? 30 : 3) && cache.size) continue;
          cv = pintarTrozo(tx, ty, escCache);
          pintados++;
          cache.set(k, cv);
          if (cache.size > tope) cache.delete(cache.keys().next().value);
        }
        if (cv.width && cv.height) c.drawImage(cv, tx * TROZO, ty * TROZO, TROZO + 1, TROZO + 1);
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

  // Lo que se deja de dibujar al alejar, para que la vista de lejos no trabe la PC: primero la gente (en ciudad.html),
  // después lo chico (faroles, barriles, carros, leña, huertas), después la mitad de los árboles y al final todos;
  // de muy lejos quedan las casas, la muralla, las calles y el Roble. LEJOS.* son las escalas (cam.esc) de cada corte.
  const LEJOS = { gente: 0.2, chico: 0.17, arboles: 0.13, arbolesTodos: 0.085, huertas: 0.1 };
  const ARBOLES = { pino: 1, abedul: 1, helechos: 1, roca: 1, arbusto: 1 };
  function seVe(o, esc) {
    if (esc >= LEJOS.chico) return true;
    if (o.tipo === "casa") {
      if (o.piso) return esc >= LEJOS.huertas;
      return !o.id || (o.casa.alto || 0) >= 200 || esc >= LEJOS.chico;
    }
    if (ARBOLES[o.id]) {
      if (esc < LEJOS.arbolesTodos) return false;
      return esc >= LEJOS.arboles || ((o.x * 7 + o.y * 3) & 1) === 0;
    }
    const d = ASSETS.LISTA[o.id];
    return !!d && d.alto >= 300;
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
          if (!seVe(o, cam.esc)) continue;
          const [sx, sy] = V(o.x, o.y);
          lista.push({ y: sy, x: sx, cosa: o, f: (c) => dibujarCosa(c, o, sx, sy, cam, V, t) });
        }
      }
  }
  // De lejos cada volumen se dibuja una vez en un lienzo chico (con su giro redondeado a 1/128 de vuelta) y después se
  // pega: así alejar la cámara no redibuja cientos de casas y tramos de muralla cuadro a cuadro. De cerca (y lo que
  // se mueve) se dibuja siempre en vivo.
  const FIGURAS = new Map(),
    TOPE_FIGURAS = 1200,
    PASOS_GIRO = 128;
  let nuevasEsteCuadro = 0;
  function figura(o, giro, k, esc) {
    const v = o.casa;
    const R = v.radio || (v.ancho ? v.ancho / 2 + 160 : v.W ? Math.hypot(v.W, v.D) / 2 + 80 : 400),
      A = (v.alto || 400) + 60;
    const eB = esc < 0.06 ? 0.06 : esc < 0.1 ? 0.1 : esc < 0.15 ? 0.15 : 0.2;
    const gq = ((Math.round((giro / (Math.PI * 2)) * PASOS_GIRO) % PASOS_GIRO) + PASOS_GIRO) % PASOS_GIRO;
    const kq = Math.round(k * 20);
    const base = (o.nombre || o.id || "") + "|" + o.x + "|" + o.y + "|" + kq + "|" + eB + "|";
    let f = FIGURAS.get(base + gq);
    if (!f) {
      if (nuevasEsteCuadro > 24) {
        // sin presupuesto este cuadro: la de giro más cercano que ya esté hecha, si hay
        for (let d = 1; d < 12 && !f; d++) f = FIGURAS.get(base + ((gq + d) % PASOS_GIRO)) || FIGURAS.get(base + ((gq - d + PASOS_GIRO) % PASOS_GIRO));
        return f || null;
      }
      nuevasEsteCuadro++;
      const kk = kq / 20;
      const w = Math.ceil(2 * R * eB) + 4,
        h = Math.ceil((A + 2 * R * kk + 60) * eB) + 4;
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      const cx = cv.getContext("2d");
      cx.setTransform(eB, 0, 0, eB, R * eB + 2, (A + R * kk) * eB + 2);
      v.dibujar(cx, 0, 0, (gq / PASOS_GIRO) * Math.PI * 2, kk, 0);
      f = { cv, R, A, kk, eB };
      FIGURAS.set(base + gq, f);
      if (FIGURAS.size > TOPE_FIGURAS) FIGURAS.delete(FIGURAS.keys().next().value);
    }
    return f;
  }
  function dibujarCosa(c, o, sx, sy, cam, V, t) {
    if (o.tipo === "casa") {
      if (cam.esc < 0.2) {
        const f = figura(o, o.ry + cam.g, cam.k, cam.esc);
        if (f) return c.drawImage(f.cv, sx - f.R - 2 / f.eB, sy - f.A - f.R * f.kk - 2 / f.eB, f.cv.width / f.eB, f.cv.height / f.eB);
      }
      return o.casa.dibujar(c, sx, sy, o.ry + cam.g, cam.k, t);
    }
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
    // lo que gira con la cámara (el Roble): se le pasa hacia dónde mira
    if (o.o.gira) return ASSETS.dibujar(c, o.id, sx, sy, t, Object.assign({}, o.o, { giro: cam.g, k: cam.k, ojo: [cam.x, cam.y] }));
    // los animales miran hacia un lado del mundo (o.rumbo): al girar la cámara se dan vuelta
    if (o.o.rumbo !== undefined) return ASSETS.dibujar(c, o.id, sx, sy, t, Object.assign({}, o.o, { espejo: Math.cos(o.o.rumbo + cam.g) < 0 }));
    ASSETS.dibujar(c, o.id, sx, sy, t, o.o);
  }

  // dibuja todo: el piso, las cosas del plano y lo que traiga extra ([{ x, y (mundo), f(c, sx, sy) }])
  // sobrePiso(c): lo que va pintado sobre el piso (en coordenadas del mundo, girado y achicado), antes de lo parado
  function dibujar(c, cam, cw, ch, t, extra = [], sobrePiso) {
    const V = proyector(cam);
    nuevasEsteCuadro = 0;
    const vw = cw / cam.esc,
      vh = ch / cam.esc;
    const rad = Math.hypot(vw, vh / cam.k) / 2 + 300;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#33301F";
    c.fillRect(0, 0, cw, ch);
    aPiso(c, cam, cw, ch);
    dibujarPiso(c, cam, rad, Math.min(1, cam.esc * 1.25));
    if (sobrePiso) sobrePiso(c);
    aVista(c, cam, cw, ch);
    const lista = [];
    cosasVisibles(cam, rad + 1400, V, t, lista);
    for (const e of extra) {
      const [sx, sy] = V(e.x, e.y);
      lista.push({ y: sy, x: sx, f: (c) => e.f(c, sx, sy) });
    }
    // lo pintado en el piso (losas, charcos) va primero, debajo de todo lo parado
    const enPiso = (d) => (d.cosa && (d.cosa.piso || (d.cosa.o && d.cosa.o.piso)) ? 1 : 0);
    lista.sort((a, b) => enPiso(b) - enPiso(a) || a.y - b.y);
    for (const d of lista) d.f(c);
    return { V, lista };
  }

  return { iniciar, dibujar, proyector, aVista, aPiso, TROZO, LEJOS };
})();
