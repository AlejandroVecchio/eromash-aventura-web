// ---------- niveles, experiencia y estadísticas de Eromash (sistema RPG) ----------
// Eromash sube de nivel (1 a 30) con experiencia: criaturas vencidas, misiones, lugares descubiertos, cofres, piedras
// despertadas y campamentos liberados. Cada criatura tiene su nivel según dónde vive (el bosque se endurece lejos del
// Puesto) y su color dice qué tan peligrosa es para el nivel de Eromash, como en el WoW: gris (no da casi nada),
// verde, dorado, coral y rojo. Subir de nivel da vida y daño, llena la vida y se festeja con una columna rúnica.
//
// También es la tubería de las estadísticas: PODERES pone la base (forja de Ása, manzanas, poder rúnico) y cada
// sistema suma lo suyo con RPG.aporte(fn(s, nivel)); RPG.recalcular() junta todo y lo deja en el jugador y en J
// (jug.hpMax, jug.staMax, J.mulDano, J.critProb, J.critMult, J.velAtq, J.velMov, J.armadura, J.poderRunico, J.lampara).
// Estado en E.extra.rpg = { nivel, xp, total }. Detalle y fórmulas en docs/rpg.md.
window.RPG = (function () {
  "use strict";
  let A, J, jug, W, H;
  const t = (k, v) => I18N.t(k, v);
  const TOPE = 30;
  // experiencia para pasar del nivel n al n + 1 (100 al principio, unos 2500 a nivel 10 y 13 000 cerca del tope):
  // los primeros niveles vuelan y los últimos se ganan
  const xpPara = (n) => Math.round(70 * Math.pow(n, 1.55) + 30);
  // lo que vale cada criatura antes de su nivel
  const XP_TIPO = { lobo: 10, errante: 12, custodio: 60, draugr: 22, jabali: 18, cuervo: 7, fatuo: 15, oso: 90, dreki: 700, trol: 120 };
  // las criaturas de la historia tienen su nivel fijo (las del principio tienen que poder vencerse en nivel 1)
  const NIVEL_FIJO = { custodio: 5 };
  let st = { nivel: 1, xp: 0, total: 0 };
  const base = () => ({ nivel: 1, xp: 0, total: 0 });
  const S = {}; // las estadísticas finales, después de cada recalcular
  const aportes = []; // { f: fn(s, nivel), quien }: cada sistema suma lo suyo y dice quién es (para la hoja de Eromash)
  // ---------- los topes (la pasada de balance) ----------
  // Lo de base (forja de Ása, manzanas), el nivel, el equipo puesto y los atributos son el núcleo y no se topan. Lo que
  // suman los demás sistemas (comidas, bendiciones, trucos, títulos, lecciones, pociones, trofeos…) se junta por
  // estadística y, pasado el tope, lo que sobra vale la mitad: se puede seguir sumando, pero no se dispara.
  // Multiplicadores (×) y sumas (+); la hoja de Eromash (interfaz/hoja.js) muestra cada aporte y cuánto se comió el tope.
  const NUCLEO = { nivel: 1, botin: 1, conjuntos: 1, atributos: 1 }; // los conjuntos son del equipo puesto
  const CLAVES = ["vida", "estamina", "dano", "crit", "critMult", "velAtq", "velMov", "armadura", "runico", "regen", "regenRunica", "xp", "plata", "botin", "lampara"];
  const SUMAN = { vida: 1, estamina: 1, crit: 1, armadura: 1, lampara: 1 }; // el resto se muestra como porcentaje
  const TOPES = { dano: { x: 1.75 }, vida: { x: 1.6 }, runico: { x: 1.75 }, critMult: { x: 1.5 }, velAtq: { x: 1.4 }, velMov: { x: 1.4 }, regen: { x: 2.5 }, regenRunica: { x: 2.5 }, xp: { x: 2 }, plata: { x: 2 }, botin: { x: 2 }, estamina: { mas: 80 }, crit: { mas: 0.25 }, armadura: { mas: 120 } };
  const CRIT_MAX = 0.6;
  let D = {}; // el desglose: clave → { base, partes: [{ quien, dif, k }], bono, recorte, final }
  const alSubirFns = []; // fn(nivel) → [líneas de texto] para el cartel de nivel

  // ---------- el nivel de cada criatura ----------
  // por la distancia al Puesto (un nivel cada 800 unidades) más lo que el grupo tiene de más duro que su distancia
  function nivelDe(e) {
    if (e.nivel) return e.nivel;
    let n;
    if (NIVEL_FIJO[e.tipo] && !e.hordaGrupo) n = NIVEL_FIJO[e.tipo];
    else if (!e.hordaGrupo && (e.tipo === "lobo" || e.tipo === "errante")) n = e.tipo === "lobo" ? 2 : 3;
    else {
      const p = W.LUGARES.puesto.p,
        g = e.hordaGrupo,
        c = g ? g.centro : e.casa,
        d = Math.hypot(c[0] - p[0], c[1] - p[1]);
      n = 1 + d / 800 + (g ? ((g.mas || 1) - 1 - d / 14000) * 8 : 0);
      if (g && g.fam === "cuervos") n -= 1;
      if (g && g.fam === "trol") n += 2;
      n = Math.max(2, Math.round(n));
    }
    if (e.lider) n += e.lider.unico ? 3 : 1;
    if (e.semi || e.patron) n += 2;
    return Math.min(TOPE + 5, n);
  }
  // la primera vez que se ve una criatura se le pone su nivel y se la endurece según él
  function nivelar(e) {
    if (e.nivel) return;
    const n = nivelDe(e);
    e.nivel = n;
    const kv = 1 + 0.08 * (n - 1),
      kd = 1 + 0.045 * (n - 1);
    const llena = e.vida >= e.d.vida;
    e.d.vida = Math.round(e.d.vida * kv);
    e.d.dano = Math.round(e.d.dano * kd);
    if (llena) e.vida = e.d.vida;
  }
  // qué tan peligrosa es para Eromash: el color del número
  function color(n) {
    const d = n - st.nivel;
    if (d >= 5) return "#C8402D";
    if (d >= 3) return "#FF8D71";
    if (d >= -2) return "#FFD98A";
    if (d >= -5) return "#7BC86C";
    return "#8A8478";
  }
  // cuánto vale: más si es de más nivel, casi nada si es muy fácil (gris)
  function xpDe(e) {
    const n = nivelDe(e),
      d = n - st.nivel;
    let x = (XP_TIPO[e.tipo] || 12) * (1 + 0.25 * (n - 1));
    if (e.lider) x *= e.lider.unico ? 10 : 4;
    if (e.semi || e.patron) x *= 6;
    return Math.max(1, Math.round(x * porDif(d)));
  }
  // según la diferencia de nivel: abajo baja un 10 % por nivel (gris, 6 abajo, da el 10 %); arriba sube un 15 % por
  // nivel hasta el doble (pelear más arriba se paga, aunque se falle más: motor/fallos.js)
  const porDif = (d) => (d <= -6 ? 0.1 : d < 0 ? Math.max(0.1, 1 + d * 0.1) : Math.min(2, 1 + d * 0.15));
  // ---------- el grupo vencido ----------
  // al caer el último de un grupo de HORDAS, un tercio más de lo que dio el grupo entero. Volver a vaciar el mismo
  // grupo el mismo día da cada vez un cuarto menos (hasta un cuarto): conviene seguir adelante y no quedarse cosechando.
  const dia = () => Math.floor((H.E.tiempo || 0) / (window.LUZ ? LUZ.DIA : 1440));
  function cosecha(g) {
    if (g.diaXp !== dia()) (g.diaXp = dia()), (g.vecesXp = 0);
    return Math.max(0.25, Math.pow(0.75, g.vecesXp || 0));
  }
  function delGrupo(e, x) {
    const g = e.hordaGrupo;
    if (!g) return x;
    x = Math.max(1, Math.round(x * cosecha(g)));
    g.xpJunta = (g.xpJunta || 0) + x;
    if (g.miembros.every((o) => o === e || o.muerto > 0)) {
      const extra = Math.round(g.xpJunta / 3);
      g.xpJunta = 0;
      g.vecesXp = (g.vecesXp || 0) + 1;
      if (extra > 0)
        J.retrasar(0.9, () => {
          HUD.aviso(t("rp.grupo_vencido", [extra]), "#73D5DB");
          dar(extra, e.x, e.y - 160);
        });
    }
    return x;
  }

  // ---------- la experiencia ----------
  // los números de experiencia que caen juntos se suman en uno solo (como la plata)
  function mostrarXp(n, x, y) {
    if (window.OPCIONES && !OPCIONES.v("numeros")) return;
    const junto = J.textos.find((o) => o.xp && o.t < 0.6);
    if (junto) {
      junto.suma += n;
      junto.n = t("rp.xp_mas", [junto.suma]);
      junto.t = Math.min(junto.t, 0.2);
      return;
    }
    J.textos.push({ x: x != null ? x : jug.x, y: (y != null ? y : jug.y) - 120, n: t("rp.xp_mas", [n]), t: 0, col: "#73D5DB", palabra: true, xp: true, suma: n });
  }
  // dar experiencia: se multiplica por lo que suman los sistemas (s.xp: la casa)
  function dar(n, x, y) {
    if (!st || !(n > 0)) return;
    n = Math.max(1, Math.round(n * (S.xp || 1)));
    if (st.nivel >= TOPE) return;
    st.xp += n;
    st.total += n;
    mostrarXp(n, x, y);
    let subio = false;
    while (st.nivel < TOPE && st.xp >= xpPara(st.nivel)) {
      st.xp -= xpPara(st.nivel);
      st.nivel++;
      subio = true;
    }
    if (st.nivel >= TOPE) st.xp = 0;
    if (subio) subir();
  }
  // subir de nivel: la columna rúnica, el cartel grande, la vida llena y lo que se ganó
  function subir() {
    recalcular();
    jug.hp = jug.hpMax;
    jug.sta = jug.staMax;
    if (A.columnaRunica) A.columnaRunica(jug.x, jug.y);
    if (window.SONIDO) {
      SONIDO.tocar("mision", { vol: 0.75, tono: 1.12, var: 0 });
      SONIDO.runa(jug.x, jug.y);
    }
    if (window.ANIMA) ANIMA.absorber({ col: "#FFD98A", col2: "#FFE7A8", forma: "chispa" });
    if (window.VIDA) VIDA.evento("nivel", jug.x, jug.y);
    const lineas = [t("rp.sube_vida", [6]), t("rp.sube_dano", [3])];
    alSubirFns.forEach((f) => (lineas.push(...(f(st.nivel) || []))));
    cartel(st.nivel, lineas);
  }
  let cartelT = 0;
  function cartel(n, lineas) {
    const el = document.getElementById("hudNivelSube");
    if (!el) return;
    el.querySelector("b").textContent = t("rp.nivel_grande", [n]);
    el.querySelector("p").textContent = lineas.join(" · ");
    el.classList.remove("oculto", "va");
    void el.offsetWidth;
    el.classList.add("va");
    clearTimeout(cartelT);
    cartelT = setTimeout(() => el.classList.add("oculto"), 4200);
  }

  // ---------- las estadísticas ----------
  function recalcular() {
    if (!jug) return;
    const b = (window.PODERES && PODERES.valores && PODERES.valores()) || { vida: 100, dano: 1, lampara: 1, runico: 1 };
    const n = st ? st.nivel : 1;
    const s = { vida: b.vida + (n - 1) * 6, estamina: 100, dano: b.dano * (1 + (n - 1) * 0.03), crit: 0.1, critMult: 1.6, velAtq: 1, velMov: 1, runico: b.runico, armadura: 0, regen: 1, regenRunica: 1, xp: 1, plata: 1, botin: 1, lampara: b.lampara };
    // cada aporte, anotado: cuánto cambió cada estadística (diferencia y proporción) y quién lo puso
    D = {};
    CLAVES.forEach((k) => (D[k] = { base: s[k], partes: [], bonoX: 1, bonoMas: 0, recorte: 0, final: s[k] }));
    // lo que da el nivel, aparte de la base (forja de Ása, manzanas, cota)
    if (n > 1) {
      D.vida.base = b.vida;
      D.vida.partes.push({ quien: "nivel", dif: (n - 1) * 6, k: s.vida / b.vida });
      D.dano.base = b.dano;
      D.dano.partes.push({ quien: "nivel", dif: s.dano - b.dano, k: 1 + (n - 1) * 0.03 });
    }
    for (const a of aportes) {
      const antes = CLAVES.map((k) => s[k]);
      a.f(s, n);
      CLAVES.forEach((k, i) => {
        const v0 = antes[i],
          v1 = s[k];
        if (v1 === v0 || !isFinite(v1)) return;
        const dk = D[k],
          dif = v1 - v0,
          kx = v0 ? v1 / v0 : 1,
          p = dk.partes.find((q) => q.quien === a.quien);
        if (p) (p.dif += dif), (p.k *= kx);
        else dk.partes.push({ quien: a.quien, dif, k: kx });
        if (!NUCLEO[a.quien]) (dk.bonoX *= kx), (dk.bonoMas += dif);
      });
    }
    // los topes: lo que pasa del tope vale la mitad
    Object.keys(TOPES).forEach((k) => {
      const T = TOPES[k],
        dk = D[k];
      if (T.x && dk.bonoX > T.x) {
        const ef = T.x + (dk.bonoX - T.x) * 0.5,
          v = s[k] * (ef / dk.bonoX);
        dk.recorte = v - s[k];
        s[k] = v;
      } else if (T.mas != null && dk.bonoMas > T.mas) {
        const sobra = (dk.bonoMas - T.mas) * 0.5;
        dk.recorte = -sobra;
        s[k] -= sobra;
      }
    });
    if (s.crit > CRIT_MAX) (D.crit.recorte += CRIT_MAX - s.crit), (s.crit = CRIT_MAX);
    CLAVES.forEach((k) => (D[k].final = s[k]));
    jug.hpMax = Math.max(1, Math.round(s.vida));
    jug.hp = Math.min(jug.hp, jug.hpMax);
    jug.staMax = Math.max(20, Math.round(s.estamina));
    jug.sta = Math.min(jug.sta, jug.staMax);
    J.mulDano = s.dano;
    J.critProb = Math.max(0, Math.min(CRIT_MAX, s.crit));
    J.critMult = s.critMult;
    J.velAtq = Math.max(0.5, Math.min(2, s.velAtq));
    J.velMov = Math.max(0.6, Math.min(1.6, s.velMov));
    J.armadura = Math.max(0, s.armadura);
    J.poderRunico = s.runico;
    J.regenRunica = s.regenRunica;
    J.regenVida = s.regen;
    J.lampara = s.lampara;
    Object.keys(S).forEach((k) => delete S[k]);
    Object.assign(S, s);
  }

  // ---------- el HUD: el nivel en el retrato y la barra de experiencia ----------
  function armarHud() {
    const r = document.querySelector("#hudJugador .retrato");
    if (r && !document.getElementById("hudNivel")) r.insertAdjacentHTML("beforeend", `<span id="hudNivel" class="nivel-rombo"><b>1</b></span>`);
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div id="hudXp" class="ui"><i></i><span></span></div>` + `<div id="hudNivelSube" class="ui oculto"><small></small><b></b><p></p></div>`,
    );
    document.querySelector("#hudNivelSube small").textContent = t("rp.subiste");
  }
  let claveHud = "";
  function pintarHud() {
    const el = document.getElementById("hudXp");
    if (!el || !st) return;
    const lleno = st.nivel >= TOPE,
      para = xpPara(st.nivel),
      clave = st.nivel + ":" + st.xp + ":" + I18N.lang;
    if (clave === claveHud) return;
    claveHud = clave;
    el.querySelector("i").style.width = (lleno ? 100 : (100 * st.xp) / para).toFixed(1) + "%";
    el.querySelector("span").textContent = lleno ? t("rp.xp_tope") : t("rp.xp_barra", [st.nivel, st.xp, para]);
    const b = document.querySelector("#hudNivel b");
    if (b) b.textContent = st.nivel;
  }

  // ---------- el número de nivel sobre las criaturas ----------
  // un rombo chico con el número a la izquierda de la barra de vida (o del nombre del líder), del color del peligro
  function rotulo(c, e, x, y) {
    if (!e.nivel) return;
    const col = color(e.nivel),
      txt = e.nivel - st.nivel >= 10 ? "?" : String(e.nivel);
    c.save();
    c.font = '800 11px "Eromash Text", system-ui, sans-serif';
    c.textAlign = "center";
    c.textBaseline = "middle";
    const r = 9;
    c.beginPath();
    c.moveTo(x, y - r);
    c.lineTo(x + r, y);
    c.lineTo(x, y + r);
    c.lineTo(x - r, y);
    c.closePath();
    c.fillStyle = "#0A0707";
    c.fill();
    c.strokeStyle = col;
    c.lineWidth = 1.5;
    c.stroke();
    c.fillStyle = col;
    c.fillText(txt, x, y + 0.5);
    c.restore();
  }

  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      H = A.H;
      armarHud();
      // misiones y lugares: lo que cuenta la historia
      H.oir((tipo, dato) => {
        if (!st || J.modo === "titulo") return;
        if (tipo === "mensaje" && dato === "mision_nueva") J.retrasar(0.8, () => dar(120 + 90 * H.E.mision));
        else if (tipo === "lugar") dar(60 + 4 * st.nivel);
      });
      // los cofres que abre PODERES y lo que festeja el bosque vivo (piedras, ritos, campamentos liberados)
      if (window.PODERES) {
        const abrir = PODERES.botinCofre;
        PODERES.botinCofre = function (x, y, nombre, b, importante) {
          abrir.apply(this, arguments);
          J.retrasar(0.6, () => dar((importante ? 60 : 25) + 3 * st.nivel, x, y));
        };
      }
      if (window.VIDA && VIDA.evento) {
        const ev = VIDA.evento;
        const VALE = { piedra: 40, rito: 90, liberada: 70 };
        VIDA.evento = function (tipo, x, y) {
          ev.apply(this, arguments);
          if (VALE[tipo]) dar(VALE[tipo] + 4 * st.nivel, x, y);
        };
      }
      recalcular();
    },
    alEmpezar(extra) {
      extra.rpg = Object.assign(base(), extra.rpg || {});
      st = extra.rpg;
      // ?nivel=N: arranca en ese nivel (para probar)
      const q = Number(new URLSearchParams(location.search).get("nivel"));
      if (q > 1 && st.total === 0) {
        st.nivel = Math.min(TOPE, Math.floor(q));
        for (let i = 1; i < st.nivel; i++) st.total += xpPara(i);
      }
      claveHud = "";
      recalcular();
      jug.hp = Math.min(jug.hpMax, Math.max(jug.hp, 1));
    },
    actualizar() {
      if (!st) return;
      // a las criaturas que están cerca se les pone su nivel (y se las endurece) antes de que peleen
      for (const e of A.enemigos) if (!e.nivel && e.activo && Math.abs(e.x - jug.x) < 3200 && Math.abs(e.y - jug.y) < 2400) nivelar(e);
    },
    alMorir(e) {
      if (!st) return;
      nivelar(e);
      const x = delGrupo(e, xpDe(e));
      J.retrasar(0.15, () => dar(x, e.x, e.y - (e.d.barra || 80)));
    },
    hud() {
      pintarHud();
    },
    diario() {
      if (!st) return "";
      return `<div class="diario-resumen"><p><b>${t("rp.nivel_titulo")}</b> ${t("rp.diario", [st.nivel, st.nivel >= TOPE ? "—" : xpPara(st.nivel) - st.xp, st.total])}</p></div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  // las filas de «Cómo está Eromash» en la mochila
  function filas() {
    if (!st) return [];
    return [
      [t("rp.st_nivel"), st.nivel + (st.nivel < TOPE ? " · " + t("rp.st_falta", [xpPara(st.nivel) - st.xp]) : "")],
      [t("rp.st_crit"), Math.round((S.crit || 0) * 100) + " % · ×" + (S.critMult || 1.6).toFixed(2)],
      [t("rp.st_armadura"), Math.round(S.armadura || 0) + " · −" + Math.round((1 - 100 / (100 + (S.armadura || 0))) * 100) + " %"],
    ];
  }
  return {
    sistema,
    dar,
    recalcular,
    nivel: () => (st ? st.nivel : 1),
    estado: () => st,
    nivelDe,
    nivelar,
    color,
    xpDe,
    porDif,
    xpPara,
    rotulo,
    filas,
    stats: () => S,
    aporte: (fn, quien) => (aportes.push({ f: fn, quien: quien || "otros" }), recalcular()),
    desglose: () => D,
    aportes: () => aportes.map((a) => a.quien),
    CLAVES,
    SUMAN,
    TOPES,
    NUCLEO,
    CRIT_MAX,
    alSubir: (fn) => alSubirFns.push(fn),
    TOPE,
  };
})();
