// ---------- la hoja de Eromash (sistema HOJA, pestaña Hoja de la mochila) ----------
// Como la hoja de personaje del WoW o del Diablo: cada estadística final con su rombo y su runa, y al elegirla de
// dónde sale (cada sistema que suma, por nombre: RPG.aporte(fn, quien)), el tope de lo que suman los sistemas y cuánto
// se comió (motor/rpg.js, TOPES). Abajo, la hoja entera en una tabla para leerla de un vistazo. Textos `hj.`.
window.HOJA = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  // cada estadística: su runa y su color (los del juego)
  const RUNA = { vida: ["uruz", "#C8402D"], estamina: ["ehwaz", "#FFD98A"], dano: ["tiwaz", "#FF8D71"], crit: ["sowilo", "#FFD98A"], critMult: ["thurisaz", "#F5A524"], velAtq: ["raidho", "#E0B2B2"], velMov: ["raidho", "#73D5DB"], armadura: ["algiz", "#8E8A86"], runico: ["ansuz", "#9A6BD8"], regen: ["berkano", "#7BC86C"], regenRunica: ["laguz", "#73D5DB"], xp: ["mannaz", "#73D5DB"], plata: ["fehu", "#FFD98A"], botin: ["othala", "#F5A524"], lampara: ["kenaz", "#FF8D71"] };
  const loc = () => (I18N.lang === "en" ? "en" : "es");
  const num = (v, d = 2) => Number(v).toLocaleString(loc(), { maximumFractionDigits: d, minimumFractionDigits: 0 });
  const pct = (v) => num(v * 100, 1) + " %";
  const signo = (v) => (v >= 0 ? "+" : "−");
  const PCT_FINAL = { xp: 1, plata: 1, botin: 1 }; // se muestran como «+N %» sobre lo normal
  // el valor final, como lo lee el que juega
  function valor(k, v) {
    if (k === "crit") return pct(v);
    if (k === "vida" || k === "estamina" || k === "armadura") return String(Math.round(v));
    if (PCT_FINAL[k]) return signo(v - 1) + num(Math.abs(v - 1) * 100, 1) + " %";
    return "×" + num(v);
  }
  // lo que pone una parte: sumas en puntos, el resto en porcentaje
  function parte(k, p) {
    if (k === "crit") return signo(p.dif) + num(Math.abs(p.dif) * 100, 1) + " %";
    if (RPG.SUMAN[k]) return signo(p.dif) + num(Math.abs(p.dif), k === "lampara" ? 2 : 0);
    return signo(p.k - 1) + num(Math.abs(p.k - 1) * 100, 1) + " %";
  }
  function recorte(k, D) {
    if (k === "crit" || RPG.SUMAN[k]) return parte(k, { dif: D.recorte });
    return num((Math.abs(D.recorte) / (D.final - D.recorte)) * 100, 1) + " %";
  }
  function topeTxt(k) {
    const T = RPG.TOPES[k];
    if (!T) return "";
    return T.x ? "×" + num(T.x) : (k === "crit" ? "+" + pct(T.mas) : "+" + num(T.mas, 0));
  }
  // el detalle de una estadística (HTML)
  function detalle(k) {
    const D = RPG.desglose()[k];
    if (!D) return "";
    const filas = D.partes.filter((p) => Math.abs(p.dif) > 1e-6).map((p) => `<span class="hj-parte${RPG.NUCLEO[p.quien] ? " nucleo" : ""}"><i>${t("hj.de_" + p.quien)}</i><b>${parte(k, p)}</b></span>`);
    let h = `<span class="hj-base">${t("hj.base_de", [valor(k, D.base)])}</span>`;
    h += filas.length ? `<span class="hj-titulo">${t("hj.de_donde")}</span>${filas.join("")}` : `<span class="hj-nada">${t("hj.sin_aportes")}</span>`;
    if (RPG.TOPES[k]) h += `<span class="hj-tope">${t("hj.tope", [topeTxt(k)])}</span>`;
    if (Math.abs(D.recorte) > 1e-6) h += `<span class="hj-recorte">${t("hj.recorte", [recorte(k, D)])}</span>`;
    if (k === "crit") h += `<span class="hj-tope">${t("hj.crit_max", [pct(RPG.CRIT_MAX)])}</span>`;
    if (k === "armadura") h += `<span class="hj-tope">${t("hj.armadura_d", [pct(D.final / (100 + D.final))])}</span>`;
    return h;
  }
  function pintar(cuerpo, api) {
    RPG.recalcular();
    const D = RPG.desglose();
    cuerpo.insertAdjacentHTML("beforeend", `<p class="aq-cabeza">${t("hj.cabeza")}</p>`);
    const g = document.createElement("div");
    g.className = "inv-rejilla";
    RPG.CLAVES.forEach((k, i) => {
      const d = D[k],
        topado = Math.abs(d.recorte) > 1e-6;
      g.appendChild(api.celda({ icono: "hj_" + k, nombre: t("hj.k_" + k), col: RUNA[k][1], cant: valor(k, d.final) + (topado ? " ·" : ""), html: detalle(k) }, Math.floor(i / 5), i % 5, topado ? "hj-topada" : ""));
    });
    cuerpo.appendChild(g);
    // la hoja entera, para leerla de un vistazo
    const filas = RPG.CLAVES.map((k) => {
      const d = D[k],
        partes = d.partes.filter((p) => Math.abs(p.dif) > 1e-6).map((p) => `${t("hj.de_" + p.quien)} ${parte(k, p)}`);
      if (Math.abs(d.recorte) > 1e-6) partes.push(`<em>${t("hj.topado")} −${recorte(k, d).replace(/^[+−]/, "")}</em>`);
      return `<tr><th style="color:${RUNA[k][1]}">${t("hj.k_" + k)}</th><td class="hj-v">${valor(k, d.final)}</td><td>${partes.join(" · ")}</td></tr>`;
    }).join("");
    cuerpo.insertAdjacentHTML("beforeend", `<div class="rotulo inv-piezas hj-rotulo">${t("hj.tabla")}</div><table class="hj-tabla">${filas}</table>`);
    // contra criaturas de otro nivel: cuánto se falla, cuánto entra y cuánto te esquivan (motor/fallos.js)
    if (window.FALLOS) {
      const F = FALLOS,
        p = F.precisionActual(),
        fila = (d) => {
          const nom = d >= 10 ? t("fl.hoja_pregunta") : d === 0 ? t("fl.hoja_igual") : t("fl.hoja_dif", [(d > 0 ? "+" : "−") + Math.abs(d)]);
          return `<tr><th>${nom}</th><td class="hj-v">${pct(Math.max(0, F.fallo(d) - p))}</td><td>${pct(F.mult(d))}</td><td>${pct(F.esquiva(d))}</td></tr>`;
        };
      cuerpo.insertAdjacentHTML("beforeend", `<div class="rotulo inv-piezas hj-rotulo">${t("fl.hoja_titulo")}</div><table class="fl-tabla"><tr><th></th><td class="hj-v">${t("fl.col_fallas")}</td><td>${t("fl.col_entra")}</td><td>${t("fl.col_esquiva")}</td></tr>${[-6, -3, 0, 3, 5, 7, 10].map(fila).join("")}</table><p class="aq-cabeza">${t("fl.hoja_nota")}</p>`);
    }
  }
  // el ícono: el rombo con la runa de la estadística
  function icono(k) {
    return (c) => {
      const [r, col] = RUNA[k];
      DIB.P(c, [0, -30, 30, 0, 0, 30, -30, 0], "#1A1614");
      DIB.P(c, [0, -30, 0, 30, -30, 0], "#111111");
      FUTHARK.dibujar(c, r, 0, 18, 34, col, 5);
    };
  }
  const sistema = {
    iniciar() {
      if (!window.INVENTARIO || !INVENTARIO.pestana) return;
      RPG.CLAVES.forEach((k) => INVENTARIO.iconoDe("hj_" + k, icono(k)));
      INVENTARIO.pestana({ id: "hoja", antes: "bolsa", nombre: () => t("hj.tab"), pintar });
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, valor, detalle, RUNA };
})();
