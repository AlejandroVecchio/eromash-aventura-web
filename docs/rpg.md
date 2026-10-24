# Eromash · La aventura: los sistemas de rol

Niveles, estadísticas, objetos, armas, oficios, comercio, bestiario, recompensas, habilidades e instructores. Cada
sistema es un archivo propio que se enchufa al motor como los demás (`window.SISTEMAS`), con sus textos en los dos
idiomas y su archivo de pruebas en `aventura/pruebas/`. Este documento junta las fórmulas y los ganchos para no
tener que leer el código para balancear.

## Reglas de siempre

- Todo golpe enemigo sigue las reglas de la arena: aviso exacto en el piso, saltar evita todo, **nada saca más del
  35 % de la vida** (ahora el 35 % de la vida máxima de Eromash, que sube con el nivel y lo que lleva).
- Todo texto en `aventura/js/textos/` con `es` y `en`. Toda acción por `CONTROLES`, nada solo con hover ni clic derecho.
- Todo lo nuevo que se dibuja en el mundo se puede ver desde cualquier lado (regla del 24/10/2026): volúmenes con
  caras o vistas elegidas según el ángulo de la cámara; lo que va en el piso, en coordenadas del mundo.
- Todo efecto caro mira `CALIDAD.nivel`.

## Ganchos del motor que usan estos sistemas

- `RPG.aporte(fn(s, nivel))`: suma estadísticas. `s` trae `vida, estamina, dano (multiplicador), crit (0..1),
  critMult, velAtq, velMov, runico, armadura, regen, xp, plata, botin, lampara`. `RPG.recalcular()` junta la base de
  PODERES (forja de Ása, manzanas, poder rúnico) con todos los aportes y lo deja en `jug.hpMax`, `jug.staMax`,
  `J.mulDano`, `J.critProb`, `J.critMult`, `J.velAtq`, `J.velMov`, `J.armadura`, `J.poderRunico`, `J.lampara`.
- En un sistema: `modDano(dano, criatura, info)` cambia el daño de cada golpe de Eromash (`info = { d, critico,
  sorpresa, contra }`); `alPegar(criatura, dano, info, murio)` avisa cada golpe que entró; `modRecibido(dano, tipo,
  ox, oy)` cambia el daño que recibe Eromash antes de la armadura.
- La armadura resta `armadura / (100 + armadura)` del golpe (100 de armadura = la mitad).
- `A.columnaRunica(x, y)`, `A.textoFlotante(x, y, texto, color)` y `A.polvareda(x, y, n)` quedan a mano de los sistemas.

## Niveles y experiencia (`motor/rpg.js`, textos `rp.`, estado `E.extra.rpg`)

- Nivel 1 a 30. Para pasar del nivel *n* al siguiente: `60 · n^1.45 + 40` (100, 658 en el 5, 1730 en el 10, 4660 en
  el 20). Un recorrido entero del bosque (todos los grupos una vez, misiones, lugares, cofres, piedras) deja cerca
  del nivel 17; lo demás sale de recompensas, jefes y grupos que vuelven.
- Cada nivel: +6 de vida y +3 % de daño (los atributos y el equipo suman el resto).
- Nivel de cada criatura: los lobos y errantes de la historia son 2 y 3, el Custodio 5. Las de los grupos: `1 +
  distancia al Puesto / 800` más lo que el grupo tiene de más duro que su distancia (`(mas − 1 − d/14000) · 8`);
  cuervos −1, troles +2, líderes +1, únicos +3, semijefes +2. Al ponerle el nivel se le suma `8 %` de vida y `4,5 %`
  de daño por nivel.
- Experiencia de una criatura: `base del tipo × (1 + 0,25 · (nivel − 1))`, líderes ×4, únicos ×10, semijefes ×6,
  y según la diferencia de nivel: `1 + 0,1 · diferencia` (entre 0,1 y 1,3); 6 o más niveles por debajo da el 10 %.
- Colores del número de nivel (como el WoW): rojo 5 o más arriba, coral 3–4, dorado ±2, verde 3–5 abajo, gris.
- Otras fuentes: misión cumplida `120 + 90 · misión`, lugar descubierto `60 + 4 · nivel`, cofre `25` (importante
  `60`) `+ 3 · nivel`, piedra despierta `40`, rito `90`, campamento liberado `70` (`+ 4 · nivel`).
- Prueba: `?nivel=12` arranca una partida nueva en ese nivel.

## Atributos (`motor/atributos.js`, textos `at.`, estado `E.extra.atrib`)

- Fuerza (Uruz), Destreza (Ehwaz), Vigor (Thurisaz) y Espíritu (Ansuz). Arrancan en 10; cada nivel da 3 puntos
  (más `extra`, que suman libros y proezas con `ATRIBUTOS.sumarPuntos(n)`).
- Cada punto por encima de 10: Fuerza +1,5 % de daño y +0,4 de armadura · Destreza +0,4 % de crítico, +0,6 % de
  velocidad de golpe y +0,2 % de velocidad al andar · Vigor +5 de vida, +2 de estamina y +1 % de vida que vuelve ·
  Espíritu +2 % de poder rúnico y +1,5 % de energía rúnica que vuelve.
- Pestaña Atributos de la mochila (U la abre directo; `INVENTARIO.pestana(def)` deja sumar pestañas): lo repartido
  queda en borrador hasta Confirmar; Reacomodar todo devuelve los puntos (gratis la primera vez, después
  `40 × nivel` de plata, se toca dos veces). Un rombo dorado sobre la casilla de la mochila avisa que hay puntos.

## Pruebas

`node aventura/pruebas/correr.cjs [filtro]` (con Playwright instalado) abre el juego sin ventana en la ranura 9 y
corre los archivos `aventura/pruebas/*.js`. Cada sistema suma su archivo con sus casos.
