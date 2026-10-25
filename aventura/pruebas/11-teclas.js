// Pruebas de las teclas propias y del orden de los carriles de la forja (A S D W).
{
  const tecla = (code, abajo) => dispatchEvent(new KeyboardEvent(abajo ? "keydown" : "keyup", { code }));
  const apretar = (code) => {
    tecla(code, true);
    CONTROLES.actualizar();
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "teclas: los carriles de la forja van A S D W y cada tecla se puede cambiar", fn: async (A, { igual, si }) => {
      CONTROLES.restaurar();
      apretar("KeyA");
      igual(["carril1", "carril2", "carril3", "carril4"].map((a) => CONTROLES.teclaDe(a)).join(" "), "A S D W", "el orden:");
      tecla("KeyA", false);
      apretar("KeyD");
      si(CONTROLES.pulsado("carril3") && CONTROLES.pulsado("derecha"), "D toca el carril 3 y también mueve a la derecha");
      tecla("KeyD", false);
      CONTROLES.asignar("carril1", "KeyJ");
      apretar("KeyJ");
      si(CONTROLES.pulsado("carril1"), "J es el carril 1");
      tecla("KeyJ", false);
      apretar("KeyA");
      si(!CONTROLES.pulsado("carril1") && CONTROLES.pulsado("izquierda"), "A ya no es el carril 1, pero sigue moviendo");
      tecla("KeyA", false);
      apretar("ArrowLeft");
      si(CONTROLES.pulsado("carril1"), "la flecha sigue de repuesto");
      tecla("ArrowLeft", false);
      igual(CONTROLES.glifo("carril1"), "J", "la forja muestra J:");
      CONTROLES.asignar("saltar", "KeyE");
      apretar("KeyE");
      si(CONTROLES.pulsado("saltar") && !CONTROLES.pulsado("interactuar"), "E pasa a saltar y deja de usar");
      tecla("KeyE", false);
      apretar("KeyF");
      si(CONTROLES.pulsado("interactuar"), "usar sigue con F");
      tecla("KeyF", false);
      si(JSON.parse(localStorage.getItem("eromash.aventura.teclas")).carril1 === "KeyJ", "se guarda en el navegador");
      CONTROLES.restaurar();
      igual(CONTROLES.teclaDe("carril1") + CONTROLES.teclaDe("saltar"), "A" + I18N.t("ui.tecla.espacio"), "vuelven las de siempre:");
      CONTROLES.actualizar();
    } },
    { nombre: "teclas: Opciones lista las acciones y la tecla nueva se aprieta", fn: async (A, { igual, si }) => {
      let volvio = false;
      OPCIONES.teclas(() => (volvio = true), "forja");
      igual(document.querySelectorAll("#capaCaja .boton").length, 6, "cuatro carriles, restaurar y volver:");
      document.querySelectorAll("#capaCaja .boton")[3].click();
      si(CONTROLES.capturando(), "espera la tecla");
      tecla("KeyL", true);
      tecla("KeyL", false);
      igual(CONTROLES.teclaDe("carril4"), "L", "el carril 4 queda en L:");
      document.querySelectorAll("#capaCaja .boton")[5].click();
      si(volvio, "Volver vuelve");
      CONTROLES.restaurar();
      HUD.cerrar();
    } },
  );
}
