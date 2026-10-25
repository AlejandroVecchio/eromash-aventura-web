// ---------- el descanso (sistema DESCANSO) ----------
// Como esperar en Skyrim, meditar en The Witcher y la fogata de Dark Souls: junto a un fuego encendido («Descansar junto
// al fuego» en el menú de la fogata) o en el petate de pieles de los refugios y del paso, Eromash pasa unas horas
// (hasta el alba, el mediodía, el atardecer, la noche o una hora). El tiempo corre rápido y se ve: el cielo cambia, el
// reloj del cartel gira y E o ✕ despiertan antes. Al levantarse: vida y estamina llenas, el frasco lleno, las toxinas
// limpias (4 h o más) y el bosque se vuelve a llenar (los grupos muertos lejos vuelven, menos los únicos).
// Seis horas o más dejan «Bien descansado» (+10 % de experiencia al aire libre, +15 % en un refugio) por diez minutos.
// Al aire libre, si se duerme de noche, puede venir una manada (con semilla por día: la misma noche trae lo mismo).
// Cada noche dormida entera trae un sueño, en orden. La cama de las casas también cuenta (`dormido`, de interiores.js).
// Estado en E.extra.descanso = { veces, suenos, descansado, k }. Textos `ds.` en textos/descanso.js.
window.DESCANSO = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const REFUGIOS = ["puesto", "refugio", "casa_lindes", "brunvik", "aserradero"];
  // a qué hora se despierta cada opción
  const METAS = [["alba", 6], ["mediodia", 12], ["atardecer", 18], ["noche", 22]];
  const SUENOS = 6,
    BIEN = 6, // horas para quedar bien descansado
    DURA_BIEN = 600, // segundos que dura
    LIMPIA = 4, // horas para que se vayan las toxinas y vuelva el bosque
    LEJOS = 1400, // los grupos más cerca que esto no vuelven (se verían aparecer)
    EMBOSCADA = 0.35; // al aire libre, de noche
  const base = () => ({ veces: 0, suenos: 0, descansado: 0, k: 0 });
  let st = base();
  let petates = [];
  let rato = null; // el descanso de ahora: { total, hecho, sitio, corte, h0, noche }
  let el = null;

  const hora = () => LUZ.hora(A.H.E.tiempo);
  const horaTexto = (h) => t("ds.hora", [String(Math.floor(((h % 24) + 24) % 24)).padStart(2, "0")]);
  const enRefugio = (x, y) => REFUGIOS.some((k) => W.LUGARES[k] && Math.hypot(x - W.LUGARES[k].p[0], y - W.LUGARES[k].p[1]) < W.LUGARES[k].r);
  const horasHasta = (meta) => (meta - hora() + 24) % 24;

  // ---------- los petates ----------
  function ubicar() {
    petates = [];
    const N = W.NOMBRADAS || {};
    ["fogon", "fogon_refugio", "fogon_paso", "fogon_aserradero"].forEach((n, i) => {
      const f = N[n];
      if (!f) return;
      let p = null;
      for (let k = 0; k < 90 && !p; k++) {
        const a = 0.6 + i + k * 0.73,
          d = 150 + (k % 6) * 22,
          x = f.x + Math.cos(a) * d,
          y = f.y + Math.sin(a) * d * 0.7;
        if (W.libre(x, y, 50) && W.libre(x + 60, y, 20) && !W.CAMINOS.some((c) => W.distLinea(x, y, c.p) < c.w / 2 + 30)) p = [x, y];
      }
      p = p || [f.x + 170, f.y + 40];
      petates.push({ id: n, fogon: f, cosa: W.agregar("petateEromash", p, { sem: i * 3 + 1 }) });
    });
  }

  // ---------- el menú ----------
  function menu(sitio) {
    if (A.enPelea()) return HUD.aviso(t("ds.pelea"), "#C8402D");
    const seguro = sitio.seguro != null ? sitio.seguro : enRefugio(sitio.x, sitio.y);
    sitio.seguro = seguro;
    const bot = METAS.filter(([, h]) => horasHasta(h) >= 1).map(([id, h]) => {
      const n = Math.round(horasHasta(h));
      return { texto: t("ds." + id), sub: t("ds.horas", [n, horaTexto(h)]), fn: () => (A.cerrarMenu(), empezar(horasHasta(h), sitio)) };
    });
    bot.push({ texto: t("ds.una_hora"), sub: t("ds.una_hora_d", [horaTexto(hora() + 1)]), fn: () => (A.cerrarMenu(), empezar(1, sitio)) });
    bot.push({ texto: t("ui.cerrar"), fn: A.cerrarMenu });
    A.menu(`<h2>${t("ds.titulo")}</h2><div class="sub">${t("ds.sub", [horaTexto(hora())])} ${t(seguro ? "ds.seguro" : "ds.afuera")}</div>`, bot);
  }

  // ---------- descansar ----------
  // ¿las horas de h0 a h0 + n pasan por la noche cerrada (22 a 4)? devuelve cuántas horas faltan para entrar, o -1
  function entraNoche(h0, n) {
    for (let k = 0; k <= n; k += 0.25) {
      const h = (h0 + k) % 24;
      if (h >= 22 || h < 4) return k;
    }
    return -1;
  }
  function empezar(horas, sitio) {
    if (rato || A.enPelea()) return false;
    sitio = sitio || { x: jug.x, y: jug.y };
    if (sitio.seguro == null) sitio.seguro = enRefugio(sitio.x, sitio.y);
    const h0 = hora(),
      noche = entraNoche(h0, horas);
    // al aire libre, de noche, con semilla por día y por lugar
    let corte = -1;
    if (!sitio.seguro && noche >= 0) {
      const dia = Math.floor(A.H.E.tiempo / LUZ.DIA);
      const r = DIB.azar(dia * 131 + Math.round(sitio.x / 100) * 7 + Math.round(sitio.y / 100))();
      if (r < EMBOSCADA) corte = Math.min(horas, noche + 1 + r * 2);
    }
    rato = { total: horas, hecho: 0, sitio, corte, h0, noche, dur: Math.min(3.2, 1.2 + horas * 0.2) };
    J.modo = "cine";
    jug.atk = null;
    jug.vx = jug.vy = 0;
    if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.5, tono: 0.8 });
    mostrar(true);
    return true;
  }
  function paso(dt) {
    const r = rato;
    const meta = r.corte >= 0 ? r.corte : r.total;
    const d = Math.min(meta - r.hecho, (r.total / r.dur) * dt);
    r.hecho += d;
    A.H.E.tiempo += (d / 24) * LUZ.DIA;
    if (window.ALQUIMIA) ALQUIMIA.estado().reloj += (d / 24) * LUZ.DIA;
    jug.hp = Math.min(jug.hpMax, jug.hp + jug.hpMax * (d / Math.max(1, r.total)));
    pintar();
    const corta = r.hecho > 0.3 && (CONTROLES.recien("interactuar") || CONTROLES.recien("seguir") || CONTROLES.recien("atacar"));
    if (r.hecho >= meta - 1e-6 || corta) terminar(r.corte >= 0 && r.hecho >= r.corte - 1e-6);
  }
  function terminar(emboscada) {
    const r = rato;
    rato = null;
    mostrar(false);
    J.modo = "juego";
    CONTROLES.soltar();
    st.veces++;
    const horas = r.hecho;
    HUD.aviso(t("ds.despertaste", [Math.max(1, Math.round(horas))]), "#E0B2B2");
    const p = petates.find((q) => Math.hypot(q.cosa.x - r.sitio.x, q.cosa.y - r.sitio.y) < 10);
    if (p) p.cosa.o.usado = true;
    efectos(horas, r.sitio.seguro, emboscada, r.noche >= 0 && r.noche + 2 <= horas);
    if (emboscada) manada();
    A.H.guardar();
  }
  // lo que deja dormir (también la cama de las casas)
  function efectos(horas, seguro, emboscada, nocheEntera) {
    jug.hp = jug.hpMax;
    jug.sta = jug.staMax || 100;
    if (window.FRASCO) FRASCO.llenar(t("ds.junto_fuego"));
    if (horas >= LIMPIA) {
      if (window.ALQUIMIA && ALQUIMIA.estado().tox > 0) {
        ALQUIMIA.estado().tox = 0;
        J.retrasar(0.6, () => HUD.aviso(t("ds.toxinas"), "#7BC86C"));
      }
      const n = revivirBosque();
      if (n) J.retrasar(1.2, () => HUD.aviso(t("ds.revivio", [n]), "#E0B2B2"));
    }
    if (horas >= BIEN - 0.01 && !emboscada) {
      st.descansado = DURA_BIEN;
      st.k = seguro ? 0.15 : 0.1;
      if (window.RPG) RPG.recalcular();
      J.retrasar(1.8, () => HUD.aviso(t("ds.descansado_ok", [Math.round(st.k * 100)]), "#73D5DB"));
      if (window.VIDA) VIDA.evento("sanar", jug.x, jug.y);
    }
    if (nocheEntera && !emboscada && st.suenos < SUENOS) {
      const n = ++st.suenos;
      J.retrasar(2.4, () => {
        if (J.modo !== "juego") return;
        A.dialogoLibre([["eromash", "ds.sueno_" + n + "a"], ["eromash", "ds.sueno_" + n + "b"]]);
      });
    }
  }
  // los grupos muertos lejos vuelven (los únicos, no)
  function revivirBosque() {
    if (!window.HORDAS) return 0;
    let n = 0;
    HORDAS.grupos.forEach((g) => {
      if (g.unico) return;
      if (!g.muerto && !g.miembros.every((e) => e.muerto > 0)) return;
      if (Math.hypot(g.centro[0] - jug.x, g.centro[1] - jug.y) < LEJOS) return;
      g.miembros.forEach((e) => A.CB.reiniciar(e));
      g.muerto = 0;
      n++;
    });
    return n;
  }
  // la manada que viene a la fogata de noche
  function manada() {
    HUD.aviso(t("ds.emboscada"), "#C8402D");
    if (window.SONIDO) SONIDO.tocar("grunido", { vol: 0.9, tono: 0.8 });
    if (window.ANIMA) ANIMA.gesto("susto");
    const nivel = window.RPG ? RPG.nivel() : 1;
    for (let i = 0; i < 3; i++) {
      let x = 0,
        y = 0;
      for (let k = 0; k < 30; k++) {
        const a = i * 2.1 + k * 0.4,
          d = 420 + k * 12;
        x = jug.x + Math.cos(a) * d;
        y = jug.y + Math.sin(a) * d * 0.8;
        if (W.libre(x, y, 30)) break;
      }
      const e = A.CB.crear("lobo", x, y, { pal: 1 });
      e.d.vida = Math.round(e.d.vida * (1 + nivel * 0.04));
      e.estado = "persigue";
      e.vio = 1;
      e.emboscada = true;
      A.enemigos.push(e);
    }
  }
  // la cama de las casas (interiores.js): dormir hasta la mañana es descanso entero en un lugar seguro
  function dormido(horas) {
    st.veces++;
    efectos(horas, true, false, horas >= BIEN);
  }

  // ---------- el cartel con el reloj ----------
  function mostrar(si) {
    if (!el) {
      el = document.createElement("div");
      el.id = "descanso";
      el.innerHTML = `<div class="ds-velo"></div><div class="ds-caja panel"><canvas width="220" height="220"></canvas><h2></h2><p class="ds-pie"></p></div>`;
      document.body.appendChild(el);
      el.addEventListener("pointerdown", () => rato && rato.hecho > 0.3 && terminar(false));
    }
    el.classList.toggle("oculto", !si);
    if (si) {
      el.querySelector("h2").textContent = t("ds.descansando");
      el.querySelector(".ds-pie").textContent = t("ds.saltar");
      pintar();
    }
  }
  function pintar() {
    if (!el || !rato) return;
    const c = el.querySelector("canvas").getContext("2d"),
      h = hora(),
      R = 92;
    c.clearRect(0, 0, 220, 220);
    c.save();
    c.translate(110, 110);
    // el aro del día: de noche azul, de día dorado
    for (let i = 0; i < 24; i++) {
      const a0 = ((i - 6) / 24) * Math.PI * 2,
        a1 = ((i - 5) / 24) * Math.PI * 2;
      c.beginPath();
      c.arc(0, 0, R, a0, a1 - 0.02);
      c.lineWidth = 12;
      c.strokeStyle = i >= 6 && i < 19 ? "#5E4430" : "#1E2436";
      c.stroke();
    }
    // lo que ya pasó, en luz rúnica
    const a0 = ((rato.h0 - 6) / 24) * Math.PI * 2,
      a1 = a0 + (rato.hecho / 24) * Math.PI * 2;
    c.beginPath();
    c.arc(0, 0, R, a0, a1);
    c.lineWidth = 6;
    c.strokeStyle = "#73D5DB";
    c.stroke();
    // el sol o la luna en la hora de ahora
    const a = ((h - 6) / 24) * Math.PI * 2,
      x = Math.cos(a) * (R - 26),
      y = Math.sin(a) * (R - 26),
      dia = h >= 6 && h < 19;
    c.fillStyle = dia ? "#FFD98A" : "#C8D2E8";
    c.beginPath();
    if (dia) {
      for (let k = 0; k < 8; k++) {
        const b = (k / 8) * Math.PI * 2;
        c.lineTo(x + Math.cos(b) * 14, y + Math.sin(b) * 14);
        c.lineTo(x + Math.cos(b + 0.39) * 9, y + Math.sin(b + 0.39) * 9);
      }
    } else c.arc(x, y, 10, 0, Math.PI * 2);
    c.fill();
    if (!dia) {
      c.fillStyle = "#161210";
      c.beginPath();
      c.arc(x + 5, y - 3, 8, 0, Math.PI * 2);
      c.fill();
    }
    // la hora grande en el centro
    c.fillStyle = "#F2ECEC";
    c.font = "600 30px 'DM Sans', sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(horaTexto(h), 0, 0);
    c.restore();
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      ubicar();
      if (window.RPG) RPG.aporte((s) => st.descansado > 0 && (s.xp *= 1 + st.k));
    },
    alEmpezar(extra) {
      extra.descanso = Object.assign(base(), extra.descanso || {});
      st = extra.descanso;
      if (rato) (rato = null), mostrar(false);
      // las manadas de la fogata no quedan de una partida a otra
      for (let i = A.enemigos.length - 1; i >= 0; i--) if (A.enemigos[i].emboscada) A.enemigos.splice(i, 1);
      petates.forEach((p) => (p.cosa.o.usado = false));
      if (window.RPG) RPG.recalcular();
    },
    actualizar(dt) {
      if (rato) return paso(dt);
      if (st.descansado > 0 && (st.descansado -= dt) <= 0) {
        st.descansado = 0;
        if (window.RPG) RPG.recalcular();
      }
    },
    cercanos(dar) {
      if (J.dentro || rato) return;
      for (const p of petates) {
        const d = Math.hypot(p.cosa.x - jug.x, p.cosa.y - jug.y);
        if (d < 120) dar(d, t("ds.accion_petate"), () => menu({ x: p.cosa.x, y: p.cosa.y }), p.cosa.x, p.cosa.y - 70);
      }
    },
    // el menú de la fogata (cocina.js) suma estos botones
    botonesFogata(f) {
      return [{ texto: t("ds.boton_fogata"), sub: t("ds.boton_fogata_d"), fn: () => (A.cerrarMenu(), menu({ x: f.x, y: f.y })) }];
    },
    efectosHud() {
      return st.descansado > 0 ? [{ texto: t("ds.descansado") + " +" + Math.round(st.k * 100) + " %", n: Math.ceil(st.descansado / 60) + "'", col: "#73D5DB" }] : [];
    },
    diario() {
      return st.veces ? `<div class="diario-resumen"><p><b>${t("ds.titulo")}</b> ${t("ds.diario", [st.veces, st.suenos, SUENOS])}</p></div>` : "";
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, menu, empezar, terminar: () => rato && terminar(false), dormido, revivirBosque, petates: () => petates, rato: () => rato, enRefugio, SUENOS, BIEN, EMBOSCADA };
})();
