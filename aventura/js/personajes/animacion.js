// ---------- cómo se mueve Eromash (módulo ANIMA) ----------
// Eromash es el mismo de la arena (VIKINGO: casco con la E, cara negra, barba): acá no se redibuja, se le da vida.
// Cada cuadro el motor pide una pose: cuánto se estira o se aplasta (desde los pies), cuánto se inclina, si se corre
// un poco, qué cara pone y si destella. Golpe recibido, duda, correr, saltar y caer, malherido, cansado, esquiva con
// estela, giro, respirar y parpadear, mirar alrededor, ataque con anticipación, caer al morir y volver.
// Los gestos (duda, feliz, susto) los piden los sistemas con ANIMA.gesto(tipo).
// Absorber energía (ANIMA.absorber({ col, col2, forma, dur })): se afirma, cierra los ojos y se estira mientras las
// partículas le giran alrededor y se le meten en el pecho, se tiñe del color y suelta con un rebote. Sirve para
// cualquier energía: la vida de Berkano (rúnica), y lo que venga con otro color o forma de partícula.
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
    absorbe: null, // { t, dur, col, col2, forma, motas, emitir }
    chispas: [], // las de los gestos
    estela: [],
    estelaT: 0,
    muerteT: -1,
    vuelveT: 9,
    vuelveAntes: 0,
  };
  // ---------- los gestos ----------
  // ANIMA.gesto(tipo, dur, op): op.col pinta las partículas del gesto que tiene (tesoro, sacudirse, grito).
  // De uso (pedido de Alejandro, 26/10/2026: nada de los ojitos ^-^ al juntar o festejar):
  //   botin       se agacha a juntar, se endereza orgulloso y saltan unas chispas doradas (cofres)
  //   tesoro      se agacha a juntarlo, se yergue mirándolo y planta los pies con un anillo de chispas del color de la rareza (lo bueno)
  //   grito       toma aire y ruge estirado, temblando, con brasas que suben (misión, victoria, una compra grande)
  //   asiente     dos cabeceos: entendido (un libro, un consejo, un trato)
  //   alivio      se afloja y suelta el aire, con los ojos cerrados (comer, tomar algo)
  //   reverencia  se inclina hondo ante un dios y se queda un momento (hörgar, bendiciones)
  //   desafio     levanta el mentón y se planta (una parada justa)
  //   sacudirse   se sacude entero como un perro mojado, con gotas del color (tintes, salir del agua)
  // Los que eran de reserva: tiritar (la escarcha de Hrímnir), desperezarse (al despertar y tras 35 s quieto),
  // mareo (al caer de la patada de Hrímnir), pisoton (contesta al rugido de un semijefe o al despertar del gigante),
  // y los de siempre: duda, susto. «feliz» queda solo por compatibilidad: no se usa.
  const DUR = { duda: 1.3, feliz: 0.9, susto: 0.7, botin: 0.8, tesoro: 1.15, grito: 1.25, asiente: 0.8, alivio: 1.0, reverencia: 1.5, desafio: 0.6, sacudirse: 0.9, tiritar: 1.6, desperezarse: 1.7, mareo: 1.8, pisoton: 0.75 };
  const GESTOS = Object.keys(DUR).filter((g) => g !== "feliz");
  function gesto(tipo, dur, op = {}) {
    // un gesto no pisa a otro más importante que recién empezó
    if (st.gesto && st.gesto.t < 0.25 && st.gesto.tipo === "susto" && tipo !== "susto") return;
    st.gesto = { tipo, t: 0, dur: dur || DUR[tipo] || 1, col: op.col, k0: 0 };
    st.quietoT = 0; // que no se ponga a mirar alrededor en medio del gesto
  }
  // las chispas de los gestos: salen del cuerpo (en unidades del dibujo, desde los pies) y caen o suben
  function chispas(n, op) {
    const baja = window.CALIDAD && CALIDAD.nivel === "baja";
    for (let i = 0; i < (baja ? Math.ceil(n / 3) : n); i++) {
      const a = op.anillo ? (i / n) * Math.PI * 2 : Math.random() * Math.PI * 2,
        v = (op.v || 160) * (0.6 + Math.random() * 0.7);
      st.chispas.push({
        x: (op.x || 0) + (Math.random() - 0.5) * (op.ancho || 20),
        y: 0,
        z: op.z == null ? 80 : op.z + Math.random() * (op.alto || 0),
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v * 0.35,
        vz: (op.sube || 0) + Math.random() * (op.sube2 || 0),
        g: op.g == null ? 600 : op.g,
        t: 0,
        dura: (op.dura || 0.6) * (0.7 + Math.random() * 0.6),
        s: (op.s || 6) * (0.7 + Math.random() * 0.6),
        col: Math.random() < 0.3 && op.col2 ? op.col2 : op.col,
        forma: op.forma || "rombo",
        gira: (Math.random() - 0.5) * 10,
      });
    }
  }
  // lo que suelta cada gesto en un momento justo (k de 0 a 1)
  const EVENTOS = {
    botin: [[0.34, (g) => chispas(9, { col: "#FFD98A", col2: "#FFE7A8", z: 70, v: 120, sube: 260, sube2: 160, dura: 0.6 })]],
    tesoro: [[0.52, (g) => chispas(20, { col: g.col || "#FFD98A", col2: "#F2ECEC", anillo: true, z: 10, v: 260, sube: 120, g: 300, dura: 0.7, s: 7 })], [0.3, (g) => chispas(6, { col: g.col || "#FFD98A", z: 90, v: 60, sube: 200, dura: 0.5, s: 5 })]],
    grito: [[0.28, (g) => chispas(16, { col: g.col || "#FF8D71", col2: "#FFD98A", z: 0, alto: 30, ancho: 120, v: 30, sube: 160, sube2: 160, g: -60, dura: 0.9, s: 6 })], [0.5, (g) => chispas(10, { col: g.col || "#FF8D71", col2: "#FFD98A", z: 0, ancho: 120, v: 30, sube: 200, sube2: 120, g: -60, dura: 0.8, s: 5 })]],
    alivio: [[0.45, () => chispas(4, { col: "#F2ECEC", forma: "cuadro", z: 120, v: 30, sube: 50, g: -30, dura: 0.8, s: 5 })]],
    sacudirse: [[0.2, (g) => chispas(12, { col: g.col || "#73D5DB", col2: "#F2ECEC", z: 70, alto: 50, v: 300, sube: 80, dura: 0.5, s: 4, forma: "cuadro" })], [0.5, (g) => chispas(10, { col: g.col || "#73D5DB", col2: "#F2ECEC", z: 60, alto: 50, v: 280, sube: 60, dura: 0.5, s: 4, forma: "cuadro" })]],
    tiritar: [[0.3, () => chispas(3, { col: "#F2ECEC", forma: "cuadro", z: 115, v: 20, sube: 40, g: -20, dura: 0.9, s: 4 })], [0.75, () => chispas(3, { col: "#F2ECEC", forma: "cuadro", z: 115, v: 20, sube: 40, g: -20, dura: 0.9, s: 4 })]],
    pisoton: [[0.42, () => chispas(14, { col: "#8E8A82", col2: "#5E5A52", forma: "cuadro", anillo: true, z: 2, v: 260, sube: 90, g: 500, dura: 0.5, s: 6 })]],
  };
  // ---------- absorber energía ----------
  // op.col / op.col2: los dos colores de las partículas; op.forma: "rombo" (brasas rúnicas), "cuadro" (motas) o
  // "chispa" (rayitas); op.dur: lo que dura todo (las partículas entran en el primer 70 %); op.n: cuántas
  const FORMAS = ["rombo", "cuadro", "chispa"];
  function absorber(op = {}) {
    st.absorbe = { t: 0, dur: op.dur || 1.1, col: op.col || "#73D5DB", col2: op.col2 || "#C8F2F4", forma: FORMAS.includes(op.forma) ? op.forma : "rombo", n: op.n || 34, motas: [], emitir: 0 };
    if (st.gesto && st.gesto.tipo !== "susto") st.gesto = null;
  }
  function avanzarAbsorbe(dt) {
    const a = st.absorbe;
    if (!a) return;
    a.t += dt;
    const k = a.t / a.dur,
      baja = window.CALIDAD && CALIDAD.nivel === "baja";
    // salen en un anillo alrededor y van en espiral hacia el pecho (en unidades del dibujo, desde los pies)
    if (k < 0.7) {
      a.emitir += dt * ((baja ? 0.35 : 1) * a.n) / (a.dur * 0.7);
      while (a.emitir >= 1) {
        a.emitir--;
        a.motas.push({ ang: Math.random() * Math.PI * 2, r: 120 + Math.random() * 70, z: 20 + Math.random() * 130, t: 0, dura: 0.45 + Math.random() * 0.3, gira: (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 3), s: 7 + Math.random() * 6, c2: Math.random() < 0.35 });
      }
    }
    a.motas.forEach((m) => (m.t += dt));
    a.motas = a.motas.filter((m) => m.t < m.dura);
    if (k >= 1 && !a.motas.length) st.absorbe = null;
  }
  // dónde va cada partícula: x al costado, y hacia la cámara (para saber si va delante o detrás), alto
  function posMota(m) {
    const e = m.t / m.dura,
      f = e * e * (3 - 2 * e),
      r = m.r * (1 - f),
      ang = m.ang + m.gira * e;
    return { x: Math.cos(ang) * r, y: Math.sin(ang) * r * 0.35, z: m.z + (78 - m.z) * f, e };
  }
  function dibujarMota(c, a, m, q, x0, y0) {
    const x = x0 + q.x,
      y = y0 + q.y - q.z,
      s = m.s * (1 - q.e * 0.55),
      col = m.c2 ? a.col2 : a.col;
    c.globalAlpha = q.e < 0.12 ? q.e / 0.12 : 1;
    c.fillStyle = col;
    c.beginPath();
    if (a.forma === "cuadro") c.rect(x - s / 2, y - s / 2, s, s);
    else if (a.forma === "chispa") {
      // una rayita que apunta al pecho
      const l = Math.hypot(q.x, q.z - 78) || 1,
        ux = -q.x / l,
        uy = (q.z - 78) / l;
      c.moveTo(x - ux * s * 1.6, y - uy * s * 1.6);
      c.lineTo(x + uy * s * 0.35, y - ux * s * 0.35);
      c.lineTo(x + ux * s * 0.6, y + uy * s * 0.6);
      c.lineTo(x - uy * s * 0.35, y + ux * s * 0.35);
    } else {
      c.moveTo(x, y - s);
      c.lineTo(x + s * 0.7, y);
      c.lineTo(x, y + s);
      c.lineTo(x - s * 0.7, y);
    }
    c.closePath();
    c.fill();
  }
  // las partículas de atrás (delante = false) o de adelante del cuerpo, con (x0, y0) los pies en el dibujo
  function dibujarAbsorbe(c, x0, y0, delante) {
    // el mareo: tres rombos dorados que giran sobre la cabeza
    const gm = st.gesto;
    if (gm && gm.tipo === "mareo") {
      const k = gm.t / gm.dur;
      c.save();
      c.globalAlpha = Math.min(1, k * 6, (1 - k) * 4);
      for (let i = 0; i < 3; i++) {
        const a = gm.t * 5 + (i * Math.PI * 2) / 3,
          y = Math.sin(a) * 9;
        if (y >= 0 !== delante) continue;
        const x = x0 + Math.cos(a) * 34,
          yy = y0 - 168 + y,
          r = 7;
        c.fillStyle = i ? "#FFD98A" : "#F2ECEC";
        c.beginPath();
        c.moveTo(x, yy - r);
        c.lineTo(x + r * 0.7, yy);
        c.lineTo(x, yy + r);
        c.lineTo(x - r * 0.7, yy);
        c.closePath();
        c.fill();
      }
      c.restore();
    }
    // las chispas de los gestos, cada una adelante o atrás según dónde va
    if (st.chispas.length) {
      c.save();
      st.chispas.forEach((q) => {
        if (q.y >= 0 !== delante) return;
        const e = q.t / q.dura,
          sz = q.s * (1 - e * 0.6),
          x = x0 + q.x,
          y = y0 + q.y - q.z;
        c.save();
        c.globalAlpha = e < 0.1 ? e / 0.1 : 1 - Math.pow((e - 0.1) / 0.9, 1.6);
        c.fillStyle = q.col;
        c.translate(x, y);
        c.rotate(q.gira * q.t);
        c.beginPath();
        if (q.forma === "cuadro") c.rect(-sz / 2, -sz / 2, sz, sz);
        else (c.moveTo(0, -sz), c.lineTo(sz * 0.7, 0), c.lineTo(0, sz), c.lineTo(-sz * 0.7, 0));
        c.closePath();
        c.fill();
        c.restore();
      });
      c.restore();
    }
    const a = st.absorbe;
    if (!a) return;
    // un brillo del color detrás del pecho mientras le entra
    if (!delante && a.t < a.dur && window.DIB) {
      const k = a.t / a.dur;
      DIB.halo(c, x0, y0 - 80, 110, a.col, k < 0.72 ? 0.25 + 0.5 * (k / 0.72) : 0.75 * (1 - (k - 0.72) / 0.28));
    }
    if (!a.motas.length) return;
    c.save();
    a.motas.forEach((m) => {
      const q = posMota(m);
      if (q.y >= 0 === delante) dibujarMota(c, a, m, q, x0, y0);
    });
    c.restore();
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
    if (st.gesto) {
      const g = st.gesto;
      g.t += dt;
      const k = Math.min(1, g.t / g.dur);
      (EVENTOS[g.tipo] || []).forEach(([en, fn]) => g.k0 < en && k >= en && fn(g));
      g.k0 = k;
      if (g.t > g.dur) st.gesto = null;
    }
    st.chispas.forEach((q) => {
      q.t += dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.z = Math.max(0, q.z + q.vz * dt);
      q.vz -= q.g * dt;
      q.vx *= 1 - dt * 1.5;
    });
    st.chispas = st.chispas.filter((q) => q.t < q.dura);
    avanzarAbsorbe(dt);
    if (st.saltoAntes > 0 && p.salto <= 0) st.aterrizaT = 0;
    st.saltoAntes = p.salto;
    const vista = p.mira.vista + (p.mira.espejo ? "-" : "");
    if (vista !== st.vistaAntes) {
      if (st.vistaAntes) st.giroT = 0;
      st.vistaAntes = vista;
    }
    st.quietoT = mov || p.atk || p.salto > 0 || p.esq > 0 || p.interactuando > 0 ? 0 : st.quietoT + dt;
    // mucho rato quieto fuera de pelea: se despereza (el gesto vuelve a poner quietoT en 0)
    if (st.quietoT > 35 && !st.gesto && !p.pelea && !p.muerto && p.hp >= p.hpMax * 0.3) gesto("desperezarse");
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
    const o = { sx: 1, sy: 1, rot: 0, dx: 0, dy: 0, ojos: null, flash: 0, alfa: 1, vista: null, espejo: null, golpe: false, tinte: null };
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
      const k = g.t / g.dur,
        deCostado = VOL.relativa(p.mira.vista, p.mira.espejo).vista === "E";
      // inclinarse hacia adelante: de costado se tira; de frente o de espaldas se agacha (no se puede tirar a la cámara)
      const inclinar = (v) => {
        if (deCostado) o.rot += v;
        else {
          o.sy *= 1 - Math.abs(v) * 0.32;
          o.sx *= 1 + Math.abs(v) * 0.12;
          o.dy += Math.abs(v) * 10;
        }
      };
      if (g.tipo === "duda") {
        o.ojos = "duda";
        o.rot += Math.sin(g.t * 5.5) * 0.13 * (1 - k * 0.6);
        o.dy -= Math.abs(Math.sin(g.t * 2.5)) * 3;
      } else if (g.tipo === "botin") {
        // se agacha a juntar y se endereza orgulloso
        if (k < 0.32) {
          const q = Math.sin((k / 0.32) * Math.PI * 0.5);
          inclinar(0.26 * q);
          o.sy *= 1 - 0.1 * q;
          o.sx *= 1 + 0.06 * q;
          o.dy += 4 * q;
          o.ojos = "concentrado";
        } else {
          const q = (k - 0.32) / 0.68,
            r = resorte(q * 0.7, 6, 14);
          inclinar(0.26 * Math.max(0, 1 - q * 4));
          if (deCostado) o.rot -= 0.08 * Math.sin(Math.min(1, q * 2) * Math.PI * 0.5) * (1 - q);
          o.sy *= 1 + 0.08 * r;
          o.dy -= 6 * Math.max(0, r);
          o.ojos = "fierce";
        }
      } else if (g.tipo === "tesoro") {
        // se agacha a juntarlo, se yergue mirándolo, planta los pies con fuerza y queda firme, pecho afuera
        if (k < 0.2) {
          const q = k / 0.2;
          o.sy *= 1 - 0.14 * q;
          o.sx *= 1 + 0.08 * q;
          inclinar(0.2 * q);
          o.ojos = "concentrado";
        } else if (k < 0.5) {
          const t = (k - 0.2) / 0.3,
            q = t * t * (3 - 2 * t);
          o.sy *= 0.86 + 0.22 * q;
          o.sx *= 1.08 - 0.12 * q;
          inclinar(0.2 * (1 - q) - 0.08 * q);
          o.ojos = "concentrado";
        } else {
          const q = (k - 0.5) / 0.5,
            r = resorte(q * 0.5, 9, 24);
          o.sy *= 1.08 - 0.14 * r - 0.08 * q;
          o.sx *= 0.96 + 0.12 * r + 0.04 * q;
          o.dy += 3 * Math.max(0, r);
          inclinar(-0.08 * (1 - q));
          o.ojos = "fierce";
        }
      } else if (g.tipo === "grito") {
        // toma aire, ruge estirado y temblando
        if (k < 0.25) {
          const q = k / 0.25;
          o.sy *= 1 - 0.1 * q;
          o.sx *= 1 + 0.06 * q;
          o.rot += 0.08 * q;
          o.ojos = "concentrado";
        } else if (k < 0.8) {
          const q = (k - 0.25) / 0.55;
          o.sy *= 1.14 - 0.03 * q;
          o.sx *= 0.95;
          o.dy -= 5;
          o.rot += -0.1 + Math.sin(g.t * 52) * 0.035;
          o.ojos = "fierce";
        } else {
          const q = (k - 0.8) / 0.2;
          o.sy *= 1 + 0.11 * (1 - q);
          o.rot -= 0.1 * (1 - q);
          o.ojos = "fierce";
        }
      } else if (g.tipo === "asiente") {
        // dos cabeceos
        const c = Math.max(0, Math.sin(k * Math.PI * 4));
        inclinar(c * 0.13);
        o.ojos = c > 0.6 ? "cerrado" : "calm";
      } else if (g.tipo === "alivio") {
        // se afloja y suelta el aire
        const c = Math.sin(k * Math.PI);
        o.sy *= 1 - 0.08 * c;
        o.sx *= 1 + 0.04 * c;
        o.dy += 4 * c;
        inclinar(0.05 * c);
        o.ojos = c > 0.3 ? "cerrado" : "calm";
      } else if (g.tipo === "reverencia") {
        // se inclina hondo, se queda y se levanta
        const c = k < 0.25 ? Math.sin((k / 0.25) * Math.PI * 0.5) : k < 0.7 ? 1 : 1 - Math.sin(((k - 0.7) / 0.3) * Math.PI * 0.5);
        inclinar(0.42 * c);
        o.dy += 3 * c;
        o.ojos = c > 0.5 ? "cerrado" : "calm";
      } else if (g.tipo === "desafio") {
        // levanta el mentón y se planta
        const c = Math.sin(Math.min(1, k * 2) * Math.PI * 0.5) * (1 - Math.max(0, (k - 0.7) / 0.3));
        o.rot -= 0.13 * c;
        o.sy *= 1 + 0.08 * c;
        o.sx *= 1 + 0.04 * c;
        o.ojos = "fierce";
      } else if (g.tipo === "sacudirse") {
        const c = 1 - k;
        o.rot += Math.sin(g.t * 46) * 0.2 * c;
        o.sx *= 1 + Math.sin(g.t * 46 + 1) * 0.07 * c;
        o.ojos = "cerrado";
      } else if (g.tipo === "tiritar") {
        o.rot += Math.sin(g.t * 62) * 0.03;
        o.sx *= 1 + Math.sin(g.t * 70) * 0.015;
        o.sy *= 0.95;
        o.dy += 2;
        o.ojos = "flojo";
      } else if (g.tipo === "desperezarse") {
        // se estira bien alto, despacio, y vuelve
        const c = Math.sin(k * Math.PI);
        o.sy *= 1 + 0.18 * c;
        o.sx *= 1 - 0.1 * c;
        o.rot += Math.sin(k * Math.PI * 2) * 0.06;
        o.ojos = c > 0.25 ? "cerrado" : "calm";
      } else if (g.tipo === "mareo") {
        const c = 1 - k * 0.5;
        o.rot += Math.sin(g.t * 4.5) * 0.15 * c;
        o.dx += Math.sin(g.t * 4.5) * 6 * c;
        o.dy += Math.abs(Math.cos(g.t * 4.5)) * 3;
        o.ojos = "duda";
      } else if (g.tipo === "pisoton") {
        // levanta y golpea el piso
        if (k < 0.42) {
          const q = k / 0.42;
          o.dy -= Math.sin(q * Math.PI * 0.5) * 12;
          o.sy *= 1 + 0.1 * q;
          o.rot -= 0.06 * q;
        } else {
          const r = resorte((k - 0.42) * 0.8, 10, 26);
          o.sy *= 1 - 0.2 * r;
          o.sx *= 1 + 0.16 * r;
        }
        o.ojos = "fierce";
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
    // absorber energía: se afirma, cierra los ojos y se estira tiñéndose mientras le entra, y suelta con un rebote
    const ab = st.absorbe;
    if (ab && ab.t < ab.dur) {
      const k = ab.t / ab.dur;
      if (k < 0.18) {
        const q = k / 0.18;
        o.sx *= 1 + 0.09 * q;
        o.sy *= 1 - 0.11 * q;
        o.ojos = "concentrado";
      } else if (k < 0.72) {
        const q = (k - 0.18) / 0.54,
          sube = Math.sin(Math.min(1, q * 1.4) * Math.PI * 0.5);
        o.sx *= 1.09 - 0.15 * sube;
        o.sy *= 0.89 + 0.21 * sube;
        o.dy -= 7 * sube;
        o.rot += Math.sin(ab.t * 42) * 0.018 * q;
        o.ojos = "cerrado";
        o.tinte = { col: ab.col, k: 0.12 + 0.4 * q };
      } else {
        const q = (k - 0.72) / 0.28,
          r = resorte(q * 0.6, 8, 22);
        o.sx *= 1 + 0.12 * r;
        o.sy *= 1 - 0.1 * r;
        o.dy -= 7 * (1 - q);
        o.ojos = q < 0.6 ? "fierce" : null;
        o.tinte = { col: ab.col2, k: 0.55 * (1 - q) };
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
  // col: la misma silueta de otro color (el tinte de absorber); se arma una vez por imagen y color
  function blanco(img, col = "#F2ECEC") {
    if (!img.complete || !img.naturalWidth) return null;
    const clave = col === "#F2ECEC" ? img : img.src + col;
    let b = blancos.get(clave);
    if (!b) {
      b = document.createElement("canvas");
      b.width = 250;
      b.height = 300;
      const c = b.getContext("2d");
      c.drawImage(img, 0, 0, 250, 300);
      c.globalCompositeOperation = "source-in";
      c.fillStyle = col;
      c.fillRect(0, 0, 250, 300);
      blancos.set(clave, b);
    }
    return b;
  }
  return { gesto, golpe, actualizar, pose, blanco, absorber, dibujarAbsorbe, absorbiendo: () => !!st.absorbe, FORMAS, GESTOS, estela: () => st.estela, quieto: () => st.quietoT };
})();
