// ---------- cofres con candado y ganzúas (sistema CERRADURAS, modo "ganzua") ----------
// Como las cerraduras del Skyrim: catorce cofres con candado (asset `cofreCandado`) en lugares apartados de Eldervald,
// de cuatro niveles (bronce, hierro, plata y runas). Para abrirlos hace falta una ganzúa (se compran a Ingrid y salen
// de algunos cofres) y el juego de la cerradura: se mueve la ganzúa buscando el punto justo (izquierda / derecha, o
// arrastrando) y se gira la cerradura (manteniendo E, atacar o el botón Girar). Cuanto más cerca del punto, más gira;
// si se fuerza donde no va, la ganzúa sufre y se rompe. Cuanto más difícil el candado, más chico el punto y mejor lo
// de adentro. Cada candado abierto suma práctica: a los 5, 15 y 30 el punto se agranda.
// Estado en E.extra.cerraduras = { abiertos: { i: 1 }, abiertas, rotas }. Las ganzúas son un material (MATERIALES,
// `ganzua`). Textos `gz.`.
window.CERRADURAS = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  // cada nivel: el ancho del punto justo (grados), cuánto aguanta la ganzúa forzando (s), lo que trae
  const NIVELES = [
    { ancho: 30, aguante: 1.1, plata: 25, r: 1, ganzuas: 1 },
    { ancho: 20, aguante: 0.9, plata: 50, r: 1, extra: 1 },
    { ancho: 12, aguante: 0.75, plata: 95, r: 2, extra: 2, esquirla: 1 },
    { ancho: 7, aguante: 0.6, plata: 170, r: 3, extra: 3, esquirla: 2 },
  ];
  const PRACTICA = [5, 15, 30], // candados abiertos para cada mejora
    MAS_ANCHO = 3, // grados por mejora
    CAIDA = 55, // grados fuera del punto donde ya no gira nada
    VEL_GANZUA = 110, // grados por segundo con las flechas o el stick
    VEL_GIRO = 1.6,
    RADIO = 120;
  // dónde están (px del mapa de Eldervald) y de qué nivel
  const SITIOS = [
    [540, 420, 0], [380, 262, 0], [770, 880, 0],
    [300, 180, 1], [150, 230, 1], [1110, 280, 1], [240, 650, 1], [180, 400, 1],
    [560, 140, 2], [1460, 260, 2], [1380, 800, 2],
    [1300, 560, 3], [1500, 150, 3], [100, 140, 3],
  ];
  const base = () => ({ abiertos: {}, abiertas: 0, rotas: 0 });
  let st = base();
  const cofres = []; // { i, nivel, cosa }
  let ses = null, // { c, ang, giro, dulce, ancho, sufre, fin, abierta, tiembla }
    modoAntes = "juego",
    arrastre = null;

  const ganzuas = () => (window.MATERIALES ? MATERIALES.cuantos("ganzua") : 0);
  const mejoras = () => PRACTICA.filter((n) => st.abiertas >= n).length;
  const anchoDe = (nivel) => NIVELES[nivel].ancho + MAS_ANCHO * mejoras();
  // hasta dónde gira la cerradura con la ganzúa en este ángulo (1: abre)
  function tope(ang) {
    const d = Math.abs(ang - ses.dulce) - ses.ancho / 2;
    return d <= 0 ? 1 : Math.max(0, 1 - d / CAIDA);
  }

  // ---------- empezar y terminar ----------
  function empezar(c) {
    if (st.abiertos[c.i]) return false;
    if (ganzuas() <= 0) return HUD.aviso(t("gz.sin_ganzuas"), "#C8402D"), false;
    ses = { c, ang: 0, giro: 0, dulce: Math.round((Math.random() * 2 - 1) * 80), ancho: anchoDe(c.nivel), sufre: 0, fin: 0, abierta: false, tiembla: 0 };
    modoAntes = J.modo === "menu" ? "juego" : J.modo;
    J.modo = "ganzua";
    armarCapa();
    if (window.SONIDO) SONIDO.tocar("crujido", { vol: 0.35, tono: 1.6 });
    return true;
  }
  function cerrar() {
    ses = null;
    arrastre = null;
    J.modo = modoAntes || "juego";
    const el = document.getElementById("ganzua");
    if (el) el.classList.add("oculto");
    CONTROLES.soltar && CONTROLES.soltar();
  }
  function romper() {
    MATERIALES.gastar({ ganzua: 1 });
    st.rotas++;
    ses.sufre = 0;
    ses.giro = 0;
    ses.tiembla = 0.4;
    HUD.aviso(t("gz.rota", [ganzuas()]), "#C8402D");
    if (window.SONIDO) SONIDO.tocar("golpe", { vol: 0.5, tono: 1.8 });
    if (ganzuas() <= 0) ses.fin = 1.1;
  }
  function abrir() {
    const c = ses.c,
      N = NIVELES[c.nivel];
    ses.abierta = true;
    ses.fin = 1.1;
    st.abiertos[c.i] = 1;
    st.abiertas++;
    c.cosa.o.abierto = true;
    if (window.SONIDO) SONIDO.tocar("mision", { vol: 0.45, tono: 1.2 });
    const quedan = cofres.filter((q) => !st.abiertos[q.i]).length;
    // lo de adentro: plata y una pieza (por PODERES.botinCofre: la pieza la suma botin.js), más según el nivel
    J.retrasar(0.4, () => {
      PODERES.botinCofre(c.cosa.x, c.cosa.y, t("gz.cofre_" + c.nivel) + " " + t("gz.quedan", [cofres.length - quedan, cofres.length]), { plata: N.plata }, true);
      for (let k = 0; k < (N.extra || 0); k++) {
        const it = OBJETOS.generar({ n: window.RPG ? RPG.nivel() : 1, min: N.r, hallazgo: 1 + c.nivel });
        J.retrasar(0.5 + k * 0.25, () => BOTIN.tirar(c.cosa.x, c.cosa.y - 20, it, true));
      }
      if (N.esquirla) MATERIALES.dar("esquirla", N.esquirla, c.cosa.x, c.cosa.y);
      if (N.ganzuas) MATERIALES.dar("ganzua", N.ganzuas, c.cosa.x, c.cosa.y);
    });
    if (PRACTICA.includes(st.abiertas)) J.retrasar(1.4, () => HUD.aviso(t("gz.practica_d", [anchoDe(0) - NIVELES[0].ancho]), "lugar", t("gz.practica")));
  }

  // ---------- el juego de la cerradura ----------
  function paso(dt) {
    if (!ses) return cerrar();
    ses.tiembla = Math.max(0, ses.tiembla - dt);
    if (ses.fin > 0) {
      if ((ses.fin -= dt) <= 0) cerrar();
      return dibujar();
    }
    if (CONTROLES.recien("pausa") || CONTROLES.recien("inventario")) return cerrar();
    // mover la ganzúa (no mientras gira)
    const girando = ses.boton || CONTROLES.pulsado("interactuar") || CONTROLES.pulsado("atacar");
    if (!girando) {
      let dx = CONTROLES.eje().x;
      if (CONTROLES.pulsado("izquierda")) dx = -1;
      if (CONTROLES.pulsado("derecha")) dx = 1;
      ses.ang = Math.max(-90, Math.min(90, ses.ang + dx * VEL_GANZUA * dt));
    }
    // girar: llega hasta donde deja el punto; si se fuerza más, la ganzúa sufre
    if (girando) {
      const top = tope(ses.ang);
      ses.giro = Math.min(top, ses.giro + VEL_GIRO * dt);
      if (ses.giro >= 1) return abrir(), dibujar();
      if (ses.giro >= top - 0.001) {
        ses.sufre += dt;
        if (Math.random() < 0.3 && window.SONIDO) SONIDO.tocar("crujido", { vol: 0.12, tono: 2 + Math.random() });
        if (ses.sufre >= NIVELES[ses.c.nivel].aguante) romper();
      }
    } else {
      ses.giro = Math.max(0, ses.giro - VEL_GIRO * 1.5 * dt);
      ses.sufre = Math.max(0, ses.sufre - dt * 0.5);
    }
    dibujar();
  }
  function armarCapa() {
    let el = document.getElementById("ganzua");
    if (!el) {
      document.body.insertAdjacentHTML("beforeend", `<div id="ganzua" class="ui panel"><h2></h2><canvas width="560" height="340"></canvas><div class="gz-botones"><button type="button" class="gz-girar"></button><button type="button" class="gz-dejar"></button></div><p class="gz-pie"></p></div>`);
      el = document.getElementById("ganzua");
      const cv = el.querySelector("canvas");
      // arrastrar sobre la cerradura mueve la ganzúa
      const mover = (e) => {
        if (!ses || !arrastre) return;
        const r = cv.getBoundingClientRect();
        ses.ang = Math.max(-90, Math.min(90, arrastre.ang + ((e.clientX - arrastre.x) / r.width) * 260));
      };
      cv.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        if (ses) arrastre = { x: e.clientX, ang: ses.ang };
        cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
      });
      cv.addEventListener("pointermove", mover);
      cv.addEventListener("pointerup", () => (arrastre = null));
      const g = el.querySelector(".gz-girar");
      g.addEventListener("pointerdown", (e) => (e.preventDefault(), ses && (ses.boton = true)));
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => g.addEventListener(ev, () => ses && (ses.boton = false)));
      el.querySelector(".gz-dejar").addEventListener("click", () => ses && !ses.fin && cerrar());
    }
    el.classList.remove("oculto");
    el.querySelector("h2").textContent = t("gz.cofre_" + ses.c.nivel);
    el.querySelector(".gz-girar").textContent = t("gz.girar");
    el.querySelector(".gz-dejar").textContent = t("gz.dejar");
    el.querySelector(".gz-pie").textContent = t("gz.pie", [CONTROLES.glifo("izquierda") + " " + CONTROLES.glifo("derecha"), CONTROLES.glifo("interactuar"), CONTROLES.glifo("pausa")]);
  }
  // el dibujo: la placa del candado con su anillo de runas, el ojo que gira, la ganzúa y la llave de tensión
  function dibujar() {
    const el = document.getElementById("ganzua");
    if (!el || !ses) return;
    const c = el.querySelector("canvas").getContext("2d"),
      cx = 280,
      cy = 170,
      N = ses.c.nivel,
      [col, luz] = ASSETS.CANDADO[N];
    c.clearRect(0, 0, 560, 340);
    // la placa: sombra, disco con la mitad izquierda en sombra, anillo de runas
    DIB.E(c, cx + 6, cy + 10, 140, 140, "rgba(0,0,0,0.35)");
    DIB.E(c, cx, cy, 136, 136, col);
    c.save();
    c.beginPath();
    c.rect(cx, cy - 140, 140, 280);
    c.clip();
    DIB.E(c, cx, cy, 136, 136, luz);
    c.restore();
    DIB.E(c, cx, cy, 110, 110, "#2A2628");
    const runas = ["fehu", "uruz", "thurisaz", "ansuz", "raidho", "kenaz", "gebo", "wunjo", "hagalaz", "naudiz", "isa", "jera"];
    runas.forEach((r, k) => {
      const a = (k / runas.length) * Math.PI * 2 - Math.PI / 2;
      FUTHARK.dibujar(c, r, cx + Math.cos(a) * 123, cy + Math.sin(a) * 123 + 7, 14, N === 3 ? "#73D5DB" : "#111111", 2);
    });
    // el cilindro que gira con la cerradura
    const giro = ses.giro * (Math.PI / 2) + (ses.giro >= 0.999 ? 0 : (ses.sufre > 0.05 ? Math.sin(J.t * 60) * 0.03 : 0));
    c.save();
    c.translate(cx, cy);
    c.rotate(giro);
    DIB.E(c, 0, 0, 70, 70, "#5A5450");
    c.save();
    c.beginPath();
    c.rect(0, -72, 72, 144);
    c.clip();
    DIB.E(c, 0, 0, 70, 70, "#8E8A86");
    c.restore();
    DIB.P(c, [-9, -40, 9, -40, 9, 4, 16, 34, -16, 34, -9, 4], "#111111");
    c.restore();
    // la llave de tensión, abajo, gira con el cilindro
    c.save();
    c.translate(cx, cy);
    c.rotate(giro);
    DIB.P(c, [-4, 18, 4, 18, 4, 150, -4, 150], "#3A3634");
    DIB.P(c, [-4, 150, 60, 150, 60, 158, -4, 158], "#3A3634");
    c.restore();
    // la ganzúa: sale del centro hacia arriba en su ángulo y tiembla si sufre
    const tb = ses.sufre > 0 ? (Math.random() - 0.5) * ses.sufre * 6 : 0;
    const a = ((ses.ang + tb) * Math.PI) / 180 - Math.PI / 2;
    const sano = 1 - Math.min(1, ses.sufre / NIVELES[N].aguante);
    c.strokeStyle = sano > 0.5 ? "#F2ECEC" : sano > 0.2 ? "#FF8D71" : "#C8402D";
    c.lineWidth = 5;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6);
    c.lineTo(cx + Math.cos(a) * 190, cy + Math.sin(a) * 190);
    c.stroke();
    c.lineWidth = 10;
    c.strokeStyle = "#7A5634";
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * 150, cy + Math.sin(a) * 150);
    c.lineTo(cx + Math.cos(a) * 200, cy + Math.sin(a) * 200);
    c.stroke();
    // las ganzúas que quedan, y cuánto aguanta la de ahora
    c.font = '800 15px "DM Sans", system-ui, sans-serif';
    c.textAlign = "left";
    c.fillStyle = "#E0B2B2";
    c.fillText(t("gz.quedan_ganzuas", [ganzuas()]), 16, 28);
    c.fillStyle = "#3A3634";
    c.fillRect(16, 38, 120, 8);
    c.fillStyle = sano > 0.5 ? "#7BC86C" : sano > 0.2 ? "#FF8D71" : "#C8402D";
    c.fillRect(16, 38, 120 * sano, 8);
    c.textAlign = "right";
    c.fillStyle = luz;
    c.fillText(t("gz.n_" + N), 544, 28);
    if (ses.fin > 0) {
      c.font = '900 30px "Eromash Display", system-ui, sans-serif';
      c.textAlign = "center";
      c.fillStyle = ses.abierta ? "#FFD98A" : "#FF8D71";
      c.fillText(t(ses.abierta ? "gz.abierto" : "gz.sin_ganzuas_corto"), cx, 330);
    }
  }

  // ---------- ubicar ----------
  function ubicar() {
    SITIOS.forEach(([px, py, nivel], i) => {
      const p0 = [px * W.U, py * W.U];
      let pm = null;
      for (let k = 0; k < 200 && !pm; k++) {
        const a = i * 1.7 + k * 0.71,
          d = k * 10,
          x = p0[0] + Math.cos(a) * d,
          y = p0[1] + Math.sin(a) * d * 0.8;
        if (x < 200 || y < 200 || x > W.ANCHO - 200 || y > W.ALTO - 200) continue;
        const solo = !W.COSAS.some((o) => !o.oculto && !o.arbol && o.id !== "roca" && Math.hypot(o.x - x, o.y - y) < 160);
        if (solo && W.libreDeTodo(x, y, 50) && W.sueloEn(x, y) === 0 && !W.CAMINOS.some((cm) => W.distLinea(x, y, cm.p) < cm.w / 2 + 40)) pm = [x, y];
      }
      pm = pm || p0;
      // los árboles que lo taparían desde adelante se corren
      W.cercanas(pm[0] - 200, pm[1] - 140, pm[0] + 200, pm[1] + 300, (o) => {
        if (!o.arbol && o.id !== "roca" && o.id !== "troncoCaido") return;
        const dy = o.y - pm[1];
        if (Math.hypot(o.x - pm[0], dy > 0 ? dy * 0.7 : dy * 1.3) > 180) return;
        o.oculto = true;
        o.choque = null;
      });
      cofres.push({ i, nivel, cosa: W.agregar("cofreCandado", pm, { sem: 11 + i, nivel }) });
    });
  }

  // la primera vez, tres ganzúas de regalo (MATERIALES puede empezar después que este sistema: se mira también al andar)
  function regalo() {
    if (st.regalo || !window.MATERIALES || MATERIALES.estado().tiene === undefined) return;
    const m = MATERIALES.estado();
    if (A.H.E.extra && A.H.E.extra.mat !== m) return;
    st.regalo = 1;
    m.tiene.ganzua = (m.tiene.ganzua || 0) + 3;
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      J.modos = J.modos || {};
      J.modos.ganzua = paso;
      // la ganzúa es un material más (se ve en la Bolsa y la vende Ingrid)
      if (window.MATERIALES && !MATERIALES.LISTA.includes("ganzua")) MATERIALES.LISTA.push("ganzua");
      INVENTARIO.iconoDe("mt_ganzua", (c) => {
        DIB.P(c, [-22, 18, -16, 24, 18, -10, 12, -16], "#5A5450");
        DIB.P(c, [12, -16, 18, -10, 24, -18, 26, -28, 20, -22], "#8E8A86");
        DIB.P(c, [-26, 14, -12, 28, -6, 22, -20, 8], "#7A5634");
        DIB.P(c, [-14, -6, 20, 18, 16, 22, -18, -2], "#3A3634");
      });
    },
    alEmpezar(extra) {
      extra.cerraduras = Object.assign(base(), extra.cerraduras || {});
      st = extra.cerraduras;
      if (!cofres.length) ubicar();
      cofres.forEach((c) => (c.cosa.o.abierto = !!st.abiertos[c.i]));
      if (ses) cerrar();
      regalo();
    },
    actualizar() {
      regalo();
    },
    cercanos(dar) {
      if (J.dentro) return;
      for (const c of cofres) {
        if (st.abiertos[c.i]) continue;
        const d = Math.hypot(c.cosa.x - jug.x, c.cosa.y - jug.y);
        if (d < RADIO) dar(d, t("gz.usar", [t("gz.n_" + c.nivel)]), () => empezar(c), c.cosa.x, c.cosa.y - 90);
      }
    },
    luces(dar) {
      for (const c of cofres) if (c.nivel === 3 && !st.abiertos[c.i]) dar({ x: c.cosa.x, y: c.cosa.y - 20, r: 90, col: "#73D5DB", f: 0.35 });
    },
    marcasMapa() {
      return cofres.map((c) => ({ tipo: "cofre", x: c.cosa.x, y: c.cosa.y, op: { nombre: t("gz.cofre_" + c.nivel), apagado: !!st.abiertos[c.i] } }));
    },
    diario() {
      return st.abiertas ? `<div class="diario-resumen"><p><b>${t("gz.titulo")}</b> ${t("gz.diario", [st.abiertas, cofres.length, st.rotas])}</p></div>` : "";
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, empezar, cerrar, sesion: () => ses, cofres: () => cofres, tope: (a) => (ses ? tope(a) : 0), anchoDe, NIVELES, PRACTICA, SITIOS };
})();
