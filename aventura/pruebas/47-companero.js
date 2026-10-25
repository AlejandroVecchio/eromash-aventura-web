// Pruebas de Skuggi, el perro compañero (motor/companero.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const traer = (A, dx, dy, tipo) => {
    const e = A.CB.crear(tipo || "lobo", A.jug.x + dx, A.jug.y + dy, {});
    e.activo = true;
    e.estado = "persigue";
    A.enemigos.push(e);
    return e;
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "compañero: Skuggi herido junto a un camino del Puesto, con lobos que aparecen al acercarse", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      A.enemigos.forEach((e) => (e.activo = false));
      const l = COMPANERO.lugar(),
        P = A.W.LUGARES.puesto;
      const d = Math.hypot(l[0] - P.p[0], l[1] - P.p[1]);
      si(d > P.r + 2000 && d < P.r + 5600, "a una caminata del Puesto: " + Math.round(d));
      si(A.W.sueloEn(l[0], l[1]) === 0 && A.W.libre(l[0], l[1], 20), "en tierra firme y libre");
      si(A.W.CAMINOS.some((k) => A.W.distLinea(l[0], l[1], k.p) < k.w / 2 + 400), "junto a un camino");
      igual(COMPANERO.perro().estado, "herido", "herido:");
      igual(COMPANERO.sistema.marcasMapa()[0].tipo, "companero", "en el mapa:");
      // de cerca aparecen los lobos; con lobos vivos no se lo atiende
      A.jug.x = l[0];
      A.jug.y = l[1] + 400;
      await esperar(150);
      const lobos = COMPANERO.lobos();
      igual(lobos && lobos.length, 3, "tres lobos:");
      A.jug.x = l[0] + 40;
      A.jug.y = l[1] + 60;
      const of = [];
      COMPANERO.sistema.cercanos((dd, txt) => of.push(txt));
      igual(of.length, 0, "con lobos no:");
      lobos.forEach((e) => A.CB.golpear(A.J, e, 9999, A.jug.x, A.jug.y, 1));
      const of2 = [];
      COMPANERO.sistema.cercanos((dd, txt, fn) => of2.push([txt, fn]));
      igual(of2[0] && of2[0][0], I18N.t("cp.atender"), "ahora sí:");
      of2[0][1]();
      si(COMPANERO.estado().rescatado, "rescatado");
      igual(A.enemigos.filter((e) => e.companero).length, 0, "los lobos se van de la lista:");
      A.J.modo = "juego";
    } },
    { nombre: "compañero: sigue a Eromash, vuelve si queda lejos, muerde, se cansa y salta fuera de los avisos", fn: async (A, { igual, si }) => {
      const p = COMPANERO.perro();
      A.jug.x += 600;
      await esperar(2500);
      si(Math.hypot(p.x - A.jug.x, p.y - A.jug.y) < 330, "lo siguió");
      // lejos: vuelve solo
      A.jug.x += 3000;
      await esperar(150);
      si(Math.hypot(p.x - A.jug.x, p.y - A.jug.y) < 200, "volvió al lado");
      // muerde a lo que ataca
      const e = traer(A, 150, 0, "draugr");
      e.vida = 9999;
      const v0 = e.vida,
        m0 = COMPANERO.estado().mordiscos;
      await esperar(2200);
      si(e.vida < v0 && COMPANERO.estado().mordiscos > m0, "mordió " + [v0, Math.round(e.vida), COMPANERO.estado().mordiscos, m0]);
      // se cansa
      p.aguante = 5;
      await esperar(1200);
      igual(p.estado, "cansado", "cansado:");
      p.aguante = 100;
      p.estado = "sigue";
      e.activo = false;
      // un aviso del piso encima: salta afuera
      const a = { forma: "circulo", x: p.x, y: p.y, dur: 0.5, t: 0.3, radio: 80 };
      A.J.avisos.push(a);
      await esperar(80);
      si(p.salto > 0, "saltó");
      A.J.quitarAviso(a);
      // adentro de una casa espera afuera y al salir aparece al lado
      A.J.dentro = { paso() {}, dibujar() {}, cercano: () => null };
      await esperar(60);
      A.jug.x += 1300;
      A.J.dentro = null;
      await esperar(80);
      si(Math.hypot(p.x - A.jug.x, p.y - A.jug.y) < 200, "al salir, al lado");
    } },
    { nombre: "compañero: el vínculo enseña trucos, acariciar una vez por día, quedarse y buscar, y la lealtad suma daño", fn: async (A, { igual, si }) => {
      const st = COMPANERO.estado();
      st.vinculo = 0;
      igual(COMPANERO.nivel(), 1, "empieza en 1:");
      COMPANERO.acariciar();
      igual(st.vinculo, 15, "acariciar suma:");
      COMPANERO.acariciar();
      igual(st.vinculo, 15, "una vez por día:");
      igual(COMPANERO.buscar(), false, "sin olfato no busca:");
      COMPANERO.sumar(120);
      si(COMPANERO.sabe(3), "aprendió olfato");
      const pl = PODERES.pj().plata,
        p0 = COMPANERO.perro();
      si(COMPANERO.buscar(), "busca");
      await esperar(1800);
      si(PODERES.pj().plata > pl && st.hallazgos >= 1, "encontró algo");
      igual(COMPANERO.buscar(), false, "una vez por día:");
      // lealtad
      const d0 = A.J.mulDano;
      COMPANERO.sumar(500);
      si(A.J.mulDano > d0 * 1.04, "lealtad +5 %");
      COMPANERO.quedarse();
      si(A.J.mulDano < d0 * 1.04 + 0.001 && st.quieto, "quieto, sin lealtad");
      const p = COMPANERO.perro(),
        x0 = p.x;
      A.jug.x += 800;
      await esperar(400);
      igual(p.x, x0, "se queda:");
      igual(COMPANERO.sistema.marcasMapa()[0].op.nombre, I18N.t("cp.esperando"), "el mapa dice dónde espera:");
      COMPANERO.llamar();
      si(!st.quieto && Math.hypot(p.x - A.jug.x, p.y - A.jug.y) < 200, "llamado, vuelve");
      // derriba: cada tercer mordisco
      const e = traer(A, 120, 0, "lobo");
      e.vida = 9999;
      st.mordiscos = 2;
      p.mord = 0;
      p.obj = e;
      p.x = e.x - 40;
      p.y = e.y;
      await esperar(200);
      si(e.aturdido > 0, "derribado");
      e.activo = false;
    } },
    { nombre: "compañero: olfato ladra a lo que no te vio, aullido con poca vida y todo se guarda", fn: async (A, { igual, si }) => {
      const p = COMPANERO.perro();
      const e = traer(A, 500, 0, "lobo");
      e.estado = "quieto";
      e.vio = 0;
      COMPANERO.olfatear();
      si(p.ladra > 0, "ladró");
      e.activo = false;
      const c = traer(A, 120, 60, "lobo");
      p.x = A.jug.x + 40;
      p.y = A.jug.y;
      A.jug.hp = A.jug.hpMax * 0.2;
      await esperar(150);
      si(c.aturdido > 0, "el aullido la espanta");
      c.activo = false;
      A.jug.hp = A.jug.hpMax;
      si(COMPANERO.sistema.celdasBolsa().length === 1 && COMPANERO.sistema.diario().includes(I18N.t("cp.diario_t")), "en la Bolsa y el diario");
      COMPANERO.quedarse();
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(200);
      si(COMPANERO.estado().rescatado && COMPANERO.estado().quieto, "quedó guardado");
      const q = COMPANERO.estado().quieto;
      igual(Math.round(COMPANERO.perro().x), q[0], "espera donde lo dejaste:");
      COMPANERO.seguir();
    } },
  );
}
