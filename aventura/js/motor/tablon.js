// ---------- el tablón de cacería del Puesto (sistema TABLON) ----------
// Una cacería repetible: en el tablón de Tove se toma un pedido (cazá N criaturas de un tipo que ande por el bosque),
// se sigue en el rastreador y se cobra en el mismo tablón. Cada pedido paga más que el anterior y uno de cada cuatro
// trae además un fragmento de poder. Qué se pide sale de la cuenta de pedidos hechos: igual en cada partida.
// Estado en E.extra.tablon = { pedido: { tipo, n, hechas } | null, hechos }.
window.TABLON = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  // lo que se puede pedir y cuántas
  const PRESAS = [
    ["lobo", 6],
    ["jabali", 4],
    ["cuervo", 6],
    ["errante", 5],
    ["draugr", 4],
    ["fatuo", 5],
  ];
  let st = { pedido: null, hechos: 0 },
    tablon = null;
  const paga = (h) => Math.min(130, 40 + h * 12);
  // los encargos por región: el tablón ofrece tres a la vez, cada uno en una zona con su rango de nivel. Las criaturas
  // cuentan solo si son de ese rango (hay que ir a esa zona); el más alto paga más, da más experiencia y trae fragmento.
  const BANDAS = [
    { id: "facil", de: -4, a: -1, k: 0.75, xp: 0.1 },
    { id: "justo", de: 0, a: 2, k: 1, xp: 0.16 },
    { id: "duro", de: 3, a: 7, k: 1.6, xp: 0.28, frag: true },
  ];
  const yo = () => (window.RPG ? RPG.nivel() : 1);
  const nivelDe = (e) => (window.RPG ? RPG.nivelDe(e) : 1);
  const pagaDe = (p) => Math.round(paga(st.hechos) * (1 + 0.1 * Math.max(0, (p.nivel || 1) - 1)) * (p.k || 1));
  const fragDe = (p) => !!p.frag || (st.hechos + 1) % 4 === 0;
  // el lugar con nombre más cercano a un punto
  function lugarCerca(x, y) {
    let m = null,
      dm = Infinity;
    for (const k in W.LUGARES) {
      if (t("av.lugar_" + k) === "av.lugar_" + k) continue;
      const L = W.LUGARES[k],
        d = Math.hypot(L.p[0] - x, L.p[1] - y);
      if (d < dm) (dm = d), (m = k);
    }
    return m;
  }
  // la presa de un grupo: el tipo que más se repite entre los que no son líder
  function presaDe(g) {
    const c = {};
    for (const e of g.miembros) if (!e.lider && !e.semi && !e.propio) c[e.tipo] = (c[e.tipo] || 0) + 1;
    let m = null;
    for (const k in c) if (!m || c[k] > c[m]) m = k;
    return m;
  }
  // los tres pedidos de hoy: uno por banda, si hay una zona en ese rango (sale de la cuenta de pedidos hechos)
  function ofertas() {
    if (!window.HORDAS || !window.RPG) {
      const p = proximo();
      return p ? [p] : [];
    }
    const n0 = yo(),
      l = [];
    BANDAS.forEach((b, bi) => {
      const cands = HORDAS.grupos.filter((g) => {
        if (!g.miembros || !g.miembros.length || g.fam === "bandidos" || g.fam === "aranas") return false;
        const tipo = presaDe(g);
        if (!tipo) return false;
        const nv = nivelDe(g.miembros.find((e) => e.tipo === tipo));
        return nv >= n0 + b.de && nv <= n0 + b.a;
      });
      if (!cands.length) return;
      const g = cands[(st.hechos * 7 + bi * 3) % cands.length],
        tipo = presaDe(g),
        nv = nivelDe(g.miembros.find((e) => e.tipo === tipo)),
        pr = PRESAS.find(([k]) => k === tipo);
      l.push({ tipo, n: pr ? pr[1] : 5, hechas: 0, nivel: nv, min: nv - 2, max: nv + 2, banda: b.id, k: b.k, xp: b.xp, frag: !!b.frag, x: g.centro[0], y: g.centro[1], lugar: lugarCerca(g.centro[0], g.centro[1]) });
    });
    return l;
  }
  const nombre = (p) => t("mj.caza_pide", [p.n, t("cr." + p.tipo)]) + (p.lugar ? " · " + t("mj.caza_cerca", [t("av.lugar_" + p.lugar)]) : "");
  const rango = (p) => (p.min != null ? t("mj.caza_rango", [Math.max(1, p.min), p.max]) : "");
  const listo = () => st.pedido && st.pedido.hechas >= st.pedido.n;
  // la presa del próximo pedido: la que toca por turno entre las que de verdad andan por el bosque
  function proximo() {
    const vivas = PRESAS.filter(([k, n]) => A.enemigos.filter((e) => e.tipo === k && !e.muerto && !e.semi).length >= n);
    if (!vivas.length) return null;
    const [tipo, n] = vivas[(st.hechos * 5 + 2) % vivas.length];
    return { tipo, n, hechas: 0 };
  }
  function pintar() {
    if (!tablon) return;
    tablon.o.pedido = !!st.pedido;
    tablon.o.cobrar = listo();
  }
  function cobrar() {
    const p = st.pedido,
      plata = pagaDe(p),
      frag = fragDe(p);
    if (window.RPG && p.xp) RPG.dar(Math.round(RPG.xpPara(yo()) * p.xp), jug.x, jug.y - 90);
    st.hechos++;
    st.pedido = null;
    jug.interactuando = 0.5;
    PODERES.darPlata(plata);
    HUD.aviso(t("mj.caza_cobrada", [plata]), "#FFD98A");
    if (frag) J.retrasar(0.6, () => PODERES.darFragmento());
    pintar();
  }
  function mirar() {
    if (st.pedido) {
      A.menu(`<h2>${t("mj.caza_titulo")}</h2><div class="sub">${nombre(st.pedido)} · ${rango(st.pedido)} · ${st.pedido.hechas}/${st.pedido.n}</div>`, [
        { texto: t("mj.caza_seguir"), fn: A.cerrarMenu },
        { texto: t("mj.caza_dejar"), fn: () => {
          st.pedido = null;
          pintar();
          A.cerrarMenu();
        } },
      ]);
      return;
    }
    const l = ofertas();
    if (!l.length) return A.avisar("mj.caza_nada");
    const bot = l.map((p) => ({
      texto: (p.banda ? t("mj.caza_b_" + p.banda) + " · " : "") + nombre(p),
      sub: [rango(p), t("mj.caza_paga", [pagaDe(p)]), fragDe(p) ? t("mj.caza_fragmento") : ""].filter(Boolean).join(" · "),
      fn: () => {
        st.pedido = p;
        pintar();
        A.cerrarMenu();
        HUD.aviso(nombre(p), "lugar", t("mj.caza_tomada"));
      },
    }));
    bot.push({ texto: t("ui.cerrar"), fn: A.cerrarMenu });
    A.menu(`<h2>${t("mj.caza_titulo")}</h2><div class="sub">${t("mj.caza_sub")} ${t("mj.caza_sub_rango")}</div>`, bot);
  }

  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      tablon = W.NOMBRADAS.tablon_caza || null;
    },
    alEmpezar(extra) {
      extra.tablon = Object.assign({ pedido: null, hechos: 0 }, extra.tablon || {});
      st = extra.tablon;
      pintar();
    },
    cercanos(dar) {
      if (!tablon) return;
      const d = Math.hypot(tablon.x - jug.x, tablon.y + 30 - jug.y);
      if (d < 110) dar(d, t(listo() ? "mj.accion_cobrar" : st.pedido ? "mj.accion_ver_caza" : "mj.accion_caza"), () => (listo() ? cobrar() : mirar()), tablon.x, tablon.y - 160);
    },
    alMorir(e) {
      if (!st.pedido || listo() || e.tipo !== st.pedido.tipo) return;
      // de otro rango no cuenta: hay que ir a la zona del pedido
      if (st.pedido.min != null) {
        const nv = nivelDe(e);
        if (nv < st.pedido.min || nv > st.pedido.max) return;
      }
      st.pedido.hechas++;
      if (listo()) {
        HUD.aviso(t("mj.caza_lista"), "#7BC86C");
        pintar();
      }
    },
    seguimiento() {
      if (!st.pedido) return null;
      const p = st.pedido,
        objetivos = [{ texto: nombre(p) + (p.min != null ? " · " + rango(p) : "") + ` (${Math.min(p.hechas, p.n)}/${p.n})`, estado: listo() ? "hecho" : "actual", metros: !listo() && p.x != null ? Math.max(1, Math.hypot(p.x - jug.x, p.y - jug.y) / 43) : undefined }];
      if (listo()) objetivos.push({ texto: t("mj.caza_volver"), estado: "actual", metros: tablon ? Math.max(1, Math.hypot(tablon.x - jug.x, tablon.y - jug.y) / 43) : null });
      return { secundaria: true, rotulo: t("mj.caza_rotulo"), nombre: t("mj.caza_titulo"), objetivos };
    },
    // la zona del pedido en la brújula y en el mapa
    marcasBrujula() {
      const p = st.pedido;
      if (!p || p.x == null || listo()) return [];
      return [{ x: p.x, y: p.y, col: "#FFD98A" }];
    },
    marcasMapa() {
      const p = st.pedido;
      if (!p || p.x == null || listo()) return [];
      return [{ tipo: "contrato", x: p.x, y: p.y, op: { nombre: nombre(p) } }];
    },
    diario() {
      return st.hechos ? `<div class="diario-resumen"><p><b>${t("mj.caza_titulo")}</b> ${t("mj.caza_diario", [st.hechos])}</p></div>` : "";
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, ofertas, pagaDe, BANDAS };
})();
