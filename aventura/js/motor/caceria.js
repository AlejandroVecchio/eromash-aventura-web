// ---------- la Cacería Salvaje (sistema CACERIA) ----------
// Como la Cacería Salvaje del Witcher y las noches de invasión del Gothic: algunas noches (una de cada tres, con semilla
// fija por noche, desde la segunda y con Eromash en nivel 4 o más) corre Oskoreia, la cacería de los muertos.
//   · A las 20:30 suena un cuerno lejano en el cielo: es el aviso. En un pueblo (REFUGIOS) o bajo techo no te encuentra.
//   · Desde las 22 (hasta las 4), si Eromash anda afuera y no está peleando, llega: el Cazador de Oskoreia (un único,
//     carga en línea con la lanza) y cuatro sabuesos de humo que muerden en abanico. Son fantasmas: cruzan árboles y la
//     runa del sol les pega triple. La noche se tiñe de violeta.
//   · Cada 11 s cruzan los jinetes: una franja larga violeta por donde está Eromash (1,4 s de aviso, saltar la evita).
//   · A los 35 s, si quedan menos de dos sabuesos, el Cazador aúlla y vuelven dos.
//   · Termina de cuatro maneras: tumbar al Cazador (plata, experiencia, una pieza y, la primera vez, su cuerno),
//     aguantar 75 s (un poco de plata y experiencia), meterse en un pueblo o una casa (pasa de largo, nada) o caer.
//   · El Cuerno de la Cacería (en la Bolsa) la llama a propósito: de noche, fuera de los pueblos, una vez por noche.
// Reglas de la arena: aviso exacto en el piso, saltar evita todo, nada saca más del 35 %.
// Estado en E.extra.caceria = { avisada, corrida, cuerno, vencidas, sobrevividas, escondidas }. Textos `cz.`.
window.CACERIA = (function () {
  "use strict";
  let A, J, jug, W, CB;
  const t = (k, v) => I18N.t(k, v);
  const M = 30;
  const CHANCE = 0.34,
    NIVEL_MIN = 4,
    DURA = 75,
    PASADA = 11,
    PASADA_AVISO = 1.4,
    PASADA_DANO = 18,
    REFUERZO = 35,
    LEJOS = 1100,
    VIOLETA = [154, 107, 216];
  Object.assign(COMBATE.TIPOS, {
    sabuesoCaceria: { vida: 55, dano: 11, vel: 4.4 * M, alcance: 2.2 * M, aviso: 0.7, forma: "abanico", radioGolpe: 2.5 * M, angulo: 0.7, radio: 22, espera: 1.5, barra: 70, plata: 0, vuela: true, muerto: true },
    cazadorSalvaje: { vida: 560, dano: 24, vel: 3.4 * M, alcance: 9 * M, aviso: 1.05, forma: "carga", largo: 10 * M, ancho: 2 * M, radio: 46, espera: 1.9, barra: 200, plata: 0, pesado: true, vuela: true, muerto: true },
  });
  const REFUGIOS = ["puesto", "refugio", "casa_lindes", "brunvik", "aserradero"];
  const base = () => ({ avisada: -1, corrida: -1, cuerno: false, vencidas: 0, sobrevividas: 0, escondidas: 0 });
  let st = base();
  let caza = null; // { n, t, miembros, cazador, pal, prox, pasadas: [{ a, t, ux, uy, sx, sy, pego }], refuerzo, aullido }

  // ---------- cuándo ----------
  const horas = () => (A.H.E.tiempo / LUZ.DIA) * 24 + 9;
  // cada noche tiene su número: empieza a las 20 de un día y termina a las 20 del siguiente
  const nocheId = () => Math.floor((horas() - 20) / 24);
  const toca = (n) => n >= 1 && DIB.azar(7717 + n * 131)() < CHANCE;
  const enRefugio = (x, y) => REFUGIOS.some((k) => W.LUGARES[k] && Math.hypot(x - W.LUGARES[k].p[0], y - W.LUGARES[k].p[1]) < W.LUGARES[k].r);
  const escondido = () => J.dentro || enRefugio(jug.x, jug.y) || Math.hypot(jug.x - W.CIUDAD.c[0], (jug.y - W.CIUDAD.c[1]) * 1.3) < W.CIUDAD.rx;
  const tope = () => Math.max(35, Math.round(jug.hpMax * 0.35));

  // ---------- sonidos armados ----------
  function cuerno(lejos) {
    if (!window.SONIDO) return;
    const g = lejos ? 0.05 : 0.11;
    SONIDO.tono("sawtooth", 98, 104, 1.8, g, { filtro: lejos ? 380 : 700 });
    SONIDO.tono("sawtooth", 147, 150, 1.6, g * 0.6, { filtro: lejos ? 420 : 760, retraso: 0.08 });
    SONIDO.tono("sine", 49, 52, 1.9, g * 1.2, { filtro: 200 });
  }
  function aullido(x, y) {
    if (!window.SONIDO) return;
    SONIDO.tono("sine", 330, 540, 0.5, 0.07, { x, y, filtro: 1400 });
    SONIDO.tono("sine", 540, 360, 0.9, 0.06, { x, y, filtro: 1400, retraso: 0.48 });
  }

  // ---------- la llegada ----------
  function crearSabueso(x, y, grupo, mas) {
    const e = CB.crear("sabuesoCaceria", x, y, { pal: caza.pal, grupo, mas });
    e.caceria = true;
    e.estado = "persigue";
    e.vio = 1.1;
    e.casa = [jug.x, jug.y];
    A.enemigos.push(e);
    grupo.push(e);
    return e;
  }
  function empezar(n, llamada) {
    if (caza) return null;
    st.corrida = n;
    const nivel = window.RPG ? RPG.nivel() : NIVEL_MIN,
      mas = Math.min(2.2, 1 + 0.1 * Math.max(0, nivel - NIVEL_MIN)),
      a = Math.atan2(jug.dir ? jug.dir[1] : 1, jug.dir ? jug.dir[0] : 0) + Math.PI + (Math.random() - 0.5) * 1.2,
      x = jug.x + Math.cos(a) * LEJOS,
      y = jug.y + Math.sin(a) * LEJOS * 0.8,
      grupo = [];
    caza = { n, t: 0, miembros: grupo, cazador: null, pal: n % 3, prox: 6, pasadas: [], refuerzo: false, aullido: 3, llamada: !!llamada, mas };
    const l = { unico: "cazador", afijos: ["runico"], nombre: t("hd.unico_cazador"), titulo: t("cz.jefe_titulo") };
    const c = CB.crear("cazadorSalvaje", x, y, { pal: caza.pal, grupo, lider: l, mas });
    c.s = 1;
    c.caceria = true;
    c.estado = "persigue";
    c.vio = 1.1;
    c.casa = [jug.x, jug.y];
    A.enemigos.push(c);
    grupo.push(c);
    caza.cazador = c;
    for (let i = 0; i < 4; i++) {
      const b = a + (i - 1.5) * 0.35;
      crearSabueso(jug.x + Math.cos(b) * (LEJOS - 160), jug.y + Math.sin(b) * (LEJOS - 160) * 0.8, grupo, mas);
    }
    cuerno(false);
    J.retrasar(0.9, () => aullido(x, y));
    J.sacudir(0.4);
    HUD.aviso(t("cz.llega_d"), "lugar", t("cz.titulo"));
    if (window.ANIMA) ANIMA.gesto("susto");
    return caza;
  }

  // ---------- los jinetes que cruzan ----------
  function pasada() {
    // casi de costado, para que se lean de perfil; la franja pasa justo por donde está Eromash
    const dir = (Math.random() < 0.5 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.7,
      ux = Math.cos(dir),
      uy = Math.sin(dir) / 1.25,
      largo = 1900,
      sx = jug.x - ux * largo * 0.5,
      sy = jug.y - uy * largo * 0.5;
    const a = { forma: "franja", x: sx, y: sy, dur: PASADA_AVISO, t: 0, dir, largo, ancho: 2.4 * M, rgb: VIOLETA };
    J.avisos.push(a);
    caza.pasadas.push({ a, t: 0, ux, uy, sx, sy, largo, pego: false });
    HUD.aviso(t("cz.pasada"), "#9A6BD8");
    cuerno(true);
  }
  function seguirPasadas(dt) {
    for (const p of caza.pasadas) {
      p.t += dt;
      if (!p.pego && p.t >= PASADA_AVISO) {
        p.pego = true;
        if (CB.contiene(p.a, jug.x, jug.y)) J.herir(Math.min(PASADA_DANO, tope()), jug.x - p.ux * 80, jug.y - p.uy * 80);
        J.quitarAviso(p.a);
        J.sacudir(0.35);
        if (window.SONIDO) SONIDO.tocar("golpeFuerte", { vol: 0.5, tono: 0.6, x: jug.x, y: jug.y });
      }
    }
    caza.pasadas = caza.pasadas.filter((p) => p.t < PASADA_AVISO + 0.7);
  }

  // ---------- el final ----------
  function deshacer(e) {
    if (!window.CALIDAD || CALIDAD.nivel !== "baja")
      for (let k = 0; k < 10; k++) J.fx.push({ x: e.x + (Math.random() - 0.5) * e.d.radio * 1.6, y: e.y - Math.random() * e.d.barra * 0.6, vx: (Math.random() - 0.5) * 120, vy: -40 - Math.random() * 120, t: 0.5 + Math.random() * 0.4, c: "#9A6BD8", s: 4 + Math.random() * 4, g: -0.3 });
  }
  function quitar(lista) {
    for (const e of lista) {
      const i = A.enemigos.indexOf(e);
      if (i >= 0) A.enemigos.splice(i, 1);
    }
  }
  function terminar(como) {
    if (!caza) return;
    const c = caza.cazador,
      lista = caza.miembros.slice();
    caza.pasadas.forEach((p) => J.quitarAviso(p.a));
    lista.forEach((e) => {
      if (e.aviso) J.quitarAviso(e.aviso);
      e.aviso = null;
      if (!e.muerto) {
        deshacer(e);
        e.activo = false;
      }
    });
    J.retrasar(1.2, () => quitar(lista));
    caza = null;
    if (como === "vencida") {
      st.vencidas++;
      PODERES.soltar(c.x, c.y, "plata", st.vencidas === 1 ? 180 : 110);
      if (window.RPG) RPG.dar(st.vencidas === 1 ? 900 : 500, c.x, c.y);
      if (window.BOTIN && window.OBJETOS && (st.vencidas === 1 || Math.random() < 0.4)) J.retrasar(0.8, () => BOTIN.tirar(c.x, c.y - 30, OBJETOS.generar({ n: window.RPG ? RPG.nivel() : 1, min: 2, hallazgo: 2 }), true));
      if (!st.cuerno) {
        st.cuerno = true;
        J.retrasar(0.5, () => PODERES.darFragmento());
        J.retrasar(1.6, () => HUD.aviso(t("cz.cuerno_d"), "#9A6BD8", t("cz.cuerno")));
        const hd = A.H.E.extra && A.H.E.extra.hd;
        if (hd) (hd.unicos = hd.unicos || {}).cazador = true;
      }
      HUD.aviso(t("cz.vencida"), "lugar", t("cz.vencida_t"));
      if (window.SONIDO) SONIDO.tocar("mision", { vol: 0.6, tono: 0.8 });
      if (window.ANIMA) ANIMA.gesto("feliz");
      if (window.VIDA) VIDA.evento("lider", c.x, c.y);
    } else if (como === "sobrevivida") {
      st.sobrevividas++;
      PODERES.soltar(jug.x, jug.y, "plata", 50, true);
      if (window.RPG) RPG.dar(250, jug.x, jug.y);
      HUD.aviso(t("cz.sobrevivida"), "lugar", t("cz.sobrevivida_t"));
      cuerno(true);
    } else if (como === "escondido") {
      st.escondidas++;
      HUD.aviso(t("cz.escondido"), "#9A6BD8");
      cuerno(true);
    }
  }
  function seguir(dt) {
    caza.t += dt;
    if (jug.muerto) return terminar("cayo");
    if (escondido()) return terminar("escondido");
    if (caza.cazador.muerto > 0) return terminar("vencida");
    if (caza.t >= DURA) return terminar("sobrevivida");
    // nunca sueltan el rastro: su casa es donde está Eromash
    for (const e of caza.miembros) {
      if (e.muerto) continue;
      e.casa = [jug.x, jug.y];
      if (e.estado === "quieto" || e.estado === "vuelve") (e.estado = "persigue"), (e.t = 0);
    }
    // a los 35 s el Cazador aúlla y vuelven dos sabuesos si quedan menos de dos
    const vivos = caza.miembros.filter((e) => !e.muerto && e !== caza.cazador).length;
    if (!caza.refuerzo && caza.t > REFUERZO && vivos < 2) {
      caza.refuerzo = true;
      const c = caza.cazador;
      for (let i = 0; i < 2; i++) crearSabueso(c.x + (i ? 120 : -120), c.y + 60, caza.miembros, caza.mas);
      aullido(c.x, c.y);
    }
    caza.prox -= dt;
    if (caza.prox <= 0) {
      caza.prox = PASADA;
      pasada();
    }
    seguirPasadas(dt);
    caza.aullido -= dt;
    if (caza.aullido <= 0) {
      caza.aullido = 6 + Math.random() * 4;
      const s = caza.miembros.find((e) => !e.muerto && e !== caza.cazador);
      if (s) aullido(s.x, s.y);
    }
    // la noche se tiñe de violeta mientras corre
    J.ambZona = Object.assign(J.ambZona || {}, { tono: [30, 16, 56] });
  }

  // ---------- el cuerno ----------
  function tocarCuerno() {
    if (caza) return HUD.aviso(t("cz.ya_corre"), "#9A6BD8"), false;
    if (A.noche() < 0.6) return HUD.aviso(t("cz.solo_noche"), "#9A6BD8"), false;
    if (escondido()) return HUD.aviso(t("cz.afuera"), "#9A6BD8"), false;
    if (st.corrida === nocheId()) return HUD.aviso(t("cz.ya_noche"), "#9A6BD8"), false;
    if (window.INVENTARIO && INVENTARIO.cerrar) INVENTARIO.cerrar();
    return !!empezar(nocheId(), true);
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      CB = A.CB;
      if (window.BESTIARIO) {
        BESTIARIO.LISTA.push("sabuesoCaceria", "cazadorSalvaje");
        BESTIARIO.UNICOS.push(["cazador", "cazadorSalvaje"]);
      }
      if (window.MATERIALES) Object.assign(MATERIALES.CRIATURAS, { sabuesoCaceria: [["esquirla", 0.2, 1]], cazadorSalvaje: [["esquirla", 1, 3], ["cuero", 1, 2]] });
      if (window.INVENTARIO && INVENTARIO.iconoDe)
        INVENTARIO.iconoDe("cz_cuerno", (c) => {
          // el cuerno curvo con boquilla de hierro y una correa
          DIB.P(c, [-26, 14, -18, -2, 0, -14, 22, -20, 26, -12, 6, -4, -10, 10, -18, 22], "#E8E0D0");
          DIB.P(c, [-26, 14, -18, -2, 0, -14, 2, -8, -10, 10, -18, 22], "#C8C0B0");
          DIB.P(c, [20, -22, 28, -24, 30, -12, 24, -10], "#6E6A66");
          DIB.L(c, -20, 8, 8, -10, "#9A6BD8", 2);
          DIB.L(c, -14, 18, 14, 4, "#5A4232", 2.4);
        });
    },
    alEmpezar(extra) {
      extra.caceria = Object.assign(base(), extra.caceria || {});
      st = extra.caceria;
      if (caza) {
        const lista = caza.miembros;
        caza.pasadas.forEach((p) => J.quitarAviso(p.a));
        caza = null;
        quitar(lista);
      }
    },
    actualizar(dt) {
      if (!A || J.modo !== "juego") return;
      if (caza) return seguir(dt);
      if (J.dentro || jug.muerto) return;
      const n = nocheId(),
        h = A.hora();
      if (!toca(n) || st.corrida === n || (window.RPG && RPG.nivel() < NIVEL_MIN)) return;
      if (h >= 20.5 && h < 22 && st.avisada !== n) {
        st.avisada = n;
        cuerno(true);
        HUD.aviso(t("cz.cuerno_lejos"), "#9A6BD8", t("cz.titulo"));
      }
      if ((h >= 22 || h < 4) && !escondido() && !A.enPelea()) empezar(n, false);
    },
    alMorir(e) {
      if (!e.caceria) return;
      if (e.tipo === "sabuesoCaceria" && Math.random() < 0.5) PODERES.soltar(e.x, e.y, "plata", 6 + Math.round(Math.random() * 6));
      if (e.tipo === "sabuesoCaceria" && Math.random() < 0.15) PODERES.soltar(e.x, e.y, "vida", 18);
    },
    sobreLuz(c) {
      if (!caza || J.dentro) return;
      // los jinetes de la pasada: cruzan la franja justo cuando termina el aviso
      for (const p of caza.pasadas) {
        const u = (p.t - (PASADA_AVISO - 0.45)) / 0.9;
        if (u < 0 || u > 1) continue;
        for (let k = 0; k < 3; k++) {
          const d = p.largo * Math.min(1, Math.max(0, u - k * 0.06)),
            px = p.sx + p.ux * d - p.uy * (k - 1) * 70,
            py = p.sy + p.uy * d + p.ux * (k - 1) * 40;
          DIB.alfa(c, 0.75, () => CRIATURAS.dibujar(c, "cazadorSalvaje", px, py, J.t + k, { vista: "E", espejo: p.ux < 0, mov: 1, pal: (caza.pal + k) % 3 }));
        }
      }
    },
    luces(dar) {
      if (!caza || J.dentro) return;
      for (const e of caza.miembros) if (!e.muerto && e.activo) dar({ x: e.x, y: e.y - 60, r: e === caza.cazador ? 260 : 150, col: "#9A6BD8", f: 0.45 });
    },
    efectosHud() {
      return caza ? [{ texto: t("cz.efecto"), n: Math.ceil(DURA - caza.t) + " s", col: "#9A6BD8" }] : [];
    },
    celdasBolsa() {
      return st.cuerno ? [{ id: "cz_cuerno", icono: "cz_cuerno", nombre: t("cz.cuerno"), col: "#9A6BD8", desc: t("cz.cuerno_bolsa"), fn: tocarCuerno }] : [];
    },
    diario() {
      const n = st.vencidas + st.sobrevividas + st.escondidas;
      if (!n && !st.cuerno) return "";
      return `<div class="diario-resumen"><p><b>${t("cz.titulo")}</b> ${t("cz.diario", [n, st.vencidas, st.sobrevividas, st.escondidas])}${st.cuerno ? " " + t("cz.diario_cuerno") : ""}</p></div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, caza: () => caza, empezar, terminar, tocarCuerno, nocheId, toca, pasada, DURA, PASADA, PASADA_DANO, REFUERZO, NIVEL_MIN };
})();
