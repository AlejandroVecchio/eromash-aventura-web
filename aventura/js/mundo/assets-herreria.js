// ---------- lo de adentro de la herrería de Ása (assets armados con caras) ----------
// La herrería (motor/herreria.js) se arma con estas piezas, todas en volumen para verse desde cualquier ángulo: la forja
// de piedra con su campana y la chimenea, el fuelle de cuero que se infla, la pila de templar, la muela de Geir, la pared
// de las herramientas, el armero de lo terminado, el banco de lo que está a medio hacer, el montón de carbón de haya y
// Brasa, la gata que duerme en las piedras tibias. Medidas de los interiores: la gente mide unos 230 (GENTE a 2,75).
(function () {
  "use strict";
  const { P, E, R, L, alfa, azar } = DIB;
  const MC = ["#3A1A10", "#5A2A16", "#7A3E20"],
    PI = ["#3E3842", "#4E4852", "#6A646C"],
    PIO = ["#2E2A32", "#3E3A42", "#56525A"],
    HI = ["#2A2428", "#3A3438", "#6E6A6E"],
    ACERO = ["#5A5E62", "#8A8E92", "#B8BCC0"],
    CUERO = ["#4A3020", "#6A4A2E", "#8A6440"],
    CARBON = ["#141010", "#221C1C", "#34302E"],
    BRASA = "#FF8D71",
    ORO = "#FFD98A";
  const calidad = () => (window.CALIDAD ? CALIDAD.nivel : "alta");

  // ---------- La forja de Ása ----------
  // El hogar de piedra a la altura de la cintura con la cama de carbón encendida, la campana de piedra y hierro que junta
  // el humo y la chimenea que sube hasta el techo. o.fuego (0 a 1,5): cuánto arde (el fuelle lo sube); o.chimenea: alto.
  function forjaGrande(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      fuego = o.fuego == null ? 1 : o.fuego,
      alta = calidad() !== "baja",
      zc = o.chimenea || 560;
    VOL.sombra(c, pr, 0, 10, 220, 140, 0.4);
    S.poner(0, 0, () => {
      // el hogar: piedras grandes con juntas, una boca para el cenicero adelante
      VOL.caja(c, pr, -190, -120, 0, 190, 120, 110, PI, {
        frente: (cc, l, h) => {
          for (let k = 0; k < 3; k++) for (let i = 0; i < 6; i++) R(cc, i * (l / 6) + (k % 2) * 20 + 3, -h + k * (h / 3) + 3, l / 6 - 6, h / 3 - 6, k === 1 && i % 2 ? "#5A545E" : "#4E4852");
          R(cc, l / 2 - 50, -50, 100, 50, "#120A08");
          alfa(cc, 0.5 + 0.3 * fuego, () => R(cc, l / 2 - 40, -26, 80, 26, "#5E130D"));
        },
        tapa: "#3E3842",
      });
      // la cama de carbón y las brasas
      VOL.caja(c, pr, -150, -90, 110, 150, 90, 122, CARBON, { tapa: "#1A1212" });
      VOL.elipse(c, pr, 0, 0, 123, 120, 64, "#5E130D");
      VOL.elipse(c, pr, 0, 0, 124, 80 + 20 * fuego, 40 + 10 * fuego, BRASA);
      VOL.elipse(c, pr, 0, 0, 125, 40 + 16 * fuego, 20 + 8 * fuego, ORO);
      if (alta) VOL.halo(c, pr, 0, 0, 150, 160 + 90 * fuego, BRASA, 0.35 + 0.25 * fuego);
      // las llamitas
      const q = pr(0, 0, 124),
        s = pr.s;
      for (let k = 0; k < 6; k++) {
        const v = Math.sin(t * 9 + k * 2.3) * 8 * s,
          fx = q[0] + (-70 + k * 28) * s,
          h = (26 + (k % 3) * 10) * (0.6 + 0.5 * fuego) * s;
        P(c, [fx - 10 * s, q[1], fx + 10 * s, q[1], fx + v * 0.4, q[1] - h - v], k % 2 ? BRASA : ORO);
      }
      // la campana: cuatro patas de hierro y la pirámide de piedra que se angosta en la chimenea
      [[-180, -110], [180, -110], [-180, 110], [180, 110]].forEach(([u, w]) => VOL.palo(c, pr, u, w, 110, u * 0.95, w * 0.95, 330, 8, "#2A2428"));
      VOL.caja(c, pr, -200, -130, 330, 200, 130, 352, HI);
      const base = [[-200, -130], [200, -130], [200, 130], [-200, 130]],
        arriba = [[-70, -60], [70, -60], [70, 60], [-70, 60]];
      // los cuatro faldones de la campana, de atrás para adelante
      const faldon = (a, b) => [[a[0], a[1], 352], [b[0], b[1], 352], [arriba[base.indexOf(b)][0], arriba[base.indexOf(b)][1], 470], [arriba[base.indexOf(a)][0], arriba[base.indexOf(a)][1], 470]];
      const caras = [faldon(base[1], base[0]), faldon(base[2], base[1]), faldon(base[3], base[2]), faldon(base[0], base[3])];
      caras.sort((p, q2) => pr.hondo(p[0][0] + p[1][0], p[0][1] + p[1][1]) - pr.hondo(q2[0][0] + q2[1][0], q2[0][1] + q2[1][1]));
      caras.forEach((p) => VOL.cara(c, pr, p, PIO));
      // la chimenea hasta el techo, con la runa Kenaz tallada
      VOL.caja(c, pr, -70, -60, 470, 70, 60, zc, PIO, {
        frente: (cc, l, h) => {
          for (let k = 0; k < h; k += 40) R(cc, 0, -k - 3, l, 3, "#26222A");
          if (window.FUTHARK) FUTHARK.dibujar(cc, "kenaz", l / 2, -30, 36, BRASA, 4);
        },
        sinTapa: true,
      });
    });
    S.dibujar();
  }

  // ---------- El fuelle ----------
  // Dos tablas con el cuero en el medio que se infla y se desinfla (o.sopla: 0 a 1, cuánto está apretado), la boquilla de
  // hierro hacia la forja (hacia +u) y la palanca larga con su contrapeso de piedra.
  function fuelle(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      sop = o.sopla || 0,
      abre = 70 - 46 * sop;
    VOL.sombra(c, pr, 0, 0, 170, 70, 0.4);
    // el caballete
    S.poner(-40, 0, () => {
      [-120, 60].forEach((u) => [-40, 40].forEach((w) => VOL.cubo(c, pr, u, w, 18, 18, 70, MC)));
      VOL.caja(c, pr, -130, -50, 66, 70, 50, 80, MC);
    });
    S.poner(0, 1, () => {
      // la tabla de abajo, el cuero y la de arriba
      VOL.prisma(c, pr, [[-130, -48], [60, -30], [60, 30], [-130, 48]], 80, 92, MC);
      VOL.prisma(c, pr, [[-122, -44], [56, -24], [56, 24], [-122, 44]], 92, 92 + abre, CUERO, {
        pared: (cc, l, h) => {
          for (let k = 1; k < 4; k++) R(cc, 0, -h * (k / 4), l, 2, "#3A2418");
        },
        tapa: "#6A4A2E",
      });
      VOL.prisma(c, pr, [[-130, -48], [60, -30], [60, 30], [-130, 48]], 92 + abre, 104 + abre, MC);
      // la boquilla
      VOL.palo(c, pr, 60, 0, 92, 150, 0, 86, 14, "#3A3438");
      // la palanca y la piedra del contrapeso
      VOL.palo(c, pr, -40, 0, 104 + abre, -40, 0, 210 + abre * 0.6, 7, "#2A2428");
      VOL.palo(c, pr, -40, 0, 210 + abre * 0.6, -200, 0, 190 + abre * 1.2, 9, "#5A2A16");
      VOL.cubo(c, pr, -200, 0, 34, 30, 30, PI, null, 170 + abre * 1.2);
    });
    S.dibujar();
  }

  // ---------- La pila de templar ----------
  // Un tronco de roble ahuecado con aros de hierro, lleno de agua negra; adentro asoma una tenaza.
  function pilaTemplar(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr);
    VOL.sombra(c, pr, 0, 0, 150, 70, 0.4);
    S.poner(0, 0, () => {
      VOL.caja(c, pr, -140, -58, 0, 140, 58, 96, MC, {
        frente: (cc, l, h) => [30, l - 40].forEach((u) => R(cc, u, -h, 12, h, "#2A2428")),
        tapa: "#3A1A10",
      });
      VOL.caja(c, pr, -124, -42, 70, 124, 42, 97, ["#0E1418", "#14202A", "#1E3040"], { tapa: "#1A2A36" });
      const ola = Math.sin(t * 1.4) * 4;
      VOL.elipse(c, pr, -40 + ola, 0, 98, 30, 10, "#2A4258");
      VOL.palo(c, pr, 60, -10, 98, 130, -20, 190, 6, "#3A3438");
      VOL.palo(c, pr, 74, 8, 98, 138, -6, 186, 6, "#3A3438");
    });
    S.dibujar();
  }

  // ---------- La muela de afilar ----------
  // La piedra redonda en su caballete con la manivela (o.gira: cuánto giró) y el balde de agua abajo.
  function muelaAfilar(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      g = o.gira || 0;
    VOL.sombra(c, pr, 0, 0, 120, 60, 0.4);
    S.poner(0, -30, () => [-70, 70].forEach((u) => VOL.palo(c, pr, u, -30, 0, u, 0, 150, 12, "#5A2A16")));
    S.poner(0, 30, () => [-70, 70].forEach((u) => VOL.palo(c, pr, u, 30, 0, u, 0, 150, 12, "#5A2A16")));
    S.poner(0, 0, () => {
      VOL.cilindro(c, pr, 0, 0, 40, 0, 40, ["#3A2418", "#5A3E22", "#7A5634"], { n: 8, tapa: "#1E3040" });
      // la piedra: un rollo grueso que gira (las vetas se corren)
      VOL.rollo(c, pr, -24, 24, 0, 150, 78, ["#6E6A64", "#8A8680", "#A8A49C"], { n: 12 });
      // la veta clara que da vueltas con la piedra
      VOL.palo(c, pr, 25, Math.cos(g) * 60, 150 + Math.sin(g) * 60, 25, Math.cos(g) * 76, 150 + Math.sin(g) * 76, 5, "#C8C4BC");
      VOL.palo(c, pr, -70, 0, 150, 70, 0, 150, 8, "#2A2428");
      const a = g * 1.0;
      VOL.palo(c, pr, 70, 0, 150, 96, Math.sin(a) * 40, 150 + Math.cos(a) * 40, 6, "#2A2428");
      VOL.palo(c, pr, 96, Math.sin(a) * 40, 150 + Math.cos(a) * 40, 120, Math.sin(a) * 40, 150 + Math.cos(a) * 40, 9, "#7A3E20");
    });
    S.dibujar();
  }

  // ---------- La pared de las herramientas ----------
  // Una tabla colgada con clavos: tenazas de todos los tamaños, martillos, una lima y un punzón (va contra la pared, su
  // frente hacia +w). o.z: a qué altura cuelga.
  function panopliaHerramientas(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      z0 = o.z || 180;
    VOL.caja(c, pr, -220, -10, z0, 220, 6, z0 + 230, MC, {
      frente: (cc, l, h) => {
        for (let k = 0; k < 5; k++) R(cc, 0, -h + k * (h / 5), l, 3, "#2A1208");
        // tenazas: dos brazos largos que se cruzan
        for (let i = 0; i < 4; i++) {
          const x0 = 40 + i * 44,
            largo = 120 + i * 14;
          L(cc, x0, -h + 30, x0 + 10, -h + 30 + largo, "#2A2428", 5);
          L(cc, x0 + 16, -h + 30, x0 + 6, -h + 30 + largo, "#3A3438", 5);
          E(cc, x0 + 8, -h + 30 + largo * 0.25, 4, 4, "#6E6A6E");
        }
        // martillos colgados del mango
        [250, 300, 350].forEach((x0, i) => {
          L(cc, x0, -h + 40, x0, -h + 170 - i * 12, "#7A3E20", 6);
          R(cc, x0 - 22 + i * 3, -h + 160 - i * 12, 44 - i * 6, 26 - i * 3, i === 1 ? "#5A5E62" : "#3A3438");
        });
        // la lima y el punzón
        L(cc, 400, -h + 40, 400, -h + 180, "#8A8E92", 4);
        L(cc, 420, -h + 50, 420, -h + 150, "#B8BCC0", 3);
        for (let i = 0; i < 9; i++) E(cc, 30 + i * 48, -h + 22, 3, 3, "#C9A45A");
      },
    });
  }

  // ---------- El armero de lo terminado ----------
  // Un bastidor con espadas paradas, dos hachas colgadas, puntas de lanza y un escudo con la cornamenta de Eikholt.
  function armeroForja(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr);
    VOL.sombra(c, pr, 0, 0, 180, 50, 0.4);
    S.poner(0, -20, () => {
      [-170, 170].forEach((u) => VOL.cubo(c, pr, u, -20, 16, 16, 300, MC));
      VOL.caja(c, pr, -178, -28, 280, 178, -12, 296, MC);
      VOL.caja(c, pr, -178, -10, 0, 178, 30, 30, MC);
      VOL.caja(c, pr, -178, -28, 120, 178, -18, 134, MC);
    });
    S.poner(0, 0, () => {
      // las espadas, paradas con la punta para arriba
      for (let i = 0; i < 5; i++) {
        const u = -140 + i * 34;
        VOL.palo(c, pr, u, 4, 30, u, 0, 90, 9, "#3A2418");
        VOL.palo(c, pr, u - 14, 2, 90, u + 14, 2, 90, 6, "#C9A45A");
        VOL.palo(c, pr, u, 0, 92, u, -6, 250, 8, i % 2 ? "#B8BCC0" : "#8A8E92");
      }
      // dos hachas colgadas
      [60, 120].forEach((u, i) => {
        VOL.palo(c, pr, u, -10, 270, u, -6, 150, 7, "#7A3E20");
        VOL.prisma(c, pr, [[u, -10], [u + 40, -10], [u + 46, -4], [u, -4]], 220 - i * 10, 262 - i * 10, ACERO);
      });
    });
    // el escudo con la cornamenta, apoyado adelante
    S.poner(150, 20, () => {
      VOL.cilindro(c, pr, 150, 26, 66, 0, 10, ["#5E130D", "#9C2315", "#C8402D"], { n: 12, rw: 8 });
      VOL.plano(c, pr, 104, 196, 35, 18, 114, null, (cc, l, h) => DIB.insignia(cc, (u, v) => [l / 2 + u * l * 0.8, -h + 10 + v * (h - 20)], "#F2ECEC"), null);
    });
    S.dibujar();
  }

  // ---------- El banco de lo que está a medio hacer ----------
  // La mesa gruesa con el tornillo de banco, un aro de casco, una hebilla, láminas de escamas cortadas una por una y la
  // pechera de escamas que espera (cuando Góinn esté vencido, o.pechera: la que Ása termina).
  function bancoForja(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      r = azar(17);
    VOL.sombra(c, pr, 0, 0, 220, 80, 0.4);
    S.poner(0, 0, () => {
      [[-180, -50], [180, -50], [-180, 50], [180, 50]].forEach(([u, w]) => VOL.cubo(c, pr, u, w, 22, 22, 104, MC));
      VOL.caja(c, pr, -210, -70, 104, 210, 70, 128, MC, { tapa: "#6A3A1E" });
      // el tornillo de banco en la punta
      VOL.cubo(c, pr, 170, 50, 44, 40, 40, HI, null, 128);
      VOL.palo(c, pr, 150, 74, 150, 196, 74, 150, 5, "#3A3438");
      // las escamas cortadas, en filas
      for (let i = 0; i < 14; i++) {
        const u = -170 + (i % 7) * 26 + r() * 4,
          w = -40 + Math.floor(i / 7) * 30;
        VOL.cubo(c, pr, u, w, 20, 22, 3, ACERO, null, 128);
      }
      // el aro del casco y la hebilla
      VOL.cilindro(c, pr, 20, 20, 44, 128, 136, HI, { n: 12, sinTapa: true });
      VOL.cubo(c, pr, 90, -30, 30, 20, 4, ["#8A6A2A", "#C9A45A", "#FFD98A"], null, 128);
      // la pechera (de escamas cuando se la termina)
      if (o.pechera) VOL.prisma(c, pr, [[-40, -50], [60, -50], [70, -20], [-50, -20]], 128, 146, ["#4A78D0", "#6A90D8", "#8AA8E0"]);
    });
    S.dibujar();
  }

  // ---------- El montón de carbón ----------
  // Carbón de haya amontonado contra la esquina, con la pala clavada y dos bolsas abiertas.
  function montonCarbon(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      r = azar(9);
    VOL.sombra(c, pr, 0, 0, 170, 110, 0.45);
    S.poner(0, 0, () => {
      VOL.piramide(c, pr, VOL.redonda ? VOL.redonda(0, 0, 150, 9, 0.2, 100) : [[-150, -100], [150, -100], [150, 100], [-150, 100]], 0, 10, -10, 120, CARBON);
      for (let k = 0; k < 10; k++) VOL.cubo(c, pr, -110 + r() * 220, -60 + r() * 140, 16 + r() * 10, 14 + r() * 8, 12, CARBON, null, 0);
      VOL.palo(c, pr, 40, 10, 60, 90, 30, 240, 7, "#7A3E20");
      VOL.prisma(c, pr, [[24, 0], [56, 0], [52, 22], [28, 22]], 30, 70, HI);
    });
    S.poner(150, 60, () => {
      VOL.cilindro(c, pr, 150, 60, 44, 0, 90, ["#4A3E2A", "#6A5A3E", "#8A7A54"], { n: 8, tapa: "#141010" });
      VOL.cilindro(c, pr, 210, 10, 38, 0, 76, ["#4A3E2A", "#6A5A3E", "#8A7A54"], { n: 8, tapa: "#141010" });
    });
    S.dibujar();
  }

  // ---------- Brasa, la gata de la forja ----------
  // Gata color hollín con las patas y la punta de la cola claras, enroscada (o.duerme) o sentada mirando; respira.
  function gataForja(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      res = Math.sin(t * 1.8) * 2,
      G = ["#1E1A1A", "#2E2828", "#4A4242"],
      C = ["#8A7A6A", "#B8A890", "#D8C8B0"];
    VOL.sombra(c, pr, 0, 0, 40, 26, 0.4);
    if (o.duerme !== false) {
      S.poner(0, 0, () => {
        VOL.cilindro(c, pr, 0, 0, 34, 0, 20 + res, G, { n: 9, rw: 24, tapa: "#3A3434" });
        // la cola enroscada adelante, con la punta clara
        VOL.palo(c, pr, 30, 8, 8, 0, 26, 10, 9, "#2E2828");
        VOL.palo(c, pr, 0, 26, 10, -22, 20, 10, 9, "#B8A890");
        // la cabeza apoyada y las orejas
        VOL.cubo(c, pr, -22, -4, 24, 22, 18, G, null, 12);
        VOL.piramide(c, pr, [[-32, -10], [-26, -10], [-26, -4]], 30, -29, -7, 42, G);
        VOL.piramide(c, pr, [[-18, -10], [-12, -10], [-12, -4]], 30, -15, -7, 42, G);
      });
      S.dibujar();
      return;
    }
    S.poner(0, 0, () => {
      VOL.cilindro(c, pr, 0, 0, 22, 0, 40, G, { n: 8, rw: 16 });
      [-8, 8].forEach((u) => VOL.cubo(c, pr, u, 12, 8, 8, 10, C));
      VOL.cubo(c, pr, 0, 4, 26, 22, 22, G, null, 40 + res * 0.5);
      VOL.piramide(c, pr, [[-11, 0], [-5, 0], [-5, 6]], 62, -8, 3, 76, G);
      VOL.piramide(c, pr, [[5, 0], [11, 0], [11, 6]], 62, 8, 3, 76, G);
      const ojo = pr(0, 16, 52);
      E(c, ojo[0] - 5 * pr.s, ojo[1], 2.2 * pr.s, 2.2 * pr.s, ORO);
      E(c, ojo[0] + 5 * pr.s, ojo[1], 2.2 * pr.s, 2.2 * pr.s, ORO);
      VOL.palo(c, pr, 18, -10, 6, 34, 10 + Math.sin(t * 2) * 6, 4, 6, "#2E2828");
    });
    S.dibujar();
  }

  Object.assign(ASSETS.LISTA, {
    forjaGrande: { f: forjaGrande, vol: true, alto: 600, choque: null, grupo: "herreria" },
    fuelle: { f: fuelle, vol: true, alto: 280, choque: null, grupo: "herreria" },
    pilaTemplar: { f: pilaTemplar, vol: true, alto: 200, choque: null, grupo: "herreria" },
    muelaAfilar: { f: muelaAfilar, vol: true, alto: 240, choque: null, grupo: "herreria" },
    panopliaHerramientas: { f: panopliaHerramientas, vol: true, alto: 420, choque: null, grupo: "herreria" },
    armeroForja: { f: armeroForja, vol: true, alto: 320, choque: null, grupo: "herreria" },
    bancoForja: { f: bancoForja, vol: true, alto: 180, choque: null, grupo: "herreria" },
    montonCarbon: { f: montonCarbon, vol: true, alto: 260, choque: null, grupo: "herreria" },
    gataForja: { f: gataForja, vol: true, alto: 80, choque: null, grupo: "herreria" },
  });
  Object.assign(ASSETS.EJEMPLO, {
    fuelle: { sopla: 0.4 },
    panopliaHerramientas: { z: 40 },
    gataForja: { duerme: true },
  });
})();
