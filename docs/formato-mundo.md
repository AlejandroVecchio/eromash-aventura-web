# Formato del mundo (`eromash-mundo`, versión 1)

El editor (repo `map-generator`, botón **Exportar JSON**) baja el mundo entero ya armado en un solo archivo JSON
(`eldervald.mundo.json`). Es el puente para llevar Eldervald a otro motor (Godot u otro): un exportador por motor lee
este archivo y arma la escena con sus propios assets. Ningún dato depende del código JavaScript del juego.

## Unidades y ejes

- `unidades.porMetro`: 30 unidades son un metro. `porPixelDelMapa`: unidades por píxel del mapa dibujado (20).
- `x` crece al este y `y` al sur (hacia abajo de la pantalla). Un objeto en `x, y` toca el piso ahí (es su pie).
- `ancho` y `alto`: el tamaño del mundo en unidades.

## Partes

| Clave | Qué es |
| --- | --- |
| `catalogo` | Cada asset usado: `clave` del texto (`as.<id>`), `nombre` en el idioma de quien exportó, `grupo`, `alto`, `choque` (`{ r }` redondo o `{ w, h }`), `piso` (se dibuja en el piso y no choca). |
| `objetos` | Todo lo parado en el mundo: `{ id, x, y, o }`. `o` es el estado propio del asset: `s` tamaño, `sem` variante, `esp` dado vuelta, `giro`, `rot`, `ex`/`ey`, `x2`/`y2` (lo que va de punta a punta), `orden`. Si tiene `nombre`, es un objeto de la historia (`NOMBRADAS`). |
| `piso`, `barro` | Lo pintado en el piso (helechos, musgo, hongos, charcos). |
| `caminos` | `{ p: [[x, y]...], w, tipo: tierra/adoquin/ladrillo, borde, fundir, tramos }`. Una punta que cae sobre otro camino lo une. |
| `agua` | `rios: { p, w, anchos, seco }`, `lagos: { p: [x, y], rx, ry, seco }`, `puentes`. |
| `alturas` | Niveles caminables altos: `{ id, h, quads: [{ pts, clave }], escaleras }`. |
| `lugares`, `puntos` | Los lugares con nombre y los puntos de la historia (donde está cada NPC, cofre, encargo). |
| `regiones` | Regiones con nombre en los dos idiomas: `{ u, nombre: { es, en }, p }`. |
| `interiores` | Cada plantilla de cuarto (`casa_0..4`, `lindes`, `herreria`, `sanacion`, `taberna`, `sot_<clase>`) ya armada: `pared`, `ventana`, `estandarte`, `repisa`, `muebles: { id, x, y, o, r, piso, accion }`, `gente`. Medidas del cuarto en `cuarto` (1600 × 900, la pared toca el piso en `fondo`). |

## Lo que se guarda en el juego

El juego no lee este JSON: arma el bosque con semillas fijas (`mundo/eldervald.js`) y le suma lo editado a mano en
`mundo/agregados.js` (`poner`, `quitar`, `mover`, caminos, agua, `cuartos`, `regiones`, `piezas`, `notas`). El JSON es la
foto completa del resultado, para otros motores y herramientas.

## texturas

Las texturas hechas en el editor: `{ id: { nombre: { es, en }, uso: "parche" | "bloque" | "ambos", receta | img } }`. Una `receta` es `{ tipo, colores: [fondo, tono1, tono2, luz], tam, dens, sem }` (se dibuja con `js/mundo/texturas.js`); una `img` es un PNG de 256 × 256 en dataURL que se repite sin costura. Los objetos `tx_<id>` son parches pintados en el piso (`o.rx`, `o.ry`, `o.k` escala de la textura) y `txb_<id>` bloques bajos (`o.w`, `o.d`, `o.h`).
