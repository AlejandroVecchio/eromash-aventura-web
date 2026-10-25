// ---------- el bastón rúnico (sistema BASTON, tipo de arma "baston") ----------
// El bastón de seiðr de las völvas: pega con el poder rúnico. Atacar suelta chispas rúnicas (rombos que buscan a la
// criatura más cercana delante); la tercera estalla y lastima alrededor. Cada chispa que toca devuelve un poco de
// energía rúnica (el bastón alimenta a las runas). Corriendo, el paso de niebla: Eromash se corre hacia adelante en
// un parpadeo, sin que nada lo toque. Al caer de un salto, una ola rúnica alrededor. Manteniendo atacar, el **sello**:
// un círculo rúnico en el piso donde apunta que avisa 0,8 s y estalla atando a las criaturas (quedan quietas). El
// daño sale de los golpes por el poder rúnico (J.poderRunico) además del arma. Va con las dos manos.
// Detalle en docs/rpg.md (Armas · Bastón rúnico).
window.BASTON = (function () {
  "use strict";
  let A, J, jug, W;
  const CHISPA = { vel: 900, largo: 760, radio: 16, gira: 4, busca: 420, energia: 2 };
  const SELLO = { largo: 340, radio: 130, aviso: 0.8, dano: 34, ata: 1.4 };
  const PARPADEO = { largo: 230, inv: 0.35 };
  const sin = { arc: 0.01, reach: 1, dano: 0, empuje: 0, sinEstela: true };
  const g = (o) => Object.assign({}, sin, o);
  ARMAS.tipo("baston", {
    combo: [
      g({ wind: 0.14, swing: 0.04, rec: 0.18, mueve: 0.6, conjuro: { dano: 10 } }),
      g({ wind: 0.14, swing: 0.04, rec: 0.18, mueve: 0.6, conjuro: { dano: 10 } }),
      g({ wind: 0.22, swing: 0.04, rec: 0.3, mueve: 0.4, remate: true, conjuro: { dano: 12, estalla: 90, danoEstalla: 16 } }),
    ],
    giro: g({ wind: 0.12, swing: 0.04, rec: 0.3, mueve: 0.3, sello: true }),
    carrera: g({ wind: 0.02, swing: 0.04, rec: 0.12, mueve: 1, parpadeo: true }),
    caida: g({ wind: 0, swing: 0.06, rec: 0.3, caida: true, ola: { radio: 150, dano: 20 } }),
    carga: 0.6,
    coste: 12,
  });
  const esBaston = () => ARMAS.tipoActual() === "baston";
  const poderR = () => J.poderRunico || 1;

  // ---------- pegar con magia ----------
  function pegar(e, base, x, y, empuje, extra) {
    const critico = Math.random() < (J.critProb != null ? J.critProb : 0.1),
      sorpresa = e.estado === "quieto";
    let dano = base * (J.mulDano || 1) * poderR() * (critico ? J.critMult || 1.6 : 1) * (sorpresa ? 1.5 : 1);
    const info = Object.assign({ d: { dano: base, magia: true, runico: true }, critico, sorpresa }, extra || {});
    for (const s of window.SISTEMAS) if (s.modDano && s !== sistema) dano = s.modDano(dano, e, info);
    dano = Math.round(dano);
    A.numero(e.x, e.y - 60, dano, critico ? "#FFD98A" : "#73D5DB", critico);
    const murio = A.CB.golpear(J, e, dano, x, y, empuje);
    window.SISTEMAS.forEach((s) => s.alPegar && s.alPegar(e, dano, info, murio));
    return murio;
  }

  // ---------- chispas ----------
  const chispas = [],
    estallidos = [],
    sellos = [];
  function buscar(x, y, dir) {
    let mejor = null,
      dm = CHISPA.busca;
    for (const e of A.enemigos) {
      if (!e.activo || e.muerto) continue;
      const dx = e.x - x,
        dy = (e.y - y) * 1.25,
        l = Math.hypot(dx, dy);
      if (l > dm) continue;
      let da = Math.atan2(dy, dx) - dir;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      if (Math.abs(da) > 1.2) continue;
      dm = l;
      mejor = e;
    }
    return mejor;
  }
  function conjurar(a) {
    const C = a.d.conjuro;
    chispas.push({ x: jug.x + Math.cos(a.dir) * 30, y: jug.y + (Math.sin(a.dir) * 30) / 1.25, dir: a.dir, d: 0, t: 0, C, rastro: [] });
    if (window.SONIDO) SONIDO.tocar("filo", { vol: 0.3, tono: 1.8, var: 0.1 });
  }
  function moverChispa(ch, dt) {
    ch.t += dt;
    // se tuerce de a poco hacia la criatura más cercana delante
    const obj = buscar(ch.x, ch.y, ch.dir);
    if (obj) {
      let da = Math.atan2((obj.y - ch.y) * 1.25, obj.x - ch.x) - ch.dir;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      ch.dir += Math.max(-CHISPA.gira * dt, Math.min(CHISPA.gira * dt, da));
    }
    ch.rastro.push([ch.x, ch.y]);
    if (ch.rastro.length > 5) ch.rastro.shift();
    const paso = CHISPA.vel * dt,
      nx = ch.x + Math.cos(ch.dir) * paso,
      ny = ch.y + (Math.sin(ch.dir) * paso) / 1.25;
    ch.d += paso;
    if (!W.libre(nx, ny, 4) || ch.d >= CHISPA.largo) return terminar(ch, null);
    ch.x = nx;
    ch.y = ny;
    for (const e of A.enemigos) {
      if (!e.activo || e.muerto) continue;
      if (Math.hypot(e.x - ch.x, (e.y - ch.y) * 1.25) > CHISPA.radio + (e.d.radio || 18)) continue;
      pegar(e, ch.C.dano, ch.x, ch.y, 0.3);
      if (window.PODERES && PODERES.darEnergia) PODERES.darEnergia(CHISPA.energia);
      return terminar(ch, e);
    }
    return true;
  }
  function terminar(ch, tocada) {
    if (ch.C.estalla) {
      estallidos.push({ x: ch.x, y: ch.y, t: 0, r: ch.C.estalla });
      for (const e of A.enemigos) {
        if (!e.activo || e.muerto || e === tocada) continue;
        if (Math.hypot(e.x - ch.x, (e.y - ch.y) * 1.25) < ch.C.estalla + (e.d.radio || 18)) pegar(e, ch.C.danoEstalla, ch.x, ch.y, 0.9);
      }
      if (window.SONIDO) SONIDO.tocar("golpeFuerte", { vol: 0.45, tono: 1.4, x: ch.x, y: ch.y });
    } else estallidos.push({ x: ch.x, y: ch.y, t: 0, r: 26 });
    return false;
  }

  // ---------- el sello ----------
  function ponerSello(a) {
    // donde apunta, hasta SELLO.largo (si hay una criatura cerca de la línea, sobre ella)
    const obj = buscar(jug.x, jug.y, a.dir);
    let x, y;
    if (obj && Math.hypot(obj.x - jug.x, (obj.y - jug.y) * 1.25) < SELLO.largo) {
      x = obj.x;
      y = obj.y;
    } else {
      x = jug.x + Math.cos(a.dir) * SELLO.largo * 0.8;
      y = jug.y + (Math.sin(a.dir) * SELLO.largo * 0.8) / 1.25;
    }
    sellos.push({ x, y, t: 0 });
    if (window.SONIDO && SONIDO.runa) SONIDO.runa(x, y);
  }
  function estallarSello(s) {
    estallidos.push({ x: s.x, y: s.y, t: 0, r: SELLO.radio, grande: true });
    J.sacudir(0.2);
    for (const e of A.enemigos) {
      if (!e.activo || e.muerto) continue;
      if (Math.hypot(e.x - s.x, (e.y - s.y) * 1.25) > SELLO.radio + (e.d.radio || 18)) continue;
      const murio = pegar(e, SELLO.dano, s.x, s.y, 0.2, { sello: true });
      if (!murio) {
        e.aturdido = Math.max(e.aturdido || 0, SELLO.ata);
        e.atada = SELLO.ata;
      }
    }
    if (window.SONIDO) SONIDO.tocar("golpeFuerte", { vol: 0.7, tono: 1.1, x: s.x, y: s.y });
  }

  // ---------- paso de niebla y ola ----------
  function parpadear(a) {
    const dx = Math.cos(a.dir),
      dy = Math.sin(a.dir) / 1.25;
    let l = 0;
    while (l < PARPADEO.largo && W.libre(jug.x + dx * (l + 20), jug.y + dy * (l + 20), 16)) l += 20;
    for (let i = 0; i < 6; i++) J.fx.push({ x: jug.x + (Math.random() - 0.5) * 50, y: jug.y - Math.random() * 100, vx: (Math.random() - 0.5) * 60, vy: -40, t: 0.5, c: "rgba(115,213,219,0.6)", s: 7 });
    jug.x += dx * l;
    jug.y += dy * l;
    jug.inv = Math.max(jug.inv || 0, PARPADEO.inv);
    for (let i = 0; i < 6; i++) J.fx.push({ x: jug.x + (Math.random() - 0.5) * 50, y: jug.y - Math.random() * 100, vx: (Math.random() - 0.5) * 60, vy: -40, t: 0.5, c: "rgba(115,213,219,0.6)", s: 7 });
    if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.4, tono: 1.5 });
  }
  function ola(o) {
    estallidos.push({ x: jug.x, y: jug.y, t: 0, r: o.radio, grande: true });
    for (const e of A.enemigos) {
      if (!e.activo || e.muerto) continue;
      if (Math.hypot(e.x - jug.x, (e.y - jug.y) * 1.25) < o.radio + (e.d.radio || 18)) pegar(e, o.dano, jug.x, jug.y, 1.4);
    }
  }

  // ---------- en la mano ----------
  ARMAS.poseDe("baston", (sp, p, ctx) => {
    const a = p.atk,
      yb = p.y - ctx.jp * 70;
    if (!a || !(a.d.conjuro || a.d.sello)) {
      const alza = p.carga > 0.12 ? Math.min(1, p.carga / 0.6) : 0;
      // apoyado al costado; cargando el sello, levantado
      return { sp: { x: p.x + ctx.lado * 62, y: yb - 96 - ctx.bob - alza * 40 + Math.sin(J.t * 2.4) * 4, ang: -Math.PI / 2 + ctx.lado * (0.1 - alza * 0.1), s: 0.38 }, detras: false };
    }
    // conjurando: el bastón adelante, la punta hacia donde sale la chispa
    const ang = a.dir + ctx.gC,
      k = a.t < a.d.wind ? a.t / a.d.wind : 1;
    return { sp: { x: p.x + Math.cos(ang) * 40 * k, y: yb - 80 + Math.sin(ang) * 30 * k, ang: -Math.PI / 2 + (ang + Math.PI / 2) * 0.55 * k, s: 0.38 }, detras: Math.sin(ang) < -0.3 };
  });

  // ---------- dibujo ----------
  const rombo = (c, x, y, s, col) => DIB.P(c, [x, y - s, x + s, y, x, y + s, x - s, y], col);
  function dibujarChispa(c, ch) {
    ch.rastro.forEach(([rx, ry], i) => {
      const [x, y] = J.vista(rx, ry);
      DIB.alfa(c, 0.15 + i * 0.1, () => rombo(c, x, y - 50, 4 + i, "#73D5DB"));
    });
    const [x, y] = J.vista(ch.x, ch.y),
      g = ch.t * 14;
    c.save();
    c.translate(x, y - 50);
    c.rotate(g);
    if (!window.CALIDAD || CALIDAD.nivel !== "baja") DIB.alfa(c, 0.35, () => rombo(c, 0, 0, ch.C.estalla ? 22 : 16, "#73D5DB"));
    rombo(c, 0, 0, ch.C.estalla ? 11 : 8, "#73D5DB");
    rombo(c, 0, 0, ch.C.estalla ? 5 : 3.5, "#F2ECEC");
    c.restore();
  }
  function dibujarEstallido(c, o) {
    const u = o.t / 0.35,
      r = o.r * (0.4 + u * 0.6);
    DIB.alfa(c, (1 - u) * (o.grande ? 0.7 : 0.5), () => {
      c.strokeStyle = "#73D5DB";
      c.lineWidth = o.grande ? 6 : 3;
      c.beginPath();
      c.ellipse(o.x, o.y, r, r * 0.8, 0, 0, Math.PI * 2);
      c.stroke();
    });
    DIB.alfa(c, (1 - u) * 0.25, () => DIB.E(c, o.x, o.y, r * 0.8, r * 0.64, "#73D5DB"));
  }
  // el sello: el aviso exacto en el piso (el círculo que se va llenando) y la runa que gira
  function dibujarSello(c, s) {
    const u = Math.min(1, s.t / SELLO.aviso);
    DIB.alfa(c, 0.45, () => {
      c.strokeStyle = "#73D5DB";
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(s.x, s.y, SELLO.radio, SELLO.radio * 0.8, 0, 0, Math.PI * 2);
      c.stroke();
    });
    DIB.alfa(c, 0.18 + u * 0.2, () => DIB.E(c, s.x, s.y, SELLO.radio * u, SELLO.radio * 0.8 * u, "#73D5DB"));
    c.save();
    c.translate(s.x, s.y);
    c.scale(1, 0.8);
    c.rotate(s.t * 2);
    DIB.alfa(c, 0.8, () => FUTHARK.dibujar(c, "algiz", 0, 26, 52, "#73D5DB", 4));
    c.restore();
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
      chispas.length = 0;
      estallidos.length = 0;
      sellos.length = 0;
    },
    actualizar(dt) {
      const a = jug.atk;
      if (a && !a.hecho && a.t >= a.d.wind) {
        if (a.d.conjuro) conjurar(a);
        else if (a.d.sello) ponerSello(a);
        else if (a.d.parpadeo) parpadear(a);
        else if (a.d.ola) ola(a.d.ola);
        if (a.d.conjuro || a.d.sello || a.d.parpadeo || a.d.ola) a.hecho = true;
      }
      for (let i = chispas.length - 1; i >= 0; i--) if (!moverChispa(chispas[i], dt)) chispas.splice(i, 1);
      for (let i = estallidos.length - 1; i >= 0; i--) if ((estallidos[i].t += dt) > 0.35) estallidos.splice(i, 1);
      for (let i = sellos.length - 1; i >= 0; i--) {
        const s = sellos[i];
        if ((s.t += dt) >= SELLO.aviso) {
          estallarSello(s);
          sellos.splice(i, 1);
        }
      }
      for (const e of A.enemigos) if (e.atada > 0) e.atada = Math.max(0, e.atada - dt);
    },
    piso(c) {
      sellos.forEach((s) => dibujarSello(c, s));
      estallidos.forEach((o) => dibujarEstallido(c, o));
      // las atadas: un anillo violeta a sus pies
      for (const e of A.enemigos)
        if (e.atada > 0 && !e.muerto)
          DIB.alfa(c, Math.min(1, e.atada) * 0.6, () => {
            c.strokeStyle = "#9A6BD8";
            c.lineWidth = 4;
            c.beginPath();
            c.ellipse(e.x, e.y, (e.d.radio || 20) + 14, ((e.d.radio || 20) + 14) * 0.8, 0, 0, Math.PI * 2);
            c.stroke();
          });
    },
    sobreLuz(c) {
      if (!chispas.length || !J.baseT) return;
      c.save();
      J.baseT();
      chispas.forEach((ch) => dibujarChispa(c, ch));
      c.restore();
    },
    luces(dar) {
      chispas.forEach((ch) => dar({ x: ch.x, y: ch.y - 50, r: ch.C.estalla ? 160 : 110, col: "#73D5DB", f: 0.8 }));
      sellos.forEach((s) => dar({ x: s.x, y: s.y, r: SELLO.radio * 1.4, col: "#73D5DB", f: 0.4 + (s.t / SELLO.aviso) * 0.5 }));
      if (esBaston() && !jug.muerto) dar({ x: jug.x, y: jug.y - 120, r: 90, col: "#73D5DB", f: 0.35 });
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, chispas: () => chispas, sellos: () => sellos, CHISPA, SELLO, PARPADEO };
})();
