// ---------- la pesca (sistema PESCA) ----------
// A la orilla de la laguna más cercana al Puesto está el puesto de Sverri, con su caña clavada en el barro. Con la caña,
// en cualquier orilla de laguna o de río se pesca con E, en el mundo, sin ventana:
//   1. Eromash tira la caña y la boya vuela hasta el agua; flota de 1,5 a 4,5 s (menos al alba y al caer el sol).
//   2. ¡Pica! La boya se hunde: hay que clavar enseguida (E, clic, ✕ o tocar; 0,8 s). Si no, se va.
//   3. La pelea: al costado de Eromash, la barra de la captura y la tensión del sedal. Con «¡Tirá!» (el pez cansado)
//      cada clic lo acerca; con «¡Esperá!» (el pez tira) hay que soltar: cada clic tensa el sedal y lleno se corta.
//      Sin tirar el pez se aleja y se suelta. Moverse recoge el sedal; un golpe lo suelta.
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
  const LANZA = 0.55, // lo que vuela la boya hasta el agua
    PICA = 0.8, // el tiempo para clavar el anzuelo cuando pica
    EMPIEZA = 0.22, // la captura al clavar
    GANA = 0.065, // lo que acerca cada tirón con el pez cansado (se divide por su fuerza)
    TENSA = 0.07, // lo que tensa cada tirón con el pez cansado
    TENSA_MAL = 0.3, // lo que tensa cada tirón mientras el pez tira: con 1 se corta el sedal
    AFLOJA = 0.7, // lo que se afloja la tensión por segundo
    GRACIA = 0.25, // al empezar a tirar el pez, el tirón que ya venía no cuenta
    RADIO = 150,
    ESPECIES_URRIDI = 4;
  const base = () => ({ cana: false, libro: {}, urridi: false });
  let st = base();
  let puesto = null; // la cosa canaSverri
  // { fase: lanza · espera · pica · pelea · fin, t, espera, x, y, agua, pez, cm, pez: estado cede/tira y cuánto le queda,
  //   p (la captura, 0 a 1), ten (la tensión del sedal), res, cierre }
  let pesca = null;
  let toque = false; // un toque en la pantalla cuenta como un tirón
  let hpAntes = 0;
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
  // Todo pasa en el mundo: Eromash queda quieto a la orilla con la caña (jug.interactuando lo frena cada cuadro), el
  // bosque sigue andando y la barra de la pelea aparece a su costado. Moverse recoge el sedal; un golpe lo suelta.
  function empezar() {
    if (!st.cana || pesca) return false;
    const w = aguaCerca(jug.x, jug.y);
    if (!w) return HUD.aviso(t("pe.sin_agua"), "#8A8478"), false;
    const h = A.hora(),
      alba = (h >= 4 && h < 8) || (h >= 17 && h < 21);
    pesca = { fase: "lanza", t: 0, espera: (1.5 + Math.random() * 3) * (alba ? 0.7 : 1), x: w.x, y: w.y, agua: w.agua, pez: null, cm: 0, est: "cede", dura: 0, p: EMPIEZA, ten: 0, tiron: 0, res: null, cierre: 0 };
    const l = Math.hypot(w.x - jug.x, w.y - jug.y) || 1;
    jug.dir = [(w.x - jug.x) / l, (w.y - jug.y) / l];
    jug.mira = VIKINGO.vista(jug.dir[0], jug.dir[1], jug.mira);
    jug.interactuando = 0.1;
    hpAntes = jug.hp;
    toque = false;
    if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.5, tono: 1.3, x: jug.x, y: jug.y });
    return true;
  }
  function picar() {
    pesca.fase = "pica";
    pesca.t = 0;
    pesca.pez = elegirPez(pesca.agua, pesca.x, pesca.y);
    if (window.SONIDO) {
      SONIDO.tocar("caida", { vol: 0.5, tono: 1.4, x: pesca.x, y: pesca.y });
      SONIDO.tono("sine", 880, 660, 0.18, 0.08);
    }
    A.textoFlotante(jug.x, jug.y - 190, t("pe.pica"), "#FFD98A");
  }
  function tirar() {
    const P = PECES[pesca.pez];
    pesca.fase = "pelea";
    pesca.t = 0;
    pesca.p = EMPIEZA;
    pesca.ten = 0;
    pesca.est = "cede";
    pesca.dura = 1 + Math.random() * 0.8;
    pesca.cm = Math.round(P.cm[0] + Math.random() * (P.cm[1] - P.cm[0]));
    if (window.SONIDO) SONIDO.tocar("filo", { vol: 0.4, tono: 1.2 });
    if (pesca.pez === "urridi") HUD.aviso(t("pe.urridi_pica"), "#FFD98A");
  }
  function terminar(res) {
    pesca.fase = "fin";
    pesca.t = 0;
    pesca.res = res;
    pesca.cierre = res === "pesco" ? 1.2 : 0.6;
    if (res !== "pesco") {
      if (res !== "cancela") HUD.aviso(t(res === "tarde" ? "pe.tarde" : res === "corto" ? "pe.corto" : "pe.escapo"), "#8A8478");
      if (window.ANIMA && (res === "escapo" || res === "corto")) ANIMA.gesto("duda");
      if (window.SONIDO && res === "corto") SONIDO.tocar("filo", { vol: 0.5, tono: 2.2 });
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
    if (window.SONIDO) {
      SONIDO.tocar("caida", { vol: 0.5, tono: 1.1, x: pesca.x, y: pesca.y });
      SONIDO.tocar(P.unico || nuevo ? "mision" : "plata", { vol: 0.5 });
    }
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
    jug.interactuando = 0;
    CONTROLES.soltar && CONTROLES.soltar();
  }
  // un tirón: clic, E, ✕ o un toque en la pantalla
  const aprieta = () => CONTROLES.recien("interactuar") || CONTROLES.recien("atacar") || CONTROLES.recien("saltar") || CONTROLES.recien("seguir");
  function actualizar(dt) {
    if (!pesca) return;
    if (J.dentro || jug.muerto) return cerrar();
    pesca.t += dt;
    if (pesca.fase !== "fin") jug.interactuando = Math.max(jug.interactuando, 0.1);
    const ap = J.modo === "juego" && (aprieta() || toque);
    toque = false;
    if (pesca.fase !== "fin") {
      // un golpe suelta todo; moverse recoge el sedal
      if (jug.hp < hpAntes - 0.5) return terminar(pesca.fase === "pelea" ? "escapo" : "cancela");
      const e = CONTROLES.eje();
      if (J.modo === "juego" && Math.hypot(e.x, e.y) > 0.5 && pesca.t > 0.3) return terminar("cancela");
    }
    hpAntes = jug.hp;
    switch (pesca.fase) {
      case "lanza":
        if (pesca.t >= LANZA) {
          pesca.fase = "espera";
          pesca.t = 0;
          if (window.SONIDO) SONIDO.tocar("caida", { vol: 0.25, tono: 1.8, x: pesca.x, y: pesca.y });
        }
        break;
      case "espera":
        if (pesca.t >= pesca.espera) picar();
        break;
      case "pica":
        if (ap) tirar();
        else if (pesca.t >= PICA) terminar("tarde");
        break;
      case "pelea":
        pelear(dt, ap);
        break;
      case "fin":
        if ((pesca.cierre -= dt) <= 0) cerrar();
        break;
    }
  }
  // un paso de la pelea (separado para probarlo): tiron = si en este cuadro hubo un tirón.
  // El pez alterna: «cede» (cansado: ¡Tirá!, cada tirón lo acerca) y «tira» (¡Esperá!: cada tirón tensa el sedal y con
  // la tensión llena se corta). Sin tirar, se va alejando: si la captura llega a 0 se suelta.
  function pelear(dt, tiron) {
    const P = PECES[pesca.pez],
      fuerza = 0.6 + P.vel * 0.6;
    pesca.dura -= dt;
    if (pesca.dura <= 0) {
      pesca.est = pesca.est === "cede" ? "tira" : "cede";
      pesca.dura = pesca.est === "cede" ? (1.2 + Math.random() * 1.2) / (0.6 + P.agil * 0.4) : (0.7 + Math.random() * 0.8) * (0.7 + P.agil * 0.3);
      pesca.cambio = 0;
      if (window.SONIDO) SONIDO.tono("triangle", pesca.est === "cede" ? 520 : 300, pesca.est === "cede" ? 700 : 220, 0.12, 0.06);
    }
    pesca.cambio = (pesca.cambio || 0) + dt;
    pesca.tiron = Math.max(0, pesca.tiron - dt * 4);
    if (tiron) {
      pesca.tiron = 1;
      if (pesca.est === "cede") {
        pesca.p += GANA / fuerza;
        pesca.ten += TENSA;
        if (window.SONIDO) SONIDO.tono("square", 900 + pesca.p * 400, 700, 0.04, 0.025);
      } else if (pesca.cambio > GRACIA) pesca.ten += TENSA_MAL;
    }
    pesca.p -= (pesca.est === "tira" ? 0.09 : 0.05) * (0.5 + P.vel) * dt;
    pesca.ten = Math.max(0, pesca.ten - AFLOJA * dt);
    if (pesca.ten >= 1) terminar("corto");
    else if (pesca.p >= 1) terminar("pesco");
    else if (pesca.p <= 0) terminar("escapo");
  }

  // ---------- el dibujo en el mundo ----------
  // el sedal, la boya y las ondas van en el piso; la caña, el pez que sale y la barra se paran derechos en la vista
  const vista = (x, y) => (J.giro ? VOL.vista(x, y, J.cam.x, J.cam.y, J.giro) : [x, y]);
  function boya() {
    const f = pesca.fase,
      T = J.t;
    if (f === "lanza") {
      const k = Math.min(1, pesca.t / LANZA);
      return { x: jug.x + (pesca.x - jug.x) * k, y: jug.y + (pesca.y - jug.y) * k, alto: Math.sin(k * Math.PI) * 140 + (1 - k) * 90 };
    }
    const tira = f === "pelea" && pesca.est === "tira";
    return {
      x: pesca.x + (f === "pelea" ? Math.sin(T * (tira ? 9 : 3)) * (tira ? 22 : 10) : 0),
      y: pesca.y + (f === "pica" ? 5 + Math.sin(T * 30) * 3 : f === "pelea" ? 6 : Math.sin(T * 2.4) * 1.5),
      alto: 0,
    };
  }
  function dibujarPiso(c) {
    const f = pesca.fase;
    if (f === "lanza" || (f === "fin" && pesca.res === "pesco")) return;
    const b = boya(),
      T = J.t;
    // ondas alrededor de la boya: suaves esperando, más seguidas al picar y en la pelea
    if (!window.CALIDAD || CALIDAD.nivel !== "baja") {
      const n = f === "espera" ? 2 : 3,
        vel = f === "espera" ? 0.5 : f === "pica" ? 2.2 : pesca.est === "tira" ? 1.8 : 1.1;
      for (let k = 0; k < n; k++) {
        const u = (T * vel + k / n) % 1;
        c.strokeStyle = `rgba(200,242,244,${0.45 * (1 - u)})`;
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(b.x, b.y, 8 + u * 46, (8 + u * 46) * 0.45, 0, 0, DIB.TAU);
        c.stroke();
      }
    }
    // la sombra del pez cuando pica o pelea
    if (f === "pica" || f === "pelea") DIB.alfa(c, 0.35, () => DIB.E(c, b.x - 18 + Math.sin(T * 5) * 8, b.y + 14, pesca.pez === "urridi" ? 46 : 24, pesca.pez === "urridi" ? 12 : 7, "#0E1A22"));
    if (f !== "fin") {
      DIB.E(c, b.x, b.y - 4, 4, 5, "#C8402D");
      DIB.E(c, b.x, b.y - 8, 3, 2.4, "#F2ECEC");
    }
  }
  function dibujarDerecho(c) {
    const f = pesca.fase,
      T = J.t,
      [jx, jy] = vista(jug.x, jug.y),
      lado = jug.dir[0] >= 0 ? 1 : -1,
      tira = f === "pelea" && pesca.est === "tira",
      // la caña: del puño a la punta, que se dobla hacia el agua cuando el pez tira
      mx = jx + lado * 14,
      my = jy - 78,
      dob = f === "pelea" ? (tira ? 1 : 0.45) + pesca.tiron * 0.25 : f === "pica" ? 0.5 : 0.1,
      lanzando = f === "lanza" ? Math.sin(Math.min(1, pesca.t / LANZA) * Math.PI) : 0,
      px = mx + lado * (62 - dob * 14 - lanzando * 40),
      py = my - 74 + dob * 46 - lanzando * 30;
    c.strokeStyle = "#5E4630";
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(mx - lado * 10, my + 14);
    c.quadraticCurveTo(mx + lado * 24, my - 44 + dob * 10, px, py);
    c.stroke();
    c.strokeStyle = "#9A7650";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(mx + lado * 24, my - 30 + dob * 10);
    c.quadraticCurveTo(mx + lado * 40, my - 58 + dob * 24, px, py);
    c.stroke();
    // el sedal: de la punta a la boya (en el aire mientras vuela)
    const b = boya(),
      [bx, by] = vista(b.x, b.y);
    if (!(f === "fin" && pesca.res !== "pesco")) {
      const sale = f === "fin" ? Math.min(1, pesca.t / 0.7) : 0,
        // el pez que sale del agua en arco hasta Eromash
        fx = bx + (jx + lado * 30 - bx) * sale,
        fy = by + (jy - 90 - by) * sale - Math.sin(sale * Math.PI) * 120,
        ex = f === "fin" ? fx : bx,
        ey = f === "fin" ? fy : by - 8 - b.alto;
      c.strokeStyle = "rgba(232,228,220,0.75)";
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(px, py);
      const floja = f === "espera" ? 26 : f === "lanza" ? 10 : 4 - (tira ? 6 : 0);
      c.quadraticCurveTo((px + ex) / 2, Math.max(py, ey) + floja, ex, ey);
      c.stroke();
      if (f === "lanza") {
        DIB.E(c, ex, ey + 4, 4, 5, "#C8402D");
        DIB.E(c, ex, ey, 3, 2.4, "#F2ECEC");
      }
      if (f === "fin") PECES_DIBUJO.pez(c, pesca.pez, fx, fy + 10, pesca.pez === "urridi" ? 1.6 : 0.9, Math.sin(T * 14) * 0.4 - lado * 0.6);
    }
    // la barra al costado de Eromash (del lado contrario al agua): la captura, la tensión y qué hacer
    if (f !== "pelea" && f !== "pica") return;
    const x = jx - lado * 92,
      y0 = jy - 200,
      alto = 150;
    DIB.alfa(c, 0.85, () => DIB.R(c, x - 12, y0, 24, alto, "#111111"));
    DIB.R(c, x - 9, y0 + 3, 18, alto - 6, "#1E2E3A");
    if (f === "pelea") {
      const p = Math.max(0, Math.min(1, pesca.p)),
        ten = Math.max(0, Math.min(1, pesca.ten));
      DIB.R(c, x - 9, y0 + 3 + (alto - 6) * (1 - p), 18, (alto - 6) * p, p > 0.66 ? "#FFD98A" : p > 0.33 ? "#F5A524" : "#C8402D");
      PECES_DIBUJO.pez(c, pesca.pez, x, y0 + 3 + (alto - 6) * (1 - p), 0.42, -Math.PI / 2 + Math.sin(T * 10) * 0.2);
      // la tensión: una tira fina al lado, que se pone roja y tiembla cerca de cortarse
      const tx = x + lado * -22,
        tiem = ten > 0.7 ? Math.sin(T * 60) * 2 : 0;
      DIB.R(c, tx - 4 + tiem, y0, 8, alto, "#111111");
      DIB.R(c, tx - 2 + tiem, y0 + 2 + (alto - 4) * (1 - ten), 4, (alto - 4) * ten, ten > 0.7 ? "#C8402D" : "#E0B2B2");
    }
    // el cartel: ¡Pica! / ¡Tirá! / ¡Esperá!, con la tecla
    const cartel = f === "pica" ? t("pe.pica") : tira ? t("pe.esperar") : t("pe.tira"),
      col = f === "pica" ? "#FFD98A" : tira ? "#C8402D" : "#7BC86C",
      late = f === "pica" || !tira ? 1 + Math.sin(T * 18) * 0.06 : 1;
    c.save();
    c.translate(x, y0 - 26);
    c.scale(late, late);
    c.font = '900 26px "Eromash Display", system-ui, sans-serif';
    c.textAlign = "center";
    c.lineWidth = 5;
    c.strokeStyle = "#111111";
    c.strokeText(cartel, 0, 0);
    c.fillStyle = col;
    c.fillText(cartel, 0, 0);
    c.restore();
    if (!tira) {
      c.font = '800 13px "Eromash Text", system-ui, sans-serif';
      c.textAlign = "center";
      const pie = t(f === "pica" ? "pe.pie_pica" : "pe.pie_pelea", [CONTROLES.glifo("interactuar")]);
      c.lineWidth = 4;
      c.strokeStyle = "#111111";
      c.strokeText(pie, x, y0 + alto + 20);
      c.fillStyle = "#F2ECEC";
      c.fillText(pie, x, y0 + alto + 20);
    }
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
      // en el celular, tocar la pantalla es un tirón
      document.addEventListener("pointerdown", (e) => pesca && e.pointerType === "touch" && (toque = true));
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
      if (J.dentro || pesca) return;
      if (puesto && !st.cana) {
        const d = Math.hypot(puesto.x - jug.x, puesto.y - jug.y);
        if (d < RADIO) dar(d, t("pe.tomar"), tomarCana, puesto.x, puesto.y - 120);
      }
      if (!st.cana || A.enPelea()) return;
      const w = aguaCerca(jug.x, jug.y);
      if (w) dar(120, t("pe.pescar"), empezar, w.x, w.y - 30);
    },
    actualizar,
    sobreLuz(c) {
      // la boya y las ondas en el piso; la caña, el sedal, el pez que sale y la barra derechos en la vista
      if (!pesca || J.dentro) return;
      dibujarPiso(c);
      c.save();
      if (J.baseT) J.baseT();
      dibujarDerecho(c);
      c.restore();
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
  return { sistema, estado: () => st, actual: () => pesca, puesto: () => puesto, empezar, picar, tirar, pelear, terminar, cerrar, aguaCerca, elegirPez, tomarCana, PECES, PICA, LANZA };
})();
