// ---------- el plano de Eikholt en 3D (módulo EIKPLANO) ----------
// La capital armada de cero, en metros, siguiendo la vista general aprobada y el compendio del 24/10/2026: el norte es
// -z, el este +x. Anillos alrededor del Roble: en el centro la plaza con el Ting al sur del tronco, el pozo al este, la
// campana y el tablón al sudoeste y el Mercado de los Toldos bajo la copa; el segundo anillo con los oficios al oeste y
// sudoeste (herrería con su chimenea de piedra, carpintería con grúa, cordelería, curtiembre), la Casa de las Lindes al
// sudoeste con su patio y la losa azul, la Casa de Sanación al noroeste, la Guardia junto a la Puerta del Norte con el
// patio de práctica, el corral de caravanas y el mercado de los forasteros al nordeste, las huertas al este y el Hongo
// Dorado al sudeste mirando a la plaza; en el borde las casas, cada una distinta (CASAS), mirando a su calle.
// Alrededor, la empalizada de troncos de 6 m con el adarve (se sube por escaleras junto a las cuatro puertas), las
// atalayas, las doce piedras de la cúpula y el río que bordea el este y el sur con los puentes y el muelle de balsas.
// EIKPLANO.armar() → { raiz, choques, superficies, zonas, anclas, edificios, luces, humos, rutas, puestos, ... }
window.EIKPLANO = (function () {
  "use strict";
  const T = THREE,
    P = PIEZAS,
    PI = Math.PI,
    TAU = PI * 2;
  const R_MURO = 150, // radio de la empalizada (el claro mide unos 300 m)
    ADARVE = 4.4, // alto de la pasarela
    HUECO = 5.5, // medio ancho de cada puerta
    R_FUERA = 232; // hasta dónde se puede caminar afuera
  const PUERTAS = { sur: PI / 2, norte: -PI / 2, este: 0, oeste: PI };
  const polar = (a, r) => [Math.cos(a) * r, Math.sin(a) * r];
  const dist2 = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
  // distancia de un punto a un segmento
  function aSeg(px, pz, ax, az, bx, bz) {
    const dx = bx - ax,
      dz = bz - az,
      l = dx * dx + dz * dz;
    let t = l ? ((px - ax) * dx + (pz - az) * dz) / l : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - ax - dx * t, pz - az - dz * t);
  }

  // ---------- el río: entra por el nordeste, baja por el este y rodea el sur ----------
  const RIO = [[250, -360], [214, -250], [190, -150], [181, -60], [180, 30], [176, 95], [160, 140], [126, 172], [70, 190], [0, 196], [-70, 194], [-140, 200], [-215, 214], [-330, 244]];
  const ANCHO_RIO = 15;
  function aRio(x, z) {
    let d = 1e9;
    for (let i = 0; i < RIO.length - 1; i++) d = Math.min(d, aSeg(x, z, RIO[i][0], RIO[i][1], RIO[i + 1][0], RIO[i + 1][1]));
    return d;
  }
  // ---------- las calles ----------
  // cada una: puntos y ancho; tipo: tierra, laja (la avenida del sur, empedrada) o senda
  const CALLES = [];
  const calle = (pts, w, tipo = "tierra") => CALLES.push({ pts, w, tipo });
  const arco = (r, a0, a1, n) => {
    const l = [];
    for (let i = 0; i <= n; i++) l.push(polar(a0 + ((a1 - a0) * i) / n, r));
    return l;
  };
  // los anillos no son círculos: la ciudad creció a mano, cada barrio empujando la calle un poco
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
  // una calle de un anillo a otro, torcida
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
  calle(arco(52, 0, TAU, 48), 5.5); // la vuelta de la plaza
  calle(curva(rOficios, 0, TAU, 96), 4.6); // el anillo de los oficios
  calle([[0, 48], [0, R_MURO + 4], [0, 196], [0, 300]], 7, "laja"); // la avenida del sur, hasta el puente y Hrafngard
  calle([[0, -48], [0, -R_MURO - 4], [0, -300]], 6); // al norte, el Paso
  calle([[48, 0], [R_MURO + 4, 0], [200, -6], [300, -14]], 6); // al este, el aserradero y el santuario
  calle([[-48, 0], [-R_MURO - 4, 0], [-300, 12]], 5.5); // al oeste, Brunvik
  [PI / 4, (3 * PI) / 4, (5 * PI) / 4, (7 * PI) / 4].forEach((a, i) => radial(a, 52, rOficios, 3.6, "tierra", i));
  // más callejas entre la plaza y los oficios
  [0.42, 1.18, 1.95, 2.72, 3.55, 4.32, 5.1, 5.85].forEach((a, i) => radial(a, 52, rOficios, 2.6, "senda", i + 10));
  // callejones del borde, entre el anillo y la empalizada
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * TAU + 0.11;
    if (Object.values(PUERTAS).some((p) => Math.abs(Math.atan2(Math.sin(a - p), Math.cos(a - p))) < 0.12)) continue;
    radial(a, rOficios, R_MURO - 9, 2.8, "senda", i + 30);
  }
  // el camino de afuera hasta el muelle (sale de la Puerta del Este y baja por la orilla)
  calle([[156, 6], [164, 40], [160, 90], [146, 128], [132, 150]], 3, "senda");
  function aCalle(x, z, tipo) {
    let mejor = { d: 1e9, c: null };
    for (const c of CALLES) {
      if (tipo && c.tipo !== tipo) continue;
      for (let i = 0; i < c.pts.length - 1; i++) {
        const d = aSeg(x, z, c.pts[i][0], c.pts[i][1], c.pts[i + 1][0], c.pts[i + 1][1]) - c.w / 2;
        if (d < mejor.d) mejor = { d, c };
      }
    }
    return mejor;
  }

  // ---------- zonas reservadas (los lugares con nombre) ----------
  // [cx, cz, medio ancho, medio fondo] en el mundo: ahí no van casas de relleno
  const RESERVA = [];
  const reservar = (cx, cz, mx, mz) => RESERVA.push([cx, cz, mx, mz]);
  const reservado = (x, z, m = 0) => RESERVA.some(([cx, cz, mx, mz]) => Math.abs(x - cx) < mx + m && Math.abs(z - cz) < mz + m);
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
    muelle: [138, 160],
    camas_hongos: [-20, -14],
  };
  reservar(-104, 62, 17, 18); // Casa de las Lindes y su patio
  reservar(-40, 114, 14, 11); // carpintería
  reservar(-70, 22, 12, 11); // herrería
  reservar(-116, -16, 7, 12); // cordelería
  reservar(-76, 116, 9, 9); // curtiembre
  reservar(-72, -76, 15, 12); // Casa de Sanación y su jardín
  reservar(-30, -122, 10, 8); // la Guardia
  reservar(-16, -108, 8, 9); // patio de práctica
  reservar(48, -114, 20, 14); // corral de caravanas
  reservar(74, -66, 18, 16); // mercado de los forasteros
  reservar(116, 50, 16, 34); // huertas
  reservar(54, 62, 16, 12); // Hongo Dorado
  reservar(14, 136, 8, 6);
  reservar(-15, 135, 7, 6);
  // la calle del borde, cortada donde están los lugares grandes
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

  // ---------- armar ----------
  function armar(opciones = {}) {
    const raiz = new T.Group();
    const choques = [],
      tris = [],
      zonas = [],
      anclas = {},
      edificios = [],
      luces = [],
      humos = [],
      puestos = [],
      fuegos = [],
      techosAbiertos = [];
    // geometría estática repartida en celdas de 48 m (cada celda una malla: lo que no se ve no se dibuja)
    const celdas = new Map();
    function celda(x, z) {
      const k = Math.floor(x / 48) + "," + Math.floor(z / 48);
      let c = celdas.get(k);
      if (!c) {
        const h = Math.abs(Math.floor(x / 48) * 73 + Math.floor(z / 48) * 151) + 9;
        c = { a: GEO.armador(h), b: GEO.armador(h + 1), r: GEO.runicoArm ? null : GEO.armador(h + 2) };
        celdas.set(k, c);
      }
      return c;
    }
    const A = (x, z) => celda(x, z).a,
      B = (x, z) => celda(x, z).b,
      RU = (x, z) => celda(x, z).r;
    // choques: circulo [x, z, r], obb [x, z, mx, mz, ang], seg [ax, az, bx, bz, grosor]; y0..y1 en qué alturas cuentan
    const chocar = (c) => choques.push(Object.assign({ y0: -2, y1: 6 }, c));
    // superficies: triángulos con alto en cada vértice (pisos, escaleras, adarve, el mirador)
    const sup = (p0, p1, p2, extra) => tris.push(Object.assign({ p: [p0, p1, p2] }, extra || {}));
    const supQuad = (a, b, c, d, extra) => {
      sup(a, b, c, extra);
      sup(a, c, d, extra);
    };
    const luz = (p, f = 1, tipo = "farol") => luces.push({ x: p[0], y: p[1], z: p[2], f, tipo });

    // ---------- el piso ----------
    const h0 = (x, z) => {
      const dr = aRio(x, z);
      let h = 0;
      if (dr < ANCHO_RIO / 2 + 4) h = -1.6 * Math.min(1, Math.max(0, (ANCHO_RIO / 2 + 4 - dr) / 4));
      const r = Math.hypot(x, z);
      if (r > R_MURO + 12 && dr > ANCHO_RIO / 2 + 4) h += Math.sin(x * 0.05) * Math.cos(z * 0.043) * 0.7 * Math.min(1, (r - R_MURO - 12) / 30);
      return h;
    };
    const ruidoV = (x, z) => (Math.sin(x * 0.37 + z * 0.11) * Math.cos(z * 0.29 - x * 0.07) + Math.sin(x * 0.07 + z * 0.13)) * 0.5;
    function colorSuelo(x, z) {
      const r = Math.hypot(x, z),
        dr = aRio(x, z),
        n = ruidoV(x, z);
      if (dr < ANCHO_RIO / 2 + 1.5) return GEO.mezclar("#2E2A22", "#3E3626", 0.5 + n * 0.5);
      if (dr < ANCHO_RIO / 2 + 4) return GEO.mezclar("#4C4032", "#5A4E38", 0.5 + n * 0.5);
      const cc = aCalle(x, z);
      if (cc.d < 0) return cc.c.tipo === "laja" ? GEO.mezclar("#6E604C", "#7A6A52", 0.5 + n * 0.4) : GEO.mezclar("#78684E", "#6A5A42", 0.5 + n * 0.5);
      if (cc.d < 1.2) return GEO.mezclar("#6A6044", "#5A5E3A", cc.d / 1.2);
      if (r < 46) return GEO.mezclar(r < 18 ? "#4A3E30" : "#6A5A44", "#5E5038", 0.5 + n * 0.5); // la plaza bajo la copa
      if (r < 50) return GEO.mezclar("#5E5A3C", "#6A5E44", 0.5 + n * 0.5);
      if (r > R_MURO + 6) return GEO.mezclar("#33402E", "#3E4A30", 0.5 + n * 0.5); // el bosque de afuera
      return GEO.mezclar("#4E5A32", "#5A6238", 0.5 + n * 0.5); // pasto pisado de la ciudad
    }
    {
      const L = R_FUERA + 30,
        paso = 2;
      const pos = [],
        col = [];
      const n = Math.ceil((2 * L) / paso);
      const hv = [];
      for (let i = 0; i <= n; i++) {
        hv[i] = [];
        for (let k = 0; k <= n; k++) hv[i][k] = h0(-L + i * paso, -L + k * paso);
      }
      const rr = GEO.azar(77);
      for (let i = 0; i < n; i++)
        for (let k = 0; k < n; k++) {
          const x0 = -L + i * paso,
            z0 = -L + k * paso,
            x1 = x0 + paso,
            z1 = z0 + paso;
          if (Math.hypot(x0 + 1, z0 + 1) > L + 4) continue;
          const v = [[x0, hv[i][k], z0], [x1, hv[i + 1][k], z0], [x1, hv[i + 1][k + 1], z1], [x0, hv[i][k + 1], z1]];
          const t1 = [v[0], v[2], v[1]],
            t2 = [v[0], v[3], v[2]];
          for (const t of [t1, t2]) {
            const cx = (t[0][0] + t[1][0] + t[2][0]) / 3,
              cz = (t[0][2] + t[1][2] + t[2][2]) / 3;
            const c = colorSuelo(cx, cz),
              j = 1 + (rr() - 0.5) * 0.06;
            for (const p of t) {
              pos.push(p[0], p[1], p[2]);
              col.push(c[0] * j, c[1] * j, c[2] * j);
            }
          }
        }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
      g.setAttribute("color", new T.Float32BufferAttribute(col, 3));
      g.computeVertexNormals();
      const m = new T.Mesh(g, GEO.MAT.mate);
      m.receiveShadow = true;
      m.name = "piso";
      raiz.add(m);
      // más allá, un anillo de bosque oscuro hasta el horizonte
      const lejos = new T.Mesh(new T.RingGeometry(L - 2, 1800, 48, 1), new T.MeshLambertMaterial({ color: 0x2c3828 }));
      lejos.rotation.x = -PI / 2;
      lejos.position.y = 0.4;
      raiz.add(lejos);
    }
    // el agua del río: una cinta a lo largo del cauce
    {
      const pos = [],
        idx = [];
      for (let i = 0; i < RIO.length; i++) {
        const p = RIO[i],
          q = RIO[Math.min(i + 1, RIO.length - 1)],
          o = RIO[Math.max(i - 1, 0)];
        let dx = q[0] - o[0],
          dz = q[1] - o[1];
        const l = Math.hypot(dx, dz);
        dx /= l;
        dz /= l;
        const w = ANCHO_RIO / 2 + 1.2;
        pos.push(p[0] - dz * w, -0.55, p[1] + dx * w, p[0] + dz * w, -0.55, p[1] - dx * w);
        if (i < RIO.length - 1) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3);
      }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      const agua = new T.Mesh(g, GEO.MAT.agua);
      agua.name = "agua";
      agua.receiveShadow = true;
      raiz.add(agua);
      // piedras en las orillas
      const r = GEO.azar(91);
      for (let i = 0; i < RIO.length - 1; i++) {
        const [ax, az] = RIO[i],
          [bx, bz] = RIO[i + 1],
          l = Math.hypot(bx - ax, bz - az);
        const nx = -(bz - az) / l,
          nz = (bx - ax) / l;
        for (let k = 0; k < l / 3; k++) {
          const u = r(),
            s = r() < 0.5 ? 1 : -1,
            off = ANCHO_RIO / 2 + 0.5 + r() * 2.5;
          const x = ax + (bx - ax) * u + nx * s * off,
            z = az + (bz - az) * u + nz * s * off;
          if (Math.abs(x) < 9 && z > 170) continue; // el puente del sur
          if (Math.abs(z + 2) < 9 && x > 150) continue; // el del este
          P.roca(A(x, z), x, z, 0.5 + r() * 1.1, GEO.aclarar(P.C.piedra, (r() - 0.5) * 0.25));
        }
      }
      // el río no se cruza más que por los puentes (de a tramos de 2 m, sin los que pisa un puente)
      const PUENTES = [[0, 196, PI / 2], [181, -2, -0.08]];
      for (let i = 0; i < RIO.length - 1; i++) {
        const [ax, az] = RIO[i],
          [bx, bz] = RIO[i + 1],
          n = Math.ceil(Math.hypot(bx - ax, bz - az) / 2);
        for (let k = 0; k < n; k++) {
          const x0 = ax + ((bx - ax) * k) / n,
            z0 = az + ((bz - az) * k) / n,
            x1 = ax + ((bx - ax) * (k + 1)) / n,
            z1 = az + ((bz - az) * (k + 1)) / n;
          if (PUENTES.some(([px, pz]) => Math.hypot((x0 + x1) / 2 - px, (z0 + z1) / 2 - pz) < 4.5)) continue;
          chocar({ seg: [x0, z0, x1, z1, ANCHO_RIO / 2 - 0.5], rio: true });
        }
      }
      // los puentes: tablones sobre pilotes, con una joroba suave y baranda; el del sur más ancho (la avenida)
      PUENTES.forEach(([cx, cz, ang], i) => {
        const largo = 24,
          ancho = i ? 5.4 : 7,
          a = A(cx, cz),
          b = B(cx, cz);
        const ry = -ang + PI / 2; // el largo va por el z local
        const yAt = (u) => 0.15 + Math.sin(u * PI) * 0.9; // u de 0 a 1 a lo largo
        const W2 = (lx, lz) => [cx + lx * Math.cos(ry) + lz * Math.sin(ry), cz - lx * Math.sin(ry) + lz * Math.cos(ry)];
        a.con({ x: cx, z: cz, ry }, () => {
          const n = 30;
          for (let k = 0; k < n; k++) {
            const u0 = k / n,
              u1 = (k + 1) / n,
              z0 = -largo / 2 + largo * u0,
              z1 = -largo / 2 + largo * u1;
            a.losa([-ancho / 2, yAt(u1), z1], [ancho / 2, yAt(u1), z1], [ancho / 2, yAt(u0), z0], [-ancho / 2, yAt(u0), z0], 0.18, k % 2 ? "#6A5038" : "#5E4632", "#3E2C20");
            if (k % 5 === 0) {
              for (const s of [-1, 1]) {
                a.cilindro(s * (ancho / 2 + 0.05), -2.2, z0, 0.2, 0.2, yAt(u0) + 3.2, 6, "#3A2A1E");
                if (k > 0) a.palo([s * (ancho / 2 + 0.05), yAt(u0) + 1.0, z0], [s * (ancho / 2 + 0.05), yAt(u0 - 5 / n) + 1.0, z0 - (largo * 5) / n], 0.07, "#4A3426", 4);
              }
              a.palo([-ancho / 2, yAt(u0) - 0.4, z0], [ancho / 2, yAt(u0) - 0.4, z0], 0.12, "#3A2A1E", 4);
            }
          }
          for (const s of [-1, 1]) a.palo([s * (ancho / 2 + 0.05), yAt(25 / 30) + 1.0, -largo / 2 + largo * (25 / 30)], [s * (ancho / 2 + 0.05), 1.15, largo / 2], 0.07, "#4A3426", 4);
          // un farol en cada punta
          for (const s of [-1, 1]) {
            a.cilindro(s * (ancho / 2 + 0.05), yAt(0), -largo / 2 + 0.2, 0.08, 0.08, 2.6, 5, "#3A2A1E");
            b.caja(s * (ancho / 2 + 0.05), yAt(0) + 2.3, -largo / 2 + 0.2, 0.3, 0.32, 0.3, P.C.vidrio);
          }
        });
        for (const s of [-1, 1]) {
          const [lx, lz] = W2(s * (ancho / 2 + 0.05), -largo / 2 + 0.2);
          luz([lx, 2.6, lz], 0.8, "farol");
        }
        // la superficie y las barandas
        const m = 20;
        for (let k = 0; k < m; k++) {
          const u0 = k / m,
            u1 = (k + 1) / m;
          const z0 = -largo / 2 - 0.5 + (largo + 1) * u0,
            z1 = -largo / 2 - 0.5 + (largo + 1) * u1;
          const p = (lx, lz, u) => [...W2(lx, lz), yAt(Math.min(1, Math.max(0, u)))];
          supQuad(p(-ancho / 2, z0, u0), p(ancho / 2, z0, u0), p(ancho / 2, z1, u1), p(-ancho / 2, z1, u1), { puente: true });
        }
        for (const s of [-1, 1]) {
          const [ax, az] = W2(s * (ancho / 2 + 0.2), -largo / 2 + 2.5),
            [bx, bz] = W2(s * (ancho / 2 + 0.2), largo / 2 - 2.5);
          chocar({ seg: [ax, az, bx, bz, 0.2], y0: -3, y1: 4 });
        }
        anclas["puente" + i] = [cx, cz];
      });
    }

    // ---------- la empalizada, el adarve y las atalayas ----------
    const enPuerta = (a, m = 0) => Object.values(PUERTAS).some((p) => Math.abs(Math.atan2(Math.sin(a - p), Math.cos(a - p))) * R_MURO < HUECO + m);
    const troncos = [];
    {
      const n = Math.round((TAU * R_MURO) / 0.52);
      const r = GEO.azar(150);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        if (enPuerta(a, 2.6)) continue;
        troncos.push({ a, r: R_MURO + (r() - 0.5) * 0.12, h: 5.6 + r() * 0.9, rad: 0.24 + r() * 0.05, inc: (r() - 0.5) * 0.04, c: 0.85 + r() * 0.25 });
      }
    }
    // los troncos como instancias: un tronco de 8 caras con la punta afilada
    {
      const a = GEO.armador(5);
      a.cilindro(0, 0, 0, 1, 1, 1, 7, "#5E4632", "#5E4632", false);
      a.cilindro(0, 1, 0, 1, 0, 0.16, 7, "#7A5E44");
      const g = a.geometria();
      const im = new T.InstancedMesh(g, GEO.MAT.mate, troncos.length);
      const m = new T.Matrix4(),
        q = new T.Quaternion(),
        e = new T.Euler();
      troncos.forEach((tr, i) => {
        const [x, z] = polar(tr.a, tr.r);
        e.set(tr.inc, -tr.a, tr.inc * 0.5);
        q.setFromEuler(e);
        m.compose(new T.Vector3(x, -0.3, z), q, new T.Vector3(tr.rad, tr.h, tr.rad));
        im.setMatrixAt(i, m);
        im.setColorAt(i, new T.Color(tr.c, tr.c * 0.97, tr.c * 0.94));
      });
      im.castShadow = true;
      im.receiveShadow = true;
      im.name = "empalizada";
      raiz.add(im);
    }
    // el adarve: tablas sobre vigas, baranda hacia adentro, postes; las piedras de la cúpula y las atalayas
    {
      const n = 240,
        r0 = R_MURO - 0.6,
        r1 = R_MURO - 3.0;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * TAU,
          a1 = ((i + 1) / n) * TAU,
          am = (a0 + a1) / 2;
        const [x, z] = polar(am, (r0 + r1) / 2);
        const a = A(x, z);
        const p = (aa, rr, y) => [Math.cos(aa) * rr, y, Math.sin(aa) * rr];
        a.losa(p(a1, r0, ADARVE), p(a0, r0, ADARVE), p(a0, r1, ADARVE), p(a1, r1, ADARVE), 0.12, i % 2 ? "#6A5038" : "#5E4632", "#3E2C20");
        // la superficie para caminar
        const s = (aa, rr) => [Math.cos(aa) * rr, Math.sin(aa) * rr, ADARVE];
        supQuad(s(a0, r0 + 0.3), s(a1, r0 + 0.3), s(a1, r1 - 0.1), s(a0, r1 - 0.1), { nivel: "adarve" });
        if (i % 4 === 0) {
          // postes que sostienen el adarve y la baranda
          const [px, pz] = polar(am, r1 + 0.1);
          a.cilindro(px, 0, pz, 0.14, 0.14, ADARVE + 1.1, 6, "#3A2A1E");
          const [qx, qz] = polar(am, r0 - 0.2);
          a.cilindro(qx, 0, qz, 0.13, 0.13, ADARVE, 6, "#3A2A1E");
          a.palo([px, ADARVE - 0.9, pz], [qx, ADARVE - 0.15, qz], 0.07, "#3A2A1E", 4);
          chocar({ circulo: [px, pz, 0.25], y0: -1, y1: ADARVE - 0.4 });
        }
        a.palo(p(a0, r1 + 0.1, ADARVE + 1.0), p(a1, r1 + 0.1, ADARVE + 1.0), 0.06, "#4A3426", 4);
        a.palo(p(a0, r1 + 0.1, ADARVE + 0.5), p(a1, r1 + 0.1, ADARVE + 0.5), 0.05, "#4A3426", 4);
      }
      // la baranda corta los bordes del adarve: no se cae nadie
    }
    // la empalizada no se atraviesa (salvo por las puertas)
    {
      const n = 160;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * TAU,
          a1 = ((i + 1) / n) * TAU;
        if (enPuerta((a0 + a1) / 2, 0.5)) continue;
        const [ax, az] = polar(a0, R_MURO),
          [bx, bz] = polar(a1, R_MURO);
        chocar({ seg: [ax, az, bx, bz, 0.7], y0: -2, y1: 7, muro: true });
      }
    }
    // las atalayas, cada 30° salvo en las puertas (ahí van las torres de cada puerta)
    function atalaya(x, z, ang, alto = 9.5, ancho = 4.2) {
      const a = A(x, z),
        b = B(x, z);
      a.con({ x, z, ry: -ang + PI / 2 }, () => {
        const w = ancho / 2;
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.caja(sx * (w - 0.2), 0, sz * (w - 0.2), 0.38, alto, 0.38, "#3E2C20");
        // las paredes de tablas de la casilla de arriba
        for (const [dx, dz, ry] of [[0, w - 0.15, 0], [0, -w + 0.15, 0], [w - 0.15, 0, PI / 2], [-w + 0.15, 0, PI / 2]])
          a.con({ x: dx, z: dz, ry }, () => {
            for (let k = 0; k < 4; k++) a.caja(0, alto - 2.6 + k * 0.32, 0, ancho - 0.3, 0.3, 0.12, k % 2 ? "#5A4230" : "#4E3A2A");
          });
        a.caja(0, ADARVE - 0.15, 0, ancho, 0.15, ancho, "#5E4632");
        a.caja(0, alto - 2.8, 0, ancho + 0.2, 0.15, ancho + 0.2, "#5E4632");
        // techo a cuatro aguas
        const y = alto + 0.4,
          ww = w + 0.6;
        a.tri([-ww, y, ww], [ww, y, ww], [0, y + 2.4, 0], "#4E545C");
        a.tri([ww, y, ww], [ww, y, -ww], [0, y + 2.4, 0], "#454A52");
        a.tri([ww, y, -ww], [-ww, y, -ww], [0, y + 2.4, 0], "#4E545C");
        a.tri([-ww, y, -ww], [-ww, y, ww], [0, y + 2.4, 0], "#454A52");
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.caja(sx * (w - 0.2), alto - 1.3, sz * (w - 0.2), 0.3, 1.75, 0.3, "#3E2C20");
        b.caja(0, alto - 1.6, w - 0.1, 0.5, 0.5, 0.05, P.C.vidrio);
      });
      luz([x, alto - 1.4, z], 0.8, "atalaya");
      chocar({ obb: [x, z, ancho / 2, ancho / 2, -ang + PI / 2], y0: -1, y1: ADARVE - 0.5 });
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + PI / 12;
      if (enPuerta(a, 8)) continue;
      const [x, z] = polar(a, R_MURO + 1.2);
      atalaya(x, z, a);
    }
    // ---------- las cuatro puertas ----------
    function puerta(nombre) {
      const ang = PUERTAS[nombre],
        [cx, cz] = polar(ang, R_MURO);
      const ry = -ang + PI / 2; // el +z local mira hacia afuera
      const a = A(cx, cz),
        b = B(cx, cz);
      const grande = nombre === "sur";
      const alto = grande ? 11.5 : 10;
      const tw = grande ? 5 : 4.4;
      a.con({ x: cx, z: cz, ry }, () => {
        // las dos torres
        for (const s of [-1, 1]) {
          const x = s * (HUECO + tw / 2);
          for (let k = 0; k < Math.ceil(alto / 0.42); k++) a.caja(x, k * 0.42, 0, tw, 0.4, tw, k % 2 ? "#4E3A2A" : "#5A4230");
          for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.caja(x + sx * (tw / 2 - 0.1), 0, sz * (tw / 2 - 0.1), 0.34, alto + 0.2, 0.34, "#2E2018");
          const y = alto + 0.2,
            w = tw / 2 + 0.6;
          a.tri([x - w, y, w], [x + w, y, w], [x, y + 3, 0], "#4E545C");
          a.tri([x + w, y, w], [x + w, y, -w], [x, y + 3, 0], "#454A52");
          a.tri([x + w, y, -w], [x - w, y, -w], [x, y + 3, 0], "#4E545C");
          a.tri([x - w, y, -w], [x - w, y, w], [x, y + 3, 0], "#454A52");
          b.caja(x, alto - 2.4, tw / 2 + 0.03, 0.6, 0.8, 0.03, P.C.vidrio);
          b.caja(x, alto - 2.4, -tw / 2 - 0.03, 0.6, 0.8, 0.03, P.C.vidrio);
          luz([cx + Math.cos(ang) * 0 + (s * (HUECO + tw / 2)) * Math.cos(ry), alto - 2.4, cz - s * (HUECO + tw / 2) * Math.sin(ry)], 0.9, "puerta");
          // estandarte del ciervo colgado de la torre, hacia afuera y hacia adentro
          for (const lado of [1, -1]) {
            a.con({ x, y: alto - 3.4, z: lado * (tw / 2 + 0.05), ry: lado > 0 ? 0 : PI }, () => {
              a.quad([-0.7, 0, 0], [0.7, 0, 0], [0.7, -3.2, 0], [-0.7, -3.2, 0], "#2C4226");
              a.tri([-0.7, -3.2, 0], [0.7, -3.2, 0], [0, -3.7, 0], "#2C4226");
              const k = "#E8E0CC";
              for (const sx of [-1, 1]) {
                a.palo([0, -2.0, 0.02], [sx * 0.42, -0.8, 0.02], 0.04, k, 3);
                a.palo([sx * 0.2, -1.5, 0.02], [sx * 0.55, -1.4, 0.02], 0.03, k, 3);
              }
              a.caja(0, -2.4, 0.02, 0.16, 0.4, 0.02, k);
            });
          }
        }
        // el puente techado entre las torres, a la altura del adarve
        a.caja(0, ADARVE - 0.2, 0, HUECO * 2 + 0.2, 0.4, 3.0, "#4E3A2A");
        for (let k = 0; k < 6; k++) a.caja(0, ADARVE + 0.2 + k * 0.35, 1.45, HUECO * 2, 0.33, 0.14, k % 2 ? "#5A4230" : "#4E3A2A");
        a.losa([-HUECO - 0.3, ADARVE + 3.6, 2.2], [HUECO + 0.3, ADARVE + 3.6, 2.2], [HUECO + 0.3, ADARVE + 4.6, 0], [-HUECO - 0.3, ADARVE + 4.6, 0], 0.12, "#4E545C", "#3A3A3A");
        a.losa([-HUECO - 0.3, ADARVE + 4.6, 0], [HUECO + 0.3, ADARVE + 4.6, 0], [HUECO + 0.3, ADARVE + 3.6, -2.2], [-HUECO - 0.3, ADARVE + 3.6, -2.2], 0.12, "#454A52", "#3A3A3A");
        for (const s of [-1, 1]) a.caja(s * (HUECO - 0.2), ADARVE + 0.2, -1.2, 0.25, 3.4, 0.25, "#2E2018");
        // el portón de dos hojas abierto hacia adentro, con las runas ámbar de protección
        for (const s of [-1, 1])
          a.con({ x: s * HUECO, z: -0.4, ry: s * 1.25 }, () => {
            a.con({ x: -s * (HUECO / 2) }, () => {
              for (let k = 0; k < 5; k++) a.caja(-HUECO / 2 + 0.55 + k * 1.05 - HUECO / 2 + HUECO / 2, 0, 0, 1.0, ADARVE - 0.5, 0.22, k % 2 ? "#4A3426" : "#3E2C20");
              a.caja(0, 0.8, 0.13, HUECO - 0.2, 0.2, 0.06, nombre === "norte" ? "#46464A" : "#2E2E30");
              a.caja(0, ADARVE - 1.6, 0.13, HUECO - 0.2, 0.2, 0.06, nombre === "norte" ? "#46464A" : "#2E2E30");
              if (nombre === "norte") for (let k = 0; k < 4; k++) a.caja(-HUECO / 2 + 0.6 + k * 1.3, 0.3, 0.14, 0.12, ADARVE - 1.0, 0.05, "#46464A");
              b.con({ y: 2.0, z: 0.17 }, () => CASAS.runa(b, s > 0 ? "algiz" : "othala", 0, 0, 0, 1.2));
              b.con({ y: 2.0, z: -0.12, ry: PI }, () => CASAS.runa(b, s > 0 ? "othala" : "algiz", 0, 0, 0, 1.2));
            });
          });
        // braseros a los lados del camino, afuera
        for (const s of [-1, 1]) {
          a.cilindro(s * (HUECO - 0.6), 0, 4.5, 0.18, 0.12, 1.0, 6, "#2E2E30");
          a.cilindro(s * (HUECO - 0.6), 1.0, 4.5, 0.45, 0.55, 0.3, 8, "#2E2E30");
          b.bola(s * (HUECO - 0.6), 1.45, 4.5, 0.4, 0.4, 0.4, "#FFB050", 0, 0.35);
        }
      });
      for (const s of [-1, 1]) {
        const lx = s * (HUECO - 0.6),
          wx = cx + lx * Math.cos(ry) + 4.5 * Math.sin(ry),
          wz = cz - lx * Math.sin(ry) + 4.5 * Math.cos(ry);
        luz([wx, 1.6, wz], 1.2, "brasero");
        fuegos.push([wx, 1.5, wz]);
        chocar({ circulo: [wx, wz, 0.55], y0: -1, y1: 2 });
        // las torres no se atraviesan
        const tx = s * (HUECO + tw / 2);
        chocar({ obb: [cx + tx * Math.cos(ry), cz - tx * Math.sin(ry), tw / 2, tw / 2, ry], y0: -1, y1: alto });
      }
      // el piso del puente techado sobre la puerta (se cruza por arriba)
      const L = (x, z) => [cx + x * Math.cos(ry) + z * Math.sin(ry), cz - x * Math.sin(ry) + z * Math.cos(ry)];
      const e0 = L(-HUECO - 2, 1.3),
        e1 = L(HUECO + 2, 1.3),
        e2 = L(HUECO + 2, -2.6),
        e3 = L(-HUECO - 2, -2.6);
      supQuad([e0[0], e0[1], ADARVE], [e1[0], e1[1], ADARVE], [e2[0], e2[1], ADARVE], [e3[0], e3[1], ADARVE], { nivel: "adarve" });
      anclas["puerta_" + nombre] = [cx, cz];
      anclas["puerta_" + nombre + "_dentro"] = polar(ang, R_MURO - 18);
      anclas["puerta_" + nombre + "_fuera"] = polar(ang, R_MURO + 9);
      return { ang, cx, cz };
    }
    ["sur", "norte", "este", "oeste"].forEach(puerta);
    // las escaleras del adarve: por dentro, a los dos lados de cada puerta, subiendo alejándose de ella
    for (const nombre in PUERTAS) {
      const pa = PUERTAS[nombre];
      for (const lado of [-1, 1]) {
        const largo = 12,
          rIn = R_MURO - 5.4,
          rOut = R_MURO - 2.6;
        const a0 = pa + (lado * (HUECO + 5.5)) / R_MURO,
          a1 = a0 + (lado * largo) / R_MURO;
        const pasos = 16;
        for (let k = 0; k < pasos; k++) {
          const u0 = k / pasos,
            u1 = (k + 1) / pasos;
          const aa = a0 + (a1 - a0) * u0,
            ab = a0 + (a1 - a0) * u1;
          const y0 = ADARVE * u0,
            y1 = ADARVE * u1;
          const [x, z] = polar((aa + ab) / 2, (rIn + rOut) / 2);
          const ar = A(x, z);
          // el escalón
          const q = (an, r, y) => [Math.cos(an) * r, y, Math.sin(an) * r];
          ar.losa(lado > 0 ? q(ab, rOut, y1) : q(aa, rOut, y1), lado > 0 ? q(aa, rOut, y1) : q(ab, rOut, y1), lado > 0 ? q(aa, rIn, y1) : q(ab, rIn, y1), lado > 0 ? q(ab, rIn, y1) : q(aa, rIn, y1), 0.14, k % 2 ? "#6A5038" : "#5E4632", "#3E2C20");
          if (k % 3 === 0) {
            const [px, pz] = polar(aa, rIn + 0.1);
            ar.cilindro(px, 0, pz, 0.1, 0.1, y1 + 1.0, 5, "#3A2A1E");
          }
          const s = (an, r, y) => [Math.cos(an) * r, Math.sin(an) * r, y];
          supQuad(s(aa, rIn, y0), s(ab, rIn, y1), s(ab, rOut + 0.6, y1), s(aa, rOut + 0.6, y0), { nivel: "escalera" });
        }
        // la baranda de la escalera
        const [p0x, p0z] = polar(a0, rIn + 0.05),
          [p1x, p1z] = polar(a1, rIn + 0.05);
        A(p0x, p0z).palo([p0x, 1.0, p0z], [p1x, ADARVE + 1.0, p1z], 0.05, "#4A3426", 4);
        anclas["escalera_" + nombre + (lado > 0 ? "_a" : "_b")] = polar(a0 - lado * 0.004, (rIn + rOut) / 2);
      }
    }
    // ---------- las doce piedras de la cúpula (dos junto a la Puerta del Norte y dos junto a la del Sur) ----------
    const ANCLAS_RUNA = [
      [PUERTAS.sur - 14 / R_MURO, "algiz", 1], [PUERTAS.sur + 14 / R_MURO, "othala", 0.9],
      [PUERTAS.norte - 14 / R_MURO, "tiwaz", 1], [PUERTAS.norte + 14 / R_MURO, "berkano", 0.75],
      [0.42, "ingwaz", 0.45], [1.02, "laguz", 0.2], [2.12, "sowilo", 1], [2.72, "mannaz", 0],
      [-0.42, "dagaz", 0.6], [-1.02, "eihwaz", 0], [-2.12, "jera", 0.85], [-2.72, "raidho", 0.35],
    ];
    const piedrasCupula = [];
    ANCLAS_RUNA.forEach(([a, runa, fuerza], i) => {
      const [x, z] = polar(a, R_MURO + 0.6);
      P.menhir(A(x, z), RU(x, z), x, z, -a + PI / 2, runa, fuerza, 7.6);
      piedrasCupula.push({ x, z, a, runa, fuerza, i });
      anclas["ancla" + i] = polar(a, R_MURO - 4);
      chocar({ obb: [x, z, 1.3, 0.8, -a + PI / 2], y0: -1, y1: 8 });
    });

    // ---------- el Roble ----------
    const roble = armarRoble(raiz, chocar, sup, supQuad, luz, anclas);

    // ---------- la plaza ----------
    {
      const r = GEO.azar(31);
      // lajas: el círculo del Ting, la vuelta de la plaza y la avenida del sur
      const laja = (x, z, s) => {
        const a = A(x, z),
          n = 5 + Math.floor(r() * 2),
          pts = [];
        for (let k = 0; k < n; k++) {
          const an = (k / n) * TAU + r() * 0.4;
          pts.push([x + Math.cos(an) * s * (0.8 + r() * 0.3), z + Math.sin(an) * s * (0.8 + r() * 0.3)]);
        }
        a.prisma(pts.reverse(), -0.02, 0.05 + r() * 0.03, GEO.aclarar("#7A7C76", (r() - 0.5) * 0.25), GEO.aclarar("#8A8A82", (r() - 0.5) * 0.25));
      };
      const [tx, tz] = LUGAR.ting;
      for (let rr = 1.2; rr < 11; rr += 1.05) {
        const n = Math.round((TAU * rr) / 1.05);
        for (let k = 0; k < n; k++) {
          const an = (k / n) * TAU + rr;
          laja(tx + Math.cos(an) * rr, tz + Math.sin(an) * rr, 0.48);
        }
      }
      // la vuelta empedrada de la plaza
      for (let k = 0; k < 420; k++) {
        const an = (k / 420) * TAU,
          rr = 50 + (r() - 0.5) * 4;
        laja(Math.cos(an) * rr, Math.sin(an) * rr, 0.5 + r() * 0.15);
      }
      // la avenida del sur, de la plaza a la puerta
      for (let z = 54; z < R_MURO - 2; z += 1.0) for (let x = -3; x <= 3; x += 1.0) laja(x + (r() - 0.5) * 0.3, z + (r() - 0.5) * 0.3, 0.48);
      // el Ting: doce asientos y la piedra negra (sin ninguna luz)
      for (let i = 0; i < 12; i++) {
        const an = (i / 12) * TAU;
        const x = tx + Math.cos(an) * 7.6,
          z = tz + Math.sin(an) * 7.6;
        P.asientoTing(A(x, z), x, z, -an - PI / 2, i);
        chocar({ circulo: [x, z, 0.65], y0: -1, y1: 1.4 });
        anclas["asiento" + i] = [tx + Math.cos(an) * 6.4, tz + Math.sin(an) * 6.4];
      }
      {
        const a = GEO.armador(4242);
        const pts = [[-0.7, -0.45], [0.75, -0.5], [0.85, 0.4], [-0.8, 0.5]];
        for (let i = 0; i < 6; i++) {
          const f0 = 1 - i * 0.07,
            f1 = 1 - (i + 1) * 0.07;
          for (let k = 0; k < 4; k++) {
            const p = pts[k],
              q = pts[(k + 1) % 4];
            a.quad([tx + p[0] * f0, i * 0.55, tz + p[1] * f0], [tx + q[0] * f0, i * 0.55, tz + q[1] * f0], [tx + q[0] * f1, (i + 1) * 0.55, tz + q[1] * f1], [tx + p[0] * f1, (i + 1) * 0.55, tz + p[1] * f1], "#141414");
          }
        }
        a.bola(tx, 3.3, tz, 0.55, 0.35, 0.32, "#141414", 0, 0.1);
        const m = a.malla(GEO.MAT.piedraNegra);
        m.name = "piedraNegra";
        raiz.add(m);
        chocar({ circulo: [tx, tz, 1.0], y0: -1, y1: 4 });
        // las ofrendas al pie: flores secas, una copa, figuritas talladas
        const o = A(tx, tz);
        P.flores(o, tx + 1.2, tz + 0.6);
        o.cilindro(tx - 1.0, 0, tz + 0.9, 0.08, 0.1, 0.18, 6, "#8A6A2A");
        o.caja(tx + 0.4, 0, tz + 1.2, 0.12, 0.28, 0.1, "#7A5A3A");
        o.caja(tx - 0.4, 0, tz + 1.25, 0.1, 0.22, 0.1, "#8A6A48");
      }
      anclas.ting = [tx, tz + 9.5];
      anclas.piedra_negra = [tx, tz + 1.8];
      // el pozo de Gudrun, la campana y el tablón de avisos
      P.pozo(A(...LUGAR.pozo), ...LUGAR.pozo);
      chocar({ circulo: [...LUGAR.pozo, 1.5], y0: -1, y1: 3 });
      anclas.pozo = [LUGAR.pozo[0], LUGAR.pozo[1] + 2.4];
      P.campana(A(...LUGAR.campana), ...LUGAR.campana, 0.6);
      chocar({ circulo: [...LUGAR.campana, 0.9], y0: -1, y1: 4 });
      anclas.campana = [LUGAR.campana[0] + 1.2, LUGAR.campana[1] + 1.6];
      P.tablon(A(...LUGAR.tablon), ...LUGAR.tablon, 0.7);
      chocar({ obb: [...LUGAR.tablon, 1.3, 0.3, 0.7], y0: -1, y1: 3 });
      anclas.tablon_avisos = [LUGAR.tablon[0] + 0.9, LUGAR.tablon[1] + 1.3];
      // estandartes del Ciervo junto al Ting
      for (const s of [-1, 1]) {
        P.estandarte(A(tx + s * 12, tz - 2), tx + s * 12, tz - 2, 5.5, s > 0 ? PI : 0);
        chocar({ circulo: [tx + s * 12, tz - 2, 0.25], y0: -1, y1: 6 });
      }
      // las camas de hongos de Ragna, a la sombra de las raíces
      const [hx, hz] = LUGAR.camas_hongos;
      for (let i = 0; i < 4; i++) {
        const x = hx + (i % 2) * 3.2 - 1.6,
          z = hz + Math.floor(i / 2) * 2.4 - 1.2,
          a = A(x, z);
        a.caja(x, 0, z, 2.6, 0.3, 1.6, "#3A2A1E");
        a.caja(x, 0.3, z, 2.4, 0.05, 1.4, "#2E241C");
        for (let k = 0; k < 9; k++) {
          const xx = x - 1.0 + (k % 3) * 1.0,
            zz = z - 0.5 + Math.floor(k / 3) * 0.5;
          a.cilindro(xx, 0.33, zz, 0.04, 0.04, 0.12, 5, "#E0D4C0");
          a.cilindro(xx, 0.45, zz, 0.16, 0.03, 0.08, 7, k % 2 ? "#C8903A" : "#E8B04A");
        }
        chocar({ obb: [x, z, 1.3, 0.8, 0], y0: -1, y1: 0.6 });
      }
      anclas.camas_hongos = [hx, hz + 3.2];
      // el Mercado de los Toldos: alrededor del Ting y por los lados sur y este del tronco, bajo la copa
      const lugaresToldo = [];
      for (let i = 0; i < 26; i++) {
        const an = PI * (-0.15 + (i / 26) * 1.35) + (r() - 0.5) * 0.05; // de este (-0.15π) hasta el sudoeste
        const rr = i % 2 ? 37 : 30;
        const [x, z] = polar(an, rr);
        if (Math.hypot(x - tx, z - tz) < 14) continue;
        if (Math.abs(x) < 4.5 && z > 0) continue; // el camino del sur queda libre
        if (Math.hypot(x - LUGAR.pozo[0], z - LUGAR.pozo[1]) < 5) continue;
        lugaresToldo.push([x, z, -an - PI / 2]);
      }
      lugaresToldo.forEach(([x, z, ry], i) => {
        const merc = P.MERC[i % P.MERC.length];
        P.toldo(A(x, z), x, z, ry, P.C.lona[i % P.C.lona.length], merc);
        chocar({ obb: [x, z, 1.4, 1.0, ry], y0: -1, y1: 2.5 });
        // dónde se para el que vende (detrás del mostrador) y dónde el que compra
        const c = Math.cos(ry),
          s = Math.sin(ry);
        puestos.push({ tipo: "vendedor", x: x - 0.2 * s, z: z - 0.2 * c, mira: ry, merc });
        anclas["toldo" + i] = [x + 1.9 * s, z + 1.9 * c];
      });
      // barriles, canastos y cajones sueltos entre los toldos
      for (let i = 0; i < 40; i++) {
        const an = PI * (-0.2 + r() * 1.45),
          rr = 26 + r() * 16;
        const [x, z] = polar(an, rr);
        if (Math.hypot(x - tx, z - tz) < 12 || lugaresToldo.some((l) => Math.hypot(l[0] - x, l[1] - z) < 2.6) || (Math.abs(x) < 4.5 && z > 0)) continue;
        const k = i % 4;
        if (k === 0) P.barril(A(x, z), x, z);
        else if (k === 1) P.cajon(A(x, z), x, z, 1, 0, r() * 3);
        else if (k === 2) P.canasto(A(x, z), x, z, ["#E8B04A", "#C86A4A", "#5E7A3A"][i % 3]);
        else P.lena(A(x, z), x, z, r() * 3, 4);
        chocar({ circulo: [x, z, 0.5], y0: -1, y1: 1.2 });
      }
      // faroles alrededor de la plaza
      for (let i = 0; i < 20; i++) {
        const an = (i / 20) * TAU + 0.08,
          [x, z] = polar(an, 47);
        if (Math.abs(x) < 4 && z > 0) continue;
        luz(P.farol(A(x, z), B(x, z), x, z, 3.4, -an + PI), 1);
        chocar({ circulo: [x, z, 0.25], y0: -1, y1: 4 });
      }
    }

    // ---------- los edificios ----------
    // poner(ficha, x, z, ry, semilla, extra): crea la casa, la ubica y suma sus choques, superficies y luces
    function poner(ficha, x, z, ry, sem, extra = {}) {
      const c = CASAS.crear(ficha, sem);
      c.grupo.position.set(x, 0, z);
      c.grupo.rotation.y = ry;
      c.grupo.updateMatrixWorld(true);
      raiz.add(c.grupo);
      const cs = Math.cos(ry),
        sn = Math.sin(ry);
      const W = (lx, lz) => [x + lx * cs + lz * sn, z - lx * sn + lz * cs];
      for (const ch of c.choques) {
        if (ch.caja) {
          const [cx, cz] = W(ch.caja[0], ch.caja[1]);
          chocar({ obb: [cx, cz, ch.caja[2], ch.caja[3], ry], y0: -1, y1: 9 });
        } else if (ch.seg) {
          const [ax, az] = W(ch.seg[0], ch.seg[1]),
            [bx, bz] = W(ch.seg[2], ch.seg[3]);
          chocar({ seg: [ax, az, bx, bz, ch.seg[4]], y0: -1, y1: 9 });
        } else if (ch.circulo) {
          const [cx, cz] = W(ch.circulo[0], ch.circulo[1]);
          chocar({ circulo: [cx, cz, ch.circulo[2]], y0: -1, y1: 3 });
        }
      }
      for (const s of c.superficies) {
        const pts = s.pts.map(([lx, lz]) => W(lx, lz));
        if (s.rampa) {
          // los escalones de la puerta: de la altura del piso (adentro) a 0 (afuera)
          const [ya, yb] = s.rampa;
          supQuad([...pts[0], ya], [...pts[1], ya], [...pts[2], yb], [...pts[3], yb], { casa: true });
        } else supQuad([...pts[0], s.y], [...pts[1], s.y], [...pts[2], s.y], [...pts[3], s.y], { casa: true });
      }
      for (const l of c.luces) {
        const [lx, lz] = W(l[0], l[2]);
        luces.push({ x: lx, y: l[1], z: lz, f: 0.5, tipo: "puerta" });
      }
      for (const h of c.humo) {
        const [hx, hz] = W(h[0], h[2]);
        humos.push([hx, h[1], hz]);
      }
      const ed = Object.assign({ casa: c, x, z, ry, W, nombre: extra.nombre || null }, extra);
      if (c.ficha.entrable) {
        // la zona de adentro (para la cámara de interior) y dónde aparece uno al entrar
        ed.adentro = { x, z, mx: c.medidas.W / 2 - 0.2, mz: c.medidas.D / 2 - 0.2, ry };
        ed.puertaMundo = W(c.puerta.x, c.puerta.z);
      }
      edificios.push(ed);
      return ed;
    }
    // un armador en el marco de un edificio (los muebles de adentro y lo del patio)
    function enMarco(ed, fn, brillo) {
      const a = GEO.armador(Math.floor(ed.x * 7 + ed.z * 3) + 5),
        b = GEO.armador(Math.floor(ed.x * 7 + ed.z * 3) + 6);
      a.con({ x: ed.x, z: ed.z, ry: ed.ry }, () => b.con({ x: ed.x, z: ed.z, ry: ed.ry }, () => fn(a, b)));
      const m = a.malla(),
        mb = b.malla(brillo || GEO.MAT.brillo);
      if (m) raiz.add(m);
      if (mb) {
        mb.castShadow = false;
        raiz.add(mb);
      }
      return { m, mb };
    }
    const haciaPlaza = (x, z) => Math.atan2(-x, -z); // ry para que el frente (+z local) mire al centro
    const L2W = (ed, lx, lz) => ed.W(lx, lz);
    const L3 = (ed, lx, y, lz) => {
      const [x, z] = ed.W(lx, lz);
      return [x, y, z];
    };
    const chocarL = (ed, lx, lz, r, y1 = 2) => {
      const [x, z] = L2W(ed, lx, lz);
      chocar({ circulo: [x, z, r], y0: -1, y1 });
    };
    const chocarCaja = (ed, lx, lz, mx, mz, y1 = 2) => {
      const [x, z] = L2W(ed, lx, lz);
      chocar({ obb: [x, z, mx, mz, ed.ry], y0: -1, y1 });
    };
    const puesto = (ed, id, lx, lz, mira = 0, extra) => {
      const [x, z] = L2W(ed, lx, lz);
      puestos.push(Object.assign({ id, x, z, mira: ed.ry + mira, edificio: ed.nombre }, extra || {}));
    };

    // ----- la Casa de las Lindes (sudoeste): piedra antigua abajo, madera arriba, techo azul gris, patio con la losa -----
    {
      const [x, z] = LUGAR.lindes;
      const ry = haciaPlaza(x, z) + 0.15;
      const ed = poner({
        ancho: 16, fondo: 10, pisos: 2, altoPiso: 3.2, zocalo: 0.7, pared: "mixta", colorPiedra: "#6E726C", colorPared: "#4A3628", colorPared2: "#4A3628",
        techo: { tipo: "dosAguas", pendiente: 1.15, alero: 0.8, color: "#4A5868", musgo: 0.35 }, buhardillas: 3, chimeneas: [{ x: -5.5, z: -2 }, { x: 4.8, z: -2.5 }],
        ventanas: { frente: 4, atras: 3, lados: 2, ancho: 0.8, alto: 1.0 }, puerta: { pos: 0.2, ancho: 1.5, alto: 2.5, runa: "othala" }, postigos: true, colorPostigo: "#3E4E5A",
        dragones: true, porche: null, anexo: null, lena: false, entrable: true,
      }, x, z, ry, 9101, { nombre: "lindes", rig: "lindes" });
      // el ala del frente (vieja, de piedra), a la izquierda
      const ala = CASAS.crear({ ancho: 6, fondo: 7, pisos: 1, altoPiso: 3.4, zocalo: 0.7, pared: "piedra", colorPiedra: "#6A6E68", techo: { tipo: "dosAguas", pendiente: 1.2, alero: 0.6, color: "#46525E", musgo: 0.5 }, chimeneas: [], buhardillas: 0, ventanas: { frente: 1, atras: 0, lados: 1 }, puerta: { pos: 0, runa: "ingwaz" }, porche: null, anexo: null, lena: false }, 9103);
      ala.grupo.position.set(...[L2W(ed, -4.6, 7.5)].map(([a, b]) => [a, 0, b])[0]);
      ala.grupo.rotation.y = ry;
      raiz.add(ala.grupo);
      chocarCaja(ed, -4.6, 7.5, 3.1, 3.6, 9);
      ed.extraPartes = ala.partes;
      // el patio: lajas, la losa rúnica más vieja que la casa, murito bajo, escalones, bancos, el anteojo de Svanhild
      const losa = enMarco(ed, (a, b) => {
        const r = GEO.azar(77);
        for (let i = 0; i < 90; i++) {
          const lx = 1.5 + (r() - 0.5) * 11,
            lz = 5.5 + 2 + r() * 8;
          a.prisma([[lx - 0.5, lz - 0.45], [lx + 0.5, lz - 0.5], [lx + 0.55, lz + 0.45], [lx - 0.45, lz + 0.5]].reverse(), -0.02, 0.06, GEO.aclarar("#7A7C76", (r() - 0.5) * 0.25), GEO.aclarar("#8A8A82", (r() - 0.5) * 0.2));
        }
        // murito bajo del patio
        for (const [ax, az, bx, bz] of [[-7.5, 15.5, 9, 15.5], [9, 6, 9, 15.5]]) {
          const l = Math.hypot(bx - ax, bz - az),
            n = Math.round(l / 0.55);
          for (let k = 0; k < n; k++) {
            if (az === 15.5 && Math.abs(ax + ((bx - ax) * (k + 0.5)) / n - 1.5) < 1.6) continue; // la entrada
            a.caja(ax + ((bx - ax) * (k + 0.5)) / n, 0, az + ((bz - az) * (k + 0.5)) / n, az === bz ? 0.52 : 0.5, 0.75 + (k % 2) * 0.06, az === bz ? 0.5 : 0.52, GEO.aclarar("#6E726C", (k % 3) * 0.06 - 0.05));
          }
        }
        // la losa: piedra más vieja, con los surcos rúnicos (se encienden con la huella del guardián)
        a.caja(1.5, 0, 10.5, 3.4, 0.22, 2.4, "#8A8A82");
        a.caja(1.5, 0.22, 10.5, 3.0, 0.04, 2.0, "#6E726C");
        for (const s of [-1, 1]) {
          P.estandarte(a, 1.5 + s * 2.6, 8.6, 3.2, s > 0 ? PI : 0);
          a.cilindro(1.5 + s * 2.2, 0, 12.6, 0.14, 0.12, 1.0, 6, "#2E2E30");
          a.cilindro(1.5 + s * 2.2, 1.0, 12.6, 0.3, 0.38, 0.22, 8, "#2E2E30");
          b.bola(1.5 + s * 2.2, 1.3, 12.6, 0.26, 0.26, 0.26, "#FFB050", 0, 0.3);
        }
        P.banco(a, -4.5, 9.5, PI / 2, 2.0);
        P.banco(a, 7.5, 10, -PI / 2, 2.0);
        // el anteojo de Svanhild sobre su trípode
        a.con({ x: 6.5, z: 13.2 }, () => {
          for (let k = 0; k < 3; k++) a.palo([0, 1.3, 0], [Math.cos(k * 2.1) * 0.5, 0, Math.sin(k * 2.1) * 0.5], 0.03, "#3A2A1E", 4);
          a.palo([-0.3, 1.25, 0.2], [0.5, 1.75, -0.4], 0.07, "#8A6A2A", 6, 0.05);
        });
      });
      // los surcos de la losa (azul; ciudad.js los enciende con H.tiene("huella_patio"))
      const surcos = enMarco(ed, (a, b) => {
        for (let k = 0; k < 5; k++) {
          const tr = FUTHARK.T[["algiz", "othala", "ingwaz", "dagaz", "raidho"][k]];
          b.con({ x: 0.3 + k * 0.6, y: 0.27, z: 10.5, rx: -PI / 2 }, () => tr.forEach((s) => P.trazo(b, s, 0.55, P.C.runico, 0.03)));
        }
      }, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.25 }));
      ed.surcos = surcos.mb && surcos.mb.material;
      luz(L3(ed, -0.7, 1.3, 12.6), 1, "brasero");
      luz(L3(ed, 3.7, 1.3, 12.6), 1, "brasero");
      chocarCaja(ed, 1.5, 10.5, 1.7, 1.2, 0.3);
      chocarCaja(ed, -4.5, 9.5, 0.3, 1.0, 0.6);
      chocarCaja(ed, 7.5, 10, 0.3, 1.0, 0.6);
      // los muros del patio
      {
        const [a0x, a0z] = L2W(ed, -7.5, 15.5),
          [a1x, a1z] = L2W(ed, -0.3, 15.5),
          [a2x, a2z] = L2W(ed, 3.3, 15.5),
          [a3x, a3z] = L2W(ed, 9, 15.5),
          [a4x, a4z] = L2W(ed, 9, 6);
        chocar({ seg: [a0x, a0z, a1x, a1z, 0.3], y0: -1, y1: 1 });
        chocar({ seg: [a2x, a2z, a3x, a3z, 0.3], y0: -1, y1: 1 });
        chocar({ seg: [a3x, a3z, a4x, a4z, 0.3], y0: -1, y1: 1 });
      }
      // adentro: la mesa de examen, la gran mesa de mapas, estanterías, la vitrina de instrumentos, el hogar, runas
      enMarco(ed, (a, b) => {
        const y = 0.7;
        a.con({ y }, () => {
          P.mesa(a, 0.5, -0.6, 0, 3.6, 1.8, 0);
          // los mapas sobre la mesa
          const r = GEO.azar(5);
          for (let k = 0; k < 5; k++) a.con({ x: -0.8 + k * 0.62, y: 0.79, z: -0.6 + (r() - 0.5) * 0.6, ry: (r() - 0.5) * 0.6 }, () => a.caja(0, 0, 0, 0.6, 0.01, 0.45, k % 2 ? "#E6DCC8" : "#D8C8A8"));
          a.cilindro(1.6, 0.79, -0.2, 0.05, 0.05, 0.22, 6, "#C8B8A0");
          // la mesa de examen junto a la ventana (el fragmento de asta va encima: ciudad.js)
          P.mesa(a, 4.6, 2.2, 0, 1.8, 0.9, 0);
          // estanterías del fondo con rollos y libros
          for (const ex of [-5.5, -2.5]) {
            a.caja(ex, 0, -4.4, 2.6, 2.6, 0.5, "#3E2C20");
            for (let f = 0; f < 4; f++) {
              a.caja(ex, 0.1 + f * 0.62, -4.25, 2.5, 0.05, 0.4, "#5A4230");
              for (let k = 0; k < 7; k++) {
                if ((k + f) % 4 === 3) a.con({ x: ex - 1.0 + k * 0.32, y: 0.3 + f * 0.62, z: -4.2, rz: PI / 2 }, () => a.cilindro(0, -0.1, 0, 0.06, 0.06, 0.25, 6, "#E6DCC8"));
                else a.caja(ex - 1.0 + k * 0.32, 0.15 + f * 0.62, -4.25, 0.18, 0.35 + (k % 3) * 0.06, 0.3, ["#5E2C20", "#3E4E5A", "#4E5C32", "#6E5A3A", "#3A2A1E"][(k + f) % 5]);
              }
            }
          }
          // la vitrina con la esfera armilar, un astrolabio y el sextante
          a.caja(2.8, 0, -4.3, 2.2, 0.9, 0.6, "#3E2C20");
          a.caja(2.8, 0.9, -4.3, 2.2, 1.0, 0.04, "#5A6A70");
          a.con({ x: 2.4, y: 1.25, z: -4.3 }, () => {
            for (let k = 0; k < 3; k++) a.con({ rx: (k * PI) / 3, rz: k * 0.6 }, () => {
              for (let i = 0; i < 10; i++) {
                const a0 = (i / 10) * TAU,
                  a1 = ((i + 1) / 10) * TAU;
                a.palo([Math.cos(a0) * 0.25, Math.sin(a0) * 0.25, 0], [Math.cos(a1) * 0.25, Math.sin(a1) * 0.25, 0], 0.012, "#C8A04A", 3);
              }
            });
          });
          a.con({ x: 3.3, y: 1.0, z: -4.3, rx: PI / 2 }, () => a.cilindro(0, 0, 0, 0.18, 0.18, 0.03, 10, "#B89040"));
          // el hogar y su fuego
          a.caja(-7.3, 0, 1.2, 0.7, 1.4, 2.0, "#5E625E");
          a.caja(-7.3, 1.4, 1.2, 0.9, 0.2, 2.3, "#4A4E4A");
          b.bola(-7.0, 0.35, 1.2, 0.35, 0.3, 0.55, "#FF9A4A", 0, 0.3);
          // mapas secándose colgados de una soga
          a.palo([-6, 2.4, -2], [-1, 2.4, -2], 0.015, "#C8A86A", 3);
          for (let k = 0; k < 5; k++) a.caja(-5.5 + k * 1.05, 1.8, -2, 0.75, 0.6, 0.01, k % 2 ? "#E6DCC8" : "#D8C8A8");
          // piedritas con runas en una repisa (lo antiguo: azul tenue)
          a.caja(6.5, 1.2, -4.6, 1.6, 0.06, 0.4, "#5A4230");
          for (let k = 0; k < 3; k++) {
            a.bola(6.0 + k * 0.5, 1.36, -4.55, 0.16, 0.18, 0.1, "#7A7C76", 0, 0.2);
            b.caja(6.0 + k * 0.5, 1.33, -4.44, 0.04, 0.16, 0.01, P.C.runico);
          }
          P.banco(a, 0.5, 0.8, 0, 2.6);
          P.banco(a, 0.5, -2.0, 0, 2.6);
          a.caja(-3.2, 0, 3.6, 1.4, 0.6, 0.7, "#5E3A26"); // arcón
        });
      }, GEO.MAT.brillo);
      chocarCaja(ed, 0.5, -0.6, 1.9, 1.0);
      chocarCaja(ed, 4.6, 2.2, 1.0, 0.5);
      chocarCaja(ed, -4, -4.4, 2.9, 0.4);
      chocarCaja(ed, 2.8, -4.3, 1.2, 0.4);
      chocarCaja(ed, -7.2, 1.2, 0.5, 1.2);
      chocarCaja(ed, 0.5, 0.8, 1.3, 0.25, 0.6);
      chocarCaja(ed, 0.5, -2.0, 1.3, 0.25, 0.6);
      chocarCaja(ed, -3.2, 3.6, 0.7, 0.35, 0.8);
      anclas.losa = L2W(ed, 1.5, 12.3);
      anclas.mesa = L2W(ed, 4.6, 3.2);
      anclas.svanhild_casa = L2W(ed, 3.4, 1.6);
      anclas.svanhild_patio = L2W(ed, -0.6, 11.8);
      anclas.lindes_puerta = ed.puertaMundo;
      anclas.lindes_hogar = L2W(ed, -6.2, 1.2);
      anclas.lindes_estantes = L2W(ed, -4, -3.4);
      anclas.lindes_vitrina = L2W(ed, 2.8, -3.4);
      anclas.lindes_mapas = L2W(ed, 0.5, 0.6);
      ed.mesaExamen = L2W(ed, 4.6, 2.2);
      zonas.push({ caja: [...L2W(ed, 1.5, 10.8), 9.5, 5.4, ry], rig: "patio", yaw: ry, prioridad: 3 });
    }

    // ----- el Hongo Dorado (sudeste, mirando a la plaza): la casa más grande, dos pisos, porche con mesas -----
    {
      const [x, z] = LUGAR.hongo;
      const ry = haciaPlaza(x, z);
      const ed = poner({
        ancho: 22, fondo: 12, pisos: 2, altoPiso: 3.1, zocalo: 0.5, pared: "tablasH", colorPared: "#5A3E2C", colorPared2: "#4E3A2A",
        techo: { tipo: "dosAguas", pendiente: 1.05, alero: 0.9, color: "#4C4844", musgo: 0.5 }, buhardillas: 3, chimeneas: [{ x: -6, z: -2 }, { x: 6.5, z: -2.5 }],
        ventanas: { frente: 5, atras: 3, lados: 2, ancho: 0.85, alto: 1.0 }, puerta: { pos: 0, ancho: 1.8, alto: 2.4, runa: "jera" }, colorPostigo: "#7A3A2A",
        dragones: true, porche: { fondo: 3.2, ancho: 20 }, anexo: { lado: 1, ancho: 3, fondo: 6 }, cartel: "hongo", lena: false, entrable: true,
      }, x, z, ry, 7707, { nombre: "hongo_dorado", rig: "taberna" });
      // las mesas del porche y la gente que toma afuera
      enMarco(ed, (a) => {
        for (const lx of [-6.5, 6.5]) {
          P.mesa(a, lx, 7.6, 0, 2.4, 0.9, 5, 0.5);
          P.banco(a, lx, 7.0, 0, 2.2);
          P.banco(a, lx, 8.2, 0, 2.2);
        }
        for (let k = 0; k < 4; k++) P.barril(a, 11.5 + (k % 2) * 0.8, 4 + Math.floor(k / 2) * 0.9, 0.9);
      });
      for (const lx of [-6.5, 6.5]) chocarCaja(ed, lx, 7.6, 1.3, 1.0, 1);
      chocarCaja(ed, 11.9, 4.45, 0.8, 0.9, 1.2);
      // adentro: el fogón largo en el medio, la barra con barriles, mesas largas, el rincón del skald, la puerta de piedra
      enMarco(ed, (a, b) => {
        a.con({ y: 0.5 }, () => {
          // el fogón
          a.caja(0, 0, -0.5, 5, 0.35, 1.6, "#5E625E");
          a.caja(0, 0.35, -0.5, 4.6, 0.04, 1.2, "#2E2620");
          b.bola(-1.2, 0.5, -0.5, 0.6, 0.35, 0.5, "#FF9A4A", 0, 0.3);
          b.bola(1.0, 0.5, -0.5, 0.7, 0.4, 0.5, "#FFB050", 0, 0.3);
          b.bola(0, 0.62, -0.5, 0.35, 0.4, 0.3, "#FFD98A", 0, 0.3);
          // la barra
          a.caja(-5, 0, -3.8, 7, 1.1, 0.8, "#4A3426");
          a.caja(-5, 1.1, -3.8, 7.2, 0.08, 0.95, "#8A6A48");
          for (let k = 0; k < 6; k++) a.cilindro(-7.8 + k * 1.1, 1.18, -3.7, 0.07, 0.08, 0.18, 6, "#8A6A48");
          a.caja(-5, 0, -5.6, 7, 2.6, 0.4, "#3E2C20");
          for (let f = 0; f < 3; f++) for (let k = 0; k < 10; k++) a.cilindro(-8 + k * 0.65, 0.3 + f * 0.8, -5.45, 0.08, 0.09, 0.2, 6, ["#8A6A48", "#C8B8A0", "#6E5A3A"][(k + f) % 3]);
          for (let k = 0; k < 5; k++) P.barril(a, -9.6, -4.8 + k * 0.85, 0.85, 0, true);
          // mesas largas
          for (const [lx, lz] of [[-5, 2.2], [4.5, 2.2], [5.5, -3.2]]) {
            P.mesa(a, lx, lz, 0, 4.2, 1.0, 7);
            P.banco(a, lx, lz - 0.85, 0, 4.0);
            P.banco(a, lx, lz + 0.85, 0, 4.0);
          }
          // el rincón del skald con su kantele
          a.caja(8.8, 0, 3.8, 3, 0.3, 3, "#5A4230");
          a.caja(8.6, 0.3, 3.4, 0.5, 0.06, 0.25, "#8A6A48");
          // la escalera al piso de arriba (los cuartos)
          for (let k = 0; k < 9; k++) a.caja(9.7, k * 0.33, -2.8 + k * 0.38, 1.3, 0.33, 0.4, "#5E4430");
          // la puerta de piedra detrás de los barriles (la que Ulf nunca abrió)
          a.caja(-10.3, 0, 3.6, 0.2, 2.6, 1.8, "#6A6A62");
          a.caja(-10.2, 0, 3.6, 0.15, 2.3, 1.4, "#5A5A54");
          for (let k = 0; k < 3; k++) P.barril(a, -9.4, 2.8 + k * 0.8, 0.9);
          // la trampilla de la bodega, con su argolla
          a.caja(-7.6, 0.0, 1.0, 1.3, 0.04, 1.0, "#4A3426");
          for (let k = 0; k < 4; k++) a.caja(-7.6 - 0.48 + k * 0.32, 0.04, 1.0, 0.28, 0.02, 0.96, k % 2 ? "#5E4430" : "#54402E");
          a.con({ x: -7.6, y: 0.07, z: 1.2, rx: PI / 2 }, () => a.cilindro(0, -0.01, 0, 0.12, 0.12, 0.02, 8, "#2E2E30"));
          // faroles colgados del techo
          for (const lx of [-6, 0, 6]) {
            a.palo([lx, 3.0, 0.5], [lx, 2.3, 0.5], 0.02, "#2E2E30", 3);
            b.caja(lx, 2.0, 0.5, 0.3, 0.32, 0.3, P.C.vidrio);
          }
        });
      }, GEO.MAT.brillo);
      chocarCaja(ed, 0, -0.5, 2.5, 0.8, 1);
      chocarCaja(ed, -5, -3.8, 3.5, 0.4, 1.6);
      chocarCaja(ed, -5, -5.6, 3.5, 0.3, 3);
      for (const [lx, lz] of [[-5, 2.2], [4.5, 2.2], [5.5, -3.2]]) chocarCaja(ed, lx, lz, 2.1, 1.1, 1.2);
      chocarCaja(ed, 8.8, 3.8, 1.5, 1.5, 0.5);
      chocarCaja(ed, 9.7, -1.2, 0.7, 1.8, 3);
      chocarCaja(ed, -9.6, -3, 0.5, 2.2, 1.2);
      chocarCaja(ed, -9.6, 3.6, 0.6, 1.4, 2);
      for (const lx of [-6, 0, 6]) luz(L3(ed, lx, 2.5, 0.5), 0.8, "adentro");
      fuegos.push(L3(ed, 0, 1.1, -0.5));
      puesto(ed, "ulf", -5, -4.7, 0);
      puesto(ed, "tyra", 2, 4.2, PI, { noche: true });
      puesto(ed, "solve", 8.8, 3.8, PI / 2, { noche: true });
      anclas.hongo_dorado = ed.puertaMundo;
      anclas.hongo_barra = L2W(ed, -5, -2.8);
      anclas.hongo_fogon = L2W(ed, 0, 0.9);
      anclas.hongo_puerta_piedra = L2W(ed, -9.2, 3.6);
      anclas.hongo_trampilla = L2W(ed, -7.6, 1.0);
      anclas.hongo_cama = L2W(ed, 9.7, 0.6);
    }

    // ----- la herrería de Ása (oeste): casa de piedra, galpón abierto con la chimenea cónica de la forja -----
    {
      const [x, z] = LUGAR.herreria;
      const ry = haciaPlaza(x, z);
      const ed = poner({ ancho: 8, fondo: 6.5, pisos: 1, zocalo: 0.4, pared: "piedra", colorPiedra: "#62665E", techo: { tipo: "dosAguas", pendiente: 1.0, color: "#454A52", musgo: 0.2 }, chimeneas: [{ x: 2, z: -1 }], ventanas: { frente: 1, atras: 1, lados: 1 }, puerta: { pos: -0.2, runa: "tiwaz" }, cartel: "yunque", porche: null, anexo: null, lena: true, buhardillas: 0 }, x - 0, z, ry, 3301, { nombre: "herreria" });
      // el galpón abierto al costado, con la forja, el yunque y el armero
      const g = { x: 0, z: 0 };
      enMarco(ed, (a, b) => {
        const ox = 9.5;
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.caja(ox + sx * 4.5, 0, sz * 3.4, 0.3, 3.6, 0.3, "#3A2A1E");
        P.yunque(a, ox - 1.0, 1.3, 0.3);
        P.armero(a, ox + 3.4, 1.0, -PI / 2, true, b);
        P.barril(a, ox - 3, 2.4);
        a.cilindro(ox - 3, 0.9, 2.4, 0.36, 0.36, 0.02, 8, "#2A3A40");
        P.cajon(a, ox + 2, 2.8, 1.0, 0, 0.2, "#5E4430");
        for (let k = 0; k < 3; k++) a.bola(ox + 2 + (k - 1) * 0.2, 0.62, 2.8, 0.12, 0.1, 0.12, "#5A4A44", 0, 0.3); // el mineral que queda
        // la piedra de afilar
        a.con({ x: ox + 1.8, z: -2.5 }, () => {
          a.caja(0, 0, 0, 1.0, 0.6, 0.4, "#4A3426");
          a.con({ y: 0.95, rx: PI / 2 }, () => a.cilindro(0, -0.1, 0, 0.42, 0.42, 0.2, 10, "#8A8A82"));
        });
      });
      // el techo del galpón aparte: se esconde cuando Eromash entra abajo (para ver la forja y a Ása)
      {
        const tg = GEO.armador(3302),
          ox = 9.5;
        tg.con({ x: ed.x, z: ed.z, ry: ed.ry }, () => {
          tg.losa([ox - 5, 3.6, 4], [ox + 5, 3.6, 4], [ox + 5, 4.8, 0], [ox - 5, 4.8, 0], 0.12, "#454A52", "#2E2E30");
          tg.losa([ox - 5, 4.8, 0], [ox + 5, 4.8, 0], [ox + 5, 3.6, -4], [ox - 5, 3.6, -4], 0.12, "#4A4E56", "#2E2E30");
        });
        const mt = tg.malla();
        mt.name = "techo_galpon";
        raiz.add(mt);
        const [gx, gz] = L2W(ed, ox, 0);
        techosAbiertos.push({ malla: mt, x: gx, z: gz, mx: 5.5, mz: 4.5, ry });
      }
      const [fx, fz] = L2W(ed, 9.5 - 1.2, -2.2);
      const fp = P.forja(A(fx, fz), B(fx, fz), fx, fz, ry);
      luz(fp, 1.5, "forja");
      fuegos.push(fp);
      humos.push([fx, 10.5, fz]);
      chocar({ circulo: [fx, fz, 1.8], y0: -1, y1: 10 });
      {
        const c = Math.cos(ry),
          s = Math.sin(ry);
        chocar({ obb: [fx + 1.55 * s, fz + 1.55 * c, 1.25, 0.6, ry], y0: -1, y1: 1.1 });
      }
      chocarL(ed, 8.5, 1.3, 0.5, 1);
      chocarCaja(ed, 12.9, 1.0, 0.3, 1.1, 2);
      chocarL(ed, 6.5, 2.4, 0.45, 1);
      chocarCaja(ed, 11.5, 2.8, 0.45, 0.35, 0.7);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) chocarL(ed, 9.5 + sx * 4.5, sz * 3.4, 0.25, 3.6);
      puesto(ed, "asa", 9.5 - 1.0, 2.4, 0);
      anclas.herreria = L2W(ed, 9.5, 4.6);
      anclas.herreria_puerta = L2W(ed, 8.5, 2.6);
      anclas.armero = L2W(ed, 12.2, 1.0);
      zonas.push({ caja: [...L2W(ed, 9.5, 0.5), 6, 5, ry], rig: "oficio", yaw: ry, prioridad: 2 });
    }

    // ----- la carpintería con la grúa (sudoeste, junto al camino del sur) -----
    {
      const [x, z] = LUGAR.carpinteria;
      const ry = PI / 2 + 0.1; // mira a la avenida del sur
      const ed = poner({ ancho: 9, fondo: 6, pisos: 1, zocalo: 0.3, pared: "tablasV", colorPared: "#6A4A32", techo: { tipo: "dosAguas", pendiente: 0.95, color: "#4A4440" }, cartel: "hacha", porche: null, anexo: { lado: -1, ancho: 3, fondo: 5 }, lena: false, buhardillas: 0 }, x - 6, z - 4, ry, 4401, { nombre: "carpinteria" });
      enMarco(ed, (a) => {
        P.grua(a, 3, 8, 0.4);
        P.troncosApilados(a, -3, 10.5, 0.1, 4, 6);
        P.troncosApilados(a, 7, 4, PI / 2 + 0.2, 3, 5);
        P.caballete(a, 2, 4.5, 0, true);
        P.caballete(a, -1.5, 6, 0.3, false);
        P.carro(a, 9, 10, 0.5, "troncos");
        for (let k = 0; k < 6; k++) a.caja(-5 + k * 0.5, 0, 5.5, 0.35, 0.1, 3, "#8A6A48"); // tablas apiladas
        for (let k = 0; k < 5; k++) a.caja(-4.6 + k * 0.4, 0.1, 5.5, 0.35, 0.1, 3, "#7A5A3A");
        a.caja(1, 0, 11.5, 2.4, 0.06, 1.6, "#C8A070"); // aserrín
      });
      chocarL(ed, 3, 8, 1.6, 6);
      chocarCaja(ed, -3, 10.5, 1.6, 3.1, 2.5);
      chocarCaja(ed, 7, 4, 2.6, 1.3, 2);
      chocarCaja(ed, 2, 4.5, 1.1, 0.5, 1.2);
      chocarCaja(ed, -1.5, 6, 1.1, 0.5, 1.0);
      chocarL(ed, 9, 10, 1.4, 2);
      chocarCaja(ed, -3.9, 5.5, 1.5, 1.6, 0.4);
      puesto(ed, "sten", 1.5, 3.4, 0);
      anclas.carpinteria = L2W(ed, 1, 2.5);
    }

    // ----- la cordelería de Folke (oeste): la casita y el largo camino del torno con las sogas tendidas -----
    {
      const [x, z] = LUGAR.cordeleria;
      const ry = PI / 2; // mira al este (al anillo)
      const ed = poner({ ancho: 6, fondo: 5, pisos: 1, zocalo: 0.3, pared: "troncos", colorPared: "#5E4434", techo: { tipo: "cesped", pendiente: 0.9 }, cartel: "soga", porche: { fondo: 1.6 }, anexo: null, buhardillas: 0, lena: false }, x, z + 7, ry, 5501, { nombre: "cordeleria" });
      enMarco(ed, (a) => P.tornoCordelero(a, 5, 0, PI / 2, 16));
      for (let k = 0; k <= 4; k++) chocarL(ed, 5 + (k * 16) / 4, 0, 0.3, 1.2);
      puesto(ed, "folke", 4.4, 1.2, 0);
      anclas.cordeleria = L2W(ed, 4, 2);
    }
    // ----- la curtiembre (sudoeste, contra la empalizada) -----
    {
      const [x, z] = LUGAR.curtiembre;
      const ry = haciaPlaza(x, z);
      const ed = poner({ ancho: 7, fondo: 5, pisos: 1, zocalo: 0.2, pared: "tablasV", colorPared: "#5E5240", techo: { tipo: "dosAguas", color: "#4C4844" }, porche: null, anexo: null, buhardillas: 0 }, x, z - 2, ry, 6601, { nombre: "curtiembre" });
      enMarco(ed, (a) => {
        for (let k = 0; k < 4; k++) P.cubaCurtiembre(a, -3 + k * 2, 5.2, ["#5A4A2A", "#6A3A2A", "#4A4A3A", "#7A5A3A"][k]);
        P.bastidorCuero(a, -2, 8, 0.2);
        P.bastidorCuero(a, 2, 8.2, -0.2);
      });
      for (let k = 0; k < 4; k++) chocarL(ed, -3 + k * 2, 5.2, 1.0, 1);
      chocarCaja(ed, 0, 8.1, 3.2, 0.4, 2.2);
      anclas.curtiembre = L2W(ed, 0, 3.6);
    }
    // ----- la Casa de Sanación (noroeste): casa larga y baja con galería abierta, hierbas colgadas y su jardín -----
    {
      const [x, z] = LUGAR.sanacion;
      const ry = haciaPlaza(x, z);
      const ed = poner({
        ancho: 18, fondo: 7.5, pisos: 1, altoPiso: 3.0, zocalo: 0.45, pared: "tablasV", colorPared: "#6E5A3E", techo: { tipo: "cesped", pendiente: 0.85, alero: 0.7 },
        porche: { fondo: 2.6, ancho: 18 }, chimeneas: [{ x: -6, z: -1 }], ventanas: { frente: 4, atras: 2, lados: 1 }, puerta: { pos: 0, ancho: 1.6, runa: "berkano" }, colorPostigo: "#4E5C32",
        cartel: "hierba", anexo: null, lena: false, buhardillas: 0, entrable: true,
      }, x, z, ry, 8801, { nombre: "sanacion", rig: "sanacion" });
      enMarco(ed, (a, b) => {
        // hierbas colgadas en la galería
        for (let k = 0; k < 16; k++) {
          const lx = -8 + k * 1.05;
          if (Math.abs(lx) < 1) continue;
          a.palo([lx, 2.75, 5.9], [lx, 2.3, 5.9], 0.01, "#C8A86A", 3);
          a.bola(lx, 2.15, 5.9, 0.16, 0.26, 0.16, ["#6A7A3A", "#8A8A4A", "#5E6A3A", "#9A7A5A"][k % 4], 0, 0.3);
        }
        // adentro: camas, el estante de hierbas, la olla en el hogar, la mesa de preparados
        a.con({ y: 0.45 }, () => {
          for (let k = 0; k < 4; k++) {
            const lx = 2.5 + k * 1.7;
            a.caja(lx, 0, -2.2, 1.0, 0.45, 2.1, "#5E4430");
            a.caja(lx, 0.45, -2.2, 0.9, 0.12, 1.9, "#C8C0B0");
            a.caja(lx, 0.57, -2.9, 0.6, 0.12, 0.35, "#E6DCC8");
            a.caja(lx, 0.5, -1.7, 0.92, 0.1, 1.0, k % 2 ? "#5E6A4A" : "#7A3A2A");
          }
          a.caja(-3, 0, -3.5, 3.0, 2.2, 0.5, "#3E2C20");
          for (let f = 0; f < 3; f++) for (let k = 0; k < 8; k++) a.cilindro(-4.2 + k * 0.35, 0.3 + f * 0.7, -3.4, 0.09, 0.1, 0.22, 6, ["#8A6A48", "#5E7A3A", "#C8B8A0", "#9A6A4A"][(k + f) % 4]);
          a.caja(-7.6, 0, -1.0, 0.8, 1.2, 2.0, "#5E625E");
          a.cilindro(-7.0, 0.6, -1.0, 0.45, 0.4, 0.5, 8, "#2E2E30");
          b.bola(-7.0, 0.4, -1.0, 0.4, 0.2, 0.4, "#FF9A4A", 0, 0.3);
          P.mesa(a, -3.5, 1.0, 0, 2.2, 0.9, 4);
          a.cilindro(-3.0, 0.82, 1.0, 0.14, 0.12, 0.14, 7, "#8A8A82"); // el mortero
        });
      }, GEO.MAT.brillo);
      for (let k = 0; k < 4; k++) chocarCaja(ed, 2.5 + k * 1.7, -2.2, 0.5, 1.05, 1);
      chocarCaja(ed, -3, -3.5, 1.5, 0.3, 2.5);
      chocarCaja(ed, -7.4, -1.0, 0.5, 1.0, 1.5);
      chocarCaja(ed, -3.5, 1.0, 1.1, 0.5, 1);
      // el jardín medicinal cercado, al costado
      const [jx, jz] = L2W(ed, -14, 1);
      P.huerta(A(jx, jz), jx, jz, 8, 7, ry, 801);
      chocar({ obb: [jx, jz, 4, 3.5, ry], y0: -1, y1: 1 });
      puesto(ed, "thora", -2.5, 0.2, 0);
      puesto(ed, "sigrun", 3.3, -1.0, -PI / 2);
      puesto(ed, "bror_cama", 2.5, -2.2, 0, { acostado: true });
      anclas.sanacion = ed.puertaMundo;
      anclas.sanacion_camas = L2W(ed, 3.4, -0.6);
    }
    // ----- la Guardia del Roble (junto a la Puerta del Norte) y el patio de práctica -----
    {
      const [x, z] = LUGAR.guardia;
      const ry = PI / 2; // mira al camino del norte
      const ed = poner({ ancho: 13, fondo: 7, pisos: 1, zocalo: 0.4, pared: "troncos", colorPared: "#4E3A2A", techo: { tipo: "dosAguas", pendiente: 1.0, color: "#454A52", musgo: 0.3 }, cartel: "lanza", porche: { fondo: 1.8 }, chimeneas: [{ x: 3, z: -1 }], anexo: null, buhardillas: 0, dragones: true }, x, z, ry, 1201, { nombre: "guardia" });
      P.estandarte(A(x, z), ...L2W(ed, -3, 6.5), 6, 0);
      const [px, pz] = LUGAR.patio_guardia;
      for (const [dx, dz] of [[-3, -4], [0, -5], [3, -3.5], [-2, 2]]) {
        P.munecoPaja(A(px + dx, pz + dz), px + dx, pz + dz, 0.4 * dx);
        chocar({ circulo: [px + dx, pz + dz, 0.4], y0: -1, y1: 2 });
      }
      P.estanteLanzas(A(px - 6, pz + 5), px - 6, pz + 5, PI / 2);
      chocar({ obb: [px - 6, pz + 5, 0.3, 1.0, PI / 2], y0: -1, y1: 2 });
      P.cerca(A(px, pz), px - 7, pz - 8, px + 5, pz - 8);
      P.cerca(A(px, pz), px - 7, pz + 8, px + 5, pz + 8);
      chocar({ seg: [px - 7, pz - 8, px + 5, pz - 8, 0.15], y0: -1, y1: 1 });
      chocar({ seg: [px - 7, pz + 8, px + 5, pz + 8, 0.15], y0: -1, y1: 1 });
      puesto(ed, "hakon", 3, 9.5, 0);
      anclas.guardia = L2W(ed, 0, 6.5);
      anclas.patio_guardia = [px, pz];
      for (let i = 0; i < 4; i++) puestos.push({ tipo: "recluta", x: px + (i % 2 ? 1.5 : -1.5) - 1, z: pz - 2 + Math.floor(i / 2) * 3, mira: PI / 2 + 0.6 });
    }
    // ----- el corral de caravanas (nordeste): carretas varadas con lona, bueyes, cajones con el origen, el fuego -----
    {
      const [x, z] = LUGAR.corral;
      const a = A(x, z),
        b = B(x, z);
      const w = 18,
        d = 12;
      P.cerca(a, x - w, z - d, x + w, z - d);
      P.cerca(a, x - w, z - d, x - w, z + d);
      P.cerca(a, x + w, z - d, x + w, z + d);
      P.cerca(a, x - w, z + d, x - 4, z + d);
      P.cerca(a, x + 4, z + d, x + w, z + d);
      chocar({ seg: [x - w, z - d, x + w, z - d, 0.15], y0: -1, y1: 1.2 });
      chocar({ seg: [x - w, z - d, x - w, z + d, 0.15], y0: -1, y1: 1.2 });
      chocar({ seg: [x + w, z - d, x + w, z + d, 0.15], y0: -1, y1: 1.2 });
      chocar({ seg: [x - w, z + d, x - 4, z + d, 0.15], y0: -1, y1: 1.2 });
      chocar({ seg: [x + 4, z + d, x + w, z + d, 0.15], y0: -1, y1: 1.2 });
      const carretas = [[-11, -6, 0.3], [-5, -7, -0.2], [2, -6.5, 0.1], [9, -7, 0.4], [13, 2, PI / 2 + 0.2], [-13, 3, -PI / 2]];
      carretas.forEach(([dx, dz, ry], i) => {
        P.carro(a, x + dx, z + dz, ry, i % 3 === 2 ? ["#5E4430", "#7A5A3A"][i % 2] : "lona");
        chocar({ obb: [x + dx, z + dz, 0.85, 1.6, ry], y0: -1, y1: 2.2 });
      });
      for (const [dx, dz, ry, c] of [[-6, 4, 1.2, "#6A4A32"], [4, 5, -0.6, "#5A4030"], [10, 7, 2.2, "#7A5A3A"]]) {
        P.buey(a, x + dx, z + dz, ry, c);
        chocar({ circulo: [x + dx, z + dz, 1.0], y0: -1, y1: 1.6 });
      }
      // cajones con pictogramas de origen y el fuego de los que esperan
      for (let k = 0; k < 8; k++) {
        P.cajon(a, x - 2 + (k % 4) * 0.9, z + 1 + Math.floor(k / 4) * 0.7, 0.9, 0, k * 0.3, ["#7A5A3A", "#6A5038"][k % 2]);
      }
      chocar({ obb: [x - 0.6, z + 1.3, 2, 0.9, 0], y0: -1, y1: 1 });
      a.cilindro(x + 2, 0, z - 1, 0.9, 1.0, 0.25, 8, "#5E625E");
      b.bola(x + 2, 0.45, z - 1, 0.5, 0.45, 0.5, "#FF9A4A", 0, 0.35);
      luz([x + 2, 1.0, z - 1], 1.2, "fuego");
      fuegos.push([x + 2, 0.8, z - 1]);
      humos.push([x + 2, 1.4, z - 1]);
      for (const [dx, dz] of [[0.5, -2.4], [3.6, -2.2], [2, 1.0]]) P.banco(a, x + dx, z + dz, Math.atan2(dx - 2, dz + 1), 1.2);
      puestos.push({ id: "grim", x: x - 11, z: z - 3.4, mira: 0 });
      puestos.push({ tipo: "viajero", x: x + 0.8, z: z - 2.6, mira: 0.4 }, { tipo: "viajero", x: x + 3.2, z: z - 2.4, mira: -0.5 });
      anclas.corral = [x, z + d + 2];
      anclas.carreta_grim = [x - 11, z - 3.4];
      anclas.buey = [x - 6, z + 5.5];
    }
    // ----- el mercado de los forasteros (nordeste, entre el Roble y el corral) -----
    {
      const [x, z] = LUGAR.forasteros;
      const r = GEO.azar(1717);
      const MERC_F = ["obsidiana", "hierro", "hueso", "sal", "pieles", "pescado", "sogas", "ceramica"];
      for (let i = 0; i < 14; i++) {
        const fila = Math.floor(i / 5),
          k = i % 5;
        const tx = x - 13 + k * 6.5 + (fila % 2) * 2.5,
          tz = z - 10 + fila * 9;
        const ry = fila % 2 ? PI : 0;
        P.toldo(A(tx, tz), tx, tz, ry, P.C.lona[(i + 2) % P.C.lona.length], MERC_F[i % MERC_F.length], 3.2, 2.2);
        chocar({ obb: [tx, tz, 1.7, 1.2, ry], y0: -1, y1: 2.6 });
        puestos.push({ tipo: "vendedor", x: tx, z: tz - (ry ? -0.2 : 0.2), mira: ry });
      }
      for (let i = 0; i < 24; i++) {
        const tx = x + (r() - 0.5) * 34,
          tz = z + (r() - 0.5) * 28;
        if (aCalle(tx, tz).d < 0.5) continue;
        if ((Math.abs(((tz - (z - 10)) % 9) - 0) < 2.5 && Math.abs(tz - z) < 15) || r() < 0.3) continue;
        if (i % 2) P.cajon(A(tx, tz), tx, tz, 1, 0, r() * 3);
        else P.barril(A(tx, tz), tx, tz);
        chocar({ circulo: [tx, tz, 0.55], y0: -1, y1: 1.2 });
      }
      for (let i = 0; i < 6; i++) {
        const fx = x - 15 + i * 6,
          fz = z - 14.5;
        luz(P.farol(A(fx, fz), B(fx, fz), fx, fz, 3.2, 0), 1);
        chocar({ circulo: [fx, fz, 0.25], y0: -1, y1: 4 });
      }
      zonas.push({ caja: [x, z, 19, 16, 0], rig: "mercado", yaw: 0.65, prioridad: 2 });
      anclas.forasteros = [x, z + 16];
    }
    // ----- las huertas de luz (este, entre las casas y el río) -----
    {
      const [x, z] = LUGAR.huertas;
      let i = 0;
      for (let dz = -28; dz <= 28; dz += 9.5)
        for (const dx of [-8, 8]) {
          if (Math.abs(z + dz) < 5) continue; // el camino del este
          P.huerta(A(x + dx, z + dz), x + dx, z + dz, 12, 8, 0, 300 + i++);
          chocar({ obb: [x + dx, z + dz, 6, 4, 0], y0: -1, y1: 1 });
        }
      // un espantapájaros y unas gallinas
      P.munecoPaja(A(x, z + 14), x, z + 14, 0.3);
      for (let k = 0; k < 7; k++) P.gallina(A(x - 2 + k, z - 12), x - 3 + k * 0.9, z - 13 + (k % 3), k);
      anclas.huertas = [x - 14, z];
    }
    // ----- la casa de guardia y el gran tablero de tablillas (Puerta del Sur, por dentro) -----
    {
      const [x, z] = LUGAR.casa_guardia;
      const ed = poner({ ancho: 7, fondo: 5.5, pisos: 1, zocalo: 0.4, pared: "troncos", colorPared: "#4E3A2A", techo: { tipo: "dosAguas", color: "#454A52" }, porche: { fondo: 1.6 }, cartel: "lanza", anexo: null, buhardillas: 0, chimeneas: [{ x: 1.5, z: -1 }] }, x, z, PI / 2, 1303, { nombre: "casa_guardia" });
      P.estandarte(A(x, z), ...L2W(ed, -2.5, 4.4), 5, 0);
      const [tx, tz] = LUGAR.tablero;
      const a = A(tx, tz),
        b = B(tx, tz);
      a.con({ x: tx, z: tz, ry: -PI / 2 }, () => {
        for (const s of [-1, 1]) a.caja(s * 3.3, 0, 0, 0.3, 3.6, 0.3, "#3A2A1E");
        a.caja(0, 0.6, 0, 6.6, 2.6, 0.18, "#5A4230");
        a.losa([-3.8, 3.7, 0.9], [3.8, 3.7, 0.9], [3.8, 4.1, -0.4], [-3.8, 4.1, -0.4], 0.08, "#4E545C");
        // cientos de tablillas: claras las que volvieron, oscuras las que siguen afuera
        const r = GEO.azar(66);
        for (let f = 0; f < 9; f++)
          for (let k = 0; k < 22; k++) {
            const oscura = r() < 0.12;
            a.caja(-3.0 + k * 0.28, 0.8 + f * 0.27, 0.11, 0.2, 0.2, 0.03, oscura ? "#2A2420" : GEO.aclarar("#C8B48C", (r() - 0.5) * 0.2));
          }
      });
      chocar({ obb: [tx, tz, 3.5, 0.35, -PI / 2], y0: -1, y1: 4 });
      puestos.push({ id: "svend", x: tx - 1.2, z: tz - 1.6, mira: -PI / 2 });
      anclas.gran_tablero = [tx - 1.6, tz];
      anclas.casa_guardia = ed.puertaMundo || L2W(ed, 0, 4);
      anclas.puerta_sur_plaza = [0, R_MURO - 16];
    }
    // ----- el muelle de balsas (afuera, al sudeste, sobre el río) -----
    {
      const [x, z] = LUGAR.muelle;
      const a = A(x, z);
      const ry = -0.75; // a lo largo de la orilla
      a.con({ x, z, ry }, () => {
        for (let k = 0; k < 26; k++) a.caja(-6.5 + k * 0.5, -0.2, 0, 0.46, 0.18, 3.2, k % 2 ? "#6A5038" : "#5E4632");
        for (let k = 0; k < 5; k++) for (const s of [-1, 1]) a.cilindro(-6 + k * 3, -1.4, s * 1.5, 0.15, 0.15, 1.4, 6, "#3A2A1E");
        // el brazo hacia el agua
        for (let k = 0; k < 14; k++) a.caja(2.5, -0.2, 2 + k * 0.5, 2.4, 0.18, 0.46, k % 2 ? "#6A5038" : "#5E4632");
        P.secadero(a, -4, -2.4, 0);
        P.secadero(a, 0, -2.6, 0.1);
        P.barril(a, 5, -0.8, 0.9);
        P.cajon(a, 4, 0.6, 0.9);
      });
      // balsas (una trabada contra troncos flotantes) y botes
      const W2 = (lx, lz) => [x + lx * Math.cos(ry) + lz * Math.sin(ry), z - lx * Math.sin(ry) + lz * Math.cos(ry)];
      P.balsa(a, ...W2(-2, 5), ry);
      P.balsa(a, ...W2(6, 7.5), ry + 0.5);
      for (let k = 0; k < 4; k++) a.con({ x: W2(8 + k * 0.6, 9)[0], y: -0.45, z: W2(8, 9 + k * 0.7)[1], ry: ry + 0.9 + k * 0.2 }, () => a.con({ rx: PI / 2 }, () => a.cilindro(0, -2.5, 0, 0.3, 0.3, 5, 6, "#5E4632", "#A88060")));
      P.bote(a, ...W2(-6, 4.5), ry + PI / 2);
      supQuad([...W2(-6.8, -1.7), -0.02], [...W2(6.3, -1.7), -0.02], [...W2(6.3, 1.7), -0.02], [...W2(-6.8, 1.7), -0.02], { muelle: true });
      supQuad([...W2(1.3, 1.5), -0.02], [...W2(3.7, 1.5), -0.02], [...W2(3.7, 8.8), -0.02], [...W2(1.3, 8.8), -0.02], { muelle: true });
      luz(P.farol(a, B(x, z), ...W2(-6, 1.3), 3.0, ry), 1);
      anclas.muelle = W2(0, 0);
      puestos.push({ tipo: "pescador", x: W2(2.5, 8)[0], z: W2(2.5, 8)[1], mira: ry + PI });
      zonas.push({ caja: [x, z, 12, 10, ry], rig: "muelle", yaw: ry + PI, prioridad: 2 });
    }

    // ---------- las casas de la gente ----------
    // a lo largo de cada calle, a los dos lados, mirando a la calle; cada una con su semilla
    const casas = [];
    const ocupado = [];
    const solapa = (x, z, mx, mz, ang, margen) => {
      // separación de ejes entre dos rectángulos girados
      const ejes = (a) => [[Math.cos(a), -Math.sin(a)], [Math.sin(a), Math.cos(a)]];
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
    // lo que ya está ocupado (edificios con nombre, toldos, el Roble)
    for (const [cx, cz, mx, mz] of RESERVA) ocupado.push({ x: cx, z: cz, mx, mz, ang: 0 });
    ocupado.push({ x: 0, z: 0, mx: 46, mz: 46, ang: PI / 4 });
    const libreCalle = (x, z, mx, mz, ang) => {
      // ningún rincón de la casa sobre una calle
      const c = Math.cos(ang),
        s = Math.sin(ang);
      for (const [lx, lz] of [[-mx, -mz], [mx, -mz], [mx, mz], [-mx, mz], [0, 0], [0, -mz], [-mx, 0], [mx, 0]]) {
        const wx = x + lx * c + lz * s,
          wz = z - lx * s + lz * c;
        if (aCalle(wx, wz).d < 0.4) return false;
        const r = Math.hypot(wx, wz);
        if (r > R_MURO - 8.5 || r < 50) return false;
        if (aRio(wx, wz) < ANCHO_RIO) return false;
      }
      return true;
    };
    let sem = 1000;
    const rC = GEO.azar(4242);
    // se camina cada calle de punta a punta (también las curvas) y se prueba una casa a cada lado
    const enCalle = (c, u) => {
      for (let i = 0; i < c.pts.length - 1; i++) {
        const [ax, az] = c.pts[i],
          [bx, bz] = c.pts[i + 1],
          l = Math.hypot(bx - ax, bz - az);
        if (u <= l || i === c.pts.length - 2) return { x: ax + ((bx - ax) * u) / l, z: az + ((bz - az) * u) / l, ux: (bx - ax) / l, uz: (bz - az) / l };
        u -= l;
      }
    };
    for (const c of CALLES) {
      if (c.tipo === "senda" && c.pts.length > 5) continue; // el camino del muelle
      let largo = 0;
      for (let i = 0; i < c.pts.length - 1; i++) largo += Math.hypot(c.pts[i + 1][0] - c.pts[i][0], c.pts[i + 1][1] - c.pts[i][1]);
      for (const lado of [1, -1]) {
        let u = 1 + rC() * 3;
        while (u < largo - 3) {
          let puesta = false;
          for (const f of [1, 0.75, 0.55]) {
            const ancho = (6 + rC() * 4.5) * f + 1.5 * (1 - f),
              fondo = (5 + rC() * 2.4) * Math.max(0.8, f);
            const m = enCalle(c, u + ancho / 2);
            const nx = -m.uz * lado,
              nz = m.ux * lado; // hacia donde va la casa
            const ret = c.w / 2 + 1.1 + fondo / 2 + rC() * 0.7;
            const x = m.x + nx * ret,
              z = m.z + nz * ret;
            const ry = Math.atan2(-nx, -nz); // el frente mira a la calle
            const mx = ancho / 2 + 0.45,
              mz = fondo / 2 + 0.6;
            if (libreCalle(x, z, mx, mz, ry) && !reservado(x, z, 1.5) && !solapa(x, z, mx, mz, ry, 0.9)) {
              ocupado.push({ x, z, mx, mz, ang: ry });
              casas.push({ x, z, ry, ancho, fondo, sem: sem++ });
              u += ancho + 1.0 + rC() * 1.4;
              puesta = true;
              break;
            }
          }
          if (!puesta) u += 1.2;
        }
      }
    }
    // las casas: algunas se entran (una de cada cinco), con muebles adentro
    casas.forEach((cc, i) => {
      const entrable = i % 5 === 2;
      const ed = poner({ ancho: cc.ancho, fondo: cc.fondo, entrable }, cc.x, cc.z, cc.ry, cc.sem, { nombre: "casa" + i, rig: entrable ? "casa" : null, comun: true });
      if (entrable) amueblar(ed, i);
      // un farol junto a algunas puertas
      if (i % 3 === 0) {
        const [fx, fz] = ed.W(ed.casa.puerta.x + 1.6, ed.casa.medidas.D / 2 + 1.6);
        luz(P.farol(A(fx, fz), B(fx, fz), fx, fz, 2.8, cc.ry + PI / 2), 0.7);
        chocar({ circulo: [fx, fz, 0.22], y0: -1, y1: 3 });
      }
      // patio de atrás: un cerco, una huertita, ropa tendida, un carro o leña
      const k = cc.sem % 6;
      const D = ed.casa.medidas.D,
        Wd = ed.casa.medidas.W;
      const [bx, bz] = ed.W(0, -D / 2 - 2.6);
      if (k === 0 && !solapa(bx, bz, Wd / 2, 2, cc.ry, 0.2)) {
        P.huerta(A(bx, bz), bx, bz, Wd * 0.8, 3.4, cc.ry, cc.sem);
        ocupado.push({ x: bx, z: bz, mx: Wd / 2, mz: 2, ang: cc.ry });
        chocar({ obb: [bx, bz, Wd * 0.4, 1.7, cc.ry], y0: -1, y1: 1 });
      } else if (k === 1) {
        const [p0x, p0z] = ed.W(-Wd / 2 + 0.5, -D / 2 - 2),
          [p1x, p1z] = ed.W(Wd / 2 - 0.5, -D / 2 - 2);
        const a = A(p0x, p0z);
        a.cilindro(p0x, 0, p0z, 0.06, 0.06, 2, 5, "#3A2A1E");
        a.cilindro(p1x, 0, p1z, 0.06, 0.06, 2, 5, "#3A2A1E");
        a.palo([p0x, 1.9, p0z], [p1x, 1.9, p1z], 0.012, "#C8A86A", 3);
        const n = Math.floor(Wd / 1.2);
        for (let q = 0; q < n; q++) {
          const u = (q + 0.5) / n;
          a.con({ x: p0x + (p1x - p0x) * u, y: 1.4, z: p0z + (p1z - p0z) * u, ry: cc.ry }, () => a.caja(0, 0, 0, 0.7, 0.5 + (q % 2) * 0.15, 0.02, ["#C8C0B0", "#7A3A2A", "#5A6A7A", "#B8A47A"][q % 4]));
        }
      } else if (k === 2) {
        P.carro(A(bx, bz), bx, bz, cc.ry + PI / 2 + 0.3, ["#7A5A3A", "lona", null][cc.sem % 3]);
        chocar({ obb: [bx, bz, 0.8, 1.6, cc.ry + PI / 2 + 0.3], y0: -1, y1: 2 });
      } else if (k === 3) {
        for (let q = 0; q < 3; q++) P.barril(A(bx, bz), bx + q * 0.8 - 0.8, bz, 0.9);
        chocar({ obb: [bx, bz, 1.3, 0.5, 0], y0: -1, y1: 1 });
      }
    });
    // árboles entre las casas: el bosque se mete en la ciudad
    {
      const r = GEO.azar(5151);
      let n = 0;
      for (let k = 0; k < 3000 && n < 120; k++) {
        const a = r() * TAU,
          rr = 54 + r() * (R_MURO - 62);
        const [x, z] = polar(a, rr);
        if (aCalle(x, z).d < 2 || reservado(x, z, 2) || solapa(x, z, 1.5, 1.5, 0, 0.5)) continue;
        const tipo = n % 3;
        if (tipo === 0) P.pino(A(x, z), x, z, 0.9 + r() * 0.6, k);
        else if (tipo === 1) P.abedul(A(x, z), x, z, 0.9 + r() * 0.4);
        else P.arbusto(A(x, z), x, z, 0.8 + r() * 0.6);
        if (tipo < 2) chocar({ circulo: [x, z, 0.45], y0: -1, y1: 6 });
        ocupado.push({ x, z, mx: 1.2, mz: 1.2, ang: 0 });
        n++;
      }
      // pasto y flores sueltos
      for (let k = 0; k < 900; k++) {
        const a = r() * TAU,
          rr = 30 + r() * (R_MURO - 34);
        const [x, z] = polar(a, rr);
        if (aCalle(x, z).d < 0.5) continue;
        if (k % 7 === 0) P.flores(A(x, z), x, z);
        else P.pasto(A(x, z), x, z, 0.8 + r() * 0.6);
      }
    }
    // faroles a lo largo del anillo y de las avenidas
    for (let i = 0; i < 36; i++) {
      const an = (i / 36) * TAU + 0.05,
        [x, z] = polar(an, rOficios(an) + 3.2);
      if (solapa(x, z, 0.4, 0.4, 0, 0.1) || Object.values(PUERTAS).some((p) => Math.abs(Math.atan2(Math.sin(an - p), Math.cos(an - p))) < 0.05)) continue;
      luz(P.farol(A(x, z), B(x, z), x, z, 3.2, -an + PI), 0.9);
      chocar({ circulo: [x, z, 0.25], y0: -1, y1: 4 });
    }
    for (const nombre in PUERTAS) {
      const pa = PUERTAS[nombre];
      for (let r = 60; r < R_MURO - 14; r += 15) {
        for (const s of [-1, 1]) {
          const [x, z] = polar(pa, r),
            ox = -Math.sin(pa) * s * 4.6,
            oz = Math.cos(pa) * s * 4.6;
          if (solapa(x + ox, z + oz, 0.3, 0.3, 0, 0.1)) continue;
          luz(P.farol(A(x + ox, z + oz), B(x + ox, z + oz), x + ox, z + oz, 3.2, Math.atan2(-ox, -oz) + PI / 2), 0.9);
          chocar({ circulo: [x + ox, z + oz, 0.25], y0: -1, y1: 4 });
        }
      }
    }

    // ---------- el bosque de afuera ----------
    const pinos = [];
    {
      const r = GEO.azar(8080);
      for (let k = 0; k < 20000 && pinos.length < 5200; k++) {
        const a = r() * TAU,
          rr = R_MURO + 10 + Math.pow(r(), 0.8) * (R_FUERA + 130 - R_MURO);
        const [x, z] = polar(a, rr);
        if (aRio(x, z) < ANCHO_RIO / 2 + 4) continue;
        if (aCalle(x, z).d < 3) continue;
        if (Math.hypot(x - LUGAR.muelle[0], z - LUGAR.muelle[1]) < 18) continue;
        if (rr < R_MURO + 22 && r() < 0.75) continue; // al pie de la empalizada, despejado
        pinos.push({ x, z, s: 0.9 + r() * 1.1, y: h0(x, z), c: r(), ab: r() < 0.12 });
        if (rr < R_FUERA + 4) chocar({ circulo: [x, z, 0.5 * (0.9 + r() * 0.5)], y0: -2, y1: 8 });
      }
    }
    // el límite de afuera: el bosque cerrado
    for (let i = 0; i < 90; i++) {
      const a0 = (i / 90) * TAU,
        a1 = ((i + 1) / 90) * TAU;
      chocar({ seg: [...polar(a0, R_FUERA), ...polar(a1, R_FUERA), 1], y0: -5, y1: 20, borde: true });
    }

    // ---------- la cúpula: runas enormes sobre una curva invisible ----------
    const runasCupula = [];
    {
      const r = GEO.azar(1212);
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU + r() * 0.3,
          d = 0.35 + r() * 0.6;
        const f = r() < 0.2 ? 0 : 0.35 + r() * 0.65;
        if (!f) continue;
        runasCupula.push({ x: Math.cos(a) * R_MURO * d, z: Math.sin(a) * R_MURO * d, y: 55 + Math.sqrt(1 - d * d) * 70, runa: FUTHARK.NOMBRES[Math.floor(r() * FUTHARK.NOMBRES.length)], f, sem: i });
      }
    }

    // ---------- las celdas a mallas ----------
    for (const [, c] of celdas) {
      const m = c.a.malla();
      if (m) raiz.add(m);
      const mb = c.b.malla(GEO.MAT.brillo);
      if (mb) {
        mb.castShadow = false;
        raiz.add(mb);
      }
      const mr = c.r && c.r.malla(GEO.MAT.runico);
      if (mr) {
        mr.castShadow = false;
        raiz.add(mr);
      }
    }
    // todo lo fijo (menos las casas que se entran, que se cortan para verlas por dentro) se funde por barrios de 48 m
    {
      raiz.updateMatrixWorld(true);
      const sueltas = [];
      const fuera = new Set();
      for (const ch of raiz.children) if (ch.isMesh && !ch.isInstancedMesh && !ch.name) sueltas.push(ch);
      for (const ed of edificios) {
        if (ed.casa.ficha.entrable) continue;
        ed.casa.grupo.traverse((o) => o.isMesh && sueltas.push(o));
        fuera.add(ed.casa.grupo);
      }
      const bins = new Map(),
        v = new T.Vector3();
      for (const m of sueltas) {
        if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
        v.copy(m.geometry.boundingSphere.center).applyMatrix4(m.matrixWorld);
        const k = Math.floor(v.x / 48) + "," + Math.floor(v.z / 48) + (m.geometry.boundingSphere.radius > 60 ? "g" : "");
        if (!bins.has(k)) bins.set(k, []);
        bins.get(k).push(m);
      }
      for (const [, lista] of bins) {
        for (const m of GEO.fundir(lista)) raiz.add(m);
        for (const m of lista) {
          if (m.parent === raiz) raiz.remove(m);
          m.geometry.dispose();
        }
      }
      for (const g of fuera) raiz.remove(g);
    }

    // ---------- zonas de cámara ----------
    zonas.push({ circulo: [0, 0, 44], rig: "roble", prioridad: 1 });
    zonas.push({ circulo: [LUGAR.ting[0], LUGAR.ting[1], 11], rig: "ting", yaw: 0, prioridad: 2 });
    for (const nombre in PUERTAS) {
      const [x, z] = polar(PUERTAS[nombre], R_MURO + 4);
      zonas.push({ circulo: [x, z, 14], rig: "puerta", yaw: -PUERTAS[nombre] + PI / 2, prioridad: 1, puerta: nombre });
    }
    // el mercado de los toldos bajo la copa
    zonas.push({ anillo: [0, 0, 26, 42, -0.25 * PI, 1.1 * PI], rig: "toldos", prioridad: 1.5 });

    // ---------- las rutas de la gente (un grafo sobre las calles) ----------
    const nodos = [],
      aristas = [];
    const nodo = (x, z, tag) => {
      nodos.push({ x, z, v: [], tag });
      return nodos.length - 1;
    };
    const unir = (a, b) => {
      nodos[a].v.push(b);
      nodos[b].v.push(a);
      aristas.push([a, b]);
    };
    const anillo = (r, n, tag) => {
      const ids = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        ids.push(nodo(...polar(a, typeof r === "function" ? r(a) : r), tag));
      }
      for (let i = 0; i < n; i++) unir(ids[i], ids[(i + 1) % n]);
      return ids;
    };
    const a52 = anillo(52, 32, "plaza"),
      a96 = anillo(rOficios, 48, "anillo");
    const cerca52 = (a) => a52[Math.round(((((a % TAU) + TAU) % TAU) / TAU) * 32) % 32],
      cerca96 = (a) => a96[Math.round(((((a % TAU) + TAU) % TAU) / TAU) * 48) % 48];
    for (const nombre in PUERTAS) {
      const pa = PUERTAS[nombre];
      let previo = cerca52(pa);
      for (const r of [74, 96, 118, R_MURO - 12]) {
        const id = r === 96 ? cerca96(pa) : nodo(...polar(pa, r), r > 130 ? "puerta" : "avenida");
        unir(previo, id);
        previo = id;
      }
    }
    for (const a of [PI / 4, (3 * PI) / 4, (5 * PI) / 4, (7 * PI) / 4]) unir(cerca52(a), cerca96(a));
    // y el sendero bajo la copa, entre la plaza y el tronco
    const a24 = anillo(24, 16, "roble");
    for (let i = 0; i < 16; i += 4) unir(a24[i], cerca52((i / 16) * TAU));

    return {
      raiz, choques, superficies: tris, zonas, techosAbiertos, anclas, edificios, luces, humos, fuegos, puestos, troncos, pinos, runasCupula, piedrasCupula,
      rutas: { nodos, aristas }, roble, LUGAR, PUERTAS, R_MURO, ADARVE, HUECO, R_FUERA, RIO, ANCHO_RIO, aCalle, aRio, h0,
    };
  }

  // ---------- el Roble de Eikholt ----------
  // Tronco de unos 12 m de ancho, raíces enormes con musgo (algunas con vetas azules finísimas: lo antiguo), cintas de
  // las promesas en las raíces bajas, la copa de unos 80 m en verde viejo, y la escalera que sube alrededor del tronco
  // hasta el mirador, en una rama del lado norte.
  function armarRoble(raiz, chocar, sup, supQuad, luz, anclas) {
    const a = GEO.armador(808, 0.06),
      b = GEO.armador(809),
      ru = GEO.armador(810);
    const r = GEO.azar(808);
    const CORTEZA = ["#4A3A2C", "#54402E", "#3E3024", "#5A4636"];
    // el tronco: anillos de 10 caras que se angostan y se tuercen
    const anillos = [];
    for (let i = 0; i <= 10; i++) {
      const y = i * 1.6,
        rr = 6.2 - i * 0.26 + (i < 2 ? (2 - i) * 0.8 : 0);
      const pts = [];
      for (let k = 0; k < 12; k++) {
        const an = (k / 12) * PI * 2 + i * 0.07;
        const bump = 1 + Math.sin(k * 2.7 + i) * 0.08;
        pts.push([Math.cos(an) * rr * bump, y, Math.sin(an) * rr * bump]);
      }
      anillos.push(pts);
    }
    for (let i = 0; i < anillos.length - 1; i++)
      for (let k = 0; k < 12; k++) {
        const p = anillos[i][k],
          q = anillos[i][(k + 1) % 12],
          s = anillos[i + 1][(k + 1) % 12],
          t = anillos[i + 1][k];
        a.quad(p, t, s, q, CORTEZA[(i + k) % 4]);
      }
    // las ramas grandes hacia la copa
    const ramas = [];
    for (let k = 0; k < 9; k++) {
      const an = (k / 9) * PI * 2 + 0.3,
        y0 = 11 + (k % 3) * 2.2;
      const p0 = [Math.cos(an) * 2.5, y0, Math.sin(an) * 2.5];
      const p1 = [Math.cos(an) * 13, y0 + 7 + r() * 3, Math.sin(an) * 13];
      const p2 = [Math.cos(an + 0.25) * 24, y0 + 11 + r() * 4, Math.sin(an + 0.25) * 24];
      a.palo(p0, p1, 1.9, CORTEZA[k % 4], 7, 1.1);
      a.palo(p1, p2, 1.1, CORTEZA[(k + 1) % 4], 6, 0.5);
      ramas.push(p1, p2);
    }
    // el remate del tronco
    a.palo([0, 16, 0], [0.6, 24, -0.5], 3.4, CORTEZA[1], 9, 1.8);
    // las raíces: salen del pie, bajan y se meten en la tierra, con musgo encima
    const raices = [];
    for (let k = 0; k < 13; k++) {
      const an = (k / 13) * PI * 2 + r() * 0.2;
      const l = 11 + r() * 7;
      const p0 = [Math.cos(an) * 4.5, 2.4, Math.sin(an) * 4.5],
        p1 = [Math.cos(an) * (5.5 + l * 0.45), 1.3 + r() * 0.4, Math.sin(an) * (5.5 + l * 0.45)],
        p2 = [Math.cos(an + (r() - 0.5) * 0.3) * (5.5 + l), -0.4, Math.sin(an + (r() - 0.5) * 0.3) * (5.5 + l)];
      a.palo(p0, p1, 1.6, CORTEZA[k % 4], 6, 1.0);
      a.palo(p1, p2, 1.0, CORTEZA[(k + 2) % 4], 6, 0.3);
      // musgo
      a.bola(p1[0], p1[1] + 0.6, p1[2], 1.1, 0.35, 1.1, "#5E6A3A", 0, 0.3);
      raices.push({ an, p0, p1, p2 });
      // la raíz no se atraviesa (salvo donde se mete en la tierra)
      chocar({ seg: [p0[0], p0[2], p1[0], p1[2], 1.2], y0: -1, y1: 3 });
      chocar({ seg: [p1[0], p1[2], (p1[0] + p2[0] * 2) / 3, (p1[2] + p2[2] * 2) / 3, 0.7], y0: -1, y1: 2 });
      // las vetas azules en tres raíces viejas
      if (k % 4 === 1) {
        const n = 7;
        for (let i = 0; i < n; i++) {
          const u0 = i / n,
            u1 = (i + 0.8) / n;
          const q0 = [p0[0] + (p1[0] - p0[0]) * u0, p0[1] + (p1[1] - p0[1]) * u0 + 1.55 - u0 * 0.5, p0[2] + (p1[2] - p0[2]) * u0];
          const q1 = [p0[0] + (p1[0] - p0[0]) * u1, p0[1] + (p1[1] - p0[1]) * u1 + 1.55 - u1 * 0.5, p0[2] + (p1[2] - p0[2]) * u1];
          ru.palo(q0, [q1[0] + (r() - 0.5) * 0.3, q1[1], q1[2] + (r() - 0.5) * 0.3], 0.05, "#73D5DB", 3);
        }
      }
      // las cintas de las promesas, atadas en las raíces bajas
      if (k % 2 === 0) {
        for (let i = 0; i < 4; i++) {
          const u = 0.55 + i * 0.1,
            x = p1[0] + (p2[0] - p1[0]) * (u - 0.5),
            z = p1[2] + (p2[2] - p1[2]) * (u - 0.5),
            y = 1.25 - (u - 0.5) * 1.2;
          a.palo([x, y + 0.5, z], [x + 0.1, y - 0.35, z + 0.08], 0.03, ["#C8402D", "#E8D8A0", "#4A78D0", "#7BC86C", "#E0B2B2"][(k + i) % 5], 3);
        }
      }
    }
    chocar({ circulo: [0, 0, 6.6], y0: -1, y1: 30, tronco: true });
    // ---------- la escalera alrededor del tronco y el mirador ----------
    const ALTO_MIR = 19,
      vueltas = 1.15,
      rEsc = 8.6,
      anchoEsc = 1.9;
    const a0 = PI * 0.62; // empieza al sudoeste
    const n = 46;
    const esc = (u) => {
      const an = a0 - u * vueltas * PI * 2;
      return { an, y: ALTO_MIR * u };
    };
    for (let i = 0; i < n; i++) {
      const u0 = i / n,
        u1 = (i + 1) / n;
      const e0 = esc(u0),
        e1 = esc(u1);
      const pi = (e, rr) => [Math.cos(e.an) * rr, e.y, Math.sin(e.an) * rr];
      const ri = rEsc - anchoEsc / 2,
        ro = rEsc + anchoEsc / 2;
      a.losa(pi(e0, ro), pi(e1, ro), pi(e1, ri), pi(e0, ri), 0.16, i % 2 ? "#6A5038" : "#5E4632", "#3E2C20");
      // postes y baranda de afuera
      if (i % 2 === 0) {
        const pp = pi(e0, ro + 0.05);
        a.cilindro(pp[0], 0, pp[2], 0.1, 0.1, e0.y + 1.0, 5, "#3A2A1E");
        if (e0.y > 1.5) {
          const pq = pi(e0, ri - 0.2);
          a.palo([pq[0], e0.y - 0.6, pq[2]], [pq[0] * 0.75, e0.y - 1.6, pq[2] * 0.75], 0.08, "#3A2A1E", 4);
        }
      }
      a.palo([...pi(e0, ro + 0.05)].map((v, k) => (k === 1 ? v + 1.0 : v)), [...pi(e1, ro + 0.05)].map((v, k) => (k === 1 ? v + 1.0 : v)), 0.05, "#4A3426", 4);
      const s = (e, rr) => [Math.cos(e.an) * rr, Math.sin(e.an) * rr, e.y];
      supQuad(s(e0, ri - 0.1), s(e1, ri - 0.1), s(e1, ro), s(e0, ro), { nivel: "roble" });
      if (i < 4) chocar({ seg: [Math.cos(e0.an) * ro, Math.sin(e0.an) * ro, Math.cos(e1.an) * ro, Math.sin(e1.an) * ro, 0.12], y0: -1, y1: 0.1 + e1.y });
    }
    // el mirador: una plataforma sobre la rama del norte
    const fin = esc(1);
    const mx = Math.cos(fin.an) * rEsc,
      mz = Math.sin(fin.an) * rEsc;
    const cx = 0,
      cz = -12.5;
    {
      const pl = [];
      for (let k = 0; k < 8; k++) pl.push([cx + Math.cos((k / 8) * PI * 2) * 4.2, cz + Math.sin((k / 8) * PI * 2) * 4.2]);
      a.prisma(pl.slice().reverse(), ALTO_MIR - 0.25, ALTO_MIR, "#5E4632", "#6A5038");
      for (let k = 0; k < 8; k++) {
        const p = pl[k],
          q = pl[(k + 1) % 8];
        a.cilindro(p[0], ALTO_MIR, p[1], 0.1, 0.1, 1.1, 5, "#3A2A1E");
        a.palo([p[0], ALTO_MIR + 1.05, p[1]], [q[0], ALTO_MIR + 1.05, q[1]], 0.06, "#4A3426", 4);
        sup([cx, cz, ALTO_MIR], [q[0], q[1], ALTO_MIR], [p[0], p[1], ALTO_MIR], { nivel: "mirador" });
      }
      // el puentecito de la escalera a la plataforma
      supQuad([mx - 1.0, mz, ALTO_MIR], [mx + 1.0, mz, ALTO_MIR], [cx + 1.0, cz + 3.6, ALTO_MIR], [cx - 1.0, cz + 3.6, ALTO_MIR], { nivel: "mirador" });
      a.losa([mx - 1.0, ALTO_MIR, mz], [mx + 1.0, ALTO_MIR, mz], [cx + 1.0, ALTO_MIR, cz + 3.6], [cx - 1.0, ALTO_MIR, cz + 3.6], 0.16, "#6A5038", "#3E2C20");
      // la rama que la sostiene
      a.palo([0, 12, -3], [cx, ALTO_MIR - 0.3, cz - 2], 1.3, CORTEZA[0], 7, 0.9);
      luz([cx, ALTO_MIR + 1.4, cz], 0.6, "mirador");
      b.caja(cx + 3.6, ALTO_MIR + 0.9, cz, 0.3, 0.32, 0.3, "#F2C46A");
    }
    anclas.roble = [0, 9];
    anclas.mirador = [cx, cz];
    anclas.escalera_roble = [Math.cos(a0) * rEsc, Math.sin(a0) * rEsc + 1.5];
    const tronco = a.malla(),
      bm = b.malla(GEO.MAT.brillo),
      rm = ru.malla(GEO.MAT.runico);
    raiz.add(tronco);
    if (bm) raiz.add(bm);
    if (rm) {
      rm.castShadow = false;
      raiz.add(rm);
    }
    // ---------- la copa ----------
    // bolas de caras planas en verde viejo, profundo y algo desaturado (no verde amarillento); una malla propia que
    // ciudad.js vuelve transparente cuando Eromash está abajo y la cámara arriba
    const c = GEO.armador(811, 0.07);
    const VERDES = ["#30443B", "#3A5040", "#2E4036", "#44583F", "#36483A"];
    for (const p of ramas) c.bola(p[0], p[1] + 2, p[2], 6 + r() * 3, 4 + r() * 2, 6 + r() * 3, VERDES[Math.floor(r() * 5)], 1, 0.22, GEO.aclarar(VERDES[0], -0.2));
    for (let k = 0; k < 46; k++) {
      const an = r() * PI * 2,
        d = Math.sqrt(r()) * 34,
        y = 22 + (1 - d / 34) * 12 + r() * 4;
      c.bola(Math.cos(an) * d, y, Math.sin(an) * d, 7 + r() * 4, 4.5 + r() * 2.5, 7 + r() * 4, VERDES[Math.floor(r() * 5)], 1, 0.22, GEO.aclarar(VERDES[0], -0.25));
    }
    const matCopa = new T.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 1 });
    const copa = c.malla(matCopa);
    copa.name = "copa";
    raiz.add(copa);
    return { copa, matCopa, tronco, raices, ALTO_MIR, mirador: [cx, cz] };
  }

  // ---------- los muebles de una casa que se puede entrar ----------
  function amueblar(ed, i) {
    const D = ed.casa.medidas.D,
      W = ed.casa.medidas.W,
      y = ed.casa.medidas.yp;
    const a = GEO.armador(ed.casa.ficha.semilla * 3),
      b = GEO.armador(ed.casa.ficha.semilla * 3 + 1);
    const v = i % 4;
    a.con({ x: ed.x, z: ed.z, ry: ed.ry }, () => b.con({ x: ed.x, z: ed.z, ry: ed.ry }, () => a.con({ y }, () => b.con({ y }, () => {
      // el hogar contra una pared del costado
      const hx = v % 2 ? -W / 2 + 0.6 : W / 2 - 0.6;
      a.caja(hx, 0, -D / 4, 0.8, 1.2, 1.6, "#5E625E");
      b.bola(hx - Math.sign(hx) * 0.2, 0.3, -D / 4, 0.3, 0.25, 0.4, "#FF9A4A", 0, 0.3);
      // la cama de pieles
      a.caja(-hx * 0.55, 0, -D / 2 + 1.2, 1.6, 0.4, 2.0, "#5E4430");
      a.caja(-hx * 0.55, 0.4, -D / 2 + 1.2, 1.5, 0.15, 1.9, ["#8A6A48", "#6A5038", "#A88A6A"][v % 3]);
      // la mesa y el arcón
      PIEZAS.mesa(a, 0, D / 6, 0, 1.6, 0.8, 3);
      PIEZAS.banco(a, 0, D / 6 + 0.75, 0, 1.4);
      a.caja(hx * 0.3, 0, -D / 2 + 0.5, 1.2, 0.55, 0.6, "#5E3A26");
      if (v === 1) for (let k = 0; k < 3; k++) PIEZAS.barril(a, -hx * 0.7, D / 2 - 1.2 - k * 0.8, 0.8);
      if (v === 2) a.caja(-hx * 0.8, 0, D / 6, 0.6, 1.4, 0.8, "#6A4A30"); // el telar
    }))));
    const m = a.malla(),
      mb = b.malla(GEO.MAT.brillo);
    const padre = ed.casa.grupo.parent;
    if (m) padre.add(m);
    if (mb) padre.add(mb);
    ed.muebles = [m, mb];
  }

  return { armar, PUERTAS, R_MURO, ADARVE };
})();
