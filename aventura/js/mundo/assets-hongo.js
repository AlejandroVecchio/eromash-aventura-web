// ---------- lo de adentro del Hongo Dorado (assets armados con caras) ----------
// La sala grande de la hospedería (motor/hongo.js) se arma con estas piezas, todas en volumen para verse desde cualquier
// ángulo: el fogón del medio con su campana de cobre en forma de hongo, la barra de Ulf, el estante de jarras y cuernos,
// los toneles de las aldeas, las mesas largas y las redondas, la rueda de velas, la tarima del skald, el estandarte de
// Eikholt con la cornamenta, los escudos de los que no volvieron y los hongos dorados que crecen solos en las vigas.
// Medidas de los interiores: la gente mide unos 230 de alto (GENTE a 2,75).
(function () {
  "use strict";
  const { P, E, R, L, alfa, azar } = DIB;
  const F = FUTHARK;
  const MT = ["#2A0806", "#5E130D", "#7A1D14"],
    MC = ["#3A1A10", "#5A2A16", "#7A3E20"], // la madera de la hospedería, más tostada
    PI = ["#3E3842", "#4E4852", "#6A646C"],
    HI = ["#2A2428", "#3A3438", "#6E6A6E"],
    CO = ["#6A4416", "#B8862E", "#E8C070", "#FFD98A"], // el cobre dorado de la campana
    ORO = "#FFD98A",
    ORO2 = "#FFE7A8",
    RUNA = "#73D5DB";
  const tonos = (col) => [VOL.mezcla(col, "#000000", 0.3), col, VOL.mezcla(col, "#FFFFFF", 0.18)];
  const calidad = () => (window.CALIDAD ? CALIDAD.nivel : "alta");

  // la llama de una vela parada en un punto del objeto
  function velaEn(c, pr, u, w, z, k, t, sem) {
    if (ASSETS.vela) {
      const p = pr(u, w, z);
      ASSETS.vela(c, p[0], p[1], k * pr.s, t, sem);
    }
  }
  // una jarra de madera con su manija (o.lleno: con espuma)
  function jarra(c, pr, u, w, z, col, espuma) {
    VOL.cilindro(c, pr, u, w, 15, z, z + 34, tonos(col || "#7A5634"), { n: 8, tapa: espuma ? "#F2ECEC" : "#3A2616" });
    VOL.cilindro(c, pr, u, w, 16, z + 8, z + 12, HI, { n: 8, sinTapa: true });
    VOL.palo(c, pr, u + 16, w, z + 28, u + 24, w, z + 12, 3.5, "#553A22");
  }
  // un cuerno de beber, apoyado
  function cuerno(c, pr, u, w, z) {
    const a = pr(u - 26, w, z + 6),
      b = pr(u + 2, w, z + 22),
      d = pr(u + 26, w, z + 4);
    c.beginPath();
    c.moveTo(a[0], a[1]);
    c.quadraticCurveTo(b[0], b[1], d[0], d[1]);
    c.strokeStyle = "#E0D4C0";
    c.lineWidth = 9 * pr.s;
    c.lineCap = "round";
    c.stroke();
    c.strokeStyle = "#8A6A3A";
    c.lineWidth = 3 * pr.s;
    c.stroke();
  }

  // ---------- El fogón del Hongo Dorado ----------
  // El aro de piedra en el medio de la sala, los troncos y el fuego grande; arriba, colgada de cuatro cadenas, la campana
  // de cobre batido con forma de sombrero de hongo (por eso el nombre de la casa), con lunares claros, las láminas por
  // debajo que brillan con el fuego y el caño que sube hasta el techo.
  function fogonHongo(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      alta = calidad() !== "baja";
    VOL.sombra(c, pr, 0, 0, 280, 280, 0.35);
    // las piedras del aro
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2,
        u = Math.cos(a) * 205,
        w = Math.sin(a) * 205;
      S.poner(u, w, () => VOL.cilindro(c, pr, u, w, 52, 0, 62 + (i % 3) * 6, i % 2 ? PI : ["#34303A", "#46424C", "#5E5A64"], { n: 6, fase: a }));
    }
    // adentro: la brasa, los troncos y el fuego
    S.poner(0, 0, () => {
      VOL.elipse(c, pr, 0, 0, 2, 165, 165, "#1A0A06");
      VOL.elipse(c, pr, 0, 0, 3, 120, 120, "#5E130D");
      if (alta) VOL.halo(c, pr, 0, 0, 20, 220, "#FF8D71", 0.5);
      VOL.rollo(c, pr, -110, 110, -20, 18, 16, ["#2A1810", "#3A2418", "#4A3020"], { n: 6 });
      VOL.rollo(c, pr, -100, 100, 30, 18, 15, ["#2A1810", "#3A2418", "#4A3020"], { n: 6 });
      const q = pr(0, 0, 30),
        s = pr.s;
      for (let k = 0; k < 7; k++) {
        const v = Math.sin(t * 7 + k * 1.9) * 12 * s,
          fx = q[0] + (-90 + k * 30) * s,
          fh = (110 + Math.sin(t * 5 + k * 2.3) * 34 - Math.abs(k - 3) * 14) * s;
        P(c, [fx + v, q[1] - fh, fx - 26 * s, q[1], fx + 26 * s, q[1]], k % 2 ? "#C8402D" : "#FF8D71");
        P(c, [fx + v * 0.6, q[1] - fh * 0.55, fx - 12 * s, q[1], fx + 12 * s, q[1]], "#FFD98A");
      }
    }, 1);
    S.dibujar();
    // las cuatro cadenas de la campana
    const zc = o.zCampana || 560;
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i * Math.PI) / 2;
      VOL.palo(c, pr, Math.cos(a) * 205, Math.sin(a) * 205, zc + 36, Math.cos(a) * 60, Math.sin(a) * 60, zc + 900, 3, "#2A2428");
    }
    // la campana: el borde, el sombrero y el caño (o.tenue: se ve a medias, para no tapar lo que queda detrás)
    const fase = Math.PI / 12;
    c.save();
    if (o.tenue) c.globalAlpha *= 0.4;
    VOL.cono(c, pr, 0, 0, 270, 262, zc, zc + 22, CO, { n: 12, fase, sinTapa: true });
    VOL.cono(c, pr, 0, 0, 262, 190, zc + 22, zc + 100, CO, { n: 12, fase, sinTapa: true });
    VOL.cono(c, pr, 0, 0, 190, 56, zc + 100, zc + 190, CO, { n: 12, fase, sinTapa: true });
    VOL.cilindro(c, pr, 0, 0, 50, zc + 190, zc + 900, HI, { n: 8, sinTapa: true });
    // los lunares claros del sombrero, del lado que mira a la cámara
    const lun = [[0, 0.62, 1], [0.9, 0.58, 0.8], [2.1, 0.66, 0.9], [3.2, 0.55, 1.1], [4.3, 0.64, 0.8], [5.3, 0.6, 1]];
    lun.forEach(([a, r, k]) => {
      const u = Math.cos(a) * 230 * r,
        w = Math.sin(a) * 230 * r,
        [, haciaCam] = pr.mira(Math.cos(a), Math.sin(a));
      if (haciaCam > -0.2) VOL.elipse(c, pr, u, w, zc + 100 + (1 - r) * 125, 22 * k, 15 * k, ORO2);
    });
    // el anillo dorado del borde y el resplandor de abajo
    c.restore();
    if (alta) VOL.halo(c, pr, 0, 0, zc - 10, 240, "#FFD98A", 0.35 + 0.08 * Math.sin(t * 5));
  }

  // ---------- La barra de Ulf ----------
  // Un frente largo de tablas con hongos dorados tallados y las runas de la casa, la tapa gruesa gastada, jarras, cuernos,
  // la tabla de quesos, el candil y la canilla del tonel que gotea.
  function barraHongo(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      L2 = o.largo || 500;
    VOL.sombra(c, pr, 0, 10, L2 + 30, 90, 0.4);
    const frente = (cc, l, h) => {
      for (let k = 1; k < 12; k++) L(cc, (k * l) / 12, -h + 14, (k * l) / 12, 0, "#2A0806", 3);
      R(cc, 0, -h + 14, l, 8, "#2A0806");
      for (let k = 0; k < 3; k++) {
        const mx = l * (0.2 + k * 0.3);
        P(cc, [mx - 44, -76, mx - 30, -104, mx, -114, mx + 30, -104, mx + 44, -76], "#C9A45A");
        P(cc, [mx - 44, -76, mx - 30, -104, mx, -114, mx, -76], "#9A7A3A");
        R(cc, mx - 9, -76, 18, 48, "#E0D4C0");
        [[-20, -94], [8, -102], [24, -88]].forEach(([dx, dy]) => E(cc, mx + dx, dy, 5, 4, ORO2));
      }
      ["wunjo", "gebo", "fehu", "jera"].forEach((n, i) => F.dibujar(cc, n, l * (0.05 + i * 0.3), -40, 30, RUNA, 2.4));
    };
    VOL.caja(c, pr, -L2, -50, 0, L2, 50, 140, MC, { frente, atras: frente, sinTapa: true });
    VOL.caja(c, pr, -L2 - 20, -62, 140, L2 + 20, 62, 160, ["#4A2010", "#7A3E20", "#9A5A30"]);
    const r = azar(o.sem ? Math.round(o.sem * 97) : 31),
      S = VOL.escena(pr);
    for (let u = -L2 + 60; u < L2 - 40; u += 90 + r() * 60) {
      const k = r(),
        w = -20 + r() * 40;
      if (k < 0.45) S.poner(u, w, () => jarra(c, pr, u, w, 160, ["#7A5634", "#9A7448", "#5A3E22"][Math.floor(r() * 3)], k < 0.25));
      else if (k < 0.65) S.poner(u, w, () => cuerno(c, pr, u, w, 160));
      else if (k < 0.8)
        S.poner(u, w, () => {
          VOL.cubo(c, pr, u, w, 80, 50, 8, ["#5A3E22", "#7A5634", "#9A7448"], null, 160);
          VOL.cono(c, pr, u - 10, w, 26, 18, 168, 194, ["#B8862E", "#E8C070", "#FFE7A8"], { n: 6 });
        });
      else S.poner(u, w, () => velaEn(c, pr, u, w, 160, 0.7, t, u));
    }
    S.dibujar();
  }

  // ---------- El estante de jarras y cuernos ----------
  // Contra la pared de atrás de la barra: cuatro estantes con jarras de cada tamaño, cuernos colgados, cántaros, frascos de
  // miel y un barrilito con la runa Wunjo. Lleno, como en una casa que no cierra nunca.
  function estanteJarras(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      A = o.ancho || 450,
      r = azar(o.sem ? Math.round(o.sem * 131) : 7);
    VOL.sombra(c, pr, 0, 10, A + 20, 50, 0.35);
    VOL.caja(c, pr, -A, -40, 0, A, -30, 440, ["#2A1008", "#3A1A10", "#4A2010"]);
    [-A, -A / 3, A / 3, A].forEach((u) => VOL.caja(c, pr, u - 10, -40, 0, u + 10, 30, 440, MC));
    [20, 120, 220, 320, 420].forEach((z) => {
      VOL.caja(c, pr, -A, -40, z, A, 30, z + 12, MC);
      if (z > 400) return;
      const S = VOL.escena(pr);
      for (let u = -A + 40; u < A - 30; u += 44 + r() * 30) {
        const k = r(),
          zz = z + 12;
        if (k < 0.35) S.poner(u, 0, () => jarra(c, pr, u, 0, zz, ["#7A5634", "#9A7448", "#5A3E22"][Math.floor(r() * 3)]));
        else if (k < 0.55) S.poner(u, 0, () => VOL.cono(c, pr, u, 0, 20, 12, zz, zz + 60, ["#7A3E20", "#9A5A30", "#C8783A"], { n: 8 }));
        else if (k < 0.7) S.poner(u, 0, () => VOL.cilindro(c, pr, u, 0, 14, zz, zz + 40, ["#B8862E", "#E8C070", "#FFE7A8"], { n: 6, tapa: "#F2ECEC" }));
        else if (k < 0.85) S.poner(u, 0, () => VOL.cilindro(c, pr, u, 0, 18, zz, zz + 26, ["#5E5A64", "#8A8690", "#B8B4BC"], { n: 8 }));
        else S.poner(u, 0, () => cuerno(c, pr, u, 4, zz + 30));
      }
      S.dibujar();
    });
    // los cuernos colgados del travesaño de arriba
    for (let u = -A + 70; u < A - 50; u += 130) cuerno(c, pr, u, 32, 400);
  }

  // ---------- Los toneles de las aldeas ----------
  // Tres toneles acostados en sus cunas (dos abajo, uno arriba), cada uno con la marca de su aldea pintada en la tapa y su
  // canilla de bronce; del de arriba gotea hidromiel en una jarra.
  function tonelesHongo(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      BA = ["#5A3E22", "#7A5634", "#9A7448"],
      S = VOL.escena(pr);
    VOL.sombra(c, pr, 0, 0, 260, 90, 0.4);
    const tonel = (u, z, marca) => {
      VOL.caja(c, pr, u - 110, -60, z, u - 90, 60, z + 40, MC);
      VOL.caja(c, pr, u + 90, -60, z, u + 110, 60, z + 40, MC);
      VOL.rollo(c, pr, u - 120, u + 120, 0, z + 80, 72, BA, { n: 10, corte: "#7A5634" });
      [-80, 0, 80].forEach((uu) => VOL.rollo(c, pr, u + uu - 6, u + uu + 6, 0, z + 80, 75, HI, { n: 10 }));
      // la tapa de adelante (la de u + 120 se ve con la cámara a la derecha; la otra con la cámara a la izquierda)
      [1, -1].forEach((sg) => {
        if (pr.mira(sg, 0)[1] < 0.08) return;
        const p = pr(u + sg * 122, 0, z + 80);
        alfa(c, 0.9, () => F.dibujar(c, marca, p[0], p[1] + 16 * pr.s, 34 * pr.s, "#FFD98A", 3 * pr.s));
        VOL.palo(c, pr, u + sg * 122, 0, z + 40, u + sg * 140, 0, z + 34, 6, "#B8862E");
      });
    };
    S.poner(0, -10, () => tonel(-130, 0, "raidho"));
    S.poner(0, 10, () => tonel(130, 0, "hagalaz"));
    S.poner(0, 20, () => tonel(0, 150, "wunjo"), 150);
    S.dibujar();
    // la gota de hidromiel que cae en la jarra
    const g = (t * 0.8) % 1;
    const p = pr(122, 0, 190 - g * 150);
    if (calidad() !== "baja") alfa(c, 1 - g * 0.5, () => E(c, p[0], p[1], 3 * pr.s, 4 * pr.s, "#E8C070"));
    jarra(c, pr, 150, 0, 0, "#9A7448", true);
  }

  // ---------- La mesa larga de los parroquianos ----------
  // Tablones gruesos sobre caballetes y dos bancos corridos; encima, lo de una noche cualquiera: jarras, pan, el guiso en
  // su olla, huesos, dados, velas que se van gastando. o.sem cambia lo que hay encima; o.largo, el largo.
  function mesaLarga(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      L2 = o.largo || 450,
      S = VOL.escena(pr),
      r = azar(o.sem ? Math.round(o.sem * 173) : 11);
    VOL.sombra(c, pr, 0, 0, L2 + 40, 180, 0.35);
    [-1, 1].forEach((sg) =>
      S.poner(0, sg * 140, () => {
        [-L2 + 40, 0, L2 - 40].forEach((u) => VOL.cubo(c, pr, u, sg * 140, 16, 30, 50, MT[0]));
        VOL.cubo(c, pr, 0, sg * 140, L2 * 2, 40, 12, ["#4A2010", "#6A3418", "#8A4A26"], null, 50);
      }),
    );
    S.poner(0, 0, () => {
      [-L2 + 50, L2 - 50].forEach((u) => {
        VOL.palo(c, pr, u, -40, 0, u, 0, 100, 10, MT[0]);
        VOL.palo(c, pr, u, 40, 0, u, 0, 100, 10, MT[0]);
      });
      VOL.caja(c, pr, -L2, -60, 100, L2, 60, 114, ["#4A2010", "#7A3E20", "#9A5A30"], {
        arriba: (cc, l, h) => {
          for (let k = 1; k < 4; k++) L(cc, 0, (-h * k) / 4, l, (-h * k) / 4, "#4A2010", 2);
        },
      });
      const T = VOL.escena(pr);
      for (let u = -L2 + 50; u < L2 - 30; u += 70 + r() * 70) {
        const k = r(),
          w = -30 + r() * 60;
        if (k < 0.4) T.poner(u, w, () => jarra(c, pr, u, w, 114, ["#7A5634", "#9A7448", "#5A3E22"][Math.floor(r() * 3)], k < 0.2));
        else if (k < 0.55)
          T.poner(u, w, () => {
            VOL.elipse(c, pr, u, w, 116, 34, 22, "#9A7448");
            VOL.elipse(c, pr, u, w, 122, 28, 16, "#C89A5A");
          });
        else if (k < 0.65)
          T.poner(u, w, () => {
            VOL.cilindro(c, pr, u, w, 30, 114, 150, HI, { n: 8, tapa: "#5E2C20" });
            if (calidad() === "alta") alfa(c, 0.35, () => VOL.halo(c, pr, u, w, 170, 30, "#F2ECEC", 0.3));
          });
        else if (k < 0.78) T.poner(u, w, () => cuerno(c, pr, u, w, 114));
        else if (k < 0.88)
          T.poner(u, w, () => {
            VOL.elipse(c, pr, u, w, 116, 30, 20, "#E0D4C0");
            VOL.palo(c, pr, u - 14, w, 120, u + 18, w + 4, 126, 4, "#F2ECEC");
          });
        else T.poner(u, w, () => velaEn(c, pr, u, w, 114, 0.6, t, u + w));
      }
      T.dibujar();
    });
    S.dibujar();
  }

  // ---------- La mesa redonda de los forasteros ----------
  // Una rueda de carro hecha mesa sobre un tronco, con tres taburetes; o.mapa: el mapa de los aventureros extendido, con
  // una daga clavada en una esquina; o.copa: la copa que brilla de la álfr.
  function mesaRonda(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr);
    VOL.sombra(c, pr, 0, 0, 170, 140, 0.35);
    [0, 2.1, 4.2].forEach((a) => {
      const u = Math.cos(a + (o.giroBancos || 0)) * 170,
        w = Math.sin(a + (o.giroBancos || 0)) * 170;
      S.poner(u, w, () => VOL.cilindro(c, pr, u, w, 34, 0, 56, ["#3A1A10", "#5A2A16", "#7A3E20"], { n: 7 }));
    });
    S.poner(0, 0, () => {
      VOL.cilindro(c, pr, 0, 0, 30, 0, 100, MC, { n: 8 });
      VOL.cilindro(c, pr, 0, 0, 120, 100, 114, ["#4A2010", "#7A3E20", "#9A5A30"], { n: 12 });
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        VOL.palo(c, pr, Math.cos(a) * 20, Math.sin(a) * 20, 115, Math.cos(a) * 110, Math.sin(a) * 110, 115, 3, "#4A2010");
      }
      if (o.mapa)
        VOL.enPiso(c, pr, (cc) => {
          cc.fillStyle = "#E8DCC0";
          cc.fillRect(-70, -50, 140, 100);
          cc.strokeStyle = "#8A6A3A";
          cc.lineWidth = 2;
          cc.strokeRect(-70, -50, 140, 100);
          cc.beginPath();
          cc.moveTo(-60, 20);
          cc.bezierCurveTo(-30, -30, 10, 40, 60, -20);
          cc.stroke();
          cc.fillStyle = "#9C2315";
          [[-40, -20], [20, 10], [50, -30]].forEach(([a, b]) => cc.fillRect(a - 4, b - 4, 8, 8));
          cc.fillStyle = "#3E5A34";
          for (let k = 0; k < 9; k++) cc.fillRect(-60 + ((k * 37) % 120), -40 + ((k * 23) % 80), 7, 7);
        }, 116);
      if (o.mapa) VOL.palo(c, pr, 60, 40, 116, 64, 44, 160, 5, "#8A8E92");
      if (o.copa) {
        VOL.cono(c, pr, -30, 10, 8, 18, 116, 160, ["#A0B098", "#C8D4C0", "#F2ECEC"], { n: 6, tapa: RUNA });
        if (calidad() !== "baja") VOL.halo(c, pr, -30, 10, 170, 60, RUNA, 0.35 + 0.1 * Math.sin(t * 2));
      }
      if (!o.mapa && !o.copa) {
        jarra(c, pr, -40, -20, 114, "#7A5634", true);
        jarra(c, pr, 30, 20, 114, "#9A7448");
      }
      velaEn(c, pr, 0, -60, 114, 0.6, t, x);
    }, 1);
    S.dibujar();
  }

  // ---------- La rueda de velas ----------
  // Una rueda de carro de hierro colgada de cadenas, con ocho velas gordas; o.z es la altura a la que cuelga.
  function lamparaRueda(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      z = o.z != null ? o.z : 700;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      VOL.palo(c, pr, Math.cos(a) * 130, Math.sin(a) * 130, z, 0, 0, z + 220, 2.5, "#2A2428");
    }
    VOL.palo(c, pr, 0, 0, z + 220, 0, 0, z + 700, 3, "#2A2428");
    // el aro: un anillo de ocho tramos
    const n = 12,
      S = VOL.escena(pr);
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2,
        a1 = ((i + 1) / n) * Math.PI * 2,
        um = Math.cos((a0 + a1) / 2) * 150,
        wm = Math.sin((a0 + a1) / 2) * 150;
      S.poner(um, wm, () => VOL.palo(c, pr, Math.cos(a0) * 150, Math.sin(a0) * 150, z, Math.cos(a1) * 150, Math.sin(a1) * 150, z, 9, "#3A3438"));
      if (i % 3 === 0) S.poner(um, wm, () => {
        const u = Math.cos(a0) * 150,
          w = Math.sin(a0) * 150;
        VOL.cilindro(c, pr, u, w, 12, z, z + 40, ["#C8C0B0", "#F2ECEC", "#FFFFFF"], { n: 6 });
        velaEn(c, pr, u, w, z + 40, 0.01, t, i);
        const p = pr(u, w, z + 44);
        const v = Math.sin(t * 9 + i) * 2 * pr.s;
        P(c, [p[0] + v, p[1] - 26 * pr.s, p[0] - 7 * pr.s, p[1] - 4 * pr.s, p[0] + 7 * pr.s, p[1] - 4 * pr.s], "#FF8D71");
        P(c, [p[0] + v * 0.6, p[1] - 16 * pr.s, p[0] - 3.5 * pr.s, p[1] - 3 * pr.s, p[0] + 3.5 * pr.s, p[1] - 3 * pr.s], "#FFD98A");
      }, 1);
    }
    S.dibujar();
    if (calidad() !== "baja") VOL.halo(c, pr, 0, 0, z + 30, 200, "#FFD98A", 0.3);
  }

  // ---------- La tarima del skald ----------
  // Una tarima redonda de tablas con una piel encima, el taburete de Sølve, dos candiles en pie y el atril con sus hojas
  // de canciones; o.arpa: el arpa apoyada (de día, cuando él no está).
  function tarimaSkald(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr);
    VOL.sombra(c, pr, 0, 0, 250, 250, 0.35);
    VOL.cilindro(c, pr, 0, 0, 230, 0, 40, MC, { n: 14, tapa: "#7A3E20" });
    VOL.enPiso(c, pr, (cc) => {
      cc.beginPath();
      cc.ellipse(0, 10, 150, 110, 0.3, 0, Math.PI * 2);
      cc.fillStyle = "#C8B8A0";
      cc.fill();
      cc.beginPath();
      cc.ellipse(0, 10, 120, 84, 0.3, 0, Math.PI * 2);
      cc.fillStyle = "#A8946C";
      cc.fill();
    }, 41);
    [[-170, -60], [170, -60]].forEach(([u, w]) =>
      S.poner(u, w, () => {
        VOL.palo(c, pr, u, w, 40, u, w, 230, 5, "#2A2428");
        VOL.cilindro(c, pr, u, w, 18, 230, 244, HI, { n: 6 });
        velaEn(c, pr, u, w, 244, 0.7, t, u);
      }),
    );
    S.poner(-20, -40, () => VOL.cilindro(c, pr, -20, -40, 32, 40, 100, ["#3A1A10", "#5A2A16", "#7A3E20"], { n: 7 }));
    S.poner(90, -90, () => {
      VOL.palo(c, pr, 90, -90, 40, 90, -90, 170, 5, "#4A2010");
      VOL.lamina(c, pr, [[60, -80, 160], [120, -80, 160], [120, -100, 200], [60, -100, 200]], "#E8DCC0", "#C8B8A0");
    });
    if (o.arpa)
      S.poner(-60, -10, () => {
        VOL.palo(c, pr, -90, -10, 40, -60, -10, 200, 7, "#7A3E20");
        VOL.palo(c, pr, -60, -10, 200, -10, -10, 160, 7, "#7A3E20");
        VOL.palo(c, pr, -90, -10, 40, -10, -10, 160, 5, "#9A5A30");
        for (let k = 0; k < 5; k++) VOL.palo(c, pr, -82 + k * 14, -10, 60 + k * 10, -64 + k * 11, -10, 190 - k * 8, 1, "#E0D4C0");
      });
    S.dibujar();
  }

  // ---------- El estandarte de Eikholt ----------
  // La tela verde larga con la cornamenta pálida de la capital (la insignia de siempre), el borde de flecos dorados y la
  // vara de donde cuelga; o.z es la altura de la vara y o.largo lo que cae la tela.
  function estandarteEikholt(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      z = o.z != null ? o.z : 400,
      h = o.largo || 300,
      ondea = calidad() === "alta" ? Math.sin(t * 1.3 + x * 0.01) * 4 : 0;
    const tela = (cc, l, hh) => {
      R(cc, 0, -hh, l, hh - 40, "#2C4226");
      P(cc, [0, -40, l, -40, l / 2, 0], "#2C4226");
      R(cc, 0, -hh, l, 8, "#C9A45A");
      R(cc, 6, -hh + 14, l - 12, 4, "#3E5A34");
      DIB.insignia(cc, (u, v) => [l / 2 + u * l * 1.05, -hh + 30 + v * (hh - 110)], "#F2ECEC");
    };
    VOL.palo(c, pr, -70, 0, z, 70, 0, z, 5, "#4A2010");
    [-70, 70].forEach((u) => VOL.cilindro(c, pr, u, 0, 6, z - 6, z + 6, ["#B8862E", "#E8C070", "#FFE7A8"], { n: 6 }));
    VOL.plano(c, pr, -60, 60, ondea, z - h, z - 4, null, tela);
  }

  // ---------- Los escudos de los que no volvieron ----------
  // Tres escudos redondos pintados (de Brunvik, de Havnskar y uno partido), colgados de la pared con dos hachas
  // cruzadas detrás; va contra la pared, con el frente hacia la sala.
  function escudosPared(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      z = o.z != null ? o.z : 160;
    const disco = (u, zz, r, a, b, partido) => {
      const pts = Array.from({ length: 12 }, (_, i) => {
        const q = (i / 12) * Math.PI * 2;
        return [u - Math.cos(q) * r, 6, zz + Math.sin(q) * r];
      }).reverse();
      const s = pts.map((q) => pr(q[0], q[1], q[2]));
      if (VOL.area(s) * pr.e >= -0.01) return;
      c.beginPath();
      s.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
      c.closePath();
      c.fillStyle = a;
      c.fill();
      VOL.cara(c, pr, [[u - r * 0.7, 7, zz - r * 0.7], [u, 7, zz - r * 0.7], [u, 7, zz + r * 0.7], [u - r * 0.7, 7, zz + r * 0.7]], b);
      if (partido) VOL.cara(c, pr, [[u, 8, zz - r], [u + r * 0.15, 8, zz - r], [u + r * 0.05, 8, zz + r], [u - r * 0.1, 8, zz + r]], "#2A1008");
      const m = pr(u, 9, zz);
      E(c, m[0], m[1], 9 * pr.s, 8 * pr.s, "#B8BCC0");
    };
    VOL.palo(c, pr, -150, 4, z - 60, 150, 4, z + 120, 7, "#6B4A2C");
    VOL.palo(c, pr, 150, 4, z - 60, -150, 4, z + 120, 7, "#6B4A2C");
    [[-150, z + 120], [150, z + 120]].forEach(([u, zz]) => VOL.caja(c, pr, u - 30, 2, zz - 20, u + 30, 8, zz + 14, HI));
    disco(-170, z, 76, "#9C2315", "#F2ECEC");
    disco(170, z, 76, "#3E4E66", "#C9A45A");
    disco(0, z + 30, 90, "#5E4430", "#E0D4C0", true);
  }

  // ---------- Los hongos dorados de las vigas ----------
  // Un racimo de hongos de sombrero dorado que crece de una viga o de un poste y brilla despacio; o.z es la altura.
  function hongosDorados(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      z = o.z || 0,
      r = azar(o.sem ? Math.round(o.sem * 59) : 5),
      n = 5,
      S = VOL.escena(pr);
    const pulso = 0.5 + 0.5 * Math.sin(t * 1.1 + x * 0.01);
    if (calidad() !== "baja") VOL.halo(c, pr, 0, 20, z + 30, 110, "#FFD98A", 0.2 + pulso * 0.15);
    for (let i = 0; i < n; i++) {
      const u = -40 + r() * 80,
        w = 6 + r() * 26,
        zz = z + r() * 60,
        k = 0.6 + r() * 0.6;
      S.poner(u, w, () => {
        VOL.cilindro(c, pr, u, w, 5 * k, zz, zz + 22 * k, ["#C8B8A0", "#E0D4C0", "#F2ECEC"], { n: 5 });
        VOL.cono(c, pr, u, w, 20 * k, 4 * k, zz + 20 * k, zz + 36 * k, ["#B8862E", "#E8C070", "#FFE7A8"], { n: 7 });
      }, zz);
    }
    S.dibujar();
  }

  Object.assign(ASSETS.LISTA, {
    fogonHongo: { f: fogonHongo, vol: true, alto: 1500, choque: null, grupo: "hongo" },
    barraHongo: { f: barraHongo, vol: true, alto: 260, choque: null, grupo: "hongo" },
    estanteJarras: { f: estanteJarras, vol: true, alto: 450, choque: null, grupo: "hongo" },
    tonelesHongo: { f: tonelesHongo, vol: true, alto: 330, choque: null, grupo: "hongo" },
    mesaLarga: { f: mesaLarga, vol: true, alto: 200, choque: null, grupo: "hongo" },
    mesaRonda: { f: mesaRonda, vol: true, alto: 200, choque: null, grupo: "hongo" },
    lamparaRueda: { f: lamparaRueda, vol: true, alto: 850, choque: null, grupo: "hongo" },
    tarimaSkald: { f: tarimaSkald, vol: true, alto: 260, choque: null, grupo: "hongo" },
    estandarteEikholt: { f: estandarteEikholt, vol: true, alto: 420, choque: null, grupo: "hongo" },
    escudosPared: { f: escudosPared, vol: true, alto: 300, choque: null, grupo: "hongo" },
    hongosDorados: { f: hongosDorados, vol: true, alto: 110, choque: null, grupo: "hongo" },
  });
  Object.assign(ASSETS.EJEMPLO, {
    lamparaRueda: { z: 120 },
    estandarteEikholt: { z: 400 },
    escudosPared: { z: 120 },
    mesaRonda: { mapa: true },
    tarimaSkald: { arpa: true },
  });
})();
