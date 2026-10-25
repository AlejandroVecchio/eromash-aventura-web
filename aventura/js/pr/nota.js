// ---------- la nota de la PR (solo para revisar: no es parte del juego) ----------
// Cada PR de los sistemas de rol reemplaza este archivo con lo que hay que mirar en ella y botones para probarlo
// (ir a un lugar, darse experiencia, objetos, el estado justo). Se ve solo en la máquina de quien revisa
// (localhost, 127.0.0.1 o archivo) o con ?pr=1; ?pr=0 la esconde. La última PR de la tanda borra la carpeta js/pr.
(function () {
  "use strict";
  const NOTA = {
    pr: 5,
    titulo: { es: "Armas a dos manos", en: "Two-handed weapons" },
    // las PRs anteriores que esta usa y para qué (vacío: no depende de ninguna)
    usa: [
      { pr: 4, es: "tipos de arma: los mandobles y las hachas danesas son dos tipos nuevos con sus golpes (el hacha danesa también hace sangrar)", en: "weapon types: greatswords and Dane axes are two new types with their own moves (the Dane axe also bleeds)" },
      { pr: 3, es: "botín y equipo: caen como cualquier pieza; poner una saca el escudo", en: "loot and gear: they drop like any piece; equipping one removes the shield" },
      { pr: 1, es: "niveles: las mejores salen desde cierto nivel de objeto", en: "levels: the best ones start at a given item level" },
    ],
    mirar: [
      { es: "Quieto o caminando, Eromash lleva el arma al hombro, detrás de la espalda.", en: "Idle or walking, Eromash carries the weapon on his shoulder, behind his back." },
      { es: "El combo: dos barridos anchos con envión (camina más lento mientras pega) y un golpe desde arriba que hace una onda en el piso y tambalea a lo que está cerca.", en: "The combo: two wide sweeps with wind-up (he walks slower while swinging) and an overhead slam that sends a ground wave and staggers what is close." },
      { es: "Manteniendo atacar: torbellino. Gira con el arma estirada, pega cada 0,3 s, se puede mover y gasta estamina hasta soltar.", en: "Hold attack: whirlwind. He spins with the weapon out, hits every 0.3 s, can move and drains stamina until released." },
      { es: "Saltando y atacando, el golpe al caer también hace onda. Corriendo, estocada larga.", en: "Jump and attack: the landing hit also makes a wave. Running, a long thrust." },
      { es: "Con un arma a dos manos el escudo vuelve a la bolsa y no deja ponérselo (mirá el aviso). Diez armas nuevas: cinco mandobles y cinco hachas danesas.", en: "With a two-handed weapon the shield returns to the bag and can't be equipped (see the notice). Ten new weapons: five greatswords and five Dane axes." },
    ],
    botones: [
      { es: "Darme las diez armas y abrir la Bolsa", en: "Give me the ten weapons and open the Bag", fn: (A) => {
        ["mandoble", "espadon", "espadonRunico", "mandobleHueso", "flamigera", "hachaDanesa", "hachaGuerra", "hachaRunica2", "hachaHueso2", "labrys"].forEach((b, i) =>
          BOTIN.dar(OBJETOS.generar({ base: b, n: 20, r: i % 4 }), { silencio: true }),
        );
        INVENTARIO.abrir("bolsa");
      } },
      { es: "Ponerme un mandoble", en: "Equip a greatsword", fn: (A) => {
        BOTIN.dar(OBJETOS.generar({ base: "flamigera", n: Math.max(18, RPG.nivel()), r: 2 }), { silencio: true });
        BOTIN.equipar(BOTIN.estado().bolsa.length - 1);
      } },
      { es: "Ponerme un hacha danesa", en: "Equip a Dane axe", fn: (A) => {
        BOTIN.dar(OBJETOS.generar({ base: "labrys", n: Math.max(19, RPG.nivel()), r: 3 }), { silencio: true });
        BOTIN.equipar(BOTIN.estado().bolsa.length - 1);
      } },
      { es: "Ir con un grupo a probarla (estamina llena)", en: "Go to a group to try it (full stamina)", fn: (A) => {
        ir(A, cercaDeGrupo(A, (g) => -Math.hypot(g.centro[0] - A.jug.x, g.centro[1] - A.jug.y)), -220, 160);
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
