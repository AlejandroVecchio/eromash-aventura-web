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

  function pintarBase() {
    const k = ANCHO_MAPA / W.ANCHO,
      h = Math.round(W.ALTO * k);
    const cv = document.createElement("canvas");
    cv.width = ANCHO_MAPA;
    cv.height = h;
    const c = cv.getContext("2d");
    c.fillStyle = "#1E2019";
    c.fillRect(0, 0, ANCHO_MAPA, h);
    c.scale(k, k);
    // el bosque
    c.fillStyle = "#2C3A24";
    c.fillRect(W.BORDE, W.BORDE * 0.5, W.ANCHO - W.BORDE * 2, W.ALTO - W.BORDE * 1.5);
    // manchas de bosque espeso
    for (let y = 0; y < W.ALTO; y += 500)
      for (let x = 0; x < W.ANCHO; x += 500) {
        const d = W.ruido(x, y);
        if (d > 0.5 && x > W.BORDE && y > W.BORDE * 0.5 && x < W.ANCHO - W.BORDE && y < W.ALTO - W.BORDE) {
          c.fillStyle = d > 0.65 ? "#1C2A1A" : "#24321F";
          c.fillRect(x, y, 520, 520);
        }
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
    W.CAMINOS.forEach((r) => trazo(r.p, Math.max(140, r.w * 0.9), "#8A7458"));
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
  function marcar() {
    const cx = Math.floor(jug.x / CEL),
      cy = Math.floor(jug.y / CEL),
      r = 2;
    let cambio = false;
    for (let y = cy - r; y <= cy + r; y++)
      for (let x = cx - r; x <= cx + r; x++) {
        if (x < 0 || y < 0 || x >= GW || y >= GH || (x - cx) ** 2 + (y - cy) ** 2 > r * r + 1) continue;
        const i = y * GW + x;
        if (!vista[i]) {
          vista[i] = 1;
          cambio = true;
        }
      }
    if (cambio) st.v = Array.from(vista).join("");
  }
  const visto = (x, y) => vista[Math.floor(y / CEL) * GW + Math.floor(x / CEL)] === 1;

  function abrir() {
    A.menu(`<h2>${t("mp.titulo")}</h2><canvas id="mapaLienzo" class="mapa"></canvas><div class="sub mapa-ley">${t("mp.leyenda")}</div>`, [{ texto: t("ui.cerrar"), fn: A.cerrarMenu }]);
    document.getElementById("capaCaja").classList.add("ancha");
    dibujar();
  }
  function dibujar() {
    const cv = document.getElementById("mapaLienzo");
    if (!cv) return;
    if (!base) base = pintarBase();
    cv.width = base.width;
    cv.height = base.height;
    const c = cv.getContext("2d");
    c.drawImage(base, 0, 0);
    const k = base.width / W.ANCHO;
    // niebla de lo no explorado: una capa negra con agujeros suaves donde ya caminaste
    const nb = document.createElement("canvas");
    nb.width = cv.width;
    nb.height = cv.height;
    const n = nb.getContext("2d");
    n.fillStyle = "#111111";
    n.fillRect(0, 0, nb.width, nb.height);
    n.globalCompositeOperation = "destination-out";
    const r = CEL * k * 1.25;
    for (let y = 0; y < GH; y++)
      for (let x = 0; x < GW; x++) {
        if (!vista[y * GW + x]) continue;
        const px = (x + 0.5) * CEL * k,
          py = (y + 0.5) * CEL * k,
          g = n.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(0.55, "rgba(0,0,0,0.9)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        n.fillStyle = g;
        n.fillRect(px - r, py - r, r * 2, r * 2);
      }
    c.drawImage(nb, 0, 0);
    const S = SECRETOS.lista();
    const punto = (x, y, col, r = 4) => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(x * k, y * k - r);
      c.lineTo(x * k + r, y * k);
      c.lineTo(x * k, y * k + r);
      c.lineTo(x * k - r, y * k);
      c.fill();
    };
    S.cofres.forEach((q) => {
      if (!visto(q.cosa.x, q.cosa.y) || q.cosa.o.oculto) return;
      punto(q.cosa.x, q.cosa.y, S.st.cofres[q.id] ? "#5E4A36" : "#FFD98A", 3.5);
    });
    S.manzanos.forEach((m) => visto(m.cosa.x, m.cosa.y) && punto(m.cosa.x, m.cosa.y, m.cosa.o.cosechado ? "#5E4A36" : "#F5A524", 5));
    S.piedras.forEach((p) => {
      if (!visto(p.cosa.x, p.cosa.y)) return;
      FUTHARK.dibujar(c, "ansuz", p.cosa.x * k, p.cosa.y * k + 7, 14, S.st.piedras[p.id] ? "#73D5DB" : "#4A5A60", 2.5);
    });
    S.altares.forEach((a) => visto(a.cosa.x, a.cosa.y) && FUTHARK.dibujar(c, a.runa, a.cosa.x * k, a.cosa.y * k + 9, 18, a.cosa.o.tomada ? "#5A5450" : ASSETS.COL_RUNA[a.runa], 3));
    // nombres de los lugares descubiertos
    c.font = '700 13px "Eromash Text", system-ui, sans-serif';
    c.textAlign = "center";
    for (const id of A.H.E.vistos) {
      const L = W.LUGARES[id];
      if (!L) continue;
      c.lineWidth = 3;
      c.strokeStyle = "#111111";
      c.strokeText(t("av.lugar_" + id), L.p[0] * k, L.p[1] * k - 10);
      c.fillStyle = "#F2ECEC";
      c.fillText(t("av.lugar_" + id), L.p[0] * k, L.p[1] * k - 10);
    }
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

  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      GW = Math.ceil(W.ANCHO / CEL);
      GH = Math.ceil(W.ALTO / CEL);
      vista = new Uint8Array(GW * GH);
    },
    alEmpezar(extra) {
      extra.mapa = extra.mapa || { v: "" };
      st = extra.mapa;
      vista = new Uint8Array(GW * GH);
      for (let i = 0; i < st.v.length && i < vista.length; i++) vista[i] = st.v[i] === "1" ? 1 : 0;
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
  return { abrir };
})();
