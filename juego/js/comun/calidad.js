// Calidad gráfica (Opciones → Calidad gráfica): alta, media o baja. Para que el juego ande en una PC floja sin empeorar la buena:
// por defecto es alta, igual que siempre. Medido el 3/10/2026: lo que más pesa es la resolución (una pantalla de doble densidad
// tarda ~3 veces más por cuadro); los brillos de las formas pesan poco pero se suman.
//   alta:  resolución nítida (hasta 2 píxeles por punto en pantallas de alta densidad), brillos, fondo del menú a pleno.
//   media: un píxel por punto y sin brillos (shadowBlur en todos los canvas).
//   baja:  además dibuja la partida al 75 % y la agranda, el fondo del menú anima a 30 cuadros.
// Regla del proyecto: cada efecto caro nuevo se suma acá (o se apaga mirando CALIDAD.nivel) y en la lista de docs/traspaso.md.
(function () {
  const NIVELES = ["alta", "media", "baja"];
  let nivel = "alta";
  try {
    const o = JSON.parse(localStorage.getItem("eromash-opciones") || "{}");
    if (NIVELES.includes(o.calidad)) nivel = o.calidad;
  } catch (e) {}
  const oyentes = [];
  // brillos: un solo interruptor para todos los shadowBlur del juego (formas, botín, jefes, escenarios, íconos)
  const d =
    window.CanvasRenderingContext2D &&
    Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, "shadowBlur");
  if (d && d.set)
    Object.defineProperty(CanvasRenderingContext2D.prototype, "shadowBlur", {
      configurable: true,
      enumerable: d.enumerable,
      get() {
        return d.get.call(this);
      },
      set(v) {
        d.set.call(this, nivel === "alta" ? v : 0);
      },
    });
  function marcar() {
    document.documentElement.dataset.calidad = nivel;
  }
  marcar();
  window.CALIDAD = {
    NIVELES,
    get nivel() {
      return nivel;
    },
    set nivel(v) {
      if (!NIVELES.includes(v) || v === nivel) return;
      nivel = v;
      marcar();
      try {
        const o = JSON.parse(localStorage.getItem("eromash-opciones") || "{}");
        o.calidad = v;
        localStorage.setItem("eromash-opciones", JSON.stringify(o));
      } catch (e) {}
      if (window.__opts) __opts.calidad = v;
      oyentes.forEach((f) => {
        try {
          f(v);
        } catch (e) {}
      });
    },
    get brillos() {
      return nivel === "alta";
    },
    // píxeles del canvas por cada punto de la ventana
    escala() {
      const dpr = window.devicePixelRatio || 1;
      return nivel === "alta"
        ? Math.min(2, dpr)
        : nivel === "media"
          ? Math.min(1, dpr)
          : 0.75 * Math.min(1, dpr);
    },
    on(f) {
      oyentes.push(f);
    },
  };
})();
