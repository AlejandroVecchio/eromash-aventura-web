// ---------- las piedras viejas (sistema RITOS) ----------
// Dos clases de piedra nuevas en el bosque:
// · Las piedras del camino: piedras de memoria al borde de los caminos. Leerlas cuenta quién la levantó y por quién,
//   y descubre en el mapa todo lo de alrededor (como subirse a un mirador).
// · Las piedras del rito: cada una pide algo distinto para despertar y suelta el sello de su cofre:
//   brasa (Kenaz), escarcha (Isa), luna (solo de noche), sangre (ofrendar vida), silencio (quedarse quieto),
//   carrera (llegar a la gemela antes de que se apague), eco (tocar las tres en el orden de sus muescas) y
//   guardián (vencer a los muertos que despierta).
// Todo sale de una semilla fija y lo hecho se guarda en la ranura (extra.ritos).
window.RITOS = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const rnd = DIB.azar(7031024);
  const camino = [], // { id, cosa }
    ritos = []; // { id, tipo, piedras: [cosa], cofre: cosa, centro, botin }
  let st = null,
    enCurso = null; // { rito, tipo, t, lim, ... } el rito que se está haciendo (silencio, carrera, eco, guardián)
  const RUNAS_CAMINO = ["raidho", "ehwaz", "mannaz", "othala", "jera", "berkano", "ingwaz", "wunjo", "fehu", "laguz", "tiwaz", "dagaz"];
  const INSCRIPCIONES = 12;

  const lejos = (p, lista, d) => lista.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > d);
  function hueco(p, r) {
    for (let k = 0; k < 160; k++) {
      const a = k * 2.4,
        d = k * 24,
        x = p[0] + Math.cos(a) * d,
        y = p[1] + Math.sin(a) * d * 0.8;
      if (!W.libre(x, y, r) || !W.libre(x - r, y, r) || !W.libre(x + r, y, r)) continue;
      if (W.CAMINOS.some((c) => W.distLinea(x, y, c.p) < c.w / 2 + 120)) continue;
      return [x, y];
    }
    return null;
  }
  function claro(p, radio) {
    W.cercanas(p[0] - radio, p[1] - radio, p[0] + radio, p[1] + radio, (o) => {
      if (o.arbol && Math.hypot(o.x - p[0], (o.y - p[1]) * 1.2) < radio) {
        o.oculto = true;
        o.choque = null;
      }
    });
  }
  const masDe = (p) => 1 + Math.hypot(p[0] - W.LUGARES.puesto.p[0], p[1] - W.LUGARES.puesto.p[1]) / 12000;
  const enCiudad = (p, m) => Math.hypot(p[0] - W.CIUDAD.c[0], (p[1] - W.CIUDAD.c[1]) * 1.3) < W.CIUDAD.rx + m;

  // ---------- armar ----------
  function armar() {
    // piedras del camino: una cada tanto, a un costado y al otro
    const puestas = [];
    W.CAMINOS.forEach((cm) => {
      let falta = 900 + rnd() * 800,
        lado = rnd() < 0.5 ? -1 : 1;
      for (let i = 1; i < cm.p.length; i++) {
        const [ax, ay] = cm.p[i - 1],
          [bx, by] = cm.p[i],
          l = Math.hypot(bx - ax, by - ay);
        let u = 0;
        while (u + falta < l) {
          u += falta;
          falta = 1500 + rnd() * 700;
          const nx = -(by - ay) / l,
            ny = (bx - ax) / l,
            cx = ax + ((bx - ax) * u) / l,
            cy = ay + ((by - ay) * u) / l;
          // a un costado del camino; si ahí hay un árbol o una roca, del otro costado o un poco más afuera
          let p = null;
          for (const [sd, d] of [[lado, cm.w / 2 + 70], [-lado, cm.w / 2 + 70], [lado, cm.w / 2 + 140], [-lado, cm.w / 2 + 140]]) {
            const q = [cx + nx * d * sd, cy + ny * d * sd];
            if (W.libre(q[0], q[1], 26)) {
              p = q;
              break;
            }
          }
          lado = -lado;
          if (!p || enCiudad(p, 500) || !lejos(p, puestas, 1100)) continue;
          claro(p, 90);
          const runas = [0, 1, 2].map(() => RUNAS_CAMINO[Math.floor(rnd() * RUNAS_CAMINO.length)]);
          camino.push({ id: camino.length, cosa: W.agregar("piedraCamino", p, { sem: rnd() * 10, runas, s: 1.05 }) });
          puestas.push(p);
        }
        falta -= l - u;
      }
    });
    // piedras del rito, repartidas lejos unas de otras y de los lugares de la historia
    const usados = Object.values(W.LUGARES).map((L) => L.p);
    const sitio = (minD) => {
      for (let k = 0; k < 400; k++) {
        const p = [W.BORDE * 1.4 + rnd() * (W.ANCHO - W.BORDE * 2.8), W.BORDE * 1.1 + rnd() * (W.ALTO - W.BORDE * 2.4)];
        if (enCiudad(p, 900) || !lejos(p, usados, minD)) continue;
        const q = hueco(p, 60);
        if (!q) continue;
        usados.push(q);
        return q;
      }
      return null;
    };
    const plan = ["brasa", "escarcha", "luna", "sangre", "silencio", "guardian", "eco", "carrera", "brasa", "escarcha", "luna", "sangre", "silencio", "guardian", "eco", "carrera"];
    plan.forEach((tipo) => {
      const p = sitio(2600);
      if (!p) return;
      claro(p, tipo === "eco" ? 520 : 340);
      const r = { id: ritos.length, tipo, piedras: [], centro: p };
      const piedra = (q, o = {}) => r.piedras.push(W.agregar("piedraRito", q, Object.assign({ tipo, sem: rnd() * 10, s: 1.1 }, o)));
      if (tipo === "eco") {
        const marcas = [1, 2, 3].sort(() => rnd() - 0.5);
        [0, 1, 2].forEach((k) => {
          const a = (k / 3) * Math.PI * 2 + 0.5;
          piedra([p[0] + Math.cos(a) * 300, p[1] + Math.sin(a) * 220], { marca: marcas[k] });
        });
      } else if (tipo === "carrera") {
        piedra([p[0] - 120, p[1]]);
        // la gemela, del otro lado del bosque cercano
        let q = null;
        for (let k = 0; k < 40 && !q; k++) {
          const a = rnd() * Math.PI * 2,
            d = 1900 + rnd() * 700,
            c = [p[0] + Math.cos(a) * d, p[1] + Math.sin(a) * d * 0.8];
          if (c[0] < W.BORDE * 1.3 || c[1] < W.BORDE || c[0] > W.ANCHO - W.BORDE * 1.3 || c[1] > W.ALTO - W.BORDE * 1.3 || enCiudad(c, 600)) continue;
          q = hueco(c, 40);
        }
        if (!q) return;
        claro(q, 240);
        piedra(q, { gemela: true });
      } else piedra([p[0] - 120, p[1]]);
      const cq = tipo === "eco" ? p : [p[0] + 110, p[1] + 20];
      r.cofre = W.agregar("cofreRunico", cq, { sellado: true, sem: rnd() * 10, s: 1.05 });
      const k = masDe(p);
      r.botin = { plata: Math.round((90 + rnd() * 70) * k), vida: rnd() < 0.5, manzana: tipo === "guardian" || tipo === "carrera" };
      ritos.push(r);
    });
  }

  // ---------- aplicar lo guardado ----------
  function aplicar() {
    camino.forEach((p) => (p.cosa.o.leida = !!st.camino[p.id]));
    ritos.forEach((r) => {
      const v = !!st.ritos[r.id];
      r.piedras.forEach((q) => {
        q.o.viva = v;
        q.o.carga = 0;
      });
      r.cofre.o.sellado = !v;
      r.cofre.o.abierto = !!st.cofres[r.id];
    });
    cancelar(false);
  }

  // ---------- el rito cumplido ----------
  function despertar(r) {
    if (st.ritos[r.id]) return;
    st.ritos[r.id] = true;
    r.piedras.forEach((q) => {
      q.o.viva = true;
      q.o.carga = 0;
      A.ondaPor([[q.x, q.y], [r.cofre.x, r.cofre.y]], 1.1);
    });
    r.cofre.o.sellado = false;
    J.sacudir(0.2);
    if (window.VIDA) r.piedras.forEach((q) => VIDA.evento("rito", q.x, q.y - 70, { col: ASSETS.RITO[r.tipo].col, runa: ASSETS.RITO[r.tipo].runa }));
    const n = Object.keys(st.ritos).length;
    HUD.aviso(t("pr.rito_hecho", [t("pr.tipo_" + r.tipo), n, ritos.length]), ASSETS.RITO[r.tipo].col);
  }
  function abrirCofre(r) {
    if (r.cofre.o.sellado) {
      // se sacude y la luz corre hasta sus piedras
      SECRETOS.sacudir(r.cofre);
      if (window.ANIMA) ANIMA.gesto("duda");
      r.piedras.forEach((q) => A.ondaPor([[r.cofre.x, r.cofre.y], [q.x, q.y]], 0.9));
      return A.avisar("pr.cofre_sellado_" + r.tipo, ASSETS.RITO[r.tipo].col);
    }
    jug.interactuando = 0.3;
    J.retrasar(0.18, () => {
      st.cofres[r.id] = true;
      r.cofre.o.abierto = true;
      PODERES.botinCofre(r.cofre.x, r.cofre.y + 10, t("pr.cofre_rito"), Object.assign({}, r.botin, { frag: 1 }), true);
    });
  }
  function cancelar(avisar, clave) {
    if (!enCurso) return;
    const r = enCurso.rito;
    if (enCurso.tipo === "guardian")
      enCurso.guardianes.forEach((e) => {
        e.activo = false;
        e.muerto = 1;
      });
    if (!st.ritos[r.id]) r.piedras.forEach((q) => (q.o.carga = 0));
    enCurso = null;
    if (avisar) A.avisar(clave, "#E0B2B2");
  }

  // ---------- empezar cada rito ----------
  function tocar(r, q) {
    const tipo = r.tipo;
    if (tipo === "brasa" || tipo === "escarcha") return A.avisar(PODERES.tiene(tipo === "brasa" ? "kenaz" : "isa") ? "pr.pide_" + tipo : "pr.pide_" + tipo + "_sin");
    if (tipo === "luna") {
      if (A.noche() > 0.6) {
        jug.interactuando = 0.7;
        J.marcas.push({ tipo: "anillo", x: q.x, y: q.y, s: 2, col: "#DDE6F2", t: 0 });
        return J.retrasar(0.6, () => despertar(r));
      }
      return A.avisar("pr.luna_dia");
    }
    if (tipo === "sangre") {
      return A.menu(`<h2>${t("pr.sangre_titulo")}</h2><div class="sub">${t("pr.sangre_sub")}</div>`, [
        {
          texto: t("pr.sangre_si"),
          fn: () => {
            A.cerrarMenu();
            if (jug.hp <= 26) return A.avisar("pr.sangre_poca");
            jug.hp -= 25;
            jug.herido = 0.3;
            A.numero(jug.x, jug.y - 70, 25);
            jug.interactuando = 0.8;
            J.retrasar(0.7, () => despertar(r));
          },
        },
        { texto: t("pr.sangre_no"), fn: A.cerrarMenu },
      ]);
    }
    if (tipo === "silencio") {
      cancelar(false);
      enCurso = { rito: r, tipo, t: 0, lim: 6, x: jug.x, y: jug.y };
      return A.avisar("pr.silencio_empieza", "#9A6BD8");
    }
    if (tipo === "carrera") {
      if (q.o.gemela) return A.avisar("pr.carrera_otra");
      cancelar(false);
      const meta = r.piedras[1],
        d = Math.hypot(meta.x - q.x, meta.y - q.y),
        lim = Math.round(d / 210 + 6);
      enCurso = { rito: r, tipo, t: 0, lim, meta };
      A.ondaPor([[q.x, q.y], [meta.x, meta.y]], 1.4);
      return HUD.aviso(t("pr.carrera_empieza", [lim]), "#FFD98A");
    }
    if (tipo === "eco") {
      if (!enCurso || enCurso.rito !== r) {
        cancelar(false);
        enCurso = { rito: r, tipo, sig: 1 };
      }
      if (q.o.carga >= 1) return;
      if (q.o.marca === enCurso.sig) {
        q.o.carga = 1;
        J.marcas.push({ tipo: "anillo", x: q.x, y: q.y, s: 1, col: "#73D5DB", t: 0 });
        enCurso.sig++;
        if (enCurso.sig > 3) {
          enCurso = null;
          J.retrasar(0.4, () => despertar(r));
        }
      } else {
        r.piedras.forEach((p) => (p.o.carga = 0));
        enCurso = null;
        J.sacudir(0.15);
        A.avisar("pr.eco_mal", "#E0B2B2");
      }
      return;
    }
    if (tipo === "guardian") {
      cancelar(false);
      const k = masDe(r.centro),
        pal = Math.floor(Math.random() * 3),
        guardianes = [];
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        guardianes.push(A.CB.crear(i % 2 ? "errante" : "draugr", q.x + Math.cos(a) * 260, q.y + Math.sin(a) * 180, { pal, grupo: guardianes, mas: k }));
      }
      guardianes.push(A.CB.crear("draugr", q.x + 40, q.y + 200, { pal: (pal + 1) % 3, grupo: guardianes, mas: k, lider: HORDAS.liderNuevo() }));
      guardianes.forEach((e) => {
        e.estado = "persigue";
        A.enemigos.push(e);
        J.marcas.push({ tipo: "anillo", x: e.x, y: e.y, s: 1, col: "#F5A524", t: 0 });
      });
      enCurso = { rito: r, tipo, guardianes };
      J.sacudir(0.3);
      return A.avisar("pr.guardian_empieza", "#F5A524");
    }
  }

  // ---------- lectura de las piedras del camino ----------
  function leer(p) {
    jug.interactuando = 0.6;
    const nueva = !st.camino[p.id];
    A.dialogoLibre([["piedraCamino", "pr.camino_" + (p.id % INSCRIPCIONES)]], () => {
      if (!nueva) return;
      st.camino[p.id] = true;
      p.cosa.o.leida = true;
      MAPA.descubrir(p.cosa.x, p.cosa.y, 3000);
      PODERES.darPlata(10);
      const n = Object.keys(st.camino).length;
      HUD.aviso(t("pr.camino_leida", [n, camino.length]), "#C8402D");
    });
  }

  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      armar();
      st = { camino: {}, ritos: {}, cofres: {} };
      aplicar();
    },
    alEmpezar(extra) {
      extra.ritos = Object.assign({ camino: {}, ritos: {}, cofres: {} }, extra.ritos || {});
      st = extra.ritos;
      aplicar();
    },
    actualizar(dt) {
      if (!enCurso) return;
      const e = enCurso,
        r = e.rito;
      if (jug.muerto) return cancelar(false);
      if (e.tipo === "silencio") {
        if (Math.hypot(jug.x - e.x, jug.y - e.y) > 30 || jug.atk) return cancelar(true, "pr.silencio_roto");
        e.t += dt;
        r.piedras[0].o.carga = Math.min(1, e.t / e.lim);
        if (e.t >= e.lim) {
          enCurso = null;
          despertar(r);
        }
      } else if (e.tipo === "carrera") {
        e.t += dt;
        r.piedras[1].o.carga = Math.min(1, e.t / e.lim);
        r.piedras[0].o.carga = 1 - Math.min(1, e.t / e.lim);
        if (Math.hypot(jug.x - e.meta.x, jug.y - (e.meta.y + 30)) < 150) {
          enCurso = null;
          despertar(r);
        } else if (e.t > e.lim) cancelar(true, "pr.carrera_tarde");
      } else if (e.tipo === "guardian") {
        if (Math.hypot(jug.x - r.centro[0], jug.y - r.centro[1]) > 2600) return cancelar(true, "pr.guardian_huiste");
        if (e.guardianes.every((g) => g.muerto > 0)) {
          enCurso = null;
          J.retrasar(0.8, () => despertar(r));
        }
      }
    },
    alRuna(runa, zona) {
      ritos.forEach((r) => {
        if (st.ritos[r.id]) return;
        if ((r.tipo === "brasa" && runa === "kenaz") || (r.tipo === "escarcha" && runa === "isa")) {
          const q = r.piedras[0];
          if (A.CB.contiene(zona, q.x, q.y) || Math.hypot(q.x - zona.x, q.y - zona.y) < 140) despertar(r);
        }
      });
    },
    alMorir(e) {
      if (!enCurso || enCurso.tipo !== "guardian" || !enCurso.guardianes.includes(e)) return;
      if (e.lider || Math.random() < 0.4) PODERES.soltar(e.x, e.y, "plata", Math.round(e.d.plata * (e.lider ? 1 : 0.6) * (window.ECONOMIA ? ECONOMIA.deCriatura(e, 100) / 100 : 1)));
    },
    cercanos(dar) {
      for (const p of camino) {
        const d = Math.hypot(p.cosa.x - jug.x, p.cosa.y + 30 - jug.y);
        if (d < 120) dar(d, t(st.camino[p.id] ? "pr.accion_releer" : "pr.accion_leer"), () => leer(p));
      }
      for (const r of ritos) {
        if (!st.cofres[r.id]) {
          const d = Math.hypot(r.cofre.x - jug.x, r.cofre.y + 10 - jug.y);
          if (d < 100) dar(d, t(r.cofre.o.sellado ? "sx.accion_sellado" : "sx.accion_cofre"), () => abrirCofre(r));
        }
        if (st.ritos[r.id]) continue;
        for (const q of r.piedras) {
          const d = Math.hypot(q.x - jug.x, q.y + 30 - jug.y);
          if (d < 130) dar(d, t("pr.accion_" + r.tipo), () => tocar(r, q));
        }
      }
    },
    luces(dar, x0, y0, x1, y1) {
      const dentro = (o, m) => o.x > x0 - m && o.x < x1 + m && o.y > y0 - m && o.y < y1 + m;
      ritos.forEach((r) => {
        const col = ASSETS.RITO[r.tipo].col;
        r.piedras.forEach((q) => {
          if (!dentro(q, 600)) return;
          const v = q.o.viva ? 1 : q.o.carga || 0;
          dar({ x: q.x, y: q.y - 70, r: 140 + v * 300, col, f: 0.45 + v * 0.5 + (q.o.viva ? 0 : Math.sin(J.t * 1.3 + q.x) * 0.1) });
        });
        if (dentro(r.cofre, 300) && !st.cofres[r.id]) dar({ x: r.cofre.x, y: r.cofre.y - 30, r: 180, col: r.cofre.o.sellado ? "#9A6BD8" : "#73D5DB", f: 0.75 });
      });
      camino.forEach((p) => dentro(p.cosa, 300) && p.cosa.o.leida && dar({ x: p.cosa.x + 34, y: p.cosa.y - 20, r: 150, col: "#FFD98A", f: 0.7 + Math.sin(J.t * 9 + p.id) * 0.06 }));
    },
    objetos(lista, visible, c) {
      if (!enCurso) return;
      // la carrera: flecha en el piso hacia la gemela y los segundos que quedan
      if (enCurso.tipo === "carrera") {
        const e = enCurso,
          a = Math.atan2(e.meta.y - jug.y, e.meta.x - jug.x),
          resta = Math.max(0, Math.ceil(e.lim - e.t));
        lista.push({ x: jug.x, pie: jug.y, y: jug.y - 1, f: () => {
          const x = jug.x + Math.cos(a) * 70,
            y = jug.y + Math.sin(a) * 50;
          c.save();
          c.translate(x, y);
          c.rotate(a);
          c.scale(1, 0.75);
          DIB.alfa(c, 0.85, () => DIB.P(c, [18, 0, -10, -12, -4, 0, -10, 12], "#FFD98A"));
          c.restore();
        } });
        lista.push({ x: jug.x, pie: jug.y, y: jug.y + 5, f: () => {
          c.font = '800 22px "Eromash Text", system-ui, sans-serif';
          c.textAlign = "center";
          c.lineWidth = 4;
          c.strokeStyle = "#111111";
          c.strokeText(resta, jug.x, jug.y - 92);
          c.fillStyle = resta <= 3 ? "#FF8D71" : "#FFD98A";
          c.fillText(resta, jug.x, jug.y - 92);
        } });
      }
      // el silencio: un anillo violeta que se cierra alrededor de Eromash
      if (enCurso.tipo === "silencio") {
        const u = enCurso.t / enCurso.lim;
        lista.push({ x: jug.x, pie: jug.y, y: jug.y - 2, f: () => {
          c.save();
          c.strokeStyle = "#9A6BD8";
          c.lineWidth = 4;
          c.globalAlpha = 0.8;
          c.beginPath();
          c.ellipse(jug.x, jug.y, 60, 42, 0, -Math.PI / 2, -Math.PI / 2 + u * Math.PI * 2);
          c.stroke();
          c.restore();
        } });
      }
    },
    seguimiento() {
      const n = (o) => Object.keys(o).filter((k) => o[k]).length;
      const o = (clave, a, b) => ({ texto: t(clave, [a, b]), estado: a >= b ? "hecho" : "actual" });
      return {
        secundaria: true,
        id: "piedras",
        rotulo: t("pr.seg_rotulo"),
        nombre: t("pr.seg_nombre"),
        objetivos: [o("pr.seg_camino", n(st.camino), camino.length), o("pr.seg_ritos", n(st.ritos), ritos.length)],
      };
    },
    diario() {
      if (!st) return "";
      const n = (o) => Object.keys(o).filter((k) => o[k]).length;
      return `<div class="diario-resumen"><p><b>${t("pr.seg_nombre")}</b> ${t("pr.diario_txt", [n(st.camino), camino.length, n(st.ritos), ritos.length])}</p></div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return {
    lista: () => ({ camino, ritos, st }),
  };
})();
