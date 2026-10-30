// Pruebas del draugr del túmulo dibujado desde la lámina de Alejandro (enemigos/draugr-tumulo.js): carga sus vistas en
// vector y se dibuja quieto, andando, en el aviso, en el hachazo, herido y muriendo, con cada paleta.
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push({
    nombre: "draugr: las cinco láminas cargan y se dibuja en cada vista, estado y paleta",
    fn: async (A, { si }) => {
      for (let i = 0; i < 100 && !DRAUGR.listo(); i++) await esperar(50);
      si(DRAUGR.listo(), "las vistas y poses en vector cargaron");
      const cv = document.createElement("canvas");
      cv.width = cv.height = 400;
      const c = cv.getContext("2d");
      const estados = [{}, { mov: 1 }, { golpe: 0.5 }, { golpe: 0.9 }, { golpe: 0.02 }, { golpe: 0 }, { herido: 0.8 }, { muere: 0.5 }];
      for (const [vista, espejo] of [["S", false], ["E", false], ["N", false], ["E", true]])
        for (const est of estados)
          for (let pal = 0; pal < DRAUGR.PALETAS.length; pal++) CRIATURAS.dibujar(c, "draugr", 200, 300, 1, Object.assign({ vista, espejo, pal, sem: 5 }, est));
      const px = c.getImageData(195, 245, 1, 1).data;
      si(px[3] > 0, "dibujó algo en el cuerpo");
    },
  });
}
