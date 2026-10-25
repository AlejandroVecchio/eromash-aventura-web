// Pruebas de la cura que escala con la vida máxima (PODERES.escalaCura).
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const enJuego = async (A) => {
    for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "curación: hierbas, bolitas de vida y piedras de Berkano curan más con más vida máxima", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      await enJuego(A);
      const j = A.jug;
      j.hpMax = 100;
      igual(PODERES.escalaCura(), 1, "a 100 de vida, lo de siempre:");
      j.hpMax = 300;
      const k = PODERES.escalaCura();
      si(k > 2.6 && k < 2.8, "a 300, unas 2,7 veces: " + k.toFixed(2));
      // las hierbas
      PODERES.pj().hierbas = 2;
      j.hp = 10;
      PODERES.comerHierbas();
      await esperar(2600);
      si(j.hp >= 10 + Math.round(45 * k) - 2, "las hierbas curan " + Math.round(45 * k) + ": " + Math.round(j.hp));
      // una bolita de vida
      j.hp = 10;
      PODERES.soltar(j.x, j.y, "vida", 18, true);
      await esperar(900);
      si(j.hp >= 10 + Math.round(18 * k) - 1, "la bolita cura " + Math.round(18 * k) + ": " + Math.round(j.hp));
      // lo que guarda una piedra de Berkano
      const talla = BERKANO.estado().talla || 0;
      igual(BERKANO.cura(), Math.round([60, 80, 100, 120][talla] * k), "lo que guarda una piedra:");
    } },
  );
}
