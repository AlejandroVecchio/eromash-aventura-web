// ---------- los grupos de criaturas del bosque (sistema HORDAS) ----------
// Como en Diablo 2: las criaturas viven en grupos alrededor de un tótem, y casi todos tienen un líder más grande,
// con nombre propio, aura de color y uno o dos afijos (veloz, piel de piedra, ígneo, helado, rúnico). Cada grupo usa
// una variante de color. Algunos lugares tienen un líder único con nombre fijo que no vuelve cuando muere.
// Los grupos muertos vuelven al rato si Eromash está lejos; los muertos de noche solo salen de noche.
window.HORDAS = (function () {
  "use strict";
  let A, J, jug, W, CB;
  const t = (k, v) => I18N.t(k, v);
  const rnd = DIB.azar(5551024);
  const grupos = []; // { id, centro, miembros[], unico, noche, muerto (tiempo), activo }
  let st = null;
  const NOMBRES = ["Hrok", "Skaldi", "Gorm", "Ulfrik", "Vigga", "Thrand", "Grima", "Kolbein", "Hjalti", "Sigvat", "Asgaut", "Brynja", "Eyvind", "Hallbjorn", "Ragna", "Torvald", "Snorri", "Geirny", "Orvar", "Hrefna"];
  const EPITETOS = 16;
  const AF = ["veloz", "piedra", "igneo", "helado", "runico"];
  function lider(extra = {}) {
    const n = NOMBRES[Math.floor(rnd() * NOMBRES.length)],
      ep = Math.floor(rnd() * EPITETOS);
    const afijos = [AF[Math.floor(rnd() * AF.length)]];
    if (rnd() < 0.35) {
      const b = AF[Math.floor(rnd() * AF.length)];
      if (b !== afijos[0]) afijos.push(b);
    }
    return Object.assign({ base: n, ep, afijos }, extra);
  }
  // el texto del líder se arma en el idioma actual
  function rotular(l) {
    if (l.unico) {
      l.nombre = t("hd.unico_" + l.unico);
      l.titulo = t("hd.unico_titulo");
    } else {
      l.nombre = l.base + " " + t("hd.ep_" + l.ep);
      l.titulo = l.afijos.map((a) => t("hd.af_" + a)).join(" · ");
    }
  }
  // familias: qué criaturas forman cada grupo
  const FAMILIAS = {
    lobos: { lider: "lobo", miembros: ["lobo", "lobo", "lobo"], totem: "lobo" },
    jabalies: { lider: "jabali", miembros: ["jabali", "jabali", "jabali"], totem: "jabali" },
    draugr: { lider: "draugr", miembros: ["draugr", "draugr", "errante", "draugr"], totem: "draugr" },
    cuervos: { lider: "cuervo", miembros: ["cuervo", "cuervo", "cuervo", "cuervo", "cuervo"], totem: "cuervo" },
    fatuos: { lider: "fatuo", miembros: ["fatuo", "fatuo", "fatuo"], totem: "fatuo" },
    muertos: { lider: "draugr", miembros: ["errante", "errante", "errante", "fatuo"], totem: "draugr" },
    trol: { lider: "trol", miembros: ["jabali", "jabali"], totem: "trol" },
  };
  function crearGrupo(fam, centro, op = {}) {
    const F = FAMILIAS[fam];
    const g = { id: grupos.length, fam, centro, miembros: [], unico: op.unico || null, noche: !!op.noche, muerto: 0, activo: true, mas: op.mas || 1 };
    const pal = op.pal != null ? op.pal : Math.floor(rnd() * 3);
    const lista = g.miembros;
    const n = op.n || F.miembros.length - (rnd() < 0.3 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd(),
        r = 90 + rnd() * 120;
      const tipo = op.miembros ? op.miembros[i % op.miembros.length] : F.miembros[i % F.miembros.length];
      const e = CB.crear(tipo, centro[0] + Math.cos(a) * r, centro[1] + Math.sin(a) * r * 0.7, { pal, grupo: lista, mas: g.mas });
      lista.push(e);
    }
    if (op.lider !== false && (op.unico || rnd() < 0.75)) {
      const l = op.unico ? { unico: op.unico, afijos: op.afijos || ["piedra"] } : lider(op.afijos ? { afijos: op.afijos } : {});
      rotular(l);
      const e = CB.crear(op.tipoLider || F.lider, centro[0], centro[1] + 30, { pal: op.palLider != null ? op.palLider : pal, grupo: lista, lider: l, mas: g.mas });
      if (op.unico) {
        e.s = op.escala || 1.35;
        e.d.radio *= e.s;
        e.d.barra *= e.s;
        e.d.vida = e.vida = Math.round(e.d.vida * (op.vidaUnico || 2.4));
      }
      lista.push(e);
    }
    lista.forEach((e) => {
      e.hordaGrupo = g;
      A.enemigos.push(e);
    });
    grupos.push(g);
    return g;
  }

  function armar() {
    const L = W.LUGARES,
      mas2 = W.mas;
    // grupos fijos de cada lugar de secretos
    crearGrupo("draugr", mas2(L.skarnholt.p, 0, 2), { pal: 1, mas: 1.25, afijos: ["igneo"] });
    crearGrupo("draugr", mas2(L.tumulo.p, 0, 1), { pal: 0, mas: 1.45, afijos: ["runico"] });
    crearGrupo("muertos", mas2(L.tumulo.p, -8, 6), { pal: 2, mas: 1.4, noche: true });
    crearGrupo("cuervos", mas2(L.torre.p, 2, 6), { pal: 0, mas: 2, tipoLider: "draugr", palLider: 2, afijos: ["helado", "veloz"] });
    const lago = W.LAGOS[1];
    crearGrupo("fatuos", [lago.p[0] + 300, lago.p[1] - lago.ry - 260], { pal: 1, mas: 1.3, afijos: ["helado"] });
    // los únicos, con nombre fijo
    crearGrupo("trol", mas2(L.caravana.p, 2, 2), { pal: 0, unico: "hrungnir", afijos: ["piedra"], mas: 1.5, escala: 1.25 });
    crearGrupo("jabalies", W.m(1010, 285), { pal: 1, unico: "kolbrandr", afijos: ["igneo", "veloz"], tipoLider: "jabali", mas: 1.8, n: 4 });
    crearGrupo("fatuos", [W.LAGOS[2].p[0] - W.LAGOS[2].rx - 200, W.LAGOS[2].p[1]], { pal: 2, unico: "mjoll", afijos: ["runico"], tipoLider: "fatuo", mas: 1.4, miembros: ["errante", "fatuo", "errante"] });
    crearGrupo("trol", W.m(1330, 640), { pal: 1, unico: "grid", afijos: ["helado", "piedra"], mas: 2.2, miembros: ["draugr", "draugr"], escala: 1.3 });
    // grupos sueltos por todo el bosque
    const prohibidos = ["puesto", "carro", "refugio", "casa_lindes", "eikholt", "paso_sur", "paso", "tala", "claro", "claro_entrada", "quebrada_rastreo", "entrada_sur", "skarnholt", "tumulo", "torre", "caravana", "santuario", "aserradero"];
    let intentos = 0;
    const centros = grupos.map((g) => g.centro);
    while (grupos.length < 54 && intentos++ < 2500) {
      const p = [W.BORDE * 1.3 + rnd() * (W.ANCHO - W.BORDE * 2.6), W.BORDE + rnd() * (W.ALTO - W.BORDE * 2.2)];
      if (centros.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 2300)) continue;
      if (Math.hypot(p[0] - W.CIUDAD.c[0], (p[1] - W.CIUDAD.c[1]) * 1.3) < W.CIUDAD.rx + 1400) continue;
      if (prohibidos.some((k) => Math.hypot(p[0] - L[k].p[0], p[1] - L[k].p[1]) < L[k].r + 900)) continue;
      if (Math.hypot(p[0] - L.puesto.p[0], p[1] - L.puesto.p[1]) < 3200) continue;
      if (W.CAMINOS.some((c) => W.distLinea(p[0], p[1], c.p) < c.w / 2 + 260)) continue;
      if (!W.libre(p[0], p[1], 60)) continue;
      // la familia depende del lugar: lagunas, al este del río, al norte de la quebrada, el oeste
      const cerLago = W.LAGOS.some((l) => Math.hypot(p[0] - l.p[0], p[1] - l.p[1]) < l.rx + 2600);
      const norte = W.distLinea(p[0], p[1], W.QUEBRADA.p) < 99999 && p[1] < W.m(0, 160)[1];
      const este = p[0] > W.m(1150, 0)[0];
      const k = rnd();
      let fam;
      if (cerLago) fam = k < 0.7 ? "fatuos" : "muertos";
      else if (norte) fam = k < 0.5 ? "cuervos" : k < 0.85 ? "lobos" : "trol";
      else if (este) fam = k < 0.35 ? "draugr" : k < 0.6 ? "cuervos" : k < 0.85 ? "jabalies" : "trol";
      else fam = k < 0.32 ? "lobos" : k < 0.62 ? "jabalies" : k < 0.82 ? "draugr" : k < 0.92 ? "cuervos" : "muertos";
      const masK = 1 + Math.hypot(p[0] - L.puesto.p[0], p[1] - L.puesto.p[1]) / 14000;
      const noche = (fam === "muertos" || fam === "draugr") && rnd() < 0.4;
      crearGrupo(fam, p, { mas: masK, noche, lider: fam === "trol" ? true : undefined, palLider: fam === "trol" ? Math.floor(rnd() * 3) : undefined });
      W.agregar("totemCampamento", [p[0] + 60, p[1] - 40], { tipo: FAMILIAS[fam].totem, s: 0.9 });
      centros.push(p);
    }
  }

  function revivir(g) {
    g.miembros.forEach((e) => CB.reiniciar(e));
    g.muerto = 0;
  }
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      CB = A.CB;
      armar();
      st = { unicos: {} };
    },
    alEmpezar(extra) {
      extra.hd = Object.assign({ unicos: {} }, extra.hd || {});
      st = extra.hd;
      grupos.forEach((g) => {
        revivir(g);
        if (g.unico && st.unicos[g.unico]) g.miembros.forEach((e) => e.lider && (e.muerto = 1));
        g.miembros.forEach((e) => e.lider && rotular(e.lider)); // por si cambió el idioma
      });
    },
    actualizar(dt) {
      const noche = A.noche() > 0.6;
      for (const g of grupos) {
        const d = Math.hypot(g.centro[0] - jug.x, g.centro[1] - jug.y);
        // los muertos de noche aparecen y desaparecen lejos de la vista
        if (g.noche && d > 1800) {
          const activo = noche;
          if (activo !== g.activo) {
            g.activo = activo;
            g.miembros.forEach((e) => {
              e.activo = activo;
              if (activo && !g.muerto) CB.reiniciar(e);
            });
          }
        }
        // un grupo entero muerto vuelve a los 7 minutos si Eromash está lejos (los únicos no vuelven)
        if (!g.muerto && g.miembros.every((e) => e.muerto > 0)) g.muerto = A.H.E.tiempo;
        if (g.muerto && A.H.E.tiempo - g.muerto > 420 && d > 2600) {
          revivir(g);
          if (g.unico && st.unicos[g.unico]) g.miembros.forEach((e) => e.lider && (e.muerto = 1));
        }
      }
    },
    alMorir(e) {
      const g = e.hordaGrupo;
      if (!g) return;
      const k = g.mas || 1;
      if (e.lider || Math.random() < 0.55) PODERES.soltar(e.x, e.y, "plata", Math.round(e.d.plata * k * (0.7 + Math.random() * 0.6)));
      if (e.lider || Math.random() < 0.16) PODERES.soltar(e.x, e.y, "vida", e.lider ? 40 : 18);
      if (e.lider && (e.lider.unico || Math.random() < 0.25)) J.retrasar(0.6, () => PODERES.darFragmento());
      if (e.lider) {
        HUD.aviso(t(e.lider.unico ? "hd.unico_caido" : "hd.lider_caido", [e.lider.nombre]), e.lider.unico ? "#FFD98A" : "#E0B2B2");
        if (e.lider.unico) st.unicos[e.lider.unico] = true;
      }
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { grupos };
})();
