// Pruebas de las losas deslizantes (motor/mj-losas.js).
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  // el camino más corto (3 × 3) del estado a la tabla armada: la lista de celdas que hay que tocar
  function resolver3(pos) {
    const meta = "0,1,2,3,4,5,6,7,-1",
      ini = pos.join(),
      vino = new Map([[ini, null]]),
      cola = [ini];
    while (cola.length) {
      const k = cola.shift();
      if (k === meta) break;
      const p = k.split(",").map(Number),
        h = p.indexOf(-1);
      [h - 3, h + 3, h % 3 ? h - 1 : -1, h % 3 < 2 ? h + 1 : -1].forEach((c) => {
        if (c < 0 || c > 8) return;
        const q = p.slice();
        [q[h], q[c]] = [q[c], q[h]];
        const qk = q.join();
        if (!vino.has(qk)) vino.set(qk, [k, c]), cola.push(qk);
      });
    }
    const pasos = [];
    for (let k = meta; vino.get(k); k = vino.get(k)[0]) pasos.unshift(vino.get(k)[1]);
    return pasos;
  }
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "losas: la tabla se arma desordenada, siempre tiene solución y avisa al ganar", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      let res = null;
      si(MINIJ.empezar("losas", { semilla: 7, fin: (r) => (res = r) }), "empieza");
      const S = MINIJ.estado();
      igual(S.pos.length, 9, "3 × 3:");
      si(S.pos.some((p, i) => p >= 0 && p !== i), "arranca desordenada");
      const pasos = resolver3(S.pos);
      si(pasos.length > 0, "tiene solución");
      pasos.forEach((c) => MINIJ.tocar(c));
      si(S.pos.every((p, i) => p === i || (p < 0 && i === 8)), "armada");
      await esperar(1100);
      MINIJ.cerrar();
      si(res && res.gano && res.movs === pasos.length, "avisa con las movidas");
    } },
    { nombre: "losas: una tira entera se corre de un toque y las atadas no se mueven", fn: async (A, { igual, si }) => {
      MINIJ.empezar("losas", { variante: "cuatro", semilla: 2 });
      let S = MINIJ.estado();
      S.pos = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, -1];
      MINIJ.tocar(12);
      igual(S.pos.slice(12).join(), "-1,12,13,14", "la tira de tres se corrió:");
      MINIJ.tocar(5);
      igual(S.pos[12], -1, "fuera de la fila o columna no se mueve:");
      MINIJ.cerrar();
      MINIJ.empezar("losas", { variante: "atadas", semilla: 9 });
      S = MINIJ.estado();
      igual(S.atadas.length, 2, "dos atadas:");
      S.atadas.forEach((c) => igual(S.pos[c], c, "la atada quedó en su lugar:"));
      // poner el hueco al lado de una atada y tratar de moverla
      const a = S.atadas[0];
      S.pos = S.pos.map((p) => (p < 0 ? S.pos[a - 4] : p));
      S.pos[a - 4] = -1;
      const antes = S.pos.join();
      MINIJ.tocar(a);
      igual(S.pos.join(), antes, "tocar la atada no hace nada:");
      MINIJ.cerrar();
    } },
    { nombre: "losas: uno de cada cuatro arcones del leñador y la mitad de los cofres del tesoro cierran con losas", fn: async (A, { igual, si }) => {
      igual(SECRETOS.cerrojo({ tipo: "arconLenador", id: 3 }), "losas:base", "arcón:");
      igual(SECRETOS.cerrojo({ tipo: "arconLenador", id: 1 }), "base", "el otro sigue con anillos:");
      si(MINIJ.lista().some((q) => q.tipo === "losas" && q.variante === "gran"), "Probar mecánicas la lista");
    } },
    { nombre: "losas: la pista de Loki corre losas hacia la tabla y alcanza para rearmarla", fn: async (A, { si }) => {
      JUEGO.empezar(9, true);
      const def = MINIJ.JUEGOS.losas;
      for (const v of ["base", "cuatro", "atadas", "gran"]) {
        MINIJ.empezar("losas", { variante: v, semilla: 13 });
        const S = MINIJ.estado(),
          t0 = performance.now();
        let n = 0;
        while (!S.gano && n++ < 200) {
          if (!def.pista(S)) break;
          while (S.cola.length) def.paso.call(def, S, 0.2);
        }
        si(S.gano > 0, v + " rearmada con pistas (" + n + " pistas, " + Math.round(performance.now() - t0) + " ms)");
        MINIJ.cerrar();
      }
    } }
  );
}
