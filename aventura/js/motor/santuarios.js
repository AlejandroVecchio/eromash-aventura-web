// ---------- los hörgar de los dioses y sus bendiciones (sistema SANTUARIOS) ----------
// Como los santuarios del Diablo y las piedras guardianas del Skyrim: siete hörgar (altares de piedras apiladas,
// asset `horgr`) al costado de los caminos de Eldervald, uno por dios. Con E se pide la bendición del dios: dura unos
// minutos y se lleva una sola por vez (pedir otra la reemplaza). Ofrendando plata la bendición sale más fuerte. Cada
// hörgr bendice una vez por día. El primero que se encuentra de cada dios da experiencia; encontrar los siete da el
// favor de los Æsir: las bendiciones duran más y Eromash queda con un poco más de daño y vida para siempre.
//   Thor más daño · Odín más experiencia y poder rúnico · Tyr más críticos · Freyja más vida y se cura más rápido
//   Frigg más armadura · Njörd más velocidad · Ullr más estamina y ataques más rápidos
// Estado en E.extra.santuarios = { vistos: { dios: 1 }, dia: { dios: n }, bend: { dios, t, fuerte } | null }. Textos `sn.`.
window.SANTUARIOS = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const DURA = 480, // segundos de la bendición
    DURA_AESIR = 720,
    OFRENDA = 25, // plata por ofrendar
    FUERTE = 1.5, // la ofrenda multiplica lo que suma
    XP_HALLAZGO = 40;
  // dónde está cada uno (en px del mapa de Eldervald, junto a un camino) y lo que suma su bendición (k = 1 o FUERTE)
  const LISTA = {
    thor: { p: [600, 668], s: (s, k) => (s.dano *= 1 + 0.15 * k) },
    odin: { p: [552, 262], s: (s, k) => ((s.xp *= 1 + 0.2 * k), (s.runico *= 1 + 0.1 * k)) },
    tyr: { p: [1080, 618], s: (s, k) => (s.crit += 0.08 * k) },
    freyja: { p: [290, 492], s: (s, k) => ((s.vida *= 1 + 0.1 * k), (s.regen *= 1 + 0.5 * k)) },
    frigg: { p: [430, 520], s: (s, k) => (s.armadura += 15 * k) },
    njord: { p: [1285, 318], s: (s, k) => (s.velMov *= 1 + 0.1 * k) },
    ullr: { p: [345, 236], s: (s, k) => ((s.estamina += 25 * k), (s.velAtq *= 1 + 0.08 * k)) },
  };
  const IDS = Object.keys(LISTA);
  const base = () => ({ vistos: {}, dia: {}, bend: null });
  let st = base();
  const horgar = {}; // dios → la cosa del mundo
  let mirar = 0;

  const dia = () => Math.floor(A.H.E.tiempo / LUZ.DIA);
  const aesir = () => IDS.every((id) => st.vistos[id]);
  const yaHoy = (id) => st.dia[id] === dia();

  // ---------- pedir ----------
  function bendecir(id, ofrendar) {
    if (yaHoy(id)) return HUD.aviso(t("sn.ya_hoy", [t("sn.d_" + id)]), "#E0B2B2"), false;
    if (ofrendar) {
      const pj = PODERES.pj();
      if (pj.plata < OFRENDA) return HUD.aviso(t("sn.sin_plata", [OFRENDA]), "#C8402D"), false;
      pj.plata -= OFRENDA;
    }
    st.dia[id] = dia();
    st.bend = { dios: id, t: aesir() ? DURA_AESIR : DURA, fuerte: !!ofrendar };
    RPG.recalcular();
    if (id === "freyja") jug.hp = jug.hpMax;
    const h = horgar[id];
    HUD.aviso(t("sn.b_" + id), "lugar", t(ofrendar ? "sn.bendicion_fuerte" : "sn.bendicion", [t("sn.d_" + id)]));
    if (h) {
      A.columnaRunica && A.columnaRunica(h.x, h.y);
      if (window.VIDA) VIDA.evento("sanar", h.x, h.y - 60); // (no "rito": ese da experiencia)
    }
    if (window.SONIDO) SONIDO.tocar("runa", { vol: 0.6, tono: 0.9 });
    if (window.ANIMA) ANIMA.gesto("reverencia");
    return true;
  }
  function hallar(id) {
    if (st.vistos[id]) return false;
    st.vistos[id] = 1;
    if (window.RPG && horgar[id]) RPG.dar(XP_HALLAZGO, horgar[id].x, horgar[id].y);
    const n = IDS.filter((k) => st.vistos[k]).length;
    if (n === IDS.length) {
      HUD.aviso(t("sn.aesir"), "lugar", t("sn.aesir_titulo"));
      RPG.recalcular();
    } else HUD.aviso(t("sn.hallado", [t("sn.d_" + id), n, IDS.length]), ASSETS.DIOSES[id].col);
    return true;
  }
  function menu(id) {
    hallar(id);
    const b = st.bend,
      hoy = yaHoy(id);
    const sub = hoy ? t("sn.ya_hoy", [t("sn.d_" + id)]) : t("sn.efecto_" + id);
    A.menu(`<h2>${t("sn.titulo_" + id)}</h2><div class="sub">${t("sn.sub_" + id)}</div>`, [
      { texto: t("sn.pedir"), sub: sub + (b && b.dios !== id ? " · " + t("sn.reemplaza", [t("sn.d_" + b.dios)]) : ""), fn: () => (bendecir(id, false), A.cerrarMenu()) },
      { texto: t("sn.ofrendar", [OFRENDA]), sub: hoy ? sub : t("sn.ofrendar_d"), fn: () => (bendecir(id, true), A.cerrarMenu()) },
      { texto: t("ui.cerrar"), fn: A.cerrarMenu },
    ]);
  }

  // ---------- ubicar ----------
  function ubicar() {
    const U = W.U;
    IDS.forEach((id, i) => {
      const p0 = [LISTA[id].p[0] * U, LISTA[id].p[1] * U];
      let pm = null;
      for (let k = 0; k < 200 && !pm; k++) {
        const a = i * 1.3 + k * 0.71,
          d = k * 10,
          x = p0[0] + Math.cos(a) * d,
          y = p0[1] + Math.sin(a) * d * 0.8;
        const solo = !W.COSAS.some((o) => !o.oculto && !o.arbol && o.id !== "roca" && Math.hypot(o.x - x, o.y - y) < 200);
        if (solo && W.libreDeTodo(x, y, 60) && W.sueloEn(x, y) === 0 && !W.CAMINOS.some((c) => W.distLinea(x, y, c.p) < c.w / 2 + 50)) pm = [x, y];
      }
      pm = pm || p0;
      // un claro chico alrededor (como los lugares místicos): los árboles y rocas se corren, así se ve desde el camino
      // (más hacia el frente: lo que queda delante lo taparía)
      W.cercanas(pm[0] - 280, pm[1] - 220, pm[0] + 280, pm[1] + 380, (o) => {
        if (!o.arbol && o.id !== "roca" && o.id !== "troncoCaido") return;
        const dy = o.y - pm[1];
        if (Math.hypot(o.x - pm[0], dy > 0 ? dy * 0.7 : dy * 1.2) > 260) return;
        o.oculto = true;
        o.choque = null;
      });
      horgar[id] = W.agregar("horgr", pm, { sem: 7 + i, dios: id });
    });
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      if (window.RPG)
        RPG.aporte((s) => {
          if (st.bend && LISTA[st.bend.dios]) LISTA[st.bend.dios].s(s, st.bend.fuerte ? FUERTE : 1);
          if (aesir()) (s.dano *= 1.03), (s.vida *= 1.03);
        }, "santuarios");
    },
    alEmpezar(extra) {
      extra.santuarios = Object.assign(base(), extra.santuarios || {});
      st = extra.santuarios;
      if (!horgar.thor) ubicar();
      if (window.RPG) RPG.recalcular();
    },
    actualizar(dt) {
      if (st.bend && J.modo === "juego" && (st.bend.t -= dt) <= 0) {
        HUD.aviso(t("sn.se_fue", [t("sn.d_" + st.bend.dios)]), "#E0B2B2");
        st.bend = null;
        RPG.recalcular();
      }
      // la cara de cada hörgr: viva si su bendición está puesta, dormida si ya bendijo hoy
      if ((mirar -= dt) > 0) return;
      mirar = 0.5;
      IDS.forEach((id) => {
        const h = horgar[id];
        if (!h) return;
        h.o.vivo = !!(st.bend && st.bend.dios === id);
        h.o.dormido = !h.o.vivo && yaHoy(id);
      });
    },
    cercanos(dar) {
      if (J.dentro) return;
      for (const id of IDS) {
        const h = horgar[id];
        if (!h) continue;
        const d = Math.hypot(h.x - jug.x, h.y - jug.y);
        if (d < 140) dar(d, t("sn.usar", [t("sn.d_" + id)]), () => menu(id), h.x, h.y - 130);
      }
    },
    luces(dar) {
      IDS.forEach((id) => {
        const h = horgar[id];
        if (h && h.o.vivo) dar({ x: h.x, y: h.y - 60, r: 200, col: "#FFD98A", f: 0.5 });
      });
    },
    efectosHud() {
      const b = st.bend;
      return b ? [{ texto: t("sn.d_" + b.dios) + (b.fuerte ? " ✦" : ""), n: Math.ceil(b.t / 60) + " min", col: ASSETS.DIOSES[b.dios].col }] : [];
    },
    marcasMapa() {
      return IDS.map((id) => ({ tipo: "horgr", x: horgar[id].x, y: horgar[id].y, op: { nombre: t("sn.titulo_" + id), col: ASSETS.DIOSES[id].col, apagado: yaHoy(id) } }));
    },
    diario() {
      const n = IDS.filter((id) => st.vistos[id]).length;
      if (!n) return "";
      const b = st.bend;
      return `<div class="diario-resumen"><p><b>${t("sn.tab")}</b> ${t("sn.diario", [n, IDS.length])}${aesir() ? " · " + t("sn.aesir_titulo") : ""}${b ? " · " + t("sn.d_" + b.dios) + " " + Math.ceil(b.t / 60) + " min" : ""}</p></div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, bendecir, hallar, menu, horgar: () => horgar, aesir, LISTA, DURA, DURA_AESIR, OFRENDA, FUERTE };
})();
