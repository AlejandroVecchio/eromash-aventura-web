// ---------- el plano de la capital en 2.5D (módulo PLANO25) ----------
// El mismo trazado que la ciudad 3D de referencia (anillos alrededor del Roble, el Ting al sur del tronco, los oficios
// al oeste, la Casa de las Lindes al sudoeste, la Sanación al noroeste, la Guardia al norte, el corral y el mercado de
// los forasteros al nordeste, las huertas al este, el Hongo Dorado al sudeste, el río por el este y el sur), pensado en
// metros y llevado al mundo del juego con M unidades por metro: a esta escala la empalizada queda a 9000 unidades del
// Roble y cruzar la ciudad corriendo lleva casi un minuto. El norte es -y y el este +x, como en el bosque.
// PLANO25.armar() → { M, R_MURO, cosas, calles, rio, choques, anclas, lugares, puertas }
window.PLANO25 = (function () {
  "use strict";
  const PI = Math.PI,
    TAU = PI * 2;
  const M = 60; // unidades del mundo por metro
  const R_MURO = 150,
    HUECO = 8, // medio ancho de cada puerta, hasta el costado de afuera de sus torres
    R_FUERA = 200;
  const PUERTAS = { sur: PI / 2, norte: -PI / 2, este: 0, oeste: PI };
  const polar = (a, r) => [Math.cos(a) * r, Math.sin(a) * r];
  function aSeg(px, pz, ax, az, bx, bz) {
    const dx = bx - ax,
      dz = bz - az,
      l = dx * dx + dz * dz;
    let t = l ? ((px - ax) * dx + (pz - az) * dz) / l : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - ax - dx * t, pz - az - dz * t);
  }
  const corto = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  // ---------- el río ----------
  const RIO = [[250, -360], [214, -250], [190, -150], [181, -60], [180, 30], [176, 95], [160, 140], [126, 172], [70, 190], [0, 196], [-70, 194], [-140, 200], [-215, 214], [-330, 244]];
  const ANCHO_RIO = 15;
  function aRio(x, z) {
    let d = 1e9;
    for (let i = 0; i < RIO.length - 1; i++) d = Math.min(d, aSeg(x, z, RIO[i][0], RIO[i][1], RIO[i + 1][0], RIO[i + 1][1]));
    return d;
  }

  // ---------- los lugares con nombre y lo que reservan ----------
  const LUGAR = {
    roble: [0, 0],
    ting: [0, 27], // pegado a las raíces del Roble, donde llega la avenida del sur
    pozo: [30, -30],
    campana: [-31, 29],
    tablon: [-37, 21],
    lindes: [-104, 62],
    carpinteria: [-40, 114],
    herreria: [-70, 22],
    cordeleria: [-118, -32], // el taller; el paseo de las sogas corre junto a la avenida del oeste
    paseo_sogas: [-119, -12],
    curtiembre: [-70, 106],
    // el noroeste: la Casa de Sanación con su huerta de hierbas y la hospedería junto a la Puerta del Norte
    sanacion: [-78, -86],
    hierbas: [-56, -112],
    hospederia: [-26, -122],
    // el noreste: el cuartel de la Guardia y su campo de entrenamiento, el campamento de forasteros y el corral
    guardia: [50, -108],
    entrenamiento: [24, -114],
    forasteros: [88, -84],
    corral: [116, -30],
    huertas: [116, 50],
    hongo: [54, 62],
    tablero: [14, 136],
    casa_guardia: [-15, 135],
    camas_hongos: [-20, -14],
  };
  const RESERVA = [];
  const reservar = (cx, cz, mx, mz) => RESERVA.push([cx, cz, mx, mz]);
  const reservado = (x, z, m = 0) => RESERVA.some(([cx, cz, mx, mz]) => Math.abs(x - cx) < mx + m && Math.abs(z - cz) < mz + m);
  reservar(-104, 62, 17, 18); // la Casa de las Lindes y su patio
  reservar(-40, 114, 14, 11); // la carpintería
  reservar(-70, 22, 12, 11); // la herrería
  reservar(-118, -32, 9, 8); // la cordelería
  reservar(-119, -12, 21, 4); // el paseo de las sogas
  reservar(-70, 106, 9, 9); // la curtiembre
  reservar(-78, -86, 15, 13); // la Casa de Sanación
  reservar(-56, -112, 12, 9); // la huerta de hierbas
  reservar(-26, -122, 9, 13); // la hospedería
  reservar(50, -108, 8, 14); // el cuartel de la Guardia
  reservar(24, -114, 16, 11); // el campo de entrenamiento
  reservar(88, -84, 15, 15); // el campamento de forasteros
  reservar(114, -26, 20, 15); // el corral de caravanas
  reservar(116, 50, 16, 34); // las huertas del este
  reservar(54, 62, 16, 12); // el Hongo Dorado
  reservar(14, 136, 8, 6); // el Tablero de las Sendas
  reservar(-15, 135, 7, 6); // la casa de la guardia de la Puerta del Sur

  // ---------- las calles ----------
  const CALLES = [];
  const calle = (pts, w, tipo = "tierra") => CALLES.push({ pts, w, tipo });
  const arco = (r, a0, a1, n) => {
    const l = [];
    for (let i = 0; i <= n; i++) l.push(polar(a0 + ((a1 - a0) * i) / n, r));
    return l;
  };
  const rOficios = (a) => 96 + 5 * Math.sin(3 * a + 0.7) + 3 * Math.sin(5 * a + 2);
  const rBorde = (a) => 123 + 3.5 * Math.sin(4 * a + 1) + 2 * Math.sin(7 * a);
  const curva = (fr, a0, a1, n) => {
    const l = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      l.push(polar(a, fr(a)));
    }
    return l;
  };
  const radial = (a, r0, r1, w, tipo, sem) => {
    const n = 4,
      l = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n,
        r = (typeof r0 === "function" ? r0(a) : r0) * (1 - u) + (typeof r1 === "function" ? r1(a) : r1) * u;
      const w2 = i && i < n ? Math.sin(sem * 7.1 + i * 2.3) * 0.05 : 0;
      l.push(polar(a + w2, r));
    }
    calle(l, w, tipo);
  };
  // adentro de la empalizada, la vuelta de la plaza, el anillo de los oficios y las cuatro avenidas van empedrados;
  // afuera de las puertas los caminos siguen de tierra
  // la plaza en anillos alrededor del Roble: baldosas, tierra con tiendas, el anillo de adentro, más tiendas y la
  // vuelta de la plaza; los caminos cortos la cruzan hacia el Roble (el del sur llega al Ting)
  calle(arco(50, 0, TAU, 64), 5, "laja"); // la vuelta de la plaza
  calle(arco(31.5, 0, TAU, 48), 3.6, "laja"); // el anillo de adentro, entre las dos hileras de tiendas
  for (const a of [0, PI, -PI / 2, PI / 4, (3 * PI) / 4, -PI / 4, (-3 * PI) / 4]) calle([polar(a, a % (PI / 2) ? 31.5 : 20.5), polar(a, 50)], a % (PI / 2) ? 3 : 3.6, "laja");
  calle([polar(PI / 2, 37), polar(PI / 2, 50)], 3.6, "laja");
  calle(curva(rOficios, 0, TAU, 120), 4.6, "laja"); // el anillo de los oficios
  calle([[0, 48], [0, R_MURO + 4]], 7, "laja"); // la avenida del sur, hasta el puente y Hrafngard
  calle([[0, R_MURO - 2], [0, 300]], 7);
  calle([[0, -48], [0, -R_MURO - 4]], 6, "laja"); // al norte, el Paso
  calle([[0, -R_MURO + 2], [0, -300]], 6);
  calle([[48, 0], [R_MURO + 4, 0]], 6, "laja"); // al este, el aserradero y el santuario
  calle([[R_MURO - 2, 0], [200, -6], [300, -14]], 6);
  calle([[R_MURO + 4, 1], [163, 24], [167, 50]], 2.4, "senda"); // de la Puerta del Este al muelle, por la orilla
  calle([[-48, 0], [-R_MURO - 4, 0]], 5.5, "laja"); // al oeste, Brunvik
  calle([[-R_MURO + 2, 0], [-300, 12]], 5.5);
  [PI / 4, (3 * PI) / 4, (5 * PI) / 4, (7 * PI) / 4].forEach((a, i) => radial(a, 52, rOficios, 3.6, "tierra", i));
  [1.18, 2.72, 4.32, 5.85].forEach((a, i) => radial(a, 52, rOficios, 2.6, "senda", i + 10));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.52;
    if (Object.values(PUERTAS).some((p) => Math.abs(corto(a - p)) < 0.12)) continue;
    radial(a, rOficios, R_MURO - 9, 2.8, "senda", i + 30);
  }
  // las calles de los barrios: un anillo del medio entre la plaza y el de los oficios, y uno de afuera entre el de los
  // oficios y la muralla; se cortan donde hay un lugar con nombre y los pedazos muy cortos no se trazan
  const rMedio = (a) => 72 + 2 * Math.sin(4 * a + 1),
    rFuera = (a) => 121 + 3 * Math.sin(5 * a + 2);
  for (const [fr, w, sem] of [[rMedio, 3.4, 1], [rFuera, 3.2, 2]]) {
    let tramo = [];
    const n = 200,
      cerrar = () => {
        if (tramo.length > 6) {
          calle(tramo, w, "tierra");
          CALLES[CALLES.length - 1].barrio = true;
        }
        tramo = [];
      };
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU,
        p = polar(a, fr(a));
      if (reservado(p[0], p[1], 2.5)) cerrar();
      else tramo.push(p);
    }
    cerrar();
    void sem;
  }
  function aCalle(x, z) {
    let mejor = { d: 1e9, c: null };
    for (const c of CALLES)
      for (let i = 0; i < c.pts.length - 1; i++) {
        const d = aSeg(x, z, c.pts[i][0], c.pts[i][1], c.pts[i + 1][0], c.pts[i + 1][1]) - c.w / 2;
        if (d < mejor.d) mejor = { d, c };
      }
    return mejor;
  }
  // números al azar con semilla
  function azar(s) {
    let a = (s * 2654435761) >>> 0 || 1;
    return () => {
      a ^= a << 13;
      a >>>= 0;
      a ^= a >>> 17;
      a ^= a << 5;
      a >>>= 0;
      return a / 4294967296;
    };
  }

  function armar() {
    const cosas = [], // { tipo: "casa" | "asset", x, y (unidades), ... }
      choques = [], // { poli: [[x, y]…] } | { circulo: [x, y, r] }
      anclas = {};
    const U = (p) => [p[0] * M, p[1] * M];
    const asset = (id, x, z, o = {}) => cosas.push({ tipo: "asset", id, x: x * M, y: z * M, o });
    const circulo = (x, z, r) => choques.push({ circulo: [x * M, z * M, r * M] });

    // ---------- la empalizada, las atalayas y las piedras de la cúpula ----------
    const enPuerta = (a) => Object.values(PUERTAS).some((p) => Math.abs(corto(a - p)) < HUECO / R_MURO);
    // los huecos de la muralla: las puertas (su medio ancho) y las atalayas (que van fundidas en el muro)
    const HUECOS = Object.values(PUERTAS).map((a) => ({ a, m: HUECO }));
    const TORRES = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + PI / 12;
      if (!enPuerta(a)) TORRES.push(a);
    }
    TORRES.forEach((a) => HUECOS.push({ a, m: 150 / M }));
    {
      const n = 200;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * TAU,
          a1 = ((i + 1) / n) * TAU,
          am = (a0 + a1) / 2;
        if (HUECOS.some((h) => Math.abs(corto(am - h.a)) < h.m / R_MURO)) continue;
        // el tramo que llega a una puerta o a una atalaya termina justo en su costado
        let b0 = a0,
          b1 = a1;
        for (const h of HUECOS) {
          const lim = h.m / R_MURO;
          if (Math.abs(corto(a0 - h.a)) < lim) b0 = h.a + lim * Math.sign(corto(am - h.a));
          if (Math.abs(corto(a1 - h.a)) < lim) b1 = h.a + lim * Math.sign(corto(am - h.a));
        }
        const [x0, z0] = polar(b0, R_MURO),
          [x1, z1] = polar(b1, R_MURO),
          [xm, zm] = polar((b0 + b1) / 2, R_MURO);
        const largo = Math.hypot(x1 - x0, z1 - z0) * M;
        if (largo < 20) continue;
        // un tramo de la muralla doble en volumen (u a lo largo, w hacia adentro); una escalera cada tanto
        cosas.push({ tipo: "casa", x: xm * M, y: zm * M, ry: Math.atan2(z1 - z0, x1 - x0), casa: MURALLA25.tramo(largo, i, i % 9 === 4, [37, 101, 163].includes(i)), nombre: "muralla" + i });
      }
      // el choque de la empalizada: un anillo de círculos (con los huecos de las puertas)
      for (let i = 0; i < 640; i++) {
        const a = (i / 640) * TAU;
        if (enPuerta(a)) continue;
        const [x, z] = polar(a, R_MURO);
        circulo(x, z, 1.2);
      }
      // unas doce atalayas fundidas en la muralla, con el estandarte del lado de la ciudad
      TORRES.forEach((a, i) => {
        const [x, z] = polar(a, R_MURO);
        cosas.push({ tipo: "casa", x: x * M, y: z * M, ry: Math.atan2(Math.cos(a), -Math.sin(a)), casa: MURALLA25.torre(i + 1), nombre: "atalaya" + i });
        circulo(x, z, 2.8);
      });
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + 0.13;
        const [x, z] = polar(a, R_MURO + 6);
        asset("piedraMuralla", x, z, { s: 1.6, sem: i });
        circulo(x, z, 1.1);
      }
      // las puertas: el portón con sus dos torres (la del norte, la de hierro)
      for (const k in PUERTAS) {
        const a = PUERTAS[k];
        const [x, z] = polar(a, R_MURO);
        // el portón en volumen (gira con la cámara como la empalizada); su frente (w+) mira afuera de la ciudad
        cosas.push({ tipo: "casa", x: x * M, y: z * M, ry: Math.atan2(-Math.cos(a), Math.sin(a)), casa: PORTON25.crear(HUECO * M - 230, k === "norte"), nombre: "puerta_" + k });
        [-1, 1].forEach((l) => {
          const [tx2, tz2] = polar(a + (l * (HUECO - 115 / M)) / R_MURO, R_MURO);
          circulo(tx2, tz2, 2.4);
        });
        anclas["puerta_" + k] = U(polar(a, R_MURO - 12));
      }
      asset("granTablero", 14, 136, { s: 1.8 });
      asset("casaGuardia", -15, 135, { s: 1.6 });
    }

    // ---------- el Roble y la plaza ----------
    asset("robleGigante", 0, 0, { s: 1.6, sinRaices: true, tablillas: 26, gira: true });
    circulo(0, -2, 7);
    // las raíces en volumen: lomos que salen del tronco hacia la plaza, con musgo y vetas rúnicas
    {
      const rr = azar(808);
      const n = 11;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + (rr() - 0.5) * 0.3,
          largo = 620 + rr() * 300,
          ancho = 110 + rr() * 70,
          alto = 150 + rr() * 80,
          r0 = 150;
        const cx = Math.cos(a) * (r0 + largo / 2),
          cz = Math.sin(a) * (r0 + largo / 2);
        cosas.push({ tipo: "casa", x: cx, y: cz, ry: a, casa: RAIZ25.crear(largo, ancho, alto, i + 1), nombre: "raiz" + i });
        // se pueden pisar las puntas, no el lomo grueso
        circulo((Math.cos(a) * (r0 + largo * 0.3)) / M, (Math.sin(a) * (r0 + largo * 0.3)) / M, ancho / M);
      }
    }
    const [tx, tz] = LUGAR.ting;
    // el menhir y los doce asientos en volumen, en ronda de verdad (giran con la cámara)
    cosas.push({ tipo: "casa", x: tx * M, y: tz * M, ry: 0, casa: TING25.menhir(1), nombre: "menhir" });
    circulo(tx, tz, 1.1);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU,
        ax = tx + Math.cos(a) * 5.6,
        az = tz + Math.sin(a) * 5.6;
      cosas.push({ tipo: "casa", x: ax * M, y: az * M, ry: Math.atan2(-(tx - ax), tz - az), casa: TING25.asiento(i + 1), nombre: "asiento" + i });
      circulo(ax, az, 0.7);
    }
    // los braseros alrededor del Ting
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + PI / 6;
      asset("brasero", tx + Math.cos(a) * 9.2, tz + Math.sin(a) * 9.2, { encendido: true, s: 1.3, sem: i });
      circulo(tx + Math.cos(a) * 9.2, tz + Math.sin(a) * 9.2, 0.5);
    }
    anclas.ting = U([tx, tz + 9.5]);
    asset("pozoEikholt", ...LUGAR.pozo, { s: 1.4 });
    circulo(...LUGAR.pozo, 1.6);
    asset("campana", ...LUGAR.campana, { s: 1.3 });
    circulo(...LUGAR.campana, 1);
    asset("tablonAvisos", ...LUGAR.tablon, { s: 1.3 });
    for (const s of [-1, 1]) asset("estandarteCiervo", tx + s * 13, tz - 3, { s: 1.4, sem: s + 3 });
    // el Mercado de los Toldos, en dos hileras: la de adentro sobre la tierra que rodea las baldosas del Roble, mirando al
    // anillo de adentro, y la de afuera del otro lado de ese anillo, mirándolo también; se cortan donde pasan los
    // caminos cortos y donde está el Ting
    const r = azar(31);
    const toldos = [];
    const RADIALES = [0, PI, -PI / 2, PI / 2, PI / 4, (3 * PI) / 4, -PI / 4, (-3 * PI) / 4];
    let nt = 0;
    for (const [rr, mira, paso] of [[25.8, 1, 9.5], [37.6, -1, 11]])
      for (let an = 0; an < TAU; an += paso / rr) {
        const a2 = an + (r() - 0.5) * 0.04,
          [x, z] = polar(a2, rr);
        if (RADIALES.some((ra) => Math.abs(corto(a2 - ra)) * rr < 5.5)) continue;
        if (Math.hypot(x - tx, z - tz) < 13.5) continue;
        if (Math.hypot(x - LUGAR.pozo[0], z - LUGAR.pozo[1]) < 6) continue;
        toldos.push([x, z]);
        // el frente mira al anillo de adentro
        const ry = Math.atan2(-Math.cos(a2) * mira, Math.sin(a2) * mira);
        const puesto = PUESTOS25.crear(nt + 3);
        cosas.push({ tipo: "casa", x: x * M, y: z * M, ry, casa: puesto, nombre: "puesto" + nt });
        choques.push({ poli: puesto.huella(x * M, z * M, ry) });
        nt++;
      }
    // la franja de afuera (entre la hilera de afuera y la vuelta de la plaza): carretas, faroles y bancos
    for (let i = 0; i < 16; i++) {
      const an = (i / 16) * TAU + 0.2,
        [x, z] = polar(an, 44);
      if (RADIALES.some((ra) => Math.abs(corto(an - ra)) * 44 < 5)) continue;
      if (Math.hypot(x - LUGAR.pozo[0], z - LUGAR.pozo[1]) < 6 || Math.hypot(x - LUGAR.campana[0], z - LUGAR.campana[1]) < 5 || Math.hypot(x - LUGAR.tablon[0], z - LUGAR.tablon[1]) < 5) continue;
      if (i % 3 === 0) asset("carreta", x, z, { s: 1.5, sem: i, v: i });
      else if (i % 3 === 1) asset("lenera", x, z, { s: 1.1, sem: i });
      else asset("sacosAbiertos", x, z, { s: 1.4, sem: i });
      circulo(x, z, 1.2);
    }
    // faroles a los dos lados del anillo de adentro
    for (let i = 0; i < 16; i++) {
      const an = (i / 16) * TAU + PI / 16;
      for (const rr of [29.2, 33.8]) {
        const [x, z] = polar(an + (rr > 30 ? 0.1 : 0), rr);
        if (Math.hypot(x - tx, z - tz) < 11) continue;
        asset("farol", x, z, { s: 1.2, sem: i });
        circulo(x, z, 0.25);
      }
    }
    // faroles alrededor de la plaza
    for (let i = 0; i < 20; i++) {
      const an = (i / 20) * TAU + 0.08,
        [x, z] = polar(an, 46.5);
      if (Math.abs(x) < 4 && z > 0) continue;
      asset("farol", x, z, { s: 1.3, sem: i });
      circulo(x, z, 0.3);
    }

    // ---------- los edificios con nombre (las casas especiales, cada una con su ficha) ----------
    // el frente de un edificio mira hacia (fx, fz): ry tal que w+ apunte ahí
    const mirando = (x, z, fx, fz) => Math.atan2(-(fx - x), fz - z);
    const especiales = [];
    const especial = (nombre, x, z, ry, ficha, sem) => {
      const casa = CASAS25.crear(ficha, sem);
      cosas.push({ tipo: "casa", x: x * M, y: z * M, ry, casa, nombre });
      especiales.push({ x, z, mx: casa.W / M / 2 + 7, mz: casa.D / M / 2 + 7, ang: ry });
      for (const h of casa.huella(x * M, z * M, ry)) choques.push({ poli: h });
      return casa;
    };
    const AZUL_GRIS = ["#2C3440", "#3A4654", "#52606E"];
    const aMundoE = (x, z, ry, u, w) => [x + u * Math.cos(ry) - w * Math.sin(ry), z + u * Math.sin(ry) + w * Math.cos(ry)];
    // un cerco de troncos rectangular (medio ancho mx, medio fondo mz) con huecos de entrada en el lado de abajo (fracciones)
    const cercoRect = (cx, cz, mx, mz, ry, huecos) => {
      const tramo = (u0, w0, u1, w1) => {
        const [ax, az] = aMundoE(cx, cz, ry, u0, w0),
          [bx, bz] = aMundoE(cx, cz, ry, u1, w1);
        asset("cerca", ax, az, { x2: bx * M, y2: bz * M, sem: Math.round(cx + cz) });
      };
      tramo(-mx, -mz, mx, -mz);
      tramo(-mx, -mz, -mx, mz);
      tramo(mx, -mz, mx, mz);
      let u = -mx;
      for (const h of huecos.concat([1])) {
        const fin = -mx + 2 * mx * h - (h < 1 ? 1.6 : 0);
        if (fin > u) tramo(u, mz, fin, mz);
        u = -mx + 2 * mx * h + 1.6;
      }
    };
    // un cerco ovalado de n tramos, sin los tramos de las puertas
    const cercoOval = (cx, cz, rx, rz, n, puertas) => {
      for (let i = 0; i < n; i++) {
        if (puertas.includes(i)) continue;
        const a0 = (i / n) * TAU,
          a1 = ((i + 1) / n) * TAU;
        asset("cerca", cx + Math.cos(a0) * rx, cz + Math.sin(a0) * rz, { x2: (cx + Math.cos(a1) * rx) * M, y2: (cz + Math.sin(a1) * rz) * M, sem: i });
      }
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * TAU;
        circulo(cx + Math.cos(a) * rx, cz + Math.sin(a) * rz, 0.4);
      }
    };
    // la Casa de las Lindes: piedra antigua abajo, la ampliación de madera arriba, techo azul gris, mirando al patio
    {
      const [lx, lz] = LUGAR.lindes;
      const ry = mirando(lx - 6, lz, lx + 20, lz);
      especial("lindes", lx - 6, lz - 2, ry, { W: 24 * M, D: 11 * M, pisos: 2, H: 300, RT: 230, piedra: 150, colTecho: AZUL_GRIS, tipo: "dosAguas", buhardilla: 3, porche: null, galeria: false, anexo: null, escalera: false, dragones: true, chimenea: { u: -0.3, w: -0.1 }, entra: true, puerta: 0, pared: 2 }, 7001);
      especial("lindes_ala", lx - 1, lz + 9.5, ry + PI / 2, { W: 9 * M, D: 9 * M, pisos: 2, H: 300, RT: 200, piedra: 300, colTecho: AZUL_GRIS, tipo: "dosAguas", buhardilla: 0, porche: null, galeria: false, anexo: null, escalera: false, dragones: true, chimenea: null, puerta: 0.1, pared: 2 }, 7002);
      asset("losaPatio", lx + 9, lz, { s: 4, luz: 1, piso: true });
      cosas.push({ tipo: "patio", x: (lx + 9) * M, y: lz * M, r: 9 * M });
      for (const s2 of [-1, 1]) asset("estandarteCiervo", lx + 4, lz + s2 * 7, { s: 1.3, sem: 9 + s2 });
      asset("farol", lx + 15, lz - 6, { s: 1.3 });
      asset("farol", lx + 15, lz + 6, { s: 1.3 });
      anclas.svanhild_casa = U([lx + 4, lz]);
      anclas.losa = U([lx + 9, lz + 3]);
    }
    // el Hongo Dorado: la casa más grande, dos pisos, galería, buhardillas y el cartel, mirando a la plaza
    {
      const [hx, hz] = LUGAR.hongo;
      const ry = mirando(hx, hz, 0, 0);
      especial("hongo", hx, hz, ry, { W: 27 * M, D: 13 * M, pisos: 2, H: 300, RT: 250, tipo: "dosAguas", buhardilla: 4, galeria: true, porche: null, anexo: { lado: 1, W: 7 * M, D: 8 * M }, escalera: false, dragones: true, chimenea: { u: 0.3, w: -0.15 }, entra: true, cartel: "hongo", puerta: -0.1, pared: 3, techo: 0, lena: true }, 7101);
      anclas.hongo_puerta = U([hx - 6, hz - 9]);
      // la esquina que da a la calle: el poste del cartel, y del costado las mesas de afuera con sus barriles
      const du = [Math.cos(ry), Math.sin(ry)],
        dw = [-Math.sin(ry), Math.cos(ry)],
        en = (u, w) => [hx + du[0] * u + dw[0] * w, hz + du[1] * u + dw[1] * w];
      for (const l of [-1, 1]) {
        const p = en(l * 15.5, 8.5);
        asset("posteHongo", p[0], p[1], { s: 1.2 });
      }
      for (const w of [-3, 1.5]) {
        const p = en(-17.5, w);
        asset("mesaBanco", p[0], p[1], { s: 0.45 });
      }
      { const p = en(-16.5, 5.5); asset("barriles", p[0], p[1], { s: 0.6 }); }
      { const p = en(-16.5, -6.5); asset("lenera", p[0], p[1], { s: 1 }); }
    }
    // los oficios y los demás lugares con nombre: por ahora sus dibujos del bosque, de frente
    // la herrería de Ása: el taller de troncos, el galpón abierto de la fragua y la chimenea cónica de piedra
    {
      const [hx, hz] = LUGAR.herreria;
      const ry = mirando(hx, hz, 0, 0);
      especial("herreria", hx - 4, hz - 3, ry, { W: 14 * M, D: 9 * M, pisos: 1, H: 190, RT: 190, tipo: "dosAguas", techo: 0, piedra: 60, porche: null, galeria: true, anexo: { lado: -1, W: 5 * M, D: 6 * M }, escalera: false, buhardilla: 0, dragones: false, chimenea: null, entra: true, lena: true, pared: 1 }, 7201);
      asset("chimeneaHerreria", hx + 6, hz + 2, { s: 1.5 });
      circulo(hx + 6, hz + 2, 2);
      asset("herreriaAsa", hx + 1, hz + 7, { s: 1.8 });
      anclas.herreria = U([hx + 1, hz + 9]);
    }
    // la carpintería: el taller, el galpón abierto de aserrar y las pilas de troncos que llegan del aserradero
    {
      const [cx, cz] = LUGAR.carpinteria;
      const ry = mirando(cx, cz, 0, 0);
      especial("carpinteria", cx, cz, ry, { W: 14 * M, D: 9 * M, pisos: 1, H: 200, RT: 200, tipo: "dosAguas", techo: 1, piedra: 0, galeria: true, porche: null, anexo: { lado: 1, W: 6 * M, D: 6 * M }, escalera: false, buhardilla: 0, dragones: false, chimenea: { u: -0.3, w: 0 }, entra: true, lena: true, pared: 1 }, 7701);
      for (let i = 0; i < 3; i++) asset("pilaTroncos", ...aMundoE(cx, cz, ry, -9 + i * 6, 9), { s: 1.2, sem: i });
      asset("carroCuadrilla", ...aMundoE(cx, cz, ry, 10, 10), { s: 1.2 });
      asset("lenera", ...aMundoE(cx, cz, ry, -12, 2), { s: 1.2 });
      anclas.carpinteria = U(aMundoE(cx, cz, ry, 0, 7));
    }
    // la curtiembre, lejos de la plaza por el olor: el galpón, las pieles tendidas y los sacos de corteza
    {
      const [cx, cz] = LUGAR.curtiembre;
      const ry = mirando(cx, cz, 0, 0);
      especial("curtiembre", cx, cz, ry, { W: 11 * M, D: 8 * M, pisos: 1, H: 180, RT: 180, tipo: "dosAguas", techo: 2, piedra: 0, galeria: true, porche: null, anexo: null, escalera: false, buhardilla: 0, dragones: false, chimenea: { u: 0.3, w: 0 }, entra: true, lena: true, pared: 5 }, 7801);
      for (let i = 0; i < 3; i++) asset("tendedero", ...aMundoE(cx, cz, ry, -7 + i * 5, 8), { s: 1.4, sem: 10 + i });
      asset("sacosAbiertos", ...aMundoE(cx, cz, ry, 8, 6), { s: 1.4 });
      asset("ahumadero", ...aMundoE(cx, cz, ry, 0, -8), { s: 1.1 });
      anclas.curtiembre = U(aMundoE(cx, cz, ry, 0, 7));
    }

    // ---------- el noroeste: Sanación, sus hierbas, la hospedería y la cordelería ----------
    {
      // la Casa de Sanación de Thora: dos pisos, paredes claras, galería para los que esperan, mirando a la plaza
      const [sx, sz] = LUGAR.sanacion;
      especial("sanacion", sx, sz, mirando(sx, sz, 0, 0), { W: 22 * M, D: 11 * M, pisos: 2, H: 300, RT: 220, tipo: "dosAguas", techo: 2, piedra: 90, galeria: true, porche: null, anexo: { lado: 1, W: 7 * M, D: 7 * M }, escalera: false, buhardilla: 2, dragones: true, chimenea: { u: -0.25, w: -0.1 }, entra: true, lena: true, pared: 0 }, 7301);
      anclas.sanacion = U(aMundoE(sx, sz, mirando(sx, sz, 0, 0), 0, 8));
      // el patio de adelante: los catres bajo la lona para los que no entran, los secaderos, el banco de los que
      // esperan y dos braseros; la senda de lajas que lleva de la calle a la puerta
      {
        const ry = mirando(sx, sz, 0, 0),
          en = (u, w) => aMundoE(sx, sz, ry, u, w);
        calle([en(0, 6), en(0, 13), en(2, 19)], 2.2, "laja");
        asset("lonaCuadrilla", ...en(-7, 12), { s: 1.4 });
        for (const u of [-9.5, -5]) asset("camaPieles", ...en(u, 11.5), { s: 0.4 });
        for (const u of [6, 9.5]) asset("secaderoHierbas", ...en(u, 11), { s: 1.3 });
        asset("estanteHierbas", ...en(8, 14.5), { s: 0.55 });
        for (const u of [-2.6, 2.6]) asset("brasero", ...en(u, 8.5), { encendido: true, s: 1.1 });
      }
      // la huerta de hierbas: canteros cercados, secaderos y el banco de los que se curan
      const [hx, hz] = LUGAR.hierbas;
      for (let i = 0; i < 6; i++) asset("huerta", hx - 7 + (i % 3) * 7, hz - 4 + Math.floor(i / 3) * 8, { s: 1.5, sem: 40 + i });
      for (let i = 0; i < 3; i++) asset("secaderoHierbas", hx + 11, hz - 6 + i * 6, { s: 1.3, sem: i });
      asset("estanteHierbas", hx - 13, hz + 6, { s: 0.45 });
      cercoRect(hx, hz, 15, 10, 0, [0.5]);
      asset("pozoEikholt", hx - 13, hz - 6, { s: 1.1 });
      circulo(hx - 13, hz - 6, 1.2);
      // la hospedería de los caminantes: larga, dos pisos, de frente a la avenida del norte, con su galpón y carros
      const [px, pz] = LUGAR.hospederia;
      especial("hospederia", px, pz, mirando(px, pz, 0, pz), { W: 24 * M, D: 11 * M, pisos: 2, H: 300, RT: 230, tipo: "dosAguas", techo: 0, piedra: 0, galeria: true, porche: { fondo: 2.4 * M }, anexo: null, escalera: true, buhardilla: 3, dragones: true, chimenea: { u: 0.3, w: 0 }, entra: true, lena: true, pared: 4 }, 7401);
      asset("carroCaravana", px - 2, pz + 17, { s: 1.4, sem: 3 });
      asset("buey", px + 4, pz + 18, { s: 1.3, sem: 7 });
      asset("fardoHeno", px - 8, pz + 15, { s: 1.4 });
      asset("posteFarol", px + 7, pz - 9, { s: 1.4 });
      anclas.hospederia = U([px + 8, pz]);
      // la cordelería de Folke: el taller y, junto a la avenida del oeste, el paseo de las sogas
      const [cx, cz] = LUGAR.cordeleria;
      especial("cordeleria", cx, cz, mirando(cx, cz, cx, 0), { W: 12 * M, D: 8 * M, pisos: 1, H: 180, RT: 180, tipo: "dosAguas", techo: 1, piedra: 0, galeria: false, porche: { fondo: 2 * M }, anexo: null, escalera: false, buhardilla: 0, dragones: false, chimenea: { u: -0.3, w: 0 }, entra: true, lena: true, pared: 3 }, 7501);
      const [sx2, sz2] = LUGAR.paseo_sogas;
      cosas.push({ tipo: "casa", x: sx2 * M, y: sz2 * M, ry: 0, casa: OFICIOS25.paseoSogas(38 * M, 3), nombre: "paseo_sogas" });
      anclas.cordeleria = U([cx, cz + 6]);
    }

    // ---------- el noreste: la Guardia, su campo de entrenamiento, los forasteros y el corral de caravanas ----------
    {
      // el cuartel de la Guardia: largo y bajo, de piedra abajo, mirando al campo
      const [gx, gz] = LUGAR.guardia;
      especial("cuartel", gx, gz, mirando(gx, gz, 0, gz), { W: 26 * M, D: 10 * M, pisos: 1, H: 210, RT: 210, tipo: "dosAguas", techo: 0, piedra: 120, galeria: true, porche: null, anexo: { lado: -1, W: 6 * M, D: 6 * M }, escalera: false, buhardilla: 0, dragones: true, chimenea: { u: 0.35, w: -0.1 }, entra: true, lena: true, pared: 2, colTecho: AZUL_GRIS }, 7601);
      anclas.guardia = U([gx - 8, gz]);
      // el campo de entrenamiento: tierra apisonada y arena, cercado, con muñecos, dianas, estantes y braseros
      const [ex, ez] = LUGAR.entrenamiento;
      cosas.push({ tipo: "patio", x: ex * M, y: ez * M, r: 0, rect: [15 * M, 10 * M], arena: true });
      cercoRect(ex, ez, 15, 10, 0, [0.25, 0.75]);
      for (let i = 0; i < 6; i++) {
        asset("munecoPractica", ex - 11 + i * 4, ez - 6, { s: 1.4, sem: i });
        circulo(ex - 11 + i * 4, ez - 6, 0.5);
      }
      for (let i = 0; i < 3; i++) {
        asset("dianaTiro", ex + 12, ez - 1 + i * 4, { s: 1.4, sem: i });
        circulo(ex + 12, ez - 1 + i * 4, 0.6);
      }
      asset("estanteArmas", ex - 10, ez + 7, { s: 1.4 });
      asset("estanteArmas", ex - 3, ez + 7, { s: 1.4 });
      for (const [bx, bz] of [[-14, -9], [14, -9], [-14, 9], [14, 9]]) asset("brasero", ex + bx, ez + bz, { encendido: true, s: 1.3 });
      asset("estandarteCiervo", ex - 15, ez - 10.5, { s: 1.5, sem: 1 });
      asset("estandarteCiervo", ex + 15, ez - 10.5, { s: 1.5, sem: 2 });
      // el ruedo de los que pelean de a dos: un círculo de piedras
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU;
        asset("roca", ex + 4 + Math.cos(a) * 4, ez + 2 + Math.sin(a) * 3, { s: 0.35, sem: i });
      }
      anclas.entrenamiento = U([ex, ez + 11]);
      // el campamento de los forasteros: tiendas de lona en ronda alrededor del fuego, con sus cargas
      const [fx, fz] = LUGAR.forasteros;
      asset("fogonOlla", fx, fz, { s: 2.1 });
      circulo(fx, fz, 1.4);
      // los troncos para sentarse alrededor del fuego
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + 0.8;
        asset("troncoCaido", fx + Math.cos(a) * 4, fz + Math.sin(a) * 3.4, { s: 0.4, sem: i });
      }
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU + 0.3,
          tx2 = fx + Math.cos(a) * 10,
          tz2 = fz + Math.sin(a) * 9;
        // la entrada (w+) mira al fuego
        const ry = mirando(tx2, tz2, fx, fz);
        const tienda = PUESTOS25.crearTienda(i + 1);
        cosas.push({ tipo: "casa", x: tx2 * M, y: tz2 * M, ry, casa: tienda, nombre: "tienda" + i });
        choques.push({ poli: tienda.huella(tx2 * M, tz2 * M, ry) });
        const [bx, bz] = aMundoE(tx2, tz2, ry, 4, 3);
        asset(i % 2 ? "sacosAbiertos" : "lenera", bx, bz, { s: 1, sem: i });
      }
      asset("carroCaravana", fx - 4, fz - 15, { s: 1.4, sem: 5 });
      asset("tendedero", fx + 6, fz + 4, { s: 1.4, sem: 2 });
      anclas.forasteros = U([fx, fz + 4]);
      // el corral de caravanas: el potrero cercado con los bueyes y, alrededor, las carretas, el heno y la lona
      const [kx, kz] = LUGAR.corral;
      cercoOval(kx, kz, 14, 8, 22, [5]);
      for (let i = 0; i < 6; i++) asset("buey", kx - 8 + (i % 3) * 7, kz - 3 + Math.floor(i / 3) * 5, { s: 1.4, sem: i, espejo: i % 2 === 1 });
      for (let i = 0; i < 5; i++) {
        const a = PI * (0.55 + i * 0.22),
          cx2 = kx + Math.cos(a) * 18,
          cz2 = kz + Math.sin(a) * 12;
        asset("carroCaravana", cx2, cz2, { s: 1.4, sem: i });
        circulo(cx2, cz2, 1.4);
      }
      for (let i = 0; i < 5; i++) asset("fardoHeno", kx + 16 + (i % 2) * 2.5, kz - 6 + i * 2.5, { s: 1.3 });
      asset("lonaCuadrilla", kx - 2, kz + 12, { s: 1.4 });
      asset("fogonOlla", kx - 12, kz + 10, { s: 1.1 });
      anclas.corral = U([kx - 16, kz]);
    }
    // ---------- las casas de la gente ----------
    const ocupado = [];
    const solapa = (x, z, mx, mz, ang, margen) => {
      const ejes = (a) => [[Math.cos(a), Math.sin(a)], [-Math.sin(a), Math.cos(a)]];
      for (const o of ocupado) {
        if (Math.hypot(o.x - x, o.z - z) > Math.hypot(mx, mz) + Math.hypot(o.mx, o.mz) + margen) continue;
        let separados = false;
        for (const e of [...ejes(ang), ...ejes(o.ang)]) {
          const proy = (cx, cz, hx, hz, a) => {
            const [u, v] = ejes(a);
            const c = cx * e[0] + cz * e[1],
              rr = Math.abs(hx * (u[0] * e[0] + u[1] * e[1])) + Math.abs(hz * (v[0] * e[0] + v[1] * e[1]));
            return [c - rr, c + rr];
          };
          const p = proy(x, z, mx + margen / 2, mz + margen / 2, ang),
            q = proy(o.x, o.z, o.mx + margen / 2, o.mz + margen / 2, o.ang);
          if (p[1] < q[0] || q[1] < p[0]) {
            separados = true;
            break;
          }
        }
        if (!separados) return true;
      }
      return false;
    };
    for (const [cx, cz, mx, mz] of RESERVA) ocupado.push({ x: cx, z: cz, mx, mz, ang: 0 });
    ocupado.push(...especiales);
    // la plaza (hasta la vuelta de adoquín): un octógono de dos cuadrados
    ocupado.push({ x: 0, z: 0, mx: 38, mz: 38, ang: 0 }, { x: 0, z: 0, mx: 38, mz: 38, ang: PI / 4 });
    // en el plano de la casa, u va a lo ancho y w hacia el frente; ry gira (u, w) al mundo
    const aMundo = (x, z, ry, u, w) => [x + u * Math.cos(ry) - w * Math.sin(ry), z + u * Math.sin(ry) + w * Math.cos(ry)];
    const libreCalle = (x, z, mx, mz, ang) => {
      for (const [lu, lw] of [[-mx, -mz], [mx, -mz], [mx, mz], [-mx, mz], [0, 0], [0, -mz], [-mx, 0], [mx, 0]]) {
        const [wx, wz] = aMundo(x, z, ang, lu, lw);
        if (aCalle(wx, wz).d < 0.4) return false;
        const rr = Math.hypot(wx, wz);
        if (rr > R_MURO - 8.5 || rr < 50) return false;
        if (aRio(wx, wz) < ANCHO_RIO) return false;
      }
      return true;
    };
    const enCalle = (c, u) => {
      for (let i = 0; i < c.pts.length - 1; i++) {
        const [ax, az] = c.pts[i],
          [bx, bz] = c.pts[i + 1],
          l = Math.hypot(bx - ax, bz - az);
        if (u <= l || i === c.pts.length - 2) return { x: ax + ((bx - ax) * u) / l, z: az + ((bz - az) * u) / l, ux: (bx - ax) / l, uz: (bz - az) / l };
        u -= l;
      }
    };
    const casas = [];
    let sem = 1000;
    const rC = azar(4242);
    // primero las calles de los barrios (los dos anillos de tierra), así las casas les dan el frente a ellas
    const ORDEN = CALLES.filter((c) => c.barrio).concat(CALLES.filter((c) => !c.barrio));
    for (const c of ORDEN) {
      let largo = 0;
      for (let i = 0; i < c.pts.length - 1; i++) largo += Math.hypot(c.pts[i + 1][0] - c.pts[i][0], c.pts[i + 1][1] - c.pts[i][1]);
      for (const lado of [1, -1]) {
        let u = 1 + rC() * 3;
        while (u < largo - 3) {
          let puesta = false;
          for (const f of [1, 0.75, 0.6]) {
            const ancho = (9 + rC() * 4.5) * f + 2 * (1 - f),
              fondo = (7 + rC() * 2.6) * Math.max(0.85, f);
            const m = enCalle(c, u + ancho / 2);
            const nx = -m.uz * lado,
              nz = m.ux * lado; // de la calle hacia la casa
            const ret = c.w / 2 + 1.4 + fondo / 2 + rC() * 0.7;
            const x = m.x + nx * ret,
              z = m.z + nz * ret;
            // el frente (w+) mira a la calle: w+ en el mundo es (-sin ry, cos ry) = (-nx, -nz)
            const ry = Math.atan2(nx, -nz);
            // el lote entero: la casa, el anexo o la leña de un costado, el árbol del otro y el terreno cercado de atrás
            const mx = ancho / 2 + 2.2,
              mz = fondo / 2 + 3.2;
            const [lx, lz] = aMundo(x, z, ry, 0, -2.2);
            if (libreCalle(x, z, ancho / 2 + 0.5, fondo / 2 + 0.6, ry) && libreCalle(lx, lz, mx - 2, mz - 1.5, ry) && !reservado(x, z, 4) && !solapa(lx, lz, mx, mz, ry, 0.6)) {
              const lote = { x: lx, z: lz, mx, mz, ang: ry };
              ocupado.push(lote);
              casas.push({ x, z, ry, ancho, fondo, sem: sem++, lote });
              u += ancho + 2 + rC() * 5; // casa al lado de casa: el lote ya guarda su aire
              puesta = true;
              break;
            }
          }
          if (!puesta) u += 1.2;
        }
      }
    }
    // unas 60 casas de vecinos (el resto son los edificios con nombre), juntas en barrios: en cada cuadrante se eligen
    // las más cercanas a su centro, así quedan apretadas a lo largo de sus calles y no desparramadas por todo el recinto
    const BARRIOS = [
      { x: 62, z: -58, n: 12 }, // el noreste, entre la Guardia y la plaza
      { x: -58, z: -52, n: 13 }, // el noroeste, frente a Sanación
      { x: -58, z: 70, n: 15 }, // el sudoeste, alrededor de los oficios
      { x: 58, z: 58, n: 17 }, // el sudeste, alrededor del Hongo Dorado
    ];
    const elegidas = [];
    for (const b of BARRIOS) {
      const del = casas.filter((cc) => Math.sign(cc.x) === Math.sign(b.x) && Math.sign(cc.z) === Math.sign(b.z));
      del.sort((p, q) => Math.hypot(p.x - b.x, p.z - b.z) - Math.hypot(q.x - b.x, q.z - b.z));
      elegidas.push(...del.slice(0, b.n));
    }
    // los lotes que no se eligieron quedan libres para lo que llena la tierra (galpones, leña, montecitos)
    {
      const usados = new Set(elegidas.map((cc) => cc.lote));
      for (const cc of casas) if (!usados.has(cc.lote)) ocupado.splice(ocupado.indexOf(cc.lote), 1);
    }
    elegidas.forEach((cc, i) => {
      const casa = CASAS25.crear({ W: cc.ancho * M, D: cc.fondo * M, entra: i % 4 === 1 }, cc.sem);
      cosas.push({ tipo: "casa", x: cc.x * M, y: cc.z * M, ry: cc.ry, casa, nombre: "casa" + i });
      for (const h of casa.huella(cc.x * M, cc.z * M, cc.ry)) choques.push({ poli: h });
      const W2 = cc.ancho / 2,
        D2 = cc.fondo / 2;
      // el farol de la puerta
      if (i % 2 === 0) {
        const [fx, fz] = aMundo(cc.x, cc.z, cc.ry, casa.puertaLocal[0] / M + 2, D2 + 1.6);
        asset("farol", fx, fz, { s: 1.2, sem: i });
        circulo(fx, fz, 0.25);
      }
      // el terreno de atrás y de los costados: cerco de troncos, huerta, leña, carro, barriles, un árbol
      const rT = azar(cc.sem * 13);
      const cerco = (u0, w0, u1, w1) => {
        const [ax, az] = aMundo(cc.x, cc.z, cc.ry, u0, w0),
          [bx, bz] = aMundo(cc.x, cc.z, cc.ry, u1, w1);
        asset("cerca", ax, az, { x2: bx * M, y2: bz * M, sem: cc.sem });
      };
      const fondoT = 3.5 + rT() * 1.5;
      cerco(-W2 - 1.8, -D2 - fondoT, W2 + 1.8, -D2 - fondoT);
      cerco(-W2 - 1.8, -D2 - fondoT, -W2 - 1.8, -D2 + 1);
      cerco(W2 + 1.8, -D2 - fondoT, W2 + 1.8, -D2 + 1);
      const [bx, bz] = aMundo(cc.x, cc.z, cc.ry, (rT() - 0.5) * W2, -D2 - fondoT / 2);
      const k = cc.sem % 5;
      if (k === 0 || k === 3) asset("huerta", bx, bz, { s: 1.6, sem: cc.sem });
      else if (k === 1) asset("carreta", bx, bz, { s: 1.4, sem: cc.sem });
      else if (k === 2) asset("buey", bx, bz, { s: 1.3, sem: cc.sem });
      const [ax2, az2] = aMundo(cc.x, cc.z, cc.ry, W2 + 1.2, -D2 - 1 - rT() * 2);
      if (rT() < 0.7) {
        asset(rT() < 0.5 ? "abedul" : "pino", ax2, az2, { s: 1.3 + rT() * 0.4, sem: cc.sem, pisos: 4 });
        circulo(ax2, az2, 0.5);
      }
    });

    // ---------- lo que llena la tierra entre los barrios: huertas cercadas, galpones con heno y montecitos ----------
    {
      // las huertas del este, junto a la muralla
      const [ux, uz] = LUGAR.huertas;
      for (let i = 0; i < 8; i++) asset("huerta", ux - 6 + (i % 2) * 12, uz - 26 + Math.floor(i / 2) * 15, { s: 2, sem: 60 + i });
      cercoRect(ux, uz, 14, 32, 0, [0.5]);
      const rf = azar(9191);
      for (let gx = -142; gx <= 142; gx += 15)
        for (let gz = -142; gz <= 142; gz += 15) {
          const x = gx + (rf() - 0.5) * 6,
            z = gz + (rf() - 0.5) * 6,
            rr = Math.hypot(x, z);
          if (rr < 56 || rr > R_MURO - 14) continue;
          if (aCalle(x, z).d < 9 || reservado(x, z, 6) || solapa(x, z, 7, 5.5, 0, 1)) continue;
          const tira = rf();
          if (tira < 0.42) {
            // una huerta cercada de una familia, con su espantapájaros
            const ry = Math.round(rf() * 3) * (PI / 2) + (rf() - 0.5) * 0.2;
            asset("huerta", x - 2.6, z, { s: 1.5, sem: gx * 7 + gz });
            asset("huerta", x + 2.6, z + 0.4, { s: 1.5, sem: gx * 7 + gz + 1 });
            cercoRect(x, z, 6, 4, ry, [rf()]);
            ocupado.push({ x, z, mx: 7, mz: 5.5, ang: 0 });
          } else if (tira < 0.6) {
            // un galpón de troncos con heno y un carro
            const ry = mirando(x, z, 0, 0) + (rf() - 0.5) * 0.6;
            especial("galpon" + gx + "_" + gz, x, z, ry, { W: (5 + rf() * 2) * M, D: (4 + rf()) * M, pisos: 1, H: 150, RT: 150, tipo: "dosAguas", techo: Math.floor(rf() * 3), porche: null, galeria: false, anexo: null, escalera: false, buhardilla: 0, dragones: false, chimenea: null, entra: false, lena: rf() < 0.5 }, 9000 + gx * 31 + gz);
            const [hx, hz] = aMundoE(x, z, ry, 4.5, 1);
            asset("fardoHeno", hx, hz, { s: 1.3 });
            if (rf() < 0.5) asset("carreta", ...aMundoE(x, z, ry, -2, 5), { s: 1.3, sem: gx + gz, v: 1 });
            ocupado.push({ x, z, mx: 7, mz: 5.5, ang: 0 });
          } else if (tira < 0.85) {
            // un montecito de pinos y abedules
            const n = 4 + Math.floor(rf() * 5);
            for (let i = 0; i < n; i++) {
              const tx2 = x + (rf() - 0.5) * 10,
                tz2 = z + (rf() - 0.5) * 8;
              asset(rf() < 0.6 ? "pino" : "abedul", tx2, tz2, { s: 1.3 + rf() * 0.6, pisos: 4 + (i % 2), sem: i + gx });
              circulo(tx2, tz2, 0.5);
            }
            ocupado.push({ x, z, mx: 6, mz: 5, ang: 0 });
          }
        }
    }
    // ---------- una segunda pasada más apretada: lo que queda vacío entre los barrios se llena de trabajo de todos los
    // días (galpones chicos, leña con su carro, barriles y cajones, un montecito), como en la lámina de la ciudad ----------
    {
      const rf = azar(7373);
      for (let gx = -145; gx <= 145; gx += 7)
        for (let gz = -145; gz <= 145; gz += 7) {
          const x = gx + 3.5 + (rf() - 0.5) * 3,
            z = gz + 3.5 + (rf() - 0.5) * 3,
            rr = Math.hypot(x, z);
          if (rr < 56 || rr > R_MURO - 12) continue;
          const dc = aCalle(x, z).d;
          if (dc < 2.2 || reservado(x, z, 1.5) || solapa(x, z, 2.6, 2.6, 0, 0.2)) continue;
          // un cobertizo solo donde entra entero; si no, algo más chico
          const entra = dc >= 4.6 && !solapa(x, z, 4.5, 4, 0, 0.6);
          const tira = entra ? rf() : 0.3 + rf() * 0.7;
          if (tira < 0.3) {
            const ry = mirando(x, z, 0, 0) + (rf() - 0.5) * 0.8;
            especial("cobertizo" + gx + "_" + gz, x, z, ry, { W: (3.6 + rf() * 1.4) * M, D: (3 + rf() * 0.8) * M, pisos: 1, H: 140, RT: 130, tipo: "dosAguas", techo: Math.floor(rf() * 3), porche: null, galeria: false, anexo: null, escalera: false, buhardilla: 0, dragones: false, chimenea: null, entra: false, lena: true }, 9500 + gx * 37 + gz);
            ocupado.push({ x, z, mx: 4.5, mz: 4, ang: 0 });
          } else if (tira < 0.6) {
            asset("lenera", x - 1.2, z, { s: 1, sem: gx + gz });
            if (rf() < 0.6) asset("carreta", x + 2, z + 1.5, { s: 1.2, sem: gx * 3 + gz, v: 1 });
            else asset("barriles", x + 1.8, z + 1, { s: 0.45 });
            circulo(x, z, 1.2);
            ocupado.push({ x, z, mx: 3, mz: 2.6, ang: 0 });
          } else if (tira < 0.82) {
            const n = 2 + Math.floor(rf() * 3);
            for (let i = 0; i < n; i++) {
              const tx2 = x + (rf() - 0.5) * 4.5,
                tz2 = z + (rf() - 0.5) * 4;
              asset(rf() < 0.6 ? "pino" : "abedul", tx2, tz2, { s: 1.2 + rf() * 0.6, pisos: 4 + (i % 2), sem: i + gx * 5 });
              circulo(tx2, tz2, 0.5);
            }
            ocupado.push({ x, z, mx: 3, mz: 2.6, ang: 0 });
          }
        }
    }
    // ---------- árboles sueltos entre las casas ----------
    {
      const r2 = azar(5151);
      let n = 0;
      for (let k = 0; k < 9000 && n < 160; k++) {
        const a = r2() * TAU,
          rr = 54 + r2() * (R_MURO - 62);
        const [x, z] = polar(a, rr);
        if (aCalle(x, z).d < 2 || reservado(x, z, 2) || solapa(x, z, 1.5, 1.5, 0, 0.5) || aRio(x, z) < ANCHO_RIO) continue;
        const tipo = n % 4 === 3 ? 2 : n % 2;
        if (tipo === 0) asset("pino", x, z, { s: 1.3 + r2() * 0.6, pisos: 4 + (k % 2), sem: k });
        else if (tipo === 1) asset("abedul", x, z, { s: 1.2 + r2() * 0.4, sem: k });
        else asset("helechos", x, z, { s: 1.2, sem: k });
        if (tipo < 2) circulo(x, z, 0.5);
        ocupado.push({ x, z, mx: 1.2, mz: 1.2, ang: 0 });
        n++;
      }
      // el bosque de afuera
      for (let k = 0; k < 2600; k++) {
        const a = r2() * TAU,
          rr = R_MURO + 12 + r2() * (R_FUERA - R_MURO - 12);
        const [x, z] = polar(a, rr);
        if (aCalle(x, z).d < 3 || aRio(x, z) < ANCHO_RIO / 2 + 3 || Math.hypot(x - 168, z - 50) < 10) continue;
        if (r2() < 0.75) asset("pino", x, z, { s: 1.4 + r2() * 0.9, pisos: 4 + (k % 2), sem: k });
        else asset("abedul", x, z, { s: 1.2 + r2() * 0.5, sem: k });
        circulo(x, z, 0.5);
      }
    }
    // ---------- el río: los dos puentes, el muelle y los botes ----------
    {
      const obra = (nombre, x, z, ry, casa) => cosas.push({ tipo: "casa", x: x * M, y: z * M, ry, casa, nombre });
      obra("puente_este", 180.5, -3.6, Math.atan2(-6, 50), OFICIOS25.puente(27 * M, 6.5 * M, 1));
      obra("puente_sur", 0, 196, PI / 2, OFICIOS25.puente(27 * M, 7.5 * M, 2));
      obra("muelle", 173, 50, 0, OFICIOS25.muelle(11 * M, 3.4 * M, 1));
      obra("bote0", 176, 46.6, 0.06, OFICIOS25.bote(6.5 * M, 1));
      obra("bote1", 175.5, 53.5, -0.05, OFICIOS25.bote(5.5 * M, 2));
      obra("bote2", 177, 62, 0.4, OFICIOS25.bote(6 * M, 3));
      asset("sacosAbiertos", 168.5, 46.5, { s: 1, sem: 4 });
      asset("barriles", 168, 53.5, { s: 0.55 });
      asset("posteFarol", 167, 49, { s: 1.2 });
      anclas.muelle = U([167, 50]);
    }
    // faroles del anillo y de las avenidas
    for (let i = 0; i < 36; i++) {
      const an = (i / 36) * TAU + 0.05,
        [x, z] = polar(an, rOficios(an) + 3.4);
      if (solapa(x, z, 0.4, 0.4, 0, 0.1)) continue;
      asset("farol", x, z, { s: 1.3, sem: i });
      circulo(x, z, 0.25);
    }
    for (const nombre in PUERTAS) {
      const pa = PUERTAS[nombre];
      for (let rr = 60; rr < R_MURO - 14; rr += 15)
        for (const s of [-1, 1]) {
          const [x, z] = polar(pa, rr),
            ox = -Math.sin(pa) * s * 5,
            oz = Math.cos(pa) * s * 5;
          if (solapa(x + ox, z + oz, 0.3, 0.3, 0, 0.1)) continue;
          asset("farol", x + ox, z + oz, { s: 1.3, sem: rr + s });
          circulo(x + ox, z + oz, 0.25);
        }
    }

    const calles = CALLES.map((c) => ({ pts: c.pts.map(U), w: c.w * M, tipo: c.tipo }));
    const lugares = {};
    for (const k in LUGAR) lugares[k] = U(LUGAR[k]);
    return { M, R_MURO: R_MURO * M, R_FUERA: R_FUERA * M, cosas, calles, rio: { pts: RIO.map(U), ancho: ANCHO_RIO * M }, choques, anclas, lugares, puertas: PUERTAS, plaza: 50.5 * M, ting: U(LUGAR.ting), roble: U(LUGAR.roble), aCalle: (x, y) => aCalle(x / M, y / M).d * M };
  }
  return { armar, M };
})();
