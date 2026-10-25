// Pruebas del bastón rúnico (motor/baston.js, equipo/bastones-dibujo.js).
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
    { nombre: "bastón: se pone con las dos manos y conjura", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      BOTIN.dar(OBJETOS.generar({ base: "bastonCristal", r: 1, n: 10, rnd: OBJETOS.azar(2) }), { silencio: true });
      BOTIN.equipar(BOTIN.estado().bolsa.length - 1);
      igual(ARMAS.tipoActual(), "baston", "ahora bastón:");
      const G = ARMAS.golpes(null);
      si(G.combo.every((g) => g.conjuro) && G.giro.sello && G.carrera.parpadeo, "chispas, sello y paso de niebla");
    } },
    { nombre: "bastón: la chispa busca, pega y devuelve energía rúnica", fn: async (A, { si }) => {
      const libre = A.W.libre;
      A.W.libre = () => true;
      // la criatura está corrida: la chispa sale derecho y se tuerce hacia ella
      // (solo esta criatura cerca: las del bosque y las de otras pruebas no cuentan)
      const otras = A.enemigos.filter((q) => q.activo);
      otras.forEach((q) => (q.activo = false));
      const e = quieto(A, "trol", 300, 140);
      // cuenta los golpes (una criatura que vuelve a su casa se cura: no alcanza con mirar su vida)
      let pego = 0;
      const orig = A.CB.golpear;
      A.CB.golpear = (J, q, dano, ...r) => ((q === e && (pego += dano)), orig(J, q, dano, ...r));
      PODERES.darEnergia(-100);
      A.jug.atk = { t: 0, d: ARMAS.golpes(null).combo[0], dir: 0, side: 1, pego: false };
      await esperarJuego(0.9);
      A.CB.golpear = orig;
      si(pego > 0, "le pegó aunque no apuntaba derecho (" + BASTON.chispas().length + " volando)");
      si(PODERES.estado().energia >= BASTON.CHISPA.energia, "devolvió energía (" + PODERES.estado().energia.toFixed(1) + ")");
      A.W.libre = libre;
      chau(e);
      otras.forEach((q) => (q.activo = true));
    } },
    { nombre: "bastón: el sello avisa en el piso y después estalla y ata", fn: async (A, { si }) => {
      const e = quieto(A, "trol", 220, 0);
      e.aturdido = 0;
      const v = e.vida;
      A.jug.atk = { t: 0, d: ARMAS.golpes(null).giro, dir: 0, side: 1, pego: false };
      await esperarJuego(0.2);
      si(BASTON.sellos().length === 1, "el aviso está en el piso");
      si(e.vida >= v, "todavía no pegó");
      await esperarJuego(BASTON.SELLO.aviso + 0.1);
      si(e.vida < v, "estalló");
      si(e.atada > 0 && e.aturdido > 0, "la dejó atada");
      chau(e);
    } },
    { nombre: "bastón: corriendo, el paso de niebla lo corre sin que nada lo toque", fn: async (A, { si }) => {
      const libre = A.W.libre;
      A.W.libre = () => true;
      const x0 = A.jug.x;
      A.jug.atk = { t: 0, d: ARMAS.golpes(null).carrera, dir: 0, side: 1, pego: false };
      await esperarJuego(0.1);
      si(A.jug.x - x0 > BASTON.PARPADEO.largo * 0.8, "avanzó (" + Math.round(A.jug.x - x0) + ")");
      si(A.jug.inv > 0, "intocable un instante");
      A.W.libre = libre;
    } },
  );
}
