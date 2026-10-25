# Mapa del código de la aventura web

Para encontrar rápido dónde se cambia cada cosa. Arriba, lo que más se toca con dónde buscarlo; abajo, todos los archivos con sus secciones, lo arma solo `node herramientas/mapa-del-codigo.cjs` (con `--revisar` avisa si quedó viejo).

Todo el código está en `aventura/js/`. Cada archivo arranca con una línea que dice qué tiene y se parte en secciones marcadas con `// ---------- nombre ----------`: buscando `---------- cámara` (o la palabra que sea) se llega directo. Las reglas de la casa (textos en los dos idiomas, controles por acciones, calidad gráfica, todo apto para girar la cámara) están en `CLAUDE.md`.

## Quiero cambiar…

### Eromash

| Qué | Dónde |
|---|---|
| Vida, estamina y lo que gana con la herrería, las manzanas y la pechera | `motor/poderes.js` (`jug.hpMax = …`) y el arranque de `jug` en `motor/juego.js` (sección `estado`) |
| Velocidad al caminar, correr y esquivar; salto; estamina que gasta cada cosa | `motor/juego.js`, sección `Eromash` (`VEL_PASO`, `actualizarJugador`) |
| Combo de golpes, giro, estocada, críticos, contraataque | `motor/juego.js`: `golpear`, `atacarCon`, `objetivoCerca` |
| Los golpes de cada tipo de arma (hacha, y las que vengan), sangrado y el hacha lanzada | `motor/armas.js` (`ARMAS.tipo`, `golpes`); el dibujo en `equipo/armas-dibujo.js` |
| Cómo se ve y cómo se anima | dibujo en `personajes/vikingo.js`, vida y gestos en `personajes/animacion.js` (`ANIMA.pose`), espada y sombra en `dibujarJugador` de `motor/juego.js` |
| Morir y reaparecer | `motor/juego.js`, sección `muerte y reaparición` (`dondeReaparecer`); los refugios por misión en `historia/guion.js` (`REAPARECER`) |
| Runas (Kenaz, Isa, Algiz, Sowilo), poder rúnico, plata y fragmentos | `motor/poderes.js` (`RUNAS`, `darPlata`, `botinCofre`) |
| Nivel, experiencia, nivel de las criaturas y estadísticas (crítico, armadura, velocidad) | `motor/rpg.js` (`xpPara`, `nivelDe`, `recalcular`, `aporte`); reglas en `docs/rpg.md` |
| Atributos (Fuerza, Destreza, Vigor, Espíritu) y su pestaña en la mochila | `motor/atributos.js` (`efecto`, `POR_NIVEL`); pestañas extra con `INVENTARIO.pestana` |
| Piezas de equipo: bases, rarezas, afijos, nombres y cuánto suman | `equipo/objetos.js` (`BASES`, `AFIJOS`, `generar`, `aportar`); el dibujo en `equipo/arte.js` |
| Qué sueltan las criaturas y los cofres, el botín en el piso, la bolsa y las casillas de equipo | `motor/botin.js` (`alMorir`, `envolverCofres`, `lados`, `celdasBolsa`) |

### El mundo

| Qué | Dónde |
|---|---|
| Lugares con nombre, la ciudad, la quebrada, ríos y lagos | `mundo/eldervald.js`, sección `geografía` (`LUGARES`, `CIUDAD`, `QUEBRADA`, `RIOS`, `LAGOS`) |
| Dónde está cada objeto de la historia y cada NPC | `mundo/eldervald.js`, sección `los objetos del mundo` (`NOMBRADAS`, `PUNTOS`) |
| Qué tan tupido es el bosque y qué árboles salen | `mundo/eldervald.js`, sección `el bosque: generado` |
| Juncos, enebros, tocones y postes en los cruces | `mundo/eldervald.js`, sección `orillas vivas` |
| Lo que Alejandro agrega o saca con el editor | `mundo/agregados.js` (lo escribe el editor; no se edita a mano) |
| El dibujo de un objeto (árbol, roca, casa, farol…) | `mundo/assets*.js`: cada asset es una función con su comentario arriba; el nombre está en la `LISTA` de su archivo. Para verlo: `aventura/catalogo.html` |
| Cómo se pinta el piso (pasto, musgo, barro, helechos) | `mundo/eldervald.js`, sección `el piso, por trozos` (`pintarTrozo`) |
| Cómo se pintan los caminos | `mundo/caminos.js` (`SENDAS`) |
| Lugares altos (el adarve de la muralla) | `motor/alturas.js` y `NIVELES` en `mundo/eldervald.js` |
| Interiores de las casas y sótanos | `motor/interiores.js` (`armarCuarto`, `armarSotano`); muebles en `mundo/assets-interiores.js` y `mundo/assets-sotanos.js` |

### Luz, partículas y ambiente

| Qué | Dónde |
|---|---|
| Largo del día, cuánto oscurece, tono del ocaso y de la noche | `mundo/luz.js` (`DIA`, `noche`, `ambiente`) |
| Rayos de sol y de luna, niebla baja | `mundo/luz.js` (`rayos`, `niebla`) |
| Qué objetos alumbran, con qué radio y color | `LUZ_ASSET` en `motor/juego.js` (sección `la luz`); los sistemas suman las suyas en su `luces` |
| Hojas, luciérnagas, polen, brasas, motas rúnicas, fauna chica, clima | `motor/vida.js` (`emitir`, `TOPE` por calidad, `climaDe`, `evento` para los estallidos) |
| Viñeta, borde rojo con poca vida, flechas de amenaza | `motor/juego.js`, final de `dibujar`, `cunasGolpe`, `flechasAmenaza` |
| Sonidos, volúmenes y ambiente | `comun/sonido.js` (`LISTA`); cuándo suena cada uno en `motor/juego.js` (`sonidoDelMundo`) |

### Criaturas y peleas

| Qué | Dónde |
|---|---|
| Vida, daño y velocidad de cada criatura; afijos de líderes | `motor/combate.js` (`TIPOS`, `AFIJOS`) |
| Cómo piensan (ver, perder, rodear, huir, aturdirse) | `motor/combate.js`, sección `criaturas` (`actualizar`) |
| Avisos en el piso | `motor/combate.js`, sección `avisos en el piso` |
| Dónde salen los grupos y quién los lidera | `motor/hordas.js` (`FAMILIAS`) |
| El dibujo de cada criatura | `enemigos/criaturas.js` y `enemigos/criaturas-bosque.js` |
| El Ciervo Hueco | `motor/combate.js`, sección `el Ciervo Hueco` (`ATAQUES`) |
| Semijefes, encargos, renombre y proezas | `motor/secundarias.js` (`SEMI`) |
| Góinn y su sótano | `motor/goinn.js` |

### Historia y misiones

