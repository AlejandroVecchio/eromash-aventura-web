// ---------- la nota de la PR (solo para revisar: no es parte del juego) ----------
// Cada PR de los sistemas de rol reemplaza este archivo con lo que hay que mirar en ella y botones para probarlo
// (ir a un lugar, darse experiencia, objetos, el estado justo). Se ve solo en la máquina de quien revisa
// (localhost, 127.0.0.1 o archivo) o con ?pr=1; ?pr=0 la esconde. La última PR de la tanda borra la carpeta js/pr.
(function () {
  "use strict";
  const NOTA = {
    pr: 6,
    titulo: { es: "Arco", en: "Bow" },
    // las PRs anteriores que esta usa y para qué (vacío: no depende de ninguna)
    usa: [
      { pr: 4, es: "tipos de arma: el arco es un tipo más, con sus golpes que disparan en vez de cortar", en: "weapon types: the bow is one more type, whose moves shoot instead of cutting" },
      { pr: 5, es: "armas a dos manos: el arco también saca el escudo", en: "two-handed weapons: the bow also removes the shield" },
      { pr: 3, es: "botín y equipo: los arcos caen como cualquier pieza", en: "loot and gear: bows drop like any piece" },
    ],
    mirar: [
      { es: "Atacar dispara: dos flechas rápidas y la tercera es un abanico de tres. Las flechas se corren un poco solas hacia la criatura de adelante (más con mando).", en: "Attack shoots: two quick arrows and the third is a fan of three. Arrows nudge toward the creature ahead (more with a pad)." },
      { es: "Manteniendo atacar se tensa (camina más lento y aparece la línea de tiro en el piso); al soltar, el tiro tenso atraviesa a todos los que cruza.", en: "Hold attack to draw (he walks slower and an aim line appears on the ground); release for a power shot that pierces everything in its path." },
      { es: "Saltando y atacando, lluvia de cinco flechas al caer. Corriendo, dispara sin frenar.", en: "Jump and attack: a rain of five arrows on landing. Running, he shoots without stopping." },
      { es: "La que no te vio recibe ×1,5 (número naranja). Las flechas quedan clavadas en árboles, rocas y en el piso un rato.", en: "Unaware creatures take ×1.5 (orange number). Arrows stay stuck in trees, rocks and the ground for a while." },
      { es: "Cinco arcos dibujados (tejo, largo, rúnico, de asta, recurvo), con la cuerda que se tensa y la flecha encajada.", en: "Five bows drawn (yew, long, rune, antler, recurve), with a string that draws back and a nocked arrow." },
    ],
    botones: [
      { es: "Darme los cinco arcos y abrir la Bolsa", en: "Give me the five bows and open the Bag", fn: (A) => {
        ["arcoCorto", "arcoLargo", "arcoRunico", "arcoAsta", "arcoRecurvo"].forEach((b, i) => BOTIN.dar(OBJETOS.generar({ base: b, n: 18, r: i % 4 }), { silencio: true }));
        INVENTARIO.abrir("bolsa");
      } },
      { es: "Ponerme un arco legendario", en: "Equip a legendary bow", fn: (A) => {
        BOTIN.dar(OBJETOS.generar({ base: "arcoRecurvo", n: Math.max(17, RPG.nivel()), r: 3 }), { silencio: true });
        BOTIN.equipar(BOTIN.estado().bolsa.length - 1);
      } },
      { es: "Ir a un grupo que todavía no me vio", en: "Go to a group that hasn't seen me yet", fn: (A) => {
        ir(A, cercaDeGrupo(A, (g) => -Math.hypot(g.centro[0] - A.jug.x, g.centro[1] - A.jug.y)), -520, 0);
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
