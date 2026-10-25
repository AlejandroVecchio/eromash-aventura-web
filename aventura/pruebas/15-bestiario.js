// Pruebas del bestiario (motor/bestiario.js).
// (en un bloque: las pruebas comparten la página)
{
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "bestiario: verla la anota, vencerla llena la página y a las 10 y 30 da sus bonos", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      igual(BESTIARIO.nivel("draugr"), -1, "arranca sin conocerla:");
      BESTIARIO.estado().vistas.draugr = 1;
      igual(BESTIARIO.nivel("draugr"), 0, "vista:");
      BESTIARIO.anotar("draugr", 1);
      igual(BESTIARIO.nivel("draugr"), 1, "vencida:");
      igual(BESTIARIO.bonoDano("draugr"), 0, "sin bono todavía:");
      BESTIARIO.anotar("draugr", 9);
      igual(BESTIARIO.nivel("draugr"), 2, "punto débil:");
      const e = { tipo: "draugr" };
      igual(Math.round(BESTIARIO.sistema.modDano(100, e)), 108, "+8 % de daño:");
      BESTIARIO.anotar("draugr", 20);
      igual(BESTIARIO.nivel("draugr"), 3, "maestría:");
      igual(Math.round(BESTIARIO.sistema.modDano(100, e)), 116, "+16 % de daño:");
      si(BESTIARIO.detalle("draugr").includes(I18N.t("bs.draugr_saga")), "la saga se ve");
    } },
    { nombre: "bestiario: matar una criatura de verdad la cuenta", fn: async (A, { igual, si }) => {
      const e = A.enemigos.find((q) => q.tipo === "lobo");
      const n0 = BESTIARIO.muertes("lobo");
      A.enemigos.forEach((q) => q !== e && (q.activo = false));
      e.activo = true;
      e.x = A.jug.x + 60;
      e.y = A.jug.y;
      e.vida = 1;
      A.CB.golpear(A.J, e, 999, A.jug.x, A.jug.y);
      await new Promise((r) => setTimeout(r, 300));
      si(BESTIARIO.muertes("lobo") > n0, "contó el lobo (" + n0 + " → " + BESTIARIO.muertes("lobo") + ")");
    } },
    { nombre: "bestiario: la pestaña muestra las criaturas, las desconocidas en silueta y los únicos", fn: async (A, { igual, si }) => {
      INVENTARIO.abrir("bestiario");
      igual(document.querySelectorAll(".bs-rejilla .inv-celda").length, BESTIARIO.LISTA.length, "una casilla por criatura:");
      si(document.querySelectorAll(".bs-rejilla .inv-celda.falta").length > 0, "hay desconocidas");
      igual(document.querySelectorAll(".bs-unico").length, BESTIARIO.UNICOS.length, "todos los únicos:");
      INVENTARIO.cerrar();
      A.H.guardar(9);
      const m = BESTIARIO.muertes("draugr");
      JUEGO.empezar(9, false);
      igual(BESTIARIO.muertes("draugr"), m, "se guarda:");
    } },
  );
}
