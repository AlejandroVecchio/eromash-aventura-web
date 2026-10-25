// ---------- la nota de la PR (solo para revisar: no es parte del juego) ----------
// Cada PR de los sistemas de rol reemplaza este archivo con lo que hay que mirar en ella y botones para probarlo
// (ir a un lugar, darse experiencia, objetos, el estado justo). Se ve solo en la máquina de quien revisa
// (localhost, 127.0.0.1 o archivo) o con ?pr=1; ?pr=0 la esconde. La última PR de la tanda borra la carpeta js/pr.
(function () {
  "use strict";
  const NOTA = {
    pr: 38,
    titulo: { es: "La Cacería Salvaje (evento de noche)", en: "The Wild Hunt (night event)" },
    // las PRs anteriores que esta usa y para qué (vacío: no depende de ninguna)
    usa: [
      { pr: 1, es: "niveles: aparece desde el nivel 4 y paga experiencia", en: "levels: it appears from level 4 and pays experience" },
      { pr: 3, es: "botín: el Cazador deja una pieza", en: "loot: the Huntsman drops an item" },
      { pr: 15, es: "bestiario: dos páginas nuevas y el Cazador entre los únicos", en: "bestiary: two new pages and the Huntsman among the uniques" },
    ],
    mirar: [
      { es: "Una noche de cada tres (desde la segunda y con nivel 4) suena un cuerno lejano a las 20:30: esa noche corre la Cacería Salvaje. A las 22, si andás afuera y sin pelear, llega el Cazador de Oskoreia con cuatro sabuesos de humo, la noche se pone violeta y arriba a la izquierda corre el tiempo (75 s).", en: "One night in three (from the second, at level 4) a distant horn sounds at 20:30: that night the Wild Hunt rides. At 22, if you're outside and not fighting, the Oskoreia Huntsman arrives with four smoke hounds, the night turns violet and a 75 s timer runs on the left." },
      { es: "El Cazador carga en línea con la lanza y los sabuesos muerden en abanico; son fantasmas (cruzan árboles, la runa del sol les pega triple). Cada 11 s cruzan los jinetes: una franja violeta larga donde estás, que pega al terminar (saltala o salite). A los 35 s, si quedan menos de dos sabuesos, vuelven dos.", en: "The Huntsman charges in a line with his spear and the hounds bite in a fan; they're ghosts (they pass through trees, the sun rune hits them triple). Every 11 s the riders sweep past: a long violet strip where you stand that hits when it ends (jump it or step out). At 35 s, if fewer than two hounds remain, two come back." },
      { es: "Cuatro finales: tumbar al Cazador (plata, experiencia, una pieza y la primera vez su cuerno), aguantar los 75 s (algo de plata y experiencia), meterte en un pueblo o una casa (pasa de largo) o caer. El Cuerno de la Cacería queda en la Bolsa: de noche y afuera la llama a propósito, una vez por noche.", en: "Four endings: bring down the Huntsman (silver, experience, an item and the first time his horn), hold out the 75 s (some silver and experience), get into a village or house (it rides past) or fall. The Horn of the Hunt stays in your Bag: at night and outside it calls the Hunt on purpose, once per night." },
    ],
    botones: [
      { es: "Llamarla ahora (de noche, en un claro)", en: "Call it now (at night, in a clearing)", fn: (A) => {
        afueraDeNoche(A, 22.5);
        setTimeout(() => CACERIA.empezar(CACERIA.nocheId()), 500);
      } },
      { es: "Una noche de Cacería a las 20:25 (oír el cuerno)", en: "A Hunt night at 20:25 (hear the horn)", fn: (A) => {
        let n = CACERIA.nocheId() + 1;
        while (!CACERIA.toca(n)) n++;
        afueraDeNoche(A, 20.4, n);
      } },
      { es: "Darme el Cuerno de la Cacería", en: "Give me the Horn of the Hunt", fn: (A) => {
        CACERIA.estado().cuerno = true;
        CACERIA.estado().corrida = -1;
        afueraDeNoche(A, 23);
        setTimeout(() => INVENTARIO.abrir("bolsa"), 1500);
      } },
    ],
  };
  // de noche, nivel 4 o más y en el claro del jötunn (lejos de Hrímnir y de los pueblos)
  function afueraDeNoche(A, h, n) {
    while (window.RPG && RPG.nivel() < CACERIA.NIVEL_MIN) RPG.dar(500);
    const noche = n != null ? n : CACERIA.nocheId() + 1;
    A.H.E.tiempo = ((24 * noche + h - 9 + (h < 20 ? 24 : 0)) / 24) * LUZ.DIA;
    if (CACERIA.caza()) CACERIA.terminar("cayo");
    const j = JOTUNN.jefe();
    ir(A, j.centro, 0, 760);
  }
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
