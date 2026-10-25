// Pruebas de las hierbas y la alquimia (motor/alquimia.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "alquimia: las seis hierbas crecen por el bosque, se juntan y vuelven a crecer", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const pl = ALQUIMIA.plantas();
      si(pl.length > 40, "muchas plantas (" + pl.length + ")");
      Object.keys(ALQUIMIA.HIERBAS).forEach((tp) => si(pl.some((p) => p.tipo === tp), "hay " + tp));
      si(ALQUIMIA.mesa(), "la mesa está");
      const p = pl.find((q) => q.tipo === "serbal");
      ALQUIMIA.juntar(p);
      si(ALQUIMIA.estado().hierbas.serbal >= 1, "juntó serbal");
      si(p.cosa.o.cosechada, "queda cortada");
      ALQUIMIA.estado().reloj += 500;
      ALQUIMIA.sistema.actualizar(1.1);
      si(!p.cosa.o.cosechada, "a los 8 minutos vuelve");
    } },
    { nombre: "alquimia: destilar, tomar con toxicidad y untar un aceite que suma contra su familia", fn: async (A, { igual, si }) => {
      const st = ALQUIMIA.estado();
      Object.assign(st.hierbas, { musgo: 9, serbal: 9, abedul: 9, escarcha: 9, luna: 9, cardo: 9 });
      si(ALQUIMIA.destilar("pocion", "oso"), "destila Sangre de oso");
      si(ALQUIMIA.destilar("pocion", "oso"), "y otra");
      si(ALQUIMIA.destilar("pocion", "mimir"), "y Mímir");
      igual(st.hierbas.musgo, 5, "gastó el musgo:");
      const arm0 = RPG.stats().armadura;
      si(ALQUIMIA.tomar("oso"), "toma");
      igual(Math.round(RPG.stats().armadura - arm0), 20, "+20 de armadura:");
      si(ALQUIMIA.tomar("oso"), "toma otra (70 de toxicidad)");
      si(!ALQUIMIA.tomar("mimir"), "con 110 no se puede");
      si(ALQUIMIA.destilar("aceite", "ceniza"), "destila aceite");
      si(ALQUIMIA.untar("ceniza"), "lo unta");
      igual(Math.round(ALQUIMIA.sistema.modDano(100, { tipo: "draugr", d: {} })), 125, "+25 % contra draugr:");
      igual(Math.round(ALQUIMIA.sistema.modDano(100, { tipo: "lobo", d: {} })), 100, "nada contra lobos:");
      ALQUIMIA.sistema.alPegar({ tipo: "draugr", d: {} });
      igual(st.aceite.golpes, 39, "gasta un golpe:");
      st.efectos.oso = 0.1;
      ALQUIMIA.sistema.actualizar(0.2);
      igual(Math.round(RPG.stats().armadura), Math.round(arm0), "al terminar se va:");
    } },
    { nombre: "alquimia: la mesa abre su pestaña y la Bolsa muestra hierbas y pociones", fn: async (A, { igual, si }) => {
      ALQUIMIA.abrirMesa();
      await esperar(100);
      igual(INVENTARIO.actual(), "alquimia", "abre la alquimia:");
      igual(document.querySelectorAll(".inv-rejilla .inv-celda").length, 5 + 4 + 6, "recetas e hierbas:");
      INVENTARIO.cerrar();
      INVENTARIO.abrir("bolsa");
      const n = ALQUIMIA.sistema.celdasBolsa().length;
      si(n >= 6, "hierbas, pociones y aceites en la Bolsa (" + n + ")");
      si(document.querySelectorAll(".inv-celda").length >= n + 2, "y se dibujan");
      INVENTARIO.cerrar();
      A.H.guardar(9);
    } },
    { nombre: "alquimia: destilar en el matraz, atrapar motas buenas y malas y la efectividad del frasco", fn: async (A, { igual, si }) => {
      const st = ALQUIMIA.estado();
      Object.assign(st.hierbas, { musgo: 9, serbal: 9 });
      st.pociones.tonico = 0;
      st.ef = {};
      st.tox = 0;
      const pocion0 = st.pociones.tonico;
      si(ALQUIMIA.enMatraz("pocion", "tonico"), "empieza el matraz");
      igual(A.J.modo, "matraz", "modo matraz:");
      igual(st.hierbas.serbal, 7, "las hierbas se gastan al empezar:");
      const S = MATRAZ.estado();
      igual(S.pide.serbal, 6, "pide 3 motas por hierba:");
      // una mota buena y una mala que caen justo en la boca
      const caer = (tipo) => {
        S.motas.length = 0;
        S.motas.push({ tipo, x: S.mx, y: 520, v: 300, fase: 0, giro: 0, s: 14 });
        S.cae = 99;
        MATRAZ.paso(0.1);
      };
      caer("serbal");
      igual(S.tiene.serbal, 1, "la buena entra:");
      caer("cardo");
      igual(S.malas, 1, "la de otra hierba ensucia:");
      caer("podrida");
      igual(S.malas, 2, "la podredumbre también:");
      for (let i = 0; i < 4; i++) caer("serbal");
      caer("serbal");
      caer("musgo");
      caer("musgo");
      caer("musgo");
      si(S.fin, "con todo lo que pide, termina");
      igual(S.fin.ef, 76, "100 % menos 12 por cada sucia:");
      await new Promise((r) => setTimeout(r, 30));
      S.fin.t = 1;
      MATRAZ.cerrar();
      igual(st.pociones.tonico, pocion0 + 1, "queda el frasco:");
      igual(st.ef["pocion:tonico"][0], 76, "con su efectividad:");
      si(INVENTARIO.abierta(), "y vuelve a la mesa");
      INVENTARIO.cerrar();
      si(ALQUIMIA.destilar("pocion", "oso", 50), "sin jugar, con la efectividad pasada");
      const arm0 = RPG.stats().armadura;
      st.tox = 0;
      si(ALQUIMIA.tomar("oso"), "toma la de 50 %");
      igual(Math.round(RPG.stats().armadura - arm0), 10, "suma la mitad:");
      st.efectos = {};
      RPG.recalcular();
      // terminar antes (Esc) con lo que haya
      Object.assign(st.hierbas, { luna: 3, escarcha: 3 });
      ALQUIMIA.enMatraz("pocion", "buho");
      MATRAZ.terminar();
      igual(MATRAZ.estado().fin.ef, 20, "sin nada juntado, el mínimo:");
      MATRAZ.estado().fin.t = 1;
      MATRAZ.cerrar();
      INVENTARIO.cerrar();
      igual(A.J.modo, "juego", "y vuelve al juego:");
    } },
  );
}
