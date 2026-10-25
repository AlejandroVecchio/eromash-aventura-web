// ---------- las zonas del generador: mazmorras, islas y lo que las une ----------
// Lo que se pone en el bosque para entrar (la boca de la cripta, la barca de las islas), lo que hay adentro de una
// mazmorra (la antorcha de pared, la escalera que sube, el pilar de la cripta) y lo grande de las tierras generadas
// (el volcán, la boca de la cueva). Caras planas, luz de arriba a la derecha, sombra elíptica en el piso.
(function () {
  "use strict";
  const { P, E, R, L, alfa, sombra, halo } = DIB;
  const PIEDRA = ["#4A4642", "#55504A", "#3E3A36", "#625C54"],
    PIEDRA_L = "#6E6860",
    PIEDRA_S = "#2E2A27";

  // ---------- La boca de la cripta ----------
  // Un montículo de tierra y piedra con un arco de dos jambas y un dintel con runas, escalones que bajan a lo oscuro y
  // dos antorchas apagadas a los costados. o.runa: la runa del dintel. o.luz: algo brilla abajo (la mazmorra despierta).
  function bocaMazmorra(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 10 * s, y + 6 * s, 210 * s, 40 * s, 0.5);
    // el montículo
    P(c, [x - 230 * s, y + 10 * s, x - 200 * s, y - 90 * s, x - 110 * s, y - 170 * s, x + 20 * s, y - 196 * s, x + 140 * s, y - 160 * s, x + 220 * s, y - 80 * s, x + 236 * s, y + 10 * s], "#3A4A2E");
    P(c, [x - 230 * s, y + 10 * s, x - 200 * s, y - 90 * s, x - 110 * s, y - 170 * s, x + 20 * s, y - 196 * s, x - 10 * s, y + 10 * s], "#2E3C24");
    P(c, [x + 20 * s, y - 196 * s, x + 140 * s, y - 160 * s, x + 120 * s, y - 120 * s, x + 30 * s, y - 150 * s], "#4E6238");
    // el hueco y los escalones
    P(c, [x - 70 * s, y, x + 70 * s, y, x + 70 * s, y - 150 * s, x - 70 * s, y - 150 * s], "#0A0807");
    for (let k = 0; k < 4; k++) {
      const yy = y - 14 * s - k * 20 * s,
        w = (64 - k * 8) * s;
      P(c, [x - w, yy + 10 * s, x + w, yy + 10 * s, x + w - 4 * s, yy, x - w + 4 * s, yy], k % 2 ? "#2A2622" : "#332E2A");
    }
    if (o.luz) halo(c, x, y - 70 * s, 90 * s, "#9A6BD8", 0.3 + 0.1 * Math.sin(t * 2));
    // las jambas y el dintel
    [[-1, PIEDRA[2]], [1, PIEDRA[3]]].forEach(([lado, col]) => {
      const jx = x + lado * 88 * s;
      P(c, [jx - 22 * s, y + 4 * s, jx + 22 * s, y + 4 * s, jx + 20 * s, y - 170 * s, jx - 20 * s, y - 170 * s], col);
      P(c, [jx, y + 4 * s, jx + 22 * s, y + 4 * s, jx + 20 * s, y - 170 * s, jx, y - 170 * s], lado > 0 ? PIEDRA_L : PIEDRA[1]);
    });
    P(c, [x - 124 * s, y - 166 * s, x + 124 * s, y - 166 * s, x + 116 * s, y - 206 * s, x - 116 * s, y - 206 * s], PIEDRA[1]);
    P(c, [x, y - 166 * s, x + 124 * s, y - 166 * s, x + 116 * s, y - 206 * s, x, y - 206 * s], PIEDRA_L);
    if (window.FUTHARK) ["hagalaz", o.runa || "perthro", "naudiz"].forEach((rn, k) => FUTHARK.dibujar(c, rn, x + (k - 1) * 60 * s, y - 172 * s, 24 * s, o.luz ? "#9A6BD8" : "#2A2622", 3 * s));
    // las antorchas apagadas, clavadas en la tierra
    [-1, 1].forEach((lado) => {
      const ax = x + lado * 150 * s;
      R(c, ax - 4 * s, y - 110 * s, 8 * s, 116 * s, "#3A2A1C");
      P(c, [ax - 10 * s, y - 110 * s, ax + 10 * s, y - 110 * s, ax + 7 * s, y - 128 * s, ax - 7 * s, y - 128 * s], "#2A2420");
    });
  }

  // ---------- La barca de las islas ----------
  // Un bote de remos de tablas trincadas con proa alta, atado a un poste, con un remo cruzado y un farol.
  function barcaVikinga(c, x, y, t, o) {
    const s = o.s || 1,
      mece = Math.sin(t * 1.4 + x) * 3 * s;
    alfa(c, 0.4, () => E(c, x, y + 6 * s, 170 * s, 22 * s, "#1E3A48"));
    c.save();
    c.translate(0, mece);
    P(c, [x - 160 * s, y - 40 * s, x + 150 * s, y - 40 * s, x + 110 * s, y, x - 120 * s, y], "#55301C");
    P(c, [x - 160 * s, y - 40 * s, x, y - 40 * s, x, y, x - 120 * s, y], "#40220F");
    for (let k = 1; k < 3; k++) L(c, x - 150 * s + k * 10 * s, y - 40 * s + k * 13 * s, x + 140 * s - k * 12 * s, y - 40 * s + k * 13 * s, "#2A140A", 3 * s);
    // la proa con la cabeza tallada
    P(c, [x + 130 * s, y - 40 * s, x + 162 * s, y - 92 * s, x + 182 * s, y - 100 * s, x + 176 * s, y - 84 * s, x + 150 * s, y - 40 * s], "#661610");
    E(c, x + 174 * s, y - 94 * s, 3 * s, 3 * s, "#FFD98A");
    P(c, [x - 150 * s, y - 40 * s, x - 168 * s, y - 76 * s, x - 158 * s, y - 80 * s, x - 136 * s, y - 40 * s], "#4A0E08");
    // el remo
    L(c, x - 40 * s, y - 50 * s, x + 90 * s, y + 8 * s, "#8A6A4A", 6 * s);
    c.restore();
    // el poste y el farol
    R(c, x - 196 * s, y - 120 * s, 14 * s, 130 * s, "#3A2A1C");
    R(c, x - 189 * s, y - 120 * s, 7 * s, 130 * s, "#55402A");
    halo(c, x - 189 * s, y - 132 * s, 50 * s, "#FFD98A", 0.6 + Math.sin(t * 7) * 0.05);
    P(c, [x - 200 * s, y - 120 * s, x - 178 * s, y - 120 * s, x - 182 * s, y - 146 * s, x - 196 * s, y - 146 * s], "#2A2420");
    R(c, x - 194 * s, y - 142 * s, 10 * s, 18 * s, "#FFD98A");
  }

  // ---------- La antorcha de pared ----------
  // Soporte de hierro con un mango envuelto en brea. o.encendida: la llama baila y alumbra.
  function antorchaPared(c, x, y, t, o) {
    const s = o.s || 1;
    R(c, x - 14 * s, y - 6 * s, 28 * s, 8 * s, "#2A2420");
    P(c, [x - 5 * s, y, x + 5 * s, y, x + 8 * s, y - 50 * s, x - 2 * s, y - 50 * s], "#4A3020");
    P(c, [x - 9 * s, y - 46 * s, x + 11 * s, y - 46 * s, x + 9 * s, y - 64 * s, x - 7 * s, y - 64 * s], "#1E1A18");
    if (!o.encendida) return;
    const v = Math.sin(t * 11 + x) * 3 * s;
    halo(c, x, y - 76 * s, 70 * s, "#FF8D71", 0.75);
    P(c, [x + v, y - 104 * s, x - 11 * s, y - 70 * s, x, y - 60 * s, x + 11 * s, y - 70 * s], "#FF8D71");
    P(c, [x + v * 0.6, y - 92 * s, x - 6 * s, y - 68 * s, x + 6 * s, y - 68 * s], "#FFD98A");
  }

  // ---------- La escalera de la cripta ----------
  // Peldaños de piedra que suben a la luz, con la luz del día cayendo sobre el primero.
  function escaleraMazmorra(c, x, y, t, o) {
    const s = o.s || 1;
    alfa(c, 0.18, () => P(c, [x - 60 * s, y - 210 * s, x + 60 * s, y - 210 * s, x + 110 * s, y + 10 * s, x - 110 * s, y + 10 * s], "#FFD98A"));
    for (let k = 0; k < 6; k++) {
      const yy = y - k * 32 * s,
        w = (100 - k * 8) * s;
      P(c, [x - w, yy, x + w, yy, x + w - 4 * s, yy - 18 * s, x - w + 4 * s, yy - 18 * s], k % 2 ? PIEDRA[0] : PIEDRA[1]);
      P(c, [x - w + 4 * s, yy - 18 * s, x + w - 4 * s, yy - 18 * s, x + w - 8 * s, yy - 32 * s, x - w + 8 * s, yy - 32 * s], PIEDRA_L);
    }
  }

  // ---------- El pilar de la cripta ----------
  // Columna gruesa de piedra con hiladas, una runa tallada y un zócalo ancho.
  function pilarCripta(c, x, y, t, o) {
    const s = o.s || 1,
      h = 300 * s;
    sombra(c, x + 6 * s, y + 4 * s, 70 * s, 16 * s, 0.5);
    P(c, [x - 64 * s, y, x + 64 * s, y, x + 58 * s, y - 30 * s, x - 58 * s, y - 30 * s], PIEDRA[2]);
    P(c, [x, y, x + 64 * s, y, x + 58 * s, y - 30 * s, x, y - 30 * s], PIEDRA_L);
    P(c, [x - 44 * s, y - 30 * s, x + 44 * s, y - 30 * s, x + 40 * s, y - h, x - 40 * s, y - h], PIEDRA[0]);
    P(c, [x + 4 * s, y - 30 * s, x + 44 * s, y - 30 * s, x + 40 * s, y - h, x + 4 * s, y - h], PIEDRA[3]);
    for (let k = 1; k < 5; k++) L(c, x - 43 * s, y - 30 * s - k * 54 * s, x + 43 * s, y - 30 * s - k * 54 * s, PIEDRA_S, 2 * s);
    P(c, [x - 56 * s, y - h, x + 56 * s, y - h, x + 50 * s, y - h - 24 * s, x - 50 * s, y - h - 24 * s], PIEDRA[1]);
    if (window.FUTHARK) FUTHARK.dibujar(c, o.runa || "eihwaz", x + 22 * s, y - 150 * s, 30 * s, "#9A6BD8", 3 * s);
  }

  // ---------- El volcán ----------
  // Un cono de roca negra con laderas de ceniza, ríos de lava que bajan del cráter, el resplandor rojo y el humo.
  function volcan(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 30 * s, y + 10 * s, 620 * s, 120 * s, 0.45);
    P(c, [x - 640 * s, y, x - 360 * s, y - 360 * s, x - 150 * s, y - 640 * s, x + 150 * s, y - 650 * s, x + 380 * s, y - 360 * s, x + 660 * s, y], "#3A3432");
    P(c, [x - 640 * s, y, x - 360 * s, y - 360 * s, x - 150 * s, y - 640 * s, x - 20 * s, y - 646 * s, x - 60 * s, y], "#2A2422");
    P(c, [x + 40 * s, y - 640 * s, x + 150 * s, y - 650 * s, x + 380 * s, y - 360 * s, x + 260 * s, y - 330 * s], "#4A4240");
    // el cráter
    E(c, x, y - 646 * s, 150 * s, 32 * s, "#1A1414");
    halo(c, x, y - 650 * s, 260 * s, "#FF8D71", 0.5 + 0.12 * Math.sin(t * 1.7));
    E(c, x, y - 644 * s, 120 * s, 22 * s, "#C8402D");
    E(c, x + 10 * s, y - 646 * s, 70 * s, 12 * s, "#FF8D71");
    // los ríos de lava
    [[-40, -200, -260], [30, 140, 360], [-10, -40, -40]].forEach(([a, b, e2], k) => {
      c.beginPath();
      c.moveTo(x + a * s, y - 636 * s);
      c.quadraticCurveTo(x + b * s, y - 360 * s, x + e2 * s, y - 30 * s);
      c.strokeStyle = "#9C2315";
      c.lineWidth = (26 - k * 6) * s;
      c.stroke();
      alfa(c, 0.7 + 0.2 * Math.sin(t * 2 + k), () => {
        c.strokeStyle = "#FF8D71";
        c.lineWidth = (10 - k * 2) * s;
        c.stroke();
      });
    });
    // el humo
    for (let k = 0; k < 5; k++) {
      const u = (t * 0.12 + k / 5) % 1;
      alfa(c, (1 - u) * 0.45, () => E(c, x + Math.sin(k * 2 + t * 0.3) * 60 * s + u * 140 * s, y - 700 * s - u * 520 * s, (60 + u * 140) * s, (40 + u * 90) * s, k % 2 ? "#4A4442" : "#5A5452"));
    }
  }

  // ---------- La boca de la cueva ----------
  // Una pila de rocas grandes con un hueco negro al pie y el aire frío que sale.
  function bocaCueva(c, x, y, t, o) {
    const s = o.s || 1;
    sombra(c, x + 10 * s, y + 6 * s, 200 * s, 36 * s, 0.5);
    const rocas = [[-150, -60, 90, 2], [140, -50, 96, 3], [-60, -150, 110, 0], [70, -160, 120, 1], [0, -230, 90, 2]];
    rocas.forEach(([dx, dy, r, k]) => {
      const px = x + dx * s,
        py = y + dy * s,
        rr = r * s;
      P(c, [px - rr, py + rr * 0.6, px - rr * 0.8, py - rr * 0.6, px - rr * 0.1, py - rr, px + rr * 0.8, py - rr * 0.7, px + rr, py + rr * 0.5], PIEDRA[k]);
      P(c, [px - rr * 0.1, py - rr, px + rr * 0.8, py - rr * 0.7, px + rr, py + rr * 0.5, px + rr * 0.2, py + rr * 0.6], PIEDRA_L);
    });
    P(c, [x - 90 * s, y + 4 * s, x - 100 * s, y - 90 * s, x - 50 * s, y - 150 * s, x + 50 * s, y - 150 * s, x + 96 * s, y - 90 * s, x + 90 * s, y + 4 * s], "#0A0807");
    alfa(c, 0.3 + 0.1 * Math.sin(t * 1.5), () => E(c, x, y - 60 * s, 50 * s, 60 * s, "#2A3A5A"));
    if (o.luz) halo(c, x, y - 60 * s, 110 * s, "#FF8D71", 0.35 + 0.1 * Math.sin(t * 3));
  }

  // ======================================================================
  //  ARMADAS CON CARAS (todo girable, comun/volumen.js)
  // ======================================================================
  const TP = [PIEDRA[2], PIEDRA[1], PIEDRA_L],
    MAD = ["#2A1E14", "#3A2A1C", "#55402A"];
  // la boca de la cripta: el montículo, el hueco negro con los escalones que bajan, las jambas, el dintel con runas y
  // las antorchas apagadas
  function bocaMazmorraV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr);
    VOL.sombra(c, pr, 10, -40, 230, 150, 0.5);
    S.poner(0, -70, () => {
      VOL.cono(c, pr, 0, -80, 230, 110, 0, 150, ["#2E3C24", "#3A4A2E", "#4E6238"], { n: 12, sinTapa: true });
      VOL.cono(c, pr, 0, -80, 110, 40, 150, 196, ["#2E3C24", "#3A4A2E", "#4E6238"], { n: 12, tapa: "#3A4A2E" });
    });
    S.poner(0, 60, () => {
      VOL.plano(c, pr, -70, 70, 50, 0, 150, "#0A0807", (cc, l) => {
        for (let k = 0; k < 4; k++) {
          const yy = -14 - k * 20,
            w = 64 - k * 8;
          P(cc, [l / 2 - w, yy + 10, l / 2 + w, yy + 10, l / 2 + w - 4, yy, l / 2 - w + 4, yy], k % 2 ? "#2A2622" : "#332E2A");
        }
      });
      if (o.luz) VOL.halo(c, pr, 0, 50, 70, 90, "#9A6BD8", 0.3 + 0.1 * Math.sin(t * 2));
      [-88, 88].forEach((u) => VOL.cubo(c, pr, u, 50, 42, 36, 170, TP));
      VOL.caja(c, pr, -124, 32, 166, 124, 68, 206, TP, {
        frente: (cc, l, h) => {
          if (window.FUTHARK) ["hagalaz", o.runa || "perthro", "naudiz"].forEach((rn, k) => FUTHARK.dibujar(cc, rn, l / 2 + (k - 1) * 60, -6, 24, o.luz ? "#9A6BD8" : "#2A2622", 3));
        },
      });
    });
    [-150, 150].forEach((u) =>
      S.poner(u, 50, () => {
        VOL.cubo(c, pr, u, 50, 8, 8, 110, MAD);
        VOL.cono(c, pr, u, 50, 7, 10, 110, 128, ["#1A1614", "#2A2420", "#3A3430"], { n: 6 });
      }),
    );
    S.dibujar();
  }
  // la barca de las islas: el casco de tablas trincadas (más angosto abajo), la proa alta con la cabeza tallada, la
  // popa, el remo cruzado, el poste y el farol, meciéndose en el agua
  function barcaVikingaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      mece = Math.sin(t * 1.4 + x) * 3;
    VOL.enPiso(c, pr, (cc) => alfa(cc, 0.4, () => E(cc, 0, 0, 180, 60, "#1E3A48")));
    const arriba = [[-150, 0], [-110, -34], [0, -42], [110, -34], [140, 0], [110, 34], [0, 42], [-110, 34]],
      abajo = arriba.map(([u, w]) => [u * 0.8, w * 0.45]),
      z0 = mece,
      z1 = 40 + mece,
      CA = ["#40220F", "#55301C", "#6E4228"],
      caras = [];
    for (let i = 0; i < arriba.length; i++) {
      const j = (i + 1) % arriba.length,
        q = VOL.afuera([[abajo[i][0], abajo[i][1], z0], [abajo[j][0], abajo[j][1], z0], [arriba[j][0], arriba[j][1], z1], [arriba[i][0], arriba[i][1], z1]], [(arriba[i][0] + arriba[j][0]) / 2, (arriba[i][1] + arriba[j][1]) / 2, 0]);
      caras.push(q);
    }
    // adentro primero (lo que se ve por encima de la borda), después las tablas de afuera
    VOL.enPiso(c, pr, (cc) => P(cc, arriba.flat().map((v, k) => (k % 2 ? v * 0.9 : v * 0.95)), "#2A140A"), z1 - 2);
    caras.sort((a, b) => pr.hondo(a[0][0] + a[2][0], a[0][1] + a[2][1]) - pr.hondo(b[0][0] + b[2][0], b[0][1] + b[2][1]));
    caras.forEach((q) => VOL.cara(c, pr, q, CA, (cc, nx) => {
      cc.strokeStyle = "#2A140A";
      cc.lineWidth = 0.04;
      [0.33, 0.66].forEach((f) => {
        cc.beginPath();
        cc.moveTo(0, -f);
        cc.lineTo(1, -f);
        cc.stroke();
      });
      void nx;
    }));
    VOL.palo(c, pr, 130, 0, z1 - 4, 162, 0, z1 + 52, 9, "#661610");
    VOL.palo(c, pr, 162, 0, z1 + 52, 182, 0, z1 + 58, 7, "#661610");
    const ojo = pr(176, 0, z1 + 56);
    E(c, ojo[0], ojo[1], 3 * pr.s, 3 * pr.s, "#FFD98A");
    VOL.palo(c, pr, -140, 0, z1 - 4, -164, 0, z1 + 36, 8, "#4A0E08");
    VOL.palo(c, pr, -40, -10, z1 + 6, 90, 50, z0, 6, "#8A6A4A");
    VOL.cubo(c, pr, -190, -50, 14, 14, 130, MAD);
    VOL.cubo(c, pr, -190, -50, 14, 14, 26, ["#1A1614", "#2A2420", "#2A2420"], { frente: (cc, l, h) => R(cc, 2, -h + 4, l - 4, h - 8, "#FFD98A"), der: (cc, l, h) => R(cc, 2, -h + 4, l - 4, h - 8, "#FFD98A"), izq: (cc, l, h) => R(cc, 2, -h + 4, l - 4, h - 8, "#FFD98A"), atras: (cc, l, h) => R(cc, 2, -h + 4, l - 4, h - 8, "#FFD98A") }, 120);
    VOL.halo(c, pr, -190, -50, 132, 50, "#FFD98A", 0.6 + Math.sin(t * 7) * 0.05);
  }
  // la antorcha de pared: el soporte contra el muro, el mango con brea que sale hacia adelante y la llama
  function antorchaParedV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.caja(c, pr, -14, -4, -6, 14, 4, 2, ["#1A1614", "#2A2420", "#3A3430"]);
    VOL.palo(c, pr, 0, 0, 0, 0, 8, 46, 7, "#4A3020");
    VOL.cono(c, pr, 0, 8, 8, 10, 46, 64, ["#141210", "#1E1A18", "#2A2420"], { n: 6 });
    if (!o.encendida) return;
    const q = pr(0, 8, 62),
      s = pr.s,
      v = Math.sin(t * 11 + x) * 3 * s;
    VOL.halo(c, pr, 0, 8, 76, 70, "#FF8D71", 0.75);
    P(c, [q[0] + v, q[1] - 42 * s, q[0] - 11 * s, q[1] - 8 * s, q[0], q[1] + 2 * s, q[0] + 11 * s, q[1] - 8 * s], "#FF8D71");
    P(c, [q[0] + v * 0.6, q[1] - 30 * s, q[0] - 6 * s, q[1] - 6 * s, q[0] + 6 * s, q[1] - 6 * s], "#FFD98A");
  }
  // la escalera de la cripta: seis peldaños que suben hacia atrás y la luz del día que cae sobre ellos
  function escaleraMazmorraV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    for (let k = 5; k >= 0; k--) {
      const w = 100 - k * 8;
      VOL.caja(c, pr, -w, -k * 28 - 28, 0, w, -k * 28, (k + 1) * 32, [PIEDRA[2], k % 2 ? PIEDRA[0] : PIEDRA[1], PIEDRA_L]);
    }
    const a = pr(-60, -168, 192),
      b = pr(60, -168, 192),
      c2 = pr(110, 10, 0),
      d = pr(-110, 10, 0);
    alfa(c, 0.18, () => P(c, [a[0], a[1], b[0], b[1], c2[0], c2[1], d[0], d[1]], "#FFD98A"));
  }
  // el pilar de la cripta: el zócalo ancho, la columna con hiladas y la runa adelante, y el capitel
  function pilarCriptaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      h = 300,
      hiladas = (runa) => (cc, l, hh) => {
        for (let k = 1; k < 5; k++) L(cc, 0, -k * 54, l, -k * 54, PIEDRA_S, 2);
        if (runa && window.FUTHARK) FUTHARK.dibujar(cc, o.runa || "eihwaz", l / 2, -120 + 15, 30, "#9A6BD8", 3);
      };
    VOL.sombra(c, pr, 6, 0, 72, 50, 0.5);
    VOL.caja(c, pr, -64, -50, 0, 64, 50, 30, TP);
    VOL.caja(c, pr, -42, -32, 30, 42, 32, h, [PIEDRA[2], PIEDRA[0], PIEDRA[3]], { frente: hiladas(true), atras: hiladas(), izq: hiladas(), der: hiladas(), sinTapa: true });
    VOL.caja(c, pr, -56, -42, h, 56, 42, h + 24, TP);
  }
  // la boca de la cueva: las rocas grandes apiladas, el hueco negro al pie y el aire frío que sale
  function bocaCuevaV(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr);
    VOL.sombra(c, pr, 10, -40, 210, 120, 0.5);
    [[-150, -10, 90, 0, 2], [140, -10, 96, 0, 3], [-70, -60, 110, 70, 0], [70, -60, 120, 70, 1], [0, -90, 90, 180, 2], [0, -110, 120, 0, 0]].forEach(([u, w, r, z, k], i) =>
      S.poner(u, w, () => {
        const pl = VOL.redonda(u, w, r, 7, i * 0.7, r * 0.7);
        VOL.prisma(c, pr, pl, z, z + r * 0.9, [PIEDRA[2], PIEDRA[k], PIEDRA_L], { tapa: PIEDRA_L });
      }, z),
    );
    S.poner(0, 40, () => {
      VOL.plano(c, pr, -95, 95, 0, 0, 150, null, (cc, l, h) => {
        P(cc, [l / 2 - 90, 4, l / 2 - 100, -90, l / 2 - 50, -150, l / 2 + 50, -150, l / 2 + 96, -90, l / 2 + 90, 4], "#0A0807");
        alfa(cc, 0.3 + 0.1 * Math.sin(t * 1.5), () => E(cc, l / 2, -60, 50, 60, "#2A3A5A"));
      }, () => {});
      if (o.luz) VOL.halo(c, pr, 0, 0, 60, 110, "#FF8D71", 0.35 + 0.1 * Math.sin(t * 3));
    }, 300);
    S.dibujar();
  }

  Object.assign(ASSETS.LISTA, {
    bocaMazmorra: { f: bocaMazmorra, fv: bocaMazmorraV, vol: true, alto: 220, choque: { w: 300, h: 40 }, grupo: "zonas" },
    barcaVikinga: { f: barcaVikinga, fv: barcaVikingaV, vol: true, alto: 150, choque: null, grupo: "zonas" },
    antorchaPared: { f: antorchaPared, fv: antorchaParedV, vol: true, alto: 110, choque: null, grupo: "zonas" },
    escaleraMazmorra: { f: escaleraMazmorra, fv: escaleraMazmorraV, vol: true, alto: 220, choque: null, grupo: "zonas" },
    pilarCripta: { f: pilarCripta, fv: pilarCriptaV, vol: true, alto: 330, choque: { r: 60 }, grupo: "zonas" },
    volcan: { f: volcan, figura: true, alto: 1200, choque: { r: 520 }, grupo: "zonas" },
    bocaCueva: { f: bocaCueva, fv: bocaCuevaV, vol: true, alto: 330, choque: { w: 260, h: 40 }, grupo: "zonas" },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, { antorchaPared: { encendida: true }, bocaMazmorra: { luz: true } });
})();
