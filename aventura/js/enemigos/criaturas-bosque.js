// ---------- las criaturas del bosque profundo (se suman a CRIATURAS) ----------
// Diseños propios de Eromash, en tres vistas (S frente, E costado, N espaldas), con la base en (0, 0).
// Cada una tiene variantes de color (o.pal 0..2) para que cada grupo se distinga; el líder del grupo además es más
// grande y lleva su aura (lo dibuja COMBATE).
//  · Draugr del túmulo: guerrero muerto de piel verdosa, yelmo de anteojeras oxidado, escudo partido y hacha barbuda.
//  · Jabalí de musgo: jabalí viejo con un manto de musgo y dos piedras en el lomo; embiste en línea recta.
//  · Cuervo de Hel: cuervo enorme que vuela bajo y cae en picada; ojos de brasa.
//  · Fuego fatuo: llama fría con una cara de niebla; flota lejos y hace caer luz del cielo donde estás.
//  · Oso de zarzal: oso pardo con un manto de zarzas, ataduras violetas y un ojo nublado; se para para golpear.
//  · Trol de musgo: piedra con liquen, brazos largos y un pino arrancado de garrote; golpea el piso.
(function () {
  "use strict";
  const { P, E, R, L, alfa, sombra, halo } = DIB;

  // ---------- Draugr del túmulo ----------
  const PAL_DRAUGR = [
    { piel: "#7FA08E", pielS: "#5E7E6E", ojo: "#8CF0B4", capa: "#5E130D", escudo: "#2C4A3A" }, // verde de túmulo
    { piel: "#9A9890", pielS: "#76746E", ojo: "#FF8D71", capa: "#2A2220", escudo: "#5E130D" }, // ceniza de Skarnholt
    { piel: "#8FB0C8", pielS: "#6A8AA2", ojo: "#C8F2F4", capa: "#2C384C", escudo: "#E0B2B2" }, // escarcha
  ];
  function draugr(c, t, o) {
    const v = o.vista || "S",
      m = o.mov || 0,
      pal = PAL_DRAUGR[o.pal || 0],
      paso = Math.sin(t * 6) * 6 * m,
      g = o.golpe || 0,
      bob = Math.abs(Math.sin(t * 6)) * 2 * m;
    const yelmo = "#7A6A44",
      yelmoS = "#5A4A30",
      hierro = "#4A4448",
      hoja = "#B8B0A8";
    sombra(c, 0, 0, 26, 7, 0.42);
    const Y = (y) => y - bob;
    // el hacha: sube por encima de la cabeza durante el aviso
    const hacha = (hx, hy, lado) => {
      c.save();
      c.translate(hx, hy);
      c.rotate(lado * (0.3 - g * 2.4));
      R(c, -2, -46, 4, 56, "#553A22");
      P(c, [2, -46, 18, -54, 22, -36, 2, -34], hoja);
      P(c, [2, -46, 10, -50, 10, -36, 2, -34], "#8A847E");
      c.restore();
    };
    if (v === "E") {
      P(c, [-8, Y(-38), 0, Y(-38), 2 - paso, 0, -6 - paso, 0], pal.pielS);
      P(c, [-4, Y(-38), 4, Y(-38), 6 + paso, 0, -2 + paso, 0], pal.piel);
      R(c, -8 + paso, -5, 12, 5, "#2A2220");
      // capa por detrás
      P(c, [-10, Y(-80), -24, Y(-20) + Math.sin(t * 3) * 3, -8, Y(-30)], pal.capa);
      // torso con cota de malla oxidada
      P(c, [-12, Y(-38), -10, Y(-80), 12, Y(-82), 14, Y(-38)], "#5A5650");
      P(c, [2, Y(-82), 12, Y(-82), 14, Y(-38), 4, Y(-38)], "#6E6A64");
      for (let k = 0; k < 4; k++) L(c, -10, Y(-46 - k * 9), 12, Y(-46 - k * 9), "#46423E", 1);
      R(c, -12, Y(-44), 26, 4, "#3A2A1C");
      // escudo al frente
      E(c, 14, Y(-58), 8, 20, pal.escudo);
      E(c, 16, Y(-58), 3, 6, hierro);
      hacha(-4, Y(-70), -1);
      // cabeza con yelmo de anteojeras
      P(c, [-6, Y(-82), 12, Y(-84), 14, Y(-98), 4, Y(-108), -8, Y(-100)], pal.piel);
      P(c, [-10, Y(-94), -6, Y(-110), 8, Y(-114), 16, Y(-100), 16, Y(-94)], yelmo);
      P(c, [-10, Y(-94), -6, Y(-110), 0, Y(-112), 0, Y(-94)], yelmoS);
      P(c, [8, Y(-94), 18, Y(-94), 16, Y(-86), 8, Y(-88)], yelmoS);
      R(c, 10, Y(-92), 4, 3, pal.ojo);
      // barba rala
      P(c, [2, Y(-84), 14, Y(-84), 8, Y(-72)], "#C8C0B0");
    } else {
      const atras = v === "N";
      P(c, [-12, Y(-38), -3, Y(-38), -3 + paso * 0.3, 0, -12 + paso * 0.3, 0], pal.pielS);
      P(c, [3, Y(-38), 12, Y(-38), 12 - paso * 0.3, 0, 3 - paso * 0.3, 0], pal.piel);
      if (atras) {
        // capa desgarrada cubre la espalda
        P(c, [-18, Y(-80), 18, Y(-80), 22, Y(-18), 10, Y(-26), 0, Y(-14), -10, Y(-24), -22, Y(-18)], pal.capa);
        L(c, -6, Y(-70), -2, Y(-34), "#00000040", 2);
        E(c, -20, Y(-58), 10, 20, pal.escudo);
        hacha(18, Y(-70), 1);
      } else {
        P(c, [-18, Y(-38), -16, Y(-80), 16, Y(-80), 18, Y(-38)], "#5A5650");
        P(c, [0, Y(-80), 16, Y(-80), 18, Y(-38), 0, Y(-38)], "#6E6A64");
        for (let k = 0; k < 4; k++) L(c, -16, Y(-46 - k * 9), 16, Y(-46 - k * 9), "#46423E", 1);
        R(c, -18, Y(-44), 36, 4, "#3A2A1C");
        R(c, -3, Y(-46), 6, 6, "#7A6A44");
        // escudo redondo partido a la izquierda
        E(c, -22, Y(-56), 15, 17, pal.escudo);
        P(c, [-22, Y(-73), -12, Y(-62), -22, Y(-56)], "#111111");
        E(c, -22, Y(-56), 4, 4, hierro);
        hacha(20, Y(-70), 1);
      }
      // brazos
      P(c, [16, Y(-78), 22, Y(-76), 22, Y(-52), 16, Y(-52)], pal.piel);
      const cy = Y(-96);
      P(c, [-10, cy + 12, 10, cy + 12, 9, cy - 4, -9, cy - 4], pal.piel);
      P(c, [-10, cy + 12, 0, cy + 12, 0, cy - 4, -9, cy - 4], pal.pielS);
      P(c, [-12, cy, -10, cy - 14, 0, cy - 18, 10, cy - 14, 12, cy], yelmo);
      P(c, [-12, cy, -10, cy - 14, 0, cy - 18, 0, cy], yelmoS);
      R(c, -1.5, cy - 18, 3, 6, yelmoS);
      if (!atras) {
        // anteojeras con los ojos encendidos
        P(c, [-11, cy, 11, cy, 10, cy + 6, 2, cy + 4, 0, cy + 10, -2, cy + 4, -10, cy + 6], yelmoS);
        R(c, -7, cy + 1, 4, 3, pal.ojo);
        R(c, 3, cy + 1, 4, 3, pal.ojo);
        P(c, [-7, cy + 12, 7, cy + 12, 0, cy + 24], "#C8C0B0");
      }
    }
  }

  // ---------- Jabalí de musgo ----------
  const PAL_JABALI = [
    { pelo: "#5A4232", peloS: "#3E2E22", manto: "#4E5C32", mantoL: "#647A3C", ojo: "#FFD98A" }, // musgo
    { pelo: "#3A3432", peloS: "#262220", manto: "#5E130D", mantoL: "#C8402D", ojo: "#FF8D71" }, // brasa
    { pelo: "#6A6A72", peloS: "#4E4E56", manto: "#B4C8D8", mantoL: "#E0ECF4", ojo: "#C8F2F4" }, // escarcha
  ];
  function jabali(c, t, o) {
    const v = o.vista || "E",
      m = o.mov || 0,
      pal = PAL_JABALI[o.pal || 0],
      paso = Math.sin(t * (m > 1 ? 22 : 12)) * 5 * Math.min(1, m),
      g = o.golpe || 0;
    const colmillo = "#FFF4E0";
    sombra(c, 0, 0, 40, 9, 0.42);
    const piedras = (x, y) => {
      P(c, DIB.poli(x, y, 9, 7, 6, 0.3), "#646A64");
      P(c, DIB.poli(x + 2, y - 2, 5, 4, 5, 0.1), "#7C827A");
    };
    if (v === "E") {
      [[-24, paso], [-14, -paso], [16, -paso], [26, paso]].forEach(([px, d], k) => P(c, [px - 4, -22, px + 4, -22, px + 3 + d * 0.4, 0, px - 3 + d * 0.4, 0], k % 2 ? pal.peloS : pal.pelo));
      // cuerpo ancho, baja la cabeza al cargar
      P(c, [-36, -22, -32, -46, 0, -54, 26, -46, 34, -24, -30, -16], pal.pelo);
      P(c, [-36, -22, -32, -46, -12, -50, -14, -18], pal.peloS);
      // manto de musgo en el lomo y crin
      P(c, [-34, -40, -30, -52, -6, -60, 20, -54, 26, -44, 0, -46], pal.manto);
      for (let k = 0; k < 5; k++) E(c, -24 + k * 10, -52 - (k % 2) * 3, 6, 3, pal.mantoL);
      piedras(-14, -58);
      piedras(4, -60);
      const hx = 34 + g * 6,
        hy = -30 + g * 8;
      P(c, [hx - 10, hy - 14, hx + 4, hy - 16, hx + 20, hy - 4, hx + 22, hy + 6, hx + 2, hy + 10, hx - 8, hy + 6], pal.pelo);
      P(c, [hx - 2, hy - 15, hx + 2, hy - 24, hx + 6, hy - 14], pal.peloS);
      E(c, hx + 22, hy + 2, 4, 5, "#2A2220");
      P(c, [hx + 12, hy + 4, hx + 20, hy - 10, hx + 16, hy + 6], colmillo);
      R(c, hx + 6, hy - 8, 4, 3, pal.ojo);
      // cola
      L(c, -36, -34, -42, -38 + Math.sin(t * 6) * 3, pal.peloS, 2);
    } else {
      const atras = v === "N";
      P(c, [-14, -22, -6, -22, -6 + paso * 0.2, 0, -14 + paso * 0.2, 0], pal.peloS);
      P(c, [6, -22, 14, -22, 14 - paso * 0.2, 0, 6 - paso * 0.2, 0], pal.pelo);
      P(c, [-22, -20, -20, -50, 20, -50, 22, -20], pal.pelo);
      P(c, [-22, -20, -20, -50, 0, -50, 0, -20], pal.peloS);
      P(c, [-20, -46, -14, -60, 14, -60, 20, -46], pal.manto);
      E(c, -6, -58, 7, 3, pal.mantoL);
      piedras(6, -62);
      if (atras) L(c, 0, -26, Math.sin(t * 6) * 4, -18, pal.peloS, 2);
      else {
        const hy = -30 + g * 6;
        P(c, [-14, hy - 12, 14, hy - 12, 12, hy + 10, -12, hy + 10], pal.pelo);
        P(c, [-14, hy - 12, 0, hy - 12, 0, hy + 10, -12, hy + 10], pal.peloS);
        E(c, 0, hy + 8, 8, 5, "#2A2220");
        P(c, [-10, hy + 4, -16, hy - 8, -8, hy + 2], colmillo);
        P(c, [10, hy + 4, 16, hy - 8, 8, hy + 2], colmillo);
        R(c, -8, hy - 4, 4, 3, pal.ojo);
        R(c, 4, hy - 4, 4, 3, pal.ojo);
      }
    }
  }

  // ---------- Cuervo de Hel ----------
  const PAL_CUERVO = [
    { pluma: "#111111", plumaL: "#2A2A30", ojo: "#C8402D", pico: "#3A3634" },
    { pluma: "#E8E0D8", plumaL: "#F2ECEC", ojo: "#9C2315", pico: "#B8A890" }, // albino
    { pluma: "#2C1A2E", plumaL: "#4A2E50", ojo: "#9A6BD8", pico: "#3A3634" }, // de las ataduras
  ];
  function cuervo(c, t, o) {
    const v = o.vista || "E",
      pal = PAL_CUERVO[o.pal || 0],
      g = o.golpe || 0,
      alto = 46 + Math.sin(t * 3 + (o.sem || 0)) * 6 - g * 30,
      ala = Math.sin(t * (g > 0 ? 6 : 16)) * (g > 0.5 ? 4 : 16);
    sombra(c, 0, 0, 18 - g * 4, 5, 0.3);
    c.save();
    c.translate(0, -alto);
    if (v === "E") {
      P(c, [-16, -2, -30, -6, -26, 2], pal.pluma); // cola
      P(c, [-18, 0, -8, -10, 12, -10, 18, -2, 6, 6, -12, 6], pal.pluma);
      // ala que bate
      P(c, [-6, -8, 8, -8, 4 - ala * 0.4, -8 - ala * 1.6 - 10, -14, -8 - ala - 6], pal.plumaL);
      E(c, 20, -8, 7, 6, pal.pluma);
      P(c, [26, -9, 36, -6, 26, -4], pal.pico);
      R(c, 21, -10, 3, 2, pal.ojo);
      L(c, 0, 6, -2, 14, pal.pico, 1.5);
      L(c, 6, 6, 6, 14, pal.pico, 1.5);
    } else {
      const atras = v === "N";
      P(c, [-26 - ala * 0.4, -14 - ala, -4, -6, -6, 4], pal.plumaL);
      P(c, [26 + ala * 0.4, -14 - ala, 4, -6, 6, 4], pal.plumaL);
      P(c, [-8, -10, 8, -10, 10, 8, 0, 14, -10, 8], pal.pluma);
      E(c, 0, -14, 7, 7, pal.pluma);
      if (!atras) {
        P(c, [-3, -12, 3, -12, 0, -2], pal.pico);
        R(c, -5, -17, 3, 2, pal.ojo);
        R(c, 2, -17, 3, 2, pal.ojo);
      } else P(c, [-6, 10, 6, 10, 0, 22], pal.pluma);
    }
    c.restore();
  }

  // ---------- Fuego fatuo ----------
  const PAL_FATUO = [
    { luz: "#8CF0B4", centro: "#E6FFF0", niebla: "#3E6E58" }, // del pantano
    { luz: "#73D5DB", centro: "#E8FCFF", niebla: "#2E5A66" }, // rúnico
    { luz: "#9A6BD8", centro: "#F0E6FF", niebla: "#4A3A6E" }, // de Hel
  ];
  function fatuo(c, t, o) {
    const pal = PAL_FATUO[o.pal || 0],
      g = o.golpe || 0,
      alto = 52 + Math.sin(t * 2.2 + (o.sem || 0)) * 8,
      late = 0.8 + Math.sin(t * 9) * 0.1 + g * 0.4;
    sombra(c, 0, 0, 14, 4, 0.22);
    halo(c, 0, -alto, 60 + g * 30, pal.luz, late);
    c.save();
    c.translate(0, -alto);
    // estela de niebla
    for (let k = 0; k < 4; k++) {
      const u = (t * 0.8 + k / 4) % 1;
      alfa(c, (1 - u) * 0.5, () => E(c, Math.sin(t * 2 + k) * 6, 10 + u * 26, 8 - u * 5, 5 - u * 3, pal.niebla));
    }
    // la llama
    const f = (w, h, col) => P(c, [-w, 6, -w * 0.7, -h * 0.4, Math.sin(t * 7) * 3, -h, w * 0.7, -h * 0.4, w, 6, 0, 12], col);
    f(16 + g * 4, 30 + g * 8, pal.niebla);
    f(12 + g * 3, 24 + g * 6, pal.luz);
    f(6, 14, pal.centro);
    // cara de niebla: dos cuencas y una boca alargada
    R(c, -6, -6, 4, 5, pal.niebla);
    R(c, 2, -6, 4, 5, pal.niebla);
    P(c, [-3, 2, 3, 2, 1, 8 + g * 4, -1, 8 + g * 4], pal.niebla);
    c.restore();
  }

  // ---------- Trol de musgo ----------
  const PAL_TROL = [
    { piel: "#6E7A5E", pielS: "#525C44", liquen: "#94A85A", ojo: "#FFD98A" }, // musgo
    { piel: "#7C7A74", pielS: "#5E5C58", liquen: "#A8A49A", ojo: "#C8F2F4" }, // piedra
    { piel: "#6E5640", pielS: "#52402E", liquen: "#9C2315", ojo: "#FF8D71" }, // barro con la marca roja
  ];
  function trol(c, t, o) {
    const v = o.vista || "S",
      m = o.mov || 0,
      pal = PAL_TROL[o.pal || 0],
      paso = Math.sin(t * 4) * 8 * m,
      g = o.golpe || 0,
      bob = Math.abs(Math.sin(t * 4)) * 4 * m;
    sombra(c, 0, 0, 56, 14, 0.45);
    const Y = (y) => y - bob;
    // el garrote: un pino joven arrancado, con las raíces arriba
    const garrote = (x, y, lado) => {
      c.save();
      c.translate(x, y);
      c.rotate(-lado * (0.25 + g * 2.6)); // cuelga al costado y se levanta por encima de la cabeza en el aviso
      P(c, [-5, 0, 5, 0, 8, 100, -8, 100], "#4A3626");
      P(c, [0, 0, 5, 0, 8, 100, 0, 100], "#5C4632");
      for (let k = 0; k < 4; k++) L(c, 0, 100, -14 + k * 9, 116 + (k % 2) * 6, "#30231A", 3);
      c.restore();
    };
    if (v === "E") {
      P(c, [-20, Y(-60), -6, Y(-60), -4 - paso, 0, -24 - paso, 0], pal.pielS);
      P(c, [-4, Y(-60), 12, Y(-60), 16 + paso, 0, -4 + paso, 0], pal.piel);
      // lomo jorobado
      P(c, [-30, Y(-60), -34, Y(-130), -10, Y(-160), 24, Y(-150), 34, Y(-110), 26, Y(-60)], pal.piel);
      P(c, [-30, Y(-60), -34, Y(-130), -10, Y(-160), -8, Y(-60)], pal.pielS);
      for (let k = 0; k < 5; k++) E(c, -22 + k * 9, Y(-140 + (k % 3) * 18), 7, 4, pal.liquen);
      // cabeza baja adelante
      P(c, [18, Y(-150), 44, Y(-152), 54, Y(-130), 46, Y(-112), 22, Y(-118)], pal.piel);
      P(c, [44, Y(-142), 62, Y(-132), 50, Y(-124)], pal.pielS); // nariz
      R(c, 36, Y(-142), 5, 4, pal.ojo);
      P(c, [40, Y(-118), 44, Y(-128), 46, Y(-116)], "#E8DCC4");
      // brazo largo con el garrote
      garrote(30, Y(-120), -1);
      P(c, [20, Y(-132), 34, Y(-130), 40, Y(-66), 26, Y(-64)], pal.piel);
    } else {
      const atras = v === "N";
      P(c, [-30, Y(-60), -10, Y(-60), -10 + paso * 0.3, 0, -32 + paso * 0.3, 0], pal.pielS);
      P(c, [10, Y(-60), 30, Y(-60), 32 - paso * 0.3, 0, 10 - paso * 0.3, 0], pal.piel);
      // taparrabos de piel
      P(c, [-30, Y(-66), 30, Y(-66), 24, Y(-40), 0, Y(-34), -24, Y(-40)], "#5E4A36");
      P(c, [-42, Y(-64), -46, Y(-138), -20, Y(-160), 20, Y(-160), 46, Y(-138), 42, Y(-64)], pal.piel);
      P(c, [-42, Y(-64), -46, Y(-138), -20, Y(-160), 0, Y(-160), 0, Y(-64)], pal.pielS);
      for (let k = 0; k < 6; k++) E(c, -34 + k * 13, Y(atras ? -130 + (k % 2) * 30 : -150 + (k % 2) * 8), 7, 4, pal.liquen);
      // brazos hasta las rodillas
      P(c, [-42, Y(-140), -56, Y(-134), -60, Y(-40), -46, Y(-42)], pal.pielS);
      garrote(52, Y(-130), 1);
      P(c, [42, Y(-140), 56, Y(-134), 58, Y(-50), 44, Y(-52)], pal.piel);
      const cy = Y(-164);
      if (atras) {
        P(c, [-20, cy + 10, -18, cy - 16, 0, cy - 24, 18, cy - 16, 20, cy + 10], pal.pielS);
        E(c, 6, cy - 14, 6, 3, pal.liquen);
      } else {
        P(c, [-22, cy + 12, -20, cy - 14, 0, cy - 22, 20, cy - 14, 22, cy + 12], pal.piel);
        P(c, [-22, cy + 12, -20, cy - 14, 0, cy - 22, 0, cy + 12], pal.pielS);
        P(c, [-6, cy - 6, 6, cy - 6, 8, cy + 10, -8, cy + 10], pal.pielS); // nariz
        R(c, -14, cy - 8, 6, 4, pal.ojo);
        R(c, 8, cy - 8, 6, 4, pal.ojo);
        P(c, [-12, cy + 12, -8, cy + 2, -6, cy + 12], "#E8DCC4");
        P(c, [12, cy + 12, 8, cy + 2, 6, cy + 12], "#E8DCC4");
        // barba de musgo
        P(c, [-16, cy + 12, 16, cy + 12, 8, cy + 30, 0, cy + 24, -8, cy + 30], pal.liquen);
      }
    }
  }

  // ---------- Oso de zarzal ----------
  // Como en su hoja: oso pardo enorme en bloques de pelaje, calvas claras, un manto de zarzas que le sale del lomo,
  // ataduras violetas en las patas delanteras y la quijada, un ojo nublado de blanco y zarpas negras. Para golpear se
  // para en dos patas (o.golpe sube mientras avisa).
  const PAL_OSO = [
    { pelo: "#6A4428", peloS: "#4E3020", peloL: "#7E5434", calva: "#9A8670" }, // pardo
    { pelo: "#4A3424", peloS: "#34241A", peloL: "#5E4430", calva: "#8A7A66" }, // oscuro
    { pelo: "#7A4A2A", peloS: "#5A341E", peloL: "#8E5A36", calva: "#A89276" }, // rojizo
  ];
  const ZARZA = "#3E3A26",
    ZARZA_L = "#56503A",
    ESPINA = "#24200F",
    ATA = "#9A6BD8",
    ATA_S = "#6E4AA8",
    ZARPA = "#161412";
  // una rama de zarza con espinas, de (x0,y0) a (x1,y1)
  function zarza(c, x0, y0, x1, y1, n, sem) {
    L(c, x0, y0, x1, y1, ZARZA, 5);
    L(c, x0, y0 - 1, (x0 + x1) / 2, (y0 + y1) / 2 - 1, ZARZA_L, 2);
    for (let k = 1; k <= n; k++) {
      const u = k / (n + 1),
        x = x0 + (x1 - x0) * u,
        y = y0 + (y1 - y0) * u,
        lado = (k + sem) % 2 ? 1 : -1,
        dx = y1 - y0,
        dy = -(x1 - x0),
        l = Math.hypot(dx, dy) || 1;
      P(c, [x - 2, y, x + 2, y, x + (dx / l) * 7 * lado, y + (dy / l) * 7 * lado], ESPINA);
    }
  }
  // ataduras: vueltas violetas alrededor de una pata
  function atadura(c, x, y0, y1, w) {
    for (let k = 0; k < 3; k++) {
      const y = y0 + ((y1 - y0) * (k + 0.5)) / 3;
      L(c, x - w, y + 4, x + w, y - 4, ATA, 3);
      L(c, x - w, y + 5, x - w * 0.2, y + 2, ATA_S, 2);
      P(c, [x + w * 0.3, y - 2, x + w * 0.4, y - 7, x + w * 0.5, y - 2], ESPINA);
    }
  }
  function oso(c, t, o) {
    const v = o.vista || "E",
      m = o.mov || 0,
      pal = PAL_OSO[o.pal || 0],
      paso = Math.sin(t * (m > 1 ? 14 : 8)) * 5 * Math.min(1, m),
      erg = Math.min(1, (o.golpe || 0) * 1.4),
      resp = Math.sin(t * 2) * 1.5;
    sombra(c, 0, 0, 62, 14, 0.45);
    if (v === "E") {
      // patas de atrás
      P(c, [-46, -30, -30, -30, -30 + paso * 0.3, 0, -46 + paso * 0.3, 0], pal.peloS);
      P(c, [-34, -30, -20, -30, -20 - paso * 0.3, 0, -34 - paso * 0.3, 0], pal.pelo);
      [-44, -32].forEach((x) => P(c, [x, 0, x + 3, 5, x + 6, 0], ZARPA));
      c.save();
      // se para en dos patas: gira sobre la cadera
      c.translate(-30, -26);
      c.rotate(-erg * 0.7);
      c.translate(30, 26);
      // patas de adelante con sus ataduras
      const fp = erg > 0.3 ? 0 : paso;
      P(c, [22, -34, 36, -34, 36 - fp * 0.3, 0, 22 - fp * 0.3, 0], pal.peloS);
      P(c, [34, -34, 48, -34, 48 + fp * 0.3, 0, 34 + fp * 0.3, 0], pal.pelo);
      atadura(c, 41, -30, -4, 8);
      [34, 39, 44].forEach((x) => P(c, [x, 0, x + 3, 7, x + 5, 0], ZARPA));
      // el cuerpo en bloques: mitad de abajo y de la izquierda en sombra, la joroba de los hombros
      P(c, [-58, -28, -54, -70 + resp, -22, -86 + resp, 18, -88 + resp, 46, -72, 54, -36, 42, -26, -50, -22], pal.pelo);
      P(c, [-58, -28, -54, -70 + resp, -30, -80 + resp, -36, -24, -50, -22], pal.peloS);
      P(c, [-10, -84 + resp, 18, -96 + resp, 40, -80, 18, -76], pal.peloL);
      P(c, [-40, -26, 40, -28, 52, -38, 30, -34, -30, -32], pal.peloS);
      // las calvas
      P(c, [-30, -62, -18, -70, -8, -60, -16, -50, -28, -52], pal.calva);
      P(c, [10, -48, 22, -56, 30, -46, 20, -40], pal.calva);
      // la cabeza: hocico largo, oreja redonda, el ojo nublado y la atadura en la quijada
      P(c, [42, -76, 62, -84, 80, -76, 92, -62, 92, -52, 72, -46, 48, -52], pal.pelo);
      P(c, [42, -76, 58, -82, 60, -50, 48, -52], pal.peloS);
      P(c, [82, -66, 98, -62, 98, -52, 86, -50], pal.peloL);
      E(c, 98, -58, 4, 3, "#111111");
      P(c, [52, -82, 56, -94, 64, -84], pal.peloS);
      E(c, 74, -68, 3.5, 3.5, "#F2ECEC");
      alfa(c, 0.5, () => E(c, 74, -68, 6, 6, "#F2ECEC"));
      L(c, 64, -50, 90, -50, ATA, 3);
      L(c, 66, -46, 80, -54, ATA_S, 2);
      // si ruge, la boca abierta
      if (erg > 0.4) {
        P(c, [84, -50, 98, -48, 94, -40, 84, -44], "#5E130D");
        P(c, [88, -49, 90, -44, 92, -49], "#F2ECEC");
      }
      // el manto de zarzas del lomo, con hilos violetas entre las ramas
      const lomo = [[-46, -72], [-30, -82], [-12, -88], [6, -92], [22, -94], [34, -86]];
      lomo.forEach(([x, y], k) => {
        zarza(c, x, y + resp, x + (k % 2 ? 22 : -18), y - 26 - (k % 3) * 6 + resp, 3, k);
        zarza(c, x + 6, y + 2 + resp, x + 30, y - 10 + resp, 2, k + 1);
      });
      L(c, -40, -70 + resp, 30, -88 + resp, ATA, 2);
      c.restore();
    } else {
      const atras = v === "N";
      c.save();
      c.translate(0, -erg * 26);
      c.scale(1, 1 + erg * 0.3);
      // patas
      P(c, [-46, -30, -20, -30, -20 + paso * 0.2, 0, -46 + paso * 0.2, 0], pal.peloS);
      P(c, [20, -30, 46, -30, 46 - paso * 0.2, 0, 20 - paso * 0.2, 0], pal.pelo);
      if (!atras) {
        atadura(c, -33, -24, -2, 13);
        atadura(c, 33, -24, -2, 13);
        [-42, -34, -26, 26, 34, 42].forEach((x) => P(c, [x - 3, 0, x, 7, x + 3, 0], ZARPA));
      }
      // el cuerpo ancho
      P(c, [-52, -24, -62, -60 + resp, -50, -92 + resp, -24, -104 + resp, 24, -104 + resp, 50, -92 + resp, 62, -60 + resp, 52, -24], pal.pelo);
      P(c, [-52, -24, -62, -60 + resp, -50, -92 + resp, -24, -104 + resp, 0, -104 + resp, 0, -24], pal.peloS);
      P(c, [-30, -24, -20, -60, 20, -60, 30, -24], pal.peloS);
      P(c, [0, -24, 0, -60, 20, -60, 30, -24], pal.pelo);
      P(c, [-20, -40, -8, -50, 6, -40, -6, -32], pal.calva);
      P(c, [24, -66, 36, -72, 44, -62, 32, -58], pal.calva);
      // el manto de zarzas sobre los hombros
      for (let k = 0; k < 9; k++) {
        const a = Math.PI * (1.05 + (k / 8) * 0.9),
          x = Math.cos(a) * 50,
          y = -64 + Math.sin(a) * 26 + resp;
        zarza(c, x, y, x * 1.3 + (k % 2 ? 8 : -8), y - 22 - (k % 3) * 6, 2, k);
      }
      L(c, -46, -72 + resp, 40, -84 + resp, ATA, 2);
      if (!atras) {
        // la cabeza de frente: un ojo oscuro y el otro nublado
        const hy = -78 + resp;
        P(c, [-26, hy + 14, -24, hy - 14, 0, hy - 22, 24, hy - 14, 26, hy + 14, 14, hy + 28, -14, hy + 28], pal.pelo);
        P(c, [-26, hy + 14, -24, hy - 14, 0, hy - 22, 0, hy + 28, -14, hy + 28], pal.peloS);
        E(c, -20, hy - 18, 7, 7, pal.peloS);
        E(c, 20, hy - 18, 7, 7, pal.pelo);
        P(c, [-10, hy + 6, 10, hy + 6, 12, hy + 24, -12, hy + 24], pal.peloL);
        E(c, 0, hy + 10, 5, 4, "#111111");
        R(c, -13, hy - 4, 5, 4, "#111111");
        E(c, 11, hy - 2, 3.5, 3.5, "#F2ECEC");
        alfa(c, 0.5, () => E(c, 11, hy - 2, 6, 6, "#F2ECEC"));
        L(c, -14, hy + 20, 14, hy + 16, ATA, 3);
        if (erg > 0.4) P(c, [-8, hy + 18, 8, hy + 18, 6, hy + 28, -6, hy + 28], "#5E130D");
        // al pararse, los brazos arriba con las zarpas
        if (erg > 0.3) {
          P(c, [-54, -70, -66, -96, -58, -104, -44, -78], pal.peloS);
          P(c, [54, -70, 66, -96, 58, -104, 44, -78], pal.pelo);
          [-64, -59, -54].forEach((x) => P(c, [x, -102, x - 1, -112, x + 2, -103], ZARPA));
          [54, 59, 64].forEach((x) => P(c, [x, -102, x + 1, -112, x + 2, -103], ZARPA));
        }
      } else {
        E(c, -20, -98 + resp, 7, 7, pal.peloS);
        E(c, 20, -98 + resp, 7, 7, pal.pelo);
        P(c, [-22, -84 + resp, -18, -102 + resp, 18, -102 + resp, 22, -84 + resp], pal.peloS);
      }
      c.restore();
    }
  }

  CRIATURAS.registrar("draugr", draugr);
  CRIATURAS.registrar("jabali", jabali);
  CRIATURAS.registrar("cuervo", cuervo);
  CRIATURAS.registrar("fatuo", fatuo);
  CRIATURAS.registrar("trol", trol);
  CRIATURAS.registrar("oso", oso);
})();
