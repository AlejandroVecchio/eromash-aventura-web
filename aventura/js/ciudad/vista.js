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
      // cuánto ocupa de ancho en la vista (para saber si cae en la pantalla), con margen
      const v = o.casa;
      if (o.tipo === "casa") o.radio = (v.radio || (v.ancho ? v.ancho / 2 + 160 : v.W ? Math.hypot(v.W, v.D) / 2 + 80 : v.pie ? Math.hypot(v.pie[0], v.pie[1]) + 80 : 400)) + 120;
      else o.radio = Math.max(300, o.alto * 0.75);
      if (o.punta) o.radio = Math.max(o.radio, Math.hypot(o.punta[2] - o.punta[0], o.punta[3] - o.punta[1]) / 2 + 200);
      if (o.o && o.o.x2 !== undefined) o.radio = Math.max(o.radio, Math.hypot(o.o.x2 - o.x, o.o.y2 - o.y) + 200);
      o.enPiso = o.piso || (o.o && o.o.piso) ? 1 : 0;
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
  // la capa que se hornea encima de cada baldosa del piso (las sombras de SOMBRAS25): { clave, pintar(c, x0, y0, x1, y1) }.
  // Cada baldosa guarda su copia con la capa puesta; si cambia la clave (giró la cámara, pasó la hora) se repintan de a
  // pocas por cuadro y mientras tanto se ve la copia anterior
  const conCapa = new Map();
  let capaPiso = null,
    horneadas = 0;
  // faltó = en este cuadro alguna baldosa se dio sin terminar (sin pintar todavía, o con la capa vieja)
  let faltó = false;
  function horneada(k, cv, tx, ty) {
    const clave = capaPiso.clave;
    let h = conCapa.get(k);
    if (!cv.width || !cv.height) return cv;
    if (h && h.clave === clave) return h.cv;
    if (horneadas >= (h ? 2 : 6)) {
      faltó = true;
      return h ? h.cv : cv;
    }
    horneadas++;
    const hc = (h && h.cv.width === cv.width && h.cv) || document.createElement("canvas");
    hc.width = cv.width;
    hc.height = cv.height;
    const x = hc.getContext("2d");
    x.drawImage(cv, 0, 0);
    x.setTransform(escCache, 0, 0, escCache, -tx * TROZO * escCache, -ty * TROZO * escCache);
    capaPiso.pintar(x, tx * TROZO, ty * TROZO, (tx + 1) * TROZO, (ty + 1) * TROZO);
    conCapa.set(k, { cv: hc, clave });
    return hc;
  }
  // la resolución de las baldosas va en escalones (cuatro por cada vez que se duplica) y siempre por encima de lo
  // pedido: al acercar o alejar con la rueda las baldosas se reusan en vez de repintarse en cada cuadro del zoom
  const escalon = (e) => Math.min(1, Math.pow(2, Math.ceil(Math.log2(e) * 4 - 1e-9) / 4));
  // pintar baldosas nuevas tiene un tope de tiempo por cuadro (no de cantidad): sin tirones al llegar a un lugar
  let t0Piso = 0,
    tiempoPiso = 7,
    pintados = 0,
    topePiso = 160;
  // una baldosa lista para copiar (con su capa), o null si este cuadro ya no alcanza el tiempo para pintarla
  function trozo(tx, ty) {
    const k = tx + "," + ty;
    let cv = cache.get(k);
    if (cv) {
      cache.delete(k);
      cache.set(k, cv);
    } else {
      if (pintados && cache.size && performance.now() - t0Piso > tiempoPiso) {
        faltó = true;
        return null;
      }
      cv = pintarTrozo(tx, ty, escCache);
      pintados++;
      cache.set(k, cv);
      if (cache.size > topePiso) {
        const viejo = cache.keys().next().value;
        cache.delete(viejo);
        conCapa.delete(viejo);
      }
    }
    if (capaPiso) cv = horneada(k, cv, tx, ty);
    return cv.width && cv.height ? cv : null;
  }
  function baldosasDe(vis) {
    const l = [];
    const tx0 = Math.floor((vis.x0 - 60) / TROZO),
      tx1 = Math.floor((vis.x1 + 60) / TROZO),
      ty0 = Math.floor((vis.y0 - 60) / TROZO),
      ty1 = Math.floor((vis.y1 + 60) / TROZO);
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) if (vis.toca(tx * TROZO, ty * TROZO, TROZO)) l.push([tx, ty]);
    return l;
  }
  // copia las baldosas (con c ya puesto en el piso); la que falta queda del color del humus
  function copiar(c, l, solape) {
    for (const [tx, ty] of l) {
      const cv = trozo(tx, ty);
      if (cv) c.drawImage(cv, tx * TROZO, ty * TROZO, TROZO + solape, TROZO + solape);
      else {
        c.fillStyle = "#33301F";
        c.fillRect(tx * TROZO, ty * TROZO, TROZO + solape, TROZO + solape);
      }
    }
  }

  // ---------- el piso entero en un lienzo que se corre ----------
  // Con la cámara quieta o caminando (sin girar ni acercar), el piso de la pantalla es el mismo de antes corrido unos
  // píxeles: se arma una vez en un lienzo más grande que la pantalla (con margen) y cada cuadro se copia corrido, en
  // píxeles enteros y sin girar, que es lo más barato que hay. Cuando Eromash se acerca al borde del margen se arma el
  // siguiente de a poco, unos milisegundos por cuadro, y se cambia cuando está completo (sin tirones). Si la cámara
  // gira o se acerca, el piso se dibuja directo como siempre hasta que se queda quieta.
  const frente = { cv: document.createElement("canvas"), ok: false },
    atras = { cv: document.createElement("canvas"), ok: false };
  let armando = null,
    previa = { g: 0, k: 0, esc: 0 };
  // la misma cámara salvo por lo que se mueve (con una tolerancia de centésimas de píxel: el zoom suave tarda en quedarse
  // exactamente quieto)
  const misma = (a, cam) => Math.abs(a.g - cam.g) < 1e-5 && Math.abs(a.k - cam.k) < 1e-5 && Math.abs(a.esc - cam.esc) < cam.esc * 1e-5;
  const lineal = (cam, dx, dy) => [(dx * Math.cos(cam.g) - dy * Math.sin(cam.g)) * cam.esc, (dx * Math.sin(cam.g) + dy * Math.cos(cam.g)) * cam.k * cam.esc];
  function empezarArmado(cam, cw, ch, V, M) {
    const W = cw + 2 * M,
      H = ch + 2 * M;
    // el rectángulo del lienzo grande, como una pantalla más grande centrada en la cámara
    const vis = visible(cam, W, H, V);
    armando = { x: cam.x, y: cam.y, g: cam.g, k: cam.k, esc: cam.esc, cw, ch, M, W, H, l: baldosasDe(vis), i: 0, clave: capaPiso ? capaPiso.clave : "", entero: true };
    const cv = atras.cv;
    if (cv.width !== W || cv.height !== H) {
      cv.width = W;
      cv.height = H;
    }
  }
  function seguirArmado(cam, solape) {
    const a = armando;
    if (!misma(a, cam)) return (armando = null);
    const x = atras.cv.getContext("2d");
    x.setTransform(a.esc, 0, 0, a.esc, a.W / 2 - a.x * a.esc, a.H / 2 - a.y * a.esc);
    x.translate(a.x, a.y);
    x.scale(1, a.k);
    x.rotate(a.g);
    x.translate(-a.x, -a.y);
    // el armado tiene su propio rato por cuadro, también para pintar las baldosas que le falten
    const t = performance.now();
    pintados = 0;
    t0Piso = t;
    tiempoPiso = 4;
    while (a.i < a.l.length && performance.now() - t < 4) {
      faltó = false;
      copiar(x, [a.l[a.i]], solape);
      if (faltó) a.entero = false;
      if (faltó && !cache.has(a.l[a.i][0] + "," + a.l[a.i][1])) break; // se acabó el tiempo de pintar: sigue el próximo cuadro
      a.i++;
    }
    if (a.i < a.l.length) return;
    // listo: pasa al frente
    const cv = frente.cv;
    frente.cv = atras.cv;
    atras.cv = cv;
    Object.assign(frente, { ok: true, x: a.x, y: a.y, g: a.g, k: a.k, esc: a.esc, cw: a.cw, ch: a.ch, M: a.M, clave: a.clave, entero: a.entero, esc0: escCache });
    armando = null;
  }

  function dibujarPiso(c, cam, cw, ch, vis, V) {
    const escPiso = escalon(Math.min(1, cam.esc * 1.25));
    if (escPiso !== escCache) {
      cache.clear();
      conCapa.clear();
      escCache = escPiso;
      frente.ok = false;
      armando = null;
    }
    horneadas = 0;
    pintados = 0;
    t0Piso = performance.now();
    tiempoPiso = escPiso < 0.15 ? 14 : 7;
    // cada baldosa pisa a la siguiente un par de píxeles: sin fondo debajo, el borde suavizado no deja ver una costura
    const solape = Math.max(1, 2.5 / cam.esc);
    // el margen: de cerca un 30 % de la pantalla; de lejos se camina menos píxeles por segundo y alcanza con menos
    const M = Math.round(Math.max(cw, ch) * 0.3 * Math.max(0.3, Math.min(1, cam.esc / 0.4)));
    const lv = baldosasDe(vis);
    // el caché guarda al menos todo lo que se ve más el margen (si no, de lejos se borraban trozos a la vista)
    topePiso = Math.max(160, lv.length + (armando ? armando.l.length : lv.length * 2) + 40);
    // ¿sirve el lienzo del frente? misma cámara (giro, inclinación, zoom, pantalla) y la pantalla todavía adentro
    const f = frente;
    let corrido = null;
    if (f.ok && misma(f, cam) && f.cw === cw && f.ch === ch && f.esc0 === escCache) {
      const [ox, oy] = lineal(cam, cam.x - f.x, cam.y - f.y);
      if (Math.abs(ox) < f.M && Math.abs(oy) < f.M) corrido = [ox, oy];
    }
    const quieta = misma(previa, cam);
    previa = { g: cam.g, k: cam.k, esc: cam.esc };
    const clave = capaPiso ? capaPiso.clave : "";
    if (corrido) {
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.drawImage(f.cv, Math.round(-f.M - corrido[0]), Math.round(-f.M - corrido[1]));
      c.restore();
    } else {
      faltó = false;
      copiar(c, lv, solape);
    }
    // armar el próximo: si no hay frente que sirva, si está por salirse del margen, si quedó incompleto o si cambió la
    // capa (las sombras de otra hora); solo con la cámara quieta (sin girar ni acercar)
    if (armando) seguirArmado(cam, solape);
    else if (quieta && (!corrido || Math.abs(corrido[0]) > M * 0.5 || Math.abs(corrido[1]) > M * 0.5 || !f.entero || f.clave !== clave)) {
      empezarArmado(cam, cw, ch, V, M);
      seguirArmado(cam, solape);
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
  // lo que cae en la pantalla: cada cosa tiene su caja en la vista (de ancho su radio, de alto lo que sube más el piso
  // que ocupa achicado por la cámara); lo que queda afuera ni se mira (antes se dibujaba todo un círculo alrededor)
  function cosasVisibles(cam, vis, V, lista) {
    const m = 1500;
    const b0x = Math.floor((vis.x0 - m) / BALDE),
      b1x = Math.floor((vis.x1 + m) / BALDE),
      b0y = Math.floor((vis.y0 - m) / BALDE),
      b1y = Math.floor((vis.y1 + m) / BALDE);
    const k = cam.k;
    for (let by = b0y; by <= b1y; by++)
      for (let bx = b0x; bx <= b1x; bx++) {
        const l = baldes.get(bx + "," + by);
        if (!l) continue;
        for (const o of l) {
          const [sx, sy] = V(o.x, o.y);
          const r = o.radio;
          if (sx + r < vis.vx0 || sx - r > vis.vx1 || sy - o.alto - r * k > vis.vy1 || sy + r * k < vis.vy0) continue;
          if (!seVe(o, cam.esc)) continue;
          lista.push({ y: sy, x: sx, cosa: o, piso: o.enPiso });
        }
      }
  }
  const FIGURAS = new Map(),
    TOPE_FIGURAS = 1200,
    PASOS_GIRO = 128;
  // armar figuras nuevas tiene un tope de tiempo por cuadro (antes, de cantidad: 24 casas grandes daban un tirón)
  let tiempoFiguras = 0,
    gPrevio = 0;
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
      if (tiempoFiguras > 6) {
        // sin presupuesto este cuadro: la de giro más cercano que ya esté hecha, si hay
        // (solo un paso al lado, casi igual: más lejos se notaba que la casa no giraba y después se acomodaba; si no hay,
        // se dibuja entera con el giro exacto)
        for (let d = 1; d < 2 && !f; d++) f = FIGURAS.get(base + ((gq + d) % PASOS_GIRO)) || FIGURAS.get(base + ((gq - d + PASOS_GIRO) % PASOS_GIRO));
        return f || null;
      }
      const tf = performance.now();
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
      tiempoFiguras += performance.now() - tf;
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
  // el rectángulo de la pantalla en la vista (vx, vy) y pasado al piso del mundo (x0..y1), con la prueba de si una
  // baldosa del piso lo toca
  function visible(cam, cw, ch, V) {
    const vw = cw / cam.esc / 2,
      vh = ch / cam.esc / 2;
    const vis = { vx0: cam.x - vw, vx1: cam.x + vw, vy0: cam.y - vh, vy1: cam.y + vh, x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    for (const [ex, ey] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const [wx, wy] = V.inversa(cam.x + ex * vw, cam.y + ey * vh);
      vis.x0 = Math.min(vis.x0, wx);
      vis.y0 = Math.min(vis.y0, wy);
      vis.x1 = Math.max(vis.x1, wx);
      vis.y1 = Math.max(vis.y1, wy);
    }
    vis.toca = (x, y, lado) => {
      let ax = Infinity,
        ay = Infinity,
        bx = -Infinity,
        by = -Infinity;
      for (const [px, py] of [V(x, y), V(x + lado, y), V(x + lado, y + lado), V(x, y + lado)]) {
        if (px < ax) ax = px;
        if (px > bx) bx = px;
        if (py < ay) ay = py;
        if (py > by) by = py;
      }
      return bx > vis.vx0 - 2 && ax < vis.vx1 + 2 && by > vis.vy0 - 2 && ay < vis.vy1 + 2;
    };
    return vis;
  }

  function dibujar(c, cam, cw, ch, t, extra = [], sobrePiso, capa) {
    capaPiso = capa || null;
    const V = proyector(cam);
    // mientras la cámara gira no se arman figuras nuevas (quedarían viejas al cuadro siguiente): las casas se dibujan
    // enteras con el giro exacto, y al quedarse quieta se guardan de a poco (se ven igual, así el cambio no se nota)
    tiempoFiguras = Math.abs(cam.g - gPrevio) > 1e-5 ? Infinity : 0;
    gPrevio = cam.g;
    const vis = visible(cam, cw, ch, V);
    aPiso(c, cam, cw, ch);
    dibujarPiso(c, cam, cw, ch, vis, V);
    aPiso(c, cam, cw, ch);
    if (sobrePiso) sobrePiso(c);
    aVista(c, cam, cw, ch);
    const lista = [];
    cosasVisibles(cam, vis, V, lista);
    // lo que se mueve (gente, animales, Eromash): también solo lo que cae en la pantalla
    for (const e of extra) {
      const [sx, sy] = V(e.x, e.y);
      if (sx < vis.vx0 - 300 || sx > vis.vx1 + 300 || sy < vis.vy0 - 100 || sy > vis.vy1 + 1300) continue;
      lista.push({ y: sy, x: sx, e, piso: 0 });
    }
    // lo pintado en el piso (losas, charcos) va primero, debajo de todo lo parado
    lista.sort((a, b) => b.piso - a.piso || a.y - b.y);
    const cl = claro(lista, cam);
    for (const d of lista) {
      if (d.e) d.e.f(c, d.x, d.y);
      else if (d.enClaro) dibujarEnClaro(c, d, cl, cam, V, t);
      else dibujarCosa(c, d.cosa, d.x, d.y, cam, V, t);
    }
    ultima = lista;
    return { V, lista };
  }
  // ---------- el claro de Eromash: las copas que lo tapan se vuelven transparentes alrededor de él ----------
  // Como en el bosque (prepararAura en motor/juego.js): un óvalo alrededor de Eromash donde los árboles que se dibujan
  // después de él (el Roble, los pinos, los abedules) se ven casi transparentes; el centro es lo más claro y el borde
  // sube por escalones hasta opaco. Cada árbol se dibuja recortado: afuera del óvalo entero y adentro por anillos.
  // Calidad baja lo apaga (queda la silueta).
  const COPAS = { robleGigante: 1, pino: 1, abedul: 1 };
  // la máscara del óvalo, hecha una sola vez: casi transparente en el centro, sube suave (smoothstep) hasta opaco
  const MASCARA = (() => {
    const L = 256,
      m = L / 2,
      cv = document.createElement("canvas");
    cv.width = cv.height = L;
    const g2 = cv.getContext("2d"),
      g = g2.createRadialGradient(m, m, 0, m, m, m);
    g.addColorStop(0, "rgba(0,0,0,0.12)");
    for (let i = 0; i <= 8; i++) {
      const q = i / 8;
      g.addColorStop(0.3 + q * 0.68, "rgba(0,0,0," + (0.12 + 0.88 * q * q * (3 - 2 * q)).toFixed(3) + ")");
    }
    g.addColorStop(1, "rgba(0,0,0,1)");
    g2.fillStyle = g;
    g2.beginPath();
    g2.arc(m, m, m, 0, Math.PI * 2);
    g2.fill();
    return cv;
  })();
  const capaCv = document.createElement("canvas"),
    capaC = capaCv.getContext("2d");
  function claro(lista, cam) {
    if (window.CALIDAD && CALIDAD.nivel === "baja") return null;
    const i = lista.findIndex((d) => d.e && d.e.ero);
    if (i < 0) return null;
    const ero = lista[i],
      cl = { x: ero.x, y: ero.y - 80, rx: 300, ry: 255 };
    for (let j = i + 1; j < lista.length; j++) {
      const d = lista[j];
      if (!d.cosa || d.piso || !COPAS[d.cosa.id]) continue;
      const o = d.cosa,
        r = o.radio * (o.id === "robleGigante" ? 0.75 : 0.9);
      // su copa (de su pie hacia arriba, con su ancho) se cruza con el óvalo
      if (d.x + r < cl.x - cl.rx || d.x - r > cl.x + cl.rx || d.y - o.alto > cl.y + cl.ry || d.y < cl.y - cl.ry) continue;
      d.enClaro = true;
    }
    return cl;
  }
  function elipse(c, cl, k) {
    c.ellipse(cl.x, cl.y, cl.rx * k, cl.ry * k, 0, 0, Math.PI * 2);
  }
  function dibujarEnClaro(c, d, cl, cam, V, t) {
    // afuera del óvalo, entero
    c.save();
    c.beginPath();
    c.rect(cl.x - 1e5, cl.y - 1e5, 2e5, 2e5);
    elipse(c, cl, 1);
    c.clip("evenodd");
    dibujarCosa(c, d.cosa, d.x, d.y, cam, V, t);
    c.restore();
    // adentro: el árbol aparte (así sus partes no se ven unas a través de otras) y pasado por la máscara
    const e = cam.esc,
      w = Math.max(2, Math.ceil(cl.rx * 2 * e)),
      h = Math.max(2, Math.ceil(cl.ry * 2 * e));
    if (capaCv.width !== w || capaCv.height !== h) {
      capaCv.width = w;
      capaCv.height = h;
    }
    capaC.setTransform(1, 0, 0, 1, 0, 0);
    capaC.globalCompositeOperation = "source-over";
    capaC.clearRect(0, 0, w, h);
    capaC.setTransform(e, 0, 0, e, -(cl.x - cl.rx) * e, -(cl.y - cl.ry) * e);
    dibujarCosa(capaC, d.cosa, d.x, d.y, cam, V, t);
    capaC.setTransform(1, 0, 0, 1, 0, 0);
    capaC.globalCompositeOperation = "destination-in";
    capaC.drawImage(MASCARA, 0, 0, w, h);
    capaC.globalCompositeOperation = "source-over";
    c.drawImage(capaCv, cl.x - cl.rx, cl.y - cl.ry, cl.rx * 2, cl.ry * 2);
  }
  // ¿algo parado tapa este punto de la vista? (una casa o un árbol que se dibuja después y sube por encima)
  let ultima = [];
  function tapado(sx, sy, alto = 150) {
    for (const d of ultima) {
      if (!d.cosa || d.piso || d.y <= sy) continue;
      const o = d.cosa;
      if (Math.abs(d.x - sx) < o.radio * 0.8 && d.y - o.alto < sy - alto * 0.4) return true;
    }
    return false;
  }
  // lo que tapa a Eromash (con la misma regla que tapado) y cómo redibujarlo en otro lienzo, para recortar su silueta
  function tapas(sx, sy, alto = 150) {
    return ultima.filter((d) => d.cosa && !d.piso && !d.enClaro && d.y > sy && Math.abs(d.x - sx) < d.cosa.radio * 0.8 && d.y - d.cosa.alto < sy - alto * 0.4);
  }
  function dibujarTapas(c, l, cam, t) {
    const V = proyector(cam);
    for (const d of l) dibujarCosa(c, d.cosa, d.x, d.y, cam, V, t);
  }

  const estadoPiso = () => ({ ok: frente.ok, armando: armando && [armando.i, armando.l.length], entero: frente.entero, esc: escCache });
  return { iniciar, dibujar, tapado, tapas, dibujarTapas, estadoPiso, proyector, aVista, aPiso, TROZO, LEJOS };
})();
