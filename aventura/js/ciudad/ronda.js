// ---------- acompañar la ronda de noche de la Guardia (módulo RONDA25) ----------
// De 21 a 5 las dos parejas de la Guardia dan la vuelta al anillo de los oficios con antorchas (`p.ronda === "oficios"`
// en MUNDO25). Hablándoles se las puede acompañar: hay que quedarse a menos de 10 m de la pareja durante 90 s mientras
// cuentan lo que ven (globos `ek.rn_dice_N` cada tanto, y un ruido raro a mitad de camino que resulta ser un gato).
// Alejarse más de 18 m corta la ronda. Terminarla paga 6 y experiencia, una vez por noche. Estado en
// E.extra.eikholt.ronda = { dia, hechas }; textos ek.rn_.
//   RONDA25.cercano(plano, e, st, A, gente) → { texto, fn, d, x, y } o null · actualizar(dt, plano, st, A, e) · activa()
window.RONDA25 = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const DURA = 90,
    CERCA = 10,
    LEJOS = 18,
    PAGA = 6,
    DICE = 6;
  // la noche cuenta desde las 21 hasta las 5: el día de la noche es el de las 21 (antes de las 6 todavía es el de ayer)
  const dia = (A) => Math.floor(((A.H.E.tiempo / LUZ.DIA) * 24 + 9 - 6) / 24);
  const estado = (st) => (st.ronda = st.ronda || { dia: -1, hechas: 0 });
  let va = null; // { p, t, dicho, lejos }

  function empezar(p, st, A) {
    va = { p, t: 0, dicho: 0, lejos: 0 };
    A.dialogoLibre([["ek_" + p.rol, "ek.rn_pide"]], () => HUD.aviso(t("ek.rn_empieza", [DURA]), "#FFD98A"));
  }
  function cercano(plano, e, st, A, gente) {
    if (va || estado(st).dia === dia(A)) return null;
    let mejor = null;
    for (const p of gente) {
      if (p.ronda !== "oficios" || p.visible === false) continue;
      const d = Math.hypot(p.x - e.x, p.y - e.y);
      if (d < 2 * plano.M && (!mejor || d < mejor.d)) mejor = { texto: t("ek.rn_accion"), fn: () => empezar(p, st, A), d, x: p.x, y: p.y };
    }
    return mejor;
  }
  function actualizar(dt, plano, st, A, e) {
    if (!va || A.J.modo !== "juego") return;
    const p = va.p,
      d = Math.hypot(p.x - e.x, p.y - e.y) / plano.M;
    if (p.visible === false || d > LEJOS) {
      va = null;
      return HUD.aviso(t("ek.rn_corta"), "#C8402D");
    }
    if (d > CERCA) {
      if (!va.lejos) HUD.aviso(t("ek.rn_espera"), "#E0B2B2");
      va.lejos = 1;
      return; // lejos el reloj no corre
    }
    va.lejos = 0;
    va.t += dt;
    // lo que van contando, cada 15 s; a la mitad, el ruido raro
    const k = Math.floor(va.t / 15);
    if (k > va.dicho && k < DURA / 15) {
      va.dicho = k;
      const n = k === 3 ? "ruido" : (k + dia(A)) % DICE;
      RECORRER25.decir(p, t("ek.rn_dice_" + n));
      if (k === 3 && window.SONIDO) SONIDO.tono("sawtooth", 260, 140, 0.25, 0.04);
    }
    if (va.t >= DURA) {
      const s = estado(st);
      s.dia = dia(A);
      s.hechas++;
      va = null;
      if (window.ANIMA) ANIMA.gesto("asiente");
      A.dialogoLibre([["ek_" + p.rol, "ek.rn_gracias"]], () => {
        PODERES.darPlata(PAGA);
        if (window.RPG && RPG.dar) RPG.dar(20, A.jug ? A.jug.x : 0, A.jug ? A.jug.y : 0);
        HUD.aviso(t("ek.rn_premio", [PAGA]), "#FFD98A");
      });
    }
  }
  return { cercano, actualizar, activa: () => !!va };
})();
