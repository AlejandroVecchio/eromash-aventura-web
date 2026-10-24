// ---------- la mochila (sistema INVENTARIO) ----------
// Se abre con I (Select en el mando, o tocando la casilla de la mochila del HUD). Tres pestañas: Equipo (Eromash con
// su casco, espada, cota o pechera, lámpara y la Lente; las cuatro runas engarzadas, donde se elige la activa, y cómo
// está), Bolsa (plata, fragmentos y lo que lleva para otros por los encargos) y Diario. Se recorre con el mouse, las
// flechas o la palanca; cada casilla muestra abajo su nombre y para qué sirve. También dibuja los íconos de las
// casillas que usa la barra de acciones del HUD (INVENTARIO.icono).
window.INVENTARIO = (function () {
  "use strict";
  let A, J, jug;
  const t = (k, v) => I18N.t(k, v);
  const { P, E, R, L, halo } = DIB;

  // ---------- las piezas de verdad, las mismas de la arena ----------
  // El casco de la E y el vikingo con su equipo salen de pecheras-lib.js (vikingo()), las espadas de
  // eromash-espadas.js y la cota y la pechera de pecheras-lib.js (pecheraItem): nada de dibujos inventados.
  // Las mejoras de Ása suben la pieza de rareza (común → legendaria).
  const ARTE = new Map();
  let version = 0;
  function arte(clave, hacerSvg) {
    let im = ARTE.get(clave);
    if (!im) {
      im = new Image();
      im.onload = () => version++;
      let svg = "";
      try {
        svg = hacerSvg();
      } catch (e) {}
      if (svg) im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      ARTE.set(clave, im);
    }
    return im.complete && im.naturalWidth ? im : null;
  }
  const conMedidas = (svg, w, h) => {
    const abre = svg.slice(0, svg.indexOf(">"));
    return /\bwidth=/.test(abre) ? svg : svg.replace("<svg ", '<svg width="' + w + '" height="' + h + '" ');
  };
  const PE = () => window.EromashPecheras,
    ES = () => window.EromashEspadas;
  const espadaId = (n) => "bastarda-" + Math.min(5, 1 + (n || 0));
  const pecheraDe = (cota, pechera) => {
    if (!PE()) return null;
    const id = pechera ? "costa-aleta-4" : "arena-placa-" + Math.min(5, 1 + (cota || 0));
    return PE().PECHERAS.find((p) => p.id === id) || null;
  };
  // la espada en la mano del vikingo, como la pone la mochila de la arena (eromash-armadura.js, dibujoEspada)
  function manoEspada(n) {
    if (!ES()) return "";
    const s = ES().svg(espadaId(n), { vista: "vertical", sinEstilo: true }),
      m = s.match(/viewBox="([^"]+)"/);
    if (!m) return "";
    const [x, y, w, h] = m[1].split(/\s+/);
    return '<g transform="translate(495 331) rotate(14.3) scale(.786) translate(0 75)">' + s.replace("<svg ", '<svg x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" overflow="visible" ') + "</g>";
  }
  function piezaReal(tipo, n) {
    if (tipo === "casco" && PE())
      return arte("casco", () =>
        PE()
          .vikingo(null, "rojo", "tranquilo")
          .replace(/viewBox="[^"]+"/, 'viewBox="50 88 380 450"')
          .replace(/width="\d+" height="\d+"/, 'width="380" height="450"'),
      );
    if (tipo === "espada" && ES()) return arte("espada" + espadaId(n), () => conMedidas(ES().svg(espadaId(n)), 400, 400));
    if ((tipo === "cota" || tipo === "pechera") && PE()) {
      const p = pecheraDe(n, tipo === "pechera");
      return p ? arte("pechera" + p.id, () => conMedidas(PE().pecheraItem(p), 424, 430)) : null;
    }
    return null;
  }
  // el vikingo entero con la cota o la pechera y la espada que lleva
  function vikingoEquipado(pe) {
    if (!PE()) return null;
    const p = pecheraDe(pe.cota, pe.pechera);
    return arte("vik" + (p ? p.id : "") + espadaId(pe.espada), () => PE().vikingo(p, "rojo", "tranquilo", "", "", manoEspada(pe.espada)));
  }

  // ---------- los íconos (los de la aventura, dibujados con el mismo estilo plano que los assets) ----------
  // icono(c, tipo, x, y, s, n): centrado en (x, y), unos 64 × s de alto; n es el nivel de la pieza (espada, cota)
  function icono(c, tipo, x, y, s, n) {
    s = s || 1;
    const real = piezaReal(tipo, n);
    if (real) {
      const lado = 70 * s,
        k = Math.min(lado / real.naturalWidth, lado / real.naturalHeight);
      c.drawImage(real, x - (real.naturalWidth * k) / 2, y - (real.naturalHeight * k) / 2, real.naturalWidth * k, real.naturalHeight * k);
      return;
    }
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    const madera = "#7A5634",
      maderaS = "#553A22",
      hierro = "#8A8478",
      hierroS = "#5A5458";
    switch (tipo) {
      case "espada":
        c.rotate(-0.78);
        P(c, [-5, -30, 5, -30, 5, 14, 0, 22, -5, 14], "#C8C4BC");
        P(c, [0, -30, 5, -30, 5, 14, 0, 22], "#E8E4DC");
        R(c, -16, 14, 32, 6, "#9C2315");
        R(c, -3, 20, 6, 14, maderaS);
        E(c, 0, 36, 5, 5, "#FFD98A");
        break;
      case "esquivar":
        for (let k = 0; k < 3; k++) L(c, -26 + k * 6, 14 - k * 12, 20 + k * 4, 6 - k * 14, k ? "#E0B2B2" : "#F2ECEC", 5 - k);
        P(c, [12, -20, 28, -14, 14, -4], "#F2ECEC");
        break;
      case "saltar":
        P(c, [0, -28, 18, -6, 7, -6, 7, 16, -7, 16, -7, -6, -18, -6], "#F2ECEC");
        R(c, -20, 22, 40, 5, "#E0B2B2");
        break;
      case "lente":
        L(c, 12, 12, 28, 28, maderaS, 9);
        c.beginPath();
        c.arc(-4, -4, 20, 0, Math.PI * 2);
        c.fillStyle = "rgba(115,213,219,0.25)";
        c.fill();
        c.lineWidth = 6;
        c.strokeStyle = "#C9A45A";
        c.stroke();
        FUTHARK.dibujar(c, "ansuz", -4, 6, 20, "#73D5DB", 3);
        break;
      case "mochila":
        P(c, [-22, -6, 22, -6, 26, 28, -26, 28], "#7A3A24");
        P(c, [-22, -6, 22, -6, 18, -18, -18, -18], "#9C4A2C");
        P(c, [-14, -18, -10, -30, 10, -30, 14, -18], "none");
        c.lineWidth = 4;
        c.strokeStyle = "#5E2A18";
        c.beginPath();
        c.arc(0, -18, 12, Math.PI, 0);
        c.stroke();
        R(c, -24, 4, 48, 6, "#5E2A18");
        R(c, -4, 2, 8, 10, "#C9A45A");
        break;
      case "casco":
        P(c, [-24, 22, -24, -10, -14, -24, 14, -24, 24, -10, 24, 22], "#9C2315");
        P(c, [8, -24, 14, -24, 24, -10, 24, 22, 8, 22], "#C8402D");
        R(c, -16, -10, 32, 6, "#F2ECEC");
        R(c, -16, 2, 24, 6, "#F2ECEC");
        R(c, -16, 14, 32, 6, "#F2ECEC");
        R(c, -16, -10, 6, 30, "#F2ECEC");
        break;
      case "cota":
        P(c, [-16, -26, 16, -26, 28, -16, 24, 26, -24, 26, -28, -16], hierroS);
        for (let yy = -18; yy < 24; yy += 7) for (let xx = -20; xx < 22; xx += 7) E(c, xx + ((yy / 7) % 2) * 3, yy, 2.6, 2.6, hierro);
        P(c, [-8, -26, 8, -26, 0, -16], "#111111");
        break;
      case "pechera":
        P(c, [-16, -26, 16, -26, 28, -16, 24, 26, -24, 26, -28, -16], "#2E4A44");
        for (let yy = -16; yy < 24; yy += 9) for (let xx = -20; xx < 22; xx += 10) P(c, [xx, yy, xx + 5, yy + 8, xx + 10, yy], (xx + yy) % 3 ? "#4A7A6E" : "#73D5DB");
        P(c, [-8, -26, 8, -26, 0, -16], "#111111");
        break;
      case "lampara":
        L(c, 0, -30, 0, -20, hierroS, 3);
        P(c, [-12, -20, 12, -20, 16, 18, -16, 18], hierroS);
        halo(c, 0, 0, 30, "#FFD98A", 0.6);
        P(c, [-8, -14, 8, -14, 10, 12, -10, 12], "#FFD98A");
        P(c, [-4, 4, 0, -10, 4, 4], "#F2ECEC");
        R(c, -18, 18, 36, 6, hierroS);
        break;
      case "plata":
        E(c, 4, 6, 20, 20, "#8A7A5A");
        E(c, 0, 0, 20, 20, "#D8D4CC");
        E(c, 0, 0, 14, 14, "#B8B4AC");
        FUTHARK.dibujar(c, "fehu", 0, 9, 16, "#8A8478", 3);
        break;
      case "fragmento":
        halo(c, 0, 0, 30, "#73D5DB", 0.5);
        P(c, [0, -26, 14, -4, 6, 24, -12, 14, -10, -8], "#2E5A66");
        P(c, [0, -26, 14, -4, 6, 24, 2, 0], "#73D5DB");
        L(c, -4, -8, 4, 6, "#C8F2F4", 2);
        break;
      case "manzana":
        E(c, 0, 4, 20, 19, "#FFD98A");
        E(c, 6, -2, 8, 8, "#FFE8B0");
        L(c, 0, -14, 4, -26, maderaS, 3);
        P(c, [4, -22, 18, -28, 12, -18], "#7BC86C");
        break;
      case "cepillo":
        P(c, [-26, 4, 26, 4, 22, 16, -22, 16], madera);
        P(c, [-18, 4, -10, -12, 4, -12, 10, 4], maderaS);
        P(c, [-6, -12, 6, -12, 2, -22, -2, -22], madera);
        R(c, -4, 14, 14, 3, hierro);
        break;
      case "tablilla":
        P(c, [-18, -24, 18, -24, 18, 24, -18, 24], "#C8A878");
        P(c, [-18, -24, -12, -24, -12, 24, -18, 24], "#A88858");
        FUTHARK.dibujar(c, "othala", 2, 10, 26, "#5E3A1E", 3);
        E(c, 0, -16, 3, 3, "#5E3A1E");
        break;
      case "libro":
        P(c, [-20, -24, 20, -24, 20, 24, -20, 24], "#5E130D");
        P(c, [-14, -20, 20, -20, 20, 20, -14, 20], "#E8DCC0");
        for (let k = 0; k < 4; k++) R(c, -8, -12 + k * 8, 22, 2, "#8A7A5A");
        break;
      case "cinta":
        c.lineWidth = 4;
        c.strokeStyle = "#E0B2B2";
        c.beginPath();
        c.moveTo(-24, -10);
        c.bezierCurveTo(-6, -30, 6, 20, 24, 0);
        c.stroke();
        E(c, -8, 14, 5, 5, madera);
        E(c, 4, 18, 5, 5, maderaS);
        break;
      case "campana":
        P(c, [-6, -24, 6, -24, 10, -14, 18, 14, -18, 14, -10, -14], "#6A8A5E");
        P(c, [2, -24, 6, -24, 10, -14, 18, 14, 6, 14], "#8AAA7A");
        R(c, -20, 14, 40, 5, "#4A6A44");
        E(c, 0, 24, 5, 5, "#4A6A44");
        break;
      case "herrajes":
        c.lineWidth = 7;
        c.strokeStyle = hierroS;
        c.beginPath();
        c.arc(-6, 0, 16, -1.2, 1.4);
        c.stroke();
        c.strokeStyle = hierro;
        c.beginPath();
        c.arc(8, 0, 16, 1.9, 4.6);
        c.stroke();
        break;
      case "pergamino":
        P(c, [-20, -22, 20, -22, 20, 22, -20, 22], "#E8DCC0");
        E(c, -20, 0, 5, 22, "#C8B898");
        E(c, 20, 0, 5, 22, "#C8B898");
        FUTHARK.dibujar(c, "raidho", 0, 10, 24, "#5E3A1E", 3);
        break;
      default:
        E(c, 0, 0, 20, 20, "#3A3634");
    }
    c.restore();
  }

  // ---------- el contenido de cada pestaña ----------
  const RUNAS = ["kenaz", "isa", "algiz", "sowilo"];
  const COL_RUNA = { kenaz: "#FF8D71", isa: "#C8F2F4", algiz: "#FFD98A", sowilo: "#F5A524" };
  const tieneLente = () => A.H.tiene("lente") || A.H.tiene("lente_prestada");
  function equipo(pe) {
    const lados = {
      izq: [
        { id: "casco", icono: "casco", nombre: t("inv.casco"), desc: t("inv.casco_d") },
        pe.pechera ? { id: "pechera", icono: "pechera", nombre: t("inv.pechera"), desc: t("inv.pechera_d"), nivel: "" } : { id: "cota", icono: "cota", nombre: t("inv.cota"), desc: t("inv.cota_d", [pe.cota]), nivel: pe.cota },
        { id: "lampara", icono: "lampara", nombre: t("inv.lampara"), desc: t("inv.lampara_d", [pe.lampara]), nivel: pe.lampara },
      ],
      der: [
        { id: "espada", icono: "espada", nombre: t("inv.espada"), desc: t("inv.espada_d", [pe.espada]), nivel: pe.espada },
        tieneLente() ? { id: "lente", icono: "lente", nombre: t("inv.lente"), desc: t("inv.lente_d", [CONTROLES.glifo("lente")]) } : { id: "lente", icono: "lente", nombre: t("inv.lente"), desc: t("inv.lente_no"), falta: true },
        { id: "manzanas", icono: "manzana", nombre: t("inv.st_manzanas"), desc: t("inv.manzanas_d", [pe.manzanas]), cant: pe.manzanas, falta: !pe.manzanas },
      ],
    };
    const runas = RUNAS.map((r) => {
      const tiene = pe.runas.includes(r);
      return { id: "runa_" + r, runa: r, nombre: t("pj.runa_" + r), desc: tiene ? t("pj.runa_" + r + "_toma") + " " + (pe.runa === r ? t("inv.elegida") + "." : t("inv.elegir_runa")) : t("inv.runa_falta"), falta: !tiene, elegida: pe.runa === r, fn: tiene ? () => PODERES.elegirRuna(r) : null };
    });
    return { lados, runas };
  }
  function bolsa(pe) {
    const l = [
      { id: "plata", icono: "plata", nombre: t("inv.plata"), desc: t("inv.plata_d"), cant: pe.plata },
      { id: "frag", icono: "fragmento", nombre: t("inv.frag"), desc: t("inv.frag_d", [pe.nivel]), cant: pe.frag },
    ];
    const llevas = window.SECUNDARIAS ? SECUNDARIAS.llevas() : [];
    llevas.forEach((o) => l.push({ id: o.id, icono: o.icono, nombre: t("sc.obj_" + o.id), desc: t("sc.obj_" + o.id + "_d"), cant: o.cant }));
    return { l, encargos: llevas.length };
  }
  function stats(pe) {
    const renombre = window.SECUNDARIAS ? SECUNDARIAS.renombre() : 0;
    return [
      [t("inv.st_vida"), Math.round(jug.hpMax)],
      [t("inv.st_dano"), "×" + (J.mulDano || 1).toFixed(2)],
      [t("inv.st_poder"), "×" + (pe.poder || 1).toFixed(2)],
      [t("inv.st_estamina"), jug.staMax],
      [t("inv.st_luz"), "×" + (J.lampara || 1).toFixed(2)],
      [t("inv.st_renombre"), t("sc.renombre_" + renombre)],
      [t("inv.st_proezas"), (window.SECUNDARIAS ? SECUNDARIAS.proezas() : 0) + " / 12"],
    ];
  }

  // ---------- la ventana ----------
  let abierta = false,
    pestana = "equipo",
    celdas = [], // { el, item, fila, col }
    foco = 0;
  const PESTANAS = ["equipo", "bolsa", "diario"];
  let raiz = null;
  function armar() {
    raiz = document.createElement("div");
    raiz.id = "inventario";
    raiz.className = "capa inv oculto";
    raiz.innerHTML = `<div class="inv-caja panel"><header><h2></h2><nav></nav><button class="inv-cerrar" type="button"></button></header><div class="inv-cuerpo"></div><footer><div class="inv-detalle"><b></b><p></p></div><div class="inv-ayuda"></div></footer></div>`;
    document.body.appendChild(raiz);
    raiz.querySelector(".inv-cerrar").addEventListener("click", cerrar);
    raiz.addEventListener("pointerdown", (e) => e.target === raiz && cerrar());
  }
  function celda(item, fila, col, clase) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "inv-celda" + (clase ? " " + clase : "") + (item.falta ? " falta" : "") + (item.elegida ? " elegida" : "");
    const cv = document.createElement("canvas");
    cv.width = 128;
    cv.height = 128;
    el.appendChild(cv);
    const c = cv.getContext("2d");
    if (item.runa) {
      c.fillStyle = "#1A1614";
      c.beginPath();
      c.moveTo(64, 8);
      c.lineTo(120, 64);
      c.lineTo(64, 120);
      c.lineTo(8, 64);
      c.closePath();
      c.fill();
      FUTHARK.dibujar(c, item.runa, 64, 94, 60, item.falta ? "#3A3634" : COL_RUNA[item.runa], 7);
    } else {
      icono(c, item.icono, 64, 64, 1.5, item.nivel);
      // si la pieza real todavía no cargó, se vuelve a pintar cuando esté
      if (piezaReal(item.icono, item.nivel) === null && ["casco", "espada", "cota", "pechera"].includes(item.icono)) {
        const v = version;
        setTimeout(() => version !== v && abierta && pintar(), 150);
      }
    }
    if (item.cant != null && item.cant !== "") el.insertAdjacentHTML("beforeend", `<span class="cant">${item.cant}</span>`);
    if (item.nivel) el.insertAdjacentHTML("beforeend", `<span class="niv">${t("inv.nivel", [item.nivel])}</span>`);
    const i = celdas.length;
    celdas.push({ el, item, fila, col });
    el.addEventListener("pointerenter", () => enfocar(i));
    el.addEventListener("focus", () => enfocar(i));
    el.addEventListener("click", () => {
      enfocar(i);
      usar();
    });
    return el;
  }
  function pintar() {
    const pe = PODERES.estado();
    if (!pe) return;
    const caja = raiz.querySelector(".inv-caja");
    caja.querySelector("h2").textContent = t("inv.titulo");
    caja.querySelector(".inv-cerrar").textContent = t("inv.cerrar");
    const nav = caja.querySelector("nav");
    nav.innerHTML = "";
    PESTANAS.forEach((p) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "inv-tab" + (p === pestana ? " activa" : "");
      b.textContent = t("inv.tab_" + p);
      b.addEventListener("click", () => cambiar(p));
      nav.appendChild(b);
    });
    caja.querySelector(".inv-ayuda").textContent = t(CONTROLES.mando() ? "inv.ayuda_mando" : "inv.ayuda_teclado");
    const cuerpo = caja.querySelector(".inv-cuerpo");
    cuerpo.innerHTML = "";
    cuerpo.className = "inv-cuerpo " + pestana;
    celdas = [];
    if (pestana === "equipo") {
      const { lados, runas } = equipo(pe);
      const fig = document.createElement("div");
      fig.className = "inv-figura";
      const izq = document.createElement("div"),
        der = document.createElement("div"),
        centro = document.createElement("div");
      izq.className = der.className = "inv-lado";
      centro.className = "inv-centro";
      lados.izq.forEach((it, k) => izq.appendChild(celda(it, k, 0)));
      const cv = document.createElement("canvas");
      cv.width = 300;
      cv.height = 360;
      centro.appendChild(cv);
      const cx = cv.getContext("2d");
      const dib = () => {
        cx.clearRect(0, 0, 300, 360);
        const g = cx.createRadialGradient(150, 200, 10, 150, 200, 170);
        g.addColorStop(0, "rgba(156,35,21,0.35)");
        g.addColorStop(1, "rgba(156,35,21,0)");
        cx.fillStyle = g;
        cx.fillRect(0, 0, 300, 360);
        cx.fillStyle = "rgba(0,0,0,0.45)";
        cx.beginPath();
        cx.ellipse(150, 332, 90, 18, 0, 0, Math.PI * 2);
        cx.fill();
        const v = vikingoEquipado(pe);
        if (v) {
          const k = Math.min(280 / v.naturalWidth, 330 / v.naturalHeight);
          cx.drawImage(v, 150 - (v.naturalWidth * k) / 2, 345 - v.naturalHeight * k, v.naturalWidth * k, v.naturalHeight * k);
        } else {
          const img = VIKINGO.imagen("R", "S", "calm");
          if (img.complete) cx.drawImage(img, 40, 40, 220, 264);
        }
      };
      dib();
      if (!vikingoEquipado(pe)) setTimeout(dib, 200);
      lados.der.forEach((it, k) => der.appendChild(celda(it, k, 2)));
      fig.append(izq, centro, der);
      const rr = document.createElement("div");
      rr.className = "inv-runas";
      rr.innerHTML = `<div class="rotulo">${t("inv.runas")}</div>`;
      const fila = document.createElement("div");
      fila.className = "fila";
      runas.forEach((it, k) => fila.appendChild(celda(it, 3, k, "runa")));
      rr.appendChild(fila);
      const izqCol = document.createElement("div");
      izqCol.className = "inv-col";
      izqCol.append(fig, rr);
      const st = document.createElement("div");
      st.className = "inv-stats";
      st.innerHTML = `<div class="rotulo">${t("inv.stats")}</div>` + stats(pe).map(([k, v]) => `<div class="st"><span>${k}</span><b>${v}</b></div>`).join("");
      cuerpo.append(izqCol, st);
    } else if (pestana === "bolsa") {
      const { l, encargos } = bolsa(pe);
      const g = document.createElement("div");
      g.className = "inv-rejilla";
      l.forEach((it, k) => g.appendChild(celda(it, Math.floor(k / 6), k % 6)));
      cuerpo.appendChild(g);
      if (!encargos) cuerpo.insertAdjacentHTML("beforeend", `<p class="inv-nota">${t("inv.bolsa_vacia")}</p>`);
    } else {
      cuerpo.innerHTML = J.htmlDiario ? J.htmlDiario() : "";
    }
    foco = Math.min(foco, Math.max(0, celdas.length - 1));
    enfocar(foco);
  }
  function enfocar(i) {
    if (!celdas.length) {
      detalle(null);
      return;
    }
    foco = Math.max(0, Math.min(celdas.length - 1, i));
    celdas.forEach((q, k) => q.el.classList.toggle("foco", k === foco));
    detalle(celdas[foco].item);
  }
  function detalle(it) {
    const d = raiz.querySelector(".inv-detalle");
    d.querySelector("b").textContent = it ? it.nombre : "";
    d.querySelector("p").textContent = it ? it.desc : "";
  }
  function usar() {
    const q = celdas[foco];
    if (q && q.item.fn) {
      q.item.fn();
      pintar();
    }
  }
  function cambiar(p) {
    pestana = p;
    foco = 0;
    pintar();
  }
  function abrir(p) {
    if (!raiz || !PODERES.estado()) return;
    if (J.modo !== "juego" && J.modo !== "menu") return;
    HUD.cerrar();
    abierta = true;
    J.modo = "menu";
    pestana = p || pestana;
    foco = 0;
    raiz.classList.remove("oculto");
    pintar();
  }
  function cerrar() {
    if (!abierta) return;
    abierta = false;
    raiz.classList.add("oculto");
    J.modo = "juego";
    CONTROLES.soltar();
  }
  // un paso con el teclado o el mando mientras está abierta (lo llama el motor cada cuadro)
  let ejeAntes = "";
  function paso() {
    if (!abierta) return false;
    if (CONTROLES.recien("inventario") || CONTROLES.recien("pausa") || CONTROLES.recien("diario")) {
      cerrar();
      return true;
    }
    const i = PESTANAS.indexOf(pestana);
    if (CONTROLES.recien("esquivar") || CONTROLES.recien("runa")) cambiar(PESTANAS[(i + (CONTROLES.recien("runa") ? 1 : PESTANAS.length - 1)) % PESTANAS.length]);
    if (CONTROLES.recien("cambiarRuna")) cambiar(PESTANAS[(i + 1) % PESTANAS.length]);
    const e = CONTROLES.eje(),
      dir = e.x > 0.5 ? "d" : e.x < -0.5 ? "i" : e.y > 0.5 ? "b" : e.y < -0.5 ? "a" : "";
    if (dir && dir !== ejeAntes && celdas.length) mover(dir);
    ejeAntes = dir;
    if (CONTROLES.recien("interactuar") || CONTROLES.recien("seguir")) usar();
    return true;
  }
  // moverse por las casillas: a la más cercana en esa dirección (según dónde están en la pantalla)
  function mover(dir) {
    const r0 = celdas[foco].el.getBoundingClientRect(),
      x0 = r0.left + r0.width / 2,
      y0 = r0.top + r0.height / 2;
    let mejor = -1,
      dm = Infinity;
    celdas.forEach((q, k) => {
      if (k === foco) return;
      const r = q.el.getBoundingClientRect(),
        x = r.left + r.width / 2,
        y = r.top + r.height / 2,
        dx = x - x0,
        dy = y - y0;
      const ok = dir === "d" ? dx > 8 : dir === "i" ? dx < -8 : dir === "b" ? dy > 8 : dy < -8;
      if (!ok) return;
      const d = dir === "d" || dir === "i" ? Math.abs(dx) + Math.abs(dy) * 2.5 : Math.abs(dy) + Math.abs(dx) * 2.5;
      if (d < dm) {
        dm = d;
        mejor = k;
      }
    });
    if (mejor >= 0) enfocar(mejor);
  }

  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      armar();
    },
    alEmpezar() {
      if (abierta) cerrar();
    },
    actualizar() {
      if (J.modo === "juego" && CONTROLES.recien("inventario")) abrir("equipo");
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { icono, abrir, cerrar, paso, abierta: () => abierta, version: () => version };
})();