| Qué | Dónde |
|---|---|
| Misiones, objetivos, banderas y diálogos | `historia/guion.js` (el mismo de Godot) y sus textos en `textos/historia.js` (`av.`) |
| Recompensa por misión, pistas a los 4 minutos, «En esto andabas» | `motor/juego.js`, sección `misiones: recompensas, avisos y pistas` (`misionNueva`) |
| Dónde se para cada NPC en cada etapa | `motor/juego.js` (`ubicarGente`) y `PUNTOS` en `mundo/eldervald.js` |
| Secretos, cofres, piedras rúnicas y viajes | `motor/secretos.js` (`viajar`) |
| Piedras del rito | `motor/ritos.js` (`tocar`); su dibujo en `mundo/assets-piedras.js` (`ASSETS.RITO`) |
| Brújula, «?» de lo pendiente, hitos de exploración | `motor/exploracion.js` |
| Tablón de cacería | `motor/tablon.js` |
| El prólogo y el mago | `interfaz/prologo.js` y `interfaz/mago.js` |

### Pantalla y controles

| Qué | Dónde |
|---|---|
| HUD (retrato, barras, plata, rastreador, avisos) | `interfaz/hud.js` y `css/aventura.css` |
| La barra de abajo: qué puede ir (habilidades, objetos, herramientas, conocimientos), sus teclas y cómo se llena | `interfaz/barra.js` (`COSAS`, `ORDEN`); se acomoda en la pestaña Barra de `interfaz/inventario.js` |
| Las hierbas de Thora (curan) | `motor/poderes.js` (`darHierbas`, `comerHierbas`) |
| Las piedras de Berkano (vida de reserva), los manantiales rúnicos, el brebaje, la talla de Ása | `motor/berkano.js` (`BERKANO`); dibujo en `mundo/assets-berkano.js`; textos `bk.` en `textos/berkano.js` |
| El cartel dorado al llegar a un lugar (tierra nueva, lugar, capital con su estandarte, regreso): tiempos, tamaños y colores | `interfaz/cartel.js` (`CONFIG`, `paisajeEldervald`, `estandarte`, `INSIGNIAS`); cuándo sale: `CARTEL.entra`/`sale` en `zonas` de `motor/juego.js`, en `ciudad/juego.js`, `motor/regiones.js` y `motor/zonas.js`; `?cartel=tierra` lo repite |
| Mochila, equipo, bolsa y diario | `interfaz/inventario.js` |
| Mapa grande, minimapa y su leyenda | `interfaz/mapa.js` (`CAT_DE`, `CATS`, `MUESTRA`); las miniaturas en `interfaz/iconos.js` |
| Opciones | `interfaz/opciones.js` (`filas`) |
| Teclas y botones del mando | `comun/controles.js` (`TECLAS`); siempre por acción, nunca la tecla suelta |
| Cámara: acercar, adelantarse, temblor | `motor/juego.js`, sección `cámara` (`actualizarCamara`, `cambiarZoom`) y `VISTA` arriba de todo |
| Cualquier texto que se ve | `textos/<tema>.js`, con `es` y `en` juntos; el prefijo de cada archivo está en su primera línea |

## Cómo se arma un cuadro

`motor/juego.js` corre el bucle (`cuadro`): actualiza a Eromash, la gente, las criaturas y cada sistema (`actualizar`), y después dibuja en este orden (`dibujar`): piso → `fondo` de los sistemas → avisos y marcas → `piso` de los sistemas → todo lo que tiene altura ordenado por su pie (objetos del mundo, gente, criaturas, lo de cada sistema en `objetos` y Eromash) → silueta de Eromash detrás de lo que lo tapa → `aire` (hojas, lluvia) → niebla → luz → `sobreLuz` (lo que brilla en la oscuridad) → números, rombo de E, haz del objetivo → viñeta y bordes. Al final, el HUD (`actualizarHud`, que solo toca la página cuando algo cambió).

Un sistema nuevo es un objeto en `window.SISTEMAS` con los ganchos que necesite (la lista está en `CLAUDE.md`, «Sistemas»).

## Rendimiento: lo que ya se cuida

- El piso se pinta por trozos de 512 que se guardan (como mucho 3 nuevos por cuadro).
- Los objetos se buscan por baldes (`ELDERVALD.cercanas`), nunca recorriendo el mundo entero; lo pintado en el piso de un tipo se pide con `ELDERVALD.decoDe(id)`.
- Las luces se pintan con dos dibujos hechos una sola vez (`AGUJERO` y `brillo` en `mundo/luz.js`), no con un degradado nuevo por luz.
- La silueta de Eromash redibuja solo lo que de verdad se cruza con él (`bordes` en `motor/juego.js` mide cada asset una vez).
- El HUD escribe en la página solo cuando un valor cambió (`cambia` en `interfaz/hud.js`); los metros del rastreador se cambian en su lugar.
- Todo efecto caro mira `CALIDAD.nivel`.

<!-- desde acá lo arma herramientas/mapa-del-codigo.cjs -->

## Todos los archivos

Cada archivo con lo que dice su primera línea, sus secciones (para buscarlas: `---------- nombre`) y, en `mundo/`, los assets que dibuja.

### js/ciudad/ · 

- **casas.js**: las casas de la capital (módulo CASAS25)
  - proyección · lo que lleva cada pared, vista de frente (s de 0 a len, t = 0 el piso, hacia arriba negativo) · el cuerpo de la casa · lo que se arrima a la casa · el dibujo entero
- **enseres.js**: lo chico de la ciudad en volumen (módulo ENSERES25)
  - la huerta: canteros bajos con sus plantas, el cerco de mimbre; va en el piso · los carros: la carreta con lona, el carro de caravana (más grande) y el carro abierto de la cuadrilla · la leñera: la pila de leños partidos con las puntas a la vista y su techito de un agua · la forja de Ása: el cobertizo abierto con la fragua, la chimenea, el yunque y las herramientas · la chimenea de la herrería: alta, de piedra, angostándose, con la boca encendida · el tablón: dos postes, el tablero con papeles de los dos lados y su alero · la mesa con sus dos bancos · el estante: armas apoyadas, o manojos de hierbas colgados (el secadero) · el tendedero: dos postes, la soga y la ropa colgada · el ahumadero: casita baja de tablas con techo a dos aguas y humo · la lona de la cuadrilla: una carpa en caballete · leños: el tronco caído (asiento) y la pila de troncos del aserradero · un fardo de heno atado · la diana del campo de tiro: el caballete y el disco de paja con sus anillos · la campana de la plaza: el pórtico de dos postes con su techito y la campana colgada · la cama de pieles del patio de Sanación: un catre bajo con las pieles · el estandarte de la cornamenta: el asta y la tela verde con el Ciervo, a lo ancho (u) · el poste del Hongo Dorado: el poste, el brazo y el cartel con el hongo dorado, y su farol · el farol de poste: el poste, el brazo a lo largo (u) y la caja colgada con la luz · una roca: un prisma bajo y desparejo, gris con musgo arriba · el muñeco de práctica: el poste, los brazos de palo a lo ancho, el cuerpo de paja y el escudo al frente · lo que cuenta algo de la ciudad (revisión 7)
