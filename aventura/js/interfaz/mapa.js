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
      c.fillStyle = "#2E5A66";
      c.beginPath();
      c.ellipse(l.p[0], l.p[1], l.rx, l.ry, 0, 0, Math.PI * 2);
      c.fill();
    });
    W.RIOS.forEach((r) => trazo(r.p, r.w, "#2E5A66"));
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


  // ---------- las miniaturas ----------
  // Recorre todo lo que tiene miniatura en el mapa: lugares, estructuras, campamentos, puentes, piedras, altares,
  // cofres y manzanos. fn(tipo, x, y, op, prioridad) · prioridad 0 = lugar grande … 3 = cosa chica.
  const TIPO_LUGAR = { puesto: "puesto", refugio: "casa", casa_lindes: "casa", eikholt: "ciudad", paso: "paso", claro: "claro", aserradero: "aserradero", santuario: "santuario", brunvik: "casa", skarnholt: "salon", tumulo: "tumulo", caravana: "caravana", torre: "torre", carro: "caravana" };
  let totems = null;
  function cadaMarca(fn) {
    for (const id in TIPO_LUGAR) {
      const L = W.LUGARES[id];
      if (L && visto(L.p[0], L.p[1])) fn(TIPO_LUGAR[id], L.p[0], L.p[1], { nombre: A.H.E.vistos.includes(id) ? t("av.lugar_" + id) : null }, 0);
    }
    if (!totems) totems = W.COSAS.filter((o) => o.id === "totemCampamento");
    totems.forEach((o) => visto(o.x, o.y) && fn("campamento", o.x, o.y, {}, 1));
    W.PUENTES.forEach((p) => {
      const x = (p.a[0] + p.b[0]) / 2,
        y = (p.a[1] + p.b[1]) / 2;
      if (visto(x, y)) fn("puente", x, y, {}, 2);
    });
    const S = SECRETOS.lista();
    S.altares.forEach((a) => visto(a.cosa.x, a.cosa.y) && fn("altar", a.cosa.x, a.cosa.y, { runa: a.runa, col: ASSETS.COL_RUNA[a.runa], apagado: a.cosa.o.tomada }, 1));
    S.piedras.forEach((p) => visto(p.cosa.x, p.cosa.y) && fn("piedra", p.cosa.x, p.cosa.y, { runa: "ansuz", col: S.st.piedras[p.id] ? "#73D5DB" : "#4A5A60" }, 2));
    if (window.RITOS) {
      const R = RITOS.lista();
      R.camino.forEach((p) => visto(p.cosa.x, p.cosa.y) && fn("piedraCamino", p.cosa.x, p.cosa.y, { col: R.st.camino[p.id] ? "#C8402D" : "#6E4A3A" }, 2));
      R.ritos.forEach((r) => {
        const d = ASSETS.RITO[r.tipo];
        r.piedras.forEach((q) => visto(q.x, q.y) && fn("piedra", q.x, q.y, { runa: d.runa, col: R.st.ritos[r.id] ? d.col : "#5A5A64", borde: d.col }, 2));
        if (visto(r.cofre.x, r.cofre.y) && !R.st.cofres[r.id]) fn("cofre", r.cofre.x, r.cofre.y, { col: r.cofre.o.sellado ? "#9A6BD8" : "#FFD98A" }, 3);
      });
    }
    S.cofres.forEach((q) => {
      if (!visto(q.cosa.x, q.cosa.y) || q.cosa.o.oculto) return;
      fn("cofre", q.cosa.x, q.cosa.y, { apagado: !!S.st.cofres[q.id], col: q.cosa.o.sellado ? "#9A6BD8" : null }, 3);
    });
    S.manzanos.forEach((m) => visto(m.cosa.x, m.cosa.y) && fn("manzano", m.cosa.x, m.cosa.y, { apagado: m.cosa.o.cosechado }, 3));
  }

  function abrir() {
    A.menu(`<h2>${t("mp.titulo")}</h2><canvas id="mapaLienzo" class="mapa"></canvas><div class="sub mapa-ley">${t("mp.leyenda")}</div>`, [{ texto: t("ui.cerrar"), fn: A.cerrarMenu }]);
    document.getElementById("capaCaja").classList.add("ancha");
    dibujar();
  }
  function dibujar() {
    const cv = document.getElementById("mapaLienzo");
    if (!cv) return;
    if (!base) base = pintarBase(ANCHO_MAPA);
    cv.width = base.width;
    cv.height = base.height;
    const c = cv.getContext("2d");
    c.drawImage(base, 0, 0);
    const k = base.width / W.ANCHO;
    c.drawImage(niebla, 0, 0);
    const nombres = [];
    cadaMarca((tipo, x, y, op, pri) => {
      ICONOS.dibujar(c, tipo, x * k, y * k, [16, 12, 10, 7][pri], op);
      if (op.nombre) nombres.push([op.nombre, x * k, y * k - 17]);
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
      c.strokeStyle = "#73D5DB";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(p[0] * k, p[1] * k, 8 + Math.sin(J.t * 4) * 2, 0, Math.PI * 2);
      c.stroke();
    }
    c.save();
    c.translate(jug.x * k, jug.y * k);
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
    cadaMarca((tipo, x, y, op, pri) => {
      if (!dentro(x, y) || (op.apagado && pri === 3)) return;
      const [px, py] = aqui(x, y);
      ICONOS.dibujar(c, tipo, px, py, [9, 7, 6, 5][pri], op);
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
    // el objetivo: anillo rúnico si se ve, flecha en el borde si no
    const o = A.H.objetivo();
    const p = o && o.donde ? A.P[o.donde] || (A.npcs[o.donde] && [A.npcs[o.donde].x, A.npcs[o.donde].y]) : null;
    if (p) {
      if (dentro(p[0], p[1])) {
        const [px, py] = aqui(p[0], p[1]);
        c.strokeStyle = "#73D5DB";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(px, py, 6 + Math.sin(J.t * 4) * 1.5, 0, Math.PI * 2);
        c.stroke();
      } else {
        const a = Math.atan2(p[1] - jug.y, p[0] - jug.x),
          m = MINI / 2 - 9,
          f = m / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
        c.save();
        c.translate(MINI / 2 + Math.cos(a) * f, MINI / 2 + Math.sin(a) * f);
        c.rotate(a);
        c.fillStyle = "#73D5DB";
        c.beginPath();
        c.moveTo(7, 0);
        c.lineTo(-5, -6);
        c.lineTo(-2, 0);
        c.lineTo(-5, 6);
        c.fill();
        c.restore();
      }
    }
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
      const lug = document.getElementById("miniLugar");
      if (lug.textContent !== txt) lug.textContent = txt;
    },
    alEmpezar(extra) {
      extra.mapa = extra.mapa || { v: "" };
      st = extra.mapa;
      vista = new Uint8Array(GW * GH);
      for (let i = 0; i < st.v.length && i < vista.length; i++) vista[i] = st.v[i] === "1" ? 1 : 0;
      armarNiebla();
      marcar();
    },
    actualizar(dt) {
      if (!st) return;
      paso += dt;
      if (paso > 0.5) {
        paso = 0;
        marcar();
      }
      if (J.modo === "juego" && CONTROLES.recien("mapa")) abrir();
      else if (J.modo === "menu" && document.getElementById("mapaLienzo") && CONTROLES.recien("mapa")) A.cerrarMenu();
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  // descubre de golpe un pedazo del mapa (las piedras del camino): radio en unidades del mundo
  return { abrir, descubrir: (x, y, radio) => st && marcar(x, y, Math.round(radio / CEL)) };
})();
