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
  function noche(h) {
    if (h >= 20 || h < 4.5) return 1;
    if (h >= 17.5) return (h - 17.5) / 2.5;
    if (h < 7) return 1 - (h - 4.5) / 2.5;
    return 0;
  }
  // el atardecer y el amanecer tiñen todo de ámbar
  const ocaso = (h) => Math.max(0, 1 - Math.abs(h - 18.4) / 1.3) + Math.max(0, 1 - Math.abs(h - 5.8) / 1.0) * 0.6;

  // estado de cada cuadro: oscuridad objetivo según la hora y el lugar (sombra = cuánto tapa el bosque ahí)
  function ambiente(tiempo, sombra, dt) {
    const h = hora(tiempo),
      n = noche(h);
    const objetivo = Math.min(0.9, 0.06 + sombra * 0.34 + n * 0.72);
    osc += (objetivo - osc) * (1 - Math.exp(-dt * 1.5));
    const o = ocaso(h);
    tono = [Math.round(8 + o * 40), Math.round(12 + o * 10), Math.round(26 - o * 10)];
    // de noche cerrada el tono se va al azul de la luna
    if (n > 0.7) tono = [tono[0], tono[1] + Math.round((n - 0.7) * 20), tono[2] + Math.round((n - 0.7) * 40)];
    return { h, n, o, osc };
  }

  let gradCache = null;
  // luces: [{ x, y, r (unidades del mundo), col, f (fuerza 0..1) }]
  function dibujar(c, cw, ch, x0, y0, esc, luces, amb, t) {
    const nv = nivel();
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    // el ámbar del atardecer, por debajo de la oscuridad
    if (amb.o > 0.02) {
      c.globalCompositeOperation = "source-over";
      c.fillStyle = `rgba(255,141,113,${0.1 * amb.o})`;
      c.fillRect(0, 0, cw, ch);
    }
    // rayos de sol que se cuelan entre las copas (de día, solo alta)
    // el color de los rayos sigue la hora (rosado al alba, oro a mediodía, ámbar al caer el sol); de noche, la luna;
    // con lluvia casi no pasan (amb.lluvia lo pone vida.js)
    const ll = amb.lluvia || 0;
    if (nv === "alta" && amb.n < 0.6) rayos(c, cw, ch, x0, t, (1 - amb.n / 0.6) * (0.5 + amb.o) * (1 - ll * 0.85), colorHora(amb.h));
    else if (nv === "alta" && amb.n >= 0.6 && ll < 0.5) rayos(c, cw, ch, x0, t, ((amb.n - 0.6) / 0.4) * 0.55, "200,242,244");
    if (nv === "baja") {
      c.fillStyle = `rgba(${tono[0]},${tono[1]},${tono[2]},${Math.min(0.42, amb.osc * 0.55)})`;
      c.fillRect(0, 0, cw, ch);
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
    cc.fillStyle = `rgba(${tono[0]},${tono[1]},${tono[2]},${amb.osc})`;
    cc.fillRect(0, 0, w, h);
    // agujeros de luz
    cc.globalCompositeOperation = "destination-out";
    const s = esc * k;
    for (const l of luces) {
      const sx = (l.x - x0) * s,
        sy = (l.y - y0) * s,
        r = l.r * s;
      if (sx < -r || sy < -r || sx > w + r || sy > h + r) continue;
      const g = cc.createRadialGradient(sx, sy, 0, sx, sy, r);
      const f = Math.min(1, l.f == null ? 1 : l.f);
      g.addColorStop(0, `rgba(0,0,0,${f})`);
      g.addColorStop(0.45, `rgba(0,0,0,${f * 0.75})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      cc.fillStyle = g;
      cc.beginPath();
      cc.ellipse(sx, sy, r, r * 0.82, 0, 0, Math.PI * 2);
      cc.fill();
    }
    c.imageSmoothingEnabled = true;
    c.drawImage(capa, 0, 0, cw, ch);
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
        const g = c.createRadialGradient(sx, sy, 0, sx, sy, r);
        g.addColorStop(0, hexA(l.col, 0.16 * fuerza * (l.f == null ? 1 : Math.min(1, l.f))));
        g.addColorStop(1, hexA(l.col, 0));
        c.fillStyle = g;
        c.fillRect(sx - r, sy - r, r * 2, r * 2);
      }
    }
    c.restore();
  }
  const hexA = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a.toFixed(3)})`;
  };
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
  function niebla(c, x0, y0, vw, vh, t, densidad) {
    if (nivel() !== "alta" || densidad <= 0.02) return;
    const celda = 1400;
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
