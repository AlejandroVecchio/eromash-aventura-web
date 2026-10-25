// ---------- el arco (sistema ARCO, tipo de arma "arco") ----------
// Un arma a distancia con la misma lógica de golpes que las demás (ARMAS.tipo): cada golpe del combo trae `disparo`
// en vez de filo (arc y reach mínimos: el motor no corta nada) y este sistema suelta las flechas apenas termina de
// tensar. Combo: dos flechas rápidas y un abanico de tres; corriendo, una flecha sin frenar; al caer de un salto, una
// lluvia de cinco; manteniendo atacar, el tiro tenso (atraviesa a todos los que cruza, más largo y más fuerte). Las
// flechas se corren un poco solas hacia la criatura más cercana delante (más con mando), pegan como un golpe
// (crítico, sorpresa a la que no te vio, robo de vida, debilidades: modDano y alPegar de los demás sistemas) y se
// quedan clavadas en árboles y rocas. Mientras tensa camina más lento y se ve la línea de tiro en el piso.
// El arco va con las dos manos (sin escudo). Detalle en docs/rpg.md (Armas · Arco).
window.ARCO = (function () {
  "use strict";
  let A, J, jug, W;
  const FLECHA = { vel: 1250, largo: 820, radio: 14 };
  const TENSO = { vel: 1900, largo: 1150, radio: 18 };
  const sin = { arc: 0.01, reach: 1, dano: 0, empuje: 0, sinEstela: true };
  const g = (o) => Object.assign({}, sin, o);
  ARMAS.tipo("arco", {
    combo: [
      g({ wind: 0.14, swing: 0.04, rec: 0.2, mueve: 0.6, disparo: { dano: 12 } }),
      g({ wind: 0.14, swing: 0.04, rec: 0.2, mueve: 0.6, disparo: { dano: 12 } }),
      g({ wind: 0.2, swing: 0.04, rec: 0.3, mueve: 0.45, remate: true, disparo: { dano: 10, n: 3, abre: 0.16 } }),
    ],
    giro: g({ wind: 0.06, swing: 0.04, rec: 0.32, mueve: 0.3, disparo: { dano: 42, tenso: true, empuje: 1.6 } }),
    carrera: g({ wind: 0.08, swing: 0.04, rec: 0.16, mueve: 1, disparo: { dano: 12 } }),
    caida: g({ wind: 0.02, swing: 0.04, rec: 0.3, caida: true, disparo: { dano: 9, n: 5, abre: 0.5 } }),
    carga: 0.7,
    coste: 14,
  });
  const esArco = () => ARMAS.tipoActual() === "arco";

  const flechas = [],
    clavadas = [];
  // hacia dónde sale: se corre solo hacia la criatura más cercana delante (un poco con mouse, más con mando)
  function apuntar(dir) {
    const cono = CONTROLES.mando && CONTROLES.mando() ? 0.5 : 0.18;
    let mejor = null,
      dm = FLECHA.largo;
    for (const e of A.enemigos) {
      if (!e.activo || e.muerto) continue;
      const dx = e.x - jug.x,
        dy = (e.y - jug.y) * 1.25,
        l = Math.hypot(dx, dy);
      if (l > dm) continue;
      let da = Math.atan2(dy, dx) - dir;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      if (Math.abs(da) > cono) continue;
      dm = l;
      mejor = Math.atan2(dy, dx);
    }
    return mejor == null ? dir : mejor;
  }
  function disparar(a) {
    const D = a.d.disparo,
      n = D.n || 1,
      base = apuntar(a.dir),
      it = BOTIN.puesta("arma");
    for (let i = 0; i < n; i++) {
      const dir = base + (n > 1 ? (i / (n - 1) - 0.5) * 2 * D.abre : 0),
        P = D.tenso ? TENSO : FLECHA;
      flechas.push({ x: jug.x + Math.cos(dir) * 30, y: jug.y + (Math.sin(dir) * 30) / 1.25, dir, d: 0, P, dano: D.dano, empuje: D.empuje || 0.35, tenso: !!D.tenso, ya: new Set(), t: 0, tier: it ? ARTE_OBJ.tier(it) : 0 });
    }
    if (window.SONIDO) {
      SONIDO.tocar("tajo", { vol: D.tenso ? 0.6 : 0.4, tono: D.tenso ? 1.25 : 1.7, var: 0.08 });
      SONIDO.tocar("tela", { vol: 0.25, tono: 1.6 });
    }
    if (D.tenso) J.sacudir(0.12);
  }
  function mover(f, dt) {
    f.t += dt;
    const paso = f.P.vel * dt,
      nx = f.x + Math.cos(f.dir) * paso,
      ny = f.y + (Math.sin(f.dir) * paso) / 1.25;
    f.d += paso;
    if (!W.libre(nx, ny, 6)) {
      // se clava en el árbol o la roca
      clavadas.push({ x: f.x, y: f.y, dir: f.dir, t: 0 });
      if (clavadas.length > 30) clavadas.shift();
      if (window.SONIDO) SONIDO.tocar("golpe", { vol: 0.3, tono: 1.6, x: f.x, y: f.y });
      return false;
    }
    f.x = nx;
    f.y = ny;
    if (f.d >= f.P.largo) {
      clavadas.push({ x: f.x, y: f.y, dir: f.dir, t: 0, piso: true });
      return false;
    }
    for (const e of A.enemigos) {
      if (!e.activo || e.muerto || f.ya.has(e)) continue;
      if (Math.hypot(e.x - f.x, (e.y - f.y) * 1.25) > f.P.radio + (e.d.radio || 18)) continue;
      f.ya.add(e);
      pegar(f, e);
      if (!f.tenso) return false; // la común se queda en la primera; la tensa sigue
    }
    return true;
  }
  function pegar(f, e) {
    const sorpresa = e.estado === "quieto",
      critico = Math.random() < (J.critProb != null ? J.critProb : 0.1);
    let dano = f.dano * (J.mulDano || 1) * (sorpresa ? 1.5 : 1) * (critico ? J.critMult || 1.6 : 1);
    const info = { d: { dano: f.dano, flecha: true, remate: f.tenso, empuje: f.empuje }, critico, sorpresa };
    for (const s of window.SISTEMAS) if (s.modDano && s !== sistema) dano = s.modDano(dano, e, info);
    dano = Math.round(dano);
    A.chispa(e.x, e.y - 40);
    A.numero(e.x, e.y - 60, dano, critico ? "#FFD98A" : sorpresa ? "#FF8D71" : null, critico);
    const murio = A.CB.golpear(J, e, dano, f.x - Math.cos(f.dir) * 40, f.y - Math.sin(f.dir) * 32, f.empuje);
    window.SISTEMAS.forEach((s) => s.alPegar && s.alPegar(e, dano, info, murio));
    if (window.SONIDO) SONIDO.tocar(critico || f.tenso ? "golpeFuerte" : "golpe", { vol: 0.5, tono: 1.15, x: e.x, y: e.y });
    J.hitstop = Math.max(J.hitstop || 0, f.tenso ? 0.05 : 0.025);
  }

  // ---------- en la mano ----------
  // la tensión de la cuerda: mientras toma envión el golpe, o mientras carga el tiro tenso
  function tension(p) {
    const a = p.atk;
    if (a && a.d.disparo) return a.t < a.d.wind ? a.t / a.d.wind : 0;
    const G = ARMAS.golpes(null);
    return p.carga > 0.12 ? Math.min(1, p.carga / G.carga) : 0;
  }
  function apuntando(p) {
    if (p.atk && p.atk.d.disparo) return p.atk.dir;
    if (p.carga > 0.12) return A.dirGolpe();
    return null;
  }
  ARMAS.poseDe("arco", (sp, p, ctx) => {
    const k = tension(p),
      dir = apuntando(p);
    DIB_ARMAS.tension = k;
    const yb = p.y - ctx.jp * 70;
    if (dir == null) {
      // suelto en la mano de adelante, la punta hacia abajo
      return { sp: { x: p.x + ctx.lado * 58, y: yb - 64 - ctx.bob + Math.sin(J.t * 2.4) * 4, ang: Math.PI / 2 - ctx.lado * 0.5, s: 0.36 }, detras: false };
    }
    // apuntando: el arco estirado hacia el tiro (girado con la cámara)
    const ang = dir + ctx.gC;
    return { sp: { x: p.x + Math.cos(ang) * 46, y: yb - 64 + Math.sin(ang) * 40, ang, s: 0.4 }, detras: Math.sin(ang) < -0.3 };
  });

  // ---------- dibujo ----------
  function dibujarFlecha(c, f) {
    // en la vista: de la cola a la punta (así sigue bien con la cámara girada)
    const [x0, y0] = J.vista(f.x - Math.cos(f.dir) * 30, f.y - (Math.sin(f.dir) * 30) / 1.25),
      [x1, y1] = J.vista(f.x, f.y),
      ang = Math.atan2(y1 - y0, x1 - x0);
    c.save();
    c.translate(x1, y1 - 50);
    c.rotate(ang + Math.PI / 2);
    c.scale(0.34, 0.34);
    if (f.tenso && (!window.CALIDAD || CALIDAD.nivel !== "baja")) {
      // la estela del tiro tenso
      DIB.alfa(c, 0.35, () => DIB.P(c, [-6, 40, 6, 40, 2, 260, -2, 260], "#FFD98A"));
    }
    DIB_ARMAS.flecha(c, 60, -60, f.tier);
    c.restore();
  }
  function dibujarClavada(c, f) {
    // la flecha clavada: el asta corta saliendo del piso (o del tronco) con las plumas
    const u = Math.min(1, f.t / 0.15),
      dx = -Math.cos(f.dir),
      dy = -Math.sin(f.dir) * 0.8;
    DIB.alfa(c, Math.min(1, (8 - f.t) / 1.5), () => {
      DIB.P(c, [f.x - 2, f.y, f.x + 2, f.y, f.x + dx * 26 * u + 2, f.y + dy * 26 * u - (f.piso ? 10 : 22), f.x + dx * 26 * u - 2, f.y + dy * 26 * u - (f.piso ? 10 : 22)], "#7A5634");
      DIB.P(c, [f.x + dx * 22 - 5, f.y + dy * 22 - (f.piso ? 9 : 20), f.x + dx * 30 + 5, f.y + dy * 30 - (f.piso ? 9 : 20) - 4, f.x + dx * 30, f.y + dy * 30 - (f.piso ? 11 : 24)], "#F2ECEC");
    });
  }
  // la línea de tiro en el piso mientras tensa (rombos que se juntan al tensar)
  function dibujarMira(c) {
    const dir = apuntando(jug),
      k = tension(jug);
    if (dir == null || k <= 0) return;
    const d = apuntar(dir),
      largo = k >= 1 ? TENSO.largo * 0.6 : FLECHA.largo * 0.45;
    DIB.alfa(c, 0.25 + k * 0.35, () => {
      for (let r = 60; r < largo; r += 34) {
        const x = jug.x + Math.cos(d) * r,
          y = jug.y + (Math.sin(d) * r) / 1.25,
          s = 4 + (k >= 1 ? 2 : 0);
        DIB.P(c, [x, y - s, x + s, y, x, y + s, x - s, y], k >= 1 ? "#FFD98A" : "#F2ECEC");
      }
    });
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
      flechas.length = 0;
      clavadas.length = 0;
    },
    actualizar(dt) {
      const a = jug.atk;
      if (a && a.d.disparo && !a.solto && a.t >= a.d.wind) {
        a.solto = true;
        disparar(a);
      }
      // tensando camina más despacio
      if (esArco() && jug.carga > 0.12 && !jug.atk) jug.lento = Math.max(jug.lento || 0, 0.05);
      for (let i = flechas.length - 1; i >= 0; i--) if (!mover(flechas[i], dt)) flechas.splice(i, 1);
      for (let i = clavadas.length - 1; i >= 0; i--) if ((clavadas[i].t += dt) > 8) clavadas.splice(i, 1);
      if (!esArco()) DIB_ARMAS.tension = 0;
    },
    piso(c) {
      clavadas.forEach((f) => dibujarClavada(c, f));
      flechas.forEach((f) => DIB.alfa(c, 0.3, () => DIB.E(c, f.x, f.y, 12, 4, "#000")));
      if (esArco()) dibujarMira(c);
    },
    sobreLuz(c) {
      if (!flechas.length || !J.baseT) return;
      c.save();
      J.baseT();
      flechas.forEach((f) => dibujarFlecha(c, f));
      c.restore();
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, flechas: () => flechas, clavadas: () => clavadas, FLECHA, TENSO, apuntar: (d) => apuntar(d) };
})();
