// ---------- las escondidas con los chicos de Eikholt (módulo ESCONDIDAS25) ----------
// De día, hablando con Tyra, Eirik o Arvid se los puede invitar a jugar a las escondidas: Eromash cuenta y los tres
// se esconden detrás de carretas, leñeras, sacos, barriles, puestos o pinos de la plaza (lejos de él y lejos entre sí).
// (los que estén en la ciudad a esa hora, al menos dos). Hay dos minutos y medio para encontrarlos con E; cada tanto el que falta se ríe y el cartel dice de qué lado.
// Encontrar a todos paga la primera vez de cada día; si se acaba el tiempo, salen solos y se burlan un poco.
// Mientras dura, los chicos no huyen (`p.escondido`, lo mira recorrer.js). Estado en E.extra.eikholt.escondidas =
// { dia, ganadas }; textos ek.esc_.
//   ESCONDIDAS25.cercano(plano, e, st, A, gente) → { texto, fn, d } o null · actualizar(dt, plano, gente, st, A, e)
window.ESCONDIDAS25 = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const CHICOS = ["tyra", "eirik", "arvid"];
  const TIEMPO = 150;
  const ESCONDITE = /^(carreta|lenera|sacosAbiertos|barriles|pino)$/;
  let juego = null; // { quedan, chicos: [{ p, x, y, hallado, antes }], risa }
  const dia = (A) => Math.floor(((A.H.E.tiempo / LUZ.DIA) * 24 + 9 - 6) / 24);
  const estado = (st) => (st.escondidas = st.escondidas || { dia: -1, ganadas: 0 });
  const chicos = (gente) => gente.filter((p) => CHICOS.includes(p.id) && p.visible !== false);

  // detrás de qué se esconde cada uno: lejos de Eromash (12 a 50 m) y a más de 15 m entre ellos
  function escondites(plano, e, libre) {
    const M = plano.M,
      lista = [];
    for (const o of plano.cosas) {
      const puesto = o.tipo === "casa" && /^puesto/.test(o.nombre || "");
      if (!puesto && !ESCONDITE.test(o.id || "")) continue;
      const d = Math.hypot(o.x - e.x, o.y - e.y);
      if (d < 12 * M || d > 50 * M || Math.hypot(o.x, o.y) > 4200) continue;
      // detrás (del lado del norte, el de atrás con la cámara de siempre); si no hay lugar, a un costado
      const r = puesto ? 260 : 110;
      const p = [[0, -r], [r, -r * 0.5], [-r, -r * 0.5]].map(([dx, dy]) => [o.x + dx, o.y + dy]).find(([x, y]) => libre(x, y, 25));
      if (p) lista.push({ x: p[0], y: p[1], h: (Math.abs(Math.round(o.x * 7 + o.y * 3)) % 997) / 997 });
    }
    lista.sort((a, b) => a.h - b.h);
    const elegidos = [];
    const sale = (Math.random() * lista.length) | 0;
    for (let i = 0; i < lista.length && elegidos.length < 3; i++) {
      const q = lista[(i + sale) % lista.length];
      if (elegidos.every((u) => Math.hypot(u.x - q.x, u.y - q.y) > 15 * M)) elegidos.push(q);
    }
    return elegidos;
  }

  function empezar(plano, e, gente, A, libre) {
    const ks = chicos(gente),
      lugares = escondites(plano, e, libre);
    if (ks.length < 2 || lugares.length < ks.length) return A.dialogoLibre([["tyra", "ek.esc_no"]]);
    A.dialogoLibre([["tyra", "ek.esc_pide"], ["eromash", "ek.esc_cuento"]], () => {
      juego = { quedan: TIEMPO, risa: 35, chicos: ks.map((p, i) => ({ p, x: lugares[i].x, y: lugares[i].y, antes: [p.x, p.y], hallado: false })) };
      for (const c of juego.chicos) {
        c.p.x = c.x;
        c.p.y = c.y;
        c.p.vx = c.p.vy = 0;
        c.p.escondido = true;
      }
      if (window.SONIDO) SONIDO.tocar("pagina", { vol: 0.3 });
      HUD.aviso(t("ek.esc_empieza", [Math.round(TIEMPO)]), "#FFD98A");
    });
  }
  function terminar(st, A, gano) {
    const s = estado(st),
      paga = gano && s.dia !== dia(A);
    for (const c of juego.chicos) {
      c.p.escondido = false;
      [c.p.x, c.p.y] = c.antes;
    }
    juego = null;
    if (gano) {
      s.ganadas++;
      if (paga) s.dia = dia(A);
      if (window.ANIMA) ANIMA.gesto("asiente");
      A.dialogoLibre([["tyra", paga ? "ek.esc_ganaste" : "ek.esc_otra"]], () => {
        if (paga) {
          PODERES.darPlata(5);
          HUD.aviso(t("ek.esc_premio"), "#FFD98A");
        }
      });
    } else A.dialogoLibre([["eirik", "ek.esc_perdiste"]]);
  }
  function hallar(c, st, A) {
    c.hallado = true;
    c.p.escondido = false;
    if (window.SONIDO) SONIDO.tocar("plata", { vol: 0.25, tono: 1.5 });
    const n = juego.chicos.filter((q) => q.hallado).length;
    HUD.aviso(t("ek.esc_hallado", [t("av.nombre_" + c.p.id), n, juego.chicos.length]), "#FFD98A");
    if (n === juego.chicos.length) terminar(st, A, true);
  }

  function cercano(plano, e, st, A, gente, libre) {
    const M = plano.M;
    if (juego) {
      for (const c of juego.chicos) {
        if (c.hallado) continue;
        const d = Math.hypot(c.p.x - e.x, c.p.y - e.y);
        if (d < 1.4 * M) return { texto: t("ek.esc_accion_hallar", [t("av.nombre_" + c.p.id)]), fn: () => hallar(c, st, A), d, x: c.p.x, y: c.p.y };
      }
      return null;
    }
    const h = LUZ.hora(A.H.E.tiempo);
    if (h < 8 || h >= 19) return null;
    for (const p of chicos(gente)) {
      const d = Math.hypot(p.x - e.x, p.y - e.y);
      if (d < 1.8 * M) return { texto: t("ek.esc_accion"), fn: () => empezar(plano, e, gente, A, libre), d, x: p.x, y: p.y };
    }
    return null;
  }

  // el reloj, las risas que dicen de qué lado está el que falta y los chicos quietos en su escondite
  function actualizar(dt, plano, gente, st, A, e) {
    if (!juego) return;
    for (const c of juego.chicos) if (!c.hallado) (c.p.x = c.x), (c.p.y = c.y), (c.p.vx = c.p.vy = 0);
    const antes = juego.quedan;
    juego.quedan -= dt;
    for (const s of [60, 30, 10]) if (antes > s && juego.quedan <= s) HUD.aviso(t("ek.esc_quedan", [s]), s <= 10 ? "#C8402D" : "#E0B2B2");
    if ((juego.risa -= dt) <= 0) {
      juego.risa = 30;
      const c = juego.chicos.find((q) => !q.hallado);
      if (c) {
        const a = Math.atan2(c.y - e.y, c.x - e.x),
          lado = ["este", "sur", "oeste", "norte"][((Math.round(a / (Math.PI / 2)) % 4) + 4) % 4];
        HUD.aviso(t("ek.esc_risa_" + lado), "#E0B2B2");
        if (window.SONIDO) SONIDO.tono("triangle", 1300, 1700, 0.18, 0.05, { retraso: 0 });
      }
    }
    if (juego.quedan <= 0) terminar(st, A, false);
  }
  return { cercano, actualizar, jugando: () => !!juego };
})();
