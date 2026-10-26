// ---------- el Mercado de los Toldos en el juego (módulo MERCADO25) ----------
// Cada puesto de la plaza vende lo suyo (PUESTOS25: vende). Delante del mostrador se puede mirar el puesto y, en los que
// tienen algo útil para el camino, comprar: carne y pescado para la fogata, hierbas para Thora y para el matraz, cuero,
// hierro y brasa para la forja de Ása. Cada cosa tiene unas pocas por día y puesto (vuelven a las 6 de la mañana); lo
// comprado se anota en E.extra.eikholt.mercado. Los puestos de cerámica, sogas y tallas de hueso solo se miran.
// MERCADO25.abrir(puesto, A, st) con puesto = { n, vende } (plano.puestos).
window.MERCADO25 = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const POR_DIA = 3;
  // lo que da cada cosa: carne o pescado (COCINA), hierba del matraz (ALQUIMIA), hierbas de Thora o un material
  const dar = {
    carne: (id) => () => {
      const c = window.COCINA && COCINA.estado();
      if (c) c.carne[id] = (c.carne[id] || 0) + 1;
    },
    hierba: (id) => () => {
      const a = window.ALQUIMIA && ALQUIMIA.estado();
      if (a) a.hierbas[id] = (a.hierbas[id] || 0) + 1;
    },
    thora: () => () => PODERES.darHierbas(1),
    mat: (id) => () => window.MATERIALES && MATERIALES.dar(id, 1),
  };
  // vende → [{ id, precio, dar, k }] (k: el nombre de la cosa, el mismo que en la mochila)
  const H = (id, precio) => ({ id, precio, dar: dar.hierba(id), k: "aq.h_" + id }),
    C = (id, precio) => ({ id, precio, dar: dar.carne(id), k: "co.c_" + id }),
    MT = (id, precio) => ({ id, precio, dar: dar.mat(id), k: "mt." + id });
  const OFERTAS = {
    hongos: [H("musgo", 4), H("luna", 7)],
    pescado: [C("pescado", 5)],
    pieles: [MT("cuero", 8)],
    hierbas: [{ id: "hierbas", precio: 6, dar: dar.thora(), k: "ek.mc_p_hierbas" }, H("serbal", 4), H("abedul", 4)],
    obsidiana: [MT("brasa", 16)],
    lingotes: [MT("hierro", 6)],
    sal: [C("jabali", 6), H("escarcha", 6)],
  };
  const dia = (A) => Math.floor(((A.H.E.tiempo / LUZ.DIA) * 24 + 9 - 6) / 24); // cambia a las 6 de la mañana
  function quedan(st, A, p, o) {
    const m = (st.mercado = st.mercado && st.mercado.dia === dia(A) ? st.mercado : { dia: dia(A), c: {} });
    return POR_DIA - (m.c[p.n + "_" + o.id] || 0);
  }
  function abrir(p, A, st) {
    const of = OFERTAS[p.vende];
    if (!of) return A.dialogoLibre([["eromash", "ek.mc_mira_" + p.vende]]);
    const pj = PODERES.pj();
    const cab = `<h2>${t("ek.mc_puesto_" + p.vende)}</h2><div class="sub">${t("ek.mc_sub", [pj.plata])}</div><p>${t("ek.mc_mira_" + p.vende)}</p>`;
    const botones = of.map((o) => {
      const q = quedan(st, A, p, o);
      return {
        texto: q > 0 ? t("ek.mc_comprar", [t(o.k), o.precio, q]) : t("ek.mc_agotado", [t(o.k)]),
        fn: () => {
          if (q <= 0) return;
          if (pj.plata < o.precio) return HUD.aviso(t("ek.mc_sin_plata"), "#C8402D");
          pj.plata -= o.precio;
          st.mercado.c[p.n + "_" + o.id] = POR_DIA - q + 1;
          o.dar();
          if (window.SONIDO) SONIDO.tocar("plata", { vol: 0.35, tono: 0.9 });
          HUD.aviso(t("ek.mc_compraste", [t(o.k)]), "#FFD98A");
          if (window.INVENTARIO) INVENTARIO.repintar();
          abrir(p, A, st);
        },
      };
    });
    botones.push({ texto: t("ui.cerrar"), fn: A.cerrarMenu });
    A.menu(cab, botones);
  }
  return { abrir, OFERTAS, vende: (v) => !!OFERTAS[v] };
})();
