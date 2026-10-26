// ---------- los objetivos opcionales de cada misión principal (sistema OPCIONALES) ----------
// Pedido de Alejandro (26/10/2026): que la historia no sea tan lineal y tenga más para hacer. Cada misión de EL-01 a
// EL-07 suma dos objetivos que no la frenan: algo de lo que ya hay en el bosque, elegido cerca de por donde pasa la
// misión (la piedra del susurro junto al carro, el atril del Puesto, el hörgr de la tala…), así cada sistema se
// conoce de camino. Al empezar la misión se elige el más cercano que todavía no se hizo; si no queda ninguno, ese
// opcional no aparece. Van en el rastreador debajo de la misión (verde, con sus metros), con su marca verde en la
// brújula y pagan plata y experiencia al cumplirse. Se pueden dejar: al pasar a la misión siguiente se cambian.
// Estado en E.extra.opc = { elegido: { clave: id }, hechos: { clave: true }, base: { clave: n } }. Textos `oq.`.
window.OPCIONALES = (function () {
  "use strict";
  let A, J, jug, W, H, st;
  const t = (k, v) => I18N.t(k, v);
  const VERDE = "#7BC86C";
  const base = () => ({ elegido: {}, hechos: {}, base: {} });

  // ---------- de dónde sale cada tipo ----------
  // cada tipo: lista() → [{ id, x, y }] de lo que hay en el mundo; hecho(id) → si ya se hizo
  const sec = () => (window.SECRETOS ? SECRETOS.lista() : null);
  const TIPOS = {
    piedra: {
      lista: () => (sec() ? sec().piedras.map((p) => ({ id: p.id, x: p.cosa.x, y: p.cosa.y })) : []),
      hecho: (id) => !!(sec() && sec().st.piedras[id]),
    },
    cofre: {
      // los que se abren sin más (ni sellados por una runa ni enterrados)
      lista: () => (sec() ? sec().cofres.filter((c) => c.sello == null && !/enterrad|arca|urna/i.test(c.tipo)).map((c) => ({ id: c.id, x: c.cosa.x, y: c.cosa.y })) : []),
      hecho: (id) => !!(sec() && sec().st.cofres[id]),
    },
    atril: {
      lista: () => (window.LIBROS ? LIBROS.atriles.map((a) => ({ id: a.id, x: a.x, y: a.y })) : []),
      hecho: (id) => !!(window.LIBROS && LIBROS.estado().leidos[id]),
    },
    horgr: {
      lista: () => {
        if (!window.SANTUARIOS) return [];
        const h = SANTUARIOS.horgar();
        return Object.keys(h).map((id) => ({ id, x: h[id].x, y: h[id].y }));
      },
      hecho: (id) => !!(window.SANTUARIOS && SANTUARIOS.estado().vistos[id]),
    },
  };
  // los que no son una cosa del mundo: se miran en cada cuadro
  const MIRAR = {
    herreria: () => !!(window.HERRERIA && HERRERIA.activo()),
    hongo: () => !!(window.HONGO && HONGO.activo()),
    comer: () => !!(window.COCINA && COCINA.estado() && COCINA.estado().comida),
    pesca: () => pescados() > (st.base.pesca || 0),
  };
  function pescados() {
    const l = window.PESCA && PESCA.estado() && PESCA.estado().libro;
    if (!l) return 0;
    let n = 0;
    for (const k in l) n += (l[k] && l[k].n) || 0;
    return n;
  }

  // ---------- los de cada misión ----------
  // { id, tipo, cerca: lugar o punto (de dónde se elige el más cercano) } o { id, mira }
  const LISTA = {
    "EL-01": [{ id: "piedra_carro", tipo: "piedra", cerca: "carro" }, { id: "atril_puesto", tipo: "atril", cerca: "puesto" }],
    "EL-02": [{ id: "cofre_refugio", tipo: "cofre", cerca: "refugio" }, { id: "comer_refugio", mira: "comer" }],
    "EL-03": [{ id: "herreria", mira: "herreria" }, { id: "hongo", mira: "hongo" }],
    "EL-04": [{ id: "horgr_tala", tipo: "horgr", cerca: "tala" }, { id: "cofre_quebrada", tipo: "cofre", cerca: "quebrada_rastreo" }],
    "EL-05": [{ id: "comer_ciervo", mira: "comer", antes: "ciervo_vencido" }, { id: "piedra_claro", tipo: "piedra", cerca: "claro_entrada" }],
    "EL-06": [{ id: "pesca_paso", mira: "pesca" }, { id: "atril_paso", tipo: "atril", cerca: "paso_sur" }],
    "EL-07": [{ id: "horgr_aserradero", tipo: "horgr", cerca: "aserradero" }, { id: "piedra_santuario", tipo: "piedra", cerca: "santuario" }],
  };
  const mision = () => H.idMision();
  const clave = (m, o) => m + ":" + o.id;
  const ref = (o) => (W.LUGARES[o.cerca] ? W.LUGARES[o.cerca].p : W.PUNTOS[o.cerca]);

  // al empezar una misión: el más cercano que falta de cada tipo (una sola vez por misión)
  function elegir() {
    const m = mision(),
      l = LISTA[m];
    if (!l) return;
    for (const o of l) {
      const k = clave(m, o);
      if (k in st.elegido) continue;
      if (o.mira) {
        st.elegido[k] = o.mira;
        if (o.mira === "pesca") st.base.pesca = pescados();
        continue;
      }
      const T = TIPOS[o.tipo],
        r = ref(o);
      let mejor = null,
        dm = Infinity;
      if (r)
        for (const c of T.lista()) {
          if (T.hecho(c.id)) continue;
          const d = Math.hypot(c.x - r[0], c.y - r[1]);
          if (d < dm) {
            dm = d;
            mejor = c;
          }
        }
      st.elegido[k] = mejor ? mejor.id : null;
    }
  }
  // los opcionales de ahora: [{ o, k, cosa, hecho }]
  function ahora() {
    const m = mision(),
      l = LISTA[m];
    if (!l || !st) return [];
    const r = [];
    for (const o of l) {
      const k = clave(m, o);
      if (!(k in st.elegido) || st.elegido[k] == null) continue;
      if (o.antes && H.tiene(o.antes) && !st.hechos[k]) continue; // ya pasó su momento
      let cosa = null;
      if (o.tipo) cosa = TIPOS[o.tipo].lista().find((c) => String(c.id) === String(st.elegido[k])) || null;
      if (o.tipo && !cosa) continue;
      r.push({ o, k, cosa, hecho: !!st.hechos[k] });
    }
    return r;
  }
  function cumplir(x) {
    st.hechos[x.k] = true;
    const n = Math.max(0, H.MISIONES.findIndex((m) => m.id === mision())),
      plata = 15 + n * 10,
      xp = 40 + n * 20;
    if (window.PODERES && PODERES.pj()) PODERES.darPlata(plata);
    if (window.RPG) RPG.dar(xp, jug.x, jug.y);
    HUD.aviso(t("oq.cumplido", [t("oq." + x.o.id), plata]), VERDE);
    if (window.SONIDO) SONIDO.tocar("pagina", { vol: 0.6 });
    if (window.ANIMA) ANIMA.gesto("asiente");
    H.guardar();
  }

  let mirarT = 0,
    misionAntes = null;
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      H = A.H;
    },
    alEmpezar(extra) {
      extra.opc = Object.assign(base(), extra.opc || {});
      st = extra.opc;
      misionAntes = null;
    },
    // se mira desde el HUD, que corre también adentro de Eikholt, la herrería o la taberna (ahí no corre actualizar)
    hud() {
      if (!st || J.modo !== "juego" || A.W.LIENZO) return;
      // los sistemas arman su mundo al iniciar: la primera elección espera a que estén
      if (misionAntes !== mision()) {
        misionAntes = mision();
        elegir();
      }
      const ahoraT = performance.now();
      if (ahoraT - mirarT < 500) return;
      mirarT = ahoraT;
      for (const x of ahora()) {
        if (x.hecho) continue;
        const listo = x.o.mira ? MIRAR[x.o.mira]() : TIPOS[x.o.tipo].hecho(x.cosa.id);
        if (listo) cumplir(x);
      }
    },
    seguimiento() {
      const l = ahora();
      if (!l.length) return null;
      const m = (c) => Math.max(1, Math.hypot(c.x - jug.x, c.y - jug.y) / 43);
      return {
        rotulo: t("oq.rotulo"),
        nombre: t("oq.nombre"),
        objetivos: l.map((x) => ({ texto: t("oq." + x.o.id), estado: x.hecho ? "hecho" : "actual", metros: !x.hecho && x.cosa ? m(x.cosa) : null })),
      };
    },
    marcasBrujula() {
      return ahora()
        .filter((x) => !x.hecho && x.cosa)
        .map((x) => ({ x: x.cosa.x, y: x.cosa.y, col: VERDE }));
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, ahora, elegir, LISTA, TIPOS };
})();
