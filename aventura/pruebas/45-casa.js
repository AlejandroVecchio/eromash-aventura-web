// Pruebas de la casa propia (motor/casa.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "casa: la casa de Hrolf junto al camino del Puesto, en venta y cerrada hasta comprarla", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      A.enemigos.forEach((e) => (e.activo = false));
      const c = CASA.casa();
      si(c, "hay casa");
      const L = A.W.LUGARES.puesto;
      const d = Math.hypot(c.x - L.p[0], c.y - L.p[1]);
      si(d > L.r && d < L.r + 2700, "cerca del Puesto: " + Math.round(d));
      si(A.W.sueloEn(c.x, c.y) === 0, "en tierra firme");
      si(A.W.CAMINOS.some((k) => A.W.distLinea(c.x, c.y, k.p) < k.w / 2 + 700), "junto a un camino");
      // cerrada: la puerta no ofrece entrar
      A.jug.x = c.cosa.x;
      A.jug.y = c.cosa.y + 60;
      const ofertas = [];
      window.SISTEMAS.forEach((s0) => s0.cercanos && s0.cercanos((dd, txt, fn) => ofertas.push([txt, fn])));
      si(!ofertas.some((o) => o[0].includes(I18N.t("in.nombre_propia"))), "cerrada antes de comprar");
      igual(CASA.sistema.destinoViaje(), null, "sin destino de viaje:");
      // comprar
      const pj = PODERES.pj();
      pj.plata = 100;
      igual(CASA.comprar(), false, "sin plata no:");
      pj.plata = 700;
      si(CASA.comprar(), "comprada");
      igual(pj.plata, 200, "pagó 500:");
      si(c.letrero.o.vendida, "el letrero se da vuelta");
      si(CASA.sistema.destinoViaje(), "destino de viaje");
      const of2 = [];
      window.SISTEMAS.forEach((s0) => s0.cercanos && s0.cercanos((dd, txt, fn) => of2.push([txt, fn])));
      si(of2.some((o) => o[0].includes(I18N.t("in.nombre_propia"))), "ahora se entra");
    } },
    { nombre: "casa: entrar, los planos, las mejoras con lo que cuestan y el arcón", fn: async (A, { igual, si }) => {
      const c = CASA.casa();
      INTERIORES.entrar(c.puerta);
      await esperar(100);
      const q = INTERIORES.cuarto();
      igual(q && q.tipo, "propia", "adentro de la casa:");
      si(q.muebles.some((m) => m.id === "camaPieles") && q.muebles.some((m) => m.accion === "hg.accion_planos"), "cama y planos");
      igual(q.muebles.some((m) => m.id === "trampilla"), false, "sin sótano:");
      // sin materiales no
      const pj = PODERES.pj();
      pj.plata = 2000;
      const cuero = MATERIALES.cuantos("cuero");
      if (cuero) MATERIALES.gastar({ cuero });
      igual(CASA.construir("arcon"), false, "sin cuero no:");
      MATERIALES.dar("cuero", 20);
      MATERIALES.dar("hierro", 20);
      MATERIALES.dar("ambar", 5);
      si(CASA.construir("arcon"), "arcón hecho");
      si(q.muebles.some((m) => m.id === "arconCasa"), "el arcón aparece adentro");
      // el armero sube el daño
      const d0 = A.J.mulDano;
      si(CASA.construir("armero"), "armero hecho");
      si(A.J.mulDano > d0 * 1.03, "+4 % de daño");
      igual(CASA.construir("armero"), false, "no dos veces:");
      // el arcón guarda y devuelve
      const B = BOTIN.estado();
      const it = OBJETOS.generar({ n: 2, slot: "casco", r: 1 });
      BOTIN.dar(it, { silencio: true });
      const nb = B.bolsa.length;
      si(CASA.guardar(B.bolsa.indexOf(it)), "guardada");
      igual(B.bolsa.length, nb - 1, "salió de la Bolsa:");
      igual(CASA.estado().arcon.length, 1, "en el arcón:");
      si(CASA.sacar(0), "sacada");
      igual(B.bolsa.length, nb, "volvió a la Bolsa:");
    } },
    { nombre: "casa: el fogón del patio, la huerta de cada día y todo se guarda", fn: async (A, { igual, si }) => {
      const c = CASA.casa();
      si(CASA.construir("fogon"), "fogón hecho");
      si(c.fogon && c.fogon.id === "fogonOlla" && !c.fogon.o.apagado, "un fogón de verdad en el patio");
      si(CASA.construir("huerta"), "huerta hecha");
      igual(c.huerta.oculto, false, "la huerta se ve:");
      si(CASA.lista(), "lista para cosechar");
      const h0 = Object.values(ALQUIMIA.estado().hierbas).reduce((a, b) => a + b, 0);
      si(CASA.cosechar(), "cosechada");
      igual(Object.values(ALQUIMIA.estado().hierbas).reduce((a, b) => a + b, 0) - h0, 2, "dos hierbas:");
      igual(CASA.cosechar(), false, "una vez por día:");
      A.H.E.tiempo += LUZ.DIA;
      si(CASA.lista(), "al otro día vuelve a dar");
      si(CASA.sistema.diario().includes(I18N.t("hg.m_huerta")), "en el diario");
      // la cama de pieles: «Bien abrigado» suma 10 % de experiencia un rato
      const xp0 = RPG.stats().xp;
      CASA.estado().abrigo = 600;
      RPG.recalcular();
      igual(Math.round((RPG.stats().xp / xp0) * 100), 110, "abrigado: +10 % de experiencia:");
      CASA.sistema.actualizar(601);
      igual(CASA.estado().abrigo, 0, "se pasa:");
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(200);
      si(CASA.estado().tuya && CASA.estado().hechas.armero, "quedó guardado");
      si(!CASA.casa().huerta.oculto && CASA.casa().letrero.o.vendida, "afuera se ve igual al cargar");
    } },
  );
}