- **juego.js**: Eikholt en el juego (sistema EIKHOLT)
  - el plano y el bosque · la gente · lo que se puede hacer cerca · Eromash camina · la cámara: sigue a Eromash, Z / X giran, acercar y alejar (o la rueda) · armar la ciudad (la primera vez que se entra) · entrar y salir · el cuadro · el sistema (en el bosque: detecta cuando Eromash llega a la ciudad)
- **luces.js**: la luz de la capital (módulo LUCES25)
  - el color de cada hora
- **mundo.js**: la ciudad viva (módulo MUNDO25)
- **muralla.js**: la muralla doble de Eikholt en volumen (módulo MURALLA25)
- **oficios.js**: lo de los oficios que va en volumen (módulo OFICIOS25)
- **plano.js**: el plano de la capital en 2.5D (módulo PLANO25)
  - el río · los lugares con nombre y lo que reservan · las calles · la empalizada, las atalayas y las piedras de la cúpula · el Roble y la plaza · los edificios con nombre (las casas especiales, cada una con su ficha) · el noroeste: Sanación, sus hierbas, la hospedería y la cordelería · el noreste: la Guardia, su campo de entrenamiento, los forasteros y el corral de caravanas · las casas de la gente · lo que llena la tierra entre los barrios: huertas cercadas, galpones con heno y montecitos · árboles sueltos entre las casas · el río: los dos puentes, el muelle y los botes · lo que cuenta algo: detalles con historia y cofres escondidos (revisión 7)
- **porton.js**: las puertas de la empalizada (módulo PORTON25)
- **puestos.js**: los puestos del Mercado de los Toldos (módulo PUESTOS25)
- **recorrer.js**: recorrer la capital con Eromash (módulo RECORRER25)
  - los barrios: el más cercano dentro de su radio pone su nombre al entrar · quién dice qué: los vecinos con nombre tienen sus frases (pj.<nombre>_0..3), los demás las del barrio · la tarjeta de lo que se mira (HTML: se lee mejor y se adapta a la pantalla) · cada cuadro · la gente reacciona a Eromash · los animales, el humo, las chispas y las hojas · dibujar
- **roble.js**: las raíces del Roble de Eikholt (módulo RAIZ25)
- **sombras.js**: las sombras de la capital (módulo SOMBRAS25)
  - las sombras horneadas en el piso
- **ting.js**: las piedras del Ting en volumen (módulo TING25)
- **vista.js**: cómo se ve la capital (módulo VISTA25)
  - el piso · el piso entero en un lienzo que se corre · la cámara

### js/comun/ · lo compartido: dibujo, runas, controles y sonido

- **controles.js**: controles (módulo CONTROLES)
  - teclas propias
- **dibujo.js**: herramientas de dibujo (módulo DIB)
- **futhark.js**: las runas del Futhark antiguo (módulo FUTHARK)
- **sonido.js**: sonido (módulo SONIDO)
- **volumen.js**: todo girable: volúmenes que se ven bien desde cualquier lado (módulo VOL)
  - el giro del mundo · colores: cada cara con su tono · el proyector de un objeto · caras · sólidos · en el piso del objeto · partes de un objeto, de atrás hacia adelante · la gente y las criaturas: la vista según la cámara · ayudas para pasar los dibujos viejos

### js/enemigos/ · el dibujo de las criaturas

- **aranas.js**: las arañas del bosque viejo (se suman a CRIATURAS)
- **bandidos.js**: los Sin Linde: bandidos del bosque (se suman a CRIATURAS)
  - Bandido · Arquero
- **caceria.js**: la Cacería Salvaje: sabuesos y el Cazador (se suman a CRIATURAS)
  - Sabueso de la Cacería · El Cazador de Oskoreia
- **criaturas-bosque.js**: las criaturas del bosque profundo (se suman a CRIATURAS)
  - Draugr del túmulo · Jabalí de musgo · Cuervo de Hel · Fuego fatuo · Trol de musgo · Oso de zarzal
- **criaturas.js**: las criaturas de Eldervald (módulo CRIATURAS)
  - Lobo del zarzal · Errante de Helheim · Custodio de corteza · Ciervo Hueco (jefe)
- **dreki.js**: el dreki (se suma a CRIATURAS)
- **jotunn.js**: Hrímnir, el jötunn de la escarcha (se suma a CRIATURAS)
- **kempur.js**: los campeones de la hólmganga (CRIATURAS "kempa")

### js/equipo/ · las piezas de equipo (bases, rarezas, afijos) y su dibujo

- **arcos-dibujo.js**: el dibujo de los arcos (forma "arco" de DIB_ARMAS)
- **armas-dibujo.js**: el dibujo de las armas que la arena no tiene (módulo DIB_ARMAS)
  - hachas de una mano · a dos manos
- **arte.js**: el dibujo de cada pieza de equipo (módulo ARTE_OBJ)
  - qué dibujo de la arena le toca · amuletos y anillos (propios) · dibujar
- **bastones-dibujo.js**: el dibujo de los bastones rúnicos (forma "baston" de DIB_ARMAS)
- **lanzas-dibujo.js**: el dibujo de las lanzas (forma "lanza" de DIB_ARMAS)
- **martillos-dibujo.js**: el dibujo de los martillos y mazas (forma "martillo" de DIB_ARMAS)
- **objetos.js**: los objetos de equipo: bases, rarezas, afijos y nombres (módulo OBJETOS)
  - rarezas · bases · afijos · nombres de las raras y legendarias · azar con semilla (las pruebas y el mundo fijo piden poder repetir una tirada) · la tirada · nombres · lo que se lee de cada pieza · lo que suma al jugador

### js/historia/ · el guion (igual al de Godot)

- **guion.js**: el guion y el estado de la partida (módulo HISTORIA)
  - estado · guardado: 3 ranuras en localStorage (si el navegador lo bloquea, la partida sigue sin guardar)

### js/interfaz/ · HUD, mochila, mapa, opciones y el prólogo del mago

- **barra.js**: la barra de abajo (sistema BARRA)
  - lo que puede ir en una casilla · poner y sacar · usar · lo que ve el HUD
- **cartel.js**: el cartel de lugar (CARTEL): el cartel dorado que anuncia un lugar, una tierra nueva o la capital al llegar
  - parámetros (los mismos de cartel_lugar.gd; tamaños a 1080 de alto, tiempos en segundos) · ayudas · el lienzo · estado · tiempos · disposición · dibujo · paisaje / estandarte en un solo trazo · dibujos de cada región y capital · la fila y cuándo sale cada uno
- **hoja.js**: la hoja de Eromash (sistema HOJA, pestaña Hoja de la mochila)
- **hud.js**: la interfaz de la aventura (módulo HUD)
  - menús (título, pausa, diario, fin): botones que se eligen con mouse, flechas o mando
- **iconos.js**: miniaturas del mapa (ICONOS)
- **inventario.js**: la mochila (sistema INVENTARIO)
  - las piezas de verdad, las mismas de la arena · los íconos (los de la aventura, dibujados con el mismo estilo plano que los assets) · el contenido de cada pestaña · la ventana
