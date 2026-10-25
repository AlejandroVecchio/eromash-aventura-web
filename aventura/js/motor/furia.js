// ---------- la Furia y las habilidades activas (sistema FURIA) ----------
// La Furia es la sangre caliente de Eromash, como la Ira del guerrero del WoW: arranca vacía, se llena pegando y
// recibiendo golpes, y se enfría sola fuera de pelea. Con ella se usan tres habilidades activas, una por rama del
// árbol (ARBOL.sumar), cada una con su tecla y su espera:
//   1 · Rugido de Björn (Oso): aturde lo que está cerca, lo deja expuesto y endurece la piel de Eromash.
//   2 · Salto del lobo (Lobo): salta hacia la criatura de enfrente sin que nada lo toque y pega al caer.
//   3 · Bandada (Cuervo): suelta cuervos que buscan a las criaturas cercanas, pican y las marcan.
// Con teclado van en casillas de la barra (hook `cosasBarra` de BARRA), con mando L2 + □ △ ○ (CONTROLES.COMBOS).
// Textos `fu.` en textos/furia.js. Nada se guarda: la Furia arranca en 0 en cada partida.
window.FURIA = (function () {
  "use strict";
  let A, J, jug;
  const t = (k, v) => I18N.t(k, v);
  const MAX = 100,
    POR_GOLPE = 5,
    POR_CRITICO = 3,
    POR_HERIDA = 0.6, // por punto de vida perdido
    ENFRIA = 8, // por segundo, fuera de pelea
    ENFRIA_TRAS = 5; // segundos sin pelear para que empiece a enfriarse
  // las habilidades: rama, acción, fila y columna en el árbol, costo y espera por rango
  const HAB = {
    rugido: { rama: "oso", accion: "hab1", f: 2, c: 2, pide: "zarpazo", runa: "uruz", costo: [40, 35], espera: [8, 7], v: 280 },
    salto: { rama: "lobo", accion: "hab2", f: 2, c: 0, pide: "jauria", runa: "raidho", costo: [30, 25], espera: [5, 4], v: 1.6 },
    bandada: { rama: "cuervo", accion: "hab3", f: 2, c: 0, pide: "memoria", runa: "ansuz", costo: [45, 40], espera: [10, 9], v: 5 },
  };
  const IDS = Object.keys(HAB);
  const RUGIDO_SEG = 5,
    RUGIDO_EXPONE = 0.15,
    RUGIDO_ARMADURA = 20,
    MARCA_SEG = 6,
    MARCA = 0.12,
    SALTO_LARGO = 330,
    SALTO_SEG = 0.42, // lo mismo que dura el salto de siempre, así se ve el mismo arco
    BASE = 28; // el daño de base de una habilidad, antes del multiplicador de Eromash
  let furia = 0,
    sinPelear = 99,
    rugidoT = 0;
  const espera = {};
  let salto = null; // { x0, y0, x1, y1, t }
  const cuervos = []; // { x, y, e, t, vuelta }
  const anillos = []; // { x, y, r, R, t, col }

  // ---------- las cuentas ----------
  const rango = (id) => (window.ARBOL ? ARBOL.rango(id) : 0);
  const sabe = (id) => rango(id) > 0;
  const costo = (id) => HAB[id].costo[Math.min(1, rango(id) - 1)] || HAB[id].costo[0];
  const esperaDe = (id) => HAB[id].espera[Math.min(1, rango(id) - 1)] || HAB[id].espera[0];
  const alguna = () => IDS.some(sabe);
  function sumar(n) {
    furia = Math.max(0, Math.min(MAX, furia + n));
    sinPelear = 0;
  }
  const base = () => BASE * (J.mulDano || 1);
  // el golpe de una habilidad pasa por los modDano de todos (bestiario, contratos, marcas) y avisa con alPegar
  function pegar(e, dano, ox, oy, id, empuje) {
    const info = { d: { habilidad: id }, critico: false, sorpresa: false, contra: false };
    for (const s of window.SISTEMAS) if (s.modDano) dano = s.modDano(dano, e, info);
    dano = Math.round(dano);
    A.chispa(e.x, e.y - 30);
    A.numero(e.x, e.y - 60, dano, HAB[id] ? colDe(id) : null, true);
    const murio = A.CB.golpear(J, e, dano, ox, oy, empuje || 1);
    window.SISTEMAS.forEach((s) => s.alPegar && s.alPegar(e, dano, info, murio));
    return murio;
  }
  const colDe = (id) => (window.ARBOL ? ARBOL.RAMAS[HAB[id].rama].col : "#FFD98A");
  const vivas = () => A.enemigos.filter((e) => e.activo && !e.muerto);

  // ---------- usar ----------
  function puede(id) {
    if (!sabe(id)) return "fu.no_sabe";
    if (jug.muerto || J.modo !== "juego" || J.dentro) return "fu.ahora_no";
    if ((espera[id] || 0) > 0) return "fu.espera";
    if (furia < costo(id)) return "fu.sin_furia";
    if (id === "salto" && salto) return "fu.ahora_no";
    return null;
  }
  function usar(id) {
    const no = puede(id);
    if (no) {
      if (no !== "fu.ahora_no") HUD.aviso(t(no, [t("ab." + id), Math.ceil(espera[id] || 0)]));
      return false;
    }
    const ok = id === "rugido" ? rugir() : id === "salto" ? saltar() : soltarBandada();
    if (!ok) return false;
    furia -= costo(id);
    espera[id] = esperaDe(id);
    sinPelear = 0;
    return true;
  }
  function rugir() {
    const R = HAB.rugido.v * (rango("rugido") >= 2 ? 1.2 : 1);
    let n = 0;
    for (const e of vivas()) {
      if (Math.hypot(e.x - jug.x, (e.y - jug.y) * 1.25) > R) continue;
      e.aturdido = Math.max(e.aturdido || 0, e.lider || e.patron ? 0.8 : 1.4);
      e.rugidoHasta = J.t + RUGIDO_SEG;
      A.textoFlotante(e.x, e.y - 110, "!", "#C8402D");
      n++;
    }
    rugidoT = RUGIDO_SEG;
    if (window.RPG) RPG.recalcular();
    anillos.push({ x: jug.x, y: jug.y, r: 20, R, t: 0, col: "#C8402D" });
    J.sacudir && J.sacudir(10);
    if (window.ANIMA) ANIMA.gesto("susto");
    if (window.SONIDO) SONIDO.tocar("rugido", { vol: 0.7, tono: 0.72 });
    A.textoFlotante(jug.x, jug.y - 150, t("ab.rugido"), "#C8402D");
    return true;
  }
  function saltar() {
    // hacia la criatura más cercana en la dirección en que mira, si no, derecho adelante
    const dx0 = jug.dir[0],
      dy0 = jug.dir[1];
    let mejor = null,
      dm = SALTO_LARGO + 60;
    for (const e of vivas()) {
      const dx = e.x - jug.x,
        dy = e.y - jug.y,
        l = Math.hypot(dx, dy);
      if (l > dm || l < 20 || (dx * dx0 + dy * dy0) / l < 0.35) continue;
      dm = l;
      mejor = e;
    }
    let x1, y1;
    if (mejor) {
      const l = Math.hypot(mejor.x - jug.x, mejor.y - jug.y);
      x1 = mejor.x - ((mejor.x - jug.x) / l) * 50;
      y1 = mejor.y - ((mejor.y - jug.y) / l) * 30;
      jug.dir = [(mejor.x - jug.x) / l, (mejor.y - jug.y) / l];
    } else {
      x1 = jug.x + dx0 * SALTO_LARGO;
      y1 = jug.y + dy0 * SALTO_LARGO;
    }
    // no atraviesa paredes ni cae en el agua: se queda en el último lugar libre del camino
    let ux = jug.x,
      uy = jug.y;
    for (let k = 1; k <= 12; k++) {
      const x = jug.x + ((x1 - jug.x) * k) / 12,
        y = jug.y + ((y1 - jug.y) * k) / 12;
      if (!A.W.libre(x, y, 14) || A.W.hayMuro(jug.x, jug.y, x, y)) break;
      ux = x;
      uy = y;
    }
    if (Math.hypot(ux - jug.x, uy - jug.y) < 30 && !mejor) return false;
    salto = { x0: jug.x, y0: jug.y, x1: ux, y1: uy, t: 0 };
    jug.salto = SALTO_SEG;
    jug.saltoLargo = false;
    jug.inv = Math.max(jug.inv || 0, SALTO_SEG + 0.15);
    if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.5, tono: 0.8 });
    return true;
  }
  function caer() {
    const k = HAB.salto.v + (rango("salto") >= 2 ? 0.4 : 0);
    let n = 0;
    for (const e of vivas()) if (Math.hypot(e.x - jug.x, (e.y - jug.y) * 1.25) < 150) pegar(e, base() * k, jug.x, jug.y, "salto", 1.6), n++;
    A.polvareda(jug.x, jug.y, 14);
    anillos.push({ x: jug.x, y: jug.y, r: 20, R: 150, t: 0, col: "#7BC86C" });
    J.sacudir && J.sacudir(n ? 7 : 4);
    J.hitstop = Math.max(J.hitstop || 0, n ? 0.06 : 0);
    if (window.SONIDO) SONIDO.tocar(n ? "golpeFuerte" : "caida", { vol: 0.7 });
  }
  function soltarBandada() {
    const cerca = vivas()
      .filter((e) => Math.hypot(e.x - jug.x, e.y - jug.y) < 440 && !A.W.hayMuro(jug.x, jug.y, e.x, e.y))
      .sort((a, b) => Math.hypot(a.x - jug.x, a.y - jug.y) - Math.hypot(b.x - jug.x, b.y - jug.y));
    if (!cerca.length) {
      HUD.aviso(t("fu.nadie"));
      return false;
    }
    const n = HAB.bandada.v + (rango("bandada") >= 2 ? 2 : 0);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      cuervos.push({ x: jug.x + Math.cos(a) * 30, y: jug.y - 60 + Math.sin(a) * 16, e: cerca[i % cerca.length], t: -i * 0.06, a });
    }
    if (window.SONIDO) SONIDO.tocar("cuervos", { vol: 0.6 });
    A.textoFlotante(jug.x, jug.y - 150, t("ab.bandada"), "#73D5DB");
    return true;
  }

  // ---------- íconos de la barra ----------
  function iconos() {
    IDS.forEach((id) =>
      INVENTARIO.iconoDe("hab_" + id, (c) => {
        const col = colDe(id);
        c.fillStyle = "#1A1614";
        c.beginPath();
        c.arc(0, 0, 34, 0, Math.PI * 2);
        c.fill();
        c.lineWidth = 4;
        c.strokeStyle = col;
        c.stroke();
        FUTHARK.dibujar(c, HAB[id].runa, 0, 20, 38, col, 5);
      }),
    );
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      iconos();
      if (window.RPG) RPG.aporte((s) => rugidoT > 0 && (s.armadura += RUGIDO_ARMADURA));
    },
    alEmpezar() {
      furia = 0;
      sinPelear = 99;
      rugidoT = 0;
      salto = null;
      cuervos.length = anillos.length = 0;
      IDS.forEach((id) => (espera[id] = 0));
    },
    actualizar(dt) {
      if (J.modo === "juego") for (const id of IDS) if (CONTROLES.recien(HAB[id].accion)) usar(id);
      IDS.forEach((id) => espera[id] > 0 && (espera[id] -= dt));
      if (rugidoT > 0 && (rugidoT -= dt) <= 0 && window.RPG) RPG.recalcular();
      // se enfría fuera de pelea
      sinPelear += dt;
      if (sinPelear > ENFRIA_TRAS && furia > 0) furia = Math.max(0, furia - ENFRIA * dt);
      // el salto: un arco por el aire con la estela del lobo
      if (salto) {
        salto.t += dt;
        const k = Math.min(1, salto.t / SALTO_SEG),
          e = k * (2 - k);
        jug.x = salto.x0 + (salto.x1 - salto.x0) * e;
        jug.y = salto.y0 + (salto.y1 - salto.y0) * e;
        if (Math.random() < 0.8) J.fx.push({ x: jug.x + (Math.random() - 0.5) * 30, y: jug.y - 40 - Math.sin(k * Math.PI) * 50 + (Math.random() - 0.5) * 30, vx: 0, vy: -20, t: 0.35, c: "rgba(123,200,108,0.55)", s: 8, g: 0 });
        if (k >= 1) {
          salto = null;
          caer();
        }
      }
      // los cuervos: salen en abanico, buscan a su criatura y pican
      for (let i = cuervos.length - 1; i >= 0; i--) {
        const q = cuervos[i];
        q.t += dt;
        if (q.t < 0) continue;
        if (!q.vuelta && (!q.e || q.e.muerto || !q.e.activo)) {
          const otra = vivas().find((e) => Math.hypot(e.x - q.x, e.y - q.y) < 440);
          if (otra) q.e = otra;
          else q.vuelta = true;
        }
        const tx = q.vuelta ? jug.x : q.e.x,
          ty = q.vuelta ? jug.y - 80 : q.e.y - 40,
          dx = tx - q.x,
          dy = ty - q.y,
          l = Math.hypot(dx, dy),
          v = 760 * dt + Math.sin(q.t * 12 + q.a) * 2;
        if (l <= v + 6) {
          if (q.vuelta || q.t > 3) {
            cuervos.splice(i, 1);
            continue;
          }
          q.e.marcaHasta = J.t + MARCA_SEG;
          pegar(q.e, base() * 0.55, q.x, q.y, "bandada", 0.4);
          q.vuelta = true;
          continue;
        }
        q.x += (dx / l) * v + Math.cos(q.t * 9 + q.a) * 40 * dt;
        q.y += (dy / l) * v + Math.sin(q.t * 9 + q.a) * 40 * dt;
      }
      for (let i = anillos.length - 1; i >= 0; i--) if ((anillos[i].t += dt) > 0.5) anillos.splice(i, 1);
    },
    alPegar(e, dano, info) {
      if (!alguna() || (info && info.d && info.d.habilidad)) return;
      sumar(POR_GOLPE + (info && info.critico ? POR_CRITICO : 0));
    },
    modRecibido(dano) {
      if (dano > 0 && alguna()) sumar(dano * POR_HERIDA);
      return dano;
    },
    modDano(dano, e) {
      if (!e) return dano;
      let k = 1;
      if (e.rugidoHasta > J.t) k += RUGIDO_EXPONE;
      if (e.marcaHasta > J.t) k += MARCA;
      return dano * k;
    },
    cosasBarra() {
      // cada habilidad es una casilla de la barra (BARRA): con teclado se usa con su número, con mando con L2 + □ △ ○
      const o = {};
      for (const id of IDS)
        o["hab_" + id] = {
          tipo: "habilidad",
          icono: "hab_" + id,
          avisa: true,
          nombre: () => t("ab." + id),
          desc: () => t("ab." + id + "_d", numeros(id, Math.max(1, rango(id)))),
          tiene: () => sabe(id),
          listo: () => !puede(id),
          espera: () => (espera[id] || 0) / esperaDe(id),
          usar: () => usar(id),
        };
      return o;
    },
    hud() {
      // la barra de la Furia, debajo de la estamina, solo si hay alguna habilidad aprendida
      let b = document.getElementById("bFuria");
      if (!b) {
        const est = document.getElementById("bEst");
        if (!est) return;
        est.insertAdjacentHTML("afterend", `<div class="barra fur oculto" id="bFuria"><i></i><span><b>${t("fu.furia")}</b><em></em></span></div>`);
        b = document.getElementById("bFuria");
        b._v = -1;
      }
      const ver = alguna();
      if (b._ver !== ver) b.classList.toggle("oculto", !(b._ver = ver));
      const v = Math.floor(furia);
      if (ver && b._v !== v) {
        b._v = v;
        b.querySelector("i").style.width = v + "%";
        b.querySelector("em").textContent = v;
        b.classList.toggle("llena", v >= 40);
      }
    },
    sobreLuz(c) {
      // los anillos del rugido y de la caída del salto, en el piso
      for (const a of anillos) {
        const k = a.t / 0.5;
        c.save();
        c.globalAlpha = (1 - k) * 0.7;
        c.strokeStyle = a.col;
        c.lineWidth = 6 * (1 - k) + 2;
        c.beginPath();
        c.ellipse(a.x, a.y, a.r + (a.R - a.r) * k, (a.r + (a.R - a.r) * k) * 0.8, 0, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      }
      // los cuervos: rombos negros con alas que baten y un ojo rúnico
      for (const q of cuervos) {
        if (q.t < 0) continue;
        const b = Math.sin(q.t * 26 + q.a) * 9;
        c.fillStyle = "rgba(0,0,0,0.25)";
        c.beginPath();
        c.ellipse(q.x, q.y + 60, 10, 4, 0, 0, Math.PI * 2);
        c.fill();
        DIB.P(c, [q.x - 16, q.y - b, q.x, q.y - 4, q.x + 16, q.y - b, q.x, q.y + 6], "#1E1A1A");
        DIB.P(c, [q.x - 4, q.y - 2, q.x + 4, q.y - 2, q.x + 2, q.y + 8, q.x - 2, q.y + 8], "#2A2628");
        DIB.E(c, q.x + 1, q.y - 1, 1.6, 1.6, "#73D5DB");
      }
    },
    luces(dar) {
      if (salto) dar({ x: jug.x, y: jug.y - 40, r: 120, col: "#7BC86C", f: 0.4 });
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);

  // ---------- los nodos del árbol ----------
  // lo que dice el nodo con n rangos: [alcance o fuerza, costo de Furia, espera]
  function numeros(id, n) {
    const h = HAB[id],
      i = Math.min(1, n - 1);
    const a = id === "rugido" ? Math.round((h.v * (n >= 2 ? 1.2 : 1)) / 30) : id === "salto" ? Math.round((h.v + (n >= 2 ? 0.4 : 0)) * 100) : h.v + (n >= 2 ? 2 : 0);
    return [a, h.costo[i], h.espera[i]];
  }
  if (window.ARBOL)
    IDS.forEach((id) => {
      const h = HAB[id];
      ARBOL.sumar(h.rama, { id, f: h.f, c: h.c, max: 2, runa: h.runa, v: 0, pide: h.pide, activa: h.accion, num: (n) => numeros(id, n) });
    });

  return { sistema, furia: () => furia, ponerFuria: (n) => (furia = Math.max(0, Math.min(MAX, n))), usar, puede, espera: (id) => espera[id] || 0, cuervos: () => cuervos.length, saltando: () => !!salto, HAB, MAX };
})();
