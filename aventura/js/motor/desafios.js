// ---------- los desafíos del mundo (sistema DESAFIOS) ----------
// La versión difícil de lo que ya se hizo, como las grietas de Diablo o los desafíos de los santuarios de Zelda: una
// guarida vaciada, una piedra del rito despierta o un hörgr encontrado ofrecen «Desafío» una vez por día. Al aceptarlo
// vuelve un eco del lugar: un grupo con líder de la familia de la zona, 4 niveles por encima de lo que había ahí
// (la fuerza del grupo `mas` +0,5, así lo nivela RPG como a cualquiera), y hay 2 minutos para vencerlo sin alejarse.
// Vencerlo paga plata, un fragmento, una pieza rara o mejor y experiencia; perderlo (tiempo, alejarse o caer) solo
// hace que el eco se vaya. Los ecos se arman con HORDAS.crearGrupo y se sacan al terminar (no vuelven solos).
// Estado en E.extra.desafios = { dia: { sitio: n }, hechos }. Textos `df.` en textos/desafios.js.
window.DESAFIOS = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const TIEMPO = 120,
    LEJOS = 2600,
    MAS = 0.5,
    RADIO = 170;
  const base = () => ({ dia: {}, hechos: 0 });
  let st = base();
  let activo = null; // { sitio, g, t, x, y }
  let originales = null; // los grupos del bosque (los ecos no son guaridas)

  const dia = () => Math.floor(A.H.E.tiempo / LUZ.DIA);
  const hoy = (id) => st.dia[id] === dia();
  const nivel = () => (window.RPG ? RPG.nivel() : 1);
  const masAqui = (p) => 1 + Math.hypot(p[0] - W.LUGARES.puesto.p[0], p[1] - W.LUGARES.puesto.p[1]) / 14000;
  // la familia de la zona: la del grupo del bosque más cercano
  function famCerca(p) {
    let m = null,
      dm = Infinity;
    for (const g of originales || []) {
      if (g.fam === "bandidos" || g.fam === "aranas") continue;
      const d = Math.hypot(g.centro[0] - p[0], g.centro[1] - p[1]);
      if (d < dm) (dm = d), (m = g);
    }
    return m ? m.fam : "draugr";
  }

  // ---------- los lugares que se pueden desafiar ----------
  function sitios() {
    const l = [];
    for (const g of originales || []) {
      if (!g.miembros.length || g.unico || !g.miembros.every((e) => e.muerto > 0)) continue;
      l.push({ id: "g" + g.id, tipo: "guarida", x: g.centro[0], y: g.centro[1], fam: g.fam, mas: (g.mas || 1) + MAS, nombre: t("df.guarida") });
    }
    if (window.RITOS) {
      const { ritos, st: sr } = RITOS.lista();
      for (const r of ritos) if (sr.ritos[r.id]) l.push({ id: "r" + r.id, tipo: "rito", x: r.centro[0], y: r.centro[1], fam: famCerca(r.centro), mas: masAqui(r.centro) + MAS, nombre: t("df.rito"), sale: [r.centro[0] + 260, r.centro[1] + 180] });
    }
    if (window.SANTUARIOS) {
      const vistos = SANTUARIOS.estado().vistos;
      for (const id in vistos) {
        const h = SANTUARIOS.horgar()[id];
        if (vistos[id] && h) l.push({ id: "h" + id, tipo: "horgr", x: h.x, y: h.y, fam: famCerca([h.x, h.y]), mas: masAqui([h.x, h.y]) + MAS, nombre: t("df.horgr", [t("sn.d_" + id)]), sale: [h.x, h.y + 320] });
      }
    }
    return l;
  }

  // ---------- empezar, ganar, perder ----------
  function menu(s) {
    A.menu(`<h2>${t("df.titulo", [s.nombre])}</h2><div class="sub">${t("df.sub_" + s.tipo)}</div><p>${t("df.reglas", [TIEMPO / 60])}</p><p>${t("df.premio")}</p>`, [
      { texto: t("df.aceptar"), fn: () => (A.cerrarMenu(), empezar(s)) },
      { texto: t("ui.cerrar"), fn: A.cerrarMenu },
    ]);
  }
  function empezar(s) {
    if (activo || hoy(s.id)) return false;
    const p = s.sale || [s.x, s.y];
    const g = HORDAS.crearGrupo(s.fam, p, { mas: s.mas, conLider: true, n: 4 });
    g.desafio = s.id;
    g.miembros.forEach((e) => {
      e.desafio = true;
      e.activo = true;
      e.estado = "persigue";
    });
    activo = { sitio: s, g, t: TIEMPO, x: p[0], y: p[1] };
    st.dia[s.id] = dia();
    HUD.aviso(t("df.empieza", [TIEMPO / 60]), "lugar", t("df.titulo", [s.nombre]));
    if (A.columnaRunica) A.columnaRunica(p[0], p[1]);
    if (window.SONIDO) SONIDO.tocar("runa", { vol: 0.6, tono: 0.7 });
    return true;
  }
  function sacar(g) {
    for (const e of g.miembros) {
      const i = A.enemigos.indexOf(e);
      if (i >= 0) A.enemigos.splice(i, 1);
    }
    const k = HORDAS.grupos.indexOf(g);
    if (k >= 0) HORDAS.grupos.splice(k, 1);
  }
  function ganar() {
    const a = activo,
      lider = a.g.miembros.find((e) => e.lider) || a.g.miembros[0],
      n = window.RPG ? RPG.nivelDe(lider) : nivel();
    activo = null;
    st.hechos++;
    const plata = 60 + 12 * n;
    PODERES.darPlata(plata);
    J.retrasar(0.5, () => PODERES.darFragmento());
    if (window.BOTIN && window.OBJETOS) BOTIN.tirar(a.x, a.y, OBJETOS.generar({ n, min: 2, hallazgo: 2 }), true);
    if (window.RPG) RPG.dar(Math.round(RPG.xpPara(nivel()) * 0.3), jug.x, jug.y - 90);
    HUD.aviso(t("df.ganado", [plata]), "#FFD98A", t("df.titulo", [a.sitio.nombre]));
    if (window.VIDA && VIDA.evento) VIDA.evento("cofre", a.x, a.y, { importante: true });
    J.retrasar(3, () => sacar(a.g));
  }
  function perder(motivo) {
    const a = activo;
    activo = null;
    HUD.aviso(t("df.perdido_" + motivo), "#E0B2B2");
    a.g.miembros.forEach((e) => ((e.muerto = 1), (e.activo = false)));
    sacar(a.g);
  }

  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
    },
    alEmpezar(extra) {
      extra.desafios = Object.assign(base(), extra.desafios || {});
      st = extra.desafios;
      if (activo) {
        sacar(activo.g);
        activo = null;
      }
      if (!originales && window.HORDAS) originales = HORDAS.grupos.slice();
    },
    actualizar(dt) {
      if (!activo || J.modo !== "juego") return;
      if (activo.g.miembros.every((e) => e.muerto > 0)) return ganar();
      if (jug.muerto) return perder("caido");
      if ((activo.t -= dt) <= 0) return perder("tiempo");
      if (Math.hypot(activo.x - jug.x, activo.y - jug.y) > LEJOS) return perder("lejos");
    },
    cercanos(dar) {
      if (J.dentro || activo) return;
      for (const s of sitios()) {
        const d = Math.hypot(s.x - jug.x, s.y - jug.y);
        if (d < RADIO && !hoy(s.id)) dar(d + 15, t("df.accion", [s.nombre]), () => menu(s), s.x, s.y - 160);
      }
    },
    seguimiento() {
      if (!activo) return null;
      const vivos = activo.g.miembros.filter((e) => !(e.muerto > 0)).length;
      return { secundaria: true, rotulo: t("df.rotulo"), nombre: t("df.titulo", [activo.sitio.nombre]), objetivos: [{ texto: t("df.seg", [vivos, Math.ceil(activo.t)]), estado: "actual" }] };
    },
    diario() {
      return st.hechos ? `<div class="diario-resumen"><p><b>${t("df.rotulo")}</b> ${t("df.diario", [st.hechos])}</p></div>` : "";
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, sitios, empezar, activo: () => activo, TIEMPO, MAS };
})();
