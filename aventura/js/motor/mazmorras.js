// ---------- el estilo de cada mazmorra: piso, paredes, lo que hay en las salas y lo que pasa adentro (MAZMORRAS) ----------
// ZONAS arma la grilla de salas y pasillos; acá cada mazmorra toma su estilo (d.estilo: cripta, cueva, mina, hielo,
// raíces o brasas) y con él:
//   · la forma: en cueva, hielo, raíces y brasas las salas pierden las esquinas y se abren en bultos (`deformar`);
//   · el piso y las paredes de cada celda (`piso`, `pared`): lajas e hiladas, roca quebrada con estalactitas, tierra
//     con rieles y entibado, hielo con carámbanos, tierra con raíces colgando, basalto con grietas encendidas;
//   · lo que hay en cada sala (`decorar`): montones de piedra, estalagmitas, cristales y hongos que alumbran, entibados
//     y vagonetas, columnas de hielo, raíces nudosas, charcos, huesos y cascotes;
//   · lo que pasa (`actualizar`, `cercanos`): derrumbes con su aviso exacto en el piso (saltar los evita, nada pasa del
//     35 %), pozos de lava que queman al pisarlos (se ven siempre, saltar los cruza), una pared agrietada que se rompe
//     y guarda un cofre, y la fuente rúnica que cura una vez;
//   · el aire (`aire`, `sobreLuz`): goteo, polvo, murciélagos, escarcha, esporas y brasas, que bajan con CALIDAD.nivel.
// Lo hecho (paredes rotas, fuentes usadas) va en el estado de ZONAS (E.extra.zonas.grietas / .fuentes).
window.MAZMORRAS = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const C = 200,
    H = 150,
    TAU = Math.PI * 2;
  const { R, P, E, L, alfa } = DIB;
  const ESTILOS = ["cripta", "cueva", "mina", "hielo", "raices", "brasas"];
  const ORGANICO = { cueva: 1, hielo: 1, raices: 1, brasas: 1 };
  // el piso de cada estilo: [base, otro tono, juntura] y el de las salas especiales
  const PISO = {
    cripta: ["#2E2A27", "#2A2623", "#1A1614"],
    cueva: ["#2C2926", "#33302C", "#1C1A18"],
    mina: ["#342A22", "#3A2F26", "#211A14"],
    hielo: ["#3A4E5C", "#425866", "#2A3A46"],
    raices: ["#26211C", "#2C261F", "#181410"],
    brasas: ["#201A18", "#262020", "#120E0C"],
  };
  // la pared: [cara, piedra de la cara, juntura, canto, arriba]
  const PARED = {
    cripta: ["#3A3430", "#433C37", "#24201D", "#2A2420", "#161211"],
    cueva: ["#36322E", "#46413C", "#22201D", "#2E2A26", "#121010"],
    mina: ["#3E342C", "#4C4036", "#241C16", "#2E261E", "#141010"],
    hielo: ["#5E7E92", "#86AEC2", "#3E5666", "#9CC4D8", "#1A2228"],
    raices: ["#33291F", "#3E3226", "#1E1812", "#2E3A24", "#100E0C"],
    brasas: ["#2A2422", "#363030", "#141010", "#3A1A14", "#0C0808"],
  };
  // el tono del aire de adentro (J.ambZona) y cuánto se ve
  const AMB = {
    cripta: { tono: [16, 9, 7], osc: 0.84 },
    cueva: { tono: [10, 10, 12], osc: 0.86 },
    mina: { tono: [18, 11, 6], osc: 0.84 },
    hielo: { tono: [8, 14, 20], osc: 0.78 },
    raices: { tono: [8, 12, 6], osc: 0.86 },
    brasas: { tono: [26, 8, 4], osc: 0.8 },
  };
  // lo que se pone en las salas: [id, peso, choca, opciones]
  const DECO = {
    cripta: [["montonPiedras", 3, 1], ["pilarCripta", 1, 1], ["fuenteRunica", 0, 1]],
    cueva: [["estalagmita", 5, 1], ["montonPiedras", 4, 1], ["cristalCueva", 2, 1, { col: "runa" }], ["hongosLuz", 1, 0]],
    mina: [["montonPiedras", 4, 1], ["entibado", 3, 0], ["vagoneta", 1, 1], ["estalagmita", 1, 1]],
    hielo: [["columnaHielo", 3, 1], ["estalagmita", 3, 1], ["cristalCueva", 2, 1, { col: "hielo" }], ["montonPiedras", 2, 1]],
    raices: [["raicesNudosas", 4, 1], ["hongosLuz", 4, 0], ["montonPiedras", 2, 1], ["cristalCueva", 1, 1, { col: "violeta" }]],
    brasas: [["estalagmita", 4, 1], ["montonPiedras", 4, 1], ["cristalCueva", 2, 1, { col: "fuego" }]],
  };
  const LUZ_DE = { cristalCueva: { runa: "#73D5DB", hielo: "#C8F2F4", violeta: "#9A6BD8", fuego: "#FF8D71" }, hongosLuz: "#7BC86C", fuenteRunica: "#73D5DB" };
  // las que se derrumban: en qué estilos y cuántas salas
  const DERRUMBE = { cueva: 2, mina: 2, hielo: 2, brasas: 1, raices: 1, cripta: 0 };

  let A, J, jug, CB, st;
  const hash = (a, b) => {
    const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const estiloDe = (d) => (ESTILOS.includes(d.estilo) ? d.estilo : "cripta");
  const nivel = () => (window.CALIDAD ? CALIDAD.nivel : "alta");

  // ---------- la forma: salas que pierden esquinas y se abren en bultos ----------
  function deformar(Z, r) {
    const d = Z.d,
      g = Z.g,
      sala = Z.sala,
      W = d.ancho,
      Hh = d.alto;
    if (!ORGANICO[estiloDe(d)]) return;
    const en = (x, y) => x >= 1 && y >= 1 && x < W - 1 && y < Hh - 1;
    const v = (x, y) => (x < 0 || y < 0 || x >= W || y >= Hh ? 0 : g[y * W + x]);
    const tocaPasillo = (x, y) => v(x - 1, y) === 2 || v(x + 1, y) === 2 || v(x, y - 1) === 2 || v(x, y + 1) === 2;
    d.salas.forEach((s, si) => {
      if (s.tipo === "entrada" || s.tipo === "jefe" || s.w < 4 || s.h < 3) return;
      // las esquinas se pierden (la celda de la esquina y a veces la de al lado)
      [[s.x, s.y, 1, 1], [s.x + s.w - 1, s.y, -1, 1], [s.x, s.y + s.h - 1, 1, -1], [s.x + s.w - 1, s.y + s.h - 1, -1, -1]].forEach(([x, y, dx, dy]) => {
        if (r() < 0.25) return;
        [[x, y], r() < 0.5 ? [x + dx, y] : [x, y + dy]].forEach(([qx, qy]) => {
          if (sala[qy * W + qx] === si && v(qx, qy) === 1 && !tocaPasillo(qx, qy)) (g[qy * W + qx] = 0), (sala[qy * W + qx] = -1);
        });
      });
      // los bultos: tramos de una a tres celdas que se abren afuera de un borde
      const bultos = 1 + Math.floor(r() * 3);
      for (let k = 0; k < bultos; k++) {
        const lado = Math.floor(r() * 4),
          largo = 1 + Math.floor(r() * 3);
        const horiz = lado < 2,
          a0 = horiz ? s.x + 1 + Math.floor(r() * Math.max(1, s.w - 2 - largo)) : s.y + 1 + Math.floor(r() * Math.max(1, s.h - 2 - largo));
        for (let i = 0; i < largo; i++) {
          const x = horiz ? a0 + i : lado === 2 ? s.x - 1 : s.x + s.w,
            y = horiz ? (lado === 0 ? s.y - 1 : s.y + s.h) : a0 + i;
          if (!en(x, y) || v(x, y)) continue;
          // que no toque otra sala
          let ajena = false;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (v(x + dx, y + dy) && sala[(y + dy) * W + x + dx] !== si && v(x + dx, y + dy) === 1) ajena = true;
          if (ajena) continue;
          g[y * W + x] = 1;
          sala[y * W + x] = si;
        }
      }
    });
    // los pasillos de las cuevas se ensanchan de a ratos
    for (let y = 1; y < Hh - 1; y++)
      for (let x = 1; x < W - 1; x++)
        if (g[y * W + x] === 2 && r() < 0.12) {
          const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(r() * 4)];
          if (en(x + dx, y + dy) && !g[(y + dy) * W + x + dx]) g[(y + dy) * W + x + dx] = 2;
        }
  }

  // ---------- lo que hay en cada sala y lo que pasa ----------
  function decorar(Z, semilla) {
    const d = Z.d,
      es = estiloDe(d),
      W = d.ancho,
      r = DIB.azar(Math.round((d.sem || 0) * 100000) + 4447);
    Z.estilo = es;
    Z.deco = [];
    Z.lucesDeco = [];
    Z.lavas = [];
    Z.derrumbes = [];
    Z.caidas = [];
    Z.restos = [];
    Z.grietas = [];
    Z.fuentes = [];
    const v = (x, y) => (x < 0 || y < 0 || x >= W || y >= d.alto ? 0 : Z.g[y * W + x]);
    const X = (cx) => Z.x0 + cx * C,
      Y = (cy) => Z.y0 + cy * C;
    // lo que ya ocupa un lugar (fuegos, cofres, la escalera, pilares, enemigos) no se tapa
    const ocupado = [];
    Z.fuegos.forEach((f) => ocupado.push([f.x, f.y, 180]));
    Z.cofres.forEach((cf) => ocupado.push([cf.x, cf.y, 200]));
    Z.obst.forEach((o) => ocupado.push([o.x, o.y, (o.r || 60) + 90]));
    if (Z.escalera) ocupado.push([Z.escalera.x, Z.escalera.y + 100, 300]);
    if (Z.jefe) ocupado.push([Z.jefe.cx, Z.jefe.cy, 560]);
    const libre = (x, y, rr) => ocupado.every(([ox, oy, or]) => Math.hypot(ox - x, (oy - y) * 1.3) > or + rr);
    const elegir = (lista) => {
      const tot = lista.reduce((n, q) => n + q[1], 0);
      let k = r() * tot;
      for (const q of lista) if ((k -= q[1]) < 0) return q;
      return lista[0];
    };
    // las celdas de una sala donde se puede poner algo: pegadas a la pared y lejos de las puertas y del centro
    const celdas = (s, si) => {
      const l = [];
      for (let y = s.y - 1; y <= s.y + s.h; y++)
        for (let x = s.x - 1; x <= s.x + s.w; x++) {
          if (v(x, y) !== 1 || Z.sala[y * W + x] !== si) continue;
          const pared = !v(x - 1, y) + !v(x + 1, y) + !v(x, y - 1) + !v(x, y + 1);
          let puerta = false;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (v(x + dx, y + dy) === 2) puerta = true;
          if (puerta) continue;
          l.push({ x, y, pared });
        }
      return l;
    };
    const lista = DECO[es];
    d.salas.forEach((s, si) => {
      if (s.tipo === "jefe" && es === "cripta") return;
      // los pozos de lava de las salas de brasas (no en la entrada, el tesoro ni el jefe), antes de lo demás
      if (es === "brasas" && (s.tipo === "sala" || s.tipo === "oscura") && s.w >= 4 && s.h >= 3) {
        const m = 1 + Math.floor(r() * 2);
        for (let k = 0, puestos = 0; k < 12 && puestos < m; k++) {
          const rx = 130 + r() * 120,
            ry = 80 + r() * 55,
            lx = X(s.x) + rx + 40 + r() * Math.max(1, s.w * C - 2 * rx - 80),
            ly = Y(s.y) + ry + 40 + r() * Math.max(1, s.h * C - 2 * ry - 80);
          // nunca en el medio de la sala (el camino entre las puertas) ni encima de lo puesto
          if (Math.abs(lx - X(s.x + s.w / 2)) < 200 && Math.abs(ly - Y(s.y + s.h / 2)) < 150) continue;
          if (!libre(lx, ly, rx)) continue;
          ocupado.push([lx, ly, rx + 40]);
          puestos++;
          Z.lavas.push({ x: lx, y: ly, rx, ry, sem: r() });
          Z.lucesDeco.push({ x: lx, y: ly - 20, r: rx * 2.6, col: "#FF8D71", f: 0.8, lava: true });
        }
      }
      const cs = celdas(s, si);
      const n = Math.round(cs.length * (s.tipo === "entrada" ? 0.12 : s.tipo === "jefe" ? 0.18 : 0.3));
      const bordes = cs.filter((q) => q.pared > 0);
      for (let k = 0; k < n && bordes.length; k++) {
        const q = bordes.splice(Math.floor(r() * bordes.length), 1)[0],
          [id, , choca, op] = elegir(lista.filter((e) => e[1] > 0)),
          // pegado a la pared que tiene (no en el medio de la celda)
          px = X(q.x) + C / 2 + (!v(q.x - 1, q.y) ? -50 : !v(q.x + 1, q.y) ? 50 : (r() - 0.5) * 80),
          py = Y(q.y) + C / 2 + (!v(q.x, q.y - 1) ? -40 : !v(q.x, q.y + 1) ? 50 : (r() - 0.5) * 60);
        const s0 = 0.8 + r() * 0.5,
          rr = (choca ? 60 : 40) * s0;
        if (!libre(px, py, rr)) continue;
        ocupado.push([px, py, rr + 40]);
        const o = Object.assign({ estilo: es, sem: Math.floor(r() * 999), giro: Math.floor(r() * 8) * 45 }, op || {});
        const cosa = { id, x: px, y: py, r: rr, s: s0, o };
        (choca ? Z.obst : Z.deco).push(cosa);
        const luz = LUZ_DE[id] && (typeof LUZ_DE[id] === "string" ? LUZ_DE[id] : LUZ_DE[id][o.col]);
        if (luz) Z.lucesDeco.push({ x: px, y: py - 60, r: id === "cristalCueva" ? 420 : 300, col: luz, f: 0.7 });
      }
    });
    // los derrumbes: salas comunes donde el techo se viene abajo al entrar
    const comunes = d.salas.map((s, si) => [s, si]).filter(([s]) => (s.tipo === "sala" || s.tipo === "oscura") && s.w * s.h >= 16);
    for (let k = 0; k < (DERRUMBE[es] || 0) && comunes.length; k++) Z.derrumbes.push({ si: comunes.splice(Math.floor(r() * comunes.length), 1)[0][1], hecho: false });
    // la fuente rúnica: en una sala común o la del tesoro, una por mazmorra
    const paraFuente = d.salas.map((s, si) => [s, si]).filter(([s]) => (s.tipo === "sala" || s.tipo === "tesoro") && s.w >= 5 && s.h >= 4);
    if (paraFuente.length) {
      const [s, si] = paraFuente[Math.floor(r() * paraFuente.length)];
      for (let k = 0; k < 20; k++) {
        const fx = X(s.x + 1.5 + r() * (s.w - 3)),
          fy = Y(s.y + 1.5 + r() * (s.h - 3));
        if (!libre(fx, fy, 140)) continue;
        ocupado.push([fx, fy, 180]);
        const f = { id: "fuenteRunica", x: fx, y: fy, r: 100, s: 1, o: { estilo: es }, k: Z.id + "_fu" + si, fuente: true };
        Z.obst.push(f);
        Z.fuentes.push(f);
        break;
      }
    }
    // las paredes agrietadas: una pared que da a una sala, con un hueco escondido detrás (hasta dos por mazmorra)
    const cands = [];
    for (let y = 3; y < d.alto - 2; y++)
      for (let x = 2; x < W - 2; x++) {
        if (v(x, y) || v(x, y + 1) !== 1) continue;
        const si = Z.sala[(y + 1) * W + x];
        if (si < 0 || d.salas[si].tipo === "jefe" || d.salas[si].tipo === "entrada") continue;
        // detrás: el hueco y todo lo de alrededor es roca
        let roca = true;
        for (let dy = -2; dy <= 0 && roca; dy++) for (let dx = -1; dx <= 1; dx++) if (v(x + dx, y - 1 + dy)) roca = false;
        if (roca && !v(x - 1, y) && !v(x + 1, y)) cands.push({ x, y });
      }
    for (let k = 0; k < 2 && cands.length; k++) {
      const q = cands.splice(Math.floor(r() * cands.length), 1)[0];
      if (Z.grietas.some((g0) => Math.abs(g0.x - q.x) + Math.abs(g0.y - q.y) < 8)) continue;
      Z.grietas.push({ x: q.x, y: q.y, k: Z.id + "_g" + q.x + "_" + q.y, abierta: false });
    }
    // lo que quedó parado donde ahora hay roca (las salas que perdieron esquinas) se corre al medio de su sala
    Z.enemigos.forEach((e) => {
      const cx = Math.floor((e.x - Z.x0) / C),
        cy = Math.floor((e.y - Z.y0) / C);
      if (v(cx, cy) && v(Math.floor((e.x + 50 - Z.x0) / C), cy) && v(Math.floor((e.x - 50 - Z.x0) / C), cy)) return;
      const s = d.salas[Z.sala[cy * W + cx]] || d.salas.find((q) => cx >= q.x - 1 && cx <= q.x + q.w && cy >= q.y - 1 && cy <= q.y + q.h);
      if (!s) return;
      e.x = X(s.x + s.w / 2) + (r() - 0.5) * 120;
      e.y = Y(s.y + s.h / 2) + (r() - 0.5) * 80;
      if (e.casa) e.casa = [e.x, e.y];
    });
  }

  // romper una pared: la celda de la pared y el hueco de atrás pasan a ser pasillo, y aparece el cofre
  function abrirGrieta(Z, gr, quieto) {
    if (gr.abierta) return;
    gr.abierta = true;
    const W = Z.d.ancho;
    Z.g[gr.y * W + gr.x] = 2;
    Z.g[(gr.y - 1) * W + gr.x] = 2;
    const cx = Z.x0 + gr.x * C + C / 2,
      cy = Z.y0 + (gr.y - 1) * C + C / 2;
    Z.cofres.push({ x: cx, y: cy, k: gr.k + "_c", rico: false });
    if (quieto) return;
    st.grietas[gr.k] = true;
    J.sacudir(0.35);
    if (window.SONIDO) SONIDO.tocar("golpe", { vol: 0.9, tono: 0.6, x: cx, y: cy + C });
    for (let i = 0; i < 30; i++) J.fx.push({ x: cx + (Math.random() - 0.5) * 180, y: cy + C - Math.random() * 120, vx: (Math.random() - 0.5) * 220, vy: -60 - Math.random() * 200, t: 0.6 + Math.random() * 0.4, c: Math.random() < 0.5 ? "rgba(150,130,110,0.6)" : PARED[Z.estilo][1], s: 5 + Math.random() * 8, g: 0.4 });
    HUD.aviso(t("mz.grieta_rota"), "#9A6BD8");
    if (window.ANIMA) ANIMA.gesto("botin");
  }
  function beber(Z, f) {
    st.fuentes[f.k] = true;
    jug.hp = jug.hpMax;
    if (jug.staMax) jug.sta = jug.staMax;
    HUD.aviso(t("mz.fuente_bebiste"), "#73D5DB");
    if (window.ANIMA) ANIMA.gesto("alivio");
    if (window.VIDA && VIDA.evento) VIDA.evento("sanar", f.x, f.y);
  }

  // ---------- lo que pasa mientras Eromash está adentro ----------
  const tope = () => Math.max(35, Math.round(jug.hpMax * 0.35));
  let quemado = 0;
  function actualizar(Z, dt) {
    const d = Z.d,
      W = d.ancho,
      cx = Math.floor((jug.x - Z.x0) / C),
      cy = Math.floor((jug.y - Z.y0) / C),
      si = cx >= 0 && cy >= 0 && cx < W && cy < d.alto ? Z.sala[cy * W + cx] : -1;
    // el derrumbe empieza cuando Eromash entra a su sala: piedras que caen cerca, una tras otra, con su aviso
    for (const dr of Z.derrumbes) {
      if (dr.hecho || dr.si !== si) continue;
      const s = d.salas[si];
      if (cx <= s.x || cx >= s.x + s.w - 1 || cy <= s.y || cy >= s.y + s.h - 1) continue;
      dr.hecho = true;
      HUD.aviso(t("mz.derrumbe"), "#E0B2B2");
      J.sacudir(0.25);
      if (window.SONIDO) SONIDO.tocar("crujido", { vol: 0.8, tono: 0.5 });
      for (let k = 0; k < 7; k++)
        J.retrasar(0.5 + k * 0.38, () => {
          // cae cerca de donde está Eromash, en un lugar libre de la sala
          for (let n = 0; n < 8; n++) {
            const x = jug.x + (Math.random() - 0.5) * (k < 2 ? 160 : 520),
              y = jug.y + (Math.random() - 0.5) * (k < 2 ? 110 : 360);
            if (!Z.libre(x, y, 30)) continue;
            const a = { forma: "circulo", x, y, dur: 1.15, t: 0, radio: 105 };
            J.avisos.push(a);
            Z.caidas.push({ x, y, t: 0, a });
            break;
          }
        });
    }
    for (const q of Z.caidas) {
      q.t += dt;
      if (q.t >= q.a.dur && !q.pego) {
        q.pego = true;
        J.quitarAviso(q.a);
        if (CB.contiene(q.a, jug.x, jug.y)) J.herir(Math.min(Math.round(jug.hpMax * 0.16) + 6, tope()), q.x, q.y - 40);
        J.sacudir(0.18);
        if (window.SONIDO) SONIDO.tocar("golpe", { vol: 0.6, tono: 0.5 + Math.random() * 0.2, x: q.x, y: q.y });
        for (let i = 0; i < 14; i++) J.fx.push({ x: q.x + (Math.random() - 0.5) * 60, y: q.y - Math.random() * 20, vx: (Math.random() - 0.5) * 260, vy: -80 - Math.random() * 180, t: 0.5 + Math.random() * 0.3, c: Math.random() < 0.5 ? "rgba(150,130,110,0.6)" : PARED[Z.estilo][1], s: 4 + Math.random() * 6, g: 0.45 });
        Z.restos.push({ x: q.x, y: q.y, sem: Math.random() });
      }
    }
    Z.caidas = Z.caidas.filter((q) => q.t < q.a.dur + 0.1);
    // la lava quema al pisarla (saltar la cruza: J.herir no pega en el aire)
    quemado = Math.max(0, quemado - dt);
    if (!quemado && Z.lavas.some((l) => ((jug.x - l.x) / l.rx) ** 2 + ((jug.y - l.y) / l.ry) ** 2 < 0.85)) {
      quemado = 0.45;
      J.herir(Math.min(Math.round(jug.hpMax * 0.06) + 2, tope()), jug.x, jug.y + 30, "fuego");
    }
  }
  function cercanos(Z, dar) {
    const cerca = (x, y, r) => Math.hypot(x - jug.x, y - jug.y) < r;
    for (const gr of Z.grietas) {
      const x = Z.x0 + gr.x * C + C / 2,
        y = Z.y0 + gr.y * C + C;
      if (!gr.abierta && cerca(x, y + 40, 210)) dar(25, t("mz.accion_grieta"), () => abrirGrieta(Z, gr), x, y - 160);
    }
    for (const f of Z.fuentes) if (!st.fuentes[f.k] && cerca(f.x, f.y, 220)) dar(25, t("mz.accion_fuente"), () => beber(Z, f), f.x, f.y - 220);
  }

  // ---------- dibujar: piso y paredes ----------
  function piso(c, Z, cx, cy, X, Y, tipo, v) {
    const es = Z.estilo,
      col = PISO[es],
      h0 = hash(cx, cy),
      g = (x, y) => (x < 0 || y < 0 || x >= Z.d.ancho || y >= Z.d.alto ? 0 : Z.g[y * Z.d.ancho + x]);
    // las salas especiales tiñen apenas su piso
    const tinte = tipo === "tesoro" ? "rgba(255,217,138,0.05)" : tipo === "jefe" ? "rgba(200,64,45,0.05)" : null;
    if (es === "cripta") {
      const cc = { entrada: ["#3A3430", "#36302C"], sala: ["#2E2A27", "#2A2623"], oscura: ["#262220", "#221E1C"], tesoro: ["#3A3226", "#342C22"], jefe: ["#2A2426", "#262022"] }[tipo] || ["#24201E", "#201C1A"];
      R(c, X, Y, C + 1, C + 1, cc[0]);
      for (let k = 0; k < 4; k++) {
        const lx = X + (k % 2) * 100,
          ly = Y + Math.floor(k / 2) * 100,
          h1 = hash(cx * 2 + (k % 2), cy * 2 + (k >> 1));
        R(c, lx + 4, ly + 4, 92, 92, h1 < 0.5 ? cc[0] : cc[1]);
        if (h1 > 0.86) L(c, lx + 20, ly + 30, lx + 60 + h1 * 20, ly + 70, "#1A1614", 3);
        if (h1 < 0.06 && tipo !== "jefe") alfa(c, 0.5, () => E(c, lx + 50, ly + 60, 26, 9, "#3E4A2E"));
      }
    } else if (es === "cueva" || es === "raices") {
      R(c, X, Y, C + 1, C + 1, col[0]);
      // piedras planas de borde quebrado, cada una con su tono
      for (let k = 0; k < 5; k++) {
        const px = X + 20 + hash(cx * 5 + k, cy) * 160,
          py = Y + 20 + hash(cx, cy * 5 + k) * 160,
          rr = 22 + hash(cx + k, cy - k) * 34,
          n = 6;
        const pts = [];
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU + k,
            q = rr * (0.75 + hash(cx * 9 + i, cy * 7 + k) * 0.4);
          pts.push(px + Math.cos(a) * q, py + Math.sin(a) * q * 0.75);
        }
        P(c, pts, k % 2 ? col[1] : es === "raices" ? "#2A2620" : "#302D29");
      }
      if (es === "raices") {
        // musgo y raíces finas que cruzan el piso
        if (h0 < 0.45) alfa(c, 0.6, () => E(c, X + 60 + h0 * 100, Y + 90, 70, 26, "#2E3A24"));
        if (h0 > 0.55) {
          c.lineWidth = 6;
          c.strokeStyle = "#3A2818";
          c.beginPath();
          c.moveTo(X, Y + h0 * C);
          c.quadraticCurveTo(X + 100, Y + 40 + hash(cy, cx) * 120, X + C, Y + hash(cx + 1, cy) * C);
          c.stroke();
        }
      } else if (h0 < 0.09) {
        // un charco con su brillo
        alfa(c, 0.85, () => E(c, X + 100, Y + 110, 60, 22, "#1E2A30"));
        alfa(c, 0.4, () => E(c, X + 116, Y + 104, 24, 5, "#9CC4D8"));
      }
    } else if (es === "mina") {
      R(c, X, Y, C + 1, C + 1, col[0]);
      for (let k = 0; k < 7; k++) alfa(c, 0.6, () => E(c, X + hash(cx * 7 + k, cy) * C, Y + hash(cx, cy * 7 + k) * C, 6 + hash(k, cx) * 8, 4, k % 2 ? "#4A3E32" : "#241C16"));
      // los rieles por los pasillos (y las tablas cruzadas)
      if (v === 2) {
        const horiz = g(cx - 1, cy) === 2 || g(cx + 1, cy) === 2,
          vert = g(cx, cy - 1) === 2 || g(cx, cy + 1) === 2;
        if (horiz) {
          for (let k = 0; k < 5; k++) R(c, X + 10 + k * 40, Y + 70, 18, 60, "#4A3020");
          R(c, X, Y + 80, C + 1, 7, "#5A5450");
          R(c, X, Y + 114, C + 1, 7, "#5A5450");
        } else if (vert) {
          for (let k = 0; k < 5; k++) R(c, X + 70, Y + 10 + k * 40, 60, 18, "#4A3020");
          R(c, X + 80, Y, 7, C + 1, "#5A5450");
          R(c, X + 114, Y, 7, C + 1, "#5A5450");
        }
      } else if (h0 < 0.2) {
        // una tabla suelta
        P(c, [X + 40, Y + 60, X + 150, Y + 50, X + 152, Y + 72, X + 42, Y + 82], "#4A3020");
      }
    } else if (es === "hielo") {
      R(c, X, Y, C + 1, C + 1, h0 < 0.5 ? col[0] : col[1]);
      // el brillo en diagonal y las grietas blancas
      alfa(c, 0.18, () => P(c, [X + 30 + h0 * 60, Y + C, X + 70 + h0 * 60, Y + C, X + 150 + h0 * 40, Y, X + 110 + h0 * 40, Y], "#C8F2F4"));
      if (h0 > 0.7) {
        c.lineWidth = 2;
        c.strokeStyle = "rgba(242,236,236,0.45)";
        c.beginPath();
        c.moveTo(X + 30, Y + 40 + h0 * 60);
        c.lineTo(X + 90, Y + 90);
        c.lineTo(X + 80, Y + 150);
        c.moveTo(X + 90, Y + 90);
        c.lineTo(X + 170, Y + 110);
        c.stroke();
      }
      // la nieve que se junta contra la pared de arriba
      if (!g(cx, cy - 1)) alfa(c, 0.5, () => P(c, [X, Y, X + C, Y, X + C, Y + 26 + hash(cx + 3, cy) * 20, X + 100, Y + 40, X, Y + 20 + h0 * 20], "#C8D8E0"));
    } else if (es === "brasas") {
      R(c, X, Y, C + 1, C + 1, col[2]);
      // losas de basalto de seis lados
      for (let k = 0; k < 4; k++) {
        const px = X + 50 + (k % 2) * 100 + (cy % 2 ? 0 : 0),
          py = Y + 50 + (k >> 1) * 100,
          h1 = hash(cx * 2 + (k % 2), cy * 2 + (k >> 1));
        const pts = [];
        for (let i = 0; i < 6; i++) pts.push(px + Math.cos((i / 6) * TAU) * 46, py + Math.sin((i / 6) * TAU) * 40);
        P(c, pts, h1 < 0.5 ? col[0] : col[1]);
        // una grieta encendida entre losas
        if (h1 > 0.82) {
          const f = 0.5 + 0.5 * Math.sin(J.t * 2 + h1 * 9);
          alfa(c, 0.5 + f * 0.4, () => L(c, px - 40, py + 20, px + 30, py - 10, "#C8402D", 4));
          alfa(c, 0.3 + f * 0.4, () => L(c, px - 40, py + 20, px + 30, py - 10, "#FF8D71", 2));
        }
      }
    }
    // cascotes junto a las paredes (en todos los estilos): más piedras sueltas
    if (!g(cx, cy - 1) || !g(cx - 1, cy) || !g(cx + 1, cy)) {
      const pc = PARED[es];
      for (let k = 0; k < 4; k++) {
        const hx = hash(cx * 11 + k, cy * 3),
          hy = hash(cx * 3, cy * 11 + k);
        const px = !g(cx - 1, cy) && k < 2 ? X + 10 + hx * 40 : !g(cx + 1, cy) && k < 2 ? X + C - 50 + hx * 40 : X + 20 + hx * 160,
          py = !g(cx, cy - 1) && k >= 2 ? Y + 8 + hy * 30 : Y + 30 + hy * 140;
        if (hx < 0.35) continue;
        P(c, [px, py, px + 14, py - 8, px + 26, py - 2, px + 22, py + 9, px + 6, py + 10], k % 2 ? pc[1] : pc[0]);
      }
    }
    // huesos en las criptas y las cuevas
    if ((es === "cripta" || es === "cueva" || es === "raices") && h0 > 0.93 && tipo !== "entrada") {
      L(c, X + 60, Y + 120, X + 120, Y + 100, "#C8BCA8", 6);
      E(c, X + 58, Y + 121, 7, 6, "#D8CCBA");
      E(c, X + 122, Y + 99, 7, 6, "#D8CCBA");
      if (h0 > 0.97) {
        E(c, X + 140, Y + 130, 16, 13, "#D8CCBA");
        E(c, X + 135, Y + 130, 4, 4, "#1A1614");
        E(c, X + 146, Y + 130, 4, 4, "#1A1614");
      }
    }
    if (tinte) R(c, X, Y, C + 1, C + 1, tinte);
  }
  // lo que va pintado encima del piso: la lava, los cascotes de los derrumbes
  function sobrePiso(c, Z, x0, y0, x1, y1) {
    for (const l of Z.lavas) {
      if (l.x + l.rx < x0 || l.x - l.rx > x1 || l.y + l.ry < y0 || l.y - l.ry > y1) continue;
      const f = 0.5 + 0.5 * Math.sin(J.t * 1.6 + l.sem * 9),
        cerca = Math.hypot((jug.x - l.x) / l.rx, (jug.y - l.y) / l.ry) < 1.6;
      // la costra de afuera, la lava y lo más caliente que se mueve
      E(c, l.x, l.y, l.rx + 22, l.ry + 16, "#2A0806");
      E(c, l.x, l.y, l.rx, l.ry, "#9C2315");
      E(c, l.x + Math.sin(J.t * 0.7 + l.sem * 5) * l.rx * 0.15, l.y, l.rx * 0.8, l.ry * 0.7, "#C8402D");
      for (let k = 0; k < 5; k++) {
        const a = l.sem * 20 + k * 1.3 + J.t * 0.15,
          px = l.x + Math.cos(a) * l.rx * 0.5,
          py = l.y + Math.sin(a * 1.3) * l.ry * 0.45;
        alfa(c, 0.5 + 0.4 * f, () => E(c, px, py, 26 + 10 * f, 9 + 3 * f, "#FF8D71"));
        alfa(c, 0.4 * f, () => E(c, px, py, 10, 4, "#FFD98A"));
      }
      // el borde se enciende cuando Eromash se acerca: el aviso exacto de dónde quema
      if (cerca) {
        c.lineWidth = 4;
        c.strokeStyle = "rgba(255,141,113," + (0.4 + 0.3 * f) + ")";
        c.beginPath();
        c.ellipse(l.x, l.y, l.rx * Math.sqrt(0.85), l.ry * Math.sqrt(0.85), 0, 0, TAU);
        c.stroke();
      }
    }
    const pc = PARED[Z.estilo];
    for (const q of Z.restos)
      for (let k = 0; k < 5; k++) {
        const a = q.sem * 30 + k * 1.7,
          d = 10 + k * 14,
          px = q.x + Math.cos(a) * d,
          py = q.y + Math.sin(a) * d * 0.6;
        P(c, [px - 12, py, px - 4, py - 10, px + 12, py - 6, px + 10, py + 6, px - 6, py + 8], k % 2 ? pc[1] : pc[0]);
      }
  }
  // una celda de pared: el bloque de arriba, su canto y (si da a una sala) su cara con el dibujo de cada estilo
  function pared(c, Z, cx, cy, X, Y, cara, cantoArriba) {
    const es = Z.estilo,
      pc = PARED[es],
      h0 = hash(cx, cy);
    R(c, X - 1, Y - H, C + 2, C + 1, h0 < 0.5 ? pc[4] : pc[4]);
    if (cantoArriba) R(c, X - 1, Y - H, C + 2, 7, pc[3]);
    if (!cara) return;
    const y0 = Y + C - H;
    R(c, X - 1, y0, C + 2, H, pc[0]);
    if (es === "cripta") {
      for (let f = 0; f < 3; f++) {
        const yy = y0 + f * 50;
        R(c, X - 1, yy, C + 2, 3, pc[2]);
        for (let k = 0; k < 3; k++) {
          const xx = X + ((k + (f % 2) * 0.5) * C) / 3;
          R(c, xx, yy, 3, 50, pc[2]);
          if (hash(cx * 3 + k, cy * 5 + f) > 0.7) R(c, xx + 6, yy + 6, C / 3 - 12, 40, pc[1]);
        }
      }
    } else if (es === "cueva" || es === "hielo") {
      // vetas de roca (o bloques de hielo) quebradas a lo ancho
      for (let f = 0; f < 3; f++) {
        const a = y0 + 20 + f * 44 + hash(cx, f) * 10,
          b = a + 16 + hash(cx + 7, f) * 14;
        P(c, [X - 1, a, X + 70, a - 8 + hash(cx, cy + f) * 16, X + 140, a + 4, X + C + 1, a - 4, X + C + 1, b, X + 120, b + 6, X + 50, b - 4, X - 1, b + 4], f % 2 ? pc[1] : pc[2]);
      }
      if (es === "hielo") alfa(c, 0.35, () => P(c, [X + 30, y0 + H, X + 50, y0 + H, X + 110, y0, X + 90, y0], "#F2ECEC"));
      // las estalactitas (o carámbanos) que cuelgan del borde de arriba
      const n = 2 + Math.floor(h0 * 3);
      for (let k = 0; k < n; k++) {
        const px = X + 20 + hash(cx * 4 + k, cy) * 160,
          l = 30 + hash(cx, cy * 4 + k) * (es === "hielo" ? 70 : 60),
          w = es === "hielo" ? 7 + hash(k, cx) * 6 : 10 + hash(k, cx) * 10;
        P(c, [px - w, y0 - 2, px + w, y0 - 2, px + 1, y0 + l], es === "hielo" ? "#C8F2F4" : pc[1]);
        P(c, [px - w, y0 - 2, px, y0 - 2, px + 1, y0 + l], es === "hielo" ? "#9CC4D8" : pc[2]);
      }
    } else if (es === "mina") {
      // roca con vetas y el entibado: postes en los bordes de la celda y la viga arriba
      for (let f = 0; f < 4; f++) alfa(c, 0.7, () => E(c, X + hash(cx * 3 + f, cy) * C, y0 + 30 + hash(cx, cy * 3 + f) * 100, 18, 7, f % 3 ? pc[1] : "#6E5E3A"));
      if (cx % 2 === 0) {
        R(c, X + 4, y0, 22, H, "#4A3020");
        R(c, X + 4, y0, 8, H, "#3A2414");
        R(c, X - 1, y0, C + 2, 20, "#5A3A22");
        R(c, X - 1, y0 + 16, C + 2, 4, "#3A2414");
      }
    } else if (es === "raices") {
      for (let f = 0; f < 3; f++) R(c, X - 1, y0 + 30 + f * 42, C + 2, 3, pc[2]);
      // el musgo del borde y las raíces que cuelgan
      P(c, [X - 1, y0, X + C + 1, y0, X + C + 1, y0 + 10, X + 140, y0 + 18, X + 60, y0 + 12, X - 1, y0 + 16], "#2E3A24");
      const n = 1 + Math.floor(h0 * 3);
      for (let k = 0; k < n; k++) {
        const px = X + 20 + hash(cx * 4 + k, cy) * 160,
          l = 60 + hash(cx, cy * 4 + k) * 80;
        c.lineWidth = 7;
        c.strokeStyle = "#4A3020";
        c.beginPath();
        c.moveTo(px, y0);
        c.quadraticCurveTo(px + 20, y0 + l * 0.5, px - 6, y0 + l);
        c.stroke();
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(px + 2, y0 + l * 0.4);
        c.quadraticCurveTo(px + 26, y0 + l * 0.6, px + 18, y0 + l * 0.9);
        c.stroke();
      }
    } else if (es === "brasas") {
      // columnas de basalto y la luz de abajo
      for (let k = 0; k < 5; k++) R(c, X + k * 40, y0, 38, H, k % 2 ? pc[1] : pc[0]);
      for (let k = 0; k < 5; k++) R(c, X + k * 40 + 36, y0, 3, H, pc[2]);
      const f = 0.5 + 0.5 * Math.sin(J.t * 1.8 + cx);
      if (h0 > 0.6) alfa(c, 0.35 + f * 0.3, () => L(c, X + 40 + h0 * 100, y0 + H, X + 30 + h0 * 100, y0 + H * 0.4, "#C8402D", 4));
      alfa(c, 0.18 + f * 0.1, () => R(c, X - 1, y0 + H - 20, C + 2, 20, "#C8402D"));
    }
    R(c, X - 1, Y + C - 8, C + 2, 8, "#1E1A18");
    // la pared agrietada: grietas y un brillo violeta apenas (algo hay detrás)
    const gr = Z.grietas.find((q) => q.x === cx && q.y === cy && !q.abierta);
    if (gr) {
      const f = 0.5 + 0.5 * Math.sin(J.t * 1.5 + cx);
      c.lineWidth = 4;
      c.strokeStyle = "#0C0A09";
      c.beginPath();
      c.moveTo(X + 100, y0 + 10);
      c.lineTo(X + 80, y0 + 50);
      c.lineTo(X + 110, y0 + 80);
      c.lineTo(X + 90, y0 + 130);
      c.moveTo(X + 80, y0 + 50);
      c.lineTo(X + 40, y0 + 70);
      c.moveTo(X + 110, y0 + 80);
      c.lineTo(X + 160, y0 + 96);
      c.stroke();
      alfa(c, 0.25 + 0.25 * f, () => {
        c.lineWidth = 2;
        c.strokeStyle = "#9A6BD8";
        c.stroke();
      });
    }
  }
  // lo que hay en las salas y las piedras que caen, para la lista de objetos del cuadro
  function objetos(lista, c, Z, visible) {
    Z.deco.forEach((o) => visible(o.x, o.y) && lista.push({ x: o.x, y: o.y, f: () => ASSETS.dibujar(c, o.id, o.x, o.y, J.t, Object.assign({ s: o.s }, o.o)) }));
    for (const q of Z.caidas) {
      const falta = q.a.dur - q.t;
      if (falta > 0.45 || falta < 0) continue;
      const z = (falta / 0.45) ** 2 * 900;
      lista.push({ x: q.x, y: q.y, f: () => ASSETS.dibujar(c, "estalactita", q.x, q.y, J.t, { z, estilo: Z.estilo, s: 0.9 }) });
    }
  }
  function luces(Z, dar) {
    Z.lucesDeco.forEach((l) => dar(l.lava ? Object.assign({}, l, { f: l.f + Math.sin(J.t * 1.6 + l.x) * 0.08 }) : l));
    Z.fuentes.forEach((f) => !st.fuentes[f.k] && dar({ x: f.x, y: f.y - 80, r: 380, col: "#73D5DB", f: 0.75 }));
    Z.grietas.forEach((g) => !g.abierta && dar({ x: Z.x0 + g.x * C + C / 2, y: Z.y0 + g.y * C + C - 60, r: 160, col: "#9A6BD8", f: 0.4 }));
  }

  // ---------- el aire: goteo, polvo, murciélagos, escarcha, esporas y brasas ----------
  function celdasVistas(Z, x0, y0, x1, y1, fn) {
    const d = Z.d,
      cx0 = Math.max(0, Math.floor((x0 - Z.x0) / C)),
      cx1 = Math.min(d.ancho - 1, Math.floor((x1 - Z.x0) / C)),
      cy0 = Math.max(0, Math.floor((y0 - Z.y0) / C)),
      cy1 = Math.min(d.alto - 1, Math.floor((y1 - Z.y0) / C));
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) if (Z.g[cy * d.ancho + cx]) fn(cx, cy, Z.x0 + cx * C, Z.y0 + cy * C);
  }
  function aire(c, Z, x0, y0, x1, y1) {
    const q = nivel();
    if (q === "baja") return;
    const media = q === "media",
      es = Z.estilo,
      T = J.t;
    // el goteo: de una estalactita invisible del techo cae una gota y abre un anillo en el piso
    if (es === "cueva" || es === "hielo" || es === "mina" || es === "raices")
      celdasVistas(Z, x0, y0, x1, y1, (cx, cy, X, Y) => {
        const h = hash(cx * 3 + 1, cy * 5 + 2);
        if (h < (media ? 0.9 : 0.8)) return;
        const per = 2.2 + h * 2,
          f = ((T + h * 17) % per) / per,
          px = X + 40 + hash(cy, cx) * 120,
          py = Y + 40 + hash(cx + 2, cy) * 120;
        if (f < 0.25) alfa(c, 0.7, () => R(c, px - 2, py - 260 + (f / 0.25) * 260, 4, 12, es === "hielo" ? "#C8F2F4" : "#9CC4D8"));
        else if (f < 0.5) {
          const k = (f - 0.25) / 0.25;
          c.lineWidth = 2;
          c.strokeStyle = "rgba(156,196,216," + (0.6 * (1 - k)) + ")";
          c.beginPath();
          c.ellipse(px, py, 6 + k * 26, 2 + k * 9, 0, 0, TAU);
          c.stroke();
        }
      });
    // el polvo que flota en la luz de la lámpara (motas cuadradas que derivan)
    if (es === "mina" || es === "cripta" || es === "cueva") {
      const n = media ? 10 : 22;
      for (let i = 0; i < n; i++) {
        const a = hash(i, 7),
          px = jug.x + Math.sin(T * 0.2 + a * 40) * 300 + (a - 0.5) * 200,
          py = jug.y - 60 + Math.cos(T * 0.17 + a * 30) * 200 + Math.sin(T * 0.9 + i) * 8,
          s = 3 + a * 3;
        alfa(c, 0.18 + 0.12 * Math.sin(T * 1.3 + i), () => R(c, px, py, s, s, "#E0B2B2"));
      }
    }
    // los murciélagos: cada tanto una bandada cruza la vista (en las cuevas y entre las raíces)
    if (es === "cueva" || es === "raices") {
      const per = 16,
        k = Math.floor(T / per),
        f = (T % per) / 4;
      if (f < 1) {
        const lado = hash(k, Z.x0) < 0.5 ? -1 : 1,
          y = jug.y - 300 + hash(k, 3) * 300;
        for (let i = 0; i < (media ? 3 : 6); i++) {
          const px = jug.x - lado * 1100 + lado * f * 2200 + (hash(i, k) - 0.5) * 200,
            py = y + (hash(k, i) - 0.5) * 160 + Math.sin(T * 6 + i) * 20,
            al = Math.sin(T * 22 + i * 2) * 12;
          P(c, [px, py, px - 22, py - 6 - al, px - 10, py + 2, px, py + 6, px + 10, py + 2, px + 22, py - 6 - al], "#141010");
        }
      }
    }
  }
  function sobreLuz(c, Z, x0, y0, x1, y1) {
    const q = nivel();
    if (q === "baja") return;
    const media = q === "media",
      es = Z.estilo,
      T = J.t;
    // la escarcha que destella en el piso
    if (es === "hielo")
      celdasVistas(Z, x0, y0, x1, y1, (cx, cy, X, Y) => {
        for (let k = 0; k < (media ? 1 : 2); k++) {
          const h = hash(cx * 7 + k, cy * 3),
            f = Math.max(0, Math.sin(T * 2 + h * 40));
          if (f < 0.85) continue;
          const px = X + hash(cx, cy * 7 + k) * C,
            py = Y + h * C,
            s = (f - 0.85) * 60;
          P(c, [px, py - s, px + s * 0.3, py, px, py + s, px - s * 0.3, py], "#F2ECEC");
        }
      });
    // las esporas que suben de los hongos
    if (es === "raices" || es === "cueva")
      Z.deco.forEach((o) => {
        if (o.id !== "hongosLuz" || o.x < x0 - 200 || o.x > x1 + 200 || o.y < y0 - 200 || o.y > y1 + 400) return;
        for (let i = 0; i < (media ? 3 : 6); i++) {
          const f = ((T * 0.25 + hash(i, o.x)) % 1),
            px = o.x + Math.sin(T + i * 2) * 30 + (hash(o.y, i) - 0.5) * 80,
            py = o.y - 40 - f * 260,
            a = f < 0.1 ? f / 0.1 : 1 - (f - 0.1) / 0.9;
          alfa(c, a * 0.8, () => R(c, px, py, 4, 4, "#7BC86C"));
        }
      });
    // las brasas que suben de la lava: rombos que giran y se achican
    if (es === "brasas")
      Z.lavas.forEach((l) => {
        if (l.x < x0 - 400 || l.x > x1 + 400 || l.y < y0 - 400 || l.y > y1 + 600) return;
        for (let i = 0; i < (media ? 4 : 9); i++) {
          const f = (T * 0.4 + hash(i, l.sem * 99)) % 1,
            px = l.x + (hash(i, l.x) - 0.5) * l.rx * 1.4 + Math.sin(T * 1.5 + i) * 14,
            py = l.y - f * 380,
            s = 9 * (1 - f),
            a = f < 0.08 ? f / 0.08 : 1 - Math.pow((f - 0.08) / 0.92, 1.6),
            g = T * 3 + i;
          alfa(c, a, () => P(c, [px + Math.cos(g) * s, py + Math.sin(g) * s, px - Math.sin(g) * s * 0.6, py + Math.cos(g) * s * 0.6, px - Math.cos(g) * s, py - Math.sin(g) * s, px + Math.sin(g) * s * 0.6, py - Math.cos(g) * s * 0.6], i % 3 ? "#FF8D71" : "#FFD98A"));
        }
      });
  }

  return {
    ESTILOS,
    AMB,
    estiloDe,
    iniciar: (api) => ((A = api), (J = A.J), (jug = A.jug), (CB = A.CB)),
    alEmpezar(zonas, estado) {
      st = estado;
      st.grietas = st.grietas || {};
      st.fuentes = st.fuentes || {};
      zonas.forEach((Z) => {
        if (!Z.grietas) return;
        Z.derrumbes.forEach((dr) => (dr.hecho = false));
        Z.grietas.forEach((gr) => st.grietas[gr.k] && abrirGrieta(Z, gr, true));
        Z.fuentes.forEach((f) => (f.o.usada = !!st.fuentes[f.k]));
      });
    },
    deformar,
    decorar,
    actualizar,
    cercanos,
    piso,
    sobrePiso,
    pared,
    objetos,
    luces,
    aire,
    sobreLuz,
    usada: (f) => !!(st && st.fuentes[f.k]),
  };
})();
