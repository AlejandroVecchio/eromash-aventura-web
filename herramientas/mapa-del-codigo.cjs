// Arma la parte automática de docs/mapa-del-codigo.md: cada archivo de aventura/js con lo que dice su cabecera, sus
// secciones y los assets que dibuja (los comentarios «// ---------- algo ----------»). Así el mapa nunca queda viejo.
//   node herramientas/mapa-del-codigo.cjs            reescribe la parte de abajo del mapa
//   node herramientas/mapa-del-codigo.cjs --revisar  solo avisa (sale con error) si el mapa quedó viejo o si un
//                                                   archivo no tiene cabecera
const fs = require("fs");
const path = require("path");
const RAIZ = path.join(__dirname, "..");
const JS = path.join(RAIZ, "aventura", "js");
const MAPA = path.join(RAIZ, "docs", "mapa-del-codigo.md");
const DESDE = "<!-- desde acá lo arma herramientas/mapa-del-codigo.cjs -->";
const HASTA = "<!-- hasta acá -->";
const CARPETAS = {
  comun: "lo compartido: dibujo, runas, controles y sonido",
  textos: "todos los textos del juego en los dos idiomas",
  mundo: "el bosque, sus objetos (assets), el piso, la luz y los caminos",
  personajes: "Eromash y la gente",
  enemigos: "el dibujo de las criaturas",
  historia: "el guion (igual al de Godot)",
  motor: "el motor y los sistemas que se le enchufan",
  equipo: "las piezas de equipo (bases, rarezas, afijos) y su dibujo",
  interfaz: "HUD, mochila, mapa, opciones y el prólogo del mago",
  ciudad: "Eikholt, la capital en 2.5D (muestra en ciudad.html y dentro del juego por el sistema EIKHOLT)",
};
// js/motor/ tiene muchos archivos: en el mapa van agrupados por tema. Un archivo nuevo de motor/ suma su tema acá
// (los minijuegos `mj-*.js` van solos a Minijuegos); --revisar avisa si falta
const TEMAS_MOTOR = [
  ["El motor y el mundo", ["juego", "combate", "hordas", "poderes", "rpg", "alturas", "zonas", "regiones", "vida", "exploracion", "interiores", "importados"]],
  ["Pelea, armas y habilidades", ["armas", "arco", "lanza", "martillo", "baston", "escudo", "furia", "arbol", "sigilo", "elementos", "atributos", "holmr"]],
  ["Equipo, botín y forja", ["botin", "forja", "materiales", "engarces", "conjuntos", "legendarios", "arcon", "tintes"]],
  ["Oficios, comercio y curación", ["alquimia", "matraz", "cocina", "pesca", "libros", "comercio", "regateo", "frasco", "berkano"]],
  ["Lugares con su sistema", ["capital", "hongo", "herreria", "goinn", "casa", "claro", "este", "norte", "senda", "santuarios", "ritos", "secretos"]],
  ["Peligros y cazas del bosque", ["bandidos", "aranas", "jotunn", "caceria", "encuentros", "contratos", "tablon", "bestiario"]],
  ["Misiones, progreso y maestros", ["secundarias", "etapas", "saga", "instructores"]],
  ["Minijuegos", ["minijuegos", "juegos-runas"]],
];
const temaDe = (f) => {
  const n = f.replace(/\.js$/, "");
  if (n.startsWith("mj-")) return "Minijuegos";
  const t = TEMAS_MOTOR.find((t) => t[1].includes(n));
  return t ? t[0] : null;
};
// los prefijos de las claves de un archivo de textos (`ui.`, `mp.`…), para saber dónde está cada texto
const prefijos = (txt) => [...new Set([...txt.matchAll(/^\s*["']([a-z]+)\.[\w.-]+["']\s*:\s*\{\s*es\s*:/gm)].map((m) => m[1]))];

const limpiar = (l) => l.replace(/^\/\/\s*/, "").replace(/^-+\s*/, "").replace(/\s*-+$/, "").trim();
function archivo(rel) {
  const txt = fs.readFileSync(path.join(JS, rel), "utf8");
  const lineas = txt.split("\n");
  const cab = lineas[0].startsWith("//") ? limpiar(lineas[0]) : null;
  const secciones = [];
  lineas.forEach((l, i) => {
    const m = l.match(/^\s+\/\/ -{6,} (.+?) -{6,}\s*$/);
    if (m && i > 0) secciones.push(m[1]);
  });
  // los assets que registra (las entradas «nombre: { f: …» de su LISTA), para encontrar dónde se dibuja cada uno
  const assets = rel.startsWith("mundo") ? [...txt.matchAll(/^\s+(\w+): \{ f: /gm)].map((m) => m[1]) : [];
  const claves = rel.startsWith("textos") ? prefijos(txt) : [];
  return { rel, cab, secciones, assets, claves };
}
function armar() {
  const errores = [];
  let out = [DESDE, "", "## Todos los archivos", ""];
  out.push("Cada archivo con lo que dice su primera línea, sus secciones (para buscarlas: `---------- nombre`), en `mundo/` los assets que dibuja y en `textos/` los prefijos de sus claves. Los de `motor/` van agrupados por tema.", "");
  const linea = (dir, f) => {
    const a = archivo(path.join(dir, f));
    if (!a.cab) errores.push(`js/${a.rel} no tiene cabecera (la primera línea tiene que decir qué hay)`);
    out.push(`- **${f}**: ${a.cab || "sin cabecera"}`);
    if (a.secciones.length) out.push(`  - ${a.secciones.join(" · ")}`);
    if (a.assets.length) out.push(`  - assets: ${a.assets.join(", ")}`);
    if (a.claves.length) out.push(`  - claves: ${a.claves.map((k) => "`" + k + ".`").join(", ")}`);
  };
  for (const dir of fs.readdirSync(JS).filter((d) => fs.statSync(path.join(JS, d)).isDirectory() && d !== "vendor" && d !== "pr").sort()) {
    out.push(`### js/${dir}/ · ${CARPETAS[dir] || ""}`, "");
    const archivos = fs.readdirSync(path.join(JS, dir)).filter((f) => f.endsWith(".js")).sort();
    if (dir !== "motor") archivos.forEach((f) => linea(dir, f));
    else {
      const sin = archivos.filter((f) => !temaDe(f));
      sin.forEach((f) => errores.push(`js/motor/${f} no tiene tema: sumalo a TEMAS_MOTOR en herramientas/mapa-del-codigo.cjs`));
      for (const tema of TEMAS_MOTOR.map((t) => t[0]).concat(sin.length ? ["Sin tema"] : [])) {
        const de = archivos.filter((f) => (temaDe(f) || "Sin tema") === tema);
        if (!de.length) continue;
        out.push(`#### ${tema}`, "");
        de.forEach((f) => linea(dir, f));
        out.push("");
      }
    }
    out.push("");
  }
  // al revés: cada prefijo de texto y en qué archivos de textos/ está
  const dePrefijo = {};
  for (const f of fs.readdirSync(path.join(JS, "textos")).filter((f) => f.endsWith(".js")).sort())
    for (const k of prefijos(fs.readFileSync(path.join(JS, "textos", f), "utf8"))) (dePrefijo[k] = dePrefijo[k] || []).push(f.replace(/\.js$/, ""));
  out.push("### Cada prefijo de texto y su archivo en js/textos/", "");
  out.push(Object.keys(dePrefijo).sort().map((k) => "`" + k + ".` " + dePrefijo[k].join(", ")).join(" · "), "");
  out.push(HASTA);
  return { texto: out.join("\n"), errores };
}
const { texto, errores } = armar();
const actual = fs.readFileSync(MAPA, "utf8");
const i = actual.indexOf(DESDE),
  j = actual.indexOf(HASTA);
if (i < 0 || j < 0) throw new Error("faltan las marcas en docs/mapa-del-codigo.md");
const nuevo = actual.slice(0, i) + texto + actual.slice(j + HASTA.length);
if (process.argv.includes("--revisar")) {
  if (nuevo !== actual) errores.push("docs/mapa-del-codigo.md quedó viejo: correr node herramientas/mapa-del-codigo.cjs");
  errores.forEach((e) => console.log("✗ " + e));
  if (errores.length) process.exit(1);
  console.log("✓ el mapa del código está al día");
} else {
  fs.writeFileSync(MAPA, nuevo);
  errores.forEach((e) => console.log("✗ " + e));
  console.log("mapa del código actualizado");
}
