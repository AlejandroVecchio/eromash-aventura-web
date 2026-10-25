// Pruebas del regateo (motor/regateo.js).
// (en un bloque: las pruebas comparten la página)
{
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "regateo: parar la aguja en la zona baja el precio de esa pieza", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      PODERES.pj().plata = 9000;
      COMERCIO.abrir("ingrid");
      const it = COMERCIO.stock("ingrid").piezas[0],
        p0 = COMERCIO.precioCompra(it, "ingrid");
      REGATEO.abrir("compra", it, "ingrid");
      si(document.querySelector("#regateo:not(.oculto)"), "se abre la balanza");
      REGATEO.pedir(1);
      const R = REGATEO.abierto();
      R.x = (R.zona[0] + R.zona[1]) / 2 + (R.zona[1] - R.zona[0]) * 0.3; // adentro pero no en el centro
      REGATEO.parar();
      si(R.bien && !R.redondo, "trato");
      igual(COMERCIO.precioCompra(it, "ingrid"), Math.round(p0 * 0.8), "20 % menos:");
      si(REGATEO.paciencia("ingrid") < 100, "gastó algo de paciencia");
      REGATEO.cerrar();
      const antes = PODERES.pj().plata;
      COMERCIO.comprar("ingrid", it);
      igual(antes - PODERES.pj().plata, Math.round(p0 * 0.8), "pagó lo tratado:");
    } },
    { nombre: "regateo: el centro es trato redondo; errar gasta paciencia y sin paciencia no regatea", fn: async (A, { igual, si }) => {
      const s = COMERCIO.stock("kolbrun"),
        a = s.piezas[0],
        b = s.piezas[1],
        p0 = COMERCIO.precioCompra(a, "kolbrun");
      REGATEO.abrir("compra", a, "kolbrun");
      REGATEO.pedir(0);
      let R = REGATEO.abierto();
      R.x = (R.zona[0] + R.zona[1]) / 2;
      REGATEO.parar();
      si(R.redondo, "redondo");
      igual(COMERCIO.precioCompra(a, "kolbrun"), Math.round(p0 * (1 - 0.1 - REGATEO.CARACTER.kolbrun.redondo)), "rebaja más el extra de Kolbrun:");
      REGATEO.cerrar();
      REGATEO.abrir("compra", b, "kolbrun");
      for (let i = 0; i < 4 && REGATEO.abierto() && REGATEO.abierto().fase !== "fin"; i++) {
        REGATEO.pedir(2);
        R = REGATEO.abierto();
        R.x = R.zona[0] > 0.5 ? 0 : 1; // afuera
        REGATEO.parar();
      }
      igual(REGATEO.paciencia("kolbrun"), 0, "sin paciencia:");
      REGATEO.cerrar();
      si(REGATEO.abrir("compra", b, "kolbrun") === false && !REGATEO.abierto(), "por hoy no regatea más");
      A.H.E.tiempo += LUZ.DIA;
      igual(REGATEO.paciencia("kolbrun"), 100, "al otro día vuelve la paciencia:");
    } },
    { nombre: "regateo: vendiendo se pide más; el Espíritu ensancha la zona", fn: async (A, { igual, si }) => {
      const it = OBJETOS.generar({ base: "espadaAncha", n: 6, r: 1, tema: 1 });
      BOTIN.dar(it, { silencio: true });
      const v0 = COMERCIO.precioVenta(it, "ingrid");
      REGATEO.abrir("venta", it, "ingrid");
      REGATEO.pedir(0);
      const R = REGATEO.abierto();
      R.x = (R.zona[0] + R.zona[1]) / 2 + (R.zona[1] - R.zona[0]) * 0.4;
      REGATEO.parar();
      igual(COMERCIO.precioVenta(it, "ingrid"), Math.round(v0 * 1.15), "15 % más:");
      REGATEO.cerrar();
      const w0 = REGATEO.ancho("ingrid", 1);
      ATRIBUTOS.estado().esp += 10;
      si(REGATEO.ancho("ingrid", 1) > w0, "más Espíritu, zona más ancha");
      ATRIBUTOS.estado().esp -= 10;
      INVENTARIO.cerrar();
    } },
  );
}
