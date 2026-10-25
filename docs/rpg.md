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
- **Martillo** (`motor/martillo.js`, `MARTILLO`; dibujo `equipo/martillos-dibujo.js`): 21 / 23 / 42 (el remate
  `temblor` hace un anillo en el piso), lento y con `peso`. Todo golpe con `machaca` suma uno a `e.machaca`; al tercero
  (o con el remate o el trueno) la criatura queda **quebrada** (`e.quebrado`, 4 s): `modDano` le da ×1,25 a todo lo
  que la toque, de cualquier sistema. Corriendo, hombrazo de 18 que aturde 0,6 s. **Cargado (0,65 s, 20 de
  estamina), el trueno** (`MARTILLO.TRUENO`): un giro de 16 y rayos sobre las 4 criaturas más cercanas a menos de
  280 (26 de daño, aturden 0,8 s y quiebran), con luz. Con escudo. Cinco: mazo (1), maza de pestañas (6), martillo
  rúnico (11), quijada de jötunn (14) y mazo de piedra (18).
- **Bastón rúnico** (`motor/baston.js`, `BASTON`; dibujo `equipo/bastones-dibujo.js`): pega con el arma **y** el
  poder rúnico (`J.mulDano × J.poderRunico`). Los golpes traen `conjuro`, `sello`, `parpadeo` u `ola` y el sistema
  los hace al terminar el envión. Combo: chispas de 10 / 10 / 12 que estalla (16 en 90 alrededor); las chispas
  vuelan 760 a 900 por segundo y se tuercen 4 rad/s hacia la criatura más cercana delante (`BASTON.CHISPA`); cada
  una que toca da 2 de energía rúnica (`PODERES.darEnergia`). Corriendo, **paso de niebla**: 230 adelante, 0,35 s
  intocable. Al caer, ola de 20 en 150. **Cargado (0,6 s, 12 de estamina), el sello** (`BASTON.SELLO`): un círculo
  con Algiz en la criatura apuntada (o a 270) que avisa 0,8 s en el piso y estalla: 34 en 130 y las deja atadas
  1,4 s (`e.atada`, anillo violeta). Con las dos manos. Cinco: vara de fresno (1), báculo de la völva (5, regeneración
  rúnica), cristal rúnico (10), de asta (14) y rama de Yggdrasil (18).

## Escudo (`motor/escudo.js`, `ESCUDO`, acción `bloquear`: G, Ctrl, L2 o clic derecho; textos `eb.`)

- Manteniendo bloquear se levanta el escudo (`jug.bloquea`): camina al 60 %, no carga golpes y no recupera
  estamina. Lo que llega de adelante (±75° de `jug.dir`, por `modRecibido`) pierde `B.bloqueo` % (sin escudo, con un
  arma que no sea arco ni bastón, 35 %) y gasta en estamina lo bloqueado. Sin estamina: **guardia rota** (0,9 s sin
  poder levantarlo, entra la mitad).
- **Parada**: si el golpe llega dentro de la ventana desde que se levantó (`B.parada`; 0,18 s sin escudo) no entra
  nada, la criatura más cercana al golpe queda aturdida 1,2 s y se le corta el aviso, cámara lenta, +20 de estamina y
  `jug.contra` (el próximo golpe pega doble, como la esquiva justa).
- Atacar con el escudo levantado: **empujón** (8, empuja 1,9, aturde 0,7 s, 12 de estamina).
- Escudos: de tablas (50 %, parada 0,24 s), redondo (60 %, 0,2), guarnecido (70 %, 0,18) y de cometa (82 %, 0,14):
  cuanto más bloquea, más difícil parar. El escudo se dibuja en el brazo con el arte de la arena (`ESCUDO.dibujar`,
  dos pasadas desde `dibujarJugador`: detrás de espaldas y de costado, delante de frente o levantado).

## Forja al ritmo del yunque (`motor/forja.js`, `FORJA`, modo `forja`; textos `fg.` en `textos/forja.js`)

- Se abre desde Ása («Forjar una pieza nueva» en su menú de `PODERES`) o desde su yunque (`forjaAsa` en la
  herrería de `interiores.js`). Cada grupo (`FORJA.GRUPOS`: los tipos de arma y las piezas de armadura) ofrece la
  base más nueva para el nivel de objeto (nivel de Eromash + 1). Costo: (40 + 12 × nivel) × modo, con la rebaja del
  renombre.
- Modos (`FORJA.MODOS`): **con calma** (84 ppm, a lo sumo rara) y **a fuego vivo** (112 ppm, acordes, ×1,6 de plata,
  puede dar legendaria).
- La canción (`FORJA.partitura(modo, semilla)`): un compás de cuenta, 4 de **fuelle** (notas largas en los carriles de
  afuera: mantenerlas calienta el hierro), 8 de **martillo** (negras y corcheas según la densidad, más seguidas hacia
  el final) y el **temple** (una barra con atacar). Las notas bajan en 1,5 s (`VIAJE`). Juicios (`JUICIO`): perfecto
  ±50 ms (1), bien ±95 ms (0,7), flojo ±145 ms (0,35); las largas valen 2 (el golpe y mantenerla).
- La nota = puntos / máximo + racha × 0,05 + temple (perfecto +0,06, bien +0,03, falla −0,06). Rareza: < 0,55 común,
  < 0,78 mágica, < 0,93 rara, si no legendaria (tope del modo). `calidad` = (nota − 0,4) / 0,6 va a
  `OBJETOS.generar`: los números se tiran en la parte alta (el daño o la armadura hasta +8 % / +18 % del techo de
  siempre) y la pieza guarda `it.forja` («Forjada por Ása · martillada al … %»).
- Controles por acciones: los cuatro carriles son las acciones `carril1`..`carril4` (A S D W de izquierda a derecha,
  o ← ↓ → ↑, la cruceta) o tocar el carril (pointer events, sirve para el celular). Las teclas se cambian en Opciones →
  Teclas o con «Teclas de la forja» en el menú de Ása (`CONTROLES.asignar`, grupo `forja`). La música sale de `SONIDO.tono`. Pausa deja y devuelve la plata.

## Materiales, vetas y desarmar (`motor/materiales.js`, `MATERIALES`; vetas en `mundo/assets-materiales.js`; textos `mt.` en `textos/materiales.js`)

- Cinco materiales (`MATERIALES.LISTA`): hierro de pantano, cuero curtido, ámbar, esquirla rúnica y brasa de Muspell.
  Estado en `E.extra.mat = { tiene, vetas, reloj }`. Se ven en la Bolsa de la mochila con su ícono
  (`INVENTARIO.iconoDe(tipo, fn)`, que sirve para cualquier cosa nueva que se lleve).
- **Desarmar** (`BOTIN.desarmar` llama a `MATERIALES.alDesarmar`): `deDesarmar(it)` sale de la casilla y la rareza con
  un dado fijo por pieza (lo que dice la mochila antes es lo que da). Armas hierro, armaduras cuero (y a veces
  hierro), escudos los dos, joyas ámbar; mágica +1 y quizás ámbar, rara +1–2 esquirlas, legendaria +1 brasa y +1
  esquirla. La plata de desarmar baja al 15 % del valor.
- **Criaturas** (`CRIATURAS`): lobo y jabalí cuero, oso 3 cueros y a veces brasa, draugr y custodio hierro y
  esquirlas, fatuo ámbar y esquirlas, trol y dreki brasas; los líderes tiran el doble de chance y de cantidad; los
  semijefes sin entrada, una brasa.
- **Vetas** (`vetaHierro`, `vetaAmbar`, `vetaRunica`, figuras): unas 30 con semilla fija, tres cerca del Puesto y el
  resto alrededor de los lugares (la rúnica lejos de casa), cada una con un claro chico. Se pican con E o a golpes
  (`alGolpear`, una vez por golpe; el martillo vale 2); a los 3 golpes (`GOLPES`) se rompen, sueltan lo de `VETAS` y
  quedan peladas `VUELVE` = 600 s de juego.
- **Forja**: `MATERIALES.costoForja(grupo, modo)`: armas 3 hierro (a dos manos y martillo 4; arco y bastón 1 hierro y
  1 ámbar, el arco también cuero), escudos 2 hierro y 2 cuero, armaduras 3 cuero y 1 hierro; a fuego vivo +1
  esquirla. Con una brasa aparece el modo **brasa** (`FORJA.MODOS.brasa`: como fuego vivo, la nota +0,08). Dejar a la
  mitad devuelve plata y materiales.

## Comercio (`motor/comercio.js`, `COMERCIO`; puesto de Kolbrun en `mundo/assets-comercio.js`; textos `cm.` en `textos/comercio.js`)

