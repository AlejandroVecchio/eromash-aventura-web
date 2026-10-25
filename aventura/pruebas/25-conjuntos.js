// Pruebas de los conjuntos de equipo (motor/conjuntos.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const ponerJuego = (j, n, cuantas) => {
    Object.keys(CONJUNTOS.JUEGOS[j].piezas)
      .slice(0, cuantas)
      .forEach((cs) => {
        BOTIN.dar(CONJUNTOS.crear(j, cs, n));
        BOTIN.equipar(BOTIN.estado().bolsa.length - 1);
      });
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "conjuntos: las piezas son verdes, con nombre y afijos fijos que crecen con el nivel", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const a = CONJUNTOS.crear("guardia", "casco", 2),
        b = CONJUNTOS.crear("guardia", "casco", 12);
      igual(a.r, 4, "rareza de conjunto:");
      igual(OBJETOS.nombre(a), I18N.t("cj.pz_guardia_casco"), "su nombre:");
      igual(a.a.map((q) => q[0]).join(","), "vida,armadura", "afijos fijos:");
      si(b.a[0][1] > a.a[0][1], "crecen con el nivel");
      si(!a.e, "sin muescas");
      si(OBJETOS.lineas(a).some((l) => l.txt.indexOf(I18N.t("cj.j_guardia")) >= 0), "el detalle dice el juego");
      si(OBJETOS.valor(a) > 0, "tiene precio");
    } },
    { nombre: "conjuntos: dos y tres piezas suman, y la guardia entera recibe un 15 % menos", fn: async (A, { igual, si }) => {
      RPG.recalcular();
      const arm0 = RPG.stats().armadura;
      ponerJuego("guardia", 5, 2);
      igual(CONJUNTOS.lleva("guardia"), 2, "lleva dos:");
      const arm2 = RPG.stats().armadura;
      // las dos piezas suman su armadura y el bono de dos (+25)
      si(arm2 - arm0 >= 25, "+25 de armadura del juego (" + Math.round(arm2 - arm0) + ")");
      const vida2 = RPG.stats().vida;
      ponerJuego("guardia", 5, 3);
      igual(CONJUNTOS.lleva("guardia"), 3, "lleva tres:");
      si(RPG.stats().vida - vida2 >= 40, "+40 de vida con tres");
      igual(CONJUNTOS.sistema.modRecibido(100), 100, "con tres todavía no reduce:");
      ponerJuego("guardia", 5, 4);
      si(CONJUNTOS.entero("guardia"), "entero");
      igual(CONJUNTOS.sistema.modRecibido(100), 85, "con cuatro recibe 85:");
      CONJUNTOS.sistema.actualizar(1.01);
      si(CONJUNTOS.estado().completos.guardia, "se festeja");
    } },
    { nombre: "conjuntos: el lobo se acelera al matar, Odín recupera energía y la pestaña muestra lo encontrado", fn: async (A, { igual, si }) => {
      ponerJuego("fenrir", 5, 4);
      si(CONJUNTOS.entero("fenrir"), "lobo entero");
      si(!CONJUNTOS.entero("guardia"), "la guardia ya no (comparten casco)");
      const v0 = RPG.stats().velMov;
      CONJUNTOS.sistema.alPegar({}, 10, {}, true);
      si(Math.abs(RPG.stats().velMov - v0 * 1.3) < 0.01, "+30 % al matar");
      CONJUNTOS.sistema.actualizar(3.1);
      si(Math.abs(RPG.stats().velMov - v0) < 0.01, "y se pasa");
      ponerJuego("odin", 5, 4);
      si(CONJUNTOS.entero("odin"), "Odín entero");
      PODERES.darEnergia(-100);
      CONJUNTOS.sistema.alPegar({}, 10, { critico: true }, false);
      igual(PODERES.estado().energia, CONJUNTOS.ENERGIA_ODIN, "el crítico da energía:");
      CONJUNTOS.sistema.actualizar(1.01);
      igual(Object.keys(CONJUNTOS.estado().vistos).length, 12, "las doce anotadas:");
      INVENTARIO.abrir("conjuntos");
      await esperar(100);
      igual(INVENTARIO.actual(), "conjuntos", "abre la pestaña:");
      igual(document.querySelectorAll(".inv-rejilla").length, 3, "un juego por fila:");
      INVENTARIO.cerrar();
      A.H.guardar(9);
    } },
  );
}
