// ---------- Eromash en cuatro vistas (módulo VIKINGO) ----------
// El vikingo de la arena (juego/js/motor/juego.js: casco con la E girada, cara negra, barba) visto de frente (S),
// de costado (E; el oeste es el mismo dibujo espejado) y de espaldas (N). Mismas caras planas, mismos colores
// por jugador (juego/js/comun/vikingos.js) y la misma caja 40 90 400 480 que el sprite de la arena.
// Uso: VIKINGO.imagen(color, vista, ojos) → Image; VIKINGO.vista(dx, dy) → { vista, espejo }.
window.VIKINGO = (function () {
  "use strict";
  // la E del casco, tal cual la arena (sin girar): lomo de 0 a 90, tres brazos hacia +x
  const E_SOMBRA = `<polygon points="26 61 0 87 64 87 64 170 89 145 91 60 26 61"/><polygon points="26 208 89 207 89 297 64 323 64 231 2 232 26 208"/><polygon points="33 354 4 382 267 382 296 354 33 354"/><polygon points="158 204 255 204 225 231 157 231 158 204"/><polygon points="158 61 157 87 291 87 317 61 158 61"/>`;
  const E_CARA = `m88,0c94.67.33,189.33.67,284,1l-55,60h-159l-3,84h161l-61,59h-97l-1,94h197l-58,56H33l56-57v-90l-63,1,62-62,3-86-65,1L88,0Z`;
  const BARBA = "128,430 376,430 384,480 340,528 290,520 252,556 212,520 164,528 120,480";

  const OJOS_FRENTE = {
    calm: '<polygon points="146,290 214,302 214,320 148,310" fill="#F2ECEC"/><polygon points="299,302 357,290 355,310 299,320" fill="#F2ECEC"/>',
    fierce:
      '<polygon points="146,296 216,308 216,324 148,318" fill="#F2ECEC"/><polygon points="296,308 362,296 360,318 296,324" fill="#F2ECEC"/>',
    happy:
      '<polyline points="150,316 180,292 210,316" fill="none" stroke="#F2ECEC" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><polyline points="298,316 328,292 358,316" fill="none" stroke="#F2ECEC" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>',
    hurt: '<polyline points="150,292 190,310 150,326" fill="none" stroke="#F2ECEC" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><polyline points="358,292 318,310 358,326" fill="none" stroke="#F2ECEC" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>',
  };
  // de costado se ve un solo ojo, el del lado que mira (adelante = derecha)
  const OJOS_COSTADO = {
    calm: '<polygon points="350,302 400,292 398,312 350,320" fill="#F2ECEC"/>',
    fierce: '<polygon points="348,308 402,298 400,318 348,324" fill="#F2ECEC"/>',
    happy:
      '<polyline points="352,316 374,296 396,316" fill="none" stroke="#F2ECEC" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>',
    hurt: '<polyline points="398,294 362,310 398,326" fill="none" stroke="#F2ECEC" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>',
  };

  // tonos de cada vikingo: R, W, B, V salen de VIKINGOS; G es el dorado del set legendario
  function tonos(c) {
    if (c === "G") return { domo: "#C98A1A", linea: "#8A5A0E", cara: "#0A0707", e1: "#FFD98A", e2: "#F5A524" };
    const v = (window.VIKINGOS && VIKINGOS.L[c]) || VIKINGOS.L.R;
    return v;
  }
  const grad = (id, t) =>
    `<defs><linearGradient id="${id}" x1="199" y1="354" x2="199" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${t.e2}"/><stop offset="1" stop-color="${t.e1}"/></linearGradient>` +
    `<linearGradient id="${id}h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.e2}"/><stop offset="1" stop-color="${t.e1}"/></linearGradient></defs>`;

  // ---- frente (S): el sprite de la arena sin cambios ----
  function frente(t, ojos, id) {
    return (
      grad(id, t) +
      `<path d="M60 205 C90 95 390 95 420 205 Z" fill="${t.domo}"/><path d="M240 126 L240 205" stroke="${t.linea}" stroke-width="10"/>` +
      `<polygon points="125,262 378,262 378,470 320,510 185,510 125,470" fill="${t.cara}"/>` +
      `<polygon points="${BARBA}" fill="${t.domo}"/>` +
      `<g transform="translate(431,110) rotate(90)"><g fill="${t.linea}">${E_SOMBRA}</g><path fill="url(#${id})" d="${E_CARA}"/></g>` +
      OJOS_FRENTE[ojos]
    );
  }

  // ---- espaldas (N): las tres barras de la E asoman por arriba (espejadas), la banda da la vuelta, la nuca y la barba por debajo ----
  function espaldas(t, _ojos, id) {
    return (
      grad(id, t) +
      `<polygon points="${BARBA}" fill="${t.domo}"/>` +
      // la cara de atrás de las tres barras: asoman por encima de la cúpula con su corte en diagonal
      `<g fill="${t.linea}"><polygon points="70,200 70,128 96,102 122,128 122,200"/><polygon points="212,200 212,124 238,98 264,124 264,200"/><polygon points="356,200 356,128 382,102 408,128 408,200"/></g>` +
      `<g fill="${t.e2}"><polygon points="96,102 122,128 122,200 96,200"/><polygon points="238,98 264,124 264,200 238,200"/><polygon points="382,102 408,128 408,200 382,200"/></g>` +
      // cúpula y nuca
      `<path d="M60 205 C90 95 390 95 420 205 L418 452 L62 452 Z" fill="${t.domo}"/>` +
      // la banda de la frente da toda la vuelta
      `<polygon points="60,198 420,198 420,265 60,265" fill="url(#${id}h)"/>` +
      `<polygon points="60,265 420,265 420,279 60,279" fill="${t.linea}"/>` +
      `<path d="M240 122 L240 198 M240 279 L240 446" stroke="${t.linea}" stroke-width="10"/>` +
      // cubrenuca: una placa más oscura con dos ranuras, como las de la cara
      `<polygon points="62,430 418,430 398,486 82,486" fill="${t.linea}"/>` +
      `<g fill="${t.domo}"><polygon points="150,444 166,438 166,474 150,480"/><polygon points="330,438 314,444 314,480 330,474"/></g>`
    );
  }

  // ---- costado (E, mira a la derecha): la banda envuelve el casco; adelante, la barra del costado, el hueco del ojo y la barra del centro de canto ----
  function costado(t, ojos, id) {
    return (
      grad(id, t) +
      // barba: sale hacia adelante y abajo
      `<polygon points="196,430 404,430 430,476 410,520 362,528 322,552 272,526 216,520 192,480" fill="${t.domo}"/>` +
      // cúpula de perfil y nuca
      `<path d="M66 214 C84 100 340 90 404 200 L404 262 L300 262 L300 476 L240 500 L150 496 L74 448 Z" fill="${t.domo}"/>` +
      // la cara negra, en el hueco de adelante
      `<polygon points="336,262 404,262 404,480 360,510 336,504" fill="${t.cara}"/>` +
      // espesor de la placa (hacia atrás y arriba, como en el frente)
      `<g fill="${t.linea}"><polygon points="66,198 90,174 380,174 404,198 404,265 66,265"/><polygon points="296,146 318,118 318,124 296,146 296,470 272,446 272,122 294,100 318,118"/><polygon points="404,136 426,112 404,112 380,136 380,420 404,444"/></g>` +
      // la banda alrededor del casco
      `<polygon points="66,198 404,198 404,265 66,265" fill="url(#${id}h)"/>` +
      // barra del costado (con su punta) y barra del centro, de canto
      `<polygon points="296,146 318,118 340,146 340,476 296,476" fill="url(#${id})"/>` +
      `<polygon points="404,140 426,112 448,140 448,430 404,452" fill="url(#${id})"/>` +
      OJOS_COSTADO[ojos]
    );
  }

  const DIBUJO = { S: frente, N: espaldas, E: costado };
  const cache = {};
  let n = 0;
  function svg(c, vista, ojos = "calm") {
    const t = tonos(c),
      id = "vk" + n++;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 90 400 480" width="400" height="480">${DIBUJO[vista](t, ojos, id)}</svg>`;
  }
  function imagen(c, vista, ojos = "calm") {
    const k = c + vista + ojos;
    if (!cache[k]) {
      const i = new Image();
      i.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg(c, vista, ojos));
      cache[k] = i;
    }
    return cache[k];
  }
  // hacia dónde mira según el movimiento: los costados ganan en diagonal, para que se lea el giro
  function vista(dx, dy, previa) {
    if (Math.abs(dx) < 1e-3 && Math.abs(dy) < 1e-3) return previa || { vista: "S", espejo: false };
    if (Math.abs(dx) > Math.abs(dy) * 0.75) return { vista: "E", espejo: dx < 0 };
    return { vista: dy < 0 ? "N" : "S", espejo: false };
  }
  return { svg, imagen, vista, OJOS: Object.keys(OJOS_FRENTE) };
})();