- Dos mercaderes (`MERCADERES`): **Ingrid** en su mostrador del Puesto (`NOMBRADAS.mostrador`; si ya se fue al norte
  lo atiende Eydis): 9 piezas de armas, escudo y armaduras (62 % comunes, 30 % mágicas, 8 % raras), hierro y cuero.
  **Kolbrun** con su alfombra (`alfombraKolbrun`, piso, dibujada en `piso`) y su fardo (`fardoKolbrun`, figura) cerca
  del Refugio: 6 piezas con joyas y alguna rara o legendaria, ámbar, esquirlas, a veces una brasa y cinco **piezas
  envueltas** (arma, armadura, escudo, amuleto, anillo) que se pagan sin ver (`OBJETOS.generar` con hallazgo 2,2).
- El stock sale de `DIB.azar(día × 7919 + mercader)` y se guarda por día (`E.extra.comercio.stock`); el día es el
  mismo cálculo de `vida.js` sobre `H.E.tiempo`.
- Precios: comprar `valor × 2,5 × (1 − rebaja del renombre)`, vender `valor × 0,35`, recomprar al precio de venta
  (ocho lugares, `E.extra.comercio.recompra`). `COMERCIO.modPrecio(fn(precio, info))` deja que otro sistema los
  cambie (el regateo).
- Interfaz: la pestaña `tienda` de la mochila (`INVENTARIO.pestana` con `visible()`, nueva) aparece solo mientras se
  comercia, con el nombre del mercader. Tocar lo suyo compra, tocar la bolsa vende (rara o mejor pide dos toques).
  En el mapa grande van con la miniatura `mercader` (clase «Mercaderes»).

## Regateo (`motor/regateo.js`, `REGATEO`; textos `rg.` en `textos/regateo.js`)

- En la pestaña del mercader, R (△) sobre una pieza (`COMERCIO.altCasilla`) abre la balanza (`#regateo`, encima de
  la mochila; toma el teclado y el mando con `INVENTARIO.capturar`).
- Pedidos (`PEDIDOS`): comprando −10/−20/−30 %, vendiendo +15/+30/+45 % sobre el precio sin tratos
  (`COMERCIO.precioCompraSin`/`precioVentaSin`). Zona (`ZONA` 0,30/0,19/0,11) × carácter × (0,55 + paciencia × 0,45)
  × (1 + 3 % por punto de Espíritu) × (1 + 8 % por nivel de renombre), tope 0,6; aguja (`VELOCIDAD` 0,75/1,05/1,4
  idas por segundo) × carácter, más rápida con menos paciencia.
- Acertar fija el precio de esa pieza ese día (`tratos["u:tipo"]`, aplicado con `COMERCIO.modPrecio`) y gasta 12 de
  paciencia; el 18 % del centro es trato redondo (+5 % Ingrid, +10 % Kolbrun). Errar gasta 34 y deja volver a pedir;
  sin paciencia, por hoy no regatea. Todo vuelve al día siguiente (`E.extra.regateo = { dia, paciencia, tratos }`).
- Carácter (`CARACTER`): Ingrid zona ×1,1 y aguja ×0,85; Kolbrun zona ×0,85 y aguja ×1,15.

## Bestiario (`motor/bestiario.js`, `BESTIARIO`, pestaña `bestiario` de la mochila; textos `bs.` en `textos/bestiario.js`)

- Diez criaturas (`LISTA`). Verla a menos de 520 la anota (silueta y nombre); vencerla (`alMorir`) suma muertes:
  1 abre la página (descripción, vida y golpe de `CB.TIPOS`, cómo avisa, qué deja según `MATERIALES.CRIATURAS`),
  10 el **punto débil** (consejo y +8 % de daño en `modDano`), 30 la **maestría** (otro +8 % y −10 % de lo que pega
  en `modRecibido`, buscando quién pegó por cercanía al origen del golpe) y la saga.
- Los retratos se dibujan con `CRIATURAS.dibujar` en grande, se recortan a lo que ocupan y se guardan (íconos
  `bs_<tipo>` y `bs_<tipo>_x`, la silueta, con `INVENTARIO.iconoDe`).
- Los cuatro únicos con nombre salen de `E.extra.hd.unicos` (hordas.js). Estado en
  `E.extra.bestiario = { vistas, muertes }`.

## Contratos de caza (`motor/contratos.js`, `CONTRATOS`; poste y rastros en `mundo/assets-contratos.js`; textos `ct.` en `textos/contratos.js`)

- El poste de los contratos (`posteContratos`) está frente al Puesto de Eydis. Seis bestias con nombre (`LISTA`), cada
  una de un tipo de `CB.TIPOS`, con su nivel recomendado, escolta, afijos de líder, plata y trofeo. Se toma uno por vez.
- Fases (`E.extra.contratos.c[id].fase`): `rastros` (tres `rastroContrato` en el piso, se examinan con E, la Lente los
  resalta), `guarida` (la bestia aparece como líder con `e.contrato` al acercarse a menos de 1300), `cobrar` (se vuelve
  al poste) y `vencido`. Repetirlo más tarde paga la mitad.
- Se sigue en el rastreador (`seguimiento`), en la brújula (hook nuevo `marcasBrujula()` → `[{ x, y, col }]` de
  exploracion.js) y en el mapa (hook nuevo `marcasMapa()` → `[{ tipo, x, y, op }]` de mapa.js, clase `contrato`).
- Trofeos (`TROFEOS`): se cuelga uno del cinto (`colgar`) y suma por `RPG.aporte` (velocidad de ataque, estamina,
  armadura, botín, energía rúnica, vida). Se ven y se cuelgan desde la Bolsa (`CONTRATOS.celdas()`).

## Árbol de habilidades (`motor/arbol.js`, `ARBOL`, pestaña `talentos` de la mochila, acción `talentos`: H; textos `ab.` en `textos/arbol.js`)

- Tres ramas: el Oso (armadura, daño, vida, remate, menos daño con poca vida), el Lobo (velocidad, crítico,
  velocidad de golpe, daño de crítico, daño a heridas) y el Cuervo (botín, poder rúnico, experiencia, energía
  rúnica, contraataque). Seis nodos por rama con 3, 3, 3, 2, 2 y 1 rangos: 42 en total, y al nivel 30 hay 29 puntos.
  Así no se llena todo y hay que elegir.
- Cada nivel desde el 2 da un punto, más `extra` (`ARBOL.sumarPuntos(n)`: libros, instructores). Las filas piden 0, 3,
  6 y 10 puntos en la rama (`FILAS`) y algunos nodos a su padre (`pide`).
- Los nodos pasivos suman por `RPG.aporte`; los demás por `modDano` (remate y caída, criaturas con menos del 35 %,
  contraataque, sorpresa), `modRecibido` (Sangre fría, Corazón de Björn: si el golpe deja la vida en 0, después de la
  armadura, lo anula y deja el 30 %; espera 120 s), `alPegar` y `alMorir` (Acecho: 3 s de +25 % de velocidad; Hugin y
  Munin: 6 de energía rúnica, 25 con un líder o semijefe, y 2 % de vida).
- «Olvidar todo»: gratis la primera vez, después `25 × nivel` de plata, se toca dos veces. Otros sistemas suman nodos
  con `ARBOL.sumar(rama, nodo)`. Estado en `E.extra.arbol = { r: { id: rango }, extra, olvidos }`.

## Furia y habilidades activas (`motor/furia.js`, `FURIA`; con teclado en casillas de la barra (1 a 6), con mando L2 + □ △ ○ (acciones `hab1`, `hab2`, `hab3`); textos `fu.` en `textos/furia.js`)

- La Furia (0 a 100) arranca en 0, suma 5 por golpe (8 si es crítico, nada por los golpes de las habilidades) y 0,6 por
  punto de vida perdido; a los 5 s sin pelear se enfría 8 por segundo. No se guarda. Su barra (`#bFuria`) va debajo
  de la estamina y solo se ve si hay alguna habilidad aprendida.
- Tres habilidades, cada una un nodo `activa` (círculo) de la tercera fila de su rama, con 2 rangos (`ARBOL.sumar`):
  Rugido de Björn (40/35 de Furia, 8/7 s: aturde a 280 (×1,2 en rango 2), 1,4 s o 0,8 a líderes, expone 5 s +15 %, +20
  de armadura 5 s), Salto del lobo (30/25, 5/4 s: usa `jug.salto` para el arco y la invulnerabilidad, va hasta 330
  hacia la criatura de enfrente sin cruzar muros, pega 160/200 % de 28 × `J.mulDano` a 150 al caer) y Bandada (45/40,
  10/9 s: 5/7 cuervos buscan criaturas a 440, pican 55 % y marcan 6 s, +12 %). Los golpes pasan por los `modDano` y
  `alPegar` de todos, con `info.d.habilidad`.
- Hooks nuevos: `cosasBarra()` de un sistema suma cosas que el jugador puede poner en la barra de abajo (`BARRA`: `{ id: { tipo, icono, nombre, desc, tiene, listo, espera, usar, avisa } }`); en `CONTROLES`,
  `COMBOS` son botones del mando que se aprietan juntos (mientras tanto, esos botones no hacen lo suyo).

## Instructores y muñeco de práctica (`motor/instructores.js`, `INSTRUCTORES`; muñeco en `mundo/assets-instructores.js`; textos `ie.` en `textos/instructores.js`)

