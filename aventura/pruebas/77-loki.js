// Pruebas de las piedras de Loki (motor/loki.js): el regalo del primer minijuego, las pistas de cada juego y que la
// piedra solo se gasta si la pista ayudó.
{
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "loki: el primer minijuego regala dos, la pista de la cerradura alinea un anillo y gasta una", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      igual(LOKI.cuantas(), 0, "al empezar:");
      MINIJ.empezar("anillos", { variante: "cuatro", semilla: 5 });
      igual(LOKI.cuantas(), 2, "regalo:");
      const S = MINIJ.estado(),
        mal = S.giro.filter((g, k) => g !== S.meta[k]).length;
      MINIJ.pista();
      igual(LOKI.cuantas(), 1, "después de la pista:");
      igual(S.giro.filter((g, k) => g !== S.meta[k]).length, mal - 1, "anillos desalineados:");
      MINIJ.cerrar();
      MINIJ.empezar("anillos", { semilla: 5 });
      igual(LOKI.cuantas(), 1, "el regalo es una sola vez:");
      MINIJ.cerrar();
    } },
    { nombre: "loki: la pista del hilo de las Nornas teje un hilo y con todas se gana", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      LOKI.dar(9, true);
      MINIJ.empezar("hilo", { semilla: 8 });
      const S = MINIJ.estado();
      for (let i = 0; i < S.sol.length; i++) MINIJ.pista();
      si(S.gano > 0, "ganado con las pistas");
      MINIJ.cerrar();
    } },
    { nombre: "loki: las pistas de parejas, plegaria y verso; sin piedras no hay pista", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      LOKI.alAbrirJuego(); // el regalo, antes de contar
      LOKI.dar(5, true);
      const n0 = LOKI.cuantas();
      JUEGOS_RUNAS.empezar("parejas", { semilla: 4 });
      JUEGOS_RUNAS.pista();
      igual(JUEGOS_RUNAS.estado().cartas.filter((q) => q.hecha).length, 2, "parejas: un par junto:");
      JUEGOS_RUNAS.cerrar();
      JUEGOS_RUNAS.empezar("mente", { semilla: 4 });
      JUEGOS_RUNAS.pista();
      igual((JUEGOS_RUNAS.estado().revela || []).length, 1, "verso: una runa susurrada:");
      JUEGOS_RUNAS.cerrar();
      JUEGOS_RUNAS.empezar("simon", { semilla: 4 });
      JUEGOS_RUNAS.pista();
      igual(LOKI.cuantas(), n0 - 2, "la plegaria mostrándose no gasta:");
      JUEGOS_RUNAS.estado().fase = "repite";
      JUEGOS_RUNAS.pista();
      igual(JUEGOS_RUNAS.estado().fase, "muestra", "plegaria: se vuelve a mostrar:");
      JUEGOS_RUNAS.cerrar();
      LOKI.estado().n = 0;
      JUEGOS_RUNAS.empezar("parejas", { semilla: 4 });
      JUEGOS_RUNAS.pista();
      igual(JUEGOS_RUNAS.estado().cartas.filter((q) => q.hecha).length, 0, "sin piedras no junta:");
      si(JUEGOS_RUNAS.estado().pistaAviso.mal, "avisa que no quedan");
      JUEGOS_RUNAS.cerrar();
    } },
  );
}
