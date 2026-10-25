// Pruebas del rastreo con la Lente (motor/mj-rastreo.js) y del último rastro de los contratos que lo pide (motor/contratos.js).
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  // lleva la Lente a cada huella del camino y la marca (o a una huella ajena, para errar)
  function seguir(S, op = {}) {
    const def = MINIJ.JUEGOS.rastreo;
    for (let k = 0; k < 60 && !S.gano && !S.fin; k++) {
      const h = op.falsa ? S.falsas[k % S.falsas.length] : S.camino[S.sig];
      if (!h) break;
      def.arrastre(S, h.x, h.y, "baja");
      def.arrastre(S, h.x, h.y, "sube");
    }
  }
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "rastreo: seguir las huellas en orden gana cada variante; marcar las ajenas enfría el rastro", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (const v of ["base", "senuelos", "lluvia", "noche", "largo"]) {
        let res = null;
        si(MINIJ.empezar("rastreo", { variante: v, bestia: "jabali", semilla: 6, fin: (r) => (res = r) }), "empieza " + v);
        const S = MINIJ.estado();
        igual(S.bestia, "jabali", v + " sigue la bestia pedida:");
        igual(S.camino.length, S.v.huellas, v + " huellas:");
        si(S.camino.every((h) => h.x >= 250 && h.x <= 1350 && h.y >= 170 && h.y <= 830), v + " el camino queda en el piso");
        si(S.falsas.length >= S.v.falsas, v + " con huellas ajenas");
        if (v === "senuelos") si(S.falsas.some((h) => h.vieja && h.forma === "jabali"), "y viejas de la misma bestia");
        seguir(S);
        si(S.gano > 0 && S.frio === 0, v + " leído sin errores");
        await esperar(1000);
        MINIJ.cerrar();
        si(res && res.gano, v + " avisa");
      }
      let res = null;
      MINIJ.empezar("rastreo", { semilla: 2, fin: (r) => (res = r) });
      const S = MINIJ.estado();
      // saltearse una huella del camino también es error
      const def = MINIJ.JUEGOS.rastreo;
      def.arrastre(S, S.camino[2].x, S.camino[2].y, "baja");
      def.arrastre(S, S.camino[2].x, S.camino[2].y, "sube");
      igual(S.frio, 1, "saltearse una huella enfría:");
      igual(S.sig, 0, "y no avanza:");
      seguir(S, { falsa: true });
      si(S.fin && !S.fin.gano, "demasiado frío pierde");
      MINIJ.cerrar();
      si(res && !res.gano, "avisa que no");
      // arrastrar mueve la Lente sin marcar
      MINIJ.empezar("rastreo", { semilla: 3 });
      const S2 = MINIJ.estado(),
        lx = S2.lx;
      def.arrastre(S2, 700, 500, "baja");
      def.arrastre(S2, 800, 520, "mueve");
      def.arrastre(S2, 800, 520, "sube");
      si(Math.abs(S2.lx - (lx + 100)) < 1, "arrastrar corre la Lente");
      igual(S2.frio + S2.sig, 0, "sin marcar nada:");
      MINIJ.cerrar();
    } },
    { nombre: "rastreo: el último rastro de un contrato se lee con la Lente antes de llevar a la guarida", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      CONTRATOS.abandonar && CONTRATOS.estado().activo && CONTRATOS.abandonar();
      si(CONTRATOS.tomar("cerda"), "tomado");
      CONTRATOS.examinar("cerda", 0);
      CONTRATOS.examinar("cerda", 1);
      A.cerrarMenu && A.cerrarMenu();
      JUEGO.J.modo = "juego";
      igual(CONTRATOS.estado().c.cerda.rastros, 2, "los dos primeros se miran como siempre:");
      CONTRATOS.examinar("cerda", 2);
      const S = MINIJ.estado();
      si(S && S.tipo === "rastreo" && S.bestia === "jabali", "el último pide el rastreo de la jabalina");
      MINIJ.terminar({ gano: false, dejo: true });
      MINIJ.cerrar();
      igual(CONTRATOS.estado().c.cerda.fase, "rastros", "dejarlo no avanza:");
      CONTRATOS.examinar("cerda", 2);
      seguir(MINIJ.estado());
      await esperar(1000);
      MINIJ.cerrar();
      A.cerrarMenu && A.cerrarMenu();
      JUEGO.J.modo = "juego";
      igual(CONTRATOS.estado().c.cerda.fase, "guarida", "leído, lleva a la guarida:");
      CONTRATOS.abandonar && CONTRATOS.abandonar();
    } },
  );
}
