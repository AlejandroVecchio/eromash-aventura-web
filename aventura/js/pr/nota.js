// ---------- la nota de la PR (solo para revisar: no es parte del juego) ----------
// Cada PR de los sistemas de rol reemplaza este archivo con lo que hay que mirar en ella y botones para probarlo
// (ir a un lugar, darse experiencia, objetos, el estado justo). Se ve solo en la máquina de quien revisa
// (localhost, 127.0.0.1 o archivo) o con ?pr=1; ?pr=0 la esconde. La última PR de la tanda borra la carpeta js/pr.
(function () {
  "use strict";
  const NOTA = {
    pr: 17,
    titulo: { es: "Árbol de habilidades: Oso, Lobo y Cuervo", en: "Skill tree: Bear, Wolf and Raven" },
    // las PRs anteriores que esta usa y para qué (vacío: no depende de ninguna)
    usa: [
      { pr: 1, es: "niveles: cada nivel desde el 2 da un punto de habilidad, y los nodos suman a las estadísticas de RPG", en: "levels: each level from 2 gives a skill point, and nodes add to RPG stats" },
      { pr: 2, es: "atributos: la pestaña nueva queda al lado de Atributos y usa el mismo rombo dorado de puntos", en: "attributes: the new tab sits next to Attributes and uses the same gold points diamond" },
    ],
    mirar: [
      { es: "Mochila → Habilidades (o H directo): tres ramas con su bestia. El Oso aguanta y pega fuerte, el Lobo es rápido y crítico, el Cuervo va con runas, botín y experiencia.", en: "Backpack → Skills (or H directly): three branches, each with its beast. The Bear endures and hits hard, the Wolf is quick and critical, the Raven is about runes, loot and experience." },
      { es: "Las filas de abajo piden 3, 6 y 10 puntos puestos en esa rama, y algunos nodos piden a su padre (la línea se pinta al aprenderlo). El detalle dice lo que da ahora y lo que da el rango siguiente.", en: "Lower rows need 3, 6 and 10 points spent in that branch, and some nodes need their parent (the line lights up once learned). The detail shows what it gives now and at the next rank." },
      { es: "El último nodo de cada rama cambia la pelea. Corazón de Björn te deja en pie una vez cada 2 min. Acecho pone la sorpresa en ×2,2 y da velocidad tras cada muerte. Hugin y Munin devuelve energía rúnica y vida al vencer.", en: "The last node of each branch changes combat. Heart of Björn keeps you standing once every 2 min. Stalking makes surprise ×2.2 and grants speed after each kill. Huginn and Muninn restores rune energy and life on kills." },
      { es: "«Olvidar todo» devuelve los puntos: la primera vez es gratis, después cuesta plata y se toca dos veces.", en: "«Forget everything» returns your points: the first time is free, then it costs silver and needs two presses." },
    ],
    botones: [
      { es: "Nivel 16 y abrir Habilidades", en: "Level 16 and open Skills", fn: (A) => {
        if (RPG.nivel() < 16) RPG.estado().nivel = 16;
        RPG.recalcular();
        INVENTARIO.abrir("talentos");
      } },
      { es: "Oso completo (con Corazón de Björn)", en: "Full Bear (with Heart of Björn)", fn: (A) => {
        if (RPG.nivel() < 15) RPG.estado().nivel = 15;
        Object.assign(ARBOL.estado().r, { piel: 3, zarpa: 3, corpulencia: 3, zarpazo: 2, aguante: 2, corazon: 1 });
        RPG.recalcular();
        INVENTARIO.abrir("talentos");
      } },
      { es: "Lobo y Cuervo con sus nodos clave", en: "Wolf and Raven with their key nodes", fn: (A) => {
        if (RPG.nivel() < 25) RPG.estado().nivel = 25;
        Object.assign(ARBOL.estado().r, { patas: 3, colmillo: 3, jauria: 2, mordida: 2, sangre: 1, acecho: 1, ojo: 2, voz: 3, memoria: 2, pozo: 2, presagio: 1, dos: 1 });
        RPG.recalcular();
        INVENTARIO.abrir("talentos");
      } },
      { es: "Ir a pelear (draugr, con la vida baja)", en: "Go fight (draugr, with low life)", fn: (A) => {
        ir(A, cercaDeGrupo(A, (g) => (g.fam === "draugr" ? 1e6 : 0) - Math.hypot(g.centro[0] - A.jug.x, g.centro[1] - A.jug.y)), 0, 400);
        A.jug.hp = Math.round(A.jug.hpMax * 0.3);
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
