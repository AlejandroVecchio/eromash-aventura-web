// ---------- la nota de la PR (solo para revisar: no es parte del juego) ----------
// Cada PR de los sistemas de rol reemplaza este archivo con lo que hay que mirar en ella y botones para probarlo
// (ir a un lugar, darse experiencia, objetos, el estado justo). Se ve solo en la máquina de quien revisa
// (localhost, 127.0.0.1 o archivo) o con ?pr=1; ?pr=0 la esconde. La última PR de la tanda borra la carpeta js/pr.
(function () {
  "use strict";
  const NOTA = {
    pr: 39,
    titulo: { es: "Los vættir, espíritus de la tierra", en: "The vættir, spirits of the land" },
    // las PRs anteriores que esta usa y para qué (vacío: no depende de ninguna)
    usa: [
      { pr: 12, es: "materiales: las ofrendas son materiales de la Bolsa", en: "materials: offerings are materials from the Bag" },
      { pr: 36, es: "arañas: Ugla quiere seda", en: "spiders: Ugla wants silk" },
    ],
    mirar: [
      { es: "Seis lugares chicos a un costado de los caminos, cada uno con su dibujo y su nombre: el manantial de Brunna, el tocón de la puertita, la piedra horadada, el túmulo chico, la roca de los líquenes y el hueco del búho. Al encontrar uno va al mapa (clase Vættir).", en: "Six small places beside the roads, each with its own drawing and name: Brunna's spring, the stump with the little door, the holed stone, the little barrow, the lichen rock and the owl's hollow. Finding one puts it on the map (Vættir class)." },
      { es: "Con E se abre su hogar: una pista dice qué quiere (ámbar, cuero, hierro, esquirla, brasa o seda). Lo que no quiere lo devuelve; lo que quiere sube su favor. De noche, con algo de favor, se asoma medio transparente.", en: "Press E to open its home: a hint says what it wants (amber, leather, iron, shard, ember or silk). What it doesn't want it gives back; what it wants raises its favour. At night, with some favour, it peeks out half transparent." },
      { es: "Con favor 3 se muestra, habla, regala plata y un fragmento, y bendice su tierra: abajo a la izquierda sale «Tierra de …» con el don (vida que vuelve, estamina, −10 % de daño recibido, +10 % de daño, más materiales o más plata). Con los seis sos amigo de los vættir.", en: "At favour 3 it shows itself, speaks, gives silver and a shard, and blesses its land: at the bottom left “… 's land” appears with its gift (life regen, stamina, −10% damage taken, +10% damage, more materials or more silver). With all six you're a friend of the vættir." },
    ],
    botones: [
      { es: "Llevarme al manantial de Brunna (con ámbar)", en: "Take me to Brunna's spring (with amber)", fn: (A) => {
        MATERIALES.dar("ambar", 3);
        const h = VAETTIR.hogares.find((q) => q.v.id === "manantial");
        ir(A, [h.x, h.y], 120, 60);
      } },
      { es: "Darme uno de cada ofrenda", en: "Give me one of each offering", fn: () => {
        ["hierro", "cuero", "ambar", "esquirla", "brasa", "seda"].forEach((m) => MATERIALES.dar(m, 1));
      } },
      { es: "Mostrarme todos en el mapa", en: "Show me all of them on the map", fn: () => {
        VAETTIR.hogares.forEach((h) => (VAETTIR.estado().vistos[h.v.id] = 1));
        setTimeout(() => window.MAPA && MAPA.abrir && MAPA.abrir(), 300);
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
