// Pruebas del nivel de las mazmorras y el reto (motor/zonas.js, RPG.nivelDe).
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const enJuego = async (A) => {
    for (let i = 0; i < 40 && A.J.modo !== "juego"; i++) await esperar(50);
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "mazmorras: cada una tiene su nivel, sus criaturas lo toman y el jefe va 5 arriba", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      await enJuego(A);
      const nc = ZONAS.nivelZona("cripta"),
        nm = ZONAS.nivelZona("mina"),
        nh = ZONAS.nivelZona("hondonada");
      si(nc >= 3 && nc <= 12, "la cripta, de las primeras: " + nc);
      si(nh > nc, "la hondonada, más lejos, más alta: " + nh + " > " + nc);
      si(nm >= 3 && nm <= 30, "la mina: " + nm);
      const Z = ZONAS.zonas().find((z) => z.id === "cripta");
      const comun = Z.enemigos.find((e) => !e.lider && !e.esbirroZona);
      igual(RPG.nivelDe(Object.assign({}, comun, { nivel: 0 })), nc, "una común, el de la cripta:");
      igual(RPG.nivelDe(Object.assign({}, Z.jefe.e, { nivel: 0 })), nc + 5, "el jefe:");
    } },
    { nombre: "mazmorras: vencida una vez, la entrada ofrece el reto y todo despierta con 3 niveles más", fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      await enJuego(A);
      const Z = ZONAS.zonas().find((z) => z.id === "cripta"),
        nc = ZONAS.nivelZona("cripta");
      ZONAS.estado().jefes.cripta = false;
      ZONAS.pedirEntrada("cripta");
      await esperar(100);
      si(A.J.modo !== "menu", "sin vencerla, entra directo (sin preguntar): " + A.J.modo);
      await enJuego(A);
      const comun = Z.enemigos.find((e) => !e.lider && !e.esbirroZona);
      RPG.nivelar(comun);
      igual(comun.nivel, nc, "nivel normal:");
      const vida = comun.d.vida;
      ZONAS.estado().jefes.cripta = true;
      ZONAS.pedirEntrada("cripta");
      await esperar(50);
      const bs = [...document.querySelectorAll("#capaCaja button")];
      igual(bs.length, 3, "normal, reto y cerrar:");
      bs[1].click();
      await esperar(100);
      RPG.nivelar(comun);
      igual(comun.nivel, nc + 3, "con reto, 3 más:");
      si(comun.d.vida > vida, "y más vida: " + vida + " → " + comun.d.vida);
      igual(Z.jefe.e.muerto, 0, "el jefe del reto está vivo:");
      // vencer al jefe del reto: su cofre y la paga
      const plata = PODERES.pj().plata;
      Z.jefe.e.muerto = 1;
      await esperar(300);
      si(ZONAS.estado().retos.cripta, "reto superado");
      si(PODERES.pj().plata > plata, "paga");
      si(Z.cofres.some((c) => c.k === "cripta_cr"), "su cofre");
      // volver sin reto: todo con su nivel de siempre
      ZONAS.ponerReto("cripta", false);
      RPG.nivelar(comun);
      igual(comun.nivel, nc, "sin reto otra vez:");
      igual(comun.d.vida, vida, "con su vida de siempre:");
    } },
  );
}
