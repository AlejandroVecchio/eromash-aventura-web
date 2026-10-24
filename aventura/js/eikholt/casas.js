// ---------- la herramienta de casas de Eikholt (módulo CASAS) ----------
// Pedido de Alejandro (24/10/2026): ninguna casa copiada y pegada. Cada edificio sale de una ficha: medidas, pisos,
// zócalo de piedra, cómo es la pared (tablas acostadas, tablas paradas, troncos cruzados, piedra o piedra abajo y
// madera arriba), sus colores, los postes de madera, las ventanas con postigos, la puerta con su runa ámbar, el techo
// (dos aguas, cuatro aguas o de césped, con hileras de tejuelas y musgo), chimeneas, buhardillas, las cabezas de dragón
// de la cumbrera, porche, cobertizo al costado, segundo piso con la viga saliente, balcón y cartel del oficio.
// Lo que no se pide sale de la semilla, así dos casas nunca son iguales.
// CASAS.crear(ficha, semilla) → { grupo, partes, choques, superficies, puerta, humo, luces, ficha }
//   grupo: el THREE.Group con el frente hacia +z, centrado en el piso de la casa (se ubica desde afuera)
//   partes: { techo: [mallas], paredes: { frente, atras, izq, der }: [mallas], base: [mallas] }: ciudad.js esconde
//     el techo y las paredes que tapan la cámara cuando Eromash entra (vista de interior)
//   choques: en coordenadas de la casa: { caja: [cx, cz, mx, mz] } o { seg: [ax, az, bx, bz] } (paredes si se entra)
//   superficies: pisos que se pisan (el porche, el piso de adentro): { pts: [[x, z]…], y }
// El banco para probarla está en aventura/casas.html.
window.CASAS = (function () {
  "use strict";
  const T = THREE;
  const PALETA = {
    madera: ["#4A3426", "#5A3E2C", "#3E2C20", "#6A4A32", "#54402E", "#46362A", "#5C4434", "#4E3A2E"],
    maderaTenida: ["#6A3A2A", "#4E4A3E", "#5E5240", "#3E3E3A", "#704E30"], // tablas teñidas: rojiza, gris de lluvia, ocre
    postes: ["#2E2018", "#36261C", "#2A221C", "#3A2A1E"],
    piedra: ["#6E726C", "#7A7C76", "#5E625E", "#837E74", "#6A6A62"],
    tejuela: ["#4E545C", "#454A52", "#5A5450", "#4C4844", "#50545A", "#58504A"],
    pizarra: ["#4A5868", "#46525E"],
    cesped: ["#4E5A32", "#56602E"],
    musgo: ["#4E5A34", "#56603E", "#4A5432"],
    postigos: ["#5E2C20", "#3E4E5A", "#4E5C32", "#6E5A3A", "#4A3A2E", "#7A3A2A"],
    puerta: ["#3A2A1E", "#4A2E20", "#2E2620", "#5E3A26"],
    vidrio: "#F2C46A",
    ambar: "#E9B765",
    hierro: "#2A2A2C",
  };
  const elegir = (r, l) => l[Math.floor(r() * l.length) % l.length];

  // completa la ficha con lo que no se pidió (siempre igual para la misma semilla)
  function completar(f, sem) {
    const r = GEO.azar(sem * 7 + 3);
    const o = Object.assign({}, f);
    o.ancho = o.ancho || 6 + r() * 4;
    o.fondo = o.fondo || 4.6 + r() * 2.4;
    o.pisos = o.pisos || (r() < 0.25 ? 2 : 1);
    o.altoPiso = o.altoPiso || 2.7 + r() * 0.3;
    if (o.zocalo === undefined) o.zocalo = 0.35 + r() * 0.45;
    o.pared = o.pared || elegir(r, ["tablasH", "tablasH", "tablasV", "troncos", "tablasH", "mixta"]);
    o.colorPared = o.colorPared || (r() < 0.22 ? elegir(r, PALETA.maderaTenida) : elegir(r, PALETA.madera));
    o.colorPared2 = o.colorPared2 || o.colorPared;
    o.colorPostes = o.colorPostes || elegir(r, PALETA.postes);
    o.colorPiedra = o.colorPiedra || elegir(r, PALETA.piedra);
    if (o.postes === undefined) o.postes = o.pared !== "troncos";
    o.colorPostigo = o.colorPostigo || elegir(r, PALETA.postigos);
    o.colorPuerta = o.colorPuerta || elegir(r, PALETA.puerta);
    if (o.postigos === undefined) o.postigos = r() < 0.7;
    o.ventanas = Object.assign({ frente: Math.max(1, Math.round(o.ancho / 3.2)), atras: Math.round(r() * 2), lados: r() < 0.6 ? 1 : 0, ancho: 0.62 + r() * 0.2, alto: 0.72 + r() * 0.2 }, o.ventanas || {});
    o.puerta = Object.assign({ pos: (r() - 0.5) * 0.4, ancho: 1.15, alto: 2.15, runa: r() < 0.75, abierta: !!o.entrable }, o.puerta || {});
    o.techo = Object.assign({}, o.techo || {});
    const tt = o.techo;
    tt.tipo = tt.tipo || elegir(r, ["dosAguas", "dosAguas", "dosAguas", "cuatroAguas", "cesped"]);
    tt.pendiente = tt.pendiente || 0.95 + r() * 0.5;
    tt.alero = tt.alero != null ? tt.alero : 0.45 + r() * 0.35;
    tt.color = tt.color || (tt.tipo === "cesped" ? elegir(r, PALETA.cesped) : elegir(r, PALETA.tejuela));
    tt.musgo = tt.musgo != null ? tt.musgo : r() * 0.8;
    if (o.chimeneas === undefined) o.chimeneas = r() < 0.85 ? [{ x: (r() - 0.5) * o.ancho * 0.5, z: -o.fondo * 0.12 }] : [];
    if (o.buhardillas === undefined) o.buhardillas = o.ancho > 8 && tt.tipo !== "cesped" && r() < 0.5 ? 1 + Math.floor(r() * 2) : 0;
    if (o.dragones === undefined) o.dragones = tt.tipo === "dosAguas" && r() < 0.45;
    if (o.porche === undefined) o.porche = r() < 0.4 ? { fondo: 1.5 + r() * 0.6 } : null;
    if (o.anexo === undefined) o.anexo = r() < 0.35 ? { lado: r() < 0.5 ? -1 : 1, ancho: 2 + r() * 1.2, fondo: o.fondo * (0.55 + r() * 0.3) } : null;
    if (o.lena === undefined) o.lena = r() < 0.4;
    o.semilla = sem;
    return o;
  }

  // ---------- una pared ----------
  // En coordenadas de la pared: corre en x de -L/2 a L/2, la cara de afuera mira a +z, desde y0 hacia arriba H.
  // hastial: alto del triángulo de arriba (las paredes de los costados de un techo a dos aguas).
  // huecos: puertas [x0, x1, alto] que se cortan; ventanas: [{ x, y, w, h }] que se ponen encima.
  function pared(a, b, L, y0, H, o, huecos, ventanas, hastial, piso2) {
    const g = 0.22,
      estilo = o.pared,
      r = a.r;
    // las bandas verticales entre huecos
    const cortes = [-L / 2, L / 2];
    huecos.forEach((h) => cortes.push(h[0], h[1]));
    cortes.sort((p, q) => p - q);
    const enHueco = (x) => huecos.find((h) => x > h[0] && x < h[1]);
    const color = (y) => (estilo === "mixta" && y < (piso2 || H * 0.5) ? o.colorPiedra : y >= (piso2 || 1e9) ? o.colorPared2 : o.colorPared);
    const esPiedra = (y) => estilo === "piedra" || (estilo === "mixta" && y < (piso2 || H * 0.5));
    // hilera horizontal de x0 a x1 a la altura y, con alto hh: tablas, troncos o piedras
    function hilera(x0, x1, y, hh, i) {
      if (x1 - x0 < 0.02) return;
      const piedra = esPiedra(y + hh / 2);
      if (piedra) {
        // piedras de largo variable, juntas corridas
        let x = x0 - (i % 2) * 0.35;
        while (x < x1) {
          const w = 0.5 + r() * 0.5,
            xa = Math.max(x, x0),
            xb = Math.min(x + w, x1);
          if (xb - xa > 0.04) a.caja((xa + xb) / 2, y + 0.015, 0, xb - xa - 0.03, hh - 0.03, g + (r() - 0.5) * 0.05, GEO.aclarar(color(y), (r() - 0.5) * 0.18));
          x += w;
        }
        return;
      }
      if (estilo === "troncos") {
        a.con({ y: y + hh / 2, rz: Math.PI / 2 }, () => a.cilindro(0, x0, 0, hh / 2 + 0.02, hh / 2 + 0.02, x1 - x0, 6, GEO.aclarar(color(y), (r() - 0.5) * 0.14), color(y), true));
        return;
      }
      // tabla acostada: una sí y una no un poquito más afuera (la línea de la tabla se lee con la luz)
      a.caja((x0 + x1) / 2, y, (i % 2) * 0.02, x1 - x0, hh - 0.012, g, GEO.aclarar(color(y), (r() - 0.5) * 0.12));
    }
    const topeHueco = (x) => {
      const h = enHueco(x);
      return h ? h[2] : 0;
    };
    if (estilo === "tablasV" && !esPiedra(H * 0.25)) {
      // tablas paradas con tapajuntas
      const n = Math.max(2, Math.round(L / 0.32));
      for (let i = 0; i < n; i++) {
        const x0 = -L / 2 + (i * L) / n,
          x1 = x0 + L / n,
          xm = (x0 + x1) / 2,
          tope = topeHueco(xm);
        const ya = y0 + tope;
        let hh = H - tope;
        if (hh > 0.02) a.caja(xm, ya, 0, x1 - x0 - 0.01, hh, g, GEO.aclarar(color(y0 + 1), (r() - 0.5) * 0.12));
        if (i % 2 === 0 && hh > 0.02) a.caja(x1, ya, 0.06, 0.08, hh, 0.06, GEO.aclarar(o.colorPared, -0.18));
      }
    } else {
      const hh = estilo === "troncos" ? 0.3 : esPiedra(0.2) && estilo === "piedra" ? 0.34 : 0.26;
      const n = Math.ceil(H / hh);
      for (let i = 0; i < n; i++) {
        const y = y0 + i * hh,
          h2 = Math.min(hh, y0 + H - y);
        const hEst = esPiedra(y - y0 + 0.01) ? (estilo === "mixta" ? 0.3 : hh) : hh;
        for (let k = 0; k < cortes.length - 1; k++) {
          const xa = cortes[k],
            xb = cortes[k + 1],
            xm = (xa + xb) / 2;
          if (y - y0 < topeHueco(xm) - 0.01) continue;
          hilera(xa, xb, y, Math.min(h2, hEst), i);
        }
      }
      // troncos: las puntas cruzadas en las esquinas
      if (estilo === "troncos")
        for (let i = 0; i < n; i += 1) {
          const y = y0 + i * hh + hh / 2;
          [-1, 1].forEach((s) => a.con({ x: s * (L / 2 + 0.06), y, z: -0.12 }, () => a.cilindro(0, -0.1, 0, hh / 2 + 0.02, hh / 2 + 0.02, 0.4, 6, GEO.aclarar(o.colorPared, -0.08))));
        }
    }
    // el hastial (triángulo del techo a dos aguas)
    if (hastial > 0) {
      const hh = 0.26,
        n = Math.ceil(hastial / hh);
      for (let i = 0; i < n; i++) {
        const y = y0 + H + i * hh,
          f = 1 - (i + 0.5) / n,
          w = L * f;
        if (w > 0.05) a.caja(0, y, (i % 2) * 0.02, w, hh - 0.01, g, GEO.aclarar(o.colorPared2, (r() - 0.5) * 0.12));
      }
      // ventanita redonda del desván en algunos hastiales
      if (hastial > 1.4 && r() < 0.5) {
        b.con({ y: y0 + H + hastial * 0.32, z: g / 2 + 0.02, rx: Math.PI / 2 }, () => b.cilindro(0, 0, 0, 0.22, 0.22, 0.02, 7, PALETA.vidrio));
        a.con({ y: y0 + H + hastial * 0.32, z: g / 2 + 0.01, rx: Math.PI / 2 }, () => a.cilindro(0, 0, 0, 0.3, 0.3, 0.04, 7, o.colorPostes));
      }
    }
    // ventanas: marco, vidrio ámbar (en el armador de brillo, adentro y afuera), postigos abiertos y alféizar
    for (const v of ventanas) {
      const { x, y, w, h } = v;
      const mc = o.colorPostes;
      a.caja(x, y - 0.06, g / 2 + 0.05, w + 0.24, 0.07, 0.16, mc);
      a.caja(x, y + h, g / 2 + 0.03, w + 0.18, 0.08, 0.1, mc);
      a.caja(x - w / 2 - 0.05, y, g / 2 + 0.03, 0.08, h, 0.1, mc);
      a.caja(x + w / 2 + 0.05, y, g / 2 + 0.03, 0.08, h, 0.1, mc);
      a.caja(x, y + h / 2 - 0.03, g / 2 + 0.035, w, 0.05, 0.06, mc); // el travesaño
      b.quad([x - w / 2, y, g / 2 + 0.012], [x + w / 2, y, g / 2 + 0.012], [x + w / 2, y + h, g / 2 + 0.012], [x - w / 2, y + h, g / 2 + 0.012], PALETA.vidrio);
      b.quad([x + w / 2, y, -g / 2 - 0.012], [x - w / 2, y, -g / 2 - 0.012], [x - w / 2, y + h, -g / 2 - 0.012], [x + w / 2, y + h, -g / 2 - 0.012], PALETA.vidrio);
      if (o.postigos) {
        [-1, 1].forEach((s) => {
          const px = x + s * (w / 2 + 0.08 + w * 0.27);
          a.caja(px, y - 0.02, g / 2 + 0.05, w * 0.5, h + 0.04, 0.05, GEO.aclarar(o.colorPostigo, (r() - 0.5) * 0.1));
          a.caja(px, y + h * 0.25, g / 2 + 0.08, w * 0.42, 0.04, 0.02, GEO.aclarar(o.colorPostigo, -0.25));
          a.caja(px, y + h * 0.7, g / 2 + 0.08, w * 0.42, 0.04, 0.02, GEO.aclarar(o.colorPostigo, -0.25));
        });
      }
      // a veces una maceta o hierbas colgando abajo de la ventana
      if (r() < 0.25) a.caja(x, y - 0.24, g / 2 + 0.14, w * 0.8, 0.18, 0.18, "#5E3A26");
      if (r() < 0.2) for (let k = 0; k < 4; k++) a.bola(x - w * 0.3 + k * w * 0.2, y - 0.02, g / 2 + 0.16, 0.1, 0.09, 0.1, k % 2 ? "#5E7A3A" : "#C86A4A", 0, 0.2);
    }
  }

  // la runa ámbar sobre la puerta (protección de la casa): trazos finos en el armador de brillo
  const RUNAS_PUERTA = {
    algiz: [[0, 0, 0, 1], [0, 0.55, -0.35, 1], [0, 0.55, 0.35, 1]],
    othala: [[-0.3, 0, 0.3, 0.5], [0.3, 0, -0.3, 0.5], [-0.3, 0.5, 0, 1], [0.3, 0.5, 0, 1]],
    ingwaz: [[0, 0, -0.3, 0.5], [-0.3, 0.5, 0, 1], [0, 1, 0.3, 0.5], [0.3, 0.5, 0, 0]],
    tiwaz: [[0, 0, 0, 1], [0, 1, -0.3, 0.7], [0, 1, 0.3, 0.7]],
    berkano: [[-0.2, 0, -0.2, 1], [-0.2, 1, 0.25, 0.75], [0.25, 0.75, -0.2, 0.5], [-0.2, 0.5, 0.25, 0.25], [0.25, 0.25, -0.2, 0]],
    jera: [[-0.1, 0.2, -0.35, 0.5], [-0.35, 0.5, -0.1, 0.8], [0.1, 0.2, 0.35, 0.5], [0.35, 0.5, 0.1, 0.8]],
  };
  function runa(b, nombre, x, y, z, alto, color) {
    const tr = RUNAS_PUERTA[nombre] || RUNAS_PUERTA.algiz;
    for (const [x0, y0, x1, y1] of tr) {
      const ax = x + x0 * alto,
        ay = y + y0 * alto,
        bx = x + x1 * alto,
        by = y + y1 * alto;
      const dx = bx - ax,
        dy = by - ay,
        l = Math.hypot(dx, dy),
        nx = (-dy / l) * 0.025,
        ny = (dx / l) * 0.025;
      b.quad([ax - nx, ay - ny, z], [bx - nx, by - ny, z], [bx + nx, by + ny, z], [ax + nx, ay + ny, z], color || PALETA.ambar);
    }
  }

  // ---------- el techo ----------
  // a dos aguas con la cumbrera en x; hileras de tejuelas que se pisan; musgo en manchas
  function techo(a, b, o, W, D, yb) {
    const tt = o.techo,
      r = a.r;
    const al = tt.alero,
      run = D / 2 + al,
      sube = (D / 2) * tt.pendiente,
      yc = yb + sube; // alto de la cumbrera
    const ya = yb - al * tt.pendiente; // borde del alero
    const largo = W / 2 + al * 0.8;
    const pendLen = Math.hypot(run, yc - ya);
    const hileras = Math.max(4, Math.round(pendLen / (tt.tipo === "cesped" ? 0.9 : 0.42)));
    const grosor = tt.tipo === "cesped" ? 0.32 : 0.12;
    const cuatro = tt.tipo === "cuatroAguas";
    for (const s of [1, -1]) {
      for (let i = 0; i < hileras; i++) {
        const u0 = i / hileras,
          u1 = (i + 1) / hileras + 0.02;
        const z0 = s * run * (1 - u0),
          z1 = s * run * (1 - Math.min(1, u1));
        const y0 = ya + (yc - ya) * u0 + (i % 2) * 0.012,
          y1 = ya + (yc - ya) * Math.min(1, u1);
        // a cuatro aguas las hileras se acortan hacia la cumbrera
        const w0 = cuatro ? largo - (largo - (W / 2) * 0.35) * u0 : largo,
          w1 = cuatro ? largo - (largo - (W / 2) * 0.35) * Math.min(1, u1) : largo;
        const c = GEO.aclarar(tt.color, (r() - 0.5) * 0.12 + (i % 2 ? 0.03 : -0.02));
        const p0 = [-w0, y0, z0],
          p1 = [w0, y0, z0],
          p2 = [w1, y1, z1],
          p3 = [-w1, y1, z1];
        if (s > 0) a.losa(p3, p2, p1, p0, grosor, c, GEO.aclarar(tt.color, -0.3));
        else a.losa(p0, p1, p2, p3, grosor, c, GEO.aclarar(tt.color, -0.3));
      }
      // musgo: manchas planas encima de las tejuelas
      const nm = Math.round(tt.musgo * W * 0.9);
      for (let k = 0; k < nm; k++) {
        const u = 0.08 + r() * 0.75,
          x = (r() - 0.5) * W * 0.9,
          z = s * run * (1 - u),
          y = ya + (yc - ya) * u + 0.07;
        const w = 0.15 + r() * 0.35,
          d = 0.18 + r() * 0.3;
        const dz = (d / 2) * s,
          dy = (d / 2) * ((yc - ya) / run);
        a.quad(s > 0 ? [x - w, y - dy, z + dz] : [x + w, y - dy, z + dz], s > 0 ? [x + w, y - dy, z + dz] : [x - w, y - dy, z + dz], s > 0 ? [x + w * 0.7, y + dy, z - dz] : [x - w * 0.7, y + dy, z - dz], s > 0 ? [x - w * 0.7, y + dy, z - dz] : [x + w * 0.7, y + dy, z - dz], elegir(r, PALETA.musgo));
      }
    }
    // a cuatro aguas: los faldones de los costados
    if (cuatro) {
      for (const s of [1, -1]) {
        const xe = s * largo,
          xc = (s * W) / 2 * 0.35;
        a.tri([xe, ya, run], [xc, yc, 0], [xe, ya, -run], tt.color);
        a.tri([xe, ya, -run], [xc, yc, 0], [xe, ya, run], GEO.aclarar(tt.color, -0.3));
      }
    }
    // la cumbrera
    const lc = cuatro ? (W / 2) * 0.35 : largo;
    a.caja(0, yc - 0.06, 0, lc * 2 + 0.1, 0.16, 0.26, GEO.aclarar(tt.tipo === "cesped" ? "#3A2A1E" : tt.color, -0.25));
    // césped: matas de pasto encima
    if (tt.tipo === "cesped") for (let k = 0; k < W * 3; k++) {
      const s = r() < 0.5 ? 1 : -1,
        u = r() * 0.9,
        x = (r() - 0.5) * W,
        z = s * run * (1 - u),
        y = ya + (yc - ya) * u + 0.05;
      a.con({ x, y, z, ry: r() * 3 }, () => a.cilindro(0, 0, 0, 0.12, 0, 0.3 + r() * 0.2, 3, elegir(r, ["#6A7A3A", "#5E6A32", "#7A8A44"])));
    }
    return { yc, ya, run, largo };
  }

  // ---------- crear una casa ----------
  function crear(fichaIn, sem = 1) {
    const o = completar(fichaIn || {}, sem);
    const W = o.ancho,
      D = o.fondo,
      zc = o.zocalo,
      Hp = o.altoPiso * o.pisos + (o.pisos > 1 ? 0.25 : 0);
    const grupo = new T.Group();
    const partes = { techo: [], paredes: { frente: [], atras: [], izq: [], der: [] }, base: [] };
    const choques = [],
      superficies = [],
      humo = [],
      luces = [];
    const base = GEO.armador(sem * 13 + 1),
      bBase = GEO.armador(sem * 13 + 2);
    const r = base.r;
    // el zócalo de piedra y el piso
    const yp = zc; // altura del piso de adentro
    if (zc > 0) {
      let x = -W / 2;
      for (const z of [D / 2, -D / 2]) {
        x = -W / 2;
        while (x < W / 2) {
          const w = 0.45 + r() * 0.5,
            xb = Math.min(x + w, W / 2);
          base.caja((x + xb) / 2, 0, z, xb - x - 0.03, zc + (r() - 0.5) * 0.06, 0.34, GEO.aclarar(o.colorPiedra, (r() - 0.5) * 0.2));
          x += w;
        }
      }
      for (const xx of [W / 2, -W / 2]) {
        let z = -D / 2;
        while (z < D / 2) {
          const w = 0.45 + r() * 0.5,
            zb = Math.min(z + w, D / 2);
          base.caja(xx, 0, (z + zb) / 2, 0.34, zc + (r() - 0.5) * 0.06, zb - z - 0.03, GEO.aclarar(o.colorPiedra, (r() - 0.5) * 0.2));
          z += w;
        }
      }
    }
    // piso de tablas (adentro)
    for (let i = 0; i < Math.round(W / 0.3); i++) {
      const x = -W / 2 + 0.15 + i * 0.3;
      base.caja(x, yp - 0.06, 0, 0.29, 0.06, D - 0.3, GEO.aclarar("#5E4430", (r() - 0.5) * 0.14));
    }
    // la puerta (en el frente): hueco en la pared, hoja de tablas abierta hacia adentro, escalones
    const pu = o.puerta,
      px = pu.pos * (W - pu.ancho - 1);
    const huecoPuerta = [px - pu.ancho / 2, px + pu.ancho / 2, pu.alto];
    // escalones de piedra hasta el piso
    const esc = Math.max(1, Math.round(zc / 0.2));
    for (let i = 0; i < esc; i++) base.caja(px, 0, D / 2 + 0.3 + (esc - 1 - i) * 0.32, pu.ancho + 0.5, ((i + 1) * zc) / esc, 0.34, GEO.aclarar(o.colorPiedra, (r() - 0.5) * 0.15));
    superficies.push({ pts: [[px - pu.ancho / 2 - 0.25, D / 2 + 0.1], [px + pu.ancho / 2 + 0.25, D / 2 + 0.1], [px + pu.ancho / 2 + 0.25, D / 2 + 0.3 + esc * 0.32], [px - pu.ancho / 2 - 0.25, D / 2 + 0.3 + esc * 0.32]], y: zc * 0.5, rampa: [zc, 0] });
    // la hoja de la puerta
    {
      const hoja = (a) => {
        for (let k = 0; k < 4; k++) a.caja(-pu.ancho / 2 + pu.ancho / 8 + (k * pu.ancho) / 4, 0, 0, pu.ancho / 4 - 0.02, pu.alto - 0.05, 0.07, GEO.aclarar(o.colorPuerta, (r() - 0.5) * 0.12));
        a.caja(0, pu.alto * 0.22, 0.05, pu.ancho * 0.95, 0.07, 0.03, PALETA.hierro);
        a.caja(0, pu.alto * 0.72, 0.05, pu.ancho * 0.95, 0.07, 0.03, PALETA.hierro);
        a.caja(pu.ancho * 0.35, pu.alto * 0.48, 0.07, 0.06, 0.12, 0.05, "#8A7A5A");
      };
      if (pu.abierta) base.con({ x: px - pu.ancho / 2 + 0.04, y: yp, z: D / 2 - 0.12, ry: -1.35 }, () => base.con({ x: pu.ancho / 2 }, () => hoja(base)));
      else base.con({ x: px, y: yp, z: D / 2 + 0.02 }, () => hoja(base));
    }
    // ---------- las cuatro paredes ----------
    const piso2 = o.pisos > 1 ? o.altoPiso + 0.12 : 0;
    const filasVent = o.pisos > 1 ? [yp + 0.95, yp + o.altoPiso + 0.25 + 0.75] : [yp + 0.95];
    const repartir = (n, L, evitar) => {
      const l = [];
      for (let i = 0; i < n; i++) {
        let x = -L / 2 + ((i + 0.5) * L) / n;
        if (evitar && Math.abs(x - evitar[0]) < evitar[1]) x += x < evitar[0] ? -evitar[1] * 0.6 : evitar[1] * 0.6;
        if (Math.abs(x) < L / 2 - 0.5) l.push(x);
      }
      return l;
    };
    const vw = o.ventanas.ancho,
      vh = o.ventanas.alto;
    const lados = [
      { k: "frente", L: W, ry: 0, x: 0, z: D / 2, n: o.ventanas.frente, huecos: [huecoPuerta.map((v, i) => (i < 2 ? v : v))], hastial: 0 },
      { k: "atras", L: W, ry: Math.PI, x: 0, z: -D / 2, n: o.ventanas.atras, huecos: [], hastial: 0 },
      { k: "der", L: D, ry: Math.PI / 2, x: W / 2, z: 0, n: o.ventanas.lados, huecos: [], hastial: o.techo.tipo === "cuatroAguas" ? 0 : (D / 2) * o.techo.pendiente },
      { k: "izq", L: D, ry: -Math.PI / 2, x: -W / 2, z: 0, n: o.ventanas.lados, huecos: [], hastial: o.techo.tipo === "cuatroAguas" ? 0 : (D / 2) * o.techo.pendiente },
    ];
    for (const s of lados) {
      const a = GEO.armador(sem * 13 + 5 + s.ry * 3),
        b = GEO.armador(sem * 13 + 9 + s.ry * 3);
      a.con({ x: s.x, y: 0, z: s.z, ry: s.ry }, () => {
        b.con({ x: s.x, y: 0, z: s.z, ry: s.ry }, () => {
          const vent = [];
          filasVent.forEach((fy, fi) => {
            const ev = s.k === "frente" && fi === 0 ? [px, pu.ancho / 2 + vw / 2 + 0.35] : null;
            repartir(fi === 0 ? s.n : Math.max(s.n, s.k === "frente" ? 2 : s.n), s.L - 0.6, ev).forEach((x) => vent.push({ x, y: fy, w: vw, h: vh }));
          });
          // la pared arranca encima del zócalo; en la puerta, el hueco va desde el piso
          const huecos = s.huecos.map((h) => [h[0], h[1], h[2]]);
          pared(a, b, s.L, yp, Hp, o, huecos, vent, s.hastial, piso2 ? piso2 : 0);
          // postes en las esquinas y cada tanto; la viga del segundo piso
          if (o.postes) {
            const n = Math.max(1, Math.round(s.L / 2.6));
            for (let i = 0; i <= n; i++) {
              const x = -s.L / 2 + (i * s.L) / n;
              if (huecos.some((h) => x > h[0] - 0.15 && x < h[1] + 0.15)) continue;
              if (vent.some((v) => Math.abs(v.x - x) < v.w / 2 + 0.25)) continue;
              a.caja(x, yp - 0.05, 0.13, 0.2, Hp + 0.1, 0.12, GEO.aclarar(o.colorPostes, (r() - 0.5) * 0.1));
            }
            a.caja(0, yp - 0.12, 0.14, s.L + 0.1, 0.16, 0.14, o.colorPostes);
            a.caja(0, yp + Hp - 0.12, 0.14, s.L + 0.2, 0.18, 0.16, o.colorPostes);
          }
          if (piso2) a.caja(0, yp + piso2 - 0.1, 0.2, s.L + 0.3, 0.22, 0.22, GEO.aclarar(o.colorPostes, 0.05));
          // la runa y el dintel sobre la puerta
          if (s.k === "frente") {
            a.caja(px, yp + pu.alto, 0.12, pu.ancho + 0.4, 0.2, 0.18, o.colorPostes);
            a.caja(px - pu.ancho / 2 - 0.08, yp, 0.12, 0.14, pu.alto, 0.16, o.colorPostes);
            a.caja(px + pu.ancho / 2 + 0.08, yp, 0.12, 0.14, pu.alto, 0.16, o.colorPostes);
            if (pu.runa) runa(b, pu.runa === true ? elegir(r, Object.keys(RUNAS_PUERTA)) : pu.runa, px, yp + pu.alto + 0.24, 0.23, 0.36);
          }
        });
      });
      const m = a.malla(),
        mb = b.malla(GEO.MAT.brillo);
      [m, mb].forEach((x) => {
        if (!x) return;
        x.userData.lado = s.k;
        grupo.add(x);
        partes.paredes[s.k].push(x);
      });
      if (mb) mb.castShadow = false;
    }
    // ---------- el techo ----------
    const at = GEO.armador(sem * 13 + 21),
      bt = GEO.armador(sem * 13 + 22);
    const yb = yp + Hp;
    const tinfo = techo(at, bt, o, W, D, yb);
    // buhardillas en el faldón del frente
    for (let i = 0; i < o.buhardillas; i++) {
      const x = -W / 2 + ((i + 0.5) * W) / o.buhardillas + (o.buhardillas === 1 ? W * 0.12 : 0);
      const z = D * 0.18,
        y = yb + (D / 2 - z) * o.techo.pendiente - 0.35;
      const w = 1.3;
      at.caja(x, y, z + 0.2, w, 1.1, 1.2, o.colorPared2);
      bt.quad([x - 0.3, y + 0.25, z + 0.81], [x + 0.3, y + 0.25, z + 0.81], [x + 0.3, y + 0.85, z + 0.81], [x - 0.3, y + 0.85, z + 0.81], PALETA.vidrio);
      at.caja(x, y + 0.2, z + 0.8, 0.8, 0.06, 0.06, o.colorPostes);
      at.losa([x - w / 2 - 0.15, y + 1.05, z + 0.95], [x, y + 1.6, z + 0.95], [x, y + 1.6, z - 0.6], [x - w / 2 - 0.15, y + 1.05, z - 0.6], 0.1, o.techo.color, GEO.aclarar(o.techo.color, -0.3));
      at.losa([x, y + 1.6, z + 0.95], [x + w / 2 + 0.15, y + 1.05, z + 0.95], [x + w / 2 + 0.15, y + 1.05, z - 0.6], [x, y + 1.6, z - 0.6], 0.1, GEO.aclarar(o.techo.color, -0.06), GEO.aclarar(o.techo.color, -0.3));
    }
    // chimeneas de piedra
    for (const ch of o.chimeneas) {
      const hTop = tinfo.yc + 0.9;
      const n = Math.ceil((hTop - yb + 1) / 0.3);
      for (let i = 0; i < n; i++) at.caja(ch.x, yb - 1 + i * 0.3, ch.z, 0.75 + (i % 2) * 0.04, 0.3, 0.7 + ((i + 1) % 2) * 0.04, GEO.aclarar(ch.color || o.colorPiedra, (r() - 0.5) * 0.18));
      at.caja(ch.x, hTop - 0.05, ch.z, 0.95, 0.12, 0.9, GEO.aclarar(o.colorPiedra, -0.2));
      humo.push([ch.x, hTop + 0.2, ch.z]);
    }
    // las cabezas de dragón cruzadas en la cumbrera
    if (o.dragones) {
      for (const s of [1, -1]) {
        const x = s * (tinfo.largo + 0.05);
        [1, -1].forEach((k) => at.con({ x, y: tinfo.yc - 0.15, z: 0, rx: k * 0.75 }, () => {
          at.caja(0, 0, 0, 0.08, 1.15, 0.2, o.colorPostes);
          at.caja(0, 1.1, k * 0.12, 0.1, 0.18, 0.38, o.colorPostes);
        }));
      }
    }
    // tablas del alero en los hastiales (bargeboards)
    if (o.techo.tipo !== "cuatroAguas")
      for (const s of [1, -1]) {
        const x = s * (tinfo.largo + 0.02);
        at.palo([x, tinfo.ya - 0.05, tinfo.run], [x, tinfo.yc + 0.02, 0], 0.07, o.colorPostes, 4);
        at.palo([x, tinfo.ya - 0.05, -tinfo.run], [x, tinfo.yc + 0.02, 0], 0.07, o.colorPostes, 4);
      }
    const mt = at.malla(),
      mtb = bt.malla(GEO.MAT.brillo);
    [mt, mtb].forEach((x) => x && (grupo.add(x), partes.techo.push(x)));
    // ---------- porche, cobertizo, leña ----------
    if (o.porche) {
      const pf = o.porche.fondo,
        pw = o.porche.ancho || W * 0.86,
        a = GEO.armador(sem * 13 + 31);
      for (let i = 0; i < Math.round(pw / 0.3); i++) a.caja(-pw / 2 + 0.15 + i * 0.3, 0, D / 2 + pf / 2, 0.29, yp, pf, GEO.aclarar("#5A4230", (r() - 0.5) * 0.14));
      const np = Math.max(2, Math.round(pw / 2.4));
      for (let i = 0; i <= np; i++) {
        const x = -pw / 2 + 0.12 + (i * (pw - 0.24)) / np;
        if (Math.abs(x - px) < pu.ancho / 2 + 0.2) continue;
        a.caja(x, yp, D / 2 + pf - 0.12, 0.18, 2.35, 0.18, o.colorPostes);
        choques.push({ circulo: [x, D / 2 + pf - 0.12, 0.2] });
      }
      const y0 = yp + 2.35;
      a.losa([-pw / 2 - 0.2, y0, D / 2 + pf + 0.3], [pw / 2 + 0.2, y0, D / 2 + pf + 0.3], [pw / 2 + 0.2, y0 + 0.75, D / 2 - 0.05], [-pw / 2 - 0.2, y0 + 0.75, D / 2 - 0.05], 0.1, o.techo.tipo === "cesped" ? PALETA.tejuela[0] : o.techo.color, GEO.aclarar(o.techo.color, -0.3));
      a.caja(0, y0 - 0.05, D / 2 + pf - 0.12, pw, 0.16, 0.16, o.colorPostes);
      // un banco y algo del oficio en el porche
      a.caja(-pw * 0.3, yp, D / 2 + 0.45, 1.4, 0.42, 0.38, "#4A3426");
      const m = a.malla();
      m.userData.lado = "frente";
      grupo.add(m);
      partes.paredes.frente.push(m);
      superficies.push({ pts: [[-pw / 2, D / 2], [pw / 2, D / 2], [pw / 2, D / 2 + pf], [-pw / 2, D / 2 + pf]], y: yp });
    }
    if (o.anexo) {
      const an = o.anexo,
        s = an.lado,
        a = GEO.armador(sem * 13 + 41);
      const x0 = s * (W / 2 + an.ancho / 2 + 0.05),
        h = 2.1;
      for (let i = 0; i < Math.round(an.fondo / 0.3); i++) a.caja(x0 + (s * an.ancho) / 2 - s * 0.1, 0, -D / 2 + 0.15 + i * 0.3 + (D - an.fondo) / 2, 0.16, h, 0.28, GEO.aclarar(o.colorPared, (r() - 0.5) * 0.15 - 0.05));
      a.caja(x0, 0, -D / 2 + (D - an.fondo) / 2 + 0.08, an.ancho, h + 0.3, 0.16, GEO.aclarar(o.colorPared, -0.1));
      a.losa([x0 - (s * an.ancho) / 2 - s * 0.1, h + 0.9, an.fondo / 2 + 0.4 + (D - an.fondo) / 2 - D / 2 + an.fondo / 2], [x0 + (s * an.ancho) / 2 + s * 0.3, h, an.fondo / 2 + 0.4 + (D - an.fondo) / 2 - D / 2 + an.fondo / 2], [x0 + (s * an.ancho) / 2 + s * 0.3, h, -D / 2 + (D - an.fondo) / 2 - 0.3], [x0 - (s * an.ancho) / 2 - s * 0.1, h + 0.9, -D / 2 + (D - an.fondo) / 2 - 0.3].map((v) => v), 0.1, o.techo.tipo === "cesped" ? PALETA.tejuela[1] : GEO.aclarar(o.techo.color, 0.05), GEO.aclarar(o.techo.color, -0.3));
      // adentro del cobertizo: leña apilada o barriles
      for (let k = 0; k < 6; k++) a.con({ x: x0, y: 0.15 + (k % 3) * 0.24, z: (k < 3 ? -0.3 : 0.3) + (D - an.fondo) / 2 - D / 2 + an.fondo / 2 }, () => a.con({ rz: Math.PI / 2 }, () => a.cilindro(0, -an.ancho * 0.35, 0, 0.12, 0.12, an.ancho * 0.7, 6, "#7A5A3A", "#C8A070")));
      const m = a.malla();
      const lado = s > 0 ? "der" : "izq";
      m.userData.lado = lado;
      grupo.add(m);
      partes.paredes[lado].push(m);
      choques.push({ caja: [x0, -D / 2 + (D - an.fondo) / 2 + an.fondo / 2, an.ancho / 2 + 0.1, an.fondo / 2 + 0.1] });
    }
    if (o.lena && !o.anexo) {
      const a = GEO.armador(sem * 13 + 51),
        s = r() < 0.5 ? 1 : -1;
      for (let i = 0; i < 4; i++)
        for (let k = 0; k < 7 - i; k++) a.con({ x: s * (W / 2 + 0.45), y: 0.13 + i * 0.22, z: -D / 2 + 0.6 + k * 0.24 + i * 0.12 }, () => a.con({ rz: Math.PI / 2 }, () => a.cilindro(0, -0.4, 0, 0.11, 0.11, 0.8, 6, "#6A4A30", "#C89A68")));
      const m = a.malla(),
        lado = s > 0 ? "der" : "izq";
      grupo.add(m);
      partes.paredes[lado].push(m);
    }
    // cartel del oficio colgado de un brazo junto a la puerta
    if (o.cartel) {
      const a = GEO.armador(sem * 13 + 61),
        cx = px + pu.ancho / 2 + 0.9,
        cy = yp + pu.alto + 0.4;
      a.caja(cx - 0.45, cy + 0.6, D / 2 + 0.35, 1.2, 0.08, 0.08, o.colorPostes);
      a.caja(cx - 0.05, cy - 0.35, D / 2 + 0.35, 0.03, 0.4, 0.03, PALETA.hierro);
      a.caja(cx + 0.35, cy - 0.35, D / 2 + 0.35, 0.03, 0.4, 0.03, PALETA.hierro);
      a.caja(cx + 0.15, cy - 0.85, D / 2 + 0.35, 0.8, 0.55, 0.06, "#4A3426");
      CARTELES[o.cartel] && CARTELES[o.cartel](a, cx + 0.15, cy - 0.58, D / 2 + 0.4);
      const m = a.malla();
      grupo.add(m);
      partes.paredes.frente.push(m);
    }
    const mb0 = base.malla(),
      mb1 = bBase.malla(GEO.MAT.brillo);
    [mb0, mb1].forEach((x) => x && (grupo.add(x), partes.base.push(x)));
    // ---------- choques ----------
    if (o.entrable) {
      const g = 0.18;
      choques.push({ seg: [-W / 2, -D / 2, W / 2, -D / 2, g] });
      choques.push({ seg: [-W / 2, -D / 2, -W / 2, D / 2, g] });
      choques.push({ seg: [W / 2, -D / 2, W / 2, D / 2, g] });
      choques.push({ seg: [-W / 2, D / 2, huecoPuerta[0], D / 2, g] });
      choques.push({ seg: [huecoPuerta[1], D / 2, W / 2, D / 2, g] });
      superficies.push({ pts: [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]], y: yp, adentro: true });
    } else choques.push({ caja: [0, 0, W / 2 + 0.1, D / 2 + 0.1] });
    luces.push([px, yp + pu.alto + 0.5, D / 2 + 0.5]);
    return {
      grupo, partes, choques, superficies, humo, luces, ficha: o,
      puerta: { x: px, z: D / 2 + 0.6, y: yp, adentro: [px, D / 2 - 1.2] },
      medidas: { W, D, alto: tinfo.yc, yp },
    };
  }

  // carteles de los oficios: el dibujo tallado y pintado en la tabla
  const CARTELES = {
    hongo(a, x, y, z) {
      a.con({ x, y, z, rx: Math.PI / 2 }, () => {
        a.cilindro(0, -0.02, 0, 0.26, 0.05, 0.05, 8, "#E8B04A", "#FFD98A");
      });
      a.caja(x, y - 0.24, z + 0.02, 0.1, 0.22, 0.04, "#E0D4C0");
    },
    yunque(a, x, y, z) {
      a.caja(x, y - 0.05, z, 0.42, 0.1, 0.05, "#6E6A64");
      a.caja(x - 0.05, y - 0.2, z, 0.16, 0.16, 0.05, "#5A5650");
    },
    hierba(a, x, y, z) {
      for (let k = 0; k < 5; k++) a.caja(x - 0.2 + k * 0.1, y - 0.18 + (k % 2) * 0.04, z, 0.05, 0.32, 0.04, k % 2 ? "#5E7A3A" : "#7A9A4A");
    },
    soga(a, x, y, z) {
      a.con({ x, y, z, rx: Math.PI / 2 }, () => a.cilindro(0, 0, 0, 0.2, 0.2, 0.05, 8, "#C8A86A", "#A88A50"));
    },
    lanza(a, x, y, z) {
      a.palo([x - 0.25, y - 0.2, z], [x + 0.25, y + 0.15, z], 0.025, "#6A4A30");
      a.caja(x + 0.26, y + 0.12, z, 0.1, 0.14, 0.04, "#B8B4AC");
    },
    pluma(a, x, y, z) {
      a.palo([x - 0.15, y - 0.2, z], [x + 0.18, y + 0.18, z], 0.04, "#E0D8C8", 4, 0.01);
    },
    hacha(a, x, y, z) {
      a.palo([x - 0.2, y - 0.22, z], [x + 0.15, y + 0.2, z], 0.025, "#6A4A30");
      a.caja(x + 0.12, y + 0.08, z, 0.18, 0.2, 0.04, "#8A8A88");
    },
  };

  return { crear, completar, PALETA, runa, RUNAS: Object.keys(RUNAS_PUERTA) };
})();
