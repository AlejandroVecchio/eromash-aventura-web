// Pruebas de los encuentros en el camino (motor/encuentros.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  // pasar los diálogos que abra el encuentro
  async function pasarDialogos(A) {
    for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) {
      if (A.J.modo === "dialogo") {
        window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyE" }));
        await esperar(50);
        window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyE" }));
      }
      await esperar(50);
    }
  }
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "encuentros: cinco con gente propia, aparecen más adelante y se van al alejarse", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      A.enemigos.forEach((q) => (q.activo = false));
      igual(ENCUENTROS.actual(), null, "nadie al empezar:");
      // cinco tipos con su gente propia
      ENCUENTROS.TIPOS.forEach((tp) => si(GENTE.FICHAS[ENCUENTROS.QUIEN[tp]], "ficha de " + tp));
      const e = ENCUENTROS.aparecer("peregrino");
      si(e && e.tipo === "peregrino", "aparece");
      si(Math.hypot(e.x - A.jug.x, e.y - A.jug.y) > 200, "más adelante");
      si(ENCUENTROS.sistema.sobreLuz && ENCUENTROS.sistema.cercanos, "se dibuja y se usa");
      // lejos se va
      e.x = A.jug.x + 5000;
      await esperar(120);
      igual(ENCUENTROS.actual(), null, "lejos se fue:");
    } },
    { nombre: "encuentros: el buhonero vende, la escalda inspira y el peregrino señala un hörgr", fn: async (A, { igual, si }) => {
      const pj = PODERES.pj();
      pj.plata = 200;
      const n0 = BOTIN.estado().bolsa.length;
      ENCUENTROS.aparecer("buhonero");
      si(ENCUENTROS.comprarEnvuelta(), "compra");
      igual(pj.plata, 200 - ENCUENTROS.ENVUELTA, "cobra:");
      igual(BOTIN.estado().bolsa.length, n0 + 1, "una pieza más:");
      si(BOTIN.estado().bolsa[BOTIN.estado().bolsa.length - 1].r >= 1, "poco común o mejor");
      si(ENCUENTROS.actual().hecho, "hecho");
      ENCUENTROS.irse();
      // la escalda
      const d0 = RPG.stats().dano;
      ENCUENTROS.aparecer("escalda");
      ENCUENTROS.usar();
      await pasarDialogos(A);
      si(ENCUENTROS.estado().inspirado > 200, "inspirado");
      si(RPG.stats().dano > d0 * 1.05, "más daño");
      si(ENCUENTROS.sistema.efectosHud().length === 1, "en el HUD");
      ENCUENTROS.irse();
      // el peregrino
      ENCUENTROS.aparecer("peregrino");
      ENCUENTROS.usar();
      await pasarDialogos(A);
      si(ENCUENTROS.actual().hecho, "señaló");
      ENCUENTROS.irse();
    } },
    { nombre: "encuentros: Toki pide ayuda con lobos y paga, Ragna toma una carga del frasco, y se guarda", fn: async (A, { igual, si }) => {
      const e = ENCUENTROS.aparecer("carrero");
      ENCUENTROS.usar();
      await pasarDialogos(A);
      igual(e.lobos.length, 3, "tres lobos:");
      e.lobos.forEach((l) => A.CB.golpear(A.J, l, 999999, A.jug.x, A.jug.y, 1));
      await esperar(200);
      await pasarDialogos(A);
      si(e.hecho, "pagó");
      ENCUENTROS.irse();
      si(!A.enemigos.some((l) => e.lobos.includes(l)), "los lobos se van");
      // Ragna
      FRASCO.estado().cargas = 2;
      ENCUENTROS.aparecer("herida");
      const p0 = PODERES.pj().plata;
      ENCUENTROS.usar();
      igual(A.J.modo, "menu", "pregunta:");
      A.cerrarMenu();
      ENCUENTROS.ayudarHerida();
      await pasarDialogos(A);
      igual(FRASCO.estado().cargas, 1, "una carga menos:");
      si(PODERES.pj().plata > p0, "pagó");
      ENCUENTROS.irse();
      const h = ENCUENTROS.estado().hechos;
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(100);
      igual(ENCUENTROS.estado().hechos.carrero, h.carrero, "se guardó:");
      si(ENCUENTROS.sistema.diario().length > 0, "en el diario");
    } },
  );
}
