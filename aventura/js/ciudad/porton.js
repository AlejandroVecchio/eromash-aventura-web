// ---------- las puertas de la empalizada (módulo PORTON25) ----------
// El portón de cada puerta de Eikholt con sus tres medidas, como las casas (CASAS25), dibujado desde el ángulo de la
// cámara, así gira con la muralla. Las torres son atalayas de la muralla (MURALLA25.torre) con el estandarte del lado
// de afuera; entre las dos va el pasillo del adarve con la runa Raido tallada de los dos lados y faroles colgados; las
// hojas quedan abiertas hacia adentro; del lado de adentro de cada torre se para una piedra rúnica casi tan alta como ella, con
// dos runas atadas que brillan en azul rúnico, y a los lados del paso, dos braseros.
// u va a lo largo de la muralla y w hacia afuera de la ciudad. PORTON25.crear(hueco, norte) → { dibujar(c, x, y, giro, k, t) }
window.PORTON25 = (function () {
  "use strict";
  const { P, R, L, alfa, halo, sombra } = DIB;
  const C = ASSETS.C;
  const RAIDO = [[0.2, 0, 0.2, 1], [0.2, 0, 0.75, 0.25], [0.75, 0.25, 0.2, 0.5], [0.2, 0.5, 0.8, 1]];

  function crear(hueco, norte) {
    const T = 150, // media torre (la de MURALLA25.torre)
      TC = hueco + T,
      ZT = 470,
      ZP = 360; // el piso del pasillo de arriba
    const RUNAS = norte ? [["isa", "algiz"], ["thurisaz", "naudiz"]] : [["raidho", "algiz"], ["ehwaz", "mannaz"]];
    const torres = [MURALLA25.torre(norte ? 81 : 41), MURALLA25.torre(norte ? 82 : 42)];
    const runico = DIB.RUNICO || "#73D5DB";

    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      const luzDe = (nu, nw) => pr.mira(nu, nw)[0];
      sombra(c, x + 30, y + 10, Math.abs(Math.cos(giro)) * (TC + T) + Math.abs(Math.sin(giro)) * T + 80, (Math.abs(Math.sin(giro)) * (TC + T) + Math.abs(Math.cos(giro)) * T) * k + 60, 0.38);
      const pared = (au, aw, bu, bw, z0, z1, col) => P(c, [...pr(au, aw, z0), ...pr(bu, bw, z0), ...pr(bu, bw, z1), ...pr(au, aw, z1)], col);
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
        P(c, [...pr(u0, w0, z1), ...pr(u1, w0, z1), ...pr(u1, w1, z1), ...pr(u0, w1, z1)], cols[1]);
      };
      // una torre: la atalaya de la muralla, con el estandarte (su w+) mirando afuera
      const torre = (lado) => {
        const [tx, ty] = pr(lado * TC, 0, 0);
        torres[lado < 0 ? 0 : 1].dibujar(c, tx, ty, giro, k, t);
      };
      // las hojas de la puerta, abiertas hacia adentro (w−) contra los costados del paso
      const hoja = (lado) => {
        const u0 = lado * hueco,
          a = 1.45;
        const u1 = u0 - lado * Math.cos(a) * hueco * 0.95,
          w1 = -T + 10 - Math.sin(a) * hueco * 0.95;
        const lx = luzDe(lado * Math.sin(a), Math.cos(a));
        pared(u0, -T + 10, u1, w1, 0, ZP - 40, lx > 0 ? C.madera : C.maderaSombra);
        for (const z of [90, ZP - 120]) {
          const p0 = pr(u0, -T + 10, z),
            p1 = pr(u1, w1, z);
          L(c, p0[0], p0[1], p1[0], p1[1], C.hierro, 7);
        }
      };
      // el pasillo de arriba: viga con la runa Raido de los dos lados, piso, baranda y techito
      const pasillo = () => {
        caja(-hueco - 10, hueco + 10, -T + 25, T - 25, ZP - 90, ZP, [C.maderaSombra, C.madera, C.maderaSombra], (f) => {
          if (f[5] === 0) return;
          const lado = f[5];
          const enCara = (s, z) => pr(lado > 0 ? -60 + s * 120 : 60 - s * 120, lado * (T - 25), z);
          P(c, [...enCara(0, ZP - 86), ...enCara(1, ZP - 86), ...enCara(1, ZP - 6), ...enCara(0, ZP - 6)], "#3A2A1C");
          c.strokeStyle = C.ambar;
          c.lineWidth = 7;
          c.lineCap = "round";
          c.beginPath();
          for (const [a, b, d, e] of RAIDO) {
            const p0 = enCara(0.3 + a * 0.4, ZP - 16 - b * 60),
              p1 = enCara(0.3 + d * 0.4, ZP - 16 - e * 60);
            c.moveTo(p0[0], p0[1]);
            c.lineTo(p1[0], p1[1]);
          }
          c.stroke();
        });
        for (const w of [-T + 30, T - 30]) {
          for (const u of [-hueco + 20, 0, hueco - 20]) {
            const a = pr(u, w, ZP),
              b = pr(u, w, ZP + 70);
            L(c, a[0], a[1], b[0], b[1], C.maderaSombra, 6);
          }
          const a = pr(-hueco, w, ZP + 70),
            b = pr(hueco, w, ZP + 70);
          L(c, a[0], a[1], b[0], b[1], C.madera, 7);
        }
        // faroles colgados del pasillo
        for (const u of [-hueco * 0.5, hueco * 0.5]) {
          const [fx, fy] = pr(u, T - 25, ZP - 100);
          R(c, fx - 9, fy, 18, 22, C.hierro);
          alfa(c, 0.9, () => R(c, fx - 6, fy + 3, 12, 16, C.ambar));
          halo(c, fx, fy + 10, 120, C.ambar, 0.5 + Math.sin(t * 3 + u) * 0.06);
        }
      };
      // una piedra rúnica: losa alta en punta, con grosor, y dos runas atadas que brillan
      const piedra = (lado) => {
        // del lado de adentro de la puerta (w−): desde afuera se ven los estandartes de las torres
        const u0 = lado * (TC + 10),
          w0 = -T - 30,
          SW = 105,
          H = ZT - 125; // alta, pero sin asomar por detrás del cuarto de vigía cuando se mira desde afuera
        const forma = [[-1, 0], [-1.05, 0.5], [-0.9, 0.82], [-0.5, 0.97], [0, 1.02], [0.5, 0.97], [0.9, 0.82], [1.05, 0.5], [1, 0]];
        const en = (s, z, w) => pr(u0 + s * SW, w, z * H);
        sombra(c, ...pr(u0 + 20, w0, 0), SW * 1.3, 40 * k + 14, 0.34);
        // el canto (atrás) y la cara de adelante
        const atras = forma.flatMap(([s, z]) => en(s, z, w0 - 70));
        const frente = forma.flatMap(([s, z]) => en(s, z, w0));
        const mirando = pr.mira(0, 1)[1] > 0;
        P(c, mirando ? atras : frente, "#3A3E44");
        // los costados que unen las dos caras
        for (let i = 0; i < forma.length - 1; i++) {
          const [s0, z0] = forma[i],
            [s1, z1] = forma[i + 1];
          const nu = z1 - z0,
            nw = 0;
          P(c, [...en(s0, z0, w0 - 70), ...en(s1, z1, w0 - 70), ...en(s1, z1, w0), ...en(s0, z0, w0)], luzDe(Math.sign(s0 + s1) || 1, nw) > 0 ? "#6A7078" : "#4A4E56");
        }
        const cara = mirando ? frente : atras;
        P(c, cara, "#5A5E66");
        // la mitad iluminada (arriba a la derecha)
        const luz = forma.filter(([s]) => s >= 0).flatMap(([s, z]) => en(s, z, mirando ? w0 : w0 - 70));
        P(c, [...en(0, 0, mirando ? w0 : w0 - 70), ...luz], "rgba(242,236,236,0.08)");
        // las runas atadas: una arriba de la otra, en la cara que se ve
        const wr = mirando ? w0 + 1 : w0 - 71,
          par = RUNAS[lado < 0 ? 0 : 1];
        const brillo = 0.75 + Math.sin(t * 1.5 + lado) * 0.25;
        const [hx, hy] = en(0, 0.5, wr);
        halo(c, hx, hy, 220, runico, 0.55 * brillo);
        c.lineCap = "round";
        for (const [ancho, col] of [[16, "rgba(115,213,219,0.25)"], [7, runico]]) {
          c.strokeStyle = col;
          c.lineWidth = ancho;
          c.beginPath();
          par.forEach((nombre, j) => {
            const trazos = (FUTHARK.T || FUTHARK.TRAZOS || {})[nombre] || [];
            const z0 = 0.86 - j * 0.36;
            for (const [a, b, d, e] of trazos) {
              const p0 = en(a * 0.7 * (mirando ? 1 : -1), z0 + b * 0.32, wr),
                p1 = en(d * 0.7 * (mirando ? 1 : -1), z0 + e * 0.32, wr);
              c.moveTo(p0[0], p0[1]);
              c.lineTo(p1[0], p1[1]);
            }
          });
          // la atadura: un trazo largo que une las dos
          const p0 = en(0, 0.18, wr),
            p1 = en(0, 0.9, wr);
          c.moveTo(p0[0], p0[1]);
          c.lineTo(p1[0], p1[1]);
          c.stroke();
        }
      };
      const brasero = (lado) => {
        const [bx, by] = pr(lado * (hueco - 50), T + 80, 0);
        ASSETS.dibujar(c, "brasero", bx, by, t, { encendido: true, s: 1.4, sem: lado });
      };
      // de atrás para adelante según la cámara
      const partes = [
        [pr.fondo(-TC, 0), () => torre(-1)],
        [pr.fondo(TC, 0), () => torre(1)],
        [pr.fondo(-hueco * 0.7, -T - hueco * 0.45), () => hoja(-1)],
        [pr.fondo(hueco * 0.7, -T - hueco * 0.45), () => hoja(1)],
        [pr.fondo(0, 0), pasillo],
        [pr.fondo(-TC - 10, -T - 65), () => piedra(-1)],
        [pr.fondo(TC + 10, -T - 65), () => piedra(1)],
        [pr.fondo(-hueco + 50, T + 80), () => brasero(-1)],
        [pr.fondo(hueco - 50, T + 80), () => brasero(1)],
      ];
      partes.sort((a, b) => a[0] - b[0]).forEach((p) => p[1]());
    }
    return { dibujar, alto: 840, ancho: 2 * (TC + T) };
  }
  return { crear };
})();
