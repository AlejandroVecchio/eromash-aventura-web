// Pruebas de los encuentros en el camino (motor/encuentros.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  // pasar los diálogos que abra el encuentro
  async function pasarDialogos(A) {
    for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) {
      if (A.J.modo === "dialogo") {
        window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyE" }));
        await esperar(50);
        window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyE" }));
      }
      await esperar(50);
    }
  }
  // pasar diálogos hasta que se abra el juego de runas
  async function hastaJuego(A) {
    for (let i = 0; i < 40 && A.J.modo !== "runas"; i++) {
      if (A.J.modo === "dialogo") {
        window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyE" }));
        await esperar(50);
        window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyE" }));
      }
      await esperar(50);
    }
  }
  // jugar bien cada juego desde la API
  function ganar(S) {
    if (S.tipo === "parejas") {
      const vistos = {};
      S.cartas.forEach((q, i) => (vistos[q.r] = vistos[q.r] || []).push(i));
      Object.values(vistos).forEach(([a, b]) => (JUEGOS_RUNAS.tocar(a), JUEGOS_RUNAS.tocar(b)));
    } else if (S.tipo === "mente") S.codigo.forEach((r) => JUEGOS_RUNAS.tocar(r));
  }
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "encuentros: cinco con gente propia, aparecen más adelante y se van al alejarse", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      A.enemigos.forEach((q) => (q.activo = false));
      igual(ENCUENTROS.actual(), null, "nadie al empezar:");
      // cinco tipos con su gente propia
      ENCUENTROS.TIPOS.forEach((tp) => si(GENTE.FICHAS[ENCUENTROS.QUIEN[tp]], "ficha de " + tp));
      const e = ENCUENTROS.aparecer("peregrino");
      si(e && e.tipo === "peregrino", "aparece");
      si(Math.hypot(e.x - A.jug.x, e.y - A.jug.y) > 200, "más adelante");
      si(ENCUENTROS.sistema.sobreLuz && ENCUENTROS.sistema.cercanos, "se dibuja y se usa");
      // lejos se va
      e.x = A.jug.x + 5000;
      await esperar(120);
      igual(ENCUENTROS.actual(), null, "lejos se fue:");
    } },
    { nombre: "encuentros: el buhonero vende, la escalda inspira y el peregrino señala un hörgr", fn: async (A, { igual, si }) => {
      const pj = PODERES.pj();
      pj.plata = 200;
      const n0 = BOTIN.estado().bolsa.length;
      ENCUENTROS.aparecer("buhonero");
      si(ENCUENTROS.comprarEnvuelta(), "compra");
      igual(pj.plata, 200 - ENCUENTROS.ENVUELTA, "cobra:");
      igual(BOTIN.estado().bolsa.length, n0 + 1, "una pieza más:");
      si(BOTIN.estado().bolsa[BOTIN.estado().bolsa.length - 1].r >= 1, "poco común o mejor");
      si(ENCUENTROS.actual().hecho, "hecho");
      ENCUENTROS.irse();
      // la escalda
      const d0 = RPG.stats().dano;
      ENCUENTROS.aparecer("escalda");
      ENCUENTROS.usar();
      await hastaJuego(A);
      igual(JUEGOS_RUNAS.estado() && JUEGOS_RUNAS.estado().tipo, "mente", "Sigrun juega al verso escondido:");
      ganar(JUEGOS_RUNAS.estado());
      si(JUEGOS_RUNAS.estado().fin && JUEGOS_RUNAS.estado().fin.gano, "adivinó al primer intento");
      JUEGOS_RUNAS.cerrar();
      igual(A.J.modo, "juego", "vuelve al juego:");
      si(ENCUENTROS.estado().inspirado > ENCUENTROS.INSPIRA, "inspirado más tiempo por adivinar rápido");
      si(RPG.stats().dano > d0 * 1.05, "más daño");
      si(ENCUENTROS.sistema.efectosHud().length === 1, "en el HUD");
      ENCUENTROS.irse();
      // el peregrino
      ENCUENTROS.aparecer("peregrino");
      ENCUENTROS.usar();
      await hastaJuego(A);
      const S = JUEGOS_RUNAS.estado();
      igual(S.tipo, "simon", "Hallvard reza:");
      // esperar a que muestre la primera runa y repetirla
      for (let i = 0; i < 60 && S.fase !== "repite"; i++) await esperar(50);
      JUEGOS_RUNAS.tocar(S.sec[0]);
      igual(S.sec.length, 2, "una ronda más:");
      for (let i = 0; i < 80 && S.fase !== "repite"; i++) await esperar(50);
      JUEGOS_RUNAS.tocar((S.sec[0] + 1) % 4);
      si(S.fin && !S.fin.gano && S.fin.ronda === 1, "se equivocó en la segunda");
      const xp0 = RPG.estado ? JSON.stringify(RPG.estado()) : "";
      JUEGOS_RUNAS.cerrar();
      si(ENCUENTROS.actual().hecho, "señaló");
      si(!RPG.estado || JSON.stringify(RPG.estado()) !== xp0, "dio experiencia");
      ENCUENTROS.irse();
      // Brandr: las parejas
      pj.plata = 0;
      const n1 = BOTIN.estado().bolsa.length;
      ENCUENTROS.aparecer("buhonero");
      ENCUENTROS.jugarBuhonero();
      igual(JUEGOS_RUNAS.estado().cartas.length, 16, "dieciséis piedras:");
      JUEGOS_RUNAS.tocar(0);
      JUEGOS_RUNAS.tocar(0);
      igual(JUEGOS_RUNAS.estado().abiertas.length, 1, "la misma no cuenta dos veces:");
      JUEGOS_RUNAS.estado().abiertas = [];
      ganar(JUEGOS_RUNAS.estado());
      si(JUEGOS_RUNAS.estado().fin.gano, "encontró los ocho pares");
      JUEGOS_RUNAS.cerrar();
      await pasarDialogos(A);
      igual(BOTIN.estado().bolsa.length, n1 + 1, "la pieza gratis:");
      igual(pj.plata, 0, "sin cobrar:");
      ENCUENTROS.irse();
    } },
    { nombre: "encuentros: Toki pide ayuda con lobos y paga, Ragna toma una carga del frasco, y se guarda", fn: async (A, { igual, si }) => {
      const e = ENCUENTROS.aparecer("carrero");
      ENCUENTROS.usar();
      await pasarDialogos(A);
      igual(e.lobos.length, 3, "tres lobos:");
      e.lobos.forEach((l) => A.CB.golpear(A.J, l, 999999, A.jug.x, A.jug.y, 1));
      await esperar(200);
      await pasarDialogos(A);
      si(e.hecho, "pagó");
      ENCUENTROS.irse();
      si(!A.enemigos.some((l) => e.lobos.includes(l)), "los lobos se van");
      // Ragna
      FRASCO.estado().cargas = 2;
      ENCUENTROS.aparecer("herida");
      const p0 = PODERES.pj().plata;
      ENCUENTROS.usar();
      igual(A.J.modo, "menu", "pregunta:");
      A.cerrarMenu();
      ENCUENTROS.ayudarHerida();
      await pasarDialogos(A);
      igual(FRASCO.estado().cargas, 1, "una carga menos:");
      si(PODERES.pj().plata > p0, "pagó");
      ENCUENTROS.irse();
      const h = ENCUENTROS.estado().hechos;
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(100);
      igual(ENCUENTROS.estado().hechos.carrero, h.carrero, "se guardó:");
      si(ENCUENTROS.sistema.diario().length > 0, "en el diario");
    } },
  );
}
