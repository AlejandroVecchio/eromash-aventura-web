// ---------- la nota de la PR (solo para revisar: no es parte del juego) ----------
// Cada PR de los sistemas de rol reemplaza este archivo con lo que hay que mirar en ella y botones para probarlo
// (ir a un lugar, darse experiencia, objetos, el estado justo). Se ve solo en la máquina de quien revisa
// (localhost, 127.0.0.1 o archivo) o con ?pr=1; ?pr=0 la esconde. La última PR de la tanda borra la carpeta js/pr.
(function () {
  "use strict";
  const NOTA = {
    pr: 42,
    titulo: { es: "Los libros de Eldervald", en: "The books of Eldervald" },
    // las PRs anteriores que esta usa y para qué (vacío: no depende de ninguna)
    usa: [
      { pr: 1, es: "niveles: cada libro nuevo da experiencia", en: "levels: each new book gives experience" },
      { pr: 2, es: "atributos: los libros de oficio dan un punto", en: "attributes: craft books give a point" },
      { pr: 17, es: "árbol de habilidades: la saga entera y el cuaderno del maestro dan un punto", en: "skill tree: the full saga and the master's notebook give a point" },
    ],
    mirar: [
      { es: "Hay nueve atriles de piedra a un costado de los caminos, cada uno con un libro abierto y la runa Ansuz encendida (el más cercano al Puesto tiene la Crónica breve de Eldervald). Al verlos van al mapa (clase Libros); con E se leen en una ventana de dos páginas: izquierda/derecha o tocar la hoja pasan, pausa cierra.", en: "There are nine stone lecterns beside the roads, each with an open book and the Ansuz rune lit (the one nearest the Outpost holds A Short Chronicle of Eldervald). Once seen they go on the map (Books class); press E to read them in a two-page window: left/right or tapping the page turns, pause closes." },
      { es: "Cada libro deja algo la primera vez: los de oficio un punto de atributo (o de habilidad), los de caza +10 % de daño contra lobos, muertos o arañas, los de saber experiencia, y la saga de Sigrun Mano de Hierro (cuatro tomos) un punto de habilidad y dos fragmentos al terminarla. Leer los quince da un punto de atributo y un fragmento.", en: "Each book gives something the first time: craft books an attribute point (or a skill point), hunting books +10% damage against wolves, the dead or spiders, lore books experience, and the saga of Sigrun Iron-Hand (four volumes) a skill point and two fragments once finished. Reading all fifteen gives an attribute point and a fragment." },
      { es: "Seis libros los llevan encima los líderes de los grupos (40 %, un semijefe siempre): quedan tirados brillando donde cayó y se juntan con E. Los leídos se releen desde la Bolsa (casilla Libros) y el diario los lista.", en: "Six books are carried by group leaders (40%, a mini-boss always): they lie glowing where it fell and are picked up with E. Read books can be reread from the Bag (Books slot) and the journal lists them." },
    ],
    botones: [
      { es: "Llevarme al atril de la crónica", en: "Take me to the chronicle lectern", fn: (A) => {
        const a = LIBROS.atriles[0];
        ir(A, [a.x, a.y], 0, 90);
      } },
      { es: "Tirar a mis pies el próximo libro de un líder", en: "Drop the next leader's book at my feet", fn: (A) => {
        LIBROS.soltar({ x: A.jug.x + 70, y: A.jug.y - 10, tipo: "lobo", d: {}, lider: { nombre: "—" } });
      } },
      { es: "Darme los tomos I a III de la saga", en: "Give me volumes I to III of the saga", fn: () => {
        ["sigrun1", "sigrun2", "sigrun3"].forEach((k) => LIBROS.aprender(k));
      } },
      { es: "Mostrar todos los atriles en el mapa", en: "Show every lectern on the map", fn: () => {
        LIBROS.atriles.forEach((a, i) => (LIBROS.estado().vistos[i] = 1));
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
