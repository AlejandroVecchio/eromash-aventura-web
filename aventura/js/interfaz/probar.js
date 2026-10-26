// ---------- el menú para probar las mecánicas (sistema PROBAR) ----------
// Pedido de Alejandro: un menú con cada mecánica del juego para probarla directo (yunque, cocina, alquimia, pelea,
// juego de la memoria…). Se abre desde el título y la pausa («Probar mecánicas») o con ?probar=1, siempre en la
// partida de prueba (ranura 9, la misma de Probar del editor y de las pruebas): las partidas 1 a 3 no se tocan. Cada
// entrada da lo que hace falta (plata, materiales, hierbas, la caña), lleva a Eromash donde corresponde y abre el
// minijuego o la pelea. Un sistema nuevo con algo para probar suma su entrada en GRUPOS. Textos `pb.`.
window.PROBAR = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const RANURA = 9;
  const hay = (n) => !!window[n];

  // ---------- lo que se da ----------
  function darTodo() {
    if (window.MATERIALES) MATERIALES.LISTA.forEach((m) => MATERIALES.dar(m, 20));
    if (window.ALQUIMIA) Object.keys(ALQUIMIA.HIERBAS).forEach((h) => (ALQUIMIA.estado().hierbas[h] = Math.max(ALQUIMIA.estado().hierbas[h] || 0, 12)));
    if (window.COCINA) Object.keys(COCINA.CARNES).forEach((k) => (COCINA.estado().carne[k] = Math.max(COCINA.estado().carne[k] || 0, 6)));
    if (window.INVENTARIO && INVENTARIO.repintar) INVENTARIO.repintar();
  }
  const plata = (n) => window.PODERES && (PODERES.pj().plata = Math.max(PODERES.pj().plata, n));
  function niveles(n) {
    if (!window.RPG || !RPG.estado()) return;
    const meta = Math.min(RPG.TOPE, RPG.nivel() + n),
      k = (RPG.stats() && RPG.stats().xp) || 1;
    for (let i = 0; i < 60 && RPG.nivel() < meta; i++) RPG.dar(Math.ceil((RPG.xpPara(RPG.nivel()) - RPG.estado().xp) / k) + 1, jug.x, jug.y);
  }
  // la hora de hoy (sin cambiar de día): 9 es la hora en que arranca el reloj
  function hora(h) {
    const D = LUZ.DIA,
      dia = Math.floor(A.H.E.tiempo / D);
    A.H.E.tiempo = dia * D + (((h - 9 + 24) % 24) / 24) * D;
  }
  // sacar de encima lo que tapa la pantalla antes de abrir otra cosa
  function limpiar() {
    if (window.INVENTARIO && INVENTARIO.abierta && INVENTARIO.abierta()) INVENTARIO.cerrar();
    A.cerrarMenu();
  }

  // ---------- ir a un lugar ----------
  // un punto libre cerca de (x, y), probando anillos cada vez más grandes
  function libreCerca(x, y, r0 = 0, r1 = 700, sirve = null) {
    for (let r = r0; r <= r1; r += 30)
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2 + r * 0.01,
          px = x + Math.cos(a) * r,
          py = y + Math.sin(a) * r * 0.8;
        if (W.libre(px, py, 20) && W.sueloEn(px, py) === 0 && (!sirve || sirve(px, py))) return [px, py];
      }
    return null;
  }
  // viaja (con la columna rúnica de siempre) y después hace lo que sigue
  function ir(x, y, luego, r0 = 0, sirve = null) {
    const p = libreCerca(x, y, r0, 700, sirve);
    if (!p) return HUD.aviso(t("pb.lejos"), "#C8402D");
    limpiar();
    if (Math.hypot(p[0] - jug.x, p[1] - jug.y) < 200) return luego && luego();
    A.teletransportar(p[0], p[1]);
    if (luego) setTimeout(() => J.modo === "juego" && luego(), 900);
  }
  // el grupo vivo más cercano de una familia de HORDAS (bandidos y arañas también son grupos)
  function grupoDe(fam) {
    if (!window.HORDAS) return null;
    let mejor = null,
      dm = Infinity;
    HORDAS.grupos.forEach((g) => {
      if (g.fam !== fam || !g.miembros.some((e) => !e.muerto)) return;
      const d = Math.hypot(g.centro[0] - jug.x, g.centro[1] - jug.y);
      if (d < dm) (dm = d), (mejor = g);
    });
    return mejor;
  }
  function pelearCon(fam) {
    const g = grupoDe(fam);
    if (!g) return HUD.aviso(t("pb.lejos"), "#C8402D");
    g.miembros.forEach((e) => !e.muerto && (e.activo = true));
    ir(g.centro[0], g.centro[1], null, 420);
  }

  // ---------- las entradas ----------
  // cada una: id (su texto pb.<id> y pb.<id>_d), si está (el sistema cargado) y qué hace
  const GRUPOS = [
    {
      id: "oficios",
      lista: () => [
        { id: "yunque", si: hay("FORJA"), fn: () => (limpiar(), FORJA.empezar(FORJA.baseDe(FORJA.GRUPOS[0]), "calma", 0, null)) },
        { id: "yunque_fuego", si: hay("FORJA"), fn: () => (limpiar(), FORJA.empezar(FORJA.baseDe(FORJA.GRUPOS[1]), "fuego", 0, null)) },
        { id: "forja_menu", si: hay("FORJA"), fn: () => (plata(5000), darTodo(), FORJA.abrir()) },
        { id: "cocina", si: hay("COCINA"), fn: () => (darTodo(), COCINA.menuFogata()) },
        { id: "matraz", si: hay("ALQUIMIA") && hay("MATRAZ"), fn: () => (darTodo(), limpiar(), ALQUIMIA.enMatraz("pocion", Object.keys(ALQUIMIA.POCIONES)[0])) },
        { id: "mesa", si: hay("ALQUIMIA"), fn: () => (darTodo(), limpiar(), ALQUIMIA.abrirMesa()) },
        {
          id: "pesca",
          si: hay("PESCA") && !!PESCA.puesto(),
          fn: () => {
            PESCA.tomarCana();
            const p = PESCA.puesto();
            // a un paso del agua, donde la caña llega
            ir(p.x, p.y, () => PESCA.empezar(), 40, (x, y) => !!PESCA.aguaCerca(x, y));
          },
        },
        { id: "libro", si: hay("LIBROS"), fn: () => (limpiar(), LIBROS.leer(LIBROS.IDS[0])) },
        { id: "tienda", si: hay("COMERCIO"), fn: () => (plata(3000), limpiar(), COMERCIO.abrir("ingrid")) },
        { id: "tintes", si: hay("TINTES"), fn: () => (plata(3000), limpiar(), TINTES.abrir()) },
      ],
    },
    {
      id: "juegos",
      lista: () => [
        ...["parejas", "simon", "mente"].map((tipo) => ({ id: tipo, si: hay("JUEGOS_RUNAS"), fn: () => (limpiar(), JUEGOS_RUNAS.empezar(tipo)) })),
        // sus variantes (las que piden los hörgar)
        ...(hay("JUEGOS_RUNAS") ? ["parejas", "simon", "mente"] : []).flatMap((tipo) =>
          Object.keys(JUEGOS_RUNAS.VARIANTES[tipo])
            .filter((v) => v !== "base")
            .map((v) => ({ id: tipo + "_" + v, si: true, texto: t("pb." + tipo) + " · " + t("jr.v_" + tipo + "_" + v), sub: t("pb.jr_v_d"), fn: () => (limpiar(), JUEGOS_RUNAS.empezar(tipo, { variante: v })) }))
        ),
        {
          id: "holmr",
          si: hay("HOLMR") && !!HOLMR.centro(),
          fn: () => {
            const C = HOLMR.centro();
            // si ya le ganó a los cinco y al retador de hoy, vuelve a empezar la lista
            if (!HOLMR.siguiente()) Object.assign(HOLMR.estado(), { vencidos: 0, retadorDia: -1 });
            ir(C[0] - 200, C[1], () => {
              A.enemigos.forEach((e) => Math.hypot(e.x - jug.x, e.y - jug.y) < 1500 && (e.activo = false));
              HOLMR.empezar();
            });
          },
        },
      ],
    },
    {
      // los minijuegos de MINIJ, cada uno con sus variantes (se listan solos al registrarse)
      id: "minijuegos",
      lista: () =>
        hay("MINIJ")
          ? MINIJ.lista().map(({ tipo, variante }) => ({
              id: "mj_" + tipo + "_" + variante,
              si: true,
              texto: t("mn.probar", [t("mn." + tipo), variante === "base" ? t("mn.base") : t("mn." + tipo + "_v_" + variante)]),
              sub: t("pb.mj_d"),
              fn: () => (limpiar(), MINIJ.empezar(tipo, { variante })),
            }))
          : [],
    },
    {
      id: "pelea",
      lista: () => [
        {
          id: "muneco",
          si: hay("INSTRUCTORES") && !!INSTRUCTORES.muneco(),
          fn: () => {
            const m = INSTRUCTORES.muneco();
            ir(m.x - 90, m.y + 20, () => INSTRUCTORES.empezar("medir"));
          },
        },
        ...["lobos", "jabalies", "draugr", "trol", "bandidos", "aranas"].map((fam) => ({ id: "grupo", fam, si: !!grupoDe(fam), fn: () => pelearCon(fam) })),
        {
          id: "jotunn",
          si: hay("JOTUNN") && !!JOTUNN.jefe(),
          fn: () => {
            const st = JOTUNN.estado(),
              j = JOTUNN.jefe();
            st.guardianes = [1, 1, 1];
            st.vencido = false;
            niveles(Math.max(0, 12 - (window.RPG ? RPG.nivel() : 12)));
            ir(j.centro[0], j.centro[1] + JOTUNN.ANILLO * 0.6, null);
          },
        },
        {
          id: "trueno",
          si: hay("ELEMENTOS") && !!ELEMENTOS.roble(),
          fn: () => {
            const r = ELEMENTOS.roble().cosa;
            ELEMENTOS.estado().roble = false;
            ir(r.x, r.y + 160, () => ELEMENTOS.empezarPrueba(), 120);
          },
        },
        {
          id: "caceria",
          si: hay("CACERIA"),
          fn: () => {
            hora(23);
            CACERIA.estado().corrida = -1;
            limpiar();
            setTimeout(() => CACERIA.tocarCuerno(), 300);
          },
        },
      ],
    },
    {
      id: "zonas",
      lista: () =>
        hay("ZONAS")
          ? ZONAS.zonas()
              .filter((Z) => Z.llegada)
              .map((Z) => ({ id: "zona", texto: Z.d.nombre || Z.id, si: true, fn: () => (limpiar(), ZONAS.entrar(Z.id)) }))
          : [],
    },
    {
      // los gestos de Eromash (personajes/animacion.js), los de uso y los de reserva, y absorber con varias energías
      id: "gestos",
      lista: () => [
        ...(window.ANIMA ? ANIMA.GESTOS : []).map((g) => ({ id: "gesto", texto: t("pb.ge_" + g), si: true, fn: () => (A.cerrarMenu(), J.retrasar(0.3, () => ANIMA.gesto(g, 0, g === "tesoro" ? { col: "#F5A524" } : {}))) })),
        ...[
          ["runico", "#73D5DB", "#C8F2F4", "rombo"],
          ["oro", "#FFD98A", "#FFE7A8", "chispa"],
          ["vida", "#7BC86C", "#F2ECEC", "cuadro"],
          ["violeta", "#9A6BD8", "#E0B2B2", "chispa"],
        ].map(([id, col, col2, forma]) => ({ id: "absorber", texto: t("pb.ab_" + id), si: hay("ANIMA"), fn: () => (A.cerrarMenu(), J.retrasar(0.3, () => ANIMA.absorber({ col, col2, forma }))) })),
      ],
    },
    {
      id: "ayudas",
      lista: () => [
        { id: "plata", queda: true, si: hay("PODERES"), fn: () => (PODERES.darPlata(1000), HUD.aviso(t("pb.listo"), "#FFD98A")) },
        { id: "materiales", queda: true, si: true, fn: () => (darTodo(), HUD.aviso(t("pb.listo"), "#7BC86C")) },
        { id: "niveles", queda: true, si: hay("RPG"), fn: () => niveles(5) },
        { id: "curar", queda: true, si: true, fn: () => ((jug.hp = jug.hpMax), (jug.sta = jug.staMax), HUD.aviso(t("pb.listo"), "#7BC86C")) },
        { id: "noche", queda: true, si: true, fn: () => hora(23) },
        { id: "dia", queda: true, si: true, fn: () => hora(10) },
        { id: "cero", si: true, fn: () => (JUEGO.empezar(RANURA, true), darTodo(), abrir()) },
      ],
    },
  ];

  // ---------- los menús ----------
  const g = CONTROLES.glifo;
  // desdeTitulo: no hay partida andando (desde el título o con ?probar=1)
  function abrir(desdeTitulo) {
    // siempre en la partida de prueba: la de antes queda guardada
    if (desdeTitulo === true || A.H.E.ranura !== RANURA) {
      if (desdeTitulo !== true) A.H.guardar();
      JUEGO.empezar(RANURA, !A.H.resumen(RANURA));
    }
    const bot = GRUPOS.map((gr) => ({ texto: t("pb.g_" + gr.id), sub: t("pb.g_" + gr.id + "_d"), fn: () => grupo(gr) }));
    bot.push({ texto: t("pb.cerrar"), fn: A.cerrarMenu });
    A.menu(`<h2>${t("pb.titulo")}</h2><div class="sub">${t("pb.sub")}</div>`, bot);
  }
  function grupo(gr) {
    const bot = gr
      .lista()
      .filter((e) => e.si)
      .map((e) => ({
        texto: e.texto || (e.fam ? t("pb.grupo", [t("pb.f_" + e.fam)]) : t("pb." + e.id)),
        sub: e.sub || t("pb." + e.id + "_d"),
        // las ayudas (queda) siguen en el menú; lo demás lo cierra y abre lo suyo
        fn: () => (e.fn(), e.queda && grupo(gr)),
      }));
    if (!bot.length) bot.push({ texto: t("pb.no_hay"), fn: () => grupo(gr) });
    bot.push({ texto: t("pb.volver"), fn: abrir });
    A.menu(`<h2>${t("pb.g_" + gr.id)}</h2><div class="sub">${t("pb.titulo")}</div>`, bot);
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      if (/[?&]probar=1/.test(location.search)) setTimeout(() => abrir(true), 400);
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, abrir, grupo, GRUPOS, RANURA, darTodo, libreCerca };
})();
