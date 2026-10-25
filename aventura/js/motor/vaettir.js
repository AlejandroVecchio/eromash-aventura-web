// ---------- los vættir, espíritus de la tierra (sistema VAETTIR) ----------
// Como los landvættir de las sagas y los santuarios chicos del Ni No Kuni: seis espíritus viven en lugares chicos del
// bosque, a un costado de los caminos (un manantial, un tocón con puertita, una piedra horadada, un túmulo enano, una
// roca con liquen y un fresno seco con un hueco). Cada uno quiere una cosa, y la pista se escucha en su hogar:
//   · Con E se le ofrece un material de la Bolsa. Si es lo que quiere, su favor sube (hasta 3); si no, lo devuelve.
//   · De noche, con algo de favor, se asoma medio transparente. Con favor 3 se muestra, dice unas palabras, regala
//     plata y un fragmento, y bendice su tierra (TIERRA = 4200 alrededor): mientras Eromash anda por ahí tiene su don.
//   · Dones: vida que vuelve el doble (Brunna), estamina que vuelve más rápido (Stubbi), un 10 % menos de daño (Gata),
//     un 10 % más de daño (Haugi), más materiales de las criaturas (Hella) y más plata (Ugla).
//   · Con los seis bendiciendo, Eromash es amigo de los vættir: dos fragmentos más y una línea en el diario.
// Aparecen en el mapa (clase Vættir) cuando se los encuentra. Estado en E.extra.vaettir = { favor: { id: n },
// vistos: { id: 1 }, amigo }. Textos `vt.`.
window.VAETTIR = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const FAVOR = 3,
    TIERRA = 4200,
    RADIO = 160,
    VE = 900; // a esta distancia se lo encuentra (y va al mapa)
  const LISTA = [
    { id: "manantial", asset: "manantialVaettr", quiere: "ambar", don: "vida" },
    { id: "tocon", asset: "toconVaettr", quiere: "cuero", don: "aliento" },
    { id: "piedra", asset: "piedraHoradada", quiere: "hierro", don: "escudo" },
    { id: "tumulo", asset: "tumuloChico", quiere: "esquirla", don: "golpe" },
    { id: "roca", asset: "rocaLiquenes", quiere: "brasa", don: "botin" },
    { id: "buho", asset: "huecoBuho", quiere: "seda", don: "plata" },
  ];
  // lo que se le puede dejar: lo que da la tierra (no las ganzúas ni lo hecho a mano)
  const OFRENDAS = ["hierro", "cuero", "ambar", "esquirla", "brasa", "seda"];
  const base = () => ({ favor: {}, vistos: {}, amigo: false });
  let st = base();
  const hogares = []; // { v (de LISTA), x, y, cosa, figura }

  // ---------- dónde: a un costado de los caminos, repartidos ----------
  function buscarLugares() {
    const L = W.LUGARES,
      pu = L.puesto.p,
      cands = [];
    W.CAMINOS.forEach((c) => {
      for (let i = 0; i < c.p.length - 1; i++) {
        const a = c.p[i],
          b = c.p[i + 1],
          dx = b[0] - a[0],
          dy = b[1] - a[1],
          l = Math.hypot(dx, dy) || 1,
          k0 = c.w / 2;
        for (let u = 200; u < l; u += 300) [-1, 1].forEach((lado) => [380, 640].forEach((k1) => cands.push([a[0] + (dx / l) * u + (-dy / l) * (k0 + k1) * lado, a[1] + (dy / l) * u + (dx / l) * (k0 + k1) * lado])));
      }
    });
    const ocupados = [];
    HORDAS.grupos.forEach((g) => ocupados.push([g.centro[0], g.centro[1], 1100]));
    if (window.BANDIDOS) BANDIDOS.guaridas.forEach((g) => ocupados.push([g.centro[0], g.centro[1], 2200]));
    if (window.ARANAS) ARANAS.nidos.forEach((n) => ocupados.push([n.centro[0], n.centro[1], 2200]));
    if (window.JOTUNN && JOTUNN.jefe()) ocupados.push([JOTUNN.jefe().centro[0], JOTUNN.jefe().centro[1], 2600]);
    const despejado = (x, y) => {
      let si = true;
      W.cercanas(x - 220, y - 160, x + 220, y + 220, (o) => {
        if (o.choque && !o.arbol && o.id !== "roca" && o.id !== "troncoCaido" && !o.oculto) si = false;
      });
      return si;
    };
    // tierra firme alrededor (sobre todo adelante, de donde se llega)
    const firme = (x, y) => [[0, 0], [0, 280], [-220, 120], [220, 120], [0, -160]].every(([dx, dy]) => W.sueloEn(x + dx, y + dy) === 0);
    const ok = ([x, y]) =>
      firme(x, y) &&
      Object.keys(L).every((k) => Math.hypot(x - L[k].p[0], y - L[k].p[1]) > L[k].r + 800) &&
      Math.hypot(x - W.CIUDAD.c[0], (y - W.CIUDAD.c[1]) * 1.3) > W.CIUDAD.rx + 1200 &&
      ocupados.every((q) => Math.hypot(q[0] - x, q[1] - y) > q[2]) &&
      W.CAMINOS.every((c) => W.distLinea(x, y, c.p) > c.w / 2 + 200) &&
      !W.LAGOS.some((g) => Math.hypot(x - g.p[0], y - g.p[1]) < g.rx + 300) &&
      !W.RIOS.some((r) => !r.seco && W.distLinea(x, y, r.p) < (r.w || 200) + 200) &&
      despejado(x, y);
    // un orden fijo pero salteado (semilla), así quedan repartidos y no todos cerca del Puesto
    const rnd = DIB.azar(5531);
    cands.forEach((p) => (p[2] = rnd()));
    cands.sort((a, b) => a[2] - b[2]);
    const buenos = cands.filter((p) => Math.hypot(p[0] - pu[0], p[1] - pu[1]) > 2500 && ok(p));
    // bien separados; si no alcanzan, un poco más juntos
    const elegidos = [];
    for (const sep of [6000, 4500, 3000])
      for (const p of buenos) {
        if (elegidos.length >= LISTA.length) break;
        if (!elegidos.includes(p) && elegidos.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) >= sep)) elegidos.push(p);
      }
    return elegidos;
  }
  function armar() {
    buscarLugares().forEach((p, i) => {
      const v = LISTA[i],
        x = p[0],
        y = p[1];
      // un claro chico alrededor
      W.cercanas(x - 460, y - 300, x + 460, y + 900, (o) => {
        if (!o.arbol && o.id !== "roca" && o.id !== "troncoCaido") return;
        const dy = o.y - y;
        if (Math.hypot(o.x - x, dy > 0 ? dy * 0.45 : dy) > 400) return;
        o.oculto = true;
        o.choque = null;
      });
      const cosa = W.agregar(v.asset, [x, y], {});
      const figura = W.agregar("vaettrFigura", [x + 70, y + 40], { tipo: v.id, a: 0 });
      hogares.push({ v, x, y, cosa, figura });
    });
  }

  // ---------- favor y ofrendas ----------
  const favor = (id) => st.favor[id] || 0;
  const bendice = (id) => favor(id) >= FAVOR;
  const nombre = (v) => t("vt." + v.id);
  function ofrecer(h, mat) {
    const v = h.v;
    if (bendice(v.id)) return false;
    if (MATERIALES.cuantos(mat) <= 0) return false;
    if (mat !== v.quiere) {
      HUD.aviso(t("vt.no_quiere", [nombre(v), t("mt." + mat)]), "#8A8478");
      if (window.ANIMA) ANIMA.gesto("duda");
      return false;
    }
    MATERIALES.gastar({ [mat]: 1 });
    st.favor[v.id] = favor(v.id) + 1;
    if (window.SONIDO) SONIDO.runa(h.x, h.y);
    if (window.VIDA) VIDA.evento("piedra", h.x, h.y);
    if (bendice(v.id)) mostrarse(h);
    else HUD.aviso(t("vt.le_gusta", [nombre(v), favor(v.id), FAVOR]), "#7BC86C");
    if (window.INVENTARIO) INVENTARIO.repintar();
    return true;
  }
  function mostrarse(h) {
    const v = h.v;
    HUD.aviso(t("vt." + v.id + "_dice"), "lugar", nombre(v));
    J.retrasar(2.2, () => HUD.aviso(t("vt.bendice", [t("vt.don_" + v.don)]), "#7BC86C", t("vt.bendicion")));
    PODERES.soltar(h.x, h.y, "plata", 60);
    J.retrasar(0.6, () => PODERES.darFragmento());
    if (window.RPG) RPG.dar(300, h.x, h.y);
    if (window.ANIMA) ANIMA.gesto("feliz");
    if (!st.amigo && LISTA.every((q) => bendice(q.id))) {
      st.amigo = true;
      J.retrasar(4.5, () => {
        HUD.aviso(t("vt.amigo_d"), "lugar", t("vt.amigo"));
        PODERES.darFragmento();
        J.retrasar(0.4, () => PODERES.darFragmento());
      });
    }
  }
  function abrir(h) {
    const v = h.v,
      f = favor(v.id),
      estrellas = "◆".repeat(f) + "◇".repeat(FAVOR - f);
    const cab = `<h2>${nombre(v)}</h2><div class="sub">${t("as." + v.asset)} · ${t("vt.favor")} ${estrellas}</div>`;
    if (bendice(v.id)) return A.menu(cab + `<p>${t("vt.ya_bendice", [t("vt.don_" + v.don)])}</p>`, [{ texto: t("ui.cerrar"), fn: A.cerrarMenu }]);
    const botones = OFRENDAS.filter((m) => MATERIALES.cuantos(m) > 0).map((m) => ({ texto: t("vt.dar", [t("mt." + m)]), sub: t("vt.tenes", [MATERIALES.cuantos(m)]), fn: () => (A.cerrarMenu(), ofrecer(h, m)) }));
    botones.push({ texto: t("ui.cerrar"), fn: A.cerrarMenu });
    A.menu(cab + `<p><i>${t("vt." + v.id + "_pista")}</i></p>${botones.length > 1 ? "" : `<p>${t("vt.nada")}</p>`}`, botones);
  }
  // la tierra bendecida donde está Eromash (la del hogar más cercano, si bendice)
  function tierra() {
    if (J.dentro) return null;
    let mejor = null,
      dm = TIERRA;
    for (const h of hogares) {
      const d = Math.hypot(jug.x - h.x, jug.y - h.y);
      if (d < dm && bendice(h.v.id)) (mejor = h), (dm = d);
    }
    return mejor;
  }
  const don = (k) => {
    const h = tierra();
    return h && h.v.don === k;
  };

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      armar();
    },
    alEmpezar(extra) {
      extra.vaettir = Object.assign(base(), extra.vaettir || {});
      st = extra.vaettir;
      hogares.forEach((h) => (h.figura.o.a = bendice(h.v.id) ? 1 : 0));
    },
    actualizar(dt) {
      if (!A || J.dentro) return;
      const noche = A.noche() > 0.5;
      for (const h of hogares) {
        const d = Math.hypot(jug.x - h.x, jug.y - h.y);
        if (d < VE && !st.vistos[h.v.id]) {
          st.vistos[h.v.id] = 1;
          HUD.aviso(t("vt.encontraste_d"), "lugar", t("as." + h.v.asset));
        }
        // se asoma de noche con algo de favor; se muestra entero con todo el favor
        const f = favor(h.v.id),
          meta = f >= FAVOR ? 1 : noche && f >= 1 ? 0.4 : 0;
        h.figura.o.a += (meta - h.figura.o.a) * Math.min(1, dt * 1.5);
      }
      if (J.modo !== "juego" || jug.muerto) return;
      // los dones de la tierra
      const h = tierra();
      if (!h) return;
      if (h.v.don === "vida" && jug.hp < jug.hpMax) jug.hp = Math.min(jug.hpMax, jug.hp + (A.enPelea() ? 1.5 : 6) * dt);
      if (h.v.don === "aliento" && jug.sta < jug.staMax) jug.sta = Math.min(jug.staMax, jug.sta + 8 * dt);
    },
    cercanos(dar) {
      if (J.dentro) return;
      for (const h of hogares) {
        const d = Math.hypot(h.x - jug.x, h.y - jug.y);
        if (d < RADIO) dar(d, t(bendice(h.v.id) ? "vt.visitar" : "vt.ofrendar", [nombre(h.v)]), () => abrir(h), h.x, h.y - 90);
      }
    },
    modDano(dano) {
      return don("golpe") ? dano * 1.1 : dano;
    },
    modRecibido(dano) {
      return don("escudo") ? dano * 0.9 : dano;
    },
    alMorir(e) {
      if (!e || e.d.blanco) return;
      if (don("botin") && Math.random() < 0.3) {
        const tabla = (MATERIALES.CRIATURAS[e.tipo] || [["cuero", 1, 1]])[0];
        MATERIALES.dar(tabla[0], 1, e.x, e.y);
      }
      if (don("plata") && Math.random() < 0.45) PODERES.soltar(e.x, e.y, "plata", 4 + Math.round(Math.random() * 6));
    },
    luces(dar) {
      if (J.dentro) return;
      for (const h of hogares) if (h.figura.o.a > 0.05) dar({ x: h.figura.x, y: h.figura.y - 40, r: 160, col: VAETTIR_DIBUJO.TIPOS[h.v.id].luz, f: 0.5 * h.figura.o.a });
    },
    efectosHud() {
      const h = tierra();
      return h ? [{ texto: t("vt.tierra", [nombre(h.v)]), n: t("vt.don_corto_" + h.v.don), col: "#7BC86C" }] : [];
    },
    marcasMapa() {
      return hogares.filter((h) => st.vistos[h.v.id]).map((h) => ({ tipo: "vaettr", x: h.x, y: h.y, op: { nombre: nombre(h.v), apagado: bendice(h.v.id) } }));
    },
    diario() {
      const vistos = hogares.filter((h) => st.vistos[h.v.id]);
      if (!vistos.length) return "";
      const filas = vistos.map((h) => `<li><b>${nombre(h.v)}</b> · ${t("as." + h.v.asset)} · ${bendice(h.v.id) ? t("vt.don_" + h.v.don) : t("vt.favor") + " " + favor(h.v.id) + "/" + FAVOR}</li>`).join("");
      return `<div class="diario-resumen"><p><b>${t("vt.titulo")}</b> ${t("vt.diario", [vistos.length, LISTA.length])}${st.amigo ? " " + t("vt.amigo") + "." : ""}</p><ul>${filas}</ul></div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, hogares, LISTA, ofrecer, abrir, tierra, favor, bendice, FAVOR, TIERRA };
})();
