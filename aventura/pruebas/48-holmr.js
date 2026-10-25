// Pruebas de la hólmganga (motor/holmr.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const pelea = async (A) => {
    HOLMR.empezar();
    const d = HOLMR.duelo();
    d.t = 2.95;
    await esperar(150);
    return d;
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "hólmganga: la piel junto al camino del Puesto a Eikholt, con Hallbera y el duelo que arranca con cuenta", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      A.enemigos.forEach((e) => (e.activo = false));
      const C = HOLMR.centro(),
        W = A.W;
      si(W.sueloEn(C[0], C[1]) === 0 && W.libre(C[0], C[1], 30), "en tierra firme y libre");
      si(W.CAMINOS.some((k) => W.distLinea(C[0], C[1], k.p) < k.w / 2 + 900), "junto a un camino");
      const pu = W.LUGARES.puesto.p,
        ci = W.CIUDAD.c;
      si(W.distLinea(C[0], C[1], [pu, ci]) < Math.hypot(ci[0] - pu[0], ci[1] - pu[1]) * 0.4, "entre el Puesto y Eikholt");
      // la piel está despejada: se puede andar por toda
      [[-300, -200], [300, 200], [-300, 200], [300, -200], [0, 0]].forEach(([dx, dy]) => si(W.libre(C[0] + dx, C[1] + dy, 16), "libre en " + [dx, dy]));
      igual(HOLMR.sistema.marcasMapa()[0].tipo, "holmr", "en el mapa:");
      // Hallbera ofrece batirse con Ketil
      const h = HOLMR.hallbera();
      A.jug.x = h.x - 60;
      A.jug.y = h.y;
      const of = [];
      HOLMR.sistema.cercanos((dd, txt, fn) => of.push([txt, fn]));
      igual(of[0] && of[0][0], I18N.t("hm.hablar"), "hablar:");
      igual(HOLMR.siguiente().nombre, I18N.t("hm.k0"), "el primero es Ketil:");
      si(HOLMR.empezar(), "empieza");
      const d = HOLMR.duelo();
      igual(d.fase, "cuenta", "con cuenta:");
      si(Math.abs(A.jug.x - (C[0] - 200)) < 1 && A.jug.hp === A.jug.hpMax, "a la piel y curado");
      igual(HOLMR.sistema.modDano(50, d.e, {}), 0, "en la cuenta no pega:");
      d.t = 2.95;
      await esperar(150);
      igual(d.fase, "pelea", "pelea:");
      si(A.J.jefeHud && A.J.jefeHud.nombre === I18N.t("hm.k0"), "barra de jefe");
      si(A.enemigos.includes(d.e) && d.e.patron.length === 3, "con su rotación fija");
    } },
    { nombre: "hólmganga: los escudos frenan a la guardia, se parten en tres golpes y abierto pega entero", fn: async (A, { igual, si }) => {
      const d = HOLMR.duelo(),
        e = d.e;
      e.estado = "persigue";
      e.aviso = null;
      e.aturdido = 0;
      igual(HOLMR.sistema.modDano(40, e, {}), 10, "a la guardia, un cuarto:");
      HOLMR.sistema.modDano(40, e, {});
      igual(d.escudos, 3, "dos golpes, todavía entero:");
      HOLMR.sistema.modDano(40, e, {});
      igual(d.escudos, 2, "al tercero, partido:");
      si(e.aturdido > 0, "tambalea al partirse");
      e.aturdido = 0;
      e.estado = "espera";
      igual(HOLMR.sistema.modDano(40, e, {}), 40, "recuperándose, entero:");
      e.estado = "persigue";
      // nunca lo mata un golpe
      igual(HOLMR.sistema.modDano(e.vida + 500, e, { d: {} }) < e.vida, true, "no muere en la piel:");
      // sin escudos, el remate lo empuja fuerte
      d.escudos = 0;
      HOLMR.sistema.alPegar(e, 10, { d: { empuje: 1.4 } });
      si(Math.hypot(e.vx, e.vy) > 600, "lo empuja");
      e.vx = e.vy = 0;
      // a Eromash nunca lo bajan del 12 %: se rinde
      A.jug.hp = A.jug.hpMax * 0.2;
      const r = HOLMR.sistema.modRecibido(A.jug.hpMax * 0.3);
      si(A.jug.hp - r >= Math.ceil(A.jug.hpMax * HOLMR.RINDE) - 0.01, "se rinde antes de caer");
      const p0 = HOLMR.estado().perdidos;
      A.jug.hp -= r;
      await esperar(120);
      igual(HOLMR.duelo(), null, "terminó:");
      igual(HOLMR.estado().perdidos, p0 + 1, "perdido:");
      si(!A.enemigos.includes(e) && !A.J.jefeHud, "el kempa se va y la barra también");
      si(A.jug.hp >= A.jug.hpMax * 0.4 - 1, "Hallbera lo venda");
    } },
    { nombre: "hólmganga: se gana sacándolo de la piel o haciéndolo rendirse, y se pierde al pisar fuera sin saltar", fn: async (A, { igual, si }) => {
      const C = HOLMR.centro(),
        st = HOLMR.estado();
      // pisar fuera saltando no cuenta; sin saltar, pierde
      let d = await pelea(A);
      A.jug.x = C[0] - HOLMR.HX - 30;
      A.jug.salto = 0.3;
      await esperar(40);
      si(HOLMR.duelo() === d, "saltando sigue");
      A.jug.salto = 0;
      A.jug.x = C[0] - HOLMR.HX - 30;
      await esperar(120);
      igual(HOLMR.duelo(), null, "pisó fuera:");
      // sacarlo de la piel
      A.jug.x = C[0];
      const pl = PODERES.pj().plata;
      d = await pelea(A);
      d.e.propio = true; // que no se mueva solo
      d.e.x = C[0] + HOLMR.HX + 60;
      await esperar(120);
      igual(st.vencidos, 1, "venció a Ketil:");
      si(PODERES.pj().plata >= pl + HOLMR.KEMPUR[0].plata, "pagó");
      // rendirse
      d = await pelea(A);
      igual(d.nombre, I18N.t("hm.k1"), "ahora Thorgerd:");
      d.e.vida = d.e.d.vida * 0.1;
      await esperar(120);
      igual(st.vencidos, 2, "se rindió:");
    } },
    { nombre: "hólmganga: el quinto da el título, después un retador por día, Skuggi no muerde y todo se guarda", fn: async (A, { igual, si }) => {
      const st = HOLMR.estado();
      st.vencidos = 4;
      const m0 = A.J.mulDano;
      const d = await pelea(A);
      igual(d.nombre, I18N.t("hm.k4"), "Úlfhild:");
      if (window.COMPANERO) {
        // el perro no la elige para morder
        COMPANERO.sumar(0);
        si(!A.enemigos.filter((e) => e.holmr).some((e) => COMPANERO.perro() && COMPANERO.perro().obj === e), "Skuggi mira");
      }
      d.e.vida = 1;
      await esperar(150);
      si(st.campeon, "campeón");
      si(A.J.mulDano > m0 * 1.04, "+5 % de daño");
      const r = HOLMR.siguiente();
      si(r && r.retador, "viene un retador");
      await pelea(A);
      HOLMR.duelo().e.vida = 1;
      await esperar(150);
      igual(HOLMR.siguiente(), null, "uno por día:");
      si(HOLMR.sistema.celdasBolsa().length === 1 && HOLMR.sistema.diario().includes(I18N.t("hm.diario_t")), "en la Bolsa y el diario");
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(200);
      si(HOLMR.estado().campeon && HOLMR.estado().vencidos === 5, "quedó guardado");
    } },
  );
}
