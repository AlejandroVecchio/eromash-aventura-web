// Pruebas de apuntar con el cursor: la esquiva y las habilidades salen hacia donde está el mouse, también con la cámara girada.
{
  const tecla = (code, abajo) => dispatchEvent(new KeyboardEvent(abajo ? "keydown" : "keyup", { code }));
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  // pone el cursor sobre un punto del mundo (como si se moviera el mouse ahí)
  const cursorEn = (A, x, y) => {
    const [px, py] = A.J.aPantalla(x, y);
    document.getElementById("lienzo").dispatchEvent(new PointerEvent("pointermove", { clientX: px, clientY: py, pointerType: "mouse", bubbles: true }));
  };
  // un lugar con 300 libres para todos lados
  const despejado = async (A) => {
    const jug = A.jug;
    for (let k = 0; k < 200; k++) {
      const x = jug.x + (k % 14) * 260 - 1800,
        y = jug.y + Math.floor(k / 14) * 220 - 1500;
      let ok = true;
      for (let a = 0; a < 8 && ok; a++) for (let d = 0; d <= 300 && ok; d += 30) ok = A.W.libre(x + Math.cos(a * 0.785) * d, y + Math.sin(a * 0.785) * d, 20);
      if (ok) {
        A.teletransportar(x, y);
        break;
      }
    }
    for (let i = 0; i < 60 && A.J.modo !== "juego"; i++) await esperar(100);
    await esperar(300);
  };
  const esquivar = async (A) => {
    A.jug.sta = A.jug.staMax;
    A.jug.esq = 0;
    tecla("KeyC", true);
    await esperar(60);
    tecla("KeyC", false);
    await esperar(450);
  };
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "cursor: la esquiva sale hacia el mouse aunque Eromash mire para otro lado, también con la cámara girada", fn: async (A, { si }) => {
      const jug = A.jug;
      A.enemigos.forEach((q) => (q.activo = false));
      await despejado(A);
      A.J.giro = 0;
      jug.dir = [1, 0];
      let x0 = jug.x,
        y0 = jug.y;
      cursorEn(A, jug.x + 300, jug.y - 30);
      await esquivar(A);
      si(jug.x > x0 + 60 && Math.abs(jug.y - y0) < 25, "quieto ya no da un paso atrás: esquiva hacia el cursor (" + Math.round(jug.x - x0) + ", " + Math.round(jug.y - y0) + ")");
      // girada: el cursor arriba del todo en la pantalla es otra dirección del mundo
      A.J.giro = 90;
      await esperar(200);
      x0 = jug.x;
      y0 = jug.y;
      jug.dir = [1, 0];
      cursorEn(A, jug.x, jug.y + 300);
      await esquivar(A);
      si(jug.y > y0 + 60 && Math.abs(jug.x - x0) < 25, "con la cámara girada va igual hacia el punto del cursor (" + Math.round(jug.x - x0) + ", " + Math.round(jug.y - y0) + ")");
      A.J.giro = 0;
      await esperar(200);
      // el cursor sigue apuntando a lo que tiene debajo aunque la cámara se mueva
      cursorEn(A, jug.x + 200, jug.y - 30);
      A.teletransportar(jug.x - 6, jug.y);
      const d = A.dirCursor();
      si(d != null && Math.abs(d) < 0.15, "el ángulo del cursor sale de donde está ahora (" + d + ")");
    } },
    { nombre: "cursor: el golpe y el Salto del lobo van hacia el mouse", fn: async (A, { si }) => {
      const jug = A.jug;
      A.enemigos.forEach((q) => (q.activo = false));
      await despejado(A);
      jug.dir = [1, 0];
      cursorEn(A, jug.x, jug.y + 250);
      const d = A.dirCursor();
      si(Math.abs(d - Math.PI / 2) < 0.15, "el cursor abajo da 90° (" + d + ")");
      si(Math.abs(A.dirGolpe() - d) < 1e-9, "el golpe va adonde el cursor");
      RPG.estado().nivel = 20;
      Object.assign(ARBOL.estado().r, { piel: 3, zarpa: 3, zarpazo: 1, rugido: 1, patas: 3, jauria: 3, salto: 1 });
      RPG.recalcular();
      const y0 = jug.y,
        x0 = jug.x;
      cursorEn(A, jug.x, jug.y + 200);
      FURIA.ponerFuria(100);
      si(FURIA.usar("salto"), "salta");
      await esperar(900);
      si(jug.y > y0 + 120 && Math.abs(jug.x - x0) < 30, "el salto cae donde está el cursor (" + Math.round(jug.x - x0) + ", " + Math.round(jug.y - y0) + ")");
    } }
  );
}
