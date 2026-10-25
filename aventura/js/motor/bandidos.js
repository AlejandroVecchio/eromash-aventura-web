// ---------- los Sin Linde: guaridas de bandidos (sistema BANDIDOS) ----------
// Como los campamentos de bandidos del Skyrim y del Gothic: gente echada fuera de la ley por el Ting que vive en el
// bosque, fuera de toda linde. Cuatro guaridas cerca de los caminos, cada una con su tienda de cueros, la estaca con la
// linde partida, un fogón (se puede cocinar en él) y el botín robado. Cada guarida es un grupo de HORDAS (familia
// `bandidos`: bandidos con hacha y escudo, arqueros que tiran desde lejos, y un jefe con nombre y afijos), así que
// vuelve a poblarse con el tiempo, cuenta para el bestiario. El botín se saquea una sola vez, cuando
// cae toda la guarida: plata, un fragmento, una pieza y ganzúas. Los bandidos sueltan a veces ganzúas o hierro.
// Los arqueros avisan en el piso donde está Eromash (forma `lejos`) y la flecha vuela en arco al final del aviso.
// Estado en E.extra.bandidos = { saqueados: { i: 1 } }. Textos `bd.` (cr.bandido, cr.arquero, bs.bandido_*, as.*).
window.BANDIDOS = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const M = 30;
  const N = 4, // guaridas
    RADIO = 140,
    AVISA = 1300; // a esta distancia se anuncia la guarida
  Object.assign(COMBATE.TIPOS, {
    bandido: { vida: 85, dano: 15, vel: 2.5 * M, alcance: 2.1 * M, aviso: 0.8, forma: "abanico", radioGolpe: 2.4 * M, angulo: 0.75, radio: 16, espera: 1.7, barra: 110, plata: 8 },
    arquero: { vida: 55, dano: 13, vel: 2.3 * M, alcance: 10 * M, aviso: 1.1, forma: "lejos", radioGolpe: 1.4 * M, radio: 14, espera: 2.3, barra: 106, plata: 7, rgb: [255, 217, 138] },
  });
  if (window.BESTIARIO) BESTIARIO.LISTA.push("bandido", "arquero");
  if (window.MATERIALES) Object.assign(MATERIALES.CRIATURAS, { bandido: [["hierro", 0.25, 1]], arquero: [["cuero", 0.3, 1]] });
  const base = () => ({ saqueados: {} });
  let st = base();
  const guaridas = []; // { i, centro, g, botin, mas }
  let avisadas = new Set();

  // ---------- dónde: cerca de los caminos, lejos de los pueblos, de los grupos y entre ellas ----------
  function buscarLugares() {
    const L = W.LUGARES,
      pu = L.puesto.p,
      centros = HORDAS.grupos.map((g) => g.centro),
      cands = [];
    // puntos cada 500 a lo largo de cada camino, corridos a un costado
    W.CAMINOS.forEach((c) => {
      if (c.sinPiso) return;
      for (let i = 0; i < c.p.length - 1; i++) {
        const a = c.p[i],
          b = c.p[i + 1],
          dx = b[0] - a[0],
          dy = b[1] - a[1],
          l = Math.hypot(dx, dy) || 1,
          k = c.w / 2 + 720;
        for (let u = 250; u < l; u += 500)
          [-1, 1].forEach((lado) => cands.push([a[0] + (dx / l) * u + (-dy / l) * k * lado, a[1] + (dy / l) * u + (dx / l) * k * lado]));
      }
    });
    // nada construido cerca (los árboles y las rocas se apartan)
    const despejado = (x, y) => {
      let si = true;
      W.cercanas(x - 420, y - 320, x + 420, y + 420, (o) => {
        if (o.choque && !o.arbol && o.id !== "roca" && o.id !== "troncoCaido" && !o.oculto) si = false;
      });
      return si;
    };
    const ok = ([x, y]) =>
      W.sueloEn(x, y) === 0 &&
      despejado(x, y) &&
      Math.hypot(x - pu[0], y - pu[1]) > 4500 &&
      Object.keys(L).every((k) => Math.hypot(x - L[k].p[0], y - L[k].p[1]) > L[k].r + 1200) &&
      Math.hypot(x - W.CIUDAD.c[0], (y - W.CIUDAD.c[1]) * 1.3) > W.CIUDAD.rx + 1600 &&
      centros.every((q) => Math.hypot(q[0] - x, q[1] - y) > 1700) &&
      W.CAMINOS.every((c) => W.distLinea(x, y, c.p) > c.w / 2 + 420) &&
      !W.LAGOS.some((g) => Math.hypot(x - g.p[0], y - g.p[1]) < g.rx + 500);
    cands.sort((a, b) => Math.hypot(a[0] - pu[0], a[1] - pu[1]) - Math.hypot(b[0] - pu[0], b[1] - pu[1]));
    const elegidos = [];
    for (const p of cands) {
      if (elegidos.length >= N) break;
      if (!ok(p) || elegidos.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 5000)) continue;
      elegidos.push(p);
    }
    return elegidos;
  }
  function armar() {
    HORDAS.FAMILIAS.bandidos = { lider: "bandido", miembros: ["bandido", "arquero", "bandido", "arquero", "bandido"], totem: null };
    buscarLugares().forEach((c, i) => {
      const x = c[0],
        y = c[1];
      // un claro para la guarida, más abierto hacia adelante
      W.cercanas(x - 760, y - 700, x + 760, y + 1260, (o) => {
        if (!o.arbol && o.id !== "roca" && o.id !== "troncoCaido") return;
        const dy = o.y - y;
        if (Math.hypot(o.x - x, dy > 0 ? dy * 0.55 : dy) > 640) return;
        o.oculto = true;
        o.choque = null;
      });
      W.agregar("tiendaSinLinde", [x - 170, y - 150], { v: i });
      W.agregar("tiendaSinLinde", [x + 190, y - 110], { v: i + 1, s: 0.85 });
      W.agregar("estacaSinLinde", [x - 290, y + 60], {});
      W.agregar("fogonOlla", [x + 10, y + 10], {});
      const botin = W.agregar("botinSinLinde", [x + 40, y - 210], {});
      const mas = 1.1 + Math.hypot(x - W.LUGARES.puesto.p[0], y - W.LUGARES.puesto.p[1]) / 14000;
      const g = HORDAS.crearGrupo("bandidos", [x, y + 110], { pal: i % 3, mas, conLider: true, n: 4 + (i % 2) });
      g.bandidos = i;
      guaridas.push({ i, centro: [x, y], g, botin, mas });
    });
  }
  const caida = (gu) => gu.g.miembros.every((e) => e.muerto > 0);

  function saquear(gu) {
    if (st.saqueados[gu.i]) return false;
    if (!caida(gu)) return HUD.aviso(t("bd.vigilan"), "#C8402D"), false;
    st.saqueados[gu.i] = 1;
    gu.botin.o.abierto = true;
    const b = gu.botin;
    PODERES.botinCofre(b.x, b.y - 20, t("bd.botin"), { plata: Math.round(70 + 30 * gu.mas * (gu.i + 1)), frag: true }, true);
    if (window.RPG) RPG.dar(120, b.x, b.y);
    return true;
  }

  // ---------- la flecha de los arqueros: vuela en arco al final del aviso ----------
  function flechas(c) {
    for (const a of J.avisos) {
      const e = a.de;
      if (!e || e.tipo !== "arquero" || e.muerto) continue;
      const k = a.t / a.dur;
      if (k < 0.55) continue;
      const u = (k - 0.55) / 0.45,
        x0 = e.x,
        y0 = e.y - 64 * (e.s || 1),
        x = x0 + (a.x - x0) * u,
        y = y0 + (a.y - y0) * u - Math.sin(Math.PI * u) * 140,
        // hacia dónde apunta: la derivada del arco
        dx = a.x - x0,
        dy = a.y - y0 - Math.cos(Math.PI * u) * 140 * Math.PI,
        ang = Math.atan2(dy, dx);
      c.save();
      c.translate(x, y);
      c.rotate(ang);
      DIB.L(c, -22, 0, 10, 0, "#B8B0A8", 2);
      DIB.P(c, [10, -3.5, 18, 0, 10, 3.5], "#8A847E");
      DIB.P(c, [-22, 0, -28, -4, -24, 0, -28, 4], "#FF8D71");
      c.restore();
    }
  }

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
      extra.bandidos = Object.assign(base(), extra.bandidos || {});
      st = extra.bandidos;
      guaridas.forEach((gu) => (gu.botin.o.abierto = !!st.saqueados[gu.i]));
      avisadas = new Set();
    },
    actualizar() {
      if (J.modo !== "juego" || J.dentro) return;
      for (const gu of guaridas) {
        const d = Math.hypot(gu.centro[0] - jug.x, gu.centro[1] - jug.y);
        if (d < AVISA && !avisadas.has(gu.i) && !caida(gu)) {
          avisadas.add(gu.i);
          HUD.aviso(t("bd.guarida_d"), "lugar", t("bd.guarida"));
        } else if (d > AVISA * 1.8) avisadas.delete(gu.i);
      }
    },
    cercanos(dar) {
      if (J.dentro) return;
      for (const gu of guaridas) {
        if (st.saqueados[gu.i]) continue;
        const b = gu.botin,
          d = Math.hypot(b.x - jug.x, b.y - jug.y);
        if (d < RADIO) dar(d, t("bd.saquear"), () => saquear(gu), b.x, b.y - 80);
      }
    },
    sobreLuz(c) {
      if (!J.dentro) flechas(c);
    },
    marcasMapa() {
      return guaridas.map((gu) => ({ tipo: "bandidos", x: gu.centro[0], y: gu.centro[1], op: { nombre: t("bd.guarida"), apagado: !!st.saqueados[gu.i] } }));
    },
    diario() {
      const n = Object.keys(st.saqueados).length;
      return n ? `<div class="diario-resumen"><p><b>${t("bd.guarida")}</b> ${t("bd.diario", [n, guaridas.length])}</p></div>` : "";
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, guaridas, saquear, caida, N };
})();
