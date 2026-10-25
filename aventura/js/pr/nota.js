// ---------- la nota de la PR (solo para revisar: no es parte del juego) ----------
// Cada PR de los sistemas de rol reemplaza este archivo con lo que hay que mirar en ella y botones para probarlo
// (ir a un lugar, darse experiencia, objetos, el estado justo). Se ve solo en la máquina de quien revisa
// (localhost, 127.0.0.1 o archivo) o con ?pr=1; ?pr=0 la esconde. La última PR de la tanda borra la carpeta js/pr.
(function () {
  "use strict";
  const NOTA = {
    pr: 30,
    titulo: { es: "Hörgar de los dioses: bendiciones", en: "Hörgar of the gods: blessings" },
    // las PRs anteriores que esta usa y para qué (vacío: no depende de ninguna)
    usa: [
      { pr: 1, es: "niveles: las bendiciones suman a las estadísticas y encontrar un hörgr da experiencia", en: "levels: blessings add to the stats and finding a hörgr gives experience" },
    ],
    mirar: [
      { es: "Siete hörgar (altares de lajas con la estela tallada, cintas del color del dios y ofrendas) al costado de los caminos, uno por dios: Thor, Odín, Tyr, Freyja, Frigg, Njörd y Ullr. Salen en el mapa con su miniatura y su clase en la leyenda.", en: "Seven hörgar (slab altars with a carved stele, ribbons in the god's colour and offerings) by the roads, one per god: Thor, Odin, Tyr, Freyja, Frigg, Njord and Ullr. They show on the map with their icon and a legend class." },
      { es: "«Rezarle a …» abre el hörgr: pedir la bendición (gratis) u ofrendar 25 de plata para que salga una vez y media más fuerte. Dura 8 minutos, se lleva una por vez y aparece arriba de la vida con los minutos que quedan.", en: "«Pray to …» opens the hörgr: ask for the blessing (free) or offer 25 silver to make it half again as strong. It lasts 8 minutes, you carry one at a time and it shows above the life bar with the minutes left." },
      { es: "Con la bendición puesta la runa brilla dorada y sube humo; si ya bendijo hoy queda apagada (vuelve al otro día). Encontrar los siete da el favor de los Æsir: 12 minutos por bendición y +3 % de daño y vida para siempre.", en: "With the blessing on, the rune glows gold and smoke rises; if it already blessed today it stays dark (back the next day). Finding all seven grants the Æsir's favour: 12 minutes per blessing and +3 % damage and life for good." },
    ],
    botones: [
      { es: "Ir al hörgr de Thor con plata para ofrendar", en: "Go to Thor's hörgr with silver to offer", fn: (A) => {
        const h = SANTUARIOS.horgar().thor;
        ir(A, [h.x, h.y + 110]);
        PODERES.pj().plata += 200;
      } },
      { es: "Ir al hörgr más cercano que todavía no encontraste", en: "Go to the nearest hörgr you haven't found yet", fn: (A) => {
        const st = SANTUARIOS.estado(),
          h = SANTUARIOS.horgar();
        const ids = Object.keys(h).filter((id) => !st.vistos[id]).sort((a, b) => Math.hypot(h[a].x - A.jug.x, h[a].y - A.jug.y) - Math.hypot(h[b].x - A.jug.x, h[b].y - A.jug.y));
        const id = ids[0] || "odin";
        ir(A, [h[id].x, h[id].y + 110]);
      } },
      { es: "Encontrar los siete (favor de los Æsir)", en: "Find all seven (Æsir's favour)", fn: () => Object.keys(SANTUARIOS.LISTA).forEach((id) => SANTUARIOS.hallar(id)) },
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
