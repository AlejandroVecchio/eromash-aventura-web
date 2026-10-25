// Pruebas de las muescas, las tallas y las palabras rúnicas (motor/engarces.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "engarces: las piezas salen con muescas (más las comunes, nunca las legendarias ni los anillos)", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const rnd = OBJETOS.azar(99);
      const cuenta = [0, 0, 0, 0];
      for (let i = 0; i < 400; i++) for (let r = 0; r < 4; r++) if (OBJETOS.generar({ r, n: 8, slot: "arma", rnd }).e) cuenta[r]++;
      si(cuenta[0] > cuenta[1] && cuenta[1] > cuenta[2], "comunes > mágicas > raras (" + cuenta.join(", ") + ")");
      igual(cuenta[3], 0, "legendarias sin muescas:");
      let anillo = 0;
      for (let i = 0; i < 200; i++) if (OBJETOS.generar({ r: 0, n: 8, slot: "anillo1", rnd }).e) anillo++;
      igual(anillo, 0, "anillos sin muescas:");
    } },
    { nombre: "engarces: una talla suma distinto en arma y armadura; la palabra rúnica despierta en orden y solo en comunes", fn: async (A, { igual, si }) => {
      const st = ENGARCES.estado();
      const arma = OBJETOS.generar({ base: "espadaHierro", r: 0, n: 5, rnd: OBJETOS.azar(3), sinMuescas: true });
      arma.e = 2;
      arma.g = [];
      BOTIN.dar(arma);
      ENGARCES.dar("uruz", 2);
      ENGARCES.dar("tiwaz", 1);
      si(!ENGARCES.engarzar(arma, "fehu"), "sin la talla no");
      // al revés no despierta
      si(ENGARCES.engarzar(arma, "uruz"), "encastra Uruz");
      igual(OBJETOS.sumar([arma]).danoP, 6, "Uruz en arma: +6 % de daño:");
      si(ENGARCES.engarzar(arma, "tiwaz"), "encastra Tiwaz");
      si(!arma.pr, "Uruz + Tiwaz no es Juramento");
      si(!ENGARCES.engarzar(arma, "uruz"), "llena");
      ENGARCES.dar("uruz", 0);
      PODERES.pj().plata = 500;
      si(ENGARCES.vaciar(arma), "vaciar");
      igual(PODERES.pj().plata, 460, "cuesta 20 por talla:");
      igual(st.tallas.uruz, 2, "las tallas vuelven:");
      ENGARCES.engarzar(arma, "tiwaz");
      ENGARCES.engarzar(arma, "uruz");
      igual(arma.pr, "juramento", "Tiwaz + Uruz despierta Juramento:");
      igual(OBJETOS.nombre(arma), "«" + I18N.t("en.p_juramento") + "»", "con su nombre:");
      const s = OBJETOS.sumar([arma]);
      igual(s.danoP, 31, "+25 % de la palabra y +6 % de Uruz:");
      igual(s.vida, 20, "+20 de vida:");
      igual(st.hechas.juramento, 1, "anotada:");
      si(OBJETOS.lineas(arma).some((l) => l.txt.indexOf(I18N.t("en.p_juramento")) >= 0), "el detalle la nombra");
      // en una mágica no despierta
      const mag = OBJETOS.generar({ base: "espadaHierro", r: 1, n: 5, rnd: OBJETOS.azar(4), sinMuescas: true });
      mag.e = 2;
      mag.g = [];
      ENGARCES.dar("tiwaz", 1);
      ENGARCES.dar("uruz", 1);
      ENGARCES.engarzar(mag, "tiwaz");
      ENGARCES.engarzar(mag, "uruz");
      si(!mag.pr, "en una mágica solo suman las tallas");
      // en armadura
      const casco = OBJETOS.generar({ base: Object.keys(OBJETOS.BASES).find((b) => OBJETOS.BASES[b].slot === "casco"), r: 0, n: 5, rnd: OBJETOS.azar(5), sinMuescas: true });
      casco.e = 1;
      casco.g = [];
      ENGARCES.dar("uruz", 1);
      ENGARCES.engarzar(casco, "uruz");
      igual(OBJETOS.sumar([casco]).vida, 15, "Uruz en armadura: +15 de vida:");
    } },
    { nombre: "engarces: tres tallas iguales se unen, caen de los líderes y Ása abre muescas", fn: async (A, { igual, si }) => {
      const st = ENGARCES.estado();
      st.tallas.fehu = 3;
      const uruz0 = st.tallas.uruz || 0;
      si(ENGARCES.unir("fehu"), "une");
      igual(st.tallas.fehu, 0, "gasta tres:");
      igual(st.tallas.uruz, uruz0 + 1, "da una de la siguiente:");
      si(!ENGARCES.unir("tiwaz"), "la última no se une");
      const total = () => Object.values(st.tallas).reduce((a, b) => a + b, 0);
      const t0 = total();
      ENGARCES.sistema.alMorir(Object.assign({}, A.enemigos.find((e) => e.casa && !e.d.blanco), { lider: { unico: true }, esbirro: false }));
      igual(total(), t0 + 1, "un líder único suelta una:");
      // Ása
      const pieza = OBJETOS.generar({ base: "espadaHierro", r: 0, n: 4, rnd: OBJETOS.azar(8), sinMuescas: true });
      BOTIN.dar(pieza);
      PODERES.pj().plata = 0;
      si(!ENGARCES.abrir(pieza), "sin plata no");
      PODERES.pj().plata = 500;
      MATERIALES.dar("hierro", 2);
      MATERIALES.dar("esquirla", 1);
      si(ENGARCES.abrir(pieza), "Ása abre");
      igual(pieza.e, 3, "una común con espada recibe tres:");
      igual(PODERES.pj().plata, 500 - 80, "cobra:");
      si(!ENGARCES.abrir(pieza), "no dos veces");
      // la pestaña
      ENGARCES.elegir(pieza.u);
      INVENTARIO.abrir("tallas");
      await esperar(100);
      igual(INVENTARIO.actual(), "tallas", "abre la pestaña:");
      si(document.querySelectorAll(".inv-rejilla").length >= 4, "piezas, muescas, tallas y palabras");
      INVENTARIO.cerrar();
      A.H.guardar(9);
    } },
  );
}
