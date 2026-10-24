// ---------- el este en el juego (sistema ESTE) ----------
// Aserradero de Orm y Santuario de las Raíces según «Eldervald — lugares» (versión de Alejandro, 23/10/2026).
//   Aserradero: quieto cuando llega Eromash (la compuerta bajada, la rueda trabada, la sierra con el tronco a medio
//   cortar). Ylva, la hija de Orm, cuenta que la cuadrilla salió hacia el Paso (o agradece si ya la rescataron) y da
//   el arnés del buey. El desvío del buey: espantar a los lobos de la orilla, subir la compuerta (la rueda gira y
//   mueve la sierra y el torno), ponerle el arnés y accionar el torno; el buey queda en el corral. El dintel tallado,
//   el taco con la marca, el fogón para descansar y el cofre de abajo del puente que solo muestra la Lente.
//   Segunda visita (al cerrar EL-07): Orm volvió y cepilla la quilla de Sten en la grada; Ylva gobierna la compuerta.
//   Santuario: las estelas que encienden apenas su runa al pasar, el vestigio al apoyar la mano en el sello, las zarzas
//   que no ceden («No ceden. Ni un poco.»), las vetas azules de la Lente y la loma del mirador, desde donde se ve todo
//   el bosque, con el cofre envuelto en zarzas que queda anotado en el diario. Sin enemigos.
window.ESTE = (function () {
  "use strict";
  let A, J, jug, W, H, st;
  const t = (k, v) => I18N.t(k, v);
  const lobos = [];
  let sacando = 0,
    ondaZarzas = 0,
    avisoZarzas = -99,
    vetasHasta = 0,
    vestigio = 0,
    estado = "";
  const ylva = { x: 0, y: 0, mira: { vista: "S", espejo: false } };

  Object.assign(GENTE.FICHAS, {
    // Ylva, la hija de Orm: unos veinte años, el pelo rojizo de la familia en una trenza, delantal de cuero y aserrín
    ylva: { nombre: "ylva", alto: 0.97, ancho: 0.95, piel: "#D4A88A", pielSombra: "#B2886C", pelo: "#A8583A", ropa: "#6E5E3E", ropaSombra: "#564830", delantal: "#7A5030", delantalSombra: "#5E3C22", pantalon: "#45392E", botas: "#2E241C", cinto: "#3A2A1A", trenza: true },
  });

  const hablar = (clave, quien) => A.dialogoLibre([[quien || "eromash", clave]]);
  const fin = () => H.completa("EL-07");
  const cerca = (p, r) => p && Math.hypot(p[0] - jug.x, p[1] - jug.y) < r;
  const vivos = () => lobos.filter((e) => !e.muerto).length;

  // el aserradero y el santuario según lo que ya pasó
  function aplicar() {
    const N = W.NOMBRADAS;
    if (!N.rueda) return;
    const gira = !!st.compuerta || fin();
    N.rueda.o.gira = gira;
    N.compuerta.o.abierta = gira;
    if (N.canal.o.agua !== gira) {
      N.canal.o.agua = gira;
      W.invalidar(N.canal.x, N.canal.y);
    }
    N.galpon.o.sierra = gira;
    const hecho = st.buey === 2;
    N.buey_barro.oculto = hecho;
    N.buey_corral.oculto = !hecho;
    N.grada.oculto = !fin();
    N.grada.roto = !fin();
    if (N.cofre_puente) {
      N.cofre_puente.oculto = !st.cofrePuente;
      N.cofre_puente.o.abierto = st.cofrePuente === 2;
    }
    if (N.sello) N.sello.o.visto = H.tiene("sello_visto");
  }

  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      H = A.H;
      st = {};
      const P = W.PUNTOS;
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2,
          e = A.CB.crear("lobo", P.lobos_buey[0] + Math.cos(a) * 110, P.lobos_buey[1] + Math.sin(a) * 70);
        e.esteBuey = true;
        e.activo = false;
        lobos.push(e);
        A.enemigos.push(e);
      }
    },
    alEmpezar(extra) {
      extra.este = Object.assign({}, extra.este || {});
      st = extra.este;
      sacando = 0;
      lobos.forEach((e) => {
        A.CB.reiniciar(e);
        if (st.lobos || st.buey === 2) e.muerto = 1;
      });
      aplicar();
    },
    alMorir(e) {
      if (!e.esteBuey || vivos() > 0) return;
      st.lobos = 1;
      HUD.aviso(t("es.lobos_huyen"), "#E0B2B2");
    },
    alGolpear(x, y, dir, alcance) {
      const z = W.NOMBRADAS.zarzas_santuario;
      if (!z || Math.hypot(z.x - x, (z.y - y) * 1.4) > alcance + 300) return;
      ondaZarzas = 1;
      if (J.t - avisoZarzas > 5) {
        avisoZarzas = J.t;
        HUD.aviso(t("es.zarzas_no_ceden"), "#B8A8D8");
      }
    },
    actualizar(dt) {
      const P = W.PUNTOS,
        N = W.NOMBRADAS;
      if (!N.rueda) return;
      // los lobos de la orilla solo andan cuando Eromash se acerca
      const cercaBuey = cerca(P.buey_barro, 20 * W.M);
      lobos.forEach((e) => (e.activo = cercaBuey && !st.lobos));
      // el torno saca al buey del barro, despacio
      if (sacando > 0) {
        sacando = Math.min(1, sacando + dt / 5);
        N.buey_barro.o.hundido = 1 - sacando;
        if (sacando >= 1) {
          sacando = 0;
          st.buey = 2;
          if (window.PODERES) PODERES.darPlata(15);
          A.dialogoLibre([["ylva", "es.ylva_buey_hecho_1"], ["ylva", "es.ylva_buey_hecho_2"]], aplicar);
        }
      } else if (st.buey !== 2) N.buey_barro.o.hundido = 1;
      N.buey_barro.o.arnes = !!st.arnesPuesto;
      N.torno_buey.o.gira = sacando > 0 || fin();
      if (st.arnesPuesto && st.buey !== 2) {
        N.torno_buey.o.hx = N.buey_barro.x + 40;
        N.torno_buey.o.hy = N.buey_barro.y - 70 + (1 - N.buey_barro.o.hundido) * -10;
      } else N.torno_buey.o.hx = null;
      // Ylva: junto al galpón, o en la compuerta en la segunda visita
      const py = fin() ? P.ylva_compuerta : P.ylva;
      ylva.x = py[0];
      ylva.y = py[1];
      // el santuario: las estelas despiertas encienden su runa al paso y se apagan detrás
      for (const e of N.estelas || []) {
        if (!e.o.despierta) continue;
        const d = Math.hypot(e.x - jug.x, e.y - jug.y);
        e.o.luz = d < 300 ? Math.min(1, e.o.luz + dt * 1.6) : Math.max(0, e.o.luz - dt * 0.35);
      }
      ondaZarzas = Math.max(0, ondaZarzas - dt * 0.8);
      if (N.zarzas_santuario) N.zarzas_santuario.o.onda = ondaZarzas;
      // el vestigio: mientras habla la voz, el sonido se apaga y la luz cambia apenas
      if (J.modo === "dialogo" && cerca(P.sello, 260) && H.en("EL-07") && H.tiene("sello_visto") && !H.tiene("calco")) vestigio = Math.min(1, vestigio + dt * 1.5);
      else vestigio = Math.max(0, vestigio - dt * 0.8);
      // el mirador: la vista se abre sobre el bosque
      if (cerca(P.mirador_santuario, 4 * W.M)) {
        J.alejarA(1.8);
        if (!st.mirador && J.modo === "juego") {
          st.mirador = 1;
          if (window.MAPA) MAPA.descubrir(W.LUGARES.aserradero.p[0], W.LUGARES.aserradero.p[1] - 1000, 5200);
          J.retrasar(1.2, () => A.dialogoLibre([["eromash", "es.mirador_1"], ["eromash", "es.mirador_2"]]));
        }
      }
      const e0 = [st.compuerta, st.buey, st.cofrePuente, fin(), H.tiene("sello_visto")].join();
      if (e0 !== estado) {
        estado = e0;
        aplicar();
      }
    },
    cercanos(dar) {
      const P = W.PUNTOS,
        N = W.NOMBRADAS;
      if (!N.rueda) return;
      // Ylva
      const dy = Math.hypot(ylva.x - jug.x, ylva.y - jug.y);
      if (dy < 110)
        dar(dy, t("av.accion_hablar") + " · " + t("av.nombre_ylva"), () => {
          ylva.mira = VIKINGO.vista(jug.x - ylva.x, jug.y - ylva.y, ylva.mira);
          if (fin()) return A.dialogoLibre([["ylva", "es.ylva_segunda_1"], ["ylva", "es.ylva_segunda_2"]]);
          const lineas = [];
          if (!st.ylva) {
            st.ylva = 1;
            if (H.tiene("errantes_despejados") || H.completa("EL-02")) lineas.push(["ylva", "es.ylva_despues_1"], ["ylva", "es.ylva_despues_2"]);
            else lineas.push(["ylva", "es.ylva_antes_1"], ["eromash", "es.ylva_antes_2"], ["ylva", "es.ylva_antes_3"]);
          }
          if (st.buey === 2) lineas.push(["ylva", "es.ylva_rato"]);
          else if (!st.arnes) {
            lineas.push(["ylva", "es.ylva_buey_1"], ["ylva", "es.ylva_buey_2"]);
            return A.dialogoLibre(lineas, () => {
              st.arnes = 1;
              HUD.aviso(t("es.arnes"), "#FFD98A");
            });
          } else lineas.push(["ylva", "es.ylva_buey_recuerda"]);
          A.dialogoLibre(lineas);
        });
      // la compuerta
      if (cerca(P.compuerta, 130) && !st.compuerta && !fin())
        dar(50, t("es.accion_compuerta"), () => {
          jug.interactuando = 0.8;
          st.compuerta = 1;
          aplicar();
          HUD.aviso(t("es.rueda_gira"), "#73D5DB");
        });
      // el buey en el barro
      if (st.buey !== 2 && !sacando && cerca(P.buey_barro, 150)) {
        if (vivos() > 0) dar(60, t("es.accion_buey"), () => hablar("es.buey_lobos"));
        else if (!st.arnes) dar(60, t("es.accion_buey"), () => hablar("es.buey_sin_arnes"));
        else if (!st.arnesPuesto)
          dar(40, t("es.accion_arnes"), () => {
            jug.interactuando = 1;
            st.arnesPuesto = 1;
            hablar("es.arnes_puesto");
          });
      }
      // el torno
      if (st.buey !== 2 && !sacando && cerca(P.torno_buey, 130)) {
        if (st.arnesPuesto && (st.compuerta || fin()))
          dar(40, t("es.accion_torno"), () => {
            jug.interactuando = 1.2;
            sacando = 0.001;
            HUD.aviso(t("es.torno_tira"), "#FFD98A");
          });
        else dar(70, t("es.accion_mirar_torno"), () => hablar(st.arnesPuesto ? "es.torno_sin_agua" : "es.torno"));
      }
      // el dintel, el taco, el fogón
      if (cerca(P.dintel, 160))
        dar(75, t("es.accion_dintel"), () => {
          const primera = !st.dintel;
          st.dintel = 1;
          A.dialogoLibre(primera ? [["eromash", "es.dintel_1"], ["eromash", "es.dintel_2"]] : [["eromash", "es.dintel_1"]]);
        });
      const banco = N.banco_orm;
      if (banco && cerca([banco.x + 40, banco.y + 20], 110)) dar(75, t("es.accion_taco"), () => hablar("es.taco"));
      const fg = N.fogon_aserradero;
      if (fg && cerca([fg.x, fg.y + 40], 140))
        dar(70, t("es.accion_descansar"), () => {
          jug.hp = jug.hpMax;
          hablar("es.descanso");
        });
      // el cofre de abajo del puente
      if (st.cofrePuente === 1 && cerca(P.cofre_puente, 110))
        dar(40, t("es.accion_cofre"), () => {
          st.cofrePuente = 2;
          aplicar();
          if (window.PODERES) PODERES.darPlata(30);
          HUD.aviso(t("es.cofre_puente"), "#FFD98A");
        });
      // el santuario: el cofre de zarzas del mirador
      if (cerca(P.cofre_zarzas, 150))
        dar(55, t("es.accion_cofre_zarzas"), () => {
          const primera = !st.cofreZarzas;
          st.cofreZarzas = 1;
          A.dialogoLibre([["eromash", "es.cofre_zarzas"]], () => primera && HUD.aviso(t("es.anotado"), "#E0B2B2"));
        });
    },
    lente(x, y) {
      const P = W.PUNTOS,
        N = W.NOMBRADAS;
      let algo = false;
      if (P.cofre_puente && !st.cofrePuente && Math.hypot(P.cofre_puente[0] - x, P.cofre_puente[1] - y) < 900) {
        st.cofrePuente = 1;
        aplicar();
        J.retrasar(0.6, () => hablar("es.cofre_visto"));
        algo = true;
      }
      const pt = N.santuario;
      if (pt && Math.hypot(pt.x - x, pt.y - y) < 2600) {
        vetasHasta = J.t + 10;
        if (!st.vetas) {
          st.vetas = 1;
          J.retrasar(0.8, () => hablar("es.vetas"));
        }
        algo = true;
      }
      return algo;
    },
    cuerpos(f) {
      if (W.NOMBRADAS.rueda) f(ylva.x, ylva.y, 36);
    },
    objetos(lista, visible, c) {
      const N = W.NOMBRADAS;
      if (!N.rueda) return;
      if (visible(ylva.x, ylva.y)) lista.push({ y: ylva.y, f: () => GENTE.dibujar(c, "ylva", ylva.x, ylva.y, J.t, ylva.mira) });
      // las vetas de luz azul que corren por el suelo entre la puerta y el bosque (Lente)
      const pt = N.santuario;
      if (vetasHasta > J.t && pt) {
        const a = Math.min(1, (vetasHasta - J.t) / 2) * 0.38;
        lista.push({
          y: pt.y + 1,
          f: () =>
            DIB.alfa(c, a, () => {
              const r = DIB.azar(919);
              for (let k = 0; k < 9; k++) {
                const ang = Math.PI * (0.15 + r() * 0.7) + (k % 2 ? 0 : Math.PI * 0.05),
                  l = 900 + r() * 1400;
                let x = pt.x + (r() - 0.5) * 300,
                  y = pt.y + 20;
                c.beginPath();
                c.moveTo(x, y);
                for (let i = 0; i < 6; i++) {
                  x += Math.cos(ang) * (l / 6) + (r() - 0.5) * 160;
                  y += Math.sin(ang) * (l / 6) * 0.6 + (r() - 0.5) * 60;
                  c.lineTo(x, y);
                }
                c.strokeStyle = k % 3 ? DIB.RUNICO : DIB.RUNICO_CLARO;
                c.lineWidth = 3 + (k % 3);
                c.stroke();
              }
            }),
        });
      }
      // el vestigio: la luz cambia y por un instante se ve la misma mano sobre la misma piedra, en otro tiempo
      if (vestigio > 0.01 && N.sello) {
        const s = N.sello,
          v = vestigio;
        lista.push({
          y: 1e9 - 2,
          f: () => {
            DIB.alfa(c, v * 0.45, () => DIB.R(c, jug.x - 4000, jug.y - 3000, 8000, 6000, "#101820"));
            DIB.alfa(c, v * (0.5 + Math.sin(J.t * 2) * 0.15), () => {
              const hx = s.x + 4,
                hy = s.y - 84;
              DIB.halo(c, hx, hy, 120, DIB.RUNICO, 0.6);
              DIB.P(c, [hx - 16, hy + 22, hx - 18, hy - 6, hx + 16, hy - 6, hx + 18, hy + 22], "#CDE8F0");
              [[-14, -6, -16, -30], [-5, -6, -6, -38], [4, -6, 4, -40], [13, -6, 14, -32]].forEach(([a, b, c2, d]) => DIB.L(c, hx + a, hy + b, hx + c2, hy + d, "#CDE8F0", 7));
              DIB.L(c, hx + 18, hy + 8, hx + 30, hy - 10, "#CDE8F0", 7);
            });
          },
        });
      }
    },
    diario() {
      if (!st.cofreZarzas) return "";
      return `<div class="diario-resumen"><p>${t("es.diario_cofre")}</p></div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return {};
})();
