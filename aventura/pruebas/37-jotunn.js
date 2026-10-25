// Pruebas de Hrímnir, el jötunn de la escarcha (motor/jotunn.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "jotunn: duerme en su anillo, despierta al acercarse y la rotacion nunca repite tres veces", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      A.enemigos.forEach((q) => (q.activo = q === JOTUNN.jefe().e));
      const j = JOTUNN.jefe();
      igual(j.estado, "duerme", "duerme:");
      igual(j.e.o.pose, "sentado", "sentado:");
      si(BESTIARIO.UNICOS.some(([id]) => id === "hrimnir"), "entre los únicos del bestiario");
      // ninguna rotación tiene el mismo ataque tres veces seguidas (ni dando la vuelta)
      JOTUNN.ROTACION.forEach((r, f) => {
        const dos = r.concat(r);
        for (let i = 0; i < r.length; i++) si(!(dos[i] === dos[i + 1] && dos[i + 1] === dos[i + 2]), "fase " + f + " sin tres iguales");
      });
      A.jug.x = j.centro[0];
      A.jug.y = j.centro[1] + 400;
      A.jug.hp = A.jug.hpMax;
      await esperar(120);
      igual(j.estado, "ruge", "despertó:");
      for (let i = 0; i < 60 && j.estado === "ruge"; i++) await esperar(50);
      await esperar(100);
      si(A.J.jefeHud && A.J.jefeHud.nombre, "barra de jefe");
    } },
    { nombre: "jotunn: aviso exacto, tope del 35 %, saltar evita, expuesto recibe más y llama a lo sumo tres", fn: async (A, { igual, si }) => {
      const j = JOTUNN.jefe(),
        jug = A.jug;
      jug.hp = jug.hpMax;
      jug.inv = 0;
      jug.esq = 0;
      jug.salto = 0;
      j.e.x = j.centro[0];
      j.e.y = j.centro[1];
      jug.x = j.e.x + 60;
      jug.y = j.e.y + 40;
      j.estado = "espera";
      A.J.avisos.length = 0;
      JOTUNN.atacar("pisoton");
      si(A.J.avisos.length === 1 && COMBATE.contiene(A.J.avisos[0], jug.x, jug.y), "el aviso marca donde pega");
      for (let i = 0; i < 40 && j.estado === "aviso"; i++) {
        jug.x = j.e.x + 60;
        jug.y = j.e.y + 40;
        await esperar(50);
      }
      const saco = jug.hpMax - jug.hp;
      si(saco > 0, "pegó");
      si(saco <= Math.max(35, jug.hpMax * 0.35) + 0.5, "nunca más del 35 %: " + saco);
      igual(j.estado, "expuesto", "queda expuesto:");
      igual(JOTUNN.sistema.modDano(100, j.e), 130, "expuesto recibe × 1,3:");
      // saltar evita todo
      jug.hp = jug.hpMax;
      j.estado = "espera";
      A.J.avisos.length = 0;
      JOTUNN.atacar("barrido");
      for (let i = 0; i < 40 && j.estado === "aviso"; i++) {
        jug.salto = 0.5;
        jug.x = j.e.x + 60;
        jug.y = j.e.y + 40;
        await esperar(40);
      }
      igual(jug.hp, jug.hpMax, "saltando no pega:");
      jug.salto = 0;
      // fases y esbirros
      j.e.vida = j.e.d.vida * 0.3;
      await esperar(150);
      igual(j.fase, 2, "fase 3:");
      si(j.esb.filter((m) => m.activo && !m.muerto).length <= 3, "a lo sumo tres esbirros");
      si(j.esb.some((m) => m.activo && !m.muerto), "llamó");
    } },
    { nombre: "jotunn: alejarse lo duerme y se cura, vencerlo paga una vez y se guarda", fn: async (A, { igual, si }) => {
      const j = JOTUNN.jefe(),
        jug = A.jug;
      jug.x = j.centro[0] + 2500;
      jug.y = j.centro[1];
      await esperar(120);
      igual(j.estado, "duerme", "volvió a su asiento:");
      igual(j.e.vida, j.e.d.vida, "curado:");
      si(j.esb.every((m) => !m.activo || m.muerto), "los esbirros se van");
      // vencerlo
      jug.x = j.centro[0];
      jug.y = j.centro[1] + 400;
      await esperar(150);
      const x0 = RPG.estado().total;
      A.CB.golpear(A.J, j.e, 999999, jug.x, jug.y, 1);
      await esperar(300);
      igual(j.estado, "vencido", "vencido:");
      si(JOTUNN.estado().vencido, "anotado");
      si(RPG.estado().total > x0, "dio experiencia");
      si(A.H.E.extra.hd.unicos.hrimnir, "entre los únicos caídos");
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(150);
      igual(JOTUNN.jefe().estado, "vencido", "sigue vencido:");
      si(JOTUNN.jefe().e.o.oculto, "el asiento quedó vacío");
    } },
  );
}
