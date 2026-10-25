// ---------- los dados de hueso (sistema DADOS, modo "dados") ----------
// Como los dados del Kingdom Come y el póker de dados del Witcher: en el Puesto juega Bersi el Tuerto y en Brunvik
// Hallgerd la Atrevida, cada uno parado en la punta de su mesa de dados (en el Hongo Dorado, la segunda mesa es la de Ulf). Se
// apuesta plata y gana el primero que llega a META puntos. Reglas (las del farkle de las tabernas):
//   · Se tiran seis dados. Hay que apartar al menos un dado que valga: cada 1 vale 100 y cada 5 vale 50; tres iguales
//     valen la cara × 100 (tres 1 valen 1000) y cada dado más del mismo número duplica; 1-2-3-4-5 vale 500, 2-3-4-5-6
//     vale 750 y la escalera entera 1500.
//   · Después se sigue tirando lo que queda (y si se apartaron los seis, se tiran los seis otra vez) o se planta y lo
//     del turno se suma. Si una tirada no trae nada que valga, se pierde todo lo del turno.
//   · Cada rival juega a su manera: Bersi se planta temprano, Hallgerd se arriesga y Ulf va al medio.
// Ganarle a los tres abre la mesa alta (apuestas de 100 y 200). Estado en E.extra.dados = { ganadas, perdidas,
// vencidos: { rival: 1 }, mejor, plataGanada }. Textos `dd.`.
window.DADOS = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const META = 2000,
    APUESTAS = [10, 25, 50],
    ALTAS = [100, 200],
    RADIO = 190,
    PASO_RIVAL = 0.9;
  // cómo juega cada uno: se planta con tantos puntos en el turno o con tan pocos dados para tirar
  const RIVALES = {
    bersi: { lugar: "puesto", planta: 300, dados: 2, cauto: 45 },
    hallgerd: { lugar: "brunvik", planta: 650, dados: 1, cauto: 20 },
    ulf: { lugar: null, planta: 400, dados: 2, cauto: 35 },
  };
  Object.assign(GENTE.FICHAS, {
    // Bersi el Tuerto: viejo pescador, un ojo cerrado, barba gris corta, gorro y chaleco de piel
    bersi: { nombre: "bersi", alto: 0.98, ancho: 1.1, piel: "#C8987A", pielSombra: "#A87A5E", pelo: "#8E8A86", barba: "#8E8A86", ropa: "#6E5238", ropaSombra: "#4E3A28", pantalon: "#3A3026", botas: "#2A2018", cinto: "#C8402D", gorro: "#5A4232" },
    // Hallgerd la Atrevida: pelo negro en trenza, ropa azul oscuro y un collar de plata
    hallgerd: { nombre: "hallgerd", alto: 1, ancho: 0.96, piel: "#E8D0BC", pielSombra: "#C8B09C", pelo: "#2A2420", ropa: "#3A4A6E", ropaSombra: "#2A3650", capa: "#5E130D", capaSombra: "#46100A", pantalon: "#3A3026", botas: "#2A2018", cinto: "#FFD98A", falda: true, trenza: true },
  });
  const base = () => ({ ganadas: 0, perdidas: 0, vencidos: {}, mejor: 0, plataGanada: 0 });
  let st = base();
  const mesas = []; // { rival, x, y, cosa }
  let mesa = null; // la partida: { rival, apuesta, yo, el, turno, dados, quedan, sel, turnoPts, fase, t, msg, foco, fin }
  let modoAntes = "juego";

  // ---------- los puntos ----------
  const contar = (vals) => {
    const c = [0, 0, 0, 0, 0, 0, 0];
    vals.forEach((v) => c[v]++);
    return c;
  };
  // el mejor puntaje usando TODOS los dados de c (o -1 si alguno no vale)
  function valor(c) {
    const n = c.reduce((a, b) => a + b, 0);
    if (!n) return 0;
    let mejor = -1;
    const probar = (pts, c2) => {
      const r = valor(c2);
      if (r >= 0) mejor = Math.max(mejor, pts + r);
    };
    const menos = (fs) => {
      const c2 = c.slice();
      fs.forEach((f) => c2[f]--);
      return c2;
    };
    if ([1, 2, 3, 4, 5, 6].every((f) => c[f] >= 1)) probar(1500, menos([1, 2, 3, 4, 5, 6]));
    if ([1, 2, 3, 4, 5].every((f) => c[f] >= 1)) probar(500, menos([1, 2, 3, 4, 5]));
    if ([2, 3, 4, 5, 6].every((f) => c[f] >= 1)) probar(750, menos([2, 3, 4, 5, 6]));
    for (let f = 1; f <= 6; f++)
      for (let k = 3; k <= c[f]; k++) {
        const c2 = c.slice();
        c2[f] -= k;
        probar((f === 1 ? 1000 : f * 100) * Math.pow(2, k - 3), c2);
      }
    if (c[1]) probar(100, menos([1]));
    if (c[5]) probar(50, menos([5]));
    return mejor;
  }
  const puntos = (vals) => valor(contar(vals));
  // ¿la tirada trae algo que valga?
  const algoVale = (vals) => {
    const c = contar(vals);
    return c[1] > 0 || c[5] > 0 || c.some((k, f) => f && k >= 3) || [2, 3, 4, 5].every((f) => c[f] >= 1);
  };
  // lo que aparta el rival: el subconjunto que más le conviene a su manera (puntos, menos dados gastados, o todos)
  function eleccionRival(vals, R) {
    let mejor = null;
    for (let m = 1; m < 1 << vals.length; m++) {
      const idx = [];
      for (let i = 0; i < vals.length; i++) if (m & (1 << i)) idx.push(i);
      const p = puntos(idx.map((i) => vals[i]));
      if (p <= 0) continue;
      const quedan = vals.length - idx.length,
        nota = p - idx.length * R.cauto + (quedan === 0 ? 350 : 0);
      if (!mejor || nota > mejor.nota) mejor = { idx, p, nota };
    }
    return mejor;
  }

  // ---------- la partida ----------
  const tirar = (n) => Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6));
  function abrirMesa(rival) {
    const R = RIVALES[rival];
    if (!R) return;
    const pj = PODERES.pj(),
      lista = APUESTAS.concat(Object.keys(RIVALES).every((k) => st.vencidos[k]) ? ALTAS : []);
    const botones = lista.map((a) => ({ texto: t("dd.apostar", [a]), sub: pj.plata < a ? t("dd.sin_plata") : t("dd.apostar_d", [a * 2]), fn: () => (pj.plata < a ? HUD.aviso(t("dd.sin_plata"), "#C8402D") : (A.cerrarMenu(), empezar(rival, a))) }));
    botones.push({ texto: t("dd.reglas"), sub: t("dd.reglas_d"), fn: () => A.dialogoLibre([[rival, "dd.reglas_1"], [rival, "dd.reglas_2"], [rival, "dd.reglas_3"]]) });
    botones.push({ texto: t("ui.cerrar"), fn: A.cerrarMenu });
    A.menu(`<h2>${t("av.nombre_" + rival)}</h2><div class="sub">${t("dd." + rival + "_saludo")} · ${t("dd.meta", [META])}${st.vencidos[rival] ? " · " + t("dd.ya_vencido") : ""}</div>`, botones);
  }
  function empezar(rival, apuesta) {
    const pj = PODERES.pj();
    if (pj.plata < apuesta || mesa) return false;
    pj.plata -= apuesta;
    mesa = { rival, apuesta, yo: 0, el: 0, turno: "yo", dados: [], sel: new Set(), turnoPts: 0, fase: "tirar", t: 0, msg: "", foco: 0, fin: null, tirada: 0 };
    modoAntes = J.modo === "menu" ? "juego" : J.modo;
    J.modo = "dados";
    armarCapa();
    nuevaTirada(6);
    return true;
  }
  function nuevaTirada(n) {
    mesa.dados = tirar(n);
    mesa.sel = new Set();
    mesa.fase = "rodando";
    mesa.t = 0;
    mesa.tirada++;
    if (window.SONIDO) SONIDO.tocar("crujido", { vol: 0.35, tono: 2 });
  }
  // terminan de rodar: si no vale nada, se pierde el turno
  function asentar() {
    if (!algoVale(mesa.dados)) {
      mesa.fase = "nada";
      mesa.t = 0;
      mesa.msg = t("dd.nada", [mesa.turnoPts]);
      mesa.turnoPts = 0;
      if (window.SONIDO) SONIDO.tocar("caida", { vol: 0.4, tono: 0.7 });
      return;
    }
    mesa.fase = mesa.turno === "yo" ? "elegir" : "piensa";
    mesa.t = 0;
    mesa.msg = "";
  }
  const valorSel = () => (mesa.sel.size ? puntos([...mesa.sel].map((i) => mesa.dados[i])) : 0);
  function elegir(i) {
    if (!mesa || mesa.turno !== "yo" || mesa.fase !== "elegir" || i < 0 || i >= mesa.dados.length) return;
    if (mesa.sel.has(i)) mesa.sel.delete(i);
    else mesa.sel.add(i);
    if (window.SONIDO) SONIDO.tocar("clic", { vol: 0.3, tono: 1.4 });
  }
  // apartar lo elegido y seguir tirando (true) o plantarse (false)
  function seguir(plantarse) {
    if (!mesa || mesa.fase !== (mesa.turno === "yo" ? "elegir" : "piensa")) return false;
    const v = valorSel();
    if (v <= 0) return mesa.turno === "yo" && (mesa.msg = t("dd.elegi_bien")), false;
    mesa.turnoPts += v;
    const quedan = mesa.dados.length - mesa.sel.size;
    if (plantarse) {
      if (mesa.turno === "yo") mesa.yo += mesa.turnoPts;
      else mesa.el += mesa.turnoPts;
      if (mesa.turno === "yo") st.mejor = Math.max(st.mejor, mesa.turnoPts);
      mesa.msg = t("dd.planta", [mesa.turno === "yo" ? t("dd.vos") : t("av.nombre_" + mesa.rival), mesa.turnoPts]);
      mesa.turnoPts = 0;
      if (mesa.yo >= META || mesa.el >= META) return terminar(mesa.yo >= META), true;
      mesa.fase = "pasa";
      mesa.t = 0;
      if (window.SONIDO) SONIDO.tocar("plata", { vol: 0.35 });
      return true;
    }
    // si apartó los seis, se tiran los seis otra vez
    if (quedan === 0) mesa.msg = t("dd.todos");
    nuevaTirada(quedan || 6);
    return true;
  }
  function pasarTurno() {
    mesa.turno = mesa.turno === "yo" ? "el" : "yo";
    mesa.turnoPts = 0;
    nuevaTirada(6);
  }
  function terminar(gane) {
    mesa.fase = "fin";
    mesa.fin = gane ? "gane" : "perdi";
    mesa.t = 0;
    const R = mesa.rival;
    if (gane) {
      st.ganadas++;
      st.plataGanada += mesa.apuesta;
      PODERES.pj().plata += mesa.apuesta * 2;
      const primera = !st.vencidos[R];
      st.vencidos[R] = 1;
      mesa.msg = t("dd.ganaste", [mesa.apuesta * 2]);
      if (window.RPG && primera) RPG.dar(120, jug.x, jug.y);
      if (window.SONIDO) SONIDO.tocar("mision", { vol: 0.5 });
      if (primera && Object.keys(RIVALES).every((k) => st.vencidos[k])) J.retrasar(1.5, () => HUD.aviso(t("dd.mesa_alta_d"), "lugar", t("dd.mesa_alta")));
    } else {
      st.perdidas++;
      mesa.msg = t("dd.perdiste", [mesa.apuesta]);
      if (window.SONIDO) SONIDO.tocar("caida", { vol: 0.4, tono: 0.6 });
    }
  }
  function levantarse() {
    if (!mesa) return;
    if (!mesa.fin) {
      st.perdidas++;
      HUD.aviso(t("dd.te_levantas", [mesa.apuesta]), "#8A8478");
    } else HUD.aviso(mesa.msg, mesa.fin === "gane" ? "#FFD98A" : "#8A8478");
    if (window.HUD && HUD.plata) HUD.plata();
    cerrar();
  }
  function cerrar() {
    mesa = null;
    J.modo = modoAntes || "juego";
    const el = document.getElementById("dados");
    if (el) el.classList.add("oculto");
    CONTROLES.soltar && CONTROLES.soltar();
  }
  // el turno del rival, de a pasos para que se vea
  function pasoRival() {
    const R = RIVALES[mesa.rival];
    if (mesa.fase === "piensa" && mesa.t >= PASO_RIVAL) {
      const e = eleccionRival(mesa.dados, R);
      mesa.sel = new Set(e.idx);
      mesa.fase = "aparta";
      mesa.t = 0;
    } else if (mesa.fase === "aparta" && mesa.t >= PASO_RIVAL * 0.8) {
      mesa.fase = "piensa"; // seguir() lo pide
      const total = mesa.turnoPts + valorSel(),
        quedan = mesa.dados.length - mesa.sel.size;
      const gana = mesa.el + total >= META,
        apurado = mesa.yo >= META * 0.8 && mesa.el + total < mesa.yo;
      const planta = gana || (!apurado && quedan !== 0 && (total >= R.planta || quedan <= R.dados));
      seguir(planta);
    }
  }

  // ---------- la capa del juego ----------
  function armarCapa() {
    let el = document.getElementById("dados");
    if (!el) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `<div id="dados" class="ui panel"><h2></h2><p class="dd-marcador"></p><canvas width="600" height="250"></canvas><p class="dd-msg"></p><div class="dd-botones"><button type="button" data-a="tirar"></button><button type="button" data-a="plantarse"></button><button type="button" data-a="levantarse"></button></div><p class="dd-pie"></p></div>`,
      );
      el = document.getElementById("dados");
      const cv = el.querySelector("canvas");
      cv.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        const r = cv.getBoundingClientRect(),
          x = ((e.clientX - r.left) / r.width) * 600,
          y = ((e.clientY - r.top) / r.height) * 250;
        const i = dadoEn(x, y);
        if (i >= 0) elegir(i);
      });
      el.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => accion(b.dataset.a)));
    }
    el.classList.remove("oculto");
    el.querySelector("h2").textContent = t("dd.titulo", [t("av.nombre_" + mesa.rival)]);
  }
  function accion(a) {
    if (!mesa) return;
    if (a === "levantarse") return levantarse();
    if (mesa.fin) return levantarse();
    if (a === "tirar") seguir(false);
    if (a === "plantarse") seguir(true);
  }
  const POS = (i, n) => [300 + (i - (n - 1) / 2) * 84, 92];
  function dadoEn(x, y) {
    if (!mesa) return -1;
    for (let i = 0; i < mesa.dados.length; i++) {
      const [dx, dy] = POS(i, mesa.dados.length);
      if (Math.abs(x - dx) < 34 && y > dy - 36 && y < dy + 50) return i;
    }
    return -1;
  }
  function dibujar() {
    const el = document.getElementById("dados");
    if (!el || !mesa) return;
    const c = el.querySelector("canvas").getContext("2d"),
      T = J.t;
    c.clearRect(0, 0, 600, 250);
    // el tablón
    DIB.R(c, 0, 0, 600, 250, "#5A4232");
    for (let k = 0; k < 5; k++) DIB.R(c, 0, k * 50 + 48, 600, 3, "#4A3628");
    DIB.E(c, 300, 100, 270, 80, "#7A5634");
    // los dados de la tirada (ruedan un instante)
    const rueda = mesa.fase === "rodando";
    mesa.dados.forEach((v, i) => {
      const [x, y] = POS(i, mesa.dados.length),
        cara = rueda ? 1 + Math.floor((T * 20 + i * 3) % 6) : v,
        sel = mesa.sel.has(i),
        foco = mesa.turno === "yo" && mesa.fase === "elegir" && mesa.foco === i;
      DADOS_DIBUJO.dado(c, x + (rueda ? Math.sin(T * 30 + i) * 6 : 0), y - (sel ? 12 : 0), 54, cara, { giro: rueda ? Math.sin(T * 25 + i * 2) * 0.6 : 0, marca: sel ? "#FFD98A" : foco ? "#73D5DB" : null });
    });
    // lo del turno y lo que vale lo elegido
    c.font = '700 18px "Eromash Text", system-ui, sans-serif';
    c.textAlign = "center";
    c.fillStyle = "#F2ECEC";
    const quien = mesa.turno === "yo" ? t("dd.tu_turno") : t("dd.turno_de", [t("av.nombre_" + mesa.rival)]);
    c.fillText(quien + " · " + t("dd.en_juego", [mesa.turnoPts]), 300, 190);
    if (mesa.sel.size && !rueda) {
      const v = valorSel();
      c.fillStyle = v > 0 ? "#FFD98A" : "#FF8D71";
      c.fillText(v > 0 ? t("dd.vale", [v]) : t("dd.no_vale"), 300, 222);
    }
    if (mesa.fin) {
      c.font = '900 34px "Eromash Display", system-ui, sans-serif';
      c.fillStyle = mesa.fin === "gane" ? "#FFD98A" : "#FF8D71";
      c.fillText(t(mesa.fin === "gane" ? "dd.gane_t" : "dd.perdi_t"), 300, 40);
    }
    el.querySelector(".dd-marcador").innerHTML = `${t("dd.vos")} <b>${mesa.yo}</b> · ${t("av.nombre_" + mesa.rival)} <b>${mesa.el}</b> · ${t("dd.meta", [META])} · ${t("dd.apuesta", [mesa.apuesta])}`;
    el.querySelector(".dd-msg").textContent = mesa.msg;
    const [bt, bp, bl] = el.querySelectorAll("button");
    const puedo = mesa.turno === "yo" && mesa.fase === "elegir" && !mesa.fin;
    bt.textContent = t("dd.b_tirar") + " · " + CONTROLES.glifo("saltar");
    bp.textContent = t("dd.b_plantarse") + " · " + CONTROLES.glifo("lente");
    bl.textContent = (mesa.fin ? t("dd.b_salir") : t("dd.b_levantarse")) + " · " + CONTROLES.glifo("pausa");
    bt.disabled = bp.disabled = !puedo;
    el.querySelector(".dd-pie").textContent = t("dd.pie", [CONTROLES.glifo("izquierda") + CONTROLES.glifo("derecha"), CONTROLES.glifo("interactuar")]);
  }
  function paso(dt) {
    if (!mesa) return cerrar();
    mesa.t += dt;
    if (CONTROLES.recien("pausa")) return levantarse();
    switch (mesa.fase) {
      case "rodando":
        if (mesa.t >= 0.55) asentar();
        break;
      case "nada":
      case "pasa":
        if (mesa.t >= 1.4) pasarTurno();
        break;
      case "elegir":
        if (CONTROLES.recien("izquierda")) mesa.foco = (mesa.foco + mesa.dados.length - 1) % mesa.dados.length;
        if (CONTROLES.recien("derecha")) mesa.foco = (mesa.foco + 1) % mesa.dados.length;
        if (CONTROLES.recien("interactuar") || CONTROLES.recien("atacar")) elegir(Math.min(mesa.foco, mesa.dados.length - 1));
        if (CONTROLES.recien("saltar")) seguir(false);
        if (CONTROLES.recien("lente")) seguir(true);
        break;
      case "piensa":
      case "aparta":
        pasoRival();
        break;
      case "fin":
        if (mesa.t > 0.6 && (CONTROLES.recien("interactuar") || CONTROLES.recien("saltar"))) levantarse();
        break;
    }
    if (mesa) dibujar();
  }

  // ---------- las mesas ----------
  function lugarEn(L) {
    for (let r = L.r * 0.35; r < L.r * 0.95; r += 60)
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2 + r * 0.01,
          x = L.p[0] + Math.cos(a) * r,
          y = L.p[1] + Math.sin(a) * r * 0.8;
        if (W.sueloEn(x, y) !== 0 || W.CAMINOS.some((c) => W.distLinea(x, y, c.p) < c.w / 2 + 120)) continue;
        if ([[0, 0], [-130, 0], [130, 0], [0, 80], [110, 20]].every(([dx, dy]) => W.libre(x + dx, y + dy, 30))) return [x, y];
      }
    return null;
  }
  function armar() {
    Object.keys(RIVALES).forEach((k, i) => {
      const R = RIVALES[k],
        L = R.lugar && W.LUGARES[R.lugar];
      if (!L) return;
      const p = lugarEn(L);
      if (!p) return;
      const cosa = W.agregar("mesaDados", p, { v: i });
      mesas.push({ rival: k, x: p[0], y: p[1], cosa });
    });
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      J.modos = J.modos || {};
      J.modos.dados = paso;
      armar();
    },
    alEmpezar(extra) {
      extra.dados = Object.assign(base(), extra.dados || {});
      st = extra.dados;
      if (mesa) cerrar();
    },
    cercanos(dar) {
      if (J.dentro) return;
      for (const m of mesas) {
        const d = Math.hypot(m.x - jug.x, m.y - jug.y);
        if (d < RADIO) dar(d, t("dd.jugar", [t("av.nombre_" + m.rival)]), () => abrirMesa(m.rival), m.x, m.y - 130);
      }
    },
    objetos(lista, visible, c) {
      if (J.dentro) return;
      // cada rival parado en la punta de su mesa, de costado mirando los dados
      for (const m of mesas) if (visible(m.x, m.y - 30)) lista.push({ x: m.x + 132, y: m.y + 6, f: () => GENTE.dibujar(c, m.rival, m.x + 132, m.y + 6, J.t, { vista: "E", espejo: true }) });
    },
    cuerpos(f) {
      for (const m of mesas) f(m.x + 132, m.y + 6, 22);
    },
    marcasMapa() {
      return mesas.map((m) => ({ tipo: "dados", x: m.x, y: m.y, op: { nombre: t("dd.mesa_de", [t("av.nombre_" + m.rival)]) } }));
    },
    diario() {
      if (!st.ganadas && !st.perdidas) return "";
      const venc = Object.keys(RIVALES).filter((k) => st.vencidos[k]).map((k) => t("av.nombre_" + k));
      return `<div class="diario-resumen"><p><b>${t("dd.diario_t")}</b> ${t("dd.diario", [st.ganadas, st.perdidas, st.plataGanada, st.mejor])}${venc.length ? " " + t("dd.diario_vencidos", [venc.join(", ")]) : ""}</p></div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, actual: () => mesa, mesas, abrirMesa, empezar, elegir, seguir, levantarse, cerrar, puntos, algoVale, eleccionRival, terminar, META, RIVALES, APUESTAS, ALTAS };
})();
