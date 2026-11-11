// ---------- el martillo (sistema MARTILLO, tipo de arma "martillo") ----------
// Pesado y lento, rompe defensas: cada golpe de martillo suma un «machaque» a la criatura y al tercero (o con el
// remate) queda **quebrada** 4 s: recibe ×1,25 de todo lo que la toque, de cualquier arma o runa (se ve un rombo
// partido sobre su cabeza). El combo cierra con un golpe desde arriba que hace temblar el piso alrededor. Corriendo,
// un empujón con el hombro que aturde. Manteniendo atacar, el **trueno**: Eromash golpea el piso y caen rayos sobre
// las cuatro criaturas más cercanas (aturden y quiebran). Se lleva con una mano: el escudo sigue. Detalle en
// docs/rpg.md (Armas · Martillo).
window.MARTILLO = (function () {
  "use strict";
  let A, J, jug, W;
  const QUIEBRA = { golpes: 3, dura: 4, mult: 1.25 };
  const TRUENO = { radio: 280, max: 4, dano: 26, aturde: 0.8 };
  ARMAS.tipo("martillo", {
    combo: [
      { wind: 0.14, swing: 0.16, rec: 0.26, arc: 2.0, reach: 84, dano: 19, empuje: 0.7, machaca: true, peso: 1.4 },
      { wind: 0.14, swing: 0.17, rec: 0.28, arc: 2.1, reach: 86, dano: 21, empuje: 0.75, machaca: true, peso: 1.4 },
      { wind: 0.26, swing: 0.12, rec: 0.4, arc: 1.4, reach: 100, dano: 40, empuje: 2, remate: true, machaca: true, temblor: true, peso: 2.2 },
    ],
    giro: { wind: 0.3, swing: 0.08, rec: 0.36, arc: Math.PI * 2, reach: 90, dano: 16, empuje: 1.6, giro: true, trueno: true, machaca: true, sinEstela: true },
    carrera: { wind: 0.04, swing: 0.16, rec: 0.3, arc: 1.2, reach: 92, dano: 18, avanza: 420, empuje: 2, hombro: true, machaca: true },
    caida: { wind: 0, swing: 0.1, rec: 0.32, arc: Math.PI * 2, reach: 104, dano: 30, empuje: 1.8, giro: true, caida: true, temblor: true, machaca: true },
    carga: 0.65,
    coste: 20,
  });

  // ---------- quebrar ----------
  function machacar(e, d) {
    if (e.muerto) return;
    e.machaca = (e.machaca || 0) + 1;
    if (e.machaca >= QUIEBRA.golpes || d.remate || d.trueno) quebrar(e);
    if (d.hombro) e.aturdido = Math.max(e.aturdido || 0, 0.6);
  }
  function quebrar(e) {
    const nueva = !(e.quebrado > 0);
    e.quebrado = QUIEBRA.dura;
    e.machaca = 0;
    if (nueva) {
      A.textoFlotante(e.x, e.y - 120, I18N.t("ar.quebrada"), "#FF8D71");
      if (window.SONIDO) SONIDO.tocar("golpe", { vol: 0.5, tono: 0.6, x: e.x, y: e.y });
      for (let i = 0; i < 6; i++) J.fx.push({ x: e.x, y: e.y - 70, vx: (Math.random() - 0.5) * 260, vy: -Math.random() * 200, t: 0.4, c: i % 2 ? "#B8BCC4" : "#7E848C", s: 4, g: 0.6 });
    }
  }

  // ---------- temblor (el remate) y trueno ----------
  const anillos = [],
    rayos = [];
  function temblor(x, y, r) {
    anillos.push({ x, y, t: 0, r });
    J.sacudir(0.25);
    A.polvareda(x, y, 12);
    if (window.SONIDO) SONIDO.tocar("golpeFuerte", { vol: 0.7, tono: 0.55, x, y });
  }
  function trueno() {
    temblor(jug.x, jug.y, 1.4);
    const cerca = A.enemigos
      .filter((e) => e.activo && !e.muerto && Math.hypot(e.x - jug.x, (e.y - jug.y) * 1.25) < TRUENO.radio)
      .sort((a, b) => Math.hypot(a.x - jug.x, a.y - jug.y) - Math.hypot(b.x - jug.x, b.y - jug.y))
      .slice(0, TRUENO.max);
    if (!cerca.length) rayos.push(rayo(jug.x + 90, jug.y + 20));
    cerca.forEach((e, i) => {
      rayos.push(rayo(e.x, e.y, i * 0.06));
      const critico = Math.random() < (J.critProb != null ? J.critProb : 0.1);
      let dano = TRUENO.dano * (J.mulDano || 1) * (critico ? J.critMult || 1.6 : 1);
      const info = { d: { dano: TRUENO.dano, trueno: true, rayo: true }, critico };
      for (const s of window.SISTEMAS) if (s.modDano) dano = s.modDano(dano, e, info);
      dano = Math.round(dano);
      A.numero(e.x, e.y - 70, dano, "#73D5DB", critico);
      const murio = A.CB.golpear(J, e, dano, jug.x, jug.y, 0.6);
      if (!murio) {
        e.aturdido = Math.max(e.aturdido || 0, TRUENO.aturde);
        quebrar(e);
      }
      window.SISTEMAS.forEach((s) => s.alPegar && s !== sistema && s.alPegar(e, dano, info, murio));
    });
    if (window.SONIDO) {
      SONIDO.tocar("golpeFuerte", { vol: 0.9, tono: 0.45 });
      if (SONIDO.runa) SONIDO.runa(jug.x, jug.y);
    }
    J.sacudir(0.45);
  }
  // un rayo: una quebrada de puntos que baja del cielo (se arma una vez, con su propio azar)
  function rayo(x, y, demora) {
    const pts = [];
    let px = 0;
    for (let i = 0; i <= 8; i++) {
      pts.push([px, -620 + i * 77.5]);
      px += (Math.random() - 0.5) * 60;
    }
    pts[pts.length - 1][0] = 0;
    return { x, y, t: -(demora || 0), pts };
  }
  function dibujarRayo(c, r) {
    if (r.t < 0) return;
    const u = r.t / 0.35,
      [x, y] = J.vista(r.x, r.y);
    const linea = (w, col, a) =>
      DIB.alfa(c, a * (1 - u), () => {
        c.strokeStyle = col;
        c.lineWidth = w;
        c.lineJoin = "miter";
        c.beginPath();
        r.pts.forEach(([px, py], i) => (i ? c.lineTo(x + px, y + py) : c.moveTo(x + px, y + py)));
        c.stroke();
      });
    if (!window.CALIDAD || CALIDAD.nivel !== "baja") linea(18, "#73D5DB", 0.35);
    linea(6, "#F2ECEC", 1);
    // el destello en el piso
    DIB.alfa(c, 0.5 * (1 - u), () => DIB.E(c, x, y, 50, 18, "#73D5DB"));
  }
  function dibujarAnillo(c, o) {
    const u = o.t / 0.4,
      r = (30 + u * 120) * o.r;
    DIB.alfa(c, (1 - u) * 0.6, () => {
      c.strokeStyle = "#E0B2B2";
      c.lineWidth = 5 * (1 - u) + 1;
      c.beginPath();
      c.ellipse(o.x, o.y, r, r * 0.8, 0, 0, Math.PI * 2);
      c.stroke();
    });
  }
  // el rombo partido sobre la cabeza de la que está quebrada
  function dibujarQuiebre(c, e) {
    const [x, y] = J.vista(e.x, e.y),
      yy = y - (e.d.barra || 80) - 34,
      s = 9,
      a = Math.min(1, e.quebrado / 0.5);
    DIB.alfa(c, a, () => {
      DIB.P(c, [x - 2, yy - s, x - 2, yy + s, x - s - 2, yy], "#FF8D71");
      DIB.P(c, [x + 2, yy - s, x + s + 2, yy, x + 2, yy + s, x + 5, yy + 1, x + 1, yy - 2], "#C8402D");
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
      anillos.length = 0;
      rayos.length = 0;
    },
    actualizar(dt) {
      for (const e of A.enemigos) if (e.quebrado > 0) e.quebrado = Math.max(0, e.quebrado - dt);
      for (let i = anillos.length - 1; i >= 0; i--) if ((anillos[i].t += dt) > 0.4) anillos.splice(i, 1);
      for (let i = rayos.length - 1; i >= 0; i--) if ((rayos[i].t += dt) > 0.35) rayos.splice(i, 1);
    },
    alPegar(e, dano, info, murio) {
      if (!murio && info && info.d && info.d.machaca) machacar(e, info.d);
    },
    // la quebrada recibe más de todo
    modDano(dano, e) {
      return e && e.quebrado > 0 ? dano * QUIEBRA.mult : dano;
    },
    alGolpear(x, y, dir, reach) {
      const a = jug.atk;
      if (!a) return;
      if (a.d.trueno) trueno();
      else if (a.d.temblor) temblor(a.d.giro ? x : x + Math.cos(dir) * reach * 0.7, a.d.giro ? y : y + (Math.sin(dir) * reach * 0.7) / 1.25, a.d.caida ? 1.2 : 0.8);
    },
    piso(c) {
      anillos.forEach((o) => dibujarAnillo(c, o));
    },
    sobreLuz(c) {
      if (!J.baseT) return;
      const q = A.enemigos.filter((e) => e.quebrado > 0 && !e.muerto && e.activo);
      if (!q.length && !rayos.length) return;
      c.save();
      J.baseT();
      q.forEach((e) => dibujarQuiebre(c, e));
      rayos.forEach((r) => dibujarRayo(c, r));
      c.restore();
    },
    luces(dar) {
      rayos.forEach((r) => r.t >= 0 && dar({ x: r.x, y: r.y - 60, r: 320, col: "#73D5DB", f: 1 - r.t / 0.35 }));
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, quebrar, QUIEBRA, TRUENO, rayos: () => rayos };
})();
