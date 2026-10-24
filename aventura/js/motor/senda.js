// ---------- la senda del Refugio (sistema SENDA) ----------
// Lo que el carro volcado y el Refugio ofrecen en cada visita, según la versión de Alejandro (22/10/2026):
// el farol del carrero que se puede encender, el cepillo de Orm, la talla de Bror para Sigrun y el jornal de la
// cuadrilla entre los restos (se devuelven a su dueño); los siete mojones con tres estados de luz (dos con luz, uno
// débil y otro que titila al llegar; los siete encendidos, uno por uno, cuando la piedra vuelve a hablar); el nicho
// de ofrendas del mojón más antiguo; el poste de tablillas; y la reparación de Orm y Eskil en la segunda visita.
window.SENDA = (function () {
  "use strict";
  let A, J, jug, W, st;
  const t = (k, v) => I18N.t(k, v);
  const ESTADO_LLEGADA = [1, 1, 0.35, -1, 0, 0, 0]; // -1: titila
  let encendidoDesde = null;

  function hablar(clave, quien) {
    A.dialogoLibre([[quien || "eromash", clave]]);
  }
  function aplicar() {
    const N = W.NOMBRADAS;
    if (N.carro) {
      N.carro.o.cepillo = !st.cepillo;
      N.carro.o.talla = !st.talla;
      N.carro.o.jornal = !st.jornal;
    }
    if (N.farol_carrero) N.farol_carrero.o.encendido = !!st.farol;
    if (N.cuna) N.cuna.o.reparada = A.H.completa("EL-02");
    if (N.poste_tablillas) N.poste_tablillas.o.nuevas = A.H.completa("EL-02") ? 0 : 5;
    if (N.fogon_refugio) N.fogon_refugio.o.apagado = !A.H.completa("EL-02");
    if (N.mojones && N.mojones[0]) N.mojones[0].o.ofrenda = st.ofrenda === 1 ? "venda" : st.ofrenda === 2 ? "hierbas" : null;
  }
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      st = {};
    },
    alEmpezar(extra) {
      extra.senda = Object.assign({}, extra.senda || {});
      st = extra.senda;
      encendidoDesde = null;
      aplicar();
    },
    actualizar() {
      const N = W.NOMBRADAS,
        H = A.H;
      if (!N.mojones) return;
      // los mojones: la luz recorre el círculo, uno por uno, cuando la piedra vuelve a hablar
      const todos = H.tiene("runa_refugio");
      if (todos && encendidoDesde === null) encendidoDesde = J.t;
      N.mojones.forEach((mj, i) => {
        if (todos) {
          const u = (J.t - encendidoDesde) / 0.35 - i;
          mj.o.luz = Math.max(0, Math.min(1, u));
          if (J.t - encendidoDesde > 20) mj.o.luz = 1;
        } else {
          const e = ESTADO_LLEGADA[i];
          mj.o.luz = e >= 0 ? e : Math.max(0, Math.sin(J.t * 3.1) * Math.sin(J.t * 7.3)) * 0.9;
        }
      });
      // la ofrenda: una venda deja lugar a unas hierbas cuando el jugador vuelve en otra etapa
      if (st.ofrenda === 1 && st.ofrendaMision !== H.idMision()) {
        st.ofrenda = 2;
        aplicar();
      }
      if (!J.dentro) aplicar();
    },
    cercanos(dar) {
      const P = W.PUNTOS,
        N = W.NOMBRADAS,
        H = A.H,
        cerca = (p, r) => p && Math.hypot(p[0] - jug.x, p[1] - jug.y) < r;
      if (N.farol_carrero && !st.farol && cerca([N.farol_carrero.x, N.farol_carrero.y + 30], 110))
        dar(70, t("sd.accion_farol"), () => {
          st.farol = 1;
          aplicar();
          hablar("sd.farol");
        });
      if (!st.cepillo && cerca(P.cepillo, 90))
        dar(60, t("sd.accion_cepillo"), () => {
          st.cepillo = 1;
          aplicar();
          hablar("sd.cepillo");
        });
      if (!st.talla && cerca(P.talla, 90))
        dar(60, t("sd.accion_talla"), () => {
          st.talla = 1;
          aplicar();
          hablar("sd.talla");
        });
      if (!st.jornal && cerca(P.jornal, 90))
        dar(60, t("sd.accion_jornal"), () => {
          st.jornal = 1;
          aplicar();
          hablar("sd.jornal");
        });
      // devolver lo de los restos: a Orm el cepillo y el jornal, a Sigrun la talla
      const orm = A.npcs.orm;
      if (orm && cerca([orm.x, orm.y], 130)) {
        if (st.cepillo === 1)
          dar(50, t("sd.accion_dar_cepillo"), () => {
            st.cepillo = 2;
            if (window.PODERES) PODERES.darPlata(15);
            hablar("sd.orm_cepillo", "orm");
          });
        if (st.jornal === 1)
          dar(52, t("sd.accion_dar_jornal"), () => {
            st.jornal = 2;
            if (window.PODERES) PODERES.darPlata(10);
            hablar("sd.orm_jornal", "orm");
          });
      }
      if (st.talla === 1 && window.CAPITAL) {
        const sig = CAPITAL.gente.find((n) => n.id === "sigrun");
        if (sig && !sig.fuera && cerca([sig.x, sig.y], 130))
          dar(50, t("sd.accion_dar_talla"), () => {
            st.talla = 2;
            A.dialogoLibre([["sigrun", "sd.sigrun_talla_0"], ["sigrun", "sd.sigrun_talla_1"]]);
          });
      }
      // el nicho de ofrendas del mojón más antiguo
      const viejo = N.mojones && N.mojones[0];
      if (viejo && cerca([viejo.x, viejo.y + 30], 110)) {
        if (!st.ofrenda)
          dar(65, t("sd.accion_ofrenda"), () => {
            st.ofrenda = 1;
            st.ofrendaMision = H.idMision();
            aplicar();
            hablar("sd.ofrenda");
          });
        else if (st.ofrenda === 2)
          dar(65, t("sd.accion_hierbas"), () => {
            st.ofrenda = 3;
            jug.hp = jug.hpMax;
            aplicar();
            hablar("sd.hierbas");
          });
      }
      if (N.poste_tablillas && cerca([N.poste_tablillas.x, N.poste_tablillas.y + 30], 120)) dar(75, t("sd.accion_poste"), () => hablar("sd.poste"));
      if (N.cuna && H.tiene("piedra_puesta") && cerca([N.cuna.x, N.cuna.y + 20], 90)) dar(75, t("sd.accion_cuna"), () => hablar(H.completa("EL-02") ? "sd.cuna_reparada" : "sd.cuna"));
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return {};
})();
