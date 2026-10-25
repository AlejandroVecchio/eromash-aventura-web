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

## Descanso (`motor/descanso.js`, `DESCANSO`; petate en `mundo/assets-descanso.js`; textos `ds.` en `textos/descanso.js`)

- Dónde: el petate de pieles (`petateEromash`) junto a los fogones con nombre (`fogon`, `fogon_refugio`, `fogon_paso`,
  `fogon_aserradero`) y «Descansar junto al fuego» en el menú de cualquier fogata encendida (hook nuevo de cocina.js:
  `botonesFogata(f)` → `[{ texto, sub, fn }]`). Seguro = dentro de un refugio (`REFUGIOS`, igual que combate.js).
- Menú: hasta el alba (6), el mediodía (12), el atardecer (18), la noche (22) o una hora; solo las que quedan a 1 h o
  más. Con `A.enPelea()` no se puede.
- El rato: `J.modo = "cine"` y el sistema corre `E.tiempo` (y el reloj de la alquimia) en 1,2 + 0,2 × horas segundos
  (tope 3,2 s); el cielo cambia solo porque el motor sigue armando el ambiente. E, ✕, atacar o un toque cortan.
- Al despertar (`efectos`): vida, estamina y frasco llenos. Con 4 h o más: toxicidad a 0 y los grupos de `HORDAS`
  muertos a más de 1400 vuelven (no los únicos). Con 6 h o más y sin emboscada: «Bien descansado» 600 s, `s.xp` × 1,15 en
  refugio o × 1,10 afuera. Pasar la noche entera (2 h dentro de 22–4) trae el sueño siguiente (6, `ds.sueno_N`).
- Emboscada: afuera, si las horas pasan por 22–4, con semilla por día y lugar (`EMBOSCADA` = 35 %), el rato se corta
  entre 1 y 3 h después de entrar en la noche y llegan tres lobos (pal 1, vida + 4 % por nivel) persiguiendo.
- La cama de las casas (interiores.js) llama a `DESCANSO.dormido(horas)`: cuenta como descanso seguro.
- Estado en `E.extra.descanso = { veces, suenos, descansado, k }`.

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

## Pruebas

`node aventura/pruebas/correr.cjs [filtro]` (con Playwright instalado) abre el juego sin ventana en la ranura 9 y
corre los archivos `aventura/pruebas/*.js`. Cada sistema suma su archivo con sus casos.
