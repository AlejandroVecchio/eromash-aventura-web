// ---------- la nota de la PR (solo para revisar: no es parte del juego) ----------
// Cada PR de los sistemas de rol reemplaza este archivo con lo que hay que mirar en ella y botones para probarlo
// (ir a un lugar, darse experiencia, objetos, el estado justo). Se ve solo en la máquina de quien revisa
// (localhost, 127.0.0.1 o archivo) o con ?pr=1; ?pr=0 la esconde. La última PR de la tanda borra la carpeta js/pr.
(function () {
  "use strict";
  const NOTA = {
    pr: 37,
    titulo: { es: "Hrímnir, el jötunn de la escarcha (jefe)", en: "Hrímnir, the frost jötunn (boss)" },
    // las PRs anteriores que esta usa y para qué (vacío: no depende de ninguna)
    usa: [
      { pr: 1, es: "niveles: vencerlo da 1500 de experiencia", en: "levels: defeating him gives 1500 experience" },
      { pr: 3, es: "botín: deja una pieza épica o mejor", en: "loot: he drops an epic or better item" },
      { pr: 15, es: "bestiario: su página y su lugar entre los únicos", en: "bestiary: his page and his place among the uniques" },
    ],
    mirar: [
      { es: "En el norte hay un anillo de nueve menhires con la runa Isa (en el mapa, clase El jötunn). Hrímnir duerme sentado en su trono; al acercarte se levanta, ruge, la vista se abre y aparece la barra de jefe con el nombre de cada ataque.", en: "In the north there's a ring of nine standing stones with the Isa rune (on the map, The jötunn class). Hrímnir sleeps on his throne; as you approach he rises, roars, the view widens and the boss bar appears with each attack's name." },
      { es: "Rotación fija por fase: barrido, pisotón y línea de hielo; desde el 66 % suma granizo de rocas y desde el 33 % el grito de escarcha. Avisos exactos en el piso, saltar evita todo, nada saca más del 35 % y nunca repite un ataque tres veces. Al pasar de fase llama hasta tres hrímthursar.", en: "Fixed rotation per phase: sweep, stomp and ice line; from 66% he adds rock hail and from 33% the frost roar. Exact ground warnings, jumping avoids everything, nothing takes more than 35% and no attack repeats three times. On each phase change he calls up to three hrímthursar." },
      { es: "Después del pisotón y del grito queda expuesto (se agacha, runas en la cabeza): recibe un 30 % más. Si te alejás del anillo vuelve a su trono y se cura. Vencerlo paga 320 de plata, 1500 de experiencia, dos fragmentos y una pieza épica o mejor.", en: "After the stomp and the roar he's exposed (crouches, runes over his head): he takes 30% more. If you leave the ring he returns to his throne and heals. Defeating him pays 320 silver, 1500 experience, two shards and an epic or better item." },
    ],
    botones: [
      { es: "Llevarme frente al anillo", en: "Take me in front of the ring", fn: (A) => {
        const j = JOTUNN.jefe();
        ir(A, j.centro, 0, 1150);
      } },
      { es: "Llevarme y dejarlo al 40 % (fase 2)", en: "Take me there with him at 40% (phase 2)", fn: (A) => {
        const j = JOTUNN.jefe();
        ir(A, j.centro, 0, 1150);
        setTimeout(() => {
          j.e.vida = j.e.d.vida * 0.4;
          j.fase = 1;
          j.llamo = 1;
        }, 400);
      } },
      { es: "Subirme a nivel 12 para pelearlo", en: "Raise me to level 12 to fight him", fn: () => {
        while (RPG.nivel() < 12) RPG.dar(500);
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
