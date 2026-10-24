# Eromash · La aventura web: notas para trabajar en este repo

Tercer juego de Eromash: la aventura en 2.5D sobre el motor web y la estética de la arena (repo `eromash-juego`). La versión de Godot (`eromash-aventura`) es otro proyecto: no se toca desde acá.

- **Estética**: cada diseño tiene que verse de la misma familia que la arena: caras planas sin contorno, luz de arriba a la derecha (mitad izquierda en sombra), sombra elíptica en el piso, la paleta del juego. La luz rúnica de la aventura es #73D5DB y las ataduras violeta #9A6BD8.
- **Assets**: cada objeto es un asset propio y con nombre ("el pozo de Eikholt", "el carro volcado"), nunca relleno genérico. Todo asset nuevo va en `aventura/js/mundo/assets.js` (o `personajes/`, `enemigos/`) y aparece en `aventura/catalogo.html`.
- **Textos**: nada de texto suelto en el código. Todo en `aventura/js/textos/` con los dos idiomas: `'clave': { es: '…', en: '…' }` y `I18N.t('clave')`. Prefijos: `av.` historia (de la versión de Godot), `as.` nombres de assets, `cr.` criaturas, `ui.` interfaz, `cat.` catálogo.
- **Controles**: siempre por acciones (`CONTROLES`), nunca teclas sueltas; pointer events; nada que dependa solo del hover o del clic derecho (ver `docs/rumbo.md`).
- **Calidad gráfica**: todo efecto caro se apaga mirando `CALIDAD.nivel` (`juego/js/comun/calidad.js`). Los halos de `DIB.halo` ya lo hacen.
- **Mundo**: `aventura/js/mundo/eldervald.js` usa las coordenadas del mapa de Eldervald (1557 × 1010 px): 1 px = 10 unidades, 1 m ≈ 30 unidades.
- **Guion**: `aventura/js/historia/guion.js` es el mismo de Godot (misiones, banderas, diálogos, dónde está cada NPC).
- Pendiente pedido por Alejandro: una forma de que él ayude a armar los mapas además de Tiled.
