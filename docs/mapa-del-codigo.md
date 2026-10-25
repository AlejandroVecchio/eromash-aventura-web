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
| Mochila, equipo, bolsa y diario | `interfaz/inventario.js` |
| Mapa grande, minimapa y su leyenda | `interfaz/mapa.js` (`CAT_DE`, `CATS`, `MUESTRA`); las miniaturas en `interfaz/iconos.js` |
| Opciones | `interfaz/opciones.js` (`filas`) |
| Teclas y botones del mando | `comun/controles.js` (`TECLAS`); siempre por acción, nunca la tecla suelta |
| Cámara: acercar, adelantarse, temblor | `motor/juego.js`, sección `cámara` (`actualizarCamara`, `cambiarZoom`) y `VISTA` arriba de todo |
| Cualquier texto que se ve | `textos/<tema>.js`, con `es` y `en` juntos; el prefijo de cada archivo está en su primera línea |

## Cómo se arma un cuadro

`motor/juego.js` corre el bucle (`cuadro`): actualiza a Eromash, la gente, las criaturas y cada sistema (`actualizar`), y después dibuja en este orden (`dibujar`): piso → `fondo` de los sistemas → avisos y marcas → `piso` de los sistemas → todo lo que tiene altura ordenado por su pie (objetos del mundo, gente, criaturas, lo de cada sistema en `objetos` y Eromash; lo alto que se cruza con el claro de Eromash se ve transparente ahí) → silueta de Eromash detrás de lo que lo tapa → `aire` (hojas, lluvia) → niebla → luz → `sobreLuz` (lo que brilla en la oscuridad) → números, rombo de E, haz del objetivo → viñeta y bordes. Al final, el HUD (`actualizarHud`, que solo toca la página cuando algo cambió).

Un sistema nuevo es un objeto en `window.SISTEMAS` con los ganchos que necesite (la lista está en `CLAUDE.md`, «Sistemas»).

## Rendimiento: lo que ya se cuida

- El piso se pinta por trozos de 512 que se guardan (como mucho 3 nuevos por cuadro).
- Los objetos se buscan por baldes (`ELDERVALD.cercanas`), nunca recorriendo el mundo entero; lo pintado en el piso de un tipo se pide con `ELDERVALD.decoDe(id)`.
- Las luces se pintan con dos dibujos hechos una sola vez (`AGUJERO` y `brillo` en `mundo/luz.js`), no con un degradado nuevo por luz.
- La silueta de Eromash redibuja solo lo que de verdad se cruza con él (`bordes` en `motor/juego.js` mide cada asset una vez).
- El claro de Eromash (árboles transparentes a su alrededor, `prepararAura`/`auraAntes`/`auraVolcar` en `motor/juego.js`) no recorta cada árbol: copia el fondo del óvalo una vez por tanda, junta lo que se cruza en una capa y la pasa con una máscara hecha una sola vez; en media la capa va a media resolución y en baja no hay claro.
- El HUD escribe en la página solo cuando un valor cambió (`cambia` en `interfaz/hud.js`); los metros del rastreador se cambian en su lugar.
- Todo efecto caro mira `CALIDAD.nivel`.

<!-- desde acá lo arma herramientas/mapa-del-codigo.cjs -->

## Todos los archivos

Cada archivo con lo que dice su primera línea, sus secciones (para buscarlas: `---------- nombre`) y, en `mundo/`, los assets que dibuja.

### js/comun/ · lo compartido: dibujo, runas, controles y sonido

- **controles.js**: controles (módulo CONTROLES)
  - teclas propias
- **dibujo.js**: herramientas de dibujo (módulo DIB)
- **futhark.js**: las runas del Futhark antiguo (módulo FUTHARK)
- **sonido.js**: sonido (módulo SONIDO)
- **volumen.js**: todo girable: volúmenes que se ven bien desde cualquier lado (módulo VOL)
  - el giro del mundo · colores: cada cara con su tono · el proyector de un objeto · caras · sólidos · en el piso del objeto · partes de un objeto, de atrás hacia adelante · la gente y las criaturas: la vista según la cámara · ayudas para pasar los dibujos viejos

