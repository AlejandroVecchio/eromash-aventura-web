// Pruebas de los nidos de arañas (motor/aranas.js, enemigos/aranas.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "aranas: tres nidos con tejedora, en el bestiario, la tela frena y saltarla no", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      A.enemigos.forEach((q) => (q.activo = false));
      igual(ARANAS.nidos.length, 3, "tres nidos:");
      ARANAS.nidos.forEach((nd) => {
        si(nd.g.miembros.some((e) => e.lider && e.tipo === "aranaReina"), "con tejedora " + nd.n);
        igual(nd.sacos.length, 4, "cuatro sacos:");
      });
      si(BESTIARIO.LISTA.includes("arana") && BESTIARIO.LISTA.includes("aranaReina"), "en el bestiario");
      si(MATERIALES.LISTA.includes("seda"), "la seda es un material");
      const cv = document.createElement("canvas").getContext("2d");
      ["arana", "aranaReina"].forEach((tp) => ["S", "E", "N"].forEach((v) => CRIATURAS.dibujar(cv, tp, 100, 100, 1, { vista: v, golpe: 0.6, pal: 1, mov: 1 })));
      // la tela
      const w = ARANAS.telas.find((q) => q.hasta == null);
      A.jug.x = w.x;
      A.jug.y = w.y;
      A.jug.salto = 0;
      await esperar(150);
      si(A.jug.enTela && A.jug.lento > 0, "la tela frena");
      A.jug.lento = 0;
      A.jug.salto = 0.4;
      await esperar(60);
      si(!A.jug.enTela, "saltando no");
      A.jug.salto = 0;
      // la tejedora escupe tela
      const n0 = ARANAS.telas.length;
      ARANAS.escupir(A.jug.x + 300, A.jug.y);
      igual(ARANAS.telas.length, n0 + 1, "tela nueva:");
      si(ARANAS.enTela(A.jug.x + 300, A.jug.y), "donde cayó");
    } },
    { nombre: "aranas: la mordida envenena sin matar, el frasco y la venda lo curan, y los sacos dan seda", fn: async (A, { igual, si }) => {
      const jug = A.jug,
        nd = ARANAS.nidos[0],
        e = nd.g.miembros.find((q) => q.tipo === "arana");
      jug.x = nd.centro[0] + 1200;
      jug.y = nd.centro[1] + 1200;
      await esperar(80);
      e.activo = true;
      e.x = jug.x + 40;
      e.y = jug.y;
      jug.inv = 0;
      jug.salto = 0;
      jug.esq = 0;
      jug.hp = 20;
      A.J.herir(5, e.x, e.y);
      e.activo = false;
      si(ARANAS.estado().veneno > 0, "envenenado");
      si(ARANAS.sistema.efectosHud().length === 1, "en el HUD");
      jug.hp = 2;
      await esperar(1200);
      si(jug.hp >= 1 && !jug.muerto, "nunca mata");
      jug.hp = 50;
      // un trago del frasco
      FRASCO.estado().cargas = 1;
      ARANAS.estado().veneno = 5;
      FRASCO.tomar();
      await esperar(250);
      igual(ARANAS.estado().veneno, 0, "el frasco lo cura:");
      jug.hp = 50;
      ARANAS.estado().veneno = 5;
      // venda
      ARANAS.estado().vendas = 0;
      MATERIALES.estado().tiene.seda = 2;
      si(ARANAS.tejer(), "teje");
      igual(MATERIALES.cuantos("seda"), 0, "gastó la seda:");
      si(ARANAS.sistema.celdasBolsa().length === 1, "la venda en la bolsa");
      si(ARANAS.usarVenda(), "usa la venda");
      igual(ARANAS.estado().veneno, 0, "curado:");
      si(jug.hp >= 80 - 1, "con vida");
      si(ARANAS.sistema.botonesFogata().length === 1, "botón en la fogata");
      // sacos
      ARANAS.cortar.siempreCrias = true;
      const c0 = A.enemigos.length;
      si(ARANAS.cortar(nd, 0), "corta");
      ARANAS.cortar.siempreCrias = false;
      si(MATERIALES.cuantos("seda") >= 1, "da seda");
      igual(A.enemigos.length, c0 + 2, "dos arañitas:");
      si(nd.sacos[0].o.cortado && !ARANAS.cortar(nd, 0), "uno por día");
      ARANAS.crias.forEach((q) => (q.muerto = 1));
      await esperar(100);
      igual(A.enemigos.length, c0, "las crías muertas se van:");
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(100);
      si(nd.sacos[0].o.cortado, "se guardó el saco cortado");
    } },
  );
}
