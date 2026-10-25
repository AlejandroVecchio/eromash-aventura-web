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
    pausa: ["Escape", "KeyP"],
    acercar: ["Equal", "NumpadAdd"],
    alejar: ["Minus", "NumpadSubtract"],
    seguir: ["Enter", "Space", "KeyE", "KeyF"],
    // la cámara de Eikholt en 3D: girar y cambiar a la vista baja
    camaraIzq: ["KeyZ"],
    camaraDer: ["KeyX"],
    camara: ["KeyV"],
    // los cuatro carriles de la forja de Ása, de izquierda a derecha: A S D W
    carril1: ["KeyA", "ArrowLeft"],
    carril2: ["KeyS", "ArrowDown"],
    carril3: ["KeyD", "ArrowRight"],
    carril4: ["KeyW", "ArrowUp"],
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
    carril1: [14],
    carril2: [13],
    carril3: [15],
    carril4: [12],
  };
  // combinaciones del mando: L2 (el escudo) + □ △ ○ son las habilidades activas L2 + ✕ el frasco y L2 + R1 la poción elegida; mientras se aprietan juntos, esos
  // botones no hacen lo suyo
  const COMBOS = { hab1: [6, 2], hab2: [6, 3], hab3: [6, 1], frasco: [6, 0], pocion: [6, 5] };
  const GLIFOS_MANDO = { saltar: "✕", interactuar: "○", atacar: "□", lente: "△", esquivar: "L1", bloquear: "L2", correr: "L3", izquierda: "◀", abajo: "▼", arriba: "▲", derecha: "▶", diario: "Select", inventario: "Select", pausa: "Start", seguir: "✕", runa: "R1", cambiarRuna: "R3", mapa: "@ui.tecla.panel", camaraIzq: "RS", camaraDer: "RS", camara: "R3", hab1: "L2+□", hab2: "L2+△", hab3: "L2+○", frasco: "L2+✕", pocion: "L2+R1", carril1: "◀", carril2: "▼", carril3: "▶", carril4: "▲" };
  const GLIFOS_TECLADO = { saltar: "@ui.tecla.espacio", interactuar: "E", atacar: "@ui.tecla.clic", lente: "R", esquivar: "C", bloquear: "G", correr: "Shift", izquierda: "A", abajo: "S", arriba: "W", derecha: "D", diario: "J", inventario: "I", pausa: "Esc", seguir: "E", runa: "Q", cambiarRuna: "T", mapa: "M", misiones: "L", personaje: "U", talentos: "H", hab1: "1", hab2: "2", hab3: "3", frasco: "4", pocion: "5", ranura1: "1", ranura2: "2", ranura3: "3", ranura4: "4", ranura5: "5", ranura6: "6", camaraIzq: "Z", camaraDer: "X", camara: "V", acercar: "+", alejar: "−" };

  // ---------- teclas propias ----------
  // El jugador puede cambiar la tecla principal de cada acción (Opciones → Teclas, y la forja desde su menú). Se
  // guarda en este navegador como { accion: code }; las teclas de repuesto (flechas, Ctrl, Alt…) siguen andando. Una
  // tecla nueva se saca de las otras acciones de su grupo: los carriles de la forja son un grupo aparte, así A S D W
  // pueden mover a Eromash y tocar los carriles a la vez.
  const GRUPOS = {
    juego: ["arriba", "abajo", "izquierda", "derecha", "correr", "saltar", "atacar", "esquivar", "bloquear", "interactuar", "lente", "runa", "cambiarRuna", "mapa", "misiones", "diario", "inventario", "personaje"],
    forja: ["carril1", "carril2", "carril3", "carril4"],
  };
  const CLAVE_TECLAS = "eromash.aventura.teclas";
  const BASE = {};
  for (const a in TECLAS) BASE[a] = TECLAS[a].slice();
  let propias = {};
  try {
    propias = JSON.parse(localStorage.getItem(CLAVE_TECLAS) || "{}") || {};
  } catch (e) {}
  const grupoDe = (a) => (GRUPOS.forja.includes(a) ? "forja" : "juego");
  function armarTeclas() {
    for (const a in BASE) {
      const mia = propias[a];
      let l = mia ? [mia].concat(BASE[a].slice(1)) : BASE[a].slice();
      // lo que el jugador le dio a otra acción del mismo grupo deja de valer acá (menos en seguir, que es de los menús)
      if (a !== "seguir") for (const b in propias) if (b !== a && grupoDe(b) === grupoDe(a)) l = l.filter((k) => k !== propias[b]);
      TECLAS[a] = l;
    }
  }
  armarTeclas();
  function asignar(a, code) {
    if (!BASE[a] || !code) return;
    if (code === BASE[a][0]) delete propias[a];
    else propias[a] = code;
    armarTeclas();
    try {
      localStorage.setItem(CLAVE_TECLAS, JSON.stringify(propias));
    } catch (e) {}
  }
  function restaurar(grupo) {
    for (const a in propias) if (!grupo || grupoDe(a) === grupo) delete propias[a];
    armarTeclas();
    try {
      localStorage.setItem(CLAVE_TECLAS, JSON.stringify(propias));
    } catch (e) {}
  }
  const FLECHAS = { ArrowLeft: "←", ArrowDown: "↓", ArrowRight: "→", ArrowUp: "↑" };
  const NOMBRES = { ShiftLeft: "Shift", ShiftRight: "Shift", ControlLeft: "Ctrl", ControlRight: "Ctrl", AltLeft: "Alt", AltRight: "Alt", Escape: "Esc", Enter: "Enter", Tab: "Tab", Backspace: "⌫", Minus: "−", Equal: "+", Comma: ",", Period: ".", Semicolon: "Ñ", Slash: "/", Quote: "'", BracketLeft: "[", BracketRight: "]", Backslash: "\\", Backquote: "º" };
  function nombreTecla(code) {
    if (!code) return "—";
    if (code === "Space") return I18N.t("ui.tecla.espacio");
    if (FLECHAS[code]) return FLECHAS[code];
    if (NOMBRES[code]) return NOMBRES[code];
    if (/^Numpad\d$/.test(code)) return "Num " + code.slice(6);
    return code.replace(/^(Key|Digit)/, "");
  }
  // la próxima tecla que se apriete es la nueva (Esc cancela): no llega al juego ni a los menús
  let capturando = null;
  addEventListener(
    "keydown",
    (e) => {
      if (!capturando) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const fn = capturando;
      capturando = null;
      fn(e.code === "Escape" ? null : e.code);
    },
    true,
  );

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
      if (!usandoMando && (propias[a] || (!GLIFOS_TECLADO[a] && BASE[a]))) return nombreTecla(TECLAS[a][0]);
      const g = (usandoMando ? GLIFOS_MANDO[a] : GLIFOS_TECLADO[a]) || (usandoMando ? "" : a);
      return g[0] === "@" ? I18N.t(g.slice(1)) : g;
    },
    mando: () => usandoMando,
    // teclas propias (Opciones → Teclas)
    GRUPOS,
    teclaDe: (a) => nombreTecla(TECLAS[a] && TECLAS[a][0]),
    propia: (a) => !!propias[a],
    asignar,
    restaurar,
    capturar: (fn) => (capturando = fn),
    capturando: () => !!capturando,
    nombreTecla,
  };
})();
