// ---------- explorar Eldervald (sistema EXPLORA) ----------
// Lo que hace que salir del camino valga la pena y se entienda: la brújula de arriba (hacia dónde mira Eromash, el
// objetivo, la marca propia, las zonas de los mapas del tesoro y un «?» por cada lugar sin descubrir cerca), el «?»
// sobre la cabeza cuando nota algo escondido a un paso (con un tintineo que suena de ese lado), el zumbido de las
// piedras del susurro dormidas, los hitos de lo explorado (pagan plata y fragmentos) y el diario de lo que falta en
// cada lugar. Estado guardado en E.extra.explora = { hitos }.
window.EXPLORA = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const LUGARES = ["puesto", "refugio", "casa_lindes", "eikholt", "carro", "paso", "claro", "aserradero", "santuario", "brunvik", "skarnholt", "tumulo", "caravana", "torre"];
  // lo explorado que se festeja: fracción, plata y si trae fragmento
  const HITOS = [
    [0.1, 30, 0],
    [0.25, 60, 0],
    [0.5, 100, 1],
    [0.75, 150, 0],
    [0.9, 300, 1],
  ];
  let st = { hitos: 0 };
  const notados = new Set(),
    zonasVistas = new Set();
  let acum = 0,
    acumHito = 0,
    acumZumbido = 0,
    nota = null, // { t, x, y }: el «?» sobre la cabeza y hacia dónde
    rumbo = null;

  // ---------- los secretos de cada lugar ----------
  // cuenta lo que hay alrededor de un lugar (cofres, piedras del susurro, altares, manzanos) y cuánto ya se encontró
  let cacheSec = {},
    cacheT = -9;
  function secretosDe(id) {
    if (J.t - cacheT > 2) {
      cacheSec = {};
      cacheT = J.t;
    }
    if (cacheSec[id]) return cacheSec[id];
    const L = W.LUGARES[id],
      r = { h: 0, n: 0 };
    if (L && window.SECRETOS) {
      const S = SECRETOS.lista(),
        cerca = (o) => Math.hypot(o.x - L.p[0], o.y - L.p[1]) < L.r + 2000;
      const contar = (o, hecho) => cerca(o) && (r.n++, hecho && r.h++);
      S.cofres.forEach((c) => contar(c.cosa, S.st.cofres[c.id]));
      S.piedras.forEach((p) => contar(p.cosa, S.st.piedras[p.id]));
      S.altares.forEach((a) => contar(a.cosa, a.cosa.o.tomada));
      S.manzanos.forEach((m) => contar(m.cosa, m.cosa.o.cosechado));
    }
    return (cacheSec[id] = r);
  }

  // ---------- notar lo escondido ----------
  // lo que todavía se puede encontrar y se ve (los cofres enterrados no: para eso están la Lente y los mapas)
  function pendientes(fn) {
    if (!window.SECRETOS) return;
    const S = SECRETOS.lista();
    S.cofres.forEach((c) => !S.st.cofres[c.id] && !c.cosa.o.oculto && fn("c" + c.id, c.cosa));
    S.piedras.forEach((p) => !S.st.piedras[p.id] && fn("p" + p.id, p.cosa));
    S.altares.forEach((a) => !a.cosa.o.tomada && fn("a" + a.runa, a.cosa));
    S.manzanos.forEach((m) => !m.cosa.o.cosechado && fn("m" + m.id, m.cosa));
  }
  function notar() {
    if (A.enPelea() || jug.muerto) return;
    let mejor = null,
      dm = 650;
    pendientes((k, o) => {
      if (notados.has(k)) return;
      const d = Math.hypot(o.x - jug.x, o.y - jug.y);
      if (d < dm) (dm = d), (mejor = [k, o]);
    });
    if (!mejor) return;
    notados.add(mejor[0]);
    if (window.ANIMA) ANIMA.gesto("duda");
    nota = { t: J.t, x: mejor[1].x, y: mejor[1].y };
    if (window.SONIDO) {
      SONIDO.tono("triangle", 1046, 1318, 0.35, 0.05, { x: nota.x, y: nota.y, filtro: 3200 });
      SONIDO.tono("triangle", 1568, 1760, 0.5, 0.035, { x: nota.x, y: nota.y, filtro: 3200, retraso: 0.12 });
    }
  }
  // las piedras dormidas zumban bajito: se oyen antes de verlas
  function zumbido() {
    if (!window.SONIDO || !window.SECRETOS) return;
    const S = SECRETOS.lista();
    let p = null,
      dm = 900;
    S.piedras.forEach((q) => {
      if (S.st.piedras[q.id]) return;
      const d = Math.hypot(q.cosa.x - jug.x, q.cosa.y - jug.y);
      if (d < dm) (dm = d), (p = q);
    });
    if (!p) return;
    SONIDO.tono("sine", 147, 165, 1.6, 0.07, { x: p.cosa.x, y: p.cosa.y, filtro: 700, ambiente: true });
    SONIDO.tono("sine", 220, 247, 1.6, 0.035, { x: p.cosa.x, y: p.cosa.y, filtro: 700, ambiente: true, retraso: 0.1 });
  }
  // al entrar a la zona de un mapa del tesoro, una vez: cómo se encuentra lo enterrado
  function zonas() {
    if (!window.SECRETOS) return;
    SECRETOS.pistas().forEach((z) => {
      if (zonasVistas.has(z.id) || Math.hypot(z.x - jug.x, z.y - jug.y) > z.r) return;
      zonasVistas.add(z.id);
      A.avisar("ex.zona_aqui", "#FFD98A");
    });
  }
  // un lugar al que ya no le queda nada por encontrar se festeja una vez
  const PLATA_COMPLETO = 20;
  const completos = () => LUGARES.filter((id) => A.H.E.vistos.includes(id) && (({ h, n }) => n > 0 && h === n)(secretosDe(id)));
  function lugaresCompletos() {
    cacheT = -9;
    completos().forEach((id) => {
      if (st.completos[id]) return;
      st.completos[id] = true;
      HUD.aviso(t("av.lugar_" + id), "lugar", t("ex.lugar_completo"));
      if (window.PODERES && PODERES.pj()) PODERES.darPlata(PLATA_COMPLETO);
    });
  }
  function hitos() {
    if (!window.MAPA || !window.PODERES || !PODERES.pj()) return;
    const f = MAPA.explorado();
    while (st.hitos < HITOS.length && f >= HITOS[st.hitos][0]) {
      const [k, plata, frag] = HITOS[st.hitos++];
      J.retrasar(st.hitos * 0.3, () => {
        HUD.aviso(t("ex.hito", [Math.round(k * 100)]), "lugar", t("ex.hito_sub"));
        PODERES.darPlata(plata);
        if (frag) J.retrasar(0.8, () => PODERES.darFragmento());
      });
    }
  }

  // ---------- la brújula ----------
  const ANCHO = 420,
    ALTO = 44,
    CAMPO = Math.PI / 2; // de la punta al centro: 90°
  let paseBr = 0;
  function brujula() {
    const el = document.getElementById("hudBrujula");
    const ver = J.modo === "juego" && !J.dentro && !J.jefeHud && !(A.ciervo && A.ciervo.activo) && (!window.OPCIONES || OPCIONES.v("brujula"));
    el.classList.toggle("oculto", !ver);
    if (!ver) return;
    if (--paseBr > 0) return;
    paseBr = 2;
    const cv = el.querySelector("canvas"),
      k0 = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== ANCHO * k0) {
      cv.width = ANCHO * k0;
      cv.height = ALTO * k0;
    }
    const c = cv.getContext("2d");
    c.setTransform(k0, 0, 0, k0, 0, 0);
    c.clearRect(0, 0, ANCHO, ALTO);
    // hacia dónde mira, suavizado para que no salte con cada golpe
    const quiere = Math.atan2(jug.dir[1], jug.dir[0]);
    if (rumbo == null) rumbo = quiere;
    let dif = Math.atan2(Math.sin(quiere - rumbo), Math.cos(quiere - rumbo));
    rumbo += dif * 0.18;
    const enX = (a) => {
      const r = Math.atan2(Math.sin(a - rumbo), Math.cos(a - rumbo));
      return { x: ANCHO / 2 + (r / CAMPO) * (ANCHO / 2), r };
    };
    // la banda: oscura en el medio y que se funde a los costados
    const g = c.createLinearGradient(0, 0, ANCHO, 0);
    g.addColorStop(0, "rgba(17,17,17,0)");
    g.addColorStop(0.18, "rgba(17,17,17,0.78)");
    g.addColorStop(0.82, "rgba(17,17,17,0.78)");
    g.addColorStop(1, "rgba(17,17,17,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, ANCHO, ALTO);
    // las rayas y los puntos cardinales (el norte es -y en el mundo)
    const CARD = t("ex.cardinales").split(",");
    c.textAlign = "center";
    c.textBaseline = "middle";
    for (let i = 0; i < 24; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 12,
        p = enX(a);
      if (Math.abs(p.r) > CAMPO) continue;
      const fade = 1 - Math.abs(p.r) / CAMPO;
      c.globalAlpha = Math.min(1, fade * 1.6);
      if (i % 3 === 0) {
        const n = CARD[i / 3];
        c.font = (i % 6 === 0 ? "700 13px" : "700 10px") + ' "Eromash Text", system-ui, sans-serif';
        c.fillStyle = i === 0 ? "#C8402D" : i % 6 === 0 ? "#F2ECEC" : "#E0B2B2";
        c.fillText(n, p.x, 27);
      } else {
        c.fillStyle = "#E0B2B2";
        c.fillRect(p.x - 0.5, 24, 1, 6);
      }
    }
    c.globalAlpha = 1;
    // la marquita del centro
    c.fillStyle = "#FFD98A";
    c.beginPath();
    c.moveTo(ANCHO / 2, 36);
    c.lineTo(ANCHO / 2 - 5, 42);
    c.lineTo(ANCHO / 2 + 5, 42);
    c.fill();
    // lo que se marca arriba de la banda: fuera del campo, el objetivo y la marca quedan en la punta
    const marcar = (x, y, dibujo, fijo) => {
      const a = Math.atan2(y - jug.y, x - jug.x),
        p = enX(a);
      if (Math.abs(p.r) > CAMPO) {
        if (!fijo) return;
        p.x = p.r > 0 ? ANCHO - 14 : 14;
        c.globalAlpha = 0.55;
      }
      dibujo(p.x, Math.hypot(x - jug.x, y - jug.y));
      c.globalAlpha = 1;
    };
    const metros = (x, d, col) => {
      c.font = '700 10px "Eromash Text", system-ui, sans-serif';
      c.fillStyle = col;
      c.textAlign = "left";
      c.fillText(Math.round(d / W.M) + " m", x + 10, 9);
      c.textAlign = "center";
    };
    // lugares sin descubrir cerca: un «?»
    LUGARES.forEach((id) => {
      const L = W.LUGARES[id];
      if (!L || A.H.E.vistos.includes(id)) return;
      if (Math.hypot(L.p[0] - jug.x, L.p[1] - jug.y) > 4500) return;
      marcar(L.p[0], L.p[1], (x) => {
        c.font = '700 14px "Eromash Text", system-ui, sans-serif';
        c.lineWidth = 3;
        c.strokeStyle = "#111111";
        c.strokeText("?", x, 10);
        c.fillStyle = "#E0B2B2";
        c.fillText("?", x, 10);
      });
    });
    // zonas de los mapas del tesoro: una X dorada
    if (window.SECRETOS)
      SECRETOS.pistas().forEach((z) => {
        if (Math.hypot(z.x - jug.x, z.y - jug.y) > 7000) return;
        marcar(z.x, z.y, (x) => {
          c.strokeStyle = "#FFD98A";
          c.lineWidth = 2.2;
          c.beginPath();
          c.moveTo(x - 4, 5);
          c.lineTo(x + 4, 13);
          c.moveTo(x + 4, 5);
          c.lineTo(x - 4, 13);
          c.stroke();
        });
      });
    // la marca propia (banderín dorado) y el objetivo (rombo rúnico), con la distancia
    const mk = window.MAPA && MAPA.marca();
    if (mk)
      marcar(mk[0], mk[1], (x, d) => {
        c.fillStyle = "#FFD98A";
        c.beginPath();
        c.moveTo(x - 1, 3);
        c.lineTo(x + 7, 7);
        c.lineTo(x - 1, 11);
        c.fill();
        c.fillRect(x - 2, 3, 1.6, 12);
        metros(x, d, "#FFD98A");
      }, true);
    const o = A.dondeObjetivo();
    if (o)
      marcar(o[0], o[1], (x, d) => {
        c.fillStyle = "#73D5DB";
        c.strokeStyle = "#111111";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(x, 3);
        c.lineTo(x + 6, 9);
        c.lineTo(x, 15);
        c.lineTo(x - 6, 9);
        c.closePath();
        c.fill();
        c.stroke();
        metros(x, d, "#73D5DB");
      }, true);
  }

  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      document.getElementById("capa").insertAdjacentHTML("beforebegin", `<div id="hudBrujula" class="ui oculto"><canvas></canvas></div>`);
    },
    alEmpezar(extra) {
      extra.explora = Object.assign({ hitos: -1 }, extra.explora || {});
      st = extra.explora;
      notados.clear();
      zonasVistas.clear();
      nota = null;
      rumbo = null;
      // una partida vieja no cobra de golpe lo que ya tenía explorado: arranca contando desde lo que hay
      // lo que ya estaba completo en una partida vieja no se festeja de nuevo
      if (!st.completos) {
        st.completos = {};
        cacheT = -9;
        completos().forEach((id) => (st.completos[id] = true));
      }
      if (st.hitos < 0) {
        const f = window.MAPA ? MAPA.explorado() : 0;
        st.hitos = HITOS.filter((h) => f >= h[0]).length;
      }
    },
    actualizar(dt) {
      if (J.modo !== "juego" || J.dentro) return;
      acum += dt;
      acumHito += dt;
      acumZumbido += dt;
      if (acum > 0.3) {
        acum = 0;
        notar();
        zonas();
      }
      if (acumHito > 2) {
        acumHito = 0;
        hitos();
        lugaresCompletos();
      }
      if (acumZumbido > 2.8) {
        acumZumbido = 0;
        zumbido();
      }
    },
    hud() {
      brujula();
    },
    // el «?» sobre Eromash y una flechita dorada hacia lo que notó
    objetos(lista, visible, c) {
      if (!nota) return;
      const e = J.t - nota.t;
      if (e > 1.6) return (nota = null);
      const k = e < 0.15 ? e / 0.15 : e > 1.2 ? (1.6 - e) / 0.4 : 1;
      lista.push({ y: jug.y + 2, f: () => {
        DIB.alfa(c, k, () => {
          const x = jug.x,
            y = jug.y - 150 - Math.sin(e * 6) * 3;
          c.font = '700 34px "Eromash Text", system-ui, sans-serif';
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.lineWidth = 6;
          c.strokeStyle = "#111111";
          c.strokeText("?", x, y);
          c.fillStyle = "#FFD98A";
          c.fillText("?", x, y);
          const a = Math.atan2(nota.y - jug.y, nota.x - jug.x),
            ax = jug.x + Math.cos(a) * 70,
            ay = jug.y - 30 + Math.sin(a) * 42;
          c.save();
          c.translate(ax, ay);
          c.rotate(a);
          DIB.P(c, [10, 0, -6, -7, -2, 0, -6, 7], "#FFD98A");
          c.restore();
        });
      } });
    },
    diario() {
      if (!window.MAPA) return "";
      const f = Math.floor(MAPA.explorado() * 100);
      const filas = LUGARES.filter((id) => A.H.E.vistos.includes(id))
        .map((id) => {
          const s = secretosDe(id);
          return s.n ? `<li>${t("av.lugar_" + id)} <b>${s.h === s.n ? "✓" : s.h + "/" + s.n}</b></li>` : "";
        })
        .join("");
      return `<div class="diario-resumen"><p><b>${t("ex.diario_titulo")}</b> ${t("ex.explorado", [f])}</p>${filas ? `<ul class="diario-lugares">${filas}</ul>` : ""}</div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { secretosDe };
})();
