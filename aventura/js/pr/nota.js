// ---------- la nota de la PR (solo para revisar: no es parte del juego) ----------
// Cada PR de los sistemas de rol reemplaza este archivo con lo que hay que mirar en ella y botones para probarlo
// (ir a un lugar, darse experiencia, objetos, el estado justo). Se ve solo en la máquina de quien revisa
// (localhost, 127.0.0.1 o archivo) o con ?pr=1; ?pr=0 la esconde. La última PR de la tanda borra la carpeta js/pr.
(function () {
  "use strict";
  const NOTA = {
    pr: 7,
    titulo: { es: "Lanza", en: "Spear" },
    // las PRs anteriores que esta usa y para qué (vacío: no depende de ninguna)
    usa: [
      { pr: 4, es: "tipos de arma: la lanza es un tipo más con sus golpes; a puño limpio mientras está arrojada, como el hacha", en: "weapon types: the spear is one more type with its moves; fists while it's thrown, like the axe" },
      { pr: 3, es: "botín y equipo: las lanzas caen como cualquier pieza y se llevan con escudo", en: "loot and gear: spears drop like any piece and go with a shield" },
    ],
    mirar: [
      { es: "Estocadas rectas y largas (más alcance que cualquier arma): la lanza va hacia atrás y sale derecho. El tercer golpe barre todo delante y empuja lejos.", en: "Straight, long thrusts (more reach than any weapon): the spear pulls back and shoots out. The third hit sweeps everything ahead and knocks far." },
      { es: "Pegando con la punta (al final del alcance) hace ×1,3 y dice «¡Punta!». Conviene pelear a distancia.", en: "Hitting with the tip (at the end of the reach) deals ×1.3 and says «Tip!». Fight at a distance." },
      { es: "Manteniendo atacar se arroja: atraviesa hasta tres, aturde al primero y se clava. Un anillo rúnico cuenta 4 s y vuelve sola con una estela; o se junta pasando por encima.", en: "Hold attack to throw it: pierces up to three, stuns the first and sticks. A rune ring counts 4 s and it returns with a trail; or walk over it." },
      { es: "Corriendo, la embestida avanza lejos atravesando la fila. Se lleva con una mano: el escudo se queda.", en: "Running, the lunge travels far through the line. One-handed: the shield stays." },
    ],
    botones: [
      { es: "Darme las cinco lanzas y abrir la Bolsa", en: "Give me the five spears and open the Bag", fn: (A) => {
        ["lanzaHoja", "lanzaAlada", "lanzaRunica", "lanzaHueso", "atgeir"].forEach((b, i) => BOTIN.dar(OBJETOS.generar({ base: b, n: 18, r: i % 4 }), { silencio: true }));
        INVENTARIO.abrir("bolsa");
      } },
      { es: "Ponerme un atgeir legendario", en: "Equip a legendary atgeir", fn: (A) => {
        BOTIN.dar(OBJETOS.generar({ base: "atgeir", n: Math.max(17, RPG.nivel()), r: 3 }), { silencio: true });
        BOTIN.equipar(BOTIN.estado().bolsa.length - 1);
      } },
      { es: "Ir con un grupo a probarla", en: "Go to a group to try it", fn: (A) => {
        ir(A, cercaDeGrupo(A, (g) => -Math.hypot(g.centro[0] - A.jug.x, g.centro[1] - A.jug.y)), -300, 0);
        A.jug.sta = A.jug.staMax;
      } },
      { es: "Volver a la espada del forastero", en: "Back to the stranger's sword", fn: (A) => {
        const i = BOTIN.estado().bolsa.findIndex((it) => it.fijo === "ob.forastero");
        if (i >= 0) BOTIN.equipar(i);
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
