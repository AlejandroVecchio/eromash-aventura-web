// ---------- la nota de la PR (solo para revisar: no es parte del juego) ----------
// Cada PR de los sistemas de rol reemplaza este archivo con lo que hay que mirar en ella y botones para probarlo
// (ir a un lugar, darse experiencia, objetos, el estado justo). Se ve solo en la máquina de quien revisa
// (localhost, 127.0.0.1 o archivo) o con ?pr=1; ?pr=0 la esconde. La última PR de la tanda borra la carpeta js/pr.
(function () {
  "use strict";
  const NOTA = {
    pr: 47,
    titulo: { es: "Skuggi, el perro compañero", en: "Skuggi, the companion dog" },
    // las PRs anteriores que esta usa y para qué (vacío: no depende de ninguna)
    usa: [
      { pr: 1, es: "niveles: el mordisco crece con tu nivel", en: "levels: his bite grows with your level" },
      { pr: 21, es: "alquimia: lo que escarba puede ser una hierba", en: "alchemy: what he digs up can be a herb" },
      { pr: 12, es: "materiales: o un cuero curtido", en: "materials: or tanned leather" },
    ],
    mirar: [
      { es: "Junto a un camino que sale del Puesto (marcado en el mapa con una huella) hay un perro herido. Al acercarte aparecen tres lobos: vencelos y con E lo atendés. Skuggi va con vos: te sigue al costado, corre a morder a lo que te ataca, salta fuera de los avisos del piso y cuando se cansa vuelve jadeando. Nunca muere.", en: "By a road leaving the Outpost (marked on the map with a paw print) lies a wounded dog. Get close and three wolves appear: beat them and press E to tend him. Skuggi comes with you: follows at your side, runs to bite whatever attacks you, jumps out of the ground warnings and comes back panting when tired. He never dies." },
      { es: "Con E cerca de él le hablás: acariciarlo (una vez por día), quedate acá / seguime (si lo dejás, el mapa marca dónde espera y desde la Bolsa lo llamás) y buscá. Si te vas lejos, entrás a una casa o viajás, vuelve solo.", en: "Press E near him to talk: pet him (once a day), stay here / follow me (if you leave him, the map marks where he waits and you can call him from the Bag) and search. If you go far, enter a house or travel, he comes back on his own." },
      { es: "El vínculo crece con cada mordisco, cada criatura que caen juntos y cada caricia, y enseña cinco trucos: muerde, derriba (cada tercer mordisco tira a las chicas), olfato (ladra y marca con una huella dorada a lo que no te vio, y escarba algo una vez por día), aullido (con tu vida baja espanta a las chicas) y lealtad (+5 % de daño con él al lado).", en: "The bond grows with every bite, every creature you bring down together and every pat, and teaches five tricks: bite, takedown (every third bite knocks small ones down), nose (barks and marks with a golden paw print what hasn't seen you, and digs something up once a day), howl (when your health is low it scatters small ones) and loyalty (+5% damage with him at your side)." },
    ],
    botones: [
      { es: "Llevarme al perro herido", en: "Take me to the wounded dog", fn: (A) => {
        const l = COMPANERO.lugar();
        ir(A, l, 0, 420);
      } },
      { es: "Rescatarlo ya", en: "Rescue him now", fn: () => {
        const ls = COMPANERO.lobos();
        if (ls) ls.forEach((e) => (e.muerto = 1));
        COMPANERO.atender();
      } },
      { es: "Vínculo al máximo (todos los trucos)", en: "Max bond (every trick)", fn: () => COMPANERO.sumar(600) },
      { es: "Traer criaturas para pelear juntos", en: "Bring creatures to fight together", fn: (A) => {
        [[200, 0, "lobo"], [220, 90, "jabali"], [160, -110, "lobo"]].forEach(([dx, dy, tipo]) => {
          const e = A.CB.crear(tipo, A.jug.x + dx, A.jug.y + dy, {});
          e.activo = true;
          e.estado = "persigue";
          A.enemigos.push(e);
        });
      } },
      { es: "Que pueda volver a buscar y acariciarlo hoy", en: "Let him search and be petted again today", fn: () => {
        COMPANERO.estado().buscado = -1;
        COMPANERO.estado().acariciado = -1;
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
