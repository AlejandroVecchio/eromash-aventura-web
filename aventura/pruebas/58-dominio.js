// Pruebas del dominio de las runas (motor/dominio.js).
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const enJuego = async (A) => {
    for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "dominio: la runa sube de rango con el uso, pega más, cuesta menos y se ve en la barra", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      await enJuego(A);
      const pj = PODERES.pj();
      if (!pj.runas.includes("kenaz")) pj.runas.push("kenaz");
      if (!pj.runas.includes("algiz")) pj.runas.push("algiz");
      A.H.E.extra.dominio.usos = {};
      igual(DOMINIO.rango("kenaz"), 1, "arranca en I:");
      // un lobo adelante para medir el daño
      const e = A.enemigos.find((q) => !q.muerto && q.d && !q.d.blanco && !q.patron && !q.lider);
      const medir = () => {
        e.activo = true;
        e.muerto = 0;
        e.vida = e.d.vida = 99999;
        e.x = A.jug.x + 120;
        e.y = A.jug.y;
        A.jug.dir = [1, 0];
        PODERES.darEnergia(100);
        PODERES.lanzar("kenaz");
        return 99999 - e.vida;
      };
      const d1 = medir();
      si(d1 > 0, "Kenaz le pega: " + Math.round(d1));
      DOMINIO.sumar("kenaz", 160);
      igual(DOMINIO.rango("kenaz"), 5, "con 160 usos, V:");
      const d5 = medir();
      si(d5 > d1 * 1.4, "en V pega un 48 % más: " + Math.round(d1) + " → " + Math.round(d5));
      igual(PODERES.RUNAS.kenaz.coste, 35, "el coste vuelve a ser el de siempre después de lanzar:");
      PODERES.darEnergia(-100);
      PODERES.darEnergia(32);
      PODERES.lanzar("kenaz");
      si(PODERES.estado().energia < 32, "en V alcanza con 32 de energía (cuesta " + Math.round(35 * DOMINIO.coste("kenaz")) + ")");
      igual(A.J.rangoRuna, 1, "lo de la runa no queda puesto:");
      // sube de rango con el uso de verdad
      A.H.E.extra.dominio.usos.isa = 11;
      if (!pj.runas.includes("isa")) pj.runas.push("isa");
      PODERES.darEnergia(100);
      PODERES.lanzar("isa");
      igual(DOMINIO.rango("isa"), 2, "Isa a II:");
      si(document.getElementById("hudAvisos").textContent.includes("II"), "se festeja");
      // la casilla de la barra muestra el rango
      if (window.BARRA && BARRA.recibido) BARRA.recibido("runa_kenaz");
      await esperar(200);
      const c = document.getElementById("hudBarra").textContent;
      si(c.includes("V"), "la barra muestra el rango: " + c.slice(0, 60));
    } },
  );
}
