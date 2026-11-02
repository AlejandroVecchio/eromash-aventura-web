// Graba tomas de la aventura para los videos de redes (modo cámara, aventura/js/motor/video.js), en un Chromium sin ventana.
// Uso, desde la carpeta raíz del repo:
//   node herramientas/grabar.cjs --salida tomas/lobos.mp4 --segundos 12 --params "escena=grupo:lobos&piloto=1&hora=20"
// Opciones: --salida archivo.mp4 --segundos N (largo de la toma), --params "a=1&b=2" (se suman a
// index.html?jugar=9&video=1), --horizontal (1920 × 1080 en vez de 1080 × 1920), --espera N (segundos que se tiran
// antes de grabar, por defecto 1), --cuadros N (por segundo, 30), --foto (además una foto a la mitad, al lado del video).
// El tiempo del juego lo maneja la grabadora (requestAnimationFrame y performance.now de mentira): cada cuadro avanza
// justo 1/30 s y se saca una foto, así la toma sale fluida aunque la máquina dibuje lento. Necesita Playwright con
// Chromium y ffmpeg.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const raiz = path.resolve(__dirname, "..");
const arg = (n, d) => {
  const i = process.argv.indexOf("--" + n);
  return i > 0 ? process.argv[i + 1] : d;
};
const tiene = (n) => process.argv.includes("--" + n);
const salida = path.resolve(arg("salida", "tomas/toma.mp4"));
const segundos = Number(arg("segundos", 10));
const espera = Number(arg("espera", 1));
const fps = Number(arg("cuadros", 30));
const params = arg("params", "");
const horizontal = tiene("horizontal");
const vista = horizontal ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 };
const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".ogg": "audio/ogg", ".mp3": "audio/mpeg", ".woff2": "font/woff2", ".json": "application/json", ".jpg": "image/jpeg", ".webp": "image/webp" };
const servidor = http.createServer((req, res) => {
  const f = path.join(raiz, decodeURIComponent(req.url.split("?")[0]));
  if (!f.startsWith(raiz) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return res.writeHead(404), res.end();
  res.writeHead(200, { "Content-Type": TIPOS[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
servidor.listen(0, async () => {
  const puerto = servidor.address().port;
  const { chromium } = require("playwright");
  const nav = await chromium.launch();
  const carpeta = path.dirname(salida);
  fs.mkdirSync(carpeta, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(carpeta, ".grabando-"));
  // la ventana tiene el tamaño del video: el juego encuadra el mismo pedazo de mundo a cualquier tamaño
  const pag = await nav.newPage({ viewport: vista });
  const errores = [];
  pag.on("pageerror", (e) => errores.push(e.message));
  // el reloj de mentira: el juego solo avanza cuando la grabadora llama a __paso(ms)
  await pag.addInitScript(() => {
    const vt = { t: 0, cola: [], n: 0 };
    const real = Date.now();
    performance.now = () => vt.t;
    Date.now = () => real + vt.t;
    window.requestAnimationFrame = (f) => (vt.cola.push(f), ++vt.n);
    window.cancelAnimationFrame = () => {};
    window.__paso = (ms) => {
      vt.t += ms;
      const c = vt.cola;
      vt.cola = [];
      c.forEach((f) => f(vt.t));
    };
  });
  const url = `http://127.0.0.1:${puerto}/aventura/index.html?jugar=9&video=1&lang=es${params ? "&" + params : ""}`;
  await pag.goto(url);
  const ms = 1000 / fps;
  // mientras carga se avanza a cuadros sin fotos, hasta que la escena está armada y pasó la espera
  for (let i = 0; i < 3000; i++) {
    const ok = await pag.evaluate((ms) => (window.__paso(ms), window.JUEGO && JUEGO.J.modo === "juego" && window.VIDEO && VIDEO.listo()), ms);
    if (ok) break;
    if (i % 30 === 29) await pag.waitForTimeout(50); // deja cargar imágenes y sonidos de verdad
  }
  for (let i = 0; i < espera * fps; i++) await pag.evaluate((ms) => window.__paso(ms), ms);
  const total = Math.round(segundos * fps);
  for (let i = 0; i < total; i++) {
    await pag.evaluate((ms) => window.__paso(ms), ms);
    await pag.screenshot({ path: path.join(tmp, String(i).padStart(5, "0") + ".jpg"), type: "jpeg", quality: 92 });
    if (i === total >> 1 && tiene("foto")) await pag.screenshot({ path: salida.replace(/\.\w+$/, ".png") });
  }
  await nav.close();
  servidor.close();
  if (errores.length) console.warn("Errores de la página:\n  " + errores.join("\n  "));
  // mp4 h264 sin sonido: la música y la voz van en la edición
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", path.join(tmp, "%05d.jpg"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-an", salida]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("Toma lista: " + salida);
});
