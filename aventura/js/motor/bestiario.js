// ---------- el bestiario (sistema BESTIARIO, pestaña de la mochila) ----------
// Como el de The Witcher: cada criatura de Eldervald tiene su página, que se va llenando a medida que Eromash la
// conoce. Verla de cerca la anota (su silueta y su nombre); vencerla una vez cuenta qué es, cuánta vida tiene, cómo
// avisa sus golpes y qué deja; a las 10 se aprende su **punto débil** (+8 % de daño contra ella y un consejo para
// pelearla); a las 30, la **maestría** (otro +8 % de daño y −10 % de lo que pega) y su saga. Los cuatro únicos con
// nombre (Hrungnir, Kolbrandr, Mjöll, Gríð) tienen su propia línea: se tachan al caer.
// Estado en E.extra.bestiario = { vistas: { tipo: 1 }, muertes: { tipo: n } }. Textos `bs.` en textos/bestiario.js.
window.BESTIARIO = (function () {
  "use strict";
  let A, J, jug;
  const t = (k, v) => I18N.t(k, v);
  const LISTA = ["lobo", "jabali", "cuervo", "oso", "errante", "draugr", "fatuoMayor", "fatuo", "custodio", "trol", "dreki"];
  const UNICOS = [
    ["hrungnir", "trol"],
    ["kolbrandr", "jabali"],
    ["mjoll", "fatuo"],
    ["grid", "trol"],
  ];
  const NIVELES = [1, 10, 30], // muertes para cada página
    DEBIL = 0.08,
    MAESTRIA = 0.08,
    RESISTE = 0.1,
    VER = 520;
  const base = () => ({ vistas: {}, muertes: {} });
  let st = base();
  let mirar = 0;

  // ---------- lo que sabe ----------
  const muertes = (tipo) => st.muertes[tipo] || 0;
  function nivel(tipo) {
    const m = muertes(tipo);
    let n = st.vistas[tipo] || m ? 0 : -1;
    NIVELES.forEach((u, i) => m >= u && (n = i + 1));
    return n; // -1 desconocida · 0 vista · 1 vencida · 2 punto débil · 3 maestría
  }
  function anotar(tipo, cuantas) {
    const antes = nivel(tipo);
    st.muertes[tipo] = muertes(tipo) + (cuantas || 1);
    st.vistas[tipo] = 1;
    const ahora = nivel(tipo);
    if (ahora > antes && ahora >= 1) {
      HUD.aviso(t("bs.aprendiste_" + ahora, [t("cr." + tipo)]), ahora === 3 ? "#F5A524" : ahora === 2 ? "#FFD98A" : "#E0B2B2");
      if (window.SONIDO) SONIDO.tocar(ahora >= 2 ? "mision" : "tela", { vol: ahora >= 2 ? 0.5 : 0.3 });
    }
  }
  const bonoDano = (tipo) => (nivel(tipo) >= 2 ? DEBIL : 0) + (nivel(tipo) >= 3 ? MAESTRIA : 0);
  // quién pegó (el golpe trae solo de dónde vino)
  function quien(ox, oy) {
    let m = null,
      dm = 240;
    for (const e of A.enemigos) {
      if (!e.activo || e.muerto) continue;
      const d = Math.hypot(e.x - ox, e.y - oy);
      if (d < dm) (dm = d), (m = e);
    }
    return m;
  }

  // ---------- los dibujos (íconos de la mochila) ----------
  const cache = {};
  function retrato(tipo, conocida) {
    const k = tipo + (conocida ? "" : "_x");
    if (cache[k]) return cache[k];
    // se dibuja grande y se recorta a lo que ocupa, así cada criatura llena su casilla
    const big = document.createElement("canvas");
    big.width = big.height = 900;
    const g = big.getContext("2d");
    try {
      CRIATURAS.dibujar(g, tipo, 450, 760, 1.2, { vista: "S", mov: 0, pal: 0 });
    } catch (e) {}
    const px = g.getImageData(0, 0, 900, 900).data;
    let x0 = 900,
      y0 = 900,
      x1 = 0,
      y1 = 0;
    for (let y = 0; y < 900; y += 3)
      for (let x = 0; x < 900; x += 3)
        if (px[(y * 900 + x) * 4 + 3] > 40) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
    const cv = document.createElement("canvas");
    cv.width = cv.height = 220;
    const c = cv.getContext("2d");
    if (x1 > x0) {
      const w = x1 - x0 + 6,
        h = y1 - y0 + 6,
        f = Math.min(200 / w, 200 / h);
      c.drawImage(big, x0 - 3, y0 - 3, w, h, 110 - (w * f) / 2, 214 - h * f, w * f, h * f);
    }
    if (!conocida) {
      // la silueta: lo que se ve de lejos entre los árboles
      c.globalCompositeOperation = "source-atop";
      c.fillStyle = "#2A2420";
      c.fillRect(0, 0, 220, 220);
    }
    return (cache[k] = cv);
  }
  function iconos() {
    LISTA.forEach((tipo) =>
      [true, false].forEach((con) =>
        INVENTARIO.iconoDe("bs_" + tipo + (con ? "" : "_x"), (c) => {
          const im = retrato(tipo, con);
          c.drawImage(im, -40, -46, 80, 80);
        }),
      ),
    );
  }

  // ---------- la pestaña ----------
  const FORMA = { abanico: "bs.forma_abanico", circulo: "bs.forma_circulo", franja: "bs.forma_franja", carga: "bs.forma_carga", lejos: "bs.forma_lejos" };
  function detalle(tipo) {
    const n = nivel(tipo),
      T = A.CB.TIPOS[tipo] || {},
      m = muertes(tipo);
    if (n < 0) return `<span class="bs-nada">${t("bs.desconocida")}</span>`;
    let h = `<span class="ob-rotulo">${n >= 3 ? t("bs.rotulo_llena", [m]) : t("bs.rotulo", [m, NIVELES[Math.min(2, Math.max(0, n))]])}</span>`;
    if (n === 0) return h + `<span class="bs-texto">${t("bs.solo_vista")}</span>`;
    h += `<span class="bs-texto">${t("bs." + tipo + "_d")}</span>`;
    const mats = window.MATERIALES && MATERIALES.CRIATURAS[tipo] ? MATERIALES.CRIATURAS[tipo].map(([k]) => t("mt." + k)).filter((v, i, a) => a.indexOf(v) === i) : [];
    h += `<span class="ob-lineas"><span>${t("bs.vida", [T.vida || "?"])}</span><span>${t("bs.golpe", [T.dano || "?"])}</span><span>${t(FORMA[T.forma] || "bs.forma_abanico")}</span>${mats.length ? `<span>${t("bs.deja", [mats.join(", ")])}</span>` : ""}</span>`;
    if (n >= 2) h += `<span class="bs-debil"><b>${t("bs.punto_debil")}</b> ${t("bs." + tipo + "_tactica")} <i>${t("bs.bono_debil", [Math.round(DEBIL * 100)])}</i></span>`;
    else h += `<span class="ob-pista">${t("bs.falta", [NIVELES[1] - m, t("bs.punto_debil").replace(":", "")])}</span>`;
    if (n >= 3) h += `<span class="bs-saga"><b>${t("bs.maestria")}</b> ${t("bs." + tipo + "_saga")} <i>${t("bs.bono_maestria", [Math.round(MAESTRIA * 100), Math.round(RESISTE * 100)])}</i></span>`;
    else if (n >= 2) h += `<span class="ob-pista">${t("bs.falta", [NIVELES[2] - m, t("bs.maestria").replace(":", "")])}</span>`;
    return h;
  }
  const minus = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  function pintar(cuerpo, api) {
    const conocidas = LISTA.filter((tp) => nivel(tp) >= 0).length;
    cuerpo.insertAdjacentHTML("beforeend", `<p class="bs-cabeza">${t("bs.cabeza", [conocidas, LISTA.length])}</p>`);
    const g = document.createElement("div");
    g.className = "inv-rejilla bs-rejilla";
    LISTA.forEach((tipo, k) => {
      const n = nivel(tipo);
      const el = api.celda(
        {
          id: "bs_" + tipo,
          icono: "bs_" + tipo + (n >= 1 ? "" : "_x"),
          nombre: n >= 0 ? t("cr." + tipo) : "???",
          col: n >= 3 ? "#F5A524" : n >= 2 ? "#FFD98A" : null,
          html: detalle(tipo),
          cant: n >= 1 ? muertes(tipo) : "",
          falta: n < 0,
        },
        Math.floor(k / 5),
        k % 5,
        "bs-n" + Math.max(0, n),
      );
      g.appendChild(el);
    });
    cuerpo.appendChild(g);
    // los únicos
    const hd = (A.H.E.extra && A.H.E.extra.hd && A.H.E.extra.hd.unicos) || {};
    cuerpo.insertAdjacentHTML("beforeend", `<div class="rotulo inv-piezas">${t("bs.unicos")}</div>`);
    const u = document.createElement("div");
    u.className = "bs-unicos";
    UNICOS.forEach(([id, tipo]) => {
      const caido = !!hd[id],
        visto = caido || nivel(tipo) >= 0;
      u.insertAdjacentHTML("beforeend", `<div class="bs-unico${caido ? " caido" : ""}"><b>${visto ? t("hd.unico_" + id) : "???"}</b><small>${caido ? t("bs.unico_caido") : visto ? t("bs.unico_vive", [minus(t("cr." + tipo))]) : t("bs.unico_rumor")}</small></div>`);
    });
    cuerpo.appendChild(u);
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      iconos();
      INVENTARIO.pestana({ id: "bestiario", antes: "diario", nombre: () => t("bs.tab"), pintar });
    },
    alEmpezar(extra) {
      extra.bestiario = Object.assign(base(), extra.bestiario || {});
      st = extra.bestiario;
    },
    actualizar(dt) {
      // anota lo que ve de cerca (dos veces por segundo alcanza)
      if ((mirar -= dt) > 0) return;
      mirar = 0.5;
      for (const e of A.enemigos) {
        if (!e.activo || e.muerto || st.vistas[e.tipo] || !LISTA.includes(e.tipo)) continue;
        if (Math.hypot(e.x - jug.x, e.y - jug.y) < VER) {
          st.vistas[e.tipo] = 1;
          HUD.aviso(t("bs.nueva", [minus(t("cr." + e.tipo))]), "#E0B2B2");
        }
      }
    },
    alMorir(e) {
      if (!e.tipo || !LISTA.includes(e.tipo)) return;
      anotar(e.tipo, 1);
    },
    modDano(dano, e) {
      const b = e && e.tipo ? bonoDano(e.tipo) : 0;
      return b ? dano * (1 + b) : dano;
    },
    modRecibido(dano, tipo, ox, oy) {
      if (dano <= 0 || ox == null) return dano;
      const e = quien(ox, oy);
      return e && nivel(e.tipo) >= 3 ? Math.round(dano * (1 - RESISTE)) : dano;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, nivel, muertes, anotar, bonoDano, detalle, LISTA, UNICOS, NIVELES, DEBIL, MAESTRIA, RESISTE };
})();
