// ---------- la pulseada con los parroquianos del Hongo Dorado (módulo PULSO25) ----------
// De 22 a 2, a los parroquianos que salen del Hongo (`p.borracho` en MUNDO25) se les puede proponer una pulseada sobre
// un barril por 2 de plata. Se ve en pantalla: los dos brazos trabados y la barra de quién gana; el parroquiano empuja
// parejo con tirones de borracho y cada atacar (o E) empuja del lado de Eromash. Gana el que lleva la mano del otro al
// barril; si en 12 s nadie lo logra, gana el que va adelante. Ganar devuelve la apuesta y paga 5 la primera vez de cada
// noche. Mientras dura, Eromash se queda quieto (`activo()`). Estado en E.extra.eikholt.pulso = { dia, ganadas };
// textos ek.pu_.
//   PULSO25.cercano(plano, e, st, A, gente) → { texto, fn, d, x, y } o null · actualizar(dt, st, A) · dibujar(c, cw, ch, t) · activo()
window.PULSO25 = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const APUESTA = 2,
    PAGA = 5,
    DURA = 12,
    EMPUJE = 0.085;
  const dia = (A) => Math.floor(((A.H.E.tiempo / LUZ.DIA) * 24 + 9 - 6) / 24);
  const estado = (st) => (st.pulso = st.pulso || { dia: -1, ganadas: 0 });
  let juego = null; // { p, v, t, fuerza, fin, gano }

  function empezar(p, A, e) {
    const pj = PODERES.pj();
    if (pj.plata < APUESTA) return HUD.aviso(t("ek.pu_sin_plata", [APUESTA]), "#C8402D");
    pj.plata -= APUESTA;
    // cada parroquiano tiene su fuerza (sale de su lugar, igual toda la noche) y empuja más con la hora
    const h = Math.abs(Math.round(p.borracho.cx * 3 + p.borracho.cy * 7)) % 100;
    juego = { p, v: 0, t: 0, fuerza: 0.36 + (h / 100) * 0.22, fin: 0, gano: null, x: p.x, y: p.y };
    p.miraA = [e.x - p.x, e.y - p.y];
    if (window.SONIDO) SONIDO.tocar("golpe", { vol: 0.3, tono: 0.7 });
    HUD.aviso(t("ek.pu_empieza"), "#FFD98A");
  }
  function cerrar(st, A) {
    const s = estado(st),
      gano = juego.gano,
      paga = gano && s.dia !== dia(A);
    juego.p.vx = 30; // vuelve a tambalearse (MUNDO25 no mueve a los que tienen vx y vy en 0)
    juego = null;
    if (gano) {
      s.ganadas++;
      if (paga) s.dia = dia(A);
      PODERES.darPlata(APUESTA + (paga ? PAGA : 0));
      if (window.ANIMA) ANIMA.gesto("asiente");
      A.dialogoLibre([["eromash", paga ? "ek.pu_gane" : "ek.pu_gane_otra"]], () => HUD.aviso(t(paga ? "ek.pu_premio" : "ek.pu_devuelta", [APUESTA + PAGA, APUESTA]), "#FFD98A"));
    } else {
      if (window.ANIMA) ANIMA.gesto("duda");
      A.dialogoLibre([["eromash", "ek.pu_perdi"]]);
    }
  }
  function cercano(plano, e, st, A, gente) {
    if (juego) return null;
    let mejor = null;
    for (const p of gente) {
      if (!p.borracho || p.visible === false) continue;
      const d = Math.hypot(p.x - e.x, p.y - e.y);
      if (d < 1.8 * plano.M && (!mejor || d < mejor.d)) mejor = { texto: t("ek.pu_accion", [APUESTA]), fn: () => empezar(p, A, e), d, x: p.x, y: p.y };
    }
    return mejor;
  }
  // el parroquiano empuja parejo con tirones; cada toque de atacar o E empuja para el otro lado
  function actualizar(dt, st, A) {
    if (!juego || A.J.modo !== "juego") return;
    juego.t += dt;
    // el parroquiano se queda en su lugar mientras dura
    juego.p.x = juego.x;
    juego.p.y = juego.y;
    juego.p.vx = juego.p.vy = 0;
    if (juego.fin > 0) {
      if ((juego.fin -= dt) <= 0) cerrar(st, A);
      return;
    }
    const tiron = Math.max(0, Math.sin(juego.t * 2.3) * Math.sin(juego.t * 0.9 + 1)) * 0.5;
    juego.v -= (juego.fuerza + tiron) * dt * 0.55;
    if (CONTROLES.recien("atacar") || CONTROLES.recien("interactuar")) {
      juego.v += EMPUJE;
      if (window.SONIDO && Math.random() < 0.3) SONIDO.tono("triangle", 180, 140, 0.08, 0.03);
    }
    juego.v = Math.max(-1, Math.min(1, juego.v));
    if (Math.abs(juego.v) >= 1 || juego.t >= DURA) {
      juego.gano = juego.v > 0;
      juego.fin = 1;
      if (window.SONIDO) SONIDO.tocar("golpeFuerte", { vol: 0.35, tono: juego.gano ? 1.1 : 0.8 });
    }
  }

  // los dos brazos sobre la tapa del barril: el de Eromash (manga roja) desde la derecha, el del parroquiano desde la
  // izquierda, las manos trabadas y la barra de quién gana abajo
  function brazo(c, x0, y0, x1, y1, w, manga, piel) {
    c.lineCap = "round";
    c.strokeStyle = manga;
    c.lineWidth = w * 1.15;
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x0 + (x1 - x0) * 0.45, y0 + (y1 - y0) * 0.45);
    c.stroke();
    c.strokeStyle = piel;
    c.lineWidth = w;
    c.beginPath();
    c.moveTo(x0 + (x1 - x0) * 0.42, y0 + (y1 - y0) * 0.42);
    c.lineTo(x1, y1);
    c.stroke();
  }
  function dibujar(c, cw, ch, tt) {
    if (!juego) return;
    const R = Math.min(cw, ch) * 0.22,
      cx = cw / 2,
      cy = ch * 0.38,
      a = juego.v * 1.1, // ángulo de las manos: + hacia el lado del parroquiano (gana Eromash)
      tiembla = juego.fin > 0 ? 0 : Math.sin(tt * 40) * R * 0.01;
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "rgba(17,17,17,0.45)";
    c.fillRect(0, 0, cw, ch);
    // el barril visto desde arriba en ángulo: sombra, costado (mitad izquierda en sombra), aros y tapa
    c.fillStyle = "rgba(17,17,17,0.5)";
    c.beginPath();
    c.ellipse(cx + R * 0.1, cy + R * 1.05, R * 1.05, R * 0.22, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = ASSETS.C.madera;
    c.fillRect(cx - R, cy + R * 0.1, R * 2, R * 0.85);
    c.fillStyle = ASSETS.C.maderaSombra;
    c.fillRect(cx - R, cy + R * 0.1, R, R * 0.85);
    c.fillStyle = "#4A4640";
    for (const k of [0.35, 0.7]) c.fillRect(cx - R, cy + R * (0.1 + k * 0.85), R * 2, R * 0.06);
    c.fillStyle = ASSETS.C.maderaLuz;
    c.beginPath();
    c.ellipse(cx, cy + R * 0.1, R, R * 0.35, 0, 0, Math.PI * 2);
    c.fill();
    // los codos sobre la tapa y las manos trabadas que giran
    const mx = cx + Math.sin(-a) * R * 0.7 + tiembla,
      my = cy - Math.cos(a) * R * 0.7 + R * 0.1,
      w = R * 0.16;
    brazo(c, cx - R * 0.42, cy + R * 0.18, mx - w * 0.2, my, w, "#5E5A56", "#D8B89A");
    brazo(c, cx + R * 0.42, cy + R * 0.18, mx + w * 0.2, my, w, "#9C2315", "#E0B2B2");
    c.fillStyle = "#E0B2B2";
    c.beginPath();
    c.arc(mx, my, w * 0.75, 0, Math.PI * 2);
    c.fill();
    // la barra: roja de Eromash a la derecha, gris del parroquiano a la izquierda, y el tiempo
    const bw = R * 2.2,
      by = cy + R * 1.35,
      bh = Math.max(10, R * 0.07);
    c.fillStyle = "#111111";
    c.fillRect(cx - bw / 2 - 3, by - 3, bw + 6, bh + 6);
    c.fillStyle = "#5E5A56";
    c.fillRect(cx - bw / 2, by, bw, bh);
    c.fillStyle = "#C8402D";
    const mitad = cx + (juego.v * bw) / 2;
    c.fillRect(mitad, by, cx + bw / 2 - mitad, bh);
    c.fillStyle = "#FFD98A";
    c.fillRect(mitad - 2, by - 4, 4, bh + 8);
    c.textAlign = "center";
    c.fillStyle = "#F2ECEC";
    c.font = `700 ${Math.round(R * 0.13)}px "DM Sans", sans-serif`;
    const txt = juego.fin > 0 ? t(juego.gano ? "ek.pu_ganaste" : "ek.pu_perdiste") : t("ek.pu_marcador", [Math.max(0, Math.ceil(DURA - juego.t))]);
    c.fillText(txt, cx, by + bh + R * 0.2);
    c.font = `500 ${Math.round(R * 0.085)}px "DM Sans", sans-serif`;
    c.fillStyle = "#E0B2B2";
    c.fillText(t("ek.pu_ayuda", [CONTROLES.glifo ? CONTROLES.glifo("atacar") : ""]), cx, by + bh + R * 0.34);
    c.restore();
  }
  return { cercano, actualizar, dibujar, activo: () => !!juego };
})();
