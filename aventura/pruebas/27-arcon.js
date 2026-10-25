// Pruebas del arcón del Puesto y el filtro del botín (motor/arcon.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "arcón: está en la Casa de las Lindes de Eikholt, guarda y devuelve piezas y Eydis lo agranda", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const st = ARCON.estado(),
        ar = ARCON.arcon();
      si(ar && ar.id === "arconPuesto", "el arcón está");
      const cl = A.W.LUGARES.casa_lindes.p;
      si(Math.hypot(ar.x - cl[0], ar.y - cl[1]) < 600, "junto a la Casa de las Lindes");
      si(EIKHOLT.traido("arcon_lindes"), "y la ciudad lo trae");
      const b = BOTIN.estado();
      const it = OBJETOS.generar({ base: "espadaAncha", r: 2, n: 5 });
      BOTIN.dar(it);
      const n0 = b.bolsa.length;
      si(ARCON.guardar(it), "guarda");
      igual(b.bolsa.length, n0 - 1, "sale de la bolsa:");
      igual(st.piezas.length, 1, "entra al arcón:");
      si(ARCON.sacar(it), "devuelve");
      igual(st.piezas.length, 0, "vacío:");
      for (let i = 0; i < 5; i++) BOTIN.dar(OBJETOS.generar({ r: 0, n: 2 }));
      si(ARCON.guardarTodo() >= 5, "guardar todo");
      igual(b.bolsa.length, 0, "bolsa vacía:");
      igual(st.cap, 24, "24 lugares:");
      PODERES.pj().plata = 100;
      si(!ARCON.agrandar(), "sin plata no");
      PODERES.pj().plata = 1000;
      si(ARCON.agrandar(), "agranda");
      igual(st.cap, 36, "36:");
      ARCON.agrandar();
      igual(st.cap, 48, "48:");
      si(!ARCON.agrandar(), "más no");
      igual(PODERES.pj().plata, 1000 - 150 - 400, "cobró:");
    } },
    { nombre: "arcón: la pestaña se abre en el arcón y la Bolsa trae el filtro", fn: async (A, { igual, si }) => {
      const ar = ARCON.arcon();
      EIKHOLT.irA("arcon_lindes");
      for (let i = 0; i < 60 && !(EIKHOLT.activo() && A.J.modo === "juego"); i++) await esperar(100);
      const c = EIKHOLT.cercano();
      si(c && c.texto === I18N.t("ac.abrir"), "en la ciudad se abre junto a la casa");
      c.fn();
      await esperar(100);
      igual(INVENTARIO.actual(), "arcon", "la pestaña:");
      si(ar.o.abierto, "la tapa abierta");
      si(document.querySelectorAll(".inv-rejilla .inv-celda").length >= ARCON.estado().piezas.length, "las piezas guardadas");
      INVENTARIO.cerrar();
      await esperar(80);
      si(!ar.o.abierto, "al cerrar se cierra");
      EIKHOLT.salir();
      for (let i = 0; i < 40 && (EIKHOLT.activo() || A.J.modo !== "juego"); i++) await esperar(100);
      const ids = ARCON.sistema.celdasBolsa().map((c) => c.id);
      si(ids.includes("ac_filtro") && ids.includes("ac_desarmar"), "el filtro en la Bolsa");
    } },
    { nombre: "arcón: el filtro esconde lo común, nunca lo especial, y desarma solo al juntar", fn: async (A, { igual, si }) => {
      const st = ARCON.estado();
      const comun = OBJETOS.generar({ r: 0, n: 3, sinMuescas: true }),
        magica = OBJETOS.generar({ r: 1, n: 3, sinMuescas: true }),
        hueca = OBJETOS.generar({ r: 0, n: 3, sinMuescas: true });
      hueca.e = 2;
      hueca.g = [];
      si(!ARCON.oculta(comun), "sin filtro se ve todo");
      st.filtro = 2;
      si(ARCON.oculta(comun) && ARCON.oculta(magica), "raras o mejores: esconde comunes y mágicas");
      si(!ARCON.oculta(hueca), "con muescas se ve igual");
      si(!ARCON.oculta(CONJUNTOS.crear("guardia", "casco", 3)), "de conjunto se ve igual");
      st.desarmar = true;
      const p0 = PODERES.pj().plata,
        b = BOTIN.estado(),
        n0 = b.bolsa.length;
      BOTIN.tirar(A.jug.x + 10, A.jug.y, comun);
      await esperar(1200);
      const s = b.suelo.find((q) => q.it === comun);
      si(s, "quedó en el piso");
      const todos = () => Object.values(MATERIALES.estado().tiene).reduce((a, b) => a + b, 0);
      const mat0 = todos();
      // juntar con E
      A.jug.x = s.x;
      A.jug.y = s.y;
      await esperar(60);
      const c = A.J.cerca;
      if (c && c.fn) c.fn();
      else BOTIN.estado().suelo.splice(BOTIN.estado().suelo.indexOf(s), 1) && ARCON.alJuntar(comun);
      si(PODERES.pj().plata > p0, "dio plata");
      igual(b.bolsa.length, n0, "no ocupó la bolsa:");
      si(todos() > mat0, "y materiales");
      st.filtro = 0;
      st.desarmar = false;
      A.H.guardar(9);
    } },
  );
}
