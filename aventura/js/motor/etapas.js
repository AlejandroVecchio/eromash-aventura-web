// ---------- los encargos de preparación de las etapas (sistema ETAPAS) ----------
// Documento «Eldervald — misiones secundarias y etapas» (23/10/2026): tres encargos donde alguien necesita que le
// juntes algo antes de seguir. Nada depende de la suerte: el musgo se ve apenas Lif lo pide y cada bicho del encargo
// deja su parte al caer.
//   EL-02-2  Lif: 4 manojos de musgo de linde (junto a los mojones) y 2 tiras de cuero de los lobos del zarzal.
//   EL-03-2  Svanhild: 3 residuos de ataduras de los errantes del camino norte; Ása ajusta el aro de la Lente.
//   EL-06-2  Orm: alejar a los 5 lobos refugiados en la cabecera del Paso.
// Las cuentas viven en H.E.extra.cuentas (las lleva guion.js con H.sumar).
window.ETAPAS = (function () {
  "use strict";
  let A, J, jug, W, H, P;
  const t = (k, v) => I18N.t(k, v);
  const grupos = [];
  let musgos = [];

  // un grupo de bichos que solo anda mientras su objetivo está activo; cada uno que cae suma uno a la cuenta
  function grupo(hecho, cuenta, tipo, centro, n) {
    const g = { hecho, cuenta, centro, miembros: [] };
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const e = A.CB.crear(tipo, centro[0] + Math.cos(a) * 70, centro[1] + Math.sin(a) * 50);
      e.etapaGrupo = g;
      e.activo = false;
      g.miembros.push(e);
      A.enemigos.push(e);
    }
    grupos.push(g);
  }
  const activo = (hecho) => H.activo(hecho); // abierto ahora (los del mismo par van a la vez)
  // los que ya cayeron (según la cuenta guardada) no vuelven al cargar
  function acomodar() {
    for (const g of grupos) {
      const ya = H.cuenta(g.cuenta);
      g.miembros.forEach((e, i) => {
        A.CB.reiniciar(e);
        if (i < ya || H.tiene(g.hecho)) e.muerto = 1;
      });
    }
  }
  function musgoCercano() {
    let mejor = null,
      dm = Infinity;
    for (const m of musgos) {
      if (m.tomado) continue;
      const d = Math.hypot(m.x - jug.x, m.y - jug.y);
      if (d < dm) {
        dm = d;
        mejor = m;
      }
    }
    return mejor;
  }

  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      H = A.H;
      P = W.PUNTOS;
      const N = W.NOMBRADAS,
        m = W.m;
      // dónde están las cosas de cada encargo
      const ref = W.LUGARES.refugio.p;
      P.lobos_refugio = W.mas(ref, -14, 12);
      P.errantes_norte = m(760, 425);
      const her = N.herreria;
      P.herreria_puerta = her ? [her.x + 20, her.y + 60] : W.LUGARES.eikholt.p;
      P.cabecera = W.mas(W.LUGARES.paso_sur.p, -10, 4);
      // los manojos de musgo, al pie de los mojones del círculo
      // (hacia afuera del círculo, para que no queden debajo de la cuadrilla)
      musgos = (N.mojones || []).slice(1, 5).map((mj, i) => {
        const dx = mj.x - ref[0],
          dy = mj.y - ref[1],
          l = Math.hypot(dx, dy) || 1;
        return { i, x: mj.x + (dx / l) * 70, y: mj.y + (dy / l) * 50 + 20, tomado: false };
      });
      grupo("cuero_juntado", "cuero", "lobo", P.lobos_refugio, 2);
      grupo("residuos_juntados", "residuo", "errante", P.errantes_norte, 3);
      grupo("lobos_cabecera", "lobo", "lobo", P.cabecera, 5);
    },
    alEmpezar() {
      const ya = H.cuenta("musgo");
      musgos.forEach((m) => (m.tomado = m.i < ya || H.tiene("musgo_juntado")));
      acomodar();
    },
    actualizar() {
      for (const g of grupos) {
        const on = activo(g.hecho);
        g.miembros.forEach((e) => (e.activo = on));
      }
      const mc = musgoCercano();
      if (mc) P.musgo = [mc.x, mc.y];
    },
    alMorir(e) {
      const g = e.etapaGrupo;
      if (!g || !activo(g.hecho)) return;
      HUD.aviso(t("et.cae_" + g.cuenta, [H.cuenta(g.cuenta) + 1, g.miembros.length]), "#E0B2B2");
      H.sumar(g.cuenta);
    },
    cercanos(dar) {
      const cerca = (x, y, r) => Math.hypot(x - jug.x, y - jug.y) < r;
      if (activo("musgo_juntado"))
        for (const m of musgos)
          if (!m.tomado && cerca(m.x, m.y, 80))
            dar(40, t("et.accion_musgo"), () => {
              m.tomado = true;
              jug.interactuando = 0.5;
              HUD.aviso(t("et.musgo", [H.cuenta("musgo") + 1, 4]), "#E0B2B2");
              H.sumar("musgo");
            });
      // Lif entablilla a Bror con lo juntado
      const lif = P.trab_refugio_trabajador;
      if (activo("bror_entablillado") && lif && cerca(lif[0], lif[1], 130))
        dar(1, t("et.accion_lif"), () =>
          A.dialogoLibre([["lif", "et.lif_1"], ["eromash", "et.lif_2"], ["lif", "et.lif_3"]], () => H.marcar("bror_entablillado")),
        );
      // Ása ajusta el aro de bronce de la Lente
      const hp = P.herreria_puerta;
      if (activo("aro_ajustado") && cerca(hp[0], hp[1], 140))
        dar(1, t("et.accion_aro"), () =>
          A.dialogoLibre([["asa", "et.aro_1"], ["eromash", "et.aro_2"], ["asa", "et.aro_3"]], () => H.marcar("aro_ajustado")),
        );
    },
    objetos(lista, visible, c) {
      if (!activo("musgo_juntado")) return;
      const D = DIB;
      for (const m of musgos) {
        if (m.tomado || !visible(m.x, m.y)) continue;
        lista.push({
          x: m.x,
          y: m.y,
          f: () => {
            D.sombra(c, m.x, m.y, 26, 8);
            D.E(c, m.x - 10, m.y - 6, 16, 10, "#3E5A34");
            D.E(c, m.x + 9, m.y - 5, 14, 9, "#4E6B3A");
            D.E(c, m.x, m.y - 12, 15, 10, "#6F8F4E");
            // un brillo de runa para que se vea desde lejos
            const g = 0.4 + Math.max(0, Math.sin(J.t * 2.4 + m.i * 1.3)) * 0.6;
            D.alfa(c, g, () => D.E(c, m.x, m.y - 18, 3, 3, "#73D5DB"));
          },
        });
      }
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { grupos, musgos: () => musgos };
})();
