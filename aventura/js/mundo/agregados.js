// Lo que se agregó o se sacó del mundo con el editor de Eldervald (editor.html). Este archivo lo escribe el editor
// con «Descargar agregados.js»: se guarda acá, en aventura/js/mundo/, y el mundo lo aplica al armarse.
window.AGREGADOS = {
  poner: [],
  quitar: [],
  mover: [],
  quitarDeco: [],
  caminos: [],
  quitarCaminos: [],
  estiloCaminos: [],
  rios: [],
  lagos: [],
  quitarRios: [],
  quitarLagos: [],
  // los interiores cambiados con el editor (pestaña Interiores)
  cuartos: {},
  // casas de varios cuartos (generador de casas): cuartos, uniones y pasadizos; cada cuarto es la plantilla plano:<id>:<n>
  casas: {},
  // regiones con nombre (el juego muestra el nombre al entrar) y piezas guardadas del editor
  regiones: [],
  piezas: {},
  // texturas hechas en el editor (generador de texturas): cada una es un asset tx_<id> (parche) o txb_<id> (bloque)
  texturas: {},
  // notas para Claude: qué hacer en ese lugar (el juego no las usa)
  notas: [],
};
// ?borrador=1: el juego usa lo que está armado en el editor de este navegador, sin descargar nada
try {
  if (/[?&]borrador=1/.test(location.search)) {
    const b = JSON.parse(localStorage.getItem("eromash-aventura-editor") || "null");
    if (b && b.poner) window.AGREGADOS = b;
  }
} catch (e) {}