- Tres maestros (fichas propias sumadas a `GENTE.FICHAS`): Hallbera en el patio del Puesto (Oso), Ulfar cerca del
  refugio (Lobo) y Vör junto al túmulo (Cuervo). Tres lecciones cada uno (nivel 3/9/16, plata 60/180/420): cada una
  suma por `RPG.aporte` (vida, armadura, daño · crítico, velocidad de golpe, daño de crítico · poder rúnico, energía
  rúnica, experiencia) y da `ARBOL.sumarPuntos(1)`.
- Antes de cada lección se pide su prueba en el muñeco (`st.prueba`): daño 250/600/1100 en 10 s, críticos 3/4/5 en
  12 s, o esquivas justas 2/3/4 en 16 s al brazo del muñeco (aviso exacto en el piso con `piso`; al llenarse llama
  `J.herir(0, …)`, que cuenta la esquiva justa del motor si Eromash salta o esquiva justo).
- El muñeco es un blanco de CB: `CB.TIPOS.muneco` con `blanco: fn(e, dano)` (no muere, no se mueve, no piensa) y
  `dibujo: "munecoPractica"` (combate.js lo dibuja con `ASSETS.dibujar` y `e.o`). Medir el daño: 10 s con un cartel
  arriba (`#ieMuneco`) y el resultado; la mejor marca queda en `st.mejor`. Durante la sesión su estado es
  `practica`, así no cuenta como golpe por sorpresa.
- Estado en `E.extra.instruc = { lec, prueba, pasada, mejor }`. Mapa: clase `instructor`.

## El frasco de Thora (`motor/frasco.js`, `FRASCO`; en una casilla de la barra o con L2 + ✕ (acción `frasco`); textos `fr.` en `textos/frasco.js`)

- Cargas (3 a 6, `E.extra.frasco = { cargas, max, fuerza }`). Cada trago cura `40 % × (1 + 0,1 · fuerza)` de la vida
  máxima repartido en 1,2 s (un golpe no lo corta) y pone `jug.lento` 0,5 s. No se toma con la vida llena.
- Se llena al entrar a un pueblo o refugio (la misma lista que `REFUGIOS` de combate.js) y cuando Thora cura: el frasco
  envuelve `PODERES.hablarCon` (los encargos de `SECUNDARIAS` siguen hablando primero) y después del diálogo abre su
  menú de mejoras: cargas 80/160/300 de plata + 1/2/3 ámbar, fuerza 120/240/420 + 1/2/3 esquirlas.
- La cosa de la barra (hook `cosasBarra`) usa los íconos `frasco_<cargas>_<max>` con una marca por carga.

## Hierbas y alquimia (`motor/alquimia.js`, `ALQUIMIA`; plantas y mesa en `mundo/assets-alquimia.js`; textos `aq.` en `textos/alquimia.js`)

- Seis hierbas (`HIERBAS`, assets `hierba*`), unas 70 plantas con semilla fija: musgo, serbal y abedul alrededor de
  cada lugar, hongo de luna (de noche `o.noche`, alumbra), cardo cerca de túmulo, torre, Skarnholt, santuario y de los
  grupos de draugr, flor de escarcha en las orillas de `RIOS` y `LAGOS`. Cada una abre un claro chico. Se juntan con E
  (1 o 2) y vuelven a los 480 s de juego (`cosechadas`, `reloj`). La Lente las marca.
- Mesa de alquimia en el patio del Puesto: pestaña `alquimia` (solo abierta desde la mesa). Pociones (`POCIONES`:
  tónico, sangre de oso, ojo de búho, aliento de lobo, brebaje de Mímir) con duración y toxicidad (máximo 100, baja
  1,5/s); sus efectos suman por `RPG.aporte`. Aceites (`ACEITES`): +25 % contra su familia por `modDano`, 40 golpes
  que gasta `alPegar` (el muñeco no gasta).
- Destilar es un juego (`motor/matraz.js`, `MATRAZ`, modo `matraz` por `J.modos`): el matraz de Erlenmeyer se mueve con
  `izquierda`/`derecha`, el stick o arrastrándolo; caen motas (3 por hierba de la receta, el costado dice cuántas de qué
  color); las de otra hierba o la podredumbre ensucian (−12 %), las de más restan 3 %. La efectividad (20 a 100 %)
  queda con cada frasco (`st.ef["pocion:id"]`, se usan primero los mejores) y escala lo que suma (`s(s, k)`, la cura, el
  bono y los golpes del aceite). `ALQUIMIA.destilar(cual, id, ef)` destila sin jugar. Suena a burbujas con
  `SONIDO.burbujas(x, y)`, que se apaga a los 700 de la mesa.
- Hooks nuevos: `celdasBolsa()` de un sistema suma casillas a la Bolsa. La poción elegida (R / △ en la Bolsa) tiene
  cosa en la barra (`cosasBarra`, se pone en cualquier casilla) y acción `pocion` (L2 + R1). Sobre el retrato, `#hudEfectos` lista efectos, aceite y toxicidad.
- Estado en `E.extra.alq`.

## Cocina en la fogata (`motor/cocina.js`, `COCINA`, modo `cocina`; textos `co.` en `textos/cocina.js`)

- Carne (`CARNES`): lobo 60 %, jabalí 75 %, oso 100 % (2), con semilla por criatura, en `alMorir`. Va a la Bolsa con
  `celdasBolsa`.
- Fogatas: los `fogonOlla` sin `apagado` y los `brasero` con `encendido` de `W.COSAS`. «Cocinar» abre un menú con los
  cinco `PLATOS` (carne + hierbas de `ALQUIMIA`). Elegir uno gasta los ingredientes y pone el modo `cocina`: la tabla de cortar.
  Cada ingrediente salta por el aire (`vuelo(n)` = 1,3 + 0,75 s por corte) con sus cortes marcados con flechas
  (`CORTES`: lobo y jabalí 4, oso 5, pescado 3, hierbas 2); se hacen en orden deslizando (50 px) o con
  `izquierda`/`derecha`/`arriba`/`abajo` (y el stick). Entre los ingredientes saltan uno o dos huesos que no se cortan.
  Lo bien cortado (`precision()`: cortes bien / total, −8 por corte errado, −15 por hueso cortado) da a punto (≥ 90,
  ×1,4 y dura ×1,5), bien (≥ 55), desparejo (≥ 20, ×0,5) o arruinado (no se come). El fuego suena en la fogata, corto.
- Una comida por vez (`st.comida = { id, queda, k }`), suma por `RPG.aporte` y llena la vida al comer.
- Hooks nuevos: `J.modos[nombre] = fn(dt)` corre cada cuadro mientras `J.modo` es ese nombre (juego.js), y
  `efectosHud()` → `[{ texto, n, col }]` suma a la tira de efectos sobre el retrato (alquimia.js).
- Estado en `E.extra.cocina`.

## Muescas, tallas y palabras rúnicas (`motor/engarces.js`, `ENGARCES`; textos `en.` en `textos/engarces.js`)

- Muescas (`it.e`, `it.g` = tallas puestas): al generar (`OBJETOS.generar` llama a `ENGARCES.alGenerar`; `sinMuescas`
  lo evita) salen en común 30 % (1 al máximo), mágica 14 % (hasta máximo − 1), rara 6 % (1); legendarias nunca. Máximo
  por casilla (`MAX`): arma, escudo, pecho y casco 3; piernas, botas y amuleto 2; anillos 0.
- Tallas (`TALLAS`, de común a rara: Fehu, Uruz, Thurisaz, Jera, Algiz, Ansuz, Hagalaz, Tiwaz): cada una suma
  `arma` en un arma y `otro` en lo demás. Caen 3,5 % de cualquier criatura, 22 % de un líder, siempre de un único y
  dos de un semijefe (`alMorir`), y 25 % de los cofres (siempre de los importantes). `sortear(nivel)` deja salir las
  raras recién desde nivel 3 en adelante (3 + nivel/3 tallas posibles). Tres iguales se unen en la siguiente (`unir`).
- Encastrar (`engarzar`) es en orden y para siempre; `vaciar` devuelve todo por 20 de plata por talla.
- Palabras (`PALABRAS`): pieza **común**, casilla de la lista, muescas = largo de la receta y tallas en ese orden. Suman
  su `da` además de las tallas; nombre «…» (`OBJETOS.nombre` pregunta `it.pr`) y el detalle suma sus líneas
  (`ENGARCES.lineas`). Lo que suman las tallas y la palabra queda en `it.ex`, que `OBJETOS.sumar` lee.
- Ása (hook nuevo de forja.js: `botonesAsa()` → `[{ texto, sub, fn }]`): abre muescas en una pieza sin muescas que no
  sea legendaria (común: el máximo, mágica: máximo − 1, rara: 1) por 40 + 10 × nivel de plata, 2 de hierro y 1 esquirla.
- Pestaña «Tallas» de la mochila (visible con piezas con muescas o tallas) y las tallas en la Bolsa.
- Estado en `E.extra.engarces = { tallas, hechas }`.

