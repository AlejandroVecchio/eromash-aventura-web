// ---------- los talleres de Eikholt por dentro ----------
// Lo que hay adentro de la carpintería de Sten, la curtiembre y la cordelería de Folke: el banco del carpintero con la
// cuaderna a medio labrar, la quilla en sus caballetes, la tina de curtir con el cuero en remojo, el potro de raspar, el
// torno del cordelero con sus tres ganchos y los rollos de soga. Todo armado con caras (comun/volumen.js), así se ve
// igual desde cualquier lado; mismas medidas que los muebles del cuarto (pies en x, y; luz de arriba a la derecha).
(function () {
  "use strict";
  const MADERA = ["#5E130D", "#561109", "#661610"],
    MT = ["#2A0806", MADERA[0], "#7A1D14"],
    PINO = ["#8A6A3E", "#A88450", "#C8A46A"],
    HI = ["#2A2428", "#3A3438", "#6E6A6E"],
    CUERO = ["#5E3A22", "#7A5030", "#9A6A40"],
    SOGA = ["#8A7A5A", "#A8966E", "#C8B48C"];

  // ---------- El banco del carpintero ----------
  // Banco largo de tablones con la prensa de tornillo, la cuaderna curva a medio labrar, la azuela, el cepillo y la
  // viruta enrulada en el piso. o.viruta: cuánta viruta hay (Sten trabajando).
  function bancoCarpintero(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr);
    VOL.sombra(c, pr, 0, 0, 200, 64, 0.45);
    S.poner(0, 0, () => {
      for (const u of [-160, 160])
        for (const w of [-34, 34]) VOL.cubo(c, pr, u, w, 16, 16, 120, MT);
      VOL.caja(c, pr, -170, -20, 40, 170, 20, 52, MT);
      VOL.caja(c, pr, -200, -46, 120, 200, 46, 140, MT, { tapa: "#8A3A22" });
      // la prensa de tornillo en la punta
      VOL.caja(c, pr, 180, 46, 70, 200, 56, 150, MT);
      VOL.palo(c, pr, 190, 56, 120, 190, 96, 120, 6, HI[2]);
      VOL.palo(c, pr, 170, 96, 120, 210, 96, 120, 5, MT[2]);
      // la cuaderna: una tabla curva de pino, en tres tramos
      const tramos = [[-150, -6, 140], [-80, 2, 156], [-10, 2, 160], [60, -6, 152]];
      for (let i = 0; i < tramos.length - 1; i++) {
        const [u0, w0, z0] = tramos[i],
          [u1, w1, z1] = tramos[i + 1];
        VOL.caja(c, pr, u0, w0 - 12, 140, u1, w1 + 12, Math.max(z0, z1), PINO, { tapa: PINO[2] });
      }
      // la azuela y el cepillo
      VOL.palo(c, pr, 90, -24, 142, 150, -10, 142, 5, "#7A3E20");
      VOL.caja(c, pr, 146, -20, 140, 162, 0, 152, HI);
      VOL.caja(c, pr, 100, 14, 140, 150, 34, 158, PINO);
      VOL.caja(c, pr, 120, 18, 158, 128, 30, 166, HI);
      for (let k = 0; k < 4; k++) VOL.elipse(c, pr, -170 + k * 22, 24 - k * 4, 140.5, 8, 4, "#E8D4A8");
    });
    const n = o.viruta == null ? 7 : o.viruta;
    for (let k = 0; k < n; k++) {
      const u = -120 + ((k * 53) % 260),
        w = 54 + ((k * 31) % 40);
      VOL.elipse(c, pr, u, w, 1, 12, 6, k % 2 ? "#E8D4A8" : "#C8A46A");
    }
    S.dibujar();
  }

  // ---------- La quilla en los caballetes ----------
  // Un tronco de roble labrado como quilla de barca, apoyado en dos caballetes en X, con la roda curva que sube en la
  // punta. Sten la está haciendo para el muelle de balsas.
  function quillaCaballetes(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr);
    VOL.sombra(c, pr, 0, 0, 280, 50, 0.4);
    for (const u of [-170, 150])
      S.poner(u, 0, () => {
        VOL.palo(c, pr, u - 30, -30, 0, u + 30, 30, 90, 10, MT[1]);
        VOL.palo(c, pr, u + 30, -30, 0, u - 30, 30, 90, 10, MT[0]);
        VOL.palo(c, pr, u, -34, 70, u, 34, 70, 9, MT[2]);
      });
    S.poner(0, 0, () => {
      VOL.caja(c, pr, -260, -16, 80, 220, 16, 110, PINO, { tapa: PINO[2] });
      // la roda: tres tramos que suben y se curvan
      VOL.caja(c, pr, 220, -14, 84, 260, 14, 130, PINO);
      VOL.caja(c, pr, 250, -12, 120, 280, 12, 190, PINO);
      VOL.caja(c, pr, 268, -10, 180, 290, 10, 240, PINO, { tapa: PINO[2] });
      // las marcas de la azuela
      for (let k = 0; k < 6; k++) VOL.palo(c, pr, -220 + k * 70, 16, 96, -200 + k * 70, 16, 104, 2, PINO[0]);
    }, 1);
    S.dibujar();
  }

  // ---------- La tina de curtir ----------
  // Tina grande de duelas con zunchos, el cuero en remojo y el palo de revolver; el caldo de corteza de roble burbujea un
  // poco (con o.burbujas). Huele: los de la ciudad lo saben.
  function tinaCurtidor(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 4, 0, 120, 70, 0.45);
    VOL.cilindro(c, pr, 0, 0, 100, 0, 130, MT, { n: 12, rw: 60, sinTapa: true });
    for (const z of [24, 104]) VOL.cilindro(c, pr, 0, 0, 102, z, z + 8, HI, { n: 12, rw: 62, sinTapa: true });
    VOL.elipse(c, pr, 0, 0, 126, 92, 54, "#3A2414");
    VOL.elipse(c, pr, -10, 4, 127, 60, 32, "#5E3A1E");
    // el cuero que asoma, doblado sobre el borde: un tramo adentro, el doblez arriba y el que cuelga por afuera
    VOL.lamina(c, pr, [[20, 30, 127], [80, 30, 127], [80, 54, 133], [20, 54, 133]], CUERO[2], CUERO[0]);
    VOL.lamina(c, pr, [[20, 64, 70], [80, 64, 76], [80, 58, 133], [20, 58, 133]], CUERO[1], CUERO[0]);
    VOL.palo(c, pr, -30, -10, 120, -70, -40, 230, 6, "#7A5030");
    if (o.burbujas !== false) {
      const b = (t * 0.9) % 1;
      VOL.elipse(c, pr, -40 + 10 * Math.sin(t), 10, 127.5, 6 * b, 4 * b, "#8A5A30");
      VOL.elipse(c, pr, 20, -16, 127.5, 4 * ((b + 0.5) % 1), 3 * ((b + 0.5) % 1), "#8A5A30");
    }
  }

  // ---------- El potro de raspar ----------
  // El tronco inclinado donde se raspa el pelo del cuero, con la cuchilla de dos mangos encima.
  function potroRaspar(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o);
    VOL.sombra(c, pr, 0, 0, 120, 40, 0.4);
    VOL.palo(c, pr, -80, -20, 0, -80, 20, 0, 1, MT[0]);
    VOL.cubo(c, pr, 70, 0, 18, 40, 70, MT);
    VOL.palo(c, pr, -110, 0, 6, 90, 0, 90, 26, MT[1]);
    // el cuero encima del tronco inclinado, con los costados que cuelgan
    const z = (u) => 6 + ((u + 110) / 200) * 84 + 12;
    VOL.lamina(c, pr, [[-40, -16, z(-40)], [80, -16, z(80)], [80, 16, z(80)], [-40, 16, z(-40)]].map((q) => [q[0], -q[1], q[2]]).reverse(), CUERO[2], CUERO[0]);
    VOL.lamina(c, pr, [[-40, 18, z(-40)], [80, 18, z(80)], [80, 30, z(80) - 40], [-40, 30, z(-40) - 40]], CUERO[1], CUERO[0]);
    VOL.lamina(c, pr, [[80, -18, z(80)], [-40, -18, z(-40)], [-40, -30, z(-40) - 40], [80, -30, z(80) - 40]], CUERO[1], CUERO[0]);
    // la cuchilla de dos mangos, cruzada arriba
    const zc = z(20) + 3;
    VOL.palo(c, pr, 20, -36, zc, 20, 36, zc, 3, HI[2]);
    VOL.palo(c, pr, 20, -48, zc, 20, -36, zc, 6, "#7A3E20");
    VOL.palo(c, pr, 20, 36, zc, 20, 48, zc, 6, "#7A3E20");
  }

  // ---------- El torno del cordelero ----------
  // La rueda grande con su manivela en un bastidor, y la tabla de los tres ganchos que tuercen las hebras; de los ganchos
  // sale la soga tendida hacia el piso. o.gira: la rueda da vueltas (Folke trabajando).
  function tornoCordelero(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      S = VOL.escena(pr),
      a = o.gira ? t * 2.4 : 0.3;
    VOL.sombra(c, pr, 0, 0, 110, 60, 0.45);
    S.poner(0, -20, () => {
      for (const u of [-50, 50]) VOL.cubo(c, pr, u, -20, 14, 14, 200, MT);
      VOL.caja(c, pr, -60, -28, 0, 60, -12, 12, MT);
      // la rueda: ocho rayos y la llanta, de canto hacia el frente
      const R = 70,
        z0 = 130;
      for (let k = 0; k < 8; k++) {
        const g = a + (k / 8) * Math.PI * 2;
        VOL.palo(c, pr, 0, -20, z0, Math.cos(g) * R, -20, z0 + Math.sin(g) * R, 4, MT[2]);
      }
      for (let k = 0; k < 16; k++) {
        const g0 = a + (k / 16) * Math.PI * 2,
          g1 = a + ((k + 1) / 16) * Math.PI * 2;
        VOL.palo(c, pr, Math.cos(g0) * R, -20, z0 + Math.sin(g0) * R, Math.cos(g1) * R, -20, z0 + Math.sin(g1) * R, 8, MT[1]);
      }
      VOL.palo(c, pr, Math.cos(a) * 50, -20, z0 + Math.sin(a) * 50, Math.cos(a) * 50, -50, z0 + Math.sin(a) * 50, 7, "#7A3E20");
    });
    S.poner(0, 30, () => {
      VOL.cubo(c, pr, 0, 30, 90, 16, 110, MT);
      for (const u of [-28, 0, 28]) {
        VOL.palo(c, pr, u, 38, 100, u, 54, 100, 5, HI[2]);
      }
    });
    // las tres hebras tendidas desde los ganchos hasta el carro de atrás, ya torciéndose en una soga
    S.poner(150, 60, () => {
      VOL.cubo(c, pr, 260, 60, 24, 24, 110, MT);
      VOL.palo(c, pr, 260, 48, 100, 260, 60, 100, 6, HI[2]);
      for (const u of [-28, 0, 28]) VOL.palo(c, pr, u, 54, 100, 150, 58, 92, 3, SOGA[1]);
      VOL.palo(c, pr, 150, 58, 92, 256, 54, 100, 6, SOGA[2]);
      for (let k = 0; k < 5; k++) VOL.palo(c, pr, 160 + k * 20, 52, 90 + k * 2, 170 + k * 20, 62, 98 + k * 2, 2, SOGA[0]);
    });
    S.dibujar();
  }

  // ---------- Los rollos de soga ----------
  // Tres rollos de soga apilados y uno colgado de una estaca, con la punta suelta. o.alquitran: soga de barco, oscura.
  function rollosSoga(c, x, y, t, o) {
    const pr = VOL.pr(x, y, o),
      col = o.alquitran ? ["#2A2420", "#3E362E", "#5A5046"] : SOGA,
      rollo = (u, w, z, r) => {
        VOL.cilindro(c, pr, u, w, r, z, z + 26, col, { n: 10, tapa: col[2] });
        VOL.elipse(c, pr, u, w, z + 26.5, r * 0.45, r * 0.45, col[0]);
        for (let k = 0; k < 3; k++) VOL.elipse(c, pr, u, w, z + 26.6, r * (0.6 + k * 0.13), r * (0.6 + k * 0.13) * 0.06, col[1]);
      };
    VOL.sombra(c, pr, 0, 0, 100, 50, 0.4);
    rollo(-40, 0, 0, 44);
    rollo(44, 6, 0, 40);
    rollo(0, 2, 26, 40);
    VOL.palo(c, pr, 80, 30, 2, 120, 50, 0, 5, col[1]);
  }

  Object.assign(ASSETS.LISTA, {
    bancoCarpintero: { f: bancoCarpintero, vol: true, alto: 200, choque: null, grupo: "oficios" },
    quillaCaballetes: { f: quillaCaballetes, vol: true, alto: 250, choque: null, grupo: "oficios" },
    tinaCurtidor: { f: tinaCurtidor, vol: true, alto: 240, choque: null, grupo: "oficios" },
    potroRaspar: { f: potroRaspar, vol: true, alto: 130, choque: null, grupo: "oficios" },
    tornoCordelero: { f: tornoCordelero, vol: true, alto: 210, choque: null, grupo: "oficios" },
    rollosSoga: { f: rollosSoga, vol: true, alto: 70, choque: null, grupo: "oficios" },
  });
  ASSETS.EJEMPLO = Object.assign(ASSETS.EJEMPLO || {}, { tornoCordelero: { gira: true } });
})();
