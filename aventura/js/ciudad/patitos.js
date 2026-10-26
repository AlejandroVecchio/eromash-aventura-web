// ---------- las piedras al agua desde el muelle (módulo PATITOS25) ----------
// En el muelle de Eikholt, de día, se tiran piedras chatas al río para que reboten («patitos»). Se ve en pantalla el
// agua de costado: primero una aguja elige el ángulo (lo mejor es bajo, cerca de los 15°) y después otra la fuerza;
// atacar o E para cada una. Los rebotes salen de las dos: la piedra salta sobre el agua dejando anillos y se hunde.
// Tres piedras por vez; el mejor tiro queda guardado y llegar a 8 rebotes paga experiencia la primera vez del día.
// Mientras dura, Eromash se queda quieto (`activo()`). Estado en E.extra.eikholt.patitos = { dia, mejor }; textos ek.pt_.
//   PATITOS25.cercano(plano, e, st, A) → { texto, fn, d, x, y } o null · actualizar(dt, st, A) · dibujar(c, cw, ch, t) · activo()
window.PATITOS25 = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const PIEDRAS = 3,
    META = 8;
  const dia = (A) => Math.floor(((A.H.E.tiempo / LUZ.DIA) * 24 + 9 - 6) / 24);
  const estado = (st) => (st.patitos = st.patitos || { dia: -1, mejor: 0 });
  let juego = null; // { fase: angulo · fuerza · vuela · fin, t, ang, fza, n, saltos: [x], tiros: [n], vuelo }

  // la aguja del ángulo va de 0 a 60° y la de la fuerza de 0 a 1, ida y vuelta
  const ida = (x) => 1 - Math.abs(((x % 2) + 2) % 2 - 1);
  const angAhora = () => ida(juego.t * 0.9) * 60;
  const fzaAhora = () => ida(juego.t * 1.1);
  // cuántos rebotes: mejor con ángulo bajo (pico en 15°) y mucha fuerza
  function rebotes(ang, fza) {
    const a = Math.max(0, 1 - Math.abs(ang - 15) / 25);
    return Math.max(0, Math.round(a * fza * 12 - (ang > 45 ? 2 : 0)));
  }
  function empezar(A) {
    juego = { fase: "angulo", t: 0, ang: 0, fza: 0, tiros: [], vuelo: null, fin: 0 };
    HUD.aviso(t("ek.pt_empieza", [PIEDRAS]), "#FFD98A");
  }
  function cerrar(st, A) {
    const s = estado(st),
      mejor = Math.max(...juego.tiros),
      record = mejor > s.mejor,
      paga = mejor >= META && s.dia !== dia(A);
    juego = null;
    if (record) s.mejor = mejor;
    if (paga) {
      s.dia = dia(A);
      if (window.RPG && RPG.dar) RPG.dar(15, A.jug ? A.jug.x : 0, A.jug ? A.jug.y : 0);
    }
    A.dialogoLibre([["eromash", mejor >= META ? "ek.pt_bien" : mejor >= 4 ? "ek.pt_medio" : "ek.pt_flojo", [mejor]]], () => {
      if (record) HUD.aviso(t("ek.pt_record", [mejor]), "#FFD98A");
    });
  }
  let muelle = null;
  function cercano(plano, e, st, A) {
    if (juego) return null;
    const h = LUZ.hora(A.H.E.tiempo);
    if (h < 7 || h >= 20) return null;
    muelle = muelle || plano.anclas.muelle;
    if (!muelle) return null;
    const d = Math.hypot(muelle[0] - e.x, muelle[1] - e.y);
    if (d > 4 * plano.M) return null;
    return { texto: t("ek.pt_accion", [estado(st).mejor]), fn: () => empezar(A), d, x: muelle[0], y: muelle[1] };
  }
  function actualizar(dt, st, A) {
    if (!juego || A.J.modo !== "juego") return;
    juego.t += dt;
    const toca = CONTROLES.recien("atacar") || CONTROLES.recien("interactuar");
    if (juego.fase === "angulo" && toca) {
      juego.ang = angAhora();
      juego.fase = "fuerza";
      juego.t = 0;
    } else if (juego.fase === "fuerza" && toca) {
      juego.fza = fzaAhora();
      const n = rebotes(juego.ang, juego.fza);
      juego.tiros.push(n);
      juego.vuelo = { n, t: 0, ang: juego.ang, fza: juego.fza };
      juego.fase = "vuela";
      if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.3, tono: 1.6 });
    } else if (juego.fase === "vuela") {
      const v = juego.vuelo,
        antes = Math.floor(v.t / 0.32);
      v.t += dt;
      const ahora = Math.floor(v.t / 0.32);
      if (ahora > antes && ahora <= v.n && window.SONIDO) SONIDO.tono("sine", 700 + ahora * 40, 420, 0.07, 0.04);
      if (v.t > 0.32 * (v.n + 1) + 0.9) {
        juego.t = 0;
        if (juego.tiros.length >= PIEDRAS) (juego.fase = "fin"), (juego.fin = 0.6);
        else juego.fase = "angulo";
      }
    } else if (juego.fase === "fin" && (juego.fin -= dt) <= 0) cerrar(st, A);
  }

  // el río de costado: cielo, orilla del muelle a la izquierda, el agua con su brillo, la piedra y los anillos
  function dibujar(c, cw, ch, tt) {
    if (!juego) return;
    const W = Math.min(cw * 0.62, ch * 0.95),
      H = W * 0.42,
      x0 = (cw - W) / 2,
      y0 = ch * 0.14,
      agua = y0 + H * 0.55;
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "rgba(17,17,17,0.5)";
    c.fillRect(0, 0, cw, ch);
    c.fillStyle = "#30586A";
    c.fillRect(x0, y0, W, agua - y0);
    c.fillStyle = "#24464F";
    c.fillRect(x0, agua, W, y0 + H - agua);
    c.fillStyle = "#2E5A66";
    for (let i = 0; i < 6; i++) c.fillRect(x0 + ((i * 0.19 + tt * 0.02) % 1) * W * 0.9, agua + H * (0.06 + (i % 3) * 0.1), W * 0.08, 2);
    // el muelle: tablas sobre pilotes, mitad izquierda en sombra
    c.fillStyle = ASSETS.C.maderaLuz;
    c.fillRect(x0, agua - H * 0.08, W * 0.16, H * 0.05);
    c.fillStyle = ASSETS.C.maderaSombra;
    for (const k of [0.03, 0.12]) c.fillRect(x0 + W * k, agua - H * 0.03, W * 0.015, H * 0.25);
    // la piedra en vuelo: arcos que se achican, un anillo en cada toque
    const v = juego.vuelo;
    if (juego.fase === "vuela" && v) {
      const paso = W * 0.07 * (0.5 + v.fza),
        sx = x0 + W * 0.17;
      let x = sx;
      for (let k = 0; k <= v.n; k++) {
        const a0 = k * 0.32,
          w = paso * Math.pow(0.86, k);
        if (v.t > a0 + 0.32) {
          // ya tocó: el anillo que se abre y se borra
          const edad = v.t - a0 - 0.32,
            r = 6 + edad * 40;
          if (edad < 1.2 && k < v.n) {
            c.strokeStyle = `rgba(242,236,236,${0.7 * (1 - edad / 1.2)})`;
            c.lineWidth = 2;
            c.beginPath();
            c.ellipse(x + w, agua, r, r * 0.25, 0, 0, Math.PI * 2);
            c.stroke();
          }
          x += w;
          continue;
        }
        if (v.t >= a0) {
          const f = (v.t - a0) / 0.32,
            alto = (k === 0 ? H * 0.12 : H * 0.06 * Math.pow(0.8, k)) * Math.sin(Math.PI * f);
          c.fillStyle = "#6E6A62";
          c.beginPath();
          c.ellipse(x + w * f, agua - alto - 3, 7, 3.5, 0, 0, Math.PI * 2);
          c.fill();
          if (k === v.n && f > 0.6) {
            c.fillStyle = "rgba(242,236,236,0.6)";
            c.fillRect(x + w * f - 6, agua - 2, 12, 3);
          }
        }
        break;
      }
    }
    // las agujas: un cuarto de círculo para el ángulo y una barra para la fuerza
    const cx = x0 + W * 0.14,
      cy = agua - H * 0.1,
      R = H * 0.35;
    if (juego.fase === "angulo" || juego.fase === "fuerza") {
      c.strokeStyle = "rgba(242,236,236,0.35)";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(cx, cy, R, -Math.PI / 3, 0);
      c.stroke();
      // la franja buena, entre 8° y 22°
      c.strokeStyle = "#7BC86C";
      c.lineWidth = 6;
      c.beginPath();
      c.arc(cx, cy, R, -(22 * Math.PI) / 180, -(8 * Math.PI) / 180);
      c.stroke();
      const a = ((juego.fase === "angulo" ? angAhora() : juego.ang) * Math.PI) / 180;
      c.strokeStyle = "#73D5DB";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(cx, cy);
      c.lineTo(cx + Math.cos(a) * R, cy - Math.sin(a) * R);
      c.stroke();
    }
    if (juego.fase === "fuerza") {
      const bx = x0 + W * 0.3,
        by = y0 + H + 18,
        bw = W * 0.4,
        bh = 12;
      c.fillStyle = "#111111";
      c.fillRect(bx - 3, by - 3, bw + 6, bh + 6);
      c.fillStyle = "#5E5A56";
      c.fillRect(bx, by, bw, bh);
      c.fillStyle = "#C8402D";
      c.fillRect(bx, by, bw * fzaAhora(), bh);
    }
    c.textAlign = "center";
    c.fillStyle = "#F2ECEC";
    c.font = `700 ${Math.round(Math.max(16, H * 0.075))}px "DM Sans", sans-serif`;
    const ult = juego.tiros.length ? juego.tiros[juego.tiros.length - 1] : null,
      linea = juego.fase === "vuela" || juego.fase === "fin" ? t("ek.pt_rebotes", [ult]) : t(juego.fase === "angulo" ? "ek.pt_paso_angulo" : "ek.pt_paso_fuerza");
    c.fillText(linea, cw / 2, y0 + H + 50);
    c.font = `500 ${Math.round(Math.max(12, H * 0.05))}px "DM Sans", sans-serif`;
    c.fillStyle = "#E0B2B2";
    c.fillText(t("ek.pt_ayuda", [CONTROLES.glifo ? CONTROLES.glifo("atacar") : "", PIEDRAS - juego.tiros.length, META]), cw / 2, y0 + H + 72);
    c.restore();
  }
  return { cercano, actualizar, dibujar, activo: () => !!juego, rebotes };
})();
