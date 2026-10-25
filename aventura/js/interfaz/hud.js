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
          <div class="barra" id="bVida"><u></u><i></i><span><b>${t("ui.vida")}</b><em></em></span></div>
          <div class="piedras oculto" id="hPiedras"></div>
          <div class="barra est" id="bEst"><i></i><span><b>${t("ui.estamina")}</b><em></em></span></div>
          <div class="chips"><span class="chip"><canvas id="hIcPlata" width="36" height="36"></canvas><b id="hPlata">0</b></span><span class="chip frag"><canvas id="hIcFrag" width="36" height="36"></canvas><b id="hFrag">0</b><em id="hNivelR"></em></span></div>
        </div>
      </div>
      <div id="hudBarra" class="ui"></div>
      <div id="hudMisiones" class="ui"></div>
      <div id="hudAccion" class="ui panel oculto"><span class="tecla" id="aTecla"></span><span id="aTexto"></span></div>
      <div id="hudAvisos" class="ui"></div>
      <div id="hudCanal" class="ui oculto"><i></i></div>
      <div id="hudGuardado" class="ui panel oculto"><span class="runa-guardado">ᛟ</span><span>${t("ui.guardado")}</span></div>
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
    const col = VIKINGO.color || "R";
    if (caraClave === ojos + col && caraImg && caraImg.complete) return;
    caraClave = ojos + col;
    caraImg = VIKINGO.imagen(col, "S", ojos);
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
    const antes = ultimo.plata;
    if (cambia("plata", plata)) {
      $("hPlata").textContent = plata;
      // cuando entra plata el número salta y asoma lo que entró
      if (antes != null && plata > antes) {
        const chip = $("hPlata").parentNode;
        chip.classList.remove("sube");
        void chip.offsetWidth;
        chip.classList.add("sube");
        const s = document.createElement("span");
        s.className = "entra";
        s.textContent = "+" + (plata - antes);
        chip.appendChild(s);
        setTimeout(() => s.remove(), 1100);
      }
    }
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
  // la barra de abajo al centro: las seis casillas que llena el jugador (habilidades, objetos, herramientas y
  // conocimientos, ver interfaz/barra.js) y la mochila. Atacar, esquivar o saltar no van: son lo básico.
  // casillas = [{ id, icono | runa, col, tecla, nombre, vacia, elegida, listo, espera (0..1), energia (0..1), cant,
  //   usar (fn al tocarla), chica }]
  let barraClave = "";
  function barra(casillas) {
    const el = $("hudBarra");
    const clave = casillas.map((q) => q.id + ":" + (q.vacia ? "-" : q.runa || q.icono) + ":" + (q.nivel || 0) + ":" + q.tecla + ":" + (q.energia != null)).join("|") + I18N.lang + (window.INVENTARIO ? INVENTARIO.version() : 0);
    if (clave !== barraClave) {
      barraClave = clave;
      casillas.forEach((q) => ["ap", "es", "en", "el", "ca"].forEach((p) => delete ultimo[p + q.id]));
      el.innerHTML = casillas
        .map((q) => `<div class="casilla${q.vacia ? " vacia" : ""}${q.chica ? " chica" : ""}" id="c_${q.id}"><canvas width="96" height="96"></canvas><i class="espera"></i><span class="tecla"></span><b class="cant"></b><small></small>${q.energia != null ? '<b class="poder"><i></i></b>' : ""}</div>`)
        .join("");
      casillas.forEach((q) => {
        const d = $("c_" + q.id),
          cv = d.querySelector("canvas"),
          c = cv.getContext("2d");
        d.querySelector(".tecla").textContent = q.tecla || "";
        d.querySelector(".tecla").classList.toggle("oculto", !q.tecla);
        d.querySelector("small").textContent = q.nombre || "";
        if (q.runa) {
          c.fillStyle = "#1A1614";
          c.beginPath();
          c.moveTo(48, 6);
          c.lineTo(90, 48);
          c.lineTo(48, 90);
          c.lineTo(6, 48);
          c.closePath();
          c.fill();
          FUTHARK.dibujar(c, q.runa, 48, 70, 46, q.col, 5);
        } else if (q.vacia) {
          // la casilla libre: un rombo hueco que invita a llenarla desde la mochila
          c.strokeStyle = "rgba(224,178,178,0.25)";
          c.lineWidth = 3;
          c.beginPath();
          c.moveTo(48, 26);
          c.lineTo(70, 48);
          c.lineTo(48, 70);
          c.lineTo(26, 48);
          c.closePath();
          c.stroke();
        } else if (window.INVENTARIO) INVENTARIO.icono(c, q.icono, 48, 48, 1.2, q.nivel);
        if (q.usar) {
          d.style.pointerEvents = "auto";
          d.style.cursor = "pointer";
          d.addEventListener("click", q.usar);
        }
      });
    }
    casillas.forEach((q) => {
      const d = $("c_" + q.id);
      if (!d) return;
      // solo se toca el DOM cuando algo cambió (cada escritura obliga a recalcular estilos)
      if (cambia("ap" + q.id, !q.listo && !q.vacia)) d.classList.toggle("apagada", !q.listo && !q.vacia);
      if (cambia("el" + q.id, !!q.elegida)) d.classList.toggle("elegida", !!q.elegida);
      const f = Math.round(Math.max(0, Math.min(1, q.espera || 0)) * 200) / 200;
      if (cambia("es" + q.id, f)) d.querySelector(".espera").style.setProperty("--f", f);
      if (cambia("ca" + q.id, q.cant == null ? "" : String(q.cant))) d.querySelector(".cant").textContent = q.cant == null ? "" : q.cant;
      if (q.energia != null && cambia("en" + q.id, Math.round(q.energia * 100))) d.querySelector(".poder i").style.width = Math.round(q.energia * 100) + "%";
    });
  }
  // las piedras de Berkano debajo de la vida (berkano.js): un rombo por piedra con la runa, que se llena de luz rúnica
  // de abajo arriba; cura = la vida que guarda cada una (sale al señalarlas)
  function piedras(p, cura) {
    if (!cambia("piedras", p.map((v) => Math.round(v * 24)).join(",") + ":" + cura)) return;
    const el = $("hPiedras");
    el.classList.toggle("oculto", !p.length);
    el.title = t("bk.piedras") + " · " + cura;
    el.innerHTML = p.map((v) => `<span class="piedra${v >= 0.999 ? " llena" : v < 0.01 ? " vacia" : ""}" style="--f:${Math.round(v * 100)}%"><i></i><b>ᛒ</b></span>`).join("");
  }
  function jugador(hp, hpMax, sta, staMax, cansado) {
    if (cambia("cansado", !!cansado)) $("bEst").classList.toggle("cansado", !!cansado);
    if (cambia("hp", Math.ceil(hp) + "/" + hpMax)) {
      $("bVida").querySelector("i").style.width = (100 * Math.max(0, hp)) / hpMax + "%";
      // el pedazo perdido queda claro un instante y se va achicando detrás (sube junto con la vida)
      $("bVida").querySelector("u").style.width = (100 * Math.max(0, hp)) / hpMax + "%";
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
  // los metros cambian a cada paso: se cambian en su lugar sin rearmar el rastreador (rearmarlo en cada cuadro
  // recalcula toda la página)
  let metrosEls = {};
  function misiones(lista) {
    ultimaLista = lista;
    const clave = JSON.stringify(lista, (k, v) => (k === "metros" ? v != null : v));
    if (clave === claveMis) {
      lista.forEach((m, i) =>
        m.objetivos.forEach((o, j) => {
          const b = metrosEls[i + "," + j];
          if (!b || o.metros == null) return;
          const txt = t("av.objetivo_metros", [Math.round(o.metros)]);
          if (b.textContent !== txt) b.textContent = txt;
        }),
      );
      return;
    }
    const antes = claveMis;
    claveMis = clave;
    metrosEls = {};
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
    lista.forEach((m, i) => {
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
      m.objetivos.forEach((o, j) => {
        const li = document.createElement("li");
        li.className = o.estado;
        li.innerHTML = `<i></i><span></span>${o.metros != null ? "<b></b>" : ""}`;
        li.querySelector("span").textContent = o.texto;
        if (o.metros != null) {
          const b = li.querySelector("b");
          b.textContent = t("av.objetivo_metros", [Math.round(o.metros)]);
          metrosEls[i + "," + j] = b;
        }
        // destello cuando un objetivo recién se cumple
        const k = m.nombre + "|" + o.texto;
        if (o.estado === "hecho" && antes && !antes.includes(JSON.stringify(o.texto) + ',"estado":"hecho"')) recien[k] = performance.now();
        const pasado = recien[k] ? performance.now() - recien[k] : 1e9;
        if (pasado < 1600) {
          li.classList.add("recien");
          setTimeout(() => li.classList.remove("recien"), 1600 - pasado);
        }
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
    // el mismo cartel otra vez mientras sigue a la vista: se suma «×2» en vez de apilarse
    const igual = [...$("hudAvisos").children].find((q) => q.dataset.txt === texto + "|" + (sub || "") && !q.dataset.fin);
    if (igual) {
      const n = (Number(igual.dataset.n) || 1) + 1;
      igual.dataset.n = n;
      let b = igual.querySelector(".veces");
      if (!b) {
        b = document.createElement("b");
        b.className = "veces";
        igual.appendChild(b);
      }
      b.textContent = " ×" + n;
      igual.style.animation = "none";
      void igual.offsetWidth;
      igual.style.animation = "";
      clearTimeout(igual._fin);
      igual._fin = setTimeout(() => igual.remove(), 3700);
      return;
    }
    const d = document.createElement("div");
    d.dataset.txt = texto + "|" + (sub || "");
    d.className = "aviso " + (tipo === "lugar" ? "lugar" : "panel");
    if (tipo === "lugar") d.innerHTML = `<small></small><span></span>`;
    if (tipo === "lugar") {
      d.querySelector("small").textContent = sub || "";
      d.querySelector("span").textContent = texto;
    } else d.textContent = texto;
    if (tipo && tipo[0] === "#") d.style.color = tipo;
    $("hudAvisos").appendChild(d);
    d._fin = setTimeout(() => d.remove(), 3700);
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
  // la barrita de lo que se está haciendo (despertar una piedra, juntar luz para viajar): frac de 0 a 1 o null
  function canal(frac) {
    $("hudCanal").classList.toggle("oculto", frac == null);
    if (frac != null) $("hudCanal").querySelector("i").style.width = Math.round(Math.min(1, frac) * 100) + "%";
  }
  // un golpe: el retrato tiembla y se tiñe de rojo un instante
  function herido() {
    const r = document.querySelector("#hudJugador .retrato");
    r.classList.remove("golpe");
    void r.offsetWidth;
    r.classList.add("golpe");
  }
  // «Guardado» abajo a la derecha, con Othala girando
  let guardadoT = 0;
  function guardado() {
    $("hudGuardado").classList.remove("oculto");
    clearTimeout(guardadoT);
    guardadoT = setTimeout(() => $("hudGuardado").classList.add("oculto"), 1600);
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
    menu = { botones: [], foco: undefined };
    // abajo de todo, qué tecla elige y cuál vuelve (con el mando, sus glifos)
    if (botones && botones.length) {
      const pie = document.createElement("div");
      pie.className = "pie-menu";
      pie.innerHTML = `<span class="tecla"></span><span>${t("ui.elegir")}</span><span class="tecla"></span><span>${t("ui.volver")}</span>`;
      const tk = pie.querySelectorAll(".tecla");
      tk[0].textContent = CONTROLES.glifo("seguir");
      tk[1].textContent = CONTROLES.glifo("pausa");
      setTimeout(() => $("capaCaja").contains(cont) && $("capaCaja").appendChild(pie));
    }
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
    if (menu.foco !== undefined && menu.foco !== (i + menu.botones.length) % menu.botones.length && window.SONIDO) SONIDO.tocar("clic", { vol: 0.18, tono: 1.3 });
    menu.foco = (i + menu.botones.length) % menu.botones.length;
    menu.botones.forEach((b, k) => b.el.classList.toggle("foco", k === menu.foco));
    // con teclado o mando, la fila elegida queda a la vista en las listas largas (Teclas)
    const el = menu.botones[menu.foco].el;
    if (el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }
  function elegir(i) {
    const b = menu && menu.botones[i];
    if (b && window.SONIDO) SONIDO.tocar("clic", { vol: 0.3 });
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
  return { armar, jugador, piedras, retrato, bolsillo, barra, misiones, plegarTodo, accion, aviso, dialogo, jefe, abrir, cerrar, pasoMenu, enfocar, fundido, ocultarJuego, canal, herido, guardado, hayMenu: () => !!menu };
})();
