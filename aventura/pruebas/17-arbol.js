// Pruebas del árbol de habilidades (motor/arbol.js).
// (en un bloque: las pruebas comparten la página)
{
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "árbol: un punto por nivel, las filas piden puntos en la rama y los nodos a su padre", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      RPG.estado().nivel = 12;
      RPG.recalcular();
      igual(ARBOL.libres(), 11, "11 puntos en el nivel 12:");
      si(ARBOL.falta("zarpazo"), "Zarpazo pide fila y padre");
      const arm0 = RPG.stats().armadura;
      ARBOL.subir("piel");
      ARBOL.subir("piel");
      igual(Math.round(RPG.stats().armadura - arm0), 10, "dos rangos de Piel de oso: +10 de armadura:");
      ARBOL.subir("zarpa");
      igual(ARBOL.enRama("oso"), 3, "tres puestos en el Oso:");
      si(!ARBOL.falta("zarpazo"), "con 3 en la rama y Zarpa ya se abre Zarpazo");
      si(ARBOL.falta("corazon"), "el Corazón pide 10 en la rama");
      si(ARBOL.falta("mordida"), "Mordida certera pide Colmillo");
      ARBOL.subir("zarpazo");
      const remate = ARBOL.sistema.modDano(100, { d: { vida: 100 }, vida: 100 }, { d: { remate: true } });
      igual(Math.round(remate), 120, "el remate pega +20 %:");
    } },
    { nombre: "árbol: los nodos clave cambian la pelea (Corazón de Björn, Acecho, Hugin y Munin)", fn: async (A, { igual, si }) => {
      const st = ARBOL.estado();
      st.r = { piel: 3, zarpa: 3, corpulencia: 2, aguante: 2, corazon: 1, sangre: 2, acecho: 1, presagio: 2, dos: 1 };
      RPG.recalcular();
      const jug = A.jug;
      jug.hp = 10;
      const d = ARBOL.sistema.modRecibido(30, "golpe", jug.x + 50, jug.y);
      igual(d, 0, "el golpe que lo tumbaba no entra:");
      si(jug.hp >= jug.hpMax * 0.29, "queda en pie con el 30 % (" + jug.hp + ")");
      si(!ARBOL.corazonListo(), "y queda en espera");
      jug.hp = 5;
      si(ARBOL.sistema.modRecibido(30, "golpe", jug.x, jug.y) > 0, "en espera no salva dos veces");
      jug.hp = jug.hpMax;
      const sorpresa = ARBOL.sistema.modDano(150, { d: { vida: 100 }, vida: 100 }, { d: {}, sorpresa: true });
      igual(Math.round(sorpresa), 220, "la sorpresa pasa de ×1,5 a ×2,2:");
      const herida = ARBOL.sistema.modDano(100, { d: { vida: 100 }, vida: 20 }, { d: {} });
      igual(Math.round(herida), 124, "Olor a sangre: +24 % a la que está herida:");
      const vel0 = RPG.stats().velMov;
      ARBOL.sistema.alMorir({ tipo: "lobo", x: jug.x, y: jug.y });
      si(RPG.stats().velMov > vel0 * 1.2, "Acecho: más rápido tras vencer");
      PODERES.darEnergia(-100);
      ARBOL.sistema.alMorir({ tipo: "lobo", x: jug.x, y: jug.y, lider: { nombre: "x" } });
      igual(PODERES.estado().energia, 25, "un líder devuelve 25 de energía:");
    } },
    { nombre: "árbol: la pestaña dibuja las tres ramas, se aprende tocando y se olvida", fn: async (A, { igual, si }) => {
      const st = ARBOL.estado();
      st.r = {};
      st.olvidos = 0;
      INVENTARIO.abrir("talentos");
      igual(document.querySelectorAll(".ab-rama").length, 3, "tres ramas:");
      igual(document.querySelectorAll(".ab-nodo").length, ARBOL.NODOS.length, "un nodo por habilidad:");
      document.querySelector(".ab-nodo.puede").click();
      igual(Object.values(st.r).reduce((a, b) => a + b, 0), 1, "tocar un nodo lo aprende:");
      ARBOL.olvidar();
      ARBOL.olvidar();
      igual(Object.keys(st.r).length, 0, "olvidar todo (dos toques) limpia el árbol:");
      igual(st.olvidos, 1, "y cuenta el olvido:");
      INVENTARIO.cerrar();
      A.H.guardar(9);
    } },
  );
}
