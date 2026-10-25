// Pruebas del frasco de Thora (motor/frasco.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "frasco: tres cargas, cada trago cura de a poco y no se toma con la vida llena", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const st = FRASCO.estado(),
        jug = A.jug;
      igual(st.cargas, 3, "arranca con tres:");
      jug.hp = jug.hpMax;
      si(!FRASCO.tomar(), "con la vida llena no se toma");
      // lejos de los pueblos
      A.teletransportar(A.W.LUGARES.tala.p[0] + 900, A.W.LUGARES.tala.p[1]);
      for (let i = 0; i < 60 && A.J.modo !== "juego"; i++) await esperar(100);
      jug.hp = 10;
      si(FRASCO.tomar(), "toma");
      igual(st.cargas, 2, "gastó una:");
      si(jug.hp < 30, "no cura de golpe");
      await esperar(1500);
      // (la vida que vuelve sola fuera de pelea puede sumar un poco más)
      si(jug.hp >= Math.min(jug.hpMax, 10 + Math.round(jug.hpMax * 0.4)), "curó el 40 % (" + Math.round(jug.hp) + ")");
      st.cargas = 0;
      jug.hp = 10;
      si(!FRASCO.tomar(), "vacío no toma");
    } },
    { nombre: "frasco: se llena al entrar a un pueblo y Thora lo mejora con plata y materiales", fn: async (A, { igual, si }) => {
      const st = FRASCO.estado();
      st.cargas = 0;
      const p = A.W.LUGARES.puesto.p;
      A.teletransportar(p[0], p[1]);
      for (let i = 0; i < 60 && A.J.modo !== "juego"; i++) await esperar(100);
      await esperar(700);
      igual(st.cargas, 3, "lleno en el Puesto:");
      PODERES.pj().plata = 1000;
      MATERIALES.dar("ambar", 3);
      MATERIALES.dar("esquirla", 1);
      si(FRASCO.mejorar("cargas"), "una carga más");
      igual(st.max, 4, "cuatro cargas:");
      si(FRASCO.mejorar("fuerza"), "más fuerte");
      igual(FRASCO.curaDe(), Math.round(A.jug.hpMax * 0.44), "cura el 44 %:");
      si(!FRASCO.mejorar("fuerza"), "sin esquirlas no hay segunda");
      igual(PODERES.pj().plata, 1000 - 80 - 120, "cobró:");
    } },
    { nombre: "frasco: Thora cura, llena y abre su menú; la casilla está en la barra", fn: async (A, { igual, si }) => {
      const st = FRASCO.estado();
      st.cargas = 1;
      A.jug.hp = 5;
      PODERES.hablarCon({ id: "thora", x: A.jug.x, y: A.jug.y + 40, mira: { vista: "S", espejo: false } });
      igual(A.jug.hp, A.jug.hpMax, "Thora cura:");
      igual(st.cargas, st.max, "y llena el frasco:");
      BARRA.recibido("frasco");
      si(BARRA.estado().r.includes("frasco") || BARRA.estado().r.indexOf(null) < 0, "el frasco va a una casilla libre de la barra");
      si(BARRA.COSAS.frasco.icono().startsWith("frasco_"), "con el ícono de sus cargas");
      A.H.guardar(9);
    } },
  );
}
