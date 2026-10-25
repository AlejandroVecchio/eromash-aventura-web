// Pruebas de los tipos de arma (motor/armas.js, equipo/armas-dibujo.js).
// el tiempo del juego (sin ventana los cuadros vienen lentos: se espera por el reloj del juego, no por el de afuera)
const esperarJuego = async (seg) => {
  const t0 = JUEGO.A.J.t;
  while (JUEGO.A.J.t - t0 < seg) await new Promise((r) => setTimeout(r, 30));
};
(window.PRUEBAS = window.PRUEBAS || []).push(
  { nombre: "armas: el hacha trae sus golpes", fn: async (A, { igual, si }) => {
    JUEGO.empezar(9, true);
    igual(ARMAS.tipoActual(), "espada", "arranca con espada:");
    BOTIN.dar(OBJETOS.generar({ base: "hachaBarbuda", r: 0, n: 4, rnd: OBJETOS.azar(2) }), { silencio: true });
    BOTIN.equipar(0);
    igual(ARMAS.tipoActual(), "hacha", "ahora hacha:");
    const G = ARMAS.golpes(null);
    si(G.combo[2].grieta && G.giro.lanzar, "hachazo que parte el piso y lanzar cargando");
    si(OBJETOS.lineas(BOTIN.puesta("arma")).some((l) => l.txt.includes("sangrar")), "la pieza dice cómo pega");
  } },
  { nombre: "armas: el hachazo hace sangrar", fn: async (A, { igual, si, esperar }) => {
    const e = A.CB.crear("lobo", A.jug.x + 300, A.jug.y, {});
    e.activo = true;
    e.aturdido = 99; // que no se mueva ni pegue durante la prueba
    A.enemigos.push(e);
    // cuenta lo que le quita el sangrado (una criatura que vuelve a su casa se cura: no alcanza con mirar su vida)
    let quito = 0;
    const orig = A.CB.golpear;
    A.CB.golpear = (J, q, dano, ...r) => ((q === e && (quito += dano)), orig(J, q, dano, ...r));
    const s = ARMAS.sistema;
    s.alPegar(e, 30, { d: { hacha: true, remate: true } }, false);
    si(e.sangra, "sangra");
    await esperarJuego(3.2);
    A.CB.golpear = orig;
    igual(quito, 12, "el 40 % del golpe en tres segundos:");
    igual(e.sangra, null, "se le pasó:");
    e.muerto = 1;
    e.activo = false;
  } },
  { nombre: "armas: el hacha cargada vuela, corta y vuelve", fn: async (A, { si, esperar }) => {
    const j = A.jug;
    j.dir = [1, 0];
    // sin árboles ni cercas en el camino (al lado del Puesto está la empalizada)
    const libre = A.W.libre;
    A.W.libre = () => true;
    const e = A.CB.crear("lobo", j.x + 200, j.y, {});
    e.activo = true;
    e.aturdido = 99;
    A.enemigos.push(e);
    const v0 = e.vida;
    A.jug.sta = A.jug.staMax;
    dispatchEvent(new KeyboardEvent("keydown", { code: "KeyK" }));
    await esperarJuego(0.75);
    const carga = A.jug.carga;
    dispatchEvent(new KeyboardEvent("keyup", { code: "KeyK" }));
    await esperarJuego(0.3);
    si(ARMAS.lanzada(), "el hacha está volando (carga " + carga + ", " + A.J.modo + ", " + ARMAS.tipoActual() + ", " + JSON.stringify(A.jug.atk && A.jug.atk.d) + ")");
    si(ARMAS.golpes(null).combo[0].puno, "mientras tanto, a puño limpio");
    await esperarJuego(1.6);
    A.W.libre = libre;
    si(!ARMAS.lanzada(), "volvió a la mano");
    si(e.vida < v0 || e.muerto, "cortó al lobo en el camino");
  } },
);
