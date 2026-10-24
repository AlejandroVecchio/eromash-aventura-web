/* ============================================================
 * PECHERAS DROPEABLES DE EROMASH · 10 modelos × 5 rarezas = 50
 * Qué se ve según la rareza:
 *   Común y Poco común → solo el peto
 *   Raro en adelante   → peto + hombreras
 *   (las capas son otro ítem, ver eromash-capa.js)
 * Cada pechera tiene estos dibujos:
 *  - pecheraItem(p)           → miniatura completa (peto + hombreras) para inventario/tienda
 *  - vikingo(p, 'rojo'|'blanco') → el vikingo 2D de juego con la pechera puesta
 *  - parteDetras(p) / parteDelante(p) → las dos partes sueltas para el juego:
 *        detrás  = el peto, se dibuja DESPUÉS de la cúpula y ANTES de la cara y la barba
 *        delante = las hombreras (desde raro), se dibujan DESPUÉS del casco (encima de todo)
 *    Usan el mismo sistema de coordenadas que personaje-rojo/2d/*.svg (viewBox 40 90 400 480);
 *    las hombreras sobresalen, por eso las partes usan viewBox -20 60 520 550.
 *
 * CÓMO USARLO EN EL JUEGO (instrucciones para Cursor)
 *  1. Incluí este archivo. Expone window.EromashPecheras con PECHERAS (50 objetos), BASES (10), MAPS, RAR
 *     y las funciones de abajo. Las constantes de arriba (BASES, MAPS, LEG…) quedan además como globales
 *     del script (eromash-piernas.js usa varias).
 *     Cada pechera: { id, n (nombre), baseN, map (0-4), r ('comun'|'poco'|'raro'|'epico'|'leg'),
 *                     t (0-4), def:[min,max], fx (efecto legendario o ''), src, fl }
 *     El id es estable: 'arena-placa-1' ... 'costa-aleta-5'.
 *  2. Inventario / tienda / herrero: pecheraItem(p) devuelve un <svg> listo para meter en el HTML.
 *  3. Personaje: vikingo(p, 'rojo'|'blanco', 'tranquilo'|'atacando', fondo) devuelve el vikingo 2D.
 *     completo con la pechera puesta. Pasá p = null para el vikingo sin pechera.
 *     El sexto parámetro (mano) va adelante de todo: el escudo y, en el inventario, la espada.
 *     'fondo' es opcional: un SVG que va detrás de todo (la capa, ver eromash-capa.js).
 *  4. Si el juego ya dibuja el casco por su cuenta (skins), usá las dos partes sueltas, en este orden:
 *        parteDetras(p)  → después de la cúpula, antes de la cara y la barba
 *        parteDelante(p) → después del casco, encima de todo (vacío en común y poco común)
 *     Las dos son el contenido de un <svg viewBox="-20 60 520 550"> y comparten el sistema de
 *     coordenadas del vikingo (mismo viewBox que vikingo()).
 *  5. Defensa final al dropear: número entero al azar entre def[0] y def[1].
 *     Atributos: siempre la resistencia del mapa (MAPS[p.map].res) + t atributos al azar (máx. 3).
 *  6. Animaciones de legendarios: usan las clases CSS brasa / titila / flota / late
 *     (las pone eromash-armadura.js). Sin esas clases se ven quietas y no se rompe nada.
 * ============================================================ */
const MAPS = [
  {
    id: "arena",
    c: "#FF8D71",
    icon: `<polygon points="8,34 20,8 32,34" fill="#2A2020"/><polygon points="16,32 20,22 24,32" fill="#FF8D71"/><polygon points="18,32 20,27 22,32" fill="#FFD98A"/>`,
  },
  {
    id: "bosque",
    c: "#DDE2E4",
    icon: `<polygon points="20,4 8,22 14,22 6,34 34,34 26,22 32,22" fill="#26382F"/><polygon points="20,4 15,12 25,12" fill="#F2F6F8"/><rect x="18" y="34" width="4" height="4" fill="#3A2A1A"/>`,
  },
  {
    id: "volcan",
    c: "#FF8D71",
    icon: `<polygon points="4,34 16,10 24,10 36,34" fill="#4A3A34"/><polyline points="20,10 16,20 22,24 18,34" fill="none" stroke="#FF8D71" stroke-width="3" stroke-linejoin="round"/>`,
  },
  {
    id: "helheim",
    c: "#E0B2B2",
    icon: `<polygon points="12,6 28,6 30,34 10,34" fill="#2E2A34"/><path d="M20 12 V30 M20 20 L14 14 M20 20 L26 14" stroke="#E0392E" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  },
  {
    id: "costa",
    c: "#8AA9BB",
    icon: `<polygon points="20,6 20,22 30,18" fill="#8AA9BB"/><path d="M6 26 Q20 18 34 26 L32 30 L8 30 Z" fill="#5E130D"/><path d="M4 33 q4 -3 8 0 t8 0 t8 0 t8 0" fill="none" stroke="#DDE2E4" stroke-width="2.5"/>`,
  },
];
/* textos visibles: siempre por I18N (js/textos/) */
const PCH_T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
MAPS.forEach((m) => {
  Object.defineProperty(m, "n", {
    get: () => PCH_T("casco.map." + m.id),
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(m, "res", {
    get: () => PCH_T("casco.res." + m.id),
    enumerable: true,
    configurable: true,
  });
});
const RAR = {
  comun: {
    get t() {
      return PCH_T("emi.rar.comun.t");
    },
    hex: "#B7AAAA",
  },
  poco: {
    get t() {
      return PCH_T("emi.rar.poco.t");
    },
    hex: "#3DDC84",
  },
  raro: {
    get t() {
      return PCH_T("emi.rar.raro.t");
    },
    hex: "#4FA8FF",
  },
  epico: {
    get t() {
      return PCH_T("emi.rar.epico.t");
    },
    hex: "#C77DFF",
  },
  leg: {
    get t() {
      return PCH_T("emi.rar.leg.t");
    },
    hex: "#FFD98A",
  },
};
const TIERS = ["comun", "poco", "raro", "epico", "leg"];
const VIK = {
  rojo: {
    beard: "#5E130D",
    face: "#0A0707",
    e1: "#C8402D",
    e2: "#9C2315",
    sh: "#44100A",
    dome: "#5E130D",
    line: "#44100A",
  },
  blanco: {
    beard: "#E0B2B2",
    face: "#111111",
    e1: "#F2ECEC",
    e2: "#C9BDBD",
    sh: "#8E8080",
    dome: "#DCD2D2",
    line: "#8E8080",
  },
  azul: {
    beard: "#1E3F73",
    face: "#0A0707",
    e1: "#5B8BE0",
    e2: "#2F5FA8",
    sh: "#142C52",
    dome: "#1E3F73",
    line: "#142C52",
  },
  verde: {
    beard: "#1B5E3A",
    face: "#0A0707",
    e1: "#3DDC84",
    e2: "#23A35E",
    sh: "#124229",
    dome: "#1B5E3A",
    line: "#124229",
  },
};
const E_D =
  "m88,0c94.67.33,189.33.67,284,1l-55,60h-159l-3,84h161l-61,59h-97l-1,94h197l-58,56H33l56-57v-90l-63,1,62-62,3-86-65,1L88,0Z";
const E_SH =
  '<polygon points="26 61 0 87 64 87 64 170 89 145 91 60 26 61"/><polygon points="26 208 89 207 89 297 64 323 64 231 2 232 26 208"/><polygon points="33 354 4 382 267 382 296 354 33 354"/><polygon points="158 204 255 204 225 231 157 231 158 204"/><polygon points="158 61 157 87 291 87 317 61 158 61"/>';

/* ---------- utilidades ---------- */
const mix = (hex, a, to = 255) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.round(v + (to - v) * a);
  return (
    "#" +
    ((1 << 24) + (f(n >> 16) << 16) + (f((n >> 8) & 255) << 8) + f(n & 255)).toString(16).slice(1)
  );
};
const lt = (h, a) => mix(h, a, 255),
  dk = (h, a) => mix(h, a, 0);
const P = (pts, f, x = "") =>
  `<polygon points="${pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ")}" fill="${f}" ${x}/>`;
