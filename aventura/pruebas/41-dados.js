// Pruebas de los dados de hueso (motor/dados.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "dados: los puntos del farkle y si una tirada vale", fn: async (A, { igual, si }) => {
      const P = DADOS.puntos;
      igual(P([1]), 100, "un 1:");
      igual(P([5]), 50, "un 5:");
      igual(P([1, 1, 5]), 250, "dos 1 y un 5:");
      igual(P([1, 1, 1]), 1000, "tres 1:");
      igual(P([2, 2, 2]), 200, "tres 2:");
      igual(P([2, 2, 2, 2]), 400, "cuatro 2 duplica:");
      igual(P([6, 6, 6, 6, 6]), 2400, "cinco 6:");
      igual(P([3, 3, 3, 1]), 400, "tres 3 y un 1:");
      igual(P([1, 2, 3, 4, 5, 6]), 1500, "escalera:");
      igual(P([1, 2, 3, 4, 5]), 500, "uno a cinco:");
      igual(P([2, 3, 4, 5, 6]), 750, "dos a seis:");
      igual(P([1, 2, 3, 4, 5, 5]), 550, "uno a cinco y un 5:");
      igual(P([2, 3]), -1, "un 2 y un 3 no valen:");
      igual(P([1, 4]), -1, "un 4 suelto arruina lo elegido:");
      si(!DADOS.algoVale([2, 3, 4, 6, 6, 2]), "una tirada sin nada");
      si(DADOS.algoVale([2, 3, 4, 6, 6, 6]), "tres 6 valen");
      si(DADOS.algoVale([2, 3, 4, 5, 6, 6]), "dos a seis vale");
      const e = DADOS.eleccionRival([1, 1, 1, 5, 2, 3], DADOS.RIVALES.bersi);
      si(e.p >= 1000, "el rival se queda con los tres 1: " + e.p);
    } },
    { nombre: "dados: una mesa en el Puesto y otra en Brunvik, cada una con su jugador", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      A.enemigos.forEach((e) => (e.activo = false));
      igual(DADOS.mesas.map((m) => m.rival).sort().join(","), "bersi,hallgerd", "dos mesas:");
      DADOS.mesas.forEach((m) => {
        const L = A.W.LUGARES[DADOS.RIVALES[m.rival].lugar];
        si(Math.hypot(m.x - L.p[0], m.y - L.p[1]) < L.r, m.rival + " en su pueblo");
        si(m.cosa.id === "mesaDados", "la mesa");
      });
      igual(DADOS.sistema.marcasMapa().length, 2, "en el mapa:");
      const m = DADOS.mesas.find((q) => q.rival === "bersi");
      A.jug.x = m.x;
      A.jug.y = m.y + 120;
      const ofertas = [];
      DADOS.sistema.cercanos((d, txt) => ofertas.push(txt));
      si(ofertas.some((x) => x.includes(I18N.t("av.nombre_bersi"))), "se juega con E");
      // «Cómo se juega»: la charla queda adelante (el menú se esconde) y al terminar vuelve el menú
      DADOS.abrirMesa("bersi");
      const reglas = [...document.querySelectorAll("#capaCaja .boton")].find((b) => b.textContent.includes(I18N.t("dd.reglas")));
      reglas.click();
      igual(A.J.modo, "dialogo", "charla:");
      si(document.getElementById("capa").classList.contains("oculto"), "el menú no tapa la charla");
      for (let i = 0; i < 5 && A.J.modo === "dialogo"; i++) A.seguirDialogo();
      igual(A.J.modo, "menu", "vuelve el menú:");
      si(!document.getElementById("capa").classList.contains("oculto"), "el menú a la vista");
      A.cerrarMenu();
    } },
    { nombre: "dados: apostar, plantarse, el turno del rival, perder lo del turno y ganar la partida", fn: async (A, { igual, si }) => {
      const pj = PODERES.pj();
      pj.plata = 100;
      si(DADOS.empezar("bersi", 10), "empieza");
      igual(pj.plata, 90, "pagó la apuesta:");
      igual(A.J.modo, "dados", "modo dados:");
      await esperar(700);
      const m = DADOS.actual();
      // una tirada que vale: apartar el 1 y plantarse
      m.dados = [1, 2, 3, 4, 6, 6];
      m.fase = "elegir";
      m.sel = new Set();
      igual(DADOS.seguir(true), false, "sin elegir no se puede:");
      DADOS.elegir(0);
      si(DADOS.seguir(true), "se planta");
      igual(m.yo, 100, "sumó 100:");
      // el rival juega solo hasta que vuelve el turno
      // (el rival no puede llegar a la meta mientras se espera)
      for (let i = 0; i < 500 && !(m.turno === "yo" && m.fase === "elegir") && !m.fin; i++) (m.el = Math.min(m.el, 500)), (m.turnoPts = Math.min(m.turnoPts, 400)), await esperar(50);
      igual(m.turno, "yo", "volvió el turno:");
      si(m.el >= 0, "el rival jugó: " + m.el);
      // una tirada sin nada: se pierde lo del turno
      m.turnoPts = 300;
      m.dados = [2, 3, 4, 6, 6, 2];
      m.fase = "rodando";
      m.t = 0.6;
      await esperar(100);
      igual(m.turnoPts, 0, "nada: perdió lo del turno:");
      for (let i = 0; i < 500 && !(m.turno === "yo" && m.fase === "elegir") && !m.fin; i++) (m.el = Math.min(m.el, 500)), (m.turnoPts = Math.min(m.turnoPts, 400)), await esperar(50);
      // ganar
      m.yo = DADOS.META - 50;
      m.el = 0;
      m.dados = [5, 2, 3, 4, 6, 6];
      m.fase = "elegir";
      m.sel = new Set([0]);
      DADOS.seguir(true);
      igual(m.fin, "gane", "ganó:");
      igual(pj.plata, 110, "cobró el doble:");
      si(DADOS.estado().vencidos.bersi, "Bersi vencido");
      DADOS.levantarse();
      igual(A.J.modo, "juego", "vuelve al juego:");
      // levantarse a la mitad cuenta como perdida
      const p0 = DADOS.estado().perdidas;
      DADOS.empezar("hallgerd", 25);
      await esperar(200);
      DADOS.levantarse();
      igual(DADOS.estado().perdidas, p0 + 1, "levantarse pierde:");
    } },
    { nombre: "dados: la mesa alta tras ganarle a los tres y todo se guarda", fn: async (A, { igual, si }) => {
      Object.assign(DADOS.estado().vencidos, { bersi: 1, hallgerd: 1, ulf: 1 });
      DADOS.abrirMesa("hallgerd");
      await esperar(80);
      si(document.body.textContent.includes(I18N.t("dd.apostar", [200])), "se puede apostar 200");
      A.cerrarMenu();
      si(DADOS.sistema.diario().includes(I18N.t("dd.diario_t")), "en el diario");
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(150);
      si(DADOS.estado().vencidos.ulf && DADOS.estado().ganadas >= 1, "quedó guardado");
    } },
  );
}
