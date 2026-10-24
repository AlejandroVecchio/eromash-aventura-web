/* =====================================================================
 * EROMASH · ESPADAS 2D LOW POLY
 * 5 familias × 5 rarezas = 25 espadas clásicas, 25 de mapa y 11 legendarias (61), dibujadas como SVG plano.
 *
 * INSTRUCCIONES PARA CURSOR
 *   EromashEspadas.FAMILIAS            → ['bastarda','ancha','cimitarra','runica','huesos']
 *   EromashEspadas.RAREZAS             → ['comun','poco','raro','epico','leg']
 *   EromashEspadas.lista()             → [{ id, familia, rareza, t, nombre, fl, dano, tipo, vel }] (25 clásicas)
 *   EromashEspadas.lista('costa')      → las 5 del mapa · lista('mapas') → las 25 de mapa · lista('todas') → 61
 *   EromashEspadas.DROP                → qué familia dropea cada mapa (solo esa)
 *   EromashEspadas.lista('legendarias') → las 11 legendarias que caen en cualquier mapa (stats según la oleada)
 *   EromashEspadas.TIPOS               → tipo de arma: nombre, velocidad y animación
 *   EromashEspadas.svg(id, { vista })  → string SVG
 *        vista 'item'     (defecto) cuadrada, espada en diagonal, para inventario / slots
 *        vista 'vertical' la espada parada, punta arriba (para el mostrador o la mano)
 *   EromashEspadas.datos(id)           → datos de la espada (nombre, textos, stats)
 *   Estilo: sin degradés, sin blur, sin curvas. Todo polígono de color plano.
 *   Luz desde arriba a la izquierda: la mitad izquierda de cada pieza es la clara.
 *   Animaciones con steps(): clases .flota .pulso .chispa .gira (el SVG trae su <style>).
 *   Los textos (nombre, fl) salen de js/textos/equipo.js (claves esp.*), en español e inglés.
 * ===================================================================== */
