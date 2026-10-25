// Pruebas de la cocina en la fogata (motor/cocina.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "cocina: las presas dejan carne y junto a un fogón encendido se puede cocinar", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const st = COCINA.estado();
      COCINA.sistema.alMorir({ tipo: "oso", x: A.jug.x, y: A.jug.y, casa: [1, 2] });
      igual(st.carne.oso, 2, "el oso deja dos:");
      const f = A.W.COSAS.find((o) => o.id === "fogonOlla" && !o.o.apagado);
      si(f, "hay un fogón prendido");
      A.teletransportar(f.x + 40, f.y + 70);
      for (let i = 0; i < 60 && A.J.modo !== "juego"; i++) await esperar(100);
      si(COCINA.fogataCerca(), "la fogata está cerca");
    } },
    { nombre: "cocina: sacar a punto rinde más, crudo la mitad y quemado nada", fn: async (A, { igual, si }) => {
      const st = COCINA.estado();
      st.carne.lobo = 5;
      const vida0 = RPG.stats().vida;
      si(COCINA.empezar("asado"), "empieza el asado");
      igual(A.J.modo, "cocina", "modo cocina:");
      COCINA.asador().t = COCINA.VUELTA * 0.67;
      COCINA.sacar();
      igual(st.comida.id, "asado", "comió el asado:");
      igual(Math.round(RPG.stats().vida - vida0), 42, "a punto: +42 de vida (30 × 1,4):");
      await esperar(1700);
      igual(A.J.modo, "juego", "vuelve al juego:");
      COCINA.empezar("asado");
      COCINA.asador().t = 0.1;
      COCINA.sacar();
      igual(st.comida.k, 0.5, "crudo rinde la mitad:");
      await esperar(1700);
      const antes = st.platos;
      COCINA.empezar("asado");
      COCINA.asador().t = COCINA.VUELTA * 0.95;
      COCINA.sacar();
      igual(st.platos, antes, "quemado no se come:");
      igual(st.carne.lobo, 2, "pero gastó la carne:");
      await esperar(1700);
    } },
    { nombre: "cocina: la comida se pasa con el tiempo y la carne aparece en la Bolsa", fn: async (A, { igual, si }) => {
      const st = COCINA.estado();
      si(COCINA.sistema.celdasBolsa().length >= 2, "carne en la Bolsa");
      st.comida.queda = 0.05;
      COCINA.sistema.actualizar(0.1);
      igual(st.comida, null, "se pasó:");
      A.H.guardar(9);
    } },
  );
}
