// Pruebas de los libros de Eldervald (motor/libros.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "libros: quince libros con todas sus páginas en los dos idiomas y nueve atriles junto a los caminos", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      A.enemigos.forEach((e) => (e.activo = false));
      igual(LIBROS.IDS.length, 15, "quince libros:");
      const falta = [];
      for (const id of LIBROS.IDS) {
        for (const k of ["_t", "_a"].concat(Array.from({ length: LIBROS.LISTA[id].pag }, (_, i) => "_" + (i + 1)))) if (I18N.t("lb." + id + k) === "lb." + id + k) falta.push(id + k);
      }
      igual(falta.join(","), "", "sin textos faltantes:");
      igual(LIBROS.atriles.length, 9, "nueve atriles:");
      igual(LIBROS.EN_ATRIL.length + LIBROS.DE_LIDER.length, 15, "todos tienen dónde estar:");
      const pu = A.W.LUGARES.puesto.p;
      const d0 = Math.hypot(LIBROS.atriles[0].x - pu[0], LIBROS.atriles[0].y - pu[1]);
      igual(LIBROS.atriles[0].id, "cronica", "el más cercano es la crónica:");
      si(d0 < 5000, "la crónica cerca del Puesto: " + Math.round(d0));
      LIBROS.atriles.forEach((a) => {
        si(A.W.sueloEn(a.x, a.y) === 0, a.id + " en tierra firme");
        si(A.W.CAMINOS.some((c) => A.W.distLinea(a.x, a.y, c.p) < c.w / 2 + 500), a.id + " junto a un camino");
        si(a.cosa.id === "atrilPiedra" && !a.cosa.o.leido, a.id + " sin leer");
      });
    } },
    { nombre: "libros: leer un atril, pasar las hojas, lo que deja cada clase y releer desde la Bolsa", fn: async (A, { igual, si }) => {
      const st = LIBROS.estado();
      const a = LIBROS.atriles.find((q) => q.id === "uro");
      A.jug.x = a.x;
      A.jug.y = a.y + 80;
      await esperar(80);
      si(st.vistos[LIBROS.atriles.indexOf(a)], "visto al acercarse");
      si(LIBROS.sistema.marcasMapa().some((m) => m.tipo === "libro" && m.op.nombre === I18N.t("lb.uro_t")), "en el mapa");
      const ofertas = [];
      LIBROS.sistema.cercanos((d, txt, fn) => ofertas.push([txt, fn]));
      const of = ofertas.find((o) => o[0].includes(I18N.t("lb.uro_t")));
      si(of, "se lee con E");
      const libres0 = ATRIBUTOS.libres();
      of[1]();
      igual(A.J.modo, "libro", "modo libro:");
      igual(ATRIBUTOS.libres(), libres0 + 1, "un punto de atributo:");
      si(a.cosa.o.leido, "el atril se cierra");
      si(document.querySelector("#libro .lb-portada h2").textContent === I18N.t("lb.uro_t"), "portada");
      LIBROS.pasar(1);
      si(document.querySelector("#libro .lb-izq").textContent.includes(I18N.t("lb.uro_2").slice(0, 20)), "segunda página");
      LIBROS.pasar(1);
      igual(A.J.modo, "juego", "al final se cierra:");
      // releer no vuelve a dar
      LIBROS.leer("uro");
      LIBROS.cerrar();
      igual(ATRIBUTOS.libres(), libres0 + 1, "releer no da otro:");
      // caza: +10 % contra lobos
      const lobo = { tipo: "lobo" },
        oso = { tipo: "oso" };
      igual(LIBROS.sistema.modDano(100, lobo), 100, "sin el libro:");
      LIBROS.leer("lobos");
      LIBROS.cerrar();
      igual(Math.round(LIBROS.sistema.modDano(100, lobo)), 110, "con el libro:");
      igual(LIBROS.sistema.modDano(100, oso), 100, "no contra otros:");
      // oficio de habilidad
      const ar0 = ARBOL.estado().extra || 0;
      LIBROS.leer("maestro");
      LIBROS.cerrar();
      igual((ARBOL.estado().extra || 0) - ar0, 1, "un punto de habilidad:");
      // la Bolsa
      const celda = LIBROS.sistema.celdasBolsa()[0];
      igual(celda.cant, 3, "tres leídos en la Bolsa:");
      celda.fn();
      await esperar(80);
      si(document.body.textContent.includes(I18N.t("lb.maestro_t")), "la lista para releer");
      A.cerrarMenu();
    } },
    { nombre: "libros: los líderes los llevan, la saga entera y leerlos todos", fn: async (A, { igual, si }) => {
      const st = LIBROS.estado();
      // un líder que cae suelta el próximo libro
      const e = { x: A.jug.x + 60, y: A.jug.y, tipo: "lobo", d: {}, lider: { nombre: "Grimm" } };
      const id = LIBROS.soltar(e);
      igual(id, "invierno", "el primero de los líderes:");
      igual(st.caidos.length, 1, "queda tirado:");
      const ofertas = [];
      LIBROS.sistema.cercanos((d, txt, fn) => ofertas.push([txt, fn]));
      const j = ofertas.find((o) => o[0] === I18N.t("lb.juntar"));
      si(j, "se junta con E");
      j[1]();
      igual(st.caidos.length, 0, "juntado:");
      igual(LIBROS.actual().id, "invierno", "se lee al juntarlo:");
      LIBROS.cerrar();
      // la saga entera: un punto de habilidad y dos fragmentos
      const ar0 = ARBOL.estado().extra || 0,
        f0 = PODERES.pj().frag;
      LIBROS.SAGA.forEach((k) => (LIBROS.leer(k), LIBROS.cerrar()));
      igual(st.saga, 4, "los cuatro tomos:");
      igual((ARBOL.estado().extra || 0) - ar0, 1, "un punto de habilidad por la saga:");
      igual(PODERES.pj().frag - f0, 2, "dos fragmentos:");
      // todos
      const lib0 = ATRIBUTOS.libres();
      LIBROS.IDS.forEach((k) => (LIBROS.leer(k), LIBROS.cerrar()));
      si(st.todos, "ratón de biblioteca");
      si(ATRIBUTOS.libres() > lib0, "un punto más");
      igual(LIBROS.soltar(e), null, "ya no sueltan nada:");
      si(LIBROS.sistema.diario().includes(I18N.t("lb.diario_t")), "en el diario");
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(150);
      si(LIBROS.estado().todos && LIBROS.estado().leidos.fresno, "quedó guardado");
      si(LIBROS.atriles.every((a) => a.cosa.o.leido), "los atriles quedan cerrados al cargar");
    } },
  );
}
