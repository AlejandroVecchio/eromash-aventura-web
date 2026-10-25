// ---------- combate: criaturas, avisos en el piso y el Ciervo Hueco (módulo COMBATE) ----------
// Las reglas de la arena para todo golpe enemigo: el piso marca exactamente lo que pega, con tiempo para salir;
// saltar evita todo; una casa, una roca o un tronco de por medio anula el golpe; nada saca más del 35 % de la vida.
// Valores de la aventura de Godot pasados a unidades (1 m ≈ 30).
window.COMBATE = (function () {
  "use strict";
  const M = 30; // un metro de combate: las distancias de pelea no crecen con el mapa
  const { E, alfa, TAU } = DIB;

  // forma: abanico · circulo · franja (golpe al frente) · carga (embiste por la franja) · lejos (cae del cielo donde
  // estás parado; el que tira se queda a distancia). barra: altura de la barra de vida sobre la base.
  const TIPOS = {
    lobo: { vida: 50, dano: 10, vel: 4.2 * M, alcance: 2 * M, aviso: 0.75, forma: "abanico", radioGolpe: 2.4 * M, angulo: 0.7, radio: 22, espera: 1.6, barra: 66, plata: 3 },
    errante: { vida: 70, dano: 14, vel: 1.9 * M, alcance: 1.9 * M, aviso: 0.9, forma: "abanico", radioGolpe: 2.3 * M, angulo: 0.9, radio: 16, espera: 1.8, barra: 96, plata: 4, muerto: true },
    custodio: { vida: 170, dano: 22, vel: 1.5 * M, alcance: 2.8 * M, aviso: 1.3, forma: "circulo", radioGolpe: 3.2 * M, angulo: 0, radio: 28, espera: 2.4, barra: 122, plata: 12, pesado: true },
    draugr: { vida: 95, dano: 18, vel: 1.7 * M, alcance: 2.6 * M, aviso: 1.0, forma: "franja", largo: 3.4 * M, ancho: 1.5 * M, radio: 18, espera: 2.0, barra: 124, plata: 6, muerto: true },
    jabali: { vida: 80, dano: 20, vel: 2.6 * M, alcance: 7 * M, aviso: 0.9, forma: "carga", largo: 8 * M, ancho: 1.7 * M, radio: 22, espera: 2.2, barra: 76, plata: 4 },
    cuervo: { vida: 28, dano: 8, vel: 5.6 * M, alcance: 1.7 * M, aviso: 0.6, forma: "abanico", radioGolpe: 2 * M, angulo: 0.6, radio: 12, espera: 1.4, barra: 82, plata: 2, vuela: true },
    fatuo: { vida: 45, dano: 16, vel: 2.4 * M, alcance: 9 * M, aviso: 1.15, forma: "lejos", radioGolpe: 1.6 * M, radio: 12, espera: 2.4, barra: 100, plata: 5, vuela: true, muerto: true, luz: true },
    oso: { vida: 300, dano: 26, vel: 2.1 * M, alcance: 2.8 * M, aviso: 1.1, forma: "abanico", radioGolpe: 3.1 * M, angulo: 1.0, largo: 4.4 * M, ancho: 2 * M, radio: 34, espera: 2.2, barra: 150, plata: 30, pesado: true },
    dreki: { vida: 1600, dano: 30, vel: 1.5 * M, alcance: 5 * M, aviso: 1.35, forma: "abanico", radioGolpe: 5.5 * M, angulo: 0.85, largo: 13 * M, ancho: 3 * M, radio: 70, espera: 2.3, barra: 300, plata: 260, pesado: true },
    trol: { vida: 420, dano: 30, vel: 1.4 * M, alcance: 3.4 * M, aviso: 1.4, forma: "circulo", radioGolpe: 3.8 * M, largo: 7 * M, ancho: 2.2 * M, radio: 40, espera: 2.6, barra: 196, plata: 40, pesado: true },
  };
  // los modificadores de los líderes (como los campeones de Diablo 2): cada uno con su color de aura
  const AFIJOS = {
    veloz: { col: "#73D5DB" },
    piedra: { col: "#B8B0A8" },
    igneo: { col: "#FF8D71" },
    helado: { col: "#C8F2F4" },
    runico: { col: "#9A6BD8" },
  };
  const DETECTA = 13 * M,
    SUELTA = 26 * M,
    TOPE = 35; // 35 % de 100 de vida
  // nada saca más del 35 % de la vida de Eromash (la vida sube con el nivel y lo que lleva puesto)
  const tope = (J) => Math.max(TOPE, Math.round((J.jugador.hpMax || 100) * 0.35));

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
  // el aviso de la arena: la zona entera tenue y un relleno que crece hasta el borde justo cuando pega.
  // a.col cambia el tono (fuego, escarcha, runa); las zonas que quedan ardiendo usan a.zona.
  function dibujarAviso(c, a) {
    const k = Math.min(1, a.t / a.dur);
    const [r, g, b] = a.rgb || [200, 64, 45];
    c.save();
    if (a.zona) {
      const late = 0.22 + Math.sin(a.t * 8) * 0.06;
      c.fillStyle = `rgba(${r},${g},${b},${late})`;
      forma(c, a, 1);
      c.fill();
      c.strokeStyle = `rgba(${r},${g},${b},0.7)`;
      c.lineWidth = 2;
      c.stroke();
      c.restore();
      return;
    }
    c.fillStyle = `rgba(${r},${g},${b},0.16)`;
    forma(c, a, 1);
    c.fill();
    c.strokeStyle = a.rgb ? `rgba(${r},${g},${b},0.8)` : "rgba(255,141,113,0.75)";
    c.lineWidth = 2;
    c.stroke();
    c.fillStyle = `rgba(${r},${g},${b},0.34)`;
    forma(c, a, a.forma === "franja" ? k : Math.max(0.05, k));
    c.fill();
    c.restore();
  }
  const RGB = { igneo: [255, 120, 60], helado: [140, 210, 240], runico: [154, 107, 216] };

  // ---------- criaturas ----------
  // op = { pal (variante de color), lider: { nombre, afijos[] }, grupo (lista compartida: si uno ve a Eromash van todos) }
  function crear(tipo, x, y, op = {}) {
    const d = Object.assign({}, TIPOS[tipo]);
    const e = { tipo, d, x, y, casa: [x, y], estado: "quieto", t: 0, vx: 0, vy: 0, mira: { vista: "S", espejo: false }, golpe: 0, herido: 0, muerto: 0, aviso: null, mov: 0, activo: true, pal: op.pal || 0, s: 1, quema: 0, helado: 0, sem: Math.random() * 10, grupo: op.grupo || null, alt: 0 };
    if (op.lider) {
      e.lider = op.lider;
      e.s = op.lider.unico ? 1 : 1.22;
      d.vida = Math.round(d.vida * (op.lider.unico ? 1 : 3.2));
      d.dano = Math.round(d.dano * 1.35);
      d.plata *= 6;
      d.radio *= e.s;
      d.barra *= e.s;
      const af = op.lider.afijos || [];
      if (af.includes("veloz")) {
        d.vel *= 1.5;
        d.espera *= 0.75;
      }
      if (af.includes("piedra")) d.vida = Math.round(d.vida * 1.6);
    }
    if (op.mas) d.vida = Math.round(d.vida * op.mas); // los grupos del fondo del bosque son más duros
    if (op.mas) d.dano = Math.round(d.dano * Math.min(1.5, 0.75 + op.mas * 0.25));
    e.vida = d.vida;
    return e;
  }
  // los semijefes siguen una rotación fija que se aprende (secundarias.js): abanico, círculo alrededor o franja al frente
  function patron(e, dir, rgb) {
    const d = e.d,
      k = e.patron[(e.cuenta = (e.cuenta || 0) + 1) % e.patron.length];
    if (k === "circulo") return aviso("circulo", e.x, e.y, d.aviso * 1.15, { radio: d.radioGolpe * 1.2, rgb });
    if (k === "franja") return aviso("franja", e.x, e.y, d.aviso, { largo: d.largo || d.radioGolpe * 2.2, ancho: d.ancho || 1.6 * M, dir, rgb });
    return aviso("abanico", e.x, e.y, d.aviso, { radio: d.radioGolpe, ang: d.angulo || 0.8, dir, rgb });
  }
  // lo que se oye cuando una criatura prepara el golpe: las bestias gruñen, los muertos y los fuegos zumban grave
  const GRUNEN = { lobo: 1.25, jabali: 0.95, oso: 0.7, trol: 0.6, cuervo: 1.7, dreki: 0.45 };
  function sonarAviso(e) {
    if (!window.SONIDO) return;
    const g = GRUNEN[e.tipo];
    if (g) SONIDO.tocar(e.patron || e.lider ? "rugido" : "grunido", { vol: e.patron || e.lider ? 0.5 : 0.4, tono: g / (e.s || 1), x: e.x, y: e.y });
    else SONIDO.zumbido(e.x, e.y, e.d.pesado ? 1.4 : 1);
  }
  // los pueblos son refugio: una criatura de afuera no sigue a Eromash adentro del Puesto, el Refugio o Brunvik
  const REFUGIOS = ["puesto", "refugio", "casa_lindes", "brunvik", "aserradero"];
  function enRefugio(x, y) {
    const L = ELDERVALD.LUGARES;
    return REFUGIOS.some((k) => L[k] && Math.hypot(x - L[k].p[0], y - L[k].p[1]) < L[k].r);
  }
  const HUYEN = { lobo: 1, jabali: 1, cuervo: 1 };
  const tiene = (e, af) => !!(e.lider && e.lider.afijos && e.lider.afijos.includes(af));
  function mover(e, dx, dy, r) {
    if (ELDERVALD.libre(e.x + dx, e.y, r)) e.x += dx;
    else if (e.d.vuela && ELDERVALD.sueloEn(e.x + dx, e.y) !== 3) e.x += dx;
    if (ELDERVALD.libre(e.x, e.y + dy, r)) e.y += dy;
    else if (e.d.vuela && ELDERVALD.sueloEn(e.x, e.y + dy) !== 3) e.y += dy;
  }
  function alertar(e) {
    if (e.grupo) e.grupo.forEach((o) => o !== e && !o.muerto && o.activo && (o.estado === "quieto" || o.estado === "vuelve") && ((o.estado = "persigue"), (o.vio = 1.1)));
  }
  function morir(J, e) {
    e.muerto = 0.001;
    // al caer el líder el grupo duda: se frena un instante
    if (e.lider && e.grupo) e.grupo.forEach((o) => o !== e && !o.muerto && o.activo && (o.aturdido = Math.max(o.aturdido || 0, 1.2)));
    // al morir se deshace en polvo (los muertos en huesos, los fatuos en luz)
    if (!window.CALIDAD || CALIDAD.nivel !== "baja") {
      const col = e.d.muerto ? (e.tipo === "fatuo" ? "#73D5DB" : "#D8D0C0") : "#5E4A36";
      for (let k = 0; k < 14; k++) J.fx.push({ x: e.x + (Math.random() - 0.5) * e.d.radio * 1.6, y: e.y - Math.random() * e.d.barra * 0.6, vx: (Math.random() - 0.5) * 160, vy: -60 - Math.random() * 160, t: 0.4 + Math.random() * 0.3, c: col, s: 4 + Math.random() * 5, g: e.tipo === "fatuo" ? -0.3 : 0.8 });
    }
    if (e.aviso) J.quitarAviso(e.aviso);
    e.aviso = null;
    // el líder rúnico estalla al morir: el círculo violeta avisa antes
    if (tiene(e, "runico")) {
      const a = aviso("circulo", e.x, e.y, 1.3, { radio: 3.2 * M, rgb: RGB.runico });
      J.avisos.push(a);
      J.retrasar(1.3, () => {
        if (contiene(a, J.jugador.x, J.jugador.y)) J.herir(Math.min(22, tope(J)), e.x, e.y, "runico");
        J.quitarAviso(a);
      });
    }
    if (J.alMorir) J.alMorir(e);
  }
  // el golpe de la criatura llega: daño y lo que deja el líder (fuego en el piso, escarcha)
  function pega(J, e, a) {
    const p = J.jugador;
    if (contiene(a, p.x, p.y) && !ELDERVALD.hayMuro(e.x, e.y, p.x, p.y)) J.herir(Math.min(e.d.dano, tope(J)), e.x, e.y, tiene(e, "helado") ? "helado" : null);
    if (tiene(e, "igneo")) {
      const z = aviso("circulo", a.forma === "lejos" || a.forma === "circulo" ? a.x : p.x, a.forma === "circulo" ? a.y : p.y, 3, { radio: 1.6 * M, rgb: RGB.igneo, zona: true, dps: 9 });
      if (a.forma !== "circulo" && a.forma !== "lejos") {
        // el fuego queda donde terminó el golpe, no persigue a nadie
        const ux = Math.cos(a.dir),
          uy = Math.sin(a.dir) / 1.25,
          l = a.forma === "franja" ? a.largo * 0.8 : a.radio * 0.7;
        z.x = a.x + ux * l;
        z.y = a.y + uy * l;
      }
      J.zonas.push(z);
    }
  }
  function actualizar(J, e, dt) {
    if (!e.activo) return;
    // un blanco de práctica (el muñeco de INSTRUCTORES): no piensa ni se mueve, solo se sacude
    if (e.d.blanco) {
      e.herido = Math.max(0, e.herido - dt * 4);
      return;
    }
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
    e.vio = Math.max(0, (e.vio || 0) - dt);
    e.duda = Math.max(0, (e.duda || 0) - dt);
    // aturdido por un remate: no hace nada un instante (las estrellitas lo avisan)
    if (e.aturdido > 0) {
      e.aturdido -= dt;
      if (Math.abs(e.vx) + Math.abs(e.vy) > 1) {
        mover(e, e.vx * dt, e.vy * dt, e.d.radio);
        e.vx *= Math.pow(0.002, dt);
        e.vy *= Math.pow(0.002, dt);
      }
      return;
    }
    // estados que le dejan las runas
    if (e.quema > 0) {
      e.quema -= dt;
      e.vida -= 8 * dt * (J.poderRunico || 1);
      if (e.vida <= 0) return morir(J, e);
    }
    // empujón del golpe recibido
    if (Math.abs(e.vx) + Math.abs(e.vy) > 1) {
      mover(e, e.vx * dt, e.vy * dt, d.radio);
      e.vx *= Math.pow(0.002, dt);
      e.vy *= Math.pow(0.002, dt);
    }
    e.mov = 0;
    if (e.helado > 0) {
      e.helado -= dt;
      if (e.aviso) {
        J.quitarAviso(e.aviso);
        e.aviso = null;
        e.estado = "espera";
        e.t = 0;
      }
      return;
    }
    // la carga del jabalí: corre por la franja que marcó
    if (e.carga) {
      e.carga.t -= dt;
      const v = e.carga.vel * dt;
      mover(e, Math.cos(e.carga.dir) * v, (Math.sin(e.carga.dir) * v) / 1.25, d.radio);
      e.mov = 2;
      if (e.carga.t <= 0) e.carga = null;
      return;
    }
    const aCasa = Math.hypot(e.x - e.casa[0], e.y - e.casa[1]);
    switch (e.estado) {
      case "quieto":
        // el ruido cuenta: corriendo te oyen de más lejos, caminando despacio de más cerca
        const ruido = p.paso === 3 ? 1.3 : p.paso === 1 ? 0.6 : p.paso === 0 ? 0.8 : 1;
        if (!p.muerto && dist < DETECTA * (J.sigilo || 1) * ruido && !enRefugio(p.x, p.y)) {
          e.estado = "persigue";
          e.vio = 1.1;
          alertar(e);
          if (window.SONIDO && (e.lider || e.patron)) SONIDO.tocar("rugido", { vol: 0.55, tono: 0.85, x: e.x, y: e.y });
          // el rugido de un líder sobresalta a Eromash
          if ((e.lider || e.patron) && window.ANIMA) ANIMA.gesto("susto");
        }
        break;
      case "persigue": {
        if (p.muerto || aCasa > SUELTA || (enRefugio(p.x, p.y) && !enRefugio(e.casa[0], e.casa[1]))) {
          e.estado = "vuelve";
          e.duda = 1.6;
          break;
        }
        // las bestias heridas de muerte huyen un rato (los líderes no)
        if (HUYEN[e.tipo] && !e.lider && !e.patron && e.vida < d.vida * 0.2 && !e.huyo) {
          e.huyo = true;
          e.estado = "huye";
          e.t = 0;
          break;
        }
        const lejos = d.forma === "lejos";
        const enRango = lejos ? dist < d.alcance && dist > 3 * M : d.forma === "carga" ? dist < d.alcance && dist > 2.5 * M : dist < d.alcance;
        if (enRango && !ELDERVALD.hayMuro(e.x, e.y, p.x, p.y)) {
          e.estado = "aviso";
          e.t = 0;
          const dir = Math.atan2(dy * 1.25, dx);
          let a;
          const rgb = e.lider ? RGB[e.lider.afijos[0]] : null;
          if (e.patron) a = patron(e, dir, rgb);
          else if (lejos) a = aviso("circulo", p.x, p.y, d.aviso, { radio: d.radioGolpe, rgb: rgb || [154, 107, 216], lejos: true });
          else if (d.forma === "carga") a = aviso("franja", e.x, e.y, d.aviso, { largo: d.largo, ancho: d.ancho, dir, rgb });
          else if (d.forma === "franja") a = aviso("franja", e.x, e.y, d.aviso, { largo: d.largo, ancho: d.ancho, dir, rgb });
          else if (e.tipo === "trol" && (e.cuenta = (e.cuenta || 0) + 1) % 3 === 0) a = aviso("franja", e.x, e.y, d.aviso * 0.9, { largo: d.largo, ancho: d.ancho, dir, rgb });
          else if (d.forma === "circulo") a = aviso("circulo", e.x, e.y, d.aviso, { radio: d.radioGolpe, rgb });
          else a = aviso("abanico", e.x, e.y, d.aviso, { radio: d.radioGolpe, ang: d.angulo, dir, rgb });
          if (tiene(e, "veloz")) a.dur = Math.max(0.6, a.dur * 0.85);
          e.aviso = a;
          J.avisos.push(a);
          sonarAviso(e);
          break;
        }
        let mx = dx / dist,
          my = dy / dist;
        // en grupo se abren y rodean: cada uno busca su lado alrededor de Eromash en vez de ir en fila
        if (e.grupo && e.grupo.length > 1 && dist < 9 * M && d.forma !== "lejos" && d.forma !== "carga") {
          if (e.flanco == null) e.flanco = (e.grupo.indexOf(e) / e.grupo.length) * TAU;
          const r = d.alcance * 0.85,
            tx = p.x + Math.cos(e.flanco) * r - e.x,
            ty = p.y + Math.sin(e.flanco) * r * 0.8 - e.y,
            tl = Math.hypot(tx, ty) || 1;
          const k = Math.min(1, (dist - d.alcance) / (6 * M));
          mx = mx * (1 - k * 0.6) + (tx / tl) * k * 0.6;
          my = my * (1 - k * 0.6) + (ty / tl) * k * 0.6;
        }
        // el fatuo y el jabalí buscan distancia; el resto se acerca
        if ((lejos && dist < 5 * M) || (d.forma === "carga" && dist < 3 * M)) {
          mx = -mx;
          my = -my;
        }
        // los del grupo no se apilan: se separan un poco entre ellos
        if (e.grupo)
          for (const o of e.grupo) {
            if (o === e || o.muerto || !o.activo) continue;
            const ox = e.x - o.x,
              oy = e.y - o.y,
              l = Math.hypot(ox, oy);
            if (l < 50 && l > 0.1) {
              mx += (ox / l) * 0.6;
              my += (oy / l) * 0.6;
            }
          }
        const ml = Math.hypot(mx, my) || 1;
        // cerca de su líder vivo el grupo va más rápido
        const lid = e.grupo && !e.lider && e.grupo.find((o) => o.lider && !o.muerto && o.activo && Math.hypot(o.x - e.x, o.y - e.y) < 8 * M);
        const vel = d.vel * (lid ? 1.15 : 1);
        mover(e, (mx / ml) * vel * dt, (my / ml) * vel * dt, d.radio);
        e.mira = VIKINGO.vista(dx, dy, e.mira);
        e.mov = 1;
        break;
      }
      case "aviso":
        e.golpe = Math.min(1, e.t / e.aviso.dur);
        if (e.t >= e.aviso.dur) {
          pega(J, e, e.aviso);
          if (d.forma === "carga") e.carga = { dir: e.aviso.dir, t: 0.32, vel: e.aviso.largo / 0.32 };
          J.quitarAviso(e.aviso);
          e.aviso = null;
          e.estado = "espera";
          e.t = 0;
        }
        break;
      case "huye": {
        // escapa tres segundos y vuelve a la pelea
        if (e.t > 3 || dist > 16 * M) {
          e.estado = "persigue";
          e.t = 0;
          break;
        }
        mover(e, (-dx / dist) * d.vel * 1.1 * dt, (-dy / dist) * d.vel * 1.1 * dt, d.radio);
        e.mira = VIKINGO.vista(-dx, -dy, e.mira);
        e.mov = 2;
        break;
      }
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
  function golpear(J, e, dano, ox, oy, empuje = 1) {
    if (e.muerto || !e.activo) return false;
    if (e.d.blanco) {
      e.herido = 1;
      e.d.blanco(e, dano, ox, oy);
      return false;
    }
    // un remate fuerte aturde a las criaturas chicas; las pesadas y los líderes juntan aguante y caen al tercero
    if (empuje >= 1.3) {
      e.aguante = (e.aguante || 0) + 1;
      if (!(e.d.pesado || e.lider || e.patron) || e.aguante >= 3) {
        e.aguante = 0;
        e.aturdido = e.d.pesado || e.lider ? 0.9 : 0.7;
        if (e.aviso) {
          J.quitarAviso(e.aviso);
          e.aviso = null;
        }
        e.estado = "espera";
        e.t = 0;
        e.golpe = 0;
      }
    }
    if (tiene(e, "piedra")) dano *= 0.7;
    e.vida -= dano;
    e.herido = 1;
    const l = Math.hypot(e.x - ox, e.y - oy) || 1,
      k = (e.d.pesado || e.lider ? 90 : 320) * empuje;
    if (!e.carga) {
      e.vx = ((e.x - ox) / l) * k;
      e.vy = ((e.y - oy) / l) * k;
    }
    if (e.estado === "quieto" || e.estado === "vuelve") {
      e.estado = "persigue";
      if (!(e.vida <= 0 && J.silencioso)) alertar(e); // agachado, una muerte de un golpe no despierta al grupo
    }
    if (e.vida <= 0) {
      morir(J, e);
      return true;
    }
    return false;
  }
  function reiniciar(e) {
    Object.assign(e, { x: e.casa[0], y: e.casa[1], vida: e.d.vida, estado: "quieto", t: 0, vx: 0, vy: 0, golpe: 0, herido: 0, muerto: 0, aviso: null, quema: 0, helado: 0, carga: null, aturdido: 0, huyo: false, vio: 0, duda: 0, aguante: 0 });
  }
  // lo que cuenta la criatura sobre la cabeza: «!» al verte, «?» al perderte, estrellas si está aturdida y un destello
  // blanco justo antes de que pegue (para leer el momento de esquivar)
  function senales(c, e, y, t) {
    const yy = y - (e.lider ? 34 : 14);
    const texto = (s, col, k) => {
      c.font = '900 ' + Math.round(26 * k) + 'px "Eromash Text", system-ui, sans-serif';
      c.textAlign = "center";
      c.lineWidth = 4;
      c.strokeStyle = "#0A0707";
      c.strokeText(s, e.x, yy);
      c.fillStyle = col;
      c.fillText(s, e.x, yy);
    };
    if (e.vio > 0) texto("!", "#FF8D71", 1 + Math.max(0, e.vio - 0.9) * 2);
    else if (e.duda > 0 && e.estado === "vuelve") alfa(c, Math.min(1, e.duda), () => texto("?", "#E0B2B2", 0.9));
    if (e.aturdido > 0)
      for (let k = 0; k < 3; k++) {
        const a = t * 5 + (k * TAU) / 3,
          sx = e.x + Math.cos(a) * e.d.radio,
          sy = yy + 6 + Math.sin(a) * 6;
        DIB.P(c, [sx, sy - 6, sx + 2, sy - 2, sx + 6, sy, sx + 2, sy + 2, sx, sy + 6, sx - 2, sy + 2, sx - 6, sy, sx - 2, sy - 2], "#FFD98A");
      }
    if (e.estado === "aviso" && e.golpe > 0.82)
      alfa(c, (e.golpe - 0.82) / 0.18, () => {
        DIB.halo(c, e.x, e.y - e.d.barra * 0.45, e.d.barra * 0.6, "#F2ECEC", 1);
        c.strokeStyle = "#F2ECEC";
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(e.x, e.y, e.d.radio * 1.5, e.d.radio * 0.6, 0, 0, TAU);
        c.stroke();
      });
  }
  function dibujar(c, e, t) {
    if (e.d.dibujo) return ASSETS.dibujar(c, e.d.dibujo, e.x, e.y, t, Object.assign({ herido: e.herido, sem: e.sem }, e.o));
    if (!e.activo || e.muerto > 0.8) return;
    alfa(c, e.muerto > 0 ? 1 - e.muerto / 0.8 : 1, () => {
      // el aura del líder: anillo del color de su primer afijo, que late
      if (e.lider && e.muerto === 0) {
        const col = e.lider.unico ? "#FFD98A" : AFIJOS[e.lider.afijos[0]].col;
        const r = e.d.radio * 1.6;
        alfa(c, 0.5 + Math.sin(t * 4) * 0.2, () => {
          c.strokeStyle = col;
          c.lineWidth = 3;
          c.beginPath();
          c.ellipse(e.x, e.y, r, r * 0.4, 0, 0, TAU);
          c.stroke();
        });
        DIB.halo(c, e.x, e.y - e.d.barra * 0.4, e.d.barra * 0.7, col, 0.5);
      }
      CRIATURAS.dibujar(c, e.tipo, e.x, e.y, t, { vista: e.mira.vista, espejo: e.mira.espejo, mov: e.mov, golpe: e.golpe, herido: e.herido, pal: e.pal, s: e.s, sem: e.sem });
      // escarcha o fuego encima
      if (e.helado > 0) alfa(c, 0.45, () => DIB.E(c, e.x, e.y - e.d.barra * 0.45, e.d.radio * 1.4, e.d.barra * 0.5, "#C8F2F4"));
      if (e.quema > 0)
        for (let k = 0; k < 3; k++) {
          const u = (t * 1.6 + k / 3) % 1;
          alfa(c, 1 - u, () => DIB.R(c, e.x + Math.sin(k * 3 + t * 5) * e.d.radio, e.y - e.d.barra * 0.3 - u * 40, 4, 6, k % 2 ? "#FF8D71" : "#FFD98A"));
        }
      const y = e.y - e.d.barra;
      if (e.muerto === 0) senales(c, e, y, t);
      if ((e.vida < e.d.vida || e.lider) && e.muerto === 0) {
        const w = e.lider ? 64 : 40;
        c.fillStyle = "#0A0707";
        c.fillRect(e.x - w / 2, y, w, 5);
        c.fillStyle = "#C8402D";
        c.fillRect(e.x - w / 2, y, (w * Math.max(0, e.vida)) / e.d.vida, 5);
        if (window.RPG) RPG.rotulo(c, e, e.x - w / 2 - 12, y + 2);
      } else if (window.RPG && e.muerto === 0 && e.estado !== "quieto" && e.estado !== "vuelve") RPG.rotulo(c, e, e.x - 32, y + 2);
      if (e.lider && e.muerto === 0) {
        c.font = '800 13px "Eromash Text", system-ui, sans-serif';
        c.textAlign = "center";
        c.lineWidth = 3;
        c.strokeStyle = "#0A0707";
        c.strokeText(e.lider.nombre, e.x, y - 8);
        c.fillStyle = e.lider.unico ? "#FFD98A" : "#E0B2B2";
        c.fillText(e.lider.nombre, e.x, y - 8);
        if (e.lider.titulo) {
          c.font = '600 10px "Eromash Text", system-ui, sans-serif';
          c.strokeText(e.lider.titulo, e.x, y - 22);
          c.fillStyle = "#F2ECEC";
          c.fillText(e.lider.titulo, e.x, y - 22);
        }
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
                J.herir(Math.min(ATAQUES[b.ataque].dano, tope(J)), b.x, b.y, true);
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
            J.herir(Math.min(ATAQUES.embestida.dano, tope(J)), b.x, b.y);
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

  return { TIPOS, AFIJOS, crear, actualizar, golpear, reiniciar, dibujar, contiene, dibujarAviso, crearCiervo, despertar, reiniciarCiervo, actualizarCiervo, golpearCiervo, dibujarCiervo, atados, VIDA_C };
})();
