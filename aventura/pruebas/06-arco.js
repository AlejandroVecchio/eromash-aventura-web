// Pruebas del arco (motor/arco.js, equipo/arcos-dibujo.js).
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
    { nombre: "arco: se pone con las dos manos y trae sus golpes", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      BOTIN.dar(OBJETOS.generar({ base: "escudoRedondo", r: 0, n: 3, rnd: OBJETOS.azar(4) }), { silencio: true });
      BOTIN.equipar(0);
      BOTIN.dar(OBJETOS.generar({ base: "arcoLargo", r: 1, n: 6, rnd: OBJETOS.azar(9) }), { silencio: true });
      BOTIN.equipar(BOTIN.estado().bolsa.length - 1);
      igual(ARMAS.tipoActual(), "arco", "ahora arco:");
      si(!BOTIN.puesta("escudo"), "sin escudo");
      const G = ARMAS.golpes(null);
      si(G.combo.every((g) => g.disparo && g.reach <= 1), "cada golpe dispara (sin filo)");
      igual(G.combo[2].disparo.n, 3, "el tercero es un abanico de:");
      si(G.giro.disparo.tenso, "cargado, el tiro tenso");
    } },
    { nombre: "arco: la flecha vuela, pega a la primera criatura y se queda", fn: async (A, { si, igual }) => {
      const libre = A.W.libre;
      A.W.libre = () => true;
      const e1 = quieto(A, "jabali", 300, 0),
        e2 = quieto(A, "jabali", 420, 0);
      const v1 = e1.vida,
        v2 = e2.vida;
      A.jug.atk = { t: 0, d: ARMAS.golpes(null).combo[0], dir: 0, side: 1, pego: false };
      await esperarJuego(0.2);
      si(ARCO.flechas().length >= 1, "salió una flecha");
      await esperarJuego(0.6);
      si(e1.vida < v1 || e1.muerto, "pegó al primero");
      si(e2.vida >= v2 && !e2.muerto, "el segundo quedó entero");
      igual(ARCO.flechas().length, 0, "la flecha se quedó:");
      A.W.libre = libre;
      chau(e1, e2);
    } },
    { nombre: "arco: el tiro tenso atraviesa a todos", fn: async (A, { si }) => {
      const libre = A.W.libre;
      A.W.libre = () => true;
      const l = [250, 380, 510].map((dx) => quieto(A, "jabali", dx, 0)),
        v = l.map((e) => e.vida);
      A.jug.atk = { t: 0, d: ARMAS.golpes(null).giro, dir: 0, side: 1, pego: false };
      await esperarJuego(0.7);
      si(l.every((e, i) => e.vida < v[i] || e.muerto), "los tres heridos");
      A.W.libre = libre;
      chau(...l);
    } },
    { nombre: "arco: la flecha se corre sola hacia la criatura de adelante", fn: async (A, { si }) => {
      const e = quieto(A, "lobo", 500, 60);
      const d = ARCO.apuntar(0),
        bien = Math.atan2(60 * 1.25, 500);
      si(Math.abs(d - bien) < 0.01, "apunta al lobo (" + d.toFixed(3) + " / " + bien.toFixed(3) + ")");
      si(ARCO.apuntar(Math.PI) === Math.PI, "si mira para el otro lado, no");
      chau(e);
    } },
    { nombre: "arco: en un árbol la flecha queda clavada", fn: async (A, { si }) => {
      const libre = A.W.libre,
        x0 = A.jug.x + 200;
      A.W.libre = (x) => x < x0;
      const antes = ARCO.clavadas().length;
      A.jug.atk = { t: 0, d: ARMAS.golpes(null).combo[0], dir: 0, side: 1, pego: false };
      await esperarJuego(0.5);
      A.W.libre = libre;
      si(ARCO.clavadas().length > antes, "quedó clavada");
    } },
  );
}
