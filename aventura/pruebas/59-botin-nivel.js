// Pruebas del botín según el nivel (motor/botin.js): lo de más nivel trae mejor, lo gris casi nada.
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const enJuego = async (A) => {
    for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
  };
  // vence muchas veces a un líder de nivel n y cuenta lo que cae (las piezas que saltan, antes de llegar al piso)
  function cosecha(A, n, veces) {
    const vu = BOTIN.vuelan(),
      cuenta = { piezas: 0, buenas: 0 };
    for (let i = 0; i < veces; i++) {
      vu.length = 0;
      const e = { tipo: "lobo", nivel: n, x: A.jug.x + 300, y: A.jug.y, d: { vida: 10, plata: 1 }, lider: { afijos: ["veloz"] } };
      BOTIN.alMorir(e);
      vu.forEach((s) => (cuenta.piezas++, s.it.r >= 2 && cuenta.buenas++));
    }
    vu.length = 0;
    return cuenta;
  }
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "botín por nivel: lo de más nivel trae más raras, lo gris casi no suelta y nunca una rara", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      await enJuego(A);
      si(BOTIN.porNivel(30) > 1.8 && BOTIN.porNivel(1) === 1, "el hallazgo sube con el nivel");
      igual(BOTIN.porDif(10), 1.5, "te supera por mucho, ×1,5:");
      igual(BOTIN.porDif(-3), 1, "abajo no suma:");
      while (RPG.nivel() < 12) RPG.dar(RPG.xpPara(RPG.nivel()) * 2);
      const yo = RPG.nivel();
      const gris = cosecha(A, Math.max(1, yo - 8), 400);
      igual(gris.buenas, 0, "lo gris nunca suelta una rara:");
      const parejo = cosecha(A, yo, 2000);
      si(gris.piezas < parejo.piezas * 0.6, "lo gris suelta mucho menos: " + gris.piezas + " contra " + parejo.piezas);
      const alto = cosecha(A, yo + 15, 2000);
      si(alto.buenas / alto.piezas > parejo.buenas / Math.max(1, parejo.piezas), "más arriba, más raras: " + alto.buenas + "/" + alto.piezas + " contra " + parejo.buenas + "/" + parejo.piezas);
    } },
  );
}
