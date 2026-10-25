// ---------- las facciones y la reputación (sistema FACCIONES) ----------
// Como la reputación del WoW y los gremios del Oblivion y el Morrowind: cuatro facciones de Eldervald recuerdan lo que
// Eromash hace por ellas, en cinco grados (Desconocido, Conocido, Amigo, Honrado, Exaltado; NIVELES de reputación):
//   · La Guardia del Roble (Eikholt): bandidos vencidos, guaridas saqueadas, contratos cobrados.
//     Da daño contra bandidos.
//   · Los Guardasendas de Eydis (el Puesto): misiones, lugares descubiertos, el tablón de cacería, los encuentros del
//     camino. Ingrid cobra menos.
//   · El Gremio de Brunvik: peces, platos cocinados, partidas de dados ganadas. Kolbrun cobra menos y vender paga más.
//   · El Pueblo Oculto: favor de los vættir, piedras y ritos despertados, hörgr visitados. Más energía rúnica.
// No toca los otros sistemas: mira sus estados guardados (FUENTES: cuánto vale cada cosa hecha) y suma la diferencia;
// una partida vieja cobra todo lo que ya hizo en silencio al cargar. Cada grado regala plata, el Honrado un fragmento
// y el Exaltado una pieza de la armería de la facción (cada una su casilla). Un estandarte de cada facción (el de la
// Guardia afuera de la Puerta del Sur, el de los Guardasendas a la entrada del Puesto, el del Gremio a la de Brunvik y el del Pueblo
// Oculto junto al primer vættr) muestra la reputación con E; también la casilla Reputación de la Bolsa.
// Estado en E.extra.facciones = { rep: { f: n }, cont: { fuente: n } }. Textos `fc.`.
window.FACCIONES = (function () {
  "use strict";
  let A, J, jug, W, ex = {};
  const t = (k, v) => I18N.t(k, v);
  const NIVELES = [0, 300, 900, 2000, 3800];
  const IDS = ["guardia", "sendas", "gremio", "ocultos"];
  const COLOR = { guardia: "#E0B2B2", sendas: "#7BC86C", gremio: "#8AA8C0", ocultos: "#9A6BD8" };
  const PIEZA = { guardia: "arma", sendas: "botas", gremio: "anillo", ocultos: "amuleto" };
  const BANDIDOS = ["bandido", "arquero"];
  const cuenta = (o) => Object.keys(o || {}).length;
  const suma = (o, f = (v) => v) => Object.values(o || {}).reduce((n, v) => n + (f(v) || 0), 0);
  // de dónde sale la reputación: [facción, puntos por cada una, cuántas hay hechas]
  const FUENTES = {
    saqueos: ["guardia", 80, () => cuenta(ex.bandidos && ex.bandidos.saqueados)],
    trofeos: ["guardia", 90, () => (ex.contratos && ex.contratos.trofeos ? ex.contratos.trofeos.length : 0)],
    misiones: ["sendas", 120, () => (A.H.E.mision || 0)],
    lugares: ["sendas", 25, () => (A.H.E.vistos ? A.H.E.vistos.length : 0)],
    tablon: ["sendas", 60, () => (ex.tablon && ex.tablon.hechos) || 0],
    encuentros: ["sendas", 30, () => suma(ex.encuentros && ex.encuentros.hechos)],
    peces: ["gremio", 6, () => suma(ex.pesca && ex.pesca.libro, (p) => p.n)],
    platos: ["gremio", 8, () => (ex.cocina && ex.cocina.platos) || 0],
    dados: ["gremio", 35, () => (ex.dados && ex.dados.ganadas) || 0],
    vaettir: ["ocultos", 60, () => suma(ex.vaettir && ex.vaettir.favor)],
    piedras: ["ocultos", 30, () => cuenta(ex.sec && ex.sec.piedras)],
    ritos: ["ocultos", 50, () => cuenta(ex.ritos && ex.ritos.ritos)],
    horgr: ["ocultos", 40, () => cuenta(ex.santuarios && ex.santuarios.vistos)],
  };
  const PTS_BANDIDO = 8,
    PTS_LIDER = 30,
    RADIO = 130;
  const base = () => ({ rep: {}, cont: {} });
  let st = base(),
    callado = true, // la primera mirada después de cargar no anuncia nada
    reloj = 0;
  const estandartes = []; // { f, x, y, cosa }

  // ---------- grados y bonos ----------
  const rep = (f) => st.rep[f] || 0;
  function grado(f) {
    const r = rep(f);
    let k = 0;
    while (k < NIVELES.length - 1 && r >= NIVELES[k + 1]) k++;
    return k;
  }
  const nombre = (f) => t("fc." + f);
  // lo que da cada grado (k de 0 a 4)
  const BONO = {
    guardia: (k) => 4 * k, // % de daño contra bandidos
    sendas: (k) => 4 * k, // % menos con Ingrid
    gremio: (k) => [4 * k, 3 * k], // % menos con Kolbrun, % más al vender
    ocultos: (k) => 5 * k, // % de energía rúnica
  };
  function textoBono(f) {
    const k = grado(f);
    if (!k) return t("fc.sin_bono");
    const b = BONO[f](k);
    return f === "gremio" ? t("fc.bono_gremio", b) : t("fc.bono_" + f, [b]);
  }

  // ---------- sumar ----------
  function dar(f, n, x, y) {
    if (!(n > 0) || !IDS.includes(f)) return;
    const antes = grado(f);
    st.rep[f] = rep(f) + Math.round(n);
    if (!callado) mostrar(f, Math.round(n), x, y);
    const k = grado(f);
    for (let g = antes + 1; g <= k; g++) subir(f, g);
    if (f === "ocultos" && k !== antes && window.RPG) RPG.recalcular();
    if (window.INVENTARIO) INVENTARIO.repintar();
  }
  function mostrar(f, n, x, y) {
    if (!J.textos || (window.OPCIONES && !OPCIONES.v("numeros"))) return;
    const junto = J.textos.find((o) => o.fc === f && o.t < 0.7);
    if (junto) {
      junto.suma += n;
      junto.n = t("fc.mas", [junto.suma, nombre(f)]);
      junto.t = Math.min(junto.t, 0.2);
      return;
    }
    // uno arriba del otro si suben dos facciones a la vez
    const encima = J.textos.filter((o) => o.fc && o.t < 0.7).length;
    J.textos.push({ x: x != null ? x : jug.x, y: (y != null ? y : jug.y) - 150 - encima * 26, n: t("fc.mas", [n, nombre(f)]), t: 0, col: COLOR[f], palabra: true, fc: f, suma: n });
  }
  // un grado nuevo: el cartel y el regalo
  function subir(f, k) {
    const plata = 40 * k;
    const avisar = (m, col, ti) => (callado ? null : J.retrasar(0.3, () => HUD.aviso(m, col, ti)));
    avisar(t("fc.sube", [t("fc.n" + k), nombre(f)]), "lugar", t("fc.sube_t"));
    PODERES.pj().plata += plata;
    if (!callado) J.retrasar(2, () => HUD.aviso(t("fc.regalo", [nombre(f), plata]), "#FFD98A"));
    if (k === 3) {
      PODERES.darFragmento();
      if (!callado) J.retrasar(3.5, () => HUD.aviso(t("fc.regalo_frag", [nombre(f)]), "#73D5DB"));
    }
    if (k === 4 && window.BOTIN && window.OBJETOS) {
      const it = OBJETOS.generar({ n: window.RPG ? RPG.nivel() : 1, slot: PIEZA[f], min: 2, hallazgo: 3 });
      J.retrasar(callado ? 0.5 : 3.5, () => (BOTIN.tirar(jug.x, jug.y - 30, it, true), HUD.aviso(t("fc.regalo_pieza", [nombre(f)]), "#F5A524")));
    }
    if (!callado && window.SONIDO) SONIDO.tocar("mision", { vol: 0.5, tono: 1.2 });
    if (!callado && window.ANIMA) ANIMA.gesto("feliz");
  }
  // mira los estados de los otros sistemas y suma lo nuevo
  function mirar() {
    const nuevo = {};
    for (const [k, [f, pts, cuantas]] of Object.entries(FUENTES)) {
      let n = 0;
      try {
        n = cuantas() || 0;
      } catch (e) {
        n = st.cont[k] || 0;
      }
      const d = n - (st.cont[k] || 0);
      if (d > 0) nuevo[f] = (nuevo[f] || 0) + d * pts;
      st.cont[k] = Math.max(n, st.cont[k] || 0);
    }
    for (const f of IDS) if (nuevo[f]) dar(f, nuevo[f]);
    callado = false;
  }

  // ---------- la ventana ----------
  const emblemas = {};
  function emblemaImg(f) {
    if (emblemas[f]) return emblemas[f];
    const cv = document.createElement("canvas");
    cv.width = cv.height = 64;
    FACCIONES_DIBUJO.emblema(cv.getContext("2d"), f, 32, 32, 28);
    return (emblemas[f] = cv.toDataURL());
  }
  function fila(f, solo) {
    const k = grado(f),
      r = rep(f),
      tope = k >= NIVELES.length - 1,
      de = NIVELES[k],
      a = tope ? de : NIVELES[k + 1],
      pct = tope ? 100 : Math.round(((r - de) / (a - de)) * 100);
    return `<div class="fc-fila"><img src="${emblemaImg(f)}" alt=""><div><b>${nombre(f)}</b> <span class="fc-grado" style="color:${COLOR[f]}">${t("fc.n" + k)}</span><div class="fc-barra"><i style="width:${pct}%;background:${COLOR[f]}"></i></div><small>${tope ? t("fc.tope", [r]) : t("fc.falta", [r, a, t("fc.n" + (k + 1))])}</small><p>${textoBono(f)}</p>${solo ? `<p class="fc-como">${t("fc." + f + "_d")}</p>` : ""}</div></div>`;
  }
  function ventana(solo) {
    if (window.INVENTARIO && INVENTARIO.abierta()) INVENTARIO.cerrar();
    const lista = solo ? [solo] : IDS;
    A.menu(`<h2>${solo ? nombre(solo) : t("fc.titulo")}</h2><div class="sub">${t("fc.titulo_d")}</div><div class="fc-lista">${lista.map((f) => fila(f, !!solo)).join("")}</div>`, [{ texto: t("ui.cerrar"), fn: A.cerrarMenu }]);
  }

  // ---------- los estandartes ----------
  function libreCerca(x0, y0, rMax, fuera) {
    for (let r = 0; r < rMax; r += 40)
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2 + r * 0.02,
          x = x0 + Math.cos(a) * r,
          y = y0 + Math.sin(a) * r * 0.8;
        if (W.sueloEn(x, y) !== 0 || (fuera && !fuera(x, y))) continue;
        if (W.CAMINOS.some((c) => W.distLinea(x, y, c.p) < c.w / 2 + 40)) continue;
        // libre alrededor, adelante (donde se para quien lo mira) y atrás (lo alto del paño)
        if ([[0, 0], [-90, 0], [90, 0], [0, 90], [0, 180], [-60, -80], [60, -80]].every(([dx, dy]) => W.libre(x + dx, y + dy, 30))) return [x, y];
      }
    return null;
  }
  // a la entrada de un pueblo: junto al camino que entra, donde corta el borde del lugar
  function entrada(L) {
    let mejor = null;
    W.CAMINOS.forEach((c) => {
      for (let i = 0; i < c.p.length - 1; i++) {
        const a = c.p[i],
          b = c.p[i + 1],
          l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        for (let u = 0; u <= l; u += 40) {
          const x = a[0] + ((b[0] - a[0]) / l) * u,
            y = a[1] + ((b[1] - a[1]) / l) * u,
            d = Math.abs(Math.hypot(x - L.p[0], y - L.p[1]) - L.r * 0.85);
          if (!mejor || d < mejor.d) mejor = { d, x, y, nx: -(b[1] - a[1]) / l, ny: (b[0] - a[0]) / l, w: c.w };
        }
      }
    });
    if (!mejor) return null;
    for (const lado of [1, -1]) {
      const p = libreCerca(mejor.x + mejor.nx * lado * (mejor.w / 2 + 110), mejor.y + mejor.ny * lado * (mejor.w / 2 + 110), 260);
      if (p) return p;
    }
    return null;
  }
  function armar() {
    const L = W.LUGARES,
      C = W.CIUDAD;
    const fueraCiudad = (x, y) => Math.hypot((x - C.c[0]) / (C.rx + 260), (y - C.c[1]) / ((C.ry || C.rx / 1.3) + 260)) > 1;
    const sitios = {
      guardia: () => libreCerca(C.c[0] + 200, C.c[1] + (C.ry || C.rx / 1.3) + 380, 1200, fueraCiudad),
      sendas: () => L.puesto && entrada(L.puesto),
      gremio: () => L.brunvik && entrada(L.brunvik),
      ocultos: () => window.VAETTIR && VAETTIR.hogares[0] && libreCerca(VAETTIR.hogares[0].x + 200, VAETTIR.hogares[0].y + 80, 500),
    };
    for (const f of IDS) {
      const p = sitios[f]();
      if (!p) continue;
      // un claro chico para que se vea (los árboles de adelante tapan más)
      W.cercanas(p[0] - 260, p[1] - 200, p[0] + 260, p[1] + 420, (o) => {
        if (!o.arbol) return;
        const dy = o.y - p[1];
        if (Math.hypot(o.x - p[0], dy > 0 ? dy * 0.5 : dy) > 230) return;
        o.oculto = true;
        o.choque = null;
      });
      const cosa = W.agregar("estandarteFaccion", p, { f });
      estandartes.push({ f, x: p[0], y: p[1], cosa });
    }
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      armar();
      if (window.RPG)
        RPG.aporte((s) => {
          const k = grado("ocultos");
          if (k) s.regenRunica *= 1 + BONO.ocultos(k) / 100;
        }, "facciones");
      if (window.COMERCIO)
        COMERCIO.modPrecio((p, info) => {
          if (info.tipo === "compra" && info.mercader === "ingrid") return p * (1 - BONO.sendas(grado("sendas")) / 100);
          if (info.tipo === "compra" && info.mercader === "kolbrun") return p * (1 - BONO.gremio(grado("gremio"))[0] / 100);
          if (info.tipo === "venta") return p * (1 + BONO.gremio(grado("gremio"))[1] / 100);
          return p;
        });
      if (window.INVENTARIO && INVENTARIO.iconoDe) INVENTARIO.iconoDe("fc_rep", (c) => (FACCIONES_DIBUJO.emblema(c, "sendas", -10, 4, 16), FACCIONES_DIBUJO.emblema(c, "guardia", 10, -2, 18)));
    },
    alEmpezar(extra) {
      ex = extra;
      extra.facciones = Object.assign(base(), extra.facciones || {});
      st = extra.facciones;
      callado = true;
      reloj = 0;
      if (window.RPG) RPG.recalcular();
    },
    actualizar(dt) {
      if (!A || !A.H || !A.H.E) return;
      reloj -= dt;
      if (reloj > 0) return;
      reloj = 0.5;
      mirar();
    },
    alMorir(e) {
      if (!e || !e.d || e.d.blanco || !BANDIDOS.includes(e.tipo)) return;
      dar("guardia", e.lider || e.patron ? PTS_LIDER : PTS_BANDIDO, e.x, e.y);
    },
    modDano(dano, e) {
      const k = grado("guardia");
      return e && k && BANDIDOS.includes(e.tipo) ? dano * (1 + BONO.guardia(k) / 100) : dano;
    },
    cercanos(dar) {
      if (J.dentro) return;
      for (const s of estandartes) {
        const d = Math.hypot(s.x - jug.x, s.y - jug.y);
        if (d < RADIO) dar(d, t("fc.ver", [nombre(s.f)]), () => ventana(s.f), s.x, s.y - 190);
      }
    },
    marcasMapa() {
      return estandartes.map((s) => ({ tipo: "faccion", x: s.x, y: s.y, op: { nombre: nombre(s.f), f: s.f } }));
    },
    celdasBolsa() {
      return IDS.some((f) => rep(f) > 0) ? [{ id: "fc_rep", icono: "fc_rep", nombre: t("fc.bolsa"), col: "#E0B2B2", desc: t("fc.bolsa_d"), fn: () => ventana() }] : [];
    },
    diario() {
      const con = IDS.filter((f) => rep(f) > 0);
      if (!con.length) return "";
      const filas = con.map((f) => `<li><b>${nombre(f)}</b> · ${t("fc.n" + grado(f))} (${rep(f)}) · ${textoBono(f)}</li>`).join("");
      return `<div class="diario-resumen"><p><b>${t("fc.diario_t")}</b></p><ul>${filas}</ul></div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, dar, rep, grado, ventana, mirar, estandartes, textoBono, NIVELES, IDS, FUENTES, BONO, PIEZA };
})();
