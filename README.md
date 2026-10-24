# Eromash · La aventura (web)

El modo historia de Eromash en 2.5D, en el navegador, con la misma estética que la arena: caras planas, la paleta del juego y el vikingo de casco E, ahora visto de frente, de costado y de espaldas.

Recorre el Bosque de Eldervald con el guion de las misiones EL-01 a EL-07.

- `aventura/index.html`: el juego. Historia EL-01 a EL-07 completa, y además el bosque entero para explorar:
  - Día y noche (un día cada 16 minutos), oscuridad con faroles, braseros, runas y la lámpara de Eromash; niebla y rayos de sol.
  - Grupos de criaturas con un líder más grande, con nombre, aura y afijos (veloz, piel de piedra, ígneo, helado, rúnico), y cuatro únicos con nombre fijo.
  - 44 cofres (arcones, arcas enterradas que revela la Lente o Sowilo, cofres sellados por una piedra o por fuego), 20 piedras del susurro con historia y viaje entre ellas, manzanos de Iðunn.
  - Cuatro runas en altares (Kenaz fuego, Isa hielo, Algiz escudo, Sowilo sol), poder rúnico que sube con fragmentos, plata para la forja de Ása y un mapa que se descubre caminando.
- `aventura/catalogo.html`: cada objeto, persona y criatura de Eldervald, uno por uno, para revisarlos.
- `juego/js/comun/` y `juego/fuentes/`: lo compartido con la arena (idiomas, colores de los vikingos, calidad gráfica, tipografías).
- `docs/historia/`: la campaña, las misiones y la dirección de arte.

Para verlo: servir la carpeta raíz (por ejemplo `python3 -m http.server 8899`) y abrir `http://127.0.0.1:8899/aventura/catalogo.html`. Con `?lang=es` se ve en español.