const MX = (pts, cx = 240) => pts.map(([x, y]) => [2 * cx - x, y]);
const rombo = (x, y, r, f, cls = "") =>
  `<polygon class="${cls}" points="${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}" fill="${f}"/>`;
const star4 = (x, y, r, c, cls = "") =>
  `<polygon class="${cls}" points="${x},${y - r} ${x + r * 0.28},${y - r * 0.28} ${x + r},${y} ${x + r * 0.28},${y + r * 0.28} ${x},${y + r} ${x - r * 0.28},${y + r * 0.28} ${x - r},${y} ${x - r * 0.28},${y - r * 0.28}" fill="${c}"/>`;
const tr = (pts, dx, dy, s = 1, flip = false) =>
  pts.map(([x, y]) => [dx + (flip ? -x : x) * s, dy + y * s]);

/* ============================================================
 * HOMBRERAS · coordenadas locales de la hombrera IZQUIERDA
 * centro (0,0), hacia afuera = x negativo, ~130 de ancho × 110 de alto.
 * Cada estilo devuelve: capas [[puntos,color]], borde (franja para el ribete),
 * remaches [[x,y]] y pinchos (lugar para la cresta épica).
 * ============================================================ */
const HOMBRO = {
  placa: (c) => ({
    capas: [
      [
        [
          [-66, -8],
          [-40, -44],
          [30, -50],
          [64, -24],
          [58, 22],
          [20, 46],
          [-44, 46],
          [-68, 24],
        ],
        c.b,
      ],
      [
        [
          [-66, -8],
          [-40, -44],
          [30, -50],
          [64, -24],
          [4, -8],
        ],
        c.a,
      ],
      [
        [
          [-68, 24],
          [-44, 46],
          [20, 46],
          [-6, 30],
        ],
        c.c,
      ],
    ],
    lama: [
      [-60, 40],
      [20, 40],
      [56, 24],
      [46, 60],
      [-30, 66],
      [-62, 54],
    ],
    borde: [
      [-68, 24],
      [-44, 46],
      [20, 46],
      [58, 22],
      [60, 32],
      [22, 56],
      [-46, 56],
      [-70, 32],
    ],
    rem: [
      [-36, -22],
      [0, -30],
      [34, -30],
    ],
    pin: [
      [-44, -40],
      [-6, -48],
    ],
  }),
  brasero: (c) => ({
    capas: [
      [
        [
          [-64, -30],
          [54, -40],
          [62, 26],
          [-58, 40],
        ],
        c.b,
      ],
      [
        [
          [-64, -30],
          [54, -40],
          [58, -12],
          [-62, -2],
        ],
        c.a,
      ],
      [
        [
          [-26, -38],
          [22, -42],
          [16, -60],
          [-20, -58],
        ],
        c.c,
      ],
      [
        [
          [-20, -58],
          [16, -60],
          [8, -76],
          [0, -64],
          [-10, -80],
        ],
        "#FF8D71",
      ],
      [
        [
          [-8, -60],
          [6, -60],
          [0, -72],
        ],
        "#FFD98A",
      ],
    ],
    lama: [
      [-56, 38],
      [60, 24],
      [54, 52],
      [-50, 62],
    ],
    borde: [
      [-58, 40],
      [62, 26],
      [62, 36],
      [-58, 50],
    ],
    rem: [
      [-44, -12],
      [-4, -18],
      [36, -22],
    ],
    pin: [
      [-50, -30],
      [40, -40],
    ],
  }),
  corteza: (c) => ({
    capas: [
      [
        [
          [-66, -20],
          [-44, -46],
          [-18, -40],
          [-22, 40],
          [-62, 32],
        ],
        c.b,
      ],
      [
        [
          [-18, -40],
          [12, -50],
          [20, 44],
          [-22, 40],
        ],
        c.a,
      ],
      [
        [
          [12, -50],
          [46, -40],
          [62, -14],
          [52, 34],
          [20, 44],
        ],
        c.c,
      ],
      [
        [
          [-66, -20],
          [-44, -46],
          [-18, -40],
          [12, -50],
          [46, -40],
          [62, -14],
          [40, -26],
          [12, -36],
          [-18, -28],
          [-44, -34],
        ],
        "#F2F6F8",
      ],
    ],
    lama: [
      [-60, 30],
      [52, 34],
      [40, 58],
      [-50, 54],
    ],
    borde: [
      [-62, 32],
      [-22, 40],
      [20, 44],
      [52, 34],
      [48, 44],
      [20, 54],
      [-22, 50],
      [-62, 42],
    ],
    rem: [
      [-40, -6],
      [0, -4],
      [36, -6],
    ],
    pin: [
      [-40, -44],
      [16, -50],
    ],
  }),
  pelaje: (c) => ({
    capas: [
      [
        [
          [-60, -6],
          [56, -16],
          [60, 30],
          [-56, 40],
        ],
        c.b,
      ],
      [
        [
          [-60, -6],
          [56, -16],
          [56, 4],
          [-58, 14],
        ],
        c.a,
      ],
      [
        [
          [-70, -2],
          [-58, -30],
          [-46, -12],
          [-32, -44],
          [-18, -16],
          [-2, -48],
          [12, -18],
          [28, -44],
          [40, -14],
          [58, -34],
          [64, -4],
          [40, 10],
          [-10, 16],
          [-60, 14],
        ],
        "#E8ECEE",
      ],
      [
        [
          [-70, -2],
          [-58, -30],
          [-46, -12],
          [-32, -44],
          [-18, -16],
          [-10, 16],
          [-60, 14],
        ],
        "#C8D0D4",
      ],
      [
        [
          [-6, -40],
          [-2, -40],
          [-10, -82],
          [-24, -96],
          [-12, -98],
          [-4, -86],
          [4, -110],
          [12, -106],
          [2, -80],
        ],
        "#CDB89A",
      ],
    ],
    lama: [
      [-54, 38],
      [58, 28],
      [50, 54],
      [-46, 62],
    ],
    borde: [
      [-56, 40],
      [60, 30],
      [60, 40],
      [-56, 50],
    ],
    rem: [
      [-36, 24],
      [0, 20],
      [36, 16],
    ],
    pin: [
      [-46, -24],
      [30, -36],
    ],
  }),
  escoria: (c) => ({
    capas: [
      [
        [
          [-68, -4],
          [-50, -40],
          [-10, -48],
          [-4, 10],
          [-40, 40],
          [-66, 28],
        ],
        c.b,
      ],
      [
        [
          [-10, -48],
          [36, -46],
          [62, -16],
          [50, 30],
          [-4, 10],
        ],
        c.a,
      ],
      [
        [
          [-40, 40],
          [-4, 10],
          [50, 30],
          [20, 48],
          [-30, 52],
        ],
        c.c,
      ],
    ],
    extra: `<polyline points="-50,-30 -24,-8 -30,20" fill="none" stroke="#FF8D71" stroke-width="5" stroke-linejoin="round"/><polyline points="14,-40 20,-6 46,8" fill="none" stroke="#FF8D71" stroke-width="5" stroke-linejoin="round"/><polyline points="-18,-12 -24,-8" stroke="#FFD98A" stroke-width="5"/>`,
    lama: [
      [-58, 40],
      [40, 36],
      [30, 58],
      [-48, 62],
    ],
    borde: [
      [-66, 28],
      [-40, 40],
      [-30, 52],
      [20, 48],
      [50, 30],
      [52, 40],
      [20, 58],
      [-32, 62],
      [-68, 38],
    ],
    rem: [
      [-44, -16],
      [10, -24],
      [38, -14],
    ],
    pin: [
      [-52, -36],
      [20, -46],
    ],
  }),
  caldera: (c) => ({
    capas: [
      [
        [
          [-64, -4],
          [-46, -38],
          [40, -42],
          [62, -10],
          [56, 30],
          [-58, 36],
        ],
        c.b,
      ],
      [
        [
          [-64, -4],
          [-46, -38],
          [40, -42],
          [62, -10],
        ],
        c.a,
      ],
      [
        [
          [-14, -40],
          [14, -40],
          [12, -62],
          [-12, -62],
        ],
        "#5A504C",
      ],
      [
        [
          [-18, -66],
          [18, -66],
          [18, -58],
          [-18, -58],
        ],
        "#C8963E",
      ],
      [
        [
          [-40, -78],
          [-24, -86],
          [-14, -76],
          [-28, -68],
        ],
        "#D9D2C8",
      ],
      [
        [
          [-54, -96],
          [-38, -100],
          [-32, -90],
          [-48, -86],
        ],
        "#D9D2C8",
      ],
    ],
    lama: [
      [-58, 34],
      [56, 28],
      [48, 54],
      [-50, 60],
    ],
    borde: [
      [-58, 36],
      [56, 30],
      [56, 40],
      [-58, 46],
    ],
    rem: [
      [-50, 10],
      [-24, 6],
      [4, 4],
      [30, 2],
    ],
    pin: [
      [-40, -34],
      [34, -38],
    ],
  }),
  hueso: (c) => ({
    capas: [
      [
        [
          [-60, -10],
          [56, -18],
          [58, 30],
          [-54, 38],
        ],
        c.b,
      ],
      [
        [
          [-66, -14],
          [-44, -46],
          [-8, -52],
          [26, -46],
          [50, -24],
          [36, -10],
          [4, -20],
          [-30, -16],
        ],
        "#E8DCC4",
      ],
      [
        [
          [-8, -52],
          [26, -46],
          [50, -24],
          [36, -10],
          [4, -20],
        ],
        "#CFC3A8",
      ],
      [
        [
          [-40, -26],
          [-26, -30],
          [-24, -18],
          [-38, -14],
        ],
        "#26222E",
      ],
      [
        [
          [-6, -32],
          [8, -32],
          [8, -22],
          [-6, -22],
        ],
        "#26222E",
      ],
      [
        [
          [-50, 30],
          [-40, 30],
          [-44, 72],
          [-54, 66],
        ],
        c.a,
      ],
      [
        [
          [-10, 32],
          [0, 32],
          [-2, 78],
          [-12, 74],
        ],
        c.a,
      ],
      [
        [
          [30, 26],
          [40, 26],
          [36, 64],
          [26, 62],
        ],
        c.a,
      ],
    ],
    lama: [
      [-54, 36],
      [58, 28],
      [50, 48],
      [-48, 56],
    ],
    borde: [
      [-54, 38],
      [58, 30],
      [58, 40],
      [-54, 48],
    ],
    rem: [
      [-40, 6],
      [0, 2],
      [36, 0],
    ],
    pin: [
      [-50, -40],
      [8, -52],
    ],
  }),
  runa: (c) => ({
    capas: [
      [
        [
          [-66, -6],
          [-38, -46],
          [36, -48],
          [64, -16],
          [56, 30],
          [-60, 38],
        ],
        c.b,
      ],
      [
        [
          [-66, -6],
          [-38, -46],
          [36, -48],
          [64, -16],
          [0, -12],
        ],
        c.a,
      ],
      [
        [
          [-60, 38],
          [56, 30],
          [40, 52],
          [-44, 58],
        ],
        c.c,
      ],
    ],
    extra: `<g stroke="#E0392E" stroke-width="5" stroke-linecap="round" fill="none"><path d="M-2 -38 V22 M-2 -14 L-16 -28 M-2 -14 L12 -28"/><path d="M-40 -18 V18 M-40 0 L-28 -10"/><path d="M36 -26 V14 M36 -26 L46 -14"/></g>`,
    lama: [
      [-56, 48],
      [52, 40],
      [40, 64],
      [-44, 70],
    ],
    borde: [
      [-60, 38],
      [56, 30],
      [56, 40],
      [-60, 48],
    ],
    rem: [
      [-50, -8],
      [-20, -26],
      [20, -30],
    ],
    pin: [
      [-40, -44],
      [30, -48],
    ],
  }),
  tablas: (c) => ({
    capas: [
      [
        [
          [-66, -26],
          [-38, -30],
          [-40, 36],
          [-64, 30],
        ],
        c.a,
      ],
      [
        [
          [-36, -34],
          [-6, -36],
          [-8, 40],
          [-38, 38],
        ],
        c.b,
      ],
      [
        [
          [-4, -38],
          [26, -36],
          [24, 40],
          [-6, 42],
        ],
        c.a,
      ],
      [
        [
          [28, -34],
          [58, -28],
          [56, 32],
          [26, 38],
        ],
        c.b,
      ],
      [
        [
          [-70, -8],
          [60, -18],
          [60, -8],
          [-70, 4],
        ],
        "#CDB48A",
      ],
    ],
    extra: `<g fill="#D8D0C0"><polygon points="-52,14 -44,8 -38,16 -46,22"/><polygon points="-34,22 -28,18 -24,24 -30,28"/><polygon points="36,12 44,8 48,16 40,20"/></g><g stroke="#8E7A58" stroke-width="3"><line x1="-54" y1="-7" x2="-50" y2="3"/><line x1="-20" y1="-10" x2="-16" y2="0"/><line x1="14" y1="-13" x2="18" y2="-3"/><line x1="46" y1="-16" x2="50" y2="-6"/></g>`,
    lama: [
      [-60, 34],
      [54, 30],
      [46, 54],
      [-52, 58],
    ],
    borde: [
      [-64, 30],
      [56, 32],
      [56, 42],
      [-64, 40],
    ],
    rem: [
      [-50, -30],
      [-20, -34],
      [12, -36],
    ],
    pin: [
      [-52, -28],
      [40, -34],
    ],
  }),
  aleta: (c) => ({
    capas: [
      [
        [
          [-80, -40],
          [-30, -46],
          [40, -40],
          [62, -6],
          [50, 32],
          [-30, 40],
          [-60, 20],
        ],
        c.b,
      ],
      [
        [
          [-80, -40],
          [-30, -46],
          [40, -40],
          [62, -6],
          [-10, -12],
        ],
        c.a,
      ],
      [
        [
          [-86, -6],
          [-40, -2],
          [-10, 30],
          [-60, 40],
          [-76, 20],
        ],
        c.c,
      ],
      [
        [
          [-80, -40],
          [-30, -46],
          [-40, -38],
          [-72, -34],
        ],
        "#BFE9FF",
      ],
    ],
    lama: [
      [-54, 36],
      [52, 30],
      [44, 54],
      [-46, 58],
    ],
    borde: [
      [-60, 20],
      [-30, 40],
      [50, 32],
      [48, 42],
      [-30, 50],
      [-64, 30],
    ],
    rem: [
      [-46, -24],
      [-6, -28],
      [30, -26],
    ],
    pin: [
      [-70, -40],
      [10, -44],
    ],
  }),
};

