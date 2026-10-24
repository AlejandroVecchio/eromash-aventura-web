# Eromash · La aventura (web)

El modo historia de Eromash en 2.5D, en el navegador, con la misma estética que la arena: caras planas, la paleta del juego y el vikingo de casco E, ahora visto de frente, de costado y de espaldas.

Recorre el Bosque de Eldervald con el guion de las misiones EL-01 a EL-07.

- `aventura/index.html`: el juego (en construcción).
- `aventura/catalogo.html`: cada objeto, persona y criatura de Eldervald, uno por uno, para revisarlos.
- `juego/js/comun/` y `juego/fuentes/`: lo compartido con la arena (idiomas, colores de los vikingos, calidad gráfica, tipografías).
- `docs/historia/`: la campaña, las misiones y la dirección de arte.

Para verlo: servir la carpeta raíz (por ejemplo `python3 -m http.server 8899`) y abrir `http://127.0.0.1:8899/aventura/catalogo.html`. Con `?lang=es` se ve en español.
