// ---------- los instructores y el muñeco de práctica (sistema INSTRUCTORES) ----------
// Como los maestros del Gothic: tres personas que enseñan a pelear, una por rama del árbol. Cada una tiene tres
// lecciones que piden nivel, plata y pasar antes su prueba en el muñeco de práctica del Puesto; cada lección enseña
// algo propio (suma a las estadísticas) y da un punto de habilidad para el árbol (ARBOL.sumarPuntos).
//   Hallbera, escudera del Puesto (Oso): la prueba es hacerle daño al muñeco en 10 s.
//   Ulfar, cazador del refugio (Lobo): la prueba es sacar críticos en 12 s.
//   Vör, la vidente del túmulo (Cuervo): el muñeco gira su brazo con aviso en el piso; la prueba es esquivarlo justo.
// El muñeco (un blanco de CB: `d.blanco` y `d.dibujo` en combate.js) también mide el daño: 10 s y da el total, el
// daño por segundo, los golpes, los críticos y el mejor golpe, y guarda la mejor marca.
// Estado en E.extra.instruc = { lec: { quien: n }, prueba: { quien, n } | null, pasada: { quien: n }, mejor }.
window.INSTRUCTORES = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const RADIO = 170;
  const MAESTROS = {
    hallbera: { rama: "oso", lugar: "puesto", prueba: "dano", meta: [250, 600, 1100], seg: 10 },
    ulfar: { rama: "lobo", lugar: "refugio", prueba: "criticos", meta: [3, 4, 5], seg: 12 },
    vor: { rama: "cuervo", lugar: "tumulo", prueba: "esquivas", meta: [2, 3, 4], seg: 16 },
  };
  const IDS = Object.keys(MAESTROS);
  // las lecciones: nivel, plata y lo que enseñan
  const LECCIONES = {
    hallbera: [
      { nivel: 3, plata: 60, s: (s) => (s.vida += 15) },
      { nivel: 9, plata: 180, s: (s) => (s.armadura += 6) },
      { nivel: 16, plata: 420, s: (s) => (s.dano *= 1.04) },
    ],
    ulfar: [
      { nivel: 3, plata: 60, s: (s) => (s.crit += 0.02) },
      { nivel: 9, plata: 180, s: (s) => (s.velAtq *= 1.04) },
      { nivel: 16, plata: 420, s: (s) => (s.critMult += 0.1) },
    ],
    vor: [
      { nivel: 3, plata: 60, s: (s) => (s.runico *= 1.06) },
      { nivel: 9, plata: 180, s: (s) => (s.regenRunica *= 1.08) },
      { nivel: 16, plata: 420, s: (s) => (s.xp *= 1.06) },
    ],
  };
  // la ficha de cada uno para GENTE (los dibuja como al resto de la gente de Eldervald)
  const FICHAS = {
    // Hallbera, escudera: grandota, trenza cobriza, cota gris y capa parda de piel de oso, hacha al cinto
    hallbera: { nombre: "hallbera", alto: 1.08, ancho: 1.2, piel: "#D8A888", pielSombra: "#B8886C", pelo: "#B4542A", ropa: "#6E6A66", ropaSombra: "#56524E", capa: "#5E3A22", capaSombra: "#46281A", falda: false, pantalon: "#3A3026", botas: "#241C16", cinto: "#C8402D", trenza: true, hacha: true },
    // Ulfar, cazador: flaco, barba gris corta, capa de lobo gris, lanza de caza
    ulfar: { nombre: "ulfar", alto: 1.02, ancho: 0.9, piel: "#C8987A", pielSombra: "#A87A5E", pelo: "#8E8A86", barba: "#8E8A86", ropa: "#4E5A3E", ropaSombra: "#3A4430", capa: "#8E8A86", capaSombra: "#6E6A66", pantalon: "#3A3026", botas: "#2A2018", cinto: "#7A5634", lanza: true },
    // Vör, la vidente: capa negra de plumas, rodete blanco, tinta en las manos
    vor: { nombre: "vor", alto: 0.96, ancho: 0.94, piel: "#E0C8B4", pielSombra: "#C0A894", pelo: "#E8E4DC", ropa: "#2A2628", ropaSombra: "#1E1A1C", capa: "#1E1A1A", capaSombra: "#141012", falda: true, pantalon: "#2A2628", botas: "#1A1414", cinto: "#73D5DB", rodete: true, tinta: true },
  };
  const base = () => ({ lec: {}, prueba: null, pasada: {}, mejor: 0 });
  let st = base();
  const gente = {}; // id → { x, y, mira }
  let muneco = null;
  // la sesión en el muñeco: { tipo: "medir" | "dano" | "criticos" | "esquivas", quien, n, t, seg, dano, golpes, crit, mejor, esq, justaT, aviso }
  let ses = null;

  // ---------- dónde está cada uno ----------
  function buscar(p, dmin, dmax) {
    for (let k = 0; k < 260; k++) {
      const a = 0.3 + k * 2.39996,
        d = dmin + ((dmax - dmin) * k) / 260,
        x = p[0] + Math.cos(a) * d,
        y = p[1] + Math.sin(a) * d * 0.8;
      if (!W.libre(x, y, 70) || !W.libre(x - 120, y, 30) || !W.libre(x + 120, y, 30)) continue;
      if (W.CAMINOS.some((c) => W.distLinea(x, y, c.p) < c.w / 2 + 40)) continue;
      return [x, y];
    }
    return [p[0] + dmin, p[1]];
  }
  function ubicar() {
    const pu = W.PUNTOS.puesto || W.LUGARES.puesto.p;
    const pm = buscar([pu[0] - 240, pu[1] + 170], 0, 320);
    muneco = A.CB.crear("muneco", pm[0], pm[1]);
    muneco.o = { brazo: 0 };
    A.enemigos.push(muneco);
    gente.hallbera = { x: pm[0] + 130, y: pm[1] - 20, mira: { vista: "S", espejo: true } };
    const pr = buscar(W.LUGARES.refugio.p, 650, 950);
    gente.ulfar = { x: pr[0], y: pr[1], mira: { vista: "S", espejo: false } };
    const pt = buscar(W.LUGARES.tumulo.p, 220, 480);
    gente.vor = { x: pt[0], y: pt[1], mira: { vista: "S", espejo: false } };
  }

  // ---------- las lecciones ----------
  const aprendidas = (id) => st.lec[id] || 0;
  function lecPide(id) {
    const n = aprendidas(id),
      L = LECCIONES[id][n];
    if (!L) return "ie.todo";
    if ((window.RPG ? RPG.nivel() : 1) < L.nivel) return "ie.pide_nivel";
    if ((st.pasada[id] || 0) <= n) return "ie.pide_prueba";
    if (PODERES.pj().plata < L.plata) return "ie.pide_plata";
    return null;
  }
  function aprender(id) {
    const no = lecPide(id);
    if (no) {
      const L = LECCIONES[id][aprendidas(id)];
      HUD.aviso(t(no, L ? [L.nivel, L.plata] : []));
      return false;
    }
    const n = aprendidas(id),
      L = LECCIONES[id][n];
    PODERES.pj().plata -= L.plata;
    st.lec[id] = n + 1;
    if (window.ARBOL) ARBOL.sumarPuntos(1);
    if (window.RPG) RPG.recalcular();
    HUD.aviso(t("ie.aprendiste", [t("ie." + id + "_l" + (n + 1))]), window.ARBOL ? ARBOL.RAMAS[MAESTROS[id].rama].col : "#FFD98A");
    if (window.SONIDO) SONIDO.tocar("mision", { vol: 0.5 });
    if (A.columnaRunica) A.columnaRunica(jug.x, jug.y);
    return true;
  }
  function pedirPrueba(id) {
    const n = aprendidas(id);
    if (!LECCIONES[id][n]) return;
    st.prueba = { quien: id, n };
    HUD.aviso(t("ie.prueba_pedida", [t("av.nombre_" + id)]), "#FFD98A");
  }
  function menuMaestro(id) {
    const n = aprendidas(id),
      L = LECCIONES[id][n],
      M = MAESTROS[id],
      bot = [];
    for (let k = 0; k < 3; k++) {
      const hecha = k < n;
      bot.push({
        texto: (hecha ? "✓ " : "") + t("ie." + id + "_l" + (k + 1)),
        sub: t("ie." + id + "_l" + (k + 1) + "_d") + (hecha ? "" : " · " + t("ie.lec_sub", [LECCIONES[id][k].nivel, LECCIONES[id][k].plata])),
        fn: k === n ? () => (aprender(id), menuMaestro(id)) : () => menuMaestro(id),
      });
    }
    if (L && (st.pasada[id] || 0) <= n) {
      const enCurso = st.prueba && st.prueba.quien === id;
      bot.push({ texto: enCurso ? t("ie.prueba_en_curso") : t("ie.pedir_prueba"), sub: t("ie.prueba_" + M.prueba, [M.meta[n], M.seg]), fn: () => {
          // el menú se cierra y Vör, Ulfar o Hallbera dicen la prueba: después queda andando en el rastreador
          A.cerrarMenu();
          A.dialogoLibre([[id, "ie." + id + "_prueba"]], () => pedirPrueba(id));
        } });
    }
    window.SISTEMAS.forEach((s0) => s0.botonesInstructor && s0.botonesInstructor(id).forEach((b) => bot.push(b))); // los galdrar de Vör…
    // charlar cierra el menú, se habla y al terminar vuelve el menú del maestro
    bot.push({ texto: t("ie.charlar"), fn: () => {
      A.cerrarMenu();
      A.dialogoLibre([[id, "ie." + id + "_charla" + ((n % 3) + 1)]], () => menuMaestro(id));
    } });
    bot.push({ texto: t("ui.cerrar"), fn: A.cerrarMenu });
    A.menu(`<h2>${t("av.nombre_" + id)}</h2><div class="sub">${t("ie." + id + "_sub")}</div>`, bot);
  }

  // ---------- el muñeco ----------
  function menuMuneco() {
    const bot = [{ texto: t("ie.medir"), sub: st.mejor ? t("ie.mejor", [st.mejor]) : t("ie.medir_sub"), fn: () => (A.cerrarMenu(), empezar("medir")) }];
    if (st.prueba) {
      const M = MAESTROS[st.prueba.quien];
      bot.push({ texto: t("ie.hacer_prueba", [t("av.nombre_" + st.prueba.quien)]), sub: t("ie.prueba_" + M.prueba, [M.meta[st.prueba.n], M.seg]), fn: () => (A.cerrarMenu(), empezar(M.prueba)) });
    }
    bot.push({ texto: t("ui.cerrar"), fn: A.cerrarMenu });
    A.menu(`<h2>${t("as.munecoPractica")}</h2><div class="sub">${t("ie.muneco_sub")}</div>`, bot);
  }
  function empezar(tipo) {
    const p = st.prueba;
    const seg = tipo === "medir" ? 10 : MAESTROS[p.quien].seg;
    ses = { tipo, quien: tipo === "medir" ? null : p.quien, n: p && tipo !== "medir" ? p.n : 0, t: -1.5, seg, dano: 0, golpes: 0, crit: 0, mejor: 0, esq: 0, justaT: jug.justaT || -9, aviso: null, proximo: 1.2 };
    muneco.estado = "practica"; // así no cuenta como golpe por sorpresa
    HUD.aviso(t("ie.preparate"), "#FFD98A");
    if (window.SONIDO) SONIDO.tocar("pagina", { vol: 0.5 });
  }
  function terminar() {
    const s = ses;
    ses = null;
    muneco.estado = "quieto";
    muneco.o.brazo = 0;
    const dps = Math.round((s.dano / s.seg) * 10) / 10;
    let titulo = t("ie.resultado"),
      lineas = [t("ie.r_dano", [Math.round(s.dano)]), t("ie.r_dps", [dps]), t("ie.r_golpes", [s.golpes, s.crit]), t("ie.r_mejor", [Math.round(s.mejor)])];
    if (s.tipo === "medir") {
      if (s.dano > st.mejor) {
        st.mejor = Math.round(s.dano);
        lineas.push(`<b class="ie-record">${t("ie.record")}</b>`);
      }
    } else {
      const M = MAESTROS[s.quien],
        meta = M.meta[s.n],
        logrado = s.tipo === "dano" ? s.dano : s.tipo === "criticos" ? s.crit : s.esq,
        ok = logrado >= meta;
      if (s.tipo === "esquivas") lineas = [t("ie.r_esquivas", [s.esq, meta])];
      titulo = ok ? t("ie.pasaste") : t("ie.no_pasaste");
      lineas.push(t("ie.r_meta", [Math.round(logrado), meta]));
      if (ok) {
        st.pasada[s.quien] = Math.max(st.pasada[s.quien] || 0, s.n + 1);
        st.prueba = null;
        lineas.push(t("ie.volve_a", [t("av.nombre_" + s.quien)]));
        if (window.SONIDO) SONIDO.tocar("mision", { vol: 0.5 });
      }
    }
    A.menu(`<h2>${titulo}</h2><div class="sub ie-lineas">${lineas.map((l) => `<span>${l}</span>`).join("")}</div>`, [
      { texto: t("ie.otra_vez"), fn: () => (A.cerrarMenu(), empezar(s.tipo === "medir" || !st.prueba ? "medir" : s.tipo)) },
      { texto: t("ui.cerrar"), fn: A.cerrarMenu },
    ]);
  }
  // lo que pasa cuando algo le pega al muñeco (lo llama combate.js con d.blanco)
  function alGolpe(e, dano) {
    if (!ses || ses.t < 0) return;
    ses.dano += dano;
    ses.golpes++;
    ses.mejor = Math.max(ses.mejor, dano);
  }
  function cartel() {
    let el = document.getElementById("ieMuneco");
    if (!ses) {
      if (el) el.classList.add("oculto");
      return;
    }
    if (!el) {
      document.body.insertAdjacentHTML("beforeend", `<div id="ieMuneco" class="ui panel"><b></b><span></span></div>`);
      el = document.getElementById("ieMuneco");
    }
    el.classList.remove("oculto");
    const s = ses,
      queda = Math.max(0, s.seg - Math.max(0, s.t));
    el.querySelector("b").textContent = s.t < 0 ? t("ie.ya", [Math.ceil(-s.t)]) : queda.toFixed(1) + " s";
    const meta = s.quien ? MAESTROS[s.quien].meta[s.n] : 0;
    el.querySelector("span").textContent =
      s.tipo === "esquivas" ? t("ie.c_esquivas", [s.esq, meta]) : s.tipo === "criticos" ? t("ie.c_criticos", [s.crit, meta]) : t("ie.c_dano", [Math.round(s.dano), Math.round((s.dano / Math.max(1, s.t)) * 10) / 10]) + (meta ? " / " + meta : "");
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      Object.assign(GENTE.FICHAS, FICHAS);
      A.CB.TIPOS.muneco = { vida: 1e9, dano: 0, vel: 0, alcance: 0, aviso: 1, forma: "circulo", radioGolpe: 0, angulo: 0, radio: 22, espera: 99, barra: 156, plata: 0, blanco: alGolpe, dibujo: "munecoPractica" };
      ubicar();
      if (window.RPG) RPG.aporte((s) => IDS.forEach((id) => LECCIONES[id].slice(0, aprendidas(id)).forEach((L) => L.s(s))), "instructores");
    },
    alEmpezar(extra) {
      extra.instruc = Object.assign(base(), extra.instruc || {});
      st = extra.instruc;
      ses = null;
      if (muneco) {
        muneco.estado = "quieto";
        muneco.o.brazo = 0;
        muneco.activo = true;
        muneco.muerto = 0;
      }
      if (window.RPG) RPG.recalcular();
    },
    actualizar(dt) {
      cartel();
      if (!ses || J.modo !== "juego") return;
      ses.t += dt;
      // si Eromash se va lejos, la sesión se corta
      if (Math.hypot(jug.x - muneco.x, jug.y - muneco.y) > 900) {
        ses = null;
        muneco.estado = "quieto";
        HUD.aviso(t("ie.cortada"));
        return;
      }
      if (ses.tipo === "esquivas" && ses.t >= 0) {
        // el brazo gira: aviso exacto en el piso (un anillo que se llena) y al llenarse barre todo el círculo
        ses.proximo -= dt;
        if (!ses.aviso && ses.proximo <= 0) ses.aviso = { t: 0, dur: 0.95, r: 150 };
        if (ses.aviso) {
          ses.aviso.t += dt;
          muneco.o.brazo = -0.5 + (ses.aviso.t / ses.aviso.dur) * 0.4;
          if (ses.aviso.t >= ses.aviso.dur) {
            muneco.o.brazo = Math.PI * 2;
            const dentro = Math.hypot(jug.x - muneco.x, (jug.y - muneco.y) * 1.25) < ses.aviso.r;
            if (dentro) {
              const antes = jug.justaT || -9;
              J.herir(0, muneco.x, muneco.y, "golpe");
              if ((jug.justaT || -9) !== antes) {
                ses.esq++;
                A.textoFlotante(jug.x, jug.y - 160, t("ie.justa"), "#73D5DB");
              } else if (!(jug.salto > 0 || jug.esq > 0)) A.textoFlotante(jug.x, jug.y - 160, t("ie.te_dio"), "#FF8D71");
            }
            if (window.SONIDO) SONIDO.tocar("tajo", { vol: 0.5, tono: 0.7, x: muneco.x, y: muneco.y });
            ses.aviso = null;
            ses.proximo = 1.1 + ((ses.esq * 7) % 5) * 0.12;
          }
        } else muneco.o.brazo *= Math.pow(0.02, dt);
      }
      if (ses.t >= ses.seg) terminar();
    },
    alPegar(e, dano, info) {
      if (e === muneco && ses && ses.t >= 0 && info && info.critico) ses.crit++;
    },
    cercanos(dar) {
      if (J.dentro) return;
      for (const id of IDS) {
        const g = gente[id],
          d = Math.hypot(g.x - jug.x, g.y - jug.y);
        if (d < RADIO) dar(d, t("ie.hablar", [t("av.nombre_" + id)]), () => menuMaestro(id), g.x, g.y - 150);
      }
      if (muneco && !ses) {
        const d = Math.hypot(muneco.x - jug.x, muneco.y - jug.y);
        if (d < RADIO) dar(d, t("ie.usar_muneco"), menuMuneco, muneco.x, muneco.y - 175);
      }
    },
    cuerpos(f) {
      for (const id of IDS) f(gente[id].x, gente[id].y, 26);
      if (muneco) f(muneco.x, muneco.y, 22);
    },
    piso(c) {
      // el aviso del brazo del muñeco: el círculo exacto que barre y su relleno que crece
      if (!ses || !ses.aviso) return;
      const a = ses.aviso,
        k = a.t / a.dur;
      c.save();
      c.fillStyle = "rgba(255,141,113,0.16)";
      c.beginPath();
      c.ellipse(muneco.x, muneco.y, a.r, a.r * 0.8, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "rgba(255,141,113,0.8)";
      c.lineWidth = 2;
      c.stroke();
      c.fillStyle = "rgba(255,141,113,0.34)";
      c.beginPath();
      c.ellipse(muneco.x, muneco.y, a.r * k, a.r * 0.8 * k, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    },
    objetos(lista, visible, c) {
      for (const id of IDS) {
        const g = gente[id];
        if (!visible(g.x, g.y)) continue;
        if (Math.hypot(jug.x - g.x, jug.y - g.y) < 300) g.mira = VIKINGO.vista(jug.x - g.x, jug.y - g.y, g.mira);
        lista.push({ x: g.x, y: g.y, f: () => GENTE.dibujar(c, id, g.x, g.y, J.t, { vista: g.mira.vista, espejo: g.mira.espejo }) });
      }
    },
    marcasMapa() {
      return IDS.map((id) => ({ tipo: "instructor", x: gente[id].x, y: gente[id].y, op: { nombre: t("av.nombre_" + id), col: window.ARBOL ? ARBOL.RAMAS[MAESTROS[id].rama].col : undefined } }));
    },
    seguimiento() {
      if (!st.prueba) return null;
      const id = st.prueba.quien,
        M = MAESTROS[id];
      return { secundaria: true, id: "instructor", rotulo: t("ie.rotulo"), nombre: t("ie.prueba_de", [t("av.nombre_" + id)]), objetivos: [{ texto: t("ie.prueba_" + M.prueba, [M.meta[st.prueba.n], M.seg]), estado: "actual", metros: muneco ? Math.max(1, Math.hypot(muneco.x - jug.x, muneco.y - jug.y) / 43) : null }] };
    },
    marcasBrujula() {
      return st.prueba && muneco ? [{ x: muneco.x, y: muneco.y, col: "#FFD98A" }] : [];
    },
    diario() {
      const n = IDS.reduce((a, id) => a + aprendidas(id), 0);
      return n || st.mejor ? `<div class="diario-resumen"><p><b>${t("ie.diario")}</b> ${t("ie.diario_lec", [n, 9])}${st.mejor ? " " + t("ie.mejor", [st.mejor]) : ""}</p></div>` : "";
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, muneco: () => muneco, gente: () => gente, menuMaestro, aprender, pedirPrueba, empezar, terminar, sesion: () => ses, lecPide, aprendidas, MAESTROS, LECCIONES };
})();
