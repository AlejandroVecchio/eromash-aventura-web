// Pruebas del renombre que abre la capital (instructores, mercaderes y tablón).
// (en un bloque: las pruebas comparten la página)
{
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "renombre: las lecciones dos y tres piden ser Conocido y De confianza en Eikholt", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const real = SECUNDARIAS.renombre;
      let rn = 0;
      SECUNDARIAS.renombre = () => rn;
      try {
        RPG.estado().nivel = 20;
        RPG.recalcular();
        PODERES.pj().plata = 5000;
        const st = INSTRUCTORES.estado();
        st.lec.hallbera = 1;
        st.pasada.hallbera = 2;
        igual(INSTRUCTORES.lecPide("hallbera"), "ie.pide_renombre", "sin renombre no enseña la segunda:");
        rn = 1;
        igual(INSTRUCTORES.lecPide("hallbera"), null, "Conocido ya alcanza:");
        si(INSTRUCTORES.aprender("hallbera"), "aprende la segunda");
        st.pasada.hallbera = 3;
        igual(INSTRUCTORES.lecPide("hallbera"), "ie.pide_renombre", "la tercera pide más:");
        rn = 2;
        igual(INSTRUCTORES.lecPide("hallbera"), null, "De confianza abre la tercera:");
      } finally {
        SECUNDARIAS.renombre = real;
      }
    } },
    { nombre: "renombre: los mercaderes traen más y mejor, y el tablón paga más", fn: async (A, { igual, si }) => {
      const real = SECUNDARIAS.renombre;
      let rn = 0;
      SECUNDARIAS.renombre = () => rn;
      try {
        const n0 = COMERCIO.stock("ingrid").piezas.length,
          p0 = TABLON.paga(3);
        rn = 2;
        igual(COMERCIO.stock("ingrid").piezas.length, n0 + 2, "dos piezas más enseguida:");
        igual(TABLON.paga(3), Math.round(p0 * 1.2), "el tablón paga un 20 % más:");
        const q = COMERCIO.rarezaCon([0.62, 0.3, 0.08, 0], 4);
        si(q[0] < 0.62 && q[2] > 0.08 && q[3] > 0, "la suerte corre hacia lo raro y legendario");
        igual(Math.round(q.reduce((a, b) => a + b, 0) * 1000), 1000, "y suma uno:");
        si(window.SISTEMAS.some((s) => s.diario && String(s.diario() || "").includes(I18N.t("sc.renombre_abre_1"))), "el diario dice qué abre cada rango");
      } finally {
        SECUNDARIAS.renombre = real;
      }
    } }
  );
}
