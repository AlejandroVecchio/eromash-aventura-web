// ---------- el motor de los minijuegos (MINIJ, modo "minij") ----------
// Lo que comparten los minijuegos de Eldervald (la cerradura de anillos, las losas, el hilo de las Nornas…): un lienzo
// propio de 1600 × 900 con el paño oscuro, la luz rúnica #73D5DB y el violeta de las ataduras, las piedras planas con la
// luz de arriba a la derecha, las runas del futhark (las de JUEGOS_RUNAS), el puntero y los controles por acciones, el
// cartel del final y el pie con las teclas. Cada minijuego se registra con
//   MINIJ.registrar(tipo, { armar(S), paso(S, dt), tocar(S, i), hit(S, x, y) → i, arrastre(S, x, y, fase),
//                            dibujar(S, D), variantes: { id: op }, pie: clave, res(S) → texto, pista(S) → true })
// y se juega con MINIJ.empezar(tipo, { variante, quien, x, y, fin(res) }): `fin` recibe { gano, dejo, ... } y quien lo
// pidió (un cofre, un encargo, un acertijo) decide qué pasa. Las variantes reutilizan el mismo juego con otras reglas.
// Probar mecánicas lista solo todo lo registrado (`MINIJ.lista()`). Textos `mn.` (y los de cada juego).
// `pista(S)` da una ayuda y devuelve true si la dio: el botón «Pista» (o la Lente) la paga con una piedra de Loki
// (motor/loki.js); un juego sin `pista` muestra el botón apagado.
window.MINIJ = (function () {
  "use strict";
  let A, J;
  const t = (k, v) => I18N.t(k, v);
  const JUEGOS = {};
  let S = null,
    lienzo = null,
    c = null;
  const W0 = 1600,
    H0 = 900;

  // ---------- registrar, empezar, terminar ----------
  function registrar(tipo, def) {
    JUEGOS[tipo] = def;
  }
  function empezar(tipo, op = {}) {
    const def = JUEGOS[tipo];
    if (!A || !def) return false;
    crearLienzo();
    const v = Object.assign({}, (def.variantes && def.variantes[op.variante || "base"]) || {}, op.reglas || {});
    S = { tipo, def, op, v, variante: op.variante || "base", t: 0, fin: null, cur: 0, luz: {}, rnd: DIB.azar(op.semilla != null ? op.semilla : Math.floor(Math.random() * 1e9)), modoAntes: J.modo === "menu" || J.modo === "dialogo" ? "juego" : J.modo };
    def.armar(S);
    if (window.LOKI) LOKI.alAbrirJuego();
    J.modo = "minij";
    lienzo.style.display = "block";
    if (window.SONIDO) SONIDO.tocar("pagina", { vol: 0.6 });
    return true;
  }
  function terminar(res) {
    if (!S || S.fin) return;
    S.fin = Object.assign({ t: 0 }, res);
    if (window.SONIDO) SONIDO.tocar(res.gano ? "mision" : "tela", { vol: 0.5 });
  }
  function cerrar() {
    if (!S) return;
    const s = S;
    S = null;
    lienzo.style.display = "none";
    J.modo = s.modoAntes || "juego";
    if (CONTROLES.soltar) CONTROLES.soltar();
    const res = s.fin ? Object.assign({}, s.fin) : { gano: false, dejo: true };
    delete res.t;
    if (s.op.fin) s.op.fin(res);
  }
  // un tono suave (suena cerca de quien juega si el juego vino de un lugar del mundo)
  const sonar = (f, dur = 0.25, forma = "sine") => window.SONIDO && SONIDO.tono(forma, f, f * 1.02, dur, 0.09, S && S.op.x != null ? { x: S.op.x, y: S.op.y } : {});

  // ---------- el lienzo y el puntero ----------
  function aJuego(e) {
    const r = lienzo.getBoundingClientRect(),
      k = Math.min(r.width / W0, r.height / H0);
    return [(e.clientX - r.left - (r.width - W0 * k) / 2) / k, (e.clientY - r.top - (r.height - H0 * k) / 2) / k];
  }
  let apretado = false;
  function crearLienzo() {
    if (lienzo) return;
    lienzo = document.createElement("canvas");
    lienzo.id = "minijLienzo";
    lienzo.className = "ui";
    lienzo.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:60;touch-action:none;pointer-events:auto;display:none";
    document.body.appendChild(lienzo);
    c = lienzo.getContext("2d");
    lienzo.addEventListener("pointerdown", (e) => {
      if (!S) return;
      if (S.fin) return S.fin.t > 0.4 && cerrar();
      const [x, y] = aJuego(e);
      if (window.LOKI && LOKI.dentro(x, y)) return pedirPista();
      apretado = true;
      lienzo.setPointerCapture && lienzo.setPointerCapture(e.pointerId);
      if (S.def.arrastre && S.def.arrastre(S, x, y, "baja") === true) return;
      const i = S.def.hit ? S.def.hit(S, x, y) : null;
      if (i != null) {
        if (i >= 0) S.cur = i;
        S.def.tocar(S, i);
      }
    });
    lienzo.addEventListener("pointermove", (e) => {
      if (!S || S.fin || !apretado || !S.def.arrastre) return;
      const [x, y] = aJuego(e);
      S.def.arrastre(S, x, y, "mueve");
    });
    const soltar = (e) => {
      if (!apretado) return;
      apretado = false;
      if (!S || S.fin || !S.def.arrastre) return;
      const [x, y] = aJuego(e);
      S.def.arrastre(S, x, y, "sube");
    };
    lienzo.addEventListener("pointerup", soltar);
    lienzo.addEventListener("pointercancel", soltar);
  }

  // una pista de Loki: el juego la da y la piedra se gasta (o avisa que no quedan o que no hay nada que ayudar)
  function pedirPista() {
    if (!S || S.fin || !window.LOKI) return;
    S.pistaAviso = LOKI.avisoDe(LOKI.usar(() => !!(S.def.pista && S.def.pista(S))));
  }

  // ---------- cada cuadro (lo llama juego.js por J.modos) ----------
  function paso(dt) {
    if (!S) return;
    S.t += dt;
    if (S.pistaAviso) S.pistaAviso.t -= dt;
    Object.keys(S.luz).forEach((k) => (S.luz[k] -= dt) <= 0 && delete S.luz[k]);
    if (S.fin) {
      S.fin.t += dt;
      if (S.fin.t > 0.4 && (CONTROLES.recien("interactuar") || CONTROLES.recien("seguir") || CONTROLES.recien("pausa"))) return cerrar();
      return dibujar();
    }
    if (CONTROLES.recien("pausa")) return terminar({ gano: false, dejo: true });
    if (CONTROLES.recien("lente")) pedirPista();
    // el reloj de las variantes contra el tiempo
    if (S.v.tiempo) {
      S.queda = Math.max(0, S.v.tiempo - S.t);
      if (S.queda <= 0) return terminar(Object.assign({ gano: false, tiempo: true }, S.def.res ? { dato: S.def.res(S) } : {}));
    }
    S.def.paso(S, dt);
    dibujar();
  }

  // ---------- el dibujo ----------
  const P = (pts, col) => DIB.P(c, pts, col);
  function texto(s, x, y, tam, col, al = "left", peso = 700) {
    c.font = `${peso} ${tam}px "DM Sans", system-ui, sans-serif`;
    c.textAlign = al;
    c.fillStyle = col;
    c.fillText(s, x, y);
  }
  function runa(nom, x, y, s, col, grosor = 0.2) {
    const R = (window.JUEGOS_RUNAS && JUEGOS_RUNAS.RUNAS) || {};
    if (!R[nom]) return;
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.lineCap = "round";
    c.lineJoin = "round";
    c.strokeStyle = col;
    c.lineWidth = grosor;
    R[nom].forEach((tr) => {
      c.beginPath();
      tr.forEach(([a, b], k) => (k ? c.lineTo(a, b) : c.moveTo(a, b)));
      c.stroke();
    });
    c.restore();
  }
  // una piedra plana: cara clara a la derecha, sombra a la izquierda (la luz de arriba a la derecha)
  function piedra(x, y, w, h, cara, sombra) {
    P([x + 8, y, x + w, y, x + w, y + h - 8, x + w - 8, y + h, x, y + h, x, y + 8], sombra);
    P([x + w * 0.42, y, x + w, y, x + w, y + h - 8, x + w - 8, y + h, x + w * 0.42, y + h], cara);
  }
  const rombo = (x, y, s, col) => P([x, y - s, x + s, y, x, y + s, x - s, y], col);
  // un brillo rúnico que no crea degradados: anillos de rombos tenues (se apaga en calidad baja)
  function halo(x, y, r, col, a = 0.35) {
    if (window.CALIDAD && CALIDAD.nivel === "baja") return;
    DIB.alfa(c, a * 0.5, () => rombo(x, y, r, col));
    DIB.alfa(c, a, () => rombo(x, y, r * 0.6, col));
  }
  const D = { get c() { return c; }, P, texto, runa, piedra, rombo, halo, sonar, W: W0, H: H0 };
  function dibujar() {
    const r = lienzo.getBoundingClientRect(),
      dpr = Math.min(2, window.devicePixelRatio || 1);
    if (lienzo.width !== Math.round(r.width * dpr)) (lienzo.width = Math.round(r.width * dpr)), (lienzo.height = Math.round(r.height * dpr));
    const k = Math.min(lienzo.width / W0, lienzo.height / H0);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#111111";
    c.fillRect(0, 0, lienzo.width, lienzo.height);
    c.setTransform(k, 0, 0, k, (lienzo.width - W0 * k) / 2, (lienzo.height - H0 * k) / 2);
    // el paño del juego
    P([180, 40, 1420, 40, 1420, 870, 180, 870], "#1A1412");
    P([180, 40, 1420, 40, 1420, 46, 180, 46], "#2A2220");
    texto(t("mn." + S.tipo), 220, 92, 34, "#FFD98A", "left", 800);
    const sub = [S.op.quien, S.variante !== "base" ? t("mn." + S.tipo + "_v_" + S.variante) : ""].filter(Boolean).join(" · ");
    if (sub) texto(sub, 220, 124, 17, "#E0B2B2", "left", 500);
    if (S.v.tiempo) texto(t("mn.queda", [Math.ceil(S.queda != null ? S.queda : S.v.tiempo)]), 1380, 124, 20, (S.queda || 99) < 10 ? "#FF8D71" : "#73D5DB", "right", 700);
    S.def.dibujar(S, D);
    if (window.LOKI && !S.fin) LOKI.boton(c, !!S.def.pista, S.pistaAviso);
    texto(t(S.def.pie || "mn.pie", [CONTROLES.glifo("interactuar"), CONTROLES.glifo("pausa"), CONTROLES.glifo("arriba")]), 800, 892, 16, "#E0B2B2", "center", 400);
    if (S.fin) {
      DIB.alfa(c, Math.min(0.75, S.fin.t * 2), () => P([0, 0, W0, 0, W0, H0, 0, H0], "#111111"));
      texto(t(S.fin.gano ? "mn.gano" : S.fin.dejo ? "mn.dejo" : S.fin.tiempo ? "mn.sin_tiempo" : "mn.perdio"), 800, 400, 56, S.fin.gano ? "#FFD98A" : "#FF8D71", "center", 800);
      if (S.def.res) texto(S.def.res(S), 800, 460, 26, "#F2ECEC", "center", 600);
      texto(t("mn.seguir", [CONTROLES.glifo("interactuar")]), 800, 520, 18, "#E0B2B2", "center", 400);
    }
  }

  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      J.modos = J.modos || {};
      J.modos.minij = paso;
    },
    alEmpezar() {
      if (S) {
        S = null;
        if (lienzo) lienzo.style.display = "none";
      }
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return {
    sistema,
    registrar,
    empezar,
    terminar,
    cerrar,
    paso,
    tocar: (i) => S && !S.fin && S.def.tocar(S, i),
    pista: pedirPista,
    activo: () => !!S,
    estado: () => S,
    // lo registrado, para Probar mecánicas: [{ tipo, variante }]
    lista: () => Object.keys(JUEGOS).flatMap((tipo) => Object.keys(JUEGOS[tipo].variantes || { base: {} }).map((variante) => ({ tipo, variante }))),
    JUEGOS,
  };
})();