/* cresta épica / legendaria por mapa, sobre la hombrera (coordenadas locales) */
const PINCHO = [
  (x, y, f, g) =>
    P(
      [
        [x - 10, y + 4],
        [x - 2, y - 38],
        [x + 8, y + 4],
      ],
      f,
    ) +
    P(
      [
        [x - 4, y + 2],
        [x - 1, y - 20],
        [x + 3, y + 2],
      ],
      g,
    ), // brasas
  (x, y, f, g) =>
    P(
      [
        [x - 8, y + 4],
        [x - 3, y - 40],
        [x + 6, y + 4],
      ],
      "#BFE9FF",
    ) +
    P(
      [
        [x - 3, y + 2],
        [x - 2, y - 26],
        [x + 2, y + 2],
      ],
      "#F2FBFF",
    ), // hielo
  (x, y, f, g) =>
    P(
      [
        [x - 12, y + 6],
        [x - 24, y - 34],
        [x + 8, y + 2],
      ],
      "#4A3A34",
    ) +
    P(
      [
        [x - 24, y - 34],
        [x - 20, y - 18],
        [x - 14, y - 22],
      ],
      f,
    ), // cuernos
  (x, y, f, g) =>
    P(
      [
        [x - 8, y + 4],
        [x - 4, y - 36],
        [x + 8, y - 40],
        [x + 6, y + 4],
      ],
      "#2E2A34",
    ) + `<path d="M${x + 1} ${y - 30} V${y - 2}" stroke="${g}" stroke-width="4"/>`, // lápidas rúnicas
  (x, y, f, g) =>
    `<path d="M${x - 12} ${y + 4} C${x - 10} ${y - 24} ${x + 4} ${y - 38} ${x + 22} ${y - 44} C${x + 10} ${y - 24} ${x + 8} ${y - 10} ${x + 10} ${y + 4} Z" fill="#566F7E" stroke="#BFE9FF" stroke-width="3"/>`, // aleta
];

