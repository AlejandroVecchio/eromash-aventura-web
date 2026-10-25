// ---------- los secretos de Eldervald (sistema SECRETOS) ----------
// Lo que invita a salir del camino: cofres repartidos por el bosque (algunos enterrados, que solo ve la Lente o
// Sowilo, y otros sellados por una runa), piedras del susurro que cuentan la historia vieja, dan fragmentos de poder y
// sirven para viajar entre ellas, los cuatro altares de runa y los manzanos de Iðunn. Todo sale de una semilla fija:
// el bosque es el mismo en cada partida y lo abierto se guarda en la ranura.
window.SECRETOS = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const rnd = DIB.azar(9071024);
  const cofres = [], // { id, cosa, tipo, botin, sello: índice de piedra | "fuego", sitio }
    piedras = [], // { id, cosa, cerca (lugar), runas }
    altares = [], // { runa, cosa }
    braseros = [],
    manzanos = [];
  let st = null; // estado guardado

  // busca un lugar libre cerca de p (espiral), lejos de los caminos si se pide
  function libreCerca(p, r, lejosCamino) {
    for (let k = 0; k < 220; k++) {
      const a = k * 2.4,
        d = k * 26;
      const x = p[0] + Math.cos(a) * d,
        y = p[1] + Math.sin(a) * d * 0.8;
      if (!W.libre(x, y, r) || !W.libre(x - r, y, r) || !W.libre(x + r, y, r)) continue;
      if (lejosCamino && W.CAMINOS.some((c) => W.distLinea(x, y, c.p) < c.w / 2 + lejosCamino)) continue;
      return [x, y];
    }
    return null;
  }
  // un claro abierto en medio del bosque: saca los árboles de alrededor para que el lugar respire
  function abrirClaro(p, radio) {
    W.cercanas(p[0] - radio, p[1] - radio, p[0] + radio, p[1] + radio, (o) => {
      if (o.arbol && Math.hypot(o.x - p[0], (o.y - p[1]) * 1.2) < radio) {
        o.oculto = true;
        o.choque = null;
      }
    });
  }
  const mas = (p) => 1 + Math.hypot(p[0] - W.LUGARES.puesto.p[0], p[1] - W.LUGARES.puesto.p[1]) / 12000;
  function lugarCercano(p) {
    let mejor = "puesto",
      dm = Infinity;
    for (const k of ["puesto", "refugio", "eikholt", "casa_lindes", "paso", "claro", "aserradero", "santuario", "brunvik", "skarnholt", "tumulo", "caravana", "torre"]) {
      const d = Math.hypot(p[0] - W.LUGARES[k].p[0], p[1] - W.LUGARES[k].p[1]);
      if (d < dm) {
        dm = d;
        mejor = k;
      }
    }
    return mejor;
  }
  // qué trae cada cofre (se decide al armar el mundo, así no cambia al recargar)
  function botinDe(tipo, p, extra) {
    const k = mas(p);
    const b = { plata: 0, vida: 0, frag: 0, manzana: 0 };
    if (tipo === "arconLenador") {
      b.plata = Math.round((14 + rnd() * 24) * k);
      if (rnd() < 0.35) b.vida = 1;
      if (rnd() < 0.12) b.frag = 1;
    } else if (tipo === "arcaEnterrada") {
      b.plata = Math.round((36 + rnd() * 40) * k);
      if (rnd() < 0.5) b.frag = 1;
    } else if (tipo === "urnaTumulo") {
      b.plata = Math.round((60 + rnd() * 50) * k);
      b.frag = 1;
    } else {
      b.plata = Math.round((50 + rnd() * 60) * k);
      b.frag = 1;
    }
    return Object.assign(b, extra || {});
  }
  function cofre(tipo, p, o = {}, botinExtra, sello, sitio) {
    const cosa = W.agregar(tipo, p, Object.assign({ sem: rnd() * 10 }, o));
    const c = { id: cofres.length, cosa, tipo, botin: botinDe(tipo, p, botinExtra), sello, sitio };
    cofres.push(c);
    return c;
  }
  const RUNAS_PIEDRA = ["ansuz", "laguz", "othala", "eihwaz", "fehu", "uruz", "thurisaz", "raidho", "gebo", "wunjo", "hagalaz", "naudiz", "jera", "perthro", "tiwaz", "berkano", "ehwaz", "mannaz", "ingwaz", "dagaz"];
  function piedra(p) {
    const runas = [0, 1, 2, 3].map(() => RUNAS_PIEDRA[Math.floor(rnd() * RUNAS_PIEDRA.length)]);
    const cosa = W.agregar("piedraSusurro", p, { sem: rnd() * 10, runas, s: 1.1 });
    const pi = { id: piedras.length, cosa, cerca: lugarCercano(p), runas };
    piedras.push(pi);
    return pi;
  }

  // ---------- armar el mundo de secretos ----------
  function armar() {
    const L = W.LUGARES,
      M = W.M,
      mas2 = W.mas;
    // Skarnholt: el salón quemado, el altar de Kenaz y los tres braseros que sellan el cofre del jarl
    {
      const c = L.skarnholt.p;
      abrirClaro(c, 900);
      W.agregar("salonQuemado", mas2(c, 0, -2), { s: 1.3 });
      altares.push({ runa: "kenaz", cosa: W.agregar("altarRuna", mas2(c, 0, 4), { runa: "kenaz" }) });
      [[-9, 1], [9, 1], [0, -9]].forEach(([dx, dy]) => braseros.push({ cosa: W.agregar("brasero", mas2(c, dx, dy), {}) }));
      cofre("cofreRunico", mas2(c, 0, -5.5), { sellado: true }, { plata: 140, manzana: 1 }, "fuego", "skarnholt");
      W.agregar("totemCampamento", mas2(c, -6, 7), { tipo: "draugr" });
      piedra(mas2(c, 13, 6));
    }
    // El Túmulo: la boca del túmulo, el altar de Sowilo delante y dos urnas
    {
      const c = L.tumulo.p;
      abrirClaro(c, 800);
      W.agregar("tumuloEntrada", mas2(c, 0, -3), { vivo: true });
      altares.push({ runa: "sowilo", cosa: W.agregar("altarRuna", mas2(c, 0, 3.5), { runa: "sowilo" }) });
      cofre("urnaTumulo", mas2(c, -6, -1.6), {}, null, null, "tumulo");
      cofre("urnaTumulo", mas2(c, 6, -1.4), {}, null, null, "tumulo");
      piedra(mas2(c, 10, 7));
    }
    // La Torre del Cuervo: el altar de Algiz al pie y un cofre sellado por la piedra de la loma
    {
      const c = L.torre.p;
      abrirClaro(c, 900);
      W.agregar("torreCuervo", mas2(c, 0, -2), {});
      altares.push({ runa: "algiz", cosa: W.agregar("altarRuna", mas2(c, -5, 4), { runa: "algiz" }) });
      const pi = piedra(mas2(c, 12, 2));
      cofre("cofreRunico", mas2(c, 5, 4), { sellado: true }, { plata: 120, manzana: 1 }, pi.id, "torre");
      W.agregar("totemCampamento", mas2(c, -9, 2), { tipo: "cuervo" });
    }
    // La laguna helada: el altar de Isa en la orilla norte de la laguna del oeste
    {
      const lago = W.LAGOS[1];
      const p = libreCerca([lago.p[0], lago.p[1] - lago.ry - 120], 50) || lago.p;
      abrirClaro(p, 500);
      altares.push({ runa: "isa", cosa: W.agregar("altarRuna", p, { runa: "isa" }) });
      W.agregar("totemCampamento", mas2(p, 5, 2), { tipo: "fatuo" });
      cofre("arcaEnterrada", libreCerca(mas2(p, -6, 3), 30) || p, { oculto: true }, null, null, "isa");
    }
    // La caravana perdida: dos carros, el botín de los mercaderes y su guardián
    {
      const c = L.caravana.p;
      abrirClaro(c, 600);
      W.agregar("carroCaravana", mas2(c, -3, 0), { v: 0 });
      W.agregar("carroCaravana", mas2(c, 5, 3), { v: 1, s: 0.9 });
      cofre("arconLenador", mas2(c, 1, -4), { s: 1.2 }, { plata: 90, frag: 1 }, null, "caravana");
      W.agregar("totemCampamento", mas2(c, -7, -3), { tipo: "trol" });
    }
    // los manzanos de Iðunn, escondidos en tres rincones del bosque
    [[960, 880], [600, 300], [1350, 480]].forEach((mp) => {
      const p = libreCerca(W.m(mp[0], mp[1]), 40, 300);
      if (!p) return;
      abrirClaro(p, 260);
      manzanos.push({ id: manzanos.length, cosa: W.agregar("manzanoIdunn", p, { s: 1.1 }) });
    });
    // piedras del susurro repartidas, lejos unas de otras
    const usadas = piedras.map((pi) => [pi.cosa.x, pi.cosa.y]);
    let intentos = 0;
    while (piedras.length < 20 && intentos++ < 600) {
      const p = [W.BORDE * 1.3 + rnd() * (W.ANCHO - W.BORDE * 2.6), W.BORDE + rnd() * (W.ALTO - W.BORDE * 2.2)];
      if (usadas.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 3600)) continue;
      if (Math.hypot(p[0] - W.CIUDAD.c[0], (p[1] - W.CIUDAD.c[1]) * 1.3) < W.CIUDAD.rx + 600) continue;
      const q = libreCerca(p, 40);
      if (!q) continue;
      abrirClaro(q, 220);
      piedra(q);
      usadas.push(q);
    }
    // cofres sueltos por el bosque (fuera de los caminos)
    const sueltos = [];
    intentos = 0;
    while (sueltos.length < 38 && intentos++ < 1500) {
      const p = [W.BORDE * 1.3 + rnd() * (W.ANCHO - W.BORDE * 2.6), W.BORDE + rnd() * (W.ALTO - W.BORDE * 2.2)];
      if (sueltos.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1500)) continue;
      if (Math.hypot(p[0] - W.CIUDAD.c[0], (p[1] - W.CIUDAD.c[1]) * 1.3) < W.CIUDAD.rx + 300) continue;
      const q = libreCerca(p, 36, 260);
      if (!q) continue;
      const k = rnd();
      if (k < 0.55) cofre("arconLenador", q);
      else if (k < 0.82) cofre("arcaEnterrada", q, { oculto: true });
      else {
        // sellado: lo suelta la piedra del susurro más cercana
        let pc = null,
          dm = Infinity;
        piedras.forEach((pi) => {
          const d = Math.hypot(pi.cosa.x - q[0], pi.cosa.y - q[1]);
          if (d < dm) {
            dm = d;
            pc = pi;
          }
        });
        if (pc && dm < 4500) cofre("cofreRunico", q, { sellado: true }, null, pc.id);
        else cofre("arconLenador", q);
      }
      sueltos.push(q);
    }
  }

  // ---------- aplicar lo guardado ----------
  function aplicar() {
    cofres.forEach((c) => {
      const abierto = !!st.cofres[c.id];
      c.cosa.o.abierto = abierto;
      if (c.tipo === "arcaEnterrada") c.cosa.o.oculto = !abierto && !st.vistos[c.id];
      if (c.tipo === "cofreRunico") c.cosa.o.sellado = !abierto && !selloRoto(c);
    });
    piedras.forEach((p) => (p.cosa.o.viva = !!st.piedras[p.id]));
    altares.forEach((a) => (a.cosa.o.tomada = PODERES.tiene(a.runa)));
    braseros.forEach((b, i) => (b.cosa.o.encendido = !!st.braseros[i]));
    manzanos.forEach((m) => (m.cosa.o.cosechado = !!st.manzanos[m.id]));
  }
  const selloRoto = (c) => (c.sello === "fuego" ? braseros.every((b, i) => st.braseros[i]) : c.sello == null || !!st.piedras[c.sello]);

  // ---------- acciones ----------
  // los cofres que cierran con la cerradura de anillos (MINIJ): las arcas enterradas contra el tiempo, los cofres
  // rúnicos con anillos ligados y uno de cada cuatro arcones del leñador con tres anillos
  function cerrojo(c) {
    if (!window.MINIJ) return null;
    if (c.tipo === "arcaEnterrada") return "reloj";
    if (c.tipo === "cofreRunico") return "ligados";
    if (c.tipo === "arconLenador" && c.id % 4 === 1) return "base";
    return null;
  }
  function abrir(c, abierta) {
    if (c.cosa.o.sellado) return sellado(c);
    const v = !abierta && cerrojo(c);
    if (v) return MINIJ.empezar("anillos", { variante: v, quien: t("mn.cerrado"), x: c.cosa.x, y: c.cosa.y, fin: (r) => r.gano && abrir(c, true) });
    jug.interactuando = 0.3;
    J.retrasar(0.18, () => {
      st.cofres[c.id] = true;
      c.cosa.o.abierto = true;
      const x = c.cosa.x,
        y = c.cosa.y + 10,
        total = cofres.filter((q) => st.cofres[q.id]).length;
      PODERES.botinCofre(x, y, t("as." + c.tipo) + " " + t("sx.cofre_n", [total, cofres.length]), c.botin, c.tipo !== "arconLenador");
      // uno de cada tres arcones guarda un mapa del tesoro: marca la zona de un arca enterrada que falta encontrar
      if (c.tipo === "arconLenador" && c.id % 3 === 0) J.retrasar(0.9, () => mapaTesoro(x, y));
    });
  }
  // un cofre sellado se sacude y la luz violeta corre hasta lo que lo suelta (su piedra o los braseros apagados)
  function sellado(c) {
    sacudir(c.cosa);
    if (window.ANIMA) ANIMA.gesto("duda");
    if (window.SONIDO) SONIDO.tocar("clic", { vol: 0.6, tono: 0.7 });
    const desde = [c.cosa.x, c.cosa.y];
    if (c.sello === "fuego")
      braseros.forEach((b, i) => !st.braseros[i] && A.ondaPor([desde, [b.cosa.x, b.cosa.y]], 0.9));
    else if (c.sello != null && piedras[c.sello]) {
      const p = piedras[c.sello].cosa;
      A.ondaPor([desde, [p.x, p.y]], 1.1);
      if (window.MAPA) MAPA.descubrir(p.x, p.y, 700);
    }
    A.avisar(c.sello === "fuego" ? "sx.sellado_fuego" : "sx.sellado_piedra", "#9A6BD8");
  }
  // sacudón corto de un objeto (cofre cerrado): se mueve unos píxeles y vuelve a su lugar
  const sacudidos = [];
  function sacudir(cosa) {
    if (!sacudidos.some((q) => q.cosa === cosa)) sacudidos.push({ cosa, x: cosa.x, t: 0 });
  }
  function mapaTesoro(x, y) {
    let mejor = null,
      dm = Infinity;
    cofres.forEach((q) => {
      if (q.tipo !== "arcaEnterrada" || st.cofres[q.id] || st.vistos[q.id] || st.pistas[q.id]) return;
      const d = Math.hypot(q.cosa.x - x, q.cosa.y - y);
      if (d < dm) (dm = d), (mejor = q);
    });
    if (!mejor) return;
    st.pistas[mejor.id] = true;
    if (window.SONIDO) SONIDO.tocar("pagina", { vol: 0.8 });
    HUD.aviso(t("ex.mapa_tesoro_sub", [Math.round(dm / W.M)]), "lugar", t("ex.mapa_tesoro"));
  }
  // las zonas de los mapas del tesoro que siguen sin cavar: el centro corrido un poco para no regalar el lugar exacto
  const RADIO_PISTA = 520;
  function pistas() {
    if (!st) return [];
    return cofres
      .filter((q) => st.pistas[q.id] && !st.cofres[q.id] && q.cosa.o.oculto)
      .map((q) => ({ x: q.cosa.x + (((q.id * 137) % 400) - 200), y: q.cosa.y + (((q.id * 71) % 300) - 150), r: RADIO_PISTA, id: q.id }));
  }
  function despertar(p) {
    jug.interactuando = 0.7;
    st.piedras[p.id] = true;
    p.cosa.o.viva = true;
    A.ondaPor([[jug.x, jug.y], [p.cosa.x, p.cosa.y]], 1.4);
    // la piedra despierta levanta la niebla de alrededor en el mapa
    if (window.MAPA) MAPA.descubrir(p.cosa.x, p.cosa.y, 2400);
    if (window.VIDA) VIDA.evento("piedra", p.cosa.x, p.cosa.y - 60);
    const n = Object.keys(st.piedras).length;
    // el pedazo de historia que guarda cada piedra
    A.dialogoLibre([["piedra", "sx.susurro_" + (p.id % 20)]], () => {
      PODERES.darFragmento();
      HUD.aviso(t("sx.piedra_viva", [n, piedras.length]), "#73D5DB");
      // los cofres que esta piedra tenía sellados: la luz corre hasta ellos
      cofres.forEach((c) => {
        if (c.sello === p.id && c.cosa.o.sellado) {
          c.cosa.o.sellado = false;
          A.ondaPor([[p.cosa.x, p.cosa.y], [c.cosa.x, c.cosa.y]], 1);
          HUD.aviso(t("sx.sello_suelto"), "#73D5DB");
        }
      });
    });
  }
  // viajar por la red de piedras despiertas: siempre a Eikholt y al Puesto de Eydis, a los pueblos y refugios ya
  // descubiertos y a donde estabas antes del último viaje (por un rato). Se ordena por distancia y lo más cerca de la
  // marca del mapa va primero. Desde el mapa (sin piedra) hace falta no estar peleando y concentrarse un instante.
  const PUEBLOS = ["refugio", "casa_lindes", "aserradero", "brunvik", "skarnholt", "santuario", "caravana"];
  let antesDelViaje = null; // { p, t }
  function destinos(desde) {
    const dest = [];
    dest.push({ texto: t("av.lugar_eikholt"), p: [W.CIUDAD.c[0], W.CIUDAD.c[1] + W.CIUDAD.ry + 220], lugar: "eikholt" });
    dest.push({ texto: t("av.lugar_puesto"), p: A.P.puesto, lugar: "puesto" });
    PUEBLOS.forEach((k) => {
      const L = W.LUGARES[k];
      if (!L || !A.H.E.vistos.includes(k)) return;
      const q = libreCerca([L.p[0], L.p[1] + 80], 22);
      if (q) dest.push({ texto: t("av.lugar_" + k), p: q, lugar: k });
    });
    piedras.forEach((p) => {
      if (p === desde || !st.piedras[p.id]) return;
      dest.push({ texto: t("sx.piedra_de", [t("av.lugar_" + p.cerca)]), p: [p.cosa.x, p.cosa.y + 70], lugar: p.cerca });
    });
    // otros sistemas suman destinos: destinoViaje() → { texto, p, lugar } | null (la casa propia)
    window.SISTEMAS.forEach((s0) => {
      const d = s0.destinoViaje && s0.destinoViaje();
      if (d) dest.push(d);
    });
    dest.forEach((d) => (d.d = Math.hypot(d.p[0] - jug.x, d.p[1] - jug.y)));
    // lo que queda a un paso no vale la pena
    const lejos = dest.filter((d) => d.d > 25 * W.M);
    lejos.sort((a, b) => a.d - b.d);
    const mk = window.MAPA && MAPA.marca();
    if (mk) {
      let mejor = null;
      lejos.forEach((d) => (!mejor || Math.hypot(d.p[0] - mk[0], d.p[1] - mk[1]) < Math.hypot(mejor.p[0] - mk[0], mejor.p[1] - mk[1])) && (mejor = d));
      if (mejor) {
        lejos.splice(lejos.indexOf(mejor), 1);
        lejos.unshift(Object.assign(mejor, { marca: true }));
      }
    }
    if (antesDelViaje && J.t - antesDelViaje.t < 300 && Math.hypot(antesDelViaje.p[0] - jug.x, antesDelViaje.p[1] - jug.y) > 25 * W.M)
      lejos.unshift({ texto: t("sx.viaje_volver"), p: antesDelViaje.p, d: Math.hypot(antesDelViaje.p[0] - jug.x, antesDelViaje.p[1] - jug.y), volver: true });
    return lejos;
  }
  function viajar(desde, desdeMapa) {
    if (desdeMapa && A.enPelea()) return A.avisar("sx.viaje_pelea", "#C8402D");
    const botones = destinos(desde).map((d) => ({ texto: (d.marca ? "◆ " : "") + d.texto, sub: d.marca ? t("sx.viaje_marca", [Math.round(d.d / W.M)]) : t("sx.metros", [Math.round(d.d / W.M)]), fn: () => {
      A.cerrarMenu();
      const ir = () => {
        if (!d.volver) antesDelViaje = { p: [jug.x, jug.y], t: J.t };
        else antesDelViaje = null;
        A.teletransportar(d.p[0], d.p[1], d.lugar);
      };
      if (!desdeMapa) return ir();
      // desde el mapa: un instante quieto mientras la runa junta luz; un golpe lo corta
      jug.interactuando = 1.4;
      J.marcas.push({ tipo: "anillo", x: jug.x, y: jug.y, s: 1.4, col: "#73D5DB", t: 0 });
      HUD.aviso(t("sx.viaje_juntando"), "#73D5DB");
      J.retrasar(1.4, () => (jug.sinGolpe < 1.35 || jug.muerto ? A.avisar("sx.viaje_cortado", "#C8402D") : ir()));
    } }));
    if (botones.length === 0) return A.avisar("sx.viaje_nada", "#73D5DB");
    botones.push({ texto: t("ui.cerrar"), fn: A.cerrarMenu });
    A.menu(`<h2>${t("sx.viaje_titulo")}</h2><div class="sub">${t(desdeMapa ? "sx.viaje_sub_mapa" : "sx.viaje_sub")}</div>`, botones);
  }
  function revelar(x, y, radio) {
    let algo = false;
    cofres.forEach((c) => {
      if (c.tipo !== "arcaEnterrada" || !c.cosa.o.oculto) return;
      if (Math.hypot(c.cosa.x - x, c.cosa.y - y) > radio) return;
      c.cosa.o.oculto = false;
      st.vistos[c.id] = true;
      J.marcas.push({ tipo: "anillo", x: c.cosa.x, y: c.cosa.y, s: 1.2, col: "#FFD98A", t: 0 });
      algo = true;
    });
    if (algo) setTimeout(() => A.avisar("sx.algo_brilla", "#FFD98A"), 450);
    return algo;
  }

  const sistema = {
    actualizar(dt) {
      for (let i = sacudidos.length - 1; i >= 0; i--) {
        const q = sacudidos[i];
        q.t += dt;
        q.cosa.x = q.x + Math.sin(q.t * 70) * 3 * Math.max(0, 1 - q.t / 0.35);
        if (q.t > 0.35) {
          q.cosa.x = q.x;
          sacudidos.splice(i, 1);
        }
      }
    },
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      armar();
      st = { cofres: {}, piedras: {}, braseros: {}, manzanos: {}, vistos: {}, pistas: {} };
      aplicar();
    },
    alEmpezar(extra) {
      extra.sec = Object.assign({ cofres: {}, piedras: {}, braseros: {}, manzanos: {}, vistos: {}, pistas: {} }, extra.sec || {});
      st = extra.sec;
      aplicar();
    },
    cercanos(dar) {
      for (const c of cofres) {
        if (st.cofres[c.id] || c.cosa.o.oculto) continue;
        const d = Math.hypot(c.cosa.x - jug.x, c.cosa.y + 10 - jug.y);
        if (d < 100) dar(d, t(c.cosa.o.sellado ? "sx.accion_sellado" : c.tipo === "urnaTumulo" ? "sx.accion_urna" : "sx.accion_cofre"), () => abrir(c));
      }
      for (const p of piedras) {
        const d = Math.hypot(p.cosa.x - jug.x, p.cosa.y + 30 - jug.y);
        if (d < 120) dar(d, t(st.piedras[p.id] ? "sx.accion_viajar" : "sx.accion_piedra"), () => (st.piedras[p.id] ? viajar(p) : despertar(p)));
      }
      for (const a of altares) {
        if (PODERES.tiene(a.runa)) continue;
        const d = Math.hypot(a.cosa.x - jug.x, a.cosa.y + 30 - jug.y);
        if (d < 130) dar(d, t("sx.accion_altar", [t("pj.runa_" + a.runa)]), () => {
          jug.interactuando = 0.8;
          a.cosa.o.tomada = true;
          A.ondaPor([[a.cosa.x, a.cosa.y], [jug.x, jug.y]], 0.8);
          J.sacudir(0.25);
          PODERES.darRuna(a.runa);
        });
      }
      for (const b of braseros) {
        if (b.cosa.o.encendido) continue;
        const d = Math.hypot(b.cosa.x - jug.x, b.cosa.y + 20 - jug.y);
        if (d < 90) dar(d, t("sx.accion_brasero"), () => A.avisar(PODERES.tiene("kenaz") ? "sx.brasero_kenaz" : "sx.brasero_frio"));
      }
      for (const m of manzanos) {
        if (st.manzanos[m.id]) continue;
        const d = Math.hypot(m.cosa.x - jug.x, m.cosa.y + 20 - jug.y);
        if (d < 110) dar(d, t("sx.accion_manzana"), () => {
          jug.interactuando = 0.5;
          st.manzanos[m.id] = true;
          m.cosa.o.cosechado = true;
          PODERES.darManzana();
        });
      }
    },
    lente(x, y) {
      return revelar(x, y, 760);
    },
    alRuna(r, zona) {
      if (r === "sowilo") revelar(zona.x, zona.y, 1000);
      if (r === "kenaz")
        braseros.forEach((b, i) => {
          if (st.braseros[i] || Math.hypot(b.cosa.x - zona.x, b.cosa.y - zona.y) > zona.radio + 40) return;
          let d = Math.atan2((b.cosa.y - zona.y) * 1.25, b.cosa.x - zona.x) - zona.dir;
          d = Math.atan2(Math.sin(d), Math.cos(d));
          if (Math.abs(d) > zona.ang + 0.3) return;
          st.braseros[i] = true;
          b.cosa.o.encendido = true;
          const n = braseros.filter((q, k) => st.braseros[k]).length;
          HUD.aviso(t("sx.brasero_encendido", [n, braseros.length]), "#FF8D71");
          if (n === braseros.length)
            cofres.forEach((c) => {
              if (c.sello === "fuego" && c.cosa.o.sellado) {
                c.cosa.o.sellado = false;
                braseros.forEach((q) => A.ondaPor([[q.cosa.x, q.cosa.y], [c.cosa.x, c.cosa.y]], 0.8));
                J.retrasar(0.8, () => HUD.aviso(t("sx.sello_fuego_suelto"), "#FF8D71"));
              }
            });
        });
    },
    luces(dar, x0, y0, x1, y1) {
      const dentro = (o, m) => o.x > x0 - m && o.x < x1 + m && o.y > y0 - m && o.y < y1 + m;
      piedras.forEach((p) => dentro(p.cosa, 600) && dar({ x: p.cosa.x, y: p.cosa.y - 60, r: st.piedras[p.id] ? 420 : 150, col: "#73D5DB", f: st.piedras[p.id] ? 0.95 : 0.55 + Math.sin(J.t * 1.1 + p.id) * 0.2 }));
      altares.forEach((a) => dentro(a.cosa, 600) && !a.cosa.o.tomada && dar({ x: a.cosa.x, y: a.cosa.y - 60, r: 460, col: ASSETS.COL_RUNA[a.runa], f: 0.95 }));
      braseros.forEach((b) => dentro(b.cosa, 600) && b.cosa.o.encendido && dar({ x: b.cosa.x, y: b.cosa.y - 50, r: 420, col: "#FF8D71", f: 0.9 + Math.sin(J.t * 9 + b.cosa.x) * 0.08 }));
      cofres.forEach((c) => {
        if (!dentro(c.cosa, 300) || st.cofres[c.id] || c.cosa.o.oculto) return;
        if (c.tipo === "cofreRunico") dar({ x: c.cosa.x, y: c.cosa.y - 30, r: 200, col: c.cosa.o.sellado ? "#9A6BD8" : "#73D5DB", f: 0.8 });
        else if (c.tipo === "arcaEnterrada") dar({ x: c.cosa.x, y: c.cosa.y - 20, r: 160, col: "#FFD98A", f: 0.7 });
        else dar({ x: c.cosa.x, y: c.cosa.y - 20, r: 110, col: "#FFD98A", f: 0.45 + Math.sin(J.t * 2 + c.id) * 0.15 });
      });
      manzanos.forEach((m) => dentro(m.cosa, 400) && dar({ x: m.cosa.x, y: m.cosa.y - 80, r: 300, col: "#FFD98A", f: m.cosa.o.cosechado ? 0.3 : 0.8 }));
    },
    objetos(lista, visible, c) {
      // un destello dorado sobre los cofres cerrados que se ven, para que llamen la atención desde lejos
      cofres.forEach((q) => {
        if (st.cofres[q.id] || q.cosa.o.oculto || !visible(q.cosa.x, q.cosa.y)) return;
        const g = Math.max(0, Math.sin(J.t * 2.2 + q.id * 1.7)) ** 6;
        if (g < 0.05) return;
        lista.push({ x: q.cosa.x, pie: q.cosa.y, y: q.cosa.y + 1, f: () => DIB.alfa(c, g, () => {
          const x = q.cosa.x + 14,
            y = q.cosa.y - 52;
          DIB.P(c, [x, y - 10, x + 3, y - 3, x + 10, y, x + 3, y + 3, x, y + 10, x - 3, y + 3, x - 10, y, x - 3, y - 3], "#FFF4D0");
        }) });
      });
    },
    // la segunda entrada del rastreador: lo que falta encontrar en el bosque
    seguimiento() {
      const n = (o) => Object.keys(o).filter((k) => o[k]).length;
      const runas = altares.filter((a) => PODERES.tiene(a.runa)).length;
      const o = (clave, a, b) => ({ texto: t(clave, [a, b]), estado: a >= b ? "hecho" : "actual" });
      return {
        secundaria: true,
        rotulo: t("sx.seg_rotulo"),
        nombre: t("sx.seg_nombre"),
        objetivos: [o("sx.seg_runas", runas, altares.length), o("sx.seg_piedras", n(st.piedras), piedras.length), o("sx.seg_cofres", n(st.cofres), cofres.length)],
      };
    },
    diario() {
      if (!st) return "";
      const n = (o) => Object.keys(o).filter((k) => o[k]).length;
      return `<div class="diario-resumen"><p><b>${t("sx.diario_titulo")}</b> ${t("sx.diario_txt", [n(st.cofres), cofres.length, n(st.piedras), piedras.length, n(st.manzanos), manzanos.length])}</p></div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return {
    lista: () => ({ cofres, piedras, altares, manzanos, st }),
    abrir,
    cerrojo,
    viajar: () => viajar(null, true),
    pistas,
    sacudir,
  };
})();