- **mago.js**: el mago de Eromash (módulo MAGO)
  - el mago (coordenadas del dibujo del vikingo: 40..440 x 90..570, centro en 240,330)
- **mapa.js**: el mapa de Eldervald (sistema MAPA)
  - las miniaturas · el mapa grande: zoom, arrastre y la marca propia · el minimapa
- **opciones.js**: opciones (módulo OPCIONES)
  - teclas propias
- **prologo.js**: el prólogo del mago (módulo PROLOGO)
  - el nombre pasado a runas · la cabaña (igual que la ilustración) · el escritorio · el pergamino: lo que escribe el mago, en runas (al revés para quien mira: de frente al mago) · la pluma que escribe sola · lo que hay en el escritorio · la escena desde arriba: el escritorio visto en planta, con el pergamino en el medio · el cuadro: elige la escena y la cámara · las preguntas

### js/motor/ · el motor y los sistemas que se le enchufan

- **alquimia.js**: hierbas y alquimia (sistema ALQUIMIA)
  - dónde crece cada una · destilar y tomar · la ventana de la mesa (pestaña de la mochila, solo junto a la mesa) · la Bolsa: hierbas, pociones y aceites · íconos · el sistema
- **alturas.js**: las alturas (sistema ALTURAS)
  - geometría · moverse · lo de abajo, oscuro y difuso
- **aranas.js**: los nidos de arañas (sistema ARANAS)
  - dónde: lo hondo del bosque · tela · sacos y crías · veneno y vendas · el sistema
- **arbol.js**: el árbol de habilidades (sistema ARBOL, pestaña Habilidades de la mochila)
  - las cuentas · los dibujos: la cabeza de cada bestia y cada nodo · la pestaña · los efectos en la pelea
- **arco.js**: el arco (sistema ARCO, tipo de arma "arco")
  - en la mano · dibujo · el sistema
- **arcon.js**: el arcón del Puesto y el filtro del botín (sistema ARCON)
  - el filtro · el arcón · la pestaña · el sistema
- **armas.js**: los tipos de arma y sus golpes (sistema ARMAS)
  - hachas · a dos manos · el hacha lanzada · el torbellino · el arma en la mano: cómo se lleva cada tipo · el sangrado · las grietas del hachazo · el sistema
- **atributos.js**: los atributos de Eromash (sistema ATRIBUTOS)
  - la pestaña
- **bandidos.js**: los Sin Linde: guaridas de bandidos (sistema BANDIDOS)
  - dónde: cerca de los caminos, lejos de los pueblos, de los grupos y entre ellas · la flecha de los arqueros: vuela en arco al final del aviso · el sistema
- **baston.js**: el bastón rúnico (sistema BASTON, tipo de arma "baston")
  - pegar con magia · chispas · el sello · paso de niebla y ola · en la mano · dibujo · el sistema
- **berkano.js**: las piedras de Berkano y los manantiales rúnicos (sistema BERKANO)
  - las piedras · los manantiales · juntar una piedra · el brebaje de Berkano (objeto de la barra de abajo) · Thora y Ása
- **bestiario.js**: el bestiario (sistema BESTIARIO, pestaña de la mochila)
  - lo que sabe · los dibujos (íconos de la mochila) · la pestaña · el sistema
- **botin.js**: el botín y el equipo de Eromash (sistema BOTIN)
  - la bolsa y el equipo · comparar con lo puesto · lo que cae · en el mundo · la mochila · el sistema
- **caceria.js**: la Cacería Salvaje (sistema CACERIA)
  - cuándo · sonidos armados · la llegada · los jinetes que cruzan · el final · el cuerno · el sistema
- **capital.js**: la vida de Eikholt (sistema CAPITAL)
- **casa.js**: la casa propia (sistema CASA)
  - dónde: junto al camino que sale del Puesto · comprar y mejorar · el arcón · la huerta · el cuarto · el sistema
- **claro.js**: el Claro del Ciervo en el juego (sistema CLARO)
- **cocina.js**: la cocina en la fogata (sistema COCINA, modo "cocina")
  - lo que hace falta · el menú de la fogata · la tabla de cortar · el dibujo de la tabla · íconos · el sistema
- **combate.js**: combate: criaturas, avisos en el piso y el Ciervo Hueco (módulo COMBATE)
  - avisos en el piso · criaturas · el Ciervo Hueco (EL-05)
- **comercio.js**: el comercio: comprar, vender y recomprar (sistema COMERCIO)
  - precios · lo que venden hoy · comprar, vender, recomprar · la pestaña del mercader · Kolbrun en el bosque · el sistema
- **conjuntos.js**: los conjuntos de equipo (sistema CONJUNTOS)
  - crear una pieza · lo que suman · lo que se lee · la pestaña de la mochila · de dónde salen · el sistema
- **contratos.js**: los contratos de caza y los trofeos (sistema CONTRATOS)
  - el mundo · la bestia y su escolta · tomar, examinar, cobrar · el poste · la Bolsa: los trofeos · el sistema
- **elementos.js**: las runas de los elementos y las reacciones (sistema ELEMENTOS)
  - las dos runas nuevas · las reacciones · el Roble del Trueno · la Fuente de Laguz · el códice · el dibujo · el sistema
- **encuentros.js**: encuentros en el camino (sistema ENCUENTROS)
  - aparecer · cada encuentro · el sistema
- **engarces.js**: muescas, tallas y palabras rúnicas (sistema ENGARCES)
  - al generar una pieza (objetos.js): ¿sale con muescas? · lo que suma una pieza · encastrar, vaciar, unir · Ása abre muescas · la pestaña de la mochila · íconos · el sistema
- **escudo.js**: el escudo: bloquear, parar y empujar (sistema ESCUDO, acción `bloquear`)
  - recibir · el escudo en el brazo · el sistema
- **este.js**: el este en el juego (sistema ESTE)
- **etapas.js**: los encargos de preparación de las etapas (sistema ETAPAS)
- **exploracion.js**: explorar Eldervald (sistema EXPLORA)
  - los secretos de cada lugar · notar lo escondido · la brújula
- **forja.js**: la forja al ritmo del yunque (sistema FORJA, modo "forja")
  - qué base y cuánto cuesta · los menús · la partitura · el juego · el dibujo (1600 × 900, como los interiores) · el sistema
- **frasco.js**: el frasco de Thora (sistema FRASCO)
  - tomar · Thora · los íconos: el frasco con tantas marcas como cargas · el sistema
- **furia.js**: la Furia y las habilidades activas (sistema FURIA)
  - las cuentas · usar · íconos de la barra · el sistema · los nodos del árbol
- **goinn.js**: el sótano de la hospedería y Góinn (sistema GOINN)
  - la pelea · la puerta, la cámara y los portales · lo que se ve en la cámara: los doce trofeos y lo que dejaron los custodios
