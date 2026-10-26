// ---------- los tipos de arma y sus golpes (sistema ARMAS) ----------
// Cada tipo de arma trae su propio juego de golpes para el motor (juego.js pide ARMAS.golpes): el combo de tres, la
// estocada corriendo, el golpe al caer de un salto y lo que hace al mantener atacar. La espada es la de siempre. Las
// hachas pegan más lento y más ancho, el tercer golpe es un hachazo que parte el piso, uno de cada tres golpes hace
// sangrar (el sangrado quita de a poco el 40 % del golpe) y cargando se lanza el hacha, que vuela, corta todo lo que
// cruza a la ida y a la vuelta y vuelve sola a la mano (mientras tanto Eromash pelea a puño limpio). Los tipos que
// vienen (arco, lanza, martillo, bastón) se suman con ARMAS.tipo(id, def). Las armas a dos manos (mandobles y hachas
// danesas) ocupan también la mano del escudo, se llevan al hombro, pegan barridos anchos con mucho envión, el tercer
// golpe baja desde arriba y sacude el piso (aturde), y manteniendo atacar Eromash entra en torbellino: gira y avanza
// golpeando todo alrededor mientras le dure la estamina. ARMAS.pose acomoda el arma en la mano de cada tipo.
// Detalle en docs/rpg.md (Armas).
window.ARMAS = (function () {
  "use strict";
  let A, J, jug, W;
  const TIPOS = {};
  function tipo(id, def) {
    TIPOS[id] = def;
  }
  // a puño limpio (mientras el hacha vuela)
  const PUNOS = {
    combo: [
      { wind: 0.05, swing: 0.1, rec: 0.14, arc: 1.4, reach: 62, dano: 7, empuje: 0.3, puno: true },
      { wind: 0.05, swing: 0.1, rec: 0.16, arc: 1.4, reach: 62, dano: 8, empuje: 0.35, puno: true },
    ],
    giro: { wind: 0.05, swing: 0.12, rec: 0.2, arc: 1.6, reach: 70, dano: 12, empuje: 1, puno: true },
    carrera: { wind: 0.04, swing: 0.12, rec: 0.2, arc: 1.2, reach: 80, dano: 12, avanza: 380, empuje: 1.2, puno: true },
    caida: { wind: 0, swing: 0.1, rec: 0.22, arc: Math.PI * 2, reach: 80, dano: 14, empuje: 1.1, giro: true, caida: true, puno: true },
    carga: 99,
    coste: 99,
  };

  // ---------- hachas ----------
  tipo("hacha", {
    combo: [
      { wind: 0.1, swing: 0.16, rec: 0.24, arc: 2.0, reach: 82, dano: 19, empuje: 0.5, hacha: true },
      { wind: 0.1, swing: 0.17, rec: 0.26, arc: 2.2, reach: 86, dano: 22, empuje: 0.55, hacha: true },
      { wind: 0.2, swing: 0.13, rec: 0.36, arc: 1.2, reach: 104, dano: 40, empuje: 1.6, remate: true, grieta: true, hacha: true },
    ],
    giro: { wind: 0.14, swing: 0.06, rec: 0.22, arc: 0.01, reach: 1, dano: 0, lanzar: true },
    carrera: { wind: 0.05, swing: 0.16, rec: 0.28, arc: 1.4, reach: 100, dano: 26, avanza: 380, empuje: 1.5, hacha: true },
    caida: { wind: 0, swing: 0.1, rec: 0.26, arc: Math.PI * 2, reach: 92, dano: 26, empuje: 1.4, giro: true, caida: true, hacha: true },
    carga: 0.55,
    coste: 18,
  });
  // ---------- a dos manos ----------
  // barrido, contrabarrido y el golpe desde arriba que sacude el piso; cargado, el torbellino (TORBELLINO)
  const DOS_MANOS = {
    combo: [
      { wind: 0.22, swing: 0.2, rec: 0.3, arc: 3.2, reach: 124, dano: 17, empuje: 0.9, peso: 1.8, dosManos: true },
      { wind: 0.2, swing: 0.2, rec: 0.32, arc: 3.2, reach: 124, dano: 19, empuje: 0.9, peso: 1.8, dosManos: true },
      { wind: 0.34, swing: 0.12, rec: 0.46, arc: 1.5, reach: 132, dano: 32, empuje: 2.2, remate: true, piso: true, peso: 2.4, dosManos: true },
    ],
    giro: { wind: 0, swing: 0.12, rec: 0.3, arc: Math.PI * 2, reach: 128, dano: 18, empuje: 1.4, giro: true, dosManos: true },
    carrera: { wind: 0.12, swing: 0.18, rec: 0.36, arc: 1.8, reach: 130, dano: 24, avanza: 360, empuje: 1.8, peso: 1.6, dosManos: true },
    caida: { wind: 0, swing: 0.12, rec: 0.36, arc: Math.PI * 2, reach: 120, dano: 30, empuje: 2, giro: true, caida: true, piso: true, dosManos: true },
    carga: 0.45,
    coste: 8,
  };
  tipo("mandoble", DOS_MANOS);
  tipo("hacha2", Object.assign({}, DOS_MANOS, { combo: DOS_MANOS.combo.map((g) => Object.assign({}, g, { hacha: true, grieta: g.piso })) }));
  // el torbellino: un golpe que da toda la vuelta cada 0,3 s mientras se mantiene atacar; gasta estamina y deja andar
  const TORBELLINO = { wind: 0, swing: 0.14, rec: 0.2, arc: Math.PI * 2, reach: 120, dano: 9, empuje: 0.5, giro: true, torbellino: true, mueve: 0.7, dosManos: true },
    TORB = { cada: 0.3, gasto: 26, desde: 0.45 };
  const esDosManos = () => {
    const tp = tipoActual();
    return tp === "mandoble" || tp === "hacha2";
  };

  const SANGRA = { chance: 0.33, parte: 0.4, dura: 3, cada: 0.5 };
  const LANZA = { vel: 1000, vuelve: 1150, largo: 380, dano: 24, radio: 44, empuje: 0.7 };

  const arma = () => (window.BOTIN ? BOTIN.puesta("arma") : null);
  const tipoActual = () => {
    const a = arma();
    return a ? OBJETOS.BASES[a.b].tipo || "espada" : "espada";
  };
  let vuelo = null; // el hacha lanzada
  const grietas = [];
  // otros sistemas pueden dejar la mano vacía (la lanza arrojada): ARMAS.sinArma(fn) con fn() → true mientras tanto
  const vacias = [];
  const manoVacia = () => !!vuelo || vacias.some((f) => f());
  function golpes(def) {
    if (manoVacia()) return PUNOS;
    return TIPOS[tipoActual()] || def;
  }

  // ---------- el hacha lanzada ----------
  function lanzar(dir) {
    const a = arma();
    vuelo = { x: jug.x, y: jug.y, dir, d: 0, vuelta: false, ida: new Set(), vuelto: new Set(), t: 0, it: a };
    if (window.SONIDO) SONIDO.tocar("tajo", { vol: 0.55, tono: 0.75 });
  }
  function moverVuelo(dt) {
    const v = vuelo;
    v.t += dt;
    v.rastro = (v.rastro || []).concat([[v.x, v.y, v.t * 22]]).slice(-3);
    if (!v.vuelta) {
      const paso = LANZA.vel * dt,
        nx = v.x + Math.cos(v.dir) * paso,
        ny = v.y + (Math.sin(v.dir) * paso) / 1.25;
      v.d += paso;
      // choca con un árbol o una roca, o llega al largo: vuelve
      if (!W.libre(nx, ny, 10) || v.d >= LANZA.largo) {
        v.vuelta = true;
        if (!W.libre(nx, ny, 10)) {
          A.chispa(v.x, v.y - 40);
          if (window.SONIDO) SONIDO.tocar("golpe", { vol: 0.5, tono: 1.2, x: v.x, y: v.y });
        }
      } else {
        v.x = nx;
        v.y = ny;
      }
    } else {
      const dx = jug.x - v.x,
        dy = jug.y - v.y,
        d = Math.hypot(dx, dy) || 1,
        paso = Math.min(d, LANZA.vuelve * dt);
      v.x += (dx / d) * paso;
      v.y += (dy / d) * paso;
      if (d < 36) {
        vuelo = null;
        if (window.SONIDO) SONIDO.tocar("filo", { vol: 0.55 });
        jug.atk = null;
        return;
      }
    }
    // un silbido cada vuelta del hacha
    if (window.SONIDO && Math.floor(v.t * 6) !== Math.floor((v.t - dt) * 6)) SONIDO.tocar("tajo", { vol: 0.16, tono: 1.4, x: v.x, y: v.y });
    // corta lo que cruza (una vez a la ida y otra a la vuelta)
    const ya = v.vuelta ? v.vuelto : v.ida;
    for (const e of A.enemigos) {
      if (!e.activo || e.muerto || ya.has(e)) continue;
      if (Math.hypot(e.x - v.x, (e.y - v.y) * 1.25) > LANZA.radio + (e.d.radio || 18)) continue;
      ya.add(e);
      const critico = Math.random() < (J.critProb || 0.1);
      let dano = LANZA.dano * (J.mulDano || 1) * (critico ? J.critMult || 1.6 : 1);
      const info = { d: { dano: LANZA.dano, lanzada: true, hacha: true }, critico };
      for (const s of window.SISTEMAS) if (s.modDano && s !== sistema) dano = s.modDano(dano, e, info);
      dano = Math.round(dano);
      A.chispa(e.x, e.y - 30);
      A.numero(e.x, e.y - 60, dano, critico ? "#FFD98A" : null, critico);
      const murio = A.CB.golpear(J, e, dano, v.x, v.y, LANZA.empuje);
      window.SISTEMAS.forEach((s) => s.alPegar && s.alPegar(e, dano, info, murio));
      if (window.SONIDO) SONIDO.tocar(critico ? "golpeFuerte" : "golpe", { vol: 0.6, x: e.x, y: e.y });
      J.hitstop = Math.max(J.hitstop || 0, 0.035);
    }
  }
  // el hacha en el aire: encima de todo (va alta: no la tapan los arbustos), girando y con una estela de copias
  function dibujarVuelo(c) {
    const v = vuelo,
      it = v.it,
      B = it && OBJETOS.BASES[it.b];
    if (!B) return;
    const una = (x, y, giro, alfa) => {
      c.save();
      c.globalAlpha = alfa;
      c.translate(x, y - 52);
      c.rotate(giro);
      c.scale(0.28, 0.28);
      c.translate(0, 70);
      DIB_ARMAS.dibujar(c, B.arte.forma, B.arte.fam, ARTE_OBJ.tier(it));
      c.restore();
    };
    (v.rastro || []).forEach((r, i) => {
      const [x, y] = J.vista(r[0], r[1]);
      una(x, y, r[2], 0.12 + i * 0.06);
    });
    const [x, y] = J.vista(v.x, v.y);
    una(x, y, v.t * 22, 1);
  }
  // ---------- el torbellino ----------
  let torb = 0; // cuánto lleva girando
  function actualizarTorbellino(dt) {
    const sigue = esDosManos() && !vuelo && CONTROLES.pulsado("atacar") && J.modo === "juego" && !jug.muerto && (jug.carga || 0) >= TORB.desde && jug.sta > 2 && !jug.salto;
    if (!sigue) {
      if (torb > 0 && jug.atk && jug.atk.d.torbellino) jug.atk = null;
      if (torb > 0 && jug.sta <= 2) jug.carga = 0; // sin estamina se corta sin el último giro
      torb = 0;
      return;
    }
    if (!jug.atk || !jug.atk.d.torbellino) {
      jug.atk = { t: 0, d: TORBELLINO, dir: 0, side: 1, pego: false };
      if (window.SONIDO) SONIDO.tocar("tajo", { vol: 0.5, tono: 0.7 });
    }
    torb += dt;
    jug.sta = Math.max(0, jug.sta - TORB.gasto * dt);
    jug.staEspera = 0.6;
    // vuelve a empezar la vuelta: el motor da el golpe de nuevo (con todo lo de un golpe: críticos, robo, sangrado)
    const a = jug.atk;
    if (a.t >= TORB.cada) {
      a.t = 0;
      a.pego = false;
      if (window.SONIDO) SONIDO.tocar("tajo", { vol: 0.32, tono: 0.75 + Math.random() * 0.1 });
    }
    // polvo que levanta el giro
    if (Math.random() < dt * 14 && (!window.CALIDAD || CALIDAD.nivel !== "baja")) {
      const an = Math.random() * Math.PI * 2;
      J.fx.push({ x: jug.x + Math.cos(an) * 90, y: jug.y + Math.sin(an) * 70, vx: -Math.sin(an) * 160, vy: Math.cos(an) * 120 - 40, t: 0.35, c: "rgba(150,130,110,0.5)", s: 6, g: 0.2 });
    }
  }
  // el golpe desde arriba: una onda que sacude el piso
  const ondas = [],
    ONDA = { radio: 170, aturde: 0.6, aturdeFuerte: 0.25 };
  function onda(x, y) {
    ondas.push({ x, y, t: 0 });
    J.sacudir(0.32);
    // la onda tambalea un instante a lo que está cerca (aunque el filo no lo haya tocado)
    for (const e of A.enemigos) {
      if (e.muerto || !e.activo) continue;
      const dx = e.x - x,
        dy = (e.y - y) * 1.25;
      if (dx * dx + dy * dy < ONDA.radio * ONDA.radio) e.aturdido = Math.max(e.aturdido || 0, e.lider || (e.d && e.d.pesado) ? ONDA.aturdeFuerte : ONDA.aturde);
    }
    A.polvareda(x, y, 16);
    if (window.SONIDO) SONIDO.tocar("golpeFuerte", { vol: 0.8, tono: 0.6, x, y });
  }
  function dibujarOnda(c, o) {
    const u = o.t / 0.45,
      r = 30 + u * 130;
    DIB.alfa(c, (1 - u) * 0.7, () => {
      c.strokeStyle = "#F2ECEC";
      c.lineWidth = 6 * (1 - u) + 1;
      c.beginPath();
      c.ellipse(o.x, o.y, r, r * 0.8, 0, 0, Math.PI * 2);
      c.stroke();
    });
    DIB.alfa(c, (1 - u) * 0.35, () => DIB.E(c, o.x, o.y, r * 0.7, r * 0.56, "#2A1E14"));
  }

  // ---------- el arma en la mano: cómo se lleva cada tipo ----------
  // sp = { x, y, ang, s } lo que calculó el motor para la espada; ctx = { face, lado, jp, bob, gC }. Devuelve el nuevo
  // y si va detrás del cuerpo
  // cada tipo puede traer su forma de llevar el arma (ARMAS.poseDe(tipo, fn(sp, p, ctx)), p. ej. el arco)
  const POSES = {};
  function pose(sp, p, ctx) {
    const f = POSES[tipoActual()];
    if (f && !manoVacia() && !p.muerto) return f(sp, p, ctx);
    if (!esDosManos() || manoVacia() || p.muerto) return null;
    const a = p.atk,
      yb = p.y - ctx.jp * 70;
    if (!a) {
      // al hombro: el arma cruzada detrás de la espalda, la punta arriba y atrás
      return { sp: { x: p.x + ctx.lado * 34, y: yb - 104 - ctx.bob + Math.sin(J.t * 2.4) * 3, ang: -Math.PI / 2 - ctx.lado * 0.85, s: 0.42 }, detras: true };
    }
    const d = a.d;
    if (d.torbellino || d.giro) {
      // girando: el arma estirada, dando la vuelta
      const ang = J.t * 16 + ctx.gC;
      return { sp: { x: p.x + Math.cos(ang) * 70, y: yb - 55 + Math.sin(ang) * 56, ang, s: 0.42 }, detras: Math.sin(ang) < 0 };
    }
    if (d.piso) {
      // desde arriba: sube por encima de la cabeza y baja de golpe adelante
      const dir = a.dir + ctx.gC;
      if (a.t < d.wind) {
        const k = a.t / d.wind;
        return { sp: { x: p.x - Math.cos(dir) * 20 * k, y: yb - 120 - 40 * k, ang: -Math.PI / 2 - Math.cos(dir) * 0.3 * k, s: 0.44 }, detras: Math.sin(dir) > 0 };
      }
      const k = Math.min(1, (a.t - d.wind) / d.swing);
      return { sp: { x: p.x + Math.cos(dir) * 96 * k, y: yb - 160 * (1 - k) - 20 + Math.sin(dir) * 60 * k, ang: -Math.PI / 2 + (dir + Math.PI / 2) * k, s: 0.44 }, detras: Math.sin(dir) < -0.3 };
    }
    // barridos: más envión hacia atrás antes de soltar y un radio más largo
    const pr = a.t < d.wind ? -0.4 * (a.t / d.wind) : a.t < d.wind + d.swing ? (a.t - d.wind) / d.swing : 1;
    const ang = a.dir + ctx.gC + a.side * (-d.arc / 2 + d.arc * pr);
    return { sp: { x: p.x + Math.cos(ang) * 74, y: yb - 55 + Math.sin(ang) * 74 * 0.8, ang, s: 0.42 }, detras: Math.sin(ang) < -0.2 };
  }

  // ---------- el sangrado ----------
  function sangrar(e, dano) {
    const tot = dano * SANGRA.parte;
    e.sangra = { t: SANGRA.dura, dps: tot / SANGRA.dura, tick: SANGRA.cada };
  }
  function actualizarSangrado(dt) {
    for (const e of A.enemigos) {
      const s = e.sangra;
      if (!s) continue;
      if (e.muerto || !e.activo) {
        e.sangra = null;
        continue;
      }
      s.t -= dt;
      s.tick -= dt;
      // gotas rojas que caen
      if (Math.random() < dt * 8 && (!window.CALIDAD || CALIDAD.nivel !== "baja")) J.fx.push({ x: e.x + (Math.random() - 0.5) * 20, y: e.y - 30 - Math.random() * 20, vx: (Math.random() - 0.5) * 40, vy: 30, t: 0.4, c: Math.random() < 0.5 ? "#9C2315" : "#C8402D", s: 3 + Math.random() * 2, g: 0.5 });
      if (s.tick <= 0) {
        s.tick += SANGRA.cada;
        const n = Math.max(1, Math.round(s.dps * SANGRA.cada));
        A.numero(e.x + 14, e.y - 50, n, "#C8402D");
        A.CB.golpear(J, e, n, e.x, e.y, 0);
      }
      if (s.t <= 0) e.sangra = null;
    }
  }

  // ---------- las grietas del hachazo ----------
  function dibujarGrieta(c, g) {
    const a = Math.max(0, 1 - g.t / 1.4);
    DIB.alfa(c, a * 0.75, () => {
      c.strokeStyle = "#2A1E14";
      c.lineWidth = 4;
      c.lineCap = "round";
      c.beginPath();
      g.rayas.forEach((r) => {
        c.moveTo(g.x, g.y);
        r.forEach(([x, y]) => c.lineTo(g.x + x, g.y + y));
      });
      c.stroke();
    });
  }
  function grieta(x, y, dir) {
    const rayas = [];
    for (let k = 0; k < 5; k++) {
      const a = dir + (k - 2) * 0.55 + (Math.random() - 0.5) * 0.3;
      const r = [];
      let px = 0,
        py = 0;
      for (let j = 0; j < 3; j++) {
        px += Math.cos(a + (Math.random() - 0.5) * 0.8) * (14 + Math.random() * 12);
        py += (Math.sin(a + (Math.random() - 0.5) * 0.8) * (14 + Math.random() * 12)) * 0.8;
        r.push([px, py]);
      }
      rayas.push(r);
    }
    grietas.push({ x, y, t: 0, rayas });
    A.polvareda(x, y, 10);
    J.sacudir(0.2);
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
    },
    alEmpezar() {
      vuelo = null;
      grietas.length = 0;
      ondas.length = 0;
      torb = 0;
    },
    actualizar(dt) {
      // el golpe cargado del hacha: sale volando apenas termina de tomar envión
      const a = jug.atk;
      if (a && a.d.lanzar && !a.lanzo && a.t >= a.d.wind) {
        a.lanzo = true;
        lanzar(a.dir);
      }
      if (vuelo) moverVuelo(dt);
      actualizarTorbellino(dt);
      for (let i = ondas.length - 1; i >= 0; i--) if ((ondas[i].t += dt) > 0.45) ondas.splice(i, 1);
      actualizarSangrado(dt);
      for (let i = grietas.length - 1; i >= 0; i--) if ((grietas[i].t += dt) > 1.4) grietas.splice(i, 1);
    },
    alPegar(e, dano, info, murio) {
      if (murio || !info || !info.d || !info.d.hacha) return;
      if (info.d.remate || Math.random() < SANGRA.chance) sangrar(e, dano);
    },
    alGolpear(x, y, dir, reach) {
      const a = jug.atk;
      if (!a) return;
      const px = x + Math.cos(dir) * reach * 0.75,
        py = y + (Math.sin(dir) * reach * 0.75) / 1.25;
      if (a.d.grieta) grieta(px, py, dir);
      if (a.d.piso) onda(a.d.giro ? x : px, a.d.giro ? y : py);
    },
    piso(c) {
      grietas.forEach((g) => dibujarGrieta(c, g));
      ondas.forEach((o) => dibujarOnda(c, o));
      if (vuelo) DIB.alfa(c, 0.35, () => DIB.E(c, vuelo.x, vuelo.y, 22, 8, "#000"));
    },
    sobreLuz(c) {
      if (!vuelo || !J.baseT) return;
      c.save();
      J.baseT();
      dibujarVuelo(c);
      c.restore();
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { tipo, poseDe: (id, fn) => (POSES[id] = fn), golpes, tipoActual, pose, esDosManos, girando: () => torb > 0, manoVacia, sinArma: (f) => vacias.push(f), lanzada: () => vuelo, sistema, TIPOS, SANGRA, LANZA, TORB, ONDA };
})();
