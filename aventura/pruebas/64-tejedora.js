// Pruebas de la Tejedora dibujada desde la lámina de Alejandro (enemigos/tejedora.js): carga sus vistas en
// vector y se dibuja quieta, andando, en la tela, en el ataque básico, herida y muriendo, con cada paleta.
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push({
    nombre: "Tejedora: las siete láminas cargan y se dibuja en cada vista, estado y paleta",
    fn: async (A, { si }) => {
      for (let i = 0; i < 100 && !TEJEDORA.listo(); i++) await esperar(50);
      si(TEJEDORA.listo(), "las vistas y poses en vector cargaron");
      const cv = document.createElement("canvas");
      cv.width = cv.height = 400;
      const c = cv.getContext("2d");
      const estados = [{}, { mov: 1 }, { golpe: 0.5 }, { golpe: 0.9 }, { basico: 0.9 }, { cabezazo: 0.8 }, { herido: 0.8 }, { muere: 0.5 }];
      for (const [vista, espejo] of [["S", false], ["E", false], ["N", false], ["E", true]])
        for (const est of estados)
          for (let pal = 0; pal < TEJEDORA.PALETAS.length; pal++) CRIATURAS.dibujar(c, "aranaReina", 200, 300, 1, Object.assign({ vista, espejo, pal, sem: 3 }, est));
      const px = c.getImageData(200, 285, 1, 1).data;
      si(px[3] > 0, "dibujó algo en el cuerpo");
    },
  });
}
(window.PRUEBAS = window.PRUEBAS || []).push({
  nombre: "Tejedora: tira la tela de lejos y pica con las patas a quien se le acerca mientras la recarga",
  fn: async (A, { igual, si }) => {
    const e = A.enemigos.find((o) => o.tipo === "aranaReina");
    si(e, "hay una Tejedora en el bosque");
    const p = A.jug, casa = e.casa;
    p.x = casa[0] - 30;
    p.y = casa[1];
    Object.assign(e, { x: p.x + 30, y: p.y, estado: "persigue", t: 0, recarga: 2, aviso: null, aturdido: 0, helado: 0, carga: null, muerto: 0, activo: true, vida: e.d.vida, vx: 0, vy: 0 });
    COMBATE.actualizar(A.J, e, 0.016);
    igual(e.estado, "basico", "de cerca y con la tela recargando, pica:");
    si(e.aviso && e.aviso.basico && !A.J.avisos.includes(e.aviso), "sin marca en el piso");
    Object.assign(e, { aviso: null, estado: "quieto", recarga: 0, basico: 0, x: casa[0], y: casa[1] });
  },
});
