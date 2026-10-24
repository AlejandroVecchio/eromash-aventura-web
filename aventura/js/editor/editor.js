// ---------- el editor de Eldervald ----------
// Una página para que Alejandro ayude a armar el mapa sin Tiled: se ve el mundo como en el juego (el croquis de
// lejos, el piso y los objetos de cerca), se eligen objetos de la lista de assets y se ponen, se mueven o se sacan.
// Lo hecho queda guardado en este navegador y se descarga como js/mundo/agregados.js, que el mundo aplica al armarse
// (eldervald.js). ?borrador=1 en el juego usa lo de este navegador sin descargar nada.
(function () {
  "use strict";
  const W = ELDERVALD;
  const t = (k, v) => I18N.t(k, v);
  const params = new URLSearchParams(location.search);
  if (params.get("lang")) I18N.setLang(params.get("lang"));
  const $ = (id) => document.getElementById(id);
  document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
  $("buscar").placeholder = t("ed.buscar");
  const CLAVE = "eromash-aventura-editor";

  // ---------- estado ----------
  let est = { poner: [], quitar: [], mover: [], quitarDeco: [], caminos: [], quitarCaminos: [], estiloCaminos: [], rios: [], lagos: [], quitarRios: [], quitarLagos: [], notas: [] };
  try {
    const b = JSON.parse(localStorage.getItem(CLAVE) || "null");
    if (b && b.poner) est = b;
    else if (window.AGREGADOS) est = JSON.parse(JSON.stringify(window.AGREGADOS));
  } catch (e) {
    if (window.AGREGADOS) est = JSON.parse(JSON.stringify(window.AGREGADOS));
  }
  if (!est.notas) est.notas = [];
  if (!est.caminos) est.caminos = [];
  if (!est.quitarCaminos) est.quitarCaminos = [];
  if (!est.estiloCaminos) est.estiloCaminos = [];
  if (!est.mover) est.mover = [];
  if (!est.quitarDeco) est.quitarDeco = [];
  const completar = (e) => ["rios", "lagos", "quitarRios", "quitarLagos"].forEach((k) => !e[k] && (e[k] = []));
  completar(est);
  const historial = [];
  const recordar = () => {
    historial.push(JSON.stringify(est));
    if (historial.length > 80) historial.shift();
  };
  const guardar = () => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(est));
    } catch (e) {}
    if (!est.notas) est.notas = [];
    if (!est.caminos) est.caminos = [];
    if (!est.quitarCaminos) est.quitarCaminos = [];
    if (!est.estiloCaminos) est.estiloCaminos = [];
    if (!est.mover) est.mover = [];
    if (!est.quitarDeco) est.quitarDeco = [];
    completar(est);
    armarMovidos();
    aplicarDeco();
    aplicarCaminos();
    aplicarAgua();
    $("cuenta").textContent = t("ed.cuenta", [est.poner.length, est.quitar.length]) + " · " + t("ed.cuenta_mas", [est.mover.length, est.caminos.length, est.notas.length]) + " · " + t("ed.cuenta_agua", [est.rios.length + est.lagos.length]);
    armarIr();
  };
  const r1 = (v) => Math.round(v);

  // ---------- el lienzo y la cámara ----------
  const cv = $("mapa"),
    c = cv.getContext("2d");
  let cw = 0,
    ch = 0,
    dpr = 1;
  const cam = { x: W.CIUDAD.c[0], y: W.CIUDAD.c[1], z: 0.12 };
  function medir() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = cv.getBoundingClientRect();
    cw = cv.width = Math.round(r.width * dpr);
    ch = cv.height = Math.round(r.height * dpr);
  }
  addEventListener("resize", medir);
  medir();
  const aMundo = (sx, sy) => [(sx * dpr - cw / 2) / cam.z + cam.x, (sy * dpr - ch / 2) / cam.z + cam.y];
  const croquis = new Image();
  croquis.src = "mapas/eldervald-croquis.png";

  // ---------- lo que se ve: el mundo con lo agregado y sin lo sacado ----------
  const sacado = (o) => est.quitar.some((q) => q.id === o.id && Math.abs(o.x - q.x) < 6 && Math.abs(o.y - q.y) < 6);
  // lo de la historia: tiene que estar (no se saca), pero se puede mover
  const nombradas = new Map(); // cosa → nombre en el juego
  Object.keys(W.NOMBRADAS).forEach((k) => {
    const v = W.NOMBRADAS[k];
    (Array.isArray(v) ? v : [v]).forEach((x) => x && x.id && !nombradas.has(x) && nombradas.set(x, k.replace(/\d+$/, "")));
  });
  // lo pintado en el piso (charcos de barro, musgo, helechos, hongos): se saca con Sacar (est.quitarDeco)
  const DECO0 = W.DECO.slice(),
    DECO_SACABLE = { barro: 1, alfombraMusgo: 1, helechos: 1, hongosRocio: 1 };
  let decoSacada = new Set();
  const claveDeco = (d) => d.id + "@" + Math.round(d.x) + "," + Math.round(d.y);
  function aplicarDeco() {
    const nueva = new Set(est.quitarDeco.map(claveDeco));
    // lo que quedó bajo el agua nueva tampoco se pinta (en el juego se saca)
    if (est.rios.length || est.lagos.length) DECO0.forEach((d) => enAguaNueva(d.x, d.y) && nueva.add(claveDeco(d)));
    const cambian = DECO0.filter((d) => nueva.has(claveDeco(d)) !== decoSacada.has(claveDeco(d)));
    decoSacada = nueva;
    if (!cambian.length) return;
    W.DECO.length = 0;
    DECO0.forEach((d) => !decoSacada.has(claveDeco(d)) && W.DECO.push(d));
    cambian.forEach((d) => W.invalidar(d.x, d.y));
  }
  // con Sacar: lo del piso gana si el puntero está sobre el charco y no al pie de un objeto (un tronco que lo tapa)
  function tocadoSacar(x, y) {
    const d = tocado(x, y),
      dd = cam.z >= 0.15 ? decoEn(x, y) : null;
    if (!dd) return d;
    if (d) {
      const ancho = d.choque ? (d.choque.w ? d.choque.w / 2 : d.choque.r) + 20 : 30;
      if (Math.abs(x - d.x) < ancho && Math.abs(y - d.y) < 40) return d;
    }
    return { deco: dd };
  }
  function decoEn(x, y) {
    let mejor = null,
      dm = 1;
    W.DECO.forEach((d) => {
      if (!DECO_SACABLE[d.id]) return;
      const rx = d.id === "barro" || d.id === "alfombraMusgo" ? 66 * (d.s || 1) : 36,
        ry = rx * 0.5;
      if (Math.abs(x - d.x) > rx || Math.abs(y - d.y) > ry) return;
      const q = Math.hypot((x - d.x) / rx, (y - d.y) / ry);
      if (q < dm) {
        dm = q;
        mejor = d;
      }
    });
    return mejor;
  }
  // lo del mundo que se movió (est.mover: { id, x, y } donde estaba → { nx, ny }), para dibujarlo en su lugar nuevo
  let movidos = new Map(); // cosa → índice en est.mover
  function armarMovidos() {
    movidos = new Map();
    est.mover.forEach((m, i) => {
      const cosa = W.COSAS.find((o) => o.id === m.id && Math.abs(o.x - m.x) < 6 && Math.abs(o.y - m.y) < 6);
      if (cosa) movidos.set(cosa, i);
    });
  }
  function opcionesDe(a) {
    const o = Object.assign({}, a.o || {});
    const k = W.ESCALA_CASA[a.id];
    if (k) o.s = (o.s || 1) * k;
    return o;
  }
  function visibles(x0, y0, x1, y1) {
    const l = [];
    W.cercanas(x0 - 300, y0 - 100, x1 + 300, y1 + 600, (o) => {
      if (movidos.has(o) || o.x < x0 - 320 || o.x > x1 + 320 || o.y < y0 - 40 || o.y - o.alto * 1.2 > y1 || sacado(o) || ahogado(o)) return;
      l.push({ id: o.id, x: o.x, y: o.y, o: o.o, alto: o.alto, choque: o.choque, cosa: o, piso: !!o.o.piso });
    });
    movidos.forEach((i, o) => {
      const m = est.mover[i];
      if (!m || m.nx < x0 - 400 || m.nx > x1 + 400 || m.ny < y0 - 60 || m.ny > y1 + 900) return;
      const op = Object.assign({}, o.o, m.o || {});
      if (op.x2 !== undefined && !(m.o && m.o.x2 !== undefined)) (op.x2 += m.nx - o.x), (op.y2 += m.ny - o.y);
      const md = m.o ? ASSETS.medidas(o.id, op) : o;
      l.push({ id: o.id, x: m.nx, y: m.ny, o: op, alto: md.alto, choque: md.choque, cosa: o, movido: i, piso: !!o.o.piso });
    });
    est.poner.forEach((a, i) => {
      const def = ASSETS.LISTA[a.id];
      if (!def || a.x < x0 - 400 || a.x > x1 + 400 || a.y < y0 - 60 || a.y > y1 + 900) return;
      const o = opcionesDe(a),
        md = ASSETS.medidas(a.id, o);
      l.push({ id: a.id, x: a.x, y: a.y, o, alto: md.alto, choque: md.choque, agregado: i, piso: !!def.piso });
    });
    return l;
  }
  // ---------- de lejos, liviano ----------
  // Orden de importancia: 0 lo de la historia, lo agregado o movido y las estructuras; 1 lo demás que choca; 2 los
  // árboles; 3 lo chico de adorno. Según el zoom:
  //   cerca (≥ 0.7): todo como es
  //   medio (0.5–0.7): sin lo chico (3)
  //   de 0.5 para abajo: el mundo de base queda horneado en baldosas (piso + objetos, tres niveles de detalle) y
  //   encima solo se dibuja en vivo lo cambiado en el editor
  const LIVIANO = 0.7,
    HORNO = 0.5;
  const chico = (d) => !d.choque && d.alto < 90 && d.agregado == null && d.movido == null && !(d.cosa && nombradas.has(d.cosa));
  // baldosas horneadas: dos niveles (lejos y muy lejos). La firma de cada una son los cambios del editor que caen
  // adentro; si cambia, se vuelve a hornear.
  const NIVELES = [
    { T: 1024, res: 0.55, m: new Map() },
    { T: 2048, res: 0.26, m: new Map() },
    { T: 4096, res: 0.12, m: new Map() },
    { T: 8192, res: 0.05, m: new Map() },
  ];
  function firma(x0, y0, x1, y1) {
    const den = (x, y) => x > x0 - 500 && x < x1 + 500 && y > y0 - 300 && y < y1 + 1200;
    return firmaCaminos(x0, y0, x1, y1) + "|" + firmaAgua(x0, y0, x1, y1) + "|" + est.quitar.concat(est.quitarDeco).filter((q) => den(q.x, q.y)).map((q) => q.id + q.x + "," + q.y).join(";") + "|" + est.mover.filter((m) => den(m.x, m.y)).map((m) => m.id + m.x + "," + m.y).join(";");
  }
  function hornear(nv, tx, ty) {
    const x0 = tx * nv.T,
      y0 = ty * nv.T,
      x1 = x0 + nv.T,
      y1 = y0 + nv.T;
    const cvb = document.createElement("canvas");
    cvb.width = cvb.height = Math.ceil(nv.T * nv.res);
    const g = cvb.getContext("2d");
    g.scale(nv.res, nv.res);
    g.translate(-x0, -y0);
    W.dibujarPiso(g, x0, y0, x1, y1, 0.2, true);
    const l = [];
    W.cercanas(x0 - 400, y0 - 200, x1 + 400, y1 + 1200, (o) => {
      if (movidos.has(o) || sacado(o) || ahogado(o) || o.y < y0 - 60 || o.y - o.alto * 1.2 > y1 || o.x < x0 - 500 || o.x > x1 + 500) return;
      if (nv.res < 0.08 && !o.choque && o.alto < 90) return; // muy lejos lo chico ni se ve
      l.push(o);
    });
    l.filter((o) => o.o.piso).forEach((o) => ASSETS.dibujar(g, o.id, o.x, o.y, 0, o.o));
    l.filter((o) => !o.o.piso).sort((a, b) => a.y - b.y).forEach((o) => ASSETS.dibujar(g, o.id, o.x, o.y, 0, o.o));
    return { cv: cvb, firma: firma(x0, y0, x1, y1) };
  }
  // dibuja las baldosas del nivel que tocan la vista; hornea a lo sumo una que falte o haya cambiado por cuadro.
  // Devuelve si quedó alguna sin hornear.
  function baldosas(nv, x0, y0, x1, y1) {
    let horneada = false,
      falta = false;
    const tx0 = Math.max(0, Math.floor(x0 / nv.T)),
      tx1 = Math.min(Math.ceil(W.ANCHO / nv.T) - 1, Math.floor(x1 / nv.T)),
      ty0 = Math.max(0, Math.floor(y0 / nv.T)),
      ty1 = Math.min(Math.ceil(W.ALTO / nv.T) - 1, Math.floor(y1 / nv.T));
    for (let ty = ty0; ty <= ty1; ty++)
      for (let tx = tx0; tx <= tx1; tx++) {
        const k = tx + "," + ty;
        let b = nv.m.get(k);
        const vieja = b && b.firma !== firma(tx * nv.T, ty * nv.T, (tx + 1) * nv.T, (ty + 1) * nv.T);
        if ((!b || vieja) && !horneada) {
          b = hornear(nv, tx, ty);
          nv.m.delete(k);
          nv.m.set(k, b);
          if (nv.m.size > 64) nv.m.delete(nv.m.keys().next().value); // las que hace más que no se ven
          horneada = true;
        } else if (!b || vieja) falta = true;
        if (b) c.drawImage(b.cv, tx * nv.T, ty * nv.T, nv.T + 1, nv.T + 1);
        else if (croquis.complete && croquis.naturalWidth) {
          const sx = croquis.naturalWidth / W.ANCHO;
          c.drawImage(croquis, tx * nv.T * sx, ty * nv.T * sx, nv.T * sx, nv.T * sx, tx * nv.T, ty * nv.T, nv.T, nv.T);
        }
      }
    return falta;
  }
  // solo se redibuja cuando algo cambia (o cada tanto, por lo que se anima)
  let sucio = true,
    ultimo = 0,
    faltan = false;
  const pedir = () => (sucio = true);
  ["pointermove", "pointerdown", "pointerup", "wheel", "keydown", "keyup", "input", "change", "click", "resize"].forEach((ev) => addEventListener(ev, pedir, { capture: true, passive: true }));

  let tPrev = performance.now(),
    tt = 0;
  function dibujar() {
    const ahoraT = performance.now(),
      moviendo = Object.keys(teclas).some((k) => teclas[k]);
    if (!sucio && !faltan && !moviendo && ahoraT - ultimo < (cam.z >= LIVIANO ? 120 : 1000)) return requestAnimationFrame(dibujar);
    sucio = false;
    ultimo = ahoraT;
    const ahora = performance.now();
    tt += Math.min(0.1, (ahora - tPrev) / 1000);
    tPrev = ahora;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#1E2C1B";
    c.fillRect(0, 0, cw, ch);
    const vw = cw / cam.z,
      vh = ch / cam.z,
      x0 = cam.x - vw / 2,
      y0 = cam.y - vh / 2,
      x1 = x0 + vw,
      y1 = y0 + vh;
    c.setTransform(cam.z, 0, 0, cam.z, -x0 * cam.z, -y0 * cam.z);
    const lejos = cam.z < 0.07,
      horno = cam.z < HORNO;
    if (horno) faltan = baldosas(NIVELES[lejos ? 3 : cam.z < 0.16 ? 2 : cam.z < 0.3 ? 1 : 0], x0, y0, x1, y1);
    else {
      faltan = false;
      // el piso cacheado a dos resoluciones fijas, para no repintarlo en cada zoom
      W.dibujarPiso(c, x0, y0, x1, y1, cam.z < 0.5 ? 0.2 : 0.5);
    }
    // los caminos ya van en el piso (W.CAMINOS, ver aplicarCaminos); acá solo el que se está trazando
    if (camino && cursor) SENDAS.pintar(c, Object.assign({}, camino, { p: camino.p.concat([[cursor.x, cursor.y]]) }), 999, x0, y0, x1, y1);
    if (caminoElegido()) {
      const cm0 = caminoElegido(),
        cm = sel && sel.vertice != null ? Object.assign({}, cm0, { p: sel.p }) : cm0;
      if (sel && sel.vertice != null) SENDAS.pintar(c, cm, cm.sem || 0, x0, y0, x1, y1);
      // sus puntos, para moverlos (y entre punto y punto, dónde se le agrega uno)
      cm.p.forEach(([x, y], k) => {
        c.fillStyle = "#111111";
        c.beginPath();
        c.arc(x, y, 9 / cam.z, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#FFD98A";
        c.beginPath();
        c.arc(x, y, 6 / cam.z, 0, Math.PI * 2);
        c.fill();
        if (!k) return;
        const mx = (x + cm.p[k - 1][0]) / 2,
          my = (y + cm.p[k - 1][1]) / 2,
          r = 5 / cam.z;
        c.strokeStyle = "#FFD98A";
        c.lineWidth = 2 / cam.z;
        c.beginPath();
        c.moveTo(mx - r, my);
        c.lineTo(mx + r, my);
        c.moveTo(mx, my - r);
        c.lineTo(mx, my + r);
        c.stroke();
      });
      c.save();
      c.strokeStyle = "#FFD98A";
      c.lineWidth = 3 / cam.z;
      c.setLineDash([12 / cam.z, 8 / cam.z]);
      c.beginPath();
      cm.p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.stroke();
      c.restore();
    }
    dibujarAgua();
    if (camino) {
      c.fillStyle = "#FFD98A";
      camino.p.forEach(([x, y]) => {
        c.beginPath();
        c.arc(x, y, 6 / cam.z, 0, Math.PI * 2);
        c.fill();
      });
    }
    if (!lejos) {
      // horneado: lo de base ya está en las baldosas, en vivo solo lo cambiado (agregado o movido)
      const lista = visibles(x0, y0, x1, y1).filter((d) => (horno ? d.agregado != null || d.movido != null : cam.z >= LIVIANO || !chico(d)));
      lista.filter((d) => d.piso).forEach((d) => ASSETS.dibujar(c, d.id, d.x, d.y, tt, d.o));
      lista.filter((d) => !d.piso).sort((a, b) => a.y - b.y).forEach((d) => {
        if (sel && sel.d && sel.d.agregado === d.agregado && sel.d.cosa === d.cosa) c.globalAlpha = 0.55;
        ASSETS.dibujar(c, d.id, d.x, d.y, tt, d.o);
        c.globalAlpha = 1;
      });
      if ($("choques").checked) {
        c.lineWidth = 2 / cam.z;
        lista.forEach((d) => {
          if (!d.choque) return;
          c.strokeStyle = d.agregado != null ? "#FFD98A" : "rgba(242,236,236,0.6)";
          c.beginPath();
          if (d.choque.r) c.ellipse(d.x, d.y, d.choque.r, d.choque.r / 1.6, 0, 0, Math.PI * 2);
          else c.rect(d.x - d.choque.w / 2, d.y - d.choque.h, d.choque.w, d.choque.h);
          c.stroke();
        });
      }
      // marca de lo agregado: un rombo dorado al pie
      est.poner.forEach((a) => {
        if (a.x < x0 || a.x > x1 || a.y < y0 || a.y > y1 + 200) return;
        const r = 9 / cam.z;
        c.fillStyle = "#FFD98A";
        c.beginPath();
        c.moveTo(a.x, a.y - r);
        c.lineTo(a.x + r, a.y);
        c.lineTo(a.x, a.y + r);
        c.lineTo(a.x - r, a.y);
        c.closePath();
        c.fill();
      });
    } else {
      // de lejos, cada agregado es un punto dorado y cada sacado una cruz
      est.poner.forEach((a) => {
        c.fillStyle = "#FFD98A";
        c.beginPath();
        c.arc(a.x, a.y, 5 / cam.z, 0, Math.PI * 2);
        c.fill();
      });
    }
    // lo de la historia: un rombo rúnico al pie; con el puntero encima, qué es
    if (!lejos) {
      const lista2 = visibles(x0, y0, x1, y1);
      lista2.forEach((d) => {
        if (!nombradas.has(d.cosa) || (horno && cam.z < 0.1)) return;
        const r = 8 / cam.z;
        c.strokeStyle = "#73D5DB";
        c.lineWidth = 2.5 / cam.z;
        c.beginPath();
        c.moveTo(d.x, d.y - r);
        c.lineTo(d.x + r, d.y);
        c.lineTo(d.x, d.y + r);
        c.lineTo(d.x - r, d.y);
        c.closePath();
        c.stroke();
      });
      marcarElegida(lista2);
      const h = cursor && !arrastre && !sel ? (herr === "borrar" ? tocadoSacar(cursor.x, cursor.y) : tocado(cursor.x, cursor.y)) : null;
      if (h && h.deco) etiqueta({ id: h.deco.id, x: h.deco.x, y: h.deco.y });
      else if (h && (nombradas.has(h.cosa) || $("historia").checked)) etiqueta(h);
    }
    est.quitar.forEach((q) => {
      if (q.x < x0 || q.x > x1 || q.y < y0 || q.y > y1) return;
      const r = 10 / cam.z;
      c.strokeStyle = "#C8402D";
      c.lineWidth = 3 / cam.z;
      c.beginPath();
      c.moveTo(q.x - r, q.y - r);
      c.lineTo(q.x + r, q.y + r);
      c.moveTo(q.x + r, q.y - r);
      c.lineTo(q.x - r, q.y + r);
      c.stroke();
    });
    // las notas: un alfiler dorado con su número y, de cerca, el texto
    est.notas.forEach((n, i) => {
      const k = 1 / cam.z;
      c.save();
      c.translate(n.x, n.y);
      c.scale(k, k);
      c.fillStyle = "rgba(0,0,0,0.4)";
      c.beginPath();
      c.ellipse(0, 0, 7, 3, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = notaSel === i ? "#FFFFFF" : "#FFD98A";
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(-9, -18);
      c.arc(0, -22, 10, Math.PI * 0.8, Math.PI * 2.2);
      c.closePath();
      c.fill();
      c.fillStyle = "#111111";
      c.font = "bold 11px system-ui, sans-serif";
      c.textAlign = "center";
      c.fillText(String(i + 1), 0, -18);
      if (cam.z > 0.08 && n.texto) {
        c.font = "13px system-ui, sans-serif";
        c.textAlign = "left";
        const lineasN = partir(n.texto, 34).slice(0, 5),
          ancho = Math.max(...lineasN.map((l) => c.measureText(l).width)) + 16;
        c.fillStyle = "rgba(17,17,17,0.9)";
        c.fillRect(14, -40, ancho, lineasN.length * 17 + 10);
        c.fillStyle = "#FFD98A";
        c.fillRect(14, -40, 3, lineasN.length * 17 + 10);
        c.fillStyle = "#F2ECEC";
        lineasN.forEach((l, j) => c.fillText(l, 24, -24 + j * 17));
      }
      c.restore();
    });
    // la vista previa de lo que se va a poner
    if (herr === "poner" && elegido && cursor && !lejos) {
      const o = opcionesDe({ id: elegido, o: nuevasOpciones(cursor.x, cursor.y) });
      if (arrastre && arrastre.dos) Object.assign(o, { x2: cursor.x, y2: cursor.y });
      const x = arrastre && arrastre.dos ? arrastre.x : cursor.x,
        y = arrastre && arrastre.dos ? arrastre.y : cursor.y;
      if (arrastre && arrastre.dos) o.x2 = cursor.x;
      c.globalAlpha = 0.6;
      ASSETS.dibujar(c, elegido, x, y, tt, o);
      c.globalAlpha = 1;
    }
    $("donde").textContent = cursor ? t("ed.donde", [Math.round(cursor.x / W.U), Math.round(cursor.y / W.U), cam.z.toFixed(2)]) : "";
    requestAnimationFrame(dibujar);
  }

  // el cartelito de lo que está bajo el puntero: su nombre y, si es de la historia, que tiene que estar
  function etiqueta(d) {
    const k = 1 / cam.z,
      nom = t("as." + d.id),
      hist = nombradas.get(d.cosa);
    const l1 = nom === "as." + d.id ? d.id : nom,
      l2 = hist ? t("ed.de_historia", [hist]) : t("ed.agregado_o_mundo");
    c.save();
    c.translate(d.x, d.y);
    c.scale(k, k);
    c.font = "bold 14px system-ui, sans-serif";
    const w1 = c.measureText(l1).width;
    c.font = "12px system-ui, sans-serif";
    const w = Math.max(w1, c.measureText(l2).width) + 20;
    c.fillStyle = "rgba(17,17,17,0.92)";
    c.fillRect(-w / 2, 14, w, 46);
    c.fillStyle = hist ? "#73D5DB" : "#E0B2B2";
    c.fillRect(-w / 2, 14, 3, 46);
    c.textAlign = "center";
    c.fillStyle = "#F2ECEC";
    c.font = "bold 14px system-ui, sans-serif";
    c.fillText(l1, 0, 33);
    c.fillStyle = hist ? "#73D5DB" : "#B5A5A0";
    c.font = "12px system-ui, sans-serif";
    c.fillText(l2, 0, 51);
    c.restore();
  }

  function partir(txt, n) {
    const out = [];
    txt.split("\n").forEach((par) => {
      let l = "";
      par.split(" ").forEach((w) => {
        if ((l + " " + w).trim().length > n && l) {
          out.push(l);
          l = w;
        } else l = (l + " " + w).trim();
      });
      out.push(l);
    });
    return out;
  }

  // ---------- elegir una estructura: tamaño, proporciones, espejado y cosas pegadas ----------
  // Con Mover, un clic sin arrastrar la elige. Lo agregado guarda sus opciones en su o; lo del mundo, en su entrada de
  // est.mover (o: { esc, ex, ey, esp }). Lo que se pone con «Agregarle algo» queda pegado (pegado: clave del padre) y
  // se mueve con ella.
  let elegida = null, // { a } (de est.poner) o { cosa } (del mundo)
    pegarA = null;
  const uid = () => "a" + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  function nuevo(a) {
    a.u = uid();
    if (pegarA) a.pegado = pegarA;
    return a;
  }
  function claveDe(d) {
    if (d.agregado != null) {
      const a = est.poner[d.agregado];
      if (!a.u) a.u = uid();
      return a.u;
    }
    const cosa = d.cosa || d;
    return "m:" + cosa.id + "@" + Math.round(cosa.x) + "," + Math.round(cosa.y);
  }
  const hijosDe = (k) => est.poner.filter((a) => a.pegado === k);
  function correrHijos(l, dx, dy) {
    if (!dx && !dy) return;
    l.forEach((a) => {
      a.x = r1(a.x + dx);
      a.y = r1(a.y + dy);
      if (a.o && a.o.x2 !== undefined) (a.o.x2 = r1(a.o.x2 + dx)), (a.o.y2 = r1(a.o.y2 + dy));
    });
  }
  function elegir(d) {
    elegida = d.agregado != null ? { a: est.poner[d.agregado] } : { cosa: d.cosa };
    pintarElegida();
  }
  function soltarElegida() {
    elegida = null;
    pegarA = null;
    $("selPanel").classList.add("oculto");
  }
  // la entrada de est.mover de lo del mundo elegido (se crea si hace falta)
  function entrada(crear) {
    const cosa = elegida.cosa;
    if (movidos.has(cosa)) return est.mover[movidos.get(cosa)];
    if (!crear) return null;
    est.mover.push({ id: cosa.id, x: r1(cosa.x), y: r1(cosa.y), nx: r1(cosa.x), ny: r1(cosa.y) });
    armarMovidos();
    return est.mover[est.mover.length - 1];
  }
  function opcionesElegida() {
    if (!elegida) return {};
    if (elegida.a) return elegida.a.o || (elegida.a.o = {});
    const m = entrada(false);
    return Object.assign({}, elegida.cosa.o, (m && m.o) || {});
  }
  function cambiarElegida(k, v, quieto) {
    if (!elegida) return;
    let o;
    if (elegida.a) o = elegida.a.o || (elegida.a.o = {});
    else {
      const m = entrada(true);
      o = m.o || (m.o = {});
    }
    if (quieto) delete o[k];
    else o[k] = v;
  }
  const deslizadores = [
    ["selEsc", "esc", 1],
    ["selEx", "ex", 1],
    ["selEy", "ey", 1],
    ["selRot", "rot", 0],
  ];
  function pintarElegida() {
    const panel = $("selPanel");
    if (!elegida) return panel.classList.add("oculto");
    panel.classList.remove("oculto");
    const id = elegida.a ? elegida.a.id : elegida.cosa.id,
      nom = t("as." + id),
      o = opcionesElegida(),
      hist = elegida.cosa && nombradas.get(elegida.cosa);
    $("selNombre").textContent = nom === "as." + id ? id : nom;
    $("selTipo").textContent = hist ? t("ed.de_historia", [hist]) : elegida.a ? t("ed.sel_agregado", [hijosDe(elegida.a.u || "-").length]) : t("ed.sel_mundo", [hijosDe(claveDe(elegida.cosa)).length]);
    const dos = o.x2 !== undefined;
    deslizadores.forEach(([el, k, base]) => {
      $(el).value = dos ? (k === "rot" ? anguloDos() : base) : o[k] || base;
      $(el + "V").textContent = k === "rot" ? Math.round(+$(el).value) + "°" : (+$(el).value).toFixed(2);
      // lo que va de punta a punta: el tamaño es su largo y el giro lo da vuelta sobre su centro
      $(el).disabled = dos && (k === "ex" || k === "ey");
    });
    escPrevio = 1;
    $("selEsp").checked = !!o.esp;
    $("selDos").classList.toggle("oculto", !dos);
  }
  deslizadores.forEach(([el, k, base]) => {
    $(el).addEventListener("pointerdown", () => recordar());
    $(el).addEventListener("keydown", () => recordar());
    $(el).addEventListener("input", () => {
      const v = +$(el).value;
      $(el + "V").textContent = k === "rot" ? Math.round(v) + "°" : v.toFixed(2);
      if (esDos() && k === "rot") return girarDos(v);
      if (esDos() && k === "esc") {
        estirarDos(v / escPrevio);
        escPrevio = v;
        return;
      }
      cambiarElegida(k, v, Math.abs(v - base) < 0.001);
    });
    $(el).addEventListener("change", guardar);
  });
  // lo que va de punta a punta (cercos, muralla, puentes): sus dos puntas, en lo agregado (x, y → o.x2, o.y2) o en su
  // entrada de est.mover (nx, ny → o.x2, o.y2, ya en su lugar final)
  let escPrevio = 1;
  const esDos = () => elegida && opcionesElegida().x2 !== undefined;
  function puntasDos() {
    if (elegida.a) {
      const a = elegida.a;
      return { a: [a.x, a.y], b: [a.o.x2, a.o.y2], fijar: (p, q) => ((a.x = r1(p[0])), (a.y = r1(p[1])), (a.o.x2 = r1(q[0])), (a.o.y2 = r1(q[1]))) };
    }
    const cosa = elegida.cosa,
      m = entrada(true),
      b = m.o && m.o.x2 !== undefined ? [m.o.x2, m.o.y2] : [cosa.o.x2 + m.nx - cosa.x, cosa.o.y2 + m.ny - cosa.y];
    return {
      a: [m.nx, m.ny],
      b,
      fijar: (p, q) => {
        correrHijos(hijosDe(claveDe(cosa)), r1(p[0]) - m.nx, r1(p[1]) - m.ny);
        m.nx = r1(p[0]);
        m.ny = r1(p[1]);
        m.o = Object.assign(m.o || {}, { x2: r1(q[0]), y2: r1(q[1]) });
      },
    };
  }
  function anguloDos() {
    const { a, b } = puntasDos();
    return Math.round((Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI);
  }
  function girarDos(grados) {
    cambiarElegida("rot", 0, true); // el giro de un objeto suelto no va acá
    const { a, b, fijar } = puntasDos(),
      cx = (a[0] + b[0]) / 2,
      cy = (a[1] + b[1]) / 2,
      l = Math.hypot(b[0] - a[0], b[1] - a[1]) / 2,
      ang = (grados * Math.PI) / 180,
      dx = Math.cos(ang) * l,
      dy = Math.sin(ang) * l;
    fijar([cx - dx, cy - dy], [cx + dx, cy + dy]);
  }
  function estirarDos(f) {
    const { a, b, fijar } = puntasDos(),
      cx = (a[0] + b[0]) / 2,
      cy = (a[1] + b[1]) / 2;
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) * f < 20) return;
    fijar([cx + (a[0] - cx) * f, cy + (a[1] - cy) * f], [cx + (b[0] - cx) * f, cy + (b[1] - cy) * f]);
  }
  $("selEsp").addEventListener("change", () => {
    recordar();
    cambiarElegida("esp", true, !$("selEsp").checked);
    guardar();
  });
  $("selComo").onclick = () => {
    if (!elegida) return;
    recordar();
    ["esc", "ex", "ey", "esp", "rot"].forEach((k) => cambiarElegida(k, 0, true));
    const m = elegida.cosa && entrada(false);
    if (m && m.o) delete m.o.x2, delete m.o.y2;
    guardar();
    pintarElegida();
  };
  $("selAgregar").onclick = () => {
    if (!elegida) return;
    pegarA = elegida.a ? elegida.a.u || (elegida.a.u = uid()) : claveDe(elegida.cosa);
    ponerHerr("poner");
    avisar(t("ed.sel_pegar", [$("selNombre").textContent]));
  };
  $("selSoltar").onclick = soltarElegida;
  // el recuadro de lo elegido y de lo que tiene pegado
  function marcarElegida(l) {
    if (!elegida) return;
    const k = elegida.a ? elegida.a.u : claveDe(elegida.cosa);
    l.forEach((d) => {
      const es = elegida.a ? d.agregado != null && est.poner[d.agregado] === elegida.a : d.cosa === elegida.cosa;
      const hijo = d.agregado != null && k && est.poner[d.agregado].pegado === k;
      if (!es && !hijo) return;
      if (d.o && d.o.x2 !== undefined) {
        // lo que va de punta a punta: una línea punteada de punta a punta, con un punto en cada una
        c.save();
        c.strokeStyle = c.fillStyle = es ? "#FFD98A" : "rgba(255,217,138,0.6)";
        c.lineWidth = (es ? 2.5 : 1.5) / cam.z;
        c.setLineDash([10 / cam.z, 6 / cam.z]);
        c.beginPath();
        c.moveTo(d.x, d.y + 12);
        c.lineTo(d.o.x2, d.o.y2 + 12);
        c.stroke();
        [[d.x, d.y], [d.o.x2, d.o.y2]].forEach(([x, y]) => {
          c.beginPath();
          c.arc(x, y + 12, 6 / cam.z, 0, Math.PI * 2);
          c.fill();
        });
        c.restore();
        return;
      }
      const w = d.choque ? (d.choque.w ? d.choque.w : d.choque.r * 2) + 30 : 70 * ((d.o && d.o.esc) || 1),
        h = Math.min(d.alto, 900) + 20;
      c.save();
      c.strokeStyle = es ? "#FFD98A" : "rgba(255,217,138,0.6)";
      c.lineWidth = (es ? 2.5 : 1.5) / cam.z;
      c.setLineDash([10 / cam.z, 6 / cam.z]);
      c.strokeRect(d.x - w / 2, d.y - h, w, h + 14);
      c.restore();
    });
  }

  // ---------- los caminos: clic en cada punto, doble clic, Enter o Esc lo termina; el ancho sale del tamaño ----------
  // Los de base (los del mundo, CAM0) se pueden sacar (est.quitarCaminos: su número) o cambiar de tipo
  // (est.estiloCaminos: [{ i, tipo, borde, fundir, w }]); los nuevos van en est.caminos. Todo se vuelca en W.CAMINOS,
  // que es lo que pinta el piso (SENDAS), y se repintan los trozos de lo que cambió.
  let camino = null;
  const CAM0 = W.CAMINOS.slice();
  CAM0.forEach((cm, i) => (cm.sem = cm.sem == null ? i : cm.sem));
  let firmasCam = new Map();
  function aplicarCaminos() {
    const lista = [];
    CAM0.forEach((cm, i) => {
      if (est.quitarCaminos.includes(i)) return;
      const e = est.estiloCaminos.find((q) => q.i === i);
      lista.push(e ? Object.assign({}, cm, { tipo: e.tipo, borde: e.borde, fundir: e.fundir, w: e.w || cm.w, p: e.p || cm.p, base: i }) : Object.assign(cm, { base: i }));
    });
    est.caminos.forEach((cm, i) => lista.push(Object.assign({}, cm, { sem: 1000 + i, nuevo: i })));
    const nuevas = new Map(lista.map((cm) => [(cm.base != null ? "b" + cm.base : "n" + cm.nuevo), JSON.stringify([cm.p, cm.w, cm.tipo, cm.borde, cm.fundir])]));
    const repintar = [];
    nuevas.forEach((f, k) => firmasCam.get(k) !== f && repintar.push(k));
    firmasCam.forEach((f, k) => !nuevas.has(k) && repintar.push(k));
    const viejos = W.CAMINOS.slice();
    W.CAMINOS.length = 0;
    lista.forEach((cm) => W.CAMINOS.push(cm));
    const todos = viejos.concat(lista);
    repintar.forEach((k) => {
      todos.filter((cm) => (cm.base != null ? "b" + cm.base : "n" + cm.nuevo) === k).forEach((cm) => {
        for (let i = 1; i < cm.p.length; i++) {
          const [ax, ay] = cm.p[i - 1],
            [bx, by] = cm.p[i],
            n = Math.ceil(Math.hypot(bx - ax, by - ay) / 400);
          for (let j = 0; j <= n; j++) W.invalidar(ax + ((bx - ax) * j) / n, ay + ((by - ay) * j) / n);
        }
      });
    });
    firmasCam = nuevas;
  }
  // la firma de los caminos que pasan por un rectángulo (para las baldosas horneadas)
  function firmaCaminos(x0, y0, x1, y1) {
    return W.CAMINOS.filter((cm) => cm.p.some(([x, y]) => x > x0 - 1500 && x < x1 + 1500 && y > y0 - 1500 && y < y1 + 1500))
      .map((cm) => firmasCam.get(cm.base != null ? "b" + cm.base : "n" + cm.nuevo))
      .join("/") + est.quitarCaminos.join(",");
  }
  const opcionesCamino = () => ({ tipo: $("camTipo").value, borde: $("camBorde").value, fundir: $("camFundir").checked });
  function terminarCamino() {
    if (camino && camino.p.length >= 2) {
      recordar();
      // la última punta se pega a la punta de otro camino si cae encima
      const ult = camino.p[camino.p.length - 1],
        pt = puntaEn(ult[0], ult[1], camino.sigue && camino.sigue.cm);
      if (pt) camino.p[camino.p.length - 1] = pt.q.slice();
      if (camino.sigue) {
        // seguir un camino desde una de sus puntas: los puntos nuevos se le suman (mismo ancho, tipo y borde)
        const { cm, alInicio } = camino.sigue,
          nuevos = camino.p.slice(1);
        const p = puntosDe(cm);
        if (alInicio) p.unshift(...nuevos.reverse());
        else p.push(...nuevos);
      } else est.caminos.push(Object.assign({ p: camino.p, w: camino.w }, opcionesCamino()));
      guardar();
    }
    camino = null;
  }
  // la lista de puntos que se puede cambiar de un camino (los de base guardan su recorrido nuevo en est.estiloCaminos)
  function puntosDe(cm) {
    if (cm.nuevo != null) return est.caminos[cm.nuevo].p;
    let e = est.estiloCaminos.find((q) => q.i === cm.base);
    if (!e) est.estiloCaminos.push((e = { i: cm.base, tipo: cm.tipo || "tierra", borde: cm.borde || "", fundir: !!cm.fundir, w: cm.w }));
    if (!e.p) e.p = cm.p.map((q) => [r1(q[0]), r1(q[1])]);
    return e.p;
  }
  // la punta de un camino bajo (x, y): { cm, alInicio, q }
  function puntaEn(x, y, salvo) {
    let mejor = null,
      dm = Infinity;
    W.CAMINOS.forEach((cm) => {
      if (cm === salvo) return;
      [[cm.p[0], true], [cm.p[cm.p.length - 1], false]].forEach(([q, alInicio]) => {
        const d = Math.hypot(x - q[0], y - q[1]);
        if (d < Math.max(cm.w / 2, 14 / cam.z) && d < dm) (dm = d), (mejor = { cm, alInicio, q });
      });
    });
    return mejor;
  }
  // el punto del camino elegido bajo (x, y), o el tramo (para meterle uno nuevo)
  function verticeEn(cm, x, y) {
    const r = 12 / cam.z;
    for (let k = 0; k < cm.p.length; k++) if (Math.hypot(x - cm.p[k][0], y - cm.p[k][1]) < r) return { k };
    for (let k = 1; k < cm.p.length; k++) if (distSeg(x, y, cm.p[k - 1][0], cm.p[k - 1][1], cm.p[k][0], cm.p[k][1]) < cm.w / 2) return { k, nuevo: true };
    return null;
  }
  // el camino elegido (con Mover o con la herramienta Camino): { base } o { nuevo }
  let camElegido = null;
  function caminoElegido() {
    if (!camElegido) return null;
    return W.CAMINOS.find((cm) => (camElegido.base != null ? cm.base === camElegido.base : cm.nuevo === camElegido.nuevo)) || null;
  }
  function elegirCamino(cm) {
    camElegido = cm ? (cm.base != null ? { base: cm.base } : { nuevo: cm.nuevo }) : null;
    pintarPanelCamino();
  }
  function pintarPanelCamino() {
    const cm = caminoElegido();
    $("camPanel").classList.toggle("oculto", herr !== "camino" && !cm);
    $("camElegido").classList.toggle("oculto", !cm);
    if (cm) {
      $("camTipo").value = cm.tipo || "tierra";
      $("camBorde").value = cm.borde || "";
      $("camFundir").checked = !!cm.fundir;
      $("camAncho").value = cm.w;
      $("camAnchoV").textContent = Math.round(cm.w);
      $("camTitulo").textContent = t(cm.base != null ? "ed.cam_de_base" : "ed.cam_nuevo");
    } else $("camTitulo").textContent = t("ed.cam_nuevo_titulo");
  }
  // cambiar el tipo, el borde, las puntas o el ancho del elegido
  function cambiarCamino() {
    const cm = caminoElegido();
    if (!cm) return;
    recordar();
    const o = Object.assign(opcionesCamino(), { w: +$("camAncho").value });
    if (cm.nuevo != null) Object.assign(est.caminos[cm.nuevo], o);
    else {
      const e = est.estiloCaminos.find((q) => q.i === cm.base);
      if (e) Object.assign(e, o);
      else est.estiloCaminos.push(Object.assign({ i: cm.base }, o));
    }
    guardar();
  }
  ["camTipo", "camBorde", "camFundir"].forEach((id) => $(id).addEventListener("change", cambiarCamino));
  $("camAncho").addEventListener("input", () => ($("camAnchoV").textContent = $("camAncho").value));
  $("camAncho").addEventListener("change", cambiarCamino);
  $("camSacar").onclick = () => {
    const cm = caminoElegido();
    if (!cm) return;
    sacarCamino(cm);
  };
  $("camSoltar").onclick = () => elegirCamino(null);
  function sacarCamino(cm) {
    recordar();
    if (cm.nuevo != null) est.caminos.splice(cm.nuevo, 1);
    else {
      est.quitarCaminos.push(cm.base);
      est.estiloCaminos = est.estiloCaminos.filter((q) => q.i !== cm.base);
    }
    camElegido = null;
    guardar();
    pintarPanelCamino();
  }
  const distSeg = (px, py, ax, ay, bx, by) => {
    const dx = bx - ax,
      dy = by - ay,
      l = dx * dx + dy * dy,
      k = l ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l)) : 0;
    return Math.hypot(px - ax - dx * k, py - ay - dy * k);
  };
  function caminoEn(x, y) {
    for (let i = W.CAMINOS.length - 1; i >= 0; i--) {
      const cm = W.CAMINOS[i];
      for (let k = 1; k < cm.p.length; k++) if (distSeg(x, y, cm.p[k - 1][0], cm.p[k - 1][1], cm.p[k][0], cm.p[k][1]) < cm.w / 2 + 10 / cam.z) return cm;
    }
    return null;
  }
  cv.addEventListener("dblclick", (e) => {
    const cm = !camino && caminoElegido();
    if (cm && (herr === "camino" || herr === "mover")) {
      // doble clic en un punto del camino elegido lo saca (si le quedan dos o más)
      const [x, y] = aMundo(e.offsetX, e.offsetY),
        v = verticeEn(cm, x, y);
      if (v && !v.nuevo && cm.p.length > 2) {
        recordar();
        puntosDe(cm).splice(v.k, 1);
        guardar();
      }
      return;
    }
    if (herr === "camino") terminarCamino();
  });

  // ---------- el agua: ríos y lagunas ----------
  // Con Agua (6) se traza un río (clic en cada punto, doble clic, Enter o Esc lo termina; el ancho sale de su barra)
  // o se arrastra una laguna desde el centro. Con Mover un clic en el agua la elige (una laguna tuya también se
  // arrastra) y con Sacar se saca. Lo de base que se saca queda en est.quitarRios / est.quitarLagos (su número: el
  // mundo lo deja marcado seco, sin correr la lista); lo nuevo va en est.rios ({ p, w }) y est.lagos ({ x, y, rx, ry }).
  // Todo se vuelca en W.RIOS y W.LAGOS, que es lo que pinta el piso. En el juego lo que queda adentro del agua nueva
  // se saca y donde la cruza un camino queda un vado.
  const RIOS0 = W.RIOS.filter((r) => !r.agregado),
    LAGOS0 = W.LAGOS.filter((l) => !l.agregado);
  let rio = null, // el río que se está trazando: { p, w }
    aguaSel = null; // { rio | lago: índice en W.RIOS / W.LAGOS }
  const cajaRio = (r) => {
    const xs = r.p.map((q) => q[0]),
      ys = r.p.map((q) => q[1]),
      m = r.w / 2 + 120;
    return [Math.min(...xs) - m, Math.min(...ys) - m, Math.max(...xs) + m, Math.max(...ys) + m];
  };
  const cajaLago = (l) => [l.p[0] - l.rx - 120, l.p[1] - l.ry - 120, l.p[0] + l.rx + 120, l.p[1] + l.ry + 120];
  function invalidarCaja([a, b, cc, d]) {
    for (let y = b; y <= d + 400; y += 400) for (let x = a; x <= cc + 400; x += 400) W.invalidar(Math.min(x, cc), Math.min(y, d));
  }
  let firmasAgua = new Map();
  function aplicarAgua() {
    RIOS0.forEach((r, i) => (r.seco = est.quitarRios.includes(i)));
    LAGOS0.forEach((l, i) => (l.seco = est.quitarLagos.includes(i)));
    W.RIOS.length = 0;
    RIOS0.forEach((r, i) => W.RIOS.push(Object.assign(r, { base: i })));
    est.rios.forEach((r, i) => W.RIOS.push({ p: r.p, w: r.w, agregado: true, nuevo: i }));
    W.LAGOS.length = 0;
    LAGOS0.forEach((l, i) => W.LAGOS.push(Object.assign(l, { base: i })));
    est.lagos.forEach((l, i) => W.LAGOS.push({ p: [l.x, l.y], rx: l.rx, ry: l.ry, agregado: true, nuevo: i }));
    // se repintan los trozos de lo que cambió
    const nuevas = new Map();
    W.RIOS.forEach((r) => !r.seco && nuevas.set(JSON.stringify([r.p, r.w]), cajaRio(r)));
    W.LAGOS.forEach((l) => !l.seco && nuevas.set(JSON.stringify([l.p, l.rx, l.ry]), cajaLago(l)));
    nuevas.forEach((cj, k) => !firmasAgua.has(k) && invalidarCaja(cj));
    firmasAgua.forEach((cj, k) => !nuevas.has(k) && invalidarCaja(cj));
    firmasAgua = nuevas;
  }
  // lo del agua que cambió y cae en un rectángulo (para las baldosas horneadas)
  function firmaAgua(x0, y0, x1, y1) {
    const toca = (cj) => cj[0] < x1 && cj[2] > x0 && cj[1] < y1 + 1200 && cj[3] > y0 - 300;
    let f = "";
    W.RIOS.forEach((r, i) => (r.agregado || r.seco) && toca(cajaRio(r)) && (f += "r" + i + (r.seco ? "s" : JSON.stringify([r.p, r.w]))));
    W.LAGOS.forEach((l, i) => (l.agregado || l.seco) && toca(cajaLago(l)) && (f += "l" + i + (l.seco ? "s" : JSON.stringify([l.p, l.rx, l.ry]))));
    return f;
  }
  // ¿(x, y) cae en el agua? (con un margen de m)
  const enRio = (r, x, y, m = 0) => r.p.some((q, k) => k && distSeg(x, y, r.p[k - 1][0], r.p[k - 1][1], q[0], q[1]) < r.w / 2 + m);
  const enLago = (l, x, y, m = 0) => Math.hypot((x - l.p[0]) / (l.rx + m), (y - l.p[1]) / (l.ry + m)) < 1;
  function aguaEn(x, y) {
    const m = 8 / cam.z;
    for (let i = W.LAGOS.length - 1; i >= 0; i--) if (!W.LAGOS[i].seco && enLago(W.LAGOS[i], x, y, m)) return { lago: i };
    for (let i = W.RIOS.length - 1; i >= 0; i--) if (!W.RIOS[i].seco && enRio(W.RIOS[i], x, y, m)) return { rio: i };
    return null;
  }
  // lo del mundo que quedó bajo el agua nueva no se ve (en el juego se saca), salvo lo de la historia
  const enAguaNueva = (x, y) => est.rios.some((r) => enRio(r, x, y)) || est.lagos.some((l) => enLago({ p: [l.x, l.y], rx: l.rx, ry: l.ry }, x, y));
  const ahogado = (o) =>
    (est.rios.length || est.lagos.length) &&
    !o.o.piso &&
    enAguaNueva(o.x, o.y) &&
    !nombradas.has(o) &&
    !W.CAMINOS.some((cm) => cm.p.some((q, k) => k && distSeg(o.x, o.y, cm.p[k - 1][0], cm.p[k - 1][1], q[0], q[1]) < cm.w / 2));
  const aguaElegida = () => (!aguaSel ? null : aguaSel.rio != null ? W.RIOS[aguaSel.rio] : W.LAGOS[aguaSel.lago]) || null;
  function elegirAgua(a) {
    aguaSel = a;
    pintarPanelAgua();
  }
  function pintarPanelAgua() {
    const a = aguaElegida(),
      esLago = a && aguaSel.lago != null;
    $("aguaPanel").classList.toggle("oculto", herr !== "agua" && !a);
    $("aguaNueva").classList.toggle("oculto", !!a);
    $("aguaElegida").classList.toggle("oculto", !a);
    $("aguaFilaAncho").classList.toggle("oculto", esLago || (!a && $("aguaForma").value !== "rio"));
    $("aguaFilasLago").classList.toggle("oculto", !esLago);
    if (!a) return ($("aguaTitulo").textContent = t("ed.agua_nueva"));
    $("aguaTitulo").textContent = t((esLago ? "ed.agua_lago" : "ed.agua_rio") + (a.agregado ? "_tuyo" : "_base"));
    if (esLago) {
      $("aguaRx").value = a.rx;
      $("aguaRxV").textContent = Math.round(a.rx);
      $("aguaRy").value = a.ry;
      $("aguaRyV").textContent = Math.round(a.ry);
    } else {
      $("aguaAncho").value = a.w;
      $("aguaAnchoV").textContent = Math.round(a.w);
    }
    // lo de base se saca pero no se cambia de tamaño
    ["aguaAncho", "aguaRx", "aguaRy"].forEach((id) => ($(id).disabled = !a.agregado));
  }
  function cambiarAgua() {
    const a = aguaElegida();
    if (!a || !a.agregado) return;
    recordar();
    if (aguaSel.lago != null) Object.assign(est.lagos[a.nuevo], { rx: +$("aguaRx").value, ry: +$("aguaRy").value });
    else est.rios[a.nuevo].w = +$("aguaAncho").value;
    guardar();
  }
  [["aguaAncho", "aguaAnchoV"], ["aguaRx", "aguaRxV"], ["aguaRy", "aguaRyV"]].forEach(([id, v]) => {
    $(id).addEventListener("input", () => ($(v).textContent = $(id).value));
    $(id).addEventListener("change", () => (aguaElegida() ? cambiarAgua() : 0));
  });
  $("aguaForma").addEventListener("change", () => {
    if (rio) terminarRio();
    pintarPanelAgua();
  });
  function sacarAgua(a) {
    const w = a.rio != null ? W.RIOS[a.rio] : W.LAGOS[a.lago];
    if (!w) return;
    recordar();
    if (a.rio != null) w.agregado ? est.rios.splice(w.nuevo, 1) : est.quitarRios.push(w.base);
    else w.agregado ? est.lagos.splice(w.nuevo, 1) : est.quitarLagos.push(w.base);
    aguaSel = null;
    guardar();
    pintarPanelAgua();
    if (!w.agregado) avisar(t("ed.agua_seca"));
  }
  $("aguaSacar").onclick = () => aguaSel && sacarAgua(aguaSel);
  $("aguaSoltar").onclick = () => elegirAgua(null);
  function terminarRio() {
    if (rio && rio.p.length >= 2) {
      recordar();
      est.rios.push({ p: rio.p, w: rio.w });
      guardar();
    }
    rio = null;
  }
  cv.addEventListener("dblclick", () => herr === "agua" && terminarRio());
  // el río a medio trazar, la laguna que se arrastra y el contorno de lo elegido
  function pintaRio(p, w, alfa) {
    c.save();
    c.globalAlpha = alfa;
    [[w + 70, "#2E3324"], [w + 30, "#4A4A3A"], [w, "#2A4C56"], [w * 0.55, "#30586A"]].forEach(([g, col]) => {
      c.beginPath();
      p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.strokeStyle = col;
      c.lineWidth = g;
      c.lineJoin = c.lineCap = "round";
      c.stroke();
    });
    c.restore();
  }
  function pintaLago(x, y, rx, ry, alfa) {
    c.save();
    c.globalAlpha = alfa;
    [[60, 50, "#2E3324"], [24, 20, "#4A4A3A"], [0, 0, "#2A4C56"]].forEach(([mx, my, col]) => {
      c.fillStyle = col;
      c.beginPath();
      c.ellipse(x, y, rx + mx, ry + my, 0, 0, Math.PI * 2);
      c.fill();
    });
    c.restore();
  }
  function dibujarAgua() {
    if (rio && cursor) pintaRio(rio.p.concat([[cursor.x, cursor.y]]), rio.w, 0.75);
    if (rio) {
      c.fillStyle = "#73D5DB";
      rio.p.forEach(([x, y]) => {
        c.beginPath();
        c.arc(x, y, 6 / cam.z, 0, Math.PI * 2);
        c.fill();
      });
    }
    if (arrastre && arrastre.lago && cursor) {
      const [rx, ry] = medidaLago(arrastre, cursor);
      pintaLago(arrastre.x, arrastre.y, rx, ry, 0.75);
    }
    const a = aguaElegida();
    if (!a) return;
    let lx = a.p[0],
      ly = a.p[1];
    if (sel && sel.lago != null && sel.movio) (lx = cursor.x - sel.dx), (ly = cursor.y - sel.dy);
    if (sel && sel.lago != null && sel.movio) pintaLago(lx, ly, a.rx, a.ry, 0.6);
    c.save();
    c.strokeStyle = "#73D5DB";
    c.lineWidth = 3 / cam.z;
    c.setLineDash([12 / cam.z, 8 / cam.z]);
    c.beginPath();
    if (aguaSel.lago != null) c.ellipse(lx, ly, a.rx, a.ry, 0, 0, Math.PI * 2);
    else a.p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
    c.restore();
  }
  // una laguna se arrastra desde el centro; un clic solo la pone de un tamaño mediano
  const medidaLago = (a, p) => {
    const dx = Math.abs(p.x - a.x),
      dy = Math.abs(p.y - a.y);
    return dx < 40 / cam.z && dy < 40 / cam.z ? [600, 400] : [Math.max(150, r1(dx)), Math.max(100, r1(dy))];
  };

  // ---------- las notas (para Claude: qué hacer en ese lugar) ----------
  let notaSel = -1;
  const caja = $("notaCaja"),
    area = $("notaTexto");
  function notaEn(x, y) {
    let mejor = -1,
      dm = 26 / cam.z;
    est.notas.forEach((n, i) => {
      const d = Math.hypot(x - n.x, y - (n.y - 20 / cam.z));
      if (d < dm) {
        dm = d;
        mejor = i;
      }
    });
    return mejor;
  }
  function abrirNota(i) {
    notaSel = i;
    area.value = est.notas[i].texto || "";
    $("notaNum").textContent = t("ed.nota_n", [i + 1]);
    caja.classList.add("ver");
    setTimeout(() => area.focus(), 0);
  }
  function cerrarNota() {
    if (notaSel >= 0 && est.notas[notaSel]) {
      const v = area.value.trim();
      if (v !== (est.notas[notaSel].texto || "")) recordar();
      if (v) est.notas[notaSel].texto = v;
      else est.notas.splice(notaSel, 1);
      guardar();
    }
    notaSel = -1;
    caja.classList.remove("ver");
    cv.focus();
  }
  $("notaListo").onclick = cerrarNota;
  $("notaBorrar").onclick = () => {
    if (notaSel >= 0) {
      recordar();
      est.notas.splice(notaSel, 1);
      notaSel = -1;
      guardar();
    }
    caja.classList.remove("ver");
  };
  area.addEventListener("keydown", (e) => {
    if (e.key === "Escape" || (e.key === "Enter" && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      cerrarNota();
    }
    e.stopPropagation();
  });

  // ---------- la lista de objetos ----------
  let elegido = null;
  const lista = $("lista");
  const fichas = [];
  function armarLista() {
    lista.innerHTML = "";
    fichas.length = 0;
    const q = $("buscar").value.trim().toLowerCase();
    const porGrupo = {};
    ASSETS.catalogo().forEach((a) => {
      const nom = t("as." + a.id);
      if (q && !nom.toLowerCase().includes(q) && !a.id.toLowerCase().includes(q)) return;
      (porGrupo[a.grupo] = porGrupo[a.grupo] || []).push(Object.assign({ nom }, a));
    });
    Object.keys(porGrupo).forEach((g) => {
      const h = document.createElement("div");
      h.className = "grupo";
      h.textContent = t("as.grupo." + g);
      lista.appendChild(h);
      porGrupo[g].forEach((a) => {
        const b = document.createElement("button");
        b.className = "obj" + (a.id === elegido ? " elegido" : "");
        b.type = "button";
        const m = document.createElement("canvas");
        m.width = 300;
        m.height = 140;
        const s = document.createElement("span");
        s.textContent = a.nom;
        b.append(m, s);
        b.addEventListener("click", () => {
          elegido = a.id;
          ponerHerr("poner");
          lista.querySelectorAll(".obj").forEach((x) => x.classList.toggle("elegido", x === b));
          if (dosPuntos(a.id)) avisar(t("ed.dos_puntos"));
        });
        lista.appendChild(b);
        fichas.push({ m, a });
      });
    });
    pintarFichas();
  }
  // las miniaturas se pintan de a poco para no trabar la página
  let colaFichas = 0;
  function pintarFichas() {
    const mio = ++colaFichas;
    let i = 0;
    const paso = () => {
      if (mio !== colaFichas) return;
      for (let k = 0; k < 12 && i < fichas.length; k++, i++) {
        const { m, a } = fichas[i],
          x = m.getContext("2d");
        x.fillStyle = "#3B3222";
        x.fillRect(0, 0, m.width, m.height);
        const esc = Math.min(1.6, (m.height - 24) / Math.max(40, a.alto)),
          o = Object.assign({ s: esc, sem: 3 }, a.ejemplo);
        if (o.x2 !== undefined) (o.x2 = m.width / 2 + o.x2 * esc), (o.y2 = m.height - 14 + (o.y2 || 0) * esc);
        try {
          ASSETS.dibujar(x, a.id, m.width / 2, m.height - 14, 1, o);
        } catch (e) {}
      }
      if (i < fichas.length) requestAnimationFrame(paso);
    };
    paso();
  }
  $("buscar").addEventListener("input", armarLista);

  // ---------- herramientas ----------
  let herr = "poner";
  function ponerHerr(h) {
    if (h !== "camino" && camino) terminarCamino();
    if (h !== "agua" && rio) terminarRio();
    herr = h;
    $("hAgua").classList.toggle("activo", h === "agua");
    if (h !== "agua" && h !== "mover") aguaSel = null;
    pintarPanelAgua();
    $("hCamino").classList.toggle("activo", h === "camino");
    if (h !== "camino" && h !== "mover") camElegido = null;
    pintarPanelCamino();
    $("hPoner").classList.toggle("activo", h === "poner");
    $("hMover").classList.toggle("activo", h === "mover");
    $("hBorrar").classList.toggle("activo", h === "borrar");
    $("hNota").classList.toggle("activo", h === "nota");
    cv.style.cursor = h === "poner" ? "crosshair" : h === "mover" ? "grab" : h === "nota" ? "copy" : h === "camino" || h === "agua" ? "cell" : "not-allowed";
  }
  $("hPoner").onclick = () => ponerHerr("poner");
  $("hMover").onclick = () => ponerHerr("mover");
  $("hBorrar").onclick = () => ponerHerr("borrar");
  $("hNota").onclick = () => ponerHerr("nota");
  $("hCamino").onclick = () => ponerHerr("camino");
  $("hAgua").onclick = () => ponerHerr("agua");
  $("escala").addEventListener("input", () => ($("escalaV").textContent = (+$("escala").value).toFixed(2)));
  const dosPuntos = (id) => (ASSETS.EJEMPLO[id] || {}).x2 !== undefined;
  function nuevasOpciones() {
    const o = { sem: +$("variante").value || 0, v: +$("variante").value || 0 };
    if (+$("escala").value !== 1) o.esc = +$("escala").value;
    if ($("espejo").checked) o.esp = true;
    const ej = ASSETS.EJEMPLO[elegido] || {};
    Object.keys(ej).forEach((k) => {
      if (k !== "x2" && k !== "y2" && o[k] === undefined) o[k] = ej[k];
    });
    return o;
  }
  // el objeto bajo el puntero: el más cercano a su pie, o a la mitad de su altura
  function tocado(x, y) {
    const vw = cw / cam.z,
      vh = ch / cam.z;
    const l = visibles(cam.x - vw / 2, cam.y - vh / 2, cam.x + vw / 2, cam.y + vh / 2);
    let mejor = null,
      dm = Infinity;
    l.forEach((d) => {
      // lo que va de punta a punta se toca en todo su largo
      if (d.o && d.o.x2 !== undefined) {
        const dist = distSeg(x, y, d.x, d.y - 30, d.o.x2, d.o.y2 - 30) - (d.agregado != null ? 30 : 0);
        if (dist < 70 && dist < dm) (dm = dist), (mejor = d);
        return;
      }
      const s = (d.o && d.o.s) || 1,
        ancho = d.choque ? (d.choque.w ? d.choque.w / 2 : d.choque.r) + 20 : 40 * s,
        alto = Math.min(d.alto, 400);
      if (Math.abs(x - d.x) > ancho + 30 || y > d.y + 40 || y < d.y - alto - 20) return;
      const dist = Math.hypot(x - d.x, (y - (d.y - alto * 0.3)) * 0.6) - (d.agregado != null ? 30 : 0);
      if (dist < dm) {
        dm = dist;
        mejor = d;
      }
    });
    return mejor;
  }

  // ---------- el puntero ----------
  let cursor = null,
    arrastre = null,
    sel = null,
    espacio = false;
  cv.addEventListener("contextmenu", (e) => e.preventDefault());
  cv.addEventListener("pointermove", (e) => {
    const [x, y] = aMundo(e.offsetX, e.offsetY);
    cursor = { x, y };
    if (arrastre && arrastre.pan) {
      cam.x = arrastre.cx - ((e.offsetX - arrastre.sx) * dpr) / cam.z;
      cam.y = arrastre.cy - ((e.offsetY - arrastre.sy) * dpr) / cam.z;
    } else if (sel && sel.vertice != null) {
      sel.p[sel.vertice] = [r1(x), r1(y)];
      sel.movio = true;
    } else if (sel && sel.lago != null) {
      if (Math.hypot(x - sel.x0, y - sel.y0) > 6 / cam.z) sel.movio = true;
    } else if (sel && sel.nota != null) {
      const n = est.notas[sel.nota];
      if (Math.hypot(x - sel.x0, y - sel.y0) > 6 / cam.z) sel.movio = true;
      n.x = r1(x - sel.dx);
      n.y = r1(y - sel.dy);
    } else if (sel && sel.mueve && sel.d.movido != null) {
      const m = est.mover[sel.d.movido];
      if (Math.hypot(x - sel.x0, y - sel.y0) > 5 / cam.z) sel.movio = true;
      if (!sel.movio) return;
      const nx = r1(x - sel.dx),
        ny = r1(y - sel.dy);
      correrHijos(sel.hijos, nx - m.nx, ny - m.ny);
      if (m.o && m.o.x2 !== undefined) (m.o.x2 += nx - m.nx), (m.o.y2 += ny - m.ny);
      m.nx = nx;
      m.ny = ny;
    } else if (sel && sel.mueve) {
      if (Math.hypot(x - sel.x0, y - sel.y0) > 5 / cam.z) sel.movio = true;
      if (!sel.movio) return;
      if (sel.d.agregado != null) {
        const a = est.poner[sel.d.agregado];
        correrHijos(sel.hijos, r1(x - sel.dx) - a.x, r1(y - sel.dy) - a.y);
      }
      sel.d.x = x - sel.dx;
      sel.d.y = y - sel.dy;
      if (sel.d.agregado != null) {
        const a = est.poner[sel.d.agregado];
        const ddx = x - sel.dx - a.x,
          ddy = y - sel.dy - a.y;
        a.x = r1(a.x + ddx);
        a.y = r1(a.y + ddy);
        if (a.o && a.o.x2 !== undefined) (a.o.x2 = r1(a.o.x2 + ddx)), (a.o.y2 = r1(a.o.y2 + ddy));
      }
    }
  });
  cv.addEventListener("pointerdown", (e) => {
    cv.setPointerCapture(e.pointerId);
    const [x, y] = aMundo(e.offsetX, e.offsetY);
    if (e.button === 1 || e.button === 2 || espacio) {
      arrastre = { pan: true, sx: e.offsetX, sy: e.offsetY, cx: cam.x, cy: cam.y };
      cv.style.cursor = "grabbing";
      return;
    }
    if (caja.classList.contains("ver")) cerrarNota();
    // una nota se toca (para editarla) o se arrastra con cualquier herramienta menos sacar
    const ni = herr !== "borrar" ? notaEn(x, y) : -1;
    if (ni >= 0) {
      recordar();
      sel = { nota: ni, dx: x - est.notas[ni].x, dy: y - est.notas[ni].y, x0: x, y0: y };
      return;
    }
    if (herr === "nota") {
      recordar();
      est.notas.push({ x: r1(x), y: r1(y), texto: "" });
      guardar();
      abrirNota(est.notas.length - 1);
      return;
    }
    if (herr === "borrar" && notaEn(x, y) >= 0) {
      recordar();
      est.notas.splice(notaEn(x, y), 1);
      guardar();
      return;
    }
    // el camino elegido: arrastrar uno de sus puntos, o tocar un tramo para agregarle uno y arrastrarlo
    if ((herr === "camino" || herr === "mover") && !camino && caminoElegido()) {
      const cm = caminoElegido(),
        v = verticeEn(cm, x, y),
        punta = v && !v.nuevo && (v.k === 0 || v.k === cm.p.length - 1);
      // con Camino, la punta no se arrastra: desde ahí se sigue el camino
      if (v && !(punta && herr === "camino")) {
        const p = cm.p.map((q) => q.slice());
        if (v.nuevo) p.splice(v.k, 0, [r1(x), r1(y)]);
        sel = { vertice: v.k, p, cm };
        return;
      }
    }
    if (herr === "camino") {
      const p = [r1(x), r1(y)];
      if (!camino && camElegido) elegirCamino(null);
      // tocar la punta de un camino lo sigue desde ahí, con su mismo ancho, tipo y borde
      const pt = !camino && puntaEn(x, y);
      if (pt)
        camino = { p: [pt.q.slice()], w: pt.cm.w, tipo: pt.cm.tipo || "tierra", borde: pt.cm.borde || "", fundir: !!pt.cm.fundir, sigue: { cm: pt.cm, alInicio: pt.alInicio } };
      else if (!camino) camino = Object.assign({ p: [p], w: r1(110 * +$("escala").value) }, opcionesCamino());
      else {
        const u = camino.p[camino.p.length - 1];
        if (Math.hypot(u[0] - p[0], u[1] - p[1]) > 8 / cam.z) camino.p.push(p);
      }
      return;
    }
    if (herr === "agua") {
      if (aguaSel) elegirAgua(null);
      if ($("aguaForma").value === "laguna") return (arrastre = { lago: true, x, y });
      const p = [r1(x), r1(y)];
      if (!rio) rio = { p: [p], w: +$("aguaAncho").value };
      else {
        const u = rio.p[rio.p.length - 1];
        if (Math.hypot(u[0] - p[0], u[1] - p[1]) > 8 / cam.z) rio.p.push(p);
      }
      return;
    }
    // el agua se saca o se elige solo si no hay nada encima (un objeto, un camino)
    if ((herr === "borrar" || herr === "mover") && !tocadoSacar(x, y) && !caminoEn(x, y) && aguaEn(x, y)) {
      const a = aguaEn(x, y);
      if (herr === "borrar") return sacarAgua(a);
      soltarElegida();
      elegirCamino(null);
      elegirAgua(a);
      const l = a.lago != null && W.LAGOS[a.lago];
      if (l && l.agregado) sel = { lago: l.nuevo, dx: x - l.p[0], dy: y - l.p[1], x0: x, y0: y };
      return;
    }
    if (herr === "borrar" && caminoEn(x, y) && !tocadoSacar(x, y)) {
      sacarCamino(caminoEn(x, y));
      return;
    }
    // con Mover, un clic en un camino (sin nada encima) lo elige para cambiarle el tipo, el borde o sacarlo
    if (herr === "mover" && !tocado(x, y) && caminoEn(x, y)) {
      soltarElegida();
      elegirAgua(null);
      elegirCamino(caminoEn(x, y));
      return;
    }
    if (herr === "poner") {
      if (!elegido) return avisar(t("ed.elegi"));
      if (cam.z < 0.07) {
        cam.x = x;
        cam.y = y;
        cam.z = 0.3;
        return;
      }
      arrastre = { x, y, dos: dosPuntos(elegido) };
      if (!arrastre.dos) {
        recordar();
        est.poner.push(nuevo({ id: elegido, x: r1(x), y: r1(y), o: nuevasOpciones() }));
        guardar();
        arrastre = null;
      }
    } else if (herr === "mover") {
      const d = tocado(x, y);
      if (!d) return;
      recordar();
      elegir(d);
      const creado = d.agregado == null && d.movido == null;
      if (creado) {
        // mover algo del mundo (también lo de la historia): queda anotado dónde estaba y adónde va, y el juego lo
        // corre en el lugar (con la gente y los objetivos que tiene al lado)
        est.mover.push({ id: d.id, x: r1(d.cosa.x), y: r1(d.cosa.y), nx: r1(d.x), ny: r1(d.y) });
        d.movido = est.mover.length - 1;
        movidos.set(d.cosa, d.movido);
      }
      sel = { d, dx: x - d.x, dy: y - d.y, mueve: true, x0: x, y0: y, creado, hijos: hijosDe(claveDe(d)) };
      cv.style.cursor = "grabbing";
    } else if (herr === "borrar") {
      const d = tocadoSacar(x, y);
      if (!d || d.deco) {
        const dd = d && d.deco;
        if (!dd) return;
        recordar();
        est.quitarDeco.push({ id: dd.id, x: r1(dd.x), y: r1(dd.y) });
        guardar();
        return;
      }
      if (d.agregado != null) {
        recordar();
        est.poner.splice(d.agregado, 1);
      } else {
        if (nombradas.has(d.cosa)) return avisar(t("ed.no_se_saca"));
        recordar();
        if (d.movido != null) est.mover.splice(d.movido, 1);
        est.quitar.push({ id: d.id, x: r1(d.cosa.x), y: r1(d.cosa.y) });
      }
      guardar();
    }
  });
  cv.addEventListener("pointerup", (e) => {
    const [x, y] = aMundo(e.offsetX, e.offsetY);
    if (arrastre && arrastre.dos && herr === "poner") {
      recordar();
      const o = nuevasOpciones();
      o.x2 = r1(x);
      o.y2 = r1(y);
      est.poner.push(nuevo({ id: elegido, x: r1(arrastre.x), y: r1(arrastre.y), o }));
      guardar();
    }
    if (arrastre && arrastre.lago) {
      const [rx, ry] = medidaLago(arrastre, { x, y });
      recordar();
      est.lagos.push({ x: r1(arrastre.x), y: r1(arrastre.y), rx, ry });
      guardar();
    }
    if (sel && sel.vertice != null) {
      if (sel.movio) {
        recordar();
        const p = puntosDe(sel.cm);
        p.length = 0;
        sel.p.forEach((q) => p.push(q));
        guardar();
      }
    } else if (sel && sel.lago != null) {
      if (sel.movio) {
        recordar();
        Object.assign(est.lagos[sel.lago], { x: r1(x - sel.dx), y: r1(y - sel.dy) });
        guardar();
      }
    } else if (sel && sel.nota != null) {
      if (sel.movio) guardar();
      else {
        historial.pop();
        abrirNota(sel.nota);
      }
    } else if (sel && sel.mueve && !sel.movio) {
      // un clic sin arrastrar solo lo elige
      historial.pop();
      if (sel.creado && sel.d.movido != null) {
        est.mover.splice(sel.d.movido, 1);
        armarMovidos();
      }
    } else if (sel) guardar();
    arrastre = null;
    sel = null;
    ponerHerr(herr);
  });
  cv.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const [x, y] = aMundo(e.offsetX, e.offsetY);
      zoom(e.deltaY < 0 ? 1.18 : 1 / 1.18, x, y);
    },
    { passive: false },
  );
  function zoom(f, x, y) {
    const z = Math.max(0.035, Math.min(1.6, cam.z * f));
    if (x != null) {
      cam.x = x - (x - cam.x) * (cam.z / z);
      cam.y = y - (y - cam.y) * (cam.z / z);
    }
    cam.z = z;
  }
  // teclado: mover la vista, zoom, herramientas, deshacer
  const teclas = {};
  addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" && e.target.type !== "checkbox" && e.target.type !== "range") return;
    if (e.code === "Space") {
      espacio = true;
      e.preventDefault();
    }
    teclas[e.code] = true;
    if (e.key === "+" || e.key === "=") zoom(1.2);
    if (e.key === "-") zoom(1 / 1.2);
    if (e.key === "1") ponerHerr("poner");
    if (e.key === "2") ponerHerr("mover");
    if (e.key === "3") ponerHerr("borrar");
    if (elegida && (e.key === "f" || e.key === "F")) {
      recordar();
      cambiarElegida("esp", true, !!opcionesElegida().esp);
      guardar();
      pintarElegida();
    }
    if (elegida && esDos() && (e.key === "q" || e.key === "e" || e.key === "Q" || e.key === "E")) {
      recordar();
      girarDos(anguloDos() + (e.key.toLowerCase() === "e" ? 15 : -15));
      guardar();
      pintarElegida();
    } else if (elegida && (e.key === "q" || e.key === "e" || e.key === "Q" || e.key === "E")) {
      recordar();
      let r = (opcionesElegida().rot || 0) + (e.key.toLowerCase() === "e" ? 15 : -15);
      r = ((((r + 180) % 360) + 360) % 360) - 180;
      cambiarElegida("rot", r, r === 0);
      guardar();
      pintarElegida();
    }
    if (e.key === "4") ponerHerr("camino");
    if (e.key === "5") ponerHerr("nota");
    if (e.key === "6") ponerHerr("agua");
    const trazando = camino || rio;
    if ((e.key === "Enter" || e.key === "Escape") && rio) terminarRio();
    else if (e.key === "Enter" && camino) terminarCamino();
    if (e.key === "Escape" && trazando) camino && terminarCamino();
    else if (e.key === "Escape") {
      elegirAgua(null);
      elegido = null;
      pegarA = null;
      soltarElegida();
      lista.querySelectorAll(".obj").forEach((x) => x.classList.remove("elegido"));
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") deshacer();
    if ((e.key === "Delete" || e.key === "Backspace") && rio) {
      rio.p.pop();
      if (!rio.p.length) rio = null;
    } else if ((e.key === "Delete" || e.key === "Backspace") && aguaSel) sacarAgua(aguaSel);
    else if ((e.key === "Delete" || e.key === "Backspace") && camino) {
      camino.p.pop();
      if (!camino.p.length) camino = null;
    } else if (e.key === "Delete" || e.key === "Backspace") ponerHerr("borrar");
  });
  addEventListener("keyup", (e) => {
    if (e.code === "Space") espacio = false;
    teclas[e.code] = false;
  });
  setInterval(() => {
    const v = 14 / cam.z;
    if (teclas.KeyW || teclas.ArrowUp) cam.y -= v;
    if (teclas.KeyS || teclas.ArrowDown) cam.y += v;
    if (teclas.KeyA || teclas.ArrowLeft) cam.x -= v;
    if (teclas.KeyD || teclas.ArrowRight) cam.x += v;
  }, 16);
  function deshacer() {
    const s = historial.pop();
    if (!s) return;
    est = JSON.parse(s);
    soltarElegida();
    camElegido = null;
    aguaSel = null;
    guardar();
  }
  $("bDeshacer").onclick = deshacer;

  // ---------- ir a un lugar ----------
  const ir = $("ir");
  const corto = (s) => (s.length > 40 ? s.slice(0, 39) + "…" : s);
  function armarIr() {
    const notas = est.notas.length ? `<optgroup label="${t("ed.notas")}">` + est.notas.map((n, i) => `<option value="nota${i}">${i + 1}. ${corto(n.texto || "…").replace(/</g, "&lt;")}</option>`).join("") + "</optgroup>" : "";
    const hist =
      `<optgroup label="${t("ed.historia_grupo")}">` +
      [...nombradas.keys()]
        .map((o, i) => ({ o, i, n: t("as." + o.id) }))
        .sort((a, b) => a.n.localeCompare(b.n))
        .map((h) => `<option value="hist${h.i}">${h.n} · ${nombradas.get(h.o)}</option>`)
        .join("") +
      "</optgroup>";
    ir.innerHTML = `<option value="">${t("ed.ir")}</option>` + notas + `<option value="ciudad">${t("av.lugar_eikholt")}</option>` + Object.keys(W.LUGARES).filter((k) => t("av.lugar_" + k) !== "av.lugar_" + k).map((k) => `<option value="${k}">${t("av.lugar_" + k)}</option>`).join("") + hist;
  }
  ir.addEventListener("change", () => {
    const k = ir.value;
    if (!k) return;
    let n = k.startsWith("nota") ? est.notas[+k.slice(4)] : null;
    if (k.startsWith("hist")) {
      const o = [...nombradas.keys()][+k.slice(4)],
        m = movidos.has(o) ? est.mover[movidos.get(o)] : null;
      n = m ? { x: m.nx, y: m.ny } : o;
    }
    const p = n ? [n.x, n.y] : k === "ciudad" ? W.CIUDAD.c : W.LUGARES[k].p;
    cam.x = p[0];
    cam.y = p[1];
    cam.z = n ? Math.max(cam.z, 0.25) : k === "ciudad" ? 0.12 : 0.3;
    ir.value = "";
    cv.focus();
  });

  // ---------- archivo ----------
  function texto() {
    const lineas = (l) => (l.length ? "\n    " + l.map((a) => JSON.stringify(a)).join(",\n    ") + ",\n  " : "");
    return (
      "// Lo que se agregó o se sacó del mundo con el editor de Eldervald (editor.html). Este archivo lo escribe el editor\n" +
      "// con «Descargar agregados.js»: se guarda acá, en aventura/js/mundo/, y el mundo lo aplica al armarse.\n" +
      "window.AGREGADOS = {\n  poner: [" + lineas(est.poner) + "],\n  quitar: [" + lineas(est.quitar) + "],\n  mover: [" + lineas(est.mover) + "],\n  quitarDeco: [" + lineas(est.quitarDeco) + "],\n  caminos: [" + lineas(est.caminos) + "],\n  quitarCaminos: [" + est.quitarCaminos.join(", ") + "],\n  estiloCaminos: [" + lineas(est.estiloCaminos) + "],\n  rios: [" + lineas(est.rios) + "],\n  lagos: [" + lineas(est.lagos) + "],\n  quitarRios: [" + est.quitarRios.join(", ") + "],\n  quitarLagos: [" + est.quitarLagos.join(", ") + "],\n  // notas para Claude: qué hacer en ese lugar (el juego no las usa)\n  notas: [" + lineas(est.notas) + "],\n};\n" +
      "// ?borrador=1: el juego usa lo que está armado en el editor de este navegador, sin descargar nada\n" +
      "try {\n  if (/[?&]borrador=1/.test(location.search)) {\n    const b = JSON.parse(localStorage.getItem(\"" + CLAVE + "\") || \"null\");\n    if (b && b.poner) window.AGREGADOS = b;\n  }\n} catch (e) {}\n"
    );
  }
  $("bDescargar").onclick = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([texto()], { type: "text/javascript" }));
    a.download = "agregados.js";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  $("bCopiar").onclick = () => {
    const s = texto();
    const ok = () => avisar(t("ed.copiado"));
    try {
      navigator.clipboard.writeText(s).then(ok, () => copiarViejo(s, ok));
    } catch (e) {
      copiarViejo(s, ok);
    }
  };
  function copiarViejo(s, ok) {
    const ta = document.createElement("textarea");
    ta.value = s;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      ok();
    } catch (e) {}
    ta.remove();
  }
  $("bCargar").onclick = () => $("archivo").click();
  $("archivo").addEventListener("change", () => {
    const f = $("archivo").files[0];
    if (!f) return;
    f.text().then((s) => {
      try {
        const i = s.indexOf("{", s.indexOf("AGREGADOS")),
          j = s.indexOf("\n};", i);
        const cuerpo = s.slice(i, j + 2).replace(/(\w+):/g, (m, k) => (k === "poner" || k === "quitar" || k === "mover" || k === "quitarDeco" || k === "caminos" || k === "quitarCaminos" || k === "estiloCaminos" || k === "rios" || k === "lagos" || k === "quitarRios" || k === "quitarLagos" || k === "notas" || k === "p" || k === "w" ? '"' + k + '":' : m)).replace(/\n\s*\/\/[^\n]*/g, "").replace(/,(\s*[\]}])/g, "$1");
        const nuevo = JSON.parse(cuerpo);
        if (!nuevo.poner) throw 0;
        if (!nuevo.notas) nuevo.notas = [];
        if (!nuevo.caminos) nuevo.caminos = [];
        if (!nuevo.quitarCaminos) nuevo.quitarCaminos = [];
        if (!nuevo.estiloCaminos) nuevo.estiloCaminos = [];
        if (!nuevo.mover) nuevo.mover = [];
        if (!nuevo.quitarDeco) nuevo.quitarDeco = [];
        completar(nuevo);
        recordar();
        est = nuevo;
        guardar();
        avisar(t("ed.archivo_ok"));
      } catch (e) {
        avisar(t("ed.archivo_mal"));
      }
      $("archivo").value = "";
    });
  });
  $("bProbar").onclick = () => {
    guardar();
    open("index.html?borrador=1&jugar=1" + (params.get("lang") ? "&lang=" + params.get("lang") : ""), "_blank");
  };
  $("bLimpiar").onclick = () => {
    if (!confirm(t("ed.limpiar_seguro"))) return;
    recordar();
    est = { poner: [], quitar: [], mover: [], quitarDeco: [], caminos: [], quitarCaminos: [], estiloCaminos: [], rios: [], lagos: [], quitarRios: [], quitarLagos: [], notas: [] };
    guardar();
  };

  let avisoT = 0;
  function avisar(s) {
    const a = $("aviso");
    a.textContent = s;
    a.classList.add("ver");
    clearTimeout(avisoT);
    avisoT = setTimeout(() => a.classList.remove("ver"), 2600);
  }

  armarLista();
  guardar();
  requestAnimationFrame(dibujar);
  window.EDITOR = { est: () => est, cam, ponerHerr, elegir: (id) => (elegido = id) };
})();
