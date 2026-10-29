// Pruebas del jabalí de hongos dibujado desde la lámina de Alejandro (enemigos/jabali-hongos.js): carga sus vistas
// en vector y se dibuja quieto, trotando, en el aviso, cargando, herido y muriendo, con cada paleta.
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push({
    nombre: "jabalí: las cinco láminas cargan y se dibuja en cada vista, estado y paleta",
    fn: async (A, { si }) => {
      for (let i = 0; i < 100 && !JABALI.listo(); i++) await esperar(50);
      si(JABALI.listo(), "las vistas y poses en vector cargaron");
      const cv = document.createElement("canvas");
      cv.width = cv.height = 400;
      const c = cv.getContext("2d");
      const estados = [{}, { mov: 1 }, { golpe: 0.5 }, { golpe: 0.9 }, { mov: 2, golpe: 0.4 }, { herido: 0.8 }, { muere: 0.5 }];
      for (const [vista, espejo] of [["S", false], ["E", false], ["N", false], ["E", true]])
        for (const est of estados)
          for (let pal = 0; pal < JABALI.PALETAS.length; pal++) CRIATURAS.dibujar(c, "jabali", 200, 300, 1, Object.assign({ vista, espejo, pal, sem: 3 }, est));
      const px = c.getImageData(200, 270, 1, 1).data;
      si(px[3] > 0, "dibujó algo en el cuerpo");
    },
  });
}
(window.PRUEBAS = window.PRUEBAS || []).push({
  nombre: "ataque básico: de cerca y con la habilidad recargando embiste con la cabeza, avisa en el piso y pega menos",
  fn: async (A, { igual, si }) => {
    const e = A.enemigos.find((o) => o.tipo === "lobo" && o.hordaGrupo && !o.lider);
    const p = A.jug, casa = e.casa;
    // lejos de los pueblos (son refugio) y con su casa al lado
    p.x = casa[0] - 40;
    p.y = casa[1];
    Object.assign(e, { x: p.x + 40, y: p.y, estado: "persigue", t: 0, recarga: 2, aviso: null, aturdido: 0, helado: 0, carga: null, muerto: 0, activo: true, vida: e.d.vida, vx: 0, vy: 0 });
    COMBATE.actualizar(A.J, e, 0.016);
    igual(e.estado, "basico", "estado:");
    si(e.aviso && e.aviso.basico && A.J.avisos.includes(e.aviso), "marca el abanico chico en el piso");
    si(e.aviso.dur < e.d.aviso + 0.01, "su aviso es corto");
    for (let i = 0; i < 80 && e.estado === "basico"; i++) COMBATE.actualizar(A.J, e, 0.016);
    igual(e.estado, "espera", "después del cabezazo espera:");
    si(e.cabezazo > 0, "queda la embestida para el dibujo");
    // sin recarga, a distancia de su habilidad, usa la habilidad
    Object.assign(e, { estado: "persigue", t: 0, recarga: 0, cabezazo: 0 });
    COMBATE.actualizar(A.J, e, 0.016);
    igual(e.estado, "aviso", "con la habilidad lista avisa la habilidad:");
    if (e.aviso) A.J.quitarAviso(e.aviso);
    Object.assign(e, { aviso: null, estado: "quieto", x: casa[0], y: casa[1] });
  },
});
