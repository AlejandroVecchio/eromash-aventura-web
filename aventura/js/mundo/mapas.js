// ---------- un mapa de cero hecho en el editor de mapas (map-generator): ?mapa=<id> juega js/mundo/mapas/<id>.js ----------
// Va justo después de agregados.js y antes de eldervald.js: el archivo del mapa pone window.AGREGADOS con lienzo, así
// el mundo de base no se arma (ELDERVALD.LIENZO) y quedan solo el borde y lo del mapa. Con ?borrador=1 manda el editor.
(function () {
  "use strict";
  const q = new URLSearchParams(location.search),
    id = q.get("mapa");
  if (id && /^[a-z0-9-]{1,60}$/.test(id) && q.get("borrador") !== "1") document.write('<script src="js/mundo/mapas/' + id + '.js"><\/script>');
})();
