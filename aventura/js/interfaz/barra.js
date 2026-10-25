// ---------- la barra de abajo (sistema BARRA) ----------
// Seis casillas que llena el jugador con lo que tiene: habilidades (las runas), objetos (las hierbas de Thora),
// herramientas (la Lente del Eco, viajar con las runas) y conocimientos (el Saber del bosque). Atacar, esquivar,
// saltar o correr no van acá: son lo básico. 1 a 6 usan cada casilla, Q (R1) usa la elegida y T (R3) elige la
// siguiente; también se tocan con el mouse. Lo nuevo va solo a la primera casilla libre; en la mochila (pestaña
// Barra) se acomoda. Estado en E.extra.barra: { r: [id | null × 6], sel, vistos }.
window.BARRA = (function () {
  "use strict";
  let A, J, jug;
  const t = (k, v) => I18N.t(k, v);
  const LARGO = 6;
  let st = null;
  const esperas = {}; // id → segundos que faltan (los conocimientos tardan en volver)

  // ---------- lo que puede ir en una casilla ----------
  // cada cosa: tipo, cómo se dibuja (icono o runa), si Eromash la tiene, si está lista, cuánto le falta, cuántas
  // hay y qué hace
  const pe = () => PODERES.estado();
  const runa = (r) => ({
    tipo: "habilidad",
    runa: r,
    col: () => PODERES.RUNAS[r].col,
    nombre: () => t("pj.runa_" + r),
    desc: () => t("bar.runa_d", [t("pj.runa_" + r + "_toma"), PODERES.RUNAS[r].coste]),
    tiene: () => PODERES.tiene(r),
    listo: () => pe().energia >= PODERES.RUNAS[r].coste,
    energia: () => Math.min(1, pe().energia / PODERES.RUNAS[r].coste),
    usar: () => PODERES.lanzar(r),
  });
  const COSAS = {
    runa_kenaz: runa("kenaz"),
    runa_isa: runa("isa"),
    runa_algiz: runa("algiz"),
    runa_sowilo: runa("sowilo"),
    hierbas: {
      tipo: "objeto",
      icono: "hierbas",
      nombre: () => t("bar.hierbas"),
      corto: () => t("bar.hierbas_c"),
      desc: () => t("bar.hierbas_d", [PODERES.MAX_HIERBAS]),
      tiene: () => pe().hierbas > 0 || !!st.vistos.hierbas,
      listo: () => pe().hierbas > 0,
      cant: () => pe().hierbas,
      usar: () => PODERES.comerHierbas(),
    },
    // el brebaje de Berkano: carga una piedra apagada (berkano.js)
    brebaje: {
      tipo: "objeto",
      icono: "brebaje",
      nombre: () => t("bar.brebaje"),
      corto: () => t("bar.brebaje_c"),
      desc: () => t("bar.brebaje_d", [BERKANO.MAX_BREBAJES]),
      tiene: () => !!window.BERKANO && (BERKANO.brebajes() > 0 || !!st.vistos.brebaje),
      listo: () => BERKANO.puedeBrebaje(),
      cant: () => BERKANO.brebajes(),
      usar: () => BERKANO.tomarBrebaje(),
    },
    lente: {
      tipo: "herramienta",
      icono: "lente",
      nombre: () => t("inv.lente"),
      corto: () => t("bar.lente_c"),
      desc: () => t("bar.lente_d"),
      tiene: () => A.lente().tiene,
      listo: () => A.lente().espera <= 0,
      espera: () => A.lente().espera / 1.2,
      usar: () => A.usarLente(),
    },
    viajar: {
      tipo: "herramienta",
      icono: "viajar",
      nombre: () => t("bar.viajar"),
      desc: () => t("bar.viajar_d"),
      tiene: () => !!window.SECRETOS,
      listo: () => !A.enPelea(),
      usar: () => SECRETOS.viajar(null, true),
    },
    saber: {
      tipo: "conocimiento",
      icono: "saber",
      nombre: () => t("bar.saber"),
      corto: () => t("bar.saber_c"),
      desc: () => t("bar.saber_d"),
      tiene: () => !!(window.VIDA && VIDA.sabe()),
      vuelve: 60,
      listo: () => !(esperas.saber > 0),
      espera: () => (esperas.saber || 0) / 60,
      usar: () => VIDA.guiar() && (esperas.saber = 60),
    },
  };
  const TIPOS = ["habilidad", "objeto", "herramienta", "conocimiento"];
  // en qué orden se llenan las casillas libres la primera vez
  const ORDEN = ["runa_kenaz", "runa_isa", "runa_algiz", "runa_sowilo", "lente", "hierbas", "brebaje", "saber", "viajar"];

  // ---------- poner y sacar ----------
  function libre() {
    return st.r.indexOf(null);
  }
  // algo nuevo: va a la primera casilla libre (si no estaba ya)
  function recibido(id) {
    if (!st || !COSAS[id]) return -1;
    st.vistos[id] = true;
    let i = st.r.indexOf(id);
    if (i < 0 && (i = libre()) >= 0) st.r[i] = id;
    return i;
  }
  // pone una cosa en la casilla i; si ya estaba en otra, las cambia de lugar
  function poner(i, id) {
    const antes = st.r.indexOf(id);
    if (antes >= 0) st.r[antes] = st.r[i];
    st.r[i] = id;
  }
  function sacar(i) {
    st.r[i] = null;
  }
  // con qué tecla se usa una cosa (para los avisos de lo aprendido)
  function glifoDe(id) {
    const i = st ? st.r.indexOf(id) : -1;
    if (i < 0) return CONTROLES.glifo("inventario");
    return CONTROLES.mando() ? CONTROLES.glifo("runa") : CONTROLES.glifo("ranura" + (i + 1));
  }
  // lo que Eromash tiene y puede ir en la barra, por tipo (para la mochila)
  function disponibles() {
    return TIPOS.map((tipo) => ({ tipo, cosas: Object.keys(COSAS).filter((id) => COSAS[id].tipo === tipo && COSAS[id].tiene()) }));
  }

  // ---------- usar ----------
  function usar(i) {
    const id = st && st.r[i];
    if (!id || J.modo !== "juego" || jug.muerto || jug.interactuando > 0) return;
    const q = COSAS[id];
    if (!q.tiene()) return;
    if (!q.listo()) {
      if (q.tipo === "habilidad") A.avisar("pj.sin_energia");
      return q.tipo === "objeto" ? q.usar() : null; // el objeto avisa solo por qué no
    }
    q.usar();
  }
  function siguiente() {
    for (let k = 1; k <= LARGO; k++) {
      const i = (st.sel + k) % LARGO;
      if (st.r[i]) return (st.sel = i);
    }
  }

  // ---------- lo que ve el HUD ----------
  function casillas() {
    const mando = CONTROLES.mando();
    const l = st.r.map((id, i) => {
      const q = id && COSAS[id] && COSAS[id].tiene() ? COSAS[id] : null,
        elegida = i === st.sel;
      const tecla = mando ? (elegida ? CONTROLES.glifo("runa") : "") : CONTROLES.glifo("ranura" + (i + 1));
      if (!q) return { id: "r" + i, vacia: true, tecla, elegida, nombre: "", usar: () => window.INVENTARIO && INVENTARIO.abrir("barra") };
      return {
        id: "r" + i,
        runa: q.runa,
        col: q.col && q.col(),
        icono: q.icono,
        tecla,
        elegida,
        nombre: q.corto ? q.corto() : q.nombre(), // en la casilla, el nombre corto
        listo: q.listo(),
        espera: q.espera ? q.espera() : 0,
        energia: q.energia ? q.energia() : null,
        cant: q.cant ? q.cant() : null,
        usar: () => usar(i),
      };
    });
    l.push({ id: "mochila", icono: "mochila", chica: true, tecla: CONTROLES.glifo("inventario"), nombre: t("inv.b_mochila"), listo: true, usar: () => window.INVENTARIO && INVENTARIO.abrir("equipo") });
    return l;
  }

  // lo que Eromash consiguió sin avisar (la Lente la da la historia): va a lo libre la primera vez que se lo ve
  function revisar() {
    ORDEN.forEach((id) => !st.vistos[id] && COSAS[id].tiene() && recibido(id));
  }
  let reloj = 0;
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
    },
    alEmpezar(extra) {
      extra.barra = Object.assign({ r: Array(LARGO).fill(null), sel: 0, vistos: {} }, extra.barra || {});
      st = extra.barra;
      while (st.r.length < LARGO) st.r.push(null);
      for (const k in esperas) delete esperas[k];
      // una partida guardada antes de la barra: lo que ya tiene va a lo libre
      revisar();
    },
    actualizar(dt) {
      if (!st) return;
      for (const k in esperas) esperas[k] = Math.max(0, esperas[k] - dt);
      if ((reloj -= dt) <= 0) {
        reloj = 1;
        revisar();
      }
      if (J.modo !== "juego") return;
      if (CONTROLES.recien("runa")) usar(st.sel);
      if (CONTROLES.recien("cambiarRuna")) siguiente();
      for (let i = 0; i < LARGO; i++) if (CONTROLES.recien("ranura" + (i + 1))) usar(i);
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { casillas, recibido, poner, sacar, glifoDe, disponibles, usar, COSAS, TIPOS, LARGO, estado: () => st };
})();
