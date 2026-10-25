// Pruebas de los fallos y la diferencia de nivel (motor/fallos.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const enJuego = async (A) => {
    for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
  };
  // una criatura del bosque cualquiera, puesta a dif niveles de Eromash
  const criatura = (A, dif) => {
    const e = A.enemigos.find((x) => !x.muerto && !x.d.blanco && !x.propio && x.d.vida < 400);
    RPG.nivelDe(e);
    e.nivel = Math.max(1, RPG.nivel() + dif);
    e.vida = e.d.vida;
    return e;
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "fallos: la chance crece con la diferencia de nivel y una «?» casi no se toca", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      await enJuego(A);
      igual(FALLOS.fallo(0), 0.05, "a la par, 5 %:");
      let sube = true;
      for (let d = -8; d < 12; d++) sube = sube && FALLOS.fallo(d + 1) >= FALLOS.fallo(d);
      si(sube, "más nivel, más fallos");
      si(FALLOS.fallo(10) >= 0.8 && FALLOS.fallo(10) <= FALLOS.TOPE_FALLO, "contra una «?» se falla casi todo, nunca todo");
      igual(FALLOS.mult(10), 0.5, "y entra la mitad:");
      si(FALLOS.esquiva(-10) > 0.6 && FALLOS.esquiva(5) === 0, "las de mucho menos nivel erran seguido; las de más, nunca");
      si(FALLOS.aplastante(5) > 0 && FALLOS.aplastante(2) === 0, "golpes aplastantes desde tres niveles arriba");
    } },
    { nombre: "fallos: un nivel 1 contra una «?» falla casi siempre, salvo por sorpresa o contraataque", fn: async (A, { igual, si }) => {
      const e = criatura(A, 10);
      igual(FALLOS.dif(e), 10, "diez arriba:");
      let fallos = 0;
      for (let i = 0; i < 400; i++) fallos += FALLOS.tirar(e) == null;
      si(fallos > 280, "falla la mayoría (" + fallos + " de 400)");
      let seguros = 0;
      for (let i = 0; i < 100; i++) seguros += FALLOS.tirar(e, { sorpresa: true }) === 1 && FALLOS.tirar(e, { contra: true }) === 1;
      igual(seguros, 100, "la sorpresa y el contraataque nunca:");
      A.J.textos.length = 0;
      // lo que no pasa por el golpe de la espada (runas, flechas) no falla pero entra la mitad
      const v0 = e.vida;
      A.CB.golpear(A.J, e, 40, e.x - 50, e.y, 0);
      igual(Math.round(v0 - e.vida), 20, "una runa entra la mitad:");
    } },
    { nombre: "fallos: las criaturas de menos nivel erran seguido y las de mucho más aplastan sin pasar el 35 %", fn: async (A, { igual, si }) => {
      // Eromash sube a nivel 15 para tener criaturas diez abajo
      const niv = PROBAR.GRUPOS.find((g) => g.id === "ayudas").lista().find((x) => x.id === "niveles");
      for (let i = 0; i < 3; i++) niv.fn();
      A.cerrarMenu();
      si(RPG.nivel() >= 11, "nivel " + RPG.nivel());
      const jug = A.jug,
        baja = criatura(A, -10);
      let erro = 0;
      for (let i = 0; i < 300; i++) {
        jug.inv = 0;
        jug.hp = jug.hpMax;
        A.J.herir(10, baja.x, baja.y, null, baja);
        erro += jug.hp === jug.hpMax;
      }
      si(erro > 180, "erra la mayoría (" + erro + " de 300)");
      const alta = criatura(A, 8);
      let max = 0,
        aplasta = 0;
      for (let i = 0; i < 300; i++) {
        jug.inv = 0;
        jug.hp = jug.hpMax;
        A.J.herir(Math.round(jug.hpMax * 0.3), alta.x, alta.y, null, alta);
        max = Math.max(max, jug.hpMax - jug.hp);
        aplasta += jug.hpMax - jug.hp > jug.hpMax * 0.31;
      }
      si(aplasta > 0, "a veces aplasta");
      si(max <= Math.max(35, Math.round(jug.hpMax * 0.35)), "nunca más del 35 %");
      jug.hp = jug.hpMax;
      jug.inv = 0;
    } },
    { nombre: "fallos: la Hoja muestra la tabla contra otros niveles y Probar trae un grupo «?»", fn: async (A, { igual, si }) => {
      INVENTARIO.abrir("hoja");
      await esperar(80);
      si(document.body.textContent.includes(I18N.t("fl.hoja_titulo")), "la tabla en la Hoja");
      INVENTARIO.cerrar();
      const e = PROBAR.GRUPOS.find((g) => g.id === "pelea").lista().find((x) => x.id === "pregunta");
      si(e && e.si, "la entrada de Probar");
      e.fn();
      await esperar(1200);
      const lobos = HORDAS.grupos.filter((g) => g.fam === "lobos").sort((a, b) => Math.hypot(a.centro[0] - A.jug.x, a.centro[1] - A.jug.y) - Math.hypot(b.centro[0] - A.jug.x, b.centro[1] - A.jug.y))[0];
      si(lobos.miembros.every((m) => m.nivel - RPG.nivel() >= 10), "todos diez arriba");
    } },
  );
}
