// ---------- la nota de la PR (solo para revisar: no es parte del juego) ----------
// Cada PR de los sistemas de rol reemplaza este archivo con lo que hay que mirar en ella y botones para probarlo
// (ir a un lugar, darse experiencia, objetos, el estado justo). Se ve solo en la máquina de quien revisa
// (localhost, 127.0.0.1 o archivo) o con ?pr=1; ?pr=0 la esconde. La última PR de la tanda borra la carpeta js/pr.
(function () {
  "use strict";
  const NOTA = {
    pr: 43,
    titulo: { es: "Facciones y reputación", en: "Factions and reputation" },
    // las PRs anteriores que esta usa y para qué (vacío: no depende de ninguna)
    usa: [
      { pr: 13, es: "comercio: Ingrid y Kolbrun cobran menos según la reputación", en: "trade: Ingrid and Kolbrun charge less by reputation" },
      { pr: 16, es: "contratos: cada trofeo cobrado suma a la Guardia", en: "contracts: each trophy collected counts for the Guard" },
      { pr: 35, es: "bandidos: cada bandido y cada guarida suman a la Guardia", en: "bandits: each bandit and lair counts for the Guard" },
      { pr: 40, es: "pesca: suma al Gremio de Brunvik", en: "fishing: counts for the Brunvik Guild" },
    ],
    mirar: [
      { es: "Cuatro facciones con su estandarte: la Guardia del Roble (rojo con la cornamenta de Eikholt, afuera de la Puerta del Sur), los Guardasendas de Eydis (en el Puesto), el Gremio de Brunvik y el Pueblo Oculto (junto al primer vættr). Con E se ve la reputación; también desde la casilla Reputación de la Bolsa y en el mapa (clase Facciones).", en: "Four factions with their banners: the Oak Guard (red with Eikholt's antlers, outside the South Gate), Eydis's Waywardens (at the Outpost), the Brunvik Guild and the Hidden Folk (beside the first vættr). Press E to see your reputation; also from the Reputation slot in the Bag and on the map (Factions class)." },
      { es: "La reputación sale de lo que ya hacés: bandidos, contratos para la Guardia; misiones, lugares, el tablón y los encuentros para los Guardasendas; peces y platos para el Gremio; piedras, ritos y hörgr para el Pueblo Oculto. Sale «+N» sobre Eromash y una partida vieja cobra lo hecho al cargar.", en: "Reputation comes from what you already do: bandits, contracts for the Guard; quests, places, the board and encounters for the Waywardens; fish and dishes for the Guild; stones, rites and hörgr for the Hidden Folk. A “+N” shows over Eromash and an old save is credited on load." },
      { es: "Cinco grados (Desconocido, Conocido, Amigo, Honrado, Exaltado). Cada uno regala plata, Honrado un fragmento y Exaltado una pieza rara o mejor de la armería de la facción. Bonos: daño contra bandidos, Ingrid más barata, Kolbrun más barata y mejor precio al vender, más energía rúnica.", en: "Five ranks (Unknown, Known, Friend, Honored, Exalted). Each gives silver, Honored a fragment and Exalted a rare-or-better piece from the faction's armory. Bonuses: damage against bandits, cheaper Ingrid, cheaper Kolbrun and better selling prices, more rune energy." },
    ],
    botones: [
      { es: "Llevarme al estandarte de la Guardia", en: "Take me to the Guard's banner", fn: (A) => {
        const s = FACCIONES.estandartes.find((q) => q.f === "guardia");
        ir(A, [s.x, s.y], 0, 90);
      } },
      { es: "+500 de reputación con cada facción", en: "+500 reputation with each faction", fn: () => {
        FACCIONES.IDS.forEach((f) => FACCIONES.dar(f, 500));
      } },
      { es: "Dejarme a un paso de Exaltado con el Gremio", en: "Put me one step from Exalted with the Guild", fn: () => {
        FACCIONES.estado().rep.gremio = Math.max(FACCIONES.rep("gremio"), 3780);
        FACCIONES.dar("gremio", 1);
      } },
      { es: "Abrir la ventana de reputación", en: "Open the reputation window", fn: () => FACCIONES.ventana() },
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
