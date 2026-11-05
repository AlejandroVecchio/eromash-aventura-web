// ---------- banda sonora (módulo BANDA) ----------
// Elige la música y los ambientes de ElevenLabs según dónde está Eromash y qué pasa (título, bosque de día y de noche,
// cada lugar con su tema, Eikholt, el Hongo Dorado, la herrería, las casas, las mazmorras de cada estilo, las islas,
// la pelea, los jefes, la Cacería, los minijuegos, la pausa) y los pide a SONIDO cada cuadro: SONIDO.musica cruza una
// pieza con la otra y SONIDO.bucle sube y baja cada ambiente solo. También suelta detalles del bosque de vez en cuando
// (una rama, una gota, la lechuza de noche) y los remates cortos (fin de la pelea, la derrota). No dibuja nada ni toca
// el juego: solo lee el estado de JUEGO y de los sistemas, así que puede faltar sin que nada se rompa.
window.BANDA = (function () {
  "use strict";
  const M = "musica/",
    AM = "ambiente/";
  // el tema de cada lugar del bosque (cuando Eromash está adentro de su radio)
  const LUGAR = {
    puesto: "puesto-lumbre",
    refugio: "refugio-piedra-cansada",
    paso: "paso-puente-roto",
    paso_sur: "paso-puente-roto",
    paso_norte: "paso-puente-roto",
    santuario: "santuario-raices-recuerdan",
    casa_lindes: "casa-lindes-tinta-y-lentes",
  };
  // el ambiente propio de un lugar, encima del bosque
  const AMB_LUGAR = { aserradero: "aserradero", santuario: "santuario", brunvik: "pueblo", skarnholt: "pueblo", puesto: "pueblo" };
  // los ambientes que maneja este módulo (los demás bucles son de cada sistema)
  const AMBIENTES = ["bosque-dia", "bosque-noche", "bosque-denso", "rio", "lluvia", "pueblo", "aserradero", "santuario", "eikholt-noche", "fuente-murmullo-eikholt", "fuente-mercado", "hongo-taberna", "fuente-herreria", "mar-islas", "mazmorra-cripta", "mazmorra-cueva", "mazmorra-mina", "mazmorra-hielo", "mazmorra-raices", "mazmorra-brasas"];
  let peleaAntes = false,
    peleaDura = 0,
    muertoAntes = false,
    lejosCamino = 0,
    cercaRio = 0,
    medirT = 0,
    detalleT = 12,
    turno = 0, // el bosque de día alterna dos temas
    turnoT = 0,
    antes = performance.now();

  const sis = (n) => window[n];
  const activo = (n) => sis(n) && typeof sis(n).activo === "function" && sis(n).activo();

  // qué suena ahora: { m: clave de música o null, vm: su volumen, a: { ambiente: volumen } }
  function elegir(G, dt) {
    const J = G.J,
      jug = G.A ? G.A.jug : null;
    const a = {};
    if (J.modo === "titulo" || !jug) return { m: M + "titulo", vm: 0.8, a };
    const amb = G.A.amb ? G.A.amb() : { n: 0 };
    const noche = (amb.n || 0) > 0.5;
    if (J.pausa && J.modo !== "menu") J.pausa = false; // la pausa se cerró por otro lado
    if (J.pausa) return { m: M + "pausa", vm: 0.7, a };
    if (jug.muerto) return { m: null, a };
    if (J.modo === "minij") return { m: M + "minijuego", vm: 0.7, a };
    if (J.modo === "forja") return { m: M + "forja-ritmo", vm: 0.8, a };
    // las peleas grandes
    const cac = sis("CACERIA") && CACERIA.caza && CACERIA.caza();
    if (cac) return { m: M + "caceria", vm: 0.9, a };
    const jt = sis("JOTUNN") && JOTUNN.jefe && JOTUNN.jefe();
    if (jt && J.jefeHud && jt.estado !== "duerme") return { m: M + "hrimnir", vm: 0.9, a };
    const duelo = sis("HOLMR") && HOLMR.duelo && HOLMR.duelo();
    if (duelo) return { m: M + "pelea", vm: 0.8, a };
    if (J.jefeHud || (G.ciervo && G.ciervo.activo)) return { m: M + "jefe", vm: 0.9, a };
    // adentro
    if (activo("HONGO")) {
      a["hongo-taberna"] = 0.55;
      return { m: M + (noche ? "hospederia-skald-balada" : "hospederia-skald"), vm: 0.55, a };
    }
    if (activo("HERRERIA")) {
      a["fuente-herreria"] = 0.6;
      return { m: M + "forja-ritmo", vm: 0.4, a };
    }
    if (sis("INTERIORES") && INTERIORES.adentro && INTERIORES.adentro()) return { m: M + "fogata-descanso", vm: 0.45, a };
    const pelea = G.A.enPelea ? G.A.enPelea() : false;
    if (activo("EIKHOLT")) {
      if (noche) a["eikholt-noche"] = 0.6;
      else {
        a["fuente-murmullo-eikholt"] = 0.5;
        a["fuente-mercado"] = 0.25;
      }
      return { m: pelea ? M + "combate-tension" : M + (noche ? "eikholt-noche" : "eikholt"), vm: 0.6, a };
    }
    // las zonas del generador: mazmorras de cada estilo y las islas
    const z = sis("ZONAS") && ZONAS.aqui && ZONAS.aqui();
    if (z && z.d) {
      if (z.d.tipo === "mazmorra") {
        a["mazmorra-" + (z.d.estilo || "cueva")] = 0.7;
        return { m: M + (pelea ? "pelea" : "mazmorra"), vm: 0.7, a };
      }
      a["mar-islas"] = 0.6;
      return { m: M + (pelea ? "pelea" : "islas"), vm: 0.65, a };
    }
    // el bosque
    const W = G.W;
    a[noche ? "bosque-noche" : "bosque-dia"] = 0.55;
    if ((medirT -= dt) <= 0) {
      medirT = 1;
      let dc = Infinity,
        dr = Infinity;
      for (const c of W.CAMINOS) dc = Math.min(dc, W.distLinea(jug.x, jug.y, c.p) - c.w / 2);
      for (const r of W.RIOS || []) dr = Math.min(dr, W.distLinea(jug.x, jug.y, r.p) - r.w / 2);
      lejosCamino = Math.max(0, Math.min(1, (dc - 500) / 900));
      cercaRio = Math.max(0, Math.min(1, 1 - dr / 900));
    }
    if (lejosCamino > 0) a["bosque-denso"] = 0.45 * lejosCamino;
    if (cercaRio > 0) a.rio = 0.6 * cercaRio;
    if (amb.lluvia > 0.05) a.lluvia = Math.min(0.75, amb.lluvia);
    let lugar = null;
    for (const k in W.LUGARES) {
      const L = W.LUGARES[k],
        d = Math.hypot(jug.x - L.p[0], jug.y - L.p[1]);
      if (d < L.r * 1.25) {
        lugar = k;
        if (AMB_LUGAR[k]) a[AMB_LUGAR[k]] = Math.max(a[AMB_LUGAR[k]] || 0, 0.5);
      }
    }
    if (pelea) return { m: M + "pelea", vm: 0.75, a };
    if (lugar && LUGAR[lugar]) return { m: M + LUGAR[lugar], vm: 0.6, a };
    if (noche) return { m: M + "eldervald-noche", vm: 0.5, a };
    // de día se alternan el tema de Eldervald y «bajo las copas», unos cuatro minutos cada uno
    if ((turnoT += dt) > 240) {
      turnoT = 0;
      turno = 1 - turno;
    }
    return { m: M + (turno ? "exploracion-bajo-las-copas" : "eldervald-dia"), vm: 0.5, a };
  }

  // un detalle suelto del bosque, de un lado o del otro
  function detalle(G, dt) {
    if ((detalleT -= dt) > 0) return;
    detalleT = 9 + Math.random() * 14;
    const jug = G.A.jug,
      n = G.A.amb ? G.A.amb().n : 0;
    const op = n > 0.5 ? ["detalle-lechuza", "detalle-rama", "detalle-gota"] : ["detalle-carpintero", "detalle-ciervo-lejano", "detalle-rama", "detalle-gota"];
    const k = AM + op[Math.floor(Math.random() * op.length)];
    const a = Math.random() * Math.PI * 2;
    SONIDO.detalle(k, { x: jug.x + Math.cos(a) * 700, y: jug.y + Math.sin(a) * 400, vol: 0.4 });
  }

  function cuadro(ahora) {
    requestAnimationFrame(cuadro);
    const dt = Math.min(0.1, (ahora - antes) / 1000);
    antes = ahora;
    const S = window.SONIDO,
      G = window.JUEGO;
    if (!S || !S.listo() || !G || !G.J) return;
    const e = elegir(G, dt);
    S.musica(e.m, { vol: e.vm });
    for (const k of AMBIENTES) S.bucle("banda_" + k, AM + k, e.a[k] || 0);
    const J = G.J,
      jug = G.A && G.A.jug;
    if (!jug || J.modo === "titulo") return;
    // afuera de la partida (casas, ciudad, título) el viento y la fogata del bosque se apagan: los pide juego.js solo afuera
    if (J.dentro) {
      S.bucle("viento", "viento", 0);
      S.bucle("fogata", "fogata", 0);
    }
    // los remates: fin de una pelea y la derrota
    const pelea = !J.dentro && G.A.enPelea && G.A.enPelea();
    peleaDura = pelea ? peleaDura + dt : peleaAntes ? peleaDura : 0;
    // solo después de una pelea de verdad (más de 6 s), no por un cuervo que pasó
    if (peleaAntes && !pelea && !jug.muerto && !J.jefeHud && peleaDura > 6) S.remate(M + "combate-fin", { vol: 0.7 });
    if (!muertoAntes && jug.muerto) S.remate(M + "derrota", { vol: 0.8 });
    peleaAntes = pelea;
    muertoAntes = jug.muerto;
    if (J.modo === "juego" && !J.dentro && !pelea && !(sis("ZONAS") && ZONAS.aqui && ZONAS.aqui())) detalle(G, dt);
  }
  requestAnimationFrame(cuadro);
  return { elegir: (dt) => window.JUEGO && elegir(window.JUEGO, dt || 0) };
})();
