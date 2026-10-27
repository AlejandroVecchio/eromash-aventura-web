// Pruebas de las tierras y sus franjas de niveles (motor/tierras.js).
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const enJuego = async (A) => {
    for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "tierras: cada grupo de criaturas queda dentro de la franja de su tierra", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      await enJuego(A);
      igual(TIERRAS.en(350 * TIERRAS.U(), 800 * TIERRAS.U()).id, "lindes", "el Puesto está en Las Lindes:");
      igual(TIERRAS.en(-50, 50), null, "fuera del mapa no hay tierra:");
      let malos = 0,
        vistos = 0;
      const tierras = new Set();
      A.enemigos.forEach((e) => {
        if (!e.hordaGrupo || e.lider || e.semi || e.patron || e.d.blanco || e.zona) return;
        const c = e.hordaGrupo.centro,
          r = TIERRAS.en(c[0], c[1]);
        if (!r) return;
        vistos++;
        tierras.add(r.id);
        const n = RPG.nivelDe(Object.assign({}, e, { nivel: 0 }));
        if (n < r.n[0] || n > r.n[1]) malos++;
      });
      si(vistos > 20, "hay grupos para mirar (" + vistos + ")");
      si(tierras.size >= 6, "en varias tierras (" + tierras.size + ")");
      igual(malos, 0, "fuera de su franja:");
      // las del fondo del mapa son «?» para un nivel 1
      si(TIERRAS.LISTA.find((r) => r.id === "raices").n[0] >= 11, "las Raíces son «?» a nivel 1");
    } },
    { nombre: "tierras: al entrar sale el nombre y la franja, y el mapa grande las dibuja", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      await enJuego(A);
      const r = TIERRAS.LISTA.find((q) => q.id === "talado");
      A.jug.x = r.c[0] * TIERRAS.U();
      A.jug.y = r.c[1] * TIERRAS.U();
      for (let i = 0; i < 30 && TIERRAS.actual() !== r; i++) await esperar(50);
      igual(TIERRAS.actual(), r, "ahora en El Talado:");
      const txt = document.getElementById("hudAvisos").textContent;
      si(txt.includes(TIERRAS.nombre(r)) && txt.includes(TIERRAS.franja(r)), "el cartel con nombre y niveles: " + txt.slice(0, 80));
      si(TIERRAS.vistas().talado, "queda anotada");
      MAPA.abrir();
      await esperar(80);
      si(document.getElementById("mapaLienzo"), "el mapa abrió");
      A.cerrarMenu();
    } },
  );
}