### js/editor/ · el editor de Eldervald (es del hilo «Seguir el editor de Eldervald»)

- **boceto.js**: subir un boceto de mapa (tecla U): un dibujo en papel que se vuelve parte de Eldervald
  - leer la hoja · manchas y líneas · de la hoja al mundo · de lo leído a los cambios del editor · el panel · con IA · con todas las IA a la vez: cada una arma su versión y se eligen una, dos o todas (cada una en su capa) · en el mapa: la hoja apoyada en el piso y lo que se va a hacer
- **capas.js**: las capas del editor (pestaña Capas, L)
  - las pestañas del costado · las capas del mundo: cada una prende o apaga su casilla · las capas propias
- **comandos.js**: la paleta de comandos del editor (Ctrl+K)
- **cuartos.js**: editar los interiores (tecla 9 o «Editar su interior» con una casa elegida)
  - el panel · elegir, mover, poner · dibujar · los planos: nombre a la vista, duplicar, copiar y pegar, casas de varios cuartos · el dibujo del plano: un cuadro por cuarto, las puertas en dorado y los pasadizos en celeste · el generador de casas: texto o controles → un plano nuevo · abrir y cerrar
- **editor.js**: el editor de Eldervald
  - estado · capas propias · lo que sigue: atajos según lo que se está haciendo y lo que se suele hacer después · el lienzo y la cámara · lo que se ve: el mundo con lo agregado y sin lo sacado · de lejos, liviano · elegir una estructura: tamaño, proporciones, espejado y cosas pegadas · los caminos: clic en cada punto, doble clic, Enter o Esc lo termina; el ancho sale del tamaño · el agua: ríos y lagunas · las notas (para Claude: qué hacer en ese lugar) · la lista de objetos · herramientas · el puntero · elegir con un rectángulo (y todos los iguales) · copiar, pegar y duplicar (Ctrl+C, Ctrl+V, Ctrl+D) · marcadores de cámara: Ctrl+Shift+número guarda la vista, Shift+número vuelve · modo foco (Tab): solo el mapa · revisar: avisos de cosas que pueden estar mal antes de subir · borradores con nombre · el plano en el que se trabaja: su nombre a la vista, duplicar, copiar y pegar · minimapa: dónde estás; un clic (o arrastrar) lleva la cámara ahí · arrastrar un objeto de la lista al mapa · la hoja de atajos (?) · ir a un lugar · archivo · capas propias (las usa js/editor/capas.js)
- **historia.js**: la historia en el mapa
- **ia.js**: hablar con una IA adentro del editor
  - qué IA hace cada tarea · el panel · el pedido: qué es el mundo, la zona, qué hay ahí y qué objetos existen · llamar a cada IA · leer lo que contestó: el texto para Alejandro y el JSON con los cambios · «Probar con todas»: el mismo pedido a cada IA con clave, los resultados lado a lado · en el mapa: la zona (celeste) y la vista previa de lo propuesto
- **importar.js**: importar cosas propias: estructuras, pinturas, calcos y texturas (panel Importar, tecla N)
- **menu.js**: la barra de menús del editor (Archivo, Editar, Ver, Herramientas, Crear, Mundo, IA, Ayuda)
  - la barra · los desplegables
- **mundo.js**: regiones, piezas y exportar el mundo
  - regiones · piezas · exportar el mundo entero en JSON
- **npcs.js**: importar gente propia (tecla N)
  - las imágenes: recortar, sacar el fondo liso y achicar · el panel · en el mapa · abrir y cerrar
- **pincel.js**: el pincel (tecla B): rociar, tupir el bosque y abrir claros
- **texturas.js**: el generador de texturas (tecla Y)
  - el panel · con IA · guardar en los assets
- **zonas.js**: las zonas fuera del mapa: generar y retocar mazmorras y tierras con islas (tecla M)
  - los datos: las del juego, con lo guardado encima · el plano: de la zona al lienzo · tierras · dibujar · tocar el plano · el panel · generar desde un texto · en el mapa del editor: cada entrada con su dibujo y su nombre; con Mover se arrastra · abrir y cerrar

### js/eikholt/ · la capital en 3D (es del hilo «Construir la ciudad de Eikholt»)

