// ---------- el hnefatafl de la plaza (módulo TAFL25) ----------
// De 10 a 18 dos viejos juegan en la mesa de hnefatafl de la franja de la plaza (`p.tafl` en MUNDO25: miran el tablero
// y comentan la partida en globos, recorrer.js). Acercándose se puede apostar 3 de plata al rey (paga el triple, gana
// pocas veces) o a los atacantes (paga 5, ganan casi siempre); quién gana sale de la semilla del día. Una apuesta por
// día; después solo se mira. Estado en E.extra.eikholt.tafl = { dia }; textos ek.tafl_.
//   TAFL25.cercano(plano, e, st, A, gente) → { texto, fn, d, x, y } o null
window.TAFL25 = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const APUESTA = 3,
    PAGA = { rey: 9, atac: 5 };
  const dia = (A) => Math.floor(((A.H.E.tiempo / LUZ.DIA) * 24 + 9 - 6) / 24);
  const ganador = (A) => ((dia(A) * 13 + 7) % 5 < 2 ? "rey" : "atac");
  let charla = 0;
  function apostar(st, A, lado) {
    A.cerrarMenu();
    const pj = PODERES.pj();
    if (pj.plata < APUESTA) return HUD.aviso(t("ek.tafl_sin_plata"), "#C8402D");
    pj.plata -= APUESTA;
    st.tafl = { dia: dia(A) };
    const g = ganador(A);
    A.dialogoLibre(
      [
        ["ek_vecino", "ek.tafl_juega_0"],
        ["ek_vecina", "ek.tafl_juega_1"],
        [g === "rey" ? "ek_vecina" : "ek_vecino", "ek.tafl_fin_" + g],
      ],
      () => {
        if (g === lado) {
          PODERES.darPlata(PAGA[lado]);
          if (window.ANIMA) ANIMA.gesto("asiente");
          HUD.aviso(t("ek.tafl_ganaste", [PAGA[lado]]), "#FFD98A");
        } else HUD.aviso(t("ek.tafl_perdiste"), "#E0B2B2");
      }
    );
  }
  function abrir(st, A) {
    if (st.tafl && st.tafl.dia === dia(A)) return A.dialogoLibre([[charla % 2 ? "ek_vecina" : "ek_vecino", "ek.tafl_dice_" + (charla++ % 6)]]);
    A.dialogoLibre([["ek_vecino", "ek.tafl_invita"]], () =>
      A.menu(`<h2>${t("ek.tafl_titulo")}</h2><div class="sub">${t("ek.tafl_sub", [APUESTA, PODERES.pj().plata])}</div><p>${t("ek.tafl_texto")}</p>`, [
        { texto: t("ek.tafl_rey", [PAGA.rey]), fn: () => apostar(st, A, "rey") },
        { texto: t("ek.tafl_atac", [PAGA.atac]), fn: () => apostar(st, A, "atac") },
        { texto: t("ek.tafl_mirar"), fn: A.cerrarMenu },
      ])
    );
  }
  function cercano(plano, e, st, A, gente) {
    const js = gente.filter((p) => p.tafl && p.visible !== false);
    if (js.length < 2) return null;
    const [x, y] = js[0].tafl,
      d = Math.hypot(x - e.x, y - e.y);
    if (d > 2.6 * plano.M) return null;
    const ya = st.tafl && st.tafl.dia === dia(A);
    return { texto: t(ya ? "ek.tafl_accion_mirar" : "ek.tafl_accion"), fn: () => abrir(st, A), d, x, y };
  }
  return { cercano, PAGA };
})();
