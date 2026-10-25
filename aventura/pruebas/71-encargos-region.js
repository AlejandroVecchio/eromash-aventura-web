// Pruebas de los encargos por región: el tablón con tres pedidos por rango de nivel y los encargos con su nivel.
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "encargos: el tablón ofrece pedidos por zona y rango, el más alto paga más y solo cuenta su rango", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      RPG.estado().nivel = 6;
      RPG.recalcular();
      const l = TABLON.ofertas();
      si(l.length >= 2, "al menos dos pedidos");
      for (const p of l) {
        si(p.min === p.nivel - 2 && p.max === p.nivel + 2, "rango de ±2: " + p.banda);
        const b = TABLON.BANDAS.find((x) => x.id === p.banda);
        si(p.nivel >= 6 + b.de && p.nivel <= 6 + b.a, "nivel en su banda: " + p.banda);
        si(p.lugar && I18N.t("av.lugar_" + p.lugar) !== "av.lugar_" + p.lugar, "cerca de un lugar con nombre");
      }
      const orden = l.slice().sort((a, b) => a.nivel - b.nivel);
      si(TABLON.pagaDe(orden[orden.length - 1]) > TABLON.pagaDe(orden[0]), "el más alto paga más");
      // tomar uno y ver qué cuenta
      const p = orden[orden.length - 1];
      TABLON.estado().pedido = p;
      const sist = SISTEMAS.find((s) => s === TABLON.sistema);
      const fuera = A.enemigos.find((e) => e.tipo === p.tipo && RPG.nivelDe(e) < p.min);
      if (fuera) {
        sist.alMorir(fuera);
        igual(p.hechas, 0, "uno de otro rango no cuenta:");
      }
      const dentro = A.enemigos.find((e) => e.tipo === p.tipo && RPG.nivelDe(e) >= p.min && RPG.nivelDe(e) <= p.max);
      sist.alMorir(dentro);
      igual(p.hechas, 1, "uno del rango cuenta:");
      si(sist.marcasBrujula().length === 1, "la zona en la brújula");
      TABLON.estado().pedido = null;
    } },
    { nombre: "encargos: cada cadena tiene nivel, se ve en el diario y al cumplirse paga según su nivel", fn: async (A, { igual, si }) => {
      const C = SECUNDARIAS.CADENAS;
      si(C.every((c) => c.nivel > 0), "todas con nivel");
      const baja = C.reduce((m, c) => (c.nivel < m.nivel ? c : m)),
        alta = C.reduce((m, c) => (c.nivel > m.nivel ? c : m));
      si(SECUNDARIAS.pagoEncargo(alta).plata > SECUNDARIAS.pagoEncargo(baja).plata, "la más alta paga más");
      const c = baja,
        est = c.estado;
      c.estado = () => c.n;
      const dar0 = PODERES.darPlata,
        pagos = [];
      PODERES.darPlata = (n) => (pagos.push(n), dar0(n));
      try {
        SECUNDARIAS.revisarEncargos(false);
        await esperar(2200);
        SECUNDARIAS.revisarEncargos(false);
        await esperar(2200);
        igual(pagos.filter((n) => n === SECUNDARIAS.pagoEncargo(c).plata).length, 1, "pagó una sola vez:");
        const html = SISTEMAS.map((s) => (s.diario ? String(s.diario() || "") : "")).join("");
        si(html.includes(I18N.t("sc.nivel_rec", [c.nivel])), "el diario dice el nivel");
      } finally {
        PODERES.darPlata = dar0;
        c.estado = est;
      }
    } }
  );
}
