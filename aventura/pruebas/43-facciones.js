// Pruebas de las facciones y la reputación (motor/facciones.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "facciones: cuatro estandartes, cada uno en su lugar, en el mapa y con su ventana", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      A.enemigos.forEach((e) => (e.activo = false));
      igual(FACCIONES.estandartes.map((s) => s.f).join(","), "guardia,sendas,gremio,ocultos", "cuatro estandartes:");
      const L = A.W.LUGARES;
      const de = (f) => FACCIONES.estandartes.find((s) => s.f === f);
      si(Math.hypot(de("sendas").x - L.puesto.p[0], de("sendas").y - L.puesto.p[1]) < L.puesto.r * 1.3, "los Guardasendas a la entrada del Puesto");
      si(Math.hypot(de("gremio").x - L.brunvik.p[0], de("gremio").y - L.brunvik.p[1]) < L.brunvik.r * 1.3, "el Gremio a la entrada de Brunvik");
      const C = A.W.CIUDAD,
        g = de("guardia");
      const dc = Math.hypot((g.x - C.c[0]) / C.rx, (g.y - C.c[1]) / C.ry);
      si(dc > 1 && dc < 2, "la Guardia afuera de Eikholt: " + dc.toFixed(2));
      igual(FACCIONES.sistema.marcasMapa().length, 4, "en el mapa:");
      FACCIONES.estandartes.forEach((s) => si(A.W.sueloEn(s.x, s.y) === 0, s.f + " en tierra firme"));
      A.jug.x = de("sendas").x;
      A.jug.y = de("sendas").y + 80;
      const ofertas = [];
      FACCIONES.sistema.cercanos((d, txt, fn) => ofertas.push([txt, fn]));
      si(ofertas.length === 1 && ofertas[0][0].includes(I18N.t("fc.sendas")), "se mira con E");
      ofertas[0][1]();
      await esperar(80);
      si(document.body.textContent.includes(I18N.t("fc.sendas_d")), "la ventana");
      A.cerrarMenu();
    } },
    { nombre: "facciones: lo hecho en otros sistemas suma, los grados regalan y los bonos valen", fn: async (A, { igual, si }) => {
      const st = FACCIONES.estado();
      FACCIONES.mirar();
      const r0 = FACCIONES.rep("gremio");
      // diez peces
      PESCA.estado().libro.perca = { n: 10, cm: 25 };
      FACCIONES.mirar();
      igual(FACCIONES.rep("gremio") - r0, 10 * 6, "peces al Gremio:");
      // no se cobra dos veces
      FACCIONES.mirar();
      igual(FACCIONES.rep("gremio") - r0, 60, "una sola vez:");
      // los bandidos a la Guardia (y no los lobos)
      const g0 = FACCIONES.rep("guardia");
      FACCIONES.sistema.alMorir({ tipo: "bandido", d: {}, x: A.jug.x, y: A.jug.y });
      FACCIONES.sistema.alMorir({ tipo: "arquero", d: {}, lider: { nombre: "X" }, x: A.jug.x, y: A.jug.y });
      FACCIONES.sistema.alMorir({ tipo: "lobo", d: {}, x: A.jug.x, y: A.jug.y });
      igual(FACCIONES.rep("guardia") - g0, 8 + 30, "bandido y líder:");
      // subir de grado regala plata
      const pj = PODERES.pj(),
        p0 = pj.plata;
      st.rep.guardia = 0;
      FACCIONES.dar("guardia", 300);
      igual(FACCIONES.grado("guardia"), 1, "Conocido:");
      igual(pj.plata - p0, 40, "regalo de Conocido:");
      // bonos
      igual(Math.round(FACCIONES.sistema.modDano(100, { tipo: "bandido" })), 104, "+4 % contra bandidos:");
      igual(FACCIONES.sistema.modDano(100, { tipo: "lobo" }), 100, "no contra lobos:");
      st.rep.sendas = 2000;
      igual(FACCIONES.grado("sendas"), 3, "Honrado:");
      si(FACCIONES.textoBono("sendas").includes("12"), "Ingrid −12 %: " + FACCIONES.textoBono("sendas"));
      // Exaltado: una pieza de la armería
      const tiradas = [];
      const tirar0 = BOTIN.tirar;
      BOTIN.tirar = (x, y, it) => tiradas.push(it);
      st.rep.ocultos = 2100;
      const run0 = A.J.regenRunica;
      FACCIONES.dar("ocultos", 1800);
      igual(FACCIONES.grado("ocultos"), 4, "Exaltado:");
      await esperar(4200);
      BOTIN.tirar = tirar0;
      igual(tiradas.length, 1, "una pieza:");
      si(tiradas[0] && tiradas[0].r >= 2, "rara o mejor: " + (tiradas[0] && tiradas[0].r));
      si(A.J.regenRunica > run0, "más energía rúnica");
    } },
    { nombre: "facciones: los descuentos en el comercio y todo se guarda", fn: async (A, { igual, si }) => {
      const st = FACCIONES.estado();
      st.rep.sendas = 0;
      st.rep.gremio = 0;
      const it = OBJETOS.generar({ n: 3, slot: "arma", r: 1 });
      const p0 = COMERCIO.precioCompra ? COMERCIO.precioCompra(it, "ingrid") : null;
      if (p0 != null) {
        st.rep.sendas = 3800;
        const p1 = COMERCIO.precioCompra(it, "ingrid");
        si(p1 < p0, "Ingrid más barata: " + p0 + " → " + p1);
      }
      si(FACCIONES.sistema.celdasBolsa().length === 1, "la casilla de la Bolsa");
      si(FACCIONES.sistema.diario().includes(I18N.t("fc.ocultos")), "en el diario");
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(200);
      igual(FACCIONES.grado("ocultos"), 4, "quedó guardado:");
    } },
  );
}
