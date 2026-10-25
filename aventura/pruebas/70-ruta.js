// Pruebas de la ruta de aprendizaje (motor/ruta.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "ruta: lo que no se abrió dice desde cuándo, y al abrirse sale el cartel", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      RUTA.estricta(true);
      try {
        const t = (k, v) => I18N.t(k, v);
        RPG.estado().nivel = 1;
        RPG.recalcular();
        si(!RUTA.abierto("tablon") && !RUTA.abierto("tintes"), "a nivel 1 están cerrados");
        // el tablón: su E dice desde cuándo y no abre el pedido
        const tb = A.W.NOMBRADAS.tablon_caza;
        A.jug.x = tb.x;
        A.jug.y = tb.y + 30;
        let oferta = null;
        TABLON.sistema.cercanos((d, texto, fn) => (oferta = { texto, fn }));
        si(oferta && oferta.texto.includes(t("ru.pide_nivel", [2])), "la E dice desde nivel 2");
        oferta.fn();
        igual(A.J.modo, "juego", "no abre el menú:");
        // Ingrid cerrada hasta Eikholt, Kolbrun hasta nivel 6, cada uno por su lado
        const pi = COMERCIO.posIngrid();
        A.jug.x = pi[0];
        A.jug.y = pi[1];
        oferta = null;
        COMERCIO.sistema.cercanos((d, texto) => texto.includes(t("av.nombre_ingrid")) && (oferta = texto));
        si(oferta && oferta.includes(t("ru.pide_eikholt")), "Ingrid abre al llegar a Eikholt");
        // sube a nivel 2: se abre y sale el cartel
        RPG.estado().nivel = 2;
        RPG.recalcular();
        si(RUTA.abierto("tablon"), "a nivel 2 se abre");
        RUTA.revisar(false);
        si(RUTA.estado().vistos.tablon && RUTA.estado().vistos.cocina, "quedan vistos");
        oferta = null;
        A.jug.x = tb.x;
        A.jug.y = tb.y + 30;
        TABLON.sistema.cercanos((d, texto) => (oferta = texto));
        si(oferta && !oferta.includes(t("ru.pide_nivel", [2])), "la E ya es la de siempre");
        const html = RUTA.sistema.diario();
        si(html.includes(t("ru.p_tablon")) && html.includes(t("ru.p_instructores")), "el diario dice lo abierto y lo que viene");
        si(SAGA.entradas().some((e) => e.id === "ruta"), "la saga tiene la ruta");
        // la partida de prueba tiene todo abierto
        RUTA.estricta(null);
        si(RUTA.abierto("tintes"), "en la ranura 9 todo abierto");
      } finally {
        RUTA.estricta(null);
      }
    } }
  );
}
