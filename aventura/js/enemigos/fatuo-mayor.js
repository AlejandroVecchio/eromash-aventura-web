// ---------- El fatuo mayor en vectores (módulo FATUO_MAYOR) ----------
// La lámina de Alejandro (frente, costado, espalda y el aviso de frente y de costado) pasada a SVG tal cual
// (img/criaturas/fatuo/*.svg, vectorizada con Recraft). No tiene huesos: la llama se dobla punto por punto como fuego
// (la base casi quieta, la punta y la cola se cimbran) y las caras vecinas comparten sus puntos, así nunca se abren.
// Las tres runas de la lámina (Ingwaz, Algiz y Sowilo) giran a su alrededor, por delante y por detrás. En el aviso
// entra la pose de la lámina con los brazos arriba, la llama se agita y se estira y las runas se encienden; al soltar
// la llama da un fogonazo hacia arriba. Al morir se parte en dos fatuos chicos (combate.js, `parte`).
// Paletas: verde del pantano, la rúnica de la lámina y violeta de Hel (las mismas tres de los fatuos chicos).
// Se registra en CRIATURAS como "fatuoMayor"; mientras el SVG carga se ve el fatuo chico agrandado.
window.FATUO_MAYOR = (function () {
  "use strict";
  // unidades del mundo por pixel de la lámina (de la punta a la cola mide unos 110) y altura a la que flota la cola
  const MUNDO = 0.32,
    ALTO = 14;
  // cada vista: k = lo que mide su lado largo en pixeles de la lámina (el aviso viene dibujado más grande en la lámina:
  // se achica para que, con la llama estirada, mida un tercio más), cola = la punta de abajo (va a ALTO del piso), cara = de dónde se dobla
  // la llama (ahí casi no se mueve), arriba/abajo = las puntas de la llama
  const VISTAS = {
    S: { k: 404, cola: [864, 1900], cara: [800, 900], arriba: 151 },
    E: { k: 404, cola: [597, 1899], cara: [700, 960], arriba: 155 },
    N: { k: 403, cola: [705, 1899], cara: [790, 900], arriba: 152 },
    avisoS: { k: 520, cola: [573, 1966], cara: [520, 900], arriba: 83 },
    avisoE: { k: 515, cola: [431, 1966], cara: [470, 950], arriba: 85 },
  };

  // ---------- paletas: tiñen la llama y la cara; el blanco del centro queda ----------
  const PALETAS = [
    { llama: [150, 0.9, 1], luz: "#8CF0B4" }, // del pantano
    { luz: "#73D5DB" }, // rúnico: la de la lámina
    { llama: [272, 0.75, 1], cara: [195, 0.9, 1], luz: "#9A6BD8" }, // de Hel
  ];
  function rgbAHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, l];
    const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
  }
  function hslARgb(h, s, l) {
    l = Math.min(0.97, l);
    const f = (n) => {
      const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
      return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
    };
    return `rgb(${f(0)},${f(8)},${f(4)})`;
  }
  // la cara y los brazos son lilas; lo demás es llama (el blanco casi puro no se tiñe)
  const grupo = (h, s, l) => (l > 0.96 ? "blanco" : h >= 230 && h < 300 ? "cara" : "llama");
  function tenir(col, pal) {
    if (!pal) return col;
    const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(col);
    if (!m) return col;
    const [h, s, l] = rgbAHsl(+m[1], +m[2], +m[3]), p = pal[grupo(h, s, l)];
    if (!p) return col;
    return hslARgb(p[0], Math.min(1, s * p[1]), l * p[2]);
  }

  // ---------- carga: cada forma con sus comandos (M, L, C, Z) en números, para doblarlos en cada cuadro ----------
  const vistas = {};
  const lienzoGrad = document.createElement("canvas").getContext("2d");
  function cargar(v) {
    if (vistas[v]) return vistas[v];
    const st = (vistas[v] = { listo: false });
    fetch("img/criaturas/fatuo/" + v + ".svg")
      .then((r) => r.text())
      .then((txt) => {
        const doc = new DOMParser().parseFromString(txt, "image/svg+xml");
        const grads = {};
        doc.querySelectorAll("linearGradient").forEach((g) => {
          grads[g.id] = {
            x: ["x1", "y1", "x2", "y2"].map((k) => +g.getAttribute(k)),
            stops: [...g.querySelectorAll("stop")].map((s) => [+s.getAttribute("offset"), s.getAttribute("stop-color")]),
          };
        });
        st.formas = [...doc.querySelectorAll("path")].map((p) => {
          const d = p.getAttribute("d"),
            fill = p.getAttribute("fill") || "#000",
            cmds = [],
            nums = [];
          d.replace(/([MLCZ])([^MLCZ]*)/gi, (_, c, resto) => {
            const ns = (resto.match(/-?\d+\.?\d*/g) || []).map(Number);
            cmds.push(c.toUpperCase(), nums.length, ns.length);
            nums.push(...ns);
            return "";
          });
          const gr = /url\(#(.+)\)/.exec(fill);
          return { path: new Path2D(d), fill, grad: gr ? grads[gr[1]] : null, cmds, nums: Float32Array.from(nums), w: new Float32Array(nums.length) };
        });
        st.pinturas = {};
        st.listo = true;
      })
      .catch(() => (st.error = true));
    return st;
  }
  function pinturas(st, pal) {
    if (st.pinturas[pal]) return st.pinturas[pal];
    const P = PALETAS[pal] || null;
    return (st.pinturas[pal] = st.formas.map((f) => {
      if (!f.grad) return tenir(f.fill, P);
      const [x1, y1, x2, y2] = f.grad.x, g = lienzoGrad.createLinearGradient(x1, y1, x2, y2);
      f.grad.stops.forEach(([o, c]) => g.addColorStop(o, tenir(c, P)));
      return g;
    }));
  }

  // ---------- el fuego: cada punto se corre según su altura (lejos de la cara, más) con una onda que sube ----------
  function doblar(f, def, q) {
    const n = f.nums, w = f.w, [cx, cy] = def.cara, arr = cy - def.arriba, aba = def.cola[1] - cy;
    for (let i = 0; i + 1 < n.length; i += 2) {
      const x = n[i], y = n[i + 1], sube = y < cy, h = sube ? (cy - y) / arr : (y - cy) / aba, k = h * Math.sqrt(h);
      const onda = Math.sin(q.t * q.vel - y * 0.0055 + q.sem) + 0.35 * Math.sin(q.t * q.vel * 1.9 - y * 0.011 + q.sem * 2);
      w[i] = x + (onda * q.amp * (sube ? 1 : 0.8) + q.lado * h) * k + (x - cx) * q.ancho * k;
      // la punta se estira y se encoge (titila); en el fogonazo se dispara hacia arriba
      w[i + 1] = sube ? y - k * (q.estira + Math.sin(q.t * q.vel * 1.3 + q.sem + x * 0.004) * q.amp * 0.6) : y + k * q.estira * 0.3;
    }
  }
  function trazar(c, f, nums) {
    const cm = f.cmds;
    c.beginPath();
    for (let j = 0; j < cm.length; j += 3) {
      const o = cm[j + 1];
      switch (cm[j]) {
        case "M": c.moveTo(nums[o], nums[o + 1]); break;
        case "L": for (let k = 0; k + 1 < cm[j + 2]; k += 2) c.lineTo(nums[o + k], nums[o + k + 1]); break;
        case "C": for (let k = 0; k + 5 < cm[j + 2]; k += 6) c.bezierCurveTo(nums[o + k], nums[o + k + 1], nums[o + k + 2], nums[o + k + 3], nums[o + k + 4], nums[o + k + 5]); break;
        case "Z": c.closePath(); break;
      }
    }
  }

  // ---------- las runas que giran: Ingwaz, Algiz y Sowilo, planas como en la lámina ----------
  const RUNAS = [
    [[0, -9], [6, 0], [0, 9], [-6, 0], [0, -9]], // Ingwaz: el rombo
    [[0, 9], [0, -9], null, [0, -1], [-6, -9], null, [0, -1], [6, -9]], // Algiz
    [[4, -9], [-3, -2], [3, 2], [-4, 9]], // Sowilo: el rayo
  ];
  function runa(c, i, x, y, s, col, a) {
    c.save();
    c.globalAlpha *= a;
    c.translate(x, y);
    c.scale(s, s);
    c.strokeStyle = col;
    c.lineWidth = 3.2;
    c.lineJoin = "miter";
    c.lineCap = "square";
    c.beginPath();
    let nuevo = true;
    for (const p of RUNAS[i]) {
      if (!p) { nuevo = true; continue; }
      if (nuevo) c.moveTo(p[0], p[1]);
      else c.lineTo(p[0], p[1]);
      nuevo = false;
    }
    c.stroke();
    c.restore();
  }
  // las tres en una ronda inclinada a la altura del pecho; delante = la mitad de la ronda que da hacia la cámara
  function ronda(t, o, ef) {
    const giro = t * (0.7 + ef.carga * 2.2) + (o.sem || 0), r = 42 + ef.estalla * 26, alto = ALTO + 58 + ef.carga * 16;
    return [0, 1, 2].map((i) => {
      const a = giro + (i * Math.PI * 2) / 3;
      return { i, x: Math.cos(a) * r, y: -alto + Math.sin(a) * r * 0.28 + Math.sin(t * 2.4 + i * 2) * 4, delante: Math.sin(a) > 0, s: 0.9 + Math.sin(a) * 0.12 };
    });
  }

  // ---------- dibujar ----------
  const cal = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  const est = {};
  const FOGONAZO = 0.32;
  function dibujar(c, t, o) {
    const v = o.vista || "S", k = o.sem != null ? o.sem : 0;
    let F = est[k];
    if (!F || t < F.t) F = est[k] = { t, golpe: 0, suelta: -9 };
    F.t = t;
    const g = o.golpe || 0, ant = F.golpe, sube = g > 0 && g >= ant;
    F.golpe = g;
    if (g < ant && ant > 0.8) F.suelta = t;
    const dz = t - F.suelta, fogon = dz < FOGONAZO ? 1 - dz / FOGONAZO : 0;
    const muere = Math.min(1, (o.muere || 0) / 0.8), herido = o.herido > 0 ? o.herido * o.herido : 0;
    const carga = sube ? g : 0;
    const ef = { carga, estalla: fogon, muere, luz: 0.35 + Math.sin(t * 3 + k) * 0.1 + carga * 0.6 + fogon * 0.6 };
    const nombre = ((sube && g > 0.15) || fogon > 0) && v !== "N" && cargar("aviso" + v).listo ? "aviso" + v : v;
    const st = cargar(nombre);
    if (!st.listo) return false;
    const def = VISTAS[nombre], m = Math.min(2, o.mov || 0);
    // cómo se dobla la llama ahora: más rápido y más alto en el aviso, de golpe hacia arriba en el fogonazo
    const q = {
      t, sem: k,
      vel: 3.2 + carga * 5 + fogon * 4,
      amp: 34 + carga * 26 + herido * 30,
      lado: (v === "E" ? -60 : 0) * m + (v === "E" ? -40 : 0) * herido, // la llama queda atrás al avanzar
      estira: carga * 60 + Math.sin(Math.min(1, fogon * 1.4) * Math.PI) * 260 - muere * 300,
      ancho: muere * -0.5,
    };
    const flota = ALTO + Math.sin(t * 2.2 + k) * 4 - carga * 6 + muere * 30;
    const pal = (o.pal == null ? 1 : o.pal) % PALETAS.length, P = PALETAS[pal], cols = pinturas(st, pal);
    const esc = (MUNDO * def.k) / 2048, alta = cal() === "alta", baja = cal() === "baja", vivo = 1 - muere;
    const runas = ronda(t, o, ef);
    c.save();
    // la sombra: chica y clara, porque flota
    c.fillStyle = "rgba(0,0,0," + (0.22 * vivo).toFixed(3) + ")";
    c.beginPath();
    c.ellipse(0, 0, 20 - carga * 4, 5, 0, 0, Math.PI * 2);
    c.fill();
    if (!baja) DIB.halo(c, 0, -flota - 50, 60 + carga * 30 + fogon * 40, P.luz, (0.45 + carga * 0.4 + fogon * 0.5) * vivo);
    const a0 = c.globalAlpha;
    c.globalAlpha = a0 * vivo * (herido > 0 ? 0.75 + Math.sin(t * 60) * 0.25 : 1);
    for (const r of runas) if (!r.delante) runa(c, r.i, r.x, r.y, r.s, P.luz, (0.55 + ef.luz * 0.3) * vivo);
    const T0 = c.getTransform();
    c.translate((Math.sin(t * 1.3 + k) * 3 + (sube && g > 0.7 ? Math.sin(t * 44) * 2 : 0)), -flota);
    c.scale(esc, esc);
    c.translate(-def.cola[0], -def.cola[1]);
    for (let i = 0; i < st.formas.length; i++) {
      const f = st.formas[i];
      c.fillStyle = cols[i];
      if (baja) c.fill(f.path);
      else {
        doblar(f, def, q);
        trazar(c, f, f.w);
        c.fill();
      }
    }
    // el fogonazo: la llama entera se aclara un instante
    if (fogon > 0 && alta) {
      c.globalCompositeOperation = "lighter";
      c.globalAlpha = a0 * fogon * 0.45 * vivo;
      c.fillStyle = "#E8FCFF";
      for (const f of st.formas) {
        if (baja) c.fill(f.path);
        else {
          trazar(c, f, f.w);
          c.fill();
        }
      }
      c.globalCompositeOperation = "source-over";
    }
    c.setTransform(T0);
    c.globalAlpha = a0 * vivo;
    for (const r of runas) if (r.delante) runa(c, r.i, r.x, r.y, r.s, ef.luz > 0.8 ? "#E8FCFF" : P.luz, 0.75 + ef.luz * 0.25);
    if (alta && ef.luz > 0.6) {
      c.globalCompositeOperation = "lighter";
      for (const r of runas) runa(c, r.i, r.x, r.y, r.s * 1.08, P.luz, (ef.luz - 0.6) * vivo);
      c.globalCompositeOperation = "source-over";
    }
    // brasas en rombo que suben de la punta y se apagan
    if (!baja) {
      const n = alta ? 5 : 3, top = flota + (def.cola[1] - def.arriba) * esc;
      for (let j = 0; j < n; j++) {
        const u = (t * 0.55 + j / n + k * 0.13) % 1, s = (1 - u) * (2.6 + carga * 1.5);
        const x = Math.sin(t * 1.7 + j * 2.3) * 9 + Math.sin(u * 6 + j) * 6, y = -top + 12 - u * 40;
        c.globalAlpha = a0 * (1 - u) * 0.85 * vivo;
        c.fillStyle = j % 2 ? P.luz : "#E8FCFF";
        c.beginPath();
        c.moveTo(x, y - s * 1.4);
        c.lineTo(x + s, y);
        c.lineTo(x, y + s * 1.4);
        c.lineTo(x - s, y);
        c.fill();
      }
    }
    c.globalAlpha = a0;
    c.restore();
    return true;
  }

  if (window.CRIATURAS) {
    const chico = CRIATURAS.DIBUJO ? CRIATURAS.DIBUJO.fatuo : null;
    CRIATURAS.registrar("fatuoMayor", (c, t, o) => {
      if (dibujar(c, t, o) || !chico) return;
      c.save();
      c.scale(1.6, 1.6);
      chico(c, t, o);
      c.restore();
    });
  }
  const TODAS = Object.keys(VISTAS);
  TODAS.forEach(cargar);
  const listo = () => TODAS.every((v) => cargar(v).listo);
  return { dibujar, VISTAS, PALETAS, cargar, listo };
})();
