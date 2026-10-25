// Pruebas del sigilo (motor/sigilo.js).
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
    { nombre: "sigilo: agachado lo notan de más cerca, de noche más, y saltar lo levanta", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      A.enemigos.forEach((q) => (q.activo = false));
      const jug = A.jug;
      igual(SIGILO.factor(), 1, "de pie, normal:");
      SIGILO.agacharse(true);
      si(jug.agachado, "agachado");
      await esperar(60);
      si(Math.abs(A.J.sigilo - SIGILO.OCULTA) < 0.001, "lo notan al 45 %");
      A.H.E.tiempo += LUZ.DIA / 2; // de noche
      await esperar(60);
      si(Math.abs(A.J.sigilo - SIGILO.OCULTA * SIGILO.NOCHE) < 0.001, "de noche, menos");
      A.H.E.tiempo += LUZ.DIA / 2;
      // una criatura a 8 m: agachado no lo ve
      const e = cerca(A, "lobo", 240, 0);
      await esperar(300);
      igual(e.estado, "quieto", "agachado a 8 m no lo ve:");
      SIGILO.agacharse(false);
      await esperar(300);
      igual(e.estado, "persigue", "de pie sí:");
      e.activo = false;
      SIGILO.agacharse(true);
      jug.salto = 0.3;
      await esperar(60);
      si(!jug.agachado, "saltar lo levanta");
      for (let i = 0; i < 30 && jug.salto > 0; i++) await esperar(50);
    } },
    { nombre: "sigilo: el golpe desde las sombras pega doble, no despierta al grupo y sube la maestría", fn: async (A, { igual, si }) => {
      const st = SIGILO.estado();
      A.enemigos.forEach((q) => (q.activo = false));
      SIGILO.agacharse(true);
      const e = cerca(A, "lobo", 600, 0);
      e.estado = "quieto";
      igual(SIGILO.sistema.modDano(10, e, {}), 20, "×2 a una que no lo vio:");
      e.estado = "persigue";
      igual(SIGILO.sistema.modDano(10, e, {}), 10, "a una que lo persigue, normal:");
      // un grupo de dos: matar a uno agachado no despierta al otro
      const a = cerca(A, "lobo", 900, 0),
        b = cerca(A, "lobo", 950, 30);
      a.grupo = b.grupo = [a, b];
      a.estado = b.estado = "quieto";
      A.J.silencioso = true;
      A.CB.golpear(A.J, a, 99999, A.jug.x, A.jug.y, 1);
      si(a.muerto, "cayó");
      igual(b.estado, "quieto", "el otro no se enteró:");
      A.J.silencioso = false;
      const c2 = cerca(A, "lobo", 900, 80);
      c2.grupo = b.grupo = [c2, b];
      A.CB.golpear(A.J, c2, 1, A.jug.x, A.jug.y, 1);
      igual(b.estado, "persigue", "de pie, un golpe sí lo despierta:");
      e.activo = b.activo = c2.activo = false;
      // la maestría
      igual(SIGILO.rango(), 0, "aprendiz:");
      st.muertes = 15;
      igual(SIGILO.rango(), 2, "acechador:");
      SIGILO.agacharse(true);
      await esperar(60);
      si(A.J.sigilo < SIGILO.OCULTA, "menos ruido " + A.J.sigilo + " " + A.jug.agachado + " " + A.jug.salto + " " + A.jug.esq + " " + A.jug.muerto);
      e.estado = "quieto";
      igual(Math.round(SIGILO.sistema.modDano(30, e, {})), 80, "×2,67:");
      SIGILO.sistema.alPegar(e, 10, { sombras: true }, true);
      igual(st.muertes, 16, "cuenta la muerte:");
      SIGILO.agacharse(false);
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(100);
      igual(SIGILO.estado().muertes, 16, "se guardó:");
    } },
  );
}
