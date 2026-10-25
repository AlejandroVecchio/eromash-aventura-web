// Pruebas de la Furia y las habilidades activas (motor/furia.js).
// (en un bloque: las pruebas comparten la página)
{
  const cerca = (A, tipo, dx, dy) => {
    const e = A.CB.crear(tipo, A.jug.x + dx, A.jug.y + dy, { pal: 0 });
    e.activo = true;
    A.enemigos.push(e);
    return e;
  };
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "furia: se llena pegando y con los golpes, y las habilidades piden su nodo, Furia y espera", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      A.enemigos.forEach((q) => (q.activo = false));
      igual(FURIA.furia(), 0, "arranca vacía:");
      si(FURIA.puede("rugido") === "fu.no_sabe", "sin el nodo no se puede");
      RPG.estado().nivel = 20;
      Object.assign(ARBOL.estado().r, { piel: 3, zarpa: 3, zarpazo: 1, rugido: 1, patas: 3, jauria: 3, salto: 1, ojo: 3, memoria: 3, bandada: 1 });
      RPG.recalcular();
      FURIA.sistema.alPegar({}, 10, { d: {}, critico: true });
      igual(FURIA.furia(), 8, "un crítico da 8:");
      FURIA.sistema.modRecibido(20);
      igual(Math.round(FURIA.furia()), 20, "recibir 20 da 12 más:");
      si(FURIA.puede("rugido") === "fu.sin_furia", "40 para rugir");
      igual(Object.keys(FURIA.sistema.cosasBarra()).length, 3, "tres cosas para la barra:");
      si(BARRA.COSAS.hab_rugido && BARRA.COSAS.hab_rugido.tiene(), "el Rugido se puede poner en una casilla de la barra");
    } },
    { nombre: "furia: el Rugido aturde y expone, el Salto lleva y pega al caer, la Bandada marca", fn: async (A, { igual, si }) => {
      const jug = A.jug;
      A.enemigos.forEach((q) => (q.activo = false));
      // un lugar con 400 libres hacia la derecha para el salto
      for (let k = 0; k < 60; k++) {
        const x = jug.x + (k % 8) * 300 - 1000,
          y = jug.y + Math.floor(k / 8) * 200 - 600;
        let ok = true;
        for (let d = 0; d <= 420 && ok; d += 20) ok = A.W.libre(x + d, y, 20);
        if (ok) {
          A.teletransportar(x, y);
          break;
        }
      }
      for (let i = 0; i < 60 && A.J.modo !== "juego"; i++) await esperar(100);
      const e = cerca(A, "jabali", 120, 0);
      FURIA.ponerFuria(100);
      si(FURIA.usar("rugido"), "ruge");
      si(e.aturdido > 1, "aturdido");
      igual(Math.round(FURIA.sistema.modDano(100, e)), 115, "expuesto +15 %:");
      igual(FURIA.furia(), 60, "gastó 40:");
      si(FURIA.puede("rugido") === "fu.espera", "y queda en espera");
      e.muerto = true;
      e.activo = false;
      const lobo = cerca(A, "lobo", 260, 0);
      lobo.vida = lobo.d.vida = 9999;
      jug.dir = [1, 0];
      const x0 = jug.x;
      FURIA.ponerFuria(100);
      si(FURIA.usar("salto"), "salta");
      await esperar(900);
      si(jug.x - x0 > 120, "avanzó " + Math.round(jug.x - x0));
      si(lobo.vida < lobo.d.vida, "pegó al caer (" + Math.round(lobo.vida) + ", a " + Math.round(Math.hypot(lobo.x - jug.x, lobo.y - jug.y)) + ")");
      FURIA.ponerFuria(100);
      si(FURIA.usar("bandada"), "suelta la bandada");
      si(FURIA.cuervos() >= 5, "cinco cuervos");
      await esperar(1500);
      si(lobo.marcaHasta > A.J.t, "el lobo quedó marcado");
      lobo.muerto = true;
      lobo.activo = false;
      await esperar(10500);
      si(FURIA.furia() < 60, "fuera de pelea se enfría");
      FURIA.ponerFuria(100);
      si(!FURIA.usar("bandada"), "sin nadie cerca no gasta");
      igual(FURIA.furia(), 100, "la Furia sigue entera:");
    } },
    { nombre: "furia: los nodos activos están en el árbol y la barra de Furia se ve", fn: async (A, { igual, si }) => {
      INVENTARIO.abrir("talentos");
      igual(document.querySelectorAll(".ab-nodo.activa").length, 3, "tres nodos activos:");
      INVENTARIO.cerrar();
      await esperar(200);
      const b = document.getElementById("bFuria");
      si(b && !b.classList.contains("oculto"), "la barra de Furia está");
      A.H.guardar(9);
    } },
  );
}