/* ============================================================
 * PETO · coordenadas de la miniatura (0..480)
 * ============================================================ */
const PETO = [
  [160, 118],
  [204, 136],
  [240, 142],
  [276, 136],
  [320, 118],
  [352, 150],
  [346, 250],
  [334, 330],
  [322, 372],
  [282, 392],
  [240, 398],
  [198, 392],
  [158, 372],
  [146, 330],
  [134, 250],
  [128, 150],
];
const CUELLO = [
  [204, 136],
  [240, 142],
  [276, 136],
  [266, 162],
  [240, 172],
  [214, 162],
];
const FALD_L = [
    [146, 380],
    [214, 388],
    [210, 452],
    [152, 444],
  ],
  FALD_C = [
    [216, 390],
    [264, 390],
    [262, 456],
    [218, 456],
  ];
const CINTO = [
  [148, 352],
  [332, 352],
  [326, 380],
  [154, 380],
];

/* decoración del peto según el material */
const PECHO = {
  placa: (c) =>
    P(
      [
        [146, 262],
        [334, 262],
        [332, 280],
        [148, 280],
      ],
      c.c,
    ) +
    P(
      [
        [148, 296],
        [332, 296],
        [330, 314],
        [150, 314],
      ],
      c.c,
    ) +
    P(
      [
        [236, 150],
        [244, 150],
        [244, 340],
        [236, 340],
      ],
      lt(c.a, 0.25),
    ) +
    rombo(240, 206, 10, "#FF8D71"),
  brasero: (c) =>
    [210, 250, 290]
      .map(
        (y) =>
          P(
            [
              [172, y],
              [308, y - 4],
              [306, y + 10],
              [174, y + 14],
            ],
            "#FF8D71",
          ) +
          P(
            [
              [190, y + 3],
              [290, y],
              [288, y + 7],
              [192, y + 10],
            ],
            "#FFD98A",
          ),
      )
      .join(""),
  corteza: (c) =>
    P(
      [
        [150, 160],
        [196, 150],
        [200, 340],
        [156, 340],
      ],
      c.a,
    ) +
    P(
      [
        [240, 160],
        [282, 150],
        [290, 346],
        [244, 350],
      ],
      c.a,
    ) +
    P(
      [
        [128, 150],
        [160, 118],
        [204, 136],
        [240, 142],
        [276, 136],
        [320, 118],
        [352, 150],
        [320, 140],
        [276, 152],
        [240, 158],
        [204, 152],
        [160, 136],
      ],
      "#F2F6F8",
    ),
  pelaje: (c) =>
    P(
      [
        [120, 160],
        [134, 128],
        [150, 150],
        [170, 116],
        [190, 146],
        [214, 120],
        [240, 150],
        [266, 120],
        [290, 146],
        [310, 116],
        [330, 150],
        [346, 128],
        [360, 160],
        [330, 186],
        [290, 176],
        [240, 190],
        [190, 176],
        [150, 186],
      ],
      "#E8ECEE",
    ) +
    P(
      [
        [120, 160],
        [134, 128],
        [150, 150],
        [170, 116],
        [190, 146],
        [214, 120],
        [240, 150],
        [240, 190],
        [190, 176],
        [150, 186],
      ],
      "#C8D0D4",
    ) +
    `<g stroke="#CDB48A" stroke-width="5">${[220, 256, 292].map((y) => `<line x1="224" y1="${y}" x2="256" y2="${y + 22}"/><line x1="256" y1="${y}" x2="224" y2="${y + 22}"/>`).join("")}</g>`,
  escoria: (c) =>
    P(
      [
        [150, 170],
        [206, 160],
        [214, 248],
        [160, 262],
      ],
      c.a,
    ) +
    P(
      [
        [262, 166],
        [330, 172],
        [326, 256],
        [272, 246],
      ],
      c.c,
    ) +
    P(
      [
        [176, 280],
        [240, 268],
        [300, 284],
        [290, 340],
        [190, 340],
      ],
      c.a,
    ) +
    `<g fill="none" stroke="#FF8D71" stroke-width="6" stroke-linejoin="round"><polyline points="208,170 226,230 212,290 236,350"/><polyline points="226,230 270,250 300,236"/></g><polyline points="226,230 212,290" stroke="#FFD98A" stroke-width="6" fill="none"/>`,
  caldera: (c) =>
    [176, 208, 240, 272, 304]
      .map((x) => rombo(x, 178, 6, "#D9D2C8") + rombo(x, 332, 6, "#D9D2C8"))
      .join("") +
    P(
      [
        [222, 212],
        [258, 212],
        [272, 230],
        [272, 262],
        [258, 278],
        [222, 278],
        [208, 262],
        [208, 230],
      ],
      "#C8963E",
    ) +
    P(
      [
        [228, 222],
        [252, 222],
        [262, 234],
        [262, 258],
        [252, 268],
        [228, 268],
        [218, 258],
        [218, 234],
      ],
      "#2A2424",
    ) +
    `<line x1="240" y1="245" x2="254" y2="228" stroke="#FF8D71" stroke-width="5"/>`,
  hueso: (c) =>
    P(
      [
        [234, 150],
        [246, 150],
        [248, 344],
        [232, 344],
      ],
      "#E8DCC4",
    ) +
    [190, 226, 262, 298]
      .map((y, i) => {
        const w = 76 - i * 6;
        return (
          P(
            [
              [232, y],
              [232 - w, y + 10],
              [232 - w + 4, y + 22],
              [232, y + 14],
            ],
            "#E8DCC4",
          ) +
          P(
            [
              [248, y],
              [248 + w, y + 10],
              [248 + w - 4, y + 22],
              [248, y + 14],
            ],
            "#CFC3A8",
          )
        );
      })
      .join(""),
  runa: (c) =>
    `<g stroke="#E0392E" stroke-width="7" stroke-linecap="round" fill="none"><path d="M240 170 V330 M240 220 L212 190 M240 220 L268 190 M240 280 L214 306 M240 280 L266 306"/><path d="M178 200 V300 M178 230 L194 214"/><path d="M302 200 V300 M302 200 L318 218"/></g>` +
    P(
      [
        [150, 160],
        [190, 160],
        [186, 340],
        [152, 330],
      ],
      lt(c.a, 0.06),
      'opacity=".4"',
    ),
  tablas: (c) =>
    [150, 196, 242, 288]
      .map((x, i) =>
        P(
          [
            [x, 150],
            [x + 42, 146],
            [x + 44, 350],
            [x + 2, 354],
          ],
          i % 2 ? c.a : c.b,
        ),
      )
      .join("") +
    `<g stroke="#2A1E14" stroke-width="3">${[194, 240, 286].map((x) => `<line x1="${x}" y1="150" x2="${x + 2}" y2="352"/>`).join("")}</g>` +
    P(
      [
        [138, 176],
        [166, 160],
        [344, 338],
        [318, 356],
      ],
      "#CDB48A",
    ) +
    `<g stroke="#8E7A58" stroke-width="3">${[0, 1, 2, 3, 4, 5].map((i) => `<line x1="${160 + i * 30}" y1="${184 + i * 29}" x2="${150 + i * 30}" y2="${198 + i * 29}"/>`).join("")}</g><g fill="#D8D0C0"><polygon points="170,300 180,292 188,302 178,310"/><polygon points="190,318 198,312 204,320 196,326"/><polygon points="300,190 310,184 316,194 306,200"/></g>`,
  aleta: (c) =>
    [0, 1, 2, 3, 4]
      .map((r) =>
        [0, 1, 2]
          .map((k) => {
            const x = 176 + k * 64 + (r % 2 ? 32 : 0),
              y = 168 + r * 36;
            if (x > 318) return "";
            return (
              P(
                [
                  [x - 30, y],
                  [x, y + 26],
                  [x + 30, y],
                  [x + 30, y + 12],
                  [x, y + 38],
                  [x - 30, y + 12],
                ],
                r % 2 ? c.a : c.c,
              ) +
              P(
                [
                  [x - 30, y],
                  [x, y + 26],
                  [x + 30, y],
                  [x + 30, y + 4],
                  [x, y + 30],
                  [x - 30, y + 4],
                ],
                "#BFE9FF",
              )
            );
          })
          .join(""),
      )
      .join(""),
};
/* faldones: lo único del peto que asoma bajo la barba en juego */
const FALDON = {
  placa: (c) =>
    P(
      [
        [152, 414],
        [212, 420],
        [211, 428],
        [152, 422],
      ],
      c.c,
    ) +
    P(
      MX([
        [152, 414],
        [212, 420],
        [211, 428],
        [152, 422],
      ]),
      c.c,
    ),
  brasero: (c) =>
    P(
      [
        [160, 410],
        [204, 414],
        [203, 422],
        [161, 418],
      ],
      "#FF8D71",
    ) +
    P(
      MX([
        [160, 410],
        [204, 414],
        [203, 422],
        [161, 418],
      ]),
      "#FF8D71",
    ),
  corteza: (c) =>
    P(
      [
        [152, 444],
        [160, 420],
        [170, 446],
        [182, 424],
        [192, 448],
        [202, 428],
        [210, 452],
      ],
      "#F2F6F8",
    ),
  pelaje: (c) =>
    P(
      [
        [146, 440],
        [158, 462],
        [170, 442],
        [182, 464],
        [194, 444],
        [206, 466],
        [216, 446],
        [228, 468],
        [240, 448],
        [252, 468],
        [264, 446],
        [274, 466],
        [286, 444],
        [298, 464],
        [310, 442],
        [322, 462],
        [334, 440],
      ],
      "#E8ECEE",
    ),
  escoria: (c) =>
    `<polyline points="176,386 184,414 172,446" fill="none" stroke="#FF8D71" stroke-width="6"/><polyline points="304,386 296,414 308,446" fill="none" stroke="#FF8D71" stroke-width="6"/>`,
  caldera: (c) =>
    [
      [164, 400],
      [196, 404],
      [164, 432],
      [196, 436],
    ]
      .map(([x, y]) => rombo(x, y, 5, "#D9D2C8") + rombo(480 - x, y, 5, "#D9D2C8"))
      .join(""),
  hueso: (c) =>
    P(
      [
        [160, 390],
        [172, 390],
        [168, 452],
        [158, 446],
      ],
      "#E8DCC4",
    ) +
    P(
      [
        [186, 392],
        [198, 392],
        [196, 456],
        [184, 452],
      ],
      "#CFC3A8",
    ) +
    P(
      MX([
        [160, 390],
        [172, 390],
        [168, 452],
        [158, 446],
      ]),
      "#E8DCC4",
    ) +
    P(
      MX([
        [186, 392],
        [198, 392],
        [196, 456],
        [184, 452],
      ]),
      "#CFC3A8",
    ),
  runa: (c) =>
    `<g stroke="#E0392E" stroke-width="5" stroke-linecap="round"><path d="M180 398 V440 M180 412 L192 402"/><path d="M300 398 V440 M300 412 L288 402"/></g>`,
  tablas: (c) =>
    `<g stroke="#2A1E14" stroke-width="3"><line x1="180" y1="386" x2="180" y2="448"/><line x1="300" y1="386" x2="300" y2="448"/></g>` +
    P(
      [
        [150, 406],
        [214, 410],
        [213, 416],
        [150, 412],
      ],
      "#CDB48A",
    ) +
    P(
      MX([
        [150, 406],
        [214, 410],
        [213, 416],
        [150, 412],
      ]),
      "#CDB48A",
    ),
  aleta: (c) =>
    P(
      [
        [152, 420],
        [182, 440],
        [212, 424],
        [212, 432],
        [182, 448],
        [152, 428],
      ],
      "#BFE9FF",
    ) +
    P(
      MX([
        [152, 420],
        [182, 440],
        [212, 424],
        [212, 432],
        [182, 448],
        [152, 428],
      ]),
      "#BFE9FF",
    ),
};

