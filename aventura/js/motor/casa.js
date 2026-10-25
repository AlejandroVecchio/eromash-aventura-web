// ---------- la casa propia (sistema CASA) ----------
// Como las casas de Fable y Skyrim (Hearthfire): la casa de Hrolf el cazador, a un costado del camino que sale del
// Puesto, está en venta (un letrero de Eydis enfrente). Se compra por PRECIO de plata y desde entonces se entra con E
// como cualquier casa (interiores.js arma su cuarto con INTERIORES.CUARTOS.propia): el hogar, la cama, la mesa con los
// planos y lo que se le vaya haciendo. Las mejoras (MEJORAS) cuestan plata y materiales y se ven puestas:
//   · El arcón: guarda hasta ARCON piezas que no entran en la Bolsa.
//   · El armero: +4 % de daño siempre. La estantería: +5 % de experiencia siempre (y muestra los libros leídos).
//   · El fogón del patio: un fogonOlla de verdad frente a la casa (la cocina lo usa sola).
//   · La huerta: cada día del juego da dos hierbas y a veces una manzana. La cama de pieles de oso: dormir en ella deja
//     «Bien abrigado», +10 % de experiencia durante 10 minutos.
// Comprada, «Tu casa» aparece entre los destinos de viaje y en el mapa. Estado en E.extra.casa = { tuya, hechas:
// { id: 1 }, arcon: [pieza], cosecha }. Textos `hg.`.
window.CASA = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const PRECIO = 500,
    ARCON = 30,
    RADIO = 140;
  const MEJORAS = {
    arcon: { plata: 150, mats: { cuero: 4 } },
    armero: { plata: 250, mats: { hierro: 6 } },
    estante: { plata: 200, mats: { ambar: 2 } },
    fogon: { plata: 120, mats: { hierro: 3 } },
    huerta: { plata: 100, mats: { cuero: 2 } },
    cama: { plata: 300, mats: { cuero: 6 } },
  };
  const base = () => ({ tuya: false, hechas: {}, arcon: [], cosecha: -1, abrigo: 0 });
  const ABRIGO = 600; // segundos de «Bien abrigado» al dormir en la cama de pieles: +10 % de experiencia
  let st = base();
  let casa = null, // { x, y, cosa, letrero, huerta, fogon, puerta }
    lugar = null;
  const hecha = (id) => !!st.hechas[id];
  const dia = () => Math.floor(A.H.E.tiempo / LUZ.DIA);

  // ---------- dónde: junto al camino que sale del Puesto ----------
  function buscarLugar() {
    const L = W.LUGARES.puesto;
    if (!L) return null;
    const cands = [];
    W.CAMINOS.forEach((c) => {
      for (let i = 0; i < c.p.length - 1; i++) {
        const a = c.p[i],
          b = c.p[i + 1],
          l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        for (let u = 0; u <= l; u += 60) {
          const x = a[0] + ((b[0] - a[0]) / l) * u,
            y = a[1] + ((b[1] - a[1]) / l) * u,
            d = Math.hypot(x - L.p[0], y - L.p[1]);
          if (d < L.r + 600 || d > L.r + 2200) continue;
          const nx = -(b[1] - a[1]) / l,
            ny = (b[0] - a[0]) / l;
          [1, -1].forEach((lado) => cands.push({ x: x + nx * lado * (c.w / 2 + 420), y: y + ny * lado * (c.w / 2 + 420), d }));
        }
      }
    });
    cands.sort((p, q) => p.d - q.d);
    const firme = (x, y) => [[0, 0], [-260, 0], [260, 0], [0, 200], [-380, 80], [240, 260], [0, -120]].every(([dx, dy]) => W.sueloEn(x + dx, y + dy) === 0);
    const lejosDeTodo = (x, y) =>
      Object.keys(W.LUGARES).every((k) => Math.hypot(x - W.LUGARES[k].p[0], y - W.LUGARES[k].p[1]) > W.LUGARES[k].r + 300) &&
      W.CAMINOS.every((c) => W.distLinea(x, y, c.p) > c.w / 2 + 260) &&
      HORDAS.grupos.every((g) => Math.hypot(g.centro[0] - x, g.centro[1] - y) > 1400);
    // sin cosas armadas encima (lo que no es bosque)
    const despejado = (x, y) => {
      let si = true;
      W.cercanas(x - 460, y - 260, x + 460, y + 360, (o) => {
        if (o.choque && !o.arbol && o.id !== "roca" && o.id !== "troncoCaido" && !o.oculto) si = false;
      });
      return si;
    };
    return cands.find((p) => firme(p.x, p.y) && lejosDeTodo(p.x, p.y) && despejado(p.x, p.y)) || null;
  }
  function armar() {
    const p = buscarLugar();
    if (!p) return;
    const x = Math.round(p.x),
      y = Math.round(p.y);
    // el claro de la casa, el patio y la huerta
    W.cercanas(x - 700, y - 500, x + 700, y + 700, (o) => {
      if (!o.arbol && o.id !== "roca" && o.id !== "troncoCaido") return;
      const dy = o.y - y;
      if (Math.hypot(o.x - x, dy > 0 ? dy * 0.6 : dy * 1.2) > 560) return;
      o.oculto = true;
      o.choque = null;
    });
    const cosa = W.agregar("casaNordica", [x, y], { v: 0, sem: 4, pared: 1, techo: 2, entra: false, sinPlano: true });
    const letrero = W.agregar("letreroVenta", [x + 230, y + 150], {});
    const huerta = W.agregar("huertaCasa", [x - 360, y + 90], { crece: 0 });
    huerta.oculto = true;
    casa = { x, y, cosa, letrero, huerta, fogon: null };
    casa.puerta = INTERIORES.agregarPuerta(cosa, "propia", { clave: "propia", puede: () => st.tuya });
  }
  // lo de afuera según lo hecho
  function mostrarAfuera() {
    if (!casa) return;
    casa.letrero.o.vendida = st.tuya;
    casa.huerta.oculto = !hecha("huerta");
    if (hecha("fogon") && !casa.fogon) casa.fogon = W.agregar("fogonOlla", [casa.x + 190, casa.y + 300], { s: 0.9 });
    if (casa.fogon) casa.fogon.o.apagado = !hecha("fogon");
  }

  // ---------- comprar y mejorar ----------
  function verLetrero() {
    const pj = PODERES.pj();
    const cab = `<h2>${t("hg.casa_hrolf")}</h2>`;
    if (st.tuya) return A.menu(cab + `<p>${t("hg.ya_tuya")}</p>`, [{ texto: t("ui.cerrar"), fn: A.cerrarMenu }]);
    A.menu(cab + `<p>${t("hg.venta_d")}</p>`, [
      { texto: t("hg.comprar", [PRECIO]), sub: pj.plata >= PRECIO ? t("hg.comprar_d") : t("hg.sin_plata", [PRECIO - pj.plata]), fn: () => (A.cerrarMenu(), comprar()) },
      { texto: t("ui.cerrar"), fn: A.cerrarMenu },
    ]);
  }
  function comprar() {
    const pj = PODERES.pj();
    if (st.tuya) return false;
    if (pj.plata < PRECIO) {
      HUD.aviso(t("hg.sin_plata", [PRECIO - pj.plata]), "#C8402D");
      return false;
    }
    pj.plata -= PRECIO;
    st.tuya = true;
    mostrarAfuera();
    HUD.aviso(t("hg.comprada"), "lugar", t("hg.comprada_t"));
    if (window.SONIDO) SONIDO.tocar("mision", { vol: 0.6 });
    if (window.ANIMA) ANIMA.gesto("feliz");
    if (window.VIDA) VIDA.evento("lugar", casa.x, casa.y);
    return true;
  }
  const faltaDe = (id) => {
    const M = MEJORAS[id],
      f = [];
    const pj = PODERES.pj();
    if (pj.plata < M.plata) f.push(M.plata - pj.plata + " " + t("hg.plata"));
    for (const [k, n] of Object.entries(M.mats)) if (MATERIALES.cuantos(k) < n) f.push(n - MATERIALES.cuantos(k) + " " + t("mt." + k));
    return f;
  };
  const costo = (id) => {
    const M = MEJORAS[id];
    return [M.plata + " " + t("hg.plata")].concat(Object.entries(M.mats).map(([k, n]) => n + " " + t("mt." + k))).join(" · ");
  };
  function construir(id) {
    if (!st.tuya || hecha(id) || !MEJORAS[id]) return false;
    const f = faltaDe(id);
    if (f.length) {
      HUD.aviso(t("hg.falta", [f.join(", ")]), "#C8402D");
      return false;
    }
    PODERES.pj().plata -= MEJORAS[id].plata;
    MATERIALES.gastar(MEJORAS[id].mats);
    st.hechas[id] = 1;
    mostrarAfuera();
    // si está adentro, el mueble nuevo aparece en su lugar
    const q = window.INTERIORES && INTERIORES.cuarto();
    if (q && q.tipo === "propia") {
      const m = mueblesDe(id);
      if (m) q.muebles.push(m);
    }
    if (window.RPG) RPG.recalcular();
    HUD.aviso(t("hg.construida", [t("hg.m_" + id)]), "#7BC86C");
    if (window.SONIDO) SONIDO.tocar("crujido", { vol: 0.6, tono: 0.8 });
    if (window.INVENTARIO) INVENTARIO.repintar();
    return true;
  }
  function planos() {
    const bot = Object.keys(MEJORAS).map((id) => ({
      texto: t("hg.m_" + id) + (hecha(id) ? " · " + t("hg.hecha") : ""),
      sub: t("hg.m_" + id + "_d", [ARCON]) + (hecha(id) ? "" : " · " + costo(id)),
      fn: () => (hecha(id) ? null : (A.cerrarMenu(), construir(id))),
    }));
    bot.push({ texto: t("ui.cerrar"), fn: A.cerrarMenu });
    A.menu(`<h2>${t("hg.planos_t")}</h2><div class="sub">${t("hg.planos_d")}</div>`, bot);
  }

  // ---------- el arcón ----------
  function guardar(i) {
    const B = BOTIN.estado();
    if (st.arcon.length >= ARCON) return HUD.aviso(t("hg.arcon_lleno"), "#C8402D"), false;
    const it = B.bolsa[i];
    if (!it) return false;
    B.bolsa.splice(i, 1);
    st.arcon.push(it);
    if (window.INVENTARIO) INVENTARIO.repintar();
    return true;
  }
  function sacar(i) {
    const it = st.arcon[i];
    if (!it) return false;
    if (!BOTIN.dar(it, { silencio: true })) return HUD.aviso(t("hg.bolsa_llena"), "#C8402D"), false;
    st.arcon.splice(i, 1);
    return true;
  }
  function arcon() {
    const B = BOTIN.estado(),
      nombre = (it) => OBJETOS.nombre(it);
    const bot = [];
    B.bolsa.forEach((it, i) => bot.push({ texto: t("hg.guardar", [nombre(it)]), sub: t("hg.de_bolsa"), fn: () => (guardar(i), arcon()) }));
    st.arcon.forEach((it, i) => bot.push({ texto: t("hg.sacar", [nombre(it)]), sub: t("hg.del_arcon"), fn: () => (sacar(i), arcon()) }));
    bot.push({ texto: t("ui.cerrar"), fn: A.cerrarMenu });
    A.menu(`<h2>${t("hg.arcon_t")}</h2><div class="sub">${bot.length > 1 ? t("hg.arcon_d", [st.arcon.length, ARCON]) : t("hg.vacio")}</div>`, bot);
  }

  // ---------- la huerta ----------
  const lista = () => hecha("huerta") && dia() > st.cosecha;
  function cosechar() {
    if (!lista()) return HUD.aviso(t("hg.no_lista"), "#8A8478"), false;
    st.cosecha = dia();
    const H = Object.keys(ALQUIMIA.HIERBAS),
      r = DIB.azar(dia() * 31 + 7),
      dio = [];
    for (let k = 0; k < 2; k++) {
      const h = H[Math.floor(r() * H.length)];
      const al = ALQUIMIA.estado().hierbas;
      al[h] = (al[h] || 0) + 1;
      dio.push(t("aq.h_" + h));
    }
    if (r() < 0.35) {
      PODERES.darManzana();
      dio.push(t("hg.manzana"));
    }
    HUD.aviso(t("hg.cosecha", [dio.join(", ")]), "#7BC86C");
    if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.5 });
    return true;
  }

  // ---------- el cuarto ----------
  let ayudaCuarto = null;
  function mueblesDe(id) {
    if (!ayudaCuarto) return null;
    const mk = (mid, x, y, o, r, accion, fn) => ({ id: mid, x, y, o: Object.assign({ s: 1 }, o), r, accion, fn });
    if (id === "arcon") return mk("arconCasa", 1380, 860, { abierto: false }, 90, "hg.accion_arcon", arcon);
    if (id === "armero") return mk("armero", 420, 620, { s: 0.9 }, 140, "hg.accion_armero", () => A.dialogoLibre([["eromash", "hg.armero_dice"]]));
    if (id === "estante") return mk("estanteRollos", 640, 610, { s: 0.9, sem: 0.4 }, 140, "hg.accion_estante", () => HUD.aviso(t("hg.estante_dice", [window.LIBROS ? LIBROS.IDS.filter((k) => LIBROS.estado().leidos[k]).length : 0]), "#E0B2B2"));
    return null;
  }
  function cuarto(ayuda) {
    ayudaCuarto = ayuda;
    ayuda.hogar(1000);
    // la cama: la de pieles de oso deja «Bien abrigado» (+10 % de experiencia por 10 minutos)
    ayuda.mueble("camaPieles", 1220, 770, { s: hecha("cama") ? 1.1 : 0.95 }, 210, "in.accion_cama", () => {
      ayuda.dormir();
      if (!hecha("cama")) return;
      st.abrigo = ABRIGO;
      HUD.aviso(t("hg.abrigado"), "#FFD98A");
      if (window.RPG) RPG.recalcular();
    });
    ayuda.mueble("mesaBanco", 760, 830, {}, 170, "hg.accion_planos", planos);
    ["arcon", "armero", "estante"].forEach((id) => {
      if (!hecha(id)) return;
      const m = mueblesDe(id);
      ayuda.mueble(m.id, m.x, m.y, m.o, m.r, m.accion, m.fn);
    });
    return { pared: "cabana", ventana: 1100, repisa: true };
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      if (window.INTERIORES) {
        INTERIORES.CUARTOS.propia = cuarto;
        armar();
      }
      if (window.RPG)
        RPG.aporte((s) => {
          if (hecha("armero")) s.dano *= 1.04;
          if (hecha("estante")) s.xp *= 1.05;
        }, "casa");
      if (window.RPG) RPG.aporte((s) => st.abrigo > 0 && (s.xp *= 1.1), "casa");
    },
    alEmpezar(extra) {
      extra.casa = Object.assign(base(), extra.casa || {});
      st = extra.casa;
      mostrarAfuera();
      if (window.RPG) RPG.recalcular();
    },
    actualizar(dt) {
      if (st.abrigo > 0 && J.modo === "juego" && (st.abrigo -= dt) <= 0) {
        st.abrigo = 0;
        if (window.RPG) RPG.recalcular();
      }
      if (!casa || !hecha("huerta")) return;
      // la huerta crece durante el día y queda lista hasta que se cosecha
      casa.huerta.o.crece = lista() ? 1 : Math.min(0.9, (A.H.E.tiempo / LUZ.DIA) % 1);
    },
    cercanos(dar) {
      if (!casa || J.dentro) return;
      const dl = Math.hypot(casa.letrero.x - jug.x, casa.letrero.y - jug.y);
      if (dl < RADIO) dar(dl, t("hg.letrero"), verLetrero, casa.letrero.x, casa.letrero.y - 140);
      if (hecha("huerta")) {
        const dh = Math.hypot(casa.huerta.x - jug.x, casa.huerta.y - jug.y);
        if (dh < RADIO + 60 && lista()) dar(dh, t("hg.cosechar"), cosechar, casa.huerta.x, casa.huerta.y - 60);
      }
    },
    destinoViaje() {
      return st.tuya && casa ? { texto: t("hg.viaje"), p: [casa.x + 60, casa.y + 200], lugar: "casa" } : null;
    },
    marcasMapa() {
      return casa ? [{ tipo: "casa", x: casa.x, y: casa.y, op: { nombre: t(st.tuya ? "hg.mapa" : "hg.mapa_venta"), apagado: false } }] : [];
    },
    diario() {
      if (!st.tuya) return "";
      const h = Object.keys(MEJORAS).filter(hecha).map((id) => t("hg.m_" + id));
      return `<div class="diario-resumen"><p><b>${t("hg.diario_t")}</b> ${t("hg.diario", [h.length ? h.join(", ") : t("hg.nada_hecho")])}</p></div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, casa: () => casa, comprar, construir, planos, arcon, guardar, sacar, cosechar, lista, verLetrero, MEJORAS, PRECIO, ARCON };
})();
