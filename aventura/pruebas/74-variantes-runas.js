// Pruebas de las variantes de los juegos de runas (motor/juegos-runas.js VARIANTES) y el rito de los hörgar (santuarios.js).
{
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "variantes de runas: el verso con ecos cuenta bien las repetidas y el largo pide cinco", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      JUEGOS_RUNAS.empezar("mente", { variante: "repetidas", semilla: 5 });
      let S = JUEGOS_RUNAS.estado();
      S.codigo = [0, 0, 1, 2];
      [0, 1, 0, 0].forEach((i) => JUEGOS_RUNAS.tocar(i));
      const f = S.filas[0];
      igual(f.oro, 1, "una en su lugar:");
      igual(f.blanco, 2, "dos en otro (el tercer 0 no cuenta):");
      [0, 0, 1, 2].forEach((i) => JUEGOS_RUNAS.tocar(i));
      si(S.fin && S.fin.gano, "con ecos se gana repitiendo");
      JUEGOS_RUNAS.cerrar();
      JUEGOS_RUNAS.empezar("mente", { variante: "largo", semilla: 5 });
      S = JUEGOS_RUNAS.estado();
      igual(S.codigo.length, 5, "verso de cinco:");
      igual(S.intentos, 9, "nueve intentos:");
      igual(new Set(S.codigo).size, 5, "sin ecos no repite:");
      JUEGOS_RUNAS.cerrar();
    } },
    { nombre: "variantes de runas: la plegaria al revés se repite del final y la ligera llega a diez", fn: async (A, { igual, si }) => {
      JUEGOS_RUNAS.empezar("simon", { variante: "reves", semilla: 2 });
      const S = JUEGOS_RUNAS.estado();
      S.sec = [0, 1];
      S.fase = "repite";
      S.idx = 0;
      JUEGOS_RUNAS.tocar(1);
      si(!S.fin, "la última primero está bien");
      JUEGOS_RUNAS.tocar(0);
      si(!S.fin && S.sec.length === 3, "pasa de ronda");
      JUEGOS_RUNAS.cerrar();
      JUEGOS_RUNAS.empezar("simon", { variante: "rapido" });
      igual(JUEGOS_RUNAS.estado().meta, 10, "ligera:");
      JUEGOS_RUNAS.cerrar();
    } },
    { nombre: "variantes de runas: de un vistazo no deja tocar al principio y la maldita cambia piedras", fn: async (A, { igual, si }) => {
      JUEGOS_RUNAS.empezar("parejas", { variante: "vistazo", semilla: 4 });
      let S = JUEGOS_RUNAS.estado();
      JUEGOS_RUNAS.tocar(0);
      igual(S.abiertas.length, 0, "mientras se ven todas no se dan vuelta:");
      igual(S.vueltasMax, 12, "menos vueltas:");
      JUEGOS_RUNAS.cerrar();
      JUEGOS_RUNAS.empezar("parejas", { variante: "maldita", semilla: 4 });
      S = JUEGOS_RUNAS.estado();
      const antes = S.cartas.map((q) => q.r).join();
      // tres fallos seguidos
      for (let n = 0; n < 3; n++) {
        const a = 0,
          b = S.cartas.findIndex((q, i) => i > 0 && q.r !== S.cartas[0].r);
        JUEGOS_RUNAS.tocar(a);
        JUEGOS_RUNAS.tocar(b);
        S.espera = 0.0001;
        JUEGOS_RUNAS.paso(0.016);
      }
      igual(S.fallos, 3, "tres fallos:");
      si(S.cartas.map((q) => q.r).join() !== antes, "dos piedras se cambiaron");
      JUEGOS_RUNAS.cerrar();
    } },
    { nombre: "variantes de runas: ganar el rito de un hörgr da la bendición fuerte sin pagar", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const st = SANTUARIOS.estado();
      st.dia = {};
      st.bend = null;
      const pj = PODERES.pj();
      pj.plata = 0;
      si(SANTUARIOS.rito("odin"), "empieza el rito");
      const S = JUEGOS_RUNAS.estado();
      igual(S.tipo + "/" + S.variante, "mente/repetidas", "el de Odín:");
      S.ahora = S.codigo.slice(0, -1);
      JUEGOS_RUNAS.tocar(S.codigo[S.codigo.length - 1]);
      si(S.fin && S.fin.gano, "ganó");
      JUEGOS_RUNAS.cerrar();
      si(st.bend && st.bend.dios === "odin" && st.bend.fuerte, "bendición fuerte");
      igual(pj.plata, 0, "sin pagar:");
      si(!SANTUARIOS.rito("odin"), "una vez por día");
      igual(Object.keys(SANTUARIOS.RITO).length, 7, "un rito por dios:");
    } }
  );
}
