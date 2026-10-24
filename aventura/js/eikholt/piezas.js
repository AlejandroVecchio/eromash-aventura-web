// ---------- las piezas de Eikholt en 3D (módulo PIEZAS) ----------
// Todo lo que no es una casa: faroles, barriles, cajones, toldos del mercado con su mercancía, carretas con lona, el
// buey, el pozo de Gudrun, la campana, el tablón, los doce asientos del Ting y la piedra negra, las piedras de la
// cúpula, cercos, huertas, muñecos de paja, la forja de Ása con su chimenea de piedra, la grúa de la carpintería, el
// torno del cordelero, las cubas de la curtiembre, el muelle de balsas, botes, secaderos de pescado, estandartes del
// Ciervo, pinos, abedules, rocas y pasto. Cada una se arma en un armador de GEO (a = mate, b = lo que brilla) en
// coordenadas del mundo, así un barrio entero es una sola malla.
window.PIEZAS = (function () {
  "use strict";
  const C = {
    madera: "#5A3E2C",
    maderaOsc: "#3A2A1E",
    maderaClara: "#8A6A48",
    hierro: "#2E2E30",
    piedra: "#737C77",
    piedraOsc: "#5A605C",
    lona: ["#B8A47A", "#5E6A4A", "#5A6A7A", "#8A4A32", "#C8B48C", "#6E5A3A"], // ocre, verde apagado, azul humo, rojo óxido
    vidrio: "#F2C46A",
    ambar: "#E9B765",
    runico: "#73D5DB",
    runicoNucleo: "#D8F6F7",
    follaje: "#30443B",
    follaje2: "#3A5040",
    musgo: "#68704B",
    tierra: "#4C3C32",
    paja: "#C8A860",
  };
  const PI = Math.PI;

  // ---------- luz de la gente ----------
  function farol(a, b, x, z, alto = 3.2, ry = 0) {
    a.cilindro(x, 0, z, 0.12, 0.1, alto, 6, C.maderaOsc);
    a.con({ x, y: alto, z, ry }, () => {
      a.caja(0.35, -0.1, 0, 0.8, 0.1, 0.1, C.maderaOsc);
      a.caja(0.7, -0.5, 0, 0.04, 0.4, 0.04, C.hierro);
      a.caja(0.7, -0.98, 0, 0.36, 0.06, 0.36, C.hierro);
      a.caja(0.7, -0.62, 0, 0.42, 0.08, 0.42, C.hierro);
      a.cilindro(0.7, -0.55, 0, 0.24, 0, 0.18, 4, C.hierro);
      b.caja(0.7, -0.92, 0, 0.28, 0.3, 0.28, C.vidrio);
    });
    const ca = Math.cos(ry),
      sa = Math.sin(ry);
    return [x + 0.7 * ca, alto - 0.75, z - 0.7 * sa];
  }
  function antorcha(a, b, x, y, z) {
    a.cilindro(x, y, z, 0.05, 0.07, 0.6, 5, C.maderaOsc);
    b.bola(x, y + 0.72, z, 0.11, 0.18, 0.11, "#FFB050", 0, 0.3);
    return [x, y + 0.8, z];
  }
  // ---------- cosas sueltas ----------
  function barril(a, x, z, s = 1, y = 0, acostado) {
    const f = () => {
      a.cilindro(0, 0, 0, 0.36, 0.4, 0.45, 8, "#6A4A30");
      a.cilindro(0, 0.45, 0, 0.4, 0.36, 0.45, 8, "#6A4A30", "#7A5A3A");
      a.cilindro(0, 0.12, 0, 0.385, 0.39, 0.05, 8, C.hierro, C.hierro, false);
      a.cilindro(0, 0.75, 0, 0.385, 0.38, 0.05, 8, C.hierro, C.hierro, false);
    };
    a.con({ x, y, z, s, rz: acostado ? PI / 2 : 0, ry: x * 0.7 }, f);
  }
  function cajon(a, x, z, s = 1, y = 0, ry = 0, color = "#7A5A3A") {
    a.con({ x, y, z, s, ry }, () => {
      a.caja(0, 0, 0, 0.8, 0.6, 0.6, color);
      a.caja(0, 0.08, 0.31, 0.82, 0.07, 0.03, C.maderaOsc);
      a.caja(0, 0.45, 0.31, 0.82, 0.07, 0.03, C.maderaOsc);
      a.caja(0, 0.3, 0.31, 0.06, 0.6, 0.03, C.maderaOsc);
    });
  }
  function canasto(a, x, z, contenido, y = 0) {
    a.cilindro(x, y, z, 0.25, 0.3, 0.28, 7, C.paja);
    if (contenido) for (let i = 0; i < 4; i++) a.bola(x + Math.cos(i * 1.7) * 0.11, y + 0.3, z + Math.sin(i * 1.7) * 0.11, 0.09, 0.07, 0.09, contenido, 0, 0.2);
  }
  function banco(a, x, z, ry = 0, largo = 1.6) {
    a.con({ x, z, ry }, () => {
      a.caja(0, 0.38, 0, largo, 0.08, 0.36, C.madera);
      a.caja(-largo / 2 + 0.15, 0, 0, 0.1, 0.38, 0.3, C.maderaOsc);
      a.caja(largo / 2 - 0.15, 0, 0, 0.1, 0.38, 0.3, C.maderaOsc);
    });
  }
  function mesa(a, x, z, ry = 0, largo = 2.2, ancho = 0.9, cosas, y = 0) {
    a.con({ x, y, z, ry }, () => {
      a.caja(0, 0.74, 0, largo, 0.08, ancho, C.maderaClara);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.caja((sx * (largo - 0.2)) / 2, 0, (sz * (ancho - 0.16)) / 2, 0.1, 0.74, 0.1, C.maderaOsc);
      if (cosas) {
        for (let i = 0; i < cosas; i++) {
          const xx = -largo / 2 + 0.3 + ((i + 0.5) * (largo - 0.6)) / cosas;
          if (i % 3 === 0) a.cilindro(xx, 0.82, 0.1, 0.07, 0.08, 0.16, 6, "#8A6A48");
          else if (i % 3 === 1) a.cilindro(xx, 0.82, -0.12, 0.16, 0.13, 0.05, 7, "#C8B8A0");
          else a.caja(xx, 0.82, 0, 0.3, 0.12, 0.22, "#C8A070");
        }
      }
    });
  }
  function lena(a, x, z, ry = 0, n = 5) {
    a.con({ x, z, ry }, () => {
      for (let i = 0; i < 3; i++) for (let k = 0; k < n - i; k++) a.con({ x: (k - (n - i - 1) / 2) * 0.25, y: 0.12 + i * 0.21, z: 0 }, () => a.con({ rx: PI / 2 }, () => a.cilindro(0, -0.45, 0, 0.11, 0.11, 0.9, 6, "#6A4A30", "#C89A68")));
    });
  }
  function carro(a, x, z, ry = 0, carga) {
    a.con({ x, z, ry }, () => {
      a.caja(0, 0.55, 0, 1.4, 0.12, 2.2, C.madera);
      for (const s of [-1, 1]) a.caja(s * 0.68, 0.67, 0, 0.06, 0.35, 2.2, C.maderaOsc);
      a.caja(0, 0.67, 1.08, 1.4, 0.35, 0.06, C.maderaOsc);
      for (const s of [-1, 1]) a.con({ x: s * 0.8, y: 0.45, z: -0.2, rz: PI / 2 }, () => {
        a.cilindro(0, -0.06, 0, 0.45, 0.45, 0.12, 9, "#4A3426", "#6A4A30");
      });
      a.palo([0, 0.5, -1.1], [0, 0.35, -2.4], 0.05, C.maderaOsc);
      if (carga === "lona") {
        for (let i = 0; i < 4; i++) a.palo([-0.66, 0.9, -0.9 + i * 0.6], [0, 1.9, -0.9 + i * 0.6], 0.03, C.maderaOsc);
        a.losa([-0.75, 0.9, 1.1], [0, 1.95, 1.1], [0, 1.95, -1.1], [-0.75, 0.9, -1.1], 0.05, "#C8B48C", "#A8946C");
        a.losa([0, 1.95, 1.1], [0.75, 0.9, 1.1], [0.75, 0.9, -1.1], [0, 1.95, -1.1], 0.05, "#B8A47A", "#A8946C");
      } else if (carga === "troncos") for (let i = 0; i < 3; i++) a.con({ x: (i - 1) * 0.38, y: 0.86, z: 0, rx: PI / 2 }, () => a.cilindro(0, -1.2, 0, 0.18, 0.18, 2.4, 6, "#6A4A30", "#C89A68"));
      else if (carga) for (let i = 0; i < 3; i++) cajon(a, (i - 1) * 0.42, (i % 2) * 0.5 - 0.3, 0.55, 0.62, i * 0.3, carga);
    });
  }
  // el buey de las caravanas: caras planas, como los bichos de la arena
  function buey(a, x, z, ry = 0, color = "#6A4A32") {
    a.con({ x, z, ry }, () => {
      a.caja(0, 0.75, 0, 0.9, 0.8, 1.7, color);
      a.caja(0, 1.45, -0.4, 0.8, 0.2, 0.6, GEO.aclarar(color, -0.08)); // la giba
      a.caja(0, 0.95, -1.05, 0.55, 0.55, 0.55, GEO.aclarar(color, -0.05));
      a.caja(0, 0.82, -1.38, 0.4, 0.32, 0.18, "#C8A890");
      for (const s of [-1, 1]) {
        a.palo([s * 0.22, 1.42, -1.1], [s * 0.55, 1.6, -1.15], 0.05, "#E0D8C8", 4, 0.02);
        a.caja(s * 0.33, 1.25, -1.05, 0.18, 0.08, 0.12, GEO.aclarar(color, -0.15));
      }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.caja(sx * 0.3, 0, sz * 0.6, 0.2, 0.75, 0.22, GEO.aclarar(color, -0.12));
      a.palo([0, 1.05, 0.85], [0, 0.4, 1.0], 0.04, GEO.aclarar(color, -0.2));
    });
  }
  function gallina(a, x, z, ry = 0) {
    a.con({ x, z, ry }, () => {
      a.bola(0, 0.22, 0, 0.16, 0.13, 0.2, "#C8B8A0", 0, 0.1);
      a.bola(0, 0.36, -0.14, 0.08, 0.08, 0.08, "#C8B8A0", 0, 0.1);
      a.caja(0, 0.42, -0.15, 0.03, 0.05, 0.06, "#C8402D");
      a.caja(0, 0.34, -0.23, 0.03, 0.03, 0.05, "#E8B04A");
    });
  }
  // ---------- el mercado de los toldos ----------
  const MERCANCIA = {
    hongos: (a, x, y, z) => { for (let i = 0; i < 6; i++) { const xx = x - 0.5 + (i % 3) * 0.5, zz = z - 0.15 + Math.floor(i / 3) * 0.3; a.cilindro(xx, y, zz, 0.04, 0.04, 0.08, 5, "#E0D4C0"); a.cilindro(xx, y + 0.08, zz, 0.13, 0.02, 0.07, 7, i % 2 ? "#C8903A" : "#E8B04A"); } },
    pescado: (a, x, y, z) => { for (let i = 0; i < 5; i++) a.con({ x: x - 0.5 + i * 0.25, y: y + 0.04, z, ry: 0.2 * i }, () => { a.bola(0, 0, 0, 0.08, 0.04, 0.22, "#8A9AA0", 0, 0.1); a.caja(0, -0.02, 0.24, 0.12, 0.04, 0.06, "#6A7A80"); }); },
    pieles: (a, x, y, z) => { a.caja(x, y, z, 1.2, 0.08, 0.6, "#7A5A3A"); a.caja(x + 0.1, y + 0.08, z, 1.0, 0.06, 0.5, "#A88A6A"); a.caja(x - 0.1, y + 0.14, z, 0.9, 0.06, 0.45, "#5E4430"); },
    hierbas: (a, x, y, z) => { for (let i = 0; i < 5; i++) canasto(a, x - 0.5 + i * 0.25, z, ["#5E7A3A", "#7A8A4A", "#A8A060", "#6A5A8A", "#5E7A3A"][i], y); },
    ceramica: (a, x, y, z) => { for (let i = 0; i < 5; i++) a.cilindro(x - 0.5 + i * 0.25, y, z + (i % 2) * 0.15, 0.08, 0.11 + (i % 3) * 0.03, 0.2 + (i % 2) * 0.12, 7, ["#A0583A", "#8A4A32", "#B8704A"][i % 3]); },
    cuencos: (a, x, y, z) => { for (let i = 0; i < 6; i++) a.cilindro(x - 0.5 + (i % 3) * 0.45, y + Math.floor(i / 3) * 0.08, z - 0.1 + Math.floor(i / 3) * 0.2, 0.08, 0.18, 0.08, 8, "#9A7448"); },
    sogas: (a, x, y, z) => { for (let i = 0; i < 4; i++) a.con({ x: x - 0.45 + i * 0.3, y: y + 0.05, z, rx: PI / 2 }, () => a.cilindro(0, -0.05, 0, 0.13, 0.13, 0.1, 8, "#C8A86A", "#A88A50")); },
    obsidiana: (a, x, y, z) => { for (let i = 0; i < 5; i++) a.bola(x - 0.45 + i * 0.22, y + 0.06, z, 0.07, 0.09, 0.07, i % 2 ? "#1E1A22" : "#2E2830", 0, 0.35); a.caja(x, y, z + 0.25, 0.9, 0.06, 0.15, "#C8C0B0"); },
    hierro: (a, x, y, z) => { for (let i = 0; i < 6; i++) a.caja(x - 0.4 + (i % 3) * 0.3, y + Math.floor(i / 3) * 0.1, z, 0.26, 0.1, 0.14, "#6E6A64"); a.palo([x - 0.5, y + 0.05, z + 0.25], [x + 0.4, y + 0.05, z + 0.3], 0.03, "#8A6A48"); },
    hueso: (a, x, y, z) => { for (let i = 0; i < 4; i++) a.palo([x - 0.45 + i * 0.3, y + 0.04, z - 0.1], [x - 0.35 + i * 0.3, y + 0.25, z + 0.1], 0.04, "#E8E0CC", 4, 0.02); },
    sal: (a, x, y, z) => { for (let i = 0; i < 3; i++) { a.cilindro(x - 0.4 + i * 0.4, y, z, 0.16, 0.14, 0.26, 7, "#A8946C"); a.bola(x - 0.4 + i * 0.4, y + 0.26, z, 0.13, 0.06, 0.13, "#F2ECEC", 0, 0.1); } },
    panes: (a, x, y, z) => { for (let i = 0; i < 6; i++) a.bola(x - 0.5 + (i % 3) * 0.45, y + 0.06, z - 0.12 + Math.floor(i / 3) * 0.24, 0.16, 0.07, 0.11, "#C8904A", 0, 0.15); },
  };
  const MERC = Object.keys(MERCANCIA);
  function toldo(a, x, z, ry, color, mercancia, w = 2.6, d = 1.8) {
    a.con({ x, z, ry }, () => {
      // el mostrador de tablas
      a.caja(0, 0, d / 2 - 0.5, w - 0.2, 0.85, 0.7, "#5E4430");
      a.caja(0, 0.85, d / 2 - 0.5, w, 0.06, 0.8, C.maderaClara);
      // postes y lona a un agua (más alta atrás)
      for (const sx of [-1, 1]) {
        a.caja((sx * w) / 2, 0, d / 2 + 0.2, 0.1, 2.2, 0.1, C.maderaOsc);
        a.caja((sx * w) / 2, 0, -d / 2, 0.1, 2.6, 0.1, C.maderaOsc);
      }
      a.losa([-w / 2 - 0.15, 2.65, -d / 2 - 0.2], [w / 2 + 0.15, 2.65, -d / 2 - 0.2], [w / 2 + 0.15, 2.1, d / 2 + 0.55], [-w / 2 - 0.15, 2.1, d / 2 + 0.55].map((v) => v), 0.04, color, GEO.aclarar(color, -0.25));
      // el faldón con picos
      for (let i = 0; i < 5; i++) {
        const x0 = -w / 2 - 0.15 + (i * (w + 0.3)) / 5,
          x1 = x0 + (w + 0.3) / 5;
        a.tri([x0, 2.08, d / 2 + 0.56], [(x0 + x1) / 2, 1.82, d / 2 + 0.57], [x1, 2.08, d / 2 + 0.56], i % 2 ? GEO.aclarar(color, 0.12) : color);
      }
      if (MERCANCIA[mercancia]) MERCANCIA[mercancia](a, 0, 0.91, d / 2 - 0.5);
      // cajones y canastos atrás
      cajon(a, -w / 2 + 0.5, -d / 2 + 0.4, 0.7);
      canasto(a, w / 2 - 0.4, -d / 2 + 0.4, "#A8A060");
    });
  }
  // ---------- la plaza ----------
  function pozo(a, x, z) {
    for (let i = 0; i < 12; i++) {
      const an = (i / 12) * PI * 2;
      a.con({ x: x + Math.cos(an) * 1.05, z: z + Math.sin(an) * 1.05, ry: -an }, () => a.caja(0, 0, 0, 0.6, 0.85 + (i % 2) * 0.05, 0.42, GEO.aclarar(C.piedra, (i % 3) * 0.06 - 0.05)));
    }
    a.cilindro(x, 0.6, z, 0.85, 0.85, 0.05, 10, "#1E2A30");
    for (const s of [-1, 1]) a.caja(x + s * 1.2, 0, z, 0.16, 2.4, 0.16, C.maderaOsc);
    a.palo([x - 1.25, 2.1, z], [x + 1.25, 2.1, z], 0.06, C.maderaOsc);
    a.losa([x - 1.5, 2.45, z + 1.1], [x + 1.5, 2.45, z + 1.1], [x + 1.5, 3.0, z], [x - 1.5, 3.0, z], 0.08, "#4E545C", "#3A3A3A");
    a.losa([x - 1.5, 3.0, z], [x + 1.5, 3.0, z], [x + 1.5, 2.45, z - 1.1], [x - 1.5, 2.45, z - 1.1], 0.08, "#4A4E56", "#3A3A3A");
    a.caja(x, 1.3, z, 0.02, 0.8, 0.02, "#8A7A5A");
    a.cilindro(x, 1.0, z, 0.15, 0.18, 0.3, 7, "#6A4A30");
  }
  function campana(a, x, z, ry = 0) {
    a.con({ x, z, ry }, () => {
      for (const s of [-1, 1]) a.palo([s * 1.0, 0, 0], [s * 0.3, 3.6, 0], 0.12, C.maderaOsc);
      a.palo([-0.6, 3.4, 0], [0.6, 3.4, 0], 0.1, C.maderaOsc);
      a.cilindro(0, 2.55, 0, 0.42, 0.18, 0.75, 9, "#A88A3A", "#8A6A2A");
      a.cilindro(0, 3.28, 0, 0.12, 0.12, 0.14, 6, "#8A6A2A");
      a.palo([0.2, 3.3, 0], [0.8, 0.9, 0.1], 0.02, "#C8A86A");
      a.losa([-0.9, 4.0, 0.6], [0.9, 4.0, 0.6], [0.9, 4.4, 0], [-0.9, 4.4, 0], 0.06, "#4E545C");
      a.losa([-0.9, 4.4, 0], [0.9, 4.4, 0], [0.9, 4.0, -0.6], [-0.9, 4.0, -0.6], 0.06, "#4A4E56");
    });
  }
  function tablon(a, x, z, ry = 0) {
    a.con({ x, z, ry }, () => {
      for (const s of [-1, 1]) a.caja(s * 1.1, 0, 0, 0.16, 2.6, 0.16, C.maderaOsc);
      a.caja(0, 1.0, 0, 2.4, 1.3, 0.1, C.madera);
      for (let i = 0; i < 7; i++) a.caja(-0.85 + (i % 4) * 0.55 + (i > 3 ? 0.25 : 0), 1.15 + (i > 3 ? 0.6 : 0) - (i % 2) * 0.1, 0.07, 0.32, 0.4, 0.02, i % 3 ? "#E6DCC8" : "#D0C4A8");
      a.losa([-1.4, 2.7, 0.45], [1.4, 2.7, 0.45], [1.4, 2.9, -0.2], [-1.4, 2.9, -0.2], 0.06, "#4E545C");
    });
  }
  // los asientos del Ting: piedra con el símbolo de un oficio tallado en el respaldo
  const SIMBOLOS = ["hacha", "red", "hongo", "hoja", "balanza", "pluma", "martillo", "remo", "lanza", "aguja", "rueda", "arbol"];
  function asientoTing(a, x, z, ry, i) {
    a.con({ x, z, ry }, () => {
      a.caja(0, 0, 0, 1.1, 0.48, 0.8, GEO.aclarar(C.piedra, (i % 3) * 0.05 - 0.05));
      a.caja(0, 0, -0.42, 1.1, 1.35, 0.3, GEO.aclarar(C.piedra, (i % 4) * 0.04 - 0.06));
      const c = GEO.aclarar(C.piedra, -0.32);
      const s = SIMBOLOS[i % 12];
      if (s === "hacha" || s === "martillo") { a.caja(0, 0.75, -0.26, 0.06, 0.45, 0.02, c); a.caja(0.08, 1.0, -0.26, 0.22, 0.14, 0.02, c); }
      else if (s === "hongo") { a.caja(0, 0.75, -0.26, 0.06, 0.25, 0.02, c); a.caja(0, 1.0, -0.26, 0.34, 0.1, 0.02, c); }
      else if (s === "rueda" || s === "red") { for (let k = 0; k < 6; k++) a.con({ y: 0.95, z: -0.26, rz: (k * PI) / 3 }, () => a.caja(0, 0, 0, 0.04, 0.3, 0.02, c)); }
      else if (s === "arbol" || s === "hoja") { a.caja(0, 0.7, -0.26, 0.05, 0.5, 0.02, c); for (let k = 0; k < 3; k++) a.con({ y: 0.85 + k * 0.1, z: -0.26 }, () => { a.con({ rz: 0.8 }, () => a.caja(0.08, 0, 0, 0.18, 0.03, 0.02, c)); a.con({ rz: -0.8 }, () => a.caja(-0.08, 0, 0, 0.18, 0.03, 0.02, c)); }); }
      else { a.caja(0, 0.75, -0.26, 0.05, 0.45, 0.02, c); a.caja(0, 1.05, -0.26, 0.3, 0.04, 0.02, c); }
    });
  }
  // piedras de la cúpula: menhir alto con la runa azul encendida (o partida si está apagada)
  function menhir(a, b, x, z, ry, runa, fuerza, alto = 6.5) {
    a.con({ x, z, ry }, () => {
      const pts = [[-1.1, -0.55], [1.1, -0.6], [1.25, 0.5], [-1.2, 0.6]];
      const capas = 6;
      for (let i = 0; i < capas; i++) {
        const f0 = 1 - (i / capas) * 0.35,
          f1 = 1 - ((i + 1) / capas) * 0.35;
        const y0 = (i / capas) * alto,
          y1 = ((i + 1) / capas) * alto;
        for (let k = 0; k < 4; k++) {
          const p = pts[k],
            q = pts[(k + 1) % 4];
          a.quad([p[0] * f0, y0, p[1] * f0], [q[0] * f0, y0, q[1] * f0], [q[0] * f1, y1, q[1] * f1], [p[0] * f1, y1, p[1] * f1], GEO.aclarar(C.piedra, ((i + k) % 3) * 0.05 - 0.04));
        }
      }
      a.bola(0, alto, 0, 0.75, 0.5, 0.4, GEO.aclarar(C.piedra, 0.04), 0, 0.15);
      // musgo al pie
      a.bola(0, 0.1, 0, 1.4, 0.35, 0.9, C.musgo, 0, 0.25);
      if (fuerza > 0) {
        const col = fuerza > 0.5 ? C.runico : GEO.mezclar(C.runico, "#2F8FA0", 0.6);
        const tr = window.FUTHARK && FUTHARK.T[runa];
        // la runa de la piedra en el frente y atrás
        for (const lado of [1, -1])
          b.con({ y: alto * 0.42, z: lado * 0.62, ry: lado > 0 ? 0 : PI }, () => {
            if (tr) for (const s of tr) trazo(b, s, 1.5, col);
            else CASAS.runa(b, "algiz", 0, -0.75, 0.0, 1.5, col);
          });
      } else {
        // partida: una grieta oscura en diagonal
        a.palo([-0.6, alto * 0.3, 0.64], [0.5, alto * 0.7, 0.62], 0.05, "#2A2E2C", 4);
      }
    });
  }
  // los trazos de una runa de FUTHARK (x de -0.5 a 0.5, y de -1 a 0) en un tablero de alto h centrado en 0
  function trazo(b, s, h, col, grosor = 0.06) {
    const [x0, y0, x1, y1] = s;
    const ax = x0 * h,
      ay = (-y0 - 0.5) * h,
      bx = x1 * h,
      by = (-y1 - 0.5) * h;
    const dx = bx - ax,
      dy = by - ay,
      l = Math.hypot(dx, dy) || 1,
      nx = (-dy / l) * grosor,
      ny = (dx / l) * grosor;
    b.quad([ax - nx, ay - ny, 0], [bx - nx, by - ny, 0], [bx + nx, by + ny, 0], [ax + nx, ay + ny, 0], col);
  }
  // ---------- cercos, huertas, el campo ----------
  function cerca(a, x0, z0, x1, z1, alto = 1.0) {
    const l = Math.hypot(x1 - x0, z1 - z0),
      n = Math.max(1, Math.round(l / 1.6));
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n,
        z = z0 + ((z1 - z0) * i) / n;
      a.cilindro(x, 0, z, 0.07, 0.06, alto + 0.1, 5, C.maderaOsc);
    }
    a.palo([x0, alto * 0.55, z0], [x1, alto * 0.55, z1], 0.04, C.madera, 4);
    a.palo([x0, alto * 0.9, z0], [x1, alto * 0.9, z1], 0.04, C.madera, 4);
  }
  const CULTIVOS = ["repollo", "puerro", "nabo", "arveja", "calabaza"];
  function huerta(a, x, z, w, d, ry, sem) {
    const r = GEO.azar(sem);
    a.con({ x, z, ry }, () => {
      const filas = Math.max(2, Math.round(d / 0.9));
      for (let f = 0; f < filas; f++) {
        const zz = -d / 2 + 0.45 + f * 0.9,
          tipo = CULTIVOS[Math.floor(r() * CULTIVOS.length)];
        a.caja(0, 0, zz, w - 0.4, 0.14, 0.55, "#3E2E22");
        const n = Math.round((w - 0.6) / 0.45);
        for (let k = 0; k < n; k++) {
          const xx = -w / 2 + 0.5 + k * 0.45;
          if (tipo === "repollo") a.bola(xx, 0.25, zz, 0.2, 0.15, 0.2, r() < 0.5 ? "#6A8A44" : "#7A9A50", 0, 0.2);
          else if (tipo === "calabaza") { if (k % 2 === 0) a.bola(xx, 0.24, zz, 0.2, 0.15, 0.2, "#D0782A", 0, 0.2); a.bola(xx + 0.2, 0.2, zz, 0.18, 0.06, 0.18, "#4E6A32", 0, 0.3); }
          else if (tipo === "puerro") { a.cilindro(xx, 0.12, zz, 0.04, 0.03, 0.35, 4, "#C8D8A0"); a.cilindro(xx, 0.42, zz, 0.07, 0.0, 0.2, 4, "#4E6A32"); }
          else if (tipo === "nabo") { a.bola(xx, 0.18, zz, 0.08, 0.07, 0.08, "#C8A0B8", 0, 0.1); a.cilindro(xx, 0.22, zz, 0.12, 0, 0.22, 4, "#5E7A3A"); }
          else { a.palo([xx, 0.1, zz], [xx, 1.1, zz], 0.02, C.maderaOsc, 3); a.bola(xx, 0.6, zz, 0.15, 0.35, 0.15, "#5E7A3A", 0, 0.3); }
        }
      }
    });
    // el cerco alrededor
    const c = Math.cos(ry),
      s = Math.sin(ry),
      p = (dx, dz) => [x + dx * c + dz * s, z - dx * s + dz * c];
    const e = [p(-w / 2, -d / 2), p(w / 2, -d / 2), p(w / 2, d / 2), p(-w / 2, d / 2)];
    for (let i = 0; i < 4; i++) if (i !== 2) cerca(a, e[i][0], e[i][1], e[(i + 1) % 4][0], e[(i + 1) % 4][1], 0.8);
  }
  function munecoPaja(a, x, z, ry = 0) {
    a.con({ x, z, ry }, () => {
      a.cilindro(0, 0, 0, 0.08, 0.08, 1.9, 5, C.maderaOsc);
      a.palo([-0.6, 1.4, 0], [0.6, 1.4, 0], 0.06, C.maderaOsc);
      a.cilindro(0, 0.75, 0, 0.3, 0.26, 0.85, 7, C.paja);
      a.bola(0, 1.78, 0, 0.22, 0.24, 0.22, C.paja, 0, 0.15);
      a.caja(0, 1.15, 0.24, 0.42, 0.42, 0.04, "#8A3A2A");
    });
  }
  function estanteLanzas(a, x, z, ry = 0) {
    a.con({ x, z, ry }, () => {
      for (const s of [-1, 1]) a.caja(s * 0.9, 0, 0, 0.12, 1.4, 0.12, C.maderaOsc);
      a.caja(0, 1.2, 0, 1.9, 0.1, 0.18, C.madera);
      a.caja(0, 0.3, 0, 1.9, 0.1, 0.18, C.madera);
      for (let i = 0; i < 6; i++) {
        a.palo([-0.75 + i * 0.3, 0.1, 0.05], [-0.72 + i * 0.3, 2.3, -0.05], 0.025, "#7A5A3A", 4);
        a.cilindro(-0.72 + i * 0.3, 2.3, -0.05, 0.05, 0, 0.25, 4, "#B8B4AC");
      }
    });
  }
  // ---------- los oficios ----------
  // la chimenea cónica de piedra de la herrería (la de la imagen) con la forja abierta al pie
  function forja(a, b, x, z, ry = 0) {
    a.con({ x, z, ry }, () => {
      const capas = 18;
      for (let i = 0; i < capas; i++) {
        const r0 = 1.6 - i * 0.065,
          y = i * 0.55;
        for (let k = 0; k < 10; k++) {
          const an = (k / 10) * PI * 2 + (i % 2) * 0.3;
          a.con({ x: Math.cos(an) * r0, y, z: Math.sin(an) * r0, ry: -an }, () => a.caja(0, 0, 0, 1.0 - i * 0.03, 0.55, 0.45, GEO.aclarar(C.piedraOsc, ((i + k) % 4) * 0.05 - 0.06)));
        }
      }
      a.cilindro(0, capas * 0.55, 0, 0.6, 0.65, 0.3, 8, "#3A3A3A");
      // la boca de la forja, hacia el frente
      a.caja(0, 0, 1.55, 2.4, 1.0, 1.1, GEO.aclarar(C.piedraOsc, -0.05));
      a.caja(0, 1.0, 1.55, 2.5, 0.12, 1.2, "#4A4A48");
      b.bola(0, 1.12, 1.55, 0.7, 0.18, 0.4, "#FF8D3A", 0, 0.3);
      b.bola(0, 1.2, 1.55, 0.35, 0.22, 0.25, "#FFD98A", 0, 0.3);
      // el fuelle
      a.con({ x: 1.6, y: 0.9, z: 1.6 }, () => {
        a.caja(0, 0, 0, 0.6, 0.25, 0.9, "#5E3A26");
        a.palo([0, 0.25, 0.4], [0, 0.6, 0.9], 0.04, C.maderaOsc);
      });
    });
    return [x + 1.55 * Math.sin(ry), 1.4, z + 1.55 * Math.cos(ry)];
  }
  function yunque(a, x, z, ry = 0) {
    a.con({ x, z, ry }, () => {
      a.cilindro(0, 0, 0, 0.38, 0.34, 0.55, 7, "#5E4430", "#6A4A30");
      a.caja(0, 0.55, 0, 0.32, 0.22, 0.5, "#3A3A3C");
      a.caja(0, 0.77, 0, 0.42, 0.14, 0.9, "#46464A");
      a.cilindro(0, 0.77, -0.55, 0.12, 0, 0.18, 4, "#46464A");
    });
  }
  function armero(a, x, z, ry = 0, runica, b) {
    a.con({ x, z, ry }, () => {
      a.caja(0, 0, 0, 2.2, 0.12, 0.5, C.maderaOsc);
      for (const s of [-1, 1]) a.caja(s * 1.05, 0, 0, 0.1, 1.9, 0.4, C.maderaOsc);
      a.caja(0, 1.8, 0, 2.2, 0.1, 0.4, C.maderaOsc);
      for (let i = 0; i < 5; i++) {
        const xx = -0.8 + i * 0.4;
        a.caja(xx, 0.2, 0, 0.06, 1.25, 0.03, "#B8B4AC");
        a.caja(xx, 1.0, 0, 0.26, 0.05, 0.06, "#6E5A3A");
        a.caja(xx, 1.05, 0, 0.05, 0.3, 0.05, "#3A2A1E");
      }
      if (runica) {
        // la espada rúnica bajo llave: caja con vidrio y la línea azul (apagada hasta desbloquearla)
        a.caja(0, 2.0, 0.05, 1.5, 0.08, 0.35, C.madera);
        a.caja(0, 2.0, 0.23, 1.5, 0.45, 0.02, "#5A6A70");
        a.caja(0, 2.15, 0.12, 1.2, 0.05, 0.08, "#C8C8D0");
        a.caja(-0.62, 2.15, 0.12, 0.08, 0.18, 0.1, "#8A6A2A");
        a.caja(0.7, 2.05, 0.25, 0.1, 0.12, 0.04, "#8A7A5A");
        if (b) b.caja(0.05, 2.18, 0.165, 1.0, 0.015, 0.01, GEO.mezclar(C.runico, "#1E2A30", 0.6));
      }
    });
  }
  function grua(a, x, z, ry = 0) {
    a.con({ x, z, ry }, () => {
      a.palo([-1.4, 0, -0.8], [0, 6.2, 0], 0.16, C.madera);
      a.palo([1.4, 0, -0.8], [0, 6.2, 0], 0.16, C.madera);
      a.palo([0, 0, 1.6], [0, 6.2, 0], 0.16, C.madera);
      a.palo([0, 6.0, 0], [0, 5.6, 3.4], 0.12, C.madera);
      a.palo([0, 5.55, 3.3], [0, 1.4, 3.3], 0.02, "#C8A86A", 4);
      a.caja(0, 0.9, 3.3, 0.5, 0.5, 0.5, C.hierro);
      a.con({ y: 1.0, z: 0.5, rz: PI / 2 }, () => a.cilindro(0, -0.6, 0, 0.3, 0.3, 1.2, 8, "#6A4A30"));
    });
  }
  function troncosApilados(a, x, z, ry = 0, n = 4, largo = 5) {
    a.con({ x, z, ry }, () => {
      for (let i = 0; i < n; i++) for (let k = 0; k < n + 1 - i; k++) a.con({ x: (k - (n - i) / 2) * 0.62, y: 0.3 + i * 0.53, z: 0, rx: PI / 2 }, () => a.cilindro(0, -largo / 2, 0, 0.3, 0.3, largo, 7, "#6A4A30", "#C89A68"));
    });
  }
  function caballete(a, x, z, ry = 0, tronco) {
    a.con({ x, z, ry }, () => {
      for (const s of [-1, 1]) {
        a.palo([s * 0.8, 0, -0.35], [s * 0.8, 0.85, 0.05], 0.06, C.maderaOsc);
        a.palo([s * 0.8, 0, 0.35], [s * 0.8, 0.85, -0.05], 0.06, C.maderaOsc);
      }
      a.palo([-1.0, 0.85, 0], [1.0, 0.85, 0], 0.07, C.madera);
      if (tronco) a.con({ y: 1.05, rz: PI / 2 }, () => a.cilindro(0, -1.5, 0, 0.22, 0.22, 3.0, 7, "#7A5A3A", "#C89A68"));
    });
  }
  function tornoCordelero(a, x, z, ry = 0, largo = 14) {
    a.con({ x, z, ry }, () => {
      a.caja(0, 0, 0, 0.9, 1.2, 0.5, C.madera);
      a.con({ y: 1.0, z: 0.3, rx: PI / 2 }, () => a.cilindro(0, 0, 0, 0.45, 0.45, 0.08, 8, "#6A4A30"));
      for (let i = 1; i <= 4; i++) {
        const zz = -i * (largo / 4);
        a.caja(0, 0, zz, 0.12, 1.1, 0.12, C.maderaOsc);
        a.caja(0, 1.0, zz, 0.9, 0.08, 0.1, C.maderaOsc);
      }
      for (let k = -1; k <= 1; k++) a.palo([k * 0.3, 1.0, 0], [k * 0.3, 1.0, -largo], 0.025, "#C8A86A", 4);
    });
  }
  function cubaCurtiembre(a, x, z, color) {
    a.cilindro(x, 0, z, 0.9, 0.95, 0.9, 9, "#5E4430");
    a.cilindro(x, 0.8, z, 0.82, 0.82, 0.04, 9, color || "#5A4A2A");
  }
  function bastidorCuero(a, x, z, ry = 0) {
    a.con({ x, z, ry }, () => {
      for (const s of [-1, 1]) a.palo([s * 1.0, 0, 0], [s * 0.9, 2.2, 0], 0.06, C.maderaOsc);
      a.palo([-1.0, 2.0, 0], [1.0, 2.0, 0], 0.05, C.maderaOsc);
      a.palo([-1.0, 0.4, 0], [1.0, 0.4, 0], 0.05, C.maderaOsc);
      a.quad([-0.75, 0.55, 0.02], [0.75, 0.55, 0.02], [0.85, 1.9, 0.02], [-0.85, 1.9, 0.02], "#B88A5A");
      a.quad([0.75, 0.55, -0.02], [-0.75, 0.55, -0.02], [-0.85, 1.9, -0.02], [0.85, 1.9, -0.02], "#A87A4A");
    });
  }
  function secadero(a, x, z, ry = 0) {
    a.con({ x, z, ry }, () => {
      for (const s of [-1, 1]) a.palo([s * 1.3, 0, 0], [s * 1.3, 1.9, 0], 0.06, C.maderaOsc);
      a.palo([-1.4, 1.8, 0], [1.4, 1.8, 0], 0.04, C.madera);
      for (let i = 0; i < 7; i++) a.con({ x: -1.05 + i * 0.35, y: 1.45, z: 0 }, () => a.bola(0, 0, 0, 0.06, 0.25, 0.03, i % 2 ? "#8A9AA0" : "#A0A890", 0, 0.1));
    });
  }
  function bote(a, x, z, ry = 0, largo = 4.2) {
    a.con({ x, y: -0.1, z, ry }, () => {
      const w = 0.7;
      const pts = (y, f) => [[0, y, -largo / 2], [w * f, y, -largo / 4], [w * f, y, largo / 4], [0, y, largo / 2], [-w * f, y, largo / 4], [-w * f, y, -largo / 4]];
      const a0 = pts(0, 0.6),
        a1 = pts(0.55, 1);
      for (let i = 0; i < 6; i++) {
        const j = (i + 1) % 6;
        a.quad(a0[i], a0[j], a1[j], a1[i], i % 2 ? "#5E4430" : "#6A4A30");
        a.quad(a1[i], a1[j], a0[j], a0[i], "#4A3426");
      }
      a.caja(0, 0.3, 0, 1.2, 0.06, 0.3, C.madera);
      a.palo([-0.5, 0.45, 0.3], [-1.5, 0.1, 1.3], 0.03, C.madera, 4);
    });
  }
  function balsa(a, x, z, ry = 0) {
    a.con({ x, y: -0.15, z, ry }, () => {
      for (let i = 0; i < 7; i++) a.con({ x: (i - 3) * 0.42, y: 0.15, rx: PI / 2 }, () => a.cilindro(0, -2, 0, 0.2, 0.2, 4, 6, "#7A5A3A", "#C89A68"));
      a.palo([-1.5, 0.4, 1.2], [1.5, 0.4, 1.2], 0.06, C.maderaOsc);
      a.palo([-1.5, 0.4, -1.2], [1.5, 0.4, -1.2], 0.06, C.maderaOsc);
    });
  }
  // el estandarte del Ciervo: verde oscuro con la cornamenta blanco hueso (decisión del 22/10/2026)
  function estandarte(a, x, z, alto = 5, ry = 0) {
    a.cilindro(x, 0, z, 0.08, 0.06, alto, 5, C.maderaOsc);
    a.con({ x, y: alto - 0.3, z, ry }, () => {
      a.palo([-0.1, 0, 0], [1.0, 0, 0], 0.035, C.maderaOsc, 4);
      a.quad([0, 0, 0.02], [0, -2.0, 0.02], [0.45, -1.7, 0.02], [0.9, -2.0, 0.02], "#2C4226");
      a.tri([0, 0, 0.02], [0.9, -2.0, 0.02], [0.9, 0, 0.02], "#2C4226");
      a.quad([0.9, -2.0, -0.02], [0.45, -1.7, -0.02], [0, -2.0, -0.02], [0, 0, -0.02], "#263A20");
      a.tri([0.9, 0, -0.02], [0.9, -2.0, -0.02], [0, 0, -0.02], "#263A20");
      // la cornamenta
      const k = "#E8E0CC";
      for (const s of [-1, 1]) {
        a.palo([0.45, -1.15, 0.035], [0.45 + s * 0.25, -0.45, 0.035], 0.025, k, 3);
        a.palo([0.45 + s * 0.12, -0.8, 0.035], [0.45 + s * 0.32, -0.75, 0.035], 0.02, k, 3);
        a.palo([0.45 + s * 0.2, -0.6, 0.035], [0.45 + s * 0.38, -0.52, 0.035], 0.02, k, 3);
      }
      a.caja(0.45, -1.35, 0.035, 0.1, 0.25, 0.02, k);
    });
  }
  // ---------- la naturaleza ----------
  function pino(a, x, z, s = 1, sem = 0) {
    const r = (sem * 0.618) % 1;
    a.cilindro(x, 0, z, 0.22 * s, 0.14 * s, 1.6 * s, 5, "#3A2A1E");
    const pisos = 4;
    for (let i = 0; i < pisos; i++) {
      const y = (1.0 + i * 1.5) * s,
        rr = (2.0 - i * 0.42) * s;
      a.cilindro(x, y, z, rr, 0, 2.3 * s, 6 + (i % 2), GEO.aclarar(i % 2 ? C.follaje : C.follaje2, r * 0.1 - 0.05 - i * 0.02), C.follaje, false);
    }
  }
  function abedul(a, x, z, s = 1) {
    a.cilindro(x, 0, z, 0.14 * s, 0.1 * s, 4.2 * s, 5, "#D8D2C4");
    for (let i = 0; i < 3; i++) a.caja(x, (0.8 + i * 1.1) * s, z + 0.12 * s, 0.1 * s, 0.06 * s, 0.03, "#2A2420");
    a.bola(x, 4.4 * s, z, 1.3 * s, 1.6 * s, 1.3 * s, "#6A7A3E", 0, 0.25);
    a.bola(x + 0.5 * s, 3.6 * s, z + 0.3 * s, 0.9 * s, 1.0 * s, 0.9 * s, "#74843E", 0, 0.25);
  }
  function arbusto(a, x, z, s = 1, color) {
    a.bola(x, 0.4 * s, z, 0.8 * s, 0.6 * s, 0.8 * s, color || "#3E5A34", 0, 0.3);
  }
  function roca(a, x, z, s = 1, color) {
    a.bola(x, 0.15 * s, z, 0.9 * s, 0.55 * s, 0.75 * s, color || C.piedra, 0, 0.3);
  }
  function pasto(a, x, z, s = 1) {
    for (let i = 0; i < 4; i++) a.con({ x: x + Math.cos(i * 2.3) * 0.15 * s, z: z + Math.sin(i * 2.3) * 0.15 * s, ry: i }, () => a.cilindro(0, 0, 0, 0.08 * s, 0, (0.4 + (i % 2) * 0.2) * s, 3, i % 2 ? "#5E6A32" : "#6E7A3A"));
  }
  function flores(a, x, z) {
    for (let i = 0; i < 5; i++) a.bola(x + Math.cos(i * 1.3) * 0.3, 0.12, z + Math.sin(i * 1.3) * 0.3, 0.06, 0.05, 0.06, ["#C86A4A", "#E8D8A0", "#9A7AB8", "#E8B04A"][i % 4], 0, 0.1);
  }
  return {
    C, MERC, SIMBOLOS, farol, antorcha, barril, cajon, canasto, banco, mesa, lena, carro, buey, gallina, toldo, pozo, campana, tablon,
    asientoTing, menhir, trazo, cerca, huerta, munecoPaja, estanteLanzas, forja, yunque, armero, grua, troncosApilados, caballete,
    tornoCordelero, cubaCurtiembre, bastidorCuero, secadero, bote, balsa, estandarte, pino, abedul, arbusto, roca, pasto, flores,
  };
})();
