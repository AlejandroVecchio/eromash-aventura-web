// Pruebas del fatuo mayor dibujado desde la lámina de Alejandro (enemigos/fatuo-mayor.js): carga sus vistas en
// vector y se dibuja quieto, andando, en el aviso, en el fogonazo, herido y muriendo, con cada paleta.
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push({
    nombre: "fatuo mayor: las cinco láminas cargan y se dibuja en cada vista, estado y paleta",
    fn: async (A, { si }) => {
      for (let i = 0; i < 100 && !FATUO_MAYOR.listo(); i++) await esperar(50);
      si(FATUO_MAYOR.listo(), "las vistas y poses en vector cargaron");
      const cv = document.createElement("canvas");
      cv.width = cv.height = 400;
      const c = cv.getContext("2d");
      const estados = [{}, { mov: 1 }, { golpe: 0.5 }, { golpe: 0.9 }, { golpe: 0.02 }, { golpe: 0 }, { herido: 0.8 }, { muere: 0.5 }];
      for (const [vista, espejo] of [["S", false], ["E", false], ["N", false], ["E", true]])
        for (const est of estados)
          for (let pal = 0; pal < FATUO_MAYOR.PALETAS.length; pal++) CRIATURAS.dibujar(c, "fatuoMayor", 200, 300, 1, Object.assign({ vista, espejo, pal, sem: 5 }, est));
      const px = c.getImageData(200, 250, 1, 1).data;
      si(px[3] > 0, "dibujó algo en el cuerpo");
    },
  });
  window.PRUEBAS.push({
    nombre: "fatuo mayor: al morir se parte en dos fatuos chicos que ya persiguen",
    fn: async (A, { igual, si }) => {
      JUEGO.empezar(9, true);
      const grupo = [];
      const e = A.CB.crear("fatuoMayor", A.jug.x + 400, A.jug.y, { grupo });
      e.activo = true;
      grupo.push(e);
      A.enemigos.push(e);
      const antes = A.enemigos.length;
      si(A.CB.golpear(A.J, e, 9999, A.jug.x, A.jug.y, 1), "murió");
      igual(A.enemigos.length - antes, 2, "dos más en el mundo:");
      const hijos = A.enemigos.slice(antes);
      si(hijos.every((n) => n.tipo === "fatuo" && n.hijo && n.estado === "persigue" && grupo.includes(n)), "son fatuos chicos de su grupo y ya persiguen");
      A.CB.golpear(A.J, hijos[0], 9999, A.jug.x, A.jug.y, 1);
      igual(A.enemigos.length - antes, 2, "un fatuo chico no se vuelve a partir:");
      hijos.concat(e).forEach((n) => ((n.muerto = 1), (n.activo = false)));
    },
  });
}
