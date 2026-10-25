// Pruebas de los tintes del casco (motor/tintes.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "tintes: la tina está en la curtiembre de Eikholt y teñir pide plata y hierbas la primera vez", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const st = TINTES.estado(),
        tina = TINTES.tina();
      si(tina && tina.id === "tinaTintes", "la tina está");
      igual(st.puesto, "rojo", "arranca en rojo:");
      igual(VIKINGO.color, "R", "Eromash rojo:");
      PODERES.pj().plata = 0;
      si(!TINTES.tenir("azul"), "sin nada no tiñe");
      PODERES.pj().plata = 200;
      ALQUIMIA.estado().hierbas.escarcha = 3;
      si(TINTES.tenir("azul"), "tiñe de azul");
      igual(VIKINGO.color, "B", "Eromash azul:");
      igual(PODERES.pj().plata, 140, "cobró 60:");
      igual(ALQUIMIA.estado().hierbas.escarcha, 0, "gastó la escarcha:");
      igual(tina.o.color, TINTES.LISTA.azul.agua, "el agua cambia:");
      si(TINTES.tenir("rojo"), "vuelve al rojo gratis");
      si(TINTES.tenir("azul"), "y al azul gratis");
      igual(PODERES.pj().plata, 140, "sin cobrar otra vez:");
    } },
    { nombre: "tintes: los propios tienen sus tonos, se dibujan y los ganados piden su hazaña", fn: async (A, { igual, si }) => {
      const st = TINTES.estado();
      si(TINTES.tonos("T_violeta") && TINTES.tonos("T_violeta").e1 === "#9A6BD8", "tonos del violeta");
      si(!TINTES.tonos("R"), "los de la arena siguen igual");
      const img = VIKINGO.imagen("T_runa", "S", "calm");
      for (let i = 0; i < 20 && !img.complete; i++) await esperar(50);
      si(img.naturalWidth > 0, "la imagen teñida carga");
      si(!TINTES.tenir("runa"), "la luz de runa todavía no");
      LEGENDARIOS.aprender("hel");
      await esperar(50);
      si(TINTES.ganado("runa"), "con un poder aprendido se gana");
      si(TINTES.tenir("runa"), "tiñe con luz de runa");
      igual(VIKINGO.color, "T_runa", "Eromash con luz de runa:");
      si(!TINTES.tenir("oro"), "el oro pide un conjunto");
      CONJUNTOS.estado().completos.odin = 1;
      si(TINTES.tenir("oro"), "con un conjunto entero, oro");
      igual(VIKINGO.color, "G", "Eromash dorado:");
    } },
    { nombre: "tintes: la pestaña se abre en la tina y el color se guarda", fn: async (A, { igual, si }) => {
      EIKHOLT.irA("tina_tintes");
      for (let i = 0; i < 60 && !(EIKHOLT.activo() && A.J.modo === "juego"); i++) await esperar(100);
      await esperar(100);
      const c = EIKHOLT.cercano();
      si(c && c.fn, "algo para usar cerca");
      if (c && c.fn) c.fn();
      await esperar(100);
      igual(INVENTARIO.actual(), "tintes", "la pestaña:");
      igual(document.querySelectorAll(".inv-rejilla .inv-celda").length, 8, "ocho colores:");
      INVENTARIO.cerrar();
      EIKHOLT.salir();
      for (let i = 0; i < 40 && (EIKHOLT.activo() || A.J.modo !== "juego"); i++) await esperar(100);
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(100);
      igual(TINTES.estado().puesto, "oro", "se guardó:");
      igual(VIKINGO.color, "G", "y vuelve puesto:");
      TINTES.tenir("rojo");
      A.H.guardar(9);
    } },
  );
}
