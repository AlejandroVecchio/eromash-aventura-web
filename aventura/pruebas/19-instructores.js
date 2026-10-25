// Pruebas de los instructores y el muñeco de práctica (motor/instructores.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "instructores: tres maestros en su lugar y el muñeco del Puesto aguanta todo sin moverse", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const g = INSTRUCTORES.gente(),
        m = INSTRUCTORES.muneco();
      igual(Object.keys(g).length, 3, "tres instructores:");
      si(A.enemigos.includes(m), "el muñeco es un blanco");
      const pu = A.W.PUNTOS.puesto || A.W.LUGARES.puesto.p;
      si(Math.hypot(m.x - pu[0], m.y - pu[1]) < 900, "el muñeco está en el Puesto");
      const x0 = m.x;
      A.CB.golpear(A.J, m, 99999, m.x - 50, m.y, 2);
      si(!m.muerto && m.activo, "no se muere");
      igual(m.x, x0, "ni se mueve:");
    } },
    { nombre: "instructores: medir el daño, pasar la prueba y aprender la lección", fn: async (A, { igual, si }) => {
      const m = INSTRUCTORES.muneco();
      A.teletransportar(m.x, m.y + 90);
      for (let i = 0; i < 60 && A.J.modo !== "juego"; i++) await esperar(100);
      INSTRUCTORES.empezar("medir");
      INSTRUCTORES.sesion().t = 0;
      A.CB.golpear(A.J, m, 120, m.x, m.y + 60);
      A.CB.golpear(A.J, m, 80, m.x, m.y + 60);
      igual(INSTRUCTORES.sesion().dano, 200, "cuenta el daño:");
      INSTRUCTORES.sesion().t = 99;
      await esperar(200);
      igual(INSTRUCTORES.estado().mejor, 200, "guardó la mejor marca:");
      A.cerrarMenu();
      // la lección de Hallbera pide la prueba
      RPG.estado().nivel = 5;
      RPG.recalcular();
      PODERES.pj().plata = 500;
      si(INSTRUCTORES.lecPide("hallbera") === "ie.pide_prueba", "sin prueba no enseña");
      INSTRUCTORES.pedirPrueba("hallbera");
      INSTRUCTORES.empezar("dano");
      INSTRUCTORES.sesion().t = 0;
      A.CB.golpear(A.J, m, 300, m.x, m.y + 60);
      INSTRUCTORES.sesion().t = 99;
      await esperar(200);
      A.cerrarMenu();
      igual(INSTRUCTORES.estado().pasada.hallbera, 1, "pasó la prueba:");
      const libres0 = ARBOL.libres(),
        vida0 = RPG.stats().vida;
      si(INSTRUCTORES.aprender("hallbera"), "aprende");
      igual(ARBOL.libres(), libres0 + 1, "+1 punto de habilidad:");
      igual(Math.round(RPG.stats().vida - vida0), 15, "+15 de vida:");
      igual(PODERES.pj().plata, 440, "cobró 60:");
    } },
    { nombre: "instructores: la prueba de Vör avisa en el piso y cuenta las esquivas justas", fn: async (A, { igual, si }) => {
      const m = INSTRUCTORES.muneco(),
        jug = A.jug;
      INSTRUCTORES.pedirPrueba("vor");
      INSTRUCTORES.empezar("esquivas");
      INSTRUCTORES.sesion().t = 0;
      jug.x = m.x;
      jug.y = m.y + 60;
      // espera a que el aviso esté por llegar y salta justo
      for (let i = 0; i < 40 && !(INSTRUCTORES.sesion().aviso && INSTRUCTORES.sesion().aviso.t > 0.75); i++) await esperar(50);
      si(INSTRUCTORES.sesion().aviso, "hay aviso en el piso");
      jug.salto = 0.42;
      await esperar(500);
      igual(INSTRUCTORES.sesion().esq, 1, "una esquiva justa:");
      INSTRUCTORES.sesion().t = 99;
      await esperar(200);
      A.cerrarMenu();
      A.H.guardar(9);
    } },
  );
}