## Conjuntos de equipo (`motor/conjuntos.js`, `CONJUNTOS`; textos `cj.` en `textos/conjuntos.js`)

- Rareza nueva en `OBJETOS.RAREZAS[4]` (`conjunto`, verde, mult 1,2, sin afijos al azar): la tirada normal nunca la da,
  solo `CONJUNTOS.crear(juego, casilla, n)`, que pone `it.cj`, `it.cs` y dos afijos fijos al 80 % de su tirada del nivel.
- `JUEGOS`: guardia (casco, pecho, escudo, botas), fenrir (arma, casco, piernas, amuleto), odin (arma, anillo, amuleto,
  pecho). Bonos de 2 y 3 piezas (`bonos`) por `RPG.aporte` con `OBJETOS.aportar`; las 4: guardia `modRecibido` × 0,85,
  fenrir al matar (`alPegar` con `murio`) +30 % de velocidad de ataque y movimiento 3 s, odin +3 de energía rúnica por
  crítico.
- Caen: único 25 %, semijefe 35 %, líder 2 % (`alMorir`), cofre importante 15 %.
- `OBJETOS.nombre` y `OBJETOS.lineas` preguntan `it.cj`. Pestaña «Conjuntos» (visible con algo visto), anotado una vez
  por segundo de lo puesto y la bolsa.
- Estado en `E.extra.conjuntos = { vistos, completos }`.

## Poderes de las legendarias (`motor/legendarios.js`, `LEGENDARIOS`; textos `lg.` en `textos/legendarios.js`)

- Toda legendaria (`r` 3) sale con `it.po`, un poder de `POD` que vale para su casilla (`alGenerar`, llamado desde
  `OBJETOS.generar`); su nombre es el del poder (`lg.n_`). Los números están en `N`.
- Arma: Surtr (cada 5 golpes, 60 % del golpe a todo lo que está a 150), Garm (crítico → 40 % del golpe en 3 s, de a
  medio segundo), Mjölnir (15 %: salta a 3 cercanas a 320 con el 50 %). Armadura: Svalinn (vida < 30 % → égida del 30 %
  de la vida máxima por 8 s, cada 60 s), Hel (matar cura 4 %), Hermóðr (esquivar: +15 de estamina y +25 % de velocidad
  1,5 s), Víðarr (corriendo × 0,75). Joya: Brísingamen (+1 % de daño cada 100 de plata, tope 30 %), Andvaranaut (+30 %
  de plata y 3 % de fragmento al matar).
- Los golpes de los poderes pasan por los `modDano` y avisan con `alPegar` con `info.d.poder` (los poderes no se
  encadenan entre sí).
- Desarmar (envuelve `MATERIALES.alDesarmar`) enseña el poder; la pestaña «Poderes» graba uno por ranura (`arma`,
  `armadura`, `joya`). Activos = lo puesto ∪ lo grabado (`rearmar`).
- Semijefes y únicos: 20 % de soltar una legendaria. Estado en `E.extra.legendarios = { aprendidos, grabados }`.

## Arcón del Puesto y filtro del botín (`motor/arcon.js`, `ARCON`; asset `arconPuesto` en `mundo/assets-arcon.js`; textos `ac.`)

- El arcón va en el patio del Puesto (`ubicar`). «Abrir el arcón» levanta la tapa (`o.abierto`) y abre la pestaña
  «Arcón» (solo visible mientras está abierto). `guardar` / `sacar` / `guardarTodo`; capacidad `CAPS` 24 → 36 → 48 por
  `AGRANDAR` 150 y 400 de plata.
- Filtro (`st.filtro` 0 todo, 1 mágicas+, 2 raras+): `oculta(it)` es true si la rareza no llega y la pieza no es
  especial (muescas, conjunto, poder o legendaria). botin.js no le dibuja haz, nombre ni luz salvo a la que está más
  cerca. Con `st.desarmar`, `alJuntar` la desarma al juntarla (50 % de su valor en plata + `MATERIALES.alDesarmar`).
- Las dos casillas del filtro van en la Bolsa (`celdasBolsa`). Estado en `E.extra.arcon = { piezas, cap, filtro, desarmar, guardadas }`.

## Tintes del casco (`motor/tintes.js`, `TINTES`; asset `tinaTintes` en `mundo/assets-tintes.js`; textos `ti.`)

- La tina va junto al arcón (se ubica en `alEmpezar`). «Teñir el casco» abre la pestaña «Tintes».
- `LISTA`: rojo (R, de base), azul (B), verde (V), blanco (W) con 60 de plata y 3 de una hierba; negro (120 + 3 cardos)
  y violeta (150 + 3 hongos de luna + 1 esquirla) con tonos propios (`T_negro`, `T_violeta`); luz de runa (`T_runa`,
  se gana con una palabra rúnica o un poder legendario) y oro (G, con un conjunto entero). Lo preparado queda en
  `st.tiene` y se cambia gratis.
- `VIKINGO.color` es la clave del color de Eromash: juego.js, hud.js e inventario.js la usan, y `VIKINGO.tonos` pide
  `TINTES.tonos(c)` para las claves `T_…`.
- Estado en `E.extra.tintes = { tiene, puesto }`.

## Hörgar de los dioses (`motor/santuarios.js`, `SANTUARIOS`; asset `horgr` en `mundo/assets-santuarios.js`; textos `sn.`)

Santuarios como los del Diablo con la idea de las piedras guardianas del Skyrim: siete hörgar al costado de los caminos
(`LISTA[id].p` en px del mapa; se ubican en `alEmpezar` lejos de caminos y de otras cosas). «Rezarle a …» abre su menú.

| Dios | Runa · color | Bendición (× 1,5 con ofrenda) |
|---|---|---|
| Thor | Thurisaz · #C8402D | daño × 1,15 |
| Odín | Ansuz · #4A78D0 | experiencia × 1,2 y poder rúnico × 1,1 |
| Tyr | Tiwaz · #E0B2B2 | crítico + 8 % |
| Freyja | Fehu · #F5A524 | cura al pedirla, vida × 1,1 y regeneración × 1,5 |
| Frigg | Berkano · #7BC86C | armadura + 15 |
| Njörd | Laguz · #73D5DB | velocidad × 1,1 |
| Ullr | Eihwaz · #9A7650 | estamina + 25 y ataques × 1,08 |

- Una bendición por vez (`st.bend = { dios, t, fuerte }`, corre solo en modo juego): 480 s, 720 s con el favor de los Æsir.
  Ofrendar cuesta 25 de plata. Cada hörgr bendice una vez por día (`st.dia[id]` = día de `E.tiempo`).
- El primer toque de cada uno da 40 de experiencia; los siete dan el favor de los Æsir (+3 % de daño y vida, fijo).
- La cara del asset: `o.vivo` (runa dorada, humo, luz) y `o.dormido` (ya bendijo hoy). En el mapa: marca `horgr`, clase
  `dioses`, apagada si ya bendijo hoy.
- El evento del bosque vivo es `sanar` y no `rito`, porque `rito` da experiencia (se podría repetir cada día).
- Estado en `E.extra.santuarios = { vistos, dia, bend }`.

## Sigilo (`motor/sigilo.js`, `SIGILO`; textos `sl.` en `textos/sigilo.js`)

- Acción `agacharse` (X, o L2 + ▼): `jug.agachado`. El paso va × 0,55 (juego.js) y el dibujo se agacha (animacion.js).
  Correr, saltar, esquivar, morir o entrar a algún lado lo levantan.
- Detección: combate.js ya multiplicaba la distancia (13 m × ruido del paso) por `J.sigilo`. Agachado vale 0,45, × 0,8
  de noche (20 a 5 h) y − 8 % por rango de maestría.
- Golpe desde las sombras (`modDano`): agachado contra una en estado `quieto`, × 2 / 2,33 / 2,67 / 3 según el rango,
  encima del × 1,5 por sorpresa. `J.silencioso` hace que una que muere del golpe no alerte al grupo (`golpear`).
- Maestría: rangos a las 5, 15 y 30 muertes desde las sombras (aprendiz, rastreador, acechador, sombra de Eldervald).
- El ojo (en `sobreLuz`): sale de la que está más cerca de verlo entre 1 y 1,7 veces su distancia de detección.
- Estado en `E.extra.sigilo = { golpes, muertes }`.

## Encuentros en el camino (`motor/encuentros.js`, `ENCUENTROS`; textos `ec.` y `av.nombre_brandr|ragna|hallvard|sigrun|toki`)

Como los encuentros al azar del Skyrim y del Witcher.
- Cuándo: andando por un camino (`jug.enCamino`), sin pelea (`jug.pelea`), fuera de los pueblos (lugar + 900) y sin
  otro encuentro. Lo andado suma (despacio 100, al paso 175, corriendo 295 por segundo); cada `CADA` = 2600 se tira con
  `CHANCE` = 45 %. Aparece unos 720 más adelante de hacia donde mira, al costado del camino (nunca encima); a más de
  `LEJOS` = 2600 se va. Los árboles que lo tapan se apartan mientras está.