/* ============================================================
 * LOS 10 MODELOS BASE
 * ============================================================ */
const BASES = [
  {
    map: 0,
    fuerte: false,
    defR: [5, 8],
    estilo: "placa",
    c: { a: "#8E8888", b: "#6E6868", c: "#4A4444", d: "#5E4430" },
  },
  {
    map: 0,
    fuerte: true,
    defR: [8, 12],
    estilo: "brasero",
    c: { a: "#7A7474", b: "#5A5454", c: "#3A3434", d: "#4A3020" },
  },
  {
    map: 1,
    fuerte: false,
    defR: [10, 14],
    estilo: "corteza",
    c: { a: "#6E5A44", b: "#54432F", c: "#3A2E20", d: "#3A2E20" },
  },
  {
    map: 1,
    fuerte: true,
    defR: [14, 19],
    estilo: "pelaje",
    c: { a: "#7A6048", b: "#5E4834", c: "#3E2E20", d: "#3E2E20" },
  },
  {
    map: 2,
    fuerte: false,
    defR: [16, 21],
    estilo: "escoria",
    c: { a: "#4A4040", b: "#3A3232", c: "#241E1E", d: "#241E1E" },
  },
  {
    map: 2,
    fuerte: true,
    defR: [21, 27],
    estilo: "caldera",
    c: { a: "#7A6E6A", b: "#5A504C", c: "#3A322E", d: "#3A322E" },
  },
  {
    map: 3,
    fuerte: false,
    defR: [23, 29],
    estilo: "hueso",
    c: { a: "#4A4452", b: "#3A3442", c: "#26222E", d: "#26222E" },
  },
  {
    map: 3,
    fuerte: true,
    defR: [29, 36],
    estilo: "runa",
    c: { a: "#3E3848", b: "#2E2A34", c: "#1C1920", d: "#1C1920" },
  },
  {
    map: 4,
    fuerte: false,
    defR: [31, 38],
    estilo: "tablas",
    c: { a: "#8A6A48", b: "#6A4E34", c: "#4A3624", d: "#4A3624" },
  },
  {
    map: 4,
    fuerte: true,
    defR: [38, 46],
    estilo: "aleta",
    c: { a: "#6A8494", b: "#566F7E", c: "#3A4E5A", d: "#3A4E5A" },
  },
];
BASES.forEach((base, b) =>
  ["n", "src", "fl"].forEach((f) =>
    Object.defineProperty(base, f, {
      get: () => PCH_T("pch.b" + b + "." + f),
      enumerable: true,
      configurable: true,
    }),
  ),
);
const LEG = [
  {
    get n() {
      return PCH_T("pch.leg0.n");
    },
    get fx() {
      return PCH_T("pch.leg0.fx");
    },
  },
  {
    get n() {
      return PCH_T("pch.leg1.n");
    },
    get fx() {
      return PCH_T("pch.leg1.fx");
    },
  },
  {
    get n() {
      return PCH_T("pch.leg2.n");
    },
    get fx() {
      return PCH_T("pch.leg2.fx");
    },
  },
  {
    get n() {
      return PCH_T("pch.leg3.n");
    },
    get fx() {
      return PCH_T("pch.leg3.fx");
    },
  },
  {
    get n() {
      return PCH_T("pch.leg4.n");
    },
    get fx() {
      return PCH_T("pch.leg4.fx");
    },
  },
  {
    get n() {
      return PCH_T("pch.leg5.n");
    },
    get fx() {
      return PCH_T("pch.leg5.fx");
    },
  },
  {
    get n() {
      return PCH_T("pch.leg6.n");
    },
    get fx() {
      return PCH_T("pch.leg6.fx");
    },
  },
  {
    get n() {
      return PCH_T("pch.leg7.n");
    },
    get fx() {
      return PCH_T("pch.leg7.fx");
    },
  },
  {
    get n() {
      return PCH_T("pch.leg8.n");
    },
    get fx() {
      return PCH_T("pch.leg8.fx");
    },
  },
  {
    get n() {
      return PCH_T("pch.leg9.n");
    },
    get fx() {
      return PCH_T("pch.leg9.fx");
    },
  },
];

