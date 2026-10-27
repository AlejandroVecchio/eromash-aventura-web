// Pruebas de la curva de experiencia (motor/rpg.js): diferencia de nivel, grupo vencido y cosecha del mismo grupo.
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const enJuego = async (A) => {
    for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "experiencia: la curva se empina y pelear más arriba paga más", fn: async (A, { igual, si }) => {
      igual(RPG.xpPara(1), 100, "de 1 a 2:");
      si(RPG.xpPara(10) > 2300 && RPG.xpPara(29) > 12000, "arriba se gana: " + RPG.xpPara(10) + " / " + RPG.xpPara(29));
      igual(RPG.porDif(-8), 0.1, "gris:");
      igual(RPG.porDif(0), 1, "parejo:");
      si(Math.abs(RPG.porDif(4) - 1.6) < 1e-9, "cuatro arriba ×1,6");
      igual(RPG.porDif(12), 2, "tope ×2:");
    } },
    { nombre: "experiencia: vaciar un grupo da un tercio más, y vaciarlo otra vez el mismo día da menos", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      await enJuego(A);
      const g = HORDAS.grupos.find((q) => !q.unico && q.miembros.length >= 3);
      const vaciar = async () => {
        const st = RPG.estado(),
          antes = st.total;
        g.miembros.forEach((e) => (e.muerto = 0));
        for (const e of g.miembros) {
          RPG.sistema.alMorir(e);
          e.muerto = 1;
        }
        await esperar(1400);
        return st.total - antes;
      };
      // lejos: así el bosque no festeja el campamento liberado (eso da su propia experiencia)
      A.jug.x = g.centro[0] + 9000 > ELDERVALD.ANCHO ? g.centro[0] - 9000 : g.centro[0] + 9000;
      const solos = g.miembros.reduce((n, e) => n + RPG.xpDe(e), 0);
      const x1 = await vaciar();
      si(x1 >= Math.round(solos * 1.3), "con el tercio de más: " + x1 + " (sin él " + solos + ")");
      si(document.getElementById("hudAvisos").textContent.includes(I18N.t("rp.grupo_vencido", [""]).split("·")[0].trim()), "sale el cartel");
      // (puede haber subido de nivel: se compara con lo que valen ahora)
      const solos2 = g.miembros.reduce((n, e) => n + RPG.xpDe(e), 0);
      const x2 = await vaciar();
      const k = x2 / solos2 / (x1 / solos);
      si(Math.abs(k - 0.75) < 0.03, "la segunda vez, un cuarto menos: ×" + k.toFixed(3));
    } },
  );
}
