/* =====================================================================
 * EROMASH · ESCUDOS 2D LOW POLY
 * Mismo criterio que las espadas (js/equipo/eromash-espadas.js):
 *   - 1 escudo por zona × 5 rarezas = 25, con el acabado de su zona. Cada mapa suelta solo el suyo.
 *   - 10 legendarios que pueden caer en cualquier mapa. No tienen estadísticas fijas:
 *     usan las de una legendaria de la oleada en la que caen (INV.roll).
 *
 *   EromashEscudos.MAPAS                → ['arena','bosque','volcan','helheim','costa']
 *   EromashEscudos.lista()              → los 25 de zona · lista('costa') → los 5 del mapa
 *   EromashEscudos.lista('legendarias') → los 10 legendarios · lista('todas') → 35
 *   EromashEscudos.svg(id | fila)       → string SVG (cuadrado, para inventario y para la mano)
 *   EromashEscudos.sortear(mapa, rareza) → { mapa, leg } para una pieza nueva
 *   EromashEscudos.icono(pieza) / imagenItem(pieza) / dibujar(ctx, pieza, x, y, escala, espejo, brillo)
 *   Estilo: sin degradés, sin blur, sin curvas. Polígonos planos, luz desde arriba a la izquierda.
 *   Los nombres visibles están en js/textos/ (inv.escZona.*, inv.escMapaLeg.*, inv.escLeg.*, inv.escFl.*).
 * ===================================================================== */
