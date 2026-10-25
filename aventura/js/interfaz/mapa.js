// ---------- el mapa de Eldervald (sistema MAPA) ----------
// Se abre con su tecla (M · panel táctil). Lo no explorado queda tapado: el bosque se descubre caminándolo.
// Muestra los lugares descubiertos, las piedras despiertas, los altares, los cofres vistos y el objetivo.
window.MAPA = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const CEL = 600;
  let GW = 0,
    GH = 0,
    vista = null, // Uint8Array de celdas vistas
    st = null,
    base = null,
    paso = 0;
  const ANCHO_MAPA = 1000;

  function pintarBase(ancho) {
    const k = ancho / W.ANCHO,
      h = Math.round(W.ALTO * k);
    const cv = document.createElement("canvas");
    cv.width = ancho;
    cv.height = h;
    const c = cv.getContext("2d");
    c.fillStyle = "#1E2019";
    c.fillRect(0, 0, ancho, h);
    c.scale(k, k);
    // el bosque: verde oscuro con arbolitos dibujados, para que se lea como bosque
    c.fillStyle = "#1E2C1B";
    c.fillRect(W.BORDE, W.BORDE * 0.5, W.ANCHO - W.BORDE * 2, W.ALTO - W.BORDE * 1.5);
    const enClaro = (x, y) => {
      for (const id in W.LUGARES) {
        const L = W.LUGARES[id];
        if (Math.hypot(x - L.p[0], (y - L.p[1]) * 1.15) < L.r * 1.25 + 120) return true;
      }
      return Math.hypot(x - W.CIUDAD.c[0], (y - W.CIUDAD.c[1]) * (W.CIUDAD.rx / W.CIUDAD.ry)) < W.CIUDAD.rx + 200;
    };
    const paso = Math.max(180, Math.round(W.ANCHO / ancho) * 9);
    const ra = DIB.azar(77);
    for (let y = W.BORDE * 0.5; y < W.ALTO - W.BORDE; y += paso)
      for (let x = W.BORDE; x < W.ANCHO - W.BORDE; x += paso) {
        const px = x + (ra() - 0.5) * paso * 0.8,
          py = y + (ra() - 0.5) * paso * 0.8;
        if (enClaro(px, py)) continue;
        const d = W.ruido(px, py),
          h = paso * (0.8 + d * 0.5);
        c.fillStyle = d > 0.6 ? "#132015" : "#18261A";
        c.beginPath();
        c.moveTo(px, py - h);
        c.lineTo(px + h * 0.45, py + h * 0.2);
        c.lineTo(px - h * 0.45, py + h * 0.2);
        c.fill();
        c.fillStyle = d > 0.6 ? "#22381F" : "#2A4226";
        c.beginPath();
        c.moveTo(px, py - h);
        c.lineTo(px + h * 0.45, py + h * 0.2);
        c.lineTo(px + h * 0.1, py + h * 0.1);
        c.fill();
      }
    // los claros: pasto claro con el borde suave
    for (const id in W.LUGARES) {
      const L = W.LUGARES[id];
      [[1.45, "#3A5228"], [1.2, "#4E6A32"], [0.95, "#5E7A3A"]].forEach(([k, col]) => {
        c.fillStyle = col;
        c.beginPath();
        c.ellipse(L.p[0], L.p[1], L.r * k + 80, (L.r * k + 80) * 0.87, 0, 0, Math.PI * 2);
        c.fill();
      });
    }
    const trazo = (pts, w, col) => {
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      pts.forEach((p) => c.lineTo(p[0], p[1]));
      c.strokeStyle = col;
      c.lineWidth = w;
      c.lineJoin = "round";
      c.lineCap = "round";
      c.stroke();
    };
    W.LAGOS.forEach((l) => {
      if (l.seco) return;
      c.fillStyle = "#2E5A66";
      c.beginPath();
      c.ellipse(l.p[0], l.p[1], l.rx, l.ry, 0, 0, Math.PI * 2);
      c.fill();
    });
    W.RIOS.forEach((r) => !r.seco && W.tramosAgua(r).forEach((tr) => trazo(tr.p, tr.w, "#2E5A66")));
    trazo(W.QUEBRADA.p, W.QUEBRADA.w, "#141410");
    // caminos: tierra clara con borde oscuro, bien marcados
    W.CAMINOS.forEach((r) => trazo(r.p, Math.max(200, r.w * 1.3), "#2A2016"));
    W.CAMINOS.forEach((r) => trazo(r.p, Math.max(130, r.w * 0.85), "#C2A472"));
    W.PUENTES.forEach((p) => trazo([p.a, p.b], 160, "#B89A6E"));
    // Eikholt
    const C0 = W.CIUDAD;
    c.fillStyle = "#4E4232";
    c.beginPath();
    c.ellipse(C0.c[0], C0.c[1], C0.rx, C0.ry, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#E0B2B2";
    c.lineWidth = 90;
    c.stroke();
    return cv;
  }
  // la niebla de lo no explorado, a la escala del mapa grande: negra con agujeros suaves donde ya caminaste.
  // Se arma entera al cargar la partida y después solo se le abren los agujeros nuevos.
  let niebla = null;
  function agujero(x, y) {
    const n = niebla.getContext("2d"),
      k = niebla.width / W.ANCHO,
      r = CEL * k * 1.25,
      px = (x + 0.5) * CEL * k,
      py = (y + 0.5) * CEL * k,
      g = n.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.55, "rgba(0,0,0,0.9)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    n.globalCompositeOperation = "destination-out";
    n.fillStyle = g;
    n.fillRect(px - r, py - r, r * 2, r * 2);
  }
  function armarNiebla() {
    niebla = document.createElement("canvas");
    niebla.width = ANCHO_MAPA;
    niebla.height = Math.round(W.ALTO * (ANCHO_MAPA / W.ANCHO));
    const n = niebla.getContext("2d");
    n.fillStyle = "#111111";
    n.fillRect(0, 0, niebla.width, niebla.height);
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (vista[y * GW + x]) agujero(x, y);
  }
  function marcar(px = jug.x, py = jug.y, r = 2) {
    const cx = Math.floor(px / CEL),
      cy = Math.floor(py / CEL);
    let cambio = false;
    for (let y = cy - r; y <= cy + r; y++)
      for (let x = cx - r; x <= cx + r; x++) {
        if (x < 0 || y < 0 || x >= GW || y >= GH || (x - cx) ** 2 + (y - cy) ** 2 > r * r + 1) continue;
        const i = y * GW + x;
        if (!vista[i]) {
          vista[i] = 1;
          cambio = true;
          if (niebla) agujero(x, y);
        }
      }
    if (cambio) st.v = Array.from(vista).join("");
  }
  const visto = (x, y) => vista[Math.floor(y / CEL) * GW + Math.floor(x / CEL)] === 1;
  // cuánto del bosque ya se caminó (de 0 a 1), contando solo las celdas de adentro del borde
  function explorado() {
    let n = 0,
      v = 0;
    const b = Math.floor(W.BORDE / CEL);
    for (let y = b; y < GH - b; y++)
      for (let x = b; x < GW - b; x++) {
        n++;
        v += vista[y * GW + x];
      }
    return n ? v / n : 0;
  }
  // la zona de un mapa del tesoro: un círculo dorado punteado con una X en el medio
  function zonaTesoro(c, px, py, r) {
    c.save();
    c.setLineDash([4, 4]);
    c.strokeStyle = "#FFD98A";
    c.lineWidth = 2;
    c.beginPath();
    c.arc(px, py, r, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
    const x = Math.max(4, r * 0.35);
    c.lineWidth = 4;
    c.strokeStyle = "#111111";
    c.beginPath();
    c.moveTo(px - x, py - x);
    c.lineTo(px + x, py + x);
    c.moveTo(px + x, py - x);
    c.lineTo(px - x, py + x);
    c.stroke();
    c.lineWidth = 2.2;
    c.strokeStyle = "#FFD98A";
    c.stroke();
    c.restore();
  }


  // ---------- las miniaturas ----------
  // Recorre todo lo que tiene miniatura en el mapa: lugares, estructuras, campamentos, puentes, piedras, altares,
  // cofres y manzanos. fn(tipo, x, y, op, prioridad) · prioridad 0 = lugar grande … 3 = cosa chica.
  const TIPO_LUGAR = { puesto: "puesto", refugio: "casa", casa_lindes: "casa", eikholt: "ciudad", paso: "paso", claro: "claro", aserradero: "aserradero", santuario: "santuario", brunvik: "casa", skarnholt: "salon", tumulo: "tumulo", caravana: "caravana", torre: "torre", carro: "caravana" };
  // lo que ya se completó (cofre abierto, piedra leída, rito hecho, campamento limpio, lugar resuelto) va gris y
  // más chico, y se dibuja antes que lo pendiente para que lo que falta quede arriba
  const HECHO_LUGAR = { carro: "carro_visto", claro: "ciervo_vencido", santuario: "calco_entregado", paso: "puente_reparado" };
  const HECHO_UNICO = { caravana: "hrungnir" };
  const ACHICAR = 0.6;
  let totems = null;
  const grupoDe = (o) => {
    if (!window.HORDAS) return null;
    let mejor = null,
      dm = 1e9;
    for (const g of HORDAS.grupos) {
      const d = Math.hypot(g.centro[0] - (o.x - 60), g.centro[1] - (o.y + 40));
      if (d < dm) (dm = d), (mejor = g);
    }
    return dm < 40 ? mejor : null;
  };
  const unicoMuerto = (id) => window.HORDAS && HORDAS.grupos.some((g) => g.unico === id && g.miembros.some((e) => e.lider && e.muerto > 0));
  const limpio = (g) => g && g.miembros.every((e) => e.muerto > 0);
  // las clases de marca: así se filtran en el mapa grande y se nombran en la leyenda (mp.ley_<clase>)
  const CAT_DE = { campamento: "campamento", puente: "puente", altar: "altar", piedra: "piedra", piedraCamino: "camino", cofre: "cofre", manzano: "manzano", mistico: "mistico", manantial: "manantial", mazmorra: "zona", barca: "zona", mercader: "mercader", contrato: "contrato", instructor: "instructor", horgr: "dioses", nemesis: "nemesis", bandidos: "bandidos", nido: "nidos", jotunn: "jotunn", vaettr: "vaettir", pesca: "pesca", dados: "dados", libro: "libros", faccion: "facciones", companero: "companero" };
  const CATS = ["lugar", "viaje", "campamento", "altar", "cofre", "piedra", "rito", "camino", "manzano", "mistico", "manantial", "puente", "zona", "mercader", "contrato", "instructor", "dioses", "nemesis", "bandidos", "nidos", "jotunn", "vaettir", "pesca", "dados", "libros", "facciones", "companero"];
  // ícono de muestra de cada clase para la leyenda
  const MUESTRA = { lugar: ["casa", {}], viaje: ["piedra", { runa: "raidho", col: "#C8F2F4" }], campamento: ["campamento", {}], altar: ["altar", { runa: "kenaz", col: "#FF8D71" }], cofre: ["cofre", {}], piedra: ["piedra", { runa: "ansuz", col: "#4E8E92" }], rito: ["piedra", { runa: "isa", col: "#C8F2F4" }], camino: ["piedraCamino", {}], manzano: ["manzano", {}], mistico: ["mistico", { forma: "fresnoEcos" }], manantial: ["manantial", {}], puente: ["puente", {}], zona: ["mazmorra", {}], mercader: ["mercader", {}], contrato: ["contrato", {}], instructor: ["instructor", {}], dioses: ["horgr", { col: "#C8402D" }], nemesis: ["nemesis", {}], bandidos: ["bandidos", {}], nidos: ["nido", {}], jotunn: ["jotunn", {}], vaettir: ["vaettr", {}], pesca: ["pesca", {}], dados: ["dados", {}], libros: ["libro", {}], facciones: ["faccion", { f: "guardia" }], companero: ["companero", {}] };
  const filtro = (cat) => !st || !st.ocultas || !st.ocultas[cat];
  function cadaMarca(fn) {
    const hechas = [],
      pend = [];
    const poner = (tipo, x, y, op, pri) => {
      op.cat = op.cat || CAT_DE[tipo] || "lugar";
      (op.apagado ? hechas : pend).push([tipo, x, y, op, pri]);
    };
    const ban = A.H.E.banderas || {};
    for (const id in TIPO_LUGAR) {
      const L = W.LUGARES[id];
      if (!L || !visto(L.p[0], L.p[1])) continue;
      const hecho = (HECHO_LUGAR[id] && !!ban[HECHO_LUGAR[id]]) || (HECHO_UNICO[id] && unicoMuerto(HECHO_UNICO[id]));
      const conocido = A.H.E.vistos.includes(id),
        sec = conocido && window.EXPLORA ? EXPLORA.secretosDe(id) : null;
      poner(TIPO_LUGAR[id], L.p[0], L.p[1], { nombre: conocido ? t("av.lugar_" + id) : null, tip: sec && sec.n ? t("ex.secretos", [sec.h, sec.n]) : "", apagado: hecho }, 0);
    }
    if (!totems) totems = W.COSAS.filter((o) => o.id === "totemCampamento").map((o) => ({ o, g: grupoDe(o) }));
    totems.forEach(({ o, g }) => visto(o.x, o.y) && poner("campamento", o.x, o.y, { apagado: limpio(g) }, 1));
    W.PUENTES.forEach((p) => {
      const x = (p.a[0] + p.b[0]) / 2,
        y = (p.a[1] + p.b[1]) / 2;
      if (visto(x, y)) poner("puente", x, y, {}, 2);
    });
    const S = SECRETOS.lista();
    S.altares.forEach((a) => visto(a.cosa.x, a.cosa.y) && poner("altar", a.cosa.x, a.cosa.y, { runa: a.runa, col: ASSETS.COL_RUNA[a.runa], apagado: a.cosa.o.tomada }, 1));
    // las despiertas son puntos de viaje: llevan Raidho (el camino) y brillan; las dormidas, Ansuz más tenue
    S.piedras.forEach((p) => visto(p.cosa.x, p.cosa.y) && poner("piedra", p.cosa.x, p.cosa.y, S.st.piedras[p.id] ? { runa: "raidho", col: "#C8F2F4", cat: "viaje" } : { runa: "ansuz", col: "#4E8E92", cat: "piedra" }, 2));
    if (window.RITOS) {
      const R = RITOS.lista();
      R.camino.forEach((p) => visto(p.cosa.x, p.cosa.y) && poner("piedraCamino", p.cosa.x, p.cosa.y, { apagado: !!R.st.camino[p.id] }, 2));
      R.ritos.forEach((r) => {
        const d = ASSETS.RITO[r.tipo];
        r.piedras.forEach((q) => visto(q.x, q.y) && poner("piedra", q.x, q.y, { runa: d.runa, col: d.col, apagado: !!R.st.ritos[r.id], cat: "rito" }, 2));
        if (visto(r.cofre.x, r.cofre.y)) poner("cofre", r.cofre.x, r.cofre.y, { col: r.cofre.o.sellado ? "#9A6BD8" : "#FFD98A", apagado: !!R.st.cofres[r.id] }, 3);
      });
    }
    S.cofres.forEach((q) => {
      if (!visto(q.cosa.x, q.cosa.y) || q.cosa.o.oculto) return;
      poner("cofre", q.cosa.x, q.cosa.y, { apagado: !!S.st.cofres[q.id], col: q.cosa.o.sellado ? "#9A6BD8" : null }, 3);
    });
    S.manzanos.forEach((m) => visto(m.cosa.x, m.cosa.y) && poner("manzano", m.cosa.x, m.cosa.y, { apagado: m.cosa.o.cosechado }, 3));
    // los lugares místicos del bosque vivo (vida.js)
    if (window.VIDA) VIDA.lugares().forEach((l) => visto(l.x, l.y) && poner("mistico", l.x, l.y, { forma: l.id, nombre: t("as." + l.id), apagado: l.hecho }, 1));
    // los manantiales rúnicos que curan y cargan las piedras de Berkano (berkano.js); vacíos, apagados hasta el amanecer
    if (window.BERKANO) BERKANO.manantiales().forEach((m) => visto(m.x, m.y) && poner("manantial", m.x, m.y, { nombre: t("as.manantialRunico"), apagado: m.luz <= 0.01 }, 2));
    // las entradas de las zonas del generador: la boca de cada mazmorra y la barca de cada tierra con islas
    if (window.ZONAS) ZONAS.entradas().forEach((z) => visto(z.x, z.y) && poner(z.tipo === "mazmorra" ? "mazmorra" : "barca", z.x, z.y, { nombre: z.nombre, apagado: z.hecha }, 1));
    // los mercaderes (comercio.js)
    if (window.COMERCIO) COMERCIO.marcas().forEach((m) => visto(m.x, m.y) && poner("mercader", m.x, m.y, { nombre: m.nombre }, 1));
    // lo que marcan otros sistemas: marcasMapa() → [{ tipo, x, y, op }] (los contratos de caza…)
    SISTEMAS.forEach((s0) => s0.marcasMapa && s0.marcasMapa().forEach((m) => visto(m.x, m.y) && poner(m.tipo, m.x, m.y, Object.assign({}, m.op), 1)));
    hechas.forEach((a) => fn(...a));
    pend.forEach((a) => fn(...a));
  }

  // ---------- el mapa grande: zoom, arrastre y la marca propia ----------
  // Pedido de Alejandro (24/10/2026): acercar el mapa (rueda, pellizco o los botones + y −), moverlo arrastrando y
  // marcar un solo lugar u objetivo con un toque; la marca se ve con su propia flecha dorada en el juego y en el
  // minimapa, y se borra tocándola de nuevo, con el botón o al llegar.
  const ZOOM_MAX = 5;
  const vistaMapa = { z: 1, cx: 0, cy: 0 };
  const marca = () => (st && st.marca ? st.marca : null);
  function acotar() {
    vistaMapa.z = Math.max(1, Math.min(ZOOM_MAX, vistaMapa.z));
    const mw = W.ANCHO / vistaMapa.z / 2,
      mh = W.ALTO / vistaMapa.z / 2;
    vistaMapa.cx = Math.max(mw, Math.min(W.ANCHO - mw, vistaMapa.cx));
    vistaMapa.cy = Math.max(mh, Math.min(W.ALTO - mh, vistaMapa.cy));
  }
  // de unidades del mundo a píxeles del lienzo y al revés
  const escala = (cv) => (cv.width / W.ANCHO) * vistaMapa.z;
  const aLienzo = (cv, x, y) => [(x - vistaMapa.cx) * escala(cv) + cv.width / 2, (y - vistaMapa.cy) * escala(cv) + cv.height / 2];
  const aMundo = (cv, px, py) => [(px - cv.width / 2) / escala(cv) + vistaMapa.cx, (py - cv.height / 2) / escala(cv) + vistaMapa.cy];
  function zoomEn(cv, f, px, py) {
    const [wx, wy] = aMundo(cv, px, py);
    vistaMapa.z *= f;
    acotar();
    // que el punto bajo el cursor quede en el mismo lugar
    const [nx, ny] = aLienzo(cv, wx, wy);
    vistaMapa.cx += (nx - px) / escala(cv);
    vistaMapa.cy += (ny - py) / escala(cv);
    acotar();
    dibujar();
  }
  function ponerMarca(x, y) {
    const m = marca();
    if (m && Math.hypot(m[0] - x, m[1] - y) < 260 / Math.sqrt(vistaMapa.z)) st.marca = null;
    else st.marca = [Math.round(x), Math.round(y)];
    dibujar();
    botonQuitar();
  }
  function botonQuitar() {
    const b = document.getElementById("mapaQuitar");
    if (b) b.disabled = !marca();
  }
  function abrir() {
    vistaMapa.z = vistaMapa.z || 1;
    vistaMapa.cx = jug.x;
    vistaMapa.cy = jug.y;
    acotar();
    A.menu(
      `<h2>${t("mp.titulo")}</h2><div class="mapa-cuerpo"><div class="mapa-marco"><canvas id="mapaLienzo" class="mapa"></canvas>` +
        `<div class="mapa-zoom"><button id="mapaMas" aria-label="${t("mp.acercar")}">+</button><button id="mapaMenos" aria-label="${t("mp.alejar")}">−</button></div></div>` +
        `<div id="mapaLeyenda" class="mapa-leyenda"></div></div>` +
        `<div class="sub mapa-ley">${t("mp.ayuda_corta")}</div>`,
      [
        { texto: t("mp.viajar"), fn: () => {
          A.cerrarMenu();
          SECRETOS.viajar();
        } },
        { texto: t("mp.quitar_marca"), id: "mapaQuitar", fn: () => ((st.marca = null), dibujar(), botonQuitar()) },
        { texto: t("ui.cerrar"), fn: A.cerrarMenu },
      ],
    );
    document.getElementById("capaCaja").classList.add("ancha");
    // el botón de quitar: los botones del menú no traen id, se busca por su texto
    document.querySelectorAll("#capaCaja button").forEach((b) => b.textContent === t("mp.quitar_marca") && (b.id = "mapaQuitar"));
    botonQuitar();
    leyenda();
    const cv = document.getElementById("mapaLienzo");
    const enLienzo = (e) => {
      const r = cv.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * cv.width, ((e.clientY - r.top) / r.height) * cv.height];
    };
    document.getElementById("mapaMas").onclick = () => zoomEn(cv, 1.5, cv.width / 2, cv.height / 2);
    document.getElementById("mapaMenos").onclick = () => zoomEn(cv, 1 / 1.5, cv.width / 2, cv.height / 2);
    cv.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const [px, py] = enLienzo(e);
        zoomEn(cv, e.deltaY < 0 ? 1.25 : 0.8, px, py);
      },
      { passive: false },
    );
    // arrastrar mueve, tocar sin moverse marca; con dos dedos se pellizca
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
        const [px, py] = enLienzo(e),
          q = buscarTocable(px, py);
        if (q !== senalado) {
          senalado = q;
          dibujar();
        }
        return;
      }
      const antes = dedos.get(e.pointerId),
        ahora = enLienzo(e);
      dedos.set(e.pointerId, ahora);
      if (dedos.size === 2) {
        const [p, q] = [...dedos.values()],
          d = Math.hypot(p[0] - q[0], p[1] - q[1]);
        if (pellizco > 0) zoomEn(cv, d / pellizco, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
        pellizco = d;
        movido = 99;
        return;
      }
      movido += Math.abs(ahora[0] - antes[0]) + Math.abs(ahora[1] - antes[1]);
      if (movido > 6) {
        vistaMapa.cx -= (ahora[0] - antes[0]) / escala(cv);
        vistaMapa.cy -= (ahora[1] - antes[1]) / escala(cv);
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
        // tocar un ícono dice qué es (y lo marca); tocar en otro lado solo marca
        senalado = buscarTocable(p[0], p[1]);
        ponerMarca(...aMundo(cv, p[0], p[1]));
      }
    };
    cv.addEventListener("pointerup", soltar);
    cv.addEventListener("pointercancel", soltar);
    dibujar();
  }
  function dibujar() {
    const cv = document.getElementById("mapaLienzo");
    if (!cv) return;
    if (!base) base = pintarBase(ANCHO_MAPA);
    if (cv.width !== base.width) {
      cv.width = base.width;
      cv.height = base.height;
    }
    const c = cv.getContext("2d");
    // de cerca, la base grande del minimapa para que no se vea borrosa
    const fondo = vistaMapa.z > 1.6 && baseMini ? baseMini : base;
    const vw = W.ANCHO / vistaMapa.z,
      vh = W.ALTO / vistaMapa.z,
      wx0 = vistaMapa.cx - vw / 2,
      wy0 = vistaMapa.cy - vh / 2;
    c.fillStyle = "#111111";
    c.fillRect(0, 0, cv.width, cv.height);
    const kf = fondo.width / W.ANCHO,
      kn = niebla.width / W.ANCHO;
    c.drawImage(fondo, wx0 * kf, wy0 * kf, vw * kf, vh * kf, 0, 0, cv.width, cv.height);
    c.drawImage(niebla, wx0 * kn, wy0 * kn, vw * kn, vh * kn, 0, 0, cv.width, cv.height);
    const nombres = [],
      zi = Math.min(1.6, 1 + (vistaMapa.z - 1) * 0.15);
    tocables = [];
    cadaMarca((tipo, x, y, op, pri) => {
      if (!filtro(op.cat) || (op.apagado && !(st && st.verHecho) && op.cat !== "lugar")) return;
      const [px, py] = aLienzo(cv, x, y);
      if (px < -20 || py < -20 || px > cv.width + 20 || py > cv.height + 20) return;
      ICONOS.dibujar(c, tipo, px, py, [18, 14, 12, 10][pri] * zi * (op.apagado ? ACHICAR : 1), op);
      if (op.nombre) nombres.push([op.nombre, px, py - 19 * zi]);
      tocables.push({ px, py, r: [18, 14, 12, 10][pri] * zi, texto: (op.nombre || t("mp.ley_" + op.cat)) + (op.tip ? " · " + op.tip : "") + (op.apagado ? " · " + t("mp.hecho") : "") });
    });
    // nombres de los lugares descubiertos
    c.font = '700 13px "Eromash Text", system-ui, sans-serif';
    c.textAlign = "center";
    nombres.forEach(([n, x, y]) => {
      c.lineWidth = 3;
      c.strokeStyle = "#111111";
      c.strokeText(n, x, y);
      c.fillStyle = "#F2ECEC";
      c.fillText(n, x, y);
    });
    // el objetivo y Eromash
    const o = A.H.objetivo();
    const p = o && o.donde ? A.P[o.donde] || (A.npcs[o.donde] && [A.npcs[o.donde].x, A.npcs[o.donde].y]) : null;
    if (p) {
      const [px, py] = aLienzo(cv, p[0], p[1]);
      c.strokeStyle = "#73D5DB";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(px, py, 9, 0, Math.PI * 2);
      c.stroke();
    }
    // los mapas del tesoro encontrados en los arcones: dónde cavar
    if (window.SECRETOS)
      SECRETOS.pistas().forEach((z) => {
        const [px, py] = aLienzo(cv, z.x, z.y),
          [qx] = aLienzo(cv, z.x + z.r, z.y);
        zonaTesoro(c, px, py, Math.max(8, qx - px));
        tocables.push({ px, py, r: Math.max(12, qx - px), texto: t("ex.zona_tesoro") });
      });
    // la marca propia: un banderín dorado
    const mk = marca();
    if (mk) {
      const [px, py] = aLienzo(cv, mk[0], mk[1]);
      c.strokeStyle = "#111111";
      c.lineWidth = 2;
      c.fillStyle = "#FFD98A";
      c.beginPath();
      c.moveTo(px, py);
      c.lineTo(px - 8, py - 14);
      c.arc(px, py - 18, 9, Math.PI * 0.8, Math.PI * 2.2);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = "#111111";
      c.beginPath();
      c.arc(px, py - 18, 3.5, 0, Math.PI * 2);
      c.fill();
    }
    const [jx, jy] = aLienzo(cv, jug.x, jug.y);
    c.save();
    c.translate(jx, jy);
    c.rotate(Math.atan2(jug.dir[1], jug.dir[0]));
    c.fillStyle = "#C8402D";
    c.strokeStyle = "#F2ECEC";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(10, 0);
    c.lineTo(-7, -7);
    c.lineTo(-3, 0);
    c.lineTo(-7, 7);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
    // el nombre de lo que está bajo el puntero (o lo último tocado)
    if (senalado) {
      const tx = senalado.px,
        ty = senalado.py - senalado.r - 12;
      c.font = '700 14px "Eromash Text", system-ui, sans-serif';
      const w = c.measureText(senalado.texto).width + 16;
      c.fillStyle = "rgba(17,17,17,0.92)";
      c.fillRect(tx - w / 2, ty - 18, w, 24);
      c.fillStyle = "#FFD98A";
      c.textAlign = "center";
      c.fillText(senalado.texto, tx, ty);
    }
  }
  let tocables = [],
    senalado = null;
  function buscarTocable(px, py) {
    let mejor = null,
      dm = 1e9;
    for (const q of tocables) {
      const d = Math.hypot(q.px - px, q.py - py);
      if (d < q.r + 8 && d < dm) (dm = d), (mejor = q);
    }
    return mejor;
  }
  // la leyenda: cada clase con su ícono, su nombre y cuántas faltan; tocarla la muestra u oculta en el mapa
  function leyenda() {
    const cuenta = {};
    cadaMarca((tipo, x, y, op) => {
      const k = (cuenta[op.cat] = cuenta[op.cat] || { p: 0, h: 0 });
      op.apagado ? k.h++ : k.p++;
    });
    let html = "";
    CATS.forEach((cat) => {
      if (!cuenta[cat]) return;
      const n = cuenta[cat];
      html += `<button class="ley${filtro(cat) ? "" : " apagada"}" data-cat="${cat}"><canvas width="56" height="56"></canvas><span>${t("mp.ley_" + cat)}</span><em>${n.p ? n.p : "✓"}</em></button>`;
    });
    html += `<button class="ley${st && st.verHecho ? "" : " apagada"}" data-cat="_hecho"><canvas width="56" height="56"></canvas><span>${t("mp.ley_hecho")}</span><em></em></button>`;
    const el = document.getElementById("mapaLeyenda");
    if (!el) return;
    el.innerHTML = `<div class="ley-titulo">${t("mp.ley_titulo")}</div><div class="ley-explorado">${t("ex.explorado", [Math.floor(explorado() * 100)])}</div>` + html;
    el.querySelectorAll("button").forEach((b) => {
      const cat = b.dataset.cat,
        cx = b.querySelector("canvas").getContext("2d");
      cx.scale(2, 2);
      if (cat === "_hecho") ICONOS.dibujar(cx, "cofre", 14, 15, 10 * ACHICAR, { apagado: true });
      else ICONOS.dibujar(cx, MUESTRA[cat][0], 14, 15, 10, MUESTRA[cat][1]);
      b.onclick = () => {
        if (cat === "_hecho") st.verHecho = !st.verHecho;
        else (st.ocultas = st.ocultas || {})[cat] = !st.ocultas[cat];
        leyenda();
        dibujar();
      };
    });
  }

  // ---------- el minimapa ----------
  // Arriba a la izquierda: lo que rodea a Eromash en un cuadrado de 3600 unidades (unos 120 m), con la misma niebla.
  // Cofres y piedras vistos, criaturas despiertas cerca (los líderes más grandes y de su color), la gente de la
  // historia y el objetivo; si el objetivo queda afuera, una flecha en el borde.
  const MINI = 190,
    LADO = 3600;
  let baseMini = null,
    paseMini = 0;
  function dibujarMini() {
    const cv = document.getElementById("minimapa");
    if (!cv || !niebla) return;
    const k0 = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== MINI * k0) {
      cv.width = cv.height = MINI * k0;
    }
    const c = cv.getContext("2d");
    c.setTransform(k0, 0, 0, k0, 0, 0);
    if (!baseMini) baseMini = pintarBase(2400);
    const x0 = jug.x - LADO / 2,
      y0 = jug.y - LADO / 2,
      k = MINI / LADO;
    c.fillStyle = "#111111";
    c.fillRect(0, 0, MINI, MINI);
    const kb = baseMini.width / W.ANCHO;
    c.drawImage(baseMini, x0 * kb, y0 * kb, LADO * kb, LADO * kb, 0, 0, MINI, MINI);
    const kn = niebla.width / W.ANCHO;
    c.drawImage(niebla, x0 * kn, y0 * kn, LADO * kn, LADO * kn, 0, 0, MINI, MINI);
    const aqui = (x, y) => [(x - x0) * k, (y - y0) * k];
    const dentro = (x, y) => x > x0 && x < x0 + LADO && y > y0 && y < y0 + LADO;
    const rombo = (x, y, col, r) => {
      const [px, py] = aqui(x, y);
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(px, py - r);
      c.lineTo(px + r, py);
      c.lineTo(px, py + r);
      c.lineTo(px - r, py);
      c.fill();
    };
    // en el minimapa solo lo que sirve ahora: los lugares, las piedras de viaje, los campamentos que siguen en pie y
    // las cosas pendientes que están a un paso (las cinco más cercanas); lo hecho no aparece
    const chicas = [];
    cadaMarca((tipo, x, y, op, pri) => {
      if (!dentro(x, y) || op.apagado) return;
      if (op.cat === "lugar" || op.cat === "viaje" || op.cat === "campamento") {
        const [px, py] = aqui(x, y);
        ICONOS.dibujar(c, tipo, px, py, op.cat === "lugar" ? 9 : 7, op);
        return;
      }
      if (op.cat === "puente" || op.cat === "camino" || op.cat === "rito") return;
      const d = Math.hypot(x - jug.x, y - jug.y);
      if (d < 1300) chicas.push([d, tipo, x, y, op]);
    });
    chicas.sort((a, b) => a[0] - b[0]);
    chicas.slice(0, 5).forEach(([d, tipo, x, y, op]) => {
      const [px, py] = aqui(x, y);
      ICONOS.dibujar(c, tipo, px, py, 6.5, op);
    });
    // criaturas despiertas o cerca (no se muestran las dormidas lejos: el bosque sigue teniendo sorpresas)
    for (const e of A.enemigos) {
      if (!e.activo || e.muerto || !dentro(e.x, e.y)) continue;
      const d = Math.hypot(e.x - jug.x, e.y - jug.y);
      if (e.estado === "quieto" && d > 900) continue;
      const col = e.lider ? (e.lider.unico ? "#FFD98A" : A.CB.AFIJOS[e.lider.afijos[0]].col) : "#C8402D";
      const [px, py] = aqui(e.x, e.y);
      c.fillStyle = col;
      c.beginPath();
      c.arc(px, py, e.lider ? 3.6 : 2.2, 0, Math.PI * 2);
      c.fill();
    }
    for (const id in A.npcs) {
      const n = A.npcs[id];
      if (dentro(n.x, n.y)) rombo(n.x, n.y, "#7BC86C", 3);
    }
    if (A.ciervo && A.ciervo.activo) rombo(A.ciervo.x, A.ciervo.y, "#9A6BD8", 5);
    if (window.SECRETOS)
      SECRETOS.pistas().forEach((z) => {
        if (!dentro(z.x, z.y) && Math.hypot(z.x - jug.x, z.y - jug.y) > LADO) return;
        const [px, py] = aqui(z.x, z.y);
        zonaTesoro(c, px, py, z.r * k);
      });
    // el objetivo (rúnico) y la marca propia (dorada): anillo si se ve, flecha en el borde si no
    const o = A.H.objetivo();
    const p = o && o.donde ? A.P[o.donde] || (A.npcs[o.donde] && [A.npcs[o.donde].x, A.npcs[o.donde].y]) : null;
    const senal = (q, col) => {
      if (!q) return;
      if (dentro(q[0], q[1])) {
        const [px, py] = aqui(q[0], q[1]);
        c.strokeStyle = col;
        c.lineWidth = 2;
        c.beginPath();
        c.arc(px, py, 6 + Math.sin(J.t * 4) * 1.5, 0, Math.PI * 2);
        c.stroke();
      } else {
        const a = Math.atan2(q[1] - jug.y, q[0] - jug.x),
          m = MINI / 2 - 9,
          f = m / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
        c.save();
        c.translate(MINI / 2 + Math.cos(a) * f, MINI / 2 + Math.sin(a) * f);
        c.rotate(a);
        c.fillStyle = col;
        c.beginPath();
        c.moveTo(7, 0);
        c.lineTo(-5, -6);
        c.lineTo(-2, 0);
        c.lineTo(-5, 6);
        c.fill();
        c.restore();
      }
    };
    senal(marca(), "#FFD98A");
    senal(p, "#73D5DB");
    // Eromash en el centro, apuntando a donde mira
    c.save();
    c.translate(MINI / 2, MINI / 2);
    c.rotate(Math.atan2(jug.dir[1], jug.dir[0]));
    c.fillStyle = "#C8402D";
    c.strokeStyle = "#F2ECEC";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(8, 0);
    c.lineTo(-6, -6);
    c.lineTo(-2, 0);
    c.lineTo(-6, 6);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
  }

  // dónde está Eromash: el lugar descubierto más cerca si está adentro, si no el bosque
  function lugarAqui() {
    let mejor = null,
      dm = 1e9;
    for (const k of A.H.E.vistos) {
      const L = W.LUGARES[k];
      if (!L) continue;
      const d = Math.hypot(L.p[0] - jug.x, L.p[1] - jug.y);
      if (d < L.r * 1.4 + 300 && d < dm) (dm = d), (mejor = k);
    }
    return mejor ? t("av.lugar_" + mejor) : t("mp.bosque");
  }
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      GW = Math.ceil(W.ANCHO / CEL);
      GH = Math.ceil(W.ALTO / CEL);
      vista = new Uint8Array(GW * GH);
      document.getElementById("capa").insertAdjacentHTML("beforebegin", `<div id="hudMini" class="ui panel oculto"><canvas id="minimapa"></canvas><div class="rotulo" id="miniLugar"></div></div>`);
    },
    hud() {
      const el = document.getElementById("hudMini");
      el.classList.toggle("oculto", !st || J.modo === "menu" || !!J.dentro);
      paseMini -= 1;
      if (paseMini > 0) return;
      paseMini = 4; // cada cuatro cuadros alcanza
      dibujarMini();
      const h = A.hora(),
        txt = String(Math.floor(h)).padStart(2, "0") + ":" + String(Math.floor((h % 1) * 6) * 10).padStart(2, "0");
      const lug = document.getElementById("miniLugar"),
        todo = lugarAqui() + " · " + txt;
      if (lug.textContent !== todo) lug.textContent = todo;
    },
    alEmpezar(extra) {
      extra.mapa = extra.mapa || { v: "" };
      st = extra.mapa;
      vista = new Uint8Array(GW * GH);
      for (let i = 0; i < st.v.length && i < vista.length; i++) vista[i] = st.v[i] === "1" ? 1 : 0;
      armarNiebla();
      marcar();
    },
    // la marca propia en el seguimiento, con la distancia
    seguimiento() {
      const m = marca();
      if (!m) return null;
      return { secundaria: true, rotulo: t("mp.marca_rotulo"), nombre: t("mp.marca_nombre"), objetivos: [{ texto: t("mp.marca_ir"), estado: "actual", metros: Math.max(1, Math.hypot(m[0] - jug.x, m[1] - jug.y) / 43) }] };
    },
    actualizar(dt) {
      if (!st) return;
      // al llegar, la marca se borra sola
      const m = marca();
      if (m && J.modo === "juego" && Math.hypot(m[0] - jug.x, m[1] - jug.y) < 180) {
        st.marca = null;
        HUD.aviso(t("mp.marca_llegaste"), "#FFD98A");
      }
      paso += dt;
      if (paso > 0.5) {
        paso = 0;
        // desde lo alto (el adarve, un mirador) se ve el doble de lejos
        marcar(jug.x, jug.y, jug.alto ? 4 : 2);
      }
      if (J.modo === "juego" && CONTROLES.recien("mapa")) abrir();
      else if (J.modo === "menu" && document.getElementById("mapaLienzo") && CONTROLES.recien("mapa")) A.cerrarMenu();
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  // descubre de golpe un pedazo del mapa (las piedras del camino): radio en unidades del mundo
  return { abrir, marca, explorado, lugarAqui, descubrir: (x, y, radio) => st && marcar(x, y, Math.round(radio / CEL)) };
})();
