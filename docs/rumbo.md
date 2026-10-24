# Eromash — hacia dónde vamos (plataformas y reglas)

Este documento explica **dónde queremos que esté Eromash** y **qué reglas de código siguen de eso**. Toda persona o IA que trabaje en el repo tiene que leerlo antes de tocar controles, interfaz, guardado, red o rendimiento.

## 1. El rumbo, en orden

1. **Steam (PC, Windows) — el objetivo principal.** Es para lo que se diseña el juego. Steam Deck es deseable: ya hay soporte de mando y eso lo acerca.
2. **Web (navegador) — ya existe.** Sirve para demos, para el stream y para probar rápido. No es un producto aparte: es el mismo juego.
3. **Celular (Play Store primero, App Store después) — a futuro, después de Steam.** Sería un **puerto**: el mismo código envuelto como app (Capacitor o similar), con un **modo táctil aparte**. Todavía no hay fecha ni trabajo hecho, y no se empieza hasta que Alejandro lo decida.

### Por qué este orden

- El género (acción por oleadas con botín) se vende primero en PC y después, si pega, en celular. Así hicieron Vampire Survivors y Brotato. En celular, los juegos pagos solo funcionan cuando ya son conocidos.
- El diferencial de Eromash es el **cooperativo local y en línea de hasta 4** y el combate a mano con jefes justos. Las dos cosas brillan en PC con teclado y mando.
- El juego se construye en vivo con la comunidad del stream, y esa comunidad está en PC.
- Como el juego es HTML y JavaScript puro, la mayor parte del código (lógica, arte generado por código, mapas, audio, textos, red, cuentas) **ya sirve para celular sin reescribirlo**. Lo que cambia son los controles y la interfaz.

## 2. La regla de oro: PC no se sacrifica

**La versión de PC se diseña como si el celular no existiera.** No se simplifican controles, no se sacan sistemas (pociones, habilidades, bloqueo, inventario completo), no se pone ataque automático, no se agranda la interfaz ni se recortan efectos o enemigos "por el celular".

Si algún día se hace la versión de celular, se resuelve con **un modo que solo se activa en el teléfono** (controles táctiles, interfaz más grande, quizás sistemas simplificados), sin cambiar nada de lo que se juega o se ve en PC.

Las reglas de la sección 3 son solo **formas de escribir el código** que en PC se comportan exactamente igual, pero que el día de mañana evitan tener que rehacer partes enteras.

## 3. Reglas de código (y por qué)

1. **La lógica pide acciones, nunca teclas.** Todo pasa por `js/controles/controles.js` (`CTRL`): "atacar", "esquivar", "poción de vida". Ninguna lógica del juego lee una tecla, un botón del mouse o un botón del mando directamente.
   _Por qué:_ así funciona hoy el remapeo y el mando, y mañana un stick táctil entra por el mismo camino sin tocar el combate.
2. **Para tocar, arrastrar y soltar se usan `pointerdown` / `pointermove` / `pointerup`**, no `mousedown`/`mousemove` ni el arrastre del navegador (`dragstart`, `draggable`).
   _Por qué:_ con mouse se comportan igual, y además funcionan con el dedo y con el lápiz. El arrastre del navegador no funciona bien en celular.
3. **Ninguna acción depende solo del clic derecho ni de pasar el mouse por encima.** El clic derecho y el hover pueden existir como atajos, pero siempre tiene que haber otra forma de hacer lo mismo (un botón, una tecla, el mando).
   _Por qué:_ en PC ya ayuda a quien juega con mando, y en celular no existen ni el clic derecho ni el hover.
4. **Las ayudas de controles muestran la tecla o el botón del dispositivo que se está usando**, igual que ya pasa con teclado y mando. Nunca "Clic izq." o "Espacio" escrito fijo, y siempre desde `js/comun/i18n.js`.
5. **La interfaz se arma con tamaños que se puedan escalar** (variables CSS o un factor de escala), no con números sueltos repetidos por todos lados. En PC se ve igual que siempre.
   _Por qué:_ un día se puede agrandar todo para una pantalla chica cambiando una sola cosa.
6. **Electron vive solo en `escritorio/`.** La lógica del juego no llama a nada de Electron ni de Node. Si hace falta algo de la plataforma (guardar un archivo, pantalla completa, logros de Steam), se hace a través de una función propia que cada plataforma resuelve a su manera.
   _Por qué:_ en celular Electron no existe, y en Steam se va a sumar Steamworks.
