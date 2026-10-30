// ---------- los nidos de arañas (sistema ARANAS) ----------
// Como las cuevas de arañas del Skyrim y los nidos del Gothic: en lo hondo del bosque, lejos de los caminos, hay nidos
// de tejedoras. Cada nido es un grupo de HORDAS (familia `aranas`: arañas de musgo que se agachan y saltan en línea, y
// la tejedora, que escupe tela donde está Eromash). Lo nuevo:
//   · Tela en el piso: frena mucho al que la pisa (no al que la salta). El nido tiene tela fija alrededor y la que escupe
//     la tejedora dura 8 s.
//   · Veneno: la mordida de las arañas envenena unos segundos (3 de vida por segundo, nunca mata). Lo cura un trago del
//     frasco o una venda de seda.
//   · Sacos de huevos: con E se cortan y dan seda (material nuevo); a veces revientan y salen dos arañitas. Vuelven a
//     crecer al día siguiente.
//   · Vendas de seda: en cualquier fogata se teje una con 2 de seda; desde la Bolsa curan el veneno y 30 de vida.
// Estado en E.extra.aranas = { cortados: { "n:k": dia }, vendas, veneno }. Textos `ar.` (cr., bs., as., mt.seda).
window.ARANAS = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const M = 30;
  const N = 3,
    RADIO = 120,
    VENENO = 5, // segundos
    VENENO_DPS = 3,
    TELA_R = 62,
    TELA_DURA = 8,
    VENDA_SEDA = 2,
    VENDA_CURA = 30;
  Object.assign(COMBATE.TIPOS, {
    arana: { vida: 60, dano: 12, vel: 3.4 * M, alcance: 5 * M, aviso: 0.75, forma: "carga", largo: 5.5 * M, ancho: 1.4 * M, radio: 20, espera: 1.8, barra: 64, plata: 3 },
    aranaReina: { vida: 130, dano: 18, vel: 1.8 * M, alcance: 9 * M, aviso: 1.2, forma: "lejos", radioGolpe: 1.9 * M, radio: 40, espera: 2.4, barra: 128, plata: 20, pesado: true, rgb: [232, 228, 220], basico: true },
  });
  if (window.BESTIARIO) BESTIARIO.LISTA.push("arana", "aranaReina");
  if (window.MATERIALES) {
    if (!MATERIALES.LISTA.includes("seda")) MATERIALES.LISTA.push("seda");
    Object.assign(MATERIALES.CRIATURAS, { arana: [["seda", 0.35, 1]], aranaReina: [["seda", 1, 3], ["esquirla", 0.3, 1]] });
  }
  const base = () => ({ cortados: {}, vendas: 0, veneno: 0 });
  let st = base();
  const nidos = []; // { n, centro, g, nido, sacos: [cosa] }
  const telas = []; // { x, y, r, hasta (null = fija), n }
  const crias = []; // arañitas sueltas de los sacos

  // ---------- dónde: lo hondo del bosque ----------
  function buscarLugares() {
    const L = W.LUGARES,
      pu = L.puesto.p,
      centros = HORDAS.grupos.map((g) => g.centro),
      rnd = DIB.azar(4471),
      cands = [];
    for (let y = W.BORDE * 1.4; y < W.ALTO - W.BORDE * 1.4; y += 1100) for (let x = W.BORDE * 1.4; x < W.ANCHO - W.BORDE * 1.4; x += 1100) cands.push([x + (rnd() - 0.5) * 500, y + (rnd() - 0.5) * 500, rnd()]);
    cands.sort((a, b) => a[2] - b[2]);
    const elegidos = [];
    for (const [x, y] of cands) {
      if (elegidos.length >= N) break;
      if (Math.hypot(x - pu[0], y - pu[1]) < 6000) continue;
      if (elegidos.some((q) => Math.hypot(q[0] - x, q[1] - y) < 7000)) continue;
      if (W.sueloEn(x, y) !== 0 || !W.libre(x, y, 40)) continue;
      if (!Object.keys(L).every((k) => Math.hypot(x - L[k].p[0], y - L[k].p[1]) > L[k].r + 1500)) continue;
      if (Math.hypot(x - W.CIUDAD.c[0], (y - W.CIUDAD.c[1]) * 1.3) < W.CIUDAD.rx + 1800) continue;
      if (centros.some((q) => Math.hypot(q[0] - x, q[1] - y) < 1800)) continue;
      if (W.CAMINOS.some((c) => W.distLinea(x, y, c.p) < c.w / 2 + 1000)) continue;
      if (W.LAGOS.some((g) => Math.hypot(x - g.p[0], y - g.p[1]) < g.rx + 600)) continue;
      elegidos.push([x, y]);
    }
    return elegidos;
  }
  function armar() {
    HORDAS.FAMILIAS.aranas = { lider: "aranaReina", miembros: ["arana", "arana", "arana", "arana"], totem: null };
    buscarLugares().forEach((c, n) => {
      const x = c[0],
        y = c[1];
      // un claro chico, más abierto hacia adelante
      W.cercanas(x - 600, y - 520, x + 600, y + 1000, (o) => {
        if (!o.arbol && o.id !== "roca" && o.id !== "troncoCaido") return;
        const dy = o.y - y;
        if (Math.hypot(o.x - x, dy > 0 ? dy * 0.6 : dy) > 480) return;
        o.oculto = true;
        o.choque = null;
      });
      const nido = W.agregar("nidoArana", [x, y - 90], { s: 1 });
      const sacos = [[-230, -40], [210, -20], [-120, 150], [160, 170]].map(([dx, dy]) => W.agregar("sacoHuevos", [x + dx, y + dy], { s: 0.9 }));
      // la tela fija alrededor del nido
      [[-170, 60], [120, 70], [0, 200], [-260, 190], [260, 120]].forEach(([dx, dy]) => telas.push({ x: x + dx, y: y + dy, r: TELA_R * 1.2, hasta: null, n }));
      const mas = 1.2 + Math.hypot(x - W.LUGARES.puesto.p[0], y - W.LUGARES.puesto.p[1]) / 14000;
      const g = HORDAS.crearGrupo("aranas", [x, y + 60], { pal: n % 3, mas, conLider: true });
      nidos.push({ n, centro: [x, y], g, nido, sacos, mas });
    });
  }

  // ---------- tela ----------
  const enTela = (x, y) => telas.some((w) => (w.hasta == null || w.hasta > J.t) && Math.hypot(x - w.x, (y - w.y) * 1.25) < w.r);
  function escupir(x, y) {
    telas.push({ x, y, r: TELA_R, hasta: J.t + TELA_DURA, n: -1 });
    if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.4, tono: 0.7, x, y });
  }
  function dibujarTela(c, w) {
    const vida = w.hasta == null ? 1 : Math.min(1, (w.hasta - J.t) / 1.5);
    if (vida <= 0) return;
    c.save();
    c.globalAlpha = 0.55 * vida;
    c.strokeStyle = "#E8E4DC";
    c.lineWidth = 1.4;
    // rayos y anillos de la tela, aplastados al piso
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      c.beginPath();
      c.moveTo(w.x, w.y);
      c.lineTo(w.x + Math.cos(a) * w.r, w.y + (Math.sin(a) * w.r) / 1.25);
      c.stroke();
    }
    for (let r = w.r * 0.3; r <= w.r; r += w.r * 0.23) {
      c.beginPath();
      for (let k = 0; k <= 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        c[k ? "lineTo" : "moveTo"](w.x + Math.cos(a) * r, w.y + (Math.sin(a) * r) / 1.25);
      }
      c.stroke();
    }
    c.restore();
  }

  // ---------- sacos y crías ----------
  const clave = (nd, k) => nd.n + ":" + k;
  const dia = () => Math.floor(A.H.E.tiempo / LUZ.DIA);
  const cortado = (nd, k) => st.cortados[clave(nd, k)] != null && st.cortados[clave(nd, k)] >= dia();
  function cortar(nd, k) {
    if (cortado(nd, k)) return false;
    const s = nd.sacos[k];
    st.cortados[clave(nd, k)] = dia();
    s.o.cortado = true;
    const n = 1 + (Math.random() < 0.5 ? 1 : 0);
    MATERIALES.dar("seda", n, s.x, s.y);
    if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.6, x: s.x, y: s.y });
    // a veces revienta y salen dos arañitas
    if (Math.random() < 0.45 || cortar.siempreCrias) {
      for (let i = 0; i < 2; i++) {
        const e = A.CB.crear("arana", s.x + (i ? 50 : -50), s.y + 40, { pal: nd.n % 3 });
        e.s = 0.6;
        e.d.vida = e.vida = Math.round(e.d.vida * 0.4);
        e.d.dano = Math.round(e.d.dano * 0.6);
        e.d.radio *= 0.6;
        e.d.barra *= 0.6;
        e.d.plata = 1;
        e.activo = true;
        e.estado = "persigue";
        e.cria = true;
        A.enemigos.push(e);
        crias.push(e);
      }
      HUD.aviso(t("ar.crias"), "#C8402D");
    }
    return true;
  }
  function limpiarCrias() {
    for (let i = crias.length - 1; i >= 0; i--) {
      const e = crias[i];
      if (e.muerto > 0.8 || Math.hypot(e.x - jug.x, e.y - jug.y) > 3000) {
        const j = A.enemigos.indexOf(e);
        if (j >= 0) A.enemigos.splice(j, 1);
        crias.splice(i, 1);
      }
    }
  }

  // ---------- veneno y vendas ----------
  function curar(conVida) {
    const habia = st.veneno > 0;
    st.veneno = 0;
    if (conVida) jug.hp = Math.min(jug.hpMax, jug.hp + VENDA_CURA);
    return habia;
  }
  function usarVenda() {
    if (st.vendas <= 0) return false;
    st.vendas--;
    curar(true);
    A.numero(jug.x, jug.y - 90, "+" + VENDA_CURA, "#7BC86C");
    HUD.aviso(t("ar.venda_usada"), "#7BC86C");
    return true;
  }
  function tejer() {
    if (!MATERIALES.alcanza({ seda: VENDA_SEDA })) return HUD.aviso(t("ar.sin_seda", [VENDA_SEDA]), "#C8402D"), false;
    MATERIALES.gastar({ seda: VENDA_SEDA });
    st.vendas++;
    HUD.aviso(t("ar.tejida", [st.vendas]), "#7BC86C");
    return true;
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      armar();
      // quién muerde: J.herir recibe el lugar de quien pega
      const herir = J.herir;
      J.herir = (dano, ox, oy, tipo) => {
        const e = A.enemigos.find((q) => q.activo && !q.muerto && q.x === ox && q.y === oy);
        const hp0 = jug.hp;
        const r = herir(dano, ox, oy, tipo);
        if (e && (e.tipo === "arana" || e.tipo === "aranaReina") && jug.hp < hp0 && !jug.muerto) {
          if (st.veneno <= 0) HUD.aviso(t("ar.envenenado_d"), "#7BC86C");
          st.veneno = VENENO;
        }
        return r;
      };
      INVENTARIO.iconoDe("mt_seda", (c) => {
        DIB.E(c, 0, 4, 20, 22, "#C8C4BC");
        DIB.P(c, [-20, 4, -14, -12, 0, -18, 0, 26, -14, 20], "#9A968E");
        [-10, 0, 10].forEach((y) => DIB.L(c, -18, y, 18, y + 6, "#E8E4DC", 1.4));
      });
      INVENTARIO.iconoDe("ar_venda", (c) => {
        DIB.P(c, [-24, 10, -8, -18, 24, -2, 8, 26], "#E8E4DC");
        DIB.P(c, [-24, 10, -8, -18, -2, -14, -18, 14], "#C8C4BC");
        DIB.P(c, [-4, 2, 4, -6, 12, 2, 4, 10], "#7BC86C");
      });
    },
    alEmpezar(extra) {
      extra.aranas = Object.assign(base(), extra.aranas || {});
      st = extra.aranas;
      for (let i = telas.length - 1; i >= 0; i--) if (telas[i].hasta != null) telas.splice(i, 1);
      crias.splice(0).forEach((e) => {
        const j = A.enemigos.indexOf(e);
        if (j >= 0) A.enemigos.splice(j, 1);
      });
      nidos.forEach((nd) => nd.sacos.forEach((s, k) => (s.o.cortado = cortado(nd, k))));
    },
    actualizar(dt) {
      if (J.modo !== "juego" || J.dentro) return;
      // la tela frena al que la pisa (saltar la cruza)
      if (jug.salto <= 0 && !jug.muerto && enTela(jug.x, jug.y)) {
        jug.lento = Math.max(jug.lento || 0, 0.12);
        jug.enTela = true;
      } else jug.enTela = false;
      // el veneno: nunca mata; un trago del frasco lo cura
      if (st.veneno > 0) {
        st.veneno -= dt;
        if (window.FRASCO && FRASCO.bebiendo()) st.veneno = 0;
        else if (jug.hp > 1) jug.hp = Math.max(1, jug.hp - VENENO_DPS * dt);
      }
      // la tejedora deja tela donde cae lo que escupe
      for (const a of J.avisos) {
        if (a.de && a.de.tipo === "aranaReina" && !a.tela && a.t >= a.dur - 0.05) {
          a.tela = true;
          escupir(a.x, a.y);
        }
      }
      for (let i = telas.length - 1; i >= 0; i--) if (telas[i].hasta != null && telas[i].hasta < J.t) telas.splice(i, 1);
      // los sacos vuelven a crecer al día siguiente
      nidos.forEach((nd) => nd.sacos.forEach((s, k) => s.o.cortado && !cortado(nd, k) && (s.o.cortado = false)));
      limpiarCrias();
    },
    cercanos(dar) {
      if (J.dentro) return;
      for (const nd of nidos)
        nd.sacos.forEach((s, k) => {
          if (cortado(nd, k)) return;
          const d = Math.hypot(s.x - jug.x, s.y - jug.y);
          if (d < RADIO) dar(d, t("ar.cortar"), () => cortar(nd, k), s.x, s.y - 110);
        });
    },
    piso(c, x0, y0, x1, y1) {
      if (J.dentro) return;
      for (const w of telas) if (w.x > x0 - 100 && w.x < x1 + 100 && w.y > y0 - 100 && w.y < y1 + 100) dibujarTela(c, w);
    },
    sobreLuz(c) {
      // burbujas verdes sobre Eromash envenenado
      if (st.veneno <= 0 || J.dentro || (window.CALIDAD && CALIDAD.nivel === "baja")) return;
      for (let k = 0; k < 4; k++) {
        const u = (J.t * 0.9 + k / 4) % 1;
        DIB.alfa(c, (1 - u) * 0.8, () => DIB.E(c, jug.x + Math.sin(k * 2.3 + J.t * 3) * 16, jug.y - 70 - u * 60, 4 - u * 2, 4 - u * 2, "#7BC86C"));
      }
    },
    botonesFogata() {
      return [{ texto: t("ar.tejer", [VENDA_SEDA]), sub: t("ar.tejer_d", [MATERIALES.cuantos("seda"), st.vendas]), fn: tejer }];
    },
    celdasBolsa() {
      return st.vendas > 0 ? [{ id: "ar_venda", icono: "ar_venda", nombre: t("ar.venda"), col: "#7BC86C", desc: t("ar.venda_d", [VENDA_CURA]), cant: st.vendas, fn: usarVenda }] : [];
    },
    efectosHud() {
      return st.veneno > 0 ? [{ texto: t("ar.envenenado"), n: Math.ceil(st.veneno) + " s", col: "#7BC86C" }] : [];
    },
    marcasMapa() {
      return nidos.map((nd) => ({ tipo: "nido", x: nd.centro[0], y: nd.centro[1], op: { nombre: t("ar.nido") } }));
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, nidos, telas, crias, cortar, cortado, enTela, escupir, tejer, usarVenda, curar, VENENO, VENDA_SEDA };
})();
