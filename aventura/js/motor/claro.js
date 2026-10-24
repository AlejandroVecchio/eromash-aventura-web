// ---------- el Claro del Ciervo en el juego (sistema CLARO) ----------
// La cuenca épica según «Eldervald — lugares» (Alejandro, 23/10/2026): un solo haz de luz fría que cae sobre el
// centro y se ensancha al romper el tercer soporte, niebla baja al ras del suelo que se levanta al final; al caer cada
// menhir su mancha enferma se retrae y se derrumba el arco de astas más cercano. Para el curioso: la cinta de la
// madre de Eydis (después de la pelea, con su línea), la cama de musgo, el apostadero de la loma con su cofre y la
// vista del Claro entero, y el hilo que se va hacia la fisura del norte (con la Lente).
window.CLARO = (function () {
  "use strict";
  let A, J, jug, W, H, st;
  const t = (k, v) => I18N.t(k, v);
  let rotos = -1,
    hiloHasta = 0;
  const hablar = (clave, quien) => A.dialogoLibre([[quien || "eromash", clave]]);

  function aplicar() {
    const N = W.NOMBRADAS;
    if (!N.soportes) return;
    N.soportes.forEach((sp, i) => {
      const m = N.manchas && N.manchas[i];
      if (m && m.o.retraida !== !!sp.o.roto) {
        m.o.retraida = !!sp.o.roto;
        W.invalidar(m.x, m.y);
      }
      // el arco de astas más cercano se derrumba con su soporte
      if (sp.o.roto && N.arcos) {
        let mejor = null,
          dm = 1e9;
        for (const a of N.arcos) {
          if (a.o.cinta) continue;
          const d = Math.hypot(a.x - sp.x, a.y - sp.y);
          if (d < dm) (dm = d), (mejor = a);
        }
        if (mejor) mejor.o.caido = true;
      }
    });
    if (N.apostadero) N.apostadero.o.abierto = !!st.cofre;
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
      extra.claro = Object.assign({}, extra.claro || {});
      st = extra.claro;
      rotos = -1;
      aplicar();
    },
    actualizar() {
      const N = W.NOMBRADAS;
      if (!N.soportes) return;
      // los hilos vibran mientras el Ciervo embiste
      const cv = A.ciervo,
        vib = cv && cv.activo && cv.ataque === "embestida" && (cv.estado === "golpe" || cv.estado === "aviso") ? 1 : 0;
      N.soportes.forEach((s0) => (s0.o.vibra = vib));
      const n = N.soportes.filter((s0) => s0.o.roto).length;
      if (n !== rotos) {
        rotos = n;
        aplicar();
      }
    },
    cercanos(dar) {
      const P = W.PUNTOS,
        cerca = (p, r) => p && Math.hypot(p[0] - jug.x, p[1] - jug.y) < r;
      if (A.ciervo && A.ciervo.activo) return;
      if (cerca(P.cinta, 120))
        dar(60, t("cl.accion_cinta"), () =>
          H.tiene("ciervo_vencido") && !st.cinta
            ? ((st.cinta = 1), A.dialogoLibre([["eromash", "cl.cinta_1"], ["eydis", "cl.cinta_2"]]))
            : hablar("cl.cinta"),
        );
      if (cerca(P.cama_musgo, 220)) dar(70, t("cl.accion_cama"), () => hablar("cl.cama"));
      if (cerca(P.apostadero, 140))
        dar(55, t(st.cofre ? "cl.accion_mirar" : "cl.accion_cofre"), () => {
          if (window.MAPA) MAPA.descubrir(W.LUGARES.claro.p[0], W.LUGARES.claro.p[1], 2600);
          if (!st.cofre) {
            st.cofre = 1;
            aplicar();
            if (window.PODERES) PODERES.darPlata(25);
            A.dialogoLibre([["eromash", "cl.cofre"], ["eromash", "cl.loma"]]);
          } else hablar("cl.loma");
        });
    },
    lente(x, y) {
      const P = W.PUNTOS;
      if (P.hilo && Math.hypot(P.hilo[0] - x, P.hilo[1] - y) < 600) {
        hiloHasta = J.t + 10;
        if (!st.hilo) {
          st.hilo = 1;
          H.anotar && H.anotar("diario_hilo");
          J.retrasar(0.6, () => hablar("cl.hilo"));
        }
        return true;
      }
      return false;
    },
    objetos(lista, visible, c) {
      const L0 = W.LUGARES.claro,
        [cx, cy] = L0.p;
      if (!visible(cx, cy) && Math.hypot(jug.x - cx, jug.y - cy) > L0.r * 1.4) return;
      const baja = window.CALIDAD && CALIDAD.nivel === "baja";
      const libre = rotos >= 3 || H.tiene("ciervo_vencido");
      // el haz de luz fría, desde la abertura de la copa
      lista.push({
        y: 1e9 - 2,
        f: () => {
          const w0 = libre ? 520 : 300,
            g = c.createLinearGradient(0, cy - 1400, 0, cy + 200);
          g.addColorStop(0, "rgba(200,230,240,0)");
          g.addColorStop(1, `rgba(200,230,240,${libre ? 0.16 : 0.11})`);
          c.fillStyle = g;
          c.beginPath();
          c.moveTo(cx - w0 * 0.5, cy - 1400);
          c.lineTo(cx + w0 * 0.5, cy - 1400);
          c.lineTo(cx + w0 * 1.6, cy + 200);
          c.lineTo(cx - w0 * 1.6, cy + 200);
          c.fill();
        },
      });
      // la niebla baja, que se levanta al final
      if (!libre && !baja)
        lista.push({
          y: cy - L0.r,
          f: () => {
            for (let k = 0; k < 10; k++) {
              const a = (k / 10) * DIB.TAU + J.t * 0.03,
                r = L0.r * (0.45 + (k % 3) * 0.18);
              DIB.alfa(c, 0.13, () => DIB.E(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8, 420, 90, "#B8C4C0"));
            }
          },
        });
      // el hilo que se va (Lente): del menhir a la fisura del norte
      const N = W.NOMBRADAS;
      if (hiloHasta > J.t && N.fisura && N.soportes) {
        const a = Math.min(1, (hiloHasta - J.t) / 2) * 0.8,
          s0 = N.soportes[0];
        lista.push({
          y: 1e9 - 1,
          f: () =>
            DIB.alfa(c, a, () => {
              c.beginPath();
              c.moveTo(s0.x, s0.y);
              c.quadraticCurveTo((s0.x + N.fisura.x) / 2 + 200, (s0.y + N.fisura.y) / 2, N.fisura.x, N.fisura.y - 20);
              c.strokeStyle = DIB.VIOLETA;
              c.lineWidth = 3;
              c.stroke();
            }),
        });
      }
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return {};
})();
