// ---------- la asamblea del Ting (módulo ASAMBLEA25) ----------
// Cada tres días, de 11 a 13, la ciudad se junta en el anillo de piedras del Ting: los vecinos de la asamblea
// (`p.asamblea` en MUNDO25, se ven solo ese rato) rodean la piedra mirándola y Bergljot, la que dice la ley, habla
// delante. Acercándose se escucha el asunto del día (seis que van rotando) y Eromash puede dar su voz por uno de los
// dos lados; la ciudad suele seguirlo y en la asamblea siguiente Bergljot cuenta cómo quedó lo decidido. Dar la voz paga
// un poco de plata y experiencia, una vez por asamblea. Estado en E.extra.eikholt.ting = { dia, ultimo: { n, v } };
// textos ek.ting_.
//   ASAMBLEA25.hoy(A) · actualizar(plano, gente, A) (cada cuadro) · cercano(plano, e, st, A) → { texto, fn, d, x, y } o null
window.ASAMBLEA25 = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const ASUNTOS = 6;
  const dia = (A) => Math.floor(((A.H.E.tiempo / LUZ.DIA) * 24 + 9 - 6) / 24); // cambia a las 6 de la mañana
  function hoy(A) {
    const h = LUZ.hora(A.H.E.tiempo);
    return dia(A) % 3 === 0 && h >= 11 && h < 13;
  }
  const asunto = (A) => Math.floor(dia(A) / 3) % ASUNTOS;
  // donde habla Bergljot: delante de la piedra grande
  const atril = (plano) => [plano.ting[0], plano.ting[1] + 230];
  const estado = (st) => (st.ting = st.ting || { dia: -1, ultimo: null });

  // Bergljot pasa al frente de la piedra mientras dura y los de la asamblea miran hacia ella
  function actualizar(plano, gente, A) {
    const si = hoy(A),
      [ax, ay] = atril(plano);
    for (const p of gente) {
      if (p.id === "bergljot") {
        if (!p.casa) p.casa = [p.x, p.y];
        const [x, y] = si ? [ax, ay] : p.casa;
        p.x = x;
        p.y = y;
        if (si) p.miraA = [0, 1];
      } else if (p.asamblea && si) p.miraA = [ax - p.x, ay - p.y];
    }
  }

  function escuchar(plano, st, A) {
    const s = estado(st),
      n = asunto(A),
      lineas = [["bergljot", "ek.ting_abre"]];
    if (s.ultimo) lineas.push(["bergljot", "ek.ting_antes", [t("ek.ting_" + s.ultimo.n + "_" + s.ultimo.v + "_hecho")]]);
    lineas.push(["bergljot", "ek.ting_" + n], ["bergljot", "ek.ting_pide"]);
    A.dialogoLibre(lineas, () => {
      const votar = (v) => () => {
        A.cerrarMenu();
        // la ciudad suele seguir la voz del forastero, no siempre (sale de la semilla del día)
        const gana = (dia(A) * 7 + n) % 10 < 7 ? v : v === "a" ? "b" : "a";
        s.dia = dia(A);
        s.ultimo = { n, v: gana };
        if (window.SONIDO) SONIDO.tocar("mision", { vol: 0.35, tono: 0.8 });
        if (window.ANIMA) ANIMA.gesto("asiente");
        A.dialogoLibre([["bergljot", gana === v ? "ek.ting_sigue" : "ek.ting_otro", [t("ek.ting_" + n + "_" + gana)]]], () => {
          PODERES.darPlata(6);
          if (window.RPG && RPG.dar) RPG.dar(25, A.jug ? A.jug.x : 0, A.jug ? A.jug.y : 0);
          HUD.aviso(t("ek.ting_dado"), "#FFD98A");
        });
      };
      A.menu(`<h2>${t("ek.ting_titulo")}</h2><p>${t("ek.ting_" + n)}</p>`, [
        { texto: t("ek.ting_" + n + "_a"), fn: votar("a") },
        { texto: t("ek.ting_" + n + "_b"), fn: votar("b") },
        { texto: t("ek.ting_callar"), fn: A.cerrarMenu },
      ]);
    });
  }

  function cercano(plano, e, st, A) {
    if (!plano.ting || !hoy(A) || estado(st).dia === dia(A)) return null;
    const [ax, ay] = atril(plano),
      d = Math.hypot(ax - e.x, ay - e.y);
    if (d > 3 * plano.M) return null;
    return { texto: t("ek.ting_accion"), fn: () => escuchar(plano, st, A), d, x: ax, y: ay };
  }
  return { hoy, actualizar, cercano, atril, asunto, ASUNTOS };
})();
