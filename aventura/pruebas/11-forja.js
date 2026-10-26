// Pruebas de la forja al ritmo del yunque (motor/forja.js).
// (en un bloque: las pruebas comparten la página)
{
  const tecla = (code, abajo) => dispatchEvent(new KeyboardEvent(abajo ? "keydown" : "keyup", { code }));
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "forja: Ása ofrece una base por grupo y la canción sale igual con la misma semilla", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const be = FORJA.baseDe({ tipo: "espada" });
      si(OBJETOS.BASES[be].tipo === "espada" && OBJETOS.BASES[be].desde <= RPG.nivel() + 1, "una espada para el nivel (" + be + ")");
      si(FORJA.costo("fuego") > FORJA.costo("calma"), "a fuego vivo cuesta más");
      const a = FORJA.partitura("fuego", 7),
        b = FORJA.partitura("fuego", 7);
      igual(JSON.stringify(a.notas), JSON.stringify(b.notas), "misma semilla, misma canción:");
      si(a.notas.some((n) => n.dur > 0 && n.fase === "fuelle"), "el fuelle tiene notas largas");
      si(a.notas.filter((n) => n.fase === "martillo").length > 30, "el martillo tiene golpes");
      si(a.temple > Math.max(...a.notas.map((n) => n.t)), "el temple va al final");
      si(FORJA.partitura("calma", 7).negra > a.negra, "con calma va más lento");
    } },
    { nombre: "forja: martillar perfecto a fuego vivo da una legendaria; con calma, a lo sumo rara", fn: async (A, { igual, si }) => {
      PODERES.pj().plata = 0;
      for (const [modo, rar] of [["fuego", 3], ["calma", 2]]) {
        FORJA.empezar("espadaAncha", modo, 0);
        const S = FORJA.estado();
        S.puntos = S.p.notas.reduce((q, n) => q + (n.dur ? 2 : 1), 0);
        S.mejorCombo = S.p.notas.length;
        S.temple = "perfecto";
        FORJA.terminar();
        igual(S.res.r, rar, modo + ":");
        si(S.res.it.forja >= 99, "calidad casi entera");
        si(BOTIN.estado().bolsa.includes(S.res.it), "quedó en la bolsa");
        tecla("Enter", true);
        await esperar(80);
        tecla("Enter", false);
        await esperar(80);
        A.cerrarMenu && A.cerrarMenu();
        if (window.HUD) HUD.cerrar();
        JUEGO.J.modo = "juego";
      }
    } },
    { nombre: "forja: martillar mal da una común y la calidad decide los números", fn: async (A, { igual, si }) => {
      FORJA.empezar("espadaAncha", "fuego", 0);
      const S = FORJA.estado();
      S.puntos = S.p.notas.length * 0.3;
      S.temple = "falla";
      FORJA.terminar();
      igual(S.res.r, 0, "común:");
      const baja = OBJETOS.generar({ base: "espadaAncha", n: 10, r: 2, calidad: 0, rnd: OBJETOS.azar(3) }),
        alta = OBJETOS.generar({ base: "espadaAncha", n: 10, r: 2, calidad: 1, rnd: OBJETOS.azar(3) });
      si(alta.d > baja.d, "más daño con calidad (" + baja.d + " → " + alta.d + ")");
      si(alta.a.reduce((q, x) => q + x[1], 0) >= baja.a.reduce((q, x) => q + x[1], 0), "afijos más altos");
      si(OBJETOS.lineas(alta).some((l) => l.txt.includes("Ása")), "dice que la forjó Ása");
      document.getElementById("forjaLienzo").style.display = "none";
      JUEGO.J.modo = "juego";
    } },
    { nombre: "forja: tocando a tiempo cuenta perfectos; dejar a la mitad devuelve la plata", fn: async (A, { si, igual }) => {
      // antes, un rato de juego (lo que se descubre al llegar paga plata y no tiene que mezclarse con la cuenta)
      JUEGO.J.modo = "juego";
      await esperar(1500);
      FORJA.empezar("espadaAncha", "fuego", 123);
      const S = FORJA.estado();
      // un robot que aprieta cuando cada nota llega al yunque (durante 7,5 s); mira el reloj y no S.ahora, que solo
      // avanza con cada cuadro y con la máquina cargada salta de a mucho
      const fin = performance.now() + 7500;
      while (performance.now() < fin) {
        const ya = performance.now() / 1000 - S.t0 - 0.5;
        for (const n of S.p.notas)
          if (n.estado === "viene" && Math.abs(n.t - ya) < 0.03) {
            FORJA.pulsar(n.l);
            setTimeout(() => FORJA.soltarCarril(n.l), n.dur ? n.dur * 1000 + 60 : 40);
          }
        await esperar(8);
      }
      si(S.cuentas.perfecto + S.cuentas.bien >= 3, "aciertos: " + JSON.stringify(S.cuentas));
      // lo que entre por otro lado mientras tanto (descubrir un lugar paga 8 al volver al juego) no cuenta
      const antes = PODERES.pj().plata,
        dar = PODERES.darPlata;
      let otra = 0;
      PODERES.darPlata = (n) => {
        const p0 = PODERES.pj().plata;
        dar(n);
        otra += PODERES.pj().plata - p0;
      };
      tecla("Escape", true);
      await esperar(120);
      tecla("Escape", false);
      PODERES.darPlata = dar;
      igual(PODERES.pj().plata - antes - otra, 123, "devolvió la plata:");
      si(!FORJA.estado() && JUEGO.J.modo === "juego", "vuelve al juego");
    } },
  );
}
