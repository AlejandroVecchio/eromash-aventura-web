// ---------- el escudo: bloquear, parar y empujar (sistema ESCUDO, acción `bloquear`) ----------
// Manteniendo bloquear (G, L2 o clic derecho) Eromash levanta el escudo: camina más lento, no ataca y los golpes que
// vienen de adelante (±75°) pierden lo que bloquea el escudo (B.bloqueo; sin escudo, con el arma, el 35 %) a cambio
// de estamina. Si la estamina no alcanza, la guardia se rompe: tambalea y entra la mitad. Levantar el escudo justo
// antes de que llegue el golpe (la ventana de parada) es una **parada**: no entra nada, la criatura queda aturdida,
// el mundo va lento un instante, vuelve estamina y el próximo golpe pega doble (el contraataque de siempre). Atacar
// con el escudo levantado es un empujón que aturde. El arco y el bastón no bloquean. El escudo puesto se ve en el
// brazo de Eromash (el dibujo de la arena), de frente, de costado o a la espalda según hacia dónde mira.
// Detalle en docs/rpg.md (Escudo).
window.ESCUDO = (function () {
  "use strict";
  let A, J, jug;
  const t = (k, v) => I18N.t(k, v);
  const BASE = { arma: 35, cono: 1.31, parada: 0.18, aturde: 1.2, rota: 0.9, gasto: 1, empujon: 12 };
  const EMPUJON = { wind: 0.05, swing: 0.12, rec: 0.24, arc: 1.4, reach: 82, dano: 8, empuje: 1.9, empujon: true, mueve: 0.6 };

  let levantado = false,
    desde = -9, // cuándo se levantó (para la ventana de parada)
    rota = 0, // la guardia rota: no se puede levantar
    destello = 0; // el escudo brilla un instante al parar
  const escudo = () => (window.BOTIN ? BOTIN.puesta("escudo") : null);
  const base = () => {
    const e = escudo();
    return e ? OBJETOS.BASES[e.b] : null;
  };
  // ¿puede bloquear con lo que lleva? (el arco y el bastón no)
  function puede() {
    if (escudo()) return true;
    const tp = window.ARMAS ? ARMAS.tipoActual() : "espada";
    return tp !== "arco" && tp !== "baston" && !(window.ARMAS && ARMAS.manoVacia());
  }
  const cuanto = () => (base() ? base().bloqueo || 50 : BASE.arma);
  const ventana = () => (base() && base().parada) || BASE.parada;

  // ---------- recibir ----------
  function deFrente(ox, oy) {
    const mira = Math.atan2(jug.dir[1], jug.dir[0]);
    let da = Math.atan2((oy - jug.y) * 1.25, ox - jug.x) - mira;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    return Math.abs(da) <= BASE.cono;
  }
  function quienPega(ox, oy) {
    let mejor = null,
      dm = 220;
    for (const e of A.enemigos) {
      if (!e.activo || e.muerto) continue;
      const l = Math.hypot(e.x - ox, e.y - oy);
      if (l < dm) {
        dm = l;
        mejor = e;
      }
    }
    return mejor;
  }
  function parar(ox, oy) {
    const e = quienPega(ox, oy);
    if (e) {
      e.aturdido = Math.max(e.aturdido || 0, BASE.aturde);
      if (e.aviso) e.aviso = null;
    }
    J.camLenta = 0.3;
    jug.sta = Math.min(jug.staMax, jug.sta + 20);
    jug.contra = 1.6;
    destello = 0.35;
    A.textoFlotante(jug.x, jug.y - 140, t("eb.parada"), "#FFD98A");
    A.chispa(jug.x + jug.dir[0] * 40, jug.y - 70);
    A.chispa(jug.x + jug.dir[0] * 40, jug.y - 70);
    J.hitstop = Math.max(J.hitstop || 0, 0.08);
    if (window.SONIDO) {
      SONIDO.tocar("filo", { vol: 0.7, tono: 0.8 });
      SONIDO.tocar("golpeFuerte", { vol: 0.5, tono: 1.3 });
    }
    if (window.ANIMA) ANIMA.gesto("feliz");
  }
  function romper() {
    rota = BASE.rota;
    levantado = false;
    jug.lento = Math.max(jug.lento || 0, BASE.rota);
    A.textoFlotante(jug.x, jug.y - 140, t("eb.rota"), "#C8402D");
    J.sacudir(0.3);
    if (window.SONIDO) SONIDO.tocar("golpe", { vol: 0.7, tono: 0.5 });
    if (window.ANIMA) ANIMA.gesto("susto");
  }

  // ---------- el escudo en el brazo ----------
  // pasada: true = la que va antes del cuerpo (detrás), false = la de después (delante)
  function dibujar(c, p, ctx, pasada) {
    const it = escudo();
    if (!it || p.muerto) return;
    const im = ARTE_OBJ.imagen(it);
    if (!im || !im.complete || !im.naturalWidth) return;
    const v = ctx.vista,
      arriba = levantado;
    // de espaldas va detrás; de costado, detrás salvo levantado; de frente, delante
    const atras = v === "N" ? true : v === "E" ? !arriba : false;
    if (atras !== pasada) return;
    const yb = p.y - ctx.jp * 70 + ctx.po.dy - ctx.bob;
    let x, y, sx, s;
    if (arriba) {
      // levantado: delante del pecho, hacia donde mira
      x = p.x + ctx.po.dx + (v === "E" ? ctx.face * 44 : ctx.face * 10);
      y = yb - 88;
      s = 88;
      sx = v === "E" ? 0.55 : 1;
    } else {
      // colgado del brazo de la otra mano
      x = p.x + ctx.po.dx - ctx.lado * (v === "E" ? 6 : 42);
      y = yb - 66;
      s = 70;
      sx = v === "E" ? 0.5 : 0.9;
    }
    c.save();
    c.translate(x, y);
    c.scale(sx, 1);
    if (v === "N") {
      // de espaldas se ve el revés: más oscuro
      c.globalAlpha = 0.95;
      c.drawImage(im, -s / 2, -s / 2, s, s);
      c.globalCompositeOperation = "source-atop";
      DIB.alfa(c, 0.45, () => DIB.P(c, [-s / 2, -s / 2, s / 2, -s / 2, s / 2, s / 2, -s / 2, s / 2], "#111111"));
    } else c.drawImage(im, -s / 2, -s / 2, s, s);
    if (destello > 0)
      DIB.alfa(c, destello / 0.35, () => {
        c.globalCompositeOperation = "lighter";
        c.drawImage(im, -s / 2, -s / 2, s, s);
      });
    c.restore();
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
    },
    alEmpezar() {
      levantado = false;
      rota = 0;
    },
    actualizar(dt) {
      rota = Math.max(0, rota - dt);
      destello = Math.max(0, destello - dt);
      const quiere = CONTROLES.pulsado("bloquear") && J.modo === "juego" && !jug.muerto && !(jug.salto > 0) && !(jug.esq > 0) && rota <= 0 && puede();
      if (quiere && !levantado) {
        desde = J.t;
        if (window.SONIDO) SONIDO.tocar("tela", { vol: 0.35, tono: 0.8 });
      }
      levantado = quiere;
      jug.bloquea = levantado;
      if (!levantado) return;
      // levantado: más lento, sin cargar golpes y sin recuperar estamina
      jug.lento = Math.max(jug.lento || 0, 0.05);
      jug.carga = 0;
      jug.staEspera = Math.max(jug.staEspera || 0, 0.3);
      // atacar con el escudo levantado: el empujón (o nada, sin estamina)
      const a = jug.atk;
      if (a && !a.d.empujon && a.t < 0.06) {
        if (escudo() && jug.sta >= BASE.empujon) {
          jug.sta -= BASE.empujon;
          jug.atk = { t: 0, d: EMPUJON, dir: a.dir, side: 1, pego: false };
          if (window.SONIDO) SONIDO.tocar("golpe", { vol: 0.5, tono: 0.7 });
        } else jug.atk = null;
      }
    },
    alPegar(e, dano, info, murio) {
      if (!murio && info && info.d && info.d.empujon) e.aturdido = Math.max(e.aturdido || 0, 0.7);
    },
    // los golpes de adelante con el escudo levantado: parada, bloqueo o guardia rota
    modRecibido(dano, tipo, ox, oy) {
      if (!levantado || dano <= 0 || ox == null || !deFrente(ox, oy)) return dano;
      if (J.t - desde <= ventana()) {
        parar(ox, oy);
        return 0;
      }
      const queda = dano * (1 - cuanto() / 100),
        gasto = (dano - queda) * BASE.gasto;
      if (jug.sta < gasto) {
        jug.sta = 0;
        romper();
        return Math.round(dano * 0.5);
      }
      jug.sta -= gasto;
      jug.staEspera = 0.8;
      A.chispa(jug.x + jug.dir[0] * 36, jug.y - 70);
      if (window.SONIDO) SONIDO.tocar("golpe", { vol: 0.6, tono: escudo() ? 0.75 : 1.2 });
      J.sacudir(0.12);
      return Math.round(queda);
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, dibujar, levantado: () => levantado, rota: () => rota, puede, cuanto, ventana, BASE, EMPUJON };
})();
