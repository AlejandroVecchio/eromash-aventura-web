// ---------- el dibujo de cada pieza de equipo (módulo ARTE_OBJ) ----------
// Nada inventado donde la arena ya tiene arte: las espadas salen de eromash-espadas.js, los escudos de
// eromash-escudos.js, los cascos de los SVG de la arena (juego/img/cascos), las pecheras de pecheras-lib.js y los
// pantalones y las botas de eromash-piernas.js, cada uno con el acabado de su tema (arena, bosque, volcán, Helheim,
// costa: el tema sale de dónde cayó la pieza) y el escalón de su rareza. Los amuletos y anillos son propios, con el
// mismo trazo plano: caras de un color, mitad izquierda en sombra y una runa tallada.
window.ARTE_OBJ = (function () {
  "use strict";
  const TEMAS = ["arena", "bosque", "volcan", "helheim", "costa"];
  // el escalón de dibujo de cada rareza: común, poco común (mágica), rara, legendaria
  const TIER = [0, 1, 2, 4];
  const ES = () => window.EromashEspadas,
    EC = () => window.EromashEscudos,
    PE = () => window.EromashPecheras,
    PI = () => window.EromashPiernas,
    CA = () => window.EromashCascos;
  let version = 0;
  const avisos = [];
  // fn(): se llama (una vez por tanda) cuando termina de cargar un dibujo, para volver a pintar lo que lo usa
  let tanda = 0;
  function cargo() {
    version++;
    if (tanda) return;
    tanda = setTimeout(() => {
      tanda = 0;
      avisos.forEach((f) => f());
    }, 60);
  }

  // ---------- qué dibujo de la arena le toca ----------
  function comoEspada(it) {
    const B = OBJETOS.BASES[it.b];
    return { weaponFamily: B.arte.fam, rarity: ["comun", "comun", "rara", "legendaria", "rara"][it.r] || "comun", forja: it.r === 1 ? 2 : 0 };
  }
  function comoEscudo(it) {
    return { slot: "escudo", rarity: ["comun", "comun", "rara", "legendaria", "rara"][it.r] || "comun", forja: it.r === 1 ? 2 : 0, mapa: TEMAS[it.tema] || "bosque" };
  }
  function unoDe(lista, it) {
    const t = TIER[it.r] || 0;
    let l = lista.filter((p) => p.map === it.tema && p.t === t);
    if (!l.length) l = lista.filter((p) => p.t === t);
    return l.length ? l[(it.v || 0) % l.length] : null;
  }
  // la clave del dibujo (dos piezas con la misma clave comparten imagen) y cómo armarlo
  function fuente(it) {
    const B = OBJETOS.BASES[it.b];
    if (!B) return null;
    const lib = B.arte.lib;
    try {
      if (lib === "espada" && ES()) {
        const d = ES().deItem(comoEspada(it));
        return d && { clave: "es:" + d.id, svg: () => ES().svg(d, { vista: "item", sinEstilo: true }) };
      }
      if (lib === "escudo" && EC()) {
        const d = EC().deItem(comoEscudo(it));
        return d && { clave: "ec:" + d.id, svg: () => EC().svg(d, { sinEstilo: true }) };
      }
      if (lib === "pechera" && PE()) {
        const p = unoDe(PE().PECHERAS, it);
        return p && { clave: "pe:" + p.id, svg: () => PE().pecheraItem(p), pechera: p };
      }
      if ((lib === "pantalon" || lib === "bota") && PI()) {
        const p = unoDe(lib === "bota" ? PI().BOTAS : PI().PANTALONES, it);
        return p && { clave: lib + ":" + p.id, svg: () => (lib === "bota" ? PI().botaItem(p) : PI().pantalonItem(p)) };
      }
      if (lib === "casco" && CA()) {
        const l = CA().dropDe(it.tema, TIER[it.r] || 0),
          c = l.length ? l[(it.v || 0) % l.length] : null;
        return c && { clave: "ca:" + c.id, url: "../juego/img/cascos/" + c.file };
      }
    } catch (e) {}
    return null;
  }
  const IMG = new Map();
  function imagen(it) {
    const f = fuente(it);
    if (!f) return null;
    let im = IMG.get(f.clave);
    if (!im) {
      im = new Image();
      im.onload = cargo;
      if (f.url) im.src = f.url;
      else {
        let s = f.svg() || "";
        // sin medidas el SVG no tiene tamaño natural: se le pone uno según su viewBox
        const abre = s.slice(0, s.indexOf(">"));
        if (!/\bwidth=/.test(abre)) {
          const vb = abre.match(/viewBox="([^"]+)"/);
          const [, , w, h] = vb ? vb[1].split(/[\s,]+/).map(Number) : [0, 0, 400, 400];
          s = s.replace("<svg ", '<svg width="' + Math.round(w) + '" height="' + Math.round(h) + '" ');
        }
        im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
      }
      IMG.set(f.clave, im);
    }
    return im.complete && im.naturalWidth ? im : null;
  }

  // ---------- amuletos y anillos (propios) ----------
  const METAL = [
    ["#8A8478", "#5A5458", "#B3ACA0"],
    ["#C8CCD2", "#8E949C", "#F2F4F8"],
    ["#FFD98A", "#C9A45A", "#FFF0C8"],
    ["#F5A524", "#B4741A", "#FFD98A"],
  ];
  const RUNAS = ["algiz", "sowilo", "ansuz", "tiwaz", "othala", "kenaz", "berkano", "ingwaz", "laguz", "dagaz"];
  function joya(c, it, s) {
    const B = OBJETOS.BASES[it.b],
      [m, ms, ml] = METAL[it.r] || METAL[0],
      gema = OBJETOS.RAREZAS[it.r].col,
      runa = RUNAS[(it.v || 0) % RUNAS.length];
    c.save();
    c.scale(s, s);
    if (B.arte.lib === "amuleto") {
      // la cadena: eslabones rectos que cuelgan en V
      for (let k = 0; k < 7; k++) {
        const u = k / 6,
          x = -26 + u * 52,
          y = -34 + Math.abs(u - 0.5) * -22 + 22;
        DIB.P(c, [x - 3, y - 2, x + 3, y - 2, x + 3, y + 2, x - 3, y + 2], k % 2 ? ms : m);
      }
      if (B.arte.forma) {
        // talismán: un disco de seis caras con la runa
        const pts = [];
        for (let k = 0; k < 6; k++) pts.push(Math.cos((k / 6) * Math.PI * 2 + Math.PI / 6) * 22, 10 + Math.sin((k / 6) * Math.PI * 2 + Math.PI / 6) * 22);
        DIB.P(c, pts, m);
        DIB.P(c, [0, -12, 0, 32, -19, 21, -19, -1], ms);
        DIB.P(c, [0, -2, 12, 10, 0, 22, -12, 10], "#1A1513");
        FUTHARK.dibujar(c, runa, 0, 19, 16, gema, 2.6);
      } else {
        // amuleto: un rombo colgante con la gema arriba y la runa tallada
        DIB.P(c, [0, -14, 20, 10, 0, 38, -20, 10], m);
        DIB.P(c, [0, -14, 0, 38, -20, 10], ms);
        DIB.P(c, [0, -10, 6, -4, 0, 2, -6, -4], gema);
        DIB.P(c, [0, -10, 6, -4, 0, 2], ml);
        FUTHARK.dibujar(c, runa, 0, 28, 18, "#1A1513", 3);
      }
    } else {
      // anillo: un aro de ocho caras con la piedra encima
      c.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
        c[k ? "lineTo" : "moveTo"](Math.cos(a) * 26, 8 + Math.sin(a) * 22);
      }
      c.closePath();
      for (let k = 7; k >= 0; k--) {
        const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
        c[k === 7 ? "moveTo" : "lineTo"](Math.cos(a) * 17, 8 + Math.sin(a) * 13);
      }
      c.closePath();
      c.fillStyle = m;
      c.fill("evenodd");
      // la mitad izquierda en sombra
      c.save();
      c.beginPath();
      c.rect(-30, -30, 30, 70);
      c.clip();
      c.globalAlpha = 0.45;
      c.fillStyle = ms;
      c.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
        c[k ? "lineTo" : "moveTo"](Math.cos(a) * 26, 8 + Math.sin(a) * 22);
      }
      c.closePath();
      for (let k = 7; k >= 0; k--) {
        const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
        c[k === 7 ? "moveTo" : "lineTo"](Math.cos(a) * 17, 8 + Math.sin(a) * 13);
      }
      c.closePath();
      c.fill("evenodd");
      c.restore();
      if (B.arte.forma) {
        // sortija: un sello plano con la runa
        DIB.P(c, [-14, -26, 14, -26, 18, -12, -18, -12], m);
        DIB.P(c, [-14, -26, 0, -26, 0, -12, -18, -12], ms);
        FUTHARK.dibujar(c, runa, 0, -14, 11, gema, 2.2);
      } else {
        DIB.P(c, [0, -34, 12, -20, 0, -8, -12, -20], gema);
        DIB.P(c, [0, -34, 12, -20, 0, -20], "rgba(255,255,255,0.35)");
        DIB.P(c, [0, -34, 0, -8, -12, -20], "rgba(0,0,0,0.25)");
      }
    }
    c.restore();
  }

  // ---------- dibujar ----------
  // icono(c, it, x, y, lado): la pieza centrada en (x, y), entrando en un cuadrado de lado × lado. Devuelve si pudo
  // dibujar el arte de verdad (si no, deja una silueta y se vuelve a pintar cuando cargue: alCargar)
  function icono(c, it, x, y, lado) {
    const B = OBJETOS.BASES[it.b];
    if (!B) return false;
    if (B.arte.lib === "arma" && window.DIB_ARMAS) return DIB_ARMAS.icono(c, B.arte.forma, B.arte.fam, TIER[it.r] || 0, x, y, lado);
    if (B.arte.lib === "amuleto" || B.arte.lib === "anillo") {
      c.save();
      c.translate(x, y);
      joya(c, it, lado / 84);
      c.restore();
      return true;
    }
    const im = imagen(it);
    if (im) {
      const k = Math.min(lado / im.naturalWidth, lado / im.naturalHeight);
      c.drawImage(im, x - (im.naturalWidth * k) / 2, y - (im.naturalHeight * k) / 2, im.naturalWidth * k, im.naturalHeight * k);
      return true;
    }
    c.save();
    c.globalAlpha = 0.35;
    DIB.P(c, [x, y - lado * 0.3, x + lado * 0.3, y, x, y + lado * 0.3, x - lado * 0.3, y], OBJETOS.RAREZAS[it.r].col);
    c.restore();
    return false;
  }
  // el arma en la mano de Eromash en el mundo (las espadas con el dibujo de la arena); false si no sabe dibujarla
  function dibujarArma(c, it, x, y, ang, s, brillo) {
    const B = it && OBJETOS.BASES[it.b];
    if (B && B.arte.lib === "arma" && window.DIB_ARMAS) {
      // las armas propias (hachas y las que vienen), en las coordenadas de la espada de siempre
      c.save();
      c.translate(x, y);
      c.rotate(ang + Math.PI / 2);
      c.scale(s, s);
      if (brillo) {
        c.shadowColor = "#FFD98A";
        c.shadowBlur = 24;
      }
      DIB_ARMAS.dibujar(c, B.arte.forma, B.arte.fam, TIER[it.r] || 0);
      c.restore();
      return true;
    }
    if (!B || B.arte.lib !== "espada" || !ES()) return false;
    return ES().dibujar(c, comoEspada(it), x, y, ang, s, brillo);
  }
  // el SVG de la espada parada (para ponérsela al vikingo de la mochila) y la pechera puesta
  function svgEspada(it, op) {
    const B = it && OBJETOS.BASES[it.b];
    if (!B || B.arte.lib !== "espada" || !ES()) return "";
    const d = ES().deItem(comoEspada(it));
    return d ? ES().svg(d, op) : "";
  }
  function pechera(it) {
    const f = it && fuente(it);
    return f && f.pechera ? f.pechera : null;
  }
  // el tema de dibujo de un lugar del mundo: cerca del Puesto el bosque; lejos, según hacia dónde (norte Helheim, el
  // este la costa del río, el oeste el volcán de los troles y el sur la arena de Eikholt)
  function temaEn(W, x, y) {
    const p = W.LUGARES.puesto.p,
      dx = x - p[0],
      dy = y - p[1];
    if (Math.hypot(dx, dy) < 3200) return 1;
    if (Math.abs(dy) > Math.abs(dx)) return dy < 0 ? 3 : 0;
    return dx > 0 ? 4 : 2;
  }

  return { tier: (it) => TIER[it.r] || 0, icono, imagen, dibujarArma, svgEspada, pechera, temaEn, alCargar: (f) => avisos.push(f), version: () => version, TEMAS };
})();
