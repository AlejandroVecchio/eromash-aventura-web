// Pruebas de los oficios que se mudaron del Puesto a Eikholt (EIKHOLT.traer en ciudad/juego.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "oficios: la mesa, la tina, el mostrador y el arcón dejaron el Puesto y se usan en Eikholt", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const W = A.W,
        C = W.CIUDAD,
        dentro = (p) => ((p[0] - C.c[0]) / C.rx) ** 2 + ((p[1] - C.c[1]) / C.ry) ** 2 < 1;
      const t = (k, v) => I18N.t(k, v);
      const casos = [
        ["mesa_alquimia", t("aq.usar_mesa")],
        ["tina_tintes", t("ti.usar")],
        ["mostrador_toldos", t("cm.comerciar", [t("av.nombre_ingrid")])],
        ["arcon_lindes", t("ac.abrir")],
      ];
      for (const [k] of casos) {
        si(W.PUNTOS[k] && dentro(W.PUNTOS[k]), k + " está dentro de la ciudad");
        si(EIKHOLT.traido(k), k + " lo trae la ciudad");
      }
      for (const [k, texto] of casos) {
        EIKHOLT.irA(k);
        for (let i = 0; i < 60 && !(EIKHOLT.activo() && A.J.modo === "juego"); i++) await esperar(100);
        await esperar(80);
        const c = EIKHOLT.cercano();
        igual(c && c.texto, texto, k + ":");
        si(EIKHOLT.traido(k).c, k + " tiene su lugar en el plano");
      }
      EIKHOLT.salir();
      for (let i = 0; i < 40 && (EIKHOLT.activo() || A.J.modo !== "juego"); i++) await esperar(100);
      si(!EIKHOLT.activo(), "sale de la ciudad");
      // en el Puesto, la manta de Ingrid avisa adónde se fue
      const m0 = W.NOMBRADAS.mostrador;
      A.jug.x = m0.x;
      A.jug.y = m0.y + 60;
      let vista = null;
      SISTEMAS.forEach((s) => s.cercanos && s.cercanos((d, texto) => texto === t("cm.manta_vacia") && (vista = texto)));
      si(vista, "la manta vacía del Puesto");
    } }
  );
}
