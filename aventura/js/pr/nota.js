// ---------- la nota de la PR (solo para revisar: no es parte del juego) ----------
// Cada PR de los sistemas de rol reemplaza este archivo con lo que hay que mirar en ella y botones para probarlo
// (ir a un lugar, darse experiencia, objetos, el estado justo). Se ve solo en la máquina de quien revisa
// (localhost, 127.0.0.1 o archivo) o con ?pr=1; ?pr=0 la esconde. La última PR de la tanda borra la carpeta js/pr.
(function () {
  "use strict";
  const NOTA = {
    pr: 50,
    titulo: { es: "La saga de Eromash", en: "The saga of Eromash" },
    // las PRs anteriores que esta usa y para qué (vacío: no depende de ninguna)
    usa: [
      { pr: 1, es: "niveles", en: "levels" },
      { pr: 49, es: "y casi todas las de la tanda: cada entrada de la saga lee el estado guardado de su sistema (bestiario, contratos, Sin Linde, arañas, hólmganga, jötunn, Cacería, lecciones, hierbas, cocina, pesca, tintes, legendarias, conjuntos, libros, hörgar, elementos, la casa y Skuggi)", en: "and almost every PR in the batch: each saga entry reads its system's saved state (bestiary, contracts, Lawless, spiders, holmgang, jötunn, Wild Hunt, lessons, herbs, cooking, fishing, dyes, legendaries, sets, books, hörgar, elements, the house and Skuggi)" },
    ],
    mirar: [
      { es: "En la mochila hay una pestaña nueva, Saga, con el porcentaje en el nombre: todo lo que Eldervald tiene para hacer en cuatro capítulos (la pelea, los oficios, el mundo y la gente). Cada casilla lleva su runa y cuánto va (3/5); al elegirla, abajo su barra y una pista de cómo empezar. Lo que todavía no empezaste se ve apagado y lo completo en dorado.", en: "The backpack has a new tab, Saga, with the percentage in its name: everything Eldervald has to do in four chapters (the fight, the crafts, the world and the people). Each slot carries its rune and how far along it is (3/5); pick it to see its bar and a hint on how to start. What you haven't started is dimmed and what's complete is gold." },
      { es: "La saga entera tiene un porcentaje (el promedio de las entradas) y cuatro hitos que pagan una sola vez: 25 % plata, 50 % un fragmento, 75 % una pieza rara o mejor y 100 % una legendaria y el título «Leyenda de Eldervald», que encabeza la pestaña. Una partida vieja que ya pasó hitos no los cobra de golpe al cargar.", en: "The whole saga has a percentage (the average of its entries) and four milestones that pay once: 25% silver, 50% a fragment, 75% a rare piece or better and 100% a legendary and the title «Legend of Eldervald», shown at the top of the tab. An old save that already passed milestones doesn't cash them all at once on load." },
    ],
    botones: [
      { es: "Abrir la Saga", en: "Open the Saga", fn: () => INVENTARIO.abrir("saga") },
      { es: "Avanzar varias (hólmganga, Skuggi, la casa, 10 niveles)", en: "Advance several (holmgang, Skuggi, the house, 10 levels)", fn: (A) => {
        if (window.HOLMR) HOLMR.estado().vencidos = 5;
        if (window.COMPANERO) {
          COMPANERO.estado().rescatado = true;
          COMPANERO.sumar(600);
        }
        if (window.CASA) CASA.estado().tuya = true;
        let x = 0;
        for (let n = RPG.nivel(); n < Math.min(RPG.TOPE, RPG.nivel() + 10); n++) x += RPG.xpPara(n);
        RPG.dar(x, A.jug.x, A.jug.y);
        INVENTARIO.abrir("saga");
      } },
      { es: "Ver los cuatro hitos (completar todo un momento)", en: "See the four milestones (complete everything for a moment)", fn: () => {
        const viejas = SAGA.ENTRADAS.map((e) => e[5]);
        SAGA.ENTRADAS.forEach((e) => (e[5] = () => [1, 1]));
        SAGA.revisar(false);
        SAGA.ENTRADAS.forEach((e, i) => (e[5] = viejas[i]));
      } },
      { es: "Volver a cobrar los hitos", en: "Reset the milestones", fn: () => {
        SAGA.estado().hitos = {};
        SAGA.estado().leyenda = false;
      } },
    ],
  };
  // ---------- ayuda para los botones ----------
  function ir(A, p, dx = 0, dy = 0) {
    let x = p[0] + dx,
      y = p[1] + dy;
    for (let r = 0; r < 800 && !A.W.libre(x, y, 16); r += 30) {
      const a = r * 0.7;
      x = p[0] + dx + Math.cos(a) * r;
      y = p[1] + dy + Math.sin(a) * r;
    }
    A.teletransportar(x, y);
  }
  // el centro del grupo de criaturas que más puntaje saca con f
  function cercaDeGrupo(A, f) {
    const gs = (window.HORDAS ? HORDAS.grupos : []).filter((g) => !g.unico);
    gs.sort((a, b) => f(b) - f(a));
    return gs[0] ? gs[0].centro : A.jug.x ? [A.jug.x, A.jug.y] : [0, 0];
  }
  window.NOTA_PR = { ir, cercaDeGrupo };

  const q = new URLSearchParams(location.search);
  const local = /^(localhost|127\.0\.0\.1|)$/.test(location.hostname) || location.protocol === "file:";
  if (q.get("pr") === "0" || (!local && !q.get("pr"))) return;
  const L = () => (window.I18N && I18N.lang === "en" ? "en" : "es");
  function armar() {
    const A = window.JUEGO && JUEGO.A;
    if (!A) return setTimeout(armar, 300);
    const d = document.createElement("div");
    d.id = "notaPr";
    d.className = "panel";
    const l = L();
    d.innerHTML = `<button class="np-cabeza" type="button"><small>PR ${NOTA.pr} · ${l === "en" ? "what to check" : "qué mirar"}</small><b></b><i>−</i></button><div class="np-cuerpo"><ul></ul><div class="np-botones"></div><p class="np-pie"></p></div>`;
    d.querySelector("b").textContent = NOTA.titulo[l];
    const usa = document.createElement("p");
    usa.className = "np-usa";
    usa.textContent = NOTA.usa.length ? (l === "en" ? "Uses: " : "Usa: ") + NOTA.usa.map((u) => "PR " + u.pr + " (" + u[l] + ")").join(" · ") : l === "en" ? "Doesn't depend on other PRs." : "No depende de otras PRs.";
    d.querySelector(".np-cuerpo").prepend(usa);
    NOTA.mirar.forEach((m) => {
      const li = document.createElement("li");
      li.textContent = m[l];
      d.querySelector("ul").appendChild(li);
    });
    NOTA.botones.forEach((b) => {
      const el = document.createElement("button");
      el.type = "button";
      el.textContent = b[l];
      el.addEventListener("click", () => {
        // en el título (o sin partida) arranca la ranura de pruebas
        if (!JUEGO.J.cam.x || JUEGO.J.modo === "titulo" || document.querySelector("#capa:not(.oculto) #capaCaja h1")) JUEGO.empezar(9, true);
        try {
          b.fn(A);
        } catch (e) {
          console.error(e);
        }
        el.blur();
      });
      d.querySelector(".np-botones").appendChild(el);
    });
    d.querySelector(".np-pie").textContent = l === "en" ? "Only on the reviewer's machine (?pr=0 hides it). Buttons start slot 9 if no game is running." : "Solo en la máquina de quien revisa (?pr=0 la esconde). Si no hay partida, los botones arrancan la ranura 9.";
    let plegada = false;
    try {
      plegada = localStorage.getItem("eromash.notaPr.plegada") === "1";
    } catch (e) {}
    const plegar = (v) => {
      plegada = v;
      d.classList.toggle("plegada", v);
      d.querySelector(".np-cabeza i").textContent = v ? "+" : "−";
      try {
        localStorage.setItem("eromash.notaPr.plegada", v ? "1" : "0");
      } catch (e) {}
    };
    d.querySelector(".np-cabeza").addEventListener("click", () => plegar(!plegada));
    plegar(plegada);
    const css = document.createElement("style");
    css.textContent = `#notaPr{position:fixed;left:16px;top:16px;z-index:60;width:330px;max-height:calc(100vh - 200px);overflow:auto;padding:10px 14px;border-left:3px solid #73D5DB;font-size:12px;color:#F2ECEC}#notaPr .np-cabeza{all:unset;cursor:pointer;display:grid;grid-template-columns:1fr auto;width:100%}#notaPr .np-cabeza small{grid-column:1;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#73D5DB;font-weight:800}#notaPr .np-cabeza b{grid-column:1;font-size:15px;color:#FFD98A}#notaPr .np-cabeza i{grid-column:2;grid-row:1/3;align-self:center;font-style:normal;font-size:20px;color:#73D5DB}#notaPr.plegada .np-cuerpo{display:none}#notaPr ul{margin:8px 0;padding-left:16px;line-height:1.4}#notaPr li{margin-bottom:4px}#notaPr .np-botones{display:flex;flex-direction:column;gap:5px}#notaPr .np-botones button{font:inherit;font-weight:700;text-align:left;color:#F2ECEC;background:#221B18;border:1px solid #3A2A26;padding:6px 10px;cursor:pointer}#notaPr .np-botones button:hover{background:#3A1A14;border-color:#FFD98A}#notaPr .np-usa{margin:8px 0 0;font-size:11px;color:#E0B2B2}#notaPr .np-pie{margin:8px 0 0;font-size:10px;color:#8A8080}#notaPr.en-menu{opacity:.55}#notaPr.en-menu .np-cuerpo{display:none}`;
    document.head.appendChild(css);
    document.body.appendChild(d);
    // con la mochila o un menú abierto, la nota se pliega sola para no taparlo
    setInterval(() => d.classList.toggle("en-menu", !!(window.JUEGO && JUEGO.J.modo !== "juego" && JUEGO.J.modo !== "titulo")), 250);
  }
  armar();
})();
