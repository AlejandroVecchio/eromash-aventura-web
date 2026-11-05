// Arma aventura/js/comun/sonidos-lista.js con los sonidos de aventura/audio/eleven/ (los de ElevenLabs): una clave
// "carpeta/nombre" por sonido y cuántas tomas tiene (nombre-1.ogg, nombre-2.ogg…). Correrlo al sumar o sacar un sonido.
// node herramientas/sonidos-lista.cjs [--revisar]
const fs = require("fs");
const path = require("path");
const RAIZ = path.join(__dirname, "..", "aventura", "audio", "eleven");
const SALIDA = path.join(__dirname, "..", "aventura", "js", "comun", "sonidos-lista.js");
const lista = {};
for (const carpeta of fs.readdirSync(RAIZ).sort()) {
  const dir = path.join(RAIZ, carpeta);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir).sort()) {
    if (!f.endsWith(".ogg")) continue;
    const base = f.slice(0, -4);
    const m = base.match(/^(.*)-(\d+)$/);
    const clave = carpeta + "/" + (m ? m[1] : base);
    (lista[clave] = lista[clave] || []).push(base);
  }
}
let txt = "// Los sonidos de ElevenLabs que hay en audio/eleven/ (lo arma herramientas/sonidos-lista.cjs: no se edita a mano).\n";
txt += "// Cada clave es carpeta/nombre y trae sus tomas; SONIDO.tocar(clave) elige una al azar.\n";
txt += "window.SONIDOS_LISTA = {\n";
for (const k of Object.keys(lista).sort()) txt += `  ${JSON.stringify(k)}: ${JSON.stringify(lista[k])},\n`;
txt += "};\n";
if (process.argv.includes("--revisar")) {
  const viejo = fs.existsSync(SALIDA) ? fs.readFileSync(SALIDA, "utf8") : "";
  if (viejo !== txt) {
    console.error("sonidos-lista.js quedó viejo: correr node herramientas/sonidos-lista.cjs");
    process.exit(1);
  }
  console.log("sonidos-lista.js al día");
} else {
  fs.writeFileSync(SALIDA, txt);
  console.log(Object.keys(lista).length, "sonidos,", Object.values(lista).reduce((a, b) => a + b.length, 0), "tomas");
}
