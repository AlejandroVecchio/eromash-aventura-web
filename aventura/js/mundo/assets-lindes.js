// ---------- lo de adentro de la Casa de las Lindes (assets armados con caras) ----------
// El estudio de Svanhild (motor/lindes.js), la que guarda los registros de las lindes de Eldervald: la mesa grande con
// el mapa del bosque y sus sendas en rojo, el estante de los rollos, las piedras de linde de muestra, el atril con el
// Libro de las Lindes, el hogar con la cornamenta de Eikholt, la cama de alcoba y la mesa del copista. Todo en volumen
// para verse desde cualquier ángulo. Medidas de los interiores: la gente mide unos 230.
(function () {
  "use strict";
  const { R, E, L, P, alfa, azar } = DIB;
  const MC = ["#3A1A10", "#5A2A16", "#7A3E20"],
    MCL = ["#5A3E22", "#7A5634", "#9A7448"],
    PI = ["#4E4852", "#5E5862", "#7A747E"],
    PIO = ["#3E3842", "#4E4852", "#66606A"],
    PERG = ["#B8A07A", "#D8C49A", "#EADCB8"],
    LANA = ["#5E130D", "#9C2315", "#C8402D"],
    RUNA = "#73D5DB",
    BRASA = "#FF8D71",
    ORO = "#FFD98A",
    ROJO = "#C8402D";
  const calidad = () => (window.CALIDAD ? CALIDAD.nivel : "alta");

  // el mapa de Eldervald a mano, en el lugar (0..l × -h..0) de una cara: el bosque, el río, las sendas en rojo y Eikholt
  function mapaEldervald(cc, l, h, sem, marcas) {
    const r = azar(sem || 7);
    R(cc, 0, -h, l, h, "#E2D2A8");
    alfa(cc, 0.5, () => {
      for (let k = 0; k < 10; k++) E(cc, r() * l, -r() * h, 20 + r() * 40, 10 + r() * 20, "#CDBA8C");
    });
    // el bosque: arbolitos en triángulo
    for (let k = 0; k < 70; k++) {
      const x = 8 + r() * (l - 16),
        y = -8 - r() * (h - 16),
        s = 4 + r() * 4;
      P(cc, [x, y - s * 1.6, x + s, y, x - s, y], k % 3 ? "#5E6A3A" : "#4E5C32");
    }
    // el río que baja de norte a sur
    cc.strokeStyle = "#4A78A0";
    cc.lineWidth = Math.max(2, l * 0.012);
    cc.beginPath();
    cc.moveTo(l * 0.72, -h);
    cc.bezierCurveTo(l * 0.6, -h * 0.7, l * 0.85, -h * 0.45, l * 0.7, 0);
    cc.stroke();
    // las sendas en rojo, de Eikholt al Puesto y al Paso
    cc.strokeStyle = ROJO;
    cc.lineWidth = Math.max(1.5, l * 0.008);
    cc.setLineDash([l * 0.02, l * 0.012]);
    cc.beginPath();
    cc.moveTo(l * 0.45, -h * 0.55);
    cc.quadraticCurveTo(l * 0.3, -h * 0.3, l * 0.18, -h * 0.12);
    cc.moveTo(l * 0.45, -h * 0.55);
    cc.quadraticCurveTo(l * 0.55, -h * 0.8, l * 0.62, -h * 0.92);
    cc.moveTo(l * 0.45, -h * 0.55);
    cc.quadraticCurveTo(l * 0.62, -h * 0.5, l * 0.88, -h * 0.3);
    cc.stroke();
    cc.setLineDash([]);
    // Eikholt: la elipse de la empalizada
    cc.fillStyle = "#8A6A44";
    cc.beginPath();
    cc.ellipse(l * 0.45, -h * 0.55, l * 0.06, h * 0.07, 0, 0, Math.PI * 2);
    cc.fill();
    cc.strokeStyle = "#5A2A16";
    cc.lineWidth = Math.max(1, l * 0.005);
    cc.stroke();
    // las lindes: la línea punteada del borde, con algún tramo borrado
    cc.strokeStyle = "#3A2418";
    cc.setLineDash([l * 0.008, l * 0.016]);
    cc.strokeRect(l * 0.04, -h * 0.96, l * 0.92, h * 0.92);
    cc.setLineDash([]);
    alfa(cc, 0.8, () => R(cc, l * 0.3, -h * 0.97, l * 0.14, h * 0.04, "#E2D2A8"));
    // marcas: piedras de linde en el borde (rombos) y una cruz donde falta una
    (marcas || [[0.04, 0.3], [0.04, 0.7], [0.96, 0.4], [0.5, 0.04], [0.8, 0.96]]).forEach(([mx, my], k) => {
      const x = l * mx,
        y = -h * my,
        s = Math.max(3, l * 0.012);
      P(cc, [x, y - s, x + s, y, x, y + s, x - s, y], k === 3 ? ROJO : "#3A2418");
    });
    // la rosa de los vientos
    const rx = l * 0.12,
      ry = -h * 0.82,
      rs = l * 0.05;
    P(cc, [rx, ry - rs, rx + rs * 0.25, ry, rx, ry + rs, rx - rs * 0.25, ry], "#5A2A16");
    P(cc, [rx - rs, ry, rx, ry - rs * 0.25, rx + rs, ry, rx, ry + rs * 0.25], "#7A5634");
    P(cc, [rx, ry - rs, rx + rs * 0.25, ry, rx - rs * 0.25, ry], ROJO);
  }

  // ---------- La mesa de los mapas ----------
  // La mesa grande de Svanhild: cuatro patas torneadas, el mapa de Eldervald extendido arriba con piedritas que lo
  // sujetan, alfileres rojos y dorados en las sendas, el compás de puntas, el tintero y una vela. o.vela.
  function mesaMapas(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      alta = calidad() !== "baja";
    VOL.sombra(c, pr, 0, 0, 250, 140, 0.4);
    S.poner(0, 0, () => {
      [[-210, -110], [210, -110], [-210, 110], [210, 110]].forEach(([u, w]) => {
        VOL.cilindro(c, pr, u, w, 14, 0, 104, MC, { n: 6 });
        VOL.cilindro(c, pr, u, w, 18, 40, 52, MC, { n: 6 });
      });
      VOL.caja(c, pr, -240, -136, 104, 240, 136, 124, MCL, { tapa: "#9A7448" });
      // el mapa extendido, con las esquinas un poco levantadas
      VOL.caja(c, pr, -200, -112, 124, 200, 112, 126, PERG, { tapa: "#E2D2A8", arriba: (cc, l, h) => mapaEldervald(cc, l, h, 7) });
      // piedritas en las esquinas
      [[-196, -108], [196, -108], [-196, 108], [196, 108]].forEach(([u, w]) => VOL.cubo(c, pr, u, w, 22, 18, 14, PIO, null, 126));
      // alfileres en las sendas
      [[-20, -10, ROJO], [-80, 40, ROJO], [40, -60, ROJO], [110, 30, ORO], [-140, 76, ORO]].forEach(([u, w, col]) => {
        VOL.palo(c, pr, u, w, 126, u, w, 146, 1.5, "#8A847E");
        VOL.cubo(c, pr, u, w, 7, 7, 7, [col, col, "#FFE8B0"], null, 146);
      });
      // el compás de puntas abierto
      VOL.palo(c, pr, 150, -60, 128, 120, -10, 132, 3, "#C9A45A");
      VOL.palo(c, pr, 150, -60, 128, 180, -14, 132, 3, "#C9A45A");
      // el tintero y la pluma
      VOL.cilindro(c, pr, 200, 90, 14, 124, 146, ["#141010", "#2A2428", "#3E383C"], { n: 8 });
      VOL.palo(c, pr, 200, 90, 146, 230, 70, 210, 2, "#F2ECEC");
      // la vela
      VOL.cilindro(c, pr, -220, 116, 12, 124, 168, ["#A8A090", "#C8C0B0", "#E8E0D0"], { n: 6 });
      if (o.vela !== false) {
        const q = pr(-220, 116, 176);
        E(c, q[0], q[1], 4 * pr.s, 9 * pr.s, ORO);
        if (alta) VOL.halo(c, pr, -220, 116, 178, 70, ORO, 0.35 + 0.05 * Math.sin(t * 6));
      }
    });
    S.dibujar();
  }

  // ---------- El estante de los rollos ----------
  // Un mueble alto de casilleros contra la pared, cada uno con rollos de mapas vistos de punta (algunos con el sello
  // rojo del Ting), una escalera de mano apoyada y una caja de tablillas arriba.
  function estanteLindes(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      r = azar(o.sem || 31);
    VOL.sombra(c, pr, 0, 30, 240, 70, 0.35);
    const casilleros = (cc, l, h) => {
      const cols = 6,
        filas = 5,
        cw = l / cols,
        fh = (h - 20) / filas;
      R(cc, 0, -h, l, h, "#3A1A10");
      for (let f = 0; f < filas; f++)
        for (let k = 0; k < cols; k++) {
          const x0 = k * cw + 6,
            y0 = -h + 10 + f * fh + 6;
          R(cc, x0, y0, cw - 12, fh - 12, "#1E0E08");
          // las puntas de los rollos, apiladas
          const n = 2 + Math.floor(r() * 4);
          for (let i = 0; i < n; i++) {
            const rx = x0 + 10 + (i % 3) * ((cw - 32) / 2),
              ry = y0 + fh - 22 - Math.floor(i / 3) * 18,
              rr = 8 + r() * 3;
            E(cc, rx, ry, rr, rr, i % 2 ? "#D8C49A" : "#C8B08A");
            E(cc, rx, ry, rr * 0.4, rr * 0.4, "#8A7050");
            if (r() < 0.18) E(cc, rx + rr * 0.7, ry + rr * 0.3, 4, 4, ROJO);
          }
        }
    };
    S.poner(0, 0, () => {
      VOL.caja(c, pr, -220, -40, 0, 220, 40, 380, MC, { frente: casilleros, tapa: "#5A2A16" });
      VOL.caja(c, pr, -230, -44, 380, 230, 46, 396, MC);
      // la caja de tablillas arriba
      VOL.caja(c, pr, 60, -30, 396, 180, 30, 440, MCL);
    });
    // la escalera de mano apoyada adelante a la derecha
    S.poner(170, 70, () => {
      VOL.palo(c, pr, 150, 90, 0, 150, 46, 340, 6, "#7A5634");
      VOL.palo(c, pr, 200, 90, 0, 200, 46, 340, 6, "#7A5634");
      for (let k = 1; k < 7; k++) {
        const f = k / 7;
        VOL.palo(c, pr, 150, 90 - 44 * f, 340 * f, 200, 90 - 44 * f, 340 * f, 4, "#9A7448");
      }
    });
    S.dibujar();
  }

  // ---------- Las piedras de linde ----------
  // Sobre un zócalo de tablas, cinco piedras de linde de muestra (una por cada borde de Eldervald), cada una con sus
  // muescas y su runa que apenas brilla. o.toca: cuál brilla fuerte (0 a 4, o -1), o.brillo (0 a 1).
  function piedrasLinde(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      alta = calidad() !== "baja",
      RUNAS = ["algiz", "othala", "raidho", "ingwaz", "dagaz"];
    VOL.sombra(c, pr, 0, 0, 200, 70, 0.35);
    S.poner(0, 0, () => VOL.caja(c, pr, -190, -50, 0, 190, 50, 50, MCL, { tapa: "#7A5634" }));
    [-140, -70, 0, 70, 140].forEach((u, k) => {
      const alto = 90 + ((k * 37) % 50),
        fuerte = o.toca === k ? (o.brillo == null ? 1 : o.brillo) : 0;
      S.poner(u, 0, () => {
        VOL.prisma(c, pr, [[u - 22, -16], [u + 20, -18], [u + 24, 14], [u - 20, 18]], 50, 50 + alto, PI);
        VOL.prisma(c, pr, [[u - 16, -10], [u + 14, -12], [u + 10, 8], [u - 12, 10]], 50 + alto, 50 + alto + 16, PIO);
        // las muescas del costado y la runa del frente
        for (let i = 0; i < 3; i++) VOL.palo(c, pr, u - 20, 18, 70 + i * 16, u - 8, 18, 70 + i * 16, 2, "#2E2A32");
        const q = pr(u, 19, 50 + alto * 0.55),
          late = 0.5 + 0.5 * Math.sin(t * 1.6 + k);
        if (window.FUTHARK) FUTHARK.dibujar(c, RUNAS[k], q[0], q[1], 13 * pr.s, fuerte > 0 ? "#C8F2F4" : RUNA, 2 * pr.s);
        if (alta) VOL.halo(c, pr, u, 20, 50 + alto * 0.55, 34 + fuerte * 50, RUNA, 0.12 + 0.1 * late + fuerte * 0.5);
      });
    });
    S.dibujar();
  }

  // ---------- El atril del Libro de las Lindes ----------
  // Un atril de roble con el tablero inclinado y el libro grande abierto: tapas de cuero rojo, hojas con renglones y
  // la cinta dorada que cuelga. o.hoja (0 a 1): la hoja que se da vuelta.
  function atrilLibro(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      hoja = o.hoja || 0;
    VOL.sombra(c, pr, 0, 0, 80, 60, 0.35);
    S.poner(0, 0, () => {
      VOL.cubo(c, pr, 0, 0, 70, 50, 20, MC);
      VOL.cubo(c, pr, 0, 0, 22, 22, 150, MC, null, 20);
      // el tablero inclinado (de atrás alto a adelante bajo)
      VOL.prisma(c, pr, [[-70, -40], [70, -40], [70, 40], [-70, 40]], 160, 170, MC);
      VOL.prisma(c, pr, [[-78, -44], [78, -44], [78, -30], [-78, -30]], 170, 200, MC);
      // el libro: dos mitades de hojas sobre la tapa roja
      VOL.caja(c, pr, -74, -36, 170, 74, 38, 176, LANA);
      [[-70, -2], [2, 70]].forEach(([u0, u1]) =>
        VOL.caja(c, pr, u0, -32, 176, u1, 34, 186, PERG, {
          tapa: "#EADCB8",
          arriba: (cc, l, h) => {
            for (let k = 0; k < 7; k++) R(cc, l * 0.12, -h + 10 + k * ((h - 20) / 7), l * (0.6 + ((k * 13) % 30) / 100), 2, "#6A5A40");
          },
        }),
      );
      // la hoja que se da vuelta
      if (hoja > 0 && hoja < 1) {
        const a = hoja * Math.PI,
          u = Math.cos(a) * 68;
        VOL.prisma(c, pr, [[0, -30], [u, -30], [u, 32], [0, 32]], 186 + Math.sin(a) * 50, 188 + Math.sin(a) * 50, PERG);
      }
      // la cinta
      VOL.palo(c, pr, 0, 34, 186, 4, 44, 140, 3, ORO);
    });
    S.dibujar();
  }

  // ---------- El hogar de las Lindes ----------
  // Hogar de piedra contra la pared con su repisa, el fuego, los morillos de hierro, la campana de la chimenea y,
  // colgada encima, la cornamenta pálida de Eikholt. o.fuego (0 a 1), o.chimenea: alto.
  function hogarLindes(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      fuego = o.fuego == null ? 1 : o.fuego,
      zc = o.chimenea || 520,
      alta = calidad() !== "baja";
    VOL.sombra(c, pr, 0, 20, 220, 110, 0.4);
    S.poner(0, -40, () => {
      VOL.caja(c, pr, -200, -110, 0, 200, -70, 300, PI, {
        frente: (cc, l, h) => {
          for (let k = 0; k < 6; k++) for (let i = 0; i < 5; i++) R(cc, i * (l / 5) + (k % 2) * 24 + 3, -h + k * (h / 6) + 3, l / 5 - 6, h / 6 - 6, (i + k) % 3 ? "#5E5862" : "#544E58");
          alfa(cc, 0.6, () => R(cc, l * 0.22, -h * 0.55, l * 0.56, h * 0.55, "#141010"));
        },
      });
      VOL.caja(c, pr, -200, -110, 0, -150, 40, 190, PI);
      VOL.caja(c, pr, 150, -110, 0, 200, 40, 190, PI);
      // la repisa de roble con un candil y una piedra de linde chica
      VOL.caja(c, pr, -220, -110, 190, 220, 60, 214, MC, { tapa: "#7A3E20" });
      VOL.cilindro(c, pr, -150, 30, 12, 214, 240, ["#8A6A2A", "#C9A45A", "#FFD98A"], { n: 6 });
      VOL.cubo(c, pr, 150, 20, 30, 20, 50, PI, null, 214);
      // la campana de la chimenea hasta el techo, con la cornamenta pálida al frente
      VOL.prisma(c, pr, [[-170, -110], [170, -110], [130, 40], [-130, 40]], 214, 330, PIO);
      VOL.caja(c, pr, -90, -110, 330, 90, -30, zc, PIO, {
        frente: (cc, l, h) => DIB.insignia(cc, (u, v) => [l / 2 + u * l * 0.85, -h + 20 + v * Math.min(160, h - 40)], "#F2ECEC"),
      });
    });
    // los morillos y los leños
    S.poner(0, 0, () => {
      VOL.palo(c, pr, -70, 10, 0, -70, 10, 40, 6, "#2A2428");
      VOL.palo(c, pr, 70, 10, 0, 70, 10, 40, 6, "#2A2428");
      VOL.rollo(c, pr, -90, 90, -10, 20, 16, ["#3A2418", "#5A3A22", "#7A5634"]);
      VOL.rollo(c, pr, -80, 80, 20, 34, 14, ["#3A2418", "#5A3A22", "#7A5634"]);
      if (fuego > 0) {
        const n = alta ? 5 : 3;
        for (let k = 0; k < n; k++) {
          const f = Math.sin(t * 9 + k * 1.7) * 0.5 + 0.5,
            u = -60 + k * (120 / (n - 1)),
            q = pr(u, 0, 40),
            al = (40 + f * 50) * fuego * pr.s;
          P(c, [q[0] - 14 * pr.s, q[1], q[0], q[1] - al, q[0] + 14 * pr.s, q[1]], k % 2 ? BRASA : ORO);
        }
        if (alta) VOL.halo(c, pr, 0, 0, 60, 160, BRASA, 0.35 * fuego);
      }
    });
    S.dibujar();
  }

  // ---------- La cama de alcoba ----------
  // La cama de Svanhild metida en un cajón de tablas con techo, cortinas de lana roja recogidas a los costados, el
  // colchón de paja, la manta de piel y la almohada. o.ocupada: alguien duerme (la manta abultada), o.cerrada.
  function camaAlcoba(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      res = o.ocupada ? Math.sin(t * 1.5) * 3 : 0;
    VOL.sombra(c, pr, 0, 0, 200, 130, 0.35);
    S.poner(0, -60, () => {
      // el fondo y los costados del cajón, el techo
      VOL.caja(c, pr, -200, -120, 0, 200, -100, 300, MC);
      VOL.caja(c, pr, -200, -120, 0, -180, 120, 300, MC);
      VOL.caja(c, pr, 180, -120, 0, 200, 120, 300, MC);
      VOL.caja(c, pr, -210, -126, 300, 210, 130, 320, MC, { tapa: "#5A2A16" });
    });
    S.poner(0, 0, () => {
      VOL.caja(c, pr, -180, -100, 0, 180, 110, 60, MC);
      VOL.caja(c, pr, -176, -96, 60, 176, 106, 84, ["#8A7040", "#B0904E", "#D0B06A"]);
      VOL.caja(c, pr, -160, -90, 84, -90, 90, 106, ["#A8A090", "#C8C0B0", "#E8E0D0"]);
      VOL.caja(c, pr, -90, -96, 84, 172, 104, (o.ocupada ? 130 : 100) + res, ["#5A4A3A", "#7A6450", "#9A8468"], {
        arriba: (cc, l, h) => {
          for (let k = 0; k < 9; k++) R(cc, (k * l) / 9, -h, 3, h, "#5A4A3A");
        },
      });
      if (o.ocupada) VOL.cilindro(c, pr, -124, 0, 30, 100, 136, ["#A88A40", "#C8C0B0", "#E8E0D0"], { n: 8 });
      // las cortinas recogidas
      [-170, 170].forEach((u) => VOL.caja(c, pr, u - 14, 104, 60, u + 14, 126, 300, LANA));
      // el arcón de los pies
      VOL.caja(c, pr, -150, 120, 0, 150, 190, 70, MCL, { tapa: "#7A5634" });
      VOL.caja(c, pr, -10, 188, 34, 10, 192, 58, ["#8A6A2A", "#C9A45A", ORO]);
    });
    S.dibujar();
  }

  // ---------- La mesa del copista ----------
  // Una mesa chica con el tablero apenas inclinado, la hoja que se está copiando y el mapa de muestra al lado, el
  // tintero, la pluma, el raspador, una vela y el banco. o.escribe (0 a 1): la pluma se mueve.
  function mesaCopista(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      alta = calidad() !== "baja",
      e = o.escribe ? Math.sin(t * 14) * 6 : 0;
    VOL.sombra(c, pr, 0, 0, 150, 80, 0.35);
    S.poner(0, 0, () => {
      [[-120, -50], [120, -50], [-120, 50], [120, 50]].forEach(([u, w]) => VOL.cubo(c, pr, u, w, 14, 14, 110, MC));
      VOL.caja(c, pr, -140, -64, 110, 140, 64, 124, MCL, { tapa: "#9A7448" });
      VOL.caja(c, pr, -110, -40, 124, 0, 40, 126, PERG, { tapa: "#E2D2A8", arriba: (cc, l, h) => mapaEldervald(cc, l, h, 13) });
      VOL.caja(c, pr, 16, -40, 124, 110, 40, 126, PERG, {
        tapa: "#EADCB8",
        arriba: (cc, l, h) => {
          for (let k = 0; k < 6; k++) R(cc, l * 0.1, -h + 10 + k * ((h - 20) / 6), l * (k === 5 ? 0.4 : 0.78), 2, "#3A2418");
        },
      });
      VOL.cilindro(c, pr, 120, -40, 10, 124, 140, ["#141010", "#2A2428", "#3E383C"], { n: 8 });
      VOL.palo(c, pr, 70 + e, 20, 128, 100 + e, 0, 190, 2, "#F2ECEC");
      VOL.cilindro(c, pr, -124, 48, 10, 124, 160, ["#A8A090", "#C8C0B0", "#E8E0D0"], { n: 6 });
      if (o.vela !== false) {
        const q = pr(-124, 48, 168);
        E(c, q[0], q[1], 3.5 * pr.s, 8 * pr.s, ORO);
        if (alta) VOL.halo(c, pr, -124, 48, 170, 60, ORO, 0.3);
      }
    });
    // el banco
    S.poner(0, 110, () => VOL.caja(c, pr, -70, 90, 0, 70, 130, 60, MC, { tapa: "#7A3E20" }));
    S.dibujar();
  }

  Object.assign(ASSETS.LISTA, {
    mesaMapas: { f: mesaMapas, vol: true, alto: 200, choque: null, grupo: "lindes" },
    estanteLindes: { f: estanteLindes, vol: true, alto: 440, choque: null, grupo: "lindes" },
    piedrasLinde: { f: piedrasLinde, vol: true, alto: 220, choque: null, grupo: "lindes" },
    atrilLibro: { f: atrilLibro, vol: true, alto: 220, choque: null, grupo: "lindes" },
    hogarLindes: { f: hogarLindes, vol: true, alto: 560, choque: null, grupo: "lindes" },
    camaAlcoba: { f: camaAlcoba, vol: true, alto: 320, choque: null, grupo: "lindes" },
    mesaCopista: { f: mesaCopista, vol: true, alto: 200, choque: null, grupo: "lindes" },
  });
  Object.assign(ASSETS.EJEMPLO, {
    piedrasLinde: { toca: 2 },
    atrilLibro: { hoja: 0.4 },
    camaAlcoba: { ocupada: true },
    mesaCopista: { escribe: true },
  });
  window.LINDES_MAPA = mapaEldervald; // para pintar el mapa grande de la pared (motor/lindes.js)
})();
