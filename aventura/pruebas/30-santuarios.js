// Pruebas de los hörgar de los dioses (motor/santuarios.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "santuarios: siete hörgar junto a los caminos, separados y en el mapa", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const h = SANTUARIOS.horgar();
      igual(Object.keys(h).length, 7, "siete:");
      Object.keys(h).forEach((id) => {
        si(h[id].id === "horgr" && h[id].o.dios === id, "el de " + id);
        const L = SANTUARIOS.LISTA[id].p;
        si(Math.hypot(h[id].x - L[0] * A.W.U, h[id].y - L[1] * A.W.U) < 1500, id + " cerca de su lugar");
      });
      const ids = Object.keys(h);
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) si(Math.hypot(h[ids[i]].x - h[ids[j]].x, h[ids[i]].y - h[ids[j]].y) > 1500, "separados " + ids[i] + "/" + ids[j]);
      igual(SANTUARIOS.sistema.marcasMapa().length, 7, "siete marcas:");
    } },
    { nombre: "santuarios: la bendición suma, se reemplaza, la ofrenda la hace más fuerte y una vez por día", fn: async (A, { igual, si }) => {
      const st = SANTUARIOS.estado();
      RPG.recalcular();
      const d0 = A.J.mulDano;
      si(SANTUARIOS.bendecir("thor", false), "Thor bendice");
      si(Math.abs(A.J.mulDano / d0 - 1.15) < 0.001, "+15 % de daño");
      si(!SANTUARIOS.bendecir("thor", false), "una vez por día");
      st.bend = null;
      RPG.recalcular();
      const a0 = A.J.armadura;
      PODERES.pj().plata = 10;
      si(!SANTUARIOS.bendecir("frigg", true), "sin plata no ofrenda");
      PODERES.pj().plata = 100;
      si(SANTUARIOS.bendecir("frigg", true), "Frigg con ofrenda");
      igual(PODERES.pj().plata, 100 - SANTUARIOS.OFRENDA, "cobró la ofrenda:");
      si(Math.abs(A.J.armadura - a0 - 22.5) < 0.01, "+15 × 1,5 de armadura");
      igual(st.bend.dios, "frigg", "reemplaza a la de Thor:");
      igual(SANTUARIOS.sistema.efectosHud().length, 1, "en el HUD:");
      st.bend.t = 0.05;
      await esperar(200);
      si(!st.bend, "se termina");
      igual(Math.round(A.J.armadura), Math.round(a0), "y deja de sumar:");
      // al otro día vuelve a bendecir
      A.H.E.tiempo += LUZ.DIA;
      si(SANTUARIOS.bendecir("thor", false), "mañana sí");
      st.bend = null;
      RPG.recalcular();
    } },
    { nombre: "santuarios: tocarlo lo encuentra y los siete dan el favor de los Æsir", fn: async (A, { igual, si }) => {
      const st = SANTUARIOS.estado(),
        h = SANTUARIOS.horgar().odin;
      A.teletransportar(h.x, h.y + 100);
      for (let i = 0; i < 60 && A.J.modo !== "juego"; i++) await esperar(100);
      await esperar(100);
      const c = A.J.cerca;
      si(c && c.fn, "algo para usar cerca");
      const xp0 = RPG.estado().total;
      if (c && c.fn) c.fn();
      await esperar(80);
      si(st.vistos.odin, "encontrado");
      si(RPG.estado().total > xp0, "dio experiencia");
      A.cerrarMenu();
      const v0 = A.jug.hpMax;
      Object.keys(SANTUARIOS.LISTA).forEach((id) => SANTUARIOS.hallar(id));
      si(SANTUARIOS.aesir(), "los siete");
      si(A.jug.hpMax > v0, "más vida para siempre");
      SANTUARIOS.bendecir("njord", false);
      igual(st.bend.t, SANTUARIOS.DURA_AESIR, "dura más:");
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(100);
      si(SANTUARIOS.estado().bend && SANTUARIOS.estado().bend.dios === "njord", "se guarda la bendición");
      SANTUARIOS.estado().bend = null;
      RPG.recalcular();
      A.H.guardar(9);
    } },
  );
}
