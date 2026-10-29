// ---------- Editor de animación por piezas (esqueleto.html) ----------
// Muestra un esqueleto con sus piezas (por ahora el muñeco de HUMANO) en cualquiera de sus vistas, reproduce cada
// animación y deja editarla: se elige un hueso tocándolo y se arrastra (girar, mover o estirar) y queda una clave en
// el instante de la línea de tiempo. Lo editado se guarda en el navegador y se descarga o se copia en JSON
// ({ formato: "eromash-animaciones", anims }) para pasarlo al juego. Al lado (o debajo, transparente) se puede ver el
// bandido del hacha como se mueve hoy en el juego (BANDIDO, cuadros de su lámina) en la misma animación, vista e instante,
// o la fase de la lámina del maniquí (img/referencias/maniqui-<vista>.png, 16 fases de la caminata) al andar.
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const E = ESQUELETO, H = HUMANO;
  const CLAVE = "eromash-esqueleto";
  const params = new URLSearchParams(location.search);
  if (params.get("lang")) I18N.setLang(params.get("lang"));

  // ---------- estado ----------
  let anims = H.copia(H.ANIMS);
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE));
    if (g && g.anims) for (const id in g.anims) anims[id] = g.anims[id];
  } catch (e) {}
  const st = { vista: "E", anim: "andar", t: 0, jugando: true, vel: 1, hueso: "brazoD", herr: "r", pal: 0, fantasmas: false, verHuesos: true, pj: params.get("pj") || "muneco", calco: params.get("calco") || "lado", ref: params.get("ref") || "bandido" };
  let deshacer = [], copiaPose = null;
  const anim = () => anims[st.anim];
  // la vista del esqueleto: el otro costado es el costado en espejo
  const base = () => (st.vista === "W" ? "E" : st.vista);
  const espejo = () => st.vista === "W";
  // el personaje: el muñeco o el bandido del hacha con las piezas de su lámina de piezas
  const rigBandido = () => (st.pj === "bandido" && window.BANDIDO && BANDIDO.rigDe ? BANDIDO.rigDe(base()) : null);
  const esq = () => rigBandido() || H.MUNECO[base()];

  // ---------- lo que se ve ----------
  const cv = $("sqLienzo"), c = cv.getContext("2d");
  const lt = $("sqTiempo"), ct = lt.getContext("2d");
  const fant = document.createElement("canvas"), cfa = fant.getContext("2d");
  let escala = 3, ox = 0, oy = 0;
  function medir() {
    const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
    cv.width = Math.round(r.width * d);
    cv.height = Math.round(r.height * d);
    const lado = hayCalco() && st.calco === "lado";
    escala = Math.min(cv.width / (lado ? 250 : 120), cv.height / 170);
    ox = cv.width * (lado ? 0.3 : 0.5);
    oy = cv.height - 22 * escala;
    const rt = lt.getBoundingClientRect();
    lt.width = Math.round(rt.width * d);
    lt.height = Math.round(rt.height * d);
  }
  const hayCalco = () => st.calco !== "no" && (st.ref === "maniqui" ? st.anim === "andar" : !!window.BANDIDO);
  const transformar = (g) => g.setTransform(escala * (espejo() ? -1 : 1), 0, 0, escala, ox, oy);
  function poseEn(t) {
    return E.muestra(anim(), base(), t);
  }
  function dibujar() {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#2C3A24";
    c.fillRect(0, 0, cv.width, cv.height);
    // la línea del piso
    c.fillStyle = "#24301D";
    c.fillRect(0, oy, cv.width, cv.height - oy);
    const op = { colores: H.COLORES[st.pal], pal: st.pal };
    if (hayCalco()) calco();
    if (st.fantasmas) {
      // la pose de un poco antes y un poco después, tenues (en otro lienzo para que no se vean las piezas de adentro)
      for (const [dt, a] of [[-0.08, 0.22], [0.08, 0.22]]) {
        fant.width = cv.width;
        fant.height = cv.height;
        transformar(cfa);
        E.dibujar(cfa, esq(), poseEn(anim().bucle ? st.t + dt : Math.min(1, Math.max(0, st.t + dt))), Object.assign({ sombra: false }, op));
        c.globalAlpha = a;
        c.drawImage(fant, 0, 0);
        c.globalAlpha = 1;
      }
    }
    transformar(c);
    const pose = poseEn(st.t);
    const P = E.dibujar(c, esq(), pose, op);
    if (st.verHuesos) huesos(pose, P);
    c.setTransform(1, 0, 0, 1, 0, 0);
    tiempo();
    canales(pose);
  }
  // ---------- el bandido de hoy ----------
  // el bandido del hacha con su dibujo del juego en la misma animación, vista e instante: los cuadros de su lámina al
  // andar y correr (una vuelta por animación), la pose de la lámina en el aviso, el hachazo, herido y morir
  const borrador = document.createElement("canvas").getContext("2d");
  let reintento = 0;
  // la lámina del maniquí: 16 celdas de 374 × 424 en una grilla de 4 × 4, con el piso en y = 373 y el centro en x = 187;
  // el muslo mide 89,5 pixeles y el del muñeco 28
  const MANIQUI = {}, PX = H.medidas.MUSLO / 89.5;
  function maniqui() {
    const v = base(), img = MANIQUI[v] || (MANIQUI[v] = Object.assign(new Image(), { src: "img/referencias/maniqui-" + v + ".png" }));
    if (!img.complete || !img.naturalWidth) {
      img.onload = () => dibujar();
      return;
    }
    const i = Math.floor(((st.t % 1) + 1e-6) * 16) % 16, cx = (i % 4) * 374, cy = Math.floor(i / 4) * 424;
    const debajo = st.calco === "debajo";
    c.save();
    c.setTransform(escala * (espejo() ? -1 : 1), 0, 0, escala, debajo ? ox : cv.width * 0.72, oy);
    c.globalAlpha = debajo ? 0.5 : 1;
    if (debajo) c.globalCompositeOperation = "multiply";
    c.drawImage(img, cx, cy, 374, 424, -187 * PX, -373 * PX, 374 * PX, 424 * PX);
    c.restore();
  }
  function calco() {
    if (st.ref === "maniqui") return maniqui();
    const u = st.t, dur = anim().dur, o = { vista: base(), pal: st.pal, sem: 0 };
    let t = u * dur;
    BANDIDO.reiniciar(0);
    if (st.anim === "andar" || st.anim === "correr") {
      o.mov = st.anim === "andar" ? 1 : 2;
      t = (u * Math.PI * 2) / (5.2 + o.mov * 2.4);
    } else if (st.anim === "aviso") o.golpe = Math.max(0.001, u);
    else if (st.anim === "golpe") {
      // el hacha estaba arriba y recién se soltó
      BANDIDO.dibujar(borrador, 0, Object.assign({}, o, { golpe: 1 }));
      t = 0.0001 + u * dur;
      o.golpe = 0;
    } else if (st.anim === "herido") o.herido = 1 - u;
    else if (st.anim === "morir") o.muere = u * 0.8;
    const debajo = st.calco === "debajo";
    c.save();
    c.setTransform(escala * (espejo() ? -1 : 1), 0, 0, escala, debajo ? ox : cv.width * 0.72, oy);
    if (debajo) c.globalAlpha = 0.45;
    const hecho = BANDIDO.dibujar(c, t, o);
    c.restore();
    // mientras cargan los cuadros de su lámina, se vuelve a dibujar en un rato
    if (!hecho && !st.jugando) {
      clearTimeout(reintento);
      reintento = setTimeout(dibujar, 250);
    }
  }
  // los huesos encima: una línea de donde nace a su punta y un punto en la articulación; el elegido en dorado
  function huesos(pose) {
    const { M, P } = E.armar(esq(), pose);
    for (const h of esq().huesos) {
      const m = M[h.id], q = P[h.id], pt = h.punta || [0, 0];
      const a = [m[4], m[5]], b = [q[0] * pt[0] + q[2] * pt[1] + q[4], q[1] * pt[0] + q[3] * pt[1] + q[5]];
      const elegido = h.id === st.hueso;
      c.strokeStyle = elegido ? "#FFD98A" : "rgba(242,236,236,0.55)";
      c.lineWidth = (elegido ? 2.2 : 1.2) / escala;
      c.beginPath();
      c.moveTo(a[0], a[1]);
      c.lineTo(b[0], b[1]);
      c.stroke();
      c.fillStyle = elegido ? "#FFD98A" : "#F2ECEC";
      c.beginPath();
      c.arc(a[0], a[1], (elegido ? 3.2 : 2.2) / escala, 0, Math.PI * 2);
      c.fill();
    }
  }

  // ---------- la línea de tiempo: las claves de todos tenues, las del hueso elegido como rombos, y dónde se está ----------
  const MARGEN = 14;
  const xDe = (t) => MARGEN + t * (lt.width - MARGEN * 2);
  const tDe = (x) => Math.min(1, Math.max(0, (x - MARGEN) / (lt.width - MARGEN * 2)));
  function tiempo() {
    const w = lt.width, h = lt.height;
    ct.setTransform(1, 0, 0, 1, 0, 0);
    ct.fillStyle = "#1C1714";
    ct.fillRect(0, 0, w, h);
    // las marcas de los cuadros (24 por animación)
    ct.fillStyle = "rgba(242,236,236,0.12)";
    for (let i = 0; i <= 24; i++) ct.fillRect(Math.round(xDe(i / 24)), h * 0.72, 1, h * 0.28);
    ct.fillStyle = "rgba(224,178,178,0.45)";
    for (const t of E.instantes(anim(), base())) ct.fillRect(Math.round(xDe(t)) - 1, h * 0.62, 2, h * 0.38);
    ct.fillStyle = "#FFD98A";
    const r = h * 0.18;
    for (const t of E.instantes(anim(), base(), st.hueso)) {
      const x = xDe(t), y = h * 0.34;
      ct.beginPath();
      ct.moveTo(x, y - r);
      ct.lineTo(x + r, y);
      ct.lineTo(x, y + r);
      ct.lineTo(x - r, y);
      ct.closePath();
      ct.fill();
    }
    ct.fillStyle = "#C8402D";
    ct.fillRect(Math.round(xDe(st.t)) - 1, 0, 3, h);
    $("sqInstante").textContent = (st.t * anim().dur).toFixed(2) + " s · " + Math.round(st.t * 100) + " %";
  }

  // ---------- los valores del hueso elegido ----------
  const CAMPOS = ["r", "x", "y", "sx", "sy"];
  let escribiendo = false;
  function canales(pose) {
    if (escribiendo) return;
    const p = pose[st.hueso] || E.BASE;
    for (const k of CAMPOS) {
      const el = $("sqC_" + k);
      if (document.activeElement !== el) el.value = (k === "r" ? p[k].toFixed(1) : k[0] === "s" ? p[k].toFixed(3) : p[k].toFixed(1));
    }
  }
  function ponerValor(k, v) {
    E.ponerClave(anim(), base(), st.hueso, k, redondo(st.t), v);
    guardar();
  }
  // las claves caen en los cuadros (1/96 de la vuelta) para que sea fácil volver a ellas
  const redondo = (t) => Math.round(t * 96) / 96;

  // ---------- elegir y arrastrar huesos ----------
  function aMundo(ev) {
    const r = cv.getBoundingClientRect(), d = cv.width / r.width;
    const x = ((ev.clientX - r.left) * d - ox) / escala, y = ((ev.clientY - r.top) * d - oy) / escala;
    return [espejo() ? -x : x, y];
  }
  function cercano(p) {
    const { M, P } = E.armar(esq(), poseEn(st.t));
    let mejor = null, dmin = 9 / Math.max(0.5, escala / 3);
    for (const h of esq().huesos) {
      const m = M[h.id], q = P[h.id], pt = h.punta || [0, 0];
      const a = [m[4], m[5]], b = [q[0] * pt[0] + q[2] * pt[1] + q[4], q[1] * pt[0] + q[3] * pt[1] + q[5]];
      const vx = b[0] - a[0], vy = b[1] - a[1], l = vx * vx + vy * vy;
      const u = l ? Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / l)) : 0;
      // las articulaciones pesan un poco más que el medio del hueso
      const dd = Math.hypot(p[0] - a[0] - u * vx, p[1] - a[1] - u * vy) + (u > 0.02 ? 1.5 : 0);
      if (dd < dmin) { dmin = dd; mejor = h.id; }
    }
    return mejor;
  }
  let arrastre = null;
  cv.addEventListener("pointerdown", (ev) => {
    const p = aMundo(ev), id = cercano(p);
    if (id) elegir(id);
    if (!st.hueso) return;
    cv.setPointerCapture(ev.pointerId);
    pausar();
    const pose = poseEn(st.t), { M } = E.armar(esq(), pose), m = M[st.hueso];
    const padre = (esq().huesos.find((h) => h.id === st.hueso) || {}).padre;
    arrastre = { p0: p, o: [m[4], m[5]], v0: Object.assign({}, pose[st.hueso] || E.BASE), mp: padre ? M[padre] : [1, 0, 0, 1, 0, 0] };
    recordar();
  });
  cv.addEventListener("pointermove", (ev) => {
    if (!arrastre) return;
    const p = aMundo(ev), a = arrastre, v = a.v0;
    if (st.herr === "r") {
      const g0 = Math.atan2(a.p0[1] - a.o[1], a.p0[0] - a.o[0]), g1 = Math.atan2(p[1] - a.o[1], p[0] - a.o[0]);
      let d = ((g1 - g0) * 180) / Math.PI;
      d = ((d + 540) % 360) - 180;
      ponerValor("r", Math.round((v.r + d) * 10) / 10);
    } else if (st.herr === "xy") {
      // lo corrido en el mundo pasado a las coordenadas del padre
      const dx = p[0] - a.p0[0], dy = p[1] - a.p0[1], m = a.mp, det = m[0] * m[3] - m[1] * m[2] || 1;
      const lx = (m[3] * dx - m[2] * dy) / det, ly = (-m[1] * dx + m[0] * dy) / det;
      ponerValor("x", Math.round((v.x + lx) * 10) / 10);
      ponerValor("y", Math.round((v.y + ly) * 10) / 10);
    } else {
      const d0 = Math.hypot(a.p0[0] - a.o[0], a.p0[1] - a.o[1]) || 1, d1 = Math.hypot(p[0] - a.o[0], p[1] - a.o[1]);
      ponerValor("sy", Math.round(Math.max(-2, Math.min(2, (v.sy * d1) / d0)) * 1000) / 1000);
    }
    dibujar();
  });
  const soltar = () => (arrastre = null);
  cv.addEventListener("pointerup", soltar);
  cv.addEventListener("pointercancel", soltar);

  // ---------- la línea de tiempo con el puntero ----------
  let enTiempo = false;
  function irTiempo(ev) {
    const r = lt.getBoundingClientRect(), x = (ev.clientX - r.left) * (lt.width / r.width);
    let t = tDe(x);
    // cerca de una clave del hueso elegido, va justo a ella
    for (const k of E.instantes(anim(), base(), st.hueso)) if (Math.abs(xDe(k) - x) < 10 * (lt.width / r.width)) t = k;
    st.t = t;
    dibujar();
  }
  lt.addEventListener("pointerdown", (ev) => {
    pausar();
    enTiempo = true;
    lt.setPointerCapture(ev.pointerId);
    irTiempo(ev);
  });
  lt.addEventListener("pointermove", (ev) => enTiempo && irTiempo(ev));
  lt.addEventListener("pointerup", () => (enTiempo = false));

  // ---------- botones ----------
  function grupo(id, items, clave, texto, alElegir) {
    const el = $(id);
    el.innerHTML = "";
    for (const it of items) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = texto(it);
      b.setAttribute("aria-pressed", String(st[clave] === it));
      b.addEventListener("click", () => {
        st[clave] = it;
        if (alElegir) alElegir(it);
        armarBotones();
        dibujar();
      });
      el.appendChild(b);
    }
  }
  function elegir(id) {
    st.hueso = id;
    armarBotones();
  }
  function armarBotones() {
    grupo("sqVistas", ["S", "E", "W", "N"], "vista", (v) => I18N.t("sq.v_" + v));
    grupo("sqHerr", ["r", "xy", "sy"], "herr", (h) => I18N.t({ r: "sq.h_girar", xy: "sq.h_mover", sy: "sq.h_estirar" }[h]));
    grupo("sqHuesos", esq().huesos.map((h) => h.id), "hueso", (h) => I18N.t("sq.h_" + h));
    const sel = $("sqAnim");
    if (!sel.options.length) for (const id of H.ORDEN) sel.add(new Option(I18N.t("sq.a_" + id), id));
    sel.value = st.anim;
    const pal = $("sqPal");
    if (!pal.options.length) H.COLORES.forEach((_, i) => pal.add(new Option(I18N.t("sq.pal_" + i), i)));
    pal.value = st.pal;
    const cal = $("sqCalco");
    if (!cal.options.length) ["lado", "debajo", "no"].forEach((k) => cal.add(new Option(I18N.t("sq.calco_" + k), k)));
    cal.value = st.calco;
    const pj = $("sqPj");
    if (!pj.options.length) ["muneco", "bandido"].forEach((k) => pj.add(new Option(I18N.t("sq.pj_" + k), k)));
    pj.value = st.pj;
    pj.parentNode.hidden = !(window.BANDIDO && BANDIDO.rigDe);
    const ref = $("sqRef");
    if (!ref.options.length) ["bandido", "maniqui"].forEach((k) => ref.add(new Option(I18N.t("sq.ref_" + k), k)));
    ref.value = st.ref;
    $("sqDur").value = anim().dur;
    $("sqBucle").checked = !!anim().bucle;
    $("sqJugar").textContent = I18N.t(st.jugando ? "sq.pausa" : "sq.jugar");
  }
  function pausar() {
    st.jugando = false;
    $("sqJugar").textContent = I18N.t("sq.jugar");
  }
  $("sqAnim").addEventListener("change", (e) => {
    st.anim = e.target.value;
    st.t = 0;
    medir();
    deshacer = [];
    armarBotones();
    dibujar();
  });
  $("sqPal").addEventListener("change", (e) => {
    st.pal = +e.target.value;
    dibujar();
  });
  $("sqPj").addEventListener("change", (e) => {
    st.pj = e.target.value;
    if (st.pj === "bandido" && st.ref === "bandido") st.calco = "no";
    if (!esq().huesos.some((h) => h.id === st.hueso)) st.hueso = "brazoD";
    medir();
    armarBotones();
    dibujar();
  });
  $("sqRef").addEventListener("change", (e) => {
    st.ref = e.target.value;
    medir();
    dibujar();
  });
  $("sqCalco").addEventListener("change", (e) => {
    st.calco = e.target.value;
    medir();
    dibujar();
  });
  $("sqVel").addEventListener("change", (e) => (st.vel = +e.target.value));
  $("sqDur").addEventListener("change", (e) => {
    const v = +e.target.value;
    if (v > 0.05) { recordar(); anim().dur = v; guardar(); }
  });
  $("sqBucle").addEventListener("change", (e) => {
    recordar();
    anim().bucle = e.target.checked;
    guardar();
    dibujar();
  });
  $("sqFantasmas").addEventListener("change", (e) => { st.fantasmas = e.target.checked; dibujar(); });
  $("sqVerHuesos").addEventListener("change", (e) => { st.verHuesos = e.target.checked; dibujar(); });
  $("sqJugar").addEventListener("click", () => {
    st.jugando = !st.jugando;
    armarBotones();
  });
  const paso = (d) => {
    pausar();
    st.t = anim().bucle ? (((Math.round(st.t * 24) + d) % 24) + 24) % 24 / 24 : Math.min(1, Math.max(0, (Math.round(st.t * 24) + d) / 24));
    dibujar();
  };
  $("sqAtras").addEventListener("click", () => paso(-1));
  $("sqAdelante").addEventListener("click", () => paso(1));
  for (const k of CAMPOS) {
    const el = $("sqC_" + k);
    el.addEventListener("change", () => {
      const v = parseFloat(el.value.replace(",", "."));
      if (!isFinite(v)) return;
      recordar();
      ponerValor(k, v);
      dibujar();
    });
  }
  $("sqClave").addEventListener("click", () => {
    recordar();
    const p = poseEn(st.t)[st.hueso] || E.BASE;
    for (const k of CAMPOS) E.ponerClave(anim(), base(), st.hueso, k, redondo(st.t), p[k]);
    guardar();
    dibujar();
  });
  $("sqBorrar").addEventListener("click", () => {
    recordar();
    E.sacarClave(anim(), base(), st.hueso, st.t, 1 / 96);
    guardar();
    dibujar();
  });
  $("sqCopiarPose").addEventListener("click", () => (copiaPose = JSON.parse(JSON.stringify(poseEn(st.t)))));
  $("sqPegarPose").addEventListener("click", () => {
    if (!copiaPose) return;
    recordar();
    for (const h in copiaPose) for (const k of CAMPOS) E.ponerClave(anim(), base(), h, k, redondo(st.t), copiaPose[h][k]);
    guardar();
    dibujar();
  });
  $("sqDeshacer").addEventListener("click", volverAtras);
  document.addEventListener("keydown", (ev) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "z") { ev.preventDefault(); volverAtras(); }
  });
  $("sqFabrica").addEventListener("click", () => {
    recordar();
    anims[st.anim] = H.copia(H.ANIMS[st.anim]);
    guardar();
    armarBotones();
    dibujar();
  });
  const texto = () => JSON.stringify({ formato: "eromash-animaciones", version: 1, anims }, null, 1);
  $("sqExportar").addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([texto()], { type: "application/json" }));
    a.download = "animaciones-humano.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  $("sqCopiar").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(texto());
      aviso("sq.copiado");
    } catch (e) {}
  });
  $("sqImportar").addEventListener("change", async (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      if (!j.anims) throw new Error();
      for (const id in j.anims) anims[id] = j.anims[id];
      guardar();
      armarBotones();
      dibujar();
      aviso("sq.abierto");
    } catch (e) {
      aviso("sq.mal");
    }
    ev.target.value = "";
  });

  function recordar() {
    deshacer.push(JSON.stringify(anim()));
    if (deshacer.length > 60) deshacer.shift();
  }
  function volverAtras() {
    const s = deshacer.pop();
    if (!s) return;
    anims[st.anim] = JSON.parse(s);
    guardar();
    armarBotones();
    dibujar();
  }
  // lo editado (solo lo que cambió de fábrica) queda en el navegador
  function guardar() {
    try {
      const cambiadas = {};
      for (const id in anims) if (JSON.stringify(anims[id]) !== JSON.stringify(H.ANIMS[id])) cambiadas[id] = anims[id];
      localStorage.setItem(CLAVE, JSON.stringify({ anims: cambiadas }));
    } catch (e) {}
  }
  let tAviso = 0;
  function aviso(clave) {
    const el = $("sqAviso");
    el.textContent = I18N.t(clave);
    el.hidden = false;
    clearTimeout(tAviso);
    tAviso = setTimeout(() => (el.hidden = true), 2400);
  }

  // ---------- el reloj ----------
  let antes = performance.now(), quieto = 0;
  let conBandido = false;
  function cuadro(ahora) {
    // las piezas del bandido llegan cuando carga su lámina: entonces se rehacen los botones de los huesos
    if (!conBandido && rigBandido()) { conBandido = true; armarBotones(); }
    const dt = Math.min(0.05, (ahora - antes) / 1000);
    antes = ahora;
    if (st.jugando) {
      const a = anim();
      if (a.bucle) st.t = (st.t + (dt * st.vel) / a.dur) % 1;
      else if (st.t < 1) st.t = Math.min(1, st.t + (dt * st.vel) / a.dur);
      else if ((quieto += dt) > 0.6) { st.t = 0; quieto = 0; }
      dibujar();
    }
    requestAnimationFrame(cuadro);
  }
  window.addEventListener("resize", () => { medir(); dibujar(); });
  I18N.on(() => { $("sqAnim").innerHTML = ""; $("sqPal").innerHTML = ""; $("sqCalco").innerHTML = ""; $("sqRef").innerHTML = ""; $("sqPj").innerHTML = ""; armarBotones(); dibujar(); });
  I18N.apply(document);
  if (window.BANDIDO) BANDIDO.precargar();
  medir();
  armarBotones();
  dibujar();
  requestAnimationFrame(cuadro);
  window.EDITOR_ESQUELETO = { st, anims, dibujar, elegir };
})();
