// Pruebas del motor de minijuegos (motor/minijuegos.js) y la cerradura de anillos (motor/mj-anillos.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  // resuelve la cerradura girando cada anillo de adentro hacia afuera (los ligados mueven el de afuera, que se arregla después)
  function resolver(S) {
    for (let k = 0; k < S.n; k++) {
      let n = 0;
      while (S.giro[k] !== S.meta[k] && n++ < 8) MINIJ.tocar(k * 2 + 1);
    }
  }
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "minijuegos: la cerradura de anillos se arma desordenada, se resuelve y avisa a quien la pidió", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (const v of ["base", "cuatro", "ligados", "reloj", "gran"]) {
        let res = null;
        si(MINIJ.empezar("anillos", { variante: v, semilla: 11, fin: (r) => (res = r) }), "empieza " + v);
        const S = MINIJ.estado();
        igual(A.J.modo, "minij", "modo:");
        igual(S.n, { base: 3, cuatro: 4, ligados: 4, reloj: 4, gran: 5 }[v], v + " anillos:");
        si(S.giro.some((g, k) => g !== S.meta[k]), v + " arranca desordenada");
        resolver(S);
        si(S.giro.every((g, k) => g === S.meta[k]), v + " resuelta");
        await esperar(1000);
        si(S.fin && S.fin.gano, v + " ganó");
        MINIJ.cerrar();
        si(res && res.gano && res.movs > 0, v + " avisa con los giros");
        igual(A.J.modo, "juego", "vuelve al juego:");
      }
    } },
    { nombre: "minijuegos: los anillos ligados mueven el de afuera, el reloj corta y Esc deja", fn: async (A, { igual, si }) => {
      MINIJ.empezar("anillos", { variante: "ligados", semilla: 3 });
      let S = MINIJ.estado();
      const g1 = S.giro[1];
      MINIJ.tocar(0 * 2 + 1);
      igual(S.giro[1], (g1 + 7) % 8, "el de afuera giró al revés:");
      MINIJ.cerrar();
      let res = null;
      MINIJ.empezar("anillos", { variante: "reloj", semilla: 3, fin: (r) => (res = r) });
      S = MINIJ.estado();
      S.t = S.v.tiempo + 1;
      await esperar(200);
      si(S.fin && S.fin.tiempo && !S.fin.gano, "se acabó el tiempo");
      MINIJ.cerrar();
      si(res && !res.gano, "avisa que no");
      // los cofres que cierran con anillos
      const { cofres } = SECRETOS.lista();
      const arca = cofres.find((c) => c.tipo === "arcaEnterrada");
      igual(SECRETOS.cerrojo(arca), "reloj", "el arca enterrada:");
      si(SECRETOS.cerrojo(cofres.find((c) => c.tipo === "arconLenador" && c.id % 4 === 0)) == null, "los demás arcones abren como siempre");
      // Probar mecánicas los lista solos
      const g = PROBAR.GRUPOS.find((x) => x.id === "minijuegos");
      igual(g.lista().filter((e) => e.id.startsWith("mj_anillos_")).length, 5, "las cinco variantes en Probar:");
    } }
  );
}
