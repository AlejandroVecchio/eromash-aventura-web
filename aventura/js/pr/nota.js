// ---------- la nota de la PR (solo para revisar: no es parte del juego) ----------
// Cada PR de los sistemas de rol reemplaza este archivo con lo que hay que mirar en ella y botones para probarlo
// (ir a un lugar, darse experiencia, objetos, el estado justo). Se ve solo en la máquina de quien revisa
// (localhost, 127.0.0.1 o archivo) o con ?pr=1; ?pr=0 la esconde. La última PR de la tanda borra la carpeta js/pr.
(function () {
  "use strict";
  const NOTA = {
    pr: 41,
    titulo: { es: "Los dados de hueso", en: "Bone dice" },
    // las PRs anteriores que esta usa y para qué (vacío: no depende de ninguna)
    usa: [],
    mirar: [
      { es: "En el patio del Puesto juega Bersi el Tuerto y en Brunvik Hallgerd la Atrevida, cada una en su mesa con mantel, cubilete, vela y plata (en el mapa, clase Dados). Ulf juega en la mesa de la taberna. Con E se elige la apuesta (10, 25 o 50) o se piden las reglas.", en: "In the Outpost yard Bersi One-Eye plays and in Brunvik Hallgerd the Bold, each at their own table with cloth, cup, candle and silver (on the map, Dice class). Ulf plays at the tavern table. Press E to choose the bet (10, 25 or 50) or ask for the rules." },
      { es: "Se tiran seis dados: los 1 valen 100, los 5 valen 50, tres iguales y las escaleras más. Se aparta lo que vale (izquierda/derecha y E, o tocando el dado) y se elige seguir tirando (Espacio) o plantarse (la lente). Una tirada sin nada pierde todo el turno; si los seis valen, se tiran los seis otra vez. Gana el primero a 2000 y se lleva el doble de la apuesta.", en: "Six dice are rolled: 1s are worth 100, 5s 50, three of a kind and straights more. Set aside what scores (left/right and E, or tap the die) and choose to roll on (Space) or stop (the lens). A roll with nothing loses the whole turn; if all six score, roll all six again. First to 2000 wins and takes double the bet." },
      { es: "Cada jugador tiene su carácter: Bersi se planta temprano, Hallgerd arriesga hasta 650 y Ulf queda en el medio. Ganándole a los tres se abre la mesa alta (apuestas de 100 y 200). Levantarse a la mitad cuenta como perdida. El diario lleva partidas, plata ganada y tu mejor turno.", en: "Each player has a temperament: Bersi stops early, Hallgerd risks up to 650 and Ulf sits in the middle. Beating all three opens the high table (bets of 100 and 200). Getting up midway counts as a loss. The journal keeps games, silver won and your best turn." },
    ],
    botones: [
      { es: "Llevarme a la mesa de Bersi", en: "Take me to Bersi's table", fn: (A) => {
        const m = DADOS.mesas.find((q) => q.rival === "bersi");
        ir(A, [m.x, m.y], 0, 110);
      } },
      { es: "Llevarme a la mesa de Hallgerd", en: "Take me to Hallgerd's table", fn: (A) => {
        const m = DADOS.mesas.find((q) => q.rival === "hallgerd");
        ir(A, [m.x, m.y], 0, 110);
      } },
      { es: "Darme 300 de plata", en: "Give me 300 silver", fn: () => {
        PODERES.pj().plata += 300;
      } },
      { es: "Abrir la mesa alta (ganados los tres)", en: "Open the high table (all three beaten)", fn: () => {
        Object.assign(DADOS.estado().vencidos, { bersi: 1, hallgerd: 1, ulf: 1 });
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
