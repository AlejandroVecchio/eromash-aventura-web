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
  interfaz: "HUD, mochila, mapa, opciones y el prólogo del mago",
  eikholt: "la capital en 3D (es del hilo «Construir la ciudad de Eikholt»)",
  editor: "el editor de Eldervald (es del hilo «Seguir el editor de Eldervald»)",
};

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
  return { rel, cab, secciones, assets };
}
function armar() {
  const errores = [];
  let out = [DESDE, "", "## Todos los archivos", ""];
  out.push("Cada archivo con lo que dice su primera línea, sus secciones (para buscarlas: `---------- nombre`) y, en `mundo/`, los assets que dibuja.", "");
  for (const dir of fs.readdirSync(JS).filter((d) => fs.statSync(path.join(JS, d)).isDirectory() && d !== "vendor" && d !== "pr").sort()) {
    out.push(`### js/${dir}/ · ${CARPETAS[dir] || ""}`, "");
    for (const f of fs.readdirSync(path.join(JS, dir)).filter((f) => f.endsWith(".js")).sort()) {
      const a = archivo(path.join(dir, f));
      if (!a.cab) errores.push(`js/${a.rel} no tiene cabecera (la primera línea tiene que decir qué hay)`);
      out.push(`- **${f}**: ${a.cab || "sin cabecera"}`);
      if (a.secciones.length) out.push(`  - ${a.secciones.join(" · ")}`);
      if (a.assets.length) out.push(`  - assets: ${a.assets.join(", ")}`);
    }
    out.push("");
  }
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
