// ---------- el mago de Eromash (módulo MAGO) ----------
// El personaje de la ilustración «El mago escribe las notas» (/mnt/project-files/ilustraciones), tal cual: la E roja con
// sombrero, barba y ojos de runa. Lo usa el prólogo (prologo.js), donde escribe en su escritorio.
(function () {
  const PAL = {
    R: {
      domo: "#5E130D",
      claro: "#7A1D14",
      linea: "#44100A",
      e1: "#C8402D",
      e2: "#9C2315",
      cara: "#0A0707",
    },
    W: {
      domo: "#E0B2B2",
      claro: "#F2D6D6",
      linea: "#C9A0A0",
      e1: "#F2ECEC",
      e2: "#E9DCDC",
      cara: "#111111",
    },
    B: {
      domo: "#1E3F73",
      claro: "#2F5FA8",
      linea: "#142C52",
      e1: "#5B8BE0",
      e2: "#2F5FA8",
      cara: "#0A0707",
    },
    V: {
      domo: "#1B5E3A",
      claro: "#23A35E",
      linea: "#124229",
      e1: "#3DDC84",
      e2: "#23A35E",
      cara: "#0A0707",
    },
  };
  const MANA = "#5BB8FF",
    MANA2 = "#BFE6FF",
    ORO = "#C9A45A",
    ORO2 = "#FFD98A";
  // la E del logo (372 x 382) y las caras que le dan volumen
  const E_PATH = new Path2D(
    "m88,0c94.67.33,189.33.67,284,1l-55,60h-159l-3,84h161l-61,59h-97l-1,94h197l-58,56H33l56-57v-90l-63,1,62-62,3-86-65,1L88,0Z",
  );
  const E_FONDO = [
    [26, 61, 0, 87, 64, 87, 64, 170, 89, 145, 91, 60],
    [26, 208, 89, 207, 89, 297, 64, 323, 64, 231, 2, 232],
    [33, 354, 4, 382, 267, 382, 296, 354],
    [158, 204, 255, 204, 225, 231, 157, 231],
    [158, 61, 157, 87, 291, 87, 317, 61],
  ];
  const CARA = [
    [125, 262],
    [378, 262],
    [378, 470],
    [320, 510],
    [185, 510],
    [125, 470],
  ];
  const HB = 150; // de dónde nace el sombrero (el borde de arriba de la E ya girada)
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  function P(c, pts, f, al) {
    if (al != null) c.globalAlpha = al;
    c.fillStyle = f;
    c.beginPath();
    pts.forEach((v, i) => (i ? c.lineTo(v[0], v[1]) : c.moveTo(v[0], v[1])));
    c.closePath();
    c.fill();
    if (al != null) c.globalAlpha = 1;
  }

  // ---------- el mago (coordenadas del dibujo del vikingo: 40..440 x 90..570, centro en 240,330) ----------
  // o: { k, t, lift, eye: 'calm'|'fierce', glow: 0..1, rot, sdy, book: 0..1, carga: 0..1 }
  function mago(c, x, y, s, o) {
    const pal = PAL[o.k],
      t = o.t || 0,
      bob = Math.sin(t / 420) * 5;
    const m = Object.assign(
      { erot: Math.PI / 2, e: 1, hat: 1, face: 1, beard: 1, eyes: 1, staff: 1, book: 1, sombra: 1 },
      o.m || {},
    );
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.translate(-240, -330);
    // sombra
    c.fillStyle = "rgba(0,0,0," + 0.5 * m.sombra + ")";
    c.beginPath();
    c.ellipse(250, 826, 170 - (o.lift || 0) * 1.5, 20, 0, 0, 7);
    c.fill();
    c.translate(0, -(o.lift || 0) + bob);

    // --- libro de runas, flotando a la izquierda ---
    c.save();
    c.globalAlpha = m.book;
    c.translate(-30, 540 + Math.sin(t / 360 + 1) * 8 + 60 * (1 - m.book));
    const ab = o.book || 0;
    if (ab > 0.05) {
      // abierto: dos hojas y los signos que suben
      c.save();
      c.shadowColor = MANA;
      c.shadowBlur = 30 * ab;
      P(
        c,
        [
          [-78, -30],
          [0, -18],
          [0, 62],
          [-78, 44],
        ],
        "#F2ECEC",
      );
      P(
        c,
        [
          [0, -18],
          [78, -30],
          [78, 44],
          [0, 62],
        ],
        "#E0D6D6",
      );
      c.restore();
      P(
        c,
        [
          [-84, -24],
          [-78, -30],
          [-78, 44],
          [-84, 50],
        ],
        "#5E130D",
      );
      P(
        c,
        [
          [78, -30],
          [84, -24],
          [84, 50],
          [78, 44],
        ],
        "#5E130D",
      );
      c.fillStyle = MANA;
      for (let i = 0; i < 4; i++) {
        c.fillRect(-64, -12 + i * 14, 48, 5);
        c.fillRect(14, -14 + i * 14, 50, 5);
      }
      for (let i = 0; i < 5; i++) {
        const u = (t / 900 + i * 0.2) % 1,
          gx = -50 + i * 26,
          gy = -40 - u * 120;
        c.save();
        c.globalAlpha = (1 - u) * ab * m.book;
        c.translate(gx, gy);
        c.rotate(i);
        c.shadowColor = MANA;
        c.shadowBlur = 12;
        P(
          c,
          [
            [0, -11],
            [8, 0],
            [0, 11],
            [-8, 0],
          ],
          MANA2,
        );
        c.restore();
      }
    } else {
      P(
        c,
        [
          [-46, -52],
          [44, -60],
          [50, 50],
          [-40, 58],
        ],
        "#5E130D",
      );
      P(
        c,
        [
          [-46, -52],
          [-34, -53],
          [-28, 57],
          [-40, 58],
        ],
        "#3A0C08",
      );
      P(
        c,
        [
          [44, -60],
          [54, -54],
          [60, 44],
          [50, 50],
        ],
        "#E0D6D6",
      );
      P(
        c,
        [
          [26, -58],
          [44, -60],
          [45, -42],
          [27, -40],
        ],
        ORO,
      );
      P(
        c,
        [
          [31, 34],
          [49, 32],
          [50, 50],
          [32, 52],
        ],
        ORO,
      );
      c.save();
      c.shadowColor = MANA;
      c.shadowBlur = 14;
      P(
        c,
        [
          [6, -22],
          [22, 0],
          [8, 24],
          [-8, 2],
        ],
        MANA,
      );
      c.restore();
    }
    c.restore();

    // --- bastón, flotando a la derecha (gira alrededor de su centro) ---
    c.save();
    c.globalAlpha = m.staff;
    c.translate(520, 440 + (o.sdy || 0) + Math.sin(t / 380 + 2) * 6 + 220 * (1 - m.staff));
    c.rotate(o.rot || 0);
    c.translate(-500, -360);
    P(
      c,
      [
        [492, 70],
        [508, 70],
        [508, 640],
        [492, 640],
      ],
      "#5E3D28",
    );
    P(
      c,
      [
        [503, 70],
        [508, 70],
        [508, 640],
        [503, 640],
      ],
      "#8E6242",
    );
    P(
      c,
      [
        [488, 150],
        [512, 150],
        [512, 166],
        [488, 166],
      ],
      ORO,
    );
    P(
      c,
      [
        [488, 420],
        [512, 420],
        [512, 436],
        [488, 436],
      ],
      ORO,
    );
    P(
      c,
      [
        [490, 630],
        [510, 630],
        [504, 660],
        [496, 660],
      ],
      ORO,
    );
    // dos cuernos que sostienen el cristal
    P(
      c,
      [
        [492, 76],
        [462, 30],
        [466, -36],
        [494, -72],
        [484, -30],
        [486, 16],
        [502, 62],
      ],
      "#5E3D28",
    );
    P(
      c,
      [
        [508, 76],
        [538, 30],
        [534, -36],
        [506, -72],
        [516, -30],
        [514, 16],
        [498, 62],
      ],
      "#8E6242",
    );
    P(
      c,
      [
        [484, 60],
        [516, 60],
        [512, 80],
        [488, 80],
      ],
      ORO,
    );
    const g = 0.45 + 0.55 * (o.carga || 0) + 0.12 * Math.sin(t / 160);
    c.save();
    c.shadowColor = MANA;
    c.shadowBlur = 26 + 50 * (o.carga || 0);
    P(
      c,
      [
        [500, -54],
        [526, -10],
        [500, 38],
        [474, -10],
      ],
      MANA,
    );
    c.restore();
    P(
      c,
      [
        [500, -54],
        [526, -10],
        [500, -10],
      ],
      MANA2,
    );
    P(
      c,
      [
        [500, -10],
        [474, -10],
        [500, 38],
      ],
      "#2E86C9",
    );
    c.save();
    c.globalAlpha = clamp(g) * 0.5 * m.staff;
    c.fillStyle = "#FFFFFF";
    c.beginPath();
    c.arc(500, -10, 12 + 16 * (o.carga || 0), 0, 7);
    c.fill();
    c.restore();
    c.restore();

    // --- cabeza: cara, barba y la E ---
    // la cara, en sombra
    c.save();
    c.globalAlpha = m.face;
    P(c, CARA, pal.cara);
    c.restore();
    // la E: gira 90 grados. En el mago no es un casco: es su cara
    const dibE = (al) => {
      c.save();
      c.globalAlpha = al;
      c.translate(240, 296);
      c.rotate(m.erot);
      c.translate(-186, -191);
      c.fillStyle = pal.linea;
      E_FONDO.forEach((q) => {
        c.beginPath();
        for (let i = 0; i < q.length; i += 2)
          i ? c.lineTo(q[i], q[i + 1]) : c.moveTo(q[i], q[i + 1]);
        c.closePath();
        c.fill();
      });
      const ge = c.createLinearGradient(199, 354, 199, 0);
      ge.addColorStop(0, pal.e2);
      ge.addColorStop(1, pal.e1);
      c.fillStyle = ge;
      c.fill(E_PATH);
      c.restore();
    };
    dibE(m.e);
    // el lomo de la E crece: ala ancha y punta doblada, del mismo material
    if (m.hat > 0.01) {
      const h = m.hat,
        gh = c.createLinearGradient(0, HB, 0, HB - 238);
      gh.addColorStop(0, pal.e2);
      gh.addColorStop(1, pal.e1);
      c.save();
      c.translate(0, HB);
      c.scale(1, h);
      c.translate(0, -HB);
      P(
        c,
        [
          [104, HB],
          [396, HB],
          [372, HB - 70],
          [356, HB - 134],
          [380, HB - 188],
          [436, HB - 216],
          [366, HB - 238],
          [300, HB - 210],
          [262, HB - 152],
          [204, HB - 88],
          [140, HB - 38],
        ],
        gh,
      );
      // la cara en sombra, como el costado de la E
      P(
        c,
        [
          [104, HB],
          [214, HB],
          [236, HB - 70],
          [262, HB - 152],
          [204, HB - 88],
          [140, HB - 38],
        ],
        pal.domo,
      );
      P(
        c,
        [
          [262, HB - 152],
          [300, HB - 210],
          [366, HB - 238],
          [330, HB - 214],
          [296, HB - 176],
          [276, HB - 120],
          [236, HB - 70],
        ],
        pal.domo,
      );
      P(
        c,
        [
          [356, HB - 134],
          [380, HB - 188],
          [326, HB - 168],
        ],
        pal.linea,
      );
      // runa al frente
      c.save();
      c.shadowColor = MANA;
      c.shadowBlur = 16;
      P(
        c,
        [
          [300, HB - 74],
          [320, HB - 46],
          [300, HB - 18],
          [280, HB - 46],
        ],
        MANA,
      );
      c.restore();
      P(
        c,
        [
          [300, HB - 74],
          [320, HB - 46],
          [300, HB - 46],
        ],
        MANA2,
      );
      // colgante en la punta
      P(
        c,
        [
          [436, HB - 216],
          [440, HB - 190],
          [432, HB - 190],
        ],
        "#3a2a22",
      );
      c.save();
      c.shadowColor = ORO2;
      c.shadowBlur = 12;
      P(
        c,
        [
          [436, HB - 194],
          [448, HB - 178],
          [436, HB - 162],
          [424, HB - 178],
        ],
        ORO2,
      );
      c.restore();
      c.restore();
      // ala: el borde de arriba de la E se estira hacia los costados
      const a = 150 + 78 * h,
        b = 110 + 78 * h;
      P(
        c,
        [
          [250 - a, HB + 24],
          [250 - b, HB - 14],
          [250 + b, HB - 14],
          [250 + a, HB + 24],
        ],
        pal.e1,
      );
      P(
        c,
        [
          [250 - a, HB + 24],
          [250 - b, HB - 14],
          [250 - b + 60, HB - 14],
          [250 - a + 76, HB + 24],
        ],
        pal.e2,
      );
      P(
        c,
        [
          [250 - a, HB + 24],
          [250 + a, HB + 24],
          [250 + a - 22, HB + 38],
          [250 - a + 22, HB + 38],
        ],
        pal.linea,
      );
    }
    // la barba: nace en los pómulos y tapa la E de ahí para abajo
    const BB = o.k === "W" ? ["#E0B2B2", "#C9A0A0", "#B58C8C"] : ["#F2ECEC", "#D9CFCF", "#BDB0B0"];
    const vai = Math.sin(t / 520) * 12 * (m.beard >= 1 ? 1 : 0);
    if (m.beard > 0.01) {
      const ab = Math.min(1, m.beard * 2);
      c.save();
      c.globalAlpha = ab;
      c.translate(0, 338);
      c.scale(1, m.beard);
      c.translate(0, -338);
      P(
        c,
        [
          [40, 338],
          [200, 358],
          [255, 362],
          [310, 358],
          [442, 338],
          [452, 450],
          [426, 532],
          [394, 502],
          [369, 584],
          [341, 558],
          [317, 652],
          [281, 730],
          [255 + vai, 796],
          [229, 730],
          [193, 652],
          [169, 558],
          [141, 584],
          [116, 502],
          [84, 532],
          [34, 450],
        ],
        BB[0],
      );
      P(
        c,
        [
          [255, 362],
          [310, 358],
          [442, 338],
          [452, 450],
          [426, 532],
          [394, 502],
          [369, 584],
          [341, 558],
          [317, 652],
          [281, 730],
          [255 + vai, 796],
          [255, 640],
        ],
        BB[1],
      );
      P(
        c,
        [
          [183, 486],
          [195, 484],
          [219, 616],
          [209, 620],
        ],
        BB[1],
      );
      P(
        c,
        [
          [315, 484],
          [327, 486],
          [301, 620],
          [291, 616],
        ],
        BB[2],
      );
      P(
        c,
        [
          [249, 506],
          [261, 506],
          [259, 634],
          [251, 634],
        ],
        BB[2],
      );
      P(
        c,
        [
          [76, 400],
          [88, 398],
          [104, 490],
          [96, 494],
        ],
        BB[1],
      );
      P(
        c,
        [
          [406, 398],
          [418, 400],
          [398, 494],
          [390, 490],
        ],
        BB[2],
      );
      P(
        c,
        [
          [214, 640],
          [296, 640],
          [289, 662],
          [221, 662],
        ],
        ORO2,
      );
      P(
        c,
        [
          [214, 640],
          [255, 640],
          [255, 662],
          [221, 662],
        ],
        ORO,
      );
      P(
        c,
        [
          [236, 712],
          [274, 712],
          [270, 730],
          [240, 730],
        ],
        ORO2,
      );
      P(
        c,
        [
          [236, 712],
          [255, 712],
          [255, 730],
          [240, 730],
        ],
        ORO,
      );
      c.restore();
      // la nariz: la barra del medio de la E, por encima de la barba
      c.save();
      c.beginPath();
      c.rect(198, 326, 90, 104);
      c.clip();
      dibE(m.e * ab);
      c.restore();
    }
    // bigote donde termina la nariz, y la boca debajo del bigote
    if (m.beard > 0.3) {
      c.save();
      c.globalAlpha = seg(m.beard, 0.3, 0.7);
      P(
        c,
        [
          [255, 408],
          [211, 428],
          [133, 432],
          [84, 468],
          [165, 486],
          [222, 470],
          [255, 452],
          [288, 470],
          [345, 486],
          [426, 468],
          [377, 432],
          [299, 428],
        ],
        BB[2],
      );
      P(
        c,
        [
          [218, 456],
          [255, 436],
          [292, 456],
          [278, 472],
          [232, 472],
        ],
        pal.cara,
      );
      P(
        c,
        [
          [255, 394],
          [211, 414],
          [133, 418],
          [84, 460],
          [165, 468],
          [229, 452],
          [255, 436],
        ],
        BB[0],
      );
      P(
        c,
        [
          [255, 394],
          [299, 414],
          [377, 418],
          [426, 460],
          [345, 468],
          [281, 452],
          [255, 436],
        ],
        BB[1],
      );
      c.restore();
    }
    // ojos
    const ojo = o.glow ? MANA2 : "#F2ECEC";
    c.save();
    if (o.glow) {
      c.shadowColor = MANA;
      c.shadowBlur = 26 * o.glow;
    }
    c.translate(0, 308);
    c.scale(1, Math.max(0, m.eyes));
    c.translate(0, -308);
    if (m.eyes > 0.01) {
      if (o.eye === "fierce") {
        P(
          c,
          [
            [146, 296],
            [216, 308],
            [216, 324],
            [148, 318],
          ],
          ojo,
        );
        P(
          c,
          [
            [296, 308],
            [362, 296],
            [360, 318],
            [296, 324],
          ],
          ojo,
        );
      } else {
        P(
          c,
          [
            [146, 290],
            [214, 302],
            [214, 320],
            [148, 310],
          ],
          ojo,
        );
        P(
          c,
          [
            [299, 302],
            [357, 290],
            [355, 310],
            [299, 320],
          ],
          ojo,
        );
      }
    }
    c.restore();
    c.restore();
  }
  window.MAGO = mago;
})();
