// ---------- la nota de la PR (solo para revisar: no es parte del juego) ----------
// Cada PR de los sistemas de rol reemplaza este archivo con lo que hay que mirar en ella y botones para probarlo
// (ir a un lugar, darse experiencia, objetos, el estado justo). Se ve solo en la máquina de quien revisa
// (localhost, 127.0.0.1 o archivo) o con ?pr=1; ?pr=0 la esconde. La última PR de la tanda borra la carpeta js/pr.
(function () {
  "use strict";
  const NOTA = {
    pr: 23,
    titulo: { es: "Descansar y pasar la noche", en: "Resting and passing the night" },
    // las PRs anteriores que esta usa y para qué (vacío: no depende de ninguna)
    usa: [
      { pr: 22, es: "cocina: «Descansar junto al fuego» va en el menú de la fogata", en: "cooking: «Rest by the fire» goes in the campfire menu" },
      { pr: 20, es: "frasco: dormir lo llena", en: "flask: sleeping refills it" },
      { pr: 21, es: "alquimia: dormir limpia las toxinas y las hierbas vuelven a crecer", en: "alchemy: sleeping clears toxins and herbs grow back" },
      { pr: 1, es: "niveles: «Bien descansado» suma experiencia", en: "levels: «Well rested» adds experience" },
    ],
    mirar: [
      { es: "Junto a los fogones del Puesto, del Refugio, del Aserradero y del paso hay un petate de pieles con un trapo rojo: «Dormir en el petate». En cualquier fogata encendida, el menú de cocinar suma «Descansar junto al fuego».", en: "Next to the hearths of the Outpost, the Refuge, the Sawmill and the pass there's a fur bedroll with a red rag: «Sleep on the bedroll». At any lit campfire, the cooking menu adds «Rest by the fire»." },
      { es: "Se elige hasta cuándo (alba, mediodía, atardecer, noche o una hora). El tiempo corre rápido: el cielo cambia detrás y el reloj gira. E, ✕ o un toque despiertan antes.", en: "You choose until when (dawn, noon, dusk, night or one hour). Time runs fast: the sky changes behind and the clock turns. E, ✕ or a tap wake you early." },
      { es: "Al despertar: vida, estamina y frasco llenos; con 4 h o más se van las toxinas y los grupos de criaturas muertos lejos vuelven (sale cuántos).", en: "On waking: full life, stamina and flask; with 4 h or more toxins clear and dead creature packs far away come back (it tells you how many)." },
      { es: "Con 6 h o más quedás «Bien descansado» (tira sobre el retrato): +15 % de experiencia en un refugio, +10 % afuera, por 10 minutos. Cada noche entera trae un sueño (son seis, en orden).", en: "With 6 h or more you're «Well rested» (strip above the portrait): +15 % experience in a refuge, +10 % outside, for 10 minutes. Each full night brings a dream (there are six, in order)." },
      { es: "Afuera, de noche, a veces te despiertan unos aullidos: tres lobos y nada de descanso entero. Con enemigos cerca no se puede descansar.", en: "Outside, at night, howls sometimes wake you: three wolves and no full rest. With enemies nearby you can't rest." },
    ],
    botones: [
      { es: "Ir al petate del Puesto (seguro) a las 21 h", en: "Go to the Outpost bedroll (safe) at 9 pm", fn: (A) => {
        const p = DESCANSO.petates().find((q) => q.id === "fogon");
        ir(A, [p.cosa.x + 60, p.cosa.y + 40]);
        A.H.E.tiempo = Math.ceil(A.H.E.tiempo / LUZ.DIA) * LUZ.DIA + (12 / 24) * LUZ.DIA;
      } },
      { es: "Ir a la fogata del paso (afuera) a las 21 h", en: "Go to the pass campfire (outside) at 9 pm", fn: (A) => {
        const p = DESCANSO.petates().find((q) => q.id === "fogon_paso") || DESCANSO.petates()[0];
        ir(A, [p.cosa.x + 60, p.cosa.y + 40]);
        A.H.E.tiempo = Math.ceil(A.H.E.tiempo / LUZ.DIA) * LUZ.DIA + (12 / 24) * LUZ.DIA;
      } },
      { es: "Vaciar el bosque (matar los grupos lejanos) para verlo volver", en: "Empty the forest (kill the far packs) to watch it come back", fn: (A) => {
        let n = 0;
        HORDAS.grupos.forEach((g) => {
          if (g.unico || Math.hypot(g.centro[0] - A.jug.x, g.centro[1] - A.jug.y) < 1600) return;
          g.miembros.forEach((e) => (e.muerto = 1));
          g.muerto = A.H.E.tiempo;
          n++;
        });
        HUD.aviso(n + " ✝", "#C8402D");
      } },
      { es: "Envenenarse (toxicidad 80) y vaciar el frasco", en: "Poison yourself (toxicity 80) and empty the flask", fn: () => {
        ALQUIMIA.estado().tox = 80;
        FRASCO.estado().cargas = 0;
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
