// ---------- el dominio de las runas (sistema DOMINIO) ----------
// Cada runa sube de rango (I a V) con el uso: 12, 35, 80 y 160 veces lanzada. Cada rango suma 12 % de lo que hace
// (daño de Kenaz, Isa, Sowilo y las runas de los elementos; el escudo de Algiz), el III y el IV la hacen más barata
// (−10 % y −5 % de energía) y el V, la maestría, devuelve un cuarto de la energía cuando alcanza a tres o más. El
// rango se ve en la casilla de la barra (I…V) y en su descripción; subir de rango se festeja. Funciona con cualquier
// runa de PODERES.RUNAS: envuelve PODERES.lanzar y, mientras se lanza, sube J.poderRunico y deja J.rangoRuna (que lee
// el escudo de Algiz) y baja el coste. Estado en E.extra.dominio = { usos: { runa: n } }. Textos `dm.`.
window.DOMINIO = (function () {
  "use strict";
  let A, J, jug;
  const t = (k, v) => I18N.t(k, v);
  const UMBRAL = [0, 12, 35, 80, 160];
  const ROMANO = ["", "I", "II", "III", "IV", "V"];
  let st = { usos: {} },
    lanzando = null,
    alcanzo = 0;
  const usos = (r) => st.usos[r] || 0;
  function rango(r) {
    let n = 1;
    UMBRAL.forEach((u, i) => usos(r) >= u && (n = i + 1));
    return n;
  }
  const mult = (r) => 1 + 0.12 * (rango(r) - 1);
  const coste = (r) => (rango(r) >= 3 ? 0.9 : 1) * (rango(r) >= 4 ? 0.95 : 1);
  const falta = (r) => (rango(r) >= 5 ? 0 : UMBRAL[rango(r)] - usos(r));
  const romano = (r) => ROMANO[rango(r)];

  // lanzar con el rango puesto: todo vuelve a como estaba al terminar
  function envolver() {
    const orig = PODERES.lanzar,
      R = PODERES.RUNAS;
    PODERES.lanzar = function (r) {
      const pj = PODERES.pj();
      if (!pj || !pj.runas.length) return orig.apply(this, arguments);
      const runa = r && pj.runas.includes(r) ? r : pj.runas[pj.sel];
      const def = R[runa];
      if (!def) return orig.apply(this, arguments);
      const c0 = def.coste,
        p0 = J.poderRunico,
        e0 = PODERES.estado().energia;
      def.coste = Math.round(c0 * coste(runa));
      J.poderRunico = (p0 || 1) * mult(runa);
      J.rangoRuna = mult(runa);
      lanzando = runa;
      alcanzo = 0;
      let res;
      try {
        res = orig.call(this, runa);
      } finally {
        const gasto = def.coste;
        def.coste = c0;
        J.poderRunico = p0;
        J.rangoRuna = 1;
        lanzando = null;
        if (PODERES.estado().energia < e0) lanzada(runa, gasto);
      }
      return res;
    };
  }
  function lanzada(r, gasto) {
    const antes = rango(r);
    st.usos[r] = usos(r) + 1;
    // la maestría: un cuarto de la energía de vuelta si alcanzó a tres o más
    if (antes >= 5 && alcanzo >= 3) {
      PODERES.darEnergia(Math.round(gasto * 0.25));
      J.textos.push({ x: jug.x, y: jug.y - 150, n: t("dm.eco"), t: 0, col: PODERES.RUNAS[r].col, palabra: true });
    }
    if (rango(r) > antes) {
      HUD.aviso(t("dm.sube", [t("pj.runa_" + r), ROMANO[rango(r)]]), PODERES.RUNAS[r].col);
      if (window.SONIDO) SONIDO.runa(jug.x, jug.y);
      if (window.VIDA) VIDA.evento("runa", jug.x, jug.y);
      if (window.ANIMA) ANIMA.gesto("feliz");
    }
  }

  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      J.rangoRuna = 1;
      if (window.PODERES) envolver();
    },
    alEmpezar(extra) {
      extra.dominio = Object.assign({ usos: {} }, extra.dominio || {});
      st = extra.dominio;
    },
    // cuántas criaturas alcanzó la runa que se está lanzando (para la maestría)
    alRuna(r, zona) {
      if (!zona || r !== lanzando) return;
      alcanzo = A.enemigos.filter((e) => e.activo && !e.muerto && A.CB.contiene(zona, e.x, e.y)).length;
    },
    diario() {
      const pj = window.PODERES && PODERES.pj();
      if (!pj || !pj.runas.length) return "";
      const l = pj.runas.map((r) => t("dm.linea", [t("pj.runa_" + r), romano(r)]) + (falta(r) ? " " + t("dm.falta", [falta(r)]) : ""));
      return `<div class="diario-resumen"><p><b>${t("dm.titulo")}</b> ${l.join(" · ")}.</p></div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, rango, romano, mult, coste, falta, usos, UMBRAL, sumar: (r, n) => (st.usos[r] = usos(r) + n) };
})();
