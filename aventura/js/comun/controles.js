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
    bloquear: ["KeyG", "ControlLeft"],
    interactuar: ["KeyE", "KeyF"],
    lente: ["KeyR"],
    // la barra de abajo: Q (R1) usa la casilla elegida, T (R3) elige la siguiente y 1 a 6 usan cada una directo
    runa: ["KeyQ"],
    cambiarRuna: ["KeyT"],
    ranura1: ["Digit1", "Numpad1"],
    ranura2: ["Digit2", "Numpad2"],
    ranura3: ["Digit3", "Numpad3"],
    ranura4: ["Digit4", "Numpad4"],
    ranura5: ["Digit5", "Numpad5"],
    ranura6: ["Digit6", "Numpad6"],
    mapa: ["KeyM"],
    misiones: ["KeyL"],
    diario: ["KeyJ", "Tab"],
    inventario: ["KeyI", "KeyB"],
    personaje: ["KeyU"],
    talentos: ["KeyH"],
    // la Furia, el frasco y la poción elegida: con teclado van en una casilla de la barra (1 a 6); con mando, sus COMBOS
    hab1: [],
    hab2: [],
    hab3: [],
    frasco: [],
    pocion: [],
    signo: ["KeyY"],
    cambiarSigno: ["KeyN"],
    pausa: ["Escape", "KeyP"],
    acercar: ["Equal", "NumpadAdd"],
    alejar: ["Minus", "NumpadSubtract"],
    seguir: ["Enter", "Space", "KeyE", "KeyF"],
    // la cámara de Eikholt en 3D: girar y cambiar a la vista baja
    camaraIzq: ["KeyZ"],
    camaraDer: ["KeyX"],
    camara: ["KeyV"],
  };
  // botones estándar del mando (Gamepad API): 0 ✕/A · 1 ○/B · 2 □/X · 3 △/Y · 4 L1 · 5 R1 · 6 L2 · 7 R2 · 8 Select · 9 Start · 10 L3
