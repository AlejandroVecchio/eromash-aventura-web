// ---------- combate: criaturas, avisos en el piso y el Ciervo Hueco (módulo COMBATE) ----------
// Las reglas de la arena para todo golpe enemigo: el piso marca exactamente lo que pega, con tiempo para salir;
// saltar evita todo; una casa, una roca o un tronco de por medio anula el golpe; nada saca más del 35 % de la vida.
// Valores de la aventura de Godot pasados a unidades (1 m ≈ 30).
window.COMBATE = (function () {
  "use strict";
  const M = 30; // un metro de combate: las distancias de pelea no crecen con el mapa
  const { E, alfa, TAU } = DIB;

  const TIPOS = {
    lobo: { vida: 50, dano: 10, vel: 4.2 * M, alcance: 2 * M, aviso: 0.75, forma: "abanico", radioGolpe: 2.4 * M, angulo: 0.7, radio: 22, espera: 1.6 },
    errante: { vida: 70, dano: 14, vel: 1.9 * M, alcance: 1.9 * M, aviso: 0.9, forma: "abanico", radioGolpe: 2.3 * M, angulo: 0.9, radio: 16, espera: 1.8 },
    custodio: { vida: 170, dano: 22, vel: 1.5 * M, alcance: 2.8 * M, aviso: 1.3, forma: "circulo", radioGolpe: 3.2 * M, angulo: 0, radio: 28, espera: 2.4 },
  };
  const DETECTA = 13 * M,
    SUELTA = 26 * M,
    TOPE = 35; // 35 % de 100 de vida

  // ---------- avisos en el piso ----------
  // forma: circulo {radio} · abanico {radio, ang (medio ángulo), dir} · franja {largo, ancho, dir}
  function aviso(forma, x, y, dur, p) {
    return Object.assign({ forma, x, y, dur, t: 0, dir: 0 }, p);
  }
  function contiene(a, x, y) {
    const dx = x - a.x,
      dy = (y - a.y) * 1.25; // el piso se ve en perspectiva: el radio vertical es un poco menor
    if (a.forma === "circulo") return Math.hypot(dx, dy) <= a.radio;
    if (a.forma === "abanico") {
      if (Math.hypot(dx, dy) > a.radio) return false;
      let d = Math.atan2(dy, dx) - a.dir;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      return Math.abs(d) <= a.ang;
    }
    if (a.forma === "franja") {
      const ux = Math.cos(a.dir),
        uy = Math.sin(a.dir),
        u = dx * ux + dy * uy,
        v = -dx * uy + dy * ux;
      return u >= -20 && u <= a.largo && Math.abs(v) <= a.ancho / 2;
    }
    return false;
  }
  function forma(c, a, r) {
    c.beginPath();
    if (a.forma === "circulo") c.ellipse(a.x, a.y, a.radio * r, (a.radio / 1.25) * r, 0, 0, TAU);
    else if (a.forma === "abanico") {
      c.moveTo(a.x, a.y);
      for (let k = 0; k <= 16; k++) {
        const ang = a.dir - a.ang + (2 * a.ang * k) / 16;
        c.lineTo(a.x + Math.cos(ang) * a.radio * r, a.y + (Math.sin(ang) * a.radio * r) / 1.25);
      }
      c.closePath();
    } else if (a.forma === "franja") {
      const ux = Math.cos(a.dir),
        uy = Math.sin(a.dir) / 1.25,
        l = a.largo * r,
        w = a.ancho / 2;
      const nx = -Math.sin(a.dir),
        ny = Math.cos(a.dir) / 1.25;
      c.moveTo(a.x + nx * w, a.y + ny * w);
      c.lineTo(a.x + ux * l + nx * w, a.y + uy * l + ny * w);
      c.lineTo(a.x + ux * l - nx * w, a.y + uy * l - ny * w);
      c.lineTo(a.x - nx * w, a.y - ny * w);
      c.closePath();
    }
  }
  // el aviso de la arena: la zona entera tenue y un relleno que crece hasta el borde justo cuando pega
  function dibujarAviso(c, a) {
    const k = Math.min(1, a.t / a.dur);
    c.save();
    c.fillStyle = "rgba(200,64,45,0.16)";
    forma(c, a, 1);
    c.fill();
    c.strokeStyle = "rgba(255,141,113,0.75)";
    c.lineWidth = 2;
    c.stroke();
    c.fillStyle = "rgba(200,64,45,0.34)";
    forma(c, a, a.forma === "franja" ? k : Math.max(0.05, k));
    c.fill();
    c.restore();
  }

  // ---------- criaturas ----------
  function crear(tipo, x, y) {
    const d = TIPOS[tipo];
    return { tipo, d, x, y, casa: [x, y], vida: d.vida, estado: "quieto", t: 0, vx: 0, vy: 0, mira: { vista: "S", espejo: false }, golpe: 0, herido: 0, muerto: 0, aviso: null, mov: 0, activo: true };
  }
  function mover(e, dx, dy, r) {
    if (ELDERVALD.libre(e.x + dx, e.y, r)) e.x += dx;
    if (ELDERVALD.libre(e.x, e.y + dy, r)) e.y += dy;
  }
  function actualizar(J, e, dt) {
    if (!e.activo) return;
    if (e.muerto > 0) {
      e.muerto += dt;
      return;
    }
    const p = J.jugador,
      d = e.d,
      dx = p.x - e.x,
      dy = p.y - e.y,
      dist = Math.hypot(dx, dy);
    e.t += dt;
    e.herido = Math.max(0, e.herido - dt * 4);
    // empujón del golpe recibido
    if (Math.abs(e.vx) + Math.abs(e.vy) > 1) {
      mover(e, e.vx * dt, e.vy * dt, d.radio);
      e.vx *= Math.pow(0.002, dt);
      e.vy *= Math.pow(0.002, dt);
    }
    e.mov = 0;
    const aCasa = Math.hypot(e.x - e.casa[0], e.y - e.casa[1]);
    switch (e.estado) {
      case "quieto":
        if (!p.muerto && dist < DETECTA) e.estado = "persigue";
        break;
      case "persigue":
        if (p.muerto || aCasa > SUELTA) {
          e.estado = "vuelve";
          break;
        }
        if (dist < d.alcance) {
          e.estado = "aviso";
          e.t = 0;
          const dir = Math.atan2(dy * 1.25, dx);
          e.aviso = d.forma === "circulo" ? aviso("circulo", e.x, e.y, d.aviso, { radio: d.radioGolpe }) : aviso("abanico", e.x, e.y, d.aviso, { radio: d.radioGolpe, ang: d.angulo, dir });
          J.avisos.push(e.aviso);
          break;
        }
        mover(e, (dx / dist) * d.vel * dt, (dy / dist) * d.vel * dt, d.radio);
        e.mira = VIKINGO.vista(dx, dy, e.mira);
        e.mov = 1;
        break;
      case "aviso":
        e.golpe = Math.min(1, e.t / d.aviso);
        if (e.t >= d.aviso) {
          if (contiene(e.aviso, p.x, p.y) && !ELDERVALD.hayMuro(e.x, e.y, p.x, p.y)) J.herir(Math.min(d.dano, TOPE), e.x, e.y);
          J.quitarAviso(e.aviso);
          e.aviso = null;
          e.estado = "espera";
          e.t = 0;
        }
        break;
      case "espera":
        e.golpe = Math.max(0, e.golpe - dt * 4);
        if (e.t >= d.espera) {
          e.estado = "persigue";
          e.t = 0;
        }
        break;
      case "vuelve": {
        const cx = e.casa[0] - e.x,
          cy = e.casa[1] - e.y,
          l = Math.hypot(cx, cy);
        e.vida = Math.min(d.vida, e.vida + d.vida * 0.3 * dt);
        if (l < 12) {
          e.estado = "quieto";
          break;
        }
        mover(e, (cx / l) * d.vel * dt, (cy / l) * d.vel * dt, d.radio);
        e.mira = VIKINGO.vista(cx, cy, e.mira);
        e.mov = 1;
        if (!p.muerto && dist < DETECTA * 0.6 && aCasa < SUELTA * 0.7) e.estado = "persigue";
        break;
      }
    }
  }
  // recibe un golpe de Eromash: devuelve true si murió
  function golpear(J, e, dano, ox, oy) {
    if (e.muerto || !e.activo) return false;
    e.vida -= dano;
    e.herido = 1;
    const l = Math.hypot(e.x - ox, e.y - oy) || 1,
      k = e.tipo === "custodio" ? 90 : 320;
    e.vx = ((e.x - ox) / l) * k;
    e.vy = ((e.y - oy) / l) * k;
    if (e.estado === "quieto" || e.estado === "vuelve") e.estado = "persigue";
    if (e.vida <= 0) {
      e.muerto = 0.001;
      if (e.aviso) J.quitarAviso(e.aviso);
      e.aviso = null;
      return true;
    }
    return false;
  }
  function reiniciar(e) {
    Object.assign(e, { x: e.casa[0], y: e.casa[1], vida: e.d.vida, estado: "quieto", t: 0, vx: 0, vy: 0, golpe: 0, herido: 0, muerto: 0, aviso: null });
  }
  function dibujar(c, e, t) {
    if (!e.activo || e.muerto > 0.8) return;
    alfa(c, e.muerto > 0 ? 1 - e.muerto / 0.8 : 1, () => {
      CRIATURAS.dibujar(c, e.tipo, e.x, e.y, t, { vista: e.mira.vista, espejo: e.mira.espejo, mov: e.mov, golpe: e.golpe, herido: e.herido });
      if (e.vida < e.d.vida && e.muerto === 0) {
        const w = 40,
          y = e.y - (e.tipo === "custodio" ? 122 : e.tipo === "lobo" ? 66 : 96);
        c.fillStyle = "#0A0707";
        c.fillRect(e.x - w / 2, y, w, 5);
        c.fillStyle = "#C8402D";
        c.fillRect(e.x - w / 2, y, (w * e.vida) / e.d.vida, 5);
      }
    });
  }

  // ---------- el Ciervo Hueco (EL-05) ----------
  // Igual que en Godot: fases al 66 % y 33 %, cada una abre con un ataque fijo; nunca el mismo 3 veces seguidas;
  // queda expuesto después de cada golpe. Mientras quede un soporte en pie recibe 30 % del daño y no baja del 40 %;
  // sus embestidas rompen el soporte que encuentran: hay que pararse delante de uno.
  const VIDA_C = 900,
    VEL_C = 2.2 * M,
    PISO_ATADO = 0.4,
    DANO_ATADO = 0.3;
  const ATAQUES = {
    embestida: { aviso: 2.0, golpe: 0.9, dano: 28, accion: "accion_esquivar" },
    pisoton: { aviso: 1.8, golpe: 0.5, dano: 20, accion: "accion_alejarse" },
    barrido: { aviso: 1.6, golpe: 0.5, dano: 22, accion: "accion_saltar" },
    raices: { aviso: 2.0, golpe: 0.6, dano: 16, accion: "accion_alejarse" },
  };
  const FASES = [
    { hasta: 0.66, entra: "embestida", rot: ["pisoton", "embestida", "barrido", "embestida", "barrido"] },
    { hasta: 0.33, entra: "pisoton", rot: ["embestida", "raices", "barrido", "embestida", "pisoton"] },
    { hasta: 0, entra: "raices", rot: ["embestida", "barrido", "raices", "embestida", "pisoton"] },
  ];
  function crearCiervo(x, y, soportes) {
    return { x, y, casa: [x, y], vida: VIDA_C, fase: 0, activo: false, derrotado: false, estado: "dormido", t: 0, rot: 0, ataque: "", ultimo: ["", ""], avisos: [], dir: [1, 0], golpeo: false, expuesto: 0, mira: { vista: "E", espejo: true }, soportes, herido: 0, caido: 0, mov: 0 };
  }
  const atados = (b) => b.soportes.filter((s) => !s.o.roto).length;
  function despertar(J, b) {
    if (b.derrotado || b.activo) return;
    b.activo = true;
    b.estado = "persigue";
    b.t = 0;
    b.rot = 0;
    empezar(J, b, FASES[0].entra);
  }
  function reiniciarCiervo(J, b) {
    if (b.derrotado) return;
    b.avisos.forEach((a) => J.quitarAviso(a));
    Object.assign(b, { activo: false, vida: VIDA_C, fase: 0, estado: "dormido", avisos: [], x: b.casa[0], y: b.casa[1], ataque: "" });
    b.soportes.forEach((s) => (s.o.roto = false));
  }
  function proximo(b) {
    const rot = FASES[b.fase].rot;
    let a = rot[b.rot % rot.length];
    b.rot++;
    if (a === b.ultimo[0] && a === b.ultimo[1]) {
      a = rot[b.rot % rot.length];
      b.rot++;
    }
    return a;
  }
  function empezar(J, b, nombre) {
    const p = J.jugador;
    b.ataque = nombre;
    b.estado = "aviso";
    b.t = 0;
    b.golpeo = false;
    b.ultimo = [b.ultimo[1], nombre];
    const dx = p.x - b.x,
      dy = p.y - b.y,
      l = Math.hypot(dx, dy) || 1;
    b.mira = VIKINGO.vista(dx, dy, b.mira);
    const A = ATAQUES[nombre];
    const pon = (a) => (b.avisos.push(a), J.avisos.push(a));
    if (nombre === "embestida") {
      b.dir = [dx / l, dy / l];
      pon(aviso("franja", b.x, b.y, A.aviso, { largo: 22 * M, ancho: 3.6 * M, dir: Math.atan2(dy * 1.25, dx) }));
    } else if (nombre === "pisoton") pon(aviso("circulo", b.x, b.y, A.aviso, { radio: 6 * M }));
    else if (nombre === "barrido") pon(aviso("abanico", b.x, b.y, A.aviso, { radio: 7.5 * M, ang: (65 * Math.PI) / 180, dir: Math.atan2(dy * 1.25, dx) }));
    else if (nombre === "raices")
      for (let i = 0; i < 3; i++) {
        const ox = i ? (Math.random() - 0.5) * 5 * M : 0,
          oy = i ? (Math.random() - 0.5) * 5 * M : 0;
        pon(aviso("circulo", p.x + ox, p.y + oy, A.aviso + 0.7 + i * 0.35, { radio: 2.6 * M }));
      }
    J.anunciarJefe(I18N.t("av.jefe_" + nombre), I18N.t("av." + A.accion));
  }
  function limpiar(J, b) {
    b.avisos.forEach((a) => J.quitarAviso(a));
    b.avisos = [];
  }
  function finGolpe(J, b, contraSoporte) {
    limpiar(J, b);
    b.estado = "expuesto";
    b.t = 0;
    if (!contraSoporte) b.expuesto = 2;
  }
  function actualizarCiervo(J, b, dt) {
    b.herido = Math.max(0, b.herido - dt * 4);
    if (b.derrotado) {
      b.caido = Math.min(1, b.caido + dt / 2);
      return;
    }
    if (!b.activo) return;
    const p = J.jugador;
    b.t += dt;
    b.mov = 0;
    const dx = p.x - b.x,
      dy = p.y - b.y,
      dist = Math.hypot(dx, dy);
    switch (b.estado) {
      case "persigue":
        if (b.t > 1.2 || dist < 7 * M) empezar(J, b, proximo(b));
        else {
          mover(b, (dx / dist) * VEL_C * dt, (dy / dist) * VEL_C * dt, 40);
          b.mira = VIKINGO.vista(dx, dy, b.mira);
          b.mov = 1;
        }
        break;
      case "aviso": {
        let dur = ATAQUES[b.ataque].aviso;
        if (b.ataque === "raices") dur += 0.7 + 0.7;
        if (b.t >= dur) {
          b.estado = "golpe";
          b.t = 0;
          if (b.ataque !== "embestida") {
            for (const a of b.avisos)
              if (contiene(a, p.x, p.y) && !ELDERVALD.hayMuro(b.x, b.y, p.x, p.y)) {
                J.herir(Math.min(ATAQUES[b.ataque].dano, TOPE), b.x, b.y, true);
                break;
              }
            limpiar(J, b);
            J.sacudir(0.6);
          }
        }
        break;
      }
      case "golpe":
        if (b.ataque === "embestida") {
          const v = 24 * M * dt,
            nx = b.x + b.dir[0] * v,
            ny = b.y + b.dir[1] * v;
          if (ELDERVALD.libre(nx, ny, 40)) {
            b.x = nx;
            b.y = ny;
          } else b.t = 99; // chocó con algo: frena
          b.mov = 1;
          if (!b.golpeo && Math.hypot(p.x - b.x, p.y - b.y) < 2.6 * M) {
            J.herir(Math.min(ATAQUES.embestida.dano, TOPE), b.x, b.y);
            b.golpeo = true;
          }
          for (const s of b.soportes)
            if (!s.o.roto && Math.hypot(s.x - b.x, s.y - b.y) < 3.2 * M) {
              s.o.roto = true;
              b.expuesto = 4;
              J.sacudir(0.9);
              J.soporteRoto(s);
              finGolpe(J, b, true);
              return;
            }
          if (b.t >= ATAQUES.embestida.golpe || Math.hypot(b.x - b.casa[0], b.y - b.casa[1]) > 34 * M) finGolpe(J, b);
        } else if (b.t >= ATAQUES[b.ataque].golpe) finGolpe(J, b);
        break;
      case "expuesto":
        if (b.t >= b.expuesto) {
          b.estado = "persigue";
          b.t = 0;
          J.anunciarJefe("", "");
        }
        break;
    }
  }
  function golpearCiervo(J, b, dano) {
    if (b.derrotado || !b.activo) return;
    if (b.estado === "expuesto") dano *= 1.5;
    const at = atados(b);
    if (at > 0) dano *= DANO_ATADO;
    b.vida -= dano;
    if (at > 0) b.vida = Math.max(b.vida, VIDA_C * PISO_ATADO);
    b.herido = 1;
    let f = b.fase;
    while (f < FASES.length - 1 && b.vida <= VIDA_C * FASES[f].hasta) f++;
    if (f !== b.fase) {
      b.fase = f;
      b.rot = 0;
    }
    if (b.vida <= 0) {
      b.derrotado = true;
      b.activo = false;
      limpiar(J, b);
      J.ciervoVencido();
    }
  }
  function dibujarCiervo(c, b, t) {
    if (b.oculto) return;
    c.save();
    if (b.derrotado) {
      // se recuesta y su luz se aquieta
      c.translate(b.x, b.y);
      c.rotate(b.caido * 0.18 * (b.mira.espejo ? -1 : 1));
      c.translate(-b.x, -b.y);
    }
    let g = 0;
    if (b.estado === "aviso" && b.ataque === "embestida") g = Math.min(1, b.t / 0.6);
    if (b.estado === "aviso" && b.ataque === "pisoton") g = Math.min(1, b.t / 1.2) * 0.6;
    if (b.estado === "golpe" && b.ataque === "embestida") g = 1;
    CRIATURAS.dibujar(c, "ciervo", b.x, b.y, t, { vista: b.mira.vista, espejo: b.mira.espejo, mov: b.mov, golpe: g, herido: b.herido, atado: b.mostrarAtaduras ? atados(b) : 0, calma: b.caido });
    c.restore();
  }

  return { TIPOS, crear, actualizar, golpear, reiniciar, dibujar, contiene, dibujarAviso, crearCiervo, despertar, reiniciarCiervo, actualizarCiervo, golpearCiervo, dibujarCiervo, atados, VIDA_C };
})();
