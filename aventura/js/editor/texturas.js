// ---------- el generador de texturas (tecla Y) ----------
// Se arma una textura que se repite sin costura y se guarda como asset propio, con nombre, para ponerla en el mapa:
// un parche pintado en el piso, un bloque bajo (losa, plataforma) o los dos (mundo/texturas.js los dibuja).
// Tres formas de hacerla:
// - a mano: un tipo (pasto, tierra, piedras, tablas, musgo, nieve, hojas, ceniza, runas), sus cuatro colores,
//   tamaño, densidad y semilla;
// - con la IA del panel 8 (Claude, ChatGPT o Gemini): se le describe y contesta una receta, que se dibuja con caras
//   planas como el resto del juego;
// - como imagen: ChatGPT (gpt-image-1) o Gemini la generan, o se sube una; se pasa a los colores del juego y se
//   espeja en cuatro para que no tenga costura.
// Lo guardado va a AGREGADOS.texturas (y con eso al juego). Las claves de la IA siguen solo en este navegador.
window.EDITOR_TEXTURAS = (function () {
  "use strict";
  const E = window.EDITOR,
    T = window.TEXTURAS,
    t = E.t,
    $ = (id) => document.getElementById(id);
  const panel = $("txPanel"),
    vista = $("txVista"),
    cv = vista.getContext("2d");
  const MODELO_IMAGEN = { chatgpt: "gpt-image-1", gemini: "gemini-2.5-flash-image" };
  let actual = { receta: { tipo: "pasto", colores: T.COLORES.pasto.slice(), tam: 24, dens: 5, sem: 1 } },
    editando = null, // el id de la textura guardada que se está cambiando
    pensando = false;

  // ---------- el panel ----------
  $("txTipo").innerHTML = T.TIPOS.map((k) => `<option value="${k}">${t("ed.tx_t_" + k)}</option>`).join("");
  const colores = () => [0, 1, 2, 3].map((i) => $("txC" + i).value.toUpperCase());
  function aReceta() {
    actual = { receta: { tipo: $("txTipo").value, colores: colores(), tam: +$("txTam").value, dens: +$("txDens").value, sem: (actual.receta && actual.receta.sem) || 1 } };
    pintar();
  }
  function aPanel() {
    const rc = actual.receta;
    $("txManual").classList.toggle("apagado", !rc);
    if (rc) {
      $("txTipo").value = rc.tipo;
      rc.colores.forEach((h, i) => ($("txC" + i).value = h));
      $("txTam").value = rc.tam;
      $("txDens").value = rc.dens;
    }
    pintar();
  }
  // la vista: la textura dos por dos, así se ve que no tiene costura
  function pintar() {
    const dibujar = () => {
      const l = T.lienzoDe(actual),
        m = vista.width / 2;
      cv.fillStyle = "#111111";
      cv.fillRect(0, 0, vista.width, vista.height);
      if (!l) return setTimeout(dibujar, 60);
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) cv.drawImage(l, i * m, j * m, m, m);
    };
    dibujar();
    $("txTamV").textContent = $("txTam").value;
    $("txDensV").textContent = $("txDens").value;
  }
  ["txTipo"].forEach((id) =>
    $(id).addEventListener("change", () => {
      T.COLORES[$("txTipo").value].forEach((h, i) => ($("txC" + i).value = h));
      aReceta();
    }),
  );
  ["txC0", "txC1", "txC2", "txC3", "txTam", "txDens"].forEach((id) => $(id).addEventListener("input", aReceta));
  $("txSemilla").onclick = () => {
    if (!actual.receta) aReceta();
    actual.receta.sem = 1 + Math.floor(Math.random() * 9999);
    pintar();
  };
  ["txNomEs", "txNomEn", "txPedido"].forEach((id) => $(id).addEventListener("keydown", (e) => e.stopPropagation()));
  function estado(txt, error) {
    $("txEstado").textContent = txt || "";
    $("txEstado").classList.toggle("error", !!error);
  }

  // ---------- con IA ----------
  const SISTEMA_RECETA = () =>
    [
      "You design seamless ground textures for Eromash, a 2.5D Norse adventure game drawn with flat faces, no outlines, light from the upper right.",
      "A texture is a recipe drawn by the game: tipo is one of " + T.TIPOS.join(", ") + ".",
      "colores are four hex colors: background, tone 1, tone 2, and highlight (or glow, for runas and ceniza). Stay close to the game's palette: " + T.coloresDelJuego().slice(0, 60).map((p) => "#" + p.map((v) => v.toString(16).padStart(2, "0")).join("")).join(" ") + ".",
      "tam is the size of the shapes in pixels (6 to 80) and dens their density (1 to 12).",
      'Answer only with one JSON object: {"tipo": string, "colores": [4 hex], "tam": number, "dens": number, "nombre": {"es": string, "en": string}}. The names are short (two or three words), in Spanish and English.',
    ].join("\n");
  const PEDIDO_IMAGEN = (p) =>
    "A seamless tileable square texture, seen from straight above, of: " + p + ". Stylized for a Norse 2.5D game: flat low-poly shapes with hard edges, no outlines, no gradients, no text, no border, no perspective, soft light from the upper right, earthy muted forest palette with dark greens, browns and stone greys. The pattern fills the whole square evenly.";
  async function imagenDe(quien, clave, pedido) {
    if (quien === "chatgpt") {
      const r = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer " + clave },
        body: JSON.stringify({ model: MODELO_IMAGEN.chatgpt, prompt: PEDIDO_IMAGEN(pedido), size: "1024x1024", n: 1 }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error((j.error && j.error.message) || r.status);
      return "data:image/png;base64," + j.data[0].b64_json;
    }
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + MODELO_IMAGEN.gemini + ":generateContent", {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": clave },
      body: JSON.stringify({ contents: [{ parts: [{ text: PEDIDO_IMAGEN(pedido) }] }], generationConfig: { responseModalities: ["IMAGE"] } }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || r.status);
    const parte = ((j.candidates && j.candidates[0] && j.candidates[0].content.parts) || []).find((q) => q.inlineData);
    if (!parte) throw new Error(t("ed.tx_sin_imagen"));
    return "data:" + (parte.inlineData.mimeType || "image/png") + ";base64," + parte.inlineData.data;
  }
  const cargarImagen = (src) =>
    new Promise((ok, mal) => {
      const im = new Image();
      im.onload = () => ok(im);
      im.onerror = () => mal(new Error(t("ed.tx_sin_imagen")));
      im.src = src;
    });
  async function desdeImagen(src) {
    const im = await cargarImagen(src),
      img = T.procesar(im, { paleta: $("txPaleta").checked, espejo: $("txEspejo").checked });
    actual = { img };
    aPanel();
  }
  async function generar() {
    const pedido = $("txPedido").value.trim(),
      fuente = $("txFuente").value;
    if (!pedido) return estado(t("ed.ia_falta_pedido"), true);
    if (pensando || !window.EDITOR_IA) return;
    const ia = EDITOR_IA.elegida(),
      quien = fuente === "receta" ? ia.quien : fuente,
      clave = fuente === "receta" ? ia.clave : ia.claves[fuente] || "";
    if (quien === "otra" || !clave) return estado(t("ed.tx_falta_clave", [fuente === "receta" ? $("iaQuien").selectedOptions[0].textContent : fuente === "chatgpt" ? "ChatGPT" : "Gemini"]), true);
    pensando = true;
    $("txGenerar").disabled = true;
    estado(t("ed.tx_pensando"));
    try {
      if (fuente === "receta") {
        const txt = await EDITOR_IA.llamar(quien, ia.modelo, clave, [{ role: "user", content: pedido }], SISTEMA_RECETA()),
          js = JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1));
        const tipo = T.TIPOS.includes(js.tipo) ? js.tipo : "pasto",
          col = Array.isArray(js.colores) && js.colores.length === 4 && js.colores.every((h) => /^#[0-9a-f]{6}$/i.test(h)) ? js.colores.map((h) => h.toUpperCase()) : T.COLORES[tipo].slice();
        actual = { receta: { tipo, colores: col, tam: Math.max(6, Math.min(80, +js.tam || 24)), dens: Math.max(1, Math.min(12, +js.dens || 5)), sem: 1 + Math.floor(Math.random() * 9999) } };
        if (js.nombre && !$("txNomEs").value) ($("txNomEs").value = js.nombre.es || ""), ($("txNomEn").value = js.nombre.en || "");
        aPanel();
      } else await desdeImagen(await imagenDe(fuente, clave, pedido));
      estado(t("ed.tx_lista"));
      E.usar("tx_generar");
    } catch (e) {
      estado(t("ed.ia_error", [String(e.message || e)]), true);
    }
    pensando = false;
    $("txGenerar").disabled = false;
  }
  $("txGenerar").onclick = generar;
  $("txPedido").addEventListener("keydown", (e) => e.key === "Enter" && (e.ctrlKey || e.metaKey) && generar());
  $("txSubir").onclick = () => $("txArchivo").click();
  $("txArchivo").addEventListener("change", () => {
    const f = $("txArchivo").files[0];
    $("txArchivo").value = "";
    if (!f) return;
    const lector = new FileReader();
    lector.onload = () => desdeImagen(lector.result).then(() => estado(t("ed.tx_lista")), (e) => estado(String(e.message || e), true));
    lector.readAsDataURL(f);
    if (!$("txNomEs").value) $("txNomEs").value = f.name.replace(/\.[^.]+$/, "");
  });
  // la imagen que se está viendo, con las opciones nuevas de colores o costura: hay que volver a subirla o generarla
  ["txPaleta", "txEspejo"].forEach((id) => $(id).addEventListener("change", () => !actual.receta && estado(t("ed.tx_rehacer"))));

  // ---------- guardar en los assets ----------
  function guardarla() {
    const es = $("txNomEs").value.trim();
    if (!es) return estado(t("ed.tx_falta_nombre"), true), $("txNomEs").focus();
    const en = $("txNomEn").value.trim() || es,
      tabla = E.est().texturas || {};
    let id = editando || T.idDe(es);
    if (!editando) for (let n = 2; tabla[id]; n++) id = T.idDe(es) + "_" + n;
    const tx = { nombre: { es, en }, uso: $("txUso").value };
    if (actual.receta) tx.receta = JSON.parse(JSON.stringify(actual.receta));
    else tx.img = actual.img;
    E.cambiar((est) => ((est.texturas = est.texturas || {})[id] = tx));
    editando = id;
    pintarLista();
    E.usar("tx_guardar");
    E.avisar(t("ed.tx_guardada", [es]));
    // lista para poner: el parche (o el bloque) queda elegido en la lista de objetos
    E.elegir((tx.uso === "bloque" ? "txb_" : "tx_") + id);
  }
  $("txGuardar").onclick = guardarla;
  $("txNueva").onclick = () => {
    editando = null;
    $("txNomEs").value = $("txNomEn").value = "";
    $("txUso").value = "parche";
    actual = { receta: { tipo: $("txTipo").value, colores: colores(), tam: +$("txTam").value, dens: +$("txDens").value, sem: 1 + Math.floor(Math.random() * 9999) } };
    aPanel();
    pintarLista();
  };
  function pintarLista() {
    const tabla = E.est().texturas || {},
      ul = $("txLista");
    ul.innerHTML = "";
    $("txTuyas").classList.toggle("oculto", !Object.keys(tabla).length);
    Object.keys(tabla).forEach((id) => {
      const tx = tabla[id],
        li = document.createElement("button"),
        m = document.createElement("canvas");
      li.className = "txFicha" + (id === editando ? " elegido" : "");
      m.width = m.height = 48;
      const pintarMini = () => {
        const l = T.lienzo(id);
        if (!l) return setTimeout(pintarMini, 80);
        m.getContext("2d").drawImage(l, 0, 0, 48, 48);
      };
      pintarMini();
      const s = document.createElement("span");
      s.textContent = (tx.nombre && (tx.nombre[I18N.lang] || tx.nombre.es)) || id;
      const x = document.createElement("i");
      x.textContent = "×";
      x.title = t("ed.tx_sacar");
      li.append(m, s, x);
      li.onclick = (e) => {
        if (e.target === x) {
          if (!confirm(t("ed.tx_sacar_seguro", [s.textContent]))) return;
          E.cambiar((est) => delete est.texturas[id]);
          if (editando === id) editando = null;
          return pintarLista();
        }
        editando = id;
        $("txNomEs").value = tx.nombre.es || "";
        $("txNomEn").value = tx.nombre.en || "";
        $("txUso").value = tx.uso || "parche";
        actual = tx.receta ? { receta: JSON.parse(JSON.stringify(tx.receta)) } : { img: tx.img };
        aPanel();
        pintarLista();
      };
      ul.appendChild(li);
    });
  }

  function abrir() {
    E.usar("texturas");
    panel.classList.remove("oculto");
    $("hTexturas").classList.add("activo");
    pintarLista();
    aPanel();
  }
  function cerrar() {
    panel.classList.add("oculto");
    $("hTexturas").classList.remove("activo");
  }
  const abierta = () => !panel.classList.contains("oculto");
  const alternar = () => (abierta() ? cerrar() : abrir());
  $("txCerrar").onclick = cerrar;
  $("hTexturas").onclick = alternar;
  function tecla(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    if (e.key === "y" || e.key === "Y") return alternar(), true;
    if (e.key === "Escape" && abierta()) return cerrar(), true;
    return false;
  }
  return { abrir, cerrar, alternar, abierta, tecla, pintarLista };
})();
