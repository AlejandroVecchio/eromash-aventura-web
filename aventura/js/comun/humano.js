// ---------- Humano: esqueleto, muñeco de prueba y animaciones de humano (módulo HUMANO) ----------
// El esqueleto de toda persona (cadera, tronco, cabeza, brazo, antebrazo y mano de cada lado, muslo, pierna y pie de
// cada lado, hacha en la mano derecha y escudo en la izquierda) en sus tres vistas: S de frente, E de costado mirando a
// la derecha (la otra es su espejo) y N de espaldas. Las animaciones (reposo, andar, correr, aviso, golpe, herido,
// morir) salen de las medidas de una caminata de verdad y sirven para cualquier humano: un personaje nuevo solo trae
// sus piezas (de su lámina de piezas) pegadas a los mismos huesos. El muñeco es un humano de prueba con piezas planas
// en los colores del bandido, para el editor (esqueleto.html) mientras no hay láminas de piezas.
// Signos: el giro es en grados y a favor de las agujas del reloj. De costado mirando a la derecha, un miembro que
// cuelga y va hacia adelante gira en contra (negativo); la rodilla se dobla hacia atrás (positivo); el codo, adelante.
window.HUMANO = (function () {
  "use strict";
  // ---------- medidas (unidades del mundo, con los pies en y = 0; mide unos 120) ----------
  const CADERA = 62, TRONCO = 34, MUSLO = 28, PIERNA = 28, TOBILLO = 6, BRAZO = 22, ANTEBRAZO = 19;

  // ---------- piezas planas: cada una en dos mitades, la de la izquierda en sombra (luz de arriba a la derecha) ----------
  // un miembro de largo l que cuelga hacia +y desde su hueso, de ancho a arriba y b abajo
  function miembro(l, a, b, col, y0) {
    y0 = y0 || 0;
    return [
      { pts: [-a / 2, y0, 0, y0, 0, l, -b / 2, l], col: col + "S" },
      { pts: [0, y0, a / 2, y0, b / 2, l, 0, l], col },
    ];
  }
  const pz = (hueso, z, formas) => ({ hueso, z, formas: [].concat(formas) });

  function huesosDe(v) {
    // dónde nacen los brazos y las piernas en cada vista (x de pantalla); de costado los dos van casi en el mismo lugar
    const lado = v === "E" ? { bD: 1, bI: -2, mD: 2, mI: -2 } : v === "S" ? { bD: -14, bI: 14, mD: -6, mI: 6 } : { bD: 14, bI: -14, mD: 6, mI: -6 };
    const pie = v === "E" ? [12, TOBILLO] : [0, TOBILLO];
    const suela = v === "E" ? [[-5, TOBILLO], [13, TOBILLO]] : [[-5, TOBILLO], [5, TOBILLO]];
    const H = [
      { id: "cadera", x: 0, y: -CADERA, punta: [0, 0] },
      { id: "tronco", padre: "cadera", x: 0, y: 0, punta: [0, -TRONCO], suela: [[0, 0], [0, -TRONCO]] },
      { id: "cabeza", padre: "tronco", x: v === "E" ? 2 : 0, y: -TRONCO - 1, punta: [0, -21], suela: [[0, -21]] },
    ];
    for (const s of ["D", "I"]) {
      H.push(
        { id: "brazo" + s, padre: "tronco", x: lado["b" + s], y: -TRONCO + 3, punta: [0, BRAZO] },
        { id: "antebrazo" + s, padre: "brazo" + s, x: 0, y: BRAZO, punta: [0, ANTEBRAZO] },
        { id: "mano" + s, padre: "antebrazo" + s, x: 0, y: ANTEBRAZO, punta: [0, 6] },
        { id: "muslo" + s, padre: "cadera", x: lado["m" + s], y: 0, punta: [0, MUSLO] },
        { id: "pierna" + s, padre: "muslo" + s, x: 0, y: MUSLO, punta: [0, PIERNA], suela: [[0, 0]] },
        { id: "pie" + s, padre: "pierna" + s, x: 0, y: PIERNA, punta: pie, suela },
      );
    }
    H.push({ id: "hacha", padre: "manoD", x: 0, y: 3, punta: [0, 26] }, { id: "escudo", padre: "manoI", x: 0, y: 2, punta: [0, 0], derecho: true });
    return H;
  }

  // ---------- el muñeco: las piezas de cada vista ----------
  function piezasDe(v) {
    const E = v === "E", N = v === "N";
    const P = [];
    // el orden (z): de costado, lo del lado de atrás primero
    const z = E ? { brazoI: 1, piernaI: 2, piernaD: 3, tronco: 4, cabeza: 5, escudo: 6, hacha: 7, brazoD: 8 }
      : N ? { escudo: 0.5, piernaI: 2, piernaD: 2, brazoI: 3, brazoD: 3, hacha: 3.5, tronco: 4, cabeza: 5 }
      : { piernaI: 2, piernaD: 2, hacha: 2.5, tronco: 4, brazoD: 5, brazoI: 5, cabeza: 6, escudo: 7 };
    for (const s of ["D", "I"]) {
      const atras = E && s === "I", t = (c) => (atras ? c + "S" : c);
      const zb = z["brazo" + s], zp = z["pierna" + s];
      P.push(pz("muslo" + s, zp, miembro(MUSLO + 2, 12, 9, t("calza"), -2)));
      P.push(pz("pierna" + s, zp + 0.01, [miembro(PIERNA - 13, 9, 8, t("calza")), miembro(PIERNA, 10, 10, t("cuero"), PIERNA - 13)].flat()));
      P.push(pz("pie" + s, zp + 0.02, E
        ? [{ pts: [-5, -2, 5, -2, 13, 2, 13, TOBILLO, -5, TOBILLO], col: t("cuero") }, { pts: [5, -2, 13, 2, 13, TOBILLO, 6, TOBILLO], col: t("cuero") + "S" }]
        : [{ pts: [-5, -2, 0, -2, 0, TOBILLO, -6, TOBILLO], col: t("cuero") + "S" }, { pts: [0, -2, 5, -2, 6, TOBILLO, 0, TOBILLO], col: t("cuero") }]));
      P.push(pz("brazo" + s, zb, miembro(BRAZO + 2, 10, 8, t("ropa"), -3)));
      P.push(pz("antebrazo" + s, zb + 0.01, [miembro(8, 8, 8, t("ropa")), miembro(ANTEBRAZO + 1, 6, 6, t("piel"), 7)].flat()));
      P.push(pz("mano" + s, zb + 0.03, [{ pts: [-4, -1, 0, -1, 0, 7, -3, 6], col: t("piel") + "S" }, { pts: [0, -1, 4, -1, 3, 6, 0, 7], col: t("piel") }]));
    }
    // el tronco con la falda de la túnica y el cinturón
    P.push(pz("tronco", z.tronco, E
      ? [{ pts: [-10, 12, -9, -TRONCO, 0, -TRONCO - 2, 0, 12], col: "ropaS" }, { pts: [0, 12, 0, -TRONCO - 2, 9, -TRONCO, 11, 12], col: "ropa" }, { pts: [-10, -3, 10, -3, 10, 2, -10, 2], col: "cuero" }]
      : [{ pts: [-13, 12, -14, -TRONCO + 2, -8, -TRONCO - 1, 0, -TRONCO - 1, 0, 12], col: "ropaS" }, { pts: [0, 12, 0, -TRONCO - 1, 8, -TRONCO - 1, 14, -TRONCO + 2, 13, 12], col: "ropa" }, { pts: [-13, -3, 13, -3, 13, 2, -13, 2], col: "cuero" }, ...(N ? [] : [{ pts: [-3, -3, 3, -3, 3, 2, -3, 2], col: "hierro" }])]));
    // la cabeza: la capucha roja con su punta, la cara tapada y los ojos
    P.push(pz("cabeza", z.cabeza, E
      ? [{ pts: [-9, 2, -12, -12, -24, -24, -6, -23, 2, -24, 9, -16, 10, -4, 6, 2], col: "capuchaS" }, { pts: [0, -23, 2, -24, 9, -16, 10, -4, 6, 2, 0, 2], col: "capucha" }, { pts: [3, -14, 10, -14, 10, -4, 4, -4], col: "mascara" }, { pts: [6, -13, 9, -13, 9, -11, 6, -11], col: "ojo" }]
      : N
      ? [{ pts: [-10, 2, -11, -14, -6, -23, 0, -24, 0, 2], col: "capuchaS" }, { pts: [0, -24, 6, -23, 11, -14, 10, 2, 0, 2], col: "capucha" }, { pts: [-3, -22, 3, -22, 0, -30], col: "capuchaS" }]
      : [{ pts: [-10, 2, -11, -14, -6, -23, 0, -24, 0, 2], col: "capuchaS" }, { pts: [0, -24, 6, -23, 11, -14, 10, 2, 0, 2], col: "capucha" }, { pts: [-6, -15, 6, -15, 6, -4, -6, -4], col: "mascara" }, { pts: [-5, -13, -2, -13, -2, -11, -5, -11], col: "ojo" }, { pts: [2, -13, 5, -13, 5, -11, 2, -11], col: "ojo" }]));
    // el hacha (mango y cabeza de hierro) y el escudo
    const hoja = E ? [[5, 18, 14, 15, 15, 27, 5, 24], [5, 18, 14, 15, 14, 19, 5, 20]] : v === "S" ? [[-5, 18, -14, 15, -15, 27, -5, 24], [-5, 18, -14, 15, -14, 19, -5, 20]] : [[5, 18, 14, 15, 15, 27, 5, 24], [5, 18, 14, 15, 14, 19, 5, 20]];
    P.push(pz("hacha", z.hacha, [{ pts: [-1.5, -4, 1.5, -4, 1.5, 26, -1.5, 26], col: "madera" }, { pts: hoja[0], col: "hierroS" }, { pts: hoja[1], col: "hierro" }]));
    const esc = E ? { rx: 5, ry: 16 } : { rx: 15, ry: 16 };
    const disco = (rx, ry, n) => Array.from({ length: n * 2 }, (_, i) => (i % 2 ? Math.sin((Math.PI * (i - 1)) / n) * ry : Math.cos((Math.PI * i) / n) * rx));
    P.push(pz("escudo", z.escudo, N
      ? [{ pts: disco(esc.rx, esc.ry, 10), col: "escudoS" }]
      : [{ pts: disco(esc.rx, esc.ry, 10), col: "escudoS" }, { pts: disco(esc.rx * 0.82, esc.ry * 0.86, 10).map((q, i) => (i % 2 ? q : q + (E ? 1 : 1.5))), col: "escudo" }, { pts: disco(esc.rx * 0.25, esc.ry * 0.22, 8), col: "hierro" }]));
    return P;
  }
  // los colores del muñeco: los del bandido (trapos rojos, piel de lobo gris y verde de monte)
  const COLORES = [
    { capucha: "#C8402D", capuchaS: "#9C2315", mascara: "#5E130D", ojo: "#F2ECEC", ropa: "#6A6A4C", ropaS: "#4E4F38", calza: "#4F503A", calzaS: "#3A3B2B", cuero: "#92593A", cueroS: "#5B3824", piel: "#E29A69", pielS: "#B97650", hierro: "#E0DFE0", hierroS: "#A6A4A5", madera: "#7B4C30", maderaS: "#5B3824", escudo: "#A66A46", escudoS: "#6E4430" },
    { capucha: "#8C8A86", capuchaS: "#5E5C59", mascara: "#3A3836", ojo: "#F2ECEC", ropa: "#5E5A52", ropaS: "#46433D", calza: "#4A4740", calzaS: "#36332E", cuero: "#92593A", cueroS: "#5B3824", piel: "#E29A69", pielS: "#B97650", hierro: "#E0DFE0", hierroS: "#A6A4A5", madera: "#7B4C30", maderaS: "#5B3824", escudo: "#A66A46", escudoS: "#6E4430" },
    { capucha: "#5E7A3A", capuchaS: "#405528", mascara: "#2C3A1C", ojo: "#F2ECEC", ropa: "#6E6248", ropaS: "#524936", calza: "#4F503A", calzaS: "#3A3B2B", cuero: "#92593A", cueroS: "#5B3824", piel: "#E29A69", pielS: "#B97650", hierro: "#E0DFE0", hierroS: "#A6A4A5", madera: "#7B4C30", maderaS: "#5B3824", escudo: "#A66A46", escudoS: "#6E4430" },
  ];
  // los colores de la otra mitad de cada pieza (los de atrás de costado van un tono más oscuros)
  for (const pal of COLORES) for (const k of Object.keys(pal)) if (!k.endsWith("S")) pal[k + "SS"] = pal[k + "S"];

  const VISTAS = ["S", "E", "N"];
  const MUNECO = {};
  for (const v of VISTAS) MUNECO[v] = { huesos: huesosDe(v), piezas: piezasDe(v), pies: ["pieD", "pieI", "piernaD", "piernaI", "tronco", "cabeza"], colores: COLORES[0] };

  // ---------- animaciones ----------
  // claves de una pista: lista de [t, valor]
  const K = (...p) => p;
  // corre una pista media vuelta (la otra pierna o el otro brazo)
  const media = (claves) => claves.map(([t, v]) => [(t + 0.5) % 1, v]).sort((a, b) => a[0] - b[0]);
  const neg = (claves) => claves.map(([t, v]) => [t, -v]);
  const S = ESQUELETO.valor;

  // la caminata de costado, de las medidas de una caminata (por ciento de la vuelta desde que pisa el pie derecho):
  // flexión de cadera, de rodilla y del tobillo, el balanceo del brazo al revés que la pierna y el codo
  function marcha(m) {
    const cad = K([0, 24 * m.p], [0.15, 20 * m.p], [0.5, -12 * m.p], [0.62, -4 * m.p], [0.85, 27 * m.p]);
    const rod = K([0, 3], [0.15, 16 * m.r], [0.4, 4], [0.6, 36 * m.r], [0.72, 60 * m.r], [0.88, 18 * m.r]);
    const tob = K([0, 0], [0.08, 7], [0.3, -6], [0.55, -4], [0.63, 18 * m.p], [0.76, 0]);
    const hom = K([0, -16 * m.b], [0.5, 18 * m.b]);
    const codo = K([0, 14 * m.c], [0.5, 30 * m.c]);
    return { cad, rod, tob, hom, codo };
  }
  // de costado: las pistas de giro de cada hueso
  function costado(g, m) {
    const p = {
      muslo: neg(g.cad), pierna: g.rod, pie: g.tob, brazo: neg(media(g.hom)), antebrazo: neg(media(g.codo)),
    };
    const out = {
      tronco: { r: K([0, m.inclina], [0.25, m.inclina + 1.2], [0.5, m.inclina], [0.75, m.inclina + 1.2]) },
      cabeza: { r: K([0, -m.inclina * 0.6], [0.25, -m.inclina * 0.6 - 1], [0.5, -m.inclina * 0.6], [0.75, -m.inclina * 0.6 - 1]) },
    };
    for (const h in p) {
      out[h + "D"] = { r: p[h] };
      out[h + "I"] = { r: media(p[h]) };
    }
    // el brazo del hacha se mece menos (lleva peso) y el del escudo casi nada (lo lleva adelante)
    out.brazoD.r = out.brazoD.r.map(([t, v]) => [t, v * 0.7 - 4]);
    out.brazoI.r = out.brazoI.r.map(([t, v]) => [t, v * 0.35 - 22]);
    out.antebrazoI.r = out.antebrazoI.r.map(([t, v]) => [t, v * 0.5 - 50]);
    out.hacha = { r: K([0, -6], [0.5, 4]) };
    return out;
  }
  // de frente y de espaldas: lo que va hacia adelante o hacia atrás se ve más corto (el coseno de su ángulo) y el
  // cuerpo se mece hacia la pierna que pisa
  function frente(lado, m, n) {
    n = n || 24;
    const out = {}, ts = Array.from({ length: n }, (_, i) => i / n);
    const ang = (h, t) => (lado[h] && lado[h].r ? S(lado[h].r, t, true) : 0);
    const corto = (a) => Math.max(0.35, Math.cos(a * (Math.PI / 180)));
    for (const s of ["D", "I"]) {
      out["muslo" + s] = { sy: ts.map((t) => [t, corto(ang("muslo" + s, t))]) };
      out["pierna" + s] = { sy: ts.map((t) => [t, corto(ang("muslo" + s, t) + ang("pierna" + s, t))]) };
      out["brazo" + s] = { sy: ts.map((t) => [t, corto(ang("brazo" + s, t))]), r: K([0, 0]) };
      out["antebrazo" + s] = { sy: ts.map((t) => [t, corto(ang("brazo" + s, t) + ang("antebrazo" + s, t))]) };
      out["pie" + s] = { sy: ts.map((t) => [t, 0.8 + 0.2 * corto(ang("pie" + s, t) * 2)]) };
    }
    out.cadera = { x: K([0, m.mece], [0.5, -m.mece]) };
    out.tronco = { r: K([0, -m.mece * 0.4], [0.5, m.mece * 0.4]), sy: K([0, 1], [0.25, 0.99], [0.5, 1], [0.75, 0.99]) };
    out.cabeza = { r: K([0, m.mece * 0.3], [0.5, -m.mece * 0.3]) };
    // los brazos se abren apenas al pasar
    out.brazoD.r = K([0, 3], [0.5, 1]);
    out.brazoI.r = K([0, -1], [0.5, -3]);
    return out;
  }
  function caminata(id, dur, m) {
    const lado = costado(marcha(m), m);
    return { id, dur, bucle: true, pistas: { E: lado, S: frente(lado, m), N: frente(lado, m) } };
  }

  // las poses quietas o de una vez: cada hueso con sus claves; S y N comparten
  function una(id, dur, bucle, E, F) {
    return { id, dur, bucle, pistas: { E, S: F, N: F } };
  }
  const ANIMS = {
    reposo: una("reposo", 2.6, true,
      {
        tronco: { r: K([0, 2]), sy: K([0, 1], [0.5, 1.015]) }, cabeza: { r: K([0, -1], [0.5, 1]) },
        brazoD: { r: K([0, -4], [0.5, -6]) }, antebrazoD: { r: K([0, -10], [0.5, -12]) }, hacha: { r: K([0, -10], [0.5, -8]) },
        brazoI: { r: K([0, -22]) }, antebrazoI: { r: K([0, -55], [0.5, -57]) },
        musloD: { r: K([0, -4]) }, piernaD: { r: K([0, 6]) }, pieD: { r: K([0, -2]) }, musloI: { r: K([0, 5]) }, piernaI: { r: K([0, 3]) }, pieI: { r: K([0, -8]) },
      },
      {
        tronco: { sy: K([0, 1], [0.5, 1.015]) }, cabeza: { r: K([0, -1.5], [0.5, 1.5]) },
        brazoD: { r: K([0, 4], [0.5, 5]) }, brazoI: { r: K([0, -4], [0.5, -5]) }, antebrazoI: { sy: K([0, 0.6]) },
        musloD: { r: K([0, 3]) }, musloI: { r: K([0, -3]) }, pieD: { r: K([0, -3]) }, pieI: { r: K([0, 3]) },
      }),
    andar: caminata("andar", 1.1, { p: 1, r: 1, b: 1, c: 1, inclina: 3, mece: 1.6 }),
    correr: caminata("correr", 0.66, { p: 1.55, r: 1.6, b: 2, c: 2.6, inclina: 12, mece: 1.2 }),
    // el aviso: se afirma con las rodillas, levanta el hacha por arriba de la cabeza y adelanta el escudo; al final tiembla
    aviso: una("aviso", 0.8, false,
      {
        tronco: { r: K([0, 2], [0.5, -10], [1, -12]) }, cabeza: { r: K([0, 0], [0.5, 6], [1, 8]) },
        brazoD: { r: K([0, -4], [0.55, -165], [1, -172]) }, antebrazoD: { r: K([0, -10], [0.55, -40], [1, -45]) }, hacha: { r: K([0, -10], [0.6, 30], [1, 40]) },
        brazoI: { r: K([0, -22], [0.5, -60], [1, -62]) }, antebrazoI: { r: K([0, -55], [0.5, -40]) },
        musloD: { r: K([0, -4], [0.5, -26], [1, -28]) }, piernaD: { r: K([0, 6], [0.5, 30], [1, 34]) }, pieD: { r: K([0, -2], [0.5, -4]) },
        musloI: { r: K([0, 5], [0.5, 18], [1, 20]) }, piernaI: { r: K([0, 3], [0.5, 22], [1, 24]) }, pieI: { r: K([0, -8], [0.5, -22]) },
      },
      {
        tronco: { sy: K([0, 1], [0.5, 0.96]) }, cabeza: { r: K([0, 0]) },
        brazoD: { r: K([0, 4], [0.55, 10], [1, 12]), sy: K([0, 1], [0.3, 0.25], [0.55, -0.92], [1, -0.97]) }, antebrazoD: { sy: K([0, 1], [0.3, 0.1], [0.55, -0.8], [1, -0.85]) }, hacha: { r: K([0, 0], [0.6, -20]), sy: K([0, 1], [0.35, 0], [0.6, -1]) },
        brazoI: { r: K([0, -4], [0.5, -20]), sy: K([0, 1], [0.5, 0.7]) }, antebrazoI: { sy: K([0, 0.6], [0.5, 0.4]) },
        musloD: { r: K([0, 3], [0.5, 10]), sy: K([0, 1], [0.5, 0.9]) }, musloI: { r: K([0, -3], [0.5, -10]), sy: K([0, 1], [0.5, 0.9]) },
        piernaD: { r: K([0, 0], [0.5, -10]) }, piernaI: { r: K([0, 0], [0.5, 10]) },
      }),
    // el golpe: el hacha baja de arriba hacia adelante y abajo con todo el cuerpo, y vuelve
    golpe: una("golpe", 0.5, false,
      {
        tronco: { r: K([0, -12], [0.3, 16], [0.6, 14], [1, 2]) }, cabeza: { r: K([0, 8], [0.3, -6], [1, -1]) },
        brazoD: { r: K([0, -172], [0.3, -30], [0.6, -25], [1, -4]) }, antebrazoD: { r: K([0, -45], [0.3, -10], [1, -10]) }, hacha: { r: K([0, 40], [0.3, -40], [0.6, -35], [1, -10]) },
        brazoI: { r: K([0, -62], [0.3, -30], [1, -22]) }, antebrazoI: { r: K([0, -40], [0.3, -60], [1, -55]) },
        musloD: { r: K([0, -28], [0.3, -34], [1, -4]) }, piernaD: { r: K([0, 34], [0.3, 30], [1, 6]) }, pieD: { r: K([0, -4], [0.3, 4], [1, -2]) },
        musloI: { r: K([0, 20], [0.3, 26], [1, 5]) }, piernaI: { r: K([0, 24], [0.3, 20], [1, 3]) }, pieI: { r: K([0, -22], [0.3, -20], [1, -8]) },
      },
      {
        tronco: { sy: K([0, 0.96], [0.3, 0.9], [1, 1]) },
        brazoD: { r: K([0, 12], [0.3, 6], [1, 4]), sy: K([0, -0.97], [0.15, -0.3], [0.3, 0.5], [1, 1]) }, antebrazoD: { sy: K([0, -0.85], [0.15, -0.2], [0.3, 0.4], [1, 1]) }, hacha: { r: K([0, -20], [0.3, 0], [1, 0]), sy: K([0, -1], [0.15, -0.3], [0.3, 0.6], [1, 1]) },
        brazoI: { r: K([0, -20], [1, -4]), sy: K([0, 0.7], [1, 1]) }, antebrazoI: { sy: K([0, 0.4], [1, 0.6]) },
        musloD: { r: K([0, 10], [1, 3]), sy: K([0, 0.9], [1, 1]) }, musloI: { r: K([0, -10], [1, -3]), sy: K([0, 0.9], [1, 1]) },
        piernaD: { r: K([0, -10], [1, 0]) }, piernaI: { r: K([0, 10], [1, 0]) },
      }),
    // herido: se encoge tras el escudo, se echa atrás y vuelve
    herido: una("herido", 0.4, false,
      {
        tronco: { r: K([0, 2], [0.25, -12], [1, 2]) }, cabeza: { r: K([0, -1], [0.25, 14], [1, -1]) },
        brazoD: { r: K([0, -4], [0.25, 10], [1, -4]) }, brazoI: { r: K([0, -22], [0.25, -50], [1, -22]) }, antebrazoI: { r: K([0, -55], [0.25, -70], [1, -55]) },
        musloD: { r: K([0, -4], [0.25, -14], [1, -4]) }, piernaD: { r: K([0, 6], [0.25, 22], [1, 6]) }, musloI: { r: K([0, 5], [0.25, 8], [1, 5]) }, piernaI: { r: K([0, 3], [0.25, 18], [1, 3]) },
      },
      {
        tronco: { sy: K([0, 1], [0.25, 0.93], [1, 1]), r: K([0, 0], [0.25, 4], [1, 0]) }, cabeza: { r: K([0, 0], [0.25, -10], [1, 0]) },
        brazoD: { r: K([0, 4], [0.25, 14], [1, 4]) }, brazoI: { r: K([0, -4], [0.25, -18], [1, -4]) },
        musloD: { sy: K([0, 1], [0.25, 0.88], [1, 1]) }, musloI: { sy: K([0, 1], [0.25, 0.88], [1, 1]) },
      }),
    // morir: cae de rodillas, se dobla y cae de boca; el hacha se le va de la mano
    morir: una("morir", 1.3, false,
      {
        tronco: { r: K([0, 2], [0.35, 10], [0.6, 30], [1, 88]) }, cabeza: { r: K([0, 0], [0.35, 14], [1, 0]) },
        brazoD: { r: K([0, -4], [0.35, 20], [1, -150]) }, antebrazoD: { r: K([0, -10], [1, -20]) }, hacha: { r: K([0, -10], [0.4, 40], [1, 90]), y: K([0, 0], [0.4, 0], [1, 10]) },
        brazoI: { r: K([0, -22], [0.35, -10], [1, -160]) }, antebrazoI: { r: K([0, -55], [1, -20]) },
        musloD: { r: K([0, -4], [0.35, -80], [1, -90]) }, piernaD: { r: K([0, 6], [0.35, 100], [1, 95]) }, pieD: { r: K([0, -2], [0.35, 30], [1, 40]) },
        musloI: { r: K([0, 5], [0.35, -70], [1, -88]) }, piernaI: { r: K([0, 3], [0.35, 95], [1, 92]) }, pieI: { r: K([0, -8], [0.35, 30], [1, 40]) },
      },
      {
        tronco: { sy: K([0, 1], [0.35, 0.95], [0.6, 0.85], [1, 0.35]) }, cabeza: { r: K([0, 0], [0.35, 10], [1, 4]), y: K([0, 0], [1, 6]) },
        brazoD: { r: K([0, 4], [0.35, 14], [1, 20]), sy: K([0, 1], [1, 0.5]) }, brazoI: { r: K([0, -4], [0.35, -14], [1, -20]), sy: K([0, 1], [1, 0.5]) },
        hacha: { r: K([0, 0], [0.4, -30], [1, -80]) },
        musloD: { sy: K([0, 1], [0.35, 0.3], [1, 0.25]) }, musloI: { sy: K([0, 1], [0.35, 0.3], [1, 0.25]) },
        piernaD: { sy: K([0, 1], [0.35, 0.4], [1, 0.4]) }, piernaI: { sy: K([0, 1], [0.35, 0.4], [1, 0.4]) },
      }),
  };
  const ORDEN = ["reposo", "andar", "correr", "aviso", "golpe", "herido", "morir"];
  // una copia que se puede editar sin tocar las de fábrica
  const copia = (a) => JSON.parse(JSON.stringify(a));
  return { MUNECO, COLORES, ANIMS, ORDEN, VISTAS, copia, huesosDe, medidas: { CADERA, TRONCO, MUSLO, PIERNA, TOBILLO, BRAZO, ANTEBRAZO } };
})();
