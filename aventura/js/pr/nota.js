// ---------- la nota de la PR (solo para revisar: no es parte del juego) ----------
// Cada PR de los sistemas de rol reemplaza este archivo con lo que hay que mirar en ella y botones para probarlo
// (ir a un lugar, darse experiencia, objetos, el estado justo). Se ve solo en la máquina de quien revisa
// (localhost, 127.0.0.1 o archivo) o con ?pr=1; ?pr=0 la esconde. La última PR de la tanda borra la carpeta js/pr.
(function () {
  "use strict";
  const NOTA = {
    pr: 21,
    titulo: { es: "Hierbas y alquimia", en: "Herbs and alchemy" },
    // las PRs anteriores que esta usa y para qué (vacío: no depende de ninguna)
    usa: [
      { pr: 3, es: "mochila: la Bolsa muestra hierbas, pociones y aceites (con el hook nuevo celdasBolsa) y la mesa abre su pestaña", en: "backpack: the Bag shows herbs, potions and oils (with the new celdasBolsa hook) and the table opens its tab" },
      { pr: 18, es: "Furia: la poción elegida se puede poner en una casilla de la barra (o L2 + R1)", en: "Fury: the chosen potion can go in a bar slot (or L2 + R1)" },
    ],
    mirar: [
      { es: "Por el bosque crecen seis hierbas, cada una donde le gusta: musgo, serbal y raíz de abedul en todos lados, la flor de escarcha junto al agua, el hongo de luna (alumbra de noche) y el cardo cerca de los túmulos y los draugr. Se juntan con E y vuelven a los 8 minutos; la Lente las marca.", en: "Six herbs grow in the forest, each where it likes: moss, rowan and birch root everywhere, frostflower by the water, moon mushroom (glows at night) and thistle near barrows and draugr. Gather them with E; they regrow after 8 minutes; the Lens marks them." },
      { es: "La mesa de alquimia del Puesto (E) abre la pestaña Alquimia: cinco pociones y cuatro aceites. Tocar una receta abre el juego del matraz: se mueve con A / D (o arrastrándolo) y hay que atrapar las motas de las hierbas que pide el costado; las de otro color y la podredumbre la ensucian. La efectividad (20 a 100 %) queda con el frasco y la poción o el aceite rinde en proporción. Esc termina con lo que haya.", en: "The Outpost's alchemy table (E) opens the Alchemy tab: five potions and four oils. Touching a recipe starts the flask game: move it with A / D (or drag it) and catch the motes of the herbs listed on the side; other colours and rot spoil it. The potency (20 to 100 %) stays with the bottle and the potion or oil works in proportion. Esc finishes with what you have." },
      { es: "Las burbujas de la mesa se oyen solo cerca de ella (antes sonaba el fuego en todo el mapa).", en: "The table's bubbling is only heard near it (before, the fire sound played across the whole map)." },
      { es: "Las pociones se toman desde la Bolsa (o la elegida con 5) y duran un rato; cada una suma toxicidad y con mucha no se puede tomar más. Arriba del retrato aparece una tira con lo que dura cada efecto.", en: "Potions are drunk from the Bag (or the chosen one with 5) and last a while; each adds toxicity and with too much you can't drink more. A strip above the portrait shows each effect's time left." },
      { es: "Los aceites se untan en el arma: +25 % contra una familia (no-muertos, fatuos, bestias, troles) durante 40 golpes.", en: "Oils coat your weapon: +25 % against one family (undead, wisps, beasts, trolls) for 40 hits." },
    ],
    botones: [
      { es: "Ir a la mesa de alquimia", en: "Go to the alchemy table", fn: (A) => {
        const m = ALQUIMIA.mesa();
        ir(A, [m.x + 30, m.y + 140]);
      } },
      { es: "Darme hierbas de todas", en: "Give me every herb", fn: () => Object.keys(ALQUIMIA.HIERBAS).forEach((k) => (ALQUIMIA.estado().hierbas[k] = (ALQUIMIA.estado().hierbas[k] || 0) + 8)) },
      { es: "Ir a una flor de escarcha", en: "Go to a frostflower", fn: (A) => {
        const p = ALQUIMIA.plantas().find((q) => q.tipo === "escarcha" && !q.cosa.o.cosechada) || ALQUIMIA.plantas()[0];
        ir(A, [p.cosa.x, p.cosa.y + 110]);
      } },
      { es: "Ir a un cardo (cerca de draugr)", en: "Go to a thistle (near draugr)", fn: (A) => {
        const p = ALQUIMIA.plantas().find((q) => q.tipo === "cardo" && !q.cosa.o.cosechada) || ALQUIMIA.plantas()[0];
        ir(A, [p.cosa.x, p.cosa.y + 110]);
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
