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
      fl = Math.sin(t * 2) * 3 * s;
    E(c, x, y + 2, 22 * s, 7 * s, "rgba(0,0,0,0.35)");
    if (nivel() !== "baja") halo(c, x, y - 18 * s - fl, 46 * s, RUNICO, 0.45 * late);
    const cy = y - 16 * s - fl;
    P(c, [x - 15 * s, cy + 9 * s, x - 17 * s, cy - 4 * s, x - 8 * s, cy - 14 * s, x + 9 * s, cy - 13 * s, x + 16 * s, cy - 2 * s, x + 13 * s, cy + 10 * s], "#6E6A64");
    P(c, [x, cy - 14 * s, x + 9 * s, cy - 13 * s, x + 16 * s, cy - 2 * s, x + 13 * s, cy + 10 * s, x, cy + 11 * s], "#8E8A82");
    alfa(c, 0.6 + 0.4 * late, () => FUTHARK.dibujar(c, "berkano", x, cy + 8 * s, 18 * s, RUNICO, 2.6 * s));
  }

  Object.assign(ASSETS.LISTA, {
    manantialRunico: { f: manantialRunico, vol: true, alto: 140, choque: { r: 54 }, grupo: "vida", luz: true },
    piedraBerkano: { f: piedraBerkano, figura: true, alto: 40, choque: null, grupo: "vida", luz: true },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, { manantialRunico: { luz: 1 } });
})();
