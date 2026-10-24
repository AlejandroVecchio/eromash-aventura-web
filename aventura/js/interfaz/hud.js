// ---------- la interfaz de la aventura (módulo HUD) ----------
// HTML encima del canvas, con el estilo de la arena: paneles oscuros con las esquinas cortadas, la vida roja,
// la estamina dorada y el rombo de la tecla. Todo texto sale de I18N.
window.HUD = (function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const t = (k, v) => I18N.t(k, v);
  const COLOR_HABLANTE = { eydis: "#7BC86C", orm: "#FF8D71", svanhild: "#B8C8E8", eromash: "#FFD98A", runa: "#73D5DB", trabajador: "#E0B2B2" };

  function armar() {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div id="hudJugador" class="ui panel">
        <div class="nombre">Eromash</div>
        <div class="barra" id="bVida"><i></i><span><b>${t("ui.vida")}</b><em></em></span></div>
        <div class="barra est" id="bEst"><i></i><span><b>${t("ui.estamina")}</b><em></em></span></div>
      </div>
      <div id="hudObjetivo" class="ui panel"><div class="rotulo"><span id="oMision"></span><b id="oDist"></b></div><div class="texto" id="oTexto"></div></div>
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

  function jugador(hp, hpMax, sta, staMax) {
    if (cambia("hp", Math.ceil(hp) + "/" + hpMax)) {
      $("bVida").querySelector("i").style.width = (100 * Math.max(0, hp)) / hpMax + "%";
      $("bVida").querySelector("em").textContent = Math.ceil(Math.max(0, hp)) + " / " + hpMax;
    }
    if (cambia("sta", Math.floor(sta))) {
      $("bEst").querySelector("i").style.width = (100 * Math.max(0, sta)) / staMax + "%";
      $("bEst").querySelector("em").textContent = Math.floor(sta) + " / " + staMax;
    }
  }
  function objetivo(mision, texto, metros) {
    $("hudObjetivo").classList.toggle("oculto", !texto);
    if (cambia("om", mision)) $("oMision").textContent = mision;
    if (cambia("ot", texto)) $("oTexto").textContent = texto || "";
    const d = metros == null ? "" : t("av.objetivo_metros", [Math.round(metros)]);
    if (cambia("od", d)) $("oDist").textContent = d;
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
    ["hudJugador", "hudObjetivo"].forEach((id) => $(id).style.visibility = si ? "hidden" : "");
  }

  // ---------- menús (título, pausa, diario, fin): botones que se eligen con mouse, flechas o mando ----------
  let menu = null;
  function abrir(html, botones) {
    $("capa").classList.remove("oculto");
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
  return { armar, jugador, objetivo, accion, aviso, dialogo, jefe, abrir, cerrar, pasoMenu, fundido, ocultarJuego, hayMenu: () => !!menu };
})();
