// Pruebas del mapa de las mazmorras (interfaz/mapa-mazmorra.js): se arma al recorrer, con su niebla, y se guarda.
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const enJuego = async (A) => {
    for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
  };
  // pone a Eromash en una celda de la mazmorra y deja que el sistema la mire
  // (ZONAS mira dónde está en su paso de cada cuadro)
  const pisar = async (A, Z, cx, cy) => {
    const C = (Z.x1 - Z.x0) / Z.d.ancho;
    A.jug.x = Z.x0 + (cx + 0.5) * C;
    A.jug.y = Z.y0 + (cy + 0.5) * C;
    for (let i = 0; i < 20 && ZONAS.aqui() !== Z; i++) await esperar(20);
    await esperar(40);
    MAPA_MAZMORRA.recorrer();
  };
  const nivel = (Z, cx, cy) => MAPA_MAZMORRA.de(Z.id).v[cy * Z.d.ancho + cx];
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "mapa de mazmorra: arranca en niebla, la sala de la entrada se ve entera y el pasillo de a pedazos", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      await enJuego(A);
      const Z = ZONAS.zonas().find((z) => z.id === "cripta");
      A.enemigos.forEach((e) => e.zona === Z.id && (e.activo = false));
      igual(MAPA_MAZMORRA.de(Z.id).explorado, 0, "sin entrar, todo en niebla:");
      const ent = Z.d.salas.find((s) => s.tipo === "entrada");
      await pisar(A, Z, ent.x + 1, ent.y + 1);
      igual(ZONAS.aqui(), Z, "adentro:");
      let entera = true;
      for (let y = ent.y; y < ent.y + ent.h; y++) for (let x = ent.x; x < ent.x + ent.w; x++) entera = entera && nivel(Z, x, y) === 2;
      si(entera, "la sala de la entrada, entera");
      const lejos = Z.d.salas.find((s) => s.tipo === "jefe");
      igual(nivel(Z, lejos.x + 1, lejos.y + 1), 0, "la del jefe sigue en niebla:");
      // un pasillo: lo de al lado queda pisado, lo de más lejos entrevisto, lo del fondo sin ver
      const pa = Z.d.pasillos.find((p) => Math.hypot(p.p[0][0] - p.p[p.p.length - 1][0], p.p[0][1] - p.p[p.p.length - 1][1]) > 6) || Z.d.pasillos[0];
      const [cx, cy] = pa.p[1];
      const antes = MAPA_MAZMORRA.de(Z.id).explorado;
      await pisar(A, Z, cx, cy);
      if (Z.sala[cy * Z.d.ancho + cx] < 0) igual(nivel(Z, cx, cy), 2, "donde pisa, entero:");
      si(MAPA_MAZMORRA.de(Z.id).explorado > antes, "se suma al mapa");
      let tenue = 0;
      MAPA_MAZMORRA.de(Z.id).v.forEach((n) => (tenue += n === 1));
      si(tenue > 0, "lo que alcanza la lámpara queda tenue");
    } },
    { nombre: "mapa de mazmorra: las salas oscuras se ven al encender un brasero; el minimapa y el mapa grande son los suyos", fn: async (A, { igual, si }) => {
      const Z = ZONAS.zonas().find((z) => z.d.tipo === "mazmorra" && z.d.salas.some((s) => s.tipo === "oscura"));
      si(Z, "hay una mazmorra con sala oscura");
      A.enemigos.forEach((e) => e.zona === Z.id && (e.activo = false));
      const si0 = Z.d.salas.findIndex((s) => s.tipo === "oscura"),
        s = Z.d.salas[si0];
      await pisar(A, Z, s.x, s.y);
      igual(nivel(Z, s.x + s.w - 1, s.y + s.h - 1), 0, "a oscuras, la otra punta no se ve:");
      Z.fuegos.filter((f) => f.sala === si0).forEach((f) => (ZONAS.estado().fuegos[f.k] = true));
      MAPA_MAZMORRA.recorrer();
      igual(nivel(Z, s.x + s.w - 1, s.y + s.h - 1), 2, "con el brasero, la sala entera:");
      // el minimapa es el de la mazmorra
      const cv = document.createElement("canvas");
      cv.width = cv.height = 190;
      si(MAPA_MAZMORRA.mini(cv.getContext("2d"), 190), "el minimapa lo pinta la mazmorra");
      igual(MAPA.lugarAqui(), Z.d.nombre, "con su nombre:");
      // el mapa grande
      MAPA.abrir();
      igual(A.J.modo, "menu", "abre:");
      const mz = document.getElementById("mapaZona");
      si(mz && mz.width > 100 && !document.getElementById("mapaLienzo"), "el de la mazmorra, no el del bosque");
      si(document.getElementById("capaCaja").textContent.includes(Z.d.nombre), "con su nombre");
      A.cerrarMenu();
      // fuera de las mazmorras, nada de esto
      A.jug.x = A.W.LUGARES.puesto.p[0];
      A.jug.y = A.W.LUGARES.puesto.p[1];
      for (let i = 0; i < 20 && ZONAS.aqui(); i++) await esperar(20);
      si(!MAPA_MAZMORRA.mini(cv.getContext("2d"), 190), "en el bosque, el minimapa de siempre");
    } },
    { nombre: "mapa de mazmorra: recorrerla entera paga una vez y lo visto queda guardado", fn: async (A, { igual, si }) => {
      const Z = ZONAS.zonas().find((z) => z.id === "mina");
      A.enemigos.forEach((e) => e.zona === Z.id && (e.activo = false));
      Z.fuegos.forEach((f) => (ZONAS.estado().fuegos[f.k] = true));
      const pl = PODERES.pj().plata;
      for (let y = 0; y < Z.d.alto; y++) for (let x = 0; x < Z.d.ancho; x++) if (Z.g[y * Z.d.ancho + x] && !nivel(Z, x, y)) await pisar(A, Z, x, y);
      igual(MAPA_MAZMORRA.de(Z.id).explorado, 1, "toda:");
      const pago = PODERES.pj().plata - pl;
      si(pago > 0, "pagó");
      await pisar(A, Z, Z.d.salas[0].x, Z.d.salas[0].y);
      igual(PODERES.pj().plata - pl, pago, "una sola vez:");
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await enJuego(A);
      igual(MAPA_MAZMORRA.de(Z.id).explorado, 1, "al cargar, sigue recorrida:");
      igual(MAPA_MAZMORRA.de("cripta").explorado > 0, true, "y lo de la cripta también:");
    } },
  );
}
