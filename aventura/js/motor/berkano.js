// ---------- las piedras de Berkano y los manantiales rúnicos (sistema BERKANO) ----------
// La vida de reserva, a la manera de las botellas de vida de MediEvil 2 pero con la identidad de Eromash: cada piedra
// de Berkano (la runa de la vida que vuelve) guarda vida en luz rúnica y, cuando la vida llega a 0, se rompe la más
// cargada y Eromash vuelve con lo que tenía en vez de caer. Se recargan en los manantiales rúnicos (primero la
// vida, después las piedras; cada uno tiene 240 de caudal y se llena de nuevo al amanecer), con Thora, en el Anillo
// de los álfar, con las brasas de vida que sobran y con el brebaje de Berkano (en la barra de abajo). Ása las talla
// más hondo en la forja para que curen más. Estado en E.extra.berkano = { p: [carga 0..1 por piedra], talla,
// brebajes, compradas, man: { clave: { luz, dia } }, tomadas: { clave: true }, vistos: { clave: true } }.
window.BERKANO = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const RUNICO = "#73D5DB";
  const MAX = 6, // piedras que se pueden llevar
    CURA = [60, 80, 100, 120], // vida que guarda cada piedra según la talla de Ása
    COSTO_TALLA = [90, 180, 300],
    CAUDAL = 240, // vida que da un manantial lleno
    FLUJO = 40, // vida por segundo que da el manantial
    MAX_BREBAJES = 3,
    BREBAJE_HIERBAS = 2,
    BREBAJE_PLATA = 15,
    PRECIO_PIEDRA = [120, 200]; // las dos que vende Thora
  let st = null;
  const clave = (o) => Math.round(o.x) + "_" + Math.round(o.y);
  const cura = () => CURA[Math.min(CURA.length - 1, st.talla)];

  // ---------- las piedras ----------
  const cargadas = () => st.p.filter((p) => p >= 0.999).length;
  const llenas = () => st.p.length > 0 && st.p.every((p) => p >= 0.999);
  // vida que entra a las piedras (de a una, la más vacía primero); devuelve lo que no entró
  function cargar(vida) {
    while (vida > 0.01) {
      let i = -1;
      st.p.forEach((p, k) => p < 0.999 && (i < 0 || p < st.p[i]) && (i = k));
      if (i < 0) break;
      const falta = (1 - st.p[i]) * cura(),
        va = Math.min(falta, vida);
      st.p[i] = Math.min(1, st.p[i] + va / cura());
      vida -= va;
    }
    return vida;
  }
  function cargarTodas() {
    for (let i = 0; i < st.p.length; i++) st.p[i] = 1;
  }
  // la vida llegó a 0: se rompe la piedra más cargada y Eromash vuelve con esa vida (la llama juego.js antes de morir)
  // ---------- salvarse: cuatro maneras de que Berkano te devuelva ----------
  // Al caer, Eromash queda con 1 de vida e intocable y una piedra hace su número; el juego sigue corriendo todo el
  // tiempo (sin cámara lenta). Para comparar (Alejandro elige una): ?berkano=piso|hud|cielo|corona o BERKANO.modo(m).
  //   piso    la piedra parada sale del piso al costado, crece, se raja y estalla (asset piedraBerkanoSurge)
  //   hud     como la botella del MediEvil 2: sale de su rombo del HUD, vuela al centro de la pantalla agrandándose
  //           (se acerca a nosotros), se raja, estalla y la vida baja en motas hasta Eromash
  //   cielo   cae del cielo como un cometa rúnico al lado de Eromash: el golpe empuja a las criaturas y cura
  //   corona  tres piedritas salen del piso, giran alrededor de Eromash cada vez más rápido y se le meten en el pecho
  const MODOS = ["piso", "hud", "cielo", "corona"];
  let modo = (location.search.match(/[?&]berkano=(\w+)/) || [])[1];
  if (!MODOS.includes(modo)) modo = "hud"; // la que eligió Alejandro (26/10/2026); las otras quedan para probar
  const FIN = { piso: 0.9, hud: 0.8, cielo: 0.62, corona: 0.85 }, // cuándo estalla
    LLEGA = { piso: 0, hud: 0.4, cielo: 0, corona: 0 }, // cuánto tarda la vida en llegar después del estallido
    SURGE = { boca: 0.12, sube: 0.62 }; // la del piso: se abre el piso y termina de salir
  const baja = () => window.CALIDAD && CALIDAD.nivel === "baja";
  let surge = null; // { modo, t, x, y, vida, estallo, curado }
  function salvar() {
    if (!st || !st.p.length || surge) return !!surge;
    let i = 0;
    st.p.forEach((p, k) => p > st.p[i] && (i = k));
    if (st.p[i] < 0.05) return false;
    const vida = Math.max(1, Math.round(st.p[i] * cura()));
    st.p[i] = 0;
    jug.hp = 1;
    jug.inv = FIN[modo] + LLEGA[modo] + 1.2;
    // al costado de Eromash en pantalla (también con la cámara girada: VOL.ejeMundo pasa de la vista al mundo y al
    // revés), del lado al que no mira para no taparlo
    const V = window.VOL && VOL.ejeMundo ? VOL.ejeMundo : (e) => e,
      g = window.VOL ? VOL.cam.g : 0,
      mira = jug.dir ? V({ x: jug.dir[0], y: jug.dir[1] }, -g) : { x: 1 },
      lado = mira.x > 0 ? -1 : 1,
      d = V({ x: lado * (modo === "cielo" ? 90 : 62), y: 8 });
    surge = { modo, t: 0, x: jug.x + d.x, y: jug.y + d.y, vida, estallo: false, curado: false, lado, i };
    if (modo === "hud") empezarHud(surge);
    if (modo === "corona") surge.a0 = Math.random() * Math.PI * 2;
    if (modo !== "cielo") J.sacudir(0.25);
    if (modo === "piso") J.marcas.push({ tipo: "anillo", x: surge.x, y: surge.y, s: 0.9, col: RUNICO, t: 0 });
    if (window.ANIMA) ANIMA.gesto("susto");
    if (window.SONIDO) {
      if (modo === "piso" || modo === "corona") SONIDO.tocar("crujido", { vol: 0.6, tono: 0.6, x: surge.x, y: surge.y });
      SONIDO.tono("triangle", modo === "cielo" ? 900 : 160, modo === "cielo" ? 200 : 420, FIN[modo], 0.05, { filtro: 1800 });
    }
    return true;
  }
  // los pedazos de piedra que saltan y la vida en motas que vuelan hasta Eromash (llegan cuando se apagan)
  function pedazos(x, y, n, v) {
    for (let k = 0; k < (baja() ? Math.ceil(n / 3) : n); k++) {
      const a = Math.random() * Math.PI * 2,
        r = v * (0.6 + Math.random() * 0.8);
      J.fx.push({ x, y: y - 40 - Math.random() * 50, vx: Math.cos(a) * r, vy: -120 - Math.random() * 260, t: 0.5 + Math.random() * 0.4, c: k % 3 ? "#77736C" : "#9A968E", s: 4 + Math.random() * 5, g: 1 });
    }
  }
  function motas(x, y, n) {
    for (let k = 0; k < (baja() ? 6 : n); k++) {
      const vida = 0.35 + Math.random() * 0.25,
        sx = x + (Math.random() - 0.5) * 40,
        sy = y - 30 - Math.random() * 80;
      J.fx.push({ x: sx, y: sy, vx: (jug.x - sx) / vida, vy: (jug.y - 50 - sy) / vida, t: vida, c: k % 3 ? RUNICO : "#C8F2F4", s: 3 + Math.random() * 3, g: 0 });
    }
  }
  function estallar() {
    const s = surge;
    s.estallo = true;
    // Eromash absorbe la energía (nada de festejar): la animación de ANIMA, con las partículas rúnicas
    if (window.ANIMA) ANIMA.absorber({ col: RUNICO, col2: "#C8F2F4", forma: "rombo", dur: LLEGA[s.modo] + 0.75 });
    if (s.modo === "piso") {
      J.sacudir(0.55);
      J.marcas.push({ tipo: "anillo", x: s.x, y: s.y, s: 1.8, col: RUNICO, t: 0 });
      pedazos(s.x, s.y, 24, 280);
      motas(s.x, s.y, 20);
    } else if (s.modo === "cielo") {
      // el golpe del cometa: onda, polvo, pedazos y las criaturas cercanas para atrás
      J.sacudir(0.8);
      J.marcas.push({ tipo: "anillo", x: s.x, y: s.y, s: 2.8, col: RUNICO, t: 0 });
      J.ondas.push({ tipo: "pulso", x: s.x, y: s.y, t: 0 });
      pedazos(s.x, s.y, 28, 360);
      A.polvareda(s.x, s.y, 14);
      motas(s.x, s.y, 18);
      for (const e of A.enemigos) {
        if (!e.activo || e.vida <= 0 || e.carga) continue;
        const l = Math.hypot(e.x - s.x, e.y - s.y);
        if (l > 280 || !l) continue;
        const k = (e.d.pesado || e.lider ? 220 : 620) * (1 - l / 400);
        e.vx = ((e.x - s.x) / l) * k;
        e.vy = ((e.y - s.y) / l) * k;
      }
      if (window.SONIDO) SONIDO.tocar("golpeFuerte", { vol: 0.8, tono: 0.55, x: s.x, y: s.y });
    } else if (s.modo === "corona") {
      J.sacudir(0.4);
      A.columnaRunica(jug.x, jug.y);
    } else if (s.modo === "hud") estallarHud(s);
    if (window.SONIDO && s.modo !== "cielo") SONIDO.tocar("golpeFuerte", { vol: 0.45, tono: 0.75 });
  }
  function curar() {
    const s = surge;
    s.curado = true;
    jug.hp = Math.min(jug.hpMax, Math.max(jug.hp, s.vida));
    J.marcas.push({ tipo: "anillo", x: jug.x, y: jug.y, s: 1.2, col: "#C8F2F4", t: 0 });
    if (window.VIDA) VIDA.evento("sanar", jug.x, jug.y);
    if (window.SONIDO) {
      SONIDO.tocar("runa", { vol: 0.7 });
      SONIDO.tono("triangle", 392, 784, 0.7, 0.06, { filtro: 2800 });
    }
    A.numero(jug.x, jug.y - 90, s.vida, RUNICO);
    const quedan = cargadas();
    HUD.aviso(quedan || st.p.some((p) => p >= 0.05) ? t("bk.salvado") + " · " + t("bk.salvado_sub", [quedan]) : t("bk.ultima"), RUNICO);
  }
  function avanzarSurge(dt) {
    if (!surge) return;
    const s = surge;
    s.t += dt;
    if (!s.curado) jug.hp = Math.max(1, jug.hp); // el fuego o el veneno del piso no lo bajan mientras tanto
    if (!s.estallo && s.t >= FIN[s.modo]) estallar();
    if (s.estallo && !s.curado && s.t >= FIN[s.modo] + LLEGA[s.modo]) curar();
    if (s.modo === "hud") pintarHud(dt);
    if (s.curado && s.t >= FIN[s.modo] + LLEGA[s.modo] + 0.3 && !(s.modo === "hud" && hudVivo())) {
      surge = null;
      if (capa) capa.style.display = "none";
    }
  }
  // la del piso: cuánto salió, cuánto se rajó y cuánto brilla
  function poseSurge(s) {
    const tt = s.t,
      sube = Math.max(0, Math.min(1, (tt - SURGE.boca) / (SURGE.sube - SURGE.boca))),
      k = 1 - Math.pow(1 - sube, 3);
    return { k, grieta: Math.max(0, (tt - SURGE.sube) / (FIN.piso - SURGE.sube)), luz: 0.3 + 0.7 * Math.min(1, tt / FIN.piso) };
  }
  // lo que se dibuja en el mundo (piso, cielo, corona)
  function objetosSurge(lista, visible, c) {
    const s = surge;
    if (!s || s.modo === "hud") return;
    if (s.modo === "piso") {
      if (!s.estallo) visible(s.x, s.y) && lista.push({ x: s.x, y: s.y, f: () => ASSETS.dibujar(c, "piedraBerkanoSurge", s.x, s.y, J.t, poseSurge(s)) });
      else if (!baja()) {
        const k = (s.t - FIN.piso) / 0.3;
        lista.push({ x: s.x, y: s.y, f: () => DIB.halo(c, s.x, s.y - 60, 90 + 120 * k, "#C8F2F4", 0.9 * (1 - k)) });
      }
    } else if (s.modo === "cielo") {
      if (!s.estallo) {
        // de arriba a la derecha (de donde viene la luz), acelerando
        const k = Math.pow(s.t / FIN.cielo, 2),
          alto = 760 * (1 - k),
          dx = 340 * (1 - k);
        lista.push({ x: s.x, y: s.y, f: () => dibujarCometa(c, s.x, s.y, dx, alto, k) });
      } else if (!baja()) {
        const k = (s.t - FIN.cielo) / 0.3;
        lista.push({ x: s.x, y: s.y, f: () => DIB.halo(c, s.x, s.y - 30, 120 + 180 * k, "#C8F2F4", 0.9 * (1 - k)) });
      }
    } else if (s.modo === "corona" && !s.estallo) {
      const k = s.t / FIN.corona,
        r = 150 * (1 - Math.pow(k, 1.6)),
        z = Math.min(1, k / 0.25) * 70 * (1 - Math.pow(k, 3)) + 50 * Math.pow(k, 3),
        giro = s.a0 + k * k * 14;
      for (let n = 0; n < 3; n++) {
        const a = giro + (n * Math.PI * 2) / 3,
          x = jug.x + Math.cos(a) * r,
          y = jug.y + Math.sin(a) * r * 0.7;
        lista.push({ x, y, f: () => dibujarPiedrita(c, x, y, z, k) });
      }
    }
  }
  function dibujarCometa(c, x, y, dx, alto, k) {
    // la sombra que crece en el piso donde va a caer
    DIB.E(c, x, y + 2, 20 + 40 * k, 7 + 13 * k, `rgba(17,17,17,${0.15 + 0.35 * k})`);
    const px = x + dx,
      py = y - alto - 20;
    // la estela rúnica: rombos que se achican hacia atrás
    for (let i = 6; i >= 1; i--) {
      const f = i / 6,
        ex = px + dx * 0.12 * i,
        ey = py - alto * 0.06 * i - 8 * i,
        r = 24 * (1 - f * 0.7);
      DIB.alfa(c, 0.7 * (1 - f), () => DIB.P(c, [ex, ey - r, ex + r * 0.7, ey, ex, ey + r, ex - r * 0.7, ey], i % 2 ? RUNICO : "#C8F2F4"));
    }
    if (!baja()) DIB.halo(c, px, py, 110, RUNICO, 0.8);
    ASSETS.dibujar(c, "piedraBerkano", px, py + 16, J.t, { s: 2.6, aire: true });
  }
  function dibujarPiedrita(c, x, y, z, k) {
    DIB.E(c, x, y + 2, 12, 4, "rgba(17,17,17,0.3)");
    if (!baja()) DIB.halo(c, x, y - z - 14, 46 + 40 * k, RUNICO, 0.5 + 0.4 * k);
    ASSETS.dibujar(c, "piedraBerkano", x, y - z, J.t, { s: 1.3, aire: true });
  }

  // ---------- la del HUD (MediEvil 2): una capa encima del juego, en píxeles de la página ----------
  let capa = null,
    cc = null,
    trozos = [],
    gotas = [],
    destello = 0;
  function armarCapa() {
    if (capa) return;
    capa = document.createElement("canvas");
    capa.className = "berkano-capa";
    capa.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:35;display:none";
    document.body.appendChild(capa);
    cc = capa.getContext("2d");
  }
  function empezarHud(s) {
    armarCapa();
    const k = Math.min(2, devicePixelRatio || 1);
    capa.width = innerWidth * k;
    capa.height = innerHeight * k;
    capa.style.display = "block";
    const el = document.getElementById("hPiedras"),
      r = el && el.children[s.i] ? el.children[s.i].getBoundingClientRect() : null;
    s.de = r && r.width ? [r.left + r.width / 2, r.top + r.height / 2] : [120, innerHeight - 70];
    s.a = [innerWidth / 2, innerHeight * 0.42];
    trozos = [];
    gotas = [];
    destello = 0;
  }
  const hudVivo = () => trozos.length || gotas.length || destello > 0;
  function posHud(s) {
    // vuela en curva hacia el centro y se agranda (se acerca); arriba tiembla y se raja
    const k = Math.min(1, s.t / 0.55),
      e = 1 - Math.pow(1 - k, 3),
      x = s.de[0] + (s.a[0] - s.de[0]) * e,
      y = s.de[1] + (s.a[1] - s.de[1]) * e - Math.sin(e * Math.PI) * innerHeight * 0.12,
      esc = 0.5 + 5.5 * Math.pow(e, 1.6),
      grieta = Math.max(0, (s.t - 0.55) / (FIN.hud - 0.55)),
      tiembla = grieta ? Math.sin(s.t * 80) * 4 * grieta : 0;
    return { x: x + tiembla, y, esc, grieta, rot: (1 - e) * -0.6 };
  }
  function piedraGrande(c, x, y, s, rot, grieta) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.scale(s, s);
    if (!baja()) DIB.halo(c, 0, 0, 60, RUNICO, 0.5 + 0.5 * grieta);
    ASSETS.dibujar(c, "piedraBerkano", 0, 14, J.t, { aire: true });
    if (grieta > 0) {
      c.strokeStyle = DIB.mezcla ? DIB.mezcla(RUNICO, "#F2ECEC", grieta) : "#C8F2F4";
      c.lineWidth = 1.6;
      c.lineCap = "round";
      [[-12, 8, -4, 0, -9, -8], [12, 6, 4, -2, 9, -10], [-2, -12, 3, -4, -1, 6]].forEach((l, n) => {
        if (grieta < n * 0.3) return;
        c.beginPath();
        c.moveTo(l[0], l[1]);
        for (let j = 2; j < l.length; j += 2) c.lineTo(l[j], l[j + 1]);
        c.stroke();
      });
    }
    c.restore();
  }
  function estallarHud(s) {
    const p = posHud(s),
      n = baja() ? 8 : 22;
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2,
        v = 400 + Math.random() * 900;
      trozos.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200, t: 0, dura: 0.6 + Math.random() * 0.4, s: (4 + Math.random() * 8) * (p.esc / 2.5), r: Math.random() * 6, vr: (Math.random() - 0.5) * 14, c: k % 3 ? "#77736C" : "#9A968E" });
    }
    const m = baja() ? 8 : 26;
    for (let k = 0; k < m; k++) gotas.push({ x: p.x + (Math.random() - 0.5) * 60 * p.esc, y: p.y + (Math.random() - 0.5) * 60 * p.esc, t: -Math.random() * 0.1, dura: LLEGA.hud * (0.7 + Math.random() * 0.3), cur: (Math.random() - 0.5) * 240, c: k % 3 ? RUNICO : "#C8F2F4", s: 4 + Math.random() * 5 });
    destello = 1;
    J.sacudir(0.5);
  }
  function pintarHud(dt) {
    const s = surge,
      k = capa.width / innerWidth;
    cc.setTransform(k, 0, 0, k, 0, 0);
    cc.clearRect(0, 0, innerWidth, innerHeight);
    if (destello > 0) {
      cc.fillStyle = `rgba(200,242,244,${0.35 * destello})`;
      cc.fillRect(0, 0, innerWidth, innerHeight);
      destello = Math.max(0, destello - dt / 0.18);
    }
    if (!s.estallo) {
      const p = posHud(s);
      // la estela de luz desde el rombo del HUD
      cc.globalAlpha = 0.5;
      for (let i = 1; i <= 4; i++) {
        const q = posHud({ t: Math.max(0, s.t - i * 0.03), de: s.de, a: s.a });
        DIB.P(cc, [q.x, q.y - 8 * q.esc, q.x + 6 * q.esc, q.y, q.x, q.y + 8 * q.esc, q.x - 6 * q.esc, q.y], RUNICO);
        cc.globalAlpha *= 0.6;
      }
      cc.globalAlpha = 1;
      piedraGrande(cc, p.x, p.y, p.esc, p.rot, p.grieta);
    }
    trozos = trozos.filter((q) => (q.t += dt) < q.dura);
    trozos.forEach((q) => {
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += 1400 * dt;
      q.r += q.vr * dt;
      cc.save();
      cc.globalAlpha = 1 - q.t / q.dura;
      cc.translate(q.x, q.y);
      cc.rotate(q.r);
      DIB.P(cc, [-q.s, -q.s * 0.4, 0, -q.s * 0.7, q.s * 0.8, 0, 0, q.s * 0.6], q.c);
      cc.restore();
    });
    // la vida baja en motas hasta Eromash (sigue su lugar en la pantalla aunque se mueva)
    const [hx, hy] = J.aPantalla(jug.x, jug.y - 50);
    gotas = gotas.filter((g) => (g.t += dt) < g.dura);
    gotas.forEach((g) => {
      if (g.t < 0) return;
      const e = g.t / g.dura,
        f = e * e,
        x = g.x + (hx - g.x) * f + Math.sin(e * Math.PI) * g.cur,
        y = g.y + (hy - g.y) * f,
        r = g.s * (1 - e * 0.5);
      DIB.P(cc, [x, y - r, x + r * 0.7, y, x, y + r, x - r * 0.7, y], g.c);
    });
  }

  // ---------- los manantiales ----------
  let lista = null; // [{ cosa, k }] de todos los manantiales del mundo (también los del editor)
  let piedras = null; // las piedras tiradas que se juntan
  const dia = () => Math.floor(((A.H.E.tiempo / LUZ.DIA) * 24 + 9 - 6) / 24); // cambia a las 6 de la mañana
  function estadoDe(m) {
    const d = dia();
    let e = st.man[m.k];
    if (!e) e = st.man[m.k] = { luz: 1, dia: d };
    if (e.dia !== d) (e.luz = 1), (e.dia = d);
    return e;
  }
  let bebiendo = false,
    secoAviso = 0,
    chispa = 0;
  function manantiales(dt) {
    let cerca = null;
    for (const m of lista) {
      const e = estadoDe(m);
      m.cosa.o.luz = e.luz;
      if (!J.dentro && !jug.muerto && Math.hypot(m.cosa.x - jug.x, m.cosa.y + 10 - jug.y) < 135) cerca = { m, e };
    }
    const falta = jug.hpMax - jug.hp > 0.5 || (st.p.length && !llenas());
    if (!cerca) return terminar(false);
    if (!st.vistos[cerca.m.k]) {
      st.vistos[cerca.m.k] = true;
      HUD.aviso(t("bk.descubierto"), "lugar", t("bk.descubierto_sub"));
    }
    if (!falta) return terminar(true);
    if (A.enPelea()) return terminar(false);
    if (cerca.e.luz <= 0.001) {
      if (J.t - secoAviso > 6) (secoAviso = J.t), A.avisar("bk.manantial_seco", "#9A968E");
      return terminar(false);
    }
    // el agua pasa a Eromash: primero la vida, después las piedras
    let da = Math.min(FLUJO * dt, cerca.e.luz * CAUDAL);
    const antes = da,
      aVida = Math.min(da, jug.hpMax - jug.hp);
    jug.hp += aVida;
    da = cargar(da - aVida);
    cerca.e.luz = Math.max(0, cerca.e.luz - (antes - da) / CAUDAL);
    bebiendo = true;
    if ((chispa -= dt) <= 0) {
      chispa = 0.1;
      const c = cerca.m.cosa;
      J.fx.push({ x: c.x + (Math.random() - 0.5) * 50, y: c.y - 30, vx: (jug.x - c.x) * 1.4, vy: (jug.y - 60 - c.y) * 1.4 - 80, t: 0.6, c: Math.random() < 0.5 ? RUNICO : "#C8F2F4", s: 3 + Math.random() * 2, g: 0.2 });
    }
  }
  function terminar(lleno) {
    if (!bebiendo) return;
    bebiendo = false;
    if (lleno) {
      HUD.aviso(t("bk.manantial_listo"), RUNICO, st.p.length ? t("bk.cargadas") + " " + cargadas() + "/" + st.p.length : "");
      if (window.VIDA) VIDA.evento("sanar", jug.x, jug.y);
      if (window.SONIDO) SONIDO.tono("sine", 523, 1046, 0.5, 0.05, { filtro: 2400 });
    }
  }

  // ---------- juntar una piedra ----------
  function tomar(q) {
    if (st.p.length >= MAX) return A.avisar("bk.llena_max", RUNICO);
    st.p.push(1);
    st.tomadas[q.k] = true;
    q.cosa.o.tomada = true;
    jug.interactuando = 0.4;
    nueva(q.cosa.x, q.cosa.y);
  }
  function nueva(x, y) {
    J.marcas.push({ tipo: "anillo", x, y, s: 1.2, col: RUNICO, t: 0 });
    if (window.VIDA) VIDA.evento("runa", x, y);
    if (window.SONIDO) SONIDO.tocar("runa", { vol: 0.5 });
    if (window.ANIMA) ANIMA.absorber({ col: RUNICO, col2: "#C8F2F4", forma: "rombo" });
    HUD.aviso(t("bk.nueva"), "lugar", t("bk.nueva_sub", [cura(), st.p.length, MAX]));
    if (A.H.guardar) A.H.guardar();
  }

  // ---------- el brebaje de Berkano (objeto de la barra de abajo) ----------
  let tomando = false;
  function tomarBrebaje() {
    if (tomando) return;
    if (!st.brebajes) return A.avisar("bk.brebaje_sin", "#C8402D");
    if (!st.p.length) return A.avisar("bk.brebaje_sinpiedra", "#C8402D");
    if (llenas()) return A.avisar("bk.brebaje_lleno", RUNICO);
    tomando = true;
    jug.interactuando = 1;
    J.marcas.push({ tipo: "anillo", x: jug.x, y: jug.y, s: 0.9, col: RUNICO, t: 0 });
    A.avisar("bk.brebaje_tomando", RUNICO);
    J.retrasar(1, () => {
      tomando = false;
      if (jug.sinGolpe < 0.95 || jug.muerto) return A.avisar("bk.brebaje_cortado", "#C8402D");
      st.brebajes--;
      let i = 0;
      st.p.forEach((p, k) => p < st.p[i] && (i = k));
      st.p[i] = 1;
      if (window.VIDA) VIDA.evento("sanar", jug.x, jug.y);
      if (window.SONIDO) SONIDO.tono("sine", 440, 880, 0.4, 0.05, { filtro: 2400 });
      HUD.aviso(t("bk.brebaje_listo"), RUNICO);
    });
  }

  // ---------- Thora y Ása ----------
  // la mesa de Thora (después de que te cura): prepara brebajes con hierbas y vende las dos piedras que guarda
  function thora() {
    const pj = PODERES.pj();
    if (st.p.length) {
      const antes = cargadas();
      cargarTodas();
      if (cargadas() > antes) A.avisar("bk.thora_cargo", RUNICO);
    }
    const precio = PRECIO_PIEDRA[st.compradas];
    A.menu(`<h2>${t("bk.thora_titulo")}</h2><div class="sub">${t("bk.thora_sub", [pj.hierbas || 0, pj.plata])}</div><p>${t("bk.thora_0")}</p>`, [
      {
        texto: t("bk.preparar"),
        sub: t("bk.preparar_sub", [BREBAJE_HIERBAS, BREBAJE_PLATA, st.brebajes, MAX_BREBAJES]),
        fn: () => {
          if (st.brebajes >= MAX_BREBAJES) return A.avisar("bk.preparar_lleno");
          if ((pj.hierbas || 0) < BREBAJE_HIERBAS || pj.plata < BREBAJE_PLATA) return A.avisar("bk.preparar_falta", "#C8402D");
          pj.hierbas -= BREBAJE_HIERBAS;
          pj.plata -= BREBAJE_PLATA;
          st.brebajes++;
          if (window.BARRA) BARRA.recibido("brebaje");
          HUD.aviso(t("bk.preparado"), RUNICO, st.brebajes + "/" + MAX_BREBAJES);
          thora();
        },
      },
      {
        texto: t("bk.comprar"),
        sub: precio ? t("bk.comprar_sub", [precio, PRECIO_PIEDRA.length - st.compradas]) : t("bk.comprar_no"),
        fn: () => {
          if (!precio) return A.avisar("bk.comprar_no");
          if (st.p.length >= MAX) return A.avisar("bk.llena_max", RUNICO);
          if (pj.plata < precio) return A.avisar("pj.forja_no");
          pj.plata -= precio;
          st.compradas++;
          st.p.push(1);
          A.cerrarMenu();
          nueva(jug.x, jug.y);
        },
      },
      { texto: t("ui.cerrar"), fn: A.cerrarMenu },
    ]);
  }
  // la línea de la forja de Ása: tallar Berkano más hondo para que cada piedra cure más
  function lineaForja(rebaja, volver) {
    const pj = PODERES.pj(),
      n = st.talla,
      lleno = n >= COSTO_TALLA.length,
      costo = lleno ? 0 : Math.round(COSTO_TALLA[n] * rebaja);
    const sub = !st.p.length ? t("bk.forja_sin") : lleno ? t("pj.forja_lleno") : t("bk.forja_cura", [CURA[n], CURA[n + 1]]) + " · " + t("pj.forja_costo", [costo]) + (pj.plata < costo ? " · " + t("pj.forja_falta") : "");
    return {
      texto: t("bk.forja", [n, COSTO_TALLA.length]),
      sub,
      fn: () => {
        if (!st.p.length) return A.avisar("bk.forja_sin");
        if (lleno || pj.plata < costo) return A.avisar("pj.forja_no");
        pj.plata -= costo;
        st.talla++;
        A.avisar("pj.forja_listo", "#FFD98A");
        volver();
      },
    };
  }

  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      lista = W.COSAS.filter((o) => o.id === "manantialRunico").map((cosa) => ({ cosa, k: clave(cosa) }));
      piedras = W.COSAS.filter((o) => o.id === "piedraBerkano").map((cosa) => ({ cosa, k: clave(cosa) }));
    },
    alEmpezar(extra) {
      extra.berkano = Object.assign({ p: [], talla: 0, brebajes: 0, compradas: 0, man: {}, tomadas: {}, vistos: {} }, extra.berkano || {});
      st = extra.berkano;
      piedras.forEach((q) => (q.cosa.o.tomada = !!st.tomadas[q.k]));
      bebiendo = tomando = false;
      surge = null;
      if (capa) capa.style.display = "none";
    },
    actualizar(dt) {
      if (!st || J.modo !== "juego") return;
      avanzarSurge(dt);
      manantiales(dt);
    },
    objetos: objetosSurge,
    luces(dar) {
      if (!surge || surge.estallo) return;
      if (surge.modo === "piso") dar({ x: surge.x, y: surge.y - 50, r: 160 + 120 * poseSurge(surge).luz, col: RUNICO, f: 0.8 });
      else if (surge.modo === "cielo") dar({ x: surge.x, y: surge.y, r: 120 + 260 * Math.pow(surge.t / FIN.cielo, 2), col: RUNICO, f: 0.8 });
      else if (surge.modo === "corona") dar({ x: jug.x, y: jug.y - 40, r: 160 + 160 * (surge.t / FIN.corona), col: RUNICO, f: 0.8 });
    },
    cercanos(dar) {
      if (!st || J.dentro) return;
      for (const q of piedras) {
        if (q.cosa.o.tomada) continue;
        const d = Math.hypot(q.cosa.x - jug.x, q.cosa.y - jug.y);
        if (d < 110) dar(d, t("bk.tomar_piedra"), () => tomar(q), q.cosa.x, q.cosa.y - 70);
      }
    },
    hud() {
      if (st) HUD.piedras(st.p, cura());
    },
    diario() {
      if (!st || !st.p.length) return "";
      return `<div class="diario-resumen"><p><b>${t("bk.piedras")}</b> ${t("bk.diario", [cargadas(), st.p.length, cura()])}${st.brebajes ? " · " + t("bk.diario_brebajes", [st.brebajes]) : ""}</p></div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return {
    salvar,
    modo: (m) => (m && MODOS.includes(m) ? (modo = m) : modo),
    MODOS,
    cargar,
    cargarTodas,
    tomarBrebaje,
    thora,
    lineaForja,
    MAX_BREBAJES,
    estado: () => st,
    brebajes: () => (st ? st.brebajes : 0),
    puedeBrebaje: () => !!st && st.brebajes > 0 && st.p.length > 0 && !llenas(),
    manantiales: () => (lista || []).map((m) => ({ x: m.cosa.x, y: m.cosa.y, luz: st ? estadoDe(m).luz : 1 })),
  };
})();
