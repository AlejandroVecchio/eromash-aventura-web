// ---------- la nota de la PR (solo para revisar: no es parte del juego) ----------
// Cada PR de los sistemas de rol reemplaza este archivo con lo que hay que mirar en ella y botones para probarlo
// (ir a un lugar, darse experiencia, objetos, el estado justo). Se ve solo en la máquina de quien revisa
// (localhost, 127.0.0.1 o archivo) o con ?pr=1; ?pr=0 la esconde. La última PR de la tanda borra la carpeta js/pr.
(function () {
  "use strict";
  const NOTA = {
    pr: 45,
    titulo: { es: "La casa de Hrolf", en: "Hrolf's house" },
    // las PRs anteriores que esta usa y para qué (vacío: no depende de ninguna)
    usa: [
      { pr: 12, es: "materiales: las mejoras piden cuero curtido, hierro de pantano y ámbar", en: "materials: upgrades ask for cured leather, bog iron and amber" },
      { pr: 22, es: "cocina: el fogón del patio es un fogón de cocinar de verdad", en: "cooking: the yard fire pit is a real cooking fire" },
      { pr: 21, es: "alquimia: la huerta da hierbas", en: "alchemy: the garden yields herbs" },
      { pr: 23, es: "descanso: la cama de pieles deja descansado el doble", en: "rest: the bearskin bed keeps you rested twice as long" },
      { pr: 42, es: "libros: la estantería cuenta los libros leídos", en: "books: the bookshelf counts the books you've read" },
      { pr: 1, es: "niveles: la estantería da +5 % de experiencia", en: "levels: the bookshelf gives +5% experience" },
    ],
    mirar: [
      { es: "Al costado del camino que sale del Puesto está la casa de Hrolf, cerrada, con un letrero de «se vende» colgado de cadenas. Con E en el letrero se compra por 500 de plata: el letrero se da vuelta y muestra la cornamenta tallada, la casa va al mapa y aparece «Tu casa» entre los destinos de Viajar.", en: "Beside the road out of the Outpost stands Hrolf's house, locked, with a for-sale sign hanging from chains. Press E on the sign to buy it for 500 silver: the sign flips to show the carved antler, the house goes on the map and «Your house» appears among the travel destinations." },
      { es: "Adentro: cama, hogar y en la mesa los planos. Cada mejora cuesta plata y materiales y aparece en el acto: el arcón (guarda 30 piezas), el armero (+4 % de daño), la estantería (+5 % de experiencia), el fogón del patio, la huerta y la cama de pieles de oso (descansado el doble).", en: "Inside: a bed, a hearth and the plans on the table. Each upgrade costs silver and materials and shows up at once: the chest (stores 30 pieces), the weapon rack (+4% damage), the bookshelf (+5% experience), the yard fire pit, the garden and the bearskin bed (rested twice as long)." },
      { es: "La huerta crece durante el día y se cosecha una vez por día con E: dos hierbas y a veces una manzana. Todo queda guardado en la partida.", en: "The garden grows during the day and is harvested once a day with E: two herbs and sometimes an apple. Everything is kept in your save." },
    ],
    botones: [
      { es: "Llevarme a la casa de Hrolf", en: "Take me to Hrolf's house", fn: (A) => {
        const c = CASA.casa();
        if (c) ir(A, [c.letrero.x, c.letrero.y + 80]);
      } },
      { es: "Darme 2000 de plata y materiales", en: "Give me 2000 silver and materials", fn: () => {
        PODERES.pj().plata += 2000;
        MATERIALES.dar("cuero", 20);
        MATERIALES.dar("hierro", 15);
        MATERIALES.dar("ambar", 4);
      } },
      { es: "Comprarla y hacerle todo", en: "Buy it and build everything", fn: () => {
        const pj = PODERES.pj();
        pj.plata += 2000;
        MATERIALES.dar("cuero", 20);
        MATERIALES.dar("hierro", 15);
        MATERIALES.dar("ambar", 4);
        CASA.comprar();
        Object.keys(CASA.MEJORAS).forEach((id) => CASA.construir(id));
      } },
      { es: "Dejar la huerta lista para cosechar", en: "Make the garden ready to harvest", fn: () => (CASA.estado().cosecha = -1) },
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
