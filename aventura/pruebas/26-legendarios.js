// Pruebas de los poderes de las legendarias (motor/legendarios.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const leg = (base, po, n = 6) => {
    const it = OBJETOS.generar({ base, r: 3, n, rnd: OBJETOS.azar(n * 13 + base.length) });
    it.po = po;
    return it;
  };
  const ponerse = (it) => {
    BOTIN.dar(it);
    BOTIN.equipar(BOTIN.estado().bolsa.length - 1);
  };
  const muneco = (A, dx) => {
    const e = A.CB.crear("lobo", A.jug.x + dx, A.jug.y, {});
    e.d.vida = 100000;
    e.vida = 100000;
    A.enemigos.push(e);
    return e;
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "legendarios: toda legendaria sale con un poder de su casilla y nombre propio", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const rnd = OBJETOS.azar(5);
      ["arma", "escudo", "casco", "pecho", "piernas", "botas", "amuleto", "anillo1"].forEach((slot) => {
        const it = OBJETOS.generar({ r: 3, n: 8, slot, rnd });
        si(it.po && LEGENDARIOS.POD[it.po].en.includes(OBJETOS.BASES[it.b].slot), slot + " con poder (" + it.po + ")");
        igual(OBJETOS.nombre(it), I18N.t("lg.n_" + it.po), "nombre de " + slot + ":");
      });
      si(!OBJETOS.generar({ r: 2, n: 8, rnd }).po, "las raras no");
    } },
    { nombre: "legendarios: Surtr estalla, Hel cura, Svalinn absorbe y Víðarr protege corriendo", fn: async (A, { igual, si }) => {
      A.teletransportar(A.W.LUGARES.tala.p[0] + 900, A.W.LUGARES.tala.p[1]);
      for (let i = 0; i < 60 && A.J.modo !== "juego"; i++) await esperar(100);
      ponerse(leg("espadaAncha", "surtr"));
      si(LEGENDARIOS.tiene("surtr"), "Surtr activo");
      const a = muneco(A, 60),
        b = muneco(A, 120);
      const vb = b.vida;
      for (let i = 0; i < 5; i++) LEGENDARIOS.sistema.alPegar(a, 20, { d: {}, critico: false }, false);
      si(b.vida < vb, "el quinto golpe quema al de al lado (" + (vb - b.vida) + ")");
      ponerse(leg("yelmo", "hel"));
      A.jug.hp = 10;
      LEGENDARIOS.sistema.alPegar(a, 20, { d: {} }, true);
      igual(Math.round(A.jug.hp), Math.round(10 + A.jug.hpMax * 0.04), "Hel cura 4 %:");
      ponerse(leg("coraza", "svalinn"));
      A.jug.hp = A.jug.hpMax * 0.2;
      LEGENDARIOS.sistema.actualizar(0.016);
      si(LEGENDARIOS.egida() > 0, "la égida aparece");
      igual(Math.round(LEGENDARIOS.sistema.modRecibido(10)), 0, "absorbe:");
      ponerse(leg("grebas", "vidarr"));
      A.jug.correr = true;
      const r = LEGENDARIOS.sistema.modRecibido(1000);
      si(r < 1000 * 0.76 && r > 0, "corriendo recibe menos (" + Math.round(r) + ")");
      A.jug.correr = false;
      a.muerto = b.muerto = 1;
    } },
    { nombre: "legendarios: desarmar enseña el poder y grabado vale sin la pieza", fn: async (A, { igual, si }) => {
      const st = LEGENDARIOS.estado();
      BOTIN.dar(leg("amuleto", "brisingamen"));
      const i = BOTIN.estado().bolsa.length - 1;
      BOTIN.desarmar(i);
      BOTIN.desarmar(i); // pide confirmar
      await esperar(1000);
      si(st.aprendidos.brisingamen, "aprendido");
      igual(st.grabados.joya, "brisingamen", "grabado solo en la ranura vacía:");
      si(LEGENDARIOS.tiene("brisingamen"), "vale sin llevarlo");
      PODERES.pj().plata = 2500;
      igual(Math.round(LEGENDARIOS.sistema.modDano(100, {}, {})), 125, "+25 % con 2500 de plata:");
      PODERES.pj().plata = 9000;
      igual(Math.round(LEGENDARIOS.sistema.modDano(100, {}, {})), 130, "tope 30 %:");
      LEGENDARIOS.aprender("mjolnir");
      await esperar(50);
      INVENTARIO.abrir("poderes");
      await esperar(100);
      igual(INVENTARIO.actual(), "poderes", "la pestaña:");
      igual(document.querySelectorAll(".inv-rejilla").length, 3, "arma, armadura y joya:");
      INVENTARIO.cerrar();
      LEGENDARIOS.grabar("mjolnir");
      igual(st.grabados.arma, "mjolnir", "graba en arma:");
      A.H.guardar(9);
    } },
  );
}
