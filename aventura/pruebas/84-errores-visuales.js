// Pruebas de los arreglos visuales que se vieron grabando tomas (2/11/2026): nombres de líderes, bandidos, hora del día y mazmorras.
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "luz: a las 6 ya clarea, a las 22 es noche, y el atardecer tiñe", fn: async (A, { si }) => {
      si(LUZ.noche(6) < 0.25, "a las 6 casi no queda noche: " + LUZ.noche(6).toFixed(2));
      si(LUZ.noche(22) === 1 && LUZ.noche(3) === 1, "de noche cerrada");
      si(LUZ.noche(12) === 0, "a mediodía no hay noche");
      const tiempoDe = (h) => (((h - 9 + 24) % 24) / 24) * LUZ.DIA;
      si(LUZ.ambiente(tiempoDe(18.5), 0, 0).o > 0.9, "a las 18:30 el ocaso está lleno");
      si(LUZ.ambiente(tiempoDe(19), 0, 0).o > 0.6, "a las 19 todavía tiñe");
      si(LUZ.ambiente(tiempoDe(12), 0, 0).o === 0, "a mediodía no");
    } },
    { nombre: "líderes: el nombre no se corta en el borde ni tapa la cabeza de Eromash", fn: async (A, { si }) => {
      JUEGO.empezar(9, true);
      await esperar(300);
      const e = JUEGO.enemigos.find((q) => q.lider && !q.lider.unico && !q.d.dibujo);
      si(e, "hay un líder");
      const cv = document.createElement("canvas");
      cv.width = 400;
      cv.height = 500;
      const c = cv.getContext("2d");
      const textos = [];
      const fill = c.fillText.bind(c);
      c.fillText = (s, x, y) => (textos.push({ s, x, y, w: c.measureText(s).width }), fill(s, x, y));
      // el líder pegado al borde derecho
      const antes = { x: e.x, y: e.y, activo: e.activo, muerto: e.muerto, vida: e.vida };
      Object.assign(e, { activo: true, muerto: 0, vida: e.d.vida });
      c.setTransform(1, 0, 0, 1, 400 - e.x - 4, 420 - e.y);
      COMBATE.dibujar(c, e, 0);
      c.setTransform(1, 0, 0, 1, 0, 0);
      COMBATE.rotulos(c, 400, 500, null);
      const nom = textos.find((q) => q.s === e.lider.nombre);
      si(nom, "se dibujó su nombre");
      si(nom.x + nom.w / 2 <= 400 && nom.x - nom.w / 2 >= 0, "entero dentro del lienzo");
      // con la cabeza de Eromash justo donde caería el nombre, sube por arriba
      textos.length = 0;
      c.setTransform(1, 0, 0, 1, 200 - e.x, 420 - e.y);
      COMBATE.dibujar(c, e, 0);
      c.setTransform(1, 0, 0, 1, 0, 0);
      const libre = textos.length; // (las barras y señales no son texto del nombre)
      COMBATE.rotulos(c, 400, 500, null);
      const solo = textos.slice(libre).find((q) => q.s === e.lider.nombre);
      textos.length = 0;
      c.setTransform(1, 0, 0, 1, 200 - e.x, 420 - e.y);
      COMBATE.dibujar(c, e, 0);
      c.setTransform(1, 0, 0, 1, 0, 0);
      COMBATE.rotulos(c, 400, 500, [170, solo.y - 30, 230, solo.y + 30]);
      const arriba = textos.find((q) => q.s === e.lider.nombre);
      si(arriba.y < solo.y - 30, "con la cabeza debajo, el nombre sube: " + solo.y.toFixed(0) + " → " + arriba.y.toFixed(0));
      Object.assign(e, antes);
    } },
    { nombre: "bandidos: ninguno lleva el rojo de Eromash", fn: async (A, { si }) => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 200;
      const c = cv.getContext("2d");
      for (const tipo of ["bandido", "arquero"])
        for (let pal = 0; pal < 3; pal++)
          for (const vista of ["S", "E", "N"]) {
            c.clearRect(0, 0, 200, 200);
            CRIATURAS.dibujar(c, tipo, 100, 170, 0, { vista, pal, mov: 0, golpe: 0, herido: 0, s: 1, sem: 1 });
            const d = c.getImageData(0, 0, 200, 200).data;
            let rojos = 0;
            for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 250 && ((d[i] === 156 && d[i + 1] === 35 && d[i + 2] === 21) || (d[i] === 94 && d[i + 1] === 19 && d[i + 2] === 13))) rojos++;
            si(rojos < 20, tipo + " " + pal + " " + vista + " sin el rojo del casco: " + rojos);
          }
    } },
    { nombre: "mazmorras: la sombra de las paredes se arma al entrar", fn: async (A, { si }) => {
      JUEGO.empezar(9, true);
      await esperar(200);
      ZONAS.entrar("cripta");
      await esperar(1500);
      const Z = ZONAS.aqui();
      si(Z && Z.sombraCv && Z.sombraCv.cv.width > 0, "la sombra está armada");
    } }
  );
}
