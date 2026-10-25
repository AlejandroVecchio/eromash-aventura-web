// Pruebas de los cofres con candado y las ganzúas (motor/cerraduras.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "cerraduras: catorce cofres de cuatro niveles, tres ganzúas de regalo e Ingrid las vende", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      await esperar(150);
      const cs = CERRADURAS.cofres();
      igual(cs.length, 14, "catorce:");
      [0, 1, 2, 3].forEach((n) => si(cs.some((c) => c.nivel === n), "hay de nivel " + n));
      cs.forEach((c) => si(c.cosa.id === "cofreCandado" && c.cosa.o.nivel === c.nivel, "cofre " + c.i));
      igual(MATERIALES.cuantos("ganzua"), 3, "tres de regalo:");
      si(MATERIALES.LISTA.includes("ganzua"), "es un material");
      si(COMERCIO.stock("ingrid").mats.ganzua >= 3, "Ingrid las vende");
      igual(CERRADURAS.sistema.marcasMapa().length, 14, "en el mapa:");
    } },
    { nombre: "cerraduras: en el punto justo abre, lejos la ganzúa sufre y se rompe", fn: async (A, { igual, si }) => {
      const st = CERRADURAS.estado(),
        c = CERRADURAS.cofres().find((q) => q.nivel === 3);
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      si(CERRADURAS.empezar(c), "empieza");
      igual(A.J.modo, "ganzua", "modo ganzúa:");
      const s = CERRADURAS.sesion();
      igual(s.ancho, 7, "maestro, 7°:");
      // lejos del punto: no gira y se rompe
      s.ang = s.dulce > 0 ? -90 : 90;
      igual(CERRADURAS.tope(s.ang), 0, "lejos no gira nada:");
      si(CERRADURAS.tope(s.dulce) === 1, "en el punto gira entero");
      si(CERRADURAS.tope(s.dulce + 30) > 0 && CERRADURAS.tope(s.dulce + 30) < 1, "cerca gira un poco");
      s.boton = true;
      await esperar(900);
      igual(MATERIALES.cuantos("ganzua"), 2, "se rompió una:");
      igual(st.rotas, 1, "cuenta la rota:");
      // en el punto: abre
      s.boton = false;
      await esperar(100);
      s.ang = s.dulce;
      s.boton = true;
      for (let i = 0; i < 30 && !s.abierta; i++) await esperar(50);
      si(s.abierta, "abrió");
      si(st.abiertos[c.i] && c.cosa.o.abierto, "queda abierto");
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      igual(A.J.modo, "juego", "vuelve al juego:");
      si(!CERRADURAS.empezar(c), "abierto no se vuelve a forzar");
    } },
    { nombre: "cerraduras: sin ganzúas no se puede, la práctica agranda el punto y se guarda", fn: async (A, { igual, si }) => {
      const st = CERRADURAS.estado(),
        c = CERRADURAS.cofres().find((q) => q.nivel === 0);
      MATERIALES.estado().tiene.ganzua = 0;
      si(!CERRADURAS.empezar(c), "sin ganzúas no");
      igual(CERRADURAS.anchoDe(0), 30, "novato 30°:");
      st.abiertas = 15;
      igual(CERRADURAS.anchoDe(0), 36, "con práctica 36°:");
      MATERIALES.estado().tiene.ganzua = 2;
      // con E cerca del cofre
      A.teletransportar(c.cosa.x, c.cosa.y + 80);
      for (let i = 0; i < 60 && A.J.modo !== "juego"; i++) await esperar(100);
      await esperar(100);
      const cer = A.J.cerca;
      si(cer && cer.fn, "algo para usar cerca");
      if (cer && cer.fn) cer.fn();
      igual(A.J.modo, "ganzua", "abre el juego de la cerradura:");
      si(document.querySelector("#ganzua:not(.oculto) canvas"), "se ve");
      CERRADURAS.cerrar();
      igual(A.J.modo, "juego", "dejar:");
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(100);
      igual(CERRADURAS.estado().abiertas, 15, "se guardó:");
      si(CERRADURAS.cofres().find((q) => q.nivel === 3 && CERRADURAS.estado().abiertos[q.i]).cosa.o.abierto, "el abierto sigue abierto");
    } },
  );
}
