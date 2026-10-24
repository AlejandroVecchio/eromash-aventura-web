// Página de revisión: dibuja cada asset, persona y criatura sobre el piso del bosque, animados.
(function () {
  "use strict";
  const cat = document.getElementById("cat");
  const fichas = [];
  const params = new URLSearchParams(location.search);
  if (params.get("lang")) I18N.setLang(params.get("lang"));
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
  const piso = (c, w, h) => {
    c.fillStyle = "#3B3222";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#463B28";
    for (let i = 0; i < 6; i++) {
      c.beginPath();
      c.ellipse((i * 97) % w, 30 + ((i * 61) % (h - 40)), 60, 12, 0, 0, Math.PI * 2);
      c.fill();
    }
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
        ASSETS.dibujar(c, a.id, x, y, t, o);
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
    const PALETAS = ["draugr", "jabali", "cuervo", "fatuo", "trol"];
    CRIATURAS.LISTA.forEach((id) =>
      ["S", "E", "N", "S1", "S2"].forEach((v) => {
        const pal = v.length > 1 ? Number(v[1]) : 0;
        if (pal && !PALETAS.includes(id)) return;
        const big = id === "ciervo" || id === "trol";
        const w = big ? 360 : 200,
          h = big ? 360 : 200;
        ficha(gc, I18N.t("cr." + id) + " · " + (pal ? I18N.t("cat.color", [pal + 1]) : v), w, h, (c, t) => {
          piso(c, w, h);
          CRIATURAS.dibujar(c, id, w / 2, h - 40, t, { vista: v[0], mov: 1, pal });
        });
      }),
    );
  }
  function cuadro(ms) {
    const t = ms / 1000;
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
