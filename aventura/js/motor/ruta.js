// ---------- la ruta de aprendizaje (sistema RUTA) ----------
// Para que no esté todo abierto en la primera hora: cada sistema se abre en su momento de la historia o de nivel, como
// los oficios y las mecánicas que van apareciendo en un Zelda o en el WoW. Al abrirse sale un cartel grande con qué es
// y dónde se hace (de a uno, en fila), el diario lista lo abierto y lo que viene con su pista, y la saga tiene su
// entrada «La ruta de Eldervald». Lo que todavía no se abrió sigue a la vista, pero su E dice desde cuándo (envuelve el
// `cercanos` del sistema; con `solo` solo lo que dice ese texto, p. ej. la mesa de alquimia y no las hierbas).
// La partida de prueba (ranura 9) tiene todo abierto, salvo con `?ruta=1` o `RUTA.estricta(true)`.
// Un paso nuevo: su línea en PASOS ({ id, sis, nivel, mision, solo }) y sus textos ru.p_<id> y ru.d_<id>.
// Estado en E.extra.ruta = { vistos: { id: 1 } }. Textos `ru.` en textos/ruta.js.
window.RUTA = (function () {
  "use strict";
  let A, J, H;
  const t = (k, v) => I18N.t(k, v);
  // sis: el global del sistema cuyo cercanos se cierra (sin sis el paso solo se anuncia); mision: la que tiene que estar
  // cumplida (EL-02 = haber llegado a Eikholt); solo(texto): qué ofertas del sistema cierra
  const PASOS = [
    { id: "cocina", nivel: 2 },
    { id: "tablon", sis: "TABLON", nivel: 2 },
    { id: "instructores", sis: "INSTRUCTORES", nivel: 3 },
    { id: "pesca", sis: "PESCA", nivel: 3 },
    { id: "eikholt", mision: "EL-02" },
    { id: "ingrid", sis: "COMERCIO", mision: "EL-02", solo: (x) => x.includes(t("av.nombre_ingrid")) },
    { id: "arcon", sis: "ARCON", mision: "EL-02" },
    { id: "alquimia", sis: "ALQUIMIA", nivel: 4, mision: "EL-02", solo: (x) => x === t("aq.usar_mesa") },
    { id: "mazmorras", nivel: 5 },
    { id: "santuarios", sis: "SANTUARIOS", nivel: 5 },
    { id: "contratos", sis: "CONTRATOS", nivel: 6 },
    { id: "kolbrun", sis: "COMERCIO", nivel: 6, solo: (x) => x.includes(t("av.nombre_kolbrun")) },
    { id: "holmr", sis: "HOLMR", nivel: 7 },
    { id: "tintes", sis: "TINTES", nivel: 8 },
    { id: "engarces", nivel: 10 },
    { id: "casa", sis: "CASA", nivel: 10 },
    { id: "legendarios", nivel: 12 },
  ];
  const base = () => ({ vistos: {} });
  let st = base();
  let estrictaForzada = null,
    fila = [],
    espera = 0,
    mirar = 0;

  const nivel = () => (window.RPG ? RPG.nivel() : 1);
  const estricta = () => (estrictaForzada != null ? estrictaForzada : !(H && H.E && H.E.ranura === 9) || /[?&]ruta=1/.test(location.search));
  function cumple(p) {
    if (p.nivel && nivel() < p.nivel) return false;
    if (p.mision && !(H && H.completa(p.mision))) return false;
    return true;
  }
  const abierto = (id) => {
    const p = PASOS.find((q) => q.id === id);
    return !p || !estricta() || cumple(p);
  };
  // cuándo se abre, dicho corto (para la E) y largo (para el cartel y el diario)
  function pista(p) {
    const n = p.nivel && nivel() < p.nivel,
      m = p.mision && !(H && H.completa(p.mision));
    if (n && m) return t("ru.pide_ambos", [p.nivel]);
    if (n) return t("ru.pide_nivel", [p.nivel]);
    if (m) return t("ru.pide_eikholt");
    return "";
  }

  // ---------- cerrar lo que todavía no se abrió ----------
  function cerrar() {
    for (const p of PASOS) {
      if (!p.sis) continue;
      const g = window[p.sis],
        s = g && g.sistema;
      if (!s || !s.cercanos) continue;
      if (!s._ruta) {
        const orig = s.cercanos;
        s._ruta = [];
        s.cercanos = function (dar) {
          const cerrados = s._ruta.filter((q) => estricta() && !cumple(q));
          if (!cerrados.length) return orig.call(this, dar);
          return orig.call(this, (d, texto, fn, x, y) => {
            const q = cerrados.find((c) => !c.solo || c.solo(texto));
            if (!q) return dar(d, texto, fn, x, y);
            dar(d, texto + " · " + pista(q), () => HUD.aviso(t("ru.todavia", [t("ru.p_" + q.id), pista(q)]), "#E0B2B2"), x, y);
          });
        };
      }
      if (!s._ruta.includes(p)) s._ruta.push(p);
    }
  }

  // ---------- los avisos de lo que se abre ----------
  function revisar(silencio) {
    for (const p of PASOS) {
      if (st.vistos[p.id] || !cumple(p)) continue;
      st.vistos[p.id] = 1;
      if (!silencio) fila.push(p);
    }
  }
  function anunciar(p) {
    HUD.aviso(t("ru.d_" + p.id), "lugar", t("ru.abre", [t("ru.p_" + p.id)]));
    if (window.SONIDO) SONIDO.tocar("runa", { vol: 0.4 });
  }

  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      H = A.H;
      cerrar();
    },
    alEmpezar(extra) {
      const nueva = !extra.ruta;
      extra.ruta = Object.assign(base(), extra.ruta || {});
      st = extra.ruta;
      fila = [];
      espera = 0;
      // una partida que ya venía andando no recibe todos los carteles juntos: lo que ya tenía queda visto
      if (nueva) revisar((H.E.tiempo || 0) > 60);
    },
    actualizar(dt) {
      if ((mirar -= dt) <= 0) {
        mirar = 1;
        revisar(false);
      }
      if (espera > 0) espera -= dt;
      if (fila.length && espera <= 0 && J.modo === "juego") {
        anunciar(fila.shift());
        espera = 5;
      }
    },
    diario() {
      const hechos = PASOS.filter((p) => st.vistos[p.id]),
        vienen = PASOS.filter((p) => !st.vistos[p.id]).slice(0, 3);
      if (!hechos.length && !vienen.length) return "";
      const fila1 = hechos.map((p) => t("ru.p_" + p.id)).join(" · ");
      const fila2 = vienen.map((p) => `<p>○ <b>${t("ru.p_" + p.id)}</b> · ${pista(p)}</p>`).join("");
      return `<div class="diario-resumen"><p><b>${t("ru.diario", [hechos.length, PASOS.length])}</b></p>${fila1 ? `<p>✓ ${fila1}</p>` : ""}${fila2}</div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return {
    sistema,
    estado: () => st,
    abierto,
    pista: (id) => pista(PASOS.find((p) => p.id === id)),
    estricta: (v) => (estrictaForzada = v),
    abiertos: () => PASOS.filter((p) => st.vistos[p.id]).length,
    total: () => PASOS.length,
    revisar,
    PASOS,
  };
})();
