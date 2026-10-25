// Pruebas de las runas de los elementos y las reacciones (motor/elementos.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const traer = (A, dx, dy, tipo) => {
    const e = A.CB.crear(tipo || "lobo", A.jug.x + dx, A.jug.y + dy, {});
    e.activo = true;
    e.estado = "espera";
    A.enemigos.push(e);
    return e;
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "elementos: el Roble del Trueno y la Fuente de Laguz en tierra firme, en el mapa y fuera de los caminos", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      A.enemigos.forEach((e) => (e.activo = false));
      const r = ELEMENTOS.roble().cosa,
        f = ELEMENTOS.fuente();
      si(f, "hay fuente");
      [r, f.cosa, ...f.piedras].forEach((o) => {
        si(A.W.sueloEn(o.x, o.y) === 0, o.id + " en tierra firme");
        si(A.W.CAMINOS.every((k) => A.W.distLinea(o.x, o.y, k.p) > k.w / 2 + 60), o.id + " fuera de los caminos");
      });
      for (let i = 0; i < f.piedras.length; i++) for (let j = i + 1; j < f.piedras.length; j++) si(Math.hypot(f.piedras[i].x - f.piedras[j].x, f.piedras[i].y - f.piedras[j].y) > 500, "piedras repartidas");
      const lg = A.W.LAGOS[2];
      si(Math.hypot(f.cosa.x - lg.p[0], f.cosa.y - lg.p[1]) < lg.rx * 2, "la fuente junto a la laguna");
      const marcas = ELEMENTOS.sistema.marcasMapa();
      igual(marcas.map((m) => m.op.runa).join(","), "thurisaz,laguz", "en el mapa:");
      si(PODERES.ORDEN.includes("thurisaz") && PODERES.ORDEN.includes("laguz"), "las dos runas en el orden");
    } },
    { nombre: "elementos: la prueba del trueno da Thurisaz y lanzarla salta entre criaturas y las crispa", fn: async (A, { igual, si }) => {
      const r = ELEMENTOS.roble().cosa;
      A.jug.x = r.x + 120;
      A.jug.y = r.y + 40;
      ELEMENTOS.empezarPrueba();
      si(ELEMENTOS.prueba(), "empieza la prueba");
      // los rayos van marcados en el piso antes de caer
      for (let i = 0; i < 60 && !A.J.avisos.some((a) => a.rgb && a.rgb[0] === 184); i++) await esperar(50);
      si(A.J.avisos.some((a) => a.rgb && a.rgb[0] === 184), "el rayo se marca en el piso");
      // terminar rápido: el último rayo
      const p = ELEMENTOS.prueba();
      p.n = 7;
      p.prox = 0;
      for (let i = 0; i < 80 && ELEMENTOS.prueba(); i++) await esperar(50);
      igual(ELEMENTOS.prueba(), null, "terminó:");
      si(ELEMENTOS.estado().roble && r.o.tomada && PODERES.tiene("thurisaz"), "Thurisaz es tuya");
      if (A.J.modo === "dialogo" && A.cerrarDialogo) A.cerrarDialogo();
      A.J.modo = "juego";
      // lanzar: tres lobos en fila
      const es = [traer(A, 120, 0), traer(A, 220, 30), traer(A, 320, 0)];
      PODERES.elegirRuna("thurisaz");
      PODERES.darEnergia(100);
      A.jug.dir = [1, 0];
      PODERES.LANZAR.thurisaz({ golpe: (e, d) => A.CB.golpear(A.J, e, d, A.jug.x, A.jug.y, 0.6), pr: 1, apuntar: () => 0, vivos: () => es, efectos: [], avisar: () => {} });
      si(es.filter((e) => e.electro > 0 || e.muerto).length === 3, "el rayo saltó a las tres");
      es.forEach((e) => (e.activo = false));
    } },
    { nombre: "elementos: las tres piedras hacen manar la fuente y beber da Laguz, que empuja y empapa", fn: async (A, { igual, si }) => {
      const f = ELEMENTOS.fuente();
      igual(f.cosa.o.viva, false, "seca:");
      ELEMENTOS.beber();
      igual(PODERES.tiene("laguz"), false, "seca no da nada:");
      [0, 1, 2].forEach((i) => ELEMENTOS.tocarPiedra(i));
      si(f.piedras.every((p) => p.o.viva), "piedras despiertas");
      for (let i = 0; i < 60 && !f.cosa.o.viva; i++) await esperar(50);
      si(f.cosa.o.viva, "la fuente mana");
      ELEMENTOS.beber();
      si(PODERES.tiene("laguz") && ELEMENTOS.estado().fuente, "Laguz es tuya");
      if (A.J.modo === "dialogo" && A.cerrarDialogo) A.cerrarDialogo();
      A.J.modo = "juego";
      const e = traer(A, 100, 0);
      A.jug.hp = A.jug.hpMax * 0.5;
      PODERES.LANZAR.laguz({ golpe: (o, d) => A.CB.golpear(A.J, o, d, A.jug.x, A.jug.y, 0.6), pr: 1, apuntar: () => 0, vivos: () => [e], efectos: [], avisar: () => {} });
      si(e.mojado > 0, "empapada");
      si(A.jug.hp > A.jug.hpMax * 0.54, "cierra heridas");
      e.activo = false;
    } },
    { nombre: "elementos: las seis reacciones, el códice, la quebradura y todo se guarda", fn: async (A, { igual, si }) => {
      const st = ELEMENTOS.estado();
      st.vistas = {};
      st.todas = false;
      const frag0 = PODERES.pj().frag;
      // vapor: agua + fuego
      const a = traer(A, 150, 0, "draugr");
      a.mojado = 5;
      a.quema = 3;
      await esperar(100);
      si(st.vistas.vapor, "vapor");
      igual(a.quema, 0, "se apaga el fuego:");
      // congelada y la quebradura
      const b = traer(A, -150, 0, "draugr");
      b.vida = b.d.vida;
      b.mojado = 5;
      b.helado = 2.8;
      await esperar(100);
      si(st.vistas.congelado && b.congelado > 0, "congelada");
      igual(Math.round(ELEMENTOS.sistema.modDano(10, b)), 16, "el golpe la quiebra:");
      igual(b.congelado, 0, "se quebró:");
      // descarga: corre a las empapadas de cerca
      const c = traer(A, 0, 150),
        d = traer(A, 60, 200);
      c.mojado = d.mojado = 5;
      const vd = d.vida;
      c.electro = 3;
      await esperar(100);
      si(st.vistas.descarga && d.vida < vd, "la descarga llega a la otra empapada");
      // deshielo, estallido y esquirlas
      [["quema", "helado", "deshielo"], ["quema", "electro", "estallido"], ["helado", "electro", "esquirlas"]].forEach(([x, y], k) => {
        const e = traer(A, 400 + k * 300, 400, "draugr");
        e[x] = x === "helado" ? 2.8 : 3;
        e[y] = y === "helado" ? 2.8 : 3;
      });
      await esperar(150);
      si(["deshielo", "estallido", "esquirlas"].every((k) => st.vistas[k]), "las otras tres");
      si(st.todas && PODERES.pj().frag === frag0 + 1, "las seis: un fragmento");
      si(ELEMENTOS.sistema.celdasBolsa().length === 1, "el códice en la Bolsa");
      si(ELEMENTOS.sistema.diario().includes(I18N.t("el.diario_t")), "en el diario");
      A.enemigos.forEach((e) => (e.activo = false));
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(200);
      si(ELEMENTOS.estado().roble && ELEMENTOS.estado().fuente && ELEMENTOS.estado().todas, "quedó guardado");
      si(ELEMENTOS.roble().cosa.o.tomada && ELEMENTOS.fuente().cosa.o.viva && PODERES.tiene("laguz"), "el mundo igual al cargar");
    } },
  );
}
