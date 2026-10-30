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
// las entidades que pesan mucho más que lo normal (pedido de Alejandro, 30/10/2026): las que tienen láminas o cuadros de
// video que pesan más de PESADA veces la mediana de img/criaturas/. Al armar el juego hay que cuidarlas (que carguen
// recién cuando están cerca y suelten sus cuadros al alejarse); su archivo lleva la marca «⚠ PESADA» y el mapa las lista
const CRIATURAS = path.join(RAIZ, "aventura", "img", "criaturas");
const PESADA = 3;
const pesoDe = (d) => fs.readdirSync(d).reduce((t, f) => {
  const q = path.join(d, f), st = fs.statSync(q);
  return t + (st.isDirectory() ? pesoDe(q) : st.size);
}, 0);
function pesadas() {
  if (!fs.existsSync(CRIATURAS)) return { lista: [], mediana: 0 };
  const todas = fs.readdirSync(CRIATURAS).filter((d) => fs.statSync(path.join(CRIATURAS, d)).isDirectory()).map((d) => ({ d, b: pesoDe(path.join(CRIATURAS, d)) }));
  const orden = todas.map((x) => x.b).sort((a, b) => a - b), mediana = orden[Math.floor(orden.length / 2)] || 0;
  const enemigos = fs.readdirSync(path.join(JS, "enemigos")).filter((f) => f.endsWith(".js"));
  const lista = todas.filter((x) => x.b > mediana * PESADA).sort((a, b) => b.b - a.b).map((x) => {
    const js = enemigos.find((f) => fs.readFileSync(path.join(JS, "enemigos", f), "utf8").includes("img/criaturas/" + x.d + "/"));
    return { ...x, js };
  });
  return { lista, mediana };
}
const mb = (b) => (b / 1048576).toFixed(1).replace(".", ",") + " MB";
function armar() {
  const errores = [];
  let out = [DESDE, "", "## Entidades pesadas", ""];
  const P = pesadas();
  out.push(`Las criaturas cuyas imágenes pesan más de ${PESADA} veces lo normal (la mediana de \`img/criaturas/\` es ${mb(P.mediana)}). Al armar el juego hay que tratarlas con cuidado: que carguen sus cuadros recién cuando están cerca y los suelten al alejarse. Su archivo lleva la marca «⚠ PESADA» arriba.`, "");
  for (const x of P.lista) {
    out.push(`- ⚠ **${x.d}**: ${mb(x.b)}${x.js ? ` (\`js/enemigos/${x.js}\`)` : ""}`);
    if (x.js && !fs.readFileSync(path.join(JS, "enemigos", x.js), "utf8").split("\n").slice(0, 15).some((l) => l.includes("⚠ PESADA")))
      errores.push(`js/enemigos/${x.js} pesa ${mb(x.b)} en imágenes: sumale arriba la línea «// ⚠ PESADA: …» que diga qué pesa y cómo cargarla`);
  }
  if (!P.lista.length) out.push("- Ninguna por ahora.");
  out.push("", "## Todos los archivos", "");
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
