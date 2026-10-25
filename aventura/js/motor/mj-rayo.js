// ---------- minijuego: el rayo de luz rúnica (MINIJ «rayo») ----------
// Una losa en grilla con una piedra que echa luz rúnica, piedras espejo talladas en diagonal y el sello que hay que
// encender. Tocar un espejo lo da vuelta (de / a \); la luz rebota en cada espejo y se corta en las piedras ciegas y en
// las ataduras violeta. Con el teclado, las flechas mueven la marca y usar da vuelta el espejo. Variantes: base,
// ataduras (casillas violeta que se tragan la luz y espejos atados que no giran), dos sellos (dos fuentes y dos sellos),
// la luna (la luz pálida baja de arriba, para los ritos de la luna) y contra el tiempo. Siempre tiene solución: se arma
// el camino de la luz primero y se ponen los espejos en sus vueltas; los demás son señuelos. Lo usan el rito de la luna
// (ritos.js) y el sello del Santuario de las Raíces en la misión EL-07 (juego.js).
(function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const CX = 860,
    CY = 490;
  const DIR = [[1, 0], [0, -1], [-1, 0], [0, 1]]; // este, norte, oeste, sur (y para abajo en pantalla)
  // la vuelta de cada espejo: "/" este↔norte, oeste↔sur; "\" este↔sur, oeste↔norte
  const REBOTA = { "/": [1, 0, 3, 2], "\\": [3, 2, 1, 0] };

  const tam = (S) => Math.min(100, Math.floor(Math.min(1000 / S.v.c, 640 / S.v.r)));
  const x0 = (S) => CX - (S.v.c * tam(S)) / 2;
  const y0 = (S) => CY - (S.v.r * tam(S)) / 2;
  const dentro = (S, x, y) => x >= 0 && y >= 0 && x < S.v.c && y < S.v.r;
  const idx = (S, x, y) => y * S.v.c + x;

  // el camino de una fuente a un sello: tramos rectos y una vuelta (espejo) entre cada uno, sin pisarse a sí mismo ni
  // las casillas que ya usa otro camino
  function camino(S, usadas, desdeArriba) {
    for (let intento = 0; intento < 300; intento++) {
      let x, y, d;
      if (desdeArriba) (x = 1 + Math.floor(S.rnd() * (S.v.c - 2))), (y = 0), (d = 3);
      else (x = 0), (y = Math.floor(S.rnd() * S.v.r)), (d = 0);
      const fuente = { x, y, d },
        celdas = [[x, y]],
        espejos = [];
      const ocupa = new Set(usadas);
      ocupa.add(idx(S, x, y));
      let ok = true;
      for (let v = 0; v <= S.v.giros && ok; v++) {
        const largo = 1 + Math.floor(S.rnd() * 3);
        for (let k = 0; k < largo; k++) {
          x += DIR[d][0];
          y += DIR[d][1];
          if (!dentro(S, x, y) || ocupa.has(idx(S, x, y))) {
            ok = false;
            break;
          }
          ocupa.add(idx(S, x, y));
          celdas.push([x, y]);
        }
        if (!ok) break;
        if (v === S.v.giros) break; // la última casilla es el sello
        // una vuelta: el espejo que lleva de d a la nueva dirección
        const nd = (d + (S.rnd() < 0.5 ? 1 : 3)) % 4,
          forma = REBOTA["/"][d] === nd ? "/" : "\\";
        espejos.push({ x, y, forma });
        d = nd;
      }
      if (!ok || celdas.length < 4) continue;
      const [sx, sy] = celdas[celdas.length - 1];
      if (espejos.some((e) => e.x === sx && e.y === sy)) continue;
      return { fuente, sello: { x: sx, y: sy }, espejos, celdas };
    }
    return null;
  }
  // la luz de una fuente: las casillas que cruza (con su dirección) y si llega a un sello
  function luz(S, f) {
    let x = f.x,
      y = f.y,
      d = f.d;
    const tramo = [[x, y, d]],
      vistos = new Set();
    for (let k = 0; k < 200; k++) {
      const c = S.celda[idx(S, x, y)];
      if (k > 0 && c) {
        if (c.tipo === "espejo") d = REBOTA[c.forma][d];
        else if (c.tipo === "sello") return { tramo, sello: c };
        else if (c.tipo === "ciega" || c.tipo === "atadura" || c.tipo === "fuente") return { tramo, corte: c };
      }
      const clave = x + "," + y + "," + d;
      if (vistos.has(clave)) return { tramo };
      vistos.add(clave);
      x += DIR[d][0];
      y += DIR[d][1];
      if (!dentro(S, x, y)) return { tramo, fuera: [x, y] };
      tramo.push([x, y, d]);
    }
    return { tramo };
  }
  function trazar(S) {
    S.rayos = S.fuentes.map((f) => luz(S, f));
    S.sellos.forEach((s) => (s.lit = S.rayos.some((r) => r.sello === s)));
    return S.sellos.every((s) => s.lit);
  }

  MINIJ.registrar("rayo", {
    variantes: {
      base: { c: 7, r: 5, giros: 3, senuelos: 2 },
      ataduras: { c: 7, r: 5, giros: 4, senuelos: 3, ataduras: 4, fijos: 1 },
      dos: { c: 8, r: 6, giros: 3, senuelos: 2, dos: true },
      luna: { c: 7, r: 5, giros: 4, senuelos: 3, luna: true },
      reloj: { c: 8, r: 6, giros: 5, senuelos: 4, ataduras: 3, tiempo: 90 },
    },
    pie: "mn.rayo_pie",
    armar(S) {
      for (let intento = 0; intento < 50; intento++) {
        S.celda = {};
        S.fuentes = [];
        S.sellos = [];
        const usadas = new Set(),
          caminos = [];
        const n = S.v.dos ? 2 : 1;
        let ok = true;
        for (let k = 0; k < n && ok; k++) {
          const cm = camino(S, usadas, S.v.luna);
          if (!cm) ok = false;
          else {
            cm.celdas.forEach(([x, y]) => usadas.add(idx(S, x, y)));
            caminos.push(cm);
          }
        }
        if (!ok) continue;
        caminos.forEach((cm, k) => {
          const f = Object.assign({ tipo: "fuente", n: k }, cm.fuente);
          S.celda[idx(S, f.x, f.y)] = f;
          S.fuentes.push(f);
          const s = { tipo: "sello", x: cm.sello.x, y: cm.sello.y, n: k };
          S.celda[idx(S, s.x, s.y)] = s;
          S.sellos.push(s);
          cm.espejos.forEach((e, j) => (S.celda[idx(S, e.x, e.y)] = { tipo: "espejo", x: e.x, y: e.y, forma: e.forma, bien: e.forma, fijo: j < (S.v.fijos || 0) }));
        });
        // señuelos, piedras ciegas y ataduras en lo que la luz no usa
        const libres = [];
        for (let y = 0; y < S.v.r; y++) for (let x = 0; x < S.v.c; x++) if (!usadas.has(idx(S, x, y))) libres.push([x, y]);
        libres.sort(() => S.rnd() - 0.5);
        const poner = (k, fn) => libres.splice(0, k).forEach(([x, y]) => (S.celda[idx(S, x, y)] = fn(x, y)));
        poner(S.v.senuelos || 0, (x, y) => ({ tipo: "espejo", x, y, forma: S.rnd() < 0.5 ? "/" : "\\" }));
        poner(S.v.ataduras || 0, (x, y) => ({ tipo: "atadura", x, y }));
        poner(Math.floor(libres.length * 0.12), (x, y) => ({ tipo: "ciega", x, y }));
        // los espejos que giran, revueltos (al menos uno del camino mal, así no arranca resuelto)
        const giran = Object.values(S.celda).filter((c) => c.tipo === "espejo" && !c.fijo);
        giran.forEach((c) => (c.forma = S.rnd() < 0.5 ? "/" : "\\"));
        if (trazar(S)) {
          const del = giran.find((c) => c.bien);
          if (!del) continue;
          del.forma = del.bien === "/" ? "\\" : "/";
        }
        if (trazar(S)) continue;
        S.giros = 0;
        S.cur = giran.length ? idx(S, giran[0].x, giran[0].y) : 0;
        S.gano = 0;
        return;
      }
    },
    paso(S, dt) {
      const mover = (dx, dy) => {
        const x = (S.cur % S.v.c) + dx,
          y = Math.floor(S.cur / S.v.c) + dy;
        if (dentro(S, x, y)) S.cur = idx(S, x, y);
      };
      if (CONTROLES.recien("arriba")) mover(0, -1);
      if (CONTROLES.recien("abajo")) mover(0, 1);
      if (CONTROLES.recien("izquierda")) mover(-1, 0);
      if (CONTROLES.recien("derecha")) mover(1, 0);
      if (CONTROLES.recien("interactuar") || CONTROLES.recien("atacar")) this.tocar(S, S.cur);
      if (S.gano && (S.gano -= dt) <= 0) MINIJ.terminar({ gano: true, giros: S.giros });
    },
    tocar(S, i) {
      if (S.gano || i == null) return;
      const c = S.celda[i];
      if (!c || c.tipo !== "espejo") return;
      if (c.fijo) return (S.luz["f" + i] = 0.4), MINIJ_SONAR(150, 0.15, "sawtooth");
      c.forma = c.forma === "/" ? "\\" : "/";
      S.giros++;
      c.giro = 0.2;
      MINIJ_SONAR(380 + (i % 7) * 30, 0.08, "triangle");
      if (trazar(S)) (S.gano = 0.9), (S.luz.todo = 0.9), MINIJ_SONAR(880, 0.45);
    },
    hit(S, x, y) {
      const q = tam(S),
        u = Math.floor((x - x0(S)) / q),
        v = Math.floor((y - y0(S)) / q);
      return dentro(S, u, v) ? idx(S, u, v) : null;
    },
    res: (S) => t("mn.rayo_res", [S.giros]),
    dibujar(S, D) {
      const c = D.c,
        q = tam(S),
        X = x0(S),
        Y = y0(S),
        col = S.v.luna ? "#DDE6F2" : "#73D5DB",
        centro = (x, y) => [X + x * q + q / 2, Y + y * q + q / 2];
      // la losa y su grilla tallada
      D.P([X - 16, Y - 16, X + S.v.c * q + 16, Y - 16, X + S.v.c * q + 16, Y + S.v.r * q + 16, X - 16, Y + S.v.r * q + 16], "#2A2220");
      for (let y = 0; y < S.v.r; y++)
        for (let x = 0; x < S.v.c; x++) D.P([X + x * q + 2, Y + y * q + 2, X + (x + 1) * q - 2, Y + y * q + 2, X + (x + 1) * q - 2, Y + (y + 1) * q - 2, X + x * q + 2, Y + (y + 1) * q - 2], (x + y) % 2 ? "#1E1816" : "#221A18");
      // la luz (debajo de las piedras): un trazo ancho tenue y uno fino brillante
      (S.rayos || []).forEach((r) => {
        const pts = r.tramo.map(([x, y]) => centro(x, y));
        if (r.sello) pts.push(centro(r.sello.x, r.sello.y));
        else if (r.corte) pts.push(centro(r.corte.x, r.corte.y));
        else if (r.fuera) pts.push(centro(r.fuera[0], r.fuera[1]));
        [[18, 0.25], [6, 1]].forEach(([w, a]) =>
          DIB.alfa(c, a, () => {
            c.strokeStyle = col;
            c.lineWidth = w;
            c.lineCap = "round";
            c.lineJoin = "round";
            c.beginPath();
            pts.forEach(([px, py], k) => (k ? c.lineTo(px, py) : c.moveTo(px, py)));
            c.stroke();
          }),
        );
      });
      // las piedras
      Object.values(S.celda).forEach((p) => {
        const [px, py] = centro(p.x, p.y),
          m = q * 0.36;
        if (p.tipo === "fuente") {
          D.piedra(px - m, py - m, m * 2, m * 2, "#56524E", "#3A3634");
          D.runa(S.v.luna ? "sowilo" : "kenaz", px, py, q * 0.22, col, 0.24);
          D.halo(px, py, q * 0.5, col, 0.3);
        } else if (p.tipo === "sello") {
          D.rombo(px, py, m * 1.1, p.lit ? col : "#3A3634");
          D.rombo(px, py, m * 0.75, p.lit ? "#F2ECEC" : "#5E130D");
          D.runa("othala", px, py, q * 0.18, p.lit ? "#2E8A90" : "#9C2315", 0.24);
          if (p.lit) D.halo(px, py, q * 0.7, col, 0.45);
        } else if (p.tipo === "ciega") D.piedra(px - m, py - m, m * 2, m * 2, "#4A4442", "#2A2220");
        else if (p.tipo === "atadura") {
          DIB.alfa(c, 0.5, () => D.rombo(px, py, m, "#9A6BD8"));
          [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => D.rombo(px + a * m * 0.7, py + b * m * 0.7, 6, "#9A6BD8"));
        } else if (p.tipo === "espejo") {
          // la piedra espejo: una losa parada en diagonal, cara clara arriba a la derecha
          const s = p.forma === "/" ? 1 : -1,
            l = m * 1.15,
            g = 9;
          D.P([px - l, py + l * s, px + l, py - l * s, px + l + g * 0.5, py - l * s + g, px - l + g * 0.5, py + l * s + g], "#3A3634");
          D.P([px - l, py + l * s, px + l, py - l * s, px + l - g * 0.4, py - l * s - g, px - l - g * 0.4, py + l * s - g], p.fijo ? "#6E6A66" : "#B8C8CA");
          if (p.fijo) [[-l * 0.5, l * 0.5 * s], [l * 0.5, -l * 0.5 * s]].forEach(([a, b]) => D.rombo(px + a, py + b, 7, S.luz["f" + idx(S, p.x, p.y)] > 0 ? "#F2ECEC" : "#9A6BD8"));
        }
      });
      // la marca del teclado
      const [mx, my] = centro(S.cur % S.v.c, Math.floor(S.cur / S.v.c));
      c.save();
      c.strokeStyle = "#9C2315";
      c.lineWidth = 3;
      c.strokeRect(mx - q / 2 + 4, my - q / 2 + 4, q - 8, q - 8);
      c.restore();
      if (S.luz.todo > 0) D.halo(CX, CY, 420, col, S.luz.todo * 0.35);
      D.texto(t("mn.rayo_sellos", [S.sellos.filter((s) => s.lit).length, S.sellos.length]), 1380, 92, 22, "#F2ECEC", "right");
    },
  });
  function MINIJ_SONAR(f, dur, forma) {
    if (window.SONIDO) SONIDO.tono(forma || "sine", f, f * 1.02, dur, 0.09, {});
  }
})();
