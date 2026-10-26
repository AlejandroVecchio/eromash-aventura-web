// ---------- los tintes del casco (sistema TINTES) ----------
// Como los tintes de WoW, Fable y The Witcher: en la tina de tintes del Puesto (asset `tinaTintes`) se tiñe el casco
// de Eromash. Ocho colores: el rojo de siempre, cuatro que se preparan con plata y hierbas o materiales (azul de
// escarcha, verde de la linde, blanco de abedul, negro de cuervo y violeta de las ataduras) y dos que se ganan (luz
// de runa: una palabra rúnica o un poder legendario; oro de Fáfnir: un conjunto entero). Lo ya preparado se cambia
// gratis. El color sale en el mundo, en el retrato y en la mochila (VIKINGO.color, que tonos() lee de acá).
// Estado en E.extra.tintes = { tiene: { id: 1 }, puesto }. Textos `ti.`.
window.TINTES = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  // c: la clave de VIKINGO (R, B, V, W, G de la arena, o T_<id> con sus tonos acá); agua: el color en la tina
  const LISTA = {
    rojo: { c: "R", agua: "#9C2315" },
    azul: { c: "B", agua: "#4A78D0", pide: { plata: 60, escarcha: 3 } },
    verde: { c: "V", agua: "#4E7A3A", pide: { plata: 60, musgo: 3 } },
    blanco: { c: "W", agua: "#E0B2B2", pide: { plata: 60, abedul: 3 } },
    negro: { c: "T_negro", agua: "#2A2828", pide: { plata: 120, cardo: 3 }, tonos: { domo: "#2A2828", linea: "#161414", cara: "#0A0707", e1: "#5A5450", e2: "#3A3634" } },
    violeta: { c: "T_violeta", agua: "#9A6BD8", pide: { plata: 150, luna: 3, esquirla: 1 }, tonos: { domo: "#3E2766", linea: "#2A1A48", cara: "#0A0707", e1: "#9A6BD8", e2: "#6E4AA8" } },
    runa: { c: "T_runa", agua: "#73D5DB", gana: "runa", tonos: { domo: "#1E4A4E", linea: "#123236", cara: "#0A0707", e1: "#73D5DB", e2: "#3A9AA0" } },
    oro: { c: "G", agua: "#F5A524", gana: "oro" },
  };
  const IDS = Object.keys(LISTA);
  const base = () => ({ tiene: { rojo: 1 }, puesto: "rojo" });
  let st = base();
  let tina = null,
    abierta = false;

  const tonos = (c) => {
    const id = typeof c === "string" && c.indexOf("T_") === 0 ? c.slice(2) : null;
    return id && LISTA[id] && LISTA[id].tonos ? LISTA[id].tonos : null;
  };
  // ¿se ganó? (lo miran los otros sistemas: palabras, poderes, conjuntos)
  function ganado(id) {
    const g = LISTA[id].gana;
    if (g === "runa") return !!((window.ENGARCES && Object.keys(ENGARCES.estado().hechas).length) || (window.LEGENDARIOS && Object.keys(LEGENDARIOS.estado().aprendidos).length));
    if (g === "oro") return !!(window.CONJUNTOS && Object.keys(CONJUNTOS.estado().completos).length);
    return false;
  }
  // lo que pide: plata, hierbas de ALQUIMIA o materiales de MATERIALES
  const cuanto = (k) => (k === "plata" ? PODERES.pj().plata : window.ALQUIMIA && ALQUIMIA.HIERBAS[k] ? ALQUIMIA.estado().hierbas[k] || 0 : window.MATERIALES ? MATERIALES.cuantos(k) : 0);
  const alcanza = (pide) => Object.keys(pide).every((k) => cuanto(k) >= pide[k]);
  function gastar(pide) {
    Object.keys(pide).forEach((k) => {
      if (k === "plata") PODERES.pj().plata -= pide[k];
      else if (window.ALQUIMIA && ALQUIMIA.HIERBAS[k]) ALQUIMIA.estado().hierbas[k] -= pide[k];
      else MATERIALES.gastar({ [k]: pide[k] });
    });
  }
  const pideTexto = (pide) =>
    Object.keys(pide)
      .map((k) => (k === "plata" ? t("ti.plata", [pide[k]]) : window.ALQUIMIA && ALQUIMIA.HIERBAS[k] ? pide[k] + " " + t("aq.h_" + k) : MATERIALES.texto({ [k]: pide[k] })) + (cuanto(k) < pide[k] ? " ✗" : ""))
      .join(" · ");

  function poner(id) {
    st.puesto = id;
    VIKINGO.color = LISTA[id].c;
    if (tina) tina.o.color = LISTA[id].agua;
  }
  function tenir(id) {
    const L = LISTA[id];
    if (!L) return false;
    if (!st.tiene[id]) {
      if (L.gana) {
        if (!ganado(id)) return HUD.aviso(t("ti.falta"), "#C8402D"), false;
      } else {
        if (!alcanza(L.pide)) return HUD.aviso(t("ti.falta"), "#C8402D"), false;
        gastar(L.pide);
      }
      st.tiene[id] = 1;
    }
    poner(id);
    HUD.aviso(t("ti.tenido", [t("ti.c_" + id)]), L.agua === "#2A2828" ? "#E0B2B2" : L.agua);
    if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.5, tono: 0.9 });
    if (window.ANIMA) ANIMA.gesto("sacudirse", 0, { col: L.agua === "#2A2828" ? "#E0B2B2" : L.agua });
    return true;
  }

  // ---------- la pestaña ----------
  function pintar(cuerpo, api) {
    cuerpo.insertAdjacentHTML("beforeend", `<p class="aq-cabeza">${t("ti.cabeza")}</p>`);
    const g = document.createElement("div");
    g.className = "inv-rejilla";
    IDS.forEach((id, k) => {
      const L = LISTA[id],
        tiene = !!st.tiene[id],
        puede = tiene || (L.gana ? ganado(id) : alcanza(L.pide));
      const como = tiene ? (st.puesto === id ? t("ti.puesto") : t("ti.cambiar")) : L.gana ? t("ti.gana", [t("ti.g_" + L.gana)]) : t("ti.pide", [pideTexto(L.pide)]);
      g.appendChild(api.celda({ icono: "ti_" + id, nombre: t("ti.c_" + id), col: L.agua === "#2A2828" ? "#E0B2B2" : L.agua, desc: como, falta: !puede, elegida: st.puesto === id, fn: () => tenir(id) }, 0, k));
    });
    cuerpo.appendChild(g);
  }
  function iconos() {
    // las cabezas de muestra se cargan de entrada (y la pestaña se repinta cuando llegan)
    IDS.forEach((id) => {
      const im = VIKINGO.imagen(LISTA[id].c, "S", "calm");
      if (!im.complete) im.addEventListener("load", () => INVENTARIO.repintar());
    });
    IDS.forEach((id) =>
      INVENTARIO.iconoDe("ti_" + id, (c) => {
        // la cabeza de Eromash con ese color (si la imagen todavía no cargó, se ve el frasco)
        const img = VIKINGO.imagen(LISTA[id].c, "S", "calm");
        if (img.complete && img.naturalWidth) c.drawImage(img, -30, -34, 60, 72);
        else {
          DIB.P(c, [-10, 24, -12, -4, 12, -4, 10, 24], LISTA[id].agua);
          DIB.P(c, [-5, -4, 5, -4, 5, -14, -5, -14], "#C8B48C");
        }
      }),
    );
  }
  function ubicar() {
    // junto al arcón, si está; si no, en el patio del Puesto
    const ar = window.ARCON && ARCON.arcon();
    const pp = ar ? [ar.x, ar.y] : W.PUNTOS.puesto || W.LUGARES.puesto.p;
    let pm = null;
    for (let k = 0; k < 120 && !pm; k++) {
      const a = 0.3 + k * 0.67,
        d = 200 + k * 6,
        x = pp[0] + Math.cos(a) * d,
        y = pp[1] + Math.sin(a) * d * 0.7;
      const solo = !W.COSAS.some((o) => !o.oculto && Math.abs(o.x - x) < 170 && o.y - y > -60 && o.y - y < 200);
      if (solo && W.libre(x, y, 70) && W.libre(x - 80, y, 30) && W.libre(x + 80, y, 30) && !W.CAMINOS.some((c) => W.distLinea(x, y, c.p) < c.w / 2 + 50)) pm = [x, y];
    }
    tina = W.agregar("tinaTintes", pm || [pp[0] + 240, pp[1]], { sem: 3, color: LISTA[st.puesto].agua });
  }

  function abrir() {
    abierta = true;
    INVENTARIO.abrir("tintes");
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      iconos();
      INVENTARIO.pestana({ id: "tintes", antes: "equipo", nombre: () => t("ti.tab"), visible: () => abierta, pintar });
    },
    alEmpezar(extra) {
      extra.tintes = Object.assign(base(), extra.tintes || {});
      st = extra.tintes;
      abierta = false;
      if (!tina) ubicar();
      poner(LISTA[st.puesto] ? st.puesto : "rojo");
    },
    actualizar(dt) {
      if (abierta && !INVENTARIO.abierta()) abierta = false;
      // avisar una vez cuando se gana un color
      if (J.t % 1 < dt)
        IDS.forEach((id) => {
          if (LISTA[id].gana && !st.tiene[id] && !st["aviso_" + id] && ganado(id)) {
            st["aviso_" + id] = 1;
            HUD.aviso(t("ti.ganado", [t("ti.c_" + id)]), "lugar", t("ti.ganado_titulo"));
          }
        });
    },
    cercanos(dar) {
      if (J.dentro || !tina) return;
      const d = Math.hypot(tina.x - jug.x, tina.y - jug.y);
      if (d < 130)
        dar(d, t("ti.usar"), abrir, tina.x, tina.y - 110);
    },
    diario() {
      const n = Object.keys(st.tiene).filter((k) => LISTA[k]).length;
      return n > 1 ? `<div class="diario-resumen"><p><b>${t("ti.tab")}</b> ${t("ti.diario", [n, IDS.length])}</p></div>` : "";
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, tonos, tenir, abrir, poner, ganado, tina: () => tina, LISTA };
})();
