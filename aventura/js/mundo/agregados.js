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
