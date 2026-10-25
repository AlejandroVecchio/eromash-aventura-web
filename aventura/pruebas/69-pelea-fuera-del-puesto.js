// Pruebas de lo de pelea que dejó el Puesto: el campo de la Guardia, Vör en el Ting, el poste de contratos en Eikholt y
// el tablón de cacería en el Refugio.
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "pelea: nada de pelea queda en el Puesto, Vör y los contratos se usan en Eikholt", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const W = A.W,
        t = (k, v) => I18N.t(k, v),
        pu = W.LUGARES.puesto.p,
        lejos = (p) => Math.hypot(p[0] - pu[0], p[1] - pu[1]) > 3000;
      const m = INSTRUCTORES.muneco(),
        tb = W.NOMBRADAS.tablon_caza,
        re = W.LUGARES.refugio.p;
      si(lejos([m.x, m.y]), "el muñeco no está en el Puesto");
      si(lejos([tb.x, tb.y]) && Math.hypot(tb.x - re[0], tb.y - re[1]) < 2500, "el tablón está en el Refugio");
      si(lejos([CONTRATOS.poste().x, CONTRATOS.poste().y]), "el poste no está en el Puesto");
      const casos = [
        ["vor_ting", t("ie.hablar", [t("av.nombre_vor")])],
        ["poste_contratos", t("ct.accion_poste")],
      ];
      for (const [k, texto] of casos) {
        EIKHOLT.irA(k);
        for (let i = 0; i < 60 && !(EIKHOLT.activo() && A.J.modo === "juego"); i++) await esperar(100);
        await esperar(80);
        const c = EIKHOLT.cercano();
        igual(c && c.texto, texto, k + ":");
      }
      EIKHOLT.salir();
      for (let i = 0; i < 40 && (EIKHOLT.activo() || A.J.modo !== "juego"); i++) await esperar(100);
      si(!EIKHOLT.activo(), "sale de la ciudad");
    } }
  );
}