- **casas.js**: la herramienta de casas de Eikholt (módulo CASAS)
  - una pared · el techo · crear una casa · las cuatro paredes · el techo · porche, cobertizo, leña · choques
- **ciudad.js**: Eikholt en 3D (sistema EIKHOLT)
  - grillas de choques y de superficies · de la ciudad al bosque y vuelta · la gente · armar la escena · la gente · la luz del momento · cámaras · Eromash en la ciudad · lo que se puede hacer cerca · la gente se mueve · pintar las figuras · el humo · entrar y salir · el cuadro · el sistema (en el bosque: detecta cuando Eromash llega a la ciudad)
- **geo.js**: geometría de caras planas (módulo GEO)
  - el armador · materiales compartidos
- **piezas.js**: las piezas de Eikholt en 3D (módulo PIEZAS)
  - luz de la gente · cosas sueltas · el mercado de los toldos · la plaza · cercos, huertas, el campo · los oficios · la naturaleza
- **plano.js**: el plano de Eikholt en 3D (módulo EIKPLANO)
  - el río: entra por el nordeste, baja por el este y rodea el sur · las calles · zonas reservadas (los lugares con nombre) · armar · el piso · la empalizada, el adarve y las atalayas · las cuatro puertas · las doce piedras de la cúpula (dos junto a la Puerta del Norte y dos junto a la del Sur) · el Roble · la plaza · los edificios · las casas de la gente · el bosque de afuera · la cúpula: runas enormes sobre una curva invisible · las celdas a mallas · zonas de cámara · las rutas de la gente (un grafo sobre las calles) · el Roble de Eikholt · la escalera alrededor del tronco y el mirador · la copa · los muebles de una casa que se puede entrar

### js/enemigos/ · el dibujo de las criaturas

- **criaturas-bosque.js**: las criaturas del bosque profundo (se suman a CRIATURAS)
  - Draugr del túmulo · Jabalí de musgo · Cuervo de Hel · Fuego fatuo · Trol de musgo · Oso de zarzal
- **criaturas.js**: las criaturas de Eldervald (módulo CRIATURAS)
  - Lobo del zarzal · Errante de Helheim · Custodio de corteza · Ciervo Hueco (jefe)
- **dreki.js**: el dreki (se suma a CRIATURAS)

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

- **alturas.js**: las alturas (sistema ALTURAS)
  - geometría · moverse · lo de abajo, oscuro y difuso
- **arbol.js**: el árbol de habilidades (sistema ARBOL, pestaña Habilidades de la mochila)
  - las cuentas · los dibujos: la cabeza de cada bestia y cada nodo · la pestaña · los efectos en la pelea
- **arco.js**: el arco (sistema ARCO, tipo de arma "arco")
  - en la mano · dibujo · el sistema
- **armas.js**: los tipos de arma y sus golpes (sistema ARMAS)
  - hachas · a dos manos · el hacha lanzada · el torbellino · el arma en la mano: cómo se lleva cada tipo · el sangrado · las grietas del hachazo · el sistema
- **atributos.js**: los atributos de Eromash (sistema ATRIBUTOS)
  - la pestaña
- **baston.js**: el bastón rúnico (sistema BASTON, tipo de arma "baston")
  - pegar con magia · chispas · el sello · paso de niebla y ola · en la mano · dibujo · el sistema
- **berkano.js**: las piedras de Berkano y los manantiales rúnicos (sistema BERKANO)
  - las piedras · los manantiales · juntar una piedra · el brebaje de Berkano (objeto de la barra de abajo) · Thora y Ása
- **bestiario.js**: el bestiario (sistema BESTIARIO, pestaña de la mochila)
  - lo que sabe · los dibujos (íconos de la mochila) · la pestaña · el sistema
- **botin.js**: el botín y el equipo de Eromash (sistema BOTIN)
  - la bolsa y el equipo · comparar con lo puesto · lo que cae · en el mundo · la mochila · el sistema
- **capital.js**: la vida de Eikholt (sistema CAPITAL)
- **claro.js**: el Claro del Ciervo en el juego (sistema CLARO)
- **combate.js**: combate: criaturas, avisos en el piso y el Ciervo Hueco (módulo COMBATE)
  - avisos en el piso · criaturas · el Ciervo Hueco (EL-05)
