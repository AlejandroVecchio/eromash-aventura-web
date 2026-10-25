// ---------- hablar con una IA adentro del editor ----------
// Se elige una zona (con Mover, arrastrando un rectángulo; si no, lo que se ve), se le pide algo («un claro con un
// campamento abandonado», «tres casas mirando al camino») y la IA devuelve qué poner, qué caminos trazar y qué sacar.
// Se ve primero como vista previa y recién se aplica con «Aplicar» (y se deshace con Ctrl+Z, como todo).
// Claude, ChatGPT y Gemini se llaman directo desde el navegador con la clave de cada uno, que se guarda solo en este
// navegador (nunca en un archivo). Con «Otra» (Cursor o cualquier chat) se copia el pedido y se pega la respuesta.
window.EDITOR_IA = (function () {
  "use strict";
  const E = window.EDITOR,
    t = E.t,
    $ = (id) => document.getElementById(id);
  const CLAVE = "eromash-aventura-editor-ia";
  const MODELOS = { claude: "claude-opus-5-5", chatgpt: "gpt-5", gemini: "gemini-2.5-pro", otra: "" };
  let conf = { quien: "claude", modelos: {}, claves: {} };
  try {
    conf = Object.assign(conf, JSON.parse(localStorage.getItem(CLAVE) || "{}"));
  } catch (e) {}
  const guardarConf = () => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(conf));
    } catch (e) {}
  };
  const panel = $("iaPanel");
  let conv = [], // la conversación: [{ role: "user" | "assistant", content }]
    propuesta = null, // lo que propuso la IA, a la vista hasta aplicarlo o descartarlo
    pensando = false;

  // ---------- el panel ----------
  function pintarConf() {
    $("iaQuien").value = conf.quien;
    $("iaModelo").value = conf.modelos[conf.quien] || MODELOS[conf.quien];
    $("iaClave").value = conf.claves[conf.quien] || "";
    const otra = conf.quien === "otra";
    $("iaFilaClave").classList.toggle("oculto", otra);
    $("iaClaveAyuda").textContent = t(otra ? "ed.ia_otra_ayuda" : "ed.ia_clave_ayuda");
    $("iaModelo").classList.toggle("oculto", otra);
    $("iaOtra").classList.toggle("oculto", !otra);
    $("iaEnviar").classList.toggle("oculto", otra);
  }
  $("iaQuien").addEventListener("change", () => {
    conf.quien = $("iaQuien").value;
    guardarConf();
    pintarConf();
  });
  $("iaModelo").addEventListener("change", () => {
    conf.modelos[conf.quien] = $("iaModelo").value.trim();
    guardarConf();
  });
  $("iaClave").addEventListener("change", () => {
    conf.claves[conf.quien] = $("iaClave").value.trim();
    guardarConf();
  });
  ["iaModelo", "iaClave", "iaPedido", "iaRespuesta"].forEach((id) => $(id).addEventListener("keydown", (e) => e.stopPropagation()));
  $("iaPedido").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) enviar();
  });
  function pintarZona() {
    const z = E.zona(),
      [x0, y0, x1, y1] = z.caja;
    $("iaZona").textContent = t(z.deRect ? "ed.ia_zona_rect" : "ed.ia_zona_vista_txt", [Math.round((x1 - x0) / 30), Math.round((y1 - y0) / 30)]);
  }
  function abrir() {
    E.usar("ia");
    panel.classList.remove("oculto");
    pintarConf();
    pintarZona();
    setTimeout(() => $("iaPedido").focus(), 0);
    E.pedir();
  }
  function cerrar() {
    panel.classList.add("oculto");
    E.pedir();
  }
  const abierta = () => !panel.classList.contains("oculto");
  $("iaCerrar").onclick = cerrar;
  $("iaZonaVista").onclick = () => {
    E.olvidarZona();
    pintarZona();
    E.pedir();
  };
  setInterval(() => abierta() && pintarZona(), 700);
  function decir(txt, clase) {
    const p = document.createElement("p");
    if (clase) p.className = clase;
    p.textContent = txt;
    $("iaChat").appendChild(p);
    $("iaChat").scrollTop = $("iaChat").scrollHeight;
    return p;
  }

  // ---------- el pedido: qué es el mundo, la zona, qué hay ahí y qué objetos existen ----------
  const SISTEMA = [
    "You are a level designer helping build Eldervald, the forest world of Eromash, a 2.5D Norse adventure game seen from above at an angle.",
    "Coordinates are world units: 30 units are about 1 meter. x grows to the east, y grows to the south (down the screen). An object's x, y is where its foot touches the ground.",
    "Only change things inside the zone the user selected. Use only asset ids from the catalog. Each catalog line is: id | name | group | height | footprint (r = round radius, w = width) | 'ends' when it goes from one end to another.",
    "Objects with 'ends' (fences, walls, bridges, canals) also need o.x2 and o.y2: the world position of their second end.",
    "Optional fields in o: esc (size, 0.5 to 2), esp (true flips it), giro (degrees it turns on the ground), sem (integer variant), orden (draw order offset, multiples of 40).",
    "Roads are { p: [[x, y], ...], w: width (60 to 300), tipo: 'tierra' | 'adoquin' | 'ladrillo', borde: 'pasto' | 'musgo' | 'agua' | 'tierra' | '' }. A road that ends on another road joins it.",
    "To remove existing world objects, list them in quitar with the exact id, x and y from the existing list. Never remove story objects (historia: true).",
    "Design like a real place: every object has a reason to be there, solid things keep at least 40 units apart and never sit on a road, paths lead somewhere. Prefer named, specific assets over filler.",
    "Answer in the user's language. First a short explanation for the user (two or three sentences), then exactly one JSON object in a ```json block:",
    '{"explicacion": string, "poner": [{"id": string, "x": number, "y": number, "o": object}], "caminos": [road], "quitar": [{"id": string, "x": number, "y": number}]}',
    "At most 300 objects. If the request is unclear, make the most reasonable choice and say what you chose.",
  ].join("\n");
  function catalogo() {
    return ASSETS.catalogo()
      .map((a) => {
        const nom = t("as." + a.id),
          md = ASSETS.medidas(a.id, Object.assign({}, a.ejemplo)),
          ch = md.choque ? (md.choque.r ? "r" + Math.round(md.choque.r) : "w" + Math.round(md.choque.w || 0)) : "-";
        return [a.id, nom === "as." + a.id ? a.id : nom, a.grupo, Math.round(a.alto || 0), ch].join(" | ") + (a.ejemplo && a.ejemplo.x2 !== undefined ? " | ends" : "");
      })
      .join("\n");
  }
  function contexto(pedido) {
    const z = E.zona(),
      [x0, y0, x1, y1] = z.caja,
      cosas = E.cosasEn(x0, y0, x1, y1),
      // si hay demasiado, lo más importante primero (lo de la historia y lo agregado), después lo demás
      orden = cosas.sort((a, b) => (b.historia ? 2 : b.agregado ? 1 : 0) - (a.historia ? 2 : a.agregado ? 1 : 0)).slice(0, 260);
    return (
      "Request: " + pedido + "\n\n" +
      "Zone: x " + x0 + " to " + x1 + ", y " + y0 + " to " + y1 + " (" + Math.round((x1 - x0) / 30) + " m by " + Math.round((y1 - y0) / 30) + " m).\n" +
      "Existing objects in the zone (" + cosas.length + (cosas.length > orden.length ? ", showing " + orden.length : "") + "):\n" + JSON.stringify(orden) + "\n\n" +
      "Roads near the zone:\n" + JSON.stringify(E.caminosEn(x0, y0, x1, y1)) + "\n\n" +
      "Asset catalog:\n" + catalogo()
    );
  }

  // ---------- llamar a cada IA ----------
  // sistema: las instrucciones (las del mapa si no se dice otra cosa; las texturas mandan las suyas)
  // el contenido de un mensaje para Gemini: texto, o una lista como la de Claude (texto e imágenes, como el boceto)
  const partes = (ct) => (Array.isArray(ct) ? ct.map((p) => (p.type === "image" ? { inline_data: { mime_type: p.source.media_type, data: p.source.data } } : { text: p.text || "" })) : [{ text: ct }]);
  async function llamar(quien, modelo, clave, mensajes, sistema = SISTEMA) {
    if (quien === "claude") {
      const conRespaldo = /^claude-(opus-5-5|opus-5|fable-5-1|sonnet-5-5)$/.test(modelo),
        cuerpo = { model: modelo, max_tokens: 16000, system: sistema, messages: mensajes, output_config: { effort: "medium" } };
      if (conRespaldo) cuerpo.fallbacks = "default";
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: Object.assign(
          { "content-type": "application/json", "x-api-key": clave, "anthropic-version": "2026-10-21", "anthropic-dangerous-direct-browser-access": "true" },
          conRespaldo ? { "anthropic-beta": "server-side-fallback-2026-07-01" } : {},
        ),
        body: JSON.stringify(cuerpo),
      });
      const j = await r.json();
      if (!r.ok) throw new Error((j.error && j.error.message) || r.status);
      if (j.stop_reason === "refusal") throw new Error(t("ed.ia_rechazo"));
      return (j.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    }
    if (quien === "chatgpt") {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer " + clave },
        body: JSON.stringify({ model: modelo, messages: [{ role: "system", content: sistema }].concat(mensajes) }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error((j.error && j.error.message) || r.status);
      return j.choices[0].message.content;
    }
    if (quien === "gemini") {
      const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(modelo) + ":generateContent", {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": clave },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: sistema }] }, contents: mensajes.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: partes(m.content) })) }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error((j.error && j.error.message) || r.status);
      return ((j.candidates && j.candidates[0] && j.candidates[0].content.parts) || []).map((p) => p.text || "").join("\n");
    }
    throw new Error("?");
  }

  // ---------- leer lo que contestó: el texto para Alejandro y el JSON con los cambios ----------
  function leer(txt) {
    let js = null;
    const m = txt.match(/```(?:json)?\s*([\s\S]*?)```/);
    const crudo = m ? m[1] : txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1);
    try {
      js = JSON.parse(crudo);
    } catch (e) {}
    const texto = (m ? txt.replace(m[0], "") : js ? txt.slice(0, txt.indexOf("{")) : txt).trim() || (js && js.explicacion) || "";
    if (!js) return { texto, ops: null };
    // solo lo que existe y cae en la zona (con un margen), y a lo sumo 300
    const [x0, y0, x1, y1] = E.zona().caja,
      mg = 200,
      adentro = (x, y) => isFinite(x) && isFinite(y) && x > x0 - mg && x < x1 + mg && y > y0 - mg && y < y1 + mg;
    const poner = (Array.isArray(js.poner) ? js.poner : [])
      .filter((a) => a && ASSETS.LISTA[a.id] && adentro(+a.x, +a.y))
      .slice(0, 300)
      .map((a) => {
        const o = a.o && typeof a.o === "object" ? a.o : {};
        if (ASSETS.EJEMPLO[a.id] && ASSETS.EJEMPLO[a.id].x2 !== undefined && (o.x2 === undefined || o.y2 === undefined)) (o.x2 = +a.x + 160), (o.y2 = +a.y);
        return { id: a.id, x: +a.x, y: +a.y, o };
      });
    const caminos = (Array.isArray(js.caminos) ? js.caminos : []).filter((c) => c && Array.isArray(c.p) && c.p.length >= 2 && c.p.every((q) => Array.isArray(q) && isFinite(q[0]) && isFinite(q[1]))).slice(0, 20);
    const quitar = (Array.isArray(js.quitar) ? js.quitar : []).filter((q) => q && q.id && adentro(+q.x, +q.y)).slice(0, 300);
    return { texto: texto || js.explicacion || "", ops: { poner, caminos, quitar } };
  }
  function mostrar(txt) {
    const { texto, ops } = leer(txt);
    if (texto) decir(texto);
    if (!ops || (!ops.poner.length && !ops.caminos.length && !ops.quitar.length)) {
      propuesta = null;
      $("iaPropuesta").classList.add("oculto");
      if (!ops) decir(t("ed.ia_sin_json"), "error");
      return;
    }
    propuesta = ops;
    $("iaResumen").textContent = t("ed.ia_resumen", [ops.poner.length, ops.caminos.length, ops.quitar.length]);
    $("iaPropuesta").classList.remove("oculto");
    E.pedir();
  }
  async function enviar() {
    const pedido = $("iaPedido").value.trim();
    if (!pedido || pensando) return;
    const quien = conf.quien,
      modelo = ($("iaModelo").value || MODELOS[quien]).trim(),
      clave = ($("iaClave").value || "").trim();
    if (!clave) return decir(t("ed.ia_falta_clave"), "error");
    conf.claves[quien] = clave;
    conf.modelos[quien] = modelo;
    guardarConf();
    decir(pedido, "yo");
    $("iaPedido").value = "";
    conv.push({ role: "user", content: contexto(pedido) });
    conv = conv.slice(-8);
    pensando = true;
    const espera = decir(t("ed.ia_pensando", [$("iaQuien").selectedOptions[0].textContent]));
    try {
      const txt = await llamar(quien, modelo, clave, conv);
      espera.remove();
      conv.push({ role: "assistant", content: txt });
      mostrar(txt);
    } catch (e) {
      espera.remove();
      conv.pop();
      decir(t("ed.ia_error", [String(e.message || e)]), "error");
    }
    pensando = false;
  }
  $("iaEnviar").onclick = enviar;
  // con Cursor u otro chat: se copia el pedido entero y después se pega lo que contestó
  $("iaCopiar").onclick = () => {
    const pedido = $("iaPedido").value.trim();
    if (!pedido) return decir(t("ed.ia_falta_pedido"), "error");
    const todo = SISTEMA + "\n\n" + contexto(pedido);
    const ok = () => decir(t("ed.ia_copiado"));
    try {
      navigator.clipboard.writeText(todo).then(ok, () => decir(t("ed.ia_no_copia"), "error"));
    } catch (e) {
      decir(t("ed.ia_no_copia"), "error");
    }
  };
  $("iaLeer").onclick = () => {
    const txt = $("iaRespuesta").value.trim();
    if (!txt) return;
    $("iaRespuesta").value = "";
    mostrar(txt);
  };
  $("iaAplicar").onclick = () => {
    if (!propuesta) return;
    E.aplicar(propuesta);
    propuesta = null;
    $("iaPropuesta").classList.add("oculto");
    decir(t("ed.ia_aplicado"));
  };
  $("iaDescartar").onclick = () => {
    propuesta = null;
    $("iaPropuesta").classList.add("oculto");
    E.pedir();
  };

  // ---------- en el mapa: la zona (celeste) y la vista previa de lo propuesto ----------
  function dibujar(c, cam, V, enVista, tt) {
    if (!abierta()) return;
    const [x0, y0, x1, y1] = E.zona().caja;
    c.save();
    c.strokeStyle = "#73D5DB";
    c.lineWidth = 2.5 / cam.z;
    c.setLineDash([14 / cam.z, 8 / cam.z]);
    c.beginPath();
    [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].forEach(([x, y], i) => (i ? c.lineTo(...V(x, y)) : c.moveTo(...V(x, y))));
    c.closePath();
    c.stroke();
    c.restore();
    if (!propuesta) return;
    c.save();
    c.strokeStyle = "#FFD98A";
    c.lineWidth = 6 / cam.z;
    c.setLineDash([16 / cam.z, 10 / cam.z]);
    propuesta.caminos.forEach((cm) => {
      c.beginPath();
      cm.p.forEach(([x, y], i) => (i ? c.lineTo(...V(x, y)) : c.moveTo(...V(x, y))));
      c.stroke();
    });
    c.restore();
    E.fantasmas(c, propuesta.poner, tt, 0.65);
    c.strokeStyle = "#C8402D";
    c.lineWidth = 3 / cam.z;
    propuesta.quitar.forEach((q) => {
      const [x, y] = V(q.x, q.y),
        r = 10 / cam.z;
      c.beginPath();
      c.moveTo(x - r, y - r);
      c.lineTo(x + r, y + r);
      c.moveTo(x + r, y - r);
      c.lineTo(x - r, y + r);
      c.stroke();
    });
  }
  function alternar() {
    abierta() ? cerrar() : abrir();
  }
  pintarConf();
  // para otros módulos (texturas): la misma IA, modelo y clave que eligió acá
  const elegida = () => ({ quien: conf.quien, modelo: conf.modelos[conf.quien] || MODELOS[conf.quien], clave: conf.claves[conf.quien] || "", claves: conf.claves });
  return { abrir, cerrar, alternar, abierta, dibujar, llamar, elegida, catalogo };
})();
