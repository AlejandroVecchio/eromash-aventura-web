// Pruebas del cuervo de Hel dibujado desde las láminas de Alejandro (enemigos/cuervo-hel.js): carga sus vistas en
// vector y se dibuja posado, despegando, volando, en el aviso, en la picada, herido y muriendo, con cada paleta.
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push({
    nombre: "cuervo: las ocho láminas cargan y se dibuja posado, volando y en cada estado y paleta",
    fn: async (A, { si }) => {
      for (let i = 0; i < 100 && !CUERVO.listo(); i++) await esperar(50);
      si(CUERVO.listo(), "las vistas y poses en vector cargaron");
      const cv = document.createElement("canvas");
      cv.width = cv.height = 400;
      const c = cv.getContext("2d");
      const estados = [{ estado: "quieto" }, { estado: "persigue", mov: 1 }, { golpe: 0.5 }, { golpe: 0.9 }, { golpe: 0.4 }, { herido: 0.8 }, { muere: 0.5 }, { estado: "quieto" }];
      for (const [vista, espejo] of [["S", false], ["E", false], ["N", false], ["E", true]])
        for (const est of estados)
          for (let pal = 0; pal < CUERVO.PALETAS.length; pal++) CRIATURAS.dibujar(c, "cuervo", 200, 300, 1, Object.assign({ vista, espejo, pal, sem: 5 }, est));
      // posado el cuerpo queda junto al piso; al despegar sube y abajo solo queda la sombra
      const cuerpo = (y) => c.getImageData(200, y, 1, 1).data;
      const pinta = (t, op) => {
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, 400, 400);
        c.translate(200, 300);
        CUERVO.dibujar(c, t, Object.assign({ vista: "S", sem: 77 }, op));
        c.setTransform(1, 0, 0, 1, 0, 0);
      };
      pinta(50, { estado: "quieto" });
      si(cuerpo(285)[3] > 0 && cuerpo(285)[0] > 0, "posado se dibuja junto al piso");
      for (let t = 50; t < 51.2; t += 0.05) pinta(t, { estado: "persigue", mov: 1 });
      si(cuerpo(250)[3] > 0, "volando se dibuja arriba");
      si(cuerpo(285)[3] === 0, "volando, cerca del piso no queda nada del cuerpo");
    },
  });
}
