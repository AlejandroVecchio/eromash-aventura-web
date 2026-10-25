// ---------- la forja al ritmo del yunque (sistema FORJA, modo "forja") ----------
// Ása forja una pieza nueva y Eromash martilla al ritmo: un juego de ritmo como Guitar Hero. Cuatro carriles (A S D W
// de izquierda a derecha, o ← ↓ → ↑, la cruceta o tocando el carril; las teclas se cambian en Opciones → Teclas o
// desde el menú de la forja) con runas que bajan hasta el yunque; se aprieta
// justo cuando llegan. Tres tramos: el fuelle (notas largas que se mantienen: el hierro se calienta), el martillo
// (golpes, cada vez más seguidos) y el temple (un golpe final con atacar cuando el hierro brilla). Lo bien que se
// martilla decide la rareza (común, mágica, rara o legendaria) y qué tan altos salen los números (OBJETOS.generar
// con `calidad`). Dos maneras: «con calma» (más lento, a lo sumo rara) y «a fuego vivo» (más rápido, más caro y la
// única que puede dar una legendaria). La música se arma en el momento con Web Audio (SONIDO.tono): el tambor, el
// bordón y una nota por carril, en una escala pentatónica que suena a cuerno.
// Se abre desde Ása («Forjar una pieza») o desde su yunque en la herrería. Detalle en docs/rpg.md (Forja).
window.FORJA = (function () {
  "use strict";
  let A, J, jug;
  const t = (k, v) => I18N.t(k, v);
  const CARRILES = ["carril1", "carril2", "carril3", "carril4"], // acciones de CONTROLES: A S D W
    RUNAS = ["uruz", "kenaz", "tiwaz", "sowilo"],
    COLORES = ["#C8402D", "#FFD98A", "#73D5DB", "#E0B2B2"],
    TONOS = [220, 262, 294, 330, 392, 440];
  // las ventanas (segundos) y lo que vale cada juicio
  const JUICIO = [
    { k: "perfecto", v: 0.05, p: 1, col: "#FFD98A", calor: 0.035 },
    { k: "bien", v: 0.095, p: 0.7, col: "#F2ECEC", calor: 0.015 },
    { k: "flojo", v: 0.145, p: 0.35, col: "#E0B2B2", calor: 0 },
  ];
  const MODOS = {
    calma: { bpm: 84, tope: 2, costo: 1, densidad: 0.25, acordes: 0 },
    fuego: { bpm: 112, tope: 3, costo: 1.6, densidad: 0.55, acordes: 0.12 },
    // a fuego vivo con una brasa de Muspell (MATERIALES): igual de rápido, la nota sube
    brasa: { bpm: 112, tope: 3, costo: 1.6, densidad: 0.55, acordes: 0.12, bono: 0.08 },
  };
  const VIAJE = 1.5; // segundos que tarda una nota en bajar hasta el yunque
  // qué se puede forjar: cada grupo elige la mejor base para el nivel
  const GRUPOS = [
    { id: "espada", tipo: "espada" },
    { id: "hacha", tipo: "hacha" },
    { id: "mandoble", tipo: "mandoble" },
    { id: "hacha2", tipo: "hacha2" },
    { id: "arco", tipo: "arco" },
    { id: "lanza", tipo: "lanza" },
    { id: "martillo", tipo: "martillo" },
    { id: "baston", tipo: "baston" },
    { id: "escudo", slot: "escudo" },
    { id: "casco", slot: "casco" },
    { id: "pecho", slot: "pecho" },
    { id: "piernas", slot: "piernas" },
    { id: "botas", slot: "botas" },
  ];

  // ---------- qué base y cuánto cuesta ----------
  const nivelObjeto = () => (window.RPG ? RPG.nivel() : 1) + 1;
  function baseDe(g) {
    const n = nivelObjeto();
    const l = Object.keys(OBJETOS.BASES).filter((k) => {
      const B = OBJETOS.BASES[k];
      if (B.desde > n) return false;
      return g.tipo ? B.slot === "arma" && (B.tipo || "espada") === g.tipo : B.slot === g.slot;
    });
    // la más nueva para el nivel (a igual nivel, la de más daño o armadura)
    l.sort((a, b) => OBJETOS.BASES[b].desde - OBJETOS.BASES[a].desde || (OBJETOS.BASES[b].dano || OBJETOS.BASES[b].arm || 0) - (OBJETOS.BASES[a].dano || OBJETOS.BASES[a].arm || 0));
    return l[0] || null;
  }
  function costo(modo) {
    const rebaja = 1 - (window.SECUNDARIAS ? SECUNDARIAS.descuento() : 0);
    return Math.round((40 + nivelObjeto() * 12) * MODOS[modo].costo * rebaja);
  }

  // ---------- los menús ----------
  function abrir() {
    const pe = PODERES.estado();
    const grupos = GRUPOS.filter((g) => baseDe(g));
    A.menu(
      `<h2>${t("fg.titulo")}</h2><div class="sub">${t("fg.sub", [pe ? pe.plata : 0, nivelObjeto()])}</div>`,
      grupos
        .map((g) => {
          const b = baseDe(g);
          return { texto: t("ob.b_" + b), sub: t("fg.grupo_" + g.id), fn: () => elegirModo(g, b) };
        })
        // lo que suman otros sistemas al menú de Ása: botonesAsa() → [{ texto, sub, fn }] (las muescas)
        .concat(window.SISTEMAS.flatMap((s0) => (s0.botonesAsa ? s0.botonesAsa() : [])))
        .concat([{ texto: t("ui.cerrar"), fn: A.cerrarMenu }]),
    );
  }
  function elegirModo(g, b) {
    const pe = PODERES.estado(),
      M = window.MATERIALES;
    const linea = (modo) => {
      const c = costo(modo),
        mat = M ? M.costoForja(g, modo) : null,
        falta = pe.plata < c || (mat && !M.alcanza(mat));
      return {
        texto: t("fg.modo_" + modo),
        sub: t("fg.modo_" + modo + "_sub", [c]) + (mat ? " · " + M.texto(mat, true) : "") + (falta ? " · " + t("pj.forja_falta") : ""),
        fn: () => {
          if (pe.plata < c) return A.avisar("pj.forja_no");
          if (mat && !M.alcanza(mat)) return A.avisar("mt.falta");
          if (window.BOTIN && BOTIN.estado().bolsa.length >= 30) return A.avisar("ob.bolsa_llena");
          PODERES.pj().plata -= c;
          if (mat) M.gastar(mat);
          empezar(b, modo, c, mat);
        },
      };
    };
    const modos = [linea("calma"), linea("fuego")];
    if (M && M.cuantos("brasa") > 0) modos.push(linea("brasa"));
    const teclas = { texto: t("tc.forja"), sub: CONTROLES.GRUPOS.forja.map((a) => CONTROLES.teclaDe(a)).join(" "), fn: () => OPCIONES.teclas(() => elegirModo(g, b), "forja") };
    A.menu(`<h2>${t("ob.b_" + b)}</h2><div class="sub">${t("fg.como")}</div>`, modos.concat([teclas, { texto: t("ui.volver"), fn: abrir }]));
  }

  // ---------- la partitura ----------
  // una canción por pieza (sale de una semilla): 4 compases de fuelle, 8 de martillo y el temple
  function partitura(modo, semilla) {
    const M = MODOS[modo],
      rnd = OBJETOS.azar(semilla),
      negra = 60 / M.bpm,
      notas = [];
    let compas = 1; // el primero es la cuenta (3, 2, 1)
    // el fuelle: notas largas en los carriles de afuera y algún golpe en medio
    for (let c = 0; c < 4; c++, compas++) {
      const t0 = compas * 4 * negra;
      notas.push({ t: t0, l: c % 2 ? 3 : 0, dur: negra * 1.5, fase: "fuelle" });
      notas.push({ t: t0 + 2 * negra, l: 1 + Math.floor(rnd() * 2), dur: 0, fase: "fuelle" });
      if (rnd() < M.densidad) notas.push({ t: t0 + 3 * negra, l: c % 2 ? 0 : 3, dur: 0, fase: "fuelle" });
    }
    // el martillo: negras siempre, corcheas según la densidad (más hacia el final) y acordes a fuego vivo
    let ultimo = 1;
    for (let c = 0; c < 8; c++, compas++) {
      const t0 = compas * 4 * negra,
        dens = M.densidad * (0.6 + c * 0.1);
      for (let b = 0; b < 4; b++) {
        // no repetir mucho el mismo carril: caminar como sobre un yunque
        let l = (ultimo + 1 + Math.floor(rnd() * 3)) % 4;
        notas.push({ t: t0 + b * negra, l, dur: 0, fase: "martillo" });
        if (rnd() < M.acordes && b % 2 === 0) notas.push({ t: t0 + b * negra, l: (l + 2) % 4, dur: 0, fase: "martillo" });
        ultimo = l;
        if (rnd() < dens) {
          l = (l + 1 + Math.floor(rnd() * 3)) % 4;
          notas.push({ t: t0 + (b + 0.5) * negra, l, dur: 0, fase: "martillo" });
          ultimo = l;
        }
      }
    }
    // el temple: en el primer tiempo del compás siguiente, con atacar
    const temple = (compas + 0.5) * 4 * negra;
    return { notas, negra, temple, fin: temple + 2.2, compases: compas + 1 };
  }

  // ---------- el juego ----------
  let S = null; // la partida de forja en curso
  let lienzo = null,
    c = null;
  function crearLienzo() {
    if (lienzo) return;
    lienzo = document.createElement("canvas");
    lienzo.id = "forjaLienzo";
    lienzo.className = "ui";
    lienzo.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:60;touch-action:none";
    document.body.appendChild(lienzo);
    c = lienzo.getContext("2d");
    // tocar un carril (el celular a futuro, y el mouse ahora)
    lienzo.addEventListener("pointerdown", (e) => {
      if (!S) return;
      if (S.fase === "fin") return terminarResultado();
      const r = lienzo.getBoundingClientRect(),
        x = ((e.clientX - r.left) / r.width) * 1600,
        y = ((e.clientY - r.top) / r.height) * 900;
      const L = geom();
      if (S.ahora > S.p.temple - 1 && S.ahora < S.p.temple + 0.6) return pulsar("temple");
      for (let l = 0; l < 4; l++) if (Math.abs(x - L.x(l)) < L.ancho / 2 && y > 200) return pulsar(l, true);
    });
    lienzo.addEventListener("pointerup", () => S && S.toque != null && soltarCarril(S.toque));
  }
  function geom() {
    const ancho = 120,
      x0 = 800 - ancho * 1.5;
    return { ancho, x: (l) => x0 + l * ancho, arriba: 120, yunque: 720 };
  }
  function empezar(base, modo, pagado, mat) {
    crearLienzo();
    HUD.cerrar();
    const semilla = Math.floor(Math.random() * 1e9);
    S = {
      base,
      modo,
      pagado,
      mat,
      p: partitura(modo, semilla),
      t0: performance.now() / 1000,
      ahora: -0.5,
      sonadas: 0,
      puntos: 0,
      combo: 0,
      mejorCombo: 0,
      calor: 0.4,
      cuentas: { perfecto: 0, bien: 0, flojo: 0, falla: 0 },
      juicios: [], // los carteles que suben
      chispas: [],
      apretado: [false, false, false, false],
      temple: null, // el juicio del temple
      fase: "toca",
      golpeT: -9,
    };
    S.p.notas.forEach((n) => ((n.estado = "viene"), (n.sono = false)));
    lienzo.style.display = "block";
    J.modo = "forja";
    if (window.SONIDO) SONIDO.tocar("filo", { vol: 0.6 });
  }
  // el máximo de puntos posibles (las largas valen el doble: el golpe y el mantenerla)
  const maximo = () => S.p.notas.reduce((s, n) => s + (n.dur ? 2 : 1), 0);

  function juzgar(n, error) {
    const e = Math.abs(error);
    for (const j of JUICIO) if (e <= j.v) return j;
    return null;
  }
  function cartel(j, l) {
    S.juicios.push({ txt: t("fg.j_" + j.k), col: j.col, l, t: 0 });
  }
  function acierto(n, j) {
    S.puntos += j.p;
    S.cuentas[j.k]++;
    S.combo++;
    S.mejorCombo = Math.max(S.mejorCombo, S.combo);
    S.calor = Math.min(1, S.calor + j.calor);
    cartel(j, n.l);
    S.golpeT = S.ahora;
    const L = geom();
    for (let i = 0; i < (j.k === "perfecto" ? 10 : 5); i++)
      S.chispas.push({ x: L.x(n.l), y: L.yunque, vx: (Math.random() - 0.5) * 520, vy: -200 - Math.random() * 420, t: 0.5 + Math.random() * 0.3, col: i % 3 ? "#FFD98A" : "#FF8D71" });
    if (window.SONIDO) {
      SONIDO.tocar("golpe", { vol: 0.55, tono: 1.5 + n.l * 0.08, var: 0.04 });
      SONIDO.tono("triangle", TONOS[n.l + 1] * 2, TONOS[n.l + 1] * 2, 0.18, 0.06);
    }
  }
  function falla(n, motivo) {
    S.cuentas.falla++;
    S.combo = 0;
    S.calor = Math.max(0, S.calor - 0.07);
    S.juicios.push({ txt: t("fg.j_falla"), col: "#C8402D", l: n ? n.l : 1.5, t: 0 });
    if (window.SONIDO) SONIDO.tono("sine", 90, 60, 0.15, 0.12, { filtro: 300 });
  }
  function pulsar(l, toque) {
    if (!S || S.fase !== "toca") return;
    if (l === "temple") return templar();
    if (toque) S.toque = l;
    S.apretado[l] = true;
    // la nota más cercana de ese carril que todavía no se tocó
    let mejor = null,
      dm = 9;
    for (const n of S.p.notas) {
      if (n.l !== l || n.estado !== "viene") continue;
      const d = Math.abs(n.t - S.ahora);
      if (d < dm) {
        dm = d;
        mejor = n;
      }
    }
    if (!mejor || dm > JUICIO[2].v + 0.06) {
      // apretar al aire: un golpe flojo en el yunque (no corta el combo, pero enfría un poco)
      S.calor = Math.max(0, S.calor - 0.01);
      if (window.SONIDO) SONIDO.tocar("golpe", { vol: 0.25, tono: 0.9 });
      return;
    }
    const j = juzgar(mejor, mejor.t - S.ahora);
    if (!j) {
      mejor.estado = "fallada";
      return falla(mejor);
    }
    acierto(mejor, j);
    mejor.estado = mejor.dur ? "manteniendo" : "hecha";
  }
  function soltarCarril(l) {
    if (!S) return;
    S.apretado[l] = false;
    if (S.toque === l) S.toque = null;
    for (const n of S.p.notas) {
      if (n.l !== l || n.estado !== "manteniendo") continue;
      // soltar antes de tiempo: vale lo que se mantuvo
      const parte = Math.max(0, Math.min(1, (S.ahora - n.t) / n.dur));
      if (parte >= 0.85) {
        S.puntos += 1;
        n.estado = "hecha";
      } else {
        S.puntos += parte * 0.6;
        n.estado = "hecha";
        S.combo = 0;
        S.juicios.push({ txt: t("fg.j_suelto"), col: "#E0B2B2", l, t: 0 });
      }
    }
  }
  function templar() {
    if (S.temple) return;
    const e = S.ahora - S.p.temple,
      j = juzgar(null, e);
    S.temple = j ? j.k : "falla";
    S.golpeT = S.ahora;
    const L = geom();
    for (let i = 0; i < (j ? 28 : 8); i++) S.chispas.push({ x: 800, y: L.yunque, vx: (Math.random() - 0.5) * 900, vy: -300 - Math.random() * 600, t: 0.7 + Math.random() * 0.4, col: i % 2 ? "#FFD98A" : "#F2ECEC" });
    S.juicios.push({ txt: t(j ? "fg.temple_" + j.k : "fg.temple_falla"), col: j ? j.col : "#C8402D", l: 1.5, t: 0, grande: true });
    if (window.SONIDO) {
      SONIDO.tocar("golpeFuerte", { vol: 0.9, tono: 1.2 });
      SONIDO.tocar("filo", { vol: 0.7, tono: 0.7 });
    }
    J.sacudir && J.sacudir(0.3);
  }

  // el resultado: la nota (0 a ~1,06), la rareza y la calidad de los números
  function resultado() {
    const base = S.puntos / maximo(),
      combo = (S.mejorCombo / Math.max(1, S.p.notas.length)) * 0.05,
      tem = { perfecto: 0.06, bien: 0.03, flojo: 0, falla: -0.06 }[S.temple || "falla"],
      M = MODOS[S.modo],
      nota = Math.max(0, base + combo + tem + (M.bono || 0));
    let r = nota < 0.55 ? 0 : nota < 0.78 ? 1 : nota < 0.93 ? 2 : 3;
    r = Math.min(r, M.tope);
    const calidad = Math.max(0, Math.min(1, (nota - 0.4) / 0.6));
    return { nota, r, calidad };
  }
  function terminar() {
    const R = resultado();
    const it = OBJETOS.generar({ base: S.base, n: nivelObjeto(), r: R.r, calidad: R.calidad, tema: 1 });
    BOTIN.dar(it, { silencio: true });
    S.fase = "fin";
    S.res = Object.assign(R, { it });
    if (window.SONIDO) SONIDO.tocar(R.r >= 2 ? "mision" : "plata", { vol: 0.6 });
    if (R.r === 3 && window.SECUNDARIAS && SECUNDARIAS.proeza) SECUNDARIAS.proeza("forja_leyenda");
  }
  function terminarResultado() {
    lienzo.style.display = "none";
    const it = S.res.it;
    S = null;
    J.modo = "juego";
    CONTROLES.soltar();
    A.menu(
      `<h2>${t("fg.lista")}</h2><div class="sub">${t("fg.lista_sub")}</div>` + (window.BOTIN ? `<div class="ob-detalle">${OBJETOS.lineas(it).map((l) => `<div style="color:${l.col}">${l.txt}</div>`).join("")}</div>` : ""),
      [
        { texto: t("fg.otra"), fn: abrir },
        { texto: t("fg.ver_bolsa"), fn: () => (A.cerrarMenu(), INVENTARIO.abrir("bolsa")) },
        { texto: t("ui.cerrar"), fn: A.cerrarMenu },
      ],
    );
  }
  function abandonar() {
    // pausa a la mitad: Ása devuelve la plata y guarda el hierro
    PODERES.pj().plata += S.pagado;
    if (S.mat && window.MATERIALES) MATERIALES.devolver(S.mat);
    lienzo.style.display = "none";
    S = null;
    J.modo = "juego";
    CONTROLES.soltar();
    A.avisar("fg.abandonada", "#E0B2B2");
  }

  // la música: el tambor en cada negra, el bordón en cada compás y la nota de cada carril cuando llega
  function musica() {
    const p = S.p,
      ade = 0.12; // se agenda un poco antes para que suene a tiempo
    const tiempo = Math.floor((S.ahora + ade) / p.negra);
    while (S.sonadas <= tiempo && S.sonadas * p.negra < p.temple + 0.01) {
      const tb = S.sonadas * p.negra,
        ret = Math.max(0, tb - S.ahora);
      if (window.SONIDO && tb >= 0) {
        const fuerte = S.sonadas % 4 === 0;
        SONIDO.tono("sine", fuerte ? 130 : 105, 45, 0.16, fuerte ? 0.32 : 0.2, { retraso: ret, filtro: 400 });
        if (fuerte) SONIDO.tono("sawtooth", 110, 110, p.negra * 3.6, 0.025, { retraso: ret, filtro: 500 });
        // la cuenta: tres golpes en el yunque
        if (S.sonadas < 4) SONIDO.tono("triangle", 880, 860, 0.08, 0.08, { retraso: ret });
      }
      S.sonadas++;
    }
    for (const n of p.notas) {
      if (n.sono || n.t > S.ahora + ade) continue;
      n.sono = true;
      if (window.SONIDO) SONIDO.tono(n.dur ? "sawtooth" : "triangle", TONOS[n.l], TONOS[n.l] * (n.dur ? 1 : 0.99), n.dur ? n.dur : 0.22, n.dur ? 0.05 : 0.07, { retraso: Math.max(0, n.t - S.ahora), filtro: n.dur ? 900 : 2400 });
    }
  }

  // cada cuadro, mientras J.modo === "forja" (lo llama el bucle de juego.js)
  function paso(dt) {
    if (!S) return;
    if (S.fase === "fin") {
      if (CONTROLES.recien("seguir") || CONTROLES.recien("atacar") || CONTROLES.recien("interactuar")) terminarResultado();
      else dibujar(dt);
      return;
    }
    if (CONTROLES.recien("pausa")) return abandonar();
    S.ahora = performance.now() / 1000 - S.t0 - 0.5;
    musica();
    CARRILES.forEach((a, l) => {
      if (CONTROLES.recien(a)) pulsar(l);
      if (S && S.apretado[l] && !CONTROLES.pulsado(a) && S.toque !== l) soltarCarril(l);
    });
    if (CONTROLES.recien("atacar") || CONTROLES.recien("interactuar") || CONTROLES.recien("saltar")) {
      if (S.ahora > S.p.temple - 1) templar();
    }
    // lo que pasó de largo: falla; las largas que se mantuvieron hasta el final: completas
    for (const n of S.p.notas) {
      if (n.estado === "viene" && S.ahora - n.t > JUICIO[2].v) {
        n.estado = "fallada";
        falla(n);
      }
      if (n.estado === "manteniendo") {
        S.calor = Math.min(1, S.calor + dt * 0.12); // el fuelle calienta
        if (S.ahora >= n.t + n.dur) {
          S.puntos += 1;
          n.estado = "hecha";
        }
      }
    }
    if (!S.temple && S.ahora - S.p.temple > JUICIO[2].v) {
      S.temple = "falla";
      S.juicios.push({ txt: t("fg.temple_falla"), col: "#C8402D", l: 1.5, t: 0, grande: true });
    }
    if (S.ahora >= S.p.fin) terminar();
    dibujar(dt);
  }

  // ---------- el dibujo (1600 × 900, como los interiores) ----------
  const P = (pts, col) => DIB.P(c, pts, col);
  const rombo = (x, y, s, col) => P([x, y - s, x + s, y, x, y + s, x - s, y], col);
  function colorHierro(k) {
    return k < 0.25 ? "#5E130D" : k < 0.5 ? "#9C2315" : k < 0.75 ? "#C8402D" : k < 0.92 ? "#FF8D71" : "#FFD98A";
  }
  function dibujar(dt) {
    const W0 = innerWidth,
      H0 = innerHeight,
      pr = Math.min(2, devicePixelRatio || 1);
    if (lienzo.width !== Math.round(W0 * pr)) {
      lienzo.width = Math.round(W0 * pr);
      lienzo.height = Math.round(H0 * pr);
    }
    const k = Math.min(lienzo.width / 1600, lienzo.height / 900);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#111111";
    c.fillRect(0, 0, lienzo.width, lienzo.height);
    c.setTransform(k, 0, 0, k, (lienzo.width - 1600 * k) / 2, (lienzo.height - 900 * k) / 2);
    const L = geom();
    const golpe = Math.max(0, 1 - (S.ahora - S.golpeT) / 0.15);
    // la fragua al fondo: la boca de piedra y el fuego que late con el calor
    P([1080, 900, 1120, 300, 1480, 300, 1520, 900], "#2A2226");
    P([1080, 900, 1120, 300, 1300, 300, 1300, 900], "#1E181A");
    P([1170, 640, 1200, 470, 1400, 470, 1430, 640], "#111111");
    const fuego = 0.5 + S.calor * 0.5 + Math.sin(S.ahora * 9) * 0.08;
    DIB.alfa(c, fuego, () => {
      P([1190, 640, 1240, 540 - S.calor * 50, 1280, 600, 1310, 500 - S.calor * 60, 1350, 600, 1380, 530 - S.calor * 40, 1410, 640], "#C8402D");
      P([1230, 640, 1270, 580 - S.calor * 30, 1300, 620, 1340, 570 - S.calor * 40, 1380, 640], "#FF8D71");
    });
    // Ása al lado, mirando
    if (window.GENTE) {
      c.save();
      c.translate(250, 790);
      c.scale(2.2, 2.2);
      GENTE.dibujar(c, "asa", 0, 0, S.ahora, { vista: "S", espejo: false });
      c.restore();
    }
    // los carriles
    for (let l = 0; l < 4; l++) {
      const x = L.x(l);
      P([x - L.ancho / 2 + 6, L.arriba, x + L.ancho / 2 - 6, L.arriba, x + L.ancho / 2 - 6, L.yunque + 40, x - L.ancho / 2 + 6, L.yunque + 40], S.apretado[l] ? "#2A1E1A" : "#1A1513");
      DIB.alfa(c, 0.25, () => P([x - 1, L.arriba, x + 1, L.arriba, x + 1, L.yunque, x - 1, L.yunque], COLORES[l]));
    }
    // el yunque y el hierro encima (su color es el calor)
    P([560, 760, 1040, 760, 1000, 800, 600, 800], "#3A3634");
    P([600, 800, 1000, 800, 940, 860, 660, 860], "#2A2624");
    P([520, L.yunque + 8, 1080, L.yunque + 8, 1040, 760, 560, 760], "#5A5458");
    P([520, L.yunque + 8, 800, L.yunque + 8, 800, 760, 560, 760], "#46423F");
    P([620, L.yunque - 14 + golpe * 4, 980, L.yunque - 14 + golpe * 4, 980, L.yunque + 8, 620, L.yunque + 8], colorHierro(S.calor));
    // las marcas de cada carril sobre el yunque: la runa que hay que apretar
    for (let l = 0; l < 4; l++) {
      const x = L.x(l),
        on = S.apretado[l];
      DIB.alfa(c, on ? 0.9 : 0.45, () => rombo(x, L.yunque, 34, COLORES[l]));
      rombo(x, L.yunque, 26, "#111111");
      FUTHARK.dibujar(c, RUNAS[l], x, L.yunque + 12, 26, COLORES[l], 4);
      // la tecla o el botón de cada carril
      c.fillStyle = "#E0B2B2";
      c.font = "600 18px 'DM Sans', sans-serif";
      c.textAlign = "center";
      c.fillText(CONTROLES.glifo(CARRILES[l]) || ["←", "↓", "→", "↑"][l], x, L.yunque + 74);
    }
    // las notas
    const y = (tn) => L.yunque - ((tn - S.ahora) / VIAJE) * (L.yunque - L.arriba);
    for (const n of S.p.notas) {
      if (n.estado === "hecha" || n.estado === "fallada") continue;
      const y0 = y(n.t);
      if (y0 < L.arriba - 60 - (n.dur ? (n.dur / VIAJE) * 600 : 0)) continue;
      const x = L.x(n.l);
      if (n.dur) {
        const y1 = Math.max(L.arriba, y(n.t + n.dur)),
          yb = n.estado === "manteniendo" ? L.yunque : y0;
        if (yb > y1) DIB.alfa(c, n.estado === "manteniendo" ? 0.85 : 0.5, () => P([x - 10, y1, x + 10, y1, x + 10, yb, x - 10, yb], COLORES[n.l]));
      }
      if (n.estado === "viene" && y0 <= L.yunque + 50) {
        rombo(x, y0, 30, COLORES[n.l]);
        rombo(x, y0, 20, "#111111");
        FUTHARK.dibujar(c, RUNAS[n.l], x, y0 + 9, 20, COLORES[n.l], 3);
      }
    }
    // el temple: una barra grande que baja por los cuatro carriles
    const yt = y(S.p.temple);
    if (!S.temple && yt > L.arriba - 40 && yt < L.yunque + 60) {
      DIB.alfa(c, 0.85, () => P([L.x(0) - 50, yt - 14, L.x(3) + 50, yt - 14, L.x(3) + 50, yt + 14, L.x(0) - 50, yt + 14], "#FFD98A"));
      c.fillStyle = "#111111";
      c.font = "700 20px 'DM Sans', sans-serif";
      c.fillText(t("fg.templa", [CONTROLES.glifo("atacar")]), 800, yt + 7);
    }
    // chispas
    for (let i = S.chispas.length - 1; i >= 0; i--) {
      const ch = S.chispas[i];
      ch.t -= dt;
      ch.x += ch.vx * dt;
      ch.y += ch.vy * dt;
      ch.vy += 1400 * dt;
      if (ch.t <= 0) S.chispas.splice(i, 1);
      else DIB.alfa(c, Math.min(1, ch.t * 2), () => rombo(ch.x, ch.y, 4, ch.col));
    }
    // los juicios que suben
    c.textAlign = "center";
    for (let i = S.juicios.length - 1; i >= 0; i--) {
      const j = S.juicios[i];
      j.t += dt;
      if (j.t > 0.7) {
        S.juicios.splice(i, 1);
        continue;
      }
      c.globalAlpha = Math.min(1, (0.7 - j.t) * 3);
      c.fillStyle = j.col;
      c.font = `700 ${j.grande ? 54 : 26}px 'DM Sans', sans-serif`;
      c.fillText(j.txt, j.grande ? 800 : L.x(Math.round(j.l)), (j.grande ? 420 : L.yunque - 70) - j.t * 60);
      c.globalAlpha = 1;
    }
    // arriba: la pieza, el tramo, el combo, la nota hasta ahora y el calor
    c.textAlign = "left";
    c.fillStyle = "#F2ECEC";
    c.font = "700 30px 'DM Sans', sans-serif";
    c.fillText(t("ob.b_" + S.base), 60, 70);
    c.font = "500 20px 'DM Sans', sans-serif";
    c.fillStyle = "#E0B2B2";
    const fase = S.ahora < 0 ? "cuenta" : S.ahora < S.p.notas.find((n) => n.fase === "martillo").t - 0.3 ? "fuelle" : S.ahora < S.p.temple - 1.5 ? "martillo" : "temple";
    c.fillText(t("fg.fase_" + fase), 60, 104);
    if (fase === "cuenta") {
      const q = 4 - Math.floor((S.ahora + S.p.negra * 4) / S.p.negra);
      c.textAlign = "center";
      c.fillStyle = "#FFD98A";
      c.font = "700 90px 'DM Sans', sans-serif";
      if (q >= 1 && q <= 3) c.fillText(String(q), 800, 450);
      c.textAlign = "left";
    }
    // la precisión hasta ahora (sobre lo que ya pasó)
    const pasado = S.p.notas.reduce((q, n) => q + (n.estado === "hecha" || n.estado === "fallada" ? (n.dur ? 2 : 1) : n.estado === "manteniendo" ? 1 : 0), 0);
    const parcial = pasado ? S.puntos / pasado : 1;
    c.textAlign = "right";
    c.fillStyle = "#FFD98A";
    c.font = "700 30px 'DM Sans', sans-serif";
    c.fillText(Math.min(100, Math.round(parcial * 100)) + " %", 1540, 70);
    c.fillStyle = "#F2ECEC";
    c.font = "500 20px 'DM Sans', sans-serif";
    c.fillText(t("fg.combo", [S.combo]), 1540, 104);
    // el calor del hierro
    P([1380, 130, 1540, 130, 1540, 146, 1380, 146], "#2A2226");
    P([1380, 130, 1380 + 160 * S.calor, 130, 1380 + 160 * S.calor, 146, 1380, 146], colorHierro(S.calor));
    c.fillStyle = "#E0B2B2";
    c.font = "500 15px 'DM Sans', sans-serif";
    c.fillText(t("fg.calor"), 1540, 168);
    c.textAlign = "left";
    c.fillStyle = "#E0B2B2";
    c.fillText(t("fg.pausa", [CONTROLES.glifo("pausa")]), 60, 870);
    if (S.fase === "fin") dibujarFin();
  }
  function dibujarFin() {
    const R = S.res,
      col = OBJETOS.COL_TEXTO[R.r];
    DIB.alfa(c, 0.82, () => P([0, 0, 1600, 0, 1600, 900, 0, 900], "#111111"));
    c.textAlign = "center";
    c.fillStyle = col;
    c.font = "700 46px 'DM Sans', sans-serif";
    c.fillText(OBJETOS.nombre(R.it), 800, 300);
    c.fillStyle = "#E0B2B2";
    c.font = "500 22px 'DM Sans', sans-serif";
    c.fillText(t("fg.nota", [Math.min(100, Math.round(R.nota * 100)), t("ob.r_" + OBJETOS.RAREZAS[R.r].id)]), 800, 345);
    if (window.ARTE_OBJ) ARTE_OBJ.icono(c, R.it, 800, 470, 150);
    c.fillStyle = "#F2ECEC";
    c.font = "500 20px 'DM Sans', sans-serif";
    const k = S.cuentas;
    c.fillText(t("fg.cuentas", [k.perfecto, k.bien, k.flojo, k.falla, S.mejorCombo]), 800, 600);
    c.fillText(t("fg.temple_es", [t("fg.j_" + (S.temple || "falla"))]), 800, 632);
    c.fillStyle = "#FFD98A";
    c.fillText(t("fg.seguir", [CONTROLES.glifo("seguir")]), 800, 720);
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
    },
    alEmpezar() {
      if (S) {
        S = null;
        if (lienzo) lienzo.style.display = "none";
      }
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, abrir, empezar, paso, terminar: () => S && terminar(), partitura, resultado: () => S && resultado(), estado: () => S, pulsar, soltarCarril, templar, baseDe, costo, GRUPOS, MODOS, JUICIO, VIAJE };
})();
