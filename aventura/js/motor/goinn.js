// ---------- el sótano de la hospedería y Góinn (sistema GOINN) ----------
// Según «Eldervald — etapas» (Proezas y el combate final): detrás de los barriles del Hongo Dorado hay una puerta de
// piedra con doce huecos, uno por proeza. Con las doce, la escalera baja a una cámara redonda con el círculo de los
// custodios; Svanhild lee el ritual, el círculo se enciende en azul y el portal lleva a las raíces, el plano bajo el
// bosque donde Góinn, una de las sierpes que roen las raíces del árbol del mundo, engordó mientras las lindes estaban
// débiles. La pelea, en tres fases:
//   1. Entre las raíces: la sierpe se mueve entre los pilares y ataca (mordida, chorro de savia negra, barrido de
//      cola), siempre con aviso en el piso; después de cada golpe la cabeza queda expuesta un momento.
//   2. Las heridas (desde el 66 %): se esconde y roe; llueve savia y barre con la cola mientras Eromash sella con la
//      mano cuatro heridas de luz. Cada herida sellada le quita una vuelta al cuerpo y achica el espacio.
//   3. La raíz madre: se aferra a la raíz más grande con la cabeza al alcance, más rápida. Se vence ahí.
// Reglas de siempre: aviso exacto en el piso, saltar evita todo, nada saca más del 35 % y nunca el mismo ataque tres
// veces seguidas. Los dos lugares viven fuera del mapa del bosque (ELDERVALD.EXTRAS).
window.GOINN = (function () {
  "use strict";
  let A, J, jug, W, H, CB, st;
  let ataqueTxt = "",
    accionTxt = "";
  const anunciar = (a, b) => ((ataqueTxt = a), (accionTxt = b));
  const t = (k, v) => I18N.t(k, v);
  const prueba = /[?&]goinn=1/.test(location.search); // para probar la pelea sin las doce proezas
  const VIDA = 800,
    SEG = 34,
    PASO = 56;
  let Z, C, R; // la zona fuera del mapa, la cámara y la arena de las raíces
  const pilares = [];
  let heridas = [];
  let pelea = null; // { fase, vida, cab, rastro[], estado, t, rot, sel, mis[], expuesta, muerte }
  const svan = { x: 0, y: 0, mira: { vista: "S", espejo: false } };

  const enCamara = (x, y) => ((x - C[0]) / 760) ** 2 + ((y - C[1]) / 520) ** 2 < 1;
  const radioArena = () => 1 - (pelea ? pelea.selladas * 0.07 : 0);
  const enArena = (x, y) => ((x - R[0]) / (2000 * radioArena())) ** 2 + ((y - R[1]) / (1400 * radioArena())) ** 2 < 1;
  const aqui = () => jug.x > Z.x0 && jug.x < Z.x1 && jug.y > Z.y0 && jug.y < Z.y1;
  const enLaArena = () => aqui() && Math.abs(jug.x - R[0]) < 2600;
  const madre = () => [R[0], R[1] - 1250];

  function trofeos() {
    return window.SECUNDARIAS && SECUNDARIAS.proezas ? SECUNDARIAS.proezas() : 0;
  }
  function libreZona(x, y, r) {
    if (enCamara(x, y)) return true;
    if (!enArena(x, y)) return false;
    for (const p of pilares) if (Math.hypot(x - p.x, (y - p.y) * 1.3) < p.r + r) return false;
    const m = madre();
    if (Math.hypot(x - m[0], (y - m[1]) * 1.3) < 300 + r) return false;
    return true;
  }

  // ---------- la pelea ----------
  const ROT = {
    1: ["mordida", "chorro", "mordida", "barrido"],
    2: ["lluvia", "barrido", "lluvia", "chorro"],
    3: ["mordida", "barrido", "chorro", "mordida", "chorro", "barrido"],
  };
  function empezar() {
    const cab = { x: R[0], y: R[1] - 900 };
    const rastro = [];
    for (let i = 0; i < SEG * PASO; i += 12) rastro.push({ x: cab.x + Math.sin(i / 300) * 200, y: cab.y - i * 0.3 });
    pelea = { fase: 1, vida: VIDA, cab, rastro, estado: "mueve", t: 0, rot: 0, mis: [], destino: null, selladas: 0, segs: SEG, mira: 0, golpe: 0 };
    heridas = pilares.slice(0, 4).map((p) => ({ x: p.x + (R[0] - p.x) * 0.12, y: p.y + (R[1] - p.y) * 0.12 + 60, sellada: false }));
    elegirDestino();
    HUD.aviso(t("gn.aparece"), "#73D5DB");
  }
  function terminarPelea() {
    if (!pelea) return;
    pelea.mis.forEach((m) => J.quitarAviso(m.a));
    pelea = null;
    anunciar("", "");
  }
  // la cabeza busca un lugar entre los pilares, cerca de Eromash pero sin pegarse
  function elegirDestino() {
    const p = pelea;
    if (p.fase === 2) p.destino = [R[0], R[1] - 1030];
    else if (p.fase === 3) p.destino = [R[0] + Math.sin(J.t) * 60, R[1] - 980];
    else {
      const a = Math.atan2(jug.y - R[1], jug.x - R[0]) + (Math.random() - 0.5) * 1.6,
        d = 700 + Math.random() * 400;
      p.destino = [R[0] + Math.cos(a) * d, R[1] + Math.sin(a) * d * 0.7];
    }
  }
  function aviso(forma, x, y, dur, op) {
    const a = Object.assign({ forma, x, y, dur, t: 0, dir: 0, rgb: [115, 213, 219] }, op);
    J.avisos.push(a);
    return a;
  }
  function atacar() {
    const p = pelea,
      k = ROT[p.fase][p.rot++ % ROT[p.fase].length],
      rap = p.fase === 3 ? 0.8 : 1,
      c = p.cab,
      dir = Math.atan2((jug.y - c.y) * 1.25, jug.x - c.x);
    p.mira = dir;
    anunciar(t("gn.at_" + k), t("gn.ac_" + k));
    if (k === "mordida") p.mis.push({ a: aviso("abanico", c.x, c.y, 1.0 * rap, { radio: 300, ang: 0.62, dir }), dano: 26 });
    else if (k === "chorro") p.mis.push({ a: aviso("franja", c.x, c.y, 1.1 * rap, { largo: p.fase === 2 ? 1500 : 950, ancho: 130, dir, rgb: [60, 90, 70] }), dano: 22, savia: true });
    else if (k === "barrido") {
      const s = cuerpo()[Math.floor(p.segs * 0.6)] || c,
        d2 = Math.atan2((jug.y - s.y) * 1.25, jug.x - s.x);
      p.mis.push({ a: aviso("franja", s.x, s.y, 1.2 * rap, { largo: 1150, ancho: 210, dir: d2, rgb: [154, 107, 216] }), dano: 24 });
    } else if (k === "lluvia")
      [0, 1, 2].forEach((i) => {
        const ox = i ? (Math.random() - 0.5) * 420 : 0,
          oy = i ? (Math.random() - 0.5) * 260 : 0;
        p.mis.push({ a: aviso("circulo", jug.x + ox, jug.y + oy, 1.0 + i * 0.3, { radio: 130, rgb: [60, 90, 70] }), dano: 18 });
      });
    p.estado = "aviso";
    p.t = 0;
  }
  function cuerpo() {
    // puntos del cuerpo a lo largo del rastro de la cabeza, cada PASO unidades
    const p = pelea,
      out = [{ x: p.cab.x, y: p.cab.y }];
    let falta = PASO,
      prev = p.cab;
    for (let i = p.rastro.length - 1; i >= 0 && out.length < p.segs; i--) {
      const q = p.rastro[i],
        l = Math.hypot(q.x - prev.x, q.y - prev.y);
      if (l >= falta) {
        const u = falta / l;
        prev = { x: prev.x + (q.x - prev.x) * u, y: prev.y + (q.y - prev.y) * u };
        out.push(prev);
        falta = PASO;
        i++;
      } else {
        falta -= l;
        prev = q;
      }
    }
    return out;
  }
  function moverCabeza(dt, vel) {
    const p = pelea,
      [dx, dy] = [p.destino[0] - p.cab.x, p.destino[1] - p.cab.y],
      l = Math.hypot(dx, dy);
    if (l < 20) return true;
    const v = Math.min(l, vel * dt);
    // serpentea: un poco de vaivén perpendicular
    const nx = -dy / l,
      ny = dx / l,
      w = Math.sin(J.t * 4) * 0.5;
    p.cab.x += (dx / l) * v + nx * w * v * 0.4;
    p.cab.y += (dy / l) * v + ny * w * v * 0.4;
    p.mira = Math.atan2(dy * 1.25, dx);
    const u = p.rastro[p.rastro.length - 1];
    if (!u || Math.hypot(u.x - p.cab.x, u.y - p.cab.y) > 12) p.rastro.push({ x: p.cab.x, y: p.cab.y });
    if (p.rastro.length > 900) p.rastro.splice(0, p.rastro.length - 900);
    return false;
  }
  function actualizarPelea(dt) {
    const p = pelea;
    if (p.muerte != null) {
      p.muerte += dt;
      if (p.muerte > 2.4) ganar();
      return;
    }
    p.golpe = Math.max(0, p.golpe - dt * 3);
    // los avisos que se cumplen
    for (const m of p.mis.slice()) {
      if (m.a.t < m.a.dur) continue;
      if (CB.contiene(m.a, jug.x, jug.y)) J.herir(Math.min(m.dano, 35), m.a.x, m.a.y);
      if (m.savia) {
        const ux = Math.cos(m.a.dir),
          uy = Math.sin(m.a.dir) / 1.25;
        J.zonas.push({ forma: "circulo", x: m.a.x + ux * m.a.largo * 0.7, y: m.a.y + uy * m.a.largo * 0.7, dur: 3, t: 0, dir: 0, radio: 110, rgb: [60, 90, 70], zona: true, dps: 8 });
      }
      J.quitarAviso(m.a);
      p.mis.splice(p.mis.indexOf(m), 1);
      p.golpe = 1;
      J.sacudir(0.25);
    }
    p.t += dt;
    if (p.estado === "mueve") {
      const vel = p.fase === 3 ? 900 : 700;
      if (moverCabeza(dt, vel) || p.t > 3) atacar();
    } else if (p.estado === "aviso") {
      if (!p.mis.length) {
        p.estado = p.fase === 2 ? "roe" : "expuesta";
        p.t = 0;
        anunciar(t(p.fase === 2 ? "gn.roe" : "gn.expuesta"), "");
      }
    } else if (p.estado === "expuesta") {
      if (p.t > (p.fase === 3 ? 1.1 : 1.6)) {
        p.estado = "mueve";
        p.t = 0;
        elegirDestino();
      }
    } else if (p.estado === "roe") {
      moverCabeza(dt, 500);
      if (p.t > 2.4) atacar();
    }
    // la fase 2 termina con las cuatro heridas selladas
    if (p.fase === 1 && p.vida <= VIDA * 0.66) {
      p.fase = 2;
      p.rot = 0;
      p.estado = "roe";
      p.t = 0;
      elegirDestino();
      HUD.aviso(t("gn.fase2"), "#73D5DB");
    }
    if (p.fase === 2 && p.selladas >= 4) {
      p.fase = 3;
      p.rot = 0;
      p.estado = "mueve";
      p.t = 0;
      elegirDestino();
      HUD.aviso(t("gn.fase3"), "#FFD98A");
    }
  }
  const golpeable = () => pelea && pelea.muerte == null && (pelea.fase === 3 || (pelea.fase === 1 && pelea.estado === "expuesta"));
  function ganar() {
    pelea = null;
    st.vencido = 1;
    anunciar("", "");
    if (window.SECUNDARIAS) SECUNDARIAS.marcarGoinn();
    if (window.PODERES) PODERES.darPlata(120);
    A.dialogoLibre([["eromash", "gn.fin_1"], ["eromash", "gn.fin_2"]], () => HUD.aviso(t("gn.escamas"), "#FFD98A"));
  }

  // ---------- la puerta, la cámara y los portales ----------
  function bajar() {
    HUD.fundido(true);
    setTimeout(() => {
      INTERIORES.salirA(C[0], C[1] + 400);
      HUD.fundido(false);
      if (!st.bajo) {
        st.bajo = 1;
        J.retrasar(0.8, () => A.dialogoLibre([["eromash", "gn.camara_1"], ["svanhild", "gn.camara_2"]]));
      }
    }, 600);
  }
  function puerta() {
    const n = trofeos();
    if (st.abierta) return bajar();
    if (n >= 12 || prueba) {
      st.abierta = 1;
      return A.dialogoLibre([["eromash", "gn.puerta_abre"]], bajar);
    }
    const lineas = [["eromash", "gn.puerta_1"], ["eromash", n ? "gn.puerta_huecos" : "gn.puerta_ninguno", [n]]];
    if (!st.ulf) {
      st.ulf = 1;
      lineas.push(["ulf", "gn.ulf_puerta"]);
    }
    A.dialogoLibre(lineas);
  }


  // ---------- lo que se ve en la cámara: los doce trofeos y lo que dejaron los custodios ----------
  let c0 = null; // el lienzo de turno (lo pasa el motor a fondo y objetos)
  function trofeo(k, x, y) {
    const c = c0,
      H0 = "#F2ECEC",
      HS = "#C8BCA4";
    c.save();
    c.translate(x, y);
    switch (k) {
      case 0: // cornamenta
        DIB.L(c, -14, 4, 14, 4, HS, 4); DIB.L(c, -10, 4, -16, -8, H0, 3); DIB.L(c, 0, 4, -2, -10, H0, 3); DIB.L(c, 10, 4, 16, -8, H0, 3); break;
      case 1: // asta de ciervo
        DIB.L(c, -16, 6, 16, -6, H0, 4); DIB.L(c, -4, 2, -8, -10, H0, 3); DIB.L(c, 6, -2, 4, -14, H0, 3); break;
      case 2: // escama
        DIB.P(c, [-14, 0, 0, -10, 14, -2, 4, 8], "#6E5E4C"); DIB.P(c, [0, -10, 14, -2, 4, 8, 2, -2], "#8C7A62"); break;
      case 3: // pluma
        DIB.P(c, [-16, 8, 14, -10, 6, 2], "#E6DCCB"); DIB.L(c, -16, 8, 14, -10, "#8C7A62", 2); break;
      case 4: // cuerno
        DIB.P(c, [-16, 4, 12, -8, 16, -4, -12, 8], "#E6DCCB"); DIB.P(c, [12, -8, 16, -4, 8, -2], "#8C7A62"); break;
      case 5: // atado de hierbas
        for (let i = 0; i < 4; i++) DIB.L(c, -10 + i * 6, 8, -6 + i * 7, -10, i % 2 ? "#6F8F4E" : "#4E6B3A", 3);
        DIB.R(c, -12, 0, 24, 4, "#9C2315"); break;
      case 6: // pergamino
        DIB.R(c, -14, -6, 28, 12, "#E6DCCB"); DIB.E(c, -14, 0, 4, 7, "#C8BCA4"); DIB.E(c, 14, 0, 4, 7, "#C8BCA4"); break;
      case 7: // hebilla
        DIB.R(c, -12, -8, 24, 16, "#4E4234"); DIB.R(c, -7, -4, 14, 8, "#3E8A92"); DIB.L(c, 0, -8, 0, 8, "#8C7A62", 2); break;
      case 8: // garra
        DIB.P(c, [-10, 8, -4, -10, 6, -14, 2, -6, 6, 8], "#F2ECEC"); DIB.P(c, [2, -6, 6, -14, 6, 8], HS); break;
      case 9: // piedras rotas
        DIB.P(c, [-14, 6, -10, -4, -2, 0, -4, 8], "#6A6E72"); DIB.P(c, [0, 8, 2, -6, 12, -2, 12, 8], "#7E8286"); break;
      case 10: // hoja roja
        DIB.P(c, [-14, 6, -2, -12, 14, -4, 2, 10], "#C8402D"); DIB.L(c, -14, 6, 10, -6, "#7A1A10", 2); break;
      default: // disco tallado
        DIB.E(c, 0, 0, 14, 10, "#7A5A3A"); DIB.E(c, 0, 0, 9, 6, "#5C4430"); FUTHARK.dibujar(c, "othala", 0, 5, 10, "#E0B2B2", 2);
    }
    c.restore();
  }
  function cosaCamara(tipo, x, y) {
    const c = c0;
    DIB.E(c, x, y, 34, 10, "rgba(0,0,0,0.4)");
    if (tipo === "barril") {
      DIB.P(c, [x - 26, y, x - 30, y - 30, x - 26, y - 62, x + 26, y - 62, x + 30, y - 30, x + 26, y], "#6A4A30");
      DIB.P(c, [x - 26, y, x - 30, y - 30, x - 26, y - 62, x, y - 62, x, y], "#553A26");
      DIB.R(c, x - 30, y - 46, 60, 5, "#2E2620");
      DIB.R(c, x - 30, y - 18, 60, 5, "#2E2620");
      DIB.E(c, x, y - 62, 26, 8, "#7A5A3A");
    } else if (tipo === "cofre") {
      DIB.R(c, x - 32, y - 34, 64, 34, "#6A4A30");
      DIB.R(c, x - 32, y - 34, 30, 34, "#553A26");
      DIB.P(c, [x - 32, y - 34, x - 26, y - 48, x + 26, y - 48, x + 32, y - 34], "#7A5A3A");
      DIB.R(c, x - 32, y - 26, 64, 4, "#2E2620");
      DIB.R(c, x - 4, y - 30, 8, 10, "#B88A3A");
    } else if (tipo === "cantaro") {
      DIB.P(c, [x - 12, y, x - 18, y - 22, x - 10, y - 40, x - 6, y - 48, x + 6, y - 48, x + 10, y - 40, x + 18, y - 22, x + 12, y], "#8A4A30");
      DIB.P(c, [x - 12, y, x - 18, y - 22, x - 10, y - 40, x - 6, y - 48, x, y - 48, x, y], "#6E3A26");
    } else {
      // rollos sobre un estante bajo
      DIB.R(c, x - 34, y - 30, 68, 30, "#4E3A28");
      DIB.R(c, x - 34, y - 30, 68, 6, "#6A4E36");
      for (let i = 0; i < 4; i++) {
        DIB.R(c, x - 30 + i * 15, y - 44, 12, 14, "#E6DCCB");
        DIB.E(c, x - 24 + i * 15, y - 44, 6, 3, "#C8BCA4");
      }
    }
  }

  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      H = A.H;
      CB = A.CB;
      st = {};
      Z = { x0: W.ANCHO + 3000, y0: W.ALTO * 0.3, x1: W.ANCHO + 11000, y1: W.ALTO * 0.3 + 5000, libre: libreZona };
      C = [Z.x0 + 1500, Z.y0 + 2000];
      R = [Z.x0 + 5600, Z.y0 + 2500];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.5;
        pilares.push({ x: R[0] + Math.cos(a) * 1240, y: R[1] + Math.sin(a) * 860, r: 120, sem: i });
      }
      W.EXTRAS.push(Z);
      svan.x = C[0] - 320;
      svan.y = C[1] + 100;
    },
    alEmpezar(extra) {
      extra.goinn = Object.assign({}, extra.goinn || {});
      st = extra.goinn;
      terminarPelea();
    },
    alGolpear(x, y, dir) {
      if (!golpeable()) return;
      const c = pelea.cab,
        dx = c.x - x,
        dy = (c.y - y) * 1.25,
        l = Math.hypot(dx, dy);
      if (l > 78 + 90) return;
      let da = Math.atan2(dy, dx) - dir;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      if (Math.abs(da) > 1.4 && l > 60) return;
      const dano = Math.round(18 * (J.mulDano || 1));
      pelea.vida -= dano;
      A.chispa(c.x, c.y - 50);
      A.numero(c.x, c.y - 90, dano);
      if (pelea.vida <= 0) {
        pelea.vida = 0;
        pelea.muerte = 0;
        pelea.mis.forEach((m) => J.quitarAviso(m.a));
        pelea.mis = [];
        anunciar("", "");
      }
    },
    actualizar(dt) {
      if (!aqui()) {
        if (pelea) terminarPelea();
        return;
      }
      J.oscuro = 2.4;
      if (enLaArena() && !st.vencido && !pelea && !jug.muerto) empezar();
      if (pelea) actualizarPelea(dt);
      if (Math.hypot(jug.x - svan.x, jug.y - svan.y) < 300) svan.mira = VIKINGO.vista(jug.x - svan.x, jug.y - svan.y, svan.mira);
    },
    cercanos(dar) {
      if (!aqui()) return;
      const cerca = (x, y, r) => Math.hypot(x - jug.x, y - jug.y) < r;
      // la cámara
      if (cerca(svan.x, svan.y, 120))
        dar(40, t("av.accion_hablar") + " · " + t("av.nombre_svanhild"), () => {
          if (st.vencido) return A.dialogoLibre([["svanhild", "gn.svan_fin"]]);
          if (st.ritual) return A.dialogoLibre([["svanhild", "gn.svan_portal"]]);
          A.dialogoLibre([["svanhild", "gn.ritual_1"], ["svanhild", "gn.ritual_2"], ["svanhild", "gn.ritual_3"]], () => {
            st.ritual = 1;
            HUD.aviso(t("gn.portal_abierto"), "#73D5DB");
          });
        });
      if (cerca(C[0], C[1] + 440, 140)) dar(60, t("gn.accion_subir"), () => {
        const h = W.NOMBRADAS.hongo_dorado;
        A.teletransportar(h.x, h.y + 90);
      });
      if (st.ritual && cerca(C[0], C[1] - 400, 160)) dar(30, t("gn.accion_portal"), () => A.teletransportar(R[0], R[1] + 1150));
      // las raíces
      if (pelea && pelea.fase === 2)
        for (const h of heridas)
          if (!h.sellada && cerca(h.x, h.y, 120))
            dar(20, t("gn.accion_sellar"), () => {
              jug.interactuando = 1;
              h.sellada = true;
              pelea.selladas++;
              pelea.segs = Math.max(14, pelea.segs - 5);
              HUD.aviso(t("gn.sellada", [pelea.selladas]), "#73D5DB");
            });
      if (st.vencido && cerca(R[0], R[1] + 1150, 180)) dar(30, t("gn.accion_volver"), () => A.teletransportar(C[0], C[1] - 300));
    },
    fondo(c, x0, y0, x1, y1) {
      c0 = c;
      if (x1 < Z.x0 - 2000) return;
      DIB.R(c, x0, y0, x1 - x0, y1 - y0, "#0C0F11");
      // la cámara de los custodios, como en la lámina: piso de lajas en anillos, el círculo tallado con su inscripción,
      // los doce huecos de luz con el trofeo de cada proeza y la escalera que baja de la bodega
      DIB.E(c, C[0], C[1], 830, 590, "#1C1F22");
      DIB.E(c, C[0], C[1], 760, 520, "#3A3D40");
      const rl = DIB.azar(606);
      c.lineWidth = 3;
      c.strokeStyle = "#2A2D30";
      for (let k = 1; k <= 4; k++) {
        c.beginPath();
        c.ellipse(C[0], C[1], 760 - k * 100, 520 - k * 68, 0, 0, Math.PI * 2);
        c.stroke();
        const n0 = 10 + k * 4;
        for (let i = 0; i < n0; i++) {
          const ang = (i / n0) * Math.PI * 2 + rl() * 0.1,
            r0 = 760 - k * 100,
            r1 = r0 + 100;
          c.beginPath();
          c.moveTo(C[0] + Math.cos(ang) * r0, C[1] + Math.sin(ang) * r0 * 0.684);
          c.lineTo(C[0] + Math.cos(ang) * r1, C[1] + Math.sin(ang) * r1 * 0.684);
          c.stroke();
          if (rl() < 0.35) DIB.alfa(c, 0.25, () => DIB.E(c, C[0] + Math.cos(ang + 0.1) * (r0 + 50), C[1] + Math.sin(ang + 0.1) * (r0 + 50) * 0.684, 26, 10, "#4A4E52"));
        }
      }
      const n = trofeos(),
        luz = st.ritual ? 1 : 0;
      // el círculo tallado: anillo con runas, ocho cuñas en el centro y las líneas de luz hacia cada hueco
      DIB.E(c, C[0], C[1], 340, 238, "#33363A");
      DIB.E(c, C[0], C[1], 250, 175, "#2E3134");
      DIB.E(c, C[0], C[1], 160, 112, "#36393C");
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * Math.PI * 2;
        DIB.L(c, C[0], C[1], C[0] + Math.cos(ang) * 160, C[1] + Math.sin(ang) * 112, "#24272A", 3);
      }
      const RUNAS = ["fehu", "uruz", "thurisaz", "ansuz", "raidho", "kenaz", "gebo", "wunjo", "hagalaz", "naudiz", "isa", "jera", "eihwaz", "perthro", "algiz", "sowilo", "tiwaz", "berkano", "ehwaz", "mannaz", "laguz", "ingwaz", "dagaz", "othala"];
      for (let k = 0; k < 24; k++) {
        const ang = (k / 24) * Math.PI * 2 - Math.PI / 2 + 0.13;
        FUTHARK.dibujar(c, RUNAS[k], C[0] + Math.cos(ang) * 205, C[1] + Math.sin(ang) * 143 + 9, 18, luz ? "#73D5DB" : "#1E2124", 3);
      }
      for (let k = 0; k < 12; k++) {
        const ang = (k / 12) * Math.PI * 2 - Math.PI / 2,
          hx = C[0] + Math.cos(ang) * 310,
          hy = C[1] + Math.sin(ang) * 218,
          lit = luz || k < n;
        if (lit) DIB.alfa(c, 0.7, () => DIB.L(c, C[0] + Math.cos(ang) * 250, C[1] + Math.sin(ang) * 175, hx, hy, "#73D5DB", 3));
        DIB.E(c, hx, hy, 40, 27, lit ? "#2E6A72" : "#191C1F");
        DIB.E(c, hx, hy, 32, 21, lit ? "#3E8A92" : "#24272A");
        if (lit) {
          DIB.alfa(c, 0.35 + Math.sin(J.t * 2.4 + k) * 0.12, () => DIB.E(c, hx, hy, 46, 31, "#73D5DB"));
          trofeo(k, hx, hy - 4);
        }
      }
      if (luz) DIB.alfa(c, 0.12 + Math.sin(J.t * 2) * 0.05, () => DIB.E(c, C[0], C[1], 340, 238, "#73D5DB"));
      // la escalera de piedra que sube a la bodega, con su baranda de madera
      for (let k = 0; k < 5; k++) {
        DIB.R(c, C[0] - 120 + k * 8, C[1] + 410 + k * 24, 240 - k * 16, 24, "#2A2D30");
        DIB.R(c, C[0] - 120 + k * 8, C[1] + 410 + k * 24, 240 - k * 16, 8, k % 2 ? "#4A4E52" : "#42464A");
      }
      DIB.R(c, C[0] - 134, C[1] + 400, 12, 130, "#5C4430");
      DIB.R(c, C[0] + 122, C[1] + 400, 12, 130, "#5C4430");
      // las raíces: un piso oscuro con venas, la luz azul goteando de las heridas
      const ra = radioArena();
      DIB.E(c, R[0], R[1], 2100 * ra, 1480 * ra, "#121719");
      DIB.E(c, R[0], R[1], 2000 * ra, 1400 * ra, "#1A2022");
      const rnd = DIB.azar(4242);
      c.lineCap = "round";
      for (let k = 0; k < 26; k++) {
        const a = rnd() * Math.PI * 2,
          r0 = 200 + rnd() * 600,
          r1 = r0 + 500 + rnd() * 900;
        c.beginPath();
        c.moveTo(R[0] + Math.cos(a) * r0, R[1] + Math.sin(a) * r0 * 0.7);
        c.quadraticCurveTo(R[0] + Math.cos(a + 0.3) * (r0 + r1) / 2, R[1] + Math.sin(a + 0.3) * ((r0 + r1) / 2) * 0.7, R[0] + Math.cos(a) * r1 * ra, R[1] + Math.sin(a) * r1 * 0.7 * ra);
        c.strokeStyle = k % 3 ? "#262E30" : "#2E3836";
        c.lineWidth = 18 + rnd() * 26;
        c.stroke();
      }
      // como en el boceto «Bajo las raíces»: charcos y arroyos de agua rúnica que bajan de las raíces roídas
      const rr = DIB.azar(9191);
      for (let k = 0; k < 14; k++) {
        const a = rr() * Math.PI * 2,
          d = (0.3 + rr() * 0.6) * ra,
          px = R[0] + Math.cos(a) * 1800 * d,
          py = R[1] + Math.sin(a) * 1250 * d,
          w = 80 + rr() * 160;
        DIB.E(c, px, py, w, w * 0.32, "#16262A");
        DIB.alfa(c, 0.35 + Math.sin(J.t * 1.3 + k) * 0.08, () => DIB.E(c, px - w * 0.1, py - 2, w * 0.7, w * 0.18, "#2E6A72"));
      }
      for (const p of pilares) {
        // el arroyo que sale del pie de cada raíz hacia el centro
        c.beginPath();
        c.moveTo(p.x + p.r * 0.3, p.y + 10);
        c.quadraticCurveTo((p.x + R[0]) / 2 + 120, (p.y + R[1]) / 2, p.x + (R[0] - p.x) * 0.55, p.y + (R[1] - p.y) * 0.55);
        c.strokeStyle = "#173236";
        c.lineWidth = 26;
        c.stroke();
        DIB.alfa(c, 0.55 + Math.sin(J.t * 2 + p.sem) * 0.15, () => {
          c.strokeStyle = "#4FA6AE";
          c.lineWidth = 7;
          c.stroke();
        });
      }
      // los troncos de raíz caídos sobre el piso mojado
      for (let k = 0; k < 6; k++) {
        const a = rr() * Math.PI * 2,
          d = (0.5 + rr() * 0.35) * ra,
          px = R[0] + Math.cos(a) * 1800 * d,
          py = R[1] + Math.sin(a) * 1250 * d,
          l = 160 + rr() * 200,
          g = a + Math.PI / 2 + (rr() - 0.5);
        const ux = Math.cos(g) * l,
          uy = Math.sin(g) * l * 0.5;
        DIB.P(c, [px - ux, py - uy - 10, px + ux, py + uy - 10, px + ux, py + uy + 14, px - ux, py - uy + 14], "#2A241C");
        DIB.P(c, [px - ux, py - uy - 10, px + ux, py + uy - 10, px + ux, py + uy - 2, px - ux, py - uy - 2], "#3E4A2E");
        DIB.E(c, px + ux, py + uy + 2, 10, 13, "#B89E78");
      }
      // el portal de vuelta, cuando ya no queda nada que pelear
      if (st.vencido) DIB.alfa(c, 0.5 + Math.sin(J.t * 3) * 0.15, () => DIB.E(c, R[0], R[1] + 1150, 130, 50, "#73D5DB"));
      // las heridas de luz por sellar
      if (pelea && pelea.fase >= 2)
        for (const h of heridas) {
          if (h.sellada) DIB.E(c, h.x, h.y, 40, 16, "#2E3836");
          else DIB.alfa(c, 0.6 + Math.sin(J.t * 5 + h.x) * 0.25, () => DIB.E(c, h.x, h.y, 50, 20, "#73D5DB"));
        }
    },
    cuerpos(f) {
      if (aqui()) f(svan.x, svan.y, 36);
    },
    objetos(lista, visible, c) {
      if (!aqui()) return;
      c0 = c;
      // la pared curva de la cámara, con pilares de runas, el arco rúnico del portal, el estandarte de Algiz y lo que
      // dejaron los custodios: barriles, cofres, cántaros y rollos
      lista.push({
        y: C[1] - 520,
        f: () => {
          const tramo = (a0, a1) => {
            const p0 = [C[0] + Math.cos(a0) * 800, C[1] + Math.sin(a0) * 545],
              p1 = [C[0] + Math.cos(a1) * 800, C[1] + Math.sin(a1) * 545],
              alto = 380;
            const lado = Math.cos((a0 + a1) / 2) < 0;
            DIB.P(c, [p0[0], p0[1], p1[0], p1[1], p1[0], p1[1] - alto, p0[0], p0[1] - alto], lado ? "#2C3034" : "#353A3E");
            // las hiladas de piedra
            for (let f = 1; f < 6; f++) DIB.L(c, p0[0], p0[1] - f * 64, p1[0], p1[1] - f * 64, "#24282C", 2);
            for (let f = 0; f < 6; f++) {
              const u = (f % 2 ? 0.33 : 0.66),
                x = p0[0] + (p1[0] - p0[0]) * u,
                y = p0[1] + (p1[1] - p0[1]) * u - f * 64;
              DIB.L(c, x, y, x, y - 64, "#24282C", 2);
            }
          };
          const N = 14,
            a0 = Math.PI * 1.04,
            a1 = Math.PI * 1.96;
          for (let k = 0; k < N; k++) tramo(a0 + ((a1 - a0) * k) / N, a0 + ((a1 - a0) * (k + 1)) / N);
          // los pilares con runas talladas
          ["ansuz", "algiz", "eihwaz", "othala", "dagaz"].forEach((rn, k) => {
            const ang = a0 + ((a1 - a0) * (k + 0.5)) / 5;
            if (k === 2) return; // el del centro es el portal
            const x = C[0] + Math.cos(ang) * 780,
              y = C[1] + Math.sin(ang) * 532;
            DIB.P(c, [x - 46, y, x - 46, y - 420, x + 46, y - 420, x + 46, y], "#3E4246");
            DIB.P(c, [x - 46, y, x - 46, y - 420, x - 6, y - 420, x - 6, y], "#30343A");
            DIB.R(c, x - 56, y - 440, 112, 26, "#46494C");
            FUTHARK.dibujar(c, rn, x + 4, y - 200, 60, st.ritual ? "#73D5DB" : "#5E6A6E", 5);
          });
          // el portal: arco de piedra con runas que se encienden
          const px = C[0],
            py = C[1] - 420;
          DIB.P(c, [px - 170, py + 10, px - 170, py - 300, px - 110, py - 380, px + 110, py - 380, px + 170, py - 300, px + 170, py + 10], "#43474B");
          DIB.P(c, [px - 170, py + 10, px - 170, py - 300, px - 110, py - 380, px, py - 380, px, py + 10], "#373B3F");
          DIB.P(c, [px - 112, py + 10, px - 112, py - 262, px - 66, py - 316, px + 66, py - 316, px + 112, py - 262, px + 112, py + 10], st.ritual ? "#73D5DB" : "#101214");
          if (st.ritual) {
            DIB.alfa(c, 0.5 + Math.sin(J.t * 3) * 0.2, () => DIB.P(c, [px - 76, py, px - 76, py - 230, px - 44, py - 272, px + 44, py - 272, px + 76, py - 230, px + 76, py], "#E6F6F8"));
            DIB.alfa(c, 0.35, () => DIB.P(c, [px - 112, py + 10, px + 112, py + 10, px + 200, py + 140, px - 200, py + 140], "#73D5DB"));
          }
          const arco = ["raidho", "algiz", "eihwaz", "dagaz", "othala", "dagaz", "eihwaz", "algiz", "raidho"];
          arco.forEach((rn, k) => {
            const ang = Math.PI + (k / (arco.length - 1)) * Math.PI;
            FUTHARK.dibujar(c, rn, px + Math.cos(ang) * 142, py - 160 + Math.sin(ang) * 190 + 12, 24, st.ritual ? "#73D5DB" : "#4E5458", 3);
          });
          // el estandarte rojo con Algiz, a la derecha
          const bx = C[0] + 560,
            by = C[1] - 560;
          DIB.P(c, [bx - 60, by - 200, bx + 60, by - 200, bx + 60, by, bx, by - 30, bx - 60, by], "#9C2315");
          DIB.P(c, [bx - 60, by - 200, bx, by - 200, bx, by - 30, bx - 60, by], "#7A1A10");
          DIB.R(c, bx - 70, by - 210, 140, 10, "#5C4430");
          FUTHARK.dibujar(c, "algiz", bx, by - 50, 90, "#E0B2B2", 6);
        },
      });
      // lo que dejaron los custodios contra la pared
      const COSAS_CAMARA = [
        [-560, -390, "barril"], [-500, -430, "barril"], [-420, -470, "cofre"], [-300, -500, "cantaro"], [-250, -505, "rollos"],
        [260, -505, "cofre"], [360, -488, "cantaro"], [430, -462, "rollos"], [620, -340, "barril"], [660, -290, "cantaro"], [690, -230, "rollos"],
      ];
      for (const [dx, dy, tipo] of COSAS_CAMARA) {
        const x = C[0] + dx,
          y = C[1] + dy;
        if (visible(x, y)) lista.push({ x, y, f: () => cosaCamara(tipo, x, y) });
      }
      if (visible(svan.x, svan.y)) lista.push({ x: svan.x, y: svan.y, f: () => GENTE.dibujar(c, "svanhild", svan.x, svan.y, J.t, svan.mira) });
      // los pilares de raíz y la raíz madre
      const raiz = (x, y, w, alto, sem) => {
        // una raíz de Yggdrasil como en el boceto: corteza con musgo, roída hasta la madera clara, y el agua rúnica que
        // chorrea por la herida hasta un charco al pie
        const r = DIB.azar(sem);
        DIB.E(c, x, y, w * 1.5, w * 0.48, "#0A0D0E");
        DIB.alfa(c, 0.6, () => DIB.E(c, x + w * 0.2, y + w * 0.25, w * 0.9, w * 0.2, "#2E6A72"));
        // las raíces que se abren en el piso
        for (let k = 0; k < 5; k++) {
          const ang = Math.PI * (0.05 + k * 0.22);
          DIB.P(c, [x + Math.cos(ang) * w * 0.6, y, x + Math.cos(ang) * w * 2.3, y + Math.sin(ang) * w * 0.5, x + Math.cos(ang) * w * 0.9, y - 18], k % 2 ? "#2A241C" : "#34402A");
        }
        // el tronco: mitad izquierda en sombra, la derecha con luz y musgo
        const tronco = [x - w, y, x - w * 0.72, y - alto * 0.4, x - w * 0.56, y - alto, x + w * 0.56, y - alto, x + w * 0.76, y - alto * 0.4, x + w, y];
        DIB.P(c, tronco, "#2A251E");
        DIB.P(c, [x + w * 0.05, y, x + w * 0.15, y - alto, x + w * 0.56, y - alto, x + w * 0.76, y - alto * 0.4, x + w, y], "#3A3328");
        DIB.P(c, [x + w * 0.3, y - alto * 0.15, x + w * 0.4, y - alto * 0.85, x + w * 0.6, y - alto * 0.8, x + w * 0.8, y - alto * 0.35, x + w * 0.85, y - alto * 0.12], "#3E4E2C");
        for (let k = 0; k < 6; k++) {
          const bx = x - w * 0.6 + r() * w * 1.1;
          DIB.L(c, bx, y - alto * (0.15 + r() * 0.7), bx + (r() - 0.5) * 30, y - alto * (0.05 + r() * 0.3), "#1A1612", 6);
        }
        // la herida roída: madera clara astillada
        const hy = y - alto * (0.32 + r() * 0.18),
          hx = x - w * 0.1,
          hw = w * 0.55,
          hh = alto * 0.16;
        DIB.P(c, [hx - hw, hy, hx - hw * 0.6, hy - hh, hx + hw * 0.5, hy - hh * 1.1, hx + hw, hy - hh * 0.2, hx + hw * 0.7, hy + hh * 0.5, hx - hw * 0.4, hy + hh * 0.6], "#B89E78");
        DIB.P(c, [hx - hw * 0.2, hy - hh * 0.9, hx + hw * 0.5, hy - hh * 1.1, hx + hw, hy - hh * 0.2, hx + hw * 0.7, hy + hh * 0.5, hx + hw * 0.1, hy + hh * 0.3], "#D8C3A0");
        for (let k = 0; k < 6; k++) {
          const sx = hx - hw * 0.7 + (k / 5) * hw * 1.5;
          DIB.P(c, [sx - 6, hy + hh * 0.5, sx + 6, hy + hh * 0.5, sx + (r() - 0.5) * 10, hy + hh * (1 + r() * 0.8)], "#C8B08A");
          DIB.P(c, [sx - 5, hy - hh * 0.9, sx + 5, hy - hh * 0.9, sx + (r() - 0.5) * 10, hy - hh * (1.4 + r() * 0.5)], "#8A7458");
        }
        // el agua rúnica que cae de la herida hasta el pie
        const baja = window.CALIDAD && CALIDAD.nivel === "baja";
        for (let k = 0; k < 2; k++) {
          const cx = hx - hw * 0.3 + k * hw * 0.7;
          DIB.alfa(c, 0.75, () => DIB.R(c, cx - 4, hy + hh * 0.5, 8, y - hy - hh * 0.5 - 6, "#4FA6AE"));
          DIB.alfa(c, 0.9, () => DIB.R(c, cx - 1.5, hy + hh * 0.5, 3, y - hy - hh * 0.5 - 6, "#BDF0F2"));
          if (!baja) {
            const g = (J.t * 0.9 + sem * 0.31 + k * 0.5) % 1;
            DIB.alfa(c, 0.9, () => DIB.E(c, cx, hy + hh * 0.5 + g * (y - hy - hh * 0.5), 5, 9, "#E6F6F8"));
          }
        }
      };
      // las agujas de roca alrededor de la arena
      const aguja = (x, y, h, sem) => {
        const r = DIB.azar(sem),
          w = h * (0.22 + r() * 0.1);
        DIB.E(c, x, y, w * 1.3, w * 0.4, "#0A0D0E");
        DIB.P(c, [x - w, y, x - w * 0.3, y - h * 0.7, x + w * 0.05, y - h, x + w * 0.4, y - h * 0.6, x + w, y], "#1C2226");
        DIB.P(c, [x + w * 0.05, y - h, x + w * 0.4, y - h * 0.6, x + w, y, x + w * 0.2, y], "#2C3438");
        DIB.L(c, x - w * 0.4, y - h * 0.3, x - w * 0.1, y - h * 0.55, "#12161A", 3);
      };
      const ra2 = radioArena();
      for (let k = 0; k < 22; k++) {
        const ang = (k / 22) * Math.PI * 2 + 0.13,
          px = R[0] + Math.cos(ang) * 2080 * ra2,
          py = R[1] + Math.sin(ang) * 1470 * ra2,
          hh = 140 + ((k * 53) % 7) * 34;
        if (visible(px, py)) lista.push({ x: px, y: py, f: () => aguja(px, py, hh, 300 + k) });
      }
      for (const p of pilares) if (visible(p.x, p.y)) lista.push({ x: p.x, y: p.y, f: () => raiz(p.x, p.y, p.r, 1400, p.sem + 11) });
      const m = madre();
      if (visible(m[0], m[1])) lista.push({ x: m[0], y: m[1], f: () => raiz(m[0], m[1], 300, 1800, 77) });
      // Góinn: la cadena de segmentos sigue a la cabeza; cada uno se ordena por su línea del piso
      if (pelea) {
        const segs = cuerpo(),
          p = pelea,
          muere = p.muerte != null ? Math.min(1, p.muerte / 2.2) : 0;
        // el cuerpo, como en el boceto de Alejandro: placas en bloque, verde oscuro con la panza clara, púas negras y
        // el veneno negro que chorrea; la luz llega de arriba a la derecha y la mitad izquierda queda en sombra
        const ancho = (i) => (54 - (i / segs.length) * 40) * (1 - muere * 0.3);
        const GV = { osc: "#2B3A28", med: "#3B5034", luz: "#536B47", panza: "#8C8A5C", panzaOsc: "#6E6C46", pua: "#121212", veneno: "#0A0A0A" };
        const placa = (x, y, r, i) => {
          const h = r * 2,
            w = r * 1.08,
            k = r * 0.38;
          // la unión con la placa siguiente
          const nx = segs[i + 1];
          if (nx) {
            const r2 = ancho(i + 1);
            DIB.P(c, [x, y - h, nx.x, nx.y - r2 * 2, nx.x, nx.y, x, y], GV.med);
            DIB.P(c, [x, y - h, nx.x, nx.y - r2 * 2, nx.x, nx.y - r2 * 1.55, x, y - h * 0.77], GV.luz);
            DIB.P(c, [x, y - r * 0.55, nx.x, nx.y - r2 * 0.55, nx.x, nx.y, x, y], GV.panza);
          }
          // la placa: octógono en bloque, mitad izquierda en sombra
          DIB.P(c, [x - w + k, y, x + w - k, y, x + w, y - k, x + w, y - h + k, x + w - k, y - h, x - w + k, y - h, x - w, y - h + k, x - w, y - k], GV.med);
          DIB.P(c, [x - w + k, y, x, y, x, y - h, x - w + k, y - h, x - w, y - h + k, x - w, y - k], GV.osc);
          DIB.P(c, [x - w * 0.2, y - h, x + w - k, y - h, x + w, y - h + k, x + w, y - h * 0.72, x - w * 0.1, y - h * 0.8], GV.luz);
          DIB.P(c, [x - w + k, y, x + w - k, y, x + w, y - k, x + w, y - r * 0.55, x - w, y - r * 0.55, x - w, y - k], GV.panza);
          DIB.P(c, [x - w + k, y, x, y, x, y - r * 0.55, x - w, y - r * 0.55, x - w, y - k], GV.panzaOsc);
          // la púa del lomo
          if (i % 2 === 0) DIB.P(c, [x - r * 0.28, y - h + 2, x + r * 0.05, y - h - r * 0.7, x + r * 0.3, y - h + 2], GV.pua);
          // el veneno que chorrea por el costado
          if (i % 3 === 1) {
            const g = (J.t * 0.5 + i * 0.29) % 1;
            DIB.P(c, [x - w * 0.5 - 3, y - h * 0.7, x - w * 0.5 + 3, y - h * 0.7, x - w * 0.5 + 2, y - h * 0.35, x - w * 0.5 - 2, y - h * 0.35], GV.veneno);
            DIB.alfa(c, 1 - g, () => DIB.E(c, x - w * 0.5, y - h * 0.35 + g * h * 0.35, 3, 4 + g * 2, GV.veneno));
          }
        };
        for (let i = segs.length - 1; i >= 1; i--) {
          const a = segs[i];
          if (!visible(a.x, a.y)) continue;
          const r = ancho(i);
          lista.push({
            x: a.x,
            y: a.y,
            f: () =>
              DIB.alfa(c, 1 - muere * 0.6, () => {
                DIB.E(c, a.x, a.y + 4, r * 1.4, r * 0.4, "rgba(4,6,6,0.55)");
                // la punta de la cola: un cuerno de placas que se afina
                if (i === segs.length - 1) {
                  const q = segs[i - 1],
                    dx = a.x - q.x,
                    dy = a.y - q.y,
                    l = Math.hypot(dx, dy) || 1;
                  DIB.P(c, [a.x, a.y - r * 2, a.x + (dx / l) * r * 2.6, a.y + (dy / l) * r * 2.6 - r * 2.4, a.x, a.y], GV.med);
                  DIB.P(c, [a.x, a.y - r * 2, a.x + (dx / l) * r * 2.6, a.y + (dy / l) * r * 2.6 - r * 2.4, a.x, a.y - r * 1.3], GV.luz);
                }
                placa(a.x, a.y, r, i);
              }),
          });
        }
        const cb = p.cab;
        lista.push({
          x: cb.x,
          pie: cb.y,
          y: cb.y + 1,
          f: () =>
            DIB.alfa(c, 1 - muere * 0.6, () => {
              const lev = p.estado === "aviso" ? -30 : p.estado === "expuesta" ? 10 : -10,
                hy = cb.y - 70 + lev - p.golpe * 20,
                lado = Math.cos(p.mira) < 0 ? -1 : 1,
                incl = Math.max(-0.35, Math.min(0.35, Math.sin(p.mira) * 0.4)),
                abre = p.estado === "aviso" ? 0.42 : p.estado === "expuesta" ? 0.18 : 0.08;
              DIB.E(c, cb.x, cb.y + 6, 90, 28, "#060808");
              if (golpeable()) DIB.alfa(c, 0.5 + Math.sin(J.t * 8) * 0.2, () => DIB.E(c, cb.x, cb.y + 8, 100, 32, "#FFD98A"));
              // el cuello, de la cabeza al piso
              const r0 = ancho(0);
              DIB.P(c, [cb.x - r0 * 1.1, cb.y, cb.x + r0 * 1.1, cb.y, cb.x + r0 * 0.9, hy + 10, cb.x - r0 * 0.9, hy + 10], GV.med);
              DIB.P(c, [cb.x - r0 * 1.1, cb.y, cb.x, cb.y, cb.x, hy + 10, cb.x - r0 * 0.9, hy + 10], GV.osc);
              DIB.P(c, [cb.x - lado * r0 * 0.2, cb.y, cb.x + lado * r0 * 0.9, cb.y, cb.x + lado * r0 * 0.7, hy + 20, cb.x - lado * r0 * 0.1, hy + 20], GV.panza);
              c.save();
              c.translate(cb.x, hy);
              c.scale(lado, 1);
              c.rotate(incl * lado);
              // el cuerno de atrás, más oscuro, y las púas de la nuca
              DIB.P(c, [-34, -40, -14, -46, -98, -118], "#B8AC98");
              DIB.P(c, [-60, -30, -46, -50, -36, -30], GV.pua);
              DIB.P(c, [-80, -14, -70, -38, -58, -12], GV.pua);
              // la mandíbula de abajo: baja en el aviso y deja ver la boca roja
              c.save();
              c.translate(-10, 4);
              c.rotate(abre);
              DIB.P(c, [-40, -4, 104, 0, 112, 12, 96, 26, -30, 24], GV.osc);
              DIB.P(c, [-30, 12, 100, 14, 96, 26, -30, 24], GV.panza);
              DIB.P(c, [-20, -4, 104, 0, 100, 6, -20, 4], "#9C2315");
              for (let k = 0; k < 3; k++) DIB.P(c, [96 - k * 26, 0, 90 - k * 26, -16 + k * 3, 84 - k * 26, 0], "#F2ECEC");
              c.restore();
              // la boca por dentro
              if (abre > 0.1) {
                DIB.P(c, [-14, 2, 104, 2, 100, 2 + abre * 110, -14, 6 + abre * 40], "#5E130D");
                DIB.P(c, [10, 4, 90, 4, 82, abre * 70, 10, 6 + abre * 30], "#C8402D");
                DIB.P(c, [30, 6, 70, 6, 60, abre * 50, 34, 8 + abre * 20], "#9C2315");
              }
              // el cráneo en bloque: hocico cuadrado, la cara de arriba con luz
              DIB.P(c, [-56, -36, 40, -46, 108, -32, 120, -14, 116, 4, -50, 6], GV.med);
              DIB.P(c, [-50, -40, 40, -50, 104, -36, 40, -34, -44, -26], GV.luz);
              DIB.P(c, [-56, -36, -44, -26, -40, 6, -50, 6], GV.osc);
              DIB.P(c, [60, -4, 116, -4, 116, 4, 60, 6], GV.panzaOsc);
              // los colmillos de arriba
              for (let k = 0; k < 4; k++) DIB.P(c, [110 - k * 22, 2, 104 - k * 22, 22 + (k === 0 ? 10 : 0), 98 - k * 22, 2], "#F2ECEC");
              // el ojo amarillo
              DIB.E(c, 56, -26, 9, 9, "#FFD98A");
              DIB.E(c, 58, -26, 3, 6, "#111111");
              // el cuerno de adelante, hueso claro
              DIB.P(c, [-22, -44, 2, -48, -76, -126], "#E6DCCB");
              DIB.P(c, [-22, -44, -10, -46, -76, -126], "#CFC3AF");
              // el veneno negro que cae de los colmillos
              for (let k = 0; k < 3; k++) {
                const g = (J.t * 0.9 + k * 0.37) % 1,
                  gx = 104 - k * 30;
                DIB.P(c, [gx - 3, 14, gx + 3, 14, gx + 1, 30 + abre * 40, gx - 1, 30 + abre * 40], GV.veneno);
                DIB.alfa(c, 1 - g, () => DIB.E(c, gx, 34 + abre * 40 + g * 70, 3, 5, GV.veneno));
              }
              c.restore();
            }),
        });
      }
    },
    luces(dar) {
      if (!aqui()) return;
      dar({ x: C[0], y: C[1], r: st.ritual ? 900 : 380, col: "#73D5DB", f: st.ritual ? 0.8 : 0.35 });
      dar({ x: svan.x, y: svan.y - 60, r: 260, col: "#FFD98A", f: 0.6 });
      dar({ x: C[0], y: C[1] + 440, r: 260, col: "#FFD98A", f: 0.5 });
      // las antorchas de la cámara, contra la pared
      for (const dx of [-560, 560]) dar({ x: C[0] + dx, y: C[1] - 420, r: 340, col: "#FFD98A", f: 0.45 });
      dar({ x: R[0], y: R[1], r: 1600, col: "#73D5DB", f: 0.45 });
      const m = madre();
      dar({ x: m[0], y: m[1] - 200, r: 700, col: "#73D5DB", f: 0.6 });
      for (const p of pilares) dar({ x: p.x, y: p.y - 300, r: 420, col: "#73D5DB", f: 0.35 });
      if (pelea && pelea.fase >= 2) for (const h of heridas) if (!h.sellada) dar({ x: h.x, y: h.y, r: 260, col: "#73D5DB", f: 0.9 });
      if (pelea) dar({ x: pelea.cab.x, y: pelea.cab.y - 60, r: 300, col: "#FFD98A", f: 0.35 });
    },
    hud() {
      J.jefeHud = pelea && pelea.muerte == null ? { nombre: t("gn.nombre"), frac: pelea.vida / VIDA, ataduras: 0, ataque: ataqueTxt, accion: accionTxt } : null;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { puerta, trofeos, abierta: () => !!(st && st.abierta), vencido: () => !!(st && st.vencido), pelea: () => pelea, heridas: () => heridas };
})();
