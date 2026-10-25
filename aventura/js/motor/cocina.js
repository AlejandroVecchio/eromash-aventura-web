// ---------- la cocina en la fogata (sistema COCINA, modo "cocina") ----------
// Como el asado del Monster Hunter y las comidas del Zelda: las presas dejan carne (lobo, jabalí, oso) y en cualquier
// fogata encendida (los fogones de los pueblos y los braseros prendidos) se cocina un plato con carne y las hierbas de
// la alquimia. Cocinar es un asador que gira: la aguja corre por la barra y hay que sacarlo a tiempo (E, clic o ✕):
// crudo (rinde la mitad), bien, A PUNTO (la franja dorada: rinde más y dura más) o quemado (carbón, se pierde).
// Se come al toque y queda una comida por vez: suma a las estadísticas por unos minutos de juego.
// Estado en E.extra.cocina = { carne: { id: n }, comida: { id, queda, k } | null, platos: n }. Textos `co.`.
window.COCINA = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const CARNES = {
    lobo: { de: "lobo", prob: 0.6, n: 1, col: "#B8574A" },
    jabali: { de: "jabali", prob: 0.75, n: 1, col: "#C8786A" },
    oso: { de: "oso", prob: 1, n: 2, col: "#8A3A2E" },
  };
  // los platos: qué piden (carne y hierbas), cuánto dura la comida y qué suma
  const PLATOS = {
    asado: { pide: { lobo: 1 }, dura: 300, col: "#C8402D", s: (s, k) => (s.vida += 30 * k) },
    panceta: { pide: { jabali: 1, serbal: 1 }, dura: 300, col: "#FF8D71", s: (s, k) => (s.dano *= 1 + 0.08 * k) },
    guiso: { pide: { oso: 1, abedul: 1, musgo: 1 }, dura: 420, col: "#8A3A2E", s: (s, k) => ((s.vida += 40 * k), (s.armadura += 10 * k)) },
    brochetas: { pide: { luna: 2, lobo: 1 }, dura: 300, col: "#73D5DB", s: (s, k) => ((s.regenRunica *= 1 + 0.15 * k), (s.lampara *= 1 + 0.2 * k)) },
    caldo: { pide: { escarcha: 1, jabali: 1 }, dura: 300, col: "#C8F2F4", s: (s, k) => ((s.estamina += 25 * k), (s.velMov *= 1 + 0.04 * k)) },
  };
  // la barra del asador (0..1): dónde empieza cada franja
  const ZONAS = { bien: 0.42, punto: 0.62, punto2: 0.72, quemado: 0.86 };
  const VUELTA = 2.8, // segundos que tarda la aguja en recorrer la barra
    RADIO = 150;
  const base = () => ({ carne: {}, comida: null, platos: 0 });
  let st = base();
  let asador = null; // { plato, t, listo }
  let modoAntes = "juego";

  // ---------- lo que hace falta ----------
  const tiene = (k) => (CARNES[k] ? st.carne[k] || 0 : window.ALQUIMIA ? ALQUIMIA.estado().hierbas[k] || 0 : 0);
  const alcanza = (pide) => Object.keys(pide).every((k) => tiene(k) >= pide[k]);
  function gastar(pide) {
    Object.keys(pide).forEach((k) => {
      if (CARNES[k]) st.carne[k] -= pide[k];
      else ALQUIMIA.estado().hierbas[k] -= pide[k];
    });
  }
  const nombreIng = (k) => (CARNES[k] ? t("co.c_" + k) : t("aq.h_" + k));
  const pideTexto = (pide) =>
    Object.keys(pide)
      .map((k) => `${pide[k]} ${nombreIng(k)}${tiene(k) < pide[k] ? " ✗" : ""}`)
      .join(" · ");
  function fogataCerca() {
    let m = null,
      dm = RADIO;
    for (const o of W.COSAS) {
      if (o.id !== "fogonOlla" && o.id !== "brasero") continue;
      if (o.o.apagado || (o.id === "brasero" && !o.o.encendido)) continue;
      const d = Math.hypot(o.x - jug.x, o.y - jug.y);
      if (d < dm) (dm = d), (m = o);
    }
    return m;
  }

  // ---------- el menú de la fogata ----------
  function menuFogata() {
    const bot = Object.keys(PLATOS).map((id) => {
      const P = PLATOS[id],
        ok = alcanza(P.pide);
      return { texto: t("co.p_" + id) + (ok ? "" : " ✗"), sub: t("co.p_" + id + "_d") + " · " + pideTexto(P.pide), fn: () => (ok ? (A.cerrarMenu(), empezar(id)) : (HUD.aviso(t("co.faltan")), menuFogata())) };
    });
    // lo que suman otros sistemas al menú del fuego: botonesFogata(f) → [{ texto, sub, fn }] (el descanso)
    const f = fogataCerca();
    if (f) window.SISTEMAS.forEach((s0) => s0.botonesFogata && bot.push(...s0.botonesFogata(f)));
    bot.push({ texto: t("ui.cerrar"), fn: A.cerrarMenu });
    const ahora = st.comida ? t("co.comiste", [t("co.p_" + st.comida.id), Math.ceil(st.comida.queda / 60)]) : t("co.sin_comida");
    A.menu(`<h2>${t("co.titulo")}</h2><div class="sub">${t("co.sub")} ${ahora}</div>`, bot);
  }

  // ---------- el asador ----------
  function empezar(id) {
    if (!alcanza(PLATOS[id].pide)) return false;
    gastar(PLATOS[id].pide);
    asador = { plato: id, t: 0, listo: null, cierre: 0 };
    modoAntes = J.modo === "menu" ? "juego" : J.modo;
    J.modo = "cocina";
    armarCapa();
    if (window.SONIDO) SONIDO.tocar("fogata", { vol: 0.5 });
    return true;
  }
  const zonaDe = (k) => (k < ZONAS.bien ? "crudo" : k < ZONAS.punto ? "bien" : k < ZONAS.punto2 ? "punto" : k < ZONAS.quemado ? "bien" : "quemado");
  const RINDE = { crudo: 0.5, bien: 1, punto: 1.4, quemado: 0 };
  function sacar() {
    if (!asador || asador.listo) return;
    const k = Math.min(1, asador.t / VUELTA),
      z = zonaDe(k);
    asador.listo = z;
    asador.cierre = 1.3;
    const id = asador.plato;
    if (z === "quemado") {
      HUD.aviso(t("co.quemado"), "#5E130D");
      if (window.SONIDO) SONIDO.tocar("crujido", { vol: 0.5 });
    } else {
      comer(id, RINDE[z]);
      if (window.SONIDO) SONIDO.tocar(z === "punto" ? "mision" : "plata", { vol: 0.5 });
    }
  }
  function comer(id, k) {
    st.comida = { id, queda: PLATOS[id].dura * (k > 1 ? 1.5 : 1), k };
    st.platos++;
    if (window.RPG) RPG.recalcular();
    jug.hp = jug.hpMax;
    HUD.aviso(t(k > 1 ? "co.a_punto" : k < 1 ? "co.crudo" : "co.bien", [t("co.p_" + id)]), PLATOS[id].col);
    if (window.ANIMA) ANIMA.gesto("feliz");
  }
  function cerrar() {
    asador = null;
    J.modo = modoAntes || "juego";
    const el = document.getElementById("cocina");
    if (el) el.classList.add("oculto");
    CONTROLES.soltar && CONTROLES.soltar();
  }
  function armarCapa() {
    let el = document.getElementById("cocina");
    if (!el) {
      document.body.insertAdjacentHTML("beforeend", `<div id="cocina" class="ui panel"><h2></h2><canvas width="560" height="300"></canvas><p class="co-pie"></p></div>`);
      el = document.getElementById("cocina");
      el.addEventListener("pointerdown", (e) => (e.preventDefault(), sacar()));
    }
    el.classList.remove("oculto");
    el.querySelector("h2").textContent = t("co.p_" + asador.plato);
    el.querySelector(".co-pie").textContent = t("co.pie", [CONTROLES.glifo("interactuar")]);
  }
  // el dibujo: la fogata, el asador con la carne que se va dorando y la barra con la aguja
  function dibujar() {
    const el = document.getElementById("cocina");
    if (!el || !asador) return;
    const c = el.querySelector("canvas").getContext("2d"),
      k = Math.min(1, asador.t / VUELTA),
      T = J.t;
    c.clearRect(0, 0, 560, 300);
    const P = DIB.P;
    // las piedras y los leños
    DIB.E(c, 280, 200, 120, 26, "#2A2420");
    [[-100, 0], [-60, 10], [-20, 14], [20, 14], [60, 10], [100, 0]].forEach(([dx, dy]) => DIB.E(c, 280 + dx, 196 + dy, 20, 12, dx < 0 ? "#5A524E" : "#7A726C"));
    P(c, [200, 196, 360, 176, 366, 186, 206, 206], "#553A22");
    P(c, [200, 176, 360, 196, 354, 206, 194, 186], "#7A5634");
    // el fuego (tiembla)
    const f = (a, b) => Math.sin(T * a + b) * 6;
    P(c, [220, 190, 240, 130 + f(9, 0), 262, 170, 280, 100 + f(11, 1), 300, 170, 322, 128 + f(8, 2), 340, 190], "#C8402D");
    P(c, [240, 190, 262, 150 + f(10, 3), 280, 128 + f(12, 4), 300, 152 + f(9, 5), 320, 190], "#FF8D71");
    P(c, [262, 190, 280, 160 + f(13, 6), 298, 190], "#FFD98A");
    // los palos del asador y la carne que gira
    P(c, [130, 200, 138, 200, 160, 80, 152, 80], "#7A5634");
    P(c, [430, 200, 422, 200, 400, 80, 408, 80], "#553A22");
    c.strokeStyle = "#3A3634";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(150, 86);
    c.lineTo(410, 86);
    c.stroke();
    const gira = asador.listo ? 0 : T * 5,
      dorado = asador.listo === "quemado" ? 1.4 : k,
      mezcla = (a, b, q) => "#" + [0, 2, 4].map((i) => Math.round(parseInt(a.substr(i + 1, 2), 16) * (1 - q) + parseInt(b.substr(i + 1, 2), 16) * q).toString(16).padStart(2, "0")).join("");
    const crudo = "#C8786A",
      listo = "#9A5A2A",
      negro = "#1E1614";
    const col = dorado < 0.7 ? mezcla(crudo, listo, dorado / 0.7) : mezcla(listo, negro, Math.min(1, (dorado - 0.7) / 0.5));
    c.save();
    c.translate(280, 86);
    c.scale(1, 0.75 + Math.abs(Math.cos(gira)) * 0.25);
    DIB.E(c, 0, 0, 70, 34, col);
    DIB.E(c, 14, -10, 40, 14, mezcla(col, "#F2ECEC", 0.18));
    c.restore();
    // la barra: crudo, bien, a punto, bien, quemado
    const bx = 60,
      by = 250,
      bw = 440,
      bh = 18;
    const tramo = (a, b, color) => ((c.fillStyle = color), c.fillRect(bx + a * bw, by, (b - a) * bw, bh));
    tramo(0, ZONAS.bien, "#C8786A");
    tramo(ZONAS.bien, ZONAS.punto, "#9A5A2A");
    tramo(ZONAS.punto, ZONAS.punto2, "#FFD98A");
    tramo(ZONAS.punto2, ZONAS.quemado, "#9A5A2A");
    tramo(ZONAS.quemado, 1, "#2A1A18");
    // la aguja
    const ax = bx + k * bw;
    P(c, [ax - 8, by - 14, ax + 8, by - 14, ax, by - 2], "#F2ECEC");
    c.fillStyle = "#F2ECEC";
    c.fillRect(ax - 2, by - 2, 4, bh + 6);
    if (asador.listo) {
      c.font = '900 30px "Eromash Display", system-ui, sans-serif';
      c.textAlign = "center";
      c.fillStyle = asador.listo === "punto" ? "#FFD98A" : asador.listo === "quemado" ? "#FF8D71" : "#F2ECEC";
      c.fillText(t("co.z_" + asador.listo), 280, 40);
    }
  }
  function paso(dt) {
    if (!asador) return cerrar();
    if (!asador.listo) {
      asador.t += dt;
      if (CONTROLES.recien("interactuar") || CONTROLES.recien("atacar") || CONTROLES.recien("saltar") || CONTROLES.recien("seguir")) sacar();
      else if (asador.t >= VUELTA * 1.05) sacar(); // se queda en el fuego: se quema
    } else if ((asador.cierre -= dt) <= 0) cerrar();
    dibujar();
  }

  // ---------- íconos ----------
  function iconos() {
    Object.keys(CARNES).forEach((id) =>
      INVENTARIO.iconoDe("co_c_" + id, (c) => {
        // el trozo de carne con su hueso
        DIB.E(c, 0, 24, 22, 6, "rgba(0,0,0,0.25)");
        DIB.P(c, [14, -6, 30, -18, 34, -12, 22, 2], "#E8E4DC");
        DIB.E(c, 32, -16, 5, 5, "#F2ECEC");
        DIB.E(c, -4, 6, 24, 17, CARNES[id].col);
        DIB.E(c, -8, 2, 14, 8, "rgba(242,236,236,0.22)");
      }),
    );
    Object.keys(PLATOS).forEach((id) =>
      INVENTARIO.iconoDe("co_p_" + id, (c) => {
        DIB.E(c, 0, 14, 28, 10, "#5E4430");
        DIB.E(c, 0, 10, 24, 8, "#7A5634");
        DIB.E(c, 0, 4, 16, 10, PLATOS[id].col);
      }),
    );
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      J.modos = J.modos || {};
      J.modos.cocina = paso;
      iconos();
      if (window.RPG) RPG.aporte((s) => st.comida && PLATOS[st.comida.id] && PLATOS[st.comida.id].s(s, st.comida.k));
    },
    alEmpezar(extra) {
      extra.cocina = Object.assign(base(), extra.cocina || {});
      st = extra.cocina;
      if (asador) cerrar();
      if (window.RPG) RPG.recalcular();
    },
    actualizar(dt) {
      if (!st.comida) return;
      if ((st.comida.queda -= dt) <= 0) {
        HUD.aviso(t("co.se_paso", [t("co.p_" + st.comida.id)]));
        st.comida = null;
        if (window.RPG) RPG.recalcular();
      }
    },
    alMorir(e) {
      if (!e || !e.tipo) return;
      for (const id in CARNES) {
        const C = CARNES[id];
        if (C.de !== e.tipo) continue;
        // con semilla por criatura: la misma presa deja lo mismo
        const r = DIB.azar(Math.round(e.casa ? e.casa[0] * 7 + e.casa[1] : e.x) + st.platos * 13)();
        if (r > C.prob) continue;
        st.carne[id] = (st.carne[id] || 0) + C.n;
        A.textoFlotante(e.x, e.y - 90, "+" + C.n + " " + t("co.c_" + id), C.col);
      }
    },
    cercanos(dar) {
      if (J.dentro) return;
      const f = fogataCerca();
      if (f) dar(Math.hypot(f.x - jug.x, f.y - jug.y), t("co.cocinar"), menuFogata, f.x, f.y - 90);
    },
    celdasBolsa() {
      return Object.keys(CARNES)
        .filter((id) => st.carne[id] > 0)
        .map((id) => ({ id: "co_c_" + id, icono: "co_c_" + id, nombre: t("co.c_" + id), desc: t("co.c_" + id + "_d"), cant: st.carne[id] }));
    },
    efectosHud() {
      return st.comida ? [{ texto: t("co.p_" + st.comida.id), n: Math.ceil(st.comida.queda / 60) + "'", col: PLATOS[st.comida.id].col }] : [];
    },
    diario() {
      return st.platos ? `<div class="diario-resumen"><p><b>${t("co.titulo")}</b> ${t("co.diario", [st.platos])}</p></div>` : "";
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, empezar, sacar, comer, cerrar, fogataCerca, menuFogata, alcanza, asador: () => asador, CARNES, PLATOS, ZONAS, VUELTA };
})();
