// ---------- las sombras de la capital (módulo SOMBRAS25) ----------
// Lo que está parado en Eikholt tira su sombra sobre el piso según la hora: larga y de costado a la mañana y a la
// tarde, corta al mediodía, azulada y corta con la luna. La luz sigue viniendo de arriba a la derecha de la pantalla
// (la cara izquierda de las casas queda en sombra), así que con la vista de entrada la sombra cae hacia la izquierda y
// gira apenas con el sol; el sol está quieto en el mundo, así que al girar la cámara las sombras giran con el piso.
// Cada cosa guarda su huella en el piso (la misma de los choques); la sombra es la huella estirada hacia donde cae, y
// todas se juntan en un solo trazo para que dos que se pisan no se oscurezcan el doble.
// También: el borde oscuro al pie de cada pared (donde la pared toca el piso) y la sombra debajo de los toldos.
// Calidad gráfica: alta = casas, muralla, enseres y árboles · media = solo casas y muralla · baja = nada.
//   SOMBRAS25.iniciar(plano)
//   SOMBRAS25.preparar(cam, h, noche) → { clave, pintar(c, x0, y0, x1, y1) } para VISTA25.capaPiso (o null en baja)
window.SOMBRAS25 = (function () {
  "use strict";
  const BALDE = 1200;
  let baldes = new Map();
  const nivel = () => (window.CALIDAD ? CALIDAD.nivel : "alta");

  const rect = (x, y, ry, hu, hw) => {
    const co = Math.cos(ry),
      si = Math.sin(ry);
    return [[-hu, -hw], [hu, -hw], [hu, hw], [-hu, hw]].map(([u, w]) => [x + u * co - w * si, y + u * si + w * co]);
  };
  const ovalo = (x, y, rx, ry, n = 10) => Array.from({ length: n }, (_, i) => [x + Math.cos((i / n) * Math.PI * 2) * rx, y + Math.sin((i / n) * Math.PI * 2) * ry]);
  // la cáscara convexa (cadena monótona): todas salen con el mismo sentido de giro, así el relleno las une
  function cascara(pts) {
    pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cruz = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [],
      hi = [];
    for (const p of pts) {
      while (lo.length >= 2 && cruz(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
      lo.push(p);
    }
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i];
      while (hi.length >= 2 && cruz(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop();
      hi.push(p);
    }
    lo.pop();
    hi.pop();
    return lo.concat(hi);
  }

  function iniciar(plano) {
    baldes = new Map();
    const poner = (s) => {
      const k = Math.floor(s.x / BALDE) + "," + Math.floor(s.y / BALDE);
      if (!baldes.has(k)) baldes.set(k, []);
      baldes.get(k).push(s);
    };
    for (const o of plano.cosas) {
      if (o.tipo === "patio" || o.piso) continue;
      const nom = o.nombre || "";
      if (o.tipo === "casa") {
        const v = o.casa;
        let polys = null,
          h = v.H ? v.H + (v.alto - v.H) * 0.5 : (v.alto || 0) * 0.8,
          casa = true;
        if (/^muralla/.test(nom) && v.radio) (polys = [rect(o.x, o.y, o.ry, v.radio - 160, 121)]), (h = 340);
        else if (/^atalaya/.test(nom) && v.ancho) (polys = [rect(o.x, o.y, o.ry, v.ancho / 2, v.ancho / 2)]), (h = 640);
        else if (v.huella) polys = v.huella(o.x, o.y, o.ry);
        else if (v.pie) (polys = [rect(o.x, o.y, o.ry, v.pie[0], v.pie[1])]), (casa = false);
        if (!polys || h < 40) continue;
        if (typeof polys[0][0] === "number") polys = [polys]; // los puestos devuelven una sola huella
        // los puestos del mercado: el toldo está arriba y deja el piso de abajo en sombra
        const toldo = "vende" in v;
        for (const p of polys) poner({ x: o.x, y: o.y, pts: p, h: toldo ? h * 0.6 : h, casa, toldo });
      } else if (o.id === "robleGigante") {
        // la copa del Roble: una sombra ancha que cae sobre las raíces y la plaza
        poner({ x: o.x, y: o.y, arbol: true, copa: true, h: 1500, r: 1050 });
      } else if (/^(pino|abedul)$/.test(o.id)) {
        // los árboles: la copa estirada, de pie en el tronco
        const s = (o.o && o.o.s) || 1;
        poner({ x: o.x, y: o.y, arbol: true, h: (o.alto || 300) * 0.9, r: 70 * s });
      }
    }
  }

  // hacia dónde cae la sombra (en la pantalla) y cuánto se estira por cada unidad de alto, según la hora
  function sol(h, noche) {
    const dia = Math.max(0, Math.min(1, (h - 5.5) / 1.5)) * Math.max(0, Math.min(1, (20 - h) / 2));
    const m = Math.max(-1, Math.min(1, (h - 12.5) / 6.5));
    return {
      a: Math.PI - m * 0.5, // a la izquierda, hacia atrás a la mañana y hacia adelante a la tarde
      l: 0.35 + 1.15 * m * m,
      fuerza: 0.26 * dia,
      luna: 0.12 * noche,
    };
  }

  const cacheHull = (s, dx, dy, clave) => {
    if (s.clave === clave) return s.hull;
    let base;
    if (s.copa) base = ovalo(s.x + dx * s.h * 0.55, s.y + dy * s.h * 0.55, s.r, s.r * 0.8, 16);
    else if (s.arbol) base = ovalo(s.x, s.y, s.r, s.r * 0.7, 8).concat(ovalo(s.x + dx * s.h * 0.75, s.y + dy * s.h * 0.75, s.r * 1.4, s.r * 1.4, 10));
    else base = s.pts.concat(s.pts.map(([x, y]) => [x + dx * s.h, y + dy * s.h]));
    s.hull = cascara(base);
    s.clave = clave;
    return s.hull;
  };
  const trazar = (c, pts) => {
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath();
  };

  // ---------- las sombras horneadas en el piso ----------
  // Las sombras no cambian mientras no gire la cámara ni pase la hora: se pintan una sola vez sobre cada baldosa del piso
  // de VISTA25 (que ya está guardada) y después esa baldosa con su sombra se copia como si fuera piso, sin costo por
  // cuadro. preparar() arma la clave de este momento (el rumbo de la sombra en 96 pasos, el largo y la fuerza en
  // escalones, la calidad y lo que se ve a esa distancia); si cambia, VISTA25 repinta las baldosas de a pocas.
  const MARGEN = 2700; // lo más larga que puede ser una sombra
  const G0 = (-28 * Math.PI) / 180; // el giro de la cámara con que se abre la ciudad
  function cercanas(x0, y0, x1, y1, m) {
    const l = [];
    for (let by = Math.floor((y0 - m) / BALDE); by <= Math.floor((y1 + m) / BALDE); by++)
      for (let bx = Math.floor((x0 - m) / BALDE); bx <= Math.floor((x1 + m) / BALDE); bx++) {
        const b = baldes.get(bx + "," + by);
        if (b) for (const s of b) l.push(s);
      }
    return l;
  }
  const hull = (s, dx, dy) => {
    const clave = Math.round(dx * 200) + "," + Math.round(dy * 200);
    if (!s.hk || s.hk.n > 6) s.hk = { n: 0 };
    if (!s.hk[clave]) {
      s.hk[clave] = cacheHull(s, dx, dy, clave);
      s.hk.n++;
    }
    return s.hk[clave];
  };

  function preparar(cam, h, noche) {
    const nv = nivel();
    if (nv === "baja") return null;
    const S = sol(h, noche);
    // el sol está quieto en el mundo (no gira con la cámara): la dirección se mide con el giro de la cámara de entrada,
    // así con la vista de siempre la sombra cae a la izquierda y al girar se queda pegada al piso como todo lo demás (y las
    // baldosas horneadas no se repintan al girar)
    const co = Math.cos(G0),
      si = Math.sin(G0);
    // la dirección de la pantalla pasada al piso del mundo, en 96 rumbos
    const tirar = (a, l) => {
      const vx = Math.cos(a) * l,
        vy = Math.sin(a) * l;
      const ang = Math.round((Math.atan2(-vx * si + vy * co, vx * co + vy * si) / (Math.PI * 2)) * 96) * ((Math.PI * 2) / 96),
        lq = Math.round(l * 20) / 20;
      return [Math.cos(ang) * lq, Math.sin(ang) * lq];
    };
    // lo que de lejos no se dibuja (VISTA25.LEJOS) tampoco tira sombra
    const LJ = VISTA25.LEJOS;
    const banda = cam.esc >= LJ.chico ? 3 : cam.esc >= LJ.arboles ? 2 : cam.esc >= LJ.arbolesTodos ? 1 : 0;
    const deja = (s) => {
      if (s.copa) return nv === "alta";
      if (s.arbol) return nv === "alta" && (banda >= 2 || (banda === 1 && ((s.x * 7 + s.y * 3) & 1) === 0));
      return s.casa || (nv === "alta" && banda === 3);
    };
    const fs = Math.round(S.fuerza * 50) / 50,
      fl = Math.round(S.luna * 1.3 * 50) / 50;
    const ds = fs > 0.01 ? tirar(S.a, S.l) : null,
      dl = fl > 0.01 ? tirar(Math.PI + 0.35, 0.4) : null;
    const clave = [nv, banda, fs, fl, ds && ds.map((v) => v.toFixed(3)), dl && dl.map((v) => v.toFixed(3))].join("|");
    function pintar(c, x0, y0, x1, y1) {
      const l = cercanas(x0, y0, x1, y1, MARGEN).filter(deja);
      const largas = (d, fuerza, col) => {
        c.beginPath();
        for (const s of l) {
          const hl = hull(s, d[0], d[1]);
          // solo las que tocan la baldosa
          let ax = Infinity,
            ay = Infinity,
            bx = -Infinity,
            by = -Infinity;
          for (const p of hl) {
            if (p[0] < ax) ax = p[0];
            if (p[0] > bx) bx = p[0];
            if (p[1] < ay) ay = p[1];
            if (p[1] > by) by = p[1];
          }
          if (bx < x0 || ax > x1 || by < y0 || ay > y1) continue;
          trazar(c, hl);
        }
        c.fillStyle = col + fuerza + ")";
        c.fill();
      };
      // de día el sol; de noche la luna, más corta y azul (las dos se cruzan al alba y al anochecer)
      if (ds) largas(ds, fs, "rgba(22,20,38,");
      if (dl) largas(dl, fl, "rgba(10,18,48,");
      // el pie de cada pared, donde junta el polvo y no llega la luz; y la sombra debajo de los toldos
      const cerca = l.filter((s) => s.x > x0 - 1500 && s.x < x1 + 1500 && s.y > y0 - 1500 && s.y < y1 + 1500);
      c.beginPath();
      for (const s of cerca) if (s.casa) trazar(c, s.pts);
      c.lineJoin = "round";
      c.lineWidth = 34;
      c.strokeStyle = "rgba(14,10,6,0.17)";
      c.stroke();
      c.beginPath();
      for (const s of cerca) if (s.toldo) trazar(c, s.pts);
      c.fillStyle = "rgba(14,10,6,0.22)";
      c.fill();
    }
    return { clave, pintar };
  }

  return { iniciar, preparar, sol };
})();
