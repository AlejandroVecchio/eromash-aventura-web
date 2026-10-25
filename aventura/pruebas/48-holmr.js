// Pruebas de la hólmganga en primera persona (motor/holmr.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  // espera a que el aviso de ahora pida respuesta
  const ventana = async (d) => {
    for (let i = 0; i < 80 && !d.fin && !(d.mov && d.mov.fase === "ventana"); i++) await esperar(25);
    return d.mov;
  };
  // contesta bien: en el momento justo, lo que pide
  const contestar = (m, k = 0.8) => {
    m.t = m.ventana * k;
    if (m.pide === "machacar") for (let i = 0; i < m.n; i++) HOLMR.responder("atacar");
    else if (m.pide === "clic") HOLMR.responder("clic", m.x, m.y);
    else HOLMR.responder(m.pide);
  };
  const arrancar = async () => {
    HOLMR.empezar();
    const d = HOLMR.duelo();
    d.t = 3.45;
    await esperar(80);
    return d;
  };
  const ganar = async (d) => {
    for (let i = 0; i < 80 && !d.fin; i++) {
      const m = await ventana(d);
      if (m && m.fase === "ventana") contestar(m);
      await esperar(20);
    }
    return d;
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "hólmganga: la piel junto al camino, Hallbera y el duelo en primera persona con su cuenta", fn: async (A, { igual, si }) => {
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
      igual(HOLMR.sistema.marcasMapa()[0].tipo, "holmr", "en el mapa:");
      const h = HOLMR.hallbera();
      A.jug.x = h.x - 60;
      A.jug.y = h.y;
      const of = [];
      HOLMR.sistema.cercanos((dd, txt, fn) => of.push([txt, fn]));
      igual(of[0] && of[0][0], I18N.t("hm.hablar"), "hablar:");
      igual(HOLMR.siguiente().nombre, I18N.t("hm.k0"), "el primero es Ketil:");
      const n0 = A.enemigos.length;
      si(HOLMR.empezar(), "empieza");
      const d = HOLMR.duelo();
      igual(A.J.modo, "holmr", "su propio modo (el bosque en pausa):");
      const lz = document.getElementById("holmrLienzo");
      si(lz && lz.style.display === "block", "en su lienzo, en primera persona");
      igual(A.enemigos.length, n0, "no suelta un enemigo en el bosque:");
      igual(d.fase, "cuenta", "con cuenta:");
      si(A.jug.hp === A.jug.hpMax, "curado");
      d.t = 3.45;
      await esperar(80);
      igual(d.fase, "pelea", "pelea:");
      igual(d.mov.tipo, "hachazo", "Ketil abre con el hachazo:");
    } },
    { nombre: "hólmganga: cada ataque pide su respuesta, el aro decide justo, bien o muy pronto, y la tecla equivocada falla", fn: async (A, { igual, si }) => {
      const d = HOLMR.duelo();
      let m = await ventana(d);
      igual(m.pide, "bloquear", "al hachazo, bloquear:");
      contestar(m, 0.8);
      igual(m.res, "justo", "con el aro sobre el círculo:");
      igual(d.golpesEsc, 1, "el contraataque pega en el escudo:");
      // abierto: clic en el blanco, pero fuera de él no vale
      m = await ventana(d);
      igual(m.pide, "clic", "abierto, clic acá:");
      m.t = m.ventana * 0.5;
      HOLMR.responder("clic", m.x + 300, m.y);
      igual(m.res, "lejos", "fuera del blanco:");
      igual(d.fallos, 1, "el golpe entra:");
      m = await ventana(d);
      igual(m.pide, "esquivar", "a la estocada, esquivar:");
      m.t = m.ventana * 0.1;
      HOLMR.responder("esquivar");
      igual(m.res, "apurado", "antes de tiempo:");
      m = await ventana(d);
      igual(m.pide, "clic", "abierto otra vez:");
      m.t = m.ventana * 0.5;
      HOLMR.responder("clic", m.x, m.y);
      igual(m.res, "bien", "en el blanco y a tiempo:");
      igual(d.escudos, 1, "dos golpes parten un escudo:");
      m = await ventana(d);
      igual(m.pide, "saltar", "a la barrida, saltar:");
      m.t = m.ventana * 0.5;
      HOLMR.responder("bloquear");
      igual(m.res, "otra", "la que no es:");
      igual(d.fallos, 3, "tres errores:");
      si(d.fin && !d.fin.gano, "Ketil perdona tres: se rinde");
      const p0 = HOLMR.estado().perdidos;
      HOLMR.cerrar();
      igual(HOLMR.duelo(), null, "terminó:");
      igual(A.J.modo, "juego", "vuelve al bosque:");
      igual(HOLMR.estado().perdidos, p0 + 1, "perdido:");
      si(A.jug.hp >= A.jug.hpMax * 0.4 - 1, "Hallbera lo venda");
    } },
    { nombre: "hólmganga: sin escudos ni aguante, el remate lo saca de la piel; tarde también falla", fn: async (A, { igual, si }) => {
      const st = HOLMR.estado(),
        pl = PODERES.pj().plata;
      let d = await arrancar();
      // no contestar a tiempo
      const m = await ventana(d);
      m.t = m.ventana - 0.001;
      await esperar(80);
      igual(m.res, "tarde", "tarde:");
      d = await ganar(d);
      si(d.fin && d.fin.gano, "ganó");
      igual(d.escudos + d.toques, 0, "sin escudos ni aguante:");
      igual(d.mov.tipo, "remate", "con el remate:");
      HOLMR.cerrar();
      igual(st.vencidos, 1, "venció a Ketil:");
      si(PODERES.pj().plata >= pl + HOLMR.KEMPUR[0].plata, "pagó");
      // Björn traba escudos: hay que machacar atacar
      st.vencidos = 2;
      d = await arrancar();
      let tr = null;
      for (let i = 0; i < 10 && !tr; i++) {
        const mm = await ventana(d);
        if (mm.tipo === "traba") tr = mm;
        else contestar(mm);
        await esperar(20);
      }
      si(tr && tr.pide === "machacar" && tr.n === 6, "la traba pide seis golpes");
      HOLMR.responder("atacar");
      igual(tr.hechos, 1, "cuenta cada golpe:");
      for (let i = 0; i < 5; i++) HOLMR.responder("atacar");
      igual(tr.res, "justo", "empujó:");
      HOLMR.terminar(false, "lejos");
      igual(A.J.modo, "juego", "salir lo cierra:");
    } },
    { nombre: "hólmganga: los rápidos encadenan, el quinto da el título, un retador por día y todo se guarda", fn: async (A, { igual, si }) => {
      const st = HOLMR.estado();
      st.vencidos = 3;
      let d = await arrancar();
      const m = await ventana(d);
      si(d.cola.length === 1 && m.tipo !== "abierto", "Ásgerd encadena dos ataques");
      igual(d.ficha.fallos, 2, "perdona dos:");
      HOLMR.terminar(false, "lejos");
      st.vencidos = 4;
      const m0 = A.J.mulDano;
      d = await arrancar();
      igual(d.nombre, I18N.t("hm.k4"), "Úlfhild:");
      await ganar(d);
      HOLMR.cerrar();
      si(st.campeon, "campeón");
      si(A.J.mulDano > m0 * 1.04, "+5 % de daño");
      const r = HOLMR.siguiente();
      si(r && r.retador && r.ficha.fallos === 2 && r.ficha.ventana < HOLMR.KEMPUR[(r.ficha.pal + 2) % 5].ventana, "viene un retador más rápido");
      d = await arrancar();
      await ganar(d);
      HOLMR.cerrar();
      igual(HOLMR.siguiente(), null, "uno por día:");
      si(HOLMR.sistema.celdasBolsa().length === 1 && HOLMR.sistema.diario().includes(I18N.t("hm.diario_t")), "en la Bolsa y el diario");
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(200);
      si(HOLMR.estado().campeon && HOLMR.estado().vencidos === 5, "quedó guardado");
    } },
  );
}