- **herreria.js**: la herrería de Ása por dentro (sistema HERRERIA)
  - el taller · la gente · estado · entrar y salir · lo que se hace adentro · lo que hay a mano · Eromash camina · el trabajo · la cámara · el cuadro · el piso y las paredes (hechos una vez en lienzos) · la gente en la vista · dibujar
- **holmr.js**: la hólmganga: duelos en la piel (sistema HOLMR)
  - dónde: junto al camino del Puesto a Eikholt, en un claro · el duelo · el sistema
- **hongo.js**: el Hongo Dorado por dentro (sistema HONGO)
  - la sala · lo que choca · arriba · la gente · estado · entrar y salir · lo que se hace adentro · los cuartos de arriba · lo que hay a mano · Eromash camina · la vida de la sala · la cámara · el cuadro · el piso y las paredes (hechos una vez en lienzos) · la galería, los postes y la escalera · la gente en la vista · dibujar · un cuarto de arriba
- **hordas.js**: los grupos de criaturas del bosque (sistema HORDAS)
- **importados.js**: la gente propia del editor (sistema IMPORTADOS)
- **instructores.js**: los instructores y el muñeco de práctica (sistema INSTRUCTORES)
  - dónde está cada uno · las lecciones · el muñeco · el sistema
- **interiores.js**: los interiores (sistema INTERIORES)
  - cómo es cada cuarto · lo cambiado con el editor (pestaña Interiores) · los sótanos · las casas de varios cuartos (planos) · entrar y salir · lo que se hace adentro · caminar adentro · dibujar el cuarto · el cuarto girado (todo girable)
- **jotunn.js**: Hrímnir, el jötunn de la escarcha (sistema JOTUNN)
  - dónde: un alto del norte, lejos de caminos y de todo · la pelea · el desafío: sin sus guardianes caídos, la patada · el sistema
- **juego.js**: el motor de la aventura (módulo JUEGO)
  - estado · la gente · criaturas · utilidades · avisos · ubicar a la gente según la etapa · misiones: recompensas, avisos y pistas · interacciones de las misiones · lo que revela la Lente del Eco · diálogos · cinemáticas cortas · muerte y reaparición · Eromash · lo que se oye: pasos, el viento, los grillos, los cuervos y las fogatas cerca · con qué se puede interactuar ahora · zonas (Eldervald._zonas) · la gente camina y mira · cámara · dibujo · la luz · la silueta de Eromash detrás de las cosas · el claro de Eromash: lo que lo rodea se vuelve transparente · HUD de cada cuadro · menús · bucle · arranque
- **juegos-runas.js**: los juegos de runas de los viajeros (JUEGOS_RUNAS, modo "runas")
  - empezar y terminar · cada juego · el lienzo y el puntero · cada cuadro (lo llama juego.js por J.modos) · el dibujo (1600 × 900)
- **lanza.js**: la lanza (sistema LANZA_ARMA, tipo de arma "lanza")
  - en la mano · dibujo · el sistema
- **legendarios.js**: los poderes de las legendarias (sistema LEGENDARIOS)
  - al generar: las legendarias traen su poder · qué poderes valen ahora · el golpe de un poder (pasa por los modDano y avisa con alPegar, marcado para no encadenarse) · la pestaña Poderes · el sistema
- **libros.js**: los libros de Eldervald (sistema LIBROS, modo "libro")
  - dónde: atriles a un costado de los caminos · leer · la ventana del lector · lo que llevan los líderes · el sistema
- **martillo.js**: el martillo (sistema MARTILLO, tipo de arma "martillo")
  - quebrar · temblor (el remate) y trueno · el sistema
- **materiales.js**: los materiales de la forja (sistema MATERIALES)
  - tener, dar y gastar · desarmar · la forja · las vetas · la bolsa · el sistema
- **matraz.js**: el matraz de la mesa de alquimia (MATRAZ, modo "matraz")
  - empezar y terminar · el lienzo · cada cuadro (lo llama juego.js por J.modos) · el dibujo (1600 × 900)
- **norte.js**: el corredor del norte en el juego (sistema NORTE)
- **pesca.js**: la pesca (sistema PESCA)
  - el agua · tirar, picar, pelear · el dibujo en el mundo · el puesto de Sverri · el sistema
- **poderes.js**: poderes rúnicos, botín y la gente de Eikholt (sistema PODERES)
  - la gente de Eikholt que no está en la historia · recompensas (las usan los secretos y los grupos) · las hierbas de Thora: el primer objeto que se usa desde la barra · lanzar runas · dibujo
- **regateo.js**: el regateo (sistema REGATEO)
  - el estado del día · abrir, pedir, parar · la ventana · el sistema
- **regiones.js**: regiones con nombre (sistema REGIONES)
- **ritos.js**: las piedras viejas (sistema RITOS)
  - armar · aplicar lo guardado · el rito cumplido · empezar cada rito · lectura de las piedras del camino
- **rpg.js**: niveles, experiencia y estadísticas de Eromash (sistema RPG)
  - los topes (la pasada de balance) · el nivel de cada criatura · la experiencia · las estadísticas · el HUD: el nivel en el retrato y la barra de experiencia · el número de nivel sobre las criaturas
- **saga.js**: la saga de Eromash (sistema SAGA, pestaña Saga de la mochila)
  - los hitos · la pestaña · el sistema
- **santuarios.js**: los hörgar de los dioses y sus bendiciones (sistema SANTUARIOS)
  - pedir · ubicar · el sistema
- **secretos.js**: los secretos de Eldervald (sistema SECRETOS)
  - armar el mundo de secretos · aplicar lo guardado · acciones
- **secundarias.js**: encargos, semijefes, renombre y proezas (sistema SECUNDARIAS)
  - semijefes · encargos · proezas · renombre
- **senda.js**: la senda del Refugio (sistema SENDA)
- **sigilo.js**: el sigilo: agacharse, el ojo y el golpe desde las sombras (sistema SIGILO)
  - el sistema
- **tablon.js**: el tablón de cacería del Puesto (sistema TABLON)
- **tintes.js**: los tintes del casco (sistema TINTES)
  - la pestaña · el sistema
- **vida.js**: el bosque vivo (sistema VIDA)
  - partículas con estado · luces que dejan los eventos · clima del día · los lugares místicos · fauna chica · emisores con estado (brasas, humo, hojas, motas rúnicas…) · campos sin estado (dependen solo de la posición y el tiempo) · el fuego guía · fauna chica: liebres, pinzones, mariposas y bandadas · eventos que mandan los sistemas · capas de dibujo · el sistema
- **zonas.js**: las zonas del generador: mazmorras oscuras y tierras con islas (sistema ZONAS)
  - los generadores (también los usa el editor) · leer un pedido escrito (sin IA) · las tres mazmorras que vienen con el juego · armar cada zona en su lugar fuera del mapa · entrar, salir y pasar · dibujar · el sistema

### js/mundo/ · el bosque, sus objetos (assets), el piso, la luz y los caminos

