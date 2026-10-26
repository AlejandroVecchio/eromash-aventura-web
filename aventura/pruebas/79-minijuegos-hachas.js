// Pruebas de hachas al blanco (motor/mj-hachas.js) y de la diana del campo de la Guardia que lo pide (ciudad/juego.js).
{
  // tira esperando que cada marca pase por donde hay que apuntar (al ojo, o corrido si hay viento o la diana se mueve)
  function tirar(S, op = {}) {
    const def = MINIJ.JUEGOS.hachas,
      dt = 1 / 480,
      R = 170 * (S.v.chico || 1);
    for (let k = 0; k < 200000 && !S.fin; k++) {
      S.t += dt;
      if (!S.gano && (S.fase === "apunta" || S.fase === "alza")) {
        const f = S.fase === "apunta" ? 2.4 : 2.9,
          v = Math.sin(S.tb * f) * R * 1.3;
        // al ojo (corrido contra el viento); afuera, más allá del borde
        const objetivo = op.afuera ? R * 1.25 : S.fase === "apunta" ? -S.viento * R * 0.45 : 0;
        if (Math.abs(v - objetivo) < 2) def.tocar(S, 0);
      }
      def.paso(S, dt);
    }
  }
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "hachas: apuntar al ojo gana cada variante; tirar afuera no suma", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (const v of ["base", "viento", "lejos", "duelo"]) {
        let res = null;
        si(MINIJ.empezar("hachas", { variante: v, semilla: 4, fin: (r) => (res = r) }), "empieza " + v);
        const S = MINIJ.estado();
        tirar(S);
        si(S.fin && S.fin.gano, v + " ganado (" + S.puntos + (v === "duelo" ? " a " + S.rival : "") + ")");
        igual(S.marcador.length, 5, v + " cinco tiros:");
        si(S.marcador.every((p) => p >= 6), v + " todos cerca del ojo: " + S.marcador.join(","));
        MINIJ.cerrar();
        si(res && res.gano && res.puntos === S.puntos, v + " avisa con los puntos");
      }
      let res = null;
      MINIJ.empezar("hachas", { semilla: 4, fin: (r) => (res = r) });
      const S = MINIJ.estado();
      tirar(S, { afuera: true });
      igual(S.puntos, 0, "afuera no suma:");
      MINIJ.cerrar();
      si(res && !res.gano, "y pierde");
    } },
    { nombre: "hachas: la diana colgada se mueve y hay que adelantarse; los anillos dan 10, 6, 4 y 2", fn: async (A, { igual, si }) => {
      MINIJ.empezar("hachas", { variante: "movil", semilla: 9 });
      const S = MINIJ.estado(),
        def = MINIJ.JUEGOS.hachas;
      // apuntar al centro fijo con la diana corrida pierde el ojo
      S.t = Math.PI / 2 / 0.9 - 0.45; // cuando llegue, la diana va a estar 230 a la derecha
      S.fase = "alza";
      S.ax = 0;
      S.tb = 0;
      def.tocar(S, 0);
      for (let k = 0; k < 400 && S.fase === "vuela"; k++) (S.t += 1 / 480), def.paso(S, 1 / 480);
      si(S.marcador[0] < 10, "sin adelantarse no da en el ojo (" + S.marcador[0] + ")");
      MINIJ.cerrar();
      MINIJ.empezar("hachas", { semilla: 1 });
      const S2 = MINIJ.estado(),
        R = 170;
      [[0, 10], [0.3, 6], [0.5, 4], [0.9, 2], [1.1, 0]].forEach(([d, p]) => {
        S2.fase = "alza";
        S2.ax = d * R;
        S2.tb = 0;
        def.tocar(S2, 0);
        const n0 = S2.marcador.length;
        for (let k = 0; k < 400 && S2.marcador.length === n0; k++) (S2.t += 1 / 480), def.paso(S2, 1 / 480);
        igual(S2.marcador[S2.marcador.length - 1], p, "a " + d + " del centro:");
        S2.fase = "apunta";
      });
      MINIJ.cerrar();
    } },
    { nombre: "hachas: la diana de la Guardia en Eikholt pasa de variante, guarda el récord y lo paga", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const plata = () => PODERES.pj().plata;
      EIKHOLT.lanzarHachas();
      let S = MINIJ.estado();
      igual(S && S.tipo, "hachas", "la diana pide hachas:");
      igual(S.variante, "base", "la primera es la de siempre:");
      tirar(S);
      const p0 = plata(),
        hecho = S.puntos;
      MINIJ.cerrar();
      si(plata() > p0, "el primer récord paga");
      igual(EIKHOLT.estado().hachas.record, hecho, "guarda el récord:");
      EIKHOLT.lanzarHachas();
      S = MINIJ.estado();
      igual(S.variante, "viento", "la segunda tiene viento:");
      tirar(S, { afuera: true });
      const p1 = plata();
      MINIJ.cerrar();
      igual(plata(), p1, "sin récord no paga:");
      igual(EIKHOLT.estado().hachas.record, hecho, "el récord queda:");
    } },
  );
}
