// Pruebas del rayo de luz rúnica (motor/mj-rayo.js), del rito de la luna (motor/ritos.js) y del sello de EL-07 (motor/juego.js).
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const idx = (S, c) => c.y * S.v.c + c.x;
  // da vuelta los espejos del camino que están mal, como lo haría el puntero
  function resolver(S) {
    Object.values(S.celda)
      .filter((c) => c.tipo === "espejo" && c.bien && !c.fijo && c.forma !== c.bien)
      .forEach((c) => MINIJ.JUEGOS.rayo.tocar(S, idx(S, c)));
  }
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "rayo: la luz entra en una gemela y sale derecho por la otra", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      MINIJ.empezar("rayo", { variante: "gemelas", semilla: 4 });
      const S = MINIJ.estado();
      S.celda = {};
      const f = { tipo: "fuente", x: 0, y: 1, d: 0 },
        a = { tipo: "gemela", x: 2, y: 1, otra: { x: 5, y: 4 }, par: 0 },
        b = { tipo: "gemela", x: 5, y: 4, otra: { x: 2, y: 1 }, par: 0 },
        s = { tipo: "sello", x: 7, y: 4 },
        e = { tipo: "espejo", x: 6, y: 0, forma: "/" };
      [f, a, b, s, e].forEach((c) => (S.celda[idx(S, c)] = c));
      S.fuentes = [f];
      S.sellos = [s];
      MINIJ.JUEGOS.rayo.tocar(S, idx(S, e)); // un espejo cualquiera: vuelve a trazar la luz
      si(s.lit, "la luz salta de (2,1) a (5,4) y llega al sello en (7,4)");
      igual(S.rayos[0].tramo.filter((p) => p[3]).length, 1, "un salto en el trazo:");
      MINIJ.cerrar();
    } },
    { nombre: "rayo: cada variante arranca sin resolver y se resuelve dando vuelta los espejos del camino", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (const v of ["base", "ataduras", "dos", "luna", "reloj", "gemelas", "laberinto", "tres", "abismo"]) {
        for (const semilla of [1, 2, 3]) {
          let res = null;
          si(MINIJ.empezar("rayo", { variante: v, semilla, fin: (r) => (res = r) }), "empieza " + v);
          const S = MINIJ.estado();
          igual(S.sellos.length, { dos: 2, abismo: 2, tres: 3 }[v] || 1, v + " sellos:");
          if (S.v.portales) igual(Object.values(S.celda).filter((c) => c.tipo === "gemela").length, S.v.portales * 2 * S.sellos.length, v + " gemelas:");
          si(!S.sellos.every((s) => s.lit), v + " no arranca resuelto");
          if (v === "luna") si(S.fuentes[0].y === 0 && S.fuentes[0].d === 3, "la luna baja de arriba");
          if (v === "ataduras") si(Object.values(S.celda).some((c) => c.tipo === "atadura") && Object.values(S.celda).some((c) => c.fijo), "ataduras y un espejo atado");
          resolver(S);
          si(S.gano > 0 && S.sellos.every((s) => s.lit), v + " (" + semilla + ") resuelto");
          await esperar(1000);
          MINIJ.cerrar();
          si(res && res.gano, v + " avisa");
        }
      }
    } },
    { nombre: "rayo: la luz rebota en los espejos, se corta en ataduras y piedras ciegas y el espejo atado no gira", fn: async (A, { igual, si }) => {
      MINIJ.empezar("rayo", { variante: "ataduras", semilla: 5 });
      const S = MINIJ.estado(),
        def = MINIJ.JUEGOS.rayo;
      // una losa a mano: fuente al oeste, espejo, sello al norte
      S.celda = {};
      const f = { tipo: "fuente", x: 0, y: 2, d: 0 },
        e = { tipo: "espejo", x: 3, y: 2, forma: "\\" },
        s = { tipo: "sello", x: 3, y: 0 };
      [f, e, s].forEach((c) => (S.celda[idx(S, c)] = c));
      S.fuentes = [f];
      S.sellos = [s];
      def.tocar(S, idx(S, e));
      igual(e.forma, "/", "tocar lo da vuelta:");
      si(s.lit, "«/» manda la luz del este al norte: llega al sello");
      MINIJ.cerrar();
      MINIJ.empezar("rayo", { variante: "ataduras", semilla: 5 });
      const S2 = MINIJ.estado();
      S2.celda = {};
      const f2 = { tipo: "fuente", x: 0, y: 2, d: 0 },
        at = { tipo: "atadura", x: 2, y: 2 },
        e2 = { tipo: "espejo", x: 4, y: 2, forma: "\\", fijo: true },
        s2 = { tipo: "sello", x: 4, y: 0 };
      [f2, at, e2, s2].forEach((c) => (S2.celda[idx(S2, c)] = c));
      S2.fuentes = [f2];
      S2.sellos = [s2];
      def.tocar(S2, idx(S2, e2));
      igual(e2.forma, "\\", "el espejo atado no gira:");
      delete S2.celda[idx(S2, at)];
      e2.fijo = false;
      def.tocar(S2, idx(S2, e2));
      si(s2.lit, "sin la atadura la luz pasa");
      S2.celda[idx(S2, { x: 2, y: 2 })] = { tipo: "ciega", x: 2, y: 2 };
      S2.gano = 0;
      e2.forma = "\\";
      def.tocar(S2, idx(S2, e2));
      si(!s2.lit, "la piedra ciega la corta");
      MINIJ.cerrar();
    } },
    { nombre: "rayo: el rito de la luna pide llevar la luz de noche y el sello de EL-07 pide el rayo antes del calco", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const r = RITOS.lista().ritos.find((x) => x.tipo === "luna");
      // de noche (el ambiente se pone al día en el cuadro siguiente)
      for (let k = 0; k < 40 && A.noche() <= 0.6; k++) {
        if (k % 4 === 0) A.H.E.tiempo += LUZ.DIA / 8;
        await esperar(80);
      }
      si(A.noche() > 0.6, "es de noche");
      RITOS.tocar(r);
      let S = MINIJ.estado();
      si(S && S.tipo === "rayo" && S.variante === "luna", "la luna pide el rayo");
      resolver(S);
      await esperar(1000);
      MINIJ.cerrar();
      await esperar(900);
      si(RITOS.lista().st.ritos[r.id], "la piedra despierta");
      // el sello del Santuario de las Raíces
      const H = A.H;
      H.E.mision = H.MISIONES.findIndex((m) => m.id === "EL-07");
      H.E.banderas.sello_visto = true;
      H.E.banderas.voz_santuario = true;
      const sp = A.P.sello;
      A.jug.x = sp[0] != null ? sp[0] : sp.x;
      A.jug.y = sp[1] != null ? sp[1] : sp.y;
      const c = A.cercano();
      si(c && c.texto === I18N.t("av.accion_calco"), "a mano: hacer un calco");
      c.fn();
      S = MINIJ.estado();
      si(S && S.tipo === "rayo", "el calco pide el rayo");
      MINIJ.terminar({ gano: false, dejo: true });
      MINIJ.cerrar();
      si(!H.tiene("calco"), "dejarlo no hace el calco");
      A.cercano().fn();
      resolver(MINIJ.estado());
      await esperar(1000);
      MINIJ.cerrar();
      si(H.tiene("calco"), "con la luz en el sello, el calco");
    } },
  );
}
