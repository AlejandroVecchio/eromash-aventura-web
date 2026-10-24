// ---------- las alturas (sistema ALTURAS) ----------
// El mundo se ve desde arriba en 2.5D: un lugar alto (el adarve de la muralla doble de Eikholt, y los que vengan)
// es un nivel con su huella en el piso (cuadriláteros) y una altura h. Al nivel se sube por escaleras: tiras con un
// eje de abajo (a) a arriba (b) donde la altura crece pareja. Desde el piso no se entra a la huella (es muro);
// arriba solo se camina por la huella y se baja por las escaleras. Eromash se dibuja h más arriba y se ordena
// detrás de lo que tiene delante del muro. Estando arriba, lo de abajo se oscurece y se difumina, y la vista se
// abre un poco (pedido de Alejandro: «que se sienta que estás más alto o más abajo»).
window.ALTURAS = (function () {
  "use strict";
  let A, J, jug, W;
  let NIV = [];
  let velo = 0,
    tPrev = 0;
  const TOL = 14; // diferencia de altura que se pasa de un paso

  // ---------- geometría ----------
  function dentroQuad(p, x, y) {
    // convexo, en cualquier sentido
    let signo = 0;
    for (let i = 0; i < 8; i += 2) {
      const ax = p[i],
        ay = p[i + 1],
        bx = p[(i + 2) % 8],
        by = p[(i + 3) % 8];
      const cr = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
      if (cr !== 0) {
        const s = cr > 0 ? 1 : -1;
        if (signo && s !== signo) return false;
        signo = s;
      }
    }
    return true;
  }
  function quadEn(n, x, y) {
    for (const q of n.quads) if (Math.abs(q.pts[0] - x) < 400 && Math.abs(q.pts[1] - y) < 400 && dentroQuad(q.pts, x, y)) return q;
    return null;
  }
  // posición sobre una escalera: t a lo largo (0 abajo, 1 arriba) y s de costado (en medios anchos)
  function sobre(e, x, y) {
    const dx = e.bx - e.ax,
      dy = e.by - e.ay,
      l2 = dx * dx + dy * dy,
      t = ((x - e.ax) * dx + (y - e.ay) * dy) / l2,
      s = ((x - e.ax) * -dy + (y - e.ay) * dx) / Math.sqrt(l2) / (e.w / 2);
    return { t, s };
  }
  function escaleraEn(x, y) {
    for (const n of NIV)
      for (const e of n.escaleras) {
        const p = sobre(e, x, y);
        if (p.t >= 0 && p.t <= 1 && Math.abs(p.s) <= 1) return { n, e, t: p.t };
      }
    return null;
  }

  // ---------- moverse ----------
  // jug.alto: null (en el piso), { n, q } arriba de un nivel, { n, e } en una escalera
  function probar(dx, dy) {
    const nx = jug.x + dx,
      ny = jug.y + dy;
    const al = jug.alto;
    if (!al) {
      const es = escaleraEn(nx, ny);
      if (!es) return false; // el piso de siempre: lo decide W.libre
      // a la escalera se entra por abajo; por el costado hay baranda
      if (es.t > 0.22) return true;
      jug.alto = { n: es.n, e: es.e };
      jug.x = nx;
      jug.y = ny;
      return true;
    }
    if (al.e) {
      const p = sobre(al.e, nx, ny);
      if (p.t >= 0 && p.t <= 1 && Math.abs(p.s) <= 1) {
        jug.x = nx;
        jug.y = ny;
        return true;
      }
      // contra la baranda: se desliza a lo largo de la escalera
      if (p.t >= 0 && p.t <= 1) {
        const e = al.e,
          l = Math.hypot(e.bx - e.ax, e.by - e.ay),
          s = Math.sign(p.s) * 0.98 * (e.w / 2);
        jug.x = e.ax + (e.bx - e.ax) * p.t + (-(e.by - e.ay) / l) * s;
        jug.y = e.ay + (e.by - e.ay) * p.t + ((e.bx - e.ax) / l) * s;
        return true;
      }
      const z = al.n.h * Math.max(0, Math.min(1, p.t));
      // abajo: vuelve al piso
      if (p.t < 0 && Math.abs(p.s) <= 1.1 && W.libre(nx, ny, 12)) {
        jug.alto = null;
        jug.x = nx;
        jug.y = ny;
        return true;
      }
      // arriba: pasa al adarve
      const q = quadEn(al.n, nx, ny);
      if (q && z >= al.n.h - TOL - 10) {
        jug.alto = { n: al.n, q };
        jug.x = nx;
        jug.y = ny;
      }
      return true;
    }
    // arriba de un nivel
    const q = quadEn(al.n, nx, ny);
    if (q) {
      al.q = q;
      jug.x = nx;
      jug.y = ny;
      return true;
    }
    for (const e of al.n.escaleras) {
      const p = sobre(e, nx, ny);
      if (p.t >= 0 && p.t <= 1.05 && Math.abs(p.s) <= 1 && al.n.h * Math.min(1, p.t) >= al.n.h - TOL - 10) {
        jug.alto = { n: al.n, e };
        jug.x = nx;
        jug.y = ny;
        return true;
      }
    }
    return true; // el borde del adarve
  }
  function mover(dx, dy) {
    if (!NIV.length) return false;
    if (!jug.alto && !escaleraEn(jug.x + dx, jug.y) && !escaleraEn(jug.x, jug.y + dy)) return false;
    probar(dx, 0);
    probar(0, dy);
    calcularZ();
    return true;
  }
  function calcularZ() {
    const al = jug.alto;
    if (!al) jug.z = 0;
    else if (al.e) jug.z = al.n.h * Math.max(0, Math.min(1, sobre(al.e, jug.x, jug.y).t));
    else jug.z = al.n.h;
  }
  // dónde va Eromash en el orden de dibujo: detrás de lo que tiene delante del muro, delante del tramo que pisa
  function orden() {
    const al = jug.alto;
    if (!al) return jug.y;
    if (al.e) return al.e.clave + 0.5;
    return (al.q ? al.q.clave : jug.y) + 0.5;
  }

  // ---------- lo de abajo, oscuro y difuso ----------
  const veloCv = document.createElement("canvas"),
    veloC = veloCv.getContext("2d"),
    difCv = document.createElement("canvas"),
    difC = difCv.getContext("2d");
  function dibujarVelo(c, lienzo, x0, y0, esc, cw, ch) {
    const ahora = J.t,
      dt = Math.min(0.1, Math.max(0, ahora - tPrev));
    tPrev = ahora;
    const meta = jug.alto && jug.z > 40 && !jug.muerto ? Math.min(1, jug.z / 140) : 0;
    velo += (meta - velo) * Math.min(1, dt * 3.5);
    if (velo < 0.02 || (window.CALIDAD && CALIDAD.nivel === "baja")) return;
    // a un cuarto de resolución: al estirarse queda suave y borroso sin filtros caros
    const k = 0.25,
      w = Math.ceil(cw * k),
      h = Math.ceil(ch * k);
    if (veloCv.width !== w || veloCv.height !== h) {
      veloCv.width = difCv.width = w;
      veloCv.height = difCv.height = h;
    }
    // la máscara: todo, menos el adarve cercano (subido h), la escalera y un halo alrededor de Eromash
    const m = veloC;
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.globalCompositeOperation = "source-over";
    m.clearRect(0, 0, w, h);
    m.fillStyle = "#000";
    m.fillRect(0, 0, w, h);
    m.globalCompositeOperation = "destination-out";
    m.setTransform(esc * k, 0, 0, esc * k, -x0 * esc * k, -y0 * esc * k);
    m.fillStyle = "#000";
    const n = jug.alto.n,
      H = n.h;
    for (const q of n.quads) {
      const p = q.pts;
      if (Math.abs(p[0] - jug.x) > 2600 || Math.abs(p[1] - jug.y) > 1800) continue;
      // el adarve y el parapeto que asoma
      m.beginPath();
      m.moveTo(p[0], p[1] - H - 60);
      m.lineTo(p[2], p[3] - H - 60);
      m.lineTo(p[4], p[5] - H - 34);
      m.lineTo(p[6], p[7] - H - 34);
      m.closePath();
      m.fill();
      m.beginPath();
      m.moveTo(p[0], p[1] - H + 6);
      m.lineTo(p[2], p[3] - H + 6);
      m.lineTo(p[4], p[5] - H + 6);
      m.lineTo(p[6], p[7] - H + 6);
      m.closePath();
      m.fill();
    }
    for (const e of n.escaleras) {
      if (Math.abs(e.ax - jug.x) > 2600 || Math.abs(e.ay - jug.y) > 1800) continue;
      const px = -(e.by - e.ay),
        py = e.bx - e.ax,
        l = Math.hypot(px, py),
        ox = (px / l) * e.w * 0.55,
        oy = (py / l) * e.w * 0.55;
      m.beginPath();
      m.moveTo(e.ax - ox, e.ay - oy);
      m.lineTo(e.ax + ox, e.ay + oy);
      m.lineTo(e.bx + ox, e.by + oy - H - 40);
      m.lineTo(e.bx - ox, e.by - oy - H - 40);
      m.closePath();
      m.fill();
    }
    const g = m.createRadialGradient(jug.x, jug.y - jug.z - 50, 30, jug.x, jug.y - jug.z - 50, 200);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    m.fillStyle = g;
    m.fillRect(jug.x - 220, jug.y - jug.z - 270, 440, 440);
    // difuso: una copia borrosa del cuadro, solo donde está la máscara (calidad alta)
    const alta = !window.CALIDAD || CALIDAD.nivel === "alta";
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.imageSmoothingEnabled = true;
    if (alta) {
      difC.setTransform(1, 0, 0, 1, 0, 0);
      difC.globalCompositeOperation = "source-over";
      difC.clearRect(0, 0, w, h);
      difC.drawImage(lienzo, 0, 0, w, h);
      difC.globalCompositeOperation = "destination-in";
      difC.drawImage(veloCv, 0, 0);
      c.globalAlpha = Math.min(1, velo * 1.1);
      c.drawImage(difCv, 0, 0, cw, ch);
    }
    // oscuro: la máscara pintada de azul noche
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.globalCompositeOperation = "source-in";
    m.fillStyle = "rgb(12,16,26)";
    m.fillRect(0, 0, w, h);
    c.globalAlpha = 0.42 * velo;
    c.drawImage(veloCv, 0, 0, cw, ch);
    c.restore();
  }

  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      NIV = W.NIVELES || [];
      jug.alto = null;
      jug.z = 0;
    },
    alEmpezar() {
      jug.alto = null;
      jug.z = 0;
      velo = 0;
    },
    actualizar() {
      if (!NIV.length) return;
      // si quedó parado arriba sin saberlo (cargar la partida, un salto de lugar), se ubica solo
      if (!jug.alto) {
        for (const n of NIV) {
          const q = quadEn(n, jug.x, jug.y);
          if (q) jug.alto = { n, q };
        }
      } else if (jug.alto.q && !quadEn(jug.alto.n, jug.x, jug.y)) {
        const es = escaleraEn(jug.x, jug.y);
        jug.alto = es ? { n: es.n, e: es.e } : null;
      } else if (jug.alto.e && !escaleraEn(jug.x, jug.y)) jug.alto = null;
      calcularZ();
      // arriba se ve más lejos
      if (jug.z > 60) J.alejarA(1 + 0.18 * Math.min(1, jug.z / 170));
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { mover, orden, velo: dibujarVelo, z: () => jug.z || 0, arriba: () => !!(jug && jug.alto && jug.z > 40) };
})();
