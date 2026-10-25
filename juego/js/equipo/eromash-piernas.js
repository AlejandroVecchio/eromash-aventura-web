// Pantalones y botas dropeables: uno de cada por pechera (10 modelos × 5 rarezas), con el mapa, los colores y el rasgo de su set.
// Diseño y colección en referencias/ui-objetos/pantalones-y-botas/. Usa lo que deja pecheras-lib.js (BASES, MAPS, TIERS, PINCHO, P, MX, rombo, lt, dk).
// El juego usa: EromashPiernas.vestir(pieza, fijo) al crear una pieza de pantalones o botas, icono(pieza) para el inventario,
// imagen(pieza) para el botín en el piso y renovar(jugador), que cambia las botas viejas (las de antes de este catálogo) por una de estas.
window.EromashPiernas = (function () {
  function armarPierna(base, b, t, tipo) {
    const mi = base.map,
      M = MAPS[mi],
      L = t === 4,
      l = [0, 0.05, 0.09, 0.13, 0.17][t];
    const c = { a: lt(base.c.a, l), b: lt(base.c.b, l), c: lt(base.c.c, l * 0.6), d: base.c.d };
    const mult = tipo === "pan" ? 0.8 : 0.6; // la pechera defiende más que el pantalón, y éste más que la bota
    const nk = "pierna." + base.estilo + "." + tipo + (L ? "L" : "");
    return {
      id: `${M.id}-${base.estilo}-${t + 1}`,
      tipo,
      b,
      t,
      map: mi,
      r: TIERS[t],
      L,
      c,
      estilo: base.estilo,
      fuerte: base.fuerte,
      nk,
      get n() {
        return window.I18N ? I18N.t(nk) : nk;
      },
      def: base.defR.map((v) => Math.max(1, Math.round(v * mult * (1 + 0.15 * t)))),
      ribete: L ? "#FFD98A" : t >= 1 ? M.c : dk(base.c.c, 0.2),
      metal: L ? "#FFD98A" : "#D9D2C8",
    };
  }
  const PANTALONES = [],
    BOTAS = [];
  BASES.forEach((base, b) =>
    TIERS.forEach((_, t) => {
      PANTALONES.push(armarPierna(base, b, t, "pan"));
      BOTAS.push(armarPierna(base, b, t, "bot"));
    }),
  );

  const cintoCol = (c) => (c.d == c.c ? dk(c.c, 0.25) : c.d);
  const cresta = (p, x, y, s) =>
    `<g transform="translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})">${PINCHO[p.map](x, y, p.L ? "#FFD98A" : MAPS[p.map].c, p.L ? "#FFFFFF" : "#E0392E")}</g>`;
  const chispas = (pts) =>
    pts
      .map(
        ([x, y], i) =>
          `<rect class="brasa ${"abc"[i % 3]}" x="${x}" y="${y}" width="12" height="12" fill="#FFD98A" transform="rotate(45 ${x + 6} ${y + 6})"/>`,
      )
      .join("");

  /* ============================================================
   * PANTALÓN · coordenadas de miniatura (0..480), eje en x=240
   * ============================================================ */
  const CADERA = [
    [148, 128],
    [332, 128],
    [344, 212],
    [240, 224],
    [136, 212],
  ];
  const PIERNA = [
    [136, 206],
    [240, 218],
    [230, 300],
    [224, 432],
    [146, 432],
    [132, 300],
  ];
  const PANT_SOMBRA = [
    [132, 330],
    [228, 330],
    [224, 432],
    [146, 432],
  ];
  const CINTURA = [
    [144, 98],
    [336, 98],
    [334, 130],
    [146, 130],
  ];
  const DOBLE = (pts, f, x) => P(pts, f, x) + P(MX(pts), f, x);

  /* el rasgo propio de cada modelo, sobre los muslos */
  const MUSLO = {
    placa: (c) =>
      DOBLE(
        [
          [134, 244],
          [236, 256],
          [235, 276],
          [135, 264],
        ],
        c.c,
      ) + rombo(240, 172, 12, "#FF8D71"),
    brasero: (c) =>
      [236, 280]
        .map(
          (y) =>
            DOBLE(
              [
                [150, y],
                [222, y + 6],
                [221, y + 20],
                [150, y + 14],
              ],
              "#FF8D71",
            ) +
            DOBLE(
              [
                [164, y + 5],
                [210, y + 9],
                [209, y + 15],
                [164, y + 11],
              ],
              "#FFD98A",
            ),
        )
        .join(""),
    corteza: (c) =>
      DOBLE(
        [
          [168, 232],
          [188, 230],
          [184, 424],
          [166, 424],
        ],
        c.c,
      ) +
      P(
        [
          [140, 100],
          [170, 84],
          [200, 98],
          [240, 82],
          [280, 98],
          [310, 84],
          [340, 100],
          [336, 114],
          [280, 106],
          [240, 112],
          [200, 106],
          [144, 114],
        ],
        "#F2F6F8",
      ),
    pelaje: (c) =>
      P(
        [
          [134, 128],
          [150, 166],
          [168, 138],
          [186, 170],
          [204, 140],
          [222, 172],
          [240, 144],
          [258, 172],
          [276, 140],
          [294, 170],
          [312, 138],
          [330, 166],
          [346, 128],
        ],
        "#E8ECEE",
      ) +
      P(
        [
          [134, 128],
          [150, 166],
          [168, 138],
          [186, 170],
          [204, 140],
          [222, 172],
          [240, 144],
          [240, 128],
        ],
        "#C8D0D4",
      ) +
      `<g stroke="#CDB48A" stroke-width="6">${[250, 300, 350].map((y) => `<line x1="170" y1="${y}" x2="200" y2="${y + 34}"/><line x1="200" y1="${y}" x2="170" y2="${y + 34}"/><line x1="280" y1="${y}" x2="310" y2="${y + 34}"/><line x1="310" y1="${y}" x2="280" y2="${y + 34}"/>`).join("")}</g>`,
    escoria: (c) =>
      `<polyline points="176,150 194,220 170,286 190,360" fill="none" stroke="#FF8D71" stroke-width="10" stroke-linejoin="round"/><polyline points="300,200 284,262 300,318" fill="none" stroke="#FF8D71" stroke-width="8" stroke-linejoin="round"/><polyline points="194,220 170,286" fill="none" stroke="#FFD98A" stroke-width="10"/>`,
    caldera: (c) =>
      DOBLE(
        [
          [134, 256],
          [236, 266],
          [235, 286],
          [135, 276],
        ],
        "#C8963E",
      ) +
      [152, 184, 216]
        .map((x) => rombo(x, 271, 5, "#2A2424") + rombo(480 - x, 271, 5, "#2A2424"))
        .join(""),
    hueso: (c) =>
      DOBLE(
        [
          [178, 236],
          [192, 236],
          [190, 318],
          [180, 318],
        ],
        "#E8DCC4",
      ) +
      [
        [185, 232],
        [185, 322],
      ]
        .map(([x, y]) => rombo(x, y, 10, "#E8DCC4") + rombo(480 - x, y, 10, "#CFC3A8"))
        .join(""),
    runa: (c) =>
      `<g stroke="#E0392E" stroke-width="10" stroke-linecap="round" fill="none"><path d="M184 232 V312 M184 258 L164 238 M184 258 L204 238"/><path d="M296 232 V312 M296 232 L316 252 M296 262 L316 282"/></g>`,
    tablas: (c) =>
      DOBLE(
        [
          [134, 236],
          [146, 222],
          [232, 294],
          [228, 312],
        ],
        "#CDB48A",
      ) +
      `<g stroke="#8E7A58" stroke-width="3">${[0, 1, 2].map((i) => `<line x1="${156 + i * 26}" y1="${240 + i * 22}" x2="${150 + i * 26}" y2="${252 + i * 22}"/><line x1="${324 - i * 26}" y1="${240 + i * 22}" x2="${330 - i * 26}" y2="${252 + i * 22}"/>`).join("")}</g>`,
    aleta: (c) =>
      [230, 276]
        .map((y) =>
          DOBLE(
            [
              [144, y],
              [184, y + 22],
              [224, y],
              [224, y + 14],
              [184, y + 36],
              [144, y + 14],
            ],
            "#BFE9FF",
          ),
        )
        .join(""),
  };

  /* rodilleras (raro en adelante): misma idea que las hombreras, con el rasgo del modelo */
  const RODILLA = [
    [-36, -20],
    [0, -34],
    [36, -20],
    [32, 22],
    [0, 36],
    [-32, 22],
  ];
  const RODILLA_A = [
    [-36, -20],
    [0, -34],
    [36, -20],
    [0, -4],
  ];
  const RODILLA_RASGO = {
    placa: (x, y, p) => rombo(x, y + 4, 8, p.metal),
    brasero: (x, y, p) =>
      P(
        [
          [x - 22, y + 2],
          [x + 22, y - 2],
          [x + 22, y + 8],
          [x - 22, y + 12],
        ],
        "#FF8D71",
      ),
    corteza: (x, y, p) =>
      P(
        [
          [x - 36, y - 20],
          [x - 18, y - 30],
          [x, y - 22],
          [x + 18, y - 30],
          [x + 36, y - 20],
          [x + 18, y - 14],
          [x, y - 10],
          [x - 18, y - 14],
        ],
        "#F2F6F8",
      ),
    pelaje: (x, y, p) =>
      P(
        [
          [x - 40, y - 18],
          [x - 30, y - 38],
          [x - 18, y - 22],
          [x - 6, y - 42],
          [x + 6, y - 22],
          [x + 18, y - 42],
          [x + 30, y - 22],
          [x + 40, y - 34],
          [x + 40, y - 10],
          [x - 40, y - 6],
        ],
        "#E8ECEE",
      ),
    escoria: (x, y, p) =>
      `<polyline points="${x - 10},${y - 28} ${x + 4},${y} ${x - 6},${y + 26}" fill="none" stroke="#FF8D71" stroke-width="6" stroke-linejoin="round"/>`,
    caldera: (x, y, p) =>
      P(
        [
          [x - 12, y - 10],
          [x + 12, y - 10],
          [x + 18, y],
          [x + 12, y + 14],
          [x - 12, y + 14],
          [x - 18, y],
        ],
        "#C8963E",
      ) +
      P(
        [
          [x - 6, y - 4],
          [x + 6, y - 4],
          [x + 9, y + 2],
          [x + 6, y + 8],
          [x - 6, y + 8],
          [x - 9, y + 2],
        ],
        "#2A2424",
      ),
    hueso: (x, y, p) =>
      P(
        [
          [x - 26, y - 24],
          [x, y - 34],
          [x + 26, y - 24],
          [x + 22, y + 12],
          [x, y + 22],
          [x - 22, y + 12],
        ],
        "#E8DCC4",
      ) +
      P(
        [
          [x - 14, y - 10],
          [x - 4, y - 10],
          [x - 4, y],
          [x - 14, y],
        ],
        "#26222E",
      ) +
      P(
        [
          [x + 4, y - 10],
          [x + 14, y - 10],
          [x + 14, y],
          [x + 4, y],
        ],
        "#26222E",
      ),
    runa: (x, y, p) =>
      `<path d="M${x} ${y - 24} V${y + 24} M${x} ${y - 4} L${x - 12} ${y - 16} M${x} ${y - 4} L${x + 12} ${y - 16}" stroke="#E0392E" stroke-width="6" stroke-linecap="round" fill="none"/>`,
    tablas: (x, y, p) =>
      `<g stroke="#2A1E14" stroke-width="3"><line x1="${x - 12}" y1="${y - 30}" x2="${x - 12}" y2="${y + 32}"/><line x1="${x + 12}" y1="${y - 30}" x2="${x + 12}" y2="${y + 32}"/></g>` +
      P(
        [
          [x - 36, y - 2],
          [x + 34, y - 6],
          [x + 34, y + 2],
          [x - 34, y + 6],
        ],
        "#CDB48A",
      ),
    aleta: (x, y, p) =>
      P(
        [
          [x - 28, y - 10],
          [x, y + 8],
          [x + 28, y - 10],
          [x + 28, y],
          [x, y + 18],
          [x - 28, y],
        ],
        "#BFE9FF",
      ),
  };
  function rodillera(p, x, y) {
    const F = (pts) => pts.map(([a, b]) => [x + a, y + b]);
    let o = "";
    if (p.t >= 3) o += cresta(p, x, y - 30, 0.8);
    o += P(F(RODILLA), p.c.b) + P(F(RODILLA_A), p.c.a);
    o += RODILLA_RASGO[p.estilo](x, y, p);
    o += P(
      F([
        [-32, 22],
        [0, 36],
        [32, 22],
        [32, 30],
        [0, 44],
        [-32, 30],
      ]),
      p.ribete,
    );
    o += rombo(x - 24, y - 14, 4, p.metal) + rombo(x + 24, y - 14, 4, p.metal);
    return o;
  }

  function pantalonItem(p) {
    const c = p.c,
      ribete = p.t >= 1 ? p.ribete : c.c;
    let o =
      P(CADERA, c.b) +
      P(PIERNA, c.a) +
      P(MX(PIERNA), c.b) +
      P(PANT_SOMBRA, c.c, 'opacity=".35"') +
      P(MX(PANT_SOMBRA), c.c, 'opacity=".35"') +
      P(
        [
          [240, 218],
          [230, 300],
          [240, 300],
        ],
        dk(c.b, 0.3),
      ) +
      DOBLE(
        [
          [146, 432],
          [224, 432],
          [224, 446],
          [146, 446],
        ],
        ribete,
      ) +
      MUSLO[p.estilo](c) +
      (p.estilo === "corteza" ? "" : P(CINTURA, cintoCol(c))) +
      (p.estilo === "corteza"
        ? P(
            [
              [144, 114],
              [200, 106],
              [240, 112],
              [280, 106],
              [336, 114],
              [334, 130],
              [146, 130],
            ],
            cintoCol(c),
          )
        : "") +
      P(
        [
          [224, 94],
          [256, 94],
          [256, 134],
          [224, 134],
        ],
        p.t >= 1 ? p.ribete : "#8E8888",
      ) +
      P(
        [
          [232, 102],
          [248, 102],
          [248, 126],
          [232, 126],
        ],
        "#1A1414",
      );
    if (p.t >= 2) o += rodillera(p, 182, 330) + rodillera(p, 298, 330);
    if (p.L)
      o += chispas([
        [96, 120],
        [380, 96],
        [394, 300],
      ]);
    return `<svg viewBox="28 40 424 430" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${p.n}">${o}</svg>`;
  }

  /* ============================================================
   * BOTAS · un par de perfil, caña a media pierna, la de atrás un poco más arriba y más oscura.
   * El par entero se achica (ESCALA_BOTA) para que quede en proporción con pechera y pantalón.
   * ============================================================ */
  const ESCALA_BOTA = 0.8;
  const CANA = [
    [198, 210],
    [288, 204],
    [292, 330],
    [292, 364],
    [198, 364],
    [196, 290],
  ];
  const CANA_A = [
    [198, 210],
    [242, 207],
    [242, 364],
    [198, 364],
    [196, 290],
  ];
  const PIE = [
    [198, 340],
    [292, 344],
    [298, 420],
    [106, 420],
    [100, 398],
    [126, 372],
    [192, 356],
  ];
  const SUELA = [
    [100, 420],
    [300, 420],
    [298, 440],
    [106, 440],
  ];
  const PUNO = [
    [190, 198],
    [296, 190],
    [298, 222],
    [192, 230],
  ];

  const CANA_RASGO = {
    placa: (c) =>
      P(
        [
          [198, 284],
          [292, 278],
          [292, 296],
          [198, 302],
        ],
        c.c,
      ) + rombo(244, 252, 10, "#FF8D71"),
    brasero: (c) =>
      [252, 298]
        .map(
          (y) =>
            P(
              [
                [208, y],
                [282, y - 4],
                [282, y + 10],
                [208, y + 14],
              ],
              "#FF8D71",
            ) +
            P(
              [
                [220, y + 4],
                [270, y + 1],
                [270, y + 7],
                [220, y + 10],
              ],
              "#FFD98A",
            ),
        )
        .join(""),
    corteza: (c) =>
      P(
        [
          [214, 236],
          [230, 234],
          [228, 356],
          [212, 356],
        ],
        c.c,
      ) +
      P(
        [
          [258, 232],
          [274, 230],
          [276, 356],
          [260, 356],
        ],
        c.c,
      ) +
      P(
        [
          [186, 200],
          [208, 180],
          [228, 194],
          [250, 176],
          [272, 192],
          [292, 178],
          [304, 194],
          [298, 206],
          [192, 212],
        ],
        "#F2F6F8",
      ),
    pelaje: (c) =>
      `<g stroke="#CDB48A" stroke-width="6">${[256, 302].map((y) => `<line x1="226" y1="${y}" x2="262" y2="${y + 30}"/><line x1="262" y1="${y}" x2="226" y2="${y + 30}"/>`).join("")}</g>` +
      P(
        [
          [182, 236],
          [186, 196],
          [202, 220],
          [216, 186],
          [232, 218],
          [248, 184],
          [264, 216],
          [280, 186],
          [294, 218],
          [308, 196],
          [306, 236],
          [244, 244],
        ],
        "#E8ECEE",
      ) +
      P(
        [
          [182, 236],
          [186, 196],
          [202, 220],
          [216, 186],
          [232, 218],
          [244, 200],
          [244, 244],
        ],
        "#C8D0D4",
      ),
    escoria: (c) =>
      `<polyline points="228,238 252,284 232,332" fill="none" stroke="#FF8D71" stroke-width="10" stroke-linejoin="round"/><polyline points="252,284 232,332" fill="none" stroke="#FFD98A" stroke-width="10"/>`,
    caldera: (c) =>
      P(
        [
          [198, 276],
          [292, 270],
          [292, 292],
          [198, 298],
        ],
        "#C8963E",
      ) +
      [214, 244, 274]
        .map(
          (x) =>
            rombo(x, 284, 5, "#2A2424") + rombo(x, 248, 5, "#D9D2C8") + rombo(x, 328, 5, "#D9D2C8"),
        )
        .join(""),
    hueso: (c) =>
      [248, 286, 324]
        .map((y, i) =>
          P(
            [
              [202, y],
              [288, y - 6],
              [286, y + 10],
              [204, y + 14],
            ],
            i % 2 ? "#CFC3A8" : "#E8DCC4",
          ),
        )
        .join(""),
    runa: (c) =>
      `<path d="M244 244 V340 M244 276 L224 256 M244 276 L264 256" stroke="#E0392E" stroke-width="10" stroke-linecap="round" fill="none"/>`,
    tablas: (c) =>
      P(
        [
          [196, 254],
          [292, 282],
          [292, 302],
          [196, 274],
        ],
        "#CDB48A",
      ) +
      `<g stroke="#8E7A58" stroke-width="3">${[0, 1, 2].map((i) => `<line x1="${214 + i * 28}" y1="${258 + i * 8}" x2="${214 + i * 28}" y2="${274 + i * 8}"/>`).join("")}</g>`,
    aleta: (c) =>
      [246, 294]
        .map((y) =>
          P(
            [
              [200, y],
              [244, y + 26],
              [290, y],
              [290, y + 14],
              [244, y + 40],
              [200, y + 14],
            ],
            "#BFE9FF",
          ),
        )
        .join(""),
  };

  /* refuerzo arriba de la caña (raro en adelante): la "hombrera" de la bota */
  const REFUERZO = [
    [184, 172],
    [240, 160],
    [304, 172],
    [300, 206],
    [244, 216],
    [188, 208],
  ];
  const REFUERZO_A = [
    [184, 172],
    [240, 160],
    [304, 172],
    [244, 186],
  ];
  const REFUERZO_RASGO = {
    placa: (p) => rombo(244, 190, 8, p.metal),
    brasero: (p) =>
      P(
        [
          [206, 188],
          [282, 182],
          [282, 192],
          [206, 198],
        ],
        "#FF8D71",
      ),
    corteza: (p) =>
      P(
        [
          [184, 172],
          [210, 158],
          [240, 166],
          [270, 154],
          [304, 172],
          [270, 174],
          [240, 180],
          [210, 174],
        ],
        "#F2F6F8",
      ),
    pelaje: (p) =>
      P(
        [
          [178, 176],
          [192, 152],
          [208, 168],
          [224, 146],
          [240, 164],
          [258, 146],
          [274, 166],
          [292, 148],
          [310, 172],
          [298, 184],
          [190, 186],
        ],
        "#E8ECEE",
      ),
    escoria: (p) =>
      `<polyline points="232,164 246,188 238,210" fill="none" stroke="#FF8D71" stroke-width="6" stroke-linejoin="round"/>`,
    caldera: (p) =>
      P(
        [
          [232, 178],
          [256, 178],
          [262, 190],
          [256, 202],
          [232, 202],
          [226, 190],
        ],
        "#C8963E",
      ) +
      P(
        [
          [238, 184],
          [250, 184],
          [253, 190],
          [250, 196],
          [238, 196],
          [235, 190],
        ],
        "#2A2424",
      ),
    hueso: (p) =>
      P(
        [
          [198, 170],
          [244, 160],
          [290, 170],
          [286, 198],
          [244, 208],
          [202, 198],
        ],
        "#E8DCC4",
      ) +
      P(
        [
          [226, 178],
          [238, 178],
          [238, 190],
          [226, 190],
        ],
        "#26222E",
      ) +
      P(
        [
          [250, 178],
          [262, 178],
          [262, 190],
          [250, 190],
        ],
        "#26222E",
      ),
    runa: (p) =>
      `<path d="M244 168 V208 M244 184 L230 172 M244 184 L258 172" stroke="#E0392E" stroke-width="6" stroke-linecap="round" fill="none"/>`,
    tablas: (p) =>
      `<g stroke="#2A1E14" stroke-width="3"><line x1="222" y1="162" x2="222" y2="212"/><line x1="266" y1="162" x2="266" y2="212"/></g>` +
      P(
        [
          [184, 188],
          [302, 184],
          [302, 192],
          [186, 196],
        ],
        "#CDB48A",
      ),
    aleta: (p) =>
      P(
        [
          [206, 176],
          [244, 194],
          [282, 176],
          [282, 186],
          [244, 204],
          [206, 186],
        ],
        "#BFE9FF",
      ),
  };

  function bota(p, c, rasgo) {
    const ribete = p.t >= 1 ? p.ribete : c.c;
    let o = "";
    o +=
      P(PIE, c.b) +
      P(
        [
          [100, 398],
          [298, 400],
          [298, 420],
          [106, 420],
        ],
        c.c,
        'opacity=".35"',
      );
    o += P(CANA, c.b) + P(CANA_A, c.a);
    o += P(
      [
        [196, 330],
        [292, 330],
        [292, 364],
        [198, 364],
      ],
      c.c,
      'opacity=".25"',
    );
    if (rasgo) o += CANA_RASGO[p.estilo](c);
    o +=
      P(SUELA, "#1A1414") +
      P(
        [
          [102, 412],
          [298, 412],
          [298, 420],
          [102, 420],
        ],
        ribete,
      );
    if (p.estilo !== "pelaje")
      o +=
        P(PUNO, c.c) +
        P(
          [
            [192, 222],
            [298, 214],
            [298, 226],
            [192, 234],
          ],
          ribete,
        );
    else
      o += P(
        [
          [190, 236],
          [300, 228],
          [300, 238],
          [190, 246],
        ],
        ribete,
      );
    if (p.t >= 2) {
      o +=
        P(
          [
            [100, 398],
            [126, 372],
            [156, 366],
            [150, 420],
            [106, 420],
          ],
          c.c,
        ) +
        P(
          [
            [100, 398],
            [126, 372],
            [156, 366],
            [152, 382],
          ],
          c.a,
        );
      o += rombo(132, 398, 5, p.metal);
      if (p.t >= 3) o += cresta(p, 244, 166, 0.9);
      o += P(REFUERZO, c.b) + P(REFUERZO_A, c.a);
      if (rasgo) o += REFUERZO_RASGO[p.estilo](p);
      o += P(
        [
          [188, 208],
          [244, 216],
          [300, 206],
          [300, 214],
          [244, 224],
          [188, 216],
        ],
        p.ribete,
      );
      o += rombo(200, 186, 4, p.metal) + rombo(288, 186, 4, p.metal);
    }
    return o;
  }

  function botaItem(p) {
    const c = p.c,
      cAtras = { a: dk(c.a, 0.3), b: dk(c.b, 0.3), c: dk(c.c, 0.3), d: c.d };
    const par = `<g transform="translate(70 -14)">${bota(p, cAtras, false)}</g>${bota(p, c, true)}`;
    const o =
      `<g transform="translate(240 262) scale(${ESCALA_BOTA}) translate(-238 -291)">${par}</g>` +
      (p.L
        ? chispas([
            [110, 150],
            [362, 130],
            [380, 330],
          ])
        : "");
    return `<svg viewBox="28 40 424 430" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${p.n}">${o}</svg>`;
  }

  /* ---------- en el juego ---------- */
  const MAPA_I = { arena: 0, bosque: 1, volcan: 2, helheim: 3, costa: 4 };
  const LISTA = { pantalones: PANTALONES, botas: BOTAS };
  const porId = (slot, id) => (LISTA[slot] || []).find((x) => x.id === id) || null;
  const de = (it) => (it && it.piernaId ? porId(it.slot, it.piernaId) : null);
  // elige el modelo según el mapa y la rareza, igual que las pecheras: común a veces sale con el ribete de poco común
  function vestir(it, fijo, mapa) {
    if (!it || !LISTA[it.slot]) return it;
    const mi = fijo
      ? 0
      : mapa != null
        ? mapa
        : MAPA_I[window.INV && INV.zona ? INV.zona() : window.ESC && ESC.actual && ESC.actual.id] ||
          0;
    let tier =
      it.rarity === "legendaria" ? 4 : it.rarity === "epica" ? 3 : it.rarity === "rara" ? 2 : 0;
    if (!fijo && tier === 0 && Math.random() < 0.35) tier = 1;
    let lista = LISTA[it.slot].filter((x) => x.map === mi && x.t === tier);
    if (!lista.length) lista = LISTA[it.slot].filter((x) => x.t === tier);
    const p = fijo ? lista[0] : lista[Math.floor(Math.random() * lista.length)];
    it.piernaId = p.id;
    it.name = p.n;
    it.stats = it.stats || {};
    // las estadísticas son las de INV.roll (pantalón: defensa; bota: velocidad); acá solo cambia la forma y el nombre
    it.fx = window.I18N ? I18N.t("casco.res." + MAPS[p.map].id) : "";
    it.fl = "";
    return it;
  }
  const svgDe = (it) => {
    const p = de(it);
    return p ? (it.slot === "botas" ? botaItem(p) : pantalonItem(p)) : "";
  };
  const icono = svgDe;
  const imgs = new Map();
  function imagen(it) {
    const p = de(it);
    if (!p) return null;
    const k = it.slot + p.id;
    let im = imgs.get(k);
    if (!im) {
      im = new Image();
      im.src =
        "data:image/svg+xml;charset=utf-8," +
        encodeURIComponent(svgDe(it).replace("<svg ", '<svg width="424" height="430" '));
      imgs.set(k, im);
    }
    return im;
  }
  // botas de antes de este catálogo (sin piernaId): se cambian por unas nuevas de la misma rareza, en el equipo y en la mochila
  function renovar(pj) {
    if (!pj) return false;
    let cambio = false;
    const ver = (it) => {
      if (it && it.slot === "botas" && !it.piernaId) {
        vestir(it, false, Math.floor(Math.random() * 5));
        cambio = true;
      }
    };
    if (pj.gear) {
      if (!("pantalones" in pj.gear)) {
        pj.gear.pantalones = null;
        cambio = true;
      }
      Object.keys(pj.gear).forEach((k) => ver(pj.gear[k]));
    }
    if (Array.isArray(pj.bag)) pj.bag.forEach(ver);
    return cambio;
  }
  return { PANTALONES, BOTAS, porId, de, vestir, icono, imagen, renovar, pantalonItem, botaItem };
})();
