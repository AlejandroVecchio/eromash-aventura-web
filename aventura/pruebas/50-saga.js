// Pruebas de la saga de Eromash (motor/saga.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "saga: cada entrada lee su sistema, tiene nombre y pista en los dos idiomas, y arranca casi en cero", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      const es = SAGA.entradas();
      igual(es.length, SAGA.ENTRADAS.length, "todas las entradas cargadas:");
      es.forEach((e) => {
        si(e.total > 0 && e.hecho >= 0 && e.hecho <= e.total, e.id + " " + [e.hecho, e.total]);
        si(I18N.t("sg.e_" + e.id) !== "sg.e_" + e.id && I18N.t("sg.e_" + e.id + "_d") !== "sg.e_" + e.id + "_d", "textos de " + e.id);
        si(SAGA.CAPS.includes(e.cap), "capítulo de " + e.id);
      });
      si(SAGA.porcentaje() < 10, "partida nueva, casi nada: " + SAGA.porcentaje());
    } },
    { nombre: "saga: lo hecho en otros sistemas cuenta (hólmganga, la casa) y sube el porcentaje", fn: async (A, { igual, si }) => {
      const p0 = SAGA.porcentaje();
      HOLMR.estado().vencidos = 5;
      const h = SAGA.entradas().find((e) => e.id === "holmr");
      igual(h.hecho, 5, "la hólmganga entera:");
      CASA.estado().tuya = true;
      si(SAGA.entradas().find((e) => e.id === "casa").hecho >= 1, "la casa comprada");
      si(SAGA.porcentaje() > p0, "sube " + [p0, SAGA.porcentaje()]);
    } },
    { nombre: "saga: los hitos pagan una sola vez y al 100 % dan el título; la pestaña muestra los capítulos", fn: async (A, { igual, si }) => {
      const st = SAGA.estado();
      st.hitos = {};
      st.leyenda = false;
      const pl = PODERES.pj().plata,
        fr = PODERES.pj().frag;
      // forzar el porcentaje: todas las entradas completas por un momento
      const viejas = SAGA.ENTRADAS.map((e) => e[5]);
      SAGA.ENTRADAS.forEach((e) => (e[5] = () => [1, 1]));
      igual(SAGA.porcentaje(), 100, "todo hecho:");
      SAGA.revisar(false);
      si(st.hitos[25] && st.hitos[50] && st.hitos[75] && st.hitos[100], "los cuatro hitos");
      si(PODERES.pj().plata > pl, "plata del 25 %");
      si(PODERES.pj().frag > fr, "fragmento del 50 %");
      si(st.leyenda, "Leyenda de Eldervald");
      const pl2 = PODERES.pj().plata;
      SAGA.revisar(false);
      igual(PODERES.pj().plata, pl2, "una sola vez:");
      INVENTARIO.abrir("saga");
      await esperar(150);
      igual(INVENTARIO.actual(), "saga", "pestaña:");
      igual(document.querySelectorAll("#inventario .inv-celda").length, SAGA.ENTRADAS.length, "una casilla por entrada:");
      si(document.querySelector("#inventario .sg-cabeza").textContent.includes(I18N.t("sg.leyenda")), "el título arriba");
      INVENTARIO.cerrar();
      SAGA.ENTRADAS.forEach((e, i) => (e[5] = viejas[i]));
      si(SAGA.sistema.diario().includes(I18N.t("sg.diario_t")), "en el diario");
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(200);
      si(SAGA.estado().leyenda && SAGA.estado().hitos[100], "quedó guardado");
    } },
  );
}
