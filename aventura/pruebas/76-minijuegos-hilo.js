// Pruebas del hilo de las Nornas (motor/mj-hilo.js) y la Poza de Urd que lo pide (motor/vida.js).
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  // tejer la solución que guardó el telar, hilo por hilo, como lo haría el puntero
  function tejer(S) {
    const def = MINIJ.JUEGOS.hilo;
    S.sol.forEach((tr) => {
      def.tocar(S, tr[0]);
      tr.slice(1).forEach((cel) => {
        S.cur = cel;
        MINIJ.estado() === S && def.arrastre(S, 0, 0, "x");
      });
    });
  }
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "hilo: el telar siempre tiene solución, cubre todo y se gana uniendo los pares", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (const v of ["base", "seis", "lleno", "nudos", "reloj"]) {
        let res = null;
        si(MINIJ.empezar("hilo", { variante: v, semilla: 21, fin: (r) => (res = r) }), "empieza " + v);
        const S = MINIJ.estado();
        igual(S.sol.reduce((n, tr) => n + tr.length, 0), S.n * S.n, v + " la solución cubre el telar:");
        si(S.sol.every((tr) => tr.length >= 3 && tr.every((c, k) => !k || [1, S.n].includes(Math.abs(c - tr[k - 1])))), v + " cada hilo va de casilla vecina en vecina");
        const def = MINIJ.JUEGOS.hilo;
        S.sol.forEach((tr, h) => {
          def.tocar(S, tr[0]);
          igual(S.mano, h, v + " agarra el hilo:");
          tr.slice(1).forEach((cel) => {
            const q = 600 / S.n;
            def.arrastre(S, 860 - 300 + (cel % S.n) * q + q / 2, 480 - 300 + Math.floor(cel / S.n) * q + q / 2, "mueve");
          });
          def.arrastre(S, 0, 0, "sube");
        });
        si(S.gano > 0, v + " ganado");
        await esperar(1000);
        MINIJ.cerrar();
        si(res && res.gano, v + " avisa");
      }
    } },
    { nombre: "hilo: con teclado (sin soltar) el último hilo que llega a su piedra gana", fn: async (A, { si }) => {
      JUEGO.empezar(9, true);
      MINIJ.empezar("hilo", { semilla: 21 });
      const S = MINIJ.estado(),
        def = MINIJ.JUEGOS.hilo,
        q = 600 / S.n;
      S.sol.forEach((tr) => {
        def.tocar(S, tr[0]);
        tr.slice(1).forEach((cel) => def.arrastre(S, 860 - 300 + (cel % S.n) * q + q / 2, 480 - 300 + Math.floor(cel / S.n) * q + q / 2, "mueve"));
      });
      si(S.gano > 0, "ganado sin soltar");
      MINIJ.cerrar();
    } },
    { nombre: "hilo: no se pisa la piedra de otro, cruzar corta el otro hilo y volver acorta", fn: async (A, { igual, si }) => {
      MINIJ.empezar("hilo", { semilla: 4 });
      const S = MINIJ.estado(),
        def = MINIJ.JUEGOS.hilo,
        q = 600 / S.n,
        en = (cel, fase = "mueve") => def.arrastre(S, 560 + (cel % S.n) * q + q / 2, 180 + Math.floor(cel / S.n) * q + q / 2, fase);
      const tr = S.sol[0];
      en(tr[0], "baja");
      en(tr[1]);
      en(tr[2]);
      igual(S.hilos[0].length, 3, "tiró dos casillas:");
      en(tr[1]);
      igual(S.hilos[0].length, 2, "volver acorta:");
      en(0, "sube");
      // la piedra de otro par no se pisa
      const otra = S.pares[1][0],
        vec = [otra - S.n, otra + S.n, otra - 1, otra + 1].find((c) => c >= 0 && c < S.n * S.n && S.pares.every((p) => !p.includes(c)) && Math.abs((c % S.n) - (otra % S.n)) <= 1);
      if (vec != null) {
        S.hilos[2] = [];
        S.mano = 2;
        S.hilos[2] = [vec];
        def.arrastre(S, 560 + (otra % S.n) * q + q / 2, 180 + Math.floor(otra / S.n) * q + q / 2, "mueve");
        igual(S.hilos[2].length, 1, "la piedra de otro no se pisa:");
      }
      MINIJ.cerrar();
    } },
    { nombre: "hilo: la Poza de Urd pide tejer antes de la visión y después teje una vez por noche", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const V = VIDA.estado();
      V.poza = false;
      VIDA.mirarPoza(true);
      const S = MINIJ.estado();
      si(S && S.tipo === "hilo" && S.variante === "lleno", "la visión pide el telar sin huecos");
      S.sol.forEach((tr, h) => (S.hilos[h] = tr.slice()));
      MINIJ.JUEGOS.hilo.arrastre(S, 0, 0, "sube");
      await esperar(1000);
      MINIJ.cerrar();
      si(V.poza, "la poza mostró la visión");
      VIDA.mirarPoza(true);
      si(!MINIJ.activo(), "la noche de la visión no teje otra vez");
      V.pozaNoche = -1; // otra noche
      const plata = PODERES.pj().plata;
      VIDA.mirarPoza(true);
      const S2 = MINIJ.estado();
      si(S2 && S2.tipo === "hilo", "después teje de noche");
      S2.sol.forEach((tr, h) => (S2.hilos[h] = tr.slice()));
      MINIJ.JUEGOS.hilo.arrastre(S2, 0, 0, "sube");
      await esperar(1000);
      MINIJ.cerrar();
      si(PODERES.pj().plata > plata, "paga");
      VIDA.mirarPoza(true);
      si(!MINIJ.activo(), "una vez por noche");
    } }
  );
}
