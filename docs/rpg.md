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
  critMult, velAtq, velMov, runico, armadura, regen, regenRunica, xp, plata, botin, lampara` (el equipo suma además
  `robo` y `fuego`). `RPG.recalcular()` junta la base de
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

## Objetos y botín (`equipo/objetos.js`, `equipo/arte.js`, `motor/botin.js`, textos `ob.`, estado `E.extra.equipo`)

- Una pieza: `{ u, b (base), r (rareza 0-3), n (nivel de objeto), a: [[estadística, valor]], nm (nombre), tema, v,
  d (daño, armas), ar (armadura) }`. `OBJETOS.generar({ n, r, base, slot, min, hallazgo, tema, rnd })` la arma;
  `OBJETOS.azar(semilla)` da un azar repetible.
- Rarezas como en el Diablo: **común** (#F2ECEC, sin afijos), **mágica** (#4A78D0, 1 o 2: a lo sumo un prefijo y un
  sufijo), **rara** (#FFD98A, 3 o 4, nombre propio «Colmillo del Invierno»), **legendaria** (#F5A524, 5 en la parte
  alta de su rango). Chances base 70 / 24 / 5,4 / 0,6; «botín mejor» (`s.botin`) multiplica las tres de arriba.
- Daño del arma: `base × (1 + 0,04 · (n − 1)) × rareza` (×1 / 1,08 / 1,16 / 1,3); el golpe de Eromash se multiplica
  por `daño / 10` (la Espada del forastero es 10) y su velocidad por la de la base. Armadura de una pieza:
  `base × (1 + 0,07 · (n − 1)) × rareza`.
- Afijos (valores al nivel de objeto *n*, mín–máx): daño +4+0,4n–9+0,9n % · fuego por golpe · crítico · velocidad de
  golpe · armadura · vida 6+1,5n–12+3n · poder rúnico · robo de vida · Fuerza/Destreza/Vigor/Espíritu 1–(2+n/6) ·
  estamina · vida que vuelve · velocidad al andar (solo botas) · daño crítico · energía rúnica · plata · experiencia
  · botín mejor. Cada base tiene dónde puede salir cada afijo (`AFIJOS[k].en`) y algunas traen uno fijo (`implicito`).
- Qué cae: una criatura común 7 %, un líder 55 % (×1,8 de botín mejor), un único siempre y rara o mejor, un semijefe
  dos piezas raras o mejores, el Custodio, el oso y los troles 80 %. Los cofres: 40 % (los importantes siempre, mágica
  o mejor), y la pieza vuela sola a la bolsa. El nivel de objeto es el de la criatura; el de un cofre, el del lugar
  sin quedar más de un nivel debajo de Eromash.
- Lo tirado queda en el piso (plano, gira con la cámara) con un haz del color de la rareza y su nombre; los nombres se
  apilan sin pisarse. Se junta con E. La bolsa guarda 30 piezas; desarmar da el 30 % de su valor
  (`(4 + 1,6n) × [1, 2,5, 6, 15] × (1 + 0,15 por afijo)`) en plata.
- El dibujo: espadas, escudos, cascos, pecheras, pantalones y botas con el arte de la arena (`juego/js/equipo/`,
  `juego/img/cascos/`), en el tema del lugar donde cayó (cerca del Puesto el bosque; al norte Helheim, al este la
  costa, al oeste el volcán y al sur la arena). Amuletos y anillos propios en `arte.js`.
- Los atributos del equipo suman con `ATRIBUTOS.bono(fn)`; lo demás con `RPG.aporte`.

## Armas (`motor/armas.js`, dibujo en `equipo/armas-dibujo.js`, textos `ar.`)

- Cada tipo de arma trae su juego de golpes: `{ combo: [3 golpes], giro (mantener atacar), carrera, caida, carga
  (segundos), coste (estamina) }`; el motor pide `ARMAS.golpes(los de la espada)`. Un golpe es `{ wind, swing, rec,
  arc, reach, dano, empuje }` más banderas (`remate`, `giro`, `avanza`, `caida`) y las del tipo. Un tipo nuevo:
  `ARMAS.tipo(id, def)` y bases con `tipo: id` en `OBJETOS.BASES`.
- **Espada**: la de siempre (16 / 20 / 32, giro 28).
- **Hacha**: 19 / 22 / 40 (el tercero, el hachazo, angosto y largo, parte el piso), más lenta (≈1,7 s el combo
  contra 1,55 de la espada). Un golpe de cada tres (el hachazo siempre) hace **sangrar**: el 40 % del golpe en 3 s, de
  a 0,5 s. **Cargada (0,55 s, 18 de estamina) se lanza**: vuela 380 a 1000 por segundo, corta a la ida y a la vuelta
  (24 de daño base, crítico y robo de vida como un golpe), choca contra árboles y rocas y vuelve sola. Mientras vuela,
  Eromash pega con los puños (7 / 8).
- Cinco hachas de una mano: de mano (1), barbuda (4), rúnica (9, +8 % de poder rúnico), de hueso (13, 1 % de robo de
  vida) y de doble filo (16). El dibujo (`DIB_ARMAS.forma(id, fn)`) usa el lenguaje de las espadas de la arena: cinco
  escalones con tientos de cuero, remaches de oro, runas que laten y el filo encendido de la legendaria.
- **A dos manos** (`mandoble`, `hacha2`; bases con `dosManos: true`): 17 / 19 / 32, barridos de 3,2 rad con envión
  (mientras pega camina al 35 %, `d.mueve`; `d.peso` inclina más el cuerpo) y un tercero desde arriba (`piso`) que
  hace una **onda** (`ARMAS.ONDA`: radio 170, tambalea 0,6 s, 0,25 a líderes y pesados) además del remate. El golpe al
  caer de un salto también hace onda. **Manteniendo atacar, torbellino** (`ARMAS.TORB`): desde 0,45 s de carga gira
  dando la vuelta cada 0,3 s (9 de daño por vuelta con todo lo de un golpe), deja andar al 70 % y gasta 26 de
  estamina por segundo hasta soltar o quedarse sin. `ARMAS.pose` lleva el arma al hombro detrás de la espalda, la
  estira girando, la sube y la baja en el remate. Poner una saca el escudo a la bolsa y un escudo no entra mientras
  se lleva (`BOTIN.equipar`, aviso `ob.dos_manos_*`). El hacha danesa (`hacha2`) además sangra y su remate agrieta.
- Cinco mandobles (mandoble 2, espadón 6, espadón rúnico 11, de hueso 15, flamígera 18 con fuego) y cinco hachas
  danesas (danesa 3, de guerra 8, gran hacha rúnica 12, de hueso 15, lábrys 19). Pegan ≈ 1,7 veces una de una mano
  y son ≈ 25 % más lentas.
- **Arco** (`motor/arco.js`, `ARCO`; dibujo `equipo/arcos-dibujo.js`): los golpes traen `disparo: { dano, n, abre,
  tenso }` y `arc`/`reach` mínimos (el motor no corta nada); el sistema suelta las flechas al terminar el envión.
  Combo 12 / 12 / abanico de 3 × 10; corriendo 12 sin frenar (`mueve: 1`); al caer, lluvia de 5 × 9; cargado (0,7 s,
  14 de estamina) el **tiro tenso**: 42, atraviesa, vuela 1150 a 1900 por segundo. Las comunes vuelan 820 a 1250 y se
  quedan en la primera criatura. Se corren solas hacia la criatura más cercana delante (cono de 0,18 rad con mouse,
  0,5 con mando). Pegan como un golpe (crítico, sorpresa ×1,5 a la que está quieta, `modDano`/`alPegar` de los demás
  sistemas con `info.d.flecha`) y quedan clavadas 8 s. Tensando camina al 60 % y se ve la línea de tiro.
  `ARMAS.poseDe("arco", fn)` lo lleva en la mano y `DIB_ARMAS.tension` tensa la cuerda. Cinco arcos: de tejo (1),
  largo (5), rúnico (10), de asta (14) y recurvo de las estepas (17, +4 % de crítico). Van con las dos manos.
- **Lanza** (`motor/lanza.js`, `LANZA_ARMA`; dibujo `equipo/lanzas-dibujo.js`): estocadas 14 / 15 (arco 0,5, alcance
  150, `estoque`) y un barrido de 24 que empuja 2; corriendo, embestida de 26 que avanza 520; al caer, 28. Con la
  **punta** (`punta: true`, desde el 70 % del alcance) pega ×1,3 (`modDano`, «¡Punta!»). **Cargada (0,5 s, 16 de
  estamina) se arroja** (`LANZA_ARMA.TIRO`): 720 a 1350 por segundo, 30 de daño, atraviesa hasta 3, aturde 1 s al
  primero y se clava; se junta pasando por encima o vuelve sola a los 4 s (anillo rúnico en el piso). Mientras tanto,
  puños: `ARMAS.sinArma(fn)` deja la mano vacía mientras fn() da true. Se lleva con escudo. Cinco: de hoja (1), alada
  (5), rúnica (10), de hueso (13) y atgeir (17).

## Pruebas

`node aventura/pruebas/correr.cjs [filtro]` (con Playwright instalado) abre el juego sin ventana en la ranura 9 y
corre los archivos `aventura/pruebas/*.js`. Cada sistema suma su archivo con sus casos.
