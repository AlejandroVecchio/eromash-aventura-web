// ---------- Animación por piezas con huesos (módulo ESQUELETO) ----------
// Un personaje es un esqueleto (huesos padre → hijo) con piezas planas pegadas a cada hueso, siempre las mismas: lo
// que se anima son los huesos, así nada cambia de forma ni de color de un instante al otro. Las animaciones son
// curvas de cada canal de cada hueso (giro en grados, corrimiento, estiramiento) con poses clave en tiempo de 0 a 1;
// entre clave y clave se pasa con una curva suave (Catmull-Rom; en las que se repiten, la vuelta también es suave).
// Las arma el editor de animación (esqueleto.html) y las de humano vienen en comun/humano.js.
//
// Esqueleto (una vista): { huesos: [{ id, padre, x, y, punta: [x, y], derecho, suela }], piezas: [{ hueso, z, formas: [{ pts | d, col }] }],
//   pies: ["pieD", "pieI"] }  · cada hueso en reposo está derecho (sin giro): x, y es dónde nace en su padre y las
//   piezas van en sus coordenadas (los miembros cuelgan hacia +y). El estiramiento de un hueso (sx, sy) estira sus
//   piezas y corre a sus hijos, pero los hijos no lo heredan (así un muslo acortado de frente no achica la bota).
// Animación: { dur (s), bucle, pistas: { vista: { hueso: { r: [[t, v], …], x, y, sx, sy } } } }.
window.ESQUELETO = (function () {
  "use strict";
  const CANALES = ["r", "x", "y", "sx", "sy"];
  const BASE = { r: 0, x: 0, y: 0, sx: 1, sy: 1 };
  const rad = Math.PI / 180;

  // ---------- curvas: el valor de un canal en el instante t (0 a 1) ----------
  function valor(claves, t, bucle) {
    if (bucle) {
      // en una que se repite la clave del 1 es la del 0 de la vuelta siguiente: se deja una sola
      if (claves.length > 1 && claves[claves.length - 1][0] >= 1 && claves[0][0] <= 0) claves = claves.slice(0, -1);
      t = ((t % 1) + 1) % 1;
    }
    const n = claves.length;
    if (!n) return null;
    if (n === 1) return claves[0][1];
    if (bucle) {
      // el tramo donde cae t, contando el que va de la última clave a la primera de la vuelta siguiente
      let i = n - 1;
      if (t >= claves[0][0]) for (let k = 0; k < n - 1; k++) if (t < claves[k + 1][0]) { i = k; break; }
      const at = (k) => [claves[((k % n) + n) % n][0] + Math.floor(k / n), claves[((k % n) + n) % n][1]];
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      if (t < p1[0]) t += 1;
      return hermite(p0, p1, p2, p3, t);
    }
    if (t <= claves[0][0]) return claves[0][1];
    else if (t >= claves[n - 1][0]) return claves[n - 1][1];
    let i = n - 2;
    for (let k = 0; k < n - 1; k++) if (t < claves[k + 1][0]) { i = k; break; }
    const p1 = claves[i], p2 = claves[i + 1];
    // en las puntas la curva llega y sale quieta
    const p0 = i > 0 ? claves[i - 1] : [2 * p1[0] - p2[0], p2[1]];
    const p3 = i + 2 < n ? claves[i + 2] : [2 * p2[0] - p1[0], p1[1]];
    return hermite(p0, p1, p2, p3, t);
  }
  function hermite(p0, p1, p2, p3, t) {
    const h = p2[0] - p1[0];
    if (h <= 0) return p2[1];
    const u = (t - p1[0]) / h;
    // pendientes de Catmull-Rom para tiempos desparejos
    const m1 = ((p2[1] - p0[1]) / Math.max(1e-6, p2[0] - p0[0])) * h, m2 = ((p3[1] - p1[1]) / Math.max(1e-6, p3[0] - p1[0])) * h;
    const u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * p1[1] + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2[1] + (u3 - u2) * m2;
  }

  // ---------- poses: { hueso: { r, x, y, sx, sy } } ----------
  function muestra(anim, vista, t) {
    const pistas = (anim.pistas && (anim.pistas[vista] || anim.pistas[anim.igual && anim.igual[vista]])) || {};
    const pose = {};
    for (const h in pistas) {
      const p = (pose[h] = Object.assign({}, BASE));
      for (const c of CANALES) if (pistas[h][c]) {
        const v = valor(pistas[h][c], t, anim.bucle);
        if (v != null) p[c] = v;
      }
    }
    return pose;
  }
  // mezcla dos poses: k = 0 la primera, 1 la segunda
  function mezclar(a, b, k) {
    const out = {};
    for (const h of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const pa = a[h] || BASE, pb = b[h] || BASE, p = (out[h] = {});
      for (const c of CANALES) p[c] = pa[c] + (pb[c] - pa[c]) * k;
    }
    return out;
  }

  // ---------- huesos: la matriz de cada uno (sin su estiramiento) y la de sus piezas (con él) ----------
  const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  const aplicar = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  function ordenar(esq) {
    if (esq._orden) return esq._orden;
    const porId = {}, orden = [];
    esq.huesos.forEach((h) => (porId[h.id] = h));
    const visto = {};
    const poner = (h) => {
      if (visto[h.id]) return;
      if (h.padre && porId[h.padre]) poner(porId[h.padre]);
      visto[h.id] = true;
      orden.push(h);
    };
    esq.huesos.forEach(poner);
    esq._porId = porId;
    return (esq._orden = orden);
  }
  function armar(esq, pose) {
    const orden = ordenar(esq), M = {}, P = {};
    for (const h of orden) {
      const p = pose[h.id] || BASE, padre = h.padre ? esq._porId[h.padre] : null;
      const mp = padre ? M[padre.id] : [1, 0, 0, 1, 0, 0], ep = padre ? pose[padre.id] || BASE : BASE;
      // nace en su padre (corrido por el estiramiento del padre), se corre, gira y estira sus piezas
      const x = h.x * ep.sx + p.x, y = h.y * ep.sy + p.y, c = Math.cos(p.r * rad), s = Math.sin(p.r * rad);
      // un hueso «derecho» (el escudo) no hereda el giro: queda parado donde lo lleva su padre
      if (h.derecho) {
        const [wx, wy] = aplicar(mp, x, y);
        M[h.id] = [c, s, -s, c, wx, wy];
      } else M[h.id] = mul(mp, [c, s, -s, c, x, y]);
      P[h.id] = mul(M[h.id], [p.sx, 0, 0, p.sy, 0, 0]);
    }
    // los pies al piso: todo se corre para que el punto más bajo de los pies quede en y = 0 (el cuerpo sube y baja
    // solo con lo que hacen las piernas, sin saltos)
    if (esq.pies && esq.pies.length && !pose._suelto) {
      let abajo = -Infinity;
      for (const id of esq.pies) {
        const h = esq._porId[id];
        if (!h) continue;
        for (const q of h.suela || [[0, 0], h.punta || [0, 0]]) abajo = Math.max(abajo, aplicar(P[id], q[0], q[1])[1]);
      }
      const dy = -abajo + (pose._alto || 0);
      if (isFinite(dy)) for (const id in M) { M[id][5] += dy; P[id][5] += dy; }
    }
    return { M, P };
  }
  // dónde queda un punto de un hueso (en sus coordenadas) con la pose
  function punto(esq, pose, hueso, x, y) {
    const { P } = armar(esq, pose);
    return aplicar(P[hueso], x || 0, y || 0);
  }

  // ---------- dibujo: las piezas en su orden (z), cada una con la matriz de su hueso ----------
  const caminos = new WeakMap();
  function camino(f) {
    let p = caminos.get(f);
    if (!p) {
      if (f.d) p = new Path2D(f.d);
      else {
        p = new Path2D();
        p.moveTo(f.pts[0], f.pts[1]);
        for (let i = 2; i < f.pts.length; i += 2) p.lineTo(f.pts[i], f.pts[i + 1]);
        p.closePath();
      }
      caminos.set(f, p);
    }
    return p;
  }
  function dibujar(c, esq, pose, op) {
    op = op || {};
    const { P } = armar(esq, pose), cols = op.colores || esq.colores || {};
    const piezas = esq._z || (esq._z = esq.piezas.map((p, i) => [p, i]).sort((a, b) => (a[0].z || 0) - (b[0].z || 0) || a[1] - b[1]).map((a) => a[0]));
    const T = c.getTransform();
    if (op.sombra !== false) {
      c.fillStyle = "rgba(0,0,0,0.34)";
      c.beginPath();
      c.ellipse(0, 0, op.sombraAncho || 24, 7, 0, 0, Math.PI * 2);
      c.fill();
    }
    for (const pz of piezas) {
      const m = P[pz.hueso];
      if (!m || pz.oculta) continue;
      c.setTransform(T.multiply(new DOMMatrix(m)));
      for (const f of pz.formas) {
        c.fillStyle = cols[f.col] || f.col;
        c.fill(camino(f), f.regla || "nonzero");
      }
    }
    c.setTransform(T);
    return P;
  }

  // ---------- animador: lleva el tiempo de cada animación y pasa de una a otra fundiendo las poses ----------
  function animador(anims) {
    const st = { actual: null, t: 0, antes: null, tAntes: 0, mezcla: 1, durMezcla: 0.15, vel: 1 };
    return {
      st,
      // cambia de animación: la anterior se sigue moviendo un instante y se funde en la nueva
      poner(id, op) {
        op = op || {};
        if (st.actual === id && !op.reiniciar) return;
        if (st.actual && anims[st.actual]) { st.antes = st.actual; st.tAntes = st.t; st.mezcla = 0; st.durMezcla = op.mezcla != null ? op.mezcla : 0.15; }
        st.actual = id;
        st.t = op.desde || 0;
      },
      avanzar(dt, vel) {
        const a = anims[st.actual];
        if (!a) return;
        const v = vel != null ? vel : st.vel;
        st.t += (dt * v) / a.dur;
        if (!a.bucle) st.t = Math.min(1, st.t);
        if (st.antes) {
          const b = anims[st.antes];
          st.tAntes += (dt * v) / b.dur;
          if (!b.bucle) st.tAntes = Math.min(1, st.tAntes);
          st.mezcla += dt / Math.max(0.001, st.durMezcla);
          if (st.mezcla >= 1) st.antes = null;
        }
      },
      terminada() {
        const a = anims[st.actual];
        return !a || (!a.bucle && st.t >= 1);
      },
      pose(vista) {
        const a = anims[st.actual];
        if (!a) return {};
        const p = muestra(a, vista, st.t);
        if (!st.antes) return p;
        const k = st.mezcla, s = k * k * (3 - 2 * k);
        return mezclar(muestra(anims[st.antes], vista, st.tAntes), p, s);
      },
    };
  }

  // ---------- editar: poner o sacar una clave de un canal ----------
  function pista(anim, vista, hueso, canal) {
    anim.pistas = anim.pistas || {};
    const v = (anim.pistas[vista] = anim.pistas[vista] || {});
    const h = (v[hueso] = v[hueso] || {});
    return (h[canal] = h[canal] || []);
  }
  function ponerClave(anim, vista, hueso, canal, t, val, cerca) {
    const p = pista(anim, vista, hueso, canal), e = cerca != null ? cerca : 0.004;
    const k = p.find((q) => Math.abs(q[0] - t) <= e);
    if (k) k[1] = val;
    else {
      p.push([t, val]);
      p.sort((a, b) => a[0] - b[0]);
    }
    // en una que se repite, la clave del 1 es la misma del 0
    if (anim.bucle) {
      const ini = p.find((q) => q[0] === 0), fin = p.find((q) => q[0] === 1);
      if (t <= e && fin) fin[1] = val;
      if (t >= 1 - e && ini) ini[1] = val;
    }
  }
  function sacarClave(anim, vista, hueso, t, cerca) {
    const v = anim.pistas && anim.pistas[vista] && anim.pistas[vista][hueso];
    if (!v) return 0;
    let n = 0;
    for (const c of CANALES) if (v[c]) {
      const antes = v[c].length;
      v[c] = v[c].filter((q) => Math.abs(q[0] - t) > (cerca || 0.004));
      n += antes - v[c].length;
      if (!v[c].length) delete v[c];
    }
    return n;
  }
  // los instantes con alguna clave (de un hueso o de todos)
  function instantes(anim, vista, hueso) {
    const v = (anim.pistas && anim.pistas[vista]) || {}, out = new Set();
    for (const h in v) if (!hueso || h === hueso) for (const c in v[h]) v[h][c].forEach((q) => out.add(Math.round(q[0] * 1000) / 1000));
    return [...out].sort((a, b) => a - b);
  }

  return { CANALES, BASE, valor, muestra, mezclar, armar, punto, dibujar, animador, ponerClave, sacarClave, instantes, ordenar };
})();
