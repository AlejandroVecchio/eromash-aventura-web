// La campaña principal entera (EL-01 a EL-07) jugada por un bot: para cada objetivo abierto va adonde marca el haz
// (dentro de Eikholt, al ancla de la ciudad), habla, usa lo que haya con E, usa la Lente, vence lo que hay que vencer
// y junta lo que se cuenta. Falla si un objetivo no tiene adónde ir o no se puede cumplir jugando.
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  async function campana(A, log) {
    const H = A.H,
      J = A.J,
      jug = A.jug,
      W = A.W;
    const C = W.CIUDAD;
    const enCiudad = (p) => ((p[0] - C.c[0]) / C.rx) ** 2 + ((p[1] - C.c[1]) / C.ry) ** 2 < 0.97;
    const esperarModo = async () => {
      for (let i = 0; i < 100; i++) {
        if (J.modo === "dialogo") A.seguirDialogo();
        else if (J.modo === "menu") A.cerrarMenu();
        else if (J.modo === "juego") return;
        await esperar(40);
      }
    };
    // a un punto del bosque; si cae en Eikholt, entra a la ciudad y va al ancla (o al lugar que le toca)
    async function ir(p, donde) {
      await esperarModo();
      const ciudad = window.EIKHOLT && EIKHOLT.activo();
      if (enCiudad(p)) {
        if (!ciudad) {
          jug.x = p[0];
          jug.y = p[1];
          for (let i = 0; i < 60 && !EIKHOLT.activo(); i++) await esperar(50);
          await esperarModo();
        }
        const q = EIKHOLT.anclas()[donde] || EIKHOLT.lugarDe(p[0], p[1]);
        const e = EIKHOLT.ero();
        e.x = q[0];
        e.y = q[1] + 20;
        await esperar(250);
        return "ciudad";
      }
      if (ciudad) {
        EIKHOLT.salir();
        for (let i = 0; i < 60 && EIKHOLT.activo(); i++) await esperar(50);
        await esperarModo();
      }
      jug.x = p[0] + 20;
      jug.y = p[1] + 60;
      jug.z = 0;
      J.cam.x = jug.x;
      J.cam.y = jug.y;
      await esperar(300);
      return "bosque";
    }
    const cercano = () => (window.EIKHOLT && EIKHOLT.activo() ? EIKHOLT.cercano() : A.cercano());
    // la Lente en la ciudad se usa asomado al punto del bosque, como hace ciudad/juego.js
    function lente(p) {
      if (!(window.EIKHOLT && EIKHOLT.activo())) return A.usarLente();
      const x0 = jug.x,
        y0 = jug.y;
      jug.x = p[0];
      jug.y = p[1];
      try {
        A.usarLente();
      } finally {
        jug.x = x0;
        jug.y = y0;
      }
    }
    async function vencerCerca(r) {
      let n = 0;
      for (const e of A.enemigos) {
        if (e.muerto || (e.d && e.d.blanco) || (!e.activo && !e.etapaGrupo)) continue;
        if (Math.hypot(e.x - jug.x, e.y - jug.y) > r) continue;
        A.CB.golpear(J, e, 99999, jug.x, jug.y);
        n++;
        await esperar(15);
      }
      return n;
    }
    // el Ciervo: romper cada soporte como si lo embistiera y pegarle hasta vencerlo
    async function ciervo() {
      const b = A.ciervo;
      if (!b.activo && !b.derrotado) A.CB.despertar(J, b);
      for (const s of b.soportes)
        if (!s.o.roto) {
          s.o.roto = true;
          J.soporteRoto(s);
        }
      for (let i = 0; i < 400 && !b.derrotado; i++) A.CB.golpearCiervo(J, b, 50);
      await esperar(400);
    }
    for (let vuelta = 0; vuelta < 140; vuelta++) {
      await esperarModo();
      const ab = H.abiertos();
      if (!ab.length) break;
      const o = ab[0];
      const r = { m: H.idMision(), hecho: o.hecho, pasos: [] };
      const p = A.dondeObjetivo();
      if (!p) r.pasos.push("sin destino");
      for (let k = 0; k < 10 && !H.tiene(o.hecho); k++) {
        // con varios abiertos (un par) va al de este objetivo
        let q = p;
        if (o.donde) {
          const n = A.npcs[o.donde];
          q = n ? [n.x, n.y] : o.donde === "ciervo" ? [A.ciervo.x, A.ciervo.y] : A.P[o.donde] || p;
        }
        if (!q && o.hecho === "croquis_leido") {
          MAPA.abrir();
          await esperar(100);
          if (J.modo === "mapa" || J.modo === "menu") MAPA.cerrar ? MAPA.cerrar() : (J.modo = "juego");
          J.modo = "juego";
          r.pasos.push("mapa");
          continue;
        }
        if (!q) break;
        await ir(q, o.donde);
        if (o.donde === "ciervo" && H.tiene("anclajes_vistos")) {
          await ciervo();
          r.pasos.push("ciervo");
          continue;
        }
        // por turnos: lo que haya con E, vencer lo que ande cerca, la Lente
        const paso = k % 3;
        const c = paso === 0 ? cercano() : null;
        if (c) {
          r.pasos.push("E:" + c.texto);
          c.fn();
          await esperar(900);
          // si pidió el rayo de luz (el sello de EL-07), lo resuelve dando vuelta los espejos del camino
          const M = window.MINIJ && MINIJ.estado();
          if (M && M.def === MINIJ.JUEGOS.rayo) {
            Object.values(M.celda)
              .filter((x) => x.tipo === "espejo" && x.bien && !x.fijo && x.forma !== x.bien)
              .forEach((x) => MINIJ.JUEGOS.rayo.tocar(M, x.y * M.v.c + x.x));
            await esperar(1200);
            MINIJ.cerrar();
            r.pasos.push("rayo");
          }
          await esperarModo();
          continue;
        }
        if (paso === 1) {
          const v = await vencerCerca(1600);
          if (v) r.pasos.push("vence " + v);
          await esperar(250);
          continue;
        }
        if (paso === 2 && (H.tiene("lente") || H.tiene("lente_prestada"))) {
          lente(q);
          r.pasos.push("lente");
          await esperar(1500);
          await esperarModo();
        } else await esperar(200);
      }
      if (!H.tiene(o.hecho)) {
        r.mal = true;
        H.marcar(o.hecho); // para seguir revisando el resto
        await esperar(150);
      }
      log.push(r);
    }
  }
  (window.PRUEBAS = window.PRUEBAS || []).push({
    nombre: "campaña: de EL-01 a EL-07 cada objetivo marca adónde ir y se cumple jugando",
    fn: async (A, { igual }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 60 && A.J.modo !== "juego"; i++) await esperar(50);
      const log = [];
      try {
        await campana(A, log);
      } finally {
        window.CAMPANA_LOG = log;
      }
      // el croquis no tiene un lugar: se mira en el mapa o en el diario
      const mal = log.filter((r) => r.mal || (r.pasos.includes("sin destino") && r.hecho !== "croquis_leido")).map((r) => r.m + " " + r.hecho + " (" + r.pasos.join(", ") + ")");
      igual(mal.join(" | "), "", "objetivos trabados:");
      igual(A.H.idMision(), "fin", "termina la campaña:");
      JUEGO.empezar(9, true);
      for (let i = 0; i < 60 && A.J.modo !== "juego"; i++) await esperar(50);
    },
  });
  (window.PRUEBAS = window.PRUEBAS || []).push({
    nombre: "campaña: cada misión trae dos opcionales cerca de su camino, se cumplen y pagan",
    fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 60 && A.J.modo !== "juego"; i++) await esperar(50);
      await esperar(1500);
      if (A.J.modo === "menu") A.cerrarMenu(); // el cartel del final de la prueba anterior
      const l = OPCIONALES.ahora();
      igual(l.length, 2, "EL-01 tiene sus dos opcionales:");
      const piedra = l.find((x) => x.o.tipo === "piedra");
      si(piedra && piedra.cosa, "la piedra del susurro elegida existe");
      const seg = OPCIONALES.sistema.seguimiento();
      si(seg && seg.objetivos.length === 2 && seg.objetivos.every((o) => o.metros > 0), "van al rastreador con sus metros");
      igual(OPCIONALES.sistema.marcasBrujula().length, 2, "y a la brújula:");
      const plata = PODERES.pj().plata;
      SECRETOS.lista().st.piedras[piedra.cosa.id] = true;
      for (let i = 0; i < 40 && !OPCIONALES.estado().hechos["EL-01:piedra_carro"]; i++) await esperar(50);
      si(OPCIONALES.estado().hechos["EL-01:piedra_carro"], "leer la piedra lo cumple");
      si(PODERES.pj().plata > plata, "y paga plata");
      // cada misión tiene sus dos con su texto
      const faltan = [];
      for (const m in OPCIONALES.LISTA) OPCIONALES.LISTA[m].forEach((o) => I18N.t("oq." + o.id) === "oq." + o.id && faltan.push(o.id));
      igual(faltan.join(", "), "", "textos:");
      igual(Object.keys(OPCIONALES.LISTA).length, 7, "las siete misiones:");
      JUEGO.empezar(9, true);
      for (let i = 0; i < 60 && A.J.modo !== "juego"; i++) await esperar(50);
    },
  });
  (window.PRUEBAS = window.PRUEBAS || []).push({
    nombre: "campaña: musgo y cuero se juntan en cualquier orden y el croquis se lee en el mapa",
    fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 60 && A.J.modo !== "juego"; i++) await esperar(50);
      const H = A.H;
      H.marcar("el01_acepto");
      igual(H.objetivo().hecho, "croquis_leido", "después de aceptar, el croquis:");
      MAPA.abrir();
      await esperar(80);
      A.cerrarMenu();
      A.J.modo = "juego";
      si(H.tiene("croquis_leido"), "abrir el mapa lo cuenta como leído");
      ["carro_visto", "orm_encontrado", "errantes_despejados"].forEach((b) => H.marcar(b));
      igual(H.abiertos().map((o) => o.hecho).join(","), "musgo_juntado,cuero_juntado", "los dos encargos de Lif a la vez:");
      H.sumar("cuero", 2);
      si(H.tiene("cuero_juntado") && !H.tiene("musgo_juntado"), "el cuero primero vale");
      igual(H.objetivo().hecho, "musgo_juntado", "queda el musgo:");
      JUEGO.empezar(9, true);
      for (let i = 0; i < 60 && A.J.modo !== "juego"; i++) await esperar(50);
    },
  });
}
