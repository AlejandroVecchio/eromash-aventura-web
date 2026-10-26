// ---------- los recados del tablón de la plaza (módulo RECADOS25) ----------
// El tablón de avisos de Eikholt tiene siempre un recado clavado: llevar algo de la plaza a un taller o una casa de la
// ciudad (cuero a la carpintería, corteza a la curtiembre, una carta al cuartel…). Se toma uno por vez; la marca del mapa
// de la ciudad va al destino y al llegar se entrega con E. Paga más cada vez (8, 10, 12… hasta 20) y el siguiente es
// otro. Estado en E.extra.eikholt.recados = { i, activo, hechos }; textos ek.rc_.
//   RECADOS25.cercano(plano, e, st, A) → { texto, fn, d, x, y } o null (lo pide cercano() de ciudad/juego.js)
window.RECADOS25 = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  // a: el ancla de la ciudad donde se entrega; quien: el que recibe (habla al entregar)
  const LISTA = [
    { a: "carpinteria", quien: "sten" },
    { a: "curtiembre", quien: "bolli" },
    { a: "sanacion", quien: "thora" },
    { a: "cordeleria", quien: "folke" },
    { a: "guardia", quien: "asgeir" },
    { a: "herreria", quien: "asa" },
    { a: "hospederia", quien: "ragnfrid" },
    { a: "hongo_puerta", quien: "ulf" },
    { a: "lindes_puerta", quien: "ketill" },
  ];
  const paga = (n) => Math.min(20, 8 + 2 * n);
  function estado(st) {
    return (st.recados = st.recados || { i: 0, activo: false, hechos: 0 });
  }
  function leer(plano, st, A) {
    const r = estado(st),
      R = LISTA[r.i % LISTA.length];
    if (r.activo) return A.dialogoLibre([["eromash", "ek.rc_" + (r.i % LISTA.length)], ["eromash", "ek.rc_falta"]]);
    r.activo = true;
    const p = plano.anclas[R.a];
    if (p) st.marca = [p[0], p[1]];
    if (window.SONIDO) SONIDO.tocar("pagina", { vol: 0.4 });
    A.dialogoLibre([["eromash", "ek.rc_" + (r.i % LISTA.length)], ["eromash", "ek.rc_tomado", [paga(r.hechos)]]]);
  }
  function entregar(st, A) {
    const r = estado(st),
      R = LISTA[r.i % LISTA.length],
      n = paga(r.hechos);
    r.activo = false;
    r.hechos++;
    r.i++;
    st.marca = null;
    if (window.ANIMA) ANIMA.gesto("asiente");
    A.dialogoLibre([[R.quien, "ek.rc_" + ((r.i - 1) % LISTA.length) + "_gracias"]], () => {
      PODERES.darPlata(n);
      HUD.aviso(t("ek.rc_hecho", [n]), "#FFD98A");
    });
  }
  function cercano(plano, e, st, A) {
    const M = plano.M,
      r = estado(st),
      tb = plano.lugares.tablon;
    if (r.activo) {
      const R = LISTA[r.i % LISTA.length],
        p = plano.anclas[R.a];
      if (p) {
        const d = Math.hypot(p[0] - e.x, p[1] - e.y);
        if (d < 2 * M) return { texto: t("ek.rc_accion_entregar", [t("ek.rc_cosa_" + (r.i % LISTA.length))]), fn: () => entregar(st, A), d, x: p[0], y: p[1] };
      }
    }
    if (tb) {
      const d = Math.hypot(tb[0] - e.x, tb[1] - e.y);
      if (d < 2.6 * M) return { texto: t("ek.rc_accion_tablon"), fn: () => leer(plano, st, A), d, x: tb[0], y: tb[1] };
    }
    return null;
  }
  return { cercano, LISTA, estado };
})();
