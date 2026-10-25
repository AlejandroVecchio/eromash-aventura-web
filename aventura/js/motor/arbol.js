// ---------- el árbol de habilidades (sistema ARBOL, pestaña Habilidades de la mochila) ----------
// Tres ramas como los árboles del Diablo II y los talentos del WoW, cada una con su bestia y su runa: el Oso (Björn:
// aguantar y pegar fuerte), el Lobo (Úlfr: rapidez, críticos y rematar) y el Cuervo (Hrafn: runas, botín y saber).
// Cada nivel desde el 2 da un punto (más los que suman libros e instructores con ARBOL.sumarPuntos). Cada nodo tiene
// rangos; las filas de abajo piden puntos ya puestos en esa rama (0, 3, 6 y 10) y algunos nodos piden a su padre. El
// último de cada rama cambia cómo se pelea: Corazón de Björn, Acecho y Hugin y Munin.
// Otros sistemas suman nodos con ARBOL.sumar(rama, nodo) (las habilidades activas, PR siguiente).
// Estado en E.extra.arbol = { r: { id: rango }, extra, olvidos }. H abre la pestaña directo. Textos `ab.`.
window.ARBOL = (function () {
  "use strict";
  let A, J, jug;
  const t = (k, v) => I18N.t(k, v);
  const FILAS = [0, 3, 6, 10]; // puntos en la rama para abrir cada fila
  const RAMAS = {
    oso: { col: "#C8402D", runa: "uruz" },
    lobo: { col: "#7BC86C", runa: "ehwaz" },
    cuervo: { col: "#73D5DB", runa: "ansuz" },
  };
  // nodos: rama, fila, columna (0..2), rangos, runa, lo que pide y lo que hace por rango (v)
  const NODOS = [
    { id: "piel", rama: "oso", f: 0, c: 0, max: 3, runa: "algiz", v: 5, s: (s, n, v) => (s.armadura += v * n) },
    { id: "zarpa", rama: "oso", f: 0, c: 2, max: 3, runa: "uruz", v: 0.04, s: (s, n, v) => (s.dano *= 1 + v * n) },
    { id: "corpulencia", rama: "oso", f: 1, c: 0, max: 3, runa: "thurisaz", v: 18, s: (s, n, v) => (s.vida += v * n) },
    { id: "zarpazo", rama: "oso", f: 1, c: 2, max: 2, runa: "hagalaz", v: 0.2, pide: "zarpa" },
    { id: "aguante", rama: "oso", f: 2, c: 1, max: 2, runa: "isa", v: 0.12, pide: "piel" },
    { id: "corazon", rama: "oso", f: 3, c: 1, max: 1, runa: "othala", v: 0.3, pide: "aguante", clave: true },

    { id: "patas", rama: "lobo", f: 0, c: 0, max: 3, runa: "raidho", v: 0.03, s: (s, n, v) => (s.velMov *= 1 + v * n) },
    { id: "colmillo", rama: "lobo", f: 0, c: 2, max: 3, runa: "kenaz", v: 0.02, s: (s, n, v) => (s.crit += v * n) },
    { id: "jauria", rama: "lobo", f: 1, c: 0, max: 3, runa: "ehwaz", v: 0.04, s: (s, n, v) => (s.velAtq *= 1 + v * n) },
    { id: "mordida", rama: "lobo", f: 1, c: 2, max: 2, runa: "naudiz", v: 0.15, pide: "colmillo", s: (s, n, v) => (s.critMult += v * n) },
    { id: "sangre", rama: "lobo", f: 2, c: 1, max: 2, runa: "tiwaz", v: 0.12 },
    { id: "acecho", rama: "lobo", f: 3, c: 1, max: 1, runa: "eihwaz", v: 0.25, pide: "sangre", clave: true },

    { id: "ojo", rama: "cuervo", f: 0, c: 0, max: 3, runa: "perthro", v: 0.08, s: (s, n, v) => (s.botin *= 1 + v * n) },
    { id: "voz", rama: "cuervo", f: 0, c: 2, max: 3, runa: "ansuz", v: 0.06, s: (s, n, v) => (s.runico *= 1 + v * n) },
    { id: "memoria", rama: "cuervo", f: 1, c: 0, max: 3, runa: "jera", v: 0.06, s: (s, n, v) => (s.xp *= 1 + v * n) },
    { id: "pozo", rama: "cuervo", f: 1, c: 2, max: 2, runa: "laguz", v: 0.1, pide: "voz", s: (s, n, v) => (s.regenRunica *= 1 + v * n) },
    { id: "presagio", rama: "cuervo", f: 2, c: 1, max: 2, runa: "sowilo", v: 0.25 },
    { id: "dos", rama: "cuervo", f: 3, c: 1, max: 1, runa: "dagaz", v: 6, pide: "presagio", clave: true },
  ];
  const POR_ID = {};
  NODOS.forEach((n) => (POR_ID[n.id] = n));
  const ESPERA_CORAZON = 120,
    ACECHO_SEG = 3;
  const base = () => ({ r: {}, extra: 0, olvidos: 0 });
  let st = base();
  let corazonT = 0,
    acechoT = 0;

  // ---------- las cuentas ----------
  const rango = (id) => st.r[id] || 0;
  const enRama = (rama) => NODOS.reduce((n, d) => n + (d.rama === rama ? rango(d.id) : 0), 0);
  const puestos = () => NODOS.reduce((n, d) => n + rango(d.id), 0);
  const total = () => ((window.RPG ? RPG.nivel() : 1) - 1) + (st.extra || 0);
  const libres = () => total() - puestos();
  // por qué no se puede subir (null si se puede)
  function falta(id) {
    const d = POR_ID[id];
    if (!d) return "?";
    if (rango(id) >= d.max) return t("ab.lleno");
    if (enRama(d.rama) < FILAS[d.f]) return t("ab.pide_rama", [FILAS[d.f], t("ab.rama_" + d.rama)]);
    if (d.pide && !rango(d.pide)) return t("ab.pide_nodo", [t("ab." + d.pide)]);
    if (libres() <= 0) return t("ab.sin_puntos");
    return null;
  }
  function subir(id) {
    const f = falta(id);
    if (f) {
      HUD.aviso(f);
      return false;
    }
    st.r[id] = rango(id) + 1;
    if (window.RPG) RPG.recalcular();
    const d = POR_ID[id];
    if (window.SONIDO) SONIDO.tocar(d.clave ? "mision" : "pagina", { vol: d.clave ? 0.5 : 0.45 });
    if (d.clave) HUD.aviso(t("ab.clave_lista", [t("ab." + id)]), RAMAS[d.rama].col);
    return true;
  }
  const costoOlvido = () => (st.olvidos ? 25 * (window.RPG ? RPG.nivel() : 1) : 0);
  let pidioOlvido = false;
  function olvidar() {
    const costo = costoOlvido(),
      pj = window.PODERES && PODERES.pj();
    if (!puestos()) return HUD.aviso(t("ab.nada_que"));
    if (costo && (!pj || pj.plata < costo)) return HUD.aviso(t("ab.sin_plata", [costo]));
    if (!pidioOlvido) {
      pidioOlvido = true;
      setTimeout(() => (pidioOlvido = false), 3000);
      return HUD.aviso(t("ab.seguro"));
    }
    pidioOlvido = false;
    if (costo) pj.plata -= costo;
    st.r = {};
    st.olvidos++;
    if (window.RPG) RPG.recalcular();
    HUD.aviso(t("ab.olvidado"), "#73D5DB");
  }
  // lo que dice cada nodo con n rangos (el texto lleva el número del rango)
  function efectoTexto(d, n) {
    if (d.num) return t("ab." + d.id + "_d", d.num(Math.max(1, n)));
    const v = d.v * Math.max(1, n);
    const num = Math.abs(v) < 1 ? Math.round(v * 100) : Math.round(v);
    return t("ab." + d.id + "_d", [num]);
  }

  // ---------- los dibujos: la cabeza de cada bestia y cada nodo ----------
  function cabeza(tipo) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 96;
    const c = cv.getContext("2d");
    const P = (pts, col) => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
      c.closePath();
      c.fill();
    };
    // el rombo de fondo, como el retrato de Eromash
    P([48, 4, 92, 48, 48, 92, 4, 48], "#1A1614");
    P([48, 4, 92, 48, 48, 92], "#221C19");
    if (tipo === "oso") {
      P([24, 30, 32, 20, 38, 32], "#5E3A22"); // orejas
      P([72, 30, 64, 20, 58, 32], "#7A5634");
      P([22, 40, 48, 26, 74, 40, 70, 64, 48, 76, 26, 64], "#7A5634");
      P([22, 40, 48, 26, 48, 76, 26, 64], "#5E3A22");
      P([38, 56, 58, 56, 54, 72, 42, 72], "#C8A27A"); // hocico
      P([38, 56, 48, 56, 48, 72, 42, 72], "#A6845E");
      P([44, 58, 52, 58, 48, 63], "#111111");
      P([34, 45, 40, 44, 39, 49], "#111111");
      P([56, 44, 62, 45, 57, 49], "#111111");
    } else if (tipo === "lobo") {
      P([26, 36, 30, 12, 42, 30], "#6E6A66"); // orejas
      P([70, 36, 66, 12, 54, 30], "#8E8A86");
      P([24, 38, 48, 28, 72, 38, 66, 58, 48, 84, 30, 58], "#8E8A86");
      P([24, 38, 48, 28, 48, 84, 30, 58], "#6E6A66");
      P([40, 58, 56, 58, 48, 84], "#D8D2CC"); // hocico largo
      P([40, 58, 48, 58, 48, 84], "#B8B2AC");
      P([45, 78, 51, 78, 48, 83], "#111111");
      P([34, 46, 42, 48, 36, 51], "#FFD98A"); // ojos
      P([62, 46, 54, 48, 60, 51], "#FFD98A");
    } else {
      P([30, 34, 48, 22, 64, 30, 66, 56, 48, 70, 32, 58], "#2A2628"); // cabeza
      P([30, 34, 48, 22, 48, 70, 32, 58], "#1A1618");
      P([58, 42, 86, 52, 58, 56], "#3A3634"); // pico
      P([58, 49, 86, 52, 58, 56], "#24201E");
      P([50, 38, 56, 40, 51, 44], "#73D5DB"); // ojo rúnico
      P([26, 36, 18, 30, 30, 44], "#1A1618"); // plumas de la nuca
      P([28, 48, 16, 50, 30, 56], "#1A1618");
    }
    return cv;
  }
  function iconoNodo(d, nivelNodo, abierto) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 72;
    const c = cv.getContext("2d");
    const col = RAMAS[d.rama].col;
    c.globalAlpha = abierto || nivelNodo ? 1 : 0.4;
    c.fillStyle = nivelNodo ? "#2A1E1A" : "#161210";
    c.beginPath();
    if (d.activa) {
      // las habilidades activas (FURIA): un círculo, se usan con su tecla
      c.arc(36, 36, 32, 0, Math.PI * 2);
    } else if (d.clave) {
      // los nodos que cambian cómo se pelea: un hexágono más grande
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 6 + (i * Math.PI) / 3;
        c.lineTo(36 + Math.cos(a) * 34, 36 + Math.sin(a) * 34);
      }
    } else {
      c.moveTo(36, 3);
      c.lineTo(69, 36);
      c.lineTo(36, 69);
      c.lineTo(3, 36);
    }
    c.closePath();
    c.fill();
    c.lineWidth = 3;
    c.strokeStyle = nivelNodo ? (nivelNodo >= d.max ? "#FFD98A" : col) : "#3A3634";
    c.stroke();
    FUTHARK.dibujar(c, d.runa, 36, 52, 30, nivelNodo ? col : abierto ? "#A89C98" : "#5A524E", 4);
    return cv;
  }

  // ---------- la pestaña ----------
  function pintar(cuerpo, api) {
    cuerpo.classList.add("ab-cuerpo");
    const li = Math.max(0, libres());
    const cab = document.createElement("div");
    cab.className = "ab-cabeza";
    cab.innerHTML = `<div class="at-libres${li > 0 ? " hay" : ""}"><b>${li}</b><span>${t("ab.libres")}</span></div>`;
    const ol = document.createElement("button");
    ol.type = "button";
    ol.className = "ab-olvidar";
    ol.textContent = t("ab.olvidar");
    const costo = costoOlvido();
    const sub = document.createElement("small");
    sub.textContent = costo ? t("ab.olvidar_costo", [costo]) : t("ab.olvidar_gratis");
    ol.appendChild(sub);
    cab.appendChild(ol);
    cuerpo.appendChild(cab);
    const ramas = document.createElement("div");
    ramas.className = "ab-ramas";
    const enfocar = [];
    Object.keys(RAMAS).forEach((rama) => {
      const R = RAMAS[rama];
      const col = document.createElement("div");
      col.className = "ab-rama";
      col.style.setProperty("--col", R.col);
      const ca = document.createElement("div");
      ca.className = "ab-rama-cab";
      ca.appendChild(cabeza(rama));
      ca.insertAdjacentHTML("beforeend", `<div><b>${t("ab.rama_" + rama)}</b><small>${t("ab.rama_" + rama + "_d")}</small><span>${t("ab.en_rama", [enRama(rama)])}</span></div>`);
      col.appendChild(ca);
      const grilla = document.createElement("div");
      grilla.className = "ab-grilla";
      // las líneas de lo que pide cada nodo
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 300 400");
      svg.setAttribute("preserveAspectRatio", "none");
      svg.classList.add("ab-lineas");
      const centro = (d) => [50 + d.c * 100, 50 + d.f * 100];
      NODOS.filter((d) => d.rama === rama && d.pide).forEach((d) => {
        const p = POR_ID[d.pide],
          [x0, y0] = centro(p),
          [x1, y1] = centro(d);
        const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
        l.setAttribute("x1", x0);
        l.setAttribute("y1", y0);
        l.setAttribute("x2", x1);
        l.setAttribute("y2", y1);
        l.setAttribute("class", rango(p.id) ? "hecha" : "");
        svg.appendChild(l);
      });
      grilla.appendChild(svg);
      FILAS.forEach((u, f) => {
        if (!f) return;
        const r = document.createElement("span");
        r.className = "ab-fila" + (enRama(rama) >= u ? " abierta" : "");
        r.style.top = f * 25 + "%";
        r.textContent = u;
        grilla.appendChild(r);
      });
      NODOS.filter((d) => d.rama === rama).forEach((d) => {
        const n = rango(d.id),
          porque = falta(d.id),
          abierto = !porque || (n > 0 && n < d.max) || (porque === t("ab.sin_puntos"));
        const b = document.createElement("button");
        b.type = "button";
        b.className = "ab-nodo" + (d.clave ? " clave" : "") + (d.activa ? " activa" : "") + (n ? " tiene" : "") + (n >= d.max ? " lleno" : "") + (porque ? "" : " puede");
        b.style.left = (d.c * 100 + 50) / 3 + "%";
        b.style.top = d.f * 25 + 12.5 + "%";
        b.appendChild(iconoNodo(d, n, abierto));
        b.insertAdjacentHTML("beforeend", `<em>${n}/${d.max}</em>`);
        grilla.appendChild(b);
        const ahora = n ? `<span class="ab-ahora">${t("ab.ahora")} ${efectoTexto(d, n)}</span>` : "";
        const luego = n < d.max ? `<span class="ab-luego">${n ? t("ab.siguiente") : t("ab.primero")} ${efectoTexto(d, n + 1)}</span>` : "";
        const traba = porque && n < d.max ? `<span class="ob-pista">${porque}</span>` : "";
        enfocar.push([b, { nombre: t("ab." + d.id) + (d.clave ? " ◆" : "") + (d.activa ? " · " + (CONTROLES.mando() || !window.BARRA ? CONTROLES.glifo(d.activa) : BARRA.glifoDe("hab_" + d.id)) : ""), col: R.col, html: `<span class="ob-rotulo">${t("ab.rango", [n, d.max])} · ${t("ab.rama_" + rama)}</span>${ahora}${luego}${traba}`, fn: () => subir(d.id) }]);
      });
      col.appendChild(grilla);
      ramas.appendChild(col);
    });
    cuerpo.appendChild(ramas);
    enfocar.forEach(([el, it]) => api.enfocable(el, it));
    api.enfocable(ol, { nombre: t("ab.olvidar"), desc: t("ab.olvidar_d") + " " + sub.textContent + ".", fn: olvidar });
  }

  // ---------- los efectos en la pelea ----------
  function aporte(s) {
    NODOS.forEach((d) => d.s && rango(d.id) && d.s(s, rango(d.id), d.v));
    if (acechoT > 0) s.velMov *= 1 + POR_ID.acecho.v;
  }
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      if (window.RPG) {
        RPG.aporte(aporte);
        RPG.alSubir(() => [t("ab.sube", [CONTROLES.glifo("talentos")])]);
      }
      INVENTARIO.pestana({ id: "talentos", antes: "bolsa", nombre: () => t("ab.tab") + (libres() > 0 ? " ·" + libres() : ""), pintar });
    },
    alEmpezar(extra) {
      extra.arbol = Object.assign(base(), extra.arbol || {});
      st = extra.arbol;
      corazonT = acechoT = 0;
      if (window.RPG) RPG.recalcular();
    },
    actualizar(dt) {
      if (J.modo === "juego" && CONTROLES.recien("talentos")) INVENTARIO.abrir("talentos");
      if (corazonT > 0) corazonT -= dt;
      if (acechoT > 0 && (acechoT -= dt) <= 0 && window.RPG) RPG.recalcular();
    },
    hud() {
      const m = document.getElementById("c_mochila");
      if (m && libres() > 0) m.classList.add("con-puntos");
    },
    modDano(dano, e, info) {
      if (!e || !info) return dano;
      let k = 1;
      if (rango("zarpazo") && info.d && (info.d.remate || info.d.caida)) k += POR_ID.zarpazo.v * rango("zarpazo");
      if (rango("sangre") && e.d && e.d.vida && e.vida / e.d.vida < 0.35) k += POR_ID.sangre.v * rango("sangre");
      if (rango("presagio") && info.contra) k += POR_ID.presagio.v * rango("presagio");
      if (rango("acecho") && info.sorpresa) k *= 2.2 / 1.5; // el golpe por sorpresa pasa de ×1,5 a ×2,2
      return dano * k;
    },
    modRecibido(dano, tipo) {
      if (dano <= 0 || !jug) return dano;
      if (rango("aguante") && jug.hp < jug.hpMax * 0.4) dano *= 1 - POR_ID.aguante.v * rango("aguante");
      // Corazón de Björn: el golpe que dejaría a Eromash en 0 lo deja en pie y le devuelve vida
      const queda = jug.hp - dano * (100 / (100 + (J.armadura || 0)));
      if (rango("corazon") && corazonT <= 0 && queda <= 0) {
        corazonT = ESPERA_CORAZON;
        jug.hp = Math.max(1, Math.round(jug.hpMax * POR_ID.corazon.v));
        A.textoFlotante(jug.x, jug.y - 140, t("ab.corazon_salva"), RAMAS.oso.col);
        if (A.columnaRunica) A.columnaRunica(jug.x, jug.y);
        if (window.SONIDO) SONIDO.tocar("rugido", { vol: 0.6, tono: 0.8 });
        J.sacudir && J.sacudir(8);
        return 0;
      }
      return Math.round(dano);
    },
    alPegar(e, dano, info) {
      // una esquiva justa con Presagio devuelve energía rúnica
      if (info && info.contra && rango("presagio") && window.PODERES && !info.presagio) {
        info.presagio = true;
        PODERES.darEnergia(5 * rango("presagio"));
      }
    },
    alMorir(e) {
      if (!e || e.ciervo) return;
      if (rango("acecho")) {
        acechoT = ACECHO_SEG;
        if (window.RPG) RPG.recalcular();
      }
      if (rango("dos") && window.PODERES) {
        const lider = !!(e.lider || e.patron || e.semi);
        PODERES.darEnergia(lider ? 25 : POR_ID.dos.v);
        if (jug && !jug.muerto) jug.hp = Math.min(jug.hpMax, jug.hp + jug.hpMax * 0.02);
        if (lider) A.textoFlotante(e.x, e.y - 120, t("ab.dos"), RAMAS.cuervo.col);
      }
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return {
    sistema,
    estado: () => st,
    rango,
    enRama,
    libres,
    total,
    falta,
    subir,
    olvidar,
    sumarPuntos: (n) => ((st.extra = (st.extra || 0) + n), INVENTARIO.repintar()),
    sumar: (rama, nodo) => (NODOS.push(Object.assign({ rama }, nodo)), (POR_ID[nodo.id] = NODOS[NODOS.length - 1])),
    corazonListo: () => corazonT <= 0,
    acecho: () => acechoT,
    NODOS,
    RAMAS,
    FILAS,
  };
})();
