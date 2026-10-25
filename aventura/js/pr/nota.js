// ---------- la nota de la PR (solo para revisar: no es parte del juego) ----------
// Cada PR de los sistemas de rol reemplaza este archivo con lo que hay que mirar en ella y botones para probarlo
// (ir a un lugar, darse experiencia, objetos, el estado justo). Se ve solo en la máquina de quien revisa
// (localhost, 127.0.0.1 o archivo) o con ?pr=1; ?pr=0 la esconde. La última PR de la tanda borra la carpeta js/pr.
(function () {
  "use strict";
  const NOTA = {
    pr: 24,
    titulo: { es: "Muescas, tallas y palabras rúnicas", en: "Notches, carvings and runewords" },
    // las PRs anteriores que esta usa y para qué (vacío: no depende de ninguna)
    usa: [
      { pr: 3, es: "botín: las piezas que caen pueden traer muescas y suman lo de sus tallas", en: "loot: dropped pieces can come with notches and add their carvings' bonuses" },
      { pr: 11, es: "forja: Ása suma «Abrir muescas en una pieza» a su menú", en: "forge: Ása adds «Open notches in a piece» to her menu" },
      { pr: 12, es: "materiales: abrir muescas pide hierro y una esquirla", en: "materials: opening notches costs iron and a shard" },
    ],
    mirar: [
      { es: "Algunas piezas caen con muescas (las comunes más seguido, las legendarias y los anillos nunca). El detalle dice «Muescas: ◇ · ◇».", en: "Some pieces drop with notches (common ones more often, legendaries and rings never). The detail says «Notches: ◇ · ◇»." },
      { es: "Las criaturas (más los líderes y semijefes) y los cofres sueltan tallas: huesitos con una runa, de Fehu (común) a Tiwaz (rara). Cada una suma una cosa en el arma y otra en la armadura o la joya.", en: "Creatures (leaders and lesser bosses more) and chests drop carvings: little bones with a rune, from Fehu (common) to Tiwaz (rare). Each adds one thing in a weapon and another in armour or jewellery." },
      { es: "La pestaña Tallas de la mochila: elegís la pieza, tocás una talla y queda encastrada. Vaciar devuelve las tallas por 20 de plata cada una. Con R / △ sobre una talla con tres o más se unen en la siguiente.", en: "The Carvings tab in the backpack: pick the piece, touch a carving and it's set. Emptying returns the carvings for 20 silver each. With R / △ on a carving with three or more they merge into the next." },
      { es: "Siete palabras rúnicas, como en el Diablo 2: en una pieza común con justo esas muescas, las tallas en su orden la despiertan (cartel grande, columna rúnica, nombre propio entre «» y un bono fuerte). Tiwaz + Uruz en una espada de 2 muescas es «Juramento».", en: "Seven runewords, Diablo 2-style: in a common piece with exactly those notches, the carvings in order awaken it (big banner, rune column, its own name in «» and a strong bonus). Tiwaz + Uruz in a 2-notch sword is «Oath»." },
      { es: "Ása abre muescas en una pieza que no tiene (las comunes reciben más) por plata, hierro y una esquirla.", en: "Ása opens notches in a piece that has none (common ones get more) for silver, iron and a shard." },
    ],
    botones: [
      { es: "Darme una espada común de 2 muescas con Tiwaz y Uruz (Juramento)", en: "Give me a common 2-notch sword with Tiwaz and Uruz (Oath)", fn: () => {
        const it = OBJETOS.generar({ base: "espadaAncha", r: 0, n: 6, sinMuescas: true });
        it.e = 2;
        it.g = [];
        BOTIN.dar(it);
        ENGARCES.dar("tiwaz", 1);
        ENGARCES.dar("uruz", 1);
        ENGARCES.elegir(it.u);
        INVENTARIO.abrir("tallas");
      } },
      { es: "Darme una pieza común justa para cada palabra y 6 tallas de cada una", en: "Give me a fitting common piece for each word and 6 of every carving", fn: () => {
        Object.keys(ENGARCES.PALABRAS).forEach((id) => {
          const P = ENGARCES.PALABRAS[id];
          const b = Object.keys(OBJETOS.BASES).find((k) => OBJETOS.BASES[k].slot === P.en[0]);
          const it = OBJETOS.generar({ base: b, r: 0, n: 6, sinMuescas: true });
          it.e = P.tallas.length;
          it.g = [];
          BOTIN.dar(it);
        });
        ENGARCES.ORDEN.forEach((id) => ENGARCES.dar(id, 6));
        INVENTARIO.abrir("tallas");
      } },
      { es: "Abrir el menú de Ása con plata y materiales", en: "Open Ása's menu with silver and materials", fn: () => {
        PODERES.pj().plata += 600;
        MATERIALES.dar("hierro", 6);
        MATERIALES.dar("esquirla", 3);
        BOTIN.dar(OBJETOS.generar({ base: "espadaHierro", r: 0, n: 5, sinMuescas: true }));
        FORJA.abrir();
      } },
      { es: "Ir a cazar líderes (sueltan tallas)", en: "Go hunt leaders (they drop carvings)", fn: (A) => ir(A, cercaDeGrupo(A, (g) => -Math.hypot(g.centro[0] - A.jug.x, g.centro[1] - A.jug.y)), 0, 450) },
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