7. **El guardado pasa siempre por `js/progreso/partidas.js` (`PARTIDAS`)**, nunca `localStorage` suelto en otros módulos.
   _Por qué:_ en Steam va a haber que sumar la nube de Steam, y en celular probablemente otro almacenamiento. Si todo pasa por un solo lugar, se cambia una sola vez.
8. **La red tolera cortes.** El protocolo (`js/red/protocolo.js`, `red/servidor.js`) no asume una conexión perfecta: si alguien se desconecta y vuelve, la partida lo aguanta.
   _Por qué:_ en PC pasa con el wifi, y en celular pasa cada vez que se bloquea la pantalla.
9. **El arte nuevo sigue siendo vectorial o generado por código** (polígonos planos, SVG), como las espadas, los escudos y los cascos.
   _Por qué:_ se ve nítido en cualquier resolución, desde un monitor 4K hasta un teléfono, y pesa poco.
10. **Rendimiento: nada de costos gratis.** En PC se pueden tener todos los efectos que queramos, pero cada efecto caro tiene que poder apagarse (por ejemplo, desde una opción de calidad). No se usan cosas caras que no aporten (desenfoques a pantalla completa, `mix-blend-mode` sobre todo el juego).
    _Por qué:_ ayuda en PCs viejas y en Steam Deck, y es lo que permitiría bajar la calidad en un teléfono.

## 3b. Botones del mando por contexto

Una sola tabla para ver qué hace cada botón según lo que haya en pantalla, y qué queda libre antes de sumar algo.
Fuentes: `js/controles/controles.js` (`PAD_MODES`, `HAB_PAD`, `HAB_MOD`, `mapaPad`), `js/motor/juego-mandos.js` (`botonesPad`,
`pollPads`, `saltaFase`), `js/controles/glifos.js` (`de()`, los íconos de cada acción), `js/equipo/eromash-armadura.js` (`pads`,
la ventana del personaje), `js/motor/juego-campamento.js` (`padVentana`), `js/aprender/tutoriales.js` (`pad`, `botonAviso`) y
`js/menu/menu-mando.js` (menús). Revisado el 21/10/2026. Nombres en PS5; en Xbox ✕ = A, ○ = B, □ = X, △ = Y, Create = View,
Options = Menu, y el panel táctil (que Xbox no tiene) es **RS** (botón 11).

Orden de prioridad en cada cuadro (el primero que lo toma, gana): aviso o cartel del tutorial → ventana del campamento →
(tester: panel) → ventana del personaje → partida. Los menús (pausa, Opciones, noticias…) los maneja `menu-mando.js` aparte.

| Botón (índice) | Partida | Con L1 apretado | Cartel de fase del jefe | Ventana del personaje (mochila, libro, runas) | Mercader / herrero | Menús y pausa | Tutorial |
| -------------- | ------- | --------------- | ----------------------- | --------------------------------------------- | ------------------ | ------------- | -------- |
| ✕ (0) | saltar (Modo 2: agarrar) | saltar | — | aceptar (Modo 2: volver) | aceptar (Modo 2: volver) | aceptar (Modo 2: volver) | cierra el cartel |
| ○ (1) | agarrar, hablar, abrir (Modo 2: saltar) | agarrar | — | volver (Modo 2: aceptar) | volver (Modo 2: aceptar) | volver (Modo 2: aceptar) | cierra el cartel |
| □ (2) | golpe | habilidad 1 | — | sacar | — | — | — |
| △ (3) | golpe fuerte | habilidad 2 | — | combinar | forjar | — | — |
| L1 (4) | modificador de habilidades | — | — | pestaña anterior (en el libro: modificador) | — | pestaña anterior | — |
| R1 (5) | golpe (también) | habilidad 3 | — | pestaña siguiente | — | pestaña siguiente | — |
| L2 (6) | escudo (mantener; parry) | escudo | — | destruir (pregunta) | — | — | — |
| R2 (7) | golpe fuerte (también) | habilidad 4 | — | tirar al piso (pregunta) | — | — | — |
| Create (8) | abrir la mochila | mochila | — | volver | volver | — | — |
| Options (9) | pausa | pausa | pausa | — | — | — | — |
| L3 (10) | correr (un toque, hasta soltar la palanca) | correr | — | — | — | — | — |
| R3 (11) | — (Xbox: hace de panel táctil) | — | (Xbox: saltar la fase) | ordenar | — | — | (Xbox: abre el aviso) |
| ↑ (12) | poción de vida | poción de vida (al lado de una bolsa de botín: sube en su lista) | — | arriba | arriba | arriba | — |
| ↓ (13) | abrir o cerrar la línea de tiempo | igual (al lado de una bolsa de botín: baja en su lista) | listo | abajo | abajo | abajo | — |
| ← (14) | poción de estamina | habilidad 5 | — | izquierda | izquierda | izquierda | — |
| → (15) | poción de maná | habilidad 6 | — | derecha | derecha | derecha | — |
| PS (16) | — | — | — | — | — | — | — |
| Panel táctil (17) | — (Mapa del tester: abre el panel) | — | saltar la fase | — | — | — | abre el aviso |
| Palanca izq. | moverse | moverse | moverse | moverse por la ventana | moverse por la ventana | moverse | — |
| Palanca der. | apuntar | apuntar | apuntar | mover el árbol de habilidades | — | — | — |

