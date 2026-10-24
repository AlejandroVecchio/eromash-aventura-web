// ---------- controles (módulo CONTROLES) ----------
// El juego pregunta siempre por acciones, nunca por teclas (docs/rumbo.md de la arena): cambiar un control se hace
// solo acá. Teclado y mouse, y mando con los mismos botones que la arena: ✕ salta, ○ interactúa, □ ataca.
window.CONTROLES = (function () {
  "use strict";
  const TECLAS = {
    arriba: ["KeyW", "ArrowUp"],
    abajo: ["KeyS", "ArrowDown"],
    izquierda: ["KeyA", "ArrowLeft"],
    derecha: ["KeyD", "ArrowRight"],
    correr: ["ShiftLeft", "ShiftRight"],
    saltar: ["Space"],
    atacar: ["KeyK"],
    esquivar: ["KeyC", "AltLeft"],
    interactuar: ["KeyE", "KeyF"],
    lente: ["KeyR"],
    diario: ["KeyJ", "Tab"],
    pausa: ["Escape", "KeyP"],
    seguir: ["Enter", "Space", "KeyE", "KeyF"],
  };
  // botones estándar del mando (Gamepad API): 0 ✕/A · 1 ○/B · 2 □/X · 3 △/Y · 4 L1 · 5 R1 · 6 L2 · 7 R2 · 8 Select · 9 Start · 10 L3
  const BOTONES = {
    saltar: [0],
    interactuar: [1],
    atacar: [2, 7],
    lente: [3],
    esquivar: [4, 5],
    correr: [10, 6],
    diario: [8],
    pausa: [9],
    seguir: [0, 1],
    arriba: [12],
    abajo: [13],
    izquierda: [14],
    derecha: [15],
  };
  const GLIFOS_MANDO = { saltar: "✕", interactuar: "○", atacar: "□", lente: "△", esquivar: "L1", correr: "L3", diario: "Select", pausa: "Start", seguir: "✕" };
  const GLIFOS_TECLADO = { saltar: "@ui.tecla.espacio", interactuar: "E", atacar: "@ui.tecla.clic", lente: "R", esquivar: "C", correr: "Shift", diario: "J", pausa: "Esc", seguir: "E" };

  const abajo = new Set();
  let antes = {},
    ahora = {},
    mouse = false,
    usandoMando = false,
    eje = { x: 0, y: 0 };
  addEventListener("keydown", (e) => {
    if (e.code === "Tab") e.preventDefault();
    abajo.add(e.code);
    usandoMando = false;
  });
  addEventListener("keyup", (e) => abajo.delete(e.code));
  addEventListener("blur", () => {
    abajo.clear();
    mouse = false;
  });
  // pointer events: el mismo código sirve para mouse y, más adelante, para el toque (rumbo: celular a futuro)
  addEventListener("pointerdown", (e) => {
    if (e.target && e.target.closest && e.target.closest("button, .ui")) return;
    if (e.button === 0) mouse = true;
    usandoMando = false;
  });
  addEventListener("pointerup", () => (mouse = false));

  function leerMando() {
    const ps = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const g of ps) if (g && g.connected) return g;
    return null;
  }
  // se llama una vez por cuadro, antes de preguntar
  function actualizar() {
    antes = ahora;
    ahora = {};
    const g = leerMando();
    for (const a in TECLAS) if (TECLAS[a].some((k) => abajo.has(k))) ahora[a] = true;
    if (mouse) ahora.atacar = true;
    let x = (ahora.derecha ? 1 : 0) - (ahora.izquierda ? 1 : 0),
      y = (ahora.abajo ? 1 : 0) - (ahora.arriba ? 1 : 0);
    if (g) {
      for (const a in BOTONES)
        if (BOTONES[a].some((b) => g.buttons[b] && (g.buttons[b].pressed || g.buttons[b].value > 0.5))) {
          ahora[a] = true;
          usandoMando = true;
        }
      const ax = g.axes[0] || 0,
        ay = g.axes[1] || 0;
      if (Math.hypot(ax, ay) > 0.2) {
        x = ax;
        y = ay;
        usandoMando = true;
      }
      if (g.buttons[12] && g.buttons[12].pressed) y = -1;
      if (g.buttons[13] && g.buttons[13].pressed) y = 1;
      if (g.buttons[14] && g.buttons[14].pressed) x = -1;
      if (g.buttons[15] && g.buttons[15].pressed) x = 1;
    }
    const l = Math.hypot(x, y);
    eje = l > 1 ? { x: x / l, y: y / l } : { x, y };
  }
  return {
    actualizar,
    eje: () => eje,
    pulsado: (a) => !!ahora[a],
    recien: (a) => !!ahora[a] && !antes[a],
    soltar: () => {
      // al cerrar un diálogo o menú: lo apretado no cuenta como apretado de nuevo
      antes = Object.assign({}, ahora, antes);
      for (const a in ahora) antes[a] = true;
    },
    glifo: (a) => {
      const g = (usandoMando ? GLIFOS_MANDO[a] : GLIFOS_TECLADO[a]) || a;
      return g[0] === "@" ? I18N.t(g.slice(1)) : g;
    },
    mando: () => usandoMando,
  };
})();
