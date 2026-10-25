// Pruebas del menú para probar las mecánicas (interfaz/probar.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const entrada = (g, id, fam) => PROBAR.GRUPOS.find((x) => x.id === g).lista().find((e) => e.id === id && (!fam || e.fam === fam));
  const enJuego = async (A) => {
    for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "probar: el menú abre en la partida de prueba con sus cinco grupos y todo tiene su texto", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      await enJuego(A);
      PROBAR.abrir();
      igual(A.H.E.ranura, 9, "en la ranura 9:");
      igual(A.J.modo, "menu", "abre un menú:");
      const txt = document.getElementById("capaCaja").textContent;
      si(txt.includes(I18N.t("pb.titulo")) && ["oficios", "juegos", "pelea", "zonas", "ayudas"].every((g) => txt.includes(I18N.t("pb.g_" + g))), "los cinco grupos");
      const faltan = [];
      PROBAR.GRUPOS.forEach((g) =>
        g.lista().forEach((e) => {
          if (!e.si) faltan.push(g.id + "/" + e.id + " (no está)");
          const k = e.fam ? "pb.f_" + e.fam : "pb." + e.id;
          if (!e.texto && I18N.t(k) === k) faltan.push(k);
          if (I18N.t("pb." + e.id + "_d") === "pb." + e.id + "_d") faltan.push("pb." + e.id + "_d");
        })
      );
      igual(faltan.join(", "), "", "todo está y tiene texto:");
      si(PROBAR.GRUPOS.find((g) => g.id === "zonas").lista().length >= 3, "las tres mazmorras");
      A.cerrarMenu();
    } },
    { nombre: "probar: yunque, cocina, matraz, libro y los juegos de runas se abren con lo que hace falta", fn: async (A, { igual, si }) => {
      // el yunque: llama a la forja con una base y el modo
      const orig = FORJA.empezar;
      let pedido = null;
      FORJA.empezar = (...a) => (pedido = a);
      entrada("oficios", "yunque").fn();
      FORJA.empezar = orig;
      si(pedido && pedido[0] && pedido[1] === "calma", "el yunque arranca la forja");
      // la cocina: con todo para cada plato
      entrada("oficios", "cocina").fn();
      si(Object.keys(COCINA.PLATOS).every((id) => COCINA.alcanza(COCINA.PLATOS[id].pide)), "alcanza para todos los platos");
      igual(A.J.modo, "menu", "el menú de la fogata:");
      A.cerrarMenu();
      // el matraz
      entrada("oficios", "matraz").fn();
      si(MATRAZ.activo(), "el matraz");
      MATRAZ.cerrar();
      await esperar(50);
      if (window.INVENTARIO.abierta()) INVENTARIO.cerrar();
      // un libro
      entrada("oficios", "libro").fn();
      igual(A.J.modo, "libro", "el libro:");
      LIBROS.cerrar();
      // los juegos de runas, con el botón del menú como los toca el jugador
      const boton = (txt) => [...document.querySelectorAll("#capaCaja button")].find((b) => b.textContent.includes(txt));
      for (const tipo of ["parejas", "simon", "mente"]) {
        PROBAR.grupo(PROBAR.GRUPOS.find((g) => g.id === "juegos"));
        boton(I18N.t("pb." + tipo)).click();
        igual(A.J.modo, "runas", tipo + ":");
        igual(JUEGOS_RUNAS.estado().tipo, tipo, "el juego:");
        JUEGOS_RUNAS.cerrar();
      }
      igual(A.J.modo, "juego", "vuelve a jugar:");
    } },
    { nombre: "probar: la pesca lleva a la orilla y tira la línea, y la pelea lleva junto a un grupo", fn: async (A, { igual, si }) => {
      entrada("oficios", "pesca").fn();
      for (let i = 0; i < 40 && !PESCA.actual(); i++) await esperar(50);
      si(PESCA.actual(), "está pescando");
      PESCA.cerrar ? PESCA.cerrar() : PESCA.terminar();
      await esperar(100);
      A.jug.interactuando = 0;
      const e = entrada("pelea", "grupo", "lobos");
      e.fn();
      await esperar(1100);
      await enJuego(A);
      const g = HORDAS.grupos.filter((x) => x.fam === "lobos" && x.miembros.some((m) => !m.muerto)).sort((a, b) => Math.hypot(a.centro[0] - A.jug.x, a.centro[1] - A.jug.y) - Math.hypot(b.centro[0] - A.jug.x, b.centro[1] - A.jug.y))[0];
      si(g && Math.hypot(g.centro[0] - A.jug.x, g.centro[1] - A.jug.y) < 900, "junto a los lobos");
    } },
    { nombre: "probar: las ayudas dan plata, niveles y cambian la hora sin cerrar el menú", fn: async (A, { igual, si }) => {
      const pl = PODERES.pj().plata,
        n = RPG.nivel();
      entrada("ayudas", "plata").fn();
      si(PODERES.pj().plata >= pl + 1000, "+1000");
      entrada("ayudas", "niveles").fn();
      igual(RPG.nivel(), Math.min(RPG.TOPE, n + 5), "cinco niveles:");
      entrada("ayudas", "noche").fn();
      await esperar(80);
      si(A.noche() > 0.5, "de noche");
      entrada("ayudas", "dia").fn();
      await esperar(80);
      si(A.noche() < 0.2, "de día");
      PROBAR.grupo(PROBAR.GRUPOS.find((g) => g.id === "ayudas"));
      [...document.querySelectorAll("#capaCaja button")].find((b) => b.textContent.includes(I18N.t("pb.curar"))).click();
      igual(A.J.modo, "menu", "se queda en el menú:");
      si(document.getElementById("capaCaja").textContent.includes(I18N.t("pb.g_ayudas")), "en las ayudas");
      A.cerrarMenu();
    } },
  );
}