/* partículas del legendario, más intensas en los últimos mapas */
function particulas(mi, n, caja) {
  const [x0, y0, x1, y1] = caja;
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * ((i * 53 + 17) % 100)) / 100,
      y = y0 + ((y1 - y0) * ((i * 37 + 11) % 100)) / 100,
      k = "abc"[i % 3];
    if (mi === 0 || mi === 2)
      s += `<rect class="brasa ${k}" x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${i % 2 ? 7 : 10}" height="${i % 2 ? 7 : 10}" fill="${i % 2 ? "#FFD98A" : "#FF8D71"}"/>`;
    else if (mi === 1) s += star4(+x.toFixed(0), +y.toFixed(0), 9, "#F2FBFF", "titila " + k);
    else if (mi === 3)
      s += `<g class="flota ${k}">${rombo(+x.toFixed(0), +y.toFixed(0), 7, "#FF4D6D")}</g>`;
    else
      s +=
        i % 2
          ? P(
              [
                [x, y - 14],
                [x - 7, y + 2],
                [x + 1, y + 2],
                [x - 4, y + 14],
                [x + 8, y - 3],
                [x, y - 3],
              ],
              "#BFE9FF",
              'class="titila ' + k + '"',
            )
          : `<path class="brasa ${k}" d="M${x.toFixed(0)} ${y.toFixed(0)} q-6 10 0 13 q6 -3 0 -13 Z" fill="#8FC8E8"/>`;
  }
  return s;
}

/* ============================================================
 * ARMADO DE LAS 50
 * ============================================================ */
function armar(base, b, t) {
  const mi = base.map,
    M = MAPS[mi],
    L = t === 4,
    k = (mi + 1) / 5,
    l = [0, 0.05, 0.09, 0.13, 0.17][t];
  const c = { a: lt(base.c.a, l), b: lt(base.c.b, l), c: lt(base.c.c, l * 0.6), d: base.c.d };
  return {
    id: `${M.id}-${base.estilo}-${t + 1}`,
    b,
    t,
    map: mi,
    r: TIERS[t],
    L,
    k,
    c,
    base,
    get n() {
      return L ? LEG[b].n : base.n;
    },
    get baseN() {
      return base.n;
    },
    estilo: base.estilo,
    fuerte: base.fuerte,
    def: base.defR.map((v) => Math.round(v * (1 + 0.15 * t))),
    get fx() {
      return L ? LEG[b].fx : "";
    },
    get src() {
      return base.src;
    },
    get fl() {
      return base.fl;
    },
    ribete: L ? "#FFD98A" : t >= 1 ? M.c : dk(base.c.c, 0.2),
    metal: L ? "#FFD98A" : "#D9D2C8",
  };
}
const PECHERAS = [];
BASES.forEach((base, b) => TIERS.forEach((_, t) => PECHERAS.push(armar(base, b, t))));