(function (global) {
  "use strict";
  const T_ = (k, v) => (global.I18N ? global.I18N.t(k, v) : k);

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
  const cen = (pp) => {
    let x = 0,
      y = 0;
    pp.forEach((p) => {
      x += p[0];
      y += p[1];
    });
    return [x / pp.length, y / pp.length];
  };
  const tr = (pp, dx, dy) => pp.map(([x, y]) => [x + dx, y + dy]);
  const esc = (pp, k, o = [0, 0]) =>
    pp.map(([x, y]) => [o[0] + (x - o[0]) * k, o[1] + (y - o[1]) * k]);
  const rot = (pp, a, o = [0, 0]) => {
    const c = Math.cos(a),
      s = Math.sin(a);
    return pp.map(([x, y]) => {
      const dx = x - o[0],
        dy = y - o[1];
      return [o[0] + dx * c - dy * s, o[1] + dx * s + dy * c];
    });
  };
  const ngon = (cx, cy, r, n, r0 = 0, ry) =>
    Array.from({ length: n }, (_, i) => {
      const a = r0 + (i * 2 * Math.PI) / n - Math.PI / 2;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * (ry || r)];
    });
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
  // recorta un polígono con otro convexo (los dos en el mismo sentido de giro)
  function dentro(pp, forma) {
    const area = forma.reduce((s, p, i) => {
        const q = forma[(i + 1) % forma.length];
        return s + p[0] * q[1] - q[0] * p[1];
      }, 0),
      g = area > 0 ? 1 : -1;
    let out = pp;
    for (let i = 0; i < forma.length && out.length > 2; i++) {
      const a = forma[i],
        b = forma[(i + 1) % forma.length];
      out = clipHalf(out, a, [-(b[1] - a[1]) * g, (b[0] - a[0]) * g]);
    }
    return out;
  }
  /* pieza facetada: color base + mitad en sombra (abajo a la derecha) + luz opcional arriba a la izquierda */
  function pieza(pp, c, o = {}) {
    const k = o.o || cen(pp),
      n = o.n || [0.62, 0.78];
    let s = P(pp, c, o.attr || "");
    const H = clipHalf(pp, k, n);
    if (H.length > 2) s += P(H, sh(c, o.sombra != null ? o.sombra : -0.2));
    if (o.luz) {
      const L = clipHalf(pp, [k[0] - 30 * n[0], k[1] - 30 * n[1]], [-n[0], -n[1]]);
      if (L.length > 2) s += P(L, sh(c, o.luz));
    }
    return s;
  }
  function gema(cx, cy, r, c, o = {}) {
    const ry = r * (o.alto || 1.15),
      T = [cx, cy - ry],
      R = [cx + r, cy],
      B = [cx, cy + ry],
      L = [cx - r, cy],
      C = [cx - r * 0.12, cy - ry * 0.1];
    return (
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
      )
    );
  }
  const octo = (cx, cy, r, c, o = {}) => pieza(ngon(cx, cy, r, 8, Math.PI / 8), c, o);
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
  /* aura: la silueta agrandada en dos escalones planos (reemplaza al glow con blur) */
  const aura = (forma, c) =>
    `<g class="pulso">${P(esc(forma, 1.16), c, ' opacity=".14"')}${P(esc(forma, 1.07), c, ' opacity=".24"')}</g>`;
  /* umbo: el centro metálico del escudo */
  const umbo = (r, c, o = {}) =>
    octo(0, o.y || 0, r, sh(c, -0.35)) +
    octo(0, o.y || 0, r * 0.74, c, { luz: 0.3 }) +
    (o.gema
      ? gema(0, o.y || 0, r * 0.38, o.gema)
      : P(ngon(-r * 0.18, (o.y || 0) - r * 0.2, r * 0.2, 4), "#FFFFFF", ' opacity=".55"'));
  /* borde con capas: aro + cara, con la cara recortada a la forma */
  const cuerpo = (forma, aro, cara, k = 0.86) =>
    pieza(forma, aro, { luz: 0.22 }) + pieza(esc(forma, k), cara);
  /* tablas verticales: tiras oscuras recortadas a la forma */
  function tablas(forma, n, c, ancho = 3.5) {
    let s = "";
    const xs = forma.map((p) => p[0]),
      a = Math.min(...xs),
      b = Math.max(...xs),
      ys = forma.map((p) => p[1]);
    for (let i = 1; i < n; i++) {
      const x = a + ((b - a) * i) / n,
        R = dentro(
          [
            [x - ancho, Math.min(...ys) - 5],
            [x + ancho, Math.min(...ys) - 5],
            [x + ancho, Math.max(...ys) + 5],
            [x - ancho, Math.max(...ys) + 5],
          ],
          forma,
        );
      if (R.length > 2) s += P(R, c);
    }
    return s;
  }
  const banda = (forma, y0, y1, c) => {
    const R = dentro(
      [
        [-300, y0],
        [300, y0],
        [300, y1],
        [-300, y1],
      ],
      forma,
    );
    return R.length > 2 ? pieza(R, c, { n: [0, 1] }) : "";
  };
  const franja = (forma, x0, x1, c) => {
    const R = dentro(
      [
        [x0, -300],
        [x1, -300],
        [x1, 300],
        [x0, 300],
      ],
      forma,
    );
    return R.length > 2 ? pieza(R, c, { n: [1, 0] }) : "";
  };

  /* ---------- rarezas ---------- */
  const RAR = {
    comun: {
      get t() {
        return T_("emi.rar.comun.t");
      },
      c: "#B7AAAA",
    },
    poco: {
      get t() {
        return T_("emi.rar.poco.t");
      },
      c: "#3DDC84",
    },
    raro: {
      get t() {
        return T_("emi.rar.raro.t");
      },
      c: "#4FA8FF",
    },
    epico: {
      get t() {
        return T_("emi.rar.epico.t");
      },
      c: "#C77DFF",
    },
    leg: {
      get t() {
        return T_("emi.rar.leg.t");
      },
      c: "#FFD98A",
    },
  };
  const RAREZAS = ["comun", "poco", "raro", "epico", "leg"];
  const ORO = "#FFD98A",
    ORO_O = "#C8963E",
    BRONCE = "#E0A93A",
    ROJO = "#9C2315",
    ROJO_C = "#C8402D",
    ROJO_O = "#5E130D",
    RUBI = "#FF4D6D";
  const HUESO = "#E3D6C4",
    HIERRO = "#8E8888";

  /* ---------- formas ---------- */
  const F = {
    // escudo de gladiador (rectangular con las esquinas cortadas)
    scutum: [
      [-62, -140],
      [62, -140],
      [88, -114],
      [88, 114],
      [62, 140],
      [-62, 140],
      [-88, 114],
      [-88, -114],
    ],
    // rodela redonda vikinga
    redondo: ngon(0, 0, 122, 16, Math.PI / 16),
    // escudo de punta (heráldico)
    punta: [
      [-100, -124],
      [100, -124],
      [104, -30],
      [74, 62],
      [0, 142],
      [-74, 62],
      [-104, -30],
    ],
    // ataúd de Helheim
    ataud: [
      [0, -144],
      [82, -100],
      [96, -22],
      [62, 112],
      [0, 144],
      [-62, 112],
      [-96, -22],
      [-82, -100],
    ],
    // gota del naufragio
    gota: [
      [-62, -128],
      [62, -128],
      [108, -76],
      [114, 8],
      [82, 88],
      [0, 146],
      [-82, 88],
      [-114, 8],
      [-108, -76],
    ],
  };

  /* =====================================================================
   * ESCUDOS DE ZONA: t = 0..4 (común → legendario). Cada rareza suma detalles.
   * ===================================================================== */
  const TEMAS = {
    arena: {
      get nombre() {
        return T_("casco.map.arena");
      },
      color: BRONCE,
      forma: "scutum",
      dibujar(t) {
        const f = F.scutum,
          aro = mix("#6E4A2A", "#E9C77A", t / 4),
          cara = ["#7A5A3C", ROJO, ROJO, ROJO_C, ROJO][t];
        let s = cuerpo(f, aro, cara, 0.88);
        const cf = esc(f, 0.88);
        if (t === 0) s += tablas(cf, 4, sh(cara, -0.3));
        s += franja(cf, -9, 9, aro) + banda(cf, -9, 9, aro); // cruz de bronce
        if (t >= 1)
          s += banda(cf, -112, -100, sh(aro, -0.15)) + banda(cf, 100, 112, sh(aro, -0.15));
        if (t >= 2)
          [-1, 1].forEach((sx) => {
            for (let i = 0; i < 4; i++) {
              const y = 96 - i * 22,
                x = sx * (48 - i * 3);
              const h = [
                [x, y],
                [x + sx * 20, y - 16],
                [x + sx * 6, y - 4],
              ];
              s += pieza(sx < 0 ? h : h.slice().reverse(), t >= 4 ? ORO : "#8FA85A", { n: [0, 1] });
            }
          }); // laureles
        if (t >= 3)
          [-1, 1].forEach((sx) => {
            const w = [
              [sx * 20, -8],
              [sx * 70, -46],
              [sx * 62, -24],
              [sx * 76, -26],
              [sx * 56, 0],
              [sx * 20, 8],
            ];
            s += pieza(sx < 0 ? w.slice().reverse() : w, t >= 4 ? ORO : "#D9A441", { n: [0, 1] });
          }); // alas de águila
        s += umbo(t >= 3 ? 30 : 26, t >= 4 ? ORO : aro, { gema: t >= 4 ? RUBI : null });
        if (t >= 4) {
          s += chispa(-60, -110, 8, ORO) + chispa(58, 90, 7, "#FFF3CC", 0.7);
          return { fondo: aura(f, ORO), cuerpo: s };
        }
        return { cuerpo: s };
      },
    },
    bosque: {
      get nombre() {
        return T_("casco.map.bosque");
      },
      color: "#CFDDE6",
      forma: "redondo",
      dibujar(t) {
        const f = F.redondo,
          aro = [CUERO(), HIERRO, HIERRO, "#9FB6C6", "#DDEBFF"][t],
          cara = ["#8A6A48", "#8A6A48", "#6E5A48", "#5E6E7A", "#4E6E86"][t];
        let s = cuerpo(f, aro, cara, 0.87);
        const cf = esc(f, 0.87);
        s += tablas(cf, 5, sh(cara, -0.32));
        if (t >= 1)
          [0, 4, 8, 12].forEach((i) => {
            const p = f[i];
            s += octo(p[0] * 0.93, p[1] * 0.93, 5, sh(aro, 0.3));
          }); // remaches
        if (t >= 2)
          for (let i = 0; i < 8; i++) {
            const a = (i * Math.PI) / 4;
            s += pieza(
              rot(
                [
                  [-7, -40],
                  [7, -40],
                  [0, -70],
                ],
                a,
              ),
              HUESO,
              { n: [0, -1] },
            );
          } // colmillos de lobo
        if (t >= 3)
          [
            [-58, -36, 0.5],
            [52, 30, -0.4],
            [-30, 62, 0.2],
            [44, -60, 0.9],
          ].forEach(([x, y, a]) => {
            s += pieza(
              rot(
                [
                  [x, y - 18],
                  [x + 8, y],
                  [x, y + 18],
                  [x - 8, y],
                ],
                a,
                [x, y],
              ),
              "#9CC0EE",
              { luz: 0.4 },
            );
          }); // escarcha
        if (t >= 4)
          s += `<g class="pulso">${banda(cf, -40, -24, "#9BE1C0").replace(/fill=/g, 'opacity=".5" fill=')}${banda(cf, 20, 32, "#7FD4FF").replace(/fill=/g, 'opacity=".45" fill=')}</g>`; // aurora
        // nieve sobre el borde de arriba
        const nieve = [
          [-96, -76],
          [-60, -106],
          [-20, -120],
          [20, -120],
          [60, -106],
          [96, -76],
          [80, -70],
          [52, -90],
          [30, -84],
          [4, -100],
          [-24, -88],
          [-50, -96],
          [-78, -68],
        ];
        s += pieza(nieve, "#F2F9FF", { n: [0.3, 0.95], sombra: -0.08 });
        s += umbo(28, t >= 3 ? "#DDEBFF" : HIERRO, { gema: t >= 4 ? "#DDF3FF" : null });
        if (t >= 4) {
          s += chispa(-80, 60, 7, "#FFFFFF") + chispa(70, -50, 8, "#9BE1C0", 0.8);
          return { fondo: aura(f, "#9BE1C0"), cuerpo: s };
        }
        return { cuerpo: s };
      },
    },
    volcan: {
      get nombre() {
        return T_("casco.map.volcan");
      },
      color: "#FF8D71",
      forma: "punta",
      dibujar(t) {
        const f = F.punta,
          aro = ["#5E5955", "#5E5955", "#4A3F46", "#3A3036", "#2A2026"][t],
          cara = ["#4A4450", "#3A3340", "#3A3340", "#2E2834", "#241E2A"][t];
        const lava = ["#9C2315", ROJO_C, "#FF6B3D", "#FF8D71", ORO][t];
        let s = cuerpo(f, aro, cara, 0.87);
        const grietas = [
          [
            [-6, -100],
            [6, -100],
            [-10, -60],
            [14, -24],
            [-4, 10],
            [8, 40],
            [-2, 40],
            [-14, 10],
            [2, -24],
            [-20, -60],
          ],
          [
            [-80, -60],
            [-72, -66],
            [-40, -40],
            [-44, -12],
            [-36, -14],
            [-34, -46],
            [-70, -70],
          ],
          [
            [60, -96],
            [70, -90],
            [48, -52],
            [60, -20],
            [52, -18],
            [40, -52],
          ],
          [
            [-50, 40],
            [-44, 34],
            [-18, 70],
            [-24, 96],
            [-30, 94],
            [-26, 70],
          ],
          [
            [70, 10],
            [76, 16],
            [40, 50],
            [44, 90],
            [36, 88],
            [32, 50],
          ],
        ];
        grietas.slice(0, 1 + t).forEach((g) => {
          s += P(g, lava);
        });
        if (t >= 1) s += banda(esc(f, 0.87), -110, -98, sh(aro, 0.2));
        if (t >= 2)
          s +=
            octo(0, -20, 30, sh(aro, -0.2)) +
            gema(0, -20, 15, t >= 4 ? ORO : "#FF8D71", { alto: 1.3 });
        if (t >= 3)
          [-1, 1].forEach((sx) => {
            const c = [
              [sx * 104, -124],
              [sx * 128, -150],
              [sx * 116, -112],
            ];
            s += pieza(sx < 0 ? c.slice().reverse() : c, aro);
          }); // cuernos de escoria
        if (t >= 4) {
          s +=
            `<g class="gota">${P(
              [
                [20, 40],
                [26, 50],
                [20, 58],
                [14, 50],
              ],
              ORO,
            )}</g>` +
            chispa(-64, -100, 8, ORO) +
            chispa(60, 40, 7, "#FF8D71", 0.6);
          return { fondo: aura(f, "#FF8D71"), cuerpo: s };
        }
        return { cuerpo: s };
      },
    },
    helheim: {
      get nombre() {
        return T_("casco.map.helheim");
      },
      color: "#9BE1C0",
      forma: "ataud",
      dibujar(t) {
        const f = F.ataud,
          aro = ["#A8957D", HUESO, HUESO, "#D9DBB4", "#A18CB6"][t],
          cara = ["#2B2530", "#2B2530", "#23202A", "#1C2420", "#1C1820"][t];
        const runa = ["#8A7C7A", HUESO, "#9BE1C0", "#9BE1C0", "#C77DFF"][t];
        let s = cuerpo(f, aro, cara, 0.86);
        const cf = esc(f, 0.86);
        [-86, 86].forEach((y) => {
          s += banda(cf, y - 7, y + 7, sh(aro, -0.12));
        }); // costillas de hueso
        if (t >= 1)
          [-50, 50].forEach((y) => {
            s += banda(cf, y - 5, y + 5, sh(aro, -0.25));
          });
        // runa (Hagalaz): dos palos y un cruce
        const g = t >= 2 ? ` class="pulso"` : "";
        s +=
          `<g${g}>` +
          P(
            [
              [-34, -58],
              [-24, -58],
              [-24, 58],
              [-34, 58],
            ],
            runa,
          ) +
          P(
            [
              [24, -58],
              [34, -58],
              [34, 58],
              [24, 58],
            ],
            runa,
          ) +
          P(
            [
              [-24, -14],
              [24, 6],
              [24, 18],
              [-24, -2],
            ],
            runa,
          ) +
          "</g>";
        if (t >= 3) {
          // calavera arriba
          s +=
            pieza(ngon(0, -104, 20, 8, Math.PI / 8), HUESO) +
            P(
              [
                [-10, -108],
                [-3, -108],
                [-3, -100],
                [-10, -100],
              ],
              cara,
            ) +
            P(
              [
                [3, -108],
                [10, -108],
                [10, -100],
                [3, -100],
              ],
              cara,
            ) +
            P(
              [
                [-8, -88],
                [8, -88],
                [6, -82],
                [-6, -82],
              ],
              sh(HUESO, -0.3),
            );
        }
        if (t >= 4) {
          s +=
            gema(0, 104, 12, "#C77DFF") +
            chispa(-60, -40, 8, "#C77DFF") +
            chispa(56, 80, 7, "#9BE1C0", 0.9);
          return { fondo: aura(f, "#C77DFF"), cuerpo: s };
        }
        if (t >= 2) return { fondo: t === 3 ? aura(f, "#9BE1C0") : "", cuerpo: s };
        return { cuerpo: s };
      },
    },
    costa: {
      get nombre() {
        return T_("casco.map.costa");
      },
      color: "#7FD4FF",
      forma: "gota",
      dibujar(t) {
        const f = F.gota,
          aro = ["#8A6A3A", ORO_O, ORO_O, "#C9A45E", ORO][t],
          cara = ["#6B5A45", "#5C4E3E", "#2F6F7A", "#285E68", "#1E4E5E"][t];
        let s = cuerpo(f, aro, cara, 0.86);
        const cf = esc(f, 0.86);
        s += tablas(cf, 5, sh(cara, -0.3));
        // soga: marcas en diagonal sobre el aro
        for (let i = 0; i < f.length; i++) {
          const a = f[i],
            b = f[(i + 1) % f.length];
          for (const k of [0.3, 0.7]) {
            const m = [(a[0] + (b[0] - a[0]) * k) * 0.93, (a[1] + (b[1] - a[1]) * k) * 0.93],
              ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + 0.7;
            s += P(
              rot(
                tr(
                  [
                    [-2.5, -7],
                    [2.5, -7],
                    [2.5, 7],
                    [-2.5, 7],
                  ],
                  m[0],
                  m[1],
                ),
                ang,
                m,
              ),
              sh(aro, -0.35),
            );
          }
        }
        if (t >= 1) {
          // ancla
          const c = t >= 4 ? ORO : "#B9B2B2";
          s +=
            pieza(
              [
                [-6, -64],
                [6, -64],
                [6, 44],
                [-6, 44],
              ],
              c,
              { n: [1, 0] },
            ) +
            pieza(
              [
                [-30, -52],
                [30, -52],
                [30, -42],
                [-30, -42],
              ],
              c,
              { n: [0, 1] },
            );
          s += pieza(
            [
              [-48, 20],
              [-38, 18],
              [-20, 44],
              [0, 52],
              [20, 44],
              [38, 18],
              [48, 20],
              [26, 62],
              [0, 70],
              [-26, 62],
            ],
            c,
            { n: [0, 1] },
          );
          s += octo(0, -74, 11, c) + octo(0, -74, 5, cara);
        }
        if (t >= 2)
          [
            [-66, -40],
            [70, -20],
            [-54, 60],
            [60, 70],
            [-80, 10],
          ].forEach(([x, y]) => {
            s += octo(x, y, 7, "#E8E2D6") + octo(x, y, 3, "#8A8478");
          }); // percebes
        if (t >= 3)
          [-1, 1].forEach((sx) => {
            const tn = [
              [sx * 20, 128],
              [sx * 44, 96],
              [sx * 74, 84],
              [sx * 92, 100],
              [sx * 80, 104],
              [sx * 64, 96],
              [sx * 48, 110],
              [sx * 30, 138],
            ];
            s += pieza(sx < 0 ? tn.slice().reverse() : tn, "#8A4E9A", { n: [0, 1] });
          }); // tentáculos
        if (t >= 4) {
          s +=
            gema(0, -8, 14, "#F2F9FF", { aro: 4, aroC: ORO }) +
            chispa(-70, -90, 8, "#FFFFFF") +
            chispa(76, 30, 7, "#7FD4FF", 0.7);
          return { fondo: aura(f, "#7FD4FF"), cuerpo: s };
        }
        return { cuerpo: s };
      },
    },
  };
  function CUERO() {
    return "#5A3A22";
  }
  const MAPAS = Object.keys(TEMAS);

  /* =====================================================================
   * LEGENDARIOS DE CUALQUIER MAPA: 10 escudos únicos.
   * Las estadísticas las pone la oleada en la que caen (como las 10 espadas legendarias).
   * ===================================================================== */
  const LEGS = {
    svalinn: {
      color: ORO,
      f() {
        // el escudo que tapa al sol
        const f = F.redondo;
        let s = "";
        for (let i = 0; i < 12; i++) {
          const a = (i * Math.PI) / 6;
          s += pieza(
            rot(
              [
                [-16, -118],
                [16, -118],
                [0, -156],
              ],
              a,
            ),
            i % 2 ? "#FF8D71" : ORO,
            { n: [0, -1] },
          );
        }
        s +=
          cuerpo(f, "#B5862C", "#F0CD85", 0.86) +
          pieza(ngon(0, 0, 70, 12), "#FFE3A0", { luz: 0.3 }) +
          pieza(ngon(0, 0, 40, 12, Math.PI / 12), "#FFF3CC") +
          gema(0, 0, 14, "#FF8D71");
        return {
          fondo: aura(f, ORO),
          cuerpo: s + chispa(-90, -90, 9, "#FFFFFF") + chispa(84, 70, 7, ORO, 0.6),
        };
      },
    },
    heimdall: {
      color: "#FFF3CC",
      f() {
        // el que vigila el puente y sopla el cuerno
        const f = F.punta;
        let s = cuerpo(f, "#D9A441", "#E9E2D2", 0.87);
        // Gjallarhorn: un cuerno curvo que se abre en la boca
        const eje = Array.from({ length: 9 }, (_, i) => {
          const u = i / 8;
          return [-46 + 86 * u, 60 - 96 * u - 30 * Math.sin(u * Math.PI)];
        });
        const izq = [],
          der = [];
        eje.forEach((p, i) => {
          const q = eje[Math.min(8, i + 1)],
            r = eje[Math.max(0, i - 1)],
            a = Math.atan2(q[1] - r[1], q[0] - r[0]),
            w = 4 + i * i * 0.22;
          izq.push([p[0] + Math.sin(a) * w, p[1] - Math.cos(a) * w]);
          der.push([p[0] - Math.sin(a) * w, p[1] + Math.cos(a) * w]);
        });
        s +=
          P(izq.concat(der.slice().reverse()), ORO) +
          P(der.slice(4).concat(eje.slice(4).reverse()), "#D9A441");
        [2, 5].forEach((i) => {
          const p = eje[i];
          s += P(
            rot(
              [
                [-3, -12 - i],
                [3, -12 - i],
                [3, 12 + i],
                [-3, 12 + i],
              ],
              0.5,
              [0, 0],
            ).map(([x, y]) => [x + p[0], y + p[1]]),
            "#B5862C",
          );
        });
        s += P(
          [izq[8], der[8], [der[8][0] + 8, der[8][1] - 10], [izq[8][0] + 10, izq[8][1] - 4]],
          "#8C6A2A",
        );
        s +=
          P(
            [
              [-18, -84],
              [0, -98],
              [18, -84],
              [0, -70],
            ],
            "#4FA8FF",
          ) +
          P(
            [
              [-6, -84],
              [0, -90],
              [6, -84],
              [0, -78],
            ],
            "#111111",
          ); // ojo del vigía
        return {
          fondo: aura(f, "#FFF3CC"),
          cuerpo: s + chispa(-70, -100, 8, "#FFFFFF") + chispa(40, 80, 6, ORO, 0.8),
        };
      },
    },
    ymir: {
      color: "#DDF3FF",
      f() {
        // hielo del primer gigante
        const f = [
          [0, -150],
          [56, -120],
          [70, -140],
          [104, -60],
          [92, 20],
          [112, 60],
          [60, 120],
          [0, 150],
          [-60, 120],
          [-112, 60],
          [-92, 20],
          [-104, -60],
          [-70, -140],
          [-56, -120],
        ];
        let s = P(f, "#9CC0EE");
        for (let i = 0; i < f.length; i++) {
          const a = f[i],
            b = f[(i + 1) % f.length];
          s += P([[0, 0], a, b], i % 3 === 0 ? "#DDF3FF" : i % 3 === 1 ? "#CFE8FF" : "#8FB4E0");
        }
        s += pieza(ngon(0, 0, 44, 6), "#F2F9FF", { luz: 0.3 }) + gema(0, 0, 16, "#7FD4FF");
        return {
          fondo: aura(f, "#DDF3FF"),
          cuerpo: s + chispa(-80, -60, 8, "#FFFFFF") + chispa(70, 90, 7, "#DDF3FF", 0.7),
        };
      },
    },
    muspel: {
      color: "#FF8D71",
      f() {
        // fuego del reino de Surtr
        const f = F.punta;
        let s = "";
        [
          [-90, -124, -70, -176, -50, -124],
          [-50, -124, -24, -196, 0, -124],
          [0, -124, 26, -186, 50, -124],
          [50, -124, 76, -170, 96, -124],
        ].forEach(([a, b, c, d, e, g], i) => {
          s +=
            P(
              [
                [a, b],
                [c, d],
                [e, g],
              ],
              i % 2 ? ORO : "#FF8D71",
            ) +
            P(
              [
                [a + 10, b],
                [c, d + 26],
                [e - 10, g],
              ],
              i % 2 ? "#FF8D71" : ORO,
            );
        });
        s += cuerpo(f, ROJO_O, ROJO, 0.86);
        s +=
          pieza(
            [
              [0, -80],
              [36, -20],
              [22, 50],
              [0, 80],
              [-22, 50],
              [-36, -20],
            ],
            "#FF6B3D",
          ) +
          pieza(
            [
              [0, -40],
              [20, 0],
              [10, 44],
              [0, 56],
              [-10, 44],
              [-20, 0],
            ],
            ORO,
          ) +
          gema(0, 14, 11, "#FFF3CC");
        return {
          fondo: aura(f, "#FF8D71"),
          cuerpo:
            s +
            `<g class="gota">${P(
              [
                [60, 20],
                [66, 30],
                [60, 38],
                [54, 30],
              ],
              ORO,
            )}</g>` +
            chispa(-70, -40, 8, ORO, 0.4),
        };
      },
    },
    mani: {
      color: "#C9C6DA",
      f() {
        // la luna que persiguen los lobos
        const f = F.redondo;
        let s = cuerpo(f, "#C9C6DA", "#1E2A4A", 0.86);
        const n = 12,
          afuera = Array.from({ length: n + 1 }, (_, i) => {
            const a = Math.PI * 0.15 + (i * Math.PI * 1.7) / n;
            return [Math.cos(a + Math.PI / 2) * 74 - 6, Math.sin(a + Math.PI / 2) * 74];
          });
        const adentro = afuera.map(([x, y]) => [x * 0.78 + 30, y * 0.78]).reverse();
        s += pieza(afuera.concat(adentro), "#E9E6F2", { n: [0.9, 0.4] });
        [
          [40, -50, 7],
          [60, 20, 5],
          [20, 60, 6],
          [70, -10, 4],
        ].forEach(([x, y, r], i) => {
          s += chispa(x, y, r, "#FFFFFF", i * 0.4);
        });
        return { fondo: aura(f, "#C9C6DA"), cuerpo: s };
      },
    },
    valquiria: {
      color: "#F2ECEC",
      f() {
        // alas de las que eligen a los caídos
        const f = F.redondo;
        let s = "";
        [-1, 1].forEach((sx) => {
          for (let i = 0; i < 5; i++) {
            const y = -96 + i * 30,
              x0 = sx * 60,
              x1 = sx * (178 - i * 16);
            const p = [
              [x0, y],
              [x1, y - 34 + i * 6],
              [x1 - sx * 22, y + 12],
              [x0, y + 26],
            ];
            s += pieza(sx < 0 ? p.slice().reverse() : p, i % 2 ? "#DAD4D4" : "#F2ECEC", {
              n: [0, 1],
              sombra: -0.12,
            });
          }
        });
        s += cuerpo(f, "#8C8484", "#CFC9C9", 0.86) + tablas(esc(f, 0.86), 4, "#B9B2B2", 2);
        s += umbo(32, ORO, { gema: "#4FA8FF" });
        return {
          fondo: aura(f, "#F2ECEC"),
          cuerpo: s + chispa(-150, -80, 8, "#FFFFFF") + chispa(150, -40, 7, ORO, 0.6),
        };
      },
    },
    valhalla: {
      color: ORO,
      f() {
        // el techo del salón está hecho de escudos
        const f = F.scutum;
        let s = cuerpo(f, "#D9A441", ROJO_O, 0.88);
        for (let fy = 0; fy < 4; fy++)
          for (let fx = 0; fx < 3; fx++) {
            const x = (fx - 1) * 48 + (fy % 2 ? 0 : 0),
              y = -90 + fy * 60;
            s +=
              pieza(ngon(x, y, 22, 8, Math.PI / 8), (fx + fy) % 2 ? ORO : "#E0A93A", {
                luz: 0.25,
              }) + octo(x, y, 7, "#B5862C");
          }
        return {
          fondo: aura(f, ORO),
          cuerpo: s + chispa(-74, -126, 8, "#FFF3CC") + chispa(72, 124, 7, ORO, 0.7),
        };
      },
    },
    nidhogg: {
      color: "#3DDC84",
      f() {
        // escama del dragón que roe la raíz del mundo
        const f = F.punta;
        let s = cuerpo(f, "#1C1820", "#2E5A3A", 0.87);
        const cf = esc(f, 0.87);
        for (let fy = 0; fy < 6; fy++)
          for (let fx = -3; fx <= 3; fx++) {
            const x = fx * 30 + (fy % 2 ? 15 : 0),
              y = -96 + fy * 34,
              e = dentro(
                [
                  [x - 15, y - 6],
                  [x + 15, y - 6],
                  [x + 10, y + 16],
                  [x, y + 24],
                  [x - 10, y + 16],
                ],
                cf,
              );
            if (e.length > 2)
              s += pieza(e, (fx + fy) % 3 ? "#4E8A5A" : "#6E9A5E", { n: [0.3, 0.95] });
          }
        s +=
          P(
            [
              [-30, -30],
              [0, -46],
              [30, -30],
              [0, -14],
            ],
            "#111111",
          ) +
          P(
            [
              [-20, -30],
              [0, -40],
              [20, -30],
              [0, -20],
            ],
            "#D9F24E",
          ) +
          P(
            [
              [-3, -40],
              [3, -40],
              [3, -20],
              [-3, -20],
            ],
            "#111111",
          ); // ojo
        return { fondo: aura(f, "#3DDC84"), cuerpo: s + chispa(-70, 20, 7, "#9BE1C0", 0.3) };
      },
    },
    draupnir: {
      color: ORO,
      f() {
        // el anillo de Odín que cada nueve noches da ocho más
        const f = F.redondo;
        let s = cuerpo(f, "#B5862C", "#F0CD85", 0.88);
        [86, 64, 42].forEach((r, i) => {
          s += pieza(ngon(0, 0, r, 8, Math.PI / 8), i % 2 ? "#F0CD85" : "#D9A441", { luz: 0.2 });
        });
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4,
            x = Math.sin(a) * 100,
            y = -Math.cos(a) * 100;
          s += octo(x, y, 12, "#FFE3A0") + octo(x, y, 6, "#B5862C");
        }
        s += gema(0, 0, 18, RUBI, { aro: 4, aroC: "#5E130D" });
        return {
          fondo: aura(f, ORO),
          cuerpo: s + chispa(-60, -60, 8, "#FFFFFF") + chispa(60, 50, 7, ORO, 0.8),
        };
      },
    },
    eromash: {
      color: ROJO_C,
      f() {
        // el escudo de la casa: la cara de los menús
        const f = [
          [-70, -140],
          [70, -140],
          [100, -110],
          [100, 90],
          [50, 140],
          [-70, 140],
          [-100, 110],
          [-100, -110],
        ];
        let s = cuerpo(f, ROJO_O, ROJO, 0.88);
        s += P(
          [
            [70, -140],
            [100, -110],
            [100, -80],
            [60, -124],
            [36, -124],
            [48, -140],
          ],
          ORO,
        ); // esquina dorada
        s += franja(esc(f, 0.88), -84, -70, ROJO_C); // tira roja
        [-1, 1].forEach((sx) => {
          const c = [
            [sx * 30, -10],
            [sx * 66, -64],
            [sx * 58, -20],
            [sx * 44, 4],
          ];
          s += pieza(sx < 0 ? c.slice().reverse() : c, "#E3D6C4", { n: [0, 1] });
        }); // cuernos
        s +=
          pieza(
            [
              [0, -60],
              [52, 0],
              [0, 60],
              [-52, 0],
            ],
            ORO,
            { luz: 0.25 },
          ) +
          pieza(
            [
              [0, -34],
              [30, 0],
              [0, 34],
              [-30, 0],
            ],
            ROJO_C,
          ) +
          gema(0, 0, 10, ORO);
        return {
          fondo: aura(f, ROJO_C),
          cuerpo: s + chispa(-70, 100, 7, ORO, 0.3) + chispa(70, -100, 8, "#FFFFFF", 0.9),
        };
      },
    },
  };
  const LEG_ORDEN = Object.keys(LEGS);

  /* ---------- catálogo ---------- */
  const fila = (m, t) => ({
    id: `escudo-${m}-${t + 1}`,
    mapa: m,
    mapaNombre: TEMAS[m].nombre,
    rareza: RAREZAS[t],
    rarezaNombre: RAR[RAREZAS[t]].t,
    color: RAR[RAREZAS[t]].c,
    t,
    leg: null,
  });
  const filaLeg = (k) => ({
    id: `escudo-leg-${k}`,
    mapa: null,
    mapaNombre: T_("vr.cualquierMapa"),
    rareza: "leg",
    rarezaNombre: RAR.leg.t,
    color: RAR.leg.c,
    t: 4,
    leg: k,
    porOleada: true,
    acento: LEGS[k].color,
  });
  const lista = (m) =>
    m === "todas"
      ? lista().concat(lista("legendarias"))
      : m === "legendarias"
        ? LEG_ORDEN.map(filaLeg)
        : m && TEMAS[m]
          ? RAREZAS.map((r, t) => fila(m, t))
          : MAPAS.flatMap((x) => lista(x));
  const datos = (id) => lista("todas").find((x) => x.id === id);
  const construir = (d) => (d.leg ? LEGS[d.leg].f() : TEMAS[d.mapa].dibujar(d.t));

  const ESTILO = `<style>
.pulso{animation:ecPulso 1.6s steps(4) infinite}
.chispa{animation:ecChispa 1.8s steps(3) infinite;transform-box:fill-box;transform-origin:center}
.gota{animation:ecGota 1.8s steps(6) infinite}
@keyframes ecPulso{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes ecChispa{0%,100%{transform:scale(.3);opacity:0}50%{transform:scale(1);opacity:1}}
@keyframes ecGota{0%{transform:translateY(0);opacity:1}100%{transform:translateY(26px);opacity:0}}
@media (prefers-reduced-motion:reduce){.pulso,.chispa,.gota{animation:none}}
</style>`;
  const CAJA = 180; // viewBox cuadrado de -180 a 180 (los legendarios con alas salen un poco del escudo)
  function svg(id, o = {}) {
    const d = typeof id === "object" ? id : datos(id);
    if (!d) return "";
    const g = construir(d),
      est = o.sinEstilo ? "" : ESTILO;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-CAJA} ${-CAJA} ${CAJA * 2} ${CAJA * 2}" role="img" aria-label="${d.id}">${est}${g.fondo || ""}${g.cuerpo}${g.frente || ""}</svg>`;
  }

  /* ---------- adaptador para el juego ---------- */
  const LEG_GLOBAL = 0.5; // si cae un escudo legendario: chance de que sea uno de los 10 de cualquier mapa (si no, el del mapa)
  const TIER = { comun: 0, rara: 2, epica: 3, legendaria: 4 };
  const COLOR_TIER = ["#B7AAAA", "#3DDC84", "#4FA8FF", "#C77DFF", "#FFD98A"];
  function sortear(mapaId, rareza, rnd = Math.random) {
    const mapa = TEMAS[mapaId] ? mapaId : "arena";
    const leg =
      rareza === "legendaria" && rnd() < LEG_GLOBAL
        ? LEG_ORDEN[Math.floor(rnd() * LEG_ORDEN.length)]
        : null;
    return { mapa, leg };
  }
  function tier(it) {
    if (!it || it.slot !== "escudo") return -1;
    const t = TIER[it.rarity] != null ? TIER[it.rarity] : 0;
    return t === 0 && (it.forja || 0) >= 2 ? 1 : t; // un común forjado a +2 ya se ve poco común
  }
  // fila del catálogo para una pieza del inventario (los escudos de partidas viejas, sin mapa, se ven como los de la arena)
  function deItem(it) {
    const t = tier(it);
    if (t < 0) return null;
    if (it.leg && LEGS[it.leg]) return filaLeg(it.leg);
    return fila(it.mapa && TEMAS[it.mapa] ? it.mapa : "arena", t);
  }
  const cache = new Map();
  function imagenDe(d) {
    let im = cache.get(d.id);
    if (!im && typeof Image !== "undefined") {
      im = new Image();
      im.src =
        "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg(d, { sinEstilo: true }));
      cache.set(d.id, im);
    }
    return im;
  }
  function precargar() {
    lista("todas").forEach(imagenDe);
  }
  /* en la mano: centrado en (x, y), escala en unidades del cuerpo (1 = 360 px de alto) */
  function dibujar(ctx, it, x, y, escala, espejo, brillo, ang) {
    const d = deItem(it);
    if (!d) return false;
    const im = imagenDe(d);
    if (!im || !im.complete || !im.naturalWidth) return false;
    ctx.save();
    ctx.translate(x, y);
    if (ang) ctx.rotate(ang);
    ctx.scale(escala * (espejo ? -1 : 1), escala);
    if (brillo) {
      ctx.shadowColor = d.leg ? LEGS[d.leg].color : COLOR_TIER[d.t];
      ctx.shadowBlur = 20;
    }
    ctx.drawImage(im, -CAJA, -CAJA, CAJA * 2, CAJA * 2);
    ctx.restore();
    return true;
  }
  function icono(it) {
    const d = deItem(it);
    return d ? svg(d, { sinEstilo: true }) : "";
  }
  function imagenItem(it) {
    const d = deItem(it);
    if (!d) return null;
    const im = imagenDe(d);
    return im && im.complete && im.naturalWidth ? im : null;
  }

  global.EromashEscudos = {
    MAPAS,
    RAREZAS,
    TEMAS,
    LEGS,
    LEG_ORDEN,
    LEG_GLOBAL,
    RAR,
    lista,
    datos,
    svg,
    sortear,
    tier,
    deItem,
    imagenDe,
    precargar,
    dibujar,
    icono,
    imagenItem,
  };
  if (typeof Image !== "undefined") precargar();
})(typeof window !== "undefined" ? window : globalThis);
