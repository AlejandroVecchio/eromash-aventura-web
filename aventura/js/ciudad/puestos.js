// ---------- los puestos del Mercado de los Toldos (módulo PUESTOS25) ----------
// Puestos grandes de madera, cada uno con sus tres medidas como las casas (CASAS25) y dibujado desde el ángulo de la
// cámara: cuatro postes, el toldo de lona a franjas que baja hacia el frente con su faldón recortado, el mostrador que
// asoma adelante con la mercadería, lo que cuelga del alero y los cajones, barriles y bolsas de alrededor. Las lonas
// son las del compendio (ocre, verde apagado, azul humo, rojo óxido). Cada puesto vende otra cosa: lo de Eldervald
// (hongos, pescado ahumado, pieles, hierbas, cerámica, sogas) y lo de otros reinos (obsidiana y sales de ceniza,
// lingotes de montaña, tallas de hueso, sal y pescado salado de la costa).
// PUESTOS25.crear(semilla, vende) → { dibujar(c, x, y, giro, k, t), huella(x, y, ry), W, D, alto }
window.PUESTOS25 = (function () {
  "use strict";
  const { P, E, R, L, alfa, azar, sombra } = DIB;
  const C = ASSETS.C;
  const LONAS = [
    ["#B8A47A", "#8A7650"], // ocre
    ["#5E6A4A", "#46523A"], // verde apagado
    ["#5A6A7A", "#44525E"], // azul humo
    ["#8A4A32", "#6A3624"], // rojo óxido
    ["#C8B48C", "#8A4A32"], // ocre y óxido
    ["#B8A47A", "#5A6A7A"], // ocre y humo
  ];
  const VENDE = ["hongos", "pescado", "pieles", "hierbas", "ceramica", "sogas", "obsidiana", "lingotes", "hueso", "sal"];

  // una caja (de u0 a u1, de w0 a w1, de z0 a z1): las caras que miran a la cámara, con su luz de arriba a la derecha
  function caja(c, pr, u0, u1, w0, w1, z0, z1, col, colLuz, colArriba, colSombra) {
    const caras = [
      [[u0, w1], [u1, w1], 0, 1],
      [[u1, w1], [u1, w0], 1, 0],
      [[u1, w0], [u0, w0], 0, -1],
      [[u0, w0], [u0, w1], -1, 0],
    ];
    for (const [[au, aw], [bu, bw], nu, nw] of caras) {
      const [nx, ny] = pr.mira(nu, nw);
      if (ny <= 0.01) continue;
      const a0 = pr(au, aw, z0),
        b0 = pr(bu, bw, z0),
        b1 = pr(bu, bw, z1),
        a1 = pr(au, aw, z1);
      P(c, [...a0, ...b0, ...b1, ...a1], nx > 0.3 ? colLuz : nx < -0.3 ? colSombra || col : col);
    }
    const t = [pr(u0, w0, z1), pr(u1, w0, z1), pr(u1, w1, z1), pr(u0, w1, z1)];
    P(c, [].concat(...t), colArriba || colLuz);
  }

  function crear(sem, vende) {
    const r = azar(sem * 31 + 7);
    const W = 300 + r() * 80,
      D = 200 + r() * 40,
      H = 175 + r() * 15,
      W2 = W / 2,
      D2 = D / 2;
    const lona = LONAS[sem % LONAS.length];
    vende = vende || VENDE[sem % VENDE.length];
    const S = 1.7;

    // la mercadería sobre el mostrador: cosas chicas paradas en su lugar del tablero
    function mercaderia(c, pr, t) {
      const n = 7;
      for (let i = 0; i < n; i++) {
        const u = -W2 + 30 + ((i + 0.5) * (W - 60)) / n,
          [x, y] = pr(u, D2 + 4, 92);
        const k = (sem + i) % 3;
        if (vende === "hongos") {
          R(c, x - 2 * S, y - 7 * S, 4 * S, 7 * S, "#E8DCC4");
          P(c, [x - 8 * S, y - 6 * S, x - 4 * S, y - 13 * S, x + 4 * S, y - 13 * S, x + 8 * S, y - 6 * S], k ? "#E8B04A" : C.ambar);
        } else if (vende === "pescado") {
          P(c, [x - 10 * S, y - 3 * S, x + 6 * S, y - 7 * S, x + 10 * S, y - 3 * S, x + 6 * S, y], k ? "#8A9CA8" : "#A08A6A");
          P(c, [x + 10 * S, y - 3 * S, x + 15 * S, y - 7 * S, x + 15 * S, y + 1 * S], "#6A7C88");
        } else if (vende === "pieles") {
          P(c, [x - 12 * S, y, x - 9 * S, y - 9 * S, x + 9 * S, y - 10 * S, x + 12 * S, y], ["#8A6A4A", "#C8B49A", "#5E4A36"][k]);
        } else if (vende === "hierbas") {
          for (let j = -1; j <= 1; j++) P(c, [x + j * 5 * S - 3 * S, y, x + j * 5 * S, y - (10 + k * 3) * S, x + j * 5 * S + 3 * S, y], j ? C.musgoClaro : C.musgo2);
        } else if (vende === "ceramica") {
          const col = ["#A0583A", "#B86A44", "#8A4A30"][k];
          P(c, [x - 7 * S, y, x - 9 * S, y - 8 * S, x - 4 * S, y - 14 * S, x + 4 * S, y - 14 * S, x + 9 * S, y - 8 * S, x + 7 * S, y], col);
          R(c, x - 5 * S, y - 16 * S, 10 * S, 2 * S, "#6A3624");
        } else if (vende === "sogas") {
          E(c, x, y - 5 * S, 9 * S, 5 * S, "#C8A86A");
          E(c, x, y - 5 * S, 4 * S, 2 * S, "#8A7A5A");
        } else if (vende === "obsidiana") {
          P(c, [x - 6 * S, y, x - 3 * S, y - 10 * S, x + 2 * S, y - 12 * S, x + 6 * S, y], "#1C1C22");
          P(c, [x - 1 * S, y - 11 * S, x + 2 * S, y - 12 * S, x + 6 * S, y, x + 1 * S, y], "#3A3A48");
        } else if (vende === "lingotes") {
          P(c, [x - 10 * S, y, x - 8 * S, y - 5 * S, x + 8 * S, y - 5 * S, x + 10 * S, y], k ? "#8A8E92" : "#B87A4A");
          R(c, x - 8 * S, y - 6 * S, 16 * S, 1.5 * S, "#C8CCD0");
        } else if (vende === "hueso") {
          P(c, [x - 4 * S, y, x - 5 * S, y - 12 * S, x, y - 16 * S, x + 5 * S, y - 12 * S, x + 4 * S, y], C.hueso);
        } else {
          E(c, x, y - 4 * S, 8 * S, 5 * S, "#E8E4DC");
          E(c, x + 2 * S, y - 6 * S, 4 * S, 2 * S, "#F6F4F0");
        }
      }
    }
    // lo que cuelga del alero del frente
    function colgado(c, pr, t) {
      for (let i = 0; i < 6; i++) {
        const u = -W2 + 40 + (i * (W - 80)) / 5,
          [x, y] = pr(u, D2 - 26, H - 26);
        const v = Math.sin(t * 1.6 + i + sem) * 1.2 * S;
        L(c, x, y, x + v, y + 12 * S, "#3A2A1E", 1.2 * S);
        if (vende === "pescado" || vende === "sal") P(c, [x + v - 3 * S, y + 12 * S, x + v + 3 * S, y + 12 * S, x + v + 1 * S, y + 30 * S, x + v - 1 * S, y + 30 * S], "#8A7A5A");
        else if (vende === "hierbas" || vende === "hongos") P(c, [x + v - 5 * S, y + 12 * S, x + v + 5 * S, y + 12 * S, x + v, y + 28 * S], i % 2 ? C.musgo2 : C.musgoClaro);
        else if (vende === "pieles") P(c, [x + v - 7 * S, y + 12 * S, x + v + 7 * S, y + 12 * S, x + v + 5 * S, y + 34 * S, x + v - 5 * S, y + 34 * S], i % 2 ? "#8A6A4A" : "#C8B49A");
        else if (vende === "sogas") E(c, x + v, y + 20 * S, 7 * S, 8 * S, "#C8A86A");
        else E(c, x + v, y + 16 * S, 3 * S, 3 * S, C.ambar);
      }
    }
    function dibujar(c, x, y, giro, k, t) {
      const pr = CASAS25.proyector(x, y, giro, k);
      const rx = (Math.abs(Math.cos(giro)) * W + Math.abs(Math.sin(giro)) * D) / 2;
      sombra(c, x + 20, y + 6, rx * 1.2 + 20, ((Math.abs(Math.sin(giro)) * W + Math.abs(Math.cos(giro)) * D) / 2) * k + 24, 0.34);
      const frente = pr.mira(0, 1)[1] > 0;
      // los cajones y barriles de atrás y de un costado
      const atras = () => {
        caja(c, pr, -W2 + 20, -W2 + 90, -D2 + 10, -D2 + 70, 0, 60, C.madera, C.maderaLuz, "#8A6A48", C.maderaSombra);
        caja(c, pr, -W2 + 100, -W2 + 160, -D2 + 10, -D2 + 60, 0, 50, C.maderaVieja, C.madera, "#7A5A3A", C.maderaSombra);
        const [bx, by] = pr(W2 + 40, -D2 + 40, 0);
        sombra(c, bx + 4, by + 2, 22, 7, 0.3);
        P(c, [bx - 18, by, bx - 20, by - 50, bx + 20, by - 50, bx + 18, by], C.madera);
        P(c, [bx + 4, by, bx + 4, by - 50, bx + 20, by - 50, bx + 18, by], C.maderaLuz);
        R(c, bx - 20, by - 40, 40, 4, C.hierro);
        R(c, bx - 20, by - 14, 40, 4, C.hierro);
        E(c, bx, by - 50, 20, 6, "#8A6A48");
      };
      const postes = (lado) => {
        [[-W2 + 12, lado], [W2 - 12, lado]].forEach(([u, w]) => {
          const a = pr(u, w, 0),
            b = pr(u, w, w > 0 ? H - 20 : H + 40);
          L(c, a[0], a[1], b[0], b[1], u > 0 ? C.madera : C.maderaSombra, 6 * S);
        });
      };
      // el mostrador que asoma adelante, con su tablero y la mercadería
      const mostrador = () => {
        caja(c, pr, -W2 + 10, W2 - 10, D2 - 30, D2 + 24, 0, 88, C.madera, C.maderaLuz, "#8A6A48", C.maderaSombra);
        const a = pr(-W2 + 4, D2 + 30, 92),
          b = pr(W2 - 4, D2 + 30, 92),
          d = pr(W2 - 4, D2 - 34, 92),
          e = pr(-W2 + 4, D2 - 34, 92);
        P(c, [...a, ...b, ...d, ...e], "#9A7448");
        mercaderia(c, pr, t);
      };
      // el toldo: baja de atrás hacia el frente, a franjas, con el faldón recortado adelante
      const toldo = () => {
        const n = 6;
        for (let i = 0; i < n; i++) {
          const u0 = -W2 - 20 + (i * (W + 40)) / n,
            u1 = u0 + (W + 40) / n;
          const q = [pr(u0, D2 - 10, H - 20), pr(u1, D2 - 10, H - 20), pr(u1, -D2 - 20, H + 50), pr(u0, -D2 - 20, H + 50)];
          P(c, [].concat(...q), lona[i % 2]);
        }
        // el faldón: lengüetas que cuelgan del borde de adelante
        for (let i = 0; i < 8; i++) {
          const u0 = -W2 - 20 + (i * (W + 40)) / 8,
            u1 = u0 + (W + 40) / 8,
            um = (u0 + u1) / 2;
          const a = pr(u0, D2 - 10, H - 20),
            b = pr(u1, D2 - 10, H - 20),
            m = pr(um, D2 - 10, H - 46),
            q0 = pr(u0, D2 - 10, H - 36),
            q1 = pr(u1, D2 - 10, H - 36);
          P(c, [...a, ...b, ...q1, ...m, ...q0], lona[(i + 1) % 2]);
        }
        const a = pr(-W2 - 20, D2 - 10, H - 20),
          b = pr(W2 + 20, D2 - 10, H - 20);
        L(c, a[0], a[1], b[0], b[1], C.maderaSombra, 4 * S);
      };
      if (frente) {
        atras();
        postes(-D2 + 10);
        colgado(c, pr, t);
        postes(D2 - 10);
        mostrador();
        toldo();
      } else {
        mostrador();
        postes(D2 - 10);
        postes(-D2 + 10);
        toldo();
        atras();
      }
    }
    function huella(x, y, ry) {
      const co = Math.cos(ry),
        si = Math.sin(ry);
      const pt = (u, w) => [x + u * co - w * si, y + u * si + w * co];
      return [pt(-W2, -D2), pt(W2, -D2), pt(W2, D2 + 30), pt(-W2, D2 + 30)];
    }
    return { dibujar, huella, W, D, alto: H + 60, vende };
  }
  return { crear, VENDE, LONAS };
})();
