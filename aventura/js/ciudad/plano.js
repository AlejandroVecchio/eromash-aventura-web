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
    HUECO = 6,
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
    ting: [0, 30],
    pozo: [25, 6],
    campana: [-17, 19],
    tablon: [-23, 23],
    lindes: [-104, 62],
    carpinteria: [-40, 114],
    herreria: [-70, 22],
    cordeleria: [-116, -16],
    curtiembre: [-76, 116],
    sanacion: [-72, -76],
    guardia: [-30, -122],
    patio_guardia: [-16, -108],
    corral: [48, -114],
    forasteros: [74, -66],
    huertas: [116, 50],
    hongo: [54, 62],
    tablero: [14, 136],
    casa_guardia: [-15, 135],
    camas_hongos: [-20, -14],
  };
  const RESERVA = [];
  const reservar = (cx, cz, mx, mz) => RESERVA.push([cx, cz, mx, mz]);
  const reservado = (x, z, m = 0) => RESERVA.some(([cx, cz, mx, mz]) => Math.abs(x - cx) < mx + m && Math.abs(z - cz) < mz + m);
  reservar(-104, 62, 17, 18);
  reservar(-40, 114, 14, 11);
  reservar(-70, 22, 12, 11);
  reservar(-116, -16, 7, 12);
  reservar(-76, 116, 9, 9);
  reservar(-72, -76, 15, 12);
  reservar(-30, -122, 10, 8);
  reservar(-16, -108, 8, 9);
  reservar(48, -114, 20, 14);
  reservar(74, -66, 18, 16);
  reservar(116, 50, 16, 34);
  reservar(54, 62, 16, 12);
  reservar(14, 136, 8, 6);
  reservar(-15, 135, 7, 6);

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
  calle(arco(52, 0, TAU, 64), 5.5); // la vuelta de la plaza
  calle(curva(rOficios, 0, TAU, 120), 4.6); // el anillo de los oficios
  calle([[0, 48], [0, R_MURO + 4], [0, 300]], 7, "laja"); // la avenida del sur, hasta el puente y Hrafngard
  calle([[0, -48], [0, -R_MURO - 4], [0, -300]], 6); // al norte, el Paso
  calle([[48, 0], [R_MURO + 4, 0], [200, -6], [300, -14]], 6); // al este, el aserradero y el santuario
  calle([[-48, 0], [-R_MURO - 4, 0], [-300, 12]], 5.5); // al oeste, Brunvik
  [PI / 4, (3 * PI) / 4, (5 * PI) / 4, (7 * PI) / 4].forEach((a, i) => radial(a, 52, rOficios, 3.6, "tierra", i));
  [1.18, 2.72, 4.32, 5.85].forEach((a, i) => radial(a, 52, rOficios, 2.6, "senda", i + 10));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.52;
    if (Object.values(PUERTAS).some((p) => Math.abs(corto(a - p)) < 0.12)) continue;
    radial(a, rOficios, R_MURO - 9, 2.8, "senda", i + 30);
  }
  {
    let tramo = [];
    const n = 160;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU,
        p = polar(a, rBorde(a));
      if (reservado(p[0], p[1], 3)) {
        if (tramo.length > 2) calle(tramo, 3.2, "tierra");
        tramo = [];
      } else tramo.push(p);
    }
    if (tramo.length > 2) calle(tramo, 3.2, "tierra");
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
    {
      const n = 200;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * TAU,
          a1 = ((i + 1) / n) * TAU,
          am = (a0 + a1) / 2;
        if (enPuerta(am)) continue;
        const [x0, z0] = polar(a0, R_MURO),
          [x1, z1] = polar(a1, R_MURO),
          [xm, zm] = polar(am, R_MURO);
        // de punta a punta (la vista las proyecta); la cara de adentro con la pasarela cuando se mira desde la ciudad
        cosas.push({ tipo: "asset", id: "empalizadaDoble", x: xm * M, y: zm * M, o: { sem: i }, punta: [x0 * M, z0 * M, x1 * M, z1 * M], adentro: am });
      }
      // el choque de la empalizada: un anillo de círculos (con los huecos de las puertas)
      for (let i = 0; i < 640; i++) {
        const a = (i / 640) * TAU;
        if (enPuerta(a)) continue;
        const [x, z] = polar(a, R_MURO);
        circulo(x, z, 1.2);
      }
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU + PI / 16;
        if (enPuerta(a)) continue;
        const [x, z] = polar(a, R_MURO - 3);
        asset("torreVigia", x, z, { s: 1.5, sem: i });
        circulo(x, z, 2.2);
      }
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
        asset(k === "norte" ? "puertaNorte" : "puertaSur", x, z, { s: 2.6, sem: 50, frente: a });
        [-1, 1].forEach((l) => {
          const [tx2, tz2] = polar(a + (l * (HUECO + 1.5)) / R_MURO, R_MURO);
          circulo(tx2, tz2, 2.4);
        });
        anclas["puerta_" + k] = U(polar(a, R_MURO - 12));
      }
      asset("granTablero", 14, 136, { s: 1.8 });
      asset("casaGuardia", -15, 135, { s: 1.6 });
    }

    // ---------- el Roble y la plaza ----------
    asset("robleGigante", 0, 4, { s: 1.6 });
    circulo(0, 2, 7);
    const [tx, tz] = LUGAR.ting;
    asset("tingCirculo", tx, tz, { s: 2.6 });
    anclas.ting = U([tx, tz + 9.5]);
    asset("pozoEikholt", ...LUGAR.pozo, { s: 1.4 });
    circulo(...LUGAR.pozo, 1.6);
    asset("campana", ...LUGAR.campana, { s: 1.3 });
    circulo(...LUGAR.campana, 1);
    asset("tablonAvisos", ...LUGAR.tablon, { s: 1.3 });
    for (const s of [-1, 1]) asset("estandarteCiervo", tx + s * 13, tz - 3, { s: 1.4, sem: s + 3 });
    // el Mercado de los Toldos
    const r = azar(31);
    const toldos = [];
    // el Mercado de los Toldos: apretado alrededor del Ting y por el sur y el este del tronco, bajo la copa
    let nt = 0;
    for (let rr = 17; rr < 45; rr += 4.6)
      for (let an = -0.35 * PI; an < 0.95 * PI; an += 5.2 / rr) {
        const a2 = an + (r() - 0.5) * 0.04,
          [x, z] = polar(a2, rr + (r() - 0.5) * 1.2);
        if (Math.hypot(x - tx, z - tz) < 14.5) continue;
        if (Math.abs(x) < 5 && z > 0) continue;
        if (Math.hypot(x - LUGAR.pozo[0], z - LUGAR.pozo[1]) < 6) continue;
        if (r() < 0.12) continue; // pasillos
        toldos.push([x, z]);
        asset("toldo", x, z, { s: 2, sem: nt, v: nt % 6 });
        circulo(x, z, 1.9);
        nt++;
      }
    // barriles, cajones y carretas entre los toldos
    for (let i = 0; i < 50; i++) {
      const an = PI * (-0.3 + r() * 1.25),
        rr = 18 + r() * 28,
        [x, z] = polar(an, rr);
      if (Math.hypot(x - tx, z - tz) < 13 || toldos.some((l) => Math.hypot(l[0] - x, l[1] - z) < 3) || (Math.abs(x) < 5 && z > 0)) continue;
      if (i % 5 === 0) asset("carreta", x, z, { s: 1.5, sem: i });
    }
    // faroles alrededor de la plaza
    for (let i = 0; i < 20; i++) {
      const an = (i / 20) * TAU + 0.08,
        [x, z] = polar(an, 48);
      if (Math.abs(x) < 4 && z > 0) continue;
      asset("farol", x, z, { s: 1.3, sem: i });
      circulo(x, z, 0.3);
    }

    // ---------- los edificios con nombre (las casas especiales, cada una con su ficha) ----------
    // el frente de un edificio mira hacia (fx, fz): ry tal que w+ apunte ahí
    const mirando = (x, z, fx, fz) => Math.atan2(-(fx - x), fz - z);
    const especial = (nombre, x, z, ry, ficha, sem) => {
      const casa = CASAS25.crear(ficha, sem);
      cosas.push({ tipo: "casa", x: x * M, y: z * M, ry, casa, nombre });
      for (const h of casa.huella(x * M, z * M, ry)) choques.push({ poli: h });
      return casa;
    };
    const AZUL_GRIS = ["#2C3440", "#3A4654", "#52606E"];
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
    asset("carpinteria", ...LUGAR.carpinteria, { s: 2.4 });
    circulo(LUGAR.carpinteria[0], LUGAR.carpinteria[1] - 1, 7);
    asset("cordeleriaFolke", ...LUGAR.cordeleria, { s: 2.2 });
    asset("curtiembre", ...LUGAR.curtiembre, { s: 2.2 });
    asset("casaSanacion", ...LUGAR.sanacion, { s: 2.4 });
    circulo(LUGAR.sanacion[0], LUGAR.sanacion[1] - 1, 7);
    asset("casaGuardia", ...LUGAR.guardia, { s: 2.2 });
    for (let i = 0; i < 4; i++) asset("munecoPaja", LUGAR.patio_guardia[0] - 4 + i * 2.6, LUGAR.patio_guardia[1] + (i % 2) * 2, { s: 1.4 });
    for (let i = 0; i < 6; i++) asset("carreta", LUGAR.corral[0] - 12 + (i % 3) * 9, LUGAR.corral[1] - 4 + Math.floor(i / 3) * 8, { s: 1.6, sem: i });
    for (let i = 0; i < 5; i++) asset("buey", LUGAR.corral[0] - 8 + i * 4, LUGAR.corral[1] + 10, { s: 1.5, sem: i });
    for (let i = 0; i < 6; i++) asset("huerta", LUGAR.huertas[0] - 6 + (i % 2) * 12, LUGAR.huertas[1] - 24 + Math.floor(i / 2) * 16, { s: 2, sem: i });
    for (let i = 0; i < 8; i++) asset("toldo", LUGAR.forasteros[0] - 12 + (i % 4) * 8, LUGAR.forasteros[1] - 6 + Math.floor(i / 4) * 10, { s: 2, v: 2 + (i % 4), sem: 90 + i });
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
    ocupado.push({ x: 0, z: 0, mx: 46, mz: 46, ang: PI / 4 });
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
    for (const c of CALLES) {
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
            const mx = ancho / 2 + 0.45,
              mz = fondo / 2 + 0.6;
            if (libreCalle(x, z, mx, mz, ry) && !reservado(x, z, 1.5) && !solapa(x, z, mx, mz, ry, 1.1)) {
              ocupado.push({ x, z, mx, mz, ang: ry });
              casas.push({ x, z, ry, ancho, fondo, sem: sem++ });
              u += ancho + 9 + rC() * 12; // cada casa con su terreno
              puesta = true;
              break;
            }
          }
          if (!puesta) u += 1.2;
        }
      }
    }
    // unas 60 casas de vecinos (el resto son los edificios con nombre): se eligen parejas por toda la ciudad
    const elegidas = [];
    {
      const paso = casas.length / 60;
      for (let i = 0; i < 60 && Math.floor(i * paso) < casas.length; i++) elegidas.push(casas[Math.floor(i * paso)]);
    }
    window.__casas = [casas.length, elegidas.length];
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
      const fondoT = 7 + rT() * 5;
      cerco(-W2 - 2, -D2 - fondoT, W2 + 2, -D2 - fondoT);
      cerco(-W2 - 2, -D2 - fondoT, -W2 - 2, -D2 + 1);
      cerco(W2 + 2, -D2 - fondoT, W2 + 2, -D2 + 1);
      const [bx, bz] = aMundo(cc.x, cc.z, cc.ry, (rT() - 0.5) * W2, -D2 - fondoT / 2);
      const k = cc.sem % 5;
      if (k === 0 || k === 3) asset("huerta", bx, bz, { s: 1.6, sem: cc.sem });
      else if (k === 1) asset("carreta", bx, bz, { s: 1.4, sem: cc.sem });
      else if (k === 2) asset("buey", bx, bz, { s: 1.3, sem: cc.sem });
      const [ax2, az2] = aMundo(cc.x, cc.z, cc.ry, W2 + 4 + rT() * 3, rT() * D2);
      if (rT() < 0.7) {
        asset(rT() < 0.5 ? "abedul" : "pino", ax2, az2, { s: 1.3 + rT() * 0.4, sem: cc.sem, pisos: 4 });
        circulo(ax2, az2, 0.5);
      }
    });

    // ---------- árboles entre las casas ----------
    {
      const r2 = azar(5151);
      let n = 0;
      for (let k = 0; k < 9000 && n < 520; k++) {
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
        if (aCalle(x, z).d < 3 || aRio(x, z) < ANCHO_RIO / 2 + 3) continue;
        if (r2() < 0.75) asset("pino", x, z, { s: 1.4 + r2() * 0.9, pisos: 4 + (k % 2), sem: k });
        else asset("abedul", x, z, { s: 1.2 + r2() * 0.5, sem: k });
        circulo(x, z, 0.5);
      }
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
    return { M, R_MURO: R_MURO * M, R_FUERA: R_FUERA * M, cosas, calles, rio: { pts: RIO.map(U), ancho: ANCHO_RIO * M }, choques, anclas, lugares, puertas: PUERTAS, plaza: 50.5 * M, aCalle: (x, y) => aCalle(x / M, y / M).d * M };
  }
  return { armar, M };
})();