/* una hombrera (izquierda o derecha) en el lugar indicado */
function hombrera(p, cx, cy, s, der) {
  const H = HOMBRO[p.estilo](p.c),
    F = (pts) => tr(pts, cx, cy, s, der),
    t = p.t;
  let o = "";
  if (t >= 3)
    o += H.pin
      .map(([x, y], i) => {
        const [X, Y] = F([[x, y]])[0];
        return `<g transform="translate(${X} ${Y}) scale(${der ? -s : s} ${s}) translate(${-X} ${-Y})">${PINCHO[p.map](X, Y, p.L ? "#FFD98A" : MAPS[p.map].c, p.L ? "#FFFFFF" : "#E0392E")}</g>`;
      })
      .join("");
  if (t >= 3) o += P(F(H.lama), p.c.c);
  o += H.capas.map(([pts, f]) => P(F(pts), f)).join("");
  if (H.extra)
    o += `<g transform="translate(${cx} ${cy}) scale(${der ? -s : s} ${s})">${H.extra}</g>`;
  o += P(F(H.borde), p.ribete);
  if (t >= 2)
    o += H.rem
      .map(([x, y]) => {
        const [X, Y] = F([[x, y]])[0];
        return rombo(+X.toFixed(1), +Y.toFixed(1), 5 * s + 1, p.metal);
      })
      .join("");
  if (t >= 2 && !der) {
    const [X, Y] = F([[4, 6]])[0];
    o += `<g transform="translate(${X - 13 * s} ${Y - 13 * s}) scale(${0.65 * s})">${M_ICON(p.map)}</g>`;
  }
  return o;
}
const M_ICON = (mi) => MAPS[mi].icon;

/* el peto completo en coordenadas de miniatura */
function peto(p) {
  const c = p.c;
  let o = "";
  o += P(FALD_L, c.b) + P(MX(FALD_L), c.c) + P(FALD_C, c.a);
  o +=
    P(
      [[FALD_L[3][0], FALD_L[3][1] - 8], [FALD_L[2][0], FALD_L[2][1] - 8], FALD_L[2], FALD_L[3]],
      p.ribete,
    ) +
    P(
      MX([
        [FALD_L[3][0], FALD_L[3][1] - 8],
        [FALD_L[2][0], FALD_L[2][1] - 8],
        FALD_L[2],
        FALD_L[3],
      ]),
      p.ribete,
    ) +
    P(
      [
        [218, 448],
        [262, 448],
        [262, 456],
        [218, 456],
      ],
      p.ribete,
    );
  o += FALDON[p.estilo](c);
  o += P(PETO, c.b) + P(PETO.filter(([x]) => x <= 240).concat([[240, 398]]), c.a, 'opacity=".55"');
  o += P(
    [
      [134, 250],
      [346, 250],
      [334, 330],
      [322, 372],
      [282, 392],
      [240, 398],
      [198, 392],
      [158, 372],
      [146, 330],
    ],
    c.c,
    'opacity=".35"',
  );
  o += PECHO[p.estilo](c);
  o += P(CUELLO, "#1A1414");
  o +=
    P(CINTO, c.d == c.c ? dk(c.c, 0.25) : c.d) +
    P(
      [
        [222, 348],
        [258, 348],
        [258, 384],
        [222, 384],
      ],
      p.t >= 1 ? p.ribete : "#8E8888",
    ) +
    P(
      [
        [230, 356],
        [250, 356],
        [250, 376],
        [230, 376],
      ],
      "#1A1414",
    );
  if (p.t >= 2) o += `<g transform="translate(226 352) scale(.7)">${M_ICON(p.map)}</g>`;
  if (p.t >= 1)
    o += P(
      [
        [158, 372],
        [198, 392],
        [240, 398],
        [282, 392],
        [322, 372],
        [322, 380],
        [282, 400],
        [240, 406],
        [198, 400],
        [158, 380],
      ],
      p.ribete,
    );
  return o;
}

/* ---------- MINIATURA (inventario / tienda) ----------
 * Versión simple, en la línea low-poly del vikingo: silueta grande, 3 tonos planos
 * y un solo detalle propio por modelo. La rareza se lee por piezas (hombreras, capa) y color. */
