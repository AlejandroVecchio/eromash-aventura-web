// Pruebas de los desafíos del mundo (motor/desafios.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "desafíos: una guarida vaciada ofrece su eco, 4 niveles más fuerte, y vencerlo paga una vez por día", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const g = HORDAS.grupos.find((x) => !x.unico && x.fam !== "bandidos" && x.fam !== "aranas" && x.miembros.some((e) => e.lider));
      const lider0 = g.miembros.find((e) => e.lider),
        n0 = RPG.nivelDe(lider0);
      si(!DESAFIOS.sitios().some((s) => s.id === "g" + g.id), "con el grupo vivo no hay desafío");
      g.miembros.forEach((e) => ((e.muerto = 1), (e.vida = 0)));
      const s = DESAFIOS.sitios().find((x) => x.id === "g" + g.id);
      si(s, "vaciada, ofrece el desafío");
      A.jug.x = s.x;
      A.jug.y = s.y + 100;
      const nG = HORDAS.grupos.length;
      si(DESAFIOS.empezar(s), "empieza");
      igual(HORDAS.grupos.length, nG + 1, "vuelve un eco:");
      const eco = DESAFIOS.activo().g,
        l1 = eco.miembros.find((e) => e.lider);
      si(l1, "con su líder");
      const dn = RPG.nivelDe(l1) - n0;
      si(dn >= 3 && dn <= 5, "unos 4 niveles más: " + dn);
      si(!DESAFIOS.empezar(s), "uno por vez");
      const pj = PODERES.pj(),
        p0 = pj.plata;
      eco.miembros.forEach((e) => ((e.muerto = 1), (e.vida = 0)));
      await esperar(300);
      si(!DESAFIOS.activo(), "vencido");
      si(pj.plata > p0, "pagó plata");
      igual(DESAFIOS.estado().hechos, 1, "cuenta:");
      await esperar(3300);
      si(!HORDAS.grupos.includes(eco), "el eco se va y no vuelve");
      si(!DESAFIOS.empezar(s), "hoy ya no");
    } },
    { nombre: "desafíos: si se acaba el tiempo el eco se deshace sin premio", fn: async (A, { igual, si }) => {
      const g = HORDAS.grupos.find((x) => !x.unico && x.fam !== "bandidos" && x.fam !== "aranas" && DESAFIOS.estado().dia["g" + x.id] == null && x.miembros.length);
      g.miembros.forEach((e) => ((e.muerto = 1), (e.vida = 0)));
      const s = DESAFIOS.sitios().find((x) => x.id === "g" + g.id);
      A.jug.x = s.x;
      A.jug.y = s.y + 100;
      si(DESAFIOS.empezar(s), "empieza");
      const eco = DESAFIOS.activo().g,
        h0 = DESAFIOS.estado().hechos;
      DESAFIOS.activo().t = 0.01;
      await esperar(300);
      si(!DESAFIOS.activo(), "terminó");
      igual(DESAFIOS.estado().hechos, h0, "sin premio:");
      si(!HORDAS.grupos.includes(eco) && !A.enemigos.includes(eco.miembros[0]), "el eco se fue");
    } }
  );
}
