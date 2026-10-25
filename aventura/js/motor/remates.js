// ---------- los remates (sistema REMATES) ----------
// Como los remates de The Witcher, las muertes en cámara lenta de Skyrim y los de God of War: una criatura malherida
// (menos del 22 % de la vida; las pesadas, los líderes y los semijefes, menos del 12 %) o aturdida con menos del doble
// de eso lleva una marca roja sobre la cabeza, y con E Eromash la remata. Cada tipo de arma tiene el suyo (REMATES):
// tajo cruzado (espada), hachazo al cuello (hacha), partir en dos (mandoble), aplastar (martillo), empalar (lanza),
// a quemarropa (arco), estallido rúnico (bastón) y puño de hierro (sin arma).
//   · Eromash salta junto a la criatura, carga el golpe y pega: cámara lenta, pausa, temblor, el trazo del remate y la
//     criatura que se deshace. Mientras dura nada lo toca (jug.inv) y la criatura queda quieta.
//   · Deja vida (8 %), estamina (30), energía rúnica (15), furia (20) y un 25 % más de experiencia; las criaturas
//     cerca (a menos de 9 m) se asustan y se frenan un instante.
//   · Los jefes de las zonas, el jötunn y el custodio de la historia no se rematan; los únicos con nombre, solo con
//     menos del 6 %.
//   · Verdugo: a los 10, 50 y 150 remates, +5, +10 y +15 % de daño contra las criaturas malheridas (menos del 30 %).
// Estado en E.extra.remates = { n, porTipo: { tipo: n }, ayuda }. Textos `rm.`.
window.REMATES = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const M = 30;
  const UMBRAL = 0.22,
    UMBRAL_DURO = 0.12,
    UMBRAL_UNICO = 0.06,
    ALCANCE = 110,
    VE = 700,
    SALTO = 0.12,
    CARGA = 0.12,
    FIN = 0.4,
    SUSTO = 9 * M,
    NO_SE_REMATAN = ["dreki", "jotunn", "custodio", "muneco"];
  const VERDUGO = [
    [10, 5],
    [50, 10],
    [150, 15],
  ];
  // cada arma: el color del trazo y su forma
  const REMATES = {
    espada: { forma: "cruz", col: "#F2ECEC" },
    hacha: { forma: "baja", col: "#FF8D71" },
    mandoble: { forma: "parte", col: "#F2ECEC" },
    martillo: { forma: "aplasta", col: "#FFD98A" },
    lanza: { forma: "empala", col: "#E0B2B2" },
    arco: { forma: "flecha", col: "#FFD98A" },
    baston: { forma: "runa", col: "#73D5DB" },
    punos: { forma: "punos", col: "#FF8D71" },
  };
  const base = () => ({ n: 0, porTipo: {}, ayuda: false });
  let st = base();
  let rem = null; // el remate en curso
  const huellas = []; // los trazos que quedan un instante después del golpe

  // ---------- quién se puede rematar ----------
  function puede(e) {
    if (!e || !e.activo || e.muerto || !e.d || e.d.blanco || e.vida <= 0) return false;
    if (NO_SE_REMATAN.includes(e.tipo)) return false;
    const max = e.d.vida || e.vida;
    let u = e.lider && e.lider.unico ? UMBRAL_UNICO : e.d.pesado || e.lider || e.patron ? UMBRAL_DURO : UMBRAL;
    if (e.aturdido > 0) u *= 2;
    return e.vida <= max * u;
  }
  function tipoArma() {
    if (!window.ARMAS) return "espada";
    if (ARMAS.manoVacia()) return "punos";
    const k = ARMAS.tipoActual ? ARMAS.tipoActual() : "espada";
    return REMATES[k] ? k : "espada";
  }
  const verdugo = () => VERDUGO.filter(([n]) => st.n >= n).reduce((b, [, p]) => p, 0);

  // ---------- rematar ----------
  function rematar(e) {
    if (rem || !puede(e) || jug.muerto) return false;
    const tipo = tipoArma(),
      dx = jug.x - e.x,
      dy = jug.y - e.y,
      l = Math.hypot(dx, dy) || 1,
      lejos = (e.d.radio || 22) + 34;
    rem = { e, tipo, t: 0, x0: jug.x, y0: jug.y, xd: e.x + (dx / l) * lejos, yd: e.y + (dy / l) * lejos * 0.8, pego: false };
    jug.inv = SALTO + CARGA + FIN + 0.3;
    jug.atk = null;
    // la criatura se queda quieta y su golpe no llega
    e.aturdido = Math.max(e.aturdido || 0, 2);
    e.vx = e.vy = 0;
    if (e.aviso) {
      J.quitarAviso(e.aviso);
      e.aviso = null;
    }
    J.camLenta = Math.max(J.camLenta || 0, 0.25);
    if (window.SONIDO) SONIDO.tocar("esquiva", { vol: 0.5, tono: 0.8 });
    return true;
  }
  function golpe() {
    const e = rem.e,
      R = REMATES[rem.tipo];
    rem.pego = true;
    A.CB.golpear(J, e, e.vida * 2 + 999, jug.x, jug.y, 1.6);
    J.hitstop = Math.max(J.hitstop || 0, 0.12);
    J.camLenta = Math.max(J.camLenta || 0, 0.55);
    if (J.sacudir) J.sacudir(rem.tipo === "martillo" || rem.tipo === "mandoble" ? 18 : 12);
    huellas.push({ x: e.x, y: e.y - (e.d.barra || 80) * 0.45, forma: R.forma, col: R.col, t: 0, dir: Math.atan2(e.y - jug.y, e.x - jug.x), r: (e.d.radio || 22) * 2.4 });
    // las chispas del golpe (menos en calidad baja)
    const n = !window.CALIDAD || CALIDAD.nivel === "alta" ? 22 : CALIDAD.nivel === "media" ? 12 : 4;
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2,
        v = 120 + Math.random() * 260;
      J.fx.push({ x: e.x, y: e.y - 40, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - 120, t: 0.35 + Math.random() * 0.3, c: k % 3 ? R.col : "#9C2315", s: 3 + Math.random() * 5, g: 0.9 });
    }
    if (window.SONIDO) {
      SONIDO.tocar("golpeFuerte", { vol: 1, tono: 0.75, x: e.x, y: e.y });
      SONIDO.tocar("muerte", { vol: 0.6, tono: 0.85, x: e.x, y: e.y });
    }
    J.textos.push({ x: e.x, y: e.y - (e.d.barra || 80) - 50, n: t("rm.grito") + " " + t("rm." + rem.tipo), t: 0, col: "#FFD98A", palabra: true });
    // lo que deja
    jug.hp = Math.min(jug.hpMax, jug.hp + jug.hpMax * 0.08);
    jug.sta = Math.min(jug.staMax, jug.sta + 30);
    if (PODERES.darEnergia) PODERES.darEnergia(15);
    if (window.FURIA && FURIA.ponerFuria) FURIA.ponerFuria(FURIA.furia() + 20);
    if (window.RPG && RPG.xpDe) RPG.dar(RPG.xpDe(e) * 0.25, e.x, e.y - 40);
    // las de cerca se asustan
    let asustadas = 0;
    for (const o of A.enemigos)
      if (o !== e && o.activo && !o.muerto && Math.hypot(o.x - e.x, o.y - e.y) < SUSTO) {
        o.aturdido = Math.max(o.aturdido || 0, o.d.pesado || o.lider ? 0.6 : 1.1);
        asustadas++;
      }
    if (asustadas) J.textos.push({ x: e.x, y: e.y - (e.d.barra || 80) - 22, n: t("rm.susto"), t: 0, col: "#E0B2B2", palabra: true });
    // la cuenta y el verdugo
    const antes = verdugo();
    st.n++;
    st.porTipo[rem.tipo] = (st.porTipo[rem.tipo] || 0) + 1;
    const ahora = verdugo();
    if (ahora > antes) J.retrasar(1, () => HUD.aviso(t("rm.verdugo_d", [st.n, ahora]), "lugar", t("rm.verdugo")));
    if (window.ANIMA) ANIMA.gesto("feliz");
  }
  function paso(dt) {
    const e = rem.e;
    rem.t += dt;
    jug.atk = null;
    jug.anda = 0;
    J.camFoco = [e.x, e.y];
    if (rem.t < SALTO) {
      // el salto hasta la criatura
      const k = rem.t / SALTO,
        s = k * k * (3 - 2 * k);
      jug.x = rem.x0 + (rem.xd - rem.x0) * s;
      jug.y = rem.y0 + (rem.yd - rem.y0) * s;
    } else {
      jug.x = rem.xd;
      jug.y = rem.yd;
    }
    jug.mira = VIKINGO.vista(e.x - jug.x, e.y - jug.y, jug.mira);
    if (!e.muerto) {
      e.vx = e.vy = 0;
      e.aturdido = Math.max(e.aturdido || 0, 0.5);
    }
    if (!rem.pego && rem.t >= SALTO + CARGA) golpe();
    if (rem.t >= SALTO + CARGA + FIN) {
      rem = null;
      jug.inv = Math.max(jug.inv || 0, 0.3);
    }
  }

  // ---------- los trazos ----------
  function trazo(c, h) {
    const { P, L, E } = DIB,
      k = h.t / 0.5,
      a = Math.max(0, 1 - k),
      r = h.r * (0.8 + k * 0.5),
      x = h.x,
      y = h.y;
    c.save();
    c.globalAlpha = a;
    const tajo = (ang, largo, ancho, col) => {
      const cx = Math.cos(ang),
        cy = Math.sin(ang) * 0.8,
        nx = -cy,
        ny = cx;
      P(c, [x - cx * largo, y - cy * largo, x + nx * ancho, y + ny * ancho, x + cx * largo, y + cy * largo, x - nx * ancho * 0.3, y - ny * ancho * 0.3], col);
    };
    switch (h.forma) {
      case "cruz":
        tajo(0.7, r, 7, h.col);
        tajo(-0.7, r, 7, h.col);
        break;
      case "baja":
        tajo(1.25, r * 1.1, 10, h.col);
        tajo(1.25, r * 0.8, 4, "#F2ECEC");
        break;
      case "parte":
        tajo(Math.PI / 2, r * 1.4, 12, h.col);
        P(c, [x - r * 0.6, y + r * 0.9, x + r * 0.6, y + r * 0.9, x, y + r * 0.7], "#5E4A36");
        break;
      case "aplasta":
        E(c, x, y + r * 0.6, r * (0.6 + k), r * (0.25 + k * 0.4), "rgba(255,217,138,0.5)");
        for (let i = 0; i < 6; i++) {
          const g = (i / 6) * Math.PI * 2;
          L(c, x + Math.cos(g) * r * 0.3, y + r * 0.6 + Math.sin(g) * r * 0.12, x + Math.cos(g) * r * (0.7 + k), y + r * 0.6 + Math.sin(g) * r * (0.3 + k * 0.3), "#5E4A36", 3);
        }
        break;
      case "empala":
        tajo(h.dir, r * 1.5, 5, h.col);
        P(c, [x + Math.cos(h.dir) * r * 1.5, y + Math.sin(h.dir) * r * 1.2, x + Math.cos(h.dir + 0.3) * r * 1.2, y + Math.sin(h.dir + 0.3) * r, x + Math.cos(h.dir - 0.3) * r * 1.2, y + Math.sin(h.dir - 0.3) * r], "#F2ECEC");
        break;
      case "flecha":
        tajo(h.dir, r * 1.3, 3, h.col);
        for (let i = 0; i < 5; i++) {
          const g = h.dir + (i - 2) * 0.35;
          L(c, x, y, x + Math.cos(g) * r * (0.6 + k), y + Math.sin(g) * r * (0.5 + k), "#FFD98A", 2);
        }
        break;
      case "runa": {
        const rr = r * (0.5 + k);
        c.strokeStyle = h.col;
        c.lineWidth = 4;
        c.beginPath();
        c.ellipse(x, y, rr, rr * 0.6, 0, 0, Math.PI * 2);
        c.stroke();
        // Ansuz en el centro
        L(c, x - 6, y + 16, x - 6, y - 16, h.col, 4);
        L(c, x - 6, y - 16, x + 8, y - 8, h.col, 4);
        L(c, x - 6, y - 6, x + 8, y + 2, h.col, 4);
        break;
      }
      default:
        E(c, x - r * 0.3, y, r * 0.35 * (1 + k), r * 0.35 * (1 + k), "rgba(255,141,113,0.6)");
        E(c, x + r * 0.3, y - r * 0.2, r * 0.3 * (1 + k), r * 0.3 * (1 + k), "rgba(255,141,113,0.5)");
    }
    c.restore();
  }
  // la marca roja sobre quien se puede rematar
  function marca(c, e) {
    const y = e.y - (e.d.barra || 80) - (e.lider ? 56 : 30),
      x = e.x,
      p = 1 + Math.sin(J.t * 7) * 0.12,
      s = 12 * p;
    DIB.P(c, [x, y - s * 1.3 - 3, x + s + 3, y, x, y + s * 1.3 + 3, x - s - 3, y], "#111111");
    DIB.P(c, [x, y - s * 1.3, x + s, y, x, y + s * 1.3, x - s, y], "#C8402D");
    DIB.P(c, [x, y - s * 1.3, x, y + s * 1.3, x - s, y], "#5E130D");
    DIB.L(c, x - s * 0.45, y + s * 0.5, x + s * 0.45, y - s * 0.5, "#F2ECEC", 2);
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
    },
    alEmpezar(extra) {
      extra.remates = Object.assign(base(), extra.remates || {});
      st = extra.remates;
      rem = null;
      huellas.length = 0;
    },
    actualizar(dt) {
      if (!A) return;
      for (const h of huellas) h.t += dt;
      while (huellas.length && huellas[0].t > 0.5) huellas.shift();
      if (rem) return paso(dt);
      // la primera vez que aparece la marca, se explica
      if (!st.ayuda && !J.dentro && A.enemigos.some((e) => puede(e) && Math.hypot(e.x - jug.x, e.y - jug.y) < VE)) {
        st.ayuda = true;
        HUD.aviso(t("rm.ayuda", [CONTROLES.glifo("interactuar")]), "#C8402D", t("rm.ayuda_t"));
      }
    },
    cercanos(dar) {
      if (J.dentro || rem || jug.muerto) return;
      for (const e of A.enemigos) {
        if (!puede(e)) continue;
        const d = Math.hypot(e.x - jug.x, e.y - jug.y);
        // adelante de todo lo demás: en plena pelea es lo que más importa
        if (d < ALCANCE + (e.d.radio || 22)) dar(d * 0.3, t("rm.rematar", [t("rm." + tipoArma())]), () => rematar(e), e.x, e.y - (e.d.barra || 80) - 70);
      }
    },
    modDano(dano, e) {
      const b = verdugo();
      return b && e && e.d && e.vida < (e.d.vida || 1) * 0.3 ? dano * (1 + b / 100) : dano;
    },
    sobreLuz(c) {
      if (J.dentro) return;
      if (!rem) for (const e of A.enemigos) if (puede(e) && Math.abs(e.x - jug.x) < VE * 1.4 && Math.abs(e.y - jug.y) < VE) marca(c, e);
      for (const h of huellas) trazo(c, h);
    },
    diario() {
      if (!st.n) return "";
      const fav = Object.keys(st.porTipo).sort((a, b) => st.porTipo[b] - st.porTipo[a])[0];
      return `<div class="diario-resumen"><p><b>${t("rm.diario_t")}</b> ${t("rm.diario", [st.n, t("rm." + fav)])}${verdugo() ? " " + t("rm.diario_bono", [verdugo()]) : ""}</p></div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, actual: () => rem, puede, rematar, tipoArma, verdugo, REMATES, VERDUGO, UMBRAL, UMBRAL_DURO };
})();
