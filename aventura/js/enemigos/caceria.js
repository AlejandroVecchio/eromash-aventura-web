// ---------- la Cacería Salvaje: sabuesos y el Cazador (se suman a CRIATURAS) ----------
// Oskoreia, la cacería de los muertos que cruza el cielo en las noches de invierno. Diseños propios, en tres vistas (S
// frente, E costado, N espaldas), base en (0, 0), con el trazo de la arena: caras planas, la mitad izquierda en sombra.
// Son fantasmas: medio transparentes, sin patas que toquen el piso (se deshacen en jirones) y con ojos que brillan.
// Tres variantes de color (o.pal): escarcha, violeta de las ataduras y ceniza.
//  · Sabueso de la Cacería: un perro largo y flaco, de orejas caídas, con un collar de cadena rota.
//  · El Cazador de Oskoreia: un jinete con yelmo de dos cuernos y capa rota, sobre un caballo de humo, lanza larga en
//    la mano; durante el aviso baja la lanza y el caballo se encabrita.
(function () {
  "use strict";
  const { P, E, R, L, sombra, alfa } = DIB;
  const PAL = [
    { c: "#B8C8D8", s: "#8698AC", l: "#DCE8F2", ojo: "#9A6BD8", jiron: "rgba(200,216,232,", capa: "#5E6A7E", capaS: "#424C5E" }, // escarcha
    { c: "#A898C8", s: "#76669A", l: "#CCC0E4", ojo: "#73D5DB", jiron: "rgba(154,107,216,", capa: "#4A3A66", capaS: "#32264A" }, // violeta
    { c: "#9A9690", s: "#706C66", l: "#C0BCB6", ojo: "#FF8D71", jiron: "rgba(176,172,166,", capa: "#4A4644", capaS: "#32302E" }, // ceniza
  ];
  const CADENA = "#3A3634";
  // jirones de humo que se deshacen detrás (de la cola, de las patas, de la capa)
  function jirones(c, x, y, pal, t, n, largo, dir) {
    if (window.CALIDAD && CALIDAD.nivel === "baja") return;
    for (let k = 0; k < n; k++) {
      const u = (t * 1.3 + k / n) % 1,
        px = x - dir * u * largo,
        py = y - Math.sin(t * 3 + k * 1.7) * 6 - u * 10;
      c.fillStyle = pal.jiron + (0.5 * (1 - u)).toFixed(2) + ")";
      c.beginPath();
      c.moveTo(px, py - 5 * (1 - u) - 2);
      c.lineTo(px + 6 * (1 - u) + 2, py);
      c.lineTo(px, py + 5 * (1 - u) + 2);
      c.lineTo(px - 6 * (1 - u) - 2, py);
      c.fill();
    }
  }
  // una pata fantasma: se afina y se pierde antes de tocar el piso
  function pata(c, x, y0, y1, d, col) {
    P(c, [x - 3, y0, x + 3, y0, x + 1 + d, y1, x - 1 + d, y1], col);
  }

  // ---------- Sabueso de la Cacería ----------
  function sabuesoCaceria(c, t, o) {
    const v = o.vista || "E",
      m = o.mov || 0,
      pal = PAL[o.pal || 0],
      paso = Math.sin(t * 13) * 7 * m,
      g = o.golpe || 0,
      flota = Math.sin(t * 2.4) * 2;
    sombra(c, 0, 0, 36, 7, 0.28);
    alfa(c, 0.86, () => {
      c.save();
      c.translate(0, -6 + flota);
      if (v === "E") {
        [[-26, paso], [-16, -paso], [20, -paso], [30, paso]].forEach(([px, d], k) => pata(c, px, -24, 0, d * 0.5, k % 2 ? pal.s : pal.c));
        // el cuerpo largo y hundido en la panza
        P(c, [-38, -26, -32, -42, 22, -46 - g * 4, 38, -38, 34, -24, 0, -20, -30, -22], pal.c);
        P(c, [-38, -26, -32, -42, -8, -44, -8, -20, -30, -22], pal.s);
        P(c, [6, -45, 22, -46 - g * 4, 30, -42, 10, -40], pal.l);
        // las costillas que se adivinan
        [-2, 6, 14].forEach((x) => L(c, x, -40, x - 3, -26, pal.s, 1.4));
        // la cola de humo
        P(c, [-36, -38, -52, -46 + Math.sin(t * 5) * 4, -48, -34, -36, -30], pal.s);
        jirones(c, -52, -42, pal, t, 4, 34, 1);
        // la cabeza larga, que baja para morder
        const hx = 36 + g * 12,
          hy = -40 + g * 9;
        P(c, [hx - 8, hy - 6, hx + 6, hy - 12, hx + 30, hy - 4, hx + 30, hy + 4, hx + 4, hy + 10, hx - 8, hy + 6], pal.c);
        P(c, [hx - 8, hy - 6, hx + 6, hy - 12, hx + 4, hy + 10, hx - 8, hy + 6], pal.s);
        // la oreja caída
        P(c, [hx + 2, hy - 10, hx - 8, hy + 6, hx - 2, hy + 8, hx + 8, hy - 8], pal.s);
        P(c, [hx + 30, hy - 4, hx + 30, hy + 4, hx + 22, hy + 2], "#111111");
        if (g > 0.4) P(c, [hx + 14, hy + 4, hx + 30, hy + 4, hx + 22, hy + 10], "#E8DCC4");
        R(c, hx + 14, hy - 6, 4, 3, pal.ojo);
        // el collar de cadena rota, con un eslabón que cuelga
        [0, 1, 2].forEach((k) => E(c, hx - 4 + k * 3, hy + 2 + k * 2, 3, 2, CADENA));
        L(c, hx + 4, hy + 8, hx + 2 + Math.sin(t * 6) * 2, hy + 18, CADENA, 2);
      } else {
        const atras = v === "N";
        pata(c, -10, -22, 0, paso * 0.2, pal.s);
        pata(c, 10, -22, 0, -paso * 0.2, pal.c);
        P(c, [-17, -22, -15, -44, 15, -44, 17, -22], atras ? pal.s : pal.c);
        P(c, [-17, -22, -15, -44, 0, -44, 0, -22], pal.s);
        if (atras) {
          P(c, [-3, -42, 3, -42, 2 + Math.sin(t * 5) * 5, -60, -2, -58], pal.s);
          jirones(c, Math.sin(t * 5) * 5, -60, pal, t, 3, 0, 0);
        } else {
          const hy = -46 + g * 7;
          P(c, [-11, hy, 11, hy, 9, hy + 18, 0, hy + 28, -9, hy + 18], pal.c);
          P(c, [-11, hy, 0, hy, 0, hy + 28, -9, hy + 18], pal.s);
          // las orejas caídas a los lados
          P(c, [-11, hy, -18, hy + 14, -14, hy + 18, -8, hy + 4], pal.s);
          P(c, [11, hy, 18, hy + 14, 14, hy + 18, 8, hy + 4], pal.c);
          R(c, -7, hy + 7, 4, 3, pal.ojo);
          R(c, 3, hy + 7, 4, 3, pal.ojo);
          P(c, [-3, hy + 22, 3, hy + 22, 0, hy + 28], "#111111");
          [-6, -2, 2, 6].forEach((x) => E(c, x, hy + 30, 2.4, 1.8, CADENA));
        }
      }
      c.restore();
    });
  }

  // ---------- El Cazador de Oskoreia ----------
  function lanza(c, x, y, ang, largo) {
    c.save();
    c.translate(x, y);
    c.rotate(ang);
    R(c, -largo * 0.3, -2, largo, 4, "#4A3628");
    P(c, [largo * 0.7, -5, largo * 0.7 + 22, 0, largo * 0.7, 5], "#C8C4BC");
    P(c, [largo * 0.7, -5, largo * 0.7 + 22, 0, largo * 0.7, 0], "#9A968E");
    c.restore();
  }
  function yelmo(c, cx, cy, pal, atras) {
    // el yelmo redondo con dos cuernos curvos
    c.save();
    c.translate(cx, 0);
    P(c, [-10, cy + 10, -11, cy - 4, -6, cy - 12, 6, cy - 12, 11, cy - 4, 10, cy + 10], "#6E6A66");
    P(c, [-10, cy + 10, -11, cy - 4, -6, cy - 12, 0, cy - 12, 0, cy + 10], "#4E4A46");
    P(c, [-10, cy - 4, -22, cy - 14, -24, cy - 28, -16, cy - 18, -8, cy - 10], "#E8E0D0");
    P(c, [10, cy - 4, 22, cy - 14, 24, cy - 28, 16, cy - 18, 8, cy - 10], "#F2ECEC");
    if (!atras) {
      // la cara en la sombra: solo los ojos
      P(c, [-7, cy + 10, -7, cy, 7, cy, 7, cy + 10], "#111111");
      R(c, -5, cy + 3, 3.5, 2.4, pal.ojo);
      R(c, 2, cy + 3, 3.5, 2.4, pal.ojo);
    }
    c.restore();
  }
  function cazadorSalvaje(c, t, o) {
    const v = o.vista || "E",
      m = Math.min(1, o.mov || 0),
      pal = PAL[o.pal || 0],
      g = o.golpe || 0,
      galope = Math.sin(t * 10) * 8 * m,
      sube = Math.abs(Math.sin(t * 10)) * 4 * m,
      flota = Math.sin(t * 2) * 2;
    sombra(c, 0, 0, 58, 12, 0.3);
    alfa(c, 0.88, () => {
      c.save();
      c.translate(0, -8 + flota - sube);
      if (v === "E") {
        // el caballo se encabrita durante el aviso: el frente sube
        c.rotate(-g * 0.12);
        [[-34, galope], [-22, -galope], [26, -galope], [38, galope]].forEach(([px, d], k) => pata(c, px, -46, 0, d * 0.6, k % 2 ? pal.s : pal.c));
        // el cuerpo del caballo
        P(c, [-50, -48, -44, -78, 30, -82, 50, -72, 46, -48, -40, -44], pal.c);
        P(c, [-50, -48, -44, -78, -10, -80, -10, -44, -40, -44], pal.s);
        P(c, [10, -81, 30, -82, 44, -74, 16, -72], pal.l);
        // la cola de humo
        P(c, [-48, -74, -70, -70 + Math.sin(t * 4) * 4, -64, -54, -48, -60], pal.s);
        jirones(c, -68, -64, pal, t, 5, 46, 1);
        // cuello y cabeza, con la crin de jirones
        P(c, [36, -76, 50, -112, 62, -116, 58, -96, 48, -66], pal.c);
        P(c, [50, -112, 62, -116, 82, -100, 80, -92, 60, -94], pal.c);
        P(c, [36, -76, 50, -112, 48, -66], pal.s);
        P(c, [80, -100, 82, -92, 74, -92], "#111111");
        R(c, 64, -108, 4, 3, pal.ojo);
        jirones(c, 44, -104, pal, t, 4, 30, 1);
        // la capa rota que vuela atrás
        P(c, [-4, -140, -40, -120 + Math.sin(t * 6) * 4, -46, -86, -10, -84], pal.capaS);
        P(c, [-40, -120 + Math.sin(t * 6) * 4, -56, -110, -46, -86], pal.capa);
        // el jinete: pierna, torso de cuero y el brazo con la lanza
        P(c, [-2, -84, 14, -84, 18, -60, 8, -58], pal.s);
        P(c, [-8, -84, -6, -140, 18, -142, 22, -84], pal.c);
        P(c, [-8, -84, -6, -140, 6, -141, 6, -84], pal.s);
        R(c, -8, -100, 30, 6, CADENA);
        lanza(c, 14, -120, -0.5 + g * 0.55, 110);
        yelmo(c, 6, -158, pal, false);
      } else {
        const atras = v === "N";
        pata(c, -18, -44, 0, galope * 0.2, pal.s);
        pata(c, 18, -44, 0, -galope * 0.2, pal.c);
        pata(c, -10, -44, 0, -galope * 0.2, pal.s);
        pata(c, 10, -44, 0, galope * 0.2, pal.c);
        // el pecho (o el anca) del caballo
        P(c, [-26, -44, -28, -86, 28, -86, 26, -44], atras ? pal.s : pal.c);
        P(c, [-26, -44, -28, -86, 0, -86, 0, -44], pal.s);
        if (atras) {
          P(c, [-4, -84, 4, -84, 4 + Math.sin(t * 4) * 6, -48, -4, -50], pal.s);
          jirones(c, Math.sin(t * 4) * 6, -50, pal, t, 4, 0, 0);
        }
        // la capa, ancha
        P(c, [-30, -88, -24, -146, 24, -146, 30, -88], atras ? pal.capa : pal.capaS);
        P(c, [-30, -88, -24, -146, 0, -146, 0, -88], pal.capaS);
        if (!atras) {
          // torso, cinto de cadena y la cabeza del caballo adelante
          P(c, [-14, -96, -12, -144, 14, -144, 16, -96], pal.c);
          P(c, [-14, -96, -12, -144, 0, -144, 0, -96], pal.s);
          R(c, -14, -106, 30, 5, CADENA);
          P(c, [-10, -84, -12, -118, -4, -128, 4, -128, 12, -118, 10, -84], pal.c);
          P(c, [-10, -84, -12, -118, -4, -128, 0, -128, 0, -84], pal.s);
          R(c, -8, -116, 4, 3, pal.ojo);
          R(c, 4, -116, 4, 3, pal.ojo);
          P(c, [-5, -88, 5, -88, 0, -82], "#111111");
          lanza(c, 22, -126, -1.2 + g * 0.9, 100);
        } else lanza(c, -22, -126, -1.9, 100);
        yelmo(c, 0, -160, pal, atras);
      }
      c.restore();
    });
  }

  CRIATURAS.registrar("sabuesoCaceria", sabuesoCaceria);
  CRIATURAS.registrar("cazadorSalvaje", cazadorSalvaje);
  window.CACERIA_DIBUJO = { PAL };
})();
