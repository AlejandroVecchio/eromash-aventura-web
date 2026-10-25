// Pruebas de los saltos de poder (motor/saltos.js).
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const enJuego = async (A) => {
    for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
  };
  const subirA = (n) => {
    while (RPG.nivel() < n) RPG.dar(RPG.xpPara ? RPG.xpPara(RPG.nivel()) - RPG.estado().xp + 1 : 99999);
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "saltos de poder: el nivel 5 y el 10 dan su salto, sus puntos una sola vez y el cartel lo anuncia", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      await enJuego(A);
      RPG.estado().saltos = [];
      subirA(4);
      const vida4 = A.jug.hpMax,
        atr4 = ATRIBUTOS.libres(),
        dano4 = A.J.mulDano;
      subirA(5);
      await esperar(30);
      si(A.jug.hpMax >= Math.round((vida4 + 6) * 1.1) - 1, "vida con el salto: " + vida4 + " → " + A.jug.hpMax);
      igual(ATRIBUTOS.libres(), atr4 + 3 + 2, "los 3 del nivel y 2 del salto:");
      si(document.querySelector("#hudNivelSube small").textContent.includes(SALTOS.nombre(SALTOS.de(5))), "el cartel dice el salto");
      si(document.getElementById("hudNivelSube").classList.contains("salto"), "con su color");
      subirA(6);
      await esperar(30);
      igual(document.querySelector("#hudNivelSube small").textContent, I18N.t("rp.subiste"), "el 6 es un nivel común:");
      subirA(10);
      si(A.J.mulDano > dano4 * 1.1 * 1.1, "el 10 suma daño: " + A.J.mulDano.toFixed(3));
      si(RPG.desglose().dano.partes.some((p) => p.quien === "saltos"), "la hoja lo muestra como saltos");
      igual(RPG.desglose().dano.recorte, 0, "no se topa:");
      // al volver a cargar no se dan otra vez
      const libres = ATRIBUTOS.libres();
      SALTOS.sistema.alEmpezar();
      igual(ATRIBUTOS.libres(), libres, "una sola vez:");
      igual(SALTOS.proximo().n, 15, "el próximo:");
    } },
  );
}
