// ---------- opciones (módulo OPCIONES) ----------
// La ventana de Opciones de la pausa (y del título): cada fila es un botón que pasa al valor siguiente, así se usa
// igual con mouse, teclado o mando. Se guarda en este navegador. El volumen vive en SONIDO, la calidad en CALIDAD
// (compartida con la arena) y el idioma en I18N; el resto lo lee el motor con OPCIONES.v(clave).
window.OPCIONES = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const CLAVE = "eromash.aventura.opciones";
  const v = { brujula: true, temblor: true, numeros: true, flechas: true, apuntar: true, correr: "mantener", interfaz: "normal", dialogos: "manual" };
  try {
    Object.assign(v, JSON.parse(localStorage.getItem(CLAVE) || "{}"));
  } catch (e) {}
  function guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(v));
    } catch (e) {}
  }
  function aplicar() {
    document.body.classList.toggle("ui-grande", v.interfaz === "grande");
  }
  addEventListener("DOMContentLoaded", aplicar);
  if (document.body) aplicar();

  const pct = (x) => Math.round(x * 100) + " %";
  const siNo = (b) => t(b ? "op.si" : "op.no");
  const sigVol = (x) => (x >= 0.99 ? 0 : Math.min(1, Math.round((x + 0.2) * 10) / 10));
  // cada fila: texto que muestra y qué hace al tocarla
  function filas() {
    const S = window.SONIDO;
    const lista = [];
    if (S) {
      ["general", "efectos", "ambiente"].forEach((k) =>
        lista.push({ texto: t("op.vol_" + k), valor: pct(S.volumen(k)), fn: () => S.volumen(k, sigVol(S.volumen(k))) }),
      );
    }
    if (window.CALIDAD) {
      const N = ["alta", "media", "baja"];
      lista.push({ texto: t("op.calidad"), valor: t("op.calidad_" + CALIDAD.nivel), fn: () => (CALIDAD.nivel = N[(N.indexOf(CALIDAD.nivel) + 1) % 3]) });
    }
    const alternar = (k) => () => (v[k] = !v[k]);
    lista.push({ texto: t("op.brujula"), valor: siNo(v.brujula), fn: alternar("brujula") });
    lista.push({ texto: t("op.temblor"), valor: siNo(v.temblor), fn: alternar("temblor") });
    lista.push({ texto: t("op.numeros"), valor: siNo(v.numeros), fn: alternar("numeros") });
    lista.push({ texto: t("op.flechas"), valor: siNo(v.flechas), fn: alternar("flechas") });
    lista.push({ texto: t("op.apuntar"), valor: siNo(v.apuntar), fn: alternar("apuntar") });
    lista.push({ texto: t("op.correr"), valor: t("op.correr_" + v.correr), fn: () => (v.correr = v.correr === "mantener" ? "alternar" : "mantener") });
    lista.push({ texto: t("op.dialogos"), valor: t("op.dialogos_" + v.dialogos), fn: () => (v.dialogos = v.dialogos === "manual" ? "solos" : "manual") });
    lista.push({ texto: t("op.interfaz"), valor: t("op.interfaz_" + v.interfaz), fn: () => (v.interfaz = v.interfaz === "normal" ? "grande" : "normal") });
    lista.push({ texto: t("op.idioma"), valor: I18N.lang === "es" ? "Español" : "English", fn: () => {
      // el idioma cambia del todo al rearmar la pantalla: se guarda la partida y se vuelve al título
      I18N.setLang(I18N.lang === "es" ? "en" : "es");
      if (window.JUEGO && JUEGO.J.modo !== "titulo") JUEGO.H.guardar();
      location.reload();
    } });
    return lista;
  }
  // abrir(cerrar): el motor ya puso el juego en modo menú; cerrar() vuelve a donde estaba. foco = la fila elegida
  function abrir(cerrar, foco = 0) {
    const lista = filas();
    const botones = lista.map((f, i) => ({ texto: f.texto, sub: f.valor, fn: () => {
      f.fn();
      guardar();
      aplicar();
      if (f.aviso) HUD.aviso(t(f.aviso), "#73D5DB");
      abrir(cerrar, i);
    } }));
    botones.push({ texto: t("ui.cerrar"), fn: cerrar });
    HUD.abrir(`<h2>${t("op.titulo")}</h2><div class="sub">${t("op.sub")}</div>`, botones, { clase: "opciones" });
    if (foco) HUD.enfocar(foco);
  }
  return { abrir, v: (k) => v[k] };
})();