- **comercio.js**: el comercio: comprar, vender y recomprar (sistema COMERCIO)
  - precios · lo que venden hoy · comprar, vender, recomprar · la pestaña del mercader · Kolbrun en el bosque · el sistema
- **contratos.js**: los contratos de caza y los trofeos (sistema CONTRATOS)
  - el mundo · la bestia y su escolta · tomar, examinar, cobrar · el poste · la Bolsa: los trofeos · el sistema
- **escudo.js**: el escudo: bloquear, parar y empujar (sistema ESCUDO, acción `bloquear`)
  - recibir · el escudo en el brazo · el sistema
- **este.js**: el este en el juego (sistema ESTE)
- **etapas.js**: los encargos de preparación de las etapas (sistema ETAPAS)
- **exploracion.js**: explorar Eldervald (sistema EXPLORA)
  - los secretos de cada lugar · notar lo escondido · la brújula
- **forja.js**: la forja al ritmo del yunque (sistema FORJA, modo "forja")
  - qué base y cuánto cuesta · los menús · la partitura · el juego · el dibujo (1600 × 900, como los interiores) · el sistema
- **goinn.js**: el sótano de la hospedería y Góinn (sistema GOINN)
  - la pelea · la puerta, la cámara y los portales · lo que se ve en la cámara: los doce trofeos y lo que dejaron los custodios
- **hordas.js**: los grupos de criaturas del bosque (sistema HORDAS)
- **importados.js**: la gente propia del editor (sistema IMPORTADOS)
- **interiores.js**: los interiores (sistema INTERIORES)
  - cómo es cada cuarto · lo cambiado con el editor (pestaña Interiores) · los sótanos · las casas de varios cuartos (planos) · entrar y salir · lo que se hace adentro · caminar adentro · dibujar el cuarto · el cuarto girado (todo girable)
- **juego.js**: el motor de la aventura (módulo JUEGO)
  - estado · la gente · criaturas · utilidades · avisos · ubicar a la gente según la etapa · misiones: recompensas, avisos y pistas · interacciones de las misiones · lo que revela la Lente del Eco · diálogos · cinemáticas cortas · muerte y reaparición · Eromash · lo que se oye: pasos, el viento, los grillos, los cuervos y las fogatas cerca · con qué se puede interactuar ahora · zonas (Eldervald._zonas) · la gente camina y mira · cámara · dibujo · la luz · la silueta de Eromash detrás de las cosas · el claro de Eromash: lo que lo rodea se vuelve transparente · HUD de cada cuadro · menús · bucle · arranque
- **lanza.js**: la lanza (sistema LANZA_ARMA, tipo de arma "lanza")
  - en la mano · dibujo · el sistema
- **martillo.js**: el martillo (sistema MARTILLO, tipo de arma "martillo")
  - quebrar · temblor (el remate) y trueno · el sistema
- **materiales.js**: los materiales de la forja (sistema MATERIALES)
  - tener, dar y gastar · desarmar · la forja · las vetas · la bolsa · el sistema
- **norte.js**: el corredor del norte en el juego (sistema NORTE)
- **poderes.js**: poderes rúnicos, botín y la gente de Eikholt (sistema PODERES)
  - la gente de Eikholt que no está en la historia · recompensas (las usan los secretos y los grupos) · las hierbas de Thora: el primer objeto que se usa desde la barra · lanzar runas · dibujo
- **regateo.js**: el regateo (sistema REGATEO)
  - el estado del día · abrir, pedir, parar · la ventana · el sistema
- **regiones.js**: regiones con nombre (sistema REGIONES)
- **ritos.js**: las piedras viejas (sistema RITOS)
  - armar · aplicar lo guardado · el rito cumplido · empezar cada rito · lectura de las piedras del camino
- **rpg.js**: niveles, experiencia y estadísticas de Eromash (sistema RPG)
  - el nivel de cada criatura · la experiencia · las estadísticas · el HUD: el nivel en el retrato y la barra de experiencia · el número de nivel sobre las criaturas
