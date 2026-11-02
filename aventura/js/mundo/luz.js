// ---------- luz, sombra y niebla de Eldervald (módulo LUZ) ----------
// El día pasa (un día entero cada 16 minutos), el bosque espeso y los túmulos son más oscuros y de noche solo se ve lo
// que alumbra: faroles, braseros, piedras rúnicas despiertas, altares, fuegos fatuos y la lámpara de Eromash.
// Se pinta una capa de oscuridad a media resolución con agujeros donde hay luz, y encima un brillo de color suave.
// Calidad gráfica: alta = capa a 1/2, brillos de color, rayos de sol y niebla · media = capa a 1/3, sin rayos ni
// niebla · baja = un tinte plano sin agujeros (nunca tan oscuro como para no ver).
window.LUZ = (function () {
  "use strict";
  const DIA = 16 * 60; // segundos reales por día
  const capa = document.createElement("canvas"),
    cc = capa.getContext("2d");
  const nivel = () => (window.CALIDAD ? CALIDAD.nivel : "alta");
  let osc = 0.1, // oscuridad actual (se acerca suave al objetivo)
    tono = [8, 12, 26];

  // la hora del día (0..24) a partir del tiempo de juego; la partida empieza a las 9 de la mañana
  const hora = (tiempo) => (9 + (tiempo / DIA) * 24) % 24;
  // cuánta noche hay: 0 de día, 1 en plena noche
  // (la noche cierra a las 20:30 y a las 6 ya clarea: antes a las 6 seguía siendo noche cerrada)
  function noche(h) {
    if (h >= 20.5 || h < 4) return 1;
    if (h >= 18) return (h - 18) / 2.5;
    if (h < 6.4) return 1 - (h - 4) / 2.4;
    return 0;
  }
  // el atardecer y el amanecer tiñen todo de ámbar (de 17 a 20 y de 4:30 a 7:30)
  const ocaso = (h) => Math.max(0, 1 - Math.abs(h - 18.6) / 1.6) + Math.max(0, 1 - Math.abs(h - 6) / 1.4) * 0.8;

  // estado de cada cuadro: oscuridad objetivo según la hora y el lugar (sombra = cuánto tapa el bosque ahí)
  function ambiente(tiempo, sombra, dt) {
    const h = hora(tiempo),
      n = noche(h);
    const objetivo = Math.min(0.9, 0.06 + sombra * 0.34 + n * 0.72);
    osc += (objetivo - osc) * (1 - Math.exp(-dt * 1.5));
    const o = ocaso(h);
    // la sombra del ocaso tira a vino, no a azul
    tono = [Math.round(8 + o * 56), Math.round(12 + o * 6), Math.round(26 + o * 6)];
    // de noche cerrada el tono se va al azul de la luna
    if (n > 0.7) tono = [tono[0], tono[1] + Math.round((n - 0.7) * 20), tono[2] + Math.round((n - 0.7) * 40)];
    return { h, n, o, osc };
  }

  // luces: [{ x, y, r (unidades del mundo), col, f (fuerza 0..1) }]
  function dibujar(c, cw, ch, x0, y0, esc, luces, amb, t) {
    const nv = nivel();
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    // el ámbar del atardecer, por debajo de la oscuridad: tiñe (multiplica) y suma un poco de luz cálida
    if (amb.o > 0.02) {
      c.globalCompositeOperation = "multiply";
      c.fillStyle = `rgba(255,150,96,${(0.62 * amb.o).toFixed(3)})`;
      c.fillRect(0, 0, cw, ch);
      c.globalCompositeOperation = "source-over";
      c.fillStyle = `rgba(255,141,113,${(0.12 * amb.o).toFixed(3)})`;
      c.fillRect(0, 0, cw, ch);
    }
    // rayos de sol que se cuelan entre las copas (de día, solo alta)
    // el color de los rayos sigue la hora (rosado al alba, oro a mediodía, ámbar al caer el sol); de noche, la luna;
    // con lluvia casi no pasan (amb.lluvia lo pone vida.js)
    const ll = amb.lluvia || 0;
    // (con la oscuridad apagada: los rayos rosados del alba sobre la noche azul se veían como rayas violeta)
    if (nv === "alta" && amb.n < 0.6) rayos(c, cw, ch, x0, t, (1 - amb.n / 0.6) * (0.5 + amb.o) * (1 - ll * 0.85) * Math.max(0, 1 - amb.osc * 1.4), colorHora(amb.h));
    else if (nv === "alta" && amb.n >= 0.6 && ll < 0.5) rayos(c, cw, ch, x0, t, ((amb.n - 0.6) / 0.4) * 0.55, "200,242,244");
    if (nv === "baja") {
      const tb = amb.tono || tono;
      c.fillStyle = `rgba(${tb[0]},${tb[1]},${tb[2]},${Math.min(0.42, amb.osc * 0.55)})`;
      c.fillRect(0, 0, cw, ch);
      velo(c, cw, ch, amb);
      c.restore();
      return;
    }
    const k = nv === "alta" ? 0.5 : 0.34;
    const w = Math.ceil(cw * k),
      h = Math.ceil(ch * k);
    if (capa.width !== w || capa.height !== h) {
      capa.width = w;
      capa.height = h;
    }
    cc.globalCompositeOperation = "source-over";
    cc.clearRect(0, 0, w, h);
    const tn = amb.tono || tono; // una zona puede pedir su propio color de oscuridad (las mazmorras, tibio)
    cc.fillStyle = `rgba(${tn[0]},${tn[1]},${tn[2]},${amb.osc})`;
    cc.fillRect(0, 0, w, h);
    // agujeros de luz
    cc.globalCompositeOperation = "destination-out";
    const s = esc * k;
    for (const l of luces) {
      const sx = (l.x - x0) * s,
        sy = (l.y - y0) * s,
        r = l.r * s;
      if (sx < -r || sy < -r || sx > w + r || sy > h + r) continue;
      cc.globalAlpha = Math.min(1, l.f == null ? 1 : l.f);
      cc.drawImage(AGUJERO, sx - r, sy - r * 0.82, r * 2, r * 1.64);
    }
    cc.globalAlpha = 1;
    c.imageSmoothingEnabled = true;
    c.drawImage(capa, 0, 0, cw, ch);
    velo(c, cw, ch, amb);
    // el color de cada luz, sumado (solo alta, y más fuerte cuanto más oscuro)
    if (nv === "alta" && amb.osc > 0.2) {
      c.globalCompositeOperation = "lighter";
      const fuerza = Math.min(1, (amb.osc - 0.2) * 1.6);
      for (const l of luces) {
        if (!l.col) continue;
        const sx = (l.x - x0) * esc,
          sy = (l.y - y0) * esc,
          r = l.r * esc * 0.7;
        if (sx < -r || sy < -r || sx > cw + r || sy > ch + r) continue;
        c.globalAlpha = 0.16 * fuerza * (l.f == null ? 1 : Math.min(1, l.f));
        c.drawImage(brillo(l.col), sx - r, sy - r, r * 2, r * 2);
      }
      c.globalAlpha = 1;
    }
    c.restore();
  }
  // la bruma (amb.bruma, la pone vida.js): un velo gris claro sobre todo, más espeso arriba (lo lejano) que abajo;
  // de noche toma el tono de la oscuridad. Es un solo rectángulo con un degradado hecho una vez: va en toda calidad
  let veloG = null;
  function velo(c, cw, ch, amb) {
    const b = amb.bruma || 0;
    if (b <= 0.02) return;
    if (!veloG || veloG.h !== ch) {
      const g = c.createLinearGradient(0, 0, 0, ch);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.55, "rgba(255,255,255,0.7)");
      g.addColorStop(1, "rgba(255,255,255,0.45)");
      veloG = { g, h: ch };
    }
    const n = amb.n || 0,
      mez = (a, z) => Math.round(a + (z - a) * Math.min(1, n * 1.1));
    c.globalCompositeOperation = "source-over";
    c.globalAlpha = Math.min(0.5, 0.36 * b * (1 - n * 0.45));
    c.fillStyle = `rgb(${mez(200, 60)},${mez(212, 72)},${mez(218, 88)})`;
    c.fillRect(0, 0, cw, ch);
    // y más espesa arriba
    c.globalAlpha = Math.min(0.3, 0.2 * b * (1 - n * 0.6));
    c.fillStyle = veloG.g;
    c.fillRect(0, 0, cw, ch);
    c.globalAlpha = 1;
  }
  // Las luces se pintan con dos dibujos hechos una sola vez (crear un degradado por luz en cada cuadro era lo más caro
  // de la luz): el agujero en la oscuridad (círculo que se apaga hacia afuera, cortado en una elipse de 1 × 0,82) y
  // el brillo de cada color. La fuerza de cada luz va como globalAlpha: da lo mismo que el degradado de antes.
  const LADO = 256;
  // (el degradado es redondo y se aplasta a la elipse: antes se recortaba un círculo con una elipse y arriba y abajo
  // la luz terminaba en un borde duro; y cae suave, sin escalón, hasta 0 justo en el borde)
  const AGUJERO = (() => {
    const cv = document.createElement("canvas");
    cv.width = LADO;
    cv.height = Math.round(LADO * 0.82);
    const g2 = cv.getContext("2d"),
      m = LADO / 2;
    g2.scale(1, cv.height / LADO);
    const g = g2.createRadialGradient(m, m, 0, m, m, m);
    [[0, 1], [0.3, 0.9], [0.5, 0.72], [0.64, 0.52], [0.76, 0.32], [0.86, 0.16], [0.94, 0.05], [1, 0]].forEach(([q, a]) => g.addColorStop(q, "rgba(0,0,0," + a + ")"));
    g2.fillStyle = g;
    g2.fillRect(0, 0, LADO, LADO);
    return cv;
  })();
  const BRILLOS = new Map();
  function brillo(col) {
    let cv = BRILLOS.get(col);
    if (cv) return cv;
    cv = document.createElement("canvas");
    cv.width = cv.height = LADO;
    const g2 = cv.getContext("2d"),
      m = LADO / 2,
      n = parseInt(col.slice(1), 16),
      rgb = `${n >> 16},${(n >> 8) & 255},${n & 255}`;
    const g = g2.createRadialGradient(m, m, 0, m, m, m);
    g.addColorStop(0, `rgba(${rgb},1)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    g2.fillStyle = g;
    g2.fillRect(0, 0, LADO, LADO);
    BRILLOS.set(col, cv);
    return cv;
  }
  // franjas diagonales de luz que se mueven despacio con la cámara (parallax suave)
  function colorHora(h) {
    if (h < 9) return "255,190,170"; // alba
    if (h > 16) return "255,180,120"; // tarde
    return "255,217,138";
  }
  function rayos(c, cw, ch, x0, t, a, rgb = "255,217,138") {
    if (a <= 0.02) return;
    c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 4; i++) {
      const base = (((i * 0.31 + 0.1) * cw - x0 * 0.08 + Math.sin(t * 0.07 + i) * 60) % (cw * 1.3)) - cw * 0.15;
      const ancho = cw * (0.05 + (i % 2) * 0.04);
      const g = c.createLinearGradient(base, 0, base + ancho, 0);
      const al = a * (0.035 + 0.02 * Math.sin(t * 0.3 + i * 2));
      g.addColorStop(0, `rgba(${rgb},0)`);
      g.addColorStop(0.5, `rgba(${rgb},${Math.max(0, al)})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(base, 0);
      c.lineTo(base + ancho, 0);
      c.lineTo(base + ancho - ch * 0.45, ch);
      c.lineTo(base - ch * 0.45, ch);
      c.fill();
    }
    c.globalCompositeOperation = "source-over";
  }
  // niebla baja: bancos que flotan sobre el piso en el mundo (alta: siempre un poco, de noche más)
  const BANCOS = Array.from({ length: 14 }, (_, i) => ({ fx: (i * 0.61) % 1, fy: (i * 0.37) % 1, r: 0.5 + ((i * 0.53) % 1) * 0.6, v: 8 + (i % 5) * 4 }));
  function niebla(c, x0, y0, vw, vh, t, densidad, bruma = 0) {
    if (nivel() !== "alta" || densidad <= 0.02) return;
    const celda = Math.round(1400 - 650 * Math.min(1, bruma)); // con bruma los bancos van más juntos
    c.save();
    const gx0 = Math.floor(x0 / celda) - 1,
      gy0 = Math.floor(y0 / celda) - 1;
    for (let gy = gy0; gy <= gy0 + Math.ceil(vh / celda) + 2; gy++)
      for (let gx = gx0; gx <= gx0 + Math.ceil(vw / celda) + 2; gx++) {
        const b = BANCOS[Math.abs(gx * 7 + gy * 13) % BANCOS.length];
        const x = gx * celda + b.fx * celda + ((t * b.v) % celda) - celda / 2,
          y = gy * celda + b.fy * celda,
          rx = celda * 0.55 * b.r,
          ry = rx * 0.32;
        if (x + rx < x0 || x - rx > x0 + vw || y + ry < y0 || y - ry > y0 + vh) continue;
        const g = c.createRadialGradient(x, y, 0, x, y, rx);
        g.addColorStop(0, `rgba(200,214,220,${0.13 * densidad})`);
        g.addColorStop(1, "rgba(200,214,220,0)");
        c.fillStyle = g;
        c.beginPath();
        c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        c.fill();
      }
    c.restore();
  }
  return { hora, noche, ambiente, dibujar, niebla, DIA };
})();
