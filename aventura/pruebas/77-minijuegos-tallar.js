// Pruebas de tallar la runa (motor/mj-tallar.js) y de Ása y la unión de tallas que lo piden (motor/engarces.js).
{
  // juega el cincel a mano: golpea cuando pasa justo por cada marca de oro (y nunca en las vetas)
  function tallar(S, golpear = true) {
    const def = MINIJ.JUEGOS.tallar;
    for (let k = 0; k < 40000 && !S.fin; k++) {
      if (golpear && !S.gano && S.pausa <= 0 && S.trs[S.trazo]) {
        const m = S.marcas.find((q) => q.tr === S.trazo && !q.hecha && !q.veta && Math.abs(q.s - S.s) < 3);
        if (m) def.tocar(S, 0);
      }
      def.paso(S, 1 / 240);
    }
  }
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "tallar: golpear justo en el oro talla la runa en cada variante; no golpear la parte", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (const v of ["base", "rapido", "dura", "vetas", "palabra"]) {
        let res = null;
        si(MINIJ.empezar("tallar", { variante: v, semilla: 7, fin: (r) => (res = r) }), "empieza " + v);
        const S = MINIJ.estado();
        si(S.trs.length > 0 && S.marcas.some((m) => !m.veta), v + " tiene trazos y marcas");
        if (v === "vetas") si(S.marcas.some((m) => m.veta), "las vetas están");
        if (v === "palabra") igual(S.runas.length, 2, "la palabra son dos runas:");
        tallar(S);
        si(S.fin && S.fin.gano, v + " tallada");
        si(S.fin.precision >= 0.85, v + " con precisión perfecta (" + S.fin.precision + ")");
        igual(S.grietas, 0, v + " sin grietas:");
        MINIJ.cerrar();
        si(res && res.gano, v + " avisa");
      }
      // sin golpear, las marcas se pasan y la piedra se parte
      let res = null;
      MINIJ.empezar("tallar", { semilla: 3, fin: (r) => (res = r) });
      const S = MINIJ.estado();
      tallar(S, false);
      si(S.fin && !S.fin.gano && S.grietas > S.v.fallos, "sin golpes se parte");
      MINIJ.cerrar();
      si(res && !res.gano && !res.dejo, "avisa que no");
      // una runa corta (Isa: un solo trazo) sin golpes tampoco se gana
      MINIJ.empezar("tallar", { runa: "isa", semilla: 1 });
      tallar(MINIJ.estado(), false);
      si(!MINIJ.estado().fin.gano, "Isa sin golpes no se gana");
      MINIJ.cerrar();
      // la runa pedida se respeta
      MINIJ.empezar("tallar", { runa: "kenaz" });
      igual(MINIJ.estado().runas[0], "kenaz", "talla la runa pedida:");
      MINIJ.cerrar();
    } },
    { nombre: "tallar: un golpe a destiempo o en una veta raja la piedra", fn: async (A, { igual, si }) => {
      MINIJ.empezar("tallar", { variante: "vetas", semilla: 11 });
      const S = MINIJ.estado(),
        def = MINIJ.JUEGOS.tallar;
      S.pausa = 0;
      S.s = -60; // el cincel todavía no llegó a nada
      def.tocar(S, 0);
      igual(S.grietas, 1, "a destiempo raja:");
      const veta = S.marcas.find((m) => m.veta);
      S.trazo = veta.tr;
      S.s = veta.s;
      def.tocar(S, 0);
      igual(S.grietas, 2, "la veta raja:");
      si(veta.hecha < 0, "la veta queda rajada");
      MINIJ.cerrar();
    } },
    { nombre: "tallar: Ása abre muescas tallando (perfecta suma, rajada resta, dejar no cobra) y unir tres pide tallar", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const nueva = (r) => {
        const it = OBJETOS.generar({ base: "espadaHierro", r, n: 4, rnd: OBJETOS.azar(20 + r), sinMuescas: true });
        BOTIN.dar(it);
        return it;
      };
      const plata = () => PODERES.pj().plata;
      const materiales = () => (MATERIALES.dar("hierro", 2), MATERIALES.dar("esquirla", 1));
      // una mágica: con talla perfecta, una muesca más que lo de siempre
      PODERES.pj().plata = 500;
      materiales();
      const magica = nueva(1);
      ENGARCES.pedirAbrir(magica);
      let S = MINIJ.estado();
      igual(S && S.tipo, "tallar", "Ása da el cincel:");
      igual(S.variante, "vetas", "la mágica tiene vetas:");
      tallar(S);
      MINIJ.cerrar();
      INVENTARIO.cerrar();
      igual(magica.e, Math.min(ENGARCES.maxDe(magica), ENGARCES.muescasQueAbre(magica) + 1), "perfecta suma una:");
      // dejar no cobra
      materiales();
      const otra = nueva(1),
        p0 = plata();
      ENGARCES.pedirAbrir(otra);
      MINIJ.terminar({ gano: false, dejo: true });
      MINIJ.cerrar();
      A.cerrarMenu();
      igual(plata(), p0, "dejar no cobra:");
      si(!otra.e, "ni abre");
      // rajada: una menos (nunca menos de una)
      ENGARCES.pedirAbrir(otra);
      S = MINIJ.estado();
      tallar(S, false);
      MINIJ.cerrar();
      INVENTARIO.cerrar();
      igual(otra.e, Math.max(1, ENGARCES.muescasQueAbre(otra) - 1), "rajada resta una:");
      si(plata() < p0, "y cobra");
      // unir: si se resquebraja, las tres siguen; si sale, se unen
      const st = ENGARCES.estado();
      st.tallas.fehu = 3;
      const uruz0 = st.tallas.uruz || 0;
      ENGARCES.pedirUnir("fehu");
      S = MINIJ.estado();
      igual(S && S.tipo, "tallar", "unir pide tallar:");
      tallar(S, false);
      MINIJ.cerrar();
      igual(st.tallas.fehu, 3, "resquebrajada no gasta:");
      ENGARCES.pedirUnir("fehu");
      tallar(MINIJ.estado());
      MINIJ.cerrar();
      INVENTARIO.cerrar();
      igual(st.tallas.fehu, 0, "tallada gasta tres:");
      igual(st.tallas.uruz, uruz0 + 1, "y da la siguiente:");
    } },
  );
}
