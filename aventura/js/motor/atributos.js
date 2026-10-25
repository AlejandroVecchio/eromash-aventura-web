// ---------- los atributos de Eromash (sistema ATRIBUTOS) ----------
// Cuatro atributos, cada uno con su runa: Fuerza (Uruz, el uro), Destreza (Ehwaz, el caballo), Vigor (Thurisaz, el
// gigante) y Espíritu (Ansuz, la voz de los dioses). Arrancan en 10 y cada nivel da 3 puntos para repartir en la
// pestaña Atributos de la mochila (U la abre directo). Lo repartido queda en borrador hasta confirmar; después se
// puede reacomodar todo: la primera vez es gratis y las siguientes cuestan plata.
// Estado en E.extra.atrib = { fue, des, vig, esp, extra (puntos de libros y proezas), reacomodos }.
window.ATRIBUTOS = (function () {
  "use strict";
  let A, J, jug;
  const t = (k, v) => I18N.t(k, v);
  const BASE = 10,
    POR_NIVEL = 3;
  // lo que da cada punto por encima de la base (lo usa también la ventana para explicarlo)
  const DEF = {
    fue: { runa: "uruz", col: "#FF8D71" },
    des: { runa: "ehwaz", col: "#7BC86C" },
    vig: { runa: "thurisaz", col: "#C8402D" },
    esp: { runa: "ansuz", col: "#73D5DB" },
  };
  const CLAVES = Object.keys(DEF);
  const base = () => ({ fue: 0, des: 0, vig: 0, esp: 0, extra: 0, reacomodos: 0 });
  let st = base(),
    borrador = { fue: 0, des: 0, vig: 0, esp: 0 };
  function efecto(s, p) {
    s.dano *= 1 + 0.015 * p.fue;
    s.armadura += 0.4 * p.fue;
    s.crit += 0.004 * p.des;
    s.velAtq *= 1 + 0.006 * p.des;
    s.velMov *= 1 + 0.002 * p.des;
    s.vida += 5 * p.vig;
    s.estamina += 2 * p.vig;
    s.regen *= 1 + 0.01 * p.vig;
    s.runico *= 1 + 0.02 * p.esp;
    s.regenRunica *= 1 + 0.015 * p.esp;
  }
  const puestos = (b) => CLAVES.reduce((n, k) => n + st[k] + (b ? borrador[k] : 0), 0);
  const total = () => POR_NIVEL * ((window.RPG ? RPG.nivel() : 1) - 1) + (st.extra || 0);
  const libres = (b) => total() - puestos(b);
  // lo que suman otros sistemas (el equipo): fn() → { fue, des, vig, esp }
  const bonos = [];
  const bonoDe = (k) => bonos.reduce((n, f) => n + (f()[k] || 0), 0);
  const conBonos = (p) => {
    const q = {};
    CLAVES.forEach((k) => (q[k] = p[k] + bonoDe(k)));
    return q;
  };
  const valor = (k, b) => BASE + st[k] + (b ? borrador[k] : 0) + bonoDe(k);
  const costoReacomodo = () => (st.reacomodos ? 40 * (window.RPG ? RPG.nivel() : 1) : 0);

  // ---------- la pestaña ----------
  // las estadísticas que se ven a la derecha: las de ahora y, si hay borrador, cómo quedarían
  function vistaStats(p) {
    const s = { vida: 100, estamina: 100, dano: 1, crit: 0.1, velAtq: 1, velMov: 1, runico: 1, armadura: 0, regen: 1, regenRunica: 1 };
    efecto(s, p);
    return s;
  }
  function filasStats() {
    const ahora = vistaStats(st),
      luego = vistaStats({ fue: st.fue + borrador.fue, des: st.des + borrador.des, vig: st.vig + borrador.vig, esp: st.esp + borrador.esp });
    const f = (clave, a, b, fmt) => {
      const cambia = Math.abs(a - b) > 1e-6;
      return `<div class="st"><span>${t(clave)}</span><b>${fmt(a)}${cambia ? ` <em class="sube">→ ${fmt(b)}</em>` : ""}</b></div>`;
    };
    const pc = (v) => "+" + Math.round((v - 1) * 1000) / 10 + " %",
      num = (v) => "+" + Math.round(v - 100);
    return [
      f("at.d_dano", ahora.dano, luego.dano, pc),
      f("at.d_armadura", ahora.armadura, luego.armadura, (v) => "+" + Math.round(v)),
      f("at.d_crit", ahora.crit, luego.crit, (v) => Math.round(v * 1000) / 10 + " %"),
      f("at.d_vel", ahora.velAtq, luego.velAtq, pc),
      f("at.d_vida", ahora.vida, luego.vida, num),
      f("at.d_estamina", ahora.estamina, luego.estamina, num),
      f("at.d_runico", ahora.runico, luego.runico, pc),
      f("at.d_energia", ahora.regenRunica, luego.regenRunica, pc),
    ].join("");
  }
  function runaIcono(k) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 96;
    const c = cv.getContext("2d");
    c.fillStyle = "#1A1614";
    c.beginPath();
    c.moveTo(48, 6);
    c.lineTo(90, 48);
    c.lineTo(48, 90);
    c.lineTo(6, 48);
    c.closePath();
    c.fill();
    FUTHARK.dibujar(c, DEF[k].runa, 48, 70, 44, DEF[k].col, 6);
    return cv;
  }
  function pintar(cuerpo, api) {
    cuerpo.classList.add("atributos");
    const izq = document.createElement("div");
    izq.className = "at-lista";
    const li = libres(true);
    izq.innerHTML = `<div class="at-libres${li > 0 ? " hay" : ""}"><b>${li}</b><span>${t("at.libres")}</span></div>`;
    CLAVES.forEach((k) => {
      const fila = document.createElement("div");
      fila.className = "at-fila";
      fila.appendChild(runaIcono(k));
      const txt = document.createElement("div");
      txt.className = "at-txt";
      txt.innerHTML = `<b></b><small></small>`;
      txt.querySelector("b").textContent = t("at." + k);
      txt.querySelector("small").textContent = t("at." + k + "_d");
      fila.appendChild(txt);
      const menos = document.createElement("button");
      menos.type = "button";
      menos.className = "at-boton";
      menos.textContent = "−";
      menos.disabled = borrador[k] <= 0;
      const val = document.createElement("span");
      val.className = "at-valor" + (borrador[k] ? " sube" : "");
      val.textContent = valor(k, true);
      const mas = document.createElement("button");
      mas.type = "button";
      mas.className = "at-boton";
      mas.textContent = "+";
      mas.disabled = li <= 0;
      fila.append(menos, val, mas);
      izq.appendChild(fila);
      api.enfocable(menos, { nombre: t("at." + k), desc: t("at.menos", [t("at." + k)]), fn: () => borrador[k] > 0 && borrador[k]-- });
      api.enfocable(mas, { nombre: t("at." + k), desc: t("at." + k + "_d") + " " + t("at.mas"), fn: () => libres(true) > 0 && borrador[k]++ });
    });
    const acciones = document.createElement("div");
    acciones.className = "at-acciones";
    const hayBorrador = CLAVES.some((k) => borrador[k]);
    const conf = document.createElement("button");
    conf.type = "button";
    conf.className = "at-confirmar";
    conf.textContent = t("at.confirmar");
    conf.disabled = !hayBorrador;
    acciones.appendChild(conf);
    api.enfocable(conf, { nombre: t("at.confirmar"), desc: hayBorrador ? t("at.confirmar_d") : t("at.nada"), fn: confirmar });
    const re = document.createElement("button");
    re.type = "button";
    re.textContent = t("at.reacomodar");
    const costo = costoReacomodo();
    const sub = document.createElement("small");
    sub.textContent = costo ? t("at.reacomodar_costo", [costo]) : t("at.reacomodar_gratis");
    re.appendChild(sub);
    acciones.appendChild(re);
    api.enfocable(re, { nombre: t("at.reacomodar"), desc: t("at.reacomodar_d") + " " + sub.textContent + ".", fn: reacomodar });
    izq.appendChild(acciones);
    const der = document.createElement("div");
    der.className = "inv-stats";
    der.innerHTML = `<div class="rotulo">${t("at.efectos")}</div>` + filasStats();
    cuerpo.append(izq, der);
  }
  function confirmar() {
    if (!CLAVES.some((k) => borrador[k])) return;
    CLAVES.forEach((k) => {
      st[k] += borrador[k];
      borrador[k] = 0;
    });
    if (window.RPG) RPG.recalcular();
    if (window.SONIDO) SONIDO.tocar("pagina", { vol: 0.6 });
    HUD.aviso(t("at.listo"), "#FFD98A");
  }
  let pidioReacomodo = false;
  function reacomodar() {
    const costo = costoReacomodo(),
      pj = window.PODERES && PODERES.pj();
    if (!puestos(false)) return HUD.aviso(t("at.nada_que"));
    if (costo && (!pj || pj.plata < costo)) return HUD.aviso(t("at.sin_plata", [costo]));
    // se pide dos veces: el primer toque solo avisa
    if (!pidioReacomodo) {
      pidioReacomodo = true;
      setTimeout(() => (pidioReacomodo = false), 3000);
      return HUD.aviso(t("at.seguro"));
    }
    pidioReacomodo = false;
    if (costo) pj.plata -= costo;
    CLAVES.forEach((k) => {
      st[k] = 0;
      borrador[k] = 0;
    });
    st.reacomodos++;
    if (window.RPG) RPG.recalcular();
    HUD.aviso(t("at.reacomodado"), "#73D5DB");
  }

  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      if (window.RPG) {
        RPG.aporte((s) => efecto(s, conBonos(st)), "atributos");
        RPG.alSubir(() => [t("at.sube", [POR_NIVEL, CONTROLES.glifo("personaje")])]);
      }
      if (window.INVENTARIO && INVENTARIO.pestana) INVENTARIO.pestana({ id: "atributos", antes: "bolsa", nombre: () => t("at.tab") + (libres(true) > 0 ? " ·" + libres(true) : ""), pintar });
    },
    alEmpezar(extra) {
      extra.atrib = Object.assign(base(), extra.atrib || {});
      st = extra.atrib;
      CLAVES.forEach((k) => (borrador[k] = 0));
      if (window.RPG) RPG.recalcular();
    },
    actualizar() {
      if (J.modo === "juego" && CONTROLES.recien("personaje") && window.INVENTARIO) INVENTARIO.abrir("atributos");
    },
    hud() {
      // un rombo dorado sobre la mochila mientras hay puntos para repartir
      const m = document.getElementById("c_mochila");
      if (m) m.classList.toggle("con-puntos", libres(false) > 0);
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { estado: () => st, libres: () => libres(false), valor: (k) => valor(k, false), sumarPuntos: (n) => ((st.extra = (st.extra || 0) + n), INVENTARIO.repintar()), bono: (f) => bonos.push(f), BASE, POR_NIVEL };
})();
