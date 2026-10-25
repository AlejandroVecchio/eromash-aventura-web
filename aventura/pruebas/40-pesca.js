// Pruebas de la pesca (motor/pesca.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const ponerHora = (A, h) => (A.H.E.tiempo = (Math.floor(A.H.E.tiempo / LUZ.DIA) + 1) * LUZ.DIA + (((h - 9 + 24) % 24) / 24) * LUZ.DIA);
  // un punto en tierra, a la orilla de la laguna del puesto de Sverri
  function orilla(A) {
    const p = PESCA.puesto(),
      g = A.W.LAGOS.filter((l) => !l.seco).sort((a, b) => Math.hypot(a.p[0] - p.x, a.p[1] - p.y) - Math.hypot(b.p[0] - p.x, b.p[1] - p.y))[0];
    let x = p.x,
      y = p.y;
    for (let k = 0; k < 200; k++) {
      const dx = g.p[0] - x,
        dy = g.p[1] - y,
        l = Math.hypot(dx, dy);
      if (A.W.sueloEn(x, y) === 0 && A.W.libre(x, y, 14) && PESCA.aguaCerca(x, y)) return [x, y];
      x += (dx / l) * 20;
      y += (dy / l) * 20;
    }
    return [p.x, p.y];
  }
  // pelea perfecta: un clic cada dos cuadros con «¡Tirá!» y nada con «¡Esperá!»
  async function pelearBien(A) {
    for (let i = 0; i < 800 && PESCA.actual() && PESCA.actual().fase === "pelea"; i++) PESCA.pelear(0.05, PESCA.actual().est === "cede" && i % 2 === 0);
  }
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "pesca: la caña de Sverri a la orilla, se toma con E y la orilla deja pescar", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      A.enemigos.forEach((e) => (e.activo = false));
      const p = PESCA.puesto();
      si(p && p.id === "canaSverri", "el puesto de Sverri");
      si(A.W.LAGOS.some((g) => !g.seco && Math.hypot((p.x - g.p[0]) / (g.rx + 400), (p.y - g.p[1]) / (g.ry + 400)) < 1), "a la orilla de una laguna");
      si(PESCA.sistema.marcasMapa()[0].tipo === "pesca", "en el mapa");
      A.jug.x = p.x;
      A.jug.y = p.y + 90;
      await esperar(80);
      si(A.J.cerca && A.J.cerca.texto === I18N.t("pe.tomar"), "se toma con E");
      PESCA.tomarCana();
      si(PESCA.estado().cana && p.o.sinCana, "la caña se fue del puesto");
      const [x, y] = orilla(A);
      A.jug.x = x;
      A.jug.y = y;
      await esperar(80);
      si(PESCA.aguaCerca(x, y), "agua a mano");
      si(A.J.cerca && A.J.cerca.texto === I18N.t("pe.pescar"), "se pesca con E");
    } },
    { nombre: "pesca: cada agua y cada hora tiene sus peces, Urriði pide cuatro especies", fn: async (A, { igual, si }) => {
      ponerHora(A, 12);
      await esperar(30);
      const veces = (agua, y) => {
        const s = new Set();
        for (let i = 0; i < 200; i++) s.add(PESCA.elegirPez(agua, 0, y));
        return [...s].sort().join(",");
      };
      igual(veces("lago", A.W.ALTO * 0.6), "perca", "laguna de día:");
      igual(veces("rio", A.W.ALTO * 0.6), "trucha", "río de día al sur:");
      igual(veces("rio", A.W.ALTO * 0.1), "escarcha,trucha", "río de día al norte:");
      ponerHora(A, 23);
      await esperar(30);
      igual(veces("lago", A.W.ALTO * 0.6), "anguila,lucio", "laguna de noche:");
      PESCA.estado().libro = { perca: { n: 1, cm: 20 }, trucha: { n: 1, cm: 30 }, lucio: { n: 1, cm: 60 } };
      si(!veces("lago", A.W.ALTO * 0.6).includes("urridi"), "con tres especies no sale");
      PESCA.estado().libro.anguila = { n: 1, cm: 50 };
      si(veces("lago", A.W.ALTO * 0.6).includes("urridi"), "con cuatro, de noche, sale");
      PESCA.estado().libro = {};
    } },
    { nombre: "pesca: tirar, picar y pelear; tarde se va, sin sostener se suelta, bien va al libro y a la cocina", fn: async (A, { igual, si }) => {
      ponerHora(A, 12);
      const [x, y] = orilla(A);
      A.jug.x = x;
      A.jug.y = y;
      si(PESCA.empezar(), "tira la caña");
      igual(A.J.modo, "juego", "sin ventana, en el mundo:");
      si(!document.getElementById("pesca"), "no hay ventana de pesca");
      igual(PESCA.actual().fase, "lanza", "la boya vuela:");
      si(A.jug.interactuando > 0, "Eromash queda quieto con la caña");
      // tarde
      PESCA.picar();
      await esperar(PESCA.PICA * 1000 + 300);
      igual(PESCA.actual() && PESCA.actual().res, "tarde", "tarde se va:");
      await esperar(1400);
      igual(PESCA.actual(), null, "recoge el sedal:");
      // sin sostener se suelta
      PESCA.empezar();
      PESCA.picar();
      PESCA.tirar();
      for (let i = 0; i < 400 && PESCA.actual().fase === "pelea"; i++) PESCA.pelear(0.05, false);
      igual(PESCA.actual().res, "escapo", "sin tirar se suelta:");
      PESCA.cerrar();
      // tirar mientras el pez tira corta el sedal
      PESCA.empezar();
      PESCA.picar();
      PESCA.tirar();
      Object.assign(PESCA.actual(), { est: "tira", dura: 5, cambio: 1 });
      for (let i = 0; i < 10 && PESCA.actual().fase === "pelea"; i++) PESCA.pelear(0.05, true);
      igual(PESCA.actual().res, "corto", "con «¡Esperá!» se corta:");
      PESCA.cerrar();
      // con «¡Tirá!» cada clic lo acerca
      PESCA.empezar();
      PESCA.picar();
      PESCA.tirar();
      Object.assign(PESCA.actual(), { est: "cede", dura: 5 });
      const p0 = PESCA.actual().p;
      PESCA.pelear(0.05, true);
      si(PESCA.actual().p > p0, "el clic acerca");
      PESCA.cerrar();
      // bien
      const pes0 = COCINA.estado().carne.pescado || 0,
        x0 = RPG.estado().total;
      PESCA.empezar();
      PESCA.picar();
      PESCA.tirar();
      const id = PESCA.actual().pez;
      await pelearBien(A);
      igual(PESCA.actual().res, "pesco", "lo pescó:");
      si(PESCA.estado().libro[id] && PESCA.estado().libro[id].n === 1, "en el libro: " + id);
      igual(COCINA.estado().carne.pescado, pes0 + 1, "pescado a la cocina:");
      si(RPG.estado().total > x0, "experiencia por el pez nuevo");
      PESCA.cerrar();
      // los platos nuevos de la fogata
      si(COCINA.PLATOS.pescadoPalo && COCINA.PLATOS.sopaPescado, "dos platos de pescado");
      si(COCINA.empezar("pescadoPalo"), "se cocina al palo");
      igual(COCINA.estado().carne.pescado, pes0, "gastó el pescado:");
      COCINA.cerrar();
    } },
    { nombre: "pesca: Urriði el Viejo paga una vez y todo se guarda", fn: async (A, { igual, si }) => {
      ponerHora(A, 23);
      const [x, y] = orilla(A);
      A.jug.x = x;
      A.jug.y = y;
      PESCA.estado().libro = { perca: { n: 1, cm: 20 }, trucha: { n: 1, cm: 30 }, lucio: { n: 1, cm: 60 }, anguila: { n: 1, cm: 50 } };
      const frag = PODERES.pj().frag;
      PESCA.empezar();
      PESCA.picar();
      PESCA.actual().pez = "urridi";
      PESCA.tirar();
      si(PESCA.actual().cm >= 140, "enorme");
      await pelearBien(A);
      igual(PESCA.actual().res, "pesco", "lo pescó:");
      si(PESCA.estado().urridi, "Urriði anotado");
      PESCA.cerrar();
      await esperar(1200);
      si(PODERES.pj().frag >= frag + 2, "dos fragmentos");
      let otra = false;
      for (let i = 0; i < 200; i++) if (PESCA.elegirPez("lago", 0, A.W.ALTO * 0.6) === "urridi") otra = true;
      si(!otra, "no vuelve a salir");
      si(PESCA.sistema.diario().includes(I18N.t("pe.p_urridi")), "en el libro del diario");
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(150);
      si(PESCA.estado().cana && PESCA.estado().urridi && PESCA.estado().libro.anguila, "quedó guardado");
      si(PESCA.puesto().o.sinCana, "el puesto sigue sin caña");
    } },
  );
}