- **secretos.js**: los secretos de Eldervald (sistema SECRETOS)
  - armar el mundo de secretos · aplicar lo guardado · acciones
- **secundarias.js**: encargos, semijefes, renombre y proezas (sistema SECUNDARIAS)
  - semijefes · encargos · proezas · renombre
- **senda.js**: la senda del Refugio (sistema SENDA)
- **tablon.js**: el tablón de cacería del Puesto (sistema TABLON)
- **vida.js**: el bosque vivo (sistema VIDA)
  - partículas con estado · luces que dejan los eventos · clima del día · los lugares místicos · fauna chica · emisores con estado (brasas, humo, hojas, motas rúnicas…) · campos sin estado (dependen solo de la posición y el tiempo) · el fuego guía · fauna chica: liebres, pinzones, mariposas y bandadas · eventos que mandan los sistemas · capas de dibujo · el sistema
- **zonas.js**: las zonas del generador: mazmorras oscuras y tierras con islas (sistema ZONAS)
  - los generadores (también los usa el editor) · leer un pedido escrito (sin IA) · las tres mazmorras que vienen con el juego · armar cada zona en su lugar fuera del mapa · entrar, salir y pasar · dibujar · el sistema

### js/mundo/ · el bosque, sus objetos (assets), el piso, la luz y los caminos

- **agregados.js**: Lo que se agregó o se sacó del mundo con el editor de Eldervald (editor.html). Este archivo lo escribe el editor
- **assets-berkano.js**: las piedras de Berkano y los manantiales rúnicos (se suman a ASSETS)
  - el manantial rúnico · la piedra de Berkano tirada
  - assets: manantialRunico, piedraBerkano
- **assets-capital.js**: Eikholt según el compendio del 22/10/2026 (se suma a ASSETS)
  - assets: casaNordica, robleGigante, empalizadaDoble, murallaDoble, escaleraMuralla, piedraAncla, runaCupula, puertaNorte, estandarteCiervo, campana, tablonAvisos, carpinteria, curtiembre, munecoPaja, carreta, buey, cerca, muelle, camaHongos, casaGuardia
- **assets-casas.js**: las casas de varios cuartos
  - La puerta de adentro · El paso secreto · El tapiz de la pared · Las tablas flojas
  - assets: puertaInterior, pasoSecreto, tapizPared, tablasFlojas
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
- **assets-este.js**: el este: Aserradero de Orm y Santuario de las Raíces (se suma a ASSETS)
  - assets: ruedaAgua, compuerta, canal, galponSierra, pilaTroncos, tornoRampa, bueyBarro, bancoTaco, lenera, gradaQuilla, escalonesRaices, estela, arbolPortal, restosZarzas, selloPiedra, lomaMirador, cofreZarzas
- **assets-guaridas.js**: las guaridas de los semijefes (se suma a ASSETS)
  - assets: puertaPiedra, bocaCueva, nidoZarzal
- **assets-interiores.js**: los muebles de adentro (interiores)
  - El escritorio rúnico · El hogar de piedra · La cama de pieles · El arcón de la casa · El yunque y la forja de Ása · El estante de hierbas de Thora · El mostrador del Hongo Dorado · El telar · Mesa con banco
  - assets: escritorioRunico, hogarPiedra, camaPieles, arconCasa, forjaAsa, yunque, estanteHierbas, mostrador, barriles, telar, mesaBanco
- **assets-materiales.js**: las vetas del bosque: de donde sale el material de la forja (assets de MATERIALES)
  - la veta de hierro de pantano · el nódulo de ámbar · la vena rúnica
  - assets: vetaHierro, vetaAmbar, vetaRunica
- **assets-norte.js**: el corredor del norte: Paso del Guardián y Antigua tala (se suma a ASSETS)
  - assets: pilarAntiguo, lonaCuadrilla, tornoVigas, tablaPuente, pilaTablones, andamio, posteCruzaron, casetaPuentero, toconMarcado, muroRaices, granTocon, cabanaLenadores
- **assets-piedras.js**: las piedras de Eldervald: las del camino y las del rito
  - formas de piedra · Piedra del camino · Piedra del rito
  - assets: piedraCamino, piedraRito
