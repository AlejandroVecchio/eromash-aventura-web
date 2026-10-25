// Pruebas de las némesis (motor/nemesis.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  // que la criatura e mate a Eromash
  async function morirPor(A, e) {
    const jug = A.jug;
    e.activo = true;
    e.x = jug.x + 60;
    e.y = jug.y;
    jug.inv = 0;
    jug.salto = 0;
    jug.esq = 0;
    jug.hp = 1;
    A.J.herir(50, e.x, e.y);
    for (let i = 0; i < 40 && !jug.muerto; i++) await esperar(50);
    for (let i = 0; i < 60 && jug.muerto; i++) await esperar(50);
  }
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "némesis: la que mata a Eromash gana nombre, rasgo y fuerza, y sube si vuelve a ganar", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      A.enemigos.forEach((q) => (q.activo = false));
      const g = HORDAS.grupos.find((q) => !q.unico && q.miembros.some((e) => e.tipo === "lobo"));
      const e = g.miembros.find((q) => !q.lider);
      const vida0 = e.d.vida;
      await morirPor(A, e);
      const st = NEMESIS.estado();
      igual(st.vivas.length, 1, "una némesis:");
      const n = st.vivas[0];
      igual(e.nemesis, n.id, "es esa criatura:");
      si(e.d.vida > vida0 * 1.5, "más vida");
      si(NEMESIS.RASGOS.includes(n.rasgo), "con rasgo");
      si(NEMESIS.nombreDe(n).length > 6, "con nombre: " + NEMESIS.nombreDe(n));
      si(HORDAS.grupos.some((q) => q !== g && q.miembros.some((o) => o.d === e.d)) === false, "no toca a las otras");
      await morirPor(A, e);
      igual(st.vivas[0].rango, 2, "rango 2:");
      igual(st.vivas[0].muertes, 2, "te venció dos veces:");
      igual(NEMESIS.sistema.marcasMapa().length, 1, "en el mapa:");
      si(NEMESIS.sistema.diario().includes(n.nombre), "en el diario");
      e.activo = false;
    } },
    { nombre: "némesis: se guarda y vuelve a su criatura, vencerla paga y no pasan de tres", fn: async (A, { igual, si }) => {
      const st = NEMESIS.estado();
      const n = st.vivas[0];
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(150);
      const st2 = NEMESIS.estado();
      const e = NEMESIS.criaturaDe(st2.vivas[0]);
      igual(e.nemesis, n.id, "vuelve a la misma criatura:");
      si(e.d.vida > e.dBase.vida, "con su fuerza");
      // vencerla
      const p0 = PODERES.pj().plata,
        x0 = RPG.estado().total;
      e.activo = true;
      e.x = A.jug.x + 80;
      e.y = A.jug.y;
      A.CB.golpear(A.J, e, 999999, A.jug.x, A.jug.y, 1);
      await esperar(200);
      igual(st2.vivas.length, 0, "no quedan:");
      igual(st2.vengadas.length, 1, "vengada:");
      si(!e.nemesis && e.d === e.d && !e.dBase, "vuelve a ser común");
      si(RPG.estado().total > x0, "dio experiencia");
      // tres a la vez como mucho
      const gs = HORDAS.grupos.filter((q) => !q.unico).slice(0, 4);
      for (const g of gs) {
        const o = g.miembros.find((q) => !q.lider);
        NEMESIS.nacer(o);
      }
      igual(st2.vivas.length, NEMESIS.TOPE, "tres:");
      st2.vivas.forEach((q) => {
        const o = NEMESIS.criaturaDe(q);
        o.dBase && ((o.d = o.dBase), (o.dBase = null), (o.nemesis = null));
      });
      st2.vivas.length = 0;
      A.H.guardar(9);
    } },
  );
}