const SIMPLE = {
  placa: (c) =>
    P(
      [
        [134, 236],
        [346, 236],
        [343, 262],
        [137, 262],
      ],
      c.c,
    ) + rombo(240, 196, 13, "#FF8D71"),
  brasero: (c) =>
    P(
      [
        [176, 200],
        [304, 196],
        [302, 214],
        [178, 218],
      ],
      "#FF8D71",
    ) +
    P(
      [
        [176, 246],
        [304, 242],
        [302, 260],
        [178, 264],
      ],
      "#FF8D71",
    ),
  corteza: (c) =>
    P(
      [
        [150, 134],
        [210, 150],
        [240, 154],
        [270, 150],
        [330, 134],
        [340, 154],
        [270, 170],
        [240, 174],
        [210, 170],
        [140, 154],
      ],
      "#F2F6F8",
    ) +
    P(
      [
        [214, 176],
        [238, 176],
        [238, 330],
        [216, 322],
      ],
      c.c,
    ),
  pelaje: (c) =>
    P(
      [
        [124, 176],
        [140, 136],
        [176, 168],
        [208, 132],
        [240, 166],
        [272, 132],
        [304, 168],
        [340, 136],
        [356, 176],
        [300, 200],
        [240, 188],
        [180, 200],
      ],
      "#E8ECEE",
    ),
  escoria: (c) =>
    `<polyline points="206,168 228,236 206,300 236,352" fill="none" stroke="#FF8D71" stroke-width="10" stroke-linejoin="round"/>`,
  caldera: (c) =>
    P(
      [
        [222, 196],
        [258, 196],
        [274, 212],
        [274, 248],
        [258, 264],
        [222, 264],
        [206, 248],
        [206, 212],
      ],
      "#C8963E",
    ) +
    P(
      [
        [230, 210],
        [250, 210],
        [260, 220],
        [260, 240],
        [250, 250],
        [230, 250],
        [220, 240],
        [220, 220],
      ],
      "#2A2424",
    ),
  hueso: (c) =>
    P(
      [
        [232, 168],
        [248, 168],
        [248, 330],
        [232, 330],
      ],
      "#E8DCC4",
    ) +
    P(
      [
        [232, 210],
        [170, 222],
        [174, 238],
        [232, 228],
      ],
      "#E8DCC4",
    ) +
    P(
      [
        [248, 210],
        [310, 222],
        [306, 238],
        [248, 228],
      ],
      "#CFC3A8",
    ) +
    P(
      [
        [232, 258],
        [180, 268],
        [184, 282],
        [232, 274],
      ],
      "#E8DCC4",
    ) +
    P(
      [
        [248, 258],
        [300, 268],
        [296, 282],
        [248, 274],
      ],
      "#CFC3A8",
    ),
  runa: (c) =>
    `<path d="M240 176 V322 M240 222 L208 190 M240 222 L272 190" stroke="#E0392E" stroke-width="12" stroke-linecap="round" fill="none"/>`,
  tablas: (c) =>
    P(
      [
        [132, 190],
        [162, 172],
        [346, 330],
        [318, 350],
      ],
      "#CDB48A",
    ),
  aleta: (c) =>
    [196, 260]
      .map((y, i) =>
        P(
          [
            [160, y],
            [240, y + 44],
            [320, y],
            [320, y + 22],
            [240, y + 66],
            [160, y + 22],
          ],
          "#BFE9FF",
        ),
      )
      .join(""),
};
/* en la miniatura cada hombrera usa solo sus capas principales + su rasgo propio */
const ITEM_CAPAS = {
  placa: [0, 1],
  brasero: [0, 1, 3, 4],
  corteza: [0, 1, 2, 3],
  pelaje: [0, 1, 2],
  escoria: [0, 1, 2],
  caldera: [0, 1],
  hueso: [0, 1, 2],
  runa: [0, 1],
  tablas: [0, 1, 2, 3, 4],
  aleta: [0, 1, 3],
};
function hombreraItem(p, cx, cy, der) {
  const H = HOMBRO[p.estilo](p.c),
    F = (pts) => tr(pts, cx, cy, 1, der);
  let o = "";
  if (p.t >= 3) {
    const [x, y] = H.pin[0],
      [X, Y] = F([[x, y]])[0];
    o += `<g transform="translate(${X} ${Y}) scale(${der ? -1 : 1} 1) translate(${-X} ${-Y})">${PINCHO[p.map](X, Y, p.L ? "#FFD98A" : MAPS[p.map].c, p.L ? "#FFFFFF" : "#E0392E")}</g>`;
  }
  const usar = ITEM_CAPAS[p.estilo] || [0, 1];
  o += usar
    .map((i) => H.capas[i])
    .filter(Boolean)
    .map(([pts, f]) => P(F(pts), f))
    .join("");
  return o + P(F(H.borde), p.ribete);
}
const PETO_S = [
  [150, 130],
  [210, 146],
  [240, 150],
  [270, 146],
  [330, 130],
  [350, 170],
  [338, 340],
  [240, 400],
  [142, 340],
  [130, 170],
];
function pecheraItem(p) {
  const c = p.c,
    ribete = p.t >= 1 ? p.ribete : c.c;
  const peto =
    P(
      [
        [178, 378],
        [302, 378],
        [296, 440],
        [184, 440],
      ],
      c.c,
    ) +
    P(
      [
        [184, 426],
        [296, 426],
        [296, 440],
        [184, 440],
      ],
      ribete,
    ) +
    P(PETO_S, c.b) +
    P(
      [
        [150, 130],
        [210, 146],
        [240, 150],
        [240, 400],
        [142, 340],
        [130, 170],
      ],
      c.a,
    ) +
    P(
      [
        [142, 340],
        [240, 300],
        [338, 340],
        [240, 400],
      ],
      c.c,
    ) +
    SIMPLE[p.estilo](c) +
    P(
      [
        [210, 146],
        [240, 150],
        [270, 146],
        [260, 172],
        [240, 180],
        [220, 172],
      ],
      "#1A1414",
    ) +
    (p.t >= 1
      ? P(
          [
            [142, 340],
            [240, 400],
            [338, 340],
            [338, 352],
            [240, 412],
            [142, 352],
          ],
          ribete,
        )
      : "");
  const brillo = p.L
    ? [
        [92, 110],
        [396, 96],
        [410, 300],
      ]
        .map(
          ([x, y], i) =>
            `<rect class="brasa ${"abc"[i]}" x="${x}" y="${y}" width="12" height="12" fill="#FFD98A" transform="rotate(45 ${x + 6} ${y + 6})"/>`,
        )
        .join("")
    : "";
  return `<svg viewBox="28 40 424 430" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${p.n}">
  ${peto}
  ${p.t >= 2 ? hombreraItem(p, 118, 166, false) + hombreraItem(p, 362, 166, true) : ""}
  ${brillo}
  </svg>`;
}

/* ---------- EN JUEGO ----------
 * El peto va DETRÁS de la barba: la barba cae encima, como un vikingo de verdad.
 * Asoman los faldones debajo y a los costados de la barba; las hombreras van adelante. */
const JUEGO_PETO = "translate(240 568) scale(1.25) translate(-240 -452)";
function parteDetras(p) {
  return `<g transform="${JUEGO_PETO}">${peto(p)}</g>`;
}
function parteDelante(p) {
  return (
    (p.t >= 2 ? hombrera(p, 72, 486, 0.95, false) + hombrera(p, 408, 486, 0.95, true) : "") +
    (p.L ? particulas(p.map, 2 + p.map * 2, [-10, 380, 490, 560]) : "")
  );
}

const VIK_I18N = { rojo: "pick.red", blanco: "pick.white", azul: "pick.blue", verde: "pick.green" };
const vikAria = (vik, p) => {
  const v = PCH_T(VIK_I18N[vik] || "pick.red");
  return p ? PCH_T("pch.aria.con", { vik: v, n: p.n }) : v;
};
function vikingo(p, vik = "rojo", expr = "tranquilo", fondo = "", casco = "", mano = "") {
  const v = VIK[vik] || VIK.rojo,
    u = "g" + Math.random().toString(36).slice(2, 8);
  const ojos =
    expr === "atacando"
      ? `<polygon points="146,288 214,306 214,322 148,306" fill="#F2ECEC"/><polygon points="299,306 357,288 355,306 299,322" fill="#F2ECEC"/>`
      : `<polygon points="146,290 214,302 214,320 148,310" fill="#F2ECEC"/><polygon points="299,302 357,290 355,310 299,320" fill="#F2ECEC"/>`;
  // el casco trae su propia cúpula, cara y E, y sobresale: el recuadro crece para que no se corte
  const vb = casco ? "-80 -50 640 660" : "-20 60 520 550";
  const wh = casco ? 'width="640" height="660"' : 'width="520" height="550"';
  const domo = `<path d="M60 205 C90 95 390 95 420 205 Z" fill="${v.dome}"/><path d="M240 126 L240 205" stroke="${v.line}" stroke-width="10"/>`;
  const cara = `<polygon points="125,262 378,262 378,470 320,510 185,510 125,470" fill="${v.face}"/>`;
  const letra = `<g transform="translate(431,110) rotate(90)"><g fill="${v.sh}">${E_SH}</g><path fill="url(#${u})" d="${E_D}"/></g>`;
  return `<svg ${wh} viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${vikAria(vik, p)}">
  <defs><linearGradient id="${u}" x1="199" y1="354" x2="199" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${v.e2}"/><stop offset="1" stop-color="${v.e1}"/></linearGradient></defs>
  <ellipse cx="248" cy="584" rx="190" ry="14" fill="${p ? RAR[p.r].hex : "#000"}" opacity=".22"/>
  ${fondo}
  ${casco ? "" : domo}
  ${p ? parteDetras(p) : ""}
  ${casco || cara}
  <polygon points="128,430 376,430 384,480 340,528 290,520 252,556 212,520 164,528 120,480" fill="${v.beard}"/>
  ${casco ? "" : letra}
  ${ojos}
  ${p ? parteDelante(p) : ""}
  ${mano}
  </svg>`;
}
window.EromashPecheras = {
  PECHERAS,
  BASES,
  MAPS,
  RAR,
  pecheraItem,
  vikingo,
  parteDetras,
  parteDelante,
};
