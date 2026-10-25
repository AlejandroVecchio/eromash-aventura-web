// Pruebas del descanso (motor/descanso.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const llegar = async (A, x, y) => {
    A.teletransportar(x, y);
    await esperar(700);
    for (let i = 0; i < 60 && A.J.modo !== "juego"; i++) await esperar(100);
  };
  const terminar = async (A) => {
    for (let i = 0; i < 80 && DESCANSO.rato(); i++) await esperar(100);
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "descanso: hay petates junto a los fogones y el menú de la fogata suma «Descansar»", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const ps = DESCANSO.petates();
      si(ps.length >= 3, "petates (" + ps.length + ")");
      si(ps.every((p) => p.cosa.id === "petateEromash"), "con su asset");
      const pu = ps.find((p) => p.id === "fogon");
      si(DESCANSO.enRefugio(pu.cosa.x, pu.cosa.y), "el del Puesto está en un refugio");
      const f = pu.fogon;
      await llegar(A, f.x + 40, f.y + 90);
      COCINA.menuFogata();
      await esperar(80);
      const txt = document.body.innerText;
      si(txt.indexOf(I18N.t("ds.boton_fogata")) >= 0, "el botón en el menú del fuego");
      A.cerrarMenu();
    } },
    { nombre: "descanso: pasar la noche en el Puesto llena todo, revive el bosque y deja bien descansado", fn: async (A, { igual, si }) => {
      const st = DESCANSO.estado();
      const pu = DESCANSO.petates().find((p) => p.id === "fogon");
      // matar un grupo lejos
      const g = HORDAS.grupos.find((q) => !q.unico && Math.hypot(q.centro[0] - pu.cosa.x, q.centro[1] - pu.cosa.y) > 3000);
      g.miembros.forEach((e) => (e.muerto = 1));
      g.muerto = A.H.E.tiempo;
      A.jug.hp = 10;
      FRASCO.estado().cargas = 0;
      ALQUIMIA.estado().tox = 60;
      // a las 21 h
      A.H.E.tiempo = Math.ceil(A.H.E.tiempo / LUZ.DIA) * LUZ.DIA + ((21 - 9 + 24) % 24) / 24 * LUZ.DIA;
      const xp0 = RPG.stats().xp;
      si(DESCANSO.empezar(9, { x: pu.cosa.x, y: pu.cosa.y }), "empieza");
      igual(A.J.modo, "cine", "el tiempo corre:");
      si(document.querySelector("#descanso:not(.oculto)"), "el reloj");
      await terminar(A);
      igual(Math.round(LUZ.hora(A.H.E.tiempo)), 6, "despierta al alba:");
      igual(A.jug.hp, A.jug.hpMax, "vida llena:");
      igual(FRASCO.estado().cargas, FRASCO.estado().max, "frasco lleno:");
      igual(ALQUIMIA.estado().tox, 0, "sin toxinas:");
      si(g.miembros.every((e) => !e.muerto), "el grupo lejano volvió");
      igual(st.k, 0.15, "en un refugio +15 %:");
      si(Math.abs(RPG.stats().xp - xp0 * 1.15) < 0.01, "suma a la experiencia");
      si(st.suenos >= 1, "soñó");
      igual(st.veces, 1, "un descanso:");
      si(DESCANSO.sistema.efectosHud().length === 1, "la tira de efectos");
      await esperar(2800);
      if (A.J.modo === "dialogo") A.J.modo = "juego";
    } },
    { nombre: "descanso: al aire libre de noche puede venir una manada; con enemigos cerca no se descansa", fn: async (A, { igual, si }) => {
      const st = DESCANSO.estado();
      st.descansado = 0;
      // buscar una noche y un lugar donde la semilla trae manada
      const sitio = { x: A.W.LUGARES.tala.p[0] + 900, y: A.W.LUGARES.tala.p[1], seguro: false };
      let dia = Math.ceil(A.H.E.tiempo / LUZ.DIA);
      for (let k = 0; k < 60; k++, dia++) {
        const r = DIB.azar(dia * 131 + Math.round(sitio.x / 100) * 7 + Math.round(sitio.y / 100))();
        if (r < DESCANSO.EMBOSCADA) break;
      }
      await llegar(A, sitio.x, sitio.y);
      A.H.E.tiempo = dia * LUZ.DIA + ((21 - 9 + 24) % 24) / 24 * LUZ.DIA;
      const n0 = A.enemigos.length;
      si(DESCANSO.empezar(9, sitio), "empieza afuera");
      await terminar(A);
      const h = LUZ.hora(A.H.E.tiempo);
      si(h > 21 || h < 5, "se cortó de noche (" + h.toFixed(1) + ")");
      igual(A.enemigos.length - n0, 3, "tres lobos:");
      si(A.enemigos.slice(-3).every((e) => e.emboscada && e.estado === "persigue"), "que vienen");
      igual(st.descansado, 0, "no queda bien descansado:");
      si(!DESCANSO.empezar(2, sitio), "con la manada cerca no se puede");
      A.enemigos.slice(-3).forEach((e) => (e.muerto = 1));
      A.H.guardar(9);
    } },
  );
}
