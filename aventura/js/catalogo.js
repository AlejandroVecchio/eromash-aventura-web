// Página de revisión: dibuja cada asset, persona y criatura sobre el piso del bosque, animados.
(function () {
  "use strict";
  const cat = document.getElementById("cat");
  const fichas = [];
  const params = new URLSearchParams(location.search);
  if (params.get("lang")) I18N.setLang(params.get("lang"));
  // la norma de giro: si algún asset no se puede ver con la cámara girada, se avisa acá (ver ASSETS.sinGiro)
  if (ASSETS.sinGiro) {
    const faltan = ASSETS.sinGiro();
    if (faltan.length) console.warn("Assets sin giro (sumarles fv + vol, figura o caras):", faltan.join(", "));
  }
  function ficha(grupoEl, nombre, w, h, dibujar) {
    const f = document.createElement("div");
    f.className = "ficha";
    const cv = document.createElement("canvas");
    const k = Math.min(2, window.devicePixelRatio || 1);
    cv.width = w * k;
    cv.height = h * k;
    cv.style.width = w + "px";
    cv.style.height = h + "px";
    const p = document.createElement("p");
    p.textContent = nombre;
    f.append(cv, p);
    grupoEl.appendChild(f);
    fichas.push({ cv, w, h, k, dibujar });
  }
  function grupo(clave) {
    const h = document.createElement("h2");
    h.textContent = I18N.t(clave);
    const g = document.createElement("div");
    g.className = "grilla";
    cat.append(h, g);
    return g;
  }
  // la cámara del catálogo: todo se puede mirar desde cualquier lado (VOL.cam.g); el piso gira alrededor del pie
  // de lo que se muestra en cada ficha
  const giro = { g: 0, sola: false };
  const $ = (id) => document.getElementById(id);
  function ponerGiro(gr) {
    while (gr > 180) gr -= 360;
    while (gr < -180) gr += 360;
    giro.g = gr;
    $("giroCam").value = Math.round(gr);
    $("giroCamV").textContent = Math.round(gr) + "°";
  }
  $("giroCam").addEventListener("input", () => ponerGiro(+$("giroCam").value));
  $("giroSola").addEventListener("change", () => (giro.sola = $("giroSola").checked));
  $("giroNorte").addEventListener("click", () => (($("giroSola").checked = giro.sola = false), ponerGiro(0)));
  if (params.get("giro")) ponerGiro(+params.get("giro"));
  const piso = (c, w, h) => {
    c.fillStyle = "#3B3222";
    c.fillRect(0, 0, w, h);
    c.save();
    VOL.piso(c, w / 2, h - 40);
    c.fillStyle = "#463B28";
    for (let i = 0; i < 6; i++) {
      c.beginPath();
      c.ellipse((i * 97) % w, 30 + ((i * 61) % (h - 40)), 60, 12, 0, 0, Math.PI * 2);
      c.fill();
    }
    // una cruz en el piso: hacia dónde queda el norte del mundo
    c.strokeStyle = "rgba(242,236,236,0.12)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(w / 2 - 80, h - 40);
    c.lineTo(w / 2 + 80, h - 40);
    c.moveTo(w / 2, h - 40 - 64);
    c.lineTo(w / 2, h - 40 + 64);
    c.stroke();
    c.restore();
  };
  // assets
  const porGrupo = {};
  ASSETS.catalogo().forEach((a) => (porGrupo[a.grupo] = porGrupo[a.grupo] || []).push(a));
  Object.keys(porGrupo).forEach((g) => {
    const el = grupo("as.grupo." + g);
    porGrupo[g].forEach((a) => {
      const ancho = ["casaLindes", "aserradero", "santuario", "puertaSur", "casaSanacion", "hongoDorado", "huerta", "tingCirculo", "herreriaAsa", "cordeleriaFolke", "muralla"].includes(a.id);
      const grande = ancho || a.alto > 120 || ["carroVolcado", "puentePaso", "puenteTablas", "empalizada"].includes(a.id);
      const w = grande ? (ancho ? 560 : 400) : 240,
        h = grande ? 400 : 260,
        esc = Math.min(2.2, (h - 80) / a.alto, ancho ? (a.id === "puertaSur" ? 1.1 : 1.3) : 9);
      ficha(el, I18N.t("as." + a.id), w, h, (c, t) => {
        piso(c, w, h);
        const o = Object.assign({ s: esc, sem: 3 }, a.ejemplo);
        if (o.x2 !== undefined) { o.x2 *= esc; o.y2 *= esc; }
        let x = w / 2,
          y = h - 40;
        if (a.id === "puentePaso" || a.id === "puenteTablas") {
          x = a.id === "puentePaso" ? w / 2 : 100;
          y = a.id === "puentePaso" ? h - 30 : h / 2 + 20;
          o.x2 = x + o.x2;
          o.y2 = y + o.y2;
        }
        if (a.id === "muralla") {
          x = 120;
          o.x2 = x + o.x2;
          o.y2 = y + o.y2;
        }
        if (a.id === "tingCirculo") y = h / 2 + 30;
        if (a.id === "soporteAtadura") o.hacia = [x + o.hacia[0], y + o.hacia[1]];
        if (a.id === "empalizada") x = 50;
        if (a.id === "aserradero") x = w / 2 - 30;
        // lo del piso va pintado en el piso: gira con él
        c.save();
        if (ASSETS.LISTA[a.id].piso) VOL.piso(c, x, y);
        ASSETS.dibujar(c, a.id, x, y, t, o);
        c.restore();
      });
    });
  });
  // las piedras del rito: cada tipo dormido y despierto
  const gr = grupo("cat.rito");
  Object.keys(ASSETS.RITO).forEach((tipo) =>
    [false, true].forEach((viva) =>
      ficha(gr, I18N.t("pr.tipo_" + tipo).replace(/^./, (l) => l.toUpperCase()) + (viva ? " · ✦" : ""), 180, 240, (c, t) => {
        piso(c, 180, 240);
        ASSETS.dibujar(c, "piedraRito", 90, 210, t, { s: 1.25, sem: 3, tipo, viva, marca: 2, carga: viva ? 0 : 0.35 });
      }),
    ),
  );
  // las miniaturas del mapa
  const gi = grupo("cat.iconos");
  ICONOS.TIPOS.forEach((tipo) =>
    ficha(gi, I18N.t("cat.ic_" + tipo), 120, 120, (c) => {
      c.fillStyle = "#2C3A24";
      c.fillRect(0, 0, 120, 120);
      ICONOS.dibujar(c, tipo, 60, 60, 36, { runa: tipo === "altar" ? "kenaz" : "ansuz", col: tipo === "altar" ? "#FF8D71" : null });
    }),
  );
  // Eromash
  const ge = grupo("as.grupo.eromash");
  ["R", "W", "B", "V"].forEach((col) =>
    [["S", false], ["E", false], ["N", false], ["E", true]].forEach(([v, esp]) =>
      ficha(ge, I18N.t("cat.vik." + ({ R: "red", W: "white", B: "blue", V: "green" }[col] || "red")) + " · " + v + (esp ? "→O" : ""), 150, 180, (c, t) => {
        piso(c, 150, 180);
        const img = VIKINGO.imagen(col, v, "calm");
        if (!img.complete) return;
        c.save();
        c.translate(75, 100 + Math.sin(t * 2.5) * 2);
        if (esp) c.scale(-1, 1);
        c.drawImage(img, -55, -66, 110, 132);
        c.restore();
      }),
    ),
  );
  // sus caras (las de la arena y las de la aventura), de frente y de costado
  const gk = grupo("as.grupo.caras");
  VIKINGO.OJOS.forEach((o) =>
    ["S", "E"].forEach((v) =>
      ficha(gk, I18N.t("cat.cara." + o) + " · " + v, 150, 180, (c, t) => {
        piso(c, 150, 180);
        const img = VIKINGO.imagen("R", v, o);
        if (!img.complete) return;
        c.drawImage(img, 20, 34 + Math.sin(t * 2.5) * 2, 110, 132);
      }),
    ),
  );
  // gente y criaturas
  if (window.GENTE) {
    const gg = grupo("as.grupo.gente");
    Object.keys(GENTE.FICHAS).forEach((id) =>
      ["S", "SE", "E", "NE", "N"].forEach((v) =>
        ficha(gg, I18N.t("av.nombre_" + GENTE.nombre(id)) + " · " + v, 150, 180, (c, t) => {
          piso(c, 150, 180);
          GENTE.dibujar(c, id, 75, 150, t, { vista: v, hablando: v === "S" });
        }),
      ),
    );
  }
  if (window.CRIATURAS) {
    const gc = grupo("as.grupo.enemigos");
    // las del bosque profundo tienen tres colores: se muestran de frente en cada uno
    const PALETAS = ["draugr", "jabali", "cuervo", "fatuo", "fatuoMayor", "trol", "oso"];
    CRIATURAS.LISTA.forEach((id) =>
      ["S", "E", "N", "S1", "S2"].forEach((v) => {
        const pal = v.length > 1 ? Number(v[1]) : 0;
        if (pal && !PALETAS.includes(id)) return;
        const big = id === "ciervo" || id === "trol" || id === "oso";
        const w = big ? 360 : 200,
          h = big ? 360 : 200;
        ficha(gc, I18N.t("cr." + id) + " · " + (pal ? I18N.t("cat.color", [pal + 1]) : v), w, h, (c, t) => {
          piso(c, w, h);
          CRIATURAS.dibujar(c, id, w / 2, h - 40, t, { vista: v[0], mov: 1, pal });
        });
      }),
    );
  }
  let antes = 0;
  function cuadro(ms) {
    const t = ms / 1000;
    if (giro.sola) ponerGiro(giro.g + (t - antes) * 30);
    antes = t;
    VOL.cam.g = (giro.g * Math.PI) / 180;
    fichas.forEach((f) => {
      const c = f.cv.getContext("2d");
      c.setTransform(f.k, 0, 0, f.k, 0, 0);
      f.dibujar(c, t);
    });
    requestAnimationFrame(cuadro);
  }
  I18N.apply(document);
  requestAnimationFrame(cuadro);
})();
