// Pruebas de la hoja de Eromash y los topes del balance (interfaz/hoja.js, motor/rpg.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  let prueba = null; // el aporte de prueba: solo suma mientras esto no es null
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "hoja: cada sistema que suma a Eromash dice quién es y el desglose cierra con el valor final", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      const quienes = RPG.aportes();
      si(quienes.length >= 16, "aportes: " + quienes.length);
      igual(quienes.filter((q) => q === "otros").length, 0, "ninguno sin nombre:");
      quienes.concat(["nivel"]).forEach((q) => si(I18N.t("hj.de_" + q) !== "hj.de_" + q, "nombre de " + q));
      RPG.recalcular();
      const D = RPG.desglose();
      // daño: base × cada parte (y el recorte) = lo que queda en J.mulDano
      const prod = D.dano.partes.reduce((m, p) => m * p.k, D.dano.base) + D.dano.recorte;
      si(Math.abs(prod - A.J.mulDano) < 1e-6, "el daño cierra " + [prod, A.J.mulDano]);
      const suma = D.vida.partes.reduce((m, p) => m + p.dif, D.vida.base) + D.vida.recorte;
      igual(Math.round(suma), A.jug.hpMax, "la vida cierra:");
    } },
    { nombre: "hoja: lo que suman los sistemas pasa por el tope (lo de más vale la mitad) y el núcleo no", fn: async (A, { igual, si }) => {
      RPG.aporte((s) => prueba && prueba(s), "otros");
      const d0 = A.J.mulDano,
        b0 = RPG.desglose().dano.bonoX;
      // un bono enorme de daño: el total de bonos queda en 1,75 + la mitad de lo que sobra
      prueba = (s) => (s.dano *= 3);
      RPG.recalcular();
      const bx = b0 * 3,
        ef = bx > 1.75 ? 1.75 + (bx - 1.75) * 0.5 : bx;
      si(Math.abs(A.J.mulDano - (d0 / b0) * ef) < 1e-6, "topado " + [A.J.mulDano, (d0 / b0) * ef]);
      si(RPG.desglose().dano.recorte < 0, "anota el recorte");
      // el crítico nunca pasa del 60 %
      prueba = (s) => (s.crit += 2);
      RPG.recalcular();
      igual(A.J.critProb, RPG.CRIT_MAX, "crítico al tope:");
      // la armadura de los sistemas: +120 enteros, lo de más a la mitad
      prueba = (s) => (s.armadura += 400);
      RPG.recalcular();
      const D = RPG.desglose().armadura;
      si(Math.abs(D.final - (D.base + D.bonoMas - (D.bonoMas - 120) * 0.5)) < 1e-6 || D.bonoMas <= 120, "armadura topada " + [D.final, D.bonoMas]);
      prueba = null;
      RPG.recalcular();
      si(Math.abs(A.J.mulDano - d0) < 1e-6, "sin el bono vuelve");
    } },
    { nombre: "hoja: la pestaña Hoja muestra cada estadística, su desglose y la tabla entera", fn: async (A, { igual, si }) => {
      A.jug.x += 0;
      INVENTARIO.abrir("hoja");
      await esperar(150);
      igual(INVENTARIO.actual(), "hoja", "abierta:");
      const celdas = document.querySelectorAll("#inventario .inv-celda");
      igual(celdas.length, RPG.CLAVES.length, "una casilla por estadística:");
      igual(document.querySelectorAll("#inventario .hj-tabla tr").length, RPG.CLAVES.length, "la tabla:");
      celdas[2].dispatchEvent(new Event("focus"));
      await esperar(50);
      const det = document.querySelector("#inventario .inv-detalle p").innerHTML;
      si(det.includes("hj-base") && det.includes(I18N.t("hj.tope", ["×1,75"]).slice(0, 10)), "el daño muestra su base y su tope");
      // con nivel, el nivel aparece como parte
      RPG.dar(RPG.xpPara(1) + RPG.xpPara(2), A.jug.x, A.jug.y);
      si(HOJA.detalle("dano").includes(I18N.t("hj.de_nivel")), "el nivel suma");
      si(HOJA.detalle("armadura").includes("%"), "la armadura dice cuánto frena");
      INVENTARIO.cerrar();
    } },
  );
}
