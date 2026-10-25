// ---------- lo de adentro de la Casa de Sanación (assets armados con caras) ----------
// La casa de Thora (motor/sanacion.js) se arma con estas piezas, todas en volumen para verse desde cualquier ángulo: el
// hogar con el caldero de hierbas, el estante de frascos con runas en los corchos, las hierbas colgadas a secar, la mesa
// de los morteros, las camas de paja con mantas de lana, la cortina de lino, la tina de los baños tibios, la mesa de las
// piedras de Berkano con el libro de Thora y el jergón de Hlíf. Medidas de los interiores: la gente mide unos 230.
(function () {
  "use strict";
  const { R, E, L, alfa, azar } = DIB;
  const MC = ["#3A1A10", "#5A2A16", "#7A3E20"],
    MCL = ["#5A3E22", "#7A5634", "#9A7448"],
    PI = ["#4E4852", "#5E5862", "#7A747E"],
    PIO = ["#3E3842", "#4E4852", "#66606A"],
    LINO = ["#A8A090", "#C8C0B0", "#E8E0D0"],
    PAJA = ["#8A7040", "#B0904E", "#D0B06A"],
    HI = ["#2A2428", "#3A3438", "#6E6A6E"],
    MANTAS = [["#5E130D", "#9C2315", "#C8402D"], ["#3A4428", "#4E5C32", "#6A7A3E"], ["#5A4A30", "#7A6440", "#9A8050"]],
    VERDES = ["#3A4428", "#4E5C32", "#6A7A3E", "#8A9A4E"],
    RUNA = "#73D5DB",
    BRASA = "#FF8D71",
    ORO = "#FFD98A";
  const calidad = () => (window.CALIDAD ? CALIDAD.nivel : "alta");

  // ---------- El hogar con el caldero ----------
  // Hogar de piedra contra la pared con su campana y la chimenea, el fuego chico y el caldero de hierro colgado de la
  // cadena con el caldo verde que hierve. o.fuego (0 a 1), o.remueve (0 a 1: la cuchara da vueltas), o.chimenea: alto.
  function hogarCaldero(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      fuego = o.fuego == null ? 1 : o.fuego,
      zc = o.chimenea || 520,
      alta = calidad() !== "baja";
    VOL.sombra(c, pr, 0, 20, 220, 120, 0.4);
    S.poner(0, -40, () => {
      // el fondo y los costados de piedra, abierto adelante
      VOL.caja(c, pr, -200, -110, 0, 200, -70, 330, PI, {
        frente: (cc, l, h) => {
          for (let k = 0; k < 6; k++) for (let i = 0; i < 5; i++) R(cc, i * (l / 5) + (k % 2) * 24 + 3, -h + k * (h / 6) + 3, l / 5 - 6, h / 6 - 6, (i + k) % 3 ? "#5E5862" : "#544E58");
          alfa(cc, 0.6, () => R(cc, l * 0.2, -h, l * 0.6, h * 0.5, "#141010"));
        },
      });
      [-1, 1].forEach((sg) => VOL.caja(c, pr, sg * 200 - (sg > 0 ? 50 : 0), -110, 0, sg * 200 + (sg > 0 ? 0 : 50), 90, 330, PI));
      VOL.caja(c, pr, -220, -120, 300, 220, 100, 340, PIO);
      VOL.caja(c, pr, -150, -90, 340, 150, 70, 420, PIO);
      VOL.caja(c, pr, -80, -80, 420, 80, 30, zc, PIO, {
        frente: (cc, l, h) => {
          for (let k = 0; k < h; k += 40) R(cc, 0, -k - 3, l, 3, "#2E2A32");
          if (window.FUTHARK) FUTHARK.dibujar(cc, "berkano", l / 2, -40, 40, RUNA, 4);
        },
        sinTapa: true,
      });
    });
    S.poner(0, 10, () => {
      // la cama de leña y las brasas
      VOL.caja(c, pr, -150, -60, 0, 150, 80, 20, PIO, { tapa: "#2A2226" });
      VOL.palo(c, pr, -90, 0, 30, 80, 30, 34, 18, "#5A2A16");
      VOL.palo(c, pr, -70, 40, 32, 90, -10, 28, 16, "#7A3E20");
      VOL.elipse(c, pr, 0, 10, 22, 110, 54, "#5E130D");
      VOL.elipse(c, pr, 0, 10, 23, 60 + 20 * fuego, 30 + 8 * fuego, BRASA);
      if (alta) VOL.halo(c, pr, 0, 10, 60, 120 + 70 * fuego, BRASA, 0.3 + 0.2 * fuego);
      const q = pr(0, 10, 30),
        s = pr.s;
      for (let k = 0; k < 5; k++) {
        const v = Math.sin(t * 8 + k * 2.1) * 7 * s,
          fx = q[0] + (-56 + k * 28) * s,
          h = (30 + (k % 3) * 12) * (0.5 + 0.6 * fuego) * s;
        c.fillStyle = k % 2 ? BRASA : ORO;
        c.beginPath();
        c.moveTo(fx - 10 * s, q[1]);
        c.lineTo(fx + 10 * s, q[1]);
        c.lineTo(fx + v * 0.4, q[1] - h - v);
        c.fill();
      }
      // la barra y la cadena del caldero
      VOL.palo(c, pr, -170, 10, 300, 170, 10, 300, 8, "#2A2428");
      VOL.palo(c, pr, 0, 10, 300, 0, 10, 190, 4, "#3A3438");
      // el caldero: panza de hierro, borde y el caldo verde
      VOL.cilindro(c, pr, 0, 10, 70, 90, 120, HI, { n: 12, sinTapa: true });
      VOL.cilindro(c, pr, 0, 10, 86, 120, 180, HI, { n: 12, sinTapa: true });
      VOL.cilindro(c, pr, 0, 10, 92, 180, 190, HI, { n: 12, sinTapa: true });
      const burb = Math.sin(t * 5) * 3;
      VOL.elipse(c, pr, 0, 10, 186, 82, 40, "#3A4428");
      VOL.elipse(c, pr, -10, 6, 187 + burb * 0.2, 60, 28, "#6A7A3E");
      for (let k = 0; k < 3; k++) {
        const a = t * 1.7 + k * 2.1;
        VOL.elipse(c, pr, Math.cos(a) * 40, 10 + Math.sin(a) * 18, 188, 8 + Math.sin(t * 6 + k) * 3, 4, "#8A9A4E");
      }
      // la cuchara de madera
      const g = (o.remueve || 0) * Math.PI * 2;
      VOL.palo(c, pr, Math.cos(g) * 40, 10 + Math.sin(g) * 18, 180, Math.cos(g) * 70, 10 + Math.sin(g) * 30, 290, 7, "#9A7448");
    });
    S.dibujar();
  }

  // ---------- El estante de los frascos ----------
  // Cuatro tablas de abedul con frascos, jarras y cestitos; cada corcho lleva una runa de Thora.
  function estanteFrascos(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      r = azar(41);
    VOL.sombra(c, pr, 0, 0, 230, 50, 0.35);
    S.poner(0, -20, () => {
      [-220, 220].forEach((u) => VOL.cubo(c, pr, u, -20, 18, 50, 380, MCL));
      VOL.caja(c, pr, -230, -46, 0, 230, -40, 380, MC);
    });
    const tablas = [40, 140, 240, 340];
    tablas.forEach((z, k) =>
      S.poner(0, k * 0.01, () => {
        VOL.caja(c, pr, -220, -44, z, 220, 6, z + 10, MCL, { tapa: "#B08A5A" });
        const runas = ["berkano", "laguz", "ingwaz", "jera", "algiz", "sowilo"];
        for (let i = 0; i < 7; i++) {
          const u = -190 + i * 62 + r() * 10,
            alto = 36 + r() * 30,
            tipo = (i + k) % 4;
          if (tipo === 0) {
            // frasco de vidrio verde con su corcho
            VOL.cilindro(c, pr, u, -16, 16, z + 10, z + 10 + alto, ["#2A4A3A", "#3A6A50", "#6A9A70"], { n: 8 });
            VOL.cilindro(c, pr, u, -16, 8, z + 10 + alto, z + 18 + alto, PAJA, { n: 6 });
          } else if (tipo === 1) {
            // jarra de barro
            VOL.cilindro(c, pr, u, -16, 20, z + 10, z + 10 + alto * 0.8, ["#7A3E20", "#9A5A30", "#B87A48"], { n: 8 });
          } else if (tipo === 2) {
            // frasco claro con bayas
            VOL.cilindro(c, pr, u, -16, 14, z + 10, z + 10 + alto, ["#8A8478", "#B0AA9C", "#D8D2C4"], { n: 8 });
            VOL.elipse(c, pr, u, -16, z + 10 + alto * 0.5, 9, 4, "#C8402D");
          } else {
            // cestito con raíces
            VOL.cilindro(c, pr, u, -16, 22, z + 10, z + 30, PAJA, { n: 8 });
            VOL.palo(c, pr, u - 8, -16, z + 30, u + 10, -12, z + 44, 5, "#9A7448");
          }
          if (tipo !== 3 && window.FUTHARK && k < 3) {
            const q = pr(u, 8, z + 10 + alto * 0.45);
            FUTHARK.dibujar(c, runas[(i + k * 2) % runas.length], q[0], q[1], 9 * pr.s, "#F2ECEC", 1.5 * pr.s);
          }
        }
      }),
    );
    S.dibujar();
  }

  // ---------- Las hierbas colgadas ----------
  // Una vara contra la pared con atados de hierbas cabeza abajo secándose: milenrama, ortiga, lavanda y musgo. o.z: alto.
  function colgaderoHierbas(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      z0 = o.z || 300,
      r = azar(7);
    S.poner(0, 0, () => {
      [-200, 200].forEach((u) => VOL.palo(c, pr, u, -10, z0 + 30, u, 14, z0 + 30, 8, "#3A3438"));
      VOL.palo(c, pr, -220, 14, z0 + 30, 220, 14, z0 + 30, 10, "#7A5634");
      for (let i = 0; i < 8; i++) {
        const u = -180 + i * 52,
          largo = 70 + r() * 50,
          mece = Math.sin(t * 1.1 + i) * 3,
          col = i % 4 === 2 ? ["#5A4A7A", "#7A6A9A", "#9A8AB8"] : VERDES.slice(i % 2, i % 2 + 3);
        VOL.palo(c, pr, u, 14, z0 + 30, u, 14, z0 + 10, 3, "#C8B48A");
        VOL.piramide(c, pr, [[u - 18, 6], [u + 18, 6], [u + 18, 22], [u - 18, 22]], z0 + 10, u + mece, 14, z0 + 10 - largo, col);
        VOL.cubo(c, pr, u, 14, 12, 12, 8, ["#8A6A3A", "#B08A4E", "#D0AA6A"], null, z0 + 4);
      }
    });
    S.dibujar();
  }

  // ---------- La mesa de los morteros ----------
  // Mesa de tablas con dos morteros de piedra, la balanza, atados de hierbas, un cuchillo curvo y hojas picadas. o.muele
  // (0 a 1): el pilón del mortero grande da vueltas.
  function mesaMorteros(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      r = azar(23),
      g = (o.muele || 0) * Math.PI * 2;
    VOL.sombra(c, pr, 0, 0, 220, 90, 0.4);
    S.poner(0, 0, () => {
      [[-180, -60], [180, -60], [-180, 60], [180, 60]].forEach(([u, w]) => VOL.cubo(c, pr, u, w, 20, 20, 100, MC));
      VOL.caja(c, pr, -205, -78, 100, 205, 78, 120, MCL, {
        tapa: "#9A7448",
        arriba: (cc, l, h) => {
          for (let k = 1; k < 4; k++) R(cc, 0, -h + (h * k) / 4, l, 2, "#7A5634");
        },
      });
      // el mortero grande con su pilón
      VOL.cilindro(c, pr, -90, 0, 40, 120, 150, PI, { n: 10, tapa: "#2E2A32" });
      VOL.elipse(c, pr, -90, 0, 151, 26, 12, "#6A7A3E");
      VOL.palo(c, pr, -90 + Math.cos(g) * 14, Math.sin(g) * 8, 146, -90 + Math.cos(g) * 30, Math.sin(g) * 18, 214, 10, "#8A847E");
      // el chico
      VOL.cilindro(c, pr, -10, 40, 22, 120, 138, PIO, { n: 8, tapa: "#2E2A32" });
      // la balanza: el pie, la cruz y los dos platillos
      VOL.palo(c, pr, 110, -30, 120, 110, -30, 210, 5, "#8A6A2A");
      VOL.palo(c, pr, 70, -30, 210, 150, -30, 210, 4, "#C9A45A");
      [70, 150].forEach((u, i) => {
        VOL.palo(c, pr, u, -30, 210, u, -30, 176 + i * 6, 2, "#C9A45A");
        VOL.cilindro(c, pr, u, -30, 18, 172 + i * 6, 176 + i * 6, ["#8A6A2A", "#C9A45A", "#FFD98A"], { n: 8 });
      });
      // atados de hierbas y hojas picadas
      for (let k = 0; k < 4; k++) {
        const u = 20 + k * 40 + r() * 10,
          w = 30 + r() * 20;
        VOL.palo(c, pr, u, w, 124, u + 40, w - 10, 126, 10, VERDES[1 + (k % 3)]);
      }
      for (let k = 0; k < 14; k++) VOL.cubo(c, pr, -170 + r() * 120, 20 + r() * 40, 6, 5, 2, VERDES.slice(1), null, 120);
      // el cuchillo curvo
      VOL.palo(c, pr, 150, 40, 122, 186, 50, 122, 6, "#B8BCC0");
      VOL.palo(c, pr, 186, 50, 122, 205, 56, 124, 7, "#5A2A16");
    });
    S.dibujar();
  }

  // ---------- La cama de los enfermos ----------
  // Cama baja de tablas con el colchón de paja, sábana de lino, almohada y manta de lana (color por o.sem). o.ocupada:
  // alguien duerme debajo de la manta (respira); o.pelo: el color de su pelo.
  function camaSanacion(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      manta = MANTAS[(o.sem || 0) % 3],
      // la manta de lana tejida: dos franjas claras cerca del borde de los pies
      rayas = (cc, l, h) => [0.1, 0.18].forEach((f) => R(cc, 0, -h * f - 6, l, 8, manta[2])),
      res = Math.sin(t * 1.5 + (o.sem || 0)) * 4;
    VOL.sombra(c, pr, 0, 0, 110, 200, 0.4);
    S.poner(0, 0, () => {
      [[-90, -190], [90, -190], [-90, 190], [90, 190]].forEach(([u, w]) => VOL.cubo(c, pr, u, w, 18, 18, 60, MC));
      VOL.caja(c, pr, -100, -200, 40, 100, 200, 64, MC);
      // la cabecera alta
      VOL.caja(c, pr, -100, -210, 0, 100, -192, 150, MC, { frente: (cc, l, h) => window.FUTHARK && FUTHARK.dibujar(cc, "berkano", l / 2, -h * 0.55, 26, "#C8B48A", 3) });
      VOL.caja(c, pr, -92, -190, 64, 92, 192, 96, PAJA, { tapa: "#D0B06A" });
      VOL.caja(c, pr, -94, -190, 96, 94, 192, 100, LINO);
      VOL.caja(c, pr, -70, -184, 100, 70, -120, 126, LINO, { tapa: "#F2ECEC" });
      if (o.ocupada) {
        // la cabeza en la almohada y el bulto bajo la manta
        VOL.cilindro(c, pr, 0, -146, 26, 120, 150, ["#B89070", "#D8B090", "#E8C8A8"], { n: 8 });
        VOL.cilindro(c, pr, 0, -152, 28, 140, 156, o.pelo ? [o.pelo, o.pelo, o.pelo] : ["#5A4030", "#6A4A38", "#7A5A48"], { n: 8 });
        VOL.caja(c, pr, -86, -118, 100, 86, 180, 140 + res, manta, { tapa: manta[1], arriba: rayas });
        VOL.caja(c, pr, -50, 60, 140 + res, 50, 170, 150 + res, manta);
      } else {
        VOL.caja(c, pr, -96, 40, 100, 96, 196, 112, manta, { tapa: manta[1], arriba: rayas });
      }
    });
    S.dibujar();
  }

  // ---------- La cortina de lino ----------
  // Un bastidor con un paño claro que separa las camas, con pliegues y la cenefa bordada en verde.
  function cortinaLino(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr);
    VOL.sombra(c, pr, 0, 0, 30, 170, 0.3);
    S.poner(0, 0, () => {
      [-160, 160].forEach((w) => {
        VOL.cubo(c, pr, 0, w, 14, 14, 280, MCL);
        VOL.cubo(c, pr, 0, w, 50, 24, 10, MC);
      });
      VOL.palo(c, pr, 0, -166, 276, 0, 166, 276, 8, "#7A5634");
      // el paño de lino en tres pliegues (se dibuja de los dos lados)
      const cenefa = VOL.medida(75, 230, (cc, l) => R(cc, 0, -36, l, 14, "#4E5C32"));
      for (let k = 0; k < 4; k++) {
        const w0 = -150 + k * 75,
          w1 = w0 + 75,
          off = k % 2 ? 8 : -8;
        VOL.cara(c, pr, [[off, w0, 40], [-off, w1, 40], [-off, w1, 270], [off, w0, 270]], LINO, cenefa);
        VOL.cara(c, pr, [[-off, w1, 40], [off, w0, 40], [off, w0, 270], [-off, w1, 270]], LINO, cenefa);
      }
    });
    S.dibujar();
  }

  // ---------- La tina de los baños tibios ----------
  // Medio tonel grande con aros de hierro y agua tibia con pétalos; el banquito para subir y el balde.
  function tinaBano(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr);
    VOL.sombra(c, pr, 0, 0, 140, 90, 0.4);
    S.poner(0, 0, () => {
      VOL.cilindro(c, pr, 0, 0, 120, 0, 110, MCL, { n: 14, rw: 80, sinTapa: true });
      [20, 80].forEach((z) => VOL.cilindro(c, pr, 0, 0, 123, z, z + 10, HI, { n: 14, rw: 83, sinTapa: true }));
      VOL.elipse(c, pr, 0, 0, 96, 110, 72, "#2A4A58");
      const ola = Math.sin(t * 1.2) * 4;
      VOL.elipse(c, pr, -20 + ola, -6, 97, 60, 30, "#3A6A78");
      [[-40, 10, "#E0B2B2"], [30, -20, "#F2ECEC"], [10, 30, "#FFD98A"], [-60, -24, "#E0B2B2"]].forEach(([u, w, col], k) => VOL.elipse(c, pr, u + Math.sin(t + k) * 4, w, 98, 7, 4, col));
      VOL.cilindro(c, pr, 0, 0, 122, 110, 116, MC, { n: 14, rw: 82, sinTapa: true });
    });
    S.poner(-150, 60, () => VOL.caja(c, pr, -190, 30, 0, -120, 90, 40, MC));
    S.poner(140, 70, () => {
      VOL.cilindro(c, pr, 150, 70, 26, 0, 50, MCL, { n: 8, tapa: "#2A4A58" });
      VOL.palo(c, pr, 126, 70, 50, 174, 70, 50, 3, "#3A3438");
    });
    S.dibujar();
  }

  // ---------- La mesa de Berkano ----------
  // La mesa de Thora: las piedras de Berkano en un paño (las encendidas laten en azul rúnico), el libro de corteza de
  // abedul abierto, una vela y un manojo de abedul. o.vela: encendida.
  function mesaBerkano(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      alta = calidad() !== "baja";
    VOL.sombra(c, pr, 0, 0, 170, 80, 0.4);
    S.poner(0, 0, () => {
      [[-140, -50], [140, -50], [-140, 50], [140, 50]].forEach(([u, w]) => VOL.cubo(c, pr, u, w, 18, 18, 96, MC));
      VOL.caja(c, pr, -160, -66, 96, 160, 66, 114, MC, { tapa: "#6A3A1E" });
      // el paño y las piedras
      VOL.caja(c, pr, -140, -50, 114, 10, 50, 116, ["#2A3A40", "#3A4A50", "#4A5A60"]);
      [[-110, -20], [-60, 10], [-20, -24], [-100, 30], [-30, 30]].forEach(([u, w], k) => {
        VOL.cubo(c, pr, u, w, 30, 24, 14, ["#46404A", "#5E5862", "#7A747E"], null, 116);
        const q = pr(u, w + 12, 124),
          late = 0.5 + 0.5 * Math.sin(t * 2 + k);
        if (window.FUTHARK) FUTHARK.dibujar(c, "berkano", q[0], q[1], 9 * pr.s, RUNA, 1.6 * pr.s);
        if (alta && k < 3) VOL.halo(c, pr, u, w, 132, 30, RUNA, 0.2 + 0.25 * late);
      });
      // el libro de corteza abierto
      VOL.prisma(c, pr, [[30, -40], [90, -44], [90, 30], [30, 34]], 114, 124, ["#C8B48A", "#E0D0A8", "#F2E8C8"]);
      VOL.prisma(c, pr, [[90, -44], [150, -40], [150, 34], [90, 30]], 114, 122, ["#C8B48A", "#E0D0A8", "#F2E8C8"]);
      for (let k = 0; k < 4; k++) VOL.palo(c, pr, 40, -30 + k * 14, 125, 82, -30 + k * 14, 125, 1.5, "#5A4030");
      // la vela
      VOL.cilindro(c, pr, 130, 46, 10, 114, 150, LINO, { n: 6 });
      if (o.vela !== false) {
        const q = pr(130, 46, 158);
        E(c, q[0], q[1], 4 * pr.s, 8 * pr.s, ORO);
        if (alta) VOL.halo(c, pr, 130, 46, 160, 60, ORO, 0.35);
      }
    });
    S.dibujar();
  }

  // ---------- El jergón de Hlíf ----------
  // Un colchón de paja en el piso con una manta, la almohada y la bolsa de la aprendiz al lado.
  function jergon(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr);
    VOL.sombra(c, pr, 0, 0, 100, 160, 0.3);
    S.poner(0, 0, () => {
      VOL.caja(c, pr, -80, -150, 0, 80, 150, 22, PAJA, { tapa: "#D0B06A" });
      VOL.caja(c, pr, -60, -146, 22, 60, -100, 40, LINO);
      if (!o.ocupada) VOL.caja(c, pr, -78, -20, 22, 78, 146, 30, MANTAS[1]);
      VOL.cilindro(c, pr, 120, 80, 30, 0, 50, ["#5A4A30", "#7A6440", "#9A8050"], { n: 8, rw: 22 });
    });
    S.dibujar();
  }

  Object.assign(ASSETS.LISTA, {
    hogarCaldero: { f: hogarCaldero, vol: true, alto: 560, choque: null, grupo: "sanacion" },
    estanteFrascos: { f: estanteFrascos, vol: true, alto: 400, choque: null, grupo: "sanacion" },
    colgaderoHierbas: { f: colgaderoHierbas, vol: true, alto: 360, choque: null, grupo: "sanacion" },
    mesaMorteros: { f: mesaMorteros, vol: true, alto: 230, choque: null, grupo: "sanacion" },
    camaSanacion: { f: camaSanacion, vol: true, alto: 160, choque: null, grupo: "sanacion" },
    cortinaLino: { f: cortinaLino, vol: true, alto: 290, choque: null, grupo: "sanacion" },
    tinaBano: { f: tinaBano, vol: true, alto: 130, choque: null, grupo: "sanacion" },
    mesaBerkano: { f: mesaBerkano, vol: true, alto: 170, choque: null, grupo: "sanacion" },
    jergon: { f: jergon, vol: true, alto: 60, choque: null, grupo: "sanacion" },
  });
  Object.assign(ASSETS.EJEMPLO, {
    hogarCaldero: { remueve: 0.2 },
    colgaderoHierbas: { z: 40 },
    camaSanacion: { ocupada: true, sem: 1 },
  });
})();