- Salen en rueda (`st.n`), así no se repiten seguidos: buhonero, herida, peregrino, escalda, carrero.
- Brandr vende una pieza envuelta (r ≥ 1, hallazgo × 1,6) por `ENVUELTA` = 45. Ragna toma una carga del frasco y paga
  30 de plata, 80 de experiencia y destapa en el mapa el cofre sin abrir más cercano. Hallvard destapa el
  hörgr no encontrado más cercano (40 de experiencia). Sigrun da Inspirado `INSPIRA` = 240 s: daño y experiencia × 1,1
  (`RPG.aporte`, en `efectosHud`).
- Juegos de runas (`motor/juegos-runas.js`, `JUEGOS_RUNAS`, modo `runas`, textos `jr.`; lienzo propio de 1600 × 900,
  flechas o stick + E, o tocando las piedras; Esc lo deja): Brandr ofrece una vez las **parejas** (memotest de ocho pares
  de runas en `VUELTAS` = 16 vueltas: si gana, la pieza envuelta es gratis). Hallvard reza la **plegaria** (Simón dice:
  cuatro piedras en rombo, Kenaz arriba, Laguz a la derecha, Algiz abajo, Sowilo a la izquierda, que las flechas tocan;
  una runa más por ronda hasta `META` = 8): 12 de experiencia por runa repetida, 30 de plata si llega a 8, y después
  señala el hörgr. Sigrun esconde un **verso** (Mastermind: cuatro runas distintas entre seis, `INTENTOS` = 8; oro = en
  su lugar, blanco = está en otro): adivinado, Inspirado dura 240 + 30 por intento que sobre; si no, 120.
  `JUEGOS_RUNAS.empezar(tipo, { quien, x, y, fin(res) })`; un juego nuevo suma su `ARMAR`, `tocar`, `casillas` y
  `DIBUJAR`. Toki: al acercarse, tres lobos (marcados `e.encuentro`); si caen todos paga 40 de
  plata y una pieza r ≥ 1.
- Estado en `E.extra.encuentros = { n, hechos: { tipo: n }, inspirado }`. `aparecer(tipo)` lo fuerza (pruebas y nota).

## Los Sin Linde (`motor/bandidos.js`, `BANDIDOS`; dibujos en `enemigos/bandidos.js`; assets `tiendaSinLinde`, `estacaSinLinde`, `botinSinLinde` en `mundo/assets-bandidos.js`; textos `bd.`)

Como los campamentos de bandidos del Skyrim y del Gothic.
- Tipos nuevos en `COMBATE.TIPOS`: `bandido` (85 de vida, 15 de daño, abanico corto) y `arquero` (55 de vida, 13 de
  daño, forma `lejos` con aviso dorado `d.rgb`: marca el piso donde está Eromash y retrocede si se le acercan). Tres
  variantes de color (trapos rojos, piel de lobo, verde de monte). Sueltan hierro o cuero
  (`MATERIALES.CRIATURAS`). Suman sus páginas al bestiario (`BESTIARIO.LISTA`).
- Guaridas: hasta `N` = 4, buscadas a 720 del borde de un camino, cada 500 a lo largo de cada uno, lejos de los
  lugares (r + 1200), del Puesto (4500), de la ciudad, de los grupos del bosque (1700), de las lagunas y entre ellas
  (5000), sin nada construido cerca. Hoy salen tres. Cada una abre un claro (más hacia adelante) y pone dos tiendas, la
  estaca, un `fogonOlla` (se cocina) y el botín.
- Cada guarida es un grupo de HORDAS (`HORDAS.crearGrupo("bandidos", …, { conLider: true })`, armado después de los del
  bosque): vuelve a los 7 minutos, y el jefe tiene nombre y afijos. `mas` sube con la
  distancia al Puesto.
- La flecha: combate.js deja `a.de` en el aviso `lejos`; `sobreLuz` dibuja la flecha en arco en el último 45 % del
  aviso.
- El botín (`saquear`) solo con toda la guarida caída y una vez: plata (70 + 30 × mas × (i + 1)), fragmento, una pieza
  (botin.js) y 120 de experiencia.
- Estado en `E.extra.bandidos = { saqueados: { i: 1 } }`.

## Nidos de arañas (`motor/aranas.js`, `ARANAS`; dibujos en `enemigos/aranas.js`; assets `nidoArana`, `sacoHuevos` en `mundo/assets-aranas.js`; textos `ar.`)

Como las cuevas de arañas del Skyrim y los nidos del Gothic.
- Tipos en `COMBATE.TIPOS`: `arana` (60 de vida, 12 de daño, forma `carga`: se agacha y salta 5,5 m en línea) y
  `aranaReina`, la tejedora (130 de vida, 18 de daño, forma `lejos` con aviso blanco, pesada). En el bestiario.
- Nidos: `N` = 3, en una grilla de 1100 con semilla fija, lejos del Puesto (6000), de los caminos (1000), de los
  lugares, la ciudad, los grupos y las lagunas, y entre ellos (7000). Cada uno es un grupo de HORDAS de la familia
  `aranas` con la tejedora de líder, un claro, el nido, cuatro sacos y cinco telas fijas.
- Tela: `telas[] = { x, y, r, hasta }` (`hasta` null = fija). Pisarla sin saltar pone `jug.lento` (× 0,6) y
  `jug.enTela`. Cuando termina un aviso de la tejedora (`a.de`), queda una tela de `TELA_DURA` = 8 s donde cayó.
- Veneno: ARANAS envuelve `J.herir`; si muerde una araña, `st.veneno = 5` s a 3 de vida por segundo, nunca por
  debajo de 1. Lo cura un trago del frasco (`FRASCO.bebiendo()`) o una venda.
- Sacos: con E dan 1 o 2 de seda (`MATERIALES`), y el 45 % revientan en dos arañitas (`e.cria`, se sacan al morir o a
  3000). Vuelven a crecer al día siguiente (`cortados["n:k"] = día`).
- Vendas: `botonesFogata` teje una con `VENDA_SEDA` = 2; desde la Bolsa (`celdasBolsa`) curan el veneno y 30 de vida.
- Estado en `E.extra.aranas = { cortados, vendas, veneno }`.

## Hrímnir, el jötunn de la escarcha (`motor/jotunn.js`, `JOTUNN`; dibujo en `enemigos/jotunn.js`; assets `asientoJotunn`, `menhirEscarcha`, `jotunnFigura` en `mundo/assets-jotunn.js`; textos `jt.`)

Un jefe del mundo como los gigantes del Skyrim y los jefes del WoW, con las reglas fijas de la arena.
- Lugar: el primer punto libre en espiral desde `W.m(900, 180)`, lejos de caminos, lugares, grupos, ríos y lagunas.
  Abre un anillo de `ANILLO` = 900 con nueve menhires y el trono.
- Por qué pelea: dormido no se lo lastima y no se levanta por un mortal. La primera visita habla (`jt.desden_*`) y el
  mapa marca a sus tres guardianes: hrímthursar (draugr × 1,3 de tamaño, × 2,2 de vida, × 1,3 de daño) a
  `DIST_GUARDIAN` = 2400 del anillo. Hasta vencerlos, acercarse a menos de `PATADA` = 360 del gigante tira la patada:
  aviso en franja de 0,8 s hacia Eromash; si lo agarra (saltar la evita) no saca vida y lo lleva volando 0,7 s hasta
  afuera del anillo. Con los tres caídos (`st.guardianes`) avisa «Hrímnir te espera» y al acercarse pelea como siempre.
- Es una criatura de COMBATE (`jotunn`, 2600 de vida) con `e.propio`: combate.js solo le pasa el destello y este
  sistema lo mueve. Se dibuja por `d.dibujo` = `jotunnFigura`, con la pose en `e.o` (sentado, pisa, grita, expuesto).
- Despierta a `DESPIERTA` = 620 del centro. Si Eromash se va a más de `SUELTA` = 1900 o cae, vuelve al trono curado.
- `ATAQUES` (forma, aviso, daño): barrido (abanico 6,2 m, 1,1 s, 28), pisotón (círculo 4,6 m, 1,3 s, 30), línea de
  hielo (franja 17 m, 1,2 s, 26), granizo (3 o 5 círculos de 1,7 m, 1,45 s, 22), grito (círculo 9,5 m, 1,7 s, 24).
  `ROTACION` por fase (66 % y 33 %); `proximo()` saltea un tercero igual. Camina hasta el alcance del próximo ataque.
- El golpe se resuelve en `pegar()` con `COMBATE.contiene` y `J.herir(min(daño, 35 % de la vida))`, así que saltar o
  esquivar lo evita. Tras pisotón y grito queda expuesto `EXPUESTO` = 1,4 s y recibe × 1,3 (`modDano`). Un remate al
  tercero lo aturde (`e.aturdido`) y corta el aviso.
- Al pasar de fase llama hasta tres draugr de escarcha (los tres esbirros que tiene armados).
- Mientras pelea pide `J.alejarA(1,75)` y `J.camFoco` (hook nuevo de juego.js: la cámara encuadra a los dos) y pone
  `J.jefeHud` en `hud`.
