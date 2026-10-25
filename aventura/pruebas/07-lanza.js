// Pruebas de la lanza (motor/lanza.js, equipo/lanzas-dibujo.js).
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
    { nombre: "lanza: estocadas largas y el escudo se queda", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      BOTIN.dar(OBJETOS.generar({ base: "escudoRedondo", r: 0, n: 3, rnd: OBJETOS.azar(4) }), { silencio: true });
      BOTIN.equipar(0);
      BOTIN.dar(OBJETOS.generar({ base: "lanzaAlada", r: 1, n: 6, rnd: OBJETOS.azar(3) }), { silencio: true });
      BOTIN.equipar(BOTIN.estado().bolsa.length - 1);
      igual(ARMAS.tipoActual(), "lanza", "ahora lanza:");
      si(BOTIN.puesta("escudo"), "con escudo todavía");
      const G = ARMAS.golpes(null);
      si(G.combo[0].reach > 140 && G.combo[0].estoque, "estocada larga");
      si(G.combo[2].remate && G.combo[2].arc > 2, "el tercero barre");
    } },
    { nombre: "lanza: con la punta pega ×1,3", fn: async (A, { igual }) => {
      const cerca = quieto(A, "lobo", 60, 0),
        lejos = quieto(A, "lobo", 140, 0);
      const d = ARMAS.golpes(null).combo[0];
      const s = LANZA_ARMA.sistema;
      igual(s.modDano(10, cerca, { d }), 10, "de cerca, igual:");
      igual(s.modDano(10, lejos, { d }), 13, "con la punta:");
      chau(cerca, lejos);
    } },
    { nombre: "lanza: arrojada atraviesa, aturde, se clava y se junta", fn: async (A, { si }) => {
      const libre = A.W.libre;
      A.W.libre = () => true;
      const l = [200, 320].map((dx) => quieto(A, "jabali", dx, 0)),
        v = l.map((e) => e.vida);
      l.forEach((e) => (e.aturdido = 0));
      A.jug.atk = { t: 0, d: ARMAS.golpes(null).giro, dir: 0, side: 1, pego: false };
      await esperarJuego(0.25);
      si(LANZA_ARMA.tiro(), "salió volando");
      si(ARMAS.golpes(null).combo[0].puno, "a puño limpio mientras tanto");
      await esperarJuego(0.6);
      si(l.every((e, i) => e.vida < v[i] || e.muerto), "atravesó a los dos");
      si(l[0].aturdido > 0 || l[0].muerto, "aturdió al primero");
      const t = LANZA_ARMA.tiro();
      si(t && t.estado === "clavada", "quedó clavada (" + (t && t.estado) + ")");
      A.jug.x = t.x;
      A.jug.y = t.y;
      await esperarJuego(0.1);
      si(!LANZA_ARMA.tiro(), "se juntó pasando por encima");
      A.W.libre = libre;
      chau(...l);
    } },
    { nombre: "lanza: si no se junta, vuelve sola", fn: async (A, { si }) => {
      const libre = A.W.libre;
      A.W.libre = () => true;
      A.jug.atk = { t: 0, d: ARMAS.golpes(null).giro, dir: Math.PI, side: 1, pego: false };
      await esperarJuego(1.2);
      si(LANZA_ARMA.tiro() && LANZA_ARMA.tiro().estado === "clavada", "clavada");
      await esperarJuego(LANZA_ARMA.TIRO.vuelve + 1);
      si(!LANZA_ARMA.tiro(), "volvió a la mano");
      A.W.libre = libre;
    } },
  );
}
