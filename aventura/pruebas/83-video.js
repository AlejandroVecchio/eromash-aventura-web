// Pruebas del modo cámara para grabar videos (motor/video.js): sin ?video no cambia nada y encuentra las escenas.
(window.PRUEBAS = window.PRUEBAS || []).push({
  nombre: "video: apagado sin ?video y escenas de Probar mecánicas",
  async fn(A, ayuda) {
    ayuda.si(window.VIDEO, "falta VIDEO");
    ayuda.igual(VIDEO.activo, false, "el modo cámara no se prende solo");
    ayuda.si(!document.body.classList.contains("modo-video"), "la interfaz tiene que verse");
    for (const id of ["muneco", "jotunn", "grupo:lobos", "gesto:tesoro"]) ayuda.si(VIDEO.buscarEscena(id), "no encuentra la escena " + id);
    ayuda.igual(VIDEO.buscarEscena("no-existe"), null, "una escena que no existe");
  },
});