- **agregados.js**: Lo que se agregó o se sacó del mundo con el editor de Eldervald (repo map-generator). Este archivo lo escribe el editor
- **assets-alquimia.js**: las hierbas de Eldervald y la mesa de alquimia (assets de ALQUIMIA)
  - la mesa de alquimia
  - assets: hierbaMusgo, hierbaSerbal, hierbaAbedul, hierbaEscarcha, hierbaLuna, hierbaCardo, mesaAlquimia
- **assets-aranas.js**: el nido de las arañas (assets de ARANAS)
  - assets: nidoArana, sacoHuevos
- **assets-arcon.js**: el arcón de Eromash en el Puesto (asset de ARCON)
  - assets: arconPuesto
- **assets-bandidos.js**: el campamento de los Sin Linde (assets de BANDIDOS)
  - assets: tiendaSinLinde, estacaSinLinde, botinSinLinde
- **assets-berkano.js**: las piedras de Berkano y los manantiales rúnicos (se suman a ASSETS)
  - el manantial rúnico · la piedra de Berkano tirada
  - assets: manantialRunico, piedraBerkano
- **assets-capital.js**: Eikholt según el compendio del 22/10/2026 (se suma a ASSETS)
  - assets: casaNordica, robleGigante, empalizadaDoble, murallaDoble, escaleraMuralla, piedraAncla, runaCupula, puertaNorte, estandarteCiervo, campana, tablonAvisos, carpinteria, curtiembre, munecoPaja, carreta, buey, cerca, muelle, camaHongos, casaGuardia
- **assets-casa.js**: la casa de Hrolf, la casa propia (assets de CASA)
  - assets: letreroVenta, huertaCasa
- **assets-casas.js**: las casas de varios cuartos
  - La puerta de adentro · El paso secreto · El tapiz de la pared · Las tablas flojas
  - assets: puertaInterior, pasoSecreto, tapizPared, tablasFlojas
- **assets-ciudad.js**: la capital en 2.5D (se suma a ASSETS)
  - assets: posteHongo, munecoPractica, dianaTiro, estanteArmas, secaderoHierbas, fardoHeno, chimeneaHerreria
- **assets-claro.js**: el Claro del Ciervo, versión épica (se suma a ASSETS)
  - assets: arcoAstas, paredRoca, manchaEnferma, camaMusgo, escaleraRaices, apostadero, fisura
- **assets-comercio.js**: el puesto de Kolbrun, la buhonera de Eldrakar (assets de COMERCIO)
  - la alfombra de Kolbrun · el fardo de buhonera
  - assets: alfombraKolbrun, fardoKolbrun
- **assets-contratos.js**: los contratos de caza (assets de CONTRATOS)
  - el poste de los contratos · los rastros de una bestia
  - assets: posteContratos, rastroContrato
- **assets-eikholt.js**: Eikholt, la capital (se suma a ASSETS)
  - assets: muralla, torreVigia, piedraMuralla, puertaSur, granTablero, tingCirculo, toldo, herreriaAsa, cordeleriaFolke, casaSanacion, hongoDorado, huerta
- **assets-elementos.js**: las runas de los elementos: Thurisaz y Laguz (assets de ELEMENTOS)
  - assets: robleTrueno, fuenteLaguz, piedraManantial
- **assets-este.js**: el este: Aserradero de Orm y Santuario de las Raíces (se suma a ASSETS)
  - assets: ruedaAgua, compuerta, canal, galponSierra, pilaTroncos, tornoRampa, bueyBarro, bancoTaco, lenera, gradaQuilla, escalonesRaices, estela, arbolPortal, restosZarzas, selloPiedra, lomaMirador, cofreZarzas
- **assets-guaridas.js**: las guaridas de los semijefes (se suma a ASSETS)
  - assets: puertaPiedra, bocaCueva, nidoZarzal
- **assets-herreria.js**: lo de adentro de la herrería de Ása (assets armados con caras)
  - La forja de Ása · El fuelle · La pila de templar · La muela de afilar · La pared de las herramientas · El armero de lo terminado · El banco de lo que está a medio hacer · El montón de carbón · Brasa, la gata de la forja
  - assets: forjaGrande, fuelle, pilaTemplar, muelaAfilar, panopliaHerramientas, armeroForja, bancoForja, montonCarbon, gataForja
- **assets-holmr.js**: el hólmr: la piel del duelo (assets de HOLMR)
  - assets: holmrPiel, holmrVara, bancoTestigos
- **assets-hongo.js**: lo de adentro del Hongo Dorado (assets armados con caras)
  - El fogón del Hongo Dorado · La barra de Ulf · El estante de jarras y cuernos · Los toneles de las aldeas · La mesa larga de los parroquianos · La mesa redonda de los forasteros · La rueda de velas · La tarima del skald · El estandarte de Eikholt · Los escudos de los que no volvieron · Los hongos dorados de las vigas
  - assets: fogonHongo, barraHongo, estanteJarras, tonelesHongo, mesaLarga, mesaRonda, lamparaRueda, tarimaSkald, estandarteEikholt, escudosPared, hongosDorados
- **assets-instructores.js**: los instructores y el muñeco de práctica (assets de INSTRUCTORES)
  - assets: munecoPractica
- **assets-interiores.js**: los muebles de adentro (interiores)
  - El escritorio rúnico · El hogar de piedra · La cama de pieles · El arcón de la casa · El yunque y la forja de Ása · El estante de hierbas de Thora · El mostrador del Hongo Dorado · El telar · Mesa con banco
  - assets: escritorioRunico, hogarPiedra, camaPieles, arconCasa, forjaAsa, yunque, estanteHierbas, mostrador, barriles, telar, mesaBanco
- **assets-jotunn.js**: el asiento de Hrímnir (assets de JOTUNN)
  - assets: asientoJotunn, menhirEscarcha, jotunnFigura
- **assets-libros.js**: los libros de Eldervald (assets de LIBROS)
  - assets: atrilPiedra, libroCaido
- **assets-materiales.js**: las vetas del bosque: de donde sale el material de la forja (assets de MATERIALES)
  - la veta de hierro de pantano · el nódulo de ámbar · la vena rúnica
  - assets: vetaHierro, vetaAmbar, vetaRunica
- **assets-norte.js**: el corredor del norte: Paso del Guardián y Antigua tala (se suma a ASSETS)
  - assets: pilarAntiguo, lonaCuadrilla, tornoVigas, tablaPuente, pilaTablones, andamio, posteCruzaron, casetaPuentero, toconMarcado, muroRaices, granTocon, cabanaLenadores
- **assets-pesca.js**: la pesca (assets de PESCA)
  - los peces · el puesto de pesca de Sverri
  - assets: canaSverri
- **assets-piedras.js**: las piedras de Eldervald: las del camino y las del rito
  - formas de piedra · Piedra del camino · Piedra del rito
  - assets: piedraCamino, piedraRito
