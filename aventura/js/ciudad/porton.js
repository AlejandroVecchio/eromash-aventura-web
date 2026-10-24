// ---------- las puertas de la empalizada (módulo PORTON25) ----------
// El portón de cada puerta de Eikholt con sus tres medidas, como las casas (CASAS25): dos torres cuadradas de troncos
// sobre zócalo de piedra con techo de pizarra en punta, el dintel con la runa Raido tallada de los dos lados y las dos
// hojas abiertas hacia adentro. Se dibuja desde el ángulo de la cámara, así gira con la empalizada.
// u va a lo largo de la empalizada y w hacia afuera de la ciudad. PORTON25.crear(hueco, norte) → { dibujar(c, x, y, giro, k, t) }
window.PORTON25 = (function () {
  "use strict";
  const { P, R, L, alfa, halo, sombra } = DIB;
  const C = ASSETS.C;
  const RAIDO = [[0.2, 0, 0.2, 1], [0.2, 0, 0.75, 0.25], [0.75, 0.25, 0.2, 0.5], [0.2, 0.5, 0.8, 1]];

  function crear(hueco, norte) {
    const T = 115, // media torre
      TC = hueco + T, // centro de cada torre
      ZP = 150, // alto del zócalo de piedra
      ZT = 560, // alto de los troncos
      ZR = 760, // la punta del techo
      AL = 34; // alero del techo
    const piedra = norte ? ["#4A4844", "#5E5C56", "#3A3834"] : ["#5A5650", "#6E6A62", "#46423C"];

    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      const luzDe = (nu, nw) => pr.mira(nu, nw)[0];
      sombra(c, x + 30, y + 10, Math.abs(Math.cos(giro)) * (TC + T) + Math.abs(Math.sin(giro)) * T + 60, (Math.abs(Math.sin(giro)) * (TC + T) + Math.abs(Math.cos(giro)) * T) * k + 40, 0.38);
      // un cuadrilátero vertical entre dos puntos del piso
      const pared = (au, aw, bu, bw, z0, z1, col) => P(c, [...pr(au, aw, z0), ...pr(bu, bw, z0), ...pr(bu, bw, z1), ...pr(au, aw, z1)], col);
      // las caras de una caja que miran a la cámara; detalle(cara) dibuja encima de cada una
      const caja = (u0, u1, w0, w1, z0, z1, cols, detalle) => {
        const caras = [
          [u0, w1, u1, w1, 0, 1],
          [u1, w1, u1, w0, 1, 0],
          [u1, w0, u0, w0, 0, -1],
          [u0, w0, u0, w1, -1, 0],
        ];
        for (const f of caras) {
          if (pr.mira(f[4], f[5])[1] <= 0.01) continue;
          const lx = luzDe(f[4], f[5]);
          pared(f[0], f[1], f[2], f[3], z0, z1, lx > 0.25 ? cols[1] : lx < -0.25 ? cols[2] : cols[0]);
          if (detalle) detalle(f, lx);
        }
      };
      const torre = (tc, lado) => {
        // zócalo de piedra con sus hiladas
        caja(tc - T - 8, tc + T + 8, -T - 8, T + 8, 0, ZP, piedra, (f) => {
          for (let h = 1; h < 4; h++) {
            const a = pr(f[0], f[1], (h * ZP) / 4),
              b = pr(f[2], f[3], (h * ZP) / 4);
            L(c, a[0], a[1], b[0], b[1], piedra[2], 3);
          }
        });
        // el cuerpo de troncos parados
        caja(tc - T, tc + T, -T, T, ZP, ZT, [C.madera, C.maderaLuz, C.maderaSombra], (f, lx) => {
          for (let i = 1; i < 7; i++) {
            const s = i / 7,
              u = f[0] + (f[2] - f[0]) * s,
              w = f[1] + (f[3] - f[1]) * s;
            const a = pr(u, w, ZP),
              b = pr(u, w, ZT);
            L(c, a[0], a[1], b[0], b[1], lx > 0.25 ? C.madera : C.maderaSombra, 4);
          }
          // la faja de hierro y la ventana con luz
          const a = pr(f[0], f[1], ZT - 70),
            b = pr(f[2], f[3], ZT - 70);
          L(c, a[0], a[1], b[0], b[1], C.hierro, 6);
          const um = (f[0] + f[2]) / 2,
            wm = (f[1] + f[3]) / 2,
            du = (f[2] - f[0]) * 0.1,
            dw = (f[3] - f[1]) * 0.1;
          P(c, [...pr(um - du, wm - dw, ZT - 170), ...pr(um + du, wm + dw, ZT - 170), ...pr(um + du, wm + dw, ZT - 100), ...pr(um - du, wm - dw, ZT - 100)], "#1A140E");
          alfa(c, 0.8, () => P(c, [...pr(um - du * 0.75, wm - dw * 0.75, ZT - 164), ...pr(um + du * 0.75, wm + dw * 0.75, ZT - 164), ...pr(um + du * 0.75, wm + dw * 0.75, ZT - 106), ...pr(um - du * 0.75, wm - dw * 0.75, ZT - 106)], C.ambar));
        });
        // el techo en punta: cuatro caras, la de la derecha con luz
        const q = T + AL,
          cima = pr(tc, 0, ZR);
        const tri = [
          [tc - q, q, tc + q, q, 0, 1],
          [tc + q, q, tc + q, -q, 1, 0],
          [tc + q, -q, tc - q, -q, 0, -1],
          [tc - q, -q, tc - q, q, -1, 0],
        ];
        for (const f of tri) {
          if (pr.mira(f[4], f[5])[1] < -0.2) continue;
          const lx = luzDe(f[4], f[5]);
          P(c, [...pr(f[0], f[1], ZT - 10), ...pr(f[2], f[3], ZT - 10), ...cima], lx > 0.25 ? C.pizarraLuz || C.pizarra : lx < -0.25 ? C.pizarraSombra : C.pizarra);
        }
        // la luz de la ventana
        const [hx, hy] = pr(tc, 0, ZT - 135);
        halo(c, hx, hy, 150, C.ambar, 0.4);
      };
      // las hojas de la puerta, abiertas hacia adentro (w−) unos setenta grados
      const hoja = (lado) => {
        const u0 = lado * hueco,
          a = 1.45;
        const u1 = u0 - lado * Math.cos(a) * hueco * 0.95,
          w1 = -T + 10 - Math.sin(a) * hueco * 0.95;
        const nu = lado * Math.sin(a),
          nw = -lado * Math.cos(a) * -1;
        const lx = luzDe(nu, nw);
        pared(u0, -T + 10, u1, w1, 0, ZT - 170, lx > 0 ? C.madera : C.maderaSombra);
        for (const z of [90, ZT - 230]) {
          const p0 = pr(u0, -T + 10, z),
            p1 = pr(u1, w1, z);
          L(c, p0[0], p0[1], p1[0], p1[1], C.hierro, 7);
        }
      };
      // el dintel con el pasillo techado y la runa Raido de los dos lados
      const dintel = () => {
        caja(-hueco - 10, hueco + 10, -T + 25, T - 25, ZT - 120, ZT - 30, [C.maderaSombra, C.madera, C.maderaSombra], (f) => {
          if (f[5] === 0) return;
          const lado = f[5];
          const enCara = (s, z) => pr(lado > 0 ? -60 + s * 120 : 60 - s * 120, lado * (T - 25), z);
          P(c, [...enCara(0, ZT - 115), ...enCara(1, ZT - 115), ...enCara(1, ZT - 35), ...enCara(0, ZT - 35)], "#3A2A1C");
          c.strokeStyle = C.ambar;
          c.lineWidth = 7;
          c.lineCap = "round";
          c.beginPath();
          for (const [a, b, d, e] of RAIDO) {
            const p0 = enCara(0.3 + a * 0.4, ZT - 45 - b * 60),
              p1 = enCara(0.3 + d * 0.4, ZT - 45 - e * 60);
            c.moveTo(p0[0], p0[1]);
            c.lineTo(p1[0], p1[1]);
          }
          c.stroke();
        });
        // la baranda del pasillo de arriba
        caja(-hueco - 10, hueco + 10, -T + 25, -T + 45, ZT - 30, ZT + 30, [C.madera, C.maderaLuz, C.maderaSombra]);
        caja(-hueco - 10, hueco + 10, T - 45, T - 25, ZT - 30, ZT + 30, [C.madera, C.maderaLuz, C.maderaSombra]);
      };
      // los faroles de afuera, a los dos lados del paso
      const farol = (lado) => {
        const p0 = pr(lado * (hueco - 40), T + 70, 0),
          p1 = pr(lado * (hueco - 40), T + 70, 200);
        L(c, p0[0], p0[1], p1[0], p1[1], C.maderaSombra, 8);
        R(c, p1[0] - 16, p1[1] - 34, 32, 36, C.hierro);
        alfa(c, 0.9, () => R(c, p1[0] - 11, p1[1] - 29, 22, 26, C.ambar));
        halo(c, p1[0], p1[1] - 16, 110, C.ambar, 0.55 + Math.sin(t * 4 + lado) * 0.08);
      };
      // de atrás para adelante según la cámara
      const partes = [
        [pr.fondo(-TC, 0), () => torre(-TC, -1)],
        [pr.fondo(TC, 0), () => torre(TC, 1)],
        [pr.fondo(-hueco * 0.7, -T - hueco * 0.45), () => hoja(-1)],
        [pr.fondo(hueco * 0.7, -T - hueco * 0.45), () => hoja(1)],
        [pr.fondo(0, 0), dintel],
        [pr.fondo(-hueco + 40, T + 70), () => farol(-1)],
        [pr.fondo(hueco - 40, T + 70), () => farol(1)],
      ];
      partes.sort((a, b) => a[0] - b[0]).forEach((p) => p[1]());
    }
    return { dibujar, alto: ZR, ancho: 2 * (TC + T) };
  }
  return { crear };
})();
