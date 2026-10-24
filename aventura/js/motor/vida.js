// ---------- el bosque vivo (sistema VIDA) ----------
// Partículas, luz y sombra para que Eldervald respire, con el lenguaje de siempre de Eromash: las brasas en rombo
// que suben, giran y se achican (logo de la arena, la web), las motas cuadradas que derivan con un vaivén (mapas.js
// de la arena), los signos rúnicos que suben de a uno como del libro del mago, y los anillos que se abren en el piso.
// Tres capas: «fondo» (lo que va en el piso: manchas de sol entre las copas, flores, anillos, sombras de pájaros),
// «aire» (debajo de la luz: hojas, polen, humo, lluvia, sombras de nubes, mariposas) y «sobreLuz» (lo que brilla
// en la oscuridad: luciérnagas, brasas, motas rúnicas, esporas, reflejos del agua, ojos de búho, fuegos guía).
// Además: la fauna chica que huye (liebres, pinzones), bandadas que cruzan, el clima del día (lluvia, bruma,
// ráfagas), luces que dejan los eventos, y tres lugares místicos nuevos (Fresno de los Ecos, Anillo de los álfar,
// Poza de Urd). Los sistemas avisan con VIDA.evento(tipo, x, y, op): cofre, piedra, rito, liberada, runa, mision,
// lugar, nivel, lider, sanar. Calidad gráfica: alta = todo · media = menos partículas, sin nubes ni bruma ni
// auras · baja = casi nada ambiental (sí lo de los eventos, poco). Estado guardado en E.extra.vida.
window.VIDA = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const { E, R, L, alfa, poli, TAU, RUNICO, RUNICO_CLARO, VIOLETA } = DIB;
  const nivel = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  const TOPE = { alta: 560, media: 240, baja: 70 };
  const BRASAS = ["#FFD98A", "#FF8D71", "#FFE7A8", "#C8402D"]; // las de la arena y la web
  const ORO = ["#FFD98A", "#FFF4D0", "#F5A524"];
  const RUNA_COL = { kenaz: "#FF8D71", isa: "#C8F2F4", algiz: "#FFD98A", sowilo: "#F5A524", laguz: "#73D5DB", raidho: "#C8F2F4" };
  // azar fijo por posición (mismo resultado cada cuadro: las motas del ambiente no guardan estado)
  const h3 = (a, b, c) => {
    let n = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  };
  const curva = (q) => (q < 0.08 ? q / 0.08 : Math.max(0, 1 - Math.pow((q - 0.08) / 0.92, 1.6))); // la de las chispas de la web
  let vista = { x0: 0, y0: 0, x1: 1, y1: 1 };
  let st = { anillo: -1, poza: false };

  // ---------- partículas con estado ----------
  // { x, y, vx, vy, t, dur, forma, col, s, rot, vr, g, ond, of, fase, capa, achica, aura, runa, a, suelo, arrastre, espera }
  const parts = [];
  function emitir(o) {
    const tope = TOPE[nivel()];
    if (parts.length >= tope * (o.pri ? 1.4 : 1)) return null;
    const p = Object.assign({ vx: 0, vy: 0, t: 0, dur: 1, forma: "cuad", col: "#F2ECEC", s: 4, rot: 0, vr: 0, g: 0, ond: 0, of: 3, fase: Math.random() * TAU, capa: "luz", a: 1, arrastre: 0, espera: 0 }, o);
    parts.push(p);
    return p;
  }
  const azar = (a, b) => a + Math.random() * (b - a);
  function moverPartes(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (p.espera > 0) {
        p.espera -= dt;
        continue;
      }
      p.t += dt;
      if (p.t >= p.dur) {
        parts.splice(i, 1);
        continue;
      }
      if (p.posada) continue;
      p.vy += p.g * dt;
      if (p.arrastre) {
        const k = Math.exp(-p.arrastre * dt);
        p.vx *= k;
        p.vy *= k;
      }
      p.x += (p.vx + viento * (p.lleva || 0)) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      // las hojas se posan en el piso y se apagan despacio
      if (p.suelo != null && p.y >= p.suelo) {
        p.y = p.suelo;
        p.posada = true;
        p.dur = Math.min(p.dur, p.t + 2.5);
      }
    }
  }
  function dibujarParte(c, p, nv) {
    if (p.espera > 0) return;
    const q = p.t / p.dur;
    let a = p.a * (p.posada ? Math.min(1, (p.dur - p.t) / 2.5) : curva(q));
    if (a <= 0.01) return;
    const x = p.x + (p.ond ? Math.sin(p.fase + p.t * p.of) * p.ond : 0),
      y = p.y;
    const s = p.achica ? p.s * (1 - q * 0.85) : p.s;
    c.globalAlpha = a;
    switch (p.forma) {
      case "rombo": // la brasa de la arena
        if (p.aura && nv === "alta") {
          c.globalAlpha = a * 0.25;
          rombo(c, x, y, s * 2.2, p.col);
          c.globalAlpha = a;
        }
        rombo(c, x, y, s, p.col, p.rot);
        break;
      case "runa":
        if (p.aura && nv !== "baja") {
          c.globalAlpha = a * 0.3;
          FUTHARK.dibujar(c, p.runa, x, y + s / 2, s, p.col, s * 0.32);
          c.globalAlpha = a;
        }
        FUTHARK.dibujar(c, p.runa, x, y + s / 2, s, p.aura ? "#F2ECEC" : p.col, Math.max(1.5, s * 0.12));
        break;
      case "hoja": {
        // la hoja gira y se da vuelta mientras cae (se afina de canto)
        const w = s * (0.25 + Math.abs(Math.cos(p.rot * 1.7)) * 0.75),
          ca = Math.cos(p.rot),
          sa = Math.sin(p.rot);
        const pt = (u, v) => [x + u * ca - v * sa, y + u * sa + v * ca];
        const a1 = pt(-s, 0), a2 = pt(0, -w * 0.5), a3 = pt(s, 0), a4 = pt(0, w * 0.5);
        DIB.P(c, [...a1, ...a2, ...a3, ...a4], p.col);
        DIB.P(c, [...a2, ...a3, ...pt(0, 0)], p.col2 || p.col);
        break;
      }
      case "aguja":
        L(c, x - Math.cos(p.rot) * s, y - Math.sin(p.rot) * s, x + Math.cos(p.rot) * s, y + Math.sin(p.rot) * s, p.col, 1.6);
        break;
      case "aro": {
        const r = s * (0.25 + q * 0.75);
        c.globalAlpha = a * (1 - q);
        c.strokeStyle = p.col;
        c.lineWidth = Math.max(1, (p.ancho || 3) * (1 - q * 0.7));
        c.beginPath();
        c.ellipse(x, y, r, r * 0.4, 0, 0, TAU);
        c.stroke();
        break;
      }
      case "humo":
        c.globalAlpha = a * (p.a2 || 0.22);
        DIB.P(c, poli(x, y, s * (0.5 + q), s * (0.42 + q * 0.8), 7, p.fase), p.col);
        break;
      case "chispa":
        c.strokeStyle = p.col;
        c.lineWidth = s * 0.5;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x - p.vx * 0.03, y - p.vy * 0.03);
        c.stroke();
        break;
      default:
        if (p.aura && nv === "alta") {
          c.globalAlpha = a * 0.22;
          R(c, x - s * 1.4, y - s * 1.4, s * 2.8, s * 2.8, p.col);
          c.globalAlpha = a;
        }
        if (p.vr || p.rot) {
          c.save();
          c.translate(x, y);
          c.rotate(p.rot);
          R(c, -s / 2, -s / 2, s, s, p.col);
          c.restore();
        } else R(c, x - s / 2, y - s / 2, s, s, p.col);
    }
  }
  function rombo(c, x, y, r, col, rot) {
    if (!rot) return DIB.P(c, [x, y - r * 1.5, x + r, y, x, y + r * 1.5, x - r, y], col);
    const ca = Math.cos(rot),
      sa = Math.sin(rot),
      pt = (u, v) => [x + u * ca - v * sa, y + u * sa + v * ca];
    DIB.P(c, [...pt(0, -r * 1.5), ...pt(r, 0), ...pt(0, r * 1.5), ...pt(-r, 0)], col);
  }
  const enVista = (x, y, m = 200) => x > vista.x0 - m && x < vista.x1 + m && y > vista.y0 - m && y < vista.y1 + m;

  // ---------- luces que dejan los eventos ----------
  const lucesT = []; // { x, y, r, col, t, dur }
  const luzBreve = (x, y, r, col, dur) => lucesT.push({ x, y, r, col, t: 0, dur });

  // ---------- clima del día ----------
  // Cada día sale de una semilla: despejado, mañana de bruma o una lluvia de unas horas. ?clima=lluvia|bruma lo fuerza.
  let lluvia = 0,
    bruma = 0,
    viento = 12,
    rafaga = null, // { t, dur, dir }
    proxRafaga = 20;
  const forzado = new URLSearchParams(location.search).get("clima");
  function climaDe(tiempo) {
    const h = LUZ.hora(tiempo),
      dia = Math.floor((tiempo / LUZ.DIA) * 24 + 9) / 24 | 0,
      z = h3(dia, 7, 13);
    const ventana = (a, b) => (h >= a && h < b ? Math.min(1, (h - a) / 0.6, (b - h) / 0.6) : 0);
    let ll = 0,
      br = 0;
    if (forzado === "lluvia") ll = 1;
    else if (forzado === "bruma") br = 1;
    else if (forzado !== "claro") {
      if (z < 0.22) ll = ventana(11 + Math.floor(h3(dia, 3, 5) * 8), 14.5 + Math.floor(h3(dia, 3, 5) * 8));
      else if (z < 0.42) br = ventana(4.5, 10.5);
      br = Math.max(br, ventana(4.8, 7.6) * 0.45); // al amanecer siempre hay algo de bruma
    }
    return { ll, br };
  }
  // lo que el motor le pregunta al clima (cuánto oscurecen las nubes, cuánta niebla suma, el viento del sonido)
  const nubes = () => lluvia * 0.38;
  const niebla = () => (nivel() === "alta" ? bruma * 0.9 + lluvia * 0.35 : 0);

  // ---------- los lugares místicos ----------
  const MISTICOS = [];
  function ubicarMisticos() {
    const pedidos = [
      { id: "fresnoEcos", p: W.m(330, 520), claro: 720, margen: 300 },
      { id: "anilloAlfar", p: W.m(560, 470), claro: 480, margen: 200 },
      { id: "pozaEstrellas", p: W.m(1000, 300), claro: 460, margen: 240 },
    ];
    pedidos.forEach((q) => {
      let lugar = null;
      for (let r = 0; r < 4000 && !lugar; r += 120)
        for (let k = 0; k < 12 && !lugar; k++) {
          const x = q.p[0] + Math.cos((k * TAU) / 12) * r,
            y = q.p[1] + Math.sin((k * TAU) / 12) * r;
          if (W.libreDeTodo(x, y, q.margen) && W.sueloEn(x, y) === 0) lugar = [x, y];
        }
      if (!lugar) return;
      // el claro: el bosque natural de alrededor se corre (queda algún tocón en la orilla, como los otros claros)
      W.cercanas(lugar[0] - q.claro, lugar[1] - q.claro, lugar[0] + q.claro, lugar[1] + q.claro, (o) => {
        if (!o.arbol && o.id !== "roca" && o.id !== "troncoCaido") return;
        if (Math.hypot(o.x - lugar[0], o.y - lugar[1]) > q.claro) return;
        o.oculto = true;
        o.choque = null;
      });
      const cosa = W.agregar(q.id, lugar, { s: 1, brillo: 0.4 });
      MISTICOS.push({ id: q.id, cosa });
    });
  }
  const mistico = (id) => MISTICOS.find((m) => m.id === id);
  const indiceNoche = () => Math.floor((A.H.E.tiempo / LUZ.DIA) * 24 + 9 + 12) / 24 | 0;

  // ---------- fauna chica ----------
  const bichos = []; // { tipo: liebre|pinzon|mariposa, x, y, ... }
  const bandadas = []; // { x, y, vx, vy, n, t, cuervos }
  let proxBandada = 18,
    proxBicho = 4,
    guia = null, // el fuego guía: { x, y, a: [x, y] destino, t, fin }
    proxGuia = 8;
  let ultimoHp = 0,
    acumSanar = 0,
    acumEscaneo = 0;
  const emisores = { arboles: [], fuegos: [], runicos: [], violetas: [], cofres: [], faroles: [], hongos: [], humos: [], totems: [], oro: [] };
  const flores = []; // { x, y, sem, t, dur }
  const gruposVistos = new Map();

  // qué hay alrededor que suelte partículas (se mira cuatro veces por segundo)
  function escanear() {
    for (const k in emisores) emisores[k].length = 0;
    const { x0, y0, x1, y1 } = vista;
    W.cercanas(x0 - 300, y0 - 200, x1 + 300, y1 + 500, (o) => {
      if (o.oculto) return;
      const id = o.id,
        oo = o.o,
        s = oo.s || 1;
      if (o.arbol && !o.resto) emisores.arboles.push(o);
      else if ((id === "fogonOlla" && !oo.apagado) || (id === "brasero" && oo.encendido)) emisores.fuegos.push([o.x, o.y - (id === "brasero" ? 58 : 26) * s, 1]);
      else if (id === "herreriaAsa") emisores.fuegos.push([o.x + 30 * s, o.y - 40 * s, 0.8]);
      if (id === "ahumadero" || id === "fogonOlla" || id === "hongoDorado" || id === "cabanaLenadores") emisores.humos.push([o.x + (id === "hongoDorado" ? 60 : 0) * s, o.y - (id === "hongoDorado" ? 210 : id === "cabanaLenadores" ? 150 : 60) * s]);
      if ((id === "piedraSusurro" && oo.viva) || ((id === "runaRefugio" || id === "pedestalPaso" || id === "losaPatio") && oo.luz > 0) || id === "piedraAncla" || id === "santuario" || id === "piedraMuralla" || id === "piedraLinde" || (id === "mojon" && (oo.luz || oo.fuerza)) || (id === "altarRuna" && !oo.tomada) || (id === "piedraRito" && oo.viva) || id === "estela") {
        const alto = { piedraSusurro: 110, piedraAncla: 110, santuario: 90, piedraMuralla: 60, piedraLinde: 40, mojon: 50, altarRuna: 100, piedraRito: 80, estela: 80, runaRefugio: 50, pedestalPaso: 50, losaPatio: 4 }[id] || 60;
        emisores.runicos.push([o.x, o.y - alto * s, oo.runa || (id === "altarRuna" ? oo.runa : null), id === "altarRuna" ? ASSETS.COL_RUNA[oo.runa] || RUNICO : RUNICO]);
      } else if (id === "piedraSusurro") emisores.runicos.push([o.x, o.y - 110 * s, null, "#4E8E92", true]);
      if ((id === "soporteAtadura" && !oo.roto) || id === "piedraVioleta") emisores.violetas.push([o.x, o.y - 60 * s]);
      if ((id === "cofreRunico" && !oo.abierto) || (id === "arcaEnterrada" && !oo.abierta && !oo.abierto)) emisores.cofres.push([o.x, o.y - 30 * s, oo.sellado]);
      if (id === "manzanoIdunn" && !oo.cosechado) emisores.oro.push([o.x, o.y - 90 * s]);
      if ((id === "posteFarol" && oo.encendido) || id === "farol" || id === "torreVigia" || id === "portonPuesto") emisores.faroles.push([o.x + (id === "farol" ? 14 : id === "posteFarol" ? 26 : id === "portonPuesto" ? -134 : 0) * s, o.y - (id === "farol" ? 70 : id === "posteFarol" ? 94 : id === "portonPuesto" ? 128 : 150) * s]);
      if (id === "camaHongos" || id === "hongoDorado") emisores.hongos.push([o.x, o.y - 10]);
      if (id === "totemCampamento" && window.HORDAS) emisores.totems.push(o);
    });
    W.DECO.forEach((d) => d.id === "hongosRocio" && d.x > x0 - 60 && d.x < x1 + 60 && d.y > y0 - 60 && d.y < y1 + 60 && emisores.hongos.push([d.x, d.y - 8]));
  }

  // ---------- emisores con estado (brasas, humo, hojas, motas rúnicas…) ----------
  function emitirAmbiente(dt, nv) {
    const k = nv === "alta" ? 1 : nv === "media" ? 0.5 : 0.15,
      n = A.noche(),
      prob = (r) => Math.random() < r * dt * k;
    // hojas y agujas que caen de los árboles (más con ráfaga, nada con lluvia fuerte)
    const ra = rafaga ? 4 : 1;
    for (const o of emisores.arboles) {
      if (!prob(0.07 * ra * (o.gigante ? 3 : 1))) continue;
      const pino = /pino|abeto/i.test(o.id),
        abedul = o.id === "abedul",
        ancho = (o.gigante || 60) * (o.o.s || 1);
      const col = pino ? (Math.random() < 0.5 ? "#6E5A3A" : "#4E5C32") : abedul ? (Math.random() < 0.3 ? "#FFD98A" : "#9AAE4C") : Math.random() < 0.18 ? "#C9A45A" : Math.random() < 0.5 ? "#667D38" : "#536830";
      emitir({ x: o.x + azar(-ancho, ancho), y: o.y - o.alto * azar(0.55, 0.9), vx: azar(-10, 10), vy: azar(28, 46), dur: 14, forma: pino ? "aguja" : "hoja", col, col2: pino ? null : abedul ? "#C9D07A" : "#84963F", s: pino ? 4 : azar(4, 6), vr: azar(-3, 3), ond: pino ? 4 : azar(10, 22), of: azar(1.5, 2.6), capa: "aire", lleva: 1, suelo: o.y + azar(-40, 50) });
    }
    // brasas del fuego (rombos que suben girando y se achican, como en el logo)
    for (const [x, y, f] of emisores.fuegos) {
      if (prob(7 * f)) emitir({ x: x + azar(-12, 12), y, vx: azar(-14, 14), vy: azar(-120, -60), dur: azar(1.2, 2.2), forma: "rombo", col: BRASAS[(Math.random() * 4) | 0], s: azar(2, 4), vr: azar(-4, 4), achica: true, ond: azar(6, 14), of: azar(2, 4), lleva: 0.6, aura: true });
      if (n > 0.4 && prob(1.2 * f)) emitir({ x, y: y - 10, vx: azar(-40, 40), vy: azar(-260, -160), g: 220, dur: 0.7, forma: "chispa", col: "#FFE7A8", s: 3, pri: false });
    }
    for (const [x, y] of emisores.humos) if (prob(1.4)) emitir({ x: x + azar(-6, 6), y, vx: azar(-6, 6), vy: azar(-34, -22), dur: azar(3, 4.5), forma: "humo", col: "#C8C0B4", s: azar(10, 16), capa: "aire", lleva: 1.2, a2: 0.16 });
    // motas y signos rúnicos que suben de las piedras despiertas (las dormidas, apenas y apagadas)
    for (const [x, y, runa, col, dormida] of emisores.runicos) {
      if (prob(dormida ? 0.25 : 2.4)) emitir({ x: x + azar(-18, 18), y: y + azar(-10, 20), vx: azar(-6, 6), vy: azar(-34, -18), dur: azar(2, 3.4), forma: Math.random() < 0.5 ? "rombo" : "cuad", col: dormida ? col : Math.random() < 0.6 ? col : RUNICO_CLARO, s: azar(1.6, 3), ond: azar(4, 10), of: azar(1, 2), aura: !dormida, a: dormida ? 0.5 : 1 });
      if (!dormida && prob(0.18)) emitir({ x: x + azar(-14, 14), y, vy: -16, dur: 3.2, forma: "runa", runa: runa || FUTHARK.NOMBRES[(Math.random() * 24) | 0], col, s: azar(10, 14), ond: 5, of: 1.2, aura: true });
    }
    // las ataduras violetas gotean hacia abajo, pesadas
    for (const [x, y] of emisores.violetas) if (prob(2)) emitir({ x: x + azar(-20, 20), y: y + azar(-30, 10), vy: azar(10, 26), g: 12, dur: azar(1.6, 2.6), forma: "rombo", col: Math.random() < 0.7 ? VIOLETA : "#C9A0F0", s: azar(1.6, 2.8), achica: true, ond: 3, aura: true });
    // los cofres importantes llaman desde lejos: oro y luz rúnica que suben (violeta si siguen sellados)
    for (const [x, y, sellado] of emisores.cofres) {
      if (prob(3)) emitir({ x: x + azar(-24, 24), y: y + azar(-6, 10), vy: azar(-46, -26), dur: azar(1.6, 2.6), forma: "rombo", col: sellado ? (Math.random() < 0.5 ? VIOLETA : "#C9A0F0") : Math.random() < 0.5 ? ORO[(Math.random() * 3) | 0] : RUNICO_CLARO, s: azar(1.8, 3.2), vr: azar(-2, 2), achica: true, ond: 6, aura: true });
    }
    // el manzano de Iðunn suelta pétalos dorados
    for (const [x, y] of emisores.oro) if (prob(1.2)) emitir({ x: x + azar(-30, 30), y: y + azar(-20, 20), vy: azar(14, 24), dur: 5, forma: "hoja", col: "#FFD98A", col2: "#FFF4D0", s: 3, vr: azar(-2, 2), ond: 12, of: 2, capa: "luz", suelo: y + 90 + azar(-10, 16), aura: true });
    // esporas de los hongos de rocío: suben despacio, más de noche
    for (const [x, y] of emisores.hongos) if (prob(0.5 + n * 1.2)) emitir({ x: x + azar(-10, 10), y, vy: azar(-16, -8), dur: azar(2.5, 4), forma: "cuad", col: Math.random() < 0.5 ? "#8FE0D0" : "#C8F2F4", s: azar(1.4, 2.4), ond: 6, of: 1.4, aura: true, a: 0.85 });
    // los tótems de los campamentos vivos echan ceniza roja
    for (const o of emisores.totems) {
      const g = grupoDeTotem(o);
      if (g && !g.muerto && prob(1.5)) emitir({ x: o.x + azar(-10, 10), y: o.y - 100, vx: azar(-8, 8), vy: azar(-40, -20), dur: azar(1.4, 2.4), forma: "cuad", col: Math.random() < 0.6 ? "#C8402D" : "#5E130D", s: azar(2, 3.5), vr: azar(-3, 3), ond: 6, capa: "aire", lleva: 0.8 });
    }
    // los lugares místicos
    const fr = mistico("fresnoEcos");
    if (fr && enVista(fr.cosa.x, fr.cosa.y, 600)) {
      const f = fr.cosa;
      if (prob(3)) emitir({ x: f.x + azar(-210, 210), y: f.y - azar(330, 480), vx: azar(-8, 8), vy: azar(18, 32), dur: 16, forma: "hoja", col: Math.random() < 0.6 ? RUNICO_CLARO : "#FFD98A", col2: "#F2ECEC", s: azar(3, 5), vr: azar(-2, 2), ond: azar(14, 26), of: 1.6, aura: true, suelo: f.y + azar(-60, 70) });
      if (prob(2)) emitir({ x: f.x + azar(-170, 170), y: f.y + azar(-20, 30), vy: azar(-30, -16), dur: 3.5, forma: "rombo", col: RUNICO, s: 2.2, ond: 8, of: 1.2, aura: true });
    }
    const po = mistico("pozaEstrellas");
    if (po && n > 0.3 && enVista(po.cosa.x, po.cosa.y, 300) && prob(2.5 * n)) emitir({ x: po.cosa.x + azar(-90, 90), y: po.cosa.y - 34 + azar(-30, 30), vy: azar(-26, -12), dur: 3, forma: "rombo", col: Math.random() < 0.5 ? "#F2ECEC" : "#C8F2F4", s: azar(1.4, 2.4), ond: 5, aura: true });
    // las flores del despertar sueltan polen dorado
    for (const fl of flores) if (enVista(fl.x, fl.y) && prob(0.6)) emitir({ x: fl.x + azar(-30, 30), y: fl.y - 10, vy: -14, dur: 2.5, forma: "cuad", col: "#FFE7A8", s: 2, ond: 8, capa: "luz", aura: true, a: 0.8 });
  }
  let totemCache = null;
  function grupoDeTotem(o) {
    if (!window.HORDAS || !HORDAS.grupos) return null;
    if (!totemCache) totemCache = new Map();
    if (!totemCache.has(o)) {
      let mejor = null,
        dm = 900;
      HORDAS.grupos.forEach((g) => {
        const d = Math.hypot(g.centro[0] - o.x, g.centro[1] - o.y);
        if (d < dm) (dm = d), (mejor = g);
      });
      totemCache.set(o, mejor);
    }
    return totemCache.get(o);
  }

  // ---------- campos sin estado (dependen solo de la posición y el tiempo) ----------
  // celdas del mundo que tocan la vista, con su azar fijo
  function celdas(tam, margen, fn) {
    const gx0 = Math.floor((vista.x0 - margen) / tam),
      gx1 = Math.floor((vista.x1 + margen) / tam),
      gy0 = Math.floor((vista.y0 - margen) / tam),
      gy1 = Math.floor((vista.y1 + margen) / tam);
    for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) fn(gx, gy, gx * tam, gy * tam);
  }
  const densidad = new Map(); // cuánto bosque hay en cada celda (el mundo no cambia: se calcula una vez)
  function bosqueEn(gx, gy, tam) {
    const k = gx + "," + gy + "," + tam;
    if (!densidad.has(k)) densidad.set(k, Math.max(0, Math.min(1, (W.ruido(gx * tam + tam / 2, gy * tam + tam / 2) - 0.25) * 2)));
    return densidad.get(k);
  }
  const luciernagas = []; // las más cerca, para que alumbren
  function campoLuciernagas(c, T, n, nv) {
    luciernagas.length = 0;
    if (n < 0.35 || lluvia > 0.4 || nv === "baja") return;
    const cuantas = nv === "alta" ? 4 : 2,
      f = Math.min(1, (n - 0.35) / 0.3) * (1 - lluvia);
    const una = (x, y, ph, i) => {
      const bl = Math.pow(Math.max(0, Math.sin(T * (1.1 + (i % 3) * 0.35) + ph * 9)), 2) * f;
      if (bl < 0.03) return;
      c.globalAlpha = bl * 0.3;
      R(c, x - 4, y - 4, 8, 8, "#8CF0B4");
      c.globalAlpha = bl;
      R(c, x - 1.5, y - 1.5, 3, 3, "#FFF4D0");
      if (bl > 0.5 && luciernagas.length < 10) luciernagas.push([x, y, bl]);
    };
    celdas(480, 100, (gx, gy, bx, by) => {
      for (let i = 0; i < cuantas; i++) {
        const r1 = h3(gx, gy, i * 3 + 1),
          r2 = h3(gx, gy, i * 3 + 2),
          ph = h3(gx, gy, i * 3 + 3);
        const x = bx + r1 * 480 + Math.sin(T * (0.25 + ph * 0.2) + ph * 20) * 70,
          y = by + r2 * 480 + Math.sin(T * (0.19 + r1 * 0.2) + ph * 11) * 40 - 30 - Math.sin(T * 0.7 + ph * 5) * 12;
        if (W.sueloEn(x, y) === 1 && i > 1) continue;
        una(x, y, ph, i);
      }
    });
    // enjambres en las orillas de las lagunas
    W.LAGOS.forEach((lg, li) => {
      if (lg.seco || !enVista(lg.p[0], lg.p[1], lg.rx)) return;
      for (let i = 0; i < (nv === "alta" ? 22 : 10); i++) {
        const a = h3(li, i, 5) * TAU + Math.sin(T * 0.1 + i) * 0.2,
          k = 0.9 + h3(li, i, 6) * 0.4;
        una(lg.p[0] + Math.cos(a) * lg.rx * k + Math.sin(T * 0.4 + i) * 30, lg.p[1] + Math.sin(a) * lg.ry * k - 30 + Math.sin(T * 0.6 + i * 2) * 14, h3(li, i, 7), i);
      }
    });
  }
  function campoPolen(c, T, n, nv) {
    if (n > 0.55 || lluvia > 0.2 || nv === "baja") return;
    const o = A.amb().o,
      f = (1 - n / 0.55) * (1 - lluvia * 4),
      cuantos = nv === "alta" ? 7 : 3;
    celdas(420, 60, (gx, gy, bx, by) => {
      for (let i = 0; i < cuantos; i++) {
        const r1 = h3(gx, gy, i + 40),
          r2 = h3(gx, gy, i + 80),
          v = 0.5 + r1;
        const x = bx + ((r1 * 420 + T * (viento * 0.8 + 6) * v) % 420),
          y = by + r2 * 420 + Math.sin(T * 0.8 * v + r2 * 30) * 18;
        const a = f * (0.35 + 0.35 * Math.sin(T * 1.3 + r1 * 40)) * (1 + o);
        if (a < 0.04) continue;
        c.globalAlpha = Math.min(0.9, a);
        R(c, x, y, o > 0.3 ? 3 : 2, o > 0.3 ? 3 : 2, o > 0.3 ? "#FFD98A" : "#FFF4D0");
      }
    });
  }
  // el rocío del amanecer: destellos chiquitos que titilan en el pasto
  function campoRocio(c, T, h, nv) {
    if (h < 5 || h > 8.5 || nv === "baja" || lluvia > 0.3) return;
    const f = Math.min(1, (h - 5) / 0.8, (8.5 - h) / 1.2);
    celdas(300, 0, (gx, gy, bx, by) => {
      for (let i = 0; i < 6; i++) {
        const a = Math.pow(Math.max(0, Math.sin(T * (2 + h3(gx, gy, i + 9) * 2) + h3(gx, gy, i + 2) * 40)), 10) * f;
        if (a < 0.05) continue;
        const x = bx + h3(gx, gy, i + 3) * 300,
          y = by + h3(gx, gy, i + 4) * 300;
        if (W.sueloEn(x, y) !== 0) continue;
        c.globalAlpha = a;
        R(c, x - 3, y - 0.5, 6, 1.5, "#F2ECEC");
        R(c, x - 0.75, y - 3, 1.5, 6, "#F2ECEC");
      }
    });
  }
  // los reflejos del agua: destellos sobre las lagunas y los ríos (oro de día, azul de luna de noche) y espuma que baja
  function campoAgua(c, T, n, nv) {
    if (nv === "baja") return;
    const o = A.amb().o,
      col = n > 0.5 ? "#C8F2F4" : o > 0.3 ? "#FFD98A" : "#F2ECEC",
      fuerza = n > 0.5 ? 0.6 : 1 - lluvia * 0.7;
    W.LAGOS.forEach((lg, li) => {
      if (lg.seco || !enVista(lg.p[0], lg.p[1], lg.rx)) return;
      for (let i = 0; i < (nv === "alta" ? 26 : 12); i++) {
        const a = Math.pow(Math.max(0, Math.sin(T * (1.4 + h3(li, i, 1)) + h3(li, i, 2) * 50)), 6) * fuerza;
        if (a < 0.05) continue;
        const an = h3(li, i, 3) * TAU,
          rr = Math.sqrt(h3(li, i, 4)) * 0.85;
        const x = lg.p[0] + Math.cos(an) * lg.rx * rr,
          y = lg.p[1] + Math.sin(an) * lg.ry * rr;
        c.globalAlpha = a;
        R(c, x - 5, y - 0.8, 10, 1.6, col);
        R(c, x - 1, y - 2, 2, 4, col);
      }
    });
    W.RIOS.forEach((rio, ri) => {
      if (rio.seco) return;
      for (let s0 = 0; s0 < rio.p.length - 1; s0++) {
        const [ax, ay] = rio.p[s0],
          [bx, by] = rio.p[s0 + 1];
        if (!enVista((ax + bx) / 2, (ay + by) / 2, Math.hypot(bx - ax, by - ay))) continue;
        const largo = Math.hypot(bx - ax, by - ay),
          nx = -(by - ay) / largo,
          ny = (bx - ax) / largo,
          cant = Math.min(40, Math.floor(largo / 60));
        for (let i = 0; i < cant; i++) {
          const lado = (h3(ri, s0, i) - 0.5) * rio.w * 0.7;
          // espuma: corre río abajo
          const u = (h3(ri, s0, i + 100) + T * 0.05 * (0.6 + h3(ri, s0, i + 7))) % 1;
          const fx = ax + (bx - ax) * u + nx * lado,
            fy = ay + (by - ay) * u + ny * lado;
          c.globalAlpha = 0.35 * Math.sin(u * Math.PI) * fuerza;
          R(c, fx - 3, fy - 1, 6, 2, "#C8DCE0");
          // destello quieto
          const a = Math.pow(Math.max(0, Math.sin(T * 1.7 + h3(ri, s0, i + 50) * 60)), 8) * fuerza;
          if (a < 0.05) continue;
          const v = h3(ri, s0, i + 200);
          c.globalAlpha = a;
          R(c, ax + (bx - ax) * v + nx * lado * 0.8 - 4, ay + (by - ay) * v + ny * lado * 0.8 - 0.8, 8, 1.6, col);
        }
      }
    });
  }
  // los peces que saltan y las libélulas de las lagunas
  const saltos = []; // { x, y, t, dir }
  let proxPez = 5;
  function aguaViva(c, T, n, nv, dt) {
    W.LAGOS.forEach((lg, li) => {
      if (lg.seco || !enVista(lg.p[0], lg.p[1], lg.rx) || n > 0.6 || nv === "baja") return;
      for (let i = 0; i < 3; i++) {
        // la libélula: se queda quieta en el aire y salta de golpe a otro punto
        const tramo = Math.floor(T / 1.3 + h3(li, i, 9) * 10),
          u = Math.min(1, ((T / 1.3 + h3(li, i, 9) * 10) % 1) * 5),
          ease = 1 - Math.pow(1 - u, 3);
        const p0 = [h3(li, i * 50 + tramo, 1), h3(li, i * 50 + tramo, 2)],
          p1 = [h3(li, i * 50 + tramo + 1, 1), h3(li, i * 50 + tramo + 1, 2)];
        const x = lg.p[0] + ((p0[0] + (p1[0] - p0[0]) * ease) - 0.5) * lg.rx * 1.6,
          y = lg.p[1] + ((p0[1] + (p1[1] - p0[1]) * ease) - 0.5) * lg.ry * 1.4 - 40;
        c.globalAlpha = 1;
        ASSETS.dibujar(c, "libelula", x, y, T, { s: 1, mira: p1[0] > p0[0] ? 1 : -1, sem: i });
      }
    });
    proxPez -= dt;
    if (proxPez <= 0) {
      proxPez = azar(4, 9);
      const lg = W.LAGOS.find((l) => !l.seco && enVista(l.p[0], l.p[1], 0));
      if (lg) {
        const an = Math.random() * TAU,
          rr = Math.random() * 0.6;
        saltos.push({ x: lg.p[0] + Math.cos(an) * lg.rx * rr, y: lg.p[1] + Math.sin(an) * lg.ry * rr, t: 0, dir: Math.random() < 0.5 ? -1 : 1 });
      }
    }
    for (let i = saltos.length - 1; i >= 0; i--) {
      const s = saltos[i];
      s.t += dt;
      const q = s.t / 0.7;
      if (q < 1) {
        c.globalAlpha = 1;
        ASSETS.dibujar(c, "pez", s.x + s.dir * (q - 0.5) * 60, s.y - Math.sin(q * Math.PI) * 50, T, { giro: s.dir * (q - 0.5) * 2.4 + (s.dir < 0 ? Math.PI : 0) });
      }
      if (s.t > 0 && !s.chap1) {
        s.chap1 = true;
        anillo(s.x - s.dir * 30, s.y, 40, "#C8DCE0");
      }
      if (q >= 1 && !s.chap2) {
        s.chap2 = true;
        anillo(s.x + s.dir * 30, s.y, 50, "#C8DCE0");
        for (let k = 0; k < 6; k++) emitir({ x: s.x + s.dir * 30, y: s.y - 4, vx: azar(-60, 60), vy: azar(-150, -80), g: 500, dur: 0.6, forma: "cuad", col: "#C8DCE0", s: 2.5, capa: "aire" });
        if (window.SONIDO) SONIDO.tono("sine", 620, 240, 0.18, 0.03, { x: s.x, y: s.y, filtro: 1800 });
      }
      if (s.t > 1.2) saltos.splice(i, 1);
    }
  }
  const anillo = (x, y, s, col, op = {}) => emitir(Object.assign({ x, y, dur: 0.9, forma: "aro", col, s, capa: "piso", ancho: 2.5, pri: true }, op));
  // las polillas que giran alrededor de los faroles de noche
  function polillas(c, T, n) {
    if (n < 0.35) return;
    emisores.faroles.forEach(([x, y], k) => {
      for (let i = 0; i < 3; i++) {
        const a = T * (2.2 + i * 0.7) * (i % 2 ? -1 : 1) + k * 3 + i * 2,
          r = 18 + i * 9 + Math.sin(T * 5 + i) * 5;
        c.globalAlpha = Math.min(1, (n - 0.35) * 3);
        ASSETS.dibujar(c, "polilla", x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6, T, { s: 0.9, sem: i + k });
      }
    });
  }
  // los ojos del búho: de noche, en algunos árboles grandes, parpadean; se esconden si Eromash se acerca
  let proxUlular = 20;
  function buhos(c, T, n, dt) {
    if (n < 0.6 || lluvia > 0.5) return;
    let cerca = null;
    for (const o of emisores.arboles) {
      if (o.alto < 150 || h3(o.x | 0, o.y | 0, 17) > 0.06) continue;
      const x = o.x + 10 * (o.o.s || 1),
        y = o.y - o.alto * 0.52;
      if (Math.hypot(x - jug.x, o.y - jug.y) < 320) continue;
      const parp = Math.sin(T * 0.9 + o.x) > 0.96;
      c.globalAlpha = Math.min(1, (n - 0.6) * 4);
      if (parp) {
        R(c, x - 9, y, 6, 1.5, "#FFD98A");
        R(c, x + 3, y, 6, 1.5, "#FFD98A");
      } else {
        rombo(c, x - 6, y, 3, "#FFD98A");
        rombo(c, x + 6, y, 3, "#FFD98A");
        R(c, x - 6.5, y - 1, 1.2, 2.5, "#111111");
        R(c, x + 5.5, y - 1, 1.2, 2.5, "#111111");
      }
      if (!cerca) cerca = [x, y];
    }
    proxUlular -= dt;
    if (cerca && proxUlular <= 0 && window.SONIDO) {
      proxUlular = azar(25, 45);
      SONIDO.tono("sine", 392, 330, 0.35, 0.05, { x: cerca[0], y: cerca[1], filtro: 900 });
      SONIDO.tono("sine", 392, 320, 0.6, 0.045, { x: cerca[0], y: cerca[1], filtro: 900, retraso: 0.45 });
    }
  }
  // el Anillo de los álfar de noche: motas que giran en ronda
  function rondaAlfar(c, T, n) {
    const an = mistico("anilloAlfar");
    if (!an || n < 0.3 || !enVista(an.cosa.x, an.cosa.y, 200)) return;
    const f = Math.min(1, (n - 0.3) * 2.5),
      x0 = an.cosa.x,
      y0 = an.cosa.y;
    for (let i = 0; i < 18; i++) {
      const a = T * 0.6 + (i / 18) * TAU,
        alto = 30 + Math.sin(T * 1.4 + i) * 16 + (i % 3) * 10;
      const x = x0 + Math.cos(a) * 100,
        y = y0 + Math.sin(a) * 42 - alto;
      c.globalAlpha = f * 0.25;
      rombo(c, x, y, 5, "#8CF0B4");
      c.globalAlpha = f * (0.6 + 0.4 * Math.sin(T * 3 + i));
      rombo(c, x, y, 2.2, i % 4 ? "#BFF7D6" : "#FFF4D0");
    }
  }

  // ---------- el fuego guía ----------
  // De noche, si hay algo escondido sin encontrar cerca, a veces aparece una llamita fría que va adelante de Eromash
  // hasta ahí y se apaga al llegar. El Fresno de los Ecos manda uno a cualquier hora.
  function secretoCerca(max) {
    if (!window.SECRETOS) return null;
    const S = SECRETOS.lista();
    let mejor = null,
      dm = max;
    const ver = (o) => {
      const d = Math.hypot(o.x - jug.x, o.y - jug.y);
      if (d < dm && d > 260) (dm = d), (mejor = o);
    };
    S.cofres.forEach((q) => !S.st.cofres[q.id] && !q.cosa.o.oculto && ver(q.cosa));
    S.piedras.forEach((p) => !S.st.piedras[p.id] && ver(p.cosa));
    S.altares.forEach((a) => !a.cosa.o.tomada && ver(a.cosa));
    S.manzanos.forEach((m) => !m.cosa.o.cosechado && ver(m.cosa));
    return mejor;
  }
  function soltarGuia(destino) {
    if (!destino) return false;
    const an = Math.atan2(destino.y - jug.y, destino.x - jug.x);
    guia = { x: jug.x + Math.cos(an) * 120, y: jug.y + Math.sin(an) * 60 - 60, a: destino, t: 0, fin: 0 };
    if (window.SONIDO) SONIDO.tono("triangle", 988, 1480, 0.5, 0.035, { x: guia.x, y: guia.y, filtro: 3000 });
    return true;
  }
  function moverGuia(dt) {
    if (!guia) {
      proxGuia -= dt;
      if (proxGuia <= 0) {
        proxGuia = azar(50, 90);
        if (A.noche() > 0.6 && !A.enPelea() && Math.random() < 0.6) soltarGuia(secretoCerca(1400));
      }
      return;
    }
    guia.t += dt;
    const dx = guia.a.x - guia.x,
      dy = guia.a.y - 60 - guia.y,
      d = Math.hypot(dx, dy),
      dj = Math.hypot(guia.x - jug.x, guia.y - jug.y),
      llegada = Math.hypot(guia.a.x - jug.x, guia.a.y - jug.y) < 160;
    if (llegada || guia.t > 90) guia.fin += dt;
    if (guia.fin > 1.5) {
      for (let k = 0; k < 12; k++) emitir({ x: guia.x, y: guia.y, vx: azar(-60, 60), vy: azar(-80, 10), dur: 1, forma: "rombo", col: "#8CF0B4", s: 2.5, achica: true, aura: true, pri: true });
      guia = null;
      return;
    }
    // espera si Eromash queda atrás; avanza si se acerca
    const v = dj < 260 ? 150 : dj > 520 ? -40 : 30;
    if (d > 30) {
      guia.x += (dx / d) * v * dt;
      guia.y += (dy / d) * v * dt;
    } else {
      guia.x = guia.a.x + Math.cos(guia.t * 3) * 40;
      guia.y = guia.a.y - 60 + Math.sin(guia.t * 3) * 16;
    }
    if (Math.random() < dt * 14) emitir({ x: guia.x + azar(-4, 4), y: guia.y + azar(-4, 4), vy: azar(-20, -8), dur: 0.8, forma: "cuad", col: Math.random() < 0.5 ? "#8CF0B4" : "#F2ECEC", s: 2.2, aura: true });
  }
  function dibujarGuia(c, T) {
    if (!guia) return;
    const a = Math.min(1, guia.t * 2) * (1 - guia.fin / 1.5),
      y = guia.y + Math.sin(T * 3) * 6;
    c.globalAlpha = a * 0.25;
    rombo(c, guia.x, y, 14, "#8CF0B4");
    c.globalAlpha = a * 0.6;
    rombo(c, guia.x, y, 8, "#8CF0B4", Math.sin(T * 2) * 0.3);
    c.globalAlpha = a;
    rombo(c, guia.x, y, 4, "#F2ECEC");
  }

  // ---------- fauna chica: liebres, pinzones, mariposas y bandadas ----------
  function lugarLibreCerca(min, max) {
    for (let k = 0; k < 8; k++) {
      const an = Math.random() * TAU,
        r = azar(min, max),
        x = jug.x + Math.cos(an) * r,
        y = jug.y + Math.sin(an) * r * 0.7;
      if (W.libre(x, y, 16) && W.sueloEn(x, y) === 0 && !enEikholt(x, y)) return [x, y];
    }
    return null;
  }
  const enEikholt = (x, y) => Math.hypot(x - W.CIUDAD.c[0], (y - W.CIUDAD.c[1]) * 1.3) < W.CIUDAD.rx;
  function moverBichos(dt, nv) {
    const n = A.noche(),
      tope = nv === "alta" ? 9 : nv === "media" ? 5 : 2;
    proxBicho -= dt;
    if (proxBicho <= 0 && bichos.length < tope && !A.enPelea() && lluvia < 0.5) {
      proxBicho = azar(5, 11);
      const r = Math.random(),
        p = lugarLibreCerca(520, 900);
      if (p && n < 0.75) {
        if (r < 0.35) bichos.push({ tipo: "liebre", x: p[0], y: p[1], mira: Math.random() < 0.5 ? 1 : -1, salto: 0, quieta: azar(1, 3), huye: false, t: 0 });
        else if (r < 0.7 && n < 0.4) for (let k = 0; k < 3 + ((Math.random() * 3) | 0); k++) bichos.push({ tipo: "pinzon", x: p[0] + azar(-40, 40), y: p[1] + azar(-20, 20), mira: Math.random() < 0.5 ? 1 : -1, alto: 0, vuela: false, t: azar(0, 2), vx: 0, vy: 0 });
        else if (n < 0.3 && W.ruido(p[0], p[1]) < 0.55) for (let k = 0; k < 2; k++) mariposaEn(p[0] + azar(-60, 60), p[1] + azar(-40, 40));
      }
    }
    const pel = A.enPelea();
    for (let i = bichos.length - 1; i >= 0; i--) {
      const b = bichos[i];
      b.t += dt;
      const dx = b.x - jug.x,
        dy = b.y - jug.y,
        d = Math.hypot(dx, dy);
      if (d > 1700 || b.t > 120) {
        bichos.splice(i, 1);
        continue;
      }
      if (b.tipo === "liebre") {
        const corre = jug.paso === 3 ? 380 : 260;
        if (!b.huye && (d < corre || pel)) b.huye = true;
        if (b.salto > 0) {
          b.salto += dt * (b.huye ? 3.2 : 2.2);
          const nx = b.x + b.mira * (b.huye ? 260 : 120) * dt,
            ny = b.y + (b.dy || 0) * dt;
          if (W.libre(nx, ny, 10)) (b.x = nx), (b.y = ny);
          else b.mira *= -1;
          if (b.salto >= 1) b.salto = 0;
        } else {
          b.quieta -= dt;
          if (b.quieta <= 0) {
            b.salto = 0.01;
            if (b.huye) {
              b.mira = dx >= 0 ? 1 : -1;
              b.dy = (dy >= 0 ? 1 : -1) * azar(30, 90);
              b.quieta = 0.02;
            } else {
              if (Math.random() < 0.3) b.mira *= -1;
              b.dy = azar(-20, 20);
              b.quieta = azar(1.2, 3.5);
            }
          }
        }
        if (b.huye && d > 1100) bichos.splice(i, 1);
      } else if (b.tipo === "pinzon") {
        if (!b.vuela && (d < 220 || pel || (jug.paso === 3 && d < 360))) {
          b.vuela = true;
          const an = Math.atan2(dy, dx) + azar(-0.6, 0.6);
          b.vx = Math.cos(an) * azar(220, 320);
          b.vy = Math.sin(an) * azar(80, 160);
          b.mira = b.vx >= 0 ? 1 : -1;
          if (window.SONIDO && Math.random() < 0.5) SONIDO.tono("triangle", 2600, 3400, 0.08, 0.02, { x: b.x, y: b.y, filtro: 5000 });
        }
        if (b.vuela) {
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.alto += 160 * dt;
          if (b.alto > 360) bichos.splice(i, 1);
        } else if (Math.random() < dt * 0.8) {
          // salta un pasito y picotea
          b.x += azar(-8, 8);
          if (Math.random() < 0.3) b.mira *= -1;
        }
      } else if (b.tipo === "mariposa") {
        if (!b.meta || Math.hypot(b.meta[0] - b.x, b.meta[1] - b.y) < 12) b.meta = [b.casa[0] + azar(-140, 140), b.casa[1] + azar(-70, 70)];
        const mx = b.meta[0] - b.x,
          my = b.meta[1] - b.y,
          md = Math.hypot(mx, my) || 1;
        const huir = d < 120 ? 1 : 0;
        b.x += ((mx / md) * 50 + Math.sin(b.t * 5) * 30 + (huir * dx) / d * 120) * dt;
        b.y += ((my / md) * 30 + Math.cos(b.t * 4) * 20 + (huir * dy) / d * 80) * dt;
        if (n > 0.45 || lluvia > 0.3) b.t = Math.max(b.t, 118);
      }
    }
    // bandadas que cruzan el cielo (al atardecer, cuervos)
    proxBandada -= dt;
    if (proxBandada <= 0 && n < 0.7 && lluvia < 0.6) {
      proxBandada = azar(28, 60);
      const dir = Math.random() < 0.5 ? 1 : -1,
        cuervos = A.amb().o > 0.3 || n > 0.3;
      const ancho = vista.x1 - vista.x0;
      bandadas.push({ x: dir > 0 ? vista.x0 - 300 : vista.x1 + 300, y: vista.y0 + azar(0.1, 0.8) * (vista.y1 - vista.y0), vx: dir * azar(260, 360) * Math.max(1, ancho / 2000), vy: azar(-60, 60), n: cuervos ? 4 + ((Math.random() * 4) | 0) : 6 + ((Math.random() * 5) | 0), t: 0, cuervos, sem: Math.random() * 99 });
      if (cuervos && window.SONIDO && Math.random() < 0.5) SONIDO.tocar("cuervos", { vol: 0.25 });
    }
    for (let i = bandadas.length - 1; i >= 0; i--) {
      const b = bandadas[i];
      b.t += dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.t > 16) bandadas.splice(i, 1);
    }
  }
  function mariposaEn(x, y) {
    if (bichos.filter((b) => b.tipo === "mariposa").length > 8) return;
    bichos.push({ tipo: "mariposa", x, y: y - 40, casa: [x, y - 40], t: azar(0, 3), col: ["#F5A524", "#F2ECEC", "#FF8D71", "#73D5DB", "#FFD98A"][(Math.random() * 5) | 0], sem: Math.random() * 9 });
  }
  // pájaros en V, chiquitos; lo que va en el piso es su sombra
  function dibujarBandada(c, b, T, sombra) {
    for (let k = 0; k < b.n; k++) {
      const fila = Math.ceil(k / 2),
        lado = k % 2 ? 1 : -1;
      const x = b.x - Math.sign(b.vx) * fila * 34 + Math.sin(T * 2 + k) * 4,
        y = b.y + lado * fila * 22 + Math.cos(T * 1.7 + k) * 3,
        ala = Math.sin(T * (b.cuervos ? 9 : 14) + k * 1.3) * (b.cuervos ? 8 : 6),
        s = b.cuervos ? 1.5 : 1;
      if (sombra) {
        c.globalAlpha = 0.16;
        DIB.P(c, [x - 10 * s, y + ala * 0.3, x, y + 3, x + 10 * s, y + ala * 0.3, x, y - 2], "#000000");
      } else {
        const by = y - 300;
        c.globalAlpha = 1;
        DIB.P(c, [x - 11 * s, by - ala, x - 2, by - 1, x, by + 3, x + 2, by - 1, x + 11 * s, by - ala, x, by - 3], b.cuervos ? "#111111" : "#3A2E22");
      }
    }
  }

  // ---------- eventos que mandan los sistemas ----------
  function evento(tipo, x, y, op = {}) {
    const nv = nivel(),
      k = nv === "alta" ? 1 : nv === "media" ? 0.6 : 0.3,
      cant = (n) => Math.max(2, Math.round(n * k));
    if (tipo === "cofre") {
      const imp = op.importante;
      for (let i = 0; i < cant(imp ? 46 : 16); i++) emitir({ x: x + azar(-20, 20), y: y - 20, vx: azar(-170, 170), vy: azar(-420, -200), g: 520, arrastre: 0.8, dur: azar(1, 1.8), forma: "rombo", col: ORO[i % 3], s: azar(2.5, 4.5), vr: azar(-6, 6), achica: true, aura: true, pri: true });
      anillo(x, y, imp ? 220 : 120, "#FFD98A", { ancho: 4 });
      if (imp) {
        ["fehu", "othala", "wunjo", "jera"].forEach((r, i) => emitir({ x: x + (i - 1.5) * 34, y: y - 60, vy: -40, dur: 2.4, forma: "runa", runa: r, col: "#FFD98A", s: 18, ond: 6, of: 1.5, aura: true, pri: true, espera: i * 0.12 }));
        for (let i = 0; i < cant(18); i++) emitir({ x: x + azar(-60, 60), y: y + azar(-20, 10), vy: azar(-50, -20), dur: azar(2.5, 4), forma: "cuad", col: Math.random() < 0.5 ? "#FFF4D0" : RUNICO_CLARO, s: 2.4, ond: 10, aura: true, pri: true, espera: 0.3 });
        luzBreve(x, y - 40, 520, "#FFD98A", 2.6);
        J.sacudir && J.sacudir(0.12);
      } else luzBreve(x, y - 30, 280, "#FFD98A", 1.2);
    } else if (tipo === "piedra" || tipo === "rito") {
      const col = op.col || RUNICO;
      for (let i = 0; i < cant(36); i++) emitir({ x: x + azar(-24, 24), y: y + azar(-10, 40), vx: azar(-30, 30), vy: azar(-380, -160), arrastre: 1.2, dur: azar(1.6, 2.6), forma: "rombo", col: Math.random() < 0.6 ? col : "#F2ECEC", s: azar(2, 4), vr: azar(-3, 3), achica: true, aura: true, pri: true });
      for (let i = 0; i < cant(8); i++) emitir({ x: x + azar(-50, 50), y: y + azar(-20, 30), vy: azar(-46, -24), dur: 3.4, forma: "runa", runa: op.runa || FUTHARK.NOMBRES[(Math.random() * 24) | 0], col, s: azar(14, 22), ond: 8, of: 1.2, aura: true, pri: true, espera: i * 0.15 });
      anillo(x, y + 60, 260, col, { ancho: 5, dur: 1.2 });
      anillo(x, y + 60, 420, col, { ancho: 3, dur: 1.6, espera: 0.25 });
      luzBreve(x, y, 620, col, 4);
    } else if (tipo === "liberada") {
      // el bosque respira: una ola de vida que se abre desde el campamento, flores y mariposas que vuelven
      const R0 = op.r || 600;
      for (let i = 0; i < cant(70); i++) {
        const an = Math.random() * TAU,
          rr = Math.sqrt(Math.random()) * R0;
        emitir({ x: x + Math.cos(an) * rr, y: y + Math.sin(an) * rr * 0.5, vy: azar(-70, -30), dur: azar(1.8, 3), forma: Math.random() < 0.5 ? "rombo" : "cuad", col: ["#7BC86C", "#FFD98A", "#FFF4D0", "#BFF7D6"][i % 4], s: azar(2, 3.6), ond: 8, of: 1.6, aura: true, pri: true, espera: (rr / R0) * 1.2 });
      }
      anillo(x, y, R0 * 1.3, "#7BC86C", { ancho: 5, dur: 1.6 });
      for (let i = 0; i < 12; i++) {
        const an = (i / 12) * TAU + Math.random() * 0.4,
          rr = azar(0.2, 0.9) * R0 * 0.6;
        const fx = x + Math.cos(an) * rr,
          fy = y + Math.sin(an) * rr * 0.5;
        if (W.sueloEn(fx, fy) === 0) flores.push({ x: fx, y: fy, sem: Math.random() * 9, t: -(rr / R0) * 1.2, dur: 150 });
      }
      for (let i = 0; i < 5; i++) mariposaEn(x + azar(-200, 200), y + azar(-100, 100));
      luzBreve(x, y, 700, "#7BC86C", 3);
      HUD.aviso(t("vd.liberada"), "#7BC86C");
      if (window.SONIDO) [523, 659, 784, 1046].forEach((f, i) => SONIDO.tono("triangle", f, f * 1.01, 0.8, 0.04, { x, y, filtro: 2600, retraso: i * 0.12 }));
    } else if (tipo === "runa") {
      const col = RUNA_COL[op.runa] || RUNICO;
      for (let i = 0; i < cant(26); i++) {
        const an = (i / 26) * TAU;
        emitir({ x: x + Math.cos(an) * 30, y: y - 40 + Math.sin(an) * 14, vx: Math.cos(an + 1.2) * 160, vy: Math.sin(an + 1.2) * 70 - 60, arrastre: 2, dur: 0.9, forma: "rombo", col: i % 3 ? col : "#F2ECEC", s: azar(2, 3.4), achica: true, aura: true, pri: true });
      }
      if (op.runa) emitir({ x, y: y - 150, vy: -30, dur: 1.4, forma: "runa", runa: op.runa, col, s: 34, aura: true, pri: true });
      luzBreve(x, y - 40, 420, col, 0.9);
    } else if (tipo === "mision" || tipo === "nivel") {
      for (let i = 0; i < cant(34); i++) emitir({ x: x + azar(-80, 80), y: y - azar(160, 240), vx: azar(-40, 40), vy: azar(-60, 20), g: 160, arrastre: 1, dur: azar(1.4, 2.4), forma: "cuad", col: [...ORO, "#FF8D71"][i % 4], s: azar(3, 5), vr: azar(-8, 8), pri: true });
      emitir({ x, y: y - 170, vy: -24, dur: 1.8, forma: "runa", runa: tipo === "nivel" ? "tiwaz" : "wunjo", col: "#FFD98A", s: 28, aura: true, pri: true });
      luzBreve(x, y - 60, 360, "#FFD98A", 1.4);
    } else if (tipo === "lugar") {
      for (let i = 0; i < cant(20); i++) emitir({ x: x + azar(-60, 60), y: y + azar(-10, 10), vy: azar(-90, -40), dur: azar(1.4, 2.2), forma: "rombo", col: i % 2 ? "#FFD98A" : "#E0B2B2", s: 2.6, achica: true, ond: 10, aura: true, pri: true });
      anillo(x, y, 200, "#FFD98A");
    } else if (tipo === "lider") {
      for (let i = 0; i < cant(20); i++) emitir({ x: x + azar(-30, 30), y: y - azar(10, 60), vx: azar(-40, 40), vy: azar(-110, -50), dur: azar(1.4, 2.4), forma: i % 3 ? "cuad" : "rombo", col: i % 2 ? "#C8402D" : "#5E130D", s: azar(2.5, 4.5), vr: azar(-4, 4), achica: true, pri: true });
      for (let i = 0; i < 4; i++) emitir({ x: x + azar(-20, 20), y: y - 30, vy: -26, dur: 2.6, forma: "humo", col: "#2A2420", s: 26, capa: "aire", a2: 0.3, pri: true });
    } else if (tipo === "sanar") {
      emitir({ x: x + azar(-22, 22), y: y - azar(20, 90), vy: azar(-40, -20), dur: 1.2, forma: Math.random() < 0.3 ? "rombo" : "cuad", col: Math.random() < 0.6 ? "#7BC86C" : "#BFF7D6", s: azar(2, 3), ond: 4, aura: true });
    }
  }

  // ---------- capas de dibujo ----------
  function fondo(c, x0, y0, x1, y1) {
    vista = { x0, y0, x1, y1 };
    const nv = nivel(),
      T = J.t,
      amb = A.amb();
    // manchas de sol entre las copas y la sombra de las hojas (de día, donde hay bosque)
    if (nv !== "baja" && amb.n < 0.6) {
      const f = (1 - amb.n / 0.6) * (1 - lluvia * 0.9);
      c.save();
      celdas(360, 80, (gx, gy, bx, by) => {
        const b = bosqueEn(gx, gy, 360);
        if (b < 0.15) return;
        for (let i = 0; i < (nv === "alta" ? 4 : 2); i++) {
          const x = bx + h3(gx, gy, i + 20) * 360 + Math.sin(T * 0.5 + i + gx) * 8,
            y = by + h3(gx, gy, i + 30) * 360 + Math.cos(T * 0.4 + i + gy) * 4,
            r = 26 + h3(gx, gy, i + 40) * 40;
          if (W.sueloEn(x, y) !== 0) continue;
          if (i % 2) {
            c.globalAlpha = 0.09 * f * b;
            DIB.P(c, poli(x, y, r * 1.3, r * 0.5, 9, i), "#000000");
          } else {
            c.globalAlpha = (0.07 + 0.03 * Math.sin(T * 0.7 + i * 3 + gx)) * f * b;
            DIB.P(c, poli(x, y, r, r * 0.42, 9, i + 1), "#FFE7A8");
          }
        }
      });
      c.restore();
    }
    // flores del despertar
    c.globalAlpha = 1;
    for (const fl of flores) {
      if (fl.t < 0 || !enVista(fl.x, fl.y)) continue;
      const crece = Math.min(1, fl.t / 2) * Math.min(1, (fl.dur - fl.t) / 6);
      ASSETS.dibujar(c, "floresDespertar", fl.x, fl.y, T, { s: 1, crece, sem: fl.sem });
    }
    // anillos en el piso
    for (const p of parts) if (p.capa === "piso") dibujarParte(c, p, nv);
    // sombras de las bandadas y de lo que vuela
    for (const b of bandadas) dibujarBandada(c, b, T, true);
    c.globalAlpha = 1;
  }
  function objetos(lista, visible, c) {
    const T = J.t;
    for (const b of bichos) {
      if (!visible(b.x, b.y)) continue;
      if (b.tipo === "liebre") lista.push({ y: b.y, f: () => ASSETS.dibujar(c, "liebre", b.x, b.y, T, { s: 1, mira: b.mira, salto: b.salto }) });
      else if (b.tipo === "pinzon") lista.push({ y: b.y, f: () => ASSETS.dibujar(c, "pinzon", b.x, b.y, T, { s: 1, mira: b.mira, alto: b.alto, vuela: b.vuela, picotea: !b.vuela }) });
      else if (b.tipo === "mariposa") lista.push({ y: b.y + 40, f: () => ASSETS.dibujar(c, "mariposa", b.x, b.y, T, { s: 1, col: b.col, sem: b.sem }) });
    }
  }
  function aire(c, x0, y0, x1, y1) {
    const nv = nivel(),
      T = J.t,
      amb = A.amb();
    c.save();
    campoPolen(c, T, amb.n, nv);
    for (const p of parts) if (p.capa === "aire") dibujarParte(c, p, nv);
    // las bandadas, arriba
    for (const b of bandadas) dibujarBandada(c, b, T, false);
    // sombras de nubes que pasan (de día, alta)
    if (nv === "alta" && amb.n < 0.7) {
      const f = (1 - amb.n / 0.7) * (0.6 + lluvia * 0.8);
      celdas(2400, 1200, (gx, gy, bx, by) => {
        if (h3(gx, gy, 77) > 0.55) return;
        const x = bx + h3(gx, gy, 78) * 2400 + ((T * (viento + 10)) % 4800) - 2400,
          y = by + h3(gx, gy, 79) * 2400,
          r = 500 + h3(gx, gy, 80) * 500;
        if (x + r < x0 || x - r > x1 || y + r < y0 || y - r > y1) return;
        c.globalAlpha = 0.07 * f;
        DIB.P(c, poli(x, y, r, r * 0.5, 11, h3(gx, gy, 81) * 6, [1, 0.85, 1.1, 0.9, 1, 0.8, 1.05, 0.95, 1, 0.88, 1.08]), "#0A0E14");
        c.globalAlpha = 0.05 * f;
        DIB.P(c, poli(x + r * 0.2, y, r * 0.7, r * 0.34, 9, 1), "#0A0E14");
      });
    }
    // la lluvia: trazos que caen inclinados y aros en el piso
    if (lluvia > 0.02 && nv !== "baja") {
      const n0 = Math.round((nv === "alta" ? 220 : 90) * lluvia),
        w = x1 - x0,
        h = y1 - y0;
      c.globalAlpha = 0.35;
      c.strokeStyle = "#C8DCE0";
      c.lineWidth = 1.6;
      c.beginPath();
      for (let i = 0; i < n0; i++) {
        const sx = h3(i, 1, 9),
          v = 0.8 + h3(i, 2, 9) * 0.4,
          q = (T * 1.3 * v + h3(i, 3, 9)) % 1;
        const x = x0 + ((sx * w + q * 120) % w),
          y = y0 + q * (h + 200) - 100;
        c.moveTo(x, y);
        c.lineTo(x - 8, y - 30);
      }
      c.stroke();
      c.globalAlpha = 0.12 * lluvia;
      c.fillStyle = "#1E2A34";
      c.fillRect(x0, y0, w, h);
    }
    c.restore();
  }
  function sobreLuz(c, x0, y0, x1, y1) {
    const nv = nivel(),
      T = J.t,
      amb = A.amb();
    c.save();
    campoAgua(c, T, amb.n, nv);
    campoRocio(c, T, amb.h, nv);
    aguaViva(c, T, amb.n, nv, J.dtVida || 0.016);
    campoLuciernagas(c, T, amb.n, nv);
    polillas(c, T, amb.n);
    buhos(c, T, amb.n, J.dtVida || 0.016);
    rondaAlfar(c, T, amb.n);
    for (const p of parts) if (p.capa === "luz") dibujarParte(c, p, nv);
    dibujarGuia(c, T);
    c.restore();
  }

  // ---------- el sistema ----------
  const enZona = () => !!(window.ZONAS && ZONAS.aqui());
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      ubicarMisticos();
    },
    alEmpezar(extra) {
      extra.vida = Object.assign({ anillo: -1, poza: false }, extra.vida || {});
      st = extra.vida;
      parts.length = 0;
      bichos.length = 0;
      flores.length = 0;
      guia = null;
      gruposVistos.clear();
      ultimoHp = jug.hp;
    },
    actualizar(dt) {
      J.dtVida = dt;
      const nv = nivel(),
        amb = A.amb();
      // el clima va cambiando suave
      const cl = climaDe(A.H.E.tiempo);
      lluvia += (cl.ll - lluvia) * Math.min(1, dt * 0.4);
      bruma += (cl.br - bruma) * Math.min(1, dt * 0.4);
      // ráfagas de viento: cruzan hojas y suben el viento un rato
      proxRafaga -= dt;
      if (proxRafaga <= 0) {
        proxRafaga = azar(25, 55);
        rafaga = { t: 0, dur: 3.5, dir: Math.random() < 0.5 ? -1 : 1 };
      }
      if (rafaga) {
        rafaga.t += dt;
        const q = rafaga.t / rafaga.dur;
        viento = 12 + Math.sin(q * Math.PI) * 120 * rafaga.dir;
        if (nv !== "baja" && Math.random() < dt * 16 * Math.sin(q * Math.PI)) {
          const y = vista.y0 + Math.random() * (vista.y1 - vista.y0);
          emitir({ x: rafaga.dir > 0 ? vista.x0 - 20 : vista.x1 + 20, y, vx: rafaga.dir * azar(260, 420), vy: azar(-30, 30), dur: 6, forma: "hoja", col: Math.random() < 0.3 ? "#C9A45A" : "#667D38", col2: "#84963F", s: azar(4, 6), vr: azar(-6, 6), ond: 20, of: 3, capa: "aire" });
        }
        if (q >= 1) rafaga = null;
      } else viento = 12;
      // luces breves
      for (let i = lucesT.length - 1; i >= 0; i--) if ((lucesT[i].t += dt) > lucesT[i].dur) lucesT.splice(i, 1);
      for (const fl of flores) fl.t += dt;
      for (let i = flores.length - 1; i >= 0; i--) if (flores[i].t > flores[i].dur) flores.splice(i, 1);
      if (J.modo !== "juego" && J.modo !== "dialogo") return moverPartes(dt);
      acumEscaneo -= dt;
      if (acumEscaneo <= 0) {
        acumEscaneo = 0.25;
        escanear();
        // los lugares místicos laten más de noche
        MISTICOS.forEach((m) => (m.cosa.o.brillo = Math.max(m.cosa.o.pulso || 0, m.id === "fresnoEcos" ? 0.35 + amb.n * 0.6 : amb.n)));
      }
      MISTICOS.forEach((m) => m.cosa.o.pulso && (m.cosa.o.pulso = Math.max(0, m.cosa.o.pulso - dt * 0.2)));
      emitirAmbiente(dt, nv);
      moverPartes(dt);
      moverBichos(dt, nv);
      moverGuia(dt);
      // la vida que vuelve fuera de pelea se ve en motas verdes
      if (jug.hp > ultimoHp + 0.5 && !jug.muerto) {
        acumSanar += dt;
        if (acumSanar > 0.12 && nv !== "baja") {
          acumSanar = 0;
          evento("sanar", jug.x, jug.y);
        }
      }
      ultimoHp = jug.hp;
      // un campamento liberado cerca: el bosque respira de nuevo
      if (window.HORDAS && HORDAS.grupos)
        HORDAS.grupos.forEach((g) => {
          const antes = gruposVistos.get(g),
            ahora = !!g.muerto;
          if (antes === false && ahora && Math.hypot(g.centro[0] - jug.x, g.centro[1] - jug.y) < 2400) evento("liberada", g.centro[0], g.centro[1], { r: 520 });
          gruposVistos.set(g, ahora);
        });
    },
    // en las zonas del generador (mazmorras, islas: motor/zonas.js) no hay hojas, bichos ni bandadas del bosque
    fondo: (...a) => !enZona() && fondo(...a),
    objetos: (...a) => !enZona() && objetos(...a),
    aire: (...a) => !enZona() && aire(...a),
    sobreLuz: (...a) => !enZona() && sobreLuz(...a),
    luces(dar, x0, y0, x1, y1) {
      for (const l of lucesT) dar({ x: l.x, y: l.y, r: l.r * (0.6 + 0.4 * Math.min(1, l.t * 4)), col: l.col, f: Math.max(0, 1 - l.t / l.dur) });
      for (const [x, y, bl] of luciernagas) dar({ x, y, r: 70, col: "#8CF0B4", f: bl * 0.4 });
      if (guia) dar({ x: guia.x, y: guia.y, r: 200, col: "#8CF0B4", f: 0.9 * (1 - guia.fin / 1.5) });
      MISTICOS.forEach((m) => {
        const o = m.cosa;
        if (o.x < x0 - 600 || o.x > x1 + 600 || o.y < y0 - 600 || o.y > y1 + 700) return;
        const b = o.o.brillo || 0;
        if (m.id === "fresnoEcos") dar({ x: o.x, y: o.y - 120, r: 520, col: RUNICO, f: 0.4 + b * 0.5 });
        else if (m.id === "anilloAlfar") dar({ x: o.x, y: o.y - 20, r: 340, col: "#8CF0B4", f: b * 0.9 });
        else dar({ x: o.x, y: o.y - 34, r: 320, col: "#C8F2F4", f: 0.25 + b * 0.6 });
      });
      for (const [x, y, sellado] of emisores.cofres) dar({ x, y: y - 10, r: 170, col: sellado ? VIOLETA : "#FFD98A", f: 0.5 });
    },
    cercanos(dar) {
      if (A.enPelea()) return;
      MISTICOS.forEach((m) => {
        const o = m.cosa,
          d = Math.hypot(o.x - jug.x, (o.y - jug.y) * 1.2),
          noche = A.noche() > 0.5;
        if (m.id === "fresnoEcos" && d < 200) dar(d, t("vd.fresno_escuchar"), () => escucharFresno(m), o.x, o.y - 160);
        else if (m.id === "anilloAlfar" && d < 140) dar(d, noche ? t("vd.anillo_entrar") : t("vd.anillo_dia"), () => entrarAnillo(m, noche), o.x, o.y - 60);
        else if (m.id === "pozaEstrellas" && d < 190) dar(d, noche ? t("vd.poza_mirar") : t("vd.poza_dia"), () => mirarPoza(m, noche), o.x, o.y - 110);
      });
    },
    alRuna(r, zona) {
      evento("runa", jug.x, jug.y, { runa: r });
    },
    alMorir(e) {
      if (e.lider) evento("lider", e.x, e.y);
    },
  };
  let fresnoT = -999;
  function escucharFresno(m) {
    jug.interactuando = 0.8;
    m.cosa.o.pulso = 1;
    evento("piedra", m.cosa.x, m.cosa.y - 120, { runa: "ansuz" });
    if (J.t - fresnoT < 90) return HUD.aviso(t("vd.fresno_calla"), "#73D5DB");
    fresnoT = J.t;
    const s = secretoCerca(6000);
    if (s && soltarGuia(s)) HUD.aviso(t("vd.fresno_eco"), "lugar", t("vd.fresno_guia"));
    else HUD.aviso(t("vd.fresno_nada"), "#73D5DB");
  }
  function entrarAnillo(m, noche) {
    if (!noche) return HUD.aviso(t("vd.anillo_duermen"), "#8CF0B4");
    const idx = indiceNoche();
    m.cosa.o.pulso = 1;
    if (st.anillo === idx) return HUD.aviso(t("vd.anillo_ya"), "#8CF0B4");
    st.anillo = idx;
    jug.interactuando = 1;
    jug.hp = jug.hpMax;
    jug.sta = jug.staMax;
    evento("rito", m.cosa.x, m.cosa.y - 20, { col: "#8CF0B4", runa: "ingwaz" });
    for (let i = 0; i < 5; i++) mariposaEn(m.cosa.x + azar(-80, 80), m.cosa.y + azar(-30, 30));
    HUD.aviso(t("vd.anillo_bendicion"), "lugar", t("vd.anillo_sub"));
    if (window.ANIMA) ANIMA.gesto("feliz");
    A.H.guardar && A.H.guardar();
  }
  function mirarPoza(m, noche) {
    if (!noche) return HUD.aviso(t("vd.poza_espera"), "#C8F2F4");
    m.cosa.o.pulso = 1;
    evento("piedra", m.cosa.x, m.cosa.y - 40, { col: "#C8F2F4", runa: "dagaz" });
    if (st.poza) return HUD.aviso(t("vd.poza_ya"), "#C8F2F4");
    st.poza = true;
    jug.interactuando = 1;
    if (window.MAPA) MAPA.descubrir(m.cosa.x, m.cosa.y, 9000);
    if (window.PODERES && PODERES.darFragmento) PODERES.darFragmento();
    HUD.aviso(t("vd.poza_vision"), "lugar", t("vd.poza_sub"));
    A.H.guardar && A.H.guardar();
  }
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  // el mapa pregunta por los lugares místicos; el motor por el clima y el viento
  const lugares = () => MISTICOS.map((m) => ({ id: m.id, x: m.cosa.x, y: m.cosa.y, hecho: m.id === "pozaEstrellas" ? st.poza : false }));
  return {
    evento,
    nubes,
    niebla,
    lugares,
    clima: (amb) => Object.assign(amb, { lluvia, bruma }),
    viento: () => Math.min(0.2, Math.abs(viento - 12) / 600 + lluvia * 0.12),
    // para la página de mecánicas: dibujar una partícula suelta
    dibujarParte,
    rombo,
  };
})();
