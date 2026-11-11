// ---------- el modo Navidad (sistema NAVIDAD): Eromash con gorro y Eldervald, el Hongo Dorado y Eikholt de Yule ----------
// Pedido de Alejandro (11/11/2026, la ola de videos de Navidad): «en todos los videos navideños Eromash está vestido
// de Navidad y todo el entorno muy decorado, con guirnaldas, bolas, decoración navideña». No cambia el juego de
// siempre: se prende solo con ?navidad=1 (se suma al modo cámara: ?video=1&navidad=1&…) y ?nieve=0 saca la nieve.
// Qué hace prendido:
//   · Eromash lleva el gorro de Yule (ASSETS.NAVIDAD.gorro; lo pide dibujarJugador en juego.js con NAVIDAD.gorro).
//   · Los árboles del bosque llevan bolas, lucecitas y estrella (envuelve ASSETS.dibujar: lo que no es árbol no cambia),
//     los faroles un moño, y de noche las lucecitas brillan encima de la oscuridad (hook sobreLuz).
//   · Cada lugar del bosque tiene su abeto de Yule con regalos, bolas de Jera, tronco y cabra de paja, y los caminos
//     llevan guirnaldas de lado a lado cada tanto (se ponen al iniciar, con semilla fija).
//   · Nieve que cae (motas cuadradas, hook aire; en Eikholt con NAVIDAD.nieveCiudad).
//   · El Hongo Dorado: guirnaldas en la galería y la baranda, en la barra, coronas en las paredes, el abeto con sus
//     regalos, la cabra junto al fuego y un tronco de Yule con velas en cada mesa (NAVIDAD.hongo, lo llama hongo.js).
//   · Eikholt: guirnaldas de farol a farol, el gran abeto junto al Ting, cabras, bolas y regalos en la plaza y el
//     Roble lleno de bolas (envuelve PLANO25.armar; las luces salen de ciudad/luces.js por el id del asset).
// Todo lo caro baja con CALIDAD.nivel (menos árboles adornados, menos nieve, sin halos en baja).
window.NAVIDAD = (function () {
  "use strict";
  const q = new URLSearchParams(location.search);
  const activo = q.get("navidad") === "1";
  const conNieve = activo && q.get("nieve") !== "0";
  const calidad = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  const N = () => ASSETS.NAVIDAD;
  const h2 = (x, y, k = 0) => {
    const v = Math.sin(x * 12.9898 + y * 78.233 + k * 37.719) * 43758.5453;
    return v - Math.floor(v);
  };
  let A = null,
    J = null,
    W = null;

  // ---------- los árboles adornados ----------
  // Se envuelve ASSETS.dibujar una sola vez: después de dibujar un árbol (o un farol) se le cuelgan sus adornos con
  // el mismo tamaño, giro y espejado que puso el editor.
  if (activo && window.ASSETS) {
    const d0 = ASSETS.dibujar;
    ASSETS.dibujar = function (c, id, x, y, t, o = {}) {
      d0(c, id, x, y, t, o);
      if (!ASSETS.NAVIDAD || !ASSETS.NAVIDAD.ADORNA[id] || o.sinAdornos) return;
      const k = o.esc || 1,
        ex = (o.ex || 1) * k * (o.esp ? -1 : 1),
        ey = (o.ey || 1) * k;
      if (ex === 1 && ey === 1 && !o.rot) return ASSETS.NAVIDAD.adornar(c, id, x, y, t, o);
      c.save();
      c.translate(x, y);
      if (o.rot) c.rotate((o.rot * Math.PI) / 180);
      c.scale(ex, ey);
      c.translate(-x, -y);
      ASSETS.NAVIDAD.adornar(c, id, x, y, t, o);
      c.restore();
    };
  }

  // ---------- el gorro de Eromash ----------
  // (x, y, w, h): la caja donde va la imagen de su cabeza (VIKINGO, caja 40 90 400 480)
  function gorro(c, vista, x, y, w, h) {
    if (!activo || !ASSETS.NAVIDAD) return;
    c.save();
    c.translate(x, y);
    c.scale(w / 400, h / 480);
    c.translate(-40, -90);
    ASSETS.NAVIDAD.gorro(c, vista);
    c.restore();
  }

  // ---------- el bosque de Yule ----------
  const PUESTAS = [];
  const enCamino = (x, y, m) => W.CAMINOS.some((cm) => W.distLinea(x, y, cm.p) < cm.w / 2 + m);
  const sirve = (x, y, r) => W.sueloEn(x, y) === 0 && W.libre(x, y, r) && !enCamino(x, y, r * 0.6);
  function poner(id, p, o) {
    const c = W.agregar(id, p, o);
    PUESTAS.push(c);
    return c;
  }
  // el primer lugar libre en una vuelta que se abre desde p
  function buscar(p, r0, r, hasta = 1200) {
    for (let d = r0; d < r0 + hasta; d += 70)
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2 + d * 0.01,
          x = p[0] + Math.cos(a) * d,
          y = p[1] + Math.sin(a) * d * 0.85;
        if (sirve(x, y, r)) return [x, y];
      }
    return null;
  }
  function decorarBosque() {
    if (W.LIENZO) return;
    const L = W.LUGARES,
      fuera = { eikholt: 1, entrada_sur: 1, quebrada_rastreo: 1, paso: 1 };
    let i = 0;
    // cada lugar: su abeto de Yule y lo de alrededor (lo que no entra se saltea)
    for (const k in L) {
      if (fuera[k]) continue;
      const c0 = L[k].p,
        p = buscar(c0, Math.max(150, L[k].r * 0.3), 70);
      if (!p) continue;
      poner("abetoYule", p, { s: 1, sem: i });
      const cerca = (dx, dy, id, o, r = 30) => {
        const x = p[0] + dx,
          y = p[1] + dy;
        if (sirve(x, y, r)) poner(id, [x, y], o);
      };
      cerca(64, 34, "regalosYule", { sem: i, giro: (i * 37) % 90 });
      cerca(-58, 40, "regalosYule", { sem: i + 1, giro: -20 });
      cerca(-110, -10, "bolaYule", { col: i % 4 });
      cerca(118, -20, "bolaYule", { col: (i + 2) % 4, s: 0.8 });
      if (i % 2 === 0) cerca(-170, 90, "cabraYule", { giro: i % 4 ? 180 : 0 }, 36);
      else cerca(160, 100, "troncoYule", { giro: (i * 53) % 180 }, 40);
      i++;
    }
    // guirnaldas de lado a lado de los caminos, cada tanto (la punta de más abajo va primero: se dibuja encima)
    let n = 0;
    const lejosDe = (x, y) => {
      const e = L.eikholt;
      return !e || Math.hypot(x - e.p[0], (y - e.p[1]) * 1.15) > e.r * 1.1;
    };
    W.CAMINOS.forEach((cm, ic) => {
      const pts = cm.p,
        paso = 1300;
      let falta = 500 + (ic % 5) * 140;
      for (let j = 0; j < pts.length - 1; j++) {
        const [ax, ay] = pts[j],
          [bx, by] = pts[j + 1],
          lg = Math.hypot(bx - ax, by - ay);
        if (!lg) continue;
        let d = falta;
        while (d < lg) {
          const ux = (bx - ax) / lg,
            uy = (by - ay) / lg,
            cx = ax + ux * d,
            cy = ay + uy * d,
            m = cm.w / 2 + 34,
            P1 = [cx - uy * m, cy + ux * m],
            P2 = [cx + uy * m, cy - ux * m];
          const ok = (p) => W.sueloEn(p[0], p[1]) === 0 && W.libre(p[0], p[1], 10) && lejosDe(p[0], p[1]);
          if (ok(P1) && ok(P2)) {
            const [a, b] = P1[1] >= P2[1] ? [P1, P2] : [P2, P1];
            poner("guirnaldaYule", a, { x2: b[0], y2: b[1], sem: n++, s: 1 });
          }
          d += paso;
        }
        falta = d - lg;
      }
    });
  }

  // ---------- la nieve ----------
  // Motas cuadradas que caen despacio y se mecen (el lenguaje de las motas de siempre). Ancladas al mundo: cada celda
  // tiene las suyas, que caen a lo largo de tres celdas y se desvanecen en las puntas. (x0, y0)–(x1, y1): lo que se ve.
  function nieve(c, x0, y0, x1, y1, t, k = 1) {
    const CEL = 150 * k,
      cuantas = { alta: 3, media: 2, baja: 1 }[calidad()] || 2,
      tam = 4.4 * k;
    c.fillStyle = "#F2ECEC";
    const a0 = c.globalAlpha;
    for (let gy = Math.floor(y0 / CEL) - 2; gy <= Math.floor(y1 / CEL) + 1; gy++)
      for (let gx = Math.floor(x0 / CEL) - 1; gx <= Math.floor(x1 / CEL) + 1; gx++)
        for (let j = 0; j < cuantas; j++) {
          const hx = h2(gx, gy, j),
            hy = h2(gx, gy, j + 7),
            hv = h2(gx, gy, j + 13),
            vel = (34 + hv * 46) * k,
            cae = (hy * CEL * 3 + t * vel) % (CEL * 3),
            x = gx * CEL + hx * CEL + Math.sin(t * (0.6 + hv) + hx * 9) * 16 * k,
            y = gy * CEL + cae,
            a = Math.sin((Math.PI * cae) / (CEL * 3));
          if (x < x0 - 20 || x > x1 + 20 || y < y0 - 20 || y > y1 + 20) continue;
          const z = tam * (0.6 + hv * 0.9);
          c.globalAlpha = a0 * Math.min(1, a * 1.4) * (0.6 + hv * 0.4);
          c.fillRect(x - z / 2, y - z / 2, z, z);
        }
    c.globalAlpha = a0;
  }

  // ---------- las lucecitas de noche ----------
  // Encima de la oscuridad: cada lucecita de los árboles cercanos, con su halo chico.
  const BRILLAN = { abetoYule: 1, pinoYule: 1 };
  function brillos(c, x0, y0, x1, y1) {
    const amb = A.amb();
    if (!amb || amb.n < 0.2 || calidad() === "baja") return;
    const f = Math.min(1, (amb.n - 0.2) * 2.5),
      alta = calidad() === "alta",
      tope = alta ? 700 : 260;
    let n = 0;
    c.save();
    J.baseT();
    W.cercanas(x0 - 200, y0 - 100, x1 + 200, y1 + 700, (o) => {
      if (o.oculto || n > tope || !(BRILLAN[o.id] || N().ADORNA[o.id])) return;
      const id = o.id === "pinoYule" ? "pino" : o.id,
        op = o.id === "pinoYule" ? Object.assign({ todo: true }, o.o) : o.o,
        l = N().luces(id, o.x, o.y, J.t, op);
      if (!l.length) return;
      const v = J.vista ? J.vista(o.x, o.y) : [o.x, o.y],
        dx = v[0] - o.x,
        dy = v[1] - o.y,
        g = (op.s || 1) * (id === "abetoAnciano" || id === "robleAnciano" ? 2 : id === "abetoYule" ? 1.3 : 1);
      l.forEach(([x, y], i) => {
        const col = N().BOMBILLAS[(i + (Math.round(o.x) & 7)) % N().BOMBILLAS.length],
          late = 0.55 + 0.45 * Math.sin(J.t * 3 + i * 1.7 + o.x);
        if (alta) DIB.halo(c, x + dx, y + dy, 7 * g, col, f * late * 0.7);
        DIB.alfa(c, f * late, () => N().bombilla(c, x + dx, y + dy, 2.8 * g, i, 0));
        n++;
      });
    });
    c.restore();
  }

  // ---------- el Hongo Dorado ----------
  // lo pide hongo.js en su sala: d = { c, pon, PR, s, t, lista, arriba, paredVista, ZG, GN, GO, HX, HY, tramosN, tramosO, BARRA, MESAS }
  const ARBOL_H = { x: 1440, y: -250 };
  const COSAS_H = [
    { id: "abetoYule", x: ARBOL_H.x, y: ARBOL_H.y, o: { s: 2.6, sem: 7 }, r: 100 },
    { id: "regalosYule", x: 1290, y: -130, o: { s: 2.4, sem: 1, giro: 25 }, r: 70 },
    { id: "regalosYule", x: 1580, y: -110, o: { s: 2.2, sem: 2, giro: -15 }, r: 60 },
    { id: "bolaYule", x: 1590, y: -420, o: { s: 2.3, col: 2 }, r: 60 },
    { id: "bolaYule", x: 1330, y: -400, o: { s: 1.8, col: 0 }, r: 50 },
    { id: "cabraYule", x: 300, y: 520, o: { s: 2.6, giro: 180 }, r: 70 },
    { id: "bolaYule", x: -560, y: 980, o: { s: 2, col: 3 }, r: 55 },
    { id: "regalosYule", x: -380, y: 1000, o: { s: 2.2, sem: 3, giro: 10 }, r: 60 },
  ];
  const choquesHongo = activo ? COSAS_H.map((k) => ({ x: k.x, y: k.y, r: k.r })) : [];
  function hongo(d) {
    if (!activo) return;
    const { c, pon, PR, s, t } = d,
      G = N(),
      a = 22 * s;
    COSAS_H.forEach((k) => pon(k.x, k.y, (sx, sy) => ASSETS.dibujar(c, k.id, sx, sy, t, Object.assign({}, k.o, { s: s * k.o.s }))));
    // un tronco de Yule con velas en el medio de cada mesa larga
    d.MESAS.forEach((m, i) => pon(m.x, m.y, () => {
      const [sx, sy] = PR(m.x, m.y, 114);
      ASSETS.dibujar(c, "troncoYule", sx, sy, t, { s: s * 1.5, giro: i % 2 ? 4 : -4 });
    }, 6));
    // guirnaldas colgadas: de (ax, ay, az) a (bx, by, bz), con su caída en el medio
    const colgar = (ax, ay, az, bx, by, bz, caida, sem) => {
      const p0 = PR(ax, ay, az),
        p1 = PR(bx, by, bz);
      G.guirnalda(c, (u) => PR(ax + (bx - ax) * u, ay + (by - ay) * u, az + (bz - az) * u - caida * 4 * u * (1 - u)), Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), a, t, sem, { bolasCada: 4 });
    };
    // debajo de la galería y sobre la baranda, tramo por tramo
    if (d.paredVista.n() || d.arriba) {
      const xs = d.tramosN();
      for (let i = 0; i < xs.length - 1; i++) {
        const x0 = xs[i],
          x1 = xs[i + 1],
          k = PR.hondo((x0 + x1) / 2, d.GN);
        d.lista.push({ k: k + 2, f: () => colgar(x0 + 30, d.GN + 12, d.ZG - 74, x1 - 30, d.GN + 12, d.ZG - 74, 110, i) });
        d.lista.push({ k: k + 4, f: () => colgar(x0 + 20, d.GN + 4, d.ZG + 116, x1 - 20, d.GN + 4, d.ZG + 116, 46, i + 3) });
      }
    }
    if (d.paredVista.o() || d.arriba) {
      const ys = d.tramosO();
      for (let i = 0; i < ys.length - 1; i++) {
        const y0 = ys[i],
          y1 = ys[i + 1],
          k = PR.hondo(d.GO, (y0 + y1) / 2);
        d.lista.push({ k: k + 2, f: () => colgar(d.GO + 12, y0 + 30, d.ZG - 74, d.GO + 12, y1 - 30, d.ZG - 74, 110, i + 5) });
        d.lista.push({ k: k + 4, f: () => colgar(d.GO + 4, y0 + 20, d.ZG + 116, d.GO + 4, y1 - 20, d.ZG + 116, 46, i + 8) });
      }
    }
    // el frente de la barra de Ulf: tres caídas
    const B = d.BARRA,
      yb = B.y + 74;
    d.lista.push({ k: PR.hondo(B.x, yb) + 3, f: () => {
      for (let i = 0; i < 3; i++) {
        const xa = B.x - B.largo + (i * 2 * B.largo) / 3,
          xb = B.x - B.largo + ((i + 1) * 2 * B.largo) / 3;
        colgar(xa, yb, 118, xb, yb, 118, 40, i + 11);
      }
    } });
    // las coronas en las paredes de atrás (por encima de la galería)
    const corona = (x, y, z, giro) => {
      const [sx, sy] = PR(x, y, z);
      ASSETS.dibujar(c, "coronaYule", sx, sy, t, { s: s * 2.6, giro });
    };
    if (d.paredVista.n()) d.lista.push({ k: -1e8, f: () => [-1100, -200, 500].forEach((x) => corona(x, -d.HY + 6, 600, 0)) });
    if (d.paredVista.o()) d.lista.push({ k: -1e8, f: () => [-500, 600].forEach((y) => corona(-d.HX + 6, y, 600, -90)) });
  }
  // las luces de lo que puso: pon(x, y, z, r, col "r,g,b", f)
  function lucesHongo(pon, t) {
    if (!activo) return;
    pon(ARBOL_H.x, ARBOL_H.y, 360, 900, "255,217,138", 0.8 + Math.sin(t * 2) * 0.08);
    pon(ARBOL_H.x, ARBOL_H.y, 120, 520, "255,141,113", 0.45);
  }

  // ---------- Eikholt ----------
  // Se envuelve PLANO25.armar (después de lo del editor): lo que se pone son assets del plano, con su choque.
  function libreCiudad(p, x, y, r) {
    for (const ch of p.choques) {
      if (ch.circulo) {
        if (Math.hypot(x - ch.circulo[0], y - ch.circulo[1]) < ch.circulo[2] + r) return false;
      } else if (ch.poli) {
        // adentro del polígono, o a menos de r de un borde
        const pl = ch.poli;
        let dentro = false;
        for (let i = 0, j = pl.length - 1; i < pl.length; j = i++) {
          const [xi, yi] = pl[i],
            [xj, yj] = pl[j];
          if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
          if (W0.distSeg(x, y, xi, yi, xj, yj) < r) return false;
        }
        if (dentro) return false;
      }
    }
    if (p.aCalle && p.aCalle(x, y) < r * 0.5) return false;
    return true;
  }
  const W0 = {
    distSeg(px, py, ax, ay, bx, by) {
      const dx = bx - ax,
        dy = by - ay,
        l = dx * dx + dy * dy || 1,
        u = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l));
      return Math.hypot(px - ax - dx * u, py - ay - dy * u);
    },
  };
  function decorarCiudad(p) {
    const puestos = [];
    const poner = (id, x, y, o, r) => {
      if (r && !libreCiudad(p, x, y, r)) return false;
      p.cosas.push({ tipo: "asset", id, x, y, o });
      if (r) p.choques.push({ circulo: [x, y, r * 0.8] });
      puestos.push([x, y]);
      return true;
    };
    const cerca = (cx, cy, r0, r, id, o, hasta = 2400) => {
      for (let d = r0; d < r0 + hasta; d += 90)
        for (let k = 0; k < 16; k++) {
          const a = (k / 16) * Math.PI * 2 + d * 0.003,
            x = cx + Math.cos(a) * d,
            y = cy + Math.sin(a) * d;
          if (poner(id, x, y, o, r)) return [x, y];
        }
      return null;
    };
    // el gran abeto de Yule de la ciudad, junto al Ting, con regalos, cabras y bolas alrededor
    const ting = p.ting || [0, 1620];
    const arbol = cerca(ting[0], ting[1] + 300, 900, 170, "abetoYule", { s: 2.6, sem: 1 });
    if (arbol) {
      [[160, 90, 2.2, 0], [-170, 80, 2, 1], [40, 190, 1.9, 2], [-60, -180, 1.8, 3]].forEach(([dx, dy, s, i]) => poner("regalosYule", arbol[0] + dx, arbol[1] + dy, { s, sem: i, giro: i * 23 }, 50));
      [[280, -40, 0], [-300, -20, 2], [120, 300, 3], [-200, 260, 1]].forEach(([dx, dy, col]) => poner("bolaYule", arbol[0] + dx, arbol[1] + dy, { s: 2.2, col }, 60));
      poner("cabraYule", arbol[0] + 420, arbol[1] + 200, { s: 3, rumbo: Math.PI }, 80);
      poner("cabraYule", arbol[0] - 440, arbol[1] + 180, { s: 2.6, rumbo: 0 }, 70);
    }
    // en las puertas de la ciudad: una cabra de paja y un abeto chico a cada lado del camino
    ["puerta_sur", "puerta_norte", "puerta_este", "puerta_oeste"].forEach((k, i) => {
      const a = p.anclas && p.anclas[k];
      if (!a) return;
      cerca(a[0] * 0.92, a[1] * 0.92, 300, 80, "abetoYule", { s: 1.4, sem: 10 + i }, 900);
      cerca(a[0] * 0.9, a[1] * 0.9, 380, 60, "cabraYule", { s: 2.2, rumbo: i % 2 ? Math.PI : 0 }, 900);
    });
    // bolas de Jera y regalos en la plaza del mercado
    const plaza = p.plaza || 3000;
    for (let i = 0; i < 10; i++) {
      const a = i * 0.63 + 0.3,
        d = plaza * (0.55 + (i % 3) * 0.12);
      cerca(Math.cos(a) * d, Math.sin(a) * d * 0.9, 0, 50, i % 3 ? "bolaYule" : "regalosYule", { s: 2, col: i % 4, sem: i, giro: i * 31 }, 600);
    }
    // guirnaldas de farol a farol (cada farol con el que tiene más cerca, sin repetir pares)
    const faroles = p.cosas.filter((o) => o.id === "farol");
    const pares = new Set();
    faroles.forEach((a, i) => {
      let mejor = -1,
        dm = 1700;
      faroles.forEach((b, j) => {
        if (i === j || pares.has(Math.min(i, j) + "," + Math.max(i, j))) return;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > 200 && d < dm && libreCiudad(p, (a.x + b.x) / 2, (a.y + b.y) / 2, 20)) (dm = d), (mejor = j);
      });
      if (mejor < 0) return;
      pares.add(Math.min(i, mejor) + "," + Math.max(i, mejor));
      const b = faroles[mejor],
        [u, v] = a.y >= b.y ? [a, b] : [b, a],
        s = 1.25;
      p.cosas.push({ tipo: "asset", id: "guirnaldaYule", x: u.x, y: u.y + 2, o: { x2: v.x, y2: v.y, sinPostes: true, alto: 84, s, sem: i, caida: Math.min(60, 12 + dm * 0.03) } });
    });
    return p;
  }
  if (activo && window.PLANO25) {
    const armar0 = PLANO25.armar;
    PLANO25.armar = function () {
      const p = armar0.apply(this, arguments);
      try {
        decorarCiudad(p);
      } catch (e) {
        console.error(e);
      }
      return p;
    };
  }
  // la nieve de Eikholt: lo pide ciudad/mundo.js después de dibujar la ciudad (cam en la vista de la ciudad)
  function nieveCiudad(c, cam, cw, ch, t) {
    if (!conNieve) return;
    c.save();
    c.setTransform(cam.esc, 0, 0, cam.esc, cw / 2 - cam.x * cam.esc, ch / 2 - cam.y * cam.esc);
    const vw = cw / cam.esc / 2,
      vh = ch / cam.esc / 2;
    nieve(c, cam.x - vw, cam.y - vh, cam.x + vw, cam.y + vh, t, 1.6);
    c.restore();
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      W = A.W;
      if (activo) decorarBosque();
    },
    // la luz de lo que alumbra (los abetos, los troncos con velas, el medio de cada guirnalda) y un poco de cada
    // árbol con lucecitas cerca de la cámara
    luces(sumar, x0, y0, x1, y1) {
      if (!activo || !W) return;
      let n = 0;
      const tope = { alta: 26, media: 10, baja: 0 }[calidad()];
      W.cercanas(x0 - 300, y0 - 300, x1 + 300, y1 + 500, (o) => {
        if (o.oculto) return;
        const s = o.o.s || 1;
        if (o.id === "abetoYule") sumar({ x: o.x, y: o.y - 150 * s, r: 420 * s, col: "#FFD98A", f: 0.85 + Math.sin(J.t * 2 + o.x) * 0.08 });
        else if (o.id === "troncoYule") sumar({ x: o.x, y: o.y - 40, r: 220 * s, col: "#FF8D71", f: 0.8 });
        else if (o.id === "guirnaldaYule" && o.o.x2 != null) sumar({ x: (o.x + o.o.x2) / 2, y: (o.y + o.o.y2) / 2 - 60, r: 170, col: "#FFD98A", f: 0.5 });
        else if (n < tope && (N().ADORNA[o.id] || o.id === "pinoYule") && o.id !== "farol") {
          const id = o.id === "pinoYule" ? "pino" : o.id;
          if (o.id !== "pinoYule" && N().nivel(id, o.x, o.y, o.o) < 2) return;
          n++;
          sumar({ x: o.x, y: o.y - (o.alto || 120) * 0.45, r: 130 * s * (id === "abetoAnciano" || id === "robleAnciano" ? 2 : 1), col: "#FFD98A", f: 0.5 });
        }
      });
    },
    aire(c, x0, y0, x1, y1) {
      if (!conNieve || !J) return;
      c.save();
      J.baseT();
      nieve(c, x0, y0, x1, y1, J.t);
      c.restore();
    },
    sobreLuz(c, x0, y0, x1, y1) {
      if (activo && J) brillos(c, x0, y0, x1, y1);
    },
  };
  if (activo) (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { activo, conNieve, sistema, gorro, hongo, lucesHongo, choquesHongo, nieve, nieveCiudad, PUESTAS };
})();
