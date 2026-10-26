// ---------- lo que el editor de mapas cambió en Eikholt (AGREGADOS.eikholt), aplicado sobre PLANO25.armar ----------
// AGREGADOS.eikholt = { quitar: [{ c, x0, y0 }], mover: [{ c, x0, y0, x, y, ry, giro, esc }], poner: [{ id, x, y, o }] }
// (en unidades del mundo de la ciudad, 60 por metro). `c` es la clave de una cosa del plano (PLANO25.clave: su nombre,
// o su id y su lugar); si el plano cambió y ya no está, se toma la del mismo tipo más cerca de x0, y0. Al mover o
// sacar una cosa también se mueven o se sacan sus choques, y lo de la historia que está pegado a una casa (anclas,
// curiosidades, cofres y su patio) la acompaña. Lo puesto son assets del juego (ASSETS.LISTA) con su choque; cada uno lleva `pn`, su lugar en la lista.
(function () {
  "use strict";
  if (!window.PLANO25) return;
  const armar0 = PLANO25.armar;
  const clave = (o) => o.nombre || (o.id || o.tipo) + "@" + Math.round(o.x) + "," + Math.round(o.y);
  const especie = (o) => o.id || (o.nombre || "").replace(/\d+[a-z]?$/, "") || o.tipo;
  // la huella de una cosa en el piso: polígonos y círculos (los mismos que puso el plano)
  function huellas(o) {
    if (o.tipo === "casa") {
      const v = o.casa;
      if (v.huella) {
        const h = v.huella(o.x, o.y, o.ry);
        return typeof h[0][0] === "number" ? [h] : h;
      }
      if (v.pie && !v.piso) {
        const co = Math.cos(o.ry), si = Math.sin(o.ry), [hu, hw] = v.pie;
        return [[[-hu, -hw], [hu, -hw], [hu, hw], [-hu, hw]].map(([u, w]) => [o.x + u * co - w * si, o.y + u * si + w * co])];
      }
    }
    return [];
  }
  const igualPoli = (a, b) => a.length === b.length && Math.abs(a[0][0] - b[0][0]) < 1 && Math.abs(a[0][1] - b[0][1]) < 1;
  // saca sus choques y devuelve cuáles eran (para ponerlos en el lugar nuevo)
  function sacarChoques(p, o) {
    const polys = huellas(o),
      fuera = [];
    for (let i = p.choques.length - 1; i >= 0; i--) {
      const ch = p.choques[i];
      const suyo = ch.poli ? polys.some((q) => igualPoli(q, ch.poli)) : ch.circulo && Math.hypot(ch.circulo[0] - o.x, ch.circulo[1] - o.y) < 6;
      if (suyo) fuera.push(p.choques.splice(i, 1)[0]);
    }
    return fuera;
  }
  function buscar(p, e, usadas) {
    let o = p.cosas.find((q) => q.tipo !== "patio" && !usadas.has(q) && clave(q) === e.c);
    if (o || e.x0 === undefined) return o;
    const esp = e.c.split("@")[0].replace(/\d+[a-z]?$/, "");
    let mejor = null, dm = 400;
    for (const q of p.cosas) {
      if (q.tipo === "patio" || usadas.has(q) || especie(q) !== esp) continue;
      const d = Math.hypot(q.x - e.x0, q.y - e.y0);
      if (d < dm) (dm = d), (mejor = q);
    }
    return mejor;
  }
  // lo de la historia pegado a una casa que se movió: anclas, curiosidades, cofres y lugares dentro de su radio
  function acompanar(p, o, dx, dy, dr, r) {
    const co = Math.cos(dr), si = Math.sin(dr);
    const pasar = (x, y) => {
      const ux = x - o.x, uy = y - o.y;
      return [o.x + dx + ux * co - uy * si, o.y + dy + ux * si + uy * co];
    };
    const cerca = (x, y) => Math.hypot(x - o.x, y - o.y) < r;
    for (const k in p.anclas) if (cerca(p.anclas[k][0], p.anclas[k][1])) p.anclas[k] = pasar(p.anclas[k][0], p.anclas[k][1]);
    for (const k in p.lugares) if (cerca(p.lugares[k][0], p.lugares[k][1])) p.lugares[k] = pasar(p.lugares[k][0], p.lugares[k][1]);
    for (const l of [p.curiosidades || [], p.cofres || []]) for (const q of l) if (cerca(q.x, q.y)) [q.x, q.y] = pasar(q.x, q.y);
    // su patio (el piso de tierra o de arena de enfrente)
    for (const q of p.cosas) if (q.tipo === "patio" && cerca(q.x, q.y)) [q.x, q.y] = pasar(q.x, q.y);
  }
  function aplicar(p, ag) {
    const usadas = new Set();
    for (const e of ag.quitar || []) {
      const o = buscar(p, e, usadas);
      if (!o) continue;
      sacarChoques(p, o);
      p.cosas.splice(p.cosas.indexOf(o), 1);
    }
    for (const e of ag.mover || []) {
      const o = buscar(p, e, usadas);
      if (!o) continue;
      usadas.add(o);
      // lo que era (el editor lo usa para encontrar su entrada)
      o.clave0 = clave(o);
      o.x0 = o.x;
      o.y0 = o.y;
      const tenia = sacarChoques(p, o),
        dx = (e.x ?? o.x) - o.x,
        dy = (e.y ?? o.y) - o.y,
        dr = o.tipo === "casa" && e.ry !== undefined ? e.ry - o.ry : 0;
      if (o.tipo === "casa" && o.casa.huella) acompanar(p, o, dx, dy, dr, (o.casa.radio || (o.casa.pie ? Math.hypot(o.casa.pie[0], o.casa.pie[1]) : 400)) + 200);
      o.x += dx;
      o.y += dy;
      if (o.tipo === "casa") o.ry += dr;
      else {
        o.o = Object.assign({}, o.o);
        if (e.giro !== undefined) o.o.giro = e.giro;
        if (e.esc !== undefined) o.o.esc = e.esc;
      }
      if (!tenia.length) continue;
      const polys = huellas(o);
      if (polys.length) for (const h of polys) p.choques.push({ poli: h });
      else for (const ch of tenia) if (ch.circulo) p.choques.push({ circulo: [o.x, o.y, ch.circulo[2] * (e.esc || 1)] });
    }
    (ag.poner || []).forEach((e, pn) => {
      if (!window.ASSETS || !ASSETS.LISTA[e.id]) return;
      const o = Object.assign({}, e.o);
      p.cosas.push({ tipo: "asset", id: e.id, x: e.x, y: e.y, o, pn });
      const ch = ASSETS.medidas(e.id, o).choque;
      if (ch && ch.r) p.choques.push({ circulo: [e.x, e.y, ch.r] });
      else if (ch && ch.w) {
        const hw = ch.w / 2, hh = ch.h / 2 / ((window.VOL && VOL.K) || 0.8);
        p.choques.push({ poli: [[e.x - hw, e.y - hh], [e.x + hw, e.y - hh], [e.x + hw, e.y + hh], [e.x - hw, e.y + hh]] });
      }
    });
    return p;
  }
  PLANO25.armar = function () {
    const p = armar0.apply(this, arguments),
      ag = window.AGREGADOS && AGREGADOS.eikholt;
    return ag ? aplicar(p, ag) : p;
  };
  // el plano tal cual lo armó la ciudad, sin lo del editor (el editor lo usa para elegir y mover)
  PLANO25.armarBase = armar0;
  PLANO25.aplicarAgregados = aplicar;
  PLANO25.clave = clave;
  PLANO25.huellas = huellas;
})();
