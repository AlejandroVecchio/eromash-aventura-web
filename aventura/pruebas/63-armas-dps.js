// Pruebas del balance de las armas y su daño por segundo (motor/armas.js, ARMAS.dps).
{
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "armas: el daño por segundo de cada tipo queda en su franja y cada arma lo muestra", fn: async (A, { igual, si }) => {
      const O = OBJETOS,
        dps = (b) => ARMAS.dps(O.generar({ base: b, r: 0, n: 1, rnd: O.azar(3) }));
      const espada = dps("espadaHierro");
      si(espada > 30, "la espada: " + espada.toFixed(1));
      // las de una mano, cerca de la espada; las que pegan a muchos o de lejos, abajo; ninguna se dispara
      const fila = { hachaMano: [0.95, 1.2], mazo: [0.95, 1.2], lanzaHoja: [0.8, 1.1], mandoble: [0.8, 1.05], hachaDanesa: [0.8, 1.1], arcoCorto: [0.6, 0.85], varaFresno: [0.5, 0.75] };
      for (const b in fila) {
        const k = dps(b) / espada;
        si(k >= fila[b][0] && k <= fila[b][1], b + " ×" + k.toFixed(2) + " de la espada");
      }
      const it = O.generar({ base: "hachaMano", r: 0, n: 1, rnd: O.azar(5) });
      si(O.lineas(it).some((l) => l.txt.includes(String(Math.round(ARMAS.dps(it))))), "la pieza lo dice: " + O.lineas(it).map((l) => l.txt).join(" | "));
    } },
  );
}
