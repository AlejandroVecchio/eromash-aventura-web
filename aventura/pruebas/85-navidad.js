// Pruebas del modo Navidad (motor/navidad.js, mundo/assets-navidad.js): sin ?navidad no cambia nada y sus adornos se dibujan.
(window.PRUEBAS = window.PRUEBAS || []).push({
  nombre: "navidad: apagado sin ?navidad, assets girables y adornos que se dibujan",
  async fn(A, ayuda) {
    ayuda.si(window.NAVIDAD && ASSETS.NAVIDAD, "falta NAVIDAD");
    ayuda.igual(NAVIDAD.activo, false, "el modo Navidad no se prende solo");
    ayuda.igual(NAVIDAD.PUESTAS.length, 0, "sin ?navidad no pone nada en el bosque");
    const ids = Object.keys(ASSETS.LISTA).filter((id) => ASSETS.LISTA[id].grupo === "navidad");
    ayuda.si(ids.length >= 8, "faltan assets de Navidad");
    ayuda.igual(ASSETS.sinGiro().filter((id) => ids.includes(id)).length, 0, "todo asset de Navidad se gira");
    const cv = document.createElement("canvas");
    cv.width = cv.height = 400;
    const c = cv.getContext("2d");
    for (const g of [0, 0.8]) {
      VOL.cam.g = g;
      for (const id of ids) ASSETS.dibujar(c, id, 200, 320, 1, { sem: 2 });
      for (const id of Object.keys(ASSETS.NAVIDAD.ADORNA)) ASSETS.NAVIDAD.adornar(c, id, 200, 320, 1, { sem: 3, todo: true });
      for (const v of ["S", "E", "N"]) ASSETS.NAVIDAD.gorro(c, v);
    }
    VOL.cam.g = 0;
    for (const id of ids) ayuda.si(I18N.t("as." + id) !== "as." + id, "falta el nombre de " + id);
  },
});
