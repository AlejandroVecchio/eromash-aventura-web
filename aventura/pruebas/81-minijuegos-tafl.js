// Pruebas de hnefatafl (motor/mj-tafl.js) y de Fjalar en el Hongo Dorado que lo pide (motor/hongo.js).
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const vacia = (n) => Array.from({ length: n }, () => Array(n).fill(null));
  const i = (S, x, y) => y * S.n + x;
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "tafl: comer deja la pieza tachada un instante y cuenta la tomada", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      MINIJ.empezar("tafl", { semilla: 3 });
      const S = MINIJ.estado();
      S.b = [".......", ".......", ".......", "...K...", ".....A.", ".......", ".....D."].map((f) => f.split("").map((c) => (c === "." ? null : c)));
      S.b[3][5] = "D";
      S.turno = "D";
      S.piensa = 99;
      MINIJ.JUEGOS.tafl.tocar(S, 6 * 7 + 5);
      MINIJ.JUEGOS.tafl.tocar(S, 5 * 7 + 5);
      igual(S.b[4][5], null, "el atacante de f5 cae:");
      igual(S.tomadas.D, 1, "tomadas:");
      si(S.caidas && S.caidas.l.length === 1, "queda tachada para verla caer");
      MINIJ.cerrar();
    } },
    { nombre: "tafl: la salida, cómo corren las piezas, el trono, las esquinas y las tomas", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      MINIJ.empezar("tafl", { semilla: 3 });
      const S = MINIJ.estado(),
        def = MINIJ.JUEGOS.tafl;
      igual(S.b[3][3], "K", "el rey en el trono:");
      igual(S.b.flat().filter((p) => p === "A").length, 8, "ocho atacantes:");
      igual(S.b.flat().filter((p) => p === "D").length, 4, "cuatro defensores:");
      igual(S.turno, "A", "empiezan los atacantes:");
      // una tabla a mano: es el turno del jugador (defensor)
      S.b = vacia(7);
      S.turno = "D";
      S.b[3][3] = null;
      S.b[1][1] = "K";
      S.b[4][2] = "D";
      S.b[4][4] = "A";
      S.b[2][5] = "A";
      // un defensor no se para en el trono ni en una esquina
      def.tocar(S, i(S, 2, 4));
      def.tocar(S, i(S, 2, 3));
      si(S.b[3][2] === "D" || S.b[4][2] === "D", "toca y mueve");
      S.turno = "D";
      S.b = vacia(7);
      S.b[3][0] = "D";
      def.tocar(S, i(S, 0, 3));
      def.tocar(S, i(S, 0, 0));
      igual(S.b[3][0], "D", "un defensor no entra a la esquina:");
      S.sel = null;
      // toma: un atacante entre dos defensores
      S.b = vacia(7);
      S.turno = "D";
      S.b[5][1] = "K";
      S.b[2][2] = "A";
      S.b[2][1] = "D";
      S.b[4][3] = "D";
      def.tocar(S, i(S, 3, 4));
      def.tocar(S, i(S, 3, 2));
      igual(S.b[2][2], null, "el atacante entre dos defensores sale:");
      igual(S.tomadas.D, 1, "cuenta la toma:");
      // la esquina es hostil: un atacante contra la esquina se toma con un solo defensor
      S.gano = 0;
      S.b = vacia(7);
      S.turno = "D";
      S.b[5][5] = "K";
      S.b[0][1] = "A";
      S.b[3][2] = "D";
      def.tocar(S, i(S, 2, 3));
      def.tocar(S, i(S, 2, 0));
      igual(S.b[0][1], null, "contra la esquina se toma con uno:");
      // el rey llega a la esquina: gana el defensor
      S.gano = 0;
      S.b = vacia(7);
      S.turno = "D";
      S.b[0][3] = "K";
      S.b[6][6 - 1] = "A";
      def.tocar(S, i(S, 3, 0));
      def.tocar(S, i(S, 0, 0));
      si(S.gano > 0 && S.final, "el rey en la esquina gana");
      MINIJ.cerrar();
    } },
    { nombre: "tafl: rodear al rey por los cuatro lados (el trono cuenta) gana el ataque; Fjalar juega y la partida termina", fn: async (A, { igual, si }) => {
      MINIJ.empezar("tafl", { variante: "ataque", semilla: 5 });
      let S = MINIJ.estado();
      const def = MINIJ.JUEGOS.tafl;
      igual(S.yo, "A", "en el ataque el jugador ataca:");
      S.b = vacia(7);
      S.turno = "A";
      S.b[3][4] = "K"; // al lado del trono
      S.b[2][4] = "A";
      S.b[4][4] = "A";
      S.b[3][6] = "A";
      def.tocar(S, i(S, 6, 3));
      def.tocar(S, i(S, 5, 3));
      si(S.gano > 0 && S.final, "rey rodeado contra el trono: gana el ataque");
      MINIJ.cerrar();
      // Fjalar no deja el escape servido: con el rey a un paso de la esquina, la tapa
      MINIJ.empezar("tafl", { semilla: 2 });
      S = MINIJ.estado();
      S.b = vacia(7);
      S.b[2][0] = "K"; // el rey a un paso de la esquina de arriba (la de abajo la tapa un defensor)
      S.b[4][0] = "D";
      S.b[1][3] = "A";
      S.turno = "A";
      def.paso(S, 1);
      igual(S.b[1][0], "A", "Fjalar se pone entre el rey y la esquina:");
      MINIJ.cerrar();
      // Fjalar contra Fjalar: siempre encuentra una jugada que vale hasta que la partida se termina
      for (const v of ["base", "borde", "reloj", "gran"]) {
        MINIJ.empezar("tafl", { variante: v, semilla: 7 });
        S = MINIJ.estado();
        S.yo = "nadie"; // los dos lados los juega Fjalar
        let jugadas = 0;
        for (let k = 0; k < 80 && !S.gano; k++) {
          const antes = JSON.stringify(S.b);
          def.paso(S, 0.7);
          if (JSON.stringify(S.b) !== antes) jugadas++;
        }
        si(jugadas >= 20 || S.gano > 0, v + " juega (" + jugadas + " jugadas" + (S.gano ? ", terminó" : "") + ")");
        si(S.b.flat().filter((p) => p === "K").length <= 1, v + " un solo rey");
        MINIJ.cerrar();
      }
    } },
    { nombre: "tafl: Fjalar juega en el Hongo Dorado, sube de tabla y paga la apuesta una vez por día", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const plata = () => PODERES.pj().plata;
      HONGO.taflConFjalar();
      let S = MINIJ.estado();
      igual(S && S.tipo, "tafl", "Fjalar saca la tabla:");
      igual(S.variante, "borde", "la primera, al borde:");
      const p0 = plata();
      MINIJ.terminar({ gano: true, jugadas: 9 });
      MINIJ.cerrar();
      si(plata() > p0, "paga la apuesta");
      HONGO.taflConFjalar();
      S = MINIJ.estado();
      igual(S.variante, "base", "después, la de siempre:");
      const p1 = plata();
      MINIJ.terminar({ gano: true, jugadas: 9 });
      MINIJ.cerrar();
      igual(plata(), p1, "el mismo día no paga otra vez:");
      HONGO.taflConFjalar();
      MINIJ.terminar({ gano: false, jugadas: 9 });
      MINIJ.cerrar();
      igual(plata(), p1, "perder no cobra ni paga:");
      await esperar(10);
    } },
  );
}
