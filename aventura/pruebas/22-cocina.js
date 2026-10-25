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
    { nombre: "cocina: la tabla de cortar: los cortes bien hechos dan el plato a punto, los huesos mellan y mal cortado se arruina", fn: async (A, { igual, si }) => {
      const st = COCINA.estado();
      st.carne.lobo = 5;
      const vida0 = RPG.stats().vida;
      // corta todo lo que salta, en orden, y deja caer los huesos
      const cortarTodo = (bien = true) => {
        for (let n = 0; n < 40 && COCINA.asador() && !COCINA.asador().listo; n++) {
          COCINA.asador().pausa = 0;
          const q = COCINA.tiro();
          if (q.k === "hueso") {
            q.t = q.dura;
            JUEGO.J.modos.cocina(0.01);
            continue;
          }
          const d = bien ? q.dirs[q.hechos] : q.dirs[q.hechos] === "arriba" ? "abajo" : "arriba";
          COCINA.cortar(d);
          if (!bien) (q.t = q.dura), JUEGO.J.modos.cocina(0.01);
        }
      };
      si(COCINA.empezar("asado"), "empieza la tabla");
      igual(A.J.modo, "cocina", "modo cocina:");
      const tiros = COCINA.asador().tiros;
      si(tiros.some((q) => q.k === "hueso"), "salta algún hueso");
      igual(tiros.find((q) => q.k === "lobo").n, 4, "el lobo pide cuatro cortes:");
      cortarTodo(true);
      igual(COCINA.precision(), 100, "todo bien cortado:");
      igual(st.comida.id, "asado", "comió el asado:");
      igual(Math.round(RPG.stats().vida - vida0), 42, "a punto: +42 de vida (30 × 1,4):");
      COCINA.asador().cierre = 0;
      JUEGO.J.modos.cocina(0.01);
      igual(A.J.modo, "juego", "vuelve al juego:");
      // un hueso cortado mella el cuchillo
      COCINA.empezar("asado");
      const a = COCINA.asador();
      a.pausa = 0;
      while (COCINA.tiro().k !== "hueso") {
        const q = COCINA.tiro();
        while (q.hechos < q.n) COCINA.cortar(q.dirs[q.hechos]);
        a.pausa = 0;
      }
      COCINA.cortar("abajo");
      igual(a.mellas, 1, "cortar el hueso mella:");
      cortarTodo(true);
      igual(st.comida.k, 1, "con una mella sale bien (85 %):");
      a.cierre = 0;
      JUEGO.J.modos.cocina(0.01);
      // todo mal: se arruina y no se come
      const antes = st.platos;
      COCINA.empezar("asado");
      cortarTodo(false);
      igual(COCINA.asador().listo, "arruinado", "todo mal cortado se arruina:");
      igual(st.platos, antes, "no se come:");
      igual(st.carne.lobo, 2, "pero gastó la carne:");
      COCINA.cerrar();
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