Con el aviso chico del tutorial a la vista, el panel táctil (RS en Xbox) lo abre antes que cualquier otra cosa; el cartel
grande se cierra con ✕ o ○. Muerto en línea, aceptar (✕, o ○ en Modo 2) pide reintentar. Aceptar y volver salen de
`CTRL.menuPad(i)` (`si` y `no` de cada distribución en `PAD_MODES`): nunca escribas el botón 0 o 1 fijo en una ventana.

**Libres hoy:** R3 en la partida con mando de PlayStation (en Xbox es el panel táctil), PS (16, el sistema lo usa y conviene
no tomarlo), L1 + ↑ y L1 + ↓ lejos de una bolsa de botín, L1 + L2, L1 + L3 y L1 + R3 (hoy hacen lo mismo que sin L1), y en el mercader y el herrero □, L1,
R1, L2, R2 y R3.

**Choques resueltos el 21/10/2026:** RS en Xbox ya no usa la habilidad elegida (le quedan el aviso del tutorial, saltar la
fase y el panel del tester, que nunca están a la vez); R3 "usar la habilidad elegida" y L3 "cambiar la elegida" se sacaron del
mando (L3 es correr en las dos distribuciones, así que la elegida no se podía cambiar, y la ayuda no lo mostraba); el Modo 2
cambia aceptar y volver también en los menús y las ventanas, y los íconos de `GLIFOS` lo siguen.

Para sumar una acción de mando: el botón en `PAD_MODES` o en el contexto que corresponda, su ícono en `GLIFOS.de`, su fila en
`mapaPad` (la ayuda) y su línea en esta tabla.

## 4. Qué falta para Steam (lo primero)

- Integrar Steamworks en `escritorio/`: logros (los cascos ya son casi logros), nube de Steam y overlay.
- Probar en Steam Deck: interfaz legible a 1280×800, todo navegable con mando, sin teclado.
- Página de la tienda: cápsulas, capturas, tráiler (se puede armar con clips del stream).
- Una **demo** corta y muy pulida (una zona y su jefe) para un Steam Next Fest.
- Terminar lo que el juego ya promete: por ejemplo, la ayuda de controles dice "Bloquear con el escudo" y todavía no existe el bloqueo.

## 5. Estado actual respecto a estas reglas

A la fecha de este documento (septiembre de 2026):

- **Bien:** la lógica ya usa acciones (`CTRL`) y soporta mando; el juego corre en el navegador; el arte es vectorial; la red es por anfitrión con un protocolo propio.
- **Pendiente** (no hace falta arreglarlo ya, pero sí cuando se toque cada parte):
  - El inventario y la herrería usan el arrastre del navegador (`dragstart`): pasar a `pointer events`.
  - El clic derecho se usa en varios lugares (por ejemplo "reemplazar" en el inventario): asegurar que siempre haya otra forma.
  - La ayuda de controles de `js/equipo/eromash-hud.js` tiene textos fijos en español (y "Clic izq." escrito a mano): pasarlos a `js/comun/i18n.js` y según el dispositivo.
  - No hay ningún control táctil: está bien, no se hace hasta que se decida ir a celular.

## 6. Si hay dudas

Ante la duda entre "mejor para PC" y "más fácil para celular", **gana PC**. Si una regla de este documento obligara a empeorar algo en PC, se avisa a Alejandro en vez de seguirla a ciegas.
