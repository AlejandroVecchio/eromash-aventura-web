// ---------- la nota de la PR (solo para revisar: no es parte del juego) ----------
// Cada PR de los sistemas de rol reemplaza este archivo con lo que hay que mirar en ella y botones para probarlo
// (ir a un lugar, darse experiencia, objetos, el estado justo). Se ve solo en la máquina de quien revisa
// (localhost, 127.0.0.1 o archivo) o con ?pr=1; ?pr=0 la esconde. La última PR de la tanda borra la carpeta js/pr.
(function () {
  "use strict";
  const NOTA = {
    pr: 49,
    titulo: { es: "La hoja de Eromash y los topes", en: "Eromash's sheet and the caps" },
    // las PRs anteriores que esta usa y para qué (vacío: no depende de ninguna)
    usa: [
      { pr: 1, es: "niveles: la tubería de estadísticas (RPG.aporte) que ahora dice quién suma", en: "levels: the stat pipeline (RPG.aporte) that now says who adds what" },
      { pr: 48, es: "y todas las que suman a Eromash (equipo, atributos, árbol, comidas, bendiciones, el hólmr…): cada una aparece con su nombre", en: "and every PR that adds to Eromash (gear, attributes, tree, meals, blessings, the holmr…): each shows up by name" },
    ],
    mirar: [
      { es: "En la mochila hay una pestaña nueva, Hoja: cada estadística de Eromash con su runa (vida, estamina, daño, crítico, velocidades, armadura, poder rúnico, regeneración, experiencia, plata, botín y lámpara). Al elegir una, abajo dice su base, qué suma cada cosa por nombre y su tope. Más abajo está la hoja entera en una tabla.", en: "The backpack has a new tab, Sheet: every stat of Eromash with its rune (health, stamina, damage, crit, speeds, armour, rune power, regeneration, experience, silver, loot and lamp). Pick one and below it shows its base, what each thing adds by name and its cap. Further down is the whole sheet in a table." },
      { es: "La pasada de balance: el nivel, el equipo (con sus conjuntos) y los atributos cuentan enteros, pero lo que suman los demás sistemas juntos tiene tope (daño ×1,75, vida ×1,6, experiencia, plata y botín ×2, armadura +120, crítico +25 %…). Lo que pasa el tope vale la mitad, así apilar bonos sigue sirviendo pero no se dispara. El crítico nunca pasa del 60 % (antes 75 %). Una casilla topada lleva un punto naranja.", en: "The balance pass: level, gear (with its sets) and attributes count in full, but what the other systems add together is capped (damage ×1.75, health ×1.6, experience, silver and loot ×2, armour +120, crit +25%…). Anything over the cap counts half, so stacking bonuses still helps but doesn't explode. Crit never goes over 60% (was 75%). A capped slot carries an orange dot." },
    ],
    botones: [
      { es: "Abrir la Hoja", en: "Open the Sheet", fn: () => INVENTARIO.abrir("hoja") },
      { es: "Subir 10 niveles", en: "Gain 10 levels", fn: (A) => {
        let x = 0;
        for (let n = RPG.nivel(); n < Math.min(RPG.TOPE, RPG.nivel() + 10); n++) x += RPG.xpPara(n);
        RPG.dar(x, A.jug.x, A.jug.y);
      } },
      { es: "Apilar bonos (título, inspirado, casa) para ver el tope", en: "Stack bonuses (title, inspired, house) to see the cap", fn: () => {
        if (window.HOLMR) HOLMR.estado().campeon = true;
        if (window.ENCUENTROS && ENCUENTROS.estado) ENCUENTROS.estado().inspirado = 600;
        RPG.aporte((s) => window.__notaBono && (s.dano *= 1.6), "cocina");
        window.__notaBono = true;
        RPG.recalcular();
        INVENTARIO.abrir("hoja");
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
