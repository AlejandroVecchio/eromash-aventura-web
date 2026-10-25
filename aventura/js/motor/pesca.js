// ---------- la pesca (sistema PESCA, modo "pesca") ----------
// Como la pesca del Stardew Valley y del Zelda: a la orilla de la laguna más cercana al Puesto está el puesto de Sverri,
// con su caña clavada en el barro. Con la caña, en cualquier orilla de laguna o de río se pesca con E:
//   1. Se tira el sedal y la boya flota (de 1,5 a 4,5 s; menos al alba y al caer el sol).
//   2. ¡Pica! La boya se hunde: hay que tirar enseguida (E, clic o ✕; 0,8 s). Si no, se va.
//   3. La pelea: una barra vertical con el pez que sube y baja a su manera y una franja verde que sube mientras se
//      mantiene apretado y cae al soltar. Con el pez adentro de la franja la captura se llena; afuera se vacía.
// Cada agua y cada hora tiene sus peces (PECES): perca y lucio en las lagunas, trucha y salmón en los ríos, la anguila
// de noche en cualquier agua y el pez de escarcha en los ríos del norte. Urriði el Viejo, la trucha enorme de las
// lagunas, sale de noche cuando ya se pescaron cuatro especies distintas, y una sola vez.
// Lo que se pesca va a la cocina como pescado (dos platos nuevos en la fogata). El diario lleva el libro del pescador
// (cada especie y el más grande). Estado en E.extra.pesca = { cana, libro: { id: { n, cm } }, urridi }. Textos `pe.`.
window.PESCA = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  // agua: "lago", "rio" o "todo"; horas: tramos [desde, hasta); norte: solo en el tercio de arriba del mapa
  const PECES = {
    perca: { agua: "lago", horas: [[6, 20]], peso: 5, agil: 0.8, vel: 0.45, cm: [15, 35], xp: 30 },
    trucha: { agua: "rio", horas: [[6, 20]], peso: 5, agil: 0.9, vel: 0.5, cm: [20, 50], xp: 35 },
    salmon: { agua: "rio", horas: [[4, 9], [17, 21]], peso: 3, agil: 1.3, vel: 0.75, cm: [50, 90], xp: 70 },
    lucio: { agua: "lago", horas: [[16, 24], [0, 4]], peso: 3, agil: 1.3, vel: 0.85, cm: [50, 110], xp: 80 },
    anguila: { agua: "todo", horas: [[21, 24], [0, 5]], peso: 2, agil: 2, vel: 0.65, cm: [40, 90], xp: 90 },
    escarcha: { agua: "rio", horas: [[0, 24]], peso: 2, agil: 1.6, vel: 0.95, cm: [25, 45], xp: 100, norte: true },
    urridi: { agua: "lago", horas: [[21, 24], [0, 5]], peso: 0, agil: 2.1, vel: 1.15, cm: [140, 165], xp: 600, unico: true },
  };
  const ZONA = 0.24, // alto de la franja verde
    SUBE = 2.6, // empuje al mantener
    CAE = 2.2, // gravedad al soltar
    LLENA = 0.3,
    VACIA = 0.2,
    PICA = 0.8,
    RADIO = 150,
    ESPECIES_URRIDI = 4;
  const base = () => ({ cana: false, libro: {}, urridi: false });
  let st = base();
  let puesto = null; // la cosa canaSverri
  let pesca = null; // { fase, t, espera, x, y, agua, pez, cm, z, vz, f, ft, fv, p, res }
  let modoAntes = "juego";
  let mantiene = false;

  // ---------- el agua ----------
  const enLago = (x, y) => W.LAGOS.some((g) => !g.seco && Math.hypot((x - g.p[0]) / (g.rx + 80), (y - g.p[1]) / (g.ry + 80)) < 1);
  // el punto de agua más a mano: primero hacia donde mira Eromash, después alrededor
  function aguaCerca(x, y) {
    if (J.dentro || (jug.z || 0) > 20) return null;
    const dirs = [];
    const d0 = Math.atan2(jug.dir ? jug.dir[1] : 1, jug.dir ? jug.dir[0] : 0);
    for (let k = 0; k < 8; k++) dirs.push(d0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (Math.PI / 4));
    for (const a of dirs)
      for (let d = 50; d <= 190; d += 20) {
        const px = x + Math.cos(a) * d,
          py = y + Math.sin(a) * d * 0.8;
        if (W.sueloEn(px, py) === 1) return { x: px, y: py, agua: enLago(px, py) ? "lago" : "rio" };
      }
    return null;
  }
  const enHora = (h, tramos) => tramos.some(([a, b]) => h >= a && h < b);
  // qué pez pica acá y ahora (con semilla de la tirada: Math.random)
  function elegirPez(agua, x, y) {
    const h = A.hora(),
      norte = y < W.ALTO * 0.33;
    const especies = Object.keys(st.libro).filter((k) => k !== "urridi").length;
    if (agua === "lago" && !st.urridi && especies >= ESPECIES_URRIDI && enHora(h, PECES.urridi.horas) && Math.random() < 0.25) return "urridi";
    const cands = Object.keys(PECES).filter((k) => {
      const P = PECES[k];
      return !P.unico && (P.agua === "todo" || P.agua === agua) && enHora(h, P.horas) && (!P.norte || norte);
    });
    if (!cands.length) return agua === "lago" ? "perca" : "trucha";
    let total = cands.reduce((s, k) => s + PECES[k].peso, 0),
      r = Math.random() * total;
    for (const k of cands) if ((r -= PECES[k].peso) <= 0) return k;
    return cands[0];
  }

  // ---------- tirar, picar, pelear ----------
  function empezar() {
    if (!st.cana || pesca) return false;
    const w = aguaCerca(jug.x, jug.y);
    if (!w) return HUD.aviso(t("pe.sin_agua"), "#8A8478"), false;
    const h = A.hora(),
      alba = (h >= 4 && h < 8) || (h >= 17 && h < 21);
    pesca = { fase: "espera", t: 0, espera: (1.5 + Math.random() * 3) * (alba ? 0.7 : 1), x: w.x, y: w.y, agua: w.agua, pez: null, cm: 0, z: 0.3, vz: 0, f: 0.3, ft: 0.3, fv: 0, cambio: 0, p: 0.3, res: null, cierre: 0 };
    jug.dir = [w.x - jug.x, w.y - jug.y];
    const l = Math.hypot(jug.dir[0], jug.dir[1]) || 1;
    jug.dir = [jug.dir[0] / l, jug.dir[1] / l];
    modoAntes = J.modo === "menu" ? "juego" : J.modo;
    J.modo = "pesca";
    mantiene = false;
    armarCapa();
    if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.5, tono: 1.3 });
    return true;
  }
  function picar() {
    pesca.fase = "pica";
    pesca.t = 0;
    pesca.pez = elegirPez(pesca.agua, pesca.x, pesca.y);
    if (window.SONIDO) {
      SONIDO.tocar("caida", { vol: 0.5, tono: 1.4 });
      SONIDO.tono("sine", 880, 660, 0.18, 0.08);
    }
  }
  function tirar() {
    const P = PECES[pesca.pez];
    pesca.fase = "pelea";
    pesca.t = 0;
    pesca.p = 0.3;
    pesca.z = 0.3;
    pesca.f = 0.4;
    pesca.ft = 0.4;
    pesca.cm = Math.round(P.cm[0] + Math.random() * (P.cm[1] - P.cm[0]));
    if (window.SONIDO) SONIDO.tocar("filo", { vol: 0.4, tono: 1.2 });
    if (pesca.pez === "urridi") HUD.aviso(t("pe.urridi_pica"), "#FFD98A");
  }
  function terminar(res) {
    pesca.fase = "fin";
    pesca.res = res;
    pesca.cierre = res === "pesco" ? 1.8 : 1.2;
    if (res !== "pesco") {
      if (res !== "cancela") HUD.aviso(t(res === "tarde" ? "pe.tarde" : "pe.escapo"), "#8A8478");
      if (window.ANIMA && res === "escapo") ANIMA.gesto("duda");
      return;
    }
    const id = pesca.pez,
      P = PECES[id],
      L = st.libro[id] || { n: 0, cm: 0 },
      nuevo = !L.n,
      record = pesca.cm > L.cm;
    L.n++;
    L.cm = Math.max(L.cm, pesca.cm);
    st.libro[id] = L;
    if (window.COCINA) {
      const c = COCINA.estado().carne;
      c.pescado = (c.pescado || 0) + (P.unico ? 3 : 1);
    }
    if (window.RPG) RPG.dar(nuevo ? P.xp : Math.round(P.xp * 0.25), jug.x, jug.y);
    HUD.aviso(t(nuevo ? "pe.nuevo" : record ? "pe.record" : "pe.pescaste", [t("pe.p_" + id), pesca.cm]), nuevo || record ? "#FFD98A" : "#7BC86C");
    if (window.SONIDO) SONIDO.tocar(P.unico || nuevo ? "mision" : "plata", { vol: 0.5 });
    if (window.ANIMA) ANIMA.gesto("feliz");
    if (P.unico) {
      st.urridi = true;
      PODERES.soltar(jug.x, jug.y, "plata", 250, true);
      J.retrasar(0.5, () => PODERES.darFragmento());
      J.retrasar(0.9, () => PODERES.darFragmento());
      if (window.BOTIN && window.OBJETOS) J.retrasar(1.2, () => BOTIN.tirar(jug.x, jug.y - 30, OBJETOS.generar({ n: window.RPG ? RPG.nivel() : 1, min: 3, hallazgo: 2 }), true));
      J.retrasar(2, () => HUD.aviso(t("pe.urridi_d"), "lugar", t("pe.p_urridi")));
    }
  }
  function cerrar() {
    pesca = null;
    J.modo = modoAntes || "juego";
    const el = document.getElementById("pesca");
    if (el) el.classList.add("oculto");
    CONTROLES.soltar && CONTROLES.soltar();
  }
  const aprieta = () => CONTROLES.recien("interactuar") || CONTROLES.recien("atacar") || CONTROLES.recien("saltar") || CONTROLES.recien("seguir");
  const sostiene = () => mantiene || CONTROLES.pulsado("interactuar") || CONTROLES.pulsado("atacar") || CONTROLES.pulsado("saltar") || CONTROLES.pulsado("seguir");
  let toque = false; // un toque en la pantalla cuenta como apretar
  function paso(dt) {
    if (!pesca) return cerrar();
    pesca.t += dt;
    const ap = aprieta() || toque;
    toque = false;
    if (pesca.fase !== "fin" && CONTROLES.recien("pausa")) terminar("cancela");
    switch (pesca.fase) {
      case "espera":
        if (ap) terminar("cancela");
        else if (pesca.t >= pesca.espera) picar();
        break;
      case "pica":
        if (ap) tirar();
        else if (pesca.t >= PICA) terminar("tarde");
        break;
      case "pelea":
        pelear(dt);
        break;
      case "fin":
        if ((pesca.cierre -= dt) <= 0) return cerrar();
        break;
    }
    dibujar();
  }
  // un paso de la pelea (separado para probarlo con la mano quieta o apretada)
  function pelear(dt, apretado) {
    const P = PECES[pesca.pez],
      sost = apretado != null ? apretado : sostiene();
    // la franja: sube mientras se mantiene, cae al soltar, rebota en los bordes
    pesca.vz += (sost ? SUBE : -CAE) * dt;
    pesca.vz = Math.max(-1.6, Math.min(1.6, pesca.vz));
    pesca.z += pesca.vz * dt;
    if (pesca.z < 0) (pesca.z = 0), (pesca.vz = Math.max(0, -pesca.vz * 0.3));
    if (pesca.z > 1 - ZONA) (pesca.z = 1 - ZONA), (pesca.vz = Math.min(0, -pesca.vz * 0.3));
    // el pez: cambia de idea cada tanto y va hacia ahí con su velocidad
    pesca.cambio -= dt * P.agil;
    if (pesca.cambio <= 0) {
      pesca.cambio = 0.5 + Math.random() * 0.9;
      pesca.ft = Math.max(0.03, Math.min(0.97, pesca.f + (Math.random() - 0.5) * (0.5 + P.agil * 0.35)));
    }
    pesca.f += Math.sign(pesca.ft - pesca.f) * Math.min(Math.abs(pesca.ft - pesca.f), P.vel * dt);
    const adentro = pesca.f >= pesca.z && pesca.f <= pesca.z + ZONA;
    pesca.p += (adentro ? LLENA : -VACIA * (0.8 + P.vel * 0.4)) * dt;
    pesca.adentro = adentro;
    if (pesca.p >= 1) terminar("pesco");
    else if (pesca.p <= 0) terminar("escapo");
  }

  // ---------- la capa del minijuego ----------
  function armarCapa() {
    let el = document.getElementById("pesca");
    if (!el) {
      document.body.insertAdjacentHTML("beforeend", `<div id="pesca" class="ui panel"><h2></h2><canvas width="560" height="320"></canvas><p class="pe-pie"></p></div>`);
      el = document.getElementById("pesca");
      el.addEventListener("pointerdown", (e) => (e.preventDefault(), (mantiene = true), (toque = true)));
      ["pointerup", "pointercancel", "pointerleave"].forEach((k) => el.addEventListener(k, () => (mantiene = false)));
    }
    el.classList.remove("oculto");
    el.querySelector("h2").textContent = t("pe.titulo");
  }
  function dibujar() {
    const el = document.getElementById("pesca");
    if (!el || !pesca) return;
    const c = el.querySelector("canvas").getContext("2d"),
      T = J.t,
      { P, E, L } = DIB;
    c.clearRect(0, 0, 560, 320);
    // el agua: una laguna de noche o de día, con ondas
    const noche = A.noche() > 0.5;
    E(c, 210, 190, 200, 110, noche ? "#1E2E3A" : "#2E5A72");
    E(c, 220, 182, 170, 86, noche ? "#26384A" : "#3E6A86");
    if (!window.CALIDAD || CALIDAD.nivel !== "baja")
      for (let k = 0; k < 3; k++) {
        const u = (T * 0.4 + k / 3) % 1;
        c.strokeStyle = `rgba(200,242,244,${0.35 * (1 - u)})`;
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(210, 186, 20 + u * 90, 6 + u * 28, 0, 0, Math.PI * 2);
        c.stroke();
      }
    // la boya: flota, tiembla al picar, se hunde en la pelea
    const fase = pesca.fase,
      hunde = fase === "pica" ? 6 + Math.sin(T * 30) * 4 : fase === "pelea" ? 10 : 0,
      bx = 210 + (fase === "pelea" ? (pesca.f - 0.5) * 80 : 0),
      by = 186 + hunde + Math.sin(T * 2.4) * 2;
    c.strokeStyle = "rgba(232,228,220,0.75)";
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(20, 20);
    c.quadraticCurveTo(140, 60 + (fase === "pelea" ? 40 : 0), bx, by - 12);
    c.stroke();
    E(c, bx, by - 6, 7, 9, "#C8402D");
    E(c, bx, by - 13, 5, 4, "#F2ECEC");
    // la sombra del pez cuando pica o pelea
    if (fase === "pica" || fase === "pelea" || (fase === "fin" && pesca.res === "pesco"))
      DIB.alfa(c, fase === "fin" ? 1 : 0.55, () => PECES_DIBUJO.pez(c, pesca.pez, bx - 40 + Math.sin(T * 5) * 6, by + 26, pesca.pez === "urridi" ? 2.4 : 1.6, Math.sin(T * 4) * 0.15));
    // el letrero de la fase
    c.font = '900 26px "Eromash Display", system-ui, sans-serif';
    c.textAlign = "center";
    const letrero = fase === "espera" ? t("pe.espera") : fase === "pica" ? t("pe.pica") : fase === "fin" ? (pesca.res === "pesco" ? t("pe.p_" + pesca.pez) + " · " + pesca.cm + " cm" : t(pesca.res === "tarde" ? "pe.tarde" : pesca.res === "cancela" ? "pe.recoges" : "pe.escapo")) : "";
    c.fillStyle = fase === "pica" ? "#FFD98A" : pesca.res === "pesco" ? "#7BC86C" : "#F2ECEC";
    if (letrero) c.fillText(letrero, 210, 50);
    // la barra de la pelea: el pez, la franja verde y la captura que se llena
    const bx0 = 450,
      by0 = 24,
      bh = 272,
      bw = 40;
    c.fillStyle = "#111111";
    c.fillRect(bx0, by0, bw, bh);
    c.fillStyle = "#1E2E3A";
    c.fillRect(bx0 + 3, by0 + 3, bw - 6, bh - 6);
    if (fase === "pelea" || fase === "fin") {
      const Y = (v) => by0 + bh - 3 - v * (bh - 6);
      c.fillStyle = pesca.adentro ? "#7BC86C" : "#4E7A44";
      c.fillRect(bx0 + 4, Y(pesca.z + ZONA), bw - 8, ZONA * (bh - 6));
      PECES_DIBUJO.pez(c, pesca.pez, bx0 + bw / 2, Y(pesca.f), 0.7, 0);
      // la captura
      c.fillStyle = "#111111";
      c.fillRect(bx0 + bw + 10, by0, 12, bh);
      c.fillStyle = pesca.p > 0.66 ? "#FFD98A" : pesca.p > 0.33 ? "#F5A524" : "#C8402D";
      c.fillRect(bx0 + bw + 12, Y(Math.max(0, Math.min(1, pesca.p))), 8, Math.max(0, Math.min(1, pesca.p)) * (bh - 6));
    }
    el.querySelector(".pe-pie").textContent = t(fase === "pelea" ? "pe.pie_pelea" : fase === "pica" ? "pe.pie_pica" : "pe.pie_espera", [CONTROLES.glifo("interactuar")]);
  }

  // ---------- el puesto de Sverri ----------
  function armarPuesto() {
    const pu = W.LUGARES.puesto.p;
    let mejor = null;
    W.LAGOS.forEach((g) => {
      if (g.seco) return;
      // el punto de la orilla que mira al Puesto, un poco afuera del agua
      const a = Math.atan2(pu[1] - g.p[1], pu[0] - g.p[0]);
      for (let k = 0; k < 24; k++) {
        const b = a + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.25,
          x = g.p[0] + Math.cos(b) * (g.rx + 170),
          y = g.p[1] + Math.sin(b) * (g.ry + 170);
        if (W.sueloEn(x, y) !== 0 || W.CAMINOS.some((c) => W.distLinea(x, y, c.p) < c.w / 2 + 60)) continue;
        const d = Math.hypot(x - pu[0], y - pu[1]);
        if (!mejor || d < mejor.d) mejor = { x, y, d };
        break;
      }
    });
    if (!mejor) return;
    W.cercanas(mejor.x - 300, mejor.y - 250, mejor.x + 300, mejor.y + 400, (o) => {
      if (!o.arbol && o.id !== "roca" && o.id !== "troncoCaido") return;
      const dy = o.y - mejor.y;
      if (Math.hypot(o.x - mejor.x, dy > 0 ? dy * 0.6 : dy) > 260) return;
      o.oculto = true;
      o.choque = null;
    });
    puesto = W.agregar("canaSverri", [mejor.x, mejor.y], {});
  }
  function tomarCana() {
    if (st.cana) return;
    st.cana = true;
    puesto.o.sinCana = true;
    HUD.aviso(t("pe.cana_d"), "lugar", t("pe.cana"));
    if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.5 });
    if (window.INVENTARIO) INVENTARIO.repintar();
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      J.modos = J.modos || {};
      J.modos.pesca = paso;
      armarPuesto();
      if (window.COCINA) {
        COCINA.CARNES.pescado = { de: null, prob: 0, n: 0, col: "#8AA8C0" };
        Object.assign(COCINA.PLATOS, {
          pescadoPalo: { pide: { pescado: 1 }, dura: 300, col: "#8AA8C0", s: (s, k) => ((s.vida += 20 * k), (s.estamina += 15 * k)) },
          sopaPescado: { pide: { pescado: 2, abedul: 1 }, dura: 420, col: "#C8C49A", s: (s, k) => ((s.vida += 30 * k), (s.armadura += 8 * k)) },
        });
      }
      if (window.INVENTARIO && INVENTARIO.iconoDe) {
        INVENTARIO.iconoDe("co_c_pescado", (c) => PECES_DIBUJO.pez(c, "trucha", 4, 6, 1.2, -0.2));
        INVENTARIO.iconoDe("pe_cana", (c) => {
          DIB.L(c, -26, 26, 22, -24, "#7A5634", 4);
          DIB.L(c, 22, -24, 30, -30, "#9A7650", 2.4);
          DIB.E(c, -16, 16, 6, 6, "#3A3634");
          c.strokeStyle = "rgba(232,228,220,0.8)";
          c.lineWidth = 1.4;
          c.beginPath();
          c.moveTo(30, -30);
          c.quadraticCurveTo(34, 0, 26, 24);
          c.stroke();
          DIB.E(c, 26, 24, 4, 5, "#C8402D");
        });
      }
    },
    alEmpezar(extra) {
      extra.pesca = Object.assign(base(), extra.pesca || {});
      st = extra.pesca;
      if (puesto) puesto.o.sinCana = st.cana;
      if (pesca) cerrar();
    },
    cercanos(dar) {
      if (J.dentro) return;
      if (puesto && !st.cana) {
        const d = Math.hypot(puesto.x - jug.x, puesto.y - jug.y);
        if (d < RADIO) dar(d, t("pe.tomar"), tomarCana, puesto.x, puesto.y - 120);
      }
      if (!st.cana || A.enPelea()) return;
      const w = aguaCerca(jug.x, jug.y);
      if (w) dar(120, t("pe.pescar"), empezar, w.x, w.y - 30);
    },
    sobreLuz(c) {
      // el sedal y la boya en el mundo mientras se pesca
      if (!pesca || J.dentro) return;
      const hunde = pesca.fase === "pica" ? 4 : pesca.fase === "pelea" ? 6 : 0,
        bx = pesca.x + (pesca.fase === "pelea" ? Math.sin(J.t * 3) * 14 : 0),
        by = pesca.y + hunde + Math.sin(J.t * 2.4) * 1.5,
        px = jug.x + jug.dir[0] * 30,
        py = jug.y - 70;
      c.strokeStyle = "#7A5634";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(jug.x + jug.dir[0] * 8, jug.y - 30);
      c.lineTo(px, py - 30);
      c.stroke();
      c.strokeStyle = "rgba(232,228,220,0.7)";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(px, py - 30);
      c.quadraticCurveTo((px + bx) / 2, Math.max(py, by) + 10, bx, by - 6);
      c.stroke();
      DIB.E(c, bx, by - 4, 4, 5, "#C8402D");
      DIB.E(c, bx, by - 8, 3, 2.4, "#F2ECEC");
    },
    marcasMapa() {
      return puesto ? [{ tipo: "pesca", x: puesto.x, y: puesto.y, op: { nombre: t("as.canaSverri"), apagado: st.cana } }] : [];
    },
    celdasBolsa() {
      return st.cana ? [{ id: "pe_cana", icono: "pe_cana", nombre: t("pe.cana"), col: "#8AA8C0", desc: t("pe.cana_bolsa") }] : [];
    },
    diario() {
      const ids = Object.keys(PECES).filter((k) => st.libro[k]);
      if (!st.cana && !ids.length) return "";
      const filas = ids.map((k) => `<li><b>${t("pe.p_" + k)}</b> · ${t("pe.libro_fila", [st.libro[k].n, st.libro[k].cm])}</li>`).join("");
      return `<div class="diario-resumen"><p><b>${t("pe.libro")}</b> ${t("pe.libro_d", [ids.length, Object.keys(PECES).length])}</p>${filas ? `<ul>${filas}</ul>` : ""}</div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, actual: () => pesca, puesto: () => puesto, empezar, picar, tirar, pelear, terminar, cerrar, aguaCerca, elegirPez, tomarCana, PECES, ZONA, PICA };
})();
