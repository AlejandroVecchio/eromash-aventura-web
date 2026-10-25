// ---------- la nota de la PR (solo para revisar: no es parte del juego) ----------
// Cada PR de los sistemas de rol reemplaza este archivo con lo que hay que mirar en ella y botones para probarlo
// (ir a un lugar, darse experiencia, objetos, el estado justo). Se ve solo en la máquina de quien revisa
// (localhost, 127.0.0.1 o archivo) o con ?pr=1; ?pr=0 la esconde. La última PR de la tanda borra la carpeta js/pr.
(function () {
  "use strict";
  const NOTA = {
    pr: 12,
    titulo: { es: "Materiales, vetas y desarmar", en: "Materials, veins and salvage" },
    // las PRs anteriores que esta usa y para qué (vacío: no depende de ninguna)
    usa: [
      { pr: 3, es: "botín y mochila: desarmar una pieza de la bolsa ahora da materiales", en: "loot and backpack: salvaging a piece from the bag now gives materials" },
      { pr: 11, es: "forja: Ása cobra materiales además de plata, y la brasa abre un tercer modo", en: "forge: Ása charges materials as well as silver, and the ember opens a third mode" },
      { pr: 8, es: "martillo: raja las vetas el doble de rápido", en: "hammer: cracks veins twice as fast" },
    ],
    mirar: [
      { es: "Cinco materiales con nombre en la Bolsa de la mochila (I), cada uno con su ícono: hierro de pantano, cuero curtido, ámbar, esquirla rúnica y brasa de Muspell.", en: "Five named materials in the backpack's Bag tab (I), each with its icon: bog iron, tanned leather, amber, rune shard and Muspell ember." },
      { es: "Desarmar (R o △ sobre una pieza) dice antes qué deja: las armas dan hierro, las armaduras cuero, las joyas ámbar; lo raro suma esquirlas y lo legendario una brasa.", en: "Salvage (R or △ on a piece) tells you first what it gives: weapons give iron, armour leather, jewellery amber; rares add shards and legendaries an ember." },
      { es: "Vetas en el bosque (la de hierro herrumbrada, el nódulo de ámbar, la vena rúnica que late): se pican con E o a golpes, se rajan tres veces y sueltan el material. Vuelven a crecer a los 10 minutos. Con martillo, el doble.", en: "Veins in the forest (the rusty iron one, the amber nodule, the pulsing rune vein): mine them with E or by hitting them, they crack three times and drop materials. They grow back after 10 minutes. A hammer counts double." },
      { es: "Lobos, jabalíes y el oso dejan cuero; draugr y custodios hierro; los fuegos fatuos ámbar y esquirlas; los líderes el doble.", en: "Wolves, boars and the bear drop leather; draugr and wardens iron; will-o'-wisps amber and shards; leaders twice as much." },
      { es: "En la forja cada modo dice qué materiales pide (lo que falta en rojo). Con una brasa aparece «Con la brasa de Muspell»: a fuego vivo y la nota sube.", en: "In the forge each mode lists the materials it needs (missing ones in red). With an ember you get «With the Muspell ember»: roaring fire and a higher score." },
    ],
    botones: [
      { es: "Ir a la veta de hierro más cercana", en: "Go to the nearest iron vein", fn: (A) => {
        const v = MATERIALES.vetas().filter((v) => v.tipo === "vetaHierro").sort((a, b) => Math.hypot(a.cosa.x - A.jug.x, a.cosa.y - A.jug.y) - Math.hypot(b.cosa.x - A.jug.x, b.cosa.y - A.jug.y))[0];
        if (v) ir(A, [v.cosa.x, v.cosa.y + 70]);
      } },
      { es: "Ir a la vena rúnica más cercana", en: "Go to the nearest rune vein", fn: (A) => {
        const v = MATERIALES.vetas().filter((v) => v.tipo === "vetaRunica").sort((a, b) => Math.hypot(a.cosa.x - A.jug.x, a.cosa.y - A.jug.y) - Math.hypot(b.cosa.x - A.jug.x, b.cosa.y - A.jug.y))[0];
        if (v) ir(A, [v.cosa.x, v.cosa.y + 70]);
      } },
      { es: "Darme 6 piezas para desarmar (una legendaria)", en: "Give me 6 pieces to salvage (one legendary)", fn: (A) => {
        [0, 0, 1, 1, 2, 3].forEach((r) => BOTIN.dar(OBJETOS.generar({ n: RPG.nivel(), r, tema: 1 }), { silencio: true }));
        INVENTARIO.abrir("bolsa");
      } },
      { es: "Darme materiales y abrir la forja", en: "Give me materials and open the forge", fn: (A) => {
        ["hierro", "cuero", "ambar", "esquirla"].forEach((k) => MATERIALES.dar(k, 12));
        MATERIALES.dar("brasa", 2);
        PODERES.pj().plata = Math.max(PODERES.pj().plata, 2000);
        FORJA.abrir();
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
