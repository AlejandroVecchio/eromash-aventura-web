// ---------- la nota de la PR (solo para revisar: no es parte del juego) ----------
// Cada PR de los sistemas de rol reemplaza este archivo con lo que hay que mirar en ella y botones para probarlo
// (ir a un lugar, darse experiencia, objetos, el estado justo). Se ve solo en la máquina de quien revisa
// (localhost, 127.0.0.1 o archivo) o con ?pr=1; ?pr=0 la esconde. La última PR de la tanda borra la carpeta js/pr.
(function () {
  "use strict";
  const NOTA = {
    pr: 20,
    titulo: { es: "El frasco de Thora", en: "Thora's flask" },
    // las PRs anteriores que esta usa y para qué (vacío: no depende de ninguna)
    usa: [
      { pr: 18, es: "Furia: usa el hook cosasBarra() para ir en la barra y las combinaciones del mando (L2 + ✕)", en: "Fury: uses the cosasBarra() hook to go in the bar and the gamepad combos (L2 + ✕)" },
      { pr: 12, es: "materiales: Thora pide ámbar y esquirlas para mejorarlo", en: "materials: Thora asks for amber and shards to improve it" },
    ],
    mirar: [
      { es: "Abajo hay una casilla nueva, el frasco (se usa con el número de su casilla, o L2 + ✕ con mando), con una marca por carga. Arranca con 3. Cada trago cura el 40 % de la vida de a poco (1,2 s) y frena el paso medio segundo; un golpe no corta la cura.", en: "There's a new slot at the bottom, the flask (use it with its slot number, or L2 + ✕ on a gamepad), with one mark per charge. It starts with 3. Each sip heals 40 % of your life gradually (1.2 s) and slows you for half a second; a hit doesn't cancel the heal." },
      { es: "Las cargas vuelven solas al entrar a un pueblo o refugio (el Puesto, el Refugio, la Casa de las Lindes, Brunvik, el Aserradero) y cuando Thora te cura.", en: "Charges come back on their own when you enter a village or refuge (the Outpost, the Refuge, the House of the Boundaries, Brunvik, the Sawmill) and when Thora heals you." },
      { es: "Thora, en la Casa de Sanación de Eikholt, además de curarte lo llena y lo mejora: hasta 6 cargas (plata y ámbar) y un ungüento más fuerte (plata y esquirlas, +10 % cada uno).", en: "Thora, in Eikholt's House of Healing, besides healing you fills it and improves it: up to 6 charges (silver and amber) and a stronger ointment (silver and shards, +10 % each)." },
      { es: "Con vida llena no se toma (no se desperdicia), y vacío avisa dónde se llena.", en: "It can't be drunk at full life (no waste), and when empty it tells you where to refill it." },
    ],
    botones: [
      { es: "Ir a pelear con la vida baja", en: "Go fight with low life", fn: (A) => {
        ir(A, cercaDeGrupo(A, (g) => (g.fam === "draugr" ? 1e6 : 0) - Math.hypot(g.centro[0] - A.jug.x, g.centro[1] - A.jug.y)), 0, 450);
        A.jug.hp = Math.round(A.jug.hpMax * 0.3);
      } },
      { es: "Vaciar el frasco", en: "Empty the flask", fn: () => (FRASCO.estado().cargas = 0) },
      { es: "Plata y materiales para mejorarlo", en: "Silver and materials to improve it", fn: () => {
        PODERES.pj().plata = Math.max(PODERES.pj().plata, 1500);
        MATERIALES.dar("ambar", 6);
        MATERIALES.dar("esquirla", 6);
      } },
      { es: "Abrir lo que ofrece Thora", en: "Open what Thora offers", fn: () => FRASCO.menuThora() },
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
