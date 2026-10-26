// ---------- el mapa propio de Eikholt (MAPA25): el minimapa de la ciudad y el mapa grande con la M ----------
// Adentro de la capital el mapa del bosque no sirve (la ciudad entera es un punto): este se pinta una sola vez desde el
// plano (PLANO25), visto desde arriba con el norte arriba, con el mismo lenguaje del mapa del bosque: pasto, el río,
// las calles de laja y de tierra, la huella de cada casa, los pinos y abedules, la empalizada con sus cuatro puertas y
// el Roble en el centro. Encima, en vivo: las miniaturas de los lugares (interfaz/iconos.js) con su nombre, la gente
// con nombre, la marca propia y Eromash con su flecha. El sistema del mapa (interfaz/mapa.js) le pasa el minimapa
// cuando EIKHOLT está activo y la ciudad (ciudad/juego.js) abre el grande con la acción `mapa`.
window.MAPA25 = (() => {
  const t = (k, ...a) => I18N.t(k, ...a);
  let plano = null,
    baseG = null, // el mapa grande
    baseM = null; // el del minimapa, con más detalle
  const BASE_G = 1500,
    BASE_M = 2600;
  // cada lugar del plano con su miniatura (y el texto de su nombre: ci.m_<lugar>)
  const ICONO = {
    ting: "santuario", pozo: "manantial", campana: "torre", tablon: "contrato", lindes: "casa", carpinteria: "aserradero", herreria: "yunque",
    cordeleria: "puesto", curtiembre: "puesto", sanacion: "sanacion", hierbas: "manzano", hospederia: "casa", guardia: "torre", entrenamiento: "instructor",
    forasteros: "caravana", corral: "caravana", huertas: "manzano", hongo: "taberna", tablero: "contrato", casa_guardia: "torre", mercado: "puesto", hnefatafl: "tafl", cintas: "cintas",
  };
  // los lugares que se ven también en el minimapa (los grandes)
  const MINI = { herreria: 1, sanacion: 1, hongo: 1, ting: 1, lindes: 1, guardia: 1, forasteros: 1, hospederia: 1, mercado: 1 };

  // ---------- la base: se pinta una sola vez ----------
  function lado() {
    return plano.R_FUERA * 2 + 1600;
  }
  function pintar(ancho) {
    const L = lado(),
      k = ancho / L,
      cv = document.createElement("canvas");
    cv.width = cv.height = ancho;
    const c = cv.getContext("2d");
    c.fillStyle = "#1E2019";
    c.fillRect(0, 0, ancho, ancho);
    c.setTransform(k, 0, 0, k, ancho / 2, ancho / 2);
    const disco = (r, col) => {
      c.fillStyle = col;
      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI * 2);
      c.fill();
    };
    // afuera de la empalizada, el claro del bosque; adentro el pasto pisado
    disco(plano.R_FUERA + 700, "#2A4226");
    disco(plano.R_FUERA, "#3A5228");
    disco(plano.R_MURO, "#4E6A32");
    const trazo = (pts, w, col) => {
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      pts.forEach((p) => c.lineTo(p[0], p[1]));
      c.strokeStyle = col;
      c.lineWidth = w;
      c.lineJoin = c.lineCap = "round";
      c.stroke();
    };
    // el río
    trazo(plano.rio.pts, plano.rio.ancho * 1.25, "#24464F");
    trazo(plano.rio.pts, plano.rio.ancho, "#2E5A66");
    // la plaza empedrada
    disco(plano.plaza + 120, "#2A2016");
    disco(plano.plaza, "#8E8678");
    // las calles: primero los bordes, después el piso (así se juntan donde se cruzan)
    const anchoMin = 4 / k;
    plano.calles.forEach((cl) => trazo(cl.pts, Math.max(anchoMin * 1.6, cl.w * 1.25), "#2A2016"));
    plano.calles.forEach((cl) => trazo(cl.pts, Math.max(anchoMin, cl.w * 0.9), cl.tipo === "laja" ? "#9C9484" : cl.tipo === "senda" ? "#8A7650" : "#C2A472"));
    // la huella de cada casa, con su sombra corrida abajo a la izquierda (luz de arriba a la derecha)
    const poli = (pts, col, dx = 0, dy = 0) => {
      c.fillStyle = col;
      c.beginPath();
      pts.forEach(([x, y], i) => (i ? c.lineTo(x + dx, y + dy) : c.moveTo(x + dx, y + dy)));
      c.fill();
    };
    const huellas = plano.choques.filter((h) => h.poli);
    huellas.forEach((h) => poli(h.poli, "rgba(17,17,17,0.45)", -40, 50));
    huellas.forEach((h) => poli(h.poli, "#5E4A36"));
    huellas.forEach((h) => {
      // la mitad de arriba a la derecha más clara: el techo a dos aguas
      const p = h.poli,
        cx = p.reduce((s, q) => s + q[0], 0) / p.length,
        cy = p.reduce((s, q) => s + q[1], 0) / p.length;
      poli(p.map(([x, y]) => [cx + (x - cx) * 0.82 + 12, cy + (y - cy) * 0.82 - 12]), "#7A5E42");
    });
    // los árboles: pinos y abedules como triángulos del mapa del bosque
    for (const o of plano.cosas) {
      if (o.id !== "pino" && o.id !== "abedul") continue;
      const h = (o.id === "pino" ? 150 : 120) * ((o.o && o.o.s) || 1);
      c.fillStyle = o.id === "pino" ? "#18261A" : "#3A5228";
      c.beginPath();
      c.moveTo(o.x, o.y - h);
      c.lineTo(o.x + h * 0.5, o.y + h * 0.3);
      c.lineTo(o.x - h * 0.5, o.y + h * 0.3);
      c.fill();
      c.fillStyle = o.id === "pino" ? "#2A4226" : "#5E7A3A";
      c.beginPath();
      c.moveTo(o.x, o.y - h);
      c.lineTo(o.x + h * 0.5, o.y + h * 0.3);
      c.lineTo(o.x + h * 0.1, o.y + h * 0.15);
      c.fill();
    }
    // la empalizada con un hueco en cada puerta
    const huecos = Object.values(plano.puertas);
    c.lineCap = "butt";
    const anillo = (w, col) => {
      c.strokeStyle = col;
      c.lineWidth = w;
      const pasos = 240;
      for (let i = 0; i < pasos; i++) {
        const a0 = (i / pasos) * Math.PI * 2,
          a1 = ((i + 1) / pasos) * Math.PI * 2,
          am = (a0 + a1) / 2;
        if (huecos.some((a) => Math.abs(Math.atan2(Math.sin(am - a), Math.cos(am - a))) < 0.045)) continue;
        c.beginPath();
        c.arc(0, 0, plano.R_MURO, a0, a1 + 0.002);
        c.stroke();
      }
    };
    anillo(260, "#2A2016");
    anillo(150, "#9C7A4E");
    // el Roble: la copa grande en el centro
    disco(1050, "#33421F");
    c.fillStyle = "#536830";
    c.beginPath();
    c.arc(160, -160, 820, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#667D38";
    c.beginPath();
    c.arc(300, -300, 420, 0, Math.PI * 2);
    c.fill();
    return cv;
  }
  function preparar(p) {
    if (plano === p && baseG) return;
    plano = p;
    baseG = pintar(BASE_G);
    baseM = pintar(BASE_M);
  }

  // ---------- lo de encima: lugares, gente, la marca y Eromash ----------
  // dibuja sobre `c` con `aqui(x, y)` → píxel; `u` es el tamaño de las miniaturas; `todo` = el mapa grande
  function encima(c, aqui, u, op) {
    const { ero, gente, todo, marca, senalado } = op;
    const lug = plano.lugares;
    for (const k in ICONO) {
      if (!lug[k] || (!todo && !MINI[k])) continue;
      const [px, py] = aqui(lug[k][0], lug[k][1]);
      if (px < -20 || py < -20 || px > c.canvas.width + 20 || py > c.canvas.height + 20) continue;
      ICONOS.dibujar(c, ICONO[k], px, py, (k === senalado ? 1.25 : 1) * u, {});
      // de lejos solo los nombres de los grandes (si no se pisan); de cerca, o el señalado, todos
      if (todo && (MINI[k] || op.z >= 1.6 || k === senalado)) rotulo(c, t("ci.m_" + k), px, py + u * 1.2, u * 0.78, k === senalado);
    }
    // las casas de vecinos que se entran: una casita chica en el mapa grande, tenue si ya se entró
    if (todo && op.casas)
      for (const cs of op.casas) {
        const [px, py] = aqui(cs.x, cs.y);
        if (px < -20 || py < -20 || px > c.canvas.width + 20 || py > c.canvas.height + 20) continue;
        c.save();
        c.globalAlpha = (op.vistas || []).includes(cs.nombre) ? 0.45 : 1;
        ICONOS.dibujar(c, "casa", px, py, u * 0.55, {});
        c.restore();
      }
    // las cuatro puertas
    for (const k in plano.puertas) {
      const a = plano.puertas[k],
        [px, py] = aqui(Math.cos(a) * plano.R_MURO, Math.sin(a) * plano.R_MURO);
      ICONOS.dibujar(c, "puerta", px, py, u * 0.8, {});
      if (todo && op.z >= 1.6) rotulo(c, t("ci.m_puerta_" + k), px, py + u * 1.05, u * 0.7, false);
    }
    // la gente con nombre (los de CAPITAL): un punto rosa
    if (gente)
      for (const p of gente) {
        if (!p.nombrado || p.visible === false) continue;
        const [px, py] = aqui(p.x, p.y);
        c.fillStyle = "#111111";
        c.beginPath();
        c.arc(px, py, u * 0.28, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#E0B2B2";
        c.beginPath();
        c.arc(px, py, u * 0.2, 0, Math.PI * 2);
        c.fill();
      }
    if (marca) {
      const [px, py] = aqui(marca[0], marca[1]);
      c.save();
      c.translate(px, py);
      c.fillStyle = "#FFD98A";
      c.strokeStyle = "#111111";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(-u * 0.45, -u * 0.9);
      c.lineTo(u * 0.45, -u * 0.9);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    }
    // Eromash: flecha roja hacia donde va
    const [ex, ey] = aqui(ero.x, ero.y),
      d = op.dir || [0, 1];
    c.save();
    c.translate(ex, ey);
    c.rotate(Math.atan2(d[1], d[0]) + Math.PI / 2);
    c.fillStyle = "#C8402D";
    c.strokeStyle = "#F2ECEC";
    c.lineWidth = Math.max(1.5, u * 0.12);
    c.beginPath();
    const fa = todo ? 1.35 : 1;
    c.moveTo(0, -u * 0.75 * fa);
    c.lineTo(u * 0.55 * fa, u * 0.55 * fa);
    c.lineTo(0, u * 0.25 * fa);
    c.lineTo(-u * 0.55 * fa, u * 0.55 * fa);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
  }
  function rotulo(c, txt, x, y, tam, fuerte) {
    c.font = `${fuerte ? 700 : 600} ${Math.round(tam)}px "DM Sans", sans-serif`;
    c.textAlign = "center";
    c.textBaseline = "top";
    c.lineWidth = Math.max(2, tam * 0.28);
    c.strokeStyle = "rgba(17,17,17,0.85)";
    c.strokeText(txt, x, y);
    c.fillStyle = fuerte ? "#FFD98A" : "#F2ECEC";
    c.fillText(txt, x, y);
  }

  // ---------- el minimapa ----------
  const VE_MINI = 7200; // lo que se ve alrededor de Eromash (unas 120 m de la ciudad)
  function mini(cv, MINI_PX, op) {
    preparar(op.plano);
    const k0 = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== MINI_PX * k0) cv.width = cv.height = MINI_PX * k0;
    const c = cv.getContext("2d");
    c.setTransform(k0, 0, 0, k0, 0, 0);
    const L = lado(),
      kb = BASE_M / L,
      x0 = op.ero.x - VE_MINI / 2,
      y0 = op.ero.y - VE_MINI / 2,
      k = MINI_PX / VE_MINI;
    c.fillStyle = "#1E2019";
    c.fillRect(0, 0, MINI_PX, MINI_PX);
    c.drawImage(baseM, (x0 + L / 2) * kb, (y0 + L / 2) * kb, VE_MINI * kb, VE_MINI * kb, 0, 0, MINI_PX, MINI_PX);
    c.save();
    c.scale(1 / k0, 1 / k0);
    encima(c, (x, y) => [(x - x0) * k * k0, (y - y0) * k * k0], 11 * k0, Object.assign({ todo: false }, op));
    c.restore();
  }

  // ---------- el mapa grande ----------
  const vista = { cx: 0, cy: 0, z: 1 };
  let datos = null,
    senalado = null;
  function escala(cv) {
    return (cv.width / lado()) * vista.z;
  }
  function aPix(cv, x, y) {
    const s = escala(cv);
    return [(x - vista.cx) * s + cv.width / 2, (y - vista.cy) * s + cv.height / 2];
  }
  function aMundo(cv, px, py) {
    const s = escala(cv);
    return [(px - cv.width / 2) / s + vista.cx, (py - cv.height / 2) / s + vista.cy];
  }
  function acotar() {
    vista.z = Math.max(1, Math.min(5, vista.z));
    const m = lado() / 2 - lado() / 2 / vista.z;
    vista.cx = Math.max(-m, Math.min(m, vista.cx));
    vista.cy = Math.max(-m, Math.min(m, vista.cy));
  }
  function dibujar() {
    const cv = document.getElementById("mapa25Lienzo");
    if (!cv || !datos) return;
    if (cv.width !== BASE_G) cv.width = cv.height = BASE_G;
    const c = cv.getContext("2d"),
      L = lado(),
      kb = (vista.z > 1.6 ? BASE_M : BASE_G) / L,
      fondo = vista.z > 1.6 ? baseM : baseG,
      w = L / vista.z;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#1E2019";
    c.fillRect(0, 0, cv.width, cv.height);
    c.drawImage(fondo, (vista.cx - w / 2 + L / 2) * kb, (vista.cy - w / 2 + L / 2) * kb, w * kb, w * kb, 0, 0, cv.width, cv.height);
    // las miniaturas y los nombres en puntos de la pantalla (el lienzo se ve más chico que sus píxeles)
    const px = cv.clientWidth ? cv.width / cv.clientWidth : 2.5;
    encima(c, (x, y) => aPix(cv, x, y), px * (13 + (vista.z - 1) * 2), Object.assign({}, datos.vivo(), { todo: true, senalado, z: vista.z }));
  }
  function tocable(cv, px, py) {
    let mejor = null,
      dm = 40;
    for (const k in ICONO) {
      const l = plano.lugares[k];
      if (!l) continue;
      const [x, y] = aPix(cv, l[0], l[1]),
        d = Math.hypot(x - px, y - py);
      if (d < dm) (dm = d), (mejor = k);
    }
    return mejor;
  }
  // op: { A, plano, vivo() → { ero, gente, dir, marca }, ponerMarca(x, y), alBosque() }
  function abrir(op) {
    preparar(op.plano);
    datos = op;
    const v = op.vivo();
    vista.z = vista.z || 1;
    vista.cx = v.ero.x;
    vista.cy = v.ero.y;
    acotar();
    senalado = null;
    const A = op.A;
    A.menu(
      `<h2>${t("ci.mapa_titulo")}</h2>${op.hoy || ""}<div class="mapa-cuerpo"><div class="mapa-marco"><canvas id="mapa25Lienzo" class="mapa"></canvas>` +
        `<div class="mapa-zoom"><button id="mapa25Mas" aria-label="${t("mp.acercar")}">+</button><button id="mapa25Menos" aria-label="${t("mp.alejar")}">−</button></div></div></div>` +
        `<div class="sub mapa-ley" id="mapa25Pie">${t("ci.mapa_ayuda")}</div>`,
      [
        { texto: t("ci.mapa_bosque"), fn: () => (A.cerrarMenu(), op.alBosque && op.alBosque()) },
        { texto: t("mp.quitar_marca"), fn: () => (op.ponerMarca(null), dibujar()) },
        { texto: t("ui.cerrar"), fn: A.cerrarMenu },
      ],
    );
    document.getElementById("capaCaja").classList.add("ancha");
    const cv = document.getElementById("mapa25Lienzo");
    const enLienzo = (e) => {
      const r = cv.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * cv.width, ((e.clientY - r.top) / r.height) * cv.height];
    };
    const zoomEn = (f, px, py) => {
      const [wx, wy] = aMundo(cv, px, py);
      vista.z *= f;
      acotar();
      const [nx, ny] = aMundo(cv, px, py);
      vista.cx += wx - nx;
      vista.cy += wy - ny;
      acotar();
      dibujar();
    };
    document.getElementById("mapa25Mas").onclick = () => zoomEn(1.5, cv.width / 2, cv.height / 2);
    document.getElementById("mapa25Menos").onclick = () => zoomEn(1 / 1.5, cv.width / 2, cv.height / 2);
    cv.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        zoomEn(e.deltaY < 0 ? 1.25 : 0.8, ...enLienzo(e));
      },
      { passive: false },
    );
    // arrastrar mueve, tocar sin moverse marca (y dice qué es lo tocado); con dos dedos se pellizca
    const dedos = new Map();
    let movido = 0,
      pellizco = 0;
    cv.style.touchAction = "none";
    cv.addEventListener("pointerdown", (e) => {
      cv.setPointerCapture(e.pointerId);
      dedos.set(e.pointerId, enLienzo(e));
      movido = 0;
      if (dedos.size === 2) {
        const [p, q] = [...dedos.values()];
        pellizco = Math.hypot(p[0] - q[0], p[1] - q[1]);
      }
    });
    cv.addEventListener("pointermove", (e) => {
      if (!dedos.has(e.pointerId)) {
        const q = tocable(cv, ...enLienzo(e));
        if (q !== senalado) (senalado = q), dibujar();
        return;
      }
      const antes = dedos.get(e.pointerId),
        ahora = enLienzo(e);
      dedos.set(e.pointerId, ahora);
      if (dedos.size === 2) {
        const [p, q] = [...dedos.values()],
          d = Math.hypot(p[0] - q[0], p[1] - q[1]);
        if (pellizco > 0) zoomEn(d / pellizco, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
        pellizco = d;
        movido = 99;
        return;
      }
      movido += Math.abs(ahora[0] - antes[0]) + Math.abs(ahora[1] - antes[1]);
      if (movido > 6) {
        vista.cx -= (ahora[0] - antes[0]) / escala(cv);
        vista.cy -= (ahora[1] - antes[1]) / escala(cv);
        acotar();
        dibujar();
      }
    });
    const soltar = (e) => {
      if (!dedos.has(e.pointerId)) return;
      const p = dedos.get(e.pointerId);
      dedos.delete(e.pointerId);
      if (dedos.size < 2) pellizco = 0;
      if (e.type === "pointerup" && movido <= 6 && dedos.size === 0) {
        senalado = tocable(cv, p[0], p[1]);
        const pie = document.getElementById("mapa25Pie");
        if (pie) pie.textContent = senalado ? t("ci.m_" + senalado) : t("ci.mapa_ayuda");
        op.ponerMarca(aMundo(cv, p[0], p[1]));
        dibujar();
      }
    };
    cv.addEventListener("pointerup", soltar);
    cv.addEventListener("pointercancel", soltar);
    dibujar();
  }
  const abierto = () => !!document.getElementById("mapa25Lienzo");
  return { abrir, abierto, dibujar, mini, ICONO };
})();
