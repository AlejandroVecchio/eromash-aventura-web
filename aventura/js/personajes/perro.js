// ---------- Skuggi, el perro (CRIATURAS "perro") ----------
// Un perro grande de cazador del norte, primo manso del lobo del zarzal (mismo trazo, criaturas.js): pelo gris
// pardo con el pecho claro, orejas paradas, cola enroscada que se mueve cuando está contento y un collar rojo con
// una chapita de bronce que lleva Algiz. Tres vistas (S frente, E costado, N espaldas). Base en (x, y).
// o = { vista, espejo, mov (0..1 cuánto camina), golpe (0..1 muerde), herido, sentado, echado, ladra, cola (0..1
// cuánto la mueve), cansado (jadea) }
(function () {
  "use strict";
  const { P, E, R, L, sombra } = DIB;
  const PELO = "#7A6E62",
    SOMBRA = "#5E544A",
    CLARO = "#B8AC9C",
    HOCICO = "#2A2420",
    COLLAR = "#9C2315",
    CHAPA = "#E0B064";

  function perro(c, t, o) {
    const v = o.vista || "E",
      m = o.mov || 0,
      paso = Math.sin(t * 13) * 6 * m,
      g = o.golpe || 0,
      cola = Math.sin(t * (6 + (o.cola || 0) * 12)) * (2 + (o.cola || 0) * 6),
      jadeo = o.cansado || o.ladra ? Math.abs(Math.sin(t * 9)) : 0;
    if (o.echado) return echado(c, t, o);
    sombra(c, 0, 0, 36, 8, 0.38);
    if (v === "E") {
      const sent = o.sentado ? 1 : 0;
      // patas: sentado, las de atrás dobladas bajo el cuerpo
      if (sent) {
        P(c, [-24, -14, -6, -14, -4, 0, -26, 0], SOMBRA);
        [[16, 0], [24, 0]].forEach(([px], k) => P(c, [px - 3, -30, px + 3, -30, px + 3, 0, px - 3, 0], k ? PELO : SOMBRA));
      } else
        [[-24, paso], [-14, -paso], [16, -paso], [25, paso]].forEach(([px, d], k) =>
          P(c, [px - 3, -24, px + 3, -24, px + 3 + d * 0.4, 0, px - 4 + d * 0.4, 0], k % 2 ? SOMBRA : PELO),
        );
      // cuerpo (sentado se inclina hacia arriba)
      const cb = sent ? [-26, -12, -22, -34, 14, -50, 28, -44, 26, -24, -20, -10] : [-32, -24, -26, -42, 18, -44 - g * 3, 30, -36, 30, -20, -26, -18];
      P(c, cb, PELO);
      P(c, sent ? [-26, -12, -22, -34, -4, -42, -6, -12] : [-32, -24, -26, -42, -8, -43, -10, -20, -26, -18], SOMBRA);
      // el pecho claro
      P(c, sent ? [18, -46, 28, -44, 26, -24, 18, -26] : [22, -40, 30, -36, 30, -22, 22, -24], CLARO);
      // la cola enroscada sobre el lomo
      const cx = sent ? -24 : -30,
        cy = sent ? -22 : -38;
      P(c, [cx + 2, cy + 4, cx - 7, cy - 6, cx - 4, cy - 18 + cola, cx + 6, cy - 22 + cola, cx + 13, cy - 15 + cola * 0.5, cx + 8, cy - 9, cx + 6, cy - 14 + cola * 0.6, cx + 1, cy - 14 + cola * 0.8, cx + 1, cy - 4, cx + 8, cy + 2], SOMBRA);
      P(c, [cx + 6, cy - 22 + cola, cx + 13, cy - 15 + cola * 0.5, cx + 7, cy - 16 + cola * 0.6], CLARO);
      // cabeza
      const hx = (sent ? 26 : 30) + g * 10,
        hy = (sent ? -56 : -42) + g * 8;
      P(c, [hx - 6, hy - 6, hx + 8, hy - 12, hx + 24, hy - 3, hx + 24, hy + 5, hx + 4, hy + 10, hx - 6, hy + 6], PELO);
      P(c, [hx + 12, hy, hx + 24, hy - 3, hx + 24, hy + 5, hx + 12, hy + 6], CLARO);
      // orejas paradas
      P(c, [hx + 2, hy - 9, hx + 5, hy - 22, hx + 11, hy - 11], SOMBRA);
      P(c, [hx + 7, hy - 11, hx + 11, hy - 22, hx + 14, hy - 10], PELO);
      P(c, [hx + 24, hy - 3, hx + 24, hy + 4, hx + 18, hy + 1], HOCICO);
      // la boca: abierta al ladrar, al morder o al jadear (con la lengua)
      if (g > 0.4 || o.ladra || jadeo > 0.2) {
        P(c, [hx + 10, hy + 5, hx + 23, hy + 5, hx + 18, hy + 10 + jadeo * 2], HOCICO);
        if (!g) P(c, [hx + 13, hy + 7, hx + 18, hy + 7, hx + 16, hy + 12 + jadeo * 3], "#C8606A");
        else P(c, [hx + 12, hy + 5, hx + 23, hy + 5, hx + 19, hy + 8], "#E8DCC4");
      }
      // el ojo, oscuro con un brillo: mira amigo
      R(c, hx + 9, hy - 5, 4, 3, "#1A1A1E");
      R(c, hx + 11, hy - 5, 1.5, 1.5, "#F2ECEC");
      // collar y chapa
      P(c, [hx - 4, hy + 2, hx + 2, hy - 4, hx + 6, hy + 8, hx, hy + 12], COLLAR);
      E(c, hx + 3, hy + 13, 2.6, 2.6, CHAPA);
    } else {
      const atras = v === "N",
        sent = o.sentado ? 1 : 0;
      P(c, [-12, -22, -6, -22, -6 + paso * 0.2, 0, -12 + paso * 0.2, 0], SOMBRA);
      P(c, [6, -22, 12, -22, 12 - paso * 0.2, 0, 6 - paso * 0.2, 0], PELO);
      if (sent) {
        P(c, [-20, 0, -14, -12, -8, 0], SOMBRA);
        P(c, [8, 0, 14, -12, 20, 0], PELO);
      }
      P(c, [-17, -20 - sent * 4, -15, -42 - sent * 6, 15, -42 - sent * 6, 17, -20 - sent * 4], atras ? SOMBRA : PELO);
      P(c, [-17, -20 - sent * 4, -15, -42 - sent * 6, 0, -42 - sent * 6, 0, -20 - sent * 4], SOMBRA);
      if (atras) {
        // la cola enroscada, de espaldas
        P(c, [-6, -40, 6 + cola * 0.5, -54, 10 + cola * 0.4, -46, 4, -38], CLARO);
        P(c, [-6, -40, 2 + cola * 0.5, -50, 4, -38], SOMBRA);
      } else {
        P(c, [-9, -40 - sent * 6, 9, -40 - sent * 6, 7, -22 - sent * 4, -7, -22 - sent * 4], CLARO);
        const hy = -46 - sent * 8 + g * 5;
        P(c, [-11, hy, 11, hy, 9, hy + 13, 0, hy + 20, -9, hy + 13], PELO);
        P(c, [-11, hy, 0, hy, 0, hy + 20, -9, hy + 13], SOMBRA);
        P(c, [-5, hy + 10, 5, hy + 10, 0, hy + 20], CLARO);
        P(c, [-11, hy, -10, hy - 13, -4, hy], SOMBRA);
        P(c, [11, hy, 10, hy - 13, 4, hy], PELO);
        R(c, -7, hy + 4, 4, 3, "#1A1A1E");
        R(c, 3, hy + 4, 4, 3, "#1A1A1E");
        R(c, -5.5, hy + 4, 1.4, 1.4, "#F2ECEC");
        R(c, 4.5, hy + 4, 1.4, 1.4, "#F2ECEC");
        P(c, [-3, hy + 15, 3, hy + 15, 0, hy + 19], HOCICO);
        if (o.ladra || jadeo > 0.2) P(c, [-2, hy + 19, 2, hy + 19, 0, hy + 24 + jadeo * 2], "#C8606A");
        P(c, [-10, hy + 18, 10, hy + 18, 9, hy + 22, -9, hy + 22], COLLAR);
        E(c, 0, hy + 24, 2.6, 2.6, CHAPA);
      }
    }
  }
  // echado de costado: herido (antes del rescate) o descansando
  function echado(c, t, o) {
    const resp = Math.sin(t * 2.4) * 1.2;
    sombra(c, 0, 0, 44, 9, 0.38);
    P(c, [-34, -4, -30, -20 - resp, 16, -24 - resp, 30, -14, 28, -2, -30, 0], PELO);
    P(c, [-34, -4, -30, -20 - resp, -8, -22 - resp, -10, 0, -30, 0], SOMBRA);
    P(c, [14, -20, 28, -14, 28, -4, 16, -6], CLARO);
    // patas estiradas
    P(c, [8, -4, 28, -2, 30, 2, 8, 2], SOMBRA);
    P(c, [-22, -2, -4, -2, -2, 2, -22, 2], SOMBRA);
    // cola en el piso
    P(c, [-32, -6, -50, -4 + Math.sin(t * 3) * (o.cola || 0) * 4, -48, 0, -32, -1], SOMBRA);
    // cabeza apoyada
    P(c, [24, -18, 36, -24, 52, -16, 52, -9, 32, -6, 24, -10], PELO);
    P(c, [40, -14, 52, -16, 52, -9, 40, -8], CLARO);
    P(c, [30, -21, 32, -32, 38, -22], SOMBRA);
    P(c, [52, -16, 52, -10, 47, -13], HOCICO);
    if (o.herido2) L(c, 38, -17, 43, -17, "#1A1A1E", 1.6);
    else {
      R(c, 38, -19, 4, 3, "#1A1A1E");
      R(c, 40, -19, 1.4, 1.4, "#F2ECEC");
    }
    P(c, [26, -14, 30, -20, 34, -8, 30, -6], COLLAR);
    // la herida (antes del rescate): un trapo rojo atado en la pata
    if (o.herido2) R(c, 12, -6, 8, 6, "#C8402D");
  }
  CRIATURAS.registrar("perro", perro);
  // no es una criatura enemiga: sale de la lista del bestiario y del catálogo de enemigos, y se muestra en el
  // catálogo como assets propios (de costado, de frente sentado y echado)
  CRIATURAS.LISTA.splice(CRIATURAS.LISTA.indexOf("perro"), 1);
  if (window.ASSETS)
    Object.assign(ASSETS.LISTA, {
      skuggi: { f: (c, x, y, t, o) => CRIATURAS.dibujar(c, "perro", x, y, t, { vista: "E", mov: 0, cola: 1, s: o.s }), alto: 70, grupo: "companero" },
      skuggiSentado: { f: (c, x, y, t, o) => CRIATURAS.dibujar(c, "perro", x, y, t, { vista: "S", sentado: true, cansado: true, s: o.s }), alto: 70, grupo: "companero" },
      skuggiHerido: { f: (c, x, y, t, o) => CRIATURAS.dibujar(c, "perro", x, y, t, { echado: true, herido2: true, s: o.s }), alto: 40, grupo: "companero" },
    });
})();