- Vencerlo una vez: 320 de plata, 1500 de experiencia, dos fragmentos, una pieza r ≥ 3 y `extra.hd.unicos.hrimnir`
  (el bestiario lo muestra caído). Estado en `E.extra.jotunn = { vencido, intentos }`.

## La Cacería Salvaje (`motor/caceria.js`, `CACERIA`; dibujos en `enemigos/caceria.js`; textos `cz.`)

Un evento de noche como la Cacería Salvaje del Witcher y las noches de invasión del Gothic.
- Cuándo: `nocheId()` numera las noches (de las 20 a las 20); `toca(n)` = semilla fija por noche, `CHANCE` = 0,34, nunca
  la primera. Hace falta nivel `NIVEL_MIN` = 4. A las 20:30 suena un cuerno lejano (aviso); de 22 a 4, si Eromash está
  afuera (no en un pueblo de `REFUGIOS`, ni en Eikholt, ni `J.dentro`) y no está en pelea (`A.enPelea`), llega.
- Quiénes: el Cazador de Oskoreia (`cazadorSalvaje`, 560 de vida, carga en franja de 10 m, único `cazador` con el
  afijo rúnico) y cuatro sabuesos (`sabuesoCaceria`, 55 de vida, abanico, rápidos). Llegan a `LEJOS` = 1100 por
  detrás. Son `vuela` (cruzan árboles) y `muerto` (la runa del sol × 3). La vida y el daño suben con el nivel (`mas`).
- Mientras corre: la casa de cada uno es la posición de Eromash (nunca sueltan), la noche se tiñe de violeta
  (`J.ambZona.tono`), cada `PASADA` = 11 s cruzan tres jinetes por una franja de 19 m que pasa por Eromash (1,4 s de
  aviso, `PASADA_DANO` = 18 con el tope del 35 %, saltar la evita) y a los `REFUERZO` = 35 s vuelven dos sabuesos si
  quedan menos de dos. Aullidos y cuerno armados con `SONIDO.tono`.
- Finales (`terminar`): `vencida` (180 de plata, 900 de experiencia, una pieza, un fragmento y el cuerno la primera
  vez; después 110, 500 y 40 % de pieza), `sobrevivida` a los `DURA` = 75 s (50 de plata y 250 de experiencia),
  `escondido` (entró a un pueblo o una casa: nada) y `cayo`. Los que quedan se deshacen en humo violeta.
- El Cuerno de la Cacería (`celdasBolsa`, ícono `cz_cuerno`): de noche y afuera la llama ya (`tocarCuerno`), una vez
  por noche. Estado en `E.extra.caceria = { avisada, corrida, cuerno, vencidas, sobrevividas, escondidas }`.

## La pesca (`motor/pesca.js`, `PESCA`, modo `pesca`; asset `canaSverri` y los peces en `mundo/assets-pesca.js`; textos `pe.`)

Como la pesca del Stardew Valley y del Zelda.
- El puesto de Sverri: en la orilla de la laguna más cercana al Puesto (el punto que mira al Puesto, 170 afuera del
  agua). Con E se toma la caña (`st.cana`, `o.sinCana`). Marca `pesca` en el mapa y la caña en la Bolsa.
- `aguaCerca(x, y)`: busca agua (`sueloEn` = 1) de 50 a 190 hacia donde mira Eromash y después alrededor; si cae dentro
  de una laguna es `lago`, si no `rio`. Con caña y fuera de pelea, `cercanos` ofrece Pescar.
- Fases: `espera` (1,5 a 4,5 s, × 0,7 al alba y al ocaso; apretar recoge), `pica` (`PICA` = 0,8 s para apretar; si
  no, `tarde`), `pelea` y `fin`. En la pelea la franja (`ZONA` = 0,24) sube con `SUBE` mientras se mantiene (acciones
  interactuar, atacar, saltar o el dedo sobre la capa) y cae con `CAE`; el pez cambia de meta según `agil` y va con
  `vel`. Adentro la captura sube `LLENA` = 0,3/s, afuera baja `VACIA` = 0,2/s × (0,8 + vel × 0,4).
- `PECES`: perca (laguna, día), trucha (río, día), salmón (río, alba y ocaso), lucio (laguna, tarde y noche), anguila
  (cualquiera, noche), pez de escarcha (río del norte) y Urriði el Viejo (laguna, noche, con `ESPECIES_URRIDI` = 4
  especies, 25 %, una vez: 250 de plata, dos fragmentos, una pieza r ≥ 3). Un jugador simulado con 0,18 s de reflejos
  pesca casi siempre los fáciles y la mitad de las veces a Urriði.
- Cada pez: un pescado para la cocina (tres Urriði) en `COCINA.CARNES.pescado`, platos nuevos `pescadoPalo` y
  `sopaPescado` en `COCINA.PLATOS`, experiencia (entera la primera vez, un cuarto después) y el libro del pescador
  (`st.libro[id] = { n, cm }`, el diario). Estado en `E.extra.pesca = { cana, libro, urridi }`.

## Los dados de hueso (`motor/dados.js`, `DADOS`, modo `dados`; asset `mesaDados` y `DADOS_DIBUJO.dado` en `mundo/assets-dados.js`; textos `dd.`)

El juego de taberna de Eldervald, a la manera del farkle. Seis dados; cada 1 vale 100 y cada 5 vale 50; tres iguales valen la cara por cien (tres 1 valen mil) y cada dado más del mismo duplica; 1-5 vale 500, 2-6 vale 750 y 1-6 vale 1500. `puntos(caras)` devuelve lo que vale lo apartado o -1 si algo no suma (`valor` prueba todas las formas); `algoVale` dice si una tirada trae algo.

- **Turno**: se aparta al menos un dado que valga y se sigue tirando el resto o se planta. Una tirada sin nada pierde lo del turno; si los seis valen, se tiran los seis otra vez. Gana el primero a `META` (2000) y cobra el doble de la apuesta.
- **Rivales** (`RIVALES`): Bersi el Tuerto (patio del Puesto, se planta con 300), Hallgerd la Atrevida (Brunvik, se planta con 650) y Ulf (la mesa de la taberna). `eleccionRival` prueba cada subconjunto que vale y elige por puntos menos dados gastados (`cauto`), con premio a apartar los seis. Contra un jugador razonable (plantarse con 400) se gana cerca del 57 % con cualquiera de los tres.
- **Apuestas**: 10, 25 y 50; ganándole a los tres se abren 100 y 200 (la mesa alta). Levantarse a la mitad pierde la apuesta.
- **Controles**: izquierda/derecha eligen dado, interactuar lo aparta (o tocarlo), saltar tira, la lente se planta, pausa se levanta; los botones del panel hacen lo mismo.
- **Estado** (`E.extra.dados`): ganadas, perdidas, vencidos, mejor turno y plata ganada; va al diario. Mapa: clase `dados`.

## Los libros de Eldervald (`motor/libros.js`, `LIBROS`, modo `libro`; assets `atrilPiedra` y `libroCaido` y `LIBROS_DIBUJO.libro` en `mundo/assets-libros.js`; textos `lb.`)

Quince libros con tapa, autor y páginas (`lb.<id>_t`, `_a`, `_1`…), en cuatro clases (`LISTA`):

- **Saga** (4 tomos de Sigrun Mano de Hierro): cada tomo da experiencia; los cuatro, un punto de habilidad (`ARBOL.sumarPuntos`) y dos fragmentos.
- **Oficio**: un punto de atributo (`ATRIBUTOS.sumarPuntos`: El uro y el arado, Cuarenta pasos de esgrima, Siete inviernos en la escarcha, Las voces de Ansuz) o uno de habilidad (Cuaderno de un maestro de armas).
- **Caza**: +10 % de daño para siempre (`modDano`, `CAZA_MULT`) contra lobos, draugr y errantes o arañas.
- **Saber**: 150 de experiencia (los demás dan 40) y la historia de Eldervald.

Leerlos todos da un punto de atributo y un fragmento. Todo se da la primera vez que se abre (`aprender`) y se anuncia al cerrar.

- **Dónde**: nueve atriles de piedra a 150–240 de un camino (`EN_ATRIL`, semilla 8807, lejos de pueblos, grupos, guaridas y nidos; el más cercano al Puesto lleva la crónica). Van al mapa (clase `libros`) al verlos a menos de 900 y se apagan al leerlos. Los otros seis (`DE_LIDER`, en orden) los suelta un líder al morir (40 %, un semijefe siempre) y quedan en `extra.libros.caidos` hasta juntarlos con E.
- **Lector**: ventana de dos páginas (la primera, la portada con el color de la tapa); izquierda/derecha, interactuar o tocar la hoja pasan, pausa o la lente cierran. Los leídos se releen desde la casilla Libros de la Bolsa (`biblioteca`).
- **Estado** (`E.extra.libros`): leidos, vistos, caidos, soltados, saga, todos. Va al diario.

