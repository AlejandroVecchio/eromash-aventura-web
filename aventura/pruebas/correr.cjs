// Pruebas de los sistemas de la aventura, en un Chromium sin ventana (Playwright).
// Uso, desde la carpeta raíz del repo:  node aventura/pruebas/correr.cjs  [filtro]  [--captura carpeta]
// Sirve la carpeta raíz, abre index.html?jugar=9 (la ranura de pruebas, no pisa las partidas 1 a 3), espera a que
// arranque la partida, carga cada archivo de pruebas de esta carpeta (los *.js, en orden de nombre) y corre lo que
// sumaron a window.PRUEBAS: { nombre, fn(A, ayuda) } (async). Falla si una prueba tira error o si la página tira un
// error de JavaScript. Requiere: npm i -g playwright (o tenerlo en el proyecto) y Chromium de Playwright.
const http = require("http");
const fs = require("fs");
const path = require("path");
const raiz = path.resolve(__dirname, "../..");
const filtro = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "";
const iCap = process.argv.indexOf("--captura");
const capturas = iCap > 0 ? process.argv[iCap + 1] : null;
const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".ogg": "audio/ogg", ".mp3": "audio/mpeg", ".woff2": "font/woff2", ".json": "application/json" };
const servidor = http.createServer((req, res) => {
  const f = path.join(raiz, decodeURIComponent(req.url.split("?")[0]));
  if (!f.startsWith(raiz) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return res.writeHead(404), res.end();
  res.writeHead(200, { "Content-Type": TIPOS[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
servidor.listen(0, async () => {
  const puerto = servidor.address().port;
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch (e) {
    console.error("Falta Playwright: npm i -g playwright && npx playwright install chromium");
    process.exit(2);
  }
  const nav = await chromium.launch();
  const pag = await nav.newPage({ viewport: { width: 1280, height: 720 } });
  const errores = [];
  pag.on("pageerror", (e) => errores.push(e.message));
  await pag.goto(`http://127.0.0.1:${puerto}/aventura/index.html?jugar=9&lang=es`);
  await pag.waitForFunction(() => window.JUEGO && JUEGO.J.modo === "juego" && JUEGO.A, null, { timeout: 30000 });
  const archivos = fs.readdirSync(__dirname).filter((f) => f.endsWith(".js")).sort();
  for (const f of archivos) await pag.addScriptTag({ content: fs.readFileSync(path.join(__dirname, f), "utf8") });
  const res = await pag.evaluate(async ({ filtro }) => {
    const out = [];
    const ayuda = {
      esperar: (s) => new Promise((r) => setTimeout(r, s * 1000)),
      igual: (a, b, m) => { if (a !== b) throw new Error((m || "") + " esperaba " + JSON.stringify(b) + " y dio " + JSON.stringify(a)); },
      si: (v, m) => { if (!v) throw new Error(m || "falló"); },
    };
    for (const p of window.PRUEBAS || []) {
      if (filtro && !p.nombre.includes(filtro)) continue;
      try {
        await p.fn(JUEGO.A, ayuda);
        out.push({ nombre: p.nombre, ok: true });
      } catch (e) {
        out.push({ nombre: p.nombre, ok: false, error: String((e && e.stack) || e) });
      }
    }
    return out;
  }, { filtro });
  if (capturas) {
    fs.mkdirSync(capturas, { recursive: true });
    await pag.screenshot({ path: path.join(capturas, "final.png") });
  }
  let mal = 0;
  for (const r of res) {
    console.log((r.ok ? "  ok  " : "  MAL ") + r.nombre + (r.ok ? "" : "\n       " + r.error));
    if (!r.ok) mal++;
  }
  for (const e of errores) console.log("  ERROR de la página: " + e), mal++;
  console.log(`${res.filter((r) => r.ok).length} de ${res.length} pruebas bien${errores.length ? " · " + errores.length + " errores de la página" : ""}`);
  await nav.close();
  servidor.close();
  process.exit(mal ? 1 : 0);
});
