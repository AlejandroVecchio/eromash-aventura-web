// Pruebas de los remates (motor/remates.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "remates: quién se puede rematar (malherida, aturdida, dura, jefe)", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      A.enemigos.forEach((e) => (e.activo = false));
      const lobo = A.CB.crear("lobo", A.jug.x + 80, A.jug.y, {});
      lobo.activo = true;
      const max = lobo.d.vida;
      lobo.vida = max * 0.5;
      igual(REMATES.puede(lobo), false, "a media vida no:");
      lobo.vida = max * 0.2;
      si(REMATES.puede(lobo), "malherido sí");
      lobo.vida = max * 0.35;
      lobo.aturdido = 1;
      si(REMATES.puede(lobo), "aturdido con el doble de margen");
      lobo.aturdido = 0;
      const oso = A.CB.crear("oso", A.jug.x + 80, A.jug.y, {});
      oso.activo = true;
      oso.vida = oso.d.vida * 0.18;
      si(!REMATES.puede(oso) || !oso.d.pesado, "una pesada pide menos del 12 %");
      const jotunn = { tipo: "jotunn", activo: true, muerto: 0, vida: 1, d: { vida: 2600 } };
      igual(REMATES.puede(jotunn), false, "el jötunn no:");
    } },
    { nombre: "remates: rematar salta, mata, deja vida y estamina, asusta a las de cerca y se cuenta", fn: async (A, { igual, si }) => {
      const st = REMATES.estado();
      const n0 = st.n;
      const lobo = A.CB.crear("lobo", A.jug.x + 90, A.jug.y, {});
      lobo.activo = true;
      lobo.estado = "persigue";
      lobo.vida = lobo.d.vida * 0.1;
      const otro = A.CB.crear("lobo", A.jug.x + 200, A.jug.y + 40, {});
      otro.activo = true;
      otro.estado = "persigue";
      A.enemigos.push(lobo, otro);
      A.jug.hp = A.jug.hpMax * 0.5;
      A.jug.sta = 10;
      const hp0 = A.jug.hp;
      const ofertas = [];
      REMATES.sistema.cercanos((d, txt, fn) => ofertas.push([txt, fn]));
      const of = ofertas.find((o) => o[0].includes(I18N.t("rm." + REMATES.tipoArma())));
      si(of, "se remata con E");
      of[1]();
      si(REMATES.actual(), "empezó");
      si(A.jug.inv > 0, "nada lo toca mientras dura");
      for (let i = 0; i < 80 && REMATES.actual(); i++) await esperar(50);
      igual(REMATES.actual(), null, "terminó:");
      si(lobo.muerto > 0, "el lobo murió");
      igual(st.n, n0 + 1, "contado:");
      si(A.jug.hp > hp0, "vida de vuelta");
      si(A.jug.sta >= 40, "estamina de vuelta");
      si(otro.aturdido > 0 || otro.muerto, "el otro se asustó");
      si(Math.hypot(A.jug.x - lobo.x, A.jug.y - lobo.y) < 120, "Eromash saltó hasta el lobo");
      A.enemigos.splice(A.enemigos.indexOf(lobo), 1);
      A.enemigos.splice(A.enemigos.indexOf(otro), 1);
    } },
    { nombre: "remates: cada arma el suyo, el verdugo y todo se guarda", fn: async (A, { igual, si }) => {
      for (const k of Object.keys(REMATES.REMATES)) si(I18N.t("rm." + k) !== "rm." + k, "nombre del remate " + k);
      const st = REMATES.estado();
      const lobo = { tipo: "lobo", d: { vida: 100 }, vida: 20 };
      igual(REMATES.sistema.modDano(100, lobo), 100, "sin verdugo:");
      st.n = 10;
      igual(REMATES.verdugo(), 5, "verdugo 5 %:");
      igual(Math.round(REMATES.sistema.modDano(100, lobo)), 105, "+5 % a las malheridas:");
      igual(REMATES.sistema.modDano(100, { tipo: "lobo", d: { vida: 100 }, vida: 80 }), 100, "no a las sanas:");
      st.n = 50;
      igual(REMATES.verdugo(), 10, "verdugo 10 %:");
      st.porTipo.hacha = 30;
      si(REMATES.sistema.diario().includes(I18N.t("rm.hacha")), "el diario dice la favorita");
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(150);
      igual(REMATES.estado().n, 50, "quedó guardado:");
    } },
  );
}