- **assets-puesto.js**: El Puesto de Eydis imaginado (versión de Alejandro, 22/10/2026; se suma a ASSETS)
  - assets: palisada, portonPuesto, mesaRutas, tableroTablillas, tablonCaza, fogonOlla, mostradorManta, ahumadero, tendedero, perraGrima, piedraVioleta
- **assets-secretos.js**: los secretos de Eldervald: cofres, piedras rúnicas, altares y ruinas
  - Arcón del leñador · Cofre rúnico sellado · Urna del túmulo · Arca enterrada · Piedra del susurro · Altar de runa · Brasero de Skarnholt · Salón quemado de Skarnholt · Entrada del túmulo · Torre del Cuervo · Carro de la caravana · Tótem de campamento · Manzano de Iðunn
  - assets: arconLenador, cofreRunico, urnaTumulo, arcaEnterrada, piedraSusurro, altarRuna, brasero, salonQuemado, tumuloEntrada, torreCuervo, carroCaravana, totemCampamento, manzanoIdunn
- **assets-senda.js**: El carro volcado y el Refugio de las Lindes, versión de Alejandro (22/10/2026; se suma a ASSETS)
  - assets: carroCuadrilla, sacosAbiertos, rastro, posteFarol, mojon, posteTablillas, camilla, cunaPiedra
- **assets-sotanos.js**: los secretos de adentro: alfombras, trampillas y sótanos
  - Alfombra · Trampilla · Escalera de mano · Cajones · Atril con el libro de saber · Estante de rollos · Armero · Tabla suelta · Cofre del sótano · Huesos · Cesto de la despensa · El muro falso del escondite · Sacos · Cántaros del sótano viejo
  - assets: alfombra, trampilla, escaleraMano, cajas, atril, estanteRollos, armero, tablaSuelta, cofreSotano, huesos, cesto, muroFalso, sacos, cantaros
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
  - geografía (Datos.gd) · utilidades de geometría · dónde se puede caminar: una grilla de 20 unidades · los objetos del mundo · el bosque: generado, siempre igual (misma semilla) · orillas vivas, bordes de los claros y postes en los cruces · lo que se agregó o se sacó en el editor (editor.html → js/mundo/agregados.js) · grilla espacial para dibujar y chocar solo lo cercano · choques · el piso, por trozos
- **imagenes.js**: las imágenes propias del editor (módulo IMAGENES)
- **luz.js**: luz, sombra y niebla de Eldervald (módulo LUZ)
- **texturas.js**: las texturas hechas en el editor (TEXTURAS)
  - recetas: cada forma se dibuja nueve veces corrida un cuadro, así el borde de un lado sigue en el otro · imágenes: a los colores del juego, posterizadas y espejadas en cuatro para que no tengan costura · el lienzo de cada textura (se arma una vez por receta o imagen) · los dos assets de cada textura · registrar

### js/personajes/ · Eromash y la gente

- **animacion.js**: cómo se mueve Eromash (módulo ANIMA)
- **gente.js**: la gente de Eldervald (módulo GENTE)
  - los espíritus, como en su hoja: la huldra y el nøkk
- **vikingo.js**: Eromash en cuatro vistas (módulo VIKINGO)

### js/textos/ · todos los textos del juego en los dos idiomas

- **arbol.js**: Textos del árbol de habilidades (motor/arbol.js): prefijo ab.
- **armas.js**: Textos de los tipos de arma y sus golpes (prefijo ar.), los dos idiomas.
- **aventura.js**: Textos propios de la aventura web (interfaz, assets, gente, enemigos), en los dos idiomas.
- **berkano.js**: textos de las piedras de Berkano y los manantiales rúnicos (motor/berkano.js, mundo/assets-berkano.js): prefijo bk.
- **bestiario.js**: Textos del bestiario (motor/bestiario.js): prefijo bs.
- **capital.js**: Textos de la capital rearmada (prefijo cap.), sus piezas nuevas (as.) y la gente de Eikholt (av.nombre_, pj.), los dos idiomas.
- **claro.js**: Textos del Claro del Ciervo (prefijo cl., las piezas en as.), los dos idiomas.
- **comercio.js**: Textos del comercio con Ingrid y Kolbrun (motor/comercio.js, mundo/assets-comercio.js): prefijo cm.
- **contratos.js**: Textos de los contratos de caza y los trofeos (motor/contratos.js, mundo/assets-contratos.js): prefijo ct.
- **editor.js**: Textos del editor de Eldervald (prefijo ed.), los dos idiomas.
  - sección Zonas (tecla M) · importar (tecla N): gente, estructuras, pinturas, calcos y texturas · capas propias (pestaña Capas, L) · la barra de menús · «Probar con todas» (panel IA)