## Las facciones y la reputación (`motor/facciones.js`, `FACCIONES`; asset `estandarteFaccion` y `FACCIONES_DIBUJO.emblema` en `mundo/assets-facciones.js`; textos `fc.`)

Cuatro facciones con cinco grados (`NIVELES` = 0, 300, 900, 2000, 3800: Desconocido, Conocido, Amigo, Honrado, Exaltado):

| Facción | De dónde sale (`FUENTES`, puntos por cada una) | Bono por grado (`BONO`) |
|---|---|---|
| La Guardia del Roble (Eikholt) | bandido 8, líder bandido 30, guarida saqueada 80, trofeo de contrato 90 | +4 % de daño contra bandidos |
| Los Guardasendas de Eydis | misión 120, lugar 25, tablón 60, encuentro 30 | −4 % con Ingrid |
| El Gremio de Brunvik | pez 6, plato 8, partida de dados ganada 35 | −4 % con Kolbrun, +3 % al vender |
| El Pueblo Oculto | piedra 30, rito 50, hörgr 40 | +5 % de energía rúnica |

- **Cómo suma**: cada medio segundo `mirar` cuenta lo hecho en los estados guardados de los otros sistemas y suma la diferencia (`E.extra.facciones.cont`); no hay que tocar esos sistemas. Al cargar, lo ya hecho se cobra en silencio. Los bandidos suman por `alMorir`.
- **Regalos por grado**: 40 × grado de plata; Honrado, un fragmento; Exaltado, una pieza (rara o mejor) de la casilla de la facción (`PIEZA`: arma, botas, anillo, amuleto).
- **Estandartes**: la Guardia afuera de la Puerta del Sur de Eikholt (con la cornamenta pálida de la capital), los Guardasendas en el Puesto, el Gremio en Brunvik y el Pueblo Oculto junto al Santuario de las Raíces. Con E abren la ventana de esa facción; la casilla Reputación de la Bolsa abre las cuatro. Mapa: clase `facciones`.
- **Estado** (`E.extra.facciones`): rep y cont. Va al diario.

## Los remates (`motor/remates.js`, `REMATES`; textos `rm.`)

- **Quién**: una criatura con menos del 22 % de la vida (`UMBRAL`; las pesadas, los líderes y los semijefes, 12 %, `UMBRAL_DURO`; los únicos con nombre, 6 %), o aturdida con el doble de ese margen. No se rematan el dreki, el jötunn, el custodio ni el muñeco (`NO_SE_REMATAN`). Lleva un rombo rojo sobre la barra (`sobreLuz`) y la primera vez sale un cartel que lo explica.
- **Cómo**: con E (en `cercanos`, adelante de todo lo demás) a menos de 110 + su radio. Eromash salta junto a ella (0,12 s), carga (0,12 s) y pega: la criatura muere (`CB.golpear` con su vida entera), hay cámara lenta, una pausa breve, temblor, chispas (menos en calidad media y baja) y el trazo del arma (`REMATES`: cruz, baja, parte, aplasta, empala, flecha, runa, puños) durante medio segundo. Mientras dura, `jug.inv` y la criatura quieta.
- **Qué deja**: 8 % de la vida, 30 de estamina, 15 de energía rúnica (`PODERES.darEnergia`), 20 de furia (`FURIA.ponerFuria`) y un 25 % más de la experiencia de la criatura. Las de a menos de 9 m se frenan (aturdidas 1,1 s; las pesadas y los líderes, 0,6 s).
- **Verdugo** (`VERDUGO`): a los 10, 50 y 150 remates, +5, +10 y +15 % de daño (`modDano`) contra criaturas con menos del 30 %.
- **Estado** (`E.extra.remates`): n, porTipo, ayuda. Va al diario.

## La casa de Hrolf (`motor/casa.js`, `CASA`; assets `letreroVenta` y `huertaCasa` en `mundo/assets-casa.js`; textos `hg.`)

- **Dónde**: una `casaNordica` (`entra: false`, `sinPlano`) junto a un camino que sale del Puesto, a menos de 27 m de su borde y en tierra firme (`buscarLugar`), con el letrero de «se vende» delante. Antes de comprarla la puerta no ofrece entrar (`INTERIORES.agregarPuerta(..., { puede })`).
- **Comprar**: E en el letrero, 500 de plata (`PRECIO`). El letrero se da vuelta (`o.vendida`, la cornamenta tallada), la casa va al mapa (marca `casa`, con el ícono de casa de los lugares) y «Tu casa» queda entre los destinos de Viajar (hook nuevo `destinoViaje` de los sistemas, que lee `secretos.js`).
- **Adentro**: cuarto propio `propia` armado por `INTERIORES.CUARTOS.propia` (sin sótano): cama, hogar, mesa y los planos. Lo construido se suma en vivo al cuarto.
- **Mejoras** (`MEJORAS`, plata + materiales de la PR 12): arcón 150 + 4 cuero (guarda 30 piezas, `ARCON`), armero 250 + 6 hierro (+4 % de daño), estantería 200 + 2 ámbar (+5 % de experiencia), fogón del patio 120 + 3 hierro (un `fogonOlla` de verdad, se cocina), huerta 100 + 2 cuero (crece durante el día; una cosecha por día: 2 hierbas y 35 % una manzana) y cama de pieles de oso 300 + 6 cuero (dormir en ella: «Bien abrigado», +10 % de experiencia 600 s, `st.abrigo`).
- **Estado** (`E.extra.casa`): tuya, hechas, arcon, cosecha (el día de la última). Va al diario.

## Las runas de los elementos y las reacciones (`motor/elementos.js`, `ELEMENTOS`; assets `robleTrueno`, `fuenteLaguz`, `piedraManantial` en `mundo/assets-elementos.js`; textos `el.`)

- **Runas nuevas**: `PODERES` se abre a runas de otros sistemas (`RUNAS[r] = { coste, col }`, `ORDEN.push(r)`, `LANZAR[r] = (h) => …` con `h = { golpe, pr, apuntar, vivos, efectos, avisar }`). La mochila muestra las cuatro de los altares siempre y las demás cuando ya se tienen.
  - **Thurisaz** (45 de energía): rayo a la criatura más cerca de hacia donde apunta (10 m), que salta a tres más a menos de 5,5 m; 26 × poder rúnico, ×0,75 por salto, ×1,25 con lluvia. Deja `e.electro` 5 s.
  - **Laguz** (35): ola en abanico de 7 m que pega 10 × poder, empuja a las chicas y deja `e.mojado` 8 s; cierra un 5 % de la vida.
- **Dónde se ganan**: el Roble del Trueno, en el bosque al sur del Paso (claro propio, semilla fija): E empieza la prueba del trueno, 8 rayos marcados en el piso (1 s de aviso, 14 de daño con el tope del 35 %, saltar los evita) sobre Eromash; el último cae en el roble. Alejarse más de 23 m la corta. La Fuente de Laguz, en la orilla de la laguna del camino del Puesto a Eikholt, con tres `piedraManantial` repartidas en la orilla: tocarlas (E) manda la luz del agua a la fuente; con las tres mana y beber da la runa y llena la vida. Los dos van al mapa como altares.
- **Elementos en las criaturas**: fuego `e.quema` (Kenaz), hielo `e.helado > 1,2` (Isa), agua `e.mojado` (Laguz, estar en el agua, lluvia > 0,4) y trueno `e.electro`. Dos juntos hacen la primera reacción de `REACCIONES` y se consumen:
  - vapor (agua + fuego): nube de 150 que pega 12 × poder y deja ciegas (`vio` 0, `duda`, aturdidas 1,4 s; las fuertes 0,6 s);
  - congelada (agua + hielo): 4 s quieta en un bloque de hielo; el próximo golpe de arma (`modDano`) la quiebra con +60 %;
  - descarga (agua + trueno): 22 × poder a ella y a todas las empapadas a menos de 12 m, aturdidas 1 s;
  - deshielo (fuego + hielo): 35 × poder;
  - estallido (fuego + trueno): 20 × poder y empuje a todo lo que esté a menos de 140;
  - esquirlas (hielo + trueno): 12 × poder a menos de 180 y escarcha a las demás.
- **Lluvia**: empapa a todas, el fuego dura menos y el trueno pega un 25 % más (un cartel lo explica la primera vez).
- **Códice**: cada reacción nueva paga 20 de plata y un cartel la explica; las seis, un fragmento. Celda en la Bolsa (`el_codice`) con la ventana de las seis (las no descubiertas solo muestran sus elementos) y una línea en el diario.
- **Estado** (`E.extra.elementos`): roble, piedras, fuente, vistas, todas, ayuda, lluvia.

## Skuggi, el perro compañero (`motor/companero.js`, `COMPANERO`; dibujo `CRIATURAS` «perro» y assets `skuggi`, `skuggiSentado`, `skuggiHerido` en `personajes/perro.js`; textos `cp.`)

