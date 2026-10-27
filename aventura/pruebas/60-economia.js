// Pruebas de la economía de la plata (motor/economia.js).
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const enJuego = async (A) => {
    for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "economía: la plata de las criaturas crece con su nivel, lo gris paga poco y las cuentas del día se anotan", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      await enJuego(A);
      igual(ECONOMIA.escala(1), 1, "a nivel 1, lo de siempre:");
      si(Math.abs(ECONOMIA.escala(11) - 1.7) < 1e-9, "a nivel 11, ×1,7");
      while (RPG.nivel() < 12) RPG.dar(RPG.xpPara(RPG.nivel()) * 2);
      const n = RPG.nivel();
      igual(ECONOMIA.deCriatura({ nivel: n }, 100), Math.round(100 * ECONOMIA.escala(n)), "pareja:");
      igual(ECONOMIA.deCriatura({ nivel: n - 7 }, 100), Math.round(100 * ECONOMIA.escala(n - 7) * 0.3), "gris:");
      igual(ECONOMIA.deHistoria(40), Math.round(40 * ECONOMIA.escala(n)), "la historia paga según tu nivel:");
      await esperar(100);
      const c = ECONOMIA.cuentas(),
        g0 = c.gan,
        s0 = c.gas;
      PODERES.pj().plata += 70;
      await esperar(100);
      PODERES.pj().plata -= 30;
      await esperar(100);
      igual(c.gan - g0, 70, "ganado:");
      igual(c.gas - s0, 30, "gastado:");
      si(A.J.htmlDiario ? A.J.htmlDiario().includes(I18N.t("eo.titulo")) : true, "el diario lo cuenta");
    } },
  );
}
