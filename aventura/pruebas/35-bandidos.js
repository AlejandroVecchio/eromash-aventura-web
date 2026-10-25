// Pruebas de los Sin Linde (motor/bandidos.js, enemigos/bandidos.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "bandidos: guaridas con jefe, arqueros y bandidos, en el bestiario y en el mapa", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      const gs = BANDIDOS.guaridas;
      si(gs.length >= 3, "al menos tres guaridas: " + gs.length);
      gs.forEach((gu) => {
        si(gu.g.miembros.some((e) => e.lider && e.tipo === "bandido"), "con jefe " + gu.i);
        si(gu.g.miembros.some((e) => e.tipo === "arquero"), "con arqueros " + gu.i);
        si(HORDAS.grupos.includes(gu.g), "es un grupo de HORDAS");
        si(gu.botin.id === "botinSinLinde" && !gu.botin.o.abierto, "botín cerrado");
      });
      si(BESTIARIO.LISTA.includes("bandido") && BESTIARIO.LISTA.includes("arquero"), "en el bestiario");
      igual(COMBATE.TIPOS.arquero.forma, "lejos", "el arquero tira de lejos:");
      igual(BANDIDOS.sistema.marcasMapa().length, gs.length, "en el mapa:");
      // se dibujan sin romper, en las tres vistas
      const cv = document.createElement("canvas").getContext("2d");
      ["bandido", "arquero"].forEach((tp) => ["S", "E", "N"].forEach((v) => CRIATURAS.dibujar(cv, tp, 100, 100, 1, { vista: v, golpe: 0.5, pal: 2 })));
      si(true, "dibujos");
    } },
    { nombre: "bandidos: el arquero avisa donde está Eromash y el botín se saquea una vez, cuando cae la guarida", fn: async (A, { igual, si }) => {
      const gu = BANDIDOS.guaridas[0];
      A.enemigos.forEach((q) => (q.activo = false));
      // el arquero
      const ar = gu.g.miembros.find((e) => e.tipo === "arquero");
      ar.activo = true;
      ar.estado = "persigue";
      A.jug.x = gu.centro[0];
      A.jug.y = gu.centro[1] + 500;
      ar.x = A.jug.x + 200;
      ar.y = A.jug.y;
      const casa = ar.casa;
      ar.casa = [ar.x, ar.y];
      for (let i = 0; i < 40 && !ar.aviso; i++) await esperar(50);
      si(ar.aviso && ar.aviso.de === ar, "avisa");
      si(ar.aviso && Math.hypot(ar.aviso.x - A.jug.x, ar.aviso.y - A.jug.y) < 40, "en el piso donde está Eromash");
      ar.activo = false;
      ar.aviso = null;
      ar.casa = casa;
      A.J.avisos.length = 0;
      // el botín: con la guarida en pie no se puede
      gu.g.miembros.forEach((e) => ((e.muerto = 0), (e.activo = true)));
      si(!BANDIDOS.saquear(gu), "todavía vigilan");
      gu.g.miembros.forEach((e) => (e.muerto = 1));
      const p0 = PODERES.pj().plata,
        g0 = MATERIALES.cuantos("ganzua");
      si(BANDIDOS.saquear(gu), "saquea");
      await esperar(400);
      si(PODERES.pj().plata > p0 || A.J.textos.length, "plata");
      igual(MATERIALES.cuantos("ganzua"), g0 + 2, "dos ganzúas:");
      si(gu.botin.o.abierto, "abierto");
      si(!BANDIDOS.saquear(gu), "una sola vez");
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(100);
      si(BANDIDOS.estado().saqueados[gu.i] && gu.botin.o.abierto, "se guardó");
      si(BANDIDOS.sistema.diario().length > 0, "en el diario");
    } },
  );
}
