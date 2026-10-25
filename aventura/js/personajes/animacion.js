// ---------- cómo se mueve Eromash (módulo ANIMA) ----------
// Eromash es el mismo de la arena (VIKINGO: casco con la E, cara negra, barba): acá no se redibuja, se le da vida.
// Cada cuadro el motor pide una pose: cuánto se estira o se aplasta (desde los pies), cuánto se inclina, si se corre
// un poco, qué cara pone y si destella. Golpe recibido, duda, correr, saltar y caer, malherido, cansado, esquiva con
// estela, giro, respirar y parpadear, mirar alrededor, ataque con anticipación, caer al morir y volver.
// Los gestos (duda, feliz, susto) los piden los sistemas con ANIMA.gesto(tipo).
window.ANIMA = (function () {
  "use strict";
  const st = {
    t: 0,
    golpeT: 9,
    golpeLado: 1,
    aterrizaT: 9,
    saltoAntes: 0,
    giroT: 9,
    vistaAntes: "",
    parpadeo: 3,
    quietoT: 0,
    gesto: null, // { tipo, t, dur }
    estela: [],
    estelaT: 0,
    muerteT: -1,
    vuelveT: 9,
    vuelveAntes: 0,
  };
  const DUR = { duda: 1.3, feliz: 0.9, susto: 0.7 };
  function gesto(tipo, dur) {
    // un gesto no pisa a otro más importante que recién empezó
    if (st.gesto && st.gesto.t < 0.25 && st.gesto.tipo === "susto" && tipo !== "susto") return;
    st.gesto = { tipo, t: 0, dur: dur || DUR[tipo] || 1 };
  }
  // ox: de dónde vino el golpe (x del mundo); el cuerpo se va para el otro lado
  function golpe(p, ox) {
    st.golpeT = 0;
    st.golpeLado = p.x >= ox ? 1 : -1;
  }
  // un resorte que arranca en 1 y se apaga: para aplastarse y volver con un rebote
  const resorte = (t, k = 12, w = 28) => Math.exp(-t * k) * Math.cos(t * w);

  // lo que pasa con el tiempo (se llama una vez por cuadro desde el dibujo)
  function actualizar(p, dt, mov) {
    st.t += dt;
    st.golpeT += dt;
    st.aterrizaT += dt;
    st.giroT += dt;
    st.vuelveT += dt;
    if (st.gesto && (st.gesto.t += dt) > st.gesto.dur) st.gesto = null;
    if (st.saltoAntes > 0 && p.salto <= 0) st.aterrizaT = 0;
    st.saltoAntes = p.salto;
    const vista = p.mira.vista + (p.mira.espejo ? "-" : "");
    if (vista !== st.vistaAntes) {
      if (st.vistaAntes) st.giroT = 0;
      st.vistaAntes = vista;
    }
    st.quietoT = mov || p.atk || p.salto > 0 || p.esq > 0 || p.interactuando > 0 ? 0 : st.quietoT + dt;
    st.parpadeo -= dt;
    if (st.parpadeo < -0.13) st.parpadeo = 2.4 + ((st.t * 7.31) % 1) * 2.6;
    if (p.muerto) st.muerteT = st.muerteT < 0 ? 0 : st.muerteT + dt;
    else st.muerteT = -1;
    if ((p.vuelve || 0) > st.vuelveAntes + 1) st.vuelveT = 0;
    st.vuelveAntes = p.vuelve || 0;
    // la estela de la esquiva: copias que quedan atrás y se apagan
    st.estelaT -= dt;
    if (p.esq > 0 && st.estelaT <= 0) {
      st.estelaT = 0.035;
      st.estela.push({ x: p.x, y: p.y, t: 0 });
    }
    st.estela.forEach((e) => (e.t += dt));
    while (st.estela.length && st.estela[0].t > 0.24) st.estela.shift();
  }

  // la pose de este cuadro. base: { paso, malherido, cansado, canal } que el motor ya sabe
  function pose(p, base) {
    const o = { sx: 1, sy: 1, rot: 0, dx: 0, dy: 0, ojos: null, flash: 0, alfa: 1, vista: null, espejo: null, golpe: false };
    const t = st.t;
    // respirar (siempre, apenas)
    o.sy *= 1 + Math.sin(t * 2.2) * 0.012;
    // caminar y correr: se aplasta al apoyar y se estira en el aire; de frente o de espaldas se mece
    if (base.paso > 0 && p.salto <= 0) {
      const w = [0, 7, 11, 16][base.paso],
        u = Math.abs(Math.sin(t * w)),
        fuerza = base.paso === 3 ? 0.1 : 0.05;
      o.sy *= 1 - fuerza * 0.6 + fuerza * u;
      o.sx /= Math.sqrt(o.sy);
      if (VOL.relativa(p.mira.vista, p.mira.espejo).vista === "E") o.rot += base.paso === 3 ? 0.16 : 0.05; // corriendo se tira para adelante
      else o.rot += Math.sin(t * w * 0.5) * (base.paso === 3 ? 0.07 : 0.035);
    }
    // saltar: se encoge al despegar, se estira subiendo y bajando; al caer se aplasta y rebota
    if (p.salto > 0) {
      const q = 1 - p.salto / 0.42;
      const s = q < 0.08 ? -0.6 * (1 - q / 0.08) : q < 0.5 ? 1 - q * 2 : (q - 0.5) * 1.2;
      o.sy *= 1 + 0.12 * s;
      o.sx *= 1 - 0.08 * s;
    } else if (st.aterrizaT < 0.32) {
      const r = resorte(st.aterrizaT, 11, 26);
      o.sy *= 1 - 0.2 * r;
      o.sx *= 1 + 0.16 * r;
    }
    // agachado (sigilo.js): más bajo y ancho, tirado para adelante, con la cara concentrada
    if (p.agachado && p.salto <= 0) {
      o.sy *= 0.8;
      o.sx *= 1.08;
      o.rot += 0.07;
      o.ojos = o.ojos || "concentrado";
    }
    // el giro: se afina un instante, como si diera la vuelta
    if (st.giroT < 0.12) o.sx *= 0.78 + (st.giroT / 0.12) * 0.22;
    // esquivar: se estira hacia donde va
    if (p.esq > 0) {
      o.sx *= 1.16;
      o.sy *= 0.88;
      const dx = p.esqDir ? p.esqDir[0] : 0;
      o.rot += (p.mira.espejo ? -dx : dx) * 0.22;
    }
    // atacar: se echa atrás al cargar el golpe y se tira adelante al soltarlo
    if (p.atk) {
      const a = p.atk,
        d = a.d,
        hacia = Math.cos(a.dir) * (p.mira.espejo ? -1 : 1);
      // las armas pesadas (d.peso) se echan más atrás; el golpe desde arriba (d.piso) se estira y después se aplasta
      const peso = d.peso || 1;
      if (a.t < d.wind) {
        const k = a.t / d.wind;
        o.rot -= hacia * 0.14 * k * peso;
        o.sy *= d.piso ? 1 + 0.09 * k : 1 - 0.05 * k;
      } else if (a.t < d.wind + d.swing + 0.08) {
        o.rot += hacia * 0.16 * Math.min(1.6, peso);
        o.sx *= d.piso ? 1.16 : 1.07;
        o.sy *= d.piso ? 0.84 : 0.95;
      }
    }
    // malherido: más caído, se tambalea y respira hondo; la cara floja (y por momentos de dolor)
    if (base.malherido) {
      o.dy += 5;
      o.rot += Math.sin(t * 1.4) * 0.06;
      o.sy *= 1 + Math.sin(t * 4.2) * 0.025;
      o.ojos = Math.sin(t * 0.9) > 0.82 ? "hurt" : "flojo";
    }
    // cansado (sin estamina): jadea
    if (base.cansado) {
      o.sy *= 1 + Math.sin(t * 9) * 0.035;
      o.dy += 3;
      o.ojos = o.ojos || "flojo";
    }
    // juntando luz o despertando una piedra: se concentra y tiembla apenas
    if (base.canal) {
      o.ojos = "concentrado";
      o.rot += Math.sin(t * 38) * 0.015;
    }
    // quieto un rato: mira a un lado y al otro
    if (st.quietoT > 7 && !base.malherido) {
      const fase = Math.floor((st.quietoT - 7) / 1.6) % 4;
      if (fase === 1) (o.vista = "E"), (o.espejo = false);
      else if (fase === 3) (o.vista = "E"), (o.espejo = true);
    }
    // gestos pedidos por los sistemas
    const g = st.gesto;
    if (g) {
      const k = g.t / g.dur;
      if (g.tipo === "duda") {
        o.ojos = "duda";
        o.rot += Math.sin(g.t * 5.5) * 0.13 * (1 - k * 0.6);
        o.dy -= Math.abs(Math.sin(g.t * 2.5)) * 3;
      } else if (g.tipo === "feliz") {
        o.ojos = "happy";
        if (g.t < 0.45) {
          const h = Math.sin((g.t / 0.45) * Math.PI);
          o.dy -= h * 20;
          o.sy *= 1 + h * 0.06;
        }
      } else if (g.tipo === "susto") {
        o.ojos = "susto";
        const r = resorte(g.t, 9, 30);
        o.sy *= 1 + 0.1 * r;
        o.sx *= 1 - 0.06 * r;
        o.dy -= Math.max(0, r) * 8;
      }
    }
    // el golpe recibido: se aplasta, se tuerce para el lado contrario, retrocede y destella en blanco
    if (st.golpeT < 0.5) {
      const r = resorte(st.golpeT, 9, 32),
        k = 1 - st.golpeT / 0.5,
        lado = st.golpeLado * (p.mira.espejo ? -1 : 1);
      o.sx *= 1 + 0.2 * r;
      o.sy *= 1 - 0.18 * r;
      o.rot += lado * 0.32 * Math.exp(-st.golpeT * 7);
      o.dx += st.golpeLado * 10 * k;
      o.flash = st.golpeT < 0.2 ? 1 - st.golpeT / 0.2 : 0;
      o.golpe = st.golpeT < 0.28; // mientras dura el golpe no parpadea la invulnerabilidad: se tiene que leer
      o.ojos = "hurt";
    }
    // parpadear (con la cara tranquila o feroz)
    if (st.parpadeo < 0 && (!o.ojos || o.ojos === "flojo")) o.ojos = "cerrado";
    // volver después de caer: aparece de golpe con un rebote
    if (st.vuelveT < 0.4) {
      const s = 1 - resorte(st.vuelveT, 8, 18) * 0.4;
      o.sx *= s;
      o.sy *= s;
    }
    // caer al morir: se va de costado, queda tendido y se apaga
    if (st.muerteT >= 0) {
      const k = Math.min(1, st.muerteT / 0.35);
      o.rot = 1.45 * k * k * (p.mira.espejo ? -1 : 1);
      o.dy += 10 * k;
      o.ojos = "hurt";
      o.alfa = st.muerteT > 0.9 ? Math.max(0, 1 - (st.muerteT - 0.9) / 0.6) : 1;
    }
    return o;
  }
  // la silueta blanca de un dibujo, para el destello del golpe y la estela (se arma una vez por imagen)
  const blancos = new Map();
  function blanco(img) {
    if (!img.complete || !img.naturalWidth) return null;
    let b = blancos.get(img);
    if (!b) {
      b = document.createElement("canvas");
      b.width = 250;
      b.height = 300;
      const c = b.getContext("2d");
      c.drawImage(img, 0, 0, 250, 300);
      c.globalCompositeOperation = "source-in";
      c.fillStyle = "#F2ECEC";
      c.fillRect(0, 0, 250, 300);
      blancos.set(img, b);
    }
    return b;
  }
  return { gesto, golpe, actualizar, pose, blanco, estela: () => st.estela, quieto: () => st.quietoT };
})();
