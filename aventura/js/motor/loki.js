// ---------- las piedras de Loki (sistema LOKI): pistas para los minijuegos ----------
// Piedritas lisas con la serpiente de Loki tallada: el embaucador ayuda a hacer trampa. En cualquier minijuego (los de
// MINIJ y los juegos de runas) el botón «Pista» de abajo a la derecha (o la Lente, R) gasta una y el juego da una
// ayuda: la cerradura alinea un anillo, el memotest junta un par, la plegaria se vuelve a mostrar, el verso muestra una
// runa en su lugar… Cada juego dice qué pista da (`pista(S)` en MINIJ.registrar, PISTA en juegos-runas.js); si no
// tiene o ya no hay nada que ayudar, la piedra no se gasta. Salen de los cofres (uno de cada cuatro) y Loki regala dos
// la primera vez que se juega uno. Se llevan hasta `MAX`, se ven en la Bolsa. Estado guardado en E.extra.loki
// = { n, regalo, usadas }. Textos `lk.` en textos/loki.js.
window.LOKI = (function () {
  "use strict";
  let A, J;
  let st = { n: 0, regalo: false, usadas: 0 };
  const t = (k, v) => I18N.t(k, v);
  const MAX = 9;
  const VERDE = "#7BC86C";

  const cuantas = () => st.n;
  function dar(n = 1, callado) {
    const antes = st.n;
    st.n = Math.min(MAX, st.n + n);
    if (!callado && st.n > antes && window.HUD) HUD.aviso(t("lk.recibe", [st.n - antes]), VERDE);
    return st.n - antes;
  }
  // el primer minijuego: Loki deja dos para que se conozcan
  function alAbrirJuego() {
    if (st.regalo) return;
    st.regalo = true;
    dar(2, true);
    if (window.HUD) HUD.aviso(t("lk.regalo"), VERDE);
  }
  // pedir una pista: fn() da la ayuda y devuelve true si la dio; la piedra se gasta solo entonces
  function usar(fn) {
    if (st.n <= 0) {
      if (window.SONIDO) SONIDO.tono("sawtooth", 140, 120, 0.25, 0.05, {});
      return "sin";
    }
    if (!fn()) return "nada";
    st.n--;
    st.usadas++;
    if (window.SONIDO) {
      SONIDO.tono("triangle", 620, 930, 0.35, 0.06, {});
      SONIDO.tono("sine", 930, 1240, 0.3, 0.04, { retraso: 0.12 });
    }
    return "ok";
  }

  // ---------- el dibujo: la piedra (ícono, botón) ----------
  // alrededor de (0, 0), unos 60 de alto: piedra chata con la luz de arriba a la derecha y la serpiente verde tallada
  function piedra(c) {
    const { P, E } = DIB;
    E(c, 0, 24, 24, 6, "rgba(0,0,0,0.25)");
    P(c, [-24, 4, -18, -18, 2, -26, 22, -16, 26, 6, 14, 22, -10, 24], "#4A4442");
    P(c, [2, -26, 22, -16, 26, 6, 14, 22, 2, 23], "#6E6A66");
    c.save();
    c.lineCap = "round";
    c.lineJoin = "round";
    c.strokeStyle = VERDE;
    c.lineWidth = 3.6;
    // la serpiente: una S que se muerde la cola, con el ojo
    c.beginPath();
    c.moveTo(8, -14);
    c.quadraticCurveTo(-12, -16, -10, -4);
    c.quadraticCurveTo(-8, 4, 4, 2);
    c.quadraticCurveTo(14, 2, 10, 12);
    c.quadraticCurveTo(4, 18, -8, 14);
    c.stroke();
    c.restore();
    P(c, [8, -17, 12, -14, 8, -11, 5, -14], VERDE);
  }
  // el botón de los minijuegos, en el lienzo de 1600 × 900: { x, y, w, h } para tocarlo
  const BOTON = { x: 1236, y: 788, w: 168, h: 58 };
  const dentro = (x, y) => x >= BOTON.x && x <= BOTON.x + BOTON.w && y >= BOTON.y && y <= BOTON.y + BOTON.h;
  // aviso: { txt, t } que el juego guarda para mostrar lo que pasó con la última pista
  function boton(c, puede, aviso) {
    const { P } = DIB,
      b = BOTON,
      hay = st.n > 0 && puede;
    P(c, [b.x + 8, b.y, b.x + b.w, b.y, b.x + b.w, b.y + b.h - 8, b.x + b.w - 8, b.y + b.h, b.x, b.y + b.h, b.x, b.y + 8], hay ? "#2A3A2A" : "#221C1A");
    P(c, [b.x, b.y, b.x + b.w, b.y, b.x + b.w, b.y + 3, b.x, b.y + 3], hay ? VERDE : "#3A3634");
    c.save();
    c.translate(b.x + 32, b.y + b.h / 2 + 2);
    c.scale(0.62, 0.62);
    DIB.alfa(c, hay ? 1 : 0.45, () => piedra(c));
    c.restore();
    c.textBaseline = "alphabetic";
    c.font = '700 19px "DM Sans", system-ui, sans-serif';
    c.textAlign = "left";
    c.fillStyle = hay ? "#F2ECEC" : "#8A8480";
    c.fillText(t("lk.pista"), b.x + 62, b.y + 27);
    c.font = '500 14px "DM Sans", system-ui, sans-serif';
    c.fillStyle = hay ? VERDE : "#8A8480";
    c.fillText(t("lk.quedan", [st.n, CONTROLES.glifo("lente")]), b.x + 62, b.y + 46);
    if (aviso && aviso.t > 0) {
      c.font = '600 15px "DM Sans", system-ui, sans-serif';
      c.textAlign = "right";
      c.fillStyle = aviso.mal ? "#FF8D71" : VERDE;
      DIB.alfa(c, Math.min(1, aviso.t * 2), () => c.fillText(aviso.txt, b.x + b.w, b.y - 12));
    }
  }
  // lo que pasó con una pista, para el aviso de arriba del botón
  const avisoDe = (res) => ({ txt: t("lk.res_" + res), t: 2.2, mal: res !== "ok" });

  // ---------- la Bolsa ----------
  function celdasBolsa() {
    return st.n ? [{ id: "loki", icono: "loki", nombre: t("lk.nombre"), desc: t("lk.desc", [MAX]), cant: st.n }] : [];
  }

  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      if (window.INVENTARIO && INVENTARIO.iconoDe) INVENTARIO.iconoDe("loki", piedra);
    },
    alEmpezar(extra) {
      extra.loki = Object.assign({ n: 0, regalo: false, usadas: 0 }, extra.loki || {});
      st = extra.loki;
    },
    celdasBolsa,
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, cuantas, dar, usar, alAbrirJuego, boton, dentro, avisoDe, piedra, MAX, BOTON, estado: () => st };
})();
