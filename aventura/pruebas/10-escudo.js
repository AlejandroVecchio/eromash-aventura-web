// Pruebas del escudo: bloquear, parar y empujar (motor/escudo.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperarJuego = async (seg) => {
    const t0 = JUEGO.A.J.t;
    while (JUEGO.A.J.t - t0 < seg) await new Promise((r) => setTimeout(r, 30));
  };
  const tecla = (code, abajo) => dispatchEvent(new KeyboardEvent(abajo ? "keydown" : "keyup", { code }));
  // un golpe de 20 desde (dx, dy); devuelve cuánta vida sacó
  const golpe = (A, dx, dy) => {
    const v = A.jug.hp;
    A.jug.inv = 0;
    A.J.herir(20, A.jug.x + dx, A.jug.y + dy, "golpe");
    return v - A.jug.hp;
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "escudo: parar justo no deja entrar nada y aturde a la criatura", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      BOTIN.dar(OBJETOS.generar({ base: "escudoRedondo", r: 0, n: 3, rnd: OBJETOS.azar(4) }), { silencio: true });
      BOTIN.equipar(BOTIN.estado().bolsa.length - 1);
      A.jug.dir = [1, 0];
      const e = A.CB.crear("lobo", A.jug.x + 90, A.jug.y, {});
      e.activo = true;
      A.enemigos.push(e);
      tecla("KeyG", true);
      await esperarJuego(0.05);
      si(ESCUDO.levantado(), "levantado");
      igual(golpe(A, 90, 0), 0, "la parada no deja entrar nada:");
      si(e.aturdido > 0.5, "la criatura quedó aturdida");
      si(A.jug.contra > 0, "y el próximo golpe pega doble");
      e.muerto = 1;
      e.activo = false;
    } },
    { nombre: "escudo: bloquear de frente saca lo que dice el escudo y gasta estamina", fn: async (A, { igual, si }) => {
      await esperarJuego(0.4);
      A.jug.hp = A.jug.hpMax;
      A.jug.sta = A.jug.staMax;
      const sin = 20 * (100 / (100 + (A.J.armadura || 0)));
      const entra = golpe(A, 90, 0);
      si(entra < sin * 0.5, "entra menos de la mitad (" + entra + " de " + Math.round(sin) + ")");
      si(A.jug.sta < A.jug.staMax, "gastó estamina");
      A.jug.hp = A.jug.hpMax;
      const atras = golpe(A, -90, 0);
      si(atras > entra, "de atrás no bloquea (" + atras + ")");
    } },
    { nombre: "escudo: sin estamina la guardia se rompe", fn: async (A, { si }) => {
      A.jug.hp = A.jug.hpMax;
      A.jug.sta = 1;
      const entra = golpe(A, 90, 0);
      si(entra > 0, "entró algo (" + entra + ")");
      si(ESCUDO.rota() > 0, "guardia rota");
      await esperarJuego(0.1);
      si(!ESCUDO.levantado(), "y bajó el escudo");
      tecla("KeyG", false);
      await esperarJuego(ESCUDO.BASE.rota);
    } },
    { nombre: "escudo: con el arco no se bloquea; con espada sola, menos", fn: async (A, { igual, si }) => {
      BOTIN.dar(OBJETOS.generar({ base: "arcoCorto", r: 0, n: 3, rnd: OBJETOS.azar(5) }), { silencio: true });
      BOTIN.equipar(BOTIN.estado().bolsa.length - 1);
      si(!ESCUDO.puede(), "con el arco, no");
      const i = BOTIN.estado().bolsa.findIndex((it) => it.fijo === "ob.forastero");
      BOTIN.equipar(i);
      si(ESCUDO.puede() && !BOTIN.puesta("escudo"), "con la espada sola, sí");
      igual(ESCUDO.cuanto(), ESCUDO.BASE.arma, "bloquea:");
    } },
    { nombre: "escudo: atacar con el escudo levantado es un empujón", fn: async (A, { si }) => {
      const j = BOTIN.estado().bolsa.findIndex((it) => OBJETOS.BASES[it.b].slot === "escudo");
      BOTIN.equipar(j);
      A.jug.sta = A.jug.staMax;
      tecla("KeyG", true);
      await esperarJuego(0.1);
      A.jug.atk = { t: 0, d: { wind: 0.08, swing: 0.14, rec: 0.2, arc: 2.3, reach: 78, dano: 16, empuje: 0.4 }, dir: 0, side: 1, pego: false };
      await esperarJuego(0.05);
      si(A.jug.atk && A.jug.atk.d.empujon, "empujón");
      tecla("KeyG", false);
      await esperarJuego(0.5);
    } },
  );
}
