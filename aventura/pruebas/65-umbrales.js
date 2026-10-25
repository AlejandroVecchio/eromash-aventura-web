// Pruebas de los umbrales de los atributos (motor/atributos.js).
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const enJuego = async (A) => {
    for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "umbrales: llegar a 20 de Fuerza suma un 5 % de daño de más, se anuncia y la pestaña lo muestra", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      await enJuego(A);
      while (RPG.nivel() < 6) RPG.dar(RPG.xpPara(RPG.nivel()) * 2);
      const st = ATRIBUTOS.estado();
      ["fue", "des", "vig", "esp"].forEach((k) => (st[k] = 0));
      RPG.recalcular();
      const base = ATRIBUTOS.valor("fue");
      st.fue = 19 - base;
      RPG.recalcular();
      const d19 = A.J.mulDano;
      igual(ATRIBUTOS.alcanzados(ATRIBUTOS.valor("fue")), 0, "en 19, ninguno:");
      st.fue = 20 - base;
      RPG.recalcular();
      const d20 = A.J.mulDano;
      si(Math.abs(d20 / d19 - (1 + 0.015 * (20 - 10)) / (1 + 0.015 * (19 - 10)) * 1.05) < 0.002, "el punto y el 5 %: " + (d20 / d19).toFixed(4));
      // la pestaña
      INVENTARIO.abrir("atributos");
      await esperar(150);
      const txt = document.querySelector(".at-lista").textContent;
      si(txt.includes("◆◇◇◇"), "un rombo lleno en Fuerza");
      si(txt.includes(I18N.t("at.u_fue_30")), "y dice el próximo");
      INVENTARIO.cerrar();
    } },
  );
}
