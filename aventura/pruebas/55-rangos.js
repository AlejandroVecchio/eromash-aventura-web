// Pruebas de la curva de las criaturas y los rangos de los líderes (motor/rpg.js nivelar, motor/hordas.js subirRango).
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const enJuego = async (A) => {
    for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "curva: la vida de una criatura se empina con el nivel más que su daño", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      await enJuego(A);
      const W = ELDERVALD,
        e = { tipo: "jabali", casa: [W.ANCHO - 3000, 3000], d: { vida: 100, dano: 10 }, vida: 100 };
      RPG.nivelar(e);
      const n = e.nivel;
      si(n >= 15, "lejos del Puesto es de nivel alto (" + n + ")");
      igual(e.d.vida, Math.round(100 * (1 + 0.1 * (n - 1) + 0.004 * (n - 1) * (n - 1))), "vida:");
      igual(e.d.dano, Math.round(10 * (1 + 0.06 * (n - 1))), "daño:");
      igual(e.vida, e.d.vida, "nace llena:");
    } },
    { nombre: "rangos: los líderes de más nivel son campeones o señores, con más afijos, y valen más", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      await enJuego(A);
      igual([3, 7, 14, 15, 30].map(RPG.rango).join(), "1,2,2,3,3", "rangos por nivel:");
      const g = HORDAS.grupos.find((q) => !q.unico && q.miembros.some((e) => e.lider && !e.lider.unico && (e.lider.afijos || []).length === 1));
      const e = g.miembros.find((q) => q.lider);
      const vida0 = e.d.vida,
        xp1 = RPG.xpDe ? RPG.xpDe(e) : 0;
      HORDAS.subirRango(e, 2);
      igual(e.lider.afijos.length, 2, "un campeón tiene dos afijos:");
      si(e.lider.titulo.startsWith(I18N.t("hd.rango_2")), "su título lo dice: " + e.lider.titulo);
      HORDAS.subirRango(e, 3);
      igual(e.lider.afijos.length, 3, "un señor tiene tres:");
      igual(new Set(e.lider.afijos).size, 3, "sin repetir:");
      si(e.d.vida > vida0 * 1.2, "y más vida");
      if (RPG.xpDe) si(RPG.xpDe(e) > xp1, "y vale más experiencia");
      HORDAS.subirRango(e, 2);
      igual(e.lider.rango, 3, "no baja de rango:");
    } },
  );
}
