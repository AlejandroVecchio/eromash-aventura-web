// ---------- el tiro de hachas en el campo de la Guardia (módulo TIRO25) ----------
// De 8 a 20, junto a una de las dianas del campo de entrenamiento, Eromash puede tirar cinco hachas. La diana se ve
// grande en pantalla y la mira (un rombo de luz rúnica) se mece sola, cada hacha un poco más; atacar o E suelta el tiro
// donde esté la mira. Los anillos valen 10, 6, 3 y 1. Con 30 o más paga plata y experiencia la primera vez de cada día;
// el mejor puntaje queda guardado. Mientras dura, Eromash se queda quieto (`activo()`, lo mira ciudad/juego.js).
// Estado en E.extra.eikholt.tiro = { dia, mejor }; textos ek.tr_.
//   TIRO25.cercano(plano, e, st, A) → { texto, fn, d, x, y } o null · actualizar(dt, st, A) · dibujar(c, cw, ch, t) · activo()
window.TIRO25 = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const HACHAS = 5,
    META = 30,
    PAGA = 6;
  // anillos de afuera hacia adentro: radio (fracción de la diana), puntos, color
  const ANILLOS = [
    [1, 1, "#F2ECEC"],
    [0.74, 3, "#111111"],
    [0.5, 6, "#9C2315"],
    [0.24, 10, "#FFD98A"],
  ];
  const dia = (A) => Math.floor(((A.H.E.tiempo / LUZ.DIA) * 24 + 9 - 6) / 24);
  const estado = (st) => (st.tiro = st.tiro || { dia: -1, mejor: 0 });
  let juego = null; // { n, tiros: [{ x, y, p }], t, fase, espera, total }
  let dianas = null;

  // dónde está la mira (en fracciones del radio): dos senos que no se repiten, más anchos con cada hacha
  function mira() {
    const k = 0.32 + juego.tiros.length * 0.11,
      a = juego.t;
    return [k * Math.sin(a * 1.7 + juego.fase) + 0.12 * Math.sin(a * 4.3), k * 0.85 * Math.sin(a * 2.3 + juego.fase * 2) + 0.1 * Math.cos(a * 3.7)];
  }
  function puntos(x, y) {
    const r = Math.hypot(x, y);
    let p = 0;
    for (const [rr, v] of ANILLOS) if (r <= rr) p = v;
    return p;
  }
  function empezar(A) {
    juego = { tiros: [], t: 0, fase: Math.random() * 6, espera: 0, total: 0 };
    if (window.ANIMA) ANIMA.gesto("asiente");
    HUD.aviso(t("ek.tr_empieza", [HACHAS]), "#FFD98A");
  }
  function terminar(st, A) {
    const s = estado(st),
      total = juego.total,
      paga = total >= META && s.dia !== dia(A),
      record = total > s.mejor;
    juego = null;
    if (record) s.mejor = total;
    if (paga) s.dia = dia(A);
    const linea = total >= META ? (paga ? "ek.tr_bien" : "ek.tr_bien_otra") : "ek.tr_flojo";
    A.dialogoLibre([["eromash", linea, [total]]], () => {
      if (paga) {
        PODERES.darPlata(PAGA);
        if (window.RPG && RPG.dar) RPG.dar(20, A.jug ? A.jug.x : 0, A.jug ? A.jug.y : 0);
        HUD.aviso(t("ek.tr_premio", [PAGA]), "#FFD98A");
      }
      if (record) HUD.aviso(t("ek.tr_record", [total]), "#FFD98A");
    });
  }

  function cercano(plano, e, st, A) {
    if (juego) return null;
    const h = LUZ.hora(A.H.E.tiempo);
    if (h < 8 || h >= 20) return null;
    dianas = dianas || plano.cosas.filter((o) => o.id === "dianaTiro");
    let mejor = null;
    for (const o of dianas) {
      const d = Math.hypot(o.x - e.x, o.y - e.y);
      if (d < 3 * plano.M && (!mejor || d < mejor.d)) mejor = { texto: t("ek.tr_accion", [estado(st).mejor]), fn: () => empezar(A), d, x: o.x, y: o.y };
    }
    return mejor;
  }

  // la mira se mece; atacar o E tira; después de la última hacha, un instante para ver la diana y el resultado
  function actualizar(dt, st, A) {
    if (!juego || A.J.modo !== "juego") return;
    juego.t += dt;
    if (juego.espera > 0) {
      if ((juego.espera -= dt) <= 0 && juego.tiros.length >= HACHAS) terminar(st, A);
      return;
    }
    if (CONTROLES.recien("atacar") || CONTROLES.recien("interactuar")) {
      const [x, y] = mira(),
        p = puntos(x, y);
      juego.tiros.push({ x, y, p, t: juego.t });
      juego.total += p;
      juego.espera = juego.tiros.length >= HACHAS ? 1.4 : 0.35;
      if (window.SONIDO) {
        SONIDO.tocar(p ? "golpe" : "tajo", { vol: 0.35, tono: p >= 10 ? 1.25 : 0.9 + Math.random() * 0.2 });
        if (p >= 10) SONIDO.tono("triangle", 900, 1400, 0.2, 0.05);
      }
    }
  }

  // la diana en pantalla: rodaja de tronco con los anillos pintados, las hachas clavadas y la mira
  function dibujar(c, cw, ch, tt) {
    if (!juego) return;
    const R = Math.min(cw, ch) * 0.26,
      cx = cw / 2,
      cy = ch * 0.42;
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "rgba(17,17,17,0.45)";
    c.fillRect(0, 0, cw, ch);
    // sombra elíptica, el canto del tronco (mitad izquierda en sombra) y la cara
    c.fillStyle = "rgba(17,17,17,0.5)";
    c.beginPath();
    c.ellipse(cx + R * 0.12, cy + R * 1.18, R * 0.95, R * 0.18, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = ASSETS.C.maderaSombra;
    c.beginPath();
    c.arc(cx + R * 0.06, cy + R * 0.06, R * 1.12, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = ASSETS.C.maderaLuz;
    c.beginPath();
    c.arc(cx, cy, R * 1.12, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = ASSETS.C.madera;
    c.beginPath();
    c.arc(cx, cy, R * 1.12, Math.PI * 0.5, Math.PI * 1.5);
    c.fill();
    for (const [rr, , col] of ANILLOS) {
      c.fillStyle = col;
      c.beginPath();
      c.arc(cx, cy, R * rr, 0, Math.PI * 2);
      c.fill();
    }
    // las hachas clavadas: mango oscuro hacia abajo a la derecha y la hoja de hierro
    for (const h of juego.tiros) {
      const x = cx + h.x * R,
        y = cy + h.y * R,
        k = Math.min(1, (juego.t - h.t) * 8),
        s = R * 0.16 * (1.6 - 0.6 * k);
      c.fillStyle = "rgba(17,17,17,0.35)";
      c.beginPath();
      c.ellipse(x + s * 0.3, y + s * 0.15, s * 0.5, s * 0.22, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#5E130D";
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + s * 1.9, y + s * 1.5);
      c.lineTo(x + s * 1.75, y + s * 1.68);
      c.lineTo(x - s * 0.12, y + s * 0.2);
      c.fill();
      c.fillStyle = "#cfc6c6";
      c.beginPath();
      c.moveTo(x - s * 0.35, y - s * 0.5);
      c.lineTo(x + s * 0.4, y - s * 0.1);
      c.lineTo(x + s * 0.05, y + s * 0.45);
      c.lineTo(x - s * 0.55, y + s * 0.15);
      c.fill();
      c.fillStyle = "#9a9090";
      c.beginPath();
      c.moveTo(x - s * 0.35, y - s * 0.5);
      c.lineTo(x - s * 0.55, y + s * 0.15);
      c.lineTo(x - s * 0.1, y - s * 0.05);
      c.fill();
      if (juego.t - h.t < 0.6) {
        c.fillStyle = h.p >= 10 ? "#FFD98A" : h.p ? "#F2ECEC" : "#E0B2B2";
        c.font = `700 ${Math.round(R * 0.16)}px "DM Sans", sans-serif`;
        c.textAlign = "center";
        c.globalAlpha = 1 - (juego.t - h.t) / 0.6;
        c.fillText(h.p ? "+" + h.p : t("ek.tr_afuera"), x, y - s - (juego.t - h.t) * R * 0.4);
        c.globalAlpha = 1;
      }
    }
    // la mira: rombo de luz rúnica con su punto
    if (juego.tiros.length < HACHAS && juego.espera <= 0) {
      const [mx, my] = mira(),
        x = cx + mx * R,
        y = cy + my * R,
        s = R * 0.09 * (1 + 0.08 * Math.sin(tt * 9));
      c.strokeStyle = "#73D5DB";
      c.lineWidth = Math.max(2, R * 0.018);
      c.beginPath();
      c.moveTo(x, y - s);
      c.lineTo(x + s, y);
      c.lineTo(x, y + s);
      c.lineTo(x - s, y);
      c.closePath();
      c.stroke();
      c.fillStyle = "#73D5DB";
      c.fillRect(x - 2, y - 2, 4, 4);
    }
    // el marcador: hachas que quedan y puntos
    c.textAlign = "center";
    c.fillStyle = "#F2ECEC";
    c.font = `700 ${Math.round(R * 0.13)}px "DM Sans", sans-serif`;
    c.fillText(t("ek.tr_marcador", [juego.total, HACHAS - juego.tiros.length]), cx, cy + R * 1.42);
    c.font = `500 ${Math.round(R * 0.085)}px "DM Sans", sans-serif`;
    c.fillStyle = "#E0B2B2";
    c.fillText(t("ek.tr_ayuda", [CONTROLES.glifo ? CONTROLES.glifo("atacar") : "", META]), cx, cy + R * 1.58);
    c.restore();
  }
  return { cercano, actualizar, dibujar, activo: () => !!juego, META };
})();