- **assets-puesto.js**: El Puesto de Eydis imaginado (versión de Alejandro, 22/10/2026; se suma a ASSETS)
  - assets: palisada, portonPuesto, mesaRutas, tableroTablillas, tablonCaza, fogonOlla, mostradorManta, ahumadero, tendedero, perraGrima, piedraVioleta
- **assets-santuarios.js**: los hörgar de los dioses (assets de SANTUARIOS)
  - assets: horgr
- **assets-secretos.js**: los secretos de Eldervald: cofres, piedras rúnicas, altares y ruinas
  - Arcón del leñador · Cofre rúnico sellado · Urna del túmulo · Arca enterrada · Piedra del susurro · Altar de runa · Brasero de Skarnholt · Salón quemado de Skarnholt · Entrada del túmulo · Torre del Cuervo · Carro de la caravana · Tótem de campamento · Manzano de Iðunn
  - assets: arconLenador, cofreRunico, urnaTumulo, arcaEnterrada, piedraSusurro, altarRuna, brasero, salonQuemado, tumuloEntrada, torreCuervo, carroCaravana, totemCampamento, manzanoIdunn
- **assets-senda.js**: El carro volcado y el Refugio de las Lindes, versión de Alejandro (22/10/2026; se suma a ASSETS)
  - assets: carroCuadrilla, sacosAbiertos, rastro, posteFarol, mojon, posteTablillas, camilla, cunaPiedra
- **assets-sotanos.js**: los secretos de adentro: alfombras, trampillas y sótanos
  - Alfombra · Trampilla · Escalera de mano · Cajones · Atril con el libro de saber · Estante de rollos · Armero · Tabla suelta · Cofre del sótano · Huesos · Cesto de la despensa · El muro falso del escondite · Sacos · Cántaros del sótano viejo
  - assets: alfombra, trampilla, escaleraMano, cajas, atril, estanteRollos, armero, tablaSuelta, cofreSotano, huesos, cesto, muroFalso, sacos, cantaros
- **assets-tintes.js**: la tina de tintes del Puesto (asset de TINTES)
  - assets: tinaTintes
- **assets-vida.js**: la vida del bosque viejo: estructuras místicas y fauna chica (assets de VIDA)
  - El Fresno de los Ecos · El Anillo de los álfar · La Poza de Urd · Las flores del despertar · fauna chica (no pelea; huye)
  - assets: fresnoEcos, anilloAlfar, pozaEstrellas, floresDespertar, liebre, pinzon, mariposa, libelula, polilla, pez
- **assets-zonas.js**: las zonas del generador: mazmorras, islas y lo que las une
  - La boca de la cripta · La barca de las islas · La antorcha de pared · La escalera de la cripta · El pilar de la cripta · El volcán · La boca de la cueva
  - assets: bocaMazmorra, barcaVikinga, antorchaPared, escaleraMazmorra, pilarCripta, volcan, bocaCueva
- **assets.js**: los objetos de Eldervald (módulo ASSETS)
  - colores de Eldervald
  - assets: pino, juncos, enebro, brezo, posteCruce, roble, abetoAnciano, robleAnciano, abedul, helechos, alfombraMusgo, barro, hongosRocio, roca, troncoCaido, pinoTalado, arbolQuebrado, farol, piedraLinde, puestoEydis, tableroRutas, empalizada, carroVolcado, menhirRefugio, runaRefugio, piedraCaida, cobertizoRefugio, casaEikholt, casaLindes, mesaSvanhild, losaPatio, robleEikholt, pozoEikholt, puestoMercado, puentePaso, pedestalPaso, nucleo, tablonMarcado, tocon, raizMarcada, menhirRastro, soporteAtadura, aserradero, puenteTablas, santuario, zarzas
- **caminos.js**: cómo se pintan los caminos (módulo SENDAS)
- **eldervald.js**: el Bosque de Eldervald (módulo ELDERVALD)
  - geografía (Datos.gd) · utilidades de geometría · dónde se puede caminar: una grilla de 20 unidades · los objetos del mundo · el bosque: generado, siempre igual (misma semilla) · orillas vivas, bordes de los claros y postes en los cruces · lo que se agregó o se sacó en el editor (map-generator → js/mundo/agregados.js) · grilla espacial para dibujar y chocar solo lo cercano · choques · el piso, por trozos
- **imagenes.js**: las imágenes propias del editor (módulo IMAGENES)
- **luz.js**: luz, sombra y niebla de Eldervald (módulo LUZ)
- **texturas.js**: las texturas hechas en el editor (TEXTURAS)
  - recetas: cada forma se dibuja nueve veces corrida un cuadro, así el borde de un lado sigue en el otro · imágenes: a los colores del juego, posterizadas y espejadas en cuatro para que no tengan costura · el lienzo de cada textura (se arma una vez por receta o imagen) · los dos assets de cada textura · registrar

### js/personajes/ · Eromash y la gente

- **animacion.js**: cómo se mueve Eromash (módulo ANIMA)
- **gente.js**: la gente de Eldervald (módulo GENTE)
  - los espíritus, como en su hoja: la huldra y el nøkk
- **viajeros.js**: los forasteros del Hongo Dorado (fichas y dibujos propios de GENTE)
  - lo que llevan encima los aventureros · Fjalar, el dvergr de las montañas de hierro · Lysa, álfr del sur · Bergr, medio jötunn · el nisse de la casa
- **vikingo.js**: Eromash en cuatro vistas (módulo VIKINGO)

### js/textos/ · todos los textos del juego en los dos idiomas

- **alquimia.js**: Textos de las hierbas y la alquimia (motor/alquimia.js): prefijo aq.
- **aranas.js**: Textos de los nidos de arañas (motor/aranas.js, enemigos/aranas.js): prefijo ar. (y cr., bs., as., mt.seda, mp.ley_nidos).
- **arbol.js**: Textos del árbol de habilidades (motor/arbol.js): prefijo ab.
- **arcon.js**: Textos del arcón del Puesto y del filtro del botín (motor/arcon.js): prefijo ac.
- **armas.js**: Textos de los tipos de arma y sus golpes (prefijo ar.), los dos idiomas.
- **aventura.js**: Textos propios de la aventura web (interfaz, assets, gente, enemigos), en los dos idiomas.
- **bandidos.js**: Textos de los Sin Linde (motor/bandidos.js, enemigos/bandidos.js): prefijo bd. (y cr., bs., as., mp.ley_bandidos).
- **berkano.js**: textos de las piedras de Berkano y los manantiales rúnicos (motor/berkano.js, mundo/assets-berkano.js): prefijo bk.
- **bestiario.js**: Textos del bestiario (motor/bestiario.js): prefijo bs.
- **caceria.js**: Textos de la Cacería Salvaje (motor/caceria.js, enemigos/caceria.js): prefijo cz. (y cr., bs., hd.unico_cazador).
- **capital.js**: Textos de la capital rearmada (prefijo cap.), sus piezas nuevas (as.) y la gente de Eikholt (av.nombre_, pj.), los dos idiomas.
- **casa.js**: Textos de la casa propia (motor/casa.js, mundo/assets-casa.js): prefijo hg. (y as., in.nombre_propia).
- **ciudad.js**: Textos de la capital en 2.5D (prefijo ci.): el mapa aparte de Eikholt con la cámara que gira y su página de muestra.
- **claro.js**: Textos del Claro del Ciervo (prefijo cl., las piezas en as.), los dos idiomas.
- **cocina.js**: Textos de la cocina en la fogata (motor/cocina.js): prefijo co.
- **comercio.js**: Textos del comercio con Ingrid y Kolbrun (motor/comercio.js, mundo/assets-comercio.js): prefijo cm.
- **conjuntos.js**: Textos de los conjuntos de equipo (motor/conjuntos.js): prefijo cj.
- **contratos.js**: Textos de los contratos de caza y los trofeos (motor/contratos.js, mundo/assets-contratos.js): prefijo ct.
- **eikholt.js**: Textos de Eikholt (prefijo ek.): el mapa aparte de la capital, sus lugares y lo que dice su gente.
  - la ciudad
