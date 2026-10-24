// ---------- la interfaz de la aventura (módulo HUD) ----------
// HTML encima del canvas, con el estilo de la arena: paneles oscuros con las esquinas cortadas, la vida roja,
// la estamina dorada y el rombo de la tecla. Todo texto sale de I18N.
window.HUD = (function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const t = (k, v) => I18N.t(k, v);
  const COLOR_HABLANTE = { eydis: "#7BC86C", orm: "#FF8D71", svanhild: "#B8C8E8", eromash: "#FFD98A", runa: "#73D5DB", trabajador: "#E0B2B2", ylva: "#E0B2B2", huldra: "#7BC86C", nokk: "#73D5DB" };

  function armar() {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div id="hudJugador" class="ui">
        <div class="retrato"><canvas id="hRetrato" width="112" height="112"></canvas></div>
        <div class="datos panel">
          <div class="nombre"><span id="hNombre">Eromash</span><small id="hTitulo"></small></div>
          <div class="barra" id="bVida"><i></i><span><b>${t("ui.vida")}</b><em></em></span></div>
          <div class="barra est" id="bEst"><i></i><span><b>${t("ui.estamina")}</b><em></em></span></div>
          <div class="chips"><span class="chip"><canvas id="hIcPlata" width="36" height="36"></canvas><b id="hPlata">0</b></span><span class="chip frag"><canvas id="hIcFrag" width="36" height="36"></canvas><b id="hFrag">0</b><em id="hNivelR"></em></span></div>
        </div>
      </div>
      <div id="hudBarra" class="ui"></div>
      <div id="hudMisiones" class="ui"></div>
      <div id="hudAccion" class="ui panel oculto"><span class="tecla" id="aTecla"></span><span id="aTexto"></span></div>
      <div id="hudAvisos" class="ui"></div>
      <div id="hudJefe" class="ui oculto"><div class="nombre"><span id="jNombre"></span><small id="jAtaduras"></small></div><div class="barra"><i id="jVida"></i></div><div class="ataque" id="jAtaque"></div></div>
      <div id="hudDialogo" class="ui panel oculto"><div class="quien" id="dQuien"></div><div class="linea" id="dLinea"></div><div class="seguir"><span class="tecla" id="dTecla"></span><span>${t("av.dialogo_seguir")}</span></div></div>
      <div id="capa" class="capa oculto"><div class="caja panel" id="capaCaja"></div></div>
      <div id="fundido"></div>`,
    );
  }

  const ultimo = {};
  const cambia = (k, v) => (ultimo[k] === v ? false : ((ultimo[k] = v), true));

  // el retrato: Eromash de frente adentro del rombo rojo (se repinta cuando cambia la cara)
  let caraImg = null,
    caraClave = "";
  function retrato(nombre, titulo, ojos) {
    if (cambia("nom", nombre)) $("hNombre").textContent = nombre;
    if (cambia("tit", titulo)) $("hTitulo").textContent = titulo;
    if (caraClave === ojos && caraImg && caraImg.complete) return;
    caraClave = ojos;
    caraImg = VIKINGO.imagen("R", "S", ojos);
    const pintar = () => {
      const cv = $("hRetrato"),
        c = cv.getContext("2d");
      c.clearRect(0, 0, 112, 112);
      const rombo = (r, col) => {
        c.beginPath();
        c.moveTo(56, 56 - r);
        c.lineTo(56 + r, 56);
        c.lineTo(56, 56 + r);
        c.lineTo(56 - r, 56);
        c.closePath();
        c.fillStyle = col;
        c.fill();
      };
      rombo(55, "#5E130D");
      rombo(50, "#111111");
      c.save();
      c.beginPath();
      c.moveTo(56, 8);
      c.lineTo(104, 56);
      c.lineTo(56, 104);
      c.lineTo(8, 56);
      c.closePath();
      c.clip();
      const g = c.createRadialGradient(56, 50, 4, 56, 56, 56);
      g.addColorStop(0, "#3A1A14");
      g.addColorStop(1, "#111111");
      c.fillStyle = g;
      c.fillRect(0, 0, 112, 112);
      if (caraImg.complete) c.drawImage(caraImg, 6, 4, 100, 120);
      c.restore();
      c.strokeStyle = "#FFD98A";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(56, 3);
      c.lineTo(109, 56);
      c.lineTo(56, 109);
      c.lineTo(3, 56);
      c.closePath();
      c.stroke();
    };
    if (caraImg.complete) pintar();
    else caraImg.onload = pintar;
  }
  // plata, fragmentos y nivel rúnico, debajo de las barras
  function bolsillo(plata, frag, nivel) {
    if (cambia("plata", plata)) $("hPlata").textContent = plata;
    if (cambia("frag", frag + "/" + nivel)) {
      $("hFrag").textContent = frag % 3 + "/3";
      $("hNivelR").textContent = nivel ? t("pj.nivel_corto", [nivel]) : "";
    }
    if (!ultimo.icBolsillo && window.INVENTARIO) {
      ultimo.icBolsillo = true;
      INVENTARIO.icono($("hIcPlata").getContext("2d"), "plata", 18, 18, 0.5);
      INVENTARIO.icono($("hIcFrag").getContext("2d"), "fragmento", 18, 18, 0.5);
    }
  }
  // la barra de acciones, abajo al centro: cada casilla con su ícono, su tecla y si está lista
  // casillas = [{ id, icono, accion, nombre, listo (bool), espera (0..1), grande, col, runa }]
  let barraClave = "";
  function barra(casillas) {
    const el = $("hudBarra");
    const clave = casillas.map((q) => q.id + ":" + (q.runa || q.icono) + ":" + CONTROLES.glifo(q.accion)).join("|") + I18N.lang;
    if (clave !== barraClave) {
      barraClave = clave;
      el.innerHTML = casillas
        .map((q) => `<div class="casilla${q.grande ? " grande" : ""}" id="c_${q.id}"><canvas width="${q.grande ? 128 : 96}" height="${q.grande ? 128 : 96}"></canvas><i class="espera"></i><span class="tecla">${CONTROLES.glifo(q.accion)}</span><small>${q.nombre}</small>${q.grande ? '<b class="poder"><i></i></b>' : ""}</div>`)
        .join("");
      casillas.forEach((q) => {
        const cv = el.querySelector("#c_" + q.id + " canvas"),
          c = cv.getContext("2d"),
          k = cv.width / 96;
        if (q.id === "runa") {
          c.fillStyle = "#1A1614";
          c.beginPath();
          c.moveTo(48 * k, 6 * k);
          c.lineTo(90 * k, 48 * k);
          c.lineTo(48 * k, 90 * k);
          c.lineTo(6 * k, 48 * k);
          c.closePath();
          c.fill();
          if (q.runa) FUTHARK.dibujar(c, q.runa, 48 * k, 70 * k, 46 * k, q.col, 5 * k);
        } else if (window.INVENTARIO) INVENTARIO.icono(c, q.icono, 48 * k, 48 * k, 1.2 * k);
        if (q.id === "mochila") {
          const d = el.querySelector("#c_mochila");
          d.style.pointerEvents = "auto";
          d.style.cursor = "pointer";
          d.addEventListener("click", () => window.INVENTARIO && INVENTARIO.abrir("equipo"));
        }
      });
    }
    casillas.forEach((q) => {
      const d = $("c_" + q.id);
      if (!d) return;
      d.classList.toggle("apagada", !q.listo);
      d.querySelector(".espera").style.setProperty("--f", Math.max(0, Math.min(1, q.espera || 0)));
      if (q.grande) d.querySelector(".poder i").style.width = Math.round((q.energia || 0) * 100) + "%";
    });
  }
  function jugador(hp, hpMax, sta, staMax, cansado) {
    if (cambia("cansado", !!cansado)) $("bEst").classList.toggle("cansado", !!cansado);
    if (cambia("hp", Math.ceil(hp) + "/" + hpMax)) {
      $("bVida").querySelector("i").style.width = (100 * Math.max(0, hp)) / hpMax + "%";
      $("bVida").querySelector("em").textContent = Math.ceil(Math.max(0, hp)) + " / " + hpMax;
    }
    if (cambia("sta", Math.floor(sta))) {
      $("bEst").querySelector("i").style.width = (100 * Math.max(0, sta)) / staMax + "%";
      $("bEst").querySelector("em").textContent = Math.floor(sta) + " / " + staMax;
    }
  }
  // el rastreador de misiones, al centro a la derecha como en el WoW: rótulo, nombre en dorado y los objetivos
  // (los cumplidos tachados en verde, el actual con el rombo rúnico y la distancia; los que vienen no se adelantan).
  // lista = [{ rotulo, nombre, objetivos: [{ texto, estado: "hecho" | "actual", metros }] }]
  // Se pliega entero (con la cabecera o su tecla) o misión por misión (tocando su nombre); se recuerda en este
  // navegador.
  let claveMis = "",
    ultimaLista = [];
  const recien = {};
  let plegado = { todo: false, una: {} };
  try {
    plegado = Object.assign(plegado, JSON.parse(localStorage.getItem("eromash.aventura.plegado") || "{}"));
  } catch (e) {}
  function guardarPlegado() {
    try {
      localStorage.setItem("eromash.aventura.plegado", JSON.stringify(plegado));
    } catch (e) {}
    claveMis = "";
    misiones(ultimaLista);
  }
  function plegarTodo() {
    plegado.todo = !plegado.todo;
    guardarPlegado();
  }
  function misiones(lista) {
    ultimaLista = lista;
    const clave = JSON.stringify(lista);
    if (clave === claveMis) return;
    const antes = claveMis;
    claveMis = clave;
    const caja = $("hudMisiones");
    caja.innerHTML = "";
    const cab = document.createElement("button");
    cab.className = "cabeza" + (plegado.todo ? " plegada" : "");
    cab.innerHTML = `<span></span><b></b>`;
    cab.querySelector("span").textContent = t("ui.misiones", [lista.length]);
    cab.querySelector("b").textContent = CONTROLES.glifo("misiones");
    cab.addEventListener("click", plegarTodo);
    caja.appendChild(cab);
    if (plegado.todo) return;
    lista.forEach((m) => {
      const id = m.id || (m.secundaria ? "secretos" : "historia");
      const cerrada = !!plegado.una[id];
      const d = document.createElement("div");
      d.className = "mision" + (m.secundaria ? " secundaria" : "") + (cerrada ? " plegada" : "");
      d.innerHTML = `<div class="rotulo"></div><button class="nombre"></button><ul></ul>`;
      d.querySelector(".rotulo").textContent = m.rotulo || "";
      const nom = d.querySelector(".nombre");
      nom.textContent = m.nombre;
      nom.addEventListener("click", () => {
        plegado.una[id] = !plegado.una[id];
        guardarPlegado();
      });
      caja.appendChild(d);
      if (cerrada) return;
      const ul = d.querySelector("ul");
      m.objetivos.forEach((o) => {
        const li = document.createElement("li");
        li.className = o.estado;
        li.innerHTML = `<i></i><span></span>${o.metros != null ? "<b></b>" : ""}`;
        li.querySelector("span").textContent = o.texto;
        if (o.metros != null) li.querySelector("b").textContent = t("av.objetivo_metros", [Math.round(o.metros)]);
        // destello cuando un objetivo recién se cumple
        const k = m.nombre + "|" + o.texto;
        if (o.estado === "hecho" && antes && !antes.includes(JSON.stringify(o.texto) + ',"estado":"hecho"')) recien[k] = performance.now();
        if (recien[k] && performance.now() - recien[k] < 1600) li.classList.add("recien");
        ul.appendChild(li);
      });
    });
  }
  function accion(texto, glifo) {
    $("hudAccion").classList.toggle("oculto", !texto);
    if (!texto) return;
    if (cambia("at", texto)) $("aTexto").textContent = texto;
    if (cambia("ag", glifo)) $("aTecla").textContent = glifo;
  }
  function aviso(texto, tipo, sub) {
    const d = document.createElement("div");
    d.className = "aviso " + (tipo === "lugar" ? "lugar" : "panel");
    if (tipo === "lugar") d.innerHTML = `<small></small><span></span>`;
    if (tipo === "lugar") {
      d.querySelector("small").textContent = sub || "";
      d.querySelector("span").textContent = texto;
    } else d.textContent = texto;
    if (tipo && tipo[0] === "#") d.style.color = tipo;
    $("hudAvisos").appendChild(d);
    setTimeout(() => d.remove(), 3700);
    while ($("hudAvisos").children.length > 3) $("hudAvisos").firstChild.remove();
  }
  function dialogo(quien, texto, glifo) {
    $("hudDialogo").classList.toggle("oculto", !quien);
    if (!quien) return;
    $("dQuien").textContent = t("av.nombre_" + quien);
    $("dQuien").style.color = COLOR_HABLANTE[quien] || "#F2ECEC";
    $("dLinea").textContent = texto;
    $("dTecla").textContent = glifo;
  }
  function jefe(d) {
    $("hudJefe").classList.toggle("oculto", !d);
    if (!d) return;
    if (cambia("jn", d.nombre)) $("jNombre").textContent = d.nombre;
    const at = d.ataduras > 0 ? t("av.jefe_ataduras", [d.ataduras]) : "";
    if (cambia("ja", at)) $("jAtaduras").textContent = at;
    $("jVida").style.width = Math.max(0, d.frac) * 100 + "%";
    const atq = d.ataque ? `<b>${d.ataque}</b> · ${d.accion}` : "";
    if (cambia("jq", atq)) $("jAtaque").innerHTML = atq;
  }
  function ocultarJuego(si) {
    ["hudJugador", "hudMisiones", "hudBarra"].forEach((id) => $(id).style.visibility = si ? "hidden" : "");
  }

  // ---------- menús (título, pausa, diario, fin): botones que se eligen con mouse, flechas o mando ----------
  let menu = null;
  function abrir(html, botones, op) {
    const clase = (op && op.clase) || "";
    $("capa").classList.remove("oculto");
    $("capa").className = "capa" + (clase ? " " + clase : "");
    $("capaCaja").className = "caja panel" + (clase ? " " + clase : "");
    $("capaCaja").innerHTML = html;
    const cont = document.createElement("div");
    $("capaCaja").appendChild(cont);
    menu = { botones: [], foco: 0 };
    (botones || []).forEach((b, i) => {
      const el = document.createElement("button");
      el.className = "boton";
      el.innerHTML = `<span></span>${b.sub ? "<small></small>" : ""}`;
      el.querySelector("span").textContent = b.texto;
      if (b.sub) el.querySelector("small").textContent = b.sub;
      el.addEventListener("click", () => elegir(i));
      el.addEventListener("pointerenter", () => enfocar(i));
      cont.appendChild(el);
      menu.botones.push({ el, fn: b.fn });
    });
    enfocar(0);
  }
  function enfocar(i) {
    if (!menu || !menu.botones.length) return;
    menu.foco = (i + menu.botones.length) % menu.botones.length;
    menu.botones.forEach((b, k) => b.el.classList.toggle("foco", k === menu.foco));
  }
  function elegir(i) {
    const b = menu && menu.botones[i];
    if (b) b.fn();
  }
  function cerrar() {
    $("capa").classList.add("oculto");
    menu = null;
  }
  // un paso del menú con los controles (lo llama el motor cada cuadro mientras hay menú)
  let ejeAntes = 0;
  function pasoMenu() {
    if (!menu) return false;
    const y = CONTROLES.eje().y,
      dir = y > 0.5 ? 1 : y < -0.5 ? -1 : 0;
    if (dir && dir !== ejeAntes) enfocar(menu.foco + dir);
    ejeAntes = dir;
    if (CONTROLES.recien("seguir") || CONTROLES.recien("interactuar")) elegir(menu.foco);
    return true;
  }
  function fundido(si) {
    $("fundido").classList.toggle("on", si);
  }
  return { armar, jugador, retrato, bolsillo, barra, misiones, plegarTodo, accion, aviso, dialogo, jefe, abrir, cerrar, pasoMenu, fundido, ocultarJuego, hayMenu: () => !!menu };
})();
