// ---------- el corredor del norte en el juego (sistema NORTE) ----------
// Paso del Guardián y Antigua tala según «Eldervald — lugares» (versión de Alejandro, 23/10/2026).
//   Paso: la niebla tapa el otro extremo hasta que la runa del Paso vuelve a hablar; los pilares se encienden, el
//   tablero nuevo tiene faroles, la caseta del puentero vuelve a estar habitada y dos guardias de Håkon quedan en la
//   cabecera sur. Se puede mirar la tabla de Orm, leer el poste de los que cruzaron (la tablilla de Geir), examinar
//   la hendidura del pedestal, apoyar la mano en la piedra («Conocía su peso») y, con la Lente, ver el arco tenue
//   por donde cruzaba el Guardián.
//   Tala: los tocones con la marca y la fecha (las fechas se cortan de golpe), el muro de raíces que Eydis reconoce
//   («Esto estaba abierto la última vez»), la cuña de la raíz que se saca después de calmar al custodio (el muro se
//   retira), la caja bajo el banco con el cuaderno de cuentas (se le devuelve a Orm), el tronco de la quilla, los
//   raspones de cornamenta de la quebrada (Lente) y el escondite de los guardasendas con la tablilla de Tove.
window.NORTE = (function () {
  "use strict";
  let A, J, jug, W, H, st;
  const t = (k, v) => I18N.t(k, v);
  let arcoHasta = 0,
    rasponesHasta = 0;

  Object.assign(GENTE.FICHAS, {
    // los dos guardias de Håkon que quedan de puesto fijo en la cabecera sur después de EL-06
    guardia_paso: { nombre: "guardia_paso", alto: 1.04, ancho: 1.1, piel: "#C8987A", pielSombra: "#A87A5E", pelo: "#5A3A2A", barba: "#5A3A2A", ropa: "#5A5E5A", ropaSombra: "#464A46", capa: "#2C4226", capaSombra: "#1E3018", pantalon: "#3A3228", botas: "#241C16", cinto: "#3A2A1A", gorro: "#6E6A6E", lanza: true },
  });
  const guardias = [
    { id: "a", p: "guardia_paso_a", mira: { vista: "S", espejo: false } },
    { id: "b", p: "guardia_paso_b", mira: { vista: "S", espejo: true } },
  ];

  const hablar = (clave, quien) => A.dialogoLibre([[quien || "eromash", clave]]);
  function aplicar() {
    const N = W.NOMBRADAS,
      abierto = H.tiene("runa_paso"),
      reparado = H.tiene("puente_reparado");
    (N.pilares || []).forEach((p) => (p.o.luz = abierto ? 1 : 0.15));
    if (N.caseta) N.caseta.o.habitada = H.completa("EL-06");
    ["farol_paso", "farol_puente_s", "farol_puente_n"].forEach((k) => N[k] && (N[k].o.encendido = reparado));
    if (N.poste_cruzaron) N.poste_cruzaron.o.nuevas = H.completa("EL-06") ? 4 : 0;
    // la tala
    const sacada = H.tiene("cuna_sacada");
    if (N.gran_tocon) N.gran_tocon.o.cuna = !sacada;
    if (N.muro_raices) {
      N.muro_raices.o.abierto = sacada;
      N.muro_raices.roto = sacada;
    }
    if (N.cabana) N.cabana.o.vacia = !!st.cuaderno;
  }
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      H = A.H;
      st = {};
    },
    alEmpezar(extra) {
      extra.norte = Object.assign({}, extra.norte || {});
      st = extra.norte;
      aplicar();
    },
    actualizar() {
      const P = W.PUNTOS,
        N = W.NOMBRADAS;
      // Eydis reconoce el muro (o el jugador encontró la hondonada antes y el muro ya no hace falta mirarlo)
      if (H.en("EL-04") && H.tiene("pista_raiz") && !H.tiene("muro_visto")) {
        const m = P.muro_raices;
        if (H.tiene("custodio_vencido")) H.marcar("muro_visto");
        else if (m && Math.hypot(m[0] - jug.x, m[1] - jug.y) < 380 && J.modo === "juego")
          A.dialogoLibre([["eydis", "nt.muro_1"], ["eromash", "nt.muro_2"], ["eydis", "nt.muro_3"]], () => H.marcar("muro_visto"));
      }
      void N;
      if (!J.dentro) aplicar();
    },
    cercanos(dar) {
      const P = W.PUNTOS,
        N = W.NOMBRADAS,
        cerca = (p, r) => p && Math.hypot(p[0] - jug.x, p[1] - jug.y) < r,
        cosa = (o, dy) => o && [o.x, o.y + (dy || 0)];
      // el Paso
      if (cerca(cosa(N.tabla_puente, 30), 110)) dar(70, t("nt.accion_tabla"), () => hablar(H.tiene("puente_reparado") ? "nt.tabla_hecha" : "nt.tabla"));
      if (cerca(cosa(N.poste_cruzaron, 30), 110))
        dar(70, t("nt.accion_poste"), () => {
          const primera = !st.geir;
          st.geir = 1;
          A.dialogoLibre(primera ? [["eromash", "nt.poste_1"], ["eromash", "nt.poste_geir"]] : [["eromash", H.completa("EL-06") ? "nt.poste_nuevas" : "nt.poste_1"]]);
        });
      if (cerca(P.pedestal, 120)) {
        if (!st.hendidura) dar(80, t("nt.accion_hendidura"), () => ((st.hendidura = 1), hablar("nt.hendidura")));
        else if (!st.mano && H.tiene("nucleo_puesto"))
          dar(80, t("nt.accion_mano"), () => {
            st.mano = 1;
            jug.interactuando = 0.8;
            A.dialogoLibre([["eromash", "nt.mano_1"], ["voz", "nt.mano_2"]]);
          });
      }
      if (cerca(cosa(N.farol_paso, 20), 90) && !H.tiene("puente_reparado")) dar(85, t("nt.accion_farol"), () => hablar("nt.farol"));
      if (cerca(cosa(N.torno, 30), 110)) dar(85, t("nt.accion_torno"), () => hablar("nt.torno"));
      if (H.completa("EL-06"))
        for (const g of guardias) {
          const p = P[g.p];
          if (cerca(p, 100)) dar(60, t("av.accion_hablar") + " · " + t("av.nombre_guardia_paso"), () => A.dialogoLibre([["guardia_paso", "nt.guardia_" + g.id]]));
        }
      // la tala
      for (const tc of N.tocones || [])
        if (cerca(cosa(tc, 10), 80))
          dar(75, t("nt.accion_tocon"), () => hablar(tc.o.k >= 8 ? "nt.tocon_ultimo" : "nt.tocon", null));
      if (H.tiene("custodio_vencido") && !H.tiene("cuna_sacada") && cerca(P.hondonada, 140))
        dar(30, t("nt.accion_cuna"), () => {
          jug.interactuando = 1;
          A.dialogoLibre([["eromash", "nt.cuna_1"], ["eromash", "nt.cuna_2"]], () => {
            H.marcar("cuna_sacada");
            aplicar();
            HUD.aviso(t("nt.muro_abierto"), "#73D5DB");
          });
        });
      if (!st.cuaderno && cerca(P.caja, 100))
        dar(60, t("nt.accion_caja"), () => {
          st.cuaderno = 1;
          aplicar();
          A.dialogoLibre([["eromash", "nt.caja_1"], ["eromash", "nt.caja_2"]]);
        });
      const orm = A.npcs.orm;
      if (st.cuaderno === 1 && orm && cerca([orm.x, orm.y], 130))
        dar(48, t("nt.accion_dar_cuaderno"), () => {
          st.cuaderno = 2;
          if (window.PODERES) PODERES.darPlata(20);
          A.dialogoLibre([["orm", "nt.orm_cuaderno_1"], ["orm", "nt.orm_cuaderno_2"]]);
        });
      if (cerca(cosa(N.tronco_quilla, 10), 110)) dar(80, t("nt.accion_quilla"), () => hablar("nt.quilla"));
      if (!st.escondite && cerca(P.escondite, 100))
        dar(60, t("nt.accion_escondite"), () => {
          st.escondite = 1;
          jug.hp = jug.hpMax;
          if (window.PODERES) PODERES.darPlata(8);
          A.dialogoLibre([["eromash", "nt.escondite_1"], ["eromash", "nt.escondite_2"]]);
        });
    },
    lente(x, y) {
      const P = W.PUNTOS;
      let algo = false;
      if (P.puente && Math.hypot(P.puente[0] - x, P.puente[1] - y) < 1100) {
        arcoHasta = J.t + 9;
        if (!st.arco) {
          st.arco = 1;
          J.retrasar(0.6, () => hablar("nt.arco"));
        }
        algo = true;
      }
      if (P.raspones && Math.hypot(P.raspones[0] - x, P.raspones[1] - y) < 700) {
        rasponesHasta = J.t + 9;
        if (!st.raspones) {
          st.raspones = 1;
          J.retrasar(0.6, () => hablar("nt.raspones"));
        }
        algo = true;
      }
      return algo;
    },
    cuerpos(f) {
      if (!H.completa("EL-06")) return;
      for (const g of guardias) {
        const p = W.PUNTOS[g.p];
        if (p) f(p[0], p[1], 36);
      }
    },
    objetos(lista, visible, c) {
      const P = W.PUNTOS,
        PU = W.PUENTES[0];
      // la niebla del otro lado, hasta que la runa del Paso habla
      if (!H.tiene("runa_paso") && visible(PU.b[0], PU.b[1])) {
        const baja = window.CALIDAD && CALIDAD.nivel === "baja";
        lista.push({
          x: PU.b[0],
          pie: PU.b[1],
          y: PU.b[1] + 40,
          f: () => {
            const n = baja ? 3 : 9;
            for (let k = 0; k < n; k++) {
              const u = k / n,
                x = PU.b[0] + Math.sin(J.t * 0.2 + k * 2.1) * 260 + (u - 0.5) * 900,
                y = PU.b[1] - 60 + Math.cos(J.t * 0.17 + k) * 40 - (k % 3) * 70;
              DIB.alfa(c, 0.32, () => DIB.E(c, x, y, 360, 120, "#AEB4B2"));
            }
          },
        });
      }
      // el arco tenue del Guardián (Lente)
      if (arcoHasta > J.t) {
        const a = Math.min(1, (arcoHasta - J.t) / 2) * 0.6;
        lista.push({
          y: 1e9 - 1,
          f: () =>
            DIB.alfa(c, a, () => {
              const x0 = PU.a[0] - 260,
                x1 = PU.b[0] - 260,
                y0 = PU.a[1],
                y1 = PU.b[1];
              c.beginPath();
              c.moveTo(x0, y0);
              c.quadraticCurveTo((x0 + x1) / 2 - 420, (y0 + y1) / 2 - 300, x1, y1);
              c.strokeStyle = DIB.RUNICO;
              c.lineWidth = 10;
              c.stroke();
              for (let k = 0; k < 6; k++) DIB.E(c, x1 + 30 + k * 26, y1 - 140 + k * 26, 6, 4, DIB.RUNICO); // la huella que baja del norte
            }),
        });
      }
      // los raspones de cornamenta a la altura de un techo (Lente)
      if (rasponesHasta > J.t && P.raspones) {
        const a = Math.min(1, (rasponesHasta - J.t) / 2) * 0.8,
          [rx, ry] = P.raspones;
        lista.push({
          x: rx,
          y: ry,
          f: () =>
            DIB.alfa(c, a, () => {
              for (let k = 0; k < 5; k++) DIB.L(c, rx - 200 + k * 22, ry - 300 - k * 6, rx - 120 + k * 22, ry - 270 - k * 6, DIB.RUNICO, 3);
              for (let k = 0; k < 5; k++) DIB.L(c, rx + 180 + k * 22, ry - 310 + k * 6, rx + 260 + k * 22, ry - 280 + k * 6, DIB.RUNICO, 3);
            }),
        });
      }
      // los guardias de la cabecera sur
      if (H.completa("EL-06"))
        for (const g of guardias) {
          const p = P[g.p];
          if (!p || !visible(p[0], p[1])) continue;
          lista.push({ x: p[0], y: p[1], f: () => GENTE.dibujar(c, "guardia_paso", p[0], p[1], J.t, g.mira) });
        }
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return {};
})();
