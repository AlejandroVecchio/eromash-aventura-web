// ---------- el mapa de las mazmorras (sistema MAPA_MAZMORRA) ----------
// Bajo tierra el minimapa del bosque no sirve: cada mazmorra (motor/zonas.js) arma su propio mapa celda por celda a
// medida que Eromash la recorre, con su niebla. Una celda tiene tres estados: 0 sin ver, 1 entrevista (a la luz de la
// lámpara, se pinta tenue) y 2 pisada o de una sala ya vista (se pinta entera, con sus paredes). Entrar a una sala la
// muestra entera, salvo las oscuras: esas se ven a medida que se caminan o cuando se enciende un brasero. Los pasillos
// se arman de a pedazos. Lo visto se guarda en E.extra.mapaZona[id]; cada mazmorra recorrida entera paga una vez.
// El minimapa (MAPA.dibujarMini) y la tecla del mapa (MAPA.abrir) le preguntan a este sistema primero.
window.MAPA_MAZMORRA = (function () {
  "use strict";
  let A, J, jug;
  const t = (k, v) => I18N.t(k, v);
  const PX = 12, // píxeles por celda en el lienzo del mapa de cada mazmorra
    LADO = 3000, // lo que entra en el minimapa (unas 15 celdas)
    LAMPARA = 3, // celdas que alcanza a entrever la lámpara
    PIE = 1; // celdas que quedan pisadas alrededor de Eromash
  const PISO = { entrada: "#7A6A58", sala: "#665A50", oscura: "#4E4640", tesoro: "#7C6A46", jefe: "#6E4A44", pasillo: "#56504A" };
  const PARED = "#B8A48A";
  let st = null; // E.extra.mapaZona
  const mapas = {}; // por mazmorra: { Z, v (Uint8Array), lienzo, total }
  let paso = 0;

  // ---------- lo visto de cada mazmorra ----------
  function mapaDe(Z) {
    if (!Z || Z.d.tipo !== "mazmorra" || !Z.g) return null;
    let m = mapas[Z.id];
    if (!m) {
      const n = Z.d.ancho * Z.d.alto,
        v = new Uint8Array(n),
        guardado = (st && st[Z.id] && st[Z.id].v) || "";
      for (let i = 0; i < n && i < guardado.length; i++) v[i] = +guardado[i] || 0;
      let total = 0;
      for (let i = 0; i < n; i++) if (Z.g[i]) total++;
      m = mapas[Z.id] = { Z, v, total, lienzo: null };
    }
    return m;
  }
  const celda = (Z) => (Z.x1 - Z.x0) / Z.d.ancho;
  const tipoDe = (Z, i) => (Z.sala[i] >= 0 ? Z.d.salas[Z.sala[i]].tipo : "pasillo");
  // sube una celda a ese estado; true si cambió
  function ver(m, x, y, nivel) {
    const Z = m.Z;
    if (x < 0 || y < 0 || x >= Z.d.ancho || y >= Z.d.alto) return false;
    const i = y * Z.d.ancho + x;
    if (!Z.g[i] || m.v[i] >= nivel) return false;
    m.v[i] = nivel;
    if (m.lienzo) pintarCelda(m, x, y);
    return true;
  }
  // una sala se ve entera si tiene luz: antorchas, un brasero encendido o el jefe ya despierto
  function salaConLuz(Z, si) {
    const s = Z.d.salas[si];
    if (s.tipo !== "oscura") return true;
    const fu = window.ZONAS && ZONAS.estado() ? ZONAS.estado().fuegos : {};
    return Z.fuegos.some((f) => f.sala === si && fu[f.k]);
  }
  function verSala(m, si) {
    const s = m.Z.d.salas[si];
    let cambio = false;
    for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) cambio = ver(m, x, y, 2) || cambio;
    return cambio;
  }
  // lo que rodea a Eromash ahora
  function recorrer(m) {
    const Z = m.Z,
      C = celda(Z),
      cx = Math.floor((jug.x - Z.x0) / C),
      cy = Math.floor((jug.y - Z.y0) / C);
    let cambio = false;
    for (let y = cy - LAMPARA; y <= cy + LAMPARA; y++)
      for (let x = cx - LAMPARA; x <= cx + LAMPARA; x++) {
        const d2 = (x - cx) ** 2 + (y - cy) ** 2;
        if (d2 > LAMPARA * LAMPARA + 1) continue;
        cambio = ver(m, x, y, d2 <= PIE * PIE + 1 ? 2 : 1) || cambio;
      }
    const i = cy * Z.d.ancho + cx,
      si = cx >= 0 && cy >= 0 && cx < Z.d.ancho && cy < Z.d.alto ? Z.sala[i] : -1;
    if (si >= 0 && salaConLuz(Z, si)) cambio = verSala(m, si) || cambio;
    // las salas oscuras que se encendieron mientras tanto (el jefe enciende las suyas al despertar)
    Z.d.salas.forEach((s, k) => s.tipo !== "entrada" && salaYaPisada(m, k) && salaConLuz(Z, k) && (cambio = verSala(m, k) || cambio));
    if (cambio) guardar(m);
    return cambio;
  }
  function salaYaPisada(m, si) {
    const s = m.Z.d.salas[si];
    for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) if (m.v[y * m.Z.d.ancho + x]) return true;
    return false;
  }
  function explorado(m) {
    let n = 0;
    for (let i = 0; i < m.v.length; i++) if (m.v[i]) n++;
    return m.total ? n / m.total : 0;
  }
  function guardar(m) {
    if (!st) return;
    const e = (st[m.Z.id] = st[m.Z.id] || {});
    e.v = Array.from(m.v).join("");
    // toda la mazmorra en el mapa: se festeja una vez
    if (!e.entera && explorado(m) >= 1) {
      e.entera = true;
      const plata = 15 + m.Z.d.salas.length * 3;
      if (window.PODERES) PODERES.darPlata(plata);
      HUD.aviso(t("zn.mapa_entera_d", [plata]), "#FFD98A", t("zn.mapa_entera"));
      if (window.SONIDO) SONIDO.tocar("mision", { vol: 0.4 });
    }
  }

  // ---------- el lienzo del mapa (se pinta de a una celda, solo cuando cambia) ----------
  function lienzoDe(m) {
    if (m.lienzo) return m.lienzo;
    const Z = m.Z;
    m.lienzo = document.createElement("canvas");
    m.lienzo.width = Z.d.ancho * PX;
    m.lienzo.height = Z.d.alto * PX;
    for (let y = 0; y < Z.d.alto; y++) for (let x = 0; x < Z.d.ancho; x++) if (m.v[y * Z.d.ancho + x]) pintarCelda(m, x, y);
    return m.lienzo;
  }
  function pintarCelda(m, x, y) {
    const Z = m.Z,
      c = m.lienzo.getContext("2d"),
      i = y * Z.d.ancho + x,
      nivel = m.v[i],
      X = x * PX,
      Y = y * PX;
    c.clearRect(X, Y, PX, PX);
    if (!nivel) return;
    c.globalAlpha = nivel === 2 ? 1 : 0.42;
    c.fillStyle = PISO[tipoDe(Z, i)] || PISO.pasillo;
    c.fillRect(X, Y, PX, PX);
    // las paredes: el borde de la celda que da a la roca
    const roca = (dx, dy) => {
      const nx = x + dx,
        ny = y + dy;
      return nx < 0 || ny < 0 || nx >= Z.d.ancho || ny >= Z.d.alto || !Z.g[ny * Z.d.ancho + nx];
    };
    c.fillStyle = PARED;
    if (roca(0, -1)) c.fillRect(X, Y, PX, 2);
    if (roca(0, 1)) c.fillRect(X, Y + PX - 2, PX, 2);
    if (roca(-1, 0)) c.fillRect(X, Y, 2, PX);
    if (roca(1, 0)) c.fillRect(X + PX - 2, Y, 2, PX);
    c.globalAlpha = 1;
  }

  // ---------- lo que se dibuja encima: salida, braseros, cofres, el jefe, las criaturas despiertas ----------
  // aqui(x, y) pasa del mundo al lienzo destino; u es el tamaño de los íconos
  function cosas(c, m, aqui, u, conCriaturas) {
    const Z = m.Z,
      C = celda(Z),
      zs = (window.ZONAS && ZONAS.estado()) || { fuegos: {}, cofres: {}, jefes: {} };
    const vista = (x, y) => {
      const cx = Math.floor((x - Z.x0) / C),
        cy = Math.floor((y - Z.y0) / C);
      return cx >= 0 && cy >= 0 && cx < Z.d.ancho && cy < Z.d.alto && m.v[cy * Z.d.ancho + cx] > 0;
    };
    const rombo = (px, py, r, col) => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(px, py - r);
      c.lineTo(px + r, py);
      c.lineTo(px, py + r);
      c.lineTo(px - r, py);
      c.fill();
    };
    // la escalera de salida: tres escalones dorados
    if (Z.escalera && vista(Z.escalera.x, Z.escalera.y)) {
      const [px, py] = aqui(Z.escalera.x, Z.escalera.y);
      c.fillStyle = "#FFD98A";
      for (let k = 0; k < 3; k++) c.fillRect(px - u + k * u * 0.33, py + u * 0.5 - (k + 1) * u * 0.42, u * 2 - k * u * 0.66, u * 0.34);
    }
    Z.fuegos.forEach((f) => {
      if (!vista(f.x, f.y)) return;
      const [px, py] = aqui(f.x, f.y);
      if (zs.fuegos[f.k]) {
        c.fillStyle = "#FF8D71";
        c.beginPath();
        c.moveTo(px, py - u * 0.9);
        c.lineTo(px + u * 0.45, py + u * 0.3);
        c.lineTo(px - u * 0.45, py + u * 0.3);
        c.fill();
      } else rombo(px, py, u * 0.4, "#8E8A86");
    });
    Z.cofres.forEach((cf) => !zs.cofres[cf.k] && vista(cf.x, cf.y) && rombo(...aqui(cf.x, cf.y), u * 0.6, "#73D5DB"));
    const j = Z.jefe;
    if (j && vista(j.cx, j.cy)) {
      const [px, py] = aqui(j.cx, j.cy),
        vivo = !zs.jefes[Z.id];
      c.strokeStyle = vivo ? "#C8402D" : "#5E130D";
      c.lineWidth = Math.max(1.5, u * 0.22);
      c.beginPath();
      c.ellipse(px, py, u * 1.3, u * 0.8, 0, 0, Math.PI * 2);
      c.stroke();
      if (vivo) rombo(px, py, u * 0.45, "#C8402D");
    }
    if (conCriaturas)
      for (const e of Z.enemigos) {
        if (!e.activo || e.muerto || !vista(e.x, e.y) || (e.estado === "quieto" && Math.hypot(e.x - jug.x, e.y - jug.y) > 900)) continue;
        const [px, py] = aqui(e.x, e.y);
        c.fillStyle = e.lider ? (e.lider.unico ? "#FFD98A" : (A.CB.AFIJOS[e.lider.afijos[0]] || {}).col || "#FF8D71") : "#C8402D";
        c.beginPath();
        c.arc(px, py, e.lider ? u * 0.42 : u * 0.26, 0, Math.PI * 2);
        c.fill();
      }
  }

  // ---------- el minimapa (lo pide MAPA.dibujarMini; true si estaba en una mazmorra) ----------
  function mini(c, M) {
    const m = window.ZONAS && mapaDe(ZONAS.aqui());
    if (!m) return false;
    const Z = m.Z,
      C = celda(Z),
      k = M / LADO,
      x0 = jug.x - LADO / 2,
      y0 = jug.y - LADO / 2,
      kl = PX / C;
    c.fillStyle = "#111111";
    c.fillRect(0, 0, M, M);
    c.imageSmoothingEnabled = false;
    c.drawImage(lienzoDe(m), (x0 - Z.x0) * kl, (y0 - Z.y0) * kl, LADO * kl, LADO * kl, 0, 0, M, M);
    c.imageSmoothingEnabled = true;
    cosas(c, m, (x, y) => [(x - x0) * k, (y - y0) * k], 6, true);
    return true;
  }

  // ---------- el mapa grande (la tecla del mapa adentro de una mazmorra) ----------
  function abrir() {
    const m = window.ZONAS && mapaDe(ZONAS.aqui());
    if (!m) return false;
    const pct = Math.floor(explorado(m) * 100);
    const ley = [
      ["zn.mapa_tu", "#C8402D"],
      ["zn.mapa_salida", "#FFD98A"],
      ["zn.mapa_brasero", "#FF8D71"],
      ["zn.mapa_apagado", "#8E8A86"],
      ["zn.mapa_cofre", "#73D5DB"],
      ["zn.mapa_jefe", "#C8402D"],
    ]
      .map(([k, col]) => `<span class="mz-ley"><i style="background:${col}"></i>${t(k)}</span>`)
      .join("");
    A.menu(`<h2>${m.Z.d.nombre}</h2><div class="sub">${t("zn.mapa_explorado", [pct])}</div><canvas id="mapaZona" class="mapa mapa-zona"></canvas><div class="mz-leyenda">${ley}</div>`, [{ texto: t("ui.cerrar"), fn: A.cerrarMenu }]);
    document.getElementById("capaCaja").classList.add("ancha");
    dibujarGrande(m);
    return true;
  }
  function dibujarGrande(m) {
    const cv = document.getElementById("mapaZona");
    if (!cv) return;
    const Z = m.Z,
      C = celda(Z),
      base = lienzoDe(m),
      k = Math.min(3, 1000 / base.width, 620 / base.height),
      w = Math.round(base.width * k),
      h = Math.round(base.height * k);
    cv.width = w;
    cv.height = h;
    const c = cv.getContext("2d");
    c.fillStyle = "#111111";
    c.fillRect(0, 0, w, h);
    c.imageSmoothingEnabled = false;
    c.drawImage(base, 0, 0, w, h);
    c.imageSmoothingEnabled = true;
    const kk = (PX / C) * k;
    cosas(c, m, (x, y) => [(x - Z.x0) * kk, (y - Z.y0) * kk], PX * k * 0.55, false);
    flecha(c, (jug.x - Z.x0) * kk, (jug.y - Z.y0) * kk, Math.max(7, PX * k * 0.7));
  }
  // Eromash: la flecha roja de siempre, hacia donde mira
  function flecha(c, x, y, r) {
    c.save();
    c.translate(x, y);
    c.rotate(Math.atan2(jug.dir[1], jug.dir[0]));
    c.fillStyle = "#C8402D";
    c.strokeStyle = "#F2ECEC";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(r, 0);
    c.lineTo(-r * 0.75, -r * 0.75);
    c.lineTo(-r * 0.25, 0);
    c.lineTo(-r * 0.75, r * 0.75);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
    },
    alEmpezar(extra) {
      extra.mapaZona = extra.mapaZona || {};
      st = extra.mapaZona;
      for (const k in mapas) delete mapas[k];
    },
    actualizar(dt) {
      paso += dt;
      if (paso < 0.2) return;
      paso = 0;
      const m = window.ZONAS && mapaDe(ZONAS.aqui());
      if (m) recorrer(m);
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return {
    sistema,
    mini,
    abrir,
    // lo visto de una mazmorra (por id): { v, total, explorado }
    de: (id) => {
      const Z = window.ZONAS && ZONAS.zonas().find((z) => z.id === id),
        m = mapaDe(Z);
      return m && { v: m.v, total: m.total, explorado: explorado(m) };
    },
    recorrer: () => {
      const m = window.ZONAS && mapaDe(ZONAS.aqui());
      return m ? recorrer(m) : false;
    },
  };
})();
