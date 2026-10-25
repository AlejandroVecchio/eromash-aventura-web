// ---------- lo de los oficios que va en volumen (módulo OFICIOS25) ----------
// La cordelería de Folke: el paseo de las sogas, una hilera larga de caballetes en T con las sogas tendidas de punta a
// punta y la rueda de torcer en la cabecera, todo con sus tres medidas para que gire con la cámara como las casas.
// En el plano u va a lo largo del paseo (la rueda en u = −largo/2) y w de costado.
//   OFICIOS25.paseoSogas(largo, sem) → { dibujar(c, x, y, giro, k, t), alto }
// El río: los dos puentes de tablas (el del este y el del sur), el muelle de los pescadores y sus botes, también en
// volumen; u va a lo largo (del puente, del muelle, del bote) y w de costado.
//   OFICIOS25.puente(largo, ancho, sem) · OFICIOS25.muelle(largo, ancho, sem) · OFICIOS25.bote(largo, sem)
window.OFICIOS25 = (function () {
  "use strict";
  const { P, E, L, alfa, azar } = DIB;
  const C = ASSETS.C;

  function paseoSogas(largo, sem) {
    const L2 = largo / 2,
      n = Math.max(3, Math.round(largo / 180)),
      ZS = 120;
    const SOGAS = [-40, 0, 40];
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      const piezas = [];
      // los caballetes en T
      for (let i = 0; i <= n; i++) {
        const u = -L2 + 80 + ((largo - 120) * i) / n;
        piezas.push([pr.fondo(u, 0), () => {
          DIB.sombra(c, ...pr(u + 10, 0, 0), 40, 16, 0.25);
          const a = pr(u, 0, 0),
            b = pr(u, 0, ZS);
          L(c, a[0], a[1], b[0], b[1], C.maderaSombra, 6);
          const p0 = pr(u, -60, ZS),
            p1 = pr(u, 60, ZS);
          L(c, p0[0], p0[1], p1[0], p1[1], C.madera, 6);
        }]);
      }
      // la rueda de torcer, en la cabecera
      piezas.push([pr.fondo(-L2 + 20, 0), () => {
        const [cx, cy] = pr(-L2 + 20, 0, 110);
        const a = pr(-L2 + 20, -50, 0),
          b = pr(-L2 + 20, 50, 0);
        L(c, a[0], a[1], cx, cy, C.maderaSombra, 6);
        L(c, b[0], b[1], cx, cy, C.maderaSombra, 6);
        // la rueda se ve de canto o de frente según la cámara
        const ancho = Math.abs(pr.mira(1, 0)[0]) * 70 + 8;
        E(c, cx, cy, ancho, 70, C.madera);
        E(c, cx, cy, Math.max(4, ancho - 10), 60, C.maderaSombra);
        const g = t * 1.5 + sem;
        for (let j = 0; j < 4; j++) {
          const a2 = g + (j * Math.PI) / 4;
          L(c, cx - Math.cos(a2) * ancho * 0.85, cy - Math.sin(a2) * 60, cx + Math.cos(a2) * ancho * 0.85, cy + Math.sin(a2) * 60, C.madera, 4);
        }
        E(c, cx, cy, 8, 8, C.hierro);
      }]);
      piezas.sort((a, b) => a[0] - b[0]).forEach((p) => p[1]());
      // las sogas tendidas, que cuelgan un poco entre caballete y caballete
      const r = azar(sem * 11);
      SOGAS.forEach((w, j) => {
        const col = ["#C8A86A", "#B89858", "#D8BC80"][j];
        c.strokeStyle = col;
        c.lineWidth = 3;
        c.beginPath();
        for (let i = 0; i <= n * 4; i++) {
          const s = i / (n * 4),
            u = -L2 + 20 + (largo - 60) * s,
            caida = Math.abs(Math.sin(s * n * Math.PI)) * 14 + r() * 0;
          const p = pr(u, w, ZS + 6 - caida);
          i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]);
        }
        c.stroke();
      });
      // un rollo terminado al pie del último caballete
      const [ox, oy] = pr(L2 - 20, 70, 0);
      E(c, ox, oy - 12, 26, 14, "#C8A86A");
      E(c, ox, oy - 12, 12, 6, "#8A7A5A");
      void P;
    }
    return { dibujar, alto: 200, radio: largo / 2 + 120 };
  }
  // una cara de cuatro puntas en el plano, con el tono según la luz (la normal en el piso: nu, nw)
  function cara(c, pr, pts, nu, nw, tonos) {
    const [nx, ny] = pr.mira(nu, nw);
    if (ny <= 0.01) return false;
    P(c, pts.map((p) => pr(...p)).flat(), nx > 0.25 ? tonos[2] : nx < -0.25 ? tonos[0] : tonos[1]);
    return true;
  }
  const MAD = [C.maderaSombra, C.madera, C.maderaLuz];

  // Un puente de tablas: dos pilas de troncos en cada orilla y dos en el agua, el tablero apenas combado y la baranda
  // de postes con su pasamanos.
  function puente(largo, ancho, sem) {
    const L2 = largo / 2,
      W2 = ancho / 2,
      n = Math.round(largo / 40);
    const z = (u) => 70 + Math.cos((u / L2) * Math.PI * 0.5) * 40;
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      // las pilas (las de atrás primero)
      const pilas = [-0.7, -0.25, 0.25, 0.7].flatMap((f) => [-1, 1].map((l) => [f * L2, l * (W2 - 10)]));
      pilas.sort((a, b) => pr.fondo(...a) - pr.fondo(...b)).forEach(([u, w]) => {
        const a = pr(u, w, -20),
          b = pr(u, w, z(u));
        L(c, a[0], a[1], b[0], b[1], C.troncoSombra || C.maderaSombra, 12);
        alfa(c, 0.35, () => E(c, a[0], a[1], 14, 5 * k, "#1E3A44"));
      });
      // el costado del tablero que se ve
      const lado = pr.mira(0, 1)[1] > 0 ? 1 : -1;
      const borde = [];
      for (let i = 0; i <= n; i++) borde.push(-L2 + (largo * i) / n);
      const costado = [...borde.map((u) => pr(u, lado * W2, z(u))), ...borde.slice().reverse().map((u) => pr(u, lado * W2, z(u) - 24))];
      P(c, costado.flat(), pr.mira(0, lado)[0] > 0.2 ? C.madera : C.maderaSombra);
      // el tablero, tabla por tabla
      for (let i = 0; i < n; i++) {
        const u0 = borde[i],
          u1 = borde[i + 1];
        P(c, [...pr(u0, -W2, z(u0)), ...pr(u1, -W2, z(u1)), ...pr(u1, W2, z(u1)), ...pr(u0, W2, z(u0))], i % 2 ? C.madera : C.maderaLuz);
      }
      // la baranda de los dos lados
      for (const l of [-1, 1]) {
        let ant = null;
        for (const u of borde) {
          const a = pr(u, l * W2, z(u)),
            b = pr(u, l * W2, z(u) + 60);
          L(c, a[0], a[1], b[0], b[1], C.maderaSombra, 4);
          if (ant) L(c, ant[0], ant[1], b[0], b[1], C.madera, 4);
          ant = b;
        }
      }
      void t;
      void sem;
    }
    return { dibujar, alto: 160, radio: largo / 2 + 120 };
  }

  // El muelle de los pescadores: tablas sobre postes que entran al río, bolardos para atar y redes colgadas a secar.
  function muelle(largo, ancho, sem) {
    const L2 = largo / 2,
      W2 = ancho / 2,
      Z = 40;
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      const postes = [];
      for (let u = -L2 + 20; u <= L2; u += 120) for (const l of [-1, 1]) postes.push([u, l * (W2 - 8)]);
      postes.sort((a, b) => pr.fondo(...a) - pr.fondo(...b)).forEach(([u, w]) => {
        const a = pr(u, w, -30),
          b = pr(u, w, Z + 30);
        L(c, a[0], a[1], b[0], b[1], C.maderaSombra, 9);
      });
      // los costados y la punta
      cara(c, pr, [[-L2, W2, Z], [L2, W2, Z], [L2, W2, Z - 16], [-L2, W2, Z - 16]], 0, 1, MAD);
      cara(c, pr, [[L2, -W2, Z], [-L2, -W2, Z], [-L2, -W2, Z - 16], [L2, -W2, Z - 16]], 0, -1, MAD);
      cara(c, pr, [[L2, W2, Z], [L2, -W2, Z], [L2, -W2, Z - 16], [L2, W2, Z - 16]], 1, 0, MAD);
      const n = Math.round(largo / 30);
      for (let i = 0; i < n; i++) {
        const u0 = -L2 + (largo * i) / n,
          u1 = -L2 + (largo * (i + 1)) / n;
        P(c, [...pr(u0, -W2, Z), ...pr(u1, -W2, Z), ...pr(u1, W2, Z), ...pr(u0, W2, Z)], i % 3 ? C.madera : C.maderaLuz);
      }
      // los bolardos y la soga a los botes
      for (const [u, l] of [[L2 * 0.2, 1], [L2 * 0.8, -1], [L2 * 0.8, 1]]) {
        const a = pr(u, l * (W2 - 12), Z),
          b = pr(u, l * (W2 - 12), Z + 26);
        L(c, a[0], a[1], b[0], b[1], C.maderaSombra, 8);
        E(c, b[0], b[1], 5, 3, C.madera);
      }
      // la red colgada a secar entre dos varas, cerca de la orilla
      const a = pr(-L2 + 40, -W2 + 10, Z),
        b = pr(-L2 + 160, -W2 + 10, Z);
      const a2 = [a[0], a[1] - 90],
        b2 = [b[0], b[1] - 90];
      L(c, a[0], a[1], a2[0], a2[1], C.maderaSombra, 4);
      L(c, b[0], b[1], b2[0], b2[1], C.maderaSombra, 4);
      alfa(c, 0.55, () => {
        c.strokeStyle = "#8A7A5A";
        c.lineWidth = 1.2;
        c.beginPath();
        for (let i = 0; i <= 8; i++) {
          const f = i / 8,
            px = a2[0] + (b2[0] - a2[0]) * f,
            py = a2[1] + (b2[1] - a2[1]) * f + Math.sin(f * Math.PI) * 14;
          c.moveTo(px, py);
          c.lineTo(px + (Math.sin(t + i) * 2), py + 60 - Math.sin(f * Math.PI) * 8);
        }
        for (let j = 0; j <= 4; j++) {
          c.moveTo(a2[0], a2[1] + j * 14);
          c.quadraticCurveTo((a2[0] + b2[0]) / 2, (a2[1] + b2[1]) / 2 + j * 14 + 14, b2[0], b2[1] + j * 14);
        }
        c.stroke();
      });
      void sem;
    }
    return { dibujar, alto: 140, radio: largo / 2 + 160 };
  }

  // Un bote de pescador (un færing): casco de tablas con proa y popa en punta, la borda clara y los remos adentro;
  // se mece apenas en el agua.
  function bote(largo, sem) {
    const L2 = largo / 2,
      r = azar(sem * 17 + 2),
      manga = 55 + r() * 15,
      col = [["#4A3626", "#6B4E36", "#8A6A48"], ["#3A2E28", "#5A4636", "#7A6250"], ["#5A2A1E", "#7A3A28", "#9C5A3A"]][Math.floor(r() * 3)];
    const N = 10;
    const perfil = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N,
        u = -L2 + largo * s,
        b = manga * Math.sin(s * Math.PI) ** 0.7;
      perfil.push([u, b, 46 + Math.abs(s - 0.5) * 50]);
    }
    function dibujar(c, x, y, giro, k, t) {
      const mece = Math.sin(t * 1.3 + sem) * 3;
      const pr0 = CASAS25.proyector(x, y + mece, giro, k);
      const pr = Object.assign((u, w, z) => pr0(u, w, z), pr0);
      alfa(c, 0.3, () => E(c, x, y + 6, (Math.abs(Math.cos(giro)) * largo) / 2 + 20, ((Math.abs(Math.sin(giro)) * largo) / 2) * k + 18, "#10262E"));
      // el costado que se ve, del agua a la borda
      for (const l of [1, -1]) {
        if (pr.mira(0, l)[1] <= 0) continue;
        const pts = [...perfil.map(([u, b, z]) => pr(u, l * b, z)), ...perfil.slice().reverse().map(([u, b]) => pr(u, l * b * 0.55, 0))];
        P(c, pts.flat(), pr.mira(0, l)[0] > 0.2 ? col[1] : col[0]);
        // la juntura de las tablas
        c.strokeStyle = "rgba(0,0,0,0.22)";
        c.lineWidth = 2;
        c.beginPath();
        perfil.forEach(([u, b, z], i) => {
          const p = pr(u, l * b * 0.8, z * 0.55);
          i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]);
        });
        c.stroke();
      }
      // adentro, oscuro, y la borda clara
      P(c, perfil.map(([u, b, z]) => pr(u, b, z)).concat(perfil.slice().reverse().map(([u, b, z]) => pr(u, -b, z))).flat(), "#2A2018");
      for (const l of [1, -1]) {
        c.strokeStyle = col[2];
        c.lineWidth = 4;
        c.beginPath();
        perfil.forEach(([u, b, z], i) => {
          const p = pr(u, l * b, z);
          i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]);
        });
        c.stroke();
      }
      // los bancos y los remos
      for (const f of [-0.25, 0.2]) {
        const a = pr(f * L2, -manga * 0.9, 40),
          b = pr(f * L2, manga * 0.9, 40);
        L(c, a[0], a[1], b[0], b[1], col[2], 5);
      }
      const r0 = pr(-L2 * 0.6, -10, 46),
        r1 = pr(L2 * 0.5, 14, 46);
      L(c, r0[0], r0[1], r1[0], r1[1], C.maderaLuz, 3);
    }
    return { dibujar, alto: 120, radio: largo / 2 + 60 };
  }

  return { paseoSogas, puente, muelle, bote };
})();