- **El rescate**: echado y herido junto a un camino que sale del Puesto (entre 24 y 52 m del borde, claro propio, nada armado cerca). A menos de 17 m aparecen tres lobos (`e.companero`, salen de la lista si Eromash se va o muere); con los tres muertos, E lo atiende y se suma. En el mapa, una huella (clase `companero`) mientras espera herido o donde se lo dejó quieto.
- **Anda solo**: sigue a Eromash un poco atrás y al costado (270, corre 400; se sienta a los 3 s quieto); a más de 33 m, trabado 1,5 s o al salir de una casa o un viaje aparece al lado. Salta fuera de cualquier aviso del piso 0,4 s antes de que pegue. Nunca muere.
- **Pelea**: muerde a la criatura más cerca de él de las que atacan a Eromash a menos de 15 m (cada 1 s, (4 + 1,6 × nivel) × (1 + 10 % por truco), la mitad a jefes, semijefes y únicos). Cada mordisco gasta 12 de aguante (vuelve 8/s); con menos de 12 se va a jadear hasta 70.
- **Vínculo** (`NIVELES` 0 / 40 / 120 / 260 / 480): +1 por mordisco, +4 por criatura que cae cerca (+10 pesadas y líderes), +15 por caricia (una vez por día), +3 por hallazgo. Los trucos (`TRUCOS`):
  1. muerde;
  2. derriba: cada tercer mordisco aturde 0,8 s a las chicas;
  3. olfato: ladra y deja una huella dorada 4 s sobre una criatura quieta que no vio a Eromash a menos de 22 m (cada 6 s); con «Buscá», una vez por día escarba plata, a veces una hierba o un cuero;
  4. aullido: con menos del 30 % de vida espanta y empuja a las chicas a menos de 14 m (cada 60 s);
  5. lealtad: +5 % de daño (`RPG.aporte`) mientras lo sigue.
- **Órdenes** (E cerca, o su celda en la Bolsa): acariciar, quedate acá / seguime (de lejos, «Llamar a Skuggi» lo trae), buscá y la lista de trucos.
- **Estado** (`E.extra.companero`): rescatado, vinculo, acariciado, buscado, mordiscos, hallazgos, quieto.

## La hólmganga (`motor/holmr.js`, `HOLMR`; dibujo `CRIATURAS` «kempa» en `enemigos/kempur.js`; assets `holmrPiel`, `holmrVara`, `bancoTestigos` en `mundo/assets-holmr.js`; textos `hm.`)

- **El lugar**: un claro junto a un camino, lo más cerca de la línea del Puesto a Eikholt y a mitad de camino, lejos de pueblos, grupos, guaridas, la casa, el perro y los elementos. La piel (660 × 460) se dibuja en el hook `fondo`, debajo de los avisos, así gira con la cámara; las cuatro varas y el banco son assets del mundo; Hallbera y los dos testigos sentados (`GENTE.FICHAS` hallbera, testigo1, testigo2) se dibujan en `objetos`. En el mapa, un escudo (clase `holmr`).
- **Los kempur** (`KEMPUR`): Ketil el Joven, Thorgerd Lanza Larga, Björn el Muro, Ásgerd la Ligera y Úlfhild Hija del Oso. Cada uno con su vida, daño, velocidad, alcance, aviso, espera y rotación fija (`e.patron`, nunca el mismo tres veces), escudos (3, 3, 5, 2, 3) y premio (40 / 70 / 110 / 160 / 250 de plata y 60 a 260 de experiencia). La vida crece 10 % por nivel (hasta ×2,5) y el daño 5 % (hasta ×1,8), con el tope del 35 % de siempre. Son tipo `kempa` de `COMBATE.TIPOS` con `lider.unico`, `e.holmr` y `d.plata = 0`; durante la cuenta llevan `e.propio`.
- **El duelo**: Hallbera (E) muestra las reglas, el siguiente y el premio. Batirse pone a los dos en la piel, cura a Eromash y cuenta tres segundos (si hay criaturas peleando cerca no abre). Mientras el kempa se cubre (sin aviso, sin espera, sin aturdir), `modDano` deja un cuarto y cada tres golpes parte un escudo y lo hace tambalear 0,6 s; abierto pega entero. Sin escudos, el remate (empuje ≥ 1,3) lo empuja 720 (`alPegar`). La barra de jefe (hook `hud`, después de goinn.js) muestra los escudos ◆◇ y si está «¡abierto!».
- **Cómo termina**: gana si el kempa sale de la piel o baja de su 12 % (un golpe nunca lo mata); pierde si Eromash pisa fuera sin `jug.salto` (también empujado: el borde se pone rojo a menos de 90) o si un golpe lo dejaría bajo su 12 % (`modRecibido` lo frena ahí y se rinde). Al perder, Hallbera lo deja en 40 % de vida. Irse lejos en la cuenta, entrar a una casa o cargar corta el duelo sin resultado. Skuggi no muerde a `e.holmr`.
- **Premios**: plata y experiencia por cada uno; el quinto da «Campeón del hólmr» (+5 % de daño por `RPG.aporte`), un fragmento y una pieza rara o mejor. Después, un retador por día (`hm.r0..4`, la ficha de otro kempa con 25 % más de vida y su color; paga 50 + 8 × nivel).
- **Estado** (`E.extra.holmr`): vencidos, ganados, perdidos, campeon, retadorDia. Celda en la Bolsa con lo ganado y perdido, y su línea en el diario.

## La hoja de Eromash y los topes (`interfaz/hoja.js`, `HOJA`; los topes en `motor/rpg.js`; textos `hj.`)

- **Quién suma**: `RPG.aporte(fn, quien)` lleva el nombre del sistema (`hj.de_<quien>`). Hoy: botin, atributos, arbol, cocina, conjuntos, alquimia, companero, instructores, holmr, santuarios, legendarios, contratos, casa, encuentros, facciones y furia; el nivel aparece como `nivel`. Un sistema nuevo pasa su nombre y suma su texto `hj.de_`; sin nombre cae en «Otros» y la prueba falla.
- **El desglose** (`RPG.desglose()`): por cada estadística de `RPG.CLAVES`, la base (forja de Ása, manzanas, cota), cada parte con su diferencia y su proporción, el bono de los sistemas que no son núcleo (`bonoX` multiplicado, `bonoMas` sumado), el recorte del tope y el valor final.
- **Los topes** (`RPG.TOPES`, la pasada de balance): el núcleo (`NUCLEO`: nivel, equipo puesto y sus conjuntos, atributos) cuenta entero. Lo que suman los demás juntos tiene tope, y lo que pasa vale la mitad: daño ×1,75, vida ×1,6, poder rúnico ×1,75, daño del crítico ×1,5, velocidad de ataque y al andar ×1,4, regeneraciones ×2,5, experiencia, plata y botín ×2, estamina +80, armadura +120 (frena a/(100+a) de cada golpe), crítico +25 %. El crítico nunca pasa del 60 % (`CRIT_MAX`, antes 75 %).
- **La pestaña Hoja** (antes de la Bolsa): una casilla por estadística con su runa (Uruz vida, Ehwaz estamina, Tiwaz daño, Sowilo crítico…) y el valor; al elegirla, abajo su base, de dónde sale, el tope y lo que se comió (la casilla topada lleva un punto naranja). Más abajo, la hoja entera en una tabla.

## La saga de Eromash (`motor/saga.js`, `SAGA`; textos `sg.`)

- **Las entradas** (`ENTRADAS`: id, capítulo, runa, color, sistema que la necesita y `n()` → [hecho, total]): cada una lee el estado guardado de su sistema, así nada se cuenta dos veces. Hoy 24 en cuatro capítulos (`CAPS`): la pelea (nivel, bestiario, contratos, guaridas, nidos, hólmganga, jötunn, Cacería, verdugo), los oficios (lecciones, hierbas, comidas, peces, dados, tintes, poderes legendarios, conjuntos), el mundo (libros, hörgar, vættir, elementos, la casa) y la gente (Skuggi, facciones). Si el sistema no está cargado, la entrada no aparece. Una entrada nueva suma su línea y sus textos `sg.e_<id>` y `sg.e_<id>_d`.
- **El porcentaje**: el promedio de lo hecho de cada entrada; va en el nombre de la pestaña, en la cabecera y en el diario.
- **Los hitos** (`HITOS`, `E.extra.saga.hitos`): 25 % plata (150 + 10 × nivel), 50 % un fragmento, 75 % una pieza rara o mejor, 100 % una legendaria y el título «Leyenda de Eldervald» (`leyenda`). Se revisan cada 3 s y al abrir la pestaña, y pagan una sola vez; una partida vieja marca sin pagar los que ya pasó la primera vez que carga (`visto`).
- **La pestaña Saga** (antes del Diario): la cabecera con el título, el porcentaje, el próximo hito y su barra; por capítulo, una casilla por entrada con su runa y «hecho/total» (apagada sin empezar, dorada completa); al elegirla, su barra y una pista de cómo empezar.

## Pruebas

`node aventura/pruebas/correr.cjs [filtro]` (con Playwright instalado) abre el juego sin ventana en la ranura 9 y
corre los archivos `aventura/pruebas/*.js`. Cada sistema suma su archivo con sus casos.
