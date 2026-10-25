// Pruebas del martillo (motor/martillo.js, equipo/martillos-dibujo.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperarJuego = async (seg) => {
    const t0 = JUEGO.A.J.t;
    while (JUEGO.A.J.t - t0 < seg) await new Promise((r) => setTimeout(r, 30));
  };
  const quieto = (A, tipo, dx, dy) => {
    const e = A.CB.crear(tipo, A.jug.x + dx, A.jug.y + dy, {});
    e.activo = true;
    e.aturdido = 99;
    A.enemigos.push(e);
    return e;
  };
  const chau = (...l) => l.forEach((e) => ((e.muerto = 1), (e.activo = false)));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "martillo: se pone con escudo y trae sus golpes", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      BOTIN.dar(OBJETOS.generar({ base: "escudoRedondo", r: 0, n: 3, rnd: OBJETOS.azar(4) }), { silencio: true });
      BOTIN.equipar(0);
      BOTIN.dar(OBJETOS.generar({ base: "mazo", r: 1, n: 4, rnd: OBJETOS.azar(8) }), { silencio: true });
      BOTIN.equipar(BOTIN.estado().bolsa.length - 1);
      igual(ARMAS.tipoActual(), "martillo", "ahora martillo:");
      si(BOTIN.puesta("escudo"), "con escudo todavía");
      const G = ARMAS.golpes(null);
      si(G.combo.every((g) => g.machaca) && G.giro.trueno, "machaca y cargado es el trueno");
    } },
    { nombre: "martillo: al tercer golpe la criatura queda quebrada y recibe más", fn: async (A, { igual, si }) => {
      const e = quieto(A, "trol", 80, 0);
      const s = MARTILLO.sistema,
        d = ARMAS.golpes(null).combo[0];
      igual(s.modDano(100, e), 100, "entera, igual:");
      s.alPegar(e, 10, { d }, false);
      s.alPegar(e, 10, { d }, false);
      si(!(e.quebrado > 0), "todavía no");
      s.alPegar(e, 10, { d }, false);
      si(e.quebrado > 0, "quebrada");
      igual(s.modDano(100, e), 125, "recibe ×1,25:");
      await esperarJuego(MARTILLO.QUIEBRA.dura + 0.3);
      si(!(e.quebrado > 0), "se le pasa");
      chau(e);
    } },
    { nombre: "martillo: el trueno cae sobre las cuatro más cercanas", fn: async (A, { igual, si }) => {
      const l = [
        [100, 0],
        [-100, 40],
        [0, 120],
        [150, -100],
        [200, 0],
      ].map(([dx, dy]) => quieto(A, "trol", dx, dy));
      const v = l.map((e) => e.vida);
      A.jug.atk = { t: 0.31, d: ARMAS.golpes(null).giro, dir: 0, side: 1, pego: true };
      MARTILLO.sistema.alGolpear(A.jug.x, A.jug.y, 0, 90);
      A.jug.atk = null;
      const tocadas = l.filter((e, i) => e.vida < v[i]).length;
      igual(tocadas, 4, "rayos:");
      si(MARTILLO.rayos().length === 4, "se dibujan cuatro rayos");
      si(l.filter((e) => e.quebrado > 0).length === 4, "y las quiebra");
      chau(...l);
    } },
  );
}
