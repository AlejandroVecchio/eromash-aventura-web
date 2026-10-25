// Pruebas del botín y el equipo (equipo/objetos.js, equipo/arte.js, motor/botin.js).
(window.PRUEBAS = window.PRUEBAS || []).push(
  { nombre: "botin: rarezas, afijos y nombres que concuerdan", fn: async (A, { igual, si }) => {
    const O = OBJETOS;
    for (let k = 0; k < 200; k++) {
      const it = O.generar({ n: 1 + (k % 30), rnd: O.azar(k + 1) });
      const R = O.RAREZAS[it.r];
      si(it.a.length >= R.afijos[0] && it.a.length <= R.afijos[1], "cantidad de afijos de " + R.id + ": " + it.a.length);
      si(new Set(it.a.map((q) => q[0])).size === it.a.length, "no repite estadística");
      si(O.nombre(it).length > 2, "tiene nombre");
      const B = O.BASES[it.b];
      si(it.a.every((q) => O.AFIJOS[q[0]].en.includes(B.slot)), "cada afijo puede ir en " + B.slot);
    }
    const leg = O.generar({ n: 10, r: 3, rnd: O.azar(3) });
    igual(leg.a.length, 5, "las legendarias traen 5 afijos:");
    const cota = { b: "cotaMalla", r: 1, n: 5, a: [["vida", 10]], nm: ["vida", "fue"] };
    igual(O.nombre(cota), "Cota de malla robusta del Oso", "concuerda en femenino:");
    const botas = { b: "botasCuero", r: 1, n: 5, a: [["danoP", 5]], nm: ["armadura", ""] };
    igual(O.nombre(botas), "Botas de cuero reforzadas", "concuerda en plural:");
    I18N.setLang("en");
    igual(O.nombre(cota), "Sturdy Mail Shirt of the Bear", "en inglés:");
    igual(O.nombre({ b: "sable", r: 2, n: 5, a: [], nm: [0, 0] }), "Winter Fang", "rara en inglés:");
    I18N.setLang("es");
    igual(O.nombre({ b: "sable", r: 2, n: 5, a: [], nm: [0, 0] }), "Colmillo del Invierno", "rara en español:");
  } },
  { nombre: "botin: se arranca con la espada del forastero", fn: async (A, { igual, si }) => {
    JUEGO.empezar(9, true);
    const arma = BOTIN.puesta("arma");
    si(arma, "tiene arma");
    igual(OBJETOS.nombre(arma), "Espada del forastero", "nombre:");
    igual(arma.d, 10, "daño 10:");
    igual(BOTIN.estado().bolsa.length, 0, "bolsa vacía:");
  } },
  { nombre: "botin: equipar cambia las estadísticas y lo de antes vuelve a la bolsa", fn: async (A, { igual, si }) => {
    const d0 = A.J.mulDano,
      a0 = A.J.armadura;
    const espada = OBJETOS.generar({ base: "espadaAncha", r: 0, n: 1, rnd: OBJETOS.azar(5) });
    espada.d = 20;
    BOTIN.dar(espada, { silencio: true });
    BOTIN.equipar(0);
    si(Math.abs(A.J.mulDano / d0 - 2) < 0.001, "daño 20 = el doble que la de 10");
    igual(OBJETOS.nombre(BOTIN.estado().bolsa[0]), "Espada del forastero", "la vieja volvió a la bolsa:");
    const coraza = OBJETOS.generar({ base: "coraza", r: 0, n: 1, rnd: OBJETOS.azar(6) });
    BOTIN.dar(coraza, { silencio: true });
    BOTIN.equipar(1);
    igual(A.J.armadura, a0 + coraza.ar, "la armadura sube:");
    const cmp = BOTIN.comparar(BOTIN.estado().bolsa[0]);
    si(cmp.some(([k, v]) => k === "dano" && v < 0), "comparar dice que la del forastero pega menos");
    BOTIN.quitar("pecho");
    igual(A.J.armadura, a0, "al sacarla vuelve:");
  } },
  { nombre: "botin: los atributos del equipo suman a los atributos", fn: async (A, { igual }) => {
    const v0 = ATRIBUTOS.valor("vig"),
      vida0 = A.jug.hpMax;
    const anillo = { u: "prueba-anillo", b: "anillo", r: 1, n: 3, a: [["vig", 4]], nm: ["", "vig"], tema: 1, v: 0 };
    BOTIN.dar(anillo, { silencio: true });
    BOTIN.equipar(BOTIN.estado().bolsa.indexOf(anillo));
    igual(ATRIBUTOS.valor("vig"), v0 + 4, "vigor +4:");
    igual(A.jug.hpMax, vida0 + 20, "4 de vigor = +20 de vida:");
  } },
  { nombre: "botin: los únicos sueltan siempre, se ve en el piso y se junta con E", fn: async (A, { igual, si, esperar }) => {
    const st = BOTIN.estado();
    st.suelo.length = 0;
    const antes = st.bolsa.length;
    BOTIN.alMorir({ x: A.jug.x + 30, y: A.jug.y, tipo: "lobo", lider: { unico: true }, d: {}, nivel: 6 });
    await esperar(1.6);
    igual(st.suelo.length, 1, "quedó una pieza en el piso:");
    si(st.suelo[0].it.r >= 2, "de un único sale rara o mejor");
    // E la junta
    st.suelo[0].x = A.jug.x + 10;
    st.suelo[0].y = A.jug.y;
    dispatchEvent(new KeyboardEvent("keydown", { code: "KeyE" }));
    await esperar(0.15);
    dispatchEvent(new KeyboardEvent("keyup", { code: "KeyE" }));
    await esperar(0.1);
    igual(st.suelo.length, 0, "ya no está en el piso:");
    igual(st.bolsa.length, antes + 1, "está en la bolsa:");
    si(st.bolsa[st.bolsa.length - 1].nuevo, "marcada como nueva");
  } },
  { nombre: "botin: la mochila muestra las casillas y la bolsa, y desarmar da plata", fn: async (A, { igual, si }) => {
    INVENTARIO.abrir("equipo");
    igual(document.querySelectorAll(".inv-figura.con-equipo .inv-celda").length, 9, "nueve casillas de equipo:");
    INVENTARIO.abrir("bolsa");
    const st = BOTIN.estado();
    igual(document.querySelectorAll(".inv-celda.rar-0, .inv-celda.rar-1, .inv-celda.rar-2, .inv-celda.rar-3").length, st.bolsa.length, "una casilla por pieza:");
    const plata0 = PODERES.estado().plata,
      n0 = st.bolsa.length;
    const comun = st.bolsa.findIndex((it) => it.r < 2);
    BOTIN.desarmar(comun);
    igual(st.bolsa.length, n0 - 1, "se desarmó:");
    si(PODERES.estado().plata > plata0, "dio plata");
    INVENTARIO.cerrar();
  } },
  { nombre: "botin: se guarda y se carga", fn: async (A, { igual }) => {
    const n = BOTIN.estado().bolsa.length,
      arma = BOTIN.puesta("arma").u;
    A.H.guardar(9);
    JUEGO.empezar(9, false);
    igual(BOTIN.estado().bolsa.length, n, "la bolsa sigue:");
    igual(BOTIN.puesta("arma").u, arma, "el arma sigue:");
  } },
);
