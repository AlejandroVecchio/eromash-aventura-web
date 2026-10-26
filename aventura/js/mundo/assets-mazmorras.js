// ---------- lo de adentro de las mazmorras según su estilo: piedras, estalagmitas, estalactitas, cristales y más ----------
// Las piezas que motor/mazmorras.js reparte por las salas de cada estilo (cueva, mina, hielo, raíces, brasas, cripta):
// montones de piedra, estalagmitas, la estalactita que cae, cristales que alumbran, hongos de luz, el entibado y la
// vagoneta de la mina, columnas de hielo, raíces nudosas y la fuente rúnica. Todas en volumen (VOL), caras planas,
// luz de arriba a la derecha, sombra elíptica en el piso.
(function () {
  "use strict";
  const { P, E, alfa } = DIB;
  const TAU = Math.PI * 2;
  const azar = (s) => DIB.azar(Math.round(s * 7919) + 13);
  // los tonos de la piedra de cada estilo: [sombra, base, luz]
  const ROCA = {
    cueva: ["#2E2B28", "#4A4642", "#625C54"],
    cripta: ["#3E3A36", "#55504A", "#6E6860"],
    mina: ["#3A302A", "#54463A", "#6E5E4C"],
    hielo: ["#5A7A90", "#9CC4D8", "#C8F2F4"],
    raices: ["#2A2620", "#423A30", "#5A5040"],
    brasas: ["#1A1614", "#2E2826", "#463C38"],
  };
  const roca = (o) => ROCA[o.estilo] || ROCA.cueva;
  const CRISTAL = { runa: ["#2E7C84", "#73D5DB", "#C8F2F4"], violeta: ["#4A2E7A", "#9A6BD8", "#E0B2B2"], fuego: ["#9C2315", "#FF8D71", "#FFD98A"], hielo: ["#4A78D0", "#C8F2F4", "#F2ECEC"] };

  // ---------- El montón de piedras ----------
  // Piedras caídas del techo, apiladas sin orden: cada una un prisma de borde quebrado, la de arriba más chica.
  function montonPiedras(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      r = azar(o.sem || 1),
      col = roca(o),
      S = VOL.escena(pr),
      n = 4 + Math.floor(r() * 4);
    VOL.sombra(c, pr, 6, 0, 120, 70, 0.45);
    for (let i = 0; i < n; i++) {
      const a = r() * TAU,
        d = i === 0 ? 0 : 30 + r() * 60,
        u = Math.cos(a) * d,
        w = Math.sin(a) * d * 0.7,
        rr = (i === 0 ? 56 : 22 + r() * 30) * (1 - i * 0.04),
        z = i === 0 ? 0 : r() < 0.3 ? 30 : 0,
        k = i;
      S.poner(u, w, () => VOL.prisma(c, pr, VOL.redonda(u, w, rr, 6 + (k % 3), r() * 3, rr * (0.6 + r() * 0.3)), z, z + rr * (0.7 + r() * 0.5), col, { tapa: col[2] }), z);
    }
    S.dibujar();
  }

  // ---------- La estalagmita ----------
  // Un cono de piedra que sube del piso con dos o tres tramos (cada uno más angosto), y otra chica al lado.
  // o.estilo: sus tonos (hielo: transparente y claro); o.alto: cuánto sube.
  function estalagmita(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      r = azar(o.sem || 2),
      col = roca(o),
      h = o.alto || 180 + r() * 120,
      S = VOL.escena(pr);
    VOL.sombra(c, pr, 8, 0, 70, 44, 0.45);
    const una = (u, w, r0, hh, fase) => {
      VOL.prisma(c, pr, VOL.redonda(u, w, r0, 7, fase, r0 * 0.8), 0, hh * 0.22, col, { tapa: col[1] });
      VOL.piramide(c, pr, VOL.redonda(u, w, r0 * 0.82, 7, fase, r0 * 0.66), hh * 0.22, u + r0 * 0.12, w, hh, col);
    };
    S.poner(0, 0, () => una(0, 0, 42, h, r()));
    const u2 = (r() < 0.5 ? -1 : 1) * (40 + r() * 20);
    S.poner(u2, 18, () => una(u2, 18, 20, h * 0.45, r()));
    S.dibujar();
    if (o.estilo === "hielo") {
      const p = pr(-10, 0, h * 0.6);
      alfa(c, 0.5, () => P(c, [p[0], p[1] - 30 * pr.s, p[0] + 5 * pr.s, p[1] - 30 * pr.s, p[0] + 2 * pr.s, p[1] + 30 * pr.s, p[0] - 3 * pr.s, p[1] + 30 * pr.s], "#F2ECEC"));
    }
  }

  // ---------- La estalactita ----------
  // La punta de piedra que cuelga del techo. o.z: a qué altura está su base (cae bajando z); o.estilo: sus tonos.
  function estalactita(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      col = roca(o),
      z = o.z || 0,
      l = o.largo || 150;
    if (z < 260) VOL.sombra(c, pr, 0, 0, 40 * (1 - z / 400) + 10, 26, 0.5 * (1 - z / 400));
    VOL.piramide(c, pr, VOL.redonda(0, 0, 34, 6, 0.3, 28), z + l, 4, 0, z, col);
    VOL.prisma(c, pr, VOL.redonda(0, 0, 36, 6, 0.3, 30), z + l, z + l + 24, col, { tapa: col[2] });
  }

  // ---------- El cristal de la cueva ----------
  // Un racimo de cristales de seis caras con punta, inclinados hacia afuera, que alumbra. o.col: runa, violeta, fuego
  // o hielo.
  function cristalCueva(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      r = azar(o.sem || 3),
      col = CRISTAL[o.col] || CRISTAL.runa,
      S = VOL.escena(pr);
    VOL.sombra(c, pr, 6, 0, 70, 44, 0.4);
    VOL.prisma(c, pr, VOL.redonda(0, 0, 50, 7, 0.4, 36), 0, 18, roca(o), { tapa: roca(o)[1] });
    const n = 4 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + r() * 0.5,
        d = i === 0 ? 0 : 22 + r() * 14,
        u = Math.cos(a) * d,
        w = Math.sin(a) * d * 0.7,
        rr = i === 0 ? 16 : 8 + r() * 6,
        h = i === 0 ? 150 : 50 + r() * 70,
        tu = u * 1.6,
        tw = w * 1.6;
      S.poner(u, w, () => {
        VOL.prisma(c, pr, VOL.redonda(u, w, rr, 6, a), 14, 14 + h * 0.75, col, { tapa: col[2] });
        VOL.piramide(c, pr, VOL.redonda(u, w, rr, 6, a), 14 + h * 0.75, tu * 0.3 + u * 0.7, tw * 0.3 + w * 0.7, 14 + h, col);
      }, 14);
    }
    S.dibujar();
    VOL.halo(c, pr, 0, 0, 90, 90, col[1], 0.32 + 0.08 * Math.sin(t * 2 + x));
  }

  // ---------- Los hongos de luz ----------
  // Tres a cinco hongos de sombrero ancho que alumbran verde (o el color de o.col), sobre un poco de musgo.
  function hongosLuz(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      r = azar(o.sem || 4),
      col = o.col === "violeta" ? ["#4A2E7A", "#9A6BD8", "#E0B2B2"] : ["#2E5A28", "#7BC86C", "#C8F2C0"],
      S = VOL.escena(pr),
      n = 3 + Math.floor(r() * 3);
    VOL.elipse(c, pr, 0, 0, 0, 70, 46, "#2A3A22");
    for (let i = 0; i < n; i++) {
      const a = r() * TAU,
        d = i === 0 ? 0 : 20 + r() * 34,
        u = Math.cos(a) * d,
        w = Math.sin(a) * d * 0.7,
        h = i === 0 ? 70 : 26 + r() * 30,
        rr = h * 0.5;
      S.poner(u, w, () => {
        VOL.cilindro(c, pr, u, w, rr * 0.18, 0, h, ["#A89A88", "#D8CCBA", "#F2ECEC"], { n: 5 });
        VOL.cono(c, pr, u, w, rr, rr * 0.25, h - 2, h + rr * 0.55, col, { n: 7 });
      });
    }
    S.dibujar();
    VOL.halo(c, pr, 0, 0, 40, 70, col[1], 0.3 + 0.08 * Math.sin(t * 1.6 + x));
  }

  // ---------- El entibado de la mina ----------
  // Dos postes gruesos y una viga encima que aguantan el techo, con las cuñas y un farol colgado.
  function entibado(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      MAD = ["#3A2414", "#5A3A22", "#7A5230"],
      S = VOL.escena(pr);
    VOL.sombra(c, pr, 6, 0, 130, 40, 0.4);
    S.poner(-100, 0, () => VOL.caja(c, pr, -112, -12, 0, -88, 12, 230, MAD));
    S.poner(100, 0, () => VOL.caja(c, pr, 88, -12, 0, 112, 12, 230, MAD));
    S.poner(0, 0, () => {
      VOL.caja(c, pr, -128, -16, 230, 128, 16, 258, MAD);
      VOL.caja(c, pr, -88, -10, 212, -70, 10, 230, MAD);
      VOL.caja(c, pr, 70, -10, 212, 88, 10, 230, MAD);
      if (o.farol !== false) {
        VOL.palo(c, pr, 40, 14, 230, 40, 14, 200, 2, "#2A2622");
        VOL.caja(c, pr, 30, 4, 170, 50, 24, 200, ["#2A2622", "#FFD98A", "#FFE7A8"]);
        VOL.halo(c, pr, 40, 14, 185, 60, "#FFD98A", 0.5);
      }
    }, 230);
    S.dibujar();
  }

  // ---------- La vagoneta ----------
  // El carro de la mina sobre sus ruedas, lleno de piedra con vetas de hierro y ámbar.
  function vagoneta(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      HIE = ["#2A2622", "#4A4440", "#6A625A"],
      r = azar(o.sem || 5);
    VOL.sombra(c, pr, 6, 0, 110, 56, 0.45);
    [[-60, -40], [60, -40], [-60, 40], [60, 40]].forEach(([u, w]) => VOL.cilindro(c, pr, u, w, 18, 0, 24, HIE, { n: 6 }));
    VOL.caja(c, pr, -90, -48, 24, 90, 48, 100, ["#3A2414", "#5A3A22", "#7A5230"], {
      frente: (cc, l, h) => {
        DIB.R(cc, 0, -h, l, 8, "#2A2622");
        DIB.R(cc, 0, -10, l, 8, "#2A2622");
        DIB.R(cc, l * 0.2, -h, 6, h, "#2A2622");
        DIB.R(cc, l * 0.8, -h, 6, h, "#2A2622");
      },
      sinTapa: true,
    });
    for (let i = 0; i < 6; i++) {
      const u = -60 + r() * 120,
        w = -30 + r() * 60,
        rr = 16 + r() * 14;
      VOL.prisma(c, pr, VOL.redonda(u, w, rr, 6, r() * 3), 90, 100 + rr, i % 3 === 0 ? ["#7A5A20", "#FFD98A", "#FFE7A8"] : ROCA.mina, { tapa: ROCA.mina[2] });
    }
  }

  // ---------- La columna de hielo ----------
  // Una columna de hielo que une piso y techo: seis caras, vetas claras y la base ensanchada como agua que se heló.
  function columnaHielo(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      col = ROCA.hielo,
      h = o.alto || 340;
    VOL.sombra(c, pr, 6, 0, 80, 50, 0.35);
    VOL.prisma(c, pr, VOL.redonda(0, 0, 64, 7, 0.2, 50), 0, 30, col, { tapa: col[2] });
    VOL.prisma(c, pr, VOL.redonda(0, 0, 40, 6, 0.5, 32), 30, h, col, {
      pared: (cc, l, hh) => {
        alfa(cc, 0.6, () => DIB.R(cc, l * 0.3, -hh, 4, hh, "#F2ECEC"));
        alfa(cc, 0.35, () => DIB.R(cc, l * 0.6, -hh * 0.8, 3, hh * 0.6, "#F2ECEC"));
      },
    });
    VOL.halo(c, pr, 0, 0, h * 0.5, 80, "#C8F2F4", 0.18);
  }

  // ---------- Las raíces nudosas ----------
  // Raíces gruesas que salen del piso, se arquean y vuelven a entrar, con musgo encima y un hongo chico.
  function raicesNudosas(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      r = azar(o.sem || 6),
      MAD = ["#2A1A10", "#4A3020", "#6A4A30"];
    VOL.sombra(c, pr, 6, 0, 140, 60, 0.4);
    const n = 3 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++) {
      const a = r() * TAU,
        l = 90 + r() * 60,
        u0 = Math.cos(a) * l,
        w0 = Math.sin(a) * l * 0.6,
        u1 = -u0 * 0.3,
        w1 = -w0 * 0.3,
        z = 40 + r() * 50,
        g = 14 + r() * 10;
      VOL.palo(c, pr, u0, w0, 0, (u0 + u1) / 2, (w0 + w1) / 2, z, g, MAD[i % 2 ? 1 : 0]);
      VOL.palo(c, pr, (u0 + u1) / 2, (w0 + w1) / 2, z, u1, w1, 0, g * 0.85, MAD[1]);
      const m = pr((u0 + u1) / 2, (w0 + w1) / 2, z + g * 0.4);
      E(c, m[0], m[1], g * 1.1 * pr.s, g * 0.4 * pr.s, "#3E5A2E");
    }
    VOL.cilindro(c, pr, 20, 30, 3, 0, 18, ["#A89A88", "#D8CCBA", "#F2ECEC"], { n: 5 });
    VOL.cono(c, pr, 20, 30, 14, 4, 16, 26, ["#5E130D", "#C8402D", "#FF8D71"], { n: 6 });
  }

  // ---------- La fuente rúnica ----------
  // Un pozo bajo de piedra con agua quieta y una piedra parada con Laguz que brilla; tomar de ella cura una vez.
  // o.usada: el agua quedó oscura y la runa apagada.
  function fuenteRunica(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      col = roca(o.estilo === "hielo" ? o : { estilo: "cripta" }),
      viva = !o.usada;
    VOL.sombra(c, pr, 6, 0, 130, 80, 0.45);
    VOL.prisma(c, pr, VOL.redonda(0, 10, 110, 10, 0, 74), 0, 46, col, { tapa: col[2] });
    VOL.elipse(c, pr, 0, 10, 46, 90, 58, viva ? "#2E6A7A" : "#1A2226");
    if (viva) {
      const q = pr(0, 10, 46);
      alfa(c, 0.35 + 0.1 * Math.sin(t * 2), () => E(c, q[0] + 10 * pr.s, q[1] - 4 * pr.s, 40 * pr.s, 10 * pr.s, "#C8F2F4"));
    }
    VOL.caja(c, pr, -30, -70, 0, 30, -46, 210, col, {
      frente: (cc, l, h) => window.FUTHARK && FUTHARK.dibujar(cc, "laguz", l / 2, -h * 0.55, 34, viva ? "#73D5DB" : "#2A2622", 4),
    });
    if (viva) VOL.halo(c, pr, 0, -10, 120, 120, "#73D5DB", 0.3 + 0.08 * Math.sin(t * 2.4));
  }

  Object.assign(ASSETS.LISTA, {
    montonPiedras: { f: montonPiedras, vol: true, alto: 110, choque: { r: 60 }, grupo: "zonas" },
    estalagmita: { f: estalagmita, vol: true, alto: 260, choque: { r: 46 }, grupo: "zonas" },
    estalactita: { f: estalactita, vol: true, alto: 180, choque: null, grupo: "zonas" },
    cristalCueva: { f: cristalCueva, vol: true, alto: 170, choque: { r: 48 }, grupo: "zonas" },
    hongosLuz: { f: hongosLuz, vol: true, alto: 110, choque: null, grupo: "zonas" },
    entibado: { f: entibado, vol: true, alto: 260, choque: null, grupo: "zonas" },
    vagoneta: { f: vagoneta, vol: true, alto: 130, choque: { r: 80 }, grupo: "zonas" },
    columnaHielo: { f: columnaHielo, vol: true, alto: 340, choque: { r: 54 }, grupo: "zonas" },
    raicesNudosas: { f: raicesNudosas, vol: true, alto: 100, choque: { r: 70 }, grupo: "zonas" },
    fuenteRunica: { f: fuenteRunica, vol: true, alto: 210, choque: { r: 100 }, grupo: "zonas" },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, { estalactita: { z: 0 }, cristalCueva: { col: "runa" }, estalagmita: { estilo: "cueva" } });
})();
