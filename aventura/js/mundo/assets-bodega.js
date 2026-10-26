// ---------- lo de adentro de la bodega del Hongo Dorado (assets armados con caras) ----------
// La bodega de Ulf bajo la taberna (motor/bodega.js), donde está la puerta de piedra de Góinn: la cuba grande de la
// hidromiel del invierno largo acostada en su cuna, el estante de los toneles, el colgadero de jamones, chorizos y
// trenzas de cebolla, el aljibe con su balde, la escalera que baja de la trampilla, las raíces que atraviesan la pared
// vieja y la mesa de catar de Ulf. Todo en volumen para verse desde cualquier ángulo. La gente mide unos 230.
(function () {
  "use strict";
  const { R, E, L, P, alfa } = DIB;
  const MC = ["#3A1A10", "#5A2A16", "#7A3E20"],
    MCL = ["#5A3E22", "#7A5634", "#9A7448"],
    DUELA = ["#4A2C18", "#6A4228", "#8A5A36"],
    ARO = ["#1E1A1C", "#2E2A2C", "#4A4448"],
    PI = ["#3E3842", "#4E4852", "#66606A"],
    PIV = ["#2E2A2E", "#3E3A40", "#55505A"],
    RAIZ = ["#2A1A10", "#3E2A1A", "#5A4028"],
    ORO = "#FFD98A",
    RUNA = "#73D5DB";
  const calidad = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  const fiDe = (o) => (o && o.fi != null ? o.fi : (((o && o.giro) || 0) * Math.PI) / 180 + VOL.cam.g);
  // un proyector girado un cuarto de vuelta en (u, w) del objeto: para acostar barriles mirando al frente
  function girado(pr, o, u, w, q = Math.PI / 2) {
    const s = pr(u, w, 0);
    return VOL.proyector(s[0], s[1], fiDe(o) + q, { s: pr.s });
  }
  // un barril acostado a lo largo de u, con sus aros de hierro y la tapa de duelas
  function barril(c, pr, u0, u1, w, z, r, op = {}) {
    const n = op.n || 10,
      l = u1 - u0;
    VOL.rollo(c, pr, u0, u1, w, z, r, DUELA, { n, corte: "#7A5034" });
    // los aros: solo sus bandas (sin tapa, para no tapar la del barril)
    for (const f of [0.12, 0.36, 0.64, 0.88]) VOL.rollo(c, pr, u0 + l * f - 5, u0 + l * f + 5, w, z, r * 1.03, ARO, { n, corte: "rgba(0,0,0,0)" });
  }

  // ---------- La cuba de Ulf ----------
  // La hidromiel del año del invierno largo: una cuba enorme acostada en una cuna de vigas, con aros de hierro, la
  // canilla de bronce en la punta, un balde debajo y la marca de tiza de Ulf (Jera: «cuando vuelva el ciervo»).
  // o.gotea: la canilla deja caer una gota de vez en cuando.
  function cubaUlf(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      g = girado(pr, o, 0, 0); // la cuba va de atrás hacia adelante: +u de g es el frente
    VOL.sombra(c, pr, 0, 20, 130, 250, 0.45);
    S.poner(0, 0, () => {
      // la cuna: dos vigas con muescas
      for (const w of [-130, 130]) {
        VOL.caja(c, pr, -120, w - 22, 0, 120, w + 22, 40, MC, { tapa: "#7A3E20" });
        VOL.caja(c, pr, -110, w - 18, 40, -70, w + 18, 80, MC);
        VOL.caja(c, pr, 70, w - 18, 40, 110, w + 18, 80, MC);
      }
      barril(c, g, -210, 210, 0, 140, 110, { n: 12 });
      // en la tapa del frente: la Jera de tiza, la canilla de bronce y el balde
      if (g.mira(1, 0)[1] > 0) {
        const q = g(212, 0, 180);
        FUTHARK.dibujar(c, "jera", q[0], q[1], 44 * pr.s, "#E8E0D0", 3 * pr.s);
      }
      VOL.palo(c, g, 210, 0, 80, 250, 0, 80, 6, "#B8863A");
      VOL.palo(c, g, 246, 0, 80, 246, 0, 64, 5, "#B8863A");
    });
    S.poner(0, 250, () => {
      VOL.cilindro(c, pr, 0, 250, 30, 0, 46, DUELA, { n: 8, tapa: "#2A1A10" });
      VOL.cilindro(c, pr, 0, 250, 32, 30, 36, ARO, { n: 8 });
      if (o.gotea !== false) {
        const f = (t * 0.7) % 1;
        if (f < 0.6) {
          const q = g(246, 0, 62 - f * 30);
          E(c, q[0], q[1], 2.5 * pr.s, 3.5 * pr.s, ORO);
        }
      }
    });
    S.dibujar();
  }

  // ---------- El estante de los toneles ----------
  // Un armazón de vigas con dos pisos de toneles acostados mirando al frente, cada uno con su tapón y su marca, y
  // jarras de barro en lo alto. o.sem cambia las marcas.
  function estanteToneles(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      r = DIB.azar(Math.round((o.sem || 3) * 97));
    VOL.sombra(c, pr, 0, 10, 260, 80, 0.4);
    S.poner(0, 0, () => {
      // el armazón
      for (const u of [-230, -77, 77, 230])
        for (const w of [-50, 50]) VOL.caja(c, pr, u - 9, w - 9, 0, u + 9, w + 9, 300, MC);
      for (const z of [10, 150, 290]) VOL.caja(c, pr, -240, -58, z, 240, 58, z + 12, MCL, { tapa: "#9A7448" });
      // los toneles acostados, la tapa hacia el frente
      for (const [z, cuantos] of [[22, 3], [162, 3]])
        for (let k = 0; k < cuantos; k++) {
          const u = -154 + k * 154,
            g = girado(pr, o, u, 0);
          barril(c, g, -56, 56, 0, z + 62, 60, { n: 10 });
          // el tapón de la tapa del frente
          if (g.mira(1, 0)[1] > 0) {
            const q = g(58, 0, z + 40);
            E(c, q[0], q[1], 6 * pr.s, 5 * pr.s, "#2A1A10");
            if (r() < 0.6) FUTHARK.dibujar(c, ["fehu", "jera", "ansuz", "kenaz"][Math.floor(r() * 4)], q[0], q[1] - 26 * pr.s, 20 * pr.s, "#E8E0D0", 2 * pr.s);
          }
        }
      // jarras de barro arriba
      for (const u of [-180, -110, 60, 170]) {
        VOL.cilindro(c, pr, u, 0, 26, 302, 350, ["#7A4A30", "#9A6040", "#B87A54"], { n: 8, rw: 24 });
        VOL.cilindro(c, pr, u, 0, 14, 350, 366, ["#7A4A30", "#9A6040", "#B87A54"], { n: 8, tapa: "#3A2418" });
      }
    });
    S.dibujar();
  }

  // ---------- El colgadero ----------
  // Dos postes y una viga de la que cuelgan jamones, ristras de chorizos, trenzas de cebolla y un atado de hierbas;
  // abajo, un cesto con nabos. Lo colgado se mece apenas (o.mece).
  function colgadero(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      m = o.mece === false ? 0 : Math.sin(t * 1.3) * 4;
    VOL.sombra(c, pr, 0, 0, 210, 60, 0.35);
    S.poner(0, 0, () => {
      for (const u of [-190, 190]) VOL.caja(c, pr, u - 12, -12, 0, u + 12, 12, 330, MC, { tapa: "#7A3E20" });
      VOL.caja(c, pr, -205, -10, 320, 205, 10, 340, MCL, { tapa: "#9A7448" });
      // jamones: un gancho, la soga y el jamón en forma de pera
      for (const u of [-130, 40]) {
        VOL.palo(c, pr, u, 0, 320, u + m, 0, 280, 2, "#C8B890");
        const JA = ["#7A2A1E", "#9A3A28", "#B85A40"];
        VOL.cono(c, pr, u + m, 0, 26, 40, 176, 196, JA, { n: 8 });
        VOL.cono(c, pr, u + m, 0, 40, 16, 196, 266, JA, { n: 8 });
        VOL.cilindro(c, pr, u + m, 0, 8, 262, 284, ["#C8B890", "#E0D4B0", "#F0E8D0"], { n: 6 });
      }
      // ristra de chorizos
      for (let k = 0; k < 5; k++) {
        const z = 310 - k * 26,
          du = Math.sin(k * 1.2) * 6 + m;
        VOL.cilindro(c, pr, -40 + du, 0, 9, z - 22, z, ["#6A1E14", "#8A2A1A", "#A83A26"], { n: 6 });
      }
      // trenzas de cebolla
      for (const u0 of [110, 150]) {
        VOL.palo(c, pr, u0, 0, 320, u0 + m, 0, 200, 3, "#C8A060");
        for (let k = 0; k < 6; k++) VOL.cubo(c, pr, u0 + m + (k % 2 ? 8 : -8), 0, 18, 18, 18, ["#9A6A30", "#C8903A", "#E0B060"], null, 210 + k * 18);
      }
      // el atado de hierbas
      VOL.palo(c, pr, -170, 0, 320, -170 + m, 0, 260, 2, "#C8B890");
      for (let k = -2; k <= 2; k++) VOL.palo(c, pr, -170 + m, 0, 262, -170 + m + k * 8, 0, 200, 3, k % 2 ? "#6F8F4E" : "#4E6B3A");
    });
    // el cesto de nabos al pie
    S.poner(-60, 60, () => {
      VOL.cilindro(c, pr, -60, 60, 40, 0, 50, ["#6A4A28", "#8A6A3A", "#A8844A"], { n: 9, tapa: "#3A2A18" });
      for (const [du, dw] of [[-14, -6], [10, -10], [0, 10], [16, 8]]) VOL.cubo(c, pr, -60 + du, 60 + dw, 16, 16, 14, ["#C8B0C0", "#E0C8D8", "#F0E0E8"], null, 48);
    });
    S.dibujar();
  }

  // ---------- El aljibe ----------
  // Un brocal redondo de piedra con el agua negra adentro (un reflejo que tiembla), dos postes, el rodillo con la soga
  // y el balde apoyado en el borde. o.balde = 0..1 lo baja.
  function aljibe(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      alta = calidad() !== "baja";
    VOL.sombra(c, pr, 0, 0, 120, 80, 0.4);
    S.poner(0, 0, () => {
      VOL.cilindro(c, pr, 0, 0, 100, 0, 90, PI, { n: 12, tapa: "#55505A" });
      VOL.cilindro(c, pr, 0, 0, 74, 89, 91, ["#0E1418", "#0E1418", "#141E24"], { n: 12, tapa: "#0E1418" });
      if (alta) {
        const q = pr(-18, -10, 92),
          a = 0.25 + 0.15 * Math.sin(t * 2.1);
        alfa(c, a, () => E(c, q[0], q[1], 26 * pr.s, 6 * pr.s, "#4A78A0"));
      }
      for (const u of [-96, 96]) VOL.caja(c, pr, u - 10, -10, 90, u + 10, 10, 250, MC);
      VOL.rollo(c, pr, -100, 100, 0, 230, 12, MCL, { corte: "#9A7448" });
      VOL.palo(c, pr, 96, 0, 230, 130, 0, 200, 4, "#7A5634");
      const b = Math.max(0, Math.min(1, o.balde || 0)),
        zb = 120 - b * 140;
      VOL.palo(c, pr, 0, 0, 220, 0, 0, zb + 44, 2, "#C8B890");
      if (b < 0.6) {
        VOL.cono(c, pr, 0, 0, 22, 28, zb, zb + 40, ["#4A2C18", "#6A4228", "#8A5A36"], { n: 8, tapa: "#2A1A10" });
        VOL.palo(c, pr, -26, 0, zb + 40, 26, 0, zb + 40, 2, "#2E2A2C");
      }
    });
    S.dibujar();
  }

  // ---------- La escalera de la bodega ----------
  // Los escalones de tablas que bajan de la trampilla de la barra, apoyados en la pared, con su pasamanos de soga y
  // un farol colgado en el primer poste. Sube hacia u−.
  function escaleraBodega(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      N = 8,
      paso = 46,
      alto = 46;
    VOL.sombra(c, pr, -160, 0, 220, 80, 0.35);
    S.poner(0, 0, () => {
      // la zanca de atrás contra la pared y los escalones
      VOL.caja(c, pr, -N * paso, -72, 0, 20, -60, N * alto, MC);
      for (let i = 0; i < N; i++) {
        const u1 = 20 - i * paso,
          z = (i + 1) * alto;
        VOL.caja(c, pr, u1 - paso - 6, -60, z - 10, u1, 60, z, MCL, { tapa: "#9A7448" });
        VOL.caja(c, pr, u1 - 12, 52, 0, u1 - 2, 62, z - 10, MC);
      }
      // la zanca de adelante, inclinada
      VOL.palo(c, pr, 20, 64, 0, -N * paso, 64, N * alto, 6, "#3A1A10");
      // el poste con el farol y el pasamanos de soga
      VOL.caja(c, pr, 2, 56, 0, 22, 76, 260, MC, { tapa: "#7A3E20" });
      VOL.palo(c, pr, 12, 66, 250, -N * paso, 66, N * alto + 160, 3, "#C8B890");
      VOL.palo(c, pr, 12, 66, 250, 12, 100, 250, 3, "#2E2A2C");
      VOL.cubo(c, pr, 12, 100, 20, 20, 30, ["#2E2A2C", "#3E3A3E", "#55505A"], null, 200);
      const q = pr(12, 100, 214);
      E(c, q[0], q[1], 6 * pr.s, 8 * pr.s, ORO);
      if (calidad() !== "baja") VOL.halo(c, pr, 12, 100, 214, 80, ORO, 0.35 + 0.05 * Math.sin(t * 5));
    });
    S.dibujar();
  }

  // ---------- Las raíces de la pared vieja ----------
  // Raíces gruesas que salen de entre las piedras viejas, bajan y se meten en el piso, con algún brote pálido; de
  // noche o cerca de la puerta de piedra laten con un punto de luz rúnica (o.late = 0..1).
  function raicesViejas(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      r = DIB.azar(Math.round((o.sem || 5) * 131));
    S.poner(0, 0, () => {
      for (let k = 0; k < 6; k++) {
        let u = -150 + k * 60 + r() * 20,
          w = -20,
          z = 200 + r() * 120;
        const g = 10 + r() * 8;
        for (let s = 0; s < 5; s++) {
          const u2 = u + (r() - 0.5) * 50,
            w2 = w + 14 + r() * 16,
            z2 = Math.max(0, z - 30 - r() * 40);
          VOL.palo(c, pr, u, w, z, u2, w2, z2, g * (1 - s * 0.12), RAIZ[s % 3]);
          ((u = u2), (w = w2), (z = z2));
        }
        if (o.late && r() < 0.6) {
          const q = pr(u, w, z + 6);
          alfa(c, o.late * (0.5 + 0.5 * Math.sin(t * 2 + k)), () => E(c, q[0], q[1], 4 * pr.s, 4 * pr.s, RUNA));
        }
      }
      // brotes pálidos
      for (let k = 0; k < 4; k++) VOL.palo(c, pr, -120 + k * 80, 30, 0, -126 + k * 80, 30, 26 + r() * 20, 2, "#C8C0A8");
    });
    S.dibujar();
  }

  // ---------- La mesa de catar ----------
  // La mesita de Ulf al pie de la cuba: un tablón sobre dos barricas, la jarra de hidromiel, dos cuernos de beber, la
  // vela en un plato y un taburete. o.vela.
  function mesaCata(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr);
    VOL.sombra(c, pr, 0, 0, 150, 70, 0.4);
    S.poner(0, 0, () => {
      for (const u of [-90, 90]) {
        VOL.cilindro(c, pr, u, 0, 40, 0, 96, DUELA, { n: 10, tapa: "#7A5034" });
        VOL.cilindro(c, pr, u, 0, 42, 20, 26, ARO, { n: 10 });
        VOL.cilindro(c, pr, u, 0, 42, 70, 76, ARO, { n: 10 });
      }
      VOL.caja(c, pr, -150, -50, 96, 150, 50, 112, MCL, { tapa: "#9A7448" });
      // la jarra
      VOL.cilindro(c, pr, -40, -6, 20, 112, 160, ["#7A4A30", "#9A6040", "#B87A54"], { n: 8 });
      VOL.palo(c, pr, -20, -6, 150, -6, -6, 130, 4, "#7A4A30");
      // los cuernos de beber
      VOL.palo(c, pr, 30, 10, 116, 80, 20, 140, 9, "#E0D4B0");
      VOL.palo(c, pr, 40, -20, 116, 96, -30, 132, 8, "#C8B890");
      // la vela en su plato
      VOL.cilindro(c, pr, 120, 0, 20, 112, 116, PIV, { n: 8 });
      VOL.cilindro(c, pr, 120, 0, 8, 116, 150, ["#A8A090", "#C8C0B0", "#E8E0D0"], { n: 6 });
      if (o.vela !== false) {
        const q = pr(120, 0, 158);
        E(c, q[0], q[1], 3.5 * pr.s, 8 * pr.s, ORO);
        if (calidad() !== "baja") VOL.halo(c, pr, 120, 0, 160, 60, ORO, 0.35 + 0.05 * Math.sin(t * 6));
      }
    });
    S.poner(0, 110, () => VOL.cilindro(c, pr, 0, 110, 30, 0, 70, MC, { n: 8, tapa: "#7A3E20" }));
    S.dibujar();
  }

  Object.assign(ASSETS.LISTA, {
    cubaUlf: { f: cubaUlf, vol: true, alto: 260, choque: null, grupo: "bodega" },
    estanteToneles: { f: estanteToneles, vol: true, alto: 380, choque: null, grupo: "bodega" },
    colgadero: { f: colgadero, vol: true, alto: 340, choque: null, grupo: "bodega" },
    aljibe: { f: aljibe, vol: true, alto: 250, choque: null, grupo: "bodega" },
    escaleraBodega: { f: escaleraBodega, vol: true, alto: 420, choque: null, grupo: "bodega" },
    raicesViejas: { f: raicesViejas, vol: true, alto: 320, choque: null, grupo: "bodega" },
    mesaCata: { f: mesaCata, vol: true, alto: 170, choque: null, grupo: "bodega" },
  });
  Object.assign(ASSETS.EJEMPLO, {
    raicesViejas: { late: 1 },
    aljibe: { balde: 0 },
  });
})();