- **elementos.js**: Textos de las runas de los elementos y las reacciones (motor/elementos.js, mundo/assets-elementos.js): prefijo el.
- **encuentros.js**: Textos de los encuentros en el camino (motor/encuentros.js): prefijo ec. (y los nombres de la gente en av.nombre_).
- **engarces.js**: Textos de las muescas, las tallas y las palabras rúnicas (motor/engarces.js): prefijo en.
- **este.js**: Textos del Aserradero de Orm y el Santuario de las Raíces (prefijo es., las piezas en as.), los dos idiomas.
- **etapas.js**: Textos de las etapas EL-0X-N y sus tres encargos (prefijo et., y los objetivos y diálogos nuevos en av.), los dos idiomas.
- **forja.js**: Textos de la forja al ritmo del yunque (motor/forja.js): prefijo fg.
- **frasco.js**: Textos del frasco de Thora (motor/frasco.js): prefijo fr.
- **furia.js**: Textos de la Furia y las habilidades activas (motor/furia.js): prefijo fu. (los nombres de las habilidades van en
- **goinn.js**: Textos del sótano de la hospedería, el ritual y la pelea con Góinn (prefijo gn.), los dos idiomas.
- **herreria.js**: textos de la herrería de Ása por dentro (hr.) y de sus muebles (as.)
- **historia.js**: Textos de la historia de Eldervald (guion, misiones, diario y lugares), en los dos idiomas.
- **hoja.js**: Textos de la hoja de Eromash y los topes del balance (interfaz/hoja.js, motor/rpg.js): prefijo hj.
- **holmr.js**: Textos de la hólmganga (motor/holmr.js, enemigos/kempur.js, mundo/assets-holmr.js): prefijo hm. (y as., cr.kempa,
- **hongo.js**: Textos del Hongo Dorado por dentro (motor/hongo.js): la sala grande, la gente que la frecuenta, los forasteros de otras
  - arriba: la galería y los cuartos
- **instructores.js**: Textos de los instructores y el muñeco de práctica (motor/instructores.js): prefijo ie. (los nombres en av.nombre_
- **interfaz.js**: Textos de la interfaz de la aventura (prefijo ui.), los dos idiomas juntos.
- **interiores.js**: Textos de los interiores de las casas (prefijo in.) y sus muebles, los dos idiomas.
- **inventario.js**: Textos de la mochila (inventario, prefijo inv.) y de la barra de abajo del HUD (interfaz/barra.js, prefijo bar.), los dos idiomas.
- **jotunn.js**: Textos de Hrímnir, el jötunn de la escarcha (motor/jotunn.js): prefijo jt. (y hd.unico_hrimnir, cr., bs., as., mp.ley_jotunn).
- **juegos-runas.js**: Textos de los juegos de runas de los viajeros (motor/juegos-runas.js): prefijo jr.
- **legendarios.js**: Textos de los poderes de las legendarias (motor/legendarios.js): prefijo lg.
- **libros.js**: Textos de los libros de Eldervald (motor/libros.js, mundo/assets-libros.js): prefijo lb. (y as., mp.ley_libros).
  - la interfaz · la saga de Sigrun Mano de Hierro (cuatro tomos) · libros de oficio · libros de caza · libros de saber
- **materiales.js**: Textos de los materiales de la forja y las vetas (motor/materiales.js, mundo/assets-materiales.js): prefijo mt.
- **mejoras.js**: Textos de las mejoras de movimiento, golpes, viajes y misiones (prefijo mj.), los dos idiomas.
- **norte.js**: Textos del Paso del Guardián y la Antigua tala (prefijo nt., las piezas en as.), los dos idiomas.
- **objetos.js**: Textos de las piezas de equipo y el botín (prefijo ob.), los dos idiomas. Los adjetivos llevan las cuatro formas
  - rarezas · bases · prefijos (adjetivos: m|f|mp|fp) · sufijos · nombres propios de las raras: «Colmillo del Invierno» / «Winter Fang» · las líneas de cada pieza · comparar · casillas, bolsa y acciones
- **pesca.js**: Textos de la pesca (motor/pesca.js, mundo/assets-pesca.js): prefijo pe. (y as., co., mp.ley_pesca).
- **piedras.js**: Textos de las piedras del camino, las piedras del rito, el bosque viejo y las miniaturas del mapa (prefijo pr.), los dos idiomas.
  - assets nuevos (catálogo) · piedras del camino · piedras del rito
- **prologo.js**: Textos del prólogo del mago (prefijo pl.), los dos idiomas.
- **regateo.js**: Textos del regateo (motor/regateo.js): prefijo rg.
- **rpg.js**: Textos de niveles, experiencia y estadísticas (prefijo rp.), los dos idiomas.
- **saga.js**: Textos de la saga de Eromash (motor/saga.js): prefijo sg.
- **santuarios.js**: Textos de los hörgar de los dioses (motor/santuarios.js): prefijo sn. (y as.horgr, mp.ley_dioses)
- **secretos.js**: Textos de los secretos, las runas, los grupos de criaturas y el mapa (prefijos pj. sx. hd. mp.), los dos idiomas.
  - assets nuevos (catálogo) · gente de Eikholt · poderes y progreso · secretos · grupos de criaturas · mapa
- **secundarias.js**: Textos de los encargos, los semijefes, el renombre y las proezas (prefijo sc.), los dos idiomas.
- **sigilo.js**: Textos del sigilo (motor/sigilo.js): prefijo sl.
- **teclas.js**: Textos de las teclas propias (Opciones → Teclas, comun/controles.js e interfaz/opciones.js): prefijo tc.
- **tintes.js**: Textos de los tintes del casco (motor/tintes.js): prefijo ti.
- **vida.js**: textos del bosque vivo (motor/vida.js y mundo/assets-vida.js): prefijo vd. y los nombres de sus assets
- **zonas.js**: Textos de las zonas del generador (prefijo zn.): mazmorras, tierras con islas, el dreki y sus assets, los dos idiomas.

<!-- hasta acá -->
