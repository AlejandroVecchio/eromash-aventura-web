// Pruebas de los contratos de caza y los trofeos (motor/contratos.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "contratos: el poste está junto a la Guardia de Eikholt y cada contrato tiene rastros y guarida", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const p = CONTRATOS.poste();
      const C = A.W.CIUDAD;
      si(p && ((p.x - C.c[0]) / C.rx) ** 2 + ((p.y - C.c[1]) / C.ry) ** 2 < 1, "el poste está en Eikholt");
      si(EIKHOLT.traido("poste_contratos"), "y la ciudad lo trae");
      igual(ASSETS.sinGiro().filter((k) => /Contrat/.test(k)).length, 0, "los assets aguantan el giro:");
      const L = CONTRATOS.lugares();
      CONTRATOS.LISTA.forEach((k) => si(L[k.id].rastros.length === 3 && L[k.id].guarida, k.id + " con rastros y guarida"));
    } },
    { nombre: "contratos: tomar, seguir los rastros, vencer a la bestia y cobrar el trofeo", fn: async (A, { igual, si }) => {
      si(CONTRATOS.tomar("grisvarg"), "tomado");
      si(!CONTRATOS.tomar("cerda"), "de a uno por vez");
      const L = CONTRATOS.lugares().grisvarg;
      for (let i = 0; i < 3; i++) {
        CONTRATOS.examinar("grisvarg", i);
        A.cerrarMenu && A.cerrarMenu();
        JUEGO.J.modo = "juego";
      }
      igual(CONTRATOS.estado().c.grisvarg.fase, "guarida", "los rastros llevan a la guarida:");
      A.jug.x = L.guarida[0];
      A.jug.y = L.guarida[1] + 300;
      await esperar(300);
      const b = CONTRATOS.bestias().grisvarg;
      si(b && b[0].lider && b[0].contrato === "grisvarg", "la bestia salió con su escolta (" + (b ? b.length : 0) + ")");
      si(b[0].d.vida > A.CB.TIPOS.lobo.vida * 3, "es mucho más dura que un lobo");
      A.CB.golpear(A.J, b[0], 99999, A.jug.x, A.jug.y);
      await esperar(300);
      igual(CONTRATOS.estado().c.grisvarg.fase, "cobrar", "vencida:");
      const p0 = PODERES.pj().plata;
      si(CONTRATOS.cobrar("grisvarg"), "cobrado");
      si(PODERES.pj().plata >= p0 + 140, "pagó la plata");
      si(CONTRATOS.estado().trofeos.includes("colmillo"), "dio el trofeo");
      igual(CONTRATOS.estado().colgado, "colmillo", "el primero se cuelga solo:");
    } },
    { nombre: "contratos: el trofeo colgado suma lo suyo y se puede descolgar", fn: async (A, { igual, si }) => {
      const v1 = A.J.velAtq;
      CONTRATOS.colgar("colmillo");
      si(A.J.velAtq < v1, "descolgado, baja la rapidez (" + v1 + " → " + A.J.velAtq + ")");
      CONTRATOS.colgar("colmillo");
      si(Math.abs(A.J.velAtq - v1) < 1e-6, "colgado de nuevo");
      INVENTARIO.abrir("bolsa");
      si(document.querySelectorAll(".inv-celda.elegida").length >= 1, "el trofeo está en la bolsa, marcado");
      INVENTARIO.cerrar();
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      igual(CONTRATOS.estado().colgado, "colmillo", "se guarda:");
    } },
  );
}
