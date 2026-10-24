// ---------- la muralla doble de Eikholt en volumen (módulo MURALLA25) ----------
// Como las casas (CASAS25): cada tramo y cada atalaya tienen sus tres medidas y se dibujan desde el ángulo de la cámara.
// La muralla es doble: la empalizada de afuera, alta y de troncos en punta; la de adentro, más baja; y entre las dos el
// adarve de tablas por donde patrulla la Guardia, con su baranda del lado de la ciudad, postes con farol y, cada tanto,
// una escalera de mano que baja a la ciudad. Las atalayas están fundidas en la muralla: la torre de troncos nace del
// adarve, más ancha que el muro, con su cuarto de vigía alumbrado, techo de tejuelas en punta y el estandarte del
// Ciervo colgado del lado de adentro.
// En el plano del tramo u va a lo largo del muro y w hacia adentro de la ciudad.
//   MURALLA25.tramo(largo, sem, conEscalera, conCofre) → { dibujar(c, x, y, giro, k, t), alto }
//   MURALLA25.torre(sem) → { dibujar(c, x, y, giro, k, t), alto, ancho }
window.MURALLA25 = (function () {
  "use strict";
  const { P, E, R, L, alfa, halo, azar } = DIB;
  const C = ASSETS.C;
  const ZF = 340, // alto de la empalizada de afuera
    ZD = 210, // el piso del adarve
    ZB = 270, // la baranda
    WF = -95, // la cara de adentro de la empalizada de afuera
    WI = 95, // la cara de afuera de la empalizada de adentro
    GR = 26; // grosor de cada empalizada
  const LUZ = (lx, cols) => (lx > 0.25 ? cols[1] : lx < -0.25 ? cols[2] : cols[0]);
  const TRONCO = [C.madera, C.maderaLuz, C.maderaSombra];
  const VIEJO = [C.maderaVieja, C.madera, C.maderaSombra];

  function utiles(pr) {
    const pared = (au, aw, bu, bw, z0, z1, col) => P(c0.c, [...pr(au, aw, z0), ...pr(bu, bw, z0), ...pr(bu, bw, z1), ...pr(au, aw, z1)], col);
    const c0 = {};
    return { c0, pared };
  }

  // una cara de troncos parados entre (au, aw) y (bu, bw), de z0 a z1; punta: los troncos terminan en punta
  function troncos(c, pr, au, aw, bu, bw, z0, z1, cols, lx, r, punta) {
    const l = Math.hypot(bu - au, bw - aw),
      n = Math.max(2, Math.round(l / 34));
    const base = LUZ(lx, cols);
    P(c, [...pr(au, aw, z0), ...pr(bu, bw, z0), ...pr(bu, bw, z1), ...pr(au, aw, z1)], base);
    for (let i = 0; i < n; i++) {
      const s0 = i / n,
        s1 = (i + 1) / n,
        sm = (s0 + s1) / 2;
      const u0 = au + (bu - au) * s0,
        w0 = aw + (bw - aw) * s0,
        u1 = au + (bu - au) * s1,
        w1 = aw + (bw - aw) * s1,
        um = au + (bu - au) * sm,
        wm = aw + (bw - aw) * sm;
      const h = z1 + (r() - 0.5) * 18;
      if (punta) P(c, [...pr(u0, w0, z1 - 4), ...pr(u1, w1, z1 - 4), ...pr(u1, w1, h), ...pr(um, wm, h + 30), ...pr(u0, w0, h)], i % 2 ? base : cols[0]);
      const a = pr(u0, w0, z0),
        b = pr(u0, w0, punta ? h : z1);
      if (i) L(c, a[0], a[1], b[0], b[1], cols[2], 3);
    }
  }

  // un tramo de muralla de largo l (centrado en u = 0)
  function tramo(l, sem, conEscalera, conCofre) {
    const U = l / 2 + 2;
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      const lx = (nu, nw) => pr.mira(nu, nw)[0];
      const ve = (nu, nw) => pr.mira(nu, nw)[1] > 0.01;
      const r = azar(sem * 97 + 5);
      // el terraplén al pie, de los dos lados
      P(c, [...pr(-U, WF - GR - 40, 0), ...pr(U, WF - GR - 40, 0), ...pr(U, WI + GR + 40, 0), ...pr(-U, WI + GR + 40, 0)], "#3B3222");
      const desdeAdentro = ve(0, 1);
      const afuera = () => {
        // la empalizada de afuera: la cara de afuera (alta, en punta) o la de adentro, por encima del adarve
        if (!desdeAdentro) {
          troncos(c, pr, -U, WF - GR, U, WF - GR, 0, ZF, VIEJO, lx(0, -1), r, true);
          for (const z of [70, 190]) {
            const a = pr(-U, WF - GR, z),
              b = pr(U, WF - GR, z);
            L(c, a[0], a[1], b[0], b[1], z < 100 ? "#8A7A5A" : C.hierro, 6);
          }
        } else {
          troncos(c, pr, U, WF, -U, WF, 0, ZF, [C.maderaSombra, C.madera, "#3A2818"], lx(0, 1), r, true);
        }
      };
      const adarve = () => {
        // el piso de tablas entre las dos empalizadas, con su canto
        P(c, [...pr(-U, WF, ZD), ...pr(U, WF, ZD), ...pr(U, WI, ZD), ...pr(-U, WI, ZD)], C.maderaLuz);
        const n = Math.max(2, Math.round(l / 40));
        for (let i = 1; i < n; i++) {
          const u = -U + (2 * U * i) / n,
            a = pr(u, WF, ZD),
            b = pr(u, WI, ZD);
          L(c, a[0], a[1], b[0], b[1], C.madera, 2);
        }
      };
      const adentro = () => {
        // la empalizada de adentro (hasta el adarve) y la baranda con sus postes
        if (desdeAdentro) {
          troncos(c, pr, -U, WI + GR, U, WI + GR, 0, ZD, TRONCO, lx(0, 1), r, false);
          const a = pr(-U, WI + GR, ZD),
            b = pr(U, WI + GR, ZD);
          L(c, a[0], a[1], b[0], b[1], C.maderaSombra, 6);
        } else {
          // desde afuera apenas asoma por encima de la de afuera: nada que dibujar
        }
        for (const s of [-1, 0, 1]) {
          const a = pr(s * (U - 10), WI, ZD),
            b = pr(s * (U - 10), WI, ZB);
          L(c, a[0], a[1], b[0], b[1], C.maderaSombra, 5);
        }
        const a = pr(-U, WI, ZB),
          b = pr(U, WI, ZB);
        L(c, a[0], a[1], b[0], b[1], C.madera, 6);
        const a2 = pr(-U, WI, ZB - 30),
          b2 = pr(U, WI, ZB - 30);
        L(c, a2[0], a2[1], b2[0], b2[1], C.maderaSombra, 3);
      };
      // el farol del adarve, en un poste cada tanto
      const farol = () => {
        if (sem % 3) return;
        const a = pr(0, WI - 10, ZD),
          b = pr(0, WI - 10, ZD + 120);
        L(c, a[0], a[1], b[0], b[1], C.maderaSombra, 5);
        R(c, b[0] - 9, b[1] - 18, 18, 20, C.hierro);
        alfa(c, 0.9, () => R(c, b[0] - 6, b[1] - 15, 12, 14, C.ambar));
        halo(c, b[0], b[1] - 8, 90, C.ambar, 0.5 + Math.sin(t * 4 + sem) * 0.08);
      };
      // la escalera de mano que baja a la ciudad
      const escalera = () => {
        if (!conEscalera) return;
        const u0 = -U * 0.5,
          u1 = U * 0.4;
        for (const dw of [-20, 20]) {
          const a = pr(u0, WI + GR + 150 + dw * 0.2, 0),
            b = pr(u1, WI + GR + 6 + dw * 0.2, ZD + 10);
          L(c, a[0] + dw * 0.3, a[1], b[0] + dw * 0.3, b[1], C.maderaSombra, 5);
        }
        for (let i = 1; i < 8; i++) {
          const s = i / 8,
            u = u0 + (u1 - u0) * s,
            w = WI + GR + 150 - 144 * s,
            z = (ZD + 10) * s;
          const a = pr(u, w, z);
          L(c, a[0] - 7, a[1], a[0] + 7, a[1], C.madera, 4);
        }
      };
      // un cofre olvidado en el adarve: el premio de los que suben a recorrer la muralla
      const cofre = () => {
        if (!conCofre) return;
        const caja = (u0, u1, w0, w1, z0, z1, cols) => {
          const cara = (pts, nu, nw, col) => pr.mira(nu, nw)[1] > 0.01 && P(c, pts.map((p) => pr(...p)).flat(), col);
          cara([[u0, w1, z0], [u1, w1, z0], [u1, w1, z1], [u0, w1, z1]], 0, 1, lx(0, 1) > 0.2 ? cols[1] : cols[0]);
          cara([[u1, w0, z0], [u0, w0, z0], [u0, w0, z1], [u1, w0, z1]], 0, -1, lx(0, -1) > 0.2 ? cols[1] : cols[0]);
          cara([[u1, w1, z0], [u1, w0, z0], [u1, w0, z1], [u1, w1, z1]], 1, 0, lx(1, 0) > 0.2 ? cols[1] : cols[0]);
          cara([[u0, w0, z0], [u0, w1, z0], [u0, w1, z1], [u0, w0, z1]], -1, 0, lx(-1, 0) > 0.2 ? cols[1] : cols[0]);
          P(c, [[u0, w0, z1], [u1, w0, z1], [u1, w1, z1], [u0, w1, z1]].map((p) => pr(...p)).flat(), cols[2]);
        };
        caja(-40, 40, -25, 25, ZD, ZD + 40, [C.maderaSombra, C.madera, C.maderaLuz]);
        caja(-42, 42, -27, 27, ZD + 40, ZD + 52, [C.hierro, "#5A5E66", "#6A7078"]);
        const [hx, hy] = pr(0, 0, ZD + 56);
        halo(c, hx, hy, 50, C.ambar, 0.35 + Math.sin(t * 2 + sem) * 0.1);
      };
      if (desdeAdentro) {
        afuera();
        adarve();
        cofre();
        farol();
        adentro();
        escalera();
      } else {
        escalera();
        adentro();
        adarve();
        farol();
        afuera();
      }
    }
    return { dibujar, alto: ZF + 40, radio: U + 160 };
  }

  // una atalaya fundida en la muralla: más ancha que el muro, nace del suelo y sube por encima del adarve
  function torre(sem) {
    const T = 150, // media torre
      ZT = 470, // hasta acá los troncos
      ZC = 600, // el cuarto del vigía
      ZR = 800, // la punta del techo
      AL = 40;
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      const lx = (nu, nw) => pr.mira(nu, nw)[0];
      const r = azar(sem * 53 + 1);
      DIB.sombra(c, x + 30, y + 10, T * 1.6, T * k * 1.4 + 20, 0.36);
      const caras = (h) => [
        [-h, h, h, h, 0, 1],
        [h, h, h, -h, 1, 0],
        [h, -h, -h, -h, 0, -1],
        [-h, -h, -h, h, -1, 0],
      ];
      // el cuerpo de troncos, de punta a punta del muro, con dos fajas
      for (const f of caras(T)) {
        if (pr.mira(f[4], f[5])[1] <= 0.01) continue;
        troncos(c, pr, f[0], f[1], f[2], f[3], 0, ZT, TRONCO, lx(f[4], f[5]), r, false);
        for (const z of [120, ZT - 20]) {
          const a = pr(f[0], f[1], z),
            b = pr(f[2], f[3], z);
          L(c, a[0], a[1], b[0], b[1], C.hierro, 6);
        }
        // el estandarte del Ciervo del lado de adentro (w+)
        if (f[5] === 1) {
          const q = (s, z, v) => pr(-60 + s * 120 + (v || 0), T + 2, z);
          const v = Math.sin(t * 1.4 + sem) * 6;
          P(c, [...q(0, ZT - 30), ...q(1, ZT - 30), ...q(1, 150, v), ...q(0.5, 190, v), ...q(0, 150, v)], "#2C4226");
          P(c, [...q(0.72, ZT - 30), ...q(1, ZT - 30), ...q(1, 150, v), ...q(0.86, 165, v)], "#3E5A34");
          // la insignia de Eikholt (DIB.insignia), en blanco hueso sobre el verde
          const alto = 200,
            z0 = ZT - 50;
          DIB.insignia(c, (x2, y2) => q(0.5 + (x2 * alto) / 120, z0 - y2 * alto, v * 0.6), "#F2ECEC");
        }
      }
      // el piso del cuarto, que sobresale
      const S = T + 24;
      for (const f of caras(S)) {
        if (pr.mira(f[4], f[5])[1] <= 0.01) continue;
        P(c, [...pr(f[0], f[1], ZT - 6), ...pr(f[2], f[3], ZT - 6), ...pr(f[2], f[3], ZT + 22), ...pr(f[0], f[1], ZT + 22)], LUZ(lx(f[4], f[5]), [C.maderaSombra, C.madera, "#3A2818"]));
      }
      // el cuarto del vigía: postes en las esquinas, baranda y la luz de adentro
      const Q = T - 10;
      for (const f of caras(Q)) {
        if (pr.mira(f[4], f[5])[1] <= 0.01) continue;
        const l2 = lx(f[4], f[5]);
        // el cuarto cerrado: la pared de troncos entera y la ventana alumbrada, opaca (no se ve a través)
        P(c, [...pr(f[0], f[1], ZT + 22), ...pr(f[2], f[3], ZT + 22), ...pr(f[2], f[3], ZC), ...pr(f[0], f[1], ZC)], LUZ(l2, TRONCO));
        const mix = (s2, z) => pr(f[0] * (1 - s2) + f[2] * s2, f[1] * (1 - s2) + f[3] * s2, z);
        P(c, [...mix(0.22, ZT + 80), ...mix(0.78, ZT + 80), ...mix(0.78, ZC - 22), ...mix(0.22, ZC - 22)], "#1A140E");
        P(c, [...mix(0.25, ZT + 84), ...mix(0.75, ZT + 84), ...mix(0.75, ZC - 26), ...mix(0.25, ZC - 26)], C.ambar);
        for (const s of [0, 1]) {
          const a = pr(s ? f[2] : f[0], s ? f[3] : f[1], ZT + 22),
            b = pr(s ? f[2] : f[0], s ? f[3] : f[1], ZC);
          L(c, a[0], a[1], b[0], b[1], C.maderaSombra, 7);
        }
      }
      const [hx, hy] = pr(0, 0, ZT + 110);
      halo(c, hx, hy, 190, C.ambar, 0.45);
      // el techo en punta, de tejuelas
      const q = Q + AL,
        cima = pr(0, 0, ZR);
      for (const f of caras(q)) {
        if (pr.mira(f[4], f[5])[1] < -0.2) continue;
        const l2 = lx(f[4], f[5]);
        const a = pr(f[0], f[1], ZC),
          b = pr(f[2], f[3], ZC);
        P(c, [...a, ...b, ...cima], LUZ(l2, ["#3A3A3E", "#4E4E54", "#2A2A2E"]));
        for (let i = 1; i < 4; i++) {
          const s = i / 4;
          const p0 = [a[0] + (cima[0] - a[0]) * s, a[1] + (cima[1] - a[1]) * s],
            p1 = [b[0] + (cima[0] - b[0]) * s, b[1] + (cima[1] - b[1]) * s];
          L(c, p0[0], p0[1], p1[0], p1[1], "rgba(0,0,0,0.22)", 2);
        }
      }
      R(c, cima[0] - 3, cima[1] - 30, 6, 30, C.maderaSombra);
      E(c, cima[0], cima[1] - 32, 5, 5, C.ambar);
    }
    return { dibujar, alto: ZR + 40, ancho: 2 * T };
  }
  return { tramo, torre, ZD, ZF };
})();
