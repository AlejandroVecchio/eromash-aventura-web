// ---------- colores de los vikingos (módulo VIKINGOS) ----------
// Un color por jugador: R rojo, W blanco, B azul, V verde (G, el dorado, es del set legendario y no se elige).
// Todo lo que pinta a un vikingo según su color sale de acá: sprites del juego (juego.js),
// los retratos con pechera (pecheras-lib.js vía nombre) y la sala de cooperativo (sala-coop.js).
// El rasterizador 3D (equipo/modelo3d.js) usa los mismos tonos para el icono del .exe; el juego no lo carga.
window.VIKINGOS = (function () {
  const L = {
    R: {
      nombre: "rojo",
      i18n: "pick.red",
      acento: "#C8402D",
      claro: "#FF8D71",
      domo: "#5E130D",
      linea: "#44100A",
      cara: "#0A0707",
      e1: "#C8402D",
      e2: "#9C2315",
    },
    W: {
      nombre: "blanco",
      i18n: "pick.white",
      acento: "#F2ECEC",
      claro: "#F2ECEC",
      domo: "#E0B2B2",
      linea: "#C9A0A0",
      cara: "#111111",
      e1: "#F2ECEC",
      e2: "#F2ECEC",
    },
    B: {
      nombre: "azul",
      i18n: "pick.blue",
      acento: "#4A78D0",
      claro: "#8FB0EC",
      domo: "#1E3F73",
      linea: "#142C52",
      cara: "#0A0707",
      e1: "#5B8BE0",
      e2: "#2F5FA8",
    },
    V: {
      nombre: "verde",
      i18n: "pick.green",
      acento: "#3DDC84",
      claro: "#8EEBB7",
      domo: "#1B5E3A",
      linea: "#124229",
      cara: "#0A0707",
      e1: "#3DDC84",
      e2: "#23A35E",
    },
  };
  const ORDEN = ["R", "W", "B", "V"];
  const valido = (c) => (L[c] ? c : "R");
  const de = (c) => L[valido(c)];
  return {
    L,
    ORDEN,
    valido,
    nombre: (c) => de(c).nombre, // 'rojo' | 'blanco' | 'azul' | 'verde'
    acento: (c) => de(c).acento,
    claro: (c) => de(c).claro,
    // el cuerpo del vikingo de juego.js (viewBox 40 90 400 480) recoloreado; juego.js lo completa con VIKINGOS.svg
    svg: null,
  };
})();
