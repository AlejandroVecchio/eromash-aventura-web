// ---------- la nota de la PR (solo para revisar: no es parte del juego) ----------
// Cada PR de los sistemas de rol reemplaza este archivo con lo que hay que mirar en ella y botones para probarlo
// (ir a un lugar, darse experiencia, objetos, el estado justo). Se ve solo en la máquina de quien revisa
// (localhost, 127.0.0.1 o archivo) o con ?pr=1; ?pr=0 la esconde. La última PR de la tanda borra la carpeta js/pr.
(function () {
  "use strict";
  const NOTA = {
    pr: 34,
    titulo: { es: "Encuentros en el camino", en: "Encounters on the road" },
    // las PRs anteriores que esta usa y para qué (vacío: no depende de ninguna)
    usa: [
      { pr: 1, es: "niveles: la experiencia que dan y la inspiración de la escalda", en: "levels: the experience they give and the skald's inspiration" },
      { pr: 3, es: "botín: la pieza envuelta del buhonero y la paga de Toki", en: "loot: the pedlar's wrapped piece and Toki's reward" },
      { pr: 20, es: "frasco: Ragna pide una carga", en: "flask: Ragna asks for a charge" },
      { pr: 30, es: "santuarios: el peregrino señala un hörgr", en: "shrines: the pilgrim points to a hörgr" },
      { pr: 32, es: "cerraduras: Ragna marca un cofre con candado", en: "locks: Ragna marks a locked chest" },
    ],
    mirar: [
      { es: "Andá por los caminos lejos de los pueblos y sin pelear: cada tanto aparece alguien más adelante, al costado del camino, con un «!» dorado. Hay cinco, cada uno con su dibujo propio.", en: "Walk the roads away from towns and out of fights: every so often someone appears ahead, by the roadside, with a golden «!». There are five, each with their own drawing." },
      { es: "Brandr vende una pieza envuelta (poco común o mejor) por 45 de plata. Ragna, herida, pide un trago del frasco y a cambio paga y te marca un cofre con candado. Hallvard te señala el hörgr más cercano que no encontraste.", en: "Brandr sells a wrapped piece (uncommon or better) for 45 silver. Ragna, wounded, asks for a sip from the flask and in return pays and marks a locked chest. Hallvard points to the nearest hörgr you haven't found." },
      { es: "Sigrun canta tu saga: Inspirado 4 minutos (+10 % de daño y experiencia, en el HUD). Toki grita cuando te acercás: tres lobos rodean su carro; vencelos y te paga con plata y una pieza.", en: "Sigrun sings your saga: Inspired for 4 minutes (+10% damage and experience, on the HUD). Toki shouts as you approach: three wolves surround his cart; beat them and he pays silver and an item." },
    ],
    botones: ((camino) => [
      { es: "Brandr el buhonero (y 100 de plata)", en: "Brandr the pedlar (and 100 silver)", fn: (A) => (PODERES.darPlata(100), camino(A, "buhonero")) },
      { es: "Ragna, herida", en: "Ragna, wounded", fn: (A) => camino(A, "herida") },
      { es: "Hallvard el peregrino", en: "Hallvard the pilgrim", fn: (A) => camino(A, "peregrino") },
      { es: "Sigrun la escalda", en: "Sigrun the skald", fn: (A) => camino(A, "escalda") },
      { es: "Toki y los lobos", en: "Toki and the wolves", fn: (A) => camino(A, "carrero") },
    ])((A, tipo) => {
      // el punto de camino más cercano que quede lejos de todo pueblo, mirando hacia adelante; el encuentro aparece al llegar
      const L = A.W.LUGARES,
        lejos = (x, y) => Object.keys(L).every((k) => Math.hypot(x - L[k].p[0], y - L[k].p[1]) > L[k].r + 1500);
      let p = null,
        q = null,
        mejor = 1e9;
      A.W.CAMINOS.forEach((c) => !c.sinPiso && c.p.forEach((a, i) => {
        const b = c.p[i + 1],
          d = Math.hypot(a[0] - A.jug.x, a[1] - A.jug.y);
        if (b && d < mejor && lejos(a[0], a[1])) (mejor = d), (p = a), (q = b);
      }));
      ENCUENTROS.irse();
      ir(A, p);
      setTimeout(() => {
        const d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
        A.jug.dir = [(q[0] - p[0]) / d, (q[1] - p[1]) / d];
        ENCUENTROS.aparecer(tipo);
      }, 2600);
    }),
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
