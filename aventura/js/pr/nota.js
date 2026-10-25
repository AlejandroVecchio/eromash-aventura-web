// ---------- la nota de la PR (solo para revisar: no es parte del juego) ----------
// Cada PR de los sistemas de rol reemplaza este archivo con lo que hay que mirar en ella y botones para probarlo
// (ir a un lugar, darse experiencia, objetos, el estado justo). Se ve solo en la máquina de quien revisa
// (localhost, 127.0.0.1 o archivo) o con ?pr=1; ?pr=0 la esconde. La última PR de la tanda borra la carpeta js/pr.
(function () {
  "use strict";
  const NOTA = {
    pr: 44,
    titulo: { es: "Los remates", en: "Finishers" },
    // las PRs anteriores que esta usa y para qué (vacío: no depende de ninguna)
    usa: [
      { pr: 4, es: "tipos de arma: cada arma (y la PR 5 a 9) tiene su remate", en: "weapon types: each weapon (and PRs 5 to 9) has its finisher" },
      { pr: 18, es: "furia: cada remate da furia", en: "fury: each finisher gives fury" },
      { pr: 1, es: "niveles: un 25 % más de experiencia", en: "levels: 25% more experience" },
    ],
    mirar: [
      { es: "Una criatura malherida (menos del 22 %; las pesadas y los líderes, del 12 %) o aturdida con el doble de margen lleva un rombo rojo sobre la cabeza. Acercate y con E Eromash salta junto a ella, carga y la remata: cámara lenta, pausa, temblor y el trazo de su arma. Mientras dura nada lo toca.", en: "A badly wounded creature (under 22%; heavy ones and leaders, under 12%) or a stunned one with double that margin wears a red rhombus over its head. Get close and press E: Eromash leaps to it, winds up and finishes it: slow motion, a pause, a shake and the trail of his weapon. Nothing hits him while it lasts." },
      { es: "Cada arma tiene el suyo: tajo cruzado (espada), hachazo al cuello (hacha), partir en dos (mandoble), aplastar (martillo), empalar (lanza), a quemarropa (arco), estallido rúnico (bastón) y puño de hierro (sin arma). Deja vida, estamina, energía rúnica, furia y más experiencia, y las criaturas de cerca se asustan un instante.", en: "Each weapon has its own: cross cut (sword), neck chop (axe), cleave in two (greatsword), crush (hammer), impale (spear), point blank (bow), rune burst (staff) and iron fist (no weapon). It gives health, stamina, rune energy, fury and extra experience, and nearby creatures flinch for a moment." },
      { es: "Verdugo: a los 10, 50 y 150 remates, +5, +10 y +15 % de daño contra las criaturas malheridas. Los jefes de las zonas, el jötunn y el custodio no se rematan; los únicos con nombre, solo con menos del 6 %. El diario cuenta los remates y tu favorito.", en: "Executioner: at 10, 50 and 150 finishers, +5, +10 and +15% damage against badly wounded creatures. Zone bosses, the jötunn and the guardian can't be finished; named uniques only under 6%. The journal counts your finishers and your favorite." },
    ],
    botones: [
      { es: "Traer tres criaturas, una ya malherida", en: "Bring three creatures, one already badly wounded", fn: (A) => {
        [[110, 0, "draugr", 0.12], [-80, -140, "lobo", 0.6], [160, 120, "lobo", 0.6]].forEach(([dx, dy, tipo, v]) => {
          const e = A.CB.crear(tipo, A.jug.x + dx, A.jug.y + dy, {});
          e.activo = true;
          e.estado = "persigue";
          e.vida = e.d.vida * v;
          A.enemigos.push(e);
        });
      } },
      { es: "Dejar malheridas a las de cerca", en: "Badly wound everything nearby", fn: (A) => {
        A.enemigos.forEach((e) => e.activo && !e.muerto && Math.hypot(e.x - A.jug.x, e.y - A.jug.y) < 900 && (e.vida = Math.min(e.vida, e.d.vida * 0.1)));
      } },
      { es: "Darme hacha, mandoble, martillo, lanza, arco y bastón", en: "Give me axe, greatsword, hammer, spear, bow and staff", fn: () => {
        ["hachaMano", "mandoble", "mazo", "lanzaHoja", "arcoCorto", "varaFresno"].forEach((b) => BOTIN.dar(OBJETOS.generar({ base: b, n: 3, r: 1 }), { silencio: true }));
      } },
      { es: "Ser verdugo (10 remates)", en: "Become an executioner (10 finishers)", fn: () => (REMATES.estado().n = Math.max(REMATES.estado().n, 10)) },
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
