// Pruebas de los vættir (motor/vaettir.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const hogar = (id) => VAETTIR.hogares.find((h) => h.v.id === id);
  const pararAl = (A, h, d = 120) => {
    A.jug.x = h.x;
    A.jug.y = h.y + d;
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "vaettir: seis hogares repartidos junto a los caminos, van al mapa al encontrarlos", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      A.enemigos.forEach((e) => (e.activo = false));
      const H = VAETTIR.hogares;
      igual(H.length, 6, "seis hogares:");
      igual(new Set(H.map((h) => h.cosa.id)).size, 6, "cada uno con su asset:");
      for (let i = 0; i < H.length; i++) for (let j = i + 1; j < H.length; j++) si(Math.hypot(H[i].x - H[j].x, H[i].y - H[j].y) >= 3000, "repartidos " + i + "-" + j);
      si(H.every((h) => A.W.CAMINOS.some((c) => A.W.distLinea(h.x, h.y, c.p) < c.w / 2 + 700)), "cerca de un camino");
      igual(VAETTIR.sistema.marcasMapa().length, 0, "sin encontrar no están en el mapa:");
      const h = hogar("manantial");
      pararAl(A, h, 400);
      await esperar(120);
      si(VAETTIR.estado().vistos.manantial, "lo encontró");
      igual(VAETTIR.sistema.marcasMapa().length, 1, "ahora en el mapa:");
      pararAl(A, h);
      await esperar(80);
      si(A.J.cerca && A.J.cerca.texto && A.J.cerca.texto.includes(I18N.t("vt.manantial")), "se ofrenda con E");
    } },
    { nombre: "vaettir: lo que no quiere lo devuelve, lo que quiere sube el favor y con tres se muestra y bendice", fn: async (A, { igual, si }) => {
      const h = hogar("manantial");
      pararAl(A, h);
      MATERIALES.dar("hierro", 2);
      MATERIALES.dar("ambar", 3);
      const hierro = MATERIALES.cuantos("hierro"),
        ambar = MATERIALES.cuantos("ambar");
      igual(VAETTIR.ofrecer(h, "hierro"), false, "el hierro no:");
      igual(MATERIALES.cuantos("hierro"), hierro, "lo devolvió:");
      igual(VAETTIR.favor("manantial"), 0, "sin favor:");
      igual(VAETTIR.ofrecer(h, "ambar"), true, "el ámbar sí:");
      igual(VAETTIR.favor("manantial"), 1, "favor 1:");
      igual(MATERIALES.cuantos("ambar"), ambar - 1, "lo gastó:");
      const frag = PODERES.pj().frag;
      VAETTIR.ofrecer(h, "ambar");
      VAETTIR.ofrecer(h, "ambar");
      si(VAETTIR.bendice("manantial"), "bendice");
      igual(VAETTIR.ofrecer(h, "ambar"), false, "no pide más:");
      await esperar(1500);
      si(h.figura.o.a > 0.6, "se muestra");
      si((PODERES.pj().frag) > frag, "regaló un fragmento");
      // su don: la vida vuelve sola en su tierra
      igual(VAETTIR.tierra(), h, "en su tierra:");
      A.jug.hp = A.jug.hpMax * 0.5;
      const hp0 = A.jug.hp;
      await esperar(500);
      si(A.jug.hp > hp0 + 1, "la vida vuelve: " + (A.jug.hp - hp0).toFixed(1));
      si(VAETTIR.sistema.efectosHud().length === 1, "se ve en el HUD");
      // lejos, nada
      A.jug.x = h.x + VAETTIR.TIERRA + 500;
      await esperar(60);
      si(VAETTIR.tierra() !== h, "fuera de su tierra");
    } },
    { nombre: "vaettir: cada don hace lo suyo, los seis dan amigo de los vættir y se guarda", fn: async (A, { igual, si }) => {
      VAETTIR.LISTA.forEach((v) => (VAETTIR.estado().favor[v.id] = VAETTIR.FAVOR));
      const e = { d: {}, tipo: "lobo", x: 0, y: 0 };
      pararAl(A, hogar("tumulo"));
      igual(Math.round(VAETTIR.sistema.modDano(100, e)), 110, "Haugi: pega más:");
      igual(VAETTIR.sistema.modRecibido(100), 100, "Haugi no protege:");
      pararAl(A, hogar("piedra"));
      igual(Math.round(VAETTIR.sistema.modRecibido(100)), 90, "Gata: recibe menos:");
      pararAl(A, hogar("tocon"));
      A.jug.sta = 0;
      await esperar(300);
      si(A.jug.sta > 1, "Stubbi: la estamina vuelve");
      // amigo: al mostrarse el último
      VAETTIR.estado().favor.buho = 2;
      MATERIALES.dar("seda", 1);
      VAETTIR.ofrecer(hogar("buho"), "seda");
      si(VAETTIR.estado().amigo, "amigo de los vættir");
      si(VAETTIR.sistema.diario().includes(I18N.t("vt.titulo")), "en el diario");
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(150);
      si(VAETTIR.estado().amigo && VAETTIR.bendice("tumulo"), "quedó guardado");
      si(hogar("tumulo").figura.o.a === 1, "se sigue mostrando");
    } },
  );
}
