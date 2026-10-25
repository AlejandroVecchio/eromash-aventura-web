// ---------- la lanza (sistema LANZA_ARMA, tipo de arma "lanza") ----------
// La lanza mantiene a raya: estocadas rectas y largas (más alcance que cualquier otra arma) y un tercer golpe que
// barre todo delante y empuja lejos. Pegar con la punta, en el último tramo del alcance, hace ×1,3 («¡Punta!»):
// premia pelear a distancia. Corriendo, la embestida atraviesa la fila. Manteniendo atacar se arroja: vuela recta,
// atraviesa hasta tres criaturas, aturde a la primera y se clava en el piso; Eromash pelea a puño limpio hasta
// juntarla (pasando por encima) o hasta que la runa la trae de vuelta sola a los 4 s, como la lanza de Odín. Se lleva
// con una mano: el escudo sigue. Detalle en docs/rpg.md (Armas · Lanza).
window.LANZA_ARMA = (function () {
  "use strict";
  let A, J, jug, W;
  const PUNTA = { desde: 0.7, mult: 1.3 };
  const TIRO = { vel: 1350, largo: 720, radio: 22, dano: 30, empuje: 1.2, atraviesa: 3, aturde: 1, vuelve: 4, velVuelta: 1500, junta: 60 };
  ARMAS.tipo("lanza", {
    combo: [
      { wind: 0.1, swing: 0.1, rec: 0.18, arc: 0.5, reach: 150, dano: 14, empuje: 0.35, estoque: true, punta: true },
      { wind: 0.1, swing: 0.1, rec: 0.2, arc: 0.5, reach: 150, dano: 15, empuje: 0.35, estoque: true, punta: true },
      { wind: 0.18, swing: 0.16, rec: 0.3, arc: 2.6, reach: 140, dano: 24, empuje: 2, remate: true },
    ],
    giro: { wind: 0.16, swing: 0.05, rec: 0.25, arc: 0.01, reach: 1, dano: 0, arrojar: true, sinEstela: true },
    carrera: { wind: 0.06, swing: 0.22, rec: 0.3, arc: 0.6, reach: 165, dano: 26, avanza: 520, empuje: 1.6, estoque: true, punta: true },
    caida: { wind: 0, swing: 0.1, rec: 0.3, arc: 0.8, reach: 150, dano: 28, empuje: 1.4, caida: true, estoque: true, punta: true },
    carga: 0.5,
    coste: 16,
  });
  const esLanza = () => ARMAS.tipoActual() === "lanza";

  // la lanza arrojada: { x, y, dir, d, estado: "vuela" | "clavada" | "vuelve", t, ya, it }
  let tiro = null;
  ARMAS.sinArma(() => !!tiro);
  function arrojar(dir) {
    tiro = { x: jug.x, y: jug.y, dir, d: 0, estado: "vuela", t: 0, ya: new Set(), it: BOTIN.puesta("arma") };
    if (window.SONIDO) SONIDO.tocar("tajo", { vol: 0.55, tono: 0.85 });
  }
  function pegarTiro(e, primera) {
    const critico = Math.random() < (J.critProb != null ? J.critProb : 0.1),
      sorpresa = e.estado === "quieto";
    let dano = TIRO.dano * (J.mulDano || 1) * (critico ? J.critMult || 1.6 : 1) * (sorpresa ? 1.5 : 1);
    const info = { d: { dano: TIRO.dano, arrojada: true, lanza: true }, critico, sorpresa };
    for (const s of window.SISTEMAS) if (s.modDano && s !== sistema) dano = s.modDano(dano, e, info);
    dano = Math.round(dano);
    A.chispa(e.x, e.y - 40);
    A.numero(e.x, e.y - 60, dano, critico ? "#FFD98A" : sorpresa ? "#FF8D71" : null, critico);
    const murio = A.CB.golpear(J, e, dano, tiro.x - Math.cos(tiro.dir) * 40, tiro.y - Math.sin(tiro.dir) * 32, TIRO.empuje);
    if (primera && !murio) e.aturdido = Math.max(e.aturdido || 0, TIRO.aturde);
    window.SISTEMAS.forEach((s) => s.alPegar && s.alPegar(e, dano, info, murio));
    if (window.SONIDO) SONIDO.tocar("golpeFuerte", { vol: 0.6, tono: 1.05, x: e.x, y: e.y });
    J.hitstop = Math.max(J.hitstop || 0, 0.04);
  }
  function clavar() {
    tiro.estado = "clavada";
    tiro.t = 0;
    A.polvareda(tiro.x, tiro.y, 5);
    if (window.SONIDO) SONIDO.tocar("golpe", { vol: 0.45, tono: 0.9, x: tiro.x, y: tiro.y });
  }
  function moverTiro(dt) {
    const v = tiro;
    v.t += dt;
    if (v.estado === "vuela") {
      const paso = TIRO.vel * dt,
        nx = v.x + Math.cos(v.dir) * paso,
        ny = v.y + (Math.sin(v.dir) * paso) / 1.25;
      if (!W.libre(nx, ny, 8)) return clavar();
      v.x = nx;
      v.y = ny;
      v.d += paso;
      for (const e of A.enemigos) {
        if (!e.activo || e.muerto || v.ya.has(e) || v.ya.size >= TIRO.atraviesa) continue;
        if (Math.hypot(e.x - v.x, (e.y - v.y) * 1.25) > TIRO.radio + (e.d.radio || 18)) continue;
        v.ya.add(e);
        pegarTiro(e, v.ya.size === 1);
      }
      if (v.d >= TIRO.largo) clavar();
    } else if (v.estado === "clavada") {
      // se junta pasando por encima, o la runa la trae de vuelta
      if (Math.hypot(jug.x - v.x, (jug.y - v.y) * 1.25) < TIRO.junta) return juntar();
      if (v.t >= TIRO.vuelve) {
        v.estado = "vuelve";
        if (window.SONIDO) SONIDO.runa ? SONIDO.runa(v.x, v.y) : SONIDO.tocar("filo", { vol: 0.5 });
      }
    } else {
      const dx = jug.x - v.x,
        dy = jug.y - v.y,
        d = Math.hypot(dx, dy) || 1,
        paso = Math.min(d, TIRO.velVuelta * dt);
      v.x += (dx / d) * paso;
      v.y += (dy / d) * paso;
      v.dir = Math.atan2(dy * 1.25, dx);
      if (d < 40) juntar();
    }
  }
  function juntar() {
    tiro = null;
    jug.atk = null;
    if (window.SONIDO) SONIDO.tocar("filo", { vol: 0.55 });
  }

  // ---------- en la mano ----------
  ARMAS.poseDe("lanza", (sp, p, ctx) => {
    const a = p.atk,
      yb = p.y - ctx.jp * 70;
    if (!a) {
      // parada al costado, la punta arriba
      return { sp: { x: p.x + ctx.lado * 64, y: yb - 92 - ctx.bob + Math.sin(J.t * 2.4) * 4, ang: -Math.PI / 2 + ctx.lado * 0.12, s: 0.34 }, detras: false };
    }
    const d = a.d,
      ang = a.dir + ctx.gC;
    if (d.estoque || d.arrojar) {
      // la estocada: va hacia atrás tomando envión y sale recta
      const k = a.t < d.wind ? -0.5 * (a.t / d.wind) : a.t < d.wind + d.swing ? -0.5 + 1.5 * ((a.t - d.wind) / d.swing) : 1 - Math.min(1, (a.t - d.wind - d.swing) / d.rec);
      const r = 40 + 60 * k;
      return { sp: { x: p.x + Math.cos(ang) * r, y: yb - 58 + Math.sin(ang) * r * 0.8, ang, s: 0.36 }, detras: Math.sin(ang) < -0.3 };
    }
    return null; // el barrido: como la espada
  });

  // ---------- dibujo ----------
  function dibujarTiro(c) {
    const v = tiro,
      B = v.it && OBJETOS.BASES[v.it.b];
    if (!B) return;
    const [x0, y0] = J.vista(v.x - Math.cos(v.dir) * 30, v.y - (Math.sin(v.dir) * 30) / 1.25),
      [x1, y1] = J.vista(v.x, v.y),
      ang = Math.atan2(y1 - y0, x1 - x0);
    c.save();
    if (v.estado === "clavada") {
      // clavada de punta en el piso, el asta inclinada hacia atrás de donde venía, temblando al principio
      const tiembla = Math.max(0, 0.4 - v.t) * Math.sin(v.t * 60) * 0.25;
      c.translate(x1, y1);
      c.rotate(Math.PI - Math.cos(ang) * 0.45 + tiembla);
      c.scale(0.3, 0.3);
      c.translate(0, 300);
    } else {
      c.translate(x1, y1 - 50);
      c.rotate(ang + Math.PI / 2);
      c.scale(0.3, 0.3);
      if (v.estado === "vuelve") DIB.alfa(c, 0.4, () => DIB.P(c, [-8, 120, 8, 120, 3, 420, -3, 420], "#73D5DB"));
    }
    DIB_ARMAS.dibujar(c, B.arte.forma, B.arte.fam, ARTE_OBJ.tier(v.it));
    c.restore();
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
    },
    alEmpezar() {
      tiro = null;
    },
    actualizar(dt) {
      const a = jug.atk;
      if (a && a.d.arrojar && !a.arrojo && a.t >= a.d.wind) {
        a.arrojo = true;
        arrojar(a.dir);
      }
      if (tiro) moverTiro(dt);
    },
    // con la punta (el último tramo del alcance) la estocada pega más
    modDano(dano, e, info) {
      if (!info || !info.d || !info.d.punta) return dano;
      const l = Math.hypot(e.x - jug.x, (e.y - jug.y) * 1.25);
      if (l < info.d.reach * PUNTA.desde) return dano;
      info.punta = true;
      if (Math.random() < 0.5 || info.critico) A.textoFlotante(e.x, e.y - 110, I18N.t("ar.punta"), "#F2ECEC");
      return dano * PUNTA.mult;
    },
    piso(c) {
      if (tiro && tiro.estado !== "clavada") DIB.alfa(c, 0.35, () => DIB.E(c, tiro.x, tiro.y, 26, 7, "#000"));
      if (tiro && tiro.estado === "clavada") {
        DIB.alfa(c, 0.35, () => DIB.E(c, tiro.x, tiro.y, 12, 5, "#000"));
        // el anillo rúnico que avisa cuánto falta para que vuelva sola
        const u = tiro.t / TIRO.vuelve;
        DIB.alfa(c, 0.5, () => {
          c.strokeStyle = "#73D5DB";
          c.lineWidth = 3;
          c.beginPath();
          c.ellipse(tiro.x, tiro.y, 34, 27, 0, -Math.PI / 2, -Math.PI / 2 + u * Math.PI * 2);
          c.stroke();
        });
      }
    },
    sobreLuz(c) {
      if (!tiro || !J.baseT) return;
      c.save();
      J.baseT();
      dibujarTiro(c);
      c.restore();
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, tiro: () => tiro, PUNTA, TIRO };
})();
