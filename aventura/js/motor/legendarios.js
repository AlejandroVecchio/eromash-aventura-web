// ---------- los poderes de las legendarias (sistema LEGENDARIOS) ----------
// Como los legendarios del Diablo 3 y el cubo de Kanai: cada pieza legendaria trae un poder que cambia cómo se pelea
// (estallar en llamas cada cinco golpes, rayos que saltan, sangrado en los críticos, una égida cuando la vida cae…) y
// un nombre propio de los mitos. Al desarmar una legendaria su poder queda aprendido, y en la pestaña Poderes de la
// mochila se graban tres a elección (uno de arma, uno de armadura y uno de joya) que valen sin llevar la pieza.
// Los semijefes y los únicos tienen además un 20 % de soltar una legendaria.
// it.po = el poder. Estado en E.extra.legendarios = { aprendidos: { id: 1 }, grabados: { arma, armadura, joya } }.
// Textos `lg.` en textos/legendarios.js.
window.LEGENDARIOS = (function () {
  "use strict";
  let A, J, jug;
  const t = (k, v) => I18N.t(k, v);
  // los poderes: en qué casillas salen, en qué ranura se graban y su color
  const POD = {
    surtr: { en: ["arma"], cat: "arma", col: "#FF8D71" },
    garm: { en: ["arma"], cat: "arma", col: "#C8402D" },
    mjolnir: { en: ["arma"], cat: "arma", col: "#8FB0F0" },
    svalinn: { en: ["escudo", "pecho"], cat: "armadura", col: "#FFD98A" },
    hel: { en: ["casco"], cat: "armadura", col: "#9A6BD8" },
    hermodr: { en: ["botas"], cat: "armadura", col: "#7BC86C" },
    vidarr: { en: ["piernas"], cat: "armadura", col: "#E0B2B2" },
    brisingamen: { en: ["amuleto"], cat: "joya", col: "#F5A524" },
    andvaranaut: { en: ["anillo"], cat: "joya", col: "#FFD98A" },
  };
  const CATS = ["arma", "armadura", "joya"];
  // los números de cada poder (docs/rpg.md)
  const N = {
    surtrCada: 5, surtrRadio: 150, surtrK: 0.6,
    garmK: 0.4, garmDura: 3,
    mjolnirProb: 0.15, mjolnirSaltos: 3, mjolnirRadio: 320, mjolnirK: 0.5,
    svalinnUmbral: 0.3, svalinnEscudo: 0.3, svalinnDura: 8, svalinnEspera: 60,
    helCura: 0.04,
    hermodrSta: 15, hermodrDura: 1.5, hermodrVel: 1.25,
    vidarrK: 0.75,
    brisingamenCada: 100, brisingamenTope: 30,
    andvaranautPlata: 0.3, andvaranautFrag: 0.03,
  };
  const base = () => ({ aprendidos: {}, grabados: {} });
  let st = base();
  let golpes = 0, // para Surtr
    egida = 0, // lo que queda del escudo de Svalinn
    egidaT = 0,
    egidaEspera = 0,
    prisa = 0,
    esqAntes = 0;
  const sangran = []; // { e, dano por segundo, queda }

  // ---------- al generar: las legendarias traen su poder ----------
  function alGenerar(it, rnd) {
    if (it.r !== 3 || it.po) return;
    const s = OBJETOS.BASES[it.b].slot;
    const l = Object.keys(POD).filter((id) => POD[id].en.includes(s));
    if (l.length) it.po = l[Math.floor(rnd() * l.length) % l.length];
  }
  const nombre = (it) => t("lg.n_" + it.po);
  function lineas(it) {
    return [{ txt: t("lg.l_poder", [t("lg.d_" + it.po, valores(it.po))]), col: POD[it.po].col }];
  }
  function valores(id) {
    return {
      surtr: [N.surtrCada, Math.round(N.surtrK * 100)],
      garm: [Math.round(N.garmK * 100), N.garmDura],
      mjolnir: [Math.round(N.mjolnirProb * 100), N.mjolnirSaltos, Math.round(N.mjolnirK * 100)],
      svalinn: [Math.round(N.svalinnUmbral * 100), Math.round(N.svalinnEscudo * 100), N.svalinnEspera],
      hel: [Math.round(N.helCura * 100)],
      hermodr: [N.hermodrSta, Math.round((N.hermodrVel - 1) * 100)],
      vidarr: [Math.round((1 - N.vidarrK) * 100)],
      brisingamen: [N.brisingamenCada, N.brisingamenTope],
      andvaranaut: [Math.round(N.andvaranautPlata * 100)],
    }[id];
  }

  // ---------- qué poderes valen ahora ----------
  let activos = new Set();
  function rearmar() {
    activos = new Set();
    if (window.BOTIN) BOTIN.puestas().forEach((it) => it.po && activos.add(it.po));
    CATS.forEach((c) => st.grabados[c] && activos.add(st.grabados[c]));
  }
  const tiene = (id) => activos.has(id);

  // ---------- el golpe de un poder (pasa por los modDano y avisa con alPegar, marcado para no encadenarse) ----------
  function pegar(e, dano, id) {
    const info = { d: { poder: id }, critico: false, sorpresa: false, contra: false };
    for (const s of window.SISTEMAS) if (s.modDano) dano = s.modDano(dano, e, info);
    dano = Math.max(1, Math.round(dano));
    A.numero(e.x, e.y - 60, dano, POD[id].col, false);
    const murio = A.CB.golpear(J, e, dano, jug.x, jug.y, 0.4);
    window.SISTEMAS.forEach((s) => s.alPegar && s.alPegar(e, dano, info, murio));
    return murio;
  }
  const vivas = () => A.enemigos.filter((e) => e.activo && !e.muerto && !e.d.blanco);
  function llamas(x, y) {
    if (window.SONIDO) SONIDO.tocar("fogata", { vol: 0.6, tono: 1.6, x, y });
    J.ondas.push({ tipo: "pulso", x, y, t: 0 });
    const n = window.CALIDAD && CALIDAD.nivel === "baja" ? 8 : 22;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      J.fx.push({ x: x + Math.cos(a) * 20, y: y + Math.sin(a) * 12, vx: Math.cos(a) * 260, vy: Math.sin(a) * 160 - 60, t: 0.45, c: i % 2 ? "#FF8D71" : "#C8402D", s: 5 + Math.random() * 4 });
    }
  }
  function rayo(x0, y0, x1, y1) {
    const n = window.CALIDAD && CALIDAD.nivel === "baja" ? 4 : 10;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      J.fx.push({ x: x0 + (x1 - x0) * u + (Math.random() - 0.5) * 18, y: y0 - 50 + (y1 - y0) * u + (Math.random() - 0.5) * 18, vx: 0, vy: 0, t: 0.25, c: i % 2 ? "#C8F2F4" : "#8FB0F0", s: 4 });
    }
  }

  // ---------- la pestaña Poderes ----------
  function grabar(id) {
    if (!st.aprendidos[id]) return false;
    st.grabados[POD[id].cat] = id;
    rearmar();
    if (window.RPG) RPG.recalcular();
    HUD.aviso(t("lg.grabado", [t("lg.n_" + id)]), POD[id].col);
    return true;
  }
  function aprender(id) {
    if (!id || st.aprendidos[id]) return false;
    st.aprendidos[id] = 1;
    HUD.aviso(t("lg.aprendido", [t("lg.n_" + id)]), "lugar", t("lg.aprendido_titulo"));
    // si la ranura está vacía, se graba sola
    if (!st.grabados[POD[id].cat]) grabar(id);
    return true;
  }
  function pintar(cuerpo, api) {
    cuerpo.insertAdjacentHTML("beforeend", `<p class="aq-cabeza">${t("lg.cabeza")}</p>`);
    CATS.forEach((cat, f) => {
      const g0 = st.grabados[cat];
      cuerpo.insertAdjacentHTML("beforeend", `<div class="rotulo inv-piezas">${t("lg.cat_" + cat)}${g0 ? " · " + t("lg.n_" + g0) : ""}</div>`);
      const g = document.createElement("div");
      g.className = "inv-rejilla";
      Object.keys(POD)
        .filter((id) => POD[id].cat === cat)
        .forEach((id, k) => {
          const sabe = !!st.aprendidos[id];
          g.appendChild(
            api.celda(
              {
                icono: "lg_" + id,
                nombre: sabe ? t("lg.n_" + id) : "???",
                col: POD[id].col,
                html: sabe ? `<span class="bs-texto">${t("lg.d_" + id, valores(id))}</span>${st.grabados[cat] === id ? `<span class="ob-pista">${t("lg.esta_grabado")}</span>` : `<span class="ob-pista">${t("lg.grabar_pista")}</span>`}` : `<span class="bs-texto">${t("lg.no_sabe", [t("ob.casilla_" + POD[id].en[0])])}</span>`,
                falta: !sabe,
                elegida: st.grabados[cat] === id,
                fn: sabe ? () => grabar(id) : null,
              },
              f,
              k,
            ),
          );
        });
      cuerpo.appendChild(g);
    });
  }
  function iconos() {
    Object.keys(POD).forEach((id) =>
      INVENTARIO.iconoDe("lg_" + id, (c) => {
        // una piedra grabada con la marca del poder
        DIB.E(c, 0, 26, 24, 6, "rgba(0,0,0,0.25)");
        DIB.P(c, [-22, 22, -24, -10, -10, -26, 12, -26, 24, -8, 20, 22], "#3A3634");
        DIB.P(c, [0, -26, 12, -26, 24, -8, 20, 22, 0, 22], "#5A5450");
        const col = POD[id].col;
        c.strokeStyle = col;
        c.lineWidth = 4;
        c.lineCap = "round";
        c.beginPath();
        if (POD[id].cat === "arma") (c.moveTo(-10, 12), c.lineTo(10, -14), c.moveTo(-4, -2), c.lineTo(6, 6));
        else if (POD[id].cat === "armadura") (c.moveTo(-10, -12), c.lineTo(10, -12), c.lineTo(8, 8), c.lineTo(0, 14), c.lineTo(-8, 8), c.closePath());
        else c.arc(0, 0, 10, 0, Math.PI * 2);
        c.stroke();
      }),
    );
  }

  // ---------- el sistema ----------
  function envolverDesarmar() {
    const orig = MATERIALES.alDesarmar;
    MATERIALES.alDesarmar = function (it) {
      if (it && it.po) J.retrasar(0.8, () => aprender(it.po));
      return orig.apply(this, arguments);
    };
  }
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      iconos();
      if (window.MATERIALES) envolverDesarmar();
      if (window.RPG)
        RPG.aporte((s) => {
          rearmar();
          if (tiene("andvaranaut")) s.plata *= 1 + N.andvaranautPlata;
          if (prisa > 0) s.velMov *= N.hermodrVel;
        });
      INVENTARIO.pestana({ id: "poderes", antes: "bestiario", nombre: () => t("lg.tab"), visible: () => Object.keys(st.aprendidos).length > 0, pintar });
    },
    alEmpezar(extra) {
      extra.legendarios = Object.assign(base(), extra.legendarios || {});
      st = extra.legendarios;
      golpes = egida = egidaT = egidaEspera = prisa = 0;
      sangran.length = 0;
      rearmar();
    },
    actualizar(dt) {
      // el sangrado de Garm
      for (let i = sangran.length - 1; i >= 0; i--) {
        const s = sangran[i];
        s.tic -= dt;
        s.queda -= dt;
        if (s.tic <= 0) {
          s.tic += 0.5;
          if (!s.e.muerto) pegar(s.e, s.dps * 0.5, "garm");
        }
        if (s.queda <= 0 || s.e.muerto) sangran.splice(i, 1);
      }
      // la égida de Svalinn
      egidaEspera = Math.max(0, egidaEspera - dt);
      if (egida > 0 && (egidaT -= dt) <= 0) egida = 0;
      if (tiene("svalinn") && !egida && !egidaEspera && !jug.muerto && jug.hp < jug.hpMax * N.svalinnUmbral) {
        egida = jug.hpMax * N.svalinnEscudo;
        egidaT = N.svalinnDura;
        egidaEspera = N.svalinnEspera;
        A.textoFlotante(jug.x, jug.y - 130, t("lg.n_svalinn"), POD.svalinn.col);
        if (window.SONIDO) SONIDO.tocar("golpeFuerte", { vol: 0.5, tono: 1.5 });
      }
      // Hermóðr: cada esquiva devuelve estamina y da prisa
      if (tiene("hermodr") && jug.esq > 0 && esqAntes <= 0) {
        jug.sta = Math.min(jug.staMax || 100, jug.sta + N.hermodrSta);
        if (prisa <= 0 && window.RPG) (prisa = N.hermodrDura), RPG.recalcular();
        else prisa = N.hermodrDura;
      }
      esqAntes = jug.esq;
      if (prisa > 0 && (prisa -= dt) <= 0 && window.RPG) RPG.recalcular();
    },
    modDano(dano, e, info) {
      if (tiene("brisingamen") && window.PODERES && PODERES.pj()) dano *= 1 + Math.min(N.brisingamenTope, Math.floor(PODERES.pj().plata / N.brisingamenCada)) / 100;
      return dano;
    },
    alPegar(e, dano, info, murio) {
      if (!info || (info.d && info.d.poder)) return;
      if (murio && tiene("hel")) {
        jug.hp = Math.min(jug.hpMax, jug.hp + jug.hpMax * N.helCura);
        A.textoFlotante(jug.x, jug.y - 110, "+" + Math.round(jug.hpMax * N.helCura), POD.hel.col);
      }
      if (murio && tiene("andvaranaut") && Math.random() < N.andvaranautFrag && window.PODERES) PODERES.darFragmento();
      if (tiene("garm") && info.critico && !murio) sangran.push({ e, dps: (dano * N.garmK) / N.garmDura, queda: N.garmDura, tic: 0.5 });
      if (tiene("surtr") && ++golpes >= N.surtrCada) {
        golpes = 0;
        llamas(e.x, e.y);
        vivas().forEach((o) => Math.hypot(o.x - e.x, (o.y - e.y) * 1.3) < N.surtrRadio && pegar(o, dano * N.surtrK, "surtr"));
      }
      if (tiene("mjolnir") && Math.random() < N.mjolnirProb) {
        let de = e;
        const ya = new Set([e]);
        if (window.SONIDO) SONIDO.tocar("golpeFuerte", { vol: 0.5, tono: 1.8, x: e.x, y: e.y });
        for (let i = 0; i < N.mjolnirSaltos; i++) {
          const sig = vivas()
            .filter((o) => !ya.has(o) && Math.hypot(o.x - de.x, o.y - de.y) < N.mjolnirRadio)
            .sort((a, b) => Math.hypot(a.x - de.x, a.y - de.y) - Math.hypot(b.x - de.x, b.y - de.y))[0];
          if (!sig) break;
          rayo(de.x, de.y, sig.x, sig.y);
          ya.add(sig);
          pegar(sig, dano * N.mjolnirK, "mjolnir");
          de = sig;
        }
      }
    },
    modRecibido(dano) {
      if (tiene("vidarr") && jug.correr) dano *= N.vidarrK;
      if (egida > 0) {
        const absorbe = Math.min(egida, dano);
        egida -= absorbe;
        dano -= absorbe;
      }
      return dano;
    },
    alMorir(e) {
      if (!e || e.esbirro || e.sinBotin || e.d.blanco || !window.BOTIN) return;
      if (!((e.lider && e.lider.unico) || e.semi || e.patron) || Math.random() >= 0.2) return;
      const it = OBJETOS.generar({ r: 3, n: window.RPG ? RPG.nivelDe(e) : 1, tema: ARTE_OBJ.temaEn(A.W, e.x, e.y) });
      BOTIN.tirar(e.x, e.y, it);
    },
    efectosHud() {
      const l = [];
      if (egida > 0) l.push({ texto: t("lg.n_svalinn"), n: Math.round(egida), col: POD.svalinn.col });
      if (prisa > 0) l.push({ texto: t("lg.prisa"), n: prisa.toFixed(1) + "s", col: POD.hermodr.col });
      return l;
    },
    diario() {
      const n = Object.keys(st.aprendidos).length;
      return n ? `<div class="diario-resumen"><p><b>${t("lg.tab")}</b> ${t("lg.diario", [n, Object.keys(POD).length])}</p></div>` : "";
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, alGenerar, nombre, lineas, aprender, grabar, tiene, rearmar, egida: () => egida, sangran: () => sangran, POD, N };
})();