- **eikholt.js**: Textos de Eikholt en 3D (prefijo ek.): el mapa aparte de la capital, sus cámaras, sus lugares y el banco de casas.
  - el banco de casas (aventura/casas.html) · la ciudad en 3D
- **este.js**: Textos del Aserradero de Orm y el Santuario de las Raíces (prefijo es., las piezas en as.), los dos idiomas.
- **etapas.js**: Textos de las etapas EL-0X-N y sus tres encargos (prefijo et., y los objetivos y diálogos nuevos en av.), los dos idiomas.
- **forja.js**: Textos de la forja al ritmo del yunque (motor/forja.js): prefijo fg.
- **goinn.js**: Textos del sótano de la hospedería, el ritual y la pelea con Góinn (prefijo gn.), los dos idiomas.
- **historia.js**: Textos de la historia de Eldervald (guion, misiones, diario y lugares), en los dos idiomas.
- **interfaz.js**: Textos de la interfaz de la aventura (prefijo ui.), los dos idiomas juntos.
- **interiores.js**: Textos de los interiores de las casas (prefijo in.) y sus muebles, los dos idiomas.
- **inventario.js**: Textos de la mochila (inventario, prefijo inv.) y de la barra de abajo del HUD (interfaz/barra.js, prefijo bar.), los dos idiomas.
- **materiales.js**: Textos de los materiales de la forja y las vetas (motor/materiales.js, mundo/assets-materiales.js): prefijo mt.
- **mejoras.js**: Textos de las mejoras de movimiento, golpes, viajes y misiones (prefijo mj.), los dos idiomas.
- **norte.js**: Textos del Paso del Guardián y la Antigua tala (prefijo nt., las piezas en as.), los dos idiomas.
- **objetos.js**: Textos de las piezas de equipo y el botín (prefijo ob.), los dos idiomas. Los adjetivos llevan las cuatro formas
  - rarezas · bases · prefijos (adjetivos: m|f|mp|fp) · sufijos · nombres propios de las raras: «Colmillo del Invierno» / «Winter Fang» · las líneas de cada pieza · comparar · casillas, bolsa y acciones
- **piedras.js**: Textos de las piedras del camino, las piedras del rito, el bosque viejo y las miniaturas del mapa (prefijo pr.), los dos idiomas.
  - assets nuevos (catálogo) · piedras del camino · piedras del rito
- **prologo.js**: Textos del prólogo del mago (prefijo pl.), los dos idiomas.
- **regateo.js**: Textos del regateo (motor/regateo.js): prefijo rg.
- **rpg.js**: Textos de niveles, experiencia y estadísticas (prefijo rp.), los dos idiomas.
- **secretos.js**: Textos de los secretos, las runas, los grupos de criaturas y el mapa (prefijos pj. sx. hd. mp.), los dos idiomas.
  - assets nuevos (catálogo) · gente de Eikholt · poderes y progreso · secretos · grupos de criaturas · mapa
- **secundarias.js**: Textos de los encargos, los semijefes, el renombre y las proezas (prefijo sc.), los dos idiomas.
- **teclas.js**: Textos de las teclas propias (Opciones → Teclas, comun/controles.js e interfaz/opciones.js): prefijo tc.
- **vida.js**: textos del bosque vivo (motor/vida.js y mundo/assets-vida.js): prefijo vd. y los nombres de sus assets
- **zonas.js**: Textos de las zonas del generador (prefijo zn.): mazmorras, tierras con islas, el dreki y sus assets, los dos idiomas.

<!-- hasta acá -->
