// Pruebas de los galdrar de Vör (motor/signos.js).
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
    { nombre: "signos: Vör los enseña con nivel y plata, y suben de rango con una esquirla", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      A.enemigos.forEach((q) => (q.activo = false));
      const st = SIGNOS.estado();
      si(SIGNOS.puede() === "sg.no_sabe", "sin galdrar no se canta");
      igual(SIGNOS.sistema.casillas().length, 0, "sin casilla:");
      si(SIGNOS.aprender("viento"), "el viento es gratis en nivel 1");
      igual(st.activo, "viento", "queda elegido:");
      si(!SIGNOS.aprender("fuego"), "el fuego pide nivel 3");
      RPG.estado().nivel = 10;
      PODERES.pj().plata = 0;
      si(!SIGNOS.aprender("fuego"), "y plata");
      PODERES.pj().plata = 1000;
      ["fuego", "escudo", "lazo", "sueno"].forEach((id) => si(SIGNOS.aprender(id), "aprende " + id));
      igual(PODERES.pj().plata, 1000 - 60 - 100 - 140 - 200, "cobró:");
      MATERIALES.estado().tiene.esquirla = 0;
      si(!SIGNOS.aprender("viento"), "rango 2 pide esquirla");
      MATERIALES.estado().tiene.esquirla = 1;
      si(SIGNOS.aprender("viento"), "rango 2");
      igual(st.sabe.viento, 2, "viento II:");
      si(!SIGNOS.aprender("viento"), "no hay rango 3");
      si(SIGNOS.cambiar() && st.activo === "fuego", "cambiar pasa al siguiente");
      // el botón en el menú de Vör
      const b = SIGNOS.sistema.botonesInstructor("vor");
      igual(b.length, 1, "Vör suma su botón:");
      igual(SIGNOS.sistema.botonesInstructor("ulfar").length, 0, "los otros no:");
    } },
    { nombre: "signos: viento empuja y voltea, fuego quema, sueño duerme y gastan estamina", fn: async (A, { igual, si }) => {
      const st = SIGNOS.estado(),
        jug = A.jug;
      A.enemigos.forEach((q) => (q.activo = false));
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      jug.dir = [1, 0];
      jug.sta = jug.staMax;
      st.activo = "viento";
      const e = cerca(A, "lobo", 120, 0);
      e.vida = e.d.vida = 9999;
      const x0 = e.x;
      si(SIGNOS.cantar(), "canta el viento");
      igual(Math.round(jug.sta), jug.staMax - SIGNOS.COSTO, "gasta estamina:");
      si(e.aturdido > 0.5, "volteado");
      await esperar(200);
      si(e.x > x0 + 20, "empujado");
      si(SIGNOS.puede() === "sg.ahora_no", "espera entre cantos");
      await esperar(1300);
      st.activo = "fuego";
      e.x = jug.x + 120;
      e.y = jug.y;
      e.aturdido = 0;
      si(SIGNOS.cantar(), "canta el fuego");
      si(e.quema > 2, "queda quemando");
      await esperar(1300);
      const atras = cerca(A, "lobo", -150, 0);
      atras.vida = atras.d.vida = 9999;
      e.x = jug.x + 160;
      e.y = jug.y;
      e.aturdido = 0;
      st.activo = "sueno";
      jug.sta = jug.staMax;
      SIGNOS.cantar();
      si(e.aturdido >= 3.5 && e.dormida > 0, "se durmió la de enfrente");
      si(!(atras.aturdido > 0), "la de atrás no");
      await esperar(1300);
      jug.sta = 10;
      si(SIGNOS.puede() === "sg.sin_sta", "sin estamina no");
      e.activo = atras.activo = false;
    } },
    { nombre: "signos: el escudo se come los golpes y el lazo frena", fn: async (A, { igual, si }) => {
      const st = SIGNOS.estado(),
        jug = A.jug;
      jug.sta = jug.staMax;
      st.activo = "escudo";
      SIGNOS.cantar();
      const es = SIGNOS.escudo();
      si(es && es.hp >= Math.round(jug.hpMax * 0.3), "escudo con 30 % de la vida");
      igual(SIGNOS.sistema.modRecibido(10), 0, "se come 10:");
      igual(Math.round(SIGNOS.sistema.modRecibido(9999)), 9999 - (es.max - 10), "pasa lo que sobra:");
      si(!SIGNOS.escudo(), "y se rompe");
      await esperar(1300);
      st.activo = "lazo";
      jug.sta = jug.staMax;
      SIGNOS.cantar();
      const e = cerca(A, "lobo", 60, 0);
      await esperar(120);
      si(SIGNOS.lazo(), "el círculo está");
      si(e.lenta > A.J.t, "la de adentro va lenta");
      e.activo = false;
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(100);
      igual(SIGNOS.estado().sabe.viento, 2, "se guardó:");
      igual(SIGNOS.estado().activo, "lazo", "y el elegido:");
    } },
  );
}
