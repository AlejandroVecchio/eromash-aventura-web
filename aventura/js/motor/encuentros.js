// ---------- encuentros en el camino (sistema ENCUENTROS) ----------
// Como los encuentros al azar del Skyrim y del Witcher: andando por los caminos de Eldervald (fuera de los pueblos y
// sin pelea), cada tanto aparece alguien más adelante, al costado del camino. Cinco encuentros con gente propia:
//   Brandr el buhonero   vende una pieza envuelta a mitad de precio (puede salir cualquier cosa)
//   Ragna, herida        pide un trago del frasco; si se lo das, paga y te cuenta dónde hay un cofre con candado
//   Hallvard, peregrino  señala el hörgr que todavía no encontraste más cercano (se destapa en el mapa)
//   Sigrun la escalda    canta la saga de Eromash: inspirado unos minutos (más daño y más experiencia)
//   Toki el carrero      grita por ayuda: lo rodean lobos; si caen, paga con plata y una pieza
// Un encuentro por vez; se va si Eromash se aleja mucho. Estado en E.extra.encuentros = { n, hechos: { tipo: n },
// inspirado }. Textos `ec.` (y los nombres en av.nombre_).
window.ENCUENTROS = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const TIPOS = ["buhonero", "herida", "peregrino", "escalda", "carrero"];
  const QUIEN = { buhonero: "brandr", herida: "ragna", peregrino: "hallvard", escalda: "sigrun", carrero: "toki" };
  const CADA = 2600, // unidades andadas por camino entre una tirada y otra (unos 85 m)
    CHANCE = 0.45,
    LEJOS = 2600, // a esta distancia el encuentro se va
    ENVUELTA = 45, // la pieza envuelta del buhonero
    INSPIRA = 240, // segundos inspirado
    RADIO = 130;
  const PUEBLOS = ["puesto", "refugio", "casa_lindes", "eikholt", "brunvik", "skarnholt", "aserradero", "entrada_sur"];
  const base = () => ({ n: 0, hechos: {}, inspirado: 0 });
  let st = base();
  let enc = null, // { tipo, x, y, mira, hecho, lobos }
    tirada = 0;

  Object.assign(GENTE.FICHAS, {
    // Brandr, buhonero: barba castaña, gorro de lana, capa parda y el atado a la espalda
    brandr: { nombre: "brandr", alto: 1, ancho: 1.12, piel: "#C8987A", pielSombra: "#A87A5E", pelo: "#6E4A32", barba: "#6E4A32", ropa: "#7A5634", ropaSombra: "#5E4228", capa: "#9A7650", capaSombra: "#7A5634", pantalon: "#3A3026", botas: "#2A2018", cinto: "#C8402D", gorro: true },
    // Ragna, viajera herida: sentada al borde del camino, trenza cobriza, ropa verde con una venda roja
    ragna: { nombre: "ragna", alto: 0.97, ancho: 0.95, piel: "#E0C8B4", pielSombra: "#C0A894", pelo: "#B4542A", ropa: "#4E5A3E", ropaSombra: "#3A4430", pantalon: "#3A3026", botas: "#2A2018", cinto: "#C8402D", falda: true, trenza: true, sentado: true },
    // Hallvard, peregrino: viejo, calvo, barba blanca larga, sayo gris y bastón alto
    hallvard: { nombre: "hallvard", alto: 1.02, ancho: 0.9, piel: "#D8B8A0", pielSombra: "#B8987E", pelo: "#E8E4DC", barba: "#E8E4DC", barbaCana: "#F2ECEC", ropa: "#8E8A86", ropaSombra: "#6E6A66", capa: "#6E6A66", capaSombra: "#56524E", pantalon: "#56524E", botas: "#2A2018", cinto: "#7A5634", calvo: true, lanza: true },
    // Sigrun, escalda: pelo rubio en trenza, ropa roja de fiesta y capa oscura
    sigrun: { nombre: "sigrun", alto: 1, ancho: 0.94, piel: "#E8D0BC", pielSombra: "#C8B09C", pelo: "#E8C878", ropa: "#9C2315", ropaSombra: "#7A1A10", capa: "#5E130D", capaSombra: "#46100A", pantalon: "#3A3026", botas: "#2A2018", cinto: "#FFD98A", falda: true, trenza: true },
    // Toki, carrero: gorro, barba negra, delantal de cuero
    toki: { nombre: "toki", alto: 1, ancho: 1.15, piel: "#C8987A", pielSombra: "#A87A5E", pelo: "#2A2420", barba: "#2A2420", ropa: "#5A5450", ropaSombra: "#46423E", delantal: "#7A5030", delantalSombra: "#5E3C22", pantalon: "#3A3026", botas: "#2A2018", cinto: "#3A2A1A", gorro: true },
  });

  const enPueblo = () => PUEBLOS.some((k) => W.LUGARES[k] && Math.hypot(jug.x - W.LUGARES[k].p[0], jug.y - W.LUGARES[k].p[1]) < W.LUGARES[k].r + 900);
  const hablar = (clave, fn) => A.dialogoLibre([[QUIEN[enc.tipo], clave]], fn);

  // ---------- aparecer ----------
  // un lugar libre al costado del camino, más adelante de hacia donde va Eromash
  function lugarAdelante() {
    const a0 = Math.atan2(jug.dir[1], jug.dir[0]);
    for (let k = 0; k < 24; k++) {
      const a = a0 + (k % 2 ? 1 : -1) * Math.floor(k / 2) * 0.18,
        d = 720 + (k % 3) * 60,
        x = jug.x + Math.cos(a) * d,
        y = jug.y + Math.sin(a) * d * 0.8;
      if (!W.libre(x, y, 40) || W.sueloEn(x, y) !== 0) continue;
      const cerca = W.CAMINOS.some((c) => W.distLinea(x, y, c.p) < c.w / 2 + 160),
        encima = W.CAMINOS.some((c) => W.distLinea(x, y, c.p) < c.w / 2 + 20);
      if (cerca && !encima) return [x, y];
    }
    return null;
  }
  function aparecer(tipo) {
    const p = lugarAdelante() || (tipo ? [jug.x + 300, jug.y] : null);
    if (!p) return null;
    tipo = tipo || TIPOS[st.n % TIPOS.length];
    st.n++;
    enc = { tipo, x: p[0], y: p[1], mira: { vista: "S", espejo: false }, hecho: false, lobos: null, apartados: [] };
    apartar();
    return enc;
  }
  // los árboles que lo taparían (sobre todo los de adelante) se apartan mientras está; al irse vuelven
  function apartar() {
    const x0 = enc.x,
      y0 = enc.y;
    W.cercanas(x0 - 240, y0 - 160, x0 + 240, y0 + 340, (o) => {
      if (!o.arbol || o.oculto) return;
      const dy = o.y - y0;
      if (Math.hypot(o.x - x0, dy > 0 ? dy * 0.7 : dy * 1.3) > 220) return;
      enc.apartados.push([o, o.choque]);
      o.oculto = true;
      o.choque = null;
    });
  }
  function irse() {
    if (enc) enc.apartados.forEach(([o, ch]) => ((o.oculto = false), (o.choque = ch)));
    if (enc && enc.lobos) enc.lobos.forEach((e) => {
      const i = A.enemigos.indexOf(e);
      if (i >= 0) A.enemigos.splice(i, 1);
    });
    enc = null;
  }
  function hecho() {
    enc.hecho = true;
    st.hechos[enc.tipo] = (st.hechos[enc.tipo] || 0) + 1;
  }

  // ---------- cada encuentro ----------
  function usar() {
    if (!enc || enc.hecho) return;
    const tp = enc.tipo;
    if (tp === "buhonero") {
      A.menu(`<h2>${t("av.nombre_brandr")}</h2><div class="sub">${t("ec.buhonero_sub")}</div>`, [
        { texto: t("ec.buhonero_comprar", [ENVUELTA]), sub: t("ec.buhonero_comprar_d"), fn: () => (comprarEnvuelta(), A.cerrarMenu()) },
        { texto: t("ui.cerrar"), fn: A.cerrarMenu },
      ]);
    } else if (tp === "herida") {
      const puede = window.FRASCO && FRASCO.estado().cargas > 0;
      A.menu(`<h2>${t("av.nombre_ragna")}</h2><div class="sub">${t("ec.herida_sub")}</div>`, [
        { texto: t("ec.herida_dar"), sub: puede ? t("ec.herida_dar_d") : t("ec.herida_sin"), fn: () => (puede ? (A.cerrarMenu(), ayudarHerida()) : HUD.aviso(t("ec.herida_sin"), "#C8402D")) },
        { texto: t("ec.dejar"), fn: A.cerrarMenu },
      ]);
    } else if (tp === "peregrino") hablar("ec.peregrino_1", () => (señalarHorgr(), hecho()));
    else if (tp === "escalda") hablar("ec.escalda_1", () => inspirar());
    else if (tp === "carrero" && !enc.lobos) emboscada();
  }
  function comprarEnvuelta() {
    const pj = PODERES.pj();
    if (pj.plata < ENVUELTA) return HUD.aviso(t("ec.sin_plata", [ENVUELTA]), "#C8402D"), false;
    pj.plata -= ENVUELTA;
    const it = OBJETOS.generar({ n: window.RPG ? RPG.nivel() : 1, min: 1, hallazgo: 1.6 });
    BOTIN.dar(it, { silencio: true });
    HUD.aviso(t("ec.buhonero_salio", [OBJETOS.nombre(it)]), OBJETOS.COL_TEXTO[it.r]);
    hecho();
    return true;
  }
  function ayudarHerida() {
    FRASCO.estado().cargas--;
    hecho();
    hablar("ec.herida_gracias", () => {
      PODERES.darPlata(30);
      if (window.RPG) RPG.dar(80, enc.x, enc.y);
      // el cofre con candado sin abrir más cercano: se destapa en el mapa
      const cs = window.CERRADURAS ? CERRADURAS.cofres().filter((c) => !CERRADURAS.estado().abiertos[c.i]) : [];
      cs.sort((a, b) => Math.hypot(a.cosa.x - jug.x, a.cosa.y - jug.y) - Math.hypot(b.cosa.x - jug.x, b.cosa.y - jug.y));
      if (cs[0] && window.MAPA) {
        MAPA.descubrir(cs[0].cosa.x, cs[0].cosa.y, 900);
        HUD.aviso(t("ec.herida_cofre"), "#FFD98A");
      }
    });
  }
  function señalarHorgr() {
    const h = window.SANTUARIOS ? SANTUARIOS.horgar() : {};
    const ids = Object.keys(h).filter((id) => !SANTUARIOS.estado().vistos[id]);
    ids.sort((a, b) => Math.hypot(h[a].x - jug.x, h[a].y - jug.y) - Math.hypot(h[b].x - jug.x, h[b].y - jug.y));
    const id = ids[0];
    if (!id) return HUD.aviso(t("ec.peregrino_todos"), "#E0B2B2");
    if (window.MAPA) MAPA.descubrir(h[id].x, h[id].y, 1200);
    HUD.aviso(t("ec.peregrino_senala", [t("sn.d_" + id)]), "#FFD98A");
    if (window.RPG) RPG.dar(40, enc.x, enc.y);
  }
  function inspirar() {
    st.inspirado = INSPIRA;
    hecho();
    RPG.recalcular();
    HUD.aviso(t("ec.inspirado_d"), "lugar", t("ec.inspirado"));
    if (window.SONIDO) SONIDO.tocar("runa", { vol: 0.5, tono: 1.3 });
    if (window.ANIMA) ANIMA.gesto("feliz");
  }
  function emboscada() {
    enc.lobos = [];
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + 0.5,
        x = enc.x + Math.cos(a) * 320,
        y = enc.y + Math.sin(a) * 240;
      const e = A.CB.crear("lobo", x, y, { pal: k % 3 });
      e.activo = true;
      e.estado = "persigue";
      e.encuentro = true;
      A.enemigos.push(e);
      enc.lobos.push(e);
    }
    hablar("ec.carrero_1");
    if (window.SONIDO) SONIDO.tocar("rugido", { vol: 0.5, tono: 1.1, x: enc.x, y: enc.y });
  }
  function premiarCarrero() {
    hecho();
    hablar("ec.carrero_gracias", () => {
      PODERES.darPlata(40);
      const it = OBJETOS.generar({ n: window.RPG ? RPG.nivel() : 1, min: 1, hallazgo: 1.4 });
      BOTIN.tirar(enc.x, enc.y - 20, it, true);
    });
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      if (window.RPG) RPG.aporte((s) => st.inspirado > 0 && ((s.dano *= 1.1), (s.xp *= 1.1)));
    },
    alEmpezar(extra) {
      extra.encuentros = Object.assign(base(), extra.encuentros || {});
      st = extra.encuentros;
      irse();
      tirada = 0;
    },
    actualizar(dt) {
      if (st.inspirado > 0 && J.modo === "juego" && (st.inspirado -= dt) <= 0) {
        st.inspirado = 0;
        RPG.recalcular();
        HUD.aviso(t("ec.inspirado_fin"), "#E0B2B2");
      }
      if (J.modo !== "juego" || J.dentro || jug.muerto) return;
      // andar por los caminos suma; cada tanto, una tirada
      if (!enc && jug.paso > 0 && jug.enCamino && !jug.pelea && !enPueblo()) {
        tirada += (jug.paso === 3 ? 295 : jug.paso === 2 ? 175 : 100) * dt;
        if (tirada >= CADA) {
          tirada = 0;
          if (Math.random() < CHANCE) aparecer();
        }
      }
      if (!enc) return;
      const d = Math.hypot(enc.x - jug.x, enc.y - jug.y);
      if (d > LEJOS) return irse();
      if (d < 500) enc.mira = VIKINGO.vista(jug.x - enc.x, jug.y - enc.y, enc.mira);
      // Toki grita por ayuda cuando Eromash se acerca
      if (enc.tipo === "carrero" && !enc.lobos && d < 420) emboscada();
      if (enc.lobos && !enc.hecho && enc.lobos.every((e) => e.muerto)) premiarCarrero();
    },
    cercanos(dar) {
      if (!enc || enc.hecho || J.dentro || (enc.tipo === "carrero" && enc.lobos)) return;
      const d = Math.hypot(enc.x - jug.x, enc.y - jug.y);
      if (d < RADIO) dar(d, t("ie.hablar", [t("av.nombre_" + QUIEN[enc.tipo])]), usar, enc.x, enc.y - 150);
    },
    objetos(lista, visible, c) {
      if (!enc || !visible(enc.x, enc.y)) return;
      // el carro de Toki, atrás de él
      if (enc.tipo === "carrero") lista.push({ x: enc.x + 110, y: enc.y - 30, f: () => ASSETS.dibujar(c, "carroCaravana", enc.x + 110, enc.y - 30, J.t, { sem: 3 }) });
      lista.push({ x: enc.x, y: enc.y, f: () => GENTE.dibujar(c, QUIEN[enc.tipo], enc.x, enc.y, J.t, { vista: enc.mira.vista, espejo: enc.mira.espejo }) });
    },
    sobreLuz(c) {
      // «!» dorado sobre quien espera algo de Eromash
      if (!enc || enc.hecho) return;
      const y = enc.y - 132;
      c.font = '900 26px "Eromash Text", system-ui, sans-serif';
      c.textAlign = "center";
      c.lineWidth = 4;
      c.strokeStyle = "#0A0707";
      c.strokeText("!", enc.x, y);
      c.fillStyle = "#FFD98A";
      c.fillText("!", enc.x, y);
    },
    cuerpos(f) {
      if (!enc) return;
      f(enc.x, enc.y, 24);
      if (enc.tipo === "carrero") f(enc.x + 110, enc.y - 30, 60);
    },
    efectosHud() {
      return st.inspirado > 0 ? [{ texto: t("ec.inspirado"), n: Math.ceil(st.inspirado / 60) + " min", col: "#FFD98A" }] : [];
    },
    diario() {
      const n = Object.values(st.hechos).reduce((a, b) => a + b, 0);
      return n ? `<div class="diario-resumen"><p><b>${t("ec.titulo")}</b> ${t("ec.diario", [n])}</p></div>` : "";
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, aparecer, irse, usar, actual: () => enc, comprarEnvuelta, ayudarHerida, TIPOS, QUIEN, CADA, ENVUELTA, INSPIRA };
})();
