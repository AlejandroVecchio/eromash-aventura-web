// Pruebas de la ronda de los semijefes y jefes (motor/combate.js): agotado al cerrar la vuelta y segunda ronda.
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const enJuego = async (A) => {
    for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "semijefes: al cerrar su ronda quedan agotados y reciben ×1,5; bajo la mitad cambian de ronda", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      await enJuego(A);
      const j = A.jug;
      // lejos de todo, con vida de sobra
      A.enemigos.forEach((q) => (q.activo = false));
      j.hpMax = j.hp = 99999;
      const e = A.CB.crear("errante", j.x + 50, j.y, {});
      e.patron = ["abanico", "franja", "circulo"];
      e.d.vida = e.vida = 100000;
      e.d.espera = 0.2;
      e.nivel = 1;
      e.activo = true;
      e.cuenta = 2; // el próximo golpe cierra la vuelta
      e.estado = "persigue";
      A.enemigos.push(e);
      for (let i = 0; i < 80 && e.estado !== "agotado"; i++) {
        e.x = j.x + 50;
        e.y = j.y;
        j.hp = 99999;
        await esperar(50);
      }
      igual(e.estado, "agotado", "cerró la vuelta:");
      const v0 = e.vida;
      A.CB.golpear(A.J, e, 100, j.x, j.y, 0);
      igual(v0 - e.vida, 150, "agotado recibe ×1,5:");
      await esperar(2600);
      si(e.estado !== "agotado", "se recupera: " + e.estado);
      const v1 = e.vida;
      A.CB.golpear(A.J, e, 100, j.x, j.y, 0);
      igual(v1 - e.vida, 100, "fuera del castigo, normal:");
      // bajo la mitad: la segunda ronda, al revés de la primera
      e.vida = e.d.vida * 0.4;
      for (let i = 0; i < 60 && !e.fase2; i++) {
        e.x = j.x + 50;
        e.y = j.y;
        j.hp = 99999;
        await esperar(50);
      }
      si(e.fase2, "cambió de ronda");
      igual(e.patron2.join(), "circulo,franja,abanico", "la segunda ronda:");
      e.activo = false;
    } },
  );
}
