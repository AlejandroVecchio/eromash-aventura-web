// Pruebas de los materiales, las vetas y desarmar (motor/materiales.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "materiales: las vetas están en el bosque, son figuras y se pican hasta pelarse", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const vs = MATERIALES.vetas();
      si(vs.length >= 20, "hay vetas repartidas (" + vs.length + ")");
      ["vetaHierro", "vetaAmbar", "vetaRunica"].forEach((k) => si(vs.some((v) => v.tipo === k), "hay " + k));
      igual(ASSETS.sinGiro().filter((k) => k.startsWith("veta")).length, 0, "las vetas aguantan el giro:");
      const v = vs.find((q) => q.tipo === "vetaHierro"),
        antes = MATERIALES.cuantos("hierro");
      A.jug.x = v.cosa.x;
      A.jug.y = v.cosa.y + 60;
      const c = MATERIALES.cercana();
      si(c && c.v === v, "la veta queda cerca para usar con E");
      for (let i = 0; i < MATERIALES.GOLPES; i++) MATERIALES.picar(v, 1);
      si(v.cosa.o.agotada, "pelada después de tres golpes");
      await esperar(900);
      si(MATERIALES.cuantos("hierro") >= antes + 2, "soltó hierro de pantano");
      si(!MATERIALES.cercana() || MATERIALES.cercana().v !== v, "pelada no se puede picar");
      // vuelve a crecer
      MATERIALES.estado().reloj += MATERIALES.VUELVE + 1;
      await esperar(200);
      si(!v.cosa.o.agotada, "volvió a crecer");
    } },
    { nombre: "materiales: desarmar dice antes lo que deja y lo da; lo legendario deja una brasa", fn: async (A, { igual, si }) => {
      const arma = OBJETOS.generar({ base: "espadaAncha", n: 5, r: 0, tema: 1 }),
        leg = OBJETOS.generar({ base: "yelmo" in OBJETOS.BASES ? "yelmo" : Object.keys(OBJETOS.BASES).find((k) => OBJETOS.BASES[k].slot === "casco"), n: 5, r: 3, tema: 1 });
      const da = MATERIALES.deDesarmar(arma);
      si(da.hierro >= 1 && !da.cuero, "un arma da hierro");
      const dl = MATERIALES.deDesarmar(leg);
      si(dl.cuero >= 1 && dl.brasa === 1 && dl.esquirla >= 2, "una legendaria de armadura da cuero, esquirlas y una brasa");
      igual(JSON.stringify(MATERIALES.deDesarmar(leg)), JSON.stringify(dl), "dice siempre lo mismo:");
      BOTIN.dar(leg, { silencio: true });
      const st = BOTIN.estado(),
        b0 = MATERIALES.cuantos("brasa");
      const i = st.bolsa.indexOf(leg);
      BOTIN.desarmar(i); // la primera vez pide confirmar
      BOTIN.desarmar(st.bolsa.indexOf(leg));
      si(!st.bolsa.includes(leg), "se desarmó");
      igual(MATERIALES.cuantos("brasa"), b0 + 1, "la brasa entró:");
      INVENTARIO.abrir("bolsa");
      si(document.querySelectorAll('.inv-celda').length > 0 && MATERIALES.celdas().some((c) => c.id === "mt_brasa"), "la brasa está en la bolsa");
      INVENTARIO.cerrar();
    } },
    { nombre: "materiales: la forja los pide, la brasa abre su modo y dejar a la mitad los devuelve", fn: async (A, { igual, si }) => {
      const c = MATERIALES.costoForja({ tipo: "espada" }, "fuego");
      si(c.hierro >= 1 && c.esquirla === 1, "a fuego vivo pide hierro y una esquirla");
      si(!MATERIALES.costoForja({ tipo: "espada" }, "calma").esquirla, "con calma, sin esquirla");
      si(MATERIALES.costoForja({ slot: "pecho" }, "calma").cuero >= 1, "la armadura pide cuero");
      si(FORJA.MODOS.brasa.bono > 0, "la brasa sube la nota");
      // sin materiales no deja
      const st = MATERIALES.estado();
      MATERIALES.LISTA.forEach((k) => (st.tiene[k] = 0));
      si(!MATERIALES.alcanza(c), "sin materiales no alcanza");
      MATERIALES.dar("hierro", 5);
      MATERIALES.dar("esquirla", 1);
      si(MATERIALES.alcanza(c), "con materiales alcanza");
      MATERIALES.gastar(c);
      FORJA.empezar("espadaAncha", "fuego", 0, c);
      const h = MATERIALES.cuantos("hierro");
      dispatchEvent(new KeyboardEvent("keydown", { code: "Escape" }));
      await esperar(120);
      dispatchEvent(new KeyboardEvent("keyup", { code: "Escape" }));
      await esperar(120);
      si(MATERIALES.cuantos("hierro") > h, "devolvió el hierro al dejar");
      JUEGO.J.modo = "juego";
    } },
    { nombre: "materiales: se guardan con la partida", fn: async (A, { igual }) => {
      MATERIALES.dar("ambar", 3);
      const n = MATERIALES.cuantos("ambar");
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      igual(MATERIALES.cuantos("ambar"), n, "el ámbar sigue:");
    } },
  );
}
