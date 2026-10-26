// Los minijuegos se juegan con el mouse: sus lienzos reciben el puntero (la clase .ui lo apaga) y el verso escondido
// marca la pista en cada piedra.
{
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "minijuegos: el lienzo de cada juego recibe el mouse y un clic en una runa la pone", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      si(JUEGOS_RUNAS.empezar("mente", { semilla: 3 }), "empieza el verso");
      const cv = document.getElementById("runasLienzo"),
        r = cv.getBoundingClientRect(),
        k = Math.min(r.width / 1600, r.height / 900),
        x = r.left + (r.width - 1600 * k) / 2 + (800 - 330 + 10 + 45) * k,
        y = r.top + (r.height - 900 * k) / 2 + 805 * k;
      igual(document.elementFromPoint(x, y), cv, "lo de arriba en ese punto:");
      cv.dispatchEvent(new PointerEvent("pointerdown", { clientX: x, clientY: y, bubbles: true }));
      igual(JUEGOS_RUNAS.estado().ahora.length, 1, "runas puestas con el clic:");
      JUEGOS_RUNAS.cerrar();
      si(MINIJ.empezar("anillos", { semilla: 3 }), "empieza la cerradura");
      igual(getComputedStyle(document.getElementById("minijLienzo")).pointerEvents, "auto", "la cerradura recibe el mouse:");
      MINIJ.cerrar();
      for (const id of ["forjaLienzo", "matrazLienzo", "holmrLienzo", "cocina", "libro"]) {
        const el = document.getElementById(id);
        if (el) igual(getComputedStyle(el).pointerEvents, "auto", id + " recibe el mouse:");
      }
    } },
    { nombre: "minijuegos: el verso escondido marca cada piedra (oro en su lugar, blanco en otro)", fn: async (A, { igual }) => {
      JUEGO.empezar(9, true);
      JUEGOS_RUNAS.empezar("mente", { semilla: 3 });
      const S = JUEGOS_RUNAS.estado(),
        c = S.codigo,
        otra = [0, 1, 2, 3, 4, 5].find((i) => !c.includes(i));
      // la primera en su lugar, dos cambiadas de lugar y una que no está
      for (const i of [c[0], c[2], c[1], otra]) JUEGOS_RUNAS.tocar(i);
      igual(S.filas[0].marcas.join(","), ["oro", "blanco", "blanco", ""].join(","), "marcas:");
      JUEGOS_RUNAS.cerrar();
    } },
  );
}
