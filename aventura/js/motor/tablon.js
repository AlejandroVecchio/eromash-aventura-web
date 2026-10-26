// ---------- el tablón de cacería del Puesto (sistema TABLON) ----------
// Una cacería repetible: en el tablón de Tove se toma un pedido (cazá N criaturas de un tipo que ande por el bosque),
// se sigue en el rastreador y se cobra en el mismo tablón. Cada pedido paga más que el anterior y uno de cada cuatro
// trae además un fragmento de poder. Qué se pide sale de la cuenta de pedidos hechos: igual en cada partida.
// Estado en E.extra.tablon = { pedido: { tipo, n, hechas } | null, hechos }.
window.TABLON = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  // lo que se puede pedir y cuántas
  const PRESAS = [
    ["lobo", 6],
    ["jabali", 4],
    ["cuervo", 6],
    ["errante", 5],
    ["draugr", 4],
    ["fatuo", 5],
  ];
  let st = { pedido: null, hechos: 0 },
    tablon = null;
  const paga = (h) => Math.min(130, 40 + h * 12);
  const listo = () => st.pedido && st.pedido.hechas >= st.pedido.n;
  // la presa del próximo pedido: la que toca por turno entre las que de verdad andan por el bosque
  function proximo() {
    const vivas = PRESAS.filter(([k, n]) => A.enemigos.filter((e) => e.tipo === k && !e.muerto && !e.semi).length >= n);
    if (!vivas.length) return null;
    const [tipo, n] = vivas[(st.hechos * 5 + 2) % vivas.length];
    return { tipo, n, hechas: 0 };
  }
  function pintar() {
    if (!tablon) return;
    tablon.o.pedido = !!st.pedido;
    tablon.o.cobrar = listo();
  }
  function cobrar() {
    const plata = paga(st.hechos);
    st.hechos++;
    st.pedido = null;
    jug.interactuando = 0.5;
    PODERES.darPlata(plata);
    HUD.aviso(t("mj.caza_cobrada", [plata]), "#FFD98A");
    if (st.hechos % 4 === 0) J.retrasar(0.6, () => PODERES.darFragmento());
    pintar();
  }
  function mirar() {
    const nombre = (p) => t("mj.caza_pide", [p.n, t("cr." + p.tipo)]);
    if (st.pedido) {
      A.menu(`<h2>${t("mj.caza_titulo")}</h2><div class="sub">${nombre(st.pedido)} · ${st.pedido.hechas}/${st.pedido.n}</div>`, [
        { texto: t("mj.caza_seguir"), fn: A.cerrarMenu },
        { texto: t("mj.caza_dejar"), fn: () => {
          st.pedido = null;
          pintar();
          A.cerrarMenu();
        } },
      ]);
      return;
    }
    const p = proximo();
    if (!p) return A.avisar("mj.caza_nada");
    A.menu(`<h2>${t("mj.caza_titulo")}</h2><div class="sub">${t("mj.caza_sub")}</div><p>${nombre(p)}</p><p>${t("mj.caza_paga", [paga(st.hechos)])}${(st.hechos + 1) % 4 === 0 ? " " + t("mj.caza_fragmento") : ""}</p>`, [
      { texto: t("mj.caza_tomar"), fn: () => {
        st.pedido = p;
        pintar();
        A.cerrarMenu();
        HUD.aviso(nombre(p), "lugar", t("mj.caza_tomada"));
      } },
      { texto: t("ui.cerrar"), fn: A.cerrarMenu },
    ]);
  }

  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      tablon = W.NOMBRADAS.tablon_caza || null;
    },
    alEmpezar(extra) {
      extra.tablon = Object.assign({ pedido: null, hechos: 0 }, extra.tablon || {});
      st = extra.tablon;
      pintar();
    },
    cercanos(dar) {
      if (!tablon) return;
      const d = Math.hypot(tablon.x - jug.x, tablon.y + 30 - jug.y);
      if (d < 110) dar(d, t(listo() ? "mj.accion_cobrar" : st.pedido ? "mj.accion_ver_caza" : "mj.accion_caza"), () => (listo() ? cobrar() : mirar()), tablon.x, tablon.y - 160);
    },
    alMorir(e) {
      if (!st.pedido || listo() || e.tipo !== st.pedido.tipo) return;
      st.pedido.hechas++;
      if (listo()) {
        HUD.aviso(t("mj.caza_lista"), "#7BC86C");
        pintar();
      }
    },
    seguimiento() {
      if (!st.pedido) return null;
      const p = st.pedido,
        objetivos = [{ texto: t("mj.caza_pide", [p.n, t("cr." + p.tipo)]) + ` (${Math.min(p.hechas, p.n)}/${p.n})`, estado: listo() ? "hecho" : "actual" }];
      if (listo()) objetivos.push({ texto: t("mj.caza_volver"), estado: "actual", metros: tablon ? Math.max(1, Math.hypot(tablon.x - jug.x, tablon.y - jug.y) / W.M) : null });
      return { secundaria: true, rotulo: t("mj.caza_rotulo"), nombre: t("mj.caza_titulo"), objetivos };
    },
    diario() {
      return st.hechos ? `<div class="diario-resumen"><p><b>${t("mj.caza_titulo")}</b> ${t("mj.caza_diario", [st.hechos])}</p></div>` : "";
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { estado: () => st };
})();