(function (global) {
  "use strict";
  /* textos visibles: todos en js/textos/ (claves esp.*); getters para que cambien en caliente */
  const T_ = (k, v) => (global.I18N ? global.I18N.t(k, v) : k);
  const tx = (o, campo, f) =>
    Object.defineProperty(o, campo, { get: f, enumerable: true, configurable: true });

  /* ---------- color ---------- */
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const hex = (a) =>
    "#" +
    a
      .map((v) =>
        Math.max(0, Math.min(255, Math.round(v)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
      .toUpperCase();
  const sh = (c, k) =>
    hex(k < 0 ? rgb(c).map((v) => v * (1 + k)) : rgb(c).map((v) => v + (255 - v) * k));
  const mix = (a, b, t) => {
    const x = rgb(a),
      y = rgb(b);
    return hex(x.map((v, i) => v + (y[i] - v) * t));
  };

  /* ---------- geometría ---------- */
  const f1 = (n) => (Math.round(n * 10) / 10).toString();
  const pts = (P) => P.map((p) => f1(p[0]) + "," + f1(p[1])).join(" ");
  const P = (points, fill, extra = "") =>
    `<polygon points="${pts(points)}" fill="${fill}"${extra}/>`;
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const mirror = (pp) => pp.map(([x, y]) => [-x, y]);
  const cen = (pp) => {
    let x = 0,
      y = 0;
    pp.forEach((p) => {
      x += p[0];
      y += p[1];
    });
    return [x / pp.length, y / pp.length];
  };
  function clipHalf(pp, o, n) {
    const out = [],
      s = (p) => (p[0] - o[0]) * n[0] + (p[1] - o[1]) * n[1];
    for (let i = 0; i < pp.length; i++) {
      const a = pp[i],
        b = pp[(i + 1) % pp.length],
        sa = s(a),
        sb = s(b);
      if (sa >= 0) out.push(a);
      if (sa >= 0 !== sb >= 0) {
        const t = sa / (sa - sb);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return out;
  }
  const ngon = (cx, cy, r, n, rot = 0, ry) =>
    Array.from({ length: n }, (_, i) => {
      const a = rot + (i * 2 * Math.PI) / n - Math.PI / 2;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * (ry || r)];
    });
  /* pieza facetada: color base + mitad sombra (abajo-derecha) + filo claro opcional arriba-izquierda */
  function pieza(pp, c, o = {}) {
    const k = cen(pp),
      n = o.n || [0.55, 0.83];
    let s = P(pp, c, o.attr || "");
    const H = clipHalf(pp, k, n);
    if (H.length > 2) s += P(H, sh(c, o.sombra != null ? o.sombra : -0.2));
    if (o.luz) {
      const L = clipHalf(pp, lerp(k, pp[0], 0.55), [-n[0], -n[1]]);
      if (L.length > 2) s += P(L, sh(c, o.luz));
    }
    return s;
  }
  /* gema facetada: rombo de 4 caras + brillo */
  function gema(cx, cy, r, c, o = {}) {
    const ry = r * (o.alto || 1.15),
      T = [cx, cy - ry],
      R = [cx + r, cy],
      B = [cx, cy + ry],
      L = [cx - r, cy],
      C = [cx - r * 0.12, cy - ry * 0.1];
    const cls = o.cls ? ` class="${o.cls}"` : "";
    return (
      `<g${cls}>` +
      (o.aro
        ? P(
            [
              [cx, cy - ry - o.aro],
              [cx + r + o.aro, cy],
              [cx, cy + ry + o.aro],
              [cx - r - o.aro, cy],
            ],
            o.aroC || "#111111",
          )
        : "") +
      P([L, T, C], sh(c, 0.35)) +
      P([T, R, C], sh(c, 0.08)) +
      P([L, C, B], sh(c, -0.12)) +
      P([C, R, B], sh(c, -0.35)) +
      P(
        [
          [cx - r * 0.55, cy - ry * 0.15],
          [cx - r * 0.2, cy - ry * 0.62],
          [cx - r * 0.05, cy - ry * 0.3],
        ],
        "#FFFFFF",
        ' opacity=".85"',
      ) +
      "</g>"
    );
  }
  const octo = (cx, cy, r, c, o = {}) => pieza(ngon(cx, cy, r, 8, Math.PI / 8), c, o);
  /* halo plano escalonado (reemplaza al glow con blur) */
  const halo = (cx, cy, r, c, o = {}) =>
    `<g class="${o.cls || "pulso"}">` +
    P(ngon(cx, cy, r, o.lados || 8, Math.PI / 8, o.ry || r), c, ' opacity=".14"') +
    P(ngon(cx, cy, r * 0.72, o.lados || 8, Math.PI / 8, (o.ry || r) * 0.72), c, ' opacity=".2"') +
    "</g>";
  /* aura con la forma de la hoja: la silueta agrandada en dos escalones planos */
  function aura(H, c) {
    const off = (p, m, d, lado) => {
      let dx = p[0] - m[0],
        dy = p[1] - m[1],
        l = Math.hypot(dx, dy);
      if (l < 1) {
        dx = lado;
        dy = 0;
        l = 1;
      }
      return [p[0] + (dx / l) * d, p[1] + (dy / l) * d];
    };
    const out = (d) =>
      H.L.map((p, i) => (i === 0 ? [p[0], p[1] - d * 1.6] : off(p, H.M[i], d, -1))).concat(
        H.R.map((p, i) => (i === 0 ? [p[0], p[1] - d * 1.6] : off(p, H.M[i], d, 1))).reverse(),
      );
    return `<g class="pulso">${P(out(22), c, ' opacity=".14"')}${P(out(10), c, ' opacity=".24"')}</g>`;
  }
  const chispa = (x, y, r, c, d = 0) =>
    `<g class="chispa" style="animation-delay:${-d}s">` +
    P(
      [
        [x, y - r],
        [x + r * 0.28, y - r * 0.28],
        [x + r, y],
        [x + r * 0.28, y + r * 0.28],
        [x, y + r],
        [x - r * 0.28, y + r * 0.28],
        [x - r, y],
        [x - r * 0.28, y - r * 0.28],
      ],
      c,
    ) +
    "</g>";

  /* ---------- hoja genérica ----------
   * L: borde izquierdo (de la punta a la base), R: borde derecho (idem), misma cantidad de puntos.
   * La cresta es el punto medio. Mitad izquierda clara, derecha oscura, con filos.
   */
  function hoja(L, R, m, o = {}) {
    const M = L.map((p, i) =>
      o.cresta ? o.cresta[i] : lerp(p, R[i], o.crestaT != null ? o.crestaT : 0.5),
    );
    const Li = L.map((p, i) => lerp(p, M[i], o.filo || 0.3)),
      Ri = R.map((p, i) => lerp(p, M[i], o.filo || 0.3));
    let s = "";
    s += P(L.concat(M.slice().reverse()), m.c); // cara izquierda
    s += P(M.concat(R.slice().reverse()), sh(m.c, -0.2)); // cara derecha
    s += P(L.concat(Li.slice().reverse()), m.edge); // filo izquierdo (luz)
    s += P(Ri.concat(R.slice().reverse()), m.dark); // filo derecho (sombra)
    if (o.canal) {
      // acanaladura: tira oscura en la cresta
      const a = o.canal[0],
        b = o.canal[1],
        w = o.canal[2] || 5;
      const seg = M.filter((p, i) => i >= a && i <= b);
      const ll = seg.map((p) => [p[0] - w, p[1]]),
        rr = seg.map((p) => [p[0] + w, p[1]]);
      s += P(ll.concat(rr.slice().reverse()), o.canalC || sh(m.c, -0.32));
      s += P(ll.concat(seg.slice().reverse()), o.canalC ? sh(o.canalC, 0.15) : sh(m.c, -0.22));
    }
    return { svg: s, M, L, R };
  }
  /* empuñadura: cilindro plano con vendas en diagonal */
  function mango(y0, largo, ancho, c, venda, n, o = {}) {
    const x = ancho / 2;
    let s =
      P(
        [
          [-x, y0],
          [0, y0],
          [0, y0 + largo],
          [-x, y0 + largo],
        ],
        c,
      ) +
      P(
        [
          [0, y0],
          [x, y0],
          [x, y0 + largo],
          [0, y0 + largo],
        ],
        sh(c, -0.25),
      );
    if (venda)
      for (let i = 0; i < n; i++) {
        const y = y0 + ((i + 0.5) * largo) / n,
          h = Math.max(4, (largo / n) * 0.38);
        s +=
          P(
            [
              [-x, y - h / 2 + 3],
              [x, y - h / 2 - 3],
              [x, y + h / 2 - 3],
              [-x, y + h / 2 + 3],
            ],
            venda,
          ) +
          P(
            [
              [0, y - h / 2],
              [x, y - h / 2 - 3],
              [x, y + h / 2 - 3],
              [0, y + h / 2],
            ],
            sh(venda, -0.25),
          );
      }
    return s;
  }

  /* ---------- rarezas y materiales ---------- */
  const RAR = {
    comun: { c: "#B7AAAA" },
    poco: { c: "#3DDC84" },
    raro: { c: "#4FA8FF" },
    epico: { c: "#C77DFF" },
    leg: { c: "#FFD98A" },
  };
  Object.keys(RAR).forEach((k) => tx(RAR[k], "t", () => T_("esp.rar." + k)));
  const RAREZAS = ["comun", "poco", "raro", "epico", "leg"];
  const MAT = {
    oxido: { c: "#9A8C82", edge: "#C4B8AE", dark: "#655850" },
    hierro: { c: "#8E8888", edge: "#B9B2B2", dark: "#5C5656" },
    acero: { c: "#CFC9C9", edge: "#F2ECEC", dark: "#8C8484" },
    cobalto: { c: "#9CC0EE", edge: "#DDEBFF", dark: "#4E73A6" },
    vacio: { c: "#4B3B61", edge: "#8F74B8", dark: "#271C36" },
    oro: { c: "#F0CD85", edge: "#FFF3CC", dark: "#B5862C" },
    oroBlanco: { c: "#E9E2D2", edge: "#FFFBEF", dark: "#B39A68" },
    hueso: { c: "#E3D6C4", edge: "#FFF6E8", dark: "#A8957D" },
    huesoVerde: { c: "#D9DBB4", edge: "#F4F6D8", dark: "#8E9464" },
    huesoAzul: { c: "#CFDDE6", edge: "#F2F9FF", dark: "#8298A8" },
    huesoVacio: { c: "#6A5A78", edge: "#A18CB6", dark: "#3B2F46" },
    piedra: { c: "#8F8A86", edge: "#B8B2AD", dark: "#5E5955" },
    musgo: { c: "#9DB59A", edge: "#D0E3C8", dark: "#5E7A5E" },
    obsidiana: { c: "#3A3340", edge: "#6E6378", dark: "#1C1820" },
    sol: { c: "#FFE3A0", edge: "#FFF8DE", dark: "#C9952E" },
  };
  const CUERO = "#5A3A22",
    CUERO_OSC = "#3A2414",
    ROJO = "#9C2315",
    ROJO_C = "#C8402D",
    ROJO_O = "#5E130D",
    ORO = "#FFD98A",
    ORO_O = "#C8963E",
    RUBI = "#FF4D6D";

  /* =====================================================================
   * FAMILIAS
   * Cada constructor recibe t (0..4) y devuelve { fondo, cuerpo, frente, alto, ancho }
   * Coordenadas: guarda en y=0, hoja hacia arriba (y negativa), mango hacia abajo.
   * ===================================================================== */

  /* ---------- 1. BASTARDA: hoja larga y recta, mango de mano y media ---------- */
  function bastarda(t, Z) {
    const m = Z ? Z.hoja(t) : [MAT.oxido, MAT.acero, MAT.cobalto, MAT.vacio, MAT.oroBlanco][t];
    const acc = [MAT.hierro.c, "#3DDC84", "#4FA8FF", "#C77DFF", ORO][t];
    const L = 330 + t * 16,
      w = 21 + t;
    const perfil = [
      [0, -L],
      [w * 0.55, -L + 20],
      [w, -L + 44],
      [w * 0.98, -L * 0.5],
      [w * 0.92, -18],
      [w * 0.9, 0],
    ];
    if (t === 0) {
      perfil.splice(3, 0, [w * 0.99, -L * 0.72], [w * 0.62, -L * 0.69], [w * 0.99, -L * 0.66]);
    } // mella
    const pL = mirror(perfil);
    if (t === 0) {
      pL.splice(3, 3, [-w * 0.99, -L * 0.72], [-w * 0.99, -L * 0.69], [-w * 0.99, -L * 0.66]);
    }
    const H = hoja(pL, perfil, m, {
      canal: t >= 1 ? [2, pL.length - 2, t >= 3 ? 4 : 3.5] : null,
      canalC: t === 3 ? "#1C1428" : t === 4 ? "#B39A68" : null,
    });
    let fondo = "",
      cuerpo = H.svg,
      frente = "";
    if (t === 0 && !Z) {
      // manchas de óxido
      [
        [-12, -L * 0.38, 7],
        [9, -L * 0.55, 5],
        [-6, -L * 0.8, 4],
        [11, -L * 0.25, 6],
      ].forEach(([x, y, r]) => {
        cuerpo += P(ngon(x, y, r, 5, 0.4, r * 0.7), "#8A4B2A", ' opacity=".8"');
      });
    }
    if (t === 3) {
      // runas que laten sobre la acanaladura
      for (let i = 0; i < 6; i++) {
        const y = -60 - i * 44;
        cuerpo +=
          `<g class="pulso" style="animation-delay:${-i * 0.3}s">` +
          P(
            [
              [0, y - 10],
              [4, y - 3],
              [0, y + 4],
              [-4, y - 3],
            ],
            "#E4C2FF",
          ) +
          P(
            [
              [-3, y + 8],
              [3, y + 8],
              [0, y + 14],
            ],
            "#C77DFF",
          ) +
          "</g>";
      }
      fondo += aura(H, "#C77DFF");
    }
    if (t === 4) {
      cuerpo +=
        P(
          [
            [-3, -L + 70],
            [3, -L + 70],
            [3, -30],
            [-3, -30],
          ],
          RUBI,
        ) +
        P(
          [
            [-3, -L + 70],
            [0, -L + 70],
            [0, -30],
            [-3, -30],
          ],
          sh(RUBI, 0.25),
        );
      fondo += aura(H, ORO);
    }
    // guarda
    const gw = [72, 80, 88, 100, 108][t];
    const gc = Z ? Z.guarda(t) : [MAT.hierro.c, "#8C8484", "#2F74C8", "#4A2A78", ORO][t];
    let guarda = [
      [-gw, -6],
      [-gw + 12, -12],
      [gw - 12, -12],
      [gw, -6],
      [gw - 10, 10],
      [-gw + 10, 10],
    ];
    if (t >= 2)
      guarda = [
        [-gw - 10, -22],
        [-gw + 8, -12],
        [gw - 8, -12],
        [gw + 10, -22],
        [gw, 2],
        [gw - 16, 12],
        [-gw + 16, 12],
        [-gw, 2],
      ];
    cuerpo += pieza(guarda, gc, { n: [0, 1], sombra: -0.3, luz: 0.18 });
    if (t === 4) {
      // alas doradas en la guarda
      [-1, 1].forEach((sx) => {
        const ala = [
          [22, -12],
          [70, -40],
          [120, -44],
          [96, -28],
          [128, -24],
          [100, -12],
          [120, -2],
          [60, 0],
        ].map(([x, y]) => [x * sx, y]);
        cuerpo += pieza(
          sx < 0 ? ala.slice().reverse() : ala,
          Z ? sh(Z.guarda(t), 0.5) : "#FFF3CC",
          { n: [0, 1], sombra: -0.18 },
        );
      });
    }
    if (t >= 1)
      cuerpo += gema(0, 0, [6, 7, 8, 9, 10][t], [acc, acc, "#4FA8FF", "#C77DFF", RUBI][t], {
        aro: 3,
        aroC: sh(gc, -0.4),
      });
    // mango largo (mano y media)
    const ml = 118 + t * 4;
    cuerpo += mango(
      12,
      ml,
      20,
      Z ? Z.mango : [CUERO, "#1B4D3E", "#1A2B4C", "#241D1D", ROJO_O][t],
      Z ? Z.venda(t) : [CUERO_OSC, "#2C6E53", "#2F74C8", "#4A2A78", ORO][t],
      6,
    );
    // pomo
    const py = 12 + ml + 16,
      pc = Z ? Z.guarda(t) : null;
    if (t === 0) cuerpo += octo(0, py, 16, pc || MAT.hierro.c);
    else if (t === 1) cuerpo += octo(0, py, 17, pc || "#B3ACAC") + gema(0, py, 7, "#3DDC84");
    else if (t === 2)
      cuerpo +=
        pieza(
          [
            [-18, py - 14],
            [18, py - 14],
            [22, py + 4],
            [10, py + 18],
            [-10, py + 18],
            [-22, py + 4],
          ],
          pc || "#2F74C8",
        ) +
        pieza(
          [
            [-16, py + 18],
            [-10, py + 30],
            [-4, py + 22],
            [0, py + 34],
            [4, py + 22],
            [10, py + 30],
            [16, py + 18],
          ],
          ORO,
        ) +
        gema(0, py + 2, 7, "#DDEBFF");
    else if (t === 3)
      cuerpo +=
        gema(0, py + 6, 16, "#C77DFF", { alto: 1.5, cls: "pulso" }) +
        `<g class="flota">${P(
          [
            [-30, py - 4],
            [-24, py - 14],
            [-20, py - 2],
          ],
          "#E4C2FF",
        )}${P(
          [
            [30, py + 10],
            [24, py],
            [20, py + 12],
          ],
          "#E4C2FF",
        )}</g>`;
    else cuerpo += octo(0, py + 2, 21, pc || ORO) + gema(0, py + 2, 11, RUBI);
    if (t === 4)
      frente +=
        chispa(-40, -L * 0.75, 9, "#FFFFFF", 0) +
        chispa(38, -L * 0.4, 7, "#FFF3CC", 0.6) +
        chispa(-30, -L * 0.2, 6, ORO, 1.1);
    if (t === 3) frente += chispa(30, -L * 0.7, 7, "#E4C2FF", 0.4);
    return { fondo, cuerpo, frente, anc: { H, gw, m0: 12, ml, mw: 20, py } };
  }

  /* ---------- 2. ANCHA: hoja de hoja de laurel, pesada, guarda grande ---------- */
  function ancha(t, Z) {
    const m = Z ? Z.hoja(t) : [MAT.hierro, MAT.acero, MAT.cobalto, MAT.vacio, MAT.oro][t];
    const L = 300 + t * 16,
      w = 36 + t * 3;
    const perfil = [
      [0, -L],
      [w * 0.7, -L + 30],
      [w * 1.05, -L + 90],
      [w * 1.12, -L * 0.55],
      [w * 0.82, -40],
      [w * 0.78, -16],
      [w * 0.9, 0],
    ];
    const H = hoja(mirror(perfil), perfil, m, {
      filo: 0.26,
      canal: t >= 2 ? [2, 5, 5] : null,
      canalC: t === 3 ? "#7FD4FF" : t === 4 ? RUBI : null,
    });
    let fondo = "",
      cuerpo = H.svg,
      frente = "";
    if (t === 0) {
      // abolladuras y mellas: triángulos oscuros en los filos
      [
        [-w * 1.05, -L * 0.5],
        [w * 1.08, -L * 0.62],
        [-w * 0.9, -L * 0.3],
      ].forEach(([x, y]) => {
        const s = Math.sign(x);
        cuerpo += P(
          [
            [x, y - 8],
            [x - s * 9, y],
            [x, y + 8],
          ],
          "#111111",
        );
      });
    }
    if (t === 1) {
      // placa de refuerzo central
      cuerpo +=
        pieza(
          [
            [-14, -130],
            [14, -130],
            [18, -40],
            [0, -24],
            [-18, -40],
          ],
          Z ? sh(Z.guarda(t), -0.1) : "#8C8484",
          { sombra: -0.25 },
        ) +
        P(
          [
            [-5, -96],
            [5, -96],
            [5, -86],
            [-5, -86],
          ],
          "#3DDC84",
        );
      [
        [-9, -114],
        [9, -114],
        [-10, -56],
        [10, -56],
      ].forEach(([x, y]) => {
        cuerpo += P(ngon(x, y, 3, 4), "#F2ECEC");
      });
    }
    if (t === 2) {
      [
        [-12, -L * 0.62],
        [14, -L * 0.5],
        [-6, -L * 0.38],
        [8, -L * 0.74],
      ].forEach(([x, y], i) => {
        cuerpo += chispa(x, y, 5, "#FFFFFF", i * 0.4);
      });
    }
    if (t === 3) {
      fondo += aura(H, "#7FD4FF");
      cuerpo += `<g class="pulso">${P(
        [
          [-2.5, -L + 60],
          [2.5, -L + 60],
          [2.5, -40],
          [-2.5, -40],
        ],
        "#E6FBFF",
      )}</g>`;
    }
    if (t === 4) {
      // runas de titán a los costados
      for (let i = 0; i < 4; i++) {
        const y = -90 - i * 50;
        [-1, 1].forEach((sx) => {
          cuerpo += P(
            [
              [sx * 18, y],
              [sx * 26, y - 8],
              [sx * 26, y + 4],
              [sx * 20, y + 10],
            ],
            "#B5862C",
          );
        });
      }
      fondo += aura(H, ORO);
    }
    // guarda ancha
    const gw = [80, 88, 96, 108, 118][t],
      gc = Z ? Z.guarda(t) : ["#6E6868", "#3DDC84", "#2F74C8", "#4A2A78", ORO][t];
    let g = [
      [-gw, -14],
      [gw, -14],
      [gw - 14, 8],
      [-gw + 14, 8],
    ];
    if (t === 1)
      g = [
        [-gw, -14],
        [gw, -14],
        [gw + 8, -4],
        [gw - 12, 10],
        [-gw + 12, 10],
        [-gw - 8, -4],
      ];
    if (t >= 2)
      g = [
        [-gw - 12, -26],
        [-gw + 10, -14],
        [gw - 10, -14],
        [gw + 12, -26],
        [gw + 4, 0],
        [gw - 20, 12],
        [-gw + 20, 12],
        [-gw - 4, 0],
      ];
    cuerpo += pieza(g, gc, { n: [0, 1], sombra: -0.32, luz: 0.16 });
    if (t === 3)
      [-1, 1].forEach((sx) => {
        cuerpo += pieza(
          [
            [sx * 60, -14],
            [sx * 76, -40],
            [sx * 86, -14],
          ],
          "#C77DFF",
          { n: [0, 1] },
        );
      }); // púas
    if (t === 4)
      [-1, 1].forEach((sx) => {
        cuerpo += pieza(
          [
            [sx * 40, -14],
            [sx * 56, -44],
            [sx * 72, -30],
            [sx * 92, -52],
            [sx * 96, -14],
          ],
          Z ? sh(Z.guarda(t), 0.5) : "#FFF3CC",
          { n: [0, 1] },
        );
      }); // montañas
    if (t >= 2)
      cuerpo += gema(0, -2, 9 + t, ["#4FA8FF", "#4FA8FF", "#4FA8FF", "#7FD4FF", RUBI][t], {
        aro: 3,
        aroC: sh(gc, -0.45),
      });
    // mango corto y grueso
    const ml = 84 + t * 4;
    cuerpo += mango(
      8,
      ml,
      24,
      Z ? Z.mango : [CUERO, "#1B4D3E", "#1A2B4C", "#241D1D", ROJO_O][t],
      Z ? Z.venda(t) : [CUERO_OSC, "#8C8484", "#4FA8FF", "#C77DFF", ORO][t],
      4,
    );
    const py = 8 + ml + 18,
      pc = Z ? Z.guarda(t) : null;
    if (t === 0)
      cuerpo += pieza(
        [
          [-18, py - 12],
          [18, py - 12],
          [14, py + 12],
          [-14, py + 12],
        ],
        pc || "#6E6868",
      );
    else if (t === 1) cuerpo += octo(0, py, 19, pc || "#8C8484") + gema(0, py, 7, "#3DDC84");
    else if (t === 2) cuerpo += octo(0, py, 20, pc || "#2F74C8") + gema(0, py, 9, "#DDEBFF");
    else if (t === 3)
      cuerpo +=
        pieza(
          [
            [0, py - 18],
            [22, py],
            [0, py + 26],
            [-22, py],
          ],
          pc || "#4A2A78",
        ) + gema(0, py + 2, 9, "#7FD4FF", { cls: "pulso" });
    else cuerpo += octo(0, py + 2, 24, pc || ORO) + gema(0, py + 2, 13, RUBI);
    if (t === 4)
      frente +=
        chispa(-50, -L * 0.8, 10, "#FFFFFF") +
        chispa(46, -L * 0.5, 8, "#FFF3CC", 0.7) +
        chispa(-44, -L * 0.3, 6, ORO, 1.2);
    if (t === 3)
      frente += chispa(-44, -L * 0.66, 7, "#E6FBFF", 0.3) + chispa(40, -L * 0.36, 6, "#7FD4FF", 1);
    return { fondo, cuerpo, frente, anc: { H, gw, m0: 8, ml, mw: 24, py } };
  }

  /* ---------- 3. CIMITARRA: hoja curva con contrafilo en la punta ---------- */
  function cimitarra(t, Z) {
    const m = Z ? Z.hoja(t) : [MAT.oxido, MAT.acero, MAT.cobalto, MAT.vacio, MAT.oroBlanco][t];
    const L = 290 + t * 16,
      curva = 70 + t * 4,
      N = 9;
    const C = (s) => [curva * s * s, -L * s]; // eje curvo, se va a la derecha
    const ancho = (s) =>
      (22 + t) *
      (1 + 0.75 * Math.sin(Math.min(1, s / 0.86) * Math.PI * 0.5)) *
      (s > 0.86 ? ((1 - s) / 0.14) * 0.9 + 0.1 : 1);
    const nor = (s) => {
      const d = [2 * curva * s, -L],
        l = Math.hypot(d[0], d[1]);
      return [-d[1] / l, d[0] / l];
    }; // normal hacia la derecha (filo)
    const Lp = [],
      Rp = [];
    for (let i = N; i >= 0; i--) {
      const s = i / N,
        c = C(s),
        n = nor(s),
        a = ancho(s);
      Lp.push([c[0] - n[0] * a * 0.42, c[1] - n[1] * a * 0.42]); // lomo
      Rp.push([c[0] + n[0] * a * 0.58, c[1] + n[1] * a * 0.58]); // filo
    }
    Lp[0] = Rp[0] = [C(1)[0] - 6, C(1)[1] - 4];
    if (t >= 1) {
      const k = C(0.9),
        n = nor(0.9);
      Lp[1] = [k[0] - n[0] * 16, k[1] - n[1] * 16];
    } // contrafilo (yelman)
    if (t === 0) {
      Rp[5] = lerp(Rp[5], Lp[5], 0.28);
      Rp[3] = lerp(Rp[3], Lp[3], 0.22);
    } // mellas
    const H = hoja(Lp, Rp, m, { crestaT: 0.42, filo: 0.28 });
    let fondo = "",
      cuerpo = H.svg,
      frente = "";
    if (t === 0 && !Z)
      [
        [0.35, 6],
        [0.6, 5],
        [0.2, 4],
      ].forEach(([s, r]) => {
        const c = C(s);
        cuerpo += P(ngon(c[0] - 4, c[1], r, 5, 0.3, r * 0.7), "#8A4B2A", ' opacity=".85"');
      });
    if (t === 2) {
      const a = C(0.2),
        b = C(0.7);
      cuerpo += P([lerp(a, b, 0), lerp(a, b, 1), [b[0] + 3, b[1]], [a[0] + 3, a[1]]], "#4E73A6");
    }
    if (t === 3) {
      // rayo incrustado
      const Z = [];
      for (let i = 0; i <= 7; i++) {
        const s = 0.12 + i * 0.1,
          c = C(s),
          n = nor(s);
        Z.push([c[0] + n[0] * (i % 2 ? 7 : -5), c[1] + n[1] * (i % 2 ? 7 : -5)]);
      }
      const Z2 = Z.slice()
        .reverse()
        .map(([x, y]) => [x + 4, y + 2]);
      cuerpo += `<g class="pulso">${P(Z.concat(Z2), "#E4C2FF")}</g>`;
      fondo += aura(H, "#C77DFF");
      frente +=
        chispa(C(0.8)[0] + 36, C(0.8)[1], 8, "#E4C2FF", 0.2) +
        chispa(C(0.4)[0] - 34, C(0.4)[1], 6, "#C77DFF", 0.9);
    }
    if (t === 4) {
      // grabado de oro en el lomo
      for (let i = 1; i <= 6; i++) {
        const s = 0.1 + i * 0.1,
          c = C(s),
          n = nor(s);
        cuerpo += P(ngon(c[0] - n[0] * 3, c[1] - n[1] * 3, 3.2, 4), ORO_O);
      }
      fondo += aura(H, ORO);
      frente +=
        chispa(C(0.85)[0] + 40, C(0.85)[1], 10, "#FFFFFF") +
        chispa(C(0.45)[0] - 36, C(0.45)[1], 7, ORO, 0.8);
    }
    // guarda con puntas curvadas hacia la hoja
    const gc = Z ? Z.guarda(t) : ["#6E6868", "#8C8484", "#2F74C8", "#4A2A78", ORO][t],
      gw = 44 + t * 5;
    const g = [
      [-gw, 4],
      [-gw - 10, -14],
      [-gw + 4, -8],
      [-14, -10],
      [14, -10],
      [gw - 4, -8],
      [gw + 10, -14],
      [gw, 4],
      [12, 12],
      [-12, 12],
    ];
    cuerpo += pieza(g, gc, { n: [0, 1], sombra: -0.3, luz: 0.16 });
    if (t >= 2)
      cuerpo += gema(0, 1, 7 + t, ["#4FA8FF", "#4FA8FF", "#4FA8FF", "#E4C2FF", RUBI][t], {
        aro: 2.5,
        aroC: sh(gc, -0.45),
      });
    // mango levemente inclinado y pomo en forma de cabeza de ave
    const ml = 88 + t * 3,
      gr = Z ? Z.mango : [CUERO, "#1B4D3E", "#1A2B4C", "#241D1D", ROJO][t];
    cuerpo +=
      `<g transform="rotate(-6 0 12)">` +
      mango(
        12,
        ml,
        18,
        gr,
        Z ? Z.venda(t) : [t === 0 ? "#8C8484" : CUERO_OSC, "#E0B2B2", "#DDEBFF", "#C77DFF", ORO][t],
        5,
      );
    const py = 12 + ml;
    const pomo = [
      [-10, py],
      [10, py],
      [15, py + 12],
      [4, py + 26],
      [-20, py + 32],
      [-30, py + 24],
      [-14, py + 14],
    ];
    cuerpo += pieza(
      pomo,
      Z ? Z.guarda(t) : [MAT.hierro.c, "#B3ACAC", "#2F74C8", "#4A2A78", ORO][t],
      { sombra: -0.28 },
    );
    if (t >= 1) {
      // borla que cuelga
      const bc = ["", "#3DDC84", "#4FA8FF", "#C77DFF", ROJO_C][t];
      cuerpo +=
        P(
          [
            [-27, py + 26],
            [-21, py + 28],
            [-19, py + 46],
            [-25, py + 46],
          ],
          sh(bc, 0.15),
        ) +
        P(
          [
            [-30, py + 44],
            [-14, py + 44],
            [-14, py + 50],
            [-30, py + 50],
          ],
          sh(bc, -0.35),
        ) +
        pieza(
          [
            [-31, py + 50],
            [-13, py + 50],
            [-10, py + 80],
            [-22, py + 86],
            [-34, py + 80],
          ],
          bc,
          { n: [1, 0] },
        );
    }
    if (t === 0 && !Z)
      cuerpo += P(
        [
          [-9, 40],
          [9, 36],
          [9, 46],
          [-9, 50],
        ],
        "#B7AAAA",
      ); // trapo atado
    cuerpo += "</g>";
    return { fondo, cuerpo, frente, anc: { H, gw, m0: 12, ml, mw: 18, py, rot: -6 } };
  }

  /* ---------- 4. RÚNICA LEVITANTE: hoja partida con núcleo que flota ---------- */
  function runica(t, Z) {
    const m = Z ? Z.hoja(t) : [MAT.piedra, MAT.musgo, MAT.cobalto, MAT.obsidiana, MAT.sol][t];
    const nuc = ["#D9D2D2", "#3DDC84", "#4FA8FF", "#FF4D6D", ORO][t],
      nucC = ["#FFFFFF", "#E6FFE9", "#E6F3FF", "#FFE0E6", "#FFFFFF"][t];
    const S = 1 + t * 0.04,
      w = 26 * S;
    // tramo inferior (roto arriba) y tramo superior (flota)
    const inf = [
      [w * 0.3, -110 * S],
      [w * 0.95, -84 * S],
      [w, -40],
      [w * 0.92, 0],
    ];
    const infL = [
      [-w * 0.25, -104 * S],
      [-w * 0.95, -80 * S],
      [-w, -40],
      [-w * 0.92, 0],
    ];
    let fondo = "",
      cuerpo = "",
      frente = "";
    const Hi = hoja(infL, inf, m, { filo: 0.3 });
    const top = -110 * S - 150 * S; // centro del núcleo ≈ -185
    const cy = -110 * S - 72 * S;
    const sup = [
      [0, top - 150 * S],
      [w * 0.55, top - 110 * S],
      [w * 0.95, top - 40 * S],
      [w * 0.8, top + 6],
      [w * 0.25, top + 22],
    ];
    const supL = [
      [0, top - 150 * S],
      [-w * 0.55, top - 110 * S],
      [-w * 0.95, top - 40 * S],
      [-w * 0.8, top + 10],
      [-w * 0.3, top + 16],
    ];
    const Hs = hoja(supL, sup, m, {
      filo: 0.3,
      canal: t >= 2 ? [1, 3, 3] : null,
      canalC: t >= 2 ? sh(nuc, -0.2) : null,
    });
    fondo += halo(0, cy, 50 + t * 5, nuc, { lados: 8 });
    if (t === 4) {
      // rayos de sol
      let r = "";
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        r += P(
          [
            [Math.cos(a - 0.09) * 44, cy + Math.sin(a - 0.09) * 44],
            [Math.cos(a) * (i % 2 ? 76 : 92), cy + Math.sin(a) * (i % 2 ? 76 : 92)],
            [Math.cos(a + 0.09) * 44, cy + Math.sin(a + 0.09) * 44],
          ],
          i % 2 ? "#FFE3A0" : ORO,
        );
      }
      fondo += `<g class="gira" style="transform-origin:0px ${f1(cy)}px">${r}</g>`;
    }
    cuerpo += Hi.svg;
    // núcleo: anillo octogonal + rombo blanco + runas orbitando
    const R = 30 + t * 3,
      anillo = ngon(0, cy, R, 8, Math.PI / 8),
      ain = ngon(0, cy, R - 7, 8, Math.PI / 8);
    let nucleo = "";
    for (let i = 0; i < 8; i++) {
      const a = anillo[i],
        b = anillo[(i + 1) % 8],
        c = ain[(i + 1) % 8],
        d = ain[i];
      nucleo += P([a, b, c, d], i < 2 || i > 5 ? sh(nuc, 0.2) : sh(nuc, -0.25));
    }
    nucleo +=
      `<g class="pulso">` +
      P(
        [
          [0, cy - 13],
          [9, cy],
          [0, cy + 13],
          [-9, cy],
        ],
        nucC,
      ) +
      P(
        [
          [0, cy - 13],
          [0, cy + 13],
          [-9, cy],
        ],
        "#FFFFFF",
      ) +
      "</g>";
    let runas = "";
    for (let i = 0; i < (t >= 3 ? 4 : t >= 1 ? 3 : 2); i++) {
      const a = (i * 2 * Math.PI) / (t >= 3 ? 4 : t >= 1 ? 3 : 2) + 0.4;
      runas += P(ngon(Math.cos(a) * (R + 16), cy + Math.sin(a) * (R + 16), 5, 4), sh(nuc, 0.3));
    }
    nucleo += `<g class="gira" style="transform-origin:0px ${f1(cy)}px">${runas}</g>`;
    cuerpo += nucleo;
    let s2 = Hs.svg;
    if (t === 1 && !Z) {
      // hojas y musgo
      s2 +=
        pieza(
          [
            [-w * 0.8, top + 4],
            [-w * 1.6, top - 10],
            [-w * 1.2, top + 14],
          ],
          "#3DDC84",
          { n: [0, 1] },
        ) +
        P(
          [
            [w * 0.6, top - 60],
            [w * 1.4, top - 80],
            [w * 1.1, top - 56],
          ],
          "#23A861",
        );
      cuerpo += P(
        [
          [w * 0.9, -30],
          [w * 1.6, -44],
          [w * 1.2, -20],
        ],
        "#3DDC84",
      );
    }
    if (t >= 2) {
      for (let i = 0; i < 3; i++) {
        const y = top - 30 * S - i * 30 * S;
        s2 += `<g class="pulso" style="animation-delay:${-i * 0.4}s">${P(
          [
            [-5, y],
            [0, y - 7],
            [5, y],
            [0, y + 7],
          ],
          sh(nuc, 0.35),
        )}</g>`;
      }
    }
    cuerpo += `<g class="flota">${s2}</g>`;
    if (t === 0 && !Z)
      cuerpo +=
        P(
          [
            [-6, -100 * S],
            [4, -96 * S],
            [-2, -82 * S],
          ],
          "#5E5955",
        ) +
        P(
          [
            [8, -60],
            [14, -52],
            [6, -48],
          ],
          "#5E5955",
        );
    // guarda angular
    const gc = Z ? Z.guarda(t) : ["#5E5955", "#23A861", "#2F74C8", "#2A1F38", ORO_O][t],
      gw = 70 + t * 6;
    cuerpo += pieza(
      [
        [-gw, -8],
        [-gw + 18, -20],
        [-18, -14],
        [0, -26],
        [18, -14],
        [gw - 18, -20],
        [gw, -8],
        [gw - 22, 10],
        [-gw + 22, 10],
      ],
      gc,
      { n: [0, 1], sombra: -0.32, luz: 0.15 },
    );
    cuerpo += gema(0, -8, 6 + t, nuc, { aro: 2.5, aroC: sh(gc, -0.5), cls: t >= 3 ? "pulso" : "" });
    const ml = 88 + t * 3;
    cuerpo += mango(
      10,
      ml,
      18,
      Z ? Z.mango : ["#2E2525", "#115233", "#15366B", "#111111", ROJO_O][t],
      Z ? Z.venda(t) : [sh(gc, -0.2), "#3DDC84", "#4FA8FF", "#FF4D6D", ORO][t],
      4,
    );
    const py = 10 + ml + 16;
    cuerpo += octo(0, py, 15 + t, gc) + (t >= 1 ? gema(0, py, 6 + t, nuc) : "");
    frente += t >= 2 ? chispa(-46, cy - 60, 7, nucC, 0.2) + chispa(44, cy + 50, 6, nuc, 0.9) : "";
    if (t === 4) frente += chispa(-40, top - 110, 9, "#FFFFFF", 0.5);
    return { fondo, cuerpo, frente, anc: { H: Hi, H2: Hs, gw, m0: 10, ml, mw: 18, py } };
  }

  /* ---------- 5. HUESOS: hoja dentada de hueso, guarda de cráneo, mango de vértebras ---------- */
  function huesos(t, Z) {
    const m = Z
      ? Z.hueso(t)
      : [MAT.hueso, MAT.huesoVerde, MAT.huesoAzul, MAT.huesoVacio, MAT.hueso][t];
    const ojo = [null, "#9BE15D", "#7FD4FF", "#C77DFF", RUBI][t];
    const S = 1 + t * 0.045,
      k = 58 * S;
    const R = [
      [0, -4.4 * k],
      [0.18, -3.9],
      [0.46, -3.62],
      [0.2, -3.0],
      [0.56, -2.6],
      [0.24, -1.8],
      [0.62, -1.36],
      [0.3, -0.8],
      [0.44, -0.3],
      [0.3, 0],
    ].map(([x, y], i) => (i ? [x * k, y * k] : [x, y]));
    const Lz = [
      [0, -4.4 * k],
      [-0.14, -3.82],
      [-0.44, -3.48],
      [-0.18, -3.08],
      [-0.54, -2.52],
      [-0.22, -1.72],
      [-0.6, -1.28],
      [-0.28, -0.74],
      [-0.44, -0.28],
      [-0.3, 0],
    ].map(([x, y], i) => (i ? [x * k, y * k] : [x, y]));
    const H = hoja(Lz, R, m, { filo: 0.32 });
    let fondo = "",
      cuerpo = H.svg,
      frente = "";
    // grietas
    cuerpo +=
      P(
        [
          [-4, -2.2 * k],
          [6, -2.05 * k],
          [-2, -1.9 * k],
          [3, -1.94 * k],
        ],
        sh(m.c, -0.4),
      ) +
      P(
        [
          [2, -3.3 * k],
          [-6, -3.15 * k],
          [1, -3.05 * k],
        ],
        sh(m.c, -0.4),
      );
    if (ojo && t >= 2) {
      cuerpo += `<g class="pulso">${P(
        [
          [-3, -3.8 * k],
          [3, -3.8 * k],
          [3, -0.3 * k],
          [-3, -0.3 * k],
        ],
        ojo,
        ' opacity=".9"',
      )}</g>`;
    }
    if (t === 1 && !Z) {
      // gotas de ácido
      [
        [-0.5, -2.5],
        [0.55, -1.4],
        [-0.55, -1.2],
      ].forEach(([x, y], i) => {
        cuerpo += `<g class="gota" style="animation-delay:${-i * 0.5}s">${P(
          [
            [x * k, y * k + 6],
            [x * k + 5, y * k + 16],
            [x * k, y * k + 22],
            [x * k - 5, y * k + 16],
          ],
          "#9BE15D",
        )}</g>`;
      });
      cuerpo += P(
        [
          [0.12 * k, -3.95 * k],
          [0.46 * k, -3.62 * k],
          [0.3 * k, -3.4 * k],
        ],
        "#6FAF3A",
        ' opacity=".7"',
      );
    }
    if (t === 3) {
      fondo += aura(H, "#C77DFF");
      frente += chispa(-50, -3 * k, 7, "#E4C2FF", 0.3) + chispa(46, -1.6 * k, 6, "#C77DFF", 1);
    }
    if (t === 4) {
      fondo += aura(H, ORO);
      frente += chispa(-52, -3.4 * k, 9, "#FFFFFF") + chispa(50, -2 * k, 7, ORO, 0.8);
    }
    // costillas de la guarda (curvas hacia arriba)
    const gc = Z
      ? Z.hueso(t).c
      : [MAT.hueso.c, MAT.huesoVerde.c, MAT.huesoAzul.c, MAT.huesoVacio.c, MAT.hueso.c][t];
    const cost = (sx) =>
      [
        [18, 6],
        [58, -6],
        [96, -40],
        [106, -70],
        [92, -46],
        [58, -20],
        [18, -8],
      ].map(([x, y]) => [x * sx * S, y * S]);
    [-1, 1].forEach((sx) => {
      const c = cost(sx);
      cuerpo += pieza(sx < 0 ? c.slice().reverse() : c, gc, { n: [0, 1], sombra: -0.28 });
    });
    if (t === 4)
      [-1, 1].forEach((sx) => {
        cuerpo += P(cost(sx).slice(2, 5), ORO);
      });
    // cráneo
    const cr = [
      [-26, -14],
      [26, -14],
      [32, 6],
      [22, 28],
      [12, 34],
      [-12, 34],
      [-22, 28],
      [-32, 6],
    ].map(([x, y]) => [x * S, y * S]);
    cuerpo += pieza(cr, gc, { sombra: -0.22, luz: 0.12 });
    if (t === 4)
      [-1, 1].forEach((sx) => {
        cuerpo += pieza(
          [
            [sx * 18, -12],
            [sx * 34, -40],
            [sx * 38, -60],
            [sx * 30, -28],
            [sx * 28, -10],
          ].map(([x, y]) => [x * S, y * S]),
          ORO,
          { n: [0, 1] },
        );
      }); // cuernos
    [-1, 1].forEach((sx) => {
      const e = [
        [sx * 6, 2],
        [sx * 18, -2],
        [sx * 20, 10],
        [sx * 10, 14],
      ].map(([x, y]) => [x * S, y * S]);
      cuerpo += P(e, "#111111");
      if (ojo) cuerpo += `<g class="pulso">${P(ngon(sx * 13 * S, 7 * S, 4, 4), ojo)}</g>`;
    });
    cuerpo += P(
      [
        [-4, 18],
        [4, 18],
        [0, 24],
      ].map(([x, y]) => [x * S, y * S]),
      "#111111",
    );
    for (let i = -2; i <= 2; i++)
      cuerpo += P(
        [
          [i * 5 - 2, 28 * S],
          [i * 5 + 2, 28 * S],
          [i * 5 + 2, 34 * S],
          [i * 5 - 2, 34 * S],
        ],
        sh(gc, -0.35),
      );
    // vértebras
    const y0 = 34 * S;
    let y = y0 + 4;
    for (let i = 0; i < 5; i++) {
      const vc = t === 4 && i % 2 ? ORO : gc;
      cuerpo += pieza(
        [
          [-9, y],
          [9, y],
          [11, y + 16],
          [-11, y + 16],
        ],
        sh(vc, -0.08),
        { n: [1, 0], sombra: -0.3 },
      );
      cuerpo += pieza(
        [
          [-22, y + 5],
          [22, y + 5],
          [18, y + 10],
          [-18, y + 10],
        ],
        vc,
        { n: [0, 1], sombra: -0.3 },
      );
      y += 20;
    }
    // pomo: rótula doble
    cuerpo += octo(-8, y + 10, 12, gc) + octo(8, y + 10, 12, gc);
    if (t === 4) cuerpo += gema(0, y + 14, 12, RUBI, { aro: 3, aroC: ORO_O });
    else if (ojo) cuerpo += gema(0, y + 12, 6, ojo);
    return {
      fondo,
      cuerpo,
      frente,
      anc: { H, gw: 100 * S, m0: 38 * S, ml: 100, mw: 22, py: y + 10, vert: true },
    };
  }

  /* =====================================================================
   * TEMAS DE MAPA: la misma familia con materiales y adornos de cada mapa.
   * La rareza sigue mandando en gemas, auras y extras; el mapa manda en metal, guarda, mango y adornos.
   * ===================================================================== */
  const rampa = (a, b, filo) => (t) => {
    const c = mix(a, b, t / 4);
    return { c, edge: filo ? mix(filo[0], filo[1], t / 4) : sh(c, 0.38), dark: sh(c, -0.38) };
  };
  const enMango = (a, s) => (a.rot ? `<g transform="rotate(${a.rot} 0 12)">${s}</g>` : s);
  const enHoja = (H, f, dx = 0) => {
    const i = Math.max(1, Math.min(H.M.length - 2, Math.round(f * (H.M.length - 1))));
    return [H.M[i][0] + dx, H.M[i][1]];
  };
  const bordeHoja = (H, f, lado) => {
    const A = lado < 0 ? H.L : H.R,
      i = Math.max(1, Math.min(A.length - 2, Math.round(f * (A.length - 1))));
    return lerp(A[i], H.M[i], 0.25);
  };
  const estrella = (x, y, r, n = 5, k = 0.45) =>
    Array.from({ length: n * 2 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / n,
        rr = i % 2 ? r * k : r;
      return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
    });
  const TEMAS = {
    arena: {
      color: "#E0A93A",
      hoja: rampa("#9C7A52", "#E9CB94"),
      guarda: (t) => mix("#6E4A2A", "#D9A441", t / 4),
      mango: "#5E130D",
      venda: (t) => (t >= 3 ? ORO : ORO_O),
      hueso: rampa("#D6BE94", "#F4E6C6"),
      adorno(a, t) {
        let c = "";
        // cinta roja de gladiador atada bajo la guarda
        const x = -a.mw / 2,
          y = a.m0 + 6;
        c += enMango(
          a,
          pieza(
            [
              [x, y - 4],
              [x - 30, y + 46],
              [x - 20, y + 50],
              [x + 2, y + 8],
            ],
            ROJO_C,
            { n: [1, 0] },
          ) +
            pieza(
              [
                [x, y + 2],
                [x - 14, y + 62],
                [x - 4, y + 64],
                [x + 4, y + 10],
              ],
              ROJO,
              { n: [1, 0] },
            ) +
            P(
              [
                [x - 4, y - 6],
                [x + a.mw + 8, y - 8],
                [x + a.mw + 8, y + 4],
                [x - 4, y + 6],
              ],
              ROJO_C,
            ),
        );
        if (t >= 2)
          [-1, 1].forEach((sx) => {
            for (let i = 0; i < 3; i++) {
              const bx = sx * (a.gw * 0.55 + i * 14),
                by = -16 - i * 6;
              c += pieza(
                sx < 0
                  ? [
                      [bx, by],
                      [bx - 16 * sx, by - 10],
                      [bx - 6 * sx, by + 2],
                    ].reverse()
                  : [
                      [bx, by],
                      [bx - 16 * sx, by - 10],
                      [bx - 6 * sx, by + 2],
                    ],
                t >= 4 ? ORO : "#8FA85A",
                { n: [0, 1] },
              );
            }
          }); // laureles
        return { cuerpo: c };
      },
    },
    bosque: {
      color: "#9ECFEA",
      hoja: rampa("#8FA6B4", "#DDF3FF"),
      guarda: (t) => mix("#5A4232", "#9ECFEA", t / 4),
      mango: "#3E2E22",
      venda: (t) => mix("#C9DCE6", "#F2FBFF", t / 4),
      hueso: rampa("#C6D3DA", "#F2FBFF"),
      adorno(a, t) {
        let c = "",
          g = a.gw;
        // nieve sobre la guarda
        c += pieza(
          [
            [-g * 0.9, -10],
            [-g * 0.6, -22],
            [-g * 0.2, -18],
            [g * 0.15, -26],
            [g * 0.55, -20],
            [g * 0.9, -12],
            [g * 0.5, -8],
            [-g * 0.5, -8],
          ],
          "#F2FBFF",
          { n: [0, 1], sombra: -0.14 },
        );
        // carámbanos colgando
        [
          [-0.7, 22],
          [-0.35, 14],
          [0.3, 18],
          [0.72, 26],
        ].forEach(([fx, l]) => {
          const x = fx * g;
          c +=
            P(
              [
                [x - 5, 8],
                [x + 5, 8],
                [x, 8 + l],
              ],
              "#DDF3FF",
            ) +
            P(
              [
                [x, 8],
                [x + 5, 8],
                [x, 8 + l],
              ],
              "#9ECFEA",
            );
        });
        if (t >= 2)
          [0.3, 0.55, 0.8].forEach((f, i) => {
            const [x, y] = enHoja(a.H, f);
            c += `<g class="pulso" style="animation-delay:${-i * 0.4}s">${P(estrella(x, y, 7 + t, 4, 0.3), "#FFFFFF")}</g>`;
          });
        let fr =
          t >= 3 ? chispa(-50, -120, 7, "#FFFFFF", 0.2) + chispa(44, -220, 6, "#DDF3FF", 0.9) : "";
        return { cuerpo: c, frente: fr };
      },
    },
    volcan: {
      color: "#FF8D71",
      hoja: rampa("#4A3E44", "#6E5A62", ["#C8402D", "#FFB08A"]),
      guarda: (t) => mix("#3A2E2A", "#8A5A3A", t / 4),
      mango: "#1E1412",
      venda: (t) => mix("#9C2315", "#FF8D71", t / 4),
      hueso: rampa("#7E6E68", "#B8A294"),
      adorno(a, t) {
        let c = "";
        // grietas de magma sobre la hoja
        const n = t >= 3 ? 3 : t >= 1 ? 2 : 1;
        for (let k = 0; k < n; k++) {
          const f0 = 0.18 + k * 0.24,
            pts = [0, 1, 2, 3, 4].map((i) => {
              const [x, y] = enHoja(a.H, f0 + i * 0.045);
              return [x + (i % 2 ? 9 : -8), y];
            });
          const vuelta = pts
            .slice()
            .reverse()
            .map(([x, y]) => [x + 5, y + 3]);
          c += `<g class="pulso" style="animation-delay:${-k * 0.5}s">${P(pts.concat(vuelta), "#FF8D71")}${P(pts.slice(1, 3).concat(vuelta.slice(1, 3)), "#FFD98A")}</g>`;
        }
        // gotas de lava en la guarda
        [-0.6, 0.45].forEach((fx) => {
          const x = fx * a.gw;
          c +=
            P(
              [
                [x - 5, 6],
                [x + 5, 6],
                [x + 2, 20],
                [x - 2, 20],
              ],
              "#C8402D",
            ) +
            P(
              [
                [x - 2, 20],
                [x + 2, 20],
                [x, 26],
              ],
              "#FF8D71",
            );
        });
        const fr =
          chispa(-40, -90, 6, "#FF8D71", 0.1) +
          (t >= 2 ? chispa(36, -200, 7, "#FFD98A", 0.7) : "") +
          (t >= 4 ? chispa(-46, -280, 9, "#FF8D71", 1.2) : "");
        return { cuerpo: c, frente: fr, fondo: t >= 3 && t < 4 ? aura(a.H, "#FF8D71") : "" };
      },
    },
    helheim: {
      color: "#9BE1C0",
      hoja: rampa("#7C7A88", "#C9C6DA"),
      guarda: (t) => mix("#2E2836", "#5E4E78", t / 4),
      mango: "#16131C",
      venda: (t) => mix("#3A5E4E", "#9BE1C0", t / 4),
      hueso: rampa("#B2AEC0", "#E6E2F2"),
      adorno(a, t) {
        let c = "";
        // cadena enrollada en el mango
        let cad = "";
        for (let i = 0; i < 4; i++) {
          const y = a.m0 + 10 + i * (a.ml / 4.4),
            x = -a.mw / 2 - 4 + (i % 2) * 6;
          cad +=
            P(
              [
                [x, y],
                [x + a.mw + 8, y - 6],
                [x + a.mw + 8, y + 4],
                [x, y + 10],
              ],
              "#5E5A66",
            ) +
            P(
              [
                [x + 4, y + 3],
                [x + a.mw + 4, y - 2],
                [x + a.mw + 4, y + 1],
                [x + 4, y + 6],
              ],
              "#2A2630",
            );
        }
        c += enMango(a, cad);
        // llamas fantasma a los lados de la guarda
        if (t >= 1)
          [-1, 1].forEach((sx, i) => {
            const x = sx * a.gw * 0.8;
            c += `<g class="pulso" style="animation-delay:${-i * 0.6}s">${P(
              [
                [x - 8, -8],
                [x, -38 - t * 4],
                [x + 8, -8],
              ],
              "#9BE1C0",
              ' opacity=".85"',
            )}${P(
              [
                [x - 3, -8],
                [x, -24 - t * 2],
                [x + 3, -8],
              ],
              "#F2FFF8",
            )}</g>`;
          });
        if (t >= 2)
          [0.35, 0.65].forEach((f, i) => {
            const [x, y] = enHoja(a.H, f);
            c += `<g class="pulso" style="animation-delay:${-i * 0.5}s">${P(
              [
                [x, y - 9],
                [x + 5, y],
                [x, y + 9],
                [x - 5, y],
              ],
              "#9BE1C0",
            )}</g>`;
          });
        return { cuerpo: c, fondo: t === 3 ? aura(a.H, "#9BE1C0") : "" };
      },
    },
    costa: {
      color: "#7FD4C8",
      hoja: rampa("#6F9690", "#BCE0D8"),
      guarda: (t) => mix("#6E5E36", "#C9A95E", t / 4),
      mango: "#8C7048",
      venda: (t) => mix("#5E4A30", "#3D6E78", t / 4),
      hueso: rampa("#D2C8B2", "#F4EEDC"),
      adorno(a, t) {
        let c = "";
        // percebes pegados en la hoja, cerca de la base
        [
          [0.78, -1],
          [0.86, 1],
          [0.66, 1],
          [0.92, -1],
          [0.55, -1],
        ]
          .slice(0, 3 + Math.min(2, t))
          .forEach(([f, l]) => {
            const [x, y] = bordeHoja(a.H, f, l);
            c += octo(x, y, 5.5, "#D9D2C4", { sombra: -0.25 }) + P(ngon(x, y, 2.2, 6), "#5E5A52");
          });
        // coral en la guarda
        if (t >= 2) {
          const x = a.gw * 0.7;
          c += pieza(
            [
              [x - 4, -8],
              [x - 10, -30],
              [x - 4, -28],
              [x, -44],
              [x + 4, -30],
              [x + 12, -36],
              [x + 6, -8],
            ],
            t >= 4 ? ORO : "#FF8D71",
            { n: [0, 1] },
          );
        }
        // estrella de mar en el pomo
        if (t >= 3)
          c += pieza(estrella(0, a.py + 1, 16, 5, 0.45), t >= 4 ? ORO : "#FF8D71", {
            sombra: -0.25,
          });
        return { cuerpo: c, frente: t >= 3 ? chispa(-44, -150, 6, "#E6FBFF", 0.3) : "" };
      },
    },
  };
  const MAPAS = Object.keys(TEMAS);
  MAPAS.forEach((m) => {
    tx(TEMAS[m], "nombre", () => T_("esp.mapa." + m));
    tx(TEMAS[m], "suf", () => T_("esp.suf." + m));
    tx(TEMAS[m], "fl", () => T_("esp.mapaFl." + m));
  });

  /* =====================================================================
   * TIPOS DE ARMA: nombre, velocidad y animación de cada tipo (los textos, en js/textos/equipo.js).
   * Todas estas espadas son 'espada-corta'. Los números del golpe (stamina, daño, arco, alcance, tiempos)
   * están en ATK, en js/motor/juego-combate.js.
   * ===================================================================== */
  const TIPOS = {
    "espada-corta": {
      listo: true,
      vel: 1,
      animacion: "tajo",
    },
    "espada-pesada": { listo: false },
    "hacha-corta": { listo: false },
    "hacha-pesada": { listo: false },
  };
  const TIPO_K = {
    "espada-corta": "espadaCorta",
    "espada-pesada": "espadaPesada",
    "hacha-corta": "hachaCorta",
    "hacha-pesada": "hachaPesada",
  };
  Object.keys(TIPOS).forEach((id) => {
    const k = "esp.tipo." + TIPO_K[id];
    tx(TIPOS[id], "nombre", () => T_(k));
    tx(TIPOS[id], "desc", () => T_(TIPOS[id].listo ? k + "Desc" : "esp.tipo.pronto"));
    if (TIPOS[id].listo) tx(TIPOS[id], "golpe", () => T_(k + "Golpe"));
  });

  /* =====================================================================
   * LEGENDARIAS DE CUALQUIER MAPA: 11 espadas cortas únicas (Tyrfing además tiene habilidad: js/equipo/tyrfing.js).
   * Pueden caer en cualquier mapa. No tienen estadísticas fijas: usan las de una legendaria
   * de la oleada en la que caen (lo mismo que INV.roll(oleada, 0, 'legendaria') le daría a un arma).
   * ===================================================================== */
  const guardaBarra = (gw, c, alto = 12) =>
    pieza(
      [
        [-gw, -alto / 2 - 4],
        [gw, -alto / 2 - 4],
        [gw - 10, alto / 2 + 4],
        [-gw + 10, alto / 2 + 4],
      ],
      c,
      { n: [0, 1], sombra: -0.3, luz: 0.16 },
    );
  const LEGS = {
    fenix: {
      color: "#FF8D71",
      f() {
        const L = 360,
          m = { c: "#FF8D71", edge: "#FFD98A", dark: "#9C2315" };
        const R = [
          [0, -L],
          [16, -L + 40],
          [26, -L + 92],
          [16, -L + 126],
          [28, -L + 176],
          [18, -L + 210],
          [28, -L + 260],
          [22, -40],
          [20, 0],
        ];
        const H = hoja(mirror(R), R, m, { canal: [2, 7, 3], canalC: "#FFD98A" });
        let c = H.svg,
          fondo = aura(H, "#FF8D71"),
          fr = "";
        [-1, 1].forEach((sx) => {
          [
            [20, -8, 70, -60, 50, -10],
            [26, -4, 96, -34, 70, 0],
            [26, 2, 104, 0, 72, 10],
          ].forEach(([a, b, x, y, d, e], i) => {
            const pp = [
              [a * sx, b],
              [x * sx, y],
              [d * sx, e],
            ];
            c += pieza(sx < 0 ? pp.reverse() : pp, ["#FFD98A", "#FF8D71", "#C8402D"][i], {
              n: [0, 1],
            });
          });
        });
        c += guardaBarra(34, "#C8963E") + gema(0, 0, 9, RUBI, { aro: 3, aroC: "#5E130D" });
        c +=
          mango(10, 100, 18, "#5E130D", ORO, 5) +
          pieza(
            [
              [0, 118],
              [16, 132],
              [8, 150],
              [0, 160],
              [-8, 150],
              [-16, 132],
            ],
            "#FF8D71",
          ) +
          P(
            [
              [0, 128],
              [7, 138],
              [0, 150],
              [-7, 138],
            ],
            "#FFD98A",
          );
        fr +=
          chispa(-40, -300, 8, "#FFD98A", 0) +
          chispa(36, -200, 7, "#FF8D71", 0.6) +
          chispa(-30, -120, 6, "#FFD98A", 1.1);
        return { fondo, cuerpo: c, frente: fr };
      },
    },
    bifrost: {
      color: "#E6F3FF",
      f() {
        const L = 360;
        const R = [
            [0, -L],
            [22, -L + 48],
            [24, -60],
            [22, 0],
          ],
          m = { c: "#E6EEF8", edge: "#FFFFFF", dark: "#9FB3CC" };
        const H = hoja(mirror(R), R, m, {});
        let c = H.svg,
          fondo = aura(H, "#C7E3FF");
        const COL = ["#FF4D6D", "#FF8D71", "#FFD98A", "#3DDC84", "#4FA8FF", "#C77DFF"];
        for (let i = 0; i < 6; i++) {
          const y1 = -L + 60 + i * 46,
            y2 = y1 + 40;
          c += `<g class="pulso" style="animation-delay:${-i * 0.25}s">${P(
            [
              [-23, y1 + 8],
              [23, y1 - 8],
              [23, y2 - 8],
              [-23, y2 + 8],
            ],
            COL[i],
            ' opacity=".6"',
          )}</g>`;
        }
        [-1, 1].forEach((sx) => {
          [
            [20, 0, 60, -40, 44, 6],
            [40, 4, 88, -16, 70, 10],
          ].forEach(([a, b, x, y, d, e], i) => {
            const pp = [
              [a * sx, b],
              [x * sx, y],
              [d * sx, e],
            ];
            c += pieza(sx < 0 ? pp.reverse() : pp, i ? "#9FD0FF" : "#E6F3FF", {
              n: [0.6 * sx, 0.8],
            });
          });
        });
        c += guardaBarra(30, "#DDEBFF") + gema(0, 0, 9, "#FFFFFF", { aro: 3, aroC: "#4FA8FF" });
        c +=
          mango(10, 100, 18, "#2A3A5E", "#DDEBFF", 5) + gema(0, 128, 14, "#C77DFF", { alto: 1.3 });
        return {
          fondo,
          cuerpo: c,
          frente: chispa(-40, -260, 8, "#FFFFFF") + chispa(38, -140, 7, "#FFD98A", 0.7),
        };
      },
    },
    fenrir: {
      color: "#7FD4FF",
      f() {
        const L = 330,
          cur = -60,
          N = 8,
          C = (s) => [cur * s * s, -L * s],
          nor = (s) => {
            const d = [2 * cur * s, -L],
              l = Math.hypot(d[0], d[1]);
            return [-d[1] / l, d[0] / l];
          };
        const Lp = [],
          Rp = [];
        for (let i = N; i >= 0; i--) {
          const s = i / N,
            c = C(s),
            n = nor(s),
            a = 40 * Math.pow(1 - s, 0.7) + 3;
          Lp.push([c[0] + n[0] * a * 0.6, c[1] + n[1] * a * 0.6]);
          Rp.push([c[0] - n[0] * a * 0.4, c[1] - n[1] * a * 0.4]);
        }
        Lp[0] = Rp[0] = [C(1)[0], C(1)[1] - 6];
        const H = hoja(Rp, Lp, { c: "#F2ECE0", edge: "#FFFFFF", dark: "#B8AE98" }, { filo: 0.3 });
        let c =
            H.svg +
            P(
              [
                [-4, -80],
                [4, -120],
                [0, -90],
              ],
              "#B8AE98",
            ) +
            P(
              [
                [6, -180],
                [-2, -210],
                [2, -186],
              ],
              "#B8AE98",
            ),
          fondo = aura(H, "#7FD4FF");
        // cabeza de lobo como guarda
        const cab = [
          [-44, 10],
          [-36, -16],
          [-40, -44],
          [-18, -24],
          [0, -30],
          [18, -24],
          [40, -44],
          [36, -16],
          [44, 10],
          [20, 22],
          [0, 34],
          [-20, 22],
        ];
        c += pieza(cab, "#8C8C96", { sombra: -0.28, luz: 0.15 });
        [-1, 1].forEach((sx) => {
          c +=
            P(
              [
                [sx * 8, -6],
                [sx * 26, -12],
                [sx * 22, 2],
              ],
              "#111111",
            ) +
            `<g class="pulso">${P(
              [
                [sx * 14, -7],
                [sx * 22, -9],
                [sx * 20, -3],
              ],
              "#7FD4FF",
            )}</g>`;
        });
        c += P(
          [
            [-8, 20],
            [8, 20],
            [0, 30],
          ],
          "#111111",
        );
        c += mango(34, 92, 18, "#2A2630", "#5E5A66", 5);
        // cadena rota (Gleipnir)
        [
          [16, 52],
          [26, 66],
          [34, 82],
        ].forEach(([x, y], i) => {
          c +=
            P(
              [
                [x - 5, y - 7],
                [x + 7, y - 7],
                [x + 7, y + 7],
                [x - 5, y + 7],
              ],
              "#B7AAAA",
            ) +
            P(
              [
                [x - 1, y - 3],
                [x + 3, y - 3],
                [x + 3, y + 3],
                [x - 1, y + 3],
              ],
              "#2A2630",
            );
        });
        c += P(
          [
            [38, 92],
            [44, 90],
            [42, 100],
          ],
          "#B7AAAA",
        );
        c += octo(0, 140, 14, "#8C8C96") + gema(0, 140, 6, "#7FD4FF");
        return {
          fondo,
          cuerpo: c,
          frente: chispa(-40, -240, 7, "#DDF3FF", 0.3) + chispa(34, -120, 6, "#7FD4FF", 1),
        };
      },
    },
    yggdrasil: {
      color: "#3DDC84",
      f() {
        const L = 350,
          R = [
            [0, -L],
            [14, -L + 30],
            [24, -L + 80],
            [22, -L + 170],
            [26, -120],
            [20, -30],
            [22, 0],
          ];
        const Lz = [
          [0, -L],
          [-12, -L + 36],
          [-22, -L + 90],
          [-26, -L + 160],
          [-22, -110],
          [-24, -40],
          [-22, 0],
        ];
        const H = hoja(Lz, R, { c: "#8A6A48", edge: "#B89A70", dark: "#4E3A26" }, { filo: 0.28 });
        let c = H.svg,
          fondo = aura(H, "#3DDC84");
        c += `<g class="pulso">${P(
          [
            [-2, -300],
            [2, -300],
            [3, -30],
            [-3, -30],
          ],
          "#3DDC84",
        )}${P(
          [
            [0, -240],
            [12, -262],
            [14, -258],
            [2, -234],
          ],
          "#3DDC84",
        )}${P(
          [
            [0, -170],
            [-12, -196],
            [-14, -192],
            [-2, -164],
          ],
          "#3DDC84",
        )}${P(
          [
            [0, -100],
            [12, -122],
            [14, -118],
            [2, -94],
          ],
          "#3DDC84",
        )}</g>`;
        // raíces como guarda y hojas
        [-1, 1].forEach((sx) => {
          const r = [
            [10 * sx, -6],
            [50 * sx, -2],
            [80 * sx, 20],
            [70 * sx, 22],
            [46 * sx, 8],
            [10 * sx, 8],
          ];
          c += pieza(sx < 0 ? r.reverse() : r, "#6B5236", { n: [0, 1] });
          const h = [
            [30 * sx, -8],
            [58 * sx, -40],
            [44 * sx, -6],
          ];
          c += pieza(sx < 0 ? h.reverse() : h, "#3DDC84", { n: [0, 1] });
        });
        c += guardaBarra(26, "#6B5236") + gema(0, 0, 8, "#3DDC84", { aro: 3, aroC: "#3E2E22" });
        c +=
          mango(10, 100, 20, "#4E3A26", "#6B5236", 4) +
          octo(0, 126, 16, "#6B5236") +
          gema(0, 126, 7, ORO);
        const hojas = `<g class="flota">${P(
          [
            [-50, -220],
            [-40, -236],
            [-34, -218],
          ],
          "#3DDC84",
        )}${P(
          [
            [44, -140],
            [56, -150],
            [52, -130],
          ],
          "#23A861",
        )}</g>`;
        return { fondo, cuerpo: c, frente: hojas };
      },
    },
    jormungandr: {
      color: "#7FD4C8",
      f() {
        const L = 350,
          N = 14,
          R = [],
          Lz = [];
        for (let i = 0; i <= N; i++) {
          const y = -L + (L * i) / N,
            s = i / N,
            w = i === 0 ? 0 : Math.min(1, s * 4) * 22 + 6 * Math.sin(s * Math.PI * 6);
          R.push([w, y]);
          Lz.push([-w, y]);
        }
        for (let i = 1; i <= N; i++) {
          const s = i / N;
          Lz[i] = [-(Math.min(1, s * 4) * 22 - 6 * Math.sin(s * Math.PI * 6)), Lz[i][1]];
        }
        const H = hoja(Lz, R, { c: "#3FA89A", edge: "#8FE3D0", dark: "#1E5E58" }, { filo: 0.3 });
        let c = H.svg,
          fondo = aura(H, "#7FD4C8");
        for (let i = 2; i < N - 1; i += 2) {
          const y = R[i][1];
          c += P(
            [
              [-6, y - 4],
              [0, y + 4],
              [6, y - 4],
              [0, y],
            ],
            "#1E5E58",
          );
        }
        // serpiente enroscada en la guarda
        c += pieza(
          [
            [-60, -4],
            [-30, -16],
            [0, -6],
            [30, -16],
            [60, -4],
            [50, 8],
            [30, 0],
            [0, 10],
            [-30, 0],
            [-50, 8],
          ],
          "#2E8A7E",
          { n: [0, 1], sombra: -0.3 },
        );
        c +=
          pieza(
            [
              [60, -4],
              [78, -14],
              [86, -4],
              [74, 6],
              [50, 8],
            ],
            "#3FA89A",
          ) +
          P(
            [
              [74, -8],
              [79, -8],
              [77, -4],
            ],
            RUBI,
          );
        c += mango(10, 100, 18, "#1E3E3A", "#3FA89A", 6);
        c +=
          pieza(
            [
              [-14, 112],
              [14, 112],
              [18, 132],
              [8, 148],
              [-8, 148],
              [-18, 132],
            ],
            "#2E8A7E",
          ) +
          P(
            [
              [-8, 128],
              [-3, 126],
              [-4, 132],
            ],
            RUBI,
          ) +
          P(
            [
              [8, 128],
              [3, 126],
              [4, 132],
            ],
            RUBI,
          ) +
          P(
            [
              [-5, 148],
              [-2, 160],
              [0, 148],
            ],
            "#F2ECEC",
          ) +
          P(
            [
              [5, 148],
              [2, 160],
              [0, 148],
            ],
            "#F2ECEC",
          );
        return { fondo, cuerpo: c, frente: chispa(40, -260, 7, "#8FE3D0", 0.4) };
      },
    },
    thor: {
      color: "#7FD4FF",
      f() {
        const L = 360;
        const R = [
          [0, -L],
          [24, -L + 56],
          [10, -L + 104],
          [30, -L + 164],
          [14, -L + 214],
          [30, -80],
          [22, -30],
          [20, 0],
        ];
        const Lz = [
          [0, -L],
          [-10, -L + 70],
          [-26, -L + 120],
          [-12, -L + 170],
          [-28, -L + 236],
          [-16, -80],
          [-22, -30],
          [-20, 0],
        ];
        const H = hoja(Lz, R, { c: "#C9D6E8", edge: "#FFFFFF", dark: "#5F7390" }, { filo: 0.3 });
        let c = H.svg,
          fondo = aura(H, "#7FD4FF");
        c += `<g class="pulso">${P(
          H.M.slice(1, -1)
            .map(([x, y]) => [x - 2.5, y])
            .concat(
              H.M.slice(1, -1)
                .reverse()
                .map(([x, y]) => [x + 2.5, y]),
            ),
          "#E6FBFF",
        )}</g>`;
        // guarda de martillo
        c += pieza(
          [
            [-56, -18],
            [56, -18],
            [60, -8],
            [60, 10],
            [56, 18],
            [-56, 18],
            [-60, 10],
            [-60, -8],
          ],
          "#7C8290",
          { n: [0, 1], sombra: -0.3, luz: 0.15 },
        );
        [-40, -20, 20, 40].forEach((x) => {
          c += P(
            [
              [x - 4, -10],
              [x + 4, -10],
              [x + 4, 10],
              [x - 4, 10],
            ],
            "#4E5260",
          );
        });
        c += gema(0, 0, 8, "#7FD4FF", { aro: 3, aroC: "#2A2E3A", cls: "pulso" });
        c +=
          mango(18, 92, 18, "#3A2414", "#7C8290", 5) +
          pieza(
            [
              [-16, 112],
              [16, 112],
              [16, 132],
              [-16, 132],
            ],
            "#7C8290",
            { sombra: -0.3 },
          ) +
          P(
            [
              [-4, 132],
              [4, 132],
              [4, 146],
              [-4, 146],
            ],
            "#3A2414",
          );
        const rayo = (x, y) =>
          `<g class="chispa">${P(
            [
              [x, y],
              [x + 10, y + 14],
              [x + 3, y + 14],
              [x + 10, y + 30],
              [x - 4, y + 12],
              [x + 3, y + 12],
            ],
            "#E6FBFF",
          )}</g>`;
        return { fondo, cuerpo: c, frente: rayo(-48, -300) + rayo(40, -180) };
      },
    },
    estelar: {
      color: "#C77DFF",
      f() {
        const L = 350,
          R = [
            [0, -L],
            [20, -L + 50],
            [24, -L + 140],
            [22, -40],
            [22, 0],
          ];
        const H = hoja(
          mirror(R),
          R,
          { c: "#2A2238", edge: "#5E4E7E", dark: "#140F1C" },
          { filo: 0.26 },
        );
        let c = H.svg,
          fondo = aura(H, "#C77DFF");
        [
          [-8, -300, 5],
          [6, -250, 3],
          [-10, -200, 4],
          [8, -160, 5],
          [-4, -110, 3],
          [10, -70, 3],
          [-12, -50, 4],
        ].forEach(([x, y, r], i) => {
          c += `<g class="pulso" style="animation-delay:${-i * 0.3}s">${P(estrella(x, y, r, 4, 0.3), "#F2ECEC")}</g>`;
        });
        c += P(
          [
            [4, -290],
            [14, -300],
            [-8, -210],
            [-10, -214],
          ],
          "#E4C2FF",
          ' opacity=".6"',
        ); // cometa
        // guarda de roca de meteorito con grietas
        const roca = [
          [-58, -4],
          [-40, -20],
          [-12, -14],
          [10, -24],
          [40, -16],
          [60, 0],
          [44, 16],
          [10, 12],
          [-24, 18],
          [-50, 12],
        ];
        c +=
          pieza(roca, "#4A3E44", { sombra: -0.3, luz: 0.12 }) +
          `<g class="pulso">${P(
            [
              [-40, -2],
              [-20, 2],
              [-6, -6],
              [-4, -2],
              [-20, 6],
              [-40, 2],
            ],
            "#FF8D71",
          )}${P(
            [
              [14, -4],
              [36, 4],
              [34, 8],
              [12, 0],
            ],
            "#FF8D71",
          )}</g>`;
        c +=
          mango(16, 96, 18, "#1C1820", "#5E4E7E", 5) +
          pieza(
            [
              [-4, 118],
              [14, 124],
              [18, 140],
              [4, 152],
              [-14, 146],
              [-18, 128],
            ],
            "#4A3E44",
          ) +
          gema(0, 135, 7, "#FF8D71");
        return {
          fondo,
          cuerpo: c,
          frente: chispa(-44, -280, 7, "#F2ECEC") + chispa(40, -180, 6, "#C77DFF", 0.8),
        };
      },
    },
    eclipse: {
      color: "#FFD98A",
      f() {
        const L = 360,
          R = [
            [0, -L],
            [22, -L + 46],
            [24, -50],
            [22, 0],
          ],
          Lz = mirror(R);
        let c =
          P(
            Lz.concat([
              [0, 0],
              [0, -L],
            ]),
            "#FFD98A",
          ) + P(Lz.concat(Lz.map(([x, y]) => [x * 0.7, y]).reverse()), "#FFF3CC");
        c +=
          P(
            R.concat([
              [0, 0],
              [0, -L],
            ]),
            "#3E3458",
          ) + P(R.concat(R.map(([x, y]) => [x * 0.7, y]).reverse()), "#8E86A8");
        c +=
          P(
            [
              [-2, -L + 40],
              [0, -L + 40],
              [0, -20],
              [-2, -20],
            ],
            "#C8963E",
          ) +
          P(
            [
              [0, -L + 40],
              [2, -L + 40],
              [2, -20],
              [0, -20],
            ],
            "#5E4E7E",
          );
        const H = { L: Lz, R, M: Lz.map(() => [0, 0]).map((p, i) => [0, Lz[i][1]]) };
        let fondo = aura(H, "#FFD98A");
        // sol a la izquierda, luna a la derecha
        let sol = "";
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          sol += P(
            [
              [-44 + Math.cos(a - 0.2) * 18, -4 + Math.sin(a - 0.2) * 18],
              [-44 + Math.cos(a) * 30, -4 + Math.sin(a) * 30],
              [-44 + Math.cos(a + 0.2) * 18, -4 + Math.sin(a + 0.2) * 18],
            ],
            ORO,
          );
        }
        c += sol + octo(-44, -4, 18, "#FFD98A");
        c += pieza(
          [
            [34, -26],
            [58, -18],
            [66, 2],
            [56, 20],
            [34, 26],
            [48, 12],
            [52, -2],
            [46, -16],
          ],
          "#C9C6DA",
          { sombra: -0.3 },
        );
        c += guardaBarra(26, "#5E4E7E") + gema(0, 0, 8, "#FFFFFF", { aro: 3, aroC: "#2A2230" });
        c +=
          mango(10, 100, 18, "#2A2230", ORO, 5) +
          P(
            ngon(0, 128, 14, 8, Math.PI / 8)
              .filter((p) => p[0] <= 0.01)
              .concat([[0, 142]]),
            "#FFD98A",
          ) +
          P(
            ngon(0, 128, 14, 8, Math.PI / 8).filter((p) => p[0] >= -0.01),
            "#2A2230",
          );
        return {
          fondo,
          cuerpo: c,
          frente: chispa(-40, -260, 8, "#FFF3CC") + chispa(38, -150, 7, "#C9C6DA", 0.8),
        };
      },
    },
    freyja: {
      color: "#FF8DB0",
      f() {
        const L = 350,
          R = [
            [0, -L],
            [16, -L + 30],
            [26, -L + 110],
            [18, -L + 170],
            [26, -L + 240],
            [20, -30],
            [18, 0],
          ];
        const H = hoja(
          mirror(R),
          R,
          { c: "#FFB3C7", edge: "#FFE6EE", dark: "#C75A7A" },
          { filo: 0.35 },
        );
        let c = H.svg,
          fondo = aura(H, "#FF8DB0");
        [-L + 110, -L + 240].forEach((y) => {
          c += P(
            [
              [-26, y],
              [0, y - 14],
              [26, y],
              [0, y + 14],
            ],
            "#FFE6EE",
            ' opacity=".5"',
          );
        });
        [-1, 1].forEach((sx) => {
          const a = [
            [16 * sx, -8],
            [54 * sx, -32],
            [86 * sx, -30],
            [66 * sx, -16],
            [80 * sx, -6],
            [30 * sx, 4],
          ];
          c += pieza(sx < 0 ? a.reverse() : a, ORO, { n: [0, 1] });
        });
        c += guardaBarra(24, ORO_O);
        c += pieza(
          [
            [0, 14],
            [-14, -2],
            [-12, -12],
            [-4, -12],
            [0, -6],
            [4, -12],
            [12, -12],
            [14, -2],
          ],
          RUBI,
          { sombra: -0.25 },
        );
        c +=
          mango(16, 96, 18, "#5E130D", ORO, 5) +
          pieza(
            [
              [0, 150],
              [-16, 132],
              [-14, 120],
              [-5, 118],
              [0, 126],
              [5, 118],
              [14, 120],
              [16, 132],
            ],
            RUBI,
            { sombra: -0.25 },
          );
        const petalo = (x, y, d) =>
          `<g class="flota" style="animation-delay:${-d}s">${P(
            [
              [x, y],
              [x + 8, y - 6],
              [x + 12, y + 2],
              [x + 4, y + 6],
            ],
            "#FF8DB0",
          )}</g>`;
        return {
          fondo,
          cuerpo: c,
          frente:
            petalo(-46, -250, 0) + petalo(36, -160, 0.8) + chispa(-36, -110, 6, "#FFE6EE", 0.4),
        };
      },
    },
    // Tyrfing (idea de Alejandro): la espada maldita de la saga, forjada por dos enanos a la fuerza. Su habilidad está en js/equipo/tyrfing.js.
    // Tyrfing (idea de Alejandro): la espada maldita de la saga, forjada por dos enanos a la fuerza. Su habilidad está en js/equipo/tyrfing.js.
    // Cambia de color con el pacto: roja (cura) o violeta oscuro (pega más y cuesta vida). La pieza lleva tyrV mientras está en violeta.
    tyrfing: {
      color: "#C8402D",
      colorV: "#8E4FB0",
      f(v) {
        const T = v
          ? {
              hoja: "#B9A3CC",
              filo: "#EDE3F5",
              oscuro: "#4A2A60",
              canal: "#2A0F38",
              runa: "#C77DFF",
              aura: "#8E4FB0",
              gema: "#8E4FB0",
              aro: "#2A0F38",
              venda: "#3A1650",
              pomo: "#C77DFF",
              gotas: ["#8E4FB0", "#5B2378"],
              chispa: "#C77DFF",
            }
          : {
              hoja: "#D8CFCF",
              filo: "#FFFFFF",
              oscuro: "#6E6262",
              canal: "#9C2315",
              runa: "#FF8D71",
              aura: "#C8402D",
              gema: "#C8402D",
              aro: "#5E130D",
              venda: "#5E130D",
              pomo: RUBI,
              gotas: ["#C8402D", "#9C2315"],
              chispa: "#FF8D71",
            };
        const L = 320,
          R = [
            [0, -L],
            [20, -L + 44],
            [26, -L + 120],
            [22, -60],
            [24, 0],
          ];
        const H = hoja(
          mirror(R),
          R,
          { c: T.hoja, edge: T.filo, dark: T.oscuro },
          { canal: [1, 3, 5], canalC: T.canal },
        );
        let c = H.svg,
          fondo = aura(H, T.aura);
        // runas que laten en el canal
        [-L + 110, -L + 170, -L + 230].forEach((y, i) => {
          c += `<g class="pulso" style="animation-delay:${-i * 0.4}s">${P(
            [
              [0, y - 9],
              [4, y - 3],
              [1.5, y - 3],
              [1.5, y + 9],
              [-1.5, y + 9],
              [-1.5, y - 3],
              [-4, y - 3],
            ],
            T.runa,
          )}</g>`;
        });
        // guarda dorada con los cuernos hacia la hoja y la gema del pacto
        [-1, 1].forEach((sx) => {
          const g = [
            [10 * sx, -10],
            [48 * sx, -24],
            [70 * sx, -46],
            [62 * sx, -12],
            [34 * sx, 8],
            [10 * sx, 8],
          ];
          c += pieza(sx < 0 ? g.reverse() : g, ORO, { n: [0, 1] });
        });
        c += guardaBarra(28, ORO_O) + gema(0, 0, 10, T.gema, { aro: 3, aroC: T.aro, cls: "pulso" });
        c +=
          mango(16, 84, 18, "#2A1A1A", T.venda, 4) +
          octo(0, 116, 14, ORO_O) +
          gema(0, 116, 6, T.pomo);
        const gota = (x, y, d, col) =>
          `<g class="gota" style="animation-delay:${-d}s">${P(
            [
              [x, y - 7],
              [x + 4, y + 1],
              [x, y + 6],
              [x - 4, y + 1],
            ],
            col,
          )}</g>`;
        return {
          fondo,
          cuerpo: c,
          frente:
            gota(-30, -130, 0, T.gotas[0]) +
            gota(30, -70, 0.9, T.gotas[1]) +
            chispa(-38, -250, 7, T.chispa, 0.5),
        };
      },
    },
    eromash: {
      color: "#C8402D",
      f() {
        const L = 360,
          R = [
            [0, -L],
            [22, -L + 40],
            [24, -40],
            [22, 0],
          ];
        const H = hoja(
          mirror(R),
          R,
          { c: "#E6DEDE", edge: "#FFFFFF", dark: "#8C8484" },
          { canal: [1, 2, 4], canalC: "#C8402D" },
        );
        let c = H.svg,
          fondo = aura(H, "#C8402D");
        // guarda: la E de Eromash acostada, con sus tres puntas hacia la hoja
        const E = [
          [-84, 18],
          [-84, -54],
          [-58, -16],
          [-30, -16],
          [-20, -42],
          [0, -24],
          [20, -42],
          [30, -16],
          [58, -16],
          [84, -54],
          [84, 18],
        ];
        c +=
          pieza(
            E.map(([x, y]) => [x + 6, y + 6]),
            "#5E130D",
            { sombra: 0 },
          ) + pieza(E, "#C8402D", { n: [0, 1], sombra: -0.28, luz: 0.15 });
        c += gema(0, 2, 9, ORO, { aro: 3, aroC: "#5E130D" });
        c += mango(18, 90, 22, "#240806", "#5E130D", 4);
        c +=
          pieza(
            [
              [0, 112],
              [22, 134],
              [0, 156],
              [-22, 134],
            ],
            "#C8402D",
          ) + gema(0, 134, 9, ORO);
        return {
          fondo,
          cuerpo: c,
          frente: chispa(-42, -280, 8, "#FFFFFF") + chispa(40, -170, 7, "#FF8D71", 0.7),
        };
      },
    },
  };
  const LEG_ORDEN = Object.keys(LEGS);
  LEG_ORDEN.forEach((k) => {
    tx(LEGS[k], "nombre", () => T_("inv.espLeg." + k));
    tx(LEGS[k], "fl", () => T_("esp.legFl." + k));
  });

  /* =====================================================================
   * CATÁLOGO
   * ===================================================================== */
  const FAM = {
    bastarda: { f: bastarda, vel: 1, dano: [9, 13, 18, 24, 31] },
    ancha: { f: ancha, vel: 0.85, dano: [11, 16, 21, 28, 36] },
    cimitarra: { f: cimitarra, vel: 1.2, dano: [8, 12, 16, 22, 28] },
    runica: { f: runica, vel: 1.05, dano: [9, 13, 17, 23, 30] },
    huesos: { f: huesos, vel: 1.1, dano: [8, 12, 17, 23, 29] },
  };
  const FAMILIAS = Object.keys(FAM);
  const FAM_K = {
    bastarda: "inv.weaponBastarda",
    ancha: "inv.weaponAncha",
    cimitarra: "inv.weaponCimitarra",
    runica: "inv.weaponRunica",
    huesos: "inv.weaponHuesos",
  };
  FAMILIAS.forEach((f) => {
    tx(FAM[f], "nombre", () => T_(FAM_K[f]));
    tx(FAM[f], "n", () => RAREZAS.map((r, t) => T_("esp.n." + f + "." + t)));
    tx(FAM[f], "fl", () => RAREZAS.map((r, t) => T_("esp.fl." + f + "." + t)));
  });
  const ADJ = {
    huesos: ["", "pulida", "tallada", "maldita"],
    def: ["", "templada", "fina", "encantada"],
  };
  /* legendaria de cada familia en cada mapa; la que dropea el mapa usa la clave del inventario (mismo nombre que la pieza) */
  const nombreLeg = (f, m) => T_(DROP[m] === f ? "inv.espMapaLeg." + m : "esp.leg." + m + "." + f);
  const nombreMapa = (f, m, t) => {
    if (t === 4) return nombreLeg(f, m);
    const adj = (ADJ[f] || ADJ.def)[t],
      v = { base: T_("esp.base." + f), suf: TEMAS[m].suf };
    return adj
      ? T_("esp.nombreMapaAdj", Object.assign(v, { adj: T_("esp.adj." + adj) }))
      : T_("esp.nombreMapa", v);
  };
  const fila = (f, t, m) => ({
    id: m ? `${f}-${m}-${t + 1}` : `${f}-${t + 1}`,
    familia: f,
    familiaNombre: FAM[f].nombre,
    mapa: m || null,
    mapaNombre: m ? TEMAS[m].nombre : T_("esp.clasica"),
    rareza: RAREZAS[t],
    rarezaNombre: RAR[RAREZAS[t]].t,
    color: RAR[RAREZAS[t]].c,
    t,
    nombre: m ? nombreMapa(f, m, t) : FAM[f].n[t],
    fl: m ? TEMAS[m].fl : FAM[f].fl[t],
    dano: FAM[f].dano[t],
    tipo: FAM[f].tipo || "espada-corta",
    tipoNombre: TIPOS[FAM[f].tipo || "espada-corta"].nombre,
    vel: TIPOS[FAM[f].tipo || "espada-corta"].vel,
  });
  /* Qué familia se dropea en cada mapa (una por mapa, en sus 5 rarezas, con el acabado del mapa).
   * Cambiar una línea acá cambia el catálogo y el botín. */
  const DROP = {
    arena: "bastarda",
    bosque: "huesos",
    volcan: "ancha",
    helheim: "runica",
    costa: "cimitarra",
  };
  /* lista(): las 25 clásicas · lista('costa'): las 5 del mapa · lista('mapas'): las 25 de los mapas · lista('todas'): las 50 */
  const filaLeg = (k, v) => ({
    id: `leg-${k}` + (v ? "-v" : ""),
    variante: !!v,
    familia: "legendaria",
    leg: k,
    familiaNombre: T_("esp.legFamilia"),
    mapa: null,
    mapaNombre: T_("esp.cualquierMapa"),
    rareza: "leg",
    rarezaNombre: RAR.leg.t,
    color: RAR.leg.c,
    t: 4,
    nombre: LEGS[k].nombre,
    fl: LEGS[k].fl,
    dano: null,
    porOleada: true,
    tipo: "espada-corta",
    tipoNombre: TIPOS["espada-corta"].nombre,
    vel: TIPOS["espada-corta"].vel,
    acento: v && LEGS[k].colorV ? LEGS[k].colorV : LEGS[k].color,
  });
  const lista = (m) =>
    m === "todas"
      ? lista().concat(lista("mapas"), lista("legendarias"))
      : m === "legendarias"
        ? LEG_ORDEN.map((k) => filaLeg(k))
        : m === "mapas"
          ? MAPAS.flatMap((x) => lista(x))
          : m && TEMAS[m]
            ? RAREZAS.map((r, t) => fila(DROP[m], t, m))
            : FAMILIAS.flatMap((f) => RAREZAS.map((r, t) => fila(f, t, null)));
  const datos = (id) => lista("todas").find((x) => x.id === id);
  function construir(d) {
    if (d.leg) return LEGS[d.leg].f(d.variante);
    const Z = d.mapa ? TEMAS[d.mapa] : null,
      g = FAM[d.familia].f(d.t, Z);
    if (Z && g.anc) {
      const a = Z.adorno(g.anc, d.t) || {};
      g.fondo = (a.fondo || "") + g.fondo;
      g.cuerpo += a.cuerpo || "";
      g.frente += a.frente || "";
    }
    return g;
  }

  const ESTILO = `<style>
.flota{animation:esFlota 2.4s steps(6) infinite}
.pulso{animation:esPulso 1.6s steps(4) infinite}
.chispa{animation:esChispa 1.8s steps(3) infinite;transform-box:fill-box;transform-origin:center}
.gira{animation:esGira 8s steps(24) infinite}
.gota{animation:esGota 1.8s steps(6) infinite}
@keyframes esFlota{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes esPulso{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes esChispa{0%,100%{transform:scale(.3);opacity:0}50%{transform:scale(1);opacity:1}}
@keyframes esGira{to{transform:rotate(360deg)}}
@keyframes esGota{0%{transform:translateY(0);opacity:1}100%{transform:translateY(26px);opacity:0}}
@media (prefers-reduced-motion:reduce){.flota,.pulso,.chispa,.gira,.gota{animation:none}}
</style>`;

  /* caja de cada familia (vertical), para encuadrar parejo */
  const CAJA = {
    bastarda: [-140, -440, 280, 660],
    ancha: [-140, -410, 280, 580],
    cimitarra: [-110, -400, 290, 640],
    runica: [-110, -470, 220, 620],
    huesos: [-130, -300, 260, 520],
    legendaria: [-130, -400, 260, 590],
  };

  function svg(id, o = {}) {
    const d = typeof id === "object" ? id : datos(id);
    if (!d) return "";
    const g = construir(d);
    const vista = o.vista || "item";
    const arte = g.fondo + g.cuerpo + g.frente;
    const est = o.sinEstilo ? "" : ESTILO;
    const aria = ` role="img" aria-label="${d.nombre}"`;
    if (vista === "vertical") {
      const [x, y, w, h] = CAJA[d.familia];
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}"${aria}>${est}${arte}</svg>`;
    }
    // ítem: diagonal (punta arriba a la derecha), encuadre cuadrado
    const [x, y, w, h] = CAJA[d.familia],
      cx = x + w / 2,
      cy = y + h / 2,
      lado = Math.max(w, h) * 0.9;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(-lado / 2)} ${f1(-lado / 2)} ${f1(lado)} ${f1(lado)}"${aria}>${est}<g transform="rotate(45) translate(${f1(-cx)} ${f1(-cy)})">${arte}</g></svg>`;
  }

  /* ---------- adaptador para el juego ---------- */
  const LEG_GLOBAL = 0.5; // si cae una espada legendaria: chance de que sea una de las 11 de cualquier mapa (si no, la del mapa)
  const TIER = { comun: 0, rara: 2, epica: 3, legendaria: 4 };
  const COLOR_TIER = ["#B7AAAA", "#3DDC84", "#4FA8FF", "#C77DFF", "#FFD98A"];
  function sortear(mapaId, rareza, rnd = Math.random) {
    const mapa = TEMAS[mapaId] ? mapaId : "arena",
      weaponFamily = DROP[mapa];
    const leg =
      rareza === "legendaria" && rnd() < LEG_GLOBAL
        ? LEG_ORDEN[Math.floor(rnd() * LEG_ORDEN.length)]
        : null;
    return { weaponFamily, mapa, leg };
  }
  function tier(it) {
    if (!it || !FAM[it.weaponFamily]) return -1;
    const t = TIER[it.rarity] != null ? TIER[it.rarity] : 0;
    return t === 0 && (it.forja || 0) >= 2 ? 1 : t;
  }
  // fila del catálogo que corresponde a una pieza del inventario
  function deItem(it) {
    const t = tier(it);
    if (t < 0) return null;
    if (it.leg && LEGS[it.leg]) return filaLeg(it.leg, it.tyrV && LEGS[it.leg].colorV); // tyrV: Tyrfing en violeta
    return fila(it.weaponFamily, t, it.mapa && TEMAS[it.mapa] ? it.mapa : null);
  }
  const cache = new Map();
  function imagenDe(d, vista) {
    const k = d.id + "|" + vista;
    let im = cache.get(k);
    if (!im && typeof Image !== "undefined") {
      im = new Image();
      im.src =
        "data:image/svg+xml;charset=utf-8," +
        encodeURIComponent(svg(d, { vista, sinEstilo: true }));
      cache.set(k, im);
    }
    return im;
  }
  function precargar() {
    lista("todas").forEach((d) => imagenDe(d, "vertical"));
  }
  const K = 0.8; // unidades del dibujo → unidades de la espada de siempre (hoja de 260)
  function dibujar(ctx, it, x, y, ang, escala, brillo, espejo) {
    const d = deItem(it);
    if (!d) return false;
    const im = imagenDe(d, "vertical");
    if (!im || !im.complete || !im.naturalWidth) return false;
    const [bx, by, bw, bh] = CAJA[d.leg ? "legendaria" : d.familia];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang + Math.PI / 2);
    ctx.scale(escala * K * (espejo ? -1 : 1), escala * K);
    if (brillo) {
      ctx.shadowColor = d.leg ? d.acento : COLOR_TIER[d.t];
      ctx.shadowBlur = 24;
    }
    ctx.drawImage(im, bx, by + 60 / K, bw, bh);
    ctx.restore();
    return true;
  }
  function icono(it) {
    const d = deItem(it);
    return d ? svg(d, { vista: "item", sinEstilo: true }) : "";
  }
  function imagenItem(it) {
    const d = deItem(it);
    if (!d) return null;
    const im = imagenDe(d, "item");
    return im && im.complete && im.naturalWidth ? im : null;
  }

  global.EromashEspadas = {
    FAMILIAS,
    RAREZAS,
    MAPAS,
    TEMAS,
    DROP,
    TIPOS,
    LEGS,
    LEG_ORDEN,
    LEG_GLOBAL,
    sortear,
    tier,
    deItem,
    imagenDe,
    precargar,
    dibujar,
    icono,
    imagenItem,
    RAR,
    FAM,
    lista,
    datos,
    svg,
  };
  if (typeof Image !== "undefined") precargar();
})(typeof window !== "undefined" ? window : globalThis);
