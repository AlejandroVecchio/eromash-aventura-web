// Pruebas del comercio con Ingrid y Kolbrun (motor/comercio.js).
// (en un bloque: las pruebas comparten la página)
{
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "comercio: cada mercader tiene lo suyo y cambia con el día", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const si1 = COMERCIO.stock("ingrid");
      si(si1.piezas.length === 9 && si1.mats.hierro > 0, "Ingrid vende piezas y hierro");
      si(si1.piezas.every((it) => !["amuleto", "anillo"].includes(OBJETOS.BASES[it.b].slot)), "Ingrid no vende joyas");
      const sk = COMERCIO.stock("kolbrun");
      si(sk.piezas.some((it) => ["amuleto", "anillo"].includes(OBJETOS.BASES[it.b].slot)), "Kolbrun vende joyas");
      igual(sk.envueltas.length, 5, "cinco envueltas:");
      si(COMERCIO.kolbrun() && COMERCIO.posIngrid(), "los dos están en el bosque");
      igual(ASSETS.sinGiro().filter((k) => /Kolbrun/.test(k)).length, 0, "el puesto aguanta el giro:");
      const u0 = si1.piezas[0].u;
      A.H.E.tiempo += LUZ.DIA;
      si(COMERCIO.stock("ingrid").piezas[0].u !== u0, "al otro día trae otra cosa");
    } },
    { nombre: "comercio: comprar, vender y recomprar mueven la plata justa", fn: async (A, { igual, si }) => {
      PODERES.pj().plata = 5000;
      const s = COMERCIO.stock("ingrid"),
        it = s.piezas[0],
        p = COMERCIO.precioCompra(it, "ingrid"),
        n0 = BOTIN.estado().bolsa.length;
      igual(p, Math.round(OBJETOS.valor(it) * COMERCIO.COMPRA * (1 - SECUNDARIAS.descuento())), "precio de compra:");
      si(COMERCIO.comprar("ingrid", it), "compró");
      igual(PODERES.pj().plata, 5000 - p, "pagó:");
      igual(BOTIN.estado().bolsa.length, n0 + 1, "entró en la bolsa:");
      si(!s.piezas.includes(it), "ya no está a la venta");
      const v = COMERCIO.precioVenta(it, "ingrid");
      si(v < p, "se vende más barato de lo que se compra");
      const antes = PODERES.pj().plata;
      if (it.r >= 2) COMERCIO.vender("ingrid", it);
      COMERCIO.vender("ingrid", it);
      igual(PODERES.pj().plata - antes, v, "cobró la venta:");
      igual(COMERCIO.estado().recompra[0], it, "queda para recomprar:");
      si(COMERCIO.recomprar(it), "recompró");
      igual(PODERES.pj().plata, antes, "al mismo precio:");
      const h = MATERIALES.cuantos("hierro");
      COMERCIO.comprarMat("ingrid", "hierro");
      igual(MATERIALES.cuantos("hierro"), h + 1, "compró hierro:");
      PODERES.pj().plata = 0;
      si(!COMERCIO.comprar("ingrid", s.piezas[0]), "sin plata no compra");
    } },
    { nombre: "comercio: la pieza envuelta trae cualquier cosa de esa casilla", fn: async (A, { igual, si }) => {
      PODERES.pj().plata = 99999;
      const it = COMERCIO.comprarEnvuelta("kolbrun", "anillo");
      si(it && OBJETOS.BASES[it.b].slot === "anillo", "un anillo");
      si(!COMERCIO.stock("kolbrun").envueltas.includes("anillo"), "se acabó el anillo envuelto");
      // con muchas, sale de todo (la suerte de Kolbrun)
      const r = [0, 0, 0, 0];
      for (let i = 0; i < 300; i++) r[OBJETOS.generar({ n: 5, slot: "arma", hallazgo: 2.2 }).r]++;
      si(r[2] > 0 && r[0] < 300, "rarezas variadas: " + r.join("/"));
    } },
    { nombre: "comercio: la pestaña aparece solo mientras se comercia", fn: async (A, { igual, si }) => {
      COMERCIO.abrir("kolbrun");
      si(INVENTARIO.abierta() && INVENTARIO.actual() === "tienda", "abrió la pestaña del mercader");
      si([...document.querySelectorAll(".inv-tab")].some((b) => b.textContent === I18N.t("av.nombre_kolbrun")), "con su nombre");
      si(document.querySelectorAll(".cm-envuelta").length > 0, "muestra las envueltas");
      INVENTARIO.cerrar();
      await new Promise((r) => setTimeout(r, 200));
      INVENTARIO.abrir("equipo");
      si(![...document.querySelectorAll(".inv-tab")].some((b) => b.textContent === I18N.t("av.nombre_kolbrun")), "cerrada, la pestaña no está");
      INVENTARIO.cerrar();
    } },
    { nombre: "comercio: lo comprado del día y la recompra se guardan", fn: async (A, { igual }) => {
      const n = COMERCIO.stock("ingrid").piezas.length,
        r = COMERCIO.estado().recompra.length;
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      igual(COMERCIO.stock("ingrid").piezas.length, n, "el stock sigue:");
      igual(COMERCIO.estado().recompra.length, r, "la recompra sigue:");
    } },
  );
}
