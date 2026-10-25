// Prueba de la charla que se abre desde un menú (juego.js, dialogoLibre): queda adelante y al terminar vuelve el menú.
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push({ nombre: "charla desde un menú: el menú se esconde y vuelve al terminar", fn: async (A, { igual, si }) => {
    if (A.J.modo !== "juego") JUEGO.empezar(9, true);
    for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
    const capa = document.getElementById("capa");
    A.menu("<h2>prueba</h2>", [{ texto: "charla", fn: () => A.dialogoLibre([["ulf", "pj.ulf_0"], ["ulf", "pj.ulf_1"]]) }, { texto: "cerrar", fn: () => A.cerrarMenu() }]);
    document.querySelector("#capaCaja .boton").click();
    igual(A.J.modo, "dialogo", "charla:");
    si(capa.classList.contains("oculto"), "el menú no tapa la charla");
    for (let i = 0; i < 5 && A.J.modo === "dialogo"; i++) A.seguirDialogo();
    igual(A.J.modo, "menu", "vuelve el menú:");
    si(!capa.classList.contains("oculto") && document.querySelector("#capaCaja h2").textContent === "prueba", "el mismo menú a la vista");
    // con alFin, el que la abrió decide qué sigue
    let fin = 0;
    A.menu("<h2>prueba</h2>", [{ texto: "charla", fn: () => A.dialogoLibre([["ulf", "pj.ulf_0"]], () => fin++) }]);
    document.querySelector("#capaCaja .boton").click();
    A.seguirDialogo();
    igual(fin, 1, "alFin:");
    igual(A.J.modo, "juego", "sin menú de vuelta:");
  } });
}
