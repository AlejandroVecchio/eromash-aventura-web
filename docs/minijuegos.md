# Los minijuegos de Eldervald

Todos se juegan en su propio lienzo de 1600 × 900 con el motor `MINIJ` (`aventura/js/motor/minijuegos.js`): el paño oscuro, la luz rúnica #73D5DB, el violeta de las ataduras #9A6BD8, las piedras planas con la luz de arriba a la derecha y las runas del futhark. Se controlan por acciones (flechas o stick, E, Esc) y con el puntero (tocar y arrastrar), nunca solo con el hover ni el clic derecho. Cada uno tiene **variantes** que reutilizan el mismo juego con otras reglas (más grande, contra el tiempo, ligado, a ciegas…), y cada uno está enchufado a algo del juego: cofres, encargos, misiones o acertijos. Todos salen en Probar mecánicas → Minijuegos con cada variante, sin tocar `probar.js`.

## Cómo se suma uno

Un archivo `aventura/js/motor/mj-<nombre>.js` que llama a

```js
MINIJ.registrar("nombre", {
  variantes: { base: { … }, otra: { …, tiempo: 60 } }, // tiempo: el motor pone el reloj y corta
  pie: "mn.nombre_pie",                                 // la línea de teclas de abajo
  armar(S),            // arma la partida en S (S.v = las reglas de la variante, S.rnd = azar con semilla)
  paso(S, dt),         // lee CONTROLES y anima
  tocar(S, i),         // la acción sobre la casilla i (teclado y puntero llegan acá)
  hit(S, x, y) → i,    // qué casilla hay en (x, y) del lienzo
  arrastre(S, x, y, fase), // opcional: "baja" | "mueve" | "sube" (devolver true en "baja" si lo toma)
  res(S) → texto,      // la línea del cartel final
  dibujar(S, D),       // D: c, P, texto, runa, piedra, rombo, halo, sonar
});
```

y se juega con `MINIJ.empezar("nombre", { variante, quien, x, y, semilla, fin(res) })`. Al terminar `fin` recibe `{ gano, dejo, tiempo, … }` y quien lo pidió decide (abrir el cofre, avanzar el encargo). Textos en `aventura/js/textos/` con prefijo `mn.`: `mn.<nombre>` (título), `mn.<nombre>_v_<variante>`, `mn.<nombre>_pie`, `mn.<nombre>_res`.

## La cerradura de anillos (`mj-anillos.js`)

Anillos de piedra concéntricos con ocho runas cada uno; hay que girarlos hasta que en la ranura de arriba se lea la palabra del cerrojo (la tapa de la izquierda, del anillo de afuera al de adentro). ▲ ▼ eligen el anillo, ◀ ▶ lo giran; con el puntero se toca el lado del anillo hacia donde girarlo. Siempre tiene solución: se arma resuelta y se desordena con las mismas reglas.

| Variante | Reglas | Dónde está |
| --- | --- | --- |
| base | tres anillos | uno de cada cuatro arcones del leñador |
| cuatro | cuatro anillos | — |
| ligados | cuatro; girar uno mueve el de afuera al revés (ataduras violeta) | los cofres rúnicos, el cofre de la sala del tesoro de las mazmorras |
| reloj | cuatro, 50 s | las arcas enterradas de los mapas del tesoro |
| gran | cinco ligados, 110 s | los cofres de las islas |

Perder no cuesta nada: el cofre sigue cerrado y se puede volver a intentar.

## Las variaciones de los juegos de runas (`juegos-runas.js`)

(próximamente)

## Las losas deslizantes

(próximamente)

## El hilo de las Nornas

(próximamente)

## Tallar la runa

(próximamente)

## El tambor del skald

(próximamente)

## Hachas al blanco

(próximamente)

## El rayo de luz rúnica

(próximamente)

## Hnefatafl (`mj-tafl.js`)

El juego de tablero de los nórdicos sobre la tabla de Fjalar: el rey (con su corona de oro) y sus defensores (Algiz) en el medio, los atacantes (Tiwaz) en los bordes. Todas las piezas corren en línea recta como la torre, sin saltar. Solo el rey se para en el trono y en las esquinas; las demás pasan por encima del trono vacío. Una pieza queda tomada entre dos enemigas, o entre una enemiga y una casilla hostil (esquina o trono vacío); el rey ayuda a tomar. El rey gana llegando a una esquina; los atacantes ganan rodeándolo por los cuatro lados (el trono cuenta como atacante). Quien no puede mover pierde. Se toca una pieza (se marcan sus destinos) y después adónde va; con el teclado, flechas y usar. Devuelve `{ gano, jugadas }`.

- **Variantes**: `base` (brandubh de 7, el jugador defiende), `ataque` (el jugador ataca y Fjalar defiende), `borde` (al rey le alcanza cualquier borde), `reloj` (escapar en 24 jugadas) y `gran` (tablut de 9).
- **Fjalar piensa** una jugada adelante: gana si puede, toma si puede, nunca deja el escape (o el encierro) servido y no deja una pieza para que se la tomen.
- **Dónde está**: el Hongo Dorado (`hongo.js`). Del lado de su cajón al que mira Fjalar aparece «Jugar al hnefatafl con Fjalar».
  - Cada partida ganada sube de tabla: borde, base, reloj, ataque, gran (`st.tafl`).
  - La apuesta (plata y experiencia) se cobra una vez por día (`st.taflDia`).
  - `HONGO.taflConFjalar()` lo abre sin caminar (pruebas).

## El rastreo con la Lente

(próximamente)
