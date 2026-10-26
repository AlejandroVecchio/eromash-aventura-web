// ---------- las piedras de Berkano y los manantiales rúnicos (se suman a ASSETS) ----------
// El manantial rúnico: una pila de piedra de ocho caras con el agua celeste y una estela atrás con Berkano tallada
// (la runa del abedul, de la vida que vuelve); o.luz (0..1) es cuánta agua le queda y la pone motor/berkano.js.
// La piedra de Berkano tirada en el piso: chata, con la runa que late; o.tomada la esconde. Mismas reglas que
// assets.js: el manantial es volumen (se ve desde cualquier giro), la piedra es figura (igual de cualquier lado).
(function () {
  "use strict";
  const { P, E, alfa, halo } = DIB;
  const RUNICO = "#73D5DB",
    PIEDRA = ["#56524C", "#77736C", "#9A968E"],
    BORDE = ["#625E57", "#86827A", "#A8A49C"];
  const nivel = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  // mezcla de dos colores #rrggbb (k = 0 → a, 1 → b)
  function mezcla(a, b, k) {
    const h = (c, i) => parseInt(c.substr(1 + i * 2, 2), 16);
    return "#" + [0, 1, 2].map((i) => Math.round(h(a, i) + (h(b, i) - h(a, i)) * k).toString(16).padStart(2, "0")).join("");
  }

  // ---------- el manantial rúnico ----------
  function manantialRunico(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      luz = o.luz == null ? 1 : Math.max(0, Math.min(1, o.luz)),
      late = 0.75 + Math.sin(t * 2.4 + x * 0.01) * 0.25,
      runa = luz > 0.01 ? RUNICO : "#3A3634";
    VOL.sombra(c, pr, 0, 4, 70, 36);
    if (luz > 0.01 && nivel() !== "baja") VOL.halo(c, pr, 0, 0, 40, 120, RUNICO, 0.35 * luz * late);
    const S = VOL.escena(pr);
    // la estela de atrás con Berkano en su frente (y la misma runa gastada atrás)
    S.poner(0, -50, () => {
      VOL.caja(c, pr, -20, -60, 0, 20, -44, 118, PIEDRA, {
        frente: (cc, l, h) => alfa(cc, luz > 0.01 ? 0.55 + 0.45 * late : 1, () => FUTHARK.dibujar(cc, "berkano", l / 2, -h * 0.3, h * 0.3, runa, 4)),
        atras: (cc, l, h) => FUTHARK.dibujar(cc, "berkano", l / 2, -h * 0.3, h * 0.3, "#46423C", 3),
      });
      VOL.piramide(c, pr, [[-20, -60], [20, -60], [20, -44], [-20, -44]], 118, 0, -52, 136, PIEDRA);
    });
    // la pila: ocho caras de piedra, el borde un poco más claro y el agua adentro
    S.poner(0, 6, () => {
      VOL.cilindro(c, pr, 0, 6, 60, 0, 22, PIEDRA, { n: 8, fase: Math.PI / 8 });
      VOL.cilindro(c, pr, 0, 6, 62, 22, 30, BORDE, { n: 8, fase: Math.PI / 8 });
      VOL.elipse(c, pr, 0, 6, 30.5, 50, 50, "#2A2824");
      const agua = mezcla("#3A4446", RUNICO, 0.25 + luz * 0.75);
      if (luz > 0.01) {
        VOL.elipse(c, pr, 0, 6, 30.8, 46, 46, mezcla("#2A3436", "#3E9AA0", luz));
        VOL.elipse(c, pr, 0, 6, 31, 46 * (0.4 + luz * 0.6), 46 * (0.4 + luz * 0.6), agua);
        // anillos que se abren en el agua
        if (nivel() !== "baja") {
          const k = (t * 0.6) % 1;
          VOL.enPiso(c, pr, (cc) => alfa(cc, 0.5 * (1 - k) * luz, () => {
            cc.strokeStyle = "#E6FBFC";
            cc.lineWidth = 2;
            cc.beginPath();
            cc.ellipse(0, 6, 10 + k * 34, 10 + k * 34, 0, 0, Math.PI * 2);
            cc.stroke();
          }), 31.2);
        }
      } else VOL.elipse(c, pr, 0, 6, 30.8, 46, 46, "#34302C");
      // motas rúnicas cuadradas que suben del agua
      if (luz > 0.01 && nivel() === "alta") {
        const s = pr.s;
        for (let k = 0; k < 4; k++) {
          const f = (t * 0.35 + k / 4) % 1,
            p = pr(Math.sin(k * 2.3) * 26, 6 + Math.cos(k * 1.7) * 20, 32 + f * 90);
          alfa(c, (1 - f) * 0.8 * luz, () => {
            c.fillStyle = k % 2 ? RUNICO : "#C8F2F4";
            c.fillRect(p[0] - 2.5 * s, p[1] - 2.5 * s, 5 * s, 5 * s);
          });
        }
      }
    });
    S.dibujar();
  }

  // ---------- la piedra de Berkano tirada ----------
  function piedraBerkano(c, x, y, t, o) {
    if (o.tomada) return;
    const s = o.s || 1,
      late = 0.6 + Math.sin(t * 3 + x * 0.02) * 0.4,
      fl = o.aire ? 0 : Math.sin(t * 2) * 3 * s; // o.aire: va por el aire (sin sombra ni vaivén; la pone quien la mueve)
    if (!o.aire) E(c, x, y + 2, 22 * s, 7 * s, "rgba(0,0,0,0.35)");
    if (nivel() !== "baja") halo(c, x, y - 18 * s - fl, 46 * s, RUNICO, 0.45 * late);
    const cy = y - 16 * s - fl;
    P(c, [x - 15 * s, cy + 9 * s, x - 17 * s, cy - 4 * s, x - 8 * s, cy - 14 * s, x + 9 * s, cy - 13 * s, x + 16 * s, cy - 2 * s, x + 13 * s, cy + 10 * s], "#6E6A64");
    P(c, [x, cy - 14 * s, x + 9 * s, cy - 13 * s, x + 16 * s, cy - 2 * s, x + 13 * s, cy + 10 * s, x, cy + 11 * s], "#8E8A82");
    alfa(c, 0.6 + 0.4 * late, () => FUTHARK.dibujar(c, "berkano", x, cy + 8 * s, 18 * s, RUNICO, 2.6 * s));
  }

  // ---------- la piedra que surge al salvarse ----------
  // Como la botella de vida del MediEvil 2: cuando Eromash cae, una piedra parada con Berkano sale del piso, crece,
  // tiembla con las grietas encendidas y estalla (motor/berkano.js). o.k (0..1) cuánto salió, o.grieta (0..1) cuánto
  // se rajó, o.luz (0..1) cuánto brilla. Figura: es una piedra parada, igual de cualquier lado.
  function piedraBerkanoSurge(c, x, y, t, o) {
    const k = o.k == null ? 1 : o.k,
      gr = o.grieta || 0,
      lz = o.luz == null ? 0.6 : o.luz,
      s = (o.s || 1) * (0.55 + 0.45 * k),
      H = 118 * s,
      tiembla = gr > 0 ? Math.sin(t * 90) * 2.5 * gr : 0;
    // el piso que se abre: la boca oscura, la luz de abajo y los terrones
    E(c, x, y + 2, 40 * s + 8, 13 * s + 3, "rgba(17,17,17,0.45)");
    E(c, x, y + 1, 30 * s, 9 * s, mezcla("#2A2624", "#3E7C80", lz * 0.7));
    if (nivel() !== "baja") halo(c, x, y - H * 0.45 * k, 90 * s, RUNICO, (0.25 + 0.5 * lz) * k);
    c.save();
    c.beginPath();
    c.rect(x - 200, y - 400, 400, 400 + 1); // solo lo que ya salió del piso
    c.clip();
    const b = y + (1 - k) * H, // la base de la piedra, hundida mientras sale
      X = x + tiembla;
    const w = 28 * s;
    // la cara de sombra (izquierda) y la de luz (derecha), con la punta inclinada
    P(c, [X - w, b, X - w * 1.1, b - H * 0.55, X - w * 0.7, b - H * 0.92, X - w * 0.1, b - H, X, b - H, X, b], PIEDRA[0]);
    P(c, [X, b, X, b - H, X + w * 0.55, b - H * 0.96, X + w * 1.05, b - H * 0.62, X + w, b], PIEDRA[1]);
    P(c, [X - w * 0.1, b - H, X + w * 0.55, b - H * 0.96, X + w * 0.2, b - H * 0.9, X - w * 0.4, b - H * 0.93], PIEDRA[2]);
    // Berkano tallada, más clara cuanto más carga
    alfa(c, 0.55 + 0.45 * lz, () => FUTHARK.dibujar(c, "berkano", X + w * 0.1, b - H * 0.3, 40 * s, mezcla("#4E8E92", "#C8F2F4", lz), 4 * s));
    // las grietas que se encienden antes de estallar
    if (gr > 0) {
      c.strokeStyle = mezcla(RUNICO, "#F2ECEC", gr);
      c.lineWidth = 2.4 * s;
      c.lineCap = "round";
      const g = [
        [-0.7, 0.85, -0.2, 0.6, -0.5, 0.35],
        [0.8, 0.7, 0.3, 0.5, 0.6, 0.2],
        [-0.3, 0.15, 0.2, 0.35, -0.1, 0.55],
        [0.5, 0.9, 0.1, 0.75],
      ];
      g.forEach((l, i) => {
        if (gr < i * 0.2) return;
        c.beginPath();
        for (let j = 0; j < l.length; j += 2) {
          const px = X + l[j] * w,
            py = b - l[j + 1] * H;
          j ? c.lineTo(px, py) : c.moveTo(px, py);
        }
        c.stroke();
      });
    }
    c.restore();
  }

  Object.assign(ASSETS.LISTA, {
    manantialRunico: { f: manantialRunico, vol: true, alto: 140, choque: { r: 54 }, grupo: "vida", luz: true },
    piedraBerkano: { f: piedraBerkano, figura: true, alto: 40, choque: null, grupo: "vida", luz: true },
    piedraBerkanoSurge: { f: piedraBerkanoSurge, figura: true, alto: 120, choque: null, grupo: "vida", luz: true },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, { manantialRunico: { luz: 1 }, piedraBerkanoSurge: { k: 1, grieta: 0.6, luz: 0.8 } });
})();
