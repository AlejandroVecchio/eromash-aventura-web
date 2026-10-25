// Pruebas del tambor del skald (motor/mj-tambor.js) y de Sølve en el Hongo Dorado que lo pide (motor/hongo.js).
{
  // toca a tiempo lo que tocó Sølve (o se equivoca de golpe a propósito)
  function tocar(S, op = {}) {
    const def = MINIJ.JUEGOS.tambor,
      dt = 1 / 240;
    for (let k = 0; k < 60000 && !S.fin; k++) {
      S.t += dt;
      if (S.fase === "toca" && !S.gano && !op.mudo) {
        const d = 60 / (S.v.bpm || 90) / 2,
          rel = S.t - S.t0,
          q = S.notas.find((n) => !n.hecho && rel >= n.paso * d);
        if (q) def.tocar(S, op.mal ? 1 - q.tipo : q.tipo);
      }
      def.paso(S, dt);
    }
  }
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "tambor: repetir el compás de Sølve a tiempo gana cada variante; errarlo baja el ánimo hasta perder", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (const v of ["base", "rapido", "oido", "largo", "fiesta"]) {
        let res = null;
        si(MINIJ.empezar("tambor", { variante: v, semilla: 5, fin: (r) => (res = r) }), "empieza " + v);
        const S = MINIJ.estado();
        si(S.notas[0].paso === 0 && S.notas[0].tipo === 0, v + " arranca con un golpe al centro");
        si(new Set(S.notas.map((n) => n.paso)).size === S.notas.length, v + " un golpe por paso");
        tocar(S);
        si(S.fin && S.fin.gano, v + " ganado");
        igual(S.bien, S.v.rondas, v + " todas las rondas bien:");
        si(S.fin.precision > 0.9, v + " precisión");
        MINIJ.cerrar();
        si(res && res.gano, v + " avisa");
      }
      // equivocarse de golpe (borde por centro) pierde una ronda por vez hasta que la sala se cansa
      let res = null;
      MINIJ.empezar("tambor", { semilla: 2, fin: (r) => (res = r) });
      let S = MINIJ.estado();
      tocar(S, { mal: true });
      si(S.fin && !S.fin.gano, "errar pierde");
      igual(S.ronda, S.v.animo, "una ronda por cada ánimo:");
      MINIJ.cerrar();
      si(res && !res.gano, "avisa que no");
      // no tocar nada también
      MINIJ.empezar("tambor", { semilla: 2 });
      S = MINIJ.estado();
      tocar(S, { mudo: true });
      si(S.fin && !S.fin.gano, "callarse pierde");
      MINIJ.cerrar();
    } },
    { nombre: "tambor: el puntero toca el parche o el aro; tocar fuera de tiempo es un error", fn: async (A, { igual, si }) => {
      MINIJ.empezar("tambor", { semilla: 8 });
      const S = MINIJ.estado(),
        def = MINIJ.JUEGOS.tambor;
      igual(def.hit(S, 860, 500), 0, "el centro del parche:");
      igual(def.hit(S, 860 + 200, 500), 1, "el aro:");
      igual(def.hit(S, 200, 200), null, "afuera nada:");
      S.fase = "toca";
      S.t0 = S.t - 0.4 * (60 / S.v.bpm / 2) - 0.3; // entre dos pasos, lejos de cualquier golpe
      const e0 = S.errores;
      def.tocar(S, 0);
      si(S.errores >= e0, "fuera de tiempo no suma acierto");
      MINIJ.cerrar();
    } },
    { nombre: "tambor: en el Hongo Dorado Sølve lo pide de noche y paga propinas una vez por noche", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const plata = () => PODERES.pj().plata;
      HONGO.tamborConSolve(true, true);
      let S = MINIJ.estado();
      igual(S && S.tipo, "tambor", "Sølve da el tambor:");
      tocar(S);
      const p0 = plata();
      MINIJ.cerrar();
      si(plata() > p0, "paga propinas");
      igual(A.jug.sta, A.jug.staMax, "estamina llena:");
      const p1 = plata();
      HONGO.tamborConSolve(true, true);
      S = MINIJ.estado();
      tocar(S);
      MINIJ.cerrar();
      igual(plata(), p1, "la misma noche no paga otra vez:");
      HONGO.tamborConSolve(false);
      si(!MINIJ.activo(), "de día no toca");
    } },
  );
}
