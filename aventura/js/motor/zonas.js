// ---------- las zonas del generador: mazmorras oscuras y tierras con islas (sistema ZONAS) ----------
// Una zona vive fuera del mapa del bosque (ELDERVALD.EXTRAS), como la cámara de Góinn, y se arma con datos que se
// pueden generar y retocar en el editor (sección Zonas):
//   · mazmorra: salas y pasillos en una grilla de celdas de 200 (salas: entrada, sala, oscura, tesoro, jefe). Es
//     oscura (J.oscuro): las salas comunes tienen antorchas de pared, las oscuras braseros que se encienden con E. En
//     cada sala espera un grupo con su líder; en la del jefe, el jefe (un dreki o el campeón de la familia), que llama a
//     lo sumo a tres y deja un cofre rico. Se sale por la escalera de la entrada.
//   · tierra: masas de tierra (la grande y las islas) en el mar, con lo pedido encima (volcán, cueva, campamento,
//     ruinas, bosque) y una barca en el muelle para volver. Una cueva puede llevar a una mazmorra.
// En el bosque cada zona tiene su entrada (la boca de la cripta o la barca de las islas) en `en`. Tres mazmorras ya
// vienen con el juego; las del editor van en AGREGADOS.zonas[id]. Lo hecho se guarda en E.extra.zonas.
window.ZONAS = (function () {
  "use strict";
  let A, J, jug, W, CB;
  const t = (k, v) => I18N.t(k, v);
  const C = 200, // una celda de mazmorra
    H = 150; // el alto de las paredes
  const armadas = []; // { id, d, x0, y0, x1, y1, ... }
  let st = { cofres: {}, jefes: {}, fuegos: {} };
  let aqui = null; // la zona donde está Eromash

  // ---------- los generadores (también los usa el editor) ----------
  const FAMILIAS = ["draugr", "muertos", "fatuos", "lobos", "cuervos", "trol", "jabalies"];
  const MIEMBROS = { draugr: ["draugr", "draugr", "errante"], muertos: ["errante", "errante", "fatuo"], fatuos: ["fatuo", "fatuo", "errante"], lobos: ["lobo", "lobo", "lobo"], cuervos: ["cuervo", "cuervo", "cuervo", "cuervo"], trol: ["jabali", "draugr"], jabalies: ["jabali", "jabali", "jabali"] };
  const LIDER = { draugr: "draugr", muertos: "draugr", fatuos: "fatuo", lobos: "lobo", cuervos: "cuervo", trol: "trol", jabalies: "jabali" };
  const COSAS = ["volcan", "cueva", "campamento", "ruinas", "bosque", "cofre"];
  const r3 = (v) => Math.round(v * 1000) / 1000;
  // op = { salas, jefe ("dreki" | "campeon" | null), familia, oscuras (0..1), nombre }
  function generarMazmorra(op, sem) {
    op = op || {};
    const r = DIB.azar(Math.round((sem || 0) * 100000) + 9001);
    const GW = 40,
      GH = 30,
      n = Math.max(3, Math.min(14, op.salas || 7 + Math.floor(r() * 4)));
    const salas = [];
    const choca = (a) => salas.some((b) => a.x < b.x + b.w + 2 && b.x < a.x + a.w + 2 && a.y < b.y + b.h + 2 && b.y < a.y + a.h + 2);
    const poner = (w, h, x0, x1, tipo) => {
      for (let k = 0; k < 300; k++) {
        const s = { x: x0 + Math.floor(r() * Math.max(1, x1 - x0 - w)), y: 2 + Math.floor(r() * (GH - h - 3)), w, h, tipo };
        if (s.x < 1 || s.x + s.w > GW - 1 || choca(s)) continue;
        salas.push(s);
        return s;
      }
      return null;
    };
    poner(5, 4, 1, 12, "entrada");
    const jefe = op.jefe === undefined ? (r() < 0.7 ? "campeon" : null) : op.jefe;
    if (jefe) poner(9, 7, 26, GW - 1, "jefe");
    for (let k = 0; salas.length < n && k < 60; k++) poner(4 + Math.floor(r() * 5), 3 + Math.floor(r() * 4), 1, GW - 1, "sala");
    // la más chica de las comunes guarda el tesoro; algunas quedan a oscuras
    const comunes = salas.filter((s) => s.tipo === "sala").sort((a, b) => a.w * a.h - b.w * b.h);
    if (comunes.length > 1) comunes[0].tipo = "tesoro";
    const osc = op.oscuras != null ? op.oscuras : 0.35;
    comunes.slice(1).forEach((s) => r() < osc && (s.tipo = "oscura"));
    // los pasillos: cada sala se une a la más cercana de las ya unidas (y uno más para dar una vuelta)
    const centro = (s) => [Math.floor(s.x + s.w / 2), Math.floor(s.y + s.h / 2)];
    const pasillos = [],
      unidas = [0];
    const unir = (a, b) => {
      const [ax, ay] = centro(salas[a]),
        [bx, by] = centro(salas[b]);
      pasillos.push({ a, b, p: r() < 0.5 ? [[ax, ay], [bx, ay], [bx, by]] : [[ax, ay], [ax, by], [bx, by]] });
    };
    while (unidas.length < salas.length) {
      let mejor = null;
      salas.forEach((s, i) => {
        if (unidas.includes(i)) return;
        unidas.forEach((j) => {
          if (salas[j].tipo === "jefe" && salas.length > 2) return;
          const d = Math.hypot(centro(s)[0] - centro(salas[j])[0], centro(s)[1] - centro(salas[j])[1]);
          if (!mejor || d < mejor.d) mejor = { i, j, d };
        });
      });
      if (!mejor) break;
      unir(mejor.j, mejor.i);
      unidas.push(mejor.i);
    }
    const otras = salas.map((s, i) => i).filter((i) => salas[i].tipo !== "jefe");
    if (otras.length > 3) unir(otras[1 + Math.floor(r() * (otras.length - 1))], otras[Math.floor(r() * otras.length)]);
    return { tipo: "mazmorra", nombre: op.nombre || t("zn.nombre_mazmorra"), sem: r3(sem || 0), ancho: GW, alto: GH, salas, pasillos, familia: FAMILIAS.includes(op.familia) ? op.familia : FAMILIAS[Math.floor(r() * 3)], jefe, pal: Math.floor(r() * 3) };
  }
  // una mancha de tierra: polígono de n puntos con borde quebrado
  function mancha(r, cx, cy, rx, ry, n) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2,
        k = 0.78 + r() * 0.34;
      pts.push([Math.round(cx + Math.cos(a) * rx * k), Math.round(cy + Math.sin(a) * ry * k)]);
    }
    return pts;
  }
  // op = { islas, grande (bool), rasgos: [{ cosa, donde: "isla" | "tierra", mazmorra: { jefe, familia } }], nombre }
  function generarTierra(op, sem) {
    op = op || {};
    const r = DIB.azar(Math.round((sem || 0) * 100000) + 7177);
    const AW = 16000,
      AH = 12000,
      cx = AW / 2,
      cy = AH / 2;
    const masas = [];
    const grande = op.grande !== false;
    const RG = grande ? 3000 + r() * 600 : 0;
    if (grande) masas.push({ pts: mancha(r, cx, cy, RG * 1.25, RG * 0.85, 26), isla: false, c: [cx, cy], r: RG });
    const ni = Math.max(0, Math.min(8, op.islas != null ? op.islas : grande ? 3 + Math.floor(r() * 3) : 5));
    for (let i = 0, k = 0; masas.filter((m) => m.isla).length < ni && k < 400; k++) {
      const a = (i / Math.max(1, ni)) * Math.PI * 2 + r() * 0.8 + 0.4,
        rad = 850 + r() * 650,
        d = grande ? RG * 1.25 + rad + 700 + r() * 900 : 1800 + r() * 3200;
      const px = cx + Math.cos(a) * d * (grande ? 1.05 : 1.1),
        py = cy + Math.sin(a) * d * 0.72;
      if (px - rad * 1.2 < 600 || px + rad * 1.2 > AW - 600 || py - rad < 700 || py + rad > AH - 600) continue;
      if (masas.some((m) => Math.hypot(m.c[0] - px, (m.c[1] - py) * 1.2) < m.r * (m.isla ? 1.1 : 1.3) + rad + 450)) continue;
      masas.push({ pts: mancha(r, px, py, rad * 1.15, rad * 0.8, 16), isla: true, c: [Math.round(px), Math.round(py)], r: Math.round(rad) });
      i++;
    }
    // lo pedido, cada cosa en su lugar: lo de «una isla» en una isla libre, lo de «la tierra» en la grande
    const cosas = [];
    const usadas = new Set();
    const libreEn = (donde) => {
      const lista = masas.map((m, i) => i).filter((i) => (donde === "tierra" ? !masas[i].isla : donde === "isla" ? masas[i].isla : true));
      return lista.find((i) => !usadas.has(i)) ?? lista[0] ?? 0;
    };
    (op.rasgos || []).forEach((rg) => {
      if (!COSAS.includes(rg.cosa) || !masas.length) return;
      const mi = libreEn(rg.donde || (masas.some((m) => m.isla) ? "isla" : "tierra"));
      const m = masas[mi];
      const enMasa = !m.isla && cosas.some((c) => c.m === mi);
      usadas.add(mi);
      // en la tierra grande cada cosa en su rincón; en una isla, en el medio
      const a = r() * Math.PI * 2,
        d = enMasa || !m.isla ? m.r * (0.35 + r() * 0.25) : 0;
      const c0 = { tipo: rg.cosa, x: Math.round(m.c[0] + Math.cos(a) * d * 1.2), y: Math.round(m.c[1] + Math.sin(a) * d * 0.7 + (rg.cosa === "volcan" ? m.r * 0.2 : 0)), m: mi };
      if (rg.cosa === "cueva" && rg.mazmorra) c0.mazmorra = rg.mazmorra;
      if (rg.cosa === "campamento") c0.familia = FAMILIAS.includes(rg.familia) ? rg.familia : FAMILIAS[Math.floor(r() * FAMILIAS.length)];
      cosas.push(c0);
    });
    // el muelle: en la costa de abajo de la tierra grande (o de la primera isla)
    const mm = masas[0];
    if (mm) {
      const abajo = mm.pts.reduce((b, p) => (p[1] > b[1] ? p : b), mm.pts[0]);
      cosas.push({ tipo: "muelle", x: abajo[0], y: abajo[1] + 60, m: 0 });
    }
    return { tipo: "tierra", nombre: op.nombre || t("zn.nombre_tierra"), sem: r3(sem || 0), ancho: AW, alto: AH, masas: masas.map((m) => ({ pts: m.pts, isla: m.isla, c: m.c, r: m.r })), cosas, bosque: op.bosque != null ? op.bosque : 0.55 };
  }

  // ---------- leer un pedido escrito (sin IA) ----------
  // «gran trozo de tierra con islas alrededor, una de las islas tiene que tener un volcán, otra isla una cueva, esa
  // cueva lleva a una mazmorra con un dragón adentro» → { tipo: "tierra", islas, grande, rasgos: [...] }
  const NUM = { una: 1, un: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, a: 1, an: 1 };
  const num = (w) => (/^\d+$/.test(w) ? +w : NUM[w]);
  const COSA_DE = [
    ["volcan", /volc[aá]n|volcano/],
    ["cueva", /cueva|caverna|gruta|cave/],
    ["campamento", /campamento|camp\b|guarida/],
    ["ruinas", /ruinas|templo|ruins|temple/],
    ["bosque", /bosque|forest|selva|arboleda/],
    ["cofre", /tesoro|cofre|treasure|chest/],
  ];
  const FAM_DE = [
    ["trol", /trol/],
    ["lobos", /lobo|wolf|wolves/],
    ["cuervos", /cuervo|raven|crow/],
    ["fatuos", /fatuo|fuego fatuo|wisp|espectro|fantasma|ghost/],
    ["jabalies", /jabal|boar/],
    ["muertos", /muerto|esqueleto|zombi|undead|skeleton/],
    ["draugr", /draugr/],
  ];
  function leerPedido(txt) {
    const s0 = " " + String(txt || "").toLowerCase() + " ";
    const hayTierra = /isla|island|tierra|continente|land|zona|costa|mar\b|sea/.test(s0);
    const hayMaz = /mazmorra|cripta|calabozo|dungeon|crypt|catacumba/.test(s0);
    const jefeDe = (s) => (/drag[oó]n|dragon|dreki|wyrm|sierpe/.test(s) ? "dreki" : /jefe|boss|campe[oó]n|se[nñ]or/.test(s) ? "campeon" : undefined);
    const famDe = (s) => (FAM_DE.find(([, re]) => re.test(s)) || [])[0];
    const m0 = s0.match(/[«"“]([^»"”]{2,60})[»"”]/);
    const nombre = m0 ? txt.match(/[«"“]([^»"”]{2,60})[»"”]/)[1] : undefined;
    if (hayMaz && !hayTierra) {
      const ms = s0.match(/(\d+|dos|tres|cuatro|cinco|seis|siete|ocho|two|three|four|five|six|seven|eight)\s+(salas|cuartos|habitaciones|rooms|c[aá]maras)/);
      return { tipo: "mazmorra", salas: ms ? num(ms[1]) : undefined, jefe: jefeDe(s0) || null, familia: famDe(s0), oscuras: /oscur|dark|negr/.test(s0) ? 0.7 : undefined, nombre };
    }
    const mi = s0.match(/(\d+|dos|tres|cuatro|cinco|seis|siete|ocho|two|three|four|five|six|seven|eight)\s+(islas|islands|islotes)/);
    const islas = mi ? num(mi[1]) : /islas|islands|islotes/.test(s0) ? 4 : /\buna isla\b|\ban island\b/.test(s0) ? 1 : 0;
    const grande = /tierra|continente|isla grande|trozo|land|main/.test(s0) || !islas;
    const rasgos = [];
    // cada frase dice dónde va qué; «esa cueva lleva a una mazmorra…» se pega a la última cueva
    s0.split(/[,.;]|\by\b(?= (?:otra|una|la|el|esa|ese|en)\b)|\band\b/).forEach((fr) => {
      const donde = /isla|island|islote/.test(fr) ? "isla" : /tierra|continente|grande|land|main/.test(fr) ? "tierra" : null;
      const maz = /mazmorra|cripta|calabozo|dungeon|crypt|catacumba/.test(fr);
      COSA_DE.forEach(([cosa, re]) => {
        if (!re.test(fr)) return;
        if (cosa === "cueva" && /esa cueva|that cave|la cueva/.test(fr) && rasgos.some((r) => r.cosa === "cueva")) return;
        if (cosa === "cofre" && maz) return;
        rasgos.push({ cosa, donde: donde || (islas ? "isla" : "tierra"), familia: famDe(fr) });
      });
      if (maz) {
        let cueva = [...rasgos].reverse().find((r) => r.cosa === "cueva");
        if (!cueva) rasgos.push((cueva = { cosa: "cueva", donde: donde || (islas ? "isla" : "tierra") }));
        cueva.mazmorra = { jefe: jefeDe(fr) || jefeDe(s0) || "campeon", familia: famDe(fr) || (jefeDe(fr) === "dreki" ? "fatuos" : undefined), oscuras: /oscur|dark/.test(fr) ? 0.7 : undefined };
      }
    });
    return { tipo: "tierra", islas, grande, rasgos, nombre };
  }
  // del pedido a las zonas: la tierra y una mazmorra por cada cueva que lleva a una. Devuelve { [id]: datos }.
  function armarPedido(p, sem, id) {
    const out = {};
    if (p.tipo === "mazmorra") {
      out[id] = generarMazmorra(p, sem);
      return out;
    }
    const tierra = generarTierra(p, sem);
    let k = 0;
    tierra.cosas.forEach((c) => {
      if (c.tipo !== "cueva" || !c.mazmorra) return;
      const mid = id + "m" + k++;
      out[mid] = generarMazmorra(Object.assign({ nombre: t(c.mazmorra.jefe === "dreki" ? "zn.nombre_guarida" : "zn.nombre_cueva", [tierra.nombre]) }, c.mazmorra), (sem * 7.31 + k) % 1);
      out[mid].desde = { zona: id };
      c.a = mid;
      delete c.mazmorra;
    });
    out[id] = tierra;
    return out;
  }

  // ---------- las tres mazmorras que vienen con el juego ----------
  function base() {
    const L = W.LUGARES,
      z = {};
    const lugar = (k, dx, dy) => L[k] && [L[k].p[0] + dx, L[k].p[1] + dy];
    const pon = (id, p, op, sem) => {
      if (!p) return;
      const d = generarMazmorra(Object.assign({ nombre: t("zn.base_" + id) }, op), sem);
      d.en = { x: Math.round(p[0]), y: Math.round(p[1]) };
      d.base = true;
      z[id] = d;
    };
    pon("cripta", lugar("tumulo", 520, -260), { familia: "draugr", jefe: "campeon", salas: 8 }, 0.211);
    pon("mina", lugar("skarnholt", -640, 380), { familia: "trol", jefe: "campeon", salas: 9, oscuras: 0.6 }, 0.533);
    pon("hondonada", lugar("torre", 600, 520), { familia: "fatuos", jefe: "dreki", salas: 10, oscuras: 0.5 }, 0.871);
    return z;
  }

  // ---------- armar cada zona en su lugar fuera del mapa ----------
  const enPoli = (pts, x, y) => {
    let d = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i],
        [xj, yj] = pts[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d;
    }
    return d;
  };
  function armarZona(id, d, k) {
    const x0 = W.ANCHO + 14000 + (k % 4) * 18000,
      y0 = Math.floor(k / 4) * 14000;
    const Z = { id, d, x0, y0, x1: x0 + (d.tipo === "mazmorra" ? d.ancho * C : d.ancho), y1: y0 + (d.tipo === "mazmorra" ? d.alto * C : d.alto), enemigos: [], cofres: [], fuegos: [], obst: [], arboles: [] };
    const r = DIB.azar(Math.round((d.sem || 0) * 100000) + 31 + k);
    if (d.tipo === "mazmorra") armarMazmorra(Z, r);
    else armarTierra(Z, r);
    Z.libre = (x, y, rr) => libreEn(Z, x, y, rr);
    W.EXTRAS.push(Z);
    armadas.push(Z);
    return Z;
  }
  function armarMazmorra(Z, r) {
    const d = Z.d,
      g = new Uint8Array(d.ancho * d.alto),
      sala = new Int16Array(d.ancho * d.alto).fill(-1);
    const marcar = (x, y, v, si) => {
      if (x < 0 || y < 1 || x >= d.ancho || y >= d.alto - 1) return;
      g[y * d.ancho + x] = v;
      if (si != null && sala[y * d.ancho + x] < 0) sala[y * d.ancho + x] = si;
    };
    d.salas.forEach((s, si) => {
      for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) marcar(x, y, 1, si);
    });
    (d.pasillos || []).forEach((pa) => {
      for (let i = 0; i + 1 < pa.p.length; i++) {
        const [ax, ay] = pa.p[i],
          [bx, by] = pa.p[i + 1];
        for (let x = Math.min(ax, bx); x <= Math.max(ax, bx) + 1; x++) for (let y = Math.min(ay, by); y <= Math.max(ay, by) + 1; y++) marcar(x, y, g[y * d.ancho + x] || 2);
      }
    });
    Z.g = g;
    Z.sala = sala;
    const X = (cx) => Z.x0 + cx * C,
      Y = (cy) => Z.y0 + cy * C;
    const libreCelda = (x, y) => g[y * d.ancho + x] > 0;
    d.salas.forEach((s, si) => {
      const cx = X(s.x + s.w / 2),
        cy = Y(s.y + s.h / 2);
      if (s.tipo === "entrada") {
        Z.escalera = { x: cx, y: Y(s.y) + 60 };
        Z.llegada = { x: cx, y: Y(s.y) + 260 };
      }
      // las antorchas de la pared de arriba (las salas oscuras no tienen: braseros apagados)
      s.antorchas = [];
      if (s.tipo !== "oscura" && s.tipo !== "jefe") for (let x = s.x + 1; x < s.x + s.w - 1; x += 3) if (!libreCelda(x, s.y - 1)) s.antorchas.push(x);
      const fuego = (fx, fy, k2) => Z.fuegos.push({ x: fx, y: fy, k: Z.id + "_f" + k2, sala: si });
      if (s.tipo === "oscura") {
        fuego(X(s.x) + 160, Y(s.y) + 200, si + "a");
        fuego(X(s.x + s.w) - 160, Y(s.y + s.h) - 120, si + "b");
      }
      if (s.tipo === "jefe") [[X(s.x) + 200, Y(s.y) + 240], [X(s.x + s.w) - 200, Y(s.y) + 240], [X(s.x) + 200, Y(s.y + s.h) - 140], [X(s.x + s.w) - 200, Y(s.y + s.h) - 140]].forEach(([fx, fy], i) => fuego(fx, fy, si + "j" + i));
      // los pilares de las salas grandes
      if (s.w >= 6 && s.h >= 5 && s.tipo !== "entrada")
        [[0.3, 0.38], [0.7, 0.38], [0.3, 0.75], [0.7, 0.75]].forEach(([u, v], i) => (s.tipo === "jefe" || i < 2) && Z.obst.push({ id: "pilarCripta", x: X(s.x + s.w * u), y: Y(s.y + s.h * v), r: 60, runa: ["eihwaz", "hagalaz", "naudiz", "isa"][i] }));
      if (s.tipo === "tesoro") Z.cofres.push({ x: cx, y: cy, k: Z.id + "_c" + si, rico: true });
      // la gente de cada sala: un grupo con su líder (más grande en las salas grandes)
      if (s.tipo === "sala" || s.tipo === "oscura" || s.tipo === "tesoro") {
        const fam = d.familia,
          grupo = [],
          n = Math.min(5, 2 + Math.floor((s.w * s.h) / 12));
        for (let i = 0; i < n; i++) {
          const ex = X(s.x + 1 + r() * (s.w - 2)),
            ey = Y(s.y + 1 + r() * (s.h - 2));
          const tipo = MIEMBROS[fam][i % MIEMBROS[fam].length];
          grupo.push(CB.crear(tipo, ex, ey, { pal: d.pal || 0, grupo, mas: 1.3 }));
        }
        if (s.w * s.h >= 20 && window.HORDAS && HORDAS.liderNuevo) grupo.push(CB.crear(LIDER[fam], cx, cy, { pal: d.pal || 0, grupo, lider: HORDAS.liderNuevo(), mas: 1.3 }));
        grupo.forEach((e) => ((e.zona = Z.id), Z.enemigos.push(e), A.enemigos.push(e)));
      }
      if (s.tipo === "jefe" && d.jefe) armarJefe(Z, s, cx, cy);
    });
  }
  function armarJefe(Z, s, cx, cy) {
    const d = Z.d,
      grupo = [];
    const dreki = d.jefe === "dreki";
    const tipo = dreki ? "dreki" : LIDER[d.familia];
    const e = CB.crear(tipo, cx, cy - 40, { pal: d.pal || 0, grupo, lider: { unico: true, afijos: dreki ? ["igneo"] : ["piedra"], nombre: "", titulo: "" } });
    if (!dreki) {
      e.s = 1.45;
      e.d.radio *= e.s;
      e.d.barra *= e.s;
      e.d.vida = e.vida = Math.round(e.d.vida * 3);
    }
    e.d.dano = Math.min(e.d.dano, 30);
    e.patron = dreki ? ["franja", "abanico", "circulo", "franja", "abanico", "franja", "circulo"] : ["abanico", "franja", "abanico", "circulo", "franja"];
    e.jefeZona = Z.id;
    grupo.push(e);
    // los que llama: nunca más de tres a la vez
    const esb = [];
    for (let i = 0; i < 3; i++) {
      const m = CB.crear(dreki ? "fatuo" : MIEMBROS[d.familia][0], cx, cy, { pal: dreki ? 0 : d.pal || 0, grupo });
      m.activo = false;
      m.muerto = 1;
      m.esbirroZona = Z.id;
      grupo.push(m);
      esb.push(m);
    }
    grupo.forEach((q) => ((q.zona = Z.id), Z.enemigos.push(q), A.enemigos.push(q)));
    Z.jefe = { e, esb, llamo: 0, sala: s, cx, cy };
    rotularJefe(Z);
  }
  function rotularJefe(Z) {
    if (!Z.jefe) return;
    const l = Z.jefe.e.lider;
    l.nombre = Z.d.jefe === "dreki" ? t("zn.dreki_" + (Z.d.pal || 0)) : t("zn.campeon", [t("zn.fam_" + Z.d.familia)]);
    l.titulo = t(Z.d.jefe === "dreki" ? "zn.dreki_titulo" : "zn.campeon_titulo");
  }
  // los bancos de arena de una tierra (también los dibuja el editor): cada isla se une a la tierra grande o, si no
  // hay, a la isla anterior, por el tramo más corto de costa a costa, metido un poco en cada costa
  function pasosDe(masas) {
    const pasos = [];
    masas.forEach((m, mi) => {
      if (!m.isla) return;
      let mejor = null;
      masas.forEach((o, oi) => {
        if (oi === mi || (o.isla && masas.some((q) => !q.isla)) || (o.isla && oi > mi)) return;
        m.pts.forEach(([ax, ay]) =>
          o.pts.forEach(([bx, by]) => {
            const dd = Math.hypot(ax - bx, (ay - by) * 1.2);
            if (!mejor || dd < mejor.d) mejor = { d: dd, ax, ay, bx, by };
          })
        );
      });
      if (!mejor) return;
      const ux = (mejor.bx - mejor.ax) / (mejor.d || 1),
        uy = (mejor.by - mejor.ay) / (mejor.d || 1);
      pasos.push({ ax: mejor.ax - ux * 90, ay: mejor.ay - uy * 90, bx: mejor.bx + ux * 90, by: mejor.by + uy * 90, w: 320 });
    });
    return pasos;
  }
  function armarTierra(Z, r) {
    const d = Z.d;
    Z.masas = d.masas.map((m) => Object.assign({}, m, { pts: m.pts.map(([x, y]) => [Z.x0 + x, Z.y0 + y]), c: [Z.x0 + m.c[0], Z.y0 + m.c[1]] }));
    Z.cosas = d.cosas.map((c, i) => Object.assign({}, c, { x: Z.x0 + c.x, y: Z.y0 + c.y, i }));
    Z.cosas.forEach((c) => {
      const m = Z.masas[c.m];
      if (m && c.tipo === "volcan") m.ceniza = true;
      if (c.tipo === "volcan") Z.obst.push({ id: "volcan", x: c.x, y: c.y, r: 560, ry: 0.45, s: Math.min(1.2, (m ? m.r : 1000) / 1100) });
      if (c.tipo === "cueva") Z.obst.push({ id: "bocaCueva", x: c.x, y: c.y, r: 130, ry: 0.3, cosa: c });
      if (c.tipo === "ruinas") [[-200, -40], [180, -60], [0, 120], [-60, -200]].forEach(([dx, dy], k) => Z.obst.push({ id: "pilarCripta", x: c.x + dx, y: c.y + dy, r: 60, runa: ["ansuz", "othala", "tiwaz", "gebo"][k] }));
      if (c.tipo === "cofre") Z.cofres.push({ x: c.x, y: c.y, k: Z.id + "_c" + c.i, rico: true });
      if (c.tipo === "campamento") {
        const fam = c.familia || "lobos",
          grupo = [];
        for (let i = 0; i < 4; i++) grupo.push(CB.crear(MIEMBROS[fam][i % MIEMBROS[fam].length], c.x + Math.cos(i * 1.7) * 160, c.y + Math.sin(i * 1.7) * 110, { pal: i % 3, grupo, mas: 1.4 }));
        if (window.HORDAS && HORDAS.liderNuevo) grupo.push(CB.crear(LIDER[fam], c.x, c.y + 30, { pal: 1, grupo, lider: HORDAS.liderNuevo(), mas: 1.4 }));
        grupo.forEach((e) => ((e.zona = Z.id), Z.enemigos.push(e), A.enemigos.push(e)));
        Z.obst.push({ id: "totemCampamento", x: c.x + 60, y: c.y - 40, r: 30, tipo: { lobos: "lobo", jabalies: "jabali", draugr: "draugr", muertos: "draugr", fatuos: "fatuo", cuervos: "cuervo", trol: "trol" }[fam] });
      }
      if (c.tipo === "muelle") {
        Z.barca = { x: c.x, y: c.y + 80 };
        Z.llegada = { x: c.x, y: c.y - 200 };
      }
    });
    if (!Z.llegada && Z.masas[0]) Z.llegada = { x: Z.masas[0].c[0], y: Z.masas[0].c[1] };
    // los bancos de arena: cada isla queda unida a la tierra más cercana por el tramo más corto de costa a costa
    Z.pasos = d.pasos === false ? [] : pasosDe(Z.masas);
    // el bosque de cada masa: pinos y rocas que no tapan lo pedido ni la costa
    const dens = d.bosque != null ? d.bosque : 0.55;
    Z.masas.forEach((m, mi) => {
      const n = Math.round(((m.r * m.r) / 90000) * dens * (m.ceniza ? 0.25 : 1));
      for (let i = 0, k = 0; i < n && k < n * 4; k++) {
        const x = m.c[0] + (r() * 2 - 1) * m.r * 1.3,
          y = m.c[1] + (r() * 2 - 1) * m.r * 0.9;
        if (!enPoli(m.pts, x, y) || !enPoli(m.pts, x, y + 220) || !enPoli(m.pts, x - 160, y) || !enPoli(m.pts, x + 160, y)) continue;
        if (Z.cosas.some((c) => Math.hypot(c.x - x, (c.y - y) * 1.4) < (c.tipo === "volcan" ? 900 : c.tipo === "bosque" ? 0 : 420))) continue;
        if (Z.llegada && Math.hypot(Z.llegada.x - x, Z.llegada.y - y) < 420) continue;
        const bosque = Z.cosas.find((c) => c.tipo === "bosque" && Math.hypot(c.x - x, c.y - y) < 900);
        const roca = m.ceniza ? r() < 0.7 : r() < 0.12;
        Z.arboles.push({ id: roca ? "roca" : r() < 0.15 ? "abetoAnciano" : "pino", x, y, s: roca ? 0.8 + r() * 0.6 : 0.85 + r() * 0.5, sem: r(), r: roca ? 40 : 26 });
        i++;
        if (bosque && r() < 0.6) i--;
      }
    });
  }
  function distSeg(x, y, q) {
    const vx = q.bx - q.ax,
      vy = q.by - q.ay,
      u = Math.max(0, Math.min(1, ((x - q.ax) * vx + (y - q.ay) * vy) / (vx * vx + vy * vy || 1)));
    return Math.hypot(x - q.ax - vx * u, y - q.ay - vy * u);
  }
  function libreEn(Z, x, y, rr) {
    if (Z.d.tipo === "mazmorra") {
      const k = rr * 0.8;
      for (const [dx, dy] of [[0, 0], [-k, 0], [k, 0], [0, -k * 0.5], [0, k * 0.5]]) {
        const cx = Math.floor((x + dx - Z.x0) / C),
          cy = Math.floor((y + dy - Z.y0) / C);
        if (cx < 0 || cy < 0 || cx >= Z.d.ancho || cy >= Z.d.alto || !Z.g[cy * Z.d.ancho + cx]) return false;
      }
    } else {
      const m = Z.masas.some((m0) => enPoli(m0.pts, x, y) && enPoli(m0.pts, x - rr, y) && enPoli(m0.pts, x + rr, y) && enPoli(m0.pts, x, y + rr * 0.5));
      if (!m && !Z.pasos.some((q) => distSeg(x, y, q) < q.w / 2 - rr)) return false;
      for (const a of Z.arboles) if (Math.abs(a.x - x) < a.r + rr && Math.hypot(a.x - x, (a.y - y) * 1.6) < a.r + rr) return false;
    }
    for (const o of Z.obst) if (Math.hypot(o.x - x, (o.y - y) / (o.ry || 0.6)) < o.r + rr) return false;
    return true;
  }

  // ---------- entrar, salir y pasar ----------
  const zonaDe = (id) => armadas.find((z) => z.id === id);
  const dentroDe = (x, y) => armadas.find((z) => x >= z.x0 - 400 && x <= z.x1 + 400 && y >= z.y0 - 400 && y <= z.y1 + 400) || null;
  function entrar(Z) {
    if (!Z.llegada) return;
    A.teletransportar(Z.llegada.x, Z.llegada.y);
    // el cartel dorado con su nombre (una tierra: «Tierra nueva»; una mazmorra: «Lugar descubierto») y la pista abajo
    if (window.CARTEL) {
      CARTEL.llegar("zona:" + Z.id, { nombre: Z.d.nombre, tipo: Z.d.tipo === "mazmorra" ? "lugar" : "tierra" });
      setTimeout(() => HUD.aviso(t(Z.d.tipo === "mazmorra" ? "zn.entraste_mazmorra" : "zn.entraste_tierra")), 700);
    } else setTimeout(() => HUD.aviso(Z.d.nombre, "lugar", t(Z.d.tipo === "mazmorra" ? "zn.entraste_mazmorra" : "zn.entraste_tierra")), 700);
  }
  // a dónde vuelve: a su entrada del bosque o a la cueva de la tierra de la que sale
  function salir(Z) {
    if (Z.d.desde) {
      const T = zonaDe(Z.d.desde.zona),
        cueva = T && T.cosas.find((c) => c.a === Z.id);
      if (cueva) return A.teletransportar(cueva.x, cueva.y + 200);
    }
    if (Z.d.en) return A.teletransportar(Z.d.en.x, Z.d.en.y + 200);
    const p = W.LUGARES.puesto.p;
    A.teletransportar(p[0], p[1] + 200);
  }
  function encender(f) {
    st.fuegos[f.k] = true;
    if (window.SONIDO) SONIDO.tocar("fogata", { vol: 0.5, x: f.x, y: f.y });
    HUD.aviso(t("zn.encendiste"), "#FF8D71");
  }
  function abrir(cf) {
    st.cofres[cf.k] = true;
    PODERES.botinCofre(cf.x, cf.y, t("zn.cofre"), { plata: cf.rico ? 120 + Math.floor(Math.random() * 60) : 50, frag: true, vida: true });
  }
  // el jefe llama a dos más a los dos tercios y al tercio de la vida (nunca más de tres vivos)
  function actualizarJefe(Z) {
    const j = Z.jefe;
    if (!j || st.jefes[Z.id]) return;
    const e = j.e;
    if (e.muerto > 0) {
      st.jefes[Z.id] = true;
      HUD.aviso(t("zn.jefe_vencido", [e.lider.nombre]), "lugar", t("zn.jefe_vencido_sub"));
      Z.cofres.push({ x: j.cx, y: j.cy + 40, k: Z.id + "_cj", rico: true });
      j.esb.forEach((m) => m.activo && !m.muerto && (m.muerto = 0.001));
      return;
    }
    const frac = e.vida / e.d.vida,
      toca = frac < 0.34 ? 2 : frac < 0.67 ? 1 : 0;
    if (toca > j.llamo) {
      j.llamo = toca;
      let n = 0;
      for (const m of j.esb) {
        if (n >= 2 || j.esb.filter((q) => q.activo && !q.muerto).length >= 3) break;
        if (m.activo && !m.muerto) continue;
        const a = Math.random() * Math.PI * 2;
        m.casa = [e.x + Math.cos(a) * 220, e.y + Math.sin(a) * 150];
        CB.reiniciar(m);
        m.activo = true;
        m.estado = "persigue";
        n++;
      }
      if (n) HUD.aviso(t(Z.d.jefe === "dreki" ? "zn.llama_dreki" : "zn.llama"), "#E0B2B2");
    }
  }

  // ---------- dibujar ----------
  const hash = (a, b) => {
    const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const PISO = { entrada: ["#3A3430", "#36302C"], sala: ["#2E2A27", "#2A2623"], oscura: ["#262220", "#221E1C"], tesoro: ["#3A3226", "#342C22"], jefe: ["#2A2426", "#262022"] };
  function fondoMazmorra(c, Z, x0, y0, x1, y1) {
    const d = Z.d,
      cx0 = Math.max(0, Math.floor((x0 - Z.x0) / C) - 1),
      cx1 = Math.min(d.ancho - 1, Math.floor((x1 - Z.x0) / C) + 1),
      cy0 = Math.max(0, Math.floor((y0 - Z.y0) / C) - 1),
      cy1 = Math.min(d.alto - 1, Math.floor((y1 + H - Z.y0) / C) + 1);
    for (let cy = cy0; cy <= cy1; cy++)
      for (let cx = cx0; cx <= cx1; cx++) {
        const v = Z.g[cy * d.ancho + cx];
        if (!v) continue;
        const si = Z.sala[cy * d.ancho + cx],
          tipo = si >= 0 ? d.salas[si].tipo : "pasillo",
          col = PISO[tipo] || ["#24201E", "#201C1A"],
          X = Z.x0 + cx * C,
          Y = Z.y0 + cy * C;
        DIB.R(c, X, Y, C + 1, C + 1, col[0]);
        // cuatro lajas por celda, cada una con su tono y una juntura
        for (let k = 0; k < 4; k++) {
          const lx = X + (k % 2) * 100,
            ly = Y + Math.floor(k / 2) * 100,
            h0 = hash(cx * 2 + (k % 2), cy * 2 + (k >> 1));
          DIB.R(c, lx + 4, ly + 4, 92, 92, h0 < 0.5 ? col[0] : col[1]);
          if (h0 > 0.86) DIB.L(c, lx + 20, ly + 30, lx + 60 + h0 * 20, ly + 70, "#1A1614", 3);
          if (h0 < 0.06 && tipo !== "jefe") DIB.alfa(c, 0.5, () => DIB.E(c, lx + 50, ly + 60, 26, 9, "#3E4A2E"));
        }
      }
    // el círculo rúnico de la sala del jefe
    if (Z.jefe) {
      const j = Z.jefe,
        peleando = !st.jefes[Z.id] && j.e.estado !== "quieto" && !j.e.muerto;
      const col = st.jefes[Z.id] ? "#4A3A34" : peleando ? "#C8402D" : "#4A2A26";
      c.lineWidth = 6;
      c.strokeStyle = col;
      c.beginPath();
      c.ellipse(j.cx, j.cy, 520, 300, 0, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.ellipse(j.cx, j.cy, 420, 240, 0, 0, Math.PI * 2);
      c.stroke();
      const RUNAS = ["thurisaz", "hagalaz", "naudiz", "isa", "eihwaz", "perthro", "algiz", "tiwaz"];
      RUNAS.forEach((rn, k) => {
        const a = (k / RUNAS.length) * Math.PI * 2;
        FUTHARK.dibujar(c, rn, j.cx + Math.cos(a) * 470, j.cy + Math.sin(a) * 270 + 12, 26, col, 4);
      });
    }
  }
  function objetosMazmorra(lista, c0, Z, x0, y0, x1, y1) {
    const c = c0,
      d = Z.d,
      cx0 = Math.max(0, Math.floor((x0 - Z.x0) / C) - 1),
      cx1 = Math.min(d.ancho - 1, Math.floor((x1 - Z.x0) / C) + 1),
      cy0 = Math.max(0, Math.floor((y0 - Z.y0) / C) - 1),
      cy1 = Math.min(d.alto - 1, Math.floor((y1 + H + 200 - Z.y0) / C) + 1);
    const g = (x, y) => (x < 0 || y < 0 || x >= d.ancho || y >= d.alto ? 0 : Z.g[y * d.ancho + x]);
    for (let cy = cy0; cy <= cy1; cy++)
      for (let cx = cx0; cx <= cx1; cx++) {
        if (g(cx, cy)) continue;
        let vecino = false;
        for (let dy = -1; dy <= 1 && !vecino; dy++) for (let dx = -1; dx <= 1; dx++) if (g(cx + dx, cy + dy)) vecino = true;
        if (!vecino) continue;
        const X = Z.x0 + cx * C,
          Y = Z.y0 + cy * C,
          cara = g(cx, cy + 1) > 0;
        lista.push({
          x: X + C / 2,
          pie: Y + C,
          y: Y + C,
          tapa: { x0: X, y0: Y - H, x1: X + C, y1: Y + C }, // Eromash se ve en silueta detrás de la pared
          f: (c2) => {
            const c = c2 || c0,
              h0 = hash(cx, cy);
            DIB.R(c, X - 1, Y - H, C + 2, C + 1, h0 < 0.5 ? "#161211" : "#141010");
            // el canto de arriba de la pared que tapa la sala (se lee dónde termina)
            if (g(cx, cy - 1) > 0) DIB.R(c, X - 1, Y - H, C + 2, 7, "#2A2420");
            if (!cara) return;
            // la cara de la pared que mira a la sala: hiladas de piedra
            DIB.R(c, X - 1, Y + C - H, C + 2, H, "#3A3430");
            for (let f = 0; f < 3; f++) {
              const yy = Y + C - H + f * 50;
              DIB.R(c, X - 1, yy, C + 2, 3, "#24201D");
              for (let k = 0; k < 3; k++) {
                const xx = X + ((k + (f % 2) * 0.5) * C) / 3;
                DIB.R(c, xx, yy, 3, 50, "#24201D");
                if (hash(cx * 3 + k, cy * 5 + f) > 0.7) DIB.R(c, xx + 6, yy + 6, C / 3 - 12, 40, "#433C37");
              }
            }
            DIB.R(c, X - 1, Y + C - 8, C + 2, 8, "#1E1A18");
            // la antorcha, si esta celda la tiene
            const si = Z.sala[(cy + 1) * d.ancho + cx];
            if (si >= 0 && d.salas[si].antorchas && d.salas[si].antorchas.includes(cx)) ASSETS.dibujar(c, "antorchaPared", X + C / 2, Y + C - 30, J.t, { encendida: true, s: 1.1 });
          },
        });
      }
    if (Z.escalera) lista.push({ x: Z.escalera.x, pie: Z.escalera.y + 40, y: Z.escalera.y, f: () => ASSETS.dibujar(c, "escaleraMazmorra", Z.escalera.x, Z.escalera.y + 40, J.t, { s: 1 }) });
  }
  function fondoTierra(c, Z, x0, y0, x1, y1) {
    // el mar, con olas que van y vienen
    DIB.R(c, x0, y0, x1 - x0, y1 - y0, "#16303A");
    const ra = DIB.azar(77);
    for (let k = 0; k < 40; k++) {
      const wx = x0 + ra() * (x1 - x0),
        wy = y0 + ra() * (y1 - y0),
        u = Math.sin(J.t * 0.8 + k) * 20;
      DIB.alfa(c, 0.35, () => DIB.L(c, wx + u, wy, wx + 90 + u, wy, "#2E5664", 4));
    }
    // los bancos de arena, debajo de las costas
    c.lineCap = "round";
    Z.pasos.forEach((q) => {
      if (Math.max(q.ax, q.bx) < x0 - 400 || Math.min(q.ax, q.bx) > x1 + 400 || Math.max(q.ay, q.by) < y0 - 400 || Math.min(q.ay, q.by) > y1 + 400) return;
      DIB.L(c, q.ax, q.ay, q.bx, q.by, "#2A5A66", q.w + 140);
    });
    Z.masas.forEach((m) => {
      if (m.c[0] + m.r * 1.6 < x0 || m.c[0] - m.r * 1.6 > x1 || m.c[1] + m.r * 1.2 < y0 || m.c[1] - m.r * 1.2 > y1) return;
      const camino = () => {
        // la costa redondeada: curvas por los puntos medios de cada lado
        const n = m.pts.length,
          mid = (i) => [(m.pts[i % n][0] + m.pts[(i + 1) % n][0]) / 2, (m.pts[i % n][1] + m.pts[(i + 1) % n][1]) / 2];
        c.beginPath();
        c.moveTo(...mid(0));
        for (let i = 1; i <= n; i++) c.quadraticCurveTo(m.pts[i % n][0], m.pts[i % n][1], ...mid(i));
        c.closePath();
      };
      c.lineJoin = "round";
      // el agua baja, la arena y el pasto (o la ceniza en la isla del volcán)
      camino();
      c.strokeStyle = "#2A5A66";
      c.lineWidth = 260;
      c.stroke();
      camino();
      c.strokeStyle = m.ceniza ? "#4A4442" : "#B8A47A";
      c.lineWidth = 120;
      c.stroke();
      camino();
      c.fillStyle = m.ceniza ? "#3A3432" : "#3E5A2E";
      c.fill();
      // manchas de pasto más claro y oscuro
      const rm = DIB.azar(Math.round(m.c[0] + m.c[1]));
      for (let k = 0; k < 18; k++) {
        const px = m.c[0] + (rm() * 2 - 1) * m.r,
          py = m.c[1] + (rm() * 2 - 1) * m.r * 0.6;
        if (enPoli(m.pts, px, py)) DIB.alfa(c, 0.5, () => DIB.E(c, px, py, 140 + rm() * 160, 50 + rm() * 50, m.ceniza ? (k % 2 ? "#2E2826" : "#4A3A30") : k % 2 ? "#4E6B3A" : "#34502A"));
      }
    });
    // la arena del banco va encima de las costas, así se ve que se puede cruzar
    Z.pasos.forEach((q) => {
      if (Math.max(q.ax, q.bx) < x0 - 400 || Math.min(q.ax, q.bx) > x1 + 400 || Math.max(q.ay, q.by) < y0 - 400 || Math.min(q.ay, q.by) > y1 + 400) return;
      DIB.L(c, q.ax, q.ay, q.bx, q.by, "#B8A47A", q.w);
      DIB.alfa(c, 0.5, () => DIB.L(c, q.ax, q.ay, q.bx, q.by, "#CDBB90", q.w * 0.35));
    });
    c.lineCap = "butt";
  }
  // lo alto de la zona va a la lista como una cosa del mundo (no como función): así el motor lo vuelve transparente en
  // el claro de Eromash y dibuja su silueta cuando lo tapa (pilares, árboles, tótems). Se arma una vez y se guarda.
  function comoCosa(q, o) {
    if (!q._cosa) {
      const m = ASSETS.medidas(q.id, o);
      q._cosa = { id: q.id, x: q.x, y: q.y, o, alto: m.alto, choque: { r: q.r || 30 } };
    }
    return { x: q.x, y: q.y, cosa: q._cosa };
  }
  function objetosTierra(lista, c, Z, visible) {
    Z.arboles.forEach((a) => visible(a.x, a.y) && lista.push(comoCosa(a, { s: a.s, sem: a.sem })));
    if (Z.barca && visible(Z.barca.x, Z.barca.y)) lista.push({ x: Z.barca.x, y: Z.barca.y, f: () => ASSETS.dibujar(c, "barcaVikinga", Z.barca.x, Z.barca.y, J.t, { s: 1 }) });
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      CB = A.CB;
      const todas = Object.assign(base(), (window.AGREGADOS && AGREGADOS.zonas) || {});
      let k = 0;
      Object.keys(todas).forEach((id) => {
        const d = todas[id];
        if (!d || (d.tipo !== "mazmorra" && d.tipo !== "tierra")) return;
        const Z = armarZona(id, d, k++);
        // la entrada en el bosque
        if (d.en) Z.entrada = W.agregar(d.tipo === "mazmorra" ? "bocaMazmorra" : "barcaVikinga", [d.en.x, d.en.y], { s: 1, luz: false, zona: id });
      });
    },
    alEmpezar(extra) {
      extra.zonas = Object.assign({ cofres: {}, jefes: {}, fuegos: {} }, extra.zonas || {});
      st = extra.zonas;
      armadas.forEach((Z) => {
        Z.enemigos.forEach((e) => {
          CB.reiniciar(e);
          if (e.esbirroZona) (e.activo = false), (e.muerto = 1);
        });
        if (Z.jefe && st.jefes[Z.id]) (Z.jefe.e.muerto = 1), Z.cofres.some((cf) => cf.k === Z.id + "_cj") || Z.cofres.push({ x: Z.jefe.cx, y: Z.jefe.cy + 40, k: Z.id + "_cj", rico: true });
        rotularJefe(Z);
        if (Z.entrada) Z.entrada.o.luz = !!(Z.jefe && !st.jefes[Z.id]);
      });
      // ?zona=<id>: arranca adentro (botón Probar de la sección Zonas del editor)
      const qz = (location.search.match(/[?&]zona=([\w-]+)/) || [])[1];
      if (qz && zonaDe(qz) && !sistema.probada) (sistema.probada = true), setTimeout(() => entrar(zonaDe(qz)), 400);
    },
    actualizar() {
      aqui = dentroDe(jug.x, jug.y);
      if (!aqui) return;
      if (aqui.d.tipo === "mazmorra") {
        J.oscuro = 2.4;
        J.ambZona = { tono: [16, 9, 7], osc: 0.84, niebla: 0, o: 0 };
      } else J.ambZona = { sombra: 0 };
      actualizarJefe(aqui);
      // el jefe enciende sus braseros cuando empieza la pelea
      const j = aqui.jefe;
      if (j && !st.jefes[aqui.id] && j.e.estado !== "quieto") aqui.fuegos.forEach((f) => aqui.d.salas[f.sala] === j.sala && (st.fuegos[f.k] = true));
    },
    cercanos(dar) {
      // las entradas del bosque
      for (const Z of armadas) {
        if (!Z.d.en) continue;
        const d = Math.hypot(Z.d.en.x - jug.x, Z.d.en.y + 80 - jug.y);
        if (d < 220) dar(d, t(Z.d.tipo === "mazmorra" ? "zn.accion_entrar" : "zn.accion_zarpar", [Z.d.nombre]), () => entrar(Z), Z.d.en.x, Z.d.en.y - 120);
      }
      const Z = aqui;
      if (!Z) return;
      const cerca = (x, y, r) => Math.hypot(x - jug.x, y - jug.y) < r;
      if (Z.escalera && cerca(Z.escalera.x, Z.escalera.y + 80, 200)) dar(20, t("zn.accion_salir"), () => salir(Z), Z.escalera.x, Z.escalera.y - 120);
      if (Z.barca && cerca(Z.barca.x, Z.barca.y - 60, 260)) dar(20, t("zn.accion_volver_barca"), () => salir(Z), Z.barca.x, Z.barca.y - 120);
      for (const f of Z.fuegos) if (!st.fuegos[f.k] && cerca(f.x, f.y, 140)) dar(30, t("zn.accion_encender"), () => encender(f), f.x, f.y - 110);
      for (const cf of Z.cofres) if (!st.cofres[cf.k] && cerca(cf.x, cf.y, 130)) dar(25, t("zn.accion_cofre"), () => abrir(cf), cf.x, cf.y - 80);
      if (Z.cosas)
        for (const c0 of Z.cosas) {
          if (c0.tipo !== "cueva" || !cerca(c0.x, c0.y + 60, 220)) continue;
          const M0 = c0.a && zonaDe(c0.a);
          if (M0) dar(20, t("zn.accion_entrar", [M0.d.nombre]), () => entrar(M0), c0.x, c0.y - 200);
          else dar(40, t("zn.accion_cueva"), () => A.dialogoLibre([["eromash", "zn.cueva_vacia"]]), c0.x, c0.y - 200);
        }
    },
    fondo(c, x0, y0, x1, y1) {
      for (const Z of armadas) {
        if (x1 < Z.x0 - 1200 || x0 > Z.x1 + 1200 || y1 < Z.y0 - 1200 || y0 > Z.y1 + 1200) continue;
        if (Z.d.tipo === "mazmorra") {
          DIB.R(c, x0, y0, x1 - x0, y1 - y0, "#070505");
          fondoMazmorra(c, Z, x0, y0, x1, y1);
        } else fondoTierra(c, Z, x0, y0, x1, y1);
      }
    },
    objetos(lista, visible, c) {
      const Z = aqui;
      if (!Z) return;
      const v = J.cam,
        x0 = v.x - 1800,
        x1 = v.x + 1800,
        y0 = v.y - 1200,
        y1 = v.y + 1200;
      if (Z.d.tipo === "mazmorra") objetosMazmorra(lista, c, Z, x0, y0, x1, y1);
      else objetosTierra(lista, c, Z, visible);
      Z.obst.forEach((o) => visible(o.x, o.y) && lista.push(comoCosa(o, { s: o.s || 1, runa: o.runa, tipo: o.tipo, luz: o.cosa && !!o.cosa.a })));
      Z.fuegos.forEach((f) => visible(f.x, f.y) && lista.push({ x: f.x, y: f.y, f: () => ASSETS.dibujar(c, "brasero", f.x, f.y, J.t, { s: 1.2, encendido: !!st.fuegos[f.k] }) }));
      Z.cofres.forEach((cf) => visible(cf.x, cf.y) && lista.push({ x: cf.x, y: cf.y, f: () => ASSETS.dibujar(c, "cofreRunico", cf.x, cf.y, J.t, { s: 1.3, abierto: !!st.cofres[cf.k] }) }));
      if (Z.cosas) Z.cosas.forEach((c0) => c0.tipo === "muelle" && visible(c0.x, c0.y) && lista.push({ x: c0.x, pie: c0.y + 70, y: c0.y + 70, f: () => ASSETS.dibujar(c, "muelle", c0.x, c0.y + 70, J.t, { s: 0.8 }) }));
    },
    luces(dar) {
      const Z = aqui;
      if (!Z) return;
      if (Z.d.tipo === "mazmorra") {
        // la lámpara alcanza un poco más bajo tierra
        dar({ x: jug.x, y: jug.y - 30, r: 360, col: "#FFD98A", f: 0.55 });
        Z.d.salas.forEach((s) => (s.antorchas || []).forEach((cx) => dar({ x: Z.x0 + cx * C + C / 2, y: Z.y0 + s.y * C - 60, r: 520, col: "#FF8D71", f: 0.85 + Math.sin(J.t * 9 + cx) * 0.06 })));
        if (Z.escalera) dar({ x: Z.escalera.x, y: Z.escalera.y - 60, r: 420, col: "#FFD98A", f: 0.7 });
      } else Z.obst.forEach((o) => o.id === "volcan" && dar({ x: o.x, y: o.y - 600 * (o.s || 1), r: 1400, col: "#FF8D71", f: 0.7 }));
      Z.fuegos.forEach((f) => st.fuegos[f.k] && dar({ x: f.x, y: f.y - 60, r: 560, col: "#FF8D71", f: 0.9 + Math.sin(J.t * 8 + f.x) * 0.06 }));
      Z.cofres.forEach((cf) => !st.cofres[cf.k] && dar({ x: cf.x, y: cf.y - 30, r: 220, col: "#73D5DB", f: 0.7 }));
      // el jefe se ve en lo oscuro: el dreki por la brasa de su boca, el campeón por su aura
      const j = Z.jefe;
      if (j && !j.e.muerto) dar({ x: j.e.x, y: j.e.y - 120 * (j.e.s || 1), r: Z.d.jefe === "dreki" ? 520 : 320, col: Z.d.jefe === "dreki" ? "#FF8D71" : "#FFD98A", f: 0.6 });
    },
    hud() {
      const Z = aqui,
        j = Z && Z.jefe;
      if (j && !st.jefes[Z.id] && j.e.estado !== "quieto" && !j.e.muerto) J.jefeHud = { nombre: j.e.lider.nombre, frac: Math.max(0, j.e.vida / j.e.d.vida), ataduras: 0, ataque: "", accion: "" };
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  // las entradas del bosque, para el mapa: hecha = el jefe ya cayó (o no tiene jefe y no quedan cofres)
  function entradas() {
    return armadas
      .filter((Z) => Z.d.en)
      .map((Z) => ({ id: Z.id, tipo: Z.d.tipo, x: Z.d.en.x, y: Z.d.en.y, nombre: Z.d.nombre, hecha: Z.jefe ? !!st.jefes[Z.id] : Z.cofres.length > 0 && Z.cofres.every((cf) => st.cofres[cf.k]) }));
  }
  return {
    generarMazmorra,
    generarTierra,
    leerPedido,
    armarPedido,
    FAMILIAS,
    COSAS,
    enPoli,
    entradas,
    pasosDe,
    // las que vienen con el juego (el editor las muestra y deja retocarlas guardando una copia con el mismo id)
    bases: (w) => ((W = W || w), base()),
    aqui: () => aqui,
    zonas: () => armadas,
    entrar: (id) => zonaDe(id) && entrar(zonaDe(id)),
    ir: (x, y) => A.teletransportar(x, y),
  };
})();
