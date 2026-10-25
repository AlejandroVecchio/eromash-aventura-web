// ---------- los saltos de poder (sistema SALTOS) ----------
// Cada nivel da un poco (vida, daño, atributos y un punto del árbol); los niveles 5, 10, 15, 20, 25 y 30 dan un salto
// que se nota, cada uno con su runa y su nombre: un multiplicador grande en el núcleo (no se topa, como el nivel) y
// puntos de atributo o de habilidad de más. El cartel de nivel lo anuncia como «Salto de poder», el diario dice cuál es
// el próximo y la hoja de Eromash lo muestra como «Saltos de poder». Lo ya dado queda en E.extra.rpg.saltos (las
// partidas viejas lo reciben al cargar). Textos `sl.`.
window.SALTOS = (function () {
  "use strict";
  let A, J, jug;
  const t = (k, v) => I18N.t(k, v);
  const LISTA = [
    { n: 5, id: "uruz", runa: "uruz", s: (s) => (s.vida *= 1.1), atrib: 2 },
    { n: 10, id: "lobo", runa: "ehwaz", s: (s) => ((s.dano *= 1.1), (s.critMult += 0.15)), arbol: 1 },
    { n: 15, id: "cuervo", runa: "sowilo", s: (s) => ((s.crit += 0.04), (s.velAtq *= 1.06)), atrib: 2 },
    { n: 20, id: "oso", runa: "algiz", s: (s) => ((s.armadura += 25), (s.vida *= 1.1)), arbol: 1 },
    { n: 25, id: "ansuz", runa: "ansuz", s: (s) => ((s.runico *= 1.15), (s.regenRunica *= 1.15)), atrib: 2 },
    { n: 30, id: "einherjar", runa: "tiwaz", s: (s) => ((s.dano *= 1.1), (s.vida *= 1.1), (s.velMov *= 1.05)), atrib: 3, arbol: 1 },
  ];
  const nivel = () => (window.RPG ? RPG.nivel() : 1);
  const de = (n) => LISTA.find((h) => h.n === n);
  const proximo = () => LISTA.find((h) => h.n > nivel()) || null;
  const nombre = (h) => t("sl." + h.id);
  // lo que da en palabras: las líneas del cartel
  function lineas(h) {
    const l = [t("sl." + h.id + "_d")];
    if (h.atrib) l.push(t("sl.atrib", [h.atrib]));
    if (h.arbol) l.push(t("sl.arbol", [h.arbol]));
    return l;
  }
  // los puntos de cada salto se dan una sola vez (estado en extra.rpg.saltos)
  function dar(h) {
    const st = RPG.estado();
    if (!st) return;
    st.saltos = st.saltos || [];
    if (st.saltos.includes(h.n)) return;
    st.saltos.push(h.n);
    if (h.atrib && window.ATRIBUTOS) ATRIBUTOS.sumarPuntos(h.atrib);
    if (h.arbol && window.ARBOL) ARBOL.sumarPuntos(h.arbol);
  }
  function ponerseAlDia() {
    LISTA.forEach((h) => h.n <= nivel() && dar(h));
  }
  // el cartel grande dice «Salto de poder · nombre» con su color en vez de «Subiste de nivel»
  function rotuloCartel(h) {
    setTimeout(() => {
      const el = document.getElementById("hudNivelSube");
      if (!el) return;
      el.classList.toggle("salto", !!h);
      el.querySelector("small").textContent = h ? t("sl.salto", [nombre(h)]) : t("rp.subiste");
    }, 0);
  }

  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      if (!window.RPG) return;
      RPG.NUCLEO.saltos = 1; // como el nivel: no se topa
      RPG.aporte((s, n) => LISTA.forEach((h) => n >= h.n && h.s(s)), "saltos");
      RPG.alSubir((n) => {
        const h = de(n);
        rotuloCartel(h);
        if (!h) return [];
        dar(h);
        if (window.SONIDO) J.retrasar(0.4, () => SONIDO.tocar("rugido", { vol: 0.35, tono: 1.3 }));
        return lineas(h);
      });
    },
    alEmpezar() {
      if (window.RPG) ponerseAlDia();
    },
    diario() {
      const h = proximo();
      if (!h) return `<div class="diario-resumen"><p><b>${t("sl.titulo")}</b> ${t("sl.todos")}</p></div>`;
      return `<div class="diario-resumen"><p><b>${t("sl.titulo")}</b> ${t("sl.proximo", [h.n, nombre(h)])} ${lineas(h).join(" · ")}.</p></div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, LISTA, proximo, nombre, lineas, de };
})();
