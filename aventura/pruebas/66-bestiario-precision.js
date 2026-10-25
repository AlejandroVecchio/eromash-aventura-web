// Pruebas de lo nuevo del bestiario: precisión contra lo conocido, leyenda y la más fuerte vencida (motor/bestiario.js).
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const enJuego = async (A) => {
    for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "bestiario: el punto débil y la maestría afinan el golpe, y a las 100 llega la leyenda", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      await enJuego(A);
      const st = BESTIARIO.estado();
      st.muertes.jabali = 0;
      st.vistas.jabali = 1;
      igual(BESTIARIO.precisionContra({ tipo: "jabali" }), 0, "sin conocerla:");
      st.muertes.jabali = 10;
      igual(BESTIARIO.precisionContra({ tipo: "jabali" }), 0.03, "punto débil:");
      st.muertes.jabali = 30;
      igual(BESTIARIO.precisionContra({ tipo: "jabali" }), 0.06, "maestría:");
      const b30 = BESTIARIO.bonoDano("jabali");
      st.muertes.jabali = 99;
      BESTIARIO.anotar("jabali", 1);
      si(BESTIARIO.leyenda("jabali"), "leyenda");
      si(Math.abs(BESTIARIO.bonoDano("jabali") - b30 - 0.05) < 1e-9, "+5 % de daño");
      // la más fuerte vencida
      BESTIARIO.sistema.alMorir({ tipo: "jabali", nivel: 14 });
      BESTIARIO.sistema.alMorir({ tipo: "jabali", nivel: 9 });
      igual(st.max.jabali, 14, "la más fuerte:");
      si(BESTIARIO.detalle("jabali").includes("14"), "la página la dice");
      // si están los fallos (motor/fallos.js), la cuenta los baja
      if (window.FALLOS && FALLOS.chanceFallo) {
        const e = { tipo: "jabali", nivel: RPG.nivel() + 4, d: {} };
        st.muertes.jabali = 0;
        const sin = FALLOS.chanceFallo(e);
        st.muertes.jabali = 30;
        si(sin - FALLOS.chanceFallo(e) > 0.05, "con los fallos, fallás menos");
      }
    } },
  );
}
