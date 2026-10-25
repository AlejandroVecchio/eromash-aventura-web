// ---------- la nota de la PR (solo para revisar: no es parte del juego) ----------
// Cada PR de los sistemas de rol reemplaza este archivo con lo que hay que mirar en ella y botones para probarlo
// (ir a un lugar, darse experiencia, objetos, el estado justo). Se ve solo en la máquina de quien revisa
// (localhost, 127.0.0.1 o archivo) o con ?pr=1; ?pr=0 la esconde. La última PR de la tanda borra la carpeta js/pr.
(function () {
  "use strict";
  const NOTA = {
    pr: 11,
    titulo: { es: "La forja al ritmo del yunque", en: "Forging to the anvil's beat" },
    // las PRs anteriores que esta usa y para qué (vacío: no depende de ninguna)
    usa: [
      { pr: 3, es: "botín y equipo: lo forjado es una pieza más, con rareza y afijos, que va a la bolsa", en: "loot and gear: what you forge is one more piece, with rarity and affixes, into the bag" },
      { pr: 4, es: "tipos de arma: Ása forja cada tipo que exista en esta rama (espadas, hachas, a dos manos, arco, lanza, martillo, bastón) y escudos (PR 10)", en: "weapon types: Ása forges every type in this branch (swords, axes, two-handed, bow, spear, hammer, staff) and shields (PR 10)" },
      { pr: 1, es: "niveles: la pieza sale un nivel por encima del de Eromash", en: "levels: the piece comes out one level above Eromash" },
    ],
    mirar: [
      { es: "Hablá con Ása (en la herrería) o tocá su yunque: «Forjar una pieza nueva». Elegís qué y cómo: con calma (más lento, a lo sumo rara) o a fuego vivo (más rápido, con acordes; la única que da legendarias).", en: "Talk to Ása (in the smithy) or use her anvil: «Forge a new piece». Pick what and how: steady (slower, rare at most) or roaring fire (faster, chords; the only way to legendaries)." },
      { es: "Un juego de ritmo: runas que bajan por cuatro carriles hasta el yunque; se aprieta la dirección (WASD, flechas, cruceta o tocando el carril) justo cuando llegan. Música armada en el momento: tambor, bordón y una nota por carril.", en: "A rhythm game: runes fall down four lanes onto the anvil; press the direction (WASD, arrows, d-pad or tap the lane) right as they land. Music built live: drum, drone and a note per lane." },
      { es: "Tres tramos: el fuelle (notas largas que se mantienen y calientan el hierro), el martillo (golpes cada vez más seguidos) y el temple (un golpe final con atacar cuando baja la barra dorada).", en: "Three parts: the bellows (long held notes that heat the iron), the hammer (faster and faster strikes) and the quench (one final strike with attack when the golden bar arrives)." },
      { es: "La nota decide la rareza y qué tan altos salen los números; la pieza dice «Forjada por Ása · martillada al … %». Esc deja y Ása devuelve la plata.", en: "Your score decides rarity and how high the numbers roll; the piece says «Forged by Ása · hammered at …%». Esc leaves and Ása returns the silver." },
    ],
    botones: [
      { es: "Abrir la forja acá (con 2000 de plata)", en: "Open the forge here (with 2000 silver)", fn: (A) => {
        PODERES.pj().plata = Math.max(PODERES.pj().plata, 2000);
        FORJA.abrir();
      } },
      { es: "Probar una espada a fuego vivo ya", en: "Try a sword at roaring fire now", fn: (A) => FORJA.empezar(FORJA.baseDe({ tipo: "espada" }), "fuego", 0) },
      { es: "Subir a nivel 12 (bases mejores)", en: "Go to level 12 (better bases)", fn: (A) => {
        while (RPG.nivel() < 12) RPG.dar(RPG.xpPara(RPG.nivel()) - RPG.estado().xp + 1);
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
