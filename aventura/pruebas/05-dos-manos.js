// Pruebas de las armas a dos manos (motor/armas.js: mandobles y hachas danesas).
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
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "dos manos: el mandoble saca el escudo y el escudo no entra", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      BOTIN.dar(OBJETOS.generar({ base: "escudoRedondo", r: 0, n: 3, rnd: OBJETOS.azar(4) }), { silencio: true });
      BOTIN.equipar(0);
      si(BOTIN.puesta("escudo"), "con escudo");
      BOTIN.dar(OBJETOS.generar({ base: "mandoble", r: 1, n: 3, rnd: OBJETOS.azar(5) }), { silencio: true });
      BOTIN.equipar(BOTIN.estado().bolsa.length - 1);
      igual(ARMAS.tipoActual(), "mandoble", "ahora mandoble:");
      si(!BOTIN.puesta("escudo"), "el escudo volvió a la bolsa");
      const i = BOTIN.estado().bolsa.findIndex((p) => OBJETOS.BASES[p.b].slot === "escudo");
      si(i >= 0, "y está en la bolsa");
      igual(BOTIN.equipar(i), false, "no deja ponerse el escudo:");
      si(OBJETOS.lineas(BOTIN.puesta("arma")).some((l) => l.txt === I18N.t("ar.sin_escudo")), "la pieza avisa que va sin escudo");
      si(ARMAS.golpes(null).combo[2].piso, "el tercer golpe parte el piso");
    } },
    { nombre: "dos manos: el golpe desde arriba hace una onda que tambalea", fn: async (A, { si }) => {
      const lejos = quieto(A, "lobo", -100, 110);
      lejos.aturdido = 0;
      A.jug.atk = { t: 0.4, d: ARMAS.golpes(null).combo[2], dir: Math.PI, side: 1, pego: true };
      ARMAS.sistema.alGolpear(A.jug.x, A.jug.y, Math.PI, 132);
      si(lejos.aturdido > 0.4, "el lobo del costado (que el filo no tocó) quedó tambaleando (" + lejos.aturdido + ")");
      A.jug.atk = null;
      lejos.muerto = 1;
      lejos.activo = false;
    } },
    { nombre: "dos manos: manteniendo atacar, torbellino que gasta estamina y pega", fn: async (A, { si }) => {
      const libre = A.W.libre;
      A.W.libre = () => true;
      const e = quieto(A, "jabali", 70, 0);
      const v0 = e.vida;
      let golpes = 0;
      const orig = A.CB.golpear;
      A.CB.golpear = (J, q, dano, ...r) => ((q === e && dano > 0 && golpes++), orig(J, q, dano, ...r));
      A.jug.sta = A.jug.staMax;
      dispatchEvent(new KeyboardEvent("keydown", { code: "KeyK" }));
      await esperarJuego(1.6);
      const girando = ARMAS.girando();
      const sta = A.jug.sta;
      dispatchEvent(new KeyboardEvent("keyup", { code: "KeyK" }));
      await esperarJuego(0.4);
      A.CB.golpear = orig;
      A.W.libre = libre;
      si(girando, "estaba girando");
      si(sta < A.jug.staMax - 15, "gastó estamina (" + Math.round(sta) + ")");
      si(golpes >= 2 || e.muerto, "le pegó más de una vez (" + golpes + ")");
      si(!ARMAS.girando(), "al soltar, para");
      e.muerto = 1;
      e.activo = false;
    } },
    { nombre: "dos manos: el hacha danesa sangra y deja grieta", fn: async (A, { igual, si }) => {
      BOTIN.dar(OBJETOS.generar({ base: "hachaDanesa", r: 0, n: 4, rnd: OBJETOS.azar(7) }), { silencio: true });
      BOTIN.equipar(BOTIN.estado().bolsa.length - 1);
      igual(ARMAS.tipoActual(), "hacha2", "hacha a dos manos:");
      const G = ARMAS.golpes(null);
      si(G.combo.every((g) => g.hacha) && G.combo[2].grieta, "cada golpe es de hacha y el remate agrieta");
      si(ARMAS.esDosManos(), "cuenta como dos manos");
    } },
  );
}
