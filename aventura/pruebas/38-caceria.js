// Pruebas de la Cacería Salvaje (motor/caceria.js).
// (en un bloque: las pruebas comparten la página)
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  // pone el reloj de la partida a la hora h de la noche n
  const ponerHora = (A, n, h) => (A.H.E.tiempo = ((20 + 24 * n + (h < 20 ? h + 24 : h) - 20 - 9) / 24) * LUZ.DIA);
  const noche = () => {
    let n = 1;
    while (!CACERIA.toca(n)) n++;
    return n;
  };
  // un lugar afuera, lejos de los pueblos
  const afuera = (A) => {
    const L = A.W.LUGARES.puesto;
    return [L.p[0] + L.r + 1400, L.p[1]];
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "caceria: una noche de cada tres, avisa con el cuerno y llega a las 22 afuera", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
      A.enemigos.forEach((e) => (e.activo = false));
      while (RPG.nivel() < CACERIA.NIVEL_MIN) RPG.dar(500);
      si(!CACERIA.toca(0), "nunca la primera noche");
      let k = 0;
      for (let n = 1; n <= 300; n++) if (CACERIA.toca(n)) k++;
      si(k > 300 * 0.25 && k < 300 * 0.43, "más o menos una de cada tres: " + k);
      const n = noche(),
        [x, y] = afuera(A);
      A.jug.x = x;
      A.jug.y = y;
      A.jug.hp = A.jug.hpMax;
      ponerHora(A, n, 21);
      await esperar(120);
      igual(CACERIA.nocheId(), n, "la noche:");
      igual(CACERIA.estado().avisada, n, "sonó el cuerno:");
      si(!CACERIA.caza(), "todavía no llega");
      ponerHora(A, n, 22.5);
      await esperar(120);
      const c = CACERIA.caza();
      si(c, "llegó a las 22");
      igual(c.miembros.length, 5, "el Cazador y cuatro sabuesos:");
      si(c.cazador.lider && c.cazador.lider.unico === "cazador", "el Cazador es un único");
      si(c.miembros.every((e) => e.estado === "persigue" && A.enemigos.includes(e)), "salen a buscarlo");
      si(BESTIARIO.UNICOS.some(([id]) => id === "cazador"), "entre los únicos del bestiario");
    } },
    { nombre: "caceria: la pasada avisa exacto, respeta el tope, saltar la evita y esconderse la termina", fn: async (A, { igual, si }) => {
      const c = CACERIA.caza(),
        jug = A.jug;
      c.miembros.forEach((e) => (e.activo = false));
      c.prox = 999;
      const [x, y] = [jug.x, jug.y];
      jug.hp = jug.hpMax;
      jug.inv = jug.esq = jug.salto = 0;
      CACERIA.pasada();
      const a = c.pasadas[c.pasadas.length - 1].a;
      si(A.J.avisos.includes(a) && COMBATE.contiene(a, x, y), "la franja marca donde está");
      for (let i = 0; i < 40 && !c.pasadas[0].pego; i++) {
        jug.x = x;
        jug.y = y;
        await esperar(50);
      }
      const saco = jug.hpMax - jug.hp;
      si(saco > 0 && saco <= Math.min(CACERIA.PASADA_DANO, Math.max(35, jug.hpMax * 0.35)) + 0.5, "pegó lo justo: " + saco);
      si(!A.J.avisos.includes(a), "el aviso se fue");
      // saltando no pega
      await esperar(700);
      jug.hp = jug.hpMax;
      jug.inv = 0;
      CACERIA.pasada();
      const p = c.pasadas[c.pasadas.length - 1];
      for (let i = 0; i < 40 && !p.pego; i++) {
        jug.salto = 0.5;
        jug.x = x;
        jug.y = y;
        await esperar(50);
      }
      jug.salto = 0;
      igual(jug.hp, jug.hpMax, "saltando no pega:");
      // meterse en un pueblo: pasa de largo y se van
      const lista = c.miembros.slice();
      const L = A.W.LUGARES.puesto;
      jug.x = L.p[0];
      jug.y = L.p[1];
      await esperar(120);
      si(!CACERIA.caza(), "terminó");
      igual(CACERIA.estado().escondidas, 1, "contó que se escondió:");
      await esperar(1400);
      si(lista.every((e) => !A.enemigos.includes(e)), "se fueron del mundo");
    } },
    { nombre: "caceria: tumbar al Cazador da el cuerno, el cuerno la llama una vez por noche y aguantar paga", fn: async (A, { igual, si }) => {
      const jug = A.jug,
        n = CACERIA.nocheId(),
        [x, y] = afuera(A);
      jug.x = x;
      jug.y = y;
      // esta noche ya corrió: sola no vuelve
      await esperar(150);
      si(!CACERIA.caza(), "una vez por noche");
      const c = CACERIA.empezar(n);
      const x0 = RPG.estado().total;
      A.CB.golpear(A.J, c.cazador, 999999, jug.x, jug.y, 1);
      await esperar(200);
      si(!CACERIA.caza(), "terminó");
      igual(CACERIA.estado().vencidas, 1, "vencida:");
      si(CACERIA.estado().cuerno, "le quedó el cuerno");
      si(RPG.estado().total > x0, "dio experiencia");
      si(A.H.E.extra.hd.unicos.cazador, "entre los únicos caídos");
      const celda = CACERIA.sistema.celdasBolsa()[0];
      si(celda && celda.id === "cz_cuerno", "el cuerno en la Bolsa");
      // el cuerno: no esta noche (ya corrió), sí la siguiente; de día no
      igual(CACERIA.tocarCuerno(), false, "esta noche ya corrió:");
      // una noche en la que no corre sola
      let m = n + 1;
      while (CACERIA.toca(m)) m++;
      ponerHora(A, m, 14);
      await esperar(1600);
      igual(CACERIA.tocarCuerno(), false, "de día no suena:");
      ponerHora(A, m, 23);
      await esperar(1600);
      igual(CACERIA.tocarCuerno(), true, "de noche la llama:");
      si(CACERIA.caza() && CACERIA.caza().llamada, "vino por el cuerno");
      // aguantar hasta el final
      CACERIA.caza().t = CACERIA.DURA;
      await esperar(120);
      igual(CACERIA.estado().sobrevividas, 1, "aguantada:");
      // se guarda
      A.H.guardar(9);
      JUEGO.empezar(9, false);
      await esperar(150);
      si(CACERIA.estado().cuerno && CACERIA.estado().vencidas === 1, "quedó guardado");
      si(CACERIA.sistema.diario().includes(I18N.t("cz.titulo")), "en el diario");
    } },
  );
}
