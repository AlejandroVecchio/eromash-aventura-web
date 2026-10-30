// Pruebas del custodio dibujado desde la lámina de Alejandro (enemigos/custodio.js): carga sus vistas en vector,
// se dibuja en cada vista con paleta, y es el jefe de la madriguera (raíces, atado) y del pozo (escarcha).
{
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  (window.PRUEBAS = window.PRUEBAS || []).push(
    { nombre: "custodio: las seis láminas cargan y se dibuja en cada vista, en aviso y con cada paleta", fn: async (A, { igual, si }) => {
      for (let i = 0; i < 100 && !CUSTODIO.listo(); i++) await esperar(50);
      si(CUSTODIO.listo(), "las vistas y poses en vector cargaron");
      const cv = document.createElement("canvas");
      cv.width = cv.height = 400;
      const c = cv.getContext("2d");
      for (const [vista, espejo] of [["S", false], ["E", false], ["N", false], ["E", true]])
        for (const golpe of [0, 0.6, 0.3])
          for (let pal = 0; pal < CUSTODIO.PALETAS.length; pal++) CRIATURAS.dibujar(c, "custodio", 200, 300, 1, { vista, espejo, golpe, pal, sem: 7, mov: 1 });
      const px = c.getImageData(200, 220, 1, 1).data;
      si(px[3] > 0, "dibujó algo en el cuerpo");
    } },
    { nombre: "custodio: es el jefe de la madriguera con la paleta atada", fn: async (A, { igual, si }) => {
      const Z = ZONAS.zonas().find((z) => z.id === "madriguera");
      igual(Z.d.jefe, "custodio", "jefe de la madriguera:");
      ZONAS.entrar("madriguera");
      for (let i = 0; i < 60 && !Z.jefe; i++) await esperar(50);
      si(Z.jefe, "se armó el jefe");
      igual(Z.jefe.e.tipo, "custodio", "tipo:");
      igual(Z.jefe.e.pal, 1, "paleta de raíces (atadura):");
      si(Z.jefe.e.lider.nombre.length > 0, "tiene nombre");
    } }
  );
}
