// ---------- la ciudad viva (módulo MUNDO25) ----------
// Lo que comparten la muestra (ciudad.html) y el juego (sistema EIKHOLT en ciudad/juego.js): arma el plano, la gente de
// cada barrio con su hora, los choques en una grilla, las luces y las sombras; mueve a la gente; y dibuja un cuadro
// entero (piso con sombras, lo parado, el aire, la luz de la hora, la noche con sus agujeros de luz, el velo y la viñeta).
//   MUNDO25.armar({ juego, inicio }) → { plano, gente, libre, LUGARES } · moverGente(dt, h) · dibujar(c, cam, cw, ch, t, h)
window.MUNDO25 = (function () {
  "use strict";
  let plano = null,
    gente = [],
    grilla = null;
  const CELDA = 400;

  // los vecinos sin nombre: fichas hechas a partir de una semilla (nadie se viste igual); el rol dice qué contestan
  const PIELES = ["#E0C0A8", "#D8B49A", "#C89A7A", "#E0B898", "#B8907A", "#D0A080", "#C09070"],
    PELOS = ["#3A2A1E", "#5A3A2A", "#8A6A3A", "#C8A050", "#D8B060", "#B4542A", "#1E1814", "#9A9890", "#E8E4DC"],
    ROPAS = ["#5E4A36", "#4E5C32", "#3E4E66", "#7A3A2A", "#6E6A54", "#5A6A4A", "#56667A", "#7A2A1E", "#6E5A3E", "#4A6A7A", "#8A6A48", "#5E2C20"],
    CAPAS = ["#3E5A34", "#2C4226", "#9A948C", "#5E4A36", "#4A5868", "#7A3A2A"],
    PANTS = ["#3A3026", "#46362A", "#3A2A1E", "#45392E", "#3A4A56", "#5E4430"];
  // un color más oscuro (f < 0) o más claro (f > 0), en hexadecimal
  function tono(hex, f) {
    const n = parseInt(hex.slice(1), 16),
      m = (v) => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)));
    return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => m(v).toString(16).padStart(2, "0")).join("");
  }
  function fichaVecino(i, rol) {
    const id = "ek_" + rol + "_" + i;
    if (GENTE.FICHAS[id]) return id;
    const r = DIB.azar(9000 + i * 13);
    const elige = (l) => l[Math.floor(r() * l.length)];
    const mujer = rol === "vecina" || (rol !== "vecino" && r() < 0.5),
      nino = rol === "nino",
      viejo = !nino && r() < 0.18;
    const f = {
      nombre: "vecino", alto: nino ? 0.62 + r() * 0.12 : 0.9 + r() * 0.2, ancho: nino ? 0.78 + r() * 0.06 : 0.88 + r() * 0.3,
      piel: elige(PIELES), pelo: viejo ? elige(["#E8E4DC", "#B8B4AC", "#9A9890"]) : elige(PELOS), ropa: elige(ROPAS),
      pantalon: elige(PANTS), botas: elige(["#2A2018", "#241C16", "#3A2A1A"]), cinto: elige(["#7A5634", "#C8B48C", "#3A2A1A", "#8A6A2A", "#5E4430"]),
    };
    if (mujer) {
      f.falda = r() < 0.8;
      if (r() < 0.5) f.trenza = true;
      else if (r() < 0.6) f.rodete = true;
    } else if (!nino) {
      if (r() < 0.7) f.barba = f.pelo;
      if (r() < 0.2) f.calvo = true;
    }
    if (r() < 0.35 && !nino) f.capa = elige(CAPAS);
    if (r() < 0.25 || rol === "vendedor") f.delantal = elige(["#7A5030", "#C8B48C", "#5E4A36", "#E6DCC8"]);
    if (r() < 0.25) f.gorro = elige(["#E6DCC8", "#9C2315", "#46423E", "#E8B04A", "#5E6A4A"]);
    if (rol === "guardia" || rol === "recluta") {
      f.gorro = "#6E6A6E";
      f.lanza = true;
      f.capa = rol === "guardia" ? "#2C4226" : undefined;
      f.ropa = "#5A5E5A";
    }
    if (rol === "pescador") f.gorro = "#4A6A7A";
    if (rol === "viajero") f.capa = elige(["#9C2315", "#56667A", "#6E5A3E"]);
    f.ropaSombra = tono(f.ropa, -0.25);
    f.pielSombra = tono(f.piel, -0.15);
    if (f.capa) f.capaSombra = tono(f.capa, -0.25);
    if (f.delantal) f.delantalSombra = tono(f.delantal, -0.2);
    GENTE.FICHAS[id] = f;
    return id;
  }

  const dentroPoli = (pts, x, y) => {
    let d = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i],
        [xj, yj] = pts[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d;
    }
    return d;
  };
  // los choques del plano en una grilla, para preguntar rápido si un punto está libre
  function armarGrilla() {
    grilla = new Map();
    for (const h of plano.choques) {
      let x0, y0, x1, y1;
      if (h.circulo) {
        const [x, y, r] = h.circulo;
        x0 = x - r;
        x1 = x + r;
        y0 = y - r;
        y1 = y + r;
      } else if (h.poli) {
        const xs = h.poli.map((q) => q[0]),
          ys = h.poli.map((q) => q[1]);
        x0 = Math.min(...xs);
        x1 = Math.max(...xs);
        y0 = Math.min(...ys);
        y1 = Math.max(...ys);
      } else continue;
      for (let gy = Math.floor(y0 / CELDA); gy <= Math.floor(y1 / CELDA); gy++)
        for (let gx = Math.floor(x0 / CELDA); gx <= Math.floor(x1 / CELDA); gx++) {
          const k = gx + "," + gy;
          if (!grilla.has(k)) grilla.set(k, []);
          grilla.get(k).push(h);
        }
    }
  }
  function libre(x, y, m = 20) {
    const l = grilla.get(Math.floor(x / CELDA) + "," + Math.floor(y / CELDA));
    if (!l) return true;
    for (const h of l) {
      if (h.circulo && Math.hypot(h.circulo[0] - x, h.circulo[1] - y) < h.circulo[2] + m) return false;
      if (h.poli && dentroPoli(h.poli, x, y)) return false;
    }
    return true;
  }
  // el punto libre más cercano (en espiral)
  function buscarLibre(x, y) {
    for (let r = 0; r < 1800; r += 40)
      for (let k = 0, n = Math.max(1, Math.round(r / 30)); k < n; k++) {
        const a = (k / n) * Math.PI * 2,
          px = x + Math.cos(a) * r,
          py = y + Math.sin(a) * r;
        if (libre(px, py, 40)) return [px, py];
      }
    return [x, y];
  }

  // cada barrio tiene su hora: el campo de la Guardia de mañana, el Hongo y el fuego de los forasteros de noche,
  // los oficios de día; nadie lo marca, se ve si se pasa a la hora justa
  const HORARIO = {
    entrenamiento: [6.5, 17], forasteros: [17, 6], sanacion: [7, 22], hongo: [16, 2], herreria: [6, 19],
    carpinteria: [7, 18], corral: [5, 20], lindes: [8, 20], hospederia: [15, 1], tablon: [7, 19],
  };
  const aHora = (h, [a, b]) => (a < b ? h >= a && h < b : h >= a || h < b);

  function armar(op = {}) {
    plano = op.plano || PLANO25.armar();
    VISTA25.iniciar(plano);
    armarGrilla();
    const L = plano.lugares;
    const LUGARES = {
      plaza: [L.ting[0] + 900, L.ting[1] + 300],
      ting: [L.ting[0], L.ting[1] + 200],
      sur: plano.anclas.puerta_sur,
      oficios: [L.herreria[0] + 400, L.herreria[1] + 900],
      lindes: [L.lindes[0] + 300, L.lindes[1] + 500],
      hongo: [L.hongo[0], L.hongo[1] + 900],
      guardia: [L.entrenamiento[0] + 300, L.entrenamiento[1] + 700],
      caravanas: [L.forasteros[0] + 600, L.forasteros[1] + 1200],
      sanacion: [L.sanacion[0] + 600, L.sanacion[1] + 700],
      muelle: [plano.anclas.muelle[0] + 300, plano.anclas.muelle[1] + 500],
      lejos: [0, 600],
    };
    // la gente de la plaza: vecinos parados y caminando
    gente = [];
    const rr = (function (s) {
      let a = s;
      return () => (a = (a * 16807) % 2147483647) / 2147483647;
    })(77);
    let nv = 0;
    const vecino = (rol) => fichaVecino(nv++, rol || (rr() < 0.12 ? "nino" : rr() < 0.5 ? "vecina" : "vecino"));
    const rolDe = (id) => id.split("_")[1];
    const poner = (o) => {
      o.rol = o.rol || (o.id.startsWith("ek_") ? rolDe(o.id) : null);
      gente.push(o);
    };
    for (let i = 0; i < 140; i++) {
      const a = rr() * Math.PI * 2,
        d = 900 + rr() * 2700;
      const x = Math.cos(a) * d,
        y = Math.sin(a) * d;
      if (plano.choques.some((h) => h.circulo && Math.hypot(h.circulo[0] - x, h.circulo[1] - y) < h.circulo[2] + 40)) continue;
      poner({ id: vecino(), x, y, vx: rr() < 0.5 ? (rr() - 0.5) * 80 : 0, vy: 0, s: 1, horas: i % 7 ? [7, 20] : [6, 23] });
    }
    const sur = plano.anclas.puerta_sur;
    for (let i = 0; i < 18; i++) poner({ id: vecino(i % 5 ? null : "viajero"), x: sur[0] + (rr() - 0.5) * 300, y: sur[1] - rr() * 3000, vx: 0, vy: (rr() < 0.5 ? -1 : 1) * 60, s: 1, horas: i % 6 ? [6, 21] : [0, 24] });
    // la gente de cada barrio: los de la Guardia en el campo, los forasteros alrededor del fuego, los que esperan en
    // Sanación, los que toman afuera del Hongo, los de los oficios (parados, que hablan; alguno va y viene)
    const RONDAS = [
      ["entrenamiento", 10, 700, "guardia"],
      ["forasteros", 9, 520, "viajero"],
      ["sanacion", 6, 700, null],
      ["hongo", 8, 900, null],
      ["herreria", 6, 650, null],
      ["carpinteria", 5, 700, null],
      ["corral", 4, 900, "viajero"],
      ["lindes", 4, 600, null],
      ["hospederia", 4, 600, "viajero"],
      ["tablon", 4, 300, null],
    ];
    // lo que se ve y nadie explica: al alba los de la Guardia hacen la ronda por la vuelta de la plaza (y en la muestra,
    // de madrugada, Eydis se queda sola frente a la piedra del Ting; en el juego Eydis está donde la pone la historia)
    if (!op.juego) gente.push({ id: "eydis", x: plano.ting[0] + 60, y: plano.ting[1] + 230, vx: 0, vy: 0, s: 1, horas: [23, 4] });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      poner({ id: vecino("guardia"), x: Math.cos(a) * 3000, y: Math.sin(a) * 3000, vx: -Math.sin(a) * 50, vy: Math.cos(a) * 50, s: 1, horas: [5, 8], ronda: true });
    }
    for (const [k, n, rad, rol] of RONDAS) {
      const c0 = L[k];
      if (!c0) continue;
      for (let i = 0; i < n; i++) {
        const a = rr() * Math.PI * 2,
          d = rad * (0.4 + rr() * 0.6);
        const x = c0[0] + Math.cos(a) * d,
          y = c0[1] + Math.sin(a) * d;
        if (plano.choques.some((h) => h.circulo && Math.hypot(h.circulo[0] - x, h.circulo[1] - y) < h.circulo[2] + 30)) continue;
        // en Sanación, alguno espera vendado
        const id = k === "sanacion" && rr() < 0.4 ? "herido" : vecino(rol);
        poner({ id, x, y, vx: rr() < 0.3 ? (rr() - 0.5) * 70 : 0, vy: 0, s: 1, habla: rr() < 0.5, horas: HORARIO[k], rol: id === "herido" ? "vecina" : null });
      }
    }
    // los vecinos con nombre, cada uno en su lugar y a su hora (lo que dicen sale de sus frases de la historia):
    // Gudrun tararea junto al pozo, Håkon mira desde el campo, Ivar con su copa en la galería del Hongo, Sølve canta de
    // noche, Ragna cuida sus hongos, los chicos corretean por la plaza
    const VECINOS = [
      ["gudrun", L.pozo, 140, 60, [7, 21], { canta: true }],
      ["hakon", L.entrenamiento, 300, 500, [6, 18]],
      ["ivar", plano.anclas.hongo_puerta, -200, 160, [17, 2]],
      ["solve", plano.anclas.hongo_puerta, 160, 220, [19, 2], { habla: true }],
      ["ragna", L.camas_hongos, 0, 140, [7, 19]],
      ["folke", L.paseo_sogas, 0, 200, [7, 19]],
      ["grim", L.corral, -300, 380, [0, 24]],
      ["sigrun", plano.anclas.sanacion, 120, 120, [8, 21]],
      ["bergljot", plano.ting, 260, 260, [9, 16]],
      ["torvald", plano.anclas.svanhild_casa, 200, 260, [8, 18]],
      ["kolbrun", [L.ting[0] + 1700, L.ting[1] - 400], 0, 0, [8, 18]],
      ["maren", [0, 0], 1150, 400, [10, 17]],
      ["sten", plano.anclas.carpinteria, 140, 160, [7, 18]],
      ["ketil", plano.anclas.puerta_sur, 260, -260, [0, 24]],
      ["ingrid", L.forasteros, 300, 300, [7, 22]],
      ["tyra", [0, 0], 2300, 900, [8, 19], { vx: 110 }],
      ["eirik", [0, 0], -2000, 1500, [8, 19], { vx: -90 }],
      ["arvid", L.forasteros, -200, 500, [8, 20]],
    ];
    for (const [id, c0, dx, dy, horas, o] of VECINOS) if (c0) gente.push(Object.assign({ id, x: c0[0] + dx, y: c0[1] + dy, vx: 0, vy: 0, s: 1, horas, nombrado: true }, o || {}));
    for (let i = gente.length - 1; i >= 0; i--) if (!libre(gente[i].x, gente[i].y)) gente.splice(i, 1);
    // lo que alumbra de noche (LUCES25) y las sombras de lo que está parado (SOMBRAS25)
    LUCES25.armar(plano);
    SOMBRAS25.iniciar(plano);
    // Eromash camina por la ciudad (RECORRER25): curiosidades, cofres, barrios, la gente y los animales que reaccionan
    RECORRER25.iniciar({ plano, libre, gente, inicio: op.inicio, juego: op.juego, dibujarEro: op.dibujarEro, alCofre: op.alCofre });
    return { plano, gente, libre, buscarLibre, LUGARES };
  }

  // los que caminan no atraviesan nada: si el paso siguiente choca, se dan vuelta
  function moverGente(dt, h, oculto) {
    for (const p of gente) {
      p.visible = (!p.horas || aHora(h, p.horas)) && !(oculto && oculto(p));
      if (!p.vx && !p.vy) continue;
      if (p.ronda) {
        // la ronda sigue la vuelta de la plaza
        const a = Math.atan2(p.y, p.x) + (50 / 3000) * dt;
        p.x = Math.cos(a) * 3000;
        p.y = Math.sin(a) * 3000;
        p.vx = -Math.sin(a) * 50;
        continue;
      }
      if (p.charla > 0) continue; // quieto mientras habla con Eromash
      const nx = p.x + p.vx * dt,
        ny = p.y + p.vy * dt;
      if (!libre(nx, ny) || (!p.huye && Math.random() < dt * 0.15)) {
        p.vx = -p.vx;
        p.vy = -p.vy;
        continue;
      }
      p.x = nx;
      p.y = ny;
    }
  }

  // cuánta noche hay a esta hora (0 de día, 1 de noche cerrada)
  const noche = (h) => (h >= 17 && h < 21 ? (h - 17) / 4 : h >= 21 || h < 5 ? 1 : h < 7 ? (7 - h) / 2 : 0);

  // un cuadro entero; mas = otros que van parados en el orden del mundo (los de la historia en el juego)
  const velo = document.createElement("canvas");
  function dibujar(c, cam, cw, ch, tt, h, mas) {
    // cada persona mira hacia un lado del mundo (hacia donde camina, o quieta hacia donde quedó); la vista de las ocho
    // sale de ese rumbo girado con la cámara, así al girar se la ve de costado o de espaldas
    const coG = Math.cos(cam.g),
      siG = Math.sin(cam.g);
    const mirada = (p) => {
      if ((p.vx || p.vy) && !(p.charla > 0)) p.rumbo = Math.atan2(p.vy, p.vx);
      else if (p.miraA) p.rumbo = Math.atan2(p.miraA[1], p.miraA[0]); // lo miran pasar
      if (p.rumbo === undefined) p.rumbo = ((p.x * 13 + p.y * 7) % 628) / 100;
      const dx = Math.cos(p.rumbo),
        dy = Math.sin(p.rumbo);
      return GENTE.vistaDe(dx * coG - dy * siG, (dx * siG + dy * coG) * cam.k);
    };
    // solo la gente que cae en la pantalla arma su dibujo de este cuadro (de lejos la gente no se dibuja)
    const Vg = VISTA25.proyector(cam),
      mgx = cw / cam.esc / 2 + 300,
      mgy = ch / cam.esc / 2 + 400;
    const enPantalla = (p) => {
      const [vx, vy] = Vg(p.x, p.y);
      return Math.abs(vx - cam.x) < mgx && Math.abs(vy - cam.y) < mgy;
    };
    const todos = mas ? gente.concat(mas) : gente;
    const extra = (cam.esc < VISTA25.LEJOS.gente ? [] : todos)
      .filter((p) => p.visible !== false && enPantalla(p))
      .map((p) => p.dibujo ? { x: p.x, y: p.y, f: p.dibujo } : ({ x: p.x, y: p.y, f: (cx, sx, sy) => GENTE.dibujar(cx, p.id, sx, sy, tt, { ...mirada(p), camina: !!((p.vx || p.vy) && !(p.charla > 0)) || p.camina, hablando: p.charla > 0 || p.hablando || (p.habla && Math.sin(tt * 0.7 + p.x) > 0.3) || (p.canta && !p.callada) }) }));
    extra.push(...RECORRER25.extra(cam, tt));
    ENSERES25.noche = h >= 18 || h < 6 ? 1 : 0;
    // la luz según la hora (LUCES25): sombras que caen según el sol, el color de cada hora, la bruma de lo lejano y de
    // noche la capa de oscuridad del bosque (LUZ) con agujeros donde alumbra algo
    const n = noche(h);
    VISTA25.dibujar(c, cam, cw, ch, tt, extra, (cx) => RECORRER25.piso(cx, cam, tt, h), SOMBRAS25.preparar(cam, h, n));
    RECORRER25.encima(c, cam, cw, ch, tt, h, "mundo");
    c.setTransform(1, 0, 0, 1, 0, 0);
    LUCES25.antes(c, cam, cw, ch, h, tt, n);
    if (n > 0.01) {
      const enVista = LUCES25.dePantalla(cam, cw, ch, h, tt, RECORRER25.ero);
      LUZ.dibujar(c, cw, ch, 0, 0, 1, enVista, { o: 0, n, osc: Math.min(0.82, 0.06 + n * 0.74) }, tt);
      LUCES25.despues(c, cam, cw, ch, h, tt, n, enVista);
    }
    // el velo cálido y la viñeta, horneados juntos en un lienzo del tamaño de la pantalla: una sola copia por cuadro
    if (velo.width !== cw || velo.height !== ch) {
      velo.width = cw;
      velo.height = ch;
      const v = velo.getContext("2d");
      v.fillStyle = "rgba(255,141,113,0.05)";
      v.fillRect(0, 0, cw, ch);
      const g = v.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.max(cw, ch) * 0.75);
      g.addColorStop(0, "rgba(10,14,12,0)");
      g.addColorStop(1, "rgba(10,14,12,0.55)");
      v.fillStyle = g;
      v.fillRect(0, 0, cw, ch);
    }
    c.drawImage(velo, 0, 0);
    RECORRER25.encima(c, cam, cw, ch, tt, h, "hud");
  }

  return { armar, moverGente, dibujar, noche, libre: (x, y, m) => libre(x, y, m), buscarLibre: (x, y) => buscarLibre(x, y), gente: () => gente, plano: () => plano };
})();
