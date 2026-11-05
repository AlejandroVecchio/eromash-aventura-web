# Sonidos de la aventura

Todos vienen de la carpeta `juego/audio/` del juego de la arena (repo eromash-juego), sin modificar el archivo: en el juego solo se les cambia volumen, tono, filtro y a veces se toma un tramo. El viento, los grillos, el zumbido de la runa, el aviso grave de las criaturas que no gruñen y el latido se arman en el juego con Web Audio (`js/comun/sonido.js`).

- `pasos/footstep00-09.mp3`, `golpes/knifeSlice.mp3`, `knifeSlice2.mp3`, `chop.mp3`, `cloth1-3.mp3`, `dropLeather.mp3`, `drawKnife1.mp3`, `ui/handleCoins.mp3`, `handleCoins2.mp3`, `doorClose_4.mp3`, `creak1.mp3`, `ui/bookFlip1.ogg`, `bookOpen.ogg`, `metalClick.ogg`: **RPG Audio**, Kenney — https://kenney.nl/assets/rpg-audio — CC0 (`LICENSE-KENNEY-CC0.txt`).
- `pasos/madera-1-5.ogg`, `pasos/piedra-1-3.ogg`, `golpes/impactSoft_heavy_000-002.ogg`: **Impact Sounds 1.0**, Kenney — https://kenney.nl/assets/impact-sounds — CC0.
- `criaturas/grunt_07-09.ogg`, `die_03.ogg`: **80 CC0 creature SFX #2**, rubberduck — https://opengameart.org/content/80-cc0-creture-sfx-2 — CC0.
- `criaturas/hurt_04.ogg`: **80 CC0 creature SFX**, rubberduck — https://opengameart.org/content/80-cc0-creature-sfx — CC0.
- `criaturas/creature_die_01.ogg`, `creature_roar_01.ogg`: **80 CC0 RPG SFX**, rubberduck — https://opengameart.org/content/80-cc0-rpg-sfx — CC0.
- `ui/mision_cumplida.ogg`: `Fanfare.wav` del **Retail Therapy Sample Pack**, Ben Burnes (Abstraction) — https://abstractionmusic.com — CC0 (`LICENCIA-CC0-BEN-BURNES.txt`).
- `arena_crows.ogg`: **Crows singing**, IgnasD — https://opengameart.org/content/crows-singing — CC0.
- `fogata.ogg`: fragmento de **1 Hour of Relaxing fireplace with Crackling Sounds**, Hear_it_use_it — https://freesound.org/people/Hear_it_use_it/sounds/873471/ — **CC BY 4.0**, https://creativecommons.org/licenses/by/4.0/ (tramo de 36 s nivelado y cerrado en bucle, hecho para la arena).

CC0: https://creativecommons.org/publicdomain/zero/1.0/

## Hechos con ElevenLabs (`eleven/`)

Todo lo que está en `aventura/audio/eleven/` (música, ambientes, efectos y voces, 557 tomas) se generó en noviembre de 2026 con **ElevenLabs** (plan Creator, cuenta de Alejandro Vecchio) a partir de los prompts de la lista de sonidos del juego: efectos y ambientes con *Sound Effects* (`eleven_text_to_sound_v2`), música con *Eleven Music* y voces con *Voice Design* + *Text to Speech* (`eleven_multilingual_v2`). Con plan pago el uso comercial está permitido; la música entra en la excepción de «Indie Game» de los Eleven Music Terms (juego con menos de 500.000 USD de ingresos y estudio con menos de 1.000.000 USD el último año fiscal). Hay que declararlo en el cuestionario de contenido generado por IA de Steam.

Los archivos se nivelaron (música −18 LUFS, ambientes −26, interfaz −21, efectos y voces −17, tope de −1 dBTP) y se pasaron a ogg vorbis. El prompt y los créditos de cada toma están en la carpeta del proyecto `sonidos/aventura-2.5d/` (`creditos.csv`, `registro.jsonl`). La lista para el juego la arma `node herramientas/sonidos-lista.cjs`.
