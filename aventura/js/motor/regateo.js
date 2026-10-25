// ---------- el regateo (sistema REGATEO) ----------
// Con algo elegido en la pestaña del mercader, R (△) es «Regatear»: se elige cuánto pedir (comprando, una rebaja del
// 10, 20 o 30 %; vendiendo, un 15, 30 o 45 % más) y después una aguja corre por la balanza: hay que pararla (E, ✕ o
// tocando) adentro de la zona del trato. Cuanto más se pide, más angosta la zona y más rápida la aguja; el Espíritu
// de Eromash (ATRIBUTOS) y el renombre la ensanchan, y la paciencia del mercader la achica. En el centro justo es un
// «trato redondo» (5 % más). Cada intento errado le gasta paciencia y cada trato también un poco; sin paciencia, por
// hoy no regatea más. El trato vale para esa pieza ese día (E.extra.regateo = { dia, paciencia, tratos }), y se mete
// en los precios con COMERCIO.modPrecio. Cada mercader tiene su carácter: Ingrid es paciente pero firme (zona
// mediana, aguja lenta) y Kolbrun impaciente pero generosa si se acierta (zona chica, trato redondo más grande).
// Detalle en docs/rpg.md (Regateo).
window.REGATEO = (function () {
  "use strict";
  let A, J;
  const t = (k, v) => I18N.t(k, v);
  const PEDIDOS = {
    compra: [0.1, 0.2, 0.3],
    venta: [0.15, 0.3, 0.45],
  };
  const ZONA = [0.3, 0.19, 0.11], // ancho de la zona por pedido (de 1)
    VELOCIDAD = [0.75, 1.05, 1.4], // idas por segundo
    ERRAR = 34,
    ACERTAR = 12,
    REDONDO = 0.18; // la parte del centro de la zona que es trato redondo
  const CARACTER = {
    ingrid: { zona: 1.1, vel: 0.85, redondo: 0.05 },
    kolbrun: { zona: 0.85, vel: 1.15, redondo: 0.1 },
  };
  const base = () => ({ dia: -1, paciencia: {}, tratos: {} });
  let st = base();
  let R = null; // el regateo abierto: { tipo, it, mercader, fase: "pedir" | "aguja" | "fin", pedido, zona: [a, b], x, dir, t0 }
  let raiz = null,
    lienzo = null;

  // ---------- el estado del día ----------
  function alDia() {
    const d = COMERCIO.diaDeHoy();
    if (st.dia !== d) {
      st.dia = d;
      st.paciencia = {};
      st.tratos = {};
    }
  }
  const paciencia = (m) => (alDia(), st.paciencia[m] == null ? 100 : st.paciencia[m]);
  const trato = (it, tipo) => (alDia(), st.tratos[it.u + ":" + tipo]);
  // qué tan ancha es la zona: el pedido, el carácter, la paciencia, el Espíritu y el renombre
  function ancho(m, pedido) {
    const esp = window.ATRIBUTOS ? ATRIBUTOS.valor("esp") : 0,
      ren = window.SECUNDARIAS ? SECUNDARIAS.renombre() : 0,
      c = CARACTER[m] || CARACTER.ingrid;
    return Math.min(0.6, ZONA[pedido] * c.zona * (0.55 + (paciencia(m) / 100) * 0.45) * (1 + esp * 0.03) * (1 + ren * 0.08));
  }

  // ---------- abrir, pedir, parar ----------
  function abrir(tipo, it, mercader) {
    if (paciencia(mercader) <= 0) {
      HUD.aviso(t("rg.sin_paciencia_" + mercader), "#C8402D");
      return false;
    }
    if (trato(it, tipo)) {
      HUD.aviso(t("rg.ya_trato"), "#E0B2B2");
      return false;
    }
    R = { tipo, it, mercader, fase: "pedir", pedido: 1, x: 0, dir: 1 };
    armar();
    raiz.classList.remove("oculto");
    pintar();
    return false;
  }
  function pedir(n) {
    if (!R || R.fase !== "pedir") return;
    R.pedido = n;
    const w = ancho(R.mercader, n),
      rnd = Math.random;
    const c = 0.25 + rnd() * 0.5;
    R.zona = [c - w / 2, c + w / 2];
    R.x = rnd() < 0.5 ? 0 : 1;
    R.dir = R.x ? -1 : 1;
    R.vel = VELOCIDAD[n] * (CARACTER[R.mercader] || CARACTER.ingrid).vel * (1 + (100 - paciencia(R.mercader)) / 250);
    R.fase = "aguja";
    R.t0 = performance.now();
    pintar();
    if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.35, tono: 1.2 });
  }
  const base0 = () => (R.tipo === "compra" ? COMERCIO.precioCompraSin(R.it, R.mercader) : COMERCIO.precioVentaSin(R.it, R.mercader));
  function parar() {
    if (!R || R.fase !== "aguja") return;
    const [a, b] = R.zona,
      dentro = R.x >= a && R.x <= b,
      m = R.mercader,
      c = CARACTER[m] || CARACTER.ingrid;
    if (dentro) {
      const medio = (a + b) / 2,
        redondo = Math.abs(R.x - medio) <= ((b - a) * REDONDO) / 2;
      let f = PEDIDOS[R.tipo][R.pedido] + (redondo ? c.redondo : 0);
      const p0 = base0(),
        precio = Math.max(1, Math.round(R.tipo === "compra" ? p0 * (1 - f) : p0 * (1 + f)));
      st.tratos[R.it.u + ":" + R.tipo] = { precio, f };
      st.paciencia[m] = Math.max(0, paciencia(m) - ACERTAR);
      R.fase = "fin";
      R.bien = true;
      R.redondo = redondo;
      R.precio = precio;
      if (window.SONIDO) SONIDO.tocar(redondo ? "mision" : "plata", { vol: 0.55 });
    } else {
      st.paciencia[m] = Math.max(0, paciencia(m) - ERRAR);
      if (window.SONIDO) SONIDO.tocar("golpe", { vol: 0.4, tono: 0.6 });
      if (paciencia(m) <= 0) {
        R.fase = "fin";
        R.bien = false;
      } else {
        // otra vuelta, con la zona un poco más chica y la aguja más rápida
        R.fase = "pedir";
        R.erro = true;
      }
    }
    pintar();
    if (window.INVENTARIO) INVENTARIO.repintar();
  }
  function cerrar() {
    if (!R) return;
    R = null;
    if (raiz) raiz.classList.add("oculto");
    if (window.INVENTARIO) INVENTARIO.repintar();
  }

  // ---------- la ventana ----------
  function armar() {
    if (raiz) return;
    raiz = document.createElement("div");
    raiz.id = "regateo";
    raiz.className = "panel oculto";
    raiz.innerHTML = `<h3></h3><p class="rg-dice"></p><div class="rg-pedidos"></div><canvas width="640" height="96"></canvas><p class="rg-ayuda"></p><div class="rg-pie"><span class="rg-paciencia"><i></i></span><button type="button" class="rg-cerrar"></button></div>`;
    document.body.appendChild(raiz);
    lienzo = raiz.querySelector("canvas");
    lienzo.addEventListener("pointerdown", (e) => (e.preventDefault(), parar()));
    raiz.querySelector(".rg-cerrar").addEventListener("click", cerrar);
  }
  function pintar() {
    if (!R) return;
    const m = R.mercader,
      nombre = OBJETOS.nombre(R.it),
      p0 = base0();
    raiz.querySelector("h3").textContent = t("rg.titulo", [t("av.nombre_" + m), nombre]);
    const dice = raiz.querySelector(".rg-dice");
    if (R.fase === "fin") dice.textContent = R.bien ? t(R.redondo ? "rg.redondo_" + m : "rg.trato_" + m, [R.precio]) : t("rg.sin_paciencia_" + m);
    else if (R.erro) dice.textContent = t("rg.erro_" + m);
    else dice.textContent = t(R.tipo === "compra" ? "rg.pide" : "rg.ofrece", [t("av.nombre_" + m), p0]);
    const ped = raiz.querySelector(".rg-pedidos");
    ped.innerHTML = "";
    ped.style.display = R.fase === "pedir" ? "" : "none";
    PEDIDOS[R.tipo].forEach((f, n) => {
      const b = document.createElement("button");
      b.type = "button";
      const precio = Math.round(R.tipo === "compra" ? p0 * (1 - f) : p0 * (1 + f));
      b.innerHTML = `<b>${R.tipo === "compra" ? "−" : "+"}${Math.round(f * 100)} %</b><small>${t("rg.por", [precio])}</small>`;
      b.className = n === R.pedido ? "foco" : "";
      b.addEventListener("click", () => pedir(n));
      ped.appendChild(b);
    });
    lienzo.style.display = R.fase === "aguja" || R.fase === "fin" ? "" : "none";
    raiz.querySelector(".rg-ayuda").textContent =
      R.fase === "pedir" ? t("rg.ayuda_pedir", [CONTROLES.glifo("interactuar"), CONTROLES.glifo("pausa")]) : R.fase === "aguja" ? t("rg.ayuda_aguja", [CONTROLES.glifo("interactuar")]) : t("rg.ayuda_fin", [CONTROLES.glifo("interactuar")]);
    raiz.querySelector(".rg-paciencia i").style.width = paciencia(m) + "%";
    raiz.querySelector(".rg-paciencia").title = t("rg.paciencia");
    raiz.querySelector(".rg-cerrar").textContent = t("ui.cerrar");
    dibujar();
  }
  // la balanza: la barra con la zona del trato (dorada, con el centro claro) y la aguja
  function dibujar() {
    if (!R || !lienzo || !R.zona) return;
    const c = lienzo.getContext("2d"),
      W0 = 40,
      W1 = 600,
      y = 40;
    c.clearRect(0, 0, 640, 96);
    DIB.P(c, [W0, y - 14, W1, y - 14, W1, y + 14, W0, y + 14], "#221B18");
    DIB.P(c, [W0, y + 6, W1, y + 6, W1, y + 14, W0, y + 14], "#1A1412");
    const X = (v) => W0 + (W1 - W0) * v,
      [a, b] = R.zona,
      med = (a + b) / 2,
      r = ((b - a) * REDONDO) / 2;
    DIB.P(c, [X(a), y - 14, X(b), y - 14, X(b), y + 14, X(a), y + 14], "#9C2315");
    DIB.P(c, [X(a) + 3, y - 11, X(b) - 3, y - 11, X(b) - 3, y + 11, X(a) + 3, y + 11], "#C8402D");
    DIB.P(c, [X(med - r), y - 11, X(med + r), y - 11, X(med + r), y + 11, X(med - r), y + 11], "#FFD98A");
    // la runa Gebo (el regalo, el trato) arriba de la zona
    FUTHARK.dibujar(c, "gebo", X(med), y - 20, 16, "#FFD98A", 3);
    // la aguja: un rombo con la punta abajo
    const x = X(R.x);
    const col = R.fase === "fin" ? (R.bien ? "#7BC86C" : "#C8402D") : "#F2ECEC";
    DIB.P(c, [x, y + 20, x - 8, y - 2, x, y - 26, x + 8, y - 2], col);
    DIB.P(c, [x, y + 20, x, y - 26, x + 8, y - 2], R.fase === "fin" ? col : "#E0B2B2");
    // las marcas de la balanza
    for (let i = 0; i <= 10; i++) DIB.L(c, X(i / 10), y + 18, X(i / 10), y + 26, "#5E130D", 2);
  }
  let antes = 0;
  function cuadro(ahora) {
    requestAnimationFrame(cuadro);
    const dt = Math.min(0.05, (ahora - antes) / 1000 || 0);
    antes = ahora;
    if (!R || R.fase !== "aguja") return;
    R.x += R.dir * R.vel * dt;
    if (R.x > 1) (R.x = 2 - R.x), (R.dir = -1);
    if (R.x < 0) (R.x = -R.x), (R.dir = 1);
    dibujar();
  }
  // el teclado y el mando mientras está abierto (la mochila le cede el paso)
  function paso() {
    if (!R) return false;
    if (CONTROLES.recien("pausa") || CONTROLES.recien("inventario")) return cerrar(), true;
    if (R.fase === "pedir") {
      const e = CONTROLES.eje(),
        d = e.x > 0.5 ? 1 : e.x < -0.5 ? -1 : 0;
      if (d && d !== R.ejeAntes) {
        R.pedido = Math.max(0, Math.min(2, R.pedido + d));
        pintar();
      }
      R.ejeAntes = d;
      if (CONTROLES.recien("interactuar") || CONTROLES.recien("seguir")) pedir(R.pedido);
    } else if (R.fase === "aguja") {
      if (CONTROLES.recien("interactuar") || CONTROLES.recien("seguir") || CONTROLES.recien("atacar")) parar();
    } else if (CONTROLES.recien("interactuar") || CONTROLES.recien("seguir")) cerrar();
    return true;
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      // el precio de lo tratado
      COMERCIO.modPrecio((p, info) => {
        const tr = info.it && trato(info.it, info.tipo);
        return tr ? tr.precio : p;
      });
      COMERCIO.altCasilla((info) => ({ texto: trato(info.it, info.tipo) ? t("rg.tratado", [trato(info.it, info.tipo).precio]) : t("rg.regatear", [CONTROLES.glifo("lente")]), fn: () => abrir(info.tipo, info.it, info.mercader) }));
      INVENTARIO.capturar(paso);
      requestAnimationFrame(cuadro);
    },
    alEmpezar(extra) {
      extra.regateo = Object.assign(base(), extra.regateo || {});
      st = extra.regateo;
      cerrar();
    },
    actualizar() {
      if (R && !INVENTARIO.abierta()) cerrar();
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, abrir, pedir, parar, cerrar, estado: () => st, abierto: () => R, paciencia, trato, ancho, PEDIDOS, ZONA, CARACTER };
})();