// · 11 R3 · 16 PS · 17 panel táctil
  const BOTONES = {
    saltar: [0],
    interactuar: [1],
    atacar: [2, 7],
    lente: [3],
    esquivar: [4],
    runa: [5],
    cambiarRuna: [11],
    mapa: [16, 17],
    correr: [10],
    bloquear: [6],
    inventario: [8],
    pausa: [9],
    seguir: [0, 1],
    arriba: [12],
    abajo: [13],
    izquierda: [14],
    derecha: [15],
    camara: [11],
  };
  // combinaciones del mando: L2 (el escudo) + □ △ ○ son las habilidades activas L2 + ✕ el frasco y L2 + R1 la poción elegida; mientras se aprietan juntos, esos
  // botones no hacen lo suyo
  const COMBOS = { hab1: [6, 2], hab2: [6, 3], hab3: [6, 1], frasco: [6, 0], pocion: [6, 5], signo: [6, 4], cambiarSigno: [6, 15] };
  const GLIFOS_MANDO = { saltar: "✕", interactuar: "○", atacar: "□", lente: "△", esquivar: "L1", bloquear: "L2", correr: "L3", izquierda: "◀", abajo: "▼", arriba: "▲", derecha: "▶", diario: "Select", inventario: "Select", pausa: "Start", seguir: "✕", runa: "R1", cambiarRuna: "R3", mapa: "@ui.tecla.panel", camaraIzq: "RS", camaraDer: "RS", camara: "R3", hab1: "L2+□", hab2: "L2+△", hab3: "L2+○", frasco: "L2+✕", pocion: "L2+R1", signo: "L2+L1", cambiarSigno: "L2+▶" };
  const GLIFOS_TECLADO = { saltar: "@ui.tecla.espacio", interactuar: "E", atacar: "@ui.tecla.clic", lente: "R", esquivar: "C", bloquear: "G", correr: "Shift", izquierda: "A", abajo: "S", arriba: "W", derecha: "D", diario: "J", inventario: "I", pausa: "Esc", seguir: "E", runa: "Q", cambiarRuna: "T", mapa: "M", misiones: "L", personaje: "U", talentos: "H", hab1: "1", hab2: "2", hab3: "3", frasco: "4", pocion: "5", signo: "Y", cambiarSigno: "N", ranura1: "1", ranura2: "2", ranura3: "3", ranura4: "4", ranura5: "5", ranura6: "6", camaraIzq: "Z", camaraDer: "X", camara: "V", acercar: "+", alejar: "−" };

  const abajo = new Set();
  let antes = {},
    ahora = {},
    mouse = false,
    mouseDer = false,
    usandoMando = false,
    eje = { x: 0, y: 0 },
    ejeDer = { x: 0, y: 0 };
  addEventListener("keydown", (e) => {
    if (e.target && e.target.tagName === "INPUT") return;
    if (e.code === "Tab") e.preventDefault();
    abajo.add(e.code);
    usandoMando = false;
  });
  addEventListener("keyup", (e) => abajo.delete(e.code));
  addEventListener("blur", () => {
    abajo.clear();
    mouse = false;
    mouseDer = false;
  });
  // pointer events: el mismo código sirve para mouse y, más adelante, para el toque (rumbo: celular a futuro)
  addEventListener("pointerdown", (e) => {
    if (e.target && e.target.closest && e.target.closest("button, .ui")) return;
    if (e.button === 0) mouse = true;
    usandoMando = false;
  });
  addEventListener("pointerup", (e) => {
    if (e.button === 2) mouseDer = false;
    else mouse = false;
  });
  // el clic derecho también levanta el escudo (como atajo: G o L2 hacen lo mismo)
  addEventListener("pointerdown", (e) => {
    if (e.button === 2 && !(e.target && e.target.closest && e.target.closest("button, .ui"))) mouseDer = true;
  });
  addEventListener("contextmenu", (e) => {
    if (e.target && e.target.tagName === "CANVAS") e.preventDefault();
  });

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
    if (mouseDer) ahora.bloquear = true;
    let x = (ahora.derecha ? 1 : 0) - (ahora.izquierda ? 1 : 0),
      y = (ahora.abajo ? 1 : 0) - (ahora.arriba ? 1 : 0);
    if (g) {
      for (const a in BOTONES)
        if (BOTONES[a].some((b) => g.buttons[b] && (g.buttons[b].pressed || g.buttons[b].value > 0.5))) {
          ahora[a] = true;
          usandoMando = true;
        }
      const ap = (b) => g.buttons[b] && (g.buttons[b].pressed || g.buttons[b].value > 0.5);
      for (const a in COMBOS)
        if (COMBOS[a].every(ap)) {
          ahora[a] = true;
          for (const o in BOTONES) if (o !== "bloquear" && BOTONES[o].includes(COMBOS[a][1]) && !(TECLAS[o] || []).some((k) => abajo.has(k))) delete ahora[o];
        }
      const rx = g.axes[2] || 0,
        ry = g.axes[3] || 0;
      ejeDer = Math.hypot(rx, ry) > 0.2 ? { x: rx, y: ry } : { x: 0, y: 0 };
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
    ejeDer: () => ejeDer,
    pulsado: (a) => !!ahora[a],
    recien: (a) => !!ahora[a] && !antes[a],
    soltar: () => {
      // al cerrar un diálogo o menú: lo apretado no cuenta como apretado de nuevo
      antes = Object.assign({}, ahora, antes);
      for (const a in ahora) antes[a] = true;
    },
    glifo: (a) => {
      const g = (usandoMando ? GLIFOS_MANDO[a] : GLIFOS_TECLADO[a]) || (usandoMando ? "" : a);
      return g[0] === "@" ? I18N.t(g.slice(1)) : g;
    },
    mando: () => usandoMando,
  };
})();
