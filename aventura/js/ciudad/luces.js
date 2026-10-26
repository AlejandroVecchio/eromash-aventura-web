// ---------- la luz de la capital (módulo LUCES25) ----------
// Todo lo que alumbra en Eikholt y cómo se tiñe la ciudad según la hora:
// - las luces de noche (faroles a su hora, braseros, la forja que respira con el fuelle, la ventana de cada casa junto
//   a su puerta, el Hongo Dorado más vivo que el resto, las piedras y las raíces en azul rúnico, el candil de Eromash)
//   que se le pasan a la capa de oscuridad del bosque (LUZ);
// - el color de cada hora: el alba rosada y fría, el mediodía casi neutro, la tarde ámbar de siempre y la luna azul;
// - los reflejos de los faroles en el río, los rayos que se cuelan por la copa del Roble, el resplandor de la forja de
//   día y la bruma de lo lejano cuando se aleja la vista.
// Calidad gráfica: alta = todo · media = sin rayos del Roble ni reflejos, bruma más liviana · baja = solo el color de
// la hora (plano, sin degradé) y la capa de LUZ en su versión plana.
//   LUCES25.armar(plano) · faroleros() → las rondas de los faroleros · dondeFarolero(ronda, h) → { x, y, vx, vy, prende } o null
//   LUCES25.dePantalla(cam, cw, ch, h, t, ero, mas) → luces en la pantalla para LUZ.dibujar (mas: las que se mueven)
//   LUCES25.antes(c, cam, cw, ch, h, t, noche)   (después de dibujar el mundo, antes de la noche)
//   LUCES25.despues(c, cam, cw, ch, h, t, noche, enVista)   (después de la capa de oscuridad)
window.LUCES25 = (function () {
  "use strict";
  const nivel = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  const ORO = "#FFD98A",
    BRASA = "#FF8D71",
    RUNA = "#73D5DB";
  const BALDE = 2000;
  let luces = [],
    baldes = new Map(),
    plano = null,
    forjas = [];

  // el punto del río más cercano (para saber si una luz se refleja y dónde)
  function alRio(x, y) {
    const pts = plano.rio.pts;
    let mejor = null,
      dm = Infinity;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i],
        [bx, by] = pts[i + 1];
      const vx = bx - ax,
        vy = by - ay,
        l2 = vx * vx + vy * vy || 1;
      const s = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / l2));
      const px = ax + vx * s,
        py = ay + vy * s,
        d = Math.hypot(x - px, y - py);
      if (d < dm) (dm = d), (mejor = [px, py]);
    }
    return { d: dm, p: mejor };
  }

  function armar(p) {
    plano = p;
    luces = [];
    forjas = [];
    const sumar = (l) => {
      // cada fuego tiembla a su ritmo (no todos juntos) y cada ventana respira apenas, como una vela
      const s = Math.abs(Math.round(l.x * 7 + l.y * 13));
      l.fase = (s % 628) / 100;
      l.ritmo = 5 + (s % 5);
      const rr = alRio(l.x, l.y);
      if (rr.d < plano.rio.ancho / 2 + 420) l.reflejo = rr.p;
      luces.push(l);
    };
    let nVentana = 0;
    for (const o of p.cosas) {
      const id = o.id || "",
        nom = o.nombre || "";
      // los faroles no se encienden todos juntos: cada uno tiene su hora entre las cinco y las siete de la tarde (el
      // farolero da la vuelta), y se apagan al alba de a uno
      const enc = 17 + (Math.abs(Math.round(o.x * 7 + o.y * 13)) % 100) / 60;
      if (/farol|Farol|posteHongo/.test(id)) sumar({ x: o.x, y: o.y, r: 420, col: ORO, f: 0.85, enc });
      else if (/chimeneaHerreria|forja/.test(id)) {
        sumar({ x: o.x, y: o.y, r: 900, col: BRASA, f: 1, fuego: true, forja: true });
        forjas.push(o);
      } else if (/brasero|fogon/.test(id)) sumar({ x: o.x, y: o.y, r: /fogon/.test(id) ? 900 : 520, col: ORO, f: /fogon/.test(id) ? 1 : 0.85, fuego: true });
      if (/^(piedraFundadores|piedraCaidos)/.test(id)) sumar({ x: o.x, y: o.y, r: 320, col: RUNA, f: 0.45, late: true });
      if (o.tipo !== "casa") continue;
      const v = o.casa;
      // la ventana de cada casa junto a su puerta (las largas, también en la otra punta del frente); las tapiadas a oscuras
      if (/^(casa|hongo|lindes|herreria|sanacion|hospederia|cuartel|carpinteria|curtiembre|cordeleria)/.test(nom) && !(v.ficha && v.ficha.tapiada)) {
        const co = Math.cos(o.ry),
          si = Math.sin(o.ry);
        const en = (u, w) => [o.x + u * co - w * si, o.y + u * si + w * co];
        const taberna = /^(hongo|hospederia)/.test(nom);
        const col = taberna || nVentana++ % 5 === 2 ? BRASA : ORO; // algún hogar con el fuego más bajo
        const pu = v.puertaLocal || [0, (v.D || 400) / 2 + 40];
        const [px, py] = en(pu[0], pu[1] + 60);
        if (taberna) {
          // el Hongo Dorado y la hospedería: la sala llena hasta tarde, más luz y un fuego que se mueve
          sumar({ x: px, y: py, r: 820, col: ORO, f: 0.75, enc: enc + 0.2, fuego: true });
          sumar({ x: o.x, y: o.y, r: 600, col: BRASA, f: 0.4, enc: enc + 0.2 });
        } else sumar({ x: px, y: py, r: 420, col, f: 0.5, enc: enc + 0.4, vela: true });
        if (v.W && v.W > 700 && !taberna) {
          const [qx, qy] = en(-Math.sign(pu[0] || 1) * v.W * 0.3, pu[1] + 40);
          sumar({ x: qx, y: qy, r: 340, col: ORO, f: 0.38, enc: enc + 0.9, vela: true });
        }
      }
      if (/^(puerta_|atalaya)/.test(nom)) sumar({ x: o.x, y: o.y, r: 700, col: ORO, f: 0.8, fuego: true });
      if (/^piedraCupula/.test(nom) && o.estado !== "apagada") sumar({ x: o.x, y: o.y, r: 600, col: RUNA, f: 0.6, parpadea: o.estado === "parpadea" });
      // las raíces del Roble con sus vetas azules, que laten despacio
      if (/^raiz/.test(nom)) sumar({ x: o.x, y: o.y, r: 420, col: RUNA, f: 0.32, late: true });
      if (o.id === "camaHongos") sumar({ x: o.x, y: o.y, r: 260, col: ORO, f: 0.35 });
      if (o.id === "ofrendaRoble") sumar({ x: o.x, y: o.y, r: 200, col: ORO, f: 0.6, fuego: true });
    }
    // los faroles colgados de la copa del Roble
    for (let i = 0; i < 6; i++) sumar({ x: Math.cos(i * 1.05) * 700, y: Math.sin(i * 1.05) * 500, r: 600, col: ORO, f: 0.7 });
    // la piedra del Ting y las piedras rúnicas de las puertas, en azul rúnico
    sumar({ x: p.ting[0], y: p.ting[1], r: 900, col: RUNA, f: 0.6, late: true });
    for (const k of ["sur", "norte", "este", "oeste"]) {
      const a = p.anclas["puerta_" + k];
      if (a) sumar({ x: a[0], y: a[1], r: 800, col: RUNA, f: 0.7 });
    }
    armarFaroleros();
    baldes = new Map();
    for (const l of luces) {
      const k = Math.floor(l.x / BALDE) + "," + Math.floor(l.y / BALDE);
      if (!baldes.has(k)) baldes.set(k, []);
      baldes.get(k).push(l);
    }
    return luces;
  }

  // ---------- los faroleros ----------
  // Los faroles de los tres anillos de la plaza los prende alguien de verdad: un farolero por anillo (dos en el de
  // afuera, uno para cada lado) sale de la punta sur a las 16:30, va farol por farol con su pértiga encendida y cada farol
  // se prende cuando llega (`enc`); al alba (desde las 4:30) hace la misma vuelta apagándolos (`apaga`). MUNDO25 los pone
  // en la gente con faroleros() y los mueve con dondeFarolero(r, h).
  const V_FAROL = 150, // unidades por segundo
    H_HORA = 40, // segundos reales por hora del juego (LUZ.DIA / 24)
    PAUSA = 0.06, // lo que tarda en cada farol (horas)
    SALE = 16.5,
    A0 = Math.PI / 2; // la punta sur
  let rondasFarol = [];
  function armarFaroleros() {
    rondasFarol = [];
    const fs = luces.filter((l) => l.enc && l.r === 420 && l.col === ORO && !l.vela).map((l) => ({ l, r: Math.hypot(l.x, l.y), a: Math.atan2(l.y, l.x) }));
    fs.sort((a, b) => a.r - b.r);
    const anillos = [];
    for (const f of fs) {
      if (f.r > 3200) break;
      const u = anillos[anillos.length - 1];
      if (u && f.r - u[u.length - 1].r < 120) u.push(f);
      else anillos.push([f]);
    }
    const rel = (a) => (((a - A0) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    for (const an of anillos) {
      if (an.length < 6) continue;
      const R = an.reduce((s, f) => s + f.r, 0) / an.length - 70;
      const lados = an.length > 16 ? [[1, an.filter((f) => rel(f.a) < Math.PI)], [-1, an.filter((f) => rel(f.a) >= Math.PI)]] : [[1, an]];
      for (const [dir, lista] of lados) {
        const orden = lista.map((f) => ({ f, d: dir > 0 ? rel(f.a) : Math.PI * 2 - rel(f.a) })).sort((a, b) => a.d - b.d);
        let h = SALE,
          antes = 0;
        const paradas = [];
        for (const { f, d } of orden) {
          h += ((d - antes) * R) / V_FAROL / H_HORA;
          antes = d;
          paradas.push({ a: A0 + dir * d, llega: h, sale: h + PAUSA });
          f.l.enc = h + PAUSA / 2;
          f.l.apaga = f.l.enc - 12;
          f.l.rapido = true;
          h += PAUSA;
        }
        rondasFarol.push({ R, dir, paradas, fin: h + 0.25 });
      }
    }
  }
  // dónde está el farolero de la ronda r a la hora h (null si no anda): { x, y, vx, vy, prende }
  function dondeFarolero(r, h) {
    const hh = h >= 12 ? h : h + 12,
      P = r.paradas;
    if (hh < SALE || hh > r.fin) return null;
    let a = A0,
      prende = false;
    if (hh < P[0].llega) a = A0 + ((hh - SALE) / (P[0].llega - SALE)) * (P[0].a - A0);
    else {
      let k = P.length - 1;
      for (let i = 0; i < P.length; i++)
        if (hh < P[i].sale) {
          k = i;
          break;
        }
      const p = P[k];
      if (hh >= p.llega && hh < p.sale) (a = p.a), (prende = true);
      else if (hh >= p.sale && k === P.length - 1) a = p.a + r.dir * ((hh - p.sale) * V_FAROL * H_HORA) / r.R;
      else {
        const q = P[k - 1] || { a: A0, sale: SALE };
        a = q.a + ((hh - q.sale) / (p.llega - q.sale)) * (p.a - q.a);
      }
    }
    return { x: Math.cos(a) * r.R, y: Math.sin(a) * r.R, vx: -Math.sin(a) * r.dir, vy: Math.cos(a) * r.dir, prende };
  }

  // cuánto alumbra cada luz en este momento
  function fuerza(l, h, t) {
    let f = l.f;
    if (l.fuego) f *= 0.88 + Math.sin(t * l.ritmo + l.fase) * 0.07 + Math.sin(t * 13.7 + l.fase * 3) * 0.04;
    if (l.forja) f *= 0.7 + 0.3 * Math.pow(0.5 + 0.5 * Math.sin(t * 1.6 + l.fase), 2); // el fuelle
    if (l.vela) f *= 0.94 + Math.sin(t * 1.7 + l.fase) * 0.06;
    if (l.late) f *= 0.65 + 0.35 * (0.5 + 0.5 * Math.sin(t * 0.9 + l.fase));
    if (l.rapido) f *= h >= 12 ? Math.max(0, Math.min(1, (h - l.enc) * 12)) : Math.max(0, Math.min(1, (l.apaga - h) * 12));
    else if (l.enc) f *= h >= 12 ? Math.max(0, Math.min(1, (h - l.enc) * 3)) : Math.max(0, Math.min(1, (l.enc - 11.5 - h) * 3));
    if (l.parpadea) f *= Math.sin(t * 2.3) + Math.sin(t * 7.1 + 1) * 0.6 > 0.7 ? 0.05 : 1;
    return f;
  }

  function dePantalla(cam, cw, ch, h, t, ero, mas) {
    const V = VISTA25.proyector(cam);
    const enVista = [];
    const poner = (l, f) => {
      const [vx, vy] = V(l.x, l.y);
      const sx = (vx - cam.x) * cam.esc + cw / 2,
        sy = (vy - cam.y) * cam.esc + ch / 2;
      const r = l.r * cam.esc * (l.forja ? 0.92 + f * 0.08 : 1);
      if (!(r > 1)) return;
      if (sx < -r || sy < -r || sx > cw + r || sy > ch + r) return;
      const e = { x: sx, y: sy, r, col: l.col, f, l };
      if (l.reflejo) {
        const [qx, qy] = V(l.reflejo[0], l.reflejo[1]);
        e.reflejo = [(qx - cam.x) * cam.esc + cw / 2, (qy - cam.y) * cam.esc + ch / 2];
      }
      enVista.push(e);
    };
    // solo las luces de los baldes que pueden alcanzar la pantalla (antes se proyectaban las seiscientas)
    const rx = cw / cam.esc / 2 + 1000,
      ry = ch / cam.esc / 2 / cam.k + 1000,
      R = Math.hypot(rx, ry);
    for (let by = Math.floor((cam.y - R) / BALDE); by <= Math.floor((cam.y + R) / BALDE); by++)
      for (let bx = Math.floor((cam.x - R) / BALDE); bx <= Math.floor((cam.x + R) / BALDE); bx++) {
        const lb = baldes.get(bx + "," + by);
        if (!lb) continue;
        for (const l of lb) {
          const f = fuerza(l, h, t);
          if (f > 0.01) poner(l, f);
        }
      }
    // el candil de Eromash: apenas un círculo tibio a su alrededor, para no perderlo en la noche
    if (ero) poner({ x: ero.x, y: ero.y, r: 300, col: ORO }, 0.42);
    // las que se mueven (las antorchas de la ronda): { x, y, r, col, f }
    if (mas) for (const l of mas) poner(l, l.f);
    return enVista;
  }

  // ---------- el color de cada hora ----------
  // hora, color de arriba a la izquierda, color de abajo a la derecha, fuerza de cada uno (soft-light). La tarde
  // (16 a 19) es la misma de antes: el primer respiro después del bosque frío
  const GRADOS = [
    [0, [74, 120, 208], [40, 60, 120], 0.42, 0.36],
    [4.6, [74, 120, 208], [40, 60, 120], 0.42, 0.36],
    [6, [224, 178, 178], [110, 140, 200], 0.42, 0.34],
    [8, [255, 217, 138], [224, 178, 178], 0.22, 0.16],
    [12.5, [255, 236, 210], [255, 217, 138], 0.13, 0.08],
    [15.5, [255, 217, 138], [255, 141, 113], 0.3, 0.19],
    [18, [255, 217, 138], [255, 141, 113], 0.45, 0.29],
    [19.6, [230, 160, 150], [90, 100, 180], 0.42, 0.32],
    [21.5, [74, 120, 208], [40, 60, 120], 0.42, 0.36],
    [24, [74, 120, 208], [40, 60, 120], 0.42, 0.36],
  ];
  const gradoCache = { clave: "", g: null };
  function grado(h) {
    let i = 0;
    while (i < GRADOS.length - 2 && GRADOS[i + 1][0] <= h) i++;
    const a = GRADOS[i],
      b = GRADOS[i + 1];
    const s = Math.max(0, Math.min(1, (h - a[0]) / (b[0] - a[0] || 1)));
    const mez = (p, q) => p.map((v, j) => Math.round(v + (q[j] - v) * s));
    return { c1: mez(a[1], b[1]), c2: mez(a[2], b[2]), f1: a[3] + (b[3] - a[3]) * s, f2: a[4] + (b[4] - a[4]) * s };
  }

  // de día y al atardecer: la bruma de lo lejano, los rayos del Roble, la forja y el color de la hora
  function antes(c, cam, cw, ch, h, t, noche) {
    const nv = nivel();
    c.setTransform(1, 0, 0, 1, 0, 0);
    const V = VISTA25.proyector(cam);
    const aPantalla = (x, y, z = 0) => {
      const [vx, vy] = V(x, y);
      return [(vx - cam.x) * cam.esc + cw / 2, (vy - cam.y) * cam.esc + ch / 2 - z * cam.esc];
    };
    // la bruma: lo de arriba de la pantalla queda más lejos; al alejar la vista se lava hacia el cielo del bosque
    const lejos = Math.max(0, Math.min(1, (0.3 - cam.esc) / 0.24)) * (nv === "alta" ? 1 : 0.6);
    if (lejos > 0.01 && nv !== "baja") {
      const col = noche > 0.5 ? "40,54,90" : "176,186,196";
      const g = c.createLinearGradient(0, 0, 0, ch * 0.7);
      g.addColorStop(0, "rgba(" + col + "," + (0.26 * lejos * (1.15 - cam.k * 0.5)) + ")");
      g.addColorStop(1, "rgba(" + col + ",0)");
      c.fillStyle = g;
      c.fillRect(0, 0, cw, ch * 0.7);
    }
    const dia = 1 - noche;
    // los rayos que se cuelan por la copa del Roble (solo alta, de día)
    if (nv === "alta" && dia > 0.2 && cam.esc > 0.06) {
      const [rx, ry] = aPantalla(plano.roble[0], plano.roble[1]);
      const copa = 1840 * cam.esc;
      const ancho = 1500 * cam.esc;
      if (rx > -ancho * 2 && rx < cw + ancho * 2 && ry > -copa && ry - copa < ch) {
        c.globalCompositeOperation = "screen";
        for (let i = 0; i < 6; i++) {
          const u = (i / 5 - 0.5) * ancho * 1.4 + Math.sin(t * 0.21 + i * 1.7) * 18 * cam.esc;
          const w0 = (26 + (i % 3) * 18) * cam.esc,
            al = (0.07 + 0.05 * Math.sin(t * 0.5 + i * 2.1)) * dia;
          if (al <= 0.005) continue;
          // de arriba a la derecha hacia abajo a la izquierda, como entra la luz
          const x0 = rx + u + copa * 0.18,
            y0 = ry - copa * 0.72,
            x1 = rx + u - copa * 0.22,
            y1 = ry + 60 * cam.esc;
          const g = c.createLinearGradient(x0, y0, x1, y1);
          g.addColorStop(0, "rgba(255,236,190,0)");
          g.addColorStop(0.35, "rgba(255,236,190," + al + ")");
          g.addColorStop(1, "rgba(255,236,190,0)");
          c.fillStyle = g;
          c.beginPath();
          c.moveTo(x0 - w0, y0);
          c.lineTo(x0 + w0, y0);
          c.lineTo(x1 + w0 * 1.8, y1);
          c.lineTo(x1 - w0 * 1.8, y1);
          c.closePath();
          c.fill();
        }
        c.globalCompositeOperation = "source-over";
      }
    }
    // la forja de día: el resplandor naranja que respira con el fuelle se ve aunque haya sol
    if (nv !== "baja" && dia > 0.05)
      for (const o of forjas) {
        const [fx, fy] = aPantalla(o.x, o.y, 60);
        const r = 260 * cam.esc;
        if (fx < -r || fy < -r || fx > cw + r || fy > ch + r || r < 2) continue;
        const p = 0.5 + 0.5 * Math.sin(t * 1.6 + o.x);
        const g = c.createRadialGradient(fx, fy, 0, fx, fy, r);
        g.addColorStop(0, "rgba(255,141,113," + (0.22 + 0.16 * p * p) * dia + ")");
        g.addColorStop(1, "rgba(255,141,113,0)");
        c.globalCompositeOperation = "lighter";
        c.fillStyle = g;
        c.fillRect(fx - r, fy - r, r * 2, r * 2);
        c.globalCompositeOperation = "source-over";
      }
    // el color de la hora (soft-light); en calidad baja un velo plano y liviano
    const G = grado(h);
    if (nv === "baja") {
      c.fillStyle = "rgba(" + G.c1.join(",") + "," + G.f1 * 0.25 + ")";
      c.fillRect(0, 0, cw, ch);
      return;
    }
    c.globalCompositeOperation = "soft-light";
    // el degradé se guarda mientras no cambien la hora (en pasos de un minuto) ni el tamaño de la pantalla
    const clave = Math.round(h * 60) + "|" + cw + "|" + ch;
    if (gradoCache.clave !== clave) {
      const am = c.createLinearGradient(0, 0, cw, ch);
      am.addColorStop(0, "rgba(" + G.c1.join(",") + "," + G.f1 + ")");
      am.addColorStop(1, "rgba(" + G.c2.join(",") + "," + G.f2 + ")");
      gradoCache.clave = clave;
      gradoCache.g = am;
    }
    c.fillStyle = gradoCache.g;
    c.fillRect(0, 0, cw, ch);
    c.globalCompositeOperation = "source-over";
  }

  // de noche, después de la capa de oscuridad: los faroles se reflejan en el río, temblando con el agua
  function despues(c, cam, cw, ch, h, t, noche, enVista) {
    if (nivel() !== "alta" || noche < 0.05 || !enVista) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = "lighter";
    for (const e of enVista) {
      if (!e.reflejo) continue;
      const [qx, qy] = e.reflejo;
      const largo = Math.min(e.r * 0.6, 260 * cam.esc + 20);
      const col = e.col === RUNA ? "115,213,219" : e.col === BRASA ? "255,141,113" : "255,217,138";
      for (let j = 0; j < 7; j++) {
        const y = qy + (j / 7) * largo,
          w = (14 + Math.sin(t * 3 + j * 1.9 + e.l.fase) * 6) * cam.esc * 3 * (1 - j / 9),
          dx = Math.sin(t * 2.2 + j * 1.3 + e.l.fase) * 5 * cam.esc * 3;
        if (w <= 0.5) continue;
        c.fillStyle = "rgba(" + col + "," + 0.22 * e.f * noche * (1 - j / 8) + ")";
        c.fillRect(qx + dx - w / 2, y, w, Math.max(1, 3 * cam.esc * 2));
      }
    }
    c.globalCompositeOperation = "source-over";
  }

  return { armar, dePantalla, antes, despues, grado, fuerza, faroleros: () => rondasFarol, dondeFarolero };
})();
