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
  let est = { poner: [], quitar: [], mover: [], caminos: [], notas: [] };
  try {
    const b = JSON.parse(localStorage.getItem(CLAVE) || "null");
    if (b && b.poner) est = b;
    else if (window.AGREGADOS) est = JSON.parse(JSON.stringify(window.AGREGADOS));
  } catch (e) {
    if (window.AGREGADOS) est = JSON.parse(JSON.stringify(window.AGREGADOS));
  }
  if (!est.notas) est.notas = [];
  if (!est.caminos) est.caminos = [];
  if (!est.mover) est.mover = [];
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
    if (!est.mover) est.mover = [];
    armarMovidos();
    $("cuenta").textContent = t("ed.cuenta", [est.poner.length, est.quitar.length]) + " · " + t("ed.cuenta_mas", [est.mover.length, est.caminos.length, est.notas.length]);
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
      if (movidos.has(o) || o.x < x0 - 320 || o.x > x1 + 320 || o.y < y0 - 40 || o.y - o.alto * 1.2 > y1 || sacado(o)) return;
      l.push({ id: o.id, x: o.x, y: o.y, o: o.o, alto: o.alto, choque: o.choque, cosa: o, piso: !!o.o.piso });
    });
    movidos.forEach((i, o) => {
      const m = est.mover[i];
      if (!m || m.nx < x0 - 400 || m.nx > x1 + 400 || m.ny < y0 - 60 || m.ny > y1 + 900) return;
      const op = Object.assign({}, o.o);
      if (op.x2 !== undefined) (op.x2 += m.nx - o.x), (op.y2 += m.ny - o.y);
      l.push({ id: o.id, x: m.nx, y: m.ny, o: op, alto: o.alto, choque: o.choque, cosa: o, movido: i, piso: !!o.o.piso });
    });
    est.poner.forEach((a, i) => {
      const def = ASSETS.LISTA[a.id];
      if (!def || a.x < x0 - 400 || a.x > x1 + 400 || a.y < y0 - 60 || a.y > y1 + 900) return;
      const o = opcionesDe(a),
        s = o.s || 1;
      l.push({ id: a.id, x: a.x, y: a.y, o, alto: def.alto * s, choque: def.choque ? (def.choque.r ? { r: def.choque.r * s } : { w: def.choque.w * s, h: def.choque.h * s }) : null, agregado: i, piso: !!def.piso });
    });
    return l;
  }
  let tPrev = performance.now(),
    tt = 0;
  function dibujar() {
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
    const lejos = cam.z < 0.07;
    if (lejos || !croquis.complete) {
      if (croquis.complete && croquis.naturalWidth) c.drawImage(croquis, 0, 0, W.ANCHO, W.ALTO);
    } else {
      // el piso cacheado a dos resoluciones fijas, para no repintarlo en cada zoom
      W.dibujarPiso(c, x0, y0, x1, y1, cam.z < 0.25 ? 0.2 : 0.5);
    }
    // los caminos nuevos, pintados como los del juego (tierra pisada, borde oscuro, centro gastado)
    const trazoC = (pts, w, col) => {
      c.strokeStyle = col;
      c.lineWidth = w;
      c.lineCap = c.lineJoin = "round";
      c.beginPath();
      pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.stroke();
    };
    const caminoAhora = camino && cursor ? { p: camino.p.concat([[cursor.x, cursor.y]]), w: camino.w } : null;
    est.caminos.concat(caminoAhora ? [caminoAhora] : []).forEach((cm) => {
      const w = lejos ? Math.max(cm.w, 6 / cam.z) : cm.w;
      trazoC(cm.p, w + 26, "#3A3022");
      trazoC(cm.p, w, "#5C4A32");
      trazoC(cm.p, w * 0.5, "#6A563A");
    });
    if (camino) {
      c.fillStyle = "#FFD98A";
      camino.p.forEach(([x, y]) => {
        c.beginPath();
        c.arc(x, y, 6 / cam.z, 0, Math.PI * 2);
        c.fill();
      });
    }
    if (!lejos) {
      const lista = visibles(x0, y0, x1, y1);
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
        if (!nombradas.has(d.cosa)) return;
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
      const h = cursor && !arrastre && !sel ? tocado(cursor.x, cursor.y) : null;
      if (h && (nombradas.has(h.cosa) || $("historia").checked)) etiqueta(h);
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

  // ---------- los caminos: clic en cada punto, doble clic, Enter o Esc lo termina; el ancho sale del tamaño ----------
  let camino = null;
  function terminarCamino() {
    if (camino && camino.p.length >= 2) {
      recordar();
      est.caminos.push({ p: camino.p, w: camino.w });
      guardar();
    }
    camino = null;
  }
  const distSeg = (px, py, ax, ay, bx, by) => {
    const dx = bx - ax,
      dy = by - ay,
      l = dx * dx + dy * dy,
      k = l ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l)) : 0;
    return Math.hypot(px - ax - dx * k, py - ay - dy * k);
  };
  function caminoEn(x, y) {
    for (let i = est.caminos.length - 1; i >= 0; i--) {
      const cm = est.caminos[i];
      for (let k = 1; k < cm.p.length; k++) if (distSeg(x, y, cm.p[k - 1][0], cm.p[k - 1][1], cm.p[k][0], cm.p[k][1]) < cm.w / 2 + 10 / cam.z) return i;
    }
    return -1;
  }
  cv.addEventListener("dblclick", () => herr === "camino" && terminarCamino());

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
    herr = h;
    $("hCamino").classList.toggle("activo", h === "camino");
    $("hPoner").classList.toggle("activo", h === "poner");
    $("hMover").classList.toggle("activo", h === "mover");
    $("hBorrar").classList.toggle("activo", h === "borrar");
    $("hNota").classList.toggle("activo", h === "nota");
    cv.style.cursor = h === "poner" ? "crosshair" : h === "mover" ? "grab" : h === "nota" ? "copy" : h === "camino" ? "cell" : "not-allowed";
  }
  $("hPoner").onclick = () => ponerHerr("poner");
  $("hMover").onclick = () => ponerHerr("mover");
  $("hBorrar").onclick = () => ponerHerr("borrar");
  $("hNota").onclick = () => ponerHerr("nota");
  $("hCamino").onclick = () => ponerHerr("camino");
  $("escala").addEventListener("input", () => ($("escalaV").textContent = (+$("escala").value).toFixed(2)));
  const dosPuntos = (id) => (ASSETS.EJEMPLO[id] || {}).x2 !== undefined;
  function nuevasOpciones() {
    const o = { s: +$("escala").value, sem: +$("variante").value || 0, v: +$("variante").value || 0 };
    if ($("espejo").checked) o.espejo = true;
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
    } else if (sel && sel.nota != null) {
      const n = est.notas[sel.nota];
      if (Math.hypot(x - sel.x0, y - sel.y0) > 6 / cam.z) sel.movio = true;
      n.x = r1(x - sel.dx);
      n.y = r1(y - sel.dy);
    } else if (sel && sel.mueve && sel.d.movido != null) {
      const m = est.mover[sel.d.movido];
      m.nx = r1(x - sel.dx);
      m.ny = r1(y - sel.dy);
    } else if (sel && sel.mueve) {
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
    if (herr === "camino") {
      const p = [r1(x), r1(y)];
      if (!camino) camino = { p: [p], w: r1(110 * +$("escala").value) };
      else {
        const u = camino.p[camino.p.length - 1];
        if (Math.hypot(u[0] - p[0], u[1] - p[1]) > 8 / cam.z) camino.p.push(p);
      }
      return;
    }
    if (herr === "borrar" && caminoEn(x, y) >= 0) {
      const d = tocado(x, y);
      if (!d || d.agregado == null) {
        recordar();
        est.caminos.splice(caminoEn(x, y), 1);
        guardar();
        return;
      }
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
        est.poner.push({ id: elegido, x: r1(x), y: r1(y), o: nuevasOpciones() });
        guardar();
        arrastre = null;
      }
    } else if (herr === "mover") {
      const d = tocado(x, y);
      if (!d) return;
      recordar();
      if (d.agregado == null && d.movido == null) {
        // mover algo del mundo (también lo de la historia): queda anotado dónde estaba y adónde va, y el juego lo
        // corre en el lugar (con la gente y los objetivos que tiene al lado)
        est.mover.push({ id: d.id, x: r1(d.cosa.x), y: r1(d.cosa.y), nx: r1(d.x), ny: r1(d.y) });
        d.movido = est.mover.length - 1;
        movidos.set(d.cosa, d.movido);
      }
      sel = { d, dx: x - d.x, dy: y - d.y, mueve: true };
      cv.style.cursor = "grabbing";
    } else if (herr === "borrar") {
      const d = tocado(x, y);
      if (!d) return;
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
      est.poner.push({ id: elegido, x: r1(arrastre.x), y: r1(arrastre.y), o });
      guardar();
    }
    if (sel && sel.nota != null) {
      if (sel.movio) guardar();
      else {
        historial.pop();
        abrirNota(sel.nota);
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
    if (e.key === "4") ponerHerr("camino");
    if (e.key === "5") ponerHerr("nota");
    if (e.key === "Enter" && camino) terminarCamino();
    if (e.key === "Escape" && camino) terminarCamino();
    else if (e.key === "Escape") {
      elegido = null;
      lista.querySelectorAll(".obj").forEach((x) => x.classList.remove("elegido"));
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") deshacer();
    if ((e.key === "Delete" || e.key === "Backspace") && camino) {
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
      "window.AGREGADOS = {\n  poner: [" + lineas(est.poner) + "],\n  quitar: [" + lineas(est.quitar) + "],\n  mover: [" + lineas(est.mover) + "],\n  caminos: [" + lineas(est.caminos) + "],\n  // notas para Claude: qué hacer en ese lugar (el juego no las usa)\n  notas: [" + lineas(est.notas) + "],\n};\n" +
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
        const cuerpo = s.slice(i, j + 2).replace(/(\w+):/g, (m, k) => (k === "poner" || k === "quitar" || k === "mover" || k === "caminos" || k === "notas" || k === "p" || k === "w" ? '"' + k + '":' : m)).replace(/\n\s*\/\/[^\n]*/g, "").replace(/,(\s*[\]}])/g, "$1");
        const nuevo = JSON.parse(cuerpo);
        if (!nuevo.poner) throw 0;
        if (!nuevo.notas) nuevo.notas = [];
        if (!nuevo.caminos) nuevo.caminos = [];
        if (!nuevo.mover) nuevo.mover = [];
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
    est = { poner: [], quitar: [], mover: [], caminos: [], notas: [] };
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
